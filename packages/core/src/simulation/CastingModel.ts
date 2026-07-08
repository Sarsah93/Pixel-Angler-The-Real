/**
 * @file CastingModel.ts
 * @description 캐스팅 거리/정확도 연산 모델
 */

import type { RodSpec, ReelSpec, LineSpec } from '../types/Gear.js';
import type { WeatherData } from '../types/Environment.js';

export interface CastInput {
  rod: RodSpec;
  reel: ReelSpec;
  mainLine: LineSpec;
  /** 봉돌/지그 무게 (g) */
  sinkerG: number;
  /** 파워 (0.0~1.0) */
  power: number;
  /** 각도 (도, 0=수평, 45=최적) */
  angleDeg: number;
  weather: WeatherData;
  /** 플레이어 숙련도 레벨 */
  playerLevel?: number;
}

export interface CastResult {
  distanceM: number;
  accuracyErrorM: number;
  landedInWater: boolean;
  windDriftM: number;
}

const GRAVITY = 9.81;

/** 이상적인 캐스팅 거리 계산 (물리 근사) */
function getIdealDistance(input: CastInput): number {
  // 초속 = 파워 × 대 길이 × 0.5 계수
  const velocity = input.power * input.rod.lengthM * 8;
  const angleRad = (input.angleDeg * Math.PI) / 180;

  // 투사체 운동: d = v² × sin(2θ) / g
  const rawDistance = (velocity * velocity * Math.sin(2 * angleRad)) / GRAVITY;

  // 봉돌 무게 보정 — 가벼울수록 짧게 날아감
  const weightFactor = Math.min(1.0, input.sinkerG / 30);

  // 플레이어 숙련도 비거리 보정 (레벨당 1%씩 증가, 최대 20% 증가)
  const levelBonus = 1.0 + Math.min(0.2, (input.playerLevel ?? 1) * 0.01);

  return rawDistance * weightFactor * levelBonus;
}

/** 바람의 영향으로 인한 오차 계산 */
function getWindDrift(weather: WeatherData, distanceM: number): number {
  const windEffect = weather.windSpeedMs * 0.05 * distanceM;
  return (Math.random() - 0.5) * 2 * windEffect;
}

/**
 * 캐스팅 결과 계산
 */
export function calculateCast(input: CastInput): CastResult {
  const idealDistance = getIdealDistance(input);

  // 최대 드랙 미설정 원줄에 의한 저항 (PE줄이 나일론보다 멀리 날아감)
  const lineResistance = input.mainLine.material === 'pe_braid' ? 0.9 : 0.7;
  const distanceM = idealDistance * lineResistance;

  // 플레이어 레벨에 따른 정확도 보정 (레벨당 오차 및 바람 영향 1.5%씩 감소, 최대 50%까지 감소)
  const accuracyLevelBonus = Math.max(0.5, 1.0 - (input.playerLevel ?? 1) * 0.015);

  // 정확도 오차 (파워가 낮을수록, 바람이 강할수록 오차 증가)
  const baseError = (1.0 - input.power) * 3 * accuracyLevelBonus;
  const windDriftM = getWindDrift(input.weather, distanceM) * accuracyLevelBonus;
  const accuracyErrorM = baseError + Math.abs(windDriftM) * 0.3;

  return {
    distanceM: Math.max(0, distanceM),
    accuracyErrorM,
    landedInWater: accuracyErrorM < 5, // 5m 이하 오차면 수면에 랜딩
    windDriftM,
  };
}
