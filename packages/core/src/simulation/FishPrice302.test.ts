/**
 * @file FishPrice302.test.ts
 * @description 302차 — 생선 값 다시 보기: 모든 어종이 경락 표에 있다(폴백 없음) · 근거 있는 kg 단가 · 시장 품목명 매칭(긴 이름 먼저)
 */
import { describe, it, expect } from 'vitest';
import { evaluateFishSellPrice } from './MarketPriceEvaluator.js';
import { ORACLE_FISH_DB } from './FishSpawningOracle.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import { SEAFOOD_AUCTION_MAPPING, auctionMappingOf } from '../types/Economy.js';
import { matchMafraSpecies } from '../api-client/MafraAuctionApiClient.js';

const kg = (id: string): number => SEAFOOD_AUCTION_MAPPING[id].defaultPricePerKg;

describe('302 — 생선 값 다시 보기', () => {
  it('오라클 · 도감 어종 전부 경락 행이 있다(「g당 10원」 폴백을 타는 종이 없다 · 참돔(야간)은 참돔 행)', () => {
    const missing = [...ORACLE_FISH_DB.map((s) => s.speciesId), ...FISH_DATABASE.map((f) => f.id)]
      .filter((id) => !auctionMappingOf(id));
    expect(missing).toEqual([]);
    expect(SEAFOOD_AUCTION_MAPPING.night_seabream).toBeUndefined();   // 시세 띠에 따로 뜨지 않게 표에는 없다
    expect(evaluateFishSellPrice('night_seabream', 50, 2000).finalPrice).toBe(evaluateFishSellPrice('red_seabream', 50, 2000).finalPrice);
  });

  it('근거 있는 kg 단가 — 용치놀래기 · 열기 · 망상어 · 쥐치 · 도루묵', () => {
    expect(kg('rainbow_wrasse')).toBeGreaterThanOrEqual(10526);
    expect(kg('rainbow_wrasse')).toBeLessThanOrEqual(15760);
    expect(kg('red_snapper_rockfish')).toBeGreaterThan(kg('blue_rockfish'));
    expect(kg('red_snapper_rockfish')).toBeLessThan(31900);
    expect(kg('surfperch')).toBeGreaterThanOrEqual(6000); expect(kg('surfperch')).toBeLessThanOrEqual(12000);
    expect(kg('filefish')).toBeGreaterThanOrEqual(25000);
    expect(kg('filefish')).toBeGreaterThan(kg('black_scraper') * 2);
    expect(kg('sandfish')).toBeGreaterThanOrEqual(9000);
  });

  it('마리 값 — 용치놀래기 25cm(약 190g)는 2,000원 넘게 · 쥐치 평균은 3,000원 넘게', () => {
    const sp = ORACLE_FISH_DB.find((s) => s.speciesId === 'rainbow_wrasse')!;
    const w = sp.lwrA * Math.pow(25, sp.lwrB ?? 3);
    expect(evaluateFishSellPrice('rainbow_wrasse', 25, w).finalPrice).toBeGreaterThan(2000);
    const ff = ORACLE_FISH_DB.find((s) => s.speciesId === 'filefish')!;
    const wf = ff.lwrA * Math.pow(ff.meanCm, ff.lwrB ?? 3);
    expect(evaluateFishSellPrice('filefish', ff.meanCm, wf).finalPrice).toBeGreaterThan(3000);
  });

  it('시장 품목명 매칭 — 품종 우선 · 긴 이름 먼저(불볼락 · 황볼락 ⊃ 볼락)', () => {
    expect(matchMafraSpecies({ MCLASSNAME: '놀래기', SCLASSNAME: '용치놀래기' })).toBe('rainbow_wrasse');
    expect(matchMafraSpecies({ MCLASSNAME: '볼락', SCLASSNAME: '불볼락' })).toBe('red_snapper_rockfish');
    expect(matchMafraSpecies({ MCLASSNAME: '볼락', SCLASSNAME: '황볼락' })).toBe('golden_rockfish');
    expect(matchMafraSpecies({ MCLASSNAME: '볼락', SCLASSNAME: '기타' })).toBe('blue_rockfish');
    expect(matchMafraSpecies({ MCLASSNAME: '불볼락', SCLASSNAME: '' })).toBe('red_snapper_rockfish');
    expect(matchMafraSpecies({ MCLASSNAME: '볼락', SCLASSNAME: '조피볼락' })).toBe('black_rockfish');
    expect(matchMafraSpecies({ MCLASSNAME: '볼락', SCLASSNAME: '우럭볼락' })).toBe('black_rockfish');
    expect(matchMafraSpecies({ MCLASSNAME: '볼락', SCLASSNAME: '쏨뱅이' })).toBe('scorpionfish');
    expect(matchMafraSpecies({ MCLASSNAME: '망상어', SCLASSNAME: '' })).toBe('surfperch');
  });
});
