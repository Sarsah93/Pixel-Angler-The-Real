# -*- coding: utf-8 -*-
"""
backfill_poi_nameen.py — 이미 빌드된 지역의 pois.json 에 OSM 공식 영문명(name:en)을 채운다.

배경(120차): `build_osm_tilemap.py` 는 119차까지 `name:ko`/`name` 만 뽑아서 POI 라벨이
영어 로케일에서도 한글로 남았다. 파이프라인은 이제 `nameEn` 을 함께 내보내지만,
**이미 구워진 지역을 다시 굽는 것은 비싸고(래스터 병합·검증) 회귀 위험이 있다** —
이 도구는 OSM 원본 캐시에서 `name:en` 만 읽어 osmId 로 대조해 채워 넣는다.

  py tools/backfill_poi_nameen.py sokcho_v2

입력:  pixelazed/_osmcache/<region>.part_*.json  (fetch_region_osm.py 산출)
갱신:  pixelazed/<region>/pois.json               (정본)
       packages/client-pc/public/data/<region>/pois.json  (런타임 사본 — 있으면)

멱등(idempotent)하다 — 여러 번 돌려도 결과가 같다.
"""
import glob
import json
import os
import sys

# 콘솔이 cp949 여도 터지지 않게 (em dash 등)
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_name_en(region):
    """OSM 캐시 전 파트에서 osmId → name:en 사전을 만든다."""
    pat = os.path.join(ROOT, 'pixelazed', '_osmcache', f'{region}.part_*.json')
    files = sorted(glob.glob(pat))
    if not files:
        sys.exit(f'[!] OSM 캐시 없음: {pat}\n    먼저 py tools/fetch_region_osm.py {region}')
    table = {}
    for f in files:
        with open(f, encoding='utf-8') as fh:
            doc = json.load(fh)
        for el in doc.get('elements', []):
            en = (el.get('tags') or {}).get('name:en')
            if en:
                table[el['id']] = en
    print(f'[osm] 캐시 {len(files)}파트 · name:en {len(table):,}건')
    return table


def backfill(path, table):
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8') as f:
        pois = json.load(f)
    hit = miss = 0
    for p in pois:
        en = table.get(p.get('osmId'))
        if en:
            p['nameEn'] = en
            hit += 1
        else:
            # 키 자체는 항상 두어 스키마를 고르게 유지한다(없으면 클라이언트 사전이 맡는다)
            p.setdefault('nameEn', '')
            if p.get('name'):
                miss += 1
    # 정본은 사람이 읽으므로 indent, 런타임 사본은 최소 크기 — 원래 규칙을 따른다
    compact = 'public' in os.path.normpath(path).replace(os.sep, '/')
    with open(path, 'w', encoding='utf-8') as f:
        if compact:
            json.dump(pois, f, ensure_ascii=False, separators=(',', ':'))
        else:
            json.dump(pois, f, ensure_ascii=False, indent=1)
    print(f'[out] {os.path.relpath(path, ROOT)} — POI {len(pois):,} · name:en {hit:,} · 이름만 있음 {miss:,}')
    return pois


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: py tools/backfill_poi_nameen.py <region>   (예: sokcho_v2)')
    region = sys.argv[1]
    table = load_name_en(region)
    src = os.path.join(ROOT, 'pixelazed', region, 'pois.json')
    out = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'data', region, 'pois.json')
    if backfill(src, table) is None:
        sys.exit(f'[!] 정본 없음: {src}')
    if backfill(out, table) is None:
        print(f'[skip] 런타임 사본 없음: {out}')


if __name__ == '__main__':
    main()
