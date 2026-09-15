# -*- coding: utf-8 -*-
"""
gen_char_base.py — 바닐라 베이스 캐릭터 스켈레톤 + 페이퍼돌 장비 레이어 생성기 (138차 초안)

목적
  현재 캐릭터/NPC는 외부 고해상 출력물을 런타임 축소해 쓴다(man-idle-front 260x467 · 26,817색 →
  52px 표시 = 배율 0.111). 픽셀 그레인이 아예 없어 맵(2px 그레인)과 어긋난다.
  이 생성기는 **아트 격자 자체를 코드가 소유**해서 그 문제를 원천 제거한다.

규격 (권고안)
  - 아트 셀 24 x 32 px, 몸 높이 26px(머리끝 y=4 ~ 발바닥 y=30), 발바닥 중앙 = 앵커.
  - 게임 표시는 정수 x2 → 48 x 64 화면 px, 몸 = 52px (= 현 PLAYER_DISPLAY_H 와 동일).
  - 그레인 2px = Kenney 지면(16px x2)·해안 시트와 동일. 비정수 축소 금지.
  - 팔레트는 재질별 3톤(하이라이트/기본/음영) + 전역 아웃라인 1색.

레이어 (페이퍼돌 — 아래에서 위로)
  body → pants → shirt → boots → gloves → hair → headwear → face → held
  각 레이어는 pose()가 주는 **앵커 사각형**만 참조한다. 새 장비 = 그리기 함수 1개 추가.

출력
  public/characters/base/<setId>_sheet.png   (4방향 x 3프레임 = 12셀)
  preview/*.png                              (x4 확대 검수용)
"""
from __future__ import annotations
import os, sys
from PIL import Image

CELL_W, CELL_H = 32, 32   # 셀 32x32 (몸 12w x 26h + 손에 든 장대용 여백)
OFF_X = 4                 # 몸 기준 좌표(중심 x=12) → 셀 중앙(x=16) 보정
FOOT_Y = 30          # 발바닥 (포함)
HEAD_TOP = 4         # 머리 꼭대기
OUTLINE = (26, 22, 32, 255)

DIRS = ['down', 'left', 'right', 'up']
FRAMES = ['idle', 'walk1', 'walk2']


def hx(s: str):
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)


def tones(light: str, base: str, shade: str):
    return (hx(light), hx(base), hx(shade))


# ---------------------------------------------------------------- 팔레트
PALETTES = {
    'skin_light':  tones('#f2c79b', '#d99c6e', '#a86c45'),
    'skin_tan':    tones('#dda878', '#bd8050', '#8d5833'),
    'skin_old':    tones('#e8c3a4', '#c79a7a', '#96705a'),
    'hair_black':  tones('#544a55', '#332c36', '#1e1a22'),
    'hair_brown':  tones('#8a5a36', '#5f3c22', '#3b2415'),
    'hair_gray':   tones('#d7d2cf', '#a8a29f', '#736d6b'),
    'hair_white':  tones('#f0eee9', '#c9c5be', '#918d86'),
    'navy':        tones('#3d5a80', '#2a3f5c', '#1a2740'),
    'red':         tones('#d95a4a', '#a83a2e', '#72231b'),
    'olive':       tones('#7d8a4e', '#5b6637', '#3b4423'),
    'cream':       tones('#f0e3c8', '#cfbf9e', '#9b8c6e'),
    'gray':        tones('#b9bcc0', '#8b8f95', '#5d6167'),
    'yellow':      tones('#f5d25a', '#d1a72f', '#96751b'),
    'teal':        tones('#4fb3a5', '#2f8377', '#1c574f'),
    'brown':       tones('#8a6340', '#5e4228', '#3b2917'),
    'black':       tones('#4a4550', '#2c2831', '#1a171f'),
    'apron':       tones('#e6ddd0', '#c2b6a5', '#8d8272'),
}
PALETTES['orange'] = tones('#f0a05a', '#c47430', '#8a4d1c')


class Canvas:
    """아트 격자 1셀. grid[y][x] = RGBA or None"""

    def __init__(self, w=CELL_W, h=CELL_H):
        self.w, self.h = w, h
        self.g = [[None] * w for _ in range(h)]

    def put(self, x, y, c):
        x += OFF_X
        if 0 <= x < self.w and 0 <= y < self.h and c is not None:
            self.g[y][x] = c

    def rect(self, x0, y0, x1, y1, pal, top_light=True, bot_shade=True):
        """재질 3톤 사각형 — 윗줄 하이라이트 / 아랫줄 음영."""
        light, base, shade = pal
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                c = base
                if top_light and y == y0:
                    c = light
                elif bot_shade and y == y1:
                    c = shade
                self.put(x, y, c)

    def col(self, x, y0, y1, c):
        for y in range(y0, y1 + 1):
            self.put(x, y, c)

    def outline(self):
        """실루엣 바깥 1px 어두운 테두리 — 픽셀아트 가독성의 핵심."""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] is not None:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < self.w and 0 <= ny < self.h and self.g[ny][nx] is not None:
                        add.append((x, y))
                        break
        for x, y in add:
            self.g[y][x] = OUTLINE

    def to_image(self):
        im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        px = im.load()
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] is not None:
                    px[x, y] = self.g[y][x]
        return im


# ---------------------------------------------------------------- 스켈레톤
def pose(direction: str, frame: str, tall: int = 0):
    """방향·프레임별 앵커 사각형. 장비 레이어는 전부 이 값만 참조한다.
       tall: 체격 보정(-1 왜소 · 0 표준 · +1 장신) — 같은 스켈레톤으로 체형 분화."""
    bob = -1 if frame in ('walk1', 'walk2') else 0
    top = HEAD_TOP - tall + bob
    side = direction in ('left', 'right')

    head_w = 8 if side else 10
    hx0 = 12 - head_w // 2
    head = (hx0, top, hx0 + head_w - 1, top + 8)

    torso_top = head[3] + 1
    torso_bot = torso_top + 8 + max(0, tall)
    torso = (8, torso_top, 15, torso_bot)
    if side:
        torso = (9, torso_top, 14, torso_bot)

    leg_top = torso_bot + 1
    # 다리: 프레임별 전후 스윙
    if side:
        fwd = {'idle': 0, 'walk1': 2, 'walk2': -2}[frame]
        d = 1 if direction == 'right' else -1
        legA = (10 + fwd * d, leg_top, 12 + fwd * d, FOOT_Y)       # 앞다리
        legB = (10 - fwd * d, leg_top, 12 - fwd * d, FOOT_Y - (1 if frame != 'idle' else 0))
    else:
        spread = {'idle': 0, 'walk1': 1, 'walk2': 1}[frame]
        lift = {'idle': (0, 0), 'walk1': (1, 0), 'walk2': (0, 1)}[frame]
        legA = (8 - spread, leg_top, 10 - spread, FOOT_Y - lift[0])
        legB = (13 + spread, leg_top, 15 + spread, FOOT_Y - lift[1])

    arm_top = torso_top + 1
    arm_bot = torso_bot - 1
    if side:
        sw = {'idle': 0, 'walk1': -1, 'walk2': 1}[frame]
        armA = (11, arm_top + sw, 12, arm_bot + sw)                 # 보이는 팔 1개
        armB = None
    else:
        sw = {'idle': 0, 'walk1': -1, 'walk2': 1}[frame]
        armA = (6, arm_top + sw, 7, arm_bot + sw)
        armB = (16, arm_top - sw, 17, arm_bot - sw)

    return {
        'dir': direction, 'frame': frame, 'side': side, 'bob': bob,
        'head': head, 'torso': torso, 'legA': legA, 'legB': legB,
        'armA': armA, 'armB': armB,
    }


# ---------------------------------------------------------------- 레이어
def L_body(c: Canvas, p, cfg):
    skin = PALETTES[cfg.get('skin', 'skin_light')]
    hd = p['head']
    c.rect(*hd, skin)
    c.rect(*p['torso'], skin, top_light=False)
    for k in ('legA', 'legB'):
        c.rect(*p[k], skin, top_light=False)
    for k in ('armA', 'armB'):
        if p[k]:
            c.rect(*p[k], skin, top_light=False)


def L_pants(c: Canvas, p, cfg):
    if not cfg.get('pants'):
        return
    pal = PALETTES[cfg['pants']]
    hi = cfg.get('pants_len', 6)   # 밑단 길이 (와이더 = 8, 반바지 = 3)
    for k in ('legA', 'legB'):
        x0, y0, x1, y1 = p[k]
        c.rect(x0, y0, x1, min(y1, y0 + hi), pal, top_light=False)


def L_shirt(c: Canvas, p, cfg):
    if not cfg.get('shirt'):
        return
    pal = PALETTES[cfg['shirt']]
    x0, y0, x1, y1 = p['torso']
    c.rect(x0, y0, x1, y1 - 1, pal)
    slen = cfg.get('sleeve', 4)
    for k in ('armA', 'armB'):
        if not p[k]:
            continue
        ax0, ay0, ax1, ay1 = p[k]
        c.rect(ax0, ay0, ax1, min(ay1, ay0 + slen), pal, top_light=False)


def L_vest(c: Canvas, p, cfg):
    """구명조끼 / 앞치마 — 몸통 위 덧입힘 (장비 착용 전/후 가시성)"""
    if not cfg.get('vest'):
        return
    pal = PALETTES[cfg['vest']]
    x0, y0, x1, y1 = p['torso']
    if cfg.get('vest_style') == 'apron':
        c.rect(x0 + 1, y0 + 2, x1 - 1, y1 - 1, pal, top_light=False)
    else:
        c.rect(x0, y0, x0 + 1, y1 - 1, pal)          # 좌 패널
        c.rect(x1 - 1, y0, x1, y1 - 1, pal)          # 우 패널
        c.rect(x0, y0, x1, y0, pal)                  # 어깨
        if not p['side']:
            c.put(x0 + 3, y0 + 3, PALETTES['yellow'][1])   # 버클
            c.put(x1 - 3, y0 + 3, PALETTES['yellow'][1])


def L_boots(c: Canvas, p, cfg):
    if not cfg.get('boots'):
        return
    pal = PALETTES[cfg['boots']]
    h = cfg.get('boot_h', 2)
    for k in ('legA', 'legB'):
        x0, y0, x1, y1 = p[k]
        c.rect(x0, y1 - h, x1, y1, pal, top_light=False)


def L_gloves(c: Canvas, p, cfg):
    if not cfg.get('gloves'):
        return
    pal = PALETTES[cfg['gloves']]
    for k in ('armA', 'armB'):
        if p[k]:
            x0, y0, x1, y1 = p[k]
            c.rect(x0, y1 - 1, x1, y1, pal, top_light=False)


def L_hair(c: Canvas, p, cfg):
    if not cfg.get('hair'):
        return
    pal = PALETTES[cfg['hair']]
    x0, y0, x1, y1 = p['head']
    style = cfg.get('hair_style', 'short')
    c.rect(x0, y0, x1, y0 + 2, pal)                              # 윗머리
    if p['dir'] == 'up':
        c.rect(x0, y0, x1, y1 - 1, pal)                          # 뒤통수 전체
    else:
        c.rect(x0, y0, x0, y0 + (5 if style != 'bald' else 2), pal, top_light=False)
        c.rect(x1, y0, x1, y0 + (5 if style != 'bald' else 2), pal, top_light=False)
    if style == 'long':
        c.rect(x0 - 1, y0 + 1, x0, y1 + 3, pal, top_light=False)
        c.rect(x1, y0 + 1, x1 + 1, y1 + 3, pal, top_light=False)
    if style == 'bald':
        c.rect(x0 + 1, y0, x1 - 1, y0 + 1, PALETTES[cfg.get('skin', 'skin_light')], top_light=False)


def L_hat(c: Canvas, p, cfg):
    if not cfg.get('hat'):
        return
    pal = PALETTES[cfg['hat']]
    x0, y0, x1, y1 = p['head']
    style = cfg.get('hat_style', 'cap')
    if style == 'cap':
        c.rect(x0, y0, x1, y0 + 2, pal)
        if p['dir'] == 'down':
            c.rect(x0, y0 + 3, x1, y0 + 3, pal, top_light=False)          # 챙 앞
        elif p['side']:
            d = 1 if p['dir'] == 'right' else -1
            c.rect(x1 + 1 if d > 0 else x0 - 2, y0 + 2, x1 + 2 if d > 0 else x0 - 1, y0 + 2, pal, top_light=False)
    elif style == 'beanie':
        c.rect(x0, y0 - 1, x1, y0 + 3, pal)
    elif style == 'sun':                                                   # 밀짚/차양 모자
        c.rect(x0, y0, x1, y0 + 2, pal)
        c.rect(x0 - 2, y0 + 3, x1 + 2, y0 + 3, pal, top_light=False)
    elif style == 'bandana':
        c.rect(x0, y0 + 1, x1, y0 + 2, pal, top_light=False)


def L_face(c: Canvas, p, cfg):
    if p['dir'] == 'up':
        return
    x0, y0, x1, y1 = p['head']
    ey = y0 + 5
    eye = hx('#2a2430')
    if p['side']:
        ex = x0 + 1 if p['dir'] == 'left' else x1 - 1
        c.put(ex, ey, eye)
    else:
        c.put(x0 + 2, ey, eye)
        c.put(x1 - 2, ey, eye)
    if cfg.get('beard'):
        pal = PALETTES[cfg['beard']]
        c.rect(x0 + 1, y1 - 1, x1 - 1, y1, pal, top_light=False)
    if cfg.get('glasses'):
        g = PALETTES[cfg['glasses']][1]
        if p['side']:
            rng = range(x0 + 1, x0 + 4) if p['dir'] == 'left' else range(x1 - 3, x1)
        else:
            rng = range(x0 + 1, x1)
        for gx in rng:
            c.put(gx, ey, g)


def L_held(c: Canvas, p, cfg):
    """손에 든 물건 — 장비 착용 상태가 실루엣으로 드러나는 핵심 레이어."""
    item = cfg.get('held')
    if not item:
        return
    rod = PALETTES['brown']
    tip = PALETTES['cream']
    if item == 'rod':
        d = 1 if p['dir'] != 'left' else -1
        hand = p['armB'] if (p['armB'] and d > 0) else p['armA']
        ax, ay = (hand[2] + d, hand[3] - 1)
        for i in range(16):                      # 손 → 대각 위로 뻗는 장대
            x = ax + d * (i * 2 // 3)
            y = ay + 3 - i
            c.put(x, y, rod[1] if i < 11 else tip[0])
            if i < 11 and i % 4 == 3:
                c.put(x, y + 1, rod[2])          # 가이드 매듭
        c.put(ax - d, ay + 1, rod[2])            # 그립
    elif item == 'net':
        pal = PALETTES['gray']
        ax = (p['armB'] or p['armA'])[0] + 2
        ay = (p['armB'] or p['armA'])[1]
        for i in range(7):
            c.put(ax, ay + 4 - i, rod[1])
        c.rect(ax - 2, ay - 5, ax + 2, ay - 3, pal, top_light=False)
    elif item == 'crate':
        pal = PALETTES['brown']
        x0, y0, x1, y1 = p['torso']
        c.rect(x0 - 1, y0 + 3, x1 + 1, y0 + 7, pal)


LAYERS = [L_body, L_pants, L_shirt, L_vest, L_boots, L_gloves, L_hair, L_hat, L_face, L_held]


def round_head(c: Canvas, p):
    """머리 네 모서리 1px 깎기 — 상자머리 완화 (실루엣 가독성)."""
    x0, y0, x1, y1 = p['head']
    for x, y in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)):
        if 0 <= x + OFF_X < c.w and 0 <= y < c.h:
            c.g[y][x + OFF_X] = None


def render_cell(direction, frame, cfg):
    c = Canvas()
    p = pose(direction, frame, cfg.get('tall', 0))
    for fn in LAYERS:
        fn(c, p, cfg)
    round_head(c, p)
    c.outline()
    im = c.to_image()
    if direction == 'right':
        pass  # pose가 이미 방향 반영
    return im


def render_sheet(cfg):
    sheet = Image.new('RGBA', (CELL_W * len(FRAMES), CELL_H * len(DIRS)), (0, 0, 0, 0))
    for r, d in enumerate(DIRS):
        for col, f in enumerate(FRAMES):
            sheet.paste(render_cell(d, f, cfg), (col * CELL_W, r * CELL_H))
    return sheet


def upscale(im, k):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


# ---------------------------------------------------------------- 캐스트 (스토리 인물 → 파라미터)
CAST = {
    'player_bare':   dict(skin='skin_light', hair='hair_black', shirt='cream', pants='navy',
                          boots='brown', label='플레이어 (기본)'),
    'player_geared': dict(skin='skin_light', hair='hair_black', shirt='cream', pants='olive',
                          pants_len=8, boots='black', boot_h=4, vest='orange', gloves='gray',
                          hat='navy', hat_style='cap', held='rod', label='플레이어 (장비 착용)'),
    'okseon':        dict(skin='skin_old', hair='hair_white', hair_style='long', shirt='teal',
                          pants='gray', vest='apron', vest_style='apron', hat='red',
                          hat_style='bandana', tall=-1, label='정옥선 (좌판)'),
    'tak_mansu':     dict(skin='skin_tan', hair='hair_gray', shirt='cream', pants='brown',
                          boots='brown', hat='yellow', hat_style='sun', beard='hair_gray',
                          tall=-1, label='탁만수 (노인)'),
    'kang_ducheol':  dict(skin='skin_tan', hair='hair_gray', shirt='navy', pants='navy',
                          boots='black', boot_h=4, hat='navy', hat_style='cap',
                          beard='hair_gray', tall=1, label='강두철 (선장)'),
    'bae_nuri':      dict(skin='skin_light', hair='hair_brown', hair_style='long', shirt='yellow',
                          pants='navy', boots='brown', label='배누리 (청년)'),
    'do_hyeonsu':    dict(skin='skin_light', hair='hair_black', shirt='red', pants='black',
                          boots='black', glasses='black', vest='gray', held='rod',
                          tall=1, label='도현수 (라이벌)'),
    'go_manseok':    dict(skin='skin_old', hair='hair_white', shirt='olive', pants='brown',
                          boots='black', boot_h=4, hat='olive', hat_style='beanie',
                          beard='hair_white', label='고만석 (선주)'),
    'lee_suyeon':    dict(skin='skin_light', hair='hair_black', shirt='red', pants='black',
                          vest='apron', vest_style='apron', label='이수연 (식당)'),
    'coop_staff':    dict(skin='skin_tan', hair='hair_black', shirt='navy', pants='navy',
                          boots='black', hat='navy', hat_style='cap', held='crate',
                          label='어촌계 직원'),
}


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'packages/client-pc/public/characters/base')
    os.makedirs(out_dir, exist_ok=True)
    for cid, cfg in CAST.items():
        sh = render_sheet(cfg)
        sh.save(os.path.join(out_dir, f'{cid}_sheet.png'))
    print(f'sheets -> {out_dir} ({len(CAST)})')


if __name__ == '__main__':
    main()
