/**
 * @file FridgePanel.ts
 * @description 집 냉장고 패널 — 냉동고(위 4×2=8칸) + 냉장고(아래 4×4=16칸) + 인벤토리 이송
 *
 *  - 좌측: 냉동고/냉장고 소켓 그리드. 우측: 인벤토리(음식·어획물) 리스트.
 *  - 인벤토리 아이템 클릭 → 선택 구획(냉동/냉장)의 첫 빈칸에 보관 (상태 냉동/냉장 전환).
 *  - 보관 아이템 클릭 → 인벤토리로 꺼내기 (신선도 시계 재시작).
 *  - 보관 중에는 신선도 정지. 세이브(GameState.fridge)에 영속.
 */

import Phaser from 'phaser';
import { DraggablePanel } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';
import { GameState } from '../store/GameState.js';
import {
  InventoryStore, InvItem, CONDITION_LABEL, CONDITION_COLOR, refreshCondition,
} from '../store/InventoryStore.js';
import {
  FridgeStore, FridgeSection, FREEZER_SLOTS, FRIDGE_SLOTS, FRIDGE_COLS,
} from '../store/FridgeStore.js';

const PANEL_W = 580;
const PANEL_H = 470;
const CELL = 42;
const CELL_GAP = 6;

export class FridgePanel extends DraggablePanel {
  private gridC!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private depositTo: FridgeSection = 'fridge';

  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '냉장고 (냉동고 · 냉장고)', onClose, depth: 850 });

    this.gridC = scene.add.container(0, 0);
    this.add(this.gridC);

    this.statusText = scene.add.text(PANEL_W / 2, PANEL_H - 18, '아이템을 클릭해 보관 · 보관물 클릭해 꺼내기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fd0e4', align: 'center',
      wordWrap: { width: PANEL_W - 30 },
    }).setOrigin(0.5);
    this.add(this.statusText);

    this.render();
    this.applyFix();
  }

  private setStatus(msg: string): void {
    this.statusText.setText(msg);
  }

  private render(): void {
    this.gridC.removeAll(true);
    const leftX = 18;
    let y = this.contentTop + 8;

    // ── 냉동고 (4×2) ──
    y = this.renderSection('freezer', '냉동고', leftX, y, FREEZER_SLOTS, 0x2a4a66);
    y += 10;
    // ── 냉장고 (4×4) ──
    this.renderSection('fridge', '냉장고', leftX, y, FRIDGE_SLOTS, 0x1d4a30);

    // ── 우측 인벤토리 리스트 (음식·어획물) ──
    this.renderInventoryList(leftX + FRIDGE_COLS * (CELL + CELL_GAP) + 24, this.contentTop + 8);
  }

  /** 구획 헤더 + 그리드. 반환 = 다음 y */
  private renderSection(section: FridgeSection, label: string, x0: number, y0: number, count: number, tone: number): number {
    const scene = this.scene;
    const cols = FRIDGE_COLS;
    const rows = Math.ceil(count / cols);
    const selected = this.depositTo === section;

    // 헤더 (보관 구획 선택 토글)
    const hdrBg = scene.add.graphics();
    hdrBg.fillStyle(selected ? tone : 0x0e1c2d, selected ? 0.95 : 0.85);
    hdrBg.fillRoundedRect(x0, y0, cols * (CELL + CELL_GAP) - CELL_GAP, 20, 4);
    hdrBg.lineStyle(1.2, selected ? 0x5cd0ff : 0x2a5a8a, 0.9);
    hdrBg.strokeRoundedRect(x0, y0, cols * (CELL + CELL_GAP) - CELL_GAP, 20, 4);
    const filled = FridgeStore.filledCount(section);
    const hdr = scene.add.text(x0 + 8, y0 + 10, `${label}  ${filled}/${count}${selected ? '  ◀ 보관 대상' : ''}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
      color: selected ? '#aee8ff' : '#8faabf', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const hHit = scene.add.rectangle(x0 + (cols * (CELL + CELL_GAP)) / 2, y0 + 10, cols * (CELL + CELL_GAP), 20, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hHit.on('pointerdown', () => { this.depositTo = section; this.render(); this.applyFix(); });
    this.gridC.add([hdrBg, hdr, hHit]);

    const gy = y0 + 26;
    for (let idx = 0; idx < count; idx++) {
      const col = idx % cols, row = Math.floor(idx / cols);
      const sx = x0 + col * (CELL + CELL_GAP);
      const sy = gy + row * (CELL + CELL_GAP);
      const item = FridgeStore.get(section, idx);

      const box = scene.add.graphics();
      box.fillStyle(0x0e1c2d, 0.92);
      box.fillRoundedRect(sx, sy, CELL, CELL, 4);
      box.lineStyle(1.2, 0x1f3d5a, 0.8);
      box.strokeRoundedRect(sx, sy, CELL, CELL, 4);
      this.gridC.add(box);

      if (item) {
        const icon = createItemIcon(scene, sx + CELL / 2, sy + CELL / 2 - 4, item, 24);
        this.gridC.add(icon);
        if (item.condition) {
          const badge = scene.add.text(sx + 3, sy + 2, CONDITION_LABEL[item.condition], {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '7px',
            color: CONDITION_COLOR[item.condition], fontStyle: 'bold',
            backgroundColor: '#050f1ecc', padding: { x: 1, y: 1 },
          });
          this.gridC.add(badge);
        }
        const hit = scene.add.rectangle(sx + CELL / 2, sy + CELL / 2, CELL, CELL, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => this.setStatus(`${item.name} — 클릭 시 인벤토리로 꺼냅니다`));
        hit.on('pointerdown', () => this.withdraw(section, idx));
        this.gridC.add(hit);
      }
    }
    return gy + rows * (CELL + CELL_GAP);
  }

  /** 우측 인벤토리(음식/어획물) 리스트 — 클릭 시 선택 구획에 보관 */
  private renderInventoryList(x0: number, y0: number): void {
    const scene = this.scene;
    const title = scene.add.text(x0, y0, '보관할 아이템 (음식·어획물)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffd9a0', fontStyle: 'bold',
    });
    this.gridC.add(title);

    const items = InventoryStore.getByCategory('food');
    const listY = y0 + 22;
    const rowH = 30;
    const maxRows = 12;
    if (items.length === 0) {
      this.gridC.add(scene.add.text(x0, listY, '보관할 음식/어획물이 없습니다', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#607b8e',
      }));
      return;
    }
    items.slice(0, maxRows).forEach((item, i) => {
      refreshCondition(item);
      const ry = listY + i * rowH;
      const rowBg = scene.add.graphics();
      rowBg.fillStyle(0x0e1c2d, 0.85);
      rowBg.fillRoundedRect(x0, ry, 190, rowH - 3, 4);
      rowBg.lineStyle(1, 0x1f3d5a, 0.7);
      rowBg.strokeRoundedRect(x0, ry, 190, rowH - 3, 4);
      const icon = createItemIcon(scene, x0 + 15, ry + (rowH - 3) / 2, item, 20);
      const nameTxt = scene.add.text(x0 + 30, ry + (rowH - 3) / 2, `${item.name}${item.qty > 1 ? ` x${item.qty}` : ''}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8dceb',
      }).setOrigin(0, 0.5);
      if (nameTxt.width > 150) nameTxt.setScale(150 / nameTxt.width);
      const hit = scene.add.rectangle(x0 + 95, ry + (rowH - 3) / 2, 190, rowH - 3, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.setStatus(`${item.name} — 클릭 시 ${this.depositTo === 'freezer' ? '냉동고' : '냉장고'}에 보관`));
      hit.on('pointerdown', () => this.deposit(item));
      this.gridC.add([rowBg, icon, nameTxt, hit]);
    });
    if (items.length > maxRows) {
      this.gridC.add(scene.add.text(x0, listY + maxRows * rowH, `… 외 ${items.length - maxRows}개`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#607b8e',
      }));
    }
  }

  /** 인벤토리 → 냉장고 보관 */
  private deposit(item: InvItem): void {
    if (FridgeStore.firstEmpty(this.depositTo) < 0) {
      this.setStatus(`${this.depositTo === 'freezer' ? '냉동고' : '냉장고'}가 가득 찼습니다`);
      return;
    }
    const moved = InventoryStore.find(item.id);
    if (!moved) return;
    FridgeStore.place(this.depositTo, moved);
    InventoryStore.removeItem(moved.id, true);   // 스택 전체 이동
    GameState.markDirty();
    this.scene.events.emit('inventory-changed');
    this.setStatus(`${item.name} → ${this.depositTo === 'freezer' ? '냉동고' : '냉장고'}에 보관했습니다`);
    this.render();
    this.applyFix();
  }

  /** 냉장고 → 인벤토리 꺼내기 */
  private withdraw(section: FridgeSection, slot: number): void {
    const item = FridgeStore.get(section, slot);
    if (!item) return;
    if (InventoryStore.freeSlotCount('food') <= 0 && !InventoryStore.find(item.id)) {
      this.setStatus('인벤토리(음식) 공간이 없습니다 — 자리를 비우고 다시 시도하세요');
      return;
    }
    const taken = FridgeStore.take(section, slot);
    if (!taken) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slot: _s, qty, ...rest } = taken;
    InventoryStore.addItem(rest, Math.max(1, qty));
    GameState.markDirty();
    this.scene.events.emit('inventory-changed');
    this.setStatus(`${taken.name}을(를) 인벤토리로 꺼냈습니다`);
    this.render();
    this.applyFix();
  }
}
