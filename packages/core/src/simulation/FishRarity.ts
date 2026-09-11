/**
 * @file FishRarity.ts
 * @description 어획 개체 희귀도(사이즈 등급) + 어종군 분류 (116차 — 외부 테스터 피드백 5·4.2)
 *
 *  - 희귀도 = **개체 길이 ÷ 어종 평균 길이(ref)** 비율로 6단계. 채비·장비와 무관한 "절대 난이도".
 *      검붉음 ≥ 2.4× · 빨강 ≥ 2.0× · 주황 ≥ 1.6× · 노랑 ≥ 1.2× · 흰색 0.8~1.2× · 초록 ≤ 0.8×
 *    **돔류·방어류는 노란색부터** — 평균 개체라도 우량(노랑)이 최저 등급(사용자 지정).
 *  - ref = 오라클 `meanCm`(등재 어종) → FISH_DATABASE `avgSizeRangeCm` 중앙값 폴백
 *    (SizeTierRules.fishImageSizeScale과 같은 기준을 공유한다).
 *  - 어종군(`fightGroupOf`)은 파이팅 순간 가속 배수(FightingPhase)와 희귀도 하한이 함께 쓴다.
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

import { ORACLE_FISH_DB, type FishBodyForm } from './FishSpawningOracle.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';

/** 어종군 — 파이팅 가속 배수·희귀도 하한·가이드 문구가 공유하는 분류 */
export type FightGroup =
  | 'seabream'      // 돔류 — 감성돔·참돔·돌돔·강담돔·벵에돔류 (여 박기, 순간 3~5배)
  | 'amberjack'     // 방어류 — 방어·부시리·잿방어 (횡 러닝, 지구력)
  | 'mackerel'      // 고등어·전갱이·삼치·꽁치·학꽁치 (빠르고 짧은 러닝)
  | 'rockfish'      // 볼락·열기·우럭·쏨뱅이 (짧은 박기)
  | 'flatfish'      // 광어·도다리·서대 (무겁지만 힘은 약함)
  | 'seabass'       // 농어 (점프+러닝)
  | 'cephalopod'    // 두족류 (당김만 — 힘 약함)
  | 'other';        // 잡어 — 장대·성대·숭어·망둑 등

const SEABREAM = new Set(['black_seabream', 'red_seabream', 'night_seabream', 'largescale_blackfish',
  'longtail_blackfish', 'stone_beakperch', 'spotted_knifejaw']);
const AMBERJACK = new Set(['yellowtail', 'amberjack', 'greater_amberjack']);
const MACKEREL = new Set(['chub_mackerel', 'horse_mackerel', 'spanish_mackerel', 'pacific_saury', 'halfbeak']);
const FLATFISH = new Set(['flatfish', 'flounder', 'frog_flounder', 'starry_flounder', 'tonguefish']);
const CEPH = new Set(['squid', 'cuttlefish', 'octopus', 'giant_octopus', 'swordtip_squid']);

export function fightGroupOf(speciesId: string): FightGroup {
  if (SEABREAM.has(speciesId)) return 'seabream';
  if (AMBERJACK.has(speciesId)) return 'amberjack';
  if (MACKEREL.has(speciesId)) return 'mackerel';
  if (FLATFISH.has(speciesId)) return 'flatfish';
  if (CEPH.has(speciesId)) return 'cephalopod';
  if (speciesId === 'sea_bass') return 'seabass';
  if (/rockfish|snapper|scorpion|greenling/.test(speciesId)) return 'rockfish';
  return 'other';
}

/**
 * 어종 체형 (133차) — 오라클 `bodyForm` → 미등재 어종은 'roundish'.
 * 파이트 물리(TUNING.fightPhys.form)가 이 키로 배수를 고른다.
 */
export function fightBodyFormOf(speciesId: string): FishBodyForm {
  return ORACLE_FISH_DB.find((f) => f.speciesId === speciesId)?.bodyForm ?? 'roundish';
}

/** 어종 "보통 길이"(cm) — 오라클 meanCm → 도감 avgSizeRangeCm 중앙 → 35cm 안전값 */
export function fishReferenceLengthCm(speciesId: string): number {
  const o = ORACLE_FISH_DB.find((f) => f.speciesId === speciesId);
  if (o?.meanCm) return o.meanCm;
  const d = FISH_DATABASE.find((f) => f.id === speciesId);
  if (d?.avgSizeRangeCm) return (d.avgSizeRangeCm[0] + d.avgSizeRangeCm[1]) / 2;
  return 35;
}

export type RarityTier = 'monster' | 'trophy' | 'big' | 'fine' | 'common' | 'small';

export interface FishRarityInfo {
  tier: RarityTier;
  /** 개체 길이 ÷ 어종 평균 길이 */
  ratio: number;
  label: string;
  /** UI 글자색 (#rrggbb) */
  color: string;
  /** 숫자색 (Phaser tint) */
  tint: number;
}

export const RARITY_STYLE: Record<RarityTier, { label: string; color: string; tint: number }> = {
  monster: { label: '괴물급', color: '#c4143a', tint: 0xc4143a },   // 검붉은색 ≥ 2.4×
  trophy:  { label: '대물',   color: '#ff3b3b', tint: 0xff3b3b },   // 빨강 ≥ 2.0×
  big:     { label: '준대물', color: '#ff9a2e', tint: 0xff9a2e },   // 주황 ≥ 1.6×
  fine:    { label: '우량',   color: '#ffd93b', tint: 0xffd93b },   // 노랑 ≥ 1.2× (돔류·방어류 하한)
  common:  { label: '평균',   color: '#ffffff', tint: 0xffffff },   // 흰색 — 표기 [1.14×, 평균] (117차 피드백 4)
  small:   { label: '소형',   color: '#5ee08a', tint: 0x5ee08a },   // 초록 ≤ 0.8×
};

/** 사이즈 비율 → 등급 (돔류·방어류는 fine 하한) */
export function fishRarity(speciesId: string, lengthCm: number): FishRarityInfo {
  const ref = fishReferenceLengthCm(speciesId);
  const ratio = ref > 0 ? lengthCm / ref : 1;
  let tier: RarityTier =
    ratio >= 2.4 ? 'monster'
    : ratio >= 2.0 ? 'trophy'
    : ratio >= 1.6 ? 'big'
    : ratio >= 1.2 ? 'fine'
    : ratio <= 0.8 ? 'small'
    : 'common';
  const g = fightGroupOf(speciesId);
  // 돔류·방어류 하한 = 우량(노랑) — 단 평균의 0.8배 이하(소형)는 초록을 유지한다(20cm 잿방어가 '우량'이면 어색)
  if ((g === 'seabream' || g === 'amberjack') && tier === 'common') tier = 'fine';
  const st = RARITY_STYLE[tier];
  return { tier, ratio, label: st.label, color: st.color, tint: st.tint };
}

// ── 낚싯줄 인장강도 (116차 — 피드백 4.1 "라이트 채비로 부시리를 걸면 터진다") ─────────

/**
 * 줄 아이템 이름에서 인장강도(kg)를 추정한다 — 아이템에 `lineStrengthKg`가 있으면 그것을 쓴다.
 *  - 카본/나일론 목줄 N호 ≈ 4N lb ≈ **1.8N kg** (1.5호 ≈ 2.7kg — 25cm 감성돔 인장 0.8~1.5kg에 여유)
 *  - PE 합사 N호 ≈ 20N lb ≈ **9N kg** (원줄이 목줄보다 항상 강하다)
 */
export function lineStrengthKg(item: { name: string; subCategory?: string; lineStrengthKg?: number } | null | undefined): number | null {
  if (!item) return null;
  if (item.lineStrengthKg && item.lineStrengthKg > 0) return item.lineStrengthKg;
  const m = /(\d+(?:\.\d+)?)\s*호/.exec(item.name);
  if (!m) return null;
  const ho = parseFloat(m[1]);
  const isPe = /PE|합사/i.test(item.name);
  return isPe ? ho * 9 : ho * 1.8;
}
