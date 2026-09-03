"""OSM 캐시 → 항로표지(등대·등주) 목록 `lights.json` (114차).

`build_osm_tilemap.py`의 POI 추출은 **이름 있는** `man_made=lighthouse`만 남긴다.
방파제 두부의 등대는 대부분 이름이 없고 `seamark:type=light_minor`·`beacon_lateral` 노드로만
존재해 pois.json에서 빠졌다(속초: 5개 중 2개만 수록). 이 스크립트는 지형 재빌드 없이
**등대만 따로** 뽑아 `packages/client-pc/public/data/<region>/lights.json`에 쓴다.

    py tools/extract_lights.py sokcho_v2

출력 스키마: [{ "tx": 정수, "ty": 정수, "colour": "red"|"green"|"white", "kind": "lighthouse"|"beacon", "name"?: str }]
- 타일 좌표는 build_osm_tilemap.py와 같은 등장방형 매핑(meta.bbox · width/height).
- colour = `seamark:light:colour` (없으면 white). 한국 항로표지 관례: 홍색 등대(우현) = red ·
  백색 등대 + 녹색 등화(좌현) = green · 그 외 white.
- 언덕 위 대형 등대(`light_major`)는 `kind: "lighthouse"`, `major: true`로 표시 — 방파제 프롭과 구분.
"""
from __future__ import annotations

import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(region: str) -> None:
    cache = sorted(glob.glob(os.path.join(ROOT, 'pixelazed', '_osmcache', f'{region}*.json')))
    if not cache:
        sys.exit(f'OSM 캐시 없음: pixelazed/_osmcache/{region}*.json')
    out_dir = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'data', region)
    with open(os.path.join(out_dir, 'meta.json'), encoding='utf-8') as f:
        meta = json.load(f)
    s, w, n, e = meta['bbox']
    W, H = meta['width'], meta['height']

    def to_tile(lat: float, lon: float) -> tuple[int, int]:
        return int((lon - w) / (e - w) * W), int((n - lat) / (n - s) * H)

    lights = []
    seen: set[int] = set()
    for path in cache:
        with open(path, encoding='utf-8') as f:
            d = json.load(f)
        for el in (d.get('elements', d) if isinstance(d, dict) else d):
            if el.get('type') != 'node' or el.get('id') in seen:
                continue
            t = el.get('tags') or {}
            st = t.get('seamark:type', '')
            is_lh = t.get('man_made') == 'lighthouse'
            is_beacon = st.startswith('beacon_')
            if not (is_lh or st in ('light_minor', 'light_major') or is_beacon):
                continue
            seen.add(el['id'])
            tx, ty = to_tile(el['lat'], el['lon'])
            if not (0 <= tx < W and 0 <= ty < H):
                continue
            colour = (t.get('seamark:light:colour') or t.get('seamark:light:1:colour')
                      or t.get('seamark:beacon_lateral:colour') or 'white').lower()
            if colour not in ('red', 'green', 'white'):
                colour = 'white'
            entry: dict = {'tx': tx, 'ty': ty, 'colour': colour, 'kind': 'beacon' if is_beacon else 'lighthouse'}
            if st == 'light_major':
                entry['major'] = True
            name = t.get('name:ko') or t.get('name')
            if name:
                entry['name'] = name
            lights.append(entry)

    lights.sort(key=lambda x: (x['ty'], x['tx']))
    out = os.path.join(out_dir, 'lights.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(lights, f, ensure_ascii=False, indent=0)
    print(f'{region}: 항로표지 {len(lights)}개 → {os.path.relpath(out, ROOT)}')
    for x in lights:
        print(f"  ({x['tx']},{x['ty']}) {x['colour']:5s} {x['kind']}{' major' if x.get('major') else ''} {x.get('name','')}")


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'sokcho_v2')
