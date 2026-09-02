# -*- coding: utf-8 -*-
"""Sentinel-2 → 게임 격자 분류 — 지수 계산·피복(Phase 2)·방파제 검출(Phase 1).

사용법:  py tools/classify_raster.py <region> [--align-only]
입력:    pixelazed/_rastercache/<region>/s2_<day>.tif + 사이드카 meta (fetch_region_raster.py)
출력:    pixelazed/<region>/landcover.png   (1px=1타일 검수용 컬러맵)
         pixelazed/<region>/landcover.txt   (라벨 그리드 — build_osm_tilemap 병합 패스 입력)
         pixelazed/<region>/raster_meta.json
         pixelazed/<region>/align_check.png (좌표 정합 검수 — terrain 물 vs 래스터 물)

라벨 문자 (landcover.txt):
  '~' 바다  'i' 내수면(병합 시 '~')  'b' 방파제 후보  ',' 식생  's' 모래  'r' 포장·나지
  '.' 미분류 육지  ' ' nodata

설계 (RASTER_UPLIFT_SPEC):
- §1-1 역방향 샘플링 — 게임 타일 중심 → (등장방형 역변환) lat/lon → pyproj UTM → 픽셀 인덱스.
  영상을 warp 하지 않는다. 지수는 픽셀 단위 점함수라 "10m 분류 후 NEAREST 업샘플"과 동치.
- §3 Phase 1 — NDWI 물 / B08 밝은 구조물 / 선형성(주축 PCA 근사) / 육지 접속(detached) /
  폭 2타일 클로징. scipy 미사용 — 성분 라벨링은 후보 한정 BFS(후보 수천 타일 규모).
- §4 Phase 2 — NDVI 식생 / 모래(B04) / 포장·나지 / 내수면(바다 flood 미연결).
- 임계값은 regions_config.raster 딕셔너리 — 미지정 키는 아래 DEFAULTS.
"""
import json
import math
import sys
from collections import deque
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
from regions_config import REGIONS

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'pixelazed' / '_rastercache'
TILE_M = 5.0                      # build_osm_tilemap.TILE_M 과 동일해야 한다

DEFAULTS = dict(tau_water=0.15, tau_nir=0.18, ndvi_veg=0.35, ndvi_bare=0.15,
                linearity_min=3.0, tau_sand_red=0.22, sand_warm=0.06, bright_lo=0.06, bright_hi=0.40)

PALETTE = {                       # 검수용 컬러맵 (terrain.png 팔레트와 톤 정렬)
    '~': (59, 111, 176), 'i': (86, 140, 190), 'b': (240, 120, 40),
    ',': (109, 163, 77), 's': (232, 217, 160), 'r': (150, 150, 150),
    '.': (90, 80, 70), ' ': (0, 0, 0),
}


def load_scene(region):
    d = CACHE / region
    metas = sorted(d.glob('s2_*_meta.json'))
    if not metas:
        sys.exit(f'[err] {d} 에 장면 없음 — 먼저 py tools/fetch_region_raster.py {region}')
    meta = json.loads(metas[-1].read_text(encoding='utf-8'))
    import tifffile
    arr = tifffile.imread(d / f"s2_{meta['scene'].replace('-', '')}.tif")  # (H, W, 6) float32
    if arr.ndim == 2:
        arr = arr[:, :, None]
    return arr, meta


def game_grid(cfg):
    s, w, n, e = cfg['bbox']
    m_lat = 111132.0
    m_lon = 111320.0 * math.cos(math.radians((s + n) / 2))
    W = int(round((e - w) * m_lon / TILE_M))
    H = int(round((n - s) * m_lat / TILE_M))
    return W, H, m_lon, m_lat


def sample_bands(cfg, arr, meta):
    """역방향 샘플링 — 게임 격자(H,W)로 밴드 6장을 얹는다."""
    s, w, n, e = cfg['bbox']
    W, H, m_lon, m_lat = game_grid(cfg)
    tx = np.arange(W) + 0.5
    ty = np.arange(H) + 0.5
    lon = w + tx * TILE_M / m_lon                 # (W,)
    lat = n - ty * TILE_M / m_lat                 # (H,)
    from pyproj import Transformer
    tf = Transformer.from_crs('EPSG:4326', meta['crs'], always_xy=True)
    LON, LAT = np.meshgrid(lon, lat)              # (H, W)
    X, Y = tf.transform(LON, LAT)
    ix = np.clip(((X - meta['minx']) / meta['resx']).astype(np.int32), 0, meta['width'] - 1)
    iy = np.clip(((meta['maxy'] - Y) / meta['resy']).astype(np.int32), 0, meta['height'] - 1)
    return arr[iy, ix, :], W, H                   # (H, W, 6)


def flood(mask, seeds):
    """프론티어 확산 flood — mask 안에서 seeds 로부터 연결된 영역."""
    reach = np.zeros_like(mask, dtype=bool)
    reach |= seeds & mask
    while True:
        grow = reach.copy()
        grow[1:, :] |= reach[:-1, :]
        grow[:-1, :] |= reach[1:, :]
        grow[:, 1:] |= reach[:, :-1]
        grow[:, :-1] |= reach[:, 1:]
        grow &= mask
        if (grow == reach).all():
            return reach
        reach = grow


def dilate(mask, n=1):
    out = mask.copy()
    for _ in range(n):
        m = out.copy()
        m[1:, :] |= out[:-1, :]; m[:-1, :] |= out[1:, :]
        m[:, 1:] |= out[:, :-1]; m[:, :-1] |= out[:, 1:]
        out = m
    return out


def erode(mask, n=1):
    return ~dilate(~mask, n)


def components(mask):
    """후보 한정 BFS 성분 라벨링 (scipy 없이 — 후보 수천 타일 규모 전제)."""
    H, W = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    comps = []
    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)]); seen[y0, x0] = True
        cells = []
        while q:
            y, x = q.popleft(); cells.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        comps.append(cells)
    return comps


def linearity(cells):
    """길이/폭 근사 — 주축 PCA: 길이 = 주축 span, 폭 = 면적/길이."""
    pts = np.array(cells, dtype=np.float64)
    if len(pts) < 4:
        return 0.0, 0.0
    c = pts - pts.mean(axis=0)
    cov = c.T @ c / len(c)
    evals, evecs = np.linalg.eigh(cov)
    axis = evecs[:, -1]
    span = c @ axis
    length = span.max() - span.min() + 1
    width = len(pts) / max(length, 1)
    return length / max(width, 1e-6), length


def sea_edge_seeds(W, H, edges):
    seeds = np.zeros((H, W), dtype=bool)
    if 'N' in edges: seeds[0, :] = True
    if 'S' in edges: seeds[-1, :] = True
    if 'W' in edges: seeds[:, 0] = True
    if 'E' in edges: seeds[:, -1] = True
    return seeds


def main(region, align_only=False):
    cfg = REGIONS.get(region)
    if not cfg:
        sys.exit(f'[err] 미등록 지역: {region}')
    P = dict(DEFAULTS); P.update(cfg.get('raster', {}))
    arr, meta = load_scene(region)
    bands, W, H = sample_bands(cfg, arr, meta)
    B02, B03, B04, B08, B11, DM = [bands[:, :, i] for i in range(6)]
    nodata = DM < 0.5
    print(f'[sample] 게임 격자 {W}x{H} — nodata {nodata.mean():.2%}')

    eps = 1e-6
    NDWI = (B03 - B08) / (B03 + B08 + eps)
    NDVI = (B08 - B04) / (B08 + B04 + eps)
    water = (NDWI > P['tau_water']) & ~nodata

    # 바다 = seaEdges 시드에서 연결된 물 (build_osm_tilemap 과 동일 규약)
    sea = flood(water, sea_edge_seeds(W, H, cfg['seaEdges']))
    inland = water & ~sea

    # ── 좌표 정합 검수 (§9 step 2 — 최우선 관문) ─────────────────────────
    terrain_path = ROOT / 'pixelazed' / region / 'terrain.txt'
    if terrain_path.exists():
        tg = [line.rstrip(b'\r') for line in terrain_path.read_bytes().split(b'\n')
              if line.rstrip(b'\r')]  # CRLF 방어 — git autocrlf 로 \r 이 붙을 수 있다
        t_water = np.array([[ch == 0x7e for ch in row] for row in tg], dtype=bool)  # '~'
        if t_water.shape == (H, W):
            both = t_water & water
            agree = (t_water == water) | nodata
            print(f'[align] 물 일치율(전 타일) = {agree.mean():.2%} · '
                  f'terrain 물 {t_water.mean():.2%} vs 래스터 물 {water.mean():.2%}')
            # 검수 이미지: 회색 = 일치 육지 / 파랑 = 일치 물 / 빨강 = 래스터만 물 / 노랑 = terrain만 물
            img = np.zeros((H, W, 3), dtype=np.uint8)
            img[~t_water & ~water] = (70, 66, 60)
            img[both] = (52, 96, 160)
            img[water & ~t_water] = (230, 60, 50)
            img[t_water & ~water] = (240, 200, 60)
            img[nodata] = (0, 0, 0)
            _save_png(img, ROOT / 'pixelazed' / region / 'align_check.png')
            print(f'[align] align_check.png 저장 (빨강 = 래스터만 물 / 노랑 = terrain만 물)')
        else:
            print(f'[warn] terrain {len(tg)}행 vs 격자 {H} — 정합 검수 생략')
    if align_only:
        return

    # ── Phase 2 — 피복 분류 (§4) ─────────────────────────────────────────
    bright = (B02 + B03 + B04) / 3
    near_sea = dilate(sea, 8)
    veg = (NDVI > P['ndvi_veg']) & ~water & ~nodata
    #  실측(2026-09-02): 모래 B04 p25=0.290·warm 0.149 vs 콘크리트 0.105·0.015 — 항만 안벽 과검출 차단
    sand = ((NDVI < 0.2) & (B04 > P['tau_sand_red']) & ((B04 - B02) > P['sand_warm'])
            & near_sea & ~water & ~nodata)
    bare = ((NDVI < P['ndvi_bare']) & (bright > P['bright_lo']) & (bright < P['bright_hi'])
            & ~near_sea & ~water & ~nodata)

    # ── Phase 1 — 방파제 검출 (§3, 개정: diff 검증·정밀화용 후보) ────────
    # 실측 교훈 2건 (2026-09-02):
    #  ① "고립 육지" 판정 — 방파제는 뿌리가 육지라 육지 본체 flood 에 흡수 → 0건.
    #  ② "bright_struct 성분 + 경계 바다 비율" — 방파제가 도심 밝은 픽셀(26만 타일)과
    #     한 성분으로 이어져 경계가 육지 → 0건.
    # 확정 방식: **103차 추론과 동일한 "얇은 런" 정의를 위성 물 마스크 위에 적용** —
    # 양끝이 바다인 비바다 런(가로/세로, 길이 ≤ run_max)이 방파제 단면이다.
    # 같은 정의·다른 물 마스크이므로 "위성 ↔ 추론 diff"(개정안 §2)와 정확히 비교된다.
    run_max = int(P.get('run_max', 10))             # 103차와 동일 — 50m
    thin = np.zeros((H, W), dtype=bool)
    for y in range(H):                              # 가로 런
        row = sea[y]; x = 0
        while x < W:
            if row[x]:
                x += 1; continue
            x0 = x
            while x < W and not row[x]:
                x += 1
            if x0 > 0 and x < W and (x - x0) <= run_max:
                thin[y, x0:x] = True
    seaT = sea.T
    thinT = thin.T
    for x in range(W):                              # 세로 런
        col = seaT[x]; y = 0
        while y < H:
            if col[y]:
                y += 1; continue
            y0 = y
            while y < H and not col[y]:
                y += 1
            if y0 > 0 and y < H and (y - y0) <= run_max:
                thinT[x, y0:y] = True
    thin &= ~nodata
    land = ~water & ~nodata
    edge_land = np.zeros((H, W), dtype=bool)
    edge_land[0, :] = edge_land[-1, :] = True
    edge_land[:, 0] = edge_land[:, -1] = True
    mainland = flood(land, edge_land & land) & ~thin
    b_mask = np.zeros((H, W), dtype=bool)
    b_report = []
    for cells in components(thin):
        if len(cells) < 8:
            continue                                # 소형 여·바위 — 후보 제외 (리포트도 생략)
        cy = np.array([c[0] for c in cells]); cx = np.array([c[1] for c in cells])
        ndvi_mean = float(NDVI[cy, cx].mean())
        lin, length = linearity(cells)
        # 식생 덮인 성분 = 섬/여 (조도류) — 인공 구조물 아님
        kind = 'b' if ndvi_mean < 0.25 else 'islet'
        comp_grid = np.zeros((H, W), dtype=bool)
        comp_grid[cy, cx] = True
        near_main = bool((dilate(comp_grid, 2) & mainland).any())
        if kind == 'b':
            b_mask |= comp_grid
        b_report.append(dict(size=len(cells), linearity=round(lin, 2),
                             ndvi=round(ndvi_mean, 2), kind=kind,
                             detached=not near_main,
                             at=[int(cx.mean()), int(cy.mean())]))
    # 폭 최소 2타일 보장 (클로징)
    if b_mask.any():
        b_mask = erode(dilate(b_mask, 1), 1) | b_mask
    n_b = int(b_mask.sum())
    print(f'[phase1] 고립 성분 {len(b_report)}개 — b 후보 {sum(1 for r in b_report if r["kind"] == "b")}성분 '
          f'{n_b}타일 (detached {sum(1 for r in b_report if r["kind"] == "b" and r["detached"])})')

    # ── 라벨 합성 (우선순위: nodata < 미분류 < 피복 < 물 < b) ────────────
    label = np.full((H, W), ord('.'), dtype=np.uint8)
    label[veg] = ord(',')
    label[bare] = ord('r')
    label[sand] = ord('s')
    label[inland] = ord('i')
    label[sea] = ord('~')
    label[b_mask] = ord('b')
    label[nodata] = ord(' ')

    out = ROOT / 'pixelazed' / region
    out.mkdir(parents=True, exist_ok=True)
    (out / 'landcover.txt').write_bytes(b'\n'.join(bytes(r) for r in label))
    img = np.zeros((H, W, 3), dtype=np.uint8)
    for ch, rgb in PALETTE.items():
        img[label == ord(ch)] = rgb
    _save_png(img, out / 'landcover.png')
    stats = {ch: int((label == ord(ch)).sum()) for ch in PALETTE}
    (out / 'raster_meta.json').write_text(json.dumps(dict(
        region=region, scene=meta['scene'], params=P, grid=[W, H],
        stats=stats, components=b_report,
        source=meta.get('source', ''),
    ), ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'[ok] landcover.png/.txt + raster_meta.json — 분포 {stats}')


def _save_png(rgb, path):
    try:
        from PIL import Image
        Image.fromarray(rgb).save(path)
    except ImportError:
        import zlib, struct
        h, w = rgb.shape[:2]
        raw = b''.join(b'\x00' + rgb[y].tobytes() for y in range(h))
        def chunk(tag, data):
            c = tag + data
            return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c))
        png = (b'\x89PNG\r\n\x1a\n'
               + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
               + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b''))
        Path(path).write_bytes(png)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: py tools/classify_raster.py <region> [--align-only]')
    main(sys.argv[1], align_only='--align-only' in sys.argv[2:])
