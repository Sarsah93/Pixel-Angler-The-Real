# -*- coding: utf-8 -*-
"""OSM 캐시 → 10m/타일 지형 래스터라이저. v2 — 다지역·대형맵·경계마스킹·스폰.

사용법:  py tools/build_osm_tilemap.py <region>        (지역 키는 regions_config.py)
입력:    pixelazed/_osmcache/<region>*.json            (fetch_region_osm.py 산출 파츠)
출력:    pixelazed/<region>/terrain.png / terrain.txt / pois.json / meta.json

v2 변경: 그리드를 bytearray로 교체(제주급 5,400만 타일 대응) · seaEdges 시드 방향 ·
행정경계 마스킹(거제) · 스폰 좌표 스냅 · 파츠 병합 로드.
"""
import json
import math
import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from regions_config import REGIONS

# 1타일 = 5m (2026-08-27 사용자 확정 — 구 10m는 건물·도로가 캐릭터보다 작게 체감됨.
#  맵 선형 2배 = 타일 4배. 벡터 원본이라 상수 하나로 전 지역 일괄 재생성.)
TILE_M = 5.0

PALETTE = {
    '~': (59, 111, 176), '.': (203, 185, 141), ',': (109, 163, 77),
    's': (232, 217, 160), 'r': (138, 138, 138), 'b': (122, 136, 148),
    'w': (184, 188, 196),   # 보도/인도 (차도 'r'과 분리 — 연석·차선 렌더의 기준)
    '#': (74, 74, 82),
}
# 도로 폭은 **미터 기준** — TILE_M을 바꿔도 실폭이 유지된다 (구 타일 수 기준 폐기).
#  차도(r)는 실제보다 다소 관대하게(게임 체감 — 캐릭터 대비 폭 확보), 보행로(w)는 실측 수준.
#  101차 후속: 차선 마킹(방향당 차로 수 × 3.5m + 가장자리 여유)이 **차도 타일 안에** 들어오도록
#  클래스별 폭을 차로 수 기준으로 재산정 (사용자: "왕복 2차선 선들은 보도와 겹치면 안 됨").
ROAD_W_M = {
    'motorway': 40, 'trunk': 32, 'primary': 30, 'secondary': 22, 'tertiary': 20,
    'residential': 14, 'unclassified': 14, 'living_street': 12, 'service': 10, 'track': 10,
}
# 방향당 차로 수 — roads.json에 실어 클라이언트가 차선 점선 개수를 정한다
ROAD_LANES = {
    'motorway': 4, 'trunk': 3, 'primary': 3, 'secondary': 2, 'tertiary': 2,
    'residential': 1, 'unclassified': 1, 'living_street': 1, 'service': 1, 'track': 1,
}
SIDEWALK_M = {
    'pedestrian': 6, 'footway': 4, 'path': 4, 'steps': 4, 'cycleway': 4,
}
POI_TAGS = [
    ('amenity', 'toilets', 'toilet'), ('amenity', 'police', 'police'),
    ('amenity', 'ferry_terminal', 'ferry_terminal'), ('amenity', 'fuel', 'fuel'),
    ('amenity', 'restaurant', 'restaurant'), ('amenity', 'cafe', 'cafe'),
    ('amenity', 'fast_food', 'restaurant'), ('amenity', 'marketplace', 'market'),
    ('amenity', 'bank', 'bank'), ('amenity', 'pharmacy', 'pharmacy'),
    ('man_made', 'lighthouse', 'lighthouse'), ('tourism', 'information', 'info'),
    ('tourism', 'viewpoint', 'viewpoint'), ('tourism', 'hotel', 'lodging'),
    ('tourism', 'guest_house', 'lodging'), ('leisure', 'fishing', 'fishing_spot'),
]
WALKABLE = b'.,rsbw'


class Grid:
    """1바이트/타일 그리드 — 대형 지역 메모리 대응."""
    def __init__(self, w, h, fill=ord('.')):
        self.w, self.h = w, h
        self.g = [bytearray([fill]) * w for _ in range(h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = c

    def get(self, x, y, default=0):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.g[y][x]
        return default


def fill_poly(grid, ring, ch, holes=None):
    rings = [ring] + (holes or [])
    ys = [p[1] for p in ring]
    y0, y1 = int(math.floor(min(ys))), int(math.ceil(max(ys)))
    c = ord(ch) if isinstance(ch, str) else ch
    for y in range(max(0, y0), min(grid.h - 1, y1) + 1):
        xs = []
        yc = y + 0.5
        for rg in rings:
            n = len(rg)
            for i in range(n):
                ax, ay = rg[i]; bx, by = rg[(i + 1) % n]
                if (ay <= yc < by) or (by <= yc < ay):
                    xs.append(ax + (yc - ay) * (bx - ax) / (by - ay))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for x in range(int(math.floor(xs[i] + 0.5)), int(math.floor(xs[i + 1] + 0.5))):
                grid.set(x, y, c)


def stroke(grid, pts, ch, width=1):
    c = ord(ch) if isinstance(ch, str) else ch
    r = max(0, (width - 1) / 2.0)
    m = int(math.ceil(r))
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for s in range(n + 1):
            t = s / n
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            for dy in range(-m, m + 1):
                for dx in range(-m, m + 1):
                    if dx * dx + dy * dy <= (r + 0.4) ** 2:
                        grid.set(int(round(x + dx)), int(round(y + dy)), c)


def load_parts(root, region, suffix=''):
    """분할 캐시 파츠(및 구버전 단일 캐시) 병합 로드. 요소는 (type,id)로 중복 제거."""
    cache_dir = root / 'pixelazed' / '_osmcache'
    paths = sorted(cache_dir.glob(f'{region}{suffix}.part_*.json'))
    single = cache_dir / f'{region}{suffix}.json'
    if single.exists():
        paths.append(single)
    if not paths:
        raise SystemExit(f'캐시 없음: 먼저 py tools/fetch_region_osm.py {region} 실행')
    nodes, ways, rels, seen = {}, {}, [], set()
    for p in paths:
        doc = json.loads(p.read_text(encoding='utf-8'))
        for el in doc['elements']:
            key = (el['type'], el['id'])
            if key in seen:
                continue
            seen.add(key)
            if el['type'] == 'node':
                nodes[el['id']] = el
            elif el['type'] == 'way':
                ways[el['id']] = el
            else:
                rels.append(el)
    print(f'[load] {len(paths)}파일 — node {len(nodes):,} / way {len(ways):,} / rel {len(rels)}')
    return nodes, ways, rels


def make_proj(bbox):
    s, w, n, e = bbox
    m_lat = 111132.0
    m_lon = 111320.0 * math.cos(math.radians((s + n) / 2))
    W = int(round((e - w) * m_lon / TILE_M))
    H = int(round((n - s) * m_lat / TILE_M))
    def proj(lat, lon):
        return ((lon - w) * m_lon / TILE_M, (n - lat) * m_lat / TILE_M)
    return proj, W, H


def way_pts(way, nodes, proj):
    out = []
    for nid in way.get('nodes', []):
        nd = nodes.get(nid)
        if nd:
            out.append(proj(nd['lat'], nd['lon']))
    return out


def stitch_rings(members, ways, nodes, proj):
    segs = []
    for m in members:
        if m['type'] == 'way' and m['ref'] in ways:
            pts = way_pts(ways[m['ref']], nodes, proj)
            if len(pts) >= 2:
                segs.append((m.get('role') or 'outer', pts))
    rings = {'outer': [], 'inner': []}
    for role in ('outer', 'inner'):
        pool = [p for r, p in segs if r == role]
        while pool:
            ring = pool.pop(0)
            changed = True
            while changed and (len(ring) < 3 or ring[0] != ring[-1]):
                changed = False
                for i, seg in enumerate(pool):
                    if seg[0] == ring[-1]:
                        ring += seg[1:]; pool.pop(i); changed = True; break
                    if seg[-1] == ring[-1]:
                        ring += list(reversed(seg[:-1])); pool.pop(i); changed = True; break
            if len(ring) >= 3:
                rings[role].append(ring)
    return rings


def edge_seeds(W, H, edges):
    out = []
    if 'E' in edges: out += [(W - 1, y) for y in range(H)]
    if 'W' in edges: out += [(0, y) for y in range(H)]
    if 'N' in edges: out += [(x, 0) for x in range(W)]
    if 'S' in edges: out += [(x, H - 1) for x in range(W)]
    return out


def build(region):
    cfg = REGIONS[region]
    root = Path(__file__).resolve().parent.parent
    nodes, ways, rels = load_parts(root, region)
    proj, W, H = make_proj(cfg['bbox'])
    print(f'[grid] {W:,} x {H:,} tiles ({W * TILE_M / 1000:.2f} x {H * TILE_M / 1000:.2f} km)')
    if W * H > 20_000_000:
        print('[warn] 2천만 타일 초과 — 빌드 수 분, 클라이언트는 청크 파일 분할 로드 필수(스펙 §12)')
    grid = Grid(W, H)

    def tagged(el, key, val=None):
        t = el.get('tags', {})
        return key in t and (val is None or t[key] == val)

    # 1) 해안선 장벽 → seaEdges 방향에서 flood fill (grid 자체를 방문 표시로 사용)
    barrier = Grid(W, H, fill=0)
    for wy in ways.values():
        if tagged(wy, 'natural', 'coastline'):
            pts = way_pts(wy, nodes, proj)
            for i in range(len(pts) - 1):
                (x0, y0), (x1, y1) = pts[i], pts[i + 1]
                n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
                for s in range(n + 1):
                    t = s / n
                    x = int(round(x0 + (x1 - x0) * t)); y = int(round(y0 + (y1 - y0) * t))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            barrier.set(x + dx, y + dy, 1)
    SEA, LAND = ord('~'), ord('.')
    dq = deque()
    for (x, y) in edge_seeds(W, H, cfg['seaEdges']):
        if not barrier.get(x, y) and grid.g[y][x] != SEA:
            grid.g[y][x] = SEA; dq.append((x, y))
    while dq:
        x, y = dq.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and grid.g[ny][nx] != SEA and not barrier.get(nx, ny):
                grid.g[ny][nx] = SEA; dq.append((nx, ny))
    for y in range(H):                                   # 해안선 셀 = 육지 가장자리
        row, brow = grid.g[y], barrier.g[y]
        for x in range(W):
            if brow[x]:
                row[x] = LAND
    sea = sum(r.count(SEA) for r in grid.g)
    print(f'[flood] sea ratio = {sea / (W * H):.2%}  (해안선 누수 시 비정상값 — terrain.png에서 막고 재실행)')

    # 2) 내수면 → 피복 → 도로 → 방파제 → 건물 (우선순위 순서 고정)
    for wy in ways.values():
        if tagged(wy, 'natural', 'water'):
            fill_poly(grid, way_pts(wy, nodes, proj), '~')
    for rl in rels:
        if tagged(rl, 'natural', 'water'):
            rg = stitch_rings(rl.get('members', []), ways, nodes, proj)
            for outer in rg['outer']:
                fill_poly(grid, outer, '~', holes=rg['inner'])
    for wy in ways.values():
        t = wy.get('tags', {})
        if t.get('landuse') in ('grass', 'forest', 'meadow', 'recreation_ground',
                                'cemetery', 'farmland', 'orchard') \
           or t.get('leisure') in ('park', 'garden', 'pitch', 'playground') \
           or t.get('natural') == 'wetland':
            fill_poly(grid, way_pts(wy, nodes, proj), ',')
    for wy in ways.values():
        if tagged(wy, 'natural', 'beach'):
            fill_poly(grid, way_pts(wy, nodes, proj), 's')
    # 보행로(w) 먼저 → 차도(r)가 위에 얹힌다. 차도는 폭+2m 보도 프린지를 먼저 깔아
    # 도심 도로 양옆에 자동 인도를 만든다 (연석 렌더의 'r'↔'w' 접경이 여기서 나온다).
    def road_tiles(m):
        return max(1, int(round(m / TILE_M)))
    for wy in ways.values():
        hw = wy.get('tags', {}).get('highway')
        if not hw:
            continue
        pts = way_pts(wy, nodes, proj)
        if hw in SIDEWALK_M:
            stroke(grid, pts, 'w', road_tiles(SIDEWALK_M[hw]))
        else:
            wm = ROAD_W_M.get(hw, 8)
            stroke(grid, pts, 'w', road_tiles(wm) + 2)   # 양옆 보도 프린지
    roads = []   # 차도 중심선 벡터 (타일 좌표) — 클라이언트가 차선·중앙선을 벡터로 그린다 (대각 대응)
    for wy in ways.values():
        hw = wy.get('tags', {}).get('highway')
        if not hw or hw in SIDEWALK_M:
            continue
        pts = way_pts(wy, nodes, proj)
        wt = road_tiles(ROAD_W_M.get(hw, 8))
        stroke(grid, pts, 'r', wt)
        if len(pts) >= 2:
            tags = wy.get('tags', {})
            rd = dict(cls=hw, w=wt, lanes=ROAD_LANES.get(hw, 1),
                      pts=[[round(x, 2), round(y, 2)] for x, y in pts])
            # 회전교차로(OSM junction=roundabout — way 방향 = 주행 방향, 우측통행이면 반시계) · 일방통행
            if tags.get('junction') in ('roundabout', 'circular'):
                rd['roundabout'] = True
                rd['oneway'] = True
            elif tags.get('oneway') in ('yes', 'true', '1'):
                rd['oneway'] = True
            elif tags.get('oneway') == '-1':
                rd['oneway'] = True
                rd['pts'] = rd['pts'][::-1]
            roads.append(rd)
    for wy in ways.values():
        mm = wy.get('tags', {}).get('man_made')
        if mm in ('breakwater', 'pier', 'groyne', 'quay'):
            pts = way_pts(wy, nodes, proj)
            if len(pts) >= 3 and pts[0] == pts[-1]:
                fill_poly(grid, pts, 'b')
            else:
                stroke(grid, pts, 'b', 2)
    for wy in ways.values():
        if tagged(wy, 'building'):
            fill_poly(grid, way_pts(wy, nodes, proj), '#')
    for rl in rels:
        if tagged(rl, 'building'):
            rg = stitch_rings(rl.get('members', []), ways, nodes, proj)
            for outer in rg['outer']:
                fill_poly(grid, outer, '#', holes=rg['inner'])

    # 3) 행정경계 마스킹 — 경계 밖 육지를 바다로 (거제: 통영·마산·부산측 제거)
    if cfg.get('boundaryMask'):
        bnodes, bways, brels = load_parts(root, region, suffix='_boundary')
        mask = Grid(W, H, fill=0)
        for rl in brels:
            if rl.get('tags', {}).get('name') == cfg['boundaryMask']:
                rg = stitch_rings(rl.get('members', []), bways, bnodes, proj)
                for outer in rg['outer']:
                    fill_poly(mask, outer, 1, holes=rg['inner'])
        cut = 0
        for y in range(H):
            row, mrow = grid.g[y], mask.g[y]
            for x in range(W):
                if row[x] != SEA and not mrow[x]:
                    row[x] = SEA; cut += 1
        print(f'[mask] {cfg["boundaryMask"]} 경계 밖 육지 {cut:,}타일 → 바다 처리')

    # 4) POI
    pois = []
    def poi_from(el, cx, cy):
        t = el.get('tags', {})
        for key, val, ptype in POI_TAGS:
            if t.get(key) == val:
                pois.append(dict(type=ptype, name=t.get('name:ko') or t.get('name') or '',
                                 tx=int(cx), ty=int(cy), osmId=el['id']))
                return
        if 'shop' in t:
            pois.append(dict(type='shop', shopKind=t['shop'],
                             name=t.get('name:ko') or t.get('name') or '',
                             tx=int(cx), ty=int(cy), osmId=el['id']))
    for nd in nodes.values():
        if nd.get('tags'):
            x, y = proj(nd['lat'], nd['lon'])
            if 0 <= x < W and 0 <= y < H:
                poi_from(nd, x, y)
    for wy in ways.values():
        if wy.get('tags'):
            pts = way_pts(wy, nodes, proj)
            if pts:
                cx = sum(p[0] for p in pts) / len(pts)
                cy = sum(p[1] for p in pts) / len(pts)
                if 0 <= cx < W and 0 <= cy < H:
                    poi_from(wy, cx, cy)
    print(f'[poi] {len(pois):,}개 추출')

    # 5) 스폰 스냅 — 대략 좌표에서 최근접 이동가능 타일 (BFS ≤ 100타일)
    sx, sy = proj(*cfg['spawn'])
    sx, sy = int(round(sx)), int(round(sy))
    spawn_tile = None
    seen = {(sx, sy)}
    dq = deque([(sx, sy, 0)])
    while dq:
        x, y, dist = dq.popleft()
        if dist > 100:
            break
        if 0 <= x < W and 0 <= y < H and grid.g[y][x] in WALKABLE:
            spawn_tile = [x, y]; break
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            p = (x + dx, y + dy)
            if p not in seen:
                seen.add(p); dq.append((p[0], p[1], dist + 1))
    if spawn_tile is None:
        print('[warn] 스폰 스냅 실패 — spawn 좌표가 이동가능 지형에서 1km 이상 떨어짐. 수동 지정 필요')
    else:
        print(f'[spawn] {cfg["spawnName"]} → tile ({spawn_tile[0]}, {spawn_tile[1]})')

    # 6) 출력
    out = root / 'pixelazed' / region
    out.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image
        im = Image.new('RGB', (W, H))
        pal = {ord(k): v for k, v in PALETTE.items()}
        px = im.load()
        for y in range(H):
            row = grid.g[y]
            for x in range(W):
                px[x, y] = pal[row[x]]
        im.save(out / 'terrain.png')
    except ImportError:
        print('[warn] Pillow 없음 — terrain.png 생략 (pip install pillow)')
    (out / 'terrain.txt').write_bytes(b'\n'.join(bytes(r) for r in grid.g))
    (out / 'pois.json').write_text(json.dumps(pois, ensure_ascii=False, indent=1), encoding='utf-8')
    (out / 'roads.json').write_text(json.dumps(roads, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'[roads] 차도 벡터 {len(roads):,}개')
    (out / 'meta.json').write_text(json.dumps(dict(
        region=region, bbox=cfg['bbox'], tileMeters=TILE_M, width=W, height=H,
        spawn=spawn_tile, spawnName=cfg['spawnName'], spawnApprox=True,
        palette={k: '#%02x%02x%02x' % v for k, v in PALETTE.items()},
    ), ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'[done] → {out}')
    return grid, pois


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in REGIONS:
        print('사용법: py tools/build_osm_tilemap.py <region>')
        print('지역:', ', '.join(REGIONS))
        raise SystemExit(1)
    build(sys.argv[1])
