/**
 * @file CookwareDatabase.ts
 * @description 화구(열원) · 용기 · 연료 DB (154차 불요리 — 스펙 §4)
 *
 * ⚖ 조리 가능 여부는 데이터 교집합으로 결정한다 — 새 화구/용기는 여기 한 줄이면 된다.
 * 열관성이 큰 용기(양수 냄비)는 온도가 천천히 움직여 실수 여유가 있고,
 * 코펠은 민감하다(현장 난이도 = 장비 차이).
 */

import type { CookwareDef, CookwareKind, FuelDef, HeatSourceDef } from '../types/Cooking.js';

export const HEAT_SOURCES: HeatSourceDef[] = [
  {
    id: 'home_range', nameKo: '가스레인지', nameEn: 'Gas range',
    maxHeatW: 2000, windSensitivity: 0, infiniteFuel: true, stage: 'home',
  },
  {
    id: 'portable_gas', nameKo: '휴대용 가스스토브', nameEn: 'Portable gas stove',
    maxHeatW: 1900, windSensitivity: 0.6, infiniteFuel: false, stage: 'field',
  },
];

export const COOKWARES: CookwareDef[] = [
  { id: 'pot_camp', nameKo: '코펠 냄비', nameEn: 'Camp pot', kind: 'pot', thermalMassJK: 380, capacityMl: 1800, maxTempC: 240, lossMult: 1 },
  { id: 'pot_home', nameKo: '양수 냄비', nameEn: 'Stock pot', kind: 'pot', thermalMassJK: 900, capacityMl: 3500, maxTempC: 240, lossMult: 1 },
  { id: 'pan', nameKo: '프라이팬', nameEn: 'Frying pan', kind: 'pan', thermalMassJK: 700, maxTempC: 260, lossMult: 0.7 },
  { id: 'grill_grate', nameKo: '석쇠', nameEn: 'Grill grate', kind: 'grate', thermalMassJK: 250, maxTempC: 300, lossMult: 0.6 },
];

export const FUELS: FuelDef[] = [
  { id: 'butane_can', nameKo: '부탄 캐니스터', nameEn: 'Butane canister', minutesPerUnit: 55, heatSourceId: 'portable_gas' },
];

export function getHeatSource(id: string): HeatSourceDef | undefined {
  return HEAT_SOURCES.find((h) => h.id === id);
}
export function getCookware(id: string): CookwareDef | undefined {
  return COOKWARES.find((c) => c.id === id);
}
export function getFuel(id: string): FuelDef | undefined {
  return FUELS.find((f) => f.id === id);
}

/** 불 세기 → 화력 비율 (강불 = 1) */
/**
 * 불 세기 → 화력 비율 (강불 = 1).
 * ⚖ 약불 0.22 = **보온** — 손실 9 W/K 기준 평형이 66~69°C라 끓지도 졸지도 않고 과조리도 거의 멈춘다.
 *   "걸어두려면 약불로 내려놓아라"가 배울 수 있는 규칙이 되는 손잡이다(실측: 강불은 26분 뒤 졸아붙는다).
 */
export const HEAT_FRAC: Record<0 | 1 | 2 | 3, number> = { 0: 0, 1: 0.22, 2: 0.6, 3: 1.0 };
export const HEAT_LABEL_KO: Record<0 | 1 | 2 | 3, string> = { 0: '끔', 1: '약불', 2: '중불', 3: '강불' };
export const HEAT_LABEL_EN: Record<0 | 1 | 2 | 3, string> = { 0: 'Off', 1: 'Low', 2: 'Medium', 3: 'High' };

export const COOKWARE_KIND_KO: Record<CookwareKind, string> = { pot: '냄비', pan: '팬', grate: '석쇠' };
