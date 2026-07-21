/**
 * @file CoolerPanel.ts
 * @description 어창(쿨러) 3x3 팝업 — 보관 어획 확인/상세보기/방생/손질(예정)
 *
 * 1인칭(쿨러 좌측 보관함 클릭)과 탑다운(B 키)에서 공용으로 사용.
 *  - 우클릭 컨텍스트 메뉴: 상세보기 / 방생하기(확인창) / 손질하기(미구현 — 비활성)
 *  - 강제 방생 모드(force): 인벤토리 공간 부족 시 ESC/X로 닫을 수 없고,
 *    필요한 수만큼 방생해야 '계속하기' 버튼이 활성화된다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { DraggablePanel } from './DraggablePanel.js';
import { ConfirmDialog } from './Dialogs.js';
import { ItemDetailPanel } from './ItemDetailPanel.js';
import { createItemIcon } from './ItemIcon.js';
import { CoolerStore, COOLER_CAPACITY, CoolerFish } from '../store/CoolerStore.js';
import { InvItem } from '../store/InventoryStore.js';

const CELL = 96;
const GAP = 10;
const PANEL_W = CELL * 3 + GAP * 2 + 48;
const PANEL_H = CELL * 3 + GAP * 2 + 150;

export interface CoolerPanelConfig {
  /** 강제 방생 모드 — 닫기 불가, requiredReleases()가 0 이하가 되면 '계속하기' 표시 */
  force?: boolean;
  /** 강제 모드에서 추가로 방생해야 하는 마릿수 계산 (force일 때 필수) */
  requiredReleases?: () => number;
  /** 어획 변경(방생) 시 호출 — 씬의 쿨러 카운트 갱신용 */
  onChanged?: () => void;
  onClose: () => void;
  depth?: number;
}

export class CoolerPanel extends DraggablePanel {
  private cfg: CoolerPanelConfig;
  private content!: Phaser.GameObjects.Container;
  private ctxMenu?: Phaser.GameObjects.Container;
  private childPopup?: Phaser.GameObjects.Container;

  /** 강제 모드에서 아직 닫을 수 없는 상태인가 (씬 ESC 처리에서 참조) */
  get lockedOpen(): boolean {
    return !!this.cfg.force && (this.cfg.requiredReleases?.() ?? 0) > 0;
  }

  constructor(scene: Phaser.Scene, cfg: CoolerPanelConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2,
      y: (GAME_HEIGHT - PANEL_H) / 2 - 20,
      width: PANEL_W, height: PANEL_H,
      title: cfg.force ? '어창 — 방생 필요!' : '어창 (쿨러 보관함)',
      onClose: () => { if (!this.lockedOpen) cfg.onClose(); },
      dim: true, depth: cfg.depth ?? 900,
      hideClose: cfg.force,
    });
    this.cfg = cfg;
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    this.renderBody();
  }

  private renderBody(): void {
    this.closeCtxMenu();
    this.content.removeAll(true);

    const need = this.cfg.force ? (this.cfg.requiredReleases?.() ?? 0) : 0;

    // 상단 안내 줄
    const info = this.scene.add.text(PANEL_W / 2, this.contentTop + 10,
      this.cfg.force
        ? (need > 0
          ? `인벤토리 공간 부족 — ${need}마리 이상 방생해야 합니다`
          : '방생 완료 — 계속 진행할 수 있습니다')
        : `보관 ${CoolerStore.count()} / ${COOLER_CAPACITY}마리 · 물칸 활어 보관 (신선도 유지)`,
      {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', fontStyle: 'bold',
        color: this.cfg.force ? (need > 0 ? '#ff9a6a' : '#4af2a1') : '#9fd0e4',
      }).setOrigin(0.5);
    this.content.add(info);

    // 3x3 소켓
    const gx = 24, gy = this.contentTop + 30;
    for (let i = 0; i < COOLER_CAPACITY; i++) {
      const cx = gx + (i % 3) * (CELL + GAP);
      const cy = gy + Math.floor(i / 3) * (CELL + GAP);
      const fish = CoolerStore.get(i);

      const sg = this.scene.add.graphics();
      sg.fillStyle(fish ? 0x0e2a3e : 0x0e1c2d, 0.95);
      sg.fillRoundedRect(cx, cy, CELL, CELL, 6);
      sg.lineStyle(1.5, fish ? 0x2f6d9a : 0x22384e, 0.9);
      sg.strokeRoundedRect(cx, cy, CELL, CELL, 6);
      this.content.add(sg);
      if (!fish) continue;

      this.content.add(createItemIcon(this.scene, cx + CELL / 2, cy + CELL / 2 - 12, this.toInvItem(i, fish), 52));
      const nm = this.scene.add.text(cx + CELL / 2, cy + CELL - 22, `${fish.nameKo}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#cfe3f2', fontStyle: 'bold',
        wordWrap: { width: CELL - 8 }, maxLines: 1,
      }).setOrigin(0.5);
      const sz = this.scene.add.text(cx + CELL / 2, cy + CELL - 10, `${fish.lengthCm}cm · ${(fish.weightG / 1000).toFixed(1)}kg`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#8fb8d0',
      }).setOrigin(0.5);
      // 활어 배지
      const dot = this.scene.add.graphics();
      dot.fillStyle(0xc07cff, 1);
      dot.fillCircle(cx + 10, cy + 10, 4);
      this.content.add([nm, sz, dot]);

      const hit = this.scene.add.rectangle(cx + CELL / 2, cy + CELL / 2, CELL, CELL, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
        // 좌/우클릭 모두 컨텍스트 메뉴 (우클릭 명세 + 좌클릭 접근성)
        this.openCtxMenu(i, p.x - this.x, p.y - this.y);
      });
      this.content.add(hit);
    }

    // 하단: 강제 모드 진행 버튼
    if (this.cfg.force && need <= 0) {
      const by = PANEL_H - 34;
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x0d4a2e, 0.95);
      bg.fillRoundedRect(PANEL_W / 2 - 90, by - 18, 180, 36, 5);
      bg.lineStyle(1.5, 0x4af2a1, 0.95);
      bg.strokeRoundedRect(PANEL_W / 2 - 90, by - 18, 180, 36, 5);
      const txt = this.scene.add.text(PANEL_W / 2, by, '계속하기', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#4af2a1', fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(PANEL_W / 2, by, 180, 36, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.cfg.onClose());
      this.content.add([bg, txt, hit]);
    } else if (!this.cfg.force) {
      const tip = this.scene.add.text(PANEL_W / 2, PANEL_H - 24, '우클릭: 상세보기 · 방생하기 · 손질하기(준비중)', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#7a98ac',
      }).setOrigin(0.5);
      this.content.add(tip);
    }

    this.applyFix();
  }

  /** 쿨러 개체 → 상세보기/아이콘용 임시 InvItem 뷰 모델 */
  private toInvItem(idx: number, f: CoolerFish): InvItem {
    return {
      id: `cooler_view_${idx}`,
      name: `${f.nameKo} (${f.lengthCm}cm)`,
      icon: '🐟', iconTexture: f.iconTexture,
      category: 'food', subCategory: '어획물', slot: 0, qty: 1,
      basePrice: Math.max(2000, Math.round(f.weightG * 12)),
      condition: 'live', equippable: false,
      speciesId: f.speciesId, lengthCm: f.lengthCm, weightG: f.weightG,
    };
  }

  // ── 컨텍스트 메뉴 (상세보기/방생하기/손질하기) ─────────
  private openCtxMenu(idx: number, localX: number, localY: number): void {
    this.closeCtxMenu();
    const fish = CoolerStore.get(idx);
    if (!fish) return;

    const mw = 130, rowH = 30;
    const rows: { label: string; enabled: boolean; onClick?: () => void }[] = [
      { label: '상세보기', enabled: true, onClick: () => this.openDetail(idx, fish) },
      { label: '방생하기', enabled: true, onClick: () => this.confirmRelease(idx, fish) },
      { label: '손질하기 (준비중)', enabled: false },
    ];
    const mh = rows.length * rowH + 8;
    const mx = Math.min(localX, PANEL_W - mw - 6);
    const my = Math.min(localY, PANEL_H - mh - 6);

    const menu = this.scene.add.container(mx, my);
    // 바깥 클릭 시 메뉴 자동 닫힘 — 전체 화면 투명 백드롭 (메뉴 행이 위라 행 클릭은 유지)
    const backdrop = this.scene.add.rectangle(-(this.x + mx), -(this.y + my), GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001)
      .setOrigin(0, 0)
      .setInteractive();
    backdrop.on('pointerdown', () => this.closeCtxMenu());
    menu.add(backdrop);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0d2236, 0.98);
    bg.fillRoundedRect(0, 0, mw, mh, 5);
    bg.lineStyle(1.5, 0x2a5a8a, 1);
    bg.strokeRoundedRect(0, 0, mw, mh, 5);
    menu.add(bg);

    rows.forEach((row, r) => {
      const ry = 4 + r * rowH + rowH / 2;
      const txt = this.scene.add.text(12, ry, row.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
        color: row.enabled ? '#d0e8f5' : '#546a7c',
      }).setOrigin(0, 0.5);
      menu.add(txt);
      if (!row.enabled) return;
      const hit = this.scene.add.rectangle(mw / 2, ry, mw - 8, rowH - 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => txt.setColor('#ffffff'));
      hit.on('pointerout', () => txt.setColor('#d0e8f5'));
      hit.on('pointerdown', () => { this.closeCtxMenu(); row.onClick?.(); });
      menu.add(hit);
    });

    this.add(menu);
    this.ctxMenu = menu;
    this.applyFix();
  }

  private closeCtxMenu(): void {
    this.ctxMenu?.destroy();
    this.ctxMenu = undefined;
  }

  private openDetail(idx: number, fish: CoolerFish): void {
    this.childPopup?.destroy();
    const panel = new ItemDetailPanel(
      this.scene, this.toInvItem(idx, fish),
      this.x + 60, this.y + 40,
      () => { panel.destroy(); this.childPopup = undefined; },
    );
    this.scene.add.existing(panel);
    this.childPopup = panel;
  }

  private confirmRelease(idx: number, fish: CoolerFish): void {
    this.childPopup?.destroy();
    const dlg = new ConfirmDialog(
      this.scene,
      `정말 방생하시겠습니까?\n${fish.nameKo} ${fish.lengthCm}cm / ${(fish.weightG / 1000).toFixed(2)}kg`,
      () => {
        CoolerStore.removeAt(idx);
        dlg.destroy();
        this.childPopup = undefined;
        this.cfg.onChanged?.();
        this.renderBody();
      },
      () => { dlg.destroy(); this.childPopup = undefined; },
    );
    this.scene.add.existing(dlg);
    this.childPopup = dlg;
  }

  override destroy(fromScene?: boolean): void {
    this.closeCtxMenu();
    this.childPopup?.destroy();
    super.destroy(fromScene);
  }
}
