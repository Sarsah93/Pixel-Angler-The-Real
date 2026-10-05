/**
 * @file Sleep.ts
 * @description 잠 규칙 타입 (213차 — 잠 · 결산 · 저장 기준 A~F).
 *
 * 세계 시계(KST)는 잠으로 건너뛰지 않는다. 잠은 「몸의 하루」 — 피로 · 체력 · 허기 · 수분과 이야기 날짜만 움직인다.
 */

/** 잠들 수 있는가를 묻는 입력 */
export interface SleepGateInput {
  fatigue: number;
  maxFatigue: number;
  /** 지난 잠(다 잔 잠) 뒤 깨어 논 시간(ms) */
  awakeMs: number;
}

/** 잠 가부 — 막히면 이유 */
export interface SleepGate {
  ok: boolean;
  /** 'not_tired' = 피로도 낮고 깨어 있은 지도 얼마 안 됐다 */
  reason?: 'not_tired';
}

/** 하루 중 때 — 일어났을 때 혼잣말 · 결산 문구가 고른다 */
export type DayPart = 'deep_night' | 'dawn' | 'morning' | 'midday' | 'evening' | 'night';
