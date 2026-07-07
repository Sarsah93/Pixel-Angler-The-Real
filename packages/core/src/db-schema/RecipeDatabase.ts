/**
 * @file RecipeDatabase.ts
 * @description 캐치앤쿡 요리 레시피 데이터베이스
 *
 * 잡은 생선/채취 생물로 만들 수 있는 요리 레시피 목록.
 * 위치, 필요 재료, 조리 방법, 버프 효과를 포함합니다.
 */

import type { CookingRecipe, ProcessingLocation } from '../types/Activities.js';

export const RECIPE_DATABASE: CookingRecipe[] = [
  // ────────── 회 (生) ──────────
  {
    id: 'sashimi_black_seabream',
    nameKo: '감성돔 회',
    description: '갓 잡은 감성돔을 포를 떠 생으로 즐기는 바다의 선물.',
    requiredIngredients: [
      { itemId: 'black_seabream', nameKo: '감성돔', requiredAmountG: 500, isFishSpecies: true },
    ],
    processingSteps: ['descaling', 'gutting', 'filleting'],
    cookingMethod: 'raw_sashimi',
    requiredLocation: ['rocky_shore', 'breakwater', 'restaurant', 'condo'],
    estimatedSaleValue: 35000,
    staminaRestore: 20,
    buffEffect: {
      type: 'rare_fish_up',
      value: 15,
      durationMinutes: 60,
    },
  },
  {
    id: 'sashimi_yellowtail',
    nameKo: '방어 회',
    description: '겨울 방어 지깅 직후 선상에서 즐기는 최고급 회.',
    requiredIngredients: [
      { itemId: 'yellowtail', nameKo: '방어', requiredAmountG: 1000, isFishSpecies: true },
    ],
    processingSteps: ['descaling', 'gutting', 'filleting', 'skinning'],
    cookingMethod: 'raw_sashimi',
    requiredLocation: ['on_boat', 'restaurant', 'condo'],
    estimatedSaleValue: 55000,
    staminaRestore: 40,
    buffEffect: {
      type: 'bite_chance_up',
      value: 20,
      durationMinutes: 90,
    },
  },
  {
    id: 'sashimi_largescale_blackfish',
    nameKo: '벵에돔 회',
    description: '갯바위 전유동의 주인공을 즉석에서 포 떠 먹는 호사.',
    requiredIngredients: [
      { itemId: 'largescale_blackfish', nameKo: '벵에돔', requiredAmountG: 400, isFishSpecies: true },
    ],
    processingSteps: ['descaling', 'gutting', 'filleting'],
    cookingMethod: 'raw_sashimi',
    requiredLocation: ['rocky_shore', 'restaurant', 'condo'],
    estimatedSaleValue: 28000,
    staminaRestore: 25,
    buffEffect: {
      type: 'cast_distance_up',
      value: 10,
      durationMinutes: 45,
    },
  },
  // ────────── 구이 ──────────
  {
    id: 'grilled_hairtail',
    nameKo: '갈치 소금구이',
    description: '야간 낚시로 잡은 싱싱한 갈치를 소금 뿌려 바로 구운 진미.',
    requiredIngredients: [
      { itemId: 'hairtail', nameKo: '갈치', requiredAmountG: 300, isFishSpecies: true },
      { itemId: 'salt', nameKo: '소금', requiredAmountG: 10, isFishSpecies: false },
    ],
    processingSteps: ['gutting', 'portioning'],
    cookingMethod: 'grilled',
    requiredLocation: ['breakwater', 'rocky_shore', 'restaurant', 'condo'],
    estimatedSaleValue: 15000,
    staminaRestore: 35,
    buffEffect: {
      type: 'fatigue_recovery',
      value: 25,
      durationMinutes: 30,
    },
  },
  {
    id: 'grilled_black_rockfish',
    nameKo: '볼락 구이',
    description: '껍질째 노릇노릇 구운 볼락. 방파제 야간 낚시의 즐거운 마무리.',
    requiredIngredients: [
      { itemId: 'black_rockfish', nameKo: '볼락', requiredAmountG: 200, isFishSpecies: true },
      { itemId: 'cooking_oil', nameKo: '식용유', requiredAmountG: 20, isFishSpecies: false },
    ],
    processingSteps: ['descaling', 'gutting'],
    cookingMethod: 'grilled',
    requiredLocation: ['breakwater', 'restaurant', 'condo'],
    estimatedSaleValue: 8000,
    staminaRestore: 20,
  },
  // ────────── 찜/탕 ──────────
  {
    id: 'stew_crab',
    nameKo: '꽃게탕',
    description: '해루질로 잡은 꽃게를 얼큰하게 끓인 탕. 시원한 국물이 일품.',
    requiredIngredients: [
      { itemId: 'portunus_trituberculatus', nameKo: '꽃게', requiredAmountG: 600, isFishSpecies: false },
      { itemId: 'red_pepper_paste', nameKo: '고추장', requiredAmountG: 50, isFishSpecies: false },
      { itemId: 'green_onion', nameKo: '대파', requiredAmountG: 30, isFishSpecies: false },
    ],
    processingSteps: ['portioning'],
    cookingMethod: 'stewed',
    requiredLocation: ['restaurant', 'condo'],
    estimatedSaleValue: 35000,
    staminaRestore: 60,
    buffEffect: {
      type: 'bite_chance_up',
      value: 10,
      durationMinutes: 120,
    },
  },
  {
    id: 'soup_clam',
    nameKo: '바지락 칼국수',
    description: '갯벌 바지락을 끓여낸 시원한 칼국수. 해루질 직후 최고의 한 끼.',
    requiredIngredients: [
      { itemId: 'clam_varicosa', nameKo: '바지락', requiredAmountG: 400, isFishSpecies: false },
      { itemId: 'noodle', nameKo: '칼국수 면', requiredAmountG: 150, isFishSpecies: false },
    ],
    processingSteps: [],
    cookingMethod: 'soup',
    requiredLocation: ['restaurant', 'condo'],
    estimatedSaleValue: 12000,
    staminaRestore: 50,
    buffEffect: {
      type: 'fatigue_recovery',
      value: 40,
      durationMinutes: 60,
    },
  },
  {
    id: 'bbq_abalone',
    nameKo: '전복 버터구이',
    description: '전복을 껍데기째 버터로 구운 고급 요리. 간장과 청양고추로 마무리.',
    requiredIngredients: [
      { itemId: 'haliotis_discus', nameKo: '전복', requiredAmountG: 300, isFishSpecies: false },
      { itemId: 'butter', nameKo: '버터', requiredAmountG: 30, isFishSpecies: false },
      { itemId: 'soy_sauce', nameKo: '간장', requiredAmountG: 15, isFishSpecies: false },
    ],
    processingSteps: [],
    cookingMethod: 'grilled',
    requiredLocation: ['rocky_shore', 'restaurant', 'condo'],
    estimatedSaleValue: 45000,
    staminaRestore: 45,
    buffEffect: {
      type: 'rare_fish_up',
      value: 30,
      durationMinutes: 120,
    },
  },
  // ────────── 튀김 ──────────
  {
    id: 'fried_sea_urchin',
    nameKo: '성게알 군함말이',
    description: '갓 채취한 성게알을 밥 위에 올린 군함말이. 식당 메뉴의 꽃.',
    requiredIngredients: [
      { itemId: 'strongylocentrotus_nudus', nameKo: '성게', requiredAmountG: 100, isFishSpecies: false },
      { itemId: 'sushi_rice', nameKo: '초밥 밥', requiredAmountG: 80, isFishSpecies: false },
      { itemId: 'nori', nameKo: '김', requiredAmountG: 5, isFishSpecies: false },
    ],
    processingSteps: ['portioning'],
    cookingMethod: 'raw_sashimi',
    requiredLocation: ['restaurant'],
    estimatedSaleValue: 20000,
    staminaRestore: 15,
    buffEffect: {
      type: 'rare_fish_up',
      value: 25,
      durationMinutes: 90,
    },
  },
];

export function getRecipeById(id: string): CookingRecipe | undefined {
  return RECIPE_DATABASE.find((r) => r.id === id);
}

export function getRecipesByLocation(location: ProcessingLocation): CookingRecipe[] {
  return RECIPE_DATABASE.filter((r) => r.requiredLocation.includes(location));
}

export function getRecipesByIngredient(ingredientId: string): CookingRecipe[] {
  return RECIPE_DATABASE.filter((r) =>
    r.requiredIngredients.some((i) => i.itemId === ingredientId)
  );
}
