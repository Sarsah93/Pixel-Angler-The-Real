/**
 * @file SleepRules.ts
 * @description 잠 규칙 (213차 — 사용자 확정 A~F · 순수 TS).
 *
 *  A. 잘 수 있는 때 — 피로 `minFatiguePct`% 이상 **또는** 지난 잠 뒤 `minAwakeMin`분 이상 깨어 있었다(잠 연타 = 이야기 날짜 폭주 방지).
 *  B. 얼마나 자나 — 실제 `fullNightSec`초를 다 자면 하룻밤(하루 마감 · 저장). 그 전에 일어나면 잔 비율만큼만 회복(하루는 그대로).
 *  E. 오프라인 = 잠 — 침대에서 저장하고 끈 뒤 `offlineSleepHours`시간 넘게 지나 돌아왔고, 그때 잠들 수 있는 상태였다면 그사이 잤다.
 *
 * 세계 시계는 건너뛰지 않는다 — 물때 · 날씨 · 가게 · 멀티 세계가 한 시계(KST)를 쓴다.
 */

import { TUNING } from '../config/tuning.js';
import type { VitalsState } from '../types/Vitals.js';
import type { DayPart, SleepGate, SleepGateInput } from '../types/Sleep.js';

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** A — 지금 잠들 수 있는가 */
export function canSleep(i: SleepGateInput): SleepGate {
  const t = TUNING.sleep;
  const tired = i.maxFatigue > 0 && (i.fatigue / i.maxFatigue) * 100 >= t.minFatiguePct;
  const longAwake = i.awakeMs >= t.minAwakeMin * 60_000;
  return tired || longAwake ? { ok: true } : { ok: false, reason: 'not_tired' };
}

/** B — 누운 실제 시간(초) → 하룻밤 중 잔 비율 0~1 */
export function sleepFraction(elapsedSec: number): number {
  return clamp(elapsedSec / Math.max(0.1, TUNING.sleep.fullNightSec), 0, 1);
}

/**
 * B — 잔 비율만큼 회복한다. `frac = 1`이면 `applySleep`과 같다(피로 → `sleepFatigueTo` · 체력 +50% · 허기/수분 −10).
 * 중간에 일어나면 그 비율만큼만 — 회복도 비용도.
 */
export function applyPartialSleep(v: VitalsState, frac: number, mult = 1): void {
  const t = TUNING.vitals;
  const f = clamp(frac, 0, 1);
  const to = clamp(t.sleepFatigueTo, 0, v.maxFatigue);
  if (v.fatigue > to) v.fatigue = clamp(v.fatigue - (v.fatigue - to) * f, 0, v.maxFatigue);
  v.hp = clamp(v.hp + v.maxHp * t.sleepHpPct * mult * f, 0, v.maxHp);
  v.hunger = clamp(v.hunger - t.sleepHungerCost * f, 0, v.maxHunger);
  v.hydration = clamp(v.hydration - t.sleepHydrationCost * f, 0, v.maxHydration);
}

/** E — 침대에서 저장하고 끈 뒤 돌아왔을 때, 그사이 잔 것으로 칠까 */
export function offlineCountsAsSleep(offlineMs: number, gate: SleepGateInput): boolean {
  return offlineMs >= TUNING.sleep.offlineSleepHours * 3_600_000 && canSleep(gate).ok;
}

/** KST 시(0~23) → 하루 중 때 */
export function dayPartOf(hour: number): DayPart {
  if (hour < 4) return 'deep_night';
  if (hour < 7) return 'dawn';
  if (hour < 11) return 'morning';
  if (hour < 17) return 'midday';
  if (hour < 20) return 'evening';
  return 'night';
}
