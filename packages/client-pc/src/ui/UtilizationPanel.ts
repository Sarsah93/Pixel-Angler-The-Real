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
  isHookItem, isBaitItem, isLureItem, isWeightSinker, isSplitShot, isJigHeadItem,
  SpreaderKind, CardRigType, SPREADER_LABEL, CARD_RIG_INFO,
} from '../store/InventoryStore.js';
import { RecommendationStore } from '../store/RecommendationStore.js';
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
  /** 루어 채비 트리 네비게이션 상태 */
  private lureFamily: LureFamily = 'soft';
  private lureKindSel: LureKind = 'worm_grub';

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

  override destroy(fromScene?: boolean): void {
    this.closeChooser();
    super.destroy(fromScene);
  }
}
