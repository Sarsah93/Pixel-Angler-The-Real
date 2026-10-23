/**
 * @file FaceLayers.ts
 * @description 271차 — 주인공 얼굴 **층** 목록(자동 생성 — `node tools/face_layers.cjs --install`). 손으로 고치지 말 것.
 *  BootScene이 `faces/layers/<키>.png`(192×192 · 셀 2px)를 `facelayer_<키>`로 싣고, `ui/FacePhoto.ts`가 기본 머리(민머리 · 민낯) 위에 수염 · 머리 모양 층을 겹쳐
 *  생성 옵션(피부 · 머리색 · 눈 · 수염 색 · 입 · 홍조)대로 칠한다(`ui/FaceRecolor.ts composePlayerFace` — 마스크 · 층 알파로만 칠하고 색 규칙 추측은 없다).
 *  키 = base_<m|f>_<oval|round|square>(+ `_mask` 라벨 마스크) · hair_<m|f>_<머리 모양> · beard_m_<얼굴형>.
 */
export const FACE_LAYERS: readonly string[] = [
  'base_f_oval',
  'base_f_oval_mask',
  'base_f_round',
  'base_f_round_mask',
  'base_f_square',
  'base_f_square_mask',
  'base_m_oval',
  'base_m_oval_mask',
  'base_m_round',
  'base_m_round_mask',
  'base_m_square',
  'base_m_square_mask',
  'hair_f_bob',
  'hair_f_braid',
  'hair_f_buzz',
  'hair_f_curly',
  'hair_f_long',
  'hair_f_pony',
  'hair_f_short',
  'hair_f_topknot',
  'hair_m_bob',
  'hair_m_braid',
  'hair_m_buzz',
  'hair_m_curly',
  'hair_m_long',
  'hair_m_pony',
  'hair_m_short',
  'hair_m_topknot',
];
