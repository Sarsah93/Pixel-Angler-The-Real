# -*- coding: utf-8 -*-
"""채소 · 뿌리 · 풀 — 요리 재료와 약초"""
import numpy as np
from kit import *
from shapes import *


def _leaf(cv, x0, y0, x1, y1, w, color, vein=True):
    """잎 한 장 — 양 끝이 뾰족한 타원"""
    X, Y = cv.X, cv.Y
    dx, dy = x1 - x0, y1 - y0
    ln = max(1e-3, np.hypot(dx, dy))
    u = ((X - x0) * dx + (Y - y0) * dy) / ln
    v = (-(X - x0) * dy + (Y - y0) * dx) / ln
    t = np.clip(u / ln, 0, 1)
    m = (u >= 0) & (u <= ln) & (np.abs(v) <= w * np.sin(np.pi * t) ** 0.7)
    cv.paint(m, ramp(v / (2 * w) + 0.5, [(0, lit(color, 0.3)), (0.45, lit(color, 0.05)), (0.5, lit(color, -0.3)), (0.55, color), (1, lit(color, -0.35))]))
    return m


@icon('radish', ids=['cook_radish'], px=['px:it_veg'], label='무')
def radish(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(30, 104, -38.0)
    # 통통한 흰 뿌리 — 어깨는 연두, 끝은 가늘다
    t = np.clip(u / 78.0, 0, 1)
    hw = 15.5 * np.sin(np.pi * np.clip(t * 0.86 + 0.14, 0, 1)) ** 0.55 * (0.55 + 0.45 * t)
    root = (u >= -6) & (u <= 78) & (np.abs(v) <= np.where(u < 0, 2.2 + (u + 6) * 0.5, hw))
    cv.paint(root, ramp(v / (2 * np.maximum(hw, 2)) + 0.5, cyl(0xf4f1e6, hl=0.3, gloss=0.6, dark=0.35)))
    cv.tint(root & (t > 0.7), 0xb9d98a, 0.75)
    cv.tint(root & (t > 0.86), 0x8fc25a, 0.7)
    for k in (18, 34, 50):                                                           # 가로 잔주름
        cv.tint(root & (np.abs(u - k) < 0.5) & (v > -hw * 0.5) & (v < hw * 0.75), 0xc9c2ae, 0.7)
    for (a, b, c, d, w) in [(88, 44, 104, 14, 5.5), (90, 46, 118, 30, 5.5), (86, 42, 86, 10, 5.0), (89, 46, 120, 48, 4.5)]:
        _leaf(cv, a, b, c, d, w, 0x3f9a4a)
    cv.paint(disc(X, Y, 89, 45, 4.2), 0x8fc25a)


@icon('leek', ids=['cook_leek'], label='대파')
def leek(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(16, 112, -44.0)
    hw = 5.6 - 0.8 * np.clip(u / 60, 0, 1)
    stalk = (u >= 0) & (u <= 70) & (np.abs(v) <= hw)
    stalk &= ~((u < 2) & (np.abs(v) > hw - 1.6))
    cv.paint(stalk, ramp(v / (2 * hw) + 0.5, cyl(0xf6f4ea, hl=0.3, gloss=0.6, dark=0.35)))
    cv.tint(stalk & (u > 44), 0xbfe08f, 0.6)
    cv.tint(stalk & (u > 58), 0x6db85a, 0.7)
    for k in range(5):                                                               # 뿌리 수염
        cv.paint(capsule(u, v, 0, -4 + k * 2, -7 - (k % 2) * 2, -6 + k * 3, 0.6), 0xd9cfae)
    for dv, ln, w in ((-8, 54, 4.2), (0, 62, 4.6), (9, 50, 4.0)):                     # 갈라지는 푸른 잎
        x0, y0 = 16 + 68 * np.cos(np.deg2rad(44)), 112 - 68 * np.sin(np.deg2rad(44))
        ang = np.deg2rad(44 + dv * 1.6)
        _leaf(cv, x0 - 4 * np.cos(ang), y0 + 4 * np.sin(ang), x0 + ln * np.cos(ang), y0 - ln * np.sin(ang), w, 0x2f8f4f)


@icon('onion', ids=['cook_onion'], label='양파')
def onion(cv):
    X, Y = cv.X, cv.Y
    m = cv.ball(64, 72, 33, 0xd9a05a, ry=31, gloss=0.55)
    ang = np.arctan2(Y - 72, (X - 64) * 0.9)
    r = np.sqrt(((X - 64) / 33) ** 2 + ((Y - 72) / 31) ** 2)
    for a in np.linspace(-2.6, -0.5, 7):                                             # 껍질 세로 결
        cv.tint(m & (np.abs(X - (64 + 33 * np.sin(a + np.pi / 2) * np.sin(np.pi * (Y - 41) / 62) * 0.98)) < 0.5), 0xa86a2c, 0.45)
    top = poly(cv, [(58, 44), (70, 44), (67, 26), (64, 22), (61, 27)])
    cv.paint(top, ramp((X - 58) / 12, [(0, 0xe9c890), (0.4, 0xd9a05a), (1, 0x9a6a2a)]))
    cv.paint(capsule(X, Y, 64, 23, 66, 16, 1.0), 0xc9a86a)
    for k in range(6):                                                               # 뿌리
        cv.paint(capsule(X, Y, 58 + k * 2.4, 102, 55 + k * 3.6, 108, 0.6), 0xe9dcc0)
    cv.tint(m & (ell(X, Y, 50, 58, 7, 11) <= 1), 0xfff3d6, 0.55)


@icon('bean_sprout', ids=['cook_bean_sprout'], label='콩나물')
def bean_sprout(cv):
    X, Y = cv.X, cv.Y
    rng = np.random.default_rng(3)
    # 한 줌 — 노란 머리에 가는 흰 줄기
    for i in range(13):
        x0 = 36 + i * 4.6 + rng.uniform(-1.5, 1.5)
        y0 = 30 + rng.uniform(-6, 8)
        x1 = 50 + i * 2.2 + rng.uniform(-3, 3)
        y1 = 106 + rng.uniform(-6, 4)
        mx, my = (x0 + x1) / 2 + rng.uniform(-6, 6), (y0 + y1) / 2
        st = polyline(X, Y, [(x0, y0), (mx, my), (x1, y1)], 1.5)
        cv.paint(st, ramp((X - x0 + 2) / 5, [(0, 0xffffff), (0.6, 0xf2efe0), (1, 0xcfc8ae)]))
        cv.paint(capsule(X, Y, x1, y1, x1 + rng.uniform(-3, 3), y1 + 6, 0.6), 0xc9b98a)
        hd = ell(X, Y, x0 - 1.5, y0 - 2, 4.0, 3.0) <= 1
        cv.paint(hd, ramp((X - (x0 - 5.5)) / 8, [(0, 0xfff0a0), (0.5, 0xf2c230), (1, 0xb8902c)]))
        cv.tint(hd & (np.abs(X - (x0 - 1.5)) < 0.45), 0xb8902c, 0.6)
    band = box(X, Y, 44, 72, 86, 79, 2)                                               # 묶은 끈
    cv.paint(band, ramp((X - 44) / 42, cyl(0xc9302a, hl=0.3)))


@icon('carrot', ids=['cook_carrot'], label='당근')
def carrot(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(26, 106, -40.0)
    t = np.clip(u / 74.0, 0, 1)
    hw = 2.0 + 11.5 * t ** 0.75
    root = (u >= 0) & (u <= 74) & (np.abs(v) <= hw)
    root &= ~((u > 71) & (np.abs(v) > hw - (u - 71) * 1.2))
    cv.paint(root, ramp(v / (2 * hw) + 0.5, cyl(0xf07a1a, hl=0.3, gloss=0.5, dark=0.45)))
    for k in (14, 27, 41, 56):
        cv.tint(root & (np.abs(u - k) < 0.55) & (v > -hw * 0.3) & (v < hw * 0.8), 0xb5520c, 0.7)
    cv.paint(capsule(u, v, 0, 0, -6, 1.5, 0.7), 0xd9661a)
    for (a, b, c, d, w) in [(83, 46, 96, 18, 4.5), (85, 46, 112, 28, 4.5), (82, 44, 82, 16, 4.0), (86, 48, 116, 46, 3.8)]:
        m = _leaf(cv, a, b, c, d, w, 0x3fa04a)
        cv.erase(m & (np.mod(X * 0.9 + Y * 0.7, 5.0) < 1.1) & (seg_dist(X, Y, a, b, c, d) > 1.3))   # 깃꼴 잎
    cv.paint(disc(X, Y, 84, 47, 3.6), 0x6db85a)


def _bunch(cv, stems, leaf_fn, tie=(58, 88, 0xc9302a), stem_col=0xbfe08f):
    X, Y = cv.X, cv.Y
    for (x0, y0, x1, y1) in stems:
        st = capsule(X, Y, x0, y0, x1, y1, 1.6)
        cv.paint(st, ramp((X - x0 + 2) / 5, [(0, lit(stem_col, 0.4)), (0.6, stem_col), (1, lit(stem_col, -0.35))]))
    for (x0, y0, x1, y1) in stems:
        leaf_fn(x1, y1, x1 - x0, y1 - y0)
    tx, ty, tc = tie
    cv.paint(box(X, Y, tx - 9, ty - 3, tx + 9, ty + 3, 1.5), ramp((X - (tx - 9)) / 18, cyl(tc, hl=0.3)))


@icon('crown_daisy', ids=['cook_crown_daisy'], label='쑥갓')
def crown_daisy(cv):
    X, Y = cv.X, cv.Y

    def leaf(x, y, dx, dy):
        n = np.hypot(dx, dy)
        dx, dy = dx / n, dy / n
        for k, s in ((0, 1.0), (-0.9, 0.7), (0.9, 0.7), (-1.5, 0.45), (1.5, 0.45)):   # 깊게 갈라진 잎
            ax, ay = dx * np.cos(k) - dy * np.sin(k), dx * np.sin(k) + dy * np.cos(k)
            _leaf(cv, x - dx * 6, y - dy * 6, x + ax * 22 * s, y + ay * 22 * s, 5.0 * s + 1.5, 0x4fa04a)
    _bunch(cv, [(56, 110, 34, 50), (60, 110, 52, 40), (64, 110, 70, 38), (68, 110, 90, 48), (62, 110, 62, 56)], leaf, tie=(62, 92, 0xe9c85a))


@icon('water_parsley', ids=['cook_water_parsley'], label='미나리')
def water_parsley(cv):
    X, Y = cv.X, cv.Y

    def leaf(x, y, dx, dy):
        n = np.hypot(dx, dy)
        dx, dy = dx / n, dy / n
        for k in (-0.8, 0, 0.8):
            ax, ay = dx * np.cos(k) - dy * np.sin(k), dx * np.sin(k) + dy * np.cos(k)
            cx_, cy_ = x + ax * 7, y + ay * 7
            m = ell(X, Y, cx_, cy_, 5.2, 4.2) <= 1
            cv.paint(m, ramp((X - cx_ + 5) / 10, [(0, 0x7fd06a), (0.5, 0x3fa04a), (1, 0x2a7a3a)]))
            cv.tint(m & (seg_dist(X, Y, x, y, cx_ + ax * 4, cy_ + ay * 4) < 0.45), 0x2a7a3a, 0.7)
    _bunch(cv, [(54, 112, 30, 38), (58, 112, 44, 28), (62, 112, 60, 22), (66, 112, 78, 28), (70, 112, 94, 38), (60, 112, 52, 48), (66, 112, 72, 46)],
           leaf, tie=(62, 96, 0x2a78c8), stem_col=0xa9d98a)


def _chili(cv, color, seed):
    X, Y = cv.X, cv.Y
    for (ox, oy, deg, ln, bw) in ((20, 92, -24, 84, 8.0), (30, 114, -46, 78, 7.2)):
        u, v = cv.frame(ox, oy, deg)
        t = np.clip(u / ln, 0, 1)
        c = 6.0 * np.sin(np.pi * t)                                                  # 살짝 휜다
        hw = 0.8 + bw * np.sin(np.pi * np.clip(t * 0.88 + 0.12, 0, 1)) ** 0.6 * (0.3 + 0.7 * t)
        m = (u >= 0) & (u <= ln) & (np.abs(v - c) <= hw)
        cv.paint(m, ramp((v - c) / (2 * hw) + 0.5, cyl(color, hl=0.3, gloss=0.75, dark=0.5)))
        cal = (ell(u, v, ln - 1, 0, 5.5, bw * 0.95) <= 1) & (u > ln - 3.5)             # 꼭지 받침
        cv.paint(cal, ramp(v / (2 * bw) + 0.5, [(0, 0x7fc06a), (0.5, 0x3f8f3a), (1, 0x2a6a2a)]))
        stem = polyline(u, v, [(ln + 1, 0), (ln + 8, -2.5), (ln + 14, -7)], 1.7)
        cv.paint(stem, ramp(v / 12 + 0.7, [(0, 0x8fd07a), (0.5, 0x4f9a44), (1, 0x2a6a2a)]))


@icon('chili_green', ids=['cook_chili_green'], label='청양고추')
def chili_green(cv):
    _chili(cv, 0x3f9a3a, 1)


@icon('chili_red', ids=['cook_chili_red'], label='홍고추')
def chili_red(cv):
    _chili(cv, 0xc9302a, 2)


@icon('lemon', ids=['cook_lemon'], label='레몬')
def lemon(cv):
    X, Y = cv.X, cv.Y
    m = cv.ball(60, 70, 34, 0xf2d02a, ry=26, gloss=0.6)
    tipr = poly(cv, [(90, 62), (104, 70), (90, 78)])
    cv.paint(tipr, ramp((Y - 62) / 16, [(0, 0xf6e06a), (0.5, 0xe9c020), (1, 0xb8901a)]))
    tipl = poly(cv, [(29, 64), (20, 70), (29, 76)])
    cv.paint(tipl, 0xd9b01e)
    cv.paint(disc(X, Y, 19.5, 70, 2.0), 0x6b8a2a)
    n = noise(cv.a.shape, 3, 1)
    cv.tint(m & (n > 0.74), 0xd9b01e, 0.5)                                            # 껍질 오돌토돌
    # 반 가른 조각
    cx2, cy2 = 90, 98
    cut = ell(X, Y, cx2, cy2, 21, 17) <= 1
    cv.paint(cut, 0xf2d02a)
    cv.paint(ell(X, Y, cx2, cy2, 18.6, 14.8) <= 1, 0xfff6c8)
    inner = ell(X, Y, cx2, cy2, 16.6, 13.0) <= 1
    cv.paint(inner, 0xf6e06a)
    a = np.arctan2((Y - cy2) * 1.28, X - cx2)
    cv.tint(inner & (np.mod(a, np.pi / 4) < 0.14), 0xfff6c8, 1.0)
    cv.paint(disc(X, Y, cx2, cy2, 2.0), 0xfff6c8)


@icon('ginger', ids=['cook_ginger'], label='생강')
def ginger(cv):
    X, Y = cv.X, cv.Y
    base = 0xd9b77a
    blobs = [(52, 76, 24, 15), (78, 66, 17, 13), (34, 62, 13, 11), (92, 84, 13, 10), (64, 52, 12, 10), (96, 54, 9, 8), (40, 92, 11, 8)]
    body = np.zeros(X.shape, bool)
    for cx_, cy_, rx, ry in blobs:
        body |= ell(X, Y, cx_, cy_, rx, ry) <= 1
    d = np.minimum.reduce([ell(X, Y, cx_ - rx * 0.25, cy_ - ry * 0.35, rx * 1.15, ry * 1.15) for cx_, cy_, rx, ry in blobs])
    cv.paint(body, ramp(d, [(0, lit(base, 0.5)), (0.2, lit(base, 0.3)), (0.21, lit(base, 0.1)), (0.6, base), (0.61, lit(base, -0.2)), (1, lit(base, -0.4))]))
    for cx_, cy_, rx, ry in blobs:                                                   # 마디 줄
        cv.tint(body & ring(X, Y, cx_, cy_, rx * 0.72, ry * 0.72, 0.6) & (Y > cy_), 0x9a7a44, 0.5)
    for cx_, cy_ in ((98, 50), (28, 58), (66, 44)):                                   # 싹 난 눈
        cv.paint(disc(X, Y, cx_, cy_, 2.6), 0xe9a0a0)
    cut = ell(X, Y, 103, 88, 4.2, 6.5) <= 1
    cv.paint(cut, 0xf6e6a8)


@icon('herb', ids=['inv_mat_herb'], px=['px:it_herb'], label='약초')
def herb(cv):
    X, Y = cv.X, cv.Y
    # 쑥 한 묶음 — 은빛 도는 잎, 삼끈
    def leaf(x, y, dx, dy):
        n = np.hypot(dx, dy)
        dx, dy = dx / n, dy / n
        for k, s in ((0, 1.0), (-0.7, 0.8), (0.7, 0.8), (-1.3, 0.55), (1.3, 0.55)):
            ax, ay = dx * np.cos(k) - dy * np.sin(k), dx * np.sin(k) + dy * np.cos(k)
            _leaf(cv, x - dx * 8, y - dy * 8, x + ax * 20 * s, y + ay * 20 * s, 3.4 * s + 1.2, 0x6f9a6a)
    _bunch(cv, [(58, 112, 36, 46), (62, 112, 54, 36), (66, 112, 74, 36), (70, 112, 92, 48)], leaf, tie=(64, 94, 0xc9a86a), stem_col=0x8fae7a)
    cv.paint(ring(X, Y, 78, 97, 5, 4, 1.2), 0xc9a86a)


@icon('veges', ids=['inv_veges'], label='식자재 묶음 (대파/양파)')
def veges(cv):
    X, Y = cv.X, cv.Y
    # 그물망에 든 양파 둘 + 비스듬히 기댄 대파
    u, v = cv.frame(30, 116, -62.0)
    st = (u >= 0) & (u <= 60) & (np.abs(v) <= 4.6)
    cv.paint(st, ramp(v / 9.2 + 0.5, cyl(0xf6f4ea, hl=0.3, gloss=0.6, dark=0.35)))
    cv.tint(st & (u > 40), 0x9fd07a, 0.7)
    x0, y0 = 30 + 58 * np.cos(np.deg2rad(62)), 116 - 58 * np.sin(np.deg2rad(62))
    for dv, ln, w in ((-10, 44, 4.0), (2, 52, 4.4), (14, 40, 3.8)):
        ang = np.deg2rad(62 + dv)
        _leaf(cv, x0 - 3 * np.cos(ang), y0 + 3 * np.sin(ang), x0 + ln * np.cos(ang), y0 - ln * np.sin(ang), w, 0x2f8f4f)
    for cx_, cy_, r in ((62, 92, 19), (90, 88, 17)):
        m = cv.ball(cx_, cy_, r, 0xd9a05a, ry=r * 0.94, gloss=0.5)
        cv.paint(poly(cv, [(cx_ - 3, cy_ - r + 2), (cx_ + 3, cy_ - r + 2), (cx_ + 1, cy_ - r - 7), (cx_ - 1, cy_ - r - 7)]), 0xc9a06a)
    net = (ell(X, Y, 76, 91, 36, 23) <= 1) & (cv.a > 0.5)
    cv.tint(net & ((np.mod(X + Y, 7.0) < 0.9) | (np.mod(X - Y, 7.0) < 0.9)), 0xc9302a, 0.75)   # 붉은 그물
