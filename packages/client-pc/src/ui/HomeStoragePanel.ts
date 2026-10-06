/**
 * @file HomeStoragePanel.ts
 * @description 집 보관함 창 — 옷장(장비만) · 수납 선반(낚시용품·소모품·기타) (189차)
 *
 *  - 왼쪽: 보관 칸(5열). 오른쪽: 가방에서 넣을 수 있는 물건 목록(윈도우드 — 휠로 넘긴다).
 *  - 목록의 물건을 누르면 그 묶음째 보관, 보관 칸을 누르면 가방으로 꺼낸다.
 *  - 창에는 조작 안내 문구를 두지 않는다(규칙 R11) — 처음 열 때 체험 가이드가 짚는다.
 *    아래 줄은 **결과**(보관했다 · 가득 찼다)만 보여 준다.
 */

import Phaser from 'phaser';
import { DraggablePanel } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';
import { setSlotLabel, SLOT_LABEL_PX } from './SlotLabel.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { GameState } from '../store/GameState.js';
import { InventoryStore, type InvItem } from '../store/InventoryStore.js';
import { HomeStore, HOME_STORAGE, type HomeStorageKind } from '../store/HomeStore.js';
import { prologueProtects, PROLOGUE_PROTECT_MSG } from '../store/Prologue.js';

const PANEL_W = 620;
const PANEL_H = 430;
const CELL = 52;
const GAP = 6;
const ROW_H = 30;
const LIST_W = 250;
const FONT = '"Noto Sans KR", sans-serif';

const TITLE: Record<HomeStorageKind, string> = { wardrobe: '옷장', shelf: '수납 선반' };

export class HomeStoragePanel extends DraggablePanel {
  private kind: HomeStorageKind;
  private content!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private scroll = 0;
  private wheelFn: (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => void;
  /** 가이드 판정 — 이번 창에서 넣은 횟수 · 꺼낸 횟수 */
  private deposits = 0;
  private withdraws = 0;

  constructor(scene: Phaser.Scene, kind: HomeStorageKind, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: TITLE[kind], onClose, depth: 850 });
    this.kind = kind;
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    this.statusText = scene.add.text(PANEL_W / 2, PANEL_H - 20, '', {
      fontFamily: FONT, fontSize: '12px', color: '#9fd0e4', align: 'center', wordWrap: { width: PANEL_W - 40 },
    }).setOrigin(0.5);
    this.add(this.statusText);
    this.wheelFn = (p, _o, _dx, dy) => {
      const r = this.listRect();
      if (!r.contains(p.x, p.y)) return;
      const max = Math.max(0, this.candidates().length - this.visibleRows());
      const n = Phaser.Math.Clamp(this.scroll + (dy > 0 ? 1 : -1), 0, max);
      if (n !== this.scroll) { this.scroll = n; this.render(); }
    };
    scene.input.on('wheel', this.wheelFn);
    this.render();
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input.off('wheel', this.wheelFn);
    super.destroy(fromScene);
  }

  // ── 레이아웃 ──────────────────────────────────────────

  private get gridX(): number { return 18; }
  private get gridY(): number { return this.contentTop + 34; }
  private get listX(): number { return PANEL_W - 18 - LIST_W; }
  private visibleRows(): number { return Math.floor((PANEL_H - 44 - (this.contentTop + 34)) / ROW_H); }

  /** 보관 칸 영역 (화면 좌표) */
  gridRect(): Phaser.Geom.Rectangle {
    const cols = HOME_STORAGE[this.kind].cols;
    const rows = Math.ceil(HOME_STORAGE[this.kind].slots / cols);
    return this.localRect(this.gridX - 4, this.gridY - 4, cols * (CELL + GAP) - GAP + 8, rows * (CELL + GAP) - GAP + 8);
  }

  /** 가방 목록 영역 (화면 좌표) */
  listRect(): Phaser.Geom.Rectangle {
    return this.localRect(this.listX - 4, this.gridY - 4, LIST_W + 8, this.visibleRows() * ROW_H + 8);
  }

  /** 가방에서 이 보관함에 넣을 수 있는 물건 */
  private candidates(): InvItem[] {
    return InventoryStore.items.filter((i) => HomeStore.accepts(this.kind, i));
  }

  private setStatus(msg: string, color = '#9fd0e4'): void {
    this.statusText.setColor(color).setText(msg);
  }

  private render(): void {
    this.content.removeAll(true);
    const scene = this.scene;
    const st = HOME_STORAGE[this.kind];
    const slots = HomeStore.slots(this.kind);
    const filled = slots.filter(Boolean).length;

    // ── 보관 칸 ──
    this.content.add(scene.add.text(this.gridX, this.contentTop + 10, `${TITLE[this.kind]}  ${filled}/${st.slots}`, {
      fontFamily: FONT, fontSize: '13px', color: '#ffd9a0', fontStyle: 'bold',
    }));
    for (let i = 0; i < st.slots; i++) {
      const cx = this.gridX + (i % st.cols) * (CELL + GAP);
      const cy = this.gridY + Math.floor(i / st.cols) * (CELL + GAP);
      const box = scene.add.graphics();
      box.fillStyle(0x0e1c2d, 0.92); box.fillRoundedRect(cx, cy, CELL, CELL, 4);
      box.lineStyle(1.2, 0x1f3d5a, 0.8); box.strokeRoundedRect(cx, cy, CELL, CELL, 4);
      this.content.add(box);
      const it = slots[i];
      if (!it) continue;
      this.content.add(createItemIcon(scene, cx + CELL / 2, cy + CELL / 2 - 4, it, 28));
      if (it.qty > 1) {
        this.content.add(scene.add.text(cx + CELL - 3, cy + CELL - 2, `x${it.qty}`, {
          fontFamily: FONT, fontSize: '10px', color: '#e8f2fa', fontStyle: 'bold',
        }).setOrigin(1, 1));
      }
      const hit = scene.add.rectangle(cx + CELL / 2, cy + CELL / 2, CELL, CELL, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.setStatus(it.name, '#c8dceb'));
      hit.on('pointerdown', () => this.withdraw(i));
      this.content.add(hit);
    }

    // ── 가방 목록 ──
    const items = this.candidates();
    this.content.add(scene.add.text(this.listX, this.contentTop + 10, '가방', {
      fontFamily: FONT, fontSize: '13px', color: '#ffd9a0', fontStyle: 'bold',
    }));
    const rows = this.visibleRows();
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, Math.max(0, items.length - rows));
    if (items.length === 0) {
      this.content.add(scene.add.text(this.listX, this.gridY + 4,
        this.kind === 'wardrobe' ? '가방에 넣어 둘 장비가 없다' : '가방에 올려 둘 물건이 없다', {
          fontFamily: FONT, fontSize: '12px', color: '#607b8e', wordWrap: { width: LIST_W },
        }));
    }
    items.slice(this.scroll, this.scroll + rows).forEach((item, k) => {
      const ry = this.gridY + k * ROW_H;
      const bg = scene.add.graphics();
      bg.fillStyle(0x0e1c2d, 0.85); bg.fillRoundedRect(this.listX, ry, LIST_W - 10, ROW_H - 3, 4);
      bg.lineStyle(1, 0x1f3d5a, 0.7); bg.strokeRoundedRect(this.listX, ry, LIST_W - 10, ROW_H - 3, 4);
      const icon = createItemIcon(scene, this.listX + 15, ry + (ROW_H - 3) / 2, item, 20);
      const name = setSlotLabel(scene.add.text(this.listX + 30, ry + (ROW_H - 3) / 2, '', {
        fontFamily: FONT, fontSize: `${SLOT_LABEL_PX}px`, color: '#c8dceb',
      }).setOrigin(0, 0.5), item.name, LIST_W - 50, item.qty > 1 ? ` x${item.qty}` : '');
      const hit = scene.add.rectangle(this.listX + (LIST_W - 10) / 2, ry + (ROW_H - 3) / 2, LIST_W - 10, ROW_H - 3, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.setStatus(item.name, '#c8dceb'));
      hit.on('pointerdown', () => this.deposit(item));
      this.content.add([bg, icon, name, hit]);
    });
    // 스크롤 막대 (넘칠 때만)
    if (items.length > rows) {
      const trackH = rows * ROW_H - 3;
      const tx = this.listX + LIST_W - 6;
      const thumbH = Math.max(18, trackH * (rows / items.length));
      const thumbY = this.gridY + (trackH - thumbH) * (this.scroll / Math.max(1, items.length - rows));
      const sb = scene.add.graphics();
      sb.fillStyle(0x1f3d5a, 0.6); sb.fillRoundedRect(tx, this.gridY, 4, trackH, 2);
      sb.fillStyle(0x5cd0ff, 0.9); sb.fillRoundedRect(tx, thumbY, 4, thumbH, 2);
      this.content.add(sb);
      this.content.add(scene.add.text(this.listX + LIST_W - 10, this.contentTop + 12,
        `${this.scroll + 1}–${Math.min(items.length, this.scroll + rows)} / ${items.length}`, {
          fontFamily: FONT, fontSize: '11px', color: '#7f97ab',
        }).setOrigin(1, 0));
    }
    this.applyFix();
  }

  // ── 넣기 · 꺼내기 ─────────────────────────────────────

  private deposit(item: InvItem): void {
    const live = InventoryStore.items.find((i) => i === item) ?? InventoryStore.find(item.id);
    if (!live || !HomeStore.accepts(this.kind, live)) return;
    // 219차 — 프롤로그에 아직 쓸 물건은 넣어 두지 않는다(진행 막힘 방지)
    if (prologueProtects(live.id)) { this.setStatus(PROLOGUE_PROTECT_MSG, '#ff9a7a'); return; }
    const { slot: _s, qty, ...rest } = live;
    if (!HomeStore.put(this.kind, { ...rest, slot: 0, qty } as InvItem, qty)) {
      this.setStatus(`${TITLE[this.kind]}이 가득 찼다`, '#ff9a7a');
      return;
    }
    InventoryStore.removeItem(live.id, true);
    this.deposits++;
    GameState.markDirty();
    this.scene.events.emit('inventory-changed');
    this.setStatus(`${live.name} — 넣어 두었다`, '#7fe6b0');
    this.render();
  }

  private withdraw(slot: number): void {
    const it = HomeStore.take(this.kind, slot);
    if (!it) return;
    const { slot: _s, qty, ...rest } = it;
    if (!InventoryStore.find(it.id) && InventoryStore.freeSlotCount(it.category) <= 0) {
      HomeStore.restore(this.kind, slot, it);
      this.setStatus('가방에 빈 칸이 없다', '#ff9a7a');
      return;
    }
    InventoryStore.addItem(rest, Math.max(1, qty), { silent: true });
    this.withdraws++;
    GameState.markDirty();
    this.scene.events.emit('inventory-changed');
    this.setStatus(`${it.name} — 가방에 넣었다`, '#7fe6b0');
    this.render();
  }

  // ── 첫 열기 가이드 (tour id 'home_wardrobe' / 'home_shelf') ──

  private buildTour(): TourOptions {
    const wardrobe = this.kind === 'wardrobe';
    return {
      id: wardrobe ? 'home_wardrobe' : 'home_shelf',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [
        {
          text: wardrobe
            ? '옷장이다. 장비는 여기 걸어 둘 수 있다. 입고 있는 것은 벗어야 들어간다.'
            : '수납 선반이다. 낚시용품 · 소모품 · 자잘한 물건을 올려 둔다. 음식은 냉장고로 간다.',
          target: () => this.gridRect(),
        },
        {
          text: '오른쪽은 가방이다. 넣을 수 있는 물건만 뜬다. 하나를 눌러 넣어 보자.',
          target: () => this.listRect(),
          skipIf: () => this.candidates().length === 0,
          wait: () => this.deposits > 0,
        },
        {
          text: '넣어 둔 것을 누르면 다시 가방으로 꺼낸다. 꺼내 보자.',
          target: () => this.gridRect(),
          skipIf: () => HomeStore.slots(this.kind).every((s) => !s),
          wait: () => this.withdraws > 0,
        },
      ],
    };
  }
}
