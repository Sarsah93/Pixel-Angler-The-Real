/**
 * @file RegionDatabase.ts
 * @description 지역(Region) 정의 DB — 월드맵 1단계 지역 노드 기반
 *
 * WorldMapScene의 1단계 드릴다운 진입점.
 * 지역을 클릭하면 해당 지역의 하위 스팟 리스트가 펼쳐집니다.
 */

// ─────────────────────────────────────────────
// 지역 정의 인터페이스
// ─────────────────────────────────────────────

export interface RegionDef {
  /** 지역 고유 ID (SpotDatabase의 regionCode와 매핑) */
  id: string;
  /** 지역 한국어 명칭 */
  nameKo: string;
  /**
   * 지역 영문 명칭 (국립국어원 로마자 표기법). 영어 로케일 표시용 —
   * i18n 사전(`i18n/places.ts`)이 아니라 **데이터가 곧 번역**이 되도록 120차에 신설했다.
   * 신규 지역을 추가하면 여기도 채울 것(비면 사전 폴백 → 그래도 없으면 한국어 그대로).
   */
  nameEn?: string;
  /** 지역 한국어 약칭 (지도 레이블용) */
  shortNameKo: string;
  /** 지역 영문 약칭 (지도 레이블용) */
  shortNameEn?: string;
  /** 지역 설명 */
  description: string;
  /** 지역 중심 위도 */
  latitude: number;
  /** 지역 중심 경도 */
  longitude: number;
  /** 해당 지역에 포함된 스팟 ID 목록 (SpotDatabase.id 기준) */
  subSpotIds: string[];
  /** 지역 대표 어종 ID 목록 */
  representativeSpeciesIds: string[];
  /** 지역 접근에 필요한 최소 라이선스 (없으면 기본 면허) */
  minLicenseRequired?: string;
}

// ─────────────────────────────────────────────
// 한국 주요 낚시 지역 DB
// ─────────────────────────────────────────────

export const REGION_DATABASE: RegionDef[] = [
  // ── 경북 포항 ──────────────────────────────
  {
    id: 'gyeongbuk_pohang',
    nameKo: '경북 포항',
    nameEn: 'Pohang, Gyeongbuk',
    shortNameKo: '포항',
    shortNameEn: 'Pohang',
    description: '동해 최대 항구도시 포항. 영일만을 중심으로 감성돔·농어·갈치 명소가 발달해 있다.',
    latitude: 36.019,
    longitude: 129.343,
    subSpotIds: [
      'pohang_yeongil_north_breakwater',
      'pohang_yeongil_channel',
      'pohang_yeongil_south_tip',
      'pohang_yeongil_inner_west',
      'pohang_yeongil_boat',
      'pohang_yeongil_tidal_flat',
    ],
    representativeSpeciesIds: ['black_seabream', 'sea_bass', 'hairtail'],
  },
  // ── 경남 거제 ──────────────────────────────
  {
    id: 'gyeongnam_geoje',
    nameKo: '경남 거제',
    nameEn: 'Geoje, Gyeongnam',
    shortNameKo: '거제',
    shortNameEn: 'Geoje',
    description: '맑은 수질과 다채로운 갯바위 포인트를 자랑하는 벵에돔·감성돔 낚시 천국 거제.',
    latitude: 34.788,
    longitude: 128.621,
    subSpotIds: [
      'geoje_gujora_breakwater',
      'geoje_mangchi_rocky',
    ],
    representativeSpeciesIds: ['largescale_blackfish', 'black_seabream'],
  },
  // ── 전남 여수 ──────────────────────────────
  {
    id: 'jeonnam_yeosu',
    nameKo: '전남 여수',
    nameEn: 'Yeosu, Jeonnam',
    shortNameKo: '여수',
    shortNameEn: 'Yeosu',
    description: '한려수도의 관문 여수. 오동도 앞바다 선상에서 갈치·부시리·감성돔이 쏟아지는 남해 낚시의 메카.',
    latitude: 34.7395,
    longitude: 127.7561,
    subSpotIds: [
      'yeosu_odongdo_boat',
    ],
    representativeSpeciesIds: ['hairtail', 'yellowtail', 'black_seabream'],
  },
  // ── 강원 속초 ──────────────────────────────
  {
    id: 'gangwon_sokcho',
    nameKo: '강원 속초',
    nameEn: 'Sokcho, Gangwon',
    shortNameKo: '속초',
    shortNameEn: 'Sokcho',
    description: '동해안 북단 대표 낚시터. 속초항 및 낙산 인근 방파제 갈치 낚시 명소.',
    latitude: 38.207,
    longitude: 128.591,
    subSpotIds: [
      'yangyang_naksansa_breakwater',
    ],
    representativeSpeciesIds: ['hairtail', 'black_seabream'],
  },
  // ── 제주 ───────────────────────────────────
  {
    id: 'jeju',
    nameKo: '제주',
    nameEn: 'Jeju',
    shortNameKo: '제주',
    shortNameEn: 'Jeju',
    description: '참돔, 벵에돔, 부시리가 쏟아지는 한국 최남단 낚시 성지 제주도.',
    latitude: 33.455,
    longitude: 126.935,
    subSpotIds: [
      'jeju_seongsan_breakwater',
    ],
    representativeSpeciesIds: ['largescale_blackfish', 'amberjack', 'red_seabream'],
  },
  // ── 인천 ───────────────────────────────────
  {
    id: 'incheon',
    nameKo: '인천',
    nameEn: 'Incheon',
    shortNameKo: '인천',
    shortNameEn: 'Incheon',
    description: '서해안의 거대 조간대를 품은 인천. 광활한 갯벌과 해루질, 망둥어 낚시의 성지.',
    latitude: 37.456,
    longitude: 126.705,
    subSpotIds: [
      'incheon_mud_flat',
    ],
    representativeSpeciesIds: ['blue_crab', 'flounder'],
  },
  // ── 충남 태안 ──────────────────────────────
  {
    id: 'chungnam_taean',
    nameKo: '충남 태안',
    nameEn: 'Taean, Chungnam',
    shortNameKo: '태안',
    shortNameEn: 'Taean',
    description: '리아스식 해안과 다양한 갯벌, 해수욕장을 품은 서해 원투 낚시의 요람.',
    latitude: 36.745,
    longitude: 126.297,
    subSpotIds: [
      'taean_beach',
    ],
    representativeSpeciesIds: ['flounder', 'goby'],
  },
  // ── 울산 ───────────────────────────────────
  {
    id: 'ulsan',
    nameKo: '울산',
    nameEn: 'Ulsan',
    shortNameKo: '울산',
    shortNameEn: 'Ulsan',
    description: '슬도와 이덕 등 동해 남부의 명방파제와 갯바위 우럭 낚시 요충지.',
    latitude: 35.538,
    longitude: 129.311,
    subSpotIds: [
      'ulsan_seuldo',
    ],
    representativeSpeciesIds: ['dark_banded_rockfish', 'black_seabream'],
  },
  // ── 부산 ───────────────────────────────────
  {
    id: 'busan',
    nameKo: '부산',
    nameEn: 'Busan',
    shortNameKo: '부산',
    shortNameEn: 'Busan',
    description: '태종대, 오륙도 등 강한 조류가 흐르는 대물 벵에돔·참돔 선상 갯바위 낚시터.',
    latitude: 35.179,
    longitude: 129.075,
    subSpotIds: [
      'busan_oryukdo',
    ],
    representativeSpeciesIds: ['red_seabream', 'largescale_blackfish'],
  },
  // ── 울릉도 ─────────────────────────────────
  {
    id: 'ulleungdo',
    nameKo: '울릉도',
    nameEn: 'Ulleungdo',
    shortNameKo: '울릉도',
    shortNameEn: 'Ulleungdo',
    description: '동해의 깊은 수심과 천혜의 절경 속에서 참돔과 우럭 손맛을 보는 섬.',
    latitude: 37.484,
    longitude: 130.898,
    subSpotIds: [
      'ulleungdo_jeodong',
    ],
    representativeSpeciesIds: ['dark_banded_rockfish', 'red_seabream'],
  },
  // ── 독도 ───────────────────────────────────
  {
    id: 'dokdo',
    nameKo: '독도',
    nameEn: 'Dokdo',
    shortNameKo: '독도',
    shortNameEn: 'Dokdo',
    description: '대한민국 동단 끝자락. 거센 파도와 함께 활어들의 황금 어장을 형성하는 화산섬.',
    latitude: 37.242,
    longitude: 131.868,
    subSpotIds: [
      'dokdo_coast',
    ],
    representativeSpeciesIds: ['dark_banded_rockfish', 'amberjack'],
  },
];

// ─────────────────────────────────────────────
// 유틸 함수
// ─────────────────────────────────────────────

/** ID로 지역 정의 조회 */
export function getRegionById(id: string): RegionDef | undefined {
  return REGION_DATABASE.find((r) => r.id === id);
}

/** 스팟 ID를 포함하는 지역 조회 */
export function getRegionBySpotId(spotId: string): RegionDef | undefined {
  return REGION_DATABASE.find((r) => r.subSpotIds.includes(spotId));
}

/** regionCode로 지역 조회 (SpotDatabase.regionCode와 매핑) */
export function getFishingRegionByCode(regionCode: string): RegionDef | undefined {
  return REGION_DATABASE.find((r) => r.id === regionCode);
}
