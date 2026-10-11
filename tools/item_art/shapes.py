# -*- coding: utf-8 -*-
"""
@file shapes.py
@description 여러 그림이 같이 쓰는 몸통 — 병 · 봉지 · 캔 · 유리병 · 그릇 · 상자. 색과 치수만 바꿔 여러 물건을 그린다.
"""
import numpy as np
from kit import *


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def text_bars(cv, region, x0, x1, ys, color, seed=1, h=0.9, gap=1.3, wmin=2.0, wmax=5.0):
    """글자 대신 넣는 획 덩어리(가로줄 여러 개)"""
    rng = np.random.default_rng(seed)
    for yy in ys:
        x = x0
        while x < x1:
            w = rng.uniform(wmin, wmax)
            cv.paint(region & (cv.X >= x) & (cv.X <= min(x + w, x1)) & (np.abs(cv.Y - yy) < h), color)
            x += w + gap


def fish_mark(cv, region, cx, cy, s, color, flip=False):
    """작은 물고기 표장(몸 + 꼬리 + 눈)"""
    X, Y = cv.X, cv.Y
    k = -1 if flip else 1
    body = ell(X, Y, cx - k * s * 0.15, cy, s, s * 0.48) <= 1
    tail = poly(cv, [(cx + k * s * 0.7, cy), (cx + k * s * 1.35, cy - s * 0.55), (cx + k * s * 1.35, cy + s * 0.55)])
    cv.paint(region & (body | tail), color)
    cv.paint(region & disc(X, Y, cx - k * s * 0.7, cy - s * 0.1, max(0.7, s * 0.12)), lit(color, -0.7))


# ─────────────────────────────────────────────
# 병
# ─────────────────────────────────────────────
def bottle(cv, *, cx=64.0, top=14.0, bottom=114.0, body_w=17.0, neck_w=6.0, neck_h=16.0, shoulder=14.0,
           glass=0x7fb8a0, liquid=None, level=0.25, cap=0xd23a2a, cap_h=7.0, cap_w=None, label=None,
           label_y=(0.50, 0.86), label_col=0xf4f1e6, foot=4.0, clear=False, hl=0.26):
    """
    세로로 선 병. 반환값 = (몸 마스크, 라벨 마스크, 라벨 사각형(x0, y0, x1, y1)).
      glass 유리 · 플라스틱 색 / liquid 내용물 색(없으면 유리색) / level 위에서부터 빈 비율
      label(cv, mask, (x0, y0, x1, y1)) 로 라벨 그림을 그린다
    """
    X, Y = cv.X, cv.Y
    cap_w = cap_w or neck_w + 1.2
    y_cap1 = top + cap_h
    y_neck1 = y_cap1 + neck_h
    y_sh1 = y_neck1 + shoulder
    hw = np.where(Y < y_neck1, neck_w, neck_w + (body_w - neck_w) * smooth((Y - y_neck1) / max(shoulder, 1e-3)))
    hw = np.where(Y > bottom - foot, body_w - (1 - np.sqrt(np.clip(1 - ((Y - (bottom - foot)) / foot) ** 2, 0, 1))) * foot * 0.9, hw)
    body = (Y >= y_cap1 - 0.5) & (Y <= bottom) & (np.abs(X - cx) <= hw)
    t = (X - (cx - hw)) / np.maximum(2 * hw, 1e-3)
    if clear:
        cv.paint(body, ramp(t, [(0, lit(glass, -0.35)), (0.08, lit(glass, 0.1)), (hl - 0.05, lit(glass, 0.35)), (hl, 0xffffff),
                                (hl + 0.05, lit(glass, 0.45)), (0.7, lit(glass, 0.3)), (0.92, lit(glass, -0.1)), (1, lit(glass, -0.4))]))
    else:
        cv.paint(body, ramp(t, cyl(glass, hl=hl, gloss=0.6)))
    if liquid is not None:
        y_liq = y_neck1 + (bottom - y_neck1) * level
        lm = body & (Y >= y_liq) & (np.abs(X - cx) <= hw - 1.2) & (Y <= bottom - 1.2)
        cv.paint(lm, ramp(t, cyl(liquid, hl=hl, gloss=0.45)))
        cv.tint(lm & (Y < y_liq + 1.2), lit(liquid, 0.35), 0.9)
    # 병 주둥이 테 · 뚜껑
    cv.paint((Y >= y_cap1 - 0.5) & (Y <= y_cap1 + 2.0) & (np.abs(X - cx) <= neck_w + 0.8), ramp(t, cyl(lit(glass, -0.1), hl=hl)))
    capm = (Y >= top) & (Y < y_cap1) & (np.abs(X - cx) <= cap_w)
    capm &= ~((Y < top + 1.2) & (np.abs(X - cx) > cap_w - 1.2))
    cv.paint(capm, ramp((X - (cx - cap_w)) / (2 * cap_w), cyl(cap, hl=0.28, gloss=0.5)))
    cv.tint(capm & (np.mod(X - cx, 2.2) < 0.6) & (Y > top + 1.6), lit(cap, -0.45), 0.5)
    lab = np.zeros_like(body)
    rect = None
    if label is not None or label_col is not None:
        ly0 = top + (bottom - top) * label_y[0]
        ly1 = top + (bottom - top) * label_y[1]
        lab = body & (Y >= ly0) & (Y <= ly1)
        if label_col is not None:
            cv.paint(lab, ramp(t, [(0, lit(label_col, -0.4)), (0.1, lit(label_col, -0.08)), (hl, lit(label_col, 0.25)),
                                   (0.6, label_col), (0.9, lit(label_col, -0.25)), (1, lit(label_col, -0.5))]))
        rect = (cx - body_w, ly0, cx + body_w, ly1)
        if label is not None:
            label(cv, lab, rect)
    # 세로 광택 한 줄
    cv.tint(body & (np.abs(t - (hl - 0.02)) < 0.035) & (Y > y_neck1 + shoulder * 0.6) & ~lab, 0xffffff, 0.75)
    return body, lab, rect


# ─────────────────────────────────────────────
# 봉지(세워 둔 포대 · 파우치)
# ─────────────────────────────────────────────
def pouch(cv, *, cx=64.0, top=18.0, bottom=112.0, w=62.0, color=0xc9302a, seal=None, seal_h=8.0, window=None,
          window_fill=None, label=None, bulge=0.07, gusset=True, seed=1, notch=True, lean=0.0):
    """
    세워 둔 봉지. 반환값 = (몸 마스크, (x0, y0, x1, y1)).
      window=(x0f, y0f, x1f, y1f) 몸 안의 투명 창(0~1 비율) · window_fill(cv, mask, rect) 로 내용물을 그린다
    """
    X, Y = cv.X, cv.Y
    Xs = X - lean * (bottom - Y)
    t = np.clip((Y - top) / (bottom - top), 0, 1)
    hw = (w / 2) * (1 - bulge + bulge * 2 * np.maximum(np.sin(np.pi * np.clip(t * 0.9 + 0.1, 0, 1)), 0) ** 0.7)
    body = (Y >= top) & (Y <= bottom) & (np.abs(Xs - cx) <= hw)
    body &= ~((Y > bottom - 3) & (np.abs(Xs - cx) > hw - (Y - (bottom - 3)) * 1.0))
    tx = (Xs - (cx - hw)) / np.maximum(2 * hw, 1e-3)
    cv.paint(body, ramp(tx, [(0, lit(color, -0.35)), (0.07, lit(color, 0.05)), (0.2, lit(color, 0.3)), (0.3, lit(color, 0.12)),
                             (0.6, color), (0.85, lit(color, -0.22)), (1, lit(color, -0.48))]))
    # 구김 — 모서리에서 안으로 들어오는 짧은 주름 몇 가닥(밝은 선 옆에 그늘 선)
    rng = np.random.default_rng(seed)
    for _ in range(5):
        sx = rng.choice([-1, 1])
        x0 = cx + sx * (w / 2) * rng.uniform(0.55, 0.95)
        y0 = rng.uniform(top + seal_h + 4, bottom - 8)
        ln = rng.uniform(7, 15)
        x1, y1 = x0 - sx * ln * rng.uniform(0.5, 0.9), y0 + ln * rng.uniform(-0.7, 0.7)
        d = seg_dist(Xs, Y, x0, y0, x1, y1)
        cv.tint(body & (d < 0.7), lit(color, 0.4), 0.6)
        cv.tint(body & (seg_dist(Xs, Y, x0, y0 + 1.3, x1, y1 + 1.3) < 0.7), lit(color, -0.4), 0.45)
    if gusset:
        cv.tint(body & (t > 0.9), lit(color, -0.5), 0.5)
        cv.tint(body & (np.abs(t - 0.9) < 0.012), lit(color, -0.65), 0.7)
    seal = seal if seal is not None else lit(color, -0.25)
    sm = body & (Y < top + seal_h)
    cv.paint(sm, ramp(tx, [(0, lit(seal, -0.3)), (0.2, lit(seal, 0.25)), (0.6, seal), (1, lit(seal, -0.4))]))
    cv.tint(sm & (np.mod(Xs, 2.4) < 0.7), lit(seal, -0.45), 0.6)                 # 열 접착 줄무늬
    cv.tint(body & (np.abs(Y - (top + seal_h)) < 0.5), lit(color, -0.6), 0.7)
    if notch:
        cv.erase(poly(cv, [(cx + w / 2 - 6 + lean * (bottom - top), top - 1), (cx + w / 2 + 2 + lean * (bottom - top), top - 1),
                           (cx + w / 2 + 2 + lean * (bottom - top), top + 5)]))
    rect = (cx - w / 2, top + seal_h, cx + w / 2, bottom)
    if window is not None:
        x0 = rect[0] + (rect[2] - rect[0]) * window[0]; x1 = rect[0] + (rect[2] - rect[0]) * window[2]
        y0 = rect[1] + (rect[3] - rect[1]) * window[1]; y1 = rect[1] + (rect[3] - rect[1]) * window[3]
        wm = body & box(Xs, Y, x0, y0, x1, y1, 3.0)
        if window_fill is not None:
            window_fill(cv, wm, (x0, y0, x1, y1))
        cv.tint(wm & (np.abs((Xs - x0) - (Y - y0) * 0.5 - (x1 - x0) * 0.2) < 1.6), 0xffffff, 0.45)   # 비닐 광택
        edge = body & box(Xs, Y, x0 - 1, y0 - 1, x1 + 1, y1 + 1, 3.6) & ~wm
        cv.tint(edge, lit(color, -0.5), 0.6)
    if label is not None:
        label(cv, body & (Y > top + seal_h + 1), rect)
    return body, rect


def grains(cv, mask, rect, base, seed=3, size=1.6, density=0.5, dark=-0.35, light=0.35):
    """봉지 창 · 그릇 안의 알갱이(곡물 · 가루 · 조각)"""
    X, Y = cv.X, cv.Y
    cv.paint(mask, base)
    rng = np.random.default_rng(seed)
    x0, y0, x1, y1 = rect
    n = int((x1 - x0) * (y1 - y0) * density / (size * size))
    for _ in range(n):
        gx, gy = rng.uniform(x0, x1), rng.uniform(y0, y1)
        k = rng.uniform(dark, light)
        a = rng.uniform(0, np.pi)
        m = ell((X - gx) * np.cos(a) + (Y - gy) * np.sin(a), -(X - gx) * np.sin(a) + (Y - gy) * np.cos(a), 0, 0, size, size * 0.6) <= 1
        cv.paint(mask & m, lit(base, k))


# ─────────────────────────────────────────────
# 캔 · 유리병(단지)
# ─────────────────────────────────────────────
def can(cv, *, cx=64.0, top=34.0, bottom=104.0, hw=28.0, ry=7.0, color=0xf2c230, metal=0xc3ccd4, label=None, tab=True,
        rim=3.0, band=None):
    """세워 둔 캔. 반환값 = (옆면 마스크, (x0, y0, x1, y1))"""
    X, Y = cv.X, cv.Y
    side = ((Y >= top) & (Y <= bottom) & (np.abs(X - cx) <= hw)) | (ell(X, Y, cx, bottom, hw, ry) <= 1)
    side &= ~(ell(X, Y, cx, top, hw, ry) <= 1) | (Y >= top)
    tx = (X - (cx - hw)) / (2 * hw)
    cv.paint(side, ramp(tx, cyl(color, hl=0.27, gloss=0.5)))
    # 위 · 아래 금속 테
    yb = bottom + ry * np.sqrt(np.clip(1 - ((X - cx) / hw) ** 2, 0, 1))
    yt = top + ry * np.sqrt(np.clip(1 - ((X - cx) / hw) ** 2, 0, 1))
    cv.paint(side & (Y > yb - rim), ramp(tx, cyl(metal, hl=0.27)))
    cv.paint(side & (Y < yt + rim) & (Y >= top - 0.5), ramp(tx, cyl(metal, hl=0.27)))
    if band is not None:
        b0, b1, bc = band
        cv.paint(side & (Y > yt + (bottom - top) * b0) & (Y < yt + (bottom - top) * b1), ramp(tx, cyl(bc, hl=0.27, gloss=0.45)))
    rect = (cx - hw, top + ry + rim, cx + hw, bottom - rim)
    if label is not None:
        label(cv, side & (Y > yt + rim) & (Y < yb - rim), rect)
    # 뚜껑(위에서 본 타원)
    lid = ell(X, Y, cx, top, hw, ry) <= 1
    cv.paint(lid, ramp((X - (cx - hw)) / (2 * hw) * 0.7 + (Y - (top - ry)) / (2 * ry) * 0.3,
                       [(0, lit(metal, 0.5)), (0.4, lit(metal, 0.2)), (0.7, metal), (1, lit(metal, -0.3))]))
    cv.tint(lid & (ell(X, Y, cx, top, hw - 2.2, ry - 1.3) > 1), lit(metal, -0.35), 0.6)
    cv.tint(lid & (ell(X, Y, cx, top, hw - 3.4, ry - 1.9) <= 1) & (ell(X, Y, cx, top, hw - 4.4, ry - 2.5) > 1), lit(metal, -0.2), 0.5)
    if tab:
        tb = (ell(X, Y, cx + 2, top + 0.3, hw * 0.34, ry * 0.42) <= 1)
        cv.paint(tb, lit(metal, 0.35))
        cv.paint(ell(X, Y, cx + 5, top + 0.3, hw * 0.16, ry * 0.2) <= 1, lit(metal, -0.45))
        cv.paint(disc(X, Y, cx - hw * 0.26, top + 0.2, 1.4), lit(metal, -0.5))
    return side, rect


def jar(cv, *, cx=64.0, top=30.0, bottom=106.0, hw=24.0, lid=0xd23a2a, lid_h=12.0, lid_hw=None, glass=0xcfe3ea,
        content=None, level=0.12, content_fn=None, label=None, label_y=(0.45, 0.85), label_col=0xf4f1e6, corner=7.0):
    """유리 단지(넓은 뚜껑). 반환값 = (몸 마스크, 라벨 마스크)"""
    X, Y = cv.X, cv.Y
    lid_hw = lid_hw or hw + 1.5
    y0 = top + lid_h
    body = rrect(X, Y, cx, (y0 - 4 + bottom) / 2, hw, (bottom - y0 + 4) / 2, corner) & (Y >= y0 - 1)
    tx = (X - (cx - hw)) / (2 * hw)
    cv.paint(body, ramp(tx, [(0, lit(glass, -0.4)), (0.08, lit(glass, 0.0)), (0.2, lit(glass, 0.45)), (0.24, 0xffffff),
                             (0.3, lit(glass, 0.4)), (0.75, lit(glass, 0.15)), (0.93, lit(glass, -0.15)), (1, lit(glass, -0.45))]))
    if content is not None:
        yl = y0 + (bottom - y0) * level
        cm = rrect(X, Y, cx, (y0 - 4 + bottom) / 2, hw - 2.0, (bottom - y0 + 4) / 2 - 2.0, max(1.0, corner - 2)) & (Y >= yl)
        if content_fn is not None:
            content_fn(cv, cm, (cx - hw + 2, yl, cx + hw - 2, bottom - 2))
        else:
            cv.paint(cm, ramp(tx, cyl(content, hl=0.26, gloss=0.35)))
        cv.tint(cm & (Y < yl + 1.3), lit(content, 0.3), 0.8)
    lab = np.zeros_like(body)
    if label is not None or label_col is not None:
        ly0 = y0 + (bottom - y0) * label_y[0]; ly1 = y0 + (bottom - y0) * label_y[1]
        lab = body & (Y >= ly0) & (Y <= ly1)
        if label_col is not None:
            cv.paint(lab, ramp(tx, [(0, lit(label_col, -0.4)), (0.12, lit(label_col, -0.05)), (0.26, lit(label_col, 0.2)),
                                    (0.6, label_col), (0.9, lit(label_col, -0.25)), (1, lit(label_col, -0.5))]))
        if label is not None:
            label(cv, lab, (cx - hw, ly0, cx + hw, ly1))
    cv.tint(body & (np.abs(tx - 0.2) < 0.03) & ~lab, 0xffffff, 0.7)
    lm = rrect(X, Y, cx, top + lid_h / 2, lid_hw, lid_h / 2, 2.0)
    cv.paint(lm, ramp((X - (cx - lid_hw)) / (2 * lid_hw), cyl(lid, hl=0.27, gloss=0.5)))
    cv.tint(lm & (np.mod(X - cx, 2.6) < 0.7) & (Y > top + 2.5), lit(lid, -0.45), 0.45)
    cv.tint(lm & (Y < top + 2.0), lit(lid, 0.3), 0.6)
    return body, lab


# ─────────────────────────────────────────────
# 그릇
# ─────────────────────────────────────────────
def bowl(cv, *, cx=64.0, cy=62.0, rx=44.0, ry=15.0, depth=34.0, color=0xf2f0ea, inside=None, rim=3.0, foot=True,
         content=None, content_y=3.0, stripe=None):
    """
    위에서 비스듬히 본 그릇. content(cv, mask, (cx, cy, rx, ry)) 로 담긴 것을 그린다.
    반환값 = (안쪽 타원 마스크, 바깥 몸 마스크)
    """
    X, Y = cv.X, cv.Y
    inside = inside if inside is not None else lit(color, -0.12)
    t = np.clip((Y - cy) / depth, 0, 1)
    hw = rx * np.sqrt(np.clip(1 - (t * 0.82) ** 2, 0, 1)) * (1 - 0.25 * t ** 2)
    outer = (Y >= cy) & (Y <= cy + depth) & (np.abs(X - cx) <= hw)
    tx = (X - (cx - hw)) / np.maximum(2 * hw, 1e-3)
    cv.paint(outer, ramp(tx, [(0, lit(color, -0.45)), (0.1, lit(color, -0.1)), (0.25, lit(color, 0.35)), (0.35, lit(color, 0.1)),
                              (0.65, color), (0.88, lit(color, -0.25)), (1, lit(color, -0.5))]))
    cv.tint(outer & (t > 0.75), lit(color, -0.4), 0.45)
    if stripe is not None:
        cv.tint(outer & (np.abs(t - 0.22) < 0.05), stripe, 0.9)
    if foot:
        fm = box(X, Y, cx - rx * 0.36, cy + depth - 1, cx + rx * 0.36, cy + depth + 4.5, 1.5)
        cv.paint(fm, ramp((X - (cx - rx * 0.36)) / (rx * 0.72), [(0, lit(color, -0.5)), (0.3, lit(color, 0.1)), (1, lit(color, -0.55))]))
    top = ell(X, Y, cx, cy, rx, ry) <= 1
    cv.paint(top, ramp((X - (cx - rx)) / (2 * rx), [(0, lit(color, -0.1)), (0.25, lit(color, 0.5)), (0.6, lit(color, 0.2)), (1, lit(color, -0.25))]))
    inner = ell(X, Y, cx, cy + 0.6, rx - rim, ry - rim * 0.55) <= 1
    cv.paint(inner, ramp((Y - (cy - ry)) / (2 * ry), [(0, lit(inside, -0.35)), (0.45, lit(inside, -0.12)), (1, lit(inside, 0.15))]))
    if content is not None:
        cm = ell(X, Y, cx, cy + content_y, rx - rim - 2.0, ry - rim * 0.55 - 2.0) <= 1
        content(cv, cm, (cx, cy + content_y, rx - rim - 2.0, ry - rim * 0.55 - 2.0))
    return inner, outer


def steam(cv, cx, y0, n=3, spread=13.0, h=22.0, color=0xe8eef2):
    """김(물결 모양 세 가닥) — 뜨거운 음식"""
    X, Y = cv.X, cv.Y
    for i in range(n):
        x = cx + (i - (n - 1) / 2) * spread
        m = (np.abs(X - (x + 2.6 * np.sin((Y - y0) * 0.33 + i * 1.7))) < 1.25) & (Y < y0) & (Y > y0 - h + abs(i - (n - 1) / 2) * 4)
        cv.paint(m, color, 0.9)
