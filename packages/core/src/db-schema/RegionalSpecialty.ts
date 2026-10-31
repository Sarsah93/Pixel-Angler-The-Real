/**
 * @file RegionalSpecialty.ts
 * @description 294차 — 지역 특산물 · 특산품(사용자 발의 2026-10-31 — 「대한민국 한반도에 지역별 특산물 혹은 특산품 … 인게임에 녹여내고 싶어.
 * 같은 작물/수산물이라도 지역 특산일 경우 특별한 옵션이나 가격, 효과」).
 *
 * 규칙
 *  - 특산은 **얻은 지역**(`originRegion` — 잡은 · 캔 · 거둔 지역)으로 판정한다. 상점에서 산 것 · 옛 세이브(꼬리표 없음)는 특산이 아니다.
 *  - 같은 종이 여러 지역의 특산일 수 있다(고등어 = 부산 · 제주). 지역 하나에 같은 종이 둘이면 앞 줄이 이긴다.
 *  - 제철(`months`) 안에서 `priceMult` 전부, 밖에서는 보너스의 절반(1 + (mult − 1) / 2). 달이 없으면 연중 전부.
 *  - 표의 근거(지리적 표시제 · 축제 · 주산지)는 웹 조사(294차 워크로그 §2)에서 왔다 — 가격 배율은 1차 추정(mockup · `TUNING` 없음).
 *  - 갈래: 'fish'(어종 — `speciesId`) · 'forage'(갯것 — `ShoreCreature.id`) · 'crop'(수확물 아이템 id) · 'processed'(가공품 — 아직 아이템 없음 · 기록용).
 *
 * 쓰는 곳: 판매가(`InventoryStore.getSellPrice` — 어획물 · 농산물) · 상세보기 「특산」 줄 · 위키 「특산」 표 · (다음) 직판장 특산 매대 · 선물 선호 · 가공.
 */

export type SpecialtyKind = 'fish' | 'forage' | 'crop' | 'processed';

export interface RegionalSpecialtyDef {
  id: string;
  /** WorldMap 지역 id(여럿 가능 — 부산 · 거제가 같이 유명한 멸치 등) */
  regionIds: readonly string[];
  kind: SpecialtyKind;
  /** 대상 열쇠 — 어종 · 갯것 id, 수확물 아이템 id, 가공품 아이템 id. 하나의 특산이 여러 품종(상추 9종)을 덮을 수 있다 */
  keys: readonly string[];
  nameKo: string;
  nameEn: string;
  /** 제철(달 1~12) — 없으면 연중 */
  months?: readonly number[];
  /** 특산 지역에서 얻은 것의 판매가 배율(제철 기준) */
  priceMult: number;
  /** 근거 한 줄(지리적 표시 · 주산지 · 축제) */
  noteKo: string;
  noteEn: string;
  /** 지리적 표시제(GI) 등록명 — 있으면 */
  gi?: string;
  /** 축제 · 장(달 포함) — 있으면 */
  festivalKo?: string;
}

/** 294차 1차 표 — 웹 조사 기준(지역 11 + 울릉 · 독도). 값은 추정. */
export const REGIONAL_SPECIALTIES: readonly RegionalSpecialtyDef[] = [
  // ── 속초(강원) ──
  { id: 'sokcho_sandfish', regionIds: ['gangwon_sokcho'], kind: 'fish', keys: ['sandfish'], nameKo: '속초 도루묵', nameEn: 'Sokcho sandfish', months: [11, 12], priceMult: 1.3,
    noteKo: '오징어철이 끝나면 이어지는 겨울 어종 — 동명항 양미리 부두 · 연탄불 구이', noteEn: 'The winter fish that follows squid season — grilled over briquettes at Dongmyeong Port', festivalKo: '속초 양미리 · 도루묵축제(11월 · 속초항)' },
  { id: 'sokcho_squid', regionIds: ['gangwon_sokcho'], kind: 'fish', keys: ['flying_squid'], nameKo: '속초 오징어', nameEn: 'Sokcho squid', months: [7, 8, 9, 10, 11], priceMult: 1.2,
    noteKo: '함경도 실향민이 돼지 창자 대신 오징어 몸통에 속을 채운 오징어순대의 고장(아바이마을)', noteEn: 'Home of squid sundae — Hamgyeong refugees stuffed squid instead of pig intestine (Abai Village)' },
  // ── 부산 ──
  { id: 'busan_mackerel', regionIds: ['busan'], kind: 'fish', keys: ['chub_mackerel'], nameKo: '부산 고등어', nameEn: 'Busan mackerel', months: [9, 10, 11, 12, 1, 2], priceMult: 1.3,
    noteKo: '부산 시어 — 공동어시장(남항)에 전국 고등어 80%가 위판된다', noteEn: "Busan's city fish — 80% of the nation's mackerel is auctioned at the Namhang cooperative market", festivalKo: '부산고등어축제(10~11월)' },
  { id: 'busan_daejeo_tomato', regionIds: ['busan'], kind: 'crop', keys: ['crop_tomato', 'crop_cherry_tomato', 'crop_stevia_tomato'], nameKo: '대저 짭짤이토마토', nameEn: 'Daejeo salty tomato', months: [2, 3, 4, 5], priceMult: 1.4,
    noteKo: '낙동강 삼각주 염해지에서 키운 토마토 — 짭짤한 맛', noteEn: 'Grown on the salt-touched Nakdong delta — faintly salty', gi: '부산대저토마토(농 GI 2012)' },
  { id: 'busan_myeongji_leek', regionIds: ['busan'], kind: 'crop', keys: ['crop_leek'], nameKo: '명지 대파', nameEn: 'Myeongji scallion', months: [11, 12, 1, 2, 3], priceMult: 1.2,
    noteKo: '낙동강 하구 사질토 · 해풍에서 자란 대파', noteEn: 'Scallions from the sandy, windswept Nakdong estuary' },
  { id: 'busan_yeongdo_sweetpotato', regionIds: ['busan'], kind: 'crop', keys: ['crop_sweet_potato', 'crop_pumpkin_sweet_potato'], nameKo: '영도 조내기 고구마', nameEn: 'Yeongdo Jonaegi sweet potato', months: [9, 10, 11], priceMult: 1.15,
    noteKo: '1763년 조엄이 들여온 고구마가 처음 뿌리내린 땅', noteEn: 'Where the sweet potato Jo Eom brought in 1763 first took root' },
  // ── 울산 ──
  { id: 'ulsan_yellowtail', regionIds: ['ulsan'], kind: 'fish', keys: ['yellowtail'], nameKo: '방어진 방어', nameEn: 'Bangeojin yellowtail', months: [11, 12, 1, 2], priceMult: 1.3,
    noteKo: '「방어가 많이 잡히는 나루」 — 지명이 곧 특산', noteEn: 'A port named for the yellowtail that gather there' },
  { id: 'ulsan_flounder', regionIds: ['ulsan'], kind: 'fish', keys: ['flounder'], nameKo: '정자 가자미', nameEn: 'Jeongja flounder', months: [12, 1, 2], priceMult: 1.2,
    noteKo: '정자항이 국내 유통 가자미의 70% — 겨울 산란 전 살이 오른다', noteEn: '70% of the nation\'s flounder passes through Jeongja — fat before winter spawning' },
  // ── 포항(구룡포) ──
  { id: 'pohang_saury', regionIds: ['gyeongbuk_pohang'], kind: 'fish', keys: ['pacific_saury'], nameKo: '구룡포 꽁치(과메기 원료)', nameEn: 'Guryongpo saury (gwamegi)', months: [11, 12, 1], priceMult: 1.35,
    noteKo: '북서계절풍 · 영일만 해풍 덕장에서 말리는 과메기의 고장 — 전국 85% 이상', noteEn: 'Home of gwamegi dried in the northwest monsoon on Yeongil Bay racks — over 85% of the nation', festivalKo: '구룡포 과메기축제(11월)' },
  { id: 'pohang_squid', regionIds: ['gyeongbuk_pohang'], kind: 'fish', keys: ['flying_squid'], nameKo: '구룡포 오징어(피데기)', nameEn: 'Guryongpo squid (pideogi)', months: [8, 9, 10, 11, 12], priceMult: 1.2,
    noteKo: '반건조 피데기 — 지리적 표시 단체표장 권리화(2014)', noteEn: 'Half-dried pideogi — collective geographical mark pursued since 2014' },
  { id: 'pohang_spinach', regionIds: ['gyeongbuk_pohang'], kind: 'crop', keys: ['crop_spinach'], nameKo: '포항초', nameEn: 'Pohang spinach', months: [10, 11, 12, 1, 2, 3], priceMult: 1.5,
    noteKo: '바닷바람 노지에서 겨울을 나는 재래종 시금치 — 전국 겨울 시금치 40%', noteEn: 'A landrace spinach that overwinters in the sea wind — 40% of winter spinach', gi: '포항초(농 GI 2014)' },
  { id: 'pohang_chive', regionIds: ['gyeongbuk_pohang'], kind: 'crop', keys: ['crop_chive'], nameKo: '포항 부추', nameEn: 'Pohang chives', months: [4, 5, 6, 7, 8, 9, 10], priceMult: 1.2,
    noteKo: '바닷가 모래밭 부추 — 한때 전국의 80%', noteEn: 'Chives from the sandy shore — once 80% of the nation' },
  { id: 'pohang_eel', regionIds: ['gyeongbuk_pohang'], kind: 'fish', keys: ['conger_eel'], nameKo: '영일만 돌장어', nameEn: 'Yeongil Bay rock eel', months: [7, 8, 9], priceMult: 1.15,
    noteKo: '포항 연안산 돌장어 — 영일대 검은돌장어축제', noteEn: 'Rock eel from the Pohang coast — the Yeongildae eel festival', festivalKo: '영일만 검은돌장어축제(8월)' },
  // ── 거제 ──
  { id: 'geoje_cod', regionIds: ['gyeongnam_geoje'], kind: 'fish', keys: ['pacific_cod'], nameKo: '거제 대구', nameEn: 'Geoje cod', months: [12, 1], priceMult: 1.35,
    noteKo: '거제 시어 — 진해만이 대구 최대 산란장 · 외포항 덕장', noteEn: "Geoje's city fish — Jinhae Bay is the largest cod spawning ground · Oepo drying racks", festivalKo: '거제 대구수산물축제(12월 · 외포항)' },
  { id: 'geoje_oyster', regionIds: ['gyeongnam_geoje'], kind: 'forage', keys: ['oyster_gigas'], nameKo: '거제 굴', nameEn: 'Geoje oyster', months: [11, 12, 1, 2], priceMult: 1.25,
    noteKo: '거제 · 통영 굴 양식 벨트', noteEn: 'The Geoje–Tongyeong oyster belt' },
  { id: 'geoje_rockfish', regionIds: ['gyeongnam_geoje'], kind: 'fish', keys: ['black_rockfish'], nameKo: '거제 활우럭', nameEn: 'Geoje live rockfish', priceMult: 1.1,
    noteKo: '거제시 우수 농수산물(활우럭)', noteEn: 'A Geoje flagship product (live rockfish)' },
  // ── 여수 ──
  { id: 'yeosu_pike_conger', regionIds: ['jeonnam_yeosu'], kind: 'fish', keys: ['pike_conger'], nameKo: '여수 갯장어(하모)', nameEn: 'Yeosu pike conger (hamo)', months: [6, 7, 8, 9], priceMult: 1.35,
    noteKo: '경도 · 돌산대교 참장어거리 — 여름 보양 샤브샤브', noteEn: 'Gyeongdo and the Dolsan bridge eel street — summer shabu-shabu' },
  { id: 'yeosu_tonguefish', regionIds: ['jeonnam_yeosu'], kind: 'fish', keys: ['tonguefish'], nameKo: '여수 서대', nameEn: 'Yeosu tonguefish', months: [5, 6, 7, 8], priceMult: 1.3,
    noteKo: '막걸리 식초에 무친 서대회 — 여수 10미', noteEn: 'Raw tonguefish dressed in makgeolli vinegar — one of Yeosu\'s ten tastes' },
  { id: 'yeosu_spanish_mackerel', regionIds: ['jeonnam_yeosu'], kind: 'fish', keys: ['spanish_mackerel'], nameKo: '거문도 삼치', nameEn: 'Geomundo Spanish mackerel', months: [10, 11, 12, 1, 2], priceMult: 1.2,
    noteKo: '거문도 삼치축제 — 풍어제 · 조업선 퍼레이드', noteEn: 'The Geomundo mackerel festival — rites for a full catch', festivalKo: '거문도 삼치축제(가을)' },
  { id: 'yeosu_oyster', regionIds: ['jeonnam_yeosu'], kind: 'forage', keys: ['oyster_gigas'], nameKo: '여자만 굴', nameEn: 'Yeoja Bay oyster', months: [11, 12, 1, 2, 3], priceMult: 1.15,
    noteKo: '여수시 수산물 등록상표 품목', noteEn: 'A registered Yeosu seafood brand' },
  { id: 'yeosu_bangpung', regionIds: ['jeonnam_yeosu'], kind: 'crop', keys: ['crop_bangpung'], nameKo: '금오도 방풍', nameEn: 'Geumodo bangpung', months: [3, 4, 5], priceMult: 1.3,
    noteKo: '맛의 방주에 오른 섬 방풍', noteEn: 'Island bangpung listed in the Ark of Taste' },
  // ── 태안 ──
  { id: 'taean_crab', regionIds: ['chungnam_taean'], kind: 'forage', keys: ['portunus_trituberculatus'], nameKo: '안흥 꽃게', nameEn: 'Anheung blue crab', months: [4, 5, 6, 9, 10, 11], priceMult: 1.3,
    noteKo: '안흥 · 신진도 위판 — 봄 암게 · 가을 수게', noteEn: 'Auctioned at Anheung and Sinjindo — females in spring, males in autumn' },
  { id: 'taean_octopus', regionIds: ['chungnam_taean'], kind: 'forage', keys: ['octopus_minor'], nameKo: '태안 낙지(박속밀국낙지)', nameEn: 'Taean small octopus', months: [5, 6, 9, 10], priceMult: 1.2,
    noteKo: '박 국물에 산낙지를 넣는 서산 · 태안 향토음식', noteEn: 'Live octopus in gourd broth — a Seosan–Taean dish' },
  { id: 'taean_garlic', regionIds: ['chungnam_taean'], kind: 'crop', keys: ['crop_garlic', 'crop_garlic_scape'], nameKo: '태안 육쪽마늘', nameEn: 'Taean six-clove garlic', months: [6], priceMult: 1.5,
    noteKo: '가의도 씨마늘 — 해풍 · 안개에 자생력이 높아 전국에 종구를 댄다', noteEn: 'Gauido seed garlic — hardy in sea wind and fog, supplied nationwide', gi: '태안육쪽마늘(농 GI 2005)' },
  // ── 제주 ──
  { id: 'jeju_yellowtail', regionIds: ['jeju'], kind: 'fish', keys: ['yellowtail'], nameKo: '모슬포 방어', nameEn: 'Moseulpo yellowtail', months: [11, 12, 1, 2], priceMult: 1.3,
    noteKo: '자리돔 미끼로 잡는 「자리 방어」 — 최남단 방어축제', noteEn: 'Yellowtail caught on damselfish bait — the southernmost yellowtail festival', festivalKo: '최남단 방어축제(12월 · 모슬포항)' },
  { id: 'jeju_mackerel', regionIds: ['jeju'], kind: 'fish', keys: ['chub_mackerel'], nameKo: '제주 고등어', nameEn: 'Jeju mackerel', months: [9, 10, 11, 12, 1, 2], priceMult: 1.2,
    noteKo: '제주 근해 고등어 — 신선할 때만 먹는 고등어회의 고장', noteEn: 'Mackerel from the Jeju inshore grounds — home of raw mackerel, eaten only when fresh' },
  { id: 'jeju_hairtail', regionIds: ['jeju'], kind: 'fish', keys: ['hairtail'], nameKo: '제주 은갈치', nameEn: 'Jeju silver hairtail', months: [7, 8, 9, 10], priceMult: 1.3,
    noteKo: '한 마리씩 낚아 은빛을 살린 갈치(그물은 먹갈치)', noteEn: 'Line-caught one at a time to keep the silver (netted fish turn dark)' },
  { id: 'jeju_turban', regionIds: ['jeju'], kind: 'forage', keys: ['turbo_cornutus'], nameKo: '제주 뿔소라', nameEn: 'Jeju turban shell', months: [9, 10, 11, 12, 1, 2, 3, 4, 5], priceMult: 1.2,
    noteKo: '해녀 물질 품목 — 전국 뿔소라의 80%', noteEn: 'A haenyeo catch — 80% of the nation\'s turban shells' },
  { id: 'jeju_urchin', regionIds: ['jeju'], kind: 'forage', keys: ['heliocidaris_crassispina', 'strongylocentrotus_nudus'], nameKo: '제주 성게', nameEn: 'Jeju sea urchin', months: [4, 5, 6, 7], priceMult: 1.2,
    noteKo: '봄 · 여름 해녀 성게', noteEn: 'Haenyeo urchin in spring and summer' },
  { id: 'jeju_obunjagi', regionIds: ['jeju'], kind: 'forage', keys: ['haliotis_diversicolor'], nameKo: '제주 오분자기', nameEn: 'Jeju small abalone', priceMult: 1.3,
    noteKo: '제주 바다에만 사는 작은 전복', noteEn: 'A small abalone found only in Jeju waters' },
  { id: 'jeju_carrot', regionIds: ['jeju'], kind: 'crop', keys: ['crop_carrot'], nameKo: '구좌 당근', nameEn: 'Gujwa carrot', months: [11, 12, 1, 2, 3], priceMult: 1.4,
    noteKo: '전국 당근의 절반 이상이 구좌 화산토에서 난다', noteEn: 'More than half the nation\'s carrots grow in Gujwa volcanic soil' },
  { id: 'jeju_garlic', regionIds: ['jeju'], kind: 'crop', keys: ['crop_garlic', 'crop_garlic_scape'], nameKo: '대정 마늘', nameEn: 'Daejeong garlic', months: [5], priceMult: 1.2,
    noteKo: '제주 마늘의 87%가 대정 · 안덕 서부권', noteEn: '87% of Jeju garlic comes from the Daejeong–Andeok west' },
  // ── 인천 ──
  { id: 'incheon_crab', regionIds: ['incheon'], kind: 'forage', keys: ['portunus_trituberculatus'], nameKo: '연평 꽃게', nameEn: 'Yeonpyeong blue crab', months: [4, 5, 6, 9, 10, 11], priceMult: 1.3,
    noteKo: '인천이 전국 꽃게의 30~45% — 연안부두 종합어시장 위판', noteEn: 'Incheon lands 30–45% of the nation\'s blue crab — auctioned at the Yeonan pier market', festivalKo: '연안부두 꽃게축제(10월)' },
  { id: 'incheon_turnip', regionIds: ['incheon'], kind: 'crop', keys: ['crop_turnip'], nameKo: '강화 순무', nameEn: 'Ganghwa turnip', months: [10, 11], priceMult: 1.5,
    noteKo: '인삼 · 새우젓과 함께 강화 3대 특산', noteEn: 'One of Ganghwa\'s three specialties, with ginseng and salted shrimp' },
  // ── 울릉도 ──
  { id: 'ulleung_squid', regionIds: ['ulleungdo'], kind: 'fish', keys: ['flying_squid'], nameKo: '울릉도 오징어', nameEn: 'Ulleungdo squid', months: [7, 8, 9, 10, 11, 12], priceMult: 1.4,
    noteKo: '2021년 군어 — 뱃길이 멀어 덕장 해풍 건조가 발달 · 저동항 위판 90%', noteEn: 'The county fish since 2021 — sea-wind drying racks grew from the long voyage · 90% auctioned at Jeodong', festivalKo: '울릉도 오징어축제(8월 · 저동항)' },
  { id: 'ulleung_myeongi', regionIds: ['ulleungdo'], kind: 'crop', keys: ['crop_myeongi'], nameKo: '울릉 명이(산마늘)', nameEn: 'Ulleung myeongi (wild garlic)', months: [3, 4, 5], priceMult: 1.5,
    noteKo: '산마늘 가운데 울릉산만 「명이」 — 개척기 목숨을 이어 준 나물', noteEn: 'Only Ulleung wild garlic is called myeongi — the herb that kept the first settlers alive' },
  { id: 'ulleung_samnamul', regionIds: ['ulleungdo'], kind: 'crop', keys: ['crop_samnamul'], nameKo: '울릉 삼나물(눈개승마)', nameEn: 'Ulleung samnamul', months: [4, 5], priceMult: 1.4,
    noteKo: '울릉농협 출하 산채 — 지리적 표시 등록', noteEn: 'An Ulleung co-op mountain herb — geographical indication registered', gi: '울릉도삼나물(농 GI)' },
  { id: 'ulleung_bujigaengi', regionIds: ['ulleungdo'], kind: 'crop', keys: ['crop_bujigaengi'], nameKo: '울릉 부지갱이(섬쑥부쟁이)', nameEn: 'Ulleung bujigaengi', months: [4, 5], priceMult: 1.4,
    noteKo: '사동 · 남양 주력 취나물 — 지리적 표시 등록', noteEn: 'The island aster of Sadong and Namyang — geographical indication registered', gi: '울릉도부지갱이(농 GI)' },
  { id: 'ulleung_mussel', regionIds: ['ulleungdo'], kind: 'forage', keys: ['mytilus_coruscus'], nameKo: '울릉 토종 홍합', nameEn: 'Ulleung native mussel', priceMult: 1.3,
    noteKo: '말린 토종 홍합을 다져 짓는 홍합밥', noteEn: 'Dried native mussels minced into mussel rice' },
  { id: 'ulleung_limpet', regionIds: ['ulleungdo'], kind: 'forage', keys: ['cellana_grata'], nameKo: '울릉 따개비(삿갓조개)', nameEn: 'Ulleung limpet', priceMult: 1.3,
    noteKo: '따개비칼국수 — 울릉에서 삿갓조개를 따개비라 부른다', noteEn: 'Limpet noodle soup — Ulleung calls the limpet ttagaebi' },
  // ── 독도 ──
  { id: 'dokdo_turban', regionIds: ['dokdo'], kind: 'forage', keys: ['turbo_cornutus'], nameKo: '독도 참소라', nameEn: 'Dokdo turban shell', months: [10, 11, 12, 1, 2, 3, 4, 5], priceMult: 1.3,
    noteKo: '청정 바다목장 — 독도 앞바다에 지천', noteEn: 'A clean sea ranch — everywhere off Dokdo' },
  { id: 'dokdo_seacucumber', regionIds: ['dokdo'], kind: 'forage', keys: ['stichopus_japonicus'], nameKo: '독도 홍해삼', nameEn: 'Dokdo red sea cucumber', priceMult: 1.3,
    noteKo: '독도 어장의 홍해삼', noteEn: 'Red sea cucumber of the Dokdo grounds' },
  { id: 'dokdo_abalone', regionIds: ['dokdo'], kind: 'forage', keys: ['haliotis_discus'], nameKo: '독도 왕전복', nameEn: 'Dokdo giant abalone', priceMult: 1.4,
    noteKo: '1960~70년대 「주먹만한 전복」 — 10년간 13만 마리 방류로 되살리는 중', noteEn: 'Fist-sized abalone of the 60s and 70s — 130,000 released over ten years to bring them back' },
  { id: 'dokdo_octopus', regionIds: ['dokdo'], kind: 'fish', keys: ['giant_octopus'], nameKo: '독도 대문어', nameEn: 'Dokdo giant octopus', months: [12, 1, 2, 3, 4], priceMult: 1.3,
    noteKo: '「울릉도는 오징어, 독도는 문어」', noteEn: '"Ulleungdo has squid, Dokdo has octopus"' },
];

/** 열쇠 → 이 지역의 특산 정의(앞 줄 우선) */
export function specialtyOf(key: string | undefined | null, originRegion: string | undefined | null): RegionalSpecialtyDef | undefined {
  if (!key || !originRegion) return undefined;
  return REGIONAL_SPECIALTIES.find((d) => d.keys.includes(key) && d.regionIds.includes(originRegion));
}

/** 제철인가(달이 없으면 늘 제철) */
export function specialtyInSeason(def: RegionalSpecialtyDef, month: number): boolean {
  return !def.months || def.months.length === 0 || def.months.includes(month);
}

/** 판매가 배율 — 특산이 아니면 1. 제철 밖은 보너스의 절반 */
export function specialtyPriceMult(key: string | undefined | null, originRegion: string | undefined | null, month: number): number {
  const d = specialtyOf(key, originRegion);
  if (!d) return 1;
  return specialtyInSeason(d, month) ? d.priceMult : 1 + (d.priceMult - 1) / 2;
}

/** 지역의 특산 전부(위키 · 직판장 매대) */
export function specialtiesOfRegion(regionId: string): RegionalSpecialtyDef[] {
  return REGIONAL_SPECIALTIES.filter((d) => d.regionIds.includes(regionId));
}

/** 이 열쇠가 어느 지역의 특산인가(도감 · 상세보기 「○○ 특산」) */
export function specialtyRegionsOf(key: string): string[] {
  const out: string[] = [];
  for (const d of REGIONAL_SPECIALTIES) if (d.keys.includes(key)) for (const r of d.regionIds) if (!out.includes(r)) out.push(r);
  return out;
}
