import numpy as np
from hi import *

def _handle(cv, u, v, H0, H1, hw0, hw1, stops, grain_col, seed, end_shade):
    hw = hw0 + (hw1 - hw0) * (u - H0) / (H1 - H0)
    handle = (u >= H0) & (u <= H1) & (np.abs(v) <= hw)
    handle &= ~((u < H0 + 1.6) & (np.abs(v) > hw - 1.3))
    t = (v / hw + 1) / 2
    cv.paint(handle, ramp(t, stops))
    g = noise(cv.a.shape, seed, 5)
    streak = (np.sin(v * 4.3 + g * 7.0) > 0.9) & (np.sin(u * 0.55 + g * 5.0) > -0.35)
    cv.tint(handle & streak, hexrgb(grain_col), 0.5)
    cv.tint(handle & (u < H0 + 2.4), hexrgb(end_shade), 0.5)
    return handle

def yanagiba(path, seed=3):
    cv = Canvas()
    ox, oy, deg = 10, 117, -45.0
    u, v = cv.frame(ox, oy, deg)
    LEN = 156.0
    H0, H1, F1, N1 = 0.0, 42.0, 50.0, 53.0
    # 손잡이 — 팔각 목련나무(면 3개가 또렷하게)
    _handle(cv, u, v, H0, H1, 5.4, 4.8,
            [(0.0, 0xf6e7c3), (0.27, 0xf0dcb0), (0.28, 0xdcc48f), (0.66, 0xd4b982), (0.67, 0xb08a54), (1.0, 0x94703f)],
            0x9a7646, seed, 0x6f5230)
    # 물소뿔 고리
    fw = 4.9
    ferr = (u > H1) & (u <= F1) & (np.abs(v) <= fw)
    tf = (v / fw + 1) / 2
    cv.paint(ferr, ramp(tf, [(0.0, 0x4d4640), (0.16, 0x38322e), (0.24, 0xa39a8f), (0.32, 0x2e2826), (0.7, 0x1c1817), (1.0, 0x0f0d0d)]))
    cv.paint((u > H1) & (u <= H1 + 1.2) & (np.abs(v) <= fw), ramp(tf, [(0, 0xfbf6ea), (0.6, 0xe4dac6), (1, 0xb5aa94)]))
    # 목
    neck = (u > F1) & (u <= N1 + 1.0) & (v >= -3.0) & (v <= 1.8)
    cv.paint(neck, ramp((v + 3.0) / 4.8, [(0, 0x77818c), (0.4, 0xd3d9de), (1, 0x8b949d)]))
    # 칼몸 — 길고 좁다
    B0, B1 = N1, LEN
    s = np.clip((u - B0) / (B1 - B0), 0, 1)
    spine = -3.9 + 0.5 * s
    heel = np.clip((u - B0) / 2.2, 0, 1)
    belly = 5.3 - 0.5 * s
    tipc = np.clip((s - 0.74) / 0.26, 0, 1)
    k = tipc ** 2.0
    edge = (1.8 + (belly - 1.8) * heel) * (1 - k) + (spine + 0.05) * k
    blade = (u >= B0) & (u <= B1) & (v >= spine) & (v <= edge)
    hgt = np.maximum(edge - spine, 1e-3)
    tb = (v - spine) / hgt
    shin = 0.44
    hira = ramp(tb / shin, [(0.0, 0x4b545f), (0.2, 0x4b545f), (0.21, 0x8a96a2), (0.6, 0x9aa6b1), (0.61, 0xafb9c3), (1.0, 0xb8c2cb)])
    kire = ramp((tb - shin) / (1 - shin), [(0.0, 0xf2f5f7), (0.35, 0xe2e8ec), (0.36, 0xcbd3da), (0.78, 0xc3ccd4), (0.79, 0xffffff), (1.0, 0xffffff)])
    cv.paint(blade, np.where((tb < shin)[..., None], hira, kire))
    haze = noise(cv.a.shape, seed + 7, 7)
    cv.tint(blade & (tb < shin) & (tb > 0.2) & (haze > 0.6), hexrgb(0x7c8894), 0.5)
    # 비스듬한 반사 띠 2줄
    for c0, wdt, al in [(34, 3.0, 0.55), (41.5, 1.0, 0.55), (78, 1.6, 0.4)]:
        cv.tint(blade & (np.abs((u - B0) - c0 + v * 1.5) < wdt) & (tb > 0.2), hexrgb(0xffffff), al)
    # 각인
    for du, dv, w, h in [(6.0, -2.2, 0.45, 1.1), (7.6, -2.6, 1.1, 0.4), (7.6, -1.6, 0.4, 0.9), (9.6, -2.2, 0.45, 1.1), (11.0, -2.7, 0.9, 0.4), (11.0, -1.7, 0.9, 0.4)]:
        cv.tint(blade & (np.abs(u - B0 - du) < w) & (np.abs(v - dv) < h), hexrgb(0x242a31), 0.85)
    return finish(cv, colors=32, path=path, outline=0x14171c)

def deba(path, seed=11):
    """정옥선의 손질 칼 — 오래 쓴 데바(넓고 짧은 칼몸 · 손때 묻은 손잡이 · 천 감은 자리)"""
    cv = Canvas()
    ox, oy, deg = 14, 112, -40.0
    u, v = cv.frame(ox, oy, deg)
    H0, H1, F1 = 0.0, 46.0, 54.0
    _handle(cv, u, v, H0, H1, 6.4, 5.6,
            [(0.0, 0xb98d5c), (0.25, 0xaa7d4e), (0.26, 0x95683d), (0.66, 0x8a5e36), (0.67, 0x6b4526), (1.0, 0x55351c)],
            0x4d2f18, seed, 0x3c2412)
    # 손때 — 가운데가 닳아 밝다
    cv.tint((u > 14) & (u < 34) & (np.abs(v) < 3.2), hexrgb(0xc9a274), 0.35)
    # 감아 둔 무명천
    wrap = (u > 36.5) & (u <= H1) & (np.abs(v) <= 6.3)
    tw = (v / 6.3 + 1) / 2
    cv.paint(wrap, ramp(tw, [(0, 0xf4efe2), (0.3, 0xe6dfcf), (0.7, 0xcfc6b3), (1, 0xa79d89)]))
    cv.tint(wrap & (np.mod(u + v * 0.55, 2.4) < 0.5), hexrgb(0x8f8572), 0.75)
    # 고리(검은 수지)
    fw = 5.9
    ferr = (u > H1) & (u <= F1) & (np.abs(v) <= fw)
    tf = (v / fw + 1) / 2
    cv.paint(ferr, ramp(tf, [(0.0, 0x565b62), (0.2, 0x3a3f46), (0.28, 0x8d949c), (0.36, 0x2b2f35), (1.0, 0x121418)]))
    # 칼몸 — 넓은 삼각형, 칼등이 끝에서 내려온다
    B0, B1 = F1, 126.0
    s = np.clip((u - B0) / (B1 - B0), 0, 1)
    spine = -6.2 + 12.0 * np.clip((s - 0.45) / 0.55, 0, 1) ** 1.7
    heel = np.clip((u - B0) / 2.0, 0, 1)
    edge = (3.0 + (15.0 - 3.0) * heel) - 9.4 * s ** 2.4
    blade = (u >= B0) & (u <= B1) & (v >= spine) & (v <= edge)
    hgt = np.maximum(edge - spine, 1e-3)
    tb = (v - spine) / hgt
    shin = 0.58
    hira = ramp(tb / shin, [(0.0, 0x3b4148), (0.12, 0x3b4148), (0.13, 0x6f7780), (0.5, 0x7f8790), (0.51, 0x8f979f), (1.0, 0x99a1a8)])
    kire = ramp((tb - shin) / (1 - shin), [(0.0, 0xdfe4e8), (0.4, 0xcfd6dc), (0.41, 0xb5bec6), (0.8, 0xadb6be), (0.81, 0xf8fafb), (1.0, 0xffffff)])
    cv.paint(blade, np.where((tb < shin)[..., None], hira, kire))
    # 세월 — 얼룩(파티나)과 잔흠
    pat = noise(cv.a.shape, seed + 3, 6)
    cv.tint(blade & (tb < shin) & (pat > 0.62), hexrgb(0x5a5f63), 0.6)
    cv.tint(blade & (tb < shin) & (pat < 0.3), hexrgb(0x8a8472), 0.35)
    for c0, wdt, al in [(18, 2.4, 0.45), (24, 0.8, 0.45)]:
        cv.tint(blade & (np.abs((u - B0) - c0 + v * 1.2) < wdt) & (tb > 0.13), hexrgb(0xffffff), al)
    # 손잡이 끝 구멍(걸이 끈)
    hole = ((u - 4.5) ** 2 + v ** 2) < 1.5 ** 2
    cv.tint(hole, hexrgb(0x2a190c), 0.9)
    return finish(cv, colors=32, path=path, outline=0x14171c)

if __name__ == '__main__':
    yanagiba('knife_yanagiba_v2.png'); deba('knife_deba_v1.png'); raise SystemExit
    from PIL import Image
    sheet = Image.new('RGBA', (1300, 660), (36, 44, 56, 255))
    for i, n in enumerate(['knife_yanagiba_v2.png', 'knife_deba_v1.png']):
        im = Image.open(n).resize((640, 640), Image.NEAREST)
        sheet.alpha_composite(im, (10 + i * 650, 10))
    sheet.save('knives_view.png')
