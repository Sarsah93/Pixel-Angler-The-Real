/**
 * @file mockFishingSpots.ts
 * @description 낚시터 Mock 데이터 (API 키 없이 개발 시 사용)
 *
 * 실제 공공데이터 API 응답 포맷을 모사합니다.
 */

import type { FishingSpotInfo } from '../../types/Environment.js';
import { SPOT_DATABASE } from '../../db-schema/SpotDatabase.js';

/** 전체 낚시터 Mock 목록 반환 */
export function getMockFishingSpots(): FishingSpotInfo[] {
  return SPOT_DATABASE;
}

/** 지역별 낚시터 Mock 반환 */
export function getMockSpotsByRegion(regionCode: string): FishingSpotInfo[] {
  return SPOT_DATABASE.filter((s) => s.regionCode === regionCode);
}

/** ID로 낚시터 Mock 반환 */
export function getMockSpotById(id: string): FishingSpotInfo | undefined {
  return SPOT_DATABASE.find((s) => s.id === id);
}
