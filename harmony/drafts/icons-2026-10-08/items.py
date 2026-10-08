import numpy as np
from hi import *

def ell(X, Y, cx, cy, rx, ry):
    return ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2

def rrect(X, Y, cx, cy, hw, hh, r):
    dx = np.maximum(np.abs(X - cx) - (hw - r), 0); dy = np.maximum(np.abs(Y - cy) - (hh - r), 0)
    return (dx * dx + dy * dy <= r * r) & (np.abs(X - cx) <= hw) & (np.abs(Y - cy) <= hh)

def headlamp(path, strap=(0xff9a3c, 0xf07a1a, 0xb9520c, 0x7a3406)):
    """어촌계 실습생 헤드랜턴 — 주황 머리띠 + 검은 램프 뭉치(앞 3/4 위에서 본 모습)"""
    cv = Canvas(); X, Y = cv.X, cv.Y
    cx = 64.0; RX, RY = 55.0, 21.0; yT, yB = 50.0, 70.0      # 띠 위 · 아래 테두리 타원 중심
    eT, eB = ell(X, Y, cx, yT, RX, RY), ell(X, Y, cx, yB, RX, RY)
    eTi, eBi = ell(X, Y, cx, yT, RX - 4.2, RY - 3.4), ell(X, Y, cx, yB, RX - 4.2, RY - 3.4)
    sil = (eT <= 1) | (eB <= 1) | ((np.abs(X - cx) <= RX) & (Y >= yT) & (Y <= yB))
    hole = (eTi <= 1) & (eBi <= 1)
    inner = (eTi <= 1) & (eBi > 1)                      # 고리 안쪽으로 보이는 뒷면
    rim = (eT <= 1) & (eTi > 1)                         # 띠 윗단
    front = sil & ~(eT <= 1)                            # 앞면
    c_hi, c_mid, c_lo, c_dk = strap
    side = np.abs(X - cx) / RX                          # 0=정면 1=옆
    # 뒷면(어둡게)
    cv.paint(inner, ramp(side, [(0, 0x8a3f0a), (1, 0x5a2805)]))
    cv.tint(inner & (np.mod(X, 3.0) < 0.9), hexrgb(0x3d1b03), 0.5)
    # 앞면 — 원통 음영 + 가운데 반사 줄 + 짜임
    ytop = yT + RY * np.sqrt(np.clip(1 - ((X - cx) / RX) ** 2, 0, 1))
    tv = (Y - ytop) / (yB - yT)
    cv.paint(front, ramp(side, [(0, c_hi), (0.45, c_mid), (0.8, c_lo), (1, c_dk)]))
    cv.tint(front & (np.mod(X + Y * 0.0, 2.6) < 0.7), hexrgb(c_dk), 0.28)                  # 고무줄 골
    stripe = front & (np.abs(tv - 0.5) < 0.17)
    cv.paint(stripe, ramp(side, [(0, 0xf4f6f7), (0.5, 0xc9d0d5), (1, 0x7d868d)]))
    cv.tint(stripe & (np.mod(X + (Y - ytop) * 0.9, 6.0) < 2.6), hexrgb(0x4a525a), 0.85)    # 반사띠 빗금
    cv.tint(front & (tv > 0.86), hexrgb(c_dk), 0.55)
    cv.paint(rim, ramp(side, [(0, 0xffc98a), (0.6, c_hi), (1, c_lo)]))
    # 길이 조절 버클(오른쪽 옆)
    bk = rrect(X, Y, 107.5, 66, 3.6, 8.5, 1.2) & front
    cv.paint(bk, ramp((Y - 57) / 18, [(0, 0x5b626a), (0.4, 0x2c3036), (1, 0x16181c)]))
    cv.tint(rrect(X, Y, 107.5, 62.6, 1.9, 2.2, 0.5) & front, hexrgb(0xb9520c), 1.0)
    cv.tint(rrect(X, Y, 107.5, 69.4, 1.9, 2.2, 0.5) & front, hexrgb(0xb9520c), 1.0)
    # ── 램프 뭉치 ──
    lx, ly = 64.0, 84.0
    plate = rrect(X, Y, lx, ly - 1, 26.0, 16.0, 4.0)                       # 받침(힌지 판)
    cv.paint(plate, ramp((Y - (ly - 17)) / 32, [(0, 0x4a5058), (0.3, 0x2f343a), (1, 0x14161a)]))
    body = rrect(X, Y, lx, ly + 2, 22.0, 17.0, 6.0)
    tyb = (Y - (ly - 15)) / 34
    cv.paint(body, ramp(tyb, [(0, 0x6a727b), (0.1, 0x4b5259), (0.14, 0x33383e), (0.8, 0x22262b), (1, 0x0f1114)]))
    cv.tint(body & (np.abs(X - lx) > 18.5), hexrgb(0x0f1114), 0.45)
    # 옆 방열 골
    for sx in (-19.5, 19.5):
        for k in range(4):
            cv.tint(body & (np.abs(X - (lx + sx)) < 1.6) & (np.abs(Y - (ly - 6 + k * 4.2)) < 0.8), hexrgb(0x8a929a), 0.7)
    # 렌즈
    r = np.sqrt((X - lx) ** 2 + (Y - (ly + 3)) ** 2)
    ang = np.arctan2(Y - (ly + 3), X - lx)
    cv.paint(r <= 13.6, ramp((np.cos(ang + 2.2) + 1) / 2, [(0, 0x3a4047), (0.5, 0x9aa3ab), (0.8, 0xe8edf0), (1, 0xffffff)]))   # 알루미늄 테
    cv.paint(r <= 11.2, hexrgb(0x15181c))
    cv.paint(r <= 10.4, ramp(r / 10.4, [(0, 0xffffff), (0.3, 0xffffff), (0.32, 0xfff3a8), (0.46, 0xffe27a), (0.48, 0xe4e9ec), (0.74, 0xc2cad1), (0.76, 0x8e98a1), (1, 0x66707a)]))
    # 반사경 살
    cv.tint((r <= 10.4) & (r > 5.6) & (np.mod(ang, np.pi / 6) < 0.09), hexrgb(0x4d565e), 0.6)
    # 유리 글린트
    cv.tint((r <= 9.6) & (r > 7.6) & (ang > -2.75) & (ang < -1.75), hexrgb(0xffffff), 0.9)
    cv.tint((r <= 9.6) & (r > 8.4) & (ang > 0.5) & (ang < 1.2), hexrgb(0xffffff), 0.6)
    # 위쪽 고무 단추 · 충전 표시등
    btn = rrect(X, Y, lx + 9, ly - 16.2, 5.0, 2.2, 1.6)
    cv.paint(btn, ramp((Y - (ly - 18.4)) / 4.4, [(0, 0xffb060), (0.5, 0xf07a1a), (1, 0x9a4708)]))
    cv.paint(ell(X, Y, lx - 12, ly - 11.5, 1.5, 1.5) <= 1, hexrgb(0x6dff8a))
    return finish(cv, colors=44, path=path, outline=0x14171c)

def lantern(path):
    """등대지기의 랜턴 — 놋쇠 몸통 · 유리 등피 · 철사 망 · 손잡이 고리"""
    cv = Canvas(); X, Y = cv.X, cv.Y
    cx = 64.0
    def brass(t):   # 원통 음영(왼쪽 밝은 줄)
        return ramp(t, [(0, 0x6b4a14), (0.12, 0x9a7220), (0.26, 0xf6dc7a), (0.34, 0xffefad), (0.42, 0xd9ae3c), (0.7, 0xb0832a), (0.9, 0x7a5718), (1, 0x4d360e)])
    # 손잡이 고리
    e_out, e_in = ell(X, Y, cx, 40, 30, 33), ell(X, Y, cx, 40, 27.2, 30.2)
    bail = (e_out <= 1) & (e_in > 1) & (Y < 41)
    cv.paint(bail, ramp((X - 34) / 60, [(0, 0x7a5718), (0.3, 0xe9c85a), (0.5, 0xb0832a), (1, 0x5e430f)]))
    for sx in (-28.6, 28.6):                      # 고리 걸이
        cv.paint(ell(X, Y, cx + sx, 41, 2.6, 2.6) <= 1, hexrgb(0x8a6a1e))
    # 등피(유리) — 통 모양
    gy0, gy1 = 44.0, 88.0
    tg = (Y - gy0) / (gy1 - gy0)
    ghw = 19.0 + 6.5 * np.maximum(np.sin(np.pi * np.clip(tg, 0, 1)), 0) ** 0.8
    glass = (Y >= gy0) & (Y <= gy1) & (np.abs(X - cx) <= ghw)
    rr = np.sqrt(((X - cx) / 22.0) ** 2 + ((Y - 68) / 24.0) ** 2)
    cv.paint(glass, ramp(rr, [(0, 0xffffff), (0.18, 0xfffbd8), (0.2, 0xfff0a0), (0.48, 0xffd95a), (0.5, 0xf7b93a), (0.78, 0xe7952a), (0.8, 0xc7772a), (1.0, 0x9a5a2a), (1.3, 0x6c4a3a)]))
    # 불꽃(심지)
    fl = ell(X, Y, cx, 68, 3.2, 7.0) <= 1
    cv.paint(fl & glass, hexrgb(0xffffff))
    cv.paint((ell(X, Y, cx, 78, 4.2, 2.0) <= 1) & glass, hexrgb(0x5e430f))
    # 유리 광택
    xs = (X - cx) / ghw
    cv.tint(glass & (xs > -0.80) & (xs < -0.62) & (tg > 0.12) & (tg < 0.8), hexrgb(0xffffff), 0.8)
    cv.tint(glass & (xs > -0.52) & (xs < -0.46) & (tg > 0.2) & (tg < 0.55), hexrgb(0xffffff), 0.6)
    cv.tint(glass & (np.abs(xs) > 0.93), hexrgb(0x5a4a3a), 0.6)
    # 철사 망 — 세로 살 4 + 가로 테 2
    for fx in (-0.62, -0.2, 0.25, 0.66):
        cv.paint(glass & (np.abs(xs - fx) < 0.045), ramp(tg, [(0, 0x8a6a1e), (0.5, 0x5e430f), (1, 0x8a6a1e)]))
    for ty in (0.3, 0.72):
        bow = ty + 0.05 * (1 - xs ** 2)
        cv.paint(glass & (np.abs(tg - bow) < 0.03), brass((xs + 1) / 2))
    # 윗뚜껑 — 굴뚝 + 갓
    cap = (Y >= 37) & (Y <= 45) & (np.abs(X - cx) <= 21.5 - (45 - Y) * 0.55)
    cv.paint(cap, brass((X - (cx - 21.5)) / 43))
    cv.tint(cap & (Y > 43.3), hexrgb(0x4d360e), 0.6)
    chim = (Y >= 27) & (Y < 37) & (np.abs(X - cx) <= 11.5)
    cv.paint(chim, brass((X - (cx - 11.5)) / 23))
    for vy in (30.0, 33.2):                     # 통풍 구멍
        for vx in (-6.5, -1.5, 3.5, 8.0):
            cv.paint(rrect(X, Y, cx + vx, vy, 1.5, 0.9, 0.5), hexrgb(0x2d1f08))
    dome = (ell(X, Y, cx, 27.5, 13.5, 5.5) <= 1) & (Y <= 27.5)
    cv.paint(dome, brass((X - (cx - 13.5)) / 27))
    cv.paint(ell(X, Y, cx, 21.0, 2.6, 2.2) <= 1, hexrgb(0xd9ae3c))
    # 아래 — 목 테 + 기름통
    collar = (Y > 88) & (Y <= 93.5) & (np.abs(X - cx) <= 22.5)
    cv.paint(collar, brass((X - (cx - 22.5)) / 45))
    cv.tint(collar & (Y > 92.2), hexrgb(0x4d360e), 0.6)
    ty2 = (Y - 93.5) / 21.5
    thw = 27.0 + 4.5 * np.sin(np.pi * np.clip(ty2, 0, 1) * 0.9)
    tank = (Y > 93.5) & (Y <= 115) & (np.abs(X - cx) <= thw)
    tank &= ~((Y > 111.5) & (np.abs(X - cx) > thw - (Y - 111.5) * 1.1))
    cv.paint(tank, brass((X - (cx - thw)) / (2 * thw)))
    cv.tint(tank & (ty2 > 0.8), hexrgb(0x4d360e), 0.5)
    cv.tint(tank & (np.abs(ty2 - 0.2) < 0.035), hexrgb(0x5e430f), 0.8)
    # 심지 조절 손잡이(오른쪽)
    cv.paint(rrect(X, Y, cx + 30, 98.5, 5.0, 1.3, 0.6), hexrgb(0x7a5718))
    knob = ell(X, Y, cx + 36.5, 98.5, 3.6, 3.6)
    cv.paint(knob <= 1, ramp(knob, [(0, 0xffefad), (0.4, 0xd9ae3c), (1, 0x7a5718)]))
    # 명판
    cv.paint(rrect(X, Y, cx - 2, 104.5, 8.5, 3.0, 1.0), hexrgb(0x5e430f))
    cv.paint(rrect(X, Y, cx - 2, 104.5, 7.3, 1.9, 0.6), hexrgb(0xe9c85a))
    for k in range(4):
        cv.paint(rrect(X, Y, cx - 6.5 + k * 3.0, 104.5, 0.8, 0.9, 0.2), hexrgb(0x5e430f))
    return finish(cv, colors=48, path=path, outline=0x14171c)

def certificate(path, seed=5):
    """증서 — 누런 종이 · 금박 테 · 조합 표장 · 붉은 직인"""
    cv = Canvas()
    u, v = cv.frame(64, 64, -7.0)
    hw, hh = 39.0, 50.0
    paper = (np.abs(u) <= hw) & (np.abs(v) <= hh)
    # 오른쪽 아래 귀 접힘
    fold = (u + v) > (hw + hh - 13)
    cv.paint(paper & ~fold, ramp((v + hh) / (2 * hh) * 0.7 + (u + hw) / (2 * hw) * 0.3, [(0, 0xfff8e6), (0.5, 0xf8ecd0), (1, 0xe6d5ac)]))
    aged = noise(cv.a.shape, seed, 22)
    cv.tint(paper & (aged > 0.7), hexrgb(0xe6d2a2), 0.22)
    cv.tint(paper & ((np.abs(u) > hw - 1.2) | (np.abs(v) > hh - 1.2)), hexrgb(0xcbb37a), 0.6)
    # 접힌 귀(뒷면)
    f2 = paper & fold & ((u + v) < (hw + hh - 13) + 13) & (u > hw - 13) & (v > hh - 13)
    tri = (u - (hw - 13)) + (v - (hh - 13)) < 13
    cv.paint(paper & (u > hw - 13) & (v > hh - 13) & tri, ramp(((u - (hw - 13)) + (v - (hh - 13))) / 13, [(0, 0xb99f66), (0.25, 0xe9dab4), (1, 0xfff6de)]))
    body = paper & ~fold
    # 금박 겹테
    gold = ramp((u + v + 90) / 180, [(0, 0xe9c85a), (0.3, 0xb8902c), (0.5, 0xf6e08a), (0.7, 0xb8902c), (1, 0x8a6a1e)])
    fr1 = (np.maximum(np.abs(u) - (hw - 5.2), np.abs(v) - (hh - 5.2)) <= 0) & (np.maximum(np.abs(u) - (hw - 7.2), np.abs(v) - (hh - 7.2)) > 0)
    fr2 = (np.maximum(np.abs(u) - (hw - 9.0), np.abs(v) - (hh - 9.0)) <= 0) & (np.maximum(np.abs(u) - (hw - 9.8), np.abs(v) - (hh - 9.8)) > 0)
    cv.paint(body & (fr1 | fr2), gold)
    for su in (-1, 1):
        for sv in (-1, 1):
            if su == 1 and sv == 1: continue
            cc = (np.abs(u - su * (hw - 6.2)) < 2.6) & (np.abs(v - sv * (hh - 6.2)) < 2.6)
            cv.paint(body & cc, hexrgb(0x8a6a1e))
            cv.paint(body & (np.abs(u - su * (hw - 6.2)) < 1.2) & (np.abs(v - sv * (hh - 6.2)) < 1.2), hexrgb(0xf6e08a))
    # 표장 — 물결 든 둥근 표
    em = ell(u, v, 0, -30.5, 7.6, 7.6)
    cv.paint(body & (em <= 1), hexrgb(0x1f5f86))
    cv.paint(body & (em <= 0.72), hexrgb(0x3d8fbd))
    wave = np.abs(v + 29.5 - 1.5 * np.sin(u * 1.1)) < 0.85
    wave2 = np.abs(v + 26.2 - 1.5 * np.sin(u * 1.1 + 1.6)) < 0.75
    cv.paint(body & (em <= 0.7) & (wave | wave2), hexrgb(0xffffff))
    cv.paint(body & (em <= 0.7) & (ell(u, v, 0.5, -33.6, 1.7, 1.7) <= 1), hexrgb(0xffe27a))
    # 제목 · 본문(글자 대신 획 덩어리)
    ink = hexrgb(0x2b2a2e)
    for k in range(6):                                   # 제목 여섯 자
        cu = -15.0 + k * 6.0
        blk = (np.abs(u - cu) < 2.1) & (np.abs(v + 16.5) < 2.6)
        cv.paint(body & blk, ink)
        cv.paint(body & (np.abs(u - cu) < 1.0) & (np.abs(v + 16.9) < 0.8), hexrgb(0xf8ecd0))
        cv.paint(body & (np.abs(u - cu + 0.2) < 0.45) & (np.abs(v + 15.2) < 1.0), hexrgb(0xf8ecd0))
    rng = np.random.default_rng(seed)
    for row, vv in enumerate([-7.0, -2.2, 2.6, 7.4, 12.2]):
        x0 = -26.0
        end = 26.0 if row < 4 else 4.0
        while x0 < end:
            w = rng.uniform(2.0, 5.5)
            cv.paint(body & (u >= x0) & (u <= min(x0 + w, end)) & (np.abs(v - vv) < 0.95), hexrgb(0x55535a))
            x0 += w + 1.4
    # 날짜 · 서명 줄
    cv.paint(body & (u >= -26) & (u <= -6) & (np.abs(v - 23.5) < 0.8), hexrgb(0x55535a))
    cv.paint(body & (u >= -27) & (u <= 4) & (np.abs(v - 33.0) < 0.5), hexrgb(0x8a8170))
    sig = (np.abs(v - 29.5 - 2.0 * np.sin(u * 0.9) * np.exp(-((u + 12) / 9) ** 2)) < 0.7) & (u > -24) & (u < 0)
    cv.paint(body & sig, hexrgb(0x1f2f6b))
    # 붉은 직인(네모 도장)
    su, sv2 = 15.0, 22.5
    st = (np.abs(u - su) < 8.2) & (np.abs(v - sv2) < 8.2)
    cv.paint(body & st, hexrgb(0xc9302a))
    cv.paint(body & (np.abs(u - su) < 6.6) & (np.abs(v - sv2) < 6.6), hexrgb(0xf8ecd0))
    for (a, b, w, h) in [(-3.4, -3.4, 2.4, 0.8), (-3.4, -0.4, 0.8, 3.0), (-3.4, 3.2, 2.4, 0.8), (-0.9, 0.3, 0.7, 4.0),
                         (3.2, -3.4, 2.6, 0.8), (3.2, -0.6, 2.6, 0.8), (1.4, 0.8, 0.8, 3.6), (5.0, 0.8, 0.8, 3.6), (3.2, 4.0, 2.6, 0.8)]:
        cv.paint(body & (np.abs(u - su - a) < w) & (np.abs(v - sv2 - b) < h), hexrgb(0xc9302a))
    stn = noise(cv.a.shape, seed + 2, 3)
    cv.tint(body & st & (stn > 0.72), hexrgb(0xf8ecd0), 0.7)       # 인주 번짐(빠진 자리)
    return finish(cv, colors=44, path=path, outline=0x14171c)

if __name__ == '__main__':
    headlamp('headlamp_v1.png'); lantern('lantern_v1.png'); certificate('certificate_v1.png')
    from PIL import Image
    sheet = Image.new('RGBA', (3 * 650 + 10, 660), (36, 44, 56, 255))
    for i, n in enumerate(['headlamp_v1.png', 'lantern_v1.png', 'certificate_v1.png']):
        sheet.alpha_composite(Image.open(n).resize((640, 640), Image.NEAREST), (10 + i * 650, 10))
    sheet.save('items_view.png')
