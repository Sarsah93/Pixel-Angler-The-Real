# -*- coding: utf-8 -*-
"""오픈소스/생성 타일셋 → 게임 소비 스프라이트 추출기 (101차 후속 — Pillow).

입력  pixelazed/tileset/
  Gemini generated and edited/*.png   개별 스프라이트 → 알파 bbox 트림 → public/tileset/gem/<slug>.png
  TopDownCityPack/Sprites/Tiles.png   비격자 시트 → 알파 연결요소 검출 → 인덱스 컨택트시트 + 선택 크롭
  Roguelike Modern City pack/…/roguelikeCity_transparent.png  16px+1px 마진 격자 → (col,row) 셀 크롭

사용법
  py tools/extract_tileset_assets.py survey    # 컨택트시트만 생성 (scratch/ 폴더) — 좌표 선정용
  py tools/extract_tileset_assets.py build     # SELECTION 표대로 public/tileset/ 에 스프라이트 출력

출력 스프라이트는 원본 해상도 그대로(재샘플 없음). 배치 스케일은 클라이언트(PROP_DEFS.scale)가 정한다.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
TS = ROOT / 'pixelazed' / 'tileset'
OUT = ROOT / 'packages' / 'client-pc' / 'public' / 'tileset'
SCRATCH = ROOT / 'pixelazed' / 'tileset' / '_survey'

GEMINI = {
    'buildings_1.png': 'building_1', 'buildings_2.png': 'building_2', 'buildings_3.png': 'building_3',
    'buildings_4.png': 'building_4', 'buildings_5.png': 'building_5',
    'popup store_1.png': 'popup_1', 'popup store_2.png': 'popup_2',
    'popup store_3.png': 'popup_3', 'popup store_4.png': 'popup_4',
    'sashimi store_1.png': 'sashimi_1', 'sashimi store_2.png': 'sashimi_2',
    'jungja.png': 'jungja', 'tetra.png': 'tetra', 'boundary port with sea.png': 'boundary_port',
    'fish bandors.png': 'npc_fish_vendor', 'grandfather.png': 'npc_grandfather',
    'police officer.png': 'npc_police', 'father with a kid.png': 'npc_father_kid',
    'tourist female.png': 'npc_tourist_f',
}

# TopDownCityPack 연결요소 인덱스 → 이름 (survey 컨택트시트 `_survey/topdown_components.png` 기준)
TOPDOWN_PICK = {
    29: 'tree_big', 16: 'palm', 17: 'tree_small',
    25: 'lamp_arm', 26: 'lamp_arm2', 27: 'pole', 28: 'pole2',
    21: 'traffic_light', 23: 'traffic_light_stop', 22: 'signpost', 24: 'signpost_red',
    31: 'sign_warn', 32: 'sign_blue', 33: 'sign_round',
    39: 'bench', 40: 'trash', 41: 'hydrant',
    # ── 12px 격자 좌표 직접 지정 (`_survey/topdown_tiles_zoom.png` 기준 — 101차 후속 4: 연결요소 크롭은
    #    지붕 연장 조각(0행)과 펜스 세트가 붙어 나와 오류였다) ──
    (216, 12, 288, 96): 'house_red',      # 주택(빨강) = 열 18~23 × 행 1~7 (6×7)
    (288, 12, 360, 96): 'house_blue',     # 주택(파랑) = 열 24~29 × 행 1~7
    (216, 0, 288, 12): 'roof_ext_red',    # 0행 = 지붕 연장 조각(층 올릴 때)
    (288, 0, 360, 12): 'roof_ext_blue',
    (60, 48, 108, 72): 'fence_h',         # 철망 펜스 가로 4칸×2 (구 '차고' 오독 — 펜스 세트)
    (60, 72, 72, 108): 'fence_v1', (72, 72, 84, 108): 'fence_v2',
    (84, 72, 96, 108): 'fence_v3', (96, 72, 108, 108): 'fence_v4',   # 세로 기둥/문 1칸×3
    (240, 108, 264, 132): 'door_blue', (276, 108, 300, 132): 'door_brown', (312, 108, 336, 132): 'door_white',
    (0, 228, 24, 240): 'ac_unit',         # 옥상 실외기 2×1
}
# Kenney 건물 키트 (정규화 시트 16px 셀) — 지붕 = 색상 블록당 3×3 오토타일 + 무지/환기구,
#  벽 = 행 11~12의 4칸×2줄 모듈 (창문 포함) → 컴포넌트 하단 2줄(충돌 줄)에 가로 반복
KENNEY_ROOF_COLORS = {'red': 0, 'gray': 8, 'light': 16, 'tan': 24}
#  p1/p2 = 행 2~3의 2×2 옥상 패널 블록 (지붕 인테리어 타일링 변형 — 101차 잔여 "지붕 Kenney 타일링").
#  ⚠ 블록 경계 실측(roofpanel_zoom): 열 0 = 세로 1×2 패널 · 열 1~3 = 와이드 패널 — 2×2 정합 블록은
#  열 4~5(테두리 패널)·열 6~7(코너 노치 패널)뿐. 열 0~3을 2×2로 묶으면 파편 합성("05" 오독)이 된다.
KENNEY_ROOF_PARTS = {'nw': (0, 0), 'ne': (1, 0), 'sw': (0, 1), 'se': (1, 1),
                     'n': (2, 0), 's': (2, 1), 'w': (3, 0), 'e': (3, 1), 'in': (4, 0), 'vent': (6, 1),
                     'p1_nw': (4, 2), 'p1_ne': (5, 2), 'p1_sw': (4, 3), 'p1_se': (5, 3),
                     'p2_nw': (6, 2), 'p2_ne': (7, 2), 'p2_sw': (6, 3), 'p2_se': (7, 3)}
KENNEY_WALLS = {'brick_red': 0, 'brick_gray': 4, 'brick_tan': 8, 'glass': 12, 'white': 16}
# Kenney 정규화 시트 연결요소 인덱스(또는 bbox 튜플) → 이름 (`_survey/kenney_components.png` 기준)
#  차량: 36×24 = 측면(가로 진행) · 22×29 = 탑다운(세로 진행 — 도로 각도로 회전해 배치)
KENNEY_PICK = {
    102: 'car_a', 103: 'car_b', 126: 'car_c', 127: 'car_d', 151: 'car_e', 152: 'car_f',   # 측면 (초록·회색·주황)
    116: 'car_g', 117: 'car_h', 139: 'car_i', 140: 'car_j', 164: 'car_k', 165: 'car_l',   # 탑다운
    # 노점 = 줄무늬 차양 + 진열대 (컴포넌트 0에 붙어 있어 bbox 직접 지정 — 정규화 시트 좌표)
    (368, 148, 432, 222): 'stall_green', (432, 148, 496, 222): 'stall_orange',
    19: 'ktree_a', 21: 'ktree_b', 22: 'ktree_c', 39: 'ktree_d', 40: 'ktree_e', 41: 'ktree_f',
    69: 'klamp', 70: 'klamp2', 29: 'ktrash',
}


def trim(im):
    a = im.split()[-1]
    bbox = a.point(lambda v: 255 if v > 8 else 0).getbbox()
    return im.crop(bbox) if bbox else im


def components(im, min_px=6):
    """알파 연결요소(8-연결) bbox 목록 — 시트에서 붙어 있지 않은 스프라이트 단위."""
    w, h = im.size
    a = im.split()[-1].load()
    seen = bytearray(w * h)
    comps = []
    for y in range(h):
        for x in range(w):
            if seen[y * w + x] or a[x, y] <= 8:
                continue
            dq = deque([(x, y)]); seen[y * w + x] = 1
            x0 = x1 = x; y0 = y1 = y; n = 0
            while dq:
                cx, cy = dq.popleft(); n += 1
                x0 = min(x0, cx); x1 = max(x1, cx); y0 = min(y0, cy); y1 = max(y1, cy)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and a[nx, ny] > 8:
                            seen[ny * w + nx] = 1; dq.append((nx, ny))
            if n >= min_px:
                comps.append((x0, y0, x1 + 1, y1 + 1))
    comps.sort(key=lambda b: (b[1] // 24, b[0]))
    return comps


def kenney_sheet():
    """Kenney 시트 정규화 — 'transparent' 판도 마젠타(#ff00ff) 배경 + 매 17px 마진선이다.
    마젠타 → 투명 키잉 후 마진 행/열(x%17==16, y%17==16)을 제거해 16px 스트라이드 무마진 시트로."""
    kn = Image.open(TS / 'Roguelike Modern City pack' / 'Spritesheet' / 'roguelikeCity_transparent.png').convert('RGBA')
    px = kn.load()
    for y in range(kn.height):
        for x in range(kn.width):
            r, g, b, a = px[x, y]
            if r > 230 and g < 40 and b > 230:
                px[x, y] = (0, 0, 0, 0)
    cols = (kn.width + 1) // 17; rows = (kn.height + 1) // 17
    out = Image.new('RGBA', (cols * 16, rows * 16), (0, 0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            out.paste(kn.crop((c * 17, r * 17, c * 17 + 16, r * 17 + 16)), (c * 16, r * 16))
    return out


def survey():
    SCRATCH.mkdir(parents=True, exist_ok=True)
    # Kenney — 정규화 시트 연결요소 컨택트시트
    kns = kenney_sheet()
    kns.save(SCRATCH / 'kenney_normalized.png')
    kcomps = components(kns, min_px=12)
    Z = 3
    sheet = Image.new('RGBA', (kns.width * Z, kns.height * Z), (40, 40, 48, 255))
    big = kns.resize((kns.width * Z, kns.height * Z), Image.NEAREST)
    sheet.paste(big, (0, 0), big)
    d = ImageDraw.Draw(sheet)
    for i, (x0, y0, x1, y1) in enumerate(kcomps):
        d.rectangle([x0 * Z, y0 * Z, x1 * Z - 1, y1 * Z - 1], outline=(255, 80, 80, 255))
        d.text((x0 * Z + 1, y0 * Z + 1), str(i), fill=(255, 255, 0, 255))
    sheet.save(SCRATCH / 'kenney_components.png')
    with open(SCRATCH / 'kenney_components.txt', 'w', encoding='utf-8') as f:
        for i, b in enumerate(kcomps):
            f.write(f'{i}\t{b}\t{b[2]-b[0]}x{b[3]-b[1]}\n')
    print(f'[kenney] {len(kcomps)} components → {SCRATCH / "kenney_components.png"}')
    # TopDown — 연결요소 컨택트시트 (3배 확대 + 인덱스)
    td = Image.open(TS / 'TopDownCityPack' / 'Sprites' / 'Tiles.png').convert('RGBA')
    comps = components(td)
    Z = 3
    sheet = Image.new('RGBA', (td.width * Z, td.height * Z), (40, 40, 48, 255))
    sheet.paste(td.resize((td.width * Z, td.height * Z), Image.NEAREST), (0, 0), td.resize((td.width * Z, td.height * Z), Image.NEAREST))
    d = ImageDraw.Draw(sheet)
    for i, (x0, y0, x1, y1) in enumerate(comps):
        d.rectangle([x0 * Z, y0 * Z, x1 * Z - 1, y1 * Z - 1], outline=(255, 80, 80, 255))
        d.text((x0 * Z + 1, y0 * Z + 1), str(i), fill=(255, 255, 0, 255))
    sheet.save(SCRATCH / 'topdown_components.png')
    with open(SCRATCH / 'topdown_components.txt', 'w', encoding='utf-8') as f:
        for i, b in enumerate(comps):
            f.write(f'{i}\t{b}\t{b[2]-b[0]}x{b[3]-b[1]}\n')
    print(f'[topdown] {len(comps)} components → {SCRATCH / "topdown_components.png"}')
    # Kenney — 격자 셀 라벨 (col,row)
    kn = Image.open(TS / 'Roguelike Modern City pack' / 'Spritesheet' / 'roguelikeCity_transparent.png').convert('RGBA')
    cols = (kn.width + 1) // 17; rows = (kn.height + 1) // 17
    sheet = Image.new('RGBA', (kn.width * Z, kn.height * Z), (40, 40, 48, 255))
    big = kn.resize((kn.width * Z, kn.height * Z), Image.NEAREST)
    sheet.paste(big, (0, 0), big)
    d = ImageDraw.Draw(sheet)
    for r in range(rows):
        for c in range(cols):
            x, y = c * 17, r * 17
            d.rectangle([x * Z, y * Z, (x + 16) * Z - 1, (y + 16) * Z - 1], outline=(255, 0, 255, 90))
            if c % 2 == 0 and r % 2 == 0:
                d.text((x * Z + 1, y * Z + 1), f'{c},{r}', fill=(255, 255, 0, 255))
    sheet.save(SCRATCH / 'kenney_grid.png')
    print(f'[kenney] {cols}x{rows} cells → {SCRATCH / "kenney_grid.png"}')




# ── Gemini 생성본 도트화 (106차) ─────────────────────────────────────────────
# 사용자 지시 5: "타일·오브젝트 간 픽셀레이션·해상도·밝기 정합을 맞춰라".
# 실측: Kenney 지면 = 16px ×2(2px 입자·8~16색) · TopDown = 네이티브 도트(3~9색) ·
#       **Gemini 생성본만 1px 입자에 15,000~24,000색** = 혼자 렌더링 그림처럼 보였다.
# → 같은 2px 입자 + 소수 팔레트로 다시 구워 도트 문법에 맞춘다(원본은 그대로 보존).
GEM_GRAIN = 2
GEM_COLORS = 22          # 팔레트 색 수 — Kenney 셀(8~16)과 TopDown(3~9) 사이


def gem():
    """`Gemini generated and edited/*` → public/tileset/gem/*.png (트림 + 2px 도트 리베이크)."""
    (OUT / 'gem').mkdir(parents=True, exist_ok=True)
    n = 0
    for fname, slug in GEMINI.items():
        p = TS / 'Gemini generated and edited' / fname
        if not p.exists():
            print(f'  ⚠ 없음: {fname}'); continue
        im = trim(Image.open(p).convert('RGBA'))
        # 짝수로 맞춰야 2px 입자가 딱 떨어진다 (홀수면 마지막 열/행이 1px 입자로 남는다)
        w, h = im.width - im.width % GEM_GRAIN, im.height - im.height % GEM_GRAIN
        out = _clean(im.crop((0, 0, max(GEM_GRAIN, w), max(GEM_GRAIN, h))), (max(GEM_GRAIN, w), max(GEM_GRAIN, h)),
                     k=GEM_COLORS, grain=GEM_GRAIN)
        out.save(OUT / 'gem' / f'{slug}.png')
        n += 1
    print(f'[gem] {n} sprites → {OUT / "gem"}')


def build():
    (OUT / 'gem').mkdir(parents=True, exist_ok=True)
    (OUT / 'td').mkdir(parents=True, exist_ok=True)
    (OUT / 'kn').mkdir(parents=True, exist_ok=True)
    gem()
    td = Image.open(TS / 'TopDownCityPack' / 'Sprites' / 'Tiles.png').convert('RGBA')
    comps = components(td)
    for idx, name in TOPDOWN_PICK.items():
        if isinstance(idx, tuple):   # (x0,y0,x1,y1) 직접 지정
            box = idx
        else:
            box = comps[idx]
        im = trim(td.crop(box))
        im.save(OUT / 'td' / f'{name}.png')
        print(f'  td/{name}.png {im.width}x{im.height}')
    kns = kenney_sheet()
    kcomps = components(kns, min_px=12)
    for idx, name in KENNEY_PICK.items():
        box = idx if isinstance(idx, tuple) else kcomps[idx]
        im = trim(kns.crop(box))
        im.save(OUT / 'kn' / f'{name}.png')
        print(f'  kn/{name}.png {im.width}x{im.height}')
    # TopDown 차량 — 세로 시트 4프레임 (0 = 우측면 · 1 = 정면(아래) · 2 = 좌측면 · 3 = 후면(위)).
    #  승용차 시트는 배경이 불투명 흰색 → 테두리 연결 흰 배경만 투명화 (픽업은 투명)
    VEH = {'sBlueCar': ('car', 'blue', 48), 'sGreenCar': ('car', 'green', 48), 'sRedCar': ('car', 'red', 48),
           'sBluePickup': ('pickup', 'blue', 60), 'sGreenPickup': ('pickup', 'green', 60), 'sRedPickup': ('pickup', 'red', 60)}
    DIRS = ['right', 'down', 'left', 'up']
    for fname, (kind, color, fh) in VEH.items():
        p = TS / 'TopDownCityPack' / 'Sprites' / 'Vehicles' / f'{fname}.png'
        if not p.exists():
            continue
        sheet = Image.open(p).convert('RGBA')
        for i, d in enumerate(DIRS):
            fr = sheet.crop((0, i * fh, sheet.width, i * fh + fh))
            px = fr.load(); w, h = fr.size
            # 흰 배경 키잉 — 테두리에서 시작하는 BFS (차체 안 흰색은 보존)
            seen = bytearray(w * h)
            dq = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
            while dq:
                x, y = dq.popleft()
                if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]:
                    continue
                seen[y * w + x] = 1
                r, g, b, a = px[x, y]
                if a > 8 and not (r > 235 and g > 235 and b > 235):
                    continue
                px[x, y] = (0, 0, 0, 0)
                dq.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
            trim(fr).save(OUT / 'td' / f'{kind}_{color}_{d}.png')
        print(f'  td/{kind}_{color}_[right|down|left|up].png')
    # 건물 키트 — 트림 없이 셀 그대로 (격자 정합)
    for color, c0 in KENNEY_ROOF_COLORS.items():
        for part, (dc, dr) in KENNEY_ROOF_PARTS.items():
            c, r = c0 + dc, dr
            kns.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16)).save(OUT / 'kn' / f'roof_{color}_{part}.png')
        print(f'  kn/roof_{color}_*.png (10)')
    for name, c0 in KENNEY_WALLS.items():
        kns.crop((c0 * 16, 11 * 16, c0 * 16 + 64, 13 * 16)).save(OUT / 'kn' / f'wall_{name}.png')
        print(f'  kn/wall_{name}.png 64x32')
    print(f'[done] → {OUT}')


# Kenney 지면 셀 (정규화 시트 16px 격자 (col,row) — `_survey/kenney_ground_zoom.png` 기준, 수동 확정)
#  자동 색 통계 선별은 환기구·균열 무늬 셀을 잡아 반복 패턴이 생겼다(101차 후속 실측) → 명시 표.
#  ⚠ 셀 가장자리 1px 밝기 분석(테두리 판정)으로 **무테(interior) 셀만** 고른다 — 테두리가 든 셀을 섞으면
#    지형 한복판에 무작위 경계선이 생긴다(101차 후속 리포트). 경계선은 클라이언트가 지형 접경에서만 그린다.
GROUND_CELLS = {
    'asphalt': [(11, 19)],                       # 차도 — 완전 무지 ((10,19)/(10,20)/(14,21)은 차선 포함)
    'grass':   [(1, 26), (3, 26)],               # 잔디 — 무테 ((0,26)/(2,26)은 측면 밝기 변형)
    'dirt':    [(4, 24), (5, 24)],               # 흙 — 예비 (현재 미사용)
    #  행 21은 균열 변형(내부 밝기 −8~−9)이 섞여 있다 — 내부 밝기까지 같은 셀만 (블록 기준값 ±2)
    #  행 22 셀은 13행에 밝은 모르타르 줄(228)이 있어 "타일 위쪽 흰 선"으로 보인다(리포트 5.1) → 제외.
    #  행별 밝기 프로파일이 4행 주기로 완전히 반복되는 셀만(자기 타일링 무이음).
    'pave':    [(1, 20)],                        # 보도 — 회색 벽돌, 무테·주기 반복
    'tan':     [(4, 20), (5, 21)],               # 맨땅 — 베이지 포장, 무테·무균열
    'sand':    [(6, 24), (7, 24)],               # 모래사장 — 크림 모래
    'pier':    [(7, 20), (8, 21)],               # 방파제·부두 — 청회색 포장, 무테
}


# 오토타일 엣지/코너 셀 (접미 = 다른 지형이 보이는 방위 — client SeamlessChunks EDGE_SUFFIX와 정합).
#  잔디(행 25~27) = **유기 블롭 완전 세트**(모서리 4·변 4·띠 2·캡 4·섬 1) + 이너코너 노치 4
#    (노치 = 흙 블롭의 바깥 모서리 셀을 역이용 — 잔디 타일의 대각만 다른 군일 때).
#    셀 방위는 픽셀 색 분류로 실측(2026-09-01) — 흙 테두리가 "구워진" 불투명 셀이라 아무 지면 위에서나
#    흙 가장자리 림으로 보인다(잔디밭 흙 테두리 — 의도).
#  포장(pave/tan/pier — 행 19~23) = 어두운 테두리 셰이딩 변형(행 19 상단·행 23 하단 그림자·열 0/2 좌우).
EDGE_CELLS = {
    'grass': {
        'n': (1, 25), 'e': (2, 26), 's': (1, 27), 'w': (0, 26),
        'nw': (0, 25), 'ne': (2, 25), 'sw': (0, 27), 'se': (2, 27),
        'ns': (19, 25), 'we': (19, 26),
        'nse': (17, 25), 'nsw': (18, 25), 'nwe': (17, 26), 'swe': (18, 26),
        'nswe': (13, 25),
        'notch_ne': (10, 27), 'notch_nw': (12, 27), 'notch_se': (10, 25), 'notch_sw': (12, 25),
    },
    'pave': {'n': (1, 19), 's': (1, 23), 'w': (0, 20), 'e': (2, 20),
             'nw': (0, 19), 'ne': (2, 19), 'sw': (0, 23), 'se': (2, 23)},
    'tan':  {'n': (4, 19), 's': (4, 23), 'w': (3, 20), 'e': (5, 20),
             'nw': (3, 19), 'ne': (5, 19), 'sw': (3, 23), 'se': (5, 23)},
    'pier': {'n': (7, 19), 's': (7, 23), 'w': (6, 20), 'e': (8, 20),
             'nw': (6, 19), 'ne': (8, 19), 'sw': (6, 23), 'se': (8, 23)},
}


def ground():
    """Kenney 지면 타일 — GROUND_CELLS 명시 셀 + EDGE_CELLS 오토타일 셀을 16px 그대로 출력
    (TR 32 = ×2 정수 배율)."""
    (OUT / 'kn').mkdir(parents=True, exist_ok=True)
    kns = kenney_sheet()
    for key, cells in GROUND_CELLS.items():
        for i, (c, r) in enumerate(cells):
            im = kns.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16))
            im.save(OUT / 'kn' / f'ground_{key}_{i}.png')
            print(f'  kn/ground_{key}_{i}.png  cell=({c},{r})')
    for key, cells in EDGE_CELLS.items():
        for suf, (c, r) in cells.items():
            im = kns.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16))
            im.save(OUT / 'kn' / f'ground_{key}_edge_{suf}.png')
        print(f'  kn/ground_{key}_edge_*.png  {len(cells)}cells')


def zoom():
    """Kenney 정규화 시트의 지면 영역(행 18~27 · 열 0~23)을 4배 + 셀 라벨로 — 지면 셀 수동 선정용."""
    SCRATCH.mkdir(parents=True, exist_ok=True)
    kns = kenney_sheet()
    c0, c1, r0, r1 = 0, 24, 18, 28
    Z = 4
    crop = kns.crop((c0 * 16, r0 * 16, c1 * 16, r1 * 16))
    sheet = Image.new('RGBA', (crop.width * Z, crop.height * Z), (40, 40, 48, 255))
    big = crop.resize((crop.width * Z, crop.height * Z), Image.NEAREST)
    sheet.paste(big, (0, 0), big)
    d = ImageDraw.Draw(sheet)
    for r in range(r0, r1):
        for c in range(c0, c1):
            x, y = (c - c0) * 16 * Z, (r - r0) * 16 * Z
            d.rectangle([x, y, x + 16 * Z - 1, y + 16 * Z - 1], outline=(255, 0, 255, 120))
            d.text((x + 2, y + 2), f'{c},{r}', fill=(255, 255, 0, 255))
    sheet.save(SCRATCH / 'kenney_ground_zoom.png')
    print(f'[zoom] → {SCRATCH / "kenney_ground_zoom.png"}')


def contact():
    """출력 스프라이트 전수 컨택트시트 (2배 확대 + 이름) — 크롭 검수용."""
    SCRATCH.mkdir(parents=True, exist_ok=True)
    items = sorted(OUT.rglob('*.png'))
    Z = 2
    cell_w, cell_h = 170, 150
    cols = 8
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell_w, rows * cell_h), (40, 40, 48, 255))
    d = ImageDraw.Draw(sheet)
    for i, p in enumerate(items):
        im = Image.open(p).convert('RGBA')
        s = min(Z, (cell_w - 6) / im.width, (cell_h - 20) / im.height)
        im2 = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.NEAREST)
        x = (i % cols) * cell_w + 3; y = (i // cols) * cell_h + 3
        sheet.paste(im2, (x, y), im2)
        d.text((x, y + cell_h - 18), f'{p.parent.name}/{p.stem} {im.width}x{im.height}', fill=(255, 255, 0, 255))
    sheet.save(SCRATCH / 'output_contact.png')
    print(f'[contact] {len(items)} sprites → {SCRATCH / "output_contact.png"}')




# ══════════════════════════════════════════════════════════════════════════════
# TTP (테트라포드) 시트 — pixelazed/tileset/1.png · 2.png (사용자 제작 목업 컨택트시트)
# ══════════════════════════════════════════════════════════════════════════════
# ⚠ 두 PNG는 "타일 시트"가 아니라 **라벨이 붙은 목업 스크린샷**이다 — 셀 간격이 불균일하고
#   JPEG류 압축 노이즈가 있다(72×72 스프라이트 1장에 고유색 1,531개 실측). 그래서
#   ① 검은 테두리선으로 셀 경계를 실측(아래 표) → ② 내부만 크롭 → ③ 목표 크기로 area 리샘플
#   (노이즈 평균화) → ④ k-means 팔레트 양자화(도트 복원) 순서로 굽는다.
#
# 셀 경계 실측 방법: 배경(45,45,45) 위 근검정(max<45) 행/열 비율 > 0.5 인 선을 스캔.
#   sheet1 → 열 [5,61,115] [129,184,240,296,351] [364,420,475] / [6,62,117], 행 [49,110] [151,202,254]
#   sheet2 → 타일 상하 테두리 행 14·80, 열 [46,112][134,200][223,289][343,410][431,498,562][577,643]
#   투명 TTP = 알파<255 영역 bbox (679,34)-(750,105) 72×72 (알파 이진 — 유일하게 깨끗한 원본)

TTP_TILE = 32          # 심리스 타일 스트라이드(TR) — 1:1로 굽는다(런타임 재샘플 없음)
# 도트 입자 2px — Kenney 지면(16px ×2)·물 디더와 통일(106차). 1px 입자는 혼자 촘촘해 튄다
TTP_GRAIN = 2
# 게임 모래 발색과 맞추는 웜 틴트 — SeamlessChunks.ensureGroundTextures 의 's' 틴트와 **동일 값**
# (Kenney sand(크림)와 tan 포장이 육안 구분 불가라 103차에 도입. 값이 바뀌면 양쪽 같이 고칠 것)
TTP_SAND_TINT = (0xf6, 0xd4, 0x7c)

# (x0, y0, x1, y1) — 테두리선 안쪽 내부 영역 (end-exclusive)
TTP_SHEET1 = {
    # "TTP Base to Still Water Edge" — 모래(북)↔잔잔한 물(남) 접경 + 물 연속 셀
    'edge_still':  (6, 50, 61, 110),
    'water_still2': (62, 50, 115, 110),
    # "TTP Base to Ripple Edge" — 접경 + 잔물결 물 2변형 + 포말 접경
    'edge_ripple': (130, 50, 184, 110),
    'water_rip1':  (185, 50, 240, 110),
    'water_rip2':  (241, 50, 296, 110),
    'edge_foam':   (297, 50, 351, 110),
    # "TTP Base to Coastal Foam Edge"
    'edge_foam2':  (366, 50, 420, 110),
    'water_foam':  (421, 50, 475, 110),
    # "TTP Base Corner meet (Foam and Still)" — 2×2 코너 조합 (모래가 북서 사분면)
    'corner_land': (7, 152, 62, 202),
    'corner_ne':   (63, 152, 117, 202),
    'corner_sw':   (7, 203, 62, 254),
    'corner_se':   (63, 203, 117, 254),
}
TTP_SHEET2 = {
    'water_still':  (48, 16, 112, 80),
    'water_ripple': (136, 16, 200, 80),
    'water_splash': (225, 16, 289, 80),
    'tile_ttp_a':   (345, 16, 409, 80),   # 콘크리트 베이스 위 TTP (불투명 타일)
    'tile_ttp_b':   (433, 16, 498, 80),
    'base_concrete': (500, 16, 561, 80),
    'base_sand':    (579, 16, 642, 80),
}
TTP_SPRITE_BOX = (679, 34, 751, 106)      # 투명 TTP 72×72 (알파 이진)
# 배치 크기 = 타일 배수. l=1.75타일(구 gem tetra와 동일 체적) · m/s = 피복 유닛
# 106차 — 사용자 지시 "테트라포드는 2×2가 아니라 1×1". 배치 단위 = 1타일(32px).
#   촘촘히 쌓는 연출은 편집기의 **겹침 허용** 자유 배치로 만든다.
TTP_SPRITE_SIZES = {'l': 32, 'm': 24, 's': 18}


def _kmeans_palette(rgb, mask, k, iters=28):
    """결정적 k-means — 초기 중심 = 적응 팔레트(median cut) 상위 k색 (rng 미사용)."""
    pts = rgb[mask].astype(float)
    if len(pts) == 0:
        return None
    uniq = np.unique(pts.astype(int), axis=0)
    k = int(min(k, len(uniq)))
    seed_im = Image.fromarray(pts.reshape(-1, 1, 3).astype(np.uint8), 'RGB')
    pal = seed_im.quantize(colors=k, method=Image.MEDIANCUT).getpalette()[:k * 3]
    cen = np.array(pal, dtype=float).reshape(k, 3)
    for _ in range(iters):
        lab = ((pts[:, None, :] - cen[None, :, :]) ** 2).sum(2).argmin(1)
        for j in range(k):
            sel = pts[lab == j]
            if len(sel):
                cen[j] = sel.mean(0)
    return cen


def _sand_tinted(cen):
    """팔레트 중심 중 '모래'(따뜻한 밝은 베이지: r>g>b · 명도 높음)만 게임 웜 틴트로 곱한다.
    물/포말/콘크리트는 그대로 — 타일 전체 틴트는 바다까지 노랗게 만든다."""
    out = cen.copy()
    for i, (r, g, b) in enumerate(cen):
        # 젖은 모래·갯벌은 압축 평균으로 거의 무채색이 된다(실측 158,155,148) — 문턱을 넓게 잡아
        # 함께 웜 틴트해야 마른 모래(골든)와 한 벌로 읽힌다. 물(g>r)·콘크리트(r<=g)는 걸리지 않는다.
        if r >= g >= b and r > 120 and (r - b) >= 5:
            out[i] = [r * TTP_SAND_TINT[0] / 255, g * TTP_SAND_TINT[1] / 255, b * TTP_SAND_TINT[2] / 255]
    return out


def _is_water(c):
    """팔레트 중심이 '바다'인가 — 청록 우세(b가 r보다 뚜렷이 큼) + 포말만큼 밝지는 않음.
    포말(최소 채널 > 170)은 물이 아니다(접경 셀에서 남겨야 하는 알맹이)."""
    r, g, b = c
    return b > r + 18 and min(r, g, b) <= 170


def _water_frac(im):
    """셀에서 '바다' 팔레트에 해당하는 픽셀 비율 — 물 섞인 셀 자동 판정(106차)."""
    a = np.array(im.convert('RGBA')).astype(int)
    rgb, al = a[:, :, :3].reshape(-1, 3), a[:, :, 3].reshape(-1)
    m = al > 128
    if m.sum() == 0:
        return 0.0
    wet = np.array([_is_water(c) for c in rgb[m]])
    return float(wet.mean())


def _clean(im, size, k=6, sand_tint=False, resample=Image.BOX, cut_water=False, match=None, grain=1):
    """크롭 → 목표 크기 리샘플(노이즈 평균) → 팔레트 양자화(도트 복원). 알파는 이진 유지.

    cut_water=True 면 '바다' 팔레트 색을 **투명**으로 판다 — 접경 셀을 게임 물 타일 위에
    얹는 **오버레이**로 쓰기 위해서다. 시트의 청록(73,150,156)은 게임 수심 램프(연한 파랑)와
    달라, 통짜로 깔면 접경마다 사각 색 패치가 생긴다(실렌더 확인). 모래·젖은모래·포말만 남긴다.

    grain=N 이면 **size/N 로 굽고 NEAREST ×N 확대** — 도트 입자를 N픽셀로 키운다(106차).
    맵 전체가 Kenney 16px ×2 = **2px 입자** 규칙인데 실사 셀만 1px이면(TR 1:1) 인접 대비가
    4~20배로 튀어 지글거린다(실측: 잔디 0.85 / 상판 3.2~8.6 / 사석 15~20). 해안 세트는 grain=2.
    """
    base = (max(1, size[0] // grain), max(1, size[1] // grain))
    im = im.resize(base, resample)
    a = np.array(im).astype(float)
    rgb, al = a[:, :, :3], a[:, :, 3]
    mask = al > 128
    cen = _kmeans_palette(rgb, mask, k)
    if cen is None:
        return im
    show = _sand_tinted(cen) if sand_tint else cen
    lab = ((rgb.reshape(-1, 3)[:, None, :] - cen[None, :, :]) ** 2).sum(2).argmin(1)
    q = show[lab].reshape(rgb.shape)
    if match is not None:
        # 채널별 평균을 목표색에 맞춘다 — 실사 셀은 촬영 광량이 제각각이라 그대로 깔면
        # 타일마다 톤이 튀어 **바둑판 이음매**로 보인다(실렌더 확인: deck 123~153, 30 차이).
        cur = q[mask].mean(0) if mask.any() else np.array(match, dtype=float)
        for ch in range(3):
            if cur[ch] > 1:
                q[:, :, ch] = np.clip(q[:, :, ch] * (match[ch] / cur[ch]), 0, 255)
    keep = mask
    if cut_water:
        wet = np.array([_is_water(c) for c in cen])
        keep = mask & ~wet[lab].reshape(mask.shape)
    out = np.dstack([np.clip(q, 0, 255), np.where(keep, 255, 0)]).astype(np.uint8)
    res = Image.fromarray(out)
    if grain > 1:
        res = res.resize(size, Image.NEAREST)
    return res


def _resize_rgba(im, size):
    """알파 프리멀티플 후 고품질 축소 → 알파 임계 이진화 (가장자리 검은 헤일로 방지)."""
    a = np.array(im).astype(float)
    al = a[:, :, 3:4] / 255.0
    pre = np.dstack([a[:, :, :3] * al, a[:, :, 3]]).astype(np.uint8)
    sm = np.array(Image.fromarray(pre).resize(size, Image.LANCZOS)).astype(float)
    na = np.clip(sm[:, :, 3:4], 1e-3, 255) / 255.0
    rgb = np.clip(sm[:, :, :3] / na, 0, 255)
    hard = np.where(sm[:, :, 3:4] > 110, 255, 0)
    return Image.fromarray(np.dstack([rgb, hard]).astype(np.uint8))


def ttp():
    """TTP 시트 2장 → public/tileset/ttp/*.png (타일 32px · 스프라이트 56/38/26 + 좌우 플립)."""
    dst = OUT / 'ttp'
    dst.mkdir(parents=True, exist_ok=True)
    s1 = Image.open(TS / '1.png').convert('RGBA')
    s2 = Image.open(TS / '2.png').convert('RGBA')
    n = 0
    for src, table in ((s1, TTP_SHEET1), (s2, TTP_SHEET2)):
        for name, box in table.items():
            # 모래가 들어간 셀만 웜 틴트 (물/콘크리트 전용 셀은 그대로)
            edge = name.startswith(('edge_', 'corner_')) and name != 'corner_land'
            tint = name.startswith(('edge_', 'corner_')) or name == 'base_sand'
            im = _clean(src.crop(box), (TTP_TILE, TTP_TILE), k=8 if tint else 7,
                        sand_tint=tint, cut_water=edge, grain=TTP_GRAIN)
            im.save(dst / f'{name}.png')
            n += 1
    sp = s2.crop(TTP_SPRITE_BOX)
    for suf, px in TTP_SPRITE_SIZES.items():
        u = _clean(_resize_rgba(sp, (px, px)), (px, px), k=7, resample=Image.NEAREST, grain=TTP_GRAIN)
        u.save(dst / f'ttp_{suf}.png')
        u.transpose(Image.FLIP_LEFT_RIGHT).save(dst / f'ttp_{suf}_fx.png')
        n += 2
    print(f'[ttp] {n} sprites → {dst}')




# ══════════════════════════════════════════════════════════════════════════════
# 해안 세트 — 돌 방파제 그리드 / 방파제 바위·바다 경계면 / 부두 플랫폼 모서리 (105차)
# ══════════════════════════════════════════════════════════════════════════════
# 입력 3장 모두 **사용자 제작 목업**이라 104차와 같은 함정을 공유한다(압축 노이즈·불균일 셀).
#   ① `돌 방파제 그리드.png` — 실사 항공사진 + 사용자가 직접 그은 격자.
#      격자선 실측(열 16 · 행 6, 피치 46.7 × 48.3) → 셀 96개 중 **의미 있는 것만 골라** 굽는다.
#   ② `방파제 바위 및 바다 경계면 모서리.png` — 검정 테두리 셀만 타일(제목·라벨 텍스트는 제외).
#      바위 셀 배경은 흰색이 아니라 **알파 0**(뷰어가 희게 보여줄 뿐) — 테두리 탐지는 알파를 봐야 한다.
#   ③ `부두 플랫폼 모서리.png` — 검정 테두리 셀 4개(부두 상판 ↔ 물 모서리/가장자리).

COAST_TILE = 32        # = TR (1:1)
# 도트 입자 — Kenney 지면(16px ×2)·절차 물 디더와 같은 2px. 실사 셀을 1:1로 깔면 혼자 촘촘하다(106차)
COAST_GRAIN = 2

# ── ① 돌 방파제 격자 (선 실측값) ───────────────────────────────
STONE_XS = [0, 44, 92, 142, 189, 235, 283, 331, 377, 423, 469, 515, 562, 607, 652, 698, 745]
STONE_YS = [0, 49, 98, 146, 195, 242, 290]
# 'row-col' → 출력 이름. 행 의미: 0 물+잔여암 / 1 사석사면(북) / 2 상판 / 3 사석사면(남) / 4·5 물
STONE_PICK = {
    '2-5': 'deck_0', '2-8': 'deck_1', '2-10': 'deck_2', '2-12': 'deck_3',
    '2-2': 'deck_seam',                       # 신축이음/연석 줄
    '1-2': 'rubble_0', '1-8': 'rubble_1', '3-7': 'rubble_2', '3-11': 'rubble_3',
    '2-13': 'head_0',                         # 방파제 두부(상판 끝 → 사석)
}
# 물이 섞인 셀 — 게임 물 위에 얹는 오버레이라 바다 색을 투명으로 판다
STONE_PICK_CUT = {
    '3-2': 'rubble_toe_0', '3-3': 'rubble_toe_1',   # 사석 사면 → 물 (남쪽이 물)
    '2-14': 'head_1',                               # 두부 끝 — 물이 섞여 있어 오버레이로
    '0-9': 'submerged_0', '0-11': 'submerged_1', '4-10': 'submerged_2',
}

# ── ② 바위/물 상세 시트 (검정 테두리 실측) ─────────────────────
BOULDER_COLS = [13, 58, 103, 148, 193, 238, 283, 328, 373]
BOULDER_ROWS = [44, 91, 138, 185]
BOULDER_ROW_COUNT = [8, 8, 4]                  # 3행은 4칸만 (오른쪽은 Rock-Water Interface)
ROCKWATER_BOXES = [(216, 158, 246, 189), (252, 158, 282, 189), (288, 158, 318, 189), (323, 158, 353, 189)]
WATERDET_BOXES = {
    'wd_caustic_0': (390, 47, 432, 90), 'wd_caustic_1': (440, 47, 482, 90),
    'wd_coast_sand': (490, 47, 533, 90),
    'wd_shallow': (390, 98, 432, 141), 'wd_deep': (440, 98, 482, 141),
    'wd_coast_rock_0': (490, 98, 532, 141), 'wd_coast_rock_1': (490, 149, 532, 191),
}
WATERDET_CUT = {'wd_coast_sand', 'wd_coast_rock_0', 'wd_coast_rock_1'}

# ── ③ 부두 플랫폼 모서리 (검정 테두리 실측) ────────────────────
PIER_BOXES = ['pier_edge_0', 'pier_edge_1', 'pier_edge_2', 'pier_edge_3']
PIER_XS = [14, 64, 114, 164]


def coast():
    """해안 세트 3장 → public/tileset/coast/*.png (타일 32px = TR 1:1 · 바위는 알파 트림)."""
    dst = OUT / 'coast'
    dst.mkdir(parents=True, exist_ok=True)
    n = 0
    # ① 돌 방파제
    stone = Image.open(TS / '돌 방파제 그리드.png').convert('RGBA')
    def stone_box(key):
        r, c = (int(v) for v in key.split('-'))
        return (STONE_XS[c] + 2, STONE_YS[r] + 2, STONE_XS[c + 1] - 1, STONE_YS[r + 1] - 1)
    # 그룹 목표 톤 — 같은 군끼리 평균을 맞춰 타일 이음매(바둑판)를 없앤다
    DECK_TONE, RUBBLE_TONE = (161, 148, 132), (106, 101, 95)
    for table, cut in ((STONE_PICK, False), (STONE_PICK_CUT, True)):
        for key, name in table.items():
            tone = (DECK_TONE if name.startswith('deck') else
                    RUBBLE_TONE if name.startswith(('rubble', 'head')) else None)
            im = _clean(stone.crop(stone_box(key)), (COAST_TILE, COAST_TILE), k=10, cut_water=cut, match=tone, grain=COAST_GRAIN)
            im.save(dst / f'{name}.png'); n += 1
    # 96셀 전량 개별 타일(106차 — 사용자 지시 "그리드화한 전체 타일을 각각 개별 타일로").
    #   물이 섞인 셀은 **자동 판정**으로 바다를 투명으로 판다(게임 물 위에 얹는 오버레이).
    #   톤 정규화는 행 의미(1·3 사석 / 2 상판)에만 — 물 셀에 걸면 바다색까지 끌려간다.
    for rr in range(len(STONE_YS) - 1):
        for cc in range(len(STONE_XS) - 1):
            cell = stone.crop(stone_box(f'{rr}-{cc}'))
            wf = _water_frac(cell)
            # 물이 **섞인** 셀만 바다를 판다(오버레이). 온통 물인 셀(행 4·5)은 통짜 물 타일로 남긴다 —
            # 파내면 빈 셀이 되어 팔레트에서 사라진다.
            wet = 0.12 < wf <= 0.85
            tone = (RUBBLE_TONE if rr in (1, 3) else DECK_TONE if rr == 2 else None) if not wet else None
            im = _clean(cell, (COAST_TILE, COAST_TILE), k=10, cut_water=wet, match=tone, grain=COAST_GRAIN)
            im.save(dst / f'stone_r{rr}c{cc}.png'); n += 1
    # ② 바위 20 + Rock-Water 4 + 물 상세 7
    sheet = Image.open(TS / '방파제 바위 및 바다 경계면 모서리.png').convert('RGBA')
    idx = 0
    for ri, count in enumerate(BOULDER_ROW_COUNT):
        for ci in range(count):
            box = (BOULDER_COLS[ci] + 2, BOULDER_ROWS[ri] + 2, BOULDER_COLS[ci + 1] - 1, BOULDER_ROWS[ri + 1] - 1)
            im = trim(_clean(sheet.crop(box), (COAST_TILE, COAST_TILE), k=7, grain=COAST_GRAIN))
            idx += 1
            im.save(dst / f'rock_{idx:02d}.png'); n += 1
    for i, box in enumerate(ROCKWATER_BOXES):
        im = _clean(sheet.crop(box), (COAST_TILE, COAST_TILE), k=8, cut_water=True, grain=COAST_GRAIN)
        im.save(dst / f'rockwater_{i}.png'); n += 1
    for name, box in WATERDET_BOXES.items():
        im = _clean(sheet.crop(box), (COAST_TILE, COAST_TILE), k=8, cut_water=name in WATERDET_CUT, grain=COAST_GRAIN)
        im.save(dst / f'{name}.png'); n += 1
    # ③ 부두 모서리
    pier = Image.open(TS / '부두 플랫폼 모서리.png').convert('RGBA')
    for i, name in enumerate(PIER_BOXES):
        box = (PIER_XS[i], 42, PIER_XS[i] + 43, 86)
        im = _clean(pier.crop(box), (COAST_TILE, COAST_TILE), k=8, cut_water=True, grain=COAST_GRAIN)
        im.save(dst / f'{name}.png'); n += 1
    print(f'[coast] {n} sprites → {dst}')




# ══════════════════════════════════════════════════════════════════════════════
# 편집기 배치 카탈로그 생성 (106차) — 개별 타일/오브젝트를 F7 팔레트에 그대로 노출
# ══════════════════════════════════════════════════════════════════════════════
# 사용자 지시: "그리드화한 전체 타일을 각각 개별 타일로 … 지형 타일로 배치 가능하도록
#   편집기에 추가", "바위 20종·Rock-Water 4종은 오브젝트(카테고리 '돌 & 바위')".
# 시트가 늘어날 때마다 손으로 TS를 고치지 않도록 **추출기가 카탈로그를 굽는다**.
CATALOG_TS = ROOT / 'packages/client-pc/src/data/TileCatalog.ts'

# 1.png(12) · 2.png(7) 개별 타일 — [키, 라벨, 카테고리, 바탕 지형 문자]
TTP_CATALOG = [
    ('edge_still', '모래-잔잔한물 경계', '해변 경계', '~'),
    ('edge_ripple', '모래-잔물결 경계', '해변 경계', '~'),
    ('edge_foam', '모래-포말 경계', '해변 경계', '~'),
    ('edge_foam2', '모래-포말 경계 2', '해변 경계', '~'),
    ('corner_land', '경계 코너(뭍)', '해변 경계', 's'),
    ('corner_ne', '경계 코너 NE', '해변 경계', '~'),
    ('corner_sw', '경계 코너 SW', '해변 경계', '~'),
    ('corner_se', '경계 코너 SE', '해변 경계', '~'),
    ('water_still2', '잔잔한 물 2', '물', '~'),
    ('water_rip1', '잔물결 물 1', '물', '~'),
    ('water_rip2', '잔물결 물 2', '물', '~'),
    ('water_foam', '포말 물', '물', '~'),
    ('water_still', '잔잔한 물', '물', '~'),
    ('water_ripple', '잔물결', '물', '~'),
    ('water_splash', '해안 물보라', '물', '~'),
    ('base_sand', '해변 모래', '모래', 's'),
    ('base_concrete', 'TTP 콘크리트 베이스', '콘크리트', 'b'),
    ('tile_ttp_a', '콘크리트+TTP A', '콘크리트', 'b'),
    ('tile_ttp_b', '콘크리트+TTP B', '콘크리트', 'b'),
]


def _cov(path):
    """알파 커버리지 — 거의 빈 셀은 팔레트에서 뺀다(물만 있던 셀)."""
    a = np.array(Image.open(path).convert('RGBA'))
    return float((a[:, :, 3] > 8).mean())


def catalog():
    """추출된 스프라이트 → `data/TileCatalog.ts` (편집기 팔레트 단일 소스)."""
    coast_dir, ttp_dir = OUT / 'coast', OUT / 'ttp'
    tiles, objs = [], []
    # ① 돌 방파제 96셀 — 행 의미로 카테고리 분류
    ROW_CAT = {
        0: ('방파제 물가', '~'), 1: ('방파제 사석', 'b'), 2: ('방파제 상판', 'b'),
        3: ('방파제 사석', 'b'), 4: ('방파제 물가', '~'), 5: ('방파제 물가', '~'),
    }
    for rr in range(6):
        for cc in range(16):
            f = coast_dir / f'stone_r{rr}c{cc}.png'
            if not f.exists() or _cov(f) < 0.10:
                continue
            cat, base = ROW_CAT[rr]
            tiles.append((f'ts_coast_stone_r{rr}c{cc}', f'{cat[4:]} {rr}-{cc}', cat, base))
    # ② 부두 플랫폼 모서리 4 + 물/가장자리 상세 7
    for i in range(4):
        tiles.append((f'ts_coast_pier_edge_{i}', f'부두 모서리 {i + 1}', '부두 모서리', '~'))
    for k, lb in (('wd_caustic_0', '코스틱 1'), ('wd_caustic_1', '코스틱 2'), ('wd_coast_sand', '물가 모래'),
                  ('wd_shallow', '얕은 물'), ('wd_deep', '깊은 물'),
                  ('wd_coast_rock_0', '물가 암반 1'), ('wd_coast_rock_1', '물가 암반 2')):
        tiles.append((f'ts_coast_{k}', lb, '물/가장자리 상세', '~'))
    # ③ TTP 시트 개별 타일
    for k, lb, cat, base in TTP_CATALOG:
        tiles.append((f'ts_ttp_{k}', lb, cat, base))
    # ④ 오브젝트 — 방파제 바위 20 · Rock-Water 4 · 테트라포드 3크기
    for i in range(1, 21):
        objs.append((f'coast_rock_{i:02d}', f'방파제 바위 {i}', f'ts_coast_rock_{i:02d}', '돌 & 바위'))
    for i in range(4):
        objs.append((f'coast_rockwater_{i}', f'물속 바위 {i + 1}', f'ts_coast_rockwater_{i}', '돌 & 바위'))
    for suf, lb in (('l', '대'), ('m', '중'), ('s', '소')):
        objs.append((f'ttp_{suf}', f'테트라포드 ({lb})', f'ts_ttp_ttp_{suf}', '해안 구조물'))
    lines = [
        '/**',
        ' * @file TileCatalog.ts',
        ' * @description **자동 생성 — 수동 편집 금지** (`py tools/extract_tileset_assets.py catalog`).',
        ' *',
        ' * F7 맵 편집기 팔레트에 노출되는 **개별 타일/오브젝트 카탈로그**(106차).',
        ' *  - `PLACEABLE_TILES` = 지형 타일로 찍는 개별 셀. `base` = 함께 칠할 지형 문자',
        ' *    (걷기·충돌 판정은 여전히 지형 문자가 결정한다 — 그림만 바꾸면 물 위를 걷게 된다).',
        ' *  - `COAST_OBJECTS` = 지형 위에 얹는 스프라이트(회전·반전·겹침 허용 대상).',
        ' */',
        '',
        'export interface PlaceableTile {',
        '  /** 텍스처 키 (TILESET_MANIFEST 등록 키) */',
        '  key: string;',
        '  label: string;',
        '  cat: string;',
        '  /** 함께 칠할 지형 문자 — 걷기/충돌의 기준 */',
        '  base: string;',
        '}',
        '',
        'export const PLACEABLE_TILES: PlaceableTile[] = [',
    ]
    for k, lb, cat, base in tiles:
        lines.append(f"  {{ key: '{k}', label: '{lb}', cat: '{cat}', base: '{base}' }},")
    lines += ['];', '', 'export interface PlaceableObject {', '  id: string;', '  label: string;',
              '  tex: string;', '  cat: string;', '}', '',
              'export const COAST_OBJECTS: PlaceableObject[] = [']
    for i, lb, tex, cat in objs:
        lines.append(f"  {{ id: '{i}', label: '{lb}', tex: '{tex}', cat: '{cat}' }},")
    lines += ['];', '']
    CATALOG_TS.write_text(chr(10).join(lines), encoding='utf-8')
    print(f'[catalog] tiles {len(tiles)} · objects {len(objs)} → {CATALOG_TS}')


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'survey'
    {'survey': survey, 'build': build, 'ground': ground, 'zoom': zoom, 'contact': contact, 'ttp': ttp, 'coast': coast, 'catalog': catalog, 'gem': gem}[mode]()
