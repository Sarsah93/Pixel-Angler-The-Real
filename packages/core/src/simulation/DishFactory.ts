/**
 * @file DishFactory.ts
 * @description 완성 요리 개체 생성 (156차 — 확장 스펙 §12~§16 · §28 · 254차 Stage 7 나머지 레시피)
 *
 * 154차 조리 엔진(`CookingSim`)이 낸 `DishData`(간·온도·식감·신선·완성도 원점수) 위에 **결과 생성 계층**을 얹는다:
 *   재료 프로필 × 중량 × 신선도 × 조리 품질 → 이름·설명·회복치·효과·판매가 = `DishInstance`.
 * ⚖ 엔진은 손대지 않는다(§43-5). 시간 감쇠(현재 별점)는 계속 `dishStarsAt(dish)`가 계산한다.
 * ⚖ 곱연산 결과는 상하한으로 묶는다(§13) — 수치는 전부 `TUNING.cook`.
 * ⚖ 254차 — 효과 크기 · 지속은 레시피마다 정한 재료 특성(`TUNING.cook.variantEffect`)이 움직인다:
 *   지리 = 비린 향↓ · 신선도↑ / 구이 = 지방 · 촉촉함 / 조림 = 살 식감 / 볶음 = 식감 · 단맛 / 조개탕 = 국물 · 신선도 / 장어 = 지방.
 */

import type { DishData, DishEffectDriver, DishInstance, DishNameModifier, DishQuality, FireRecipeDef, FishCookingProfile, FoodEffectDef } from '../types/Cooking.js';
import { TUNING } from '../config/tuning.js';
import { dishStarsAt, dishVitalsMult } from './CookingSim.js';
import { fishCookingProfileOf, cookingSpeciesId } from '../db-schema/FishCookingProfiles.js';
import { recipeEffectOf } from '../db-schema/FoodEffects.js';
import { dishBaseName, variantDescription, DISH_MODIFIER_KO, DISH_MODIFIER_EN } from '../db-schema/RecipeLore.js';
import { dishDiscoveryId, isVariantRecipe, dishSpeciesName, cookSpeciesNames } from '../db-schema/DishDiscovery.js';

export interface PrimaryIngredientInfo {
  /** 주재료 어종 · 채집 생물 id (투입 때 남긴 것 — 야간 엔트리여도 된다. 정본 id는 여기서 고른다) */
  speciesId: string | null;
  /** 정식 이름 — 코어가 id로 이름을 못 찾을 때만 쓰는 대비값 */
  nameKo: string | null;
  nameEn: string | null;
  weightG: number;
  /** 투입 당시 신선도 0~1 */
  freshness01: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** 중량 배율 — (중량 / 기준)^지수, 상하한. 기준은 레시피마다(1인분 구이 · 볶음은 가볍다 — 254차), 없으면 공통 기준 */
export function dishWeightMult(weightG: number, recipeId?: string): number {
  const t = TUNING.cook.dishEffect;
  if (!(weightG > 0)) return 1;
  const ref = (recipeId ? TUNING.cook.variantEffect[recipeId]?.refWeightG : undefined) ?? t.refWeightG;
  return clamp(Math.pow(weightG / ref, t.weightExp), t.weightMultMin, t.weightMultMax);
}

/** 이름 수식어 — 최대 1개, 우선순위 탄 → 일품 → 싱싱한 → 기름진 (§15) */
export function pickDishModifier(burnt: boolean, quality: DishQuality, fatness: number): DishNameModifier | null {
  const n = TUNING.cook.naming;
  if (burnt) return 'burnt';
  if (quality.overall >= n.premiumThreshold && quality.freshness >= n.freshThreshold) return 'prime';
  if (quality.freshness >= n.freshThreshold) return 'fresh';
  if (fatness >= n.fattyThreshold) return 'fatty';
  return null;
}

/** 판매가 — 탄 것 0 · 레시피 기본값 × 재료 × 품질(현재 총점) × 신선도 (§28 — 사시미와 별개 계수) */
export function dishInstanceValueKrw(inst: DishInstance, recipe: FireRecipeDef, totalNow: number): number {
  if (inst.modifier === 'burnt') return 0;
  const p = TUNING.cook.pricing;
  const ip = inst.ingredientProfile;
  const ingMult = dishWeightMult(ip.weightG, recipe.id) * ((1 - p.ingredientMultiplier / 2) + p.ingredientMultiplier * ip.flavorStrength);
  const qualMult = 0.3 + p.qualityMultiplier * clamp(totalNow, 0, 100) / 100;
  const freshMult = (1 - p.freshnessMultiplier) + p.freshnessMultiplier * ip.freshness01;
  return Math.round(recipe.baseValueKrw * ingMult * qualMult * freshMult / 100) * 100;
}

function driverValue(k: DishEffectDriver, p: FishCookingProfile, freshness01: number): number {
  switch (k) {
    case 'clean': return 1 - p.fishiness;
    case 'freshness': return freshness01;
    default: return p[k];
  }
}

/**
 * 재료 점수 s (0~1) — 레시피가 보는 특성의 가중 평균(`TUNING.cook.variantEffect[recipe].weights`).
 * 0.5 = 레시피 기본값 그대로. 보정이 없는 레시피는 null.
 */
export function dishEffectScore(recipeId: string, prof: FishCookingProfile, freshness01: number): number | null {
  const t = TUNING.cook.variantEffect[recipeId];
  if (!t) return null;
  let s = 0, wsum = 0;
  for (const [k, w] of Object.entries(t.weights) as [DishEffectDriver, number | undefined][]) {
    if (!w || !(w > 0)) continue;
    s += w * driverValue(k, prof, freshness01);
    wsum += w;
  }
  return wsum > 0 ? clamp(s / wsum, 0, 1) : 0.5;
}

/**
 * 레시피 효과를 주재료로 보정한다 — 크기 ×(1 + magSpan·(s − 0.5)) · 지속 ×(1 + durSpan·(s − 0.5)), 배율은 상하한.
 * 크기는 1% 단위로 반올림한다(상세보기 숫자 = 실제 적용값). 설명 문장의 분 · %도 실제 값으로 바꾼다.
 */
export function scaleDishEffect(eff: FoodEffectDef, recipeId: string, prof: FishCookingProfile, freshness01: number): FoodEffectDef {
  const t = TUNING.cook.variantEffect[recipeId];
  const s = dishEffectScore(recipeId, prof, freshness01);
  if (!t || s === null) return { ...eff };
  const lim = TUNING.cook.dishEffect;
  const magMult = clamp(1 + t.magSpan * (s - 0.5), lim.effectMultMin, lim.effectMultMax);
  const durMult = clamp(1 + t.durSpan * (s - 0.5), lim.effectMultMin, lim.effectMultMax);
  const magnitude = Math.round(eff.magnitude * magMult * 100) / 100;
  const durationMin = Math.max(1, Math.round(eff.durationMin * durMult));
  const pct = Math.round(magnitude * 100);
  return {
    ...eff, magnitude, durationMin,
    descKo: eff.descKo.replace(/^\d+분/, `${durationMin}분`).replace(/\d+%$/, `${pct}%`),
    descEn: eff.descEn.replace(/for \d+ min$/, `for ${durationMin} min`).replace(/\d+%/, `${pct}%`),
  };
}

/**
 * 완성 요리 개체 — 같은 입력이면 같은 결과(§41 재현성: 난수 없음).
 * @param dish 154차 `finishCook` 결과(원점수·탄 여부·완성 시각)
 * @param primary 주재료(가장 무거운 main 재료) — 어종을 모르면 generic(레시피 이름 · 기본 프로필)
 * @param seq 개체 번호(인벤 시퀀스)
 */
export function createDishInstance(recipe: FireRecipeDef, dish: DishData, primary: PrimaryIngredientInfo, seq: number): DishInstance {
  // 주재료 — 정본 id(밤 참돔 = 참돔) · 요리 이름에 쓰는 이름(조피볼락 → 우럭). 이름을 모르는 id는 generic으로 둔다
  const spId = primary.speciesId ? cookingSpeciesId(primary.speciesId) : null;
  const spDish = isVariantRecipe(recipe.id) ? dishSpeciesName(spId) : null;
  const variant = !!(spId && spDish);
  const known = variant ? cookSpeciesNames(spId) : null;
  const prof = fishCookingProfileOf(variant ? spId : null);
  const starsAtMake = dishStarsAt(dish, recipe, dish.cookedAtMs);
  const quality: DishQuality = {
    seasoning: Math.round(dish.base.season * 100),
    temperature: Math.round(dish.base.temp * 100),
    texture: Math.round(dish.base.texture * 100),
    freshness: Math.round(primary.freshness01 * 100),
    completion: Math.round(dish.base.finish * 100),
    overall: Math.round(starsAtMake.total),
  };
  const modifier = pickDishModifier(dish.burnt, quality, prof.fatness);

  // 회복치 = 기본 × 중량 × 재료 특성 × 신선도 × 조리 품질 → 상하한 (§13)
  const t = TUNING.cook.dishEffect;
  const iq = TUNING.cook.ingredientQuality;
  const weightMult = dishWeightMult(primary.weightG, recipe.id);
  const hungerIng = 1 + iq.fatnessWeight * (prof.fatness - 0.5);
  const hydrationIng = 1 + iq.brothWeight * (prof.brothContribution - 0.5);
  const freshMult = (1 - iq.freshnessWeight) + iq.freshnessWeight * primary.freshness01;
  const cookMult = dishVitalsMult(dish, starsAtMake);
  const baseH = recipe.vitals.hungerRestore, baseW = recipe.vitals.hydrationRestore;
  const hungerRestore = Math.round(clamp(baseH * weightMult * hungerIng * freshMult * cookMult, baseH * t.minMultiplier, baseH * t.maxMultiplier));
  const hydrationRestore = Math.round(clamp(baseW * weightMult * hydrationIng * freshMult * cookMult, baseW * t.minMultiplier, baseW * t.maxMultiplier));

  // 효과 — 버프 1개. 탄 것·품질 미달은 없다. 크기 · 지속은 주재료 특성이 정한다(254차 — 매운탕은 156차대로 지방감 → 지속)
  const effects: FoodEffectDef[] = [];
  const eff = recipeEffectOf(recipe.id);
  if (eff && !dish.burnt && quality.overall >= t.effectMinOverall) {
    effects.push(scaleDishEffect(eff, recipe.id, prof, primary.freshness01));
  }

  const base = dishBaseName(recipe.id, recipe.nameKo, recipe.nameEn, spDish?.ko ?? null, spDish?.en ?? null, variant ? spId : null);
  const nameKo = modifier ? `${DISH_MODIFIER_KO[modifier]} ${base.ko}` : base.ko;
  const nameEn = modifier ? `${DISH_MODIFIER_EN[modifier]} ${base.en}` : base.en;
  const desc = variantDescription(recipe.id, variant ? spId : null, spDish?.ko ?? null, spDish?.en ?? null);

  const inst: DishInstance = {
    instanceId: `dish_${recipe.id}_${seq}`,
    recipeId: recipe.id,
    discoveryId: dishDiscoveryId(recipe.id, variant ? spId : null),
    ingredientProfile: {
      primarySpecies: variant ? spId : null,
      primaryNameKo: variant ? (known?.nameKo ?? primary.nameKo) : null,
      primaryNameEn: variant ? (known?.nameEn ?? primary.nameEn) : null,
      weightG: Math.round(primary.weightG), freshness01: primary.freshness01,
      fatness: prof.fatness, texture: prof.texture, fishiness: prof.fishiness, flavorStrength: prof.flavorStrength, brothContribution: prof.brothContribution,
    },
    quality, modifier,
    result: { nameKo, nameEn, descriptionKo: desc.ko, descriptionEn: desc.en, hungerRestore, hydrationRestore, effects, sellPrice: 0 },
    createdAt: dish.cookedAtMs,
    freshnessAtCompletion: quality.freshness,
  };
  inst.result.sellPrice = dishInstanceValueKrw(inst, recipe, quality.overall);
  return inst;
}
