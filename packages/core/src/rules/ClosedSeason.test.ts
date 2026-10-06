/**
 * @file ClosedSeason.test.ts
 * @description 227차 — 날짜 단위 금어기 · 지역(제주) 규정 · 금지체중 (vitest).
 * 빌드에서는 제외(tsconfig.build exclude).
 */
import { describe, expect, it } from 'vitest';
import { closedFor, formatSeasons, inSeason, isClosedOn, legalRegionOf, resolveLegal } from './ClosedSeason.js';
import { SHORE_CREATURE_DATABASE } from '../db-schema/ShoreCreatureDatabase.js';
import { spawnFish } from '../simulation/FishSpawningOracle.js';
import type { SpawnContext } from '../simulation/FishSpawningOracle.js';

const creature = (id: string) => {
  const c = SHORE_CREATURE_DATABASE.find((x) => x.id === id);
  if (!c) throw new Error(`no creature ${id}`);
  return c;
};

describe('ClosedSeason 227차', () => {
  it('참문어 5.15는 열리고 5.16~6.30은 닫힌다', () => {
    const o = creature('octopus_vulgaris');
    expect(closedFor(o, 5, 15)).toBe(false);
    expect(closedFor(o, 5, 16)).toBe(true);
    expect(closedFor(o, 6, 30)).toBe(true);
    expect(closedFor(o, 7, 1)).toBe(false);
  });

  it('날짜를 모르면 달 단위(보수적) — 5월은 하루라도 걸리면 닫힘', () => {
    const o = creature('octopus_vulgaris');
    expect(closedFor(o, 5)).toBe(true);
    expect(closedFor(o, 4)).toBe(false);
  });

  it('꽃게 6.20 열림 · 6.21~8.20 닫힘 · 8.21 열림', () => {
    const c = creature('portunus_trituberculatus');
    expect(closedFor(c, 6, 20)).toBe(false);
    expect(closedFor(c, 6, 21)).toBe(true);
    expect(closedFor(c, 8, 20)).toBe(true);
    expect(closedFor(c, 8, 21)).toBe(false);
  });

  it('전복 — 국가 9.1~10.31 · 제주 10.1~12.31 + 10cm', () => {
    const a = creature('haliotis_discus');
    expect(formatSeasons(resolveLegal(a).closedSeasons)).toBe('9.1~10.31');
    const j = resolveLegal(a, 'jeju_seogwipo');
    expect(formatSeasons(j.closedSeasons)).toBe('10.1~12.31');
    expect(j.minLegalSizeCm).toBe(10);
    expect(closedFor(a, 9, 15, 'jeju_seogwipo')).toBe(false);
    expect(closedFor(a, 9, 15, 'gangwon_sokcho')).toBe(true);
  });

  it('소라 · 오분자기는 제주만 규정', () => {
    expect(resolveLegal(creature('turbo_cornutus'), 'jeju').minLegalSizeCm).toBe(7);
    expect(closedFor(creature('turbo_cornutus'), 7, 1, 'jeju')).toBe(true);
    expect(closedFor(creature('turbo_cornutus'), 7, 1, 'gangwon_sokcho')).toBe(false);
    expect(resolveLegal(creature('haliotis_diversicolor'), 'jeju').minLegalSizeCm).toBe(4);
    expect(closedFor(creature('haliotis_diversicolor'), 8, 1)).toBe(false);
  });

  it('해 넘김 구간 · 지역 키', () => {
    const winter = [{ from: [12, 1] as const, to: [2, 28] as const }];
    expect(inSeason(winter[0], 1, 10)).toBe(true);
    expect(isClosedOn(winter, 3, 1)).toBe(false);
    expect(legalRegionOf('jeju_x')).toBe('jeju');
    expect(legalRegionOf('gangwon_sokcho')).toBeNull();
  });

  it('대문어 600g 미만은 금지체중으로 방류 대상', () => {
    const ctx: SpawnContext = {
      depthZ: 20, zMax: 25, region: 'gangwon_sokcho', tidePhase: 7, month: 3, day: 10,
      baitKey: 'lure', inReef: true, isNight: true, speciesFilter: ['giant_octopus'],
    };
    let light = 0;
    for (let i = 0; i < 400; i++) {
      const f = spawnFish(ctx);
      if (f.speciesId !== 'giant_octopus') continue;
      expect(f.isUndersized).toBe(f.weightG < 600);
      if (f.weightG < 600) light++;
    }
    expect(light).toBeGreaterThan(0);
  });
});
