"""파이트 튜토리얼 1페이지 삽화 합성 — 실캡처 3장(여 박기·바늘털이·횡 러닝) → 640×300 (117차).

    py tools/compose_fight_guide.py <raw_dir>   # raw_dir/fight_dive.png, fight_jump.png, fight_lateral.png

GuidePanel 삽화 카드(ART_W×ART_H = 640×300)에 맞춰 세 상황을 나란히 두고, 각 칸 아래에 "상황 → 대응"을 적는다.
크롭은 화면 중앙 상단(텐션바·하중/줄·대응 배지·패턴 안내가 모여 있는 곳)이라 튜토리얼이 설명하는 요소가 그대로 보인다.
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'guide', 'guide_fight_6.png')
W, H = 640, 300
PANELS = [
    ('fight_dive', '여 박기 (dive)', '↑ 꾹 눌러 버티기'),
    ('fight_jump', '바늘털이 (jump)', '릴링·↑ 멈추고 줄 늦추기'),
    ('fight_lateral', '횡 러닝 (lateral)', '같은 쪽 ←/→ 스티어'),
]
# 영어 로케일용 제목·조작 문구 (119차) — --lang en 이면 guide_fight_6_en.png
PANELS_EN = [
    ('fight_dive', 'Rock dive', 'Hold ↑ to brace'),
    ('fight_jump', 'Head shake / jump', 'Stop reeling and ↑, give slack'),
    ('fight_lateral', 'Lateral run', 'Steer ←/→ the same way'),
]
NO_CAPTURE = {'ko': '캐프처 없음', 'en': 'no capture'}
# 1280×720 캡처에서 자를 영역 — 텐션바(y≈20)부터 물고기 그림자(y≈420)까지, 가로 중앙 640px
CROP = (320, 8, 960, 440)


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for cand in (('C:/Windows/Fonts/malgunbd.ttf' if bold else 'C:/Windows/Fonts/malgun.ttf'), 'C:/Windows/Fonts/malgun.ttf'):
        if os.path.exists(cand):
            return ImageFont.truetype(cand, size)
    return ImageFont.load_default()


def main(raw: str, lang: str = 'ko') -> None:
    im = Image.new('RGB', (W, H), (10, 22, 40))
    d = ImageDraw.Draw(im)
    gap = 6
    pw = (W - gap * 4) // 3
    ph = 228
    panels = PANELS_EN if lang == 'en' else PANELS
    for i, (key, title, action) in enumerate(panels):
        x = gap + i * (pw + gap)
        src = os.path.join(raw, key + '.png')
        if os.path.exists(src):
            crop = Image.open(src).convert('RGB').crop(CROP)
            crop = crop.resize((pw, ph), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.0, percent=60, threshold=2))
            im.paste(crop, (x, 6))
        else:
            d.rectangle([x, 6, x + pw, 6 + ph], fill=(18, 40, 62))
            d.text((x + pw / 2, 6 + ph / 2), NO_CAPTURE[lang], fill=(120, 150, 170), font=font(13), anchor='mm')
        d.rectangle([x, 6, x + pw, 6 + ph], outline=(28, 61, 90), width=1)
        # 상황 → 대응 캡션
        d.rounded_rectangle([x, 6 + ph + 6, x + pw, H - 6], radius=4, fill=(14, 30, 48))
        d.text((x + pw / 2, 6 + ph + 22), title, fill=(255, 206, 84), font=font(14), anchor='mm')
        d.text((x + pw / 2, 6 + ph + 44), action, fill=(232, 244, 253), font=font(13, False), anchor='mm')
        # 번호 배지
        d.rounded_rectangle([x + 4, 10, x + 24, 30], radius=4, fill=(255, 206, 84))
        d.text((x + 14, 20), str(i + 1), fill=(10, 22, 40), font=font(13), anchor='mm')
    out = OUT.replace('.png', '_en.png') if lang == 'en' else OUT
    im.save(out, optimize=True)
    print('wrote', out)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'ko'))
