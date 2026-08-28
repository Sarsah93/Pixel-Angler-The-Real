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
    3: 'house_red', 4: 'house_blue', 5: 'garage', 1: 'road_patch', 0: 'block_gray',
}
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


def build():
    (OUT / 'gem').mkdir(parents=True, exist_ok=True)
    (OUT / 'td').mkdir(parents=True, exist_ok=True)
    (OUT / 'kn').mkdir(parents=True, exist_ok=True)
    for fname, slug in GEMINI.items():
        p = TS / 'Gemini generated and edited' / fname
        if not p.exists():
            print(f'  ⚠ 없음: {fname}'); continue
        im = trim(Image.open(p).convert('RGBA'))
        im.save(OUT / 'gem' / f'{slug}.png')
        print(f'  gem/{slug}.png {im.width}x{im.height}')
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
    print(f'[done] → {OUT}')


# Kenney 지면 셀 (정규화 시트 16px 격자 (col,row) — `_survey/kenney_ground_zoom.png` 기준, 수동 확정)
#  자동 색 통계 선별은 환기구·균열 무늬 셀을 잡아 반복 패턴이 생겼다(101차 후속 실측) → 명시 표.
GROUND_CELLS = {
    'asphalt': [(10, 19), (11, 19), (14, 21)],   # 차도 — 무지 아스팔트
    'grass':   [(1, 26), (2, 26), (1, 27)],      # 잔디 — 무지 ((0,25)는 흙 테두리 코너 변형이라 제외)
    'dirt':    [(4, 24), (5, 24), (11, 26)],     # 흙 — 예비 (현재 미사용)
    'pave':    [(0, 19), (1, 20), (2, 20)],      # 보도 — 회색 벽돌 포장
    'tan':     [(3, 19), (4, 20), (5, 20)],      # 맨땅 — 베이지 포장 (항구 도시 광장·주차장 톤)
    'sand':    [(6, 24), (7, 24)],               # 모래사장 — 크림 모래
    'pier':    [(6, 19), (7, 20), (8, 20)],      # 방파제·부두 — 청회색 포장
}


def ground():
    """Kenney 지면 타일 — GROUND_CELLS 명시 셀을 16px 그대로 출력 (TR 32 = ×2 정수 배율)."""
    (OUT / 'kn').mkdir(parents=True, exist_ok=True)
    kns = kenney_sheet()
    for key, cells in GROUND_CELLS.items():
        for i, (c, r) in enumerate(cells):
            im = kns.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16))
            im.save(OUT / 'kn' / f'ground_{key}_{i}.png')
            print(f'  kn/ground_{key}_{i}.png  cell=({c},{r})')


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


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'survey'
    {'survey': survey, 'build': build, 'ground': ground, 'zoom': zoom, 'contact': contact}[mode]()
