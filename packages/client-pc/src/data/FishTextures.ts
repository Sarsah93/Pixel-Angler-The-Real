/**
 * @file FishTextures.ts
 * @description 어종 → 실사 픽셀 생선 이미지 텍스처 매핑 (공용).
 *
 * 어획 팝업·아이템 상세·인벤토리 아이콘이 공유한다. 인벤토리는 개체의 iconTexture가
 * 비어 있어도(예: 텍스처 배선 전에 낚은 구세이브 어획물) speciesId로 텍스처를 폴백
 * 해소할 수 있도록 이 맵을 참조한다.
 *
 * 텍스처 키는 어종 ID 기준(`fish_<id>`)이며, 실제 로드는 BootScene이 아래 `FISH_IMAGE_FILES` 표로 수행한다.
 * 246차 — 게임은 원본(`food assets/fish/`)이 아니라 **카드**(가장 큰 칸 410×166에 맞춘 면적 평균)와 **64px 아이콘**만 싣는다
 *  (`node tools/fish_cards.cjs`). 원본 53장을 그대로 싣던 때 부팅 텍스처 ≈ 181MB.
 */

import { FORAGE_IMAGE_FILES } from './ForageTextures.js';
import { TACKLE_IMAGE_FILES } from './TackleTextures.js';
import { ITEM_IMAGE_FILES } from './ItemImages.js';

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
  blue_rockfish: 'fish_blue_rockfish',     // 청볼락 — dark-banded_rockfish.png (171차)
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
  greenling: 'fish_greenling',             // 놀래미 — spotbelly_rockfish.png (171차)
  scorpionfish: 'fish_scorpionfish',       // 쏨뱅이 — spotbelly_greenling.png (171차)
  fat_greenling: 'fish_fat_greenling',     // 쥐노래미
  surfperch: 'fish_surfperch',             // 망상어
  // 2026-07-25 추가 (기존 4종 텍스처 + 복섬 개명 + 신규 6종)
  spanish_mackerel: 'fish_spanish_mackerel', // 삼치
  conger_eel: 'fish_conger_eel',           // 붕장어
  pike_conger: 'fish_pike_conger',         // 갯장어(하모)
  pacific_saury: 'fish_pacific_saury',     // 꽁치
  grass_puffer: 'fish_grass_puffer',       // 복섬
  yellowfin_puffer: 'fish_yellowfin_puffer', // 까치복
  tiger_puffer: 'fish_tiger_puffer',       // 참복어(자주복)
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
  // 2026-09-22 추가 (170차) — 볼락류 어종별 실사
  red_snapper_rockfish: 'fish_red_snapper_rockfish', // 열기(불볼락)
  black_rockfish: 'fish_black_rockfish',             // 조피볼락(우럭)
  // 2026-09-22 추가 (174차) — 사용자 제공 실사 7종
  blackthroat_seaperch: 'fish_blackthroat_seaperch', // 눈볼대(금태)
  yellowfin_goby: 'fish_yellowfin_goby',             // 문절망둑
  flounder: 'fish_flounder',                         // 문치가자미
  starry_flounder: 'fish_starry_flounder',           // 강도다리
  frog_flounder: 'fish_frog_flounder',               // 도다리
  silver_pomfret: 'fish_silver_pomfret',             // 병어
  korean_pomfret: 'fish_korean_pomfret',             // 덕대
  // 2026-10-14 추가 (246차) — 그림이 없던 4종(Gemini 생성 · tools/gemini_fish_art.cjs)
  tonguefish: 'fish_tonguefish',                     // 개서대
  round_herring: 'fish_round_herring',               // 눈퉁멸
  sandfish: 'fish_sandfish',                         // 도루묵
  black_scraper: 'fish_black_scraper',               // 말쥐치
};

/**
 * 246차 — 텍스처 키 → 그림 파일 표(단일 출처 — BootScene이 이 표로 싣는다).
 *  - `fish/<파일>` → `fish_<…>` = 카드(손질 도마 미리보기 410×166 · 어획 결과 창 최대 360×146 · 상세 창 300×120이 쓴다)
 *  - `fish/icon/<파일>` → `fishicon_<…>` = 긴 변 64px 아이콘(가방 칸 · 쿨러 칸처럼 72px 이하로 그리는 곳)
 * 원본은 `food assets/fish/<파일>`(셀 6px 전후 · 긴 변 500~2,200px) — `node tools/fish_cards.cjs`가 카드 · 아이콘을 굽는다.
 * 새 어종 그림 = 원본을 `food assets/fish/`에 넣고 → 이 표에 한 줄 → `FISH_TEXTURE`에 어종 id 연결 → `fish_cards.cjs`.
 * 파일 이름은 소문자(gh-pages는 대소문자를 가린다) — 247차에 마지막 대문자 파일(`So-iuy_mullet.png`)을 `so-iuy_mullet.png`로 바꿨다.
 */
export const FISH_IMAGE_FILES: Record<string, string> = {
  fish_black_sea_bream: 'black_sea_bream.png',            // 감성돔
  fish_halibut: 'halibut.png',                            // 넙치(광어)
  fish_largescale_blackfish: 'large_scale_blackfish.png', // 벵에돔
  fish_longtail_blackfish: 'small_scale_blackfish.png',   // 긴꼬리벵에돔
  fish_squid: 'bigfin_reef_squid.png',                    // 무늬오징어
  fish_hairtail: 'cutlassfish.png',                       // 갈치 — 2026-09-23 픽셀아트 교체(구 대문자 파일명 폐기)
  fish_cuttlefish: 'cuttlefish.png',                      // 갑오징어
  fish_blue_rockfish: 'dark-banded_rockfish.png',         // 청볼락 (171차 사용자 확인)
  fish_filefish: 'filefish.png',                          // 쥐치
  fish_golden_rockfish: 'owstons_rockfish.png',           // 황볼락
  fish_sea_bass: 'sea_bass.png',                          // 농어
  fish_amberjack: 'yellowtail_amberjack.png',             // 부시리
  fish_yellowtail: 'yellowtail_fish.png',                 // 방어
  fish_striped_mullet: 'flathead_grey_mullet.png',        // 숭어
  fish_redlip_mullet: 'so-iuy_mullet.png',                // 가숭어 (247 — 대문자 S → 소문자)
  fish_spotted_knifejaw: 'spotted_knifejaw.png',          // 강담돔
  fish_red_seabream: 'red_sea_bream.png',                 // 참돔 (야간 참돔 night_seabream 공용)
  fish_horse_mackerel: 'jack_mackerel.png',               // 전갱이
  fish_chub_mackerel: 'mackerel.png',                     // 고등어
  // 돌돔 — 30cm↑ 수컷은 무늬 소실(수컷 그림), 그 외(30cm↓ 전부 + 30cm↑ 암컷)는 무늬 유지(암컷 그림) — resolveFishTexture
  fish_stone_beakperch_female: 'barred_knifejaw_female.png',
  fish_stone_beakperch_male: 'barred_knifejaw_male.png',
  // ⚠ 171차 정정 — `food assets/` 원본은 서로 다른 사진이다: spotbelly_greenling = 쏨뱅이 · spotbelly_rockfish = 놀래미
  fish_scorpionfish: 'spotbelly_greenling.png',           // 쏨뱅이
  fish_swordtip_squid: 'swordtip_squid.png',              // 한치(창꼴뚜기)
  fish_greenling: 'spotbelly_rockfish.png',               // 놀래미(노래미)
  fish_fat_greenling: 'fat_greenling.png',                // 쥐노래미
  fish_surfperch: 'surf_perch.png',                       // 망상어
  // 용치놀래기 — 암컷→수컷 성전환(수컷 = 화려한 녹색 혼인색) — 성별별 그림
  fish_rainbow_wrasse_female: 'multicolorfin_rainbowfish_female.png',
  fish_rainbow_wrasse_male: 'multicolorfin_rainbowfish_male.png',
  fish_spanish_mackerel: 'spanish_mackerel.png',          // 삼치
  fish_conger_eel: 'conger_eel.png',                      // 붕장어
  fish_pike_conger: 'daggertooth_pike_conger.png',        // 갯장어(하모)
  fish_pacific_saury: 'saury.png',                        // 꽁치
  fish_grass_puffer: 'grass_puffer.png',                  // 복섬 (구 졸복)
  fish_yellowfin_puffer: 'yellowfin_puffer.png',          // 까치복
  fish_tiger_puffer: 'tiger_puffer.png',                  // 참복어(자주복)
  fish_bartail_flathead: 'bartail_flathead.png',          // 양태
  fish_bluefin_searobin: 'bluefin_searobin.png',          // 성대
  fish_hagfish: 'hagfish.png',                            // 먹장어(곰장어)
  fish_halfbeak: 'halfbeak.png',                          // 학꽁치
  fish_northern_whiting: 'northern_whiting.png',          // 보리멸
  fish_pacific_cod: 'pacific_cod.png',                    // 태평양 대구
  fish_greater_amberjack: 'greater_amberjack.png',        // 잿방어
  // ⚠ 문어 파일명 ↔ 어종은 그림 내용 기준(사용자 메시지의 영문 파일명이 뒤바뀌어 있었다)
  fish_octopus: 'common_octopus.png',                     // 참문어(돌문어) — 얼룩덜룩 소형
  fish_giant_octopus: 'giant_pacific_octopus.png',        // 대문어(피문어)
  fish_red_snapper_rockfish: 'red_snapper_rockfish.png',  // 열기(불볼락)
  fish_black_rockfish: 'black_rockfish.png',              // 조피볼락(우럭)
  fish_blackthroat_seaperch: 'blackthroat_seaperch.png',  // 눈볼대(금태)
  fish_yellowfin_goby: 'yellowfin_goby.png',              // 문절망둑
  fish_flounder: 'flounder.png',                          // 문치가자미
  fish_starry_flounder: 'starry_flounder.png',            // 강도다리
  fish_frog_flounder: 'frog_flounder.png',                // 도다리
  fish_silver_pomfret: 'silver_pomfret.png',              // 병어
  fish_korean_pomfret: 'korean_pomfret.png',              // 덕대
  // 246차 — 그림이 없던 4종(Gemini 생성)
  fish_tonguefish: 'robust_tonguefish.png',               // 개서대
  fish_round_herring: 'round_herring.png',                // 눈퉁멸
  fish_sandfish: 'japanese_sandfish.png',                 // 도루묵
  fish_black_scraper: 'black_scraper.png',                // 말쥐치
};

/**
 * 246차 — 카드 키(`fish_<…>`) → 64px 아이콘 키(`fishicon_<…>`).
 * 248차 — 갯것 · 생미끼 카드(`FORAGE_IMAGE_FILES` · 돌문어)도 같은 방식이다 → `<카드 키>__icon`.
 * 249차 — 낚시 장비 카드(`TACKLE_IMAGE_FILES`)도 → `<카드 키>__icon`.
 * 255차 — 장비 밖 아이템 카드(`ITEM_IMAGE_FILES` — Gemini)도 → `<카드 키>__icon`.
 */
export function fishIconKey(cardKey: string): string {
  if (cardKey.startsWith('fish_')) return `fishicon_${cardKey.slice(5)}`;
  if (cardKey in FORAGE_IMAGE_FILES || cardKey in TACKLE_IMAGE_FILES || cardKey in ITEM_IMAGE_FILES || cardKey === 'forage_octopus_vulgaris') return `${cardKey}__icon`;
  // 255차 — 요리 사진(`food_<레시피>` · 모둠회)도 64px 칸 아이콘 판이 있다(`food/icon/` — `tools/dish_photos.cjs`)
  if (cardKey.startsWith('food_')) return `${cardKey}__icon`;
  return cardKey;
}

/** 246차 — 이 크기(긴 변 px) 이하로 그리면 카드 대신 64px 아이콘을 쓴다(NEAREST 축소가 칸을 건너뛰어 떨린다) */
export const FISH_ICON_MAX_PX = 72;

/** 텍스처 관리자(`scene.textures`) 중 아래 맞춤 함수가 쓰는 두 기능 */
interface FishTexLookup {
  exists(key: string): boolean;
  get(key: string): { getSourceImage(): { width: number; height: number } };
}

/**
 * 246차 — 칸(boxW × boxH)에 비율대로 맞춘 판과 그릴 크기. 카드로 맞춘 긴 변이 `FISH_ICON_MAX_PX` 이하면
 * 아이콘 판(`fishicon_*`)으로 바꿔 다시 맞춘다. 어종 키가 아니거나 아이콘이 없으면 받은 키 그대로다.
 */
export function fitFishTexture(tex: FishTexLookup, key: string, boxW: number, boxH: number): { key: string; w: number; h: number } {
  const fit = (k: string): { key: string; w: number; h: number } => {
    const src = tex.get(k).getSourceImage();
    const s = Math.min(boxW / src.width, boxH / src.height);
    return { key: k, w: src.width * s, h: src.height * s };
  };
  const card = fit(key);
  const icon = fishIconKey(key);
  if (icon === key || Math.max(card.w, card.h) > FISH_ICON_MAX_PX || !tex.exists(icon)) return card;
  return fit(icon);
}

/**
 * 어획 개체 → 텍스처 해소.
 *  - 돌돔(stone_beakperch): 30cm를 넘어야 암수 구별 — 수컷만 줄무늬 소실.
 *    30cm 미만은 개체 성별과 무관하게 암컷(무늬 유지) 이미지를 쓴다.
 *  - 용치놀래기(rainbow_wrasse): 암컷→수컷 성전환 — 성별에 따라 체색이 완전히 달라
 *    암/수 이미지를 분기한다 (수컷 = 화려한 녹색 혼인색).
 * sex 정보가 없을 때는 'F'를 기본값으로 넘긴다(대부분 어종은 성별 무관).
 */
/**
 * 돌돔 **줄무늬 없는 수컷** 판정 — 30cm를 넘겨야 암수 구별이 되고, 그때 수컷만 줄무늬를 잃는다.
 * (170차 사용자 지정으로 40 → 30cm. 어획 팝업·인벤 텍스처와 손질 도마가 이 한 줄을 공유한다.)
 * 어획 팝업/인벤 텍스처와 손질 도마 스프라이트가 같은 기준을 쓰도록 여기서 단일 정의한다.
 */
export function isStripelessMale(speciesId: string, lengthCm: number, sex: 'M' | 'F'): boolean {
  return speciesId === 'stone_beakperch' && lengthCm >= 30 && sex === 'M';
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
