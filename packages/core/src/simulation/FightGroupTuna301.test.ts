/**
 * @file FightGroupTuna301.test.ts
 * @description 301(2) — 참다랑어 어종군 「참치류」(하모니 F-0107 · P-0029 사용자 결정): 군 · 배수 · 요구 장력 · 희귀도 하한 · 스태미나
 */
import { describe, it, expect } from 'vitest';
import { fightGroupOf, fightBodyFormOf, fishRarity } from './FishRarity.js';
import { ORACLE_FISH_DB } from './FishSpawningOracle.js';
import { staminaMaxFor } from './FishFatigueModel.js';
import { TUNING } from '../config/tuning.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';

const meanWeightKg = (id: string): number => {
  const sp = ORACLE_FISH_DB.find((s) => s.speciesId === id)!;
  return sp.lwrA * Math.pow(sp.meanCm, sp.lwrB ?? 3) / 1000;
};
/** 최대 요구 장력(kg) — FightingPhase.maxDemandPct와 같은 식(정적 + 순간 가속 × 체형) */
const maxDemandKg = (id: string): number => {
  const P = TUNING.fightPhys;
  const form = P.form[fightBodyFormOf(id)];
  return meanWeightKg(id) * (P.staticFrac * form.staticMult + P.burst[fightGroupOf(id)] * form.burst);
};

describe('301(2) — 참다랑어 어종군 참치류', () => {
  it('군 · 배수 — 참다랑어는 tuna 5.0 · 방어류 5.5 · 잡어 2.2', () => {
    expect(fightGroupOf('bluefin_tuna')).toBe('tuna');
    expect(fightGroupOf('greater_amberjack')).toBe('amberjack');
    expect(TUNING.fightPhys.burst.tuna).toBe(5.0);
    expect(TUNING.fightPhys.burst.tuna).toBeLessThan(TUNING.fightPhys.burst.amberjack);
    expect(TUNING.fightPhys.burst.tuna).toBeGreaterThan(TUNING.fightPhys.burst.other * 2);
  });

  it('요구 장력 — 평균 참다랑어(약 25kg)는 약 134kg · 평균 잿방어(약 62kg)의 2배 넘게 · 합사 15호급', () => {
    const tuna = maxDemandKg('bluefin_tuna'), aj = maxDemandKg('greater_amberjack');
    expect(meanWeightKg('bluefin_tuna')).toBeGreaterThan(24); expect(meanWeightKg('bluefin_tuna')).toBeLessThan(27);
    expect(tuna).toBeGreaterThan(125); expect(tuna).toBeLessThan(145);
    expect(aj).toBeGreaterThan(55); expect(aj).toBeLessThan(70);
    expect(tuna / aj).toBeGreaterThan(2);
    expect(Math.ceil(tuna / 9)).toBe(15);   // PE 9kg/호
  });

  it('희귀도 하한 — 평균 참다랑어도 우량(노랑)부터 · 소형은 초록', () => {
    expect(fishRarity('bluefin_tuna', 110).tier).toBe('fine');
    expect(fishRarity('bluefin_tuna', 60).tier).toBe('small');
  });

  it('스태미나 — 같은 무게면 방어류보다 오래 달린다', () => {
    expect(staminaMaxFor('bluefin_tuna', 25)).toBeGreaterThan(staminaMaxFor('greater_amberjack', 25));
  });

  // 323 — 도감 크기 정보는 실제 국내 어획 크기다(옛 80~150cm · 10~80kg은 게임 스폰 분포를 옮겨 적은 것)
  it('323 — 도감 크기: 어린 고기(30kg 미만) · 큰 고기(100~150kg) 두 무리 · 최대 3m · 450kg · 체장-체중 식과 맞는다', () => {
    const f = FISH_DATABASE.find((x) => x.id === 'bluefin_tuna')!;
    const o = ORACLE_FISH_DB.find((x) => x.speciesId === 'bluefin_tuna')!;
    const kgAt = (cm: number): number => o.lwrA * Math.pow(cm, o.lwrB ?? 3) / 1000;
    expect(f.minLegalSizeCm).toBe(0);                       // 금지체장 없음
    expect(o.legalMinCm).toBeUndefined(); expect(o.closedMonths).toBeUndefined();   // 금어기 없음
    expect(f.avgWeightRangeG[1]).toBeGreaterThanOrEqual(100_000);   // 여름 동해의 100kg급이 평균 범위 안
    expect(f.maxRecordCm).toBe(300); expect(f.maxRecordKg).toBe(450);
    expect(f.sizeGroups?.length).toBe(2);
    const [small, large] = f.sizeGroups!;
    expect(small.weightKg[1]).toBe(30);                     // 국제 관리 기준 「소형어」 = 30kg 미만
    expect(large.weightKg).toEqual([100, 150]);
    // 평균 범위 양 끝의 체중이 식과 30% 안에서 맞는다(60cm ≈ 4kg · 200cm ≈ 152kg)
    expect(f.avgWeightRangeG[0] / 1000 / kgAt(f.avgSizeRangeCm[0])).toBeGreaterThan(0.7);
    expect(f.avgWeightRangeG[0] / 1000 / kgAt(f.avgSizeRangeCm[0])).toBeLessThan(1.3);
    expect(f.avgWeightRangeG[1] / 1000 / kgAt(f.avgSizeRangeCm[1])).toBeGreaterThan(0.7);
    expect(f.avgWeightRangeG[1] / 1000 / kgAt(f.avgSizeRangeCm[1])).toBeLessThan(1.3);
    // 어린 고기 무리의 위 끝(115cm)은 식으로도 30kg 안팎 · 큰 고기 무리의 위 끝(200cm)은 150kg 안팎
    expect(kgAt(small.lengthCm[1])).toBeGreaterThan(25); expect(kgAt(small.lengthCm[1])).toBeLessThan(33);
    expect(kgAt(large.lengthCm[1])).toBeGreaterThan(140); expect(kgAt(large.lengthCm[1])).toBeLessThan(165);
    // 게임 스폰 분포는 이번에 바꾸지 않았다(100kg급은 채비 · 싸움 물리가 먼저)
    expect(o.meanCm).toBe(110);
  });
});
