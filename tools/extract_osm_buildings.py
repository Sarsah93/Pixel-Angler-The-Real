"""
OSM 건물 윤곽 · 종류 · 층수 추출 (239차) — `buildings.json`

지금까지 건물은 `build_osm_tilemap.py`가 폴리곤을 '#' 타일로 래스터화한 것뿐이라(종류 · 층수 · 윤곽이 버려졌다)
대각선 건물이 계단형 덩어리로 보였고(사용자: "짓다만 블럭 더미"), 아파트 · 상가 · 주택 · 학교가 같은 지붕이었다.
이 도구는 **지형을 다시 쓰지 않고** OSM 캐시에서 건물 폴리곤(타일 좌표 · 소수)과 태그만 뽑아 따로 둔다 —
클라이언트 `SeamlessChunks`가 '#' 성분 위에 이 폴리곤으로 벽 · 지붕을 그린다('#'은 걷기 · 충돌 정본 그대로).

입력:  pixelazed/_osmcache/<region>*.json (fetch_region_osm.py 산출) · regions_config.REGIONS[region].bbox
출력:  packages/client-pc/public/data/<region>/buildings.json · pixelazed/<region>/buildings.json (둘 다)

항목:  { id, kind, levels?, name?, pts: [[tx, ty], …] }
  - kind: OSM building=* 값을 묶는다 — apartments(아파트 · 기숙사) · commercial(상가 · retail · office · hotel) ·
    house(단독 · detached · residential) · public(학교 · 병원 · 교회 · 관공서) · industrial(창고 · 공장) · roof(지붕만 — 그늘막) · yes(모름)
  - levels: building:levels(정수) — 없으면 생략(클라이언트가 종류 · 면적으로 어림한다)
  - 정자(amenity=shelter · pavilion · gazebo)는 빌드 도구와 같이 뺀다(프롭 자리).
  - 지도 bbox 밖 폴리곤은 뺀다. 좌표는 타일 격자 기준(1타일 = 5m)이며 소수 둘째 자리.

사용: python tools/extract_osm_buildings.py [region=sokcho_v2]
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_osm_tilemap import load_parts, make_proj, way_pts, stitch_rings  # noqa: E402
from regions_config import REGIONS  # noqa: E402

KIND_OF = {
    'apartments': 'apartments', 'dormitory': 'apartments', 'residential': 'house', 'house': 'house', 'detached': 'house',
    'semidetached_house': 'house', 'terrace': 'house', 'bungalow': 'house', 'hut': 'house', 'cabin': 'house',
    'commercial': 'commercial', 'retail': 'commercial', 'office': 'commercial', 'hotel': 'commercial', 'supermarket': 'commercial',
    'kiosk': 'commercial', 'restaurant': 'commercial',
    'school': 'public', 'university': 'public', 'college': 'public', 'hospital': 'public', 'church': 'public', 'temple': 'public',
    'public': 'public', 'government': 'public', 'civic': 'public', 'fire_station': 'public', 'kindergarten': 'public', 'train_station': 'public',
    'warehouse': 'industrial', 'industrial': 'industrial', 'factory': 'industrial', 'hangar': 'industrial', 'boathouse': 'industrial',
    'garage': 'industrial', 'garages': 'industrial', 'shed': 'industrial', 'service': 'industrial',
    'roof': 'roof', 'carport': 'roof', 'greenhouse': 'roof',
}


def kind_of(tags: dict) -> str:
    b = tags.get('building', 'yes')
    if b in KIND_OF:
        return KIND_OF[b]
    if tags.get('shop') or tags.get('amenity') in ('restaurant', 'cafe', 'bank', 'pharmacy'):
        return 'commercial'
    if tags.get('tourism') == 'hotel':
        return 'commercial'
    return 'yes'


def levels_of(tags: dict):
    v = tags.get('building:levels')
    if not v:
        return None
    try:
        n = int(float(str(v).split(';')[0]))
        return n if 1 <= n <= 80 else None
    except ValueError:
        return None


def ring_area(pts) -> float:
    a = 0.0
    n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        a += x0 * y1 - x1 * y0
    return a / 2


def clean_ring(pts):
    """닫힌 점을 떼고 같은 점 연속을 지운다. 시계 방향(화면 y 아래)으로 통일한다."""
    out = []
    for p in pts:
        q = (round(p[0], 2), round(p[1], 2))
        if not out or out[-1] != q:
            out.append(q)
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    if len(out) < 3:
        return None
    if ring_area(out) < 0:
        out.reverse()
    return out


def main() -> None:
    region = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else 'sokcho_v2'
    if region not in REGIONS:
        raise SystemExit(f'지역 없음: {region}')
    cfg = REGIONS[region]
    root = Path(__file__).resolve().parent.parent
    nodes, ways, rels = load_parts(root, region)
    proj, W, H = make_proj(cfg['bbox'])

    def inside(pts) -> bool:
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        return max(xs) > 0 and min(xs) < W and max(ys) > 0 and min(ys) < H

    def skip(tags) -> bool:
        return tags.get('amenity') == 'shelter' or tags.get('building') in ('pavilion', 'gazebo')

    out = []
    kinds = {}
    for wy in ways.values():
        t = wy.get('tags', {})
        if 'building' not in t or skip(t):
            continue
        ring = clean_ring(way_pts(wy, nodes, proj))
        if not ring or not inside(ring):
            continue
        rec = {'id': f'w{wy["id"]}', 'kind': kind_of(t), 'pts': [list(p) for p in ring]}
        lv = levels_of(t)
        if lv:
            rec['levels'] = lv
        if t.get('name'):
            rec['name'] = t['name']
        out.append(rec)
        kinds[rec['kind']] = kinds.get(rec['kind'], 0) + 1
    for rl in rels:
        t = rl.get('tags', {})
        if 'building' not in t or skip(t):
            continue
        rg = stitch_rings(rl.get('members', []), ways, nodes, proj)
        for i, outer in enumerate(rg['outer']):
            ring = clean_ring(outer)
            if not ring or not inside(ring):
                continue
            rec = {'id': f'r{rl["id"]}_{i}', 'kind': kind_of(t), 'pts': [list(p) for p in ring]}
            lv = levels_of(t)
            if lv:
                rec['levels'] = lv
            if t.get('name'):
                rec['name'] = t['name']
            out.append(rec)
            kinds[rec['kind']] = kinds.get(rec['kind'], 0) + 1
    out.sort(key=lambda r: (min(p[1] for p in r['pts']), min(p[0] for p in r['pts'])))
    text = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    for dst in (root / 'packages/client-pc/public/data' / region / 'buildings.json', root / 'pixelazed' / region / 'buildings.json'):
        dst.write_text(text, encoding='utf-8')
    with_levels = sum(1 for r in out if 'levels' in r)
    print(f'[buildings] {region}: {len(out)}개 · 층수 있음 {with_levels} · 종류 {kinds} → {len(text):,}B')


if __name__ == '__main__':
    main()
