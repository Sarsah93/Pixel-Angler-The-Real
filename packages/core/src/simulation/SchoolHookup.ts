/**
 * @file SchoolHookup.ts
 * @description 무리 걸림(한 번에 두세 마리) 판정 — 195차
 *
 * 떼를 지어 다니는 열기(불볼락)·전갱이는 **제철**이고 **그 어종의 입질 확률이 50% 이상**일 때
 * (두 조건 모두) 한 번의 입질에 여러 바늘이 동시에 물린다.
 *   - 입질 확률 = 어종 활성도(`speciesBiteReadiness`) — 지금 수심층·지형·미끼·물때·주야간이
 *     그 어종이 가장 잘 무는 조건에 얼마나 가까운가(0~1). 다른 어종 수와 무관하다.
 *   - 두 마리 10% · 세 마리 2.5% (사용자 지정)
 *   - 바늘이 모자라면 그만큼은 걸릴 수 없다 — 두 마리는 바늘 2개, 세 마리는 바늘 3개가 필요하다.
 *     (세 마리 몫이 굴러도 바늘이 2개뿐이면 두 마리로 내리지 않는다 — 확률을 지정값 그대로 지킨다)
 *   - 파이트는 마릿수만큼 무거워진다(힘·무게·체력 ×1.2 / ×1.5). 낚아 올리기 전까지 마릿수는 보이지 않는다.
 *
 * 196차 — 채비 종류별 배율(`SCHOOL_KIT_MULT`):
 *   - 루어(하드·소프트) = 0 — 바늘이 루어 한 몸이라 두세 마리가 따로 물 자리가 없다(사용자 결정).
 *   - 타이라바 = ¼ — 어시스트 바늘 2개에 미끼를 달 수 있어 실제로도 **드물게** 쌍걸이가 난다
 *     (두 마리 2.5% · 세 마리는 바늘이 2개라 없음).
 *
 * 순수 판정만 둔다 — 활성도(`speciesBiteReadiness`)·바늘 수·난수는 호출측이 넘긴다.
 */

import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import type { RigKitKind } from './RigTree.js';

/** 무리 걸림 대상 어종 (열기 · 전갱이) */
export const SCHOOL_HOOKUP_SPECIES: readonly string[] = ['red_snapper_rockfish', 'horse_mackerel'];
/** 한 번에 두 마리 걸릴 확률 */
export const SCHOOL_DOUBLE_CHANCE = 0.10;
/** 한 번에 세 마리 걸릴 확률 */
export const SCHOOL_TRIPLE_CHANCE = 0.025;
/** 발동 조건 — 어종 입질 확률(활성도)의 하한 */
export const SCHOOL_MIN_BITE_CHANCE = 0.5;
/** 마릿수별 파이트 난이도 배율(힘·무게·체력) */
export const SCHOOL_FIGHT_MULT: Readonly<Record<1 | 2 | 3, number>> = { 1: 1, 2: 1.2, 3: 1.5 };

export type SchoolCount = 1 | 2 | 3;

/** 196차 — 채비 종류별 무리 걸림 배율(없으면 1) */
export const SCHOOL_KIT_MULT: Readonly<Partial<Record<RigKitKind, number>>> = {
  tairaba: 0.25, lure_hard: 0, lure_soft: 0,
};

/** 채비 종류 → 무리 걸림 배율 */
export function schoolKitMult(kit: RigKitKind | null | undefined): number {
  return kit ? (SCHOOL_KIT_MULT[kit] ?? 1) : 1;
}

/** 제철인가 — 도감의 성수기 달(`peakSeasonMonths`) */
export function isPeakSeason(speciesId: string, month: number): boolean {
  return FISH_DATABASE.find((f) => f.id === speciesId)?.peakSeasonMonths.includes(month) ?? false;
}

/** 무리 걸림 조건(어종 · 제철 · 입질 확률 50% 이상)을 만족하는가 */
export function schoolHookupEligible(speciesId: string, month: number, biteChance: number): boolean {
  return SCHOOL_HOOKUP_SPECIES.includes(speciesId)
    && isPeakSeason(speciesId, month)
    && biteChance >= SCHOOL_MIN_BITE_CHANCE;
}

/**
 * 마릿수 판정.
 * @param hookSlots 이 입질에 동시에 물릴 수 있는 바늘 수(문 바늘 포함)
 * @param roll 0~1 난수 — [0, 2.5%) 세 마리 · [2.5%, 12.5%) 두 마리 (× kitMult)
 * @param kitMult 채비 종류 배율(`schoolKitMult`) — 0이면 무리 걸림 없음
 */
export function rollSchoolHookup(
  speciesId: string, month: number, biteChance: number, hookSlots: number, roll: number, kitMult = 1,
): SchoolCount {
  if (kitMult <= 0 || !schoolHookupEligible(speciesId, month, biteChance)) return 1;
  if (roll < SCHOOL_TRIPLE_CHANCE * kitMult) return hookSlots >= 3 ? 3 : 1;
  if (roll < (SCHOOL_TRIPLE_CHANCE + SCHOOL_DOUBLE_CHANCE) * kitMult) return hookSlots >= 2 ? 2 : 1;
  return 1;
}
