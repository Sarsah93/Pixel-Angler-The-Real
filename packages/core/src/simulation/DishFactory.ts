/**
 * @file DishFactory.ts
 * @description 완성 요리 개체 생성 (156차 — 확장 스펙 §12~§16 · §28)
 *
 * 154차 조리 엔진(`CookingSim`)이 낸 `DishData`(간·온도·식감·신선·완성도 원점수) 위에 **결과 생성 계층**을 얹는다:
 *   재료 프로필 × 중량 × 신선도 × 조리 품질 → 이름·설명·회복치·효과·판매가 = `DishInstance`.
 * ⚖ 엔진은 손대지 않는다(§43-5). 시간 감쇠(현재 별점)는 계속 `dishStarsAt(dish)`가 계산한다.
 * ⚖ 곱연산 결과는 상하한으로 묶는다(§13) — 수치는 전부 `TUNING.cook`.
 */

import type { DishData, DishInstance, DishNameModifier, DishQuality, FireRecipeDef, FoodEffectDef } from '../types/Cooking.js';
import { TUNING } from '../config/tuning.js';
import { dishStarsAt, dishVitalsMult } from './CookingSim.js';
import { fishCookingProfileOf } from '../db-schema/FishCookingProfiles.js';
import { recipeEffectOf } from '../db-schema/FoodEffects.js';
import { dishBaseName, variantDescription, DISH_MODIFIER_KO, DISH_MODIFIER_EN } from '../db-schema/RecipeLore.js';
import { dishDiscoveryId, isVariantRecipe } from '../db-schema/DishDiscovery.js';

export interface PrimaryIngredientInfo {
  speciesId: string | null;
  nameKo: string | null;
  nameEn: string | null;
  weightG: number;
  /** 투입 당시 신선도 0~1 */
  freshness01: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** 중량 배율 — (중량 / 기준)^지수, 상하한 */
export function dishWeightMult(weightG: number): number {
  const t = TUNING.cook.dishEffect;
  if (!(weightG > 0)) return 1;
  return clamp(Math.pow(weightG / t.refWeightG, t.weightExp), t.weightMultMin, t.weightMultMax);
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
  const ingMult = dishWeightMult(ip.weightG) * ((1 - p.ingredientMultiplier / 2) + p.ingredientMultiplier * ip.flavorStrength);
  const qualMult = 0.3 + p.qualityMultiplier * clamp(totalNow, 0, 100) / 100;
  const freshMult = (1 - p.freshnessMultiplier) + p.freshnessMultiplier * ip.freshness01;
  return Math.round(recipe.baseValueKrw * ingMult * qualMult * freshMult / 100) * 100;
}

/**
 * 완성 요리 개체 — 같은 입력이면 같은 결과(§41 재현성: 난수 없음).
 * @param dish 154차 `finishCook` 결과(원점수·탄 여부·완성 시각)
 * @param primary 주재료(가장 무거운 main 재료) — 어종이 없으면 generic
 * @param seq 개체 번호(인벤 시퀀스)
 */
export function createDishInstance(recipe: FireRecipeDef, dish: DishData, primary: PrimaryIngredientInfo, seq: number): DishInstance {
  const prof = fishCookingProfileOf(primary.speciesId);
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
  const weightMult = dishWeightMult(primary.weightG);
  const hungerIng = 1 + iq.fatnessWeight * (prof.fatness - 0.5);
  const hydrationIng = 1 + iq.brothWeight * (prof.brothContribution - 0.5);
  const freshMult = (1 - iq.freshnessWeight) + iq.freshnessWeight * primary.freshness01;
  const cookMult = dishVitalsMult(dish, starsAtMake);
  const baseH = recipe.vitals.hungerRestore, baseW = recipe.vitals.hydrationRestore;
  const hungerRestore = Math.round(clamp(baseH * weightMult * hungerIng * freshMult * cookMult, baseH * t.minMultiplier, baseH * t.maxMultiplier));
  const hydrationRestore = Math.round(clamp(baseW * weightMult * hydrationIng * freshMult * cookMult, baseW * t.minMultiplier, baseW * t.maxMultiplier));

  // 효과 — 버프 1개. 탄 것·품질 미달은 없다. 매운탕류 포만감은 지방감이 지속을 늘린다(§4)
  const effects: FoodEffectDef[] = [];
  const eff = recipeEffectOf(recipe.id);
  if (eff && !dish.burnt && quality.overall >= t.effectMinOverall) {
    const dur = eff.kind === 'satiety' ? Math.round(eff.durationMin * (0.8 + 0.4 * prof.fatness)) : eff.durationMin;
    effects.push({ ...eff, durationMin: dur, descKo: eff.descKo.replace(/^\d+분/, `${dur}분`), descEn: eff.descEn.replace(/for \d+ min$/, `for ${dur} min`) });
  }

  const variant = isVariantRecipe(recipe.id) && primary.speciesId;
  const base = dishBaseName(recipe.id, recipe.nameKo, recipe.nameEn, variant ? primary.nameKo : null, variant ? primary.nameEn : null);
  const nameKo = modifier ? `${DISH_MODIFIER_KO[modifier]} ${base.ko}` : base.ko;
  const nameEn = modifier ? `${DISH_MODIFIER_EN[modifier]} ${base.en}` : base.en;
  const desc = variantDescription(recipe.id, variant ? primary.speciesId : null, variant ? primary.nameKo : null, variant ? primary.nameEn : null);

  const inst: DishInstance = {
    instanceId: `dish_${recipe.id}_${seq}`,
    recipeId: recipe.id,
    discoveryId: dishDiscoveryId(recipe.id, variant ? primary.speciesId : null),
    ingredientProfile: {
      primarySpecies: variant ? primary.speciesId : null,
      primaryNameKo: variant ? primary.nameKo : null,
      primaryNameEn: variant ? primary.nameEn : null,
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
