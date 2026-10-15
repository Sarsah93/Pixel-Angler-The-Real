/**
 * @file RecipeLore.ts
 * @description 레시피 로어(짧은 설명·요리 팁·재료 팁) + 어종별 변형 이름·설명 (156차 — 확장 스펙 §14·§31·§32)
 *
 * ⚖ 레시피 정본은 154차 `FireRecipeDatabase.ts`다. 여기는 **말**만 둔다(설명·이름 규칙) — 조리 수치를 적지 않는다.
 * ⚖ 이름 규칙(§14~15): 기본 = `우럭 매운탕`. 수식어는 **최대 1개**, 우선순위 탄 → 일품 → 싱싱한 → 기름진 → 없음.
 * ⚖ 255차(Stage 7): 전복죽을 뺀 여덟 레시피가 주재료로 이름이 갈린다 — `우럭 지리 (맑은탕)` · `고등어구이` · `갈치조림` ·
 *   `한치볶음` · `바지락탕` · `붕장어구이`. 이름에 쓰는 어종 이름은 상에 오를 때 부르는 이름이다(`DISH_SPECIES_NAME` — 조피볼락 → 우럭).
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

/** 어종별 변형 전용 설명 (§4 — 매운탕 3종 · 255차 대표 조합). 없으면 `variantDescription()`이 틀(`RECIPE_VARIANT_DESC`)로 문장을 만든다 */
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
  // ── 255차 — 이름난 조합만 따로 적는다(나머지는 틀 문장) ──
  stew_clear: {
    black_rockfish: { descKo: '우럭으로 끓인 맑은 탕. 탄탄한 살과 시원한 국물이 그대로 산다.', descEn: 'A clear soup of rockfish — firm flesh and a clean, refreshing broth.' },
    pacific_cod: { descKo: '대구 살이 부드럽게 풀어지는 맑은 탕. 지리 하면 먼저 떠오르는 시원한 맛이다.', descEn: 'A clear soup where tender cod flakes into the broth — the taste most people think of first.' },
    tiger_puffer: { descKo: '참복어로 끓인 맑은 탕. 살은 쫄깃하고 국물은 맑고 깊다.', descEn: 'A clear soup of tiger puffer — chewy flesh, a clear and deep broth.' },
  },
  grill_fish: {
    chub_mackerel: { descKo: '기름이 자글자글 배어 나오도록 구운 고등어. 고소하지만 비린 향도 함께 올라온다.', descEn: 'Mackerel grilled until the oil sizzles out — rich and savoury, with a fishy edge.' },
    blackthroat_seaperch: { descKo: '기름이 많아 살이 입에서 녹는 눈볼대를 소금만 뿌려 구운 것.', descEn: 'Blackthroat seaperch grilled with salt — so rich in oil the flesh melts in the mouth.' },
  },
  braise_fish: {
    hairtail: { descKo: '무와 함께 매콤하게 졸인 갈치. 부드러운 살이 양념을 머금는다.', descEn: 'Hairtail braised spicy with radish — the soft flesh soaks up the sauce.' },
  },
  stirfry_squid: {
    swordtip_squid: { descKo: '연하고 단 한치를 센 불에 짧게 볶아 낸 것.', descEn: 'Tender, sweet swordtip squid flash-fried on high heat.' },
    squid: { descKo: '두툼하고 단 무늬오징어를 고추장 양념에 볶아 낸 것.', descEn: 'Thick, sweet bigfin reef squid stir-fried in gochujang sauce.' },
    cuttlefish: { descKo: '두툼한 갑오징어 살을 매콤하게 볶아 씹는 맛이 살아 있다.', descEn: 'Thick cuttlefish stir-fried spicy — it keeps its bite.' },
  },
  grill_eel: {
    conger_eel: { descKo: '기름진 붕장어에 양념을 발라 가며 구운 것. 피로가 풀린다.', descEn: 'Fatty conger eel grilled while basted with sauce. Takes the tiredness off.' },
    hagfish: { descKo: '쫄깃한 먹장어를 간장 양념에 구운 것. 씹을수록 고소하다.', descEn: 'Chewy hagfish grilled in soy sauce — the more you chew, the richer it gets.' },
  },
};

/**
 * 어종 변형 설명 틀 (255차) — 전용 로어가 없는 조합의 문장. `sp` = 상에 오르는 이름(`우럭` · `고등어`).
 * 156차 자동 문장(「고등어로 만든 생선의 머리와 뼈인 서더리로 …」)이 어색해 레시피마다 한 문장을 둔다.
 */
export const RECIPE_VARIANT_DESC: Record<string, { ko: (sp: string) => string; en: (sp: string) => string }> = {
  stew_red: {
    ko: (sp) => `${sp} 머리와 뼈로 국물을 낸 얼큰한 서더리 매운탕.`,
    en: (sp) => `A spicy maeuntang with a broth drawn from ${sp} head and bones.`,
  },
  stew_red_whole: {
    ko: (sp) => `${sp} 한 마리를 통째로 넣어 살과 국물을 함께 즐기는 얼큰한 매운탕.`,
    en: (sp) => `A spicy maeuntang with a whole ${sp}, flesh and broth together.`,
  },
  stew_clear: {
    ko: (sp) => `${sp}${particleEuro(sp)} 끓인 맑은 탕. 무와 대파만 더해 ${sp} 맛이 그대로 난다.`,
    en: (sp) => `A clear soup of ${sp} — only radish and green onion, so the fish speaks for itself.`,
  },
  grill_fish: {
    ko: (sp) => `소금만 뿌려 겉은 바삭하게, 속은 촉촉하게 구운 ${sp}.`,
    en: (sp) => `${sp} grilled with salt — crisp outside, moist inside.`,
  },
  braise_fish: {
    ko: (sp) => `무를 깔고 간장 · 고춧가루 양념에 졸여 낸 ${sp}.`,
    en: (sp) => `${sp} braised over radish in a soy-chili sauce.`,
  },
  stirfry_squid: {
    ko: (sp) => `고추장 양념에 센 불로 짧게 볶아 낸 ${sp}.`,
    en: (sp) => `${sp} flash-fried on high heat in gochujang sauce.`,
  },
  soup_clam: {
    ko: (sp) => `${sp}만으로 국물을 낸 개운한 탕.`,
    en: (sp) => `A light soup whose broth comes from ${sp} alone.`,
  },
  grill_eel: {
    ko: (sp) => `간장 · 설탕 · 마늘 양념을 발라 구운 ${sp}.`,
    en: (sp) => `${sp} brushed with soy, sugar and garlic, then grilled.`,
  },
};

/**
 * 요리 이름에 쓰는 어종 이름 (255차) — 도감의 정식 이름과 상에 오르는 이름이 다른 것만.
 * 나머지는 정식 이름에서 괄호 별칭을 뗀 것(`광어(넙치)` → `광어` · `홍합 (섭)` → `홍합` · `한치(창꼴뚜기)` → `한치`).
 */
export const DISH_SPECIES_NAME: Record<string, { ko: string; en: string }> = {
  black_rockfish: { ko: '우럭', en: 'Rockfish' },     // 조피볼락 — 매운탕 · 지리는 「우럭」으로 부른다
  chub_mackerel: { ko: '고등어', en: 'Mackerel' },
  pacific_cod: { ko: '대구', en: 'Cod' },             // 「태평양 대구구이」가 아니라 「대구구이」 · 「대구 지리」
};

/** 틀로 만든 이름이 어색한 조합만 통째로 (255차) — 굴은 「굴탕」보다 「굴국」이다 */
export const DISH_VARIANT_NAME: Record<string, Record<string, { ko: string; en: string }>> = {
  soup_clam: { oyster_gigas: { ko: '굴국', en: 'Oyster Soup' } },
};

/**
 * 어종 이름이 앞에 붙는 레시피의 이름 틀 — `ko(어종)` / `en(Species)`.
 * 255차 — 지리는 게임의 레시피 이름 띄어쓰기(「지리 (맑은탕)」)를 그대로 잇는다 · 볶음 · 조개탕 추가.
 */
export const RECIPE_BASE_NAME: Record<string, { ko: (sp: string) => string; en: (sp: string) => string }> = {
  stew_red: { ko: (sp) => `${sp} 서더리 매운탕`, en: (sp) => `${sp} Fish-frame Maeuntang` },
  stew_red_whole: { ko: (sp) => `${sp} 매운탕`, en: (sp) => `${sp} Maeuntang` },
  stew_clear: { ko: (sp) => `${sp} 지리 (맑은탕)`, en: (sp) => `${sp} Jiri (clear soup)` },
  grill_fish: { ko: (sp) => `${sp}구이`, en: (sp) => `Grilled ${sp}` },
  braise_fish: { ko: (sp) => `${sp}조림`, en: (sp) => `Braised ${sp}` },
  stirfry_squid: { ko: (sp) => `${sp}볶음`, en: (sp) => `Stir-fried ${sp}` },
  soup_clam: { ko: (sp) => `${sp}탕`, en: (sp) => `${sp} Soup` },
  grill_eel: { ko: (sp) => `${sp}구이`, en: (sp) => `Grilled ${sp}` },
};

export const DISH_MODIFIER_KO: Record<DishNameModifier, string> = { burnt: '탄', prime: '일품', fresh: '싱싱한', fatty: '기름진' };
export const DISH_MODIFIER_EN: Record<DishNameModifier, string> = { burnt: 'Burnt', prime: 'Prime', fresh: 'Fresh', fatty: 'Fatty' };

/**
 * 기본 이름 — 어종이 있고 틀이 있으면 `우럭 매운탕`, 아니면 레시피 이름.
 * `speciesId`를 주면 통째 이름 예외(`DISH_VARIANT_NAME` — 굴국)를 먼저 본다.
 */
export function dishBaseName(
  recipeId: string, recipeNameKo: string, recipeNameEn: string, speciesKo?: string | null, speciesEn?: string | null, speciesId?: string | null,
): { ko: string; en: string } {
  const own = speciesId ? DISH_VARIANT_NAME[recipeId]?.[speciesId] : undefined;
  if (own && speciesKo) return { ko: own.ko, en: own.en };
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

/** 변형 설명 — 전용 로어 → 레시피 틀(`RECIPE_VARIANT_DESC`) → `감성돔으로 만든 …` 순 */
export function variantDescription(recipeId: string, speciesId: string | null, speciesKo: string | null, speciesEn: string | null): { ko: string; en: string } {
  const lore = RECIPE_LORE[recipeId];
  const own = speciesId ? DISH_VARIANT_LORE[recipeId]?.[speciesId] : undefined;
  if (own) return { ko: own.descKo, en: own.descEn };
  const shortKo = lore?.shortDescriptionKo ?? '';
  const shortEn = lore?.shortDescriptionEn ?? '';
  if (!speciesKo) return { ko: shortKo, en: shortEn };
  const tpl = RECIPE_VARIANT_DESC[recipeId];
  if (tpl) return { ko: tpl.ko(speciesKo), en: tpl.en(speciesEn ?? speciesKo) };
  return { ko: `${speciesKo}${particleEuro(speciesKo)} 만든 ${shortKo}`, en: `Made with ${speciesEn ?? speciesKo}. ${shortEn}` };
}
