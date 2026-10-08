/**
 * @file SessionWeather.ts
 * @description 세션 정본 날씨 카드 (234차) — 같은 세션이면 같은 시간대에 **같은 하늘**을 본다.
 *
 * 왜: 날씨는 각자 브라우저가 기상청 · 해양기상 API에서 받는다. 받은 시각이 다르면(한 시간 전에 켠 사람 ·
 * 방금 켠 사람) 값이 갈리고, 날씨는 피딩 활성도를 거쳐 **공용 시드 보일링 · 스쿨링 스케줄**까지 바꾼다.
 * 그래서 한쪽에만 보일링이 뜨고, 한쪽은 비 오는 화면 · 한쪽은 맑은 화면이 됐다(231차 감사).
 *
 * 규칙:
 * - 지역 × 1시간 슬롯마다 카드 한 장. **그 슬롯에 실데이터를 먼저 받은 사람**의 카드가 정본이다
 *   (공유 소비 채널 `w:<지역>|<슬롯>` · 먼저 닿은 사람이 임자 — 232차 채널 재사용).
 * - 카드는 짧은 문자열로 싣는다(`encodeWeatherCard` — 서버는 뜻을 모른다).
 * - 공용 추첨(보일링 등)에 들어가는 날씨는 한 번 더 **구간화**한다(`sharedWeatherKind` · `quantizeShared`) —
 *   카드가 아직 안 왔거나 실데이터가 조금 달라도 같은 칸에 떨어지게.
 */

import type { WeatherKind } from '../api-client/KmaVilageFcstApiClient.js';

/** 정본 날씨 한 장 — 화면 · 판정이 실제로 읽는 값만 */
export interface SessionWeatherCard {
  kind: WeatherKind;
  /** 풍속 (m/s) */
  windMs?: number;
  /** 풍향 (deg) */
  windDeg?: number;
  /** 파고 (m) */
  waveM?: number;
  /** 기온 (°C) */
  airC?: number;
  /** 1시간 강수량 (mm) */
  rainMm?: number;
  /** 수온 (°C) */
  waterC?: number;
  /** 시정 (m) */
  visM?: number;
}

/** 카드 한 장이 맡는 시간 — 기상청 실황 갱신 주기(1시간)와 같다 */
export const SESSION_WEATHER_SLOT_MS = 3_600_000;

const KINDS: readonly WeatherKind[] = ['clear', 'partly', 'cloudy', 'rain', 'sleet', 'snow', 'shower', 'fog'];

/** 공유 채널 키 */
export function sessionWeatherKey(regionId: string, slot: number): string {
  return `w:${regionId}|${slot}`;
}

/** 숫자 필드 → 짧은 이름 · 허용 범위(벗어나면 버린다 — 깨진 값이 남의 화면을 망치지 않게) */
const NUM_FIELDS: readonly { k: keyof Omit<SessionWeatherCard, 'kind'>; s: string; min: number; max: number; dp: number }[] = [
  { k: 'windMs', s: 'ws', min: 0, max: 80, dp: 1 },
  { k: 'windDeg', s: 'wd', min: 0, max: 360, dp: 0 },
  { k: 'waveM', s: 'wv', min: 0, max: 20, dp: 1 },
  { k: 'airC', s: 'ta', min: -40, max: 50, dp: 1 },
  { k: 'rainMm', s: 'r', min: 0, max: 300, dp: 1 },
  { k: 'waterC', s: 'tw', min: -5, max: 40, dp: 1 },
  { k: 'visM', s: 'v', min: 0, max: 100_000, dp: 0 },
];

/** 카드 → 문자열 (`k=rain,ws=6.2,wv=1.1` — 160자 안) */
export function encodeWeatherCard(c: SessionWeatherCard): string {
  const parts = [`k=${c.kind}`];
  for (const f of NUM_FIELDS) {
    const v = c[f.k];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    parts.push(`${f.s}=${Number(Math.min(f.max, Math.max(f.min, v)).toFixed(f.dp))}`);
  }
  return parts.join(',');
}

/** 문자열 → 카드. 날씨 종류가 없거나 모르는 값이면 null(그 카드는 쓰지 않는다) */
export function decodeWeatherCard(s: string | undefined | null): SessionWeatherCard | null {
  if (!s || typeof s !== 'string' || s.length > 400) return null;
  const map = new Map<string, string>();
  for (const part of s.split(',')) {
    const i = part.indexOf('=');
    if (i > 0) map.set(part.slice(0, i), part.slice(i + 1));
  }
  const kind = map.get('k') as WeatherKind | undefined;
  if (!kind || !KINDS.includes(kind)) return null;
  const card: SessionWeatherCard = { kind };
  for (const f of NUM_FIELDS) {
    const raw = map.get(f.s);
    if (raw === undefined) continue;
    const v = Number(raw);
    if (Number.isFinite(v) && v >= f.min && v <= f.max) card[f.k] = v;
  }
  return card;
}

/**
 * 공용 추첨용 날씨 종류(구간화). 피딩 판정이 실제로 구분하는 갈래로만 접는다 —
 * 맑음 / 구름(구름많음 · 흐림 — 판정이 같다) / 비(비 · 소나기 — 판정이 같다) / 눈(눈 · 진눈깨비) / 안개.
 * 같은 갈래 안에서 표시만 다른 값은 같은 답을 낸다.
 */
export function sharedWeatherKind(kind: string | undefined): WeatherKind {
  switch (kind) {
    case 'partly': case 'cloudy': return 'cloudy';
    case 'rain': case 'shower': return 'rain';
    case 'snow': case 'sleet': return 'snow';
    case 'fog': return 'fog';
    default: return 'clear';
  }
}

/**
 * 공용 추첨에 들어가는 연속값의 구간화 — 기기마다 부동소수 끝자리가 달라도 같은 칸에 떨어지게.
 * (`Math.pow` · 삼각함수는 브라우저 엔진마다 마지막 자리가 다를 수 있다.)
 */
export function quantizeShared(v: number, step = 0.01): number {
  return Math.round(v / step) * step;
}
