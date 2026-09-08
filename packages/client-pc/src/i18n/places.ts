/**
 * @file places.ts
 * @description 지명 영문 사전 (119차 ⑥) — 지역·월드맵 노드·지역 맵 노드 이름.
 *
 * 지명은 `RegionDef`/`WorldMapNode`/`RegionMapNode` 어디에도 `nameEn` 필드가 없어서
 * i18n 사전으로만 풀 수 있다. `buildRuntimeDict`가 런타임 사전에 합류시킨다.
 * 표기는 **국립국어원 로마자 표기법**(속초 = Sokcho, 여수 = Yeosu …)을 따른다.
 * 새 지역/맵을 추가하면 여기에도 한 줄 추가할 것.
 */
export const EN_PLACES: Record<string, string> = {
  // ── 시·도 + 지역 (RegionDatabase / WORLD_NODE_DATABASE) ──
  '강원 속초': 'Sokcho, Gangwon', '경남 거제': 'Geoje, Gyeongnam', '경북 포항': 'Pohang, Gyeongbuk',
  '전남 여수': 'Yeosu, Jeonnam', '충남 태안': 'Taean, Chungnam',
  '속초': 'Sokcho', '거제': 'Geoje', '포항': 'Pohang', '여수': 'Yeosu', '태안': 'Taean',
  '부산': 'Busan', '울산': 'Ulsan', '인천': 'Incheon', '제주': 'Jeju',
  '울릉도': 'Ulleungdo', '독도': 'Dokdo',

  // ── 출조 구역 (REGION_AREA_NODES) ──
  '속초항': 'Sokcho Port', '동명항': 'Dongmyeong Port',
  '감천항 서방파제': 'Gamcheon West Breakwater', '감천항 동방파제': 'Gamcheon East Breakwater',
  '암남공원 (송도)': 'Amnam Park (Songdo)', '백운포 체육공원': 'Baegunpo Sports Park',

  // ── 지역 맵 노드 (RegionMap) ──
  '속초항 (남측)': 'Sokcho Port (South)', '속초항 (중앙)': 'Sokcho Port (Central)',
  '속초항 (북측)': 'Sokcho Port (North)', '속초항·동명항 연결로': 'Sokcho–Dongmyeong Link Road',
  '동명항 (북측)': 'Dongmyeong Port (North)', '동명항 (중앙)': 'Dongmyeong Port (Central)',
  '동명항 (남측·방파제)': 'Dongmyeong Port (South · Breakwater)',
  '감천항 서방파제 (감천동)': 'Gamcheon West Breakwater (Gamcheon-dong)',
  '감천항 제3부두·모지포': 'Gamcheon Pier 3 · Mojipo',
  '감천항 제4부두·수산시장': 'Gamcheon Pier 4 · Fish Market',
  '암남공원 주차장': 'Amnam Park Parking',
  '백운포 방파제': 'Baegunpo Breakwater',
  '홈타운 (집)': 'Hometown (Home)',

  // ── 조석 관측소·권역 라벨에서 자주 나오는 지명 ──
  '동해': 'East Sea', '서해': 'West Sea', '남해': 'South Sea', '제주도': 'Jeju Island',
};
