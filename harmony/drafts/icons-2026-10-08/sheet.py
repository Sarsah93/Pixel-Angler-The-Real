# 검토용 시안 시트 한 장 — 날씨 16x16 9종 + 고해상 5종 + 기존 에셋과 같은 배율 비교
from PIL import Image, ImageDraw, ImageFont
from weather16 import ICONS
from pix import render
REPO = '/home/claude/pixel-angler-the-real/packages/client-pc/public/item-icons/'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
def font(sz):
    for idx in range(0, 12):
        try:
            f = ImageFont.truetype(FONT, sz, index=idx)
            if 'KR' in f.getname()[0]: return f
        except Exception: break
    return ImageFont.truetype(FONT, sz)
F1, F2, F3 = font(30), font(20), font(16)
BG = (30, 40, 52, 255); FG = (232, 244, 253, 255); SUB = (160, 180, 196, 255)
W = 1760
sheet = Image.new('RGBA', (W, 2040), BG); d = ImageDraw.Draw(sheet)
y = 28
d.text((32, y), '아이콘 시안 — 검토용 (저장소에는 아직 넣지 않았습니다)', font=F1, fill=FG); y += 56

# ── 1. 날씨 배지 ──
d.text((32, y), '1. 날씨 배지 9종 · 16×16 손그림 (지금은 ☀ ☁ ☂ 같은 글꼴 글자)', font=F2, fill=FG); y += 36
names = {'wx_clear': '맑음(낮)', 'wx_night': '어두움(밤)', 'wx_partly': '구름 조금', 'wx_cloudy': '흐림', 'wx_rain': '비',
         'wx_shower': '소나기', 'wx_sleet': '진눈깨비', 'wx_snow': '눈', 'wx_fog': '안개'}
cols = {'wx_clear': 0xffcc44, 'wx_night': 0x8fa9d0, 'wx_partly': 0xbfd8e8, 'wx_cloudy': 0x9aa8b0, 'wx_rain': 0x4a9eff,
        'wx_shower': 0x4a9eff, 'wx_sleet': 0x9ad0e8, 'wx_snow': 0xe8f4fd, 'wx_fog': 0x9aa8b0}
sc = 10; step = 188
for i, (k, (pal, art)) in enumerate(ICONS.items()):
    rows = art.strip('\n').split('\n')
    x = 32 + i * step
    d.rectangle((x - 4, y - 4, x + 16 * sc + 4, y + 16 * sc + 4), fill=(22, 30, 40, 255))
    im = render(pal, rows, sc); sheet.alpha_composite(im, (x, y))
    d.text((x, y + 16 * sc + 10), names[k], font=F3, fill=SUB)
    # 실제 HUD 크기(지름 26 원 안 16px) — 1배와 2배
    c = cols[k]; rgb = ((c >> 16) & 255, (c >> 8) & 255, c & 255)
    bgc = tuple(int(b + (v - b) * 0.28) for v, b in zip(rgb, (36, 50, 62))) + (255,)
    cy = y + 16 * sc + 62
    d.ellipse((x + 4, cy - 13, x + 30, cy + 13), fill=bgc, outline=rgb + (255,), width=1)
    sheet.alpha_composite(render(pal, rows, 1), (x + 9, cy - 8))
    d.ellipse((x + 52, cy - 26, x + 104, cy + 26), fill=bgc, outline=rgb + (255,), width=2)
    sheet.alpha_composite(render(pal, rows, 2), (x + 62, cy - 16))
y += 16 * sc + 100
d.text((32, y), '아래 작은 원 = 화면에 실제로 뜨는 크기(왼쪽 1배 · 오른쪽 2배 확대)', font=F3, fill=SUB); y += 44

# ── 2. 고해상 아이템 ──
d.text((32, y), '2. 아이템 5종 · 128 격자 × 8배 = 1024×1024 (코드로 그린 그림)', font=F2, fill=FG); y += 36
items = [('knife_yanagiba_v2.png', '야나기바 (장인 단조)'), ('knife_deba_v1.png', '정옥선의 손질 칼'), ('headlamp_v1.png', '어촌계 실습생 헤드랜턴'),
         ('lantern_v1.png', '등대지기의 랜턴'), ('certificate_v1.png', '증서 · 면허')]
cell = 336
for i, (fn, label) in enumerate(items):
    x = 32 + i * (cell + 8)
    d.rectangle((x, y, x + cell, y + cell), fill=(22, 30, 40, 255))
    im = Image.open(fn).resize((320, 320), Image.NEAREST); sheet.alpha_composite(im, (x + 8, y + 8))
    d.text((x, y + cell + 8), label, font=F3, fill=SUB)
    # 가방 칸 크기(48px) 미리보기 — 밝은 칸 위
    sx = x + cell - 64; sy = y + cell + 6
    d.rectangle((sx, sy, sx + 56, sy + 56), fill=(52, 66, 80, 255), outline=(90, 108, 124, 255))
    sm = Image.open(fn).resize((48, 48), Image.LANCZOS); sheet.alpha_composite(sm, (sx + 4, sy + 4))
y += cell + 76

# ── 3. 기존 에셋 ──
d.text((32, y), '3. 비교 — 지금 게임에 들어 있는 그림(같은 배율)', font=F2, fill=FG); y += 36
exist = [('it_spinning_reel.png', '스피닝 릴'), ('it_metal_jig.png', '메탈 지그'), ('it_float_zero_v2.png', '제로 찌'), ('it_hook_chinu.png', '감성돔 바늘'), ('it_krill_box.png', '크릴 상자')]
for i, (fn, label) in enumerate(exist):
    x = 32 + i * (cell + 8)
    d.rectangle((x, y, x + cell, y + cell), fill=(22, 30, 40, 255))
    im = Image.open(REPO + fn).convert('RGBA'); im.thumbnail((320, 320), Image.LANCZOS)
    sheet.alpha_composite(im, (x + 8 + (320 - im.width) // 2, y + 8 + (320 - im.height) // 2))
    d.text((x, y + cell + 8), label, font=F3, fill=SUB)
    sx = x + cell - 64; sy = y + cell + 6
    d.rectangle((sx, sy, sx + 56, sy + 56), fill=(52, 66, 80, 255), outline=(90, 108, 124, 255))
    sm = Image.open(REPO + fn).convert('RGBA'); sm.thumbnail((48, 48), Image.LANCZOS); sheet.alpha_composite(sm, (sx + 4 + (48 - sm.width) // 2, sy + 4 + (48 - sm.height) // 2))
y += cell + 76
sheet = sheet.crop((0, 0, W, y + 10))
sheet.save('icon_drafts_2026-10-08.png')
print(sheet.size)
