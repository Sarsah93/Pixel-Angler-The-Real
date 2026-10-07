/**
 * @file RadioBroadcast.ts
 * @description 집 라디오 「바다 날씨와 물때」 방송 원고 (190차)
 *
 * 190차 사용자 지시 「라디오 물때 방송 — 아버지가 소파에서 듣던 그 방송으로 오늘·내일 물때와 날씨 예보를 알려 준다」.
 *  - 물때: core `calculateTideInfo` (오늘·내일 정오 KST 기준 — 만조·간조 시각, 물때 이름, 조류 세기).
 *  - 날씨: `ExternalDataStore`의 기상청 실황(지금) + 단기예보 내일 요약(`KmaWeatherInfo.tomorrow`). 없는 값은 말하지 않는다.
 *  - 원고는 **아나운서의 말**이라 로케일별로 직접 쓴다(가변 수치가 많아 사전 키로 옮기기 어렵다).
 */

import {
  calculateTideInfo, getLunarDayDisplay, kstParts, WEATHER_LABEL, toxinBanLabel,
  type KmaWeatherInfo, type KmaDailyOutlook, type WeatherKind,
} from '@tra/core';
import { ExternalDataStore } from '../store/ExternalDataStore.js';

const WEATHER_EN: Record<WeatherKind, string> = {
  clear: 'clear', partly: 'partly cloudy', cloudy: 'overcast', rain: 'rain',
  sleet: 'sleet', snow: 'snow', shower: 'showers', fog: 'fog',
};
const DOW_EN: Record<string, string> = { 일: 'Sunday', 월: 'Monday', 화: 'Tuesday', 수: 'Wednesday', 목: 'Thursday', 금: 'Friday', 토: 'Saturday' };
const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 방송에 나오는 바다 — 기상청 지역 id */
const SEAS: { id: string; ko: string; en: string }[] = [
  { id: 'gangwon_sokcho', ko: '동해 중부, 속초 앞바다', en: 'Off Sokcho, on the central East Sea' },
  { id: 'busan', ko: '남해 동부, 부산 앞바다', en: 'Off Busan, on the eastern South Sea' },
];

const hm = (d: Date): string => { const p = kstParts(d); return `${p.hh}:${p.mi}`; };

/** 물때 이름 영문 — '8물 (사리 최강)' → 'tide day 8 (peak spring tide)' */
const TIDE_NOTE_EN: Record<string, string> = {
  '사리 진입': 'spring tide rising', '사리': 'spring tide', '사리 최강': 'peak spring tide',
  '조금 진입': 'neap tide coming', '조금': 'neap tide', '무시': 'slack tide',
};
function tideLabelEn(label: string): string {
  const m = /^(\d+)물(?: \((.+)\))?$/.exec(label);
  if (!m) return label;
  return `tide day ${m[1]}${m[2] ? ` (${TIDE_NOTE_EN[m[2]] ?? m[2]})` : ''}`;
}

/** KST 그날 정오 */
function noonKst(offsetDays: number, now = new Date()): Date {
  const p = kstParts(new Date(now.getTime() + offsetDays * 86400000));
  return new Date(Date.UTC(Number(p.y), Number(p.mo) - 1, Number(p.d), 3, 0, 0));
}

function tideLine(date: Date, en: boolean, today: boolean): string {
  const t = calculateTideInfo(date);
  const hi = t.highTideTimes.map(hm), lo = t.lowTideTimes.map(hm);
  const label = en ? tideLabelEn(t.tidePhaseLabel) : t.tidePhaseLabel;
  if (en) {
    const lead = today ? `Today's tide: ${label}.` : `Tomorrow: ${label}.`;
    return `${lead} High water at ${hi.join(' and ')}, low water at ${lo.join(' and ')}.${today ? ` ${tideCommentEn(t.currentStrength)}` : ''}`;
  }
  const lead = today ? `오늘 물때는 ${label}입니다.` : `내일은 ${label}입니다.`;
  return `${lead} 만조는 ${hi.join(' · ')}, 간조는 ${lo.join(' · ')}입니다.${today ? ` ${tideCommentKo(t.currentStrength)}` : ''}`;
}

function tideCommentKo(strength: number): string {
  if (strength >= 0.85) return '사리 무렵이라 물살이 거셉니다. 갯바위에서는 발밑을 조심하시고, 채비는 무겁게 쓰시기 바랍니다.';
  if (strength >= 0.5) return '물이 알맞게 흘러 입질 보기 좋은 물때입니다.';
  return '조금 무렵이라 물이 느립니다. 가벼운 채비가 잘 듭니다.';
}

function tideCommentEn(strength: number): string {
  if (strength >= 0.85) return 'Spring tide — the current runs hard. Mind your footing on the rocks and rig heavy.';
  if (strength >= 0.5) return 'The water moves just right — a good tide for bites.';
  return 'Neap tide — the water is slow. Light rigs work well.';
}

function nowPart(w: KmaWeatherInfo, en: boolean): string {
  const bits: string[] = [];
  if (w.tempC !== undefined) bits.push(en ? `${Math.round(w.tempC)}°C` : `기온 ${Math.round(w.tempC)}도`);
  if (w.waveHeightM !== undefined) bits.push(en ? `waves ${w.waveHeightM.toFixed(1)} m` : `파고 ${w.waveHeightM.toFixed(1)}미터`);
  const kind = en ? WEATHER_EN[w.kind] : WEATHER_LABEL[w.kind];
  return en ? `${kind}${bits.length ? `, ${bits.join(', ')}` : ''}` : `${kind}${bits.length ? `, ${bits.join(', ')}` : ''}`;
}

function tomorrowPart(o: KmaDailyOutlook, en: boolean): string {
  const bits: string[] = [];
  if (o.tempMinC !== undefined && o.tempMaxC !== undefined) {
    bits.push(en ? `${Math.round(o.tempMinC)} to ${Math.round(o.tempMaxC)}°C` : `기온 ${Math.round(o.tempMinC)}~${Math.round(o.tempMaxC)}도`);
  }
  if (o.popMaxPct !== undefined) bits.push(en ? `${Math.round(o.popMaxPct)}% chance of rain` : `강수확률 ${Math.round(o.popMaxPct)}%`);
  if (o.waveMaxM !== undefined) bits.push(en ? `waves up to ${o.waveMaxM.toFixed(1)} m` : `파고 최고 ${o.waveMaxM.toFixed(1)}미터`);
  const kind = en ? WEATHER_EN[o.kind] : WEATHER_LABEL[o.kind];
  return `${kind}${bits.length ? `, ${bits.join(', ')}` : ''}`;
}

/** 방송 원고 — 단락 배열 (MonologuePanel이 한 단락씩 타이핑한다) */
export function buildRadioBroadcast(locale: 'ko' | 'en', now = new Date()): string[] {
  const en = locale === 'en';
  const p = kstParts(now);
  const lunar = getLunarDayDisplay(noonKst(0, now));
  const out: string[] = [];
  out.push(en
    ? `(Static…) This is the sea weather and tide report. Today is ${DOW_EN[p.dow] ?? ''}, ${MONTH_EN[Number(p.mo) - 1]} ${p.d} — day ${lunar} of the lunar month.`
    : `(지지직…) 바다 날씨와 물때를 전해 드리는 시간입니다. 오늘은 ${p.mo}월 ${p.d}일 ${p.dow}요일, 음력 ${lunar}일입니다.`);
  out.push(tideLine(noonKst(0, now), en, true));
  out.push(tideLine(noonKst(1, now), en, false));
  for (const sea of SEAS) {
    const w = ExternalDataStore.getKmaWeather(sea.id);
    if (!w) continue;
    const head = en ? `${sea.en}: right now ${nowPart(w, true)}.` : `${sea.ko}는 지금 ${nowPart(w, false)}입니다.`;
    const tail = w.tomorrow
      ? (en ? ` Tomorrow, ${tomorrowPart(w.tomorrow, true)}.` : ` 내일은 ${tomorrowPart(w.tomorrow, false)}로 예상됩니다.`)
      : '';
    out.push(head + tail);
  }
  // 229차 — 패류독소 채취 금지 발령(해역별 · 봄). 홍합 · 바지락 · 굴
  for (const sea of SEAS) {
    const lbl = toxinBanLabel(sea.id, now);
    if (!lbl) continue;
    out.push(en
      ? `Shellfish toxin advisory for ${sea.en} (${lbl}): do not gather or eat mussels, clams or oysters. Cooking does not remove the toxin.`
      : `${sea.ko} 일대에 패류독소 채취 금지가 내려져 있습니다(${lbl}). 홍합 · 바지락 · 굴은 캐지도, 드시지도 마십시오. 익혀도 독은 없어지지 않습니다.`);
  }
  out.push(en
    ? 'That was the sea weather and tides. Have a safe trip out on the water. (Static…)'
    : '이상, 바다 날씨와 물때였습니다. 오늘도 안전한 출조 되십시오. (지지직…)');
  return out;
}
