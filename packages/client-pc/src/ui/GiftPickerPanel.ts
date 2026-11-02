/**
 * @file GiftPickerPanel.ts
 * @description 297차 — 선물 고르기 창(대화 「드리고 싶은 게 있어요」 → 가방에서 줄 수 있는 것만 — `data/GiftTags.isGiftable`).
 *  칸을 고르면 아래에 이름이 뜨고 「건네기」로 넘긴다. 반응은 대화창이 찍는다. 처음 열면 가이드(`gift`)가 짚는다(R11).
 *  모달 밴드(950) — 대화창(940) 위.
 */

import Phaser from 'phaser';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { createItemIcon } from './ItemIcon.js';
import { specialtyDisplayName } from '../data/SpecialtyTag.js';
import type { InvItem } from '../store/InventoryStore.js';

const COLS = 7;
const CELL = 58;
const GAP = 6;
const ROWS_VIS = 3;
const PAD = 14;
const W = PAD * 2 + COLS * CELL + (COLS - 1) * GAP;
const FONT = '"Noto Sans KR", sans-serif';

export interface GiftPickerConfig {
  /** 받는 사람 이름(제목) */
  npcName: string;
  items: InvItem[];
  onPick: (item: InvItem) => void;
  onClose: () => void;
}

export class GiftPickerPanel extends DraggablePanel {
  private readonly cfg: GiftPickerConfig;
  private bodyC?: Phaser.GameObjects.Container;
  private sel: string | null = null;
  private scroll = 0;
  private wheel?: (p: Phaser.Input.Pointer, o: unknown[], dx: number, dy: number) => void;
  private rectGrid = new Phaser.Geom.Rectangle();
  private rectGo = new Phaser.Geom.Rectangle();

  constructor(scene: Phaser.Scene, cfg: GiftPickerConfig) {
    const h = 32 + 10 + 20 + ROWS_VIS * (CELL + GAP) + 10 + 64;
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: Math.max(16, (GAME_HEIGHT - h) / 2 - 40),
      width: W, height: h, title: '선물 고르기', onClose: cfg.onClose, dim: true, depth: 950,
    });
    this.cfg = cfg;
    this.sel = cfg.items[0]?.id ?? null;
    this.wheel = (p, _o, _dx, dy) => {
      if (!Phaser.Geom.Rectangle.Contains(this.panelBounds(), p.x, p.y)) return;
      const rows = Math.ceil(this.cfg.items.length / COLS);
      const next = Phaser.Math.Clamp(this.scroll + (dy > 0 ? 1 : -1), 0, Math.max(0, rows - ROWS_VIS));
      if (next !== this.scroll) { this.scroll = next; this.render(); }
    };
    scene.input.on('wheel', this.wheel);
    this.render();
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    if (this.wheel) this.scene?.input?.off('wheel', this.wheel);
    super.destroy(fromScene);
  }

  private render(): void {
    this.bodyC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.bodyC = c; this.add(c);
    const s = this.scene;
    const top = this.contentTop + 10;
    const items = this.cfg.items;
    c.add(s.add.text(PAD, top, items.length ? `${this.cfg.npcName} — 무엇을 드릴까.` : '줄 수 있는 것이 없다.', { fontFamily: FONT, fontSize: '13px', color: '#9fb8cc' }));
    const gridY = top + 24;
    this.rectGrid.setTo(PAD, gridY, COLS * CELL + (COLS - 1) * GAP, ROWS_VIS * (CELL + GAP) - GAP);
    const start = this.scroll * COLS;
    const shown = items.slice(start, start + COLS * ROWS_VIS);
    shown.forEach((it, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = PAD + col * (CELL + GAP), y = gridY + row * (CELL + GAP);
      const selected = it.id === this.sel;
      const g = s.add.graphics();
      g.fillStyle(selected ? 0x1f4d3a : 0x16263a, 1); g.fillRoundedRect(x, y, CELL, CELL, 4);
      g.lineStyle(selected ? 2 : 1, selected ? 0x7df0b0 : 0x2d4d6a, 1); g.strokeRoundedRect(x, y, CELL, CELL, 4);
      c.add(g);
      c.add(createItemIcon(s, x + CELL / 2, y + CELL / 2 - 4, it, 36));
      if (it.qty > 1) {
        c.add(s.add.text(x + CELL - 4, y + CELL - 3, `${it.qty}`, { fontFamily: FONT, fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(1, 1));
      }
      const hit = s.add.rectangle(x + CELL / 2, y + CELL / 2, CELL, CELL, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this.sel = it.id; this.render(); restoreHandCursor(s); });
      c.add(hit);
    });
    const rows = Math.ceil(items.length / COLS);
    if (rows > ROWS_VIS) {
      c.add(s.add.text(W - PAD, gridY + ROWS_VIS * (CELL + GAP) - 2, `${this.scroll + 1}–${Math.min(rows, this.scroll + ROWS_VIS)} / ${rows}`, { fontFamily: FONT, fontSize: '10px', color: '#6a8aa0' }).setOrigin(1, 1));
    }
    // 아래 — 고른 것 이름 + 단추
    const by = gridY + ROWS_VIS * (CELL + GAP) + 6;
    const sel = items.find((it) => it.id === this.sel);
    const name = s.add.text(PAD, by + 4, sel ? specialtyDisplayName(sel) : '', { fontFamily: FONT, fontSize: '14px', color: '#ffffff', fontStyle: 'bold' });
    clampTextWidth(name, W - PAD * 2 - 220);
    c.add(name);
    const bw = 96, bh = 28;
    const goX = W - PAD - bw, cancelX = goX - bw - 8;
    this.rectGo.setTo(goX, by, bw, bh);
    c.add(this.button(cancelX, by, bw, bh, '그만두기', () => this.cfg.onClose()));
    if (sel) c.add(this.button(goX, by, bw, bh, '건네기', () => this.cfg.onPick(sel), true));
    enforceTextBounds(c, W - 8, 'GiftPickerPanel');
    this.applyFix();
  }

  private button(x: number, y: number, w: number, h: number, label: string, onClick: () => void, primary = false): Phaser.GameObjects.Container {
    const s = this.scene;
    const c = s.add.container(0, 0);
    const bg = s.add.graphics();
    bg.fillStyle(primary ? 0x1f4d3a : 0x1f3045, 0.95); bg.fillRoundedRect(x, y, w, h, 4);
    bg.lineStyle(1, primary ? 0x7df0b0 : 0x5cd0ff, 0.9); bg.strokeRoundedRect(x, y, w, h, 4);
    const t = s.add.text(x + w / 2, y + h / 2, label, { fontFamily: FONT, fontSize: '12px', color: primary ? '#d8ffe8' : '#bfe9ff', fontStyle: 'bold' }).setOrigin(0.5);
    const hit = s.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
    c.add([bg, t, hit]);
    return c;
  }

  private buildTour(): TourOptions {
    const r = (q: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle => this.localRect(q.x, q.y, q.width, q.height);
    return {
      id: 'gift',
      anchor: () => this.panelBounds(),
      alive: () => this.active && !!this.scene,
      steps: [
        { text: '줄 수 있는 것만 보인다 — 먹을거리 · 가공품 · 술 · 커피 · 단것. 장비와 이야기 물건은 선물이 아니다.', target: () => r(this.rectGrid) },
        { text: '하나를 고르고 「건네기」를 누른다. 그 사람 반응을 보면 취향이 수첩에 적힌다. 한 사람에게 하루 한 번이다.', target: () => r(this.rectGo), skipIf: () => !this.cfg.items.length },
      ],
    };
  }
}
