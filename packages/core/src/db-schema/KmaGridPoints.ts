/**
 * @file KmaGridPoints.ts
 * @description 게임 지역 ID → 기상청 단기예보 격자 좌표(nx, ny)
 *
 * 출처: 기상청41_단기예보 조회서비스_오픈API활용가이드_격자_위경도(2607).xlsx
 *       (전국 3,838개 행정구역 중 게임 지역에 해당하는 지점만 발췌)
 *
 * 지역 추가 시 위 엑셀에서 해당 시/군/구 행의 '격자 X'/'격자 Y'를 찾아 넣을 것.
 * 순수 데이터 — 렌더링/브라우저 API 없음.
 */

import type { KmaGrid } from '../api-client/KmaVilageFcstApiClient.js';

/** 격자 지점 정의 */
export interface KmaGridPoint extends KmaGrid {
  /** 표시용 지점명 (엑셀 행정구역명) */
  name: string;
  /** 위도 (참고용) */
  lat: number;
  /** 경도 (참고용) */
  lon: number;
}

/**
 * 게임 지역 ID(WORLD_NODE_DATABASE / RegionDatabase 기준) → 격자 지점.
 * 매핑이 없는 지역은 기상 조회가 불가하므로 추가 시 함께 등록할 것.
 */
export const KMA_GRID_BY_REGION: Record<string, KmaGridPoint> = {
  gangwon_sokcho:   { name: '강원특별자치도 속초시',    nx: 87,  ny: 141, lat: 38.204, lon: 128.594 },
  incheon:          { name: '인천광역시 중구',          nx: 54,  ny: 125, lat: 37.471, lon: 126.622 },
  chungnam_taean:   { name: '충청남도 태안군',          nx: 48,  ny: 109, lat: 36.743, lon: 126.300 },
  gyeongbuk_pohang: { name: '경상북도 포항시 남구',     nx: 102, ny: 94,  lat: 36.006, lon: 129.362 },
  ulsan:            { name: '울산광역시 동구',          nx: 104, ny: 83,  lat: 35.502, lon: 129.419 },
  busan:            { name: '부산광역시 중구',          nx: 97,  ny: 74,  lat: 35.103, lon: 129.035 },
  gyeongnam_geoje:  { name: '경상남도 거제시',          nx: 90,  ny: 69,  lat: 34.877, lon: 128.623 },
  jeonnam_yeosu:    { name: '전라남도 여수시',          nx: 73,  ny: 66,  lat: 34.757, lon: 127.662 },
  jeju:             { name: '제주특별자치도 제주시',    nx: 53,  ny: 38,  lat: 33.496, lon: 126.533 },
  ulleungdo:        { name: '경상북도 울릉군',          nx: 127, ny: 127, lat: 37.481, lon: 130.904 },
  dokdo:            { name: '경상북도 울릉군 독도',     nx: 144, ny: 123, lat: 37.240, lon: 131.867 },
};

/** 지역 ID → 격자 (없으면 undefined) */
export function getKmaGrid(regionId: string): KmaGridPoint | undefined {
  return KMA_GRID_BY_REGION[regionId];
}
