/**
 * @file NextDayHint.ts
 * @description 하루 결산 끝 「내일 할 만한 것」 한 줄 (212차 — 사용자 지시).
 *
 * 무엇을 권할지는 core `planNextDay`가 고르고(물때 세기 · 만조/간조 · 파고 · 비), 이 파일은
 * 그 하루의 물때(core `calculateTideInfo`)와 기상청 예보(`ExternalDataStore`)를 모아 넘긴 뒤
 * **주인공의 생각**으로 한 문장을 쓴다. 라디오 방송(`RadioBroadcast`)처럼 가변 수치가 많아 로케일별로 직접 쓴다.
 *
 * 「다음 날」은 하루 경계(새벽 4시) 기준이다 — 새벽 2시에 잠들면 다음 날은 그날 낮이다.
 * 다음 날이 이미 지났으면(오래된 장) 줄을 만들지 않는다. 예보는 실제 오늘 · 내일만 있으므로 그 밖의 날은 물때만 말한다.
 */

import {
  calculateTideInfo, kstParts, kstYmd, logicalYmd, nextDayOf, planNextDay, TUNING, WEATHER_LABEL,
  type DayLedgerPage, type WeatherKind,
} from '@tra/core';
import { ExternalDataStore } from '../store/ExternalDataStore.js';

const WEATHER_EN: Record<WeatherKind, string> = {
  clear: 'clear', partly: 'partly cloudy', cloudy: 'overcast', rain: 'rain',
  sleet: 'sleet', snow: 'snow', shower: 'showers', fog: 'fog',
};
const WET: WeatherKind[] = ['rain', 'sleet', 'snow', 'shower'];

const TIDE_NOTE_EN: Record<string, string> = {
  '사리 진입': 'spring tide rising', '사리': 'spring tide', '사리 최강': 'peak spring tide',
  '조금 진입': 'neap tide coming', '조금': 'neap tide', '무시': 'slack tide',
};
function tideLabelEn(label: string): string {
  const m = /^(\d+)물(?: \((.+)\))?$/.exec(label);
  return m ? `tide day ${m[1]}${m[2] ? ` (${TIDE_NOTE_EN[m[2]] ?? m[2]})` : ''}` : label;
}

/** 'YYYYMMDD' 정오(KST) */
function noonOf(ymd: string): Date {
  return new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)), 3, 0, 0));
}
const minOf = (d: Date): number => { const p = kstParts(d); return Number(p.hh) * 60 + Number(p.mi); };
const hm = (m: number): string => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

export interface NextDayHint {
  /** 'today' = 그 다음 날이 바로 오늘(자정에 닫힌 장) · 'tomorrow' */
  when: 'today' | 'tomorrow';
  /** 머리 — 「내일」/「오늘」 */
  label: string;
  /** 한 문장 */
  text: string;
  /** 검증용 — 고른 갈래 */
  kind: string;
}

/**
 * 장 하나에 붙일 「내일 할 만한 것」. 그 다음 날이 이미 지났으면 null.
 * @param regionId 날씨를 볼 바다(장에서 마지막으로 다닌 지역 — 없으면 속초)
 */
export function buildNextDayHint(p: DayLedgerPage, locale: 'ko' | 'en', regionId?: string, nowMs = Date.now()): NextDayHint | null {
  const target = nextDayOf(p);
  const cur = logicalYmd(nowMs);
  if (target < cur) return null;
  const when: NextDayHint['when'] = target === cur ? 'today' : 'tomorrow';
  const en = locale === 'en';

  // ── 물때 — 그날 + 다음 날 새벽(밤 간조) ──
  const tide = calculateTideInfo(noonOf(target));
  const nextYmd = kstYmd(new Date(noonOf(target).getTime() + 86400000));
  const tideNext = calculateTideInfo(noonOf(nextYmd));
  const sameDay = (d: Date, ymd: string): boolean => kstYmd(d) === ymd;
  const highs = tide.highTideTimes.filter((d) => sameDay(d, target)).map(minOf);
  const lows = [
    ...tide.lowTideTimes.filter((d) => sameDay(d, target)).map(minOf),
    ...tideNext.lowTideTimes.filter((d) => sameDay(d, nextYmd)).map((d) => 1440 + minOf(d)),
  ];

  // ── 날씨 — 실제 오늘이면 지금 실황, 실제 내일이면 단기예보 ──
  const w = ExternalDataStore.getKmaWeather(regionId ?? 'gangwon_sokcho') ?? ExternalDataStore.getKmaWeather('gangwon_sokcho');
  let kind: WeatherKind | undefined;
  let waveM: number | undefined;
  let popPct: number | undefined;
  if (w && target === kstYmd(new Date(nowMs))) { kind = w.kind; waveM = w.waveHeightM; }
  else if (w?.tomorrow && w.tomorrow.date === target) { kind = w.tomorrow.kind; waveM = w.tomorrow.waveMaxM; popPct = w.tomorrow.popMaxPct; }

  const plan = planNextDay({
    currentStrength: tide.currentStrength, highTimesMin: highs, lowTimesMin: lows,
    waveMaxM: waveM, popMaxPct: popPct, wet: kind ? WET.includes(kind) : false,
    maxSafeWaveM: TUNING.forage.maxWaveM,
  });

  // ── 머리 — 물때 · 날씨 · 파고 ──
  const bits: string[] = [en ? tideLabelEn(tide.tidePhaseLabel) : tide.tidePhaseLabel];
  if (kind) bits.push(en ? WEATHER_EN[kind] : WEATHER_LABEL[kind]);
  if (waveM !== undefined) bits.push(en ? `waves ${waveM.toFixed(1)} m` : `파고 ${waveM.toFixed(1)}m`);
  const joined = bits.join(en ? ', ' : ' · ');
  const head = en ? joined.charAt(0).toUpperCase() + joined.slice(1) : joined;
  const at = plan.atMin !== undefined ? hm(plan.atMin) : '';
  const atKo = at ? ` ${at}` : '';
  const atEn = at ? ` at ${at}` : '';

  const advice = en
    ? {
      stormy: 'Rough seas — stay in, clean what is left in the cooler and fix up the rigs.',
      night_forage: `A big low tide after dark at ${at} — grab a lantern and go foraging.`,
      spring_tide: `Strong current. Rig heavy and fish either side of high water${atEn}.`,
      neap_tide: 'Slow water. Drift a light float rig, nice and easy.',
      good_tide: `The water moves just right — the two hours around high water${atEn} should bring bites.`,
    }[plan.kind]
    : {
      stormy: '바다가 거칠 것 같다 — 나가지 말고 쿨러에 남은 고기를 손질하거나 채비를 손보자.',
      night_forage: `밤 간조 ${at}에 물이 크게 빠진다 — 랜턴 챙겨 해루질 나가 볼까.`,
      spring_tide: `물살이 세다. 무거운 채비로 만조${atKo} 앞뒤를 노려 보자.`,
      neap_tide: '물이 느리다. 가벼운 찌 채비로 천천히 흘려 보자.',
      good_tide: `물이 알맞게 돈다. 만조${atKo} 앞뒤 두 시간이 입질 보기 좋겠다.`,
    }[plan.kind];

  const label = en ? (when === 'today' ? 'Today' : 'Tomorrow') : (when === 'today' ? '오늘' : '내일');
  return { when, label, text: `${head}. ${advice}`, kind: plan.kind };
}
