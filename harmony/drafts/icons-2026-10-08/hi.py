# 고해상 픽셀 일러스트 시안 도구 — 음함수(implicit) 도형 + 그라데이션 → 다운샘플 → 색 줄이기 → 외곽선 → 정수배 확대
# 검토용 시안. 저장소에는 넣지 않는다.
import numpy as np
from PIL import Image

L = 128          # 논리 격자(한 변)
SS = 4           # 슈퍼샘플
OUT = 8          # 내보낼 때 정수배

def hexrgb(v):
    return np.array([(v >> 16) & 255, (v >> 8) & 255, v & 255], dtype=np.float32) / 255.0

class Canvas:
    def __init__(self, l=L):
        self.l = l
        n = l * SS
        ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
        self.X = (xs + 0.5) / SS
        self.Y = (ys + 0.5) / SS
        self.rgb = np.zeros((n, n, 3), np.float32)
        self.a = np.zeros((n, n), np.float32)

    def frame(self, ox, oy, deg):
        """(ox,oy)를 원점으로 deg만큼 돌린 지역 좌표 (u = 축 방향, v = 축에 수직·아래쪽 +)"""
        t = np.deg2rad(deg)
        dx, dy = self.X - ox, self.Y - oy
        u = dx * np.cos(t) + dy * np.sin(t)
        v = -dx * np.sin(t) + dy * np.cos(t)
        return u, v

    def paint(self, mask, color, alpha=1.0):
        """mask: bool/float 배열, color: (3,) 또는 (n,n,3)"""
        m = (mask.astype(np.float32) * alpha)
        c = color if isinstance(color, np.ndarray) and color.ndim == 3 else np.broadcast_to(color, self.rgb.shape)
        na = m + self.a * (1 - m)
        with np.errstate(invalid='ignore', divide='ignore'):
            self.rgb = np.where(na[..., None] > 1e-6, (c * m[..., None] + self.rgb * (self.a * (1 - m))[..., None]) / np.maximum(na, 1e-6)[..., None], self.rgb)
        self.a = na

    def tint(self, mask, color, alpha):
        """이미 칠해진 곳에만 덧칠(하이라이트 · 그늘)"""
        m = (mask.astype(np.float32) * alpha) * (self.a > 0.5)
        c = color if isinstance(color, np.ndarray) and color.ndim == 3 else np.broadcast_to(color, self.rgb.shape)
        self.rgb = self.rgb * (1 - m[..., None]) + c * m[..., None]

def ramp(t, stops):
    """t(0~1 배열) → 색. stops = [(위치, 0xRRGGBB), ...]"""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    ps = [p for p, _ in stops]; cs = [hexrgb(c) for _, c in stops]
    for i in range(3):
        out[..., i] = np.interp(t, ps, [c[i] for c in cs])
    return out

def noise(shape, seed, scale):
    """부드러운 값 노이즈(0~1)"""
    rng = np.random.default_rng(seed)
    h, w = shape
    small = rng.random((h // scale + 2, w // scale + 2)).astype(np.float32)
    im = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(im, np.float32) / 255.0

def finish(cv, colors=40, outline=0x15181d, path=None, outline_alpha=1.0):
    n = cv.l * SS
    rgb = cv.rgb.reshape(cv.l, SS, cv.l, SS, 3)
    a = cv.a.reshape(cv.l, SS, cv.l, SS)
    wsum = a.sum(axis=(1, 3))
    col = (rgb * a[..., None]).sum(axis=(1, 3)) / np.maximum(wsum, 1e-6)[..., None]
    alpha = wsum / (SS * SS)
    solid = alpha >= 0.5
    # 색 줄이기(디더 없음) — 픽셀 아트의 평평한 면
    im = Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8), 'RGB')
    q = im.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    out = np.zeros((cv.l, cv.l, 4), np.uint8)
    out[..., :3] = np.asarray(q)
    out[..., 3] = np.where(solid, 255, 0)
    # 외곽선 — 바깥 1픽셀
    if outline is not None:
        s = solid
        nb = np.zeros_like(s)
        nb[1:, :] |= s[:-1, :]; nb[:-1, :] |= s[1:, :]; nb[:, 1:] |= s[:, :-1]; nb[:, :-1] |= s[:, 1:]
        edge = nb & ~s
        oc = (hexrgb(outline) * 255).astype(np.uint8)
        out[edge, :3] = oc
        out[edge, 3] = int(255 * outline_alpha)
    img = Image.fromarray(out, 'RGBA')
    big = img.resize((cv.l * OUT, cv.l * OUT), Image.NEAREST)
    if path:
        big.save(path)
    return img, big
