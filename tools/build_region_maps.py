#!/usr/bin/env python3
"""
build_region_maps.py — 실제 지형 지도(PNG) → 게임 타일/콜리전 그리드 변환기

pixelazed/<region>/ 폴더의 실제 지형 지도 이미지를 색상 기반으로 분류하여
2D 탑다운 필드 씬이 소비할 수 있는 타일 그리드 JSON으로 내보낸다.

- 의존성 없음: Python 표준 라이브러리(zlib, struct)만으로 PNG(8bit, colortype 2/6) 디코딩
- 지형 분류: '~'=바다(이동불가) '.'=육지/도로(이동가능) '#'=건물(충돌) ','=잔디/공원
- POI 추출: 채도 높은 따뜻한 색(식당/카페 아이콘) 군집 → {col,row,kind}
- 후처리: 큰 물줄기에 연결되지 않은 작은 물 얼룩 제거(노이즈 억제)

사용법:
    py tools/build_region_maps.py sokcho
    py tools/build_region_maps.py            # 등록된 전체 지역
"""
import zlib, struct, json, os, sys
from collections import deque

# Windows 콘솔(cp949)에서도 UTF-8 출력이 깨지지 않도록 강제
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# ── PNG 디코더 (8bit, colortype 2=RGB / 6=RGBA, non-interlaced) ──
def decode_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'PNG 아님: ' + path
    pos = 8
    width = height = colortype = None
    idat = bytearray()
    while pos < len(data):
        (length,) = struct.unpack('>I', data[pos:pos+4])
        ctype = data[pos+4:pos+8]
        chunk = data[pos+8:pos+8+length]
        pos += 12 + length
        if ctype == b'IHDR':
            width, height, bitdepth, colortype = struct.unpack('>IIBB', chunk[:10])
            assert bitdepth == 8, 'bitdepth != 8'
        elif ctype == b'IDAT':
            idat += chunk
        elif ctype == b'IEND':
            break
    channels = {2: 3, 6: 4, 0: 1, 4: 2}[colortype]
    raw = zlib.decompress(bytes(idat))
    stride = width * channels
    out = bytearray(width * height * channels)
    prev = bytearray(stride)
    rp = 0
    def paeth(a, b, c):
        p = a + b - c
        pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
        if pa <= pb and pa <= pc: return a
        return b if pb <= pc else c
    for y in range(height):
        ftype = raw[rp]; rp += 1
        line = bytearray(raw[rp:rp+stride]); rp += stride
        if ftype == 1:
            for i in range(channels, stride):
                line[i] = (line[i] + line[i-channels]) & 255
        elif ftype == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif ftype == 3:
            for i in range(stride):
                a = line[i-channels] if i >= channels else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif ftype == 4:
            for i in range(stride):
                a = line[i-channels] if i >= channels else 0
                c = prev[i-channels] if i >= channels else 0
                line[i] = (line[i] + paeth(a, prev[i], c)) & 255
        out[y*stride:(y+1)*stride] = line
        prev = line
    return width, height, channels, out

TILE = 16  # 원본 픽셀 / 타일

def classify(r, g, b):
    if b >= 150 and b - r >= 22 and b >= g - 10: return '~'  # 바다
    if g - r >= 12 and g - b >= 12 and g >= 120:  return ','  # 잔디/공원
    if r - b >= 24 and r >= 150 and g >= b - 4:    return '#'  # 건물(따뜻한 톤)
    return '.'                                                 # 육지/도로

def is_poi_icon(r, g, b):
    # 채도 높은 붉은/주황 아이콘(식당/카페 등)
    return r >= 170 and r - b >= 55 and r - g >= 30

def build_grid(path):
    w, h, ch, px = decode_png(path)
    gw, gh = w // TILE, h // TILE
    grid = [['.'] * gw for _ in range(gh)]
    poi_hits = [[0] * gw for _ in range(gh)]
    for gy in range(gh):
        for gx in range(gw):
            R = G = B = n = 0
            hits = 0
            for yy in range(gy*TILE, (gy+1)*TILE, 3):
                base = yy * w
                for xx in range(gx*TILE, (gx+1)*TILE, 3):
                    i = (base + xx) * ch
                    r, g, b = px[i], px[i+1], px[i+2]
                    R += r; G += g; B += b; n += 1
                    if is_poi_icon(r, g, b): hits += 1
            grid[gy][gx] = classify(R//n, G//n, B//n)
            poi_hits[gy][gx] = hits
    return gw, gh, grid, poi_hits

def clean_water(gw, gh, grid, min_body=14):
    """큰 물줄기에 연결되지 않은 작은 물 얼룩은 육지로 치환(노이즈 억제)."""
    seen = [[False]*gw for _ in range(gh)]
    for sy in range(gh):
        for sx in range(gw):
            if grid[sy][sx] != '~' or seen[sy][sx]: continue
            comp = []
            dq = deque([(sx, sy)]); seen[sy][sx] = True
            while dq:
                x, y = dq.popleft(); comp.append((x, y))
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < gw and 0 <= ny < gh and not seen[ny][nx] and grid[ny][nx] == '~':
                        seen[ny][nx] = True; dq.append((nx, ny))
            if len(comp) < min_body:
                for x, y in comp: grid[y][x] = '.'

def bridge_diagonals(gw, gh, grid):
    """대각선으로만 연결된 걷기 가능 타일 사이를 뚫어 4-연결성 확보.
    (얇은 방파제/계단식 길이 타일 코너에서 막히는 것을 방지)"""
    walk = lambda x, y: grid[y][x] in ('.', ',')
    for y in range(gh - 1):
        for x in range(gw - 1):
            a, b = grid[y][x], grid[y+1][x+1]
            c, d = grid[y][x+1], grid[y+1][x]
            if walk(x, y) and walk(x+1, y+1) and not walk(x+1, y) and not walk(x, y+1):
                grid[y][x+1] = '.'   # ↘ 대각 연결
            elif walk(x+1, y) and walk(x, y+1) and not walk(x, y) and not walk(x+1, y+1):
                grid[y][x] = '.'     # ↙ 대각 연결

def extract_pois(gw, gh, grid, poi_hits, min_hits=4):
    """POI 아이콘 히트를 군집화하여 대표 좌표 목록 생성."""
    seen = [[False]*gw for _ in range(gh)]
    pois = []
    for sy in range(gh):
        for sx in range(gw):
            if poi_hits[sy][sx] < min_hits or seen[sy][sx]: continue
            comp = []
            dq = deque([(sx, sy)]); seen[sy][sx] = True
            while dq:
                x, y = dq.popleft(); comp.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x+dx, y+dy
                        if 0 <= nx < gw and 0 <= ny < gh and not seen[ny][nx] and poi_hits[ny][nx] >= min_hits:
                            seen[ny][nx] = True; dq.append((nx, ny))
            cx = round(sum(p[0] for p in comp) / len(comp))
            cy = round(sum(p[1] for p in comp) / len(comp))
            pois.append({'col': cx, 'row': cy, 'kind': 'food'})
    return pois

# ── 지역별 지도 목록 및 표시 이름 ──
REGIONS = {
    'sokcho': [
        ('sokcho_sokchohang_3',              '속초항 (남측)'),
        ('sokcho_sokchohang_2',              '속초항 (중앙)'),
        ('sokcho_sokchohang_1',              '속초항 (북측)'),
        ('sokcho_sokchohang_dongmyeonghang', '속초항·동명항 연결로'),
        ('sokcho_dongmyeonghang_1',          '동명항 (북측)'),
        ('sokcho_dongmyeonghang_2',          '동명항 (중앙)'),
        ('sokcho_dongmyeonghang_3',          '동명항 (남측)'),
    ],
    # 부산 4구역 8맵 (2026-07-17) — 구역 간 연결은 core/RegionMap.ts BUSAN_MAP_GRAPH 참고
    'busan': [
        ('busan_gamcheon_west_1',  '감천항 서방파제 (감천동)'),
        ('busan_gamcheon_west_2',  '감천항 서방파제'),
        ('busan_gamcheon_east_1',  '감천항 제3부두·모지포'),
        ('busan_gamcheon_east_2',  '감천항 제4부두·수산시장'),
        ('busan_gamcheon_east_3',  '감천항 동방파제'),
        ('busan_amnam_1',          '암남공원 주차장'),
        ('busan_baegunpo_1',       '백운포 체육공원'),
        ('busan_baegunpo_2',       '백운포 방파제'),
    ],
}

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    targets = sys.argv[1:] or list(REGIONS.keys())
    for region in targets:
        maps = REGIONS[region]
        src_dir = os.path.join(root, 'pixelazed', region)
        out_dir = os.path.join(root, 'packages', 'client-pc', 'public', 'data', region)
        os.makedirs(out_dir, exist_ok=True)
        for map_id, name in maps:
            src = os.path.join(src_dir, map_id + '.png')
            gw, gh, grid, poi_hits = build_grid(src)
            clean_water(gw, gh, grid)
            bridge_diagonals(gw, gh, grid)
            pois = extract_pois(gw, gh, grid, poi_hits)
            terrain = [''.join(row) for row in grid]
            counts = {}
            for row in grid:
                for c in row: counts[c] = counts.get(c, 0) + 1
            doc = {
                'id': map_id, 'name': name, 'tile': TILE,
                'cols': gw, 'rows': gh, 'terrain': terrain, 'pois': pois,
            }
            out = os.path.join(out_dir, map_id + '.json')
            with open(out, 'w', encoding='utf-8') as f:
                json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
            tot = gw * gh
            summary = ' '.join(f'{k}:{round(100*v/tot)}%' for k, v in sorted(counts.items()))
            print(f'  ✓ {map_id:38s} {gw}x{gh}  [{summary}]  POI:{len(pois)}')
        print(f'[{region}] {len(maps)}개 맵 → {out_dir}')

if __name__ == '__main__':
    main()
