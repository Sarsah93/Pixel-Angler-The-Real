/**
 * @file RegionalPlots300.test.ts
 * @description 300차 — 지역 텃밭 1단계 표 · 계약 셈 검사.
 */
import { describe, it, expect } from 'vitest';
import {
  REGIONAL_PLOT_OFFERS, regionalPlotOffer, regionalPlotId, isRegionalPlotId, regionOfRegionalPlot, PLOT_RENT_PERIOD_MS,
  newPlotContract, plotRentDueWeeks, settlePlotRent, validateRegionalPlotOffers,
} from '../db-schema/RegionalPlots.js';
import { isRegionUnlocked } from '../types/WorldMap.js';
import { specialtiesOfRegion } from '../db-schema/RegionalSpecialty.js';

describe('300차 지역 텃밭 — 표', () => {
  it('표가 검사를 통과하고 고장마다 전국 지도 지역이 있다', () => {
    expect(validateRegionalPlotOffers()).toEqual([]);
    for (const o of REGIONAL_PLOT_OFFERS) expect(isRegionUnlocked(o.regionId), o.regionId).toBe(true);
  });
  it('빌릴 수 있는 고장마다 작물 특산이 하나는 있다(기를 까닭)', () => {
    for (const o of REGIONAL_PLOT_OFFERS) {
      expect(specialtiesOfRegion(o.regionId).some((s) => s.kind === 'crop'), o.regionId).toBe(true);
    }
  });
  it('구획 id는 접두로 알아보고 고장으로 되돌린다', () => {
    const id = regionalPlotId('gyeongbuk_pohang');
    expect(isRegionalPlotId(id)).toBe(true);
    expect(isRegionalPlotId('indoor')).toBe(false);
    expect(isRegionalPlotId('obj_12')).toBe(false);
    expect(regionOfRegionalPlot(id)).toBe('gyeongbuk_pohang');
    expect(regionOfRegionalPlot('indoor')).toBeNull();
    expect(regionalPlotOffer('gyeongbuk_pohang')?.nurseryKo).toBe('구룡포 종묘사');
    expect(regionalPlotOffer('gangwon_sokcho')).toBeUndefined();
  });
});

describe('300차 지역 텃밭 — 사용료', () => {
  const W = PLOT_RENT_PERIOD_MS;
  it('첫 주는 선납 — 일주일 안에는 밀리지 않는다', () => {
    const c = newPlotContract('busan', 1_000);
    expect(plotRentDueWeeks(c, 1_000 + W - 1)).toBe(0);
    expect(plotRentDueWeeks(c, 1_000 + W)).toBe(1);
    expect(plotRentDueWeeks(c, 1_000 + W * 3 + 5)).toBe(3);
  });
  it('밀린 주를 차례로 내고 선납 시각이 앞으로 간다', () => {
    const c = newPlotContract('busan', 0);
    let coins = 10_000;
    const r = settlePlotRent(c, W * 2 + 10, 3_000, (won) => { if (coins < won) return false; coins -= won; return true; });
    expect(r).toEqual({ paidWeeks: 2, paidWon: 6_000, overdue: false, dueWeeks: 0 });
    expect(c.paidUntilMs).toBe(W * 3);
    expect(coins).toBe(4_000);
  });
  it('돈이 모자라면 거기서 멈추고 밀린 채 남는다', () => {
    const c = newPlotContract('busan', 0);
    let coins = 4_000;
    const r = settlePlotRent(c, W * 3, 3_000, (won) => { if (coins < won) return false; coins -= won; return true; });
    expect(r.paidWeeks).toBe(1);
    expect(r.overdue).toBe(true);
    expect(r.dueWeeks).toBe(2);
    expect(coins).toBe(1_000);
  });
  it('밀리지 않았으면 아무것도 내지 않는다', () => {
    const c = newPlotContract('busan', 0);
    const r = settlePlotRent(c, W / 2, 3_000, () => { throw new Error('내면 안 된다'); });
    expect(r).toEqual({ paidWeeks: 0, paidWon: 0, overdue: false, dueWeeks: 0 });
  });
});
