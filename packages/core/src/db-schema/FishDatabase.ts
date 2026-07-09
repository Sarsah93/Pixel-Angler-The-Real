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
  /** 서식 수층 */
  swimmingLayer: 'surface' | 'mid' | 'bottom';
  /** 보일링 발생 어종 여부 */
  isBoilingSpecies?: boolean;
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
    swimmingLayer: 'surface',
    isBoilingSpecies: true,
    description: '방파제와 갯바위 근처 수중여에 서식하는 대표적인 야행성 어종. 집어등에 잘 반응하며, 밤이 되면 상층으로 피딩하러 올라와 끓어오르는 보일링을 형성하기도 한다.',
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
    swimmingLayer: 'mid',
    isBoilingSpecies: false,
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
    swimmingLayer: 'bottom',
    isBoilingSpecies: false,
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
    swimmingLayer: 'surface',
    isBoilingSpecies: true,
    description: '집어등을 이용한 야간 방파제/선상 낚시의 핵심. 밤이 되면 수면 부근으로 부상하여 베이트피시를 사냥한다.',
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
    swimmingLayer: 'surface',
    isBoilingSpecies: true,
    description: '겨울철 대표 선상 지깅 대상어. 메탈지그로 공략하며 표층에서 집단으로 베이트피시를 몰고 다녀 화려한 보일링을 형성한다.',
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
    swimmingLayer: 'surface',
    isBoilingSpecies: true,
    description: '방어보다 더 강한 파이팅의 대형 어종. 갯바위나 연안 표층을 빠른 속도로 헤엄쳐 다녀 큰 파장을 일으킨다.',
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
    swimmingLayer: 'mid',
    isBoilingSpecies: false,
    description: '방파제 입문 낚시의 단골 손님. 낚아도 먹기 껄끄러운 잡어지만 어린 낚시꾼들의 첫 물고기.',
  },
  {
    id: 'korean_rockfish',
    nameKo: '조피볼락',
    nameEn: 'Korean Rockfish',
    scientificName: 'Sebastes schlegeli',
    spriteKey: 'fish_korean_rockfish',
    minLegalSizeCm: 23,
    avgSizeRangeCm: [20, 45],
    maxRecordCm: 65,
    avgWeightRangeG: [300, 2000],
    preferredDepthM: [5, 40],
    preferredTempC: [10, 20],
    preferredBaits: ['sandworm', 'prawn', 'fish_strip', 'artificial_worm'],
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    peakSeasonMonths: [11, 12, 1, 2, 3, 4, 5],
    isNocturnal: true,
    nightBiteBonus: 50,
    rarity: 'common',
    difficulty: 2,
    sashimiValuePerKg: 30000,
    swimmingLayer: 'bottom',
    isBoilingSpecies: false,
    description: '일명 우럭. 연안의 바위틈이나 방파제 테트라포드 주위에 서식하는 대표적인 락피시. 밤에 매우 활발히 먹이활동을 한다.',
  },
  {
    id: 'yellow_rockfish',
    nameKo: '황볼락',
    nameEn: 'Yellow Rockfish',
    scientificName: 'Sebastes trivittatus',
    spriteKey: 'fish_yellow_rockfish',
    minLegalSizeCm: 0,
    avgSizeRangeCm: [15, 25],
    maxRecordCm: 35,
    avgWeightRangeG: [100, 400],
    preferredDepthM: [5, 25],
    preferredTempC: [11, 19],
    preferredBaits: ['sandworm', 'prawn', 'artificial_worm'],
    habitatSpotTypes: ['rocky_shore'],
    peakSeasonMonths: [10, 11, 12, 1, 2, 3],
    isNocturnal: true,
    nightBiteBonus: 40,
    rarity: 'uncommon',
    difficulty: 2,
    sashimiValuePerKg: 28000,
    swimmingLayer: 'mid',
    isBoilingSpecies: false,
    description: '몸에 황갈색 세로띠가 있는 볼락류. 주로 갯바위 수중여와 암초 지대에 서식하며 야간 찌낚시에 반응이 좋다.',
  },
  {
    id: 'red_snapper_rockfish',
    nameKo: '열기',
    nameEn: 'Longspine Thornyhead',
    scientificName: 'Sebastes thompsoni',
    spriteKey: 'fish_red_snapper_rockfish',
    minLegalSizeCm: 0,
    avgSizeRangeCm: [15, 30],
    maxRecordCm: 38,
    avgWeightRangeG: [100, 600],
    preferredDepthM: [15, 80],
    preferredTempC: [12, 18],
    preferredBaits: ['fish_strip', 'sandworm', 'squid'],
    habitatSpotTypes: ['boat_fishing', 'rocky_shore'],
    peakSeasonMonths: [12, 1, 2, 3, 4],
    isNocturnal: true,
    nightBiteBonus: 60,
    rarity: 'uncommon',
    difficulty: 2,
    sashimiValuePerKg: 22000,
    swimmingLayer: 'bottom',
    isBoilingSpecies: false,
    description: '표준명 불볼락. 무리를 지어 생활하는 습성이 있어 야간 선상 카드채비나 수중여 주변에서 다수 낚인다.',
  },
  {
    id: 'night_seabream',
    nameKo: '참돔 (야간)',
    nameEn: 'Red Sea Bream (Night)',
    scientificName: 'Pagrus major',
    spriteKey: 'fish_night_seabream',
    minLegalSizeCm: 24,
    avgSizeRangeCm: [20, 40],
    maxRecordCm: 55,
    avgWeightRangeG: [300, 1500],
    preferredDepthM: [5, 30],
    preferredTempC: [15, 23],
    preferredBaits: ['sandworm', 'prawn', 'crab', 'mussel'],
    habitatSpotTypes: ['breakwater', 'rocky_shore'],
    peakSeasonMonths: [5, 6, 7, 8, 9, 10, 11],
    isNocturnal: true,
    nightBiteBonus: 40,
    rarity: 'rare',
    difficulty: 3,
    sashimiValuePerKg: 35000,
    swimmingLayer: 'bottom',
    isBoilingSpecies: false,
    description: '밤에 경계심이 풀려 갯바위나 방파제 가장자리로 접근하는 참돔 소물. 밤낚시 찌낚시의 짜릿한 불청객.',
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
