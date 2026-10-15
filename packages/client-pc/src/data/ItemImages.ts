/**
 * @file ItemImages.ts
 * @description 255차 — 장비 밖 아이템 그림(Gemini) 표 · 별칭 (자동 생성 — `node tools/item_cards.cjs` · 수동 편집 금지)
 *
 * 원본은 `food assets/items/<파일>`, 생김새는 `tools/item_looks/*.cjs`(생성기 `tools/gemini_item_art.cjs`).
 * 게임은 카드(`items/<파일>` — 상세 창 칸 228×90 안)와 64px 아이콘(`items/icon/<파일>` → `<키>__icon`)만 싣는다(`scenes/BootScene.ts`).
 * 어느 아이템이 어느 그림을 쓰는지는 `ui/ItemIcon.ts`가 정한다 — 아이템 id(`ITEM_IMAGE_BY_ID`) → 16px 키(`ITEM_IMAGE_BY_PX`) →
 * 원래 텍스처 키(옛 코드 그림 키 `art_*`는 키를 그대로 두고 그림만 바뀐다 — `tools/item_art/build.py`가 그 키를 굽지 않는다).
 */

/** 텍스처 키 → 파일(카드 `items/<파일>` · 아이콘 `items/icon/<파일>`) */
export const ITEM_IMAGE_FILES: Record<string, string> = {
};

/** 아이템 id → 텍스처 키(가구처럼 텍스처 키가 필드 그림을 가리키는 아이템) */
export const ITEM_IMAGE_BY_ID: Record<string, string> = {
};

/** 16px 아이콘 키(`px:…`) → 텍스처 키(씨앗 · 모종 · 농사 도구처럼 16px 손그림만 있던 것) */
export const ITEM_IMAGE_BY_PX: Record<string, string> = {
};

/** 옛 그림 키 → 작물 초상 id — 상점 요리 재료 채소가 같은 작물의 수확물과 같은 그림을 쓴다 */
export const ITEM_CROP_PORTRAIT_ALIAS: Record<string, string> = {
  art_bean_sprout: 'crop_bean_sprout',
  art_carrot: 'crop_carrot',
  art_chili_green: 'crop_cheongyang',
  art_chili_red: 'crop_chili_red',
  art_crown_daisy: 'crop_crown_daisy',
  art_ginger: 'crop_ginger',
  art_leek: 'crop_leek',
  art_onion: 'crop_onion',
  art_radish: 'crop_radish',
  art_water_parsley: 'crop_water_parsley',
};

/** 옛 그림 키 → 다른 텍스처 키 — 같은 음식은 어디서나 같은 그림(상점 전복죽 = 불요리 전복죽) */
export const ITEM_TEXTURE_ALIAS: Record<string, string> = {
  art_meal_soup: 'food_stew_red_whole',
  'px:it_dish_stew_red': 'food_stew_red_whole',
};
