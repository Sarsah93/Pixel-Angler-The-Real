/**
 * @file LuresCatalogDB.ts
 * @description 루어 카탈로그 (가상 브랜드 · 수치 원안 유지)
 *
 * 소프트 베이트(웜/그럽·소프트 저크베이트) + 하드 베이트(미노우·스푼·스피너·
 * 에기·메탈지그). 무게/사이즈 수치는 기획 원안 그대로. 물리·타겟 특성은
 * LureSpec 데이터로만 표현하며 엔진이 소비한다(하드코딩 버프 금지).
 *
 * 순수 TS 데이터.
 */

import type { LureSpec } from '../types/Lure.js';

/** 기준 공기 저항 계수 (일반 채비) — 메탈지그는 이 값의 -35% */
const BASE_CD = 0.42;

export const LURES_CATALOG_DB: LureSpec[] = [
  // ── 소프트 베이트 ──────────────────────────────────
  // 웜/그럽 · Nature Tail · Slim-Tail Grub (지그헤드 결합, 바닥 락피시 +20%)
  {
    id: 'lure_grub_2in', nameKo: '슬림 테일 그럽 2인치', nameEn: 'Slim-Tail Grub 2in',
    brand: 'Nature Tail', family: 'soft', kind: 'worm_grub', sizeLabel: '2인치',
    weightG: 2.5, sinkType: 'sinking', sinkRateMps: 0.15, dragCoefficient: 0.45,
    requiresJigHead: true,
    speciesWeightBias: { black_rockfish: 0.20, dark_banded_rockfish: 0.15, scorpionfish: 0.10 },
    actionFlags: ['wobble'],
  },
  {
    id: 'lure_grub_3in', nameKo: '슬림 테일 그럽 3인치', nameEn: 'Slim-Tail Grub 3in',
    brand: 'Nature Tail', family: 'soft', kind: 'worm_grub', sizeLabel: '3인치',
    weightG: 4.0, sinkType: 'sinking', sinkRateMps: 0.18, dragCoefficient: 0.45,
    requiresJigHead: true,
    speciesWeightBias: { black_rockfish: 0.20, dark_banded_rockfish: 0.15, scorpionfish: 0.10 },
    actionFlags: ['wobble'],
  },
  // 소프트 저크베이트 · Fluid · Shad Minnow Worm (다트 액션)
  {
    id: 'lure_jerk_4in', nameKo: '섀드 미노우 웜 4인치', nameEn: 'Shad Minnow Worm 4in',
    brand: 'Fluid', family: 'soft', kind: 'soft_jerkbait', sizeLabel: '4인치',
    weightG: 7.0, sinkType: 'sinking', sinkRateMps: 0.18, dragCoefficient: 0.44,
    requiresJigHead: true, actionFlags: ['dart'],
    speciesWeightBias: { sea_bass: 0.20, yellowtail: 0.10 },
  },
  {
    id: 'lure_jerk_5in', nameKo: '섀드 미노우 웜 5인치', nameEn: 'Shad Minnow Worm 5in',
    brand: 'Fluid', family: 'soft', kind: 'soft_jerkbait', sizeLabel: '5인치',
    weightG: 11.5, sinkType: 'sinking', sinkRateMps: 0.22, dragCoefficient: 0.44,
    requiresJigHead: true, actionFlags: ['dart'],
    speciesWeightBias: { sea_bass: 0.20, yellowtail: 0.10 },
  },

  // ── 하드 베이트 ────────────────────────────────────
  // 플러그/미노우 · Prism Aqua · Dive Shad 95S (플로팅/싱킹 2종)
  {
    id: 'lure_minnow_float', nameKo: '다이브 섀드 95S (플로팅)', nameEn: 'Dive Shad 95S Floating',
    brand: 'Prism Aqua', family: 'hard', kind: 'plug_minnow', sizeLabel: '95mm 12g',
    weightG: 12.0, sinkType: 'floating', diveDepthPerRetrieve: 1.6, dragCoefficient: BASE_CD,
    actionFlags: ['wobble'],
    speciesWeightBias: { sea_bass: 0.15, amberjack: 0.12 },
  },
  {
    id: 'lure_minnow_sink', nameKo: '다이브 섀드 95S (싱킹)', nameEn: 'Dive Shad 95S Sinking',
    brand: 'Prism Aqua', family: 'hard', kind: 'plug_minnow', sizeLabel: '95mm 15.5g',
    weightG: 15.5, sinkType: 'sinking', sinkRateMps: 0.22, dragCoefficient: BASE_CD,
    actionFlags: ['wobble'],
    speciesWeightBias: { sea_bass: 0.15, amberjack: 0.12 },
  },
  // 스푼 · Blade Studio · Classic Spoon (불규칙 폴링 유인)
  {
    id: 'lure_spoon_14', nameKo: '클래식 스푼 14g', nameEn: 'Classic Spoon 14g',
    brand: 'Blade Studio', family: 'hard', kind: 'spoon', sizeLabel: '14g',
    weightG: 14.0, sinkType: 'sinking', sinkRateMps: 0.35, dragCoefficient: 0.52,
    fallLureWeight: 0.18, actionFlags: ['flash'],
    speciesWeightBias: { sea_bass: 0.12 },
  },
  {
    id: 'lure_spoon_21', nameKo: '클래식 스푼 21g', nameEn: 'Classic Spoon 21g',
    brand: 'Blade Studio', family: 'hard', kind: 'spoon', sizeLabel: '21g',
    weightG: 21.0, sinkType: 'sinking', sinkRateMps: 0.42, dragCoefficient: 0.52,
    fallLureWeight: 0.22, actionFlags: ['flash'],
    speciesWeightBias: { sea_bass: 0.12 },
  },
  // 스피너 · Blade Studio · Rotary Wing (계류/구조물성 어종 가중)
  {
    id: 'lure_spinner_5', nameKo: '로터리 윙 5.5g', nameEn: 'Rotary Wing 5.5g',
    brand: 'Blade Studio', family: 'hard', kind: 'spinner', sizeLabel: '5.5g',
    weightG: 5.5, sinkType: 'sinking', sinkRateMps: 0.20, dragCoefficient: 0.55,
    targetHabitatBias: ['structure', 'reef'], actionFlags: ['rolling'],
    speciesWeightBias: { greenling: 0.12, fat_greenling: 0.10 },
  },
  {
    id: 'lure_spinner_8', nameKo: '로터리 윙 8g', nameEn: 'Rotary Wing 8g',
    brand: 'Blade Studio', family: 'hard', kind: 'spinner', sizeLabel: '8g',
    weightG: 8.0, sinkType: 'sinking', sinkRateMps: 0.26, dragCoefficient: 0.55,
    targetHabitatBias: ['structure', 'reef'], actionFlags: ['rolling'],
    speciesWeightBias: { greenling: 0.12, fat_greenling: 0.10 },
  },
  // 에기 · Kraken · Dart Master Egi (두족류 전용, 바닥 걸림 -30%)
  {
    id: 'lure_egi_25', nameKo: '다트 마스터 에기 2.5호', nameEn: 'Dart Master Egi #2.5',
    brand: 'Kraken', family: 'hard', kind: 'egi', sizeLabel: '2.5호',
    weightG: 10.5, sinkType: 'sinking', sinkRateMps: 0.28, dragCoefficient: 0.46,
    spawnBinding: ['squid', 'octopus'], actionFlags: ['dart'], snagRiskMult: 0.7,
  },
  {
    id: 'lure_egi_35', nameKo: '다트 마스터 에기 3.5호', nameEn: 'Dart Master Egi #3.5',
    brand: 'Kraken', family: 'hard', kind: 'egi', sizeLabel: '3.5호',
    weightG: 20.0, sinkType: 'sinking', sinkRateMps: 0.40, dragCoefficient: 0.46,
    spawnBinding: ['squid', 'octopus'], actionFlags: ['dart'], snagRiskMult: 0.7,
  },
  // 메탈지그 · Iron Forge · Hyper Bullet (초고속 싱킹, C_d -35% 초장타)
  {
    id: 'lure_metaljig_28', nameKo: '하이퍼 불릿 28g', nameEn: 'Hyper Bullet 28g',
    brand: 'Iron Forge', family: 'hard', kind: 'metal_jig', sizeLabel: '28g',
    weightG: 28.0, sinkType: 'fast_sinking', sinkRateMps: 0.95,
    dragCoefficient: Math.round(BASE_CD * 0.65 * 100) / 100,   // -35%
    actionFlags: ['flash'],
    speciesWeightBias: { yellowtail: 0.15, amberjack: 0.12, chub_mackerel: 0.10 },
  },
  {
    id: 'lure_metaljig_40', nameKo: '하이퍼 불릿 40g', nameEn: 'Hyper Bullet 40g',
    brand: 'Iron Forge', family: 'hard', kind: 'metal_jig', sizeLabel: '40g',
    weightG: 40.0, sinkType: 'fast_sinking', sinkRateMps: 1.25,
    dragCoefficient: Math.round(BASE_CD * 0.65 * 100) / 100,   // -35%
    actionFlags: ['flash'],
    speciesWeightBias: { yellowtail: 0.15, amberjack: 0.12, chub_mackerel: 0.10 },
  },
];

/** 루어 id로 스펙 조회 */
export function getLureSpec(id: string): LureSpec | undefined {
  return LURES_CATALOG_DB.find((l) => l.id === id);
}

/** 세부 종류로 필터 (UI 라인업 표시용) */
export function getLuresByKind(kind: LureSpec['kind']): LureSpec[] {
  return LURES_CATALOG_DB.filter((l) => l.kind === kind);
}
