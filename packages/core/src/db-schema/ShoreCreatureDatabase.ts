/**
 * @file ShoreCreatureDatabase.ts
 * @description 해루질 대상 생물 데이터베이스
 *
 * 한국 조간대 및 연안에 서식하는 채취 가능 생물 데이터.
 * 계절성, 서식 위치, 법적 채취 제한 등을 포함합니다.
 */

import type { ShoreCreatureCategory } from '../types/Activities.js';
import type { SpotType } from '../types/Environment.js';

// ─────────────────────────────────────────────
// 해루질 생물 스키마
// ─────────────────────────────────────────────

export interface ShoreCreature {
  id: string;
  nameKo: string;
  nameEn: string;
  scientificName: string;
  spriteKey: string;
  category: ShoreCreatureCategory;
  /** 서식 가능 스팟 타입 */
  habitatSpotTypes: SpotType[];
  /** 주요 서식 위치 설명 */
  habitatDesc: string;
  /** 최소 법정 채취 크기 (cm, 0=제한없음) */
  minLegalSizeCm: number;
  /** 일일 채취 제한량 (g, 0=무제한) */
  dailyLimitG: number;
  /** 금어기 월 (1~12, 해당 월에 채취 불가) */
  closedSeasonMonths: number[];
  /** 발견 가능 조도 (낮/밤/모두) */
  discoveryTime: 'day' | 'night' | 'both';
  /** 발견에 필요한 최소 랜턴 루멘 */
  minLampLumens: number;
  /** 시장 가격 (원/kg) */
  marketValuePerKg: number;
  /** 식당 메뉴 활용 가능 여부 */
  isRestaurantIngredient: boolean;
  /** 낚시 미끼로 활용 가능 여부 */
  canBeUsedAsBait: boolean;
  /** 설명 */
  description: string;
  /** 해금 라이선스 타입 (null = 기본 허가로 채취 가능) */
  requiredLicense: 'shore_hunting_basic' | 'shore_hunting_advanced' | null;
}

// ─────────────────────────────────────────────
// 초기 데이터
// ─────────────────────────────────────────────

export const SHORE_CREATURE_DATABASE: ShoreCreature[] = [
  // ────────── 조개류 ──────────
  {
    id: 'clam_varicosa',
    nameKo: '바지락',
    nameEn: 'Short-necked Clam',
    scientificName: 'Ruditapes philippinarum',
    spriteKey: 'creature_clam_varicosa',
    category: 'bivalve',
    habitatSpotTypes: ['beach', 'tidal_flat'],
    habitatDesc: '갯벌과 모래사장 조간대. 썰물 때 표층 5~10cm 깊이에 서식.',
    minLegalSizeCm: 2.0,
    dailyLimitG: 3000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 8000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '전국 갯벌에서 채취 가능한 국민 조개. 바지락 칼국수, 바지락 술찜의 핵심 재료.',
    requiredLicense: 'shore_hunting_basic',
  },
  {
    id: 'turbo_cornutus',
    nameKo: '소라',
    nameEn: 'Horned Turban',
    scientificName: 'Turbo cornutus',
    spriteKey: 'creature_turbo',
    category: 'gastropod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '암반 조간대~수심 10m. 밤에 바위 표면에서 활동.',
    minLegalSizeCm: 7.0,
    dailyLimitG: 5000,
    closedSeasonMonths: [],
    discoveryTime: 'night',
    minLampLumens: 500,
    marketValuePerKg: 25000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '해루질의 대표 종. 야간에 바위 표면을 기어다니므로 집어등으로 쉽게 발견 가능.',
    requiredLicense: 'shore_hunting_basic',
  },
  {
    id: 'oyster_gigas',
    nameKo: '굴',
    nameEn: 'Pacific Oyster',
    scientificName: 'Crassostrea gigas',
    spriteKey: 'creature_oyster',
    category: 'bivalve',
    habitatSpotTypes: ['rocky_shore', 'breakwater', 'tidal_flat'],
    habitatDesc: '바위나 방파제 표면에 군락을 이루며 고착 서식.',
    minLegalSizeCm: 5.0,
    dailyLimitG: 5000,
    closedSeasonMonths: [6, 7, 8],  // 여름 산란기 금채기
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 12000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '바위에 붙어있는 굴은 장갑 끼고 돌칼로 분리. 生굴 특유의 달콤한 바다향.',
    requiredLicense: 'shore_hunting_basic',
  },
  {
    id: 'haliotis_discus',
    nameKo: '전복',
    nameEn: 'Pacific Abalone',
    scientificName: 'Haliotis discus hannai',
    spriteKey: 'creature_abalone',
    category: 'gastropod',
    habitatSpotTypes: ['rocky_shore'],
    habitatDesc: '수심 3~15m 암반. 해루질 가능 수심(1~3m)에서 드물게 발견.',
    minLegalSizeCm: 10.0,
    dailyLimitG: 2000,
    closedSeasonMonths: [5, 6, 7, 8],  // 산란기 보호
    discoveryTime: 'night',
    minLampLumens: 1500,
    marketValuePerKg: 90000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '해루질의 로망. 작은 갈고리로 바위에서 분리. 심화 라이선스 필수.',
    requiredLicense: 'shore_hunting_advanced',
  },
  // ────────── 갑각류 ──────────
  {
    id: 'portunus_trituberculatus',
    nameKo: '꽃게',
    nameEn: 'Swimming Crab',
    scientificName: 'Portunus trituberculatus',
    spriteKey: 'creature_portunus',
    category: 'crustacean',
    habitatSpotTypes: ['beach', 'tidal_flat', 'breakwater'],
    habitatDesc: '야간에 얕은 연안 모래~펄 바닥. 뒤집어진 돌 아래서도 발견.',
    minLegalSizeCm: 0,
    dailyLimitG: 0,
    closedSeasonMonths: [6, 7, 8],  // 포란기 암컷 보호
    discoveryTime: 'night',
    minLampLumens: 500,
    marketValuePerKg: 40000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '야간 해루질의 대표 수확물. 통발에도 잘 걸리며 꽃게탕, 꽃게찜으로 최고.',
    requiredLicense: 'shore_hunting_basic',
  },
  {
    id: 'charybdis_japonica',
    nameKo: '민꽃게 (돌게)',
    nameEn: 'Japanese Swimming Crab',
    scientificName: 'Charybdis japonica',
    spriteKey: 'creature_charybdis',
    category: 'crustacean',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '방파제 테트라포드 사이, 갯바위 돌 뒤에 숨어 있음.',
    minLegalSizeCm: 0,
    dailyLimitG: 0,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 300,
    marketValuePerKg: 20000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '돌 뒤를 뒤지면 자주 나오는 게. 감성돔/농어 미끼로도 최고급.',
    requiredLicense: 'shore_hunting_basic',
  },
  // ────────── 두족류 ──────────
  {
    id: 'octopus_minor',
    nameKo: '낙지',
    nameEn: 'Long-arm Octopus',
    scientificName: 'Octopus minor',
    spriteKey: 'creature_octopus_minor',
    category: 'cephalopod',
    habitatSpotTypes: ['tidal_flat', 'beach'],
    habitatDesc: '갯벌 20~30cm 깊이 구멍 속. 구멍 입구에 조개껍데기가 쌓여 있음.',
    minLegalSizeCm: 0,
    dailyLimitG: 0,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 60000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '갯벌 낙지 잡기는 고도의 기술이 필요. 꼬챙이로 구멍 속을 찌르면 촉수가 올라옴.',
    requiredLicense: 'shore_hunting_advanced',
  },
  {
    id: 'octopus_vulgaris',
    nameKo: '문어',
    nameEn: 'Common Octopus',
    scientificName: 'Octopus vulgaris',
    spriteKey: 'creature_octopus',
    category: 'cephalopod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '바위 틈, 수중여 구멍 속. 야간에 먹이 활동을 위해 이동.',
    minLegalSizeCm: 0,
    dailyLimitG: 0,
    closedSeasonMonths: [],
    discoveryTime: 'night',
    minLampLumens: 1000,
    marketValuePerKg: 45000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '야간 갯바위 해루질의 최고 목표. 발견 시 재빠르게 잡아야 도망 가지 않음.',
    requiredLicense: 'shore_hunting_advanced',
  },
  // ────────── 극피동물 ──────────
  {
    id: 'strongylocentrotus_nudus',
    nameKo: '성게 (보라성게)',
    nameEn: 'Sea Urchin',
    scientificName: 'Strongylocentrotus nudus',
    spriteKey: 'creature_sea_urchin',
    category: 'echinoderm',
    habitatSpotTypes: ['rocky_shore'],
    habitatDesc: '조간대 암반 표면, 수심 1~5m 바위 사이.',
    minLegalSizeCm: 5.0,
    dailyLimitG: 1000,
    closedSeasonMonths: [1, 2, 3, 4],  // 산란기 보호
    discoveryTime: 'both',
    minLampLumens: 300,
    marketValuePerKg: 80000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '성게알 (생식소)은 고급 횟집 재료. 채취 시 장갑 필수.',
    requiredLicense: 'shore_hunting_basic',
  },
  {
    id: 'stichopus_japonicus',
    nameKo: '해삼',
    nameEn: 'Japanese Sea Cucumber',
    scientificName: 'Stichopus japonicus',
    spriteKey: 'creature_sea_cucumber',
    category: 'echinoderm',
    habitatSpotTypes: ['rocky_shore', 'tidal_flat'],
    habitatDesc: '조간대 돌 밑, 수심 1~10m. 겨울~봄에 연안으로 이동.',
    minLegalSizeCm: 0,
    dailyLimitG: 2000,
    closedSeasonMonths: [7, 8, 9],  // 하면 (夏眠)
    discoveryTime: 'both',
    minLampLumens: 200,
    marketValuePerKg: 100000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '겨울이 제철인 귀한 식재료. 건해삼은 가격이 매우 비쌈.',
    requiredLicense: 'shore_hunting_basic',
  },
];

export function getCreatureById(id: string): ShoreCreature | undefined {
  return SHORE_CREATURE_DATABASE.find((c) => c.id === id);
}

export function getCreaturesByCategory(category: ShoreCreatureCategory): ShoreCreature[] {
  return SHORE_CREATURE_DATABASE.filter((c) => c.category === category);
}

export function getCreaturesBySpotType(spotType: SpotType): ShoreCreature[] {
  return SHORE_CREATURE_DATABASE.filter((c) => c.habitatSpotTypes.includes(spotType));
}

export function getActiveCreaturesByMonth(month: number): ShoreCreature[] {
  return SHORE_CREATURE_DATABASE.filter((c) => !c.closedSeasonMonths.includes(month));
}
