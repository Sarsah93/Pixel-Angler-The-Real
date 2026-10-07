/**
 * @file UtilizationPanel.ts
 * @description 활용 창 (U 키 — 전체 화면 전환 상태, 상단 탭: 요리하기 / 채비하기 / 밑밥 품질)
 *
 * 채비하기(Tackles):
 *  실제 바다낚시 채비 순서 [원줄 → 면사매듭 → 부력찌 → 수중찌 → 도래 → 목줄 → 봉돌 → 바늘&미끼]
 *  대로 소켓을 클릭해 인벤토리의 부품을 조립한다. 부력찌(구멍찌/기울찌/잠길찌/제로찌)와
 *  수중찌는 **별도 소켓** — 수중찌는 부력에 대한 마이너스 침력으로 채비 하강을 유도하는
 *  선택 부품이다 (제로찌 상층 공략 시 수중찌 없이 좁쌀+바늘 무게만으로 운용 가능).
 *  면사매듭은 수심 한계(Z_limit)를 -/+ 로 조절하며, 조립 스펙(총 무게/침강 속도/
 *  최대 공략 수심)이 실시간 합산된다. (낚싯대 우클릭 → '채비하기' 로도 진입)
 *
 * 요리하기(Cooking):
 *  우측 인벤토리 어획물을 좌측 도마로 드래그(넣기/빼기/교환) → [손질 시작] → ButcheryPanel
 *  회 뜨기 미니게임. finfish 활성 / 두족류·복어는 준비중 스텁 (getButcheryFamily 게이트).
 *
 * 밑밥 품질(Chum):
 *  좌측 밑밥 통(탑뷰)에 우측 인벤토리의 재료(파우더/냉동 크릴/압맥·옥수수)를
 *  드래그 앤 드랍으로 투입(종류별 붓기 연출) → 물 넣기(1회) → 섞기(1회) →
 *  배합 완료 시 밑밥 100 충전 (1인칭 C 투척 1회당 25 소모). 하단에 추천 배합 코멘트.
 */

import Phaser from 'phaser';
import { enforceTextBounds } from './TextFit.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import {
  InventoryStore, InvItem, InvCategory, RigStepKey,
  CATEGORY_LABEL, CONDITION_LABEL, CONDITION_COLOR,
  isBaitItem, isLureItem, isWeightSinker,
  PlateWipData, plateWipProgress, worstCondition, refreshCondition,
} from '../store/InventoryStore.js';
import { partKindOf, baitKeyOf } from '../store/RigParts.js';
import { clampTextWidth, fitTextHeight } from './TextFit.js';
import { RecommendationStore } from '../store/RecommendationStore.js';
import { CoolerStore, ChumIngredientKind, CHUM_THROW_COST } from '../store/CoolerStore.js';
import {
  RIG_SLOTS, KIT_DEFS, nodeFilled, nodeOptional, nodeLabel, baitRecommendedFor, type RigNode,
  getButcheryFamily, BUTCHERY_FAMILY_NOTICE, ButcheryFamily, canButcherSpecies,
  getBestKnife, SashimiMode, SASHIMI_MODES,
  SASHIMI_PLATE_SPECS, MIXED_SASHIMI_PRICING, singleSashimiPlatePrice, SashimiSizeTier,
  sashimiStarsAt, sashimiStarPriceMult, sashimiPlateName, quadBalanceOf, type SashimiPlateMeta,
  evaluateFishSellPrice, FISH_DATABASE,
} from '@tra/core';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { ButcheryPanel } from './ButcheryPanel.js';
import { SashimiPanel } from './SashimiPanel.js';
import { GuidePanel } from './GuidePanel.js';
import { ConfirmDialog } from './Dialogs.js';
import { makeFishPreview } from './FishTemplateRenderer.js';
import { butcherFamilyOf } from './PixelButcherFish.js';
import { createItemIcon } from './ItemIcon.js';
import { setSlotLabel, SLOT_LABEL_PX } from './SlotLabel.js';
import { CraftBoard } from './CraftBoard.js';
import { GameState } from '../store/GameState.js';
import { TitleStore } from '../store/TitleStore.js';
import { maybeStartTour, tourSeen, type TourOptions } from './GuideTour.js';
import { t } from '../i18n/I18n.js';

/** 추천 배너용 미끼 이름 (RigRecommender의 BaitKey → 화면 이름, R1) */
const BAIT_KEY_KO: Record<string, string> = {
  krill: '크릴', worm_blue: '청갯지렁이', worm_king: '참갯지렁이', crab: '게·소라', shellfish: '조개살',
  urchin: '성게', corn: '옥수수', bread: '빵가루 경단', fishcut: '생선 살', livefish: '생미끼', slater: '갯강구', lure: '루어',
};

export type UtilizationTab = 'cooking' | 'tackles' | 'chum' | 'craft';

/** 224차 — 빵가루 밑밥 한 번 갤 때 뭉쳐 두는 미끼 경단 수(200g ≈ 10개 — 사용자 제안) */
const BREAD_BALLS_PER_MIX = 10;
const PANEL_W = 1080;
const PANEL_H = 620;

/** 선택 리스트 행 서술자 (부품/미끼 선택 공용) */
type ChooserRow = { text: string; onPick: () => void; recommended?: boolean; muted?: boolean };

/** 192차 — 채비 체인 칸 배치: 한 행에 9칸, 넘치면 다음 행으로 꺾인다 */
const NODE_W = 104;
const NODE_H = 104;
const NODE_GAP = 12;
const CHAIN_PER_ROW = 9;
const CHAIN_ROW_H = NODE_H + 22;

export class UtilizationPanel extends DraggablePanel {
  private currentTab: UtilizationTab;
  private tabBgs = new Map<UtilizationTab, Phaser.GameObjects.Graphics>();
  private tabTexts = new Map<UtilizationTab, Phaser.GameObjects.Text>();
  private bodyContainer!: Phaser.GameObjects.Container;
  /** 제작 보드 (129차 P7) — 씬 레벨 휠 핸들러를 잡으므로 탭 전환·파괴 시 반드시 destroy */
  private craftBoard?: CraftBoard;
  private chooser?: Phaser.GameObjects.Container;
  /** 열린 선택 리스트의 휠 스크롤 핸들러 (닫을 때 해제) */
  private chooserWheel?: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;
  /** 요리 탭 임베드 인벤토리 — 현재 카테고리/선택 아이템 */
  private cookInvCat: InvCategory = 'food';
  private cookSelectedId: string | null = null;
  /** 도마에 올린 생선 아이템 id (손질 프로필 보유 어획물) */
  private cookBoardFishId: string | null = null;
  /** 도마 영역 (패널 로컬 좌표 — 드랍 판정용) */
  private cookBoardRect = { x: 0, y: 0, w: 0, h: 0 };
  /** 드래그 중 생선 고스트 (실사 이미지 or 파라메트릭 컨테이너) */
  private dragGhost?: Phaser.GameObjects.Container;
  /** 드래그 중 도마 드롭존 하이라이트 (renderCooking에서 생성, drag 핸들러가 토글) */
  private cookBoardHighlight?: Phaser.GameObjects.Graphics;
  /** 도마 안내 토스트 (일시 표시) */
  private boardToast?: Phaser.GameObjects.Text;
  /** 교환 확인 모달 */
  private swapConfirm?: ConfirmDialog;
  /** 열린 선택 리스트의 패널 로컬 사각형 (가이드 하이라이트용 — 188차) */
  private chooserRect: { x: number; y: number; w: number; h: number } | null = null;
  /** 채비 탭 제원 상자 상단 y (패널 로컬 — 가이드 하이라이트용) */
  private tourSpecY = 0;
  private tourSpecH = 150;
  /** 192차 — 체인 영역 상단 y·행 수 (가이드 사각형 계산용) */
  private chainTop = 0;
  private chainRows = 1;
  /** 193차 — 이번 렌더에서 처음 그린 x2 단추(첫 노출 가이드의 짚을 자리) */
  private doubleBtnFirst: Phaser.Geom.Rectangle | null = null;
  /** 회 뜨기 손질 자식 팝업 */
  private butcheryPanel?: ButcheryPanel;
  private sashimiPanel?: SashimiPanel;

  // ── 사시미 만들기 (접시 플레이팅 — 2026-08-03 사용자 도식) ──
  /** 도마 아래 서브 영역 상태 — 'sashimi' = 사시미 만들기 확장 */
  private cookSub: 'none' | 'sashimi' = 'none';
  /** 장착된 접시 + 배치 상태 (세션 메모리 — 패널 destroy 시 접시/조각 반환) */
  private plateState: {
    tmpl: InvItem;                       // 접시 아이템 스냅샷 (반환용)
    size: SashimiSizeTier;
    rotation: number;                    // 0..3 — 접시 돌리기 (활성 방위 = quads[rotation])
    quads: { tmpl: InvItem; speciesId: string; weightG: number; adv: boolean }[][];   // [우상,좌상,좌하,우하]
  } | null = null;
  /** 접시 드롭 판정 rect (패널 로컬) */
  private plateAreaRect = { x: 0, y: 0, w: 0, h: 0 };
  private cookHelpPopup?: Phaser.GameObjects.Container;
  /**
   * 도마 조각 스테이징 — 회썰기 완료 시 썰린 조각들이 **도마 위에 그대로 진열**되고
   * 한 점씩 아래 접시로 드래그한다 (사용자 도식 2026-08-04. 조각 재고 = 인벤 스택과 동기).
   */
  private boardSlicedItemId: string | null = null;
  /** 통합 가이드 팝업 (최초 회뜨기 — '회뜨기' 탭 1회 자동 표시) */
  private guideHubPanel?: GuidePanel;

  // ── 밑밥 품질 탭 드래그 상태 ──
  private chumDragItem: InvItem | null = null;
  private chumGhost?: Phaser.GameObjects.Container;
  private chumMoveHandler = (p: Phaser.Input.Pointer): void => {
    this.chumGhost?.setPosition(p.x, p.y);
  };
  private chumUpHandler = (p: Phaser.Input.Pointer): void => {
    this.finishChumDrag(p);
  };

  // ── 요리 탭 도마 드래그 상태 (Phaser 네이티브 draggable은 scrollFactor 0 UI에서
  //    scroll 씬 하에 drag 이벤트가 안 오므로, 밑밥 탭과 동일한 커스텀 포인터 방식 사용) ──
  private cookDragItem: InvItem | null = null;
  private cookDragMode: 'add' | 'remove' = 'add';
  private cookDragStart = { x: 0, y: 0 };
  private cookDragging = false;
  private cookMoveHandler = (p: Phaser.Input.Pointer): void => this.onCookDragMove(p);
  private cookUpHandler = (p: Phaser.Input.Pointer): void => this.onCookDragUp(p);

  constructor(scene: Phaser.Scene, onClose: () => void, initialTab: UtilizationTab = 'tackles') {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2,
      y: (GAME_HEIGHT - PANEL_H) / 2,
      width: PANEL_W, height: PANEL_H,
      title: '채비 · 요리',
      onClose, dim: true, depth: 840,
    });
    this.currentTab = initialTab;

    this.buildTabs();
    this.bodyContainer = scene.add.container(0, 0);
    this.add(this.bodyContainer);
    this.renderBody();

    // 밑밥 재료 / 요리 도마 드래그 앤 드랍 (씬 레벨 포인터 추적)
    scene.input.on('pointermove', this.chumMoveHandler);
    scene.input.on('pointerup', this.chumUpHandler);
    scene.input.on('pointermove', this.cookMoveHandler);
    scene.input.on('pointerup', this.cookUpHandler);
    // 188차 — 첫 열기 체험 가이드
    maybeStartTour(scene, () => this.buildTour());
  }

  // ═══════════════════════════════════════════════════
  // 첫 열기 가이드 (188차 — tour id 'utilization')
  //  새 캐릭터는 낚싯대·릴만 갖고 시작한다 — 부품이 없으면 「칸을 눌러 목록 열기」까지만
  //  직접 해 보고, 「골라 달기」는 설명으로 바뀐다. 상점에서 부품을 사 온 뒤라면 직접 단다.
  // ═══════════════════════════════════════════════════
  private tabRectOf(i: number): Phaser.Geom.Rectangle {
    return this.localRect(20 + i * (180 + 8), this.contentTop + 4, 180, 34);
  }

  private socketChainRect(): Phaser.Geom.Rectangle {
    const n = Math.min(CHAIN_PER_ROW, InventoryStore.rigTree.nodes.length);
    return this.localRect(24, this.chainTop, n * NODE_W + (n - 1) * NODE_GAP, this.chainRows * CHAIN_ROW_H - 22);
  }

  private buildTour(): TourOptions {
    const tackles = (): boolean => this.currentTab === 'tackles';
    const hasLine = (): boolean => InventoryStore.items.some((i) => partKindOf(i) === 'main_line');
    const nodeRect = (i: number): Phaser.Geom.Rectangle => { const r = this.rigNodeRect(i); return this.localRect(r.x, r.y, r.width, r.height); };
    const chooserScreen = (): Phaser.Geom.Rectangle | null =>
      this.chooserRect ? this.localRect(this.chooserRect.x, this.chooserRect.y, this.chooserRect.w, this.chooserRect.h) : null;
    return {
      id: 'utilization',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [
        {
          text: '이 창에서는 낚시 채비를 꾸리고, 잡은 고기를 손질하고, 밑밥을 섞고, 필요한 물건을 만든다. 위 탭으로 할 일을 고른다.',
          target: () => this.localRect(20, this.contentTop + 4, 4 * 180 + 3 * 8, 34),
        },
        {
          text: '먼저 채비부터 꾸려 보자. 「채비하기」를 누르자.',
          target: () => this.tabRectOf(1),
          skipIf: () => this.currentTab === 'tackles',
          wait: () => this.currentTab === 'tackles',
        },
        {
          text: '채비는 「원줄」 한 칸에서 시작한다. 칸에 무엇을 다느냐에 따라 오른쪽에 다음 칸이 열린다 — 직접 엮어 가는 방식이다.',
          target: () => this.socketChainRect(),
          skipIf: () => !tackles(),
        },
        {
          text: '첫 칸 「원줄」을 눌러 보자. 가방 속에서 그 칸에 달 수 있는 것만 골라 보여 준다.',
          target: () => nodeRect(0),
          skipIf: () => !tackles() || InventoryStore.rigLocked,
          wait: () => !!this.chooser,
        },
        {
          text: '목록에서 원줄 하나를 골라 달아 보자.',
          target: () => chooserScreen() ?? nodeRect(0),
          allow: () => [chooserScreen(), nodeRect(0)],
          skipIf: () => !tackles() || InventoryStore.rigLocked || !hasLine() || !this.chooser,
          wait: () => !this.chooser && !!InventoryStore.rig.mainLine,
        },
        {
          text: '아직 달 부품이 없다. 가게에서 원줄 · 바늘 · 봉돌 · 찌 · 미끼를 사 오면 여기서 골라 단다.',
          target: () => chooserScreen() ?? this.socketChainRect(),
          skipIf: () => !tackles() || hasLine(),
        },
        {
          text: '원줄을 달면 「매듭」 칸이 열린다. 직결로 목줄을 바로 묶거나, 도래를 달아 간편 채비를 걸 수 있다. 앞 칸을 바꾸면 그 뒤에 달렸던 것은 전부 풀린다.',
          target: () => nodeRect(Math.min(2, InventoryStore.rigTree.nodes.length - 1)),
          skipIf: () => !tackles() || !InventoryStore.rig.mainLine,
          onEnter: () => this.closeChooser(),
        },
        {
          text: '부품을 달 때마다 아래 상자에서 채비 무게와 가라앉는 속도, 닿는 수심이 다시 계산된다. 금색 「추천」은 지금 자리에 맞는 부품이 가방에 있다는 뜻이다.',
          target: () => this.localRect(24, this.tourSpecY, PANEL_W - 48, this.tourSpecH),
          skipIf: () => !tackles(),
          onEnter: () => this.closeChooser(),
        },
        {
          text: '채비를 다 꾸몄으면 「채비 고정」으로 잠근다. 고정한 채비는 던질 때 미끼 같은 소모품만 줄어들고, 실수로 바뀌지 않는다.',
          target: () => this.localRect(PANEL_W - 36 - 60 - 128 - 60, this.tourSpecY + this.tourSpecH - 44, 128 + 120, 36),
          skipIf: () => !tackles(),
        },
        {
          text: '「요리하기」에서는 오른쪽 가방의 고기를 도마로 끌어다 올려 손질하고, 「밑밥 품질」에서는 재료를 통에 넣어 밑밥을 섞는다.',
          target: () => this.localRect(20, this.contentTop + 4, 3 * 180 + 2 * 8, 34),
          onEnter: () => this.closeChooser(),
        },
      ],
    };
  }

  // ── 상단 탭 (요리하기 / 채비하기) ─────────────────────
  private buildTabs(): void {
    const defs: { id: UtilizationTab; label: string }[] = [
      { id: 'cooking', label: '요리하기 (Cooking)' },
      { id: 'tackles', label: '채비하기 (Tackles)' },
      { id: 'chum',    label: '밑밥 품질 (Chum)' },
      { id: 'craft',   label: '제작 (Crafting)' },
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
        if (def.id !== 'craft') { this.craftBoard?.destroy(); this.craftBoard = undefined; }
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
    (['cooking', 'tackles', 'chum', 'craft'] as UtilizationTab[]).forEach((id, i) => {
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
    else if (this.currentTab === 'craft') this.renderCrafting();
    else this.renderCooking();
    // 마지막 방어선 — 어떤 텍스트도 패널 우측 경계 밖으로 못 나간다 (117차 피드백 5)
    enforceTextBounds(this.bodyContainer, PANEL_W - 20, 'UtilizationPanel');
    this.applyFix();
  }

  // ═══════════════════════════════════════════════════
  // 채비하기 (Tackles)
  // ═══════════════════════════════════════════════════
  private renderTackles(): void {
    const top = this.contentTop + 44;
    const reco = RecommendationStore.get();

    // ── 추천 배너 (지역/지형/물때/대상어종 반영) — 조법·찌·봉돌·미끼 한 줄 ──
    const recoParts: string[] = [`조법 ${reco.techniqueLabel}`];
    if (reco.floatHo !== undefined) recoParts.push(`찌 ${reco.floatHo}호`);
    if (reco.sinkerKind && reco.sinkerHoRange) {
      const kindKo = reco.sinkerKind === 'hole' ? '구멍' : reco.sinkerKind === 'bundle' ? '묶음추' : '고리';
      recoParts.push(`봉돌 ${kindKo} ${reco.sinkerHoRange[0]}~${reco.sinkerHoRange[1]}호`);
    }
    // 187차 — 구: 내부 키(`worm_blue·krill`)가 그대로 보였다(R1)
    if (reco.baitKeys.length) recoParts.push(`미끼 ${reco.baitKeys.slice(0, 2).map((k) => BAIT_KEY_KO[k] ?? k).join('·')}`);
    const recoText = this.scene.add.text(24, top,
      `추천 (${reco.targetNames.join('·') || '지역 대상어'}): ${recoParts.join(' · ')}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffd257', fontStyle: 'bold',
      });
    this.bodyContainer.add(recoText);

    // ── 채비 체인 (192차 — 원줄 하나에서 출발해 고른 것에 따라 오른쪽으로 칸이 열린다) ──
    const nodes = InventoryStore.rigTree.nodes;
    const summary = InventoryStore.rigSummary();
    this.doubleBtnFirst = null;
    const chainY = top + 26;
    this.chainTop = chainY;
    this.chainRows = Math.max(1, Math.ceil(nodes.length / CHAIN_PER_ROW));
    nodes.forEach((n, i) => this.renderRigNode(n, i, chainY));

    // 끝이 열린 자리 표시 — 마지막 칸 뒤에 「다음 칸이 열린다」 힌트(값을 넣으면 사라진다)
    const last = nodes[nodes.length - 1];
    if (last && !nodeFilled(last)) {
      // 비어 있는 마지막 칸이 곧 다음 할 일 — 별도 표시 없음
    }

    // ── 제원 스펙 컨테이너 (실시간 합산) ──
    const sumY = chainY + this.chainRows * CHAIN_ROW_H + 6;
    this.tourSpecY = sumY;
    const sbW = PANEL_W - 48;
    const sbH = Math.max(110, Math.min(150, PANEL_H - sumY - 14));
    this.tourSpecH = sbH;
    const sbg = this.scene.add.graphics();
    sbg.fillStyle(0x060d1a, 0.95);
    sbg.fillRoundedRect(24, sumY, sbW, sbH, 5);
    sbg.lineStyle(1.5, 0xc8a060, 0.9);
    sbg.strokeRoundedRect(24, sumY, sbW, sbH, 5);
    this.bodyContainer.add(sbg);
    this.renderRigLockButtons(sumY + sbH - 44);   // 155차 — 제원 상자 안 우측 하단
    // 193차 — x2 단추가 처음 보이면 한 번만 짚어 준다(R11 — 단추 자체에는 설명을 박지 않는다)
    if (this.doubleBtnFirst && !tourSeen('double_bait')) {
      maybeStartTour(this.scene, () => {
        const b = this.doubleBtnFirst;
        if (!b || this.currentTab !== 'tackles') return null;
        return {
          id: 'double_bait',
          anchor: () => this.panelBounds(),
          alive: () => this.active && this.currentTab === 'tackles',
          steps: [{
            text: '「한 바늘에 두 미끼」를 배웠다. 미끼 칸 아래 x2를 켜면 같은 미끼를 두 마리 꿴다 — 던질 때마다 두 개씩 줄지만 입질이 조금 오른다.',
            target: () => (this.doubleBtnFirst ? this.localRect(this.doubleBtnFirst.x, this.doubleBtnFirst.y, this.doubleBtnFirst.width, this.doubleBtnFirst.height) : null),
          }],
        };
      });
    }

    const spec = this.computeRigSpec();
    // 193차 — 미끼 수·같은 미끼 시너지·두 미끼로 오른 입질을 제목 줄 끝에 붙인다(4번째 줄을 늘리면 안내문과 겹친다)
    const titleParts = ['채비 물리 스펙 (실시간 합산)'];
    if (summary.kit) titleParts.push(KIT_DEFS[summary.kit].label);
    if (summary.biteBonus > 0) titleParts.push(`입질 +${Math.round(summary.biteBonus * 100)}%`);
    const title = this.scene.add.text(40, sumY + 10, titleParts.join(' · '), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffe28a', fontStyle: 'bold',
    });
    this.bodyContainer.add(title);
    const lines = [
      `총 무게: ${spec.weightG.toFixed(2)} g`,
      `부력 합: ${spec.buoyG.toFixed(2)} g 상당`,
      `침강 속도 (V_z): ${spec.sinkMps.toFixed(2)} m/s`,
      `공기 저항 계수 (C_d): ${spec.dragCd.toFixed(2)}`,
      `최대 공략 수심 (Z_limit): ${InventoryStore.hasFloatStop && summary.floatId ? `${InventoryStore.rigDepthLimitM} m` : '제한 없음 (바닥까지)'}`,
      `라인 인장: ${InventoryStore.lineCapacityKg()?.toFixed(1) ?? '-'} kg`,
    ];
    const colW = [330, 330];
    const colY = [sumY + 34, sumY + 34];
    const rowPitch = sbH >= 140 ? 22 : 18;
    lines.forEach((line, i) => {
      const col = i < 3 ? 0 : 1;
      const t = this.scene.add.text(40 + col * 350, colY[col], line, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#d0e8f5', wordWrap: { width: colW[col] },
      });
      this.bodyContainer.add(t);
      colY[col] += rowPitch;
    });
    const adviceColor = spec.advice.includes('비었습니다') || spec.advice.includes('과부하') ? '#ff9a6a'
      : summary.offRecommendedBait ? '#ffb36a' : '#7fe6b0';
    const advice = summary.offRecommendedBait && !spec.advice.includes('비었습니다')
      ? '권장되는 채비 유형이 아닙니다 — 이 세트는 다른 미끼를 쓰면 대상어종이 거의 물지 않는다.'
      : summary.flasherOnly && !spec.advice.includes('비었습니다')
        ? '반짝이 바늘만 달린 채비 — 미끼가 없어 전갱이만 작은 멸치로 보고 덤빈다.'
        : spec.advice;
    this.bodyContainer.add(this.scene.add.text(40, sumY + sbH - 22, advice, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: adviceColor, wordWrap: { width: sbW - 32 - 300 },
    }).setOrigin(0, 0.5));
  }

  /** 체인 칸 하나의 패널 로컬 사각형 */
  private rigNodeRect(i: number): Phaser.Geom.Rectangle {
    const row = Math.floor(i / CHAIN_PER_ROW), col = i % CHAIN_PER_ROW;
    return new Phaser.Geom.Rectangle(24 + col * (NODE_W + NODE_GAP), this.chainTop + row * CHAIN_ROW_H, NODE_W, NODE_H);
  }

  /** 칸이 받는 아이템인가 (가방에서 고를 후보) */
  private nodeAccepts(n: RigNode, item: InvItem): boolean {
    const def = RIG_SLOTS[n.slot];
    if (def.type !== 'item' || !def.accepts) return false;
    const kind = partKindOf(item);
    return !!kind && def.accepts.includes(kind);
  }

  /** 칸·아이템 기준 「추천」 — 세트 권장 미끼 > 지역 추천(찌·봉돌·미끼) */
  private nodeRecommends(n: RigNode, item: InvItem): boolean {
    const reco = RecommendationStore.get();
    if (n.slot === 'bait') {
      if (n.kit && KIT_DEFS[n.kit].recommendedBaits?.length) return baitRecommendedFor(n.kit, baitKeyOf(item));
      return RecommendationStore.isBaitRecommended(item, reco);
    }
    if (n.slot === 'float') return RecommendationStore.isFloatRecommended(item, reco);
    if (n.slot === 'sliding_sinker' || n.slot === 'bundle_kit' || n.slot === 'tbar_sinker') return RecommendationStore.isSinkerRecommended(item, reco);
    return false;
  }

  /** 체인 칸 하나 — 라벨 · 그림 · 이름 · 상태 테두리 · 클릭 */
  private renderRigNode(n: RigNode, i: number, _chainY: number): void {
    const r = this.rigNodeRect(i);
    const def = RIG_SLOTS[n.slot];
    const filled = nodeFilled(n);
    const optional = nodeOptional(n);
    const fixed = def.type === 'fixed';
    const item = n.itemId ? InventoryStore.find(n.itemId) : undefined;

    // 바탕 — 채움(초록) / 필수 빈 칸(주황) / 선택 빈 칸(어두운 파랑) / 고정(회색)
    const box = this.scene.add.graphics();
    const wantBait = n.slot === 'bait' && !filled && InventoryStore.getMissingRigParts().includes('미끼');
    const fill = fixed ? 0x141a22 : filled ? 0x0e2a1e : optional && !wantBait ? 0x0e1824 : 0x1a1a0e;
    const stroke = fixed ? 0x3a4652 : filled ? 0x2f7d5a : optional && !wantBait ? 0x2a4a6a : 0xd08a3a;
    box.fillStyle(fill, 0.95);
    box.fillRoundedRect(r.x, r.y, r.width, r.height, 5);
    box.lineStyle(1.5, stroke, 0.95);
    box.strokeRoundedRect(r.x, r.y, r.width, r.height, 5);
    this.bodyContainer.add(box);

    // 라벨
    const lbl = this.scene.add.text(r.x + r.width / 2, r.y + 12, nodeLabel(n), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: fixed ? '#8a98a6' : '#c8a060', fontStyle: 'bold',
    }).setOrigin(0.5);
    clampTextWidth(lbl, r.width - 8);
    this.bodyContainer.add(lbl);

    // 가운데 그림 — 아이템 아이콘 / 고정 부품 아이콘 / 갈래 글리프
    const cy = r.y + r.height / 2 - 6;
    if (item) {
      this.bodyContainer.add(createItemIcon(this.scene, r.x + r.width / 2, cy, item, 40));
    } else if (fixed) {
      const tex = n.fixedIcon && this.scene.textures.exists(n.fixedIcon) ? n.fixedIcon : undefined;
      if (tex) {
        this.bodyContainer.add(createItemIcon(this.scene, r.x + r.width / 2, cy, { iconTexture: tex, icon: '', name: n.fixedLabel ?? '' }, 36));
      }
    } else if (def.type === 'choice') {
      const glyph = this.scene.add.text(r.x + r.width / 2, cy, n.choice ? '◆' : '?', {
        fontFamily: 'monospace', fontSize: n.choice ? '22px' : '26px', color: n.choice ? '#7fe6b0' : '#d08a3a',
      }).setOrigin(0.5);
      this.bodyContainer.add(glyph);
    } else if (def.type === 'toggle') {
      const glyph = this.scene.add.text(r.x + r.width / 2, cy, n.on === false ? '—' : '●', {
        fontFamily: 'monospace', fontSize: '22px', color: n.on === false ? '#607b8e' : '#7fe6b0',
      }).setOrigin(0.5);
      this.bodyContainer.add(glyph);
    } else {
      const glyph = this.scene.add.text(r.x + r.width / 2, cy, '+', {
        fontFamily: 'monospace', fontSize: '26px', color: optional ? '#3a5a7a' : '#d08a3a',
      }).setOrigin(0.5);
      this.bodyContainer.add(glyph);
    }

    // 이름 줄
    let name: string;
    let nameColor = '#e8f4fd';
    // 193차 — 미끼가 하나도 없으면(반짝이 바늘 제외) 빈 미끼 칸을 전부 주황으로 — 아무 바늘에나 하나 끼우면 된다
    const needBait = n.slot === 'bait' && !item && InventoryStore.getMissingRigParts().includes('미끼');
    if (item) name = n.slot === 'bait' && n.double && InventoryStore.doubleBaitAllowed() ? `${item.name} 두 마리` : item.name;
    else if (fixed) { name = '고정'; nameColor = '#7a8894'; }
    else if (def.type === 'choice') {
      name = n.choice ? (def.options?.find((o) => o.id === n.choice)?.label ?? n.choice) : '선택';
      if (!n.choice) nameColor = '#ffb36a';
    } else if (def.type === 'toggle') { name = n.on === false ? '뺌 (전유동)' : '묶음'; }
    else if (needBait) { name = '비어 있음'; nameColor = '#ffb36a'; }
    else { name = optional ? '비어 있음 (선택)' : '비어 있음'; nameColor = optional ? '#6f8ba0' : '#ffb36a'; }
    const nm = this.scene.add.text(r.x + r.width / 2, r.y + r.height - 16, name, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: nameColor, align: 'center',
      wordWrap: { width: r.width - 8 },
    }).setOrigin(0.5);
    fitTextHeight(nm, 30);
    this.bodyContainer.add(nm);

    // 「추천」 배지 — 유효 부품 미장착 + 추천 후보가 가방에 있으면
    if (!fixed && def.type === 'item' && !item && InventoryStore.items.some((it) => this.nodeAccepts(n, it) && this.nodeRecommends(n, it))) {
      const rb = this.scene.add.text(r.x + r.width - 5, r.y + 4, '추천', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#0b1f14',
        backgroundColor: '#ffd257', padding: { x: 3, y: 1 }, fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.bodyContainer.add(rb);
    }
    // 비권장 미끼 표식
    if (item && n.slot === 'bait' && n.kit && KIT_DEFS[n.kit].recommendedBaits?.length && !baitRecommendedFor(n.kit, baitKeyOf(item))) {
      const warn = this.scene.add.text(r.x + r.width - 5, r.y + 4, '비권장', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#2a1206',
        backgroundColor: '#ffb36a', padding: { x: 3, y: 1 }, fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.bodyContainer.add(warn);
    }

    // 연결선 — 같은 행이면 → · 행 끝이면 ↵
    const col = i % CHAIN_PER_ROW;
    const nodes = InventoryStore.rigTree.nodes;
    if (i < nodes.length - 1) {
      const endOfRow = col === CHAIN_PER_ROW - 1;
      const arrow = this.scene.add.text(endOfRow ? r.x + r.width / 2 : r.x + r.width + NODE_GAP / 2, endOfRow ? r.y + r.height + 10 : r.y + r.height / 2,
        endOfRow ? '↓' : '→', { fontSize: '16px', color: '#4a6a8a' }).setOrigin(0.5);
      this.bodyContainer.add(arrow);
    }

    if (fixed) return;
    const hit = this.scene.add.rectangle(r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.onRigNodeClick(n, i));
    this.bodyContainer.add(hit);

    // 193차 — 「한 바늘에 두 미끼」 스킬: 미끼를 끼운 칸 바로 아래 작은 x2 단추(켜고 끈다 · 고정 중에도)
    if (n.slot === 'bait' && item && InventoryStore.doubleBaitAllowed()) this.renderDoubleBaitButton(n, i, r);
  }

  /** x2 단추 사각형 (칸 아래 오른쪽 — 행 끝 칸의 ↓ 화살표는 가운데라 겹치지 않는다) */
  private doubleBtnRect(r: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(r.x + r.width - 30, r.y + r.height + 3, 30, 16);
  }

  private renderDoubleBaitButton(n: RigNode, i: number, r: Phaser.Geom.Rectangle): void {
    const on = !!n.double;
    const b = this.doubleBtnRect(r);
    const g = this.scene.add.graphics();
    g.fillStyle(on ? 0x6a4a10 : 0x0e1c2d, 0.95);
    g.fillRoundedRect(b.x, b.y, b.width, b.height, 3);
    g.lineStyle(1, on ? 0xffd257 : 0x2a5a8a, 0.95);
    g.strokeRoundedRect(b.x, b.y, b.width, b.height, 3);
    const t = this.scene.add.text(b.centerX, b.centerY, 'x2', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', fontStyle: 'bold', color: on ? '#ffe28a' : '#8faabf',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(b.centerX, b.centerY, b.width, b.height, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      if (!InventoryStore.setBaitDouble(i, !on)) this.flashBoardToast('같은 미끼가 두 마리 이상 남아 있어야 합니다');
      this.closeChooser();
      this.renderBody();
    });
    this.bodyContainer.add([g, t, hit]);
    this.doubleBtnFirst ??= b;
  }

  /** 칸 클릭 — item: 가방 후보 목록 / choice: 갈래 목록 / toggle: 즉시 전환 */
  private onRigNodeClick(n: RigNode, i: number): void {
    // 193차 — 고정 중에도 미끼 칸은 연다(낚시 뒤 미끼만 다시 끼우면 되도록)
    if (n.slot !== 'bait' && this.rigLockedGuard()) return;
    const def = RIG_SLOTS[n.slot];
    const r = this.rigNodeRect(i);
    const listX = r.x, listY = r.y + r.height + 4;
    this.closeChooser();
    if (def.type === 'toggle') {
      InventoryStore.setRigNode(i, { on: n.on === false });
      this.renderBody();
      return;
    }
    if (def.type === 'choice') {
      const rows: ChooserRow[] = (def.options ?? []).map((o) => ({
        text: o.label + (o.desc ? `  ·  ${o.desc}` : ''),
        onPick: () => { InventoryStore.setRigNode(i, { choice: o.id }); },
        recommended: false,
      }));
      this.mountChooserList(this, rows, listX, listY, { listW: 420, title: `${nodeLabel(n)} 선택` });
      return;
    }
    // item 칸 — 후보는 받는 종류만, 추천을 위로
    // 193차 — 미끼는 가방의 같은 묶음을 바늘끼리 나눠 쓴다: 남은 수(다른 바늘 몫 제외)가 모자라면 목록에서 뺀다
    const need = n.double && InventoryStore.doubleBaitAllowed() ? 2 : 1;
    const left = (it: InvItem): number => (n.slot === 'bait' ? InventoryStore.baitStockLeft(it.id, i) : it.qty);
    const candidates = InventoryStore.items.filter((it) => this.nodeAccepts(n, it) && (n.slot !== 'bait' || left(it) >= need))
      .sort((a, b) => Number(this.nodeRecommends(n, b)) - Number(this.nodeRecommends(n, a)));
    const rows: ChooserRow[] = candidates.length === 0
      ? [
        { text: '사용 가능한 부품이 없습니다 — 직판장 채비 코너', onPick: () => { /* 안내행 */ }, muted: true },
        { text: '닫기', onPick: () => { /* 선택 없음 */ } },
      ]
      : [
        ...candidates.map((it): ChooserRow => ({
          text: `${it.name} (x${left(it)})`,
          recommended: this.nodeRecommends(n, it),
          onPick: () => {
            if (!InventoryStore.setRigNode(i, { itemId: it.id })) { this.flashBoardToast('남은 미끼가 모자랍니다'); return; }
            // 세트가 권장 미끼를 정했는데 다른 미끼를 끼우면 — 끼워지긴 하지만 알려 준다
            if (n.slot === 'bait' && n.kit && KIT_DEFS[n.kit].recommendedBaits?.length && !baitRecommendedFor(n.kit, baitKeyOf(it))) {
              this.flashBoardToast('권장되는 채비 유형이 아닙니다.');
            }
          },
        })),
        ...(n.itemId ? [{ text: '비우기', onPick: () => { InventoryStore.setRigNode(i, { itemId: null }); } }] : []),
      ];
    this.mountChooserList(this, rows, listX, listY, { listW: 260, title: `${nodeLabel(n)} 선택` });
  }

  /**
   * 155차 — 채비 고정 / 고정 해제 (사용자 지시 · 캡처: 채비하기(U) 창 **우측 하단**).
   *  [채비 고정] = 셋팅을 픽스한다(이후 던질 때 미끼 같은 소모품만 줄어들고 소켓은 바뀌지 않는다).
   *  [고정 해제] = 잠금을 푼다. 두 버튼은 항상 같이 보이고, 지금 상태에서 뜻이 없는 쪽은 흐리게 그린다.
   *  캐스팅은 고정 여부와 무관하게 된다 — 고정은 "실수로 바꾸지 않게" 하는 장치지 관문이 아니다.
   *  y = 제원 상자 안쪽 아래 줄(상자 하단 − 44). 왼쪽 열의 안내문(advice)과 겹치지 않도록 배지는 버튼 위에 둔다.
   */
  private renderRigLockButtons(y: number): void {
    const locked = InventoryStore.rigLocked;
    const mk = (cx: number, label: string, on: boolean, fill: number, stroke: number, color: string, onClick: () => void): void => {
      const w = 120, h = 36;
      const bg = this.scene.add.graphics();
      bg.fillStyle(fill, on ? 0.95 : 0.35); bg.fillRoundedRect(cx - w / 2, y, w, h, 5);
      bg.lineStyle(1.5, stroke, on ? 0.95 : 0.35); bg.strokeRoundedRect(cx - w / 2, y, w, h, 5);
      const t = this.scene.add.text(cx, y + h / 2, label, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color, fontStyle: 'bold' })
        .setOrigin(0.5).setAlpha(on ? 1 : 0.45);
      const hit = this.scene.add.rectangle(cx, y + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: on });
      if (on) {
        hit.on('pointerover', () => t.setColor('#ffffff'));
        hit.on('pointerout', () => t.setColor(color));
      }
      hit.on('pointerdown', () => { onClick(); this.renderBody(); });
      this.bodyContainer.add([bg, t, hit]);
    };
    const right = PANEL_W - 24 - 12;
    // 188차 — 상태만 적는다(고정의 뜻은 첫 열기 가이드가 설명)
    const badge = this.scene.add.text(right, y - 10, locked ? '채비 고정됨' : '채비 고정 안 됨', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: locked ? '#7fe0b0' : '#8faabf',
    }).setOrigin(1, 1);
    this.bodyContainer.add(badge);
    mk(right - 60 - 128, '채비 고정', !locked, 0x0d4a2e, 0x4af2a1, '#4af2a1', () => {
      if (locked) { this.flashBoardToast('이미 고정되어 있습니다'); return; }
      const r = InventoryStore.lockRig();
      this.flashBoardToast(r.ok ? '채비를 고정했습니다 — 이제 이 채비로 바로 던집니다' : `고정할 수 없습니다 — ${r.reason}`);
    });
    mk(right - 60, '고정 해제', locked, 0x2b2a48, 0x8a86d0, '#d0ccff', () => {
      if (!locked) { this.flashBoardToast('고정된 채비가 없습니다'); return; }
      InventoryStore.unlockRig();
      this.flashBoardToast('채비 고정을 풀었습니다 — 소켓을 바꿀 수 있습니다');
    });
  }

  /** 고정된 채비를 만지려 할 때 — 안내만 (true = 막았다) */
  private rigLockedGuard(): boolean {
    if (!InventoryStore.rigLocked) return false;
    this.flashBoardToast('채비가 고정되어 있습니다 — [고정 해제]로 푼 뒤 바꾸세요');
    return true;
  }

  // ── 채비 모드 토글 (미끼 채비 / 루어 채비) ─────────────
  /** 조립 부품 기반 물리 스펙 계산 (목업 수치) */
  private computeRigSpec(): { weightG: number; buoyG: number; sinkMps: number; dragCd: number; advice: string } {
    let weightG = 0;
    let buoyG = 0;
    const rig = InventoryStore.rig;

    const partWeight = (id: string | null): void => {
      if (!id) return;
      const item = InventoryStore.find(id);
      if (!item) return;
      if (isWeightSinker(item) || item.sinkerWeightG !== undefined) weightG += item.sinkerWeightG ?? 0;   // 원투 무게추 봉돌 (60~113g) · 타이라바 헤드
      // 찌 제원 (floatBuoyG): 양수 = 부력(부력찌) / 음수 = 침력(수중찌·잠길찌 마이너스 잔존부력)
      else if (item.floatBuoyG !== undefined) {
        if (item.floatBuoyG >= 0) buoyG += item.floatBuoyG;
        else weightG += -item.floatBuoyG;
      }
      else if (item.name.includes('봉돌')) weightG += 0.31;          // 좁쌀 G2
      else if (item.name.includes('수중찌')) weightG += 8;       // -0.8호 침력 (제원 미보유 폴백)
      else if (item.name.includes('구멍찌')) buoyG += 8;         // 0.8호 부력 (제원 미보유 폴백)
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
    // 잠길찌: '잠길찌' 타입 찌 장착 또는 잔존 부력 소진.
    // 부력찌 정격 부력은 매칭 수중찌·좁쌀·바늘·미끼를 지탱하는 값 — 잔존부력 마진
    // (부력의 35%, 최소 2.5g = 좁쌀+바늘+미끼 소품 무게)을 넘는 과침력일 때만 잠김
    // 판정한다 (호수 매칭 표준 조합(0.5호+-0.5호 등)은 항상 뜬다).
    const isSinkingFloat = !!floatItem
      && (floatItem.name.includes('잠길찌') || (buoyG > 0 && net > Math.max(buoyG * 0.35, 2.5)));
    const surf = InventoryStore.isSurfRigReady();
    const overload = InventoryStore.getRigTotalWeightG() > InventoryStore.getRodCapacityG();
    const holeSinker = InventoryStore.getEquippedWeightSinker()?.sinkerKind === 'hole';
    const bundleSinker = InventoryStore.getEquippedWeightSinker()?.sinkerKind === 'bundle';
    if (overload) advice = '채비 과부하! 봉돌 호수를 낮추거나 경량 채비를 선택하세요.';
    else if (missing.length > 0) advice = `필수 소켓이 비었습니다: ${missing.join(', ')} — 채워야 캐스팅할 수 있습니다.`;
    // 192차 — 루어 세트는 바닥 채비이기도 하므로 원투 안내보다 먼저 가른다
    else if (!InventoryStore.hookNeedsBait()) advice = '루어 채비입니다 — 미끼 없이 캐스팅 가능하며, 입질 시 미끼가 소모되지 않습니다.';
    else if (surf) {
      advice = holeSinker
        ? '원투 채비 (구멍 봉돌) — 이물감이 적어 예신 타이밍 피드백 +15%. 초릿대 끝으로 입질을 보세요.'
        : bundleSinker
          ? '원투 채비 (묶음추 봉돌) — 공기 저항이 커 비거리 페널티. 초릿대 끝으로 입질을 보세요.'
          : '원투 채비 — 찌 없이 초릿대 끝으로 입질을 봅니다. 무게추 봉돌로 바닥을 공략하세요.';
    }
    else if (!InventoryStore.hasFloatStop) advice = '전유동 채비입니다. 면사매듭을 제거하면 채비가 무한 침강합니다 — 뒷줄견제(H)로 수심을 세워 흘리세요.';
    else if (floatItem?.name.includes('제로찌')) {
      advice = rig.subFloat
        ? '제로찌 + 수중찌 조합입니다 — 상층 공략이 목적이면 수중찌를 빼는 운용도 있습니다.'
        : '제로찌 상층 공략 채비 — 수중찌 없이 좁쌀봉돌·바늘(미끼) 무게만으로 천천히 내립니다.';
    }
    else if (isSinkingFloat) advice = '잠길찌 채비 상태입니다. 캐스팅 후 찌가 수중으로 하강합니다.';
    else if (rig.subFloat) advice = '수중찌 채비 — 부력찌는 수면에 세우고, 수중찌 침력이 채비를 조류에 태워 내립니다.';
    else if (!InventoryStore.hookNeedsBait()) advice = '루어 채비입니다 — 미끼 없이 캐스팅 가능하며, 입질 시 미끼가 소모되지 않습니다.';
    else if (net < 0) advice = '부력이 무게보다 큽니다 — 채비가 상층에 뜹니다 (상층 어종 공략).';
    else if (sinkMps < 0.1) advice = '침강이 느립니다. 깊은 수심 공략 시 봉돌을 추가하세요. (강풍 시 무거운 봉돌 추천)';
    else advice = '균형 잡힌 채비입니다. 면사매듭 수심을 포인트 수심대에 맞추세요.';

    return { weightG, buoyG, sinkMps, dragCd, advice };
  }

  /**
   * 스크롤 가능한 선택 리스트를 마운트 (부품/미끼 선택 공용).
   * 창이 화면 밖으로 길어지지 않도록 최대 표시 행을 제한하고, 초과분은 **우측 스크롤바 + 휠**로
   * 처리한다. 마스크 대신 **보이는 행만 생성**(윈도우드 렌더)해 스크롤아웃된 행의 팬텀 히트를 방지.
   */
  private mountChooserList(
    parent: Phaser.GameObjects.Container,
    rows: ChooserRow[],
    x: number, y: number,
    opts: { listW: number; title?: string },
  ): void {
    const rowH = 28, listW = opts.listW, padB = 8;
    const headerH = opts.title ? 26 : 6;
    const MAX_VIS_ROWS = 11;
    const visRows = Math.min(rows.length, MAX_VIS_ROWS);
    const scrollable = rows.length > visRows;
    const boxW = listW + (scrollable ? 10 : 0);
    const listH = headerH + visRows * rowH + padB;
    const lx = Phaser.Math.Clamp(x, 8, PANEL_W - boxW - 8);
    const ly = Phaser.Math.Clamp(Math.min(y, PANEL_H - listH - 8), this.contentTop + 4, PANEL_H - listH - 8);
    const maxScroll = rows.length - visRows;
    let scroll = 0;
    this.chooserRect = { x: lx, y: ly, w: boxW, h: listH };

    const c = this.scene.add.container(0, 0);
    this.addChooserBackdrop(c);   // 바깥 클릭 시 선택창 자동 닫힘

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.98);
    bg.fillRoundedRect(lx, ly, boxW, listH, 5);
    bg.lineStyle(1.5, 0x5cd0ff, 0.95);
    bg.strokeRoundedRect(lx, ly, boxW, listH, 5);
    c.add(bg);

    if (opts.title) {
      const title = this.scene.add.text(lx + 12, ly + 7, `${opts.title}${scrollable ? `  (${rows.length}개)` : ''}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#aee8ff', fontStyle: 'bold',
      });
      c.add(title);
    }

    // 행 레이어(스크롤마다 재렌더 — 보이는 행만 생성해 마스크·팬텀히트 없이 스크롤) + 스크롤바
    const rowsLayer = this.scene.add.container(0, 0);
    c.add(rowsLayer);
    const barG = this.scene.add.graphics();
    c.add(barG);

    const renderRows = (): void => {
      rowsLayer.removeAll(true);
      for (let r = 0; r < visRows; r++) {
        const row = rows[scroll + r];
        if (!row) continue;
        const ry = ly + headerH + r * rowH;
        const color = row.muted ? '#607b8e' : row.recommended ? '#ffe28a' : '#d0e8f5';
        const rowTxt = this.scene.add.text(lx + 12, ry + rowH / 2, row.text, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color,
        }).setOrigin(0, 0.5);
        rowsLayer.add(rowTxt);
        if (row.recommended) {
          const badge = this.scene.add.text(lx + listW - 10, ry + rowH / 2, '추천', {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#0b1f14',
            backgroundColor: '#ffd257', padding: { x: 3, y: 1 }, fontStyle: 'bold',
          }).setOrigin(1, 0.5);
          rowsLayer.add(badge);
        }
        if (!row.muted) {
          const rowHit = this.scene.add.rectangle(lx + listW / 2, ry + rowH / 2, listW - 8, rowH - 2, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true });
          rowHit.on('pointerover', () => rowTxt.setColor('#ffffff'));
          rowHit.on('pointerout', () => rowTxt.setColor(color));
          rowHit.on('pointerdown', () => { row.onPick(); this.closeChooser(); this.renderBody(); });
          rowsLayer.add(rowHit);
        }
      }
      // 우측 스크롤바 (트랙 + 위치 비례 썸)
      barG.clear();
      if (scrollable) {
        const trackX = lx + listW + 3, trackY = ly + headerH, trackH = visRows * rowH;
        barG.fillStyle(0x14324a, 0.9);
        barG.fillRoundedRect(trackX, trackY, 4, trackH, 2);
        const thumbH = Math.max(20, (trackH * visRows) / rows.length);
        const thumbY = trackY + (trackH - thumbH) * (maxScroll === 0 ? 0 : scroll / maxScroll);
        barG.fillStyle(0x5cd0ff, 0.95);
        barG.fillRoundedRect(trackX, thumbY, 4, thumbH, 2);
      }
      this.applyFix();   // 재렌더된 행의 화면 고정 히트 보정
    };
    renderRows();

    if (scrollable) {
      this.chooserWheel = (_p, _go, _dx, dy) => {
        if (!this.chooser) return;
        scroll = Phaser.Math.Clamp(scroll + (dy > 0 ? 1 : -1), 0, maxScroll);
        renderRows();
      };
      this.scene.input.on('wheel', this.chooserWheel);
    }

    parent.add(c);
    this.chooser = c;
    this.applyFix();
  }

  private closeChooser(): void {
    if (this.chooserWheel) {
      this.scene.input.off('wheel', this.chooserWheel);
      this.chooserWheel = undefined;
    }
    this.chooser?.destroy();
    this.chooser = undefined;
    this.chooserRect = null;
  }

  /**
   * 선택 리스트 뒤 전체 화면 투명 백드롭 — **바깥 클릭 시 선택창 자동 닫힘**.
   * 리스트 행이 백드롭 위에 있으므로(topOnly) 행 클릭은 그대로 동작하고,
   * 리스트 밖 클릭은 백드롭이 받아 chooser만 닫는다 (하위 UI 오클릭 방지 겸용).
   */
  private addChooserBackdrop(c: Phaser.GameObjects.Container): void {
    const bd = this.scene.add.rectangle(-this.x, -this.y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001)
      .setOrigin(0, 0)
      .setInteractive();
    bd.on('pointerdown', () => this.closeChooser());
    c.addAt(bd, 0);
  }

  // ═══════════════════════════════════════════════════
  // 요리하기 (Cooking) — 도마 DnD → [손질 시작] → ButcheryPanel 회 뜨기
  // ═══════════════════════════════════════════════════
  private renderCooking(): void {
    const top = this.contentTop + 56;

    // ── 좌측: 도마 (손질 작업대) ──────────────────────────
    const boardX = 40, boardY = top + 44, boardW = 480, boardH = 240;
    this.cookBoardRect = { x: boardX, y: boardY, w: boardW, h: boardH };
    const board = this.scene.add.graphics();
    board.fillStyle(0x8a6a44, 1);
    board.fillRoundedRect(boardX, boardY, boardW, boardH, 12);
    board.fillStyle(0xa8845a, 1);
    board.fillRoundedRect(boardX + 12, boardY + 12, boardW - 24, boardH - 24, 10);
    board.lineStyle(2, 0x5a4028, 1);
    board.strokeRoundedRect(boardX, boardY, boardW, boardH, 12);
    this.bodyContainer.add(board);

    // ── 드롭존 하이라이트 (드래그 중 도마 hover 시 토글) ──
    const hl = this.scene.add.graphics();
    hl.lineStyle(3, 0x4af2a1, 0.95);
    hl.strokeRoundedRect(boardX, boardY, boardW, boardH, 12);
    hl.setVisible(false);
    this.bodyContainer.add(hl);
    this.cookBoardHighlight = hl;

    // ── 도마 위 생선 (드래그 앤 드랍으로 올림 — 손질 프로필 보유 어획물, 실사→파라메트릭) ──
    const boardFish = this.cookBoardFishId ? InventoryStore.find(this.cookBoardFishId) : undefined;
    if (this.cookBoardFishId && !boardFish) this.cookBoardFishId = null;   // 아이템 소멸 — 도마 비움

    if (boardFish) {
      const cx = boardX + boardW / 2, cy = boardY + boardH / 2;
      const family = getButcheryFamily(boardFish.speciesId ?? '');
      // 실사 있으면 실사, 없으면 파라메트릭 생선 프리뷰
      const preview = makeFishPreview(this.scene, {
        speciesId: boardFish.speciesId, iconTexture: boardFish.iconTexture,
        boxW: boardW - 70, boxH: boardH - 74, cx, cy,
      });
      this.bodyContainer.add(preview);

      // 도마 생선 드래그 = 빼기 (도마 밖으로 놓으면 내려감 — 커스텀 포인터 방식)
      const grab = this.scene.add.rectangle(cx, cy, boardW - 60, boardH - 96, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      grab.on('pointerdown', (p: Phaser.Input.Pointer) => this.startCookDrag(boardFish, 'remove', p));
      this.bodyContainer.add(grab);

      const nameLbl = this.scene.add.text(cx, boardY + boardH - 18, boardFish.name, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#3a2c1a', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.bodyContainer.add(nameLbl);

      const boardCephKind = this.cephSliceKind(boardFish);
      if (boardCephKind) {
        // ── 두족류 부산물 회뜨기/분리 (097차) — 단일 버튼, 회칼 손 장착 게이트 ──
        const handKnife = getBestKnife(
          InventoryStore.items.filter((i) => i.tool === 'knife' && i.equipped).map((i) => i.id));
        const label = boardCephKind === 'mantle' ? '오징어 회뜨기 (22점)'
          : boardCephKind === 'fin' ? '날개살 회뜨기 (4점)'
          : boardCephKind === 'octoWhole' ? '다리 분리 (머리 1 + 다리 8)'
          : boardCephKind === 'octoLeg' ? '숙회 썰기 (8점)' : '촉완 분리';
        const bw2 = boardCephKind === 'arms' ? 96 : boardCephKind === 'octoWhole' ? 178 : 158;
        const on = !!handKnife;
        const bg2 = this.scene.add.graphics();
        bg2.fillStyle(on ? 0x0d4a2e : 0x1c2530, 0.96);
        bg2.fillRoundedRect(boardX + 8, boardY + 8, bw2, 24, 4);
        bg2.lineStyle(1.5, on ? 0x4af2a1 : 0x3a4a58, 0.95);
        bg2.strokeRoundedRect(boardX + 8, boardY + 8, bw2, 24, 4);
        const tx2 = this.scene.add.text(boardX + 8 + bw2 / 2, boardY + 20, label, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
          color: on ? '#4af2a1' : '#5a6a78', fontStyle: 'bold',
        }).setOrigin(0.5);
        const hit2 = this.scene.add.rectangle(boardX + 8 + bw2 / 2, boardY + 20, bw2, 24, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit2.on('pointerdown', () => {
          if (!on) {
            this.flashBoardToast('회칼을 손에 장착해야 합니다 — 인벤토리(기타)에서 회칼 우클릭 → 착용');
            return;
          }
          this.openSashimi(boardFish, 'basic');
        });
        this.bodyContainer.add([bg2, tx2, hit2]);
      } else if (this.isPureFillet(boardFish) || this.isPureEngawa(boardFish)) {
        // ── 순수 필렛/순수 엔가와 = 회썰기(사시미) — [일반 회뜨기] + [고급 사시미 뜨기] ──
        //  일반 = 손 장착 회칼(막칼 포함 — 등급 캡) / 고급 = **야나기바 이상** 장착 시에만 활성.
        //  엔가와는 SashimiPanel이 스트립 전용 2컷으로 분기한다 (사용자 지시 2026-08-05).
        const handKnife = getBestKnife(
          InventoryStore.items.filter((i) => i.tool === 'knife' && i.equipped).map((i) => i.id));
        const mkBtn = (bx: number, w: number, label: string, on: boolean, mode: SashimiMode, offMsg: string): void => {
          const bg = this.scene.add.graphics();
          bg.fillStyle(on ? 0x0d4a2e : 0x1c2530, 0.96);
          bg.fillRoundedRect(bx, boardY + 8, w, 24, 4);
          bg.lineStyle(1.5, on ? 0x4af2a1 : 0x3a4a58, 0.95);
          bg.strokeRoundedRect(bx, boardY + 8, w, 24, 4);
          const tx = this.scene.add.text(bx + w / 2, boardY + 20, label, {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
            color: on ? '#4af2a1' : '#5a6a78', fontStyle: 'bold',
          }).setOrigin(0.5);
          const hit = this.scene.add.rectangle(bx + w / 2, boardY + 20, w, 24, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true });
          hit.on('pointerdown', () => {
            if (!on) { this.flashBoardToast(offMsg); return; }
            this.openSashimi(boardFish, mode);
          });
          this.bodyContainer.add([bg, tx, hit]);
        };
        mkBtn(boardX + 8, 96, SASHIMI_MODES.basic.label, !!handKnife, 'basic',
          '회칼을 손에 장착해야 회를 뜰 수 있습니다 — 인벤토리(기타)에서 회칼 우클릭 → 착용');
        mkBtn(boardX + 110, 122, SASHIMI_MODES.advanced.label, handKnife?.tier === 'yanagiba', 'advanced',
          '고급 사시미 뜨기는 야나기바 이상 회칼을 손에 장착해야 합니다');
      } else {
      // [손질 시작] — finfish만 활성 (두족류는 준비중, 안내)
      // 87차 — 두족류는 종별로 순차 개방(현재 무늬오징어)이라 분류가 아니라 구현 여부로 판단
      const cutEnabled = canButcherSpecies(boardFish.speciesId ?? '');
      const cutBg = this.scene.add.graphics();
      cutBg.fillStyle(cutEnabled ? 0x0d4a2e : 0x1c2530, 0.96);
      cutBg.fillRoundedRect(boardX + 8, boardY + 8, 92, 24, 4);
      cutBg.lineStyle(1.5, cutEnabled ? 0x4af2a1 : 0x3a4a58, 0.95);
      cutBg.strokeRoundedRect(boardX + 8, boardY + 8, 92, 24, 4);
      const cutTxt = this.scene.add.text(boardX + 54, boardY + 20, '손질 시작', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
        color: cutEnabled ? '#4af2a1' : '#5a6a78', fontStyle: 'bold',
      }).setOrigin(0.5);
      const cutHit = this.scene.add.rectangle(boardX + 54, boardY + 20, 92, 24, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      cutHit.on('pointerdown', () => {
        // 미개방 사유 — finfish는 항상 개방이라 여기 오면 두족류(미구현 종)/복어/미지원이다
        if (!cutEnabled) {
          if (family !== 'finfish') this.flashBoardToast(BUTCHERY_FAMILY_NOTICE[family]);
          return;
        }
        // 회칼 손 장착 게이트 (2026-07-30 자유 손질 개편) — 왼손/오른손에 회칼이 있어야 시작
        const handKnife = InventoryStore.items.some((i) => i.tool === 'knife' && i.equipped);
        if (!handKnife) {
          this.flashBoardToast('회칼을 손에 장착해야 손질할 수 있습니다 — 인벤토리(기타)에서 회칼 우클릭 → 착용');
          return;
        }
        this.openButchery(boardFish);
      });
      this.bodyContainer.add([cutBg, cutTxt, cutHit]);
      }

      // [내리기] — 도마 비우기
      const offBg = this.scene.add.graphics();
      offBg.fillStyle(0x3a2a20, 0.95);
      offBg.fillRoundedRect(boardX + boardW - 74, boardY + 8, 66, 22, 4);
      const offTxt = this.scene.add.text(boardX + boardW - 41, boardY + 19, '내리기', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffce9a',
      }).setOrigin(0.5);
      const offHit = this.scene.add.rectangle(boardX + boardW - 41, boardY + 19, 66, 22, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      offHit.on('pointerdown', () => { this.cookBoardFishId = null; this.renderBody(); });
      this.bodyContainer.add([offBg, offTxt, offHit]);
    } else if (this.boardSlicedItemId && InventoryStore.find(this.boardSlicedItemId)) {
      // 썰린 회 조각 진열 — 한 점씩 아래 접시로 드래그 (사용자 도식 2026-08-04)
      this.renderSlicedBoard(boardX, boardY, boardW, boardH);
    } else {
      if (this.boardSlicedItemId) this.boardSlicedItemId = null;   // 조각 소진 — 스테이징 해제
      const boardLbl = this.scene.add.text(boardX + boardW / 2, boardY + boardH / 2,
        '도마', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#5a4028', fontStyle: 'bold',
        }).setOrigin(0.5);
      this.bodyContainer.add(boardLbl);
    }

    // 안내 텍스트 블록은 [?] 도움말로 이동 (사용자 지시 2026-08-03) — 아래 공간은 서브 영역이 사용
    // [?] 도움말 — 도마 **바깥 우상단**(도마 위 콘텐츠를 가리지 않게. 사용자 지시 2026-08-04)
    this.renderCookHelpButton(boardX + boardW + 2, top - 14);
    this.renderCookSubBoxes(boardX, boardY + boardH + 12, boardW, PANEL_H - (boardY + boardH + 12) - 14);

    // ── 우측: 종속 인벤토리 (요리 창에 임베드 — 별도 드래그 창 아님) ──
    this.renderEmbeddedInventory(560, top, PANEL_W - 560 - 24);
  }

  /** 포인터가 도마 영역(패널 로컬) 위인지 */
  private overBoard(p: Phaser.Input.Pointer): boolean {
    const lx = p.x - this.x, ly = p.y - this.y, b = this.cookBoardRect;
    return lx >= b.x && lx <= b.x + b.w && ly >= b.y && ly <= b.y + b.h;
  }

  /**
   * 요리 도마 드래그 시작 (커스텀 포인터 방식 — pointerdown에서 잠재 드래그 등록).
   * mode 'add' = 인벤 셀에서 도마로 / 'remove' = 도마 생선을 밖으로 빼기.
   * 이동 임계(6px) 미만이면 클릭(선택)으로 처리한다.
   */
  private startCookDrag(item: InvItem, mode: 'add' | 'remove', p: Phaser.Input.Pointer): void {
    this.cookDragItem = item;
    this.cookDragMode = mode;
    this.cookDragStart = { x: p.x, y: p.y };
    this.cookDragging = false;
  }

  private onCookDragMove(p: Phaser.Input.Pointer): void {
    if (!this.cookDragItem) return;
    if (!this.cookDragging) {
      if (Math.hypot(p.x - this.cookDragStart.x, p.y - this.cookDragStart.y) < 6) return;   // 클릭 임계
      this.cookDragging = true;
      this.spawnDragGhost(this.cookDragItem, p.x - this.x, p.y - this.y);
    }
    this.dragGhost?.setPosition(p.x - this.x, p.y - this.y);
    this.cookBoardHighlight?.setVisible(this.overBoard(p));
  }

  private onCookDragUp(p: Phaser.Input.Pointer): void {
    const item = this.cookDragItem;
    if (!item) return;
    const mode = this.cookDragMode, dragged = this.cookDragging;
    this.cookDragItem = null;
    this.cookDragging = false;
    this.dragGhost?.destroy();
    this.dragGhost = undefined;
    this.cookBoardHighlight?.setVisible(false);
    if (this.currentTab !== 'cooking') return;
    if (!dragged) {
      // 이동 없음 = 클릭 → 인벤 셀이면 선택
      if (mode === 'add') { this.cookSelectedId = item.id; this.renderBody(); }
      return;
    }
    if (mode === 'add') {
      // 사시미 만들기 영역 — 접시 장착 / 회 조각 배치 (도마보다 우선 판정)
      if (this.overPlate(p)) {
        if (this.isPlateItem(item) || this.isWipPlate(item)) { this.mountPlate(item); return; }
        if (this.isSashimiPiece(item)) { this.placePiece(item); return; }
      }
      if (this.overBoard(p)) this.dropFishOnBoard(item);
    } else if (!this.overBoard(p)) {
      this.cookBoardFishId = null; this.renderBody();   // 도마 밖으로 빼기 = 내리기
    }
  }

  /** 드래그 고스트 생성 (실사 이미지 or 파라메트릭 — 화면 고정) */
  private spawnDragGhost(item: InvItem, lx: number, ly: number): void {
    this.dragGhost?.destroy();
    const gh = makeFishPreview(this.scene, {
      speciesId: item.speciesId, iconTexture: item.iconTexture, boxW: 110, boxH: 60, cx: lx, cy: ly,
    });
    gh.setAlpha(0.85).setScrollFactor(0);
    this.bodyContainer.add(gh);
    this.dragGhost = gh;
  }

  /** 도마에 생선 놓기 — 게이트(복어 차단) + 점유 중 교환 */
  /**
   * 껍질이 붙어있는 순살 필렛 — 도마에 다시 올리면 **박피 섹션부터 이어서** 진행 (재장착).
   * (지아이뼈 분리 후 나오는 4장 — 사용자 지시 2026-07-31)
   */
  private isSkinFillet(item: InvItem): boolean {
    return item.subCategory === '손질 필렛' && item.id.startsWith('inv_filletskin_');
  }

  /** 껍질·갈빗대가 아직 붙어있는 필렛 — 도마에 올리면 **갈빗대 제거부터** 재개 */
  private isRibFillet(item: InvItem): boolean {
    return item.subCategory === '손질 필렛' && item.id.startsWith('inv_filletribs_');
  }

  /** 갈빗대만 제거된 필렛(재장착 세션 모프 대체분) — 도마에 올리면 **지아이 분리부터** 재개 */
  private isPinFillet(item: InvItem): boolean {
    return item.subCategory === '손질 필렛' && item.id.startsWith('inv_filletpin_');
  }

  /** 껍질+엔가와 붙은 넙치류 필렛 — 도마에 올리면 **엔가와 분리부터** 재개 (2026-08-05) */
  private isEngwFillet(item: InvItem): boolean {
    return item.subCategory === '손질 필렛' && item.id.startsWith('inv_filletengw_');
  }

  /** 껍질 붙은 엔가와 — 도마에 올리면 **박피부터** 재개 (순수 엔가와 산출) */
  private isEngwSkin(item: InvItem): boolean {
    return item.subCategory === '손질 필렛' && item.id.startsWith('inv_engwskin_');
  }

  /** 도마 재장착 가능한 중간 산출물 → 시작 섹션 */
  private resumeSectionOf(item: InvItem): string | undefined {
    if (this.isRibFillet(item)) return 'sec_rib';
    if (this.isPinFillet(item)) return 'sec_pin';
    if (this.isEngwFillet(item)) return 'sec_engawa';
    if (this.isEngwSkin(item)) return 'sec_peel';
    if (this.isSkinFillet(item)) return 'sec_peel';
    return undefined;
  }

  /**
   * 순수 필렛 — 도마에 올리면 **회썰기(사시미) 미니게임** 대상 (2026-08-03).
   * id 접두 `inv_fillet_`는 skin(`inv_filletskin_`)/ribs(`inv_filletribs_`)와 겹치지 않는다.
   */
  private isPureFillet(item: InvItem): boolean {
    return item.subCategory === '손질 필렛' && item.id.startsWith('inv_fillet_');
  }

  /**
   * 순수 엔가와(넙치류 지느러미살) — 도마에 올리면 **회썰기(총 2컷)** 대상 (사용자 지시 2026-08-05).
   * 순수 필렛과 동일 흐름이되 SashimiPanel이 엔가와 스트립 전용(2컷·실사 에셋)으로 분기한다.
   */
  private isPureEngawa(item: InvItem): boolean {
    return item.subCategory === '엔가와' && item.id.startsWith('inv_engawa_');
  }

  /**
   * 두족류 회뜨기 대상 부산물 (097차) — 도마에 올리면 SashimiPanel이 전용 레이아웃으로 분기.
   *  - 몸통살: 가운데 1컷 + 세로 10컷 = **회 22점**
   *  - 날개살: 좌우 날개 각 1컷 = **회 4점**
   *  - 다리부: 1컷 = **촉완 ×2 + 촉완이 제거된 다리부** (회 아님 — 별도 요리 재료)
   * id는 ButcheryPanel.buildYieldRows 규칙 그대로 — 몸통살은 개체별, 날개살/다리부는 공유 스택.
   */
  private cephSliceKind(item: InvItem): 'mantle' | 'fin' | 'arms' | 'octoWhole' | 'octoLeg' | null {
    if (item.id.startsWith('inv_ceph_ceph_mantle_fillet_')) return 'mantle';
    if (item.id === 'inv_ceph_ceph_fin_meat') return 'fin';
    if (item.id === 'inv_ceph_ceph_arms') return 'arms';
    // ── 삶은 문어 (098차) — 생 통마리(inv_ceph_octo_whole_)는 도마 불가, **삶은 뒤에만** ──
    if (item.id === 'inv_octo_boiled_leg') return 'octoLeg';          // 다리 → 숙회 썰기 (7컷)
    if (item.id.startsWith('inv_octo_boiled_') && item.id !== 'inv_octo_boiled_head') return 'octoWhole';
    return null;
  }

  private dropFishOnBoard(item: InvItem): void {
    // 회 조각 = 도마 스테이징 (썰린 조각 진열 — 접시 드래그의 출발점)
    if (this.isSashimiPiece(item)) {
      this.boardSlicedItemId = item.id;
      this.cookBoardFishId = null;
      this.cookSub = 'sashimi';
      this.renderBody();
      return;
    }
    if (this.isPlateItem(item)) {
      this.flashBoardToast('접시는 아래 [사시미 만들기] 영역에 놓으세요');
      return;
    }
    if (this.isPureFillet(item) || this.isPureEngawa(item) || this.cephSliceKind(item)) {
      if (this.cookBoardFishId && this.cookBoardFishId !== item.id) { this.trySwapBoard(item.id); return; }
      this.cookBoardFishId = item.id;
      this.cookSelectedId = item.id;
      this.renderBody();
      return;
    }
    if (this.resumeSectionOf(item)) {
      if (this.cookBoardFishId && this.cookBoardFishId !== item.id) { this.trySwapBoard(item.id); return; }
      this.cookBoardFishId = item.id;
      this.cookSelectedId = item.id;
      this.renderBody();
      return;
    }
    const family: ButcheryFamily = getButcheryFamily(item.speciesId ?? '');
    if (family === 'pufferfish' || family === 'unsupported') {
      this.flashBoardToast(BUTCHERY_FAMILY_NOTICE[family]);
      return;
    }
    // finfish/cephalopod — 점유 중(다른 생선)이면 교환
    if (this.cookBoardFishId && this.cookBoardFishId !== item.id) {
      this.trySwapBoard(item.id);
      return;
    }
    this.cookBoardFishId = item.id;
    this.cookSelectedId = item.id;
    this.renderBody();
  }

  /** 도마 점유 중 새 생선 드롭 = 교체 (손질 진행 중이면 확인 모달) */
  private trySwapBoard(newId: string): void {
    const doSwap = (): void => {
      this.cookBoardFishId = newId;
      this.cookSelectedId = newId;
      this.renderBody();
      this.flashBoardToast('교환됨');
    };
    if (this.butcheryPanel || this.sashimiPanel) {
      this.swapConfirm?.destroy();
      const close = (): void => { this.swapConfirm?.destroy(); this.swapConfirm = undefined; };
      const dlg = new ConfirmDialog(this.scene,
        this.sashimiPanel ? '진행 중인 회썰기를 취소하고 교체할까요? (필렛은 보존)' : '진행 중인 손질을 취소하고 생선을 교체할까요?',
        () => {
          close();
          this.butcheryPanel?.destroy(); this.butcheryPanel = undefined;
          this.sashimiPanel?.destroy(); this.sashimiPanel = undefined;
          doSwap();
        },
        () => { close(); });
      this.scene.add.existing(dlg);
      this.swapConfirm = dlg;
      return;
    }
    doSwap();
  }

  /** 도마 안내 토스트 (1.8초 표시) */
  private flashBoardToast(msg: string): void {
    this.boardToast?.destroy();
    const b = this.cookBoardRect;
    const t = this.scene.add.text(b.x + b.w / 2, b.y + b.h / 2, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffce9a', fontStyle: 'bold',
      backgroundColor: '#0a1628ee', padding: { x: 14, y: 10 }, align: 'center',
      wordWrap: { width: b.w - 40 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.bodyContainer.add(t);
    this.boardToast = t;
    this.scene.time.delayedCall(1800, () => {
      t.destroy();
      if (this.boardToast === t) this.boardToast = undefined;
    });
  }

  // ═══════════════════════════════════════════════════
  // 사시미 만들기 — 도마 아래 서브 영역 (접시 플레이팅. 사용자 도식 2026-08-03)
  // ═══════════════════════════════════════════════════

  /** 사시미 접시 아이템 (소/중/대/특대 — id 접미로 크기 판별) */
  private isPlateItem(item: InvItem): boolean {
    return item.id.startsWith('inv_plate_') && item.subCategory === '식기';
  }

  /** 미완성 접시 아이템 (135차) — 올리면 담던 자리에서 이어 담는다 */
  private isWipPlate(item: InvItem): boolean {
    return !!item.plateWip;
  }

  private plateSizeOf(item: InvItem): SashimiSizeTier {
    if (item.id.endsWith('_xl')) return '특대';
    if (item.id.endsWith('_l')) return '대';
    if (item.id.endsWith('_m')) return '중';
    return '소';
  }

  /** 회 조각 (회썰기 산출 — 접시 배치 재료) */
  private isSashimiPiece(item: InvItem): boolean {
    return item.id.startsWith('inv_sashimi_cut_');
  }

  /** 도마 [?] 도움말 버튼 — 구 안내 텍스트 블록의 이동처 */
  private renderCookHelpButton(x: number, y: number): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1c3550, 0.95);
    bg.fillCircle(x + 11, y + 11, 11);
    bg.lineStyle(1.5, 0x9fc0d4, 0.9);
    bg.strokeCircle(x + 11, y + 11, 11);
    const q = this.scene.add.text(x + 11, y + 11, '?', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#cfe3f2', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.circle(x + 11, y + 11, 12, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.showCookHelp());
    this.bodyContainer.add([bg, q, hit]);
  }

  /**
   * 도마 사용법 팝업 — **화면 중앙 · 헤더 드래그 이동 · X 버튼 닫기** (사용자 지시 2026-08-04).
   * 구 구현은 패널 로컬 고정 위치 + "아무 데나 클릭하면 닫힘"이라, 읽는 중 실수로 닫히고
   * 위치도 옮길 수 없었다. 공통 `DraggablePanel`로 교체 (씬 레벨 — U패널 리렌더와 독립).
   */
  private showCookHelp(): void {
    if (this.cookHelpPopup) { this.closeCookHelp(); return; }   // 같은 버튼 = 토글
    const W = 520, H = 268;
    const panel = new DraggablePanel(this.scene, {
      x: Math.round((GAME_WIDTH - W) / 2),
      y: Math.round((GAME_HEIGHT - H) / 2),
      width: W, height: H, title: '도마 사용법',
      onClose: () => this.closeCookHelp(),
      depth: 900,
    });
    const body = this.scene.add.text(18, 52, [
      '· 생선을 도마에 올리고 [손질 시작]으로 회를 뜹니다 (넣기·빼기·교환 = 드래그)',
      '· 원형어 = 삼면뜨기(양살 2필렛) / 광어·도다리 = 다섯장뜨기(4~5필렛)',
      '· 순수 필렛을 올리면 [일반 회뜨기]/[고급 사시미 뜨기(야나기바)]로 회를 썹니다',
      '· 썰어진 회 조각은 아래 [사시미 만들기] 접시에 담아 완성 (모듬/단품)',
      // 188차 — 오징어·한치·문어 손질은 090~098차에 들어왔다. 아직 안 된 것은 복어와 갑오징어뿐(AG ⑤f)
      '· 오징어·한치·문어도 도마에서 손질합니다 — 복어(자격·독)와 갑오징어는 준비 중입니다',
      '· 신선도가 높을수록 회 등급이 오릅니다 (활어회는 활어 상태에서만 특 가능)',
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fc0d4',
      lineSpacing: 8, wordWrap: { width: W - 36 },
    });
    // 188차 — 창 조작 안내('헤더를 끌어 이동 · ✕ 또는 ESC로 닫기')는 지웠다(기능을 글로 적지 않는다)
    panel.add([body]);
    this.scene.add.existing(panel);
    applyScreenFixed(panel);
    this.cookHelpPopup = panel;
  }

  private closeCookHelp(): void {
    this.cookHelpPopup?.destroy();
    this.cookHelpPopup = undefined;
  }

  /**
   * 도마 아래 서브 영역 — [사시미 만들기(접시 필요)] / [불을 이용한 요리 만들기(미구현)].
   * 순수 필렛이 도마에 있거나, 회 조각 보유/플레이팅 진행 중일 때 표시.
   * 선택 시 한쪽이 확대되며 다른 쪽을 밀어내는 연출 (도마/패널 영역 침범 금지).
   */
  private renderCookSubBoxes(bx: number, by: number, bw: number, bh: number): void {
    const boardFish = this.cookBoardFishId ? InventoryStore.find(this.cookBoardFishId) : undefined;
    const hasPieces = InventoryStore.items.some((i) => this.isSashimiPiece(i));
    const bk = boardFish ? this.cephSliceKind(boardFish) : null;
    const relevant = (boardFish && (this.isPureFillet(boardFish) || this.isPureEngawa(boardFish)
      || bk === 'mantle' || bk === 'fin')) || hasPieces
      || this.cookSub === 'sashimi' || !!this.plateState;
    if (!relevant) return;
    bh = Math.min(206, bh);

    if (this.cookSub === 'sashimi') {
      this.renderSashimiArea(bx, by, bw, bh);
      return;
    }

    // ── 접힘 상태 — 2버튼 박스 ──
    const halfW = (bw - 8) / 2;
    const hasPlate = !!this.plateState
      || InventoryStore.items.some((i) => this.isPlateItem(i) || this.isWipPlate(i));
    const mkBox = (x: number, w: number, label: string, sub: string, on: boolean, onClick: () => void): void => {
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x0d2438 : 0x141c26, 0.95);
      g.fillRoundedRect(x, by, w, bh, 10);
      g.lineStyle(1.5, on ? 0x4af2a1 : 0x3a4a58, 0.9);
      g.strokeRoundedRect(x, by, w, bh, 10);
      const t1 = this.scene.add.text(x + w / 2, by + bh / 2 - 12, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px',
        color: on ? '#cfe3f2' : '#5a6a78', fontStyle: 'bold',
      }).setOrigin(0.5);
      const t2 = this.scene.add.text(x + w / 2, by + bh / 2 + 12, sub, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px',
        color: on ? '#8faabf' : '#4a5a68',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(x + w / 2, by + bh / 2, w, bh, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', onClick);
      this.bodyContainer.add([g, t1, t2, hit]);
    };
    mkBox(bx, halfW, '사시미 만들기', hasPlate ? '접시에 회 조각을 담아 완성' : '(접시 필요 — 식자재마트 판매)', hasPlate,
      () => {
        if (!hasPlate) { this.flashBoardToast('사시미 접시가 필요합니다 — 식자재마트에서 판매합니다'); return; }
        this.animateSashimiExpand(bx, by, bw, bh, halfW);
      });
    // 154차 — 불요리는 화구 앞에서 한다(설치한 화구 [F] · 집 주방 [F]). 이 박스는 안내만.
    const hasStove = InventoryStore.items.some((i) => i.stoveHeatId && i.qty > 0);
    mkBox(bx + halfW + 8, halfW, '불을 이용한 요리 만들기', hasStove ? '(인벤토리에서 [화구 설치] 후 화구 앞 [F])' : '(휴대용 가스스토브 — 식자재마트 · 집 주방 [F])', false,
      () => this.flashBoardToast(hasStove ? '화구를 설치하고 그 앞에서 [F]를 누르세요. 집 가스레인지도 됩니다.' : '불요리는 화구 앞에서 합니다 — 휴대용 가스스토브(식자재마트) 또는 집 주방 가스레인지.'));
  }

  /** 확장 연출 — 좌측 박스가 커지며 우측 박스를 밀어냄 (완료 후 확장 레이아웃 렌더) */
  private animateSashimiExpand(bx: number, by: number, bw: number, bh: number, halfW: number): void {
    const g = this.scene.add.graphics();
    this.bodyContainer.add(g);
    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: 240, ease: 'Cubic.easeOut',
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        g.clear();
        g.fillStyle(0x0d2438, 0.95);
        g.fillRoundedRect(bx, by, halfW + (bw - 26 - halfW) * t, bh, 10);
        const rw = halfW * (1 - t) + 18 * t;
        g.fillStyle(0x141c26, 0.9);
        g.fillRoundedRect(bx + bw - rw, by, rw, bh, 8);
      },
      onComplete: () => {
        this.cookSub = 'sashimi';
        this.renderBody();
      },
    });
  }

  /** 확장된 사시미 만들기 영역 — 접시 장착/플레이팅/완성 */
  private renderSashimiArea(bx: number, by: number, bw: number, bh: number): void {
    const areaW = bw - 26;   // 우측 축소 스트립 자리
    // 배경 + 우측 축소 스트립 (불요리 자리 — 사용자 도식 "우측 칸은 축소")
    const g = this.scene.add.graphics();
    g.fillStyle(0x0d2438, 0.95);
    g.fillRoundedRect(bx, by, areaW, bh, 10);
    g.lineStyle(1.5, 0x2a4a68, 0.9);
    g.strokeRoundedRect(bx, by, areaW, bh, 10);
    g.fillStyle(0x141c26, 0.9);
    g.fillRoundedRect(bx + bw - 18, by, 18, bh, 8);
    this.bodyContainer.add(g);
    const stripTxt = this.scene.add.text(bx + bw - 9, by + bh / 2, '요 리', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#4a5a68',
    }).setOrigin(0.5).setAngle(90);
    this.bodyContainer.add(stripTxt);

    // 타이틀 + [접기]
    const title = this.scene.add.text(bx + 14, by + 10, '사시미 만들기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#ffd257', fontStyle: 'bold',
    });
    this.bodyContainer.add(title);
    const fold = this.scene.add.text(bx + areaW - 14, by + 10, '[접기]', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    fold.on('pointerdown', () => { this.cookSub = 'none'; this.renderBody(); });
    this.bodyContainer.add(fold);

    // 접시 놓는 곳 rect (드롭 판정 공유)
    const px = bx + 120, pyTop = by + 8, pw = areaW - 240, ph = bh - 16;
    this.plateAreaRect = { x: px, y: pyTop, w: pw, h: ph };

    if (!this.plateState) {
      const drop = this.scene.add.graphics();
      drop.lineStyle(1.5, 0x4a6a88, 0.9);
      // 점선 사각 (수동 대시)
      const dash = 8;
      for (let dx = 0; dx < pw; dx += dash * 2) drop.lineBetween(px + dx, pyTop, px + Math.min(dx + dash, pw), pyTop);
      for (let dx = 0; dx < pw; dx += dash * 2) drop.lineBetween(px + dx, pyTop + ph, px + Math.min(dx + dash, pw), pyTop + ph);
      for (let dy = 0; dy < ph; dy += dash * 2) drop.lineBetween(px, pyTop + dy, px, pyTop + Math.min(dy + dash, ph));
      for (let dy = 0; dy < ph; dy += dash * 2) drop.lineBetween(px + pw, pyTop + dy, px + pw, pyTop + Math.min(dy + dash, ph));
      this.bodyContainer.add(drop);
      const wipCnt = InventoryStore.items.filter((i) => this.isWipPlate(i)).length;
      const hint = this.scene.add.text(px + pw / 2, pyTop + ph / 2,
        wipCnt > 0
          // ⚠ 합성 문자열은 사전을 비껴간다(131차) — 조각을 먼저 번역해 붙인다
          ? `${t('사시미 접시 자리')}\n${t('미완성 접시')} ${wipCnt}`
          : '사시미 접시 자리', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#5a7a98', align: 'center', lineSpacing: 6,
        }).setOrigin(0.5);
      this.bodyContainer.add(hint);
      return;
    }

    this.drawPlate(px + pw / 2, pyTop + ph / 2 + 4);

    // 우측 컨트롤 — 접시 돌리기 + 용량 안내 + [완성]/[접시 빼기]
    const cx = bx + areaW - 108;
    const rotLbl = this.scene.add.text(cx + 46, by + 34, '접시 돌리기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8faabf',
    }).setOrigin(0.5);
    this.bodyContainer.add(rotLbl);
    const mkRot = (x: number, glyph: string, dir: number): void => {
      const bg2 = this.scene.add.graphics();
      bg2.fillStyle(0x1c3550, 0.95);
      bg2.fillRoundedRect(x, by + 44, 40, 26, 5);
      bg2.lineStyle(1.2, 0xff6a5a, 0.9);
      bg2.strokeRoundedRect(x, by + 44, 40, 26, 5);
      const t = this.scene.add.text(x + 20, by + 57, glyph, {
        fontFamily: 'monospace', fontSize: '14px', color: '#cfe3f2', fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(x + 20, by + 57, 40, 26, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.rotatePlate(dir));
      this.bodyContainer.add([bg2, t, hit]);
    };
    mkRot(cx, '↶', 1);
    mkRot(cx + 50, '↷', -1);

    const st = this.plateState;
    const spec = SASHIMI_PLATE_SPECS[st.size];
    const placed = st.quads.reduce((s, q) => s + q.length, 0);
    const total = spec.perQuad * 4;
    const totalG = st.quads.flat().reduce((s, p) => s + p.weightG, 0);
    const species = new Set(st.quads.flat().map((p) => p.speciesId));
    const allAdv = st.quads.flat().length > 0 && st.quads.flat().every((p) => p.adv);
    const info = this.scene.add.text(cx, by + 82, [
      `접시 ${st.size} — 방위당 ${spec.perQuad}점`,
      `배치 ${placed} / ${total}점`,
      `총 ${totalG}g · ${species.size}종${allAdv ? ' · 고급' : ''}`,
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fc0d4', lineSpacing: 5,
    });
    this.bodyContainer.add(info);

    // [완성] — 전 방위 만석 시 활성
    const canDone = placed >= total;
    const doneBg = this.scene.add.graphics();
    doneBg.fillStyle(canDone ? 0x0d4a2e : 0x1c2530, 0.96);
    doneBg.fillRoundedRect(cx, by + bh - 66, 96, 26, 5);
    doneBg.lineStyle(1.5, canDone ? 0x4af2a1 : 0x3a4a58, 0.9);
    doneBg.strokeRoundedRect(cx, by + bh - 66, 96, 26, 5);
    const doneTxt = this.scene.add.text(cx + 48, by + bh - 53, '사시미 완성', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
      color: canDone ? '#4af2a1' : '#5a6a78', fontStyle: 'bold',
    }).setOrigin(0.5);
    const doneHit = this.scene.add.rectangle(cx + 48, by + bh - 53, 96, 26, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    doneHit.on('pointerdown', () => this.finalizePlate());
    this.bodyContainer.add([doneBg, doneTxt, doneHit]);

    // [접시 빼기] — 빈 접시는 반환 / 담긴 조각이 있으면 **미완성 접시로 보관**(135차)
    const outTxt = this.scene.add.text(cx + 48, by + bh - 26,
      placed > 0 ? '[미완성으로 빼기]' : '[접시 빼기]', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8faabf',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    outTxt.on('pointerdown', () => this.unmountPlate());
    this.bodyContainer.add(outTxt);
  }

  /** 접시 렌더 — 크기별 스케일, 4방위, 우상(활성 방위)부터 배치 표시 */
  private drawPlate(cx: number, cy: number): void {
    const st = this.plateState;
    if (!st) return;
    const scale = { '소': 0.62, '중': 0.75, '대': 0.88, '특대': 1.0 }[st.size];
    const rx = 132 * scale, ry = 52 * scale;
    const g = this.scene.add.graphics();
    // 접시 (테두리 림 + 안쪽 링)
    g.fillStyle(0xdfe4e8, 1);
    g.fillEllipse(cx, cy, rx * 2, ry * 2);
    g.fillStyle(0xeef2f5, 1);
    g.fillEllipse(cx, cy, rx * 1.72, ry * 1.72);
    g.lineStyle(1, 0xb8c2ca, 0.8);
    g.strokeEllipse(cx, cy, rx * 1.3, ry * 1.3);
    g.strokeEllipse(cx, cy, rx * 2, ry * 2);
    this.bodyContainer.add(g);
    // (활성 방위 녹색 호 + '배치 방위' 라벨은 제거 — 조각이 놓이는 걸 보면 알 수 있음. 사용자 지시 2026-08-05)

    // 조각 렌더 — 저장 방위 q의 화면 방위 = (q - rotation + 4) % 4. [0 우상, 1 좌상, 2 좌하, 3 우하]
    // 화면 방위별 타원 호 시작각(도, 화면좌표 y+아래): 우상 -90→0 / 좌상 180→270 / 좌하 90→180 / 우하 0→90.
    // ⚠ 구 수식은 하단 방위(좌하/우하)의 sin 부호가 항상 위쪽이라 우상/좌상 위치에 겹쳐 그려져
    //    3번째 회전부터 "접시가 안 돌아가는" 것처럼 보이던 실버그 (QA 리포트 2026-08-05).
    const spec = SASHIMI_PLATE_SPECS[st.size];
    const QUAD_BASE_DEG = [-90, 180, 90, 0];
    for (let q = 0; q < 4; q++) {
      const screen = (q - st.rotation + 4) % 4;
      for (let i = 0; i < st.quads[q].length; i++) {
        const p = st.quads[q][i];
        // 방위 내 호를 따라 겹치듯 배치 (사용자 도식 — 가운데부터 바깥으로)
        const t = (i + 0.5) / spec.perQuad;
        const ang = Phaser.Math.DegToRad(QUAD_BASE_DEG[screen] + t * 90);
        const pxx = cx + Math.cos(ang) * rx * 0.62;
        const pyy = cy + Math.sin(ang) * ry * 0.62;
        // 문어 숙회 한 점 = 전용 실사 조각 이미지 (098차 — 파라메트릭 '생선회 한 점' 대체)
        if ((p.speciesId === 'octopus' || p.speciesId === 'giant_octopus')
          && this.scene.textures.exists('sashimi_piece_octopus')) {
          const img = this.scene.add.image(pxx, pyy, 'sashimi_piece_octopus');
          const src = this.scene.textures.get('sashimi_piece_octopus').getSourceImage();
          const s = Math.min(26 / src.width, 20 / src.height);
          img.setDisplaySize(src.width * s, src.height * s);
          img.setAngle(-18 + (i % 3) * 14);
          this.bodyContainer.add(img);
          continue;
        }
        const pg = this.scene.add.graphics();
        const col = p.adv ? 0xff9a7a : 0xffb2a0;
        pg.fillStyle(col, 1);
        pg.fillRoundedRect(-8, -5, 16, 10, 3);
        pg.fillStyle(0xffffff, 0.75);
        pg.fillRect(-6, -1, 12, 2);
        pg.lineStyle(1, 0xc86a55, 0.9);
        pg.strokeRoundedRect(-8, -5, 16, 10, 3);
        pg.setPosition(pxx, pyy);
        pg.setAngle(-18 + (i % 3) * 14);
        this.bodyContainer.add(pg);
      }
    }

    // 활성 방위가 가득 찬 동안 상시 안내 — 접시 아래 중앙 (배치는 placePiece가 계속 차단.
    //  우측 컨트롤 열은 [완성] 버튼과 겹쳐 이곳에 배치. 사용자 지시 2026-08-05)
    const activeQuad = st.quads[st.rotation % 4];
    const totalPlaced = st.quads.reduce((s, qd) => s + qd.length, 0);
    if (activeQuad.length >= spec.perQuad && totalPlaced < spec.perQuad * 4) {
      const warn = this.scene.add.text(cx, cy + ry + 16, '해당 방위는 가득 찼습니다 — 접시를 돌리세요', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffb45a', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.bodyContainer.add(warn);
    }
  }

  /**
   * 접시 장착 — 인벤토리에서 1개 소모(스냅샷 보관, 빼기/파괴 시 반환).
   * **미완성 접시(plateWip)** 를 올리면 방위·조각 배치를 그대로 복원해 이어 담는다 (135차).
   */
  private mountPlate(item: InvItem): void {
    if (this.plateState) { this.flashBoardToast('이미 접시가 놓여 있습니다 — [접시 빼기] 후 교체하세요'); return; }
    if (item.plateWip) {
      const wip = item.plateWip;
      InventoryStore.removeQty(item.id, 1);
      this.plateState = {
        tmpl: { ...wip.plate, qty: 1 },
        size: wip.size,
        rotation: wip.rotation % 4,
        // 참조 공유 금지 — 아이템이 사라져도 패널 상태가 독립적으로 살아 있어야 한다
        quads: wip.quads.map((q) => q.map((pc) => ({ ...pc, tmpl: { ...pc.tmpl } }))),
      };
      this.renderBody();
      this.scene.events.emit('inventory-changed');
      const pr = plateWipProgress(wip);
      this.flashBoardToast(`미완성 접시를 이어서 담습니다 — ${pr.placed}/${pr.total}점 (${pr.pct}%)`);
      return;
    }
    const tmpl = { ...item, qty: 1 };
    InventoryStore.removeQty(item.id, 1);
    this.plateState = { tmpl, size: this.plateSizeOf(item), rotation: 0, quads: [[], [], [], []] };
    this.renderBody();
    this.scene.events.emit('inventory-changed');
  }

  /** 회 조각 배치 — 활성 방위(quads[rotation], 화면 우상)에 1점 */
  private placePiece(item: InvItem): void {
    const st = this.plateState;
    if (!st) { this.flashBoardToast('먼저 사시미 접시를 놓으세요'); return; }
    const spec = SASHIMI_PLATE_SPECS[st.size];
    const quad = st.quads[st.rotation % 4];
    if (quad.length >= spec.perQuad) {
      this.flashBoardToast(`이 방위는 가득 찼습니다 (${spec.perQuad}점) — 접시를 돌리세요`);
      return;
    }
    // 부패 조각은 담을 수 없다 (135차) — 접시 신선도는 가장 나쁜 조각을 계승하므로
    // 한 점만 썩어도 접시 전체가 판매 불가가 된다. 모르고 담는 사고를 여기서 막는다.
    refreshCondition(item);
    if (item.condition === 'spoiled') {
      this.flashBoardToast('부패한 회 조각은 접시에 담을 수 없습니다');
      return;
    }
    if (item.condition === 'bad') {
      this.flashBoardToast('경고: 나쁨 상태 조각입니다 — 접시 가치가 크게 떨어집니다');
    }
    const adv = item.id.startsWith('inv_sashimi_cut_adv_');
    quad.push({ tmpl: { ...item, qty: 1 }, speciesId: item.speciesId ?? '', weightG: item.weightG ?? 20, adv });
    InventoryStore.removeQty(item.id, 1);
    this.renderBody();
    this.scene.events.emit('inventory-changed');
  }

  private rotatePlate(dir: number): void {
    const st = this.plateState;
    if (!st) return;
    // 가득 찬 방위가 있어도 양방향 회전은 항상 가능 (사용자 지시 2026-08-05) —
    // 가득 찬 방위로 돌린 경우엔 안내만 띄우고, 그 방위 배치는 placePiece가 계속 차단.
    st.rotation = (st.rotation + dir + 4) % 4;
    this.renderBody();
    const spec = SASHIMI_PLATE_SPECS[st.size];
    if (st.quads[st.rotation % 4].length >= spec.perQuad) {
      this.flashBoardToast(`해당 방위는 가득 찼습니다 (${spec.perQuad}점) — 다른 방위로 돌려 배치하세요`);
    }
  }

  /** 완성 — 전 방위 만석: 2종 이상 = 모듬(고정가·g 하한) / 1종 = 단품(원물 kg 시세 계수) */
  private finalizePlate(): void {
    const st = this.plateState;
    if (!st) return;
    const spec = SASHIMI_PLATE_SPECS[st.size];
    const pieces = st.quads.flat();
    if (pieces.length < spec.perQuad * 4) {
      this.flashBoardToast(`모든 방위를 채워야 완성할 수 있습니다 (${pieces.length}/${spec.perQuad * 4}점)`);
      return;
    }
    const totalG = pieces.reduce((s, p) => s + p.weightG, 0);
    const species = [...new Set(pieces.map((p) => p.speciesId))];
    const adv = pieces.every((p) => p.adv);
    const worst = worstCondition(pieces.map((p) => p.tmpl));
    const kind = adv ? 'advanced' : 'basic';
    let name: string;
    let price: number;
    if (species.length >= 2) {
      // 모듬 — 고정 가격표 + g 하한 (싼 어종만으로 큰 접시 구성 제한)
      const row = MIXED_SASHIMI_PRICING[kind][st.size];
      if (totalG < row.minG) {
        this.flashBoardToast(`모듬 사시미 (${st.size})는 ${row.minG}g 이상이어야 합니다 — 현재 ${totalG}g`);
        return;
      }
      name = `${adv ? '고급 ' : ''}모듬 사시미 (${st.size}) ${totalG}g`;
      price = row.price;
    } else {
      // 단품 — **횟집 괴리율 보정식** (2026-08-04): 원물 1kg 시세 × 필요 원물량(회중량÷실수율) × 인분 마진
      const sp = species[0] ?? '';
      const def = FISH_DATABASE.find((f) => f.id === sp);
      const avgLen = def ? (def.avgSizeRangeCm[0] + def.avgSizeRangeCm[1]) / 2 : 30;
      const cache = ExternalDataStore.getWholesaleCache(sp, 'live');
      const kgPrice = evaluateFishSellPrice(sp, avgLen, 1000, cache).finalPrice;
      price = singleSashimiPlatePrice(kgPrice, kind, st.size);
      name = `${def?.nameKo ?? '생선'} ${adv ? '고급 ' : ''}사시미 (${st.size}) ${totalG}g`;
    }
    // 155차 — 맛 별 5개(신선도·칼질·식감·구성·완성도). 담을 때 별점으로 판매가를 확정한다.
    const cutQs = pieces.map((p) => p.tmpl.cutQuality ?? 0.7);
    const tiers = pieces.map((p) => p.tmpl.knifeTier ?? 'sashimi');
    const knifeTier = tiers.includes('utility') ? 'utility' : tiers.every((t) => t === 'yanagiba') ? 'yanagiba' : 'sashimi';
    const meta: SashimiPlateMeta = {
      madeAtMs: Date.now(), mode: kind, size: st.size, species, totalG, pieces: pieces.length,
      cutQ: cutQs.reduce((a, b) => a + b, 0) / Math.max(1, cutQs.length),
      knifeTier,
      quadBalance: quadBalanceOf(st.quads.map((qd) => qd.reduce((a, p) => a + p.weightG, 0))),
      starsAtMake: 0,
    };
    const starsNow = sashimiStarsAt(meta, worst?.condition ?? 'fresh', meta.madeAtMs);
    meta.starsAtMake = starsNow.stars;
    if (starsNow.stars >= 5) TitleStore.bump('sashimiFiveStar');   // 203차 — 「회칼 장인」
    price = Math.round(price * sashimiStarPriceMult(starsNow.stars) / 100) * 100;
    name = sashimiPlateName(name, starsNow.stars);
    const seq = InventoryStore.nextCatchSeq();
    InventoryStore.addItem({
      id: `inv_sashimi_plate_${adv ? 'adv' : 'std'}_${seq}`,
      name, icon: '🍣', iconTexture: 'food_assorted_sashimi',
      category: 'food', subCategory: '요리(회)',
      basePrice: price,
      sashimi: meta,
      // 신선도는 **가장 먼저 상하는 조각**을 계승한다 (135차) —
      // 구 구현은 무조건 'fresh'라 나쁨(가치 10%) 조각을 접시로 세탁할 수 있었다.
      condition: worst?.condition ?? 'fresh',
      conditionSinceMs: worst?.conditionSinceMs ?? Date.now(),
      equippable: false,
      weightG: totalG,
      ...(species.length === 1 ? { speciesId: species[0] } : {}),
    }, 1);
    this.plateState = null;   // 접시는 요리에 소모 (완성 접시째 판매)
    this.renderBody();
    this.scene.events.emit('inventory-changed');
    this.flashBoardToast(`${name} 완성! — 판매가 ${price.toLocaleString()}원 · ${starsNow.parts.filter((pp) => !pp.earned).map((pp) => pp.labelKo).join('·') || '다섯 항목 전부 충족'}`);
  }

  /**
   * 접시 빼기/중단 (135차 사용자 결정) —
   *  - 조각이 담겨 있으면 **미완성 접시 1개**로 보관한다(조각을 흩뜨리지 않는다).
   *    다시 올리면 담던 자리에서 이어진다. 조각만 되찾으려면 인벤 우클릭 [해체하기].
   *  - 빈 접시면 접시 그대로 반환.
   * @returns 미완성으로 보관했으면 true
   */
  private unmountPlate(silent = false): boolean {
    const st = this.plateState;
    if (!st) return false;
    const pieces = st.quads.flat();
    if (pieces.length === 0) {
      InventoryStore.addItem({ ...st.tmpl }, 1);
      this.plateState = null;
      if (!silent) { this.renderBody(); this.scene.events.emit('inventory-changed'); }
      return false;
    }
    const wip: PlateWipData = {
      plate: { ...st.tmpl },
      size: st.size,
      rotation: st.rotation % 4,
      quads: st.quads.map((q) => q.map((pc) => ({ ...pc, tmpl: { ...pc.tmpl } }))),
    };
    const pr = plateWipProgress(wip);
    const totalG = pieces.reduce((sum, pc) => sum + pc.weightG, 0);
    const species = [...new Set(pieces.map((pc) => pc.speciesId).filter(Boolean))];
    // 신선도는 **가장 먼저 상하는 조각**을 그대로 계승 — 접시로 옮겨 담아 시계를 리셋할 수 없다
    const worst = worstCondition(pieces.map((pc) => pc.tmpl));
    const adv = pieces.every((pc) => pc.adv);
    const seq = InventoryStore.nextCatchSeq();
    const ok = InventoryStore.addItem({
      id: `inv_sashimi_wip_${seq}`,
      name: `${adv ? '고급 ' : ''}사시미 접시 (${st.size} · 미완성 ${pr.placed}/${pr.total})`,
      icon: '🍽', iconTexture: 'food_assorted_sashimi',
      category: 'food', subCategory: '요리(회)',
      basePrice: 0,
      condition: worst?.condition ?? 'fresh',
      conditionSinceMs: worst?.conditionSinceMs ?? Date.now(),
      equippable: false,
      weightG: totalG,
      plateWip: wip,
      ...(species.length === 1 ? { speciesId: species[0] } : {}),
    }, 1);
    if (!ok) {
      // 인벤 만석 — 아이템 유실 금지(61차 규칙). 접시는 도마에 그대로 두고 안내만 한다.
      this.flashBoardToast('인벤토리 공간이 부족합니다 — 칸을 비우고 다시 빼세요');
      return false;
    }
    this.plateState = null;
    if (!silent) {
      this.renderBody();
      this.scene.events.emit('inventory-changed');
      this.flashBoardToast(`미완성 접시로 보관했습니다 — ${pr.placed}/${pr.total}점 (${pr.pct}%)`);
    }
    return true;
  }

  /**
   * 도마 조각 스테이징 렌더 — 회썰기 직후의 썰린 모양 그대로, 조각(피스 아이콘)들을
   * 부채꼴로 진열한다. 각 조각 = 드래그 시작점(아래 접시로 1점씩) — 재고는 인벤 스택과 동기.
   */
  private renderSlicedBoard(bx: number, by: number, bw: number, bh: number): void {
    const item = InventoryStore.find(this.boardSlicedItemId!);
    if (!item) return;
    const fam = butcherFamilyOf(item.speciesId ?? '');
    // 문어 숙회 한 점은 전용 실사 조각 (098차) — 어류 fam 폴백(bream 슬라이스)을 타면 안 된다
    const texKey = item.speciesId === 'octopus' || item.speciesId === 'giant_octopus'
      ? 'sashimi_piece_octopus' : `sashimi_piece_${fam}`;
    const hasTex = this.scene.textures.exists(texKey);
    const n = Math.min(item.qty, 16);
    const cols = 8;
    const cellW = (bw - 120) / (cols - 1);
    for (let i = 0; i < n; i++) {
      const px = bx + 60 + (i % cols) * cellW;
      const py = by + 74 + Math.floor(i / cols) * 86 + (i % 2) * 6;
      const ang = -14 + (i % 4) * 9;
      if (hasTex) {
        const img = this.scene.add.image(px, py, texKey);
        const src = this.scene.textures.get(texKey).getSourceImage();
        const s = Math.min(40 / src.width, 66 / src.height);
        img.setDisplaySize(src.width * s, src.height * s);
        img.setAngle(ang);
        this.bodyContainer.add(img);
      } else {
        const icon = createItemIcon(this.scene, px, py, item, 34);
        this.bodyContainer.add(icon);
      }
      const hit = this.scene.add.rectangle(px, py, 44, 70, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => this.startCookDrag(item, 'add', p));
      this.bodyContainer.add(hit);
    }
    const lbl = this.scene.add.text(bx + bw / 2, by + bh - 18,
      `${t(item.name)} ×${item.qty}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#3a2c1a', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.bodyContainer.add(lbl);
    // [치우기] — 진열 해제 (조각은 인벤토리에 그대로)
    const off = this.scene.add.text(bx + bw - 41, by + 19, '치우기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffce9a',
      backgroundColor: '#3a2a20f2', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    off.on('pointerdown', () => { this.boardSlicedItemId = null; this.renderBody(); });
    this.bodyContainer.add(off);
  }

  /** 포인터가 접시 영역 위인지 (패널 로컬) */
  private overPlate(p: Phaser.Input.Pointer): boolean {
    if (this.cookSub !== 'sashimi') return false;
    const lx = p.x - this.x, ly = p.y - this.y, r = this.plateAreaRect;
    return lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h;
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
      const nm = setSlotLabel(this.scene.add.text(cx + cell / 2, cy + cell - 2, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: `${SLOT_LABEL_PX}px`, color: '#cfe3f2',
      }).setOrigin(0.5, 1), item.name, cell - 6);   // 188차 — 8px 대신 이름 축약
      this.bodyContainer.add(nm);
      if (item.qty > 1) {
        const q = this.scene.add.text(cx + cell - 6, cy + 4, `x${item.qty}`, {
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

      // 손질 프로필 보유 어획물(finfish) + 두족류는 도마로 드래그 가능 (복어/미지원은 불가)
      const fam = item.subCategory === '어획물' ? getButcheryFamily(item.speciesId ?? '') : 'unsupported';
      // 껍질 붙은 필렛(재개)·순수 필렛(회썰기)·접시/회 조각(플레이팅)도 드래그 가능
      const draggableFish = fam === 'finfish' || fam === 'cephalopod'
        || !!this.resumeSectionOf(item) || this.isPureFillet(item) || this.isPureEngawa(item)
        || !!this.cephSliceKind(item)
        || this.isPlateItem(item) || this.isWipPlate(item) || this.isSashimiPiece(item);
      const hit = this.scene.add.rectangle(cx + cell / 2, cy + cell / 2, cell, cell, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      if (draggableFish) {
        // 커스텀 드래그(pointerdown→씬 pointermove/up) — 이동 없으면 클릭=선택
        hit.on('pointerdown', (p: Phaser.Input.Pointer) => this.startCookDrag(item, 'add', p));
      } else {
        hit.on('pointerdown', () => { this.cookSelectedId = item.id; this.renderBody(); });
      }
      this.bodyContainer.add(hit);
      if (this.cookSelectedId === item.id) {
        const sel = this.scene.add.graphics();
        sel.lineStyle(2, 0x4af2a1, 1);
        sel.strokeRoundedRect(cx, cy, cell, cell, 4);
        this.bodyContainer.add(sel);
      }
    }

    // 하단: 선택 아이템 안내
    const selItem = this.cookSelectedId ? InventoryStore.find(this.cookSelectedId) : undefined;
    const footY = gridY + 5 * (cell + gap) + 4;
    const selFam = selItem?.subCategory === '어획물' ? getButcheryFamily(selItem.speciesId ?? '') : 'unsupported';
    // 188차 — '도마로 드래그하면 …' 같은 조작 안내를 지우고, 올렸을 때 **무엇이 되는지**만 적는다.
    //   끌어다 올리는 조작은 첫 열기 가이드가 가르친다.
    const selHint = selItem
      ? (this.cephSliceKind(selItem) === 'mantle' ? '오징어 회뜨기 — 가운데 1컷 + 세로 10컷 = 22점'
        : this.cephSliceKind(selItem) === 'fin' ? '날개살 회뜨기 — 날개당 1컷 = 4점'
        : this.cephSliceKind(selItem) === 'arms' ? '촉완 분리 — 촉완 ×2 + 다리부 (회가 아닌 요리 재료)'
        : this.cephSliceKind(selItem) === 'octoWhole' ? '다리 분리 — 3컷, 삶은 문어 머리 1 + 다리 8'
        : this.cephSliceKind(selItem) === 'octoLeg' ? '숙회 썰기 — 사선 7컷 = 8점'
        : selItem.id.startsWith('inv_ceph_octo_whole_') ? '생 문어는 도마에 올릴 수 없다 — 먼저 삶아야 한다'
        : this.isPureEngawa(selItem) ? '엔가와 회썰기 — 총 2컷'
        : this.isPureFillet(selItem) ? '회썰기(사시미) — 야나기바를 들면 고급 사시미'
        : this.isWipPlate(selItem) ? '담던 접시 — 담던 자리에서 이어 담는다'
        : this.isPlateItem(selItem) ? '사시미 접시'
        : this.isSashimiPiece(selItem) ? '회 조각 — 접시의 활성 방위에 한 점씩 담는다'
        : selItem && this.resumeSectionOf(selItem) ? (this.isRibFillet(selItem) ? '갈빗대 제거부터 이어서 손질'
          : this.isPinFillet(selItem) ? '지아이뼈 분리부터 이어서 손질'
          : this.isEngwFillet(selItem) ? '엔가와 분리부터 이어서 손질'
          : '박피부터 이어서 손질')
        : selFam === 'finfish' || selFam === 'cephalopod'
          ? '도마에 올려 손질할 수 있다'
          : selFam === 'pufferfish' ? '복어는 자격·독 처리 준비 중 — 도마 불가'
          : '이 아이템은 도마에 올릴 수 없습니다')
      : '';
    const foot = this.scene.add.text(x + 14, footY,
      selItem
        ? `선택: ${selItem.name}${selItem.condition ? ` (${CONDITION_LABEL[selItem.condition]})` : ''} — ${t(selHint)}`
        : '', {
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

  // ═══════════════════════════════════════════════════
  // 제작 (Crafting) — 핸드크래프팅 보드 (129차 P7 · SPEC §2-5)
  //  기본 제작은 **조건 없이** 여기서 한다. 고급 품목은 설치한 제작대에서 [F].
  // ═══════════════════════════════════════════════════
  private renderCrafting(): void {
    this.craftBoard?.destroy();
    const top = this.contentTop + 52;
    this.craftBoard = new CraftBoard(this.scene, this.bodyContainer, {
      station: 'hand',
      x: 20, y: top, w: PANEL_W - 40, h: PANEL_H - top - 16,
      origin: () => ({ x: this.x + this.bodyContainer.x, y: this.y + this.bodyContainer.y }),
      alive: () => this.active && this.visible,
      onCrafted: () => this.scene.events.emit('inventory-changed'),
    });
    this.craftBoard.render();
  }

  private renderChumMixing(): void {
    // 밑밥 통은 쿨러(기타 아이템)에 딸린 기능 — 쿨러 미보유 시 배합 비활성
    if (!InventoryStore.hasCooler()) {
      const notice = this.scene.add.text(GAME_WIDTH / 2, this.contentTop + 180,
        '쿨러가 없습니다.\n\n밑밥 배합은 쿨러(아이스박스)가 있어야 사용할 수 있습니다.\n식자재마트에서 쿨러를 구할 수 있습니다.', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ff9a6a', fontStyle: 'bold',
          align: 'center', lineSpacing: 8,
        }).setOrigin(0.5, 0);
      this.bodyContainer.add(notice);
      return;
    }
    const { x: boxX, y: boxY, w: boxW, h: boxH } = UtilizationPanel.CHUM_BOX;
    const mixed = CoolerStore.chumMixed || CoolerStore.chumRemaining > 0;

    // 상태 헤더
    const header = this.scene.add.text(boxX, this.contentTop + 56,
      mixed
        ? `배합 완료 — 남은 밑밥 ${CoolerStore.chumRemaining} / ${CoolerStore.chumMax} (1인칭 C 투척 1회당 ${CHUM_THROW_COST} 소모)`
        : '밑밥 통', {
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
      const remain = this.scene.add.text(boxX + boxW / 2, boxY + boxH / 2, `${CoolerStore.chumRemaining} / ${CoolerStore.chumMax}`, {
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
        const hint = this.scene.add.text(boxX + boxW / 2, boxY + boxH / 2, '비어 있음', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#9a9a92', align: 'center', lineSpacing: 6,
        }).setOrigin(0.5);
        this.bodyContainer.add(hint);
      }
    }

    // ── 물 넣기 / 섞기 / 밑밥 비우기 버튼 ──
    const canWater = !mixed && !CoolerStore.chumWaterAdded && CoolerStore.chumIngredients.length > 0;
    const canMix = !mixed && CoolerStore.chumWaterAdded && !CoolerStore.chumMixed;
    // 비우기 — 재료/물/배합 밑밥이 뭐라도 있으면 가능 (통 리셋 후 새 배합 시작)
    const canEmpty = CoolerStore.chumIngredients.length > 0 || CoolerStore.chumWaterAdded || CoolerStore.chumRemaining > 0;
    const btnY = boxY + boxH + 32;
    this.addChumButton(boxX + boxW / 2 - 160, btnY,
      CoolerStore.chumWaterAdded || mixed ? '물 넣기 (완료)' : '물 넣기', canWater, () => this.doChumWater());
    this.addChumButton(boxX + boxW / 2, btnY,
      mixed ? '섞기 (완료)' : '섞기', canMix, () => this.doChumMix());
    this.addChumButton(boxX + boxW / 2 + 160, btnY, '밑밥 비우기', canEmpty, () => {
      CoolerStore.resetChumBox();
      this.renderBody();
    });

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
        // 224차 — 빵가루를 물과 갤 때 바늘에 달 경단(200g ≈ 10개)도 따로 뭉쳐 둔다
        if (CoolerStore.chumHasBread()) {
          const ball = InventoryStore.seedTemplate('inv_breadbait');
          if (ball && InventoryStore.addItem(ball, BREAD_BALLS_PER_MIX)) this.scene.events.emit('inventory-changed');
        }
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
      locked ? '밑밥 재료 — 남은 밑밥을 다 쓰면 새로 배합할 수 있습니다' : '밑밥 재료', {
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
      const nm = setSlotLabel(this.scene.add.text(cx + cell / 2, cy + cell - 24, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: `${SLOT_LABEL_PX}px`, color: '#cfe3f2',
      }).setOrigin(0.5), item.name, cell - 8);   // 188차 — 8px 대신 이름 축약
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

  /** 229차 — 밑밥 통 위에 잠깐 뜨는 한 줄(언 크릴 · 상한 재료) */
  private chumNotice(msg: string): void {
    const { x: bx, y: by, w: bw } = UtilizationPanel.CHUM_BOX;
    const t = this.scene.add.text(bx + bw / 2, by - 6, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffb0a4', fontStyle: 'bold',
      backgroundColor: '#1a0b0bdd', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1);
    this.add(t);
    this.applyFix();
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 1600, duration: 400, onComplete: () => t.destroy() });
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
    // 229차 — 급랭 백크릴은 녹기 전엔 밑밥에 못 갠다(사용자 지정). 상한 것도 안 된다
    refreshCondition(item);
    if (item.chumKind === 'krill' && item.condition === 'frozen') { this.chumNotice('꽁꽁 얼어 있다 — 녹인 뒤에 갠다'); return; }
    if (item.condition === 'spoiled') { this.chumNotice('상했다 — 밑밥에 넣을 수 없다'); return; }
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

  /** 회 뜨기 미니게임 열기 (도마 위 생선 대상) */
  private openButchery(fish: InvItem): void {
    if (this.butcheryPanel) return;
    // 최초 회뜨기 — 통합 가이드 '회뜨기' 탭 1회 자동 표시, 닫으면 손질로 진행
    if (!GameState.getFlag('guideSeen.butchery')) {
      GameState.setFlag('guideSeen.butchery');
      if (!this.guideHubPanel) {
        const gp = new GuidePanel(this.scene, {
          initialCat: 'butchery',
          onClose: () => {
            this.guideHubPanel?.destroy();
            this.guideHubPanel = undefined;
            this.openButchery(fish);
          },
        });
        this.scene.add.existing(gp);
        this.guideHubPanel = gp;
      }
      return;
    }
    this.butcheryPanel = new ButcheryPanel(this.scene, fish, {
      // 껍질 붙은 필렛 재장착 = 앞 섹션을 모두 마친 것으로 보고 **박피부터** 시작
      resumeSectionId: this.resumeSectionOf(fish),
      onClose: () => {
        this.butcheryPanel?.destroy();
        this.butcheryPanel = undefined;
      },
      onComplete: () => {
        // 필렛 지급/원본 소모는 ButcheryPanel이 처리 — 도마 비우고 갱신
        this.butcheryPanel?.destroy();
        this.butcheryPanel = undefined;
        this.cookBoardFishId = null;
        this.renderBody();
        this.scene.events.emit('inventory-changed');
      },
      // [다음 생선 손질] — 인벤토리의 다음 finfish 어획물을 도마에 올려 바로 이어서 (P1-4)
      onNext: () => {
        const next = InventoryStore.items.find(
          (i) => i.subCategory === '어획물' && getButcheryFamily(i.speciesId ?? '') === 'finfish',
        );
        this.butcheryPanel?.destroy();
        this.butcheryPanel = undefined;
        this.scene.events.emit('inventory-changed');
        if (next) {
          this.cookBoardFishId = next.id;
          this.cookSelectedId = next.id;
          this.renderBody();
          this.openButchery(next);
        } else {
          this.cookBoardFishId = null;
          this.renderBody();
        }
      },
    });
    this.scene.add.existing(this.butcheryPanel);
  }

  /** 회썰기(사시미) 미니게임 열기 — 순수 필렛 + 모드 (버튼 게이트는 renderCooking이 담당) */
  private openSashimi(fillet: InvItem, mode: SashimiMode): void {
    if (this.sashimiPanel || this.butcheryPanel) return;
    this.sashimiPanel = new SashimiPanel(this.scene, fillet, mode, {
      onClose: () => {
        // 중단 = 필렛 보존 — 도마 그대로
        this.sashimiPanel?.destroy();
        this.sashimiPanel = undefined;
      },
      onComplete: (grantedId) => {
        // 조각 지급/필렛 소모는 SashimiPanel이 처리 — **썰린 조각을 도마에 진열**하고
        // 사시미 만들기 영역을 펼쳐 바로 접시 드래그로 이어진다 (사용자 도식 2026-08-04)
        this.sashimiPanel?.destroy();
        this.sashimiPanel = undefined;
        this.cookBoardFishId = null;
        this.boardSlicedItemId = grantedId ?? null;
        this.cookSub = 'sashimi';
        this.renderBody();
        this.scene.events.emit('inventory-changed');
      },
    });
    this.scene.add.existing(this.sashimiPanel);
  }

  /**
   * 씬 ESC 인터셉트 — 손질(ButcheryPanel)/회썰기(SashimiPanel)가 열려 있으면
   * **U패널 대신 그쪽부터 닫는다**(LIFO). requestClose 경유라 정산/보존 규칙 유지.
   * true 반환 = ESC를 소비했으니 U패널은 닫지 말 것 (RegionFieldScene.closeTopPopup).
   */
  onEscIntercept(): boolean {
    // LIFO — 도움말 → 회썰기 → 손질 순으로 먼저 닫는다 (U패널 자체는 마지막)
    if (this.cookHelpPopup) { this.closeCookHelp(); return true; }
    if (this.sashimiPanel) {
      this.sashimiPanel.escClose();
      return true;
    }
    if (this.butcheryPanel) {
      this.butcheryPanel.escClose();
      return true;
    }
    return false;
  }

  override destroy(fromScene?: boolean): void {
    this.closeChooser();
    this.closeCookHelp();   // 씬 레벨 팝업이라 U패널과 함께 정리해야 잔상이 남지 않는다
    // 플레이팅 진행 중 파괴 = **미완성 접시로 보관**(조각 유지 — 135차), 빈 접시는 그대로 반환.
    // 아이템 유실 방지 규칙(61차 destroy 안전망)은 그대로 — 인벤 만석이면 조각째 개별 반환한다.
    if (this.plateState) {
      const kept = this.unmountPlate(true);
      if (!kept && this.plateState) {
        const st = this.plateState as NonNullable<typeof this.plateState>;
        InventoryStore.addItem({ ...st.tmpl }, 1);
        for (const p of st.quads.flat()) InventoryStore.addItem({ ...p.tmpl }, 1);
        this.plateState = null;
      }
    }
    this.craftBoard?.destroy();
    this.craftBoard = undefined;
    this.butcheryPanel?.destroy();
    this.butcheryPanel = undefined;
    this.sashimiPanel?.destroy();
    this.sashimiPanel = undefined;
    this.swapConfirm?.destroy();
    this.swapConfirm = undefined;
    this.dragGhost?.destroy();
    this.dragGhost = undefined;
    this.scene?.input?.off('pointermove', this.chumMoveHandler);
    this.scene?.input?.off('pointerup', this.chumUpHandler);
    this.scene?.input?.off('pointermove', this.cookMoveHandler);
    this.scene?.input?.off('pointerup', this.cookUpHandler);
    this.chumGhost?.destroy();
    super.destroy(fromScene);
  }
}
