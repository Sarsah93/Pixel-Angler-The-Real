/**
 * @file Festivals298.test.ts
 * @description 298차 — 축제 달력: 표 무결성 · 단계 · 값 배율 · 일손 · 일지 순서 · 기간 글
 */
import { describe, it, expect } from 'vitest';
import {
  FESTIVALS, validateFestivals, festivalPhase, festivalSellMult, specialtySellMultAt, daysUntilFestivalPeak, upcomingFestivals,
  festivalPeriodLabel, activeFestivalsOfRegion, FESTIVAL_PEAK_MULT, FESTIVAL_MONTH_MULT, inFestivalPeak,
} from '../db-schema/Festivals.js';
import { DAY_JOBS, dayJobsOfNpc, jobWageMultAt, FESTIVAL_JOB_PEAK_WAGE } from '../index.js';
import { specialtySellMult } from '../db-schema/RegionalSpecialty.js';

const kst = (y: number, m: number, d: number, hh = 12): Date => new Date(Date.UTC(y, m - 1, d, hh - 9));

describe('298 — 축제 달력', () => {
  it('표 무결성 — 9곳 · 지역 · 특산 · 달과 절정', () => {
    expect(FESTIVALS.length).toBe(9);
    expect(validateFestivals()).toEqual([]);
    expect(new Set(FESTIVALS.map((f) => f.regionId)).size).toBe(9);
  });

  it('단계 — 절정(끝 날 포함) · 축제 달 · 밖', () => {
    const f = FESTIVALS.find((x) => x.id === 'sokcho_sandfish_fest')!;
    expect(festivalPhase(f, kst(2026, 11, 7))).toBe('peak');
    expect(festivalPhase(f, kst(2026, 11, 16, 23))).toBe('peak');
    expect(festivalPhase(f, kst(2026, 11, 17, 0))).toBe('month');
    expect(festivalPhase(f, kst(2026, 11, 2))).toBe('month');
    expect(festivalPhase(f, kst(2026, 10, 31, 23))).toBe('none');   // KST 10/31 밤
    expect(inFestivalPeak(f, kst(2026, 11, 6, 23))).toBe(false);
  });

  it('값 배율 — 그 지역 가게에서만 · 절정 1.3 · 달 1.1 · 산지 밖 택배 차익과는 따로', () => {
    expect(festivalSellMult('sokcho_sandfish', 'gangwon_sokcho', kst(2026, 11, 10))).toBe(FESTIVAL_PEAK_MULT);
    expect(festivalSellMult('sokcho_sandfish', 'gangwon_sokcho', kst(2026, 11, 25))).toBe(FESTIVAL_MONTH_MULT);
    expect(festivalSellMult('sokcho_sandfish', 'busan', kst(2026, 11, 10))).toBe(1);
    expect(festivalSellMult('sokcho_sandfish', 'gangwon_sokcho', kst(2026, 5, 10))).toBe(1);
    // 도루묵(속초 특산 ×1.3 · 11월 제철) — 속초 가게 절정 = 1.3 × 1.3
    const base = specialtySellMult('sandfish', 'gangwon_sokcho', 11, 'gangwon_sokcho');
    expect(specialtySellMultAt('sandfish', 'gangwon_sokcho', 'gangwon_sokcho', kst(2026, 11, 10))).toBeCloseTo(base * FESTIVAL_PEAK_MULT);
    // 부산 가게에서 팔면 택배 차익만(축제 없음)
    expect(specialtySellMultAt('sandfish', 'gangwon_sokcho', 'busan', kst(2026, 11, 10))).toBeCloseTo(specialtySellMult('sandfish', 'gangwon_sokcho', 11, 'busan'));
    // 특산이 아니면 1
    expect(specialtySellMultAt('sandfish', 'busan', 'gangwon_sokcho', kst(2026, 11, 10))).toBe(1);
  });

  it('축제 일손 — 축제 달에만 뜨고 절정에 품삯 ×1.3', () => {
    const fest = DAY_JOBS.filter((j) => j.festivalId);
    expect(fest.length).toBe(9);
    for (const j of fest) expect(FESTIVALS.some((f) => f.id === j.festivalId && f.regionId === j.regionId), j.id).toBe(true);
    expect(dayJobsOfNpc('okseon', 'gangwon_sokcho', kst(2026, 11, 10)).some((j) => j.id === 'fest_sokcho_grill')).toBe(true);
    expect(dayJobsOfNpc('okseon', 'gangwon_sokcho', kst(2026, 5, 10)).some((j) => j.id === 'fest_sokcho_grill')).toBe(false);
    expect(dayJobsOfNpc('okseon', 'gangwon_sokcho', kst(2026, 5, 10)).some((j) => j.id === 'ice_haul')).toBe(true);
    const job = DAY_JOBS.find((j) => j.id === 'fest_sokcho_grill')!;
    expect(jobWageMultAt(job, kst(2026, 11, 10))).toBe(FESTIVAL_JOB_PEAK_WAGE);
    expect(jobWageMultAt(job, kst(2026, 11, 25))).toBe(1);
  });

  it('일지 「나날」 — 진행 중이 먼저 · 가까운 순 · 열린 지역만 · 지난 축제는 내년', () => {
    const now = kst(2026, 11, 10);
    const open = (r: string): boolean => r === 'gangwon_sokcho' || r === 'busan' || r === 'ulleungdo';
    const list = upcomingFestivals(now, open);
    expect(list.map((e) => e.def.id)).toEqual(['sokcho_sandfish_fest', 'ulleung_squid_fest', 'busan_jagalchi_fest']);
    expect(list[0]!.phase).toBe('peak'); expect(list[0]!.days).toBe(0);
    expect(daysUntilFestivalPeak(FESTIVALS.find((f) => f.id === 'busan_jagalchi_fest')!, now)).toBe(341);   // 2027-10-17
    expect(activeFestivalsOfRegion('gangwon_sokcho', now)[0]?.phase).toBe('peak');
    expect(activeFestivalsOfRegion('busan', now)).toEqual([]);
  });

  it('기간 글', () => {
    const f = FESTIVALS.find((x) => x.id === 'sokcho_sandfish_fest')!;
    expect(festivalPeriodLabel(f)).toBe('11월 7일 ~ 16일');
    expect(festivalPeriodLabel(f, 'en')).toBe('Nov 7–16');
  });
});
