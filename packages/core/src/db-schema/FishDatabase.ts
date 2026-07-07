/**
 * @file FishDatabase.ts
 * @description 어종 데이터베이스 스키마 및 초기 데이터
 *
 * 한국 바다 낚시 대상어 데이터.
 * 실제 어류 생태 정보를 바탕으로 입질 확률 계산에 활용됩니다.
 */

import type { BaitCategory } from '../types/Gear.js';
import type { SpotType } from '../types/Environment.js';

// ─────────────────────────────────────────────
// 어종 스키마
// ─────────────────────────────────────────────
export interface FishSpecies {
  id: string;
  /** 한국 이름 */
  nameKo: string;
  /** 영문 이름 */
  nameEn: string;
  /** 학명 */
  scientificName: string;
  /** 도트 스프라이트 키 */
  spriteKey: string;
  /** 최소 법정 포획 크기 (cm, 0=제한 없음) */
  minLegalSizeCm: number;
  /** 평균 크기 범위 (cm) */
  avgSizeRangeCm: [number, number];
  /** 최대 크기 기록 (cm) — 기네스급 */
  maxRecordCm: number;
  /** 평균 무게 범위 (g) */
  avgWeightRangeG: [number, number];
  /** 적정 수심 범위 (m) */
  preferredDepthM: [number, number];
  /** 적정 수온 범위 (°C) */
  preferredTempC: [number, number];
  /** 주요 먹이 (선호 미끼) */
  preferredBaits: BaitCategory[];
  /** 주요 서식 스팟 유형 */
  habitatSpotTypes: SpotType[];
  /** 제철 (월, 1~12) */
  peakSeasonMonths: number[];
  /** 주로 활동하는 물때 (1~15, 비어있으면 무관) */
  activeTidePhases?: number[];
  /** 야행성 여부 */
  isNocturnal: boolean;
  /** 야간 활동 보너스 (%) */
  nightBiteBonus: number;
  /** 희귀도 (일반적일수록 높은 출현율) */
  rarity: FishRarity;
  /** 난이도 (잡기 어려울수록 높음) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** 횟값 (kg당 원, 근처 횟집 손질비 계산 기준) */
  sashimiValuePerKg: number;
  /** 설명 */
  description: string;
}

export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// ─────────────────────────────────────────────
// 초기 어종 데이터 (한국 바다 낚시 주요 대상어)
// ─────────────────────────────────────────────
export const FISH_DATABASE: FishSpecies[] = [
  {
    id: 'black_rockfish',
    nameKo: '볼락',
    nameEn: 'Black Rockfish',
    scientificName: 'Sebastes inermis',
    spriteKey: 'fish_black_rockfish',
    minLegalSizeCm: 0,
    avgSizeRangeCm: [15, 30],
    maxRecordCm: 42,
    avgWeightRangeG: [150, 600],
    preferredDepthM: [3, 30],
    preferredTempC: [12, 22],
    preferredBaits: ['sandworm', 'prawn', 'artificial_worm'],
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    peakSeasonMonths: [11, 12, 1, 2, 3],
    isNocturnal: true,
    nightBiteBonus: 60,
    rarity: 'common',
    difficulty: 1,
    sashimiValuePerKg: 25000,
    description: '방파제와 갯바위 근처 수중여에 서식하는 대표적인 야행성 어종. 집어등에 잘 반응한다.',
  },
  {
    id: 'largescale_blackfish',
    nameKo: '벵에돔',
    nameEn: 'Largescale Blackfish',
    scientificName: 'Girella punctata',
    spriteKey: 'fish_largescale_blackfish',
    minLegalSizeCm: 25,
    avgSizeRangeCm: [25, 45],
    maxRecordCm: 65,
    avgWeightRangeG: [500, 2500],
    preferredDepthM: [5, 20],
    preferredTempC: [18, 28],
    preferredBaits: ['bread', 'sandworm', 'mussel', 'barnacle'],
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    peakSeasonMonths: [6, 7, 8, 9, 10],
    activeTidePhases: [6, 7, 8, 9, 10],
    isNocturnal: false,
    nightBiteBonus: 0,
    rarity: 'uncommon',
    difficulty: 4,
    sashimiValuePerKg: 45000,
    description: '한국 바다낚시의 꽃. 전유동/반유동 찌낚시의 메인 대상어. 거제 벵에돔 토너먼트의 주인공.',
  },
  {
    id: 'black_seabream',
    nameKo: '감성돔',
    nameEn: 'Black Seabream',
    scientificName: 'Acanthopagrus schlegelii',
    spriteKey: 'fish_black_seabream',
    minLegalSizeCm: 25,
    avgSizeRangeCm: [25, 50],
    maxRecordCm: 73,
    avgWeightRangeG: [500, 3500],
    preferredDepthM: [2, 25],
    preferredTempC: [14, 25],
    preferredBaits: ['crab', 'mussel', 'barnacle', 'sandworm', 'earthworm'],
    habitatSpotTypes: ['breakwater', 'rocky_shore', 'beach'],
    peakSeasonMonths: [10, 11, 12, 1, 2, 3],
    activeTidePhases: [7, 8, 9, 10, 11],
    isNocturnal: true,
    nightBiteBonus: 40,
    rarity: 'uncommon',
    difficulty: 4,
    sashimiValuePerKg: 50000,
    description: '바다낚시 입문자부터 고수까지 모두 노리는 대상어. 조류가 강한 사리 전후로 대물이 나온다.',
  },
  {
    id: 'hairtail',
    nameKo: '갈치',
    nameEn: 'Hairtail',
    scientificName: 'Trichiurus lepturus',
    spriteKey: 'fish_hairtail',
    minLegalSizeCm: 18,
    avgSizeRangeCm: [60, 120],
    maxRecordCm: 210,
    avgWeightRangeG: [300, 1500],
    preferredDepthM: [10, 100],
    preferredTempC: [20, 30],
    preferredBaits: ['sandworm', 'squid', 'fish_strip', 'artificial_lure'],
    habitatSpotTypes: ['boat_fishing', 'breakwater'],
    peakSeasonMonths: [7, 8, 9, 10],
    isNocturnal: true,
    nightBiteBonus: 100,
    rarity: 'common',
    difficulty: 2,
    sashimiValuePerKg: 18000,
    description: '집어등을 이용한 야간 방파제/선상 낚시의 핵심. 찌를 단 카드채비나 생미끼로 공략한다.',
  },
  {
    id: 'yellowtail',
    nameKo: '방어',
    nameEn: 'Yellowtail',
    scientificName: 'Seriola quinqueradiata',
    spriteKey: 'fish_yellowtail',
    minLegalSizeCm: 0,
    avgSizeRangeCm: [40, 100],
    maxRecordCm: 150,
    avgWeightRangeG: [2000, 12000],
    preferredDepthM: [10, 60],
    preferredTempC: [18, 26],
    preferredBaits: ['artificial_lure', 'squid', 'fish_strip'],
    habitatSpotTypes: ['boat_fishing', 'rocky_shore'],
    peakSeasonMonths: [11, 12, 1],
    isNocturnal: false,
    nightBiteBonus: 0,
    rarity: 'uncommon',
    difficulty: 3,
    sashimiValuePerKg: 35000,
    description: '겨울철 대표 선상 지깅 대상어. 메탈지그로 공략하며 파이팅이 매우 강렬하다.',
  },
  {
    id: 'japanese_amberjack',
    nameKo: '부시리',
    nameEn: 'Japanese Amberjack',
    scientificName: 'Seriola lalandi',
    spriteKey: 'fish_amberjack',
    minLegalSizeCm: 0,
    avgSizeRangeCm: [60, 120],
    maxRecordCm: 190,
    avgWeightRangeG: [5000, 20000],
    preferredDepthM: [5, 50],
    preferredTempC: [20, 28],
    preferredBaits: ['artificial_lure', 'fish_strip'],
    habitatSpotTypes: ['rocky_shore', 'boat_fishing'],
    peakSeasonMonths: [7, 8, 9, 10],
    isNocturnal: false,
    nightBiteBonus: 0,
    rarity: 'rare',
    difficulty: 4,
    sashimiValuePerKg: 40000,
    description: '방어보다 더 강한 파이팅의 대형 어종. 갯바위 지깅의 최종 목표.',
  },
  {
    id: 'rockfish_yongchi',
    nameKo: '용치놀래기',
    nameEn: 'Lyretail Wrasse',
    scientificName: 'Halichoeres poecilopterus',
    spriteKey: 'fish_wrasse',
    minLegalSizeCm: 0,
    avgSizeRangeCm: [15, 35],
    maxRecordCm: 40,
    avgWeightRangeG: [100, 500],
    preferredDepthM: [2, 15],
    preferredTempC: [18, 28],
    preferredBaits: ['sandworm', 'earthworm', 'mussel'],
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    peakSeasonMonths: [5, 6, 7, 8, 9, 10],
    isNocturnal: false,
    nightBiteBonus: 0,
    rarity: 'common',
    difficulty: 1,
    sashimiValuePerKg: 8000,
    description: '방파제 입문 낚시의 단골 손님. 낚아도 먹기 껄끄러운 잡어지만 어린 낚시꾼들의 첫 물고기.',
  },
];

export function getFishById(id: string): FishSpecies | undefined {
  return FISH_DATABASE.find((f) => f.id === id);
}

export function getFishBySpotType(spotType: SpotType): FishSpecies[] {
  return FISH_DATABASE.filter((f) => f.habitatSpotTypes.includes(spotType));
}

export function getFishByMonth(month: number): FishSpecies[] {
  return FISH_DATABASE.filter((f) => f.peakSeasonMonths.includes(month));
}
