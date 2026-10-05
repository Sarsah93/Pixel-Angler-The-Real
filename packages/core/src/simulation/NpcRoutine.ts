/**
 * @file NpcRoutine.ts
 * @description 인물 일과 판정 (214차) — KST 시각 · 요일 → 일터/집.
 *
 * 순수 함수. 시각은 호출부가 넘긴다(`kstParts` 등) — 이 모듈은 시계를 읽지 않는다.
 */

import type { NpcHomeReason, NpcRoutineDef, NpcWhereabouts } from '../types/NpcRoutine.js';

/** 잘 시간 — 이 사이에 집이면 'sleep' */
const SLEEP_FROM = 22 * 60;
const SLEEP_TO = 5 * 60;

function inShift(m: number, from: number, to: number): boolean {
  if (from === to) return false;
  return from < to ? m >= from && m < to : m >= from || m < to;
}

/** from → to 까지 앞으로 남은 분(0~1440) */
function ahead(m: number, to: number): number {
  return ((to - m) % 1440 + 1440) % 1440;
}

/**
 * 지금 그 사람은 어디 있나.
 * @param minuteOfDay KST 0~1439
 * @param weekday KST 요일 0(일)~6(토)
 */
export function npcWhereabouts(routine: NpcRoutineDef, minuteOfDay: number, weekday: number): NpcWhereabouts {
  const m = ((Math.floor(minuteOfDay) % 1440) + 1440) % 1440;
  if (routine.kind === 'always') return { where: 'post', minutesLeft: Infinity };
  const off = routine.offDays?.includes(weekday) ?? false;
  if (!off) {
    for (const s of routine.shifts) {
      if (inShift(m, s.fromMin, s.toMin)) return { where: 'post', minutesLeft: ahead(m, s.toMin) };
    }
  }
  // 집 — 다음 출근까지(쉬는 날이면 내일 첫 토막)
  const next = off
    ? (1440 - m) + Math.min(...routine.shifts.map((s) => s.fromMin))
    : Math.min(...routine.shifts.map((s) => ahead(m, s.fromMin)));
  const reason: NpcHomeReason = inShift(m, SLEEP_FROM, SLEEP_TO) ? 'sleep' : off ? 'dayoff' : 'rest';
  return { where: 'home', reason, minutesLeft: next };
}

/** 하루 중 일터에 나와 있는 시간(분) — 검증 · 위키용 */
export function routinePostMinutes(routine: NpcRoutineDef): number {
  if (routine.kind === 'always') return 1440;
  return routine.shifts.reduce((s, x) => s + ahead(x.fromMin, x.toMin), 0);
}
