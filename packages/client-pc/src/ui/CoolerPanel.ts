/**
 * @file CoolerPanel.ts
 * @description 어창(쿨러) 3x3 팝업 — 보관 어획 확인/이송/방생 + 매질(해수/얼음) 관리
 *
 * 1인칭(쿨러 좌측 보관함 클릭)과 탑다운(B 키)에서 공용으로 사용.
 *  - 쿨러 어획은 **자동으로 인벤토리로 이송되지 않는다** — 우클릭 메뉴
 *    '인벤토리로 넣기'로 직접 옮겨야 한다 (이송 시점부터 신선도 시계 재시작).
 *  - 하단 3버튼: 해수 넣기(두레박 보유 + 바다 근처) / 얼음 넣기(대용량 각얼음 소모) /
 *    비우기(매질이 있을 때만). 비활성 버튼은 호버 시 사유 툴팁 표시.
 *  - 타이틀: 쿨러 (매질, 00시 00분 00초) — 해수 잔여 ≤10분이면 빨간 '! 해수 교체 필요'.
 *  - 강제 방생 모드(force): 닫을 수 없고 필요한 수만큼 방생해야 '계속하기' 활성 (현재 미사용).
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { DraggablePanel } from './DraggablePanel.js';
import { ConfirmDialog } from './Dialogs.js';
import { ItemDetailPanel } from './ItemDetailPanel.js';
import { createItemIcon } from './ItemIcon.js';
import {
  CoolerStore, COOLER_CAPACITY, CoolerFish, MEDIUM_LABEL,
} from '../store/CoolerStore.js';
import {
  InvItem, InventoryStore, CONDITION_LABEL, CONDITION_COLOR, CONDITION_NEXT,
} from '../store/InventoryStore.js';

const CELL = 96;
const GAP = 10;
const PANEL_W = CELL * 3 + GAP * 2 + 48;
const PANEL_H = CELL * 3 + GAP * 2 + 206;

/** 00시 00분 00초 표기 */
function pad2(n: number): string { return n < 10 ? `0${n}` : `${n}`; }
function formatHms(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(Math.floor(s / 3600))}시 ${pad2(Math.floor((s % 3600) / 60))}분 ${pad2(s % 60)}초`;
}

export interface CoolerPanelConfig {
  /** 강제 방생 모드 — 닫기 불가, requiredReleases()가 0 이하가 되면 '계속하기' 표시 */
  force?: boolean;
  /** 강제 모드에서 추가로 방생해야 하는 마릿수 계산 (force일 때 필수) */
  requiredReleases?: () => number;
  /** 해수 넣기가 가능한 위치(바다 근처)인가 — 미지정 시 불가 취급 */
  isNearSea?: () => boolean;
  /** 어획 변경(방생/이송) 시 호출 — 씬의 쿨러 카운트 갱신용 */
  onChanged?: () => void;
  onClose: () => void;
  depth?: number;
}

export class CoolerPanel extends DraggablePanel {
  private cfg: CoolerPanelConfig;
  private content!: Phaser.GameObjects.Container;
  private ctxMenu?: Phaser.GameObjects.Container;
  private childPopup?: Phaser.GameObjects.Container;
  private warnText!: Phaser.GameObjects.Text;
  private tooltipText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private tickTimer: Phaser.Time.TimerEvent;
  /** 신선도/매질 변화 감지용 시그니처 — 변하면 그리드 재렌더 */
  private lastSig = '';

  // ── 어획 드래그 앤 드랍 상태 (셀 → 패널 밖 드랍 = 인벤토리 이송) ──
  private dragIdx: number | null = null;
  private dragStart = { x: 0, y: 0 };
  private dragging = false;
  private dragGhost?: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private dragMoveHandler: (p: Phaser.Input.Pointer) => void;
  private dragUpHandler: (p: Phaser.Input.Pointer) => void;

  /** 강제 모드에서 아직 닫을 수 없는 상태인가 (씬 ESC 처리에서 참조) */
  get lockedOpen(): boolean {
    return !!this.cfg.force && (this.cfg.requiredReleases?.() ?? 0) > 0;
  }

  constructor(scene: Phaser.Scene, cfg: CoolerPanelConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2,
      y: (GAME_HEIGHT - PANEL_H) / 2 - 20,
      width: PANEL_W, height: PANEL_H,
      title: cfg.force ? '어창 — 방생 필요!' : '쿨러',
      onClose: () => { if (!this.lockedOpen) cfg.onClose(); },
      // 비모달 (dim 없음) — 인벤토리(I)와 동시에 열어 슬롯 정리 후 이송 가능.
      // depth는 InventoryPanel(800)과 동일 — 클릭 시 bringToTop으로 상호 전환
      dim: false, depth: cfg.depth ?? 800,
      hideClose: cfg.force,
    });
    this.cfg = cfg;
    this.content = scene.add.container(0, 0);
    this.add(this.content);

    // 어획 드래그 앤 드랍 (씬 레벨 포인터 — 패널 밖 드랍 = 인벤토리 이송)
    this.dragMoveHandler = (p) => this.onDragMove(p);
    this.dragUpHandler = (p) => this.onDragUp(p);
    scene.input.on('pointermove', this.dragMoveHandler);
    scene.input.on('pointerup', this.dragUpHandler);

    // 타이틀 우측 경고 (해수 교체 필요) — 타이틀 폭에 맞춰 위치 갱신
    this.warnText = scene.add.text(0, 16, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ff5a4a', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add(this.warnText);

    // 비활성 버튼 호버 툴팁 (버튼 행 위)
    this.tooltipText = scene.add.text(PANEL_W / 2, 0, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffce9a', fontStyle: 'bold',
      backgroundColor: '#2a1410ee', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setVisible(false);

    // 하단 상태 메시지 (이송 실패 등)
    this.statusText = scene.add.text(PANEL_W / 2, PANEL_H - 16, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fd0e4',
    }).setOrigin(0.5);
    this.add(this.statusText);

    // 1초 주기 — 타이틀/경고 갱신 + 상태 변화 시 그리드 재렌더
    this.tickTimer = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() });

    this.renderBody();
    this.updateHeader();
  }

  // ═══════════════════════════════════════════════════
  // 주기 갱신 (타이틀·경고·상태 변화 감지)
  // ═══════════════════════════════════════════════════
  private tick(): void {
    CoolerStore.sync();
    this.updateHeader();
    const sig = this.stateSig();
    if (sig !== this.lastSig) this.renderBody();
  }

  private stateSig(): string {
    const cells = CoolerStore.slots.map((s) => (s ? s.condition : '-')).join(',');
    return `${cells}|${CoolerStore.medium}|${CoolerStore.mediumRemainMs() > 0 ? 'on' : 'off'}`;
  }

  /** 타이틀 '쿨러 (매질, 00시 00분 00초)' + 해수 교체 경고 갱신 */
  private updateHeader(): void {
    if (this.cfg.force) return;   // 강제 모드는 고정 타이틀
    const med = CoolerStore.medium;
    if (med === 'none') {
      this.setTitle(`쿨러 (${MEDIUM_LABEL.none})`);
    } else {
      this.setTitle(`쿨러 (${MEDIUM_LABEL[med]}, ${formatHms(CoolerStore.mediumRemainMs())})`);
    }
    const warn = CoolerStore.needsSeawaterSwap();
    this.warnText.setText(warn ? '! 해수 교체 필요' : '');
    this.warnText.setX(14 + this.titleText.width + 10);
  }

  // ═══════════════════════════════════════════════════
  // 본문 렌더 (안내/그리드/버튼)
  // ═══════════════════════════════════════════════════
  private renderBody(): void {
    this.closeCtxMenu();
    this.content.removeAll(true);
    this.lastSig = this.stateSig();

    const need = this.cfg.force ? (this.cfg.requiredReleases?.() ?? 0) : 0;

    // 상단 안내 줄 — 매질 상태별 규칙 설명
    const info = this.scene.add.text(PANEL_W / 2, this.contentTop + 10,
      this.cfg.force
        ? (need > 0
          ? `인벤토리 공간 부족 — ${need}마리 이상 방생해야 합니다`
          : '방생 완료 — 계속 진행할 수 있습니다')
        : `보관 ${CoolerStore.count()} / ${COOLER_CAPACITY}마리 · ${this.mediumInfoLine()}`,
      {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', fontStyle: 'bold',
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
      // 신선도 배지 (점 + 상태 라벨)
      const condColor = CONDITION_COLOR[fish.condition];
      const dot = this.scene.add.graphics();
      dot.fillStyle(Phaser.Display.Color.HexStringToColor(condColor).color, 1);
      dot.fillCircle(cx + 10, cy + 10, 4);
      const condLbl = this.scene.add.text(cx + 18, cy + 10, CONDITION_LABEL[fish.condition], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: condColor, fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.content.add([nm, sz, dot, condLbl]);

      const hit = this.scene.add.rectangle(cx + CELL / 2, cy + CELL / 2, CELL, CELL, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
        // 우클릭 = 즉시 컨텍스트 메뉴 / 좌클릭 = 드래그 시작 후보
        //  (드래그 없이 떼면 메뉴 — 좌클릭 접근성 유지, 드래그하면 인벤토리 이송)
        if (p.rightButtonDown()) {
          this.openCtxMenu(i, p.x - this.x, p.y - this.y);
          return;
        }
        this.dragIdx = i;
        this.dragStart = { x: p.x, y: p.y };
        this.dragging = false;
      });
      this.content.add(hit);
    }

    // 하단: 매질 버튼 3개 (일반 모드) / 강제 모드 진행 버튼
    if (this.cfg.force) {
      if (need <= 0) {
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
      }
    } else {
      this.buildMediumButtons(gy + 3 * CELL + 2 * GAP + 12);
      const tip = this.scene.add.text(PANEL_W / 2, PANEL_H - 30, '우클릭: 상세/이송/방생 · 패널 밖으로 드래그: 인벤토리 이송', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
      }).setOrigin(0.5);
      this.content.add(tip);
    }

    // 툴팁은 항상 최상단 유지
    this.remove(this.tooltipText);
    this.add(this.tooltipText);
    this.applyFix();
  }

  /** 매질 상태 안내 문구 */
  private mediumInfoLine(): string {
    const med = CoolerStore.medium;
    const expired = med !== 'none' && CoolerStore.mediumRemainMs() <= 0;
    if (med === 'none') return '해수/얼음 없음 — 상온과 동일하게 신선도 진행';
    if (med === 'seawater') {
      return expired ? '해수 효과 종료 — 비우고 새 해수를 채우세요' : '해수 물칸 — 활어 무제한 유지';
    }
    return expired ? '얼음이 녹음 — 비우고 새 얼음을 채우세요' : '얼음 보냉 — 활어 1시간 유지, 이후 신선 정지';
  }

  // ═══════════════════════════════════════════════════
  // 하단 매질 버튼 (해수 넣기 / 얼음 넣기 / 비우기)
  // ═══════════════════════════════════════════════════
  private buildMediumButtons(by: number): void {
    const hasBucket = !!InventoryStore.find('inv_bucket');
    const iceItem = InventoryStore.find('inv_ice_bulk');
    const hasIce = !!iceItem && iceItem.qty > 0;
    const nearSea = this.cfg.isNearSea?.() ?? false;
    const hasMedium = CoolerStore.medium !== 'none';

    // 비활성 사유 (해수: 두레박 → 바다 근처 → 비우기 순으로 안내)
    const seaReason = !hasBucket ? "'낚시용 두레박'(기타)이 필요합니다"
      : !nearSea ? '바다 근처에서만 가능합니다'
        : hasMedium ? '먼저 비우기가 필요합니다' : '';
    const iceReason = !hasIce ? "'대용량 각얼음'(소모품)이 필요합니다"
      : hasMedium ? '먼저 비우기가 필요합니다' : '';
    const emptyReason = hasMedium ? '' : '비울 해수/얼음이 없습니다';

    const bw = 100, bh = 36, gap = 8;
    const startX = PANEL_W / 2 - (bw * 3 + gap * 2) / 2;
    this.tooltipText.setY(by - 16);

    this.makeMediumButton(startX, by, bw, bh, '해수 넣기', seaReason === '', seaReason, () => {
      if (CoolerStore.addSeawater()) {
        this.setStatus('해수를 채웠습니다 — 활어 무제한 유지 (1시간)');
        this.renderBody(); this.updateHeader();
      }
    });
    this.makeMediumButton(startX + bw + gap, by, bw, bh, '얼음 넣기', iceReason === '', iceReason, () => {
      // 클릭과 동시에 인벤토리 소모품 '대용량 각얼음' 1개 소모
      if (!InventoryStore.removeQty('inv_ice_bulk', 1)) return;
      if (CoolerStore.addIce()) {
        this.setStatus('얼음을 채웠습니다 — 보냉 유지 (2시간)');
        this.renderBody(); this.updateHeader();
      }
    });
    this.makeMediumButton(startX + (bw + gap) * 2, by, bw, bh, '비우기', emptyReason === '', emptyReason, () => {
      CoolerStore.emptyMedium();
      this.setStatus('쿨러를 비웠습니다.');
      this.renderBody(); this.updateHeader();
    });
  }

  private makeMediumButton(
    bx: number, by: number, bw: number, bh: number,
    label: string, enabled: boolean, disabledReason: string, onClick: () => void,
  ): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(enabled ? 0x14425e : 0x101a26, 0.95);
    bg.fillRoundedRect(bx, by, bw, bh, 5);
    bg.lineStyle(1.5, enabled ? 0x33b0e0 : 0x2a3846, 0.95);
    bg.strokeRoundedRect(bx, by, bw, bh, 5);
    const txt = this.scene.add.text(bx + bw / 2, by + bh / 2, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', fontStyle: 'bold',
      color: enabled ? '#aee8ff' : '#546a7c',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: enabled });
    if (enabled) {
      hit.on('pointerover', () => txt.setColor('#ffffff'));
      hit.on('pointerout', () => txt.setColor('#aee8ff'));
      hit.on('pointerdown', onClick);
    } else {
      // 비활성 버튼 — 호버 시 사유 툴팁
      hit.on('pointerover', () => {
        this.tooltipText.setText(disabledReason).setVisible(true);
        this.applyFix();
      });
      hit.on('pointerout', () => this.tooltipText.setVisible(false));
    }
    this.content.add([bg, txt, hit]);
  }

  private setStatus(msg: string): void {
    this.statusText.setText(msg);
    this.scene.time.delayedCall(2600, () => {
      if (this.statusText.active) this.statusText.setText('');
    });
  }

  /** 쿨러 개체 → 상세보기/아이콘용 임시 InvItem 뷰 모델 */
  private toInvItem(idx: number, f: CoolerFish): InvItem {
    return {
      id: `cooler_view_${idx}`,
      name: `${f.nameKo} (${f.lengthCm}cm)`,
      icon: '🐟', iconTexture: f.iconTexture,
      category: 'food', subCategory: '어획물', slot: 0, qty: 1,
      basePrice: Math.max(2000, Math.round(f.weightG * 12)),
      condition: f.condition, equippable: false,
      speciesId: f.speciesId, lengthCm: f.lengthCm, weightG: f.weightG,
    };
  }

  // ── 컨텍스트 메뉴 (상세보기/인벤토리로 넣기/방생하기/손질하기) ─────────
  private openCtxMenu(idx: number, localX: number, localY: number): void {
    this.closeCtxMenu();
    const fish = CoolerStore.get(idx);
    if (!fish) return;

    // 헤더 정보 — 현재 상태 + 다음 단계까지 남은 시간 (정지 = 무제한)
    const remain = CoolerStore.fishRemainMs(fish);
    const next = CONDITION_NEXT[fish.condition];
    const headerInfo = next
      ? `${CONDITION_LABEL[fish.condition]} → ${CONDITION_LABEL[next]}까지 ${remain === null ? '무제한' : formatHms(remain)}`
      : `${CONDITION_LABEL[fish.condition]} (종착 상태)`;

    const mw = 176, rowH = 30, headerH = 24;
    const rows: { label: string; enabled: boolean; onClick?: () => void }[] = [
      { label: '상세보기', enabled: true, onClick: () => this.openDetail(idx, fish) },
      { label: '인벤토리로 넣기', enabled: true, onClick: () => this.transferToInventory(idx) },
      { label: '방생하기', enabled: true, onClick: () => this.confirmRelease(idx, fish) },
      { label: '손질하기 (준비중)', enabled: false },
    ];
    const mh = rows.length * rowH + headerH + 10;
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

    const header = this.scene.add.text(mw / 2, 4 + headerH / 2, headerInfo, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px',
      color: CONDITION_COLOR[fish.condition], fontStyle: 'bold',
    }).setOrigin(0.5);
    menu.add(header);

    rows.forEach((row, r) => {
      const ry = headerH + 6 + r * rowH + rowH / 2;
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

  // ── 어획 드래그 앤 드랍 — 셀을 잡아 패널 밖(열린 인벤토리 등)에 놓으면 이송 ──
  private onDragMove(p: Phaser.Input.Pointer): void {
    if (this.dragIdx === null) return;
    if (!this.dragging) {
      if (Math.hypot(p.x - this.dragStart.x, p.y - this.dragStart.y) < 10) return;
      const fish = CoolerStore.get(this.dragIdx);
      if (!fish) { this.dragIdx = null; return; }
      this.dragging = true;
      this.dragGhost = createItemIcon(this.scene, p.x, p.y, this.toInvItem(this.dragIdx, fish), 48);
      this.dragGhost.setDepth(1500).setScrollFactor(0).setAlpha(0.85);
    }
    this.dragGhost?.setPosition(p.x, p.y);
  }

  private onDragUp(p: Phaser.Input.Pointer): void {
    if (this.dragIdx === null) return;
    const idx = this.dragIdx;
    this.dragIdx = null;
    if (this.dragging) {
      this.dragging = false;
      this.dragGhost?.destroy();
      this.dragGhost = undefined;
      // 패널 안에서 놓으면 취소 — 밖(인벤토리 패널 등)에 놓으면 이송 시도
      const inside = p.x >= this.x && p.x <= this.x + PANEL_W && p.y >= this.y && p.y <= this.y + PANEL_H;
      if (!inside) this.transferToInventory(idx);
      return;
    }
    // 드래그 없이 뗀 좌클릭 — 컨텍스트 메뉴 (기존 접근성 유지)
    this.openCtxMenu(idx, p.x - this.x, p.y - this.y);
  }

  /**
   * 어창 → 인벤토리(음식 탭) 이송 — 현재 신선도 상태 그대로,
   * 신선도 시계는 이송 시점부터 재시작 (해수 활어 → 인벤에서 10분 카운트).
   */
  private transferToInventory(idx: number): void {
    const f = CoolerStore.get(idx);
    if (!f) return;
    const ok = InventoryStore.addItem({
      id: `inv_catch_${f.speciesId}_${InventoryStore.nextCatchSeq()}`,
      name: `${f.nameKo} (${f.lengthCm}cm)`,
      icon: '🐟', iconTexture: f.iconTexture,
      category: 'food', subCategory: '어획물',
      basePrice: Math.max(2000, Math.round(f.weightG * 12)),
      condition: f.condition, equippable: false,
      speciesId: f.speciesId, lengthCm: f.lengthCm, weightG: f.weightG,
    }, 1);
    if (!ok) {
      this.setStatus('인벤토리(음식) 공간이 없습니다 — 자리를 비우고 다시 시도하세요');
      return;
    }
    CoolerStore.removeAt(idx);
    this.setStatus(`${f.nameKo}을(를) 인벤토리로 옮겼습니다.`);
    this.cfg.onChanged?.();
    this.renderBody();
  }

  private openDetail(idx: number, fish: CoolerFish): void {
    this.childPopup?.destroy();
    const panel = new ItemDetailPanel(
      this.scene, this.toInvItem(idx, fish),
      this.x + 60, this.y + 40,
      () => { panel.destroy(); this.childPopup = undefined; },
      // 쿨러 개체는 매질 규칙 기반 남은 시간 (null = 무제한 표기)
      () => {
        const cur = CoolerStore.get(idx);
        return cur ? CoolerStore.fishRemainMs(cur) : null;
      },
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
    this.scene?.input?.off('pointermove', this.dragMoveHandler);
    this.scene?.input?.off('pointerup', this.dragUpHandler);
    this.dragGhost?.destroy();
    this.tickTimer.remove();
    this.closeCtxMenu();
    this.childPopup?.destroy();
    this.tooltipText.destroy();
    super.destroy(fromScene);
  }
}
