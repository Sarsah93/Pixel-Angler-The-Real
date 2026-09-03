"""드론 사진(탑뷰) → 섬 갯바위 타일 시트 + 지형 패치 (115차 — 조도).

    py tools/pixelize_islet.py <photo.png> --region sokcho_v2 --name jodo --grid 32x27 --center 277,529

절차
 1. 사진을 **grid × 32px**(TR 1:1)로 박스 리샘플 → 2px 그레인(맵 규칙 — 106차)으로 도트화.
 2. 픽셀 분류(HSV): 물 / 초지 / 암반 → **타일셋 팔레트로 재채색**(물은 인게임 바다 톤, 초지는
    Kenney 잔디 톤, 암반은 해안 rock/head 셀 휘도 램프). 물 픽셀은 **투명** — 밑에 깔린 게임 물이
    비친다(106차 오버라이드 규칙 "투명 부분은 게임 물/지면").
 3. 셀(32px)마다 뭍 비율로 지형 문자 결정 — ≥ 0.5 = `'.'`(걷기 가능 · 섬 `'.'`은 L1이 얕은 물 베이스),
    그 외 `'~'`. 뭍 픽셀이 조금이라도 있는 셀은 tileTex로 그림을 얹는다(여·물속 바위).
 4. 배치 원점 = 사진 속 섬 bbox 중심을 `--center` 타일에 맞춤. **본토(섬 플래그 없는 뭍) 타일은
    절대 덮지 않는다** — 사진 물이 본토 위에 오면 건너뛰고, 사진 뭍이 본토 위에 오면 경고.
 5. 출력: `public/tileset/<name>/sheet.png`(RGBA) + `patch.json` 병합(pixelazed 정본 + public 런타임
    사본, 기존 항목은 블록 안에서만 교체). 런타임은 `ts_<name>_sheet`를 셀 텍스처 `ts_<name>_r{r}c{c}`로
    잘라 쓴다(SeamlessChunks.setTileTex — 시트 자동 슬라이스).

⚠ 섬 판정은 게임이 지형에서 다시 계산한다(computeIslets) — 본토와 물로 분리돼 있어야 한다.
"""
from __future__ import annotations

import argparse
import colorsys
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TR = 32
GRAIN = 2

# 인게임 팔레트 (실렌더 표본 — 113차 조도 스크린샷 · coast rock_05 · head_0)
WATER_RAMP = [(89, 145, 183), (95, 152, 189), (108, 160, 193), (114, 167, 200), (150, 195, 220)]
GRASS_RAMP = [(52, 118, 78), (66, 141, 96), (68, 152, 102), (78, 162, 112), (96, 178, 124)]
ROCK_RAMP = [(66, 64, 62), (87, 84, 79), (111, 107, 100), (129, 123, 112), (158, 148, 132), (182, 172, 156), (204, 195, 180)]


def classify(rgb: tuple[int, int, int]) -> str:
    r, g, b = (v / 255 for v in rgb)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    hd = h * 360
    if s > 0.22 and 160 <= hd <= 235 and v > 0.12:
        return 'w'                      # 청록~파랑 물
    if s > 0.18 and 55 <= hd < 160 and v > 0.12:
        return 'g'                      # 초지
    return 'r'                          # 암반(저채도·난색·그늘)


def ramp(ramp_: list[tuple[int, int, int]], lum: float, lo: float, hi: float) -> tuple[int, int, int]:
    t = 0.0 if hi <= lo else max(0.0, min(1.0, (lum - lo) / (hi - lo)))
    return ramp_[min(len(ramp_) - 1, int(t * len(ramp_)))]


def equalized(ramp_: list[tuple[int, int, int]], lum: float, sorted_vals: list[float]) -> tuple[int, int, int]:
    """히스토그램 균등화 — 클래스 휘도의 **순위**로 램프 인덱스를 고른다. 사진 노출(밝은 화강암)과
    무관하게 램프 톤이 고르게 쓰여 중앙값이 램프 중앙(해안 rock 셀 휘도 ≈ 130~150)에 온다."""
    import bisect
    if not sorted_vals:
        return ramp_[len(ramp_) // 2]
    rank = bisect.bisect_left(sorted_vals, lum) / len(sorted_vals)
    return ramp_[min(len(ramp_) - 1, int(rank * len(ramp_)))]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('photo')
    ap.add_argument('--region', default='sokcho_v2')
    ap.add_argument('--name', default='jodo')
    ap.add_argument('--grid', default='32x27')
    ap.add_argument('--center', default='277,529', help='사진 속 섬 bbox 중심을 놓을 타일')
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()
    gw, gh = (int(x) for x in a.grid.lower().split('x'))
    cx, cy = (int(x) for x in a.center.split(','))

    src = Image.open(a.photo).convert('RGB')
    W, H = gw * TR, gh * TR
    low = src.resize((W // GRAIN, H // GRAIN), Image.BOX)      # 2px 그레인 = 반해상도로 리샘플
    px = low.load()
    lw, lh = low.size
    cls = [[classify(px[x, y]) for x in range(lw)] for y in range(lh)]
    lum = [[0.299 * px[x, y][0] + 0.587 * px[x, y][1] + 0.114 * px[x, y][2] for x in range(lw)] for y in range(lh)]

    # 클래스별 휘도 **순위**로 램프 배정(균등화) — 사진 노출과 무관하게 타일셋 톤 분포에 맞춘다
    #   (첫 시도의 분위 정규화는 밝은 화강암이 램프 상단 2톤에 몰려 해안 rock 셀보다 훨씬 밝았다)
    sorted_g = sorted(lum[y][x] for y in range(lh) for x in range(lw) if cls[y][x] == 'g')
    sorted_r = sorted(lum[y][x] for y in range(lh) for x in range(lw) if cls[y][x] == 'r')

    out_low = Image.new('RGBA', (lw, lh), (0, 0, 0, 0))
    op = out_low.load()
    for y in range(lh):
        for x in range(lw):
            k = cls[y][x]
            if k == 'w':
                continue                                        # 물 = 투명 (게임 물이 비친다)
            if k == 'g':
                op[x, y] = equalized(GRASS_RAMP, lum[y][x], sorted_g) + (255,)
            else:
                op[x, y] = equalized(ROCK_RAMP, lum[y][x], sorted_r) + (255,)
    sheet = out_low.resize((W, H), Image.NEAREST)

    # 셀 분류
    cells: list[list[dict]] = []
    land_bbox = [gw, gh, -1, -1]
    for r in range(gh):
        row = []
        for c in range(gw):
            n = land = veg = 0
            for y in range(r * TR // GRAIN, (r + 1) * TR // GRAIN):
                for x in range(c * TR // GRAIN, (c + 1) * TR // GRAIN):
                    n += 1
                    if cls[y][x] != 'w':
                        land += 1
                        if cls[y][x] == 'g':
                            veg += 1
            lf = land / n
            row.append({'land': lf, 'veg': veg / max(1, land)})
            if lf >= 0.5:
                land_bbox[0] = min(land_bbox[0], c); land_bbox[1] = min(land_bbox[1], r)
                land_bbox[2] = max(land_bbox[2], c); land_bbox[3] = max(land_bbox[3], r)
        cells.append(row)
    icx = (land_bbox[0] + land_bbox[2]) / 2
    icy = (land_bbox[1] + land_bbox[3]) / 2
    ox, oy = round(cx - icx), round(cy - icy)
    print(f'사진 섬 bbox 셀 {land_bbox} 중심 ({icx:.1f},{icy:.1f}) → 블록 원점 타일 ({ox},{oy}) · 블록 {gw}×{gh}')

    # 지형 + 섬 플래그(성분 크기 ≤ 600 ∧ 본토 미접촉 근사: 4-연결 뭍 성분이 작으면 섬)
    base = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'data', a.region)
    with open(os.path.join(base, 'seamless.json'), encoding='utf-8') as f:
        terrain = json.load(f)['terrain']
    rows_n, cols_n = len(terrain), len(terrain[0])

    def land_comp(c0: int, r0: int) -> set[int]:
        seen = {r0 * cols_n + c0}
        st = [r0 * cols_n + c0]
        while st and len(seen) <= 2000:
            i = st.pop()
            c, r = i % cols_n, i // cols_n
            for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nc, nr = c + dc, r + dr
                if 0 <= nc < cols_n and 0 <= nr < rows_n and terrain[nr][nc] != '~':
                    j = nr * cols_n + nc
                    if j not in seen:
                        seen.add(j); st.append(j)
        return seen
    islet: set[int] = set()
    for r in range(oy, oy + gh):
        for c in range(ox, ox + gw):
            if 0 <= c < cols_n and 0 <= r < rows_n and terrain[r][c] != '~' and (r * cols_n + c) not in islet:
                comp = land_comp(c, r)
                if len(comp) <= 600:
                    islet |= comp

    tiles: list[list] = []
    tex: list[dict] = []
    warn_mainland = 0
    stats = {'land': 0, 'water_tex': 0, 'water_plain': 0, 'skipped_mainland': 0}
    for r in range(gh):
        for c in range(gw):
            tc, tr_ = ox + c, oy + r
            if not (0 <= tc < cols_n and 0 <= tr_ < rows_n):
                continue
            cur = terrain[tr_][tc]
            on_mainland = cur != '~' and (tr_ * cols_n + tc) not in islet
            cell = cells[r][c]
            want = '.' if cell['land'] >= 0.5 else '~'
            if on_mainland:
                stats['skipped_mainland'] += 1
                if want == '.':
                    warn_mainland += 1
                continue
            if want != cur:
                tiles.append([tc, tr_, want])
            if cell['land'] >= 0.05:
                tex.append({'tx': tc, 'ty': tr_, 'tex': f'ts_{a.name}_r{r}c{c}'})
                stats['land' if want == '.' else 'water_tex'] += 1
            else:
                stats['water_plain'] += 1
    print('셀 통계', stats, f'· 지형 변경 {len(tiles)}타일 · tileTex {len(tex)}셀')
    if warn_mainland:
        print(f'⚠ 사진 뭍이 본토 위에 {warn_mainland}셀 — 건너뜀 (center를 옮겨 확인)')
    if a.dry:
        return

    out_dir = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'tileset', a.name)
    os.makedirs(out_dir, exist_ok=True)
    sheet.save(os.path.join(out_dir, 'sheet.png'))
    print('시트 저장', os.path.relpath(out_dir, ROOT), sheet.size)

    # patch.json 병합 — 정본(pixelazed) + 런타임(public)
    for pdir in (os.path.join(ROOT, 'pixelazed', a.region), base):
        pp = os.path.join(pdir, 'patch.json')
        patch = json.load(open(pp, encoding='utf-8')) if os.path.exists(pp) else {}
        inblk = lambda x, y: ox <= x < ox + gw and oy <= y < oy + gh      # noqa: E731
        patch['tiles'] = [t for t in patch.get('tiles', []) if not inblk(t[0], t[1])] + tiles
        patch['tileTex'] = [t for t in patch.get('tileTex', []) if not inblk(int(t['tx']), int(t['ty']))] + tex
        patch.setdefault('props', []); patch.setdefault('roofs', {})
        with open(pp, 'w', encoding='utf-8') as f:
            json.dump(patch, f, ensure_ascii=False, separators=(',', ':'))
        print('patch 병합', os.path.relpath(pp, ROOT), f"tiles {len(patch['tiles'])} · tileTex {len(patch['tileTex'])}")


if __name__ == '__main__':
    sys.exit(main())
