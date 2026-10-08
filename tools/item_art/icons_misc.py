# -*- coding: utf-8 -*-
"""재료 · 설치물 · 루어 · 식기 · 이야기 물건"""
import numpy as np
from kit import *
from shapes import *

_WOOD = [(0, 0xf2dcae), (0.3, 0xe4c890), (0.31, 0xcfae72), (0.75, 0xc4a266), (0.76, 0x9a7a44), (1, 0x7a5c2c)]


# ─────────────────────────────────────────────
# 재료
# ─────────────────────────────────────────────
@icon('wood', ids=['inv_mat_wood'], px=['px:it_wood'], label='목재')
def wood(cv):
    X, Y = cv.X, cv.Y
    g = noise(cv.a.shape, 3, 2)
    for (ox, oy, ln, hh, sd) in ((18, 98, 86, 9, 1), (26, 80, 84, 9, 2), (20, 62, 80, 9, 3)):
        u, v = cv.frame(ox, oy, -12)
        pl = (u >= 0) & (u <= ln) & (np.abs(v) <= hh)
        cv.paint(pl, ramp(v / (2 * hh) + 0.5, _WOOD))
        cv.tint(pl & (np.sin(v * 2.6 + g * 7 + sd) > 0.86), 0x9a7a44, 0.5)                      # 나뭇결
        end = (ell(u, v, ln, 0, 4.5, hh) <= 1)                                              # 마구리
        cv.paint(end, 0xe9cf9a)
        cv.paint(ring(u, v, ln, 0, 3.0, hh * 0.66, 0.6) | ring(u, v, ln, 0, 1.6, hh * 0.34, 0.6), 0xb98950)
        cv.paint((ell(u, v, 0, 0, 4.5, hh) <= 1) & (u < 0), 0x7a5c2c)
    cv.paint(box(X, Y, 44, 50, 52, 108, 1) & (cv.a > 0.5), 0xc9a86a)                           # 묶은 끈
    cv.tint(box(X, Y, 44, 50, 52, 108, 1) & (np.mod(Y, 3.0) < 0.9), 0x6b4d22, 0.6)


@icon('wire', ids=['inv_mat_wire'], px=['px:it_wire'], label='철사')
def wire(cv):
    X, Y = cv.X, cv.Y
    cx, cy = 62, 68
    r = np.sqrt(((X - cx) / 40) ** 2 + ((Y - cy) / 30) ** 2)
    coil = (r <= 1) & (r >= 0.52)
    a = np.arctan2((Y - cy) / 30, (X - cx) / 40)
    cv.paint(coil, ramp((r - 0.52) / 0.48, [(0, 0x59636d), (0.2, 0x8b949d), (0.45, 0xe8edf0), (0.6, 0xb9c2ca), (1, 0x4b545f)]))
    cv.tint(coil & (np.mod(r * 22 + a * 0.6, 1.0) < 0.28), 0x4b545f, 0.7)                        # 겹겹이 감긴 가닥
    cv.tint(coil & (np.abs(a + 2.2) < 0.25) & (np.mod(r * 22, 1.0) > 0.4), 0xffffff, 0.6)
    for an in (0.4, 2.2, -1.9):                                                             # 묶음 철끈
        tie = coil & (np.abs(np.arctan2(np.sin(a - an), np.cos(a - an))) < 0.09)
        cv.paint(tie, 0xc9302a)
    cv.paint(polyline(X, Y, [(96, 84), (108, 96), (114, 92), (116, 104)], 1.3), 0xb9c2ca)        # 풀린 끝


@icon('resin', ids=['inv_mat_resin'], label='에폭시 수지')
def resin(cv):
    X, Y = cv.X, cv.Y
    def mark(letter_bars):
        def lab(cv, m, r):
            cy = (r[1] + r[3]) / 2
            cx = (r[0] + r[2]) / 2
            for (dx0, dy0, dx1, dy1) in letter_bars:
                cv.paint(m & capsule(cv.X, cv.Y, cx + dx0, cy + dy0, cx + dx1, cy + dy1, 1.1), 0x2b2f35)
        return lab
    A = [(-4, 6, 0, -6), (0, -6, 4, 6), (-2.2, 1.5, 2.2, 1.5)]
    B = [(-3, -6, -3, 6), (-3, -6, 2.5, -4), (2.5, -4, -3, 0), (-3, 0, 3.5, 3), (3.5, 3, -3, 6)]
    bottle(cv, cx=42, top=30, bottom=112, body_w=16, neck_w=6, neck_h=6, shoulder=9, glass=0xe9a83a, liquid=0xd9902a, level=0.1,
           cap=0x2b2f35, cap_h=8, cap_w=7.5, label=mark(A), label_y=(0.45, 0.8), label_col=0xf4f1e6, clear=True)
    bottle(cv, cx=86, top=40, bottom=112, body_w=14, neck_w=5.5, neck_h=5, shoulder=8, glass=0xcfe3ea, liquid=0xe8f4fa, level=0.12,
           cap=0xc9302a, cap_h=7, cap_w=7, label=mark(B), label_y=(0.45, 0.8), label_col=0xf4f1e6, clear=True)


@icon('paint', ids=['inv_mat_paint'], px=['px:it_paint'], colors=44, label='도료 세트')
def paint(cv):
    X, Y = cv.X, cv.Y
    for (cx, col) in ((30, 0xc9302a), (64, 0x2a78c8), (98, 0xf2c230)):
        side, _ = can(cv, cx=cx, top=62, bottom=102, hw=15, ry=4.2, color=0xc3ccd4, tab=False, rim=1.8,
                      label=lambda cv, m, r, col=col: cv.paint(m & (cv.Y > 72) & (cv.Y < 94), col))
        lid = ell(X, Y, cx, 62, 15, 4.2) <= 1
        cv.paint(ell(X, Y, cx, 62.4, 12, 3.0) <= 1, ramp((X - (cx - 12)) / 24, [(0, lit(col, 0.35)), (0.6, col), (1, lit(col, -0.3))]))   # 열린 통의 도료
    u, v = cv.frame(26, 44, 18)                                                              # 붓
    cv.paint((u >= 0) & (u <= 60) & (np.abs(v) <= 2.6), ramp(v / 5.2 + 0.5, cyl(0xa8743a, hl=0.3, gloss=0.4)))
    cv.paint((u > 58) & (u <= 70) & (np.abs(v) <= 3.6), ramp(v / 7.2 + 0.5, cyl(0xc3ccd4, hl=0.3)))
    br = (u > 69) & (u <= 86) & (np.abs(v) <= 4.2 - (u - 69) * 0.16)
    cv.paint(br, ramp((u - 69) / 17, [(0, 0x3a2a1a), (0.5, 0x5a3a1e), (0.55, 0x2a78c8), (1, 0x7cc4f2)]))


@icon('tin_ingot', ids=['inv_mat_tin'], px=['px:it_ingot'], colors=44, label='주석 잉곳')
def tin_ingot(cv):
    X, Y = cv.X, cv.Y
    def ingot(x0, y0, w=58, h=20, d=14):
        front = poly(cv, [(x0 + 5, y0), (x0 + w - 5, y0), (x0 + w, y0 + h), (x0, y0 + h)])
        cv.paint(front, ramp((Y - y0) / h, [(0, 0xe8edf0), (0.3, 0xc3ccd4), (0.8, 0x9aa3ab), (1, 0x6f7a84)]))
        top = poly(cv, [(x0 + 5, y0), (x0 + 5 + d, y0 - d * 0.7), (x0 + w - 5 + d, y0 - d * 0.7), (x0 + w - 5, y0)])
        cv.paint(top, ramp((X - x0) / (w + d), [(0, 0xffffff), (0.5, 0xe8edf0), (1, 0xc3ccd4)]))
        side = poly(cv, [(x0 + w - 5, y0), (x0 + w - 5 + d, y0 - d * 0.7), (x0 + w + d * 0.8, y0 + h - d * 0.55), (x0 + w, y0 + h)])
        cv.paint(side, ramp((Y - (y0 - d * 0.7)) / (h + d * 0.7), [(0, 0x9aa3ab), (1, 0x59636d)]))
        cv.tint(top & box(X, Y, x0 + 22, y0 - d * 0.55, x0 + w - 8, y0 - 2.5, 1), 0xb9c2ca, 0.7)   # 각인 자리
    ingot(12, 84); ingot(50, 84); ingot(30, 56)


@icon('mesh_roll', ids=['inv_mat_mesh'], px=['px:it_mesh'], colors=44, label='통발 그물망')
def mesh_roll(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(24, 84, -18)
    roll = (u >= 0) & (u <= 74) & (np.abs(v) <= 20)
    cv.paint(roll, ramp(v / 40 + 0.5, [(0, 0x0c2a22), (0.3, 0x1f5a48), (0.6, 0x16443a), (1, 0x081a16)]))
    cv.tint(roll & ((np.mod(u + v, 5.0) < 0.8) | (np.mod(u - v, 5.0) < 0.8)), 0x7fd0b0, 0.9)
    end = ell(u, v, 74, 0, 8, 20) <= 1
    cv.paint(end, ramp(np.sqrt(((u - 74) / 8) ** 2 + (v / 20) ** 2), [(0, 0x050d0b), (0.3, 0x0c2a22), (1, 0x2f7a66)]))
    cv.tint(end & (np.mod(np.sqrt(((u - 74) / 8) ** 2 + (v / 20) ** 2) * 6, 1.0) < 0.3), 0x7fd0b0, 0.8)
    tail = poly(cv, [(20, 96), (6, 116), (60, 122), (78, 104)])                                  # 풀려 나온 자락
    cv.paint(tail, 0x0c2a22)
    cv.tint(tail & ((np.mod(X + Y, 5.0) < 0.8) | (np.mod(X - Y, 5.0) < 0.8)), 0x6fc0a0, 0.9)
    for uu in (18, 52):
        cv.paint(roll & (np.abs(u - uu) < 1.6), 0xf2c230)


@icon('gear_set', ids=['inv_mat_gear'], colors=44, label='정밀 기어 세트')
def gear_set(cv):
    X, Y = cv.X, cv.Y
    case = box(X, Y, 12, 34, 116, 104, 6)
    cv.paint(case, ramp((Y - 34) / 70, [(0, 0x4a5058), (0.1, 0x33383e), (1, 0x15181c)]))
    foam = box(X, Y, 18, 40, 110, 98, 3)
    cv.paint(foam, ramp((Y - 40) / 58, [(0, 0x1b2a3d), (1, 0x23324f)]))

    def gear(cx, cy, r, teeth, col):
        a = np.arctan2(Y - cy, X - cx)
        rr = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
        cv.paint(disc(X, Y, cx, cy + 1.2, r * 1.18), 0x0c1220)                                 # 파인 자리 그늘
        m = rr <= r * (1.0 + 0.15 * (np.cos(a * teeth) > 0.15))
        cv.paint(m, ramp((X - (cx - r)) / (2 * r) * 0.55 + (Y - (cy - r)) / (2 * r) * 0.45, [(0, lit(col, 0.55)), (0.35, lit(col, 0.15)), (0.6, col), (1, lit(col, -0.5))]))
        cv.tint(m & ring(X, Y, cx, cy, r * 0.7, r * 0.7, 0.8), lit(col, -0.4), 0.7)
        cv.paint(disc(X, Y, cx, cy, r * 0.26), 0x0c1220)
    gear(42, 62, 17, 16, 0xd9ae3c)
    gear(78, 56, 11, 12, 0xc3ccd4)
    gear(92, 80, 13, 13, 0xd9ae3c)
    gear(62, 86, 7.5, 9, 0xc3ccd4)
    for k in range(3):                                                                     # 베어링 알
        cv.ball(28 + k * 7, 90, 2.6, 0xc3ccd4, gloss=0.8)
    cv.paint(box(X, Y, 50, 100, 78, 104, 1.5), 0x8b949d)


@icon('cloth', ids=['inv_mat_cloth'], px=['px:it_cloth'], label='무명천')
def cloth(cv):
    X, Y = cv.X, cv.Y
    for k, (y0, col) in enumerate(((84, 0xe6dfcf), (68, 0xf0eadc), (52, 0xfaf6ec))):
        top = poly(cv, [(14, y0), (38, y0 - 18), (114, y0 - 18), (90, y0)])
        front = box(X, Y, 14, y0, 90, y0 + 14, 3)
        side = poly(cv, [(90, y0), (114, y0 - 18), (114, y0 - 4), (90, y0 + 14)])
        cv.paint(side, lit(col, -0.3))
        cv.paint(front, ramp((Y - y0) / 14, [(0, lit(col, 0.1)), (1, lit(col, -0.22))]))
        cv.tint(front & (np.abs(Y - (y0 + 7)) < 0.6), lit(col, -0.4), 0.7)                        # 접힌 겹
        cv.paint(top, ramp((X - 14) / 100, [(0, lit(col, 0.3)), (1, lit(col, -0.05))]))
        cv.tint(top & ((np.mod(X + Y * 1.3, 4.0) < 0.6)), lit(col, -0.2), 0.4)                    # 올
    cv.paint(box(X, Y, 46, 36, 56, 100, 1) & (cv.a > 0.5), 0x2a78c8)                             # 묶음 띠
    cv.paint(poly(cv, [(46, 52), (70, 34), (80, 34), (56, 52)]) & (cv.a > 0.5), 0x3f8fd8)


@icon('rod_blank', ids=['inv_mat_blank'], label='로드 블랭크')
def rod_blank(cv):
    for (ox, oy, r0, r1, col) in ((10, 108, 5.6, 2.4, 0x2b2f35), (24, 120, 4.8, 2.0, 0x33383e), (2, 92, 4.2, 1.6, 0x23272c)):
        u, v = cv.frame(ox, oy, -45)
        ln = 142.0
        r = r0 + (r1 - r0) * np.clip(u / ln, 0, 1)
        m = (u >= 0) & (u <= ln) & (np.abs(v) <= r)
        cv.paint(m, ramp(v / (2 * r) + 0.5, cyl(col, hl=0.3, gloss=0.7, dark=0.4)))
        cv.tint(m & (np.mod(u + v * 2, 4.0) < 0.7), 0x59636d, 0.45)                              # 카본 직조 무늬
        cv.paint(m & (u < 6), ramp(v / (2 * r) + 0.5, cyl(0xc9a23a, hl=0.3, gloss=0.6)))
        cv.tint(m & (np.abs(u - 60) < 1.4), 0xc9a23a, 0.9)                                   # 금색 띠


# ─────────────────────────────────────────────
# 설치물
# ─────────────────────────────────────────────
@icon('farm_kit', ids=['inv_place_farm'], colors=44, label='텃밭 개간 키트')
def farm_kit(cv):
    X, Y = cv.X, cv.Y
    wood = 0xb98950
    front = box(X, Y, 14, 72, 96, 108, 2)
    cv.paint(front, ramp((Y - 72) / 36, [(0, lit(wood, 0.3)), (0.2, lit(wood, 0.1)), (1, lit(wood, -0.35))]))
    for yy in (84, 96):
        cv.tint(front & (np.abs(Y - yy) < 0.7), lit(wood, -0.55), 0.9)
    side = poly(cv, [(96, 72), (116, 58), (116, 94), (96, 108)])
    cv.paint(side, lit(wood, -0.45))
    soil = poly(cv, [(14, 72), (34, 58), (116, 58), (96, 72)])
    n = noise(cv.a.shape, 6, 1)
    cv.paint(soil, ramp(n, [(0, 0x3a2412), (0.5, 0x5a3a1e), (1, 0x7a5230)]))
    for (sx, sy) in ((38, 66), (58, 63), (78, 66), (96, 62), (48, 70), (72, 70)):                 # 새싹
        cv.paint(capsule(X, Y, sx, sy, sx, sy - 9, 0.9), 0x6db85a)
        cv.paint(ell(X, Y, sx - 3.2, sy - 10.5, 3.6, 2.0) <= 1, 0x4fa04a)
        cv.paint(ell(X, Y, sx + 3.2, sy - 11.5, 3.6, 2.0) <= 1, 0x7fd06a)
    u, v = cv.frame(100, 116, -62)                                                          # 모종삽
    cv.paint((u >= 0) & (u <= 34) & (np.abs(v) <= 2.6), ramp(v / 5.2 + 0.5, cyl(0xc9302a, hl=0.3, gloss=0.5)))
    cv.paint((u > 32) & (u <= 44) & (np.abs(v) <= 1.6), 0x8b949d)
    bl = (u > 42) & (u <= 70) & (np.abs(v) <= 8 * np.sin(np.pi * np.clip((u - 42) / 30, 0, 1)) ** 0.5)
    cv.paint(bl, ramp(v / 16 + 0.5, cyl(0xb9c2ca, hl=0.3, gloss=0.6)))
    pk = box(X, Y, 20, 80, 44, 104, 1.5)                                                       # 씨앗 봉투
    cv.paint(pk, 0xfff6de)
    cv.paint(pk & (Y < 86), 0x3fa04a)
    cv.paint(disc(X, Y, 32, 95, 5.0), 0xc9302a)
    cv.paint(poly(cv, [(29, 90), (32, 86), (35, 90)]), 0x3fa04a)


@icon('fence', ids=['inv_place_fence'], label='울타리')
def fence(cv):
    X, Y = cv.X, cv.Y
    wood = 0xc9a26a
    for yy in (58, 88):                                                                     # 가로대
        rail = box(X, Y, 6, yy, 122, yy + 8, 1)
        cv.paint(rail, ramp((Y - yy) / 8, [(0, lit(wood, 0.15)), (1, lit(wood, -0.4))]))
    g = noise(cv.a.shape, 9, 2)
    for k in range(6):
        x0 = 12 + k * 18.4
        pk = box(X, Y, x0, 34, x0 + 12, 112, 1) | poly(cv, [(x0, 35), (x0 + 6, 22), (x0 + 12, 35)])
        cv.paint(pk, ramp((X - x0) / 12, [(0, lit(wood, 0.35)), (0.3, lit(wood, 0.12)), (0.7, wood), (1, lit(wood, -0.35))]))
        cv.tint(pk & (np.sin(X * 2.4 + g * 6 + k) > 0.9), lit(wood, -0.35), 0.5)
        for yy in (62, 92):
            cv.paint(disc(X, Y, x0 + 6, yy, 1.2), 0x59636d)                                     # 못
    cv.tint((cv.a > 0.5) & (Y > 108), 0x4a7a3a, 0.5)                                            # 밑동 풀물


def _tank(cv, *, frame, water=0x2a8fd0, top=34, bottom=92, x0=14, x1=114, legs=True, glass_front=True):
    X, Y = cv.X, cv.Y
    body = box(X, Y, x0, top, x1, bottom, 3)
    cv.paint(body, ramp((Y - top) / (bottom - top), [(0, lit(frame, 0.3)), (0.2, frame), (1, lit(frame, -0.45))]))
    win = box(X, Y, x0 + 5, top + 6, x1 - 5, bottom - 6, 2)
    cv.paint(win, ramp((Y - (top + 6)) / (bottom - top - 12), [(0, lit(water, 0.45)), (0.12, lit(water, 0.2)), (0.5, water), (1, lit(water, -0.4))]))
    cv.tint(win & (np.abs(Y - (top + 9) - 1.0 * np.sin(X * 0.5)) < 0.8), 0xe8f6ff, 0.9)             # 수면
    cv.tint(win & (np.abs((X - x0) - (Y - top) * 0.8 - 8) < 2.4), 0xffffff, 0.22)                  # 유리 반사
    if legs:
        for lx in (x0 + 8, x1 - 8):
            cv.paint(box(X, Y, lx - 4, bottom, lx + 4, bottom + 18, 1), ramp((X - (lx - 4)) / 8, cyl(0x59636d, hl=0.3)))
        cv.paint(box(X, Y, x0 + 4, bottom + 8, x1 - 4, bottom + 12, 1), 0x4a5058)
    return win


def _fishy(cv, win, cx, cy, s, col, flip=False):
    X, Y = cv.X, cv.Y
    k = -1 if flip else 1
    body = win & (ell(X, Y, cx, cy, s, s * 0.45) <= 1)
    cv.paint(body, ramp((Y - (cy - s * 0.45)) / (s * 0.9), [(0, lit(col, -0.2)), (0.5, col), (1, lit(col, 0.5))]))
    cv.paint(win & poly(cv, [(cx + k * s * 0.8, cy), (cx + k * s * 1.5, cy - s * 0.5), (cx + k * s * 1.5, cy + s * 0.5)]), lit(col, -0.2))
    cv.paint(win & disc(X, Y, cx - k * s * 0.55, cy - s * 0.08, max(0.8, s * 0.12)), 0x0c0e10)


@icon('aquarium_live', ids=['inv_place_aq_live'], colors=48, label='활어 수조 (업소용)')
def aquarium_live(cv):
    X, Y = cv.X, cv.Y
    win = _tank(cv, frame=0x2a6fb0, water=0x2a8fd0, top=30, bottom=90)
    _fishy(cv, win, 44, 62, 13, 0x8a8170)
    _fishy(cv, win, 82, 74, 11, 0x6f7a84, flip=True)
    _fishy(cv, win, 86, 52, 8, 0xc98a7a)
    for (bx, by, r) in ((26, 76, 2.0), (28, 64, 1.5), (25, 54, 2.2), (30, 46, 1.4)):               # 기포
        cv.paint(win & ring(X, Y, bx, by, r, r, 0.7), 0xe8f6ff)
    cv.paint(box(X, Y, 20, 24, 44, 31, 2), 0x33383e)                                             # 산소 발생기
    cv.paint(capsule(X, Y, 26, 31, 26, 82, 0.8), 0xc3ccd4)
    cv.paint(box(X, Y, 74, 20, 110, 30, 2), ramp((Y - 20) / 10, [(0, 0xf4f1e6), (1, 0xc9c2ae)]))    # 가격표
    text_bars(cv, box(X, Y, 74, 20, 110, 30, 2), 77, 107, [23.5, 27], 0xc9302a, seed=3, h=0.8)


@icon('aquarium_display', ids=['inv_place_aq_disp'], colors=48, label='관상용 수족관')
def aquarium_display(cv):
    X, Y = cv.X, cv.Y
    cv.paint(box(X, Y, 12, 22, 116, 34, 3), ramp((Y - 22) / 12, [(0, 0x4a5058), (0.4, 0x2b2f35), (1, 0x0c0e10)]))   # 조명 덮개
    cv.paint(box(X, Y, 20, 31, 108, 34, 1), 0xfff6c8)
    win = _tank(cv, frame=0x2b2f35, water=0x1f9ab8, top=32, bottom=100, legs=False)
    sand = win & (Y > 84 + 2.0 * np.sin(X * 0.2))
    cv.paint(sand, ramp((Y - 84) / 10, [(0, 0xf2dcae), (1, 0xc9a86a)]))
    for (px, h, col) in ((30, 34, 0x3fa04a), (38, 24, 0x6db85a), (96, 38, 0x2f8f4f), (88, 22, 0x7fd06a)):   # 수초
        cv.paint(win & (np.abs(X - (px + 2.5 * np.sin((Y - 90) * 0.3))) < 1.6) & (Y < 88) & (Y > 88 - h), col)
    rock = win & (ell(X, Y, 64, 86, 13, 8) <= 1)
    cv.paint(rock, ramp((X - 51) / 26, [(0, 0x8b949d), (0.5, 0x66707a), (1, 0x3a4047)]))
    _fishy(cv, win, 50, 56, 8, 0xf07a1a)
    cv.tint(win & (np.abs(X - 50) < 1.2) & (np.abs(Y - 56) < 3.4), 0xffffff, 0.95)
    _fishy(cv, win, 80, 64, 7, 0xf2c230, flip=True)
    _fishy(cv, win, 72, 46, 5.5, 0x4aa3ff)
    for (bx, by, r) in ((104, 70, 1.6), (106, 58, 1.2), (103, 48, 1.8)):
        cv.paint(win & ring(X, Y, bx, by, r, r, 0.7), 0xe8f6ff)
    cv.paint(box(X, Y, 10, 100, 118, 108, 2), ramp((Y - 100) / 8, [(0, 0x4a5058), (1, 0x15181c)]))


# ─────────────────────────────────────────────
# 루어
# ─────────────────────────────────────────────
def _treble(cv, u, v, u0, col=0xc3ccd4, s=1.0):
    """세 갈래 바늘(지역 좌표 u 방향으로 뻗는다)"""
    cv.paint(capsule(u, v, u0, 0, u0 + 12 * s, 0, 1.1 * s), col)
    for sv in (-1, 1):
        cv.paint(polyline(u, v, [(u0 + 12 * s, 0), (u0 + 17 * s, sv * 5 * s), (u0 + 13 * s, sv * 9 * s), (u0 + 8 * s, sv * 6.5 * s)], 1.0 * s), col)
        cv.paint(poly_uv(cv, u, v, [(u0 + 8 * s, sv * 6.5 * s), (u0 + 5 * s, sv * 8 * s), (u0 + 9 * s, sv * 9.5 * s)]), lit(col, 0.3))
    cv.paint(polyline(u, v, [(u0 + 12 * s, 0), (u0 + 18 * s, 0), (u0 + 16 * s, 1.5 * s)], 1.0 * s), lit(col, -0.2))


def poly_uv(cv, u, v, pts):
    """지역 좌표 삼각형(작은 미늘)"""
    (ax, ay), (bx, by), (cx_, cy_) = pts
    def side(px, py, qx, qy): return (u - px) * (qy - py) - (v - py) * (qx - px)
    s1, s2, s3 = side(ax, ay, bx, by), side(bx, by, cx_, cy_), side(cx_, cy_, ax, ay)
    return ((s1 >= 0) & (s2 >= 0) & (s3 >= 0)) | ((s1 <= 0) & (s2 <= 0) & (s3 <= 0))


def _ring_uv(cv, u, v, u0, r=2.6, col=0xc3ccd4):
    cv.paint(ring(u, v, u0, 0, r, r, 0.9), col)


@icon('lure_spoon', prefixes=['lure_spoon_'], label='스푼')
def lure_spoon(cv):
    u, v = cv.frame(18, 104, -38)
    hw = 13.5 * np.sin(np.pi * np.clip(u / 70 * 0.86 + 0.07, 0, 1)) ** 0.75 * (0.6 + 0.4 * u / 70)
    sp = (u >= 0) & (u <= 70) & (np.abs(v) <= hw)
    cv.paint(sp, ramp(v / (2 * np.maximum(hw, 1)) + 0.5, [(0, 0x8b949d), (0.15, 0xe8edf0), (0.3, 0xffffff), (0.45, 0xc3ccd4), (0.8, 0x8b949d), (1, 0x4b545f)]))
    cv.tint(sp & (np.mod(u + v * 0.4, 6.0) < 1.2) & (v > 0), 0x6f7a84, 0.35)                       # 두들긴 무늬
    cv.tint(sp & (np.abs(v + hw * 0.1) < 1.6) & (u > 14) & (u < 60), 0xc9302a, 0.85)                # 붉은 줄
    cv.erase(disc(u, v, 4, 0, 1.6)); cv.erase(disc(u, v, 66, 0, 1.6))
    _ring_uv(cv, u, v, 0.5); _ring_uv(cv, u, v, 70)
    _treble(cv, u, v, 72)
    cv.paint(ring(u, v, -5, 0, 3.2, 2.2, 0.9), 0x8b949d)                                        # 스냅


@icon('lure_spinner', prefixes=['lure_spinner_'], label='스피너')
def lure_spinner(cv):
    u, v = cv.frame(14, 106, -38)
    cv.paint(capsule(u, v, 0, 0, 84, 0, 0.9), 0xb9c2ca)                                          # 축 철사
    _ring_uv(cv, u, v, 0)
    for (uu, r, col) in ((40, 3.2, 0xc9302a), (47, 4.2, 0xf2c230), (56, 5.0, 0xc9302a), (64, 3.6, 0x2b2f35)):   # 몸 구슬
        m = ell(u, v, uu, 0, r * 1.25, r) <= 1
        cv.paint(m, ramp(v / (2 * r) + 0.5, cyl(col, hl=0.3, gloss=0.7)))
    bu, bv = cv.frame(14 + 22 * np.cos(np.deg2rad(38)), 106 - 22 * np.sin(np.deg2rad(38)), -12)    # 블레이드(축에서 벌어져 돈다)
    bl = (ell(bu, bv, 20, -3, 20, 9) <= 1) & (bu > 0)
    cv.paint(bl, ramp((bv + 12) / 18, [(0, 0xfff6c8), (0.3, 0xf6e08a), (0.5, 0xd9ae3c), (0.85, 0xb0832a), (1, 0x7a5718)]))
    cv.tint(bl & (np.mod(bu, 5.0) < 1.0), 0xfff6c8, 0.35)
    cv.paint(ring(u, v, 20, 0, 2.6, 2.2, 0.9), 0x8b949d)                                         # 클레비스
    _treble(cv, u, v, 82)
    for k in range(5):                                                                      # 붉은 꼬리 깃
        cv.paint(capsule(u, v, 80, 0, 96 + (k % 2) * 3, -5 + k * 2.5, 0.8), 0xe0452a)


@icon('lure_egi', prefixes=['lure_egi_'], ids=['craft_egi_tuned'], colors=44, label='에기')
def lure_egi(cv):
    u, v = cv.frame(14, 96, -24)
    t = np.clip(u / 84, 0, 1)
    hw = 2.0 + 8.5 * np.sin(np.pi * np.clip(t * 0.8 + 0.08, 0, 1)) ** 0.9
    body = (u >= 0) & (u <= 84) & (v >= -hw) & (v <= hw * 0.8)
    cv.paint(body, ramp((v + hw) / (1.8 * hw), [(0, 0xf07a1a), (0.25, 0xff9a4a), (0.5, 0xf2c890), (0.75, 0xfff0d8), (1, 0xe8d8b8)]))
    cv.tint(body & (np.mod(u + v * 1.2, 7.0) < 2.2) & (v < 0), 0xc9302a, 0.6)                       # 등 무늬(천)
    cv.tint(body & ((np.mod(u, 2.4) < 0.5) | (np.mod(v, 2.4) < 0.5)), 0xffffff, 0.12)
    cv.paint(disc(u, v, 72, -1.5, 3.2), 0xfff6c8)                                                # 눈
    cv.paint(disc(u, v, 72.5, -1.5, 1.6), 0x0c0e10)
    nose = (u > 82) & (u <= 92) & (np.abs(v + 0.5) <= 2.4 - (u - 82) * 0.2)
    cv.paint(nose, 0xf07a1a)
    _ring_uv(cv, u, v, 94, r=2.4)
    sink = poly_uv(cv, u, v, [(60, hw[0, 0] * 0 + 6), (74, 6), (67, 14)])                           # 납 싱커
    cv.paint(sink, 0x8b949d)
    for (fu, ang) in ((30, 0.5), (36, 0.35)):                                                    # 깃털
        for sv in (-1, 1):
            cv.paint(capsule(u, v, fu, sv * 5, fu - 12, sv * (9 + ang * 6), 1.2), 0xfff0d8)
    for k in range(2):                                                                      # 바늘 왕관
        uu = -2 - k * 7
        cv.paint(capsule(u, v, 0, 0, uu, 0, 1.0), 0xb9c2ca)
        for sv in (-1, -0.5, 0.5, 1):
            cv.paint(polyline(u, v, [(uu, 0), (uu - 3, sv * 5.5), (uu + 1.5, sv * 7)], 0.7), 0xdfe5ea)


@icon('lure_tairaba', prefixes=['lure_tairaba_'], colors=44, label='타이라바')
def lure_tairaba(cv):
    X, Y = cv.X, cv.Y
    cv.ball(86, 36, 18, 0xd2302a, gloss=0.75)                                                    # 둥근 헤드
    cv.paint(disc(X, Y, 80, 30, 4.2), 0xfff6c8)
    cv.paint(disc(X, Y, 80.6, 30.4, 2.2), 0x0c0e10)
    cv.paint(ring(X, Y, 104, 22, 3.2, 3.2, 1.0), 0xc3ccd4)
    rng = np.random.default_rng(5)
    for k in range(16):                                                                     # 스커트(가는 고무 가닥)
        a = np.deg2rad(205 + rng.uniform(-28, 28))
        ln = rng.uniform(40, 62)
        x1, y1 = 78 + ln * np.cos(a), 46 - ln * np.sin(a)
        mx, my = 78 + ln * 0.5 * np.cos(a) + rng.uniform(-5, 5), 46 - ln * 0.5 * np.sin(a) + rng.uniform(-3, 3)
        cv.paint(polyline(X, Y, [(76, 46), (mx, my), (x1, y1)], 0.85), int(rng.choice([0xf07a1a, 0xe0452a, 0xf2c230, 0xff9a4a])))
    for (x1, y1, w) in ((30, 100, 3.4), (22, 86, 3.0)):                                          # 넥타이(넓은 띠 둘)
        tie = polyline(X, Y, [(74, 48), ((74 + x1) / 2 + 4, (48 + y1) / 2 - 4), (x1, y1)], w)
        cv.paint(tie, ramp((Y - 48) / 56, [(0, 0xff9a4a), (0.6, 0xf07a1a), (1, 0xc2500c)]))
    for (hx, hy) in ((50, 82), (42, 70)):                                                       # 바늘 둘
        cv.paint(polyline(X, Y, [(72, 50), (hx + 6, hy - 4)], 0.7), 0x2b2f35)
        cv.paint(polyline(X, Y, [(hx + 6, hy - 4), (hx + 2, hy + 6), (hx - 3, hy + 5), (hx - 3, hy)], 1.0), 0xdfe5ea)


@icon('lure_set', ids=['lure_starter_set'], px=['px:it_lure'], colors=48, label='입문 루어 세트')
def lure_set(cv):
    X, Y = cv.X, cv.Y
    case = box(X, Y, 10, 40, 118, 100, 5)
    cv.paint(case, ramp((X - 10) / 108 * 0.5 + (Y - 40) / 60 * 0.5, [(0, 0xdff1fb), (0.3, 0xbfe2f7), (0.7, 0x9acbe8), (1, 0x6aa6d2)]))
    for (x0, x1) in ((14, 46), (48, 80), (82, 114)):
        cv.paint(box(X, Y, x0, 44, x1, 96, 3), ramp((Y - 44) / 52, [(0, 0xeef8fe), (1, 0xcfe8f7)]))
    # 미노우 · 스푼 · 웜
    m = ell(X, Y, 30, 70, 5, 20) <= 1
    cv.paint(m, ramp((X - 25) / 10, [(0, 0x2a5a9a), (0.4, 0xc3ccd4), (1, 0xf4f6f7)]))
    cv.paint(disc(X, Y, 30, 55, 1.6), 0x0c0e10)
    cv.paint(poly(cv, [(26, 88), (30, 94), (34, 88)]), 0x2a5a9a)
    s = ell(X, Y, 64, 68, 7, 17) <= 1
    cv.paint(s, ramp((X - 57) / 14, [(0, 0x8b949d), (0.3, 0xffffff), (0.6, 0xc3ccd4), (1, 0x59636d)]))
    cv.paint(ring(X, Y, 64, 89, 2.2, 2.2, 0.8), 0x8b949d)
    w = (np.abs(X - (98 + 3.0 * np.sin((Y - 50) * 0.3))) < 3.2) & (Y > 50) & (Y < 92)
    cv.paint(w, ramp((Y - 50) / 42, [(0, 0xf07aa0), (1, 0xc9306a)]))
    cv.tint(w & (np.mod(Y, 3.4) < 0.8), 0x9a1f4a, 0.6)
    cv.tint(case & (np.abs((X - 10) - (Y - 40) * 0.9 - 14) < 2.0), 0xffffff, 0.4)                    # 뚜껑 반사
    for lx in (38, 90):
        cv.paint(box(X, Y, lx - 5, 97, lx + 5, 104, 1.5), 0x2a78c8)


@icon('egi_set', ids=['egi_pro_set'], colors=48, label='고급 에기 세트')
def egi_set(cv):
    X, Y = cv.X, cv.Y
    card = box(X, Y, 18, 12, 110, 116, 4)
    cv.paint(card, ramp((Y - 12) / 104, [(0, 0x23324f), (1, 0x14203a)]))
    cv.paint(box(X, Y, 18, 12, 110, 30, 4), 0xf2c230)
    cv.erase(disc(X, Y, 64, 20, 3.0))
    text_bars(cv, card, 26, 54, [22], 0x23324f, seed=4, h=1.2)
    bl = box(X, Y, 24, 36, 104, 110, 6)                                                        # 투명 덮개
    cv.paint(bl, ramp((X - 24) / 80, [(0, 0x3a4a6a), (0.2, 0x55688a), (0.5, 0x33425f), (1, 0x232f48)]))
    for (oy, col1, col2) in ((60, 0xf07a1a, 0xc9302a), (92, 0x4fb0e0, 0x2a5a9a)):
        u, v = cv.frame(30, oy + 6, -8)
        t = np.clip(u / 62, 0, 1)
        hw = 1.6 + 7.0 * np.sin(np.pi * np.clip(t * 0.8 + 0.08, 0, 1)) ** 0.9
        body = (u >= 0) & (u <= 62) & (v >= -hw) & (v <= hw * 0.8)
        cv.paint(body, ramp((v + hw) / (1.8 * hw), [(0, col1), (0.4, lit(col1, 0.3)), (0.7, 0xfff0d8), (1, 0xe8d8b8)]))
        cv.tint(body & (np.mod(u + v * 1.2, 6.0) < 1.8) & (v < 0), col2, 0.6)
        cv.paint(disc(u, v, 53, -1.2, 2.4), 0xfff6c8); cv.paint(disc(u, v, 53.3, -1.2, 1.1), 0x0c0e10)
        for sv in (-1, -0.4, 0.4, 1):
            cv.paint(polyline(u, v, [(0, 0), (-5, sv * 4.5), (-2, sv * 6)], 0.7), 0xdfe5ea)
    cv.tint(bl & (np.abs((X - 24) - (Y - 36) * 0.5 - 10) < 2.2), 0xffffff, 0.3)


@icon('rig_card', ids=['craft_rig_chinu', 'craft_rig_blackfish', 'craft_rig_surf'], px=['px:it_rig'], label='묶음 채비')
def rig_card(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(64, 64, -6)
    card = (np.abs(u) <= 36) & (np.abs(v) <= 48)
    card &= ~((np.abs(u) > 30) & (np.abs(v) < 6))                                              # 줄 걸이 홈
    cv.paint(card, ramp((u + v) / 168 + 0.5, [(0, 0xfff8e6), (0.5, 0xf2e6c8), (1, 0xd9c79a)]))
    cv.paint(card & (v < -34), 0x2a78c8)
    cv.erase(disc(u, v, 0, -41, 2.6))
    for k in range(9):                                                                      # 감아 둔 목줄
        vv = -22 + k * 4.4
        cv.paint(card & (np.abs(v - vv - u * 0.05) < 0.55) & (np.abs(u) < 31), 0x9ad0e8)
    for (hu, hv) in ((-18, 26), (2, 30), (20, 26)):                                            # 바늘 셋
        cv.paint(polyline(u, v, [(hu, hv - 12), (hu, hv + 2), (hu + 3, hv + 6), (hu + 7, hv + 5), (hu + 8, hv)], 1.0), 0x59636d)
        cv.paint(disc(u, v, hu, hv - 12, 1.5), 0xc9302a)


# ─────────────────────────────────────────────
# 식기 · 양념 세트 · 미끼
# ─────────────────────────────────────────────
def _plate(cv, s):
    X, Y = cv.X, cv.Y
    cx, cy = 64, 68
    rx, ry = 56 * s, 34 * s
    cv.paint(ell(X, Y, cx, cy + 4 * s, rx * 0.96, ry * 0.96) <= 1, 0x8fa0ae)                       # 굽 그늘
    pl = ell(X, Y, cx, cy, rx, ry) <= 1
    cv.paint(pl, ramp((X - (cx - rx)) / (2 * rx) * 0.6 + (Y - (cy - ry)) / (2 * ry) * 0.4, [(0, 0xffffff), (0.5, 0xf2f5f7), (1, 0xc3ced7)]))
    cv.paint(ring(X, Y, cx, cy, rx * 0.93, ry * 0.93, 1.6 * s + 0.6), 0x2a78c8)                     # 남색 테
    well = ell(X, Y, cx, cy + 1.5 * s, rx * 0.66, ry * 0.62) <= 1
    cv.paint(well, ramp((Y - (cy - ry * 0.62)) / (2 * ry * 0.62), [(0, 0xcfd8df), (0.4, 0xe8eef2), (1, 0xffffff)]))
    cv.tint(pl & (ell(X, Y, cx - rx * 0.4, cy - ry * 0.45, rx * 0.3, ry * 0.14) <= 1), 0xffffff, 0.8)


@icon('plate_s', ids=['inv_plate_s'], label='사시미 접시 (소)')
def plate_s(cv): _plate(cv, 0.62)


@icon('plate_m', ids=['inv_plate_m'], label='사시미 접시 (중)')
def plate_m(cv): _plate(cv, 0.76)


@icon('plate_l', ids=['inv_plate_l'], label='사시미 접시 (대)')
def plate_l(cv): _plate(cv, 0.88)


@icon('plate_xl', ids=['inv_plate_xl'], label='사시미 접시 (특대)')
def plate_xl(cv): _plate(cv, 1.0)


@icon('sauce_set', ids=['shop_sauce'], colors=48, label='양념 세트')
def sauce_set(cv):
    X, Y = cv.X, cv.Y
    for (cx, glass, liquid, cap) in ((38, 0x3a2418, 0x24140c, 0xc9302a), (64, 0xc98a3a, 0xb5702a, 0xf2c230), (90, 0xb5241c, 0x9a1f1a, 0x2f8f4f)):
        bottle(cv, cx=cx, top=30, bottom=96, body_w=10.5, neck_w=4.4, neck_h=8, shoulder=8, glass=glass, liquid=liquid, level=0.1,
               cap=cap, cap_h=6, cap_w=5.4, label=None, label_y=(0.52, 0.82), label_col=0xf4f1e6)
    tray = box(X, Y, 18, 84, 110, 108, 4)                                                       # 나무 받침
    cv.paint(tray, ramp((Y - 84) / 24, [(0, 0xe4c890), (0.2, 0xcfae72), (1, 0x8a6a3a)]))
    cv.tint(tray & (np.mod(X + Y * 0.3, 9.0) < 0.8), 0x8a6a3a, 0.5)
    cv.paint(box(X, Y, 16, 82, 112, 88, 2), ramp((Y - 82) / 6, [(0, 0xf2dcae), (1, 0xb98950)]))


@icon('breadball', ids=['inv_breadbait'], px=['px:it_breadball'], label='빵가루 경단')
def breadball(cv):
    X, Y = cv.X, cv.Y
    n = noise(cv.a.shape, 4, 1)
    for (cx, cy, r) in ((44, 80, 22), (84, 84, 19), (66, 50, 17)):
        m = cv.ball(cx, cy, r, 0xe8c98a, gloss=0.4)
        cv.tint(m & (n > 0.7), 0xfff0c8, 0.6)                                                   # 빵가루 알갱이
        cv.tint(m & (n < 0.28), 0xb98950, 0.5)


# ─────────────────────────────────────────────
# 이야기 물건
# ─────────────────────────────────────────────
def _photo(cv, u, v, hw, hh, wet=False):
    paper = (np.abs(u) <= hw) & (np.abs(v) <= hh)
    cv.paint(paper, ramp((u + v) / (2 * (hw + hh)) + 0.5, [(0, 0xffffff), (0.6, 0xf4f1e6), (1, 0xd9d3c0)]))
    pic = (np.abs(u) <= hw - 4) & (v >= -hh + 4) & (v <= hh - 9)
    cv.paint(pic, ramp((v + hh) / (2 * hh), [(0, 0x8fc8f0), (0.45, 0xcfe8f7), (0.5, 0x3f8fc0), (0.7, 0x2a6fa0), (0.72, 0xd9c79a), (1, 0xb99a6a)]))   # 하늘 · 바다 · 방파제
    for k, (du, col) in enumerate(((-12, 0xc9302a), (-4, 0x2a78c8), (4, 0xf2c230), (12, 0x3fa04a))):       # 사람 넷
        hd = pic & (ell(u, v, du, hh * 0.22 - (k % 2) * 3, 2.6, 2.6) <= 1)
        cv.paint(hd, 0xf2c8a0)
        cv.paint(pic & box(u, v, du - 3.4, hh * 0.22 - (k % 2) * 3 + 2.6, du + 3.4, hh - 9), col)
    if wet:
        n = noise(cv.a.shape, 8, 4)
        cv.tint(paper & (n > 0.6), 0x8fa9b8, 0.45)                                              # 물 얼룩
        cv.tint(pic & (n > 0.72), 0xe8f4fa, 0.5)
    return paper


@icon('family_photo', ids=['quest_family_photo'], px=['px:it_photo'], colors=48, label='가족사진')
def family_photo(cv):
    u, v = cv.frame(64, 64, -6)
    fr = (np.abs(u) <= 44) & (np.abs(v) <= 36)
    cv.paint(fr, ramp((u + v) / 160 + 0.5, [(0, 0xc9a26a), (0.4, 0x9a6a34), (1, 0x5e3a14)]))
    cv.tint(fr & ((np.abs(u) > 41) | (np.abs(v) > 33)), 0xe9cf9a, 0.5)
    cv.paint((np.abs(u) <= 38) & (np.abs(v) <= 30), 0x3a2412)
    _photo(cv, u, v, 36, 28)
    cv.tint((np.abs(u) <= 36) & (np.abs(v) <= 28) & (np.abs(u - v * 0.8 + 14) < 2.4), 0xffffff, 0.3)    # 유리 반사


@icon('wet_photo', ids=['qi_cleanup_photo'], colors=48, label='물에 젖은 단체사진')
def wet_photo(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(64, 62, 9)
    v = v + 3.0 * np.sin(u * 0.08)                                                             # 울어서 휜 종이
    _photo(cv, u, v, 40, 30, wet=True)
    for (dx, dy, r) in ((30, 98, 4.0), (92, 104, 3.0), (104, 60, 2.4)):                            # 물방울
        cv.ball(dx, dy, r, 0x8fc8f0, ry=r * 1.2, gloss=0.8)


@icon('tide_sample', ids=['qi_tide_sample'], px=['px:qi_sample'], colors=48, label='조간대 표본')
def tide_sample(cv):
    X, Y = cv.X, cv.Y

    def content(cv, m, r):
        cv.paint(m, ramp((Y - r[1]) / (r[3] - r[1]), [(0, 0x7cc4f2), (0.6, 0x4a9ad8), (1, 0x2a6fa0)]))
        cv.paint(m & (Y > r[3] - 9 + 1.5 * np.sin(X * 0.4)), 0xd9c79a)                            # 모래
        for (px, h, col) in ((52, 30, 0x3f8f4a), (60, 22, 0x6db85a), (76, 34, 0x8a5a2a)):          # 해조
            cv.paint(m & (np.abs(X - (px + 2.4 * np.sin((Y - r[3]) * 0.3))) < 1.8) & (Y > r[3] - 9 - h), col)
        sh = m & (ell(X, Y, 70, r[3] - 9, 6.5, 4.5) <= 1)                                         # 고둥
        cv.paint(sh, ramp((X - 63.5) / 13, [(0, 0xf2e6d0), (0.5, 0xc9a882), (1, 0x8a6a4a)]))
        cv.tint(sh & (np.mod(X, 2.6) < 0.7), 0x8a6a4a, 0.6)
    jar(cv, top=26, bottom=108, hw=24, lid=0xa8743a, lid_h=12, content=0x4a9ad8, level=0.14, content_fn=content, label=None, label_col=None)
    tag = poly(cv, [(86, 44), (112, 38), (116, 54), (90, 60)])                                    # 표본 꼬리표
    cv.paint(tag, 0xfff6de)
    cv.paint(polyline(X, Y, [(88, 52), (80, 46), (76, 38)], 0.8), 0xc9a86a)
    text_bars(cv, tag, 94, 112, [46.5, 51], 0x55535a, seed=3, h=0.8)


@icon('bamboo_piece', ids=['qi_bamboo_piece'], label='쓸 만한 대나무 토막')
def bamboo_piece(cv):
    for (ox, oy, ln, r, sd) in ((14, 98, 108, 8.5, 1), (22, 116, 90, 6.5, 2)):
        u, v = cv.frame(ox, oy, -28)
        m = (u >= 0) & (u <= ln) & (np.abs(v) <= r)
        cv.paint(m, ramp(v / (2 * r) + 0.5, cyl(0x9ab84a, hl=0.3, gloss=0.55, dark=0.45)))
        for k in range(1, 4):                                                               # 마디
            uu = ln * k / 4 + sd * 3
            cv.paint(m & (np.abs(u - uu) < 1.8), ramp(v / (2 * r) + 0.5, cyl(0x6f8a2a, hl=0.3)))
            cv.tint(m & (np.abs(u - uu - 2.4) < 0.6), 0xd9e89a, 0.7)
        end = ell(u, v, ln, 0, 3.4, r) <= 1
        cv.paint(end, 0xe8dca8)
        cv.paint(ell(u, v, ln, 0, 1.9, r * 0.6) <= 1, 0x5a4a1e)


@icon('sinker_stone', ids=['qi_sinker_stone'], px=['px:qi_stone'], label='봉돌감 돌')
def sinker_stone(cv):
    X, Y = cv.X, cv.Y
    m = cv.ball(64, 72, 40, 0x8a9098, ry=28, gloss=0.45)
    n = noise(cv.a.shape, 7, 2)
    cv.tint(m & (n > 0.66), 0x6f757c, 0.5)                                                      # 결 · 반점
    cv.tint(m & (n < 0.26), 0xb9bec4, 0.4)
    cv.tint(m & (np.abs(Y - (70 + 5.0 * np.sin(X * 0.12))) < 1.0), 0xe8eaec, 0.7)                  # 흰 줄무늬(석영맥)
    cv.tint(m & (np.abs(X - 64 - (Y - 72) * 0.15) < 1.6), 0x4a4f55, 0.75)                          # 줄 맬 홈
