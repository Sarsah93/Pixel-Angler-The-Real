/**
 * @file ShopPanel.ts
 * @description 상점 거래 팝업 (화면 좌측 — 우측에는 인벤토리가 함께 열림)
 *
 * 구성:
 *  - 상단 탭: 구매하기 / 판매하기
 *  - 구매 탭: 상점 판매 품목 그리드 (아이콘 클릭 = 선택, 호버 = 요약 툴팁,
 *    우클릭 = 상세 정보창). 상점 아이템은 재화 결제 없이는 인벤토리로 이동 불가.
 *  - 판매 탭: 플레이어 인벤토리 중 이 상점이 매입하는 카테고리 아이템 목록
 *  - 최하단: [구매] [판매] 버튼 — 선택 아이템에 대해 수량/확인 플로우 진행
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { InventoryStore, InvItem, CONDITION_LABEL } from '../store/InventoryStore.js';
import { RecommendationStore } from '../store/RecommendationStore.js';
import { ShopDef, ShopEntry } from '../data/ShopCatalog.js';
import { DraggablePanel } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';

type ShopTab = 'buy' | 'sell';

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

/** 그리드 셀 1칸 렌더 스펙 (구매 entry / 판매 InvItem 공통) */
interface ShopCell {
  icon: string; iconTexture?: string; name: string; priceLabel: string; qtyLabel: string;
  condition?: InvItem['condition']; recommended?: boolean;
  // 어획물은 iconTexture가 비어도 speciesId로 이미지 폴백 해소 (createItemIcon)
  speciesId?: string; lengthCm?: number;
  selected: boolean; tooltip: string;
  onSelect: () => void; onDetail: () => void;
}

export interface ShopPanelCallbacks {
  onClose: () => void;
  /** 구매 요청 (수량/확인 플로우는 씬이 담당) */
  onBuy: (entry: ShopEntry) => void;
  /** 판매 요청 */
  onSell: (item: InvItem) => void;
  /** 아이템 상세보기 (우클릭) */
  onOpenDetail: (item: InvItem | ShopEntry) => void;
}

export class ShopPanel extends DraggablePanel {
  private shop: ShopDef;
  private cbs: ShopPanelCallbacks;
  private currentTab: ShopTab = 'buy';

  private tabBgs = new Map<ShopTab, Phaser.GameObjects.Graphics>();
  private tabTexts = new Map<ShopTab, Phaser.GameObjects.Text>();
  private gridContainer!: Phaser.GameObjects.Container;
  private tooltip!: Phaser.GameObjects.Container;
  private tooltipText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;

  /** 현재 선택 (구매 탭: ShopEntry / 판매 탭: InvItem) */
  private selectedBuy: ShopEntry | null = null;
  private selectedSell: InvItem | null = null;

  /** 스크롤 — 최상단에 보이는 행 인덱스 (판매 탭은 인벤토리 수량이 무한 증가 가능) */
  private scrollRow = 0;
  private maxScrollRow = 0;
  /** 스크롤바 트랙 기하 (썸 드래그 판정용) */
  private barGeom: { top: number; h: number } | null = null;
  private thumbDrag = false;
  private wheelHandler: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;
  private barMoveHandler: (p: Phaser.Input.Pointer) => void;
  private barUpHandler: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, shop: ShopDef, cbs: ShopPanelCallbacks) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: shop.name, onClose: cbs.onClose, depth: 820 });
    this.shop = shop;
    this.cbs = cbs;

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

    const greeting = scene.add.text(14, this.contentTop + 2, shop.greeting, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8faabf',
    });
    this.add(greeting);

    this.buildTabs();
    this.gridContainer = scene.add.container(0, 0);
    this.add(this.gridContainer);
    this.buildFooter();
    this.buildTooltip();
    this.renderGrid();

    scene.events.on('inventory-changed', this.onInventoryChanged, this);
    this.applyFix();
  }

  private onInventoryChanged = (): void => {
    if (!this.scene) return;
    this.coinText.setText(`보유 재화  ${GameState.player.inventory.coins.toLocaleString()} 원`);
    if (this.currentTab === 'sell') {
      this.selectedSell = null;
      this.renderGrid();
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
      { id: 'sell', label: '판매하기' },
    ];
    const tabW = 120, tabH = 30;
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
      hit.on('pointerdown', () => {
        this.currentTab = def.id;
        this.selectedBuy = null;
        this.selectedSell = null;
        this.scrollRow = 0;
        this.paintTabs();
        this.renderGrid();
      });
      this.add([g, t, hit]);
    });
    this.paintTabs();
  }

  private paintTabs(): void {
    const tabW = 120, tabH = 30;
    const ty = this.contentTop + 20;
    (['buy', 'sell'] as ShopTab[]).forEach((id, i) => {
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
  }

  // ── 그리드 ────────────────────────────────────────
  private renderGrid(): void {
    this.gridContainer.removeAll(true);
    this.hideTooltip();

    const gridW = GRID_COLS * SLOT + (GRID_COLS - 1) * SLOT_GAP;
    const gx0 = (PANEL_W - gridW) / 2;
    const gy0 = this.contentTop + 60;

    // ── 1) 셀 스펙 수집 ──
    const cells: ShopCell[] = [];
    if (this.currentTab === 'buy') {
      const reco = RecommendationStore.get();
      this.shop.sells.forEach((entry) => {
        const recommended = RecommendationStore.isItemRecommended(entry as unknown as InvItem, reco);
        cells.push({
          icon: entry.icon, iconTexture: entry.iconTexture, name: entry.name,
          speciesId: entry.speciesId, lengthCm: entry.lengthCm,
          priceLabel: `${entry.price.toLocaleString()}원`,
          qtyLabel: '',
          condition: entry.condition,
          recommended,
          selected: this.selectedBuy?.id === entry.id && this.selectedBuy?.name === entry.name,
          tooltip: `${recommended ? '[추천] ' : ''}${entry.name}\n${entry.price.toLocaleString()}원 · ${entry.desc}`,
          onSelect: () => { this.selectedBuy = entry; this.renderGrid(); },
          onDetail: () => this.cbs.onOpenDetail(entry),
        });
      });
      if (cells.length === 0) this.renderEmptyNote(gy0, '판매 품목이 없습니다.');
    } else {
      const sellable = InventoryStore.items.filter((i) => this.shop.buysCategories.includes(i.category));
      sellable.forEach((item) => {
        cells.push({
          icon: item.icon, iconTexture: item.iconTexture, name: item.name,
          speciesId: item.speciesId, lengthCm: item.lengthCm,
          priceLabel: `${InventoryStore.getSellPrice(item).toLocaleString()}원`,
          qtyLabel: item.qty > 1 ? `x${item.qty}` : '',
          condition: item.condition,
          selected: this.selectedSell?.id === item.id,
          tooltip: `${item.name}\n매입가 ${InventoryStore.getSellPrice(item).toLocaleString()}원${item.condition ? ' · ' + CONDITION_LABEL[item.condition] : ''}`,
          onSelect: () => { this.selectedSell = item; this.renderGrid(); },
          onDetail: () => this.cbs.onOpenDetail(item),
        });
      });
      if (this.shop.buysCategories.length === 0) {
        this.renderEmptyNote(gy0, '이 상점은 아이템을 매입하지 않습니다.');
      } else if (sellable.length === 0) {
        this.renderEmptyNote(gy0, '판매할 수 있는 아이템이 없습니다.');
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
    this.applyFix();
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
    this.gridContainer.add(icon);

    const price = this.scene.add.text(sx + SLOT / 2, sy + SLOT - 16, cell.priceLabel, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.gridContainer.add(price);

    if (cell.qtyLabel) {
      const qty = this.scene.add.text(sx + SLOT - 4, sy + 3, cell.qtyLabel, {
        fontFamily: 'monospace', fontSize: '9px', color: '#aee8ff', fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.gridContainer.add(qty);
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
    this.statusText = this.scene.add.text(PANEL_W / 2, PANEL_H - 104, '아이콘 클릭: 선택 · 우클릭: 상세보기', {
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
    this.addFooterButton(PANEL_W / 2 - 105, btnY, '구매', () => {
      if (this.currentTab !== 'buy') { this.setStatus('구매하기 탭에서 상품을 선택하세요.'); return; }
      if (!this.selectedBuy) { this.setStatus('구매할 상품을 먼저 선택하세요.'); return; }
      this.cbs.onBuy(this.selectedBuy);
    });
    this.addFooterButton(PANEL_W / 2 + 105, btnY, '판매', () => {
      if (this.currentTab !== 'sell') { this.setStatus('판매하기 탭에서 아이템을 선택하세요.'); return; }
      if (!this.selectedSell) { this.setStatus('판매할 아이템을 먼저 선택하세요.'); return; }
      this.cbs.onSell(this.selectedSell);
    });
  }

  private addFooterButton(cx: number, cy: number, label: string, onClick: () => void): void {
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
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.events?.off('inventory-changed', this.onInventoryChanged, this);
    this.scene?.input?.off('wheel', this.wheelHandler);
    this.scene?.input?.off('pointermove', this.barMoveHandler);
    this.scene?.input?.off('pointerup', this.barUpHandler);
    super.destroy(fromScene);
  }
}
