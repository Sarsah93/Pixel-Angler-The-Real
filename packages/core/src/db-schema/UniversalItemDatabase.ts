/**
 * @file UniversalItemDatabase.ts
 * @description 통합 아이템 데이터베이스 — 낚시 미끼 / 식재료 / 직판장 활어·선어
 *
 * 구매처별 구분:
 *  - tackle_shop  : 낚시용품점 전용 재료 (요리 불가)
 *  - hanaro_mart  : 하나로마트 식재료 (낚시용 1회 변환 가능)
 *  - fish_market  : 직판장 활어·선어 (dual: 요리+미끼 모두 가능)
 *  - dual can     : 통조림 등 예외 품목 (낚시점·마트 공통, 양쪽 모두 가능)
 */

import type {
  UniversalItem,
} from '../types/Item.js';

// ─────────────────────────────────────────────────────────────
// 낚시용품점 전용 아이템 (fishing_gear_only)
// ─────────────────────────────────────────────────────────────

const TACKLE_SHOP_ITEMS: UniversalItem[] = [
  {
    id: 'tackle_krill_frozen',
    nameKo: '냉동 크릴 (각크릴)',
    availableAt: ['tackle_shop'],
    buyPriceByVendor: { tackle_shop: 3000 },
    sellPriceByVendor: {},
    initialCondition: 'frozen',
    initialPurpose: 'fishing_gear_only',
    baitCategory: 'krill_frozen',
    cookingIngredientId: undefined,
    stackable: true,
    conversionRule: {
      canConvertToBait: false,
      canConvertToCooking: false,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    decayRule: {
      thawMinutes: 15,                    // 쿨러 밖 15분 → 선어(fresh)로 해동
      spoilMinutesOutsideCooler: 60,      // 해동 후 상온 60분 → 부패
      spoilMinutesInCooler: 480,          // 쿨러 안 8시간 → 부패
    },
  },
  {
    id: 'tackle_ground_bait_dry',
    nameKo: '건식 집어제 (빵가루형)',
    availableAt: ['tackle_shop'],
    buyPriceByVendor: { tackle_shop: 5000 },
    sellPriceByVendor: {},
    initialCondition: 'dried',
    initialPurpose: 'fishing_gear_only',
    baitCategory: 'dry_ground_bait',
    cookingIngredientId: undefined,
    stackable: true,
    conversionRule: {
      canConvertToBait: false,
      canConvertToCooking: false,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    // decayRule 없음: 건식이라 부패 없음
  },
  {
    id: 'tackle_ground_bait_wet',
    nameKo: '습식 집어제',
    availableAt: ['tackle_shop'],
    buyPriceByVendor: { tackle_shop: 6000 },
    sellPriceByVendor: {},
    initialCondition: 'processed',
    initialPurpose: 'fishing_gear_only',
    baitCategory: 'wet_ground_bait',
    cookingIngredientId: undefined,
    stackable: true,
    conversionRule: {
      canConvertToBait: false,
      canConvertToCooking: false,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    decayRule: {
      spoilMinutesOutsideCooler: 180,    // 상온 3시간 → 사용 불가 (냄새 변질)
      spoilMinutesInCooler: 720,
    },
  },
  {
    id: 'tackle_barley_pressed',
    nameKo: '보리 압맥 (낚시점)',
    availableAt: ['tackle_shop'],
    buyPriceByVendor: { tackle_shop: 3500 },
    sellPriceByVendor: {},
    initialCondition: 'dried',
    initialPurpose: 'fishing_gear_only',
    baitCategory: 'boiled_barley',
    cookingIngredientId: undefined,
    stackable: true,
    conversionRule: {
      canConvertToBait: false,
      canConvertToCooking: false,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    // decayRule 없음
  },
  {
    id: 'tackle_liquid_attractant',
    nameKo: '생물 내장 액기스',
    availableAt: ['tackle_shop'],
    buyPriceByVendor: { tackle_shop: 8000 },
    sellPriceByVendor: {},
    initialCondition: 'processed',
    initialPurpose: 'fishing_gear_only',
    baitCategory: 'organic_liquid_attractant',
    cookingIngredientId: undefined,
    stackable: false,
    conversionRule: {
      canConvertToBait: false,
      canConvertToCooking: false,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    decayRule: {
      spoilMinutesOutsideCooler: 360,
      spoilMinutesInCooler: 1440,
    },
  },
  {
    id: 'tackle_crab_live',
    nameKo: '돌게 (활어 미끼)',
    availableAt: ['tackle_shop'],
    buyPriceByVendor: { tackle_shop: 5000 },
    sellPriceByVendor: {},
    initialCondition: 'live',
    initialPurpose: 'fishing_gear_only',
    baitCategory: 'crab',
    cookingIngredientId: undefined,
    stackable: false,
    conversionRule: {
      canConvertToBait: false,
      canConvertToCooking: false,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    decayRule: {
      liveToFreshMinutes: 60,              // 1시간 후 선어로 전이
      spoilMinutesOutsideCooler: 30,       // 선어 후 30분 → 부패
      spoilMinutesInCooler: 120,
    },
  },
  {
    id: 'tackle_squid_chilled',
    nameKo: '생물 오징어 조각 (낚시점 선어)',
    availableAt: ['tackle_shop'],
    buyPriceByVendor: { tackle_shop: 4000 },
    sellPriceByVendor: {},
    initialCondition: 'fresh',
    initialPurpose: 'fishing_gear_only',
    baitCategory: 'chilled_fish_strip',
    cookingIngredientId: undefined,
    stackable: true,
    conversionRule: {
      canConvertToBait: false,
      canConvertToCooking: false,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    decayRule: {
      spoilMinutesOutsideCooler: 90,
      spoilMinutesInCooler: 360,
    },
  },
];

// ─────────────────────────────────────────────────────────────
// 하나로마트/편의점 식재료 (cooking_convertible_to_bait)
// ─────────────────────────────────────────────────────────────

const MART_ITEMS: UniversalItem[] = [
  {
    id: 'mart_breadcrumb',
    nameKo: '빵가루 (하나로마트)',
    availableAt: ['hanaro_mart'],
    buyPriceByVendor: { hanaro_mart: 3000 },
    sellPriceByVendor: { hanaro_mart: 500 },
    initialCondition: 'dried',
    initialPurpose: 'cooking_convertible_to_bait',
    baitCategory: 'dry_ground_bait',
    cookingIngredientId: 'breadcrumb',
    stackable: true,
    conversionRule: {
      canConvertToBait: true,
      canConvertToCooking: true,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    // 건식이라 부패 없음
  },
  {
    id: 'mart_barley_pressed',
    nameKo: '보리 압맥 (마트)',
    availableAt: ['hanaro_mart'],
    buyPriceByVendor: { hanaro_mart: 3000 },
    sellPriceByVendor: { hanaro_mart: 500 },
    initialCondition: 'dried',
    initialPurpose: 'cooking_convertible_to_bait',
    baitCategory: 'boiled_barley',
    cookingIngredientId: 'barley',
    stackable: true,
    conversionRule: {
      canConvertToBait: true,
      canConvertToCooking: true,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
  },
  {
    id: 'mart_squid_chilled',
    nameKo: '생 오징어 (마트 선어)',
    availableAt: ['hanaro_mart'],
    buyPriceByVendor: { hanaro_mart: 7000 },
    sellPriceByVendor: { hanaro_mart: 3000 },
    initialCondition: 'chilled',
    initialPurpose: 'cooking_convertible_to_bait',
    baitCategory: 'chilled_fish_strip',
    cookingIngredientId: 'squid_raw',
    stackable: false,
    conversionRule: {
      canConvertToBait: true,
      canConvertToCooking: true,
      irreversible: true,
      resultPurposeAfterBaitConvert: 'fishing_gear_only',
    },
    decayRule: {
      spoilMinutesOutsideCooler: 120,
      spoilMinutesInCooler: 600,
    },
  },
];

// ─────────────────────────────────────────────────────────────
// 통조림 — dual (낚시점·마트 공통, 양쪽 모두 가능)
// ─────────────────────────────────────────────────────────────

const CAN_ITEMS: UniversalItem[] = [
  {
    id: 'can_corn',
    nameKo: '옥수수 통조림',
    availableAt: ['tackle_shop', 'hanaro_mart', 'convenience'],
    buyPriceByVendor: {
      tackle_shop: 2500,
      hanaro_mart: 2000,
      convenience: 2800,
    },
    sellPriceByVendor: {
      hanaro_mart: 500,
    },
    initialCondition: 'processed',
    initialPurpose: 'dual',
    baitCategory: 'corn',
    cookingIngredientId: 'corn_cooked',
    stackable: true,
    conversionRule: {
      canConvertToBait: true,
      canConvertToCooking: true,
      irreversible: false,  // 통조림은 개봉 전까지 상태 유지 (예외)
      resultPurposeAfterBaitConvert: 'dual',
    },
    // 통조림: 개봉 전엔 부패 없음. 개봉 후 처리는 추후 CookScene에서 별도 관리.
  },
];

// ─────────────────────────────────────────────────────────────
// 직판장 (fish_market) 활어·선어 — dual
// ─────────────────────────────────────────────────────────────

const FISH_MARKET_ITEMS: UniversalItem[] = [
  {
    id: 'market_horse_mackerel_live',
    nameKo: '생 전갱이 (활어, 직판장)',
    availableAt: ['fish_market'],
    buyPriceByVendor: { fish_market: 6000 },
    sellPriceByVendor: { fish_market: 4000 },
    initialCondition: 'live',
    initialPurpose: 'dual',
    baitCategory: 'live_fish',
    cookingIngredientId: 'horse_mackerel_raw',
    stackable: false,
    conversionRule: {
      canConvertToBait: true,
      canConvertToCooking: true,
      irreversible: false,   // dual → 소비 시점에 목적 결정
      resultPurposeAfterBaitConvert: 'dual',
    },
    decayRule: {
      liveToFreshMinutes: 45,            // 45분 후 선어 전이
      spoilMinutesOutsideCooler: 60,     // 선어 후 상온 60분 → 부패
      spoilMinutesInCooler: 360,
    },
  },
  {
    id: 'market_mackerel_fresh',
    nameKo: '생 고등어 (선어, 직판장)',
    availableAt: ['fish_market'],
    buyPriceByVendor: { fish_market: 5000 },
    sellPriceByVendor: { fish_market: 3000 },
    initialCondition: 'fresh',
    initialPurpose: 'dual',
    baitCategory: 'live_fish',
    cookingIngredientId: 'mackerel_raw',
    stackable: false,
    conversionRule: {
      canConvertToBait: true,
      canConvertToCooking: true,
      irreversible: false,
      resultPurposeAfterBaitConvert: 'dual',
    },
    decayRule: {
      spoilMinutesOutsideCooler: 60,
      spoilMinutesInCooler: 300,
    },
  },
  {
    id: 'market_goby_live',
    nameKo: '생 망둑어 (활어, 직판장)',
    availableAt: ['fish_market'],
    buyPriceByVendor: { fish_market: 4000 },
    sellPriceByVendor: { fish_market: 2500 },
    initialCondition: 'live',
    initialPurpose: 'dual',
    baitCategory: 'live_fish',
    cookingIngredientId: 'goby_raw',
    stackable: false,
    conversionRule: {
      canConvertToBait: true,
      canConvertToCooking: true,
      irreversible: false,
      resultPurposeAfterBaitConvert: 'dual',
    },
    decayRule: {
      liveToFreshMinutes: 30,
      spoilMinutesOutsideCooler: 45,
      spoilMinutesInCooler: 240,
    },
  },
];

// ─────────────────────────────────────────────────────────────
// 통합 DB 내보내기
// ─────────────────────────────────────────────────────────────

export const UNIVERSAL_ITEM_DATABASE: UniversalItem[] = [
  ...TACKLE_SHOP_ITEMS,
  ...MART_ITEMS,
  ...CAN_ITEMS,
  ...FISH_MARKET_ITEMS,
];

/** ID로 아이템 조회 */
export function getUniversalItemById(id: string): UniversalItem | undefined {
  return UNIVERSAL_ITEM_DATABASE.find((item) => item.id === id);
}

/** 특정 구매처에서 구매 가능한 아이템 목록 조회 */
export function getItemsByVendor(vendor: import('../types/Item.js').ItemSourceVendor): UniversalItem[] {
  return UNIVERSAL_ITEM_DATABASE.filter((item) => item.availableAt.includes(vendor));
}

/** 낚시 미끼로 사용 가능한 아이템 목록 조회 */
export function getBaitableItems(): UniversalItem[] {
  return UNIVERSAL_ITEM_DATABASE.filter((item) => item.baitCategory !== undefined);
}

/** 요리 재료로 사용 가능한 아이템 목록 조회 */
export function getCookingItems(): UniversalItem[] {
  return UNIVERSAL_ITEM_DATABASE.filter((item) => item.cookingIngredientId !== undefined);
}
