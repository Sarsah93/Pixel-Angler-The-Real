/**
 * @file FacePortraits.ts
 * @description 267차 — 사진(Gemini) 얼굴 초상이 있는 키 목록(자동 생성 — `node tools/gemini_face_art.cjs --install`).
 *  BootScene이 `faces/<키>.png`(192×192 · 셀 2px)를 `face_<키>`로 싣고, `ui/FacePhoto.ts`가 대화창 · 혼잣말 · 일지 초상에 먼저 쓴다.
 *  키 = 인물 id(okseon …) 또는 주인공 기본 얼굴 `player_<m|f>_<머리 모양>[_beard]`(머리색 · 피부 · 눈동자는 게임이 치환).
 *  목록에 없으면 32×32 절차 초상(`ensureFacePortrait`) 그대로. 손으로 고치지 말 것.
 */
export const FACE_PORTRAITS: readonly string[] = [
];
