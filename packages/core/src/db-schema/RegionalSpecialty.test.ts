/**
 * @file RegionalSpecialty.test.ts
 * @description 294차 — 지역 특산 표 정합(열쇠 · 지역 id 실재) + 가격 배율 규칙(제철 전부 · 비제철 절반 · 비특산 1).
 */
import { describe, it, expect } from 'vitest';
import { REGIONAL_SPECIALTIES, specialtyOf, specialtyPriceMult, specialtiesOfRegion, specialtyRegionsOf } from './RegionalSpecialty.js';
import { FISH_DATABASE } from './FishDatabase.js';
import { SHORE_CREATURE_DATABASE } from './ShoreCreatureDatabase.js';
import { CROP_DATABASE } from './CropDatabase.js';
import { REGION_DATABASE } from './RegionDatabase.js';

describe('RegionalSpecialty (294)', () => {
  const fishIds = new Set(FISH_DATABASE.map((f) => f.id));
  const creatureIds = new Set(SHORE_CREATURE_DATABASE.map((c) => c.id));
  const cropJson = JSON.stringify(CROP_DATABASE);
  const regionIds = new Set(REGION_DATABASE.map((r) => r.id));

  it('id가 겹치지 않는다', () => {
    const ids = REGIONAL_SPECIALTIES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('지역 id가 전부 REGION_DATABASE에 있다', () => {
    for (const d of REGIONAL_SPECIALTIES) for (const r of d.regionIds) expect(regionIds.has(r), `${d.id}: ${r}`).toBe(true);
  });

  it('열쇠가 전부 실재한다(어종 · 갯것 · 수확물)', () => {
    for (const d of REGIONAL_SPECIALTIES) {
      for (const k of d.keys) {
        if (d.kind === 'fish') expect(fishIds.has(k), `${d.id}: ${k}`).toBe(true);
        else if (d.kind === 'forage') expect(creatureIds.has(k), `${d.id}: ${k}`).toBe(true);
        else if (d.kind === 'crop') expect(cropJson.includes(`"${k}"`), `${d.id}: ${k}`).toBe(true);
      }
    }
  });

  it('달은 1~12 · 배율은 1보다 크다', () => {
    for (const d of REGIONAL_SPECIALTIES) {
      expect(d.priceMult).toBeGreaterThan(1);
      for (const m of d.months ?? []) { expect(m).toBeGreaterThanOrEqual(1); expect(m).toBeLessThanOrEqual(12); }
    }
  });

  it('제철 전부 · 비제철 절반 · 비특산 1 · 꼬리표 없음 1', () => {
    const d = specialtyOf('chub_mackerel', 'busan');
    expect(d?.id).toBe('busan_mackerel');
    expect(specialtyPriceMult('chub_mackerel', 'busan', 10)).toBeCloseTo(1.3);
    expect(specialtyPriceMult('chub_mackerel', 'busan', 6)).toBeCloseTo(1.15);
    expect(specialtyPriceMult('chub_mackerel', 'gangwon_sokcho', 10)).toBe(1);
    expect(specialtyPriceMult('chub_mackerel', undefined, 10)).toBe(1);
    expect(specialtyPriceMult(undefined, 'busan', 10)).toBe(1);
  });

  it('같은 종이 여러 지역 특산일 수 있다(고등어 = 부산 · 제주)', () => {
    const regions = specialtyRegionsOf('chub_mackerel');
    expect(regions).toContain('busan');
    expect(regions).toContain('jeju');
  });

  it('울릉 · 독도 특산이 있다(지역 개방 294)', () => {
    expect(specialtiesOfRegion('ulleungdo').length).toBeGreaterThanOrEqual(4);
    expect(specialtiesOfRegion('dokdo').length).toBeGreaterThanOrEqual(3);
  });
});
