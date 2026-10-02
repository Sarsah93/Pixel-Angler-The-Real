/**
 * @file SchoolHookup.test.ts
 * @description 무리 걸림 판정 — 조건 · 확률 구간 · 바늘 수 · 파이트 배율 (195차)
 */
import { describe, it, expect } from 'vitest';
import {
  rollSchoolHookup, schoolHookupEligible, isPeakSeason, SCHOOL_FIGHT_MULT,
} from './SchoolHookup.js';
import { speciesBiteShare, speciesBiteReadiness, type SpawnContext } from './FishSpawningOracle.js';

describe('무리 걸림', () => {
  it('제철 · 입질 몫 50% 이상 · 대상 어종 셋 다 맞아야 발동', () => {
    expect(isPeakSeason('red_snapper_rockfish', 1)).toBe(true);
    expect(isPeakSeason('red_snapper_rockfish', 7)).toBe(false);
    expect(isPeakSeason('horse_mackerel', 8)).toBe(true);
    expect(schoolHookupEligible('horse_mackerel', 8, 0.5)).toBe(true);
    expect(schoolHookupEligible('horse_mackerel', 8, 0.49)).toBe(false);   // 몫 미달
    expect(schoolHookupEligible('horse_mackerel', 2, 0.9)).toBe(false);    // 비시즌
    expect(schoolHookupEligible('black_rockfish', 1, 0.9)).toBe(false);    // 대상 아님
  });
  it('구간 — [0, 2.5%) 세 마리 · [2.5%, 12.5%) 두 마리 · 나머지 한 마리', () => {
    const r = (roll: number, hooks = 7) => rollSchoolHookup('red_snapper_rockfish', 1, 0.8, hooks, roll);
    expect(r(0.0)).toBe(3);
    expect(r(0.0249)).toBe(3);
    expect(r(0.025)).toBe(2);
    expect(r(0.1249)).toBe(2);
    expect(r(0.125)).toBe(1);
    // 바늘이 모자라면 그 마릿수는 없다(내려 주지 않는다)
    expect(r(0.01, 2)).toBe(1);
    expect(r(0.05, 2)).toBe(2);
    expect(r(0.05, 1)).toBe(1);
  });
  it('비발동이면 언제나 한 마리 · 파이트 배율 1 / 1.2 / 1.5', () => {
    expect(rollSchoolHookup('red_snapper_rockfish', 7, 0.9, 7, 0)).toBe(1);
    expect([SCHOOL_FIGHT_MULT[1], SCHOOL_FIGHT_MULT[2], SCHOOL_FIGHT_MULT[3]]).toEqual([1, 1.2, 1.5]);
  });
  it('입질 몫 — 필터로 한 어종만 남기면 1 · 후보에 없으면 0', () => {
    const ctx: SpawnContext = {
      depthZ: 10, zMax: 20, inReef: false, baitKey: 'krill', tidePhase: 7, isNight: true, month: 8,
      speciesFilter: ['horse_mackerel'],
    } as SpawnContext;
    expect(speciesBiteShare(ctx, 'horse_mackerel')).toBeCloseTo(1);
    expect(speciesBiteShare(ctx, 'red_snapper_rockfish')).toBe(0);
  });
  it('어종 활성도 — 맞는 층·지형·미끼·야간이면 높고, 층이 어긋나면 낮다(0~1)', () => {
    const base: SpawnContext = {
      depthZ: 38, zMax: 40, inReef: true, baitKey: 'krill', tidePhase: 7, isNight: true, month: 1,
    } as SpawnContext;
    const good = speciesBiteReadiness(base, 'red_snapper_rockfish');
    const surface = speciesBiteReadiness({ ...base, depthZ: 2 }, 'red_snapper_rockfish');
    expect(good).toBeGreaterThanOrEqual(0.5);
    expect(good).toBeLessThanOrEqual(1);
    expect(surface).toBeLessThan(0.5);   // 표층 = 인접층(0.15배)
    expect(speciesBiteReadiness(base, '__none__')).toBe(0);
  });
});

describe('SchoolHookup — 196차 채비 배율', () => {
  it('루어는 무리 걸림 없음 · 타이라바는 ¼', async () => {
    const { schoolKitMult, rollSchoolHookup } = await import('./SchoolHookup.js');
    expect(schoolKitMult('lure_hard')).toBe(0);
    expect(schoolKitMult('lure_soft')).toBe(0);
    expect(schoolKitMult('tairaba')).toBe(0.25);
    expect(schoolKitMult('card_rig')).toBe(1);
    // 열기 12월 · 활성도 0.9 · 바늘 2개 — 타이라바는 0.03에서 두 마리, 0.04에선 한 마리
    expect(rollSchoolHookup('red_snapper_rockfish', 12, 0.9, 2, 0.03, 0.25)).toBe(2);
    expect(rollSchoolHookup('red_snapper_rockfish', 12, 0.9, 2, 0.04, 0.25)).toBe(1);
    expect(rollSchoolHookup('red_snapper_rockfish', 12, 0.9, 7, 0.001, 0)).toBe(1);
  });
});
