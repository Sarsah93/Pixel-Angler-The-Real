/**
 * @file ShopStore.ts
 * @description 가게별 진열 재고 장부 · 즐겨찾기 (221차 — 사용자 지시)
 *
 *  - 재고: 하루 재고(`shopStockCap` — 가게 규모 × 품목 갈래)에서 **오늘 판 수**를 뺀다. 판 수 장부는
 *    하루 경계(KST 새벽 4시 — `logicalYmd`)를 넘기면 통째로 비운다 = 매일 새벽 다시 찬다.
 *  - 프롤로그(첫 장보기) 중에는 동나지 않는다 — 기본 채비를 못 사면 이야기가 막힌다(219차 막힘 전수조사 원칙).
 *  - 즐겨찾기: 가게(지점 키)마다 품목 키(`id|이름`) 목록. 장바구니는 창을 닫으면 비지만 즐겨찾기는 남는다.
 *  - 중고 칸(224차): 손님이 판 장비(대 · 릴 · 옷 · 뜰채 · 장갑)는 그 가게가 웃돈을 얹어 되판다. 지점마다 최근 8건.
 *    미끼 · 소모품은 애초에 사들이지 않는다(`shopBuysItem`).
 *  - 세이브: `GameState` SaveData `shops`(구세이브는 빈 장부 · 빈 즐겨찾기 · 빈 중고 칸).
 */

import { logicalYmd, shopScaleOf, shopStockCap, type ShopScale, type ShopScaleInput, type StockEntryInput } from '@tra/core';
import { inPrologue } from './Prologue.js';
import type { InvItemTemplate } from './InventoryStore.js';

/** 224차 — 가게 중고 칸 한 줄(손님이 판 장비 — 상태 · 내구 그대로) */
export interface UsedGood {
  uid: string;
  /** 판 물건 그대로(칸 · 수량 · 장착 표시 제외) */
  tpl: InvItemTemplate;
  qty: number;
  /** 되파는 한 개 값(가게가 준 값 × 웃돈) */
  price: number;
}

/** 지점마다 중고 칸 최대 줄 수 — 넘치면 가장 오래된 것부터 치운다 */
export const USED_MAX_PER_SHOP = 8;
/** 되팔 때 가게가 얹는 웃돈 배수 */
export const USED_MARKUP = 1.3;

export interface ShopSaveState {
  /** 판 수 장부가 속한 하루(YYYYMMDD) */
  day: string;
  /** 지점 키 → 품목 키 → 오늘 판 수 */
  sold: Record<string, Record<string, number>>;
  /** 지점 키 → 즐겨찾는 품목 키(넣은 순서) */
  fav: Record<string, string[]>;
  /** 224차 — 지점 키 → 중고 칸(오래된 것부터) */
  used?: Record<string, UsedGood[]>;
}

/** 지금 열린 가게 */
export interface ShopContext {
  key: string;
  scale: ShopScale;
}

class ShopStoreImpl {
  /** 222차 — 「단골 가게」 재고 배수(GameState가 주입 — 순환 import 회피) */
  stockMult: () => number = () => 1;
  private day = '';
  private sold: Record<string, Record<string, number>> = {};
  private fav: Record<string, string[]> = {};
  private used: Record<string, UsedGood[]> = {};
  private usedSeq = 0;
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
    const base = shopStockCap(ctx.scale, entry, ctx.key, entryKey);
    // 222차 「단골 가게」 — 정해진 재고를 늘린다(GameState가 주입)
    return base === null ? null : Math.max(1, Math.round(base * this.stockMult()));
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

  // ── 224차 — 중고 칸 ──
  /** 손님이 판 장비를 중고 칸에 올린다. 같은 물건(id · 상태 · 고장)이면 수량만 늘린다 */
  addUsed(shopKey: string, tpl: InvItemTemplate, qty: number, paidUnit: number): void {
    if (qty <= 0) return;
    const list = (this.used[shopKey] ??= []);
    const price = Math.max(1, Math.round(paidUnit * USED_MARKUP));
    const same = list.find((u) => u.tpl.id === tpl.id && u.tpl.condition === tpl.condition && u.tpl.fault === tpl.fault && u.price === price);
    if (same) { same.qty += qty; return; }
    this.usedSeq += 1;
    list.push({ uid: `u${Date.now().toString(36)}${this.usedSeq}`, tpl: { ...tpl }, qty, price });
    while (list.length > USED_MAX_PER_SHOP) list.shift();
  }
  usedGoods(shopKey: string): readonly UsedGood[] { return this.used[shopKey] ?? []; }
  usedLeft(shopKey: string, uid: string): number {
    return this.used[shopKey]?.find((u) => u.uid === uid)?.qty ?? 0;
  }
  /** 중고 물건을 사 간다 — 실제로 덜어 낸 수 */
  takeUsed(shopKey: string, uid: string, qty: number): number {
    const list = this.used[shopKey];
    const u = list?.find((x) => x.uid === uid);
    if (!list || !u) return 0;
    const n = Math.min(qty, u.qty);
    u.qty -= n;
    if (u.qty <= 0) list.splice(list.indexOf(u), 1);
    if (list.length === 0) delete this.used[shopKey];
    return n;
  }

  /** 새 게임 */
  resetAll(): void { this.day = ''; this.sold = {}; this.fav = {}; this.used = {}; this.current = null; }

  serialize(): ShopSaveState {
    this.roll();
    return { day: this.day, sold: this.sold, fav: this.fav, used: this.used };
  }

  deserialize(s: ShopSaveState | undefined): void {
    this.day = s?.day ?? '';
    this.sold = s?.sold && typeof s.sold === 'object' ? s.sold : {};
    this.fav = {};
    for (const [k, v] of Object.entries(s?.fav ?? {})) {
      if (Array.isArray(v)) this.fav[k] = v.filter((x): x is string => typeof x === 'string');
    }
    this.used = {};
    for (const [k, v] of Object.entries(s?.used ?? {})) {
      if (!Array.isArray(v)) continue;
      const ok = v.filter((u): u is UsedGood => !!u && typeof u.uid === 'string' && !!u.tpl && typeof u.tpl.id === 'string'
        && typeof u.qty === 'number' && u.qty > 0 && typeof u.price === 'number');
      if (ok.length) this.used[k] = ok.slice(-USED_MAX_PER_SHOP);
    }
    this.roll();
  }
}

export const ShopStore = new ShopStoreImpl();
