/**
 * @file TrapDatabase.ts
 * @description 통발 장비 데이터베이스
 *
 * 통발 종류, 목표 생물, 효율, 내구도 등의 데이터.
 */

import type { TrapSpec, TrapType } from '../types/Activities.js';

export const TRAP_DATABASE: TrapSpec[] = [
  // ────────── 게 통발 ──────────
  {
    id: 'trap_crab_basic',
    nameKo: '기본 게 통발',
    type: 'crab_pot',
    maxCapacityG: 3000,
    baitDurationHours: 8,
    maxDepthM: 20,
    durability: 100,
    maxDurability: 100,
    targetCategories: ['crustacean'],
    licenseTier: 'basic', priceWon: 18000,
  },
  {
    id: 'trap_crab_pro',
    nameKo: '프로 게 통발 (대형)',
    type: 'crab_pot',
    maxCapacityG: 6000,
    baitDurationHours: 12,
    maxDepthM: 40,
    durability: 200,
    maxDurability: 200,
    // ⚠ 'shellfish'는 생물 DB에 실생물이 0이라 영영 매칭되지 않는다 (조개류는 bivalve/gastropod).
    //   통발에 실제로 기어드는 패류는 소라(복족류)뿐 — bivalve(바지락·굴)는 매몰·고착형이라 제외.
    targetCategories: ['crustacean', 'gastropod'],
    licenseTier: 'basic', priceWon: 45000,
  },
  // ────────── 새우 통발 ──────────
  {
    id: 'trap_shrimp_basic',
    nameKo: '새우 통발',
    type: 'shrimp_trap',
    maxCapacityG: 1500,
    baitDurationHours: 6,
    maxDepthM: 15,
    durability: 80,
    maxDurability: 80,
    targetCategories: ['crustacean'],
    licenseTier: 'basic', priceWon: 12000,
  },
  // ────────── 장어 통발 (심화 면허 필요) ──────────
  {
    id: 'trap_eel_basic',
    nameKo: '장어 통발 (원통형)',
    type: 'eel_trap',
    maxCapacityG: 4000,
    baitDurationHours: 12,
    maxDepthM: 10,
    durability: 150,
    maxDurability: 150,
    targetCategories: ['crustacean'],           // 게류 혼획
    targetFishSpecies: ['conger_eel', 'hagfish'], // 붕장어·먹장어 (FishDatabase)
    licenseTier: 'advanced', priceWon: 35000,
  },
  {
    id: 'trap_eel_pro',
    nameKo: '장어 통발 (대형 연결식)',
    type: 'eel_trap',
    maxCapacityG: 8000,
    baitDurationHours: 24,
    maxDepthM: 15,
    durability: 300,
    maxDurability: 300,
    targetCategories: ['crustacean'],
    targetFishSpecies: ['conger_eel', 'hagfish', 'pike_conger'], // 대형식은 갯장어(하모)까지
    licenseTier: 'advanced', priceWon: 90000,
  },
  // ────────── 문어 단지 (심화 면허 필요) ──────────
  {
    id: 'trap_octopus_earthen',
    nameKo: '문어 단지 (토기)',
    type: 'octopus_trap',
    maxCapacityG: 5000,
    baitDurationHours: 24,
    maxDepthM: 30,
    durability: 60,
    maxDurability: 60,
    targetCategories: ['cephalopod'],
    licenseTier: 'advanced', priceWon: 15000,
  },
  {
    id: 'trap_octopus_pvc',
    nameKo: '문어 PVC 단지',
    type: 'octopus_trap',
    maxCapacityG: 5000,
    baitDurationHours: 24,
    maxDepthM: 30,
    durability: 250,
    maxDurability: 250,
    targetCategories: ['cephalopod'],
    licenseTier: 'advanced', priceWon: 28000,
  },
  // ────────── 어류 통발 ──────────
  {
    id: 'trap_fish_net',
    nameKo: '어류 그물 통발',
    type: 'fish_trap',
    maxCapacityG: 10000,
    baitDurationHours: 24,
    maxDepthM: 25,
    durability: 180,
    maxDurability: 180,
    targetCategories: ['crustacean', 'cephalopod'],
    // 그물 통발에 실제로 드는 저서 어종 — 볼락·우럭·노래미류·문절망둑·붕장어
    targetFishSpecies: [
      'dark_banded_rockfish', 'black_rockfish', 'fat_greenling', 'greenling',
      'yellowfin_goby', 'conger_eel',
      // 도루묵 — 겨울 동해 산란 접안. 10~12월 산란기 통발 포획은 강원 조례 위반(단속 이벤트)
      'sandfish',
    ],
    licenseTier: 'advanced', priceWon: 60000,
  },
];

export function getTrapById(id: string): TrapSpec | undefined {
  return TRAP_DATABASE.find((t) => t.id === id);
}

export function getTrapsByType(type: TrapType): TrapSpec[] {
  return TRAP_DATABASE.filter((t) => t.type === type);
}
