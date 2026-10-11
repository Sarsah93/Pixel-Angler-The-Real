# -*- coding: utf-8 -*-
"""조리 도구 · 현장 도구 · 구급품 · 수리 용품"""
import numpy as np
from kit import *
from shapes import *

_STEEL = 0xb9c2ca
_ALU = 0xc9d0d6


# ─────────────────────────────────────────────
# 조리 도구
# ─────────────────────────────────────────────
@icon('stove_portable', ids=['cook_stove_portable'], px=['px:it_stove'], colors=44, label='휴대용 가스스토브')
def stove_portable(cv):
    X, Y = cv.X, cv.Y
    base = 0x2a5a9a
    top = poly(cv, [(8, 70), (28, 46), (120, 46), (100, 70)])
    front = box(X, Y, 8, 70, 100, 98, 2)
    side = poly(cv, [(100, 70), (120, 46), (120, 74), (100, 98)])
    cv.paint(side, ramp((Y - 46) / 52, [(0, lit(base, -0.3)), (1, lit(base, -0.6))]))
    cv.paint(front, ramp((Y - 70) / 28, [(0, lit(base, 0.25)), (0.15, base), (0.8, lit(base, -0.2)), (1, lit(base, -0.45))]))
    cv.paint(top, ramp((Y - 46) / 24, [(0, 0xb9c2ca), (1, 0xe8edf0)]))
    cv.tint(top & poly(cv, [(72, 68), (88, 48), (118, 48), (102, 68)]), lit(base, 0.1), 0.95)   # 가스통 덮개
    cv.tint(top & (seg_dist(X, Y, 71, 69, 88, 47) < 0.7), 0x59636d, 0.9)
    # 화구 — 받침 접시 · 버너 · 삼발이
    cv.paint(ell(X, Y, 46, 58, 24, 9) <= 1, ramp((Y - 49) / 18, [(0, 0x8b949d), (1, 0xdfe5ea)]))
    cv.paint(ell(X, Y, 46, 58, 15, 5.6) <= 1, 0x33383e)
    cv.paint(ell(X, Y, 46, 57.5, 9.5, 3.6) <= 1, 0x15181c)
    fl = ring(X, Y, 46, 57.5, 12.5, 4.6, 2.0)
    cv.paint(fl & (np.mod(np.arctan2((Y - 57.5) * 2.7, X - 46) * 4, 1.0) < 0.6), 0x4aa3ff)          # 푸른 불꽃
    for (a, b, c, d) in ((46, 58, 20, 50), (46, 58, 72, 50), (46, 58, 30, 67), (46, 58, 62, 67)):
        cv.paint(capsule(X, Y, a + (c - a) * 0.45, b + (d - b) * 0.45, c, d - 5, 1.5), 0x2b2f35)
    cv.paint(disc(X, Y, 28, 84, 7.5), ramp((Y - 76.5) / 15, [(0, 0x59636d), (0.5, 0x2b2f35), (1, 0x0c0e10)]))   # 점화 손잡이
    cv.paint(box(X, Y, 27, 78, 29, 84, 0.6), 0xf4f1e6)
    cv.paint(box(X, Y, 46, 79, 82, 90, 1.5), 0xf4f1e6)                                                 # 주의 표
    text_bars(cv, box(X, Y, 46, 79, 82, 90, 1.5), 49, 79, [82.5, 86.5], 0xc9302a, seed=3, h=0.8)
    for fx in (16, 92):
        cv.paint(box(X, Y, fx - 4, 97, fx + 4, 102, 1), 0x15181c)


def _pot(cv, *, cx=62, top=52, bottom=102, hw=38, metal=_ALU, lid=None, knob=0x2b2f35, handles='side', glass=False):
    X, Y = cv.X, cv.Y
    ry = 9.0
    t = np.clip((Y - top) / (bottom - top), 0, 1)
    w = hw - 2.0 * t
    body = ((Y >= top) & (Y <= bottom) & (np.abs(X - cx) <= w)) | (ell(X, Y, cx, bottom, hw - 2.0, ry * 0.8) <= 1)
    cv.paint(body, ramp((X - (cx - w)) / (2 * w), cyl(metal, hl=0.26, gloss=0.65, dark=0.5)))
    cv.tint(body & (np.abs(Y - (top + ry + 5)) < 0.6), lit(metal, -0.4), 0.5)
    if handles == 'side':
        for sx in (-1, 1):
            h = ring(X, Y, cx + sx * (hw + 4), top + 14, 9, 6, 2.6) & ((X - cx) * sx > hw - 1)
            cv.paint(h, ramp((Y - (top + 8)) / 12, [(0, 0x59636d), (0.5, 0x2b2f35), (1, 0x0c0e10)]))
    else:                                                                                # 접이식 긴 손잡이
        cv.paint(polyline(X, Y, [(cx + hw - 2, top + 12), (cx + hw + 14, top + 6), (cx + hw + 26, top + 8)], 2.2), 0x8b949d)
        cv.paint(polyline(X, Y, [(cx + hw - 2, top + 22), (cx + hw + 14, top + 16), (cx + hw + 26, top + 8)], 2.2), 0x66707a)
        cv.paint(capsule(X, Y, cx + hw + 16, top + 10, cx + hw + 27, top + 8, 3.4), 0xc9302a)
    rim = ell(X, Y, cx, top, hw + 1.5, ry) <= 1
    lid = lid if lid is not None else metal
    if glass:
        cv.paint(rim, ramp((X - (cx - hw)) / (2 * hw), [(0, 0x8fa9b8), (0.25, 0xe8f4fa), (0.5, 0xcfe3ea), (1, 0x7f99a8)]))
        cv.paint(ring(X, Y, cx, top, hw + 1.5, ry, 2.2), ramp((X - (cx - hw)) / (2 * hw), cyl(metal, hl=0.26)))
        cv.tint(rim & (ell(X, Y, cx - 12, top - 2, 12, 2.4) <= 1), 0xffffff, 0.7)
    else:
        cv.paint(rim, ramp((X - (cx - hw)) / (2 * hw) * 0.7 + (Y - (top - ry)) / (2 * ry) * 0.3,
                           [(0, lit(lid, 0.5)), (0.35, lit(lid, 0.25)), (0.7, lid), (1, lit(lid, -0.35))]))
        cv.tint(rim & ring(X, Y, cx, top, hw - 6, ry - 2.5, 0.8), lit(lid, -0.35), 0.6)
    dome = (ell(X, Y, cx, top - 1, hw * 0.55, ry * 0.9) <= 1) & (Y < top - 0.5)
    if not glass:
        cv.paint(dome, ramp((X - (cx - hw * 0.55)) / (hw * 1.1), cyl(lid, hl=0.3, gloss=0.6)))
    cv.paint(box(X, Y, cx - 3, top - 12, cx + 3, top - 3, 1), 0x59636d)
    cv.paint(ell(X, Y, cx, top - 13, 7.5, 3.6) <= 1, ramp((X - (cx - 7.5)) / 15, cyl(knob, hl=0.3, gloss=0.5)))
    return body


@icon('pot_camp', ids=['cook_pot_camp'], colors=44, label='코펠 냄비 (1.8L)')
def pot_camp(cv):
    _pot(cv, cx=52, top=56, bottom=102, hw=34, handles='fold')


@icon('pot_home', ids=['cook_pot_home'], px=['px:it_pot'], colors=44, label='양수 냄비 (3.5L)')
def pot_home(cv):
    _pot(cv, cx=64, top=50, bottom=104, hw=40, metal=0xd0d7dc, glass=True)


@icon('pan', ids=['cook_pan'], px=['px:it_pan'], label='프라이팬')
def pan(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(70, 58, -30)
    hd = (u < -30) & (u > -78) & (np.abs(v) <= 4.2 + 1.0 * np.clip((-u - 30) / 48, 0, 1))
    cv.paint(hd, ramp(v / 10 + 0.5, cyl(0x2b2f35, hl=0.3, gloss=0.45)))
    cv.paint(disc(u, v, -72, 0, 1.8), 0x8b949d)
    cv.paint((u < -24) & (u > -34) & (np.abs(v) <= 3.4), ramp(v / 7 + 0.5, cyl(0x8b949d, hl=0.3)))
    outer = ell(X, Y, 78, 62, 40, 30) <= 1
    cv.paint(outer, ramp((X - 38) / 80 * 0.6 + (Y - 32) / 60 * 0.4, [(0, 0x6f7a84), (0.3, 0x4a5058), (0.6, 0x2b2f35), (1, 0x0c0e10)]))
    inner = ell(X, Y, 78, 64, 34, 24.5) <= 1
    cv.paint(inner, ramp((Y - 39.5) / 49, [(0, 0x0c0e10), (0.4, 0x1b1e23), (1, 0x33383e)]))
    cv.tint(inner & (ell(X, Y, 66, 58, 14, 5) <= 1), 0x59636d, 0.4)                          # 기름 광택
    cv.tint(inner & ring(X, Y, 78, 64, 26, 18.5, 0.7), 0x3a4047, 0.6)


@icon('grate', ids=['cook_grate'], px=['px:it_grate'], label='석쇠')
def grate(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(64, 60, -22)
    wire = 0xc3ccd4
    fr = (np.abs(u) <= 34) & (np.abs(v) <= 30)
    bars = fr & ((np.mod(u + 34, 6.8) < 1.1) | (np.mod(v + 30, 6.8) < 1.1))
    cv.paint(bars, ramp((u + v) / 128 + 0.5, [(0, lit(wire, 0.4)), (0.5, wire), (1, lit(wire, -0.45))]))
    border = fr & ((np.abs(u) > 31.6) | (np.abs(v) > 27.6))
    cv.paint(border, ramp((u + v) / 128 + 0.5, cyl(0x8b949d, hl=0.3, gloss=0.6)))
    cv.tint(bars & (np.abs(u - 4) < 14) & (np.abs(v) < 12), 0x59636d, 0.5)                    # 그을린 가운데
    hd1 = capsule(u, v, -34, -8, -62, -3, 1.4) | capsule(u, v, -34, 8, -62, 3, 1.4)
    cv.paint(hd1, 0x8b949d)
    grip = (u < -50) & (u > -70) & (np.abs(v) <= 4.4)
    cv.paint(grip, ramp(v / 9 + 0.5, cyl(0xa8743a, hl=0.3, gloss=0.4)))
    cv.tint(grip & (np.mod(u, 4.0) < 0.9), 0x6b4a1e, 0.6)


# ─────────────────────────────────────────────
# 현장 도구
# ─────────────────────────────────────────────
@icon('landing_net', ids=['inv_net', 'shop_net_3', 'shop_net_5', 'shop_net_7'], px=['px:it_net'], colors=44, label='뜰채')
def landing_net(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(10, 118, -45)
    for (u0, u1, r, c) in ((0, 34, 3.4, 0x2b2f35), (34, 62, 2.7, 0x40464d), (62, 84, 2.1, 0x59636d)):   # 뽑아 쓰는 대
        seg = (u >= u0) & (u <= u1) & (np.abs(v) <= r)
        cv.paint(seg, ramp(v / (2 * r) + 0.5, cyl(c, hl=0.3, gloss=0.55)))
    for uu in (34, 62):
        cv.paint((np.abs(u - uu) < 1.6) & (np.abs(v) <= 3.8), ramp(v / 7.6 + 0.5, cyl(0xc9a23a, hl=0.3, gloss=0.6)))
    cv.paint((u >= 0) & (u < 3) & (np.abs(v) <= 4.0), 0x15181c)
    cx, cy = 88, 40
    bag = (ell(X, Y, cx, cy + 16, 22, 30) <= 1) & (Y > cy - 4)                                   # 그물 주머니
    cv.paint(bag, ramp((Y - cy) / 46, [(0, 0x1b3a44), (1, 0x0c1c22)]))
    cv.tint(bag & ((np.mod(X + Y, 5.0) < 0.8) | (np.mod(X - Y, 5.0) < 0.8)), 0x8fd0c0, 0.85)
    hoop = ring(X, Y, cx, cy, 26, 13, 2.6)
    cv.paint(hoop, ramp((X - (cx - 26)) / 52, cyl(0x8b949d, hl=0.28, gloss=0.65)))
    inner = (ell(X, Y, cx, cy, 23.4, 10.4) <= 1)
    cv.paint(inner, ramp((Y - (cy - 10)) / 20, [(0, 0x0c1c22), (1, 0x1b3a44)]))
    cv.tint(inner & ((np.mod(X + Y, 5.0) < 0.8) | (np.mod(X - Y, 5.0) < 0.8)), 0x6fb0a0, 0.7)
    cv.paint(hoop, ramp((X - (cx - 26)) / 52, cyl(0x8b949d, hl=0.28, gloss=0.65)))
    cv.paint(disc(X, Y, 69.5, 58.5, 4.0), 0x59636d)                                              # 이음 목


@icon('rake', ids=['inv_rake'], px=['px:it_rake'], label='갯지렁이 갈퀴')
def rake(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(14, 114, -45)
    shaft = (u >= 0) & (u <= 84) & (np.abs(v) <= 3.4)
    cv.paint(shaft, ramp(v / 6.8 + 0.5, [(0, 0xe7c08a), (0.3, 0xd3a46a), (0.31, 0xb98950), (0.7, 0xab7b44), (0.71, 0x835a2c), (1, 0x62401c)]))
    cv.paint((u > 78) & (u < 92) & (np.abs(v) <= 4.2), ramp(v / 8.4 + 0.5, cyl(0x8b949d, hl=0.3)))
    head = (u > 90) & (u < 96) & (np.abs(v) <= 20)
    cv.paint(head, ramp(v / 40 + 0.5, cyl(0x66707a, hl=0.3, gloss=0.5)))
    for k in range(5):                                                                      # 굽은 갈퀴살
        vv = -17 + k * 8.5
        tine = polyline(u, v, [(94, vv), (106, vv), (113, vv + 1.5), (117, vv + 5)], 1.5)
        cv.paint(tine, ramp((u - 94) / 23, [(0, 0x8b949d), (0.5, 0xdfe5ea), (1, 0x59636d)]))
    cv.tint(shaft & (u < 22) & (np.mod(u, 3.0) < 0.8), 0x62401c, 0.6)


@icon('rod_holder', ids=['shop_rod_holder'], px=['px:it_rodholder'], label='원투 거치대 (삼발이)')
def rod_holder(cv):
    X, Y = cv.X, cv.Y
    alu = 0xb9c2ca
    for (a, b, c, d) in ((64, 34, 24, 112), (64, 34, 104, 112), (64, 34, 70, 116)):            # 다리 셋
        leg = capsule(X, Y, a, b, c, d, 2.3)
        cv.paint(leg, ramp((X - min(a, c)) / (abs(c - a) + 8), [(0, lit(alu, 0.4)), (0.5, alu), (1, lit(alu, -0.5))]))
        cv.paint(disc(X, Y, c, d, 3.2), 0x2b2f35)
    cv.paint(capsule(X, Y, 40, 82, 88, 82, 1.2), 0x59636d)                                    # 벌어짐 막는 사슬
    cv.tint(capsule(X, Y, 40, 82, 88, 82, 1.2) & (np.mod(X, 3.0) < 1.2), 0xdfe5ea, 0.8)
    bar = box(X, Y, 26, 28, 102, 36, 2.5)                                                      # 윗 가로대
    cv.paint(bar, ramp((Y - 28) / 8, cyl(0x2b2f35, hl=0.3, gloss=0.5)))
    for k in range(3):                                                                      # V 받침
        x = 38 + k * 26
        cv.paint(poly(cv, [(x - 7, 14), (x - 3.5, 14), (x, 26), (x + 3.5, 14), (x + 7, 14), (x + 2, 30), (x - 2, 30)]), 0xf07a1a)
    cv.paint(disc(X, Y, 64, 36, 5.0), ramp((X - 59) / 10, cyl(0x59636d, hl=0.3)))
    cv.paint(capsule(X, Y, 64, 40, 64, 62, 1.0), 0x8b949d)                                     # 무게 추 고리
    cv.paint(ring(X, Y, 64, 66, 4, 4, 1.2), 0x8b949d)


@icon('watering_can', ids=['inv_watering_can'], px=['px:it_watering_can'], label='물뿌리개')
def watering_can(cv):
    X, Y = cv.X, cv.Y
    base = 0x3f9a6a
    sp = polyline(X, Y, [(40, 86), (22, 62), (12, 48)], 3.6)                                   # 주둥이
    cv.paint(sp, ramp((X + Y - 60) / 70, [(0, lit(base, 0.35)), (0.5, base), (1, lit(base, -0.4))]))
    rose = ell(X, Y, 11, 46, 8.5, 6.0) <= 1
    cv.paint(rose, ramp((X - 2.5) / 17, cyl(lit(base, -0.1), hl=0.3)))
    for dx, dy in ((-3, -1), (0, 1.5), (3, -1.5), (-1, -3), (2.5, 2.5)):
        cv.paint(disc(X, Y, 11 + dx, 46 + dy, 0.9), 0x12352a)
    body = box(X, Y, 38, 50, 96, 106, 5) | (ell(X, Y, 67, 50, 29, 6) <= 1)
    cv.paint(body, ramp((X - 38) / 58, cyl(base, hl=0.26, gloss=0.5)))
    cv.tint(body & (np.abs(Y - 62) < 1.0), lit(base, -0.45), 0.7)
    cv.tint(body & (np.abs(Y - 96) < 1.0), lit(base, -0.45), 0.7)
    op = ell(X, Y, 67, 50, 25, 4.4) <= 1
    cv.paint(op, ramp((Y - 45.6) / 8.8, [(0, 0x0c2a1c), (0.5, 0x1f6fb0), (1, 0x7cc4f2)]))
    hd = ring(X, Y, 102, 76, 16, 24, 3.6) & (X > 94)                                           # 뒷손잡이
    cv.paint(hd, ramp((X - 94) / 24, [(0, lit(base, 0.3)), (0.5, base), (1, lit(base, -0.45))]))
    th = ring(X, Y, 67, 48, 22, 20, 3.0) & (Y < 46)                                            # 윗손잡이
    cv.paint(th, ramp((X - 45) / 44, cyl(lit(base, -0.1), hl=0.3)))


@icon('workbench', ids=['inv_place_workbench'], px=['px:it_workbench'], colors=44, label='작업대')
def workbench(cv):
    X, Y = cv.X, cv.Y
    wood = 0xb98950
    for (lx, ly) in ((20, 70), (92, 70), (38, 56), (108, 56)):                                # 다리
        leg = box(X, Y, lx - 4, ly, lx + 4, ly + 44, 1)
        cv.paint(leg, ramp((X - (lx - 4)) / 8, [(0, lit(wood, 0.1)), (1, lit(wood, -0.5))]))
    cv.paint(box(X, Y, 20, 96, 96, 101, 1), lit(wood, -0.35))                                  # 아래 선반
    top = poly(cv, [(8, 66), (30, 44), (122, 44), (100, 66)])
    cv.paint(top, ramp((Y - 44) / 22, [(0, lit(wood, 0.1)), (1, lit(wood, 0.4))]))
    cv.tint(top & (np.mod(X + (Y - 44) * 1.0, 13.0) < 0.9), lit(wood, -0.3), 0.6)               # 널 이음
    front = box(X, Y, 8, 66, 100, 76, 1)
    cv.paint(front, ramp((Y - 66) / 10, [(0, lit(wood, 0.15)), (1, lit(wood, -0.35))]))
    cv.paint(poly(cv, [(100, 66), (122, 44), (122, 54), (100, 76)]), lit(wood, -0.45))
    # 바이스
    cv.paint(box(X, Y, 14, 52, 30, 66, 1.5), ramp((X - 14) / 16, cyl(0xc9302a, hl=0.3, gloss=0.5)))
    cv.paint(box(X, Y, 12, 48, 20, 58, 1), 0x8b949d)
    cv.paint(box(X, Y, 24, 48, 32, 58, 1), 0x8b949d)
    cv.paint(capsule(X, Y, 6, 60, 14, 60, 1.2), 0x59636d)
    # 위에 놓인 것 — 망치 · 톱
    cv.paint(capsule(X, Y, 52, 58, 78, 50, 1.6), 0xe7c08a)
    cv.paint(box(X, Y, 76, 44.5, 86, 53, 1.5), ramp((Y - 44.5) / 8.5, cyl(0x66707a, hl=0.3)))
    saw = poly(cv, [(86, 62), (112, 50), (114, 54), (90, 64)])
    cv.paint(saw, 0xdfe5ea)
    cv.paint(capsule(X, Y, 84, 63.5, 90, 61, 2.6), 0xa8743a)


@icon('blueprint', px=['px:it_blueprint'], prefixes=['inv_bp_'], label='도면')
def blueprint(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(64, 66, -12)
    sheet = (np.abs(u) <= 44) & (np.abs(v) <= 30)
    cv.paint(sheet, ramp((u + 44) / 88 * 0.5 + (v + 30) / 60 * 0.5, [(0, 0x3f7fd0), (0.5, 0x2a62b0), (1, 0x1b4686)]))
    grid = sheet & ((np.mod(u + 44, 8.0) < 0.5) | (np.mod(v + 30, 8.0) < 0.5))
    cv.tint(grid, 0x6fa8ea, 0.6)
    w = 0xe8f4fd
    # 찌 단면 그림 + 치수선
    cv.paint(sheet & ring(u, v, -18, -2, 12, 16, 1.0), w)
    cv.paint(sheet & capsule(u, v, -18, -24, -18, 22, 0.6), w)
    cv.paint(sheet & capsule(u, v, -34, 20, -2, 20, 0.6), w)
    for (a, b, c, d) in ((4, -18, 36, -18), (4, -10, 28, -10), (4, -2, 34, -2), (4, 6, 22, 6)):
        cv.paint(sheet & capsule(u, v, a, b, c, d, 0.7), w)
    cv.paint(sheet & box(u, v, 22, 12, 40, 24, 1) & ~box(u, v, 23.2, 13.2, 38.8, 22.8, 0.5), w)
    for sgn in (-1, 1):                                                                     # 말린 양 끝
        roll = (np.abs(u - sgn * 46) <= 5) & (np.abs(v) <= 31.5)
        cv.paint(roll, ramp((u - sgn * 46) / 10 + 0.5, cyl(0xe8f0f8, hl=0.3, gloss=0.4, dark=0.4)))
        cv.tint(roll & (np.abs(v) > 29), 0x2a62b0, 0.8)


@icon('fish_crate', ids=['crate_std_pro'], colors=44, label='위판 규격 상자 (10입)')
def fish_crate(cv):
    X, Y = cv.X, cv.Y
    base = 0xf2c230
    side = poly(cv, [(98, 60), (118, 44), (118, 86), (98, 102)])
    cv.paint(side, ramp((Y - 44) / 58, [(0, lit(base, -0.25)), (1, lit(base, -0.55))]))
    front = box(X, Y, 10, 60, 98, 102, 3)
    cv.paint(front, ramp((Y - 60) / 42, [(0, lit(base, 0.3)), (0.15, lit(base, 0.08)), (0.8, base), (1, lit(base, -0.35))]))
    for k in range(6):                                                                      # 옆 구멍
        cv.paint(box(X, Y, 18 + k * 13, 74, 26 + k * 13, 90, 2), lit(base, -0.6))
    cv.paint(box(X, Y, 8, 56, 100, 66, 3), ramp((Y - 56) / 10, [(0, lit(base, 0.5)), (0.5, lit(base, 0.15)), (1, lit(base, -0.3))]))
    cv.paint(poly(cv, [(100, 57), (120, 41), (120, 49), (100, 65)]), lit(base, -0.4))
    ice = poly(cv, [(12, 58), (30, 44), (116, 44), (98, 58)])                                  # 얼음 채운 윗면
    cv.paint(ice, ramp((Y - 44) / 14, [(0, 0xbfe2f7), (1, 0xeef8fe)]))
    rng = np.random.default_rng(3)
    for _ in range(26):
        x, y = rng.uniform(20, 108), rng.uniform(45, 57)
        cv.paint(ice & box(X, Y, x - 2.4, y - 1.4, x + 2.4, y + 1.4, 0.5), int(rng.choice([0xffffff, 0xdff1fb, 0xa9d4f0])))
    for k in range(3):                                                                      # 얼음에 누운 생선 등
        fx = 38 + k * 24
        f = ice & (ell(X, Y, fx, 51, 13, 3.6) <= 1)
        cv.paint(f, ramp((Y - 47.4) / 7.2, [(0, 0x4a6a8a), (0.5, 0x9ab6c6), (1, 0xe8eef2)]))
        cv.paint(ice & poly(cv, [(fx + 11, 51), (fx + 18, 47.5), (fx + 18, 54.5)]), 0x6a8aa8)
    tag = box(X, Y, 40, 68, 68, 72.5, 1)
    cv.paint(tag, 0xf4f1e6)
    text_bars(cv, tag, 42, 66, [70.2], 0x2b2f35, seed=4, h=0.8)


@icon('ice_crate', ids=['quest_ice_crate'], px=['px:it_ice_crate'], colors=44, label='정옥선의 심부름용 얼음 상자')
def ice_crate(cv):
    X, Y = cv.X, cv.Y
    base = 0xf2f5f7
    side = poly(cv, [(96, 54), (116, 40), (116, 90), (96, 104)])
    cv.paint(side, ramp((Y - 40) / 64, [(0, 0xc3ced7), (1, 0x8796a3)]))
    front = box(X, Y, 12, 54, 96, 104, 3)
    cv.paint(front, ramp((Y - 54) / 50, [(0, 0xffffff), (0.2, base), (0.8, 0xdbe3e9), (1, 0xa9b6c1)]))
    n = noise(cv.a.shape, 5, 1)
    cv.tint((front | side) & (n > 0.72), 0xcfd8df, 0.35)                                       # 스티로폼 알갱이
    lid = poly(cv, [(10, 54), (30, 40), (118, 40), (98, 54)])
    cv.paint(lid, ramp((Y - 40) / 14, [(0, 0xe8eef2), (1, 0xffffff)]))
    cv.paint(box(X, Y, 10, 52, 98, 60, 2), ramp((Y - 52) / 8, [(0, 0xffffff), (1, 0xcfd8df)]))
    cv.paint(poly(cv, [(98, 53), (118, 39), (118, 46), (98, 60)]), 0xa9b6c1)
    for (a, b, c, d) in ((40, 40, 20, 54), (20, 54, 20, 104), (86, 40, 66, 54), (66, 54, 66, 104)):   # 노끈
        cv.paint(capsule(X, Y, a, b, c, d, 1.3), 0xc9302a)
    tag = box(X, Y, 28, 70, 58, 90, 1.5)                                                       # 이름표
    cv.paint(tag, 0xfff6de)
    cv.paint(tag & (Y < 75), 0x2a78c8)
    text_bars(cv, tag, 31, 55, [79, 83, 87], 0x55535a, seed=6, h=0.8)
    cv.paint(poly(cv, [(72, 78), (80, 70), (88, 78), (80, 86)]), 0x7cc4f2)                       # 얼음 표시
    cv.paint(poly(cv, [(76, 78), (80, 74), (84, 78), (80, 82)]), 0xdff1fb)


@icon('toolset_rod', ids=['workshop_pro_tools'], colors=48, label='로드 빌딩 공구 세트')
def toolset_rod(cv):
    X, Y = cv.X, cv.Y
    # 펼친 공구 말이 — 가죽 바탕에 꽂힌 도구들
    u, v = cv.frame(64, 66, -8)
    base = 0x7a4f2a
    roll = (np.abs(u) <= 50) & (np.abs(v) <= 34)
    cv.paint(roll, ramp((v + 34) / 68, [(0, lit(base, 0.25)), (0.5, base), (1, lit(base, -0.3))]))
    n = noise(cv.a.shape, 7, 2)
    cv.tint(roll & (n > 0.66), lit(base, -0.3), 0.35)
    cv.tint(roll & ((np.abs(np.abs(u) - 47.5) < 0.5) | (np.abs(np.abs(v) - 31.5) < 0.5)) & (np.mod(u + v, 3.0) < 1.6), 0xf4e6c8, 0.9)   # 바느질
    pocket = roll & (v > 8)
    cv.paint(pocket, ramp((v - 8) / 26, [(0, lit(base, -0.1)), (1, lit(base, -0.4))]))
    cv.tint(roll & (np.abs(v - 8) < 0.7), lit(base, -0.6), 0.9)
    tools = [(-40, 0x8b949d, 'file'), (-28, 0xc9302a, 'driver'), (-16, 0xf2c230, 'brush'), (-4, 0x2a78c8, 'spool'),
             (8, 0x3fa04a, 'spool'), (20, 0x8b949d, 'tweezer'), (32, 0xe7c08a, 'burnisher'), (42, 0x59636d, 'razor')]
    for (tu, col, kind) in tools:
        if kind == 'spool':                                                                  # 감기실 타래
            sp = (np.abs(u - tu) <= 4.6) & (v > -18) & (v < 6)
            cv.paint(sp, ramp((u - tu) / 9.2 + 0.5, cyl(col, hl=0.3, gloss=0.5)))
            cv.tint(sp & (np.mod(v, 2.0) < 0.6), lit(col, -0.4), 0.6)
            cv.paint((np.abs(u - tu) <= 5.6) & (np.abs(v + 19) < 1.6), 0xe7c08a)
        else:
            hd = (np.abs(u - tu) <= 2.6) & (v > -8) & (v < 6)
            cv.paint(hd, ramp((u - tu) / 5.2 + 0.5, cyl(col if kind != 'file' else 0xa8743a, hl=0.3, gloss=0.5)))
            w = {'file': 2.2, 'driver': 1.0, 'brush': 1.6, 'tweezer': 1.4, 'burnisher': 1.3, 'razor': 2.4}[kind]
            sh = (np.abs(u - tu) <= w) & (v > -26) & (v <= -8)
            cv.paint(sh, ramp((u - tu) / (2 * w) + 0.5, cyl(0xc3ccd4, hl=0.3, gloss=0.7)))
            if kind == 'file':
                cv.tint(sh & (np.mod(v, 1.6) < 0.6), 0x59636d, 0.7)
            if kind == 'brush':
                cv.paint((np.abs(u - tu) <= 2.4) & (v > -30) & (v <= -24), 0x2b1a12)
    cv.tint(pocket & (np.mod(u + 46, 12.0) < 0.7), lit(base, -0.65), 0.8)                       # 칸 박음질
    strap = (u > 50) & (u < 62) & (np.abs(v) < 2.2)
    cv.paint(strap, lit(base, -0.3))


# ─────────────────────────────────────────────
# 구급품 · 생활 소모품
# ─────────────────────────────────────────────
@icon('bandage', ids=['shop_bandage', 'craft_bandage'], px=['px:it_bandage'], label='붕대')
def bandage(cv):
    X, Y = cv.X, cv.Y
    roll = ell(X, Y, 52, 66, 30, 30) <= 1
    cv.paint(roll, ramp((X - 22) / 60 * 0.5 + (Y - 36) / 60 * 0.5, [(0, 0xffffff), (0.4, 0xf4f1e6), (0.8, 0xd9d3c0), (1, 0xb5ad96)]))
    r = np.sqrt((X - 52) ** 2 + (Y - 66) ** 2)
    cv.tint(roll & (np.mod(r, 4.2) < 0.7) & (r > 7), 0xb5ad96, 0.7)                             # 감긴 결
    cv.paint(disc(X, Y, 52, 66, 6.5), 0xc9c2ae)
    cv.paint(disc(X, Y, 52, 66, 4.0), 0x8a8170)
    tail = poly(cv, [(52, 96), (110, 96), (116, 108), (60, 108)])                               # 풀린 끝
    cv.paint(tail, ramp((Y - 96) / 12, [(0, 0xffffff), (1, 0xd9d3c0)]))
    cv.tint(tail & ((np.mod(X, 3.0) < 0.6) | (np.mod(Y, 3.0) < 0.6)), 0xc9c2ae, 0.6)              # 거즈 올
    clip = box(X, Y, 94, 92, 106, 100, 1.5)
    cv.paint(clip, ramp((Y - 92) / 8, cyl(0x8b949d, hl=0.3)))
    cv.paint(box(X, Y, 70, 58, 84, 62, 0.5) | box(X, Y, 75, 53, 79, 67, 0.5), 0xc9302a)


@icon('splint', ids=['shop_splint', 'craft_splint'], px=['px:it_splint'], label='부목')
def splint(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(18, 104, -38)
    for dv in (-9, 9):
        bd = (u >= 0) & (u <= 106) & (np.abs(v - dv) <= 6.5)
        cv.paint(bd, ramp((v - dv) / 13 + 0.5, [(0, 0xf2dcae), (0.3, 0xe4c890), (0.31, 0xcfae72), (0.75, 0xc4a266), (0.76, 0x9a7a44), (1, 0x7a5c2c)]))
        g = noise(cv.a.shape, 8, 2)
        cv.tint(bd & (np.sin(v * 4 + g * 6) > 0.9), 0x9a7a44, 0.45)
    for uu in (20, 54, 88):                                                                 # 감은 붕대
        wr = (np.abs(u - uu) <= 8) & (np.abs(v) <= 17)
        cv.paint(wr, ramp(v / 34 + 0.5, [(0, 0xffffff), (0.3, 0xf4f1e6), (0.8, 0xd9d3c0), (1, 0xa9a28c)]))
        cv.tint(wr & (np.mod(u + v * 0.4, 3.2) < 0.7), 0xb5ad96, 0.7)


@icon('medicine', ids=['shop_medicine', 'craft_medicine'], px=['px:it_medicine'], colors=44, label='상비약')
def medicine(cv):
    X, Y = cv.X, cv.Y
    side = poly(cv, [(90, 50), (106, 38), (106, 92), (90, 104)])
    cv.paint(side, ramp((Y - 38) / 66, [(0, 0xc3ced7), (1, 0x8796a3)]))
    front = box(X, Y, 22, 50, 90, 104, 3)
    cv.paint(front, ramp((Y - 50) / 54, [(0, 0xffffff), (0.6, 0xf2f5f7), (1, 0xcfd8df)]))
    top = poly(cv, [(22, 50), (38, 38), (106, 38), (90, 50)])
    cv.paint(top, ramp((Y - 38) / 12, [(0, 0xe8eef2), (1, 0xffffff)]))
    cv.paint(front & (Y > 88), 0x2f8f4f)
    cx, cy = 44, 70
    cv.paint(box(X, Y, cx - 4, cy - 11, cx + 4, cy + 11, 1) | box(X, Y, cx - 11, cy - 4, cx + 11, cy + 4, 1), 0x2f8f4f)
    text_bars(cv, front, 60, 86, [62, 67, 72, 77], 0x8796a3, seed=7, h=0.9)
    # 앞에 놓인 알약 판
    bl = box(X, Y, 50, 96, 114, 118, 3)
    cv.paint(bl, ramp((Y - 96) / 22, cyl(0xc3ccd4, hl=0.3, gloss=0.7)))
    for k in range(4):
        for r_ in range(2):
            px_, py_ = 59 + k * 15, 102 + r_ * 10
            cv.paint(ell(X, Y, px_, py_, 5, 3.2) <= 1, ramp((Y - (py_ - 3.2)) / 6.4, [(0, 0xffffff), (0.5, 0xffd9d0), (1, 0xe07a6a)]))


@icon('ointment', ids=['inv_bandage'], label='상처 연고')
def ointment(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(22, 98, -30)
    hw = 6 + 9 * np.clip(u / 60, 0, 1) ** 0.6
    tube = (u >= 0) & (u <= 74) & (np.abs(v) <= np.where(u > 60, 15 - (u - 60) * 0.5, hw))
    cv.paint(tube, ramp(v / (2 * np.maximum(hw, 6)) + 0.5, cyl(0xf4f6f7, hl=0.3, gloss=0.6, dark=0.35)))
    cv.paint(tube & (u < 6), ramp(v / 12 + 0.5, cyl(0xb9c2ca, hl=0.3)))                           # 접어 누른 끝
    cv.tint(tube & (u < 6) & (np.mod(v, 2.4) < 0.7), 0x66707a, 0.6)
    band = tube & (u > 22) & (u < 54)
    cv.paint(band, ramp(v / 30 + 0.5, cyl(0x2f9a8a, hl=0.3, gloss=0.45)))
    cv.paint(band & (np.abs(u - 38) < 2.6) & (np.abs(v) < 8), 0xffffff)
    cv.paint(band & (np.abs(u - 38) < 8) & (np.abs(v) < 2.6), 0xffffff)
    neck = (u > 74) & (u <= 80) & (np.abs(v) <= 5)
    cv.paint(neck, ramp(v / 10 + 0.5, cyl(0xb9c2ca, hl=0.3)))
    capm = (u > 79) & (u <= 96) & (np.abs(v) <= 7.5 - (u - 79) * 0.12)
    cv.paint(capm, ramp(v / 15 + 0.5, cyl(0x2f9a8a, hl=0.3, gloss=0.55)))
    cv.tint(capm & (np.mod(v, 2.6) < 0.7), 0x1a5a50, 0.6)


@icon('pill_seasick', ids=['inv_seasick'], label='멀미약')
def pill_seasick(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(64, 64, -14)
    card = (np.abs(u) <= 42) & (np.abs(v) <= 30)
    cv.paint(card, ramp((u + v) / 144 + 0.5, cyl(0xc3ccd4, hl=0.3, gloss=0.75)))
    cv.tint(card & (np.abs(v + 22) < 5.5), 0x2a78c8, 0.95)                                      # 윗 띠
    cv.tint(card & (np.abs(v + 22 - 1.6 * np.sin(u * 0.4)) < 1.0), 0xffffff, 0.9)                 # 물결(배)
    for r_ in range(2):
        for k in range(4):
            pu, pv = -30 + k * 20, -4 + r_ * 20
            bub = ell(u, v, pu, pv, 7.5, 7.5) <= 1
            cv.paint(bub, ramp(np.sqrt(((u - pu + 2) / 9) ** 2 + ((v - pv + 2.5) / 9) ** 2), [(0, 0xffffff), (0.3, 0xfff6c8), (0.7, 0xf2d86a), (1, 0xb8902c)]))
            cv.tint(bub & (np.abs(u - pu) < 0.5), 0xb8902c, 0.6)
    cv.erase(ell(u, v, 30, 16, 7.5, 7.5) <= 1)                                                 # 하나 빼 먹은 자리
    cv.paint((ell(u, v, 30, 16, 7.5, 7.5) <= 1) & card, 0x8b949d)


@icon('mosquito_coil', ids=['inv_mosquito'], colors=44, label='모기향')
def mosquito_coil(cv):
    X, Y = cv.X, cv.Y
    cx, cy = 64, 74
    dx, dy = X - cx, (Y - cy) * 1.9
    r = np.sqrt(dx * dx + dy * dy)
    th = np.arctan2(dy, dx)
    turns = (r - 4.5 * (th + np.pi) / (2 * np.pi)) / 4.5
    coil = (np.abs(turns - np.round(turns)) < 0.3) & (r < 46) & (r > 4)
    cv.paint(ell(X, Y, cx, cy + 6, 54, 30) <= 1, ramp((X - 10) / 108, [(0, 0x8b949d), (0.25, 0xe8edf0), (0.6, 0xc3ccd4), (1, 0x6f7a84)]))   # 받침 접시
    cv.paint(ell(X, Y, cx, cy + 4, 49, 26) <= 1, ramp((Y - (cy - 22)) / 52, [(0, 0x8b949d), (1, 0xdfe5ea)]))
    cv.paint(coil, ramp((Y - (cy - 24)) / 48, [(0, 0x2f7a3a), (0.5, 0x3f9a4a), (1, 0x5ab85a)]))
    cv.tint(coil & (np.abs(turns - np.round(turns)) > 0.18) & (dy > 0), 0x1f5a2a, 0.6)
    tipm = coil & (r > 41.5) & (th > -0.5) & (th < 0.25)                                         # 타는 끝
    cv.paint(tipm, 0xd9dee2)
    cv.paint(coil & (r > 41.5) & (th > 0.25) & (th < 0.45), 0xf07a1a)
    for k in range(3):                                                                      # 연기
        sm = (np.abs(X - (112 - k * 3 + 3.0 * np.sin((Y - 20) * 0.25 + k))) < 1.4) & (Y < 64) & (Y > 22 + k * 8)
        cv.paint(sm, 0xc9d0d6)
    cv.paint(capsule(X, Y, cx, cy - 2, cx, cy - 12, 1.2), 0x59636d)                              # 꽂이


@icon('carekit', ids=['inv_carekit'], colors=44, label='도구 케어 세트')
def carekit(cv):
    X, Y = cv.X, cv.Y
    base = 0x2f4a66
    case = box(X, Y, 12, 56, 116, 108, 6)
    cv.paint(case, ramp((Y - 56) / 52, [(0, lit(base, 0.3)), (0.2, base), (1, lit(base, -0.45))]))
    lid = poly(cv, [(12, 58), (22, 22), (106, 22), (116, 58)])                                  # 열린 뚜껑(안쪽)
    cv.paint(lid, ramp((Y - 22) / 36, [(0, lit(base, -0.35)), (1, lit(base, -0.1))]))
    cv.tint(lid & (np.mod(X, 9.0) < 0.8), lit(base, -0.55), 0.6)
    tray = box(X, Y, 18, 60, 110, 84, 3)
    cv.paint(tray, 0x1b2a3d)
    # 솔 · 오일 병 · 천 · 숫돌
    cv.paint(capsule(X, Y, 24, 72, 52, 66, 2.2), 0xe7c08a)
    cv.paint(box(X, Y, 50, 60.5, 60, 70, 1), 0x2b1a12)
    bt = box(X, Y, 64, 42, 76, 82, 3)
    cv.paint(bt, ramp((X - 64) / 12, cyl(0xf2d86a, hl=0.3, gloss=0.6)))
    cv.paint(box(X, Y, 66, 34, 74, 43, 1.5), ramp((X - 66) / 8, cyl(0x2b2f35, hl=0.3)))
    cv.paint(bt & (Y > 56) & (Y < 72), 0xf4f1e6)
    cloth = poly(cv, [(80, 64), (106, 60), (108, 80), (82, 82)])
    cv.paint(cloth, ramp((X - 80) / 28, [(0, 0xffd9a0), (0.5, 0xf2b05a), (1, 0xc9822a)]))
    cv.tint(cloth & (np.abs(Y - 71) < 0.6), 0xa8661a, 0.7)
    cv.paint(box(X, Y, 18, 84, 110, 86, 0.5), lit(base, 0.35))
    for lx in (40, 88):                                                                     # 걸쇠
        cv.paint(box(X, Y, lx - 6, 88, lx + 6, 98, 1.5), ramp((Y - 88) / 10, [(0, 0xdfe5ea), (1, 0x59636d)]))
    cv.paint(box(X, Y, 52, 100, 76, 105, 2), lit(base, -0.55))


@icon('junk_parts', ids=['inv_junk'], colors=44, label='낡은 릴 부품')
def junk_parts(cv):
    X, Y = cv.X, cv.Y

    def gear(cx, cy, r, teeth, col, hole=0.3):
        a = np.arctan2(Y - cy, X - cx)
        rr = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
        m = rr <= r * (1.0 + 0.16 * (np.cos(a * teeth) > 0.2))
        cv.paint(m, ramp((X - (cx - r)) / (2 * r) * 0.5 + (Y - (cy - r)) / (2 * r) * 0.5, [(0, lit(col, 0.45)), (0.4, col), (1, lit(col, -0.5))]))
        cv.tint(m & ring(X, Y, cx, cy, r * 0.72, r * 0.72, 0.9), lit(col, -0.4), 0.7)
        cv.erase(disc(X, Y, cx, cy, r * hole))
        n = noise(cv.a.shape, int(cx), 2)
        cv.tint(m & (n > 0.66), 0x9a4a1a, 0.55)                                               # 녹
    gear(46, 58, 24, 14, 0x8b949d)
    gear(86, 82, 18, 11, 0xa8843a)
    gear(88, 40, 11, 9, 0x6f7a84, hole=0.36)
    sp = (np.abs(Y - (102 - (X - 20) * 0.1) - 4.0 * np.sin((X - 20) * 0.9)) < 1.5) & (X > 18) & (X < 62)   # 용수철
    cv.paint(sp, ramp((np.sin((X - 20) * 0.9) + 1) / 2, [(0, 0x59636d), (1, 0xdfe5ea)]))
    for (bx, by, a) in ((104, 104, 0.4), (30, 26, -0.6)):                                      # 볼트
        uu = (X - bx) * np.cos(a) + (Y - by) * np.sin(a)
        vv = -(X - bx) * np.sin(a) + (Y - by) * np.cos(a)
        cv.paint((np.abs(uu) < 9) & (np.abs(vv) < 2.2), ramp(vv / 4.4 + 0.5, cyl(0x8b949d, hl=0.3)))
        cv.tint((np.abs(uu) < 9) & (np.abs(vv) < 2.2) & (np.mod(uu, 2.0) < 0.7) & (uu > -4), 0x4b545f, 0.7)
        cv.paint((np.abs(uu + 9) < 2.6) & (np.abs(vv) < 4.4), ramp(vv / 8.8 + 0.5, cyl(0x6f7a84, hl=0.3)))


@icon('bike', ids=['inv_bike'], colors=44, label='자전거')
def bike(cv):
    X, Y = cv.X, cv.Y
    fr = 0x2a9a8a
    for cx in (30, 98):                                                                     # 바퀴
        cv.paint(ring(X, Y, cx, 86, 22, 22, 3.6), ramp((X - (cx - 22)) / 44 * 0.5 + (Y - 64) / 44 * 0.5, [(0, 0x59636d), (0.5, 0x2b2f35), (1, 0x0c0e10)]))
        cv.paint(ring(X, Y, cx, 86, 18.2, 18.2, 1.1), 0xc3ccd4)
        a = np.arctan2(Y - 86, X - cx)
        rr = np.sqrt((X - cx) ** 2 + (Y - 86) ** 2)
        cv.paint((rr < 17.2) & (rr > 3) & (np.mod(a, np.pi / 6) < 0.06), 0xaab4bd)                 # 살
        cv.paint(disc(X, Y, cx, 86, 3.2), 0x8b949d)
    def tube(a, b, c, d, r=2.4, col=fr):
        m = capsule(X, Y, a, b, c, d, r)
        cv.paint(m, ramp((X + Y - (a + b)) / 60 + 0.4, [(0, lit(col, 0.45)), (0.4, col), (1, lit(col, -0.45))]))
    tube(30, 86, 52, 52); tube(52, 52, 62, 86); tube(30, 86, 62, 86, 2.0); tube(52, 52, 88, 50); tube(62, 86, 88, 50)
    tube(88, 50, 98, 86, 2.2); tube(88, 50, 86, 38, 2.0, 0x8b949d)
    tube(52, 52, 49, 42, 1.8, 0x8b949d)
    cv.paint(box(X, Y, 38, 37, 60, 43, 3), ramp((Y - 37) / 6, [(0, 0x59636d), (1, 0x15181c)]))     # 안장
    cv.paint(polyline(X, Y, [(76, 34), (86, 37), (98, 32)], 2.0), 0x2b2f35)                        # 핸들
    cv.paint(capsule(X, Y, 96, 32.5, 102, 30, 2.6), 0x15181c)
    cv.paint(disc(X, Y, 62, 86, 6.0), 0x8b949d)                                                 # 크랭크
    cv.paint(disc(X, Y, 62, 86, 3.0), 0x59636d)
    cv.paint(capsule(X, Y, 62, 86, 70, 96, 1.4), 0x59636d)
    cv.paint(box(X, Y, 66, 95, 76, 98, 1), 0x15181c)
    bk = box(X, Y, 14, 52, 40, 66, 2)                                                            # 뒤 짐받이 상자(아이스박스)
    cv.paint(bk, ramp((Y - 52) / 14, [(0, 0xffffff), (0.4, 0xe8eef2), (1, 0xa9b6c1)]))
    cv.paint(box(X, Y, 14, 50, 40, 55, 1.5), 0x2a78c8)
    cv.paint(capsule(X, Y, 18, 66, 30, 86, 1.2), 0x8b949d)


@icon('fishcut', ids=['inv_fishcut'], colors=44, label='생선 조각 미끼')
def fishcut(cv):
    X, Y = cv.X, cv.Y
    tray = poly(cv, [(8, 92), (28, 54), (120, 54), (100, 92)])
    cv.paint(poly(cv, [(8, 92), (100, 92), (100, 100), (8, 100)]) | poly(cv, [(100, 92), (120, 54), (120, 62), (100, 100)]), 0xa9b6c1)
    cv.paint(tray, ramp((Y - 54) / 38, [(0, 0xdfe5ea), (1, 0xffffff)]))
    for k, (x0, y0) in enumerate(((30, 84), (52, 86), (74, 84), (44, 70), (66, 70), (88, 70))):  # 포 뜬 살 조각(껍질 한쪽)
        pc = poly(cv, [(x0, y0), (x0 + 8, y0 - 12), (x0 + 24, y0 - 12), (x0 + 16, y0)])
        cv.paint(pc, ramp((X - x0) / 24, [(0, 0xf6d6c8), (0.5, 0xe9b8a8), (1, 0xc98a7a)]))
        cv.tint(pc & (np.mod(X - Y * 0.6, 5.0) < 0.8), 0xfff0e8, 0.7)                             # 살 결
        cv.paint(pc & (Y > y0 - 2.4), ramp((X - x0) / 16, [(0, 0x6a8aa8), (0.5, 0x9ab6c6), (1, 0x4a6a8a)]))   # 은빛 껍질
    cv.paint(ell(X, Y, 102, 60, 5, 2.4) <= 1, 0xc9302a)                                           # 핏물
