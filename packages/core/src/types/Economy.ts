/**
 * @file Economy.ts
 * @description 게임 경제 및 실시간 경락 시세 관련 타입 정의
 */

import type { CatchMethod } from './Story.js';

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
  /**
   * 시세 구분 (활어/선어) — API가 활어·선어를 분리 제공할 때 지정.
   * 미지정(구분 없음)이면 활어/선어 모두에 동일 적용 (사용자 규칙 2026-07-25).
   */
  tier?: 'live' | 'fresh';
}

/**
 * 어종별 도매시장 품목 코드 및 기본 표준 수매단가 설정
 */
export interface AuctionMappingDef {
  /** 농정원 경락가격 품목 코드 */
  itemCode: string;
  /** 농정원 세부 품종 코드 (선택 사항) */
  breedCode?: string;
  /** API 통신 실패 또는 오프라인 상태일 때 사용할 기본 kg당 수매단가 (원, 1kg 기준) */
  defaultPricePerKg: number;
  /** 어종별 크기에 따른 품질 보정계수 */
  sizeFactorMultiplier: number;
  /**
   * 무게-가격 지수 (기본 1 = 선형). 방어처럼 크게 자라는 어종은 <1로 두어 대형 개체
   * 가격이 무게에 정비례해 폭증하는 것을 완화한다 (실측: 방어 소형~중형 마리당 가격이
   * 거의 평탄 → per-kg 단가가 크기에 따라 감소). price ∝ weightKg^weightExp.
   */
  weightExp?: number;
  /**
   * 301차 — 식용 한 마리 최저가(원). 비우면 `FISH_PIECE_FLOOR_KRW`. 시장은 작은 생선을 마리 · 묶음 단위로 팔고 한 마리 1,000원 밑으로는
   * 내려가지 않는다 — kg 단가 × 작은 무게(꽁치 25cm 49g · 학꽁치 28cm 38g)로는 100~200원이 나오던 종이 있었다(사용자 리포트).
   */
  minPieceKrw?: number;
}

/**
 * 301차 — 식용 어획물 한 마리 최저가(원). 사용자 「실물가를 적용한다더라도 실제는 마리당 1~2천원은 되어야함」.
 * `evaluateFishSellPrice`가 마리 값에 깔고, 가방 판매 사슬(상점 6할 · 상태 배율)은 그 뒤 **상태 배율만** 곱한 값을 바닥으로 다시 깐다.
 */
export const FISH_PIECE_FLOOR_KRW = 1000;

/**
 * 302차 — 값은 다른 어종 행을 따르는 도감 갈래(같은 물고기). 경락 표에 행을 따로 두면 시세 띠(거래량 상위 다섯)에
 * 「참돔 (야간)」이 참돔과 나란히 뜬다 — 표에는 두지 않고 값만 따른다(`COOKING_SPECIES_ALIAS`와 같은 짝).
 */
export const PRICE_SPECIES_ALIAS: Readonly<Record<string, string>> = { night_seabream: 'red_seabream' };

/** 값 매기기에 쓸 경락 행 — 별칭이면 원 어종 행 */
export function auctionMappingOf(speciesId: string): AuctionMappingDef | undefined {
  return SEAFOOD_AUCTION_MAPPING[speciesId] ?? SEAFOOD_AUCTION_MAPPING[PRICE_SPECIES_ALIAS[speciesId] ?? ''];
}

/** 종별 한 마리 최저가(원) — 표에 없으면 기본 1,000 */
export function fishPieceFloorKrw(speciesId: string): number {
  return auctionMappingOf(speciesId)?.minPieceKrw ?? FISH_PIECE_FLOOR_KRW;
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
  blue_rockfish: {
    itemCode: '100502', // 볼락
    defaultPricePerKg: 12000,
    sizeFactorMultiplier: 1.1,
  },
  yellowtail: {
    itemCode: '100301', // 방어
    // 실측 시세: 소형(1~4kg) 마리당 2.5~3만 / 중형(4~8kg) 4.5만 / 특대(10kg+) 5만+·kg당 2.5~3만.
    // 마리당 가격이 크기에 거의 평탄 → weightExp<1로 대형 폭증 완화 (1kg≈2.7만, 8kg≈9만 수준).
    defaultPricePerKg: 27000,
    sizeFactorMultiplier: 0.15,
    weightExp: 0.4,
  },
  red_seabream: {
    itemCode: '100402', // 참돔
    defaultPricePerKg: 22000,
    sizeFactorMultiplier: 1.25,
  },
  sea_bass: {
    itemCode: '100501', // 농어
    defaultPricePerKg: 20000,
    sizeFactorMultiplier: 1.15,
  },
  striped_mullet: {
    itemCode: '100504', // 숭어
    defaultPricePerKg: 8000,
    sizeFactorMultiplier: 0.9,
  },
  flatfish: {
    itemCode: '100101', // 광어/넙치
    defaultPricePerKg: 28000,
    sizeFactorMultiplier: 1.1,
  },
  filefish: {
    itemCode: '100601', // 쥐치
    // 302차 — 14,000 → 26,000. 신선 쥐치(중품) 국내 도매 kg 25,800~30,000원(Tridge 2025-01 · 04 — 말쥐치보다 두 배 넘게 비싼 횟감)
    defaultPricePerKg: 26000,
    sizeFactorMultiplier: 1.0,
  },
  // ── 어종 마스터 통합 추가분 (2026-07-16) — MAFRA 경락가 매칭 대상 ──
  amberjack: {
    itemCode: '100302', // 부시리
    // 대형 회유어(최대 150cm) — 방어류와 동일하게 대형 개체 폭증 완화
    defaultPricePerKg: 22000,
    sizeFactorMultiplier: 0.15,
    weightExp: 0.45,
  },
  chub_mackerel: {
    itemCode: '100202', // 고등어
    defaultPricePerKg: 8000,
    sizeFactorMultiplier: 0.9,
  },
  horse_mackerel: {
    itemCode: '100203', // 전갱이
    defaultPricePerKg: 9000,
    sizeFactorMultiplier: 0.9,
  },
  stone_beakperch: {
    itemCode: '100404', // 돌돔
    defaultPricePerKg: 60000,
    sizeFactorMultiplier: 1.4,
  },
  spotted_knifejaw: {
    itemCode: '100405', // 강담돔
    defaultPricePerKg: 65000,
    sizeFactorMultiplier: 1.4,
  },
  conger_eel: {
    itemCode: '100701', // 붕장어
    defaultPricePerKg: 18000,
    sizeFactorMultiplier: 1.0,
  },
  fat_greenling: {
    itemCode: '100801', // 쥐노래미
    defaultPricePerKg: 20000,
    sizeFactorMultiplier: 1.05,
  },
  greenling: {
    itemCode: '100802', // 노래미
    defaultPricePerKg: 14000,
    sizeFactorMultiplier: 1.0,
  },
  flounder: {
    itemCode: '100102', // 도다리(문치가자미)
    defaultPricePerKg: 22000,
    sizeFactorMultiplier: 1.05,
  },
  tiger_puffer: {
    itemCode: '100901', // 참복(자주복)
    defaultPricePerKg: 55000,
    sizeFactorMultiplier: 1.2,
  },
  black_rockfish: {
    itemCode: '100503', // 조피볼락(우럭)
    defaultPricePerKg: 16000,
    sizeFactorMultiplier: 1.05,
  },
  scorpionfish: {
    itemCode: '100505', // 쏨뱅이
    defaultPricePerKg: 25000,
    sizeFactorMultiplier: 1.1,
  },
  longtail_blackfish: {
    itemCode: '100406', // 긴꼬리벵에돔
    defaultPricePerKg: 50000,
    sizeFactorMultiplier: 1.3,
  },
  redlip_mullet: {
    itemCode: '100506', // 가숭어(밀치)
    defaultPricePerKg: 10000,
    sizeFactorMultiplier: 0.95,
  },
  // ── 신규 어종 12종 추가분 (2026-07-16) ──
  frog_flounder: {
    itemCode: '100103', // 도다리
    defaultPricePerKg: 22000,
    sizeFactorMultiplier: 1.05,
  },
  starry_flounder: {
    itemCode: '100104', // 강도다리
    defaultPricePerKg: 16000,
    sizeFactorMultiplier: 1.0,
  },
  tonguefish: {
    itemCode: '100105', // 개서대
    defaultPricePerKg: 15000,
    sizeFactorMultiplier: 1.0,
  },
  pike_conger: {
    itemCode: '100702', // 갯장어(하모)
    defaultPricePerKg: 45000,
    sizeFactorMultiplier: 1.3,
  },
  pacific_saury: {
    itemCode: '100204', // 꽁치
    // 301차 — 5,000 → 8,000. 구 값은 원양 냉동 꽁치(대만 · 일본산 경락) 밴드였다. 국내 냉동 도매(중품) 9kg 75,000원 ≈ 8,300원/kg(Tridge 2025-04)
    //   · 생물은 산지 위판 kg 6,000~12,000(가을 주문진 · 구룡포 — 2025 어획 40% 증가로 하락) — 생물 기준 8,000. 마리 값은 `minPieceKrw` 바닥(1,000)이 받친다.
    defaultPricePerKg: 8000,
    sizeFactorMultiplier: 0.85,
  },
  round_herring: {
    itemCode: '100205', // 눈퉁멸
    defaultPricePerKg: 3000,
    sizeFactorMultiplier: 0.8,
  },
  blackthroat_seaperch: {
    itemCode: '101101', // 눈볼대(금태)
    defaultPricePerKg: 50000,
    sizeFactorMultiplier: 1.35,
  },
  pacific_cod: {
    itemCode: '101001', // 대구
    defaultPricePerKg: 12000,
    sizeFactorMultiplier: 1.15,
  },
  korean_pomfret: {
    itemCode: '101201', // 덕대
    defaultPricePerKg: 20000,
    sizeFactorMultiplier: 1.05,
  },
  silver_pomfret: {
    itemCode: '101202', // 병어
    defaultPricePerKg: 24000,
    sizeFactorMultiplier: 1.15,
  },
  sandfish: {
    itemCode: '101301', // 도루묵
    // 302차 — 6,000 → 9,000. 강원 수협 위판 평균 kg 2019 2,951 · 2022 4,280 · 2023 9,177원(어획 60% 감소 — 수협중앙회 집계 보도)
    defaultPricePerKg: 9000,
    sizeFactorMultiplier: 0.85,
  },
  black_scraper: {
    itemCode: '100602', // 말쥐치
    defaultPricePerKg: 11000,
    sizeFactorMultiplier: 1.0,
  },
  // ── 루어/지깅 중대형 + 두족류 (2026-07-20) ──
  greater_amberjack: {
    itemCode: '100303', // 잿방어
    // 잿방어 = 방어류 최고급 대형어 — 폭증 완화 + 프리미엄 단가
    defaultPricePerKg: 30000,
    sizeFactorMultiplier: 0.15,
    weightExp: 0.45,
  },
  spanish_mackerel: {
    itemCode: '100204', // 삼치
    // 삼치도 대형(최대 100cm) — 완만한 sub-linear
    defaultPricePerKg: 15000,
    sizeFactorMultiplier: 0.2,
    weightExp: 0.6,
  },
  squid: {
    itemCode: '101401', // 무늬오징어(한치류)
    defaultPricePerKg: 25000,
    sizeFactorMultiplier: 1.1,
  },
  cuttlefish: {
    itemCode: '101402', // 갑오징어
    defaultPricePerKg: 22000,
    sizeFactorMultiplier: 1.0,
  },
  octopus: {
    itemCode: '101403', // 참문어(돌문어)
    defaultPricePerKg: 28000,
    sizeFactorMultiplier: 1.1,
  },
  giant_octopus: {
    itemCode: '101403', // 대문어(피문어) — 대물은 무게 폭증 완화(weightExp)
    defaultPricePerKg: 24000,
    sizeFactorMultiplier: 0.2,
    weightExp: 0.5,
  },
  swordtip_squid: {
    itemCode: '101401', // 한치(창꼴뚜기) — 무늬오징어와 동일 품목 코드(오징어류) 공유
    // 오징어류 중 최고가 — 여름 제주 활한치는 무늬오징어·참문어보다 높게 거래된다
    defaultPricePerKg: 32000,
    sizeFactorMultiplier: 1.1,
  },
  flying_squid: {
    itemCode: '101401', // 289차 — 살오징어(동해 「오징어」) · 오징어류 품목 코드 공유 · 어획 급감으로 시세가 높다(활 오징어 kg 2만 원대)
    defaultPricePerKg: 22000,
    sizeFactorMultiplier: 1.0,
  },
  // ── 신규 어종 6종 + 복섬 (2026-07-25) ──
  yellowfin_puffer: { itemCode: '100901', defaultPricePerKg: 40000, sizeFactorMultiplier: 1.2 }, // 까치복
  bartail_flathead: { itemCode: '100112', defaultPricePerKg: 22000, sizeFactorMultiplier: 1.1 }, // 양태
  bluefin_searobin: { itemCode: '100113', defaultPricePerKg: 15000, sizeFactorMultiplier: 1.0 }, // 성대
  hagfish: { itemCode: '100210', defaultPricePerKg: 18000, sizeFactorMultiplier: 0.9 },          // 먹장어(곰장어)
  halfbeak: { itemCode: '100211', defaultPricePerKg: 14000, sizeFactorMultiplier: 0.9 },         // 학꽁치 — 301 대조: 급냉 1kg 소매 13,900원(쿠팡 통영 · 거제산) · 28cm 38g라 마리 값은 바닥(1,000)이 받친다
  northern_whiting: { itemCode: '100114', defaultPricePerKg: 16000, sizeFactorMultiplier: 1.0 }, // 보리멸
  grass_puffer: { itemCode: '100902', defaultPricePerKg: 5000, sizeFactorMultiplier: 0.8 },      // 복섬
  // 295차 — 섬 어종 넷(품목 코드는 추정 — 실 시세는 품목명 매핑이 잡는다)
  pearl_spot_chromis: { itemCode: '100409', defaultPricePerKg: 12000, sizeFactorMultiplier: 0.8 },   // 자리돔(작아서 kg 묶음)
  bulgyhead_wrasse: { itemCode: '100410', defaultPricePerKg: 16000, sizeFactorMultiplier: 1.1, weightExp: 0.6 },   // 혹돔(대형 — 마리당 평탄)
  red_tilefish: { itemCode: '100406', defaultPricePerKg: 45000, sizeFactorMultiplier: 1.2 },        // 옥돔(제주 — 비싼 생선)
  bluefin_tuna: { itemCode: '101501', defaultPricePerKg: 30000, sizeFactorMultiplier: 1.0, weightExp: 0.5 },   // 참다랑어(초대형 — kg^0.5)
  // 302차 — 표에 없던 여섯(사용자 「너무 낮은 가격대인 생선들이 없는지 … 정보를 더 모아보고 반영」). 없으면 `evaluateFishSellPrice`가
  //   「g당 10원」 폴백(kg 10,000 · 등급 · 크기 보정 없음)을 썼다. 품목 코드 1005xx = 볼락류 · 1016xx = 연안 잡어(추정 — 실 시세는 품목명 매핑이 잡는다)
  // 열기(불볼락) — 소매 kg 31,900원(8~9미 · 오아시스) · 도매는 그 6할 남짓
  red_snapper_rockfish: { itemCode: '100507', defaultPricePerKg: 18000, sizeFactorMultiplier: 0.9 },
  // 황볼락 — 국내 시세 자료 없음(추정) · 같은 볼락속 열기와 청볼락(12,000) 사이
  golden_rockfish: { itemCode: '100508', defaultPricePerKg: 15000, sizeFactorMultiplier: 0.9 },
  // 용치놀래기 — 국내 자연산 상 등급 도매 kg 10,526~15,760원(사용자 제공 · 경락 품목 「놀래기 · 용치놀래기」 611801) · 활어 소매 kg 약 3만 원
  rainbow_wrasse: { itemCode: '101601', defaultPricePerKg: 13000, sizeFactorMultiplier: 0.9 },
  // 망상어 — 평년 kg 약 6,700원(2021년 10월 고점 12,000원이 평년보다 78% 높았다 — 광어 · 가자미 대체 수요 보도)
  surfperch: { itemCode: '101602', defaultPricePerKg: 7000, sizeFactorMultiplier: 0.8 },
  // 문절망둑(망둥어) — 국내 생물 시세 자료 없음(추정) · 작아서 마리 값은 바닥(1,000원)이 받친다
  yellowfin_goby: { itemCode: '101603', defaultPricePerKg: 6000, sizeFactorMultiplier: 0.7 },
};

/**
 * 마트(한마음마트/대형마트) 유통 품목 규격 정의
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
 * 한마음마트/대형마트 유통 상품 데이터베이스 (선어 및 기타 농수산물/가공품)
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

// ─────────────────────────────────────────────────────────────
// 위판 (147차) — 판매자 측 계약
//
// ⚠ 위쪽 `AuctionSession`/`placeBid`/`calcPlayerAuctionTotal` 계통은
//   플레이어를 **중매인(사는 쪽)** 으로 모델링한 구매자 측 계약이다
//   (`calcPlayerAuctionTotal` = 낙찰받은 lot의 총 *비용*).
//   위판은 플레이어가 **생산자(파는 쪽)** 이므로 정산 방향이 반대라
//   구매자 측 계약을 고치지 않고 아래 계약을 따로 둔다.
//   가격 형성(`AuctionLot`·NPC 응찰 한도)은 그대로 공유한다.
// ─────────────────────────────────────────────────────────────

/** 위판 로트 — `AuctionLot`(가격 형성)에 출품자 측 메타를 얹는다 */
export interface ConsignmentLot {
  /** 가격 형성 단위 — 구매자 측과 같은 구조를 쓴다 */
  lot: AuctionLot;
  /** 출품 근거가 된 인벤토리 아이템 id (정산 시 소모) */
  sourceItemId: string;
  /** 어획 방법 — 법 판정(`canSell`) 근거 */
  method: CatchMethod;
  /**
   * 출품자가 건 최저 희망가 (원/kg). 낙찰 호가가 이보다 낮으면 **유찰**되어 회수한다.
   * 0이면 제한 없음(부르는 대로 넘긴다).
   */
  reservePerKg: number;
  /** 위판 규격 상자에 담았는지 — 중매인 응찰 한도 보정 */
  crated: boolean;
}

/** 위판 진행 단계 */
export type ConsignmentPhase =
  | 'idle'      // 아직 시작 전
  | 'calling'   // 경매사 호가 진행 중
  | 'hammer'    // 낙찰/유찰 확정 직후 (연출 유예)
  | 'settled';  // 전 로트 종료

/** 위판 회차 — 로트를 순서대로 올려 호가를 붙인다 */
export interface ConsignmentSession {
  sessionId: string;
  category: AuctionCategory;
  lots: ConsignmentLot[];
  /** 현재 호가 중인 로트 인덱스 */
  index: number;
  phase: ConsignmentPhase;
  /** 현재 로트의 호가 경과 (초) */
  callElapsedSec: number;
  /** 다음 응찰 판정까지 남은 시간 (초) */
  tickCooldownSec: number;
  /** 현재 로트에 붙은 응찰 횟수 — 연출·로그용 */
  bidCount: number;
  /** 위판 수수료율 (0~1) — 평판이 정한다 */
  feeRate: number;
}

/** 위판 진행 중 발생한 사건 — 클라이언트가 로그·연출로 소비한다 */
export type ConsignmentEvent =
  | { kind: 'lotOpen'; lotId: string; nameKo: string; startPerKg: number }
  | { kind: 'bid'; lotId: string; perKg: number; bidder: string }
  | { kind: 'sold'; lotId: string; nameKo: string; perKg: number; grossWon: number }
  | { kind: 'unsold'; lotId: string; nameKo: string; reservePerKg: number; bestPerKg: number }
  | { kind: 'sessionEnd' };

/** 로트별 정산 행 */
export interface ConsignmentLotResult {
  lotId: string;
  /** 출품 근거가 된 인벤토리 아이템 id — 낙찰이면 소모, 유찰이면 그대로 둔다 */
  sourceItemId: string;
  nameKo: string;
  /** 295차 — 원산지(얻은 지역 · 특산이면 「○○ 특산」) */
  origin: string;
  weightKg: number;
  /** 낙찰 단가 (원/kg) — 유찰이면 마지막 호가 */
  hammerPerKg: number;
  /** 낙찰 총액 (원) — 유찰이면 0 */
  grossWon: number;
  status: AuctionLotStatus;
  /** 유찰되어 되돌려받을 아이템 id */
  returnedItemId?: string;
}

/** 위판 정산 결과 */
export interface ConsignmentSettlement {
  /** 낙찰 총액 합계 (수수료 전) */
  grossWon: number;
  /** 위판 수수료 */
  feeWon: number;
  /** 실수령액 */
  netWon: number;
  soldLots: number;
  unsoldLots: number;
  perLot: ConsignmentLotResult[];
}
