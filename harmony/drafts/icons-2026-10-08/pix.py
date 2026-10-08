# 16x16 손그림 매트릭스 렌더 도우미 (시안 검토용 — 저장소에 넣지 않는다)
import re, json
from PIL import Image

def load_existing(ts_path):
    src = open(ts_path, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"^  (\w+): \{\n    w: (\d+), h: (\d+),\n    pal: \{ (.*?) \},\n    rows: \[\n(.*?)\n    \],", src, re.S | re.M):
        key, w, h, pal_s, rows_s = m.groups()
        pal = {a: int(b, 16) for a, b in re.findall(r"'(.)': 0x([0-9a-f]{6})", pal_s)}
        rows = re.findall(r"'([^']*)'", rows_s)
        out[key] = (pal, rows, int(w), int(h))
    return out

def render(pal, rows, scale=1):
    h = len(rows); w = len(rows[0])
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.':
                v = pal[ch]
                px[x, y] = ((v >> 16) & 255, (v >> 8) & 255, v & 255, 255)
    return im.resize((w * scale, h * scale), Image.NEAREST) if scale != 1 else im
