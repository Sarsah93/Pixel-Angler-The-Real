/**
 * @file FoodEffects.ts
 * @description 요리 효과 데이터 (156차 — 확장 스펙 §25~§27)
 *
 * ⚖ 음식 하나 = 회복 + **버프 1개**. 종류는 `FoodEffectKind` 닫힌 유니온.
 * ⚖ 156차에 **기계적으로 적용되는 종류는 `satiety`**(허기 소모 −% = 기존 `drainBuff`)뿐이다.
 *   나머지는 데이터로 실려 상세보기에 표시되고, 버프 축은 Stage 9 밸런싱 때 `GameState`에 신설한다(§0.5).
 * ⚖ 수치는 여기(데이터)에만 — 컴포넌트에 하드코딩 금지(§43-4).
 */

import type { FoodEffectDef, FoodEffectKind } from '../types/Cooking.js';

export const FOOD_EFFECT_KIND_KO: Record<FoodEffectKind, string> = {
  satiety: '허기 소모', hydration: '수분', fatigue_recovery: '피로 회복', fishing_focus: '낚시 집중',
  fishing_endurance: '낚시 지구력', movement_endurance: '이동 지구력', cold_resistance: '추위 저항', heat_resistance: '더위 저항',
};

/** 레시피별 대표 효과 (§27) */
export const RECIPE_EFFECTS: Record<string, FoodEffectDef> = {
  stew_red: { id: 'satiety_stew', kind: 'satiety', magnitude: 0.08, durationMin: 30,
    nameKo: '포만감', nameEn: 'Satiety', descKo: '30분 동안 허기 감소 속도 -8%', descEn: 'Hunger drains 8% slower for 30 min' },
  stew_clear: { id: 'clear_belly', kind: 'fatigue_recovery', magnitude: 0.08, durationMin: 30,
    nameKo: '맑은 속', nameEn: 'Clear stomach', descKo: '30분 동안 피로 증가량 -8%', descEn: 'Fatigue builds 8% slower for 30 min' },
  grill_fish: { id: 'savory_meal', kind: 'fatigue_recovery', magnitude: 0.08, durationMin: 30,
    nameKo: '고소한 한 끼', nameEn: 'Savoury meal', descKo: '30분 동안 피로 감소량 +8%', descEn: 'Fatigue recovers 8% faster for 30 min' },
  braise_fish: { id: 'hearty', kind: 'satiety', magnitude: 0.1, durationMin: 40,
    nameKo: '든든함', nameEn: 'Hearty', descKo: '40분 동안 허기 감소 속도 -10%', descEn: 'Hunger drains 10% slower for 40 min' },
  stirfry_squid: { id: 'vigor', kind: 'movement_endurance', magnitude: 0.08, durationMin: 25,
    nameKo: '활력', nameEn: 'Vigour', descKo: '25분 동안 달리기 피로 소모 -8%', descEn: 'Running costs 8% less fatigue for 25 min' },
  soup_clam: { id: 'refreshed', kind: 'fatigue_recovery', magnitude: 0.1, durationMin: 30,
    nameKo: '개운함', nameEn: 'Refreshed', descKo: '30분 동안 피로 회복량 +10%', descEn: 'Fatigue recovers 10% faster for 30 min' },
  porridge_abalone: { id: 'restorative', kind: 'fatigue_recovery', magnitude: 0.12, durationMin: 45,
    nameKo: '회복식', nameEn: 'Restorative', descKo: '45분 동안 피로 회복 속도 +12%', descEn: 'Fatigue recovers 12% faster for 45 min' },
  grill_eel: { id: 'stamina', kind: 'fatigue_recovery', magnitude: 0.12, durationMin: 60,
    nameKo: '원기회복', nameEn: 'Revitalised', descKo: '60분 동안 피로 감소 속도 +12%', descEn: 'Fatigue recovers 12% faster for 60 min' },
};

export function recipeEffectOf(recipeId: string): FoodEffectDef | undefined {
  return RECIPE_EFFECTS[recipeId];
}
