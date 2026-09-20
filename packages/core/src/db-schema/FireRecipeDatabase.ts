/**
 * @file FireRecipeDatabase.ts
 * @description 불요리 레시피 9종 (154차 — 스펙 §2)
 *
 * ⚖ 레시피는 **필수 요소 + 부가 고급화**로 적는다 — 창작 요리는 없다. 특정 요리명을 표방하려면
 *   (155차) `vitals`의 허기·수분은 `FoodNutrition.ts` 1인분 영양(kcal ÷ 2,400 · ml ÷ 2,000)에서 파생한 값이다.
 *   `required`가 전부 들어가야 하고, `optional`은 NORMAL 기준 고급화(완성도 +), 종류 상한 초과·택1 위반은 감점.
 * ⚖ 투입 단계는 **보편적인 순서**(사용자 지시): 탕 = 물·무·주재료 → 끓으면 양념·채소 → 주재료 익으면 간 → 마무리 향채.
 * ⚖ 주재료 g 범위는 2인분 기준 — 상한을 넘기면 투입 거부(냄비 용량과 별개).
 */

import type { FireRecipeDef, RecipeIngredientReq, RecipeStageDef } from '../types/Cooking.js';

const R = (ing: string | string[], role: RecipeIngredientReq['role'], min: number, max: number, stage: number,
  extra: Partial<Pick<RecipeIngredientReq, 'ideal' | 'onlyWith'>> = {}): RecipeIngredientReq =>
  ({ ing, role, min, max, stage, ...extra });

const ST = (labelKo: string, labelEn: string, trigger: RecipeStageDef['trigger']): RecipeStageDef => ({ labelKo, labelEn, trigger });

/** 탕 계열 공통 단계 */
const STEW_STAGES: RecipeStageDef[] = [
  ST('물·무·주재료를 넣고 끓인다', 'Add water, radish and the main ingredient; bring to a boil', 'start'),
  ST('끓으면 양념과 채소를 넣는다', 'Once boiling, add seasonings and vegetables', 'boil'),
  ST('주재료가 익으면 간을 본다', 'When the main ingredient is cooked, adjust seasoning', 'mainCooked'),
  ST('마지막에 향채·고추를 넣고 한소끔', 'Finish with herbs and chili; one last boil', 'final'),
];

const GRILL_STAGES: RecipeStageDef[] = [
  ST('팬/석쇠를 달구고 기름을 두른다', 'Heat the pan/grate and oil it', 'start'),
  ST('달궈지면 생선을 올리고 소금을 뿌린다', 'When hot, lay the fish and salt it', 'boil'),
  ST('한 면이 익으면 뒤집는다', 'Flip when one side is done', 'mainCooked'),
  ST('마무리 향을 올린다', 'Finish with pepper or lemon', 'final'),
];

const STIRFRY_STAGES: RecipeStageDef[] = [
  ST('팬을 달구고 기름·마늘·양파를 볶는다', 'Heat the pan; fry oil, garlic and onion', 'start'),
  ST('오징어와 양념을 넣고 센 불에 볶는다', 'Add squid and sauce; stir-fry on high', 'boil'),
  ST('오징어가 익으면 대파·고추를 넣는다', 'When the squid is done, add green onion and chili', 'mainCooked'),
  ST('불을 끄고 참기름·후추로 마무리', 'Off heat — sesame oil and pepper', 'final'),
];

const PORRIDGE_STAGES: RecipeStageDef[] = [
  ST('참기름에 쌀과 전복을 볶는다', 'Fry rice and abalone in sesame oil', 'start'),
  ST('물을 붓고 끓인다', 'Add water and bring to a boil', 'boil'),
  ST('쌀이 퍼지면 중불로 저어가며 뭉근히 끓인다', 'When the rice opens, keep it at a gentle boil and stir', 'mainCooked'),
  ST('소금으로 간을 맞춘다', 'Season with salt', 'final'),
];

export const FIRE_RECIPES: FireRecipeDef[] = [
  {
    id: 'stew_red', nameKo: '서더리 매운탕', nameEn: 'Fish-frame maeuntang', family: 'stew_red',
    descKo: '감성돔·우럭 등 생선의 머리와 뼈인 서더리로 국물을 낸 얼큰한 탕.',
    descEn: 'A spicy maeuntang made from a fish head and frame with chili flakes and garlic.',
    cookware: ['pot'],
    required: [
      R('seodeori', 'main', 300, 1400, 0),
      R('water', 'liquid', 3, 7, 0, { ideal: 4 }),
      R('radish', 'base', 1, 3, 0),
      R('gochugaru', 'season', 1, 4, 1, { ideal: 2 }),
      R('garlic', 'season', 0.5, 2, 1, { ideal: 1 }),
      R('salt', 'season', 0.5, 3, 2, { ideal: 1 }),
      R('leek', 'finish', 1, 3, 3),
    ],
    optional: [
      R('onion', 'veg', 1, 2, 1), R('bean_sprout', 'veg', 1, 2, 1),
      R(['soy', 'fish_sauce'], 'season', 0.5, 1.5, 2, { ideal: 1 }),
      R(['crown_daisy', 'water_parsley'], 'finish', 1, 2, 3),
      R(['chili_green', 'chili_red'], 'finish', 1, 2, 3),
    ],
    maxExtraKinds: 4, targetSaltPct: 1.0, targetSugarSpoons: 0,
    stages: STEW_STAGES, doneWhen: 'mainCooked', tempBand: [85, 100], servingC: 70, coolTauMin: 35, textureDecayPerHour: 0.12,
    cookMin: 25, servings: 2, baseValueKrw: 24000,
    vitals: { hungerRestore: 22, hydrationRestore: 19, hpRestore: 25, fatigueRestore: 18, drainBuffMult: 0.85, drainBuffMin: 30 },
  },
  {
    id: 'stew_red_whole', nameKo: '통생선 매운탕', nameEn: 'Whole-fish maeuntang', family: 'stew_red',
    descKo: '어종 하나를 통째로 넣어 살과 국물을 함께 즐기는 얼큰한 탕.',
    descEn: 'A spicy maeuntang made with one whole fish, keeping its flesh and broth together.',
    cookware: ['pot'],
    required: [
      R('fish', 'main', 300, 1400, 0),
      R('water', 'liquid', 3, 7, 0, { ideal: 4 }),
      R('radish', 'base', 1, 3, 0),
      R('gochugaru', 'season', 1, 4, 1, { ideal: 2 }),
      R('garlic', 'season', 0.5, 2, 1, { ideal: 1 }),
      R('salt', 'season', 0.5, 3, 2, { ideal: 1 }),
      R('leek', 'finish', 1, 3, 3),
    ],
    optional: [
      R('onion', 'veg', 1, 2, 1), R('bean_sprout', 'veg', 1, 2, 1),
      R(['soy', 'fish_sauce'], 'season', 0.5, 1.5, 2, { ideal: 1 }),
      R(['crown_daisy', 'water_parsley'], 'finish', 1, 2, 3),
      R(['chili_green', 'chili_red'], 'finish', 1, 2, 3),
    ],
    maxExtraKinds: 4, targetSaltPct: 1.0, targetSugarSpoons: 0,
    stages: STEW_STAGES, doneWhen: 'mainCooked', tempBand: [85, 100], servingC: 70, coolTauMin: 35, textureDecayPerHour: 0.12,
    cookMin: 25, servings: 2, baseValueKrw: 26000,
    vitals: { hungerRestore: 24, hydrationRestore: 19, hpRestore: 28, fatigueRestore: 18, drainBuffMult: 0.85, drainBuffMin: 30 },
  },
  {
    id: 'stew_clear', nameKo: '지리 (맑은탕)', nameEn: 'Clear fish soup (Jiri)', family: 'stew_clear',
    descKo: '무와 대파로 시원하게 끓인 백탕. 생선 맛이 그대로 난다.',
    descEn: 'A clear soup of fish with radish and green onion — the fish speaks for itself.',
    cookware: ['pot'],
    required: [
      R(['fish', 'fish_dressed', 'seodeori'], 'main', 300, 1400, 0),
      R('water', 'liquid', 3, 7, 0, { ideal: 4 }),
      R('radish', 'base', 1, 3, 0),
      R('garlic', 'season', 0.5, 1.5, 1, { ideal: 0.5 }),
      R('salt', 'season', 0.5, 3, 2, { ideal: 1 }),
      R('leek', 'finish', 1, 3, 3),
    ],
    optional: [
      R('bean_sprout', 'veg', 1, 2, 1), R('water_parsley', 'finish', 1, 2, 3),
      R('soy', 'season', 0.5, 1, 2, { ideal: 0.5 }),
      R(['chili_green', 'chili_red'], 'finish', 1, 2, 3),
    ],
    maxExtraKinds: 4, targetSaltPct: 0.9, targetSugarSpoons: 0,
    stages: STEW_STAGES, doneWhen: 'mainCooked', tempBand: [85, 100], servingC: 70, coolTauMin: 35, textureDecayPerHour: 0.12,
    cookMin: 22, servings: 2, baseValueKrw: 22000,
    vitals: { hungerRestore: 18, hydrationRestore: 21, hpRestore: 30, fatigueRestore: 20, drainBuffMult: 0.85, drainBuffMin: 30 },
  },
  {
    id: 'grill_fish', nameKo: '생선구이', nameEn: 'Grilled fish', family: 'grill',
    descKo: '소금 뿌려 팬이나 석쇠에 굽는다. 겉은 바삭, 속은 촉촉이 전부다.',
    descEn: 'Salted and grilled on a pan or grate — crisp outside, moist inside.',
    cookware: ['pan', 'grate'],
    required: [
      R(['fish_dressed', 'fish'], 'main', 200, 900, 1),
      R('salt', 'season', 0.25, 0.75, 1, { ideal: 0.25 }),
      R('cooking_oil', 'oil', 0.5, 2, 0, { ideal: 1, onlyWith: 'pan' }),
    ],
    optional: [R('pepper', 'season', 0.25, 0.5, 3), R('lemon', 'finish', 1, 1, 3)],
    maxExtraKinds: 2, targetSaltPct: 1.0, targetSugarSpoons: 0,
    stages: GRILL_STAGES, doneWhen: 'mainCooked', tempBand: [160, 210], servingC: 60, coolTauMin: 15, textureDecayPerHour: 0.30,
    flipEverySec: 240, cookMin: 12, servings: 1, baseValueKrw: 16000,
    vitals: { hungerRestore: 18, hydrationRestore: 2, hpRestore: 25, fatigueRestore: 12 },
  },
  {
    id: 'braise_fish', nameKo: '생선조림', nameEn: 'Braised fish (Jorim)', family: 'braise',
    descKo: '무를 깔고 간장·고춧가루 양념으로 국물을 졸여 낸다.',
    descEn: 'Fish braised over radish in a soy-chili sauce until the liquid reduces.',
    cookware: ['pot'],
    required: [
      R(['fish_dressed', 'fish'], 'main', 300, 1200, 1),
      R('water', 'liquid', 1, 2, 0, { ideal: 1.5 }),
      R('radish', 'base', 1, 3, 0),
      R('soy_dark', 'season', 1, 4, 1, { ideal: 2.5 }),
      R('gochugaru', 'season', 0.5, 3, 1, { ideal: 1.5 }),
      R('garlic', 'season', 0.5, 2, 1, { ideal: 1 }),
      R('sugar', 'season', 0.5, 3, 1, { ideal: 1.5 }),
    ],
    optional: [
      R('onion', 'veg', 1, 2, 1), R('leek', 'finish', 1, 2, 3), R('ginger', 'season', 0.3, 1, 1),
      R(['chili_green', 'chili_red'], 'finish', 1, 2, 3),
    ],
    maxExtraKinds: 3, targetSaltPct: 0.8, targetSugarSpoons: 1.5,
    stages: STEW_STAGES, doneWhen: 'reduced', tempBand: [85, 100], servingC: 65, coolTauMin: 30, textureDecayPerHour: 0.10,
    cookMin: 28, servings: 2, baseValueKrw: 26000,
    vitals: { hungerRestore: 23, hydrationRestore: 6, hpRestore: 30, fatigueRestore: 15 },
  },
  {
    id: 'stirfry_squid', nameKo: '오징어볶음', nameEn: 'Stir-fried squid', family: 'stirfry',
    descKo: '센 불에 재빨리 볶는다. 오래 두면 질겨진다.',
    descEn: 'Stir-fried fast on high heat — linger and it turns rubbery.',
    cookware: ['pan'],
    required: [
      R('squid', 'main', 200, 800, 1),
      R('cooking_oil', 'oil', 0.5, 2, 0, { ideal: 1 }),
      R(['gochujang', 'gochugaru'], 'season', 1, 3, 1, { ideal: 1.5 }),
      R('garlic', 'season', 0.5, 2, 0, { ideal: 1 }),
      R('sugar', 'season', 0.5, 2, 1, { ideal: 1 }),
      R('soy_dark', 'season', 0.5, 2, 1, { ideal: 1 }),
      R('onion', 'veg', 1, 2, 0),
      R('leek', 'finish', 1, 2, 2),
    ],
    optional: [
      R('carrot', 'veg', 1, 1, 0), R('pepper', 'season', 0.25, 0.5, 3), R('sesame_oil', 'oil', 0.25, 1, 3),
      R(['chili_green', 'chili_red'], 'finish', 1, 2, 2),
    ],
    maxExtraKinds: 3, targetSaltPct: 0.75, targetSugarSpoons: 1.5,
    stages: STIRFRY_STAGES, doneWhen: 'mainCooked', tempBand: [175, 260], servingC: 60, coolTauMin: 18, textureDecayPerHour: 0.25,
    flipEverySec: 45, cookMin: 8, servings: 2, baseValueKrw: 20000,
    vitals: { hungerRestore: 20, hydrationRestore: 3, hpRestore: 20, fatigueRestore: 10 },
  },
  {
    id: 'soup_clam', nameKo: '조개탕', nameEn: 'Clam soup', family: 'stew_clear',
    descKo: '바지락·홍합·굴로 끓이는 맑은 국. 채집한 것을 먹는 가장 빠른 길.',
    descEn: 'A clear soup of clams, mussels or oysters — the quickest way to eat what you gathered.',
    cookware: ['pot'],
    required: [
      R(['clam', 'mussel', 'oyster'], 'main', 250, 1000, 0),
      R('water', 'liquid', 3, 6, 0, { ideal: 4 }),
      R('garlic', 'season', 0.5, 1.5, 1, { ideal: 0.5 }),
      R('salt', 'season', 0.25, 2, 2, { ideal: 0.75 }),
      R('leek', 'finish', 1, 2, 3),
    ],
    optional: [R('radish', 'base', 1, 1, 0), R('water_parsley', 'finish', 1, 2, 3), R(['chili_green', 'chili_red'], 'finish', 1, 2, 3)],
    maxExtraKinds: 3, targetSaltPct: 0.8, targetSugarSpoons: 0,
    stages: STEW_STAGES, doneWhen: 'mainCooked', tempBand: [85, 100], servingC: 70, coolTauMin: 30, textureDecayPerHour: 0.15,
    cookMin: 14, servings: 2, baseValueKrw: 18000,
    vitals: { hungerRestore: 13, hydrationRestore: 22, hpRestore: 25, fatigueRestore: 18, drainBuffMult: 0.9, drainBuffMin: 20 },
  },
  {
    id: 'porridge_abalone', nameKo: '전복죽', nameEn: 'Abalone porridge', family: 'porridge',
    descKo: '참기름에 볶은 쌀과 전복을 약불로 오래 끓인다. 보양식.',
    descEn: 'Rice and abalone fried in sesame oil, then simmered long on low heat. Restorative.',
    cookware: ['pot'],
    required: [
      R('abalone', 'main', 120, 500, 0),
      R('rice', 'grain', 1, 2, 0),
      R('sesame_oil', 'oil', 0.5, 2, 0, { ideal: 1 }),
      R('water', 'liquid', 4, 8, 1, { ideal: 6 }),
      R('salt', 'season', 0.25, 2, 3, { ideal: 0.75 }),
    ],
    optional: [R('carrot', 'veg', 1, 1, 1), R('onion', 'veg', 1, 1, 1)],
    maxExtraKinds: 2, targetSaltPct: 0.7, targetSugarSpoons: 0,
    stages: PORRIDGE_STAGES, doneWhen: 'allCooked', tempBand: [85, 100], servingC: 65, coolTauMin: 40, textureDecayPerHour: 0.08,
    flipEverySec: 180, cookMin: 30, servings: 2, baseValueKrw: 32000,
    vitals: { hungerRestore: 19, hydrationRestore: 15, hpRestore: 40, fatigueRestore: 32, drainBuffMult: 0.75, drainBuffMin: 45 },
  },
  {
    id: 'grill_eel', nameKo: '장어구이', nameEn: 'Grilled eel', family: 'grill',
    descKo: '간장·설탕·마늘 양념을 발라 굽는다. 피로가 풀린다.',
    descEn: 'Eel brushed with soy, sugar and garlic and grilled. Takes the tiredness off.',
    cookware: ['grate', 'pan'],
    required: [
      R('eel', 'main', 250, 900, 1),
      R('soy_dark', 'season', 1, 3, 1, { ideal: 1.5 }),
      R('sugar', 'season', 0.5, 2, 1, { ideal: 1 }),
      R('garlic', 'season', 0.5, 1.5, 1, { ideal: 0.5 }),
      R('cooking_oil', 'oil', 0.5, 2, 0, { ideal: 1, onlyWith: 'pan' }),
    ],
    optional: [R('ginger', 'season', 0.25, 1, 1), R('pepper', 'season', 0.25, 0.5, 3)],
    maxExtraKinds: 2, targetSaltPct: 0.7, targetSugarSpoons: 1.5,
    stages: GRILL_STAGES, doneWhen: 'mainCooked', tempBand: [160, 210], servingC: 60, coolTauMin: 15, textureDecayPerHour: 0.28,
    flipEverySec: 200, cookMin: 15, servings: 1, baseValueKrw: 38000,
    vitals: { hungerRestore: 32, hydrationRestore: 2, hpRestore: 45, fatigueRestore: 38, drainBuffMult: 0.7, drainBuffMin: 60 },
  },
];

const BY_ID = new Map(FIRE_RECIPES.map((r) => [r.id, r]));
export function getFireRecipe(id: string): FireRecipeDef | undefined {
  return BY_ID.get(id);
}

/** 이 용기로 만들 수 있는 레시피 */
export function recipesForCookware(kind: import('../types/Cooking.js').CookwareKind): FireRecipeDef[] {
  return FIRE_RECIPES.filter((r) => r.cookware.includes(kind));
}

export const RECIPE_FAMILY_KO: Record<import('../types/Cooking.js').RecipeFamily, string> = {
  stew_red: '빨간탕', stew_clear: '백탕', grill: '구이', braise: '조림', stirfry: '볶음', porridge: '죽',
};
