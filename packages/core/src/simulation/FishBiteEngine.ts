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

import type { TackleSetup, BaitCategory } from '../types/Gear.js';
import type { FishingEnvironment } from '../types/Environment.js';
import type { FishingPoint } from '../types/Fishing.js';
import type { FishSpecies } from '../db-schema/FishDatabase.js';

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
};

/** 미끼-어종 친화도 계산 (0.0~1.0) */
function getBaitAffinity(speciesId: string, baitCategory: BaitCategory): number {
  const preferred = BAIT_SPECIES_AFFINITY[speciesId];
  if (!preferred) return 0.3; // 알 수 없는 어종은 기본값
  const idx = preferred.indexOf(baitCategory);
  if (idx === -1) return 0.1;
  return 1.0 - (idx / preferred.length) * 0.7; // 첫 번째 미끼가 가장 높은 점수
}

/** 수온 적합도 계산 */
function getTempScore(species: FishSpecies, currentTempC: number): number {
  const [minT, maxT] = species.preferredTempC;
  if (currentTempC < minT - 5 || currentTempC > maxT + 5) return 0.0;
  if (currentTempC >= minT && currentTempC <= maxT) return 1.0;
  // 적정 범위 외곽 — 선형 감소
  if (currentTempC < minT) return Math.max(0, 1.0 - (minT - currentTempC) / 5);
  return Math.max(0, 1.0 - (currentTempC - maxT) / 5);
}

/** 시간대 점수 계산 */
function getTimeScore(species: FishSpecies, currentTime: Date, isNighttime: boolean): number {
  const hour = currentTime.getHours();

  // 야행성 어종
  if (species.isNocturnal) {
    if (isNighttime) return 1.0 + species.nightBiteBonus / 100;
    // 해질녘/새벽은 중간
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

  // 폭풍은 낚시 불가
  if (weather.weatherCondition === 'stormy') return 0.0;
  // 파고가 높으면 감점
  if (weather.waveHeightM > 2.0) return 0.1;
  if (weather.waveHeightM > 1.5) return 0.4;
  // 약한 비/흐림은 오히려 어류 경계심 낮춤
  if (weather.weatherCondition === 'rainy') return 0.7;
  if (weather.weatherCondition === 'cloudy') return 0.85;
  // 맑은 날 한낮은 어류가 깊이 들어감
  if (weather.weatherCondition === 'clear') {
    const hour = env.currentTime.getHours();
    if (hour >= 10 && hour <= 15) return 0.6;
    return 0.8;
  }
  return 0.75;
}

// ─────────────────────────────────────────────
// 메인 입질 계산 함수
// ─────────────────────────────────────────────

/**
 * 현재 환경과 채비를 바탕으로 입질 확률을 계산합니다.
 *
 * @param possibleSpecies - 이 포인트에서 출현 가능한 어종 목록
 * @param tackle - 현재 장착 채비
 * @param environment - 현재 낚시 환경 (물때, 날씨 등)
 * @param point - 현재 낚시 포인트
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

  // 기본 환경 점수 계산
  const tideScore = tide.currentStrength;
  const weatherScore = getWeatherScore(environment);

  // 어종별 가중치 계산
  const fishCandidates = possibleSpecies.map((species) => {
    const tempScore = getTempScore(species, weather.seaSurfaceTempC);
    const timeScore = Math.min(1.0, getTimeScore(species, currentTime, isNighttime));
    
    // 미끼 친화도 및 신선도 상태 보정
    const baitScoreRaw = getBaitAffinity(species.id, tackle.bait.category);
    let baitScore = baitScoreRaw;
    if (tackle.bait.conditionState === 'spoiled') {
      baitScore = baitScoreRaw * 0.15; // 부패한 미끼는 85% 감점
    } else if (tackle.bait.conditionState === 'frozen') {
      baitScore = baitScoreRaw * 0.5;  // 얼어있는 냉동 미끼는 집어 향 부족으로 50% 감점
    } else if (tackle.bait.conditionState === 'live') {
      baitScore = baitScoreRaw * 1.25; // 활어/살아있는 생미끼는 25% 가산
    }

    // 물때 어종별 보정
    let tideBonus = 1.0;
    if (species.activeTidePhases && species.activeTidePhases.length > 0) {
      tideBonus = species.activeTidePhases.includes(tide.tidePhase) ? 1.3 : 0.7;
    }

    // 희귀도에 따른 기본 출현 확률
    const rarityMultiplier: Record<string, number> = {
      common: 1.0,
      uncommon: 0.5,
      rare: 0.2,
      epic: 0.05,
      legendary: 0.01,
    };

    const score =
      ((tideScore * 0.25 + tempScore * 0.25 + timeScore * 0.2 + baitScore * 0.2 + weatherScore * 0.1) *
        tideBonus *
        rarityMultiplier[species.rarity]) *
      point.biteBonusMultiplier;

    return { species, weight: Math.max(0, score) };
  });

  const totalWeight = fishCandidates.reduce((sum, c) => sum + c.weight, 0);

  // 종합 점수 (초당 입질 확률로 변환)
  // 적정 조건: 30초당 1회 = 초당 0.033
  // 최악 조건: 5분당 1회 = 초당 0.0033
  const totalScore = Math.min(1.0, totalWeight / Math.max(1, possibleSpecies.length));
  const baseBitePerSecond = 0.005; // 기본 5분 대기
  const biteChancePerSecond = baseBitePerSecond + totalScore * 0.03;

  const avgTempScore =
    possibleSpecies.length > 0
      ? possibleSpecies.reduce((s, sp) => s + getTempScore(sp, weather.seaSurfaceTempC), 0) /
        possibleSpecies.length
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
      tideScore,
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
 * 실제 입질 발생 시 어종 결정에 사용됩니다.
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
 * 물때가 강할수록 대형 개체 출현 확률이 높아집니다.
 */
export function generateFishSize(
  species: FishSpecies,
  tideStrength: number,
): { lengthCm: number; weightGram: number } {
  const [minCm, maxCm] = species.avgSizeRangeCm;
  const [minG, maxG] = species.avgWeightRangeG;

  // 사리(tideStrength 높음)일수록 상위 사이즈 확률 증가
  const sizeBias = 0.3 + tideStrength * 0.4;
  const sizeRatio = Math.random() * (1 - sizeBias) + sizeBias * Math.random();

  const lengthCm = Math.round(minCm + (maxCm - minCm) * sizeRatio);
  const weightGram = Math.round(minG + (maxG - minG) * sizeRatio);

  return { lengthCm, weightGram };
}
