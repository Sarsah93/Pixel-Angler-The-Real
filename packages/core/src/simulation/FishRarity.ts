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
import { lineStrengthKgOf, type LineStrengthSource } from '../rules/LineStrength.js';
import { TUNING } from '../config/tuning.js';

/** 어종군 — 파이팅 가속 배수·희귀도 하한·가이드 문구가 공유하는 분류 */
export type FightGroup =
  | 'seabream'      // 돔류 — 감성돔·참돔·돌돔·강담돔·벵에돔류 (여 박기, 순간 3~5배)
  | 'amberjack'     // 방어류 — 방어·부시리·잿방어 (횡 러닝, 지구력)
  | 'tuna'          // 참치류 — 참다랑어 (301(2) P-0029 — 방어류와 같은 방추형 러너지만 체급 2.4배 · 온혈 지구력 · 수직 하강)
  | 'billfish'      // 새치류 — 황새치 · 청새치 (324 — 수면 위로 뛰며 머리를 턴다 · 긴 러닝 · 참치류보다 순간 힘은 조금 낮다)
  | 'mackerel'      // 고등어·전갱이·삼치·꽁치·학꽁치 (빠르고 짧은 러닝)
  | 'rockfish'      // 볼락·열기·우럭·쏨뱅이 (짧은 박기)
  | 'flatfish'      // 광어·도다리·서대 (무겁지만 힘은 약함)
  | 'seabass'       // 농어 (점프+러닝)
  | 'cephalopod'    // 두족류 (당김만 — 힘 약함)
  | 'other';        // 잡어 — 장대·성대·숭어·망둑 등

const SEABREAM = new Set(['black_seabream', 'red_seabream', 'night_seabream', 'largescale_blackfish',
  'longtail_blackfish', 'stone_beakperch', 'spotted_knifejaw']);
const AMBERJACK = new Set(['yellowtail', 'amberjack', 'greater_amberjack']);
// 301(2) — 하모니 F-0107 · P-0029(사용자 결정 「옮겨줘 … 개체 크기와 특성이 부분적으로 다르니 그것도 고려」):
//   참다랑어는 'other'(2.2) 폴백에 떨어져 25kg 개체 요구 장력(64kg)이 10.7kg 잿방어(62kg)와 같았다.
//   방어류(전갱이과)와 다랑어류(고등어과)는 속이 다르지만 체형(방추형 · 횡 러닝)이 같아 **전용 군**으로 두고
//   배수는 방어류 5.5에 체급 보정(근력 ∝ L² · 체중 ∝ L³ → 평균 체장 95 : 110 ≈ 0.86)을 한 5.0 — `TUNING.fightPhys.burst.tuna`.
const TUNA = new Set(['bluefin_tuna']);
// 322차 — 청어과 셋(전어 · 청어 · 멸치)도 빠르고 짧게 달리는 작은 표층어다
const MACKEREL = new Set(['chub_mackerel', 'horse_mackerel', 'spanish_mackerel', 'pacific_saury', 'halfbeak',
  'gizzard_shad', 'pacific_herring', 'anchovy']);
const FLATFISH = new Set(['flatfish', 'flounder', 'frog_flounder', 'starry_flounder', 'tonguefish']);
const CEPH = new Set(['squid', 'cuttlefish', 'octopus', 'giant_octopus', 'swordtip_squid', 'flying_squid']);

export function fightGroupOf(speciesId: string): FightGroup {
  if (SEABREAM.has(speciesId)) return 'seabream';
  if (AMBERJACK.has(speciesId)) return 'amberjack';
  if (TUNA.has(speciesId) || /tuna$|skipjack|bonito/.test(speciesId)) return 'tuna';   // 301(2) — 앞으로 더할 가다랑어 · 다랑어도 같은 군
  if (/swordfish|marlin|sailfish|spearfish/.test(speciesId)) return 'billfish';            // 324 — 새치류
  if (MACKEREL.has(speciesId)) return 'mackerel';
  if (FLATFISH.has(speciesId)) return 'flatfish';
  if (CEPH.has(speciesId)) return 'cephalopod';
  if (speciesId === 'sea_bass') return 'seabass';
  // 322차 — 바리류(붉바리 · 자바리 · 능성어 · 다금바리)도 굴로 처박는 짧은 다이브다(힘은 `basePower` · 체중이 받친다)
  if (/rockfish|snapper|scorpion|greenling|grouper|sawedged/.test(speciesId)) return 'rockfish';
  return 'other';
}

/**
 * 324 — **이 개체의 순간 가속 배수**(체중 대비). 어종군 배수(`TUNING.fightPhys.burst`)에 체급 보정을 건다:
 * 기준 체장(`burstRefCm`)보다 큰 개체는 `(기준 / 체장)^burstSizeExp`만큼 준다(근력 ∝ L² · 체중 ∝ L³).
 * 180cm · 111kg 참다랑어 = 5.0 × 110 / 180 ≈ 3.06 — 요구 장력 약 374kg(보정이 없으면 590kg).
 * 기준 이하 개체 · 기준이 없는 군 · 체장을 모를 때는 군 배수 그대로다.
 */
export function fightBurstMult(speciesId: string, lengthCm?: number): number {
  const g = fightGroupOf(speciesId);
  const base = TUNING.fightPhys.burst[g];
  const ref = TUNING.fightPhys.burstRefCm[g];
  if (!ref || !lengthCm || lengthCm <= ref) return base;
  return base * Math.pow(ref / lengthCm, TUNING.fightPhys.burstSizeExp);
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
  // 301(2) — 참치류도 대물군이라 같은 하한
  if ((g === 'seabream' || g === 'amberjack' || g === 'tuna' || g === 'billfish') && tier === 'common') tier = 'fine';
  const st = RARITY_STYLE[tier];
  return { tier, ratio, label: st.label, color: st.color, tint: st.tint };
}

// ── 낚싯줄 인장강도 (116차 — 피드백 4.1 "라이트 채비로 부시리를 걸면 터진다") ─────────

/**
 * 줄 아이템의 인장강도(kg) — 아이템에 `lineStrengthKg`가 있으면 그것을 쓴다.
 * 281차부터 **호수가 기준**이고 표는 `rules/LineStrength.ts` 하나다(상세 창 lb 표시도 같은 표).
 *  - 카본/나일론 N호 ≈ 4N lb ≈ **1.8N kg** (1.5호 ≈ 2.7kg — 25cm 감성돔 인장 0.8~1.5kg에 여유)
 *  - PE 합사 N호 ≈ 20N lb ≈ **9N kg** (원줄이 목줄보다 항상 강하다)
 */
export function lineStrengthKg(item: LineStrengthSource & { subCategory?: string } | null | undefined): number | null {
  return lineStrengthKgOf(item);
}
