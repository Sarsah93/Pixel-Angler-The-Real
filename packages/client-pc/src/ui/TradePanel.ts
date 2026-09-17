/**
 * @file TradePanel.ts
 * @description 유저 간 거래 창 (146차).
 *
 * 두 열(내 제안 / 상대 제안) + 아래 내 가방 목록. 흐름은 서버 공증 상태 머신을 그대로 따른다 —
 *  편집 → [잠금] → 양쪽 잠금 → [확정] → 양쪽 확정 → committed(되돌릴 수 없음) → 씬이 적용.
 * **제안을 고치면 양쪽 잠금이 풀린다**(상대가 본 것과 다른 것에 동의하는 일이 없게).
 *
 * 창은 상태를 갖지 않는다 — `MultiplayerClient.trade`(서버가 돌려준 진실)를 매번 다시 그린다.
 * 내 편집만 로컬 초안(`draft`)으로 들고 있다가 서버에 올린다.
 */
import Phaser from 'phaser';
import { DraggablePanel } from './DraggablePanel.js';
import { paintHudSlot } from './HudPanelStyle.js';
import { clampTextWidth } from './TextFit.js';
import { GameState } from '../store/GameState.js';
import { InventoryStore, type InvItem } from '../store/InventoryStore.js';
import { MultiplayerClient } from '../net/MultiplayerClient.js';
import { createItemIcon } from './ItemIcon.js';
import { MP_TRADE_MAX_ITEMS, type MpTradeItem, type MpTradeState } from '@tra/core';
import type { QuantityDialogConfig } from './Dialogs.js';

const W = 760, H = 540;
const FONT = '"Noto Sans KR", sans-serif';
const COL_W = 356, COL_GAP = 16, PAD = 16;
const ROW_H = 22;
const BAG_ROWS = 5;

export interface TradePanelDeps {
  openQuantity(cfg: QuantityDialogConfig): void;
  pushLog(msg: string): void;
}

export class TradePanel extends DraggablePanel {
  private bodyC?: Phaser.GameObjects.Container;
  private deps: TradePanelDeps;
  private lastKey = '';
  private draft: { items: MpTradeItem[]; coins: number } = { items: [], coins: 0 };
  private bagScroll = 0;
  private wheelHandler: (p: Phaser.Input.Pointer, _g: unknown, _dx: number, dy: number) => void;
  private status = '';

  constructor(scene: Phaser.Scene, onClose: () => void, deps: TradePanelDeps) {
    super(scene, {
      x: (1280 - W) / 2, y: (720 - H) / 2, width: W, height: H,
      title: '거래', onClose, dim: true, depth: 905,
    });
    this.deps = deps;
    this.wheelHandler = (p, _g, _dx, dy) => {
      if (!this.containsPointer(p)) return;
      const tradable = this.tradableItems();
      const max = Math.max(0, tradable.length - BAG_ROWS);
      this.bagScroll = Math.max(0, Math.min(max, this.bagScroll + Math.sign(dy)));
      this.lastKey = '';
      this.sync();
    };
    scene.input.on('wheel', this.wheelHandler);
    this.sync();
  }

  private containsPointer(p: Phaser.Input.Pointer): boolean {
    return p.x >= this.x && p.x <= this.x + W && p.y >= this.y && p.y <= this.y + H;
  }

  private me(): MpTradeState['from'] | undefined {
    const t = MultiplayerClient.trade;
    if (!t) return undefined;
    return t.from.userId === MultiplayerClient.userId ? t.from : t.to;
  }
  private other(): MpTradeState['from'] | undefined {
    const t = MultiplayerClient.trade;
    if (!t) return undefined;
    return t.from.userId === MultiplayerClient.userId ? t.to : t.from;
  }

  /** 거래에 실을 수 있는 내 아이템 */
  private tradableItems(): InvItem[] {
    return InventoryStore.items.filter((i) => InventoryStore.tradeBlockReason(i) === null);
  }

  /** 매 프레임 — 서버 상태나 초안이 바뀌었을 때만 다시 그린다 */
  sync(): void {
    const t = MultiplayerClient.trade;
    if (!t || t.phase !== 'open') return;
    const me = this.me();
    const key = `${t.updatedMs}|${this.draft.items.map((i) => `${i.srcId}x${i.qty}`).join(',')}|${this.draft.coins}|${this.bagScroll}|${this.status}|${me?.offer.locked}|${me?.offer.confirmed}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.render(t);
  }

  private render(t: MpTradeState): void {
    this.bodyC?.destroy();
    const b = this.scene.add.container(0, 0);
    this.bodyC = b;
    this.add(b);
    const me = this.me()!, other = this.other()!;
    this.titleText.setText(`거래 — ${other.name}`);

    const top = this.contentTop + 8;
    // ── 두 열 ──
    this.column(b, PAD, top, '내 제안', me, true);
    this.column(b, PAD + COL_W + COL_GAP, top, `${other.name} 님의 제안`, other, false);

    // ── 내 가방 ──
    const bagTop = top + 218;
    const g = this.scene.add.graphics();
    g.fillStyle(0x050f1e, 0.9); g.fillRect(PAD, bagTop, W - PAD * 2, BAG_ROWS * ROW_H + 30);
    g.lineStyle(1, 0x1f3d5a, 1); g.strokeRect(PAD, bagTop, W - PAD * 2, BAG_ROWS * ROW_H + 30);
    b.add(g);
    b.add(this.scene.add.text(PAD + 8, bagTop + 6, '내 가방 — 줄을 누르면 제안에 올립니다 (휠로 넘김)', { fontFamily: FONT, fontSize: '11px', color: '#ffe28a', fontStyle: 'bold' }));
    const tradable = this.tradableItems();
    const locked = me.offer.locked;
    const rowsShown = tradable.slice(this.bagScroll, this.bagScroll + BAG_ROWS);
    rowsShown.forEach((item, i) => {
      const ry = bagTop + 26 + i * ROW_H;
      const inOffer = this.draft.items.find((d) => d.srcId === item.id);
      const remain = item.qty - (inOffer?.qty ?? 0);
      const icon = createItemIcon(this.scene, PAD + 20, ry + ROW_H / 2, item, 16);
      if (icon) b.add(icon);
      const label = this.scene.add.text(PAD + 36, ry + ROW_H / 2, `${item.name}  x${remain}${inOffer ? `  (제안 ${inOffer.qty})` : ''}`, {
        fontFamily: FONT, fontSize: '11px', color: remain > 0 ? '#d0e8f5' : '#5a6b78',
      }).setOrigin(0, 0.5);
      clampTextWidth(label, W - PAD * 2 - 60);
      b.add(label);
      if (remain > 0 && !locked) {
        const hit = this.scene.add.rectangle(PAD + (W - PAD * 2) / 2, ry + ROW_H / 2, W - PAD * 2 - 8, ROW_H - 2, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => label.setColor('#ffe28a'));
        hit.on('pointerout', () => label.setColor('#d0e8f5'));
        hit.on('pointerdown', () => this.pickItem(item, remain));
        b.add(hit);
      }
    });
    if (tradable.length > BAG_ROWS) {
      b.add(this.scene.add.text(W - PAD - 8, bagTop + 6, `${this.bagScroll + 1}–${Math.min(tradable.length, this.bagScroll + BAG_ROWS)} / ${tradable.length}`, { fontFamily: FONT, fontSize: '10px', color: '#8fa9bd' }).setOrigin(1, 0));
    }
    if (!tradable.length) b.add(this.scene.add.text(PAD + 8, bagTop + 30, '양도할 수 있는 물건이 없습니다 (귀속·착용 중은 제외)', { fontFamily: FONT, fontSize: '11px', color: '#8fa9bd' }));

    // ── 푸터 버튼 ──
    const fy = H - 40;
    const bothLocked = me.offer.locked && other.offer.locked;
    this.button(b, W / 2 - 170, fy, 140, '재화 넣기', !locked, () => this.pickCoins());
    if (!me.offer.locked) this.button(b, W / 2, fy, 140, '잠금', true, () => void MultiplayerClient.lockTrade(t.tradeId, false));
    else if (!me.offer.confirmed) this.button(b, W / 2, fy, 140, bothLocked ? '확정' : '상대 잠금 대기', bothLocked, () => this.confirm(t, other));
    else this.button(b, W / 2, fy, 140, '상대 확정 대기', false, () => {/* 대기 */});
    this.button(b, W / 2 + 170, fy, 140, '취소', true, () => void MultiplayerClient.cancelTrade(t.tradeId), '#ff9a9a');

    const st = this.scene.add.text(W / 2, fy - 24, this.status || (
      me.offer.locked && other.offer.locked ? '양쪽이 잠갔습니다 — 확정하면 되돌릴 수 없습니다'
        : me.offer.locked ? '상대의 잠금을 기다리는 중' : '제안을 고치면 양쪽 잠금이 풀립니다'),
    { fontFamily: FONT, fontSize: '11px', color: this.status ? '#ff9a9a' : '#8fa9bd' }).setOrigin(0.5);
    b.add(st);
    this.applyFix();
  }

  private column(b: Phaser.GameObjects.Container, x: number, y: number, title: string, side: MpTradeState['from'], mine: boolean): void {
    const h = 210;
    const g = this.scene.add.graphics();
    g.fillStyle(0x050f1e, 0.9); g.fillRect(x, y, COL_W, h);
    g.lineStyle(1, side.offer.confirmed ? 0x4af2a1 : side.offer.locked ? 0x4a9fd8 : 0x1f3d5a, 1); g.strokeRect(x, y, COL_W, h);
    b.add(g);
    b.add(this.scene.add.text(x + 8, y + 6, title, { fontFamily: FONT, fontSize: '12px', color: '#ffe28a', fontStyle: 'bold' }));
    const badge = side.offer.confirmed ? '확정' : side.offer.locked ? '잠금' : '편집 중';
    b.add(this.scene.add.text(x + COL_W - 8, y + 6, badge, {
      fontFamily: FONT, fontSize: '11px', color: side.offer.confirmed ? '#4af2a1' : side.offer.locked ? '#9fd8ff' : '#8fa9bd', fontStyle: 'bold',
    }).setOrigin(1, 0));

    const items = mine ? this.draft.items : side.offer.items;
    const coins = mine ? this.draft.coins : side.offer.coins;
    items.forEach((it, i) => {
      const ry = y + 28 + i * ROW_H;
      const tex = it.iconTexture;
      const icon = createItemIcon(this.scene, x + 18, ry + ROW_H / 2, { icon: '', iconTexture: tex, name: it.name, category: 'etc', subCategory: '' } as unknown as InvItem, 16);
      if (icon) b.add(icon);
      const t = this.scene.add.text(x + 34, ry + ROW_H / 2, `${it.name}  x${it.qty}${it.noteKo ? `  · ${it.noteKo}` : ''}`, { fontFamily: FONT, fontSize: '11px', color: '#d0e8f5' }).setOrigin(0, 0.5);
      clampTextWidth(t, COL_W - 70);
      b.add(t);
      if (mine && !side.offer.locked) {
        const rm = this.scene.add.text(x + COL_W - 10, ry + ROW_H / 2, '빼기', { fontFamily: FONT, fontSize: '10px', color: '#ff9a9a' }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        rm.on('pointerdown', () => { this.draft.items = this.draft.items.filter((d) => d.srcId !== it.srcId); this.pushDraft(); });
        b.add(rm);
      }
    });
    if (!items.length) b.add(this.scene.add.text(x + 12, y + 32, '(아이템 없음)', { fontFamily: FONT, fontSize: '11px', color: '#5a6b78' }));
    b.add(this.scene.add.text(x + 8, y + h - 22, `재화  ${coins.toLocaleString()} 원`, { fontFamily: FONT, fontSize: '12px', color: coins > 0 ? '#ffe9b0' : '#8fa9bd', fontStyle: 'bold' }));
  }

  private button(b: Phaser.GameObjects.Container, cx: number, cy: number, w: number, label: string, enabled: boolean, run: () => void, color = '#e8f4fd'): void {
    const g = this.scene.add.graphics();
    paintHudSlot(g, cx, cy, w, 30, enabled);
    b.add(g);
    const t = this.scene.add.text(cx, cy, label, { fontFamily: FONT, fontSize: '12px', color: enabled ? color : '#5a6b78', fontStyle: 'bold' }).setOrigin(0.5);
    b.add(t);
    if (!enabled) return;
    const hit = this.scene.add.rectangle(cx, cy, w, 30, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', run);
    b.add(hit);
  }

  private pickItem(item: InvItem, remain: number): void {
    const existing = this.draft.items.find((d) => d.srcId === item.id);
    if (!existing && this.draft.items.length >= MP_TRADE_MAX_ITEMS) { this.setStatus(`아이템은 ${MP_TRADE_MAX_ITEMS}줄까지입니다`); return; }
    const add = (qty: number): void => {
      if (existing) existing.qty += qty;
      else this.draft.items.push(InventoryStore.exportTradeItem(item, qty));
      this.pushDraft();
    };
    if (remain === 1) { add(1); return; }
    this.deps.openQuantity({
      itemName: item.name, unitPrice: 0, maxQty: remain, actionLabel: '올리기',
      onConfirm: (q) => add(q), onCancel: () => {/* 취소 */},
    });
  }

  private pickCoins(): void {
    const have = GameState.player.inventory.coins;
    if (have <= 0) { this.setStatus('재화가 없습니다'); return; }
    this.deps.openQuantity({
      itemName: '재화 (원)', unitPrice: 1, maxQty: have, actionLabel: '올리기',
      onConfirm: (q) => { this.draft.coins = q; this.pushDraft(); }, onCancel: () => {/* 취소 */},
    });
  }

  private pushDraft(): void {
    const t = MultiplayerClient.trade;
    if (!t) return;
    this.status = '';
    void MultiplayerClient.setTradeOffer(t.tradeId, this.draft.items, this.draft.coins).then((r) => {
      if (!r.ok && r.reasonKo) this.setStatus(r.reasonKo);
    });
    this.lastKey = ''; this.sync();
  }

  private setStatus(msg: string): void { this.status = msg; this.lastKey = ''; this.sync(); }

  /** 확정 — 받을 물건이 들어갈 자리가 있는지 먼저 본다(도장 뒤에는 되돌릴 수 없다) */
  private confirm(t: MpTradeState, other: MpTradeState['from']): void {
    const need = InventoryStore.slotsNeededFor(other.offer.items);
    for (const [cat, n] of Object.entries(need)) {
      const free = InventoryStore.freeSlotCount(cat as InvItem['category']);
      if (free < (n ?? 0)) { this.setStatus(`가방 공간이 부족합니다 — ${cat} ${n}칸 필요 (빈 칸 ${free})`); return; }
    }
    if (this.draft.coins > GameState.player.inventory.coins) { this.setStatus('재화가 부족합니다'); return; }
    void MultiplayerClient.lockTrade(t.tradeId, true).then((r) => { if (!r.ok && r.reasonKo) this.setStatus(r.reasonKo); });
  }

  destroy(fromScene?: boolean): void {
    this.scene?.input.off('wheel', this.wheelHandler);
    super.destroy(fromScene);
  }
}
