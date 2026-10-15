/**
 * @file _alias.cjs
 * @description 255차 — 그림 별칭(새로 그리지 않고 이미 있는 그림을 가리킨다). `tools/item_cards.cjs`가 읽어 `src/data/ItemImages.ts`에 싣는다.
 *
 *  CROP_PORTRAIT — 옛 코드 그림 키 → 작물 초상 id. 상점 요리 재료 채소(154차 `cook_*` — 코드로 그린 그림)가
 *    같은 채소의 수확물(241 · 244차 작물 초상)과 같은 그림을 쓴다(사용자 지적: 「한 개 그림은 각각 '작물'에서 따와도 될 것 같은데」).
 *    키를 그대로 두고 보이는 그림만 바꾸므로 세이브 · 카탈로그의 `iconTexture`를 고칠 필요가 없다.
 *  TEXTURE — 옛 그림 키(또는 16px 키) → 다른 텍스처 키. 같은 음식은 어디서나 같은 그림이다
 *    (상점 전복죽 = 불요리 전복죽 · 상점 매운탕 = 통생선 매운탕 · 예전에 만든 요리의 `px:it_dish_<계열>` = 그 레시피 그림).
 */
'use strict';

module.exports = {
  CROP_PORTRAIT: {
    art_radish: 'crop_radish',            // 무
    art_leek: 'crop_leek',                // 대파
    art_onion: 'crop_onion',              // 양파
    art_bean_sprout: 'crop_bean_sprout',  // 콩나물
    art_carrot: 'crop_carrot',            // 당근
    art_crown_daisy: 'crop_crown_daisy',  // 쑥갓
    art_water_parsley: 'crop_water_parsley', // 미나리
    art_chili_green: 'crop_cheongyang',   // 청양고추(상점 이름이 청양고추 — 풋고추 초상이 아니다)
    art_chili_red: 'crop_chili_red',      // 홍고추
    art_ginger: 'crop_ginger',            // 생강
  },
  TEXTURE: {
    art_meal_soup: 'food_stew_red_whole',        // 상점 「매운탕」 = 통생선 매운탕
    art_meal_abalone: 'food_porridge_abalone',   // 상점 전복죽
    art_meal_eel: 'food_grill_eel',              // 상점 장어구이
    art_dish_stew_clear: 'food_stew_clear',      // 예전에 만든 지리 · 조개탕(계열 그림)
    art_dish_braise: 'food_braise_fish',
    art_dish_stirfry: 'food_stirfry_squid',
    'px:it_dish_stew_red': 'food_stew_red_whole',
    'px:it_dish_stew_clear': 'food_stew_clear',
    'px:it_dish_porridge': 'food_porridge_abalone',
    'px:it_dish_grill': 'food_grill_fish',
    'px:it_dish_braise': 'food_braise_fish',
    'px:it_dish_stirfry': 'food_stirfry_squid',
  },
};
