/**
 * @file ShopCatalog.ts
 * @description 건물(상점) 종류별 판매/매입 카탈로그
 *
 * 건물 카테고리: 편의점 / 식자재마트 / 직판장 / 음식점 / 카페 / 주점.
 * 각 건물은 판매 품목(sells)과 매입 카테고리(buysCategories)가 다르다.
 * 상점 아이템은 재화로 구매하지 않는 한 인벤토리로 옮길 수 없다 (RPG 표준 구조).
 * 가격/품목은 목업 — 추후 @tra/core UniversalItemDatabase + API 연동으로 교체.
 */

import type { InvCategory, InvItemTemplate } from '../store/InventoryStore.js';

/** 건물(상점) 종류 */
export type BuildingKind = 'convenience' | 'mart' | 'market' | 'restaurant' | 'cafe' | 'pub';

export const BUILDING_LABEL: Record<BuildingKind, string> = {
  convenience: '편의점',
  mart: '식자재마트',
  market: '직판장',
  restaurant: '음식점',
  cafe: '카페',
  pub: '주점',
};

/** 상점 판매 품목 (인벤토리 템플릿 + 가격/구매 한도) */
export interface ShopEntry extends InvItemTemplate {
  price: number;
  /** 1회 구매 최대 수량 (1이면 단건 확인만) */
  maxPerPurchase: number;
  desc: string;
}

export interface ShopDef {
  kind: BuildingKind;
  name: string;
  greeting: string;
  sells: ShopEntry[];
  /** 매입 대상 카테고리 (비어 있으면 매입 안 함) */
  buysCategories: InvCategory[];
}

export const SHOP_CATALOG: Record<BuildingKind, ShopDef> = {
  convenience: {
    kind: 'convenience',
    name: '항구 편의점',
    greeting: '24시간 영업합니다. 필요한 것 있으세요?',
    buysCategories: [],
    sells: [
      { id: 'inv_can',      name: '참치 통조림',   icon: '🥫', category: 'food',       subCategory: '가공품',   basePrice: 2000, price: 2500, maxPerPurchase: 10, equippable: false, desc: '보존성 좋은 비상 식량.' },
      { id: 'inv_potion',   name: 'HP 회복 드링크', icon: '💊', category: 'consumable', subCategory: '의약품',   basePrice: 5000, price: 6000, maxPerPurchase: 5,  equippable: false, desc: 'HP를 40 회복한다.' },
      { id: 'inv_mosquito', name: '모기향',         icon: '🌀', category: 'consumable', subCategory: '야간 대비', basePrice: 2500, price: 3000, maxPerPurchase: 10, equippable: false, desc: '야간 낚시 모기 디버프 방지.' },
      { id: 'inv_seasick',  name: '멀미약',         icon: '💊', category: 'consumable', subCategory: '의약품',   basePrice: 4000, price: 5000, maxPerPurchase: 5,  equippable: false, desc: '선상 낚시 멀미 내성 10분.' },
      { id: 'shop_snackbar', name: '초코바',        icon: '🥫', category: 'food',       subCategory: '가공품',   basePrice: 1200, price: 1500, maxPerPurchase: 10, equippable: false, desc: '간단한 요기. 피로도 -5.' },
    ],
  },
  mart: {
    kind: 'mart',
    name: '식자재마트',
    greeting: '식자재는 저희가 제일 쌉니다.',
    buysCategories: ['food'],
    sells: [
      { id: 'inv_veges',    name: '식자재 묶음 (대파/양파)', icon: '🥬', category: 'food',       subCategory: '식자재',     basePrice: 5000, price: 6000, maxPerPurchase: 10, condition: 'fresh', equippable: false, desc: '요리 기본 재료 묶음.' },
      { id: 'shop_rice',    name: '쌀 1kg',                  icon: '🥬', category: 'food',       subCategory: '식자재',     basePrice: 4000, price: 4800, maxPerPurchase: 10, equippable: false, desc: '요리 주재료.' },
      { id: 'shop_sauce',   name: '양념 세트',               icon: '🥬', category: 'food',       subCategory: '식자재',     basePrice: 7000, price: 8500, maxPerPurchase: 5,  equippable: false, desc: '요리 풍미를 올려주는 양념.' },
      { id: 'inv_chum',     name: '집어제 (크릴 배합)',      icon: '🧂', category: 'consumable', subCategory: '집어제/밑밥', basePrice: 6000, price: 7000, maxPerPurchase: 10, equippable: false, desc: '어군 활성도 상승.' },
      { id: 'inv_breadbait', name: '빵가루 경단',            icon: '🍞', category: 'tackle',     subCategory: '반죽미끼',    basePrice: 3000, price: 3500, maxPerPurchase: 10, equippable: false, desc: '벵에돔·숭어용 반죽 미끼 — 잡어 성화를 피한다.' },
      { id: 'inv_can',      name: '참치 통조림 (묶음)',      icon: '🥫', category: 'food',       subCategory: '가공품',     basePrice: 2000, price: 2200, maxPerPurchase: 20, equippable: false, desc: '마트 대용량 특가.' },
    ],
  },
  market: {
    kind: 'market',
    name: '수산물 직판장',
    greeting: '오늘 새벽에 들어온 물건입니다. 잡으신 고기도 매입해요.',
    buysCategories: ['food'],
    sells: [
      { id: 'shop_flatfish', name: '광어 (활어)',   icon: '🐟', category: 'food',   subCategory: '어획물',   basePrice: 25000, price: 30000, maxPerPurchase: 3,  condition: 'live',   equippable: false, desc: '수조 직송 활어.' },
      { id: 'shop_squid',    name: '오징어 (선어)', icon: '🐟', category: 'food',   subCategory: '어획물',   basePrice: 8000,  price: 10000, maxPerPurchase: 5,  condition: 'chilled', equippable: false, desc: '당일 조업 선어.' },
      { id: 'inv_krill',     name: '크릴 (냉동)',   icon: '🦐', category: 'tackle', subCategory: '냉동미끼', basePrice: 4000,  price: 4500,  maxPerPurchase: 10, condition: 'frozen', equippable: false, desc: '범용 냉동 미끼.' },
      { id: 'inv_fishcut',   name: '생선 조각 미끼', icon: '🦐', category: 'tackle', subCategory: '선어미끼', basePrice: 3000,  price: 3500,  maxPerPurchase: 10, condition: 'chilled', equippable: false, desc: '갈치/우럭용 절단 미끼.' },
    ],
  },
  restaurant: {
    kind: 'restaurant',
    name: '항구 식당',
    greeting: '갓 지은 밥이 있어요. 드시고 가세요.',
    buysCategories: ['food'],
    sells: [
      { id: 'shop_meal_grilled', name: '생선구이 정식', icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 9000,  price: 11000, maxPerPurchase: 3, equippable: false, desc: 'HP +30, 피로도 -20.' },
      { id: 'shop_meal_soup',    name: '매운탕',        icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 10000, price: 12000, maxPerPurchase: 3, equippable: false, desc: '체온 유지 버프 (야간 유용).' },
      // 회(사시미) 카테고리 — 아이콘은 모듬회 픽셀 이미지로 통일 (추후 어종별 이미지 분리 예정)
      // 네이밍 규칙: {어종}_sashimi_{중량} / 한글: {어종} 회 ({소/중/대})
      { id: 'shop_assorted_sashimi_small', name: '모듬회 (소)', icon: '🐟', iconTexture: 'food_assorted_sashimi', category: 'food', subCategory: '회(사시미)', basePrice: 20000, price: 25000, maxPerPurchase: 2, equippable: false, desc: 'assorted sashimi (small) — 고신선도 회, 근력 1.2배 10분.' },
      { id: 'shop_black_sea_bream_sashimi_small', name: '감성돔 회 (소)', icon: '🐟', iconTexture: 'food_assorted_sashimi', category: 'food', subCategory: '회(사시미)', basePrice: 28000, price: 34000, maxPerPurchase: 2, equippable: false, desc: 'black sea bream sashimi (small) — 쫄깃한 단일 어종 회, 근력 1.3배 10분.' },
    ],
  },
  cafe: {
    kind: 'cafe',
    name: '방파제 카페',
    greeting: '따뜻한 커피 어떠세요?',
    buysCategories: [],
    sells: [
      { id: 'shop_coffee',  name: '아메리카노',  icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 3500, price: 4000, maxPerPurchase: 5, equippable: false, desc: '피로도 -15.' },
      { id: 'shop_latte',   name: '카페라떼',    icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 4200, price: 4800, maxPerPurchase: 5, equippable: false, desc: '피로도 -12, HP +5.' },
      { id: 'shop_dessert', name: '수제 디저트', icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 5500, price: 6500, maxPerPurchase: 5, equippable: false, desc: '집중력 버프 (입질 표시 강화) 5분.' },
    ],
  },
  pub: {
    kind: 'pub',
    name: '포구 주점',
    greeting: '조황 얘기나 하면서 한잔 하시죠.',
    buysCategories: [],
    sells: [
      { id: 'shop_makgeolli', name: '막걸리',      icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 4000, price: 5000, maxPerPurchase: 5, equippable: false, desc: '피로도 -20, 단 조준 흔들림 +10% (5분).' },
      { id: 'shop_anju',      name: '해물 안주',   icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 12000, price: 15000, maxPerPurchase: 3, equippable: false, desc: 'HP +20, 체온 유지.' },
      { id: 'shop_soju',      name: '소주',        icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 3000, price: 4000, maxPerPurchase: 5, equippable: false, desc: '추위 내성 +, 평형감각 - (5분).' },
    ],
  },
};

/** 건물 배치용 종류 순환 배열 (POI 인덱스 → 건물 종류) */
export const BUILDING_KIND_CYCLE: BuildingKind[] = [
  'restaurant', 'convenience', 'cafe', 'mart', 'market', 'pub',
];
