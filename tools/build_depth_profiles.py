#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_depth_profiles.py — 국립해양조사원 1/25,000 연안정보도 수심(SHP) →
게임용 "거리별 수심 프로필" JSON 변환 도구 (표준 라이브러리만 사용)

입력: 루트의 09.수심.zip (WGIS_DEPTHWATER.shp/dbf — Point + HSL 수심 속성)
  기준계 WGS84 / 좌표계 UTM-K (TM, lon0=127.5, lat0=38, k=0.99996,
  FE=1,000,000, FN=2,000,000)

출력: packages/client-pc/public/data/depth/<region>.json
  앵커(항구)별로 앵커에서의 수평 거리 100m 구간(bin) 평균 수심 배열.
  게임에서는 캐스팅 거리 → 구간 보간 수심, 제공 범위 초과 시 마지막
  기울기로 거리 비례 외삽한다 (core/types/DepthProfile.ts).

사용법:  py tools/build_depth_profiles.py
"""

import json
import math
import os
import struct
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP_PATH = os.path.join(ROOT, '09.수심.zip')
OUT_DIR = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'data', 'depth')

# ── 지역/앵커 정의 (실제 항구 좌표) ─────────────────────────
REGIONS = [
    {
        'region': 'gangwon_sokcho',
        'anchors': [
            {'id': 'sokchohang',     'name': '속초항',  'lat': 38.2043, 'lon': 128.5946},
            {'id': 'dongmyeonghang', 'name': '동명항',  'lat': 38.2126, 'lon': 128.6009},
        ],
    },
]

BIN_SIZE_M = 100      # 거리 구간 폭
MAX_DIST_M = 2500     # 프로필 최대 거리
SEARCH_RADIUS_M = 3000  # 앵커 주변 포인트 수집 반경

# ── UTM-K (TM/WGS84) 역변환 ────────────────────────────────
A = 6378137.0
F = 1 / 298.257223563
K0 = 0.99996
LON0 = math.radians(127.5)
LAT0 = math.radians(38.0)
FE = 1000000.0
FN = 2000000.0

E2 = F * (2 - F)
EP2 = E2 / (1 - E2)


def _merid_arc(lat):
    """자오선 호장 M(lat)"""
    return A * (
        (1 - E2 / 4 - 3 * E2 ** 2 / 64 - 5 * E2 ** 3 / 256) * lat
        - (3 * E2 / 8 + 3 * E2 ** 2 / 32 + 45 * E2 ** 3 / 1024) * math.sin(2 * lat)
        + (15 * E2 ** 2 / 256 + 45 * E2 ** 3 / 1024) * math.sin(4 * lat)
        - (35 * E2 ** 3 / 3072) * math.sin(6 * lat)
    )


M0 = _merid_arc(LAT0)


def tm_to_latlon(easting, northing):
    """UTM-K (E,N) → WGS84 (lat, lon) 도 단위"""
    m = M0 + (northing - FN) / K0
    mu = m / (A * (1 - E2 / 4 - 3 * E2 ** 2 / 64 - 5 * E2 ** 3 / 256))
    e1 = (1 - math.sqrt(1 - E2)) / (1 + math.sqrt(1 - E2))
    # 발밑 위도 (footpoint latitude)
    phi1 = (mu
            + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu)
            + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu)
            + (151 * e1 ** 3 / 96) * math.sin(6 * mu)
            + (1097 * e1 ** 4 / 512) * math.sin(8 * mu))

    sin1, cos1, tan1 = math.sin(phi1), math.cos(phi1), math.tan(phi1)
    c1 = EP2 * cos1 ** 2
    t1 = tan1 ** 2
    n1 = A / math.sqrt(1 - E2 * sin1 ** 2)
    r1 = A * (1 - E2) / (1 - E2 * sin1 ** 2) ** 1.5
    d = (easting - FE) / (n1 * K0)

    lat = phi1 - (n1 * tan1 / r1) * (
        d ** 2 / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * EP2) * d ** 4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * EP2 - 3 * c1 ** 2) * d ** 6 / 720
    )
    lon = LON0 + (
        d
        - (1 + 2 * t1 + c1) * d ** 3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * EP2 + 24 * t1 ** 2) * d ** 5 / 120
    ) / cos1
    return math.degrees(lat), math.degrees(lon)


def haversine_m(lat1, lon1, lat2, lon2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


# ── SHP/DBF 파싱 ────────────────────────────────────────────
def read_points(zf):
    """Point SHP + DBF(HSL) → [(lat, lon, depth_m)]"""
    shp = zf.read('WGIS_DEPTHWATER.shp')
    dbf = zf.read('WGIS_DEPTHWATER.dbf')

    # DBF: HSL 필드 오프셋 계산
    hdr_size, rec_size = struct.unpack('<HH', dbf[8:12])
    pos, offset, hsl_off, hsl_len = 32, 1, None, 0  # offset 1: 삭제 플래그
    while dbf[pos] != 0x0D:
        name = dbf[pos:pos + 11].split(b'\0')[0].decode('ascii', errors='replace')
        flen = dbf[pos + 16]
        if name == 'HSL':
            hsl_off, hsl_len = offset, flen
        offset += flen
        pos += 32
    if hsl_off is None:
        raise RuntimeError('HSL 필드를 찾을 수 없음')

    points = []
    shp_pos = 100  # SHP 헤더 이후
    rec_idx = 0
    n = len(shp)
    while shp_pos + 8 <= n:
        content_len, = struct.unpack('>i', shp[shp_pos + 4:shp_pos + 8])
        rec_start = shp_pos + 8
        shape_type, = struct.unpack('<i', shp[rec_start:rec_start + 4])
        if shape_type == 1:  # Point
            x, y = struct.unpack('<2d', shp[rec_start + 4:rec_start + 20])
            dbf_rec = hdr_size + rec_idx * rec_size
            raw = dbf[dbf_rec + hsl_off:dbf_rec + hsl_off + hsl_len]
            try:
                depth = float(raw.decode('ascii', errors='replace').strip() or 'nan')
            except ValueError:
                depth = float('nan')
            if not math.isnan(depth):
                lat, lon = tm_to_latlon(x, y)
                # HSL은 해수면 기준 음수 표고로 수록 — 수심(m)은 절대값
                points.append((lat, lon, abs(depth)))
        shp_pos = rec_start + content_len * 2
        rec_idx += 1
    return points


def build_profile(points, anchor):
    """앵커 주변 수심 포인트 → 100m 구간 평균 수심 배열"""
    n_bins = MAX_DIST_M // BIN_SIZE_M
    sums = [0.0] * n_bins
    counts = [0] * n_bins
    used = 0
    for lat, lon, depth in points:
        # 빠른 사전 필터 (위경도 박스 ±0.05° ≈ 5km)
        if abs(lat - anchor['lat']) > 0.05 or abs(lon - anchor['lon']) > 0.06:
            continue
        dist = haversine_m(anchor['lat'], anchor['lon'], lat, lon)
        if dist > SEARCH_RADIUS_M:
            continue
        b = min(n_bins - 1, int(dist // BIN_SIZE_M))
        sums[b] += depth
        counts[b] += 1
        used += 1

    depths = []
    for i in range(n_bins):
        depths.append(round(sums[i] / counts[i], 2) if counts[i] > 0 else None)

    # 빈 구간 보간 (앞뒤 유효값 선형)
    valid = [i for i, d in enumerate(depths) if d is not None]
    if not valid:
        return None, 0
    for i in range(n_bins):
        if depths[i] is not None:
            continue
        prev_i = max((v for v in valid if v < i), default=None)
        next_i = min((v for v in valid if v > i), default=None)
        if prev_i is not None and next_i is not None:
            t = (i - prev_i) / (next_i - prev_i)
            depths[i] = round(depths[prev_i] + (depths[next_i] - depths[prev_i]) * t, 2)
        elif prev_i is not None:
            depths[i] = depths[prev_i]
        else:
            depths[i] = depths[next_i]
    # 연안 프로필로서 단조성 완화 스무딩 (이웃 평균 1회)
    smoothed = depths[:]
    for i in range(1, n_bins - 1):
        smoothed[i] = round((depths[i - 1] + depths[i] * 2 + depths[i + 1]) / 4, 2)
    return smoothed, used


def main():
    if not os.path.exists(ZIP_PATH):
        print(f'입력 파일 없음: {ZIP_PATH}')
        sys.exit(1)

    print('SHP 파싱 중...')
    with zipfile.ZipFile(ZIP_PATH) as zf:
        points = read_points(zf)
    print(f'수심 포인트 {len(points)}개 (전국)')
    lats = [p[0] for p in points]
    lons = [p[1] for p in points]
    print(f'위경도 범위: lat {min(lats):.3f}~{max(lats):.3f}, lon {min(lons):.3f}~{max(lons):.3f}')

    os.makedirs(OUT_DIR, exist_ok=True)
    for region_def in REGIONS:
        anchors_out = []
        for anchor in region_def['anchors']:
            depths, used = build_profile(points, anchor)
            if depths is None:
                print(f"  [{anchor['name']}] 반경 {SEARCH_RADIUS_M}m 내 데이터 없음 — 건너뜀")
                continue
            print(f"  [{anchor['name']}] 포인트 {used}개 → {len(depths)}구간 "
                  f"(0~{MAX_DIST_M}m, 근거리 {depths[0]}m / 원거리 {depths[-1]}m)")
            anchors_out.append({
                'id': anchor['id'],
                'name': anchor['name'],
                'lat': anchor['lat'],
                'lon': anchor['lon'],
                'binSizeM': BIN_SIZE_M,
                'depthsM': depths,
            })
        out = {
            'region': region_def['region'],
            'source': '국립해양조사원 1/25,000 연안정보도 수심 (2011, WGIS_DEPTHWATER)',
            'anchors': anchors_out,
        }
        out_path = os.path.join(OUT_DIR, f"{region_def['region']}.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
        print(f'저장: {out_path}')


if __name__ == '__main__':
    main()
