/**
 * @file ShoreCreatureDatabase.ts
 * @description 해루질 대상 생물 데이터베이스
 *
 * 한국 조간대 및 연안에 서식하는 채취 가능 생물 데이터.
 * 계절성, 서식 위치, 법적 채취 제한 등을 포함합니다.
 */

import type { ShoreCreatureCategory } from '../types/Activities.js';
import type { SpotType } from '../types/Environment.js';
import type { ForageTool, ForageSpotKind, ForageAccess } from '../types/Foraging.js';

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
  // ── 인-맵 채집 (121차) — 없으면 ForagingEngine이 카테고리·서식지로 추론 ──
  /** 허용 도구 (앞이 1순위 — 성공률 가산) */
  tools?: ForageTool[];
  /** 나올 수 있는 스팟 종류 */
  spotKinds?: ForageSpotKind[];
  /** 맨손 시도 시 부상(성게 가시·굴 껍질) */
  handInjury?: boolean;
  /** 접근 방식 — 'shore'(기본) / 후속 'wade'·'dive'(스킨/스쿠버 전용 생물) */
  access?: ForageAccess;
  /** 강원 조례 어촌계 어장 보호 5종 — 표기용 (판정은 GANGWON_FORAGE_ORDINANCE) */
  ordinanceProtected?: boolean;
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
    tools: ['tongs', 'hand'],
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
    tools: ['tongs'], handInjury: true, spotKinds: ['rock_shore', 'harbor_wall'],
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
    tools: ['gaff'], spotKinds: ['tidepool'], ordinanceProtected: true,
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
    tools: ['net', 'tongs', 'hand'], spotKinds: ['tidepool', 'harbor_wall'],
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
    tools: ['tongs', 'net', 'hand'], spotKinds: ['armor_foot', 'rock_shore'],
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
    nameKo: '돌문어',
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
    tools: ['gaff', 'net'], spotKinds: ['rock_shore', 'armor_foot', 'tidepool'], ordinanceProtected: true,
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
    tools: ['tongs', 'hand'], handInjury: true, spotKinds: ['rock_shore', 'tidepool', 'armor_foot'], ordinanceProtected: true,
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
    tools: ['tongs', 'hand'], spotKinds: ['tidepool', 'rock_shore'], ordinanceProtected: true,
  },
  // ────────── 동해 암반 조간대 4종 (121차 — 속초 갯바위·방파제 실제 채집물) ──────────
  {
    id: 'mytilus_coruscus',
    nameKo: '홍합 (섭)',
    nameEn: 'Korean Mussel',
    scientificName: 'Mytilus coruscus',
    spriteKey: 'creature_mussel',
    category: 'bivalve',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '파도가 치는 암반·방파제 발밑에 족사로 붙어 군락. 동해 해루질의 가장 흔한 수확물.',
    minLegalSizeCm: 0,
    dailyLimitG: 5000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 6000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '강원 조례 보호종 — 어촌계 어장 안에서는 채취 금지. 섭국·섭죽의 주재료.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['hand', 'tongs'], spotKinds: ['rock_shore', 'harbor_wall', 'armor_foot'], ordinanceProtected: true,
  },
  {
    id: 'omphalius_rusticus',
    nameKo: '보말 (팽이고둥)',
    nameEn: 'Top Shell',
    scientificName: 'Omphalius rusticus',
    spriteKey: 'creature_top_shell',
    category: 'gastropod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '조간대 바위 틈과 웅덩이. 낮에도 줍는다.',
    minLegalSizeCm: 0,
    dailyLimitG: 3000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 9000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '해녀들이 보말이라 부르는 작은 고둥. 삶아서 이쑤시개로 빼 먹거나 보말죽으로.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['hand', 'tongs'], spotKinds: ['rock_shore', 'tidepool', 'armor_foot'],
  },
  {
    id: 'capitulum_mitella',
    nameKo: '거북손',
    nameEn: 'Goose Barnacle',
    scientificName: 'Capitulum mitella',
    spriteKey: 'creature_barnacle',
    category: 'shellfish',
    habitatSpotTypes: ['rocky_shore'],
    habitatDesc: '파도가 세게 치는 갯바위 틈에 다닥다닥. 집게로 뜯어낸다.',
    minLegalSizeCm: 0,
    dailyLimitG: 2000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 15000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '삶으면 게와 조개 사이의 맛. 갯바위 채집의 별미.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['tongs'], handInjury: true, spotKinds: ['rock_shore'],
  },
  {
    id: 'cellana_grata',
    nameKo: '삿갓조개 (배말)',
    nameEn: 'Limpet',
    scientificName: 'Cellana grata',
    spriteKey: 'creature_limpet',
    category: 'gastropod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '바위 표면에 삿갓처럼 붙어 있다. 순간적으로 떼어내야 한다.',
    minLegalSizeCm: 0,
    dailyLimitG: 2000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 8000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '눌러 붙으면 안 떨어진다 — 집게로 한 번에. 배말국·배말밥.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['tongs', 'hand'], spotKinds: ['rock_shore', 'harbor_wall'],
  },
  // ────────── 추가 조간대 종 — 사용자 요청 2026-09-20 ──────────
  {
    id: 'haliotis_diversicolor', nameKo: '오분자기', nameEn: 'Small Abalone',
    scientificName: 'Haliotis diversicolor', spriteKey: 'creature_abalone_small', category: 'gastropod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'], habitatDesc: '제주와 남해의 얕은 암반·조수웅덩이 바닥.',
    minLegalSizeCm: 0, dailyLimitG: 0, closedSeasonMonths: [7, 8], discoveryTime: 'night', minLampLumens: 800,
    marketValuePerKg: 45000, isRestaurantIngredient: true, canBeUsedAsBait: false,
    description: '전복보다 작은 암반성 소형 전복류. 바위에 단단히 붙어 집게나 갈고리가 필요하다.',
    requiredLicense: 'shore_hunting_advanced', tools: ['gaff', 'tongs'], spotKinds: ['rock_shore', 'tidepool'], ordinanceProtected: true,
  },
  {
    id: 'heliocidaris_crassispina', nameKo: '말똥성게', nameEn: 'Black-spined Urchin',
    scientificName: 'Heliocidaris crassispina', spriteKey: 'creature_urchin_black', category: 'echinoderm',
    habitatSpotTypes: ['rocky_shore', 'breakwater'], habitatDesc: '남해·제주 암반 조간대의 바위 틈과 얕은 웅덩이.',
    minLegalSizeCm: 0, dailyLimitG: 2000, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 200,
    marketValuePerKg: 28000, isRestaurantIngredient: true, canBeUsedAsBait: false,
    description: '가시가 굵고 검은 성게. 맨손 채집 시 부상 위험이 있어 집게를 사용한다.',
    requiredLicense: 'shore_hunting_basic', tools: ['tongs'], handInjury: true, spotKinds: ['rock_shore', 'tidepool'], ordinanceProtected: true,
  },
  {
    id: 'aplysia_kurodai', nameKo: '참군소', nameEn: 'Sea Hare',
    scientificName: 'Aplysia kurodai', spriteKey: 'creature_sea_hare', category: 'gastropod',
    habitatSpotTypes: ['rocky_shore'], habitatDesc: '해조류가 자라는 얕은 암반과 조수웅덩이.',
    minLegalSizeCm: 0, dailyLimitG: 1500, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 0,
    marketValuePerKg: 9000, isRestaurantIngredient: false, canBeUsedAsBait: false,
    description: '해조류 사이를 느리게 이동하는 군소. 관찰·도감 기록 중심의 해루질 발견물.',
    requiredLicense: 'shore_hunting_basic', tools: ['hand', 'tongs'], spotKinds: ['rock_shore', 'tidepool'],
  },
  {
    id: 'hemigrapsus_sanguineus', nameKo: '쫄장게', nameEn: 'Asian Shore Crab',
    scientificName: 'Hemigrapsus sanguineus', spriteKey: 'creature_shore_crab', category: 'crustacean',
    habitatSpotTypes: ['rocky_shore', 'breakwater'], habitatDesc: '국내 전 연안의 방파제·갯바위 돌 틈과 해조류 가장자리.',
    minLegalSizeCm: 0, dailyLimitG: 1000, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 0,
    marketValuePerKg: 12000, isRestaurantIngredient: true, canBeUsedAsBait: true,
    description: '돌 틈으로 빠르게 숨는 작은 연안 게. 낮은 조위의 바위 틈에서 맨손 또는 집게로 찾는다.',
    requiredLicense: 'shore_hunting_basic', tools: ['tongs', 'hand'], spotKinds: ['rock_shore', 'armor_foot'],
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
