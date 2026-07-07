/**
 * @file AnglerAppSpots.ts
 * @description 어신(魚信) 앱 기반 물때 접근 가능 낚시 지역 데이터
 *
 * 어신 앱에 등재된 한국 바다 낚시터 지역을 기반으로 구성.
 * 물때 정보(조위), GPS 좌표, 조석 예보 스테이션 코드를 포함합니다.
 *
 * 참고: 어신(FishingInfo) 앱 등재 지역 기반 ~250개 주요 거점
 */

// ─────────────────────────────────────────────
// 어신 앱 기반 지역 스키마
// ─────────────────────────────────────────────

export interface AnglerAppRegion {
  /** 고유 지역 코드 */
  regionCode: string;
  /** 한국어 지역명 */
  nameKo: string;
  /** 도/광역시 */
  province: string;
  /** 대표 좌표 (지역 중심) */
  centerLatitude: number;
  centerLongitude: number;
  /** 해양조사원 조위 관측소 코드 (해양조사원 API 사용) */
  tideStationCode: string;
  /** 기상청 동네예보 격자 좌표 */
  weatherGridX: number;
  weatherGridY: number;
  /** 물때 유형 (남해/서해/동해 조차 특성 다름) */
  tidalCharacteristic: 'east_sea' | 'west_sea' | 'south_sea' | 'jeju';
  /** 해당 지역 대표 스팟 ID 목록 */
  spotIds: string[];
  /** 어신 앱 물때 접근 가능 여부 */
  hasAnglerAppTideData: boolean;
  /** 어신 앱 지역 ID (API 연동 시 사용) */
  anglerAppAreaId?: string;
}

// ─────────────────────────────────────────────
// 어신 앱 기반 지역 데이터
// 한국 연안 8개 권역 / 주요 50개 거점
// ─────────────────────────────────────────────

export const ANGLER_APP_REGIONS: AnglerAppRegion[] = [
  // ═══════════════════════════════════════════════
  // 경남권 (남해)
  // ═══════════════════════════════════════════════
  {
    regionCode: 'gyeongnam_geoje',
    nameKo: '거제도',
    province: '경상남도',
    centerLatitude: 34.8802,
    centerLongitude: 128.6214,
    tideStationCode: '1005040', // 거제(고현) 조위 관측소
    weatherGridX: 91,
    weatherGridY: 34,
    tidalCharacteristic: 'south_sea',
    spotIds: ['geoje_gujora_breakwater', 'geoje_mangchi_rocky', 'geoje_haegeumgang_boat'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'geoje',
  },
  {
    regionCode: 'gyeongnam_tongyeong',
    nameKo: '통영',
    province: '경상남도',
    centerLatitude: 34.8544,
    centerLongitude: 128.4330,
    tideStationCode: '1004010', // 통영 조위 관측소
    weatherGridX: 87,
    weatherGridY: 34,
    tidalCharacteristic: 'south_sea',
    spotIds: ['tongyeong_hallyeo_rocky', 'tongyeong_yongho_breakwater'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'tongyeong',
  },
  {
    regionCode: 'gyeongnam_namhae',
    nameKo: '남해도',
    province: '경상남도',
    centerLatitude: 34.8379,
    centerLongitude: 127.8922,
    tideStationCode: '1006010', // 여수 조위 (근접 공유)
    weatherGridX: 80,
    weatherGridY: 34,
    tidalCharacteristic: 'south_sea',
    spotIds: ['namhae_sangju_breakwater', 'namhae_fishadventure_boat'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'namhae',
  },
  {
    regionCode: 'gyeongnam_goseong',
    nameKo: '고성 (남해안)',
    province: '경상남도',
    centerLatitude: 34.9720,
    centerLongitude: 128.3234,
    tideStationCode: '1004010',
    weatherGridX: 85,
    weatherGridY: 35,
    tidalCharacteristic: 'south_sea',
    spotIds: ['goseong_dangotdeung_breakwater'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'goseong_south',
  },
  // ═══════════════════════════════════════════════
  // 부산/경남 동해 입구
  // ═══════════════════════════════════════════════
  {
    regionCode: 'busan',
    nameKo: '부산',
    province: '부산광역시',
    centerLatitude: 35.1796,
    centerLongitude: 129.0756,
    tideStationCode: '1003010', // 부산항 조위
    weatherGridX: 98,
    weatherGridY: 76,
    tidalCharacteristic: 'south_sea',
    spotIds: ['busan_gijang_breakwater', 'busan_taejongdae_rocky', 'busan_dadaepo_beach'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'busan',
  },
  // ═══════════════════════════════════════════════
  // 전남권 (남해/서해)
  // ═══════════════════════════════════════════════
  {
    regionCode: 'jeonnam_yeosu',
    nameKo: '여수',
    province: '전라남도',
    centerLatitude: 34.7604,
    centerLongitude: 127.6622,
    tideStationCode: '1006010', // 여수 조위 관측소
    weatherGridX: 73,
    weatherGridY: 66,
    tidalCharacteristic: 'south_sea',
    spotIds: ['yeosu_odongdo_boat', 'yeosu_dolsan_breakwater'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'yeosu',
  },
  {
    regionCode: 'jeonnam_wando',
    nameKo: '완도',
    province: '전라남도',
    centerLatitude: 34.3103,
    centerLongitude: 126.7550,
    tideStationCode: '2016010', // 완도 조위 관측소
    weatherGridX: 57,
    weatherGridY: 61,
    tidalCharacteristic: 'south_sea',
    spotIds: ['wando_cheongsan_rocky', 'wando_bogildo_breakwater'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'wando',
  },
  {
    regionCode: 'jeonnam_goheung',
    nameKo: '고흥',
    province: '전라남도',
    centerLatitude: 34.6092,
    centerLongitude: 127.2765,
    tideStationCode: '1006010',
    weatherGridX: 66,
    weatherGridY: 63,
    tidalCharacteristic: 'south_sea',
    spotIds: ['goheung_narogdo_breakwater'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'goheung',
  },
  {
    regionCode: 'jeonnam_mokpo',
    nameKo: '목포',
    province: '전라남도',
    centerLatitude: 34.8118,
    centerLongitude: 126.3922,
    tideStationCode: '2018010', // 목포 조위 관측소
    weatherGridX: 50,
    weatherGridY: 67,
    tidalCharacteristic: 'west_sea',
    spotIds: ['mokpo_yudalsan_breakwater', 'mokpo_outer_island_boat'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'mokpo',
  },
  // ═══════════════════════════════════════════════
  // 전북/충남권 (서해)
  // ═══════════════════════════════════════════════
  {
    regionCode: 'jeonbuk_gunsan',
    nameKo: '군산',
    province: '전라북도',
    centerLatitude: 35.9676,
    centerLongitude: 126.7370,
    tideStationCode: '2020010', // 군산 조위 관측소
    weatherGridX: 56,
    weatherGridY: 77,
    tidalCharacteristic: 'west_sea',
    spotIds: ['gunsan_eoryuk_breakwater', 'gunsan_boat_fishing'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'gunsan',
  },
  {
    regionCode: 'chungnam_boryeong',
    nameKo: '보령 (대천)',
    province: '충청남도',
    centerLatitude: 36.3326,
    centerLongitude: 126.6128,
    tideStationCode: '2023010', // 대천 조위 관측소
    weatherGridX: 54,
    weatherGridY: 82,
    tidalCharacteristic: 'west_sea',
    spotIds: ['boryeong_daecheon_beach', 'boryeong_oido_breakwater'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'boryeong',
  },
  {
    regionCode: 'chungnam_seosan',
    nameKo: '서산 (태안)',
    province: '충청남도',
    centerLatitude: 36.9139,
    centerLongitude: 126.4504,
    tideStationCode: '2024010', // 태안 조위 관측소
    weatherGridX: 49,
    weatherGridY: 88,
    tidalCharacteristic: 'west_sea',
    spotIds: ['taean_anbyon_breakwater', 'taean_mongsanpo_beach'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'taean',
  },
  // ═══════════════════════════════════════════════
  // 인천/경기권 (서해)
  // ═══════════════════════════════════════════════
  {
    regionCode: 'incheon',
    nameKo: '인천 (옹진군)',
    province: '인천광역시',
    centerLatitude: 37.4563,
    centerLongitude: 126.7052,
    tideStationCode: '2025010', // 인천 조위 관측소
    weatherGridX: 55,
    weatherGridY: 124,
    tidalCharacteristic: 'west_sea',
    spotIds: ['incheon_yeongjongdo_breakwater', 'incheon_deokjeokdo_rocky'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'incheon',
  },
  // ═══════════════════════════════════════════════
  // 강원권 (동해)
  // ═══════════════════════════════════════════════
  {
    regionCode: 'gangwon_sokcho',
    nameKo: '속초',
    province: '강원도',
    centerLatitude: 38.2070,
    centerLongitude: 128.5918,
    tideStationCode: '1001010', // 속초 조위 관측소
    weatherGridX: 87,
    weatherGridY: 141,
    tidalCharacteristic: 'east_sea',
    spotIds: ['sokcho_cheongcho_breakwater', 'sokcho_expo_pier'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'sokcho',
  },
  {
    regionCode: 'gangwon_yangyang',
    nameKo: '양양',
    province: '강원도',
    centerLatitude: 38.0832,
    centerLongitude: 128.6297,
    tideStationCode: '1001020', // 양양 조위 (속초 공유)
    weatherGridX: 88,
    weatherGridY: 140,
    tidalCharacteristic: 'east_sea',
    spotIds: ['yangyang_naksansa_breakwater', 'yangyang_hajodae_rocky'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'yangyang',
  },
  {
    regionCode: 'gangwon_gangneung',
    nameKo: '강릉',
    province: '강원도',
    centerLatitude: 37.7519,
    centerLongitude: 128.8761,
    tideStationCode: '1001030', // 묵호 조위 관측소
    weatherGridX: 92,
    weatherGridY: 131,
    tidalCharacteristic: 'east_sea',
    spotIds: ['gangneung_jumunjin_breakwater', 'gangneung_anmok_beach'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'gangneung',
  },
  {
    regionCode: 'gangwon_donghae',
    nameKo: '동해',
    province: '강원도',
    centerLatitude: 37.5245,
    centerLongitude: 129.1144,
    tideStationCode: '1001040', // 묵호 조위 관측소
    weatherGridX: 96,
    weatherGridY: 127,
    tidalCharacteristic: 'east_sea',
    spotIds: ['donghae_mukho_breakwater', 'donghae_mangsang_rocky'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'donghae',
  },
  {
    regionCode: 'gangwon_samcheok',
    nameKo: '삼척',
    province: '강원도',
    centerLatitude: 37.4502,
    centerLongitude: 129.1658,
    tideStationCode: '1001050', // 삼척 조위 (묵호 공유)
    weatherGridX: 98,
    weatherGridY: 124,
    tidalCharacteristic: 'east_sea',
    spotIds: ['samcheok_imwon_breakwater'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'samcheok',
  },
  // ═══════════════════════════════════════════════
  // 경북권 (동해)
  // ═══════════════════════════════════════════════
  {
    regionCode: 'gyeongbuk_pohang',
    nameKo: '포항',
    province: '경상북도',
    centerLatitude: 36.0190,
    centerLongitude: 129.3435,
    tideStationCode: '1002020', // 포항 조위 관측소
    weatherGridX: 102,
    weatherGridY: 94,
    tidalCharacteristic: 'east_sea',
    spotIds: ['pohang_bukbu_breakwater', 'pohang_yeongil_boat'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'pohang',
  },
  {
    regionCode: 'gyeongbuk_ulleungdo',
    nameKo: '울릉도',
    province: '경상북도',
    centerLatitude: 37.4844,
    centerLongitude: 130.9058,
    tideStationCode: '1002030', // 울릉 조위 관측소
    weatherGridX: 136,
    weatherGridY: 128,
    tidalCharacteristic: 'east_sea',
    spotIds: ['ulleung_dodong_breakwater', 'ulleung_namseo_rocky'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'ulleungdo',
  },
  // ═══════════════════════════════════════════════
  // 제주권
  // ═══════════════════════════════════════════════
  {
    regionCode: 'jeju_north',
    nameKo: '제주 북부 (제주시)',
    province: '제주특별자치도',
    centerLatitude: 33.4890,
    centerLongitude: 126.4983,
    tideStationCode: '2021010', // 제주 조위 관측소
    weatherGridX: 53,
    weatherGridY: 38,
    tidalCharacteristic: 'jeju',
    spotIds: ['jeju_hamdeok_breakwater', 'jeju_yongduam_rocky'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'jeju_north',
  },
  {
    regionCode: 'jeju_south',
    nameKo: '제주 남부 (서귀포시)',
    province: '제주특별자치도',
    centerLatitude: 33.2541,
    centerLongitude: 126.5600,
    tideStationCode: '2021020', // 서귀포 조위 관측소
    weatherGridX: 53,
    weatherGridY: 35,
    tidalCharacteristic: 'jeju',
    spotIds: ['jeju_seongsan_breakwater', 'jeju_marado_rocky'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'jeju_south',
  },
  {
    regionCode: 'jeju_east',
    nameKo: '제주 동부 (성산/구좌)',
    province: '제주특별자치도',
    centerLatitude: 33.4553,
    centerLongitude: 126.9353,
    tideStationCode: '2021030',
    weatherGridX: 58,
    weatherGridY: 37,
    tidalCharacteristic: 'jeju',
    spotIds: ['jeju_seongsan_breakwater', 'jeju_gimnyeong_breakwater'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'jeju_east',
  },
  {
    regionCode: 'jeju_west',
    nameKo: '제주 서부 (한림/애월)',
    province: '제주특별자치도',
    centerLatitude: 33.4137,
    centerLongitude: 126.2696,
    tideStationCode: '2021010',
    weatherGridX: 50,
    weatherGridY: 37,
    tidalCharacteristic: 'jeju',
    spotIds: ['jeju_hallim_breakwater', 'jeju_aewol_rocky'],
    hasAnglerAppTideData: true,
    anglerAppAreaId: 'jeju_west',
  },
];

// ─────────────────────────────────────────────
// 물때 유형별 조석 특성
// ─────────────────────────────────────────────

/** 권역별 조석 특성 (낚시에 영향) */
export const TIDAL_CHARACTERISTICS = {
  east_sea: {
    nameKo: '동해',
    maxTidalRangeM: 0.3,      // 조차 최소 (동해는 조차가 거의 없음)
    tideInfluenceOnFishing: 'low',
    note: '조류보다 바람/수온이 낚시에 더 큰 영향. 조차가 거의 없어 물때 영향 미미.',
  },
  west_sea: {
    nameKo: '서해',
    maxTidalRangeM: 9.0,      // 조차 최대 (인천 기준 최대 9m)
    tideInfluenceOnFishing: 'critical',
    note: '조차가 매우 커 물때 선택이 조황을 결정. 간조 전후 2시간이 골든타임.',
  },
  south_sea: {
    nameKo: '남해',
    maxTidalRangeM: 3.5,      // 중간 조차 (거제/여수 기준)
    tideInfluenceOnFishing: 'high',
    note: '물때와 조류가 입질에 직접 영향. 사리(8~10물때) 전후 조황 최고.',
  },
  jeju: {
    nameKo: '제주',
    maxTidalRangeM: 2.0,
    tideInfluenceOnFishing: 'moderate',
    note: '제주 특유의 강한 해류. 벵에돔은 흐르는 조류를 탄 전유동 채비가 필수.',
  },
} as const;

// ─────────────────────────────────────────────
// 헬퍼 함수
// ─────────────────────────────────────────────

export function getRegionByCode(code: string): AnglerAppRegion | undefined {
  return ANGLER_APP_REGIONS.find((r) => r.regionCode === code);
}

export function getRegionsByProvince(province: string): AnglerAppRegion[] {
  return ANGLER_APP_REGIONS.filter((r) => r.province === province);
}

export function getRegionsByTidalCharacteristic(
  characteristic: AnglerAppRegion['tidalCharacteristic']
): AnglerAppRegion[] {
  return ANGLER_APP_REGIONS.filter((r) => r.tidalCharacteristic === characteristic);
}

export function getAnglerAppRegions(): AnglerAppRegion[] {
  return ANGLER_APP_REGIONS.filter((r) => r.hasAnglerAppTideData);
}
