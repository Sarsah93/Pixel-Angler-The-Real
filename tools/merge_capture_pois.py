"""
캡처 POI 병합 (217차) + 게임 상호 바꾸기 (218 · 219차) — 사용자가 준 지도 캡처에서 판독한 가게를 심리스 POI(`pois.json`)에 합치고,
OSM 가게 이름을 게임 상호(`name_alias.json` — 실제 상호를 조금씩 바꾼 것)로 바꿔 쓴다.

입력: pixelazed/<region>/capture_pois.json   (정본 — **게임 상호** · 분류 · 위경도. 원래 상호는 보관하지 않는다)
      pixelazed/<region>/name_alias.json     (OSM 원래 이름의 SHA-1 앞 16자 → 게임 이름 · 영어 표기 — 평문 상호 없음)
출력: pixelazed/<region>/pois.json · packages/client-pc/public/data/<region>/pois.json (둘 다 갱신)

- **pois.json을 새로 쓰는 도구 다음에는 반드시 이 스크립트를 마지막에 돌린다** — `build_osm_tilemap.py`(캡처분 · 게임 상호가 사라진다) ·
  `backfill_poi_nameen.py`(OSM 영어 이름이 실제 상호로 돌아온다). 순서: OSM 빌드 → 영어 채우기 → 이 스크립트.
- 게임 상호: OSM 가게(음식점 · 카페 · 상점 · 숙박 · 약국 · 주유소 · 은행) — 이름(없으면 영어 이름)의 해시로 표를 찾는다.
  표에 없는 이름은 그대로 두고 경고한다(공공 · 협동조합 · 지명은 일부러 표에 없다). 이미 바뀐 이름(표의 값)은 다시 바꾸지 않는다.
  캡처 가게는 처음부터 게임 상호로 적는다(판독 → 바로 바꿔 적기).
- 표에 새 가게 추가: `python tools/merge_capture_pois.py --add "원래 이름" "게임 이름" ["영어"]` (원래 이름은 해시만 남는다).

- 몇 번을 돌려도 같다: 앞서 합친 캡처 항목(`src: 'capture'`)을 먼저 지우고 다시 넣는다.
  OSM 빌드(`build_osm_tilemap.py`)가 pois.json을 새로 쓰면 이 스크립트를 한 번 더 돌린다.
- 중복: OSM에 같은 이름(공백 · 기호 무시)이 8칸 안에 있으면 캡처 쪽을 버린다(OSM 정본 유지).
  캡처끼리도 같은 이름이 6칸 안이면 하나만(캡처가 겹쳐 같은 가게가 두 번 찍힌다).
- 분류: R 음식점 · C 카페/빵 · P 주점 · V 편의점/슈퍼 · M 마트 · H 약국 · L 숙박.
- osmId는 음수(-(캡처번호 × 1000 + 순번)) — 거래처 키(`<region>:osm:<id>`)가 OSM과 겹치지 않는다.

사용: python tools/merge_capture_pois.py [region=sokcho_v2]
"""
import hashlib
import json
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADD = sys.argv[sys.argv.index('--add') + 1:] if '--add' in sys.argv else None
REGION = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'sokcho_v2'
SRC = os.path.join(ROOT, 'pixelazed', REGION, 'capture_pois.json')
ALIAS = os.path.join(ROOT, 'pixelazed', REGION, 'name_alias.json')
BUSINESS = {'restaurant', 'cafe', 'shop', 'lodging', 'pharmacy', 'fuel', 'bank'}
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


# 영어 표기 자동 생성 — 업종 말은 뜻으로, 나머지는 로마자. 붙여 쓴 한국어 상호는 아는 낱말 앞뒤로 띄운다
_SUFFIX_EN = [('게스트하우스', 'Guesthouse'), ('편의점', 'Convenience Store'), ('주유소', 'Gas Station'), ('장례식장', 'Funeral Hall'),
              ('횟집', 'Sashimi House'), ('회집', 'Sashimi House'), ('식당', 'Restaurant'), ('호스텔', 'Hostel'), ('여인숙', 'Inn'),
              ('호텔', 'Hotel'), ('모텔', 'Motel'), ('펜션', 'Pension'), ('민박', 'Guest Rooms'), ('약국', 'Pharmacy'), ('약방', 'Pharmacy'),
              ('슈퍼', 'Super'), ('수퍼', 'Super'), ('마트', 'Mart'), ('포차', 'Pocha'), ('술집', 'Pub'), ('카페', 'Cafe'), ('커피', 'Coffee'),
              ('베이커리', 'Bakery'), ('다방', 'Dabang'), ('하우스', 'House'), ('매점', 'Kiosk'), ('장터', 'Market')]
_WORDS = ['속초', '강릉', '동해', '설악', '중앙', '청초호', '청호', '동명항', '영금정', '아바이', '대게', '홍게', '물회', '막국수', '칼국수',
          '냉면옥', '냉면', '면옥', '짬뽕', '순두부', '닭강정', '감자옹심이', '생선구이', '생선찜', '무한리필', '해물탕', '순댓국', '해장국',
          '감자탕', '김밥', '만두', '족발', '갈비', '국밥', '곰탕', '튀김', '라면', '찐빵', '버터빵', '꽈배기', '본점', '점', '스테이',
          '커피', '한우', '마을', '포장마차', '야식', '방앗간', '쉼터']
_WORD_EN = {'커피': 'Coffee', '마을': 'Village', '포장마차': 'Pojangmacha', '쉼터': 'Rest Stop'}


def auto_en(ko: str) -> str:
    words = []
    for w in ko.split():
        tail = ''
        for k, e in _SUFFIX_EN:
            if w.endswith(k) and len(w) > len(k):
                w, tail = w[:-len(k)], e
                break
            if w == k:
                w, tail = '', e
                break
        parts, buf, i = [], '', 0
        while i < len(w):
            hit = next((t for t in sorted(_WORDS, key=len, reverse=True) if w.startswith(t, i) and t != '점'), None)
            if hit:
                if buf:
                    parts.append(buf)
                    buf = ''
                parts.append(hit)
                i += len(hit)
            else:
                buf += w[i]
                i += 1
        if buf:
            parts.append(buf)
        words += [_WORD_EN.get(p) or romanize(p) for p in parts if p]
        if tail:
            words.append(tail)
    return ' '.join(words)


def name_key(real: str) -> str:
    """원래 상호 → 표 키(SHA-1 앞 16자). 표에 평문 상호를 남기지 않는다."""
    return hashlib.sha1(real.encode('utf-8')).hexdigest()[:16]


def norm(s: str) -> str:
    return re.sub(r'[\s·&()\-_.]', '', s or '').lower()


def add_alias(real: str, ko: str, en: str | None) -> None:
    d = json.load(open(ALIAS, encoding='utf-8')) if os.path.exists(ALIAS) else {'_doc': '', 'aliases': {}}
    d['aliases'][name_key(real)] = {'ko': ko, **({'en': en} if en else {})}
    with open(ALIAS, 'w', encoding='utf-8') as f:
        f.write(json.dumps(d, ensure_ascii=False, indent=1))
    print(f'[alias] 추가 — 게임 이름 {ko}' + (f' / {en}' if en else ''))


def main() -> None:
    if ADD:
        add_alias(ADD[0], ADD[1], ADD[2] if len(ADD) > 2 else None)
        return
    meta = json.load(open(META, encoding='utf-8'))
    lat0, lon0, lat1, lon1 = meta['bbox']
    tm = meta['tileMeters']
    latc = (lat0 + lat1) / 2

    def tile(lat: float, lon: float) -> tuple[int, int]:
        tx = (lon - lon0) * 111320 * math.cos(math.radians(latc)) / tm
        ty = (lat1 - lat) * 111132 / tm
        return round(tx), round(ty)

    src = json.load(open(SRC, encoding='utf-8'))
    aliases: dict[str, dict] = json.load(open(ALIAS, encoding='utf-8'))['aliases'] if os.path.exists(ALIAS) else {}
    alias_values = {a['ko'] for a in aliases.values()}
    unknown: list[str] = []

    def game_name(real: str, kind_ok: bool = True) -> tuple[str, str | None]:
        """원래 이름 → (게임 이름, 영어 표기 | None = 바꾸지 않음)"""
        a = aliases.get(name_key(real)) if real else None
        if a:
            return a['ko'], a.get('en') or auto_en(a['ko'])
        if kind_ok and real and real not in alias_values:
            unknown.append(real)
        return real, None

    base = [p for p in json.load(open(OUTS[1], encoding='utf-8')) if p.get('src') != 'capture']
    renamed = 0
    by_game = {a['ko']: a for a in aliases.values()}
    for p in base:
        if p.get('type') in BUSINESS and not p.get('name') and p.get('nameEn') and name_key(p['nameEn']) in aliases:
            # 한국어 이름 없이 영어 이름만 있는 OSM 가게 — 영어 이름으로 찾는다
            p['name'], p['nameEn'] = game_name(p['nameEn'])
            renamed += 1
        elif p.get('type') in BUSINESS and p.get('name') and name_key(p['name']) in aliases:
            p['name'], p['nameEn'] = game_name(p['name'])
            renamed += 1
        elif p.get('type') in BUSINESS and p.get('name') in by_game:
            # 이미 바뀐 이름 — 영어 표기만 표 · 규칙의 최신 값으로
            a = by_game[p['name']]
            p['nameEn'] = a.get('en') or auto_en(a['ko'])
        elif p.get('type') in BUSINESS and p.get('name') and p['name'] not in alias_values:
            unknown.append(p['name'])
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
        name, name_en = c['name'], c.get('nameEn')   # 캡처는 처음부터 게임 상호
        k = norm(name)
        if any(math.hypot(tx - x, ty - y) <= 8 for x, y in osm_names.get(k, [])):
            dup_osm += 1
            continue
        if any(norm(a['name']) == k and math.hypot(tx - a['tx'], ty - a['ty']) <= 6 for a in added):
            dup_cap += 1
            continue
        n = int(c['capture'])
        seq[n] = seq.get(n, 0) + 1
        added.append({**CAT[c['cat']], 'name': name, 'nameEn': name_en or c.get('nameEn') or auto_en(name), 'tx': tx, 'ty': ty,
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
    print(f'[capture] pois.json {len(merged)}건 (OSM {len(base)}) · OSM 게임 상호 {renamed}건')
    if unknown:
        print(f'[alias] 표에 없는 가게 이름 {len(set(unknown))}개 — 원래 이름 그대로 나간다(공공 · 협동조합이면 정상):',
              ', '.join(sorted(set(unknown))))


if __name__ == '__main__':
    main()
