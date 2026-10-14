/**
 * @file Earthworm248.test.ts
 * @description 248차 — 텃밭 땅지렁이(나올 확률 · 마리 수) · 바다 미끼 땅지렁이(어종 선호 · 바닷물에서 늘어짐)
 */
import { describe, expect, it } from 'vitest';
import {
  EARTHWORM_TUNING, earthwormChance, rollEarthworms, earthwormSeaFade, earthwormSeaPref,
} from './EarthwormRules.js';
import { ORACLE_FISH_DB, baitPrefOf, getBaitAffinity, type SpawnContext } from './FishSpawningOracle.js';

const may = { month: 5, moisture: 0.5, site: 'plot' as const };
const seq = (...v: number[]): (() => number) => { let i = 0; return () => v[i++ % v.length]; };
const spec = (id: string) => {
  const s = ORACLE_FISH_DB.find((x) => x.speciesId === id);
  if (!s) throw new Error(id);
  return s;
};

describe('땅지렁이 — 텃밭에서 드러난다', () => {
  it('실내 선반에는 없다', () => {
    expect(earthwormChance('till', { ...may, site: 'indoor' })).toBe(0);
  });
  it('흙을 깊이 뒤집는 일일수록 · 퇴비 · 촉촉한 흙 · 비 · 봄가을에 잘 나온다', () => {
    const T = EARTHWORM_TUNING;
    expect(earthwormChance('dig', may)).toBeGreaterThan(earthwormChance('till', may));
    expect(earthwormChance('till', may)).toBeGreaterThan(earthwormChance('hill_up', may));
    expect(earthwormChance('hill_up', may)).toBeGreaterThan(earthwormChance('weed', may));
    expect(earthwormChance('till', may)).toBeCloseTo(T.chance.till * T.monthMult[4] * T.moistMult, 6);
    expect(earthwormChance('till', { ...may, compost: true })).toBeCloseTo(earthwormChance('till', may) * T.compostMult, 6);
    expect(earthwormChance('till', { ...may, moisture: 0.1 })).toBeLessThan(earthwormChance('till', { ...may, moisture: 0.3 }));
    expect(earthwormChance('till', { ...may, month: 1 })).toBeLessThan(earthwormChance('till', may) / 5);
    expect(earthwormChance('till', { ...may, month: 8 })).toBeLessThan(earthwormChance('till', { ...may, month: 10 }));
    expect(earthwormChance('till', { ...may, raining: true })).toBeGreaterThan(earthwormChance('till', may));
  });
  it('비 오는 날 — 일 없이도 일군 칸에서 조금씩 기어 나온다(맑은 날은 거의 없다)', () => {
    const wet = { ...may, moisture: 0.8, raining: true };
    expect(earthwormChance('rain', wet)).toBeGreaterThan(earthwormChance('rain', { ...wet, raining: false }) * 1.7);
    expect(earthwormChance('rain', wet)).toBeLessThan(earthwormChance('weed', may));
  });
  it('확률은 상한을 넘지 않는다', () => {
    expect(earthwormChance('dig', { ...may, compost: true, raining: true })).toBe(EARTHWORM_TUNING.maxChance);
  });
  it('마리 수 — 안 나오면 0, 나오면 1~3마리', () => {
    expect(rollEarthworms('till', may, seq(0.99))).toBe(0);
    expect(rollEarthworms('till', may, seq(0.01, 0))).toBe(1);
    expect(rollEarthworms('till', may, seq(0.01, 0.5))).toBe(2);
    expect(rollEarthworms('till', may, seq(0.01, 0.999))).toBe(3);
    expect(rollEarthworms('till', { ...may, site: 'indoor' }, seq(0))).toBe(0);
  });
});

describe('땅지렁이 — 바다 미끼', () => {
  it('표에 적은 어종(망둥어 · 가자미류 · 숭어 · 감성돔)은 그 값, 나머지는 청갯지렁이의 4할', () => {
    expect(baitPrefOf(spec('yellowfin_goby'), 'earthworm')).toBe(60);
    expect(baitPrefOf(spec('flounder'), 'earthworm')).toBe(40);
    expect(baitPrefOf(spec('black_seabream'), 'earthworm')).toBe(15);
    expect(baitPrefOf(spec('greenling'), 'earthworm')).toBe(earthwormSeaPref(60));
    expect(earthwormSeaPref(60)).toBe(24);
    // 청갯지렁이 값이 없는 어종은 기본 5의 4할
    expect(baitPrefOf(spec('amberjack'), 'earthworm')).toBe(2);
    // 다른 미끼는 예전 그대로(없으면 5)
    expect(baitPrefOf(spec('amberjack'), 'worm_blue')).toBe(5);
    expect(baitPrefOf(spec('greenling'), 'worm_blue')).toBe(60);
  });
  it('어느 어종도 땅지렁이를 청갯지렁이보다 좋아하지는 않는다(감성돔 기수역만 예외)', () => {
    for (const s of ORACLE_FISH_DB) {
      if (s.speciesId === 'black_seabream') continue;
      expect(baitPrefOf(s, 'earthworm')).toBeLessThanOrEqual(baitPrefOf(s, 'worm_blue'));
    }
  });
  it('모래 · 뻘 바닥 친화도 — 땅지렁이는 청갯지렁이보다 낮지만 0.25 바닥보다는 높다', () => {
    const ctx = { depthZ: 6, zMax: 7, inReef: false, baitKey: 'worm_blue', tidePhase: 7, isNight: false, month: 10 } as SpawnContext;
    const blue = getBaitAffinity(ctx);
    const earth = getBaitAffinity({ ...ctx, baitKey: 'earthworm' });
    expect(earth).toBeLessThan(blue);
    expect(earth).toBeGreaterThan(0.25);
  });
  it('바닷물에 담그면 1분 뒤부터 늘어져 4분이면 바닥', () => {
    expect(earthwormSeaFade(0)).toBe(1);
    expect(earthwormSeaFade(60)).toBe(1);
    expect(earthwormSeaFade(150)).toBeCloseTo(1 - (1 - EARTHWORM_TUNING.seaFadeFloor) * 0.5, 6);
    expect(earthwormSeaFade(240)).toBeCloseTo(EARTHWORM_TUNING.seaFadeFloor, 6);
    expect(earthwormSeaFade(9999)).toBe(EARTHWORM_TUNING.seaFadeFloor);
  });
});
