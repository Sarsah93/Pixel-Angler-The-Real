/**
 * @file TrayPullPanel.ts
 * @description 247차 — 육묘 트레이에서 모종 꺼내기(사용자 「트레이에서 걷어 내기 → 옮기는 개체만 별도의 아이템으로 인벤토리에 ·
 *              혹은 트레이 부분만 뜯어서 인벤토리로」)
 *
 * 50구 트레이(5줄 × 10구)에 남은 모종이 구멍마다 서 있다.
 *  - 모종 하나를 누르면 그 포기만 뿌리 흙째 뽑혀 가방으로 날아간다(모종 아이템 1 — core `pullSeedlings`).
 *  - 줄 머리(왼쪽 손잡이)를 누르면 트레이를 잘라 그 줄을 통째로 떼어 낸다(그 줄에 남은 포기 전부).
 *  - 「다 꺼내기」는 남은 것 전부. 다 꺼내면 트레이 칸이 빈다 — 남은 모종은 트레이에서 그대로 자란다.
 * 조작 안내 글자는 창에 두지 않는다(R11) — 처음 열 때 가이드가 짚는다.
 */

import Phaser from 'phaser';
import { getCrop, startOf } from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { addPixelIcon } from './PixelIcon.js';
import { enforceTextBounds } from './TextFit.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { FarmStore, type FarmActionResult } from '../store/FarmStore.js';
import { cropItemTemplate } from '../data/CropItems.js';
import { t } from '../i18n/I18n.js';

const PANEL_W = 520;
const PANEL_H = 330;
const COLS = 10;
const ROWS = 5;
const HOLE = 30;
const GRID_X = 46;
const BIN_X = GRID_X + COLS * HOLE + 26;
const FONT = '"Noto Sans KR", sans-serif';

export interface TrayPullOpts {
  plotId: string;
  idx: number;
  /** 꺼낼 때마다(가방 · 필드 그림 갱신) */
  onPulled: (r: FarmActionResult) => void;
  onClose: () => void;
}

export class TrayPullPanel extends DraggablePanel {
  private opts: TrayPullOpts;
  private gridTop = 0;
  /** 구멍마다 모종이 있는가 · 그 그림 */
  private filled: boolean[] = [];
  private sprites: (Phaser.GameObjects.Container | null)[] = [];
  private pulled = 0;
  private countText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private done = false;
  private readonly itemId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: TrayPullOpts) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '모종 꺼내기', onClose: opts.onClose, depth: 920, dim: true });
    this.opts = opts;
    const cell = FarmStore.plot(opts.plotId).cells[opts.idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    this.itemId = (crop && startOf(crop, cell?.start)?.nursery?.seedlingItemId) ?? '';
    const left = Math.min(COLS * ROWS, FarmStore.trayLeft(opts.plotId, opts.idx));
    this.filled = Array.from({ length: COLS * ROWS }, (_, i) => i < left);
    this.build();
    maybeStartTour(scene, () => this.buildTour());
  }

  private get leftCount(): number { return this.filled.filter(Boolean).length; }

  private build(): void {
    const scene = this.scene;
    const top = this.contentTop + 10;
    this.gridTop = top + 6;
    const tpl = cropItemTemplate(this.itemId);
    const head = scene.add.text(20, top - 6, tpl?.name ?? '', { fontFamily: FONT, fontSize: '13px', color: '#ffe28a', fontStyle: 'bold' });
    this.add(head);
    this.gridTop = top + head.height + 4;
    // 트레이 판(검은 플라스틱 · 구멍 50)
    const g = scene.add.graphics();
    const w = COLS * HOLE, h = ROWS * HOLE;
    g.fillStyle(0x15181c, 1); g.fillRoundedRect(GRID_X - 6, this.gridTop - 6, w + 12, h + 12, 4);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = GRID_X + c * HOLE, y = this.gridTop + r * HOLE;
      g.fillStyle(0x23282e, 1); g.fillRect(x + 2, y + 2, HOLE - 4, HOLE - 4);
      g.fillStyle(0x0c0e10, 1); g.fillRect(x + 4, y + 4, HOLE - 8, HOLE - 8);
    }
    this.add(g);
    // 줄 머리(트레이를 잘라 한 줄을 떼어 낸다)
    for (let r = 0; r < ROWS; r++) {
      const y = this.gridTop + r * HOLE + HOLE / 2;
      const hg = scene.add.graphics();
      hg.fillStyle(0x2a3a4a, 1); hg.fillRoundedRect(GRID_X - 32, y - 10, 22, 20, 4);
      hg.lineStyle(1, 0x4af2a1, 0.8); hg.strokeRoundedRect(GRID_X - 32, y - 10, 22, 20, 4);
      hg.lineStyle(1, 0xc8d8e4, 0.9); hg.lineBetween(GRID_X - 26, y - 4, GRID_X - 16, y + 4); hg.lineBetween(GRID_X - 26, y + 4, GRID_X - 16, y - 4);
      this.add(hg);
      const hit = scene.add.rectangle(GRID_X - 21, y, 24, 22, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.pullRow(r));
      this.add(hit);
    }
    // 모종 — 구멍마다(뿌리 흙 + 떡잎 두 장 + 본잎)
    for (let i = 0; i < COLS * ROWS; i++) {
      if (!this.filled[i]) { this.sprites.push(null); continue; }
      const { x, y } = this.holeCenter(i);
      const c = scene.add.container(x, y);
      const sg = scene.add.graphics();
      sg.fillStyle(0x5c3f24, 1); sg.fillRect(-7, -1, 14, 10);
      sg.fillStyle(0x4a8a2a, 1); sg.fillRect(-1, -12, 2, 12);
      sg.fillStyle(0x8fd16a, 1); sg.fillEllipse(-5, -12, 9, 5); sg.fillEllipse(5, -13, 9, 5);
      sg.fillStyle(0x5cb84a, 1); sg.fillEllipse(0, -16, 6, 6);
      c.add(sg);
      const hit = scene.add.rectangle(0, -4, HOLE - 4, HOLE - 2, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.pullOne(i));
      c.add(hit);
      this.add(c);
      this.sprites.push(c);
    }
    // 오른쪽 — 가방(꺼낸 수)
    const bg = scene.add.graphics();
    bg.fillStyle(0x10283a, 0.95); bg.fillRoundedRect(BIN_X, this.gridTop - 6, PANEL_W - BIN_X - 18, h + 12, 6);
    bg.lineStyle(1, 0x2f5a80, 1); bg.strokeRoundedRect(BIN_X, this.gridTop - 6, PANEL_W - BIN_X - 18, h + 12, 6);
    this.add(bg);
    const binCx = BIN_X + (PANEL_W - BIN_X - 18) / 2;
    const ic = addPixelIcon(scene, this.itemId, binCx, this.gridTop + 34, 32);
    if (ic) this.add(ic);
    this.add(scene.add.text(binCx, this.gridTop + 60, t('가방에'), { fontFamily: FONT, fontSize: '11px', color: '#8fb4cc' }).setOrigin(0.5, 0));
    this.countText = scene.add.text(binCx, this.gridTop + 78, '0', { fontFamily: FONT, fontSize: '18px', color: '#8affb0', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.add(this.countText);
    // 아래 — 상태 줄 · 다 꺼내기
    const by = this.gridTop + h + 16;
    this.statusText = scene.add.text(20, by + 4, '', { fontFamily: FONT, fontSize: '12px', color: '#9fd0e4', wordWrap: { width: PANEL_W - 170 } });
    this.add(this.statusText);
    this.setLeftStatus();
    const bw = 120, bx = PANEL_W - 18 - bw;
    const btn = scene.add.graphics();
    btn.fillStyle(0x0d4a2e, 0.95); btn.fillRoundedRect(bx, by, bw, 28, 4);
    btn.lineStyle(1.2, 0x4af2a1, 0.95); btn.strokeRoundedRect(bx, by, bw, 28, 4);
    const bt = scene.add.text(bx + bw / 2, by + 14, t('다 꺼내기'), { fontFamily: FONT, fontSize: '12px', color: '#4af2a1', fontStyle: 'bold' }).setOrigin(0.5);
    const bh = scene.add.rectangle(bx + bw / 2, by + 14, bw, 28, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    bh.on('pointerdown', () => this.pullAll());
    this.add([btn, bt, bh]);
    this.allRect = new Phaser.Geom.Rectangle(bx, by, bw, 28);
    enforceTextBounds(this, PANEL_W - 12, 'TrayPullPanel');
    this.applyFix();
  }

  private allRect = new Phaser.Geom.Rectangle();

  private holeCenter(i: number): { x: number; y: number } {
    const c = i % COLS, r = Math.floor(i / COLS);
    return { x: GRID_X + c * HOLE + HOLE / 2, y: this.gridTop + r * HOLE + HOLE / 2 };
  }

  private setLeftStatus(): void {
    this.statusText.setColor('#9fd0e4').setText(`${t('트레이에 남은 모종')} ${this.leftCount}`);
  }

  /** 뽑힌 모종 그림 — 위로 들렸다가 가방으로 */
  private fly(i: number, delay = 0): void {
    const sp = this.sprites[i];
    if (!sp) return;
    this.sprites[i] = null;
    const binCx = BIN_X + (PANEL_W - BIN_X - 18) / 2;
    this.scene.tweens.add({
      targets: sp, y: sp.y - 14, duration: 140, delay, ease: 'Quad.easeOut',
      onComplete: () => this.scene?.tweens.add({ targets: sp, x: binCx, y: this.gridTop + 34, scale: 0.4, alpha: 0, duration: 320, ease: 'Quad.easeIn', onComplete: () => sp.destroy() }),
    });
  }

  private take(holes: number[]): void {
    if (this.done || holes.length === 0) return;
    const r = FarmStore.pullSeedlings(this.opts.plotId, this.opts.idx, holes.length);
    if (!r.ok) { this.statusText.setColor('#ff9a7a').setText(t(r.message)); return; }
    const got = r.harvested?.[0]?.qty ?? holes.length;
    holes.slice(0, got).forEach((i, k) => { this.filled[i] = false; this.fly(i, k * 30); });
    this.pulled += got;
    this.countText.setText(String(this.pulled));
    this.opts.onPulled(r);
    if (this.leftCount === 0 || FarmStore.trayLeft(this.opts.plotId, this.opts.idx) === 0) {
      this.done = true;
      this.statusText.setColor('#8affb0').setText(t('트레이가 비었다'));
      this.scene.time.delayedCall(700, () => { if (this.active) this.opts.onClose(); });
    } else this.setLeftStatus();
    restoreHandCursor(this.scene);
  }

  private pullOne(i: number): void { if (this.filled[i]) this.take([i]); }

  private pullRow(r: number): void {
    const holes = Array.from({ length: COLS }, (_, c) => r * COLS + c).filter((i) => this.filled[i]);
    if (holes.length === 0) { this.statusText.setColor('#ff9a7a').setText(t('이 줄은 비었다')); return; }
    this.take(holes);
  }

  private pullAll(): void { this.take(this.filled.map((f, i) => (f ? i : -1)).filter((i) => i >= 0)); }

  // ── dev 하네스 ──
  /** 하네스: 구멍 중심(화면 좌표) */
  devHoleToScreen(i: number): { x: number; y: number } { const p = this.holeCenter(i); return { x: this.x + p.x, y: this.y + p.y - 4 }; }
  /** 하네스: 남은 · 꺼낸 수 */
  devState(): { left: number; pulled: number } { return { left: this.leftCount, pulled: this.pulled }; }

  private buildTour(): TourOptions {
    return {
      id: 'tray_pull',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [
        { text: '다 자란 모종을 트레이에서 꺼낸다. 모종 하나를 누르면 그 포기만 뿌리 흙째 뽑혀 가방에 들어간다 — 하나 꺼내 보자.', target: () => this.localRect(GRID_X - 6, this.gridTop - 6, COLS * HOLE + 12, ROWS * HOLE + 12), wait: () => this.pulled > 0 },
        { text: '줄 머리를 누르면 트레이를 잘라 그 줄을 통째로 떼어 낸다. 꺼내지 않은 모종은 트레이에서 그대로 자란다.', target: () => this.localRect(GRID_X - 34, this.gridTop - 4, 28, ROWS * HOLE + 8) },
        { text: '꺼낸 모종은 텃밭 칸에 옮겨 심는다 — 늦서리가 지난 뒤에.', target: () => this.localRect(this.allRect.x, this.allRect.y, this.allRect.width, this.allRect.height) },
      ],
    };
  }
}
