# -*- coding: utf-8 -*-
"""지역 OSM 원본 데이터 수집기 (Overpass API → 로컬 캐시 JSON). v2 — 다지역·분할 수집.

사용법:  py tools/fetch_region_osm.py <region>          (지역 키는 regions_config.py)
출력:    pixelazed/_osmcache/<region>.part_<r>_<c>.json  (분할 수집 파츠)
         pixelazed/_osmcache/<region>_boundary.json      (boundaryMask 지정 지역만)

- 큰 bbox는 FETCH_SPLIT_DEG 격자로 쪼개 여러 번 요청한다(요청 간 5초 대기 — 공용 서버 예의).
- 한 번 받으면 이후 build는 전부 오프라인. 파츠가 이미 있으면 건너뛴다(재수집은 파일 삭제 후).
- ⚠대형 지역(인천·태안·포항·거제·여수·제주)은 응답 총량이 수백 MB·수십 분까지 갈 수 있다.
"""
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from regions_config import REGIONS, FETCH_SPLIT_DEG

SERVERS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
]

QUERY_TMPL = """
[out:json][timeout:300];
(
  way["natural"="coastline"]({bbox});
  way["natural"="water"]({bbox});
  relation["natural"="water"]({bbox});
  way["natural"="beach"]({bbox});
  way["natural"="wetland"]({bbox});
  way["landuse"~"^(grass|forest|meadow|recreation_ground|cemetery|farmland|orchard)$"]({bbox});
  way["leisure"~"^(park|garden|pitch|playground)$"]({bbox});
  way["building"]({bbox});
  relation["building"]({bbox});
  way["highway"]({bbox});
  way["man_made"~"^(breakwater|pier|groyne|quay)$"]({bbox});
  node["man_made"="lighthouse"]({bbox});
  node["amenity"~"^(toilets|police|ferry_terminal|fuel|restaurant|cafe|fast_food|marketplace|bank|pharmacy)$"]({bbox});
  way["amenity"~"^(toilets|police|ferry_terminal|marketplace)$"]({bbox});
  node["shop"]({bbox});
  way["shop"]({bbox});
  node["tourism"~"^(information|viewpoint|hotel|guest_house)$"]({bbox});
  node["leisure"="fishing"]({bbox});
);
out body; >; out skel qt;
"""

BOUNDARY_TMPL = """
[out:json][timeout:180];
relation["boundary"="administrative"]["admin_level"="{lvl}"]["name"="{name}"]({bbox});
out body; >; out skel qt;
"""


def _post(query: str) -> bytes:
    data = urllib.parse.urlencode({'data': query}).encode('utf-8')
    last = None
    for server in SERVERS:
        try:
            req = urllib.request.Request(server, data=data, headers={
                'User-Agent': 'PixelAnglerTheReal-mapbuilder/2.0 (personal game project)'})
            with urllib.request.urlopen(req, timeout=360) as resp:
                return resp.read()
        except Exception as e:  # noqa: BLE001 — 서버 폴백
            last = e
            print(f'[warn] {server} 실패: {e}')
            time.sleep(5)
    raise SystemExit(f'모든 Overpass 서버 실패: {last}')


def fetch(region: str) -> None:
    cfg = REGIONS[region]
    s, w, n, e = cfg['bbox']
    out_dir = Path(__file__).resolve().parent.parent / 'pixelazed' / '_osmcache'
    out_dir.mkdir(parents=True, exist_ok=True)

    rows = max(1, math.ceil((n - s) / FETCH_SPLIT_DEG))
    cols = max(1, math.ceil((e - w) / FETCH_SPLIT_DEG))
    print(f'[fetch] {region}: {rows}x{cols} = {rows * cols}개 파츠로 분할 수집')
    for r in range(rows):
        for c in range(cols):
            part = out_dir / f'{region}.part_{r}_{c}.json'
            if part.exists():
                print(f'[skip] {part.name} (기존재)')
                continue
            ps = s + (n - s) * r / rows; pn = s + (n - s) * (r + 1) / rows
            pw = w + (e - w) * c / cols; pe = w + (e - w) * (c + 1) / cols
            bbox = f'{ps},{pw},{pn},{pe}'
            print(f'[get ] part {r},{c}  bbox=({bbox})')
            raw = _post(QUERY_TMPL.format(bbox=bbox))
            doc = json.loads(raw)
            print(f'      elements={len(doc.get("elements", []))}  {len(raw)//1024} KB')
            part.write_bytes(raw)
            time.sleep(5)

    if cfg.get('boundaryMask'):
        bpath = out_dir / f'{region}_boundary.json'
        if not bpath.exists():
            print(f'[get ] 행정경계: {cfg["boundaryMask"]}')
            raw = _post(BOUNDARY_TMPL.format(name=cfg["boundaryMask"], lvl=cfg.get("adminLevel", 6), bbox=f"{s},{w},{n},{e}"))
            bpath.write_bytes(raw)
            print(f'      → {bpath.name} ({len(raw)//1024} KB)')
    print('[done] 수집 완료 — 이후 build_osm_tilemap.py는 오프라인으로 반복 실행 가능')


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in REGIONS:
        print('사용법: py tools/fetch_region_osm.py <region>')
        print('지역:', ', '.join(REGIONS))
        raise SystemExit(1)
    fetch(sys.argv[1])
