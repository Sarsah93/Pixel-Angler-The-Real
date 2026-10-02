import { describe, it, expect } from 'vitest';
import { landingDropOdds, rollLandingDrop, netUsable, LANDING_DROP_MAX } from './LandingDrop.js';

const small = (id = 'red_snapper_rockfish', len = 25, g = 250) => ({ speciesId: id, lengthCm: len, weightG: g });

describe('LandingDrop — 사용자 기준값(발판 2m 이하 · 40cm 미만 · 뜰채 없음)', () => {
  it('한 마리 0.5% · 두 마리 0.5% · 세 마리 1%', () => {
    const base = { footing: 'riprap' as const, netReachM: null };
    expect(landingDropOdds({ ...base, fish: [small()] }).chance).toBeCloseTo(0.005, 6);
    expect(landingDropOdds({ ...base, fish: [small(), small()] }).chance).toBeCloseTo(0.005, 6);
    expect(landingDropOdds({ ...base, fish: [small(), small(), small()] }).chance).toBeCloseTo(0.01, 6);
  });
  it('전갱이는 모든 경우 +1%p', () => {
    const hm = small('horse_mackerel', 22, 150);
    const base = { footing: 'rocks' as const, netReachM: null };
    expect(landingDropOdds({ ...base, fish: [hm] }).chance).toBeCloseTo(0.015, 6);
    expect(landingDropOdds({ ...base, fish: [hm, hm] }).chance).toBeCloseTo(0.015, 6);
    expect(landingDropOdds({ ...base, fish: [hm, hm, hm] }).chance).toBeCloseTo(0.02, 6);
  });
  it('최대 한 마리만 빠진다', () => {
    const r = rollLandingDrop({ footing: 'rocks', netReachM: null, fish: [small(), small(), small()] }, 0, 0.99);
    expect(r.droppedIndex).toBe(2);
    expect(rollLandingDrop({ footing: 'rocks', netReachM: null, fish: [small()] }, 0.5, 0).droppedIndex).toBeNull();
  });
});

describe('LandingDrop — 발판·크기·뜰채', () => {
  it('방파제 상판(4m)은 무게만큼 더 빠진다', () => {
    const light = landingDropOdds({ footing: 'breakwater_top', netReachM: null, fish: [small('x', 25, 0)] });
    const heavy = landingDropOdds({ footing: 'breakwater_top', netReachM: null, fish: [small('x', 35, 1000)] });
    expect(light.parts.lift).toBeCloseTo(0.01, 6);   // (4-2) × 0.5% × 1
    expect(heavy.parts.lift).toBeCloseTo(0.02, 6);   // × (1 + 1kg)
  });
  it('40cm 이상은 +1.5%p부터 · 최대 +4%p', () => {
    expect(landingDropOdds({ footing: 'rocks', netReachM: null, fish: [small('x', 40, 900)] }).parts.bigFish).toBeCloseTo(0.015, 6);
    expect(landingDropOdds({ footing: 'rocks', netReachM: null, fish: [small('x', 90, 9000)] }).parts.bigFish).toBeCloseTo(0.04, 6);
  });
  it('해변은 끌어 올려 절반', () => {
    expect(landingDropOdds({ footing: 'beach', netReachM: null, fish: [small()] }).chance).toBeCloseTo(0.0025, 6);
  });
  it('뜰채가 닿으면 0 · 짧거나 구멍이면 못 쓴다', () => {
    expect(landingDropOdds({ footing: 'breakwater_top', netReachM: 5, fish: [small('x', 60, 3000)] }).chance).toBe(0);
    const short = landingDropOdds({ footing: 'breakwater_top', netReachM: 3, fish: [small()] });
    expect(short.netUsed).toBe(false);
    expect(short.netBlocked).toBe(true);
    expect(netUsable('hole', 2.5, 7)).toBe(false);
  });
  it('상한 25%', () => {
    const r = landingDropOdds({ footing: 'breakwater_top', tideLiftM: 30, netReachM: null, fish: [small('horse_mackerel', 90, 9000)] });
    expect(r.chance).toBe(LANDING_DROP_MAX);
  });
});
