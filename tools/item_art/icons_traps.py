# -*- coding: utf-8 -*-
"""통발 · 문어 단지"""
import numpy as np
from kit import *
from shapes import *


def _mesh(cv, mask, color, cell=6.0, w=0.8, alpha=0.9, skew=0.0):
    """그물코(마름모)"""
    X, Y = cv.X, cv.Y
    a = (np.mod(X + Y * (1 + skew), cell) < w) | (np.mod(X - Y * (1 - skew), cell) < w)
    cv.tint(mask & a, color, alpha)


def _cage(cv, *, cx=64, top=40, bottom=100, hw=44, ry=11, frame=0x2b2f35, net=0x2f8f6a, inner=0x12352a, rings=3, funnel=True, rope=True,
          cell=6.0):
    """둥근 접이식 통발(위에서 비스듬히)"""
    X, Y = cv.X, cv.Y
    side = ((Y >= top) & (Y <= bottom) & (np.abs(X - cx) <= hw)) | (ell(X, Y, cx, bottom, hw, ry) <= 1)
    tx = (X - (cx - hw)) / (2 * hw)
    cv.paint(side, ramp(tx, [(0, lit(inner, -0.3)), (0.3, lit(inner, 0.25)), (0.6, inner), (1, lit(inner, -0.45))]))
    _mesh(cv, side, net, cell=cell)
    for k in range(rings):                                                            # 테(철사 고리)
        yy = top + (bottom - top) * k / max(1, rings - 1)
        yr = yy + ry * np.sqrt(np.clip(1 - ((X - cx) / hw) ** 2, 0, 1))
        rm = side & (np.abs(Y - yr) < 1.5)
        cv.paint(rm, ramp(tx, cyl(frame, hl=0.3, gloss=0.5)))
    lid = ell(X, Y, cx, top, hw, ry) <= 1
    cv.paint(lid, ramp((Y - (top - ry)) / (2 * ry), [(0, lit(inner, -0.2)), (1, lit(inner, 0.35))]))
    _mesh(cv, lid, net, cell=cell * 0.9, skew=0.5)
    cv.paint(ring(X, Y, cx, top, hw, ry, 1.7), ramp(tx, cyl(frame, hl=0.3, gloss=0.5)))
    if funnel:                                                                        # 옆 깔때기 입구
        fx = cx - hw * 0.35
        fm = (ell(X, Y, fx, (top + bottom) / 2 + ry * 0.6, 10, 12) <= 1) & side
        cv.paint(fm, ramp(np.sqrt(((X - fx) / 10) ** 2 + ((Y - ((top + bottom) / 2 + ry * 0.6)) / 12) ** 2), [(0, 0x050807), (0.5, 0x0c1a14), (1, lit(inner, 0.2))]))
        cv.paint(ring(X, Y, fx, (top + bottom) / 2 + ry * 0.6, 10, 12, 1.4), 0xf4f1e6)
    if rope:
        cv.paint(polyline(X, Y, [(cx + hw * 0.5, top - 3), (cx + hw * 0.8, top - 18), (cx + hw * 0.4, top - 30)], 1.6),
                 ramp((Y - (top - 30)) / 30, [(0, 0xe9cf9a), (1, 0x8a6a3a)]))
        cv.paint(disc(X, Y, cx + hw * 0.4, top - 32, 5.5), ramp((X - (cx + hw * 0.4 - 5.5)) / 11, cyl(0xf07a1a, hl=0.3, gloss=0.6)))   # 부표
    return side


@icon('trap_crab_basic', ids=['inv_trap_trap_crab_basic'], colors=44, label='기본 게 통발')
def trap_crab_basic(cv):
    _cage(cv, top=52, bottom=92, hw=44, ry=12, net=0x3fa07a, inner=0x12352a, rings=2)


@icon('trap_crab_pro', ids=['inv_trap_trap_crab_pro'], colors=44, label='프로 게 통발 (대형)')
def trap_crab_pro(cv):
    X, Y = cv.X, cv.Y
    # 각진 철제 통발 — 틀 + 굵은 그물, 미끼통
    front = box(X, Y, 14, 56, 92, 108, 2)
    side = poly(cv, [(92, 56), (114, 40), (114, 92), (92, 108)])
    top = poly(cv, [(14, 56), (36, 40), (114, 40), (92, 56)])
    for m, c0 in ((front, 0x16302a), (side, 0x0e221c), (top, 0x1e4038)):
        cv.paint(m, c0)
    _mesh(cv, front, 0xf2c230, cell=8.0, w=1.0)
    _mesh(cv, side, 0xb8902c, cell=8.0, w=1.0, skew=0.4)
    _mesh(cv, top, 0xf6e08a, cell=8.0, w=1.0, skew=0.6)
    steel = 0x59636d
    for (a, b, c, d) in ((14, 56, 92, 56), (14, 108, 92, 108), (14, 56, 14, 108), (92, 56, 92, 108), (92, 56, 114, 40), (92, 108, 114, 92),
                         (114, 40, 114, 92), (14, 56, 36, 40), (36, 40, 114, 40), (53, 56, 53, 108)):
        cv.paint(capsule(X, Y, a, b, c, d, 1.9), ramp((X + Y - 60) / 120, [(0, lit(steel, 0.5)), (0.4, steel), (1, lit(steel, -0.5))]))
    fm = ell(X, Y, 33, 82, 11, 13) <= 1                                                  # 입구
    cv.paint(fm, ramp(np.sqrt(((X - 33) / 11) ** 2 + ((Y - 82) / 13) ** 2), [(0, 0x050807), (0.6, 0x0c1a14), (1, 0x1e4038)]))
    cv.paint(ring(X, Y, 33, 82, 11, 13, 1.5), 0xf4f1e6)
    bait = box(X, Y, 64, 72, 82, 94, 3)                                                  # 미끼통
    cv.paint(bait, ramp((X - 64) / 18, cyl(0xc9302a, hl=0.3, gloss=0.5)))
    for k in range(3):
        cv.paint(box(X, Y, 67, 76 + k * 6, 79, 78.4 + k * 6, 0.8), 0x5e1410)
    cv.paint(polyline(X, Y, [(75, 40), (84, 22), (70, 12)], 1.7), ramp((Y - 12) / 28, [(0, 0xe9cf9a), (1, 0x8a6a3a)]))
    cv.paint(disc(X, Y, 68, 10, 6), ramp((X - 62) / 12, cyl(0xf07a1a, hl=0.3, gloss=0.6)))


@icon('trap_shrimp_basic', ids=['inv_trap_trap_shrimp_basic'], colors=44, label='새우 통발')
def trap_shrimp(cv):
    _cage(cv, top=46, bottom=98, hw=34, ry=9, net=0x9ad0c0, inner=0x1b3a44, rings=4, cell=4.0)


def _tube(cv, ox, oy, deg, ln, r, net, inner, frame=0x2b2f35, rings=4, cell=5.0, cone=True):
    """원통형 장어 통발 한 개(비스듬히 누운 그물 통)"""
    u, v = cv.frame(ox, oy, deg)
    body = (u >= 0) & (u <= ln) & (np.abs(v) <= r)
    cv.paint(body, ramp(v / (2 * r) + 0.5, [(0, lit(inner, -0.3)), (0.3, lit(inner, 0.3)), (0.6, inner), (1, lit(inner, -0.45))]))
    cv.tint(body & ((np.mod(u + v, cell) < 0.8) | (np.mod(u - v, cell) < 0.8)), net, 0.9)
    for k in range(rings):
        uu = ln * k / (rings - 1)
        cv.paint(body & (np.abs(u - uu) < 1.5), ramp(v / (2 * r) + 0.5, cyl(frame, hl=0.3, gloss=0.5)))
    end = ell(u, v, ln, 0, r * 0.42, r) <= 1                                             # 입구(깔때기)
    cv.paint(end, ramp(np.sqrt(((u - ln) / (r * 0.42)) ** 2 + (v / r) ** 2), [(0, 0x050807), (0.55, 0x0c1a14), (1, lit(inner, 0.25))]))
    cv.paint(ring(u, v, ln, 0, r * 0.42, r, 1.3), ramp(v / (2 * r) + 0.5, cyl(frame, hl=0.3, gloss=0.5)))
    if cone:
        cap = (u < 0) & (u > -r * 0.9) & (np.abs(v) <= r * (1 + u / (r * 0.9)))            # 묶은 꼬리
        cv.paint(cap, ramp(v / (2 * r) + 0.5, [(0, lit(inner, 0.2)), (1, lit(inner, -0.4))]))
        cv.tint(cap & ((np.mod(u + v, cell) < 0.8) | (np.mod(u - v, cell) < 0.8)), net, 0.9)
    return body


@icon('trap_eel_basic', ids=['inv_trap_trap_eel_basic'], colors=44, label='장어 통발 (원통형)')
def trap_eel_basic(cv):
    X, Y = cv.X, cv.Y
    _tube(cv, 26, 96, -24, 78, 15, 0x7a8a9a, 0x1b2430)
    cv.paint(polyline(X, Y, [(20, 99), (10, 86), (16, 70)], 1.6), 0xc9a86a)


@icon('trap_eel_pro', ids=['inv_trap_trap_eel_pro'], colors=44, label='장어 통발 (대형 연결식)')
def trap_eel_pro(cv):
    X, Y = cv.X, cv.Y
    cv.paint(polyline(X, Y, [(14, 30), (40, 44), (64, 72), (90, 100), (116, 108)], 1.7), ramp((X - 14) / 102, [(0, 0xe9cf9a), (1, 0x8a6a3a)]))   # 모릿줄
    _tube(cv, 22, 52, -18, 56, 10.5, 0x7a8a9a, 0x1b2430, rings=3)
    _tube(cv, 40, 82, -18, 56, 10.5, 0x8a9aa8, 0x1b2430, rings=3)
    _tube(cv, 58, 112, -18, 56, 10.5, 0x7a8a9a, 0x1b2430, rings=3)


def _pot(cv, base, *, rim=None, pvc=False, rope=0xc9a86a):
    """문어 단지 — 비스듬히 누워 입구가 보인다"""
    X, Y = cv.X, cv.Y
    u, v = cv.frame(30, 92, -22)
    if pvc:
        hw = np.full(u.shape, 21.0)
    else:
        t = np.clip(u / 72, 0, 1)
        hw = 14 + 12 * np.sin(np.pi * np.clip(t * 0.8 + 0.18, 0, 1)) ** 0.8               # 배부른 항아리
    body = (u >= 0) & (u <= 72) & (np.abs(v) <= hw)
    if not pvc:
        body |= ell(u, v, 2, 0, 9, 14) <= 1
    cv.paint(body, ramp(v / (2 * hw) + 0.5, cyl(base, hl=0.3, gloss=0.35 if not pvc else 0.6, dark=0.5)))
    if not pvc:
        n = noise(cv.a.shape, 3, 2)
        cv.tint(body & (n > 0.66), lit(base, -0.3), 0.35)                               # 토기 얼룩
        for uu in (20, 40):
            cv.tint(body & (np.abs(u - uu) < 0.6), lit(base, -0.45), 0.5)
        for (bu, bv) in ((14, -6), (30, 8), (52, -10), (44, 14)):                        # 붙은 따개비
            cv.paint(body & disc(u, v, bu, bv, 2.6), 0xe8e2d4)
            cv.paint(body & disc(u, v, bu, bv, 1.0), 0x8a8170)
    mrx = 8.5
    mry = 21.0 if pvc else 16.0
    mouth = ell(u, v, 72, 0, mrx, mry) <= 1
    rimc = rim if rim is not None else lit(base, 0.2)
    cv.paint(mouth, ramp(v / (2 * mry) + 0.5, [(0, lit(rimc, 0.3)), (0.5, rimc), (1, lit(rimc, -0.4))]))
    hole = ell(u, v, 72.5, 0.5, mrx - 2.6, mry - 3.4) <= 1
    cv.paint(hole, ramp(np.sqrt(((u - 72.5) / (mrx - 2.6)) ** 2 + ((v - 0.5) / (mry - 3.4)) ** 2), [(0, 0x050607), (0.6, 0x15120f), (1, lit(base, -0.6))]))
    # 숨은 문어 눈
    for dv in (-3.0, 3.5):
        cv.paint(hole & (ell(u, v, 73, dv, 1.6, 1.3) <= 1), 0xf2c230)
        cv.paint(hole & (ell(u, v, 73, dv, 0.5, 1.1) <= 1), 0x15120f)
    cv.paint(polyline(u, v, [(60, -hw[0, 0] if pvc else -20), (58, -30), (70, -40), (84, -44)], 1.6), rope)
    if pvc:
        for uu in (12, 60):
            cv.paint(body & (np.abs(u - uu) < 1.6), ramp(v / 42 + 0.5, cyl(lit(base, -0.3), hl=0.3)))
        for k in range(3):                                                           # 물 빠지는 구멍
            cv.paint(body & disc(u, v, 24 + k * 12, 9, 2.0), lit(base, -0.7))


@icon('trap_octopus_earthen', ids=['inv_trap_trap_octopus_earthen'], colors=44, label='문어 단지 (토기)')
def trap_octopus_earthen(cv):
    _pot(cv, 0xa86a3a)


@icon('trap_octopus_pvc', ids=['inv_trap_trap_octopus_pvc'], colors=44, label='문어 PVC 단지')
def trap_octopus_pvc(cv):
    _pot(cv, 0x6f7f8c, pvc=True)


@icon('trap_fish_net', ids=['inv_trap_trap_fish_net'], colors=44, label='어류 그물 통발')
def trap_fish_net(cv):
    X, Y = cv.X, cv.Y
    # 길쭉한 그물 통발 — 날개(유도 그물)가 양쪽으로 벌어진다
    for sx in (-1, 1):
        wing = poly(cv, [(64 + sx * 34, 58), (64 + sx * 58, 40), (64 + sx * 58, 108), (64 + sx * 34, 96)])
        cv.paint(wing, lit(0x16302a, -0.1))
        _mesh(cv, wing, 0x8fd0b0, cell=5.0, w=0.7, skew=0.3 * sx)
        cv.paint(capsule(X, Y, 64 + sx * 58, 38, 64 + sx * 58, 110, 1.8), 0x8a6a3a)        # 말목
    _cage(cv, top=58, bottom=96, hw=36, ry=9, net=0x8fd0b0, inner=0x16302a, rings=3, funnel=False, cell=5.0)
    fm = ell(X, Y, 64, 84, 13, 10) <= 1
    cv.paint(fm, ramp(np.sqrt(((X - 64) / 13) ** 2 + ((Y - 84) / 10) ** 2), [(0, 0x050807), (0.6, 0x0c1a14), (1, 0x1e4038)]))
    cv.paint(ring(X, Y, 64, 84, 13, 10, 1.4), 0xf4f1e6)
