/**
 * @file UtilizationPanel.ts
 * @description 활용 창 (U 키 — 전체 화면 전환 상태, 상단 탭: 요리하기 / 채비하기 / 밑밥 품질)
 *
 * 채비하기(Tackles):
 *  실제 바다낚시 채비 순서 [원줄 → 면사매듭 → 구멍찌/수중찌 → 도래 → 목줄 → 봉돌 → 바늘&미끼]
 *  대로 소켓을 클릭해 인벤토리의 부품을 조립한다. 면사매듭은 수심 한계(Z_limit)를
 *  -/+ 로 조절하며, 조립 스펙(총 무게/침강 속도/최대 공략 수심)이 실시간 합산된다.
 *  (낚싯대 우클릭 → '채비하기' 로도 진입)
 *
 * 요리하기(Cooking):
 *  도마 위 생선 손질(삼면뜨기) 시스템 자리 — 회칼(장비) 필요. 추후 정식 구현 예정.
 *
 * 밑밥 품질(Chum):
 *  좌측 밑밥 통(탑뷰)에 우측 인벤토리의 재료(파우더/냉동 크릴/압맥·옥수수)를
 *  드래그 앤 드랍으로 투입(종류별 붓기 연출) → 물 넣기(1회) → 섞기(1회) →
 *  배합 완료 시 밑밥 100 충전 (1인칭 C 투척 1회당 25 소모). 하단에 추천 배합 코멘트.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import {
  InventoryStore, InvItem, InvCategory, RigStepKey,
  CATEGORY_LABEL, CONDITION_LABEL, CONDITION_COLOR,
  isHookItem, isBaitItem, isLureItem, isWeightSinker, isSplitShot, isJigHeadItem,
  SpreaderKind, CardRigType, SPREADER_LABEL, CARD_RIG_INFO,
} from '../store/InventoryStore.js';
import { RecommendationStore } from '../store/RecommendationStore.js';
import { CoolerStore, ChumIngredientKind, CHUM_THROW_COST } from '../store/CoolerStore.js';
import { LureFamily, LureKind, getLureSpec, getLureSinkProfile, jigHeadWeightById } from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';

/** 루어 세부 종류 → 라벨 (2단계 트리) */
const SOFT_KINDS: { k: LureKind; label: string }[] = [
  { k: 'worm_grub', label: '웜/그럽' },
  { k: 'soft_jerkbait', label: '소프트 저크베이트' },
];
const HARD_KINDS: { k: LureKind; label: string }[] = [
  { k: 'plug_minnow', label: '미노우' },
  { k: 'spoon', label: '스푼' },
  { k: 'spinner', label: '스피너' },
  { k: 'egi', label: '에기' },
  { k: 'metal_jig', label: '메탈지그' },
];
const SINK_LABEL: Record<string, string> = {
  floating: '플로팅 (수면 유지·리트리브로 파고듦)',
  sinking: '싱킹 (착수 후 하강)',
  fast_sinking: '초고속 싱킹 (빠른 하강)',
};

export type UtilizationTab = 'cooking' | 'tackles' | 'chum';

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
  /** 루어 채비 트리 네비게이션 상태 */
  private lureFamily: LureFamily = 'soft';
  private lureKindSel: LureKind = 'worm_grub';

  // ── 밑밥 품질 탭 드래그 상태 ──
  private chumDragItem: InvItem | null = null;
  private chumGhost?: Phaser.GameObjects.Container;
  private chumMoveHandler = (p: Phaser.Input.Pointer): void => {
    this.chumGhost?.setPosition(p.x, p.y);
  };
  private chumUpHandler = (p: Phaser.Input.Pointer): void => {
    this.finishChumDrag(p);
  };

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

    // 밑밥 재료 드래그 앤 드랍 (씬 레벨 포인터 추적)
    scene.input.on('pointermove', this.chumMoveHandler);
    scene.input.on('pointerup', this.chumUpHandler);
  }

  // ── 상단 탭 (요리하기 / 채비하기) ─────────────────────
  private buildTabs(): void {
    const defs: { id: UtilizationTab; label: string }[] = [
      { id: 'cooking', label: '요리하기 (Cooking)' },
      { id: 'tackles', label: '채비하기 (Tackles)' },
      { id: 'chum',    label: '밑밥 품질 (Chum)' },
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
    (['cooking', 'tackles', 'chum'] as UtilizationTab[]).forEach((id, i) => {
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
    else if (this.currentTab === 'chum') this.renderChumMixing();
    else this.renderCooking();
    this.applyFix();
  }

  // ═══════════════════════════════════════════════════
  // 채비하기 (Tackles)
  // ═══════════════════════════════════════════════════
  private renderTackles(): void {
    // ── 채비 모드 토글 (미끼 채비 / 루어 채비) ──
    this.renderRigModeToggle(this.contentTop + 44);
    if (InventoryStore.rigMode === 'lure') { this.renderLureRig(); return; }

    const top = this.contentTop + 80;
    const surf = InventoryStore.isSurfRigReady();
    const reco = RecommendationStore.get();

    const guide = this.scene.add.text(24, top,
      surf
        ? '원투(찌 없이 도래 직결) 모드 — 초릿대 끝으로 입질을 봅니다. 봉돌 소켓에 무게추 봉돌을 다세요.'
        : '조립 순서대로 소켓을 클릭해 부품을 선택하세요. 면사매듭 위치는 채비가 도달할 최대 수심(Z_limit)을 결정합니다.', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fc0d4',
      });
    this.bodyContainer.add(guide);

    // ── 추천 배너 (지역/지형/물때/대상어종 반영) ──
    const recoParts: string[] = [`조법 ${reco.techniqueLabel}`];
    if (reco.floatHo !== undefined) recoParts.push(`찌 ${reco.floatHo}호`);
    if (reco.sinkerKind && reco.sinkerHoRange) {
      const kindKo = reco.sinkerKind === 'hole' ? '구멍' : reco.sinkerKind === 'bundle' ? '묶음추' : '고리';
      recoParts.push(`봉돌 ${kindKo} ${reco.sinkerHoRange[0]}~${reco.sinkerHoRange[1]}호`);
    }
    if (reco.baitKeys.length) recoParts.push(`미끼 ${reco.baitKeys.slice(0, 2).join('·')}`);
    const recoText = this.scene.add.text(24, top + 18,
      `추천 (${reco.targetNames.join('·') || '지역 대상어'}): ${recoParts.join(' · ')}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffd257', fontStyle: 'bold',
      });
    this.bodyContainer.add(recoText);

    // ── 조립 체인 소켓 ──
    const boxW = SOCKET_W, boxH = SOCKET_H, gap = SOCKET_GAP;
    const chainY = top + 62;
    // 루어 장착 시 미끼 소켓 비활성 (바늘 일체형 가짜미끼 — 미끼 불필요)
    const baitDisabled = !InventoryStore.hookNeedsBait();
    RIG_STEPS.forEach((step, i) => {
      const bx = 24 + i * (boxW + gap);
      const disabled = step.key === 'bait' && baitDisabled;

      // 봉돌 소켓은 모드에 따라: 원투 → 무게추 봉돌 / 찌낚시 → 좁쌀 봉돌
      let matcher = step.matcher;
      let label = step.label;
      if (step.key === 'sinker') {
        matcher = surf ? isWeightSinker : isSplitShot;
        label = surf ? '무게추 봉돌' : '봉돌 (좁쌀)';
      }
      // 추천 부합 아이템 판정기 (소켓별)
      const recoPredicate: ((it: InvItem) => boolean) | null =
        step.key === 'sinker' && surf ? (it) => RecommendationStore.isSinkerRecommended(it, reco)
        : step.key === 'float' ? (it) => RecommendationStore.isFloatRecommended(it, reco)
        : step.key === 'bait' ? (it) => RecommendationStore.isBaitRecommended(it, reco)
        : null;

      const box = this.scene.add.graphics();
      const assignedId = InventoryStore.rig[step.key];
      const assigned = assignedId ? InventoryStore.find(assignedId) : undefined;
      const isKnot = step.matcher === null;

      box.fillStyle(disabled ? 0x101820 : assigned || isKnot ? 0x0e2a1e : 0x0e1c2d, 0.95);
      box.fillRoundedRect(bx, chainY, boxW, boxH, 5);
      box.lineStyle(1.5, disabled ? 0x2a3642 : assigned || isKnot ? 0x2f7d5a : 0x2a5a8a, 0.95);
      box.strokeRoundedRect(bx, chainY, boxW, boxH, 5);
      this.bodyContainer.add(box);

      // 소켓 추천 배지 — 유효 부품 미장착 + 추천 후보가 인벤토리에 있으면 우상단 '추천' 표시
      // (원투 전환 후 봉돌 소켓에 좁쌀이 남아 있는 경우처럼 '잘못된 장착'도 미장착으로 취급)
      const validAssigned = assigned && matcher && matcher(assigned);
      if (!disabled && !validAssigned && recoPredicate && InventoryStore.items.some(recoPredicate)) {
        const rb = this.scene.add.text(bx + boxW - 6, chainY + 4, '추천', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#0b1f14',
          backgroundColor: '#ffd257', padding: { x: 3, y: 1 }, fontStyle: 'bold',
        }).setOrigin(1, 0);
        this.bodyContainer.add(rb);
      }

      const stepLbl = this.scene.add.text(bx + boxW / 2, chainY + 14, label, {
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
        const hasKnot = InventoryStore.hasFloatStop;
        // 면사매듭: 수심 한계 조절 (-/+) — 제거하면 전유동 (무한 침강)
        const depthTxt = this.scene.add.text(bx + boxW / 2, chainY + 52, hasKnot ? `${InventoryStore.rigDepthLimitM} m` : '∞', {
          fontFamily: 'monospace', fontSize: '20px', color: hasKnot ? '#4af2a1' : '#66b8ff', fontStyle: 'bold',
        }).setOrigin(0.5);
        const sub = this.scene.add.text(bx + boxW / 2, chainY + 74, hasKnot ? '최대 공략 수심' : '전유동 (무한 침강)', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: hasKnot ? '#7a98ac' : '#66b8ff',
        }).setOrigin(0.5);
        this.bodyContainer.add([depthTxt, sub]);

        if (hasKnot) {
          const mkBtn = (bxx: number, label: string, delta: number): void => {
            const btnBg = this.scene.add.graphics();
            btnBg.fillStyle(0x155a7c, 0.95);
            btnBg.fillRoundedRect(bxx, chainY + 84, 34, 20, 4);
            const btnTxt = this.scene.add.text(bxx + 17, chainY + 94, label, {
              fontFamily: 'monospace', fontSize: '13px', color: '#aee8ff', fontStyle: 'bold',
            }).setOrigin(0.5);
            const btnHit = this.scene.add.rectangle(bxx + 17, chainY + 94, 34, 20, 0xffffff, 0.001)
              .setInteractive({ useHandCursor: true });
            btnHit.on('pointerdown', () => {
              InventoryStore.rigDepthLimitM = Phaser.Math.Clamp(InventoryStore.rigDepthLimitM + delta, 1, 30);
              this.renderBody();
            });
            this.bodyContainer.add([btnBg, btnTxt, btnHit]);
          };
          mkBtn(bx + 12, '-', -1);
          mkBtn(bx + boxW - 46, '+', 1);
        }

        // 면사 제거/부착 토글 — 제거 시 전유동 조법
        const tg = this.scene.add.graphics();
        tg.fillStyle(hasKnot ? 0x3a2a20 : 0x155a7c, 0.95);
        tg.fillRoundedRect(bx + 12, chainY + boxH - 24, boxW - 24, 18, 3);
        const tt = this.scene.add.text(bx + boxW / 2, chainY + boxH - 15, hasKnot ? '면사 제거 (전유동)' : '면사 부착', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: hasKnot ? '#ffce9a' : '#aee8ff',
        }).setOrigin(0.5);
        const th = this.scene.add.rectangle(bx + boxW / 2, chainY + boxH - 15, boxW - 24, 18, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        th.on('pointerdown', () => {
          InventoryStore.hasFloatStop = !InventoryStore.hasFloatStop;
          this.renderBody();
        });
        this.bodyContainer.add([tg, tt, th]);
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
      hit.on('pointerdown', () => this.openChooser(step.key, label, matcher!, bx, chainY + boxH + 8, recoPredicate));
      this.bodyContainer.add(hit);
    });

    // ── 원투 편대/서브 채비 (찌 비움 + 도래 장착 시 병렬 활성) ──
    let sumY = chainY + boxH + 12;
    if (InventoryStore.isSurfRigReady()) {
      sumY += this.renderSpreaderRow(24, sumY) + 10;
    }

    // ── 조립 스펙 요약 ──
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

  // ── 채비 모드 토글 (미끼 채비 / 루어 채비) ─────────────
  private renderRigModeToggle(y: number): void {
    const modes: { id: 'bait' | 'lure'; label: string }[] = [
      { id: 'bait', label: '미끼 채비' },
      { id: 'lure', label: '루어 채비' },
    ];
    let x = 24;
    modes.forEach((m) => {
      const sel = InventoryStore.rigMode === m.id;
      const w = 110;
      const g = this.scene.add.graphics();
      g.fillStyle(sel ? 0x155a7c : 0x0e1c2d, 0.95);
      g.fillRoundedRect(x, y, w, 26, 4);
      g.lineStyle(1.5, sel ? 0x5cd0ff : 0x2a5a8a, 0.95);
      g.strokeRoundedRect(x, y, w, 26, 4);
      const t = this.scene.add.text(x + w / 2, y + 13, m.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', fontStyle: 'bold',
        color: sel ? '#aee8ff' : '#8faabf',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(x + w / 2, y + 13, w, 26, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        InventoryStore.setRigMode(m.id);
        this.closeChooser();
        this.renderBody();
      });
      this.bodyContainer.add([g, t, hit]);
      x += w + 8;
    });
  }

  // ═══════════════════════════════════════════════════
  // 루어 채비 (rigMode === 'lure') — 2단계 종류 트리 + 지그헤드 + 제원
  // ═══════════════════════════════════════════════════
  private renderLureRig(): void {
    const top = this.contentTop + 80;
    const guide = this.scene.add.text(24, top,
      '소프트/하드 → 종류 → 라인업을 선택하세요. 소프트 베이트는 지그헤드를 결합해야 캐스팅됩니다.', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fc0d4',
      });
    this.bodyContainer.add(guide);

    // 1단계: 소프트 / 하드
    const fam: { f: LureFamily; label: string }[] = [
      { f: 'soft', label: '소프트 베이트' }, { f: 'hard', label: '하드 베이트' },
    ];
    let fx = 24;
    const famY = top + 22;
    fam.forEach(({ f, label }) => {
      const sel = this.lureFamily === f;
      const w = 130;
      this.mkPill(fx, famY, w, 26, label, sel, () => {
        this.lureFamily = f;
        this.lureKindSel = (f === 'soft' ? SOFT_KINDS : HARD_KINDS)[0].k;
        this.renderBody();
      });
      fx += w + 8;
    });

    // 2단계: 종류 (선택 family에 따라)
    const kinds = this.lureFamily === 'soft' ? SOFT_KINDS : HARD_KINDS;
    let kx = 24;
    const kindY = famY + 34;
    kinds.forEach(({ k, label }) => {
      const sel = this.lureKindSel === k;
      const w = label.length * 12 + 24;
      this.mkPill(kx, kindY, w, 24, label, sel, () => { this.lureKindSel = k; this.renderBody(); });
      kx += w + 8;
    });

    // 3단계: 라인업 (인벤토리 루어 중 선택 종류)
    const lures = InventoryStore.getByCategory('lure')
      .filter((i) => getLureSpec(i.id)?.kind === this.lureKindSel);
    const lineY = kindY + 36;
    this.bodyContainer.add(this.scene.add.text(24, lineY, '라인업', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#c8a060', fontStyle: 'bold',
    }));
    let lx = 24;
    const cardY = lineY + 20;
    lures.forEach((item) => {
      const spec = getLureSpec(item.id)!;
      const sel = InventoryStore.lureId === item.id;
      const w = 150, h = 56;
      const g = this.scene.add.graphics();
      g.fillStyle(sel ? 0x0e2a1e : 0x0e1c2d, 0.95);
      g.fillRoundedRect(lx, cardY, w, h, 5);
      g.lineStyle(1.5, sel ? 0x4af2a1 : 0x2a5a8a, 0.95);
      g.strokeRoundedRect(lx, cardY, w, h, 5);
      const nm = this.scene.add.text(lx + 8, cardY + 8, `${spec.sizeLabel} · ${spec.brand}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#e8f4fd', fontStyle: 'bold',
      });
      const sub = this.scene.add.text(lx + 8, cardY + 26, `${spec.weightG}g · ${SINK_LABEL[spec.sinkType].split(' ')[0]}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#9fc0d4',
      });
      const qty = this.scene.add.text(lx + w - 8, cardY + 8, `x${item.qty}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffe28a',
      }).setOrigin(1, 0);
      const hit = this.scene.add.rectangle(lx + w / 2, cardY + h / 2, w, h, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { InventoryStore.setLure(item.id); this.renderBody(); });
      this.bodyContainer.add([g, nm, sub, qty, hit]);
      lx += w + 8;
    });
    if (lures.length === 0) {
      this.bodyContainer.add(this.scene.add.text(24, cardY + 14, '보유한 루어가 없습니다 (낚시점에서 구매).', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#607b8e',
      }));
    }

    // 지그헤드 소켓 (소프트 베이트만)
    let specY = cardY + 70;
    const eqSpec = InventoryStore.getEquippedLureSpec();
    if (eqSpec?.requiresJigHead) {
      this.bodyContainer.add(this.scene.add.text(24, specY, '지그헤드 (소프트 베이트 필수 — 무게가 침강 속도를 결정)', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#c8a060', fontStyle: 'bold',
      }));
      let jx = 24;
      const jy = specY + 20;
      InventoryStore.getByCategory('lure').filter(isJigHeadItem).forEach((jh) => {
        const sel = InventoryStore.jigHeadId === jh.id;
        const w = 84;
        this.mkPill(jx, jy, w, 24, `${jigHeadWeightById(jh.id)}g (x${jh.qty})`, sel, () => {
          InventoryStore.setJigHead(jh.id); this.renderBody();
        });
        jx += w + 8;
      });
      specY = jy + 36;
    }

    // ── 제원 스펙 컨테이너 (실시간 — 계산은 core, UI는 표시만) ──
    const sbW = PANEL_W - 48, sbH = 150;
    const sbg = this.scene.add.graphics();
    sbg.fillStyle(0x060d1a, 0.95);
    sbg.fillRoundedRect(24, specY, sbW, sbH, 5);
    sbg.lineStyle(1.5, 0xc8a060, 0.9);
    sbg.strokeRoundedRect(24, specY, sbW, sbH, 5);
    this.bodyContainer.add(sbg);
    this.bodyContainer.add(this.scene.add.text(40, specY + 12, '루어 제원 (실시간)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffe28a', fontStyle: 'bold',
    }));

    if (eqSpec) {
      const jhW = jigHeadWeightById(InventoryStore.jigHeadId);
      const sink = getLureSinkProfile(eqSpec, jhW);
      const missing = InventoryStore.getMissingRigParts();
      const bias = eqSpec.speciesWeightBias
        ? Object.entries(eqSpec.speciesWeightBias).map(([s, v]) => `${s} +${Math.round(v * 100)}%`).join(', ')
        : eqSpec.spawnBinding ? `두족류 전용 (${eqSpec.spawnBinding.join('/')})`
        : eqSpec.targetHabitatBias ? `서식 성향 가중 (${eqSpec.targetHabitatBias.join('/')})` : '-';
      const lines = [
        `루어: ${eqSpec.nameKo} (${eqSpec.brand})`,
        `총 무게: ${InventoryStore.getLureRigWeightG().toFixed(1)} g${eqSpec.requiresJigHead ? ` (웜 ${eqSpec.weightG} + 지그헤드 ${jhW})` : ''}`,
        `침강: ${SINK_LABEL[sink.sinkType]}${sink.sinkRateMps > 0 ? ` ${sink.sinkRateMps.toFixed(2)} m/s` : ''}`,
        `공기저항 C_d: ${eqSpec.dragCoefficient.toFixed(2)}${eqSpec.kind === 'metal_jig' ? ' (초장타)' : ''}`,
        `타겟 가중: ${bias}`,
        `액션: ${eqSpec.actionFlags?.join(', ') ?? '-'}${eqSpec.snagRiskMult ? ` · 밑걸림 ×${eqSpec.snagRiskMult}` : ''}`,
      ];
      lines.forEach((line, i) => {
        this.bodyContainer.add(this.scene.add.text(40 + Math.floor(i / 3) * 360, specY + 38 + (i % 3) * 22, line, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#d0e8f5',
        }));
      });
      const advice = missing.length
        ? `필수 소켓이 비었습니다: ${missing.join(', ')} — 채워야 캐스팅할 수 있습니다.`
        : '루어 채비 완성 — 입질/챔질 실패로는 루어를 잃지 않습니다(목줄째 터질 때만 손실).';
      this.bodyContainer.add(this.scene.add.text(40, specY + sbH - 24, advice, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: missing.length ? '#ff9a6a' : '#7fe6b0',
      }));
    } else {
      this.bodyContainer.add(this.scene.add.text(40, specY + 60, '루어를 선택하세요.', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#7a98ac',
      }));
    }
  }

  /** 작은 선택 pill 버튼 유틸 */
  private mkPill(x: number, y: number, w: number, h: number, label: string, sel: boolean, onClick: () => void): void {
    const g = this.scene.add.graphics();
    g.fillStyle(sel ? 0x1a6a3e : 0x0e1c2d, 0.95);
    g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1, sel ? 0x4af2a1 : 0x2a5a8a, 0.9);
    g.strokeRoundedRect(x, y, w, h, 4);
    const t = this.scene.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: sel ? '#d6ffe8' : '#8faabf',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
    this.bodyContainer.add([g, t, hit]);
  }

  /**
   * 원투 편대/서브 채비 선택 행 — 찌 소켓을 비우고 도래를 장착하면 병렬 활성.
   * NONE/T자 천평/카드(열기7·고등어5·전갱이3 서브 토글)/학꽁치/갈치.
   * 카드 채비는 단수만큼 미끼 멀티 슬롯(MultiHookContainer)이 확장된다.
   * @returns 렌더한 블록 높이 (px)
   */
  private renderSpreaderRow(x: number, y: number): number {
    const sp = InventoryStore.spreader;
    const w = PANEL_W - 48;
    const hasCard = sp.kind === 'CARD_RIG' && !!sp.cardType;
    const h = hasCard ? 120 : 74;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0c1a10, 0.95);
    bg.fillRoundedRect(x, y, w, h, 5);
    bg.lineStyle(1.5, 0x2f7d5a, 0.9);
    bg.strokeRoundedRect(x, y, w, h, 5);
    this.bodyContainer.add(bg);

    const title = this.scene.add.text(x + 12, y + 8, '편대/서브 채비 (원투 — 찌 없이 도래 직결)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7fe6b0', fontStyle: 'bold',
    });
    this.bodyContainer.add(title);

    // 종류 선택 버튼 5개
    const kinds: SpreaderKind[] = ['NONE', 'T_BAR', 'CARD_RIG', 'HAKGONGCHI', 'GALCHI'];
    let bx = x + 12;
    kinds.forEach((kind) => {
      const label = SPREADER_LABEL[kind];
      const bw = label.length * 11 + 22;
      const sel = sp.kind === kind;
      const g = this.scene.add.graphics();
      g.fillStyle(sel ? 0x1a6a3e : 0x0e1c2d, 0.95);
      g.fillRoundedRect(bx, y + 28, bw, 24, 4);
      g.lineStyle(1, sel ? 0x4af2a1 : 0x2a5a8a, 0.9);
      g.strokeRoundedRect(bx, y + 28, bw, 24, 4);
      const t = this.scene.add.text(bx + bw / 2, y + 40, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: sel ? '#d6ffe8' : '#8faabf',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(bx + bw / 2, y + 40, bw, 24, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { InventoryStore.setSpreader(kind, sp.cardType); this.renderBody(); });
      this.bodyContainer.add([g, t, hit]);
      bx += bw + 8;
    });

    // 카드 채비 서브 토글 (열기 7단 / 고등어 5단 / 전갱이 3단)
    if (sp.kind === 'CARD_RIG') {
      let cx = x + 12;
      (Object.keys(CARD_RIG_INFO) as CardRigType[]).forEach((ct) => {
        const info = CARD_RIG_INFO[ct];
        const bw = info.label.length * 11 + 18;
        const sel = sp.cardType === ct;
        const g = this.scene.add.graphics();
        g.fillStyle(sel ? 0x155a7c : 0x0e1c2d, 0.95);
        g.fillRoundedRect(cx, y + 56, bw, 20, 3);
        g.lineStyle(1, sel ? 0x5cd0ff : 0x2a5a8a, 0.9);
        g.strokeRoundedRect(cx, y + 56, bw, 20, 3);
        const t = this.scene.add.text(cx + bw / 2, y + 66, info.label, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: sel ? '#aee8ff' : '#8faabf',
        }).setOrigin(0.5);
        const hit = this.scene.add.rectangle(cx + bw / 2, y + 66, bw, 20, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => { InventoryStore.setSpreader('CARD_RIG', ct); this.renderBody(); });
        this.bodyContainer.add([g, t, hit]);
        cx += bw + 6;
      });
      const gapNote = this.scene.add.text(cx + 8, y + 66, sp.cardType ? `바늘 간격 ${CARD_RIG_INFO[sp.cardType].gapM}m` : '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
      }).setOrigin(0, 0.5);
      this.bodyContainer.add(gapNote);
    }

    // MultiHookContainer — 카드 단수만큼 미끼 개별 장착 슬롯
    if (hasCard && sp.cardType) {
      const info = CARD_RIG_INFO[sp.cardType];
      const cell = 34;
      let hx = x + 12;
      const hy = y + 82;
      for (let i = 0; i < info.hooks; i++) {
        const baitId = sp.hookBaits[i];
        const bait = baitId ? InventoryStore.find(baitId) : undefined;
        const g = this.scene.add.graphics();
        g.fillStyle(bait ? 0x0e2a1e : 0x0e1c2d, 0.95);
        g.fillRoundedRect(hx, hy, cell, cell, 3);
        g.lineStyle(1, bait ? 0x4af2a1 : 0x2a5a8a, 0.9);
        g.strokeRoundedRect(hx, hy, cell, cell, 3);
        const icon = this.scene.add.text(hx + cell / 2, hy + cell / 2, bait ? bait.icon : '🪝', {
          fontSize: '14px',
        }).setOrigin(0.5).setAlpha(bait ? 1 : 0.4);
        const num = this.scene.add.text(hx + 3, hy + 1, `${i + 1}`, {
          fontFamily: 'monospace', fontSize: '8px', color: '#7a98ac',
        });
        const hookIdx = i;
        const hit = this.scene.add.rectangle(hx + cell / 2, hy + cell / 2, cell, cell, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.openSpreaderBaitChooser(hookIdx, hx, hy + cell + 4));
        this.bodyContainer.add([g, icon, num, hit]);
        hx += cell + 6;
      }
      const fillAll = this.scene.add.text(hx + 8, hy + 17, '[전체 크릴 장착]', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffce54',
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      fillAll.on('pointerdown', () => {
        for (let i = 0; i < info.hooks; i++) {
          if (InventoryStore.find('inv_krill')) InventoryStore.setSpreaderBait(i, 'inv_krill');
        }
        this.renderBody();
      });
      this.bodyContainer.add(fillAll);
    }

    return h;
  }

  /** 카드 채비 단수별 미끼 선택 팝업 */
  private openSpreaderBaitChooser(hookIdx: number, x: number, y: number): void {
    this.closeChooser();
    const candidates = InventoryStore.items.filter(isBaitItem);
    const rowH = 26;
    const listW = 200;
    const listH = (candidates.length + 1) * rowH + 12;
    const c = this.scene.add.container(0, 0).setDepth(60);
    const g = this.scene.add.graphics();
    g.fillStyle(0x0a1628, 0.98);
    g.fillRoundedRect(x, y, listW, listH, 5);
    g.lineStyle(1.5, 0x33b0e0, 1);
    g.strokeRoundedRect(x, y, listW, listH, 5);
    c.add(g);
    const addRow = (idx: number, label: string, onPick: () => void): void => {
      const ry = y + 6 + idx * rowH;
      const t = this.scene.add.text(x + 12, ry + rowH / 2, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#d0e8f5',
      }).setOrigin(0, 0.5);
      const hit = this.scene.add.rectangle(x + listW / 2, ry + rowH / 2, listW - 8, rowH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => t.setColor('#aee8ff'));
      hit.on('pointerout', () => t.setColor('#d0e8f5'));
      hit.on('pointerdown', () => { onPick(); this.closeChooser(); this.renderBody(); });
      c.add([t, hit]);
    };
    addRow(0, '(비우기)', () => InventoryStore.setSpreaderBait(hookIdx, null));
    candidates.forEach((item, i) => {
      addRow(i + 1, `${item.icon} ${item.name} x${item.qty}`, () => InventoryStore.setSpreaderBait(hookIdx, item.id));
    });
    this.bodyContainer.add(c);
    this.chooser = c;
    this.applyFix();
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
      if (isWeightSinker(item)) weightG += item.sinkerWeightG ?? 0;   // 원투 무게추 봉돌 (60~113g)
      else if (item.name.includes('봉돌')) weightG += 0.31;          // 좁쌀 G2
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
    // 침강 속도 — 무게(net)에 비례 가속 (무거운 원투 싱커는 바닥까지 빠르게 낙하)
    const sinkMps = Math.max(0, net * 0.03);
    // 공기 저항 계수 — 묶음추 봉돌 0.58 / 그 외 0.42 (봉돌 종류가 결정)
    const dragCd = InventoryStore.getRigDragCd();

    let advice: string;
    const missing = InventoryStore.getMissingRigParts();
    const floatItem = rig.float ? InventoryStore.find(rig.float) : undefined;
    // 잠길찌: '잠길찌' 타입 찌 장착 또는 잔존 부력(부력-침강무게)이 0 미만
    const isSinkingFloat = !!floatItem && (floatItem.name.includes('잠길찌') || (buoyG > 0 && net > 0));
    const surf = InventoryStore.isSurfRigReady();
    const overload = InventoryStore.getRigTotalWeightG() > InventoryStore.getRodCapacityG();
    const holeSinker = InventoryStore.getEquippedWeightSinker()?.sinkerKind === 'hole';
    const bundleSinker = InventoryStore.getEquippedWeightSinker()?.sinkerKind === 'bundle';
    if (overload) advice = '채비 과부하! 봉돌 호수를 낮추거나 경량 채비를 선택하세요.';
    else if (missing.length > 0) advice = `필수 소켓이 비었습니다: ${missing.join(', ')} — 채워야 캐스팅할 수 있습니다.`;
    else if (surf) {
      advice = holeSinker
        ? '원투 채비 (구멍 봉돌) — 이물감이 적어 예신 타이밍 피드백 +15%. 초릿대 끝으로 입질을 보세요.'
        : bundleSinker
          ? '원투 채비 (묶음추 봉돌) — 공기 저항이 커 비거리 페널티. 초릿대 끝으로 입질을 보세요.'
          : '원투 채비 — 찌 없이 초릿대 끝으로 입질을 봅니다. 무게추 봉돌로 바닥을 공략하세요.';
    }
    else if (!InventoryStore.hasFloatStop) advice = '전유동 채비입니다. 면사매듭을 제거하면 채비가 무한 침강합니다 — 뒷줄견제(H)로 수심을 세워 흘리세요.';
    else if (isSinkingFloat) advice = '잠길찌 채비 상태입니다. 캐스팅 후 찌가 수중으로 하강합니다.';
    else if (!InventoryStore.hookNeedsBait()) advice = '루어 채비입니다 — 미끼 없이 캐스팅 가능하며, 입질 시 미끼가 소모되지 않습니다.';
    else if (net < 0) advice = '부력이 무게보다 큽니다 — 채비가 상층에 뜹니다 (상층 어종 공략).';
    else if (sinkMps < 0.1) advice = '침강이 느립니다. 깊은 수심 공략 시 봉돌을 추가하세요. (강풍 시 무거운 봉돌 추천)';
    else advice = '균형 잡힌 채비입니다. 면사매듭 수심을 포인트 수심대에 맞추세요.';

    return { weightG, buoyG, sinkMps, dragCd, advice };
  }

  /** 부품 선택 리스트 팝업 */
  private openChooser(
    step: RigStepKey, label: string, matcher: (i: InvItem) => boolean,
    x: number, y: number, isReco?: ((i: InvItem) => boolean) | null,
  ): void {
    this.closeChooser();

    // 추천 후보를 상단으로 정렬
    const candidates = InventoryStore.items.filter(matcher)
      .sort((a, b) => (isReco ? (Number(isReco(b)) - Number(isReco(a))) : 0));
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

    const addRow = (i: number, text: string, onPick: () => void, recommended = false): void => {
      const ry = ly + 28 + i * rowH;
      const rowTxt = this.scene.add.text(lx + 14, ry + rowH / 2, text, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: recommended ? '#ffe28a' : '#d0e8f5',
      }).setOrigin(0, 0.5);
      c.add(rowTxt);
      if (recommended) {
        const badge = this.scene.add.text(lx + listW - 12, ry + rowH / 2, '추천', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#0b1f14',
          backgroundColor: '#ffd257', padding: { x: 3, y: 1 }, fontStyle: 'bold',
        }).setOrigin(1, 0.5);
        c.add(badge);
      }
      const rowHit = this.scene.add.rectangle(lx + listW / 2, ry + rowH / 2, listW - 8, rowH - 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      rowHit.on('pointerover', () => rowTxt.setColor('#ffffff'));
      rowHit.on('pointerout', () => rowTxt.setColor(recommended ? '#ffe28a' : '#d0e8f5'));
      rowHit.on('pointerdown', () => { onPick(); this.closeChooser(); this.renderBody(); });
      c.add(rowHit);
    };

    if (candidates.length === 0) {
      const none = this.scene.add.text(lx + 14, ly + 40, '사용 가능한 부품이 없습니다', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#607b8e',
      });
      c.add(none);
      addRow(1, '닫기', () => { /* 선택 없음 */ });
    } else {
      candidates.forEach((item, i) => {
        addRow(i, `${item.icon} ${item.name} (x${item.qty})`,
          () => InventoryStore.setRigPart(step, item.id), !!isReco && isReco(item));
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

  // ═══════════════════════════════════════════════════
  // 밑밥 품질 (Chum) — 재료 드래그 앤 드랍 배합 + 물 넣기/섞기
  // ═══════════════════════════════════════════════════
  /** 밑밥 통 히트 영역 (패널 로컬 좌표) */
  private static readonly CHUM_BOX = { x: 40, y: 120, w: 460, h: 240 };

  private renderChumMixing(): void {
    const { x: boxX, y: boxY, w: boxW, h: boxH } = UtilizationPanel.CHUM_BOX;
    const mixed = CoolerStore.chumMixed || CoolerStore.chumRemaining > 0;

    // 상태 헤더
    const header = this.scene.add.text(boxX, this.contentTop + 56,
      mixed
        ? `배합 완료 — 남은 밑밥 ${CoolerStore.chumRemaining} / 100 (1인칭 C 투척 1회당 ${CHUM_THROW_COST} 소모)`
        : `밑밥 통 (탑뷰) — 우측 인벤토리의 재료를 통 안으로 드래그하세요`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', fontStyle: 'bold',
        color: mixed ? '#4af2a1' : '#ffe28a',
      });
    this.bodyContainer.add(header);

    // ── 밑밥 통 (흰 직사각 쿨러 통 — 탑뷰) ──
    const g = this.scene.add.graphics();
    g.fillStyle(0xe8e8e4, 1);
    g.fillRoundedRect(boxX, boxY, boxW, boxH, 14);
    g.fillStyle(0xf6f6f2, 1);
    g.fillRoundedRect(boxX + 10, boxY + 10, boxW - 20, boxH - 20, 10);
    g.fillStyle(0xdcdcd4, 1);
    g.fillRoundedRect(boxX + 18, boxY + 18, boxW - 36, boxH - 36, 8);
    g.lineStyle(2, 0xb8b8b0, 1);
    g.strokeRoundedRect(boxX, boxY, boxW, boxH, 14);
    this.bodyContainer.add(g);

    if (mixed) {
      // 완성 혼합물 — 붉은 갈색 반죽 + 질감 점
      const m = this.scene.add.graphics();
      m.fillStyle(0x8a5a3c, 1);
      m.fillRoundedRect(boxX + 22, boxY + 22, boxW - 44, boxH - 44, 8);
      for (let i = 0; i < 46; i++) {
        const r1 = this.chumRand(i, 1), r2 = this.chumRand(i, 2), r3 = this.chumRand(i, 3);
        m.fillStyle(r3 < 0.4 ? 0x6a4028 : r3 < 0.75 ? 0xc09a6a : 0xe0d0b0, 0.85);
        m.fillEllipse(boxX + 34 + r1 * (boxW - 70), boxY + 34 + r2 * (boxH - 70), 6 + r3 * 6, 4 + r3 * 4);
      }
      this.bodyContainer.add(m);
      const remain = this.scene.add.text(boxX + boxW / 2, boxY + boxH / 2, `${CoolerStore.chumRemaining} / 100`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '26px', color: '#fff2dc', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.92);
      this.bodyContainer.add(remain);
    } else {
      // 투입 순서대로 재료 쌓임
      CoolerStore.chumIngredients.forEach((ing, i) => this.drawIngredientPile(ing.kind, i));
      if (CoolerStore.chumWaterAdded) {
        const w = this.scene.add.graphics();
        w.fillStyle(0x9ac8e0, 0.30);
        w.fillRoundedRect(boxX + 20, boxY + 20, boxW - 40, boxH - 40, 8);
        this.bodyContainer.add(w);
      }
      if (CoolerStore.chumIngredients.length === 0) {
        const hint = this.scene.add.text(boxX + boxW / 2, boxY + boxH / 2, '비어있음\n재료를 여기로 드래그 앤 드랍', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#9a9a92', align: 'center', lineSpacing: 6,
        }).setOrigin(0.5);
        this.bodyContainer.add(hint);
      }
    }

    // ── 물 넣기 / 섞기 버튼 (각 1회) ──
    const canWater = !mixed && !CoolerStore.chumWaterAdded && CoolerStore.chumIngredients.length > 0;
    const canMix = !mixed && CoolerStore.chumWaterAdded && !CoolerStore.chumMixed;
    const btnY = boxY + boxH + 32;
    this.addChumButton(boxX + boxW / 2 - 120, btnY,
      CoolerStore.chumWaterAdded || mixed ? '물 넣기 (완료)' : '물 넣기', canWater, () => this.doChumWater());
    this.addChumButton(boxX + boxW / 2 + 120, btnY,
      mixed ? '섞기 (완료)' : '섞기', canMix, () => this.doChumMix());

    // ── 추천 배합 코멘트 (가장 많이 쓰는 현장 배합) ──
    const recipes = [
      '추천 배합 — 주걱으로 펐을 때 찰지게 뭉쳐지면 정상 비중',
      '① 국민 표준 (방파제·갯바위 5~10m): 크릴 3장 + 전용 파우더 1봉 + 압맥 1~2봉 — 집어력·탁도·침강 균형',
      '② 고수심·빠른 조류 (본류대·직벽 10m+): 크릴 3장 + 고비중 파우더 2봉 + 압맥 2~3봉 (+옥수수 1캔) — 단단히 뭉쳐 바닥까지',
      '③ 잡어 퇴치 (여름~가을): 잘게 부순 크릴 2장 + 파우더 2봉 + 압맥 3봉 + 옥수수 2캔 — 곡물 위주, 바늘엔 옥수수/깐새우/경단',
      '요령: 크릴은 반만 으깨기 · 바닷물을 조금씩 넣어 점도 조절 · 조류 상류에 품질해야 밑밥이 찌 지점 바닥에 동조',
    ];
    const rec = this.scene.add.text(boxX, btnY + 34, recipes.join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fc0d4',
      lineSpacing: 6, wordWrap: { width: boxW + 30 },
    });
    this.bodyContainer.add(rec);

    // ── 우측: 밑밥 재료 인벤토리 (드래그 앤 드랍 소스) ──
    this.renderChumInventory(560, this.contentTop + 56, PANEL_W - 560 - 24);
  }

  /** 결정적 의사 난수 (재료 인덱스 시드 — 재렌더에도 같은 자리) */
  private chumRand(idx: number, n: number): number {
    const s = Math.sin(idx * 127.1 + n * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  /** 통 안 재료 쌓임 렌더 — 투입 순서(idx)대로 겹쳐 쌓인다 */
  private drawIngredientPile(kind: ChumIngredientKind, idx: number): void {
    const { x: boxX, y: boxY, w: boxW, h: boxH } = UtilizationPanel.CHUM_BOX;
    const px = boxX + 60 + this.chumRand(idx, 1) * (boxW - 140);
    const py = boxY + 56 + this.chumRand(idx, 2) * (boxH - 110);
    const g = this.scene.add.graphics();
    if (kind === 'powder') {
      // 파우더/빵가루 — 부드러운 가루 더미 (짝수 tan / 홀수 적갈)
      const col = idx % 2 === 0 ? 0xd8c09a : 0xb0623e;
      g.fillStyle(col, 0.95);
      g.fillEllipse(px, py, 96, 54);
      g.fillEllipse(px - 22, py + 10, 60, 34);
      g.fillStyle(col === 0xd8c09a ? 0xe8d8b8 : 0xc47a52, 0.9);
      g.fillEllipse(px + 12, py - 8, 52, 28);
    } else if (kind === 'krill') {
      // 냉동 크릴 — 분홍 블록 두 덩어리
      g.fillStyle(0xe89aa8, 1);
      g.fillRoundedRect(px - 34, py - 16, 40, 30, 6);
      g.fillRoundedRect(px + 6, py - 4, 34, 26, 6);
      g.lineStyle(1.5, 0xc87a8a, 0.9);
      g.strokeRoundedRect(px - 34, py - 16, 40, 30, 6);
      g.strokeRoundedRect(px + 6, py - 4, 34, 26, 6);
      // 성에 하이라이트
      g.fillStyle(0xf8d8e0, 0.8);
      g.fillRect(px - 28, py - 12, 12, 4);
    } else {
      // 압맥/옥수수 — 낱알 흩뿌림
      for (let i = 0; i < 16; i++) {
        const r1 = this.chumRand(idx * 31 + i, 4), r2 = this.chumRand(idx * 31 + i, 5);
        g.fillStyle(i % 5 === 0 ? 0xe0c060 : 0xc8a878, 0.95);
        g.fillEllipse(px - 46 + r1 * 92, py - 26 + r2 * 52, 7, 5);
      }
    }
    this.bodyContainer.add(g);
  }

  private addChumButton(cx: number, cy: number, label: string, enabled: boolean, onClick: () => void): void {
    const g = this.scene.add.graphics();
    g.fillStyle(enabled ? 0x155a7c : 0x11202f, 0.95);
    g.fillRoundedRect(cx - 80, cy - 18, 160, 36, 5);
    g.lineStyle(1.5, enabled ? 0x5cd0ff : 0x22384e, 0.95);
    g.strokeRoundedRect(cx - 80, cy - 18, 160, 36, 5);
    const txt = this.scene.add.text(cx, cy, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', fontStyle: 'bold',
      color: enabled ? '#aee8ff' : '#546a7c',
    }).setOrigin(0.5);
    this.bodyContainer.add([g, txt]);
    if (!enabled) return;
    const hit = this.scene.add.rectangle(cx, cy, 160, 36, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
    this.bodyContainer.add(hit);
  }

  /** 물 넣기 — 1회. 푸른 물줄기 연출 후 상태 갱신 */
  private doChumWater(): void {
    const { x: boxX, y: boxY, w: boxW, h: boxH } = UtilizationPanel.CHUM_BOX;
    const fx = this.scene.add.container(0, 0);
    this.add(fx);
    for (let i = 0; i < 14; i++) {
      const drop = this.scene.add.ellipse(
        boxX + boxW / 2 - 40 + this.chumRand(i, 6) * 80, boxY - 34,
        6, 10, 0x66b8e8, 0.9);
      fx.add(drop);
      this.scene.tweens.add({
        targets: drop, y: boxY + 40 + this.chumRand(i, 7) * (boxH - 90),
        alpha: 0.2, delay: i * 45, duration: 420, ease: 'Quad.In',
      });
    }
    this.applyFix();
    this.scene.time.delayedCall(1000, () => {
      fx.destroy();
      CoolerStore.chumWaterAdded = true;
      this.renderBody();
    });
  }

  /** 섞기 — 1회. 혼합 연출 후 배합 완료 (밑밥 100 충전) */
  private doChumMix(): void {
    const { x: boxX, y: boxY, w: boxW, h: boxH } = UtilizationPanel.CHUM_BOX;
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x8a5a3c, 1);
    overlay.fillRoundedRect(boxX + 22, boxY + 22, boxW - 44, boxH - 44, 8);
    overlay.setAlpha(0);
    this.add(overlay);
    this.applyFix();
    this.scene.tweens.add({
      targets: overlay, alpha: 1, duration: 700, ease: 'Sine.InOut',
      onComplete: () => {
        overlay.destroy();
        CoolerStore.completeChumMix();
        this.renderBody();
      },
    });
  }

  /** 우측 밑밥 재료 인벤토리 — 드래그 소스 (소모품 중 chumKind 보유 아이템) */
  private renderChumInventory(x: number, y: number, w: number): void {
    const h = 470;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060d1a, 0.95);
    bg.fillRoundedRect(x, y, w, h, 6);
    bg.lineStyle(1.5, 0x2a5a8a, 0.9);
    bg.strokeRoundedRect(x, y, w, h, 6);
    this.bodyContainer.add(bg);

    const locked = CoolerStore.chumMixed || CoolerStore.chumRemaining > 0;
    const title = this.scene.add.text(x + 14, y + 10,
      locked ? '밑밥 재료 — 남은 밑밥을 다 쓰면 새로 배합할 수 있습니다' : '밑밥 재료 (통으로 드래그해서 투입)', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', fontStyle: 'bold',
        color: locked ? '#8faabf' : '#ffe28a',
      });
    this.bodyContainer.add(title);

    const items = InventoryStore.getByCategory('consumable').filter((i) => i.chumKind && i.qty > 0);
    const cell = 88, gap = 8;
    const kindLabel: Record<ChumIngredientKind, string> = { powder: '파우더', krill: '냉동 크릴', grain: '곡물' };
    items.forEach((item, idx) => {
      const cx = x + 14 + (idx % 5) * (cell + gap);
      const cy = y + 40 + Math.floor(idx / 5) * (cell + gap + 4);
      const sg = this.scene.add.graphics();
      sg.fillStyle(0x0e2a1e, 0.95);
      sg.fillRoundedRect(cx, cy, cell, cell, 5);
      sg.lineStyle(1, 0x2f7d5a, 0.9);
      sg.strokeRoundedRect(cx, cy, cell, cell, 5);
      this.bodyContainer.add(sg);
      this.bodyContainer.add(createItemIcon(this.scene, cx + cell / 2, cy + cell / 2 - 14, item, 36));
      const nm = this.scene.add.text(cx + cell / 2, cy + cell - 24, item.name, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#cfe3f2',
        wordWrap: { width: cell - 8 }, maxLines: 1,
      }).setOrigin(0.5);
      const kd = this.scene.add.text(cx + cell / 2, cy + cell - 12, kindLabel[item.chumKind!], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#8fb8d0',
      }).setOrigin(0.5);
      const q = this.scene.add.text(cx + cell - 6, cy + 4, `x${item.qty}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffe28a', fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.bodyContainer.add([nm, kd, q]);

      if (locked) return;
      const hit = this.scene.add.rectangle(cx + cell / 2, cy + cell / 2, cell, cell, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => this.startChumDrag(item, p));
      this.bodyContainer.add(hit);
    });

    if (items.length === 0) {
      const empty = this.scene.add.text(x + w / 2, y + h / 2, '밑밥 재료가 없습니다\n마트/편의점에서 파우더·냉동 크릴·압맥을 구매하세요', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7a98ac', align: 'center', lineSpacing: 6,
      }).setOrigin(0.5);
      this.bodyContainer.add(empty);
    }
  }

  private startChumDrag(item: InvItem, p: Phaser.Input.Pointer): void {
    if (CoolerStore.chumMixed || CoolerStore.chumRemaining > 0) return;
    this.chumDragItem = item;
    const ghost = this.scene.add.container(p.x, p.y).setDepth(this.depth + 20).setScrollFactor(0);
    ghost.add(createItemIcon(this.scene, 0, 0, item, 44));
    const lbl = this.scene.add.text(0, 32, item.name, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffe28a', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 6, y: 2 },
    }).setOrigin(0.5);
    ghost.add(lbl);
    ghost.iterate((c: Phaser.GameObjects.GameObject) => {
      (c as unknown as { setScrollFactor?: (v: number) => void }).setScrollFactor?.(0);
    });
    this.chumGhost = ghost;
  }

  /** 드랍 판정 — 통 안이면 재료 1개 소모 + 투입 연출 */
  private finishChumDrag(p: Phaser.Input.Pointer): void {
    const item = this.chumDragItem;
    if (!item) return;
    this.chumDragItem = null;
    this.chumGhost?.destroy();
    this.chumGhost = undefined;
    if (this.currentTab !== 'chum') return;

    const { x: bx, y: by, w: bw, h: bh } = UtilizationPanel.CHUM_BOX;
    const lx = p.x - this.x, ly = p.y - this.y;
    if (lx < bx || lx > bx + bw || ly < by || ly > by + bh) return;
    if (CoolerStore.chumMixed || CoolerStore.chumRemaining > 0 || !item.chumKind) return;
    if (!InventoryStore.removeQty(item.id, 1)) return;

    CoolerStore.addChumIngredient(item.chumKind, item.name);
    this.playChumPourAnim(item.chumKind, () => this.renderBody());
  }

  /**
   * 재료 투입 연출 — 종류별:
   *  powder: 봉투를 찢으며 우측 대각선에서 가루가 통 안으로 쏟아짐
   *  krill: 봉투에서 각설탕 모양 분홍 블록이 두 덩어리로 쪼개져 떨어짐
   *  grain: 봉투에서 연갈색 낱알들이 우수수 떨어짐
   */
  private playChumPourAnim(kind: ChumIngredientKind, done: () => void): void {
    const { x: boxX, y: boxY, w: boxW, h: boxH } = UtilizationPanel.CHUM_BOX;
    const fx = this.scene.add.container(0, 0);
    this.add(fx);

    // 봉투 (우상단 대각 — 기울여 붓는 자세)
    const bagX = boxX + boxW - 36, bagY = boxY - 34;
    const bag = this.scene.add.container(bagX, bagY).setRotation(-0.62);
    const bagG = this.scene.add.graphics();
    bagG.fillStyle(0xcfd6dc, 1);
    bagG.fillRoundedRect(-16, -30, 32, 56, 5);
    bagG.lineStyle(1.5, 0x8a98a4, 1);
    bagG.strokeRoundedRect(-16, -30, 32, 56, 5);
    // 찢어진 입구
    bagG.fillStyle(0x6a7884, 1);
    bagG.fillTriangle(-16, 26, -4, 20, -12, 32);
    bag.add(bagG);
    fx.add(bag);
    // 봉투 기울이는 흔들림
    this.scene.tweens.add({ targets: bag, rotation: -0.78, duration: 260, yoyo: true, repeat: 1 });

    const mouthX = bagX - 20, mouthY = bagY + 26;

    if (kind === 'powder') {
      for (let i = 0; i < 26; i++) {
        const grain = this.scene.add.rectangle(mouthX, mouthY, 5, 5,
          i % 3 === 0 ? 0xe8d8b8 : 0xb0623e, 0.95);
        fx.add(grain);
        this.scene.tweens.add({
          targets: grain,
          x: boxX + 70 + this.chumRand(i, 8) * (boxW - 160),
          y: boxY + 50 + this.chumRand(i, 9) * (boxH - 100),
          alpha: 0.75, delay: i * 26, duration: 430, ease: 'Quad.In',
        });
      }
    } else if (kind === 'krill') {
      // 분홍 블록 하나가 둘로 쪼개지며 낙하
      [-1, 1].forEach((side, i) => {
        const block = this.scene.add.rectangle(mouthX, mouthY, 34, 26, 0xe89aa8, 1)
          .setStrokeStyle(1.5, 0xc87a8a);
        fx.add(block);
        this.scene.tweens.add({
          targets: block,
          x: boxX + boxW / 2 + side * (40 + this.chumRand(i, 10) * 50),
          y: boxY + boxH / 2 + this.chumRand(i, 11) * 50,
          rotation: side * 0.7, delay: 120 + i * 90, duration: 520, ease: 'Bounce.Out',
        });
      });
    } else {
      for (let i = 0; i < 22; i++) {
        const grain = this.scene.add.ellipse(mouthX, mouthY, 7, 5, i % 5 === 0 ? 0xe0c060 : 0xc8a878, 0.95);
        fx.add(grain);
        this.scene.tweens.add({
          targets: grain,
          x: boxX + 60 + this.chumRand(i, 12) * (boxW - 140),
          y: boxY + 46 + this.chumRand(i, 13) * (boxH - 92),
          delay: i * 22, duration: 470, ease: 'Quad.In',
        });
      }
    }

    this.applyFix();
    this.scene.time.delayedCall(1050, () => {
      fx.destroy();
      done();
    });
  }

  override destroy(fromScene?: boolean): void {
    this.closeChooser();
    this.scene?.input?.off('pointermove', this.chumMoveHandler);
    this.scene?.input?.off('pointerup', this.chumUpHandler);
    this.chumGhost?.destroy();
    super.destroy(fromScene);
  }
}
