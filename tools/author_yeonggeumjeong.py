#!/usr/bin/env python3
"""
183차 — 영금정 일대 수동 patch 작성 (GIS 파일럿).

OSM은 이 곶을 '육지/도로/바다'로만 준다. 위성(사용자 캡처 2026-09-28)에는 등대 언덕·정자 언덕(계단 3단)·
갯바위 해안·동명해교(바다 위 다리)·해돋이 바위섬·동명항 방파제(테트라포드는 **우측만**)가 있다.
이 스크립트는 그 구조를 `patch.json`(정본 pixelazed/ + 런타임 public/data/)에 쓴다:
  - tiles  : 'k' 갯바위(걷기 가능) · 'K' 암반 절벽(불가) · 'D' 데크(동명해교) · 잘못 읽힌 'b' 정리 · 정자 '#' 제거
  - levels : 정자 언덕 L1/L2/L3 · 해돋이 바위섬 L1 · 등대 언덕 L1
  - stairs : 정자 전망대 = 수직 ↑ → 좌측 대각선 ↑ → 우측 대각선 ↑ (사용자 지정 경로)
             해돋이 전망대 = 동명해교 건너 → 우측 대각선 ↑
  - props  : 정자 2채(pavilion)
  - armor  : 동명항 방파제 = 테트라포드 · 동쪽(우측)만

재실행 = 멱등(같은 칸을 다시 덮어쓴다). 다른 지역·다른 칸은 건드리지 않는다.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [
    os.path.join(ROOT, 'pixelazed', 'sokcho_v2', 'patch.json'),
    os.path.join(ROOT, 'packages', 'client-pc', 'public', 'data', 'sokcho_v2', 'patch.json'),
]
SEAMLESS = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'data', 'sokcho_v2', 'seamless.json')

def rect(x0, x1, y0, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            yield x, y

def build(terrain):
    tiles = {}
    def T(x, y, ch): tiles[(x, y)] = ch
    def base(x, y): return terrain[y][x]

    # ── ① 북쪽 해안 — 잘못 'b'(방파제)로 읽힌 갯바위 → 'k' (성분 5를 영금정에서 잘라낸다) ──
    for x, y in rect(590, 603, 58, 66):
        if base(x, y) == 'b': T(x, y, 'k')
    for x, y in rect(600, 605, 68, 95):
        if base(x, y) == 'b': T(x, y, 'k')

    # ── ② 등대 언덕 (속초등대 566,84) — 완만한 1층 + 남쪽 계단 ──
    levels = {}
    for x, y in rect(562, 570, 80, 88):
        if base(x, y) in '.,w': levels[(x, y)] = 1; T(x, y, ',')   # 보도 'w'도 언덕에 편입(계단 북쪽 칸이 보도였다)
    stairs = [dict(tx=566, ty=89, dir='n', **{'from': 0, 'to': 1})]
    levels.pop((566, 89), None)

    # ── ③ 정자 언덕 — 도로 끝(582,125)에서 동쪽. L1 → 좌측 대각선 ↑ L2 → 우측 대각선 ↑ L3(정자) ──
    for x, y in rect(585, 591, 122, 125): levels[(x, y)] = 1
    levels[(591, 121)] = 1
    for x, y in rect(586, 589, 117, 121): levels[(x, y)] = 2
    for x, y in rect(590, 591, 117, 120): levels[(x, y)] = 2
    for x, y in [(589, 115), (590, 115), (591, 115), (589, 116), (590, 116), (591, 116), (592, 116), (591, 117), (592, 117)]:
        levels[(x, y)] = 3
    stairs += [
        dict(tx=586, ty=126, dir='n',  **{'from': 0, 'to': 1}),   # 목초지 가장자리 수직 계단
        dict(tx=590, ty=121, dir='nw', **{'from': 1, 'to': 2}),   # 좌측 대각선 위
        dict(tx=590, ty=117, dir='ne', **{'from': 2, 'to': 3}),   # 우측 대각선 위 → 정자
    ]
    for s in stairs: levels.pop((s['tx'], s['ty']), None)
    # 언덕은 목초지(잔디) — 계단 칸·정자 마당은 맨땅
    for (x, y), lv in list(levels.items()):
        if 585 <= x <= 592 and 115 <= y <= 125:
            T(x, y, '.' if lv == 3 else ',')
    for s in stairs: T(s['tx'], s['ty'], '.')
    # OSM 정자 '#'(587~589,124~126 · 598,119~120) 제거 — 정자는 프롭
    for x, y in rect(586, 590, 123, 127):
        if base(x, y) == '#': T(x, y, ',' if (x, y) in levels else '.')
    for x, y in [(598, 119), (598, 120)]:
        T(x, y, 'k')
    props = [
        dict(tx=590, ty=115, id='pavilion'),   # 영금정 정자 전망대 (L3)
        dict(tx=599, ty=119, id='pavilion'),   # 영금정 해돋이 전망대 (바위섬 L1)
    ]

    # ── ④ 갯바위 해안 + 동명해교 + 해돋이 바위섬 ──
    # 물길(inlet) x594~595 · 북면 절벽 K(잘못 읽힌 'b' 다리 자리) · 데크 D는 y125에 놓는다
    for x, y in rect(583, 603, 118, 133):
        if (x, y) in levels or (x, y) in tiles: continue
        if 594 <= x <= 595: T(x, y, '~'); continue
        if base(x, y) in '.b': T(x, y, 'k')
    for x, y in rect(596, 607, 115, 117):
        T(x, y, 'K' if x <= 603 else '~')
    for x in (594, 595): T(x, 125, 'D')
    # 해돋이 바위섬 상단(L1) + 우측 대각선 계단
    for x, y in rect(597, 601, 118, 121): levels[(x, y)] = 1
    for x in (599, 600, 601): levels[(x, 122)] = 1
    stairs.append(dict(tx=598, ty=122, dir='ne', **{'from': 0, 'to': 1}))
    levels.pop((598, 122), None)
    T(598, 122, 'k')

    armor = [dict(tx=598, ty=162, kind='tetrapod', sides=['e'])]   # 동명항 방파제 — 우측(동)만
    return tiles, levels, stairs, props, armor

def main():
    terrain = json.load(open(SEAMLESS, encoding='utf-8'))['terrain']
    tiles, levels, stairs, props, armor = build(terrain)
    box = (556, 612, 56, 182)
    inbox = lambda x, y: box[0] <= x <= box[1] and box[2] <= y <= box[3]
    for t in TARGETS:
        p = json.load(open(t, encoding='utf-8')) if os.path.exists(t) else {}
        p.setdefault('tiles', []); p.setdefault('props', []); p.setdefault('roofs', {})
        keep = [e for e in p['tiles'] if not ((e[0], e[1]) in tiles)]
        p['tiles'] = keep + [[x, y, ch] for (x, y), ch in sorted(tiles.items())]
        p['levels'] = [l for l in p.get('levels', []) if not inbox(l[0], l[1])] + [[x, y, lv] for (x, y), lv in sorted(levels.items())]
        p['stairs'] = [s for s in p.get('stairs', []) if not inbox(s['tx'], s['ty'])] + stairs
        p['props'] = [q for q in p['props'] if not (q.get('id') == 'pavilion' and inbox(int(q['tx']), int(q['ty'])))] + props
        p['armor'] = [a for a in p.get('armor', []) if not inbox(a['tx'], a['ty'])] + armor
        json.dump(p, open(t, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(f"[patch] {os.path.relpath(t, ROOT)} — tiles {len(p['tiles'])} · levels {len(p['levels'])} · stairs {len(p['stairs'])} · props {len(p['props'])} · armor {len(p['armor'])}")
    print(f"[yeonggeumjeong] tiles {len(tiles)} · levels {len(levels)} · stairs {len(stairs)}")

if __name__ == '__main__':
    sys.exit(main())
