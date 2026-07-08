/**
 * @file Economy.ts
 * @description 게임 경제 및 실시간 경락 시세 관련 타입 정의
 */

/**
 * 수산물 도매시장 경락 실거래가 정보
 * 농림수산식품교육문화정보원(농정원) API의 실시간 응답에 대응하는 규격입니다.
 */
export interface WholesalePriceInfo {
  /** 어종 ID (FishDatabase의 key와 매핑) */
  speciesId: string;
  /** 품목 명칭 (예: "넙치(광어)", "감성돔") */
  itemName: string;
  /** 품종 세부 명칭 (예: "양식넙치", "자연산넙치") */
  breedName: string;
  /** 등급 정보 (예: "특", "상", "보통") */
  gradeName: string;
  /** 낙찰 단위 중량 (kg) */
  tradeWeightKg: number;
  /** kg당 평균 경락 낙찰가격 (원) */
  avgPricePerKg: number;
  /** 일일 최고 경락가 */
  maxPricePerKg: number;
  /** 일일 최저 경락가 */
  minPricePerKg: number;
  /** 일일 전국 경매 낙찰 총 거래량 (kg) */
  totalVolumeKg: number;
  /** 경매일자 (YYYY-MM-DD) */
  auctionDate: Date;
}

/**
 * 어종별 도매시장 품목 코드 및 기본 표준 수매단가 설정
 */
export interface AuctionMappingDef {
  /** 농정원 경락가격 품목 코드 */
  itemCode: string;
  /** 농정원 세부 품종 코드 (선택 사항) */
  breedCode?: string;
  /** API 통신 실패 또는 오프라인 상태일 때 사용할 기본 kg당 수매단가 (원) */
  defaultPricePerKg: number;
  /** 어종별 크기에 따른 품질 보정계수 */
  sizeFactorMultiplier: number;
}

/** 어종별 경락 코드 매핑 테이블 */
export const SEAFOOD_AUCTION_MAPPING: Record<string, AuctionMappingDef> = {
  black_seabream: {
    itemCode: '100401', // 감성돔
    defaultPricePerKg: 25000,
    sizeFactorMultiplier: 1.2,
  },
  largescale_blackfish: {
    itemCode: '100403', // 벵에돔
    defaultPricePerKg: 30000,
    sizeFactorMultiplier: 1.3,
  },
  hairtail: {
    itemCode: '100201', // 갈치
    defaultPricePerKg: 15000,
    sizeFactorMultiplier: 1.0,
  },
  black_rockfish: {
    itemCode: '100502', // 볼락
    defaultPricePerKg: 12000,
    sizeFactorMultiplier: 1.1,
  },
  yellowtail: {
    itemCode: '100301', // 부시리
    defaultPricePerKg: 18000,
    sizeFactorMultiplier: 1.0,
  },
  red_seabream: {
    itemCode: '100402', // 참돔
    defaultPricePerKg: 22000,
    sizeFactorMultiplier: 1.25,
  },
  japanese_seabass: {
    itemCode: '100501', // 농어
    defaultPricePerKg: 20000,
    sizeFactorMultiplier: 1.15,
  },
  striped_mullet: {
    itemCode: '100504', // 숭어
    defaultPricePerKg: 8000,
    sizeFactorMultiplier: 0.9,
  },
  olive_flounder: {
    itemCode: '100101', // 광어/넙치
    defaultPricePerKg: 28000,
    sizeFactorMultiplier: 1.1,
  },
  filefish: {
    itemCode: '100601', // 쥐치
    defaultPricePerKg: 14000,
    sizeFactorMultiplier: 1.0,
  },
};

/**
 * 마트(하나로마트/대형마트) 유통 품목 규격 정의
 */
export interface MartRetailMappingDef {
  /** 품목 고유 ID (인벤토리 아이템 ID와 대응) */
  itemId: string;
  /** 한국어 이름 */
  nameKo: string;
  /** 대분류 카테고리 */
  category: 'chilled_seafood' | 'agricultural' | 'marine_processed' | 'cooking_base';
  /** 기본 마트 판매 단가 (플레이어가 구매 시 가격, 원) */
  buyPrice: number;
  /** 기본 마트 수매 단가 (플레이어가 마트에 판매 시 가격, 원) */
  sellPrice: number;
}

/**
 * 하나로마트/대형마트 유통 상품 데이터베이스 (선어 및 기타 농수산물/가공품)
 */
export const MART_RETAIL_DATABASE: Record<string, MartRetailMappingDef> = {
  // ─── 1. 선어 및 Chilled Seafood (활어를 회뜨거나 말린 제품) ───
  fillet_flounder: {
    itemId: 'fillet_flounder',
    nameKo: '손질 광어 필렛(선어)',
    category: 'chilled_seafood',
    buyPrice: 15000,
    sellPrice: 10000,
  },
  dried_hairtail: {
    itemId: 'dried_hairtail',
    nameKo: '반건조 명품 갈치(선어)',
    category: 'chilled_seafood',
    buyPrice: 12000,
    sellPrice: 8000,
  },
  sashimi_pack: {
    itemId: 'sashimi_pack',
    nameKo: '포장 모둠회 소형',
    category: 'chilled_seafood',
    buyPrice: 22000,
    sellPrice: 14000,
  },

  // ─── 2. 기타 해산물 및 농수산물 (해루질/통발 습득물 및 야채) ───
  clam_fresh: {
    itemId: 'clam_fresh',
    nameKo: '국산 참바지락 조개',
    category: 'agricultural',
    buyPrice: 6000,
    sellPrice: 4000,
  },
  octopus_raw: {
    itemId: 'octopus_raw',
    nameKo: '해안 산낙지',
    category: 'agricultural',
    buyPrice: 9000,
    sellPrice: 6500,
  },
  oyster_fresh: {
    itemId: 'oyster_fresh',
    nameKo: '자연산 각굴/석화',
    category: 'agricultural',
    buyPrice: 8000,
    sellPrice: 5000,
  },
  seaweed_fresh: {
    itemId: 'seaweed_fresh',
    nameKo: '동해안 생미역',
    category: 'agricultural',
    buyPrice: 3500,
    sellPrice: 2000,
  },

  // ─── 3. 일반 농산물 (요리 양념 및 야채) ───
  garlic_pack: {
    itemId: 'garlic_pack',
    nameKo: '의성 국산 마늘 팩',
    category: 'agricultural',
    buyPrice: 4000,
    sellPrice: 2000,
  },
  chili_pack: {
    itemId: 'chili_pack',
    nameKo: '청양 매운고추 팩',
    category: 'agricultural',
    buyPrice: 3000,
    sellPrice: 1500,
  },
  onion_pack: {
    itemId: 'onion_pack',
    nameKo: '햇양파 망',
    category: 'agricultural',
    buyPrice: 4500,
    sellPrice: 2200,
  },

  // ─── 4. 조리용 기본 베이스 가공품 ───
  cooking_oil: {
    itemId: 'cooking_oil',
    nameKo: '백설 콩기름 식용유',
    category: 'cooking_base',
    buyPrice: 5000,
    sellPrice: 1000,
  },
  sashimi_soy_sauce: {
    itemId: 'sashimi_soy_sauce',
    nameKo: '회전용 양조간장',
    category: 'cooking_base',
    buyPrice: 3000,
    sellPrice: 500,
  },
};


// ─────────────────────────────────────────────────────────────
// 수산시장 경매 시스템 (Fish Market Auction System)
// ─────────────────────────────────────────────────────────────

/**
 * 경매 품목 대분류
 *
 * - `fish_fresh`  : 선어·어류 (01:00~03:00)
 * - `shellfish`   : 패류·갑각류 (01:00~03:00, 선어와 동시 진행)
 * - `fish_live`   : 활어 (03:00~07:00)
 */
export type AuctionCategory =
  | 'fish_fresh'   // 선어/어류 — 갈치, 고등어, 조기 등
  | 'shellfish'    // 패류/갑각류 — 굴, 바지락, 게 등
  | 'fish_live';   // 활어 — 광어, 감성돔, 농어 등

/**
 * 경매 시간대 창 정의
 * 게임 내 시간(0~23 시, 0~59 분) 기준
 */
export interface AuctionTimeWindow {
  /** 경매 시작 시 */
  startHour: number;
  startMinute: number;
  /** 경매 종료 시 */
  endHour: number;
  endMinute: number;
  /** 해당 시간대에 진행되는 경매 품목 카테고리 */
  categories: AuctionCategory[];
}

/**
 * 경매 진행 일정 (요일별 운영 규칙)
 * 0=일요일, 1=월요일, ..., 6=토요일
 */
export interface AuctionScheduleRule {
  /** 경매가 열리지 않는 요일 목록 */
  closedOnWeekdays: number[];
  /** 시간대별 경매 창 목록 */
  timeWindows: AuctionTimeWindow[];
}

/** 법정 수산시장 경매 기본 일정 */
export const DEFAULT_AUCTION_SCHEDULE: AuctionScheduleRule = {
  // 일요일(0) 새벽에는 경매 미개장 (법인별 상이하나 기본 적용)
  closedOnWeekdays: [0],
  timeWindows: [
    {
      // 선어·어류·패류 경매 (심야~새벽)
      startHour: 1,
      startMinute: 0,
      endHour: 3,
      endMinute: 0,
      categories: ['fish_fresh', 'shellfish'],
    },
    {
      // 활어 경매 (새벽)
      startHour: 3,
      startMinute: 0,
      endHour: 7,
      endMinute: 0,
      categories: ['fish_live'],
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 경매 품목 (Lot)
// ─────────────────────────────────────────────────────────────

/** 경매 낙찰 상태 */
export type AuctionLotStatus =
  | 'pending'    // 경매 대기 중
  | 'open'       // 입찰 진행 중
  | 'sold'       // 낙찰 완료
  | 'unsold'     // 유찰
  | 'withdrawn'; // 출품 취소

/**
 * 경매 품목 단위 (Lot)
 * 경매에 출품된 개별 수산물 묶음 단위입니다.
 */
export interface AuctionLot {
  /** 품목 인스턴스 고유 ID */
  lotId: string;
  /** 어종/품목 ID (speciesId) */
  speciesId: string;
  /** 품목 한국어 명칭 */
  nameKo: string;
  /** 경매 대분류 */
  category: AuctionCategory;
  /** 출품 중량 (kg) */
  weightKg: number;
  /** 등급 */
  grade: '특' | '상' | '보통';
  /** 원산지 */
  origin: string;
  /** 최저 입찰 시작가 (원/kg) */
  startPricePerKg: number;
  /** 현재 최고 입찰가 (원/kg) */
  currentBidPerKg: number;
  /** 현재 낙찰 상태 */
  status: AuctionLotStatus;
  /**
   * 낙찰자 ID
   * 'npc_buyer_X' 이면 NPC 낙찰, 'player' 이면 플레이어 낙찰
   */
  winnerId: string | null;
  /** NPC 최대 예상 입찰 한도 (원/kg, AI 경쟁 시뮬레이션용) */
  npcMaxBidPerKg: number;
}

// ─────────────────────────────────────────────────────────────
// 경매 세션
// ─────────────────────────────────────────────────────────────

/**
 * AuctionSession — 특정 날짜/시간대에 진행되는 경매 회차
 * 여러 AuctionLot를 순차적으로 경매합니다.
 */
export interface AuctionSession {
  /** 세션 고유 ID (예: '2026-07-09_fish_fresh') */
  sessionId: string;
  /** 경매 카테고리 */
  category: AuctionCategory;
  /** 게임 내 날짜 (YYYY-MM-DD) */
  gameDate: string;
  /** 게임 내 요일 (0=일요일) */
  weekday: number;
  /** 경매 개장 시간 (게임 내 시) */
  openAtHour: number;
  /** 경매 마감 시간 (게임 내 시) */
  closeAtHour: number;
  /** 출품 품목 목록 */
  lots: AuctionLot[];
  /** 현재 진행 중인 lot 인덱스 */
  currentLotIndex: number;
  /** 세션 완료 여부 */
  isCompleted: boolean;
}

// ─────────────────────────────────────────────────────────────
// 입찰 결과
// ─────────────────────────────────────────────────────────────

/** 플레이어 입찰 결과 */
export interface AuctionBidResult {
  /** 입찰 성공 여부 */
  success: boolean;
  /** 입찰 후 현재 최고가 (원/kg) */
  newBidPerKg: number;
  /** 실패 사유 */
  failReason?: 'auction_closed' | 'bid_too_low' | 'already_won' | 'insufficient_funds';
  /** 플레이어가 현재 최고 입찰자인지 여부 */
  isLeading: boolean;
}
