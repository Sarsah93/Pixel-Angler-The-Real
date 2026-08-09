/**
 * @file FishTextures.ts
 * @description 어종 → 실사 픽셀 생선 이미지 텍스처 매핑 (공용).
 *
 * 어획 팝업·아이템 상세·인벤토리 아이콘이 공유한다. 인벤토리는 개체의 iconTexture가
 * 비어 있어도(예: 텍스처 배선 전에 낚은 구세이브 어획물) speciesId로 텍스처를 폴백
 * 해소할 수 있도록 이 맵을 참조한다.
 *
 * 텍스처 키는 어종 ID 기준(`fish_<id>`)이며, 실제 로드는 BootScene에서 수행한다.
 */

/** 어종 ID → 실사 픽셀 생선 이미지 텍스처 키 */
export const FISH_TEXTURE: Record<string, string> = {
  black_seabream: 'fish_black_sea_bream',
  flatfish: 'fish_halibut',
  largescale_blackfish: 'fish_largescale_blackfish',   // 벵에돔
  longtail_blackfish: 'fish_longtail_blackfish',       // 긴꼬리벵에돔
  // 2026-07-22 추가 (food assets/)
  squid: 'fish_squid',                     // 무늬오징어
  hairtail: 'fish_hairtail',               // 갈치
  cuttlefish: 'fish_cuttlefish',           // 갑오징어
  blue_rockfish: 'fish_blue_rockfish',     // 청볼락
  filefish: 'fish_filefish',               // 쥐치
  golden_rockfish: 'fish_golden_rockfish', // 황볼락
  sea_bass: 'fish_sea_bass',               // 농어
  amberjack: 'fish_amberjack',             // 부시리
  yellowtail: 'fish_yellowtail',           // 방어
  striped_mullet: 'fish_striped_mullet',   // 숭어
  redlip_mullet: 'fish_redlip_mullet',     // 가숭어
  spotted_knifejaw: 'fish_spotted_knifejaw', // 강담돔
  red_seabream: 'fish_red_seabream',       // 참돔
  night_seabream: 'fish_red_seabream',     // 참돔(야간) — 같은 생물종이라 이미지 공용
  horse_mackerel: 'fish_horse_mackerel',   // 전갱이
  chub_mackerel: 'fish_chub_mackerel',     // 고등어
  // 2026-07-22 2차 추가
  greenling: 'fish_greenling',             // 놀래미
  fat_greenling: 'fish_fat_greenling',     // 쥐노래미
  surfperch: 'fish_surfperch',             // 망상어
  // 2026-07-25 추가 (기존 4종 텍스처 + 복섬 개명 + 신규 6종)
  spanish_mackerel: 'fish_spanish_mackerel', // 삼치
  conger_eel: 'fish_conger_eel',           // 붕장어
  pike_conger: 'fish_pike_conger',         // 갯장어(하모)
  pacific_saury: 'fish_pacific_saury',     // 꽁치
  grass_puffer: 'fish_grass_puffer',       // 복섬
  yellowfin_puffer: 'fish_yellowfin_puffer', // 까치복
  bartail_flathead: 'fish_bartail_flathead', // 양태
  bluefin_searobin: 'fish_bluefin_searobin', // 성대
  hagfish: 'fish_hagfish',                 // 먹장어
  halfbeak: 'fish_halfbeak',               // 학꽁치
  northern_whiting: 'fish_northern_whiting', // 보리멸
  // 2026-07-28 추가
  pacific_cod: 'fish_pacific_cod',         // 태평양 대구
  greater_amberjack: 'fish_greater_amberjack', // 잿방어
  octopus: 'fish_octopus',                 // 참문어(돌문어) — common_octopus.png
  giant_octopus: 'fish_giant_octopus',     // 대문어(피문어) — giant_pacific_octopus.png
  // 2026-08-05 추가 — 한치 어종 DB 등록에 따른 배선 (에셋은 20차부터 선로드 상태였음)
  swordtip_squid: 'fish_swordtip_squid',   // 한치(창꼴뚜기) — swordtip_squid.png
};

/**
 * 어획 개체 → 텍스처 해소.
 *  - 돌돔(stone_beakperch): 40cm를 넘어야 암수 구별 — 수컷만 줄무늬 소실.
 *    40cm 미만은 개체 성별과 무관하게 암컷(무늬 유지) 이미지를 쓴다.
 *  - 용치놀래기(rainbow_wrasse): 암컷→수컷 성전환 — 성별에 따라 체색이 완전히 달라
 *    암/수 이미지를 분기한다 (수컷 = 화려한 녹색 혼인색).
 * sex 정보가 없을 때는 'F'를 기본값으로 넘긴다(대부분 어종은 성별 무관).
 */
/**
 * 돌돔 **줄무늬 없는 수컷** 판정 — 40cm를 넘겨야 암수 구별이 되고, 그때 수컷만 줄무늬를 잃는다.
 * 어획 팝업/인벤 텍스처와 손질 도마 스프라이트가 같은 기준을 쓰도록 여기서 단일 정의한다.
 */
export function isStripelessMale(speciesId: string, lengthCm: number, sex: 'M' | 'F'): boolean {
  return speciesId === 'stone_beakperch' && lengthCm >= 40 && sex === 'M';
}

export function resolveFishTexture(speciesId: string, lengthCm: number, sex: 'M' | 'F'): string | undefined {
  if (speciesId === 'stone_beakperch') {
    return isStripelessMale(speciesId, lengthCm, sex) ? 'fish_stone_beakperch_male' : 'fish_stone_beakperch_female';
  }
  if (speciesId === 'rainbow_wrasse') {
    return sex === 'M' ? 'fish_rainbow_wrasse_male' : 'fish_rainbow_wrasse_female';
  }
  return FISH_TEXTURE[speciesId];
}
