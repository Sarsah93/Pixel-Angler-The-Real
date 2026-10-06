/**
 * @file ClosedSeason.ts
 * @description 227차 — 금어기 날짜 판정 · 지역 규정 합치기 · 표기.
 *
 * 순수 함수. 날짜(일)를 모르는 옛 호출부는 「그 달에 금어기가 걸치면 닫힘」으로 본다(보수적).
 */

import type { ClosedSeason, LegalRegionKey, RegionalLegalRule, ResolvedLegalRule } from '../types/LegalSeason.js';

const key = (m: number, d: number): number => m * 100 + d;
const LAST_DAY = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** 그 날짜가 이 구간 안인가(해 넘김 포함) */
export function inSeason(s: ClosedSeason, month: number, day: number): boolean {
  const k = key(month, day), a = key(s.from[0], s.from[1]), b = key(s.to[0], s.to[1]);
  return a <= b ? (k >= a && k <= b) : (k >= a || k <= b);
}

/** 그 달에 이 구간이 하루라도 걸치는가 */
export function seasonTouchesMonth(s: ClosedSeason, month: number): boolean {
  return inSeason(s, month, 1) || inSeason(s, month, LAST_DAY[month] ?? 31)
    || (s.from[0] === month) || (s.to[0] === month);
}

/**
 * 금어기인가. `day`를 모르면 그 달에 걸치기만 해도 닫힘으로 본다.
 */
export function isClosedOn(seasons: readonly ClosedSeason[] | undefined, month: number, day?: number): boolean {
  if (!seasons || seasons.length === 0) return false;
  return seasons.some((s) => (day === undefined ? seasonTouchesMonth(s, month) : inSeason(s, month, day)));
}

/** 구간이 걸치는 달 목록(옛 `closedSeasonMonths` 호환 · 정렬) */
export function monthsOfSeasons(seasons: readonly ClosedSeason[]): number[] {
  const out: number[] = [];
  for (let m = 1; m <= 12; m++) if (seasons.some((s) => seasonTouchesMonth(s, m))) out.push(m);
  return out;
}

/** 표기 — 「5.16~6.30」 · 여러 구간은 「 · 」로 잇는다. 없으면 빈 문자열 */
export function formatSeasons(seasons: readonly ClosedSeason[] | undefined): string {
  if (!seasons || seasons.length === 0) return '';
  return seasons.map((s) => `${s.from[0]}.${s.from[1]}~${s.to[0]}.${s.to[1]}`).join(' · ');
}

/** 지역 id → 규정 묶음 키(없으면 국가 기본) */
export function legalRegionOf(regionId: string | undefined): LegalRegionKey | null {
  if (!regionId) return null;
  return /^jeju/i.test(regionId) || regionId.includes('제주') ? 'jeju' : null;
}

/** 국가 기본 + 지역 덮어쓰기를 합친다 */
export function resolveLegal(
  base: { closedSeasons?: readonly ClosedSeason[]; closedSeasonMonths?: readonly number[]; minLegalSizeCm?: number; minLegalWeightG?: number; regional?: Partial<Record<LegalRegionKey, RegionalLegalRule>> },
  regionId?: string,
): ResolvedLegalRule {
  const r = legalRegionOf(regionId);
  const over = r ? base.regional?.[r] : undefined;
  // 날짜 구간이 없는 옛 데이터는 달 단위 → 그 달 전체
  const fallback: ClosedSeason[] = (base.closedSeasonMonths ?? []).map((m) => ({ from: [m, 1] as const, to: [m, LAST_DAY[m] ?? 31] as const }));
  return {
    closedSeasons: [...(over?.closedSeasons ?? base.closedSeasons ?? fallback)],
    minLegalSizeCm: over?.minLegalSizeCm ?? base.minLegalSizeCm ?? 0,
    minLegalWeightG: over?.minLegalWeightG ?? base.minLegalWeightG ?? 0,
  };
}

/** 그 생물 · 어종이 그 날(지역 규정 포함) 금어기인가 — `day`를 모르면 달 단위(보수적) */
export function closedFor(
  base: Parameters<typeof resolveLegal>[0], month: number, day?: number, regionId?: string,
): boolean {
  return isClosedOn(resolveLegal(base, regionId).closedSeasons, month, day);
}
