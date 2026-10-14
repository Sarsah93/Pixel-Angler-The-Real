# -*- coding: utf-8 -*-
"""마실 것 · 양념 · 봉지 · 캔 · 단지"""
import numpy as np
from kit import *
from shapes import *


# ─────────────────────────────────────────────
# 병
# ─────────────────────────────────────────────
@icon('water', ids=['shop_water'], label='생수 500ml')
def water(cv):
    def lab(cv, m, r):
        cv.paint(m & (np.abs(cv.Y - (r[1] + r[3]) / 2) < 3.2), 0x1f6fb0)
        cv.paint(m & (np.abs(cv.Y - ((r[1] + r[3]) / 2 - 0.8 + 1.8 * np.sin(cv.X * 0.45))) < 0.8), 0xffffff)
    body, _, _ = bottle(cv, top=12, bottom=116, body_w=17, neck_w=7, neck_h=7, shoulder=16, glass=0xa9d8f2, liquid=0x6cbcf0, level=0.06,
                        cap=0x2a78c8, cap_h=7, label=lab, label_y=(0.42, 0.62), label_col=0xe8f4fd, clear=True)
    X, Y = cv.X, cv.Y
    for yy in (84, 91, 98, 105):                                                     # 몸통 주름
        cv.tint(body & (np.abs(Y - yy) < 0.6), 0x3f8fd0, 0.55)


@icon('soju', ids=['shop_soju'], label='소주')
def soju(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (ell(X, Y, 64, (r[1] + r[3]) / 2 - 2, 7, 6) <= 1), 0x2f8f4f)
        cv.paint(m & (ell(X, Y, 64, (r[1] + r[3]) / 2 - 2, 4.4, 3.6) <= 1), 0xf4f1e6)
        text_bars(cv, m, 52, 76, [r[3] - 5.5, r[3] - 2.8], 0x2f6f4a, seed=3, h=0.7)
    bottle(cv, top=10, bottom=116, body_w=15.5, neck_w=5.6, neck_h=22, shoulder=13, glass=0x3f9a5a, liquid=0x4fb06a, level=0.1,
           cap=0x2f8f4f, cap_h=6, label=lab, label_y=(0.50, 0.84))


@icon('makgeolli', ids=['shop_makgeolli'], label='막걸리')
def makgeolli(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y < r[1] + 4), 0x2f6fb0)
        for k in range(3):                                                           # 벼 이삭
            cv.paint(m & (ell(X, Y, 58 + k * 6, (r[1] + r[3]) / 2 + 1, 2.0, 4.6) <= 1), 0xd9a83a)
        text_bars(cv, m, 50, 78, [r[3] - 3.2], 0x55535a, seed=4, h=0.8)
    body, _, _ = bottle(cv, top=12, bottom=116, body_w=19, neck_w=8.5, neck_h=8, shoulder=18, glass=0xf2efe4, liquid=0xfaf7ee, level=0.02,
                        cap=0x2f8f4f, cap_h=8, label=lab, label_y=(0.50, 0.82), label_col=0xf8f3df)
    cv.tint(body & (cv.Y > 108), 0xd9d3c0, 0.6)                                       # 가라앉은 앙금


@icon('tonic_drink', ids=['inv_potion'], label='HP 회복 드링크')
def tonic_drink(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y < r[1] + 3.5), 0xc9302a)
        cv.paint(m & (Y > r[3] - 3.5), 0xc9302a)
        cy = (r[1] + r[3]) / 2
        cv.paint(m & box(X, Y, 61.4, cy - 6, 66.6, cy + 6), 0xc9302a)                   # 붉은 십자
        cv.paint(m & box(X, Y, 58, cy - 2.6, 70, cy + 2.6), 0xc9302a)
    bottle(cv, top=22, bottom=112, body_w=17, neck_w=7.5, neck_h=9, shoulder=11, glass=0x7a4a1e, liquid=0x8c5622, level=0.1,
           cap=0xe9c85a, cap_h=8, cap_w=9, label=lab, label_y=(0.42, 0.86), label_col=0xfff6de)


@icon('soy_light', ids=['cook_soy'], label='국간장')
def soy_light(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y < r[1] + 4), 0xd9a83a)
        cv.paint(m & (ell(X, Y, 64, (r[1] + r[3]) / 2 + 2, 6.5, 6.5) <= 1), 0xb5562a)
        cv.paint(m & (ell(X, Y, 64, (r[1] + r[3]) / 2 + 2, 3.6, 3.6) <= 1), 0xfff6de)
    bottle(cv, top=12, bottom=116, body_w=18, neck_w=6.5, neck_h=14, shoulder=18, glass=0x8a5a2a, liquid=0x7a4a1e, level=0.08,
           cap=0xe9c85a, cap_h=8, label=lab, label_y=(0.50, 0.84), label_col=0xfff6de, clear=True)


@icon('soy_dark', ids=['cook_soy_dark'], label='진간장')
def soy_dark(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y < r[1] + 4), 0xc9302a)
        cv.paint(m & box(X, Y, 56, (r[1] + r[3]) / 2 - 3, 72, (r[1] + r[3]) / 2 + 7, 1.5), 0x2b1a12)
        text_bars(cv, m, 58, 70, [(r[1] + r[3]) / 2 + 0.5, (r[1] + r[3]) / 2 + 3.6], 0xf6e08a, seed=6, h=0.7, wmin=1.6, wmax=3.4)
    bottle(cv, top=12, bottom=116, body_w=18, neck_w=6.5, neck_h=14, shoulder=18, glass=0x3a2418, liquid=0x24140c, level=0.08,
           cap=0xc9302a, cap_h=8, label=lab, label_y=(0.50, 0.84), label_col=0xf4f1e6)


@icon('fish_sauce', ids=['cook_fish_sauce'], label='액젓')
def fish_sauce(cv):
    def lab(cv, m, r):
        cv.paint(m & (cv.Y > r[3] - 4), 0x1f5f86)
        fish_mark(cv, m, 63, (r[1] + r[3]) / 2 - 1.5, 6.5, 0x1f5f86)
    bottle(cv, top=10, bottom=116, body_w=15, neck_w=5.5, neck_h=20, shoulder=16, glass=0xc98a3a, liquid=0xb5702a, level=0.12,
           cap=0x1f5f86, cap_h=7, label=lab, label_y=(0.52, 0.84), label_col=0xfff6de, clear=True)


@icon('sesame_oil', ids=['cook_sesame_oil'], label='참기름')
def sesame_oil(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m, 0xe9c85a)
        rng = np.random.default_rng(2)
        for _ in range(9):                                                           # 참깨 알
            gx, gy = rng.uniform(55, 73), rng.uniform(r[1] + 2, r[3] - 2)
            cv.paint(m & (ell(X, Y, gx, gy, 1.5, 0.9) <= 1), 0xfff6de)
        cv.paint(m & (np.abs(Y - r[1]) < 1.0), 0x8a5a1e)
        cv.paint(m & (np.abs(Y - r[3]) < 1.0), 0x8a5a1e)
    bottle(cv, top=24, bottom=112, body_w=15, neck_w=6, neck_h=12, shoulder=10, glass=0x7a4a14, liquid=0x8c5a18, level=0.1,
           cap=0xc9302a, cap_h=9, cap_w=7.5, label=lab, label_y=(0.46, 0.80), label_col=None)


@icon('cooking_oil', ids=['cook_cooking_oil'], label='식용유')
def cooking_oil(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y < r[1] + 4.5), 0x2f8f4f)
        cv.paint(m & (ell(X, Y, 64, (r[1] + r[3]) / 2 + 2.5, 8, 5.5) <= 1), 0xf2c230)
        cv.paint(m & (ell(X, Y, 64, (r[1] + r[3]) / 2 + 2.5, 3.2, 5.5) <= 1), 0xd9a01a)
    body, _, _ = bottle(cv, top=10, bottom=116, body_w=21, neck_w=7.5, neck_h=8, shoulder=20, glass=0xf2d86a, liquid=0xf0c830, level=0.08,
                        cap=0xf2c230, cap_h=8, label=lab, label_y=(0.46, 0.80), label_col=0xfff6de, clear=True)
    X, Y = cv.X, cv.Y
    grip = ring(X, Y, 86, 62, 9, 16, 3.2) & (X > 84)                                  # 손잡이
    cv.paint(grip, ramp((X - 84) / 12, [(0, 0xf6e08a), (0.5, 0xf2d86a), (1, 0xb8902c)]))


@icon('reel_oil', ids=['inv_oil'], label='릴 오일')
def reel_oil(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y < r[1] + 3), 0x1f5f86)
        cy = (r[1] + r[3]) / 2 + 1.5
        cv.paint(m & ring(X, Y, 64, cy, 6.5, 6.5, 2.0), 0x1f5f86)                       # 릴 스풀 표장
        cv.paint(m & disc(X, Y, 64, cy, 2.0), 0x1f5f86)
    body, _, _ = bottle(cv, top=30, bottom=112, body_w=14, neck_w=5.2, neck_h=5, shoulder=9, glass=0xe8eef2, liquid=0xf2d86a, level=0.12,
                        cap=0x2b2f35, cap_h=6, cap_w=6.2, label=lab, label_y=(0.42, 0.84), label_col=0xf4f6f7, clear=True)
    X, Y = cv.X, cv.Y
    nz = poly(cv, [(61.4, 30.5), (66.6, 30.5), (64.9, 12), (63.1, 12)])               # 긴 주둥이
    cv.paint(nz, ramp((X - 61) / 6, [(0, 0x8b949d), (0.35, 0xf2f5f7), (1, 0x66707a)]))
    cv.paint(box(X, Y, 62.6, 9, 65.4, 12.5, 0.8), 0xc9302a)


@icon('spray', ids=['inv_spray'], label='기능성 스프레이')
def spray(cv):
    X, Y = cv.X, cv.Y

    def lab(cv, m, r):
        cv.paint(m & (cv.Y < r[1] + 20), 0x2a78c8)
        cv.paint(m & (np.abs(cv.Y - (r[1] + 20)) < 1.2), 0xf2c230)
        fish_mark(cv, m, 63, r[1] + 10, 6.0, 0xf4f6f7)
        text_bars(cv, m, 50, 78, [r[1] + 27, r[1] + 31, r[1] + 35], 0x59636d, seed=8, h=0.7)
    side, _ = can(cv, top=36, bottom=110, hw=17, ry=4.5, color=0xf4f6f7, label=lab, tab=False, rim=2.2)
    dome = (ell(X, Y, 64, 36, 17, 9) <= 1) & (Y <= 36.5)
    cv.paint(dome, ramp((X - 47) / 34, cyl(0xc3ccd4, hl=0.27)))
    cv.paint(box(X, Y, 57, 14, 71, 28, 2.5), ramp((X - 57) / 14, cyl(0xc9302a, hl=0.3, gloss=0.5)))   # 누름 단추
    cv.paint(box(X, Y, 55.5, 24, 72.5, 29.5, 1.5), ramp((X - 55) / 18, cyl(0xa02620, hl=0.3)))
    cv.paint(box(X, Y, 49, 17.5, 57.5, 20.5, 1.0), 0x7d1f1a)                             # 분사구
    cv.paint(disc(X, Y, 49.5, 19, 1.0), 0x15181c)


# ─────────────────────────────────────────────
# 봉지
# ─────────────────────────────────────────────
def _band_label(color, emblem=None, bars=0x55535a, band_h=0.34):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        y0 = r[1] + (r[3] - r[1]) * 0.22
        y1 = y0 + (r[3] - r[1]) * band_h
        cv.paint(m & (Y > y0) & (Y < y1) & (np.abs(X - 64) < (r[2] - r[0]) / 2 - 5), color)
        if emblem:
            emblem(cv, m, (y0 + y1) / 2)
        text_bars(cv, m, r[0] + 9, r[2] - 9, [y1 + 6, y1 + 10.5, y1 + 15], bars, seed=int(color) % 97, h=0.9)
    return lab


@icon('chum_mix', ids=['inv_chum'], label='집어제 (크릴 배합)')
def chum_mix(cv):
    def emb(cv, m, cy):
        X, Y = cv.X, cv.Y
        shrimp = ring(X, Y, 64, cy + 2, 9, 7, 3.2) & (Y < cy + 3)                       # 크릴 등
        cv.paint(m & shrimp, 0xff9a7a)
        cv.paint(m & disc(X, Y, 56.5, cy + 1.5, 1.2), 0x2b1a12)
    pouch(cv, top=14, bottom=114, w=64, color=0xb5362a, label=_band_label(0xfff6de, emb, bars=0xf6d9c9), seed=11)


@icon('chum_powder', ids=['inv_chum_powder'], label='감성돔 집어 파우더')
def chum_powder(cv):
    pouch(cv, top=14, bottom=114, w=64, color=0x2f7f4f,
          label=_band_label(0xf8f3df, lambda cv, m, cy: fish_mark(cv, m, 63, cy, 8.5, 0x2b2f35), bars=0xcfe8d6), seed=12)


@icon('chum_powder_heavy', ids=['inv_chum_powder_heavy'], label='고비중 파우더')
def chum_powder_heavy(cv):
    def emb(cv, m, cy):
        X, Y = cv.X, cv.Y
        fish_mark(cv, m, 60, cy - 1, 7.0, 0xf2c230)
        for k in range(3):                                                           # 가라앉는 화살
            cv.paint(m & poly(cv, [(74 + k * 0, cy - 5 + k * 4), (80, cy - 5 + k * 4), (77, cy - 1.5 + k * 4)]), 0xf2c230)
    pouch(cv, top=14, bottom=114, w=64, color=0x23324f, label=_band_label(0x14203a, emb, bars=0x8fa9d0), seed=13)


@icon('chum_bread', ids=['inv_chum_bread'], label='빵가루 (밑밥용)')
def chum_bread(cv):
    pouch(cv, top=14, bottom=114, w=64, color=0xe9d9b0, seal=0xc9302a, window=(0.12, 0.34, 0.88, 0.92),
          window_fill=lambda cv, m, r: grains(cv, m, r, 0xe8c98a, seed=5, size=1.5, density=0.55),
          label=lambda cv, m, r: (cv.paint(m & (cv.Y < r[1] + 20) & (np.abs(cv.X - 64) < 24), 0xc9302a),
                                  text_bars(cv, m, 46, 82, [r[1] + 8, r[1] + 13], 0xfff6de, seed=3, h=1.0)), seed=14)


@icon('chum_apmac', ids=['inv_chum_apmac'], label='압맥 (눌린 보리)')
def chum_apmac(cv):
    pouch(cv, top=14, bottom=114, w=64, color=0xf2ead2, seal=0x8a6a2c, window=(0.12, 0.34, 0.88, 0.92),
          window_fill=lambda cv, m, r: grains(cv, m, r, 0xd9b877, seed=6, size=2.3, density=0.5, dark=-0.3, light=0.4),
          label=lambda cv, m, r: (cv.paint(m & (cv.Y < r[1] + 20) & (np.abs(cv.X - 64) < 24), 0x8a6a2c),
                                  text_bars(cv, m, 46, 82, [r[1] + 8, r[1] + 13], 0xfff6de, seed=4, h=1.0)), seed=15)


@icon('rice_bag', ids=['shop_rice'], label='쌀 1kg')
def rice_bag(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (ell(X, Y, 64, 58, 15, 15) <= 1), 0xc9302a)
        for k in (-1, 0, 1):                                                         # 벼 이삭
            cv.paint(m & (ell(X - k * 5.5, Y, 64, 58 - abs(k) * 1.5, 2.2, 8.5) <= 1), 0xfff6de)
        text_bars(cv, m, 44, 84, [84, 89.5, 95], 0x8a8170, seed=9, h=1.0)
    pouch(cv, top=14, bottom=114, w=66, color=0xf6f1e4, seal=0xd9cfb6, label=lab, seed=16)


@icon('coarse_salt', ids=['inv_coarse_salt'], label='굵은소금')
def coarse_salt(cv):
    pouch(cv, top=14, bottom=114, w=64, color=0x2a78c8, window=(0.14, 0.42, 0.86, 0.92),
          window_fill=lambda cv, m, r: grains(cv, m, r, 0xe8eef2, seed=7, size=2.0, density=0.45, dark=-0.22, light=0.6),
          label=lambda cv, m, r: (cv.paint(m & (cv.Y < r[1] + 24) & (np.abs(cv.X - 64) < 24), 0xf4f6f7),
                                  cv.paint(m & (np.abs(cv.Y - (r[1] + 12 + 2.2 * np.sin(cv.X * 0.5))) < 1.3) & (np.abs(cv.X - 64) < 20), 0x2a78c8)), seed=17)


@icon('salt', ids=['cook_salt'], px=['px:it_spice'], label='소금')
def salt(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y > 54) & (Y < 82) & (np.abs(X - 64) < 19), 0x4aa3e0)
        for dx, dy in ((-7, 62), (2, 60), (9, 68), (-3, 72), (6, 77), (-10, 76)):       # 소금 결정
            cv.paint(m & box(X, Y, 64 + dx - 2, dy - 2, 64 + dx + 2, dy + 2, 0.4), 0xffffff)
    pouch(cv, top=26, bottom=112, w=50, color=0xf4f6f7, seal=0x4aa3e0, label=lab, seed=18)


@icon('sugar', ids=['cook_sugar'], label='설탕')
def sugar(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y > 54) & (Y < 82) & (np.abs(X - 64) < 19), 0xe9c85a)
        cv.paint(m & poly(cv, [(56, 74), (64, 58), (72, 74)]), 0xffffff)               # 설탕 더미
        cv.paint(m & poly(cv, [(64, 58), (72, 74), (66, 74)]), 0xdfe5ea)
    pouch(cv, top=26, bottom=112, w=50, color=0xfbf6ea, seal=0xe9c85a, label=lab, seed=19)


@icon('gochugaru', ids=['cook_gochugaru'], label='고춧가루')
def gochugaru(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        ch = (ell(X, Y, 64, 42, 4.5, 2.6) <= 1)
        cv.paint(m & capsule(X, Y, 55, 46, 72, 40, 3.0), 0xf4f1e6)
        cv.paint(m & capsule(X, Y, 57, 45.5, 70, 41, 1.7), 0xc9302a)                    # 고추 그림
        cv.paint(m & capsule(X, Y, 70, 41, 73, 38.5, 0.8), 0x2f8f4f)
    pouch(cv, top=26, bottom=112, w=52, color=0xa8241c, window=(0.14, 0.38, 0.86, 0.9),
          window_fill=lambda cv, m, r: grains(cv, m, r, 0xc9302a, seed=8, size=1.1, density=0.6, dark=-0.35, light=0.3), label=lab, seed=20)


@icon('ice_bag', ids=['inv_ice_bulk'], label='대용량 각얼음')
def ice_bag(cv):
    X, Y = cv.X, cv.Y

    def cubes(cv, m, r):
        cv.paint(m, 0xbfe2f7)
        rng = np.random.default_rng(4)
        for _ in range(26):
            gx, gy, s, a = rng.uniform(r[0], r[2]), rng.uniform(r[1], r[3]), rng.uniform(5.0, 7.5), rng.uniform(-0.5, 0.5)
            uu = (X - gx) * np.cos(a) + (Y - gy) * np.sin(a)
            vv = -(X - gx) * np.sin(a) + (Y - gy) * np.cos(a)
            cm = m & (np.abs(uu) < s) & (np.abs(vv) < s)
            cv.paint(cm, ramp((uu + vv) / (4 * s) + 0.5, [(0, 0xffffff), (0.35, 0xdff1fb), (0.7, 0xa9d4f0), (1, 0x7ab4dc)]))
            cv.paint(cm & ((np.abs(uu) > s - 1.0) | (np.abs(vv) > s - 1.0)), 0x6aa6d2)
    pouch(cv, top=12, bottom=114, w=70, color=0xdff1fb, seal=0x2a78c8, window=(0.06, 0.26, 0.94, 0.95), window_fill=cubes,
          label=lambda cv, m, r: (cv.paint(m & (cv.Y < r[1] + 17) & (np.abs(cv.X - 64) < 27), 0x2a78c8),
                                  text_bars(cv, m, 43, 85, [r[1] + 6, r[1] + 11], 0xffffff, seed=2, h=1.1)), seed=21, bulge=0.1)


# ─────────────────────────────────────────────
# 캔 · 단지 · 통
# ─────────────────────────────────────────────
@icon('can_tuna', ids=['inv_can'], label='참치 통조림')
def can_tuna(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cv.paint(m & (Y > r[1] + 1) & (Y < r[3] - 1) & (np.abs(X - 64) < 22), 0x1f5f9a)
        fish_mark(cv, m, 62, (r[1] + r[3]) / 2, 9.0, 0xf4f6f7)
    can(cv, top=52, bottom=90, hw=40, ry=11, color=0xf2c230, label=lab, rim=3.0)


@icon('chum_corn', ids=['inv_chum_corn'], label='옥수수 캔 (밑밥용)')
def chum_corn(cv):
    def lab(cv, m, r):
        X, Y = cv.X, cv.Y
        cy = (r[1] + r[3]) / 2
        cob = ell(X, Y, 64, cy, 9, 17) <= 1
        cv.paint(m & cob, 0xf2c230)
        cv.tint(m & cob & ((np.mod(X + 0.5, 3.6) < 0.8) | (np.mod(Y, 3.6) < 0.8)), 0xb8802a, 0.8)   # 알갱이 줄
        cv.paint(m & poly(cv, [(55, cy + 4), (50, cy + 20), (62, cy + 18)]), 0x2f8f4f)               # 껍질 잎
        cv.paint(m & poly(cv, [(73, cy + 4), (78, cy + 20), (66, cy + 18)]), 0x3fa05f)
    can(cv, top=30, bottom=106, hw=27, ry=7.5, color=0x2f8f4f, label=lab, band=(0.0, 0.1, 0xf2c230))


@icon('gascan', ids=['cook_butane_can'], px=['px:it_gascan'], label='부탄 캐니스터')
def gascan(cv):
    X, Y = cv.X, cv.Y

    def lab(cv, m, r):
        cv.paint(m & (Y > 58) & (Y < 82), 0xf4f6f7)
        fl = poly(cv, [(64, 60), (70, 71), (67, 79), (61, 79), (58, 71)])              # 불꽃
        cv.paint(m & fl, 0xf07a1a)
        cv.paint(m & poly(cv, [(64, 67), (67, 74), (64, 78), (61, 74)]), 0xffe27a)
        text_bars(cv, m, 44, 84, [90, 94.5], 0xcfe3f2, seed=5, h=0.8)
    can(cv, top=40, bottom=110, hw=22, ry=5.5, color=0x2a78c8, label=lab, tab=False, rim=2.4)
    dome = (ell(X, Y, 64, 40, 22, 14) <= 1) & (Y <= 40.5)
    cv.paint(dome, ramp((X - 42) / 44, cyl(0xc3ccd4, hl=0.27)))
    cv.paint(box(X, Y, 58.5, 17, 69.5, 28, 1.5), ramp((X - 58) / 12, cyl(0xc9302a, hl=0.3, gloss=0.5)))   # 붉은 마개
    cv.paint(box(X, Y, 56, 25.5, 72, 29, 1.0), ramp((X - 56) / 16, cyl(0x8b949d, hl=0.3)))
    cv.erase(box(X, Y, 62.6, 16, 65.4, 19.5))                                          # 정렬 홈


@icon('gochujang', ids=['cook_gochujang'], label='고추장')
def gochujang(cv):
    X, Y = cv.X, cv.Y
    # 붉은 사각 통 + 금색 뚜껑
    body = box(X, Y, 32, 44, 96, 110, 7)
    tx = (X - 32) / 64
    cv.paint(body, ramp(tx, cyl(0xb5241c, hl=0.24, gloss=0.4)))
    lab = body & box(X, Y, 39, 60, 89, 98, 3)
    cv.paint(lab, 0xf8ecd0)
    cv.paint(lab & (ell(X, Y, 64, 79, 13, 13) <= 1), 0xc9302a)
    cv.paint(lab & capsule(X, Y, 57, 82, 70, 76, 2.4), 0xf8ecd0)
    cv.paint(lab & capsule(X, Y, 58.5, 81.5, 68.5, 76.8, 1.3), 0xc9302a)
    lid = box(X, Y, 29, 28, 99, 47, 5)
    cv.paint(lid, ramp((X - 29) / 70, cyl(0xe9c85a, hl=0.25, gloss=0.6)))
    cv.tint(lid & (Y > 43.5), 0x8a6a1e, 0.6)
    cv.tint(lid & (np.mod(X, 3.0) < 0.8) & (Y > 33) & (Y < 43), 0xb8902c, 0.5)


@icon('garlic_minced', ids=['cook_garlic'], label='다진마늘')
def garlic_minced(cv):
    jar(cv, top=30, bottom=108, hw=24, lid=0x2f8f4f, lid_h=13, content=0xf2e6b8, level=0.1,
        content_fn=lambda cv, m, r: grains(cv, m, r, 0xf2e6b8, seed=9, size=1.5, density=0.5, dark=-0.25, light=0.4),
        label=lambda cv, m, r: (cv.paint(m & (ell(cv.X, cv.Y, 64, (r[1] + r[3]) / 2, 8, 9) <= 1), 0xfff6de),
                                cv.paint(m & ring(cv.X, cv.Y, 64, (r[1] + r[3]) / 2, 8, 9, 1.2), 0x8a8170),
                                cv.paint(m & poly(cv, [(61.5, (r[1] + r[3]) / 2 - 8), (66.5, (r[1] + r[3]) / 2 - 8), (64, (r[1] + r[3]) / 2 - 13)]), 0x8a8170)),
        label_col=0x3fa05f)


@icon('pepper', ids=['cook_pepper'], label='후추')
def pepper(cv):
    X, Y = cv.X, cv.Y
    side, _ = can(cv, top=44, bottom=110, hw=20, ry=5, color=0xd9dee2, tab=False, rim=2.2,
                  label=lambda cv, m, r: (cv.paint(m & (cv.Y > 60) & (cv.Y < 96), 0x2b2f35),
                                          [cv.paint(m & disc(cv.X, cv.Y, 64 + dx, 78 + dy, 2.6), 0x8a8170) for dx, dy in ((-7, -6), (2, -8), (8, 0), (-3, 2), (4, 8), (-9, 8))]))
    cap = (ell(X, Y, 64, 44, 20, 12) <= 1) & (Y <= 44.5)
    cv.paint(cap, ramp((X - 44) / 40, cyl(0x2b2f35, hl=0.27, gloss=0.5)))
    for dx, dy in ((-7, -5), (0, -7), (7, -5), (-4, -1.5), (4, -1.5)):
        cv.paint(disc(X, Y, 64 + dx, 42 + dy, 1.1), 0xaab4bd)


@icon('chum_viscera', prefixes=['inv_chum_viscera_'], label='내장 밑밥')
def chum_viscera(cv):
    jar(cv, top=28, bottom=108, hw=26, lid=0x8b949d, lid_h=12, content=0x8a2a2a, level=0.16,
        content_fn=lambda cv, m, r: grains(cv, m, r, 0x8a2a2a, seed=12, size=3.4, density=0.4, dark=-0.45, light=0.35),
        label=None, label_col=None)


@icon('breadpack', ids=['inv_breadbait_pack'], px=['px:it_breadpack'], label='빵가루 반죽 (200g)')
def breadpack(cv):
    X, Y = cv.X, cv.Y
    # 얕은 투명 통에 든 반죽 덩이
    tub = box(X, Y, 24, 58, 104, 104, 9)
    cv.paint(tub, ramp((X - 24) / 80, [(0, 0x9ab6c6), (0.1, 0xcfe3ea), (0.22, 0xffffff), (0.3, 0xdfeef4), (0.8, 0xc3d8e2), (1, 0x8fa9b8)]))
    dough = box(X, Y, 29, 62, 99, 100, 7)
    n = noise(cv.a.shape, 6, 3)
    cv.paint(dough, ramp((Y - 62) / 38 * 0.6 + n * 0.4, [(0, 0xf6e3b4), (0.5, 0xe8c98a), (1, 0xc9a25e)]))
    cv.tint(dough & (n > 0.7), 0xfff3d0, 0.5)
    lid = box(X, Y, 20, 46, 108, 62, 5)
    cv.paint(lid, ramp((Y - 46) / 16, [(0, 0xffffff), (0.4, 0xf4f1e6), (0.41, 0xd9d3c0), (1, 0xb5ad96)]))
    cv.paint(lid & box(X, Y, 44, 49, 84, 59, 2), 0xd9a83a)
    text_bars(cv, lid, 48, 80, [52.5, 56], 0xfff6de, seed=3, h=0.8)
