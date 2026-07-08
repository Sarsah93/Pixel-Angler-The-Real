/**
 * @file TacklePhysicsEngine.ts
 * @description 채비 침강 속도, 조류 흐름(드리프트) 시뮬레이션 및 파이팅 돌발 사건 연산 엔진
 */

import type { HydroGrid, FightIncident } from '../types/Hydrodynamics.js';
import type { TackleSetup } from '../types/Gear.js';
import { getWaterStateAt } from './HydroDynamicsEngine.js';

/**
 * 봉돌 무게와 채비 스펙에 따른 미끼의 침강 연산 결과를 구합니다.
 * 
 * @param tackle            - 장착된 채비 세팅
 * @param elapsedSeconds    - 캐스팅 착수 후 흐른 시간 (초)
 * @param localWaterDepth   - 착수 타일의 실제 수심 (m)
 * @returns 현재 미끼가 내려앉은 수심 (m)
 */
export function calculateSinkingDepth(
  tackle: TackleSetup,
  elapsedSeconds: number,
  localWaterDepth: number
): number {
  // 채비에 장착된 찌밑 수심 (depthCm). 없으면 기본 3m로 가정
  const targetBaitDepth = (tackle.depthCm ?? 300) / 100; // cm -> m 변환
  
  // 봉돌 무게 (g). 없으면 바늘 및 미끼 자체 침강 무게 약 0.5g으로 연산
  const sinkerWeight = tackle.sinkerG ?? 0.5;

  // 침강 물리 공식 근사 (봉돌 무게의 제곱근 비례 침강 속도 m/s)
  const sinkVelocity = Math.sqrt(sinkerWeight) * 0.45;

  // 경과 시간에 다른 미끼 낙하 깊이
  const currentSunk = elapsedSeconds * sinkVelocity;

  // 실제 바닥 깊이 및 설정한 찌밑수심 한계에 클리핑
  return Math.min(targetBaitDepth, currentSunk, localWaterDepth);
}

/**
 * 매 프레임 조류 벡터의 힘을 받아 찌와 미끼의 월드 픽셀 위치를 갱신합니다.
 * 
 * @param grid     - 수중 역학 격자 맵
 * @param currentX - 현재 찌 X 픽셀 좌표 (0 ~ 2048)
 * @param currentY - 현재 찌 Y 픽셀 좌표 (0 ~ 1536)
 * @param dt       - 갱신 시간 간격 (초 단위, e.g. 0.016)
 * @returns 갱신된 X, Y 픽셀 좌표 및 화면 이탈 여부
 */
export function updateBaitDrift(
  grid: HydroGrid,
  currentX: number,
  currentY: number,
  dt: number
): { x: number; y: number; isOutOfBounds: boolean } {
  const waterState = getWaterStateAt(grid, currentX, currentY);

  // 1m = 16픽셀 스케일 배율 적용
  const scale = 16.0;

  // 조류 벡터에 힘을 받아 좌표 이동
  const nextX = currentX + waterState.currentVector.x * dt * scale;
  const nextY = currentY + waterState.currentVector.y * dt * scale;

  // 2D 월드 경계면(2048x1536) 및 지형 수역 이탈 체크
  const isOutOfBounds = 
    nextX < 20 || 
    nextX > 2028 || 
    nextY < 20 || 
    nextY > 1516 || 
    waterState.depth <= 0.2; // 육지로 흘러갔을 경우도 이탈 판정

  return {
    x: nextX,
    y: nextY,
    isOutOfBounds,
  };
}

/**
 * 어종별 고증 유영층 레이어(상층/중층/하층)와 미끼의 도달 수심 간의 매칭률(0.0 ~ 1.0)을 계산합니다.
 * 
 * @param speciesId - 대상 어종 ID
 * @param baitDepth - 현재 미끼 수심 (m)
 * @param totalDepth - 착수 지점의 전체 바닥 수심 (m)
 */
export function getBaitDepthAffinity(
  speciesId: string,
  baitDepth: number,
  totalDepth: number
): number {
  // 상층형: 부시리(yellowtail), 학꽁치
  // 중층형: 벵에돔(largescale_blackfish)
  // 하층형: 감성돔(black_seabream), 참돔, 광어, 우럭
  let preferredMin = 0;
  let preferredMax = 0;

  if (speciesId === 'yellowtail' || speciesId === 'japanese_amberjack') {
    // 부시리/방어류: 상층 유영 (0m ~ 4m)
    preferredMin = 0;
    preferredMax = 4.0;
  } else if (speciesId === 'largescale_blackfish') {
    // 벵에돔: 대표적인 중상층 피어오르는 어종 (2m ~ 7m)
    preferredMin = 2.0;
    preferredMax = 7.0;
  } else {
    // 감성돔 및 광어/우럭 바닥층 생물: 바닥으로부터 2m 이내 수역
    preferredMin = Math.max(0, totalDepth - 2.5);
    preferredMax = totalDepth;
  }

  // 범위를 벗어났을 시 거리에 따른 지수식 감쇄 적용
  if (baitDepth >= preferredMin && baitDepth <= preferredMax) {
    return 1.0;
  }

  const distance = baitDepth < preferredMin ? preferredMin - baitDepth : baitDepth - preferredMax;
  
  // 1.5m 멀어질 때마다 확률 70%씩 감쇄
  return Math.max(0.01, Math.exp(-distance / 1.5));
}

/**
 * 낚시 파이팅 상황 중에 발생하는 밑걸림, 여 쓸림, 바늘털이 등의 돌발 사고 리스크를 실시간 계산합니다.
 * 
 * @param grid             - 수중 격자 맵
 * @param worldX           - 찌 월드 X 좌표
 * @param worldY           - 찌 월드 Y 좌표
 * @param baitDepth        - 현재 미끼 수심 (m)
 * @param fishSpeciesId    - 걸린 대상어 ID (바늘털이 기질 판별용)
 * @param lineTensionRatio - 낚싯줄 장력 비율 (0.0 ~ 1.0)
 * @param fishStamina      - 대상어의 남은 체력 비율 (0.0 ~ 1.0)
 */
export function evaluateFightIncidents(
  grid: HydroGrid,
  worldX: number,
  worldY: number,
  baitDepth: number,
  fishSpeciesId: string,
  lineTensionRatio: number,
  fishStamina: number
): FightIncident {
  const water = getWaterStateAt(grid, worldX, worldY);

  // 1. 밑걸림 연산 (Bait가 실제 바닥 수심의 96% 이상 내려앉았을 때 지형별 확률)
  let snagChance = 0;
  const isAtBottom = baitDepth >= water.depth * 0.96;
  if (isAtBottom) {
    if (water.bottomType === 'reef') {
      snagChance = 0.08; // 여밭 바닥에서는 8%의 매 초당 밑걸림 확률
    } else if (water.bottomType === 'gravel') {
      snagChance = 0.03; // 자갈 바닥 3%
    }
  }

  // 2. 바늘털이 연산 (대상어가 농어/부시리일 때 텐션을 너무 늦추면 털고 탈출)
  let hookShakeChance = 0;
  const isShakingSpecies = ['yellowtail', 'japanese_amberjack', 'seabass'].includes(fishSpeciesId);
  if (isShakingSpecies && lineTensionRatio < 0.15 && fishStamina > 0.2) {
    // 텐션이 15% 이하로 낮아져 느슨하면 매 초당 15% 바늘털이 확률 발생
    hookShakeChance = 0.15;
  }

  // 3. 여 쓸림 연산 (대물이 힘을 쓰며 수중여로 처박을 때 발생하는 라인 쓸림 누적 지수)
  let reefFriction = 0;
  if (water.bottomType === 'reef' && fishStamina > 0.3) {
    // 물고기가 힘이 많이 남았고 바닥이 수중여밭이면 장력 강도와 비례하여 쓸림 수치 증가
    reefFriction = 0.12 * fishStamina * lineTensionRatio;
  }

  return {
    snagChance,
    hookShakeChance,
    reefFriction,
  };
}
