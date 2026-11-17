/**
 * @file TrimPartArt.ts
 * @description 327차 — 어종별 손질 부산물 그림 목록(머리 · 척추뼈). **자동 생성 — 손으로 고치지 않는다**(`node tools/gemini_trim_art.cjs --bake`).
 *  그림은 `public/trimmings/sp/<종류>_<어종>.png`(긴 변 192px), 텍스처 키는 `trimpart_<종류>_<어종>`.
 */

export type TrimPartKind = 'head' | 'spine';

/** 어종 → 그 어종 그림이 있는 부산물 종류 */
export const TRIM_PART_ART: Readonly<Record<string, readonly TrimPartKind[]>> = {
};

/** 같은 생물종(참돔 야간 = 참돔) — 그 어종 그림을 쓴다 */
export const TRIM_PART_ALIAS: Readonly<Record<string, string>> = {"night_seabream":"red_seabream"};
