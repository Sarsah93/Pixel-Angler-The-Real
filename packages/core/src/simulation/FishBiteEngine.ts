/**
 * @file FishBiteEngine.ts
 * @description 물고기 입질 확률 연산 엔진
 *
 * 입질 확률은 다음 요소들의 가중 합산으로 계산됩니다:
 * 1. 물때 (조류 세기)
 * 2. 수온 (어종별 적정 수온)
 * 3. 시간대 (야행성 여부, 일출/일몰 피크)
 * 4. 미끼 적합도 (어종-미끼 매칭)
 * 5. 채비 적합도 (리그 타입 매칭)
 * 6. 날씨 (파고, 기상)
 * 7. 포인트 보너스
 */

import type { TackleSetup, BaitCategory, RigType } from '../types/Gear.js';
import type { FishingEnvironment, TideInfo, SpotType } from '../types/Environment.js';
import type { FishingPoint } from '../types/Fishing.js';
import type { FishSpecies } from '../db-schema/FishDatabase.js';
import { getBehaviorProfile, interpolateTempActivity, isClosedSeason } from '../db-schema/FishBehaviorDatabase.js';
import type { FishBehaviorProfile } from '../db-schema/FishBehaviorDatabase.js';

// ─────────────────────────────────────────────
// 입질 계산 결과
// ─────────────────────────────────────────────
export interface BiteCalculationResult {
  /** 초당 입질 확률 (0.0~1.0) */
  biteChancePerSecond: number;
  /** 입질 발생 시 예상 어종 후보 (확률 가중치 포함) */
  fishCandidates: Array<{ species: FishSpecies; weight: number }>;
  /** 계산에 사용된 각 요소 점수 (디버그/UI 표시용) */
  factors: BiteFactors;
}

export interface BiteFactors {
  tideScore: number;       // 물때 점수 (0.0~1.0)
  tempScore: number;       // 수온 점수 (0.0~1.0)
  timeScore: number;       // 시간대 점수 (0.0~1.0)
  baitScore: number;       // 미끼 점수 (0.0~1.0)
  weatherScore: number;    // 날씨 점수 (0.0~1.0)
  pointBonus: number;      // 포인트 보너스 배수
  totalScore: number;      // 종합 점수 (0.0~1.0)
}

// ─────────────────────────────────────────────
// 미끼-어종 매칭 테이블
// ─────────────────────────────────────────────
const BAIT_SPECIES_AFFINITY: Record<string, BaitCategory[]> = {
  black_seabream: ['crab', 'mussel', 'barnacle', 'sandworm', 'earthworm'],
  largescale_blackfish: ['bread', 'sandworm', 'mussel', 'barnacle'],
  black_rockfish: ['sandworm', 'prawn', 'artificial_worm'],
  hairtail: ['sandworm', 'squid', 'fish_strip', 'artificial_lure'],
  yellowtail: ['artificial_lure', 'squid', 'fish_strip'],
  japanese_amberjack: ['artificial_lure', 'fish_strip'],
  korean_rockfish: ['sandworm', 'prawn', 'fish_strip', 'artificial_worm'],
  yellow_rockfish: ['sandworm', 'prawn', 'artificial_worm'],
  red_snapper_rockfish: ['fish_strip', 'sandworm', 'squid'],
  night_seabream: ['sandworm', 'prawn', 'crab', 'mussel'],
};

/** 미끼-어종 친화도 계산 (0.0~1.0) */
function getBaitAffinity(speciesId: string, baitCategory: BaitCategory): number {
  const preferred = BAIT_SPECIES_AFFINITY[speciesId];
  if (!preferred) return 0.3; // 알 수 없는 어종은 기본값
  const idx = preferred.indexOf(baitCategory);
  if (idx === -1) return 0.1;
  return 1.0 - (idx / preferred.length) * 0.7; // 첫 번째 미끼가 가장 높은 점수
}

/** 계절 활성도 및 영등철(2~3월) 저수온기 보정 */
function getSeasonScore(profile: FishBehaviorProfile, currentTime: Date): number {
  const month = currentTime.getMonth() + 1; // 1~12
  let season: 'spring' | 'summer' | 'autumn' | 'winter';
  if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else if (month >= 9 && month <= 11) season = 'autumn';
  else season = 'winter';

  let score = profile.seasonActivity[season];

  // 영등철 저수온 극복 보정 (2~3월)
  if (month === 2 || month === 3) {
    if (
      profile.speciesId === 'black_rockfish' ||
      profile.speciesId === 'korean_rockfish' ||
      profile.speciesId === 'yellow_rockfish' ||
      profile.speciesId === 'red_snapper_rockfish'
    ) {
      score = Math.min(1.0, score * 1.15); // 볼락류는 영등철에 강세
    } else if (profile.speciesId === 'largescale_blackfish') {
      score = score * 0.4;  // 벵에돔은 저수온 패널티가 매우 큼
    } else if (profile.speciesId === 'black_seabream') {
      score = score * 0.85; // 감성돔은 영등철 깊은 수중여 공략으로 소폭 감점 후 유효
    }
  }
  return score;
}

/** 만조/간조 정밀 윈도우 타이밍 매칭 계산 */
function getTideTimingScore(profile: FishBehaviorProfile, currentTime: Date, tide: TideInfo): number {
  const currentMs = currentTime.getTime();

  let minHighDiffMin = Infinity;
  if (tide.highTideTimes && tide.highTideTimes.length > 0) {
    for (const t of tide.highTideTimes) {
      const diffMin = (currentMs - new Date(t).getTime()) / 60000;
      if (Math.abs(diffMin) < Math.abs(minHighDiffMin)) {
        minHighDiffMin = diffMin;
      }
    }
  }

  let minLowDiffMin = Infinity;
  if (tide.lowTideTimes && tide.lowTideTimes.length > 0) {
    for (const t of tide.lowTideTimes) {
      const diffMin = (currentMs - new Date(t).getTime()) / 60000;
      if (Math.abs(diffMin) < Math.abs(minLowDiffMin)) {
        minLowDiffMin = diffMin;
      }
    }
  }

  let highWindowScore = 0;
  if (minHighDiffMin !== Infinity) {
    const [before, after] = profile.highTideWindow;
    if (minHighDiffMin >= before && minHighDiffMin <= after) {
      highWindowScore = 1.0;
    } else {
      // 윈도우 경계를 벗어난 거리에 따라 감쇄
      const dist = minHighDiffMin < before ? before - minHighDiffMin : minHighDiffMin - after;
      highWindowScore = Math.max(0.15, 1.0 - dist / 90);
    }
  }

  let lowWindowScore = 0;
  if (minLowDiffMin !== Infinity) {
    const [before, after] = profile.lowTideWindow;
    if (minLowDiffMin >= before && minLowDiffMin <= after) {
      lowWindowScore = 1.0;
    } else {
      const dist = minLowDiffMin < before ? before - minLowDiffMin : minLowDiffMin - after;
      lowWindowScore = Math.max(0.1, 1.0 - dist / 90);
    }
  }

  let timingScore = Math.max(highWindowScore, lowWindowScore);

  // 물때 세기 구간 적합도 가중치
  const [minStrength, maxStrength] = profile.optimalTideStrength;
  if (tide.currentStrength >= minStrength && tide.currentStrength <= maxStrength) {
    timingScore *= 1.25; // 최적 구간일 때 가산
  } else {
    const dist = tide.currentStrength < minStrength ? minStrength - tide.currentStrength : tide.currentStrength - maxStrength;
    timingScore *= Math.max(0.4, 1.0 - dist * 2);
  }

  return Math.min(1.0, timingScore);
}

/** 채비 유형별 반응 보너스 매핑 */
function getRigBonus(profile: FishBehaviorProfile, rigType: RigType): number {
  if (rigType === 'full_float_flowing' || rigType === 'live_bait_float') {
    return profile.floatFishingBonus;
  }
  if (rigType === 'semi_float_flowing' || rigType === 'fixed_float' || rigType === 'sabiki') {
    return profile.semiFloatBonus;
  }
  if (rigType === 'surfcasting' || rigType === 'bottom_sinker') {
    return profile.bottomRigBonus;
  }
  if (rigType === 'jigging_metal' || rigType === 'jigging_spoon') {
    // 루어 반응도(lureSensitivity 0.0~1.0)를 배수(최대 1.8배)로 가공
    return 1.0 + profile.lureSensitivity * 0.8;
  }
  return 1.0;
}

/** 포인트 서식지 선호도 매치 */
function getHabitatScore(profile: FishBehaviorProfile, spotType: SpotType): number {
  if (profile.preferredHabitat.includes(spotType as any)) {
    return 1.25;
  }
  return 0.45;
}

/** 수온 적합도 계산 (기본 백업용) */
function getTempScore(species: FishSpecies, currentTempC: number): number {
  const [minT, maxT] = species.preferredTempC;
  if (currentTempC < minT - 5 || currentTempC > maxT + 5) return 0.0;
  if (currentTempC >= minT && currentTempC <= maxT) return 1.0;
  if (currentTempC < minT) return Math.max(0, 1.0 - (minT - currentTempC) / 5);
  return Math.max(0, 1.0 - (currentTempC - maxT) / 5);
}

/** 시간대 점수 계산 */
function getTimeScore(species: FishSpecies, currentTime: Date, isNighttime: boolean): number {
  const hour = currentTime.getHours();

  // 야행성 어종
  if (species.isNocturnal) {
    if (isNighttime) return 1.0 + species.nightBiteBonus / 100;
    if (hour >= 5 && hour <= 7) return 0.6;
    if (hour >= 18 && hour <= 20) return 0.7;
    return 0.2;
  }

  // 주행성 어종 — 일출 후 2~3시간 & 일몰 직전 피크
  if (hour >= 6 && hour <= 9) return 0.9;
  if (hour >= 15 && hour <= 18) return 0.85;
  if (hour >= 9 && hour <= 15) return 0.7;
  return 0.3;
}

/** 날씨 점수 계산 */
function getWeatherScore(env: FishingEnvironment): number {
  const { weather } = env;

  if (weather.weatherCondition === 'stormy') return 0.0;
  if (weather.waveHeightM > 2.0) return 0.1;
  if (weather.waveHeightM > 1.5) return 0.4;
  if (weather.weatherCondition === 'rainy') return 0.7;
  if (weather.weatherCondition === 'cloudy') return 0.85;
  if (weather.weatherCondition === 'clear') {
    const hour = env.currentTime.getHours();
    if (hour >= 10 && hour <= 15) return 0.6;
    return 0.8;
  }
  return 0.75;
}

// ─────────────────────────────────────────────
// 메인 입질 계산 함수 (V2)
// ─────────────────────────────────────────────

/**
 * 현재 환경과 채비를 바탕으로 입질 확률을 계산합니다.
 */
export function calculateBiteChance(
  possibleSpecies: FishSpecies[],
  tackle: TackleSetup,
  environment: FishingEnvironment,
  point: FishingPoint,
): BiteCalculationResult {
  const { tide, weather, currentTime, isNighttime } = environment;

  // 출조 불가 조건 체크
  if (!environment.isSafeForFishing) {
    return {
      biteChancePerSecond: 0,
      fishCandidates: [],
      factors: {
        tideScore: 0,
        tempScore: 0,
        timeScore: 0,
        baitScore: 0,
        weatherScore: 0,
        pointBonus: 0,
        totalScore: 0,
      },
    };
  }

  const weatherScore = getWeatherScore(environment);

  // 어종별 가중치 계산
  const fishCandidates = possibleSpecies.map((species) => {
    const profile = getBehaviorProfile(species.id);

    let tempScore = 0.5;
    let seasonScore = 0.5;
    let tideTimingScore = 0.5;
    let rigBonus = 1.0;
    let habitatScore = 0.8;
    let isClosed = false;

    if (profile) {
      // 1. 수온 커브 선형 보간
      tempScore = interpolateTempActivity(profile.tempActivityCurve, weather.seaSurfaceTempC);
      // 2. 계절성 및 영등철 계산
      seasonScore = getSeasonScore(profile, currentTime);
      // 3. 만조/간조 정밀 윈도우 타이밍 매칭
      tideTimingScore = getTideTimingScore(profile, currentTime, tide);
      // 4. 채비 적합도 보너스
      rigBonus = getRigBonus(profile, tackle.rigType);
      // 5. 서식지 선호 매칭
      habitatScore = getHabitatScore(profile, point.label.includes('갯벌') ? 'tidal_flat' : 'breakwater'); // 기본 타입 매핑
      // 6. 금어기 여부 체크
      isClosed = isClosedSeason(profile, currentTime);
    } else {
      // 프로파일이 없을 시 기존 헬퍼 및 백업 수치로 연산
      tempScore = getTempScore(species, weather.seaSurfaceTempC);
      seasonScore = species.peakSeasonMonths.includes(currentTime.getMonth() + 1) ? 1.0 : 0.4;
      tideTimingScore = tide.currentStrength;
      habitatScore = 1.0;
    }

    const timeScore = Math.min(1.0, getTimeScore(species, currentTime, isNighttime));

    // 미끼 친화도 및 신선도 상태 보정
    const baitScoreRaw = getBaitAffinity(species.id, tackle.bait.category);
    let baitScore = baitScoreRaw;
    if (tackle.bait.conditionState === 'spoiled') {
      baitScore = baitScoreRaw * 0.15; // 부패한 미끼는 85% 감점
    } else if (tackle.bait.conditionState === 'frozen') {
      baitScore = baitScoreRaw * 0.5;  // 얼어있는 냉동 미끼는 50% 감점
    } else if (tackle.bait.conditionState === 'live') {
      baitScore = baitScoreRaw * 1.25; // 살아있는 생미끼는 25% 가산
    }

    // 물때 어종별 기본 보너스
    let tideBonus = 1.0;
    if (species.activeTidePhases && species.activeTidePhases.length > 0) {
      tideBonus = species.activeTidePhases.includes(tide.tidePhase) ? 1.3 : 0.7;
    }

    // 금어기 패널티 적용 (금어기 시 입질 확률 90% 차감)
    const closedSeasonPenalty = isClosed ? 0.1 : 1.0;

    // 희귀도 가중치
    const rarityMultiplier: Record<string, number> = {
      common: 1.0,
      uncommon: 0.5,
      rare: 0.2,
      epic: 0.05,
      legendary: 0.01,
    };

    // 종합 가중 합산 점수 연산
    const score =
      ((tideTimingScore * 0.25 + tempScore * 0.2 + seasonScore * 0.15 + timeScore * 0.15 + baitScore * 0.15 + weatherScore * 0.1) *
        tideBonus *
        rigBonus *
        habitatScore *
        closedSeasonPenalty *
        rarityMultiplier[species.rarity]) *
      point.biteBonusMultiplier;

    return { species, weight: Math.max(0, score) };
  });

  const totalWeight = fishCandidates.reduce((sum, c) => sum + c.weight, 0);

  // 종합 점수 (초당 입질 확률로 변환)
  const totalScore = Math.min(1.0, totalWeight / Math.max(1, possibleSpecies.length));
  const baseBitePerSecond = 0.005; // 기본 5분 대기
  const biteChancePerSecond = baseBitePerSecond + totalScore * 0.035;

  const avgTempScore =
    possibleSpecies.length > 0
      ? possibleSpecies.reduce((s, sp) => {
          const prof = getBehaviorProfile(sp.id);
          return s + (prof ? interpolateTempActivity(prof.tempActivityCurve, weather.seaSurfaceTempC) : getTempScore(sp, weather.seaSurfaceTempC));
        }, 0) / possibleSpecies.length
      : 0;

  const avgBaitScore =
    possibleSpecies.length > 0
      ? possibleSpecies.reduce((s, sp) => {
          const rawAffinity = getBaitAffinity(sp.id, tackle.bait.category);
          let adjusted = rawAffinity;
          if (tackle.bait.conditionState === 'spoiled') adjusted = rawAffinity * 0.15;
          else if (tackle.bait.conditionState === 'frozen') adjusted = rawAffinity * 0.5;
          else if (tackle.bait.conditionState === 'live') adjusted = rawAffinity * 1.25;
          return s + adjusted;
        }, 0) / possibleSpecies.length
      : 0;

  const avgTimeScore =
    possibleSpecies.length > 0
      ? possibleSpecies.reduce(
          (s, sp) => s + Math.min(1.0, getTimeScore(sp, currentTime, isNighttime)),
          0,
        ) / possibleSpecies.length
      : 0;

  return {
    biteChancePerSecond,
    fishCandidates: fishCandidates.filter((c) => c.weight > 0),
    factors: {
      tideScore: tide.currentStrength,
      tempScore: avgTempScore,
      timeScore: avgTimeScore,
      baitScore: avgBaitScore,
      weatherScore,
      pointBonus: point.biteBonusMultiplier,
      totalScore,
    },
  };
}

/**
 * 가중치 목록에서 랜덤 어종을 선택합니다.
 */
export function pickFishByWeight(
  candidates: Array<{ species: FishSpecies; weight: number }>,
): FishSpecies | null {
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) return null;

  let random = Math.random() * totalWeight;
  for (const candidate of candidates) {
    random -= candidate.weight;
    if (random <= 0) return candidate.species;
  }
  return candidates[candidates.length - 1].species;
}

/**
 * 잡힌 물고기의 크기를 랜덤 생성합니다.
 */
export function generateFishSize(
  species: FishSpecies,
  tideStrength: number,
): { lengthCm: number; weightGram: number } {
  const [minCm, maxCm] = species.avgSizeRangeCm;
  const [minG, maxG] = species.avgWeightRangeG;

  const sizeBias = 0.3 + tideStrength * 0.4;
  const sizeRatio = Math.random() * (1 - sizeBias) + sizeBias * Math.random();

  const lengthCm = Math.round(minCm + (maxCm - minCm) * sizeRatio);
  const weightGram = Math.round(minG + (maxG - minG) * sizeRatio);

  return { lengthCm, weightGram };
}
