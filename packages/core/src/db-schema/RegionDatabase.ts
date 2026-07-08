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
  /** 지역 한국어 약칭 (지도 레이블용) */
  shortNameKo: string;
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
    shortNameKo: '포항',
    description:
      '동해 최대 항구도시 포항. 영일만을 중심으로 북방파제·남방파제·홈통 등 다양한 포인트가 밀집해 있으며, ' +
      '갈치·감성돔·농어의 성지로 알려져 있다.',
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
    representativeSpeciesIds: ['black_seabream', 'sea_bass', 'hairtail', 'red_seabream'],
  },

  // ── 경남 거제 ──────────────────────────────
  {
    id: 'gyeongnam_geoje',
    nameKo: '경남 거제',
    shortNameKo: '거제',
    description:
      '남해 최대의 섬 거제. 맑은 수질과 다채로운 조류로 벵에돔·감성돔이 사시사철 낚이는 명소. ' +
      '구조라 방파제부터 외도 갯바위까지 다양한 포인트를 보유.',
    latitude: 34.788,
    longitude: 128.621,
    subSpotIds: [
      'geoje_gujora_breakwater',
      'geoje_mangchi_rocky',
    ],
    representativeSpeciesIds: ['largescale_blackfish', 'black_seabream', 'black_rockfish'],
  },

  // ── 강원 양양 ──────────────────────────────
  {
    id: 'gangwon_yangyang',
    nameKo: '강원 양양',
    shortNameKo: '양양',
    description:
      '동해안 대표 관광 낚시터. 낙산 방파제는 야간 갈치 낚시의 성지이며, ' +
      '여름 피크 시즌에는 전국에서 꾼들이 모여든다.',
    latitude: 38.083,
    longitude: 128.630,
    subSpotIds: [
      'yangyang_naksansa_breakwater',
    ],
    representativeSpeciesIds: ['hairtail', 'black_seabream'],
  },

  // ── 제주 ───────────────────────────────────
  {
    id: 'jeju',
    nameKo: '제주',
    shortNameKo: '제주',
    description:
      '한국 최남단 제주도. 아열대 어종이 풍부하며 부시리·참돔·벵에돔의 보고. ' +
      '성산일출봉 근처 방파제는 조황이 특히 뛰어나다.',
    latitude: 33.455,
    longitude: 126.935,
    subSpotIds: [
      'jeju_seongsan_breakwater',
    ],
    representativeSpeciesIds: ['largescale_blackfish', 'japanese_amberjack', 'red_seabream'],
  },

  // ── 전남 여수 ──────────────────────────────
  {
    id: 'jeonnam_yeosu',
    nameKo: '전남 여수',
    shortNameKo: '여수',
    description:
      '다도해 품은 여수. 선상 낚시와 갈치 포획의 전국 1번지. ' +
      '오동도 앞 선상 포인트는 계절에 관계없이 갈치와 감성돔이 잘 낚인다.',
    latitude: 34.740,
    longitude: 127.756,
    subSpotIds: [
      'yeosu_odongdo_boat',
    ],
    representativeSpeciesIds: ['hairtail', 'yellowtail', 'black_seabream'],
    minLicenseRequired: 'boat_angling',
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
