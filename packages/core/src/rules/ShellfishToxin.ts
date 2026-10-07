/**
 * @file ShellfishToxin.ts
 * @description 229차 — 봄철 마비성 패류독소(PST) 채취 금지 발령.
 *
 * 실제로는 국립수산과학원 조사에서 기준치(0.8mg/kg)를 넘으면 해역 단위로 채취 금지가 내려지고,
 * 3~6월 수온 상승기에 남해안부터 번지며 발령·해제가 반복된다. 게임은 **연도 × 바다별로 결정적**인
 * 창을 만든다(멀티플레이에서도 모두 같은 날짜) — 남해(부산)는 거의 매해 2~3번, 동해(속초)는 드물게.
 *
 * 금어기와 다르게 **채취를 막지 않는다** — 금지 기간에 캔 홍합 · 바지락 · 굴에는 「독」 표시가 붙고,
 * 먹으면(익혀도) 식중독이 날 수 있다(사용자 결정 2026-10-07). 라디오 · 지역 채널이 발령을 알린다.
 */
import type { ClosedSeason } from '../types/LegalSeason.js';
import { isClosedOn, formatSeasons } from './ClosedSeason.js';

/** 패류독소가 붙는 생물(ShoreCreatureDatabase id) — 홍합 · 바지락 · 굴 */
export const TOXIN_SHELLFISH_IDS: readonly string[] = ['mytilus_coruscus', 'clam_varicosa', 'oyster_gigas'];

export type ToxinSeaZone = 'south' | 'east' | 'west';

/** 지역 id → 바다 (없으면 동해) */
export function seaZoneOf(regionId: string): ToxinSeaZone {
  const r = regionId.toLowerCase();
  if (/busan|gyeongnam|jeonnam|yeosu|tongyeong|geoje|namhae|jeju/.test(r)) return 'south';
  if (/incheon|chungnam|jeonbuk|taean|boryeong|west/.test(r)) return 'west';
  return 'east';
}

function hash(n: number): () => number {
  let s = (n ^ 0x9e3779b9) >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function addDays(m: number, d: number, n: number): [number, number] {
  let mm = m, dd = d + n;
  while (dd > DAYS[mm - 1]) { dd -= DAYS[mm - 1]; mm++; if (mm > 12) return [12, 31]; }
  return [mm, dd];
}

/** 그 해 그 바다의 채취 금지 창 — 남해 2~3개 · 동해 0~1개(약 35%) · 서해 1~2개 */
export function toxinBanWindows(regionId: string, year: number): ClosedSeason[] {
  const zone = seaZoneOf(regionId);
  const rng = hash(year * 7 + (zone === 'south' ? 1 : zone === 'east' ? 2 : 3));
  const count = zone === 'south' ? 2 + (rng() < 0.5 ? 1 : 0)
    : zone === 'east' ? (rng() < 0.35 ? 1 : 0)
    : 1 + (rng() < 0.4 ? 1 : 0);
  const out: ClosedSeason[] = [];
  // 3월 초 ~ 6월 중순 사이에 창을 흩뿌린다(길이 10~24일 · 서로 겹치지 않게)
  let cursorDay = 0;   // 3월 1일부터 센 일수
  for (let i = 0; i < count; i++) {
    const gap = 6 + Math.floor(rng() * 16);
    const len = 10 + Math.floor(rng() * 15);
    const start = cursorDay + gap;
    if (start + len > 108) break;   // 6월 17일 넘기지 않는다
    const from = addDays(3, 1, start), to = addDays(3, 1, start + len);
    out.push({ from, to });
    cursorDay = start + len;
  }
  return out;
}

/** 지금 그 지역에 패류독소 채취 금지가 내려져 있는가 */
export function toxinBanActive(regionId: string, date: Date): boolean {
  const w = toxinBanWindows(regionId, date.getFullYear());
  return w.length > 0 && isClosedOn(w, date.getMonth() + 1, date.getDate());
}

/** 지금 내려진 창(없으면 null) */
export function toxinBanCurrent(regionId: string, date: Date): ClosedSeason | null {
  const m = date.getMonth() + 1, d = date.getDate();
  for (const w of toxinBanWindows(regionId, date.getFullYear())) if (isClosedOn([w], m, d)) return w;
  return null;
}

/** 라디오 · 채널 문장용 「3.12~3.31」 */
export function toxinBanLabel(regionId: string, date: Date): string | null {
  const w = toxinBanCurrent(regionId, date);
  return w ? formatSeasons([w]) : null;
}

/** 이 생물이 패류독소 대상인가 */
export function isToxinShellfish(creatureId: string): boolean {
  return TOXIN_SHELLFISH_IDS.includes(creatureId);
}
