/**
 * @file TidePhaseStrategy.ts
 * @description 물때 흐름 × 어종 × 장르 공략 규칙 (205차 — `.agents/TIDE_PHASE_STRATEGY_SPEC.md` P1~P3).
 *
 * 204차가 깔아 둔 8단계(`TideFlowPhase`) 위에 세 겹을 얹는다.
 *  - **어종**: 어종마다 잘 무는 단계가 다르다(`TidePhasePreference`). 대물이 붙는 단계도 어종별로 더한다.
 *  - **장르**: 단계가 입질이 아니라 **채비가 제대로 일하느냐**를 바꾼다 —
 *    찌(물돌이에 밑밥이 쌓였다가 흐름이 붙을 때 풀린다 · 흐를수록 밑밥이 띠로 퍼진다) ·
 *    원투(물살이 세면 가벼운 봉돌이 구른다) · 루어 종류 · 구멍치기(단계보다 수위).
 *  - **부가**: 해루질 간조 시간창 · 통발 평균 유속.
 *
 * 지역·사리 스케일:
 *  - `tideRegionK` — 동해(속초·포항·울릉)는 조차가 30cm 남짓이라 물때 효과를 크게 깎는다(기본 0.3 · 사용자 확정 205차).
 *  - `tideSpringK` — 조금 0.5 ~ 사리 1.0.
 *  - `tideFlow01` — 지금 물살 세기 0~1(물돌이 0 · 중물 최대 · 사리·지역 반영).
 *
 * 순수 TS — 렌더/브라우저 API 없음. 수치는 전부 `TUNING.tidePhase`(F8)에서 읽는다(캐싱 금지).
 */

import { TUNING } from '../config/tuning.js';
import type { LureKind } from '../types/Lure.js';
import type { SurfSinkerTideResult, TideFlowPhase, TideFlowState, TideLureGroup } from '../types/TideFlow.js';
import { rawTidePhasePref, rawTidePhaseSize } from '../db-schema/TidePhasePreference.js';
import { feedingRegionProfileOf } from './FeedingTimeCalculator.js';
import { calculateTideInfo } from './TideCalculator.js';
import { isEbbPhase, isFloodPhase, isSlackPhase, tideFlowStateAt } from './TideFlowPhase.js';

// ─────────────────────────────────────────────
// 지역 · 사리 · 유속
// ─────────────────────────────────────────────

/** 물때 효과 지역 계수 — 동해 `eastSeaK`(기본 0.3) / 그 밖 1.0 */
export function tideRegionK(regionId: string): number {
  return feedingRegionProfileOf(regionId) === 'east_sea' ? TUNING.tidePhase.eastSeaK : 1;
}

/** 물살 세기 지역 계수 — 동해 `eastSeaFlowK`(기본 0.4) / 그 밖 1.0 */
export function tideRegionFlowK(regionId: string): number {
  return feedingRegionProfileOf(regionId) === 'east_sea' ? TUNING.tidePhase.eastSeaFlowK : 1;
}

/** 사리·조금 계수 — 조금 0.5 ~ 사리 1.0 (`currentStrength` 0~1) */
export function tideSpringK(strength01: number): number {
  return 0.5 + 0.5 * Math.max(0, Math.min(1, strength01));
}

/**
 * 지금 물살 세기 0~1 — 극점(만조·간조)에서 0, 극점 사이 한가운데서 최대.
 * 사리일수록 세고(0.35 + 0.65·세기), 동해는 `flowK`만큼 약하다.
 */
export function tideFlow01(state: TideFlowState, strength01: number, flowK = 1): number {
  const half = Math.max(60, state.minutesSinceExtreme + state.minutesToNextExtreme);
  const f = Math.abs(Math.sin(Math.PI * Math.min(1, state.minutesSinceExtreme / half)));
  return Math.max(0, Math.min(1, f * (0.35 + 0.65 * Math.max(0, Math.min(1, strength01))) * flowK));
}

/** 지금 수위 0(간조)~1(만조) — 극점 사이를 반코사인으로 잇는다 */
export function tideWaterLevel01(state: TideFlowState): number {
  const half = Math.max(60, state.minutesSinceExtreme + state.minutesToNextExtreme);
  const rise = (1 - Math.cos(Math.PI * Math.min(1, state.minutesSinceExtreme / half))) / 2;
  // 다음 극점이 만조 = 지금 차오르는 중(간조에서 출발)
  return state.nextExtreme === 'high' ? rise : 1 - rise;
}

/** 감쇠 계수 k로 배율을 1 쪽으로 누른다 */
function damp(mult: number, k: number): number {
  return 1 + (mult - 1) * k;
}

// ─────────────────────────────────────────────
// P1 — 어종 × 단계
// ─────────────────────────────────────────────

/** 어종의 단계 입질 배율(사리·지역 반영 · `speciesScale`로 전체 세기 조절) */
export function speciesTidePhaseMult(
  speciesId: string, phase: TideFlowPhase, strength01: number, regionK: number,
): number {
  return Math.max(0.2, damp(rawTidePhasePref(speciesId, phase),
    regionK * tideSpringK(strength01) * TUNING.tidePhase.speciesScale));
}

/** 그 어종이 가장 잘 무는 단계의 배율 — 활성도(`speciesBiteReadiness`) 기준값용 */
export function speciesTidePhaseBest(speciesId: string, strength01: number, regionK: number): number {
  const phases: TideFlowPhase[] = [
    'flood_early', 'flood_mid', 'flood_late', 'slack_high', 'ebb_early', 'ebb_mid', 'ebb_late', 'slack_low',
  ];
  return Math.max(1, ...phases.map((p) => speciesTidePhaseMult(speciesId, p, strength01, regionK)));
}

/** P3 — 어종의 단계 대물 가중(0~1 · 지역·사리 반영 · 참돔 강물 대물은 사리일수록) */
export function speciesTideSizeBias(
  speciesId: string, phase: TideFlowPhase, strength01: number, regionK: number,
): number {
  const raw = rawTidePhaseSize(speciesId, phase);
  if (raw <= 0) return 0;
  return Math.max(0, Math.min(1, raw * regionK * tideSpringK(strength01) * TUNING.tidePhase.sizeScale));
}

/** 공통 단계 대물 가중(`TIDE_FLOW_PROFILE.sizeBias`)에 지역 감쇠를 건다 */
export function regionalSizeBias(baseBias: number, regionK: number): number {
  return Math.max(0, Math.min(1, baseBias * regionK));
}

// ─────────────────────────────────────────────
// P2 — 장르 조건
// ─────────────────────────────────────────────

/**
 * 찌 · 밑밥 쌓기(입금) — 물이 약할 때(물돌이 · 끝물) 던진 밑밥은 발밑에 고여 쌓인다.
 * @returns 새 저장량 0~`chumBankMax`
 */
export function chumBankDeposit(bank: number, phase: TideFlowPhase): number {
  const T = TUNING.tidePhase;
  const weak = isSlackPhase(phase) || phase === 'flood_late' || phase === 'ebb_late';
  if (!weak) return bank;
  return Math.min(T.chumBankMax, bank + T.chumBankPerThrow);
}

/**
 * 찌 · 밑밥 풀림 — 흐름이 붙는 단계(초·중)에 쌓인 밑밥이 띠로 풀리며 동조를 더한다.
 * 동해는 흐름이 약해 덜 풀린다(`0.4 + 0.6·regionK`).
 * @returns 남은 저장량 + 이번 프레임 동조 가산
 */
export function chumBankRelease(
  bank: number, phase: TideFlowPhase, dtSec: number, regionK: number,
): { bank: number; syncBonus: number } {
  const T = TUNING.tidePhase;
  if (bank <= 0) return { bank: 0, syncBonus: 0 };
  const flowing = phase === 'flood_early' || phase === 'flood_mid' || phase === 'ebb_early' || phase === 'ebb_mid';
  if (!flowing) return { bank, syncBonus: 0 };
  const syncBonus = bank * T.chumBankSyncBonus * (0.4 + 0.6 * regionK);
  return { bank: Math.max(0, bank - T.chumBankDecayPerSec * dtSec), syncBonus };
}

/** 찌 · 밑밥 띠 — 물살이 셀수록 밑밥이 점이 아니라 띠로 퍼진다(수평 동조 폭 배율) */
export function chumBandSigmaMult(flow01: number): number {
  return 1 + Math.max(0, flow01) * TUNING.tidePhase.chumBandPerFlow;
}

/**
 * 원투 · 봉돌 — 물살이 세고(`flow01 > surfRollFlow`) 봉돌이 가벼우면(`< surfSinkerMinG`) 봉돌이 구른다:
 * 입질 ↓ · 밑걸림 ↑ · 채비가 하류로 끌린다. 흐름이 막 붙는 초들물·초날물은 냄새가 퍼져 입질 ↑.
 */
export function surfSinkerTide(phase: TideFlowPhase, flow01: number, sinkerG: number, regionK: number): SurfSinkerTideResult {
  const T = TUNING.tidePhase;
  if (flow01 > T.surfRollFlow && sinkerG < T.surfSinkerMinG) {
    return { biteMult: T.surfRollBite, snagMult: T.surfRollSnag, rolling: true };
  }
  const early = phase === 'flood_early' || phase === 'ebb_early';
  return { biteMult: early ? damp(T.surfEarlyBite, regionK) : 1, snagMult: 1, rolling: false };
}

/** 루어 종류 → 물때 반응 묶음 */
export function tideLureGroupOf(kind: LureKind | undefined): TideLureGroup {
  switch (kind) {
    case 'metal_jig': case 'plug_minnow': case 'spoon': case 'spinner': return 'swim';
    case 'egi': return 'egi';
    case 'tairaba': return 'tairaba';
    case 'worm_grub': case 'soft_jerkbait': return 'soft';
    default: return 'other';
  }
}

/**
 * 루어 종류별 단계 배율.
 *  - 지그·미노우·스푼·스피너: 물살이 있어야 액션이 산다 — 중물 ×1.1 · 물돌이 ×0.85
 *  - 에기: 완만한 흐름 — 물돌이 앞뒤 ×1.1 · 물살이 너무 세면(flow > lureFlowHigh) ×0.85
 *  - 타이라바: 흐름이 스커트를 흔든다 — 중물 ×1.15 · 물돌이 ×0.7
 *  - 웜·소프트 저크베이트(바닥): 흐름이 붙는 초물 ×1.1 · 너무 세면 바닥을 못 지켜 ×0.85
 * 단계 몫은 지역 감쇠, 물살 몫은 이미 `flow01`에 지역이 들어 있다.
 */
export function lureKindTideMult(kind: LureKind | undefined, phase: TideFlowPhase, flow01: number, regionK: number): number {
  const T = TUNING.tidePhase;
  const mid = phase === 'flood_mid' || phase === 'ebb_mid';
  const early = phase === 'flood_early' || phase === 'ebb_early';
  const slack = isSlackPhase(phase);
  const strong = flow01 > T.lureFlowHigh;
  switch (tideLureGroupOf(kind)) {
    case 'swim': return damp(mid ? 1.1 : slack ? 0.85 : 1, regionK);
    case 'egi': return damp(slack ? 1.1 : 1, regionK) * (strong ? 0.85 : 1);
    case 'tairaba': return damp(mid ? 1.15 : slack ? 0.7 : 1, regionK);
    case 'soft': return damp(early ? 1.1 : 1, regionK) * (strong ? 0.85 : 1);
    default: return 1;
  }
}

/**
 * 구멍치기 — 단계보다 **수위**. 만조 근처(블록 위 물이 깊다) `holeHigh` · 간조(블록이 드러난다) `holeLow`.
 * 동해는 수위 변화가 작아 거의 1.0이다.
 */
export function holeWaterLevelMult(level01: number, regionK: number): number {
  const T = TUNING.tidePhase;
  const l = Math.max(0, Math.min(1, level01));
  return damp(T.holeLow + (T.holeHigh - T.holeLow) * l, regionK);
}

// ─────────────────────────────────────────────
// P3 — 해루질 · 통발
// ─────────────────────────────────────────────

/**
 * 해루질 시간창 — 간조 2시간 전(끝날물 후반) ~ 간조 물돌이 ~ 간조 1시간 뒤(초들물 앞부분).
 * @returns 창 안이면 발견·성공 배율(1 + `forageWindowBonus` × 사리 × 지역), 밖이면 1
 */
export function forageTideMult(state: TideFlowState, strength01: number, regionK: number): number {
  const inWindow = forageTideWindow(state);
  if (!inWindow) return 1;
  return 1 + TUNING.tidePhase.forageWindowBonus * tideSpringK(strength01) * regionK;
}

/** 해루질 시간창 안인가 */
export function forageTideWindow(state: TideFlowState): boolean {
  // 간조로 가는 중(다음 극점 = 간조) 2시간 이내
  if (state.nextExtreme === 'low' && state.minutesToNextExtreme <= 120) return true;
  // 간조 지나 들물(다음 극점 = 만조) 1시간 이내
  if (state.nextExtreme === 'high' && state.minutesSinceExtreme <= 60) return true;
  return false;
}

/** 들물이 차오르는 중 — 간조 1시간 뒤부터 3시간 뒤까지(갯바위·갯벌 고립 주의) */
export function forageFloodWarning(state: TideFlowState): boolean {
  return state.nextExtreme === 'high' && state.minutesSinceExtreme > 60 && state.minutesSinceExtreme <= 180;
}

/**
 * 통발 — 담가 둔 동안의 평균 물살 0~1. 미끼 냄새가 물살을 타고 멀리 퍼질수록 많이 든다.
 * 30분 간격 표본(최대 48개).
 */
export function averageTideFlow01(fromMs: number, toMs: number, flowK = 1): number {
  const span = Math.max(0, toMs - fromMs);
  if (span < 60_000) return tideFlow01(tideFlowStateAt(new Date(toMs)), calculateTideInfo(new Date(toMs)).currentStrength, flowK);
  const n = Math.max(1, Math.min(48, Math.round(span / 1_800_000)));
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const t = new Date(fromMs + (span * (i + 0.5)) / n);
    sum += tideFlow01(tideFlowStateAt(t), calculateTideInfo(t).currentStrength, flowK);
  }
  return sum / n;
}

/**
 * 통발 어획 배율 — 평균 물살을 한 물때 주기의 최대 평균(|sin| 평균 2/π ≈ 0.64)으로 나눠 0~1로 펴고,
 * 0 → 1 − span/2 · 1 → 1 + span/2. 동해는 `regionK`로 1 쪽으로 누른다(덜 타는 것이지 덜 드는 것이 아니다).
 * @param avgFlow01 지역 감쇠 없이 잰 평균 물살(`averageTideFlow01(from, to)`)
 */
export function trapTideMult(avgFlow01: number, regionK = 1): number {
  const s = TUNING.tidePhase.trapFlowSpan;
  const norm = Math.max(0, Math.min(1, avgFlow01 / (2 / Math.PI)));
  return damp(1 - s / 2 + s * norm, regionK);
}

/** 물때 방향만 묻는 짧은 판정(위키·도움말용) */
export function tidePhaseKindKo(phase: TideFlowPhase): '들물' | '날물' | '물돌이' {
  return isFloodPhase(phase) ? '들물' : isEbbPhase(phase) ? '날물' : '물돌이';
}
