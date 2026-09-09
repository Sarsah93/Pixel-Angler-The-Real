#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_fishfarms.py — 국립해양조사원 어장정보(SHP) → 지역 타일 좌표 어장 폴리곤 `fishfarms.json` (121차).

    py tools/extract_fishfarms.py sokcho_v2

입력: docs/reference/gis/khoa_fishfarm_20250813/TL_DIST_FSHFRM.{shp,shx,dbf}
  (공공데이터포털 15130109 "해양수산부 국립해양조사원_어장정보_20250813" — EPSG:5179 Korea 2000 Unified TM,
   GRS80 · 중앙자오선 127.5° · 원점 위도 38° · k 0.9996 · FE 1,000,000 · FN 2,000,000 · DBF는 EUC-KR)
  ⚠ 원본 SHP/DBF는 114MB — .gitignore 대상. 이 도구의 산출물(수 KB)만 커밋한다.

출력: packages/client-pc/public/data/<region>/fishfarms.json
  { region, source, farms: [{ gid, kind, kindKo, name, license, method, farmDesc, areaHa, validFrom, validUntil,
                              rings: [[[tx, ty], ...], ...] }] }
  - 타일 좌표는 build_osm_tilemap.py와 같은 등장방형 매핑(meta.bbox · width/height) — extract_lights.py와 동일.
  - 폴리곤은 지역 bbox와 **실제로 교차**하는 것만. 링은 Douglas-Peucker(0.35타일)로 간소화(2,996점 → 수백 점).
  - kind 매핑: 마을어업 = village · 협동양식업 = coop · 정치망어업 = setnet · 패류/복합양식업 = shellfish_farm ·
    어류등양식업 = cage · 그 외 other. **강원 조례(2024-07-26) 금지 구역 = village + coop**(어촌계 어장 = 마을어장·협동양식장).

표준 라이브러리만 사용(build_depth_profiles.py 전례 — rasterio/pyshp 불요).
"""
from __future__ import annotations

import json
import math
import os
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'docs', 'reference', 'gis', 'khoa_fishfarm_20250813')
SRC_BASE = os.path.join(SRC_DIR, 'TL_DIST_FSHFRM')
SOURCE_LABEL = '해양수산부 국립해양조사원_어장정보_20250813 (data.go.kr 15130109 · EPSG:5179)'

# ── EPSG:5179 (Korea 2000 Unified) 역변환 — GRS80 ─────────────────────────
A = 6378137.0
F = 1 / 298.257222101
K0 = 0.9996
LON0 = math.radians(127.5)
LAT0 = math.radians(38.0)
FE = 1_000_000.0
FN = 2_000_000.0
E2 = F * (2 - F)
EP2 = E2 / (1 - E2)


def _merid_arc(lat: float) -> float:
    e4 = E2 * E2
    e6 = e4 * E2
    return A * ((1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * lat
                - (3 * E2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * math.sin(2 * lat)
                + (15 * e4 / 256 + 45 * e6 / 1024) * math.sin(4 * lat)
                - (35 * e6 / 3072) * math.sin(6 * lat))


M0 = _merid_arc(LAT0)


def tm_to_latlon(x: float, y: float) -> tuple[float, float]:
    m = M0 + (y - FN) / K0
    mu = m / (A * (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 ** 3 / 256))
    e1 = (1 - math.sqrt(1 - E2)) / (1 + math.sqrt(1 - E2))
    fp = (mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu)
          + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu)
          + (151 * e1 ** 3 / 96) * math.sin(6 * mu))
    sf, cf, tf = math.sin(fp), math.cos(fp), math.tan(fp)
    c1 = EP2 * cf * cf
    t1 = tf * tf
    n1 = A / math.sqrt(1 - E2 * sf * sf)
    r1 = A * (1 - E2) / (1 - E2 * sf * sf) ** 1.5
    d = (x - FE) / (n1 * K0)
    lat = fp - (n1 * tf / r1) * (d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * EP2) * d ** 4 / 24
                                 + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * EP2 - 3 * c1 * c1) * d ** 6 / 720)
    lon = LON0 + (d - (1 + 2 * t1 + c1) * d ** 3 / 6
                  + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * EP2 + 24 * t1 * t1) * d ** 5 / 120) / cf
    return math.degrees(lat), math.degrees(lon)


# ── SHP/DBF 판독 ──────────────────────────────────────────────────────────
def read_dbf_fields(f) -> tuple[int, int, int, list[tuple[str, str, int]]]:
    hdr = f.read(32)
    nrec, hlen, rlen = struct.unpack('<IHH', hdr[4:12])
    fields: list[tuple[str, str, int]] = []
    while True:
        fd = f.read(32)
        if fd[0] == 0x0D:
            break
        fields.append((fd[:11].split(b'\0')[0].decode('ascii'), chr(fd[11]), fd[16]))
    return nrec, hlen, rlen, fields


KIND_MAP = {
    '마을어업': 'village',
    '협동양식업': 'coop',
    '정치망어업': 'setnet',
    '패류양식업': 'shellfish_farm',
    '복합양식업': 'shellfish_farm',
    '어류등양식업': 'cage',
}


def simplify(pts: list[tuple[float, float]], tol: float) -> list[tuple[float, float]]:
    """Douglas-Peucker (닫힌 링 — 첫/끝점 유지)."""
    if len(pts) < 4:
        return pts

    def dist(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0:
            return math.hypot(px - ax, py - ay)
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

    def dp(lo: int, hi: int, keep: list[bool]) -> None:
        if hi <= lo + 1:
            return
        best, bi = -1.0, -1
        for i in range(lo + 1, hi):
            d = dist(pts[i], pts[lo], pts[hi])
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            dp(lo, bi, keep)
            dp(bi, hi, keep)

    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    # 닫힌 링은 중간 앵커 하나를 강제해 "전부 한 직선"으로 무너지지 않게 한다
    mid = len(pts) // 2
    keep[mid] = True
    dp(0, mid, keep)
    dp(mid, len(pts) - 1, keep)
    return [p for p, k in zip(pts, keep) if k]


def main(region: str) -> None:
    out_dir = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'data', region)
    with open(os.path.join(out_dir, 'meta.json'), encoding='utf-8') as f:
        meta = json.load(f)
    s, w, n, e = meta['bbox']
    W, H = meta['width'], meta['height']

    def to_tile(lat: float, lon: float) -> tuple[float, float]:
        return (lon - w) / (e - w) * W, (n - lat) / (n - s) * H

    for ext in ('.shp', '.shx', '.dbf'):
        if not os.path.exists(SRC_BASE + ext):
            sys.exit(f'원본 없음: {SRC_BASE}{ext} — docs/reference/gis/README.md 참조')

    fdb = open(SRC_BASE + '.dbf', 'rb')
    nrec, hlen, rlen, fields = read_dbf_fields(fdb)

    def record(i: int) -> dict[str, str]:
        fdb.seek(hlen + i * rlen)
        raw = fdb.read(rlen)[1:]
        out: dict[str, str] = {}
        p = 0
        for name, _t, ln in fields:
            out[name] = raw[p:p + ln].decode('cp949', 'replace').strip()
            p += ln
        return out

    fshx = open(SRC_BASE + '.shx', 'rb'); fshx.seek(100)
    fshp = open(SRC_BASE + '.shp', 'rb')
    farms = []
    for i in range(nrec):
        off, _ln = struct.unpack('>ii', fshx.read(8))
        fshp.seek(off * 2 + 8)
        st = struct.unpack('<i', fshp.read(4))[0]
        if st != 5:
            continue
        bx = struct.unpack('<4d', fshp.read(32))
        la0, lo0 = tm_to_latlon(bx[0], bx[1])
        la1, lo1 = tm_to_latlon(bx[2], bx[3])
        if lo1 < w or lo0 > e or la1 < s or la0 > n:
            continue
        nparts, npts = struct.unpack('<ii', fshp.read(8))
        parts = struct.unpack(f'<{nparts}i', fshp.read(4 * nparts))
        pts = struct.unpack(f'<{2 * npts}d', fshp.read(16 * npts))
        rings = []
        for k in range(nparts):
            a = parts[k]
            b = parts[k + 1] if k + 1 < nparts else npts
            ring = [to_tile(*tm_to_latlon(pts[2 * j], pts[2 * j + 1])) for j in range(a, b)]
            ring = simplify(ring, 0.35)
            rings.append([[round(x, 2), round(y, 2)] for x, y in ring])
        r = record(i)
        knd = r['fids_knd']
        farms.append({
            'gid': int(r['gid']),
            'kind': KIND_MAP.get(knd, 'other'),
            'kindKo': knd,
            'name': r['lcns_no'] or f"{knd} {r['gid']}",
            'license': r['lcns_no'],
            'method': r['fids_mthd'],
            'farmDesc': r['farm_knd'],
            'areaHa': round(float(r['area'] or 0), 1),
            'validFrom': r['lcns_bgng_'],
            'validUntil': r['lcns_end_y'],
            'admin': r['sgg_nm'],
            'rings': rings,
        })

    farms.sort(key=lambda x: (x['kind'], x['gid']))
    out = {'region': region, 'source': SOURCE_LABEL, 'crs': 'tile', 'farms': farms}
    path = os.path.join(out_dir, 'fishfarms.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    sys.stdout.reconfigure(encoding='utf-8')
    print(f'{region}: 어장 폴리곤 {len(farms)}개 → {os.path.relpath(path, ROOT)} ({os.path.getsize(path):,} bytes)')
    for x in farms:
        npt = sum(len(r) for r in x['rings'])
        print(f"  gid={x['gid']} {x['kind']:14s} {x['name']:14s} {x['method']:5s} {x['farmDesc'][:24]:24s} "
              f"{x['areaHa']:6.1f}ha ~{x['validUntil']} rings={len(x['rings'])} pts={npt}")


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'sokcho_v2')
