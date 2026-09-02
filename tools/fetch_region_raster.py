# -*- coding: utf-8 -*-
"""Sentinel-2 L2A 래스터 수집 — Sentinel Hub Process API (RASTER_UPLIFT_SPEC §1·§9-1).

사용법:  py tools/fetch_region_raster.py <region>          (예: sokcho_v2)
입력:    regions_config.py 의 bbox + raster.scenes (기준 장면 날짜)
         레포 루트 .env 의 CDSE_CLIENT_ID / CDSE_CLIENT_SECRET (OAuth client credentials)
출력:    pixelazed/_rastercache/<region>/s2_<YYYYMMDD>.tif        (B02,B03,B04,B08,B11,dataMask — float32)
         pixelazed/_rastercache/<region>/s2_<YYYYMMDD>_meta.json  (UTM 지오레퍼런스 사이드카)

설계 노트 (스펙 §0-1·§1-1):
- 영상은 **UTM 원격자(10m)** 그대로 받는다 — 게임 격자로 warp 하지 않는다.
  classify_raster.py 가 게임 타일 중심 → UTM → 픽셀 인덱스 "역방향 샘플링"으로 소비한다.
- 지오레퍼런스는 GeoTIFF 태그 파싱 대신 사이드카 JSON(minx/maxy/res/크기/CRS)으로 고정 —
  tifffile 만으로 소비 가능(레포는 rasterio 미설치 — Python 3.14 wheel 리스크 회피).
- 20m 밴드(B11)는 Process API 의 upsampling=NEAREST 로 10m 격자에 얹힌다 (§0-1).
- 자격증명은 .env 에서만 로드 — 하드코딩·로그 출력 금지 (스펙 §8).
"""
import json
import io as _io
import sys as _sys
try:
    _sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass
import math
import sys
import urllib.request
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from regions_config import REGIONS

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'pixelazed' / '_rastercache'

TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process'
RES_M = 10.0          # Sentinel-2 원해상도 — 여기서 바꾸지 말 것 (§0-1)
PAD_M = 60.0          # bbox 바깥 여유 (게임 격자 가장자리 타일의 샘플 이탈 방지)
BANDS = ['B02', 'B03', 'B04', 'B08', 'B11']

EVALSCRIPT = """//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B02","B03","B04","B08","B11","dataMask"], units: "REFLECTANCE" }],
    output: { bands: 6, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(s) {
  return [s.B02, s.B03, s.B04, s.B08, s.B11, s.dataMask];
}
"""


def load_env():
    """레포 루트 .env 파서 (KEY=VALUE — 값은 로그에 출력 금지)."""
    env = {}
    p = ROOT / '.env'
    if not p.exists():
        sys.exit('[err] 루트 .env 없음 — CDSE_CLIENT_ID/CDSE_CLIENT_SECRET 배치 필요 (스펙 §8)')
    for line in p.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def get_token(cid, secret):
    data = urllib.parse.urlencode({
        'grant_type': 'client_credentials', 'client_id': cid, 'client_secret': secret,
    }).encode()
    req = urllib.request.Request(TOKEN_URL, data=data,
                                 headers={'Content-Type': 'application/x-www-form-urlencoded'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)['access_token']
    except urllib.error.HTTPError as e:
        # 본문에 자격증명이 에코될 수 있으므로 상태 코드만 노출
        sys.exit(f'[err] CDSE 토큰 발급 실패 HTTP {e.code} — client id/secret 확인')


def utm_zone_epsg(lon, lat):
    zone = int((lon + 180) // 6) + 1
    return (32600 if lat >= 0 else 32700) + zone, zone


def main(region):
    cfg = REGIONS.get(region)
    if not cfg:
        sys.exit(f'[err] 미등록 지역: {region}')
    raster = cfg.get('raster')
    if not raster or not raster.get('scenes'):
        sys.exit(f'[err] regions_config[{region!r}] 에 raster.scenes 미지정 (스펙 §4 — 정찰로 확정한 날짜)')

    s, w, n, e = cfg['bbox']
    epsg, zone = utm_zone_epsg((w + e) / 2, (s + n) / 2)

    from pyproj import Transformer
    tf = Transformer.from_crs('EPSG:4326', f'EPSG:{epsg}', always_xy=True)
    xs, ys = zip(*[tf.transform(lon, lat) for lon, lat in
                   [(w, s), (w, n), (e, s), (e, n)]])
    # 10m 정렬 + 여유 — Sentinel 원격자와 어긋나지 않게 floor/ceil
    minx = math.floor((min(xs) - PAD_M) / RES_M) * RES_M
    maxx = math.ceil((max(xs) + PAD_M) / RES_M) * RES_M
    miny = math.floor((min(ys) - PAD_M) / RES_M) * RES_M
    maxy = math.ceil((max(ys) + PAD_M) / RES_M) * RES_M
    width = int((maxx - minx) / RES_M)
    height = int((maxy - miny) / RES_M)
    if max(width, height) > 2400:
        sys.exit(f'[err] 요청 {width}x{height}px — Process API 상한(2500) 근접. bbox 분할 필요')

    env = load_env()
    token = get_token(env.get('CDSE_CLIENT_ID', ''), env.get('CDSE_CLIENT_SECRET', ''))

    out_dir = CACHE / region
    out_dir.mkdir(parents=True, exist_ok=True)

    for scene in raster['scenes'] + raster.get('scenes_spare', [])[:0]:  # 기준 장면만 (§2 — 예비는 수동)
        day = scene.replace('-', '')
        body = {
            'input': {
                'bounds': {
                    'bbox': [minx, miny, maxx, maxy],
                    'properties': {'crs': f'http://www.opengis.net/def/crs/EPSG/0/{epsg}'},
                },
                'data': [{
                    'type': 'sentinel-2-l2a',
                    'dataFilter': {'timeRange': {'from': f'{scene}T00:00:00Z', 'to': f'{scene}T23:59:59Z'}},
                    'processing': {'upsampling': 'NEAREST', 'downsampling': 'NEAREST'},
                }],
            },
            'output': {
                'width': width, 'height': height,
                'responses': [{'identifier': 'default', 'format': {'type': 'image/tiff'}}],
            },
            'evalscript': EVALSCRIPT,
        }
        req = urllib.request.Request(
            PROCESS_URL, data=json.dumps(body).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json',
                     'Accept': 'image/tiff'})
        print(f'[fetch] {region} {scene} — {width}x{height}px @10m UTM{zone}N (EPSG:{epsg}) …')
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                tif = r.read()
        except urllib.error.HTTPError as err:
            detail = err.read()[:400].decode('utf-8', 'replace')
            sys.exit(f'[err] Process API HTTP {err.code}: {detail}')

        tif_path = out_dir / f's2_{day}.tif'
        tif_path.write_bytes(tif)
        meta = {
            'region': region, 'scene': scene, 'crs': f'EPSG:{epsg}',
            'minx': minx, 'maxy': maxy, 'resx': RES_M, 'resy': RES_M,
            'width': width, 'height': height,
            'bands': BANDS + ['dataMask'], 'units': 'REFLECTANCE',
            'source': 'Copernicus Sentinel-2 L2A via Sentinel Hub Process API',
        }
        (out_dir / f's2_{day}_meta.json').write_text(
            json.dumps(meta, indent=1), encoding='utf-8')
        print(f'[ok] {tif_path}  ({len(tif) / 1024:.0f} KB) + 사이드카 meta')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('usage: py tools/fetch_region_raster.py <region>')
    main(sys.argv[1])
