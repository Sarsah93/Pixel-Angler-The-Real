/**
 * @file ButcheryProfiles.ts
 * @description 어종별 손질(해부) 파라미터 DB — 파라메트릭 생선 템플릿 변형값
 *
 * 어종×방향×단계 스프라이트를 전부 그리는 대신, 템플릿 1종(원형/납작)에
 * 이 프로필을 주입해 변형한다. anusRatio 등 해부 수치는 리서치 기본값
 * (원형어 0.40~0.55, 광어류 0.5 근방) — 어종별 재확인/튜닝 대상.
 *
 * 순수 TS 데이터.
 */

import type { ButcheryProfile } from '../types/Butchery.js';

/** 어종별 손질 프로필 (풀렌더 이미지 보유 어종 우선 등록) */
export const BUTCHERY_PROFILES: Record<string, ButcheryProfile> = {
  // 감성돔 — 원형어 표준. 비늘 단단한 편
  black_seabream: {
    speciesId: 'black_seabream', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.65, anusRatio: 0.52, skinToughness: 0.5,
    bloodAmount: 0.6, filletCount: 2,
  },
  // 벵에돔 — 원형어, 비늘 잘고 촘촘
  largescale_blackfish: {
    speciesId: 'largescale_blackfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.7, anusRatio: 0.5, skinToughness: 0.55,
    bloodAmount: 0.55, filletCount: 2,
  },
  // 긴꼬리벵에돔 — 벵에돔 준용
  longtail_blackfish: {
    speciesId: 'longtail_blackfish', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.7, anusRatio: 0.5, skinToughness: 0.55,
    bloodAmount: 0.55, filletCount: 2,
  },
  // 광어 — 납작형 5장뜨기 (4필렛 + 중골, 엔가와 포함)
  flatfish: {
    speciesId: 'flatfish', bodyShape: 'flat', hasScales: true,
    scaleToughness: 0.45, anusRatio: 0.42, skinToughness: 0.7,
    bloodAmount: 0.4, filletCount: 4,
  },
  // 농어 — 원형어 (스펙 MVP 예시종)
  sea_bass: {
    speciesId: 'sea_bass', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.6, anusRatio: 0.48, skinToughness: 0.45,
    bloodAmount: 0.7, filletCount: 2,
  },
  // 방어 — 대형 원형어, 방혈 중요
  yellowtail: {
    speciesId: 'yellowtail', bodyShape: 'round', hasScales: true,
    scaleToughness: 0.4, anusRatio: 0.5, skinToughness: 0.6,
    bloodAmount: 0.9, filletCount: 2,
  },
};

/** 미등록 어종 폴백 — 원형어 표준값 */
export const DEFAULT_BUTCHERY_PROFILE: ButcheryProfile = {
  speciesId: 'default', bodyShape: 'round', hasScales: true,
  scaleToughness: 0.55, anusRatio: 0.5, skinToughness: 0.5,
  bloodAmount: 0.5, filletCount: 2,
};

export function getButcheryProfile(speciesId: string): ButcheryProfile {
  return BUTCHERY_PROFILES[speciesId] ?? { ...DEFAULT_BUTCHERY_PROFILE, speciesId };
}
