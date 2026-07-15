/**
 * @file Dialogs.ts
 * @description 공통 다이얼로그 — 확인(예/아니오), 수량 지정
 *
 * ConfirmDialog: "…하시겠습니까?" 예/아니오 선택.
 * QuantityDialog: 수량 프리셋 1개, -/+ 버튼, 숫자 직접 입력(키보드), 합계 재화 표시.
 * 둘 다 드래그 이동/X 닫기/ESC(씬 스택) 지원.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { DraggablePanel } from './DraggablePanel.js';

// ═══════════════════════════════════════════════════
// 확인 다이얼로그 (예 / 아니오)
// ═══════════════════════════════════════════════════
export class ConfirmDialog extends DraggablePanel {
  constructor(scene: Phaser.Scene, message: string, onYes: () => void, onCancel: () => void) {
    const w = 400;
    const lineCount = message.split('\n').length;
    const h = 130 + lineCount * 20;
    super(scene, {
      x: (GAME_WIDTH - w) / 2, y: (GAME_HEIGHT - h) / 2,
      width: w, height: h, title: '확인', onClose: onCancel, dim: true, depth: 950,
    });

    const msg = scene.add.text(w / 2, this.contentTop + 14, message, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0);
    this.add(msg);

    const btnY = h - 34;
    this.addButton(w / 2 - 90, btnY, '아니오', 0x1f3045, 0x4a6a8a, '#8faabf', onCancel);
    this.addButton(w / 2 + 90, btnY, '예', 0x0d4a2e, 0x4af2a1, '#4af2a1', onYes);

    this.applyFix();
  }

  private addButton(cx: number, cy: number, label: string, fill: number, stroke: number, color: string, onClick: () => void): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(fill, 0.95);
    bg.fillRoundedRect(cx - 70, cy - 18, 140, 36, 4);
    bg.lineStyle(1.5, stroke, 0.95);
    bg.strokeRoundedRect(cx - 70, cy - 18, 140, 36, 4);
    const txt = this.scene.add.text(cx, cy, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color, fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(cx, cy, 140, 36, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => txt.setColor('#ffffff'));
    hit.on('pointerout', () => txt.setColor(color));
    hit.on('pointerdown', onClick);
    this.add([bg, txt, hit]);
  }
}

// ═══════════════════════════════════════════════════
// 수량 지정 다이얼로그
// ═══════════════════════════════════════════════════
export interface QuantityDialogConfig {
  itemName: string;
  unitPrice: number;
  /** 지정 가능 최대 수량 */
  maxQty: number;
  /** '구매' | '판매' 등 액션 라벨 */
  actionLabel: string;
  onConfirm: (qty: number) => void;
  onCancel: () => void;
}

export class QuantityDialog extends DraggablePanel {
  private qty = 1;
  private cfg: QuantityDialogConfig;
  private qtyText!: Phaser.GameObjects.Text;
  private totalText!: Phaser.GameObjects.Text;
  private keyHandler: (ev: KeyboardEvent) => void;
  /** 직접 입력 버퍼 (숫자 키 입력 시 갱신) */
  private typedBuffer = '';

  constructor(scene: Phaser.Scene, cfg: QuantityDialogConfig) {
    const w = 400, h = 250;
    super(scene, {
      x: (GAME_WIDTH - w) / 2, y: (GAME_HEIGHT - h) / 2,
      width: w, height: h, title: '수량 지정', onClose: cfg.onCancel, dim: true, depth: 950,
    });
    this.cfg = cfg;

    const name = scene.add.text(w / 2, this.contentTop + 12, cfg.itemName, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const sub = scene.add.text(w / 2, this.contentTop + 34, `개당 ${cfg.unitPrice.toLocaleString()} 원 · 최대 ${cfg.maxQty}개 · 숫자 키로 직접 입력 가능`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8faabf',
    }).setOrigin(0.5);
    this.add([name, sub]);

    // 수량 표시 + -/+ 버튼
    const qy = this.contentTop + 82;
    this.qtyText = scene.add.text(w / 2, qy, '1', {
      fontFamily: 'monospace', fontSize: '30px', color: '#e8f4fd', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.qtyText);

    this.addStepButton(w / 2 - 90, qy, '-', -1);
    this.addStepButton(w / 2 + 90, qy, '+', 1);

    this.totalText = scene.add.text(w / 2, qy + 42, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.totalText);
    this.refresh();

    // 하단 버튼
    const btnY = h - 34;
    this.addActionButton(w / 2 - 90, btnY, '취소', 0x1f3045, 0x4a6a8a, '#8faabf', cfg.onCancel);
    this.addActionButton(w / 2 + 90, btnY, `${cfg.actionLabel} 확인`, 0x0d4a2e, 0x4af2a1, '#4af2a1', () => cfg.onConfirm(this.qty));

    // 숫자 직접 입력
    this.keyHandler = (ev: KeyboardEvent) => {
      if (/^[0-9]$/.test(ev.key)) {
        this.typedBuffer = (this.typedBuffer + ev.key).slice(-4);
        const n = parseInt(this.typedBuffer, 10);
        this.qty = Phaser.Math.Clamp(Number.isNaN(n) || n < 1 ? 1 : n, 1, this.cfg.maxQty);
        this.refresh();
      } else if (ev.key === 'Backspace') {
        this.typedBuffer = this.typedBuffer.slice(0, -1);
        const n = parseInt(this.typedBuffer || '1', 10);
        this.qty = Phaser.Math.Clamp(Number.isNaN(n) ? 1 : n, 1, this.cfg.maxQty);
        this.refresh();
      }
    };
    scene.input.keyboard?.on('keydown', this.keyHandler);

    this.applyFix();
  }

  private addStepButton(cx: number, cy: number, label: string, delta: number): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x155a7c, 0.95);
    bg.fillRoundedRect(cx - 24, cy - 20, 48, 40, 5);
    bg.lineStyle(1.5, 0x33b0e0, 0.95);
    bg.strokeRoundedRect(cx - 24, cy - 20, 48, 40, 5);
    const txt = this.scene.add.text(cx, cy, label, {
      fontFamily: 'monospace', fontSize: '22px', color: '#aee8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(cx, cy, 48, 40, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      this.typedBuffer = '';
      this.qty = Phaser.Math.Clamp(this.qty + delta, 1, this.cfg.maxQty);
      this.refresh();
    });
    this.add([bg, txt, hit]);
  }

  private addActionButton(cx: number, cy: number, label: string, fill: number, stroke: number, color: string, onClick: () => void): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(fill, 0.95);
    bg.fillRoundedRect(cx - 80, cy - 18, 160, 36, 4);
    bg.lineStyle(1.5, stroke, 0.95);
    bg.strokeRoundedRect(cx - 80, cy - 18, 160, 36, 4);
    const txt = this.scene.add.text(cx, cy, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color, fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(cx, cy, 160, 36, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => txt.setColor('#ffffff'));
    hit.on('pointerout', () => txt.setColor(color));
    hit.on('pointerdown', onClick);
    this.add([bg, txt, hit]);
  }

  private refresh(): void {
    this.qtyText.setText(String(this.qty));
    this.totalText.setText(`합계: ${(this.qty * this.cfg.unitPrice).toLocaleString()} 원`);
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input?.keyboard?.off('keydown', this.keyHandler);
    super.destroy(fromScene);
  }
}
