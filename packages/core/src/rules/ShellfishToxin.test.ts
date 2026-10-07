/**
 * @file ShellfishToxin.test.ts
 * @description 229차 — 패류독소 발령 창(결정적 · 바다별 빈도 · 3~6월 안)
 */
import { describe, expect, it } from 'vitest';
import { toxinBanWindows, toxinBanActive, seaZoneOf, isToxinShellfish } from './ShellfishToxin.js';

describe('ShellfishToxin 229차', () => {
  it('같은 해 같은 바다는 항상 같은 창(결정적)', () => {
    expect(toxinBanWindows('busan', 2026)).toEqual(toxinBanWindows('busan', 2026));
  });
  it('남해는 매해 2~3개 · 동해는 0~1개 · 전부 3~6월', () => {
    for (let y = 2024; y < 2040; y++) {
      const s = toxinBanWindows('busan', y), e = toxinBanWindows('gangwon_sokcho', y);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.length).toBeLessThanOrEqual(3);
      expect(e.length).toBeLessThanOrEqual(1);
      for (const w of [...s, ...e]) { expect(w.from[0]).toBeGreaterThanOrEqual(3); expect(w.to[0]).toBeLessThanOrEqual(6); }
    }
  });
  it('동해는 여러 해 중 일부만 발령된다', () => {
    const years = Array.from({ length: 30 }, (_, i) => 2020 + i);
    const n = years.filter((y) => toxinBanWindows('gangwon_sokcho', y).length > 0).length;
    expect(n).toBeGreaterThan(3);
    expect(n).toBeLessThan(20);
  });
  it('창 밖(12월)은 발령 없음 · 바다 분류 · 대상 생물', () => {
    expect(toxinBanActive('busan', new Date(2026, 11, 10))).toBe(false);
    expect(seaZoneOf('busan')).toBe('south');
    expect(seaZoneOf('gangwon_sokcho')).toBe('east');
    expect(isToxinShellfish('mytilus_coruscus')).toBe(true);
    expect(isToxinShellfish('haliotis_discus')).toBe(false);
  });
});
