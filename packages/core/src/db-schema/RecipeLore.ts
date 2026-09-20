/**
 * @file RecipeLore.ts
 * @description 레시피 로어(짧은 설명·요리 팁·재료 팁) + 어종별 변형 이름·설명 (156차 — 확장 스펙 §14·§31·§32)
 *
 * ⚖ 레시피 정본은 154차 `FireRecipeDatabase.ts`다. 여기는 **말**만 둔다(설명·이름 규칙) — 조리 수치를 적지 않는다.
 * ⚖ 이름 규칙(§14~15): 기본 = `우럭 매운탕`. 수식어는 **최대 1개**, 우선순위 탄 → 일품 → 싱싱한 → 기름진 → 없음.
 */

import type { DishNameModifier } from '../types/Cooking.js';

export interface RecipeLore {
  shortDescriptionKo: string;
  shortDescriptionEn: string;
  cookingTipKo?: string;
  cookingTipEn?: string;
  ingredientTipKo?: string;
  ingredientTipEn?: string;
}

export const RECIPE_LORE: Record<string, RecipeLore> = {
  stew_red: {
    shortDescriptionKo: '생선의 머리와 뼈인 서더리로 국물을 낸 얼큰한 매운탕.',
    shortDescriptionEn: 'A spicy maeuntang made from a fish head and frame.',
    cookingTipKo: '서더리가 많을수록 국물이 깊어지고, 살점은 마지막에 건져 먹기 좋습니다.',
    cookingTipEn: 'More frame makes a deeper broth; save the meat for the end.',
    ingredientTipKo: '손질 부산물인 머리·등뼈·갈비뼈를 모아 넣습니다.',
    ingredientTipEn: 'Use the head, spine and ribs left from fish preparation.',
  },
  stew_red_whole: {
    shortDescriptionKo: '어종 하나를 통째로 넣어 살과 국물을 함께 즐기는 얼큰한 매운탕.',
    shortDescriptionEn: 'A spicy maeuntang made with one whole fish.',
    cookingTipKo: '통생선은 살이 풀어지기 전에 한 번만 뒤집어 형태를 지켜 주세요.',
    cookingTipEn: 'Turn the whole fish only once before its flesh begins to fall apart.',
    ingredientTipKo: '서더리가 아니라 손질하지 않은 한 마리 생선을 사용합니다.',
    ingredientTipEn: 'Use one whole fish rather than a frame or dressed fillet.',
  },
  stew_clear: {
    shortDescriptionKo: '무와 대파로 시원하게 끓인 맑은 탕. 생선 맛이 그대로 난다.',
    shortDescriptionEn: 'A clear soup with radish and green onion — the fish speaks for itself.',
    cookingTipKo: '비린 향이 적고 신선한 생선일수록 맑은 맛이 삽니다.',
    cookingTipEn: 'The fresher and milder the fish, the cleaner the soup.',
  },
  grill_fish: {
    shortDescriptionKo: '소금만 뿌려 겉은 바삭하게, 속은 촉촉하게 구운 생선.',
    shortDescriptionEn: 'Fish grilled with salt — crisp outside, moist inside.',
    cookingTipKo: '기름진 생선은 풍미가 살지만 불이 세면 쉽게 탑니다.',
    cookingTipEn: 'Fatty fish taste richer but burn easily on high heat.',
  },
  braise_fish: {
    shortDescriptionKo: '간장·설탕 양념을 졸여 무와 함께 배어들게 한 조림.',
    shortDescriptionEn: 'Fish braised in soy and sugar until the radish soaks up the sauce.',
    ingredientTipKo: '살이 탄탄한 생선이 오래 졸여도 부서지지 않습니다.',
    ingredientTipEn: 'Firm fish survive a long braise without falling apart.',
  },
  stirfry_squid: {
    shortDescriptionKo: '고추장 양념에 센 불로 짧게 볶아 낸 오징어.',
    shortDescriptionEn: 'Squid flash-fried on high heat in gochujang sauce.',
    cookingTipKo: '오징어는 오래 볶을수록 질겨집니다 — 익는 순간 내리세요.',
    cookingTipEn: 'Squid gets tougher the longer it fries — take it off the moment it cooks.',
  },
  soup_clam: {
    shortDescriptionKo: '조개만으로 국물을 낸 개운한 탕.',
    shortDescriptionEn: 'A light soup whose broth comes from the clams alone.',
    cookingTipKo: '신선한 조개일수록 국물이 깊습니다.',
    cookingTipEn: 'Fresher clams make a deeper broth.',
  },
  porridge_abalone: {
    shortDescriptionKo: '참기름에 볶은 쌀과 전복을 뭉근히 끓인 죽.',
    shortDescriptionEn: 'Rice and abalone fried in sesame oil, then simmered into porridge.',
    ingredientTipKo: '전복이 클수록 맛이 진해집니다.',
    ingredientTipEn: 'The bigger the abalone, the richer the porridge.',
  },
  grill_eel: {
    shortDescriptionKo: '지방이 많은 장어를 소금이나 양념으로 구운 것.',
    shortDescriptionEn: 'Fatty eel grilled with salt or sauce.',
    cookingTipKo: '지방이 많아 불 조절이 어렵습니다. 자주 뒤집으세요.',
    cookingTipEn: 'All that fat makes the heat hard to control — turn it often.',
  },
};

/** 어종별 변형 전용 설명 (§4 — 매운탕 3종). 없으면 `variantDescription()`이 문장을 만든다 */
export const DISH_VARIANT_LORE: Record<string, Record<string, { descKo: string; descEn: string }>> = {
  stew_red: {
    black_rockfish: { descKo: '담백하면서도 시원한 국물과 탄탄한 살이 특징인 매운탕.', descEn: 'A maeuntang known for its clean, refreshing broth and firm flesh.' },
    flatfish: { descKo: '담백하고 부드러운 광어 살이 들어간 깔끔한 매운탕.', descEn: 'A clean maeuntang with the mild, soft flesh of flounder.' },
    black_seabream: { descKo: '탄탄한 감성돔 살과 진한 생선 풍미가 어우러진 매운탕.', descEn: 'A maeuntang where firm seabream flesh meets a deep fish flavour.' },
  },
  stew_red_whole: {
    black_rockfish: { descKo: '우럭 한 마리를 통째로 넣어 살이 넉넉하고 국물이 시원한 매운탕.', descEn: 'A whole black rockfish maeuntang with generous flesh and a clean broth.' },
    flatfish: { descKo: '광어 한 마리를 통째로 넣어 담백한 살과 칼칼한 국물을 살린 매운탕.', descEn: 'A whole flounder maeuntang with mild flesh and a spicy broth.' },
    black_seabream: { descKo: '감성돔 한 마리를 통째로 넣어 탄탄한 살과 깊은 풍미를 낸 매운탕.', descEn: 'A whole black seabream maeuntang with firm flesh and deep flavour.' },
  },
};

/** 어종 이름이 앞에 붙는 레시피의 이름 틀 — `ko(어종)` / `en(Species)` */
export const RECIPE_BASE_NAME: Record<string, { ko: (sp: string) => string; en: (sp: string) => string }> = {
  stew_red: { ko: (sp) => `${sp} 서더리 매운탕`, en: (sp) => `${sp} Fish-frame Maeuntang` },
  stew_red_whole: { ko: (sp) => `${sp} 매운탕`, en: (sp) => `${sp} Maeuntang` },
  stew_clear: { ko: (sp) => `${sp} 지리`, en: (sp) => `${sp} Jiri` },
  grill_fish: { ko: (sp) => `${sp}구이`, en: (sp) => `Grilled ${sp}` },
  braise_fish: { ko: (sp) => `${sp}조림`, en: (sp) => `Braised ${sp}` },
  grill_eel: { ko: (sp) => `${sp}구이`, en: (sp) => `Grilled ${sp}` },
};

export const DISH_MODIFIER_KO: Record<DishNameModifier, string> = { burnt: '탄', prime: '일품', fresh: '싱싱한', fatty: '기름진' };
export const DISH_MODIFIER_EN: Record<DishNameModifier, string> = { burnt: 'Burnt', prime: 'Prime', fresh: 'Fresh', fatty: 'Fatty' };

/** 기본 이름 — 어종이 있고 틀이 있으면 `우럭 매운탕`, 아니면 레시피 이름 */
export function dishBaseName(recipeId: string, recipeNameKo: string, recipeNameEn: string, speciesKo?: string | null, speciesEn?: string | null): { ko: string; en: string } {
  const t = RECIPE_BASE_NAME[recipeId];
  if (t && speciesKo) return { ko: t.ko(speciesKo), en: t.en(speciesEn ?? speciesKo) };
  return { ko: recipeNameKo, en: recipeNameEn };
}

/** 받침에 따라 `으로`/`로` */
export function particleEuro(word: string): string {
  const ch = word.charCodeAt(word.length - 1);
  if (ch < 0xac00 || ch > 0xd7a3) return '로';
  const jong = (ch - 0xac00) % 28;
  return jong === 0 || jong === 8 ? '로' : '으로';
}

/** 변형 설명 — 전용 로어가 없으면 `감성돔으로 끓인 …` 문장을 만든다 */
export function variantDescription(recipeId: string, speciesId: string | null, speciesKo: string | null, speciesEn: string | null): { ko: string; en: string } {
  const lore = RECIPE_LORE[recipeId];
  const own = speciesId ? DISH_VARIANT_LORE[recipeId]?.[speciesId] : undefined;
  if (own) return { ko: own.descKo, en: own.descEn };
  const shortKo = lore?.shortDescriptionKo ?? '';
  const shortEn = lore?.shortDescriptionEn ?? '';
  if (!speciesKo) return { ko: shortKo, en: shortEn };
  return { ko: `${speciesKo}${particleEuro(speciesKo)} 만든 ${shortKo}`, en: `Made with ${speciesEn ?? speciesKo}. ${shortEn}` };
}
