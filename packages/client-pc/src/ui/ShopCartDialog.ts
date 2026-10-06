/**
 * @file ShopCartDialog.ts
 * @description 상점 장바구니 · 판매 목록 확인 창 (220차 — 사용자 지시 「사고팔 때 다중 선택 · 장바구니」)
 *
 * 상점 창에서 칸을 눌러 담은 물건을 한 번에 보여 주고, 줄마다 수량(−/+)을 정하거나 빼고(✕),
 * 합계와 거래 뒤 남는 돈을 확인한 다음 한 번에 사거나 판다.
 *  - 모달(depth 950 · 어둡게 깔기) — 확인 창과 같은 밴드. 상점 가이드가 이 창을 짚는다(`ShopPanel.openDialogRects`).
 *  - 줄이 많으면 보이는 줄만 만든다(윈도우드 렌더 + 휠) — 마스크는 입력을 자르지 않는다(ui-panel 스킬).
 *  - 살 돈이 모자라면 합계를 붉게 하고 「사기」를 막는다(창 안 사유 줄은 단추 **위**에 — R6).
 */

import Phaser from 'phaser';
import { DraggablePanel } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';
import { clampTextWidth } from './TextFit.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { t, getLocale } from '../i18n/I18n.js';

const FONT = '"Noto Sans KR", sans-serif';
const W = 460;
const ROW_H = 44;
const MAX_ROWS = 6;

/** 장바구니 한 줄 — 상점 창이 만들어 넘기고, 수량이 바뀌면 같은 객체를 고친다 */
export interface CartLine {
  key: string;
  name: string;
  icon: string;
  iconTexture?: string;
  speciesId?: string;
  lengthCm?: number;
  /** 개당 값(구매가 · 매입가) */
  unit: number;
  qty: number;
  /** 한 번에 담을 수 있는 최대 수량(구매 = 1회 최대 · 판매 = 가진 수) */
  max: number;
}

export interface ShopCartOptions {
  mode: 'buy' | 'sell';
  lines: CartLine[];
  coins: number;
  /** 수량 변경 · 빼기 — 상점 창의 담은 표시를 맞춘다 */
  onChange: (lines: CartLine[]) => void;
  onConfirm: (lines: CartLine[]) => void;
  onCancel: () => void;
}

export class ShopCartDialog extends DraggablePanel {
  private readonly opts: ShopCartOptions;
  private rows!: Phaser.GameObjects.Container;
  private scroll = 0;
  private readonly rowsShown: number;
  private readonly wheel: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;

  constructor(scene: Phaser.Scene, opts: ShopCartOptions) {
    const rows = Math.min(MAX_ROWS, Math.max(1, opts.lines.length));
    const h = 32 + 14 + rows * ROW_H + 96;
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: (GAME_HEIGHT - h) / 2, width: W, height: h,
      title: opts.mode === 'buy' ? '장바구니' : '판매 목록', onClose: opts.onCancel, dim: true, depth: 950,
    });
    this.opts = opts;
    this.rowsShown = rows;
    this.rows = scene.add.container(0, 0);
    this.add(this.rows);
    this.wheel = (p, _go, _dx, dy): void => {
      const max = Math.max(0, this.opts.lines.length - this.rowsShown);
      if (max <= 0 || p.x < this.x || p.x > this.x + W || p.y < this.y || p.y > this.y + this.panelH) return;
      const next = Phaser.Math.Clamp(this.scroll + Math.sign(dy), 0, max);
      if (next !== this.scroll) { this.scroll = next; this.render(); }
    };
    scene.input.on('wheel', this.wheel);
    this.render();
  }

  private total(): number {
    return this.opts.lines.reduce((s, l) => s + l.unit * l.qty, 0);
  }

  private render(): void {
    this.rows.removeAll(true);
    const { lines, mode, coins } = this.opts;
    const top = this.contentTop + 6;
    const max = Math.max(0, lines.length - this.rowsShown);
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, max);

    if (lines.length === 0) {
      this.rows.add(this.scene.add.text(W / 2, top + ROW_H / 2, t(mode === 'buy' ? '담은 물건이 없다.' : '팔 물건을 고르지 않았다.'), {
        fontFamily: FONT, fontSize: '13px', color: '#8faabf',
      }).setOrigin(0.5));
    }
    for (let r = 0; r < this.rowsShown; r++) {
      const line = lines[this.scroll + r];
      if (!line) break;
      this.renderRow(line, top + r * ROW_H);
    }
    // 줄이 넘치면 위치 표기(조용한 잘림 금지)
    if (max > 0) {
      this.rows.add(this.scene.add.text(W - 14, top + this.rowsShown * ROW_H - 2,
        `${this.scroll + 1}–${this.scroll + this.rowsShown} / ${lines.length}`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#5f8ba6',
        }).setOrigin(1, 0));
    }

    // ── 합계 · 거래 뒤 남는 돈 ──
    const sumY = top + this.rowsShown * ROW_H + 12;
    const total = this.total();
    const after = mode === 'buy' ? coins - total : coins + total;
    const short = mode === 'buy' && after < 0;
    const sep = this.scene.add.graphics();
    sep.lineStyle(1, 0x1f3d5a, 1); sep.lineBetween(14, sumY - 6, W - 14, sumY - 6);
    this.rows.add(sep);
    const won = (n: number): string => (getLocale() === 'en' ? `₩${n.toLocaleString()}` : `${n.toLocaleString()}원`);
    this.rows.add(this.scene.add.text(16, sumY, `${t('합계')}  ${won(total)}`, {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: short ? '#ff8a7a' : '#ffe28a',
    }));
    this.rows.add(this.scene.add.text(W - 16, sumY + 2, `${t('보유')} ${won(coins)}  →  ${won(Math.max(0, after))}`, {
      fontFamily: FONT, fontSize: '11px', color: short ? '#ff8a7a' : '#9fd0e4',
    }).setOrigin(1, 0));
    if (short) {
      this.rows.add(this.scene.add.text(W / 2, sumY + 22, t('가진 돈이 모자라다 — 수량을 줄이거나 빼자.'), {
        fontFamily: FONT, fontSize: '11px', color: '#ff8a7a',
      }).setOrigin(0.5, 0));
    }

    // ── 단추 ──
    const btnY = this.panelH - 30;
    this.addBtn(W / 2 - 100, btnY, '취소', false, () => this.opts.onCancel());
    const okLabel = mode === 'buy' ? '사기' : '팔기';
    this.addBtn(W / 2 + 100, btnY, okLabel, true, () => {
      if (lines.length === 0 || short) return;
      this.opts.onConfirm(lines);
    }, lines.length === 0 || short);
    this.applyFix();
  }

  private renderRow(line: CartLine, y: number): void {
    const g = this.scene.add.graphics();
    g.fillStyle(0x0e1c2d, 0.9); g.fillRoundedRect(12, y + 2, W - 24, ROW_H - 4, 4);
    this.rows.add(g);
    this.rows.add(createItemIcon(this.scene, 32, y + ROW_H / 2, line, 26));
    const name = this.scene.add.text(52, y + 6, line.name, { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd' });
    clampTextWidth(name, 170);
    this.rows.add(name);
    const each = getLocale() === 'en' ? `₩${line.unit.toLocaleString()} each` : `개당 ${line.unit.toLocaleString()}원`;
    this.rows.add(this.scene.add.text(52, y + 23, each, { fontFamily: FONT, fontSize: '10px', color: '#8faabf' }));

    // 수량 −  n  +
    const cy = y + ROW_H / 2;
    const step = (d: number): void => {
      const q = Phaser.Math.Clamp(line.qty + d, 1, Math.max(1, line.max));
      if (q === line.qty) return;
      line.qty = q;
      this.opts.onChange(this.opts.lines);
      this.render();
    };
    this.addMini(244, cy, '−', () => step(-1), line.qty <= 1);
    this.rows.add(this.scene.add.text(272, cy, `${line.qty}`, {
      fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5));
    this.addMini(300, cy, '+', () => step(1), line.qty >= line.max);

    const sum = getLocale() === 'en' ? `₩${(line.unit * line.qty).toLocaleString()}` : `${(line.unit * line.qty).toLocaleString()}원`;
    this.rows.add(this.scene.add.text(W - 46, cy, sum, {
      fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#ffe28a',
    }).setOrigin(1, 0.5));
    // 빼기
    const x = this.scene.add.text(W - 28, cy, '✕', { fontFamily: 'sans-serif', fontSize: '13px', color: '#8faabf' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    x.on('pointerover', () => x.setColor('#ff6b6b'));
    x.on('pointerout', () => x.setColor('#8faabf'));
    x.on('pointerdown', () => {
      const i = this.opts.lines.indexOf(line);
      if (i >= 0) this.opts.lines.splice(i, 1);
      this.opts.onChange(this.opts.lines);
      this.render();
    });
    this.rows.add(x);
  }

  private addMini(cx: number, cy: number, label: string, onClick: () => void, disabled: boolean): void {
    const g = this.scene.add.graphics();
    g.fillStyle(disabled ? 0x15202c : 0x16324a, 1); g.fillRoundedRect(cx - 11, cy - 11, 22, 22, 3);
    g.lineStyle(1, disabled ? 0x2a3a4a : 0x5cd0ff, 0.9); g.strokeRoundedRect(cx - 11, cy - 11, 22, 22, 3);
    const tx = this.scene.add.text(cx, cy, label, {
      fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: disabled ? '#4a5a6a' : '#bfe9ff',
    }).setOrigin(0.5);
    this.rows.add([g, tx]);
    if (disabled) return;
    const hit = this.scene.add.rectangle(cx, cy, 24, 24, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
    this.rows.add(hit);
  }

  private addBtn(cx: number, cy: number, label: string, primary: boolean, onClick: () => void, disabled = false): void {
    const g = this.scene.add.graphics();
    const fill = disabled ? 0x15202c : primary ? 0x0d4a2e : 0x1f3045;
    const stroke = disabled ? 0x2a3a4a : primary ? 0x4af2a1 : 0x4a6a8a;
    const color = disabled ? '#4a5a6a' : primary ? '#4af2a1' : '#8faabf';
    g.fillStyle(fill, 0.95); g.fillRoundedRect(cx - 80, cy - 18, 160, 36, 4);
    g.lineStyle(1.5, stroke, 0.95); g.strokeRoundedRect(cx - 80, cy - 18, 160, 36, 4);
    const tx = this.scene.add.text(cx, cy, label, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color }).setOrigin(0.5);
    this.rows.add([g, tx]);
    if (disabled) return;
    const hit = this.scene.add.rectangle(cx, cy, 160, 36, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => tx.setColor('#ffffff'));
    hit.on('pointerout', () => tx.setColor(color));
    hit.on('pointerdown', onClick);
    this.rows.add(hit);
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input?.off('wheel', this.wheel);
    super.destroy(fromScene);
  }
}
