/**
 * @file TrimPartArt.ts
 * @description 327차 — 어종별 손질 부산물 그림 목록(머리 · 척추뼈 · 332 가마살). **자동 생성 — 손으로 고치지 않는다**(`node tools/gemini_trim_art.cjs --bake`).
 *  그림은 `public/trimmings/sp/<종류>_<어종>.png`(긴 변 192px), 텍스처 키는 `trimpart_<종류>_<어종>`.
 */

export type TrimPartKind = 'head' | 'spine' | 'kama';

/** 어종 → 그 어종 그림이 있는 부산물 종류 */
export const TRIM_PART_ART: Readonly<Record<string, readonly TrimPartKind[]>> = {
  amberjack: ['head', 'spine', 'kama'],
  anchovy: ['head', 'spine'],
  bigeye_tuna: ['head', 'spine', 'kama'],
  black_rockfish: ['head', 'spine'],
  blue_rockfish: ['head', 'spine'],
  bluefin_tuna: ['head', 'spine', 'kama'],
  chub_mackerel: ['head', 'spine'],
  flounder: ['head', 'spine'],
  frog_flounder: ['head', 'spine'],
  gizzard_shad: ['head', 'spine'],
  golden_rockfish: ['head', 'spine'],
  greater_amberjack: ['kama'],
  halfbeak: ['head', 'spine'],
  horse_mackerel: ['head', 'spine'],
  largescale_blackfish: ['head', 'spine'],
  longtail_blackfish: ['head', 'spine'],
  longtooth_grouper: ['head', 'spine', 'kama'],
  northern_whiting: ['head', 'spine'],
  pacific_herring: ['head', 'spine'],
  pacific_saury: ['head', 'spine'],
  rainbow_wrasse: ['head', 'spine'],
  red_seabream: ['head', 'spine'],
  red_snapper_rockfish: ['head', 'spine'],
  redlip_mullet: ['head', 'spine'],
  redspotted_grouper: ['head', 'spine'],
  round_herring: ['head', 'spine'],
  sawedged_perch: ['head', 'spine', 'kama'],
  sea_bass: ['head', 'spine'],
  sevenband_grouper: ['head', 'spine', 'kama'],
  spanish_mackerel: ['head', 'spine'],
  spotted_knifejaw: ['head', 'spine'],
  starry_flounder: ['head', 'spine'],
  stone_beakperch: ['head', 'spine'],
  striped_marlin: ['head', 'spine', 'kama'],
  striped_mullet: ['head', 'spine'],
  surfperch: ['head', 'spine'],
  swordfish: ['head', 'spine', 'kama'],
  tonguefish: ['head', 'spine'],
  white_croaker: ['head', 'spine'],
  yellow_croaker: ['head', 'spine'],
  yellowfin_goby: ['head', 'spine'],
  yellowtail: ['head', 'spine', 'kama'],
};

/** 같은 생물종(참돔 야간 = 참돔) — 그 어종 그림을 쓴다 */
export const TRIM_PART_ALIAS: Readonly<Record<string, string>> = {"night_seabream":"red_seabream"};
