/**
 * @file FightGroupTuna301.test.ts
 * @description 301(2) — 참다랑어 어종군 「참치류」(하모니 F-0107 · P-0029 사용자 결정): 군 · 배수 · 요구 장력 · 희귀도 하한 · 스태미나
 */
import { describe, it, expect } from 'vitest';
import { fightGroupOf, fightBodyFormOf, fishRarity } from './FishRarity.js';
import { ORACLE_FISH_DB } from './FishSpawningOracle.js';
import { staminaMaxFor } from './FishFatigueModel.js';
import { TUNING } from '../config/tuning.js';

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
});
