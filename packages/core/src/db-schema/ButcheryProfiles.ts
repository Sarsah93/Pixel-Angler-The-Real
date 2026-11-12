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

import type { ButcheryProfile, ButcheryFamily } from '../types/Butchery.js';
import { ORACLE_FISH_DB } from '../simulation/FishSpawningOracle.js';
import { isCephalopodTreeReady } from './CephalopodStages.js';
import { SIZE_TIER_BOUNDS } from '../simulation/SizeTierRules.js';

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
  // 322 — 전갱이류는 옆줄에 모비늘이 있다(`hasScutes` — 밑손질 「모비늘 제거」). 새 전갱이류(줄전갱이 · 갈전갱이 · 가라지)도 같은 표시를 단다
  horse_mackerel: {
    speciesId: 'horse_mackerel', bodyShape: 'round', hasScales: true, hasScutes: true,
    scaleToughness: 0.35, anusRatio: 0.5, skinToughness: 0.42, bloodAmount: 0.7, filletCount: 2,
    baseYieldRate: 0.42, sliceGramBase: 9, minFilletLengthCm: 15, bodyRatio: 0.32, filletShape: 'small',
  },

  // ── 볼락류·소형 (작고 머리 큼 = 저수율) ──
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
  // 313 — 열기(불볼락) · 볼락류 셋째(방어류 흐름 · 작고 머리 큰 저수율)
  red_snapper_rockfish: {
    speciesId: 'red_snapper_rockfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.5, anusRatio: 0.5, skinToughness: 0.48, bloodAmount: 0.45, filletCount: 2,
    baseYieldRate: 0.36, sliceGramBase: 9, minFilletLengthCm: 18, bodyRatio: 0.38, filletShape: 'small',
  },

  // ── 313 돔류 트리(체고형 소형) — 망상어 · 용치놀래기(사용자 「돔류쪽 손질 트리」) ──
  surfperch: {
    speciesId: 'surfperch', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.45, anusRatio: 0.52, skinToughness: 0.42, bloodAmount: 0.45, filletCount: 2,
    baseYieldRate: 0.36, sliceGramBase: 8, minFilletLengthCm: 16, bodyRatio: 0.45, filletShape: 'small',
  },
  rainbow_wrasse: {
    speciesId: 'rainbow_wrasse', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.5, skinToughness: 0.4, bloodAmount: 0.4, filletCount: 2,
    baseYieldRate: 0.34, sliceGramBase: 7, minFilletLengthCm: 14, bodyRatio: 0.26, filletShape: 'small',
  },

  // ── 313 작은 생선 공정(`tree: 'small'`) — 비늘 → 머리 · 내장 → 검은 막 · 혈합육 → 삼장뜨기 → 갈비뼈 · 잔뼈(핀셋) ──
  pacific_saury: {
    speciesId: 'pacific_saury', bodyShape: 'round', hasScales: true, tree: 'small',
    scaleToughness: 0.15, anusRatio: 0.62, skinToughness: 0.3, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.46, sliceGramBase: 7, minFilletLengthCm: 20, bodyRatio: 0.12, filletShape: 'small',
  },
  halfbeak: {
    speciesId: 'halfbeak', bodyShape: 'round', hasScales: true, tree: 'small',
    scaleToughness: 0.15, anusRatio: 0.62, skinToughness: 0.3, bloodAmount: 0.35, filletCount: 2,
    baseYieldRate: 0.40, sliceGramBase: 5, minFilletLengthCm: 18, bodyRatio: 0.09, filletShape: 'small',
  },
  round_herring: {
    speciesId: 'round_herring', bodyShape: 'round', hasScales: true, tree: 'small',
    scaleToughness: 0.2, anusRatio: 0.55, skinToughness: 0.3, bloodAmount: 0.55, filletCount: 2,
    baseYieldRate: 0.42, sliceGramBase: 6, minFilletLengthCm: 12, bodyRatio: 0.20, filletShape: 'small',
  },
  northern_whiting: {
    speciesId: 'northern_whiting', bodyShape: 'round', hasScales: true, tree: 'small',
    scaleToughness: 0.3, anusRatio: 0.52, skinToughness: 0.32, bloodAmount: 0.35, filletCount: 2,
    baseYieldRate: 0.40, sliceGramBase: 6, minFilletLengthCm: 14, bodyRatio: 0.18, filletShape: 'small',
  },
  yellowfin_goby: {
    speciesId: 'yellowfin_goby', bodyShape: 'round', hasScales: true, tree: 'small',
    scaleToughness: 0.25, anusRatio: 0.48, skinToughness: 0.32, bloodAmount: 0.4, filletCount: 2,
    baseYieldRate: 0.36, sliceGramBase: 6, minFilletLengthCm: 12, bodyRatio: 0.20, filletShape: 'small',
  },
  // ── 322 청어과 셋도 작은 생선 공정(비늘 → 머리 · 내장 → 검은 막 → 삼장뜨기 → 갈비뼈 · 잔뼈) ──
  //  전어 = 뼈째 썰기도 하지만 포를 뜨면 잔가시가 많다 · 청어 = 잔가시가 아주 많다 · 멸치 = 큰 것(대멸)만 포를 뜬다
  gizzard_shad: {
    speciesId: 'gizzard_shad', bodyShape: 'round', hasScales: true, tree: 'small',
    scaleToughness: 0.3, anusRatio: 0.58, skinToughness: 0.3, bloodAmount: 0.55, filletCount: 2,
    baseYieldRate: 0.44, sliceGramBase: 6, minFilletLengthCm: 15, bodyRatio: 0.30, filletShape: 'small',
  },
  pacific_herring: {
    speciesId: 'pacific_herring', bodyShape: 'round', hasScales: true, tree: 'small',
    scaleToughness: 0.2, anusRatio: 0.6, skinToughness: 0.3, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.46, sliceGramBase: 7, minFilletLengthCm: 20, bodyRatio: 0.22, filletShape: 'small',
  },
  anchovy: {
    speciesId: 'anchovy', bodyShape: 'round', hasScales: true, tree: 'small',
    scaleToughness: 0.1, anusRatio: 0.6, skinToughness: 0.25, bloodAmount: 0.5, filletCount: 2,
    baseYieldRate: 0.45, sliceGramBase: 3, minFilletLengthCm: 10, bodyRatio: 0.16, filletShape: 'small',
  },

  // ── 322 조기류 — 몸이 길쭉해 방어류 흐름(농어 · 숭어와 같은 삼장뜨기 · 각자 그림) ──
  yellow_croaker: {
    speciesId: 'yellow_croaker', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.52, skinToughness: 0.4, bloodAmount: 0.45, filletCount: 2,
    baseYieldRate: 0.40, sliceGramBase: 8, minFilletLengthCm: 20, bodyRatio: 0.27, filletShape: 'small',
  },
  white_croaker: {
    speciesId: 'white_croaker', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.52, skinToughness: 0.4, bloodAmount: 0.45, filletCount: 2,
    baseYieldRate: 0.40, sliceGramBase: 9, minFilletLengthCm: 22, bodyRatio: 0.30, filletShape: 'small',
  },

  // ── 322 바리류 — 우럭 · 농어처럼 몸통이 둥근 방어류 흐름(삼장뜨기) · 큰 개체(80cm↑)는 4덩어리 해체(`LOIN_BREAKDOWN_MIN_CM`) ──
  //  잔비늘이 살에 박혀 있고 껍질이 두껍다(껍질은 데쳐 숙회로 쓴다 — 박피 난이도 높음)
  redspotted_grouper: {
    speciesId: 'redspotted_grouper', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.45, anusRatio: 0.55, skinToughness: 0.6, bloodAmount: 0.55, filletCount: 2,
    baseYieldRate: 0.40, sliceGramBase: 11, minFilletLengthCm: 25, bodyRatio: 0.33, filletShape: 'loin_thick',
  },
  longtooth_grouper: {
    speciesId: 'longtooth_grouper', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.5, anusRatio: 0.55, skinToughness: 0.7, bloodAmount: 0.65, filletCount: 2,
    baseYieldRate: 0.42, sliceGramBase: 13, minFilletLengthCm: 40, bodyRatio: 0.32, filletShape: 'loin_thick',
  },
  sawedged_perch: {
    speciesId: 'sawedged_perch', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.45, anusRatio: 0.55, skinToughness: 0.6, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.44, sliceGramBase: 13, minFilletLengthCm: 40, bodyRatio: 0.30, filletShape: 'loin_thick',
  },
  sevenband_grouper: {
    speciesId: 'sevenband_grouper', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.5, anusRatio: 0.55, skinToughness: 0.65, bloodAmount: 0.6, filletCount: 2,
    baseYieldRate: 0.41, sliceGramBase: 12, minFilletLengthCm: 30, bodyRatio: 0.36, filletShape: 'loin_thick',
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

  // ── 317 참다랑어 — 늘 4덩어리 해체(`tree: 'loin'` · 등살 2 · 뱃살 2 + 중골). 비늘치기 없음(잔비늘 · 갑옷 비늘은 껍질과 함께 벗긴다) ──
  bluefin_tuna: {
    speciesId: 'bluefin_tuna', bodyShape: 'round', hasScales: false, tree: 'loin',
    scaleToughness: 0.1, anusRatio: 0.55, skinToughness: 0.7, bloodAmount: 1.0, filletCount: 4,
    baseYieldRate: 0.60, sliceGramBase: 16, minFilletLengthCm: 50, bodyRatio: 0.28, filletShape: 'loin_thick',
  },

  // ── 장어류 (315 — `tree: 'eel'` · 송곳 고정 · 펼친 포 한 장) ──
  //  붕장어 = 등 가르기 · 갯장어 = 배 가르기 + 뼈끊기 · 먹장어 = 껍질 통째로 벗기기(뼈 없음)
  conger_eel: {
    speciesId: 'conger_eel', bodyShape: 'round', hasScales: false, tree: 'eel',
    scaleToughness: 0, anusRatio: 0.40, skinToughness: 0.3, bloodAmount: 0.4, filletCount: 1,
    baseYieldRate: 0.55, sliceGramBase: 8, minFilletLengthCm: 35, bodyRatio: 0.07, filletShape: 'small',
  },
  pike_conger: {
    speciesId: 'pike_conger', bodyShape: 'round', hasScales: false, tree: 'eel',
    scaleToughness: 0, anusRatio: 0.38, skinToughness: 0.3, bloodAmount: 0.4, filletCount: 1,
    baseYieldRate: 0.50, sliceGramBase: 8, minFilletLengthCm: 50, bodyRatio: 0.06, filletShape: 'small',
  },
  hagfish: {
    speciesId: 'hagfish', bodyShape: 'round', hasScales: false, tree: 'eel',
    scaleToughness: 0, anusRatio: 0.86, skinToughness: 0.2, bloodAmount: 0.3, filletCount: 1,
    baseYieldRate: 0.60, sliceGramBase: 10, minFilletLengthCm: 30, bodyRatio: 0.10, filletShape: 'small',
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
  // 도다리류 — 광어와 동일한 다섯장뜨기 트리 공유 (2026-08-05 넙치류 손질 개방)
  frog_flounder: {
    speciesId: 'frog_flounder', bodyShape: 'flat', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.42, skinToughness: 0.65, bloodAmount: 0.4, filletCount: 4,
    baseYieldRate: 0.43, sliceGramBase: 9, minFilletLengthCm: 20, bodyRatio: 0.62, filletShape: 'flat_wide',
  },
  starry_flounder: {
    speciesId: 'starry_flounder', bodyShape: 'flat', hasScales: true,
    scaleToughness: 0.45, anusRatio: 0.42, skinToughness: 0.68, bloodAmount: 0.4, filletCount: 4,
    baseYieldRate: 0.43, sliceGramBase: 9, minFilletLengthCm: 22, bodyRatio: 0.6, filletShape: 'flat_wide',
  },
  // 313 — 개서대(참서대류 · 사용자 「광어 손질 트리」) — 길쭉한 납작어라 살이 얇고 엔가와가 좁다
  tonguefish: {
    speciesId: 'tonguefish', bodyShape: 'flat', hasScales: true,
    scaleToughness: 0.5, anusRatio: 0.38, skinToughness: 0.72, bloodAmount: 0.35, filletCount: 4,
    baseYieldRate: 0.42, sliceGramBase: 8, minFilletLengthCm: 22, bodyRatio: 0.34, filletShape: 'flat_wide',
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

/**
 * 317 — **4덩어리 해체로 가는 방어류의 체장 기준**(cm 이상). 크기 등급 「대」의 아래 끝(`SIZE_TIER_BOUNDS` 둘째 값)과 같다 —
 * 방어 70(대방어 5kg+) · 부시리 80 · 잿방어 100. 그보다 작으면 지금 삼장뜨기(필렛 둘)다. 참다랑어는 프로필이 늘 해체다.
 * 322 — 자바리 · 다금바리 · 능성어 80cm부터(크기 등급 표에 없는 어종이라 값을 바로 적는다).
 */
export const LOIN_BREAKDOWN_MIN_CM: Readonly<Record<string, number>> = {
  yellowtail: SIZE_TIER_BOUNDS.yellowtail?.[1] ?? 70,
  amberjack: SIZE_TIER_BOUNDS.amberjack?.[1] ?? 80,
  greater_amberjack: SIZE_TIER_BOUNDS.greater_amberjack?.[1] ?? 100,
  // 322 — 큰 바리류(10kg 안팎부터)는 반쪽을 등살 · 뱃살로 갈라 다룬다(일본 「쿠에」 · 「아라」 해체와 같다). 붉바리는 그만큼 크지 않는다
  longtooth_grouper: 80,
  sawedged_perch: 80,
  sevenband_grouper: 80,
};

/** 317 — 이 개체는 4덩어리 해체인가(참다랑어 · 대방어급) */
export function isLoinBreakdown(speciesId: string, lengthCm?: number): boolean {
  if (BUTCHERY_PROFILES[speciesId]?.tree === 'loin') return true;
  const min = LOIN_BREAKDOWN_MIN_CM[speciesId];
  return min !== undefined && (lengthCm ?? 0) >= min;
}

/**
 * 317 — **개체에 맞는 손질 프로필**. 손질 공정은 어종만이 아니라 크기로도 갈린다(대방어급 = 해체).
 * 손질 창 · 섹션 트리 · 시험은 이것을 쓴다 — `getButcheryProfile`은 어종 기본값(수율 · 형상 표)이다.
 */
export function butcheryProfileFor(speciesId: string, lengthCm?: number): ButcheryProfile {
  const p = getButcheryProfile(speciesId);
  if (p.tree === 'loin' || !isLoinBreakdown(speciesId, lengthCm)) return p;
  return { ...p, tree: 'loin', filletCount: 4 };
}

/**
 * 손질 미니게임이 **현재 구현된** 어종 (2026-07-30 사용자 지시 — 우선 이 그룹만 활성):
 *  - 돔류(bream): 감성돔·참돔(주/야)·벵에돔·긴꼬리벵에돔·돌돔·강담돔
 *    313 — 망상어 · 용치놀래기도 돔류 트리(사용자 「돔류쪽 손질 트리 · 감성돔 그림으로 하면 안 됨」 — 각자 그림)
 *  - 방어류: 방어·부시리·잿방어 (손질 절차 동일 — 픽셀 가이드는 잿방어 형태 기준)
 *    300 D — **고등어**도 이 흐름이다(사용자 지시 「방어류와 동일하게 손질 — 계통상 작은 방어」 · 프로필 `chub_mackerel` 25cm부터)
 *    313 — 몸통이 둥근 농어 · 우럭 · 볼락류 셋 · 숭어 · 가숭어도 이 흐름(사용자 「기존 흐름 그대로 · 그림은 각자 어종」)
 *  - 작은 생선(313 · `tree: 'small'`): 꽁치 · 학꽁치 · 눈퉁멸 · 보리멸 · 문절망둑 — 비늘 → 머리 · 내장 → 검은 막 → 삼장뜨기 → 갈비뼈 · 잔뼈
 *  - 넙치류(flat): 광어·도다리류 — **다섯장뜨기** 전용 트리 (2026-08-05 개방) · 313 개서대
 *  - 장어류(315 · `tree: 'eel'`): 붕장어 · 갯장어 · 먹장어 — 송곳 고정 → 점액 · 껍질 → 가르기 · 펼치기 → 내장 → 중골 · 지느러미 → 머리
 *  - 4덩어리 해체(317 · `tree: 'loin'`): 참다랑어(늘) · 방어 70 · 부시리 80 · 잿방어 100cm 이상(`butcheryProfileFor`)
 *    322 — 자바리 · 다금바리 · 능성어 80cm 이상
 *  - 322 — 전어 · 청어 · 멸치(작은 생선 공정) · 참조기 · 백조기 · 붉바리 · 자바리 · 다금바리 · 능성어(방어류 흐름)는
 *    배선만 하고 그림 대기(`BUTCHERY_ART_PENDING_SPECIES`) — 그림이 생기면 열린다
 * 그 외 finfish(쥐치 · 대구 · 갈치 등)·복어는 미구현(banned) — 추후 별도 구현.
 */
/**
 * 322 — **공정 · 프로필 · 어종군까지 배선했지만 도마 그림(어종 온마리)이 아직 없어 닫아 둔 어종.**
 * 손질 옆면은 언제나 그 어종의 그림이어야 한다(320 — 다른 어종 그림으로 대신 그리지 않는다). 그림을 구우면
 * (`gemini_fish_art.cjs` → `fish_cards.cjs` → `gen_species_sprites.cjs`) 이 목록에서 빼는 것으로 열린다.
 */
export const BUTCHERY_ART_PENDING_SPECIES: ReadonlySet<string> = new Set<string>([
  'gizzard_shad', 'pacific_herring', 'anchovy', 'yellow_croaker', 'white_croaker',
  'redspotted_grouper', 'longtooth_grouper', 'sawedged_perch', 'sevenband_grouper',
]);

/** 322 — 공정이 배선된 어종 전부(그림 대기 포함) — 분류 · 시험 · 위키용. 실제로 열린 것은 `BUTCHERY_IMPLEMENTED_SPECIES` */
export const BUTCHERY_WIRED_SPECIES: ReadonlySet<string> = new Set<string>([
  // 돔류
  'black_seabream', 'red_seabream', 'night_seabream',
  'largescale_blackfish', 'longtail_blackfish', 'stone_beakperch', 'spotted_knifejaw',
  'surfperch', 'rainbow_wrasse',   // 313 — 망상어 · 용치놀래기(돔류 트리)
  // 방어류
  'yellowtail', 'amberjack', 'greater_amberjack',
  'chub_mackerel',   // 300 D — 고등어(방어류 흐름)
  'horse_mackerel', 'spanish_mackerel',   // 301 — 전갱이 · 삼치(사용자 「방어류 회뜨기로 우선 적용」 — 같은 흐름 · 전갱이는 작은 필렛 · 삼치는 두툼한 로인)
  // 313 — 몸통이 둥근 어종(방어류 흐름 · 각자 그림)
  'sea_bass', 'black_rockfish', 'blue_rockfish', 'golden_rockfish', 'red_snapper_rockfish',
  'striped_mullet', 'redlip_mullet',
  // 313 — 작은 생선 공정
  'pacific_saury', 'halfbeak', 'round_herring', 'northern_whiting', 'yellowfin_goby',
  // 315 — 장어류(송곳 고정 · 가르기 · 펼친 포)
  'conger_eel', 'pike_conger', 'hagfish',
  // 317 — 참다랑어(4덩어리 해체 — 방어류 앞 단계 + 양면 해체 · 중골 살 · 덩어리 다듬기)
  'bluefin_tuna',
  // 넙치류 (다섯장뜨기)
  'flatfish', 'flounder', 'frog_flounder', 'starry_flounder',
  'tonguefish',   // 313 — 개서대(광어 트리)
  // 322 — 청어과 셋(작은 생선 공정) · 조기류 둘 · 바리류 넷(방어류 흐름 — 큰 바리는 4덩어리 해체)
  'gizzard_shad', 'pacific_herring', 'anchovy',
  'yellow_croaker', 'white_croaker',
  'redspotted_grouper', 'longtooth_grouper', 'sawedged_perch', 'sevenband_grouper',
]);

export const BUTCHERY_IMPLEMENTED_SPECIES: ReadonlySet<string> = new Set<string>(
  [...BUTCHERY_WIRED_SPECIES].filter((id) => !BUTCHERY_ART_PENDING_SPECIES.has(id)),
);

/**
 * 313 — 손질 도마 **어종군**(유도선 좌표 세트 · 개복 뒤 공용 그림 · 부산물 아이콘) 단일 출처.
 *  - `amberjack` = 방추형(잿방어 그림 · 방어류 유도선) — 방어류 · 고등어 · 전갱이 · 삼치 · 농어 · 우럭 · 볼락 · 숭어 · 작은 생선
 *  - `bream` = 체고형(감성돔 그림 · 돔류 유도선) — 돔류 · 망상어 · 용치놀래기 · 그 밖 기본값
 *  - `halibut` = 넙치류(광어 탑뷰 · 다섯장뜨기 유도선)
 * client `butcherFamilyOf`가 이것을 그대로 읽는다 — 어종군 표를 두 곳에 두지 않는다(301 고등어 · 삼치는
 * client만 방어류로 그리고 core는 돔류 유도선을 내 선이 그림과 어긋났다).
 */
export type ButcheryArtFamily = 'amberjack' | 'bream' | 'halibut';

const AMBERJACK_ART_SPECIES: ReadonlySet<string> = new Set<string>([
  'yellowtail', 'amberjack', 'greater_amberjack', 'chub_mackerel', 'horse_mackerel', 'spanish_mackerel',
  'sea_bass', 'black_rockfish', 'blue_rockfish', 'golden_rockfish', 'red_snapper_rockfish',
  'striped_mullet', 'redlip_mullet',
  'pacific_saury', 'halfbeak', 'round_herring', 'northern_whiting', 'yellowfin_goby',
  'bluefin_tuna',   // 317 — 방추형(앞 단계 유도선 · 복면 · 체강 공용 그림은 방어류)
  // 322 — 청어과(작은 생선) · 조기류 · 바리류: 체고가 몸길이의 3분의 1 안팎이라 방추형 쪽(우럭 · 농어와 같다)
  'gizzard_shad', 'pacific_herring', 'anchovy', 'yellow_croaker', 'white_croaker',
  'redspotted_grouper', 'longtooth_grouper', 'sawedged_perch', 'sevenband_grouper',
]);

export function butcheryArtFamily(speciesId: string): ButcheryArtFamily {
  if (AMBERJACK_ART_SPECIES.has(speciesId)) return 'amberjack';
  if (BUTCHERY_PROFILES[speciesId]?.bodyShape === 'flat') return 'halibut';
  return 'bream';
}

/** 313 — 방어류 3종(잿방어 그림의 원본 어종) — 개복 뒤 공용 그림을 어종 색으로 물들이지 않는다 */
export const BUTCHERY_NATIVE_ART_SPECIES: ReadonlySet<string> = new Set<string>(['yellowtail', 'amberjack', 'greater_amberjack']);

/**
 * 어종의 손질 형태 분류.
 *  - 복어류: speciesId에 'puffer' 포함(복섬/참복/까치복) — 자격·독 제거 필요(스텁)
 *  - 두족류: 오라클 egiOnly 플래그(오징어/문어/갑오징어) — 별도 손질 트리(스텁)
 *  - finfish: **BUTCHERY_IMPLEMENTED_SPECIES만** = 삼면 · 작은 생선 · 다섯장뜨기 (FSM 구현)
 *  - 그 외(넙치류 등 미구현): unsupported (banned — 추후 구현)
 */
export function getButcheryFamily(speciesId: string): ButcheryFamily {
  if (!speciesId) return 'unsupported';
  if (speciesId.includes('puffer')) return 'pufferfish';
  const spec = ORACLE_FISH_DB.find((s) => s.speciesId === speciesId);
  if (spec?.egiOnly) return 'cephalopod';
  if (BUTCHERY_IMPLEMENTED_SPECIES.has(speciesId)) return 'finfish';
  return 'unsupported';
}

/** 손질 형태별 안내 문구 (finfish는 정상 진행이라 문구 없음) */
export const BUTCHERY_FAMILY_NOTICE: Record<Exclude<ButcheryFamily, 'finfish'>, string> = {
  // 188차 — 097차에 한치·참문어·대문어 트리가 열렸는데 문구가 87차(무늬오징어만)에 멈춰 있었다.
  //   지금 이 안내가 뜨는 두족류는 갑오징어뿐이다(AG ⑤f).
  //   313 — 갑오징어도 무늬오징어 공정으로 열려 지금 이 안내가 뜨는 두족류는 없다(새 두족류가 생기면 쓴다).
  cephalopod: '이 두족류 손질은 준비 중입니다 (무늬오징어·한치·살오징어·갑오징어·문어·대문어는 손질할 수 있습니다)',
  pufferfish: '복어는 자격증(독 제거)이 필요합니다 — 준비 중입니다',
  unsupported: '아직 손질할 수 없는 어종입니다 (쥐치류 · 대구 · 갈치 등과 그림을 준비 중인 어종은 추후 구현)',
};

/**
 * **손질을 시작할 수 있는가** — UI 게이트의 단일 기준 (87차).
 *
 * 구 게이트는 `family === 'finfish'`만 봤다. 두족류 트리가 종별로 순차 구현되므로
 * (87차 = 무늬오징어만) 분류(`getButcheryFamily`)와 **구현 여부**를 분리한다.
 * 분류는 계속 'cephalopod'을 돌려주고(렌더러·수율이 이걸로 갈린다), 개방 여부만 여기서 판단한다.
 */
export function canButcherSpecies(speciesId: string): boolean {
  const fam = getButcheryFamily(speciesId);
  if (fam === 'finfish') return true;
  if (fam === 'cephalopod') return isCephalopodTreeReady(speciesId);
  return false;
}
