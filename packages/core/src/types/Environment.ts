/**
 * @file Environment.ts
 * @description 실시간 환경 데이터 타입 정의
 *
 * 기상청, 해양조사원 API에서 받아오는 데이터의 구조체.
 * Mock 데이터와 실제 API 데이터 모두 이 타입을 준수해야 합니다.
 */

// ─────────────────────────────────────────────
// 물때 정보
// 음력 기반 계산: 1물 ~ 15물 (사리: 8~9물, 조금: 14~15물)
// ─────────────────────────────────────────────
export interface TideInfo {
  /** 물때 (1~15) */
  tidePhase: number;
  /** 물때 이름 — 예: "8물 (사리)", "조금" */
  tidePhaseLabel: string;
  /** 조류 세기 점수 (0.0~1.0, 1.0이 사리) */
  currentStrength: number;
  /** 만조 시각 (오늘) */
  highTideTimes: Date[];
  /** 간조 시각 (오늘) */
  lowTideTimes: Date[];
  /** 현재 조위 (cm) */
  currentWaterLevelCm: number;
  /** 만조 조위 높이 (cm, 최댓값 기준) */
  highTideHeightCm: number;
  /** 간조 조위 높이 (cm, 최솟값 기준) */
  lowTideHeightCm: number;
  /** 다음 만조/간조까지 남은 시간 (분) */
  minutesToNextTide: number;
  /** 다음 조류 변화가 만조인지 간조인지 */
  nextTideType: 'high' | 'low';
}

// ─────────────────────────────────────────────
// 날씨 데이터
// ─────────────────────────────────────────────
export interface WeatherData {
  /** 기온 (°C) */
  temperatureC: number;
  /** 수온 (°C) */
  seaSurfaceTempC: number;
  /** 풍속 (m/s) */
  windSpeedMs: number;
  /** 풍향 (도, 0~360) */
  windDirectionDeg: number;
  /** 풍향 텍스트 — 예: "북동풍" */
  windDirectionLabel: string;
  /** 파고 (m) */
  waveHeightM: number;
  /** 가시성 (km) */
  visibilityKm: number;
  /** 강수 여부 */
  isPrecipitating: boolean;
  /** 강수량 (mm/h) */
  precipitationMmPerHour: number;
  weatherCondition: WeatherCondition;
  /** 데이터 측정 시각 */
  measuredAt: Date;
  /** 일출 시각 */
  sunriseAt: Date;
  /** 일몰 시각 */
  sunsetAt: Date;
}

export type WeatherCondition =
  | 'clear'           // 맑음
  | 'partly_cloudy'   // 구름 조금
  | 'cloudy'          // 흐림
  | 'rainy'           // 비
  | 'foggy'           // 안개
  | 'stormy'          // 폭풍 (출조 불가 조건)
  | 'snowy';          // 눈 (겨울)

// ─────────────────────────────────────────────
// 낚시터 환경 (게임 내 특정 포인트에서의 종합 환경)
// ─────────────────────────────────────────────
export interface FishingEnvironment {
  spotId: string;
  locationName: string;
  tide: TideInfo;
  weather: WeatherData;
  /** 현재 시각 */
  currentTime: Date;
  /** 야간 여부 */
  isNighttime: boolean;
  /** 출조 가능 여부 (기상 조건 기반) */
  isSafeForFishing: boolean;
  /** 출조 불가 이유 (조건 미충족 시) */
  unsafeReason?: string;
}

// ─────────────────────────────────────────────
// 낚시터 지점 정보 (공공데이터 API 응답 기반)
// ─────────────────────────────────────────────
export interface FishingSpotInfo {
  id: string;
  /** 공공데이터 API 원본 ID */
  publicDataId?: string;
  name: string;
  /** 지역 코드 — 예: "gyeongnam_geoje" */
  regionCode: string;
  /** 지역 이름 — 예: "경남 거제시" */
  regionName: string;
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  spotType: SpotType;
  /** 주요 어종 ID 목록 */
  mainSpeciesIds: string[];
  /** 운영 여부 */
  isOperational: boolean;
  /** 낚시 금지 구역 여부 */
  isRestricted: boolean;
  /** 편의 시설 */
  facilities: SpotFacility[];
  /** 낚시 대여 가능 여부 */
  hasRentalService: boolean;
  /** 근처 낚시용품점 여부 */
  hasNearbyTackleShop: boolean;
  /** 근처 편의점/마트 여부 */
  hasNearbyConvenienceStore: boolean;
  description: string;
}

export type SpotType =
  | 'breakwater'        // 방파제
  | 'rocky_shore'       // 갯바위
  | 'boat_fishing'      // 선상 낚시
  | 'overnight_boat'    // 오버나잇 선상콘도
  | 'pier'              // 선착장/부두
  | 'beach'             // 모래사장 (원투 낚시)
  | 'tidal_flat';       // 갯벌 (해루질)

export type SpotFacility =
  | 'parking'
  | 'restroom'
  | 'convenience_store'
  | 'bait_shop'
  | 'restaurant'
  | 'sashimi_restaurant';  // 횟집
