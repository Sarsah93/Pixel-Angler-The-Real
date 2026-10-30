/**
 * @file FishCookingProfiles.ts
 * @description 어종별 요리 프로필 (156차 — `.agents/FIRE_COOKING_EXPANSION_SPEC.md` §2 · Stage 2)
 *
 * 같은 레시피라도 **무엇을 넣었느냐**에 따라 결과가 달라지게 하는 재료 쪽 데이터.
 * ⚖ `FishDatabase` 엔트리를 부풀리지 않고 **별도 표**로 둔다(§0.5). 미등재 어종은 기본 프로필.
 * ⚖ 수치는 플레이어에게 그대로 보이지 않는다 — `fatnessLabel()` 등 **라벨**로만 읽힌다(§2.1 · §18).
 *
 * 1차 등재 3종(§39 Stage 2): 우럭(`black_rockfish`) · 광어(`flatfish`) · 감성돔(`black_seabream`).
 * 값은 조리 통념(우럭 = 시원한 국물·탄탄 / 광어 = 담백·부드러움·비린 향 매우 낮음 / 감성돔 = 진한 풍미·지방 중~높음).
 *
 * 255차(Stage 7 — 나머지 레시피 개체화): 지리 · 구이 · 조림 · 볶음 · 조개탕 · 장어구이의 주재료가 될 수 있는 것 전부.
 *  어류 46종 + 장어류 3 + 두족류 3(오징어볶음) + 조개류 3(조개탕 — 채집 생물 id). 값은 조리 통념:
 *  고등어 · 꽁치 · 방어 · 눈볼대 = 기름지고 진함(구이 · 조림) / 대구 · 복어 = 담백하고 국물이 맑음(지리) /
 *  돌돔 · 쥐치 · 쏨뱅이 = 살이 탄탄함 / 갈치 · 도루묵 · 병어 = 살이 부드러움 / 붕장어 = 기름짐 · 먹장어 = 쫄깃함 /
 *  한치 = 연함 · 갑오징어 = 두툼하고 탄탄 / 홍합 · 바지락 = 국물이 진함 · 굴 = 무르고 향이 셈.
 */

import type { FishCookingProfile } from '../types/Cooking.js';

/**
 * 같은 학명의 다른 엔트리를 요리에서는 하나로 센다 (255차) — 밤에 낚은 참돔(`night_seabream`)도 참돔이다.
 * 요리 도감 · 이름 · 프로필이 모두 이 정본 id를 쓴다(156차는 도감 후보에 야간 엔트리만 남아 낮에 낚은 참돔 요리가 세지지 않았다).
 */
export const COOKING_SPECIES_ALIAS: Readonly<Record<string, string>> = { night_seabream: 'red_seabream' };

/** 요리 쪽 정본 어종 id */
export function cookingSpeciesId(speciesId: string): string {
  return COOKING_SPECIES_ALIAS[speciesId] ?? speciesId;
}

/**
 * 프로필 한 줄 (255차 추가분 전용 — 열 순서 고정):
 * 지방감 · 살 식감(0 부드러움 ~ 1 탄탄) · 비린 향 · 풍미 · 국물 기여 · 구이 · 탕 · 맑은 국 · 튀김 · 촉촉함 · 살 수율 · 단맛
 */
const P = (
  fatness: number, texture: number, fishiness: number, flavorStrength: number, brothContribution: number,
  grillSuitability: number, stewSuitability: number, soupSuitability: number, fryingSuitability: number,
  moistureRetention: number, fleshYield: number, sweetness: number,
): FishCookingProfile => ({
  fatness, texture, fishiness, flavorStrength, brothContribution, grillSuitability, stewSuitability, soupSuitability,
  fryingSuitability, moistureRetention, fleshYield, sweetness,
});

export const FISH_COOKING_PROFILES: Record<string, FishCookingProfile> = {
  black_rockfish: {
    fatness: 0.45, texture: 0.78, fishiness: 0.22, flavorStrength: 0.62, brothContribution: 0.88,
    grillSuitability: 0.7, stewSuitability: 0.92, soupSuitability: 0.88, fryingSuitability: 0.6,
    moistureRetention: 0.66, fleshYield: 0.42, sweetness: 0.3,
  },
  flatfish: {
    fatness: 0.3, texture: 0.42, fishiness: 0.1, flavorStrength: 0.45, brothContribution: 0.55,
    grillSuitability: 0.55, stewSuitability: 0.65, soupSuitability: 0.7, fryingSuitability: 0.78,
    moistureRetention: 0.6, fleshYield: 0.48, sweetness: 0.36,
  },
  black_seabream: {
    fatness: 0.64, texture: 0.8, fishiness: 0.3, flavorStrength: 0.82, brothContribution: 0.86,
    grillSuitability: 0.86, stewSuitability: 0.86, soupSuitability: 0.7, fryingSuitability: 0.55,
    moistureRetention: 0.7, fleshYield: 0.4, sweetness: 0.4,
  },
  // ── 255차 — 어류 (지리 · 구이 · 조림 · 매운탕) ──
  //                         지방  식감  비린  풍미  국물  구이  탕    맑은  튀김  촉촉  수율  단맛
  largescale_blackfish: P(0.45, 0.70, 0.38, 0.60, 0.70, 0.75, 0.75, 0.68, 0.60, 0.60, 0.42, 0.35),   // 벵에돔 — 갯내가 조금
  longtail_blackfish: P(0.48, 0.72, 0.36, 0.62, 0.70, 0.75, 0.75, 0.68, 0.60, 0.60, 0.42, 0.36),     // 긴꼬리벵에돔
  hairtail: P(0.70, 0.30, 0.40, 0.68, 0.55, 0.85, 0.75, 0.60, 0.80, 0.55, 0.55, 0.45),               // 갈치 — 기름지고 살이 무름(조림 · 구이)
  yellowtail: P(0.85, 0.62, 0.55, 0.82, 0.62, 0.82, 0.70, 0.45, 0.60, 0.60, 0.55, 0.40),             // 방어 — 겨울 기름
  amberjack: P(0.55, 0.75, 0.42, 0.70, 0.62, 0.75, 0.70, 0.50, 0.60, 0.55, 0.55, 0.38),              // 부시리 — 방어보다 담백 · 탄탄
  rainbow_wrasse: P(0.30, 0.40, 0.35, 0.45, 0.60, 0.55, 0.65, 0.60, 0.72, 0.55, 0.35, 0.30),         // 용치놀래기
  golden_rockfish: P(0.42, 0.72, 0.20, 0.58, 0.82, 0.72, 0.88, 0.85, 0.68, 0.62, 0.38, 0.32),        // 황볼락 — 볼락류는 국물이 시원
  red_snapper_rockfish: P(0.55, 0.60, 0.25, 0.62, 0.75, 0.88, 0.80, 0.75, 0.70, 0.66, 0.38, 0.36),   // 열기 — 구이로 이름난 고기
  red_seabream: P(0.50, 0.76, 0.15, 0.72, 0.85, 0.85, 0.82, 0.90, 0.60, 0.66, 0.45, 0.45),           // 참돔 — 맑고 단 흰살(도미 지리)
  stone_beakperch: P(0.50, 0.90, 0.18, 0.75, 0.85, 0.75, 0.80, 0.85, 0.55, 0.60, 0.42, 0.40),        // 돌돔 — 아주 탄탄
  spotted_knifejaw: P(0.52, 0.88, 0.20, 0.74, 0.84, 0.75, 0.80, 0.84, 0.55, 0.60, 0.42, 0.40),       // 강담돔
  chub_mackerel: P(0.82, 0.48, 0.78, 0.88, 0.55, 0.95, 0.85, 0.30, 0.60, 0.58, 0.55, 0.30),          // 고등어 — 기름지고 진하지만 비린 향이 셈
  grass_puffer: P(0.10, 0.82, 0.08, 0.60, 0.85, 0.50, 0.75, 0.95, 0.75, 0.55, 0.30, 0.40),           // 복섬 — 복지리
  tiger_puffer: P(0.12, 0.88, 0.06, 0.72, 0.90, 0.55, 0.75, 0.98, 0.75, 0.58, 0.35, 0.45),           // 참복어 — 맑은 국의 으뜸
  yellowfin_goby: P(0.25, 0.40, 0.30, 0.45, 0.60, 0.65, 0.65, 0.60, 0.70, 0.55, 0.40, 0.35),         // 문절망둑
  surfperch: P(0.30, 0.35, 0.35, 0.40, 0.55, 0.60, 0.62, 0.55, 0.65, 0.50, 0.40, 0.30),              // 망상어 — 물기 많고 무름
  scorpionfish: P(0.35, 0.75, 0.18, 0.62, 0.90, 0.60, 0.90, 0.90, 0.72, 0.60, 0.32, 0.38),           // 쏨뱅이 — 탕감
  fat_greenling: P(0.45, 0.55, 0.30, 0.55, 0.72, 0.70, 0.78, 0.72, 0.65, 0.60, 0.42, 0.33),          // 쥐노래미
  greenling: P(0.40, 0.52, 0.32, 0.50, 0.68, 0.68, 0.75, 0.70, 0.65, 0.58, 0.40, 0.32),              // 노래미
  blue_rockfish: P(0.45, 0.70, 0.22, 0.58, 0.80, 0.72, 0.86, 0.82, 0.68, 0.62, 0.40, 0.32),          // 청볼락
  flounder: P(0.35, 0.45, 0.18, 0.52, 0.60, 0.82, 0.72, 0.70, 0.80, 0.62, 0.45, 0.38),               // 문치가자미 — 구이 · 조림
  sea_bass: P(0.48, 0.62, 0.25, 0.60, 0.75, 0.80, 0.75, 0.80, 0.65, 0.64, 0.50, 0.36),               // 농어
  striped_mullet: P(0.50, 0.62, 0.50, 0.60, 0.62, 0.75, 0.70, 0.55, 0.60, 0.56, 0.50, 0.33),         // 숭어 — 흙내가 조금
  redlip_mullet: P(0.52, 0.64, 0.45, 0.62, 0.62, 0.75, 0.70, 0.55, 0.60, 0.56, 0.50, 0.34),          // 가숭어
  frog_flounder: P(0.30, 0.50, 0.12, 0.55, 0.72, 0.75, 0.70, 0.88, 0.78, 0.60, 0.45, 0.40),          // 도다리 — 맑은 국(쑥국)
  starry_flounder: P(0.32, 0.60, 0.15, 0.52, 0.66, 0.72, 0.70, 0.80, 0.76, 0.60, 0.45, 0.36),        // 강도다리
  tonguefish: P(0.32, 0.50, 0.20, 0.55, 0.60, 0.85, 0.78, 0.60, 0.80, 0.62, 0.45, 0.40),             // 개서대 — 구이 · 조림
  pacific_saury: P(0.80, 0.40, 0.75, 0.82, 0.50, 0.92, 0.80, 0.30, 0.55, 0.55, 0.55, 0.30),          // 꽁치 — 기름지고 비린 향이 셈
  blackthroat_seaperch: P(0.90, 0.45, 0.25, 0.85, 0.75, 0.98, 0.72, 0.70, 0.60, 0.72, 0.42, 0.50),   // 눈볼대 — 가장 기름진 구이감
  round_herring: P(0.65, 0.35, 0.72, 0.70, 0.50, 0.80, 0.70, 0.35, 0.75, 0.50, 0.45, 0.28),          // 눈퉁멸
  pacific_cod: P(0.12, 0.32, 0.12, 0.50, 0.88, 0.50, 0.85, 0.95, 0.85, 0.68, 0.50, 0.40),            // 대구 — 담백 · 맑은 국물(대구 지리)
  korean_pomfret: P(0.50, 0.40, 0.15, 0.58, 0.55, 0.75, 0.82, 0.55, 0.60, 0.62, 0.50, 0.48),         // 덕대
  silver_pomfret: P(0.52, 0.38, 0.15, 0.60, 0.55, 0.75, 0.84, 0.55, 0.60, 0.62, 0.50, 0.50),         // 병어 — 조림감
  sandfish: P(0.45, 0.25, 0.20, 0.50, 0.65, 0.85, 0.80, 0.65, 0.60, 0.65, 0.45, 0.40),               // 도루묵 — 살이 아주 무름
  black_scraper: P(0.20, 0.78, 0.15, 0.55, 0.70, 0.70, 0.78, 0.72, 0.65, 0.55, 0.35, 0.42),          // 말쥐치
  horse_mackerel: P(0.60, 0.55, 0.55, 0.72, 0.55, 0.88, 0.72, 0.40, 0.85, 0.56, 0.50, 0.35),         // 전갱이
  filefish: P(0.22, 0.75, 0.14, 0.58, 0.70, 0.70, 0.78, 0.72, 0.65, 0.55, 0.35, 0.45),               // 쥐치
  greater_amberjack: P(0.65, 0.72, 0.45, 0.75, 0.62, 0.78, 0.70, 0.48, 0.60, 0.56, 0.55, 0.40),      // 잿방어
  spanish_mackerel: P(0.68, 0.35, 0.45, 0.72, 0.50, 0.92, 0.72, 0.40, 0.75, 0.58, 0.60, 0.38),       // 삼치 — 구이감 · 살이 무름
  octopus: P(0.08, 0.85, 0.12, 0.62, 0.65, 0.75, 0.70, 0.75, 0.70, 0.60, 0.70, 0.55),                // 돌문어(통째 어획물은 생선 재료로 들어간다)
  giant_octopus: P(0.08, 0.82, 0.12, 0.60, 0.62, 0.72, 0.70, 0.72, 0.68, 0.60, 0.72, 0.52),          // 대문어
  yellowfin_puffer: P(0.10, 0.80, 0.08, 0.62, 0.86, 0.50, 0.75, 0.94, 0.75, 0.55, 0.32, 0.40),       // 까치복
  bartail_flathead: P(0.25, 0.72, 0.15, 0.55, 0.80, 0.65, 0.82, 0.80, 0.70, 0.58, 0.35, 0.38),       // 양태
  bluefin_searobin: P(0.28, 0.70, 0.18, 0.55, 0.78, 0.68, 0.80, 0.78, 0.70, 0.58, 0.35, 0.40),       // 성대
  halfbeak: P(0.25, 0.35, 0.25, 0.45, 0.45, 0.75, 0.50, 0.45, 0.80, 0.52, 0.45, 0.42),               // 학꽁치 — 여리고 담백
  northern_whiting: P(0.20, 0.38, 0.12, 0.45, 0.50, 0.72, 0.55, 0.60, 0.92, 0.58, 0.45, 0.48),       // 보리멸
  // ── 장어류 (장어구이) ──
  conger_eel: P(0.78, 0.45, 0.30, 0.75, 0.65, 0.92, 0.70, 0.60, 0.75, 0.68, 0.60, 0.40),             // 붕장어 — 기름짐
  hagfish: P(0.60, 0.88, 0.50, 0.78, 0.50, 0.90, 0.55, 0.40, 0.60, 0.50, 0.65, 0.30),                // 먹장어 — 쫄깃 · 향이 셈
  pike_conger: P(0.65, 0.55, 0.25, 0.75, 0.78, 0.85, 0.60, 0.80, 0.75, 0.65, 0.55, 0.48),            // 갯장어 — 달고 맑은 국물
  // ── 두족류 (오징어볶음) — 지방은 거의 없고 식감 · 단맛이 갈린다 ──
  swordtip_squid: P(0.12, 0.38, 0.10, 0.50, 0.40, 0.75, 0.50, 0.50, 0.85, 0.70, 0.75, 0.78),         // 한치 — 연하고 달다
  flying_squid: P(0.14, 0.40, 0.12, 0.55, 0.45, 0.70, 0.55, 0.50, 0.80, 0.65, 0.80, 0.75),           // 289차 살오징어 — 한치보다 질기고 덜 달다 · 볶음에 맞다
  squid: P(0.10, 0.62, 0.10, 0.60, 0.45, 0.70, 0.50, 0.50, 0.85, 0.72, 0.72, 0.85),                  // 무늬오징어 — 두툼하고 가장 달다
  cuttlefish: P(0.10, 0.80, 0.12, 0.58, 0.45, 0.72, 0.55, 0.50, 0.80, 0.62, 0.60, 0.70),             // 갑오징어 — 두툼하고 탄탄
  // ── 조개류 (조개탕 — 채집 생물 id) ──
  clam_varicosa: P(0.10, 0.50, 0.20, 0.70, 0.90, 0.40, 0.70, 0.95, 0.60, 0.60, 0.30, 0.55),          // 바지락 — 시원하고 진한 국물
  mytilus_coruscus: P(0.15, 0.62, 0.30, 0.80, 0.95, 0.45, 0.70, 0.92, 0.55, 0.55, 0.35, 0.50),       // 홍합(섭) — 가장 진한 국물
  oyster_gigas: P(0.20, 0.25, 0.45, 0.75, 0.70, 0.50, 0.60, 0.85, 0.80, 0.70, 0.40, 0.55),           // 굴 — 무르고 향이 셈
};

/** 미등재 어종 — 중간값. 갈라지지 않는 기본 결과를 낸다 */
export const DEFAULT_FISH_COOKING_PROFILE: FishCookingProfile = {
  fatness: 0.45, texture: 0.6, fishiness: 0.3, flavorStrength: 0.55, brothContribution: 0.65,
  grillSuitability: 0.65, stewSuitability: 0.7, soupSuitability: 0.65, fryingSuitability: 0.6,
  moistureRetention: 0.62, fleshYield: 0.42, sweetness: 0.32,
};

export function fishCookingProfileOf(speciesId: string | null | undefined): FishCookingProfile {
  return (speciesId && FISH_COOKING_PROFILES[cookingSpeciesId(speciesId)]) || DEFAULT_FISH_COOKING_PROFILE;
}
export function hasFishCookingProfile(speciesId: string): boolean {
  return !!FISH_COOKING_PROFILES[cookingSpeciesId(speciesId)];
}

// ─── 라벨 (§2.1 · §18 — 숫자를 보여주지 않는다) ───

const band = (v: number, cuts: number[], ko: string[], en: string[], useEn: boolean): string => {
  let i = 0;
  while (i < cuts.length && v >= cuts[i]) i++;
  return (useEn ? en : ko)[i];
};
export function fatnessLabel(v: number, en = false): string {
  return band(v, [0.4, 0.7], ['담백', '보통', '기름진 편'], ['Lean', 'Medium', 'On the fatty side'], en);
}
export function textureLabel(v: number, en = false): string {
  return band(v, [0.4, 0.7], ['부드러움', '보통', '탄탄함'], ['Soft', 'Medium', 'Firm'], en);
}
export function fishinessLabel(v: number, en = false): string {
  return band(v, [0.15, 0.35, 0.6], ['거의 없음', '약함', '보통', '강함'], ['Almost none', 'Mild', 'Moderate', 'Strong'], en);
}
export function flavorLabel(v: number, en = false): string {
  return band(v, [0.4, 0.7], ['은은함', '보통', '진한 편'], ['Subtle', 'Medium', 'Rich'], en);
}
/** 255차 — 국물 진하기(`brothContribution`). 조개탕 상세는 지방감 대신 이 줄을 보인다(조개는 지방감으로 말하지 않는다) */
export function brothLabel(v: number, en = false): string {
  return band(v, [0.4, 0.7], ['옅음', '보통', '진함'], ['Light', 'Medium', 'Deep'], en);
}

/** 중량 구간 (§23) — 회복·풍미·가격·버프 지속에 쓰는 밴드 */
export type CookingWeightBand = 'small' | 'medium' | 'large' | 'extraLarge';
export function cookingWeightBand(weightG: number): CookingWeightBand {
  if (weightG < 500) return 'small';
  if (weightG < 900) return 'medium';
  if (weightG < 1300) return 'large';
  return 'extraLarge';
}
export const WEIGHT_BAND_KO: Record<CookingWeightBand, string> = { small: '소', medium: '중', large: '대', extraLarge: '특대' };
