/**
 * @file WeatherSound.ts
 * @description 253차 — 날씨 → 환경음 세기(비 · 바람 · 천둥 · 0~1). `Ambience.setAmbience`에 넘긴다.
 *
 * 사용자 지시(253차) 「비만 올 때, 비와 천둥이 같이 칠 때, 바람이 강하게 불 때 — 효과음으로 넣어 주는 게 좋을지도」
 * → 비 배경 음악 곡을 빼고, 기상 실데이터를 따라 움직이는 환경음으로 한다.
 *  - 비: 날씨 종류가 비 · 소나기 · 진눈깨비일 때. 시간당 강수(mm)가 있으면 그 굵기로
 *    (1mm ≈ 0.43 · 3mm ≈ 0.55 · 15mm ≈ 0.81 · 50mm 이상 = 1), 아직 0으로 잡히면(막 내리기 시작) 종류별 기본값.
 *    진눈깨비는 0.7배(덜 튄다). 눈은 소리가 없다.
 *  - 바람: 풍속 4m/s 아래는 0 → 17m/s에서 1(11m/s 언저리부터 「휘잉」이 얹힌다 — 풍랑 · 강풍 주의보 14m/s).
 *    관측이 없는 곳(홈타운)은 날씨 종류로 가늠한다.
 *  - 천둥: 소나기(대류성 — 천둥 번개가 흔하다)는 0.55, 거기에 시간당 10mm 이상이면 0.8.
 *    보통 비라도 시간당 15mm 이상이면 0.5 · 30mm 이상이면 0.8. 맑은 날 천둥은 없다(번개 자료는 받지 않는다).
 */

import type { WeatherKind } from '@tra/core';
import { ExternalDataStore } from '../store/ExternalDataStore.js';

export interface WeatherSound {
  rain: number;
  wind: number;
  thunder: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** 관측 풍속이 없을 때 날씨 종류로 가늠한 바람(홈타운) */
const KIND_WIND: Partial<Record<WeatherKind, number>> = { cloudy: 0.1, rain: 0.2, sleet: 0.25, snow: 0.2, shower: 0.4 };

/** 순수 판정 — 날씨 종류 · 시간당 강수(mm) · 풍속(m/s) → 세기 */
export function weatherSoundFrom(kind: WeatherKind, rain1hMm?: number, windMs?: number): WeatherSound {
  const mm = typeof rain1hMm === 'number' && rain1hMm > 0 ? rain1hMm : 0;
  let rain = 0;
  if (kind === 'rain' || kind === 'shower' || kind === 'sleet') {
    const base = mm > 0 ? Math.max(0.25, 0.3 + 0.42 * Math.log10(1 + mm)) : kind === 'shower' ? 0.75 : kind === 'sleet' ? 0.5 : 0.55;
    rain = clamp01(base * (kind === 'sleet' ? 0.7 : 1));
  }
  const wind = typeof windMs === 'number' ? clamp01((windMs - 4) / 13) : KIND_WIND[kind] ?? 0;
  let thunder = 0;
  if (kind === 'shower') thunder = mm >= 10 ? 0.8 : 0.55;
  else if (kind === 'rain') thunder = mm >= 30 ? 0.8 : mm >= 15 ? 0.5 : 0;
  return { rain, wind, thunder };
}

/** 지역의 지금 날씨 → 세기(정본 날씨 카드가 있으면 그 값 — 같은 세계의 모두가 같은 비를 듣는다) */
export function weatherSoundLevels(regionId: string): WeatherSound {
  const kind = ExternalDataStore.getWeatherKind(regionId);
  if (regionId === 'hometown') return weatherSoundFrom(kind);
  const kma = ExternalDataStore.getKmaWeather(regionId);
  const marine = ExternalDataStore.getRegionMarineWeather(regionId);
  return weatherSoundFrom(kind, kma?.rain1hMm, kma?.windSpeedMs ?? marine?.windSpeedMs);
}
