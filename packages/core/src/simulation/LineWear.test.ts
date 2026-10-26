/**
 * @file LineWear.test.ts
 * @description 원줄 · 목줄 내구도 모델 — 단계 · 세기 · 쌓이는 길 · 재질 차이 (273차)
 */
import { describe, it, expect } from 'vitest';
import {
  LINE_MATERIAL_TRAITS, lineMaterialOf, lineWearStage, effectiveLineStrengthKg, fightFatigueWear, lineTensionRatioOf,
  landingShockWear, snagPullWear, castWear, bottomDragWear, retieCutM, addLineWear, clampLineWear,
} from './LineWear.js';
import { TUNING } from '../config/tuning.js';

describe('LineWear — 재질 · 단계', () => {
  it('재질은 lineMaterial 우선 · 없으면 이름으로(합사 → PE · 카본 → 플로로 · 그 밖 → 나일론)', () => {
    expect(lineMaterialOf({ name: '합사 원줄 1호', lineMaterial: 'pe_braid' })).toBe('pe_braid');
    expect(lineMaterialOf({ name: 'AMSTRONG 합사 원줄 1호 · 150m' })).toBe('pe_braid');
    expect(lineMaterialOf({ name: '카본 목줄 3호' })).toBe('fluorocarbon');
    expect(lineMaterialOf({ name: '나일론 목줄 2호' })).toBe('nylon');
    expect(lineMaterialOf(null)).toBe('nylon');
  });
  it('단계 문턱 0.2 · 0.5 · 0.8', () => {
    expect(lineWearStage(0)).toBe('fresh');
    expect(lineWearStage(0.19)).toBe('fresh');
    expect(lineWearStage(0.2)).toBe('light');
    expect(lineWearStage(0.5)).toBe('heavy');
    expect(lineWearStage(0.8)).toBe('critical');
    expect(lineWearStage(5)).toBe('critical');
  });
  it('마모는 0~1로 잘린다 · 더하기는 늘기만', () => {
    expect(clampLineWear(-1)).toBe(0);
    expect(clampLineWear(NaN)).toBe(0);
    expect(addLineWear(0.9, 0.5)).toBe(1);
    expect(addLineWear(0.3, -0.5)).toBe(0.3);
  });
});

describe('LineWear — 세기', () => {
  it('새 카본 줄은 공칭 그대로 · 마모 1이면 절반', () => {
    expect(effectiveLineStrengthKg(5.4, 0, 'fluorocarbon')).toBeCloseTo(5.4, 6);
    expect(effectiveLineStrengthKg(5.4, 1, 'fluorocarbon')).toBeCloseTo(5.4 * (1 - TUNING.lineWear.strengthLossAtWorn), 6);
  });
  it('나일론은 젖어서 조금 약하다 · 합사 · 카본은 아니다', () => {
    const wet = 1 - TUNING.lineWear.nylonWetLoss;
    expect(effectiveLineStrengthKg(3.6, 0, 'nylon')).toBeCloseTo(3.6 * wet, 6);
    expect(effectiveLineStrengthKg(9, 0, 'pe_braid')).toBeCloseTo(9, 6);
  });
  it('게이지 장력비 → 그 줄의 장력비(센 원줄은 덜 받는다)', () => {
    expect(lineTensionRatioOf(0.9, 5.4, 9)).toBeCloseTo(0.54, 6);
    expect(lineTensionRatioOf(0.9, 5.4, 5.4)).toBeCloseTo(0.9, 6);
    expect(lineTensionRatioOf(0.9, 0, 5.4)).toBe(0);
  });
});

describe('LineWear — 쌓이는 길', () => {
  it('파이팅 피로는 문턱 아래 0 · 한계 근처에서 제곱으로 · 나일론 > 카본 > 합사', () => {
    expect(fightFatigueWear(0.4, 1, 'nylon')).toBe(0);
    const n = fightFatigueWear(0.9, 60, 'nylon');
    const c = fightFatigueWear(0.9, 60, 'fluorocarbon');
    const p = fightFatigueWear(0.9, 60, 'pe_braid');
    expect(n).toBeGreaterThan(c);
    expect(c).toBeGreaterThan(p);
    // 0.9에서 60초 = 0.16 × 0.01 × 1.1 × 60 ≈ 0.106 — 한 번의 긴 파이팅이 「쓸림 조금」 문턱 근처
    expect(n).toBeCloseTo(0.4 * 0.4 * TUNING.lineWear.fatigueK * 1.1 * 60, 6);
    expect(fightFatigueWear(0.7, 60, 'nylon')).toBeLessThan(n / 3);
  });
  it('랜딩 충격은 무게 ÷ 세기 · 합사가 가장 크고 목줄이 1.5배', () => {
    const leaderC = landingShockWear(2, 5.4, 'fluorocarbon', 'leader');
    const mainC = landingShockWear(2, 9, 'fluorocarbon', 'main');
    expect(leaderC).toBeCloseTo(TUNING.lineWear.shockK * (2 / 5.4) * 1.0 * TUNING.lineWear.landingLeaderMult, 6);
    expect(mainC).toBeCloseTo(TUNING.lineWear.shockK * (2 / 9) * 1.0 * TUNING.lineWear.landingMainMult, 6);
    expect(landingShockWear(2, 9, 'pe_braid', 'main')).toBeGreaterThan(mainC);
    expect(landingShockWear(0, 9, 'pe_braid', 'main')).toBe(0);
  });
  it('밑걸림 당김은 목줄 > 원줄 · 합사가 카본의 세 배 넘게 긁힌다', () => {
    expect(snagPullWear('fluorocarbon', 'leader')).toBeGreaterThan(snagPullWear('fluorocarbon', 'main'));
    expect(snagPullWear('pe_braid', 'leader') / snagPullWear('fluorocarbon', 'leader')).toBeCloseTo(1.8 / 0.55, 6);
  });
  it('캐스팅 한 번 — 합사 원줄이 나일론의 두 배 넘게 · 목줄은 1/3', () => {
    expect(castWear('pe_braid', 'main') / castWear('nylon', 'main')).toBeCloseTo(1.4 / 0.6, 6);
    expect(castWear('nylon', 'leader')).toBeCloseTo(castWear('nylon', 'main') * TUNING.lineWear.castLeaderFrac, 6);
    // 100번 던진 합사 원줄 = 0.28 — 「쓸림 조금」(아직 「심함」은 아니다)
    expect(castWear('pe_braid', 'main') * 100).toBeCloseTo(0.28, 6);
  });
  it('바닥 끌림은 거리 × 근접도 · 떠 있으면 0 · 원줄은 1/5', () => {
    expect(bottomDragWear(10, 0, 'nylon', 'leader')).toBe(0);
    expect(bottomDragWear(0, 1, 'nylon', 'leader')).toBe(0);
    const l = bottomDragWear(10, 1, 'nylon', 'leader');
    expect(l).toBeCloseTo(TUNING.lineWear.dragPerM * 10, 6);
    expect(bottomDragWear(10, 1, 'nylon', 'main')).toBeCloseTo(l * TUNING.lineWear.dragMainFrac, 6);
    expect(bottomDragWear(10, 0.5, 'nylon', 'leader')).toBeCloseTo(l / 2, 6);
  });
  it('다시 매기 — 목줄 1.5m · 원줄 3m', () => {
    expect(retieCutM('leader')).toBe(TUNING.lineWear.retieLeaderM);
    expect(retieCutM('main')).toBe(TUNING.lineWear.retieMainM);
  });
  it('재질 표는 네 키 전부 · 나일론과 모노는 같다', () => {
    expect(Object.keys(LINE_MATERIAL_TRAITS).sort()).toEqual(['fluorocarbon', 'monofilament', 'nylon', 'pe_braid']);
    expect(LINE_MATERIAL_TRAITS.monofilament.abrasion).toBe(LINE_MATERIAL_TRAITS.nylon.abrasion);
  });
});
