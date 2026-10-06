/**
 * @file MarketStore.ts
 * @description 판매처별 시세 하락 장부 (196차 — core `MarketSaturation`의 상태 보관·조회)
 *
 *  - 장부 = `${판매처}|${어종}` → 판매량(반감기 6시간 감쇠). **판 수**만 센다(잡은 수 아님).
 *  - 판매처 = 상점 POI 하나(속초 직판장 A와 B는 따로) — 탑다운이 상점을 열 때 `open()`으로 알려 준다.
 *  - 매입가 = 기본 매입가(`InventoryStore.getSellPrice` × 흥정) × 가게 수요(±8%) × 포화 배율.
 *    위판(경매)·상세보기·손질 가치는 기본 매입가를 그대로 쓴다 — 포화는 **상점 매입에만** 건다.
 *  - 화살표 = 가게 수요(포화 반영) + 그날 시세(경락 배율). 인벤 칸 우상단 · 상점 판매 칸 우상단.
 *  - 세이브: `GameState` SaveData `market`(구세이브는 빈 장부).
 */

import {
  type SaturationBook, type MarketTrend,
  decayedLoad, saturationKey, saturationMult, branchPreference, branchPreferenceMult,
  priceLevel, demandLevel, marketTrend, recordSale, pruneSaturation, fishRarity,
} from '@tra/core';
import type { InvItem } from './InventoryStore.js';
import { ExternalDataStore } from './ExternalDataStore.js';

export interface MarketSaveState {
  book: SaturationBook;
}

export interface MarketBranch {
  /** 판매처 키 — 지역 + POI(osmId) */
  key: string;
  /** 표시 이름(상호) */
  name: string;
}

export interface MarketQuote {
  /** 이 가게에서 받는 1마리 값 */
  unit: number;
  trend: MarketTrend;
  /** 포화 배율(1 = 하락 없음) */
  satMult: number;
  /** 가게 수요 배율 */
  prefMult: number;
}

/** KST 날짜 키(가게 수요는 날마다 바뀐다) */
function kstDayKey(nowMs: number): string {
  const d = new Date(nowMs + 9 * 3600_000);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

/** 시세 하락 대상 = 종 정보가 있는 어획물 */
export function isMarketFish(item: Pick<InvItem, 'subCategory' | 'speciesId'>): boolean {
  return item.subCategory === '어획물' && !!item.speciesId;
}

class MarketStoreImpl {
  /** 222차 — 「물량 조절」 하락폭 배수(1 = 그대로 · GameState가 주입) */
  saturationMult: () => number = () => 1;
  private book: SaturationBook = {};
  /** 지금 열려 있는 판매처(상점 창이 열려 있는 동안) */
  branch: MarketBranch | null = null;

  open(b: MarketBranch): void { this.branch = b; }
  close(): void { this.branch = null; }

  /** 이 판매처에서 이 고기를 팔면 — 기본 매입가 `baseUnit`에 수요·포화를 곱한다 */
  quote(item: InvItem, baseUnit: number, branchKey = this.branch?.key, nowMs = Date.now()): MarketQuote | null {
    if (!branchKey || !isMarketFish(item)) return null;
    const sp = item.speciesId!;
    const load = decayedLoad(this.book[saturationKey(branchKey, sp)], nowMs);
    const tier = fishRarity(sp, item.lengthCm ?? 0).tier;
    const rawSat = saturationMult({
      speciesId: sp, load, live: item.condition === 'live',
      big: tier === 'big' || tier === 'trophy' || tier === 'monster',
    });
    // 222차 「물량 조절」 — 하락폭(1 − sat)을 줄인다(GameState가 주입)
    const sat = 1 - (1 - rawSat) * Math.max(0, this.saturationMult());
    const pref = branchPreference(branchKey, sp, kstDayKey(nowMs));
    const prefMult = branchPreferenceMult(pref);
    const trend = marketTrend(demandLevel(pref, load, sp), priceLevel(ExternalDataStore.getMarketPriceFactor(sp)));
    return { unit: Math.max(0, Math.round(baseUnit * prefMult * sat)), trend, satMult: sat, prefMult };
  }

  /** 판매 기록 — 판 마릿수만큼 */
  recordSale(item: InvItem, qty: number, branchKey = this.branch?.key, nowMs = Date.now()): void {
    if (!branchKey || !isMarketFish(item) || qty <= 0) return;
    this.book = recordSale(this.book, branchKey, item.speciesId!, qty, nowMs);
  }

  /** 개발·검증용 — 이 판매처·어종의 감쇠된 판매량 */
  loadOf(branchKey: string, speciesId: string, nowMs = Date.now()): number {
    return decayedLoad(this.book[saturationKey(branchKey, speciesId)], nowMs);
  }

  resetAll(): void {
    this.book = {};
    this.branch = null;
  }

  serialize(): MarketSaveState {
    this.book = pruneSaturation(this.book, Date.now());
    return { book: { ...this.book } };
  }

  deserialize(s: MarketSaveState | undefined): void {
    this.book = s?.book ? pruneSaturation({ ...s.book }, Date.now()) : {};
    this.branch = null;
  }
}

export const MarketStore = new MarketStoreImpl();

// dev 하네스 전용 — 프로덕션 미노출(`__INV`/`__GS`와 같은 규칙 — import 인스턴스 분화 회피)
if (import.meta.env.DEV) (globalThis as unknown as { __MARKET?: unknown }).__MARKET = MarketStore;
