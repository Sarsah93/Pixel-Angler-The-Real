# -*- coding: utf-8 -*-
"""
해산물 — 그림이 없던 채집 생물 10종 · 어종 4종 (2026-10-08 하모니)

텍스처 키를 아이템 id 가 아니라 **이미 게임이 찾는 키**로 등록한다(key=).
  채집 생물  forage_<생물 id>  → 가방 · 쿨러 · 도감이 그대로 이 그림을 쓴다
  어종       fish_<어종 id>    → `data/FishTextures.ts` 의 FISH_TEXTURE 에 같은 키를 등록한다
필드 위 스팟 도트(forage_dot_*)는 따로다 — 이 파일은 손에 든 그림만 그린다.
"""
import numpy as np
from kit import *
from shapes import *


# ─────────────────────────────────────────────
# 조개 · 고둥
# ─────────────────────────────────────────────
def _shell_fan(cv, cx, cy, rx, ry, base, rib=0, seed=1):
    """부채꼴 조개 한 쪽 — 위쪽 꼭지(umbo)에서 성장선이 퍼진다"""
    X, Y = cv.X, cv.Y
    m = ell(X, Y, cx, cy, rx, ry) <= 1
    m &= ~((Y < cy - ry * 0.55) & (np.abs(X - (cx - rx * 0.18)) > rx * 0.45 * (1 + (Y - (cy - ry)) / ry)))
    d = np.sqrt(((X - (cx - rx * 0.35)) / (rx * 1.3)) ** 2 + ((Y - (cy - ry * 0.4)) / (ry * 1.3)) ** 2)
    cv.paint(m, ramp(d, [(0, lit(base, 0.35)), (0.25, lit(base, 0.12)), (0.6, base), (0.85, lit(base, -0.25)), (1.1, lit(base, -0.45))]))
    ux, uy = cx - rx * 0.18, cy - ry * 0.92
    r = np.sqrt(((X - ux) / rx) ** 2 + ((Y - uy) / ry) ** 2)
    for k in np.arange(0.35, 2.0, 0.22):                                            # 성장선(동심)
        cv.tint(m & (np.abs(r - k) < 0.018), lit(base, -0.35), 0.8)
    if rib:
        a = np.arctan2(Y - uy, X - ux)
        cv.tint(m & (np.abs(np.sin(a * rib)) < 0.12) & (r > 0.25), lit(base, -0.18), 0.6)
    return m, (ux, uy)


@icon('clam_varicosa', key='forage_clam_varicosa', board=True, label='바지락')
def clam_varicosa(cv):
    X, Y = cv.X, cv.Y
    # 뒤에 한 개(작게), 앞에 한 개 — 베이지 바탕에 갈색 그물 무늬
    back, _ = _shell_fan(cv, 82, 52, 26, 21, 0xb9a488, rib=22)
    cv.tint(back & (np.sin(X * 0.55 + np.sin(Y * 0.4) * 3) > 0.55), 0x6e5440, 0.55)
    m, (ux, uy) = _shell_fan(cv, 56, 78, 38, 31, 0xd2bf9e, rib=30)
    zig = np.sin(X * 0.45 + 2.2 * np.sin(Y * 0.32))
    cv.tint(m & (zig > 0.5) & (Y > 60), 0x5c4632, 0.6)
    cv.tint(m & (np.abs(Y - 82) < 5) & (zig < -0.4), 0x7c5c40, 0.55)
    cv.tint(m & (ell(X, Y, 44, 64, 10, 6) <= 1), 0xfff1d6, 0.5)                    # 윤기


@icon('turbo_cornutus', key='forage_turbo_cornutus', board=True, label='소라')
def turbo_cornutus(cv):
    X, Y = cv.X, cv.Y
    base = 0x7a6448
    # 아래로 넓은 원뿔 + 나선 단 4개, 단마다 뿔
    body = poly(cv, [(64, 16), (88, 44), (104, 76), (100, 98), (78, 112), (46, 112), (26, 96), (28, 70), (42, 42)])
    cv.paint(body, ramp((X - 26) / 80, cyl(base, hl=0.25, gloss=0.45, dark=0.6)))
    for k, y in enumerate((38, 58, 80)):
        hw = 14 + k * 13
        cv.tint(body & (np.abs(Y - (y + (X - 64) * 0.18)) < 1.2), lit(base, -0.5), 0.9)
        for j in range(-1 - k // 2, 2 + k // 2):                                      # 뿔
            x = 64 + j * (hw / (1.4 + k * 0.4))
            yy = y + (x - 64) * 0.18
            cv.paint(poly(cv, [(x - 5, yy + 2), (x + 5, yy + 2), (x + j * 6 + (3 if j >= 0 else -3), yy - 9)]),
                     ramp((X - (x - 4)) / 8, [(0, lit(base, 0.3)), (0.5, base), (1, lit(base, -0.4))]))
    cv.tint(body & (noise(X.shape, 7, 3) > 0.62), 0x4a6a3a, 0.35)                     # 이끼
    op = ell(X, Y, 62, 101, 20, 9) <= 1                                               # 입(뚜껑)
    cv.paint(op, ramp((X - 42) / 40, [(0, 0xf2e2c2), (0.5, 0xd9b98a), (1, 0x9a7a52)]))
    cv.tint(op & (ell(X, Y, 62, 101, 10, 4) <= 1), 0xb8915e, 0.7)


@icon('oyster_gigas', key='forage_oyster_gigas', board=True, label='굴')
def oyster_gigas(cv):
    X, Y = cv.X, cv.Y
    # 길쭉한 물방울꼴 — 경첩(왼쪽 아래)이 좁고 입(오른쪽 위)이 넓다. 가장자리는 낮은 물결
    u, v = cv.frame(30, 96, -42.0)
    t = np.clip(u / 92.0, 0, 1)
    wav = 1 + 0.07 * np.sin(u * 0.32) + 0.04 * np.sin(u * 0.71 + 1)
    hw = 31 * np.sin(np.pi * np.clip(t * 0.86 + 0.07, 0, 1)) ** 0.6 * (0.55 + 0.45 * t) * wav
    m = (u >= 0) & (u <= 92) & (np.abs(v + 2 * np.sin(u * 0.05)) <= hw)
    cv.paint(m, ramp(v / (2 * np.maximum(hw, 1)) + 0.5, [(0, 0x6a6a5e), (0.25, 0xa8a496), (0.55, 0x8e8a7c), (1, 0x4e4c44)]))
    jit = (noise(X.shape, 12, 5) - 0.5) * 9
    for i, k in enumerate((16, 27, 36, 47, 55, 66, 74, 84)):                          # 층층이 쌓인 껍질 결(고르지 않게)
        wob = (2 + i % 3) * np.sin(v * (0.18 + 0.05 * (i % 2)) + i) + jit
        cv.tint(m & (np.abs(u - k - wob) < 1.0), 0xdcd6c6, 0.75)
        cv.tint(m & (np.abs(u - k - 2.0 - wob) < 0.8), 0x3e3c36, 0.5)
    cv.tint(m & (noise(X.shape, 11, 4) > 0.64), 0x5e6e58, 0.45)                       # 이끼 · 따개비 얼룩
    cv.tint(m & (t > 0.82), 0x7a6a8a, 0.35)                                           # 입 쪽 보랏빛 테


@icon('haliotis_discus', key='forage_haliotis_discus', board=True, label='전복')
def haliotis_discus(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(64, 66, -12.0)
    m = ell(u, v, 0, 0, 50, 36) <= 1
    d = np.sqrt(((u + 22) / 70) ** 2 + ((v + 8) / 50) ** 2)
    cv.paint(m, ramp(d, [(0, 0x9aa070), (0.3, 0x7a7e52), (0.7, 0x5a5a3a), (1.1, 0x3a3a26)]))
    a = np.arctan2(v + 6, u + 26)
    rr = np.sqrt((u + 26) ** 2 + (v + 6) ** 2)
    cv.tint(m & (np.abs(np.sin(rr * 0.42 - a * 2.0)) < 0.18), 0x2e3020, 0.55)          # 나선 결
    cv.tint(m & (noise(X.shape, 5, 3) > 0.6), 0x8e6a4a, 0.4)
    for k in range(6):                                                               # 숨구멍 줄
        t = k / 5.0
        hu, hv = -18 + t * 58, -30 + t * 6 - 4 * np.sin(t * 3)
        cv.paint(ell(u, v, hu, hv, 3.4, 2.6) <= 1, 0x1c1e16)
        cv.tint(ell(u, v, hu - 1, hv - 1.2, 2.6, 1.0) <= 1, 0xc9c6a0, 0.6)
    lip = (ell(u, v, 0, 0, 50, 36) <= 1) & (ell(u, v, 0, -3, 48, 33) > 1) & (v > 0)  # 진주층 테두리
    cv.paint(lip, ramp((u + 50) / 100, [(0, 0xbfe0dc), (0.4, 0xd8c8ea), (0.7, 0xa8d8c8), (1, 0x8ab0c8)]))


@icon('mytilus_coruscus', key='forage_mytilus_coruscus', board=True, label='홍합')
def mytilus_coruscus(cv):
    X, Y = cv.X, cv.Y
    for (ox, oy, ang, s) in ((50, 70, -52.0, 0.86), (74, 62, -32.0, 1.0)):
        u, v = cv.frame(ox, oy, ang)
        t = np.clip((u + 44 * s) / (88 * s), 0, 1)
        hw = 24 * s * np.sin(np.pi * np.clip(t, 0, 1)) ** 0.6 * (0.35 + 0.65 * t)
        m = (np.abs(u) <= 44 * s) & (np.abs(v) <= hw)
        cv.paint(m, ramp(v / (2 * np.maximum(hw, 1)) + 0.5, [(0, 0x5a6e9a), (0.25, 0x34446a), (0.55, 0x1a2234), (1, 0x0e121c)]))
        r = np.sqrt(((u + 44 * s) / (88 * s)) ** 2 + (v / (26 * s)) ** 2)
        for k in np.arange(0.3, 1.1, 0.14):
            cv.tint(m & (np.abs(r - k) < 0.012), 0x0a0d14, 0.7)
        cv.tint(m & (np.abs(v + hw * 0.45) < 2.2) & (t > 0.2) & (t < 0.85), 0x9ab4d8, 0.45)   # 윤기
        cv.paint(capsule(u, v, -44 * s, 0, -54 * s, 6 * s, 1.6 * s) & (u < -42 * s), 0x6a5a3a)  # 족사


@icon('omphalius_rusticus', key='forage_omphalius_rusticus', board=True, label='보말')
def omphalius_rusticus(cv):
    X, Y = cv.X, cv.Y
    for (cx, cy, s) in ((44, 70, 0.8), (78, 66, 1.0)):
        hw = 26 * s
        top = cy - 34 * s
        m = poly(cv, [(cx, top), (cx + hw, cy + 8 * s), (cx + hw * 0.7, cy + 18 * s), (cx - hw * 0.7, cy + 18 * s), (cx - hw, cy + 8 * s)])
        cv.paint(m, ramp((X - (cx - hw)) / (2 * hw), cyl(0x3a3530, hl=0.25, gloss=0.4, dark=0.7)))
        for k in range(4):                                                           # 나선 단
            yk = top + (k + 1) * 9.5 * s
            cv.tint(m & (np.abs(Y - yk - (X - cx) * 0.12) < 1.2 * s), 0x8a7e6e, 0.85)
            cv.tint(m & (np.abs(Y - yk - 2 * s - (X - cx) * 0.12) < 1.0 * s), 0x141210, 0.8)
        cv.tint(m & (np.sin(X * 0.9) > 0.7) & (Y < cy + 6 * s), 0x6a5e50, 0.4)
        base = ell(X, Y, cx, cy + 15 * s, hw * 0.72, 5 * s) <= 1                      # 진주빛 바닥
        cv.paint(base, ramp((X - cx + hw) / (2 * hw), [(0, 0xd8e2d0), (0.5, 0xa8b8a0), (1, 0x6a7a68)]))


@icon('cellana_grata', key='forage_cellana_grata', board=True, label='삿갓조개')
def cellana_grata(cv):
    X, Y = cv.X, cv.Y
    cx, cy = 64, 74
    # 비스듬히 본 낮은 원뿔 — 꼭지에서 방사 늑이 퍼진다
    m = ell(X, Y, cx, cy, 46, 30) <= 1
    m |= poly(cv, [(cx - 44, cy - 6), (cx + 44, cy - 6), (cx + 4, cy - 36)])
    m &= Y <= cy + 22
    cv.paint(m, ramp((X - 18) / 92, cyl(0x8a7a5a, hl=0.25, gloss=0.4, dark=0.6)))
    apex = (cx + 4, cy - 34)
    a = np.arctan2(Y - apex[1], X - apex[0])
    cv.tint(m & (np.abs(np.sin(a * 18)) < 0.22), 0x4a3e2a, 0.7)
    cv.tint(m & (np.abs(np.sin(a * 18 + 1.6)) < 0.12), 0xd8c8a0, 0.55)
    rim = (ell(X, Y, cx, cy, 46, 30) <= 1) & (Y > cy + 14) & (Y <= cy + 22)
    cv.paint(rim, ramp((X - 18) / 92, [(0, 0xb8a88a), (0.5, 0x7a6a50), (1, 0x4a3e2c)]))
    cv.tint(m & (ell(X, Y, apex[0], apex[1] + 4, 6, 4) <= 1), 0xe8dcc0, 0.7)


@icon('capitulum_mitella', key='forage_capitulum_mitella', board=True, label='거북손')
def capitulum_mitella(cv):
    X, Y = cv.X, cv.Y
    for (cx, by, s, ang) in ((40, 114, 0.78, 14.0), (86, 112, 0.84, -16.0), (63, 116, 1.0, 0.0)):
        u, v = cv.frame(cx, by, -90 + ang)                                           # u = 위쪽
        # 자루 — 오톨도톨한 갈색 비늘
        stalk = (u >= 0) & (u <= 42 * s) & (np.abs(v) <= 12 * s * (1 - 0.15 * u / (42 * s)))
        cv.paint(stalk, ramp(v / (24 * s) + 0.5, cyl(0x6a5a44, hl=0.25, gloss=0.4, dark=0.55)))
        cv.tint(stalk & (np.sin(u * 1.1 / s) * np.sin(v * 1.1 / s) > 0.35), 0x3a2e22, 0.7)
        cv.tint(stalk & (np.sin(u * 1.1 / s + 1.5) * np.sin(v * 1.1 / s + 1.5) > 0.55), 0xa8987a, 0.5)
        # 머리 — 거북 발톱 같은 석회판 여러 장
        for (pv, top, w) in ((-9, 74, 7.5), (9, 74, 7.5), (0, 82, 8.5), (-15, 62, 5.5), (15, 62, 5.5)):
            pts = [(-w, 40), (w, 40), (w * 0.4, top), (-w * 0.4, top)]
            # 지역 좌표 → 화면 좌표
            t = np.deg2rad(-90 + ang)
            scr = [(cx + (uu * s) * np.cos(t) - ((pv + vv) * s) * np.sin(t), by + (uu * s) * np.sin(t) + ((pv + vv) * s) * np.cos(t))
                   for vv, uu in pts]
            pm = poly(cv, scr)
            cv.paint(pm, ramp((X - min(p[0] for p in scr)) / max(1, (max(p[0] for p in scr) - min(p[0] for p in scr))),
                              [(0, 0xe8e2d0), (0.45, 0xc8c0a8), (1, 0x8a8270)]))
            cv.tint(pm & (np.abs(Y - (by - (top - 6) * s)) < 1.0), 0x5a5444, 0.5)


# ─────────────────────────────────────────────
# 게 · 낙지
# ─────────────────────────────────────────────
@icon('charybdis_japonica', key='forage_charybdis_japonica', board=True, label='민꽃게(돌게)')
def charybdis_japonica(cv):
    X, Y = cv.X, cv.Y
    base = 0x4e5a34
    # 다리 — 몸 뒤에 먼저
    for side in (-1, 1):
        for k in range(3):
            x0, y0 = 64 + side * 26, 70 + k * 8
            pts = [(x0, y0), (x0 + side * 22, y0 + 4 + k * 3), (x0 + side * 32, y0 + 18 + k * 4)]
            cv.paint(polyline(X, Y, pts, 3.2), lit(base, -0.1))
            cv.tint(polyline(X, Y, pts, 1.2), lit(base, 0.2), 0.6)
        # 헤엄다리(노 모양)
        cv.paint(polyline(X, Y, [(64 + side * 22, 88), (64 + side * 34, 102)], 3.0), lit(base, -0.15))
        cv.paint(ell(X, Y, 64 + side * 38, 106, 7, 4) <= 1, lit(base, -0.05))
        # 집게
        arm = [(64 + side * 24, 60), (64 + side * 40, 46), (64 + side * 34, 30)]
        cv.paint(polyline(X, Y, arm, 5.0), base)
        claw = ell(X, Y, 64 + side * 30, 24, 10, 7) <= 1
        cv.paint(claw, ramp((Y - 16) / 16, [(0, lit(base, 0.3)), (0.5, base), (1, lit(base, -0.35))]))
        cv.paint(polyline(X, Y, [(64 + side * 22, 20), (64 + side * 14, 14)], 2.4), 0x2a3018)
        cv.paint(polyline(X, Y, [(64 + side * 24, 28), (64 + side * 15, 24)], 2.2), 0x2a3018)
        cv.tint(claw & (X * side > (64 + side * 32) * side), 0xb88a3a, 0.5)
    # 등딱지 — 앞 가장자리에 톱니
    a = np.arctan2(Y - 68, X - 64)
    teeth = 1 + 0.06 * np.maximum(0, np.sin(a * 12)) * (Y < 68)
    shell = ell(X, Y, 64, 68, 36 * teeth, 25) <= 1
    cv.paint(shell, ramp(np.sqrt(((X - 52) / 50) ** 2 + ((Y - 56) / 36) ** 2),
                         [(0, lit(base, 0.35)), (0.3, lit(base, 0.1)), (0.7, base), (1.0, lit(base, -0.45))]))
    cv.tint(shell & (noise(X.shape, 21, 3) > 0.6), 0x7a5a2a, 0.35)
    cv.tint(shell & (np.abs(X - 64) < 0.8) & (Y > 60), lit(base, -0.4), 0.6)
    cv.tint(shell & (ell(X, Y, 50, 70, 8, 4) <= 1), lit(base, -0.3), 0.5)
    cv.tint(shell & (ell(X, Y, 78, 70, 8, 4) <= 1), lit(base, -0.3), 0.5)
    for side in (-1, 1):                                                             # 눈
        cv.paint(disc(X, Y, 64 + side * 7, 45, 2.6), 0x16180e)
        cv.tint(disc(X, Y, 64 + side * 7 - 0.8, 44.2, 0.9), 0xd8d0b0, 0.8)


@icon('octopus_minor', key='forage_octopus_minor', board=True, label='낙지')
def octopus_minor(cv):
    X, Y = cv.X, cv.Y
    base = 0x8a6a5e
    # 길고 가는 다리 여덟 — 몸통 아래에서 흘러내린다
    rng = np.random.default_rng(4)
    for k in range(8):
        a0 = np.deg2rad(200 + k * 20)
        pts = []
        for j in range(9):
            t = j / 8.0
            r = 10 + t * 56
            ang = a0 + np.sin(t * 3.2 + k) * 0.35
            pts.append((60 + np.cos(ang) * r * 1.0 + 6, 58 - np.sin(ang) * r * 0.85 + 8))
        w = 4.2
        for j in range(len(pts) - 1):
            seg = capsule(X, Y, *pts[j], *pts[j + 1], w * (1 - j / 9.5))
            cv.paint(seg, lit(base, -0.05 - 0.15 * (k % 2)))
        cv.tint(polyline(X, Y, pts[:6], 1.0), lit(base, 0.3), 0.5)
    # 몸통(외투막) — 길쭉한 주머니, 위쪽
    u, v = cv.frame(64, 44, -100.0)
    mantle = ell(u, v, 10, 0, 24, 15) <= 1
    cv.paint(mantle, ramp(v / 30 + 0.5, cyl(base, hl=0.3, gloss=0.5, dark=0.5)))
    cv.tint(mantle & (noise(X.shape, 13, 2) > 0.62), 0x5a3a32, 0.45)
    for side in (-1, 1):
        cv.paint(ell(X, Y, 64 + side * 7, 58, 3.2, 2.6) <= 1, 0xd8c890)
        cv.paint(ell(X, Y, 64 + side * 7, 58, 1.6, 1.0) <= 1, 0x14100c)


# ─────────────────────────────────────────────
# 어종 — 왼쪽이 머리
# ─────────────────────────────────────────────
def _fish_body(cv, x0, x1, cy, top, bot, back, belly, line=None, split=0.42):
    """
    가로로 누운 물고기 몸통. top(t), bot(t) 는 0~1 길이 비율 t 에서 등 · 배까지의 높이(px).
    back/belly 색을 split 높이에서 섞는다. 몸 마스크와 (t, 세로 비율) 을 돌려준다.
    """
    X, Y = cv.X, cv.Y
    t = np.clip((X - x0) / (x1 - x0), 0, 1)
    tt, bb = top(t), bot(t)
    m = (X >= x0) & (X <= x1) & (Y >= cy - tt) & (Y <= cy + bb)
    s = (Y - (cy - tt)) / np.maximum(tt + bb, 1e-3)                                    # 0 = 등, 1 = 배
    col = ramp(s, [(0, lit(back, -0.25)), (0.12, back), (split - 0.05, lit(back, 0.12)), (split + 0.06, lit(belly, -0.08)),
                   (0.8, belly), (1.0, lit(belly, -0.3))])
    cv.paint(m, col)
    if line is not None:
        cv.tint(m & (np.abs(s - split) < 0.025) & (t > 0.2) & (t < 0.92), line, 0.6)
    return m, t, s


def _eye(cv, x, y, r, iris=0xc8b070):
    X, Y = cv.X, cv.Y
    cv.paint(disc(X, Y, x, y, r), iris)
    cv.paint(disc(X, Y, x, y, r * 0.62), 0x0c0e12)
    cv.tint(disc(X, Y, x - r * 0.3, y - r * 0.3, r * 0.22), 0xffffff, 0.9)


def _fin(cv, pts, color, rays=0.0):
    X, Y = cv.X, cv.Y
    m = poly(cv, pts)
    cv.paint(m, color, 0.92)
    if rays:
        xs = [p[0] for p in pts]
        cv.tint(m & (np.abs(np.sin(X * rays)) < 0.2), lit(color, -0.3), 0.6)
    return m


@icon('fish_round_herring', key='fish_round_herring', label='눈퉁멸')
def round_herring(cv):
    X, Y = cv.X, cv.Y
    x0, x1, cy = 10, 112, 66
    top = lambda t: 15 * np.sin(np.pi * np.clip(t * 0.92 + 0.06, 0, 1)) ** 0.75 * (1 - 0.55 * np.clip((t - 0.78) / 0.22, 0, 1))
    bot = lambda t: 14 * np.sin(np.pi * np.clip(t * 0.92 + 0.06, 0, 1)) ** 0.8 * (1 - 0.6 * np.clip((t - 0.78) / 0.22, 0, 1))
    _fin(cv, [(108, 66), (124, 50), (120, 66), (124, 82)], 0x56708a, 0.9)            # 꼬리
    _fin(cv, [(56, 52), (70, 42), (74, 52)], 0x5a7a96)                               # 등지느러미
    _fin(cv, [(78, 79), (90, 86), (92, 78)], 0xb8c4cc)
    m, t, s = _fish_body(cv, x0, x1, cy, top, bot, 0x2e5a88, 0xdfe6ea, line=0x9ab8d0, split=0.45)
    cv.tint(m & (s < 0.4) & (np.sin(X * 0.9 + Y * 0.5) > 0.6), 0x4a7aa8, 0.4)          # 비늘 결
    cv.tint(m & (np.abs(X - 34) < 1.0) & (s > 0.15) & (s < 0.9), 0x8aa0b0, 0.7)      # 아가미 뚜껑
    _eye(cv, 22, 63, 6.0, iris=0xd0b880)                                             # 큰 눈 — 이름의 유래
    cv.tint(m & (ell(X, Y, 60, 60, 26, 3) <= 1), 0xffffff, 0.35)


@icon('fish_sandfish', key='fish_sandfish', label='도루묵')
def sandfish(cv):
    X, Y = cv.X, cv.Y
    x0, x1, cy = 8, 110, 70
    top = lambda t: 19 * np.sin(np.pi * np.clip(t * 0.85 + 0.12, 0, 1)) ** 0.7 * (1 - 0.6 * np.clip((t - 0.75) / 0.25, 0, 1))
    bot = lambda t: 16 * np.sin(np.pi * np.clip(t * 0.9 + 0.08, 0, 1)) ** 0.8 * (1 - 0.65 * np.clip((t - 0.75) / 0.25, 0, 1))
    _fin(cv, [(106, 70), (122, 56), (124, 70), (122, 86)], 0x8a7a5a, 0.8)
    _fin(cv, [(34, 52), (44, 40), (54, 48), (100, 58), (104, 62), (34, 56)], 0xa89070, 0.9)  # 길게 이어진 등지느러미
    _fin(cv, [(50, 84), (100, 80), (104, 76), (50, 80)], 0xd8ccb0, 0.9)              # 뒷지느러미
    m, t, s = _fish_body(cv, x0, x1, cy, top, bot, 0x8a7656, 0xf0ece0, split=0.5)
    cv.tint(m & (s < 0.48) & (noise(X.shape, 31, 3) > 0.58), 0x5a4a32, 0.7)           # 등의 얼룩
    cv.tint(m & (s < 0.48) & (noise(X.shape, 33, 2) > 0.7), 0x3a2e20, 0.6)
    _fin(cv, [(32, 72), (48, 66), (54, 80), (40, 88)], 0xc8b08a, 1.2)                 # 큰 가슴지느러미
    cv.paint(capsule(X, Y, 8, 64, 15, 60, 1.6), 0x5a4a34)                             # 위로 열린 입
    _eye(cv, 20, 62, 4.8)
    cv.tint(m & (ell(X, Y, 64, 82, 30, 3) <= 1), 0xffffff, 0.4)


@icon('fish_tonguefish', key='fish_tonguefish', label='개서대')
def tonguefish(cv):
    X, Y = cv.X, cv.Y
    # 위에서 본 납작한 혀 — 둥근 머리에서 꼬리로 뾰족하게, 둘레를 지느러미가 감싼다
    u, v = cv.frame(12, 70, -8.0)
    t = np.clip(u / 108.0, 0, 1)
    hw = 22 * np.sin(np.pi * np.clip(t * 0.9 + 0.1, 0, 1)) ** 0.55 * (1 - 0.75 * t)
    fin = (u >= 2) & (u <= 112) & (np.abs(v) <= hw + 5 * (t > 0.06))
    cv.paint(fin, 0x8a6a42)
    cv.tint(fin & (np.abs(np.sin(u * 1.4)) < 0.25), 0x5a4228, 0.6)
    body = (u >= 0) & (u <= 106) & (np.abs(v) <= hw)
    cv.paint(body, ramp(v / (2 * np.maximum(hw, 1)) + 0.5, [(0, 0x6a5232), (0.3, 0x9a7e52), (0.6, 0x86683e), (1, 0x5a4428)]))
    cv.tint(body & (noise(X.shape, 41, 3) > 0.6), 0x4a3820, 0.6)
    cv.tint(body & (np.abs(v) < 0.8) & (t > 0.15) & (t < 0.9), 0x3a2a18, 0.7)          # 옆줄
    for side in (-1, 1):
        cv.tint(body & (np.abs(v - side * hw * 0.55) < 0.6) & (t > 0.2) & (t < 0.85), 0x3a2a18, 0.5)
    X0 = lambda uu, vv: (12 + uu * np.cos(np.deg2rad(-8)) - vv * np.sin(np.deg2rad(-8)),
                         70 + uu * np.sin(np.deg2rad(-8)) + vv * np.cos(np.deg2rad(-8)))
    for (uu, vv) in ((12, -5), (15, -1)):                                             # 한쪽으로 몰린 두 눈
        ex, ey = X0(uu, vv)
        _eye(cv, ex, ey, 2.4, iris=0xb8a070)


@icon('fish_black_scraper', key='fish_black_scraper', label='말쥐치')
def black_scraper(cv):
    X, Y = cv.X, cv.Y
    x0, x1, cy = 8, 108, 68
    top = lambda t: 22 * np.sin(np.pi * np.clip(t * 0.8 + 0.15, 0, 1)) ** 0.8 * (1 - 0.55 * np.clip((t - 0.78) / 0.22, 0, 1)) * np.clip(t * 4 + 0.15, 0, 1)
    bot = lambda t: 22 * np.sin(np.pi * np.clip(t * 0.8 + 0.15, 0, 1)) ** 0.8 * (1 - 0.55 * np.clip((t - 0.78) / 0.22, 0, 1)) * np.clip(t * 4 + 0.2, 0, 1)
    _fin(cv, [(104, 68), (124, 52), (122, 68), (124, 84)], 0x4a6a82, 0.8)
    _fin(cv, [(62, 48), (98, 56), (104, 62), (66, 52)], 0x5a7890, 1.0)                # 둘째 등지느러미
    _fin(cv, [(62, 88), (98, 80), (104, 74), (66, 84)], 0x5a7890, 1.0)                # 뒷지느러미
    m, t, s = _fish_body(cv, x0, x1, cy, top, bot, 0x4e6478, 0x8aa0b0, split=0.6)
    cv.tint(m & (noise(X.shape, 51, 3) > 0.6), 0x384a5a, 0.55)                        # 거친 피부 얼룩
    cv.tint(m & (np.sin(X * 1.6) * np.sin(Y * 1.6) > 0.6), 0x6a8296, 0.3)
    spine = poly(cv, [(31, 52), (37, 52), (36, 36), (33, 33)])                         # 첫 등지느러미 가시(눈 위)
    cv.paint(spine, ramp((X - 31) / 6, [(0, 0x6a8296), (1, 0x2a3440)]))
    cv.paint(ell(X, Y, 9, 66, 4, 3) <= 1, 0x2a3440)                                   # 뾰족한 주둥이
    _eye(cv, 28, 58, 4.2, iris=0x9ab0a0)
    _fin(cv, [(40, 70), (50, 66), (50, 74)], 0x7a94a8)
