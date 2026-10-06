"""
속초 해안 위성 대조 반영(184차) — 사용자 네이버 위성 캡처 8장 ↔ OSM 좌표 대조 결과를 patch로 굽는다.

  py tools/author_sokcho_coast.py

- 기준 지형 = public/data/sokcho_v2/seamless.json (OSM 빌드 결과 — patch 미반영)
  → 매번 같은 결과(멱등). 계산한 타일은 patch.tiles에 **좌표 단위로 덮어쓴다**.
- 두 patch를 함께 갱신한다: pixelazed/sokcho_v2/patch.json(정본) · public/data/sokcho_v2/patch.json(런타임)
- 피복 지정(armor)은 (tx, ty) 단위, 고가(overpasses)는 id 단위로 교체한다.

반영 항목 (캡처 순서)
 1. 영랑호 호숫가 소형 '방파제' 3곳 → 뭍 (자연 호안 — 석축·돌덩이 없음)
 2. 영금정: 등대 서쪽 해안도로 앞 · 영금정 바위 남쪽 해안 = 테트라포드
 3. 동명항 안쪽 활어센터 앞 방파제 = 연석 직벽(quay)
 4. 청초호 수로(금강대교 밑) = 물로 복원 + 가짜 대각선 호안 제거 · 갯배 선착장 쪽 = 연석 직벽
    + 금강대교~설악금강대교로 고가(OSM bridge=yes 4구간)
 5. 청초호 남서쪽(조양동) = 물가 한 줄 테트라포드 3구간 + 요트 선착장 잔교 2곳(걸어 다닐 수 있는 데크)
 6. 청호동 동쪽 해안 = 테트라포드 호안 · 속초해수욕장 북단 방파제 = 섬 방파제(테트라포드) + 연결 다리(데크)

185차 — 사용자 캡처 4장(영랑호 윗길 · 씨크루저호텔 앞 · 속초항 국제크루즈터미널 · 등대 북쪽 해안도로) 대조
 7. 호수 안 성분 = 연석 직벽(quay): 영랑호 2곳(서쪽 소형 · 반도·후미) · 청초호 북안(씨크루저호텔 앞)
    ⚠ 반도처럼 좁은 뭍은 추론이 '방파제 성분'으로 묶는다(378타일) — 호수에는 테트라포드가 없다.
 8. 속초항 국제크루즈터미널 부두 = 연석 직벽(quay)
186차 — 사용자 캡처(대교 밑 땅) 대조
 9. 고가를 두 다리로 분리(설악금강대교 · 금강대교) — 가운데 반도에 내려서는 끝단이 생긴다
10. 설악금강대교 밑 좁은 목(y 273~285) = 물 — 양옆에 배가 정박한 수로다
"""
import json, os, sys
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEAMLESS = os.path.join(ROOT, 'packages/client-pc/public/data/sokcho_v2/seamless.json')
PATCHES = [os.path.join(ROOT, 'pixelazed/sokcho_v2/patch.json'),
           os.path.join(ROOT, 'packages/client-pc/public/data/sokcho_v2/patch.json')]
OSM = os.path.join(ROOT, 'pixelazed/_osmcache/sokcho_v2.part_0_0.json')
META = os.path.join(ROOT, 'pixelazed/sokcho_v2/meta.json')

base = [list(r) for r in json.load(open(SEAMLESS, encoding='utf-8'))['terrain']]
R, C = len(base), len(base[0])
edits = {}          # (x, y) -> ch
armor = []          # RegionArmor
LAND = set('.,srwpdtcfk#')


def at(x, y):
    if (x, y) in edits:
        return edits[(x, y)]
    if 0 <= x < C and 0 <= y < R:
        return base[y][x]
    return '~'


def put(x, y, ch):
    if 0 <= x < C and 0 <= y < R:
        edits[(x, y)] = ch


def comp_b(seed_box):
    """bbox 안의 'b'에서 시작하는 8-연결 성분 전체"""
    x0, y0, x1, y1 = seed_box
    seeds = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if at(x, y) == 'b']
    seen = set(seeds)
    q = deque(seeds)
    while q:
        x, y = q.popleft()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                n = (x + dx, y + dy)
                if n not in seen and at(*n) == 'b':
                    seen.add(n)
                    q.append(n)
    return seen


# ── 1. 영랑호 호숫가 → 뭍 ─────────────────────────────────────────────
for box in [(301, 15, 311, 21), (54, 30, 63, 39), (55, 68, 58, 76)]:
    cells = comp_b(box)
    for (x, y) in sorted(cells):
        votes = {}
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            t = at(x + dx, y + dy)
            if t in LAND and t != '#':
                votes[t] = votes.get(t, 0) + 1
        put(x, y, max(votes, key=votes.get) if votes else '.')
    print(f'[1] 영랑호 {box} → 뭍 {len(cells)}타일')


def water_run_from_south(x, y_start, y_min):
    """열 x에서 y_start부터 위로 올라가 처음 만나는 물 타일의 y"""
    y = y_start
    while y >= y_min and at(x, y) != '~':
        y -= 1
    return y if y >= y_min else None


def water_run_from_west(y, x_start, x_max):
    x = x_start
    while x <= x_max and at(x, y) != '~':
        x += 1
    return x if x <= x_max else None


# ── 2. 영금정 테트라포드 ────────────────────────────────────────────────
# 캡처 3 — 등대(OSM 567,85) ↔ 캡처 (500,715)px, 14px/타일로 맞춘 두 빨간 영역
# ⚠ x 531~532에는 영랑해안길 쪽 기존 OSM 호안 선이 있다 — 붙으면 한 성분이 되어 캡처 밖(x 480~)까지
#   통째로 테트라포드가 된다(실측 420타일). 두 칸 띄워 캡처 범위만 남긴다.
north = []
for x in range(534, 549):
    y1 = water_run_from_south(x, 66, 45)
    if y1 is None:
        continue
    for y in (y1, y1 - 1):
        if at(x, y) == '~':
            put(x, y, 'b'); north.append((x, y))
if north:
    armor.append({'tx': north[0][0], 'ty': north[0][1], 'kind': 'tetrapod'})
south = []
for y in range(99, 111):
    x1 = water_run_from_west(y, 582, 610)
    if x1 is None:
        continue
    for x in (x1, x1 + 1):
        if at(x, y) == '~':
            put(x, y, 'b'); south.append((x, y))
if south:
    armor.append({'tx': south[0][0], 'ty': south[0][1], 'kind': 'tetrapod'})
print(f'[2] 영금정 테트라포드 북 {len(north)} · 남 {len(south)}타일')

# 핀(영랑동 1-17) 자리 바위 선반 — 캡처에서 테트라포드가 아니라 갯바위다(소형 'b' 성분 2개 → 'k')
rock = comp_b((566, 58, 575, 65)) | comp_b((543, 51, 557, 56))
for (x, y) in rock:
    put(x, y, 'k')
print(f'[2] 영금정 바위 선반 → 갯바위 {len(rock)}타일')

# ── 3. 동명항 활어센터 앞 = 연석 직벽 ────────────────────────────────────
armor.append({'tx': 570, 'ty': 150, 'kind': 'quay'})

# ── 4. 청초호 수로 · 갯배 선착장 ─────────────────────────────────────────
ch = 0
for y in range(354, 371):
    for x in range(440, 457):
        if at(x, y) != '~':
            put(x, y, '~'); ch += 1
diag = comp_b((428, 357, 448, 375))
for (x, y) in diag:
    put(x, y, '~')
armor.append({'tx': 488, 'ty': 329, 'kind': 'quay'})
print(f'[4] 금강대교 수로 복원 {ch} · 가짜 대각 호안 제거 {len(diag)}타일')


# 고가 — OSM bridge=yes 선형을 이어 붙인다 (북 → 남)
def osm_ways():
    d = json.load(open(OSM, encoding='utf-8'))
    m = json.load(open(META, encoding='utf-8'))
    S, W, N, E = m['bbox']
    nodes = {e['id']: (e['lat'], e['lon']) for e in d['elements'] if e['type'] == 'node'}
    ways = {}
    for e in d['elements']:
        if e['type'] == 'way':
            ways[e['id']] = [((lo - W) / (E - W) * C, (N - la) / (N - S) * R)
                             for la, lo in (nodes[n] for n in e['nodes'] if n in nodes)]
    return ways


ways = osm_ways()


def orient_join(chain, pts):
    """chain 끝에 가까운 쪽이 앞에 오도록 pts를 뒤집는다 (chain이 비면 북 → 남)"""
    if chain:
        if (pts[-1][0] - chain[-1][0]) ** 2 + (pts[-1][1] - chain[-1][1]) ** 2 < \
           (pts[0][0] - chain[-1][0]) ** 2 + (pts[0][1] - chain[-1][1]) ** 2:
            return pts[::-1]
        return pts
    return pts[::-1] if pts[0][1] > pts[-1][1] else pts


def append_pts(chain, pts):
    for p in pts:
        if not chain or (p[0] - chain[-1][0]) ** 2 + (p[1] - chain[-1][1]) ** 2 > 0.25:
            chain.append(p)


def arc_at_y(pts, yq):
    s = 0.0
    for i in range(1, len(pts)):
        (ax, ay), (bx, by) = pts[i - 1], pts[i]
        seg = ((bx - ax) ** 2 + (by - ay) ** 2) ** 0.5
        if (ay - yq) * (by - yq) <= 0 and ay != by:
            return s + seg * (yq - ay) / (by - ay)
        s += seg
    return s


# 186차 — 구 184차는 OSM 4구간을 **한 줄의 고가**로 이어 붙여, 중간의 지면 구간(설악금강대교로 y 334~351)까지
#   3층 높이로 떠 있었다. 그래서 가운데 땅(청호동 쪽 반도)으로 **내려설 곳이 없었고**, 대신 첫 다리 밑의 가짜 땅
#   (y 273~285 — 사용자 캡처 4: "대교 아래 지형은 실제로 없는 땅")으로 걸어서 건넜다.
#   → 다리 A(북 → 반도 착지) · 다리 B(반도 → 금강대교 아치 → 남) 두 개로 나누고, A 밑의 좁은 목은 물로 되돌린다.
a_pts = []
append_pts(a_pts, orient_join(a_pts, ways[168876667]))
ground = orient_join(a_pts, ways[178808335])
b_pts = []
append_pts(b_pts, [p for p in ground if p[1] >= 344])
for wid in (753395815, 178808348):
    append_pts(b_pts, orient_join(b_pts, ways[wid]))
a_pts = [[round(x, 2), round(y, 2)] for x, y in a_pts]
b_pts = [[round(x, 2), round(y, 2)] for x, y in b_pts]

overpasses = [
    {'id': 'seorak_geumgang_bridge', 'name': '설악금강대교', 'pts': a_pts, 'halfW': 2.4, 'level': 3, 'rampTiles': 16},
    {'id': 'geumgang_bridge', 'name': '금강대교', 'pts': b_pts, 'halfW': 2.4, 'level': 3, 'rampTiles': 10,
     'arch': [round(arc_at_y(b_pts, 351.5), 1), round(arc_at_y(b_pts, 371.5), 1)]},
]
for o in overpasses:
    print(f'[4] 고가 {o["name"]} {len(o["pts"])}점 · y {o["pts"][0][1]:.0f} → {o["pts"][-1][1]:.0f}')


def dist_to(pts, x, y):
    best = 1e9
    for i in range(1, len(pts)):
        (ax, ay), (bx, by) = pts[i - 1], pts[i]
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy or 1e-9
        t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / L2))
        best = min(best, ((x - ax - dx * t) ** 2 + (y - ay - dy * t) ** 2) ** 0.5)
    return best


# 다리 A 밑의 좁은 목 (양옆이 물 — 배가 양쪽에 정박한 자리) → 물
neck = 0
for y in range(273, 286):
    for x in range(438, 462):
        if at(x, y) in 'brwpd.' and dist_to(a_pts, x + 0.5, y + 0.5) <= 2.4 + 1.2:
            put(x, y, '~'); neck += 1
print(f'[4] 다리 밑 가짜 목 → 물 {neck}타일')

# ── 5. 청초호 남서쪽(조양동) ─────────────────────────────────────────────
segs = []
for x0, x1 in ((312, 346), (357, 382), (384, 404)):
    seg = []
    for x in range(x0, x1 + 1):
        y1 = water_run_from_south(x, 575, 548)
        if y1 is not None and at(x, y1) == '~':
            put(x, y1, 'b'); seg.append((x, y1))
    if seg:
        armor.append({'tx': seg[len(seg) // 2][0], 'ty': seg[len(seg) // 2][1], 'kind': 'tetrapod'})
    segs.append(len(seg))
# 요트 잔교 ① — OSM man_made=pier 면(348~356 × 535~558): 척추 + 손가락 + 머리
for y in range(535, 557):
    put(351, y, 'D'); put(352, y, 'D')
for x in range(348, 356):
    put(x, 535, 'D')
for y in (537, 540, 542, 545, 547, 549, 551, 553, 555):
    for x in (348, 349, 350, 353, 354, 355):
        put(x, y, 'D')
# 요트 잔교 ② — 캡처 6의 파란 부잔교(OSM 없음): 물가와 나란한 통로 + 손가락 5 + 연결 다리
for x in range(377, 388):
    put(x, 554, 'D')
for x in (378, 380, 382, 384, 386):
    for y in range(550, 554):
        put(x, y, 'D')
put(383, 555, 'D'); put(383, 556, 'D')
print(f'[5] 조양동 테트라포드 {segs} · 잔교 2곳')

# ── 6. 청호동 동쪽 해안 + 해수욕장 북단 섬 방파제 ─────────────────────────
wall = []
for y in range(438, 553):
    xs = [x for x in range(500, 640) if at(x, y) in LAND and at(x + 1, y) == '~'
          and all(at(x + k, y) == '~' for k in range(1, 7))]
    if not xs:
        continue
    x = max(xs)
    if at(x, y) == 's':
        continue
    for k in (1, 2):
        put(x + k, y, 'b'); wall.append((x + k, y))
if wall:
    armor.append({'tx': wall[len(wall) // 2][0], 'ty': wall[len(wall) // 2][1], 'kind': 'tetrapod'})
# 섬 방파제: 기존 두꺼운 'b' 팔 → 물, 가는 다리(데크 2칸) + 머리 전체 'b'
arm = [(x, y) for y in range(552, 563) for x in range(630, 645) if at(x, y) == 'b' and not (x >= 638 and y <= 553)]
for (x, y) in arm:
    put(x, y, '~')
x0, y0, x1, y1 = 631, 559, 645, 553
n = max(abs(x1 - x0), abs(y1 - y0))
for i in range(n + 1):
    x = round(x0 + (x1 - x0) * i / n); y = round(y0 + (y1 - y0) * i / n)
    put(x, y, 'D'); put(x, y + 1, 'D')
head = 0
for y in range(536, 566):
    for x in range(637, 663):
        if at(x, y) != '~' and at(x, y) != 'D':
            put(x, y, 'b'); head += 1
armor.append({'tx': 650, 'ty': 540, 'kind': 'tetrapod'})
print(f'[6] 청호동 호안 {len(wall)} · 섬 방파제 머리 {head} · 팔→물 {len(arm)}타일')

# ── 7·8. 185차 — 호수 안 성분 · 크루즈터미널 부두 = 연석 직벽 ───────────────
def pick_b(box):
    x0, y0, x1, y1 = box
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if at(x, y) == 'b':
                return x, y
    return None


for name, box in (('영랑호 서쪽', (94, 16, 109, 33)), ('영랑호 반도·후미', (257, 32, 280, 58)),
                  ('청초호 북안(씨크루저호텔 앞)', (301, 371, 353, 391)),
                  ('속초항 국제크루즈터미널 부두', (514, 241, 554, 268))):
    q = pick_b(box)
    if q is None:
        print(f'[7] {name}: b 타일 없음 — 건너뜀')
        continue
    armor.append({'tx': q[0], 'ty': q[1], 'kind': 'quay'})
    print(f'[7] {name} → 연석 직벽 @ {q}')

# ── 쓰기 ─────────────────────────────────────────────────────────────────
for path in PATCHES:
    p = json.load(open(path, encoding='utf-8'))
    tiles = [t for t in p.get('tiles', []) if (t[0], t[1]) not in edits]
    tiles += [[x, y, c] for (x, y), c in sorted(edits.items())]
    p['tiles'] = tiles
    keys = {(a['tx'], a['ty']) for a in armor}
    p['armor'] = [a for a in p.get('armor', []) if (a['tx'], a['ty']) not in keys] + armor
    ids = {o['id'] for o in overpasses}
    p['overpasses'] = [o for o in p.get('overpasses', []) if o.get('id') not in ids] + overpasses
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(p, f, ensure_ascii=False, separators=(',', ':'))
    print(f'  → {os.path.relpath(path, ROOT)} · tiles {len(tiles)} · armor {len(p["armor"])} · overpasses {len(p["overpasses"])}')
