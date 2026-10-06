/**
 * @file ShopPanel.ts
 * @description 상점 거래 팝업 (화면 좌측 — 우측에는 인벤토리가 함께 열림)
 *
 * 구성:
 *  - 상단 탭: 구매하기 / 판매하기 / (수리하기) / (위판하기)
 *  - 구매 탭: 상점 판매 품목 그리드 (아이콘 클릭 = 선택, 호버 = 요약 툴팁,
 *    우클릭 = 상세 정보창). 상점 아이템은 재화 결제 없이는 인벤토리로 이동 불가.
 *  - 판매 탭: 플레이어 인벤토리 중 이 상점이 매입하는 카테고리 아이템 목록
 *  - 최하단: [구매] [판매] 버튼 — 선택 아이템에 대해 수량/확인 플로우 진행
 *  - 220차 — 사고팔기는 **장바구니**다(사용자 지시): 칸을 누를 때마다 담고 빼고(여러 개), [구매 (n)] / [판매 (n)]이
 *    장바구니 확인 창(`ShopCartDialog` — 줄마다 수량 −/+ · 빼기 · 합계 · 남는 돈)을 연다. 구매 · 판매 탭 위에는
 *    이 가게가 다루는 **종류 칩**(전체 + 인벤토리와 같은 분류)과 **이름 찾기 칸**(한글 IME — `TextInput`)이 있다.
 *  - 221차 — **진열 재고**(가게 규모별 하루 재고 · 새벽 4시에 다시 참 — `ShopStore`) · **즐겨찾기 탭**(칸 오른쪽 위 별 —
 *    가게마다 저장, 장바구니는 창을 닫으면 비지만 즐겨찾기는 남는다) · **판매 수량 창**(여러 개 가진 물건을 담거나
 *    가방에서 이 창으로 끌어 놓으면 −/+ 수량 창이 먼저 뜬다).
 */

import Phaser from 'phaser';
import { GEAR_FAULTS, gearRepairFee } from '@tra/core';
import { GameState } from '../store/GameState.js';
import { InventoryStore, InvItem, CONDITION_LABEL, CATEGORY_LABEL, type InvCategory } from '../store/InventoryStore.js';
import { TitleStore } from '../store/TitleStore.js';
import { ShopCartDialog, type CartLine } from './ShopCartDialog.js';
import { TextInput } from './TextInput.js';
import { RecommendationStore } from '../store/RecommendationStore.js';
import { ShopDef, ShopEntry } from '../data/ShopCatalog.js';
import { DraggablePanel } from './DraggablePanel.js';
import { ConfirmDialog, QuantityDialog } from './Dialogs.js';
import { ShopStore, type ShopContext } from '../store/ShopStore.js';
import type { InvDropResult } from './InventoryPanel.js';
import { createItemIcon } from './ItemIcon.js';
import { drawTrendIcon, TREND_ICON_PX } from './MarketTrendIcon.js';
import { MarketStore } from '../store/MarketStore.js';
import { clampTextWidth } from './TextFit.js';
import { SHOP_STOCK_PLENTY, type MarketTrend } from '@tra/core';
import { maybeStartTour, tourSeen, type TourOptions } from './GuideTour.js';
import { StoryStore } from '../store/StoryStore.js';
import {
  consignableItems, consignGradeOf, consignInputOf, hasCrate,
  ReserveMode, RESERVE_LABEL,
} from '../data/Consignment.js';
import { ConsignQueue } from '../store/ConsignQueue.js';
import { CraftingStore } from '../store/CraftingStore.js';
import { isConsignmentOpen, minutesUntilConsignment, consignmentFeeRate, coopDuesFeeCut, REGION_DATABASE } from '@tra/core';
import { t, getLocale } from '../i18n/I18n.js';

export type ShopTab = 'buy' | 'fav' | 'sell' | 'repair' | 'consign';

const PANEL_W = 460;
const PANEL_H = 596;
const GRID_COLS = 5;
const SLOT = 70;
const SLOT_GAP = 7;
/**
 * 그리드 뷰포트 하단 — 하단 안내문(PANEL_H-104, 2줄까지 늘 수 있음) 위쪽에서 끊는다.
 * 이 아래로는 어떤 셀도 그리지 않고 스크롤로 접근한다 (AGENTS §4 오버플로/스크롤).
 */
const GRID_VP_BOTTOM = PANEL_H - 124;
/** 스크롤바 트랙 x (그리드 우측 바깥) */
const BAR_X = PANEL_W - 16;
/** 종류 칩 순서 — 인벤토리 탭과 같은 차례(루어는 낚시용품 다음) */
const CAT_ORDER: InvCategory[] = ['gear', 'consumable', 'food', 'tackle', 'lure', 'quest', 'etc'];
const FONT = '"Noto Sans KR", sans-serif';
const SEARCH_W = 150;

/**
 * 220차 — 상점 구매 단가(장바구니 · 실제 결제 공용). 스킬 흥정(랭크당 -3% · 122차) × 단 타이틀 할인(203차).
 * 창이 보여 주는 값과 씬이 받는 값이 한 함수에서 나온다(구: 창은 타이틀 할인을 빼고 보여 줬다).
 */
export function shopBuyUnitPrice(entry: { price: number }): number {
  return Math.round(entry.price * (1 - 0.03 * GameState.skillRank('eco_haggle')) * TitleStore.modifiers().buyMult);
}

/**
 * 221차 — 상점 매입 단가(판매 칸 · 판매 목록 · 실제 정산 공용). 흥정 · 단골 스킬 × 단 타이틀 판매가 × 지점 수요 · 시세 하락.
 * 구: 창은 타이틀 판매가를 빼고 보여 주고 씬은 넣고 줬다(220차 구매가와 같은 어긋남).
 */
export function shopSellUnitPrice(item: InvItem): number {
  const base = Math.round(InventoryStore.getSellPrice(item) * GameState.skillMult('sell_price') * TitleStore.modifiers().sellMult);
  return MarketStore.quote(item, base)?.unit ?? base;   // 196차 — 지점 수요 × 시세 하락
}

/** 5꼭지 별 꼭짓점(절차 그림 — 이모지 · 글리프 금지) */
function starPoints(cx: number, cy: number, r: number, ri: number): Phaser.Math.Vector2[] {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : ri;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr));
  }
  return pts;
}

export const entryKey = (e: Pick<ShopEntry, 'id' | 'name'>): string => `${e.id}|${e.name}`;

/** 그리드 셀 1칸 렌더 스펙 (구매 entry / 판매 InvItem 공통) */
interface ShopCell {
  icon: string; iconTexture?: string; name: string; priceLabel: string; qtyLabel: string;
  condition?: InvItem['condition']; recommended?: boolean;
  // 어획물은 iconTexture가 비어도 speciesId로 이미지 폴백 해소 (createItemIcon)
  speciesId?: string; lengthCm?: number;
  /** 196차 — 이 지점의 시세·수요 화살표(어획물만) */
  trend?: MarketTrend;
  selected: boolean; tooltip: string;
  onSelect: () => void; onDetail: () => void;
  /** 221차 — 진열 재고 글자(넉넉하면 비움) · 품절 */
  stock?: string; soldOut?: boolean;
  /** 221차 — 즐겨찾기 별(구매 · 즐겨찾기 탭만) */
  fav?: boolean; onFav?: () => void;
}

export interface ShopPanelCallbacks {
  onClose: () => void;
  /** 220차 — 장바구니 구매(수량 · 확인은 장바구니 창이 받았다) */
  onBuy: (lines: { entry: ShopEntry; qty: number }[]) => void;
  /** 220차 — 판매 목록 한 번에 팔기 */
  onSell: (lines: { item: InvItem; qty: number }[]) => void;
  /** 220차 — 장바구니 창을 씬의 팝업 스택(ESC 순서)에 올린다 */
  openPopup?: (make: (close: () => void) => Phaser.GameObjects.Container) => void;
  /** 아이템 상세보기 (우클릭) */
  onOpenDetail: (item: InvItem | ShopEntry) => void;
  /** 위판 출품 요청 (147차) — 세션 생성·경매 진행·정산은 씬이 담당 */
  onConsign?: (inputs: ReturnType<typeof consignInputOf>[], items: InvItem[]) => void;
  /** 214차 — 맡겨 둔 물건 목록(찾아오기) 열기 */
  onShowConsigned?: () => void;
}

export class ShopPanel extends DraggablePanel {
  private shop: ShopDef;
  private cbs: ShopPanelCallbacks;
  private currentTab: ShopTab = 'buy';
  private tabDefs: { id: ShopTab; label: string }[] = [];
  /** 수리 가능 상점 = 낚시 장비를 취급하는 곳 (직판장 · 생활용품점) */
  private get canRepair(): boolean {
    return this.shop.kind === 'market' || this.shop.kind === 'daily';
  }
  private selectedRepair: InvItem | null = null;
  /** 위판 창구를 겸하는 상점인가 (147차 — 건물 종류가 아니라 데이터가 정한다) */
  private get canConsignHere(): boolean { return !!this.shop.auctionWindow; }
  /** 위판 출품으로 고른 아이템 id (다중 선택) */
  private consignSel = new Set<string>();
  private reserveMode: ReserveMode = 'none';

  private tabBgs = new Map<ShopTab, Phaser.GameObjects.Graphics>();
  private tabTexts = new Map<ShopTab, Phaser.GameObjects.Text>();
  private gridContainer!: Phaser.GameObjects.Container;
  private tooltip!: Phaser.GameObjects.Container;
  private tooltipText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;

  /** 220차 — 장바구니(구매) · 판매 목록. 키 = 상품 id|이름 / 가방 아이템 id. 넣은 순서를 지킨다(Map) */
  private buyCart = new Map<string, { entry: ShopEntry; qty: number }>();
  private sellCart = new Map<string, { item: InvItem; qty: number }>();
  /** 마지막에 담은 칸 — 가이드가 짚는다 */
  private lastPick: string | null = null;
  /** 탭별 종류 칩 · 이름 찾기 */
  private catFilter: { buy: InvCategory | 'all'; sell: InvCategory | 'all' } = { buy: 'all', sell: 'all' };
  private query = '';
  private searchInput?: TextInput;
  /** 찾기 칸 패널 로컬 사각(바깥을 누르면 입력을 끝낸다) */
  private searchRect: Phaser.Geom.Rectangle | null = null;
  private filterRowRect: Phaser.Geom.Rectangle | null = null;
  private cartOpen = false;
  private readonly downOutside: (p: Phaser.Input.Pointer) => void;
  private footerLeft?: Phaser.GameObjects.Text;
  /** 221차 — 지금 가게(재고 · 즐겨찾기 키). 씬이 `ShopStore.open`으로 연다 */
  private readonly ctx: ShopContext;
  private qtyOpen = false;

  /** 선택된 칸의 패널 로컬 좌상단 (보이는 창 안일 때만 — 가이드 하이라이트용) */
  private selCellAt: { x: number; y: number } | null = null;

  /** 스크롤 — 최상단에 보이는 행 인덱스 (판매 탭은 인벤토리 수량이 무한 증가 가능) */
  private scrollRow = 0;
  private maxScrollRow = 0;
  /** 스크롤바 트랙 기하 (썸 드래그 판정용) */
  private barGeom: { top: number; h: number } | null = null;
  private thumbDrag = false;
  private wheelHandler: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;
  private barMoveHandler: (p: Phaser.Input.Pointer) => void;
  private barUpHandler: () => void;

  /** @param initialTab 215차 — 위판장 창구에서 열면 「위판하기」 탭부터(그 탭이 없는 가게면 구매) */
  constructor(scene: Phaser.Scene, x: number, y: number, shop: ShopDef, cbs: ShopPanelCallbacks, initialTab: ShopTab = 'buy', ctx?: ShopContext) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: shop.name, onClose: cbs.onClose, depth: 820 });
    this.shop = shop;
    this.cbs = cbs;
    this.ctx = ctx ?? ShopStore.current ?? { key: `shop:${shop.kind}`, scale: 'medium' };
    // 196차 — 지점 이름(상호)을 제목에 붙인다: 같은 직판장이라도 지점마다 수요·시세가 다르다
    const branch = MarketStore.branch;
    if (branch && branch.name && branch.name !== shop.name) {
      this.titleText.setText(`${shop.name} · ${branch.name}`);
      clampTextWidth(this.titleText, PANEL_W - 70);
    }

    // 휠 스크롤 — 포인터가 이 패널 위에 있을 때만 (동시에 열리는 인벤토리 휠을 가로채지 않음)
    this.wheelHandler = (p, _go, _dx, dy): void => {
      if (this.maxScrollRow <= 0 || !this.containsPointer(p)) return;
      const next = Phaser.Math.Clamp(this.scrollRow + Math.sign(dy), 0, this.maxScrollRow);
      if (next !== this.scrollRow) { this.scrollRow = next; this.renderGrid(); }
    };
    scene.input.on('wheel', this.wheelHandler);

    // 스크롤바 썸 드래그 (트랙 클릭 = 그 위치로 점프)
    this.barMoveHandler = (p: Phaser.Input.Pointer): void => {
      if (!this.thumbDrag || !this.barGeom || this.maxScrollRow <= 0) return;
      const prog = Phaser.Math.Clamp((p.y - this.y - this.barGeom.top) / Math.max(1, this.barGeom.h), 0, 1);
      const next = Math.round(prog * this.maxScrollRow);
      if (next !== this.scrollRow) { this.scrollRow = next; this.renderGrid(); }
    };
    this.barUpHandler = (): void => { this.thumbDrag = false; };
    scene.input.on('pointermove', this.barMoveHandler);
    scene.input.on('pointerup', this.barUpHandler);
    // 220차 — 찾기 칸 밖을 누르면 입력을 끝낸다(입력 중엔 Phaser 키보드가 꺼져 있다)
    this.downOutside = (p: Phaser.Input.Pointer): void => {
      if (!this.searchInput || !this.searchRect) return;
      if (!this.searchRect.contains(p.x - this.x, p.y - this.y)) this.stopSearch();
    };
    scene.input.on('pointerdown', this.downOutside);

    const greeting = scene.add.text(14, this.contentTop + 2, shop.greeting, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8faabf',
    });
    this.add(greeting);

    this.buildTabs();
    if (this.tabDefs.some((d) => d.id === initialTab)) this.currentTab = initialTab;
    this.gridContainer = scene.add.container(0, 0);
    this.add(this.gridContainer);
    this.buildFooter();
    this.buildTooltip();
    this.renderGrid();
    this.paintTabs();   // 215차 — 첫 탭이 구매가 아닐 수 있다(하단 단추 글자까지)

    scene.events.on('inventory-changed', this.onInventoryChanged, this);
    // 221차 — 가방에서 이 창으로 끌어 놓으면 판매 목록(위판 탭이면 출품 목록)에 담는다
    scene.events.on('inventory-drop', this.onInventoryDrop, this);
    this.applyFix();
    // 188차 — 첫 방문 체험 가이드 (고르기 → 사기 → 팔기를 직접 해 본다)
    maybeStartTour(scene, () => this.buildTour());
    // 220차 — 이미 상점 가이드를 본 사람에게는 장바구니 · 종류 칩 · 찾기만 짧게
    maybeStartTour(scene, () => (tourSeen('shop') ? this.buildCartTour() : null));
    // 221차 — 이미 본 사람에게 즐겨찾기 · 재고 · 끌어 놓아 팔기만 짧게
    maybeStartTour(scene, () => (tourSeen('shop') ? this.buildFavTour() : null));
  }

  private buildFavTour(): TourOptions {
    return {
      id: 'shop_fav',
      anchor: () => this.openDialogRects()[0] ?? this.panelBounds(),
      alive: () => this.active,
      steps: [
        {
          text: '진열 칸 오른쪽 위 별을 누르면 이 가게 즐겨찾기에 들어간다. 장바구니는 가게를 나가면 비지만 즐겨찾기는 남는다.',
          target: () => this.firstCellRect() ?? this.gridAreaRect(),
          onEnter: () => { if (this.currentTab !== 'buy') this.selectTab('buy'); },
        },
        {
          text: '「즐겨찾기」에는 별을 단 물건만 모인다. 눌러서 장바구니에 담거나, 「모두 담기」로 한꺼번에 담는다.',
          target: () => this.tabRectOf('fav'),
        },
        {
          text: '가게마다 하루에 들여놓는 수가 있다. 칸에 남은 수가 보이고, 다 팔리면 새벽 4시에 다시 찬다. 작은 가게일수록 적다.',
          target: () => this.gridAreaRect(),
        },
        {
          text: '팔 때는 가방의 물건을 이 창으로 끌어 놓아도 된다. 여러 개를 가진 물건은 몇 개 팔지 먼저 묻는다.',
          target: () => this.panelBounds(),
          skipIf: () => this.shop.buysCategories.length === 0,
        },
      ],
    };
  }

  /** 지금 그리드 첫 칸(가이드가 별을 짚는다) */
  private firstCellRect(): Phaser.Geom.Rectangle | null {
    if (!this.firstCellAt) return null;
    return this.localRect(this.firstCellAt.x, this.firstCellAt.y, SLOT, SLOT);
  }
  private firstCellAt: { x: number; y: number } | null = null;

  // ── 221차 — 재고 ─────────────────────────────────
  /** 오늘 남은 수(null = 동나지 않음) */
  private remainingOf(entry: ShopEntry): number | null {
    return ShopStore.remaining(this.ctx, entry, entryKey(entry));
  }

  /** 장바구니 한 줄 최대 = 1회 구매 상한과 남은 수 중 작은 쪽 */
  private buyMaxOf(entry: ShopEntry): number {
    const left = this.remainingOf(entry);
    return Math.max(1, Math.min(entry.maxPerPurchase, left ?? Infinity));
  }

  /** 품절 · 남은 수보다 많이 담긴 장바구니 줄을 맞춘다 */
  private pruneBuyCart(): void {
    for (const [k, l] of this.buyCart) {
      const left = this.remainingOf(l.entry);
      if (left === 0) this.buyCart.delete(k);
      else if (left !== null) l.qty = Math.min(l.qty, left);
    }
  }

  /** 구매 · 즐겨찾기 탭 공용 진열 칸 */
  private buyCell(entry: ShopEntry, reco: ReturnType<typeof RecommendationStore.get>): ShopCell {
    const recommended = RecommendationStore.isItemRecommended(entry as unknown as InvItem, reco);
    const k = entryKey(entry);
    const inCart = this.buyCart.get(k);
    const left = this.remainingOf(entry);
    const soldOut = left === 0;
    const fav = ShopStore.isFavorite(this.ctx.key, k);
    const stockLine = left === null ? '' : soldOut ? t('오늘은 다 팔렸다 — 새벽에 다시 들어온다') : `${t('남은 수')} ${left}`;
    return {
      icon: entry.icon, iconTexture: entry.iconTexture, name: entry.name,
      speciesId: entry.speciesId, lengthCm: entry.lengthCm,
      priceLabel: `${this.buyPriceOf(entry).toLocaleString()}원`,
      qtyLabel: inCart && inCart.qty > 1 ? `×${inCart.qty}` : '',
      condition: entry.condition,
      recommended,
      selected: !!inCart,
      stock: soldOut ? t('품절') : left !== null && left < SHOP_STOCK_PLENTY ? `${left}${t('개 남음')}` : undefined,
      soldOut,
      fav,
      onFav: () => {
        const on = ShopStore.toggleFavorite(this.ctx.key, k);
        GameState.markDirty();
        this.setStatus(on ? `${t(entry.name)} — ${t('즐겨찾기에 넣었다')}` : `${t(entry.name)} — ${t('즐겨찾기에서 뺐다')}`);
        this.renderGrid();
      },
      tooltip: `${recommended ? '[추천] ' : ''}${entry.name}\n${this.buyPriceOf(entry).toLocaleString()}원 · ${entry.desc}${stockLine ? `\n${stockLine}` : ''}`,
      onSelect: () => {
        // 220차 — 누를 때마다 담고 뺀다(장바구니)
        if (this.buyCart.has(k)) { this.buyCart.delete(k); if (this.lastPick === k) this.lastPick = null; }
        else if (soldOut) { this.setStatus(t('오늘은 다 팔렸다 — 새벽에 다시 들어온다')); return; }
        else { this.buyCart.set(k, { entry, qty: 1 }); this.lastPick = k; }
        this.renderGrid();
      },
      onDetail: () => this.cbs.onOpenDetail(entry),
    };
  }

  // ── 221차 — 판매 수량 창 · 끌어 놓아 팔기 ──────────────
  /** 여러 개 가진 물건은 몇 개 팔지 먼저 묻는다(구: 담으면 가진 만큼 통째로) */
  private askSellQty(item: InvItem, then: (qty: number) => void): void {
    if (item.qty <= 1) { then(1); return; }
    if (this.qtyOpen) return;
    this.stopSearch();
    const make = (close: () => void): QuantityDialog => new QuantityDialog(this.scene, {
      itemName: item.name, unitPrice: this.sellPriceOf(item), maxQty: item.qty,
      initialQty: this.sellCart.get(item.id)?.qty ?? 1,
      actionLabel: '판매', confirmLabel: '판매 목록에 담기',
      onConfirm: (q) => { this.qtyOpen = false; close(); then(q); },
      onCancel: () => { this.qtyOpen = false; close(); },
    });
    this.qtyOpen = true;
    if (this.cbs.openPopup) this.cbs.openPopup((close) => make(() => { this.qtyOpen = false; close(); }));
    else {
      const d = make(() => { this.qtyOpen = false; d.destroy(); });
      this.scene.add.existing(d);
    }
  }

  /** 판매 목록에 담기(수량 정한 뒤) */
  private putInSellCart(item: InvItem, qty: number): void {
    this.sellCart.set(item.id, { item, qty: Math.max(1, Math.min(qty, item.qty)) });
    this.lastPick = item.id;
    this.setStatus(`${t(item.name)} ×${qty} — ${t('판매 목록에 담았다')}`);
    this.renderGrid();
  }

  /** 이 가게에 못 파는 까닭(끌어 놓았을 때 알려 준다) */
  private sellRefusal(item: InvItem): string {
    if (this.shop.buysCategories.length === 0) return t('이 가게는 물건을 사들이지 않는다.');
    if (item.slot < 0) return t('쓰고 있는 장비는 먼저 벗어야 팔 수 있다.');
    const v = StoryStore.sellVerdict(item);
    if (v) return v.reasonKo;
    if (item.forageCatch) return t('채집물은 팔 수 없다 (강원 조례).');
    if (item.plateWip) return t('미완성 접시는 마저 담아야 값이 매겨진다.');
    if (item.bound) return t('이 물건은 팔 수 없다.');
    return t('이 가게는 그 물건을 사지 않는다.');
  }

  private onInventoryDrop(item: InvItem, p: Phaser.Input.Pointer, res: InvDropResult): void {
    if (res.handled || !this.active || !this.visible || !this.containsPointer(p)) return;
    res.handled = true;
    if (this.currentTab === 'consign') {
      const ok = consignableItems(StoryStore.heldLicenses(), GameState.currentRegionId, StoryStore.storyDay).some((i) => i.id === item.id);
      if (ok) { this.consignSel.add(item.id); this.renderGrid(); res.message = `${t(item.name)} — ${t('위판 목록에 올렸다')}`; }
      else res.message = t('그 물건은 위판에 올릴 수 없다.');
      this.setStatus(res.message);
      return;
    }
    const live = this.sellableItems().find((i) => i.id === item.id);
    if (!live) { res.message = this.sellRefusal(item); this.setStatus(res.message); return; }
    if (this.currentTab !== 'sell') this.selectTab('sell');
    res.message = t('몇 개 팔지 정하자.');
    this.askSellQty(live, (q) => this.putInSellCart(live, q));
  }

  private buildCartTour(): TourOptions {
    return {
      id: 'shop_cart',
      anchor: () => this.openDialogRects()[0] ?? this.panelBounds(),
      alive: () => this.active,
      steps: [
        {
          text: '이제 물건을 여러 개 한꺼번에 사고팔 수 있다. 칸을 누를 때마다 장바구니에 담기고, 다시 누르면 빠진다.',
          target: () => this.gridAreaRect(),
          onEnter: () => { if (this.currentTab !== 'buy' && this.currentTab !== 'sell') this.selectTab('buy'); },
        },
        {
          text: '위쪽 칩을 누르면 그 종류만 보이고, 오른쪽 칸에 이름을 쳐서 찾을 수 있다.',
          target: () => (this.filterRowRect ? this.localRect(this.filterRowRect.x, this.filterRowRect.y, this.filterRowRect.width, this.filterRowRect.height) : null),
          skipIf: () => !this.filterRowRect,
        },
        {
          text: '「구매」 · 「판매」 옆 숫자는 담은 가짓수다. 누르면 줄마다 수량을 정하는 창이 열리고, 합계와 남는 돈을 보고 한 번에 거래한다.',
          target: () => this.footerBtnRect(false),
        },
      ],
    };
  }

  private onInventoryChanged = (): void => {
    if (!this.scene) return;
    this.coinText.setText(`보유 재화  ${GameState.player.inventory.coins.toLocaleString()} 원`);
    if (this.currentTab === 'sell') {
      this.pruneSellCart();
      this.renderGrid();
    } else if (this.currentTab === 'consign') {
      this.renderGrid();   // 147차 — 위판으로 빠진 어획물이 목록에서 사라져야 한다
    }
  };

  /** 거래 완료 후 씬에서 호출 — 그리드/잔액 갱신 */
  refresh(): void {
    this.coinText.setText(`보유 재화  ${GameState.player.inventory.coins.toLocaleString()} 원`);
    this.renderGrid();
  }

  setStatus(msg: string): void {
    this.statusText.setText(msg);
  }

  // ── 탭 ────────────────────────────────────────────
  private buildTabs(): void {
    const defs: { id: ShopTab; label: string }[] = [
      { id: 'buy', label: '구매하기' },
      { id: 'fav', label: '즐겨찾기' },
      { id: 'sell', label: '판매하기' },
    ];
    // 136차 — 수리점: 낚시 장비를 다루는 상점(직판장·생활용품점)만 수리를 받는다
    if (this.canRepair) defs.push({ id: 'repair', label: '수리하기' });
    // 147차 — 위판 창구를 겸하는 곳(속초는 직판장)
    if (this.canConsignHere) defs.push({ id: 'consign', label: '위판하기' });
    this.tabDefs = defs;
    const tabW = this.tabWidth(), tabH = 30;
    const ty = this.contentTop + 20;

    defs.forEach((def, i) => {
      const tx = 14 + i * (tabW + 6);
      const g = this.scene.add.graphics();
      this.tabBgs.set(def.id, g);
      const t = this.scene.add.text(tx + tabW / 2, ty + tabH / 2, def.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#8faabf',
      }).setOrigin(0.5);
      this.tabTexts.set(def.id, t);
      const hit = this.scene.add.rectangle(tx + tabW / 2, ty + tabH / 2, tabW, tabH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.selectTab(def.id));
      this.add([g, t, hit]);
    });
    this.paintTabs();
  }

  private selectTab(id: ShopTab): void {
    this.stopSearch();
    // 220차 — 찾는 말은 탭마다 따로다(구매에서 친 「찌」가 판매 목록을 비워 보이게 하지 않는다)
    if (id !== this.currentTab) this.query = '';
    this.currentTab = id;
    this.scrollRow = 0;
    this.paintTabs();
    this.renderGrid();
  }

  /** 탭이 4개까지 늘 수 있어 패널 폭(460)에 맞춰 줄인다 — 고정 120이면 4탭에서 52px 넘친다 */
  private tabWidth(): number {
    const n = Math.max(1, this.tabDefs.length || 2);
    return Math.min(120, Math.floor((PANEL_W - 28 - (n - 1) * 6) / n));
  }

  private paintTabs(): void {
    const tabW = this.tabWidth(), tabH = 30;
    const ty = this.contentTop + 20;
    this.tabDefs.forEach(({ id }, i) => {
      const tx = 14 + i * (tabW + 6);
      const g = this.tabBgs.get(id)!;
      const selected = id === this.currentTab;
      g.clear();
      g.fillStyle(selected ? 0x155a7c : 0x0e1c2d, selected ? 0.98 : 0.9);
      g.fillRoundedRect(tx, ty, tabW, tabH, 4);
      g.lineStyle(1.5, selected ? 0x5cd0ff : 0x1f3d5a, 0.95);
      g.strokeRoundedRect(tx, ty, tabW, tabH, 4);
      this.tabTexts.get(id)!.setColor(selected ? '#aee8ff' : '#8faabf');
    });
    this.footerRight?.setText(
      this.currentTab === 'repair' ? '수리' : this.currentTab === 'consign' ? (this.auctionOpenNow() ? '출품하기' : '맡겨 두기') : '판매');
    this.updateFooterLabels();
  }

  // ── 그리드 ────────────────────────────────────────
  /** 구매가 — 스킬 흥정(랭크당 -3%) (122차) */
  private buyPriceOf(entry: { price: number }): number {
    return shopBuyUnitPrice(entry);
  }
  /** 판매가 — 스킬 흥정·단골 배율 (122차) */
  private sellPriceOf(item: InvItem): number {
    return shopSellUnitPrice(item);   // 221차 — 씬 정산과 같은 값(단 타이틀 판매가 포함)
  }

  /** 222차 「시세 읽기」 — 지금 값이 기준가에서 몇 % 오르내렸는지(물량 · 판매처 선호). 스킬 없으면 빈 줄 */
  private marketEyeLine(item: InvItem): string {
    if (GameState.skillBonus('market_eye') <= 0) return '';
    const q = MarketStore.quote(item, 0);
    if (!q) return '';
    const pct = (m: number): string => { const v = Math.round((m - 1) * 100); return `${v >= 0 ? '+' : '−'}${Math.abs(v)}%`; };
    return `\n시세 — 물량 ${pct(q.satMult)} · 판매처 ${pct(q.prefMult)}`;
  }

  /** 196차 — 이 지점의 시세·수요 화살표(어획물만) */
  private trendOf(item: InvItem): MarketTrend | undefined {
    return MarketStore.quote(item, 0)?.trend;
  }

  /**
   * 이 가게에 팔 수 있는 내 물건. 착용 중(slot < 0)·채집물(조례 금지 — 121차)·미완성 접시(135차)·
   * 귀속(141차)·법 규칙 §3(134차)에 걸리는 것은 뺀다.
   */
  private sellableItems(): InvItem[] {
    return InventoryStore.items.filter(
      (i) => this.shop.buysCategories.includes(i.category) && i.slot >= 0
        && !i.forageCatch && !i.plateWip && !i.bound && !StoryStore.sellVerdict(i),
    );
  }

  private renderGrid(): void {
    this.gridContainer.removeAll(true);
    this.hideTooltip();
    this.selCellAt = null;
    this.firstCellAt = null;

    const gridW = GRID_COLS * SLOT + (GRID_COLS - 1) * SLOT_GAP;
    const gx0 = (PANEL_W - gridW) / 2;
    let gy0 = this.contentTop + (this.currentTab === 'consign' ? 96 : 60);
    this.searchRect = null;
    this.filterRowRect = null;

    // ── 1) 셀 스펙 수집 ──
    const cells: ShopCell[] = [];
    if (this.currentTab === 'buy') {
      const reco = RecommendationStore.get();
      this.pruneBuyCart();
      const all = this.buyables();
      gy0 = this.renderFilters('buy', all.map((e) => e.category));
      const shown = all.filter((e) => this.passesFilter('buy', e.category, e.name, e.subCategory));
      shown.forEach((entry) => cells.push(this.buyCell(entry, reco)));
      if (all.length === 0) this.renderEmptyNote(gy0, '판매 품목이 없습니다.');
      else if (cells.length === 0) this.renderEmptyNote(gy0, '찾는 물건이 없다.');
    } else if (this.currentTab === 'fav') {
      // 221차 — 이 가게 즐겨찾기(별을 단 물건만). 눌러서 장바구니에 담는다
      const reco = RecommendationStore.get();
      this.pruneBuyCart();
      const keys = ShopStore.favorites(this.ctx.key);
      const favs = keys.map((k) => this.buyables().find((e) => entryKey(e) === k)).filter((e): e is ShopEntry => !!e);
      gy0 = this.renderFavHeader(favs);
      favs.forEach((entry) => cells.push(this.buyCell(entry, reco)));
      if (favs.length === 0) this.renderEmptyNote(gy0, t('진열 칸 오른쪽 위 별을 누르면 여기에 모인다.'));
    } else if (this.currentTab === 'repair') {
      // 136차 — 고장난 장비 목록. 수리 불가(절지 파단·찌 파손)는 폐기 안내만 뜬다.
      const faulty = InventoryStore.faultyItems();
      faulty.forEach((item) => {
        const def = GEAR_FAULTS[item.fault!];
        const fee = gearRepairFee(item.fault!, item.basePrice ?? 0);
        cells.push({
          icon: item.icon, iconTexture: item.iconTexture, name: item.name,
          priceLabel: def.repair === 'none' ? '수리 불가' : `${fee.toLocaleString()}원`,
          qtyLabel: '',
          selected: this.selectedRepair?.id === item.id,
          tooltip: `${item.name}\n${def.labelKo} — ${def.fixKo}`,
          onSelect: () => { this.selectedRepair = item; this.renderGrid(); },
          onDetail: () => this.cbs.onOpenDetail(item),
        });
      });
      if (faulty.length === 0) this.renderEmptyNote(gy0, '고장난 장비가 없습니다.');
    } else if (this.currentTab === 'consign') {
      // 147차 — 위판 출품 목록. 낚싯대 어획은 법이 영원히 막고(§3), 통발·채집물은
      // 어업인 자격(reported_fishery)이 있어야 올라간다. 판정은 core canConsign이 한다.
      // 171차 — 자격 갱신을 연체하면 위판 창구가 닫힌다(자격 자체를 잃지는 않는다).
      const up = GameState.upkeepPenalty();
      if (up.blockConsign) {
        this.renderEmptyNote(gy0, `${up.overdueNames[0]} 납부가 밀려 위판을 받지 않습니다.`);
        return;
      }
      const licenses = StoryStore.heldLicenses();
      const region = GameState.currentRegionId;
      const items = consignableItems(licenses, region, StoryStore.storyDay);
      const crated = hasCrate();
      items.forEach((item) => {
        const picked = this.consignSel.has(item.id);
        const kg = ((item.weightG ?? 0) / 1000).toFixed(1);
        cells.push({
          icon: item.icon, iconTexture: item.iconTexture, name: item.name,
          speciesId: item.speciesId, lengthCm: item.lengthCm,
          priceLabel: t(`${consignGradeOf(item)}급`),
          qtyLabel: `${kg}kg`,
          condition: item.condition,
          selected: picked,
          tooltip: `${item.name}\n${kg}kg · ${t(`${consignGradeOf(item)}급`)}`,
          onSelect: () => {
            if (picked) this.consignSel.delete(item.id); else this.consignSel.add(item.id);
            this.renderGrid();
          },
          onDetail: () => this.cbs.onOpenDetail(item),
        });
      });
      this.renderConsignHeader(items.length, crated);
      if (items.length === 0) {
        const blocked = InventoryStore.items.find((i) => i.slot >= 0 && i.subCategory === '어획물' && !!i.speciesId);
        const v = blocked ? StoryStore.consignVerdict(blocked, region) : null;
        this.renderEmptyNote(gy0 + 22, v
          ? `${v.reasonKo}\n대안: ${v.alternatives.slice(0, 2).join(' / ')}`
          : '위판할 어획물이 없습니다.');
      }
    } else {
      // 착용 중 장비(slot < 0 = 그리드 이탈)는 판매 목록에서 제외 — 먼저 해제해야 한다 (2026-08-05 개편)
      // 채집물(forageCatch)은 조례상 판매·유통 금지 — 목록에서 제외 (121차)
      const hasForage = InventoryStore.items.some((i) => i.forageCatch && i.slot >= 0);
      // 134차 — 법 규칙 §3 (LAW_SELL_ROD 등). TUNING.law.enforceRodSell 이 꺼져 있으면 null = 현행 허용
      const lawBlocked = InventoryStore.items.filter((i) => i.slot >= 0 && !!StoryStore.sellVerdict(i));
      // 미완성 사시미 접시(plateWip)도 제외 — 완성해야 값이 매겨진다 (135차)
      const hasWipPlate = InventoryStore.items.some((i) => i.plateWip && i.slot >= 0);
      const sellable = this.sellableItems();
      if (this.shop.buysCategories.length > 0 && sellable.length > 0) gy0 = this.renderFilters('sell', sellable.map((i) => i.category));
      const shownSell = sellable.filter((i) => this.passesFilter('sell', i.category, i.name, i.subCategory));
      shownSell.forEach((item) => {
        const inCart = this.sellCart.get(item.id);
        cells.push({
          icon: item.icon, iconTexture: item.iconTexture, name: item.name,
          speciesId: item.speciesId, lengthCm: item.lengthCm,
          priceLabel: `${this.sellPriceOf(item).toLocaleString()}원`,
          // 221차 — 담은 수 / 가진 수
          qtyLabel: inCart && inCart.qty < item.qty ? `${inCart.qty}/${item.qty}` : item.qty > 1 ? `x${item.qty}` : '',
          condition: item.condition,
          trend: this.trendOf(item),
          selected: !!inCart,
          tooltip: `${item.name}\n매입가 ${this.sellPriceOf(item).toLocaleString()}원${item.condition ? ' · ' + CONDITION_LABEL[item.condition] : ''}${this.marketEyeLine(item)}`,
          onSelect: () => {
            // 220차 — 누를 때마다 판매 목록에 넣고 뺀다. 221차 — 여러 개면 몇 개 팔지 먼저 묻는다(구: 가진 만큼 통째로)
            if (this.sellCart.has(item.id)) { this.sellCart.delete(item.id); if (this.lastPick === item.id) this.lastPick = null; this.renderGrid(); }
            else this.askSellQty(item, (q) => this.putInSellCart(item, q));
          },
          onDetail: () => this.cbs.onOpenDetail(item),
        });
      });
      if (this.shop.buysCategories.length === 0) {
        this.renderEmptyNote(gy0, '이 상점은 아이템을 매입하지 않습니다.');
      } else if (sellable.length > 0 && shownSell.length === 0) {
        this.renderEmptyNote(gy0, '찾는 물건이 없다.');
      } else if (sellable.length === 0) {
        const v = lawBlocked.length ? StoryStore.sellVerdict(lawBlocked[0]) : null;
        this.renderEmptyNote(gy0, v ? `${v.reasonKo}\n대안: ${v.alternatives.slice(0, 2).join(' / ')}`
          : hasForage ? '채집물은 판매·유통이 금지되어 있습니다 (강원 조례) — 요리·자가 소비만'
            : hasWipPlate ? '미완성 사시미 접시는 팔 수 없습니다 — 요리(U) 도마에서 마저 담아 완성하세요'
              : '판매할 수 있는 아이템이 없습니다.');
      }
    }

    // ── 2) 윈도우드 렌더 — 보이는 행만 생성 ──
    //  마스크로 가리는 방식은 스크롤아웃된 셀의 입력 히트가 그대로 남아(Phaser는 마스크로
    //  입력을 클립하지 않음) 패널 밖 오클릭이 생긴다. 드래그 팝업 안의 인터랙티브 목록은
    //  UtilizationPanel.mountChooserList와 동일하게 "보이는 행만 생성"으로 처리한다.
    const vpH = GRID_VP_BOTTOM - gy0;
    const rowsVisible = Math.max(1, Math.floor((vpH + SLOT_GAP) / (SLOT + SLOT_GAP)));
    const totalRows = Math.ceil(cells.length / GRID_COLS);
    this.maxScrollRow = Math.max(0, totalRows - rowsVisible);
    this.scrollRow = Phaser.Math.Clamp(this.scrollRow, 0, this.maxScrollRow);

    const first = this.scrollRow * GRID_COLS;
    const last = Math.min(cells.length, first + rowsVisible * GRID_COLS);
    for (let i = first; i < last; i++) this.renderCell(gx0, gy0, i - first, cells[i]);

    this.drawScrollBar(gy0, vpH, totalRows, rowsVisible);
    this.updateFooterLabels();
    this.applyFix();
  }

  /** 141차 — 메인 퀘스트가 열기 전엔 목록에 없다(잠금 표시도 없음: 이야기가 알려 준다) */
  private buyables(): ShopEntry[] {
    return this.shop.sells.filter((e) => (!e.unlockKey || GameState.getFlag(`unlock.shop.${e.unlockKey}`))
      && !(e.blueprintId && CraftingStore.knows(e.blueprintId)));   // 223차 — 아는 도면 종이는 안 판다
  }

  /** 221차 — 즐겨찾기 탭 머리줄(개수 · 「모두 담기」). 그리드 시작 y를 돌려준다 */
  private renderFavHeader(favs: ShopEntry[]): number {
    const y = this.contentTop + 56, h = 24;
    const label = this.scene.add.text(14, y + h / 2, `${t('즐겨찾기')} ${favs.length}`, {
      fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#9fc0d4',
    }).setOrigin(0, 0.5);
    this.gridContainer.add(label);
    const addable = favs.filter((e) => this.remainingOf(e) !== 0 && !this.buyCart.has(entryKey(e)));
    if (favs.length > 0) {
      const w = 96, x = PANEL_W - 14 - w;
      const on = addable.length > 0;
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x0d4a2e : 0x15202c, 0.95); g.fillRoundedRect(x, y, w, h, 4);
      g.lineStyle(1.2, on ? 0x4af2a1 : 0x2a3a4a, 0.95); g.strokeRoundedRect(x, y, w, h, 4);
      const txt = this.scene.add.text(x + w / 2, y + h / 2, '모두 담기', {
        fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: on ? '#4af2a1' : '#4a5a6a',
      }).setOrigin(0.5);
      this.gridContainer.add([g, txt]);
      if (on) {
        const hit = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          for (const e of addable) this.buyCart.set(entryKey(e), { entry: e, qty: 1 });
          this.setStatus(`${addable.length}${t('가지를 장바구니에 담았다')}`);
          this.renderGrid();
        });
        this.gridContainer.add(hit);
      }
    }
    return y + h + 10;
  }

  // ── 220차 — 종류 칩 · 이름 찾기 ─────────────────────
  private passesFilter(tab: 'buy' | 'sell', cat: InvCategory, name: string, sub?: string): boolean {
    const f = this.catFilter[tab];
    if (f !== 'all' && cat !== f) return false;
    const q = this.query.trim().toLowerCase();
    if (!q) return true;
    // 한국어 원문 · 지금 언어 표기 · 하위 분류 어느 것에 걸려도 찾는다
    return [name, t(name), sub ?? '', sub ? t(sub) : ''].some((s) => s.toLowerCase().includes(q));
  }

  /**
   * 종류 칩(전체 + 이 목록에 있는 종류만) · 찾기 칸을 흐름 배치로 그리고 **그리드가 시작할 y**를 돌려준다.
   * 칩이 한 줄을 넘으면 다음 줄로 넘기고, 찾기 칸은 마지막 줄 오른쪽 끝(자리가 없으면 새 줄)에 둔다.
   */
  private renderFilters(tab: 'buy' | 'sell', cats: InvCategory[]): number {
    const present = CAT_ORDER.filter((c) => cats.includes(c));
    if (this.catFilter[tab] !== 'all' && !present.includes(this.catFilter[tab] as InvCategory)) this.catFilter[tab] = 'all';
    const x0 = 14, xMax = PANEL_W - 14, chipH = 22, gap = 5;
    let x = x0, y = this.contentTop + 56;
    const chips: ('all' | InvCategory)[] = present.length > 1 ? ['all', ...present] : [];
    for (const c of chips) {
      const on = this.catFilter[tab] === c;
      const label = this.scene.add.text(0, 0, c === 'all' ? '전체' : CATEGORY_LABEL[c], {
        fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: on ? '#0b1f14' : '#9fc0d4',
      }).setOrigin(0.5);
      const w = Math.ceil(label.width) + 18;
      if (x + w > xMax) { x = x0; y += chipH + 4; }
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x4af2a1 : 0x0e1c2d, on ? 0.95 : 0.9); g.fillRoundedRect(x, y, w, chipH, 11);
      g.lineStyle(1, on ? 0x4af2a1 : 0x2a5070, 0.95); g.strokeRoundedRect(x, y, w, chipH, 11);
      label.setPosition(x + w / 2, y + chipH / 2);
      const hit = this.scene.add.rectangle(x + w / 2, y + chipH / 2, w, chipH, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this.catFilter[tab] = c; this.scrollRow = 0; this.renderGrid(); });
      this.gridContainer.add([g, label, hit]);
      x += w + gap;
    }
    // 찾기 칸
    if (x + SEARCH_W > xMax) { if (chips.length) { x = x0; y += chipH + 4; } }
    const sx = chips.length ? xMax - SEARCH_W : x0;
    const sw = chips.length ? SEARCH_W : xMax - x0;
    this.renderSearch(sx, y, sw, chipH);
    this.filterRowRect = new Phaser.Geom.Rectangle(x0, this.contentTop + 56, xMax - x0, y + chipH - (this.contentTop + 56));
    return y + chipH + 8;
  }

  private renderSearch(x: number, y: number, w: number, h: number): void {
    const editing = !!this.searchInput;
    const g = this.scene.add.graphics();
    g.fillStyle(0x07121e, 0.95); g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1.2, editing ? 0x5cd0ff : 0x2a5070, 0.95); g.strokeRoundedRect(x, y, w, h, 4);
    // 돋보기(절차 그림 — 이모지 금지)
    g.lineStyle(1.6, editing ? 0x9fe8ff : 0x6f93ad, 1);
    g.strokeCircle(x + 11, y + h / 2 - 1, 4.5);
    g.lineBetween(x + 14.5, y + h / 2 + 2.5, x + 18, y + h / 2 + 6);
    this.gridContainer.add(g);
    const hasQ = this.query.length > 0;
    const shown = hasQ ? this.query : (editing ? '' : t('이름으로 찾기'));
    const txt = this.scene.add.text(x + 24, y + h / 2, shown + (editing ? '|' : ''), {
      fontFamily: FONT, fontSize: '11px', color: hasQ || editing ? '#e8f4fd' : '#56708a',
    }).setOrigin(0, 0.5);
    clampTextWidth(txt, w - 24 - (hasQ ? 22 : 6));
    this.gridContainer.add(txt);
    const hit = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => { if (!this.searchInput) this.startSearch(); });
    this.gridContainer.add(hit);
    this.searchRect = new Phaser.Geom.Rectangle(x, y, w, h);
    if (hasQ) {
      const cx = this.scene.add.text(x + w - 11, y + h / 2, '✕', { fontFamily: 'sans-serif', fontSize: '11px', color: '#8faabf' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      cx.on('pointerdown', () => { this.query = ''; this.searchInput?.setValue(''); this.scrollRow = 0; this.renderGrid(); });
      this.gridContainer.add(cx);
    }
  }

  private startSearch(): void {
    this.searchInput = new TextInput(this.scene, {
      value: this.query,
      maxLength: 20,
      filter: (v) => v.replace(/[\r\n\t]/g, ''),
      onChange: (v) => { this.query = v; this.scrollRow = 0; this.renderGrid(); },
      onSubmit: () => this.stopSearch(),
      onCancel: () => this.stopSearch(),
    });
    this.renderGrid();
  }

  private stopSearch(): void {
    if (!this.searchInput) return;
    this.searchInput.close();
    this.searchInput = undefined;
    if (this.scene) this.renderGrid();
  }

  /** 가방에서 사라진(팔렸거나 옮긴) 물건은 판매 목록에서 뺀다 */
  private pruneSellCart(): void {
    for (const [id, l] of this.sellCart) {
      const live = InventoryStore.find(id);
      if (!live || live.slot < 0) this.sellCart.delete(id);
      else { l.item = live; l.qty = Math.min(l.qty, live.qty); }
    }
  }

  private updateFooterLabels(): void {
    const nb = this.buyCart.size, ns = this.sellCart.size;
    this.footerLeft?.setText(nb > 0 ? `${t('구매')} (${nb})` : t('구매'));
    if (this.currentTab === 'sell' || this.currentTab === 'buy') {
      this.footerRight?.setText(ns > 0 ? `${t('판매')} (${ns})` : t('판매'));
    }
  }

  /** 220차 — 장바구니 · 판매 목록 확인 창 */
  private openCart(mode: 'buy' | 'sell'): void {
    if (this.cartOpen) return;
    this.stopSearch();
    const lines: CartLine[] = mode === 'buy'
      ? [...this.buyCart.entries()].map(([key, { entry, qty }]) => ({
        key, name: entry.name, icon: entry.icon, iconTexture: entry.iconTexture, speciesId: entry.speciesId, lengthCm: entry.lengthCm,
        unit: this.buyPriceOf(entry), qty, max: this.buyMaxOf(entry),
      }))
      : [...this.sellCart.entries()].map(([key, { item, qty }]) => ({
        key, name: item.name, icon: item.icon, iconTexture: item.iconTexture, speciesId: item.speciesId, lengthCm: item.lengthCm,
        unit: this.sellPriceOf(item), qty, max: Math.max(1, item.qty),
      }));
    // 창이 수량을 고치면 담은 표시도 맞춘다
    const sync = (ls: CartLine[]): void => {
      const keep = new Set(ls.map((l) => l.key));
      if (mode === 'buy') {
        for (const k of [...this.buyCart.keys()]) if (!keep.has(k)) this.buyCart.delete(k);
        for (const l of ls) { const c = this.buyCart.get(l.key); if (c) c.qty = l.qty; }
      } else {
        for (const k of [...this.sellCart.keys()]) if (!keep.has(k)) this.sellCart.delete(k);
        for (const l of ls) { const c = this.sellCart.get(l.key); if (c) c.qty = l.qty; }
      }
      this.renderGrid();
    };
    const make = (close: () => void): ShopCartDialog => new ShopCartDialog(this.scene, {
      mode, lines, coins: GameState.player.inventory.coins,
      onChange: sync,
      onCancel: () => { this.cartOpen = false; close(); },
      onConfirm: (ls) => {
        this.cartOpen = false;
        close();
        if (mode === 'buy') {
          const req = ls.map((l) => ({ entry: this.buyCart.get(l.key)!.entry, qty: l.qty })).filter((r) => r.entry);
          this.buyCart.clear();
          this.cbs.onBuy(req);
        } else {
          const req = ls.map((l) => ({ item: this.sellCart.get(l.key)!.item, qty: l.qty })).filter((r) => r.item);
          this.sellCart.clear();
          this.cbs.onSell(req);
        }
        this.lastPick = null;
        this.renderGrid();
      },
    });
    this.cartOpen = true;
    if (this.cbs.openPopup) this.cbs.openPopup((close) => make(() => { this.cartOpen = false; close(); }));
    else {
      const d = make(() => { this.cartOpen = false; d.destroy(); });
      this.scene.add.existing(d);
    }
  }

  /**
   * 위판 탭 상단 — 개장 여부·다음 개장까지·수수료(평판 반영)·최저 희망가 토글.
   * 개장 시간은 구매자 측 경매와 같은 스케줄을 쓴다(선어 01~03시 / 활어 03~07시 · 일요일 미개장).
   */
  /** 213차 — 지금 어느 위판이든 서 있는가(아니면 [출품하기]가 [맡겨 두기]가 된다) */
  private auctionOpenNow(): boolean {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60_000);
    const h = kst.getHours(), m = kst.getMinutes(), wd = kst.getDay();
    return isConsignmentOpen('fish_live', h, m, wd) || isConsignmentOpen('fish_fresh', h, m, wd);
  }

  private renderConsignHeader(count: number, crated: boolean): void {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60_000);
    const h = kst.getHours(), m = kst.getMinutes(), wd = kst.getDay();
    const liveOpen = isConsignmentOpen('fish_live', h, m, wd);
    const freshOpen = isConsignmentOpen('fish_fresh', h, m, wd);
    const fee = consignmentFeeRate(StoryStore.harborRep(GameState.currentRegionId), coopDuesFeeCut(GameState.coopDuesPaid()));

    // ⚠ 합성 문자열은 정확 일치 사전을 비껴간다(131차) — **붙이기 전에** 조각을 t()로 번역한다
    const openLabel = liveOpen ? t('활어 경매 진행 중')
      : freshOpen ? t('선어 경매 진행 중')
        : (() => {
          const mins = minutesUntilConsignment(h, m, wd);
          if (mins < 0) return t('다음 개장 시간을 알 수 없습니다');
          const hh = Math.floor(mins / 60), mm = mins % 60;
          // 단위어('시간'·'분')는 전역 사전에 넣지 않는다 — 게임 전체의 다른 Text까지 오염시킨다.
          // 이런 조각만 로케일 분기로 처리한다.
          const dur = getLocale() === 'en'
            ? `${hh > 0 ? hh + 'h ' : ''}${mm}m`
            : `${hh > 0 ? hh + '시간 ' : ''}${mm}분`;
          return `${t('지금은 파장입니다 — 다음 개장까지')} ${dur}`;
        })();

    const y0 = this.contentTop + 58;
    // 213차 — 맡겨 둔 물건이 있으면 몇 건인지(정산되면 사라진다)
    const held = ConsignQueue.pending.reduce((n, b) => n + b.inputs.length, 0);
    const info = this.scene.add.text(16, y0,
      `${openLabel}   ·   ${t('위판 수수료')} ${(fee * 100).toFixed(1)}%${crated ? '   ·   ' + t('규격 상자 보유') : ''}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
        color: (liveOpen || freshOpen) ? '#4af2a1' : '#ffb27a',
        wordWrap: { width: PANEL_W - 32 },
      });
    this.gridContainer.add(info);

    const picked = count > 0 ? this.consignSel.size : 0;
    const sel = this.scene.add.text(16, y0 + 17,
      `${t('출품 선택')} ${picked} / ${count}${getLocale() === 'en' ? '' : '건'}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
      });
    this.gridContainer.add(sel);

    // 214차 — 맡겨 둔 물건이 있으면 누를 수 있는 칩(목록 · 찾아오기)
    if (held > 0) {
      const hx = 16 + sel.width + 18;
      const hl = this.scene.add.text(hx + 8, y0 + 17, `${t('맡겨 둔 물건')} ${held}${getLocale() === 'en' ? '' : '건'}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#bfe9ff',
      });
      const hg = this.scene.add.graphics();
      hg.fillStyle(0x16324a, 0.95); hg.fillRoundedRect(hx, y0 + 14, hl.width + 16, hl.height + 6, 3);
      hg.lineStyle(1, 0x5cd0ff, 0.8); hg.strokeRoundedRect(hx, y0 + 14, hl.width + 16, hl.height + 6, 3);
      const hh = this.scene.add.rectangle(hx + (hl.width + 16) / 2, y0 + 17 + hl.height / 2, hl.width + 16, hl.height + 6, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hh.on('pointerdown', () => this.cbs.onShowConsigned?.());
      this.gridContainer.add([hg, hl, hh]);
    }

    // 최저 희망가 — 클릭하면 없음 → 70% → 90% 순환
    const rLabel = this.scene.add.text(PANEL_W - 16, y0 + 17,
      `${t('최저 희망가')}: ${t(RESERVE_LABEL[this.reserveMode])}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffe28a',
    }).setOrigin(1, 0);
    const rHit = this.scene.add.rectangle(
      PANEL_W - 16 - rLabel.width / 2, y0 + 17 + rLabel.height / 2,
      rLabel.width + 10, rLabel.height + 8, 0xffffff, 0.001,
    ).setInteractive({ useHandCursor: true });
    rHit.on('pointerdown', () => {
      this.reserveMode = this.reserveMode === 'none' ? 'p70' : this.reserveMode === 'p70' ? 'p90' : 'none';
      this.renderGrid();
    });
    this.gridContainer.add([rLabel, rHit]);
  }

  /** [출품하기] — 고른 어획물을 로트 입력으로 바꿔 씬에 넘긴다 */
  private doConsign(): void {
    if (!this.cbs.onConsign) return;
    const licenses = StoryStore.heldLicenses();
    const region = GameState.currentRegionId;
    const pool = consignableItems(licenses, region, StoryStore.storyDay);
    const items = pool.filter((i) => this.consignSel.has(i.id));
    if (items.length === 0) { this.setStatus('출품할 어획물을 먼저 고르세요.'); return; }

    const crated = hasCrate();
    const origin = REGION_DATABASE.find((r) => r.id === region)?.shortNameKo ?? '속초';
    const inputs = items.map((i) => consignInputOf(i, this.reserveMode, origin, crated));
    this.consignSel.clear();
    this.cbs.onConsign(inputs, items);
  }

  /** 우측 스크롤바 (트랙 + 행 비례 썸) — 스크롤이 필요한 경우에만 표시 */
  private drawScrollBar(gy0: number, vpH: number, totalRows: number, rowsVisible: number): void {
    if (this.maxScrollRow <= 0) { this.barGeom = null; return; }

    const g = this.scene.add.graphics();
    g.fillStyle(0x14324a, 0.9);
    g.fillRoundedRect(BAR_X, gy0, 5, vpH, 2);
    const thumbH = Math.max(26, (vpH * rowsVisible) / totalRows);
    const prog = this.scrollRow / this.maxScrollRow;
    g.fillStyle(0x5cd0ff, 0.95);
    g.fillRoundedRect(BAR_X, gy0 + (vpH - thumbH) * prog, 5, thumbH, 2);
    this.gridContainer.add(g);

    const hit = this.scene.add.rectangle(BAR_X + 2.5, gy0 + vpH / 2, 18, vpH, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.thumbDrag = true;
      this.barMoveHandler(p);
    });
    this.gridContainer.add(hit);
    this.barGeom = { top: gy0, h: vpH };

    // 현재 위치 표기 (숨겨진 품목이 있다는 신호 — 조용한 잘림 금지).
    // 뷰포트 **안쪽** 하단에 둔다 — 아래(PANEL_H-104)의 안내문과 세로로 겹치지 않게.
    const info = this.scene.add.text(BAR_X + 2.5, GRID_VP_BOTTOM - 12,
      `${this.scrollRow + 1}–${Math.min(totalRows, this.scrollRow + rowsVisible)} / ${totalRows}행`, {
        fontFamily: 'monospace', fontSize: '8px', color: '#5f8ba6',
      }).setOrigin(1, 0);
    this.gridContainer.add(info);
  }

  /** 화면 고정 패널이라 포인터 화면좌표와 직접 비교 가능 */
  private containsPointer(p: Phaser.Input.Pointer): boolean {
    return p.x >= this.x && p.x <= this.x + PANEL_W && p.y >= this.y && p.y <= this.y + PANEL_H;
  }

  private renderEmptyNote(gy0: number, msg: string): void {
    const note = this.scene.add.text(PANEL_W / 2, gy0 + 120, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#607b8e',
    }).setOrigin(0.5);
    this.gridContainer.add(note);
  }

  /** idx = **표시 인덱스**(스크롤 윈도우 기준 0부터) — 데이터 인덱스가 아니다 */
  private renderCell(gx0: number, gy0: number, idx: number, cell: ShopCell): void {
    const col = idx % GRID_COLS;
    const row = Math.floor(idx / GRID_COLS);
    const sx = gx0 + col * (SLOT + SLOT_GAP);
    const sy = gy0 + row * (SLOT + SLOT_GAP);
    if (cell.selected) this.selCellAt = { x: sx, y: sy };
    if (idx === 0) this.firstCellAt = { x: sx, y: sy };

    const box = this.scene.add.graphics();
    const paint = (hover: boolean): void => {
      box.clear();
      box.fillStyle(cell.selected ? 0x155a3c : (hover ? 0x162a40 : 0x0e1c2d), 0.95);
      box.fillRoundedRect(sx, sy, SLOT, SLOT, 4);
      // 추천 아이템은 금색 테두리로 강조
      const stroke = cell.selected ? 0x4af2a1 : cell.recommended ? 0xffd257 : (hover ? 0x5cd0ff : 0x1f3d5a);
      box.lineStyle(cell.selected || cell.recommended ? 2 : 1.2, stroke, 0.95);
      box.strokeRoundedRect(sx, sy, SLOT, SLOT, 4);
    };
    paint(false);
    this.gridContainer.add(box);

    if (cell.recommended) {
      const rb = this.scene.add.text(sx + SLOT / 2, sy - 2, '추천', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#0b1f14',
        backgroundColor: '#ffd257', padding: { x: 3, y: 1 }, fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      this.gridContainer.add(rb);
    }

    const icon = createItemIcon(this.scene, sx + SLOT / 2, sy + SLOT / 2 - 10, cell, 28);
    if (cell.soldOut) icon.setAlpha(0.35);   // 221차 — 품절은 흐리게
    this.gridContainer.add(icon);
    // 221차 — 남은 수 · 품절(값 바로 위 — 넉넉하면 비운다)
    if (cell.stock) {
      const st = this.scene.add.text(sx + SLOT / 2, sy + SLOT - 27, cell.stock, {
        fontFamily: FONT, fontSize: '8px', color: cell.soldOut ? '#ff8a7a' : '#8fb0c4', fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      clampTextWidth(st, SLOT - 6);
      this.gridContainer.add(st);
    }

    const price = this.scene.add.text(sx + SLOT / 2, sy + SLOT - 16, cell.priceLabel, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.gridContainer.add(price);

    if (cell.qtyLabel) {
      // 221차 — 별(오른쪽 위)이 있으면 담은 수는 그 아래
      const qty = this.scene.add.text(sx + SLOT - 4, sy + (cell.onFav ? 19 : 3), cell.qtyLabel, {
        fontFamily: 'monospace', fontSize: '9px', color: '#aee8ff', fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.gridContainer.add(qty);
    }
    // 196차 — 우상단 시세·수요 화살표(수량 글자가 있으면 그 아래)
    if (cell.trend !== undefined) {
      this.gridContainer.add(drawTrendIcon(this.scene, sx + SLOT - TREND_ICON_PX - 2, sy + (cell.qtyLabel ? 14 : 2), cell.trend));
    }

    if (cell.condition) {
      const badge = this.scene.add.text(sx + 3, sy + 3, CONDITION_LABEL[cell.condition], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '7px', color: '#4af2a1', fontStyle: 'bold',
        backgroundColor: '#050f1ecc', padding: { x: 2, y: 1 },
      });
      this.gridContainer.add(badge);
    }

    const hit = this.scene.add.rectangle(sx + SLOT / 2, sy + SLOT / 2, SLOT, SLOT, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', (p: Phaser.Input.Pointer) => { paint(true); this.showTooltip(cell.tooltip, p); });
    hit.on('pointerout', () => { paint(false); this.hideTooltip(); });
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) cell.onDetail();
      else cell.onSelect();
    });
    this.gridContainer.add(hit);

    // 221차 — 즐겨찾기 별(칸 오른쪽 위 · 셀 히트 위에 둔다 — topOnly라 별이 먼저 받는다).
    //  왼쪽 위는 상태 글자(활어 · 냉동), 가운데 위는 「추천」이 쓴다
    if (cell.onFav) {
      const star = this.scene.add.graphics();
      const paintStar = (hover: boolean): void => {
        star.clear();
        const pts = starPoints(sx + SLOT - 10, sy + 9, 6, 2.6);
        if (cell.fav) { star.fillStyle(0xffd257, 1); star.fillPoints(pts, true); }
        star.lineStyle(1.2, cell.fav ? 0xffe9a0 : hover ? 0xffd257 : 0x4a6a86, 1);
        star.strokePoints(pts, true);
      };
      paintStar(false);
      const sh = this.scene.add.rectangle(sx + SLOT - 10, sy + 9, 18, 18, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      sh.on('pointerover', () => paintStar(true));
      sh.on('pointerout', () => paintStar(false));
      sh.on('pointerdown', (p: Phaser.Input.Pointer) => { if (!p.rightButtonDown()) cell.onFav?.(); });
      this.gridContainer.add([star, sh]);
    }
  }

  // ── 툴팁 (호버 요약) ──────────────────────────────
  private buildTooltip(): void {
    this.tooltip = this.scene.add.container(0, 0).setVisible(false);
    const bg = this.scene.add.graphics();
    bg.name = 'bg';
    this.tooltipText = this.scene.add.text(8, 6, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#e8f4fd', lineSpacing: 4,
      wordWrap: { width: 200 },
    });
    this.tooltip.add([bg, this.tooltipText]);
    this.add(this.tooltip);
  }

  private showTooltip(text: string, p: Phaser.Input.Pointer): void {
    this.tooltipText.setText(text);
    const bg = this.tooltip.getByName('bg') as Phaser.GameObjects.Graphics;
    const w = this.tooltipText.width + 16;
    const h = this.tooltipText.height + 12;
    bg.clear();
    bg.fillStyle(0x050f1e, 0.97);
    bg.fillRoundedRect(0, 0, w, h, 4);
    bg.lineStyle(1, 0x4af2a1, 0.9);
    bg.strokeRoundedRect(0, 0, w, h, 4);
    // 패널 로컬 좌표
    let lx = p.x - this.x + 14;
    let ly = p.y - this.y + 14;
    if (lx + w > PANEL_W) lx -= w + 24;
    if (ly + h > PANEL_H) ly -= h + 24;
    this.tooltip.setPosition(lx, ly).setVisible(true);
    this.bringSelfToTop();
  }

  private hideTooltip(): void {
    this.tooltip?.setVisible(false);
  }

  // ── 하단 버튼/상태 ────────────────────────────────
  private buildFooter(): void {
    // 188차 — 조작 안내 문구('아이콘 클릭: 선택 · 우클릭: 상세보기')는 지웠다. 첫 방문 가이드가 직접 해 보게 한다.
    this.statusText = this.scene.add.text(PANEL_W / 2, PANEL_H - 104, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fd0e4',
      wordWrap: { width: PANEL_W - 30 }, align: 'center',
    }).setOrigin(0.5);
    this.add(this.statusText);

    // 재화
    this.coinText = this.scene.add.text(PANEL_W / 2, PANEL_H - 82,
      `보유 재화  ${GameState.player.inventory.coins.toLocaleString()} 원`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffe28a', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.add(this.coinText);

    // 구매/판매 버튼
    const btnY = PANEL_H - 40;
    this.footerLeft = this.addFooterButton(PANEL_W / 2 - 105, btnY, '구매', () => {
      if (this.buyCart.size === 0) {
        this.setStatus(this.currentTab === 'buy' ? '살 물건을 눌러 장바구니에 담으세요.' : '구매하기 탭에서 상품을 담으세요.');
        return;
      }
      this.openCart('buy');
    });
    this.footerRight = this.addFooterButton(PANEL_W / 2 + 105, btnY, '판매', () => {
      if (this.currentTab === 'repair') { this.doRepair(); return; }
      if (this.currentTab === 'consign') { this.doConsign(); return; }
      this.pruneSellCart();
      if (this.sellCart.size === 0) {
        this.setStatus(this.currentTab === 'sell' ? '팔 물건을 눌러 판매 목록에 담으세요.' : '판매하기 탭에서 팔 물건을 담으세요.');
        return;
      }
      this.openCart('sell');
    });
  }

  /** 136차 — 수리 실행: 재화 차감 후 고장 해제 */
  private doRepair(): void {
    const item = this.selectedRepair;
    if (!item?.fault) { this.setStatus('수리할 장비를 먼저 선택하세요.'); return; }
    const def = GEAR_FAULTS[item.fault];
    if (def.repair === 'none') { this.setStatus(`${def.labelKo} — ${def.fixKo}`); return; }
    const fee = gearRepairFee(item.fault, item.basePrice ?? 0);
    if (GameState.player.inventory.coins < fee) {
      this.setStatus(`재화가 부족합니다 — ${fee.toLocaleString()}원 필요`);
      return;
    }
    GameState.addCoins(-fee, true, 'repair');   // 211차 — 하루 기록(구: 직접 차감)
    InventoryStore.clearFault(item);
    this.selectedRepair = null;
    this.setStatus(`${item.name} 수리 완료 — ${fee.toLocaleString()}원 지불`);
    this.refresh();
  }

  private footerRight?: Phaser.GameObjects.Text;

  private addFooterButton(cx: number, cy: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0d4a2e, 0.95);
    bg.fillRoundedRect(cx - 95, cy - 20, 190, 40, 5);
    bg.lineStyle(2, 0x4af2a1, 0.95);
    bg.strokeRoundedRect(cx - 95, cy - 20, 190, 40, 5);
    const txt = this.scene.add.text(cx, cy, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(cx, cy, 190, 40, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => txt.setColor('#ffffff'));
    hit.on('pointerout', () => txt.setColor('#4af2a1'));
    hit.on('pointerdown', onClick);
    this.add([bg, txt, hit]);
    return txt;
  }

  // ═══════════════════════════════════════════════
  // 첫 방문 체험 가이드 (188차 — tour id 'shop')
  //  프롤로그는 직판장에서 기본 채비를 하나씩 사고 냉동 오징어를 판다 — 그 흐름 그대로
  //  「고르기 → 사기 → 판매 탭 → 고르기 → 팔기」를 직접 해 보게 한다.
  //  살 돈이 없거나 팔 물건이 없으면 그 단계는 설명으로 바뀐다(skipIf 짝).
  //  구매·판매 완료는 씬(handleBuy/handleSell)이 재화를 바꾸는 것으로 판정한다 — 씬 배선 불필요.
  // ═══════════════════════════════════════════════

  private tabRectOf(id: ShopTab): Phaser.Geom.Rectangle | null {
    const i = this.tabDefs.findIndex((d) => d.id === id);
    if (i < 0) return null;
    const tabW = this.tabWidth();
    return this.localRect(14 + i * (tabW + 6), this.contentTop + 20, tabW, 30);
  }

  private gridAreaRect(): Phaser.Geom.Rectangle {
    const gridW = GRID_COLS * SLOT + (GRID_COLS - 1) * SLOT_GAP;
    const gy0 = this.contentTop + 60;
    return this.localRect((PANEL_W - gridW) / 2, gy0, gridW, GRID_VP_BOTTOM - gy0);
  }

  private footerBtnRect(right: boolean): Phaser.Geom.Rectangle {
    const cx = PANEL_W / 2 + (right ? 105 : -105);
    return this.localRect(cx - 95, PANEL_H - 60, 190, 40);
  }

  private selCellRect(): Phaser.Geom.Rectangle | null {
    return this.selCellAt ? this.localRect(this.selCellAt.x, this.selCellAt.y, SLOT, SLOT) : null;
  }

  /** 지금 떠 있는 수량·확인 창 (씬이 띄운다) */
  private openDialogRects(): Phaser.Geom.Rectangle[] {
    return this.scene.children.list
      .filter((o): o is ConfirmDialog | QuantityDialog | ShopCartDialog =>
        (o instanceof ConfirmDialog || o instanceof QuantityDialog || o instanceof ShopCartDialog) && o.active)
      .map((d) => d.panelBounds());
  }

  private buildTour(): TourOptions {
    const coins = (): number => GameState.player.inventory.coins;
    let coinsAtStep = 0;
    /** 사 보기 단계를 마쳤는가 — 산 뒤 돈이 모자라졌다고 「돈이 모자라다」 설명이 뜨면 안 된다 */
    let bought = false;
    const buyables = (): ShopEntry[] => this.buyables();
    const cartTotal = (): number => [...this.buyCart.values()].reduce((n, l) => n + this.buyPriceOf(l.entry) * l.qty, 0);
    const canBuySel = (): boolean => this.buyCart.size > 0 && cartTotal() <= coins();
    const hasSellable = (): boolean => this.sellableItems().length > 0;
    /** 사기·팔기 단계 — 수량·확인 창이 뜨면 그 창을 짚고 그 창만 누를 수 있게 */
    const dealTarget = (right: boolean) => (): Phaser.Geom.Rectangle => this.openDialogRects()[0] ?? this.footerBtnRect(right);
    const dealAllow = (right: boolean) => (): Phaser.Geom.Rectangle[] => {
      const d = this.openDialogRects();
      return d.length ? d : [this.footerBtnRect(right), this.gridAreaRect()];
    };
    return {
      id: 'shop',
      // 수량·확인 창이 뜨면 말풍선이 그 창을 가리지 않게 기준을 옮긴다
      anchor: () => this.openDialogRects()[0] ?? this.panelBounds(),
      alive: () => this.active,
      steps: [
        {
          text: '가게에 들어오면 이 창이 열린다. 진열된 물건을 사고, 내 물건을 팔 수 있다. 오른쪽에는 내 가방이 함께 열린다.',
          target: () => this.panelBounds(),
          // 220차 — 이 가이드가 장바구니 · 찾기를 함께 알려 준다(따로 도는 짧은 가이드는 건너뛴다)
          onEnter: () => { GameState.setFlag('tour.shop_cart'); GameState.setFlag('tour.shop_fav'); },
        },
        {
          text: '진열대에서 물건 하나를 눌러 장바구니에 담아 보자.',
          target: () => this.gridAreaRect(),
          skipIf: () => buyables().length === 0,
          onEnter: () => { if (this.currentTab !== 'buy') this.selectTab('buy'); },
          wait: () => this.buyCart.size > 0,
        },
        {
          text: '담은 칸은 초록 테두리가 된다. 칸 아래 숫자가 값이다. 여러 개를 담을 수 있고, 다시 누르면 뺀다. 우클릭하면 자세한 정보가 뜬다.',
          target: () => this.selCellRect() ?? this.gridAreaRect(),
          skipIf: () => this.buyCart.size === 0,
        },
        {
          // 221차 — 즐겨찾기 · 재고
          text: '칸 오른쪽 위 별을 누르면 이 가게 즐겨찾기에 들어간다. 장바구니는 가게를 나가면 비지만, 즐겨찾기는 「즐겨찾기」 탭에 남는다. 가게마다 하루에 들여놓는 수가 있어 다 팔리면 새벽에 다시 찬다.',
          target: () => this.firstCellRect() ?? this.gridAreaRect(),
          skipIf: () => buyables().length === 0,
        },
        {
          text: '위쪽 칩을 누르면 그 종류만 보이고, 오른쪽 칸에 이름을 쳐서 찾을 수도 있다.',
          target: () => (this.filterRowRect ? this.localRect(this.filterRowRect.x, this.filterRowRect.y, this.filterRowRect.width, this.filterRowRect.height) : null),
          skipIf: () => !this.filterRowRect,
        },
        {
          text: '아래 「구매」를 누르면 장바구니가 열린다. 줄마다 수량을 정하고 「사기」를 누르면 값을 치르고 가방에 들어온다. 사 보자.',
          target: dealTarget(false),
          allow: dealAllow(false),
          skipIf: () => !canBuySel(),
          onEnter: () => { coinsAtStep = coins(); },
          wait: () => { if (coins() < coinsAtStep) bought = true; return bought; },
        },
        {
          text: '「구매」를 누르면 장바구니가 열리고 값을 치른다. 지금은 담은 물건 값이 가진 돈보다 많다.',
          target: () => this.footerBtnRect(false),
          skipIf: () => bought || this.buyCart.size === 0 || canBuySel(),
        },
        {
          text: '가진 돈은 여기 나온다. 사고팔 때마다 바로 바뀐다.',
          target: () => this.localRect(PANEL_W / 2 - 130, PANEL_H - 94, 260, 24),
        },
        {
          text: '이번에는 팔아 보자. 「판매하기」를 누르자.',
          target: () => this.tabRectOf('sell'),
          skipIf: () => !hasSellable(),
          wait: () => this.currentTab === 'sell',
        },
        {
          text: '「판매하기」에는 이 가게가 사들이는 내 물건이 뜬다. 가게마다 사들이는 물건이 다르다.',
          target: () => this.tabRectOf('sell'),
          skipIf: hasSellable,
        },
        {
          text: '팔 물건을 눌러 판매 목록에 담아 보자. 여러 개 가진 물건은 몇 개 팔지 먼저 묻는다. 가방에서 이 창으로 끌어 놓아도 된다.',
          target: () => this.gridAreaRect(),
          skipIf: () => !hasSellable(),
          onEnter: () => { if (this.currentTab !== 'sell') this.selectTab('sell'); },
          wait: () => this.sellCart.size > 0,
        },
        {
          text: '「판매」를 누르면 판매 목록이 열린다. 수량을 확인하고 「팔기」를 누르면 값을 받는다. 팔아 보자.',
          target: dealTarget(true),
          allow: dealAllow(true),
          skipIf: () => this.sellCart.size === 0,
          onEnter: () => { coinsAtStep = coins(); },
          wait: () => coins() > coinsAtStep,
        },
        {
          text: '「수리하기」에서는 고장 난 장비를 돈을 내고 고친다.',
          target: () => this.tabRectOf('repair'),
          skipIf: () => !this.canRepair,
        },
        {
          text: '「위판하기」에서는 잡은 고기를 새벽 경매에 올린다.',
          target: () => this.tabRectOf('consign'),
          skipIf: () => !this.canConsignHere,
        },
      ],
    };
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.events?.off('inventory-changed', this.onInventoryChanged, this);
    this.scene?.events?.off('inventory-drop', this.onInventoryDrop, this);
    this.scene?.input?.off('wheel', this.wheelHandler);
    this.scene?.input?.off('pointermove', this.barMoveHandler);
    this.scene?.input?.off('pointerup', this.barUpHandler);
    this.scene?.input?.off('pointerdown', this.downOutside);
    this.searchInput?.close();
    this.searchInput = undefined;
    super.destroy(fromScene);
  }
}
