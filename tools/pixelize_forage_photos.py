"""
225차 — 사용자 실사(갯것 3종) → 픽셀 아이템 아이콘 · 채집 판 그림.

입력: food assets/forage/{ragworm,honmushi,sea_slater}.png  (사용자 사진 원본 — 수정 금지)
      food assets/forage/{sea_cucumber,purple_urchin}.png  (226차 — 사용자가 그려 온 투명 도트 그림)
출력:
  packages/client-pc/public/item-icons/forage_<speciesId>.png  — 아이템 아이콘(도트 × 정수배, 투명 여백)
  packages/client-pc/public/forage-board/<speciesId>.png        — 채집 놀이 판 그림(도트 원래 크기 — 게임이 정수배로 키운다)

절차: 배경 분리(사진마다 규칙) → 가장 큰 덩어리 + 붙은 다리 → 긴 축 기준 다운샘플(BOX)
      → 색 줄이기(median cut) → 알파 이진화 → 1px 어두운 윤곽선.
재실행: python3 tools/pixelize_forage_photos.py
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'food assets', 'forage')
OUT_ICON = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'item-icons')
OUT_BOARD = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'forage-board')


def load(name):
    raw = Image.open(os.path.join(SRC, name + '.png'))
    im = raw.convert('RGB')
    alpha = np.asarray(raw.convert('RGBA'))[..., 3] if raw.mode in ('RGBA', 'LA', 'P') else None
    return im, np.asarray(im).astype(np.float32), np.asarray(im.convert('HSV')).astype(np.float32), alpha


def mask_alpha(rgb, hsv, alpha):
    """226차 — 이미 투명 배경으로 그려 온 도트 그림(해삼 · 보라성게)은 알파가 곧 마스크다."""
    return alpha >= 128


def largest(mask):
    lab, n = ndi.label(mask)
    if n == 0:
        return mask
    sizes = ndi.sum(mask, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))


def mask_honmushi(rgb, hsv):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    bg = (b > r + 25) & (g > r + 5)          # 하늘색 바탕
    m = ~bg
    m = ndi.binary_opening(m, iterations=1)
    m = ndi.binary_closing(m, iterations=2)
    lab, n = ndi.label(m)
    sizes = ndi.sum(m, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 400])
    # 구멍은 메우지 않는다 — 갯지렁이 사이로 바탕이 비쳐야 한다(메우면 하늘색이 남는다)
    return keep & ~ndi.binary_dilation(bg, iterations=1)


def mask_slater(rgb, hsv):
    v = hsv[..., 2]
    s = hsv[..., 1]
    body = (v < 120)
    body = ndi.binary_opening(body, iterations=2)
    body = largest(body)
    body = ndi.binary_fill_holes(ndi.binary_closing(body, iterations=3))
    # 다리 · 더듬이 — 몸 가까이에 붙은 덜 어두운 갈색(바탕 화강암보다 어둡거나 누런 것)
    near = ndi.binary_dilation(body, iterations=40)
    limb = near & (v < 135)
    limb = ndi.binary_opening(limb, iterations=1)
    lab, n = ndi.label(limb | body)
    core = lab[body][0] if body.any() else 0
    m = ndi.binary_fill_holes(lab == core)
    # 가장자리 화강암 빛이 묻지 않게 한 겹 벗긴다
    return ndi.binary_erosion(m, iterations=2)


RAGWORM_CROP = (0.30, 0.05, 0.98, 0.80)   # 몇 마리만 크게 보이게 (x0, y0, x1, y1 비율)


def mask_ragworm(rgb, hsv):
    """청갯지렁이는 상자(갑) 안에 엉켜 있어 한 마리씩 떼어 낼 수 없다 — 사진 그대로 미끼 상자 모양(둥근 네모)으로 자른다.
    한 갑 8마리 단위로 파는 물건이라 상자 그림이 아이템으로도 맞다."""
    H, W = rgb.shape[:2]
    x0, y0, x1, y1 = [int(v) for v in (RAGWORM_CROP[0] * W, RAGWORM_CROP[1] * H, RAGWORM_CROP[2] * W, RAGWORM_CROP[3] * H)]
    full = np.zeros((H, W), bool)
    h, w = y1 - y0, x1 - x0
    m = np.zeros((h, w), bool)
    r = int(min(h, w) * 0.12)
    m[r:h - r, :] = True
    m[:, r:w - r] = True
    for cy, cx in [(r, r), (r, w - r - 1), (h - r - 1, r), (h - r - 1, w - r - 1)]:
        yy, xx = np.ogrid[0:h, 0:w]
        m |= (yy - cy) ** 2 + (xx - cx) ** 2 <= r * r
    full[y0:y1, x0:x1] = m
    return full


def axis_angle(mask):
    """몸 긴 축을 가로로 눕히고 머리(사진에서 위쪽 끝)를 왼쪽에 두는 회전각(도, 반시계)."""
    ys, xs = np.where(mask)
    c = np.cov(np.vstack([xs - xs.mean(), ys - ys.mean()]))
    vals, vecs = np.linalg.eigh(c)
    vx, vy = vecs[:, int(np.argmax(vals))]
    if vy > 0:   # 머리 쪽(위 = y 작은 쪽)을 가리키게
        vx, vy = -vx, -vy
    ang = np.degrees(np.arctan2(-vy, vx))   # 화면 좌표 → 수학 각
    return 180 - ang                          # 머리 방향을 180°(왼쪽)로


def enhance(rgb, sat=1.0, con=1.0):
    if sat == 1.0 and con == 1.0:
        return rgb
    from PIL import ImageEnhance
    im = Image.fromarray(rgb.astype(np.uint8), 'RGB')
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(con)
    return np.asarray(im).astype(np.float32)


def pixelize(rgb, mask, long_px, colors=22, rotate=0, alpha_cut=110):
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.float32)
    rgba[..., :3] = rgb[y0:y1, x0:x1]
    rgba[..., 3] = mask[y0:y1, x0:x1] * 255
    im = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
    if rotate:
        im = im.rotate(rotate, expand=True, resample=Image.BICUBIC)
        a = np.asarray(im).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); im = Image.fromarray(a, 'RGBA')
        im = im.crop(im.getbbox())   # 돌리고 생긴 빈 여백을 잘라야 긴 축 기준 크기가 맞는다
    w, h = im.size
    k = long_px / max(w, h)
    tw, th = max(1, round(w * k)), max(1, round(h * k))
    # 미리 곱한 알파로 BOX 축소(가장자리 색 번짐 방지)
    a = np.asarray(im).astype(np.float32)
    pre = a.copy()
    pre[..., :3] *= a[..., 3:4] / 255
    small = np.asarray(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((tw, th), Image.BOX)).astype(np.float32)
    alpha = small[..., 3]
    on = alpha >= alpha_cut
    rgb_s = np.zeros((th, tw, 3), np.float32)
    rgb_s[on] = np.clip(small[on, :3] * 255 / np.maximum(alpha[on, None], 1), 0, 255)
    # 색 줄이기 — 불투명 칸만
    pal_src = Image.fromarray(rgb_s.astype(np.uint8), 'RGB')
    q = pal_src.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    qrgb = np.asarray(q.convert('RGB')).astype(np.float32)
    out = np.zeros((th + 2, tw + 2, 4), np.uint8)
    out[1:-1, 1:-1, :3] = qrgb
    out[1:-1, 1:-1, 3] = on * 255
    # 1px 윤곽선 — 바깥 이웃 칸을 그 칸 색의 아주 어두운 판으로
    solid = out[..., 3] > 0
    ring = ndi.binary_dilation(solid) & ~solid
    dark = np.array([28, 22, 20], np.uint8)
    out[ring, :3] = dark
    out[ring, 3] = 255
    return Image.fromarray(out, 'RGBA')


def add_antennae(px, frac=0.5, color=(70, 60, 50)):
    """갯강구 더듬이 — 사진에서 1px보다 가늘어 잘려 나간다. 머리(왼쪽 끝)에서 위·아래로 두 가닥을 그려 준다."""
    a = np.asarray(px).copy()
    h, w = a.shape[:2]
    solid = a[..., 3] > 0
    cols = np.where(solid.any(0))[0]
    x0 = cols.min()
    rows = np.where(solid[:, x0 + 2])[0]
    cy = int(rows.mean())
    L = int((cols.max() - x0) * frac)
    pad = L + 2
    out = np.zeros((h + pad * 2, w + pad, 4), np.uint8)
    out[pad:pad + h, pad:pad + w] = a
    hx, hy = x0 + 2 + pad, cy + pad
    for sgn in (-1, 1):
        for t in range(L + 1):
            x = hx - t
            y = hy + sgn * int(round(t * 0.12 + (t * t) / (L * 2.2)))
            out[y, x, :3] = color
            out[y, x, 3] = 255
    im = Image.fromarray(out, 'RGBA')
    return im.crop(im.getbbox())


def save_icon_hires(rgb, mask, species, rotate=0, pad=0.06):
    """226차 — 원본이 이미 도트 그림이면 다시 굽지 않고 잘라서 정사각 투명 캔버스에 앉힌다(다른 forage_* 아이콘과 같은 꼴)."""
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    rgba[..., :3] = rgb[y0:y1, x0:x1].astype(np.uint8)
    rgba[..., 3] = mask[y0:y1, x0:x1] * 255
    im = Image.fromarray(rgba, 'RGBA')
    if rotate:
        im = im.rotate(rotate, expand=True, resample=Image.NEAREST)
        im = im.crop(im.getbbox())
    side = int(max(im.size) * (1 + pad * 2))
    can = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    can.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    can.save(os.path.join(OUT_ICON, f'forage_{species}.png'))


def save_icon(px, species, canvas=96, scale=10):
    w, h = px.size
    can = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
    can.paste(px, ((canvas - w) // 2, (canvas - h) // 2))
    big = can.resize((canvas * scale, canvas * scale), Image.NEAREST)
    big.save(os.path.join(OUT_ICON, f'forage_{species}.png'))


def save_board(px, species):
    os.makedirs(OUT_BOARD, exist_ok=True)
    px.save(os.path.join(OUT_BOARD, f'{species}.png'))


JOBS = [
    # (원본, 종 id, 마스크, 아이콘 긴 축, 판 긴 축(0 = 판 그림 없음), 회전('axis' = 긴 축 가로 · 머리 왼쪽), 채도, 대비)
    ('ragworm', 'perinereis_aibuhitensis', mask_ragworm, 72, 0, 0, 1.45, 1.2),   # 판 그림은 상자가 아니라 한 마리라 도트 유지
    ('honmushi', 'marphysa_sanguinea', mask_honmushi, 80, 40, 0, 1.0, 1.05),
    ('sea_slater', 'ligia_exotica', mask_slater, 72, 30, 'axis', 1.1, 1.15),   # 판에서 옆으로 달린다
    # 226차 — 사용자가 도트 그림으로 그려 온 것(투명 배경): 아이콘은 원본 그대로 · 판 그림만 줄인다
    ('sea_cucumber', 'stichopus_japonicus', mask_alpha, 'hires', 48, 'axis', 1.0, 1.0),
    ('purple_urchin', 'strongylocentrotus_nudus', mask_alpha, 'hires', 44, 0, 1.0, 1.0),
]

if __name__ == '__main__':
    for src, sp, fn, icon_px, board_px, rot, sat, con in JOBS:
        im, rgb, hsv, alpha = load(src)
        m = fn(rgb, hsv, alpha) if fn is mask_alpha else fn(rgb, hsv)
        if rot == 'axis':
            rot = axis_angle(m)
        rgb = enhance(rgb, sat, con)
        print(f'{src}: mask {m.mean():.3f}')
        cut = 50 if sp == 'strongylocentrotus_nudus' else 110   # 성게 가시는 가늘어 알파 문턱을 낮춘다
        if icon_px == 'hires':
            save_icon_hires(rgb, m, sp, rotate=rot)
            icon = None
        else:
            icon = pixelize(rgb, m, icon_px, rotate=rot)
        board = pixelize(rgb, m, board_px, colors=18, rotate=rot, alpha_cut=cut) if board_px else None
        if sp == 'ligia_exotica':
            icon = add_antennae(icon) if icon else None
            board = add_antennae(board) if board else None
        if icon:
            save_icon(icon, sp)
        if board:
            save_board(board, sp)
    print('ok')
