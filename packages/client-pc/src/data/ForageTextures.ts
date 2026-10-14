/**
 * @file ForageTextures.ts
 * @description 248차 — 갯것(해루질 생물) · 생미끼 그림 표.
 *
 * 원본은 `food assets/forage/art/`(초상) · `food assets/forage/top/`(위에서 본 그림)에 있고,
 * 게임은 `node tools/forage_cards.cjs`가 굽는 것만 싣는다(246차 어종 카드 방식과 같다 — 원본 1,254px를 그대로 싣던
 * 11장만 해도 부팅 텍스처가 약 55MB였다).
 *  - 카드 `forage/<파일>` — 300×160 안(상세 창 큰 그림 300×120 · 혼잣말 초상 102px이 가장 크다)
 *  - 아이콘 `forage/icon/<파일>` — 긴 변 64px(가방 · 쿨러 칸처럼 72px 이하로 그리는 곳 — `fitFishTexture`가 고른다)
 *  - 채집 놀이 판 `forage-board/<생물 id>.png` — 긴 변 44px · 머리 왼쪽(판이 오른쪽으로 달리면 뒤집는다)
 *  - 필드 점 그림 `forage-dot/<생물 id>.png` — 긴 변 24px(1배로 그린다)
 */

/** 카드 텍스처 키 → 원본 파일(`food assets/forage/art/`). 아이콘 키는 `<카드 키>__icon`(`fishIconKey`) */
export const FORAGE_IMAGE_FILES: Record<string, string> = {
  // 248차 — 그림이 없던 10종(Gemini)
  forage_clam_varicosa: 'clam_varicosa.png',               // 바지락
  forage_turbo_cornutus: 'turbo_cornutus.png',             // 소라
  forage_oyster_gigas: 'oyster_gigas.png',                 // 굴
  forage_haliotis_discus: 'haliotis_discus.png',           // 전복
  forage_charybdis_japonica: 'charybdis_japonica.png',     // 민꽃게(돌게)
  forage_octopus_minor: 'octopus_minor.png',               // 낙지
  forage_mytilus_coruscus: 'mytilus_coruscus.png',         // 홍합(섭)
  forage_omphalius_rusticus: 'omphalius_rusticus.png',     // 보말
  forage_capitulum_mitella: 'capitulum_mitella.png',       // 거북손
  forage_cellana_grata: 'cellana_grata.png',               // 삿갓조개
  // 166 · 225 · 226 · 228차 — 사용자가 그려 온 그림
  forage_portunus_trituberculatus: 'portunus_trituberculatus.png',
  forage_strongylocentrotus_nudus: 'strongylocentrotus_nudus.png',
  forage_stichopus_japonicus: 'stichopus_japonicus.png',
  forage_haliotis_diversicolor: 'haliotis_diversicolor.png',
  forage_heliocidaris_crassispina: 'heliocidaris_crassispina.png',
  forage_aplysia_kurodai: 'aplysia_kurodai.png',
  forage_hemigrapsus_sanguineus: 'hemigrapsus_sanguineus.png',
  forage_ligia_exotica: 'ligia_exotica.png',
  forage_perinereis_aibuhitensis: 'perinereis_aibuhitensis.png',
  forage_marphysa_sanguinea: 'marphysa_sanguinea.png',
  forage_berried_crab: 'berried_crab.png',                 // 알 밴 암꽃게(놓아주기 혼잣말 초상)
  // 생미끼 아이템 — 같은 그림을 아이템 키로도 싣는다
  item_ragworm: 'perinereis_aibuhitensis.png',
  item_honmushi: 'marphysa_sanguinea.png',
  item_earthworm: 'earthworm.png',                         // 248차 — 텃밭 땅지렁이(Gemini)
};

/** 필드 점 그림 · 판 그림이 있는 것 — 해루질 생물 id 전부 + 텃밭 땅지렁이(`forage-dot/earthworm.png` → `farm_earthworm`) */
export const FARM_WORM_TEX = 'farm_earthworm';
