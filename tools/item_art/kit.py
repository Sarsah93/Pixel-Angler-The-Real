# -*- coding: utf-8 -*-
"""
@file kit.py
@description 아이템 그림 도구 상자 — 음함수 도형 + 그라데이션을 슈퍼샘플로 그린 뒤 논리 격자로 내려 도트화한다.

    논리 격자 128 × 128  →  색 줄이기(디더 없음) + 바깥 1픽셀 외곽선  →  4배 확대(512 × 512 PNG)

그림 한 장은 `@icon('이름', ids=[...])` 를 붙인 함수 하나다(icons_*.py). `build.py` 가 전부 굽는다.
좌표는 전부 논리 픽셀(0~128)이고 원점은 왼쪽 위다. 빛은 왼쪽 위에서 온다.

의존: numpy · Pillow.
"""
import numpy as np
from PIL import Image, ImageDraw

L = 128     # 논리 격자(한 변)
SS = 4      # 슈퍼샘플 배수
OUT = 4     # 내보낼 때 정수배 (128 × 4 = 512)
OUTLINE = 0x14171c


# ─────────────────────────────────────────────
# 색
# ─────────────────────────────────────────────
def rgb(v):
    """0xRRGGBB → (3,) float 0~1"""
    return np.array([(v >> 16) & 255, (v >> 8) & 255, v & 255], dtype=np.float32) / 255.0


def mix(a, b, t):
    """두 색(0xRRGGBB)을 섞어 0xRRGGBB 로"""
    ca, cb = rgb(a), rgb(b)
    c = np.clip(ca * (1 - t) + cb * t, 0, 1)
    return (int(round(c[0] * 255)) << 16) | (int(round(c[1] * 255)) << 8) | int(round(c[2] * 255))


def lit(v, k):
    """밝게(k>0 → 흰색 쪽) · 어둡게(k<0 → 남색 섞인 검정 쪽)"""
    return mix(v, 0xffffff, k) if k >= 0 else mix(v, 0x0c0f1a, -k)


def ramp(t, stops):
    """t(0~1 배열) → 색 배열. stops = [(위치, 0xRRGGBB), ...] — 같은 위치를 두 번 쓰면 단이 진다"""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    ps = [p for p, _ in stops]
    cs = [rgb(c) for _, c in stops]
    for i in range(3):
        out[..., i] = np.interp(t, ps, [c[i] for c in cs])
    return out


def cyl(base, hl=0.30, gloss=0.55, dark=0.55):
    """원통 음영 단(왼쪽 위 빛) — base 색 하나로 어두운 가장자리 · 밝은 줄 · 몸 · 그늘을 만든다"""
    return [(0.00, lit(base, -dark * 0.8)), (0.10, lit(base, -0.18)), (hl - 0.07, lit(base, 0.12)),
            (hl - 0.06, lit(base, gloss)), (hl + 0.04, lit(base, gloss * 0.8)), (hl + 0.05, lit(base, 0.05)),
            (0.66, base), (0.67, lit(base, -0.22)), (0.90, lit(base, -dark * 0.75)), (1.00, lit(base, -dark))]


def flat3(base, a=0.22, b=-0.25):
    """면 셋(밝은 면 · 몸 · 그늘)으로 딱 끊어지는 단"""
    return [(0.0, lit(base, a)), (0.30, lit(base, a)), (0.31, base), (0.68, base), (0.69, lit(base, b)), (1.0, lit(base, b))]


# ─────────────────────────────────────────────
# 캔버스
# ─────────────────────────────────────────────
class Canvas:
    def __init__(self, l=L):
        self.l = l
        n = l * SS
        ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
        self.X = (xs + 0.5) / SS
        self.Y = (ys + 0.5) / SS
        self.rgb = np.zeros((n, n, 3), np.float32)
        self.a = np.zeros((n, n), np.float32)

    # 지역 좌표 — (ox, oy)를 원점으로 deg 만큼 돌린 축 (u = 축 방향, v = 축에 수직 · 화면 아래쪽이 +)
    def frame(self, ox, oy, deg):
        t = np.deg2rad(deg)
        dx, dy = self.X - ox, self.Y - oy
        return dx * np.cos(t) + dy * np.sin(t), -dx * np.sin(t) + dy * np.cos(t)

    def _col(self, color):
        if isinstance(color, (int, np.integer)):
            return np.broadcast_to(rgb(int(color)), self.rgb.shape)
        if isinstance(color, np.ndarray) and color.ndim == 1:
            return np.broadcast_to(color, self.rgb.shape)
        return color

    def paint(self, mask, color, alpha=1.0):
        """불투명하게 칠한다(투명한 곳에도 그려진다)"""
        m = mask.astype(np.float32) * alpha
        c = self._col(color)
        na = m + self.a * (1 - m)
        keep = (self.a * (1 - m))[..., None]
        self.rgb = np.where(na[..., None] > 1e-6, (c * m[..., None] + self.rgb * keep) / np.maximum(na, 1e-6)[..., None], self.rgb)
        self.a = na

    def tint(self, mask, color, alpha=1.0):
        """이미 칠해진 곳에만 덧칠한다(하이라이트 · 그늘 · 무늬)"""
        m = (mask.astype(np.float32) * alpha) * (self.a > 0.5)
        c = self._col(color)
        self.rgb = self.rgb * (1 - m[..., None]) + c * m[..., None]

    def erase(self, mask):
        m = mask.astype(np.float32)
        self.a = self.a * (1 - m)

    # 자주 쓰는 묶음 ─────────────────────────
    def cylx(self, mask, x0, x1, base, **kw):
        """세로로 선 원통 — 가로(x0→x1)로 음영이 진다"""
        self.paint(mask, ramp((self.X - x0) / max(1e-3, x1 - x0), cyl(base, **kw)))

    def cyly(self, mask, y0, y1, base, **kw):
        """가로로 누운 원통 — 세로(y0→y1)로 음영이 진다"""
        self.paint(mask, ramp((self.Y - y0) / max(1e-3, y1 - y0), cyl(base, **kw)))

    def ball(self, cx, cy, r, base, ry=None, gloss=0.6):
        """공 — 왼쪽 위에 밝은 점"""
        ry = ry or r
        m = ell(self.X, self.Y, cx, cy, r, ry) <= 1
        d = np.sqrt(((self.X - (cx - r * 0.32)) / (r * 1.25)) ** 2 + ((self.Y - (cy - ry * 0.36)) / (ry * 1.25)) ** 2)
        self.paint(m, ramp(d, [(0, lit(base, gloss)), (0.16, lit(base, gloss)), (0.17, lit(base, 0.18)), (0.5, base),
                               (0.51, lit(base, -0.2)), (0.82, lit(base, -0.38)), (1.0, lit(base, -0.55))]))
        return m


# ─────────────────────────────────────────────
# 도형(마스크) — X, Y 는 Canvas.X / Canvas.Y 또는 frame() 이 준 지역 좌표
# ─────────────────────────────────────────────
def ell(X, Y, cx, cy, rx, ry):
    """타원 음함수 값(<= 1 이면 안)"""
    return ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2


def disc(X, Y, cx, cy, r):
    return (X - cx) ** 2 + (Y - cy) ** 2 <= r * r


def rrect(X, Y, cx, cy, hw, hh, r=0.0):
    """둥근 사각형(중심 · 반폭 · 반높이 · 모서리 반지름)"""
    r = min(r, hw, hh)
    dx = np.maximum(np.abs(X - cx) - (hw - r), 0)
    dy = np.maximum(np.abs(Y - cy) - (hh - r), 0)
    return (dx * dx + dy * dy <= r * r + 1e-6) & (np.abs(X - cx) <= hw) & (np.abs(Y - cy) <= hh)


def box(X, Y, x0, y0, x1, y1, r=0.0):
    return rrect(X, Y, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, r)


def seg_dist(X, Y, x0, y0, x1, y1):
    """선분까지의 거리"""
    dx, dy = x1 - x0, y1 - y0
    d2 = dx * dx + dy * dy
    t = np.clip(((X - x0) * dx + (Y - y0) * dy) / max(d2, 1e-6), 0, 1)
    return np.sqrt((X - (x0 + t * dx)) ** 2 + (Y - (y0 + t * dy)) ** 2)


def capsule(X, Y, x0, y0, x1, y1, r):
    return seg_dist(X, Y, x0, y0, x1, y1) <= r


def polyline(X, Y, pts, r):
    """꺾은선(굵기 r) — 줄 · 철사 · 끈"""
    m = np.zeros(X.shape, bool)
    for (a, b), (c, d) in zip(pts[:-1], pts[1:]):
        m |= capsule(X, Y, a, b, c, d, r)
    return m


def poly(cv, pts):
    """다각형 마스크(화면 좌표)"""
    n = cv.l * SS
    im = Image.new('L', (n, n), 0)
    ImageDraw.Draw(im).polygon([(x * SS, y * SS) for x, y in pts], fill=255)
    return np.asarray(im) > 127


def ring(X, Y, cx, cy, rx, ry, w):
    """타원 고리(바깥 반지름 rx, ry · 두께 w)"""
    return (ell(X, Y, cx, cy, rx, ry) <= 1) & (ell(X, Y, cx, cy, max(0.1, rx - w), max(0.1, ry - w)) > 1)


def noise(shape, seed, scale):
    """부드러운 값 노이즈(0~1) — 얼룩 · 나뭇결 · 천"""
    rng = np.random.default_rng(seed)
    h, w = shape
    small = rng.random((h // (scale * SS) + 2, w // (scale * SS) + 2)).astype(np.float32)
    im = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(im, np.float32) / 255.0


# ─────────────────────────────────────────────
# 마무리 — 내려받기 · 색 줄이기 · 외곽선 · 확대
# ─────────────────────────────────────────────
def finish(cv, colors=40, outline=OUTLINE):
    """Canvas → (논리 크기 RGBA, 내보낼 크기 RGBA)"""
    l = cv.l
    rgbv = cv.rgb.reshape(l, SS, l, SS, 3)
    a = cv.a.reshape(l, SS, l, SS)
    wsum = a.sum(axis=(1, 3))
    col = (rgbv * a[..., None]).sum(axis=(1, 3)) / np.maximum(wsum, 1e-6)[..., None]
    solid = (wsum / (SS * SS)) >= 0.5
    im = Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8), 'RGB')
    q = np.asarray(im.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB'))
    out = np.zeros((l, l, 4), np.uint8)
    out[..., :3] = q
    out[..., 3] = np.where(solid, 255, 0)
    if outline is not None:
        nb = np.zeros_like(solid)
        nb[1:, :] |= solid[:-1, :]
        nb[:-1, :] |= solid[1:, :]
        nb[:, 1:] |= solid[:, :-1]
        nb[:, :-1] |= solid[:, 1:]
        edge = nb & ~solid
        out[edge, :3] = (rgb(outline) * 255).astype(np.uint8)
        out[edge, 3] = 255
    small = Image.fromarray(out, 'RGBA')
    return small, small.resize((l * OUT, l * OUT), Image.NEAREST)


# ─────────────────────────────────────────────
# 등록부
# ─────────────────────────────────────────────
REGISTRY = []   # [{name, fn, ids, prefixes, px, colors, label}]


def icon(name, ids=(), prefixes=(), px=(), colors=40, label='', key='', board=False):
    """
    그림 하나를 등록한다.
      name     파일 이름(item-icons/drawn/<name>.png) · 텍스처 키는 art_<name>
      ids      이 그림을 쓰는 아이템 id 들
      prefixes 이 그림을 쓰는 아이템 id 접두사(뒤에 번호 · 어종이 붙는 것)
      px       이 그림으로 바꿀 16×16 아이콘 키('px:it_net' 처럼 — id 로 못 찾았을 때)
      key      텍스처 키를 art_<name> 대신 이 이름으로(이미 정해진 키 — forage_<생물 id> · fish_<어종>)
      board    채집 놀이 판 그림(forageboard_<생물 id> — 긴 변 44px)도 굽는다. key 가 forage_ 로 시작할 때만
    """
    def deco(fn):
        REGISTRY.append({'name': name, 'fn': fn, 'ids': tuple(ids), 'prefixes': tuple(prefixes), 'px': tuple(px),
                         'colors': colors, 'label': label or name,
                         'key': key or f'art_{name}', 'board': board})
        return fn
    return deco
