/**
 * @file SpotDatabase.ts
 * @description 낚시터 스팟 데이터베이스 (공공데이터 API 연동 전 초기 데이터)
 *
 * 실제 한국 바다 낚시터 정보를 기반으로 한 초기 시드 데이터.
 * API 연동 후에는 이 데이터를 기반으로 API 데이터가 병합됩니다.
 */

import type { FishingSpotInfo } from '../types/Environment.js';

export const SPOT_DATABASE: FishingSpotInfo[] = [
  // ─────────────────────────────────────────────
  // 경남 거제
  // ─────────────────────────────────────────────
  {
    id: 'geoje_gujora_breakwater',
    name: '거제 구조라 방파제',
    regionCode: 'gyeongnam_geoje',
    regionName: '경남 거제시',
    latitude: 34.7832,
    longitude: 128.6834,
    spotType: 'breakwater',
    mainSpeciesIds: ['largescale_blackfish', 'black_seabream', 'black_rockfish'],
    isOperational: true,
    isRestricted: false,
    facilities: ['parking', 'restroom', 'bait_shop', 'sashimi_restaurant'],
    hasRentalService: true,
    hasNearbyTackleShop: true,
    hasNearbyConvenienceStore: true,
    description: '거제도 대표 방파제. 벵에돔 토너먼트가 자주 개최되는 명소. 테트라포드 끝자락이 포인트.',
  },
  {
    id: 'geoje_mangchi_rocky',
    name: '거제 망치 갯바위',
    regionCode: 'gyeongnam_geoje',
    regionName: '경남 거제시',
    latitude: 34.7521,
    longitude: 128.5612,
    spotType: 'rocky_shore',
    mainSpeciesIds: ['largescale_blackfish', 'japanese_amberjack', 'yellowtail'],
    isOperational: true,
    isRestricted: false,
    facilities: ['parking'],
    hasRentalService: false,
    hasNearbyTackleShop: false,
    hasNearbyConvenienceStore: false,
    description: '거제 최고의 벵에돔 갯바위. 배를 타고 출조해야 하는 외도 코스. 물때 잘 맞으면 대물이 쏟아진다.',
  },
  // ─────────────────────────────────────────────
  // 강원 양양
  // ─────────────────────────────────────────────
  {
    id: 'yangyang_naksansa_breakwater',
    name: '양양 낙산 방파제',
    regionCode: 'gangwon_yangyang',
    regionName: '강원 양양군',
    latitude: 38.0832,
    longitude: 128.6297,
    spotType: 'breakwater',
    mainSpeciesIds: ['hairtail', 'black_seabream'],
    isOperational: true,
    isRestricted: false,
    facilities: ['parking', 'restroom', 'convenience_store'],
    hasRentalService: true,
    hasNearbyTackleShop: true,
    hasNearbyConvenienceStore: true,
    description: '동해 대표 관광낚시터. 야간 갈치 낚시로 유명하며 여름 피크 시즌에는 자리 경쟁이 치열하다.',
  },
  // ─────────────────────────────────────────────
  // 제주
  // ─────────────────────────────────────────────
  {
    id: 'jeju_seongsan_breakwater',
    name: '제주 성산 방파제',
    regionCode: 'jeju',
    regionName: '제주특별자치도 서귀포시',
    latitude: 33.4553,
    longitude: 126.9353,
    spotType: 'breakwater',
    mainSpeciesIds: ['largescale_blackfish', 'japanese_amberjack'],
    isOperational: true,
    isRestricted: false,
    facilities: ['parking', 'restroom', 'sashimi_restaurant', 'bait_shop'],
    hasRentalService: true,
    hasNearbyTackleShop: true,
    hasNearbyConvenienceStore: true,
    description: '제주 성산일출봉 근처. 수질이 맑아 조황이 좋으며 부시리 지깅도 활발하다.',
  },
  // ─────────────────────────────────────────────
  // 전남 여수
  // ─────────────────────────────────────────────
  {
    id: 'yeosu_odongdo_boat',
    name: '여수 오동도 앞 선상',
    regionCode: 'jeonnam_yeosu',
    regionName: '전남 여수시',
    latitude: 34.7395,
    longitude: 127.7561,
    spotType: 'boat_fishing',
    mainSpeciesIds: ['hairtail', 'yellowtail', 'black_seabream'],
    isOperational: true,
    isRestricted: false,
    facilities: ['parking', 'restroom'],
    hasRentalService: false,
    hasNearbyTackleShop: true,
    hasNearbyConvenienceStore: true,
    description: '여수 선상 낚시의 메카. 선장님 가이드로 갈치 및 감성돔 선상 포인트를 누빈다.',
  },
];

export function getSpotById(id: string): FishingSpotInfo | undefined {
  return SPOT_DATABASE.find((s) => s.id === id);
}

export function getSpotsByRegion(regionCode: string): FishingSpotInfo[] {
  return SPOT_DATABASE.filter((s) => s.regionCode === regionCode);
}

export function getSpotsByType(type: FishingSpotInfo['spotType']): FishingSpotInfo[] {
  return SPOT_DATABASE.filter((s) => s.spotType === type);
}
