/**
 * @file CastWeather.ts
 * @description 날씨 → 캐스팅·채비 물리 (127차 — PROGRESSION_SURVIVAL_SPEC §3-3 + 사용자 지시 3건)
 *
 * 세 가지를 한곳에서 계산한다.
 *  1) **바람**: `calmMs`(3m/s) 초과분만 작동 — 맞바람이면 비거리가 줄고, 옆바람이면 산포가 커지며,
 *     착수점이 바람 진행 방향으로 밀린다. 뒷바람은 소폭 비거리 이득.
 *  2) **스킬 보정**(`fish_wind`): 바람이 만든 몫만 깎는다. **기본 산포에는 관여하지 않는다** —
 *     사용자 지시대로 "아주 미비한 정도"라 상한(`windCompCap`)도 함께 건다.
 *  3) **강수**: 비 오는 날은 유속이 빨라지고(채비가 더 흐른다) 밑걸림·채비 손실 확률이 오른다.
 *
 * 전부 순수 계산 — 렌더·난수 주입은 호출측(client)이 맡는다.
 */

import { TUNING } from '../config/tuning.js';
import type { WeatherKind } from '../api-client/KmaVilageFcstApiClient.js';

/** 2D 단위 벡터 / 힘 벡터 (화면 좌표계 — y는 아래로 증가) */
export interface Vec2 { x: number; y: number }

/** 캐스팅 날씨 입력 */
export interface CastWeatherInput {
  /** 실측 풍속 (m/s) */
  windSpeedMs: number;
  /**
   * 풍향 (deg) — **기상 관례 = 바람이 불어오는 방향**("북동풍" = 45).
   * 진행 벡터는 여기서 180° 돌려 만든다.
   */
  windFromDeg: number;
  /** 날씨 종류 — 강수 강도 산출 */
  weatherKind?: WeatherKind;
  /** 1시간 강수량 (mm) — 있으면 종류 기반 강도를 보정 */
  rain1hMm?: number;
  /** 바람 보정 스킬 총합 (`fish_wind`의 `wind_comp`) — 0~1, 상한은 tuning */
  windComp?: number;
}

/** 캐스팅·채비에 적용할 날씨 계수 */
export interface CastWeatherEffect {
  /** 비거리 배율 (맞바람 감소 · 뒷바람 소폭 증가) */
  distanceMult: number;
  /** 산포 반경 배율 (옆바람·강수) */
  scatterMult: number;
  /**
   * 비행 중 **횡풍 가속** 단위벡터 × 강도(m/s 초과분·보정 반영).
   * 축(맞바람) 성분은 `distanceMult`가 이미 처리하므로 **여기엔 횡 성분만** 담는다 — 이중 계산 금지.
   */
  crossWind: Vec2;
  /** 바람 진행 방향 단위 벡터 (UI 화살표 공용) */
  windUnit: Vec2;
  /** 조준축 대비 맞바람 성분 (+1 정면 맞바람 · −1 뒷바람) */
  headwind: number;
  /** `calmMs`를 넘은 풍속 초과분 (m/s) */
  excessMs: number;
  /** 강수 강도 0~1 */
  rainIntensity: number;
  /** 조류 세기 배율 (비 → 유속 상승) */
  currentMult: number;
  /** 밑걸림·채비 손실 확률 배율 */
  snagMult: number;
  /** 실제로 무언가 깎이고 있는가 (UI 배지 표시 조건) */
  active: boolean;
}

/** 강수 강도 — 종류 기본값을 실측 강수량(mm/h)으로 보정 */
export function rainIntensityOf(kind?: WeatherKind, rain1hMm?: number): number {
  let base = 0;
  switch (kind) {
    case 'rain': base = 0.6; break;
    case 'shower': base = 1.0; break;
    case 'sleet': base = 0.5; break;
    case 'snow': base = 0.3; break;
    default: base = 0;
  }
  if (base <= 0) return 0;
  if (rain1hMm !== undefined && rain1hMm > 0) {
    // 5mm/h를 '강한 비'로 보고 0.4~1.4배 사이에서 종류 기본값을 조정
    base *= Math.max(0.4, Math.min(1.4, 0.4 + rain1hMm / 5));
  }
  return Math.max(0, Math.min(1, base));
}

/** 풍향(불어오는 방향, deg) → **진행 방향** 단위 벡터 */
export function windUnitFromBearing(fromDeg: number): Vec2 {
  const rad = (fromDeg * Math.PI) / 180;
  // 불어오는 방향의 반대(+180°)가 진행 방향. 화면 y는 아래로 증가하므로 북(0°) 진행 = +y.
  return { x: -Math.sin(rad), y: Math.cos(rad) };
}

function norm(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y);
  return len > 1e-6 ? { x: v.x / len, y: v.y / len } : { x: 1, y: 0 };
}

/**
 * 날씨 계수 산출. `aim`은 조준 단위 벡터(캐스팅 방향) — 없으면 맞바람/옆바람을 반반으로 본다.
 */
export function computeCastWeather(input: CastWeatherInput, aim?: Vec2): CastWeatherEffect {
  const t = TUNING.castWeather;
  const windUnit = windUnitFromBearing(input.windFromDeg);
  const excess = Math.max(0, (input.windSpeedMs ?? 0) - t.calmMs);
  const rainIntensity = rainIntensityOf(input.weatherKind, input.rain1hMm);

  // 스킬 보정은 바람이 만든 몫에만, 그것도 상한까지만 적용한다
  const comp = Math.max(0, Math.min(t.windCompCap, input.windComp ?? 0));
  const windEff = excess * (1 - comp);

  const a = aim ? norm(aim) : undefined;
  // headwind: 조준 방향과 바람 진행 방향이 정반대면 +1(맞바람)
  const headwind = a ? -(a.x * windUnit.x + a.y * windUnit.y) : 0.5;
  const cross = a ? Math.abs(a.x * windUnit.y - a.y * windUnit.x) : 0.5;

  const head = Math.max(0, headwind);
  const tail = Math.max(0, -headwind);
  const distanceMult = Math.max(
    t.distMultMin,
    1 - windEff * t.distPerMs * head + windEff * t.tailGain * tail,
  );

  const scatterMult = Math.min(
    t.scatterMultMax,
    1 + windEff * t.scatterPerMs * (0.4 + 0.6 * cross) + rainIntensity * t.rainScatterGain,
  );

  // 횡 성분만 추출 (조준축에 수직인 투영) — aim이 없으면 바람 전체를 횡으로 본다
  const crossMag = Math.min(t.driftMax, windEff * t.driftPerMs) * (a ? cross : 1);
  const perp = a ? { x: -a.y, y: a.x } : windUnit;
  const sign = a ? Math.sign(windUnit.x * perp.x + windUnit.y * perp.y) || 1 : 1;
  return {
    distanceMult,
    scatterMult,
    crossWind: { x: perp.x * crossMag * sign, y: perp.y * crossMag * sign },
    windUnit,
    headwind,
    excessMs: excess,
    rainIntensity,
    currentMult: 1 + rainIntensity * t.rainCurrentGain,
    snagMult: 1 + rainIntensity * t.rainSnagGain,
    active: excess > 0 || rainIntensity > 0,
  };
}

/**
 * 착수 산포 반경 (px). 거리에 비례하고 **스킬(`cast_scatter`)로 줄어든다**.
 * @param distPx 목표까지 거리
 * @param weatherScatterMult `computeCastWeather().scatterMult`
 * @param skillScatterMult `GameState.skillMult('cast_scatter')` (1 = 무스킬)
 */
export function castScatterRadius(distPx: number, weatherScatterMult = 1, skillScatterMult = 1): number {
  const t = TUNING.castWeather;
  return Math.max(0, distPx * t.baseScatter * weatherScatterMult * Math.max(0, skillScatterMult));
}

/**
 * 목표점 → 실제 착수점. 산포는 **조준축 방향으로 살짝 긴 타원**(거리 오차가 좌우 오차보다 크다).
 * @param rng 0~1 난수 — 테스트에서 고정 가능
 */
export function applyCastScatter(
  target: Vec2, aim: Vec2, radiusPx: number,
  rng: () => number = Math.random,
): Vec2 {
  const a = norm(aim);
  const perp = { x: -a.y, y: a.x };
  // 균등 원판 샘플 → 축 방향 1.3배 / 횡 방향 0.8배로 타원화
  const ang = rng() * Math.PI * 2;
  const r = Math.sqrt(rng()) * radiusPx;
  const along = Math.cos(ang) * r * 1.3;
  const side = Math.sin(ang) * r * 0.8;
  return { x: target.x + a.x * along + perp.x * side, y: target.y + a.y * along + perp.y * side };
}

/** 상태 한 줄 (Ko) — HUD·캐스팅 안내용. 영향이 없으면 빈 문자열 */
export function castWeatherLabelKo(e: CastWeatherEffect): string {
  if (!e.active) return '';
  const parts: string[] = [];
  if (e.excessMs > 0) {
    const d = Math.round((1 - e.distanceMult) * 100);
    if (d >= 3) parts.push(`맞바람 — 비거리 ${d}% 감소`);
    else if (e.distanceMult > 1.02) parts.push('뒷바람 — 비거리 증가');
    else parts.push('옆바람 — 착수점 밀림');
  }
  if (e.rainIntensity > 0) parts.push('강수 — 유속·밑걸림 상승');
  return parts.join(' · ');
}

/** 상태 한 줄 (En) */
export function castWeatherLabelEn(e: CastWeatherEffect): string {
  if (!e.active) return '';
  const parts: string[] = [];
  if (e.excessMs > 0) {
    const d = Math.round((1 - e.distanceMult) * 100);
    if (d >= 3) parts.push(`Headwind — distance ${d}% shorter`);
    else if (e.distanceMult > 1.02) parts.push('Tailwind — extra distance');
    else parts.push('Crosswind — landing pushed');
  }
  if (e.rainIntensity > 0) parts.push('Rain — faster current, more snags');
  return parts.join(' · ');
}
