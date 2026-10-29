/**
 * @file HomeCure.ts
 * @description 285차 — 갈무리: 텃밭 설비 「건조 걸대」에 걸어 말리고 「장독」에 담가 삭힌다(사용자 지시 — 284차 「뒤로 미룬 것」 2 · 3번).
 *
 * 사용자 말(원문): 「미룬 가공: 시래기 말리기, 생기름(볶지 않은 기름), 압맥(누른 보리) 셋 다 레퍼런스 찾아서 가공 반영하기 ·
 *  미룬 부산물: 옥수수수염차, 콩잎, 깻잎 장아찌, 받은 씨앗 다시 심기, 딸기 런너 — 다 반영하기」.
 *  생기름 · 압맥은 방앗간(`rules/OilMill.ts`), 받은 씨앗 · 런너는 텃밭(`simulation/FarmSim.ts`)이 맡는다. 여기는 말리기 · 삭히기.
 *
 * 레퍼런스(2026-10-29 조사 — 기간은 실제 시간이고 실제보다 줄였다):
 *  - 시래기: 무청을 10~12월에 거둬 직사광선을 피해 바람 잘 드는 곳에 걸면 겨울 동안 얼었다 녹았다 하며 마른다(농촌진흥청 웹진 2022-02).
 *    소금물에 살짝 데쳐 말리면 비타민 손실이 적다 · 오래 데치면 물러져 말리기 어렵다(레시피 모음) → 엮어 걸기 6일 · 데쳐 말리기 3일.
 *  - 옥수수수염차: 씻어 체반에 펼쳐 바람에 약 이틀 말린 뒤 약불에 6~7분 덖는다(레시피) → 2일. 생수염 50g → 덖은 한 봉 10g(수분 약 80%).
 *  - 깻잎 장아찌: 100장(두 묶음 남짓 — 여기서는 20장 묶음 다섯)에 간장 · 물 · 식초 · 설탕을 끓여 붓고 하룻밤 뒤 간장물을 다시 끓여 부어
 *    2주 냉장(레시피) → 7일. 진간장 4큰술은 게임 속 「진간장 1큰술」 아이템으로 셈한다.
 *  - 콩잎 장아찌(경상도 단풍콩잎): 누렇게 든 콩잎을 묶어 진한 소금물에 20~30일 삭혀 우려낸 뒤 양념에 재운다(매일신문 · 레시피) → 14일.
 *
 * 순수 계산만 한다 — 걸어 둔 것 · 담근 것 대기열(세이브)과 창은 클라이언트(`CureQueue` · `CurePanel`).
 */

import { FOOD_NUTRITION, type FoodNutrition } from '../db-schema/FoodNutrition.js';

/** 갈무리 자리 — 걸대(말리기) · 장독(삭히기) */
export type CureStation = 'rack' | 'crock';

/** 자리 → 텃밭 설비(`FarmFacility`) */
export const CURE_STATION_FACILITY: Record<CureStation, 'dryingRack' | 'crock'> = { rack: 'dryingRack', crock: 'crock' };

export const CURE_STATION_LABEL: Record<CureStation, { ko: string; en: string }> = {
  rack: { ko: '건조 걸대', en: 'Drying rack' },
  crock: { ko: '장독', en: 'Crock' },
};

export const CURE_TUNING = {
  /** 설비 하나에 한 번에 걸 · 담글 수 있는 거리(걸대 여섯 줄 · 장독 넷 — 장독 하나에 한 통씩이 아니라 칸 수) */
  slots: { rack: 6, crock: 4 } as Record<CureStation, number>,
};

/** 갈무리에 드는 것 하나 — 작물 수확물은 등급 꼬리를 가리지 않는다(낮은 등급부터 쓴다) */
export interface CureInputDef {
  /** 아이템 기본 id(등급 꼬리 없이) */
  itemId: string;
  /** 단위 수(무게 수확물은 g) */
  qty: number;
  nameKo: string;
  nameEn: string;
}

export interface CureRecipeDef {
  id: string;
  nameKo: string;
  nameEn: string;
  station: CureStation;
  /** 첫째가 주재료 */
  inputs: CureInputDef[];
  output: { itemId: string; qty: number };
  /** 다 될 때까지(실제 시간 · 시간) */
  hours: number;
  howKo: string;
  howEn: string;
}

export const CURE_RECIPES: readonly CureRecipeDef[] = [
  {
    id: 'siraegi_hang', nameKo: '무청 엮어 걸기', nameEn: 'String up radish greens', station: 'rack',
    inputs: [{ itemId: 'crop_radish_greens', qty: 1, nameKo: '무청', nameEn: 'Radish greens' }],
    output: { itemId: 'cure_siraegi', qty: 1 }, hours: 6 * 24,
    howKo: '무청을 새끼줄에 엮어 그늘진 걸대에 건다 — 바람에 얼었다 녹았다 하며 엿새면 바싹 마른다. 볕을 보면 누렇게 바랜다.',
    howEn: 'The radish greens are braided onto straw rope and hung in the shade — freezing and thawing in the wind, they are bone-dry in six days. Sun bleaches them yellow.',
  },
  {
    id: 'siraegi_blanch', nameKo: '무청 데쳐 말리기', nameEn: 'Blanch and dry radish greens', station: 'rack',
    inputs: [
      { itemId: 'crop_radish_greens', qty: 1, nameKo: '무청', nameEn: 'Radish greens' },
      { itemId: 'cook_salt', qty: 1, nameKo: '소금 (1큰술)', nameEn: 'Salt (1 tbsp)' },
    ],
    output: { itemId: 'cure_siraegi', qty: 1 }, hours: 3 * 24,
    howKo: '소금물에 살짝 데쳐 널면 사흘이면 마르고 빛깔이 푸르게 산다 — 오래 데치면 물러져 마르지 않는다.',
    howEn: 'Blanched briefly in salted water and hung, they dry in three days and keep their green — blanch too long and they go soft and never dry.',
  },
  {
    id: 'corn_silk_tea', nameKo: '옥수수수염 말려 덖기', nameEn: 'Dry and toast corn silk', station: 'rack',
    inputs: [{ itemId: 'crop_corn_silk', qty: 50, nameKo: '옥수수수염 (50g)', nameEn: 'Corn silk (50g)' }],
    output: { itemId: 'cure_corn_silk_tea', qty: 1 }, hours: 2 * 24,
    howKo: '씻어 체반에 펼쳐 바람에 이틀 말린 뒤 약불에 덖는다 — 생수염 50g이 덖고 나면 한 봉(10g)이 된다.',
    howEn: 'Washed, spread on a sieve and air-dried for two days, then toasted on low heat — 50g of fresh silk becomes one 10g pack.',
  },
  {
    id: 'pickle_perilla', nameKo: '깻잎 장아찌 담그기', nameEn: 'Pickle perilla leaves', station: 'crock',
    inputs: [
      { itemId: 'crop_perilla', qty: 5, nameKo: '깻잎 다섯 묶음 (100장)', nameEn: 'Perilla leaves, five bundles (100 leaves)' },
      { itemId: 'cook_soy_dark', qty: 4, nameKo: '진간장 (4큰술)', nameEn: 'Soy sauce (4 tbsp)' },
    ],
    output: { itemId: 'cure_pickle_perilla', qty: 10 }, hours: 7 * 24,
    howKo: '깻잎을 켜켜이 담고 진간장 · 물 · 식초 · 설탕을 끓여 붓는다 — 하룻밤 뒤 간장물을 다시 끓여 붓고 한 주를 삭힌다.',
    howEn: 'The leaves are layered in and boiled soy, water, vinegar and sugar poured over — the next day the brine is boiled again and returned, then left a week.',
  },
  {
    id: 'pickle_bean_leaf', nameKo: '콩잎 장아찌 담그기', nameEn: 'Pickle soybean leaves', station: 'crock',
    inputs: [
      { itemId: 'crop_bean_leaf', qty: 2, nameKo: '단풍콩잎 두 묶음', nameEn: 'Yellowed soybean leaves, two bundles' },
      { itemId: 'cook_salt', qty: 3, nameKo: '소금 (3큰술)', nameEn: 'Salt (3 tbsp)' },
    ],
    output: { itemId: 'cure_pickle_bean_leaf', qty: 4 }, hours: 14 * 24,
    howKo: '단풍 든 콩잎을 묶어 진한 소금물에 두 주 삭힌다(경상도에서는 스무 날 넘게) — 노랗게 삭으면 우려내 양념에 재운다.',
    howEn: 'The yellow leaves are tied in bunches and cured in strong brine for two weeks (in Gyeongsang, often longer) — once they turn soft and golden they are soaked out and dressed.',
  },
];

export function cureRecipe(id: string): CureRecipeDef | undefined {
  return CURE_RECIPES.find((r) => r.id === id);
}

/** 이 자리에서 하는 갈무리 */
export function cureRecipesAt(station: CureStation): CureRecipeDef[] {
  return CURE_RECIPES.filter((r) => r.station === station);
}

/** 다 되는 시각(ms) */
export function cureReadyAt(startMs: number, r: Pick<CureRecipeDef, 'hours'>): number {
  return startMs + r.hours * 3_600_000;
}

/** 남은 시간 한 줄 — 「2일 4시간」 · 「3시간」 · 「다 됐다」 */
export function cureLeftKo(readyAtMs: number, nowMs: number): string {
  const ms = readyAtMs - nowMs;
  if (ms <= 0) return '다 됐다';
  const h = Math.ceil(ms / 3_600_000);
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}일${h % 24 ? ` ${h % 24}시간` : ''}` : `${h}시간`;
}
export function cureLeftEn(readyAtMs: number, nowMs: number): string {
  const ms = readyAtMs - nowMs;
  if (ms <= 0) return 'ready';
  const h = Math.ceil(ms / 3_600_000);
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d${h % 24 ? ` ${h % 24}h` : ''}` : `${h}h`;
}

// ─────────────────────────────────────────────
// 갈무리해 나온 것(가방 아이템)
// ─────────────────────────────────────────────

export interface CureItemDef {
  id: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  /** 기준값(원) — 직판장 · 마트가 이 값 근처로 산다 */
  basePrice: number;
  /** 요리 재료(물에 불려 쓴다) */
  cookIngredient?: string;
  /** 먹기 · 마시기(영양 — 허기 · 수분은 여기서 나온다) */
  eat?: FoodNutrition;
  /** 마시는 것인가(「마시기」 단추) */
  drink?: boolean;
  /** 피로 회복(따뜻한 차) */
  fatigueRestore?: number;
}

/**
 * 갈무리해 나온 것 — 말려서 · 삭혀서 오래 둔다(신선도가 줄지 않는다).
 * 값: 말린 시래기 100g 4~5천 원 → 한 타래(약 30g) 1,500원 · 옥수수수염차 10g 한 봉 약 1,000원(티백 묶음 환산 · 손으로 덖은 것 덤) ·
 * 깻잎 장아찌 10장 1,500원 · 콩잎 장아찌 10장 2,000원(지역 반찬 — 귀하다).
 */
export const CURE_ITEMS: readonly CureItemDef[] = [
  {
    id: 'cure_siraegi', nameKo: '말린 시래기 (한 타래)', nameEn: 'Dried siraegi (a coil)', basePrice: 1500, cookIngredient: 'siraegi',
    descKo: '바싹 마른 무청 한 타래. 하룻밤 물에 불려 삶으면 다시 시래기가 된다 — 된장국 · 생선 조림 밑 · 나물 볶음.',
    descEn: 'A coil of bone-dry radish greens. Soaked overnight and boiled, it is siraegi again — for doenjang soup, under braised fish, or stir-fried.',
  },
  {
    id: 'cure_corn_silk_tea', nameKo: '옥수수수염차 (10g 한 봉)', nameEn: 'Corn silk tea (one 10g pack)', basePrice: 1000, drink: true, fatigueRestore: 5,
    eat: { g: 500, kcal: 5, ml: 500 },
    descKo: '덖은 옥수수수염 한 봉. 물 500ml에 우리면 구수하고 은은하게 단 차가 된다.',
    descEn: 'A pack of toasted corn silk. Steeped in 500ml of water it makes a nutty, faintly sweet tea.',
  },
  {
    id: 'cure_pickle_perilla', nameKo: '깻잎 장아찌 (10장)', nameEn: 'Pickled perilla leaves (10 leaves)', basePrice: 1500,
    eat: { g: 40, kcal: 30, ml: 0 },
    descKo: '간장물에 삭힌 깻잎 열 장. 밥 한 숟갈에 한 장씩 — 짭짤하고 향이 짙다.',
    descEn: 'Ten perilla leaves cured in soy brine. One leaf per spoonful of rice — salty and deeply fragrant.',
  },
  {
    id: 'cure_pickle_bean_leaf', nameKo: '콩잎 장아찌 (10장)', nameEn: 'Pickled soybean leaves (10 leaves)', basePrice: 2000,
    eat: { g: 40, kcal: 25, ml: 0 },
    descKo: '소금물에 삭혀 우려낸 뒤 양념에 재운 단풍콩잎 열 장. 경상도 밥상의 그 반찬 — 쌈처럼 밥을 싸 먹는다.',
    descEn: 'Ten yellowed bean leaves, brine-cured, soaked out and dressed. The Gyeongsang table staple — wrap rice in them.',
  },
];

for (const c of CURE_ITEMS) if (c.eat && !FOOD_NUTRITION[c.id]) FOOD_NUTRITION[c.id] = c.eat;

export function cureItem(id: string): CureItemDef | undefined {
  return CURE_ITEMS.find((c) => c.id === id);
}
