# -*- coding: utf-8 -*-
"""
@file gen_card_rig_icons.py
@description 카드 채비 실사 → 도트 아이콘 (196차 — 사용자 제공 포장 사진 2장)
  - assets/items/card_rig/card_rig_yeolgi_red.png      → item-icons/it_card_rig_yeolgi.png   (열기 카드 채비 · 빨간 깃)
  - assets/items/card_rig/card_rig_jeongaengi_green.png → item-icons/it_card_rig_jeongaengi.png (전갱이 카드 채비 · 녹색 깃)
  포장(판지 카드)째로 쓴다 — 실제 낚시점에서 보는 모습이 곧 아이템 그림이다.
  긴 축 96px로 줄여(BOX) 40색으로 양자화한 뒤 NEAREST로 키워 기존 item-icons(1254px 정사각·투명 여백)와 맞춘다.
  실행: python3 tools/gen_card_rig_icons.py
"""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC_DIR = os.path.join(ROOT, 'assets', 'items', 'card_rig')
OUT_DIR = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'item-icons')
JOBS = [
    ('card_rig_yeolgi_red.png', 'it_card_rig_yeolgi.png'),
    ('card_rig_jeongaengi_green.png', 'it_card_rig_jeongaengi.png'),
]
LONG_PX = 96     # 도트 해상도(긴 축)
COLORS = 40
OUT_PX = 1254
FILL = 0.92      # 정사각 캔버스에서 차지할 비율 — 다른 아이콘과 여백을 맞춘다


def pixelize(src: str, dst: str) -> None:
    im = Image.open(os.path.join(SRC_DIR, src)).convert('RGB')
    w, h = im.size
    k = LONG_PX / max(w, h)
    small = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.BOX)
    small = small.quantize(colors=COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGBA')
    # 테두리 1px 어두운 윤곽 — 슬롯의 남색 바탕에서 흰 판지가 번지지 않게
    sw, sh = small.size
    framed = Image.new('RGBA', (sw + 2, sh + 2), (26, 28, 36, 255))
    framed.paste(small, (1, 1))
    side = round(OUT_PX * FILL)
    scale = side // max(framed.size)
    big = framed.resize((framed.size[0] * scale, framed.size[1] * scale), Image.NEAREST)
    canvas = Image.new('RGBA', (OUT_PX, OUT_PX), (0, 0, 0, 0))
    canvas.paste(big, ((OUT_PX - big.size[0]) // 2, (OUT_PX - big.size[1]) // 2))
    path = os.path.join(OUT_DIR, dst)
    canvas.save(path)
    print('saved', path, small.size)


if __name__ == '__main__':
    for s, d in JOBS:
        pixelize(s, d)
