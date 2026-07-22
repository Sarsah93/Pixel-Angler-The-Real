/**
 * @file InventoryPanel.ts
 * @description 인벤토리 팝업 패널 (I 키 토글, 드래그 이동 가능)
 *
 * 구성:
 *  - 상단 카테고리 탭: 장비 / 소모품 / 음식 / 낚시용품 / 기타 (탭별 독립 5x5 소켓 공간)
 *  - 아이템 드래그 앤 드랍으로 소켓 간 위치 이동 (대상 소켓 점유 시 교환)
 *  - 아이템 우클릭 → 액션 메뉴 (상세보기 / 사용하기(음식·소모품, 녹색) /
 *    착용·해제 / 채비하기(낚싯대) / 퀵슬롯 등록(1~8 키 지정) / 전환하기 /
 *    버리기·완전제거(빨간색 + "정말 버리시겠습니까?" 확인창))
 *  - 최하단: 보유 재화(원화) 표시
 *
 * 추후 계획: 낚싯대 채비 모딩(소켓별 부품 선택) 뷰 정식 연동, 음식 효과 적용.
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import {
  InventoryStore, InvCategory, InvItem, GRID_CAPACITY,
  CATEGORY_LABEL, CONDITION_LABEL, CONDITION_COLOR,
} from '../store/InventoryStore.js';
import { CoolerStore } from '../store/CoolerStore.js';
import { DraggablePanel } from './DraggablePanel.js';
import { ConfirmDialog } from './Dialogs.js';
import { createItemIcon } from './ItemIcon.js';
import { playEatSfx } from '../audio/Sfx.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

const TABS: InvCategory[] = ['gear', 'consumable', 'food', 'tackle', 'etc'];

const PANEL_W = 440;
const PANEL_H = 596;
const GRID_COLS = 5;
const SLOT = 66;
const SLOT_GAP = 7;
const DRAG_THRESHOLD = 6;

export interface InventoryPanelCallbacks {
  onClose: () => void;
  /** 상세보기 액션 */
  onOpenDetail: (item: InvItem) => void;
  /** 낚싯대 '채비하기' 액션 → Utilization 창 채비 탭 */
  onOpenTackle: () => void;
}

export class InventoryPanel extends DraggablePanel {
  private currentTab: InvCategory = 'gear';
  private tabBgs = new Map<InvCategory, Phaser.GameObjects.Graphics>();
  private tabTexts = new Map<InvCategory, Phaser.GameObjects.Text>();
  private gridContainer!: Phaser.GameObjects.Container;
  private footerText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private contextMenu?: Phaser.GameObjects.Container;

  private cbs: InventoryPanelCallbacks;

  /** 퀵슬롯 배정 대기 중인 아이템 id */
  private assignItemId: string | null = null;
  private keyHandler?: (ev: KeyboardEvent) => void;

  // ── 아이템 드래그 앤 드랍 상태 ──
  private itemDrag: {
    item: InvItem; fromSlot: number;
    startX: number; startY: number;
    ghost?: Phaser.GameObjects.Text;
    moved: boolean;
  } | null = null;
  private itemDragMove: (p: Phaser.Input.Pointer) => void;
  private itemDragUp: (p: Phaser.Input.Pointer) => void;

  /** 그리드 좌상단 (패널 로컬 좌표) */
  private gridX0 = 0;
  private gridY0 = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, cbs: InventoryPanelCallbacks) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '인벤토리', onClose: cbs.onClose, depth: 800 });
    this.cbs = cbs;

    const hint = scene.add.text(110, 16, '우클릭: 아이템 액션 · 드래그: 위치 이동', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#607b8e',
    }).setOrigin(0, 0.5);
    this.add(hint);

    this.buildTabs();

    this.gridContainer = scene.add.container(0, 0);
    this.add(this.gridContainer);

    const gridW = GRID_COLS * SLOT + (GRID_COLS - 1) * SLOT_GAP;
    this.gridX0 = (PANEL_W - gridW) / 2;
    this.gridY0 = this.contentTop + 48;

    this.buildFooter();
    this.renderGrid();

    // 퀵슬롯 배정용 숫자 키 리스너
    this.keyHandler = (ev: KeyboardEvent) => {
      if (!this.assignItemId) return;
      const n = parseInt(ev.key, 10);
      if (n >= 1 && n <= 8) {
        InventoryStore.assignQuickslot(n - 1, this.assignItemId);
        const item = InventoryStore.find(this.assignItemId);
        this.setStatus(`${item?.name ?? '아이템'} → 퀵슬롯 ${n}번에 등록되었습니다.`);
        this.assignItemId = null;
        this.scene.events.emit('inventory-changed');
      } else if (ev.key === 'Escape') {
        this.assignItemId = null;
        this.setStatus('퀵슬롯 등록이 취소되었습니다.');
      }
    };
    scene.input.keyboard?.on('keydown', this.keyHandler);

    // 아이템 드래그 이동/드랍 (씬 레벨 리스너)
    this.itemDragMove = (p: Phaser.Input.Pointer) => {
      if (!this.itemDrag) return;
      const dx = p.x - this.itemDrag.startX;
      const dy = p.y - this.itemDrag.startY;
      if (!this.itemDrag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      this.itemDrag.moved = true;
      if (!this.itemDrag.ghost) {
        this.itemDrag.ghost = scene.add.text(0, 0, this.itemDrag.item.icon, { fontSize: '26px' })
          .setOrigin(0.5).setAlpha(0.85).setDepth(this.depth + 50).setScrollFactor(0);
      }
      this.itemDrag.ghost.setPosition(p.x, p.y);
    };
    this.itemDragUp = (p: Phaser.Input.Pointer) => {
      const drag = this.itemDrag;
      if (!drag) return;
      this.itemDrag = null;
      drag.ghost?.destroy();
      if (!drag.moved) {
        // 클릭으로 간주 — 정보 라인 표시
        this.setStatus(`${drag.item.name}  ·  ${drag.item.subCategory}${drag.item.condition ? '  ·  ' + CONDITION_LABEL[drag.item.condition] : ''}`);
        return;
      }
      const toSlot = this.slotAtPointer(p);
      if (toSlot >= 0 && toSlot !== drag.fromSlot) {
        InventoryStore.moveItem(this.currentTab, drag.fromSlot, toSlot);
        this.renderGrid();
        this.scene.events.emit('inventory-changed');
      }
    };
    scene.input.on('pointermove', this.itemDragMove);
    scene.input.on('pointerup', this.itemDragUp);

    // 외부(상점 구매 등) 인벤토리 변경 반영
    scene.events.on('inventory-changed', this.onExternalChange, this);

    this.applyFix();
  }

  private onExternalChange = (): void => {
    if (!this.scene) return;
    this.renderGrid();
    this.footerText?.setText(`보유 재화  ${GameState.player.inventory.coins.toLocaleString()} 원`);
  };

  /** 포인터 화면 좌표 → 현재 탭 그리드 소켓 인덱스 (-1: 그리드 밖) */
  private slotAtPointer(p: Phaser.Input.Pointer): number {
    const lx = p.x - this.x - this.gridX0;
    const ly = p.y - this.y - this.gridY0;
    if (lx < 0 || ly < 0) return -1;
    const col = Math.floor(lx / (SLOT + SLOT_GAP));
    const row = Math.floor(ly / (SLOT + SLOT_GAP));
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_COLS) return -1;
    // 셀 간 간격 부분 클릭 방지
    if (lx - col * (SLOT + SLOT_GAP) > SLOT || ly - row * (SLOT + SLOT_GAP) > SLOT) return -1;
    return row * GRID_COLS + col;
  }

  // ═══════════════════════════════════════════════════
  // 카테고리 탭
  // ═══════════════════════════════════════════════════
  private buildTabs(): void {
    const tabW = 78, tabH = 30, gap = 5;
    const startX = 14;
    const ty = this.contentTop + 8;

    TABS.forEach((tab, i) => {
      const tx = startX + i * (tabW + gap);
      const g = this.scene.add.graphics();
      this.tabBgs.set(tab, g);

      const t = this.scene.add.text(tx + tabW / 2, ty + tabH / 2, CATEGORY_LABEL[tab], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#d0e8f5', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tabTexts.set(tab, t);

      const hit = this.scene.add.rectangle(tx + tabW / 2, ty + tabH / 2, tabW, tabH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.currentTab = tab;
        this.closeContextMenu();
        this.paintTabs();
        this.renderGrid();
      });

      this.add([g, t, hit]);
    });
    this.paintTabs();
  }

  private paintTabs(): void {
    const tabW = 78, tabH = 30, gap = 5;
    const startX = 14;
    const ty = this.contentTop + 8;
    TABS.forEach((tab, i) => {
      const tx = startX + i * (tabW + gap);
      const g = this.tabBgs.get(tab)!;
      const selected = tab === this.currentTab;
      g.clear();
      g.fillStyle(selected ? 0x155a7c : 0x0e1c2d, selected ? 0.98 : 0.9);
      g.fillRoundedRect(tx, ty, tabW, tabH, 4);
      g.lineStyle(1.5, selected ? 0x5cd0ff : 0x1f3d5a, 0.95);
      g.strokeRoundedRect(tx, ty, tabW, tabH, 4);
      this.tabTexts.get(tab)!.setColor(selected ? '#aee8ff' : '#8faabf');
    });
  }

  // ═══════════════════════════════════════════════════
  // 5x5 소켓 그리드 (탭별 독립 공간, slot 위치 기반)
  // ═══════════════════════════════════════════════════
  private renderGrid(): void {
    this.gridContainer.removeAll(true);

    for (let idx = 0; idx < GRID_CAPACITY; idx++) {
      const col = idx % GRID_COLS;
      const row = Math.floor(idx / GRID_COLS);
      const sx = this.gridX0 + col * (SLOT + SLOT_GAP);
      const sy = this.gridY0 + row * (SLOT + SLOT_GAP);
      const item = InventoryStore.itemAtSlot(this.currentTab, idx);

      const box = this.scene.add.graphics();
      this.paintSlotBox(box, sx, sy, item, false);
      this.gridContainer.add(box);

      if (!item) continue;

      const icon = createItemIcon(this.scene, sx + SLOT / 2, sy + SLOT / 2 - 6, item, 30);
      this.gridContainer.add(icon);

      if (item.qty > 1) {
        const qty = this.scene.add.text(sx + SLOT - 5, sy + SLOT - 4, `x${item.qty}`, {
          fontFamily: 'monospace', fontSize: '10px', color: '#ffe28a', fontStyle: 'bold',
        }).setOrigin(1, 1);
        this.gridContainer.add(qty);
      }

      if (item.condition) {
        const badge = this.scene.add.text(sx + 4, sy + 3, CONDITION_LABEL[item.condition], {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px',
          color: CONDITION_COLOR[item.condition], fontStyle: 'bold',
          backgroundColor: '#050f1ecc', padding: { x: 2, y: 1 },
        });
        this.gridContainer.add(badge);
      }

      if (item.equipped) {
        const eq = this.scene.add.text(sx + SLOT - 4, sy + 3, '착용', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#4af2a1', fontStyle: 'bold',
          backgroundColor: '#0d4a2ecc', padding: { x: 2, y: 1 },
        }).setOrigin(1, 0);
        this.gridContainer.add(eq);
      }

      const nameTxt = this.scene.add.text(sx + SLOT / 2, sy + SLOT - 14, item.name, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '7px', color: '#a8c4d8',
      }).setOrigin(0.5, 0);
      if (nameTxt.width > SLOT - 6) nameTxt.setScale((SLOT - 6) / nameTxt.width);
      this.gridContainer.add(nameTxt);

      // 인터랙션: 좌버튼 = 드래그 시작(이동)/클릭, 우버튼 = 액션 메뉴
      const hit = this.scene.add.rectangle(sx + SLOT / 2, sy + SLOT / 2, SLOT, SLOT, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.paintSlotBox(box, sx, sy, item, true));
      hit.on('pointerout', () => this.paintSlotBox(box, sx, sy, item, false));
      hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          this.openContextMenu(item, pointer.x, pointer.y);
        } else if (pointer.leftButtonDown()) {
          this.itemDrag = {
            item, fromSlot: idx,
            startX: pointer.x, startY: pointer.y,
            moved: false,
          };
        }
      });
      this.gridContainer.add(hit);
    }

    this.applyFix();
  }

  private paintSlotBox(box: Phaser.GameObjects.Graphics, sx: number, sy: number, item: InvItem | undefined, hover: boolean): void {
    box.clear();
    box.fillStyle(hover ? 0x162a40 : 0x0e1c2d, hover ? 0.95 : 0.92);
    box.fillRoundedRect(sx, sy, SLOT, SLOT, 4);
    const strokeColor = hover ? 0x4af2a1 : (item?.equipped ? 0x4af2a1 : 0x1f3d5a);
    box.lineStyle(hover ? 1.5 : 1.2, strokeColor, item?.equipped || hover ? 1 : 0.8);
    box.strokeRoundedRect(sx, sy, SLOT, SLOT, 4);
  }

  // ═══════════════════════════════════════════════════
  // 우클릭 액션 컨텍스트 메뉴
  // ═══════════════════════════════════════════════════
  private openContextMenu(item: InvItem, screenX: number, screenY: number): void {
    this.closeContextMenu();

    const actions: { label: string; run: () => void; color?: string; hoverColor?: string }[] = [];

    actions.push({
      label: '상세보기',
      run: () => this.cbs.onOpenDetail(item),
    });
    // 음식/소모품 — 사용하기 (녹색). 음식은 섭취 SFX와 함께 소모, 소모품은 소모만.
    // 손질되지 않은 활어(어획물)·손질 필렛·통마리·부산물은 날것이라 섭취 불가 —
    // 조리(요리) 후에만 먹을 수 있으므로 사용하기 자체를 제공하지 않는다.
    const rawFishSubCats = ['어획물', '손질 필렛', '손질 통마리', '부산물'];
    const usable = item.category === 'consumable'
      || (item.category === 'food' && !rawFishSubCats.includes(item.subCategory));
    if (usable) {
      actions.push({
        label: '사용하기',
        color: '#4af2a1', hoverColor: '#8dffce',
        run: () => {
          if (item.category === 'food') {
            if (item.condition === 'bad' || item.condition === 'spoiled') {
              this.setStatus(`${item.name} — 상태가 나빠 먹을 수 없습니다 (${CONDITION_LABEL[item.condition]})`);
              return;
            }
            playEatSfx();
            InventoryStore.removeItem(item.id, false);
            this.setStatus(`${item.name}을(를) 맛있게 먹었습니다. (효과 적용은 추후 구현)`);
          } else {
            InventoryStore.removeItem(item.id, false);
            this.setStatus(`${item.name}을(를) 사용했습니다. (효과 적용은 추후 구현)`);
          }
          this.renderGrid();
          this.scene.events.emit('inventory-changed');
        },
      });
    }
    if (item.equippable && item.tool) {
      // 손 도구(낚싯대/뜰채): 왼손/오른손 선택 착용 — 기존 장비는 교체
      if (item.equipped) {
        actions.push({
          label: `해제하기 (${item.equippedHand === 'L' ? '왼손' : '오른손'})`,
          run: () => {
            InventoryStore.toggleEquip(item.id);
            this.setStatus(`${item.name} 해제 완료`);
            this.renderGrid();
            this.scene.events.emit('inventory-changed');
          },
        });
      }
      actions.push({
        label: item.equippedHand === 'R' ? '오른손 착용 중' : '오른손 착용',
        run: () => {
          InventoryStore.equipHand(item.id, 'R');
          this.setStatus(`${item.name} → 오른손 착용 완료`);
          this.renderGrid();
          this.scene.events.emit('inventory-changed');
        },
      });
      actions.push({
        label: item.equippedHand === 'L' ? '왼손 착용 중' : '왼손 착용',
        run: () => {
          InventoryStore.equipHand(item.id, 'L');
          this.setStatus(`${item.name} → 왼손 착용 완료`);
          this.renderGrid();
          this.scene.events.emit('inventory-changed');
        },
      });
    } else if (item.equippable) {
      actions.push({
        label: item.equipped ? '해제하기' : '착용하기',
        run: () => {
          InventoryStore.toggleEquip(item.id);
          this.setStatus(`${item.name} ${item.equipped ? '착용' : '해제'} 완료`);
          this.renderGrid();
          this.scene.events.emit('inventory-changed');
        },
      });
    }
    // 낚싯대 → 채비하기 (Utilization 채비 탭)
    if (item.tool === 'rod') {
      actions.push({ label: '채비하기', run: () => this.cbs.onOpenTackle() });
    }
    actions.push({
      label: '퀵슬롯 등록',
      run: () => {
        this.assignItemId = item.id;
        this.setStatus(`퀵슬롯 등록: 1~8 숫자 키를 눌러 슬롯을 지정하세요 (${item.name})`);
      },
    });
    actions.push({
      label: '전환하기',
      run: () => this.setStatus('전환 기능은 준비중입니다 (예: 어획물 → 미끼 전환).'),
    });
    // 버리기/완전제거 — 빨간색 + "정말 버리시겠습니까?" 확인창
    actions.push({
      label: '버리기',
      color: '#ff6b6b', hoverColor: '#ff9a9a',
      run: () => this.confirmDiscard(item, false),
    });
    actions.push({
      label: '완전제거',
      color: '#ff6b6b', hoverColor: '#ff9a9a',
      run: () => this.confirmDiscard(item, true),
    });
    actions.push({ label: '취소', run: () => { /* 메뉴만 닫음 */ } });

    // 메뉴는 패널 로컬 좌표로 배치
    const menuW = 150;
    const rowH = 27;
    const menuH = actions.length * rowH + 10;
    let mx = screenX - this.x + 6;
    let my = screenY - this.y + 6;
    if (this.x + mx + menuW > 1270) mx -= menuW + 12;
    if (this.y + my + menuH > 712) my = 712 - this.y - menuH;

    const menu = this.scene.add.container(0, 0);

    // 바깥 클릭 시 메뉴 자동 닫기 — 화면 전체(패널 로컬 좌표 기준 넉넉한 범위)를 덮는
    // 투명 캐처를 메뉴 내용보다 먼저 추가해 뒤에 깔아둔다 (뒤에 추가된 항목 버튼이 우선 클릭됨).
    const outsideCatcher = this.scene.add.rectangle(
      mx - GAME_WIDTH, my - GAME_HEIGHT, GAME_WIDTH * 3, GAME_HEIGHT * 3, 0x000000, 0.001,
    ).setOrigin(0, 0).setInteractive();
    outsideCatcher.on('pointerdown', () => this.closeContextMenu());
    menu.add(outsideCatcher);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.98);
    bg.fillRoundedRect(mx, my, menuW, menuH, 5);
    bg.lineStyle(1.5, 0xc8a060, 0.95);
    bg.strokeRoundedRect(mx, my, menuW, menuH, 5);
    menu.add(bg);

    actions.forEach((action, i) => {
      const ry = my + 5 + i * rowH;
      const baseColor = action.color ?? '#d0e8f5';
      const hoverColor = action.hoverColor ?? '#ffe28a';
      const rowBg = this.scene.add.graphics();
      const label = this.scene.add.text(mx + menuW / 2, ry + rowH / 2, action.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: baseColor,
        fontStyle: action.color ? 'bold' : 'normal',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(mx + menuW / 2, ry + rowH / 2, menuW - 10, rowH - 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        rowBg.clear();
        rowBg.fillStyle(0xc8a060, 0.25);
        rowBg.fillRoundedRect(mx + 5, ry, menuW - 10, rowH - 2, 3);
        label.setColor(hoverColor);
      });
      hit.on('pointerout', () => {
        rowBg.clear();
        label.setColor(baseColor);
      });
      hit.on('pointerdown', () => {
        this.closeContextMenu();
        action.run();
      });
      menu.add([rowBg, label, hit]);
    });

    this.add(menu);
    this.contextMenu = menu;
    this.applyFix();
  }

  private closeContextMenu(): void {
    this.contextMenu?.destroy();
    this.contextMenu = undefined;
  }

  /** 버리기/완전제거 확인창 — "정말 버리시겠습니까?" 예/아니오 */
  private confirmDiscard(item: InvItem, all: boolean): void {
    // 쿨러는 내용물(어획/해수·얼음/밑밥)이 있으면 버릴 수 없다 (유실 방지)
    if (item.id === 'inv_cooler'
      && (CoolerStore.count() > 0 || CoolerStore.medium !== 'none' || CoolerStore.chumRemaining > 0)) {
      this.setStatus('쿨러 안에 내용물(어획/해수·얼음/밑밥)이 있어 버릴 수 없습니다 — 먼저 비우세요');
      return;
    }
    const detail = all && item.qty > 1 ? ` (전체 ${item.qty}개)` : all ? '' : ' 1개';
    const dlg = new ConfirmDialog(
      this.scene,
      `정말 버리시겠습니까?\n${item.name}${detail}`,
      () => {
        InventoryStore.removeItem(item.id, all);
        this.setStatus(all
          ? `${item.name}을(를) 완전히 제거했습니다.`
          : `${item.name} 1개를 버렸습니다.`);
        dlg.destroy();
        this.renderGrid();
        this.scene.events.emit('inventory-changed');
      },
      () => dlg.destroy(),
    );
    this.scene.add.existing(dlg);
  }

  // ═══════════════════════════════════════════════════
  // 하단 재화 표시 + 상태 메시지
  // ═══════════════════════════════════════════════════
  private buildFooter(): void {
    this.statusText = this.scene.add.text(PANEL_W / 2, PANEL_H - 66, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fd0e4',
      wordWrap: { width: PANEL_W - 40 }, align: 'center',
    }).setOrigin(0.5);
    this.add(this.statusText);

    const fy = PANEL_H - 44;
    const bar = this.scene.add.graphics();
    bar.fillStyle(0x060d1a, 0.95);
    bar.fillRoundedRect(14, fy, PANEL_W - 28, 32, 4);
    bar.lineStyle(1.5, 0xc8a060, 0.9);
    bar.strokeRoundedRect(14, fy, PANEL_W - 28, 32, 4);
    this.add(bar);

    this.footerText = this.scene.add.text(PANEL_W / 2, fy + 16,
      `보유 재화  ${GameState.player.inventory.coins.toLocaleString()} 원`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffe28a', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.add(this.footerText);
  }

  private setStatus(msg: string): void {
    this.statusText.setText(msg);
    this.footerText.setText(`보유 재화  ${GameState.player.inventory.coins.toLocaleString()} 원`);
  }

  override destroy(fromScene?: boolean): void {
    if (this.keyHandler) {
      this.scene?.input?.keyboard?.off('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
    this.scene?.input?.off('pointermove', this.itemDragMove);
    this.scene?.input?.off('pointerup', this.itemDragUp);
    this.scene?.events?.off('inventory-changed', this.onExternalChange, this);
    this.itemDrag?.ghost?.destroy();
    super.destroy(fromScene);
  }
}
