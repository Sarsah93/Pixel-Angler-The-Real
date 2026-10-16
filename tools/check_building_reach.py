"""
check_building_reach.py — 258차 건물 윤곽 충돌 도달성 점검(심리스 지역)

건물 충돌이 '#' 칸이 아니라 그림 윤곽(OSM `buildings.json`)을 따르게 되면서(258차),
윤곽 둘이 맞붙은 1칸 틈은 플레이어 몸(14px)이 들어가지 못한다. 이 도구는

  1. 옛 규칙(칸 — 물 · 절벽 · '#' 아래 두 줄)과 새 규칙(윤곽)으로 8px 격자 도달 영역을 각각 채우고
  2. 가게 · 장소 문(게임의 `resolvePoiDoor`와 같은 탐색 — 새 규칙은 몸이 서는 칸만)과
     이야기 인물 자리가 「옛 규칙에서는 닿았는데 새 규칙에서는 안 닿는지」를 센다.

새 지역을 만들거나 윤곽 · 지형을 고친 뒤 돌린다. 게임 코드는 `scenes/SeamlessChunks.ts`
(`unitBodyRects` · `tileFitsBody`)와 `RegionFieldScene.resolvePoiDoor` — 규칙을 바꾸면 여기도 맞춘다.

실행(Pillow · numpy가 있는 파이썬):
  python3.13 -I tools/check_building_reach.py                     # 속초(sokcho_v2) · 동명항 앞에서 채우기
  python3.13 -I tools/check_building_reach.py <데이터 폴더> <씨앗 칸 x> <씨앗 칸 y>
"""
import json
import re
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
D = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'packages/client-pc/public/data/sokcho_v2'
SEED = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (584, 160)
T = json.load(open(D / 'seamless.json'))['terrain']
R, C = len(T), len(T[0])
B = json.load(open(D / 'buildings.json'))
POIS = json.load(open(D / 'pois.json'))
K = 4                      # 칸(32px)당 셀(8px)
T_arr = np.array([list(row) for row in T])


def pip(x, y, pts):
    ins = False
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            ins = not ins
    return ins


# 그려지는 OSM 단위(덮은 '#' 칸이 하나라도 있는 윤곽) · 덮은 칸
cover = np.zeros((R, C), bool)
drawn = []
for b in B:
    p = b['pts']
    xs = [q[0] for q in p]
    ys = [q[1] for q in p]
    mine = []
    for r in range(max(0, int(min(ys))), min(R, int(max(ys)) + 1)):
        for c in range(max(0, int(min(xs))), min(C, int(max(xs)) + 1)):
            if T[r][c] == '#' and not cover[r, c] and pip(c + .5, r + .5, p):
                mine.append((r, c))
    if mine:
        drawn.append(p)
        for r, c in mine:
            cover[r, c] = True

hash_ = T_arr == '#'
left = hash_ & ~cover                      # 윤곽이 맡지 않은 '#'(타일 윤곽 단위 · 외딴 칸) — 근사: 옛 규칙 그대로
water = (T_arr == '~') | (T_arr == 'K')
below1 = np.vstack([hash_[1:], np.zeros((1, C), bool)])
below2 = np.vstack([hash_[2:], np.zeros((2, C), bool)])
old_tile = water | (hash_ & (~below1 | ~below2))
new_tile = water | (left & (~below1 | ~below2))


def up(m):
    return np.kron(m, np.ones((K, K), bool))


img = Image.new('1', (C * K, R * K), 0)
dr = ImageDraw.Draw(img)
for p in drawn:
    dr.polygon([(x * K, y * K) for x, y in p], fill=1)
poly = np.array(img, bool)
old = up(old_tile)
new = up(new_tile) | poly


def dilate(m):
    o = m.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o


def reach(block):
    free = ~dilate(block)
    im = Image.fromarray((free * 255).astype(np.uint8)).copy()   # ⚠ copy — fromarray 그대로면 floodfill이 반영되지 않는다
    sx, sy = SEED[0] * K + 2, SEED[1] * K + 2
    if not free[sy, sx]:
        sys.exit(f'씨앗 칸 {SEED}이 막혀 있다 — 다른 칸을 준다')
    ImageDraw.floodfill(im, (sx, sy), 128)
    return np.array(im) == 128


def box_clear(cx, cy, h=7):
    for dx in (-h, 0, h):
        for dy in (-h, 0, h):
            x, y = int((cx + dx) / 8), int((cy + dy) / 8)
            if 0 <= y < R * K and 0 <= x < C * K and poly[y, x]:
                return False
    return True


def stands(c, r):
    """칸 안 어딘가(중심 · 상하좌우 8px)에 몸(14px)이 윤곽에 닿지 않고 서는가 — `tileFitsBody`"""
    cx, cy = c * 32 + 16, r * 32 + 16
    return any(box_clear(cx + dx, cy + dy) for dx, dy in ((0, 0), (8, 0), (-8, 0), (0, 8), (0, -8)))


def door_of(tx, ty, new_rule):
    """`resolvePoiDoor` — '#'이 아니면 그 칸, 아니면 12칸 안 맨땅 · 보도 · 잔디(남쪽이 차도 아님) → 아무 걷는 칸"""
    ok = (lambda c, r: stands(c, r)) if new_rule else (lambda c, r: True)
    if T[ty][tx] != '#' and ok(tx, ty):
        return tx, ty
    seen = {(tx, ty)}
    q = deque([(tx, ty, 0)])
    anyw = None
    while q:
        c, r, d = q.popleft()
        if d > 12:
            break
        ch = T[r][c]
        if ch in '.w,' and (r + 1 >= R or T[r + 1][c] != 'r') and ok(c, r):
            return c, r
        if anyw is None and ch not in '#~K' and ok(c, r):
            anyw = (c, r)
        for dc, dr_ in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nc, nr = c + dc, r + dr_
            if 0 <= nc < C and 0 <= nr < R and (nc, nr) not in seen:
                seen.add((nc, nr))
                q.append((nc, nr, d + 1))
    return anyw or (tx, ty)


def near(rr, tx, ty, rad=5):
    cx, cy = tx * K + 2, ty * K + 2
    return rr[max(0, cy - rad):cy + rad + 1, max(0, cx - rad):cx + rad + 1].any()


ro, rn = reach(old), reach(new)
print(f'그리는 윤곽 {len(drawn)} · 닿는 8px 셀 옛 {ro.sum():,} → 새 {rn.sum():,}')
pts = [('poi', q.get('name') or q['type'], *(q['door'] if q.get('door') else (q['tx'], q['ty'])), bool(q.get('door'))) for q in POIS]
src = (ROOT / 'packages/client-pc/src/data/StoryNpcs.ts').read_text(encoding='utf-8')
region = json.load(open(D / 'meta.json')).get('regionId', 'gangwon_sokcho')
for m in re.finditer(r"npcId: '([^']+)', regionId: '" + re.escape(region) + r"', tx: (\d+), ty: (\d+)", src):
    pts.append(('npc', m.group(1), int(m.group(2)), int(m.group(3)), True))
lost, moved = [], 0
for kind, name, tx, ty, fixed in pts:
    if kind == 'poi' and not fixed:
        o, n = door_of(tx, ty, False), door_of(tx, ty, True)
        moved += o != n
    else:
        o = n = (tx, ty)
    if near(ro, *o) and not near(rn, *n):
        lost.append((kind, name, o, n))
print(f'문 자리가 바뀐 곳 {moved} · 옛 규칙에서 닿다가 새 규칙에서 안 닿는 곳 {len(lost)}')
for x in lost:
    print('  ', x)
