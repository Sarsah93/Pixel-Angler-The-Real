/**
 * @file en_pois.ts
 * @description OSM POI 상호명 영문 사전 (120차 ②) — `name:en` 이 없거나 품질이 낮은 것만.
 *
 * ## 왜 사전이 필요한가
 * 상호명은 실제 간판이라 **한국어 `name` 이 정본**이고, 영어 로케일 표시만 이 사전/`nameEn` 을 쓴다.
 * OSM 원본에는 공식 영문명(`name:en`)이 상당수 들어 있어(속초 실측: 라벨 렌더 133건 중 91건)
 * `tools/backfill_poi_nameen.py` 가 그걸 `pois.json.nameEn` 으로 채운다.
 * 여기 있는 것은 **그 나머지 42건 + 원본이 부정확한 소수**다.
 *
 * ## 표기 규칙 (사용자 확정 2026-09-08)
 * 고유명(상호 이름)은 **로마자 음차**, 업종 접미(횟집·식당·주유소·편의점 …)만 **의미역**.
 *   함흥냉면옥 → Hamheung Naengmyeon House · 짬뽕일번지 → Jjamppong Ilbeonji
 * 실브랜드는 그 브랜드의 **공식 영문 표기**를 쓴다(하나로마트 → Hanaro Mart).
 * 지명이 섞이면 국립국어원 로마자 표기법을 따른다(속초 → Sokcho).
 *
 * ## 우선순위
 * `EN_PLACES`(지명) > **이 사전** > OSM `nameEn` > 원문(한국어).
 * `I18n.buildRuntimeDict` 가 이 순서로 넣고, 나중에 오는 `registerNames`(OSM)는 덮지 않는다.
 * 즉 여기 키를 적으면 OSM 값을 **덮어쓸 수 있다** — 아래 '보정' 절이 그 용도다.
 */
export const EN_POIS: Record<string, string> = {
  // ── 보정: OSM name:en 이 있으나 정확하지 않은 것 ──
  // 두 지구대가 똑같이 'Sokcho Police Station' 이라 지도에서 구분이 안 된다
  '속초경찰서 영랑지구대': 'Sokcho Police – Yeongnang Substation',
  '속초경찰서 청초지구대': 'Sokcho Police – Cheongcho Substation',
  '24시 전주 명가 콩나물국밥': 'Jeonju Kongnamul Gukbap (24h)',   // 원본은 그냥 'Gukbap'
  '서독약국': 'Seodok Pharmacy',                                  // 원본 'West Germany Pharmacy' = 직역

  // ── 음식점 ──
  '그리운보리밥': 'Geuriun Boribap',
  '김밥천국': 'Gimbap Cheonguk',
  '단천면옥': 'Dancheon Myeonok',
  '단천식당': 'Dancheon Restaurant',
  '대일회할인마트': 'Daeil Sashimi Discount Mart',
  '매자식당': 'Maeja Restaurant',
  '설악본가': 'Seorak Bonga',
  '속초 생대구': 'Sokcho Fresh Cod',
  '속초엄지닭강정': 'Sokcho Eomji Dakgangjeong',
  '스시나미': 'Sushi Nami',
  '안동식당': 'Andong Restaurant',
  '영금정횟집': 'Yeonggeumjeong Sashimi',
  '용신포차': 'Yongsin Pocha',
  '장수루 양꼬치 훠궈': 'Jangsuru Lamb Skewers & Hot Pot',
  '전주속풀이해장국': 'Jeonju Haejang-guk',
  '짬뽕일번지': 'Jjamppong Ilbeonji',
  '하누랑': 'Hanurang',
  '한우와문어국밥': 'Hanwoo & Octopus Gukbap',
  '함지박식당': 'Hamjibak Restaurant',
  '함흥냉면옥': 'Hamheung Naengmyeon House',
  '현이네포차': "Hyeoni's Pocha",
  '회식의달인': 'Hoesik-ui Dalin',

  // ── 카페 ──
  '5구도선장': 'Ogudo Seonjang',
  '마캉마캉 속초점': 'Macan Macan Sokcho',
  '빙담소': 'Bingdamso',
  '커피플레이트': 'Coffee Plate',
  '커피해요': 'Coffee Haeyo',

  // ── 상점 ──
  'GS더프래시 속초교동점': 'GS The Fresh Sokcho Gyodong',
  'l마트': 'L Mart',
  '설악슈퍼': 'Seorak Super',
  '속초시 수협 동명활어센터': 'Sokcho Suhyup Dongmyeong Live Fish Center',
  '우리홈마트': 'Uri Home Mart',
  '하나로마트': 'Hanaro Mart',

  // ── 시설·표지 ──
  '동명항': 'Dongmyeong Port',                       // EN_PLACES 와 동일 — POI info 로도 나온다
  '동명항활어': 'Dongmyeong Port Live Fish',
  '속초항': 'Sokcho Port',
  '속초항만지원센터 주차장': 'Sokcho Port Support Center Parking',
  '속초항여객선터미널': 'Sokcho Port Ferry Terminal',
  '영랑호CC': 'Yeongnangho CC',
  '조도등대': 'Jodo Lighthouse',
  '중앙치안센터': 'Jungang Police Post',
  '청호동방파제': 'Cheongho-dong Breakwater',

  // ── 라벨로 렌더되진 않지만 상세·검색에서 나올 수 있는 것 ──
  'DC타이거': 'DC Tiger',
  'MG새마을금고': 'MG Community Credit Cooperative',
  '대승당약국': 'Daeseungdang Pharmacy',
  '보명당': 'Bomyeongdang',
  '설악찹쌀 & 기정떡': 'Seorak Chapssal & Gijeongtteok',
  '성실축산': 'Seongsil Meat',
  '신개념축산물백화점': 'Singaenyeom Meat Department',
  '에이스침대': 'Ace Bed',
  '제이마트': 'J Mart',
  '체스터톤스 속초': 'Chestertons Sokcho',
  '하나약국': 'Hana Pharmacy',
};
