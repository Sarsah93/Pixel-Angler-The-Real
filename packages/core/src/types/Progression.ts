/**
 * @file Progression.ts
 * @description 플레이어 레벨·경험치 곡선 + 활동 XP 산식 (124차 — PROGRESSION_SURVIVAL_SPEC v2 §1)
 *
 * 저장 구조는 기존 `player.level / experience`(레벨 내 잔여 XP) 그대로 — 여기서는 **공식만** 제공한다.
 * 스킬 포인트는 레벨 파생(`skillPointsForLevel` = 레벨 × 1)이므로 MAX_LEVEL 200 = 200SP
 * = 스킬 트리 총 비용(SkillDatabase Σ=200 등식)이 성립한다. 곡선을 바꾸면 §1-2 마일스톤 표와
 * 이 등식을 함께 갱신할 것.
 *
 * 손질 숙련(`GameState.skills.filleting`)은 별개 축 — 여기의 활동 XP와 이중 지급이 맞다(§2-0-3).
 */

import type { FishRarity } from '../db-schema/FishDatabase.js';
import { TUNING } from '../config/tuning.js';

/** 최대 레벨 — 도달 시 XP 누적 정지. 스킬 트리 총 비용(200pt)과 등식으로 묶여 있다 */
export const MAX_LEVEL = 200;

/**
 * 레벨 n → n+1 요구 경험치. `round(25 · n^1.5) + 75`
 * 마일스톤(스펙 §1-2 — 검증 스크립트가 이 표를 그대로 확인한다):
 *  Lv2 = 100 · Lv10 = 750 · Lv30 = 3,979 · Lv100 = 24,701 · Lv200 = 70,256 / 누적 Lv200 = 5,636,469
 */
export function xpToNext(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return Math.round(25 * Math.pow(n, 1.5)) + 75;
}

/** Lv1 → level 도달까지 누적 요구 XP (검증·통계용) */
export function cumulativeXp(level: number): number {
  let sum = 0;
  for (let n = 1; n < Math.min(level, MAX_LEVEL + 1); n++) sum += xpToNext(n);
  return sum;
}

/** 어종 희귀도 → 기본 XP (tuning `xp.rarity*`) */
export function rarityBaseXp(rarity: FishRarity | string): number {
  const x = TUNING.xp;
  switch (rarity) {
    case 'uncommon': return x.rarityUncommon;
    case 'rare': return x.rarityRare;
    case 'epic': return x.rarityEpic;
    case 'legendary': return x.rarityLegendary;
    default: return x.rarityCommon;
  }
}

/**
 * 어획 1마리 XP = 희귀도 기본 × 체장계수(개체 길이 ÷ 어종 평균 길이, 0.5~3.0 클램프).
 * 평균 길이를 모르면(도감 미등재 등) 계수 1.0.
 */
export function catchXp(rarity: FishRarity | string, lengthCm: number, avgLengthCm?: number): number {
  const x = TUNING.xp;
  const f = avgLengthCm && avgLengthCm > 0
    ? Math.min(x.sizeFactorMax, Math.max(x.sizeFactorMin, lengthCm / avgLengthCm))
    : 1.0;
  return Math.max(1, Math.round(rarityBaseXp(rarity) * f));
}

/** 활동 XP 종류 — 기본값은 tuning `xp.*Base` */
export type XpActivity = 'butcher' | 'sashimi' | 'forage' | 'craft' | 'cook';

/** 손질/요리 등급 → 활동 XP 계수 (하 0.6 / 중 1.0 / 상 1.5 / 특 2.5 — 스펙 §1-3) */
export const GRADE_XP_MULT: Record<string, number> = { '하': 0.6, '중': 1.0, '상': 1.5, '특': 2.5 };

/** 활동 1회 XP = 종류 기본 × mult (등급·품질·품목 계수는 호출부가 곱한다) */
export function activityXp(kind: XpActivity, mult = 1): number {
  const x = TUNING.xp;
  const base = kind === 'butcher' ? x.butcherBase
    : kind === 'sashimi' ? x.sashimiBase
    : kind === 'forage' ? x.forageBase
    : kind === 'craft' ? x.craftBase
    : x.cookBase;
  return Math.max(1, Math.round(base * mult));
}
