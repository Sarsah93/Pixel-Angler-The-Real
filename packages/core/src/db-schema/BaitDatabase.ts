/**
 * @file BaitDatabase.ts
 * @description 미끼 및 집어제 데이터베이스
 */

import type { BaitItem } from '../types/Gear.js';

export const BAIT_DATABASE: BaitItem[] = [
  // 구입 미끼
  {
    id: 'bait_sandworm_fresh',
    name: '청갯지렁이 (청충)',
    category: 'sandworm',
    baseEffectiveness: 85,
    isConsumable: true,
    canBeForaged: false,
  },
  {
    id: 'bait_earthworm',
    name: '지렁이',
    category: 'earthworm',
    baseEffectiveness: 60,
    isConsumable: true,
    canBeForaged: false,
  },
  {
    id: 'bait_squid_strip',
    name: '오징어 살',
    category: 'squid',
    baseEffectiveness: 70,
    isConsumable: true,
    canBeForaged: false,
  },
  {
    id: 'bait_prawn_live',
    name: '살아있는 새우',
    category: 'prawn',
    baseEffectiveness: 80,
    isConsumable: true,
    canBeForaged: false,
  },
  // 채집 미끼
  {
    id: 'bait_mussel_foraged',
    name: '홍합 (채집)',
    category: 'mussel',
    baseEffectiveness: 75,
    isConsumable: true,
    canBeForaged: true,
    foragingSpotType: 'breakwater',
  },
  {
    id: 'bait_barnacle_foraged',
    name: '거북손 (채집)',
    category: 'barnacle',
    baseEffectiveness: 90,
    isConsumable: true,
    canBeForaged: true,
    foragingSpotType: 'rocky_shore',
  },
  {
    id: 'bait_crab_foraged',
    name: '돌게 (채집)',
    category: 'crab',
    baseEffectiveness: 88,
    isConsumable: true,
    canBeForaged: true,
    foragingSpotType: 'rocky_shore',
  },
  // 집어제
  {
    id: 'bait_groundbait_okiami',
    name: '오키아미 집어제',
    category: 'ground_bait',
    baseEffectiveness: 30,
    isConsumable: true,
    canBeForaged: false,
  },
  // 루어/인조
  {
    id: 'lure_metal_jig_100g',
    name: '메탈지그 100g',
    category: 'artificial_lure',
    baseEffectiveness: 65,
    isConsumable: false,
    canBeForaged: false,
  },
  {
    id: 'lure_metal_jig_200g',
    name: '메탈지그 200g',
    category: 'artificial_lure',
    baseEffectiveness: 65,
    isConsumable: false,
    canBeForaged: false,
  },
  {
    id: 'lure_spoon_20g',
    name: '스푼 20g',
    category: 'artificial_lure',
    baseEffectiveness: 55,
    isConsumable: false,
    canBeForaged: false,
  },
];

export function getBaitById(id: string): BaitItem | undefined {
  return BAIT_DATABASE.find((b) => b.id === id);
}

export function getForagableBaits(): BaitItem[] {
  return BAIT_DATABASE.filter((b) => b.canBeForaged);
}
