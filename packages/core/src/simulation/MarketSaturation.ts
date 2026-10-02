/**
 * @file MarketSaturation.ts
 * @description 판매처별 물량 포화 → 매입가 하락 (196차)
 *
 * 사용자 확정(2026-10-02)
 *   1. **판 수**로 센다 — 잡아서 쿨러에 둔 것은 세지 않는다. 그 가게에 풀린 물량이 값을 내린다.
 *   2. **판매처마다 따로** 센다 — 속초 직판장에 몰아 팔았으면 다른 직판장·식당은 제값을 준다.
 *   3. 하루가 지나도 **단번에 초기화하지 않는다** — 반감기 6시간으로 서서히 풀린다
 *      (자정을 기다렸다 다시 몰아 파는 꼼수를 막는다).
 *   4. 단계 하락 — 기준 마릿수째부터 한 마리당 −3%, 최대 −40%.
 *   5. 기준 마릿수는 어종마다 — kg당 시세가 싼 흔한 어종은 15마리, 비싼 귀한 어종은 5마리.
 *   6. 활어·대물은 덜 떨어진다 — 각각 하락 폭 ½(둘 다면 ¼). 「양보다 질」이 남는다.
 *   7. 위판(경매)과 겹치지 않는다 — 위판은 로트마다 중매인 호가로 값이 서고(`ConsignmentAuction`),
 *      낚싯대 어획은 애초에 위판 불가다. 포화는 **상점 매입에만** 건다(이중 차감 없음).
 *
 * 가게 수요(`branchPreference`) — 지점마다 그날 찾는 어종이 다르다(±8%).
 *   지점·어종·날짜로 정해지는 결정적 값이라 같은 날 다시 와도 같다.
 *
 * 화살표(`marketTrend`) — 수요(−1/0/+1) + 시세(−1/0/+1)의 합
 *   +2 위(파랑) · +1 오른쪽 위(초록) · 0 가로줄(노랑) · −1 오른쪽 아래(주황) · −2 아래(빨강)
 *
 * 순수 계산만 둔다 — 시각(ms)·장부·시세 배율은 호출측이 넘긴다.
 */

import { SEAFOOD_AUCTION_MAPPING } from '../types/Economy.js';

/** 반감기 — 6시간이면 하루 뒤 1/16만 남는다 */
export const SAT_HALF_LIFE_MS = 6 * 3600_000;
/** 기준 마릿수째부터 한 마리당 하락 */
export const SAT_STEP = 0.03;
/** 최대 하락 */
export const SAT_MAX_CUT = 0.40;
/** 활어 · 대물 하락 완화 배율 */
export const SAT_LIVE_SOFTEN = 0.5;
export const SAT_BIG_SOFTEN = 0.5;
/** 가게 수요 가감 */
export const BRANCH_PREF_PCT = 0.08;
/** 시세 높음/낮음 경계(그날 경락가 ÷ 평년 단가) */
export const PRICE_HIGH = 1.08;
export const PRICE_LOW = 0.92;
/** 장부 항목 수명 — 이만큼 지나면 사실상 0이라 지운다(세이브 비대 방지) */
export const SAT_PRUNE_MS = 4 * 24 * 3600_000;

/** 한 판매처·한 어종의 판매 기록 */
export interface SaturationEntry {
  /** 마지막 갱신 시점의 누적 판매량(감쇠 반영 전) */
  load: number;
  /** 마지막 갱신 시각(ms) */
  atMs: number;
}

/** 장부 — 키 = `${판매처}|${어종}` */
export type SaturationBook = Record<string, SaturationEntry>;

export function saturationKey(branchKey: string, speciesId: string): string {
  return `${branchKey}|${speciesId}`;
}

/** 기준 마릿수 — kg당 평년 단가로 흔함/귀함을 가른다 */
export function saturationThreshold(speciesId: string): number {
  const p = SEAFOOD_AUCTION_MAPPING[speciesId]?.defaultPricePerKg;
  if (!p) return 10;
  if (p <= 12000) return 15;
  if (p < 25000) return 10;
  if (p < 40000) return 7;
  return 5;
}

/** 지금 시각의 감쇠된 판매량 */
export function decayedLoad(e: SaturationEntry | undefined, nowMs: number): number {
  if (!e) return 0;
  const dt = Math.max(0, nowMs - e.atMs);
  return e.load * Math.pow(0.5, dt / SAT_HALF_LIFE_MS);
}

/** 이미 판 양(load) 다음 한 마리의 하락 단계 수 — 기준 마릿수째가 1단계 */
export function saturationSteps(load: number, threshold: number): number {
  return Math.max(0, load + 2 - threshold);
}

export interface SaturationInput {
  speciesId: string;
  /** 이미 판 양(감쇠 반영) */
  load: number;
  live: boolean;
  big: boolean;
}

/** 포화 배율(0.6~1) */
export function saturationMult(i: SaturationInput): number {
  const steps = saturationSteps(i.load, saturationThreshold(i.speciesId));
  if (steps <= 0) return 1;
  const soften = (i.live ? SAT_LIVE_SOFTEN : 1) * (i.big ? SAT_BIG_SOFTEN : 1);
  return 1 - Math.min(SAT_MAX_CUT, steps * SAT_STEP * soften);
}

/** 문자열 해시(FNV-1a) */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 가게 수요 — 그날 이 지점이 이 어종을 찾는가(+1) / 평범(0) / 덜 찾는가(−1).
 * 20% · 60% · 20%. 지점·어종·날짜(KST 일자 키)로 정해진다.
 */
export function branchPreference(branchKey: string, speciesId: string, dayKey: string): -1 | 0 | 1 {
  const r = (hash32(`${branchKey}|${speciesId}|${dayKey}`) % 1000) / 1000;
  return r < 0.2 ? 1 : r >= 0.8 ? -1 : 0;
}

export function branchPreferenceMult(pref: -1 | 0 | 1): number {
  return 1 + pref * BRANCH_PREF_PCT;
}

/** 시세 수준 — 그날 경락 배율 */
export function priceLevel(priceFactor: number): -1 | 0 | 1 {
  return priceFactor >= PRICE_HIGH ? 1 : priceFactor <= PRICE_LOW ? -1 : 0;
}

/** 수요 수준 — 가게 수요에서 포화(하락 시작)를 뺀다 */
export function demandLevel(pref: -1 | 0 | 1, load: number, speciesId: string): -1 | 0 | 1 {
  const v = pref - (saturationSteps(load, saturationThreshold(speciesId)) > 0 ? 1 : 0);
  return (v > 0 ? 1 : v < 0 ? -1 : 0);
}

/** 화살표 — 수요 + 시세 (−2~+2) */
export type MarketTrend = -2 | -1 | 0 | 1 | 2;

export function marketTrend(demand: -1 | 0 | 1, price: -1 | 0 | 1): MarketTrend {
  return (demand + price) as MarketTrend;
}

/** 판매 기록 — 감쇠 후 qty만큼 더한다(불변 갱신) */
export function recordSale(book: SaturationBook, branchKey: string, speciesId: string, qty: number, nowMs: number): SaturationBook {
  const k = saturationKey(branchKey, speciesId);
  const load = decayedLoad(book[k], nowMs) + Math.max(0, qty);
  return { ...book, [k]: { load, atMs: nowMs } };
}

/** 오래된 항목 정리 */
export function pruneSaturation(book: SaturationBook, nowMs: number): SaturationBook {
  const out: SaturationBook = {};
  for (const [k, e] of Object.entries(book)) {
    if (nowMs - e.atMs < SAT_PRUNE_MS && decayedLoad(e, nowMs) >= 0.05) out[k] = e;
  }
  return out;
}
