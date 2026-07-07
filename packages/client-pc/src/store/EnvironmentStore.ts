/**
 * @file EnvironmentStore.ts
 * @description 환경 데이터 상태 관리 (API 응답 캐시)
 *
 * 날씨/물때 API 데이터를 캐싱하고 UI에 제공합니다.
 * 1시간마다 자동 갱신됩니다.
 */

import type { FishingEnvironment, FishingSpotInfo } from '@tra/core';
import {
  WeatherApiClient,
  OceanApiClient,
  PublicDataClient,
  buildFishingEnvironment,
  getSpotById,
} from '@tra/core';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

export class EnvironmentStoreManager {
  private _environment: FishingEnvironment | null = null;
  private _spots: FishingSpotInfo[] = [];
  private _lastFetched: number = 0;

  private weatherClient = new WeatherApiClient(import.meta.env.VITE_KMA_API_KEY as string | undefined);
  private oceanClient = new OceanApiClient(import.meta.env.VITE_KHOA_API_KEY as string | undefined);
  private spotClient = new PublicDataClient(import.meta.env.VITE_PUBLIC_DATA_API_KEY as string | undefined);

  /** 현재 환경 데이터 (없으면 null) */
  get environment(): FishingEnvironment | null {
    return this._environment;
  }

  /** 낚시터 목록 */
  get spots(): FishingSpotInfo[] {
    return this._spots;
  }

  /** 캐시 만료 여부 */
  get isStale(): boolean {
    return Date.now() - this._lastFetched > CACHE_TTL_MS;
  }

  /**
   * 특정 낚시터의 환경 데이터를 갱신합니다.
   */
  async fetchEnvironment(spotId: string): Promise<FishingEnvironment | null> {
    const spot = getSpotById(spotId) ?? this._spots.find((s) => s.id === spotId);
    if (!spot) {
      console.warn(`[EnvironmentStore] Unknown spotId: ${spotId}`);
      return null;
    }

    try {
      const [tide, weather] = await Promise.all([
        this.oceanClient.fetchTideInfo(spotId),
        this.weatherClient.fetchCurrentWeather(spot.latitude, spot.longitude),
      ]);

      this._environment = buildFishingEnvironment(spot, tide, weather);
      this._lastFetched = Date.now();
      return this._environment;
    } catch (e) {
      console.error('[EnvironmentStore] fetch failed:', e);
      return null;
    }
  }

  /**
   * 전체 낚시터 목록을 로드합니다.
   */
  async fetchSpots(): Promise<FishingSpotInfo[]> {
    try {
      this._spots = await this.spotClient.fetchFishingSpots();
      return this._spots;
    } catch (e) {
      console.error('[EnvironmentStore] spot fetch failed:', e);
      return [];
    }
  }
}

export const EnvironmentStore = new EnvironmentStoreManager();
