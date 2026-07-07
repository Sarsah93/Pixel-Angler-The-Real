/**
 * @file TrapSystem.ts
 * @description 통발 시스템 시뮬레이션 엔진
 *
 * 통발 설치/수거 로직, 시간 경과에 따른 포획 계산,
 * 분실/손상 확률, 미끼 소모 연산.
 */

import type { DeployedTrap, TrapHarvestResult, TrapCatchItem } from '../types/Activities.js';
import { getTrapById } from '../db-schema/TrapDatabase.js';
import { SHORE_CREATURE_DATABASE } from '../db-schema/ShoreCreatureDatabase.js';
import type { SpotType } from '../types/Environment.js';
import type { TideInfo } from '../types/Environment.js';

// ─────────────────────────────────────────────
// 통발 설치 컨텍스트
// ─────────────────────────────────────────────

export interface TrapDeploymentContext {
  spotType: SpotType;
  depthM: number;
  tide: TideInfo;
  /** 현재 월 */
  month: number;
  /** 해류 강도 (0.0~1.0) */
  currentStrength: number;
}

// ─────────────────────────────────────────────
// 통발 수거 계산
// ─────────────────────────────────────────────

/**
 * 통발 수거 시 포획물 계산
 * @param trap 배치된 통발 상태
 * @param context 현재 환경 컨텍스트
 * @returns 수거 결과
 */
export function harvestTrap(
  trap: DeployedTrap,
  context: TrapDeploymentContext
): TrapHarvestResult {
  const spec = getTrapById(trap.trapSpecId);
  if (!spec) {
    return {
      trapInstanceId: trap.instanceId,
      soakTimeHours: 0,
      items: [],
      totalValueEstimate: 0,
      baitConsumed: false,
      durabilityLost: 0,
    };
  }

  const now = new Date();
  const soakTimeMs = now.getTime() - trap.deployedAt.getTime();
  const soakTimeHours = soakTimeMs / (1000 * 60 * 60);

  // 미끼 소모 계산
  const baitConsumed = soakTimeHours >= spec.baitDurationHours;

  // 포획물 계산
  const items = calculateTrapCatch(trap, context, soakTimeHours);

  // 내구도 손실 (시간 + 해류에 비례)
  const durabilityLost = Math.round(
    (soakTimeHours / 24) * 5 + context.currentStrength * 10
  );

  // 총 가치
  const totalValueEstimate = items.reduce((sum, item) => {
    const creature = SHORE_CREATURE_DATABASE.find((c) => c.id === item.creatureId);
    if (!creature) return sum;
    return sum + (item.countOrWeightG / 1000) * creature.marketValuePerKg;
  }, 0);

  return {
    trapInstanceId: trap.instanceId,
    soakTimeHours: Math.round(soakTimeHours * 10) / 10,
    items,
    totalValueEstimate: Math.round(totalValueEstimate),
    baitConsumed,
    durabilityLost,
  };
}

/**
 * 침지 시간과 환경에 따라 포획물 계산
 */
function calculateTrapCatch(
  trap: DeployedTrap,
  context: TrapDeploymentContext,
  soakTimeHours: number
): TrapCatchItem[] {
  const spec = getTrapById(trap.trapSpecId);
  if (!spec) return [];

  const items: TrapCatchItem[] = [];
  let totalWeightG = 0;

  // 목표 생물 중 해당 스팟/계절에 맞는 것 필터
  const eligibleCreatures = SHORE_CREATURE_DATABASE.filter((creature) => {
    if (!spec.targetCategories.includes(creature.category)) return false;
    if (!creature.habitatSpotTypes.includes(context.spotType)) return false;
    if (creature.closedSeasonMonths.includes(context.month)) return false;
    return true;
  });

  if (eligibleCreatures.length === 0) return [];

  // 침지 시간에 따른 포획 시도 횟수
  // 최적 침지 시간 = 8~12시간, 그 이후는 효율 감소
  const optimalHours = spec.baitDurationHours;
  const efficiencyRatio = soakTimeHours <= optimalHours
    ? soakTimeHours / optimalHours
    : 1.0 - (soakTimeHours - optimalHours) / (optimalHours * 2);
  const adjustedEfficiency = Math.max(0.1, Math.min(1.0, efficiencyRatio));

  const maxAttempts = Math.round(10 * adjustedEfficiency);

  for (let i = 0; i < maxAttempts; i++) {
    const creature = eligibleCreatures[Math.floor(Math.random() * eligibleCreatures.length)];
    if (!creature) continue;

    // 기본 진입 확률
    let entryChance = 50;
    // 조류 강도 - 게/새우는 조류 따라 이동하므로 강할수록 유리
    if (['crustacean'].includes(creature.category)) {
      entryChance += context.currentStrength * 20;
    }
    // 두족류는 조류 약할 때 유리
    if (['cephalopod'].includes(creature.category)) {
      entryChance += (1 - context.currentStrength) * 15;
    }

    if (Math.random() * 100 > entryChance) continue;

    // 크기/무게 계산
    const minSize = creature.minLegalSizeCm || 5;
    const sizeDescCm = minSize + Math.random() * minSize * 1.5;
    const weightG = Math.round(sizeDescCm * 15 + Math.random() * sizeDescCm * 20);

    // 용량 초과 체크
    if (totalWeightG + weightG > spec.maxCapacityG) break;
    totalWeightG += weightG;

    // 기존 항목과 합산
    const existing = items.find((i) => i.creatureId === creature.id);
    if (existing) {
      existing.countOrWeightG += weightG;
    } else {
      items.push({
        creatureId: creature.id,
        nameKo: creature.nameKo,
        countOrWeightG: weightG,
        enteredAt: new Date(Date.now() - Math.random() * soakTimeHours * 3600000),
      });
    }
  }

  return items;
}

/**
 * 통발 분실/손상 확률 계산
 * - 조류 강도, 설치 시간, 장비 내구도를 고려
 */
export function calculateTrapLossRisk(
  trap: DeployedTrap,
  currentStrength: number,
  soakTimeHours: number
): number {
  const spec = getTrapById(trap.trapSpecId);
  if (!spec) return 0;

  let risk = 0;

  // 오래 침지할수록 분실 위험 증가
  risk += soakTimeHours / 100;

  // 강한 조류
  risk += currentStrength * 0.1;

  // 내구도 낮을수록 위험
  const durabilityRatio = trap.isLostOrDamaged ? 1 : spec.durability / spec.maxDurability;
  risk += (1 - durabilityRatio) * 0.15;

  return Math.min(0.5, risk);
}

/**
 * 통발 설치 가능 여부 검증
 */
export function validateTrapDeployment(
  trapSpecId: string,
  context: TrapDeploymentContext,
  existingTrapCount: number,
  hasCommercialLicense: boolean
): { valid: boolean; reason?: string } {
  const spec = getTrapById(trapSpecId);
  if (!spec) return { valid: false, reason: '유효하지 않은 통발입니다.' };

  // 수심 체크
  if (context.depthM > spec.maxDepthM) {
    return {
      valid: false,
      reason: `이 통발의 최대 수심(${spec.maxDepthM}m)을 초과합니다.`,
    };
  }

  // 통발 개수 제한 (상업 면허 없으면 최대 3개)
  const maxTraps = hasCommercialLicense ? 30 : 3;
  if (existingTrapCount >= maxTraps) {
    return {
      valid: false,
      reason: `통발 설치 최대 개수(${maxTraps}개)에 도달했습니다.${!hasCommercialLicense ? ' 상업용 통발 면허를 취득하면 최대 30개까지 설치 가능합니다.' : ''}`,
    };
  }

  return { valid: true };
}

/**
 * 다음 수거 예상 시간 계산 (최적 침지 시간 기준)
 */
export function getNextOptimalHarvestTime(trap: DeployedTrap): Date {
  const spec = getTrapById(trap.trapSpecId);
  if (!spec) return new Date();

  const optimalMs = spec.baitDurationHours * 60 * 60 * 1000;
  return new Date(trap.deployedAt.getTime() + optimalMs);
}
