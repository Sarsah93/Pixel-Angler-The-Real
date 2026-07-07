/**
 * @file mockWeather.ts
 * @description 날씨 Mock 데이터 (API 키 없이 개발 시 사용)
 */

import type { WeatherData } from '../../types/Environment.js';

/** 거제 현재 날씨 Mock 데이터 */
export function getMockWeatherData(overrides?: Partial<WeatherData>): WeatherData {
  const now = new Date();
  const sunrise = new Date(now);
  sunrise.setHours(5, 48, 0, 0);
  const sunset = new Date(now);
  sunset.setHours(19, 32, 0, 0);

  return {
    temperatureC: 24,
    seaSurfaceTempC: 22,
    windSpeedMs: 3.5,
    windDirectionDeg: 225,
    windDirectionLabel: '남서풍',
    waveHeightM: 0.3,
    visibilityKm: 15,
    isPrecipitating: false,
    precipitationMmPerHour: 0,
    weatherCondition: 'partly_cloudy',
    measuredAt: now,
    sunriseAt: sunrise,
    sunsetAt: sunset,
    ...overrides,
  };
}

/** 악천후 Mock (출조 불가 테스트용) */
export function getMockStormData(): WeatherData {
  return getMockWeatherData({
    windSpeedMs: 20,
    waveHeightM: 3.5,
    weatherCondition: 'stormy',
  });
}

/** 야간 Mock */
export function getMockNightWeatherData(): WeatherData {
  const now = new Date();
  now.setHours(22, 0, 0, 0);
  const sunrise = new Date(now);
  sunrise.setDate(sunrise.getDate() + 1);
  sunrise.setHours(5, 48, 0, 0);
  const sunset = new Date(now);
  sunset.setHours(19, 32, 0, 0);

  return getMockWeatherData({
    temperatureC: 19,
    seaSurfaceTempC: 21,
    measuredAt: now,
    sunriseAt: sunrise,
    sunsetAt: sunset,
  });
}
