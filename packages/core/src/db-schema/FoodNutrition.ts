/**
 * @file FoodNutrition.ts
 * @description 음식의 **실질량·열량·수분** 표 (155차 — 사용자 지시).
 *
 * 허기·수분 회복치를 손으로 적던 방식을 버리고, **하루 필요량 대비 비율**로 산출한다.
 *  - 허기 회복 % = kcal ÷ 2,400 kcal(성인 하루) × 100 → 정식 한 끼(≈800 kcal) = 33% = 하루 세 끼.
 *  - 수분 회복 % = 유효 수분 ml ÷ 2,000 ml × 100 → 생수 500 ml = 25%.
 *    술·카페인은 이뇨로 **유효 수분**이 실제 부피보다 적거나 음수다(`mlNet`이 표기된 값을 쓴다).
 *  `TUNING.vitals` 드레인은 같은 기준으로 재보정됐다(전형적 하루 = 허기 ≈105 · 수분 ≈134 → 세 끼 + 물 2~3병).
 *
 * 값은 식품영양 성분표의 통상치(추정 표기 없이 대표값). 아이템 id → 영양. 요리는 레시피 id(1인분).
 */

export interface FoodNutrition {
  /** 실질량 (g) */
  g: number;
  /** 열량 (kcal) */
  kcal: number;
  /** 부피 수분 (ml) */
  ml: number;
  /** 유효 수분 (ml) — 술·카페인의 이뇨 반영. 없으면 ml */
  mlNet?: number;
}

export const DAILY_KCAL = 2400;
export const DAILY_WATER_ML = 2000;

export const FOOD_NUTRITION: Record<string, FoodNutrition> = {
  // ── 편의점·마트 가공품 ──
  inv_can:        { g: 150, kcal: 250, ml: 30 },
  shop_snackbar:  { g: 40, kcal: 200, ml: 0, mlNet: -20 },
  shop_water:     { g: 500, kcal: 0, ml: 500 },
  shop_riceball:  { g: 120, kcal: 210, ml: 30 },
  // ── 식당 ──
  shop_meal_grilled: { g: 550, kcal: 720, ml: 150 },
  shop_meal_soup:    { g: 700, kcal: 520, ml: 420 },
  shop_meal_abalone: { g: 500, kcal: 430, ml: 320 },
  shop_meal_eel:     { g: 450, kcal: 820, ml: 90 },
  // ── 카페 (카페인 = 유효 수분 절반) ──
  shop_coffee:  { g: 300, kcal: 5, ml: 300, mlNet: 150 },
  shop_latte:   { g: 350, kcal: 180, ml: 320, mlNet: 200 },
  shop_dessert: { g: 120, kcal: 380, ml: 20 },
  // ── 주점 (술 = 이뇨 — 유효 수분 음수) ──
  shop_makgeolli: { g: 750, kcal: 340, ml: 750, mlNet: -160 },
  shop_anju:      { g: 300, kcal: 450, ml: 60 },
  shop_soju:      { g: 360, kcal: 400, ml: 360, mlNet: -250 },
  // ── 회 (식당 판매) ──
  shop_assorted_sashimi_small:        { g: 350, kcal: 420, ml: 150 },
  shop_black_sea_bream_sashimi_small: { g: 300, kcal: 330, ml: 130 },
  // ── 삶은 문어 (098차) ──
  boiled_octopus: { g: 300, kcal: 250, ml: 120 },
  // ── 불요리 9종 (1인분) ──
  stew_red:         { g: 650, kcal: 520, ml: 380 },
  stew_red_whole:   { g: 700, kcal: 560, ml: 380 },
  stew_clear:       { g: 650, kcal: 430, ml: 420 },
  grill_fish:       { g: 300, kcal: 420, ml: 40 },
  braise_fish:      { g: 400, kcal: 560, ml: 120 },
  stirfry_squid:    { g: 350, kcal: 480, ml: 60 },
  soup_clam:        { g: 600, kcal: 320, ml: 450 },
  porridge_abalone: { g: 500, kcal: 450, ml: 300 },
  grill_eel:        { g: 280, kcal: 780, ml: 40 },
};

/** 영양 → 허기·수분 회복 % (하루 필요량 대비) */
export function restoreFromNutrition(n: FoodNutrition): { hungerRestore: number; hydrationRestore: number } {
  const hunger = Math.round((n.kcal / DAILY_KCAL) * 100);
  const hydration = Math.round(((n.mlNet ?? n.ml) / DAILY_WATER_ML) * 100);
  return { hungerRestore: hunger, hydrationRestore: hydration };
}

/** id로 바로 (없으면 undefined) */
export function foodNutritionOf(id: string): FoodNutrition | undefined {
  return FOOD_NUTRITION[id];
}

/** 회 조각·접시 — 어종 살 100 g ≈ 120 kcal(흰살 기준)·수분 70% 로 추정 */
export function sashimiNutrition(weightG: number): FoodNutrition {
  return { g: weightG, kcal: Math.round(weightG * 1.2), ml: Math.round(weightG * 0.45) };
}

/** 사람이 읽는 한 줄 — `120 g · 210 kcal · 수분 30 ml` */
export function nutritionLineKo(n: FoodNutrition): string {
  const parts = [`${n.g} g`, `${n.kcal} kcal`];
  const w = n.mlNet ?? n.ml;
  if (n.ml > 0 || w !== 0) parts.push(w < 0 ? `수분 −${Math.abs(w)} ml(이뇨)` : `수분 ${w} ml`);
  return parts.join(' · ');
}
