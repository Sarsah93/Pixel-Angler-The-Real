# -*- coding: utf-8 -*-
"""
backfill_hospital_poi.py — 이미 빌드된 지역의 pois.json 에 병원(amenity=hospital|clinic|doctors)을 채운다.

배경(129차 P7): 병원 진료(감기·독감·생물중독 치료)를 붙이려는데, `fetch_region_osm.py` 의
Overpass 질의에 병원 태그가 **아예 빠져 있었다** — 캐시에도 없으니 재빌드해도 안 나온다.
질의와 POI_TAGS 는 이제 병원을 포함하지만, **이미 구운 지역을 다시 굽는 것은 비싸고
회귀 위험이 있다**(래스터 병합·패치 보존·검증). 이 도구는 병원만 따로 질의해
osmId 중복을 피해 pois.json 에 머지한다. 멱등(idempotent)이다.

  py tools/backfill_hospital_poi.py sokcho_v2

입력:  packages/client-pc/public/data/<region>/meta.json  (bbox)
갱신:  pixelazed/<region>/pois.json                        (정본)
       packages/client-pc/public/data/<region>/pois.json   (런타임 사본 — 있으면)

⚠ 네트워크 필요 — Overpass API(overpass-api.de)에 접근할 수 없는 환경에서는 실행되지 않는다.
  (원격 세션에서 egress 정책으로 차단되는 것을 129차에 실측. 그래서 홈타운 보건소는
   OSM 과 무관한 절차 배치(core HOMETOWN_OBJECTS)로 두어, 병원 기능 자체는 항상 동작한다.)
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENDPOINT = 'https://overpass-api.de/api/interpreter'
QUERY = """[out:json][timeout:90];
(
  node["amenity"~"^(hospital|clinic|doctors)$"]({bbox});
  way["amenity"~"^(hospital|clinic|doctors)$"]({bbox});
);
out center tags;"""


def fetch(bbox):
    body = urllib.parse.urlencode({'data': QUERY.format(bbox=bbox)}).encode()
    req = urllib.request.Request(ENDPOINT, data=body,
                                 headers={'User-Agent': 'pixel-angler/1.0'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:              # noqa: BLE001 — 재시도 후 안내하고 종료
            print(f'[!] Overpass 요청 실패({attempt + 1}/3): {e}')
            time.sleep(5)
    sys.exit('[!] Overpass 에 접근할 수 없습니다 — 네트워크가 열린 환경에서 실행하세요.')


def main():
    if len(sys.argv) < 2:
        sys.exit('사용법: py tools/backfill_hospital_poi.py <region>   (예: sokcho_v2)')
    region = sys.argv[1]
    runtime_dir = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'data', region)
    meta_path = os.path.join(runtime_dir, 'meta.json')
    if not os.path.exists(meta_path):
        sys.exit(f'[!] meta.json 없음: {meta_path}')
    with open(meta_path, encoding='utf-8') as f:
        meta = json.load(f)
    south, west, north, east = meta['bbox']
    W, H = meta['width'], meta['height']
    doc = fetch(f'{south},{west},{north},{east}')

    # 위경도 → 타일 좌표: meta.bbox 를 맵 폭/높이에 선형 대응 (build_osm_tilemap 과 동일 규약)
    def proj(lat, lon):
        x = (lon - west) / (east - west) * W
        y = (north - lat) / (north - south) * H
        return int(x), int(y)

    found = []
    for el in doc.get('elements', []):
        t = el.get('tags') or {}
        lat = el.get('lat') or (el.get('center') or {}).get('lat')
        lon = el.get('lon') or (el.get('center') or {}).get('lon')
        if lat is None or lon is None:
            continue
        x, y = proj(lat, lon)
        if not (0 <= x < W and 0 <= y < H):
            continue
        found.append(dict(type='hospital', name=t.get('name:ko') or t.get('name') or '병원',
                          nameEn=t.get('name:en') or '', tx=x, ty=y, osmId=el['id']))
    print(f'[osm] 병원 후보 {len(found)}건')

    for path in (os.path.join(ROOT, 'pixelazed', region, 'pois.json'),
                 os.path.join(runtime_dir, 'pois.json')):
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8') as f:
            pois = json.load(f)
        have = {p.get('osmId') for p in pois}
        added = [p for p in found if p['osmId'] not in have]
        pois.extend(added)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(pois, f, ensure_ascii=False)
        print(f'[write] {path} — 추가 {len(added)}건 · 총 {len(pois)}건')


if __name__ == '__main__':
    main()
