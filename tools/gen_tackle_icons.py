# -*- coding: utf-8 -*-
"""
@file gen_tackle_icons.py
@description 채비 부속 도트 아이콘 절차 생성기 (192차)
  - 바렐형 도래(it_swivel_barrel.png): 고리 2개 + 코일 + 통(바렐) — 스냅 없는 일반 도래.
  - 카드 채비(it_card_rig_flasher.png / it_card_rig_plain.png · 193차): 판지 카드 + 가지바늘 3단(반짝이 깃 유무).
  작은 격자(48x78)에 픽셀 단위로 그린 뒤 NEAREST로 16배 확대해 기존 item-icons(≈1254px)와 같은 해상도로 저장한다.
  실행: py tools/gen_tackle_icons.py  →  packages/client-pc/public/item-icons/it_swivel_barrel.png
"""
import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'packages', 'client-pc', 'public', 'item-icons')

# 기존 도래(it_swivel_v2)와 같은 강철 톤
OUTLINE = (26, 28, 36, 255)
DARK = (74, 78, 88, 255)
MID = (138, 143, 154, 255)
LIGHT = (200, 204, 212, 255)
HI = (240, 242, 245, 255)


def ring(d, cx, cy, r, w=2):
    """두께 w의 고리 — 바깥 윤곽선 + 금속 링 + 안쪽 윤곽선"""
    d.ellipse((cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1), fill=OUTLINE)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=MID)
    d.ellipse((cx - r + w, cy - r + w, cx + r - w, cy + r - w), fill=OUTLINE)
    d.ellipse((cx - r + w + 1, cy - r + w + 1, cx + r - w - 1, cy + r - w - 1), fill=(0, 0, 0, 0))
    # 좌상단 하이라이트 한 점, 우하단 그늘
    d.point((cx - r + 1, cy - 2), fill=HI)
    d.point((cx - r + 1, cy - 1), fill=LIGHT)
    d.line((cx + r - 1, cy, cx + r - 1, cy + 2), fill=DARK)


def coil(d, cx, y0, y1, half=3):
    """고리 아래 꼬인 철사(코일) — 가로줄 교대로 명암"""
    d.rectangle((cx - half - 1, y0 - 1, cx + half + 1, y1 + 1), fill=OUTLINE)
    for y in range(y0, y1 + 1):
        tone = LIGHT if (y - y0) % 2 == 0 else DARK
        d.line((cx - half, y, cx + half, y), fill=tone)
        d.point((cx - half, y), fill=MID)


def barrel(d, cx, y0, y1, half=8):
    """통(바렐) — 위아래 모서리를 깎은 팔각 몸통 + 세로 하이라이트"""
    pts = [(cx - half + 3, y0), (cx + half - 3, y0), (cx + half, y0 + 4), (cx + half, y1 - 4),
           (cx + half - 3, y1), (cx - half + 3, y1), (cx - half, y1 - 4), (cx - half, y0 + 4)]
    d.polygon([(x + (1 if x > cx else -1), y + (1 if y > (y0 + y1) / 2 else -1)) for x, y in pts], fill=OUTLINE)
    d.polygon(pts, fill=MID)
    # 좌측 밝은 띠 · 우측 어두운 띠
    d.rectangle((cx - half + 2, y0 + 3, cx - half + 4, y1 - 3), fill=LIGHT)
    d.rectangle((cx - half + 3, y0 + 5, cx - half + 3, y1 - 6), fill=HI)
    d.rectangle((cx + half - 3, y0 + 3, cx + half - 1, y1 - 3), fill=DARK)
    # 통 양 끝 테두리 홈
    d.line((cx - half + 3, y0 + 1, cx + half - 3, y0 + 1), fill=DARK)
    d.line((cx - half + 3, y1 - 1, cx + half - 3, y1 - 1), fill=DARK)


def gen_barrel_swivel():
    W, H = 48, 78
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = 24
    ring(d, cx, 11, 8)
    coil(d, cx, 20, 26)
    barrel(d, cx, 27, 50)
    coil(d, cx, 51, 57)
    ring(d, cx, 66, 8)
    # 코일이 고리에 물리는 연결 핀
    d.rectangle((cx - 1, 18, cx + 1, 20), fill=OUTLINE)
    d.rectangle((cx - 1, 57, cx + 1, 59), fill=OUTLINE)
    big = im.resize((W * 16, H * 16), Image.NEAREST)
    s = max(big.size)
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    canvas.paste(big, ((s - big.size[0]) // 2, (s - big.size[1]) // 2))
    canvas = canvas.resize((1254, 1254), Image.NEAREST)
    path = os.path.join(OUT_DIR, 'it_swivel_barrel.png')
    canvas.save(path)
    print('saved', path, canvas.size)


def gen_card_rig(flasher: bool):
    """카드 채비 — 판지 카드에 감긴 가지바늘 3단. 반짝이 깃이면 바늘마다 은·청록 비늘 조각을 붙인다."""
    W, H = 48, 64
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    CARD_D = (120, 84, 44, 255); CARD = (196, 150, 92, 255); CARD_L = (226, 190, 132, 255)
    LINE = (220, 230, 236, 255)
    # 판지 카드(둥근 모서리 직사각)
    d.rectangle((9, 3, 38, 60), fill=OUTLINE)
    d.rectangle((10, 4, 37, 59), fill=CARD)
    d.rectangle((10, 4, 12, 59), fill=CARD_L)
    d.rectangle((35, 4, 37, 59), fill=CARD_D)
    # 가운데 원줄(세로)
    d.line((24, 6, 24, 57), fill=LINE)
    for k, y in enumerate((14, 30, 46)):
        # 가지줄 → 바늘
        d.line((24, y, 31, y + 3), fill=LINE)
        # 바늘(J)
        d.line((31, y + 3, 31, y + 9), fill=OUTLINE)
        d.line((32, y + 3, 32, y + 9), fill=MID)
        d.point((31, y + 10), fill=OUTLINE); d.point((30, y + 10), fill=OUTLINE)
        d.line((29, y + 9, 29, y + 7), fill=OUTLINE)
        d.point((29, y + 6), fill=HI)
        if flasher:
            # 반짝이 깃 — 은빛·청록 비늘 조각 3픽셀 + 하이라이트
            d.rectangle((33, y + 3, 35, y + 7), fill=(150, 220, 210, 255))
            d.rectangle((33, y + 4, 34, y + 5), fill=HI)
            d.point((35, y + 7), fill=(60, 150, 160, 255))
        else:
            d.point((33, y + 4), fill=DARK)
    # 아래 봉돌 고리
    d.rectangle((22, 56, 26, 60), fill=OUTLINE)
    d.rectangle((23, 57, 25, 59), fill=DARK)
    big = im.resize((W * 16, H * 16), Image.NEAREST)
    s = max(big.size)
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    canvas.paste(big, ((s - big.size[0]) // 2, (s - big.size[1]) // 2))
    canvas = canvas.resize((1254, 1254), Image.NEAREST)
    name = 'it_card_rig_flasher.png' if flasher else 'it_card_rig_plain.png'
    path = os.path.join(OUT_DIR, name)
    canvas.save(path)
    print('saved', path)


if __name__ == '__main__':
    gen_barrel_swivel()
    gen_card_rig(True)
    gen_card_rig(False)
