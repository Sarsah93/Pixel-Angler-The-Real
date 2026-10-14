# -*- coding: utf-8 -*-
"""입는 것 · 메는 것 — 옷 · 장갑 · 신발 · 가방"""
import numpy as np
from kit import *
from shapes import *


def _cloth(cv, mask, base, t, seed=1, weave=True):
    """천 — 부드러운 음영 + 올 무늬"""
    cv.paint(mask, ramp(t, [(0, lit(base, 0.28)), (0.3, lit(base, 0.1)), (0.6, base), (0.85, lit(base, -0.22)), (1, lit(base, -0.42))]))
    if weave:
        n = noise(cv.a.shape, seed, 1)
        cv.tint(mask & (n > 0.74), lit(base, 0.3), 0.16)
        cv.tint(mask & (n < 0.24), lit(base, -0.35), 0.16)


def _stitch(cv, mask, pts, color, r=0.5, dash=3.0):
    X, Y = cv.X, cv.Y
    m = polyline(X, Y, pts, r) & (np.mod(X + Y, dash) < dash * 0.6)
    cv.tint(mask & m, color, 0.9)


@icon('cap', ids=['inv_cap'], label='낚시 모자')
def cap(cv):
    X, Y = cv.X, cv.Y
    base = 0x23447a
    dome = (ell(X, Y, 70, 74, 40, 40) <= 1) & (Y <= 76)
    _cloth(cv, dome, base, np.clip((X - 30) / 80 * 0.6 + (Y - 34) / 42 * 0.4, 0, 1), seed=2)
    for xx in (52, 70, 88):                                                           # 조각 솔기
        seam = dome & (np.abs(X - (70 + (xx - 70) * np.sqrt(np.clip(1 - ((Y - 74) / 40) ** 2, 0, 1)))) < 0.6)
        cv.tint(seam, lit(base, -0.5), 0.8)
    cv.paint(ell(X, Y, 70, 35, 4.2, 2.6) <= 1, lit(base, 0.3))                           # 꼭지 단추
    band = dome & (Y > 68)
    cv.tint(band, lit(base, -0.3), 0.5)
    brim = (ell(X, Y, 40, 80, 38, 11) <= 1) & (Y > 74) | poly(cv, [(30, 76), (72, 76), (72, 82), (20, 84)])
    brim &= (X < 74)
    cv.paint(brim, ramp((Y - 72) / 20, [(0, lit(base, 0.3)), (0.4, lit(base, 0.05)), (0.75, lit(base, -0.3)), (1, lit(base, -0.55))]))
    cv.tint(brim & (Y > 87), 0x0c1830, 0.6)
    patch = dome & box(X, Y, 58, 50, 84, 66, 2.5)                                        # 물고기 와펜
    cv.paint(patch, 0xf4f1e6)
    fish_mark(cv, patch, 70, 58, 7.0, 0xc9302a)
    strap = box(X, Y, 104, 70, 112, 76, 1.5)
    cv.paint(strap, 0xb9c2ca)


@icon('glasses', ids=['inv_glasses'], label='편광 안경')
def glasses(cv):
    X, Y = cv.X, cv.Y
    frame = 0x1b1e23
    # 다리(뒤로 접히는 선) → 테 → 렌즈
    for sx in (-1, 1):
        cv.paint(polyline(X, Y, [(64 + sx * 50, 58), (64 + sx * 58, 50), (64 + sx * 54, 34)], 2.2), lit(frame, 0.15))
    for sx in (-1, 1):
        cx = 64 + sx * 26
        lens_o = (ell(X, Y, cx, 66, 25, 19) <= 1) & (Y > 50 - (X - cx) * sx * 0.06)
        lens_o &= ~poly(cv, [(cx - 30, 40), (cx + 30, 40), (cx + 30, 51), (cx - 30, 51)])
        cv.paint(lens_o, frame)
        lens = (ell(X, Y, cx, 67, 21.5, 15.5) <= 1) & (Y > 54)
        cv.paint(lens, ramp(np.clip((Y - 52) / 32, 0, 1), [(0, 0x2a5aa8), (0.35, 0x3f9ad8), (0.6, 0x5ad0c8), (0.85, 0xe9c85a), (1, 0xe07a2a)]))
        cv.tint(lens & (np.abs((X - cx) + (Y - 67) * 1.2 + 6) < 2.0), 0xffffff, 0.6)       # 반사 줄
        cv.tint(lens & (np.abs((X - cx) + (Y - 67) * 1.2 + 11) < 0.8), 0xffffff, 0.5)
    cv.paint(box(X, Y, 12, 49, 116, 56, 3), ramp((Y - 49) / 7, [(0, lit(frame, 0.35)), (0.4, frame), (1, lit(frame, -0.4))]))   # 윗테
    cv.paint(box(X, Y, 58, 56, 70, 66, 3) & ~(ell(X, Y, 64, 70, 5, 6) <= 1), frame)          # 코 다리
    cv.paint(box(X, Y, 16, 51, 30, 53, 1), 0xc9302a)                                         # 브랜드 띠


@icon('vest', ids=['inv_top'], colors=44, label='낚시 조끼')
def vest(cv):
    X, Y = cv.X, cv.Y
    base = 0x7a8a4a
    body = poly(cv, [(34, 22), (52, 16), (64, 30), (76, 16), (94, 22), (102, 44), (98, 110), (30, 110), (26, 44)])
    arm_l = ell(X, Y, 26, 40, 11, 20) <= 1
    arm_r = ell(X, Y, 102, 40, 11, 20) <= 1
    body &= ~arm_l & ~arm_r
    _cloth(cv, body, base, np.clip((X - 26) / 76, 0, 1), seed=3)
    cv.tint(body & (np.abs(X - 64) < 1.0) & (Y > 30), 0x2b2f35, 0.9)                        # 지퍼
    cv.tint(body & (np.abs(X - 64) < 2.2) & (Y > 30) & (np.mod(Y, 3.0) < 1.0), 0xc3ccd4, 0.8)
    neck = poly(cv, [(52, 16), (64, 30), (76, 16), (72, 15), (64, 25), (56, 15)])
    cv.paint(neck, lit(base, -0.45))
    for sx in (-1, 1):                                                                  # 주머니 넷
        for (py, ph) in ((46, 20), (76, 26)):
            px = 64 + sx * 19
            pk = box(X, Y, px - 12, py, px + 12, py + ph, 2.5)
            cv.paint(pk, ramp((Y - py) / ph, [(0, lit(base, 0.3)), (0.25, lit(base, 0.12)), (0.26, lit(base, -0.05)), (1, lit(base, -0.3))]))
            flap = box(X, Y, px - 12.6, py - 1, px + 12.6, py + ph * 0.32, 2.0)
            cv.paint(flap, ramp((Y - py) / (ph * 0.32), [(0, lit(base, 0.35)), (1, lit(base, 0.05))]))
            cv.tint(flap & (Y > py + ph * 0.32 - 1.0), lit(base, -0.55), 0.8)
            cv.paint(disc(X, Y, px, py + ph * 0.24, 1.5), 0xc9b98a)                          # 단추
    cv.paint(ring(X, Y, 44, 40, 3.5, 3.5, 1.1), 0xc3ccd4)                                    # D링
    cv.tint(body & (Y > 104), lit(base, -0.4), 0.7)
    cv.paint(body & box(X, Y, 26, 100, 102, 103.5), 0xf2c230)                                 # 반사띠


def _glove(cv, ox, oy, deg, base, cuff, palm=None, long_cuff=0.0, fingers=(1, 1, 1, 1), seed=1, cut=(0, 0, 0, 0), flip=1):
    """장갑 한 짝 — 손목(아래)에서 손끝(위)으로. cut = 손가락 끝이 잘린 것(낚시 장갑)"""
    u, v = cv.frame(ox, oy, deg)
    v = v * flip
    hand = rrect(u, v, 22, 0, 16, 15, 6)
    wrist = box(u, v, -long_cuff, -11, 10, 11, 3)
    mask = hand | wrist
    fl = [(36, -11.2, 22, 3.6), (36, -3.8, 27, 3.8), (36, 3.8, 25, 3.8), (36, 11.0, 19, 3.5)]
    fm = np.zeros(u.shape, bool)
    for k, (fu, fv, ln, r) in enumerate(fl):
        ln2 = ln * (0.55 if cut[k] else 1.0)
        f = capsule(u, v, fu - 4, fv, fu + ln2, fv, r)
        if cut[k]:
            f &= u < fu + ln2 + 0.5
        fm |= f
    thumb = capsule(u, v, 16, 13, 30, 25, 4.2)
    mask = mask | fm | thumb
    _cloth(cv, mask, base, np.clip(v / 34 + 0.5, 0, 1), seed=seed)
    for k, (fu, fv, ln, r) in enumerate(fl[:-1]):                                        # 손가락 사이 골
        cv.tint(mask & (np.abs(v - (fv + fl[k + 1][1]) / 2) < 0.5) & (u > 30) & (u < 44), lit(base, -0.55), 0.8)
    if palm is not None:                                                             # 손바닥 쪽 코팅(한 짝은 뒤집어 보인다)
        pm = mask & (u > 11)
        cv.paint(pm, ramp(np.clip(v / 34 + 0.5, 0, 1), [(0, lit(palm, 0.3)), (0.4, palm), (1, lit(palm, -0.4))]))
        cv.tint(pm & (np.mod(u, 3.0) < 1.0) & (np.mod(v, 3.0) < 1.0), lit(palm, 0.45), 0.6)   # 미끄럼 방지 돌기
        for k, (fu, fv, ln, r) in enumerate(fl[:-1]):
            cv.tint(pm & (np.abs(v - (fv + fl[k + 1][1]) / 2) < 0.5) & (u > 30) & (u < 44), lit(palm, -0.6), 0.8)
    cm = box(u, v, -long_cuff, -11.8, 9, 11.8, 3)
    if long_cuff > 0:                                                                # 긴 고무 토시 — 줄무늬 없이 매끈하다
        cv.paint(cm, ramp(v / 23.6 + 0.5, cyl(cuff, hl=0.3, gloss=0.5)))
        cv.tint(cm & (u < -long_cuff + 3.5), lit(cuff, -0.45), 0.7)
    else:
        cv.paint(cm, ramp(v / 23.6 + 0.5, [(0, lit(cuff, 0.3)), (0.5, cuff), (1, lit(cuff, -0.4))]))
        cv.tint(cm & (np.mod(u, 2.6) < 0.8), lit(cuff, -0.4), 0.5)
    for k in range(4):                                                                  # 잘린 끝으로 보이는 손끝
        if cut[k]:
            fu, fv, ln, r = fl[k]
            tip = capsule(u, v, fu + ln * 0.55, fv, fu + ln * 0.55 + 5, fv, r - 0.6)
            cv.paint(tip, ramp(v / 34 + 0.5, [(0, 0xf6d2b0), (0.6, 0xe9b890), (1, 0xb9875a)]))
    return mask


@icon('gloves_fleece', ids=['inv_gloves'], label='기모 장갑')
def gloves_fleece(cv):
    _glove(cv, 30, 118, -70, 0x5a6470, 0x2b2f35, seed=4, cut=(1, 1, 1, 0))
    _glove(cv, 74, 122, -58, 0x66707c, 0x2b2f35, seed=5, cut=(1, 1, 1, 0))


@icon('gloves_rubber', ids=['inv_gloves_rubber'], label='해루질 고무장갑')
def gloves_rubber(cv):
    X, Y = cv.X, cv.Y
    for (ox, oy, deg, seed) in ((36, 96, -76, 6), (78, 100, -64, 7)):
        u, v = cv.frame(ox, oy, deg)
        m = _glove(cv, ox, oy, deg, 0xe8502a, 0xc93a1c, long_cuff=24, seed=seed)
        cv.tint(m & (np.abs(v + 5) < 1.2) & (u > 12) & (u < 34), 0xffb090, 0.7)              # 고무 광택


@icon('gloves_work', ids=['inv_gloves_work'], px=['px:it_gloves'], label='목장갑')
def gloves_work(cv):
    _glove(cv, 30, 118, -70, 0xf4f1e6, 0xf2c230, seed=8)                              # 손등(흰 면)
    _glove(cv, 74, 122, -58, 0xf8f5ea, 0xf2c230, palm=0xc9302a, seed=9)                # 손바닥(붉은 코팅)


@icon('watch', ids=['inv_watch'], label='조과 기록 시계')
def watch(cv):
    X, Y = cv.X, cv.Y
    strap = 0x2b2f35
    for (y0, y1) in ((8, 46), (82, 120)):
        s = box(X, Y, 48, y0, 80, y1, 5)
        cv.paint(s, ramp((X - 48) / 32, cyl(strap, hl=0.28, gloss=0.3)))
        cv.tint(s & (np.mod(Y, 5.0) < 1.0), 0x0c0e10, 0.5)
    for yy in (96, 103, 110):
        cv.paint(ell(X, Y, 64, yy, 2.2, 1.6) <= 1, 0x0c0e10)
    cv.paint(box(X, Y, 44, 14, 84, 22, 2), ramp((X - 44) / 40, cyl(0x8b949d, hl=0.28)))       # 버클
    case = rrect(X, Y, 64, 64, 30, 28, 9)
    cv.paint(case, ramp((X - 34) / 60 * 0.6 + (Y - 36) / 56 * 0.4, [(0, 0x8b949d), (0.2, 0x59636d), (0.5, 0x33383e), (1, 0x15181c)]))
    cv.paint(rrect(X, Y, 64, 64, 25, 23, 6), 0x1b1e23)
    lcd = rrect(X, Y, 64, 63, 21, 18, 3)
    cv.paint(lcd, ramp((Y - 45) / 36, [(0, 0xb8d0b0), (1, 0x8fb088)]))
    # 화면 — 물고기 눈금 + 숫자 덩어리
    fish_mark(cv, lcd, 53, 54, 5.5, 0x1f3a2a)
    for k in range(3):
        cv.paint(lcd & box(X, Y, 64 + k * 6, 51, 68 + k * 6, 57, 0.5), 0x1f3a2a)
    for k in range(4):
        cv.paint(lcd & box(X, Y, 47 + k * 8.6, 63, 53 + k * 8.6, 74, 0.8), 0x1f3a2a)
        cv.paint(lcd & box(X, Y, 48.6 + k * 8.6, 65, 51.4 + k * 8.6, 68, 0.3), 0xa0c098)
    cv.paint(lcd & box(X, Y, 46, 77, 82, 78.5), 0x1f3a2a)
    for (bx, by) in ((33, 54), (33, 74), (95, 54), (95, 74)):                                # 단추
        cv.paint(box(X, Y, bx - 2.5, by - 4, bx + 2.5, by + 4, 1.2), 0xf07a1a if bx > 64 and by < 60 else 0x8b949d)
    cv.tint(case & (np.abs((X - 64) + (Y - 64) + 30) < 1.6), 0xffffff, 0.35)


@icon('pants', ids=['inv_pants'], label='방수 바지')
def pants(cv):
    X, Y = cv.X, cv.Y
    base = 0x23324f
    legs = poly(cv, [(34, 14), (94, 14), (100, 114), (72, 114), (64, 52), (56, 114), (28, 114)])
    _cloth(cv, legs, base, np.clip((X - 28) / 72, 0, 1), seed=10, weave=False)
    cv.tint(legs & (np.abs(X - 64) < 0.8) & (Y < 52), lit(base, -0.55), 0.9)                # 앞섶
    waist = box(X, Y, 33, 12, 95, 23, 2)
    cv.paint(waist, ramp((Y - 12) / 11, [(0, lit(base, 0.35)), (0.5, lit(base, 0.1)), (1, lit(base, -0.3))]))
    cv.tint(waist & (np.mod(X, 3.0) < 0.9), lit(base, -0.4), 0.5)                            # 고무줄 주름
    cv.paint(polyline(X, Y, [(58, 22), (56, 34), (60, 38)], 1.0), 0xf4f1e6)                  # 조임 끈
    cv.paint(polyline(X, Y, [(70, 22), (72, 34), (68, 38)], 1.0), 0xf4f1e6)
    for sx in (-1, 1):
        knee = (ell(X, Y, 64 + sx * 19 + sx * (Y - 70) * 0.05, 72, 12, 14) <= 1) & legs      # 무릎 덧댐
        cv.tint(knee, lit(base, -0.3), 0.55)
        refl = legs & (Y > 98) & (Y < 103) & ((X - 64) * sx > 6)
        cv.paint(refl, 0xdfe5ea)
        cv.tint(refl & (np.mod(X + Y, 4.0) < 1.6), 0x8b949d, 0.8)
        cv.tint(legs & (Y > 109) & ((X - 64) * sx > 0), lit(base, -0.45), 0.7)
    cv.tint(legs & (np.abs(X - 40 - (Y - 14) * -0.06) < 3.0) & (Y > 26), lit(base, 0.35), 0.35)   # 방수 원단 광택


def _shoe(cv, base, sole, toe=None, laces=True, spikes=False, tall=0.0, band=None, seed=1):
    """옆에서 본 신발(코가 왼쪽)"""
    X, Y = cv.X, cv.Y
    top = 58 - tall
    upper = poly(cv, [(18, 92), (20, 78), (40, 68), (62, 58), (66, top), (98, top), (104, 60), (106, 92)])
    upper |= ell(X, Y, 30, 84, 14, 10) <= 1
    _cloth(cv, upper, base, np.clip((Y - top) / (92 - top) * 0.7 + (X - 18) / 88 * 0.3, 0, 1), seed=seed, weave=False)
    if toe is not None:
        tm = upper & (X < 40 + (Y - 70) * 0.5)
        cv.paint(tm, ramp((Y - 68) / 24, [(0, lit(toe, 0.35)), (0.4, toe), (1, lit(toe, -0.4))]))
    if band is not None:
        cv.paint(upper & (Y < top + 7) & (X > 64), ramp((Y - top) / 7, [(0, lit(band, 0.3)), (1, lit(band, -0.3))]))
    if laces:
        for k in range(4):
            x = 48 + k * 7.5
            y = 66 - k * 3.2
            cv.paint(capsule(X, Y, x - 3, y + 4, x + 5, y - 2, 1.2), 0xf4f1e6)
            cv.paint(disc(X, Y, x - 3, y + 4, 1.4), 0x8b949d)
    sm = box(X, Y, 14, 90, 108, 102, 5)
    cv.paint(sm, ramp((Y - 90) / 12, [(0, lit(sole, 0.3)), (0.35, sole), (1, lit(sole, -0.45))]))
    cv.tint(sm & (np.mod(X, 6.0) < 1.2) & (Y > 96), lit(sole, -0.6), 0.7)
    if spikes:
        for k in range(9):
            cv.paint(poly(cv, [(20 + k * 10, 101), (24 + k * 10, 101), (22 + k * 10, 106)]), 0xc3ccd4)
    cv.tint(upper & (np.abs(Y - 89) < 0.8), lit(base, -0.6), 0.8)
    return upper


@icon('shoes', ids=['inv_shoes'], label='갯바위 단화')
def shoes(cv):
    _shoe(cv, 0x4a5058, 0x8a8170, toe=0x2b2f35, spikes=True, band=0xc9302a, seed=11)


@icon('boots_wading', ids=['inv_boots_wading'], px=['px:it_boots'], label='해루질 장화')
def boots_wading(cv):
    X, Y = cv.X, cv.Y
    base = 0x2f7a4a
    shaft = box(X, Y, 62, 10, 100, 80, 6)
    foot = poly(cv, [(20, 102), (22, 86), (44, 76), (62, 70), (100, 70), (104, 102)]) | (ell(X, Y, 32, 92, 15, 11) <= 1)
    m = shaft | foot
    cv.paint(m, ramp(np.clip((X - 20) / 84, 0, 1), cyl(base, hl=0.62, gloss=0.5, dark=0.5)))
    cv.tint(m & (np.abs(X - 71) < 2.0) & (Y > 14) & (Y < 66), lit(base, 0.5), 0.6)             # 고무 광택
    cv.paint(box(X, Y, 60, 8, 102, 18, 4), ramp((Y - 8) / 10, [(0, lit(base, 0.4)), (0.5, lit(base, 0.1)), (1, lit(base, -0.3))]))
    cv.tint(foot & (np.abs(Y - 80 + (X - 62) * 0.1) < 0.8) & (X > 44), lit(base, -0.5), 0.8)
    sole = box(X, Y, 16, 100, 108, 112, 5)
    cv.paint(sole, ramp((Y - 100) / 12, [(0, 0xf6e08a), (0.4, 0xe9c85a), (1, 0x8a6a1e)]))
    cv.tint(sole & (np.mod(X, 7.0) < 1.4) & (Y > 106), 0x5e430f, 0.7)
    cv.paint(box(X, Y, 72, 30, 90, 40, 2), 0xf2c230)                                           # 상표
    cv.paint(ring(X, Y, 98, 14, 4, 5, 1.3), lit(base, -0.4))                                    # 당김 고리


def _pack(cv, base, *, accent=None, w=64, top=22, bottom=112, lid=True, pocket=True, side=True, straps=True,
          buckle=0x2b2f35, seed=1, roll=False, mesh=False, emblem=None):
    """앞에서 본 배낭"""
    X, Y = cv.X, cv.Y
    accent = accent if accent is not None else lit(base, -0.3)
    cx = 64.0
    if straps:
        for sx in (-1, 1):
            st = polyline(X, Y, [(cx + sx * (w / 2 - 6), top + 8), (cx + sx * (w / 2 + 7), top + 34), (cx + sx * (w / 2 + 3), bottom - 10)], 3.0)
            cv.paint(st, ramp((X - (cx + sx * (w / 2 + 7) - 3)) / 6, [(0, lit(accent, 0.2)), (1, lit(accent, -0.45))]))
    if side:
        for sx in (-1, 1):
            sp = box(X, Y, cx + sx * (w / 2 - 2) - 8, bottom - 44, cx + sx * (w / 2 - 2) + 8, bottom - 6, 5)
            _cloth(cv, sp, lit(base, -0.18), np.clip((Y - (bottom - 44)) / 38, 0, 1), seed=seed + 3)
    body = rrect(X, Y, cx, (top + bottom) / 2, w / 2, (bottom - top) / 2, 13)
    _cloth(cv, body, base, np.clip((X - (cx - w / 2)) / w, 0, 1), seed=seed)
    cv.tint(body & (Y > bottom - 10), lit(base, -0.45), 0.6)                                   # 바닥 덧댐
    cv.tint(body & (np.abs(Y - (bottom - 10)) < 0.6), lit(base, -0.7), 0.8)
    if pocket:
        pk = rrect(X, Y, cx, bottom - 30, w / 2 - 9, 15, 6)
        cv.paint(pk, ramp((Y - (bottom - 45)) / 30, [(0, lit(base, 0.25)), (0.3, lit(base, 0.08)), (1, lit(base, -0.28))]))
        cv.tint(pk & (np.abs(Y - (bottom - 40)) < 0.9) & (np.abs(X - cx) < w / 2 - 13), 0x15181c, 0.85)   # 지퍼
        cv.tint(pk & (np.abs(Y - (bottom - 40)) < 0.9) & (np.mod(X, 2.4) < 0.9), 0xc3ccd4, 0.6)
        cv.paint(box(X, Y, cx + w / 2 - 17, bottom - 43, cx + w / 2 - 13, bottom - 36, 1), 0xc3ccd4)
        if mesh:
            cv.tint(pk & (Y > bottom - 37) & ((np.mod(X + Y, 4.0) < 0.9) | (np.mod(X - Y, 4.0) < 0.9)), lit(base, -0.6), 0.6)
    if lid:
        lm = rrect(X, Y, cx, top + 17, w / 2 + 1.5, 19, 13) & (Y < top + 34)
        cv.paint(lm, ramp((Y - (top - 2)) / 36, [(0, lit(accent, 0.4)), (0.3, lit(accent, 0.15)), (0.7, accent), (1, lit(accent, -0.35))]))
        cv.tint(lm & (Y > top + 32), lit(accent, -0.6), 0.8)
        for sx in (-1, 1):                                                                 # 뚜껑 끈 + 버클
            bx = cx + sx * (w / 2 - 20)
            cv.paint(box(X, Y, bx - 2.5, top + 24, bx + 2.5, top + 50, 1), lit(accent, -0.5))
            cv.paint(box(X, Y, bx - 4.5, top + 38, bx + 4.5, top + 46, 1.5), ramp((Y - (top + 38)) / 8, [(0, lit(buckle, 0.5)), (1, buckle)]))
    if roll:
        rm = box(X, Y, cx - w / 2 - 3, top - 4, cx + w / 2 + 3, top + 10, 6)
        cv.paint(rm, ramp((Y - (top - 4)) / 14, cyl(accent, hl=0.3, gloss=0.5)))
        cv.tint(rm & (np.mod(Y, 4.6) < 0.8), lit(accent, -0.5), 0.6)
        cv.paint(box(X, Y, cx - 6, top - 2, cx + 6, top + 8, 2), ramp((Y - top) / 8, [(0, lit(buckle, 0.5)), (1, buckle)]))
    cv.paint(ring(X, Y, cx, top - 1, 9, 7, 2.4) & (Y < top + 1), lit(accent, -0.4))             # 손잡이 고리
    if emblem is not None:
        emblem(cv, body)
    return body


@icon('backpack', px=['px:it_backpack'], label='배낭')
def backpack(cv):
    _pack(cv, 0x4a6a8a, accent=0x2f4a66, seed=20)


@icon('backpack_rough', ids=['craft_backpack_rough'], label='간이 백팩')
def backpack_rough(cv):
    X, Y = cv.X, cv.Y
    # 삼베 자루에 새끼줄 멜빵
    for sx in (-1, 1):
        cv.paint(polyline(X, Y, [(64 + sx * 18, 26), (64 + sx * 36, 56), (64 + sx * 28, 104)], 2.4), 0xc9a86a)
    body = rrect(X, Y, 64, 70, 30, 42, 14)
    _cloth(cv, body, 0xb9955a, np.clip((X - 34) / 60, 0, 1), seed=21)
    cv.tint(body & ((np.mod(X, 3.0) < 0.7) | (np.mod(Y, 3.0) < 0.7)), 0x8a6a34, 0.3)              # 굵은 올
    neck = box(X, Y, 48, 20, 80, 34, 5)
    _cloth(cv, neck, 0xb9955a, np.clip((X - 48) / 32, 0, 1), seed=22)
    cv.paint(box(X, Y, 46, 30, 82, 35, 2), ramp((Y - 30) / 5, [(0, 0xe9cf9a), (1, 0x8a6a3a)]))     # 묶은 줄
    cv.tint(box(X, Y, 46, 30, 82, 35, 2) & (np.mod(X, 3.0) < 0.9), 0x6b4d22, 0.6)
    patch = box(X, Y, 50, 70, 78, 94, 2) & body
    cv.paint(patch, 0x8a6a44)
    _stitch(cv, body, [(51.5, 71.5), (76.5, 71.5), (76.5, 92.5), (51.5, 92.5), (51.5, 71.5)], 0xf4f1e6)


@icon('tackle_pouch', ids=['qr_tackle_pouch'], label='옛 계원의 채비 주머니')
def tackle_pouch(cv):
    X, Y = cv.X, cv.Y
    base = 0x8a5a2a
    body = rrect(X, Y, 64, 76, 38, 30, 10)
    cv.paint(body, ramp(np.clip((X - 26) / 76 * 0.5 + (Y - 46) / 60 * 0.5, 0, 1), [(0, lit(base, 0.35)), (0.3, lit(base, 0.1)), (0.6, base), (1, lit(base, -0.45))]))
    n = noise(cv.a.shape, 23, 2)
    cv.tint(body & (n > 0.68), lit(base, -0.3), 0.4)                                             # 가죽 얼룩
    flap = (rrect(X, Y, 64, 58, 39.5, 24, 12) & (Y > 40)) & ((Y < 66) | (ell(X, Y, 64, 66, 39.5, 14) <= 1))
    cv.paint(flap, ramp(np.clip((Y - 40) / 40, 0, 1), [(0, lit(base, 0.45)), (0.4, lit(base, 0.15)), (1, lit(base, -0.2))]))
    cv.tint(flap & ~((rrect(X, Y, 64, 57, 37, 22, 11) & (Y < 65)) | (ell(X, Y, 64, 65, 37, 12.5) <= 1)) & (np.mod(X + Y, 3.0) < 1.6), 0xf4e6c8, 0.8)   # 바느질
    cv.paint(box(X, Y, 58, 68, 70, 86, 2), ramp((Y - 68) / 18, [(0, lit(base, -0.2)), (1, lit(base, -0.55))]))     # 여밈 끈
    cv.paint(box(X, Y, 56, 72, 72, 80, 2), ramp((Y - 72) / 8, [(0, 0xf6e08a), (0.5, 0xc9a23a), (1, 0x7a5a1a)]))    # 놋 버클
    cv.paint(box(X, Y, 59.5, 74.5, 68.5, 77.5, 1), lit(base, -0.5))
    for sx in (-1, 1):                                                                         # 허리띠 고리
        cv.paint(box(X, Y, 64 + sx * 24 - 4, 34, 64 + sx * 24 + 4, 46, 2), lit(base, -0.3))


@icon('bag_field', ids=['qr_bag_field'], label='촬영 스태프 필드백')
def bag_field(cv):
    X, Y = cv.X, cv.Y
    base = 0x2b2f35
    cv.paint(ring(X, Y, 64, 54, 46, 44, 3.4) & (Y < 54), ramp((X - 18) / 92, [(0, 0x4a5058), (0.5, 0x33383e), (1, 0x15181c)]))   # 어깨끈
    body = rrect(X, Y, 64, 82, 44, 28, 8)
    _cloth(cv, body, base, np.clip((X - 20) / 88, 0, 1), seed=24)
    flap = rrect(X, Y, 64, 70, 45.5, 18, 8) & (Y > 52)
    cv.paint(flap, ramp((Y - 52) / 36, [(0, lit(base, 0.4)), (0.3, lit(base, 0.18)), (1, lit(base, -0.1))]))
    cv.tint(flap & (Y > 86), 0x0c0e10, 0.8)
    for sx in (-1, 1):
        cv.paint(box(X, Y, 64 + sx * 24 - 4, 74, 64 + sx * 24 + 4, 98, 1.5), 0x4a5058)
        cv.paint(box(X, Y, 64 + sx * 24 - 5.5, 84, 64 + sx * 24 + 5.5, 92, 1.5), ramp((Y - 84) / 8, [(0, 0xdfe5ea), (1, 0x59636d)]))
    tag = box(X, Y, 52, 58, 76, 68, 1.5)                                                       # 스태프 명찰
    cv.paint(tag, 0xf2c230)
    text_bars(cv, tag, 55, 73, [61.5, 64.8], 0x2b2f35, seed=5, h=0.7)
    cv.paint(disc(X, Y, 30, 62, 3.2), 0xc9302a)                                                  # 녹화 표시


@icon('bag_expedition', ids=['qr_bag_expedition'], colors=44, label='어촌계 원정 가방')
def bag_expedition(cv):
    def emb(cv, body):
        X, Y = cv.X, cv.Y
        p = box(X, Y, 52, 58, 76, 70, 2) & body
        cv.paint(p, 0xf4f1e6)
        cv.paint(p & (np.abs(Y - (64 + 1.6 * np.sin(X * 0.6))) < 1.0), 0x1f5f86)
    _pack(cv, 0x23447a, accent=0xf07a1a, w=70, top=18, seed=25, emblem=emb)


@icon('bag_guide', ids=['qr_bag_guide'], colors=44, label='가이드 가방')
def bag_guide(cv):
    def emb(cv, body):
        X, Y = cv.X, cv.Y
        cv.paint(disc(X, Y, 64, 62, 8.5) & body, 0xf4f6f7)
        cv.paint((box(X, Y, 61.6, 56, 66.4, 68) | box(X, Y, 58, 59.6, 70, 64.4)) & body, 0xc9302a)
    _pack(cv, 0xc9302a, accent=0x8a1f1a, w=62, seed=26, emblem=emb, mesh=True)


@icon('bag_voyage', ids=['qr_bag_voyage'], colors=44, label='원거리 항해 가방')
def bag_voyage(cv):
    X, Y = cv.X, cv.Y
    body = _pack(cv, 0xf2c230, accent=0x2b2f35, w=72, top=26, lid=False, pocket=False, roll=True, seed=27)
    cv.tint(body & (np.abs(X - 44) < 2.4) & (Y > 40), 0xfff3a8, 0.6)                              # 방수 원단 광택
    for yy in (58, 84):                                                                        # 조임 띠
        b = body & (np.abs(Y - yy) < 3.0)
        cv.paint(b, ramp((X - 28) / 72, cyl(0x2b2f35, hl=0.3, gloss=0.3)))
        cv.paint(box(X, Y, 58, yy - 4.5, 70, yy + 4.5, 1.5), ramp((Y - yy + 4.5) / 9, [(0, 0xdfe5ea), (1, 0x59636d)]))


@icon('bag_mountain', ids=['inv_bag_mountain'], colors=44, label='바람의 마운틴 백팩')
def bag_mountain(cv):
    X, Y = cv.X, cv.Y
    body = _pack(cv, 0x2f7a4a, accent=0x1f5a36, w=60, top=14, bottom=116, seed=28)
    for sx in (-1, 1):                                                                         # 옆 조임 끈
        cv.paint(polyline(X, Y, [(64 + sx * 29, 60), (64 + sx * 12, 66), (64 + sx * 29, 72)], 1.0), 0xf2c230)
    cv.paint(polyline(X, Y, [(46, 58), (52, 52), (58, 58), (64, 52), (70, 58), (76, 52), (82, 58)], 0.9), 0xf2c230)   # 지그재그 번지 끈
    roll = box(X, Y, 30, 110, 98, 121, 5.5)                                                     # 아래 매단 매트
    cv.paint(roll, ramp((Y - 110) / 11, cyl(0x8a8170, hl=0.3, gloss=0.3)))
    cv.tint(roll & (np.abs(X - 44) < 1.6) | roll & (np.abs(X - 84) < 1.6), 0x2b2f35, 0.9)


@icon('tackle_vest', ids=['inv_bag_tackle_vest'], colors=44, label='씨바스터즈 태클 베스트')
def tackle_vest(cv):
    X, Y = cv.X, cv.Y
    base = 0x33383e
    body = poly(cv, [(36, 20), (52, 14), (64, 34), (76, 14), (92, 20), (100, 46), (96, 108), (32, 108), (28, 46)])
    body &= ~(ell(X, Y, 27, 40, 10, 20) <= 1) & ~(ell(X, Y, 101, 40, 10, 20) <= 1)
    _cloth(cv, body, base, np.clip((X - 28) / 72, 0, 1), seed=29)
    cv.paint(body & poly(cv, [(52, 14), (64, 34), (76, 14), (71, 14), (64, 27), (57, 14)]), 0x15181c)
    cv.tint(body & (np.abs(X - 64) < 1.2) & (Y > 34), 0xc9302a, 0.95)                             # 붉은 지퍼
    for sx in (-1, 1):
        px = 64 + sx * 19
        for (py, ph, col) in ((40, 22, 0x4a5058), (70, 30, 0x40464d)):                          # 큰 수납 주머니
            pk = box(X, Y, px - 13, py, px + 13, py + ph, 3)
            cv.paint(pk, ramp((Y - py) / ph, [(0, lit(col, 0.35)), (0.2, lit(col, 0.1)), (1, lit(col, -0.4))]))
            cv.paint(box(X, Y, px - 13.5, py - 1, px + 13.5, py + 7, 2), ramp((Y - py) / 7, [(0, lit(col, 0.45)), (1, lit(col, 0.1))]))
            cv.paint(box(X, Y, px - 3, py + 4, px + 3, py + 9, 1), 0xc9302a)                        # 붉은 당김 끈
        cv.paint(ring(X, Y, 64 + sx * 30, 60, 3.2, 3.2, 1.1), 0xc3ccd4)
    cv.paint(body & box(X, Y, 28, 102, 100, 106), 0xc9302a)
    cv.paint(polyline(X, Y, [(40, 24), (34, 8), (46, 4)], 2.2), 0x1b1e23)                         # 어깨끈
    cv.paint(polyline(X, Y, [(88, 24), (94, 8), (82, 4)], 2.2), 0x1b1e23)


@icon('dry_bag', ids=['inv_bag_dry'], label='채파도의 드라이백')
def dry_bag(cv):
    X, Y = cv.X, cv.Y
    base = 0x1f8fc0
    t = np.clip((Y - 34) / 80, 0, 1)
    hw = 25 + 3 * np.sin(np.pi * t)
    body = (Y >= 34) & (Y <= 114) & (np.abs(X - 64) <= hw)
    body &= ~((Y > 108) & (np.abs(X - 64) > hw - (Y - 108) * 0.9))
    cv.paint(body, ramp((X - (64 - hw)) / (2 * hw), cyl(base, hl=0.28, gloss=0.55)))
    for yy in (56, 78, 98):                                                                    # 눌린 주름
        cv.tint(body & (np.abs(Y - yy - 2.0 * np.sin(X * 0.2)) < 0.6), lit(base, -0.4), 0.5)
    roll = box(X, Y, 34, 20, 94, 37, 7)                                                         # 말아 접은 입구
    cv.paint(roll, ramp((Y - 20) / 17, cyl(lit(base, -0.15), hl=0.3, gloss=0.5)))
    cv.tint(roll & (np.mod(Y, 5.0) < 0.9), lit(base, -0.6), 0.6)
    cv.paint(box(X, Y, 56, 22, 72, 35, 2), ramp((Y - 22) / 13, [(0, 0x59636d), (0.5, 0x2b2f35), (1, 0x0c0e10)]))   # 버클
    cv.paint(box(X, Y, 60, 26, 68, 31, 1), 0x8b949d)
    cv.paint(ring(X, Y, 98, 44, 9, 16, 2.2) & (X > 92), 0x2b2f35)                                 # 옆 고리 끈
    wv = body & (np.abs(Y - (74 + 3.0 * np.sin(X * 0.32))) < 1.6)                                 # 흰 물결 표장
    cv.paint(wv, 0xf4f6f7)
    cv.paint(body & (np.abs(Y - (82 + 3.0 * np.sin(X * 0.32 + 1.2))) < 1.0), 0xbfe8ff)
