/**
 * @file NightHuntingEngine.ts
 * @description 해루질 시뮬레이션 엔진
 *
 * 해루질 성공 확률, 발견 가능 생물, 채취 효율 계산.
 * 시간대, 조위, 집어등 밝기, 날씨를 종합 고려합니다.
 */

import type { ShoreHuntingGear, ShoreHarvestItem, ShoreHuntingResult } from '../types/Activities.js';
import type { TideInfo, WeatherData } from '../types/Environment.js';
import { SHORE_CREATURE_DATABASE, type ShoreCreature } from '../db-schema/ShoreCreatureDatabase.js';
import type { SpotType } from '../types/Environment.js';

// ─────────────────────────────────────────────
// 해루질 입력 컨텍스트
// ─────────────────────────────────────────────

export interface NightHuntingContext {
  /** 현재 스팟 타입 */
  spotType: SpotType;
  /** 해루질 시작 시각 (0~23) */
  hourOfDay: number;
  /** 현재 물때 정보 */
  tide: TideInfo;
  /** 현재 날씨 */
  weather: WeatherData;
  /** 장착된 해루질 장비 */
  gear: ShoreHuntingGear;
  /** 탐색 시간 (분) */
  huntingDurationMinutes: number;
  /** 현재 월 (1~12) */
  month: number;
  /** 심화 라이선스 보유 여부 */
  hasAdvancedLicense: boolean;
}

// ─────────────────────────────────────────────
// 핵심 계산 함수
// ─────────────────────────────────────────────

/**
 * 해루질 가능 여부 판단
 * - 야간 (20:00~05:00) 권장
 * - 조위가 낮은 시간대 (간조 전후) 최적
 * - 강풍/폭우 시 위험 판정
 */
export function canPerformNightHunting(context: NightHuntingContext): {
  allowed: boolean;
  warning?: string;
  danger?: string;
} {
  const { hourOfDay, weather, tide } = context;

  // 날씨 위험 체크
  if (weather.windSpeedMs > 12) {
    return {
      allowed: false,
      danger: '풍속이 너무 강합니다 (12m/s 초과). 해루질 위험 상태입니다.',
    };
  }
  if (weather.waveHeightM > 1.5) {
    return {
      allowed: false,
      danger: '파고가 너무 높습니다. 갯바위/조간대 접근 위험.',
    };
  }

  // 야간 여부 (최적 시간)
  const isNight = hourOfDay >= 20 || hourOfDay <= 5;
  if (!isNight) {
    return {
      allowed: true,
      warning: '낮 시간 해루질은 효율이 낮습니다. 야간(오후 8시~오전 5시)을 권장합니다.',
    };
  }

  // 조위 체크 (간조 전후가 최적)
  if (tide.currentWaterLevelCm > tide.highTideHeightCm * 0.7) {
    return {
      allowed: true,
      warning: '조위가 높습니다. 썰물 시작 후 (간조 전 2시간~간조 후 1시간)가 최적입니다.',
    };
  }

  return { allowed: true };
}

/**
 * 해루질 가능 생물 목록 필터링
 * - 스팟 타입, 시간대, 금어기, 라이선스 레벨 고려
 */
export function getHuntableCreatures(
  context: NightHuntingContext
): ShoreCreature[] {
  const { spotType, hourOfDay, month, hasAdvancedLicense, gear } = context;
  const isNight = hourOfDay >= 20 || hourOfDay <= 5;

  return SHORE_CREATURE_DATABASE.filter((creature) => {
    // 스팟 타입 일치
    if (!creature.habitatSpotTypes.includes(spotType)) return false;

    // 금어기 체크
    if (creature.closedSeasonMonths.includes(month)) return false;

    // 시간대 체크
    if (creature.discoveryTime === 'night' && !isNight) return false;

    // 라이선스 체크
    if (creature.requiredLicense === 'shore_hunting_advanced' && !hasAdvancedLicense) return false;

    // 집어등 밝기 체크
    if (creature.minLampLumens > 0 && (!gear.lamp || gear.lamp.lumens < creature.minLampLumens)) {
      return false;
    }

    return true;
  });
}

/**
 * 단일 탐색 시도 결과 계산
 * @returns 발견한 생물 (없으면 null)
 */
export function attemptHunt(
  creature: ShoreCreature,
  context: NightHuntingContext
): ShoreHarvestItem | null {
  const { hourOfDay, tide, weather, gear } = context;
  const isNight = hourOfDay >= 20 || hourOfDay <= 5;

  // 기본 발견 확률 (%)
  let discoveryChance = 40;

  // 야간 보너스
  if (creature.discoveryTime === 'night' && isNight) discoveryChance += 30;

  // 집어등 밝기 보너스
  if (gear.lamp) {
    const lampBonus = Math.min(20, Math.floor(gear.lamp.lumens / 200));
    discoveryChance += lampBonus;
  }

  // 조위 보너스 (간조 시 더 많이 노출)
  const tideRatio = tide.currentWaterLevelCm / tide.highTideHeightCm;
  if (tideRatio < 0.3) {
    discoveryChance += 20; // 간조 근처
  } else if (tideRatio < 0.5) {
    discoveryChance += 10;
  }

  // 날씨 페널티
  if (weather.windSpeedMs > 8) discoveryChance -= 10;

  // 희귀 생물 페널티
  if (['haliotis_discus', 'octopus_vulgaris', 'octopus_minor'].includes(creature.id)) {
    discoveryChance -= 20;
  }

  discoveryChance = Math.max(5, Math.min(90, discoveryChance));

  if (Math.random() * 100 > discoveryChance) return null;

  // 크기 계산
  const sizeDescCm = creature.minLegalSizeCm > 0
    ? creature.minLegalSizeCm + Math.random() * (creature.minLegalSizeCm * 1.5)
    : 5 + Math.random() * 15;

  const isUndersized = creature.minLegalSizeCm > 0 && sizeDescCm < creature.minLegalSizeCm;

  // 무게/개수 계산
  const countOrWeightG = isUndersized
    ? sizeDescCm * 8  // 미달 크기는 가벼움
    : sizeDescCm * 12 + Math.random() * sizeDescCm * 10;

  return {
    creatureId: creature.id,
    nameKo: creature.nameKo,
    category: creature.category,
    countOrWeightG: Math.round(countOrWeightG),
    isUndersized,
    sizeDescCm: Math.round(sizeDescCm * 10) / 10,
    marketValuePerKg: creature.marketValuePerKg,
  };
}

/**
 * 해루질 세션 전체 시뮬레이션
 * 지정 시간 동안 탐색하여 수확물 목록 반환
 */
export function simulateNightHuntingSession(
  context: NightHuntingContext
): ShoreHuntingResult {
  const { huntingDurationMinutes } = context;
  const huntableCreatures = getHuntableCreatures(context);
  const harvestedItems: ShoreHarvestItem[] = [];
  const harvestedCountMap: Record<string, number> = {};

  // 탐색 횟수 (5분마다 1번 시도)
  const attempts = Math.floor(huntingDurationMinutes / 5);
  let violationWarning = false;

  for (let i = 0; i < attempts; i++) {
    // 랜덤으로 생물 선택
    const creature = huntableCreatures[Math.floor(Math.random() * huntableCreatures.length)];
    if (!creature) continue;

    const result = attemptHunt(creature, context);
    if (!result) continue;

    if (result.isUndersized) {
      violationWarning = true; // 방류 권고 표시
      continue; // 미달 크기는 방류
    }

    // 일일 채취 제한 체크
    if (creature.dailyLimitG > 0) {
      const currentTotal = harvestedCountMap[creature.id] ?? 0;
      if (currentTotal >= creature.dailyLimitG) continue;
      harvestedCountMap[creature.id] = currentTotal + result.countOrWeightG;
    }

    harvestedItems.push(result);
  }

  // 총 가치 계산
  const totalValueEstimate = harvestedItems.reduce((sum, item) => {
    return sum + (item.countOrWeightG / 1000) * item.marketValuePerKg;
  }, 0);

  // 피로도 계산 (시간에 비례)
  const fatigue = Math.min(1.0, huntingDurationMinutes / 180);

  return {
    durationMinutes: huntingDurationMinutes,
    harvestedItems,
    totalValueEstimate: Math.round(totalValueEstimate),
    violationWarning,
    fatigue,
  };
}
