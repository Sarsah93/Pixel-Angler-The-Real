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
import { InventoryStore, InvItem, RigStepKey } from '../store/InventoryStore.js';
import { DraggablePanel } from './DraggablePanel.js';

export type UtilizationTab = 'cooking' | 'tackles';

const PANEL_W = 1080;
const PANEL_H = 620;

/** 채비 단계 정의 — matcher로 인벤토리 부품 필터 */
const RIG_STEPS: { key: RigStepKey; label: string; matcher: ((i: InvItem) => boolean) | null }[] = [
  { key: 'mainLine',  label: '원줄',        matcher: (i) => i.subCategory === '원줄 스풀' },
  { key: 'floatStop', label: '면사매듭',    matcher: null },   // 수심 한계 조절 전용
  { key: 'float',     label: '구멍찌/수중찌', matcher: (i) => i.subCategory === '채비 부속' && i.name.includes('찌') },
  { key: 'swivel',    label: '도래',        matcher: (i) => i.subCategory === '채비 부속' && i.name.includes('도래') },
  { key: 'leader',    label: '목줄',        matcher: (i) => i.subCategory === '목줄 스풀' },
  { key: 'sinker',    label: '봉돌',        matcher: (i) => i.subCategory === '채비 부속' && i.name.includes('봉돌') },
  { key: 'hookBait',  label: '바늘 & 미끼', matcher: (i) => i.subCategory === '바늘/훅' || i.subCategory.includes('미끼') || i.subCategory === '생미끼' },
];

export class UtilizationPanel extends DraggablePanel {
  private currentTab: UtilizationTab;
  private tabBgs = new Map<UtilizationTab, Phaser.GameObjects.Graphics>();
  private tabTexts = new Map<UtilizationTab, Phaser.GameObjects.Text>();
  private bodyContainer!: Phaser.GameObjects.Container;
  private chooser?: Phaser.GameObjects.Container;

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
    const boxW = 122, boxH = 132, gap = 18;
    const chainY = top + 46;
    RIG_STEPS.forEach((step, i) => {
      const bx = 24 + i * (boxW + gap);

      const box = this.scene.add.graphics();
      const assignedId = InventoryStore.rig[step.key];
      const assigned = assignedId ? InventoryStore.find(assignedId) : undefined;
      const isKnot = step.matcher === null;

      box.fillStyle(assigned || isKnot ? 0x0e2a1e : 0x0e1c2d, 0.95);
      box.fillRoundedRect(bx, chainY, boxW, boxH, 5);
      box.lineStyle(1.5, assigned || isKnot ? 0x2f7d5a : 0x2a5a8a, 0.95);
      box.strokeRoundedRect(bx, chainY, boxW, boxH, 5);
      this.bodyContainer.add(box);

      const stepLbl = this.scene.add.text(bx + boxW / 2, chainY + 14, step.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#c8a060', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.bodyContainer.add(stepLbl);

      // 화살표
      if (i < RIG_STEPS.length - 1) {
        const arrow = this.scene.add.text(bx + boxW + gap / 2, chainY + boxH / 2, '→', {
          fontSize: '16px', color: '#4a6a8a',
        }).setOrigin(0.5);
        this.bodyContainer.add(arrow);
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
      else if (item.subCategory === '바늘/훅') weightG += 0.5;
      else if (item.subCategory.includes('미끼') || item.subCategory === '생미끼') weightG += 1.2;
      else if (item.name.includes('도래')) weightG += 0.3;
    };
    (Object.keys(rig) as RigStepKey[]).forEach((k) => partWeight(rig[k]));

    const net = weightG - buoyG;
    const sinkMps = Math.max(0, net * 0.03);
    const dragCd = 0.4 + weightG * 0.01;

    let advice: string;
    if (!rig.mainLine || !rig.hookBait) advice = '원줄과 바늘&미끼는 필수입니다. 소켓을 채워 주세요.';
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
    const top = this.contentTop + 60;

    // 도마
    const board = this.scene.add.graphics();
    board.fillStyle(0x8a6a44, 1);
    board.fillRoundedRect(PANEL_W / 2 - 220, top + 60, 440, 220, 12);
    board.fillStyle(0xa8845a, 1);
    board.fillRoundedRect(PANEL_W / 2 - 208, top + 72, 416, 196, 10);
    board.lineStyle(2, 0x5a4028, 1);
    board.strokeRoundedRect(PANEL_W / 2 - 220, top + 60, 440, 220, 12);
    this.bodyContainer.add(board);

    const boardLbl = this.scene.add.text(PANEL_W / 2, top + 170, '도마 (생선을 올려 손질)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#5a4028', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.bodyContainer.add(boardLbl);

    const hasKnife = false; // 회칼 장비 아이템 추가 예정
    const lines = [
      '생선 손질(삼면뜨기) 시스템은 추후 정식 구현 예정입니다.',
      '',
      `회칼 장비 상태: ${hasKnife ? '장비됨' : '미보유 — 회칼(장비)을 착용해야 손질할 수 있습니다'}`,
      '· 인벤토리의 생선을 도마에 올리는 상호작용 예정',
      '· 신선도에 따라 요리 결과/버프(근력 1.5배 등)가 달라집니다',
      '· 생선 이미지 에셋 업로드 후 손질 가이드 연동',
    ];
    const info = this.scene.add.text(PANEL_W / 2, top + 320, lines.join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#9fc0d4',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0);
    this.bodyContainer.add(info);
  }

  override destroy(fromScene?: boolean): void {
    this.closeChooser();
    super.destroy(fromScene);
  }
}
