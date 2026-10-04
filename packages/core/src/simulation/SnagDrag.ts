/**
 * @file SnagDrag.ts
 * @description 밑걸림 끌림 모델 (207차 — 사용자 지시 「멈춘 채비가 갑자기 걸리는 건 물리적으로 말이 안 된다」).
 *
 * 구 모델(`BiteProbabilityEngine` 밑걸림 타이머)은 **여 위에 채비를 세워 두면** 5초 뒤부터 초당 25%로 걸렸다.
 * 원투 봉돌을 바닥에 박아 두고 기다리는 낚시가 성립하지 않았고, 초반 퀘스트가 밑걸림으로 무너졌다(QA).
 *
 * 새 모델은 **장애물 위를 끌린 거리**로 굴린다:
 *  - P(이번 프레임 걸림) = 1 − exp(−λ · 끌린 거리) · λ = `dragHazardPerM` × 위험 배율 × 근접도
 *  - 근접도 = 바닥에서 미끼까지 높이가 갈래별 「닿는 높이」 안일 때 1 → 0 (선형)
 *      봉돌 0.25m · 루어 0.45m · 찌 목줄 0.35m + 물살 × 0.9m(속조류에 날린다)
 *  - 멈춘 채비(끌린 거리 0)는 절대 걸리지 않는다. 여가 아닌 모래 · 펄 바닥도 걸리지 않는다.
 *
 * 원투 봉돌이 구르는 조건(`sinkerHoldsBottom`): 205차 물살 굴림(물살 > 0.6 · 25호 미만) +
 * 파도 굴림(파고 ≥ 0.8m · 봉돌 < 파고 × 55g). 구르지 않으면 봉돌은 그 자리에 멈춘다.
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import { TUNING } from '../config/tuning.js';
import type { SinkerHoldResult, SnagDragInput, SnagRigKind } from '../types/SnagDrag.js';

/** 갈래별 장애물에 닿는 높이(m) */
export function snagReachM(kind: SnagRigKind, flow01: number): number {
  const T = TUNING.snag;
  if (kind === 'sinker') return T.sinkerReachM;
  if (kind === 'lure') return T.lureReachM;
  return T.floatReachBaseM + Math.max(0, Math.min(1, flow01)) * T.floatReachFlowM;
}

/** 근접도 0~1 — 바닥에 닿아 있으면 1, 닿는 높이 밖이면 0 */
export function snagProximity(kind: SnagRigKind, clearanceM: number, flow01: number): number {
  const reach = snagReachM(kind, flow01);
  if (clearanceM <= 0.05) return 1;
  return Math.max(0, 1 - clearanceM / reach);
}

/** 1m 끌릴 때의 위험(λ) — 게이지 · 하네스용 */
export function snagHazardPerM(i: Omit<SnagDragInput, 'dragM' | 'dtSec'>): number {
  if (!i.inReef) return 0;
  return TUNING.snag.dragHazardPerM * Math.max(0, i.riskMult) * snagProximity(i.kind, i.clearanceM, i.flow01);
}

/** 이번 프레임에 걸릴 확률 — 끌린 거리가 0(또는 잡음 이하)이면 0 */
export function snagDragChance(i: SnagDragInput): number {
  if (!i.inReef || i.dragM <= 0 || i.dtSec <= 0) return 0;
  if (i.dragM / i.dtSec < TUNING.snag.dragMinMps) return 0;
  const lambda = snagHazardPerM(i);
  return lambda <= 0 ? 0 : 1 - Math.exp(-lambda * i.dragM);
}

/**
 * 원투 봉돌이 바닥을 지키는가 — 물살(205차 `surfRollFlow`·`surfSinkerMinG`)과 파도를 함께 본다.
 * @param flow01  물살 0~1(지역 계수 포함)
 * @param waveM   파고(m) — 모르면 0
 * @param sinkerG 봉돌 무게(g)
 */
export function sinkerHoldsBottom(flow01: number, waveM: number, sinkerG: number): SinkerHoldResult {
  const P = TUNING.tidePhase;
  const S = TUNING.snag;
  if (flow01 > P.surfRollFlow && sinkerG < P.surfSinkerMinG) {
    return { rolling: true, cause: 'current', shorewardMps: 0 };
  }
  if (waveM >= S.waveRollMinM && sinkerG < waveM * S.waveSinkerGPerM) {
    return { rolling: true, cause: 'wave', shorewardMps: S.waveDriftMps };
  }
  return { rolling: false, cause: 'none', shorewardMps: 0 };
}
