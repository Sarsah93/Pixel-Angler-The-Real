/**
 * @file Affinity.ts
 * @description NPC 우호도 규칙 (140차) — −1(최저) ~ 0(기본) ~ +1(최고).
 *
 * 무엇에 걸리나(사용자 지시 "메인에 너무 큰 영향을 주지 않을 정도로만"):
 *  - **서브 퀘 발주 가능 여부** — `subGateMin` 미만이면 NPC가 부탁을 거절한다(메인은 절대 거절 안 함).
 *  - **서브 보상 배율** — 티어별 재화·XP 배율(적대 0.7 ~ 친밀 1.3). 메인은 재화만 1±0.1 밴드.
 *  - **품삯** — ×(1 + 0.15 × 우호도). 적대 NPC는 일감을 주지 않는다.
 *  - **친밀 전용 선택지** — `ChoiceRequires.affinityMin`으로 데이터가 건다(스킬 포인트 등 큰 보상은 여기서만).
 *
 * 무엇에 안 걸리나: 상점·낚시·이동·손질 등 **자유 콘텐츠 전부**. 우호도는 사람 사이의 일이고,
 * 스토리를 진행하지 않는 플레이어의 게임을 좁히지 않는다(자유 플레이 보장 규칙).
 */

import { TUNING } from '../config/tuning.js';
import type { AffinityTier, StoryQuestKind } from '../types/Story.js';

export const AFFINITY_MIN = -1;
export const AFFINITY_MAX = 1;

/** 소수 둘째 자리로 클램프 — 세이브가 0.1+0.2 부동소수 잡음으로 지저분해지지 않게 */
export function clampAffinity(v: number): number {
  const c = Math.max(AFFINITY_MIN, Math.min(AFFINITY_MAX, v));
  return Math.round(c * 100) / 100;
}

/** 5티어 — 임계는 대칭 (±0.2 / ±0.6) */
export function affinityTier(v: number): AffinityTier {
  if (v <= -0.6) return 'hostile';
  if (v <= -0.2) return 'cold';
  if (v < 0.2) return 'neutral';
  if (v < 0.6) return 'warm';
  return 'close';
}

export const AFFINITY_TIER_LABEL: Record<AffinityTier, { ko: string; en: string; color: number }> = {
  hostile: { ko: '적대', en: 'Hostile', color: 0xe0605a },
  cold:    { ko: '냉담', en: 'Cold',    color: 0xd89a5a },
  neutral: { ko: '보통', en: 'Neutral', color: 0x9fb4c8 },
  warm:    { ko: '호의', en: 'Warm',    color: 0x8fd8a8 },
  close:   { ko: '친밀', en: 'Close',   color: 0xffd257 },
};

/**
 * 퀘 보상 배율. 서브 = 티어표 / 메인 = 재화만 1 ± band(우호도 비례) — XP는 메인 계약(§8-1) 불변.
 */
export function affinityRewardMult(v: number, kind: StoryQuestKind, what: 'coins' | 'xp'): number {
  const t = TUNING.affinity;
  if (kind === 'main') {
    if (what === 'xp') return 1;
    return 1 + Math.max(-1, Math.min(1, v)) * t.mainCoinBand;
  }
  switch (affinityTier(v)) {
    case 'hostile': return t.rewardHostile;
    case 'cold': return t.rewardCold;
    case 'warm': return t.rewardWarm;
    case 'close': return t.rewardClose;
    default: return 1;
  }
}

/** 품삯 배율 — 적대면 일감 자체가 닫히므로 여기선 냉담~친밀만 실제로 쓰인다 */
export function affinityJobWageMult(v: number): number {
  return Math.max(0.5, 1 + TUNING.affinity.jobWageSlope * Math.max(-1, Math.min(1, v)));
}

/** 서브 퀘 발주 가능? (메인은 호출하지 말 것 — 항상 가능) */
export function canOfferSubQuest(v: number): boolean {
  return v >= TUNING.affinity.subGateMin;
}

/** 적대 NPC는 품삯 일감을 주지 않는다 */
export function canOfferJobs(v: number): boolean {
  return affinityTier(v) !== 'hostile';
}

/** UI 게이지 — −5 ~ +5 정수 눈금 */
export function affinityPips(v: number): number {
  return Math.round(Math.max(-1, Math.min(1, v)) * 5);
}
