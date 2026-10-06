/**
 * @file ShopStore.ts
 * @description 가게별 진열 재고 장부 · 즐겨찾기 (221차 — 사용자 지시)
 *
 *  - 재고: 하루 재고(`shopStockCap` — 가게 규모 × 품목 갈래)에서 **오늘 판 수**를 뺀다. 판 수 장부는
 *    하루 경계(KST 새벽 4시 — `logicalYmd`)를 넘기면 통째로 비운다 = 매일 새벽 다시 찬다.
 *  - 프롤로그(첫 장보기) 중에는 동나지 않는다 — 기본 채비를 못 사면 이야기가 막힌다(219차 막힘 전수조사 원칙).
 *  - 즐겨찾기: 가게(지점 키)마다 품목 키(`id|이름`) 목록. 장바구니는 창을 닫으면 비지만 즐겨찾기는 남는다.
 *  - 세이브: `GameState` SaveData `shops`(구세이브는 빈 장부 · 빈 즐겨찾기).
 */

import { logicalYmd, shopScaleOf, shopStockCap, type ShopScale, type ShopScaleInput, type StockEntryInput } from '@tra/core';
import { inPrologue } from './Prologue.js';

export interface ShopSaveState {
  /** 판 수 장부가 속한 하루(YYYYMMDD) */
  day: string;
  /** 지점 키 → 품목 키 → 오늘 판 수 */
  sold: Record<string, Record<string, number>>;
  /** 지점 키 → 즐겨찾는 품목 키(넣은 순서) */
  fav: Record<string, string[]>;
}

/** 지금 열린 가게 */
export interface ShopContext {
  key: string;
  scale: ShopScale;
}

class ShopStoreImpl {
  private day = '';
  private sold: Record<string, Record<string, number>> = {};
  private fav: Record<string, string[]> = {};
  /** 지금 열린 가게(상점 창이 떠 있는 동안) */
  current: ShopContext | null = null;

  /** 상점을 열 때 씬이 부른다 — 규모는 가게 종류 · 상호 · 좌판/인물 가게로 정한다 */
  open(key: string, scaleInput: ShopScaleInput): ShopContext {
    this.current = { key, scale: shopScaleOf(scaleInput) };
    return this.current;
  }
  close(): void { this.current = null; }

  /** 하루가 바뀌었으면 판 수 장부를 비운다(=다시 찬다) */
  private roll(): void {
    const today = logicalYmd(Date.now());
    if (this.day !== today) { this.day = today; this.sold = {}; }
  }

  /** 하루 재고(null = 동나지 않음) */
  cap(ctx: ShopContext, entry: StockEntryInput, entryKey: string): number | null {
    if (inPrologue()) return null;
    return shopStockCap(ctx.scale, entry, ctx.key, entryKey);
  }

  /** 오늘 남은 수(null = 동나지 않음) */
  remaining(ctx: ShopContext, entry: StockEntryInput, entryKey: string): number | null {
    const cap = this.cap(ctx, entry, entryKey);
    if (cap === null) return null;
    this.roll();
    return Math.max(0, cap - (this.sold[ctx.key]?.[entryKey] ?? 0));
  }

  /** 팔린 만큼 덜어 낸다 */
  take(ctx: ShopContext, entryKey: string, qty: number): void {
    if (qty <= 0) return;
    this.roll();
    const m = (this.sold[ctx.key] ??= {});
    m[entryKey] = (m[entryKey] ?? 0) + qty;
  }

  // ── 즐겨찾기 ──
  favorites(shopKey: string): string[] { return this.fav[shopKey] ?? []; }
  isFavorite(shopKey: string, entryKey: string): boolean { return this.favorites(shopKey).includes(entryKey); }
  toggleFavorite(shopKey: string, entryKey: string): boolean {
    const list = (this.fav[shopKey] ??= []);
    const i = list.indexOf(entryKey);
    if (i >= 0) list.splice(i, 1); else list.push(entryKey);
    if (list.length === 0) delete this.fav[shopKey];
    return i < 0;
  }

  /** 새 게임 */
  resetAll(): void { this.day = ''; this.sold = {}; this.fav = {}; this.current = null; }

  serialize(): ShopSaveState {
    this.roll();
    return { day: this.day, sold: this.sold, fav: this.fav };
  }

  deserialize(s: ShopSaveState | undefined): void {
    this.day = s?.day ?? '';
    this.sold = s?.sold && typeof s.sold === 'object' ? s.sold : {};
    this.fav = {};
    for (const [k, v] of Object.entries(s?.fav ?? {})) {
      if (Array.isArray(v)) this.fav[k] = v.filter((x): x is string => typeof x === 'string');
    }
    this.roll();
  }
}

export const ShopStore = new ShopStoreImpl();
