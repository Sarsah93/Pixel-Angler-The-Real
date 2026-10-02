import { describe, it, expect } from 'vitest';
import {
  saturationThreshold, saturationMult, decayedLoad, recordSale, SAT_HALF_LIFE_MS,
  branchPreference, marketTrend, demandLevel, priceLevel, pruneSaturation,
} from './MarketSaturation.js';

describe('MarketSaturation', () => {
  it('기준 마릿수째(10)부터 −3%씩 · 최대 −40%', () => {
    const sp = 'black_seabream';
    const th = saturationThreshold(sp);
    expect(saturationMult({ speciesId: sp, load: th - 2, live: false, big: false })).toBe(1);
    expect(saturationMult({ speciesId: sp, load: th - 1, live: false, big: false })).toBeCloseTo(0.97, 6);
    expect(saturationMult({ speciesId: sp, load: 200, live: false, big: false })).toBeCloseTo(0.6, 6);
  });
  it('활어·대물은 하락 폭이 반씩', () => {
    const sp = 'black_seabream';
    const load = saturationThreshold(sp) + 3;   // 5단계
    expect(saturationMult({ speciesId: sp, load, live: true, big: false })).toBeCloseTo(1 - 5 * 0.03 * 0.5, 6);
    expect(saturationMult({ speciesId: sp, load, live: true, big: true })).toBeCloseTo(1 - 5 * 0.03 * 0.25, 6);
  });
  it('흔한 어종은 기준이 높고 귀한 어종은 낮다', () => {
    expect(saturationThreshold('grass_puffer')).toBe(15);
    expect(saturationThreshold('yellowfin_puffer')).toBe(5);
  });
  it('반감기 6시간으로 서서히 회복 — 하루 뒤 1/16', () => {
    let book = recordSale({}, 'b1', 'x', 16, 0);
    expect(decayedLoad(book['b1|x'], SAT_HALF_LIFE_MS)).toBeCloseTo(8, 6);
    expect(decayedLoad(book['b1|x'], 4 * SAT_HALF_LIFE_MS)).toBeCloseTo(1, 6);
    book = recordSale(book, 'b1', 'x', 1, SAT_HALF_LIFE_MS);
    expect(book['b1|x'].load).toBeCloseTo(9, 6);
    // 판매처는 따로 센다
    expect(book['b2|x']).toBeUndefined();
    expect(Object.keys(pruneSaturation(book, 10 * 24 * 3600_000))).toHaveLength(0);
  });
  it('가게 수요는 결정적이고 지점마다 갈린다', () => {
    expect(branchPreference('a', 'x', '2026-10-02')).toBe(branchPreference('a', 'x', '2026-10-02'));
    const prefs = new Set(Array.from({ length: 40 }, (_, i) => branchPreference(`b${i}`, 'x', 'd')));
    expect(prefs.size).toBe(3);
  });
  it('화살표 = 수요 + 시세', () => {
    expect(marketTrend(1, 1)).toBe(2);
    expect(marketTrend(1, 0)).toBe(1);
    expect(marketTrend(1, -1)).toBe(0);
    expect(marketTrend(-1, -1)).toBe(-2);
    expect(priceLevel(1.2)).toBe(1);
    expect(priceLevel(0.8)).toBe(-1);
    expect(demandLevel(0, 100, 'black_seabream')).toBe(-1);
  });
});
