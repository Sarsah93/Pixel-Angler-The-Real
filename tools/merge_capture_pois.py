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
- 분류: R 음식점 · C 카페/빵 · P 주점 · V 편의점/슈퍼 · M 마트 · H 약국 · L 숙박 · S 종묘사(238차 — OSM `shop=garden_centre`) · O 방앗간(284차 — `shopKind: 'mill'`).
- osmId는 음수(-(캡처번호 × 1000 + 순번)) — 거래처 키(`<region>:osm:<id>`)가 OSM과 겹치지 않는다.

사용: python tools/merge_capture_pois.py [region=sokcho_v2] [--auto]   (capture_pois.json이 없는 지역은 게임 상호만 적용 · --auto = 표에 없는 가게 자동 변환 — 262차)
"""
import hashlib
import json
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADD = sys.argv[sys.argv.index('--add') + 1:] if '--add' in sys.argv else None
AUTO = '--auto' in sys.argv   # 262차 — 표에 없는 가게 이름을 자동으로 조금씩 바꿔 표에 넣는다(auto: true — 검토 뒤 고친다)
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
    'S': {'type': 'shop', 'shopKind': 'garden_centre'},   # 238차 — 종묘사(모종 · 씨앗 · 농자재 · 농약)
    'O': {'type': 'shop', 'shopKind': 'mill'},            # 284차 — 방앗간(기름 짜기 · 들깨 갈기 · 참깨 볶기 — OSM 표준 태그 없음)
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


# ── 262차 — 표에 없는 가게 이름 자동 변환(--auto) ─────────────────────────────────
# 속초(218차)는 사람이 표를 썼지만, 여수 구항 같은 도심은 가게가 1,000곳을 넘어 손으로 못 쓴다. 규칙은 같다 — 업종 말은 남기고 상호 줄기를
# 조금 바꾼다(마지막 한글 음절의 모음을 짝으로 바꿈 · 라틴 이름은 마지막 모음 글자). 프랜차이즈는 속초 · 부산 표와 같은 가상 브랜드로.
# 공공 · 협동조합 · 시장 · 시설 이름은 바꾸지 않는다. 만든 항목은 `auto: true`로 표에 남아 검토 대상이 된다(같은 가게는 다시 돌려도 같은 이름).
FRANCHISE: dict[str, tuple[str, str]] = {
    'GS25': ('GX24', 'GX24'), 'GS 25': ('GX24', 'GX24'), 'GC25': ('GX24', 'GX24'), 'CU': ('QU', 'QU'),
    '세븐일레븐': ('세븐나인', 'Seven-Nine'), '7-Eleven': ('세븐나인', 'Seven-Nine'), '7 Eleven': ('세븐나인', 'Seven-Nine'), 'Seven Eleven': ('세븐나인', 'Seven-Nine'),
    '이마트24': ('오마트24', 'O-Mart 24'), 'emart24': ('오마트24', 'O-Mart 24'), '이마트': ('오마트', 'O-Mart'), '롯데마트': ('롯다마트', 'Lotda Mart'), '홈플러스': ('홈플랫', 'Home Flat'),
    '스타벅스': ('스타빈스', 'Starbeans'), 'Starbucks': ('스타빈스', 'Starbeans'), '롯데리아': ('버거리아', 'Burgeria'), '맥도날드': ('맥스버거', "Max's Burger"), '버거킹': ('버거퀸', 'Burger Queen'),
    '파리바게뜨': ('파리베이커', 'Paris Baker'), 'Paris Baguette': ('파리베이커', 'Paris Baker'), '뚜레쥬르': ('뚜르제과', 'Tour Bakery'), '뚜레주르': ('뚜르제과', 'Tour Bakery'),
    '투썸플레이스': ('투스푼플레이스', 'Two Spoon Place'), '이디야커피': ('이데아커피', 'Idea Coffee'), '이디야': ('이데아커피', 'Idea Coffee'),
    '메가MGC커피': ('기가커피', 'Giga Coffee'), '메가커피': ('기가커피', 'Giga Coffee'), '컴포즈커피': ('컴퍼스커피', 'Compass Coffee'), '빽다방': ('빼꼼다방', 'Ppaekkom Dabang'),
    '할리스': ('할로스커피', 'Hallos Coffee'), '탐앤탐스': ('텀앤텀스', 'Tum & Tums'), '공차': ('콩차', 'Kongcha'), '설빙': ('설빈', 'Seolbin'), '더벤티': ('더벤트', 'The Vent'),
    '파스쿠찌': ('파스쿠치노', 'Pascuccino'), 'Caffè Pascucci': ('파스쿠치노', 'Pascuccino'), 'Caffé Pascucci': ('파스쿠치노', 'Pascuccino'), 'Paul Bassett': ('폴 바셋트', 'Paul Bassette'),
    '엔제리너스': ('엔젤리노스', 'Angelinos'), '던킨': ('도넛킨', 'Donutkin'), '배스킨라빈스': ('빙글31', 'Binggeul 31'), '크리스피크림': ('크리미도넛', 'Creamy Donut'),
    '다이소': ('사이소', 'Saiso'), '올리브영': ('올리브그린', 'Olive Green'), '아트박스': ('아트상자', 'Art Box'), '알파문구': ('알파벳문구', 'Alphabet Stationery'),
    'KB국민은행': ('한빛국민은행', 'Hanbit Kookmin Bank'), '국민은행': ('한빛국민은행', 'Hanbit Kookmin Bank'), '신한은행': ('신화은행', 'Sinhwa Bank'), '우리은행': ('우람은행', 'Uram Bank'),
    '하나은행': ('한아름은행', 'Hanareum Bank'), 'IBK기업은행': ('기업신용은행', 'Business Credit Bank'), '기업은행': ('기업신용은행', 'Business Credit Bank'),
    'NH농협은행': ('농민은행', 'Farmers Bank'), 'KJB광주은행': ('빛고을은행', 'Bitgoeul Bank'), '광주은행': ('빛고을은행', 'Bitgoeul Bank'), '부산은행': ('부성은행', 'Buseong Bank'),
    '신협': ('신용조합', 'Credit Union'), 'MG새마을금고': ('새마루금고', 'Saemaru Credit Union'), '새마을금고': ('새마루금고', 'Saemaru Credit Union'),
    'SK주유소': ('SJ주유소', 'SJ Gas'), 'SK 주유소': ('SJ주유소', 'SJ Gas'), 'SK-LPG': ('SJ-LPG', 'SJ-LPG'), 'GS칼텍스': ('GX칼텍', 'GX Caltech'), 'S-OIL': ('SO주유소', 'SO Gas'),
    '에쓰오일': ('SO주유소', 'SO Gas'), '현대오일뱅크': ('현재오일', 'Hyeonjae Oil'),
    '맘스터치': ('맘스키친', "Mom's Kitchen"), 'BHC치킨': ('BHK치킨', 'BHK Chicken'), 'bhc': ('BHK치킨', 'BHK Chicken'), 'BBQ': ('바베큐치킨', 'Barbecue Chicken'), '교촌치킨': ('교동치킨', 'Gyodong Chicken'),
    '굽네치킨': ('굽내치킨', 'Gupnae Chicken'), '네네치킨': ('내내치킨', 'Naenae Chicken'), '노랑통닭': ('노량통닭', 'Noryang Tongdak'), '또봉이통닭': ('또봉네통닭', 'Ttobongne Tongdak'),
    '페리카나': ('펠리컨치킨', 'Pelican Chicken'), 'KFC': ('켄치킨', 'Ken Chicken'), '자담치킨': ('자단치킨', 'Jadan Chicken'), '멕시카나치킨': ('멕시칸치킨', 'Mexican Chicken'),
    '미스터피자': ('미스터파이', 'Mister Pie'), '피자스쿨': ('피자스콜', 'Pizza Scuola'), '도미노피자': ('다이스피자', 'Dice Pizza'), '피자헛': ('피자하우스', 'Pizza House'),
    '피자알볼로': ('피자알바로', 'Pizza Alvaro'), '반올림피자': ('올림피자', 'Ollim Pizza'), '김밥천국': ('김밥낙원', 'Gimbap Nagwon'), '김밥나라': ('김밥누리', 'Gimbap Nuri'),
    '한솥도시락': ('한솔도시락', 'Hansol Dosirak'), '이삭토스트': ('이삭스토스트', 'Isaacs Toast'), '서브웨이': ('서브샌드', 'Sub Sand'), '봉구스밥버거': ('봉구네밥버거', 'Bonggune Bapburger'),
    '나이키': ('나이스', 'Nais'), 'Nike': ('나이스', 'Nais'), '아디다스': ('아디오스', 'Adios'), 'Adidas': ('아디오스', 'Adios'), '뉴발란스': ('뉴밸런서', 'New Balancer'),
    '노스페이스': ('노스마운틴', 'North Mountain'), 'The North Face': ('노스마운틴', 'North Mountain'), '블랙야크': ('검은야크', 'Black Yak'), '네파': ('내파', 'Naepa'),
    '코오롱스포츠': ('코오릉스포츠', 'Koorung Sports'), 'K2': ('K3', 'K3'), '데상트': ('데산테', 'Desante'), '르꼬끄': ('르꼬꼬', 'Le Coco'), '라코스테': ('라코스타', 'Lacosta'),
    'Lacoste': ('라코스타', 'Lacosta'), '휠라': ('필로', 'Filo'), 'Fila': ('필로', 'Filo'), '게스': ('게쓰', 'Gesseu'), 'MLB': ('MLV', 'MLV'), '디스커버리': ('디스커버', 'Discover'),
    'Discovery Expedition': ('디스커버', 'Discover'), '크로커다일': ('크로커다엘', 'Crocodael'), '지오지아': ('지오지오', 'Geogeo'), '올리비아로렌': ('올리비아로런', 'Olivia Loren'),
    '애터미': ('아토미', 'Atomi'), '정관장': ('정관당', 'Jeonggwandang'), '이니스프리': ('이니스트리', 'Innistree'), '네이처컬렉션': ('네이처콜렉트', 'Nature Collect'),
    '스킨푸드': ('스킨푸디', 'Skin Foodie'), '크린토피아': ('클린토피아', 'Cleantopia'), '하이마트': ('하이일렉트로', 'Hi-Electro'), 'LG': ('럭키전자', 'Lucky Electronics'),
    'KT플라자': ('케이텔플라자', 'K-Tel Plaza'), 'KT': ('케이텔', 'K-Tel'), 'SKT대리점': ('SJ텔레콤', 'SJ Telecom'), 'LG유플러스대리점': ('럭키플러스', 'Lucky Plus'),
    '신라스테이': ('실라스테이', 'Silla Stay'), '삼성': ('삼별', 'Sambyeol'), '삼천리자전거': ('삼천길자전거', 'Samcheongil Bicycle'), '스케쳐스': ('스케처', 'Sketcher'),
    '내셔널지오그래픽': ('내셔널지오', 'National Geo'), '트렉스타': ('트랙스타', 'Trackstar'), '콜핑': ('콜팡', 'Kolpang'), '레드페이스': ('레드페이즈', 'Red Phase'),
    '밀레': ('밀레' , 'Mille'), '아이더': ('아이디어', 'Idea Outdoor'), '베스띠벨리': ('베스티벨라', 'Bestibella'), '쉐보레': ('쉐브릿자동차', 'Chevrit Motors'), '기아': ('기린자동차', 'Girin Motors'),
    '현대자동차': ('현재자동차', 'Hyeonjae Motors'), '블루핸즈': ('블루핸드', 'Blue Hand'), '하나로마트': ('하나루마트', 'Hanaru Mart'), '하나로 마트': ('하나루마트', 'Hanaru Mart'),
    '농협하나로마트': ('하나루마트', 'Hanaru Mart'), '오뚜기': ('오뚝이', 'Ottugi'), '매일유업': ('매일우유', 'Maeil Milk'), '위니아': ('위니아' , 'Winia'),
}
# 공공 · 협동조합 · 시장 · 시설은 바꾸지 않는다(속초 규칙). 포함되면 그대로
PUBLIC_WORDS = ['수협', '우체국', '시청', '구청', '군청', '동사무소', '주민센터', '면사무소', '읍사무소', '경찰', '파출소', '치안센터', '소방', '보건소', '학교', '유치원',
                '어린이집', '도서관', '박물관', '미술관', '공원', '터미널', '항만', '공사', '공단', '관광안내', '안내소', '매표소', '선착장', '해양경찰', '시장', '위판장',
                '어판장', '어촌계', '마을회관', '교회', '성당', '사찰', '복지관', '체육관', '수산물센터', '수산시장', '청사', '우편', '농협중앙회']
SUFFIXES = ['횟집', '회집', '회센터', '회센타', '회관', '수산', '식당', '분식', '김밥', '국밥', '반점', '갈비', '치킨', '통닭', '피자', '카페', '커피', '다방', '다실', '제과', '베이커리',
            '빵집', '약국', '약방', '마트', '슈퍼', '수퍼', '편의점', '상회', '상사', '유통', '청과', '정육점', '건어물', '미용실', '헤어', '이용원', '안경원', '안경', '세탁소', '세탁',
            '철물', '공구', '가구', '의류', '펜션', '호텔', '모텔', '민박', '리조트', '게스트하우스', '호스텔', '콘도', '주유소', '은행', '금고', '식품', '푸드', '포차', '장어',
            '족발', '떡볶이', '만두', '냉면', '국수', '칼국수', '해장국', '감자탕', '삼계탕', '설렁탕', '곰탕', '보쌈', '닭강정', '문구', '서점', '꽃집', '화원', '낚시', '체육사',
            '병원', '의원', '한의원', '치과', '학원', '노래방', '당구장', '사우나', '찜질방', '목욕탕', '세차장', '정비', '카센터', '타이어', '자전거', '모터스', '렌트카', '부동산',
            '보청기', '의료기', '건강원', '농원', '종묘사', '묘목', '비료', '아구찜', '횟센터', '초밥', '스시', '라면', '라멘', '돈까스', '돈가스', '우동', '짬뽕', '중국집', '횟집',
            '갓김치', '김치', '젓갈', '건어물', '선어', '수산물', '어물전', '회타운', '횟타운', '매점', '휴게소', '주류', '양조장', '정미소', '방앗간', '떡집', '한복', '주단', '양복점',
            '옷가게', '신발', '구두', '가방', '시계', '보석', '금은방', '사진관', '스튜디오', '꽃배달', '화방', '표구사', '액자', '인테리어', '타일', '페인트', '전기', '전자', '컴퓨터',
            '통신', '대리점', '휴대폰', '렌탈', '약품', '한약방', '쌀집', '정육', '축산', '청과물', '과일', '야채', '채소', '어시장', '횟감', '회', '빙수', '팥빙수', '도넛', '토스트',
            '샌드위치', '버거', '햄버거', '파스타', '스테이크', '뷔페', '한정식', '백반', '순대', '곱창', '막창', '오리', '닭', '장어구이', '조개구이', '해물', '해물탕', '매운탕',
            '게장', '복집', '복국', '아구', '꼬막', '굴', '대게', '킹크랩', '랍스터', '문어', '낙지', '쭈꾸미', '주꾸미', '오징어', '갈치', '고등어', '삼치', '전어', '멸치', '건어']

_JUNG_JAMO = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
_VOWEL_SWAP = {'ㅏ': 'ㅓ', 'ㅓ': 'ㅏ', 'ㅗ': 'ㅜ', 'ㅜ': 'ㅗ', 'ㅡ': 'ㅣ', 'ㅣ': 'ㅡ', 'ㅐ': 'ㅔ', 'ㅔ': 'ㅐ', 'ㅑ': 'ㅕ', 'ㅕ': 'ㅑ', 'ㅛ': 'ㅠ', 'ㅠ': 'ㅛ',
               'ㅘ': 'ㅝ', 'ㅝ': 'ㅘ', 'ㅚ': 'ㅟ', 'ㅟ': 'ㅚ', 'ㅢ': 'ㅣ', 'ㅒ': 'ㅖ', 'ㅖ': 'ㅒ', 'ㅙ': 'ㅞ', 'ㅞ': 'ㅙ'}
_LATIN_SWAP = {'a': 'o', 'e': 'a', 'i': 'y', 'o': 'u', 'u': 'i'}


def _shift_syllable(ch: str) -> str:
    """한글 음절 하나의 모음을 짝으로 바꾼다(초성 · 종성은 그대로)."""
    c = ord(ch) - 0xAC00
    cho, jung, jong = c // 588, (c % 588) // 28, c % 28
    nj = _JUNG_JAMO.index(_VOWEL_SWAP[_JUNG_JAMO[jung]])
    return chr(0xAC00 + cho * 588 + nj * 28 + jong)


def is_public_name(real: str) -> bool:
    return any(w in real for w in PUBLIC_WORDS)


def auto_alias(real: str) -> tuple[str, str]:
    """원래 상호 → (게임 이름, 영어). 바꿀 수 없으면 원래 이름을 돌려준다."""
    name = real.strip()
    low = name.lower()
    for k in sorted(FRANCHISE, key=len, reverse=True):
        kl = k.lower()
        if low.startswith(kl):
            tail = name[len(k):]
            # 라틴 브랜드 뒤에 라틴 글자가 바로 이어지면 다른 이름(CU ↔ CUBE)
            if tail and tail[0].isascii() and tail[0].isalnum() and k[-1].isascii():
                continue
            ko, en = FRANCHISE[k]
            rest = tail.strip(' -·_')
            return (ko + (' ' + rest if rest else ''), en + (' ' + romanize(rest) if rest else ''))
    branch = ''
    m = re.match(r'^(.*\S)\s+(\S+점)$', name)
    if m and m.group(2) not in SUFFIXES:
        name, branch = m.group(1), m.group(2)
    suffix = ''
    for sfx in sorted(SUFFIXES, key=len, reverse=True):
        if name.endswith(sfx) and len(name) > len(sfx):
            name, suffix = name[:-len(sfx)], sfx
            break
    stem = name.rstrip()
    idx = max((i for i, ch in enumerate(stem) if '가' <= ch <= '힣'), default=-1)
    if idx >= 0:
        stem = stem[:idx] + _shift_syllable(stem[idx]) + stem[idx + 1:]
    else:
        j = max((i for i, ch in enumerate(stem) if ch.lower() in _LATIN_SWAP), default=-1)
        if j >= 0:
            r = _LATIN_SWAP[stem[j].lower()]
            stem = stem[:j] + (r.upper() if stem[j].isupper() else r) + stem[j + 1:]
        else:
            k = max((i for i, ch in enumerate(stem) if ch.isalpha()), default=-1)
            if k >= 0:
                nxt = 'a' if stem[k] in 'zZ' else chr(ord(stem[k]) + 1)
                stem = stem[:k] + (nxt.upper() if stem[k].isupper() else nxt) + stem[k + 1:]
            else:
                stem = stem + '오'
    ko = stem + suffix + (' ' + branch if branch else '')
    return ko, auto_en(ko)


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

    # 262차 — 캡처 파일이 없는 지역(새 지역)은 캡처 병합 없이 게임 상호만 적용한다
    src = json.load(open(SRC, encoding='utf-8')) if os.path.exists(SRC) else {'pois': []}
    table = json.load(open(ALIAS, encoding='utf-8')) if os.path.exists(ALIAS) else {'_doc': '게임 상호 표 — 키 = 원래 이름 SHA-1 앞 16자 · auto: true = 자동 변환(검토 뒤 고친다)', 'aliases': {}}
    aliases: dict[str, dict] = table['aliases']
    alias_values = {a['ko'] for a in aliases.values()}
    if AUTO:
        # 262차 — 표에 없는 가게는 자동으로 조금씩 바꿔 표에 넣는다(auto: true). 공공 · 시설 · 이미 바뀐 이름은 건너뛴다
        made = 0
        for p in json.load(open(OUTS[1], encoding='utf-8')):
            if p.get('src') == 'capture' or p.get('type') not in BUSINESS:
                continue
            real = p.get('name') or p.get('nameEn') or ''
            if not real or name_key(real) in aliases or real in alias_values or is_public_name(real):
                continue
            ko, en = auto_alias(real)
            if ko == real:
                continue
            aliases[name_key(real)] = {'ko': ko, 'en': en, 'auto': True}
            alias_values.add(ko)
            made += 1
        if made:
            with open(ALIAS, 'w', encoding='utf-8') as f:
                f.write(json.dumps(table, ensure_ascii=False, indent=1))
            print(f'[auto] 표에 없는 가게 {made}곳 자동 변환 → {os.path.relpath(ALIAS, ROOT)} (auto: true — 검토 뒤 고친다)')
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
