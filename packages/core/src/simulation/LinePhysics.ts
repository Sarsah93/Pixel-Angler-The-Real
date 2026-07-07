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
 * 물고기 파이팅 중 라인 장력 업데이트
 * @param state 현재 라인 상태
 * @param fishPullKg 물고기가 당기는 힘 (kg)
 * @param reel 릴 스펙
 * @param line 원줄 스펙
 * @returns 업데이트된 라인 상태
 */
export function updateLineTension(
  state: LineState,
  fishPullKg: number,
  reel: ReelSpec,
  line: LineSpec,
): LineState {
  const effectiveDrag = getEffectiveDragKg(reel, state.dragRatio);
  const lineStrengthKg = line.strengthLb * 0.453592;

  // 드랙이 물고기 당기는 힘보다 강하면 드랙이 작동 안 함
  const tensionBeforeDrag = Math.max(0, fishPullKg - effectiveDrag);

  // 실제 장력 = 남은 당기는 힘 (드랙 제외 후)
  const newTension = tensionBeforeDrag;

  // 줄 터짐 판정: 장력이 줄 강도의 120% 초과 시 (순간 충격 고려)
  const isLineBroken = newTension > lineStrengthKg * 1.2;

  return {
    ...state,
    currentTensionKg: newTension,
    isLineBroken,
  };
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
 * 초당 감기 속도 계산
 */
export function getRetrieveSpeedMps(reel: ReelSpec, cranksPerSecond: number = 1): number {
  return (reel.retrievePerCrank * cranksPerSecond) / 100; // cm -> m
}
