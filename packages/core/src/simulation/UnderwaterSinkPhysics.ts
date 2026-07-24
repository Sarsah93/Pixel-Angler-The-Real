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
// 루어/봉돌 침강 물리 rev2 — 라인각(줄 처짐) 모델 (LURE_SINK_PHYSICS_V2)
//
//  실측 기반 (2026-07-25 리서치): 정수·약조류에서는 10g 지그헤드도 바닥에 닿는다.
//  조류는 채비를 "못 가라앉게" 막는 게 아니라 원줄에 배(belly)를 만들어 **라인각(θ)**을
//  키우고, 침강 속도를 cosθ로 줄인다. θ가 스윕각(≈72°, 수직 기준)을 넘어서야 비로소
//  표층에서 흘러가며(swept) 바닥에 못 닿는다.
//    tanθ ≈ angleK · curMps / Weff^weightExp   (경량·강조류일수록 θ↑)
//    v_sink = v_terminal(Weff, 형상) · cosθ     (θ가 클수록 느림)
//  유효무게 Weff = Wg / dragC (유선형일수록 큼 → 수직). 종단속도는 무게에 약비례
//  (10g≈0.8·30g≈1.2·60g≈2.0 m/s 정도, 형상 배율). 모든 계수는 TUNING.sink에서 소비.
//  ⚠ 구 모델(무게 임계 thr0+thrSlope·cur 이진 swept)은 10g가 무조류에서도 못 가라앉던
//    버그가 있어 폐기 — 조류에 비례한 임계 폭증이 약조류 침강까지 막았다.
// ═══════════════════════════════════════════════════════════════

/** 침강 판정 결과 */
export interface SinkRateResult {
  /** 라인각이 스윕각 초과 → 못 가라앉고 표층 흐름 */
  swept: boolean;
  /** 침강 속도 (m/s) — swept면 미세 잔류만 */
  sinkRateMps: number;
  /** 라인 각도 (도, 수직 기준) — 0=수직 / 45~60=흘러내림 / 72+=스윕 */
  lineAngleDeg: number;
  /** 유효무게 (무드래그 환산 g) */
  weffG: number;
  /** 이 조류에서 수직 침강을 유지하는 유효무게 기준 (참고용 — θ=스윕각 되는 Weff) */
  wthrG: number;
}

/**
 * 조류 속도(m/s) × 무게(g) × 형상(bodyType) → 침강 거동 (라인각 모델).
 * threshMult: 조류 존 보정 (조경지대=잘 가라앉음 → θ↓ / 본류=θ↑) — sinkMult 이중적용 방지.
 */
export function computeSinkRate(
  currentMps: number, weightG: number, bodyType: SinkBodyType, threshMult = 1,
): SinkRateResult {
  const S = TUNING.sink;
  const dragC = S.dragC[bodyType];
  const weffG = Math.max(0.5, weightG / dragC);
  const cur = Math.max(0, currentMps);
  // 라인각 θ (수직 기준) — 조류가 원줄에 배를 만들어 채비를 눕힌다.
  const tanTheta = (S.angleK * cur / Math.pow(weffG, S.weightExp)) * threshMult;
  const thetaDeg = Math.atan(tanTheta) * (180 / Math.PI);
  const swept = thetaDeg >= S.sweptAngleDeg;
  // 종단 침강속도 — 무게에 약비례 (형상 배율), cosθ로 감쇠
  const vTerm = Math.max(S.vTermMin, Math.min(S.vTermMax,
    S.vTermRefMps[bodyType] * Math.pow(weffG / S.vTermRefG, S.vTermWeightExp)));
  const sinkRateMps = swept
    ? S.residualSweptMps
    : Math.max(S.residualSweptMps, vTerm * Math.cos((thetaDeg * Math.PI) / 180));
  // 참고 임계: 이 조류에서 θ=스윕각을 만드는 Weff (그 이상이면 수직 유지)
  const wthrG = Math.pow((S.angleK * cur * threshMult) / Math.tan((S.sweptAngleDeg * Math.PI) / 180), 1 / S.weightExp);
  return { swept, sinkRateMps, lineAngleDeg: thetaDeg, weffG, wthrG };
}
