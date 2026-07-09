/**
 * @file LinePhysics.ts
 * @description 낚싯줄 물리 시뮬레이션
 *
 * 라인 장력, 드랙 설정, 줄 터짐 계산을 담당합니다.
 */

import type { ReelSpec, LineSpec } from '../types/Gear.js';

export interface LineState {
  /** 현재 장력 (kg) */
  currentTensionKg: number;
  /** 드랙 설정 (0.0~1.0, 1.0 = 최대 드랙력) */
  dragRatio: number;
  /** 현재 릴 아웃된 줄 길이 (m) */
  lineLengthOutM: number;
  /** 줄 터짐 여부 */
  isLineBroken: boolean;
}

/**
 * 현재 장력 대비 줄 강도로 장력 비율 계산
 */
export function getLineTensionRatio(state: LineState, line: LineSpec): number {
  const maxStrengthKg = line.strengthLb * 0.453592;
  return Math.min(1.0, state.currentTensionKg / maxStrengthKg);
}

/**
 * 드랙 설정 기반 최대 작용 가능한 장력 계산
 */
export function getEffectiveDragKg(reel: ReelSpec, dragRatio: number): number {
  return reel.maxDragKg * dragRatio;
}

/**
 * 드랙 실시간 조정
 * @param currentRatio 현재 드랙 비율 (0.0 ~ 1.0)
 * @param direction 'tighten' | 'loosen'
 * @param reel 릴 스펙
 */
export interface DragAdjustResult {
  newDragRatio: number;
  displayDragKg: number;
  message: string;
}

export function adjustDrag(
  currentRatio: number,
  direction: 'tighten' | 'loosen',
  reel: ReelSpec,
): DragAdjustResult {
  const step = 0.05;
  let newDragRatio = currentRatio;

  if (direction === 'tighten') {
    newDragRatio = Math.min(1.0, currentRatio + step);
  } else {
    newDragRatio = Math.max(0.0, currentRatio - step);
  }

  const displayDragKg = reel.maxDragKg * newDragRatio;
  const message = direction === 'tighten'
    ? `드랙 조임 🔒 (${displayDragKg.toFixed(1)}kg)`
    : `드랙 풀기 🔓 (${displayDragKg.toFixed(1)}kg)`;

  return { newDragRatio, displayDragKg, message };
}

/**
 * 파이팅 중 라인 장력 및 줄 길이 실시간 업데이트 (파이팅 틱 시뮬레이션)
 */
export interface FightTickResult {
  lineOutDelta: number;     // 이번 틱에 풀려나가거나 감긴 줄 길이 변화 (m, 양수면 풀림, 음수면 감김)
  newState: LineState;
  tensionRatio: number;     // 0.0~1.0
  dangerLevel: 'safe' | 'warning' | 'critical' | 'broken';
  fishFatigueDelta: number; // 이번 틱에 물고기가 입은 스태미나 감소치 보너스
}

export function simulateFightTick(
  state: LineState,
  fishPullKg: number,
  isReeling: boolean,
  reel: ReelSpec,
  line: LineSpec,
  deltaMs: number,
): FightTickResult {
  const dt = deltaMs / 1000; // 초 단위 변환
  const effectiveDrag = getEffectiveDragKg(reel, state.dragRatio);
  const lineStrengthKg = line.strengthLb * 0.453592;

  let lineOutDelta = 0;
  let currentTension = 0;
  let fishFatigueDelta = 0.005 * dt; // 기본 피로 누적

  // 1. 드랙이 풀리는 조건: 물고기의 인장력 > 현재 드랙 설정력
  if (fishPullKg > effectiveDrag) {
    // 드랙이 풀려나가면서 장력은 최대 드랙력 부근으로 제한
    currentTension = effectiveDrag + (fishPullKg - effectiveDrag) * 0.1; // 약간의 장력 가산
    
    // 줄이 나가는 속도 (m/s)
    const slipSpeed = (fishPullKg - effectiveDrag) * 1.8;
    lineOutDelta = slipSpeed * dt;

    // 드랙 저항을 받으며 나가므로 물고기 피로도 가속
    fishFatigueDelta += 0.015 * (effectiveDrag / reel.maxDragKg) * dt;
  } else {
    // 드랙이 미끄러지지 않는 범위 내
    currentTension = fishPullKg;

    if (isReeling) {
      // 릴링 시 추가 텐션 발생
      currentTension += 1.5;
      
      // 줄을 회수함 (m/s)
      const retrieveSpeed = getRetrieveSpeedMps(reel, 1.2);
      lineOutDelta = -retrieveSpeed * dt;
      
      // 힘껏 당겨져 오므로 물고기 피로도 증가
      fishFatigueDelta += 0.01 * dt;
    }
  }

  // 장력 비율 및 위험 수준 계산
  const tensionRatio = Math.min(1.0, currentTension / lineStrengthKg);
  const dangerLevel = getTensionDangerLevel(tensionRatio);
  const isLineBroken = currentTension > lineStrengthKg * 1.25; // 125% 초과 시 파손

  const newLineLength = Math.max(0, state.lineLengthOutM + lineOutDelta);

  const newState: LineState = {
    currentTensionKg: currentTension,
    dragRatio: state.dragRatio,
    lineLengthOutM: newLineLength,
    isLineBroken: state.isLineBroken || isLineBroken,
  };

  return {
    lineOutDelta,
    newState,
    tensionRatio,
    dangerLevel,
    fishFatigueDelta,
  };
}

/**
 * 릴링 가능 여부 판단
 * 장력 비율이 0.90 이상이면 줄이 거의 끊어질 직전이므로 릴링이 락업(잠김)됨
 */
export function canReel(state: LineState, line: LineSpec): boolean {
  const ratio = getLineTensionRatio(state, line);
  return ratio < 0.90;
}

/**
 * 어종 및 줄 정보에 따른 권장 드랙값 반환
 */
export function getRecommendedDragKg(lineStrengthLb: number): number {
  const lineStrengthKg = lineStrengthLb * 0.453592;
  return lineStrengthKg * 0.33; // 보편적인 낚시 룰: 줄 강도의 1/3
}

/**
 * 줄 강도 대비 현재 장력의 위험도 레벨 반환
 */
export function getTensionDangerLevel(tensionRatio: number): 'safe' | 'warning' | 'critical' | 'broken' {
  if (tensionRatio >= 1.0) return 'broken';
  if (tensionRatio >= 0.85) return 'critical';
  if (tensionRatio >= 0.6) return 'warning';
  return 'safe';
}

/**
 * 캐스팅 시 줄 내어주기
 */
export function castLineOut(state: LineState, distanceM: number): LineState {
  return {
    ...state,
    lineLengthOutM: distanceM,
  };
}

/**
 * 초당 감기 속도 계산
 */
export function getRetrieveSpeedMps(reel: ReelSpec, cranksPerSecond: number = 1): number {
  return (reel.retrievePerCrank * cranksPerSecond) / 100; // cm -> m
}
