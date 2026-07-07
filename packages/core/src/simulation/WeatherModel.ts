/**
 * @file WeatherModel.ts
 * @description 날씨 데이터 처리 및 낚시 조건 평가
 */

import type { WeatherData, FishingEnvironment, FishingSpotInfo } from '../types/Environment.js';
import type { TideInfo } from '../types/Environment.js';

/** 날씨 조건으로 낚시 가능 여부 판단 */
export function evaluateFishingSafety(weather: WeatherData): { isSafe: boolean; reason?: string } {
  if (weather.weatherCondition === 'stormy') {
    return { isSafe: false, reason: '폭풍 경보 — 출조 불가 조건입니다.' };
  }
  if (weather.waveHeightM > 2.5) {
    return { isSafe: false, reason: `파고 ${weather.waveHeightM.toFixed(1)}m — 갯바위/방파제 출조 위험.` };
  }
  if (weather.windSpeedMs > 15) {
    return { isSafe: false, reason: `풍속 ${weather.windSpeedMs.toFixed(0)}m/s — 채비 날림 위험.` };
  }
  return { isSafe: true };
}

/** 낚시 최적 시간대 여부 (일출/일몰 ±1시간) */
export function isGoldenHour(date: Date, sunrise: Date, sunset: Date): boolean {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const t = date.getTime();
  return (
    Math.abs(t - sunrise.getTime()) < ONE_HOUR_MS ||
    Math.abs(t - sunset.getTime()) < ONE_HOUR_MS
  );
}

/** 현재 시각이 야간인지 판단 */
export function isNighttime(date: Date, sunrise: Date, sunset: Date): boolean {
  return date < sunrise || date > sunset;
}

/** 종합 낚시 환경 생성 */
export function buildFishingEnvironment(
  spot: FishingSpotInfo,
  tide: TideInfo,
  weather: WeatherData,
  currentTime: Date = new Date(),
): FishingEnvironment {
  const night = isNighttime(currentTime, weather.sunriseAt, weather.sunsetAt);
  const { isSafe, reason } = evaluateFishingSafety(weather);

  return {
    spotId: spot.id,
    locationName: spot.name,
    tide,
    weather,
    currentTime,
    isNighttime: night,
    isSafeForFishing: isSafe,
    unsafeReason: reason,
  };
}

/** 풍향 각도를 텍스트로 변환 */
export function getWindDirectionLabel(degrees: number): string {
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const idx = Math.round(degrees / 45) % 8;
  return `${dirs[idx]}풍`;
}
