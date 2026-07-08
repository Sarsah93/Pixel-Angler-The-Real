/**
 * @file CoordinateUtils.ts
 * @description 위경도 ↔ 도트맵/기상청 격자 좌표 변환 유틸리티
 *
 * 실제 낚시터 위경도(WGS84)를 게임 내 좌표계로 변환합니다.
 * 공공데이터 수집 스크립트 및 WorldMapScene에서 사용됩니다.
 */

// ─────────────────────────────────────────────────────────
// 한국 지리 바운딩 박스 (본토 + 제주 포함)
// ─────────────────────────────────────────────────────────
const KOREA_BOUNDS = {
  /** 최남단 위도 (마라도 기준) */
  minLat: 33.0,
  /** 최북단 위도 (고성 기준, 게임 범위) */
  maxLat: 38.7,
  /** 최서단 경도 (서해 끝) */
  minLon: 124.5,
  /** 최동단 경도 (독도 기준) */
  maxLon: 131.0,
} as const;

/**
 * 위경도 → 도트맵 정규화 좌표 변환 (0.0~1.0)
 *
 * @example
 * // 거제 구조라 방파제 (lat: 34.7832, lon: 128.6834)
 * latLonToDotMapXY(34.7832, 128.6834)
 * // → { x: 0.643, y: 0.671 }
 */
export function latLonToDotMapXY(
  lat: number,
  lon: number,
): { x: number; y: number } {
  const x = (lon - KOREA_BOUNDS.minLon) / (KOREA_BOUNDS.maxLon - KOREA_BOUNDS.minLon);
  // 위도는 높을수록 화면 상단 → Y축 반전
  const y = 1.0 - (lat - KOREA_BOUNDS.minLat) / (KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat);
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/**
 * 도트맵 정규화 좌표 → Phaser 월드 픽셀 좌표 변환
 *
 * @param dotX   0.0~1.0 정규화 X
 * @param dotY   0.0~1.0 정규화 Y
 * @param worldW Phaser 월드 너비 (px)
 * @param worldH Phaser 월드 높이 (px)
 */
export function dotMapXYToWorld(
  dotX: number,
  dotY: number,
  worldW: number,
  worldH: number,
): { px: number; py: number } {
  return { px: dotX * worldW, py: dotY * worldH };
}

/**
 * 위경도 → 기상청 격자 좌표 변환 (Lambert 투영)
 *
 * 기상청 API는 위경도 직접 입력 불가,
 * 반드시 이 함수로 격자(nx, ny) 변환 후 사용해야 합니다.
 *
 * @see https://www.kma.go.kr/kma/intro/kwad.jsp
 */
export function latLonToKmaGrid(
  lat: number,
  lon: number,
): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

/**
 * 두 위경도 간 직선 거리 계산 (km, Haversine 공식)
 *
 * 스팟에서 가장 가까운 KHOA 조위 관측소 자동 매핑 시 사용됩니다.
 */
export function haversineDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * SPOT_DATABASE 내 스팟의 dotMapX/Y 및 kmaGridX/Y를
 * 위경도로부터 자동 계산하여 보완합니다.
 *
 * 공공데이터 수집 스크립트 또는 게임 초기화 시 1회 호출하면 됩니다.
 */
export function enrichSpotCoordinates<
  T extends { latitude: number; longitude: number; dotMapX?: number; dotMapY?: number; kmaGridX?: number; kmaGridY?: number }
>(spots: T[]): T[] {
  return spots.map((spot) => {
    const { x, y } = latLonToDotMapXY(spot.latitude, spot.longitude);
    const { nx, ny } = latLonToKmaGrid(spot.latitude, spot.longitude);
    return {
      ...spot,
      dotMapX: spot.dotMapX ?? x,
      dotMapY: spot.dotMapY ?? y,
      kmaGridX: spot.kmaGridX ?? nx,
      kmaGridY: spot.kmaGridY ?? ny,
    };
  });
}
