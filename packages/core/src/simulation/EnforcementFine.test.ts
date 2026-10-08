import { describe, it, expect } from 'vitest';
import { enforcementFineWon, rollEnforcement } from './ForagingEngine.js';
import { TUNING } from '../config/tuning.js';

describe('단속 벌금 — min(한도, max(기본 금액, 가진 돈 × 비율))', () => {
  const ord = TUNING.law.fines.ordinance;

  it('가진 돈이 적으면 기본 금액을 문다(가진 돈보다 많을 수 있다 → 호출부가 파산으로 잇는다)', () => {
    expect(enforcementFineWon(0)).toBe(ord.baseWon);
    expect(enforcementFineWon(50_000)).toBe(ord.baseWon);
    expect(enforcementFineWon(ord.baseWon / ord.ratio)).toBe(ord.baseWon);
  });

  it('그 위로는 가진 돈의 비율만큼 문다', () => {
    expect(enforcementFineWon(5_000_000)).toBe(Math.round(5_000_000 * ord.ratio));
    expect(enforcementFineWon(20_000_000)).toBe(Math.round(20_000_000 * ord.ratio));
  });

  it('아무리 많이 가져도 한도를 넘지 않는다', () => {
    expect(enforcementFineWon(40_000_000)).toBe(ord.capWon);
    expect(enforcementFineWon(2_000_000_000)).toBe(ord.capWon);
  });

  it('가진 돈이 늘어도 벌금은 줄지 않는다(단조 증가)', () => {
    let prev = 0;
    for (let coins = 0; coins <= 60_000_000; coins += 250_000) {
      const fine = enforcementFineWon(coins);
      expect(fine).toBeGreaterThanOrEqual(prev);
      expect(fine).toBeGreaterThanOrEqual(ord.baseWon);
      expect(fine).toBeLessThanOrEqual(ord.capWon);
      prev = fine;
    }
  });

  it('금어기 · 금지체장은 정액, 무허가 조업은 더 무겁다', () => {
    const ss = TUNING.law.fines.sizeSeason;
    expect(enforcementFineWon(0, 'sizeSeason')).toBe(ss.capWon);
    expect(enforcementFineWon(900_000_000, 'sizeSeason')).toBe(ss.capWon);
    const un = TUNING.law.fines.unlicensed;
    expect(enforcementFineWon(0, 'unlicensed')).toBe(un.baseWon);
    expect(enforcementFineWon(900_000_000, 'unlicensed')).toBe(un.capWon);
    expect(un.capWon).toBeGreaterThan(ord.capWon);
  });

  it('깨진 값(NaN · 음수 · 무한대)에도 유한한 금액을 낸다', () => {
    for (const bad of [NaN, -5_000_000, Infinity, -Infinity]) {
      const fine = enforcementFineWon(bad);
      expect(Number.isFinite(fine)).toBe(true);
      expect(fine).toBe(ord.baseWon);
    }
  });

  it('적발 롤 — 안 걸리면 0원, 걸리면 종류별 금액', () => {
    expect(rollEnforcement(5_000_000, () => 0.999)).toEqual({ caught: false, fineWon: 0 });
    expect(rollEnforcement(5_000_000, () => 0)).toEqual({ caught: true, fineWon: enforcementFineWon(5_000_000) });
    expect(rollEnforcement(5_000_000, () => 0, 1, 'sizeSeason').fineWon).toBe(TUNING.law.fines.sizeSeason.capWon);
    // 배수 0이면 걸리지 않는다
    expect(rollEnforcement(5_000_000, () => 0, 0).caught).toBe(false);
  });
});
