/**
 * @file FishPrice301.test.ts
 * @description 301차 — 생선 값: 한 마리 바닥(1,000원) · 꽁치 · 학꽁치 마리 값 · kg 환산 불변 · 침강 물리 실세계 밴드 · 스윕 = 떠오르지 않음 · 히스테리시스
 */
import { describe, it, expect } from 'vitest';
import { evaluateFishSellPrice } from './MarketPriceEvaluator.js';
import { FISH_PIECE_FLOOR_KRW, fishPieceFloorKrw, SEAFOOD_AUCTION_MAPPING } from '../types/Economy.js';
import { computeSinkRate, stepUnderwater, computeSinkSpeed, createUnderwaterRig, type RigPhysicsParams } from './UnderwaterSinkPhysics.js';
import { ORACLE_FISH_DB } from './FishSpawningOracle.js';
import { TUNING } from '../config/tuning.js';

const weightOf = (speciesId: string, cm: number): number => {
  const sp = ORACLE_FISH_DB.find((s) => s.speciesId === speciesId)!;
  return sp.lwrA * Math.pow(cm, sp.lwrB ?? 3);
};

describe('301 — 생선 값', () => {
  it('한 마리 바닥 — 꽁치 25cm(49g) · 학꽁치 28cm(38g)도 1,000원', () => {
    expect(fishPieceFloorKrw('pacific_saury')).toBe(FISH_PIECE_FLOOR_KRW);
    const saury = weightOf('pacific_saury', 25);
    expect(saury).toBeGreaterThan(40); expect(saury).toBeLessThan(60);
    expect(evaluateFishSellPrice('pacific_saury', 25, saury).finalPrice).toBe(1000);
    const hb = weightOf('halfbeak', 28);
    expect(hb).toBeGreaterThan(30); expect(hb).toBeLessThan(50);
    expect(evaluateFishSellPrice('halfbeak', 28, hb).finalPrice).toBe(1000);
    // 모르는 어종도 바닥은 같다
    expect(evaluateFishSellPrice('unknown_fish', 10, 20).finalPrice).toBe(1000);
  });

  it('큰 개체는 바닥을 넘는다 — 꽁치 45cm · 학꽁치 40cm는 2,000원 안팎', () => {
    const big = evaluateFishSellPrice('pacific_saury', 45, weightOf('pacific_saury', 45)).finalPrice;
    expect(big).toBeGreaterThan(2500); expect(big).toBeLessThan(4500);
    const hb = evaluateFishSellPrice('halfbeak', 40, weightOf('halfbeak', 40)).finalPrice;
    expect(hb).toBeGreaterThan(1800); expect(hb).toBeLessThan(3500);
  });

  it('kg 환산(1,000g)은 바닥의 영향이 없다 — 어느 종도 kg 값 > 1,000', () => {
    for (const id of Object.keys(SEAFOOD_AUCTION_MAPPING)) {
      const r = evaluateFishSellPrice(id, 30, 1000);
      expect(r.finalPrice).toBeGreaterThan(FISH_PIECE_FLOOR_KRW);
    }
    expect(SEAFOOD_AUCTION_MAPPING.pacific_saury.defaultPricePerKg).toBe(8000);
  });
});

describe('301 — 침강 물리 실세계 대조', () => {
  it('종단속도 — 3g 봉돌 0.5~0.8 · 3호(11g) 1.0~1.3 · 20호(75g) 2.0~2.6 m/s · 무게에 단조', () => {
    const v3 = computeSinkRate(0, 3, 'sinker').sinkRateMps;
    const v11 = computeSinkRate(0, 11, 'sinker').sinkRateMps;
    const v75 = computeSinkRate(0, 75, 'sinker').sinkRateMps;
    expect(v3).toBeGreaterThan(0.5); expect(v3).toBeLessThan(0.8);
    expect(v11).toBeGreaterThan(1.0); expect(v11).toBeLessThan(1.3);
    expect(v75).toBeGreaterThan(2.0); expect(v75).toBeLessThanOrEqual(TUNING.sink.vTermMax);
    expect(v3).toBeLessThan(v11); expect(v11).toBeLessThan(v75);
  });

  it('조류가 아무리 세도 침강 속도는 0 이상 — 떠오르는 가지가 없다', () => {
    for (const cur of [0, 0.1, 0.2, 0.5, 1, 2, 4]) {
      for (const g of [1, 3, 11, 30, 75]) {
        const r = computeSinkRate(cur, g, 'sinker');
        expect(r.sinkRateMps).toBeGreaterThanOrEqual(TUNING.sink.residualSweptMps);
        expect(r.sinkRateMps).toBeGreaterThan(0);
      }
    }
    // 3g 봉돌은 0.4노트(0.2m/s)에서 쓸리고(줄 저항 ≫ 수중 무게), 11g은 아직 가라앉는다
    expect(computeSinkRate(0.25, 3, 'sinker').swept).toBe(true);
    expect(computeSinkRate(0.25, 11, 'sinker').swept).toBe(false);
  });

  it('히스테리시스 — 쓸리던 채비는 스윕각 − 6° 아래로 내려와야 풀린다', () => {
    const S = TUNING.sink;
    // 3g 봉돌: θ = 스윕각 − 3° 인 조류 — 처음이면 안 쓸리고, 쓸리던 중이면 그대로 쓸린다
    const weff = 3 / S.dragC.sinker;
    const curAt = (deg: number): number => Math.tan((deg * Math.PI) / 180) * Math.pow(weff, S.weightExp) / S.angleK;
    const cur = curAt(S.sweptAngleDeg - 3);
    expect(computeSinkRate(cur, 3, 'sinker', 1, false).swept).toBe(false);
    expect(computeSinkRate(cur, 3, 'sinker', 1, true).swept).toBe(true);
    expect(computeSinkRate(curAt(S.sweptAngleDeg - S.sweptHysteresisDeg - 1), 3, 'sinker', 1, true).swept).toBe(false);
  });

  it('찌 채비 stepUnderwater — 봉돌이 가벼워도 수직으로 떠오르지 않는다(상승은 뒷줄견제 lift만)', () => {
    const rig = createUnderwaterRig(0);
    rig.baitZ = 2;
    // 3g 봉돌 + 바늘 · 미끼 8g 상당 = 11g, 찌 잔존 부력 20g(가벼운 봉돌 — 찌가 이긴다)
    const params: RigPhysicsParams = { tackleWeightG: 3 + 8, floatBuoyancyG: 20 };
    const z0 = rig.baitZ;
    for (let i = 0; i < 60; i++) {
      stepUnderwater(rig, { dtSec: 1 / 30, tide: { x: 0.6, y: 0.2 }, params, zLimitM: 10, zMaxM: 12, driftBrake: 0, baitLiftMps: 0 });
    }
    expect(rig.baitZ).toBeGreaterThanOrEqual(z0 - 1e-9);
    expect(computeSinkSpeed(params, 0.6)).toBeGreaterThanOrEqual(0);
    // 무게가 부력을 넘으면 가라앉고, 넘지 않으면 제자리(0) — 음수(상승)는 없다
    expect(computeSinkSpeed({ tackleWeightG: 30, floatBuoyancyG: 10 }, 0)).toBeGreaterThan(0);
  });
});
