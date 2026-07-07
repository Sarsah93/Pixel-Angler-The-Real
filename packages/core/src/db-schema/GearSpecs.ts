/**
 * @file GearSpecs.ts
 * @description 낚시 장비 제원 데이터베이스 (실제 제품 기반)
 *
 * 실제 낚시 브랜드(다이와, 시마노, 가마가츠 등) 장비 데이터.
 * Fishing Simulator 급의 제원 반영이 목표입니다.
 */

import type { RodSpec, ReelSpec, LineSpec, FloatSpec, HookSpec } from '../types/Gear.js';

// ─────────────────────────────────────────────
// 낚싯대 데이터베이스
// ─────────────────────────────────────────────
export const ROD_DATABASE: RodSpec[] = [
  // 찌낚시 대
  {
    id: 'rod_daiwaSS1500_1p5',
    brand: '다이와(DAIWA)',
    modelName: 'SS 1500 1.5호',
    lengthM: 5.3,
    lineWeightGrade: '1.5호',
    recommendedLineNo: [1.0, 2.0],
    guideCount: 9,
    pieces: 5,
    weightG: 185,
    priceKRW: 180000,
    rodType: 'float_fishing',
    description: '벵에돔, 감성돔 전유동 및 반유동에 최적화된 다이와 입문-중급 찌낚시 대표 모델',
  },
  {
    id: 'rod_shimanoISO_2',
    brand: '시마노(SHIMANO)',
    modelName: 'AERNOS ISO 2호',
    lengthM: 5.3,
    lineWeightGrade: '2호',
    recommendedLineNo: [1.5, 3.0],
    guideCount: 10,
    pieces: 5,
    weightG: 225,
    priceKRW: 320000,
    rodType: 'float_fishing',
    description: '감성돔 방파제 찌낚시에 맞는 허리힘. 강한 역조류에서도 찌를 안정적으로 흘릴 수 있다.',
  },
  // 원투 대
  {
    id: 'rod_surfcasting_4go',
    brand: '다이와(DAIWA)',
    modelName: 'Crosscast 4호',
    lengthM: 4.05,
    lineWeightGrade: '4호',
    recommendedLineNo: [3.0, 6.0],
    guideCount: 8,
    pieces: 3,
    weightG: 345,
    priceKRW: 150000,
    rodType: 'surfcasting',
    description: '모래사장 원투 낚시에 특화. 100m 이상 캐스팅 가능한 강력한 허리힘.',
  },
  // 지깅 대
  {
    id: 'rod_jigging_major',
    brand: '메이저크래프트(Major Craft)',
    modelName: 'Crossstage CRJ-S60MH',
    lengthM: 1.83,
    lineWeightGrade: '미표기(루어 대)',
    recommendedLineNo: [1.2, 2.0],
    lureWeightRangeG: [60, 200],
    guideCount: 7,
    pieces: 1,
    weightG: 168,
    priceKRW: 220000,
    rodType: 'jigging',
    description: '방어/부시리 선상 지깅 전용. 60~200g 메탈지그 대응. 강한 파이팅에도 버티는 허리.',
  },
];

// ─────────────────────────────────────────────
// 릴 데이터베이스
// ─────────────────────────────────────────────
export const REEL_DATABASE: ReelSpec[] = [
  {
    id: 'reel_shimano2500',
    brand: '시마노(SHIMANO)',
    modelName: 'STRADIC C2500S',
    reelSize: 2500,
    gearRatio: '6.0:1',
    maxDragKg: 4.0,
    retrievePerCrank: 78,
    bearingCount: '6+1',
    weightG: 200,
    lineCapacity: 'PE0.6호-150m / 나일론2호-130m',
    priceKRW: 280000,
    reelType: 'spinning',
  },
  {
    id: 'reel_daiwa3000',
    brand: '다이와(DAIWA)',
    modelName: 'FREAMS LT 3000-C',
    reelSize: 3000,
    gearRatio: '5.2:1',
    maxDragKg: 10.0,
    retrievePerCrank: 73,
    bearingCount: '6+1',
    weightG: 215,
    lineCapacity: 'PE0.8호-150m / 나일론2.5호-150m',
    priceKRW: 180000,
    reelType: 'spinning',
  },
  {
    id: 'reel_shimano4000',
    brand: '시마노(SHIMANO)',
    modelName: 'TWIN POWER 4000XG',
    reelSize: 4000,
    gearRatio: '6.2:1',
    maxDragKg: 11.0,
    retrievePerCrank: 99,
    bearingCount: '9+1',
    weightG: 260,
    lineCapacity: 'PE1.5호-200m / 나일론4호-170m',
    priceKRW: 680000,
    reelType: 'spinning',
  },
];

// ─────────────────────────────────────────────
// 줄 데이터베이스
// ─────────────────────────────────────────────
export const LINE_DATABASE: LineSpec[] = [
  {
    id: 'line_sunline_1p5no',
    brand: '선라인(SUNLINE)',
    modelName: 'SUPER FC Sniper 1.5호',
    lineNo: 1.5,
    strengthLb: 6,
    diameterMm: 0.205,
    material: 'fluorocarbon',
    color: '투명',
    priceKRW: 18000,
  },
  {
    id: 'line_nylon_2no',
    brand: '동양라인',
    modelName: 'Dynacast 2호',
    lineNo: 2.0,
    strengthLb: 8,
    diameterMm: 0.235,
    material: 'nylon',
    color: '핑크',
    priceKRW: 8000,
  },
  {
    id: 'line_pe_1no',
    brand: '요즈리(YO-ZURI)',
    modelName: 'Super Braid PE 1.0호',
    lineNo: 1.0,
    strengthLb: 18,
    diameterMm: 0.165,
    material: 'pe_braid',
    color: '멀티컬러',
    priceKRW: 32000,
  },
];

// ─────────────────────────────────────────────
// 찌 데이터베이스
// ─────────────────────────────────────────────
export const FLOAT_DATABASE: FloatSpec[] = [
  {
    id: 'float_tube_B',
    brand: '나이키(NAIKI)',
    modelName: 'M-1 구멍찌 B',
    buoyancyGrade: 'B',
    buoyancyG: 0.45,
    floatType: 'tube_float',
    weightG: 12,
    priceKRW: 5500,
  },
  {
    id: 'float_tube_00',
    brand: '가이센(GAISEN)',
    modelName: 'Kairyu 구멍찌 00',
    buoyancyGrade: '00',
    buoyancyG: -0.05,
    floatType: 'tube_float',
    weightG: 10,
    priceKRW: 6000,
  },
  {
    id: 'float_sinking_g2',
    brand: '도요',
    modelName: '수중찌 G2',
    buoyancyGrade: 'G2',
    buoyancyG: -0.27,
    floatType: 'sinking_float',
    weightG: 5,
    priceKRW: 2500,
  },
];

// ─────────────────────────────────────────────
// 바늘 데이터베이스
// ─────────────────────────────────────────────
export const HOOK_DATABASE: HookSpec[] = [
  {
    id: 'hook_chinu_3',
    name: '감성돔 바늘 3호',
    hookSize: '3호',
    hookType: 'circle',
    material: 'carbon_steel',
  },
  {
    id: 'hook_chinu_5',
    name: '감성돔 바늘 5호',
    hookSize: '5호',
    hookType: 'circle',
    material: 'vanadium',
  },
  {
    id: 'hook_bengedome_3',
    name: '벵에돔 바늘 3호',
    hookSize: '3호',
    hookType: 'j_hook',
    material: 'vanadium',
  },
];

// Helper functions
export function getRodById(id: string): RodSpec | undefined {
  return ROD_DATABASE.find((r) => r.id === id);
}

export function getReelById(id: string): ReelSpec | undefined {
  return REEL_DATABASE.find((r) => r.id === id);
}

export function getLineById(id: string): LineSpec | undefined {
  return LINE_DATABASE.find((l) => l.id === id);
}

export function getFloatById(id: string): FloatSpec | undefined {
  return FLOAT_DATABASE.find((f) => f.id === id);
}
