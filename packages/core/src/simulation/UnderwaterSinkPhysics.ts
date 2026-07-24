/**
 * @file UnderwaterSinkPhysics.ts
 * @description 수중 침강 및 조류 흘림 물리 엔진 (3단계-①②)
 *
 * 착수한 미끼가 물속으로 가라앉고 조류에 흘러가는 과정을 연산한다.
 *  - 침강 속도: V_sink = (W_tackle - B_float) / (C_water × (1 + k·‖V_tide‖))
 *    → 조류가 셀수록 라인이 사선으로 누워 하강이 느려짐
 *  - 수평 드리프트: 찌/미끼가 조류 벡터 방향으로 흘러감 (뒷줄견제 시 제동)
 *  - 지형 안착(Hold): 면사매듭 한계(Z_limit) 또는 바닥(Z_max) 도달 + 흐름 정지
 *
 * 좌표계 (1인칭 뷰 기준): x = 수면 좌우(m), z = 수심(m, 아래로 +).
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

import { TUNING, SinkBodyType } from '../config/tuning.js';

/** 조류 벡터 (m/s) — x: 화면 좌우 성분, y: 전후 성분(연출용) */
export interface TideVector {
  x: number;
  y: number;
}

/** 채비 물리 파라미터 */
export interface RigPhysicsParams {
  /** 채비(봉돌+바늘+미끼) 총 무게 상당 (g) */
  tackleWeightG: number;
  /** 찌 잔존 부력 상당 (g) */
  floatBuoyancyG: number;
  /** 물 저항 계수 C_water (기본 8) */
  waterDragC?: number;
  /** 조류 저항 증폭 계수 k (기본 1.2) */
  tideFactorK?: number;
}

/** 수중 채비 상태 */
export interface UnderwaterRigState {
  /** 찌 수면 좌표 (m, 캐스팅 원점 기준) */
  floatX: number;
  /** 미끼 좌표 (m) — 정렬되며 찌를 뒤따름 */
  baitX: number;
  /** 미끼 수심 (m, 0=수면) */
  baitZ: number;
  /** 바닥/한계 수심 안착 여부 */
  settled: boolean;
  /** 마지막 프레임 수평 이동 속도 (m/s) — Hold 판정용 */
  driftSpeed: number;
}

export function createUnderwaterRig(startX: number): UnderwaterRigState {
  return { floatX: startX, baitX: startX, baitZ: 0.15, settled: false, driftSpeed: 0 };
}

/** 침강 속도 계산 (m/s) — 조류 저항 분모 적용 */
export function computeSinkSpeed(params: RigPhysicsParams, tideSpeed: number): number {
  const net = Math.max(0, params.tackleWeightG - params.floatBuoyancyG);
  const c = params.waterDragC ?? 8;
  const k = params.tideFactorK ?? 1.2;
  return net / (c * (1 + k * tideSpeed));
}

export interface UnderwaterStepInput {
  dtSec: number;
  tide: TideVector;
  params: RigPhysicsParams;
  /** 면사매듭 한계 수심 Z_limit (m) */
  zLimitM: number;
  /** 착수 지점 바닥 수심 Z_max (m) */
  zMaxM: number;
  /** 뒷줄견제(H) 제동 배율 (1 = 자유 흘림, 0.28 = 70%+ 감속) */
  driftBrake: number;
  /** 뒷줄견제 양력에 의한 미끼 상승 속도 (m/s, 0이면 없음) */
  baitLiftMps: number;
}

/**
 * 수중 물리 1스텝. 상태를 제자리 갱신.
 *  - 찌: 조류 × 제동 배율로 수평 드리프트
 *  - 미끼: 찌를 지연 추종 + 침강 (한계 수심 도달 시 안착), 양력 시 상승
 */
export function stepUnderwater(state: UnderwaterRigState, input: UnderwaterStepInput): UnderwaterRigState {
  const { dtSec, tide, params, zLimitM, zMaxM, driftBrake, baitLiftMps } = input;
  const tideSpeed = Math.hypot(tide.x, tide.y);

  // ── 수평 드리프트 ──
  const prevFloatX = state.floatX;
  state.floatX += tide.x * driftBrake * dtSec;
  // 미끼는 찌를 지연 추종 (수심이 깊을수록 랙 큼)
  const followLag = 0.6 + Math.min(1.4, state.baitZ * 0.12);
  state.baitX += (state.floatX - state.baitX) * Math.min(1, dtSec / followLag);
  state.driftSpeed = Math.abs(state.floatX - prevFloatX) / Math.max(dtSec, 0.0001);

  // ── 수직 침강 / 양력 ──
  const bottomLimit = Math.min(zLimitM, zMaxM);
  if (baitLiftMps > 0) {
    // 뒷줄견제 양력: 조류 상대속도로 미끼가 대각선 위로 떠오름
    state.baitZ = Math.max(0.2, state.baitZ - baitLiftMps * dtSec);
    state.settled = false;
  } else if (state.baitZ < bottomLimit) {
    const vSink = computeSinkSpeed(params, tideSpeed);
    state.baitZ = Math.min(bottomLimit, state.baitZ + vSink * dtSec);
    state.settled = state.baitZ >= bottomLimit - 0.01;
  } else {
    state.settled = true;
  }

  return state;
}

/** Hold 판정 — 안착 + 흐름 정지(속도 0 수렴) */
export function isHoldState(state: UnderwaterRigState, speedEpsilon = 0.05): boolean {
  return state.settled && state.driftSpeed < speedEpsilon;
}

// ═══════════════════════════════════════════════════════════════
// 루어/봉돌 침강 물리 — 조류 세기 × 유효무게 → 중력 (LURE_SINK_PHYSICS)
//
//  무게가 조류 임계(Wthr)를 뚫어야 가라앉는다. 못 뚫으면(Weff ≤ Wthr) 표층에
//  떠 조류 방향으로 쓸리고(swept), 뚫으면 초과 무게만큼 종단속도로 포화 침강한다.
//  유효무게 Weff = Wg / dragC (유선형일수록 잘 가라앉음). 단일 루어=루어 무게 /
//  봉돌 채비=봉돌 무게. 모든 계수는 TUNING.sink에서 소비 (dev 패널/시뮬 공유).
// ═══════════════════════════════════════════════════════════════

/** 침강 판정 결과 */
export interface SinkRateResult {
  /** 조류를 못 뚫음 → 표층 부근 유지 + 조류 방향 횡류 */
  swept: boolean;
  /** 침강 속도 (m/s) — swept면 0 */
  sinkRateMps: number;
  /** 라인 각도 (도, 수직 기준) — 78=수평쓸림 / 45~60=적정 / 작을수록 수직 */
  lineAngleDeg: number;
  /** 유효무게 (무드래그 환산 g) */
  weffG: number;
  /** 조류 침강 임계 (g) */
  wthrG: number;
}

/**
 * 조류 세기(cur01 0~1) × 무게(g) × 형상(bodyType) → 침강 거동.
 * threshMult: 조류 존 보정 (조경지대=임계↓ 잘 가라앉음 / 본류=임계↑) — sinkMult 이중적용 방지.
 */
export function computeSinkRate(
  cur01: number, weightG: number, bodyType: SinkBodyType, threshMult = 1,
): SinkRateResult {
  const S = TUNING.sink;
  const dragC = S.dragC[bodyType];
  const weffG = weightG / dragC;
  const cur = Math.max(0, Math.min(1, cur01));
  const wthrG = Math.max(1, (S.thr0 + S.thrSlope * cur) * threshMult);
  let swept = false;
  let sinkRateMps = 0;
  if (weffG <= wthrG) {
    // 조류 못 뚫음 → 표층 쓸림
    swept = true;
  } else {
    // 초과 무게분 → 종단속도로 포화 (무게↑ = 빠른 침강)
    const vT = S.vTerminal[bodyType];
    sinkRateMps = vT * (1 - Math.exp(-(weffG - wthrG) / S.scaleG));
  }
  // 라인각 — 간신히 뚫으면(ratio≈1) 78°(수평쓸림 근접), 무게 초과할수록 수직(작아짐)
  const ratio = weffG / wthrG;
  const lineAngleDeg = Math.max(18, Math.min(85, 78 - 30 * (ratio - 1)));
  return { swept, sinkRateMps, lineAngleDeg, weffG, wthrG };
}
