"""
캡처 POI 병합 (217차) — 사용자가 준 지도 캡처에서 판독한 가게를 심리스 POI(`pois.json`)에 합친다.

입력: pixelazed/<region>/capture_pois.json   (정본 — 이름 · 분류 · 위경도)
출력: pixelazed/<region>/pois.json · packages/client-pc/public/data/<region>/pois.json (둘 다 갱신)

- 몇 번을 돌려도 같다: 앞서 합친 캡처 항목(`src: 'capture'`)을 먼저 지우고 다시 넣는다.
  OSM 빌드(`build_osm_tilemap.py`)가 pois.json을 새로 쓰면 이 스크립트를 한 번 더 돌린다.
- 중복: OSM에 같은 이름(공백 · 기호 무시)이 8칸 안에 있으면 캡처 쪽을 버린다(OSM 정본 유지).
  캡처끼리도 같은 이름이 6칸 안이면 하나만(캡처가 겹쳐 같은 가게가 두 번 찍힌다).
- 분류: R 음식점 · C 카페/빵 · P 주점 · V 편의점/슈퍼 · M 마트 · H 약국 · L 숙박.
- osmId는 음수(-(캡처번호 × 1000 + 순번)) — 거래처 키(`<region>:osm:<id>`)가 OSM과 겹치지 않는다.

사용: python tools/merge_capture_pois.py [region=sokcho_v2]
"""
import json
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGION = sys.argv[1] if len(sys.argv) > 1 else 'sokcho_v2'
SRC = os.path.join(ROOT, 'pixelazed', REGION, 'capture_pois.json')
META = os.path.join(ROOT, 'packages/client-pc/public/data', REGION, 'meta.json')
OUTS = [os.path.join(ROOT, 'pixelazed', REGION, 'pois.json'),
        os.path.join(ROOT, 'packages/client-pc/public/data', REGION, 'pois.json')]

CAT = {
    'R': {'type': 'restaurant'},
    'C': {'type': 'cafe'},
    'P': {'type': 'shop', 'shopKind': 'pub'},
    'V': {'type': 'shop', 'shopKind': 'convenience'},
    'M': {'type': 'shop', 'shopKind': 'supermarket'},
    'H': {'type': 'pharmacy'},
    'L': {'type': 'lodging'},
}


# 국어의 로마자 표기법(간이 — 자모 단위 대응만, 음운 변화 규칙은 생략). 영어 로케일 상호 표기용
_CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
_JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
_JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']


def romanize(text: str) -> str:
    words = []
    for w in text.split():
        out = ''
        for ch in w:
            c = ord(ch)
            if 0xAC00 <= c <= 0xD7A3:
                i = c - 0xAC00
                out += _CHO[i // 588] + _JUNG[(i % 588) // 28] + _JONG[i % 28]
            else:
                out += ch
        words.append(out[:1].upper() + out[1:])
    return ' '.join(words)


def norm(s: str) -> str:
    return re.sub(r'[\s·&()\-_.]', '', s or '').lower()


def main() -> None:
    meta = json.load(open(META, encoding='utf-8'))
    lat0, lon0, lat1, lon1 = meta['bbox']
    tm = meta['tileMeters']
    latc = (lat0 + lat1) / 2

    def tile(lat: float, lon: float) -> tuple[int, int]:
        tx = (lon - lon0) * 111320 * math.cos(math.radians(latc)) / tm
        ty = (lat1 - lat) * 111132 / tm
        return round(tx), round(ty)

    src = json.load(open(SRC, encoding='utf-8'))
    base = [p for p in json.load(open(OUTS[1], encoding='utf-8')) if p.get('src') != 'capture']
    osm_names: dict[str, list[tuple[int, int]]] = {}
    for p in base:
        osm_names.setdefault(norm(p.get('name', '')), []).append((p['tx'], p['ty']))

    added: list[dict] = []
    dup_osm = dup_cap = out_of_map = 0
    seq: dict[int, int] = {}
    for c in src['pois']:
        tx, ty = tile(c['lat'], c['lon'])
        if not (0 <= tx < meta['width'] and 0 <= ty < meta['height']):
            out_of_map += 1
            continue
        k = norm(c['name'])
        if any(math.hypot(tx - x, ty - y) <= 8 for x, y in osm_names.get(k, [])):
            dup_osm += 1
            continue
        if any(norm(a['name']) == k and math.hypot(tx - a['tx'], ty - a['ty']) <= 6 for a in added):
            dup_cap += 1
            continue
        n = int(c['capture'])
        seq[n] = seq.get(n, 0) + 1
        added.append({**CAT[c['cat']], 'name': c['name'], 'nameEn': c.get('nameEn') or romanize(c['name']), 'tx': tx, 'ty': ty,
                      'osmId': -(n * 1000 + seq[n]), 'src': 'capture'})

    merged = base + added
    for path in OUTS:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(merged, ensure_ascii=False, indent=1))
    kinds: dict[str, int] = {}
    for a in added:
        key = a.get('shopKind') or a['type']
        kinds[key] = kinds.get(key, 0) + 1
    print(f'[capture] 입력 {len(src["pois"])} · 추가 {len(added)} · OSM 중복 {dup_osm} · 캡처 중복 {dup_cap} · 지도 밖 {out_of_map}')
    print('[capture] 종류', ', '.join(f'{k} {v}' for k, v in sorted(kinds.items(), key=lambda x: -x[1])))
    print(f'[capture] pois.json {len(merged)}건 (OSM {len(base)})')


if __name__ == '__main__':
    main()
