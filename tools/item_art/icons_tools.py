# -*- coding: utf-8 -*-
"""칼 · 등 · 해루질 도구 · 낚시 도구"""
import numpy as np
from kit import *


# ─────────────────────────────────────────────
# 칼 — 손잡이(왼쪽 아래) → 칼끝(오른쪽 위)
# ─────────────────────────────────────────────
def _knife(cv, *, origin=(10, 117), deg=-45.0, handle=(0, 42, 5.4, 4.8), wood, grain=0x9a7646, end=0x6f5230,
           ferrule=(42, 50, 4.9), ferrule_stops, ring=None, neck=3.0, blade, steel, shin=0.44, marks=True,
           haze=None, seed=3, rivets=None, wrap=None, hole=False, reflect=((34, 3.0, 0.55), (41.5, 1.0, 0.55))):
    u, v = cv.frame(origin[0], origin[1], deg)
    H0, H1, hw0, hw1 = handle
    hw = hw0 + (hw1 - hw0) * (u - H0) / (H1 - H0)
    hm = (u >= H0) & (u <= H1) & (np.abs(v) <= hw)
    hm &= ~((u < H0 + 1.6) & (np.abs(v) > hw - 1.3))
    cv.paint(hm, ramp((v / hw + 1) / 2, wood))
    g = noise(cv.a.shape, seed, 2)
    cv.tint(hm & (np.sin(v * 4.3 + g * 7.0) > 0.9) & (np.sin(u * 0.55 + g * 5.0) > -0.35), grain, 0.5)
    cv.tint(hm & (u < H0 + 2.4), end, 0.5)
    if rivets:
        for ru in rivets:
            r = np.sqrt((u - ru) ** 2 + v ** 2)
            cv.paint(hm & (r < 1.9), 0x4a5058)
            cv.paint(hm & (r < 1.2), 0xd8dde2)
    if wrap:
        w0, w1 = wrap
        wm = (u > w0) & (u <= w1) & (np.abs(v) <= hw + 0.7)
        cv.paint(wm, ramp((v / (hw + 0.7) + 1) / 2, [(0, 0xf4efe2), (0.3, 0xe6dfcf), (0.7, 0xcfc6b3), (1, 0xa79d89)]))
        cv.tint(wm & (np.mod(u + v * 0.55, 2.4) < 0.5), 0x8f8572, 0.75)
    if hole:
        cv.tint(((u - 4.5) ** 2 + v ** 2) < 1.5 ** 2, 0x2a190c, 0.9)
    F0, F1, fw = ferrule
    fm = (u > F0) & (u <= F1) & (np.abs(v) <= fw)
    tf = (v / fw + 1) / 2
    cv.paint(fm, ramp(tf, ferrule_stops))
    if ring:
        cv.paint((u > F0) & (u <= F0 + 1.2) & (np.abs(v) <= fw), ramp(tf, ring))
    B0, B1, spine_fn, edge_fn = blade
    cv.paint((u > F1) & (u <= B0 + 1.0) & (v >= -neck) & (v <= neck * 0.6),
             ramp((v + neck) / (neck * 1.6), [(0, 0x77818c), (0.4, 0xd3d9de), (1, 0x8b949d)]))
    s = np.clip((u - B0) / (B1 - B0), 0, 1)
    spine, edge = spine_fn(s, u - B0), edge_fn(s, u - B0)
    bm = (u >= B0) & (u <= B1) & (v >= spine) & (v <= edge)
    tb = (v - spine) / np.maximum(edge - spine, 1e-3)
    hira_s, kire_s = steel
    cv.paint(bm, np.where((tb < shin)[..., None], ramp(tb / shin, hira_s), ramp((tb - shin) / (1 - shin), kire_s)))
    if haze:
        hz = noise(cv.a.shape, seed + 7, 2)
        for cond, col, al in haze(hz, tb, u - B0, v):
            cv.tint(bm & cond, col, al)
    for c0, wdt, al in reflect:
        cv.tint(bm & (np.abs((u - B0) - c0 + v * 1.5) < wdt) & (tb > 0.2), 0xffffff, al)
    if marks:
        for du, dv, w, h in [(6.0, -2.2, 0.45, 1.1), (7.6, -2.6, 1.1, 0.4), (7.6, -1.6, 0.4, 0.9), (9.6, -2.2, 0.45, 1.1),
                             (11.0, -2.7, 0.9, 0.4), (11.0, -1.7, 0.9, 0.4)]:
            cv.tint(bm & (np.abs(u - B0 - du) < w) & (np.abs(v - dv) < h), 0x242a31, 0.85)


_STEEL = ([(0.0, 0x4b545f), (0.2, 0x4b545f), (0.21, 0x8a96a2), (0.6, 0x9aa6b1), (0.61, 0xafb9c3), (1.0, 0xb8c2cb)],
          [(0.0, 0xf2f5f7), (0.35, 0xe2e8ec), (0.36, 0xcbd3da), (0.78, 0xc3ccd4), (0.79, 0xffffff), (1.0, 0xffffff)])
_HO_WOOD = [(0.0, 0xf6e7c3), (0.27, 0xf0dcb0), (0.28, 0xdcc48f), (0.66, 0xd4b982), (0.67, 0xb08a54), (1.0, 0x94703f)]
_HORN = [(0.0, 0x4d4640), (0.16, 0x38322e), (0.24, 0xa39a8f), (0.32, 0x2e2826), (0.7, 0x1c1817), (1.0, 0x0f0d0d)]


def _yanagi_blade(B0, B1, top=-3.9, belly=5.3):
    def spine(s, d): return top + 0.5 * s
    def edge(s, d):
        heel = np.clip(d / 2.2, 0, 1)
        k = np.clip((s - 0.74) / 0.26, 0, 1) ** 2.0
        return (1.8 + ((belly - 0.5 * s) - 1.8) * heel) * (1 - k) + (spine(s, d) + 0.05) * k
    return (B0, B1, spine, edge)


@icon('knife_yanagiba', ids=['knife_yanagiba'], label='장인 야나기바')
def knife_yanagiba(cv):
    _knife(cv, wood=_HO_WOOD, ferrule_stops=_HORN, ring=[(0, 0xfbf6ea), (0.6, 0xe4dac6), (1, 0xb5aa94)],
           blade=_yanagi_blade(53, 156), steel=_STEEL,
           haze=lambda hz, tb, d, v: [((tb < 0.44) & (tb > 0.2) & (hz > 0.6), 0x7c8894, 0.5)])


@icon('knife_yanagiba_pro', ids=['knife_yanagiba_pro'], label='야나기바 (장인 단조)')
def knife_yanagiba_pro(cv):
    # 흑단 팔각 손잡이 + 은 고리 + 다마스커스 물결
    ebony = [(0.0, 0x6b5a52), (0.27, 0x57463f), (0.28, 0x3b2d28), (0.66, 0x33261f), (0.67, 0x1f1512), (1.0, 0x120b09)]
    silver = [(0.0, 0x8b949d), (0.2, 0xdfe5ea), (0.3, 0xffffff), (0.45, 0xb9c2ca), (0.8, 0x6e7882), (1.0, 0x4b545f)]
    steel = ([(0.0, 0x3d454f), (0.2, 0x3d454f), (0.21, 0x6f7b87), (0.6, 0x7f8b97), (0.61, 0x8f9aa5), (1.0, 0x99a4ae)], _STEEL[1])
    _knife(cv, wood=ebony, grain=0x0f0908, end=0x0c0706, ferrule=(42, 50, 5.0), ferrule_stops=silver,
           blade=_yanagi_blade(53, 158, top=-4.1, belly=5.6), steel=steel, seed=9,
           haze=lambda hz, tb, d, v: [((tb < 0.44) & (tb > 0.2) & (np.sin(d * 0.55 + hz * 16 + v * 1.4) > 0.35), 0xc3ccd4, 0.6),
                                      ((tb < 0.44) & (tb > 0.2) & (np.sin(d * 0.55 + hz * 16 + v * 1.4) < -0.6), 0x2f363f, 0.5)])
    u, v = cv.frame(10, 117, -45.0)
    cv.paint((u > 3) & (u < 5.2) & (np.abs(v) < 5.2), 0xdfe5ea)          # 손잡이 끝 은 테


@icon('knife_sashimi', ids=['knife_sashimi'], label='회칼 (사시미)')
def knife_sashimi(cv):
    # 흔한 회칼 — 밝은 나무 손잡이 + 검은 수지 고리, 칼몸은 조금 짧고 넓다
    wood = [(0.0, 0xe9c896), (0.27, 0xdfba84), (0.28, 0xc79d66), (0.66, 0xbd935c), (0.67, 0x9a7240), (1.0, 0x7d5a30)]
    plastic = [(0.0, 0x565b62), (0.2, 0x3a3f46), (0.28, 0x8d949c), (0.36, 0x2b2f35), (1.0, 0x121418)]
    _knife(cv, origin=(13, 114), handle=(0, 44, 5.6, 5.0), wood=wood, grain=0x7d5a30, end=0x5e421f,
           ferrule=(44, 51, 5.1), ferrule_stops=plastic, blade=_yanagi_blade(54, 146, top=-4.3, belly=6.6),
           steel=_STEEL, marks=False, seed=5, reflect=((30, 2.6, 0.5), (37, 0.9, 0.5)))


@icon('knife_utility', ids=['knife_utility'], label='범용 막칼')
def knife_utility(cv):
    # 주방 막칼 — 검은 수지 손잡이에 리벳 셋, 배가 부른 칼몸(시노기 없음)
    grip = [(0.0, 0x5a6068), (0.22, 0x3e434a), (0.23, 0x2a2e34), (0.7, 0x22262b), (0.71, 0x14171a), (1.0, 0x0b0d0f)]
    def spine(s, d): return -5.6 + 8.5 * np.clip((s - 0.55) / 0.45, 0, 1) ** 1.8
    def edge(s, d): return (2.5 + 8.0 * np.clip(d / 2.0, 0, 1)) - 7.4 * s ** 2.6
    plain = ([(0.0, 0x69737d), (0.1, 0x69737d), (0.11, 0xb4bec7), (1.0, 0xc6ced6)],
             [(0.0, 0xc6ced6), (0.5, 0xd6dde3), (0.86, 0xdfe5ea), (0.87, 0xffffff), (1.0, 0xffffff)])
    _knife(cv, origin=(15, 111), deg=-42.0, handle=(0, 44, 6.4, 5.8), wood=grip, grain=0x0b0d0f, end=0x0b0d0f,
           ferrule=(44, 49, 6.0), ferrule_stops=[(0, 0x8b949d), (0.3, 0xe8edf0), (0.5, 0xb9c2ca), (1, 0x5c666f)],
           neck=4.5, blade=(51, 132, spine, edge), steel=plain, shin=0.62, marks=False, rivets=(10, 22, 34),
           reflect=((20, 2.8, 0.5), (27, 0.9, 0.5)))


@icon('knife_okseon', ids=['qr_knife_okseon'], label='정옥선의 손질 칼')
def knife_okseon(cv):
    # 오래 쓴 데바 — 넓고 짧은 칼몸 · 손때 묻은 손잡이 · 무명천 감은 자리
    wood = [(0.0, 0xb98d5c), (0.25, 0xaa7d4e), (0.26, 0x95683d), (0.66, 0x8a5e36), (0.67, 0x6b4526), (1.0, 0x55351c)]
    def spine(s, d): return -6.2 + 12.0 * np.clip((s - 0.45) / 0.55, 0, 1) ** 1.7
    def edge(s, d): return (3.0 + 12.0 * np.clip(d / 2.0, 0, 1)) - 9.4 * s ** 2.4
    old = ([(0.0, 0x3b4148), (0.12, 0x3b4148), (0.13, 0x6f7780), (0.5, 0x7f8790), (0.51, 0x8f979f), (1.0, 0x99a1a8)],
           [(0.0, 0xdfe4e8), (0.4, 0xcfd6dc), (0.41, 0xb5bec6), (0.8, 0xadb6be), (0.81, 0xf8fafb), (1.0, 0xffffff)])
    _knife(cv, origin=(14, 112), deg=-40.0, handle=(0, 46, 6.4, 5.6), wood=wood, grain=0x4d2f18, end=0x3c2412,
           ferrule=(46, 54, 5.9), ferrule_stops=[(0.0, 0x565b62), (0.2, 0x3a3f46), (0.28, 0x8d949c), (0.36, 0x2b2f35), (1.0, 0x121418)],
           neck=4.0, blade=(54, 126, spine, edge), steel=old, shin=0.58, marks=False, seed=11, wrap=(36.5, 46), hole=True,
           haze=lambda hz, tb, d, v: [((tb < 0.58) & (hz > 0.62), 0x5a5f63, 0.6), ((tb < 0.58) & (hz < 0.3), 0x8a8472, 0.35)],
           reflect=((18, 2.4, 0.45), (24, 0.8, 0.45)))
    u, v = cv.frame(14, 112, -40.0)
    cv.tint((u > 14) & (u < 34) & (np.abs(v) < 3.2), 0xc9a274, 0.35)      # 손때 — 가운데가 닳아 밝다


# ─────────────────────────────────────────────
# 등
# ─────────────────────────────────────────────
def _headlamp(cv, strap, body=0x2f343a, button=0xf07a1a, led=0x6dff8a, stripe=True):
    X, Y = cv.X, cv.Y
    cx = 64.0; RX, RY = 55.0, 21.0; yT, yB = 50.0, 70.0
    eT, eB = ell(X, Y, cx, yT, RX, RY), ell(X, Y, cx, yB, RX, RY)
    eTi, eBi = ell(X, Y, cx, yT, RX - 4.2, RY - 3.4), ell(X, Y, cx, yB, RX - 4.2, RY - 3.4)
    sil = (eT <= 1) | (eB <= 1) | ((np.abs(X - cx) <= RX) & (Y >= yT) & (Y <= yB))
    inner = (eTi <= 1) & (eBi > 1)
    rim = (eT <= 1) & (eTi > 1)
    front = sil & ~(eT <= 1)
    c_hi, c_mid, c_lo, c_dk = lit(strap, 0.25), strap, lit(strap, -0.3), lit(strap, -0.6)
    side = np.abs(X - cx) / RX
    cv.paint(inner, ramp(side, [(0, lit(strap, -0.5)), (1, lit(strap, -0.72))]))
    cv.tint(inner & (np.mod(X, 3.0) < 0.9), lit(strap, -0.85), 0.5)
    ytop = yT + RY * np.sqrt(np.clip(1 - ((X - cx) / RX) ** 2, 0, 1))
    tv = (Y - ytop) / (yB - yT)
    cv.paint(front, ramp(side, [(0, c_hi), (0.45, c_mid), (0.8, c_lo), (1, c_dk)]))
    cv.tint(front & (np.mod(X, 2.6) < 0.7), c_dk, 0.28)
    if stripe:
        st = front & (np.abs(tv - 0.5) < 0.17)
        cv.paint(st, ramp(side, [(0, 0xf4f6f7), (0.5, 0xc9d0d5), (1, 0x7d868d)]))
        cv.tint(st & (np.mod(X + (Y - ytop) * 0.9, 6.0) < 2.6), 0x4a525a, 0.85)
    cv.tint(front & (tv > 0.86), c_dk, 0.55)
    cv.paint(rim, ramp(side, [(0, lit(strap, 0.5)), (0.6, c_hi), (1, c_lo)]))
    bk = rrect(X, Y, 107.5, 66, 3.6, 8.5, 1.2) & front
    cv.paint(bk, ramp((Y - 57) / 18, [(0, 0x5b626a), (0.4, 0x2c3036), (1, 0x16181c)]))
    cv.tint(rrect(X, Y, 107.5, 62.6, 1.9, 2.2, 0.5) & front, c_lo, 1.0)
    cv.tint(rrect(X, Y, 107.5, 69.4, 1.9, 2.2, 0.5) & front, c_lo, 1.0)
    lx, ly = 64.0, 84.0
    cv.paint(rrect(X, Y, lx, ly - 1, 26.0, 16.0, 4.0), ramp((Y - (ly - 17)) / 32, [(0, lit(body, 0.2)), (0.3, body), (1, lit(body, -0.6))]))
    bm = rrect(X, Y, lx, ly + 2, 22.0, 17.0, 6.0)
    cv.paint(bm, ramp((Y - (ly - 15)) / 34, [(0, lit(body, 0.4)), (0.1, lit(body, 0.2)), (0.14, body), (0.8, lit(body, -0.3)), (1, lit(body, -0.7))]))
    cv.tint(bm & (np.abs(X - lx) > 18.5), 0x0f1114, 0.45)
    for sx in (-19.5, 19.5):
        for k in range(4):
            cv.tint(bm & (np.abs(X - (lx + sx)) < 1.6) & (np.abs(Y - (ly - 6 + k * 4.2)) < 0.8), 0x8a929a, 0.7)
    r = np.sqrt((X - lx) ** 2 + (Y - (ly + 3)) ** 2)
    ang = np.arctan2(Y - (ly + 3), X - lx)
    cv.paint(r <= 13.6, ramp((np.cos(ang + 2.2) + 1) / 2, [(0, 0x3a4047), (0.5, 0x9aa3ab), (0.8, 0xe8edf0), (1, 0xffffff)]))
    cv.paint(r <= 11.2, 0x15181c)
    cv.paint(r <= 10.4, ramp(r / 10.4, [(0, 0xffffff), (0.3, 0xffffff), (0.32, 0xfff3a8), (0.46, 0xffe27a), (0.48, 0xe4e9ec),
                                         (0.74, 0xc2cad1), (0.76, 0x8e98a1), (1, 0x66707a)]))
    cv.tint((r <= 10.4) & (r > 5.6) & (np.mod(ang, np.pi / 6) < 0.09), 0x4d565e, 0.6)
    cv.tint((r <= 9.6) & (r > 7.6) & (ang > -2.75) & (ang < -1.75), 0xffffff, 0.9)
    cv.tint((r <= 9.6) & (r > 8.4) & (ang > 0.5) & (ang < 1.2), 0xffffff, 0.6)
    cv.paint(rrect(X, Y, lx + 9, ly - 16.2, 5.0, 2.2, 1.6), ramp((Y - (ly - 18.4)) / 4.4, [(0, lit(button, 0.35)), (0.5, button), (1, lit(button, -0.4))]))
    cv.paint(disc(X, Y, lx - 12, ly - 11.5, 1.5), led)


@icon('headlamp', ids=['inv_headlamp'], colors=44, label='헤드랜턴 (800lm)')
def headlamp(cv):
    _headlamp(cv, strap=0x3f6fb5, button=0x4aa3ff)


@icon('headlamp_trainee', ids=['qr_headlamp_trainee'], colors=44, label='어촌계 실습생 헤드랜턴')
def headlamp_trainee(cv):
    _headlamp(cv, strap=0xf07a1a)


@icon('lantern_keeper', ids=['qr_headlamp_keeper'], colors=48, label='등대지기의 랜턴')
def lantern_keeper(cv):
    X, Y = cv.X, cv.Y
    cx = 64.0

    def brass(t):
        return ramp(t, [(0, 0x6b4a14), (0.12, 0x9a7220), (0.26, 0xf6dc7a), (0.34, 0xffefad), (0.42, 0xd9ae3c),
                        (0.7, 0xb0832a), (0.9, 0x7a5718), (1, 0x4d360e)])
    bail = (ell(X, Y, cx, 40, 30, 33) <= 1) & (ell(X, Y, cx, 40, 27.2, 30.2) > 1) & (Y < 41)
    cv.paint(bail, ramp((X - 34) / 60, [(0, 0x7a5718), (0.3, 0xe9c85a), (0.5, 0xb0832a), (1, 0x5e430f)]))
    for sx in (-28.6, 28.6):
        cv.paint(disc(X, Y, cx + sx, 41, 2.6), 0x8a6a1e)
    gy0, gy1 = 44.0, 88.0
    tg = (Y - gy0) / (gy1 - gy0)
    ghw = 19.0 + 6.5 * np.maximum(np.sin(np.pi * np.clip(tg, 0, 1)), 0) ** 0.8
    glass = (Y >= gy0) & (Y <= gy1) & (np.abs(X - cx) <= ghw)
    rr = np.sqrt(((X - cx) / 22.0) ** 2 + ((Y - 68) / 24.0) ** 2)
    cv.paint(glass, ramp(rr, [(0, 0xffffff), (0.18, 0xfffbd8), (0.2, 0xfff0a0), (0.48, 0xffd95a), (0.5, 0xf7b93a), (0.78, 0xe7952a),
                              (0.8, 0xc7772a), (1.0, 0x9a5a2a), (1.3, 0x6c4a3a)]))
    cv.paint((ell(X, Y, cx, 68, 3.2, 7.0) <= 1) & glass, 0xffffff)
    cv.paint((ell(X, Y, cx, 78, 4.2, 2.0) <= 1) & glass, 0x5e430f)
    xs = (X - cx) / ghw
    cv.tint(glass & (xs > -0.80) & (xs < -0.62) & (tg > 0.12) & (tg < 0.8), 0xffffff, 0.8)
    cv.tint(glass & (xs > -0.52) & (xs < -0.46) & (tg > 0.2) & (tg < 0.55), 0xffffff, 0.6)
    cv.tint(glass & (np.abs(xs) > 0.93), 0x5a4a3a, 0.6)
    for fx in (-0.62, -0.2, 0.25, 0.66):
        cv.paint(glass & (np.abs(xs - fx) < 0.045), ramp(tg, [(0, 0x8a6a1e), (0.5, 0x5e430f), (1, 0x8a6a1e)]))
    for ty in (0.3, 0.72):
        cv.paint(glass & (np.abs(tg - (ty + 0.05 * (1 - xs ** 2))) < 0.03), brass((xs + 1) / 2))
    cap = (Y >= 37) & (Y <= 45) & (np.abs(X - cx) <= 21.5 - (45 - Y) * 0.55)
    cv.paint(cap, brass((X - (cx - 21.5)) / 43))
    cv.tint(cap & (Y > 43.3), 0x4d360e, 0.6)
    cv.paint((Y >= 27) & (Y < 37) & (np.abs(X - cx) <= 11.5), brass((X - (cx - 11.5)) / 23))
    for vy in (30.0, 33.2):
        for vx in (-6.5, -1.5, 3.5, 8.0):
            cv.paint(rrect(X, Y, cx + vx, vy, 1.5, 0.9, 0.5), 0x2d1f08)
    cv.paint((ell(X, Y, cx, 27.5, 13.5, 5.5) <= 1) & (Y <= 27.5), brass((X - (cx - 13.5)) / 27))
    cv.paint(ell(X, Y, cx, 21.0, 2.6, 2.2) <= 1, 0xd9ae3c)
    collar = (Y > 88) & (Y <= 93.5) & (np.abs(X - cx) <= 22.5)
    cv.paint(collar, brass((X - (cx - 22.5)) / 45))
    cv.tint(collar & (Y > 92.2), 0x4d360e, 0.6)
    ty2 = (Y - 93.5) / 21.5
    thw = 27.0 + 4.5 * np.sin(np.pi * np.clip(ty2, 0, 1) * 0.9)
    tank = (Y > 93.5) & (Y <= 115) & (np.abs(X - cx) <= thw)
    tank &= ~((Y > 111.5) & (np.abs(X - cx) > thw - (Y - 111.5) * 1.1))
    cv.paint(tank, brass((X - (cx - thw)) / (2 * thw)))
    cv.tint(tank & (ty2 > 0.8), 0x4d360e, 0.5)
    cv.tint(tank & (np.abs(ty2 - 0.2) < 0.035), 0x5e430f, 0.8)
    cv.paint(rrect(X, Y, cx + 30, 98.5, 5.0, 1.3, 0.6), 0x7a5718)
    kn = ell(X, Y, cx + 36.5, 98.5, 3.6, 3.6)
    cv.paint(kn <= 1, ramp(kn, [(0, 0xffefad), (0.4, 0xd9ae3c), (1, 0x7a5718)]))
    cv.paint(rrect(X, Y, cx - 2, 104.5, 8.5, 3.0, 1.0), 0x5e430f)
    cv.paint(rrect(X, Y, cx - 2, 104.5, 7.3, 1.9, 0.6), 0xe9c85a)
    for k in range(4):
        cv.paint(rrect(X, Y, cx - 6.5 + k * 3.0, 104.5, 0.8, 0.9, 0.2), 0x5e430f)


# ─────────────────────────────────────────────
# 해루질 · 낚시 도구
# ─────────────────────────────────────────────
@icon('tongs', ids=['inv_tongs'], label='채집 집게')
def tongs(cv):
    # 긴 스테인리스 집게 — 접힌 끝(왼쪽 아래)에서 벌어져 톱니 달린 끝(오른쪽 위)으로
    u, v = cv.frame(14, 112, -43.0)
    LEN = 138.0
    steel = [(0, 0x5c666f), (0.25, 0xe8edf0), (0.4, 0xffffff), (0.55, 0xb9c2ca), (1, 0x66707a)]
    for sgn in (-1, 1):
        gap = 1.2 + 7.0 * np.clip(u / LEN, 0, 1) ** 1.2
        c = sgn * gap
        th = np.where(u > LEN - 20, 3.4, 2.0)
        arm = (u >= 3) & (u <= LEN) & (np.abs(v - c) <= th)
        arm &= ~((u > LEN - 2.5) & (np.abs(v - c) > th - (u - (LEN - 2.5)) * 1.0))
        cv.paint(arm, ramp((v - c) / (2 * th) + 0.5, steel))
        tip = arm & (u > LEN - 20)
        cv.tint(tip & (np.mod(u, 2.6) < 0.9) & (sgn * (v - c) < 0), 0x4b545f, 0.8)        # 안쪽 톱니
        grip = (u > 22) & (u < 56) & (np.abs(v - c) <= 3.1)
        cv.paint(grip, ramp((v - c) / 6.2 + 0.5, [(0, 0xff9a6a), (0.3, 0xf0602a), (0.7, 0xc2410f), (1, 0x7d2606)]))
        cv.tint(grip & (np.mod(u, 4.0) < 0.9), 0x7d2606, 0.6)
    bend = (ell(u, v, 4.5, 0, 5.2, 4.2) <= 1) & (ell(u, v, 5.5, 0, 2.6, 1.5) > 1) & (u < 6)
    cv.paint(bend, ramp((v + 4.2) / 8.4, steel))
    cv.paint(disc(u, v, 14, 0, 2.3), 0x4b545f)                                           # 잠금 고리
    cv.paint(disc(u, v, 14, 0, 1.2), 0xdfe5ea)


@icon('gaff', ids=['inv_gaff'], label='채집 갈고리')
def gaff(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(14, 114, -45.0)
    shaft = (u >= 0) & (u <= 92) & (np.abs(v) <= 3.6)
    shaft &= ~((u < 1.6) & (np.abs(v) > 2.4))
    cv.paint(shaft, ramp(v / 7.2 + 0.5, [(0, 0xe7c08a), (0.3, 0xd3a46a), (0.31, 0xb98950), (0.7, 0xab7b44), (0.71, 0x835a2c), (1, 0x62401c)]))
    g = noise(cv.a.shape, 4, 2)
    cv.tint(shaft & (np.sin(v * 5 + g * 6) > 0.9), 0x7a5326, 0.5)
    wrap = (u > 6) & (u < 34) & (np.abs(v) <= 4.2)                                       # 손잡이 끈 감기
    cv.paint(wrap, ramp(v / 8.4 + 0.5, [(0, 0x3f6fb5), (0.3, 0x2f5a9a), (0.7, 0x234678), (1, 0x152c4e)]))
    cv.tint(wrap & (np.mod(u + v * 0.6, 3.0) < 0.7), 0x0f2140, 0.7)
    coll = (u > 88) & (u < 97) & (np.abs(v) <= 4.3)                                      # 쇠 물림
    cv.paint(coll, ramp(v / 8.6 + 0.5, [(0, 0x77818c), (0.3, 0xe8edf0), (0.5, 0xb9c2ca), (1, 0x4b545f)]))
    # 갈고리 — 곧게 나가다 되돌아 꺾이는 J
    pts = [(79.5, 48.5), (95, 33), (103, 27), (111, 27), (116, 33), (116, 41), (111, 47), (105, 49)]
    hook = polyline(X, Y, pts[:-1], 2.3) | capsule(X, Y, pts[-2][0], pts[-2][1], pts[-1][0], pts[-1][1], 1.5)
    d = (X - Y) / 1.0
    cv.paint(hook, ramp(np.clip(((X + Y) - 132) / 40, 0, 1), [(0, 0xf2f5f7), (0.35, 0xc3ccd4), (0.7, 0x8a96a2), (1, 0x4b545f)]))
    cv.tint(hook & (seg_dist(X, Y, 95, 33, 111, 27) < 1.0), 0xffffff, 0.7)
    cv.paint(poly(cv, [(106.5, 47.2), (104, 51), (99.5, 50.5)]), 0xdfe5ea)               # 뾰족한 끝
    loop = ring(X, Y, 9, 119, 6.5, 6.5, 1.3) & (u < 4)                                    # 손목 끈
    cv.paint(loop, 0x234678)


@icon('bucket', ids=['inv_bucket'], label='낚시용 두레박')
def bucket(cv):
    X, Y = cv.X, cv.Y
    cx = 60.0
    yT, yB = 46.0, 100.0
    t = np.clip((Y - yT) / (yB - yT), 0, 1)
    hw = 31.0 - 4.0 * t
    body = ((Y >= yT) & (Y <= yB) & (np.abs(X - cx) <= hw)) | (ell(X, Y, cx, yB, 27.0, 7.0) <= 1)
    base = 0x2a6fc0
    cv.paint(body, ramp((X - (cx - hw)) / (2 * hw), cyl(base, hl=0.28, gloss=0.4)))
    cv.tint(body & (np.abs(t - 0.52) < 0.09), 0xf4f6f7, 0.9)                              # 흰 띠
    cv.tint(body & (np.abs(t - 0.52) < 0.09) & (np.abs(X - cx) > hw * 0.7), 0x9aa8b6, 0.6)
    cv.tint(body & (t > 0.88), lit(base, -0.55), 0.6)
    # 윗테(노란 띠) + 안쪽
    rim = (ell(X, Y, cx, yT, 31.0, 9.0) <= 1) | ((Y >= yT) & (Y <= yT + 5) & (np.abs(X - cx) <= 31.0))
    cv.paint(rim, ramp((X - (cx - 31)) / 62, cyl(0xf2c230, hl=0.28, gloss=0.5)))
    inner = ell(X, Y, cx, yT, 27.5, 6.6) <= 1
    cv.paint(inner, ramp((Y - (yT - 6.6)) / 13.2, [(0, 0x0f2f5c), (0.5, 0x163f78), (0.51, 0x2f86d0), (1, 0x7cc4f2)]))   # 담긴 바닷물
    cv.tint(inner & (ell(X, Y, cx - 8, yT + 2.5, 7, 1.2) <= 1), 0xe8f6ff, 0.9)
    # 손잡이 끈 고리 + 감아 둔 줄
    arc = ring(X, Y, cx, yT, 31.0, 30.0, 2.0) & (Y < yT - 3)
    cv.paint(arc, ramp((X - (cx - 31)) / 62, [(0, 0x8a6a3a), (0.3, 0xe9cf9a), (0.6, 0xc9a86a), (1, 0x7a5a2c)]))
    ang = np.arctan2(Y - yT, X - cx)
    cv.tint(arc & (np.mod(ang * 14, 1.0) < 0.3), 0x6b4d22, 0.7)
    for k in range(4):                                                                    # 줄 타래
        yy = 84 + k * 5.2
        coil = ring(X, Y, 103, yy, 12.5, 4.6, 2.3)
        cv.paint(coil, ramp((X - 90.5) / 25, [(0, 0x8a6a3a), (0.3, 0xf0dcae), (0.6, 0xc9a86a), (1, 0x7a5a2c)]))
        cv.tint(coil & (np.mod(X * 0.9 + Y, 3.0) < 0.8), 0x6b4d22, 0.6)
    cv.paint(polyline(X, Y, [(92, 50), (99, 62), (103, 80)], 1.3), 0xc9a86a)


@icon('cooler', ids=['inv_cooler'], colors=44, label='쿨러 (아이스박스)')
def cooler(cv):
    X, Y = cv.X, cv.Y
    blue = 0x2a78c8
    # 옆면 · 앞면 · 윗면(뚜껑)
    side = poly(cv, [(96, 56), (112, 44), (112, 94), (96, 106)])
    cv.paint(side, ramp((Y - 44) / 62, [(0, lit(blue, -0.25)), (1, lit(blue, -0.6))]))
    front = box(X, Y, 14, 56, 96, 106, 4)
    cv.paint(front, ramp((Y - 56) / 50, [(0, lit(blue, 0.25)), (0.12, lit(blue, 0.1)), (0.13, blue), (0.8, lit(blue, -0.15)), (1, lit(blue, -0.4))]))
    cv.tint(front & (np.abs(Y - 84) < 5), lit(blue, 0.45), 0.9)                            # 밝은 띠
    cv.tint(front & (X < 17.5), lit(blue, 0.3), 0.6)
    lid_f = box(X, Y, 12, 46, 98, 60, 3)
    cv.paint(lid_f, ramp((Y - 46) / 14, [(0, 0xffffff), (0.5, 0xeef2f5), (0.51, 0xcfd8df), (1, 0xa9b6c1)]))
    lid_s = poly(cv, [(98, 47), (114, 35), (114, 47), (98, 59)])
    cv.paint(lid_s, ramp((Y - 35) / 24, [(0, 0xc3ced7), (1, 0x8796a3)]))
    top = poly(cv, [(13, 47), (29, 35), (114, 35), (98, 47)])
    cv.paint(top, ramp((X + Y * 0.6 - 40) / 110, [(0, 0xffffff), (0.6, 0xf2f5f7), (1, 0xdbe3e9)]))
    cv.tint(poly(cv, [(27, 44), (37, 37), (101, 37), (91, 44)]), 0xdbe3e9, 0.9)             # 뚜껑 오목한 자리
    # 손잡이 · 걸쇠 · 물 빼는 마개
    cv.paint(polyline(X, Y, [(38, 41), (40, 27), (88, 27), (90, 41)], 2.2), 0x59636d)
    cv.tint(polyline(X, Y, [(40, 27), (88, 27)], 2.2) & (Y < 27), 0xaab4bd, 0.9)
    cv.paint(rrect(X, Y, 64, 26.6, 13, 3.4, 1.6), ramp((Y - 23.2) / 6.8, [(0, 0x6f7a84), (0.4, 0x3a4047), (1, 0x15181c)]))
    latch = box(X, Y, 49, 54, 61, 70, 1.5)
    cv.paint(latch, ramp((Y - 54) / 16, [(0, 0xdfe5ea), (0.4, 0xaab4bd), (1, 0x59636d)]))
    cv.paint(box(X, Y, 51.5, 62, 58.5, 67, 1), 0x3a4047)
    cv.paint(disc(X, Y, 85, 97, 3.2), 0xdfe5ea)
    cv.paint(disc(X, Y, 85, 97, 1.8), 0x59636d)
    for fx in (20, 90):
        cv.paint(box(X, Y, fx - 4, 105, fx + 4, 109, 1), 0x1b2a3d)


@icon('certificate', ids=['inv_skill_reset'], colors=44, label='조업 재교육 이수증')
def certificate(cv, seed=5):
    u, v = cv.frame(64, 64, -7.0)
    hw, hh = 39.0, 50.0
    paper = (np.abs(u) <= hw) & (np.abs(v) <= hh)
    fold = (u + v) > (hw + hh - 13)
    cv.paint(paper & ~fold, ramp((v + hh) / (2 * hh) * 0.7 + (u + hw) / (2 * hw) * 0.3, [(0, 0xfff8e6), (0.5, 0xf8ecd0), (1, 0xe6d5ac)]))
    aged = noise(cv.a.shape, seed, 6)
    cv.tint(paper & (aged > 0.7), 0xe6d2a2, 0.22)
    cv.tint(paper & ((np.abs(u) > hw - 1.2) | (np.abs(v) > hh - 1.2)), 0xcbb37a, 0.6)
    tri = (u - (hw - 13)) + (v - (hh - 13)) < 13
    cv.paint(paper & (u > hw - 13) & (v > hh - 13) & tri,
             ramp(((u - (hw - 13)) + (v - (hh - 13))) / 13, [(0, 0xb99f66), (0.25, 0xe9dab4), (1, 0xfff6de)]))
    body = paper & ~fold
    gold = ramp((u + v + 90) / 180, [(0, 0xe9c85a), (0.3, 0xb8902c), (0.5, 0xf6e08a), (0.7, 0xb8902c), (1, 0x8a6a1e)])
    m = np.maximum
    fr1 = (m(np.abs(u) - (hw - 5.2), np.abs(v) - (hh - 5.2)) <= 0) & (m(np.abs(u) - (hw - 7.2), np.abs(v) - (hh - 7.2)) > 0)
    fr2 = (m(np.abs(u) - (hw - 9.0), np.abs(v) - (hh - 9.0)) <= 0) & (m(np.abs(u) - (hw - 9.8), np.abs(v) - (hh - 9.8)) > 0)
    cv.paint(body & (fr1 | fr2), gold)
    for su in (-1, 1):
        for sv in (-1, 1):
            if su == 1 and sv == 1:
                continue
            cv.paint(body & (np.abs(u - su * (hw - 6.2)) < 2.6) & (np.abs(v - sv * (hh - 6.2)) < 2.6), 0x8a6a1e)
            cv.paint(body & (np.abs(u - su * (hw - 6.2)) < 1.2) & (np.abs(v - sv * (hh - 6.2)) < 1.2), 0xf6e08a)
    em = ell(u, v, 0, -30.5, 7.6, 7.6)
    cv.paint(body & (em <= 1), 0x1f5f86)
    cv.paint(body & (em <= 0.72), 0x3d8fbd)
    wave = (np.abs(v + 29.5 - 1.5 * np.sin(u * 1.1)) < 0.85) | (np.abs(v + 26.2 - 1.5 * np.sin(u * 1.1 + 1.6)) < 0.75)
    cv.paint(body & (em <= 0.7) & wave, 0xffffff)
    cv.paint(body & (em <= 0.7) & (ell(u, v, 0.5, -33.6, 1.7, 1.7) <= 1), 0xffe27a)
    for k in range(6):
        cu = -15.0 + k * 6.0
        cv.paint(body & (np.abs(u - cu) < 2.1) & (np.abs(v + 16.5) < 2.6), 0x2b2a2e)
        cv.paint(body & (np.abs(u - cu) < 1.0) & (np.abs(v + 16.9) < 0.8), 0xf8ecd0)
        cv.paint(body & (np.abs(u - cu + 0.2) < 0.45) & (np.abs(v + 15.2) < 1.0), 0xf8ecd0)
    rng = np.random.default_rng(seed)
    for row, vv in enumerate([-7.0, -2.2, 2.6, 7.4, 12.2]):
        x0 = -26.0
        end = 26.0 if row < 4 else 4.0
        while x0 < end:
            w = rng.uniform(2.0, 5.5)
            cv.paint(body & (u >= x0) & (u <= min(x0 + w, end)) & (np.abs(v - vv) < 0.95), 0x55535a)
            x0 += w + 1.4
    cv.paint(body & (u >= -26) & (u <= -6) & (np.abs(v - 23.5) < 0.8), 0x55535a)
    cv.paint(body & (u >= -27) & (u <= 4) & (np.abs(v - 33.0) < 0.5), 0x8a8170)
    sig = (np.abs(v - 29.5 - 2.0 * np.sin(u * 0.9) * np.exp(-((u + 12) / 9) ** 2)) < 0.7) & (u > -24) & (u < 0)
    cv.paint(body & sig, 0x1f2f6b)
    su, sv2 = 15.0, 22.5
    st = (np.abs(u - su) < 8.2) & (np.abs(v - sv2) < 8.2)
    cv.paint(body & st, 0xc9302a)
    cv.paint(body & (np.abs(u - su) < 6.6) & (np.abs(v - sv2) < 6.6), 0xf8ecd0)
    for (a, b, w, h) in [(-3.4, -3.4, 2.4, 0.8), (-3.4, -0.4, 0.8, 3.0), (-3.4, 3.2, 2.4, 0.8), (-0.9, 0.3, 0.7, 4.0),
                         (3.2, -3.4, 2.6, 0.8), (3.2, -0.6, 2.6, 0.8), (1.4, 0.8, 0.8, 3.6), (5.0, 0.8, 0.8, 3.6), (3.2, 4.0, 2.6, 0.8)]:
        cv.paint(body & (np.abs(u - su - a) < w) & (np.abs(v - sv2 - b) < h), 0xc9302a)
    stn = noise(cv.a.shape, seed + 2, 1)
    cv.tint(body & st & (stn > 0.72), 0xf8ecd0, 0.7)
