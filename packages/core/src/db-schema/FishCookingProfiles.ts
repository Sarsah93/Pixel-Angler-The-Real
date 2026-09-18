/**
 * @file FishCookingProfiles.ts
 * @description 어종별 요리 프로필 (156차 — `.agents/FIRE_COOKING_EXPANSION_SPEC.md` §2 · Stage 2)
 *
 * 같은 레시피라도 **무엇을 넣었느냐**에 따라 결과가 달라지게 하는 재료 쪽 데이터.
 * ⚖ `FishDatabase` 엔트리를 부풀리지 않고 **별도 표**로 둔다(§0.5). 미등재 어종은 기본 프로필.
 * ⚖ 수치는 플레이어에게 그대로 보이지 않는다 — `fatnessLabel()` 등 **라벨**로만 읽힌다(§2.1 · §18).
 *
 * 1차 등재 3종(§39 Stage 2): 우럭(`black_rockfish`) · 광어(`flatfish`) · 감성돔(`black_seabream`).
 * 값은 조리 통념(우럭 = 시원한 국물·탄탄 / 광어 = 담백·부드러움·비린 향 매우 낮음 / 감성돔 = 진한 풍미·지방 중~높음).
 */

import type { FishCookingProfile } from '../types/Cooking.js';

export const FISH_COOKING_PROFILES: Record<string, FishCookingProfile> = {
  black_rockfish: {
    fatness: 0.45, texture: 0.78, fishiness: 0.22, flavorStrength: 0.62, brothContribution: 0.88,
    grillSuitability: 0.7, stewSuitability: 0.92, soupSuitability: 0.88, fryingSuitability: 0.6,
    moistureRetention: 0.66, fleshYield: 0.42, sweetness: 0.3,
  },
  flatfish: {
    fatness: 0.3, texture: 0.42, fishiness: 0.1, flavorStrength: 0.45, brothContribution: 0.55,
    grillSuitability: 0.55, stewSuitability: 0.65, soupSuitability: 0.7, fryingSuitability: 0.78,
    moistureRetention: 0.6, fleshYield: 0.48, sweetness: 0.36,
  },
  black_seabream: {
    fatness: 0.64, texture: 0.8, fishiness: 0.3, flavorStrength: 0.82, brothContribution: 0.86,
    grillSuitability: 0.86, stewSuitability: 0.86, soupSuitability: 0.7, fryingSuitability: 0.55,
    moistureRetention: 0.7, fleshYield: 0.4, sweetness: 0.4,
  },
};

/** 미등재 어종 — 중간값. 갈라지지 않는 기본 결과를 낸다 */
export const DEFAULT_FISH_COOKING_PROFILE: FishCookingProfile = {
  fatness: 0.45, texture: 0.6, fishiness: 0.3, flavorStrength: 0.55, brothContribution: 0.65,
  grillSuitability: 0.65, stewSuitability: 0.7, soupSuitability: 0.65, fryingSuitability: 0.6,
  moistureRetention: 0.62, fleshYield: 0.42, sweetness: 0.32,
};

export function fishCookingProfileOf(speciesId: string | null | undefined): FishCookingProfile {
  return (speciesId && FISH_COOKING_PROFILES[speciesId]) || DEFAULT_FISH_COOKING_PROFILE;
}
export function hasFishCookingProfile(speciesId: string): boolean {
  return !!FISH_COOKING_PROFILES[speciesId];
}

// ─── 라벨 (§2.1 · §18 — 숫자를 보여주지 않는다) ───

const band = (v: number, cuts: number[], ko: string[], en: string[], useEn: boolean): string => {
  let i = 0;
  while (i < cuts.length && v >= cuts[i]) i++;
  return (useEn ? en : ko)[i];
};
export function fatnessLabel(v: number, en = false): string {
  return band(v, [0.4, 0.7], ['담백', '보통', '기름진 편'], ['Lean', 'Medium', 'On the fatty side'], en);
}
export function textureLabel(v: number, en = false): string {
  return band(v, [0.4, 0.7], ['부드러움', '보통', '탄탄함'], ['Soft', 'Medium', 'Firm'], en);
}
export function fishinessLabel(v: number, en = false): string {
  return band(v, [0.15, 0.35, 0.6], ['거의 없음', '약함', '보통', '강함'], ['Almost none', 'Mild', 'Moderate', 'Strong'], en);
}
export function flavorLabel(v: number, en = false): string {
  return band(v, [0.4, 0.7], ['은은함', '보통', '진한 편'], ['Subtle', 'Medium', 'Rich'], en);
}

/** 중량 구간 (§23) — 회복·풍미·가격·버프 지속에 쓰는 밴드 */
export type CookingWeightBand = 'small' | 'medium' | 'large' | 'extraLarge';
export function cookingWeightBand(weightG: number): CookingWeightBand {
  if (weightG < 500) return 'small';
  if (weightG < 900) return 'medium';
  if (weightG < 1300) return 'large';
  return 'extraLarge';
}
export const WEIGHT_BAND_KO: Record<CookingWeightBand, string> = { small: '소', medium: '중', large: '대', extraLarge: '특대' };
