/**
 * @file ButcheryProfiles.ts
 * @description 어종별 손질(해부) 파라미터 DB — 파라메트릭 생선 템플릿 변형값 + 수율/형상
 *
 * 어종×방향×단계 스프라이트를 전부 그리는 대신, 템플릿 1종(원형/납작)에
 * 이 프로필을 주입해 변형한다. 해부 수치(anusRatio 등)와 수율 수치
 * (baseYieldRate·sliceGramBase·minFilletLengthCm)는 통념 기반 튜닝값(★★) —
 * 인어교주해적단 활어 살수율/생선회 순살 가격 자료 참고. 플레이 테스트로 재튜닝 대상.
 *
 * 수율 공식: yieldMass = weightGram × baseYieldRate × 도구 × 스킬 × 신선도 (computeFilletYield)
 * 순수 TS 데이터.
 */

import type { ButcheryProfile } from '../types/Butchery.js';

/** 어종별 손질 프로필 */
export const BUTCHERY_PROFILES: Record<string, ButcheryProfile> = {
  // ── 원형어 흰살/중간살 (삼면뜨기 2필렛) ──
  black_seabream: {
    speciesId: 'black_seabream', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.65, anusRatio: 0.52, skinToughness: 0.5, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.40, sliceGramBase: 10, minFilletLengthCm: 25, bodyRatio: 0.42, filletShape: 'loin_thick',
  },
  largescale_blackfish: {
    speciesId: 'largescale_blackfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.7, anusRatio: 0.5, skinToughness: 0.55, bloodAmount: 0.55, filletCount: 2,
    baseYieldRate: 0.40, sliceGramBase: 10, minFilletLengthCm: 25, bodyRatio: 0.44, filletShape: 'small',
  },
  longtail_blackfish: {
    speciesId: 'longtail_blackfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.7, anusRatio: 0.5, skinToughness: 0.55, bloodAmount: 0.55, filletCount: 2,
    baseYieldRate: 0.40, sliceGramBase: 10, minFilletLengthCm: 25, bodyRatio: 0.42, filletShape: 'small',
  },
  // 참돔 — 흰살 고급어
  red_seabream: {
    speciesId: 'red_seabream', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.6, anusRatio: 0.52, skinToughness: 0.5, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.42, sliceGramBase: 11, minFilletLengthCm: 25, bodyRatio: 0.42, filletShape: 'loin_thick',
  },
  // 농어 — MVP 예시종
  sea_bass: {
    speciesId: 'sea_bass', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.6, anusRatio: 0.48, skinToughness: 0.45, bloodAmount: 0.7, filletCount: 2,
    baseYieldRate: 0.45, sliceGramBase: 11, minFilletLengthCm: 35, bodyRatio: 0.30, filletShape: 'loin_thick',
  },
  // 돌돔/강담돔 — 단단한 비늘·두툼한 몸통
  stone_beakperch: {
    speciesId: 'stone_beakperch', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.75, anusRatio: 0.52, skinToughness: 0.6, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.42, sliceGramBase: 11, minFilletLengthCm: 30, bodyRatio: 0.46, filletShape: 'loin_thick',
  },
  spotted_knifejaw: {
    speciesId: 'spotted_knifejaw', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.75, anusRatio: 0.52, skinToughness: 0.6, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.42, sliceGramBase: 11, minFilletLengthCm: 30, bodyRatio: 0.46, filletShape: 'loin_thick',
  },

  // ── 붉은살 회유어 (두껍게 적게 = sliceGramBase 큼) ──
  yellowtail: {
    speciesId: 'yellowtail', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.5, skinToughness: 0.6, bloodAmount: 0.9, filletCount: 2,
    baseYieldRate: 0.52, sliceGramBase: 14, minFilletLengthCm: 40, bodyRatio: 0.32, filletShape: 'loin_thick',
  },
  amberjack: {
    speciesId: 'amberjack', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.5, skinToughness: 0.6, bloodAmount: 0.9, filletCount: 2,
    baseYieldRate: 0.52, sliceGramBase: 14, minFilletLengthCm: 45, bodyRatio: 0.30, filletShape: 'loin_thick',
  },
  greater_amberjack: {
    speciesId: 'greater_amberjack', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.5, skinToughness: 0.62, bloodAmount: 0.95, filletCount: 2,
    baseYieldRate: 0.53, sliceGramBase: 15, minFilletLengthCm: 50, bodyRatio: 0.34, filletShape: 'loin_thick',
  },
  spanish_mackerel: {
    speciesId: 'spanish_mackerel', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.35, anusRatio: 0.5, skinToughness: 0.5, bloodAmount: 0.85, filletCount: 2,
    baseYieldRate: 0.50, sliceGramBase: 13, minFilletLengthCm: 40, bodyRatio: 0.26, filletShape: 'loin_thick',
  },
  chub_mackerel: {
    speciesId: 'chub_mackerel', bodyShape: 'round', hasScales: false,
    scaleToughness: 0.2, anusRatio: 0.5, skinToughness: 0.4, bloodAmount: 0.8, filletCount: 2,
    baseYieldRate: 0.50, sliceGramBase: 12, minFilletLengthCm: 25, bodyRatio: 0.30, filletShape: 'loin_thick',
  },
  horse_mackerel: {
    speciesId: 'horse_mackerel', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.35, anusRatio: 0.5, skinToughness: 0.42, bloodAmount: 0.7, filletCount: 2,
    baseYieldRate: 0.42, sliceGramBase: 9, minFilletLengthCm: 15, bodyRatio: 0.32, filletShape: 'small',
  },

  // ── 볼락류·소형 (작고 머리 큼 = 저수율) ──
  dark_banded_rockfish: {
    speciesId: 'dark_banded_rockfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.5, anusRatio: 0.5, skinToughness: 0.5, bloodAmount: 0.45, filletCount: 2,
    baseYieldRate: 0.38, sliceGramBase: 10, minFilletLengthCm: 20, bodyRatio: 0.40, filletShape: 'small',
  },
  blue_rockfish: {
    speciesId: 'blue_rockfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.5, anusRatio: 0.5, skinToughness: 0.5, bloodAmount: 0.45, filletCount: 2,
    baseYieldRate: 0.38, sliceGramBase: 10, minFilletLengthCm: 20, bodyRatio: 0.40, filletShape: 'small',
  },
  golden_rockfish: {
    speciesId: 'golden_rockfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.5, anusRatio: 0.5, skinToughness: 0.5, bloodAmount: 0.45, filletCount: 2,
    baseYieldRate: 0.38, sliceGramBase: 10, minFilletLengthCm: 20, bodyRatio: 0.42, filletShape: 'small',
  },
  black_rockfish: {
    speciesId: 'black_rockfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.55, anusRatio: 0.5, skinToughness: 0.52, bloodAmount: 0.45, filletCount: 2,
    baseYieldRate: 0.38, sliceGramBase: 10, minFilletLengthCm: 22, bodyRatio: 0.44, filletShape: 'small',
  },
  filefish: {
    speciesId: 'filefish', bodyShape: 'round', hasScales: false,
    scaleToughness: 0.1, anusRatio: 0.55, skinToughness: 0.85, bloodAmount: 0.35, filletCount: 2,
    baseYieldRate: 0.35, sliceGramBase: 9, minFilletLengthCm: 15, bodyRatio: 0.55, filletShape: 'small',
  },

  // ── 대두·저수율 / 특이 체형 ──
  pacific_cod: {
    speciesId: 'pacific_cod', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.3, anusRatio: 0.48, skinToughness: 0.55, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.32, sliceGramBase: 12, minFilletLengthCm: 40, bodyRatio: 0.34, filletShape: 'loin_thick',
  },
  // 갈치 — 리본형 (박피 없음, 은분만 제거)
  hairtail: {
    speciesId: 'hairtail', bodyShape: 'round', hasScales: false,
    scaleToughness: 0.15, anusRatio: 0.45, skinToughness: 0.4, bloodAmount: 0.55, filletCount: 2,
    baseYieldRate: 0.55, sliceGramBase: 10, minFilletLengthCm: 30, bodyRatio: 0.14, filletShape: 'small',
  },
  // 숭어류 — 기수역, 회유
  striped_mullet: {
    speciesId: 'striped_mullet', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.55, anusRatio: 0.5, skinToughness: 0.5, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.45, sliceGramBase: 11, minFilletLengthCm: 30, bodyRatio: 0.30, filletShape: 'loin_thick',
  },
  redlip_mullet: {
    speciesId: 'redlip_mullet', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.55, anusRatio: 0.5, skinToughness: 0.5, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.45, sliceGramBase: 11, minFilletLengthCm: 30, bodyRatio: 0.30, filletShape: 'loin_thick',
  },

  // ── 납작형 (광어 5장뜨기 — 대형 ≥45cm는 computeFilletYield에서 5장 분기) ──
  flatfish: {
    speciesId: 'flatfish', bodyShape: 'flat', hasScales: true,
    scaleToughness: 0.45, anusRatio: 0.42, skinToughness: 0.7, bloodAmount: 0.4, filletCount: 4,
    baseYieldRate: 0.48, sliceGramBase: 9, minFilletLengthCm: 30, bodyRatio: 0.55, filletShape: 'flat_wide',
  },
  flounder: {
    speciesId: 'flounder', bodyShape: 'flat', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.42, skinToughness: 0.65, bloodAmount: 0.4, filletCount: 4,
    baseYieldRate: 0.44, sliceGramBase: 9, minFilletLengthCm: 20, bodyRatio: 0.6, filletShape: 'flat_wide',
  },
};

/** 미등록 어종 폴백 — 원형어 표준값 */
export const DEFAULT_BUTCHERY_PROFILE: ButcheryProfile = {
  speciesId: 'default', bodyShape: 'round', hasScales: true,
  scaleToughness: 0.55, anusRatio: 0.5, skinToughness: 0.5, bloodAmount: 0.5, filletCount: 2,
  baseYieldRate: 0.40, sliceGramBase: 11, minFilletLengthCm: 25, bodyRatio: 0.4, filletShape: 'loin_thick',
};

export function getButcheryProfile(speciesId: string): ButcheryProfile {
  return BUTCHERY_PROFILES[speciesId] ?? { ...DEFAULT_BUTCHERY_PROFILE, speciesId };
}
