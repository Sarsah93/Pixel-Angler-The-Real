/**
 * @file UtilizationPanel.ts
 * @description 활용 창 (U 키 — 전체 화면 전환 상태, 상단 탭: 요리하기 / 채비하기)
 *
 * 채비하기(Tackles):
 *  실제 바다낚시 채비 순서 [원줄 → 면사매듭 → 구멍찌/수중찌 → 도래 → 목줄 → 봉돌 → 바늘&미끼]
 *  대로 소켓을 클릭해 인벤토리의 부품을 조립한다. 면사매듭은 수심 한계(Z_limit)를
 *  -/+ 로 조절하며, 조립 스펙(총 무게/침강 속도/최대 공략 수심)이 실시간 합산된다.
 *  (낚싯대 우클릭 → '채비하기' 로도 진입)
 *
 * 요리하기(Cooking):
 *  도마 위 생선 손질(삼면뜨기) 시스템 자리 — 회칼(장비) 필요. 추후 정식 구현 예정.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import {
  InventoryStore, InvItem, InvCategory, RigStepKey,
  CATEGORY_LABEL, CONDITION_LABEL, CONDITION_COLOR,
  isHookItem, isBaitItem, isLureItem,
} from '../store/InventoryStore.js';
import { DraggablePanel } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';

export type UtilizationTab = 'cooking' | 'tackles';

const PANEL_W = 1080;
const PANEL_H = 620;

/**
 * 채비 단계 정의 — matcher로 인벤토리 부품 필터.
 * 2026-07-16: 바늘 & 미끼 통합 소켓을 [바늘/루어] → [미끼] 2소켓으로 분리.
 * 바늘 소켓에 루어(미노우 등 바늘 일체형 가짜미끼)를 달면 미끼 소켓은 비활성화.
 */
const RIG_STEPS: { key: RigStepKey; label: string; matcher: ((i: InvItem) => boolean) | null }[] = [
  { key: 'mainLine',  label: '원줄',        matcher: (i) => i.subCategory === '원줄 스풀' },
  { key: 'floatStop', label: '면사매듭',    matcher: null },   // 수심 한계 조절 전용
  { key: 'float',     label: '구멍찌/수중찌', matcher: (i) => i.subCategory === '채비 부속' && i.name.includes('찌') },
  { key: 'swivel',    label: '도래',        matcher: (i) => i.subCategory === '채비 부속' && i.name.includes('도래') },
  { key: 'leader',    label: '목줄',        matcher: (i) => i.subCategory === '목줄 스풀' },
  { key: 'sinker',    label: '봉돌',        matcher: (i) => i.subCategory === '채비 부속' && i.name.includes('봉돌') },
  { key: 'hook',      label: '바늘/루어',   matcher: isHookItem },
  { key: 'bait',      label: '미끼',        matcher: isBaitItem },
];

/** 소켓 8개가 PANEL_W(1080) 안에 들어가도록 축소 배치 */
const SOCKET_W = 110;
const SOCKET_H = 132;
const SOCKET_GAP = 12;

export class UtilizationPanel extends DraggablePanel {
  private currentTab: UtilizationTab;
  private tabBgs = new Map<UtilizationTab, Phaser.GameObjects.Graphics>();
  private tabTexts = new Map<UtilizationTab, Phaser.GameObjects.Text>();
  private bodyContainer!: Phaser.GameObjects.Container;
  private chooser?: Phaser.GameObjects.Container;
  /** 요리 탭 임베드 인벤토리 — 현재 카테고리/선택 아이템 */
  private cookInvCat: InvCategory = 'food';
  private cookSelectedId: string | null = null;

  constructor(scene: Phaser.Scene, onClose: () => void, initialTab: UtilizationTab = 'tackles') {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2,
      y: (GAME_HEIGHT - PANEL_H) / 2,
      width: PANEL_W, height: PANEL_H,
      title: '활용 (Utilization)',
      onClose, dim: true, depth: 840,
    });
    this.currentTab = initialTab;

    this.buildTabs();
    this.bodyContainer = scene.add.container(0, 0);
    this.add(this.bodyContainer);
    this.renderBody();
  }

  // ── 상단 탭 (요리하기 / 채비하기) ─────────────────────
  private buildTabs(): void {
    const defs: { id: UtilizationTab; label: string }[] = [
      { id: 'cooking', label: '요리하기 (Cooking)' },
      { id: 'tackles', label: '채비하기 (Tackles)' },
    ];
    const tabW = 180, tabH = 34;
    const ty = this.contentTop + 4;

    defs.forEach((def, i) => {
      const tx = 20 + i * (tabW + 8);
      const g = this.scene.add.graphics();
      this.tabBgs.set(def.id, g);
      const t = this.scene.add.text(tx + tabW / 2, ty + tabH / 2, def.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#8faabf',
      }).setOrigin(0.5);
      this.tabTexts.set(def.id, t);
      const hit = this.scene.add.rectangle(tx + tabW / 2, ty + tabH / 2, tabW, tabH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.currentTab = def.id;
        this.closeChooser();
        this.paintTabs();
        this.renderBody();
      });
      this.add([g, t, hit]);
    });
    this.paintTabs();
  }

  private paintTabs(): void {
    const tabW = 180, tabH = 34;
    const ty = this.contentTop + 4;
    (['cooking', 'tackles'] as UtilizationTab[]).forEach((id, i) => {
      const tx = 20 + i * (tabW + 8);
      const g = this.tabBgs.get(id)!;
      const selected = id === this.currentTab;
      g.clear();
      g.fillStyle(selected ? 0x155a7c : 0x0e1c2d, selected ? 0.98 : 0.9);
      g.fillRoundedRect(tx, ty, tabW, tabH, 4);
      g.lineStyle(1.5, selected ? 0x5cd0ff : 0x1f3d5a, 0.95);
      g.strokeRoundedRect(tx, ty, tabW, tabH, 4);
      this.tabTexts.get(id)!.setColor(selected ? '#aee8ff' : '#8faabf');
    });
  }

  private renderBody(): void {
    this.bodyContainer.removeAll(true);
    if (this.currentTab === 'tackles') this.renderTackles();
    else this.renderCooking();
    this.applyFix();
  }

  // ═══════════════════════════════════════════════════
  // 채비하기 (Tackles)
  // ═══════════════════════════════════════════════════
  private renderTackles(): void {
    const top = this.contentTop + 56;

    const guide = this.scene.add.text(24, top,
      '조립 순서대로 소켓을 클릭해 부품을 선택하세요. 면사매듭 위치는 채비가 도달할 최대 수심(Z_limit)을 결정합니다.', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fc0d4',
      });
    this.bodyContainer.add(guide);

    // ── 조립 체인 소켓 ──
    const boxW = SOCKET_W, boxH = SOCKET_H, gap = SOCKET_GAP;
    const chainY = top + 46;
    // 루어 장착 시 미끼 소켓 비활성 (바늘 일체형 가짜미끼 — 미끼 불필요)
    const baitDisabled = !InventoryStore.hookNeedsBait();
    RIG_STEPS.forEach((step, i) => {
      const bx = 24 + i * (boxW + gap);
      const disabled = step.key === 'bait' && baitDisabled;

      const box = this.scene.add.graphics();
      const assignedId = InventoryStore.rig[step.key];
      const assigned = assignedId ? InventoryStore.find(assignedId) : undefined;
      const isKnot = step.matcher === null;

      box.fillStyle(disabled ? 0x101820 : assigned || isKnot ? 0x0e2a1e : 0x0e1c2d, 0.95);
      box.fillRoundedRect(bx, chainY, boxW, boxH, 5);
      box.lineStyle(1.5, disabled ? 0x2a3642 : assigned || isKnot ? 0x2f7d5a : 0x2a5a8a, 0.95);
      box.strokeRoundedRect(bx, chainY, boxW, boxH, 5);
      this.bodyContainer.add(box);

      const stepLbl = this.scene.add.text(bx + boxW / 2, chainY + 14, step.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
        color: disabled ? '#556570' : '#c8a060', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.bodyContainer.add(stepLbl);

      // 화살표
      if (i < RIG_STEPS.length - 1) {
        const arrow = this.scene.add.text(bx + boxW + gap / 2, chainY + boxH / 2, '→', {
          fontSize: '16px', color: '#4a6a8a',
        }).setOrigin(0.5);
        this.bodyContainer.add(arrow);
      }

      // 미끼 소켓 비활성 — 클릭 불가 안내만 표시하고 종료
      if (disabled) {
        const lure = this.scene.add.text(bx + boxW / 2, chainY + 58, '—', {
          fontFamily: 'monospace', fontSize: '26px', color: '#3a4a58',
        }).setOrigin(0.5);
        const why = this.scene.add.text(bx + boxW / 2, chainY + 88, '루어 장착 중\n미끼 불필요', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#556570', align: 'center',
        }).setOrigin(0.5, 0);
        this.bodyContainer.add([lure, why]);
        return;
      }

      if (isKnot) {
        // 면사매듭: 수심 한계 조절 (-/+)
        const depthTxt = this.scene.add.text(bx + boxW / 2, chainY + 58, `${InventoryStore.rigDepthLimitM} m`, {
          fontFamily: 'monospace', fontSize: '20px', color: '#4af2a1', fontStyle: 'bold',
        }).setOrigin(0.5);
        const sub = this.scene.add.text(bx + boxW / 2, chainY + 82, '최대 공략 수심', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
        }).setOrigin(0.5);
        this.bodyContainer.add([depthTxt, sub]);

        const mkBtn = (bxx: number, label: string, delta: number): void => {
          const btnBg = this.scene.add.graphics();
          btnBg.fillStyle(0x155a7c, 0.95);
          btnBg.fillRoundedRect(bxx, chainY + 96, 40, 24, 4);
          const btnTxt = this.scene.add.text(bxx + 20, chainY + 108, label, {
            fontFamily: 'monospace', fontSize: '14px', color: '#aee8ff', fontStyle: 'bold',
          }).setOrigin(0.5);
          const btnHit = this.scene.add.rectangle(bxx + 20, chainY + 108, 40, 24, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true });
          btnHit.on('pointerdown', () => {
            InventoryStore.rigDepthLimitM = Phaser.Math.Clamp(InventoryStore.rigDepthLimitM + delta, 1, 30);
            this.renderBody();
          });
          this.bodyContainer.add([btnBg, btnTxt, btnHit]);
        };
        mkBtn(bx + 14, '-', -1);
        mkBtn(bx + boxW - 54, '+', 1);
        return;
      }

      if (assigned) {
        const icon = this.scene.add.text(bx + boxW / 2, chainY + 58, assigned.icon, { fontSize: '26px' }).setOrigin(0.5);
        const name = this.scene.add.text(bx + boxW / 2, chainY + 88, assigned.name, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#e8f4fd',
          wordWrap: { width: boxW - 12 }, align: 'center',
        }).setOrigin(0.5, 0);
        this.bodyContainer.add([icon, name]);
      } else {
        const plus = this.scene.add.text(bx + boxW / 2, chainY + 64, '+', {
          fontFamily: 'monospace', fontSize: '30px', color: '#4a6a8a',
        }).setOrigin(0.5);
        const hintTxt = this.scene.add.text(bx + boxW / 2, chainY + 96, '클릭하여 선택', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#4a6a8a',
        }).setOrigin(0.5);
        this.bodyContainer.add([plus, hintTxt]);
      }

      const hit = this.scene.add.rectangle(bx + boxW / 2, chainY + boxH / 2, boxW, boxH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.openChooser(step.key, step.label, step.matcher!, bx, chainY + boxH + 8));
      this.bodyContainer.add(hit);
    });

    // ── 조립 스펙 요약 ──
    const sumY = chainY + boxH + 40;
    const sumBg = this.scene.add.graphics();
    sumBg.fillStyle(0x060d1a, 0.95);
    sumBg.fillRoundedRect(24, sumY, PANEL_W - 48, 150, 5);
    sumBg.lineStyle(1.5, 0xc8a060, 0.9);
    sumBg.strokeRoundedRect(24, sumY, PANEL_W - 48, 150, 5);
    this.bodyContainer.add(sumBg);

    const sumTitle = this.scene.add.text(40, sumY + 12, '채비 물리 스펙 (실시간 합산)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffe28a', fontStyle: 'bold',
    });
    this.bodyContainer.add(sumTitle);

    const spec = this.computeRigSpec();
    const lines = [
      `총 무게: ${spec.weightG.toFixed(2)} g`,
      `부력 합: ${spec.buoyG.toFixed(2)} g 상당`,
      `침강 속도 (V_z): ${spec.sinkMps.toFixed(2)} m/s`,
      `공기 저항 계수 (C_d): ${spec.dragCd.toFixed(2)}`,
      `최대 공략 수심 (Z_limit): ${InventoryStore.rigDepthLimitM} m`,
    ];
    lines.forEach((line, i) => {
      const t = this.scene.add.text(40 + Math.floor(i / 3) * 340, sumY + 40 + (i % 3) * 24, line, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#d0e8f5',
      });
      this.bodyContainer.add(t);
    });

    const advice = this.scene.add.text(40, sumY + 118, spec.advice, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7fe6b0',
    });
    this.bodyContainer.add(advice);
  }

  /** 조립 부품 기반 물리 스펙 계산 (목업 수치) */
  private computeRigSpec(): { weightG: number; buoyG: number; sinkMps: number; dragCd: number; advice: string } {
    let weightG = 0;
    let buoyG = 0;
    const rig = InventoryStore.rig;

    const partWeight = (id: string | null): void => {
      if (!id) return;
      const item = InventoryStore.find(id);
      if (!item) return;
      if (item.name.includes('봉돌')) weightG += 0.31;          // G2
      else if (item.name.includes('수중찌')) weightG += 8;       // -0.8호 침력
      else if (item.name.includes('구멍찌')) buoyG += 8;         // 0.8호 부력
      else if (isLureItem(item)) {
        // 루어 자중 (이름 기반 목업 — 메탈지그는 g 표기, 미노우는 9g 상당)
        const m = item.name.match(/(\d+)\s*g/);
        weightG += m ? Number(m[1]) : 9;
      }
      else if (item.subCategory === '바늘/훅') weightG += 0.5;
      else if (isBaitItem(item)) weightG += 1.2;
      else if (item.name.includes('도래')) weightG += 0.3;
    };
    (Object.keys(rig) as RigStepKey[]).forEach((k) => partWeight(rig[k]));

    const net = weightG - buoyG;
    const sinkMps = Math.max(0, net * 0.03);
    const dragCd = 0.4 + weightG * 0.01;

    let advice: string;
    const missing = InventoryStore.getMissingRigParts();
    if (missing.length > 0) advice = `필수 소켓이 비었습니다: ${missing.join(', ')} — 채워야 캐스팅할 수 있습니다.`;
    else if (!InventoryStore.hookNeedsBait()) advice = '루어 채비입니다 — 미끼 없이 캐스팅 가능하며, 입질 시 미끼가 소모되지 않습니다.';
    else if (net < 0) advice = '부력이 무게보다 큽니다 — 채비가 상층에 뜹니다 (상층 어종 공략).';
    else if (sinkMps < 0.1) advice = '침강이 느립니다. 깊은 수심 공략 시 봉돌을 추가하세요. (강풍 시 무거운 봉돌 추천)';
    else advice = '균형 잡힌 채비입니다. 면사매듭 수심을 포인트 수심대에 맞추세요.';

    return { weightG, buoyG, sinkMps, dragCd, advice };
  }

  /** 부품 선택 리스트 팝업 */
  private openChooser(step: RigStepKey, label: string, matcher: (i: InvItem) => boolean, x: number, y: number): void {
    this.closeChooser();

    const candidates = InventoryStore.items.filter(matcher);
    const rowH = 30;
    const listW = 240;
    const listH = Math.max(1, candidates.length + 1) * rowH + 34;
    const lx = Math.min(x, PANEL_W - listW - 16);
    const ly = Math.min(y, PANEL_H - listH - 10);

    const c = this.scene.add.container(0, 0);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.98);
    bg.fillRoundedRect(lx, ly, listW, listH, 5);
    bg.lineStyle(1.5, 0x5cd0ff, 0.95);
    bg.strokeRoundedRect(lx, ly, listW, listH, 5);
    c.add(bg);

    const title = this.scene.add.text(lx + 12, ly + 8, `${label} 선택`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#aee8ff', fontStyle: 'bold',
    });
    c.add(title);

    const addRow = (i: number, text: string, onPick: () => void): void => {
      const ry = ly + 28 + i * rowH;
      const rowTxt = this.scene.add.text(lx + 14, ry + rowH / 2, text, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#d0e8f5',
      }).setOrigin(0, 0.5);
      const rowHit = this.scene.add.rectangle(lx + listW / 2, ry + rowH / 2, listW - 8, rowH - 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      rowHit.on('pointerover', () => rowTxt.setColor('#ffe28a'));
      rowHit.on('pointerout', () => rowTxt.setColor('#d0e8f5'));
      rowHit.on('pointerdown', () => { onPick(); this.closeChooser(); this.renderBody(); });
      c.add([rowTxt, rowHit]);
    };

    if (candidates.length === 0) {
      const none = this.scene.add.text(lx + 14, ly + 40, '사용 가능한 부품이 없습니다', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#607b8e',
      });
      c.add(none);
      addRow(1, '닫기', () => { /* 선택 없음 */ });
    } else {
      candidates.forEach((item, i) => {
        addRow(i, `${item.icon} ${item.name} (x${item.qty})`, () => InventoryStore.setRigPart(step, item.id));
      });
      addRow(candidates.length, '비우기', () => InventoryStore.setRigPart(step, null));
    }

    this.add(c);
    this.chooser = c;
    this.applyFix();
  }

  private closeChooser(): void {
    this.chooser?.destroy();
    this.chooser = undefined;
  }

  // ═══════════════════════════════════════════════════
  // 요리하기 (Cooking) — 손질 시스템 자리 (추후 정식 구현)
  // ═══════════════════════════════════════════════════
  private renderCooking(): void {
    const top = this.contentTop + 56;

    // ── 좌측: 도마 (손질 작업대) ──────────────────────────
    const boardX = 40, boardY = top + 44, boardW = 480, boardH = 240;
    const board = this.scene.add.graphics();
    board.fillStyle(0x8a6a44, 1);
    board.fillRoundedRect(boardX, boardY, boardW, boardH, 12);
    board.fillStyle(0xa8845a, 1);
    board.fillRoundedRect(boardX + 12, boardY + 12, boardW - 24, boardH - 24, 10);
    board.lineStyle(2, 0x5a4028, 1);
    board.strokeRoundedRect(boardX, boardY, boardW, boardH, 12);
    this.bodyContainer.add(board);

    const boardLbl = this.scene.add.text(boardX + boardW / 2, boardY + boardH / 2, '도마 (생선을 올려 손질)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#5a4028', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.bodyContainer.add(boardLbl);

    const hasKnife = false; // 회칼 장비 아이템 추가 예정
    const lines = [
      '생선 손질(삼면뜨기) 시스템은 추후 정식 구현 예정입니다.',
      '',
      `회칼 장비 상태: ${hasKnife ? '장비됨' : '미보유 — 회칼(장비)을 착용해야 손질할 수 있습니다'}`,
      '· 우측 인벤토리의 생선을 도마에 올리는 상호작용 예정',
      '· 신선도에 따라 요리 결과/버프(근력 1.5배 등)가 달라집니다',
    ];
    const info = this.scene.add.text(boardX, boardY + boardH + 26, lines.join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#9fc0d4',
      lineSpacing: 6, wordWrap: { width: boardW },
    });
    this.bodyContainer.add(info);

    // ── 우측: 종속 인벤토리 (요리 창에 임베드 — 별도 드래그 창 아님) ──
    this.renderEmbeddedInventory(560, top, PANEL_W - 560 - 24);
  }

  /** 요리 탭에 임베드되는 인벤토리 뷰 — InventoryStore를 직접 읽는 읽기 전용 그리드 */
  private renderEmbeddedInventory(x: number, y: number, w: number): void {
    const h = 470;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060d1a, 0.95);
    bg.fillRoundedRect(x, y, w, h, 6);
    bg.lineStyle(1.5, 0x2a5a8a, 0.9);
    bg.strokeRoundedRect(x, y, w, h, 6);
    this.bodyContainer.add(bg);

    const title = this.scene.add.text(x + 14, y + 10, '인벤토리', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffe28a', fontStyle: 'bold',
    });
    this.bodyContainer.add(title);

    // 카테고리 탭 (음식이 기본 — 요리 재료)
    const cats: InvCategory[] = ['food', 'consumable', 'tackle', 'etc'];
    const tabY = y + 34;
    let tabX = x + 14;
    cats.forEach((cat) => {
      const selected = cat === this.cookInvCat;
      const label = CATEGORY_LABEL[cat];
      const tw = label.length * 13 + 22;
      const tg = this.scene.add.graphics();
      tg.fillStyle(selected ? 0x155a7c : 0x0e1c2d, 0.95);
      tg.fillRoundedRect(tabX, tabY, tw, 24, 4);
      tg.lineStyle(1, selected ? 0x5cd0ff : 0x2a5a8a, 0.9);
      tg.strokeRoundedRect(tabX, tabY, tw, 24, 4);
      const tt = this.scene.add.text(tabX + tw / 2, tabY + 12, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
        color: selected ? '#aee8ff' : '#8faabf',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(tabX + tw / 2, tabY + 12, tw, 24, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this.cookInvCat = cat; this.renderBody(); });
      this.bodyContainer.add([tg, tt, hit]);
      tabX += tw + 8;
    });

    // 5x5 소켓 그리드 (읽기 전용 — 아이템 클릭 시 하단에 선택 표시)
    const cell = 66, gap = 6;
    const gridX = x + Math.floor((w - (cell * 5 + gap * 4)) / 2);
    const gridY = tabY + 36;
    const items = InventoryStore.getByCategory(this.cookInvCat);
    for (let s = 0; s < 25; s++) {
      const cx = gridX + (s % 5) * (cell + gap);
      const cy = gridY + Math.floor(s / 5) * (cell + gap);
      const item = items.find((i) => i.slot === s);

      const sg = this.scene.add.graphics();
      sg.fillStyle(item ? 0x0e2a1e : 0x0e1c2d, 0.95);
      sg.fillRoundedRect(cx, cy, cell, cell, 4);
      sg.lineStyle(1, item ? 0x2f7d5a : 0x22384e, 0.9);
      sg.strokeRoundedRect(cx, cy, cell, cell, 4);
      this.bodyContainer.add(sg);
      if (!item) continue;

      this.bodyContainer.add(createItemIcon(this.scene, cx + cell / 2, cy + cell / 2 - 6, item, 34));
      const nm = this.scene.add.text(cx + cell / 2, cy + cell - 12, item.name, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#cfe3f2',
        wordWrap: { width: cell - 8 }, maxLines: 1,
      }).setOrigin(0.5);
      this.bodyContainer.add(nm);
      if (item.qty > 1) {
        const q = this.scene.add.text(cx + cell - 6, cy + 4, `${item.qty}`, {
          fontFamily: 'monospace', fontSize: '10px', color: '#ffe28a', fontStyle: 'bold',
        }).setOrigin(1, 0);
        this.bodyContainer.add(q);
      }
      if (item.condition) {
        const dot = this.scene.add.graphics();
        dot.fillStyle(Number.parseInt(CONDITION_COLOR[item.condition].slice(1), 16), 1);
        dot.fillCircle(cx + 8, cy + 8, 3.5);
        this.bodyContainer.add(dot);
      }

      const hit = this.scene.add.rectangle(cx + cell / 2, cy + cell / 2, cell, cell, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this.cookSelectedId = item.id; this.renderBody(); });
      this.bodyContainer.add(hit);
      if (this.cookSelectedId === item.id) {
        const sel = this.scene.add.graphics();
        sel.lineStyle(2, 0x4af2a1, 1);
        sel.strokeRoundedRect(cx, cy, cell, cell, 4);
        this.bodyContainer.add(sel);
      }
    }

    // 하단: 선택 아이템 안내 (도마 연동은 손질 시스템 구현 시)
    const selItem = this.cookSelectedId ? InventoryStore.find(this.cookSelectedId) : undefined;
    const footY = gridY + 5 * (cell + gap) + 4;
    const foot = this.scene.add.text(x + 14, footY,
      selItem
        ? `선택: ${selItem.name}${selItem.condition ? ` (${CONDITION_LABEL[selItem.condition]})` : ''} — 손질 시스템 구현 후 도마에 올릴 수 있습니다`
        : '아이템을 클릭해 선택하세요', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px',
        color: selItem ? '#7fe6b0' : '#7a98ac', wordWrap: { width: w - 28 },
      });
    this.bodyContainer.add(foot);
  }

  override destroy(fromScene?: boolean): void {
    this.closeChooser();
    super.destroy(fromScene);
  }
}
