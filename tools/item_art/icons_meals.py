# -*- coding: utf-8 -*-
"""끼니 · 간식 · 마실 것 · 완성 요리"""
import numpy as np
from kit import *
from shapes import *


def _blobs(cv, mask, pts, color, r=3.0, ry=None, gloss=0.3):
    """그릇 안의 건더기(작은 덩이 여러 개)"""
    X, Y = cv.X, cv.Y
    for (x, y) in pts:
        m = mask & (ell(X, Y, x, y, r, ry or r * 0.7) <= 1)
        cv.paint(m, ramp((X - (x - r)) / (2 * r) * 0.6 + (Y - (y - r)) / (2 * r) * 0.4,
                         [(0, lit(color, gloss)), (0.45, color), (1, lit(color, -0.35))]))


def _soup(cv, color, toppings, bowl_col=0x2b2f35, stripe=None, inside=None, rx=46, cy=58):
    """국물 요리 한 그릇"""
    def content(cv, m, e):
        cx, ccy, erx, ery = e
        X, Y = cv.X, cv.Y
        cv.paint(m, ramp((Y - (ccy - ery)) / (2 * ery), [(0, lit(color, -0.25)), (0.5, color), (1, lit(color, 0.18))]))
        cv.tint(m & (ell(X, Y, cx - erx * 0.35, ccy - ery * 0.2, erx * 0.3, ery * 0.25) <= 1), lit(color, 0.45), 0.5)   # 기름 빛
        toppings(cv, m, e)
    return bowl(cv, cy=cy, rx=rx, ry=15, depth=36, color=bowl_col, inside=inside or lit(bowl_col, 0.1), content=content, stripe=stripe)


@icon('meal_soup', ids=['shop_meal_soup'], px=['px:it_dish_stew_red'], label='매운탕')
def meal_soup(cv):
    def top(cv, m, e):
        X, Y = cv.X, cv.Y
        fish = m & (ell(X, Y, 58, 58, 17, 6.5) <= 1)                                   # 생선 토막
        cv.paint(fish, ramp((Y - 51.5) / 13, [(0, 0xf4efe4), (0.6, 0xdcd3c2), (1, 0xa89f8c)]))
        cv.tint(fish & (np.mod(X, 5.0) < 0.9), 0xa89f8c, 0.6)
        _blobs(cv, m, [(82, 56), (76, 62), (40, 62)], 0xf4f1e6, r=4.2, ry=2.6)          # 무
        for (a, b, c, d) in ((70, 50, 86, 53), (36, 55, 48, 51), (60, 66, 76, 67)):     # 대파 · 쑥갓
            cv.paint(m & capsule(X, Y, a, b, c, d, 1.4), 0x3fa04a)
        _blobs(cv, m, [(50, 50), (88, 62)], 0xc9302a, r=2.6, ry=1.5)                    # 홍고추
    _soup(cv, 0xc2401c, top, bowl_col=0x33383e)


@icon('dish_stew_clear', px=['px:it_dish_stew_clear'], label='맑은탕')
def dish_stew_clear(cv):
    def top(cv, m, e):
        X, Y = cv.X, cv.Y
        fish = m & (ell(X, Y, 60, 58, 17, 6.5) <= 1)
        cv.paint(fish, ramp((Y - 51.5) / 13, [(0, 0xffffff), (0.6, 0xe8e2d4), (1, 0xb5ad9a)]))
        cv.tint(fish & (np.mod(X, 5.0) < 0.9), 0xb5ad9a, 0.6)
        _blobs(cv, m, [(84, 57), (40, 60), (78, 64)], 0xf8f5ea, r=4.4, ry=2.7)
        for (a, b, c, d) in ((70, 50, 88, 52), (34, 54, 48, 50), (56, 66, 72, 67), (44, 66, 52, 63)):
            cv.paint(m & capsule(X, Y, a, b, c, d, 1.4), 0x4fb05a)
        _blobs(cv, m, [(52, 50)], 0xc9302a, r=2.4, ry=1.4)
    _soup(cv, 0xe9dfb8, top, bowl_col=0x33383e)


@icon('meal_abalone', ids=['shop_meal_abalone'], px=['px:it_dish_porridge'], label='전복죽')
def meal_abalone(cv):
    def top(cv, m, e):
        X, Y = cv.X, cv.Y
        n = noise(cv.a.shape, 4, 2)
        cv.tint(m & (n > 0.62), 0xf6f0c8, 0.6)                                         # 쌀알 결
        _blobs(cv, m, [(52, 56), (70, 60), (60, 64), (80, 54), (42, 62)], 0xc9a86a, r=4.6, ry=2.6, gloss=0.4)   # 전복 살
        cv.paint(m & (ell(X, Y, 64, 54, 5.0, 2.8) <= 1), 0xf2c230)                       # 노른자
        cv.paint(m & (ell(X, Y, 63, 53.4, 2.0, 1.0) <= 1), 0xfff0a0)
        for (x, y) in ((76, 64), (48, 50), (86, 60)):
            cv.paint(m & box(X, Y, x - 2.4, y - 0.7, x + 2.4, y + 0.7), 0x2b2f35)        # 김가루
        _blobs(cv, m, [(56, 50), (72, 52), (66, 66)], 0x3fa04a, r=1.4, ry=0.9)
    _soup(cv, 0xd9cf9a, top, bowl_col=0xf2f0ea, stripe=0x2a78c8)


@icon('meal_grilled', ids=['shop_meal_grilled'], px=['px:it_dish_grill'], colors=44, label='생선구이 정식')
def meal_grilled(cv):
    X, Y = cv.X, cv.Y
    # 긴 접시에 구운 생선 한 마리 + 레몬 · 무즙
    plate = ell(X, Y, 64, 74, 56, 26) <= 1
    cv.paint(plate, ramp((X - 8) / 112 * 0.6 + (Y - 48) / 52 * 0.4, [(0, 0xffffff), (0.5, 0xeef2f5), (1, 0xb9c4cd)]))
    cv.paint(ell(X, Y, 64, 73, 48, 20) <= 1, ramp((Y - 53) / 40, [(0, 0xd9e1e7), (0.5, 0xeef2f5), (1, 0xffffff)]))
    body = ell(X, Y, 60, 72, 36, 11.5) <= 1
    tail = poly(cv, [(92, 72), (108, 61), (104, 72), (108, 83)])
    cv.paint(body | tail, ramp((Y - 60.5) / 23, [(0, 0xd9a05a), (0.35, 0xb9762e), (0.7, 0x8a5420), (1, 0x5e3712)]))
    cv.tint(body & (np.mod(X + Y * 0.6, 9.0) < 2.0) & (Y < 76), 0x3a220c, 0.75)          # 석쇠 자국
    cv.tint(body & (ell(X, Y, 56, 67, 22, 3.2) <= 1), 0xf2c890, 0.5)
    head = body & (X < 36)
    cv.tint(head, 0x8a5420, 0.5)
    cv.paint(disc(X, Y, 33, 70, 2.2), 0xf4f1e6)
    cv.paint(disc(X, Y, 33, 70, 1.0), 0x15181c)
    cv.tint(body & (np.abs(X - 39) < 0.6), 0x3a220c, 0.8)
    lem = ell(X, Y, 96, 90, 8.5, 5.0) <= 1                                              # 레몬 조각
    cv.paint(lem, 0xf2d02a)
    cv.paint(ell(X, Y, 96, 90, 6.5, 3.6) <= 1, 0xfff6c8)
    cv.paint(ell(X, Y, 30, 88, 7.5, 5.0) <= 1, ramp((Y - 83) / 10, [(0, 0xffffff), (1, 0xcfd8df)]))   # 무즙
    cv.paint(capsule(X, Y, 44, 88, 58, 91, 1.3), 0x3fa04a)


@icon('meal_eel', ids=['shop_meal_eel'], colors=44, label='장어구이')
def meal_eel(cv):
    X, Y = cv.X, cv.Y
    # 검은 긴 접시(얇다)에 양념 장어 세 토막 + 생강채
    top = poly(cv, [(6, 88), (30, 50), (122, 50), (98, 88)])
    edge = poly(cv, [(6, 88), (98, 88), (98, 96), (6, 96)]) | poly(cv, [(98, 88), (122, 50), (122, 58), (98, 96)])
    cv.paint(edge, ramp((Y - 50) / 46, [(0, 0x22262b), (1, 0x0c0e10)]))
    cv.paint(top, ramp((Y - 50) / 38, [(0, 0x4a5058), (0.3, 0x33383e), (1, 0x2b2f35)]))
    cv.tint(top & (seg_dist(X, Y, 8, 86.5, 31, 51.5) < 0.9), 0x7a848e, 0.8)
    for k in range(3):
        x0 = 26 + k * 25
        piece = poly(cv, [(x0, 82), (x0 + 14, 58), (x0 + 36, 58), (x0 + 22, 82)])
        cv.paint(piece, ramp(np.clip((82 - Y) / 24, 0, 1), [(0, 0x6b3410), (0.3, 0xa85a1c), (0.7, 0xc9782a), (1, 0xe9a04a)]))
        cv.tint(piece & (np.mod(X + Y * 0.58, 6.0) < 1.2), 0x3a1c08, 0.55)              # 칼집 · 그을음
        cv.tint(piece & (np.abs(Y - 63) < 1.0), 0xffd9a0, 0.6)                           # 양념 광
        cv.tint(piece & (Y > 79), 0x3a1c08, 0.6)
    for (a, b, c, d) in ((98, 70, 110, 60), (100, 73, 113, 64), (96, 68, 106, 58)):       # 생강채
        cv.paint(capsule(X, Y, a, b, c, d, 1.0), 0xf6e6a8)
    _blobs(cv, top, [(20, 80), (25, 84)], 0x3fa04a, r=2.6, ry=1.5)


@icon('dish_braise', px=['px:it_dish_braise'], label='조림')
def dish_braise(cv):
    def top(cv, m, e):
        X, Y = cv.X, cv.Y
        fish = m & (ell(X, Y, 60, 57, 20, 7.5) <= 1)
        cv.paint(fish, ramp((Y - 49.5) / 15, [(0, 0xd9a05a), (0.5, 0x9a5a22), (1, 0x5e3712)]))
        cv.tint(fish & (np.mod(X, 6.0) < 1.0), 0x3a220c, 0.6)
        _blobs(cv, m, [(86, 58), (38, 62), (78, 65)], 0xc9a05a, r=5.0, ry=3.0)          # 조린 무
        _blobs(cv, m, [(52, 50), (70, 51)], 0xc9302a, r=2.4, ry=1.4)
        for (a, b, c, d) in ((60, 66, 74, 67), (44, 52, 50, 49)):
            cv.paint(m & capsule(X, Y, a, b, c, d, 1.3), 0x3fa04a)
    _soup(cv, 0x6b2f14, top, bowl_col=0x8a5a2a, rx=46)


@icon('dish_stirfry', px=['px:it_dish_stirfry'], label='볶음')
def dish_stirfry(cv):
    X, Y = cv.X, cv.Y
    plate = ell(X, Y, 64, 76, 54, 24) <= 1
    cv.paint(plate, ramp((X - 10) / 108 * 0.6 + (Y - 52) / 48 * 0.4, [(0, 0xffffff), (0.5, 0xeef2f5), (1, 0xb9c4cd)]))
    cv.paint(ell(X, Y, 64, 75, 45, 18) <= 1, ramp((Y - 57) / 36, [(0, 0xd9e1e7), (1, 0xffffff)]))
    heap = (ell(X, Y, 64, 70, 36, 15) <= 1) | (ell(X, Y, 62, 62, 24, 11) <= 1)
    cv.paint(heap, ramp((Y - 51) / 34, [(0, 0xd9782a), (0.5, 0xa84a1a), (1, 0x6b2a10)]))
    rng = np.random.default_rng(7)
    for _ in range(26):                                                              # 오징어 · 채소 조각
        x, y = rng.uniform(34, 94), rng.uniform(54, 80)
        a = rng.uniform(0, np.pi)
        col = rng.choice([0xf4e6d0, 0xf4e6d0, 0x3fa04a, 0xc9302a, 0xf2c230, 0xe9a04a])
        cv.paint(heap & capsule(X, Y, x, y, x + 6 * np.cos(a), y + 3.5 * np.sin(a), 1.5), int(col))
    _blobs(cv, heap, [(58, 56), (70, 60), (50, 64)], 0xfff6de, r=1.0, ry=0.7)           # 깨


@icon('riceball', ids=['shop_riceball'], label='주먹밥')
def riceball(cv):
    X, Y = cv.X, cv.Y
    tri = poly(cv, [(64, 20), (106, 96), (22, 96)])
    body = tri | (disc(X, Y, 64, 34, 16) & (Y < 40)) | disc(X, Y, 34, 90, 14) | disc(X, Y, 94, 90, 14) | box(X, Y, 34, 80, 94, 104, 2)
    n = noise(cv.a.shape, 5, 1)
    cv.paint(body, ramp((X - 20) / 88 * 0.5 + (Y - 18) / 86 * 0.5 + (n - 0.5) * 0.25, [(0, 0xffffff), (0.5, 0xf4f1e6), (0.8, 0xdcd6c4), (1, 0xb9b29c)]))
    cv.tint(body & (n > 0.72), 0xffffff, 0.8)                                          # 밥알
    cv.tint(body & (n < 0.26), 0xcfc8b2, 0.6)
    nori = box(X, Y, 44, 66, 84, 106, 2) & body
    cv.paint(nori, ramp((X - 44) / 40, [(0, 0x1b2a22), (0.25, 0x2f4638), (0.5, 0x1b2a22), (1, 0x0c1410)]))
    cv.tint(nori & (np.mod(X * 1.3 + Y, 6.0) < 0.8), 0x3f5a48, 0.6)
    cv.paint(disc(X, Y, 64, 40, 4.2), 0xc9302a)                                         # 매실 장아찌
    cv.paint(disc(X, Y, 62.8, 38.8, 1.3), 0xff8a7a)


@icon('snackbar', ids=['shop_snackbar'], label='초코바')
def snackbar(cv):
    X, Y = cv.X, cv.Y
    u, v = cv.frame(20, 96, -26.0)
    wrap = (u >= 0) & (u <= 100) & (np.abs(v) <= 13)
    wrap &= ~((u < 5) & (np.mod(v + 13, 4.0) < 2.0) & (u < 3 + 2 * np.sin(v)))          # 톱니 끝
    cv.paint(wrap, ramp(v / 26 + 0.5, cyl(0xc9302a, hl=0.3, gloss=0.6)))
    cv.tint(wrap & ((u < 8) | (u > 92)), 0x7d1f1a, 0.55)
    cv.tint(wrap & (np.mod(u, 2.2) < 0.6) & ((u < 8) | (u > 92)), 0xff8a7a, 0.5)
    band = wrap & (u > 20) & (u < 64) & (np.abs(v) < 8)
    cv.paint(band, 0xf6e08a)
    for k in range(5):
        cv.paint(band & (np.abs(u - (26 + k * 8)) < 2.2) & (np.abs(v) < 4.5), 0x6b3410)
    # 뜯긴 끝으로 보이는 초콜릿
    choc = (u > 66) & (u <= 104) & (np.abs(v) <= 10.5)
    cv.paint(choc, ramp(v / 21 + 0.5, cyl(0x5e3312, hl=0.3, gloss=0.45)))
    cv.tint(choc & (np.abs(np.mod(u - 66, 12.6) - 12.0) < 0.7), 0x2e1708, 0.8)          # 조각 홈
    tear = (u > 60) & (u < 70) & (np.abs(v) <= 13) & (np.mod(v * 1.7 + u * 0.6, 5.0) < 2.6)
    cv.paint(tear, 0xdfe5ea)
    bite = disc(u, v, 106, -4, 7.5)
    cv.erase(bite)


@icon('coffee', ids=['shop_coffee'], label='아메리카노')
def coffee(cv):
    X, Y = cv.X, cv.Y
    # 종이컵(뚜껑 · 홀더)
    t = np.clip((Y - 34) / 78, 0, 1)
    hw = 25 - 6.5 * t
    cup = (Y >= 34) & (Y <= 112) & (np.abs(X - 64) <= hw)
    cv.paint(cup, ramp((X - (64 - hw)) / (2 * hw), cyl(0xf4f1e6, hl=0.28, gloss=0.5, dark=0.35)))
    sl = cup & (Y > 58) & (Y < 92)
    cv.paint(sl, ramp((X - (64 - hw)) / (2 * hw), cyl(0xa8743a, hl=0.28, gloss=0.3)))
    cv.tint(sl & (np.mod(X, 3.0) < 0.8), 0x7a4f22, 0.45)                                # 골판지 홈
    bean = sl & (ell(X, Y, 64, 75, 5.5, 7.5) <= 1)
    cv.paint(bean, 0x4a2a12)
    cv.paint(bean & (np.abs(X - 64 - 1.2 * np.sin((Y - 75) * 0.5)) < 0.7), 0xa8743a)
    lid = box(X, Y, 36, 24, 92, 36, 4)
    cv.paint(lid, ramp((X - 36) / 56, cyl(0x2b2f35, hl=0.28, gloss=0.5)))
    cv.paint(box(X, Y, 42, 18, 86, 26, 3), ramp((X - 42) / 44, cyl(0x33383e, hl=0.28, gloss=0.5)))
    cv.paint(box(X, Y, 70, 19.5, 78, 22, 1), 0x0c0e10)


@icon('latte', ids=['shop_latte'], colors=44, label='카페라떼')
def latte(cv):
    X, Y = cv.X, cv.Y

    def content(cv, m, e):
        cx, cy, rx, ry = e
        cv.paint(m, 0xc98a4a)
        heart = m & ((ell(X, Y, cx - 5, cy - 1, 6.5, 3.6) <= 1) | (ell(X, Y, cx + 5, cy - 1, 6.5, 3.6) <= 1)
                     | poly(cv, [(cx - 11, cy), (cx + 11, cy), (cx, cy + 7)]))
        cv.paint(heart, 0xfff6de)
        cv.paint(m & ring(X, Y, cx, cy, rx, ry, 1.6), 0xe9c090)
    bowl(cv, cx=58, cy=58, rx=36, ry=12, depth=36, color=0xf2f0ea, content=content, content_y=1.5)
    hd = ring(X, Y, 100, 74, 13, 13, 4.0) & (X > 92)                                    # 손잡이
    cv.paint(hd, ramp((X - 92) / 21, [(0, 0xffffff), (0.5, 0xe2e0d8), (1, 0xa9a698)]))
    sau = (ell(X, Y, 60, 102, 54, 11) <= 1) & (Y > 96)                                  # 받침
    cv.paint(sau, ramp((X - 6) / 108, [(0, 0xb9b6a8), (0.25, 0xffffff), (0.6, 0xe8e6de), (1, 0xa9a698)]))


@icon('dessert', ids=['shop_dessert'], colors=44, label='수제 디저트')
def dessert(cv):
    X, Y = cv.X, cv.Y
    plate = (ell(X, Y, 64, 100, 54, 12) <= 1)
    cv.paint(plate, ramp((X - 10) / 108, [(0, 0xb9c4cd), (0.25, 0xffffff), (0.6, 0xeef2f5), (1, 0xa9b6c1)]))
    # 조각 케이크 — 옆면(시트 · 크림 층)과 윗면
    side = poly(cv, [(24, 62), (88, 62), (88, 98), (24, 98)])
    cv.paint(side, ramp((Y - 62) / 36, [(0, 0xfff6de), (0.2, 0xfff6de), (0.21, 0xf2c890), (0.45, 0xe9b06a), (0.46, 0xfff6de), (0.58, 0xfff6de),
                                         (0.59, 0xf2c890), (0.85, 0xe9b06a), (0.86, 0xc9905a), (1, 0xa8703a)]))
    cv.tint(side & (X > 70), 0x8a5a2a, 0.25)
    right = poly(cv, [(88, 62), (106, 50), (106, 86), (88, 98)])
    cv.paint(right, ramp((Y - 50) / 48, [(0, 0xf2e6c8), (0.3, 0xd9a868), (0.5, 0xe9dcc0), (0.75, 0xc9905a), (1, 0x8a5a2a)]))
    top = poly(cv, [(24, 62), (42, 50), (106, 50), (88, 62)])
    cv.paint(top, ramp((X - 24) / 82, [(0, 0xffffff), (0.6, 0xfff6de), (1, 0xe9dcc0)]))
    for k in range(4):                                                               # 흘러내린 크림
        cv.paint(ell(X, Y, 32 + k * 16, 63, 5.5, 5.0 + (k % 2) * 3) <= 1, 0xffffff)
    berry = cv.ball(62, 46, 9.5, 0xd2202a, ry=9, gloss=0.6)                             # 딸기
    for dx, dy in ((-3, 2), (2, -1), (4, 4), (-1, 6), (-5, -2)):
        cv.paint(disc(X, Y, 62 + dx, 46 + dy, 0.7), 0xffe27a)
    cv.paint(poly(cv, [(56, 38), (62, 34), (68, 38), (62, 41)]), 0x3fa04a)
    cv.paint(ell(X, Y, 84, 52, 6, 3.4) <= 1, 0xfffdf4)


@icon('anju', ids=['shop_anju'], colors=44, label='해물 안주')
def anju(cv):
    X, Y = cv.X, cv.Y
    plate = ell(X, Y, 64, 78, 56, 25) <= 1
    cv.paint(plate, ramp((X - 8) / 112 * 0.6 + (Y - 53) / 50 * 0.4, [(0, 0x4a5058), (0.5, 0x2b2f35), (1, 0x121418)]))
    cv.paint(ell(X, Y, 64, 77, 47, 19) <= 1, ramp((Y - 58) / 38, [(0, 0x1f2328), (1, 0x33383e)]))
    # 오징어 숙회 고리 · 문어 다리 · 초장
    for (x, y) in ((40, 70), (54, 80), (46, 88), (62, 68)):
        rg = ring(X, Y, x, y, 8.5, 5.5, 2.8)
        cv.paint(rg, ramp((Y - (y - 5.5)) / 11, [(0, 0xffffff), (0.6, 0xf4e6e0), (1, 0xd9b8b0)]))
    leg = polyline(X, Y, [(72, 86), (82, 78), (92, 80), (100, 72)], 4.0)
    cv.paint(leg, ramp((Y - 68) / 22, [(0, 0xc94a5a), (0.6, 0xa82a3a), (1, 0x7a1a28)]))
    for (x, y) in ((76, 84), (83, 80), (90, 81), (97, 76)):
        cv.paint(disc(X, Y, x, y + 1, 1.5), 0xf6d9d9)
    cup = ell(X, Y, 86, 62, 10, 5.5) <= 1
    cv.paint(cup, 0xf2f0ea)
    cv.paint(ell(X, Y, 86, 62.3, 7.8, 3.9) <= 1, 0xc9302a)
    for (a, b, c, d) in ((28, 80, 36, 76), (30, 84, 38, 82)):
        cv.paint(capsule(X, Y, a, b, c, d, 1.4), 0x3fa04a)
    cv.paint(ell(X, Y, 30, 72, 5, 3) <= 1, 0xf2d02a)
