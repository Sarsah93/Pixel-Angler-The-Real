/**
 * @file KmaVilageFcstApiClient.test.ts
 * @description 256차 — 기상청 Mock 날씨: 기온은 달별 평년값을 따르고, 강수 형태(비 · 진눈깨비 · 눈)는 그 기온에 맞는다 (vitest).
 * 예전 Mock은 강수 형태를 기온과 따로 골라 「진눈깨비 · 13.6℃」가 나왔다. 빌드에서는 제외(tsconfig.build exclude).
 */
import { describe, expect, it } from 'vitest';
import { KmaVilageFcstApiClient } from './KmaVilageFcstApiClient.js';

/** 속초 · 서울 · 부산 · 제주 근처 격자 */
const GRIDS = [{ nx: 87, ny: 141 }, { nx: 60, ny: 127 }, { nx: 98, ny: 76 }, { nx: 52, ny: 38 }];
/** 키 없음 = 결정적 Mock */
const client = new KmaVilageFcstApiClient();
const noon = (m: number, d: number) => new Date(2026, m, d, 12);

describe('기상청 Mock 날씨 (256차)', () => {
  it('강수 형태가 기온과 맞는다 — 눈 ≤ 3℃ · 진눈깨비 0~3℃ · 비 · 소나기 > 3℃', async () => {
    let wet = 0;
    const kinds = new Set<string>();
    for (let m = 0; m < 12; m++) for (let d = 1; d <= 28; d++) for (const g of GRIDS) {
      const w = await client.fetchCurrent(g, noon(m, d));
      expect(w.mock).toBe(true);
      const t = w.tempC ?? Number.NaN;
      kinds.add(w.kind);
      if (w.kind === 'snow') expect(t).toBeLessThanOrEqual(3);
      if (w.kind === 'sleet') { expect(t).toBeGreaterThan(0); expect(t).toBeLessThanOrEqual(3); }
      if (w.kind === 'rain' || w.kind === 'shower') expect(t).toBeGreaterThan(3);
      if (w.pty) wet++;
    }
    expect(wet).toBeGreaterThan(0);
    expect(kinds.has('snow')).toBe(true);   // 겨울에는 눈도 나온다
  });

  it('기온이 계절을 따른다 — 1월 평균 < 5℃ · 8월 평균 > 20℃', async () => {
    const avg = async (m: number) => {
      let sum = 0, n = 0;
      for (let d = 1; d <= 28; d++) for (const g of GRIDS) { sum += (await client.fetchCurrent(g, noon(m, d))).tempC ?? 0; n++; }
      return sum / n;
    };
    expect(await avg(0)).toBeLessThan(5);
    expect(await avg(7)).toBeGreaterThan(20);
  });

  it('오늘 본 「내일」과 내일 본 「오늘」의 날씨 종류가 같다(190차 성질 유지)', async () => {
    for (let d = 1; d <= 60; d++) for (const g of GRIDS) {
      const a = await client.fetchCurrent(g, noon(0, d));
      const b = await client.fetchCurrent(g, noon(0, d + 1));
      const t = a.tomorrow;
      expect(t?.kind).toBe(b.kind);
      expect(t?.tempMinC ?? 0).toBeLessThanOrEqual(t?.tempMaxC ?? 0);
    }
  });
});
