/**
 * @file Activities.ts
 * @description 낚시 외 추가 액티비티 타입 정의
 *
 * 해루질, 통발, 캐치앤쿡, 식당 경영, 선상콘도 시스템의
 * 핵심 타입을 정의합니다.
 */

// ─────────────────────────────────────────────
// 해루질 (Night Shore Hunting)
// ─────────────────────────────────────────────

/** 해루질 대상 생물 카테고리 */
export type ShoreCreatureCategory =
  | 'shellfish'       // 조개류 (바지락, 굴, 홍합)
  | 'crustacean'      // 갑각류 (게, 새우, 쏙)
  | 'cephalopod'      // 두족류 (낙지, 문어)
  | 'echinoderm'      // 극피동물 (성게, 해삼)
  | 'bivalve'         // 이매패류 (키조개, 대합)
  | 'gastropod';      // 복족류 (소라, 전복)

/** 해루질 장비 */
export interface ShoreHuntingGear {
  /** 집어등/랜턴 (해루질 필수) */
  lamp: {
    id: string;
    nameKo: string;
    lumens: number;         // 밝기 (높을수록 심해 생물 탐지)
    batteryHours: number;   // 지속시간
    isUnderwaterRated: boolean;
  };
  /** 그물/뜰채 */
  net?: {
    id: string;
    nameKo: string;
    meshSizeMm: number;     // 그물 눈 크기 (작을수록 잡어/어린 것도 걸림)
    radiusCm: number;
  };
  /** 갈고리/꼬챙이 */
  hook?: {
    id: string;
    nameKo: string;
    reachCm: number;
  };
  /** 쿨러/보관 용기 */
  cooler: CoolerSpec;
}

/** 해루질 세션 상태 */
export type ShoreHuntingPhase =
  | 'scouting'        // 조간대 탐색 중
  | 'catching'        // 생물 포획 중
  | 'releasing'       // 치어/미달 크기 방류
  | 'packing';        // 쿨러에 담기

/** 해루질 결과물 항목 */
export interface ShoreHarvestItem {
  creatureId: string;
  nameKo: string;
  category: ShoreCreatureCategory;
  countOrWeightG: number;   // 개수 or 무게(g)
  isUndersized: boolean;    // 법적 미달 크기 여부
  sizeDescCm: number;
  marketValuePerKg: number; // 시장가 (원/kg)
}

/** 해루질 세션 결과 */
export interface ShoreHuntingResult {
  durationMinutes: number;
  harvestedItems: ShoreHarvestItem[];
  totalValueEstimate: number;  // 예상 총 시세 (원)
  violationWarning: boolean;   // 불법포획 경고 여부
  fatigue: number;             // 피로도 0.0~1.0
}

// ─────────────────────────────────────────────
// 통발 시스템 (Trap / Crab Pot System)
// ─────────────────────────────────────────────

/** 통발 종류 */
export type TrapType =
  | 'crab_pot'         // 게 통발 (원형)
  | 'eel_trap'         // 장어 통발 (원통형)
  | 'octopus_trap'     // 문어 단지
  | 'shrimp_trap'      // 새우 통발
  | 'fish_trap';       // 어류 통발 (그물형)

/** 통발 아이템 */
export interface TrapSpec {
  id: string;
  nameKo: string;
  type: TrapType;
  /** 최대 포획 용량 (g) */
  maxCapacityG: number;
  /** 미끼 소모 주기 (시간) */
  baitDurationHours: number;
  /** 수심 제한 (m) */
  maxDepthM: number;
  /** 내구도 */
  durability: number;
  maxDurability: number;
  /** 목표 생물 카테고리 */
  targetCategories: ShoreCreatureCategory[];
}

/** 통발 설치 상태 */
export interface DeployedTrap {
  instanceId: string;             // 배치된 통발 고유 ID
  trapSpecId: string;
  spotId: string;
  tileX: number;
  tileY: number;
  deployedAt: Date;
  /** 다음 수거 가능 시간 */
  nextCheckAt: Date;
  baitItemId: string;
  baitRemainingRatio: number;     // 미끼 잔량 0.0~1.0
  /** 현재 포획된 생물 목록 */
  catchInside: TrapCatchItem[];
  isLostOrDamaged: boolean;       // 해류/무단수거 등으로 분실/손상
}

export interface TrapCatchItem {
  creatureId: string;
  nameKo: string;
  countOrWeightG: number;
  enteredAt: Date;
}

/** 통발 조업 결과 */
export interface TrapHarvestResult {
  trapInstanceId: string;
  soakTimeHours: number;
  items: TrapCatchItem[];
  totalValueEstimate: number;
  baitConsumed: boolean;
  durabilityLost: number;
}

// ─────────────────────────────────────────────
// 쿨러 (보관 용기) — 낚시 + 해루질 + 통발 공통
// ─────────────────────────────────────────────

export interface CoolerSpec {
  id: string;
  nameKo: string;
  /** 용량 (리터) */
  capacityLiters: number;
  /** 보냉 지속 시간 (시간, 아이스팩 포함 기준) */
  insulationHours: number;
  /** 슬롯 수 (아이스팩 포함 슬롯) */
  slots: number;
}

/** 쿨러 안 보관 아이템 */
export interface CoolerInventory {
  coolerSpecId: string;
  items: CoolerSlotItem[];
  icePackRemainingRatio: number;  // 아이스팩 0.0~1.0
  totalWeightG: number;
}

export interface CoolerSlotItem {
  type: 'fish' | 'shellfish' | 'crustacean' | 'ingredient';
  speciesId: string;
  nameKo: string;
  weightGrams: number;
  condition: 'fresh' | 'good' | 'degrading' | 'spoiled';
  storedAt: Date;
}

// ─────────────────────────────────────────────
// 캐치앤쿡 (Catch & Cook)
// ─────────────────────────────────────────────

/** 손질 단계 */
export type FishProcessingStep =
  | 'descaling'       // 비늘 제거
  | 'gutting'         // 내장 제거
  | 'filleting'       // 살 포뜨기 (회뜨기)
  | 'skinning'        // 껍질 제거
  | 'portioning';     // 포션 분할

/** 손질 위치 */
export type ProcessingLocation =
  | 'on_boat'         // 선상 위
  | 'rocky_shore'     // 갯바위
  | 'breakwater'      // 방파제 (시설 있는 곳)
  | 'restaurant'      // 식당 (전문 시설)
  | 'condo';          // 선상콘도

/** 요리 레시피 */
export interface CookingRecipe {
  id: string;
  nameKo: string;
  description: string;
  requiredIngredients: RecipeIngredient[];
  processingSteps: FishProcessingStep[];
  cookingMethod: 'raw_sashimi' | 'grilled' | 'stewed' | 'fried' | 'soup';
  requiredLocation: ProcessingLocation[];
  /** 완성 요리의 예상 판매가 (원) */
  estimatedSaleValue: number;
  /** 조리 시 체력/피로 회복 */
  staminaRestore: number;
  /** 완성 요리 Buff (다음 낚시 세션에 보너스) */
  buffEffect?: {
    type: 'bite_chance_up' | 'cast_distance_up' | 'rare_fish_up' | 'fatigue_recovery';
    value: number;
    durationMinutes: number;
  };
}

export interface RecipeIngredient {
  itemId: string;
  nameKo: string;
  requiredAmountG: number;
  isFishSpecies: boolean;   // true면 FishDatabase에서 어종 확인
}

/** 캐치앤쿡 세션 상태 */
export type CookingPhase =
  | 'selecting_fish'  // 재료 선택
  | 'processing'      // 손질 중
  | 'cooking'         // 조리 중
  | 'plating'         // 플레이팅
  | 'serving'         // 서빙 (식당에서 판매 or 자가 취식)
  | 'done';

// ─────────────────────────────────────────────
// 식당 경영 (Restaurant Management)
// ─────────────────────────────────────────────

/** 식당 단계 */
export type RestaurantTier =
  | 'pojangmacha'     // 포장마차 (1단계 해금)
  | 'small_restaurant'// 소형 횟집 (2단계)
  | 'mid_restaurant'  // 중형 식당 (3단계)
  | 'premium_sashimi';// 고급 횟집 (4단계)

/** 식당 상태 */
export interface RestaurantState {
  restaurantId: string;
  ownerPlayerId: string;
  name: string;
  tier: RestaurantTier;
  locationSpotId: string;   // 어느 방파제/항구 근처에 있는지
  /** 평판 점수 (0~100, 단골/리뷰 반영) */
  reputationScore: number;
  /** 보유 식재료 재고 */
  ingredientStock: CoolerSlotItem[];
  /** 오늘의 메뉴 */
  todayMenu: CookingRecipe[];
  /** 오늘 매출 (원) */
  todayRevenue: number;
  /** 누적 총 매출 */
  totalRevenue: number;
  /** 직원 (단계 업그레이드 시 고용 가능) */
  staffCount: number;
  /** 현재 영업 중 여부 */
  isOpen: boolean;
  /** 다음 업그레이드까지 필요한 평판 */
  nextTierReputationRequired: number;
}

/** 식당 손님 타입 */
export interface DiningCustomer {
  customerId: string;
  nameKo: string;           // 손님 이름 (랜덤 생성)
  preferredDishes: string[]; // 선호 메뉴 카테고리
  budget: number;            // 예산 (원)
  patience: number;          // 인내심 0.0~1.0 (오래 기다리면 감소)
  satisfaction: number;      // 만족도 0.0~1.0 (평판에 영향)
}

// ─────────────────────────────────────────────
// 선상콘도 (Floating Condo / Pension)
// ─────────────────────────────────────────────

/** 선상콘도/펜션 상태 */
export interface FloatingCondoState {
  condoId: string;
  ownerPlayerId: string;
  name: string;
  locationSpotId: string;
  /** 보트/선박 종류 */
  vesselType: 'small_boat' | 'cabin_boat' | 'large_vessel' | 'houseboat';
  /** 총 객실/침대 수 */
  totalBerths: number;
  /** 예약 현황 */
  reservations: CondoReservation[];
  /** 부대시설 */
  amenities: CondoAmenity[];
  /** 1박 기본 요금 (원) */
  baseNightlyRate: number;
  /** 낚시장비 보관함 슬롯 수 */
  tackleStorageSlots: number;
  /** 보유 구명조끼/안전장비 */
  safetyEquipmentCount: number;
}

export interface CondoReservation {
  reservationId: string;
  guestNickname: string;
  checkIn: Date;
  checkOut: Date;
  berths: number;
  totalPaid: number;
  isPaid: boolean;
  specialRequest?: string;  // '낙지 해루질 출조 동반 요청' 등
}

export type CondoAmenity =
  | 'onboard_kitchen'   // 선상 주방
  | 'bait_storage'      // 미끼 냉장고
  | 'fish_cooler'       // 어창 (대형 쿨러)
  | 'fishing_deck'      // 낚시 전용 데크
  | 'night_lamp'        // 집어등 시설
  | 'dive_platform'     // 해루질용 다이빙 플랫폼
  | 'bbq_grill'         // 갯바위 바베큐
  | 'generator'         // 발전기 (야간 조명)
  | 'gps_sonar';        // GPS + 어탐기
