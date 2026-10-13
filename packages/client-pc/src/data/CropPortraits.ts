/**
 * @file CropPortraits.ts
 * @description 241차 — 작물 초상이 있는 수확물 기본 id 목록(자동 생성 — `node tools/pixelize_crops.cjs`).
 *  BootScene이 `crops/<id>.png`(초상) · `crops/<id>_icon.png`(64px 아이콘)를 `cropimg_<id>` · `cropicon_<id>`로 싣는다.
 *  목록에 없는 작물은 16px 손그림 픽셀 아이콘(`px:<id>`)을 그대로 쓴다. 손으로 고치지 말 것.
 */
export const CROP_PORTRAITS: readonly string[] = [
  'crop_lettuce',
  'crop_peanut',
  'crop_strawberry',
];
