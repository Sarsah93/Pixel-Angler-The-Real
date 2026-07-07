/**
 * @file TideCalculator.ts
 * @description 물때 계산 엔진 (음력 기반)
 *
 * 한국 낚시에서 사용하는 물때 시스템:
 * - 음력 1일/15일: 사리(대조기) — 조류 최강
 * - 음력 8일/23일: 조금(소조기) — 조류 최약
 * - 물때는 1물~15물로 순환
 *
 * ⚠️ 이 계산기는 근사값을 계산합니다.
 * 실제 서비스에서는 국립해양조사원 API 데이터를 우선 사용하세요.
 */

import type { TideInfo } from '../types/Environment.js';

// ─────────────────────────────────────────────
// 음력 변환 (근사 계산)
// ─────────────────────────────────────────────

/** 양력 날짜를 음력 날짜(일)로 근사 변환 */
function getLunarDay(date: Date): number {
  // 음력 기준일: 2000년 1월 6일 = 음력 2000년 1월 1일 (삭일)
  const LUNAR_EPOCH = new Date(2000, 0, 6).getTime();
  const LUNAR_MONTH_MS = 29.530588853 * 24 * 60 * 60 * 1000;

  const diff = date.getTime() - LUNAR_EPOCH;
  const lunarDays = Math.floor(diff / (LUNAR_MONTH_MS / 29.530588853));
  return ((lunarDays % 30) + 30) % 30; // 0~29 (0=삭일)
}

/**
 * 음력 날짜에서 물때(1~15) 계산
 * 음력 1일(삭일) ~ 15일(망일) 기준
 */
function getTidePhaseFromLunarDay(lunarDay: number): number {
  // 음력 1일 기준 1물, 15일 기준 15물(혹은 대조)
  // 한국 낚시 관행: 사리(최대 조차) = 음력 2~3일 & 17~18일 전후
  const dayFromNewMoon = lunarDay === 0 ? 30 : lunarDay;
  if (dayFromNewMoon <= 15) {
    return dayFromNewMoon;
  }
  return dayFromNewMoon - 15;
}

/** 물때로 조류 세기 계산 (0.0~1.0) */
function getCurrentStrengthByTidePhase(tidePhase: number): number {
  // 사리(7~9물)에서 최강, 조금(13~15물, 1물)에서 최약
  // 사인 커브로 근사
  const normalized = (tidePhase - 1) / 14; // 0.0~1.0
  // 8물 근처에서 최고조, 1물/15물에서 최저
  return Math.abs(Math.sin(normalized * Math.PI));
}

/** 물때 이름 반환 */
function getTidePhaseLabel(tidePhase: number): string {
  const labels: Record<number, string> = {
    1: '1물',
    2: '2물',
    3: '3물',
    4: '4물',
    5: '5물 (사리 진입)',
    6: '6물',
    7: '7물 (사리)',
    8: '8물 (사리 최강)',
    9: '9물 (사리)',
    10: '10물',
    11: '11물',
    12: '12물 (조금 진입)',
    13: '13물',
    14: '14물 (조금)',
    15: '15물 (무시)',
  };
  return labels[tidePhase] ?? `${tidePhase}물`;
}

// ─────────────────────────────────────────────
// 간단한 만조/간조 계산 (근사)
// 실제 서비스에서는 API 데이터 사용
// ─────────────────────────────────────────────
function estimateTideTimes(date: Date, tidePhase: number): { highTides: Date[]; lowTides: Date[] } {
  // 만조/간조 주기: 약 12시간 25분 (반일조 주기)
  const HALF_TIDAL_PERIOD_MS = (12 * 60 + 25) * 60 * 1000;

  // 사리일 때 첫 만조는 자정 직후, 조금일 때는 다름
  // 실제로는 지역마다 다르므로 API 우선
  const phaseOffset = ((tidePhase - 8) / 15) * 6 * 60 * 60 * 1000;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const firstHighTide = new Date(startOfDay.getTime() + phaseOffset + 3 * 60 * 60 * 1000);
  const secondHighTide = new Date(firstHighTide.getTime() + HALF_TIDAL_PERIOD_MS);

  const firstLowTide = new Date(firstHighTide.getTime() + HALF_TIDAL_PERIOD_MS / 2);
  const secondLowTide = new Date(firstLowTide.getTime() + HALF_TIDAL_PERIOD_MS);

  return {
    highTides: [firstHighTide, secondHighTide],
    lowTides: [firstLowTide, secondLowTide],
  };
}

// ─────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────

/**
 * 특정 날짜의 물때 정보를 계산합니다.
 * @param date 계산할 날짜 (기본값: 오늘)
 */
export function calculateTideInfo(date: Date = new Date()): TideInfo {
  const lunarDay = getLunarDay(date);
  const tidePhase = getTidePhaseFromLunarDay(lunarDay);
  const currentStrength = getCurrentStrengthByTidePhase(tidePhase);
  const { highTides, lowTides } = estimateTideTimes(date, tidePhase);

  const now = date.getTime();

  // 다음 만조/간조 계산
  const allTideTimes = [
    ...highTides.map((t) => ({ time: t, type: 'high' as const })),
    ...lowTides.map((t) => ({ time: t, type: 'low' as const })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  const nextTide = allTideTimes.find((t) => t.time.getTime() > now) ?? allTideTimes[0];
  const minutesToNext = Math.max(0, Math.round((nextTide.time.getTime() - now) / 60000));

  // 현재 조위 근사 (사인 커브)
  const nearestHighTide = highTides[0];
  const timeDiffFromHighMs = Math.abs(now - nearestHighTide.getTime());
  const HALF_PERIOD = (12 * 60 + 25) * 30 * 1000;
  const currentWaterLevelCm = Math.round(
    150 + 100 * currentStrength * Math.cos((Math.PI * timeDiffFromHighMs) / HALF_PERIOD),
  );

  return {
    tidePhase,
    tidePhaseLabel: getTidePhaseLabel(tidePhase),
    currentStrength,
    highTideTimes: highTides,
    lowTideTimes: lowTides,
    currentWaterLevelCm,
    minutesToNextTide: minutesToNext,
    nextTideType: nextTide.type,
  };
}

/**
 * 물때가 낚시에 적합한지 평가합니다.
 * @returns 적합도 점수 (0.0~1.0)
 */
export function evaluateFishingTide(tidePhase: number): number {
  // 5~10물이 낚시 최적 (조류 적당히 흐름)
  if (tidePhase >= 5 && tidePhase <= 10) return 0.8 + (1.0 - Math.abs(tidePhase - 7.5) / 3) * 0.2;
  if (tidePhase >= 3 && tidePhase <= 12) return 0.5;
  return 0.2; // 조금/무시 — 조류 거의 없음
}
