/**
 * @file ButcheryPanel.ts
 * @description 회 뜨기(활어 손질~삼면뜨기~박피) 미니게임 패널
 *
 * UtilizationPanel 요리 탭 도마의 [손질 시작]에서 열린다.
 * 로직/판정은 전부 core(ButcheryProcess/evaluateCut)가 담당하고,
 * 이 패널은 **방향 상태 렌더(파라메트릭 생선 템플릿) + 입력 수집 + 연출**만 한다.
 *
 * 인터랙션 프리미티브:
 *  - tap(시메): 뇌 지점 클릭
 *  - guided_cut: 노란 점선 가이드를 따라 드래그 트레이스 (커버율·이탈 판정은 core)
 *  - drag_fill(비늘)/scoop(내장): 영역을 문질러 채움
 *  - wash: 버튼 (세척/얼음물)
 *  - peel(박피): 꼬리 손잡이를 잡고 왼쪽으로 당김 (각도·거리 → 품질)
 * 방향 전환은 하단 Orient 버튼 — 잘못된 방향이면 칼질 비활성 + 힌트.
 */

import Phaser from 'phaser';
import {
  ButcheryProcess, getButcheryProfile, CutPoint, OrientationState, ButcheryStage,
  orientationLabel, ButcheryOrientation, ROTATION_LABEL, FISH_DATABASE, getButcheryFamily,
  computeFilletYield, getBestKnife, KnifeSpec,
  TUNING,
  SASHIMI_GUIDE_GROUP, SASHIMI_GUIDE_SHEET, LIVE_STAGE_GUIDE,
  guideCutByKey,
  WHOLE_FISH_SECTIONS, sectionsForBodyShape, ButcherySectionDef, ButcherySectionYield,
} from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { fitTextHeight, clampTextWidth } from './TextFit.js';
import { getFishColors } from './FishTemplateRenderer.js';
import { drawPixelButcherFish, butcherSpritesFor, computeFishFrame } from './PixelButcherFish.js';
import { SASHIMI_GUIDE_TEXTURE, guideFrameName, hasGuideFrames } from '../data/SashimiGuideFrames.js';

/**
 * 어류 트리 전용 뷰 좁히기 — 이 패널의 어류 경로는 항상 어류 5종 뷰(OrientationState)만 낸다.
 * 두족류 9종 뷰는 별도 렌더러가 담당하므로, `ButcheryOrientation` 위드닝(v3.1) 이후의 경계 어댑터.
 */
const asFishOri = (o: ButcheryOrientation): OrientationState => o as OrientationState;

const PANEL_W = 1080;
/** 656 = 세로 생선(90° 회전)이 도마 밖으로 자연스럽게 튀어나올 하단 여유 확보 (화면 720 안 — 32~688) */
const PANEL_H = 656;

export interface ButcheryCallbacks {
  onClose: () => void;
  /** 손질 완료 — 필렛 지급/원본 소모까지 끝난 뒤 호출 (도마 비우기용) */
  onComplete: () => void;
  /** [다음 생선 손질] — 인벤토리의 다음 finfish 어획물로 이어서 손질 (연속 흐름, P1-4). 없으면 미제공 */
  onNext?: () => void;
  /**
   * 재장착 시작 섹션 — 껍질 붙은 필렛을 도마에 올리면 `'sec_peel'`로 시작한다.
   * 그 앞 섹션·작업은 모두 완료 처리된다 (원물이 아니라 중간 산출물이므로).
   */
  resumeSectionId?: string;
}

export class ButcheryPanel extends DraggablePanel {
  private source: InvItem;
  private process: ButcheryProcess;
  private cbs: ButcheryCallbacks;
  /** 보유 최고 회칼 (null이면 회뜨기 단계 잠금) */
  private knife: KnifeSpec | null;
  /** 결과 처리 완료 후 추가 입력 차단 */
  private done = false;

  // 생선 렌더 영역 (패널 로컬) — 가로 배치 기준값
  private static readonly FISH_X0 = 56;
  private static readonly FISH_Y0 = 190;
  private static readonly FISH_W0 = 560;
  private static readonly FISH_H0 = 210;
  /**
   * 90° 회전 시 생선 축소율 — **도마는 가로 그대로 두고 생선만 세로로 돌린다**
   * (사용자 지시 2026-08-06 — 구 "도마 프레임 자체를 세로로 세우는" 방식 폐기).
   * 생선이 도마 밖으로는 튀어나와도 되지만(사용자 승인 — 실물처럼 머리/꼬리가 도마를 넘음)
   * **손질 창 안에는 들어와야 한다**: 0.55 → 세로 308px(141~449) — 상단 작업 패널(하단 ≈130)과
   * 하단 상태줄(≈455)을 피한다. PANEL_H 656 확장과 한 쌍으로 잡은 값.
   */
  private static readonly ROT_SCALE = 0.55;

  /** 생선이 세로로 서 있는가 (90·270°) — 도마는 회전과 무관하게 가로 고정 */
  private get rotated(): boolean {
    const r = this.process.rotation;
    return r === 90 || r === 270;
  }
  /** 도마 중심 (회전과 무관하게 고정) */
  private get boardCx(): number { return ButcheryPanel.FISH_X0 + ButcheryPanel.FISH_W0 / 2; }
  private get boardCy(): number { return ButcheryPanel.FISH_Y0 + ButcheryPanel.FISH_H0 / 2; }

  // 도마 rect — **항상 가로 고정**. 도마 프레임·오버레이·플래시·dev 목록 등
  // 레이아웃 앵커는 전부 이 rect를 쓴다 (회전해도 UI가 밀리지 않는다).
  private get boardX(): number { return ButcheryPanel.FISH_X0; }
  private get boardY(): number { return ButcheryPanel.FISH_Y0; }
  private get boardW(): number { return ButcheryPanel.FISH_W0; }
  private get boardH(): number { return ButcheryPanel.FISH_H0; }

  // 회전이 반영된 **생선** rect — 유도선(toPanelPx)·입력(toNorm)·스프라이트 렌더만 공유한다.
  private get fishW(): number {
    const S = ButcheryPanel.ROT_SCALE;
    return this.rotated ? Math.round(ButcheryPanel.FISH_H0 * S) : ButcheryPanel.FISH_W0;
  }
  private get fishH(): number {
    const S = ButcheryPanel.ROT_SCALE;
    return this.rotated ? Math.round(ButcheryPanel.FISH_W0 * S) : ButcheryPanel.FISH_H0;
  }
  private get fishX(): number { return Math.round(this.boardCx - this.fishW / 2); }
  private get fishY(): number { return Math.round(this.boardCy - this.fishH / 2); }

  // ── 넙치류 포 뜨기 — 칼 팔로우 연출 (84차. 사용자 공정 재정의 2026-08-06) ──
  //  유저가 드래그한 자리(= 칼길과 칼의 접점)를 **딜레이 후 사시미칼 스프라이트가 천천히
  //  따라오고**(칼끝은 살에 파묻혀 비표시), 칼이 지나간 구간부터 살이 두더지처럼 들린다.
  //  컷 성공 시 경로 끝까지 자동 진행(그동안 입력 차단 = actionAnim) 후 완료 처리 실행.
  //  구 "칼질 후 일괄 벌어짐 보간"(80차 flatOpenAnim)은 이 시스템이 대체·폐지.
  private knifeImg: Phaser.GameObjects.Image | null = null;
  private knifeFx: {
    stageId: string; half: 'up' | 'dn';
    path: CutPoint[];                        // 가이드 경로 (도마 정규화)
    pts: [number, number][];                 // 패널 px 변환 경로점
    cum: number[]; total: number;            // 호길이 테이블 (px)
    travel: number;                          // 칼 진행 호길이
    delayedMax: number;                      // 딜레이 반영된 드래그 목표 호길이
    samples: { s: number; t: number }[];     // 드래그 샘플 (딜레이 추종)
    finishing: boolean;                      // 성공 — 경로 끝까지 자동 진행 중
    fromDepth: number; toDepth: number;      // 벌어짐 깊이 (이 스테이지 전 → 후)
  } | null = null;
  private knifeEvent?: Phaser.Time.TimerEvent;

  private fishG!: Phaser.GameObjects.Graphics;
  private guideG!: Phaser.GameObjects.Graphics;
  private traceG!: Phaser.GameObjects.Graphics;
  private uiC!: Phaser.GameObjects.Container;

  // 트레이스/드래그 상태
  private tracing = false;
  private tracePoints: CutPoint[] = [];
  private lastFillPt: CutPoint | null = null;
  private peelStart: CutPoint | null = null;
  /** 스윕 커버리지 게이지 상태 (drag_fill·scoop) — 스테이지 단위 */
  private sweepCoverStage = '';
  private sweepCover: { pts: CutPoint[]; hit: boolean[] } | null = null;
  /** 비늘 튐 파티클 (드래그 중 커서 위치마다 생성 — destroy 시 일괄 정리) */
  private flakes = new Set<Phaser.GameObjects.Rectangle>();
  private lastFlakeMs = 0;
  /** 장뜨기 벌어짐 — 액션 연출 중 표시할 단계(연출이 끝나면 해제). mirrorX = 방금 자른 필렛(1/2면) */
  private filletOpen: { view: 'dorsal' | 'belly'; state: number; mirrorX: boolean } | null = null;
  /** 다음 액션 연출에서 적용할 벌어짐 단계 (칼이 지나간 뒤 벌어지도록 지연 적용) */
  private filletOpenPending: { view: 'dorsal' | 'belly'; state: number; mirrorX: boolean } | null = null;
  /**
   * 작업/섹션 완료 처리(전환·부산물 팝업·작업 선택)를 **연출 완료 후**로 미루는 큐.
   * 액션 연출/뒤집기 재생 중에 스프라이트가 다음 상태로 먼저 바뀌거나 팝업이 뜨지 않도록
   * (사용자 지시 2026-07-30 — "연출이 다 끝난 뒤에 이미지 전환"). onComplete에서 실행.
   */
  private pendingAfterAction: (() => void) | null = null;

  // 연출 상태 플래그 (렌더 전용)
  private scaledSides = 0;
  private headOff = false;
  private washCount = 0;

  // 뒤집기 연출 상태 — 화면에 그려진 방향(process.orientation과 다르면 flip 연출 후 동기화)
  private renderedOrientation: OrientationState = 'BASE';
  private flipping = false;
  private flipTweens: Phaser.Tweens.Tween[] = [];

  private butcheryMoveHandler: (p: Phaser.Input.Pointer) => void;
  private butcheryUpHandler: (p: Phaser.Input.Pointer) => void;
  private keyHandler: (ev: KeyboardEvent) => void;

  // 삼면뜨기 픽셀 가이드 (선행 9컷 + 본편 38컷 시트) — 돔류 + 프레임 등록 시에만 활성
  private guideSpeciesOk = false;
  private sheetViewer?: Phaser.GameObjects.Container;

  // ── 가이드/액션 애니메이션 (2026-07-29 — 2s 기본, TUNING.butchery.*AnimMs로 조율) ──
  private guideAnimG!: Phaser.GameObjects.Graphics;
  private actionAnimG!: Phaser.GameObjects.Graphics;
  private guideAnimTween?: Phaser.Tweens.Tween;
  private actionTween?: Phaser.Tweens.Tween;
  /** 액션 연출 재생 중 — 입력 차단 (flipping과 동일 계열 가드) */
  private actionAnim = false;
  /**
   * 가이드 끄기 — true면 외곽 화살표 큐(유도 연출)를 숨긴다.
   * **유도선(drawGuide)은 토글과 무관하게 항상 표시.** GameState.flags에 영속.
   */
  private guideOff = false;

  // ── 자유 손질 섹션 컨트롤러 (2026-07-30 개편 — 달성도 기반 작업 선택) ──
  //  체형별 트리 — round = 삼면뜨기(WHOLE_FISH_SECTIONS) / flat = 다섯장뜨기 (constructor에서 선택)
  private sections: ButcherySectionDef[] = WHOLE_FISH_SECTIONS;
  private sectionIdx = 0;
  private doneStages = new Set<string>();
  /** taskId → 스트로크 정확도 누적 */
  private taskAcc = new Map<string, number[]>();
  /** taskId → 완료 정확도 % (도장) */
  private doneTasks = new Map<string, number>();
  private activeTaskId: string | null = null;
  /** anyOrder 섹션에서 작업 선택 대기 중 — 손질 입력 차단 */
  private awaitingSelect = false;
  /**
   * 이번 세션에서 **즉시 지급**한 부산물 로그 — [id, qty].
   * (구 "레저 적립 후 정산 시 일괄 지급" 구조 폐지 — 사용자 지시 2026-08-03 "과정마다 지급".
   *  체크포인트 전 이탈 시 원물 복구 규칙은 이 로그로 **지급분을 회수**해 유지한다.
   *  손질 중엔 인벤토리를 열 수 없어(모달) 회수 시점에 아이템이 이미 소비됐을 수 없다.)
   */
  private grantedLog: { id: string; qty: number }[] = [];
  /** 손질 종료 가능 체크포인트 (none = 이탈 시 원물 복구) */
  private checkpoint: 'none' | 'fillets' | 'ribs' = 'none';
  private byproductPopup?: Phaser.GameObjects.Container;
  /** 부산물 팝업 확인 후 이어질 진행 (작업 완료 → 남은 작업 선택 / 섹션 완료 → 다음 섹션) */
  private byproductDone?: () => void;

  // ── 가이드선 편집 (dev 전용, F9) — 핸들 드래그 + **곡선 그리기** + 좌표 복사 ──
  private editMode = false;
  private editDragIdx = -1;
  private editHandles: { pt: CutPoint; sx: number; sy: number }[] = [];
  private editHandleG?: Phaser.GameObjects.Graphics;
  private editReadout?: Phaser.GameObjects.Text;
  /** 곡선 그리기 모드 — 도마 위 드래그로 자유곡선을 그려 경로 전체를 교체 */
  private editDraw = false;
  /** 곡선 그리기 중 캡처된 원시 궤적 (정규화) */
  private editDrawPts: CutPoint[] = [];
  private editDrawG?: Phaser.GameObjects.Graphics;
  /** 곡선 리샘플 점 수 (그리기 커밋 시 이 개수로 균등 리샘플) */
  private editCurveN = 7;
  /** 편집 중인 유도선 인덱스 (다중 유도선 — 지느러미 등/뒷/가슴) */
  private editLineIdx = 0;
  /** 합성 스윕선(비늘/내장/박피)의 편집 오버라이드 — stage.id별 편집 가능 배열 */
  private sweepOverride = new Map<string, CutPoint[]>();

  /** dev 개별 작업 목록 확장 (좌측 하단) */
  private devExpand = false;
  /** 중간 산출물 재장착으로 시작했는가 (박피부터 등) — 정산 로직 분기 */
  private resumed = false;

  /** 인벤토리 칸 부족으로 지급하지 못한 부산물 이름 (결과 화면 경고) */
  private grantFailed: string[] = [];

  // ── 박피 톱질 연출 — 드래그하는 동안 칼이 제자리에서 위아래로 왕복 ──
  private peelSawPhase = 0;
  private peelSawEvent?: Phaser.Time.TimerEvent;

  // ── 좌표 로그 스크롤 (마더 HUD 안 — 넘치면 스크롤바) ──
  private editLogRect?: { x: number; y: number; w: number; h: number };
  private editLogBarG?: Phaser.GameObjects.Graphics;
  private editLogScroll = 0;
  private editLogMax = 0;

  constructor(scene: Phaser.Scene, source: InvItem, cbs: ButcheryCallbacks) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2,
      y: (GAME_HEIGHT - PANEL_H) / 2,
      width: PANEL_W, height: PANEL_H,
      title: '손질하기',   // create 이후 refreshTitle()이 '손질하기 — {작업} ({어종}, 무게, 길이)'로 갱신
      onClose: cbs.onClose, dim: true, depth: 900,
    });
    this.source = source;
    this.cbs = cbs;

    const speciesId = source.speciesId ?? this.guessSpecies(source);
    this.process = new ButcheryProcess(getButcheryProfile(speciesId), this.freshnessFactor(source));
    // 체형별 섹션 트리 — 넙치류(flat)는 다섯장뜨기 (2026-08-05)
    this.sections = sectionsForBodyShape(this.process.profile.bodyShape);
    // 회칼 = **손 장착** 기준 (2026-07-30 자유 손질 개편) — 손에 든 칼만 수율/등급에 반영.
    // 시작 게이트(장착 필수)는 UtilizationPanel [손질 시작]이 담당.
    this.knife = getBestKnife(
      InventoryStore.items.filter((i) => i.tool === 'knife' && i.equipped).map((i) => i.id));

    // 닫기(X/ESC) 가로채기 — 체크포인트 전 = 원물 복구(레저 폐기), 후 = 체크포인트 정산
    const origClose = cbs.onClose;
    this.requestClose = (): void => {
      // 체크포인트 이후 이탈 = 그 시점으로 정산. **부산물 팝업이 떠 있으면 [보관] 선택분을 먼저 적립**
      // 하고 정산한다 (팝업에서 ESC를 눌러도 그 단계 부산물을 잃지 않도록).
      if (!this.done && this.byproductPopup && this.checkpoint !== 'none') {
        this.confirmByproductPopup(true);
        return;
      }
      if (!this.done && this.checkpoint !== 'none') {
        this.settleAtCheckpoint();   // 필렛 저장 시점 이후 이탈 = 그 시점으로 정산
        return;                      // settle이 결과 오버레이 → [확인]에서 닫힘
      }
      origClose();                   // 체크포인트 전 = 아무것도 지급 안 함 (원물 보존)
    };

    // 가이드 켜짐/꺼짐 — 영속 플래그 (유도선은 이 값과 무관하게 항상 표시)
    this.guideOff = GameState.getFlag('butcheryGuideOff');
    // 픽셀 가이드 활성 — 돔류(SASHIMI_GUIDE_GROUP 등재) + 시트 프레임 등록 완료 시
    this.guideSpeciesOk = !!SASHIMI_GUIDE_GROUP[speciesId] && hasGuideFrames(scene);
    if (import.meta.env.DEV) this.devAssertGuideBinding();

    this.fishG = scene.add.graphics();
    this.guideG = scene.add.graphics();
    this.guideAnimG = scene.add.graphics();    // 가이드 경로 루프 연출 (칼 프리뷰)
    this.traceG = scene.add.graphics();
    this.actionAnimG = scene.add.graphics();   // 조작 성공 액션 연출 (칼질/탭/문지르기/박피)
    this.uiC = scene.add.container(0, 0);
    this.add([this.fishG, this.guideG, this.guideAnimG, this.traceG, this.actionAnimG, this.uiC]);

    // 씬 레벨 포인터 (트레이스가 히트 영역 밖으로 나가도 추적)
    this.butcheryMoveHandler = (p) => this.onPointerMove(p);
    this.butcheryUpHandler = (p) => this.onPointerUp(p);
    scene.input.on('pointermove', this.butcheryMoveHandler);
    scene.input.on('pointerup', this.butcheryUpHandler);
    scene.input.on('pointerdown', this.onPointerDownBound, this);
    if (import.meta.env.DEV) scene.input.on('wheel', this.onEditLogWheel);   // 좌표 로그 스크롤

    // 키보드 — F/Space 요구 방향 뒤집기 · 1~5 방향 직접 · Enter 세척 확정
    this.keyHandler = (ev) => this.onKey(ev);
    scene.input.keyboard?.on('keydown', this.keyHandler);

    // 자유 손질 섹션 컨트롤러 초기화 (그래픽 레이어 생성 이후 — selectTask가 refresh 호출)
    this.renderedOrientation = asFishOri(this.process.orientation);
    if (cbs.resumeSectionId) this.resumeAtSection(cbs.resumeSectionId);
    else this.enterSection(0);
    this.refresh();
    this.applyFix();
  }

  private onPointerDownBound(p: Phaser.Input.Pointer): void {
    this.onPointerDown(p);
  }

  /**
   * ESC 위임 진입점 — 씬의 popupStack ESC가 U패널을 닫기 전에 이 패널을 먼저 닫도록
   * (UtilizationPanel.onEscIntercept → 여기). requestClose는 protected라 공개 래퍼.
   */
  escClose(): void {
    this.requestClose();
  }

  override destroy(fromScene?: boolean): void {
    // ── 이탈 정산 안전망 (사용자 리포트 2026-07-31 "ESC로 나가면 부산물이 사라짐") ──
    //  씬 ESC → UtilizationPanel.destroy → 이 destroy가 **requestClose를 거치지 않고 직행**하는
    //  경로가 있다(교체 확인·씬 셧다운도 동일). 부산물은 팝업 확인 시점에 이미 지급돼 있으므로:
    //  체크포인트 이후 = 열린 팝업 선택분 지급 → 원물 소모 → XP /
    //  체크포인트 전 = 원물 보존 규칙 — **이번 세션 지급분을 회수**(revokeGranted).
    if (!this.done && this.checkpoint !== 'none') {
      this.done = true;
      this.absorbByproductPopup();
      InventoryStore.removeItem(this.source.id, false);
      GameState.addFilletingXp(Math.round(14 + (this.checkpoint === 'ribs' ? 10 : 0)));
    } else if (!this.done) {
      this.revokeGranted();
    }
    this.closeSheetViewer();
    this.closeByproductPopup();
    this.editDrawG?.destroy();
    this.editDrawG = undefined;
    this.stopGuideAnim();
    this.stopActionAnim();
    this.stopKnifeFx();
    this.clearFlakes();
    this.scene?.input?.off('pointermove', this.butcheryMoveHandler);
    this.scene?.input?.off('pointerup', this.butcheryUpHandler);
    this.scene?.input?.off('pointerdown', this.onPointerDownBound, this);
    this.peelSawEvent?.remove();
    this.peelSawEvent = undefined;
    this.scene?.input?.off('wheel', this.onEditLogWheel);
    this.scene?.input?.keyboard?.off('keydown', this.keyHandler);
    this.flipTweens.forEach((t) => t.remove());
    this.flipTweens = [];
    super.destroy(fromScene);
  }

  // ═══════════════════════════════════════════════════
  // 키보드 — F/Space 뒤집기 · 1~5 방향 · Enter 세척
  // ═══════════════════════════════════════════════════
  private onKey(ev: KeyboardEvent): void {
    // 시트 뷰어 열림 중 — ESC = 뷰어만 닫기 (손질 입력 차단)
    if (this.sheetViewer) {
      if (ev.key === 'Escape') this.closeSheetViewer();
      return;
    }
    // G = 가이드 켜기/끄기 (유도선은 항상 유지) — 손질 진행 중에만
    if (ev.code === 'KeyG') {
      if (!this.done && !this.process.finished && !this.flipping && !this.actionAnim) this.toggleGuide();
      return;
    }
    // F9 = dev 가이드선 편집 토글 (끝점 드래그 + 좌표 복사)
    if (import.meta.env.DEV && ev.code === 'F9') { this.toggleEditMode(); return; }
    if (this.byproductPopup) {
      if (ev.code === 'Enter' || ev.code === 'NumpadEnter') this.confirmByproductPopup(false);
      return;
    }
    if (this.done || this.flipping || this.actionAnim || this.awaitingSelect || this.process.finished) return;
    const stage = this.process.stage;
    if (!stage) return;
    // 수동 뒤집기 (자동 뒤집기 폐지 — 2026-07-30): F/Space = 좌우 · V = 상하
    if (ev.code === 'KeyF' || ev.code === 'Space') {
      this.doFlipLR();
    } else if (ev.code === 'KeyV') {
      this.doFlipUD();
    } else if (ev.code === 'KeyR') {
      // R = 시계방향 90° / Shift+R = 반시계방향 (넙치류 세로 배치 — 자세한 뷰.pdf)
      this.doRotate(ev.shiftKey ? -1 : 1);
    } else if (ev.code === 'Enter' || ev.code === 'NumpadEnter') {
      if (stage.primitive === 'wash' && this.process.submitWash()) {
        this.washCount++;
        this.flash(stage.id === 'bleed_ice' ? '방혈 완료 — 선도 보너스!' : '깨끗이 씻었습니다', true);
        const willFlip = this.process.orientation !== this.renderedOrientation;
        if (!willFlip && !this.process.finished) this.playActionAnim(stage);   // 전환은 연출 완료 후
        else this.refresh();
        this.onStageComplete(stage.id, 1);
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 수동 뒤집기 — 상하/좌우 (자동 뒤집기 폐지. FLESH_UP(필렛 뷰)에서는 비활성)
  // ═══════════════════════════════════════════════════
  private doFlipLR(): void {
    if (this.process.orientation === 'FLESH_UP') return;
    const map: Record<OrientationState, OrientationState> = {
      BASE: 'FLIP', FLIP: 'BASE', BELLY_UP: 'BACK_DOWN', BACK_DOWN: 'BELLY_UP', FLESH_UP: 'FLESH_UP',
    };
    this.process.orientation = map[asFishOri(this.process.orientation)];
    this.refresh();
  }

  // ═══════════════════════════════════════════════════
  // 넙치류 포 뜨기 — 칼 팔로우 연출 (84차)
  //  드래그 접점 = 파묻힌 칼끝과 보이는 칼날의 경계(사용자 캡처의 노란 점선).
  //  칼 몸체·손잡이 경로(빨간·검정 점선)는 접점 + 진행각 + 바깥 기울기에서 자동 파생.
  // ═══════════════════════════════════════════════════
  private static readonly FLAT_KNIFE_RE = /^flat_(belly|back)_(up|dn)_(score|sep1|sep2)$/;
  /** 칼끝이 살에 파묻히는 비율 (텍스처 오른쪽 끝부터) — 그 경계가 드래그 접점이 된다 */
  private static readonly KNIFE_BURY_FRAC = 0.30;
  /** 포 뜨기 단계별 벌어짐 깊이 — 힌지가 지느러미 경계→중앙선으로 이동한 비율 */
  private static readonly FLAT_DEPTH = { score: 0.18, sep1: 0.55, sep2: 1 } as const;

  private flatKnifeInfo(id: string | undefined):
  { side: 'belly' | 'back'; half: 'up' | 'dn'; step: 'score' | 'sep1' | 'sep2' } | null {
    const m = id ? ButcheryPanel.FLAT_KNIFE_RE.exec(id) : null;
    return m
      ? { side: m[1] as 'belly' | 'back', half: m[2] as 'up' | 'dn', step: m[3] as 'score' | 'sep1' | 'sep2' }
      : null;
  }

  /** 해당 반쪽의 확정(완료 스테이지 기준) 벌어짐 깊이 */
  private flatHalfDepth(side: 'belly' | 'back', half: 'up' | 'dn'): number {
    const p = `flat_${side}_${half}`;
    if (this.doneStages.has(`${p}_sep2`)) return 1;
    if (this.doneStages.has(`${p}_sep1`)) return ButcheryPanel.FLAT_DEPTH.sep1;
    if (this.doneStages.has(`${p}_score`)) return ButcheryPanel.FLAT_DEPTH.score;
    return 0;
  }

  /** 드래그 시작 — 칼 팔로우 세션 준비 (칼은 첫 이동부터 표시) */
  private startKnifeFollow(stage: ButcheryStage): void {
    const info = this.flatKnifeInfo(stage.id);
    const path = stage.cut?.guidePath;
    if (!info || !path?.length || !this.scene) return;
    this.stopKnifeFx();
    const pts = path.map((p) => this.toPanelPx(p));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    this.knifeFx = {
      stageId: stage.id, half: info.half, path, pts, cum, total: cum[cum.length - 1],
      travel: 0, delayedMax: 0, samples: [], finishing: false,
      fromDepth: this.flatHalfDepth(info.side, info.half),
      toDepth: ButcheryPanel.FLAT_DEPTH[info.step],
    };
    if (!this.knifeImg) {
      const img = this.scene.add.image(0, 0, 'butchery_knife');
      const tex = img.width;   // 텍스처 원폭 (74)
      const visW = Math.round(tex * (1 - ButcheryPanel.KNIFE_BURY_FRAC));
      img.setCrop(0, 0, visW, img.height);            // 칼끝(오른쪽) 파묻힘 — 비표시
      img.setOrigin(visW / tex, 0.5);                 // 원점 = 파묻힘 경계 = 드래그 접점
      this.addAt(img, this.getIndex(this.uiC));       // 생선 위 · UI 아래
      this.knifeImg = img;
      this.applyFix();
    }
    this.knifeImg.setVisible(false).setAlpha(1);
    this.knifeEvent = this.scene.time.addEvent({ delay: 33, loop: true, callback: () => this.tickKnife() });
  }

  /** 드래그 좌표(생선 로컬)를 경로 호길이로 투영해 딜레이 샘플로 적립 (단조 증가) */
  private feedKnife(n: CutPoint): void {
    const kf = this.knifeFx;
    if (!kf || kf.finishing) return;
    const [nx, ny] = this.toPanelPx(n);
    let best = 0, bestD = Infinity;
    for (let i = 1; i < kf.pts.length; i++) {
      const [ax, ay] = kf.pts[i - 1], [bx, by] = kf.pts[i];
      const vx = bx - ax, vy = by - ay;
      const len2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((nx - ax) * vx + (ny - ay) * vy) / len2));
      const d = Math.hypot(nx - (ax + vx * t), ny - (ay + vy * t));
      if (d < bestD) { bestD = d; best = kf.cum[i - 1] + Math.sqrt(len2) * t; }
    }
    const lastS = kf.samples.length ? kf.samples[kf.samples.length - 1].s : 0;
    kf.samples.push({ s: Math.max(lastS, best), t: this.scene.time.now });
  }

  /** 33ms 틱 — 딜레이 지난 샘플을 목표로 승격 → 제한 속도로 추종 · 벌어짐 재드로우 */
  private tickKnife(): void {
    const kf = this.knifeFx;
    if (!kf) return;
    const now = this.scene.time.now;
    while (kf.samples.length && kf.samples[0].t <= now - TUNING.butchery.knifeFollowDelayMs) {
      kf.delayedMax = Math.max(kf.delayedMax, kf.samples.shift()!.s);
    }
    const target = kf.finishing ? kf.total : kf.delayedMax;
    if (kf.travel < target) {
      kf.travel = Math.min(target, kf.travel + (TUNING.butchery.knifeFollowSpeedPx / 1000) * 33);
      this.updateKnifeVisual();
      this.drawFish();               // 칼이 지나간 구간의 벌어짐 갱신 (도마 그래픽만)
    }
    if (kf.finishing && kf.travel >= kf.total - 0.5) this.completeKnife();
  }

  /** 호길이 s 지점의 패널 px 좌표 + 진행각 */
  private knifeArcPoint(s: number): { x: number; y: number; ang: number } {
    const kf = this.knifeFx!;
    const sc = Math.max(0, Math.min(kf.total, s));
    let i = 1;
    while (i < kf.cum.length - 1 && kf.cum[i] < sc) i++;
    const segLen = kf.cum[i] - kf.cum[i - 1] || 1;
    const t = (sc - kf.cum[i - 1]) / segLen;
    const [ax, ay] = kf.pts[i - 1], [bx, by] = kf.pts[i];
    return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, ang: Math.atan2(by - ay, bx - ax) };
  }

  /** 칼 진행 위치의 가이드 좌표계 x (길이축) — 렌더 라이브 엔벌로프용 */
  private knifeLocalX(): number {
    const kf = this.knifeFx!;
    const sc = Math.max(0, Math.min(kf.total, kf.travel));
    let i = 1;
    while (i < kf.cum.length - 1 && kf.cum[i] < sc) i++;
    const segLen = kf.cum[i] - kf.cum[i - 1] || 1;
    const t = (sc - kf.cum[i - 1]) / segLen;
    return kf.path[i - 1].x + (kf.path[i].x - kf.path[i - 1].x) * t;
  }

  /** 칼 스프라이트 배치 — 접점 고정·진행각 + 바깥 기울기·칼날은 살 쪽 */
  private updateKnifeVisual(): void {
    const kf = this.knifeFx;
    const img = this.knifeImg;
    if (!kf || !img) return;
    const p = this.knifeArcPoint(kf.travel);
    // 바깥(지느러미) 방향 = 생선 중심에서 먼 쪽 — 손잡이가 그쪽으로 눕는다
    const outX = p.x - (this.fishX + this.fishW / 2);
    const outY = p.y - (this.fishY + this.fishH / 2);
    const tilt = (TUNING.butchery.knifeTiltDeg * Math.PI) / 180;
    // 후보 두 기울기 중 손잡이(칼끝 반대)가 바깥으로 가는 쪽을 고른다 — 면/방향 무관 일반식
    const handleOut = (side: 1 | -1): number => {
      const a = p.ang + tilt * side;
      return -Math.cos(a) * outX - Math.sin(a) * outY;
    };
    const side: 1 | -1 = handleOut(1) >= handleOut(-1) ? 1 : -1;
    const ang = p.ang + tilt * side;
    img.setPosition(p.x, p.y).setRotation(ang);
    img.setScale(TUNING.butchery.knifeLenPx / img.width);
    // 칼날(텍스처 아래 변)이 생선 안쪽을 향하게 — 에지 법선·안쪽 내적으로 플립
    const en = [-Math.sin(ang), Math.cos(ang)];
    img.setFlipY(en[0] * -outX + en[1] * -outY < 0);
    if (!img.visible && kf.travel > 0.5) img.setVisible(true);
  }

  /** 컷 실패 — 칼 페이드아웃 + 라이브 벌어짐 해제 */
  private failKnife(): void {
    if (!this.knifeFx) return;
    this.knifeFx = null;
    this.knifeEvent?.remove(); this.knifeEvent = undefined;
    const img = this.knifeImg;
    if (img?.visible) {
      this.scene.tweens.add({
        targets: img, alpha: 0, duration: 200,
        onComplete: () => img.setVisible(false).setAlpha(1),
      });
    }
    this.drawFish();
  }

  /** 컷 성공 — 칼이 경로 끝까지 마저 진행 (연출 동안 입력 차단 · 완료 처리는 그 후) */
  private finishKnife(): void {
    const kf = this.knifeFx;
    if (!kf) return;
    kf.finishing = true;
    kf.samples.length = 0;
    this.actionAnim = true;          // playActionAnim과 동일 계열 입력 가드
    this.stopGuideAnim();
    if (kf.travel > 0.5) this.knifeImg?.setVisible(true);
  }

  private completeKnife(): void {
    this.knifeFx = null;
    this.knifeEvent?.remove(); this.knifeEvent = undefined;
    const img = this.knifeImg;
    if (img?.visible) {
      this.scene.tweens.add({
        targets: img, alpha: 0, duration: 160,
        onComplete: () => img.setVisible(false).setAlpha(1),
      });
    }
    this.actionAnim = false;
    this.doRefresh();                // 벌어짐 확정 상태로 전환 + 가이드 루프 재시작
    this.runPendingAfterAction();    // 미뤄둔 작업/섹션 완료 처리 (팝업·전환)
  }

  private stopKnifeFx(): void {
    this.knifeFx = null;
    this.knifeEvent?.remove(); this.knifeEvent = undefined;
    this.knifeImg?.setVisible(false).setAlpha(1);
  }

  /**
   * 도마 90° 회전 (dir 1 = 시계 / -1 = 반시계) — 뒤집기와 **독립 축**.
   * 넙치류 지느러미쪽 칼길·포 뜨기는 꼬리를 아래로 세워 꼬리→머리 방향으로 긋는다(자세한 뷰.pdf).
   */
  private doRotate(dir: 1 | -1): void {
    this.process.rotate(dir);
    this.flash(`도마 배치: ${ROTATION_LABEL[this.process.rotation]}`, true);
    this.refresh();
  }

  private doFlipUD(): void {
    if (this.process.orientation === 'FLESH_UP') return;
    const map: Record<OrientationState, OrientationState> = {
      BASE: 'BELLY_UP', BELLY_UP: 'BASE', FLIP: 'BACK_DOWN', BACK_DOWN: 'FLIP', FLESH_UP: 'FLESH_UP',
    };
    this.process.orientation = map[asFishOri(this.process.orientation)];
    this.refresh();
  }

  // ═══════════════════════════════════════════════════
  // 자유 손질 섹션 컨트롤러 — 섹션 순서 강제 + 섹션 내 작업 자유 선택 (달성도)
  // ═══════════════════════════════════════════════════
  private get section(): ButcherySectionDef { return this.sections[this.sectionIdx]; }

  /**
   * 현재 작업 단계 이름 — 구현 계획서의 3단계 (사용자 지시 2026-07-30).
   *  원물 손질(시메~2면 뜨기) / 필렛 손질(갈빗대~박피) / 회뜨기(썰기 — 추후)
   */
  private phaseLabel(): string {
    const id = this.section.id;
    if (id === 'sec_rib' || id === 'sec_pin' || id === 'sec_peel' || id === 'sec_engawa') return '필렛 손질';
    return '원물 손질';
  }

  /** 헤더 타이틀 갱신 — '손질하기 — {작업} ({어종}, {무게}, {길이})' */
  private refreshTitle(): void {
    const nameKo = this.speciesName();
    const w = this.source.weightG;
    const l = this.source.lengthCm;
    const spec = [
      nameKo,
      w !== undefined ? (w >= 1000 ? `${(w / 1000).toFixed(1)}kg` : `${w}g`) : null,
      l !== undefined ? `${l}cm` : null,
    ].filter(Boolean).join(', ');
    this.setTitle(`손질하기 — ${this.phaseLabel()} (${spec})`);
  }

  private taskDone(taskId: string): boolean { return this.doneTasks.has(taskId); }

  /**
   * 방향 라벨 — 넙치류는 뒤집어도 머리가 왼쪽 그대로라 원형어 라벨('머리 오른쪽')이 맞지 않는다.
   * flat: BASE = 등면(어두운 면) / FLIP = 배면(흰 면).
   */
  private orientLabel(o: ButcheryOrientation): string {
    if (this.process.profile.bodyShape === 'flat') {
      if (o === 'BASE') return '등면 (어두운 면 위)';
      if (o === 'FLIP') return '배면 (흰 면 위)';
    }
    return orientationLabel(o);
  }

  /** 섹션 진입 — 선형 섹션은 첫 미완료 작업 자동 선택, 자유 섹션은 선택 대기 */
  private enterSection(i: number): void {
    this.sectionIdx = Math.min(i, this.sections.length - 1);
    const sec = this.section;
    const next = sec.tasks.find((t) => !this.taskDone(t.id));
    if (!next) { this.advanceSection(); return; }
    if (sec.anyOrder) {
      this.activeTaskId = null;
      this.awaitingSelect = true;
    } else {
      this.selectTask(next.id);
    }
  }

  /**
   * 재장착 시작 — 지정 섹션 앞의 모든 섹션/작업을 완료 처리하고 그 섹션부터 진행.
   * (껍질 붙은 필렛을 도마에 올린 경우 = 박피부터)
   */
  private resumeAtSection(sectionId: string): void {
    const si = this.sections.findIndex((s) => s.id === sectionId);
    if (si <= 0) { this.enterSection(0); return; }
    this.sections.forEach((sec, i) => {
      if (i >= si) return;
      sec.tasks.forEach((t) => {
        t.stageIds.forEach((id) => this.doneStages.add(id));
        this.doneTasks.set(t.id, 100);
      });
    });
    this.resumed = true;
    // 재장착은 **필렛 1장** 세션 — 반대쪽(B면) 작업은 이 세션 대상이 아니다(별도 세션에서 처리).
    if (sectionId === 'sec_rib' || sectionId === 'sec_pin') {
      const all = this.sections.flatMap((s) => s.tasks);
      for (const id of ['t_rib_b', 't_pin_b']) {
        const t = all.find((x) => x.id === id);
        if (!t) continue;
        t.stageIds.forEach((sid) => this.doneStages.add(sid));
        this.doneTasks.set(id, 100);
      }
    }
    // 넙치류 — 엔가와 재장착도 필렛 1장 세션: 나머지 3장 작업은 완료 처리 (엔가와 1개만 분리)
    if (sectionId === 'sec_engawa') {
      const all = this.sections.flatMap((s) => s.tasks);
      for (const id of ['t_engawa_2', 't_engawa_3', 't_engawa_4']) {
        const t = all.find((x) => x.id === id);
        if (!t) continue;
        t.stageIds.forEach((sid) => this.doneStages.add(sid));
        this.doneTasks.set(id, 100);
      }
    }
    this.syncDerivedFromDone();
    this.enterSection(si);
  }

  /** 작업 선택 (작업 목록 클릭 / 선형 자동) — 해당 작업의 첫 미완료 스테이지로 점프 */
  private selectTask(taskId: string): void {
    const task = this.section.tasks.find((t) => t.id === taskId);
    if (!task || this.taskDone(taskId)) return;
    const stageId = task.stageIds.find((id) => !this.doneStages.has(id)) ?? task.stageIds[0];
    this.activeTaskId = taskId;
    this.awaitingSelect = false;
    this.process.jumpTo(stageId);
    this.refresh();
  }

  /**
   * 스테이지 완료 훅 — 모든 submit 성공 지점이 호출 (구 `finished → showResult` 대체).
   * 작업/섹션 달성도를 갱신하고, 섹션 완료 시 부산물 팝업 → 다음 섹션.
   */
  private onStageComplete(stageId: string, quality: number): void {
    this.doneStages.add(stageId);
    let task = this.section.tasks.find((t) => t.id === this.activeTaskId)
      ?? this.section.tasks.find((t) => t.stageIds.includes(stageId));
    // **자가 복구** — 완료된 스테이지가 현재 섹션에 없다면 섹션 인덱스가 어긋난 것이다.
    //  구 구현은 여기서 조용히 return해, 한 번 어긋나면 이후 **모든 부산물 팝업/정산이 통째로
    //  사라졌다**(사용자 리포트 2026-07-31 — "부산물이 어디 갔는지 없고 순수 필렛만 나옴").
    if (!task) {
      const si = this.sections.findIndex((s) => s.tasks.some((t) => t.stageIds.includes(stageId)));
      if (si < 0) return;
      this.sectionIdx = si;
      task = this.sections[si].tasks.find((t) => t.stageIds.includes(stageId));
      if (!task) return;
      this.activeTaskId = task.id;
    }
    const acc = this.taskAcc.get(task.id) ?? [];
    acc.push(Math.max(0, Math.min(1, quality)));
    this.taskAcc.set(task.id, acc);

    // 작업의 모든 스테이지가 끝나야 작업 완료 (예: 머리 제거 = 앞면 + 뒷면 2스테이지)
    if (!task.stageIds.every((id) => this.doneStages.has(id))) {
      // 같은 작업의 다음 스테이지로 계속 — 방향이 바뀌는 스테이지면 뒤집기 안내가 뜬다.
      // 액션 연출 재생 중이면 전환은 연출 완료(onComplete doRefresh)까지 미룬다 (플래시 방지).
      if (!this.actionAnim) this.refresh();
      return;
    }

    // 작업 완료 — 도장 (정확도 %)
    const avg = acc.length ? acc.reduce((a, b) => a + b, 0) / acc.length : 1;
    this.doneTasks.set(task.id, Math.round(avg * 100));
    this.activeTaskId = null;
    const sec = this.section;
    const secDone = sec.tasks.every((t) => this.taskDone(t.id));
    // 렌더-영향 상태(작업 선택 대기)를 미리 확정 — 연출 완료 후 doRefresh가 올바른 상태를 그린다.
    if (!secDone && sec.anyOrder) this.awaitingSelect = true;

    // 작업/섹션 완료 후 진행 — 부산물 팝업이 있으면 그 확인 뒤에 실행된다
    const after = (): void => {
      if (secDone) {
        // **체크포인트를 팝업보다 먼저 확정** — 팝업 도중/직후 ESC로 나가도 그 시점 부산물을
        //  받을 수 있어야 한다 (구 구현은 advanceSection에서야 설정돼, 팝업에서 ESC = 전부 폐기.
        //  사용자 리포트 2026-07-31 "여기까지 하고 나가면 아이템이 하나도 안 보임").
        if (sec.exitAfter) {
          if (sec.id === 'sec_fillet_b') this.checkpoint = 'fillets';
          else if (sec.id === 'sec_rib' || sec.id === 'sec_engawa') this.checkpoint = 'ribs';
          else if (this.checkpoint === 'none') this.checkpoint = 'fillets';
        }
        if (sec.yields?.length) {
          this.showByproductPopup(sec.yields, sec.label, !!sec.exitAfter, () => this.advanceSection());
        } else {
          this.advanceSection();
        }
        return;
      }
      if (sec.anyOrder) {
        this.awaitingSelect = true;      // 남은 작업을 플레이어가 다시 고른다 (자유 순서)
        this.refresh();
      } else {
        const next = sec.tasks.find((t) => !this.taskDone(t.id));
        if (next) this.selectTask(next.id);
      }
    };
    const runCompletion = (): void => {
      // **작업 단위 부산물**(머리·내장처럼 그 작업만으로 분리) — 팝업 후 진행
      if (task.yields?.length) this.showByproductPopup(task.yields, task.label, false, after, task.id);
      else after();
    };
    // **연출/뒤집기 재생 중이면 완료 처리(전환·팝업·작업 선택)를 연출 완료 후로 미룬다** —
    //  칼질 연출이 다 끝나기 전에 픽셀 이미지·작업 목록·부산물 팝업이 먼저 뜨지 않도록
    //  (사용자 지시 2026-07-30). 연출 없으면 즉시.
    // ⚠ 큐가 이미 차 있으면 **덮어쓰지 말고 이어붙인다** — 덮어쓰면 앞 완료 처리(팝업·섹션 전환)가
    //   통째로 유실된다.
    if (this.actionAnim || this.flipping) {
      const prev = this.pendingAfterAction;
      this.pendingAfterAction = prev ? (): void => { prev(); runCompletion(); } : runCompletion;
    } else runCompletion();
  }

  /** 다음 섹션으로 (마지막 섹션이면 최종 완료) */
  private advanceSection(): void {
    // 체크포인트 갱신 — 2면 뜨기 완료 = 'fillets' / 갈빗대 완료 = 'ribs'
    if (this.section.id === 'sec_fillet_b') this.checkpoint = 'fillets';
    if (this.section.id === 'sec_rib') { this.checkpoint = 'ribs'; this.morphPendingFilletsToSkinOnly(); }
    // 넙치류 — 배/등쪽 뜨기 = 'fillets' / 엔가와 완료 = 'ribs' (대체 지급은 yields 경로가 처리)
    if (this.section.id === 'sec_flat_belly' || this.section.id === 'sec_flat_back') this.checkpoint = 'fillets';
    if (this.section.id === 'sec_engawa') this.checkpoint = 'ribs';
    if (this.sectionIdx >= this.sections.length - 1) {
      this.process.forceFinish();
      this.showResult();
      return;
    }
    this.enterSection(this.sectionIdx + 1);
    this.refresh();
  }

  // ═══════════════════════════════════════════════════
  // 부산물 팝업 (보관/버리기) + 보관 레저 + 정산
  //  — 지급은 레저에 쌓았다가 **정산 시점**(체크포인트 종료/최종 완료)에만 실지급.
  //  체크포인트 전 이탈 = 레저 폐기 + 원물 보존 (중간 상태 에셋 없음 — 사용자 규칙).
  // ═══════════════════════════════════════════════════
  private speciesName(): string {
    const def = FISH_DATABASE.find((f) => f.id === this.process.profile.speciesId);
    return def?.nameKo ?? this.source.name.replace(/\s*\(.*$/, '');
  }

  /** 부산물 무게 근사 (core computeFilletYield와 동일 비율) */
  private bypWeights(): { headG: number; spineG: number; ribG: number; pinG: number; visceraG: number; filletG: number; engawaG: number } {
    const w = this.source.weightG ?? 800;
    // 필렛 분할 수 — round 2장 / flat(다섯장뜨기) 4장
    const nFillet = this.process.profile.bodyShape === 'flat' ? 4 : 2;
    return {
      headG: Math.round(w * 0.12), spineG: Math.round(w * 0.06), ribG: Math.round(w * 0.04),
      pinG: Math.round(w * 0.02), visceraG: Math.round(w * 0.08),
      filletG: Math.round((w * this.process.profile.baseYieldRate) / nFillet + w * 0.02),
      engawaG: Math.max(1, Math.round(w * 0.02)),   // 엔가와 (필렛 1장당 — 넙치류)
    };
  }

  /** yields 종류 목록 → 팝업/레저 행 목록 */
  private buildYieldRows(yields: ButcherySectionYield[], taskId?: string): { key: string; tpl: Omit<InvItem, 'slot' | 'qty'>; qty: number }[] {
    const speciesId = this.process.profile.speciesId;
    const nameKo = this.speciesName();
    const fam = this.trimFamily(speciesId);
    const wts = this.bypWeights();
    const now = Date.now();
    const seq = InventoryStore.nextCatchSeq();
    const base = { category: 'food' as const, subCategory: '부산물', condition: 'live' as const, conditionSinceMs: now, equippable: false };
    const rows: { key: string; tpl: Omit<InvItem, 'slot' | 'qty'>; qty: number }[] = [];
    for (const y of yields) {
      switch (y) {
        case 'head':
          rows.push({ key: 'head', qty: 1, tpl: { ...base, id: `inv_byp_head_${speciesId}_${seq}`, name: `${nameKo} 머리 ${wts.headG}g`, icon: '🐟', iconTexture: this.trimHeadKey(speciesId), byproductKind: 'head', basePrice: Math.max(200, wts.headG * 3), speciesId, weightG: wts.headG } });
          break;
        case 'viscera':
          rows.push({ key: 'viscera', qty: 1, tpl: { ...base, id: 'inv_byp_guts', name: '생선 내장', icon: '🫀', iconTexture: 'trim_guts', byproductKind: 'viscera', basePrice: 300, condProfile: 'viscera' } });
          break;
        case 'filletA':
        case 'filletB':
          rows.push({ key: y, qty: 1, tpl: { ...base, subCategory: '손질 필렛', id: `inv_filletribs_${speciesId}_${seq}_${y === 'filletA' ? 'a' : 'b'}`, name: `껍질과 갈빗대가 붙어있는 ${nameKo} 필렛 ${wts.filletG}g`, icon: '🍣', iconTexture: 'trim_fillet_ribs', basePrice: Math.max(1000, wts.filletG * 6), speciesId, weightG: wts.filletG, lengthCm: this.source.lengthCm } });
          break;
        case 'spine':
          rows.push({ key: 'spine', qty: 1, tpl: { ...base, id: `inv_byp_spine_${speciesId}_${seq}`, name: `${nameKo} 척추뼈 ${wts.spineG}g`, icon: '🦴', iconTexture: `trim_spine_${fam}`, byproductKind: 'spine', basePrice: Math.max(200, wts.spineG * 3), speciesId, weightG: wts.spineG } });
          break;
        case 'rib':
          // 필렛 A/B 각각의 갈빗대 → **2개** (사용자 지시 2026-07-31)
          // 재장착 = 필렛 1장 세션 → 갈빗대 1개 / 원물 통짜 = 2개
          rows.push({ key: 'rib', qty: this.resumed ? 1 : 2, tpl: { ...base, id: `inv_byp_rib_${speciesId}_${seq}`, name: `${nameKo} 갈빗대뼈 ${Math.max(1, Math.round(wts.ribG / 2))}g`, icon: '🍖', iconTexture: `trim_rib_${fam}`, byproductKind: 'rib', basePrice: Math.max(200, wts.ribG * 2), speciesId, weightG: Math.max(1, Math.round(wts.ribG / 2)) } });
          break;
        case 'pin':
          rows.push({ key: 'pin', qty: this.resumed ? 1 : 2, tpl: { ...base, id: 'inv_byp_pin', name: '생선 지아이뼈', icon: '🦴', iconTexture: 'trim_pin', byproductKind: 'pin', basePrice: 200 } });
          break;
        case 'skinFillet': {
          // 지아이 분리 후 = 1·2면에서 각 2장 → **껍질 붙은 순살 필렛 4장**.
          //  이 아이템을 도마에 다시 올리면 박피 섹션부터 이어서 진행한다 (재장착).
          //  ⚠ 재장착(필렛 1장) 세션은 원물 = 필렛인데 bypWeights가 '통짜 생선' %로 계산해
          //    880g 필렛이 97g 반쪽 2장이 되던 결함 — **원물 실중량/가치를 반씩 분할** (2026-08-04).
          let sw: number;
          let price: number;
          if (this.resumed) {
            const srcW = this.source.weightG ?? 100;
            // 갈빗대 필렛(rib 미제거)에서 시작했으면 갈빗대 몫을 빼고 분할
            const baseW = this.source.id.startsWith('inv_filletpin_') ? srcW : srcW - wts.ribG / 2;
            sw = Math.max(1, Math.round(baseW / 2));
            price = Math.max(500, Math.round((this.source.basePrice || 2000) / 2));   // 가치 승계 (원물가 분할 철학)
          } else {
            sw = Math.max(1, Math.round(wts.filletG / 2));
            price = Math.max(1000, sw * 7);
          }
          rows.push({
            key: 'skinFillet', qty: this.resumed ? 2 : 4,
            tpl: {
              ...base, subCategory: '손질 필렛',
              id: `inv_filletskin_${speciesId}_${seq}`,
              name: `껍질이 붙어있는 ${nameKo} 순살 필렛 ${sw}g`,
              icon: '🍣', iconTexture: `trim_fillet_skinonly_${fam}`,
              basePrice: price,
              speciesId, weightG: sw, lengthCm: this.source.lengthCm,
            },
          });
          break;
        }
        case 'skin':
          // 박피는 **필렛 1장** 처리 → 껍질 1장 (사용자 지시 2026-07-31)
          rows.push({ key: 'skin', qty: 1, tpl: { ...base, id: 'inv_byp_skin', name: '생선 껍질', icon: '🫓', iconTexture: 'trim_skin', byproductKind: 'skin', basePrice: 250 } });
          break;
        // ── 넙치류 다섯장뜨기 전용 (2026-08-05) ──
        case 'flatFillet': {
          // 포 뜨기 작업마다 1장 — 껍질+엔가와 붙은 **반쪽 필렛** (2026-08-07 사용자 교체):
          //  에셋은 내장 유무로 나뉜다 — upper = 내장 없는 쪽 / under = 내장쪽 (사용자 확정 명명).
          //  내장쪽 반 = 배쪽(FLIP) **위** / 등쪽(BASE) **아래** (082차 — 면마다 반대) →
          //  작업 id로 판정: t_flb_upper(배·위) / t_flk_lower(등·아래) = 내장쪽.
          //  구 _1/_2(등·배 포 2장이 붙은 3면뜨기용 합체 이미지)는 구세이브 아이콘 호환으로만 잔존.
          const n = this.grantedLog.filter((g) => g.id.startsWith('inv_filletengw_')).length + 1;
          const gutSide = taskId === 't_flb_upper' || taskId === 't_flk_lower';
          const tex = gutSide ? 'trim_fillet_engw_halibut_under' : 'trim_fillet_engw_halibut_upper';
          rows.push({
            key: y, qty: 1,
            tpl: {
              ...base, subCategory: '손질 필렛',
              id: `inv_filletengw_${speciesId}_${seq}_${n}`,
              name: `껍질과 엔가와가 붙어있는 ${nameKo} 필렛 ${wts.filletG}g`,
              icon: '🍣', iconTexture: tex,
              basePrice: Math.max(1000, wts.filletG * 6),
              speciesId, weightG: wts.filletG, lengthCm: this.source.lengthCm,
            },
          });
          break;
        }
        case 'engawaSkin':
          // 엔가와 분리 작업마다 1장 — 껍질 붙은 엔가와 (지느러미살. 박피 재장착 대상)
          rows.push({
            key: y, qty: 1,
            tpl: {
              ...base, subCategory: '손질 필렛',
              id: `inv_engwskin_${speciesId}_${seq}_${InventoryStore.nextCatchSeq()}`,
              name: `껍질이 붙어있는 ${nameKo} 엔가와 ${wts.engawaG}g`,
              icon: '🍣', iconTexture: 'trim_engawa_skin',
              basePrice: Math.max(400, wts.engawaG * 20),   // 엔가와 = 지느러미살 프리미엄
              speciesId, weightG: wts.engawaG, lengthCm: this.source.lengthCm,
            },
          });
          break;
        case 'flatSkinFillet': {
          // 엔가와 섹션 완료 — 기존 flatFillet(엔가와 붙음)을 **엔가와 제거된 껍질 필렛**으로 대체.
          //  id 접두 inv_filletskin_ = 기존 박피 재장착 체인 그대로 재사용 (sec_peel부터 재개).
          let fw: number;
          let price: number;
          if (this.resumed) {
            // 재장착(엔가와 붙은 필렛 1장) 세션 — 원물 실중량에서 엔가와 몫만 빼고 가치 승계
            fw = Math.max(1, Math.round((this.source.weightG ?? 100) - wts.engawaG));
            price = Math.max(500, Math.round(this.source.basePrice || 2000));
          } else {
            fw = Math.max(1, wts.filletG - wts.engawaG);
            price = Math.max(1000, fw * 6);
          }
          rows.push({
            key: y, qty: this.resumed ? 1 : 4,
            tpl: {
              ...base, subCategory: '손질 필렛',
              id: `inv_filletskin_${speciesId}_${seq}`,
              name: `껍질이 붙어있는 ${nameKo} 순살 필렛 ${fw}g`,
              icon: '🍣', iconTexture: 'trim_fillet_skinonly_halibut',
              basePrice: price,
              speciesId, weightG: fw, lengthCm: this.source.lengthCm,
            },
          });
          break;
        }
        case 'pureFillet':
          break;   // 순수 필렛은 최종 정산(showResult)에서 수율 계산으로 지급
      }
    }
    return rows;
  }

  /** 갈빗대 제거 완료 — **이미 지급된** 갈빗대 필렛 아이템을 '껍질이 붙어있는 필렛'으로 갱신 */
  private morphPendingFilletsToSkinOnly(): void {
    const nameKo = this.speciesName();
    for (const g of this.grantedLog) {
      if (!g.id.startsWith('inv_filletribs_')) continue;
      const item = InventoryStore.find(g.id);
      if (!item) continue;
      const w = Math.max(1, Math.round((item.weightG ?? 100) - (this.bypWeights().ribG / 2)));
      item.name = `껍질이 붙어있는 ${nameKo} 필렛 ${w}g`;
      item.iconTexture = 'trim_fillet_skin';
      item.weightG = w;
    }
    // ── 재장착 세션 — 필렛이 grantedLog가 아니라 **원물(source)** 이다 (사용자 리포트 2026-08-04:
    //  "갈빗대 제거 후 순살 필렛이 안 나옴"). 정산이 원물을 소모하므로 모프 대상이 없으면
    //  필렛이 통째로 증발했다 → **대체 필렛을 새로 지급**한다 (id `inv_filletpin_` = 지아이
    //  분리부터 재개하는 재장착 대상. 가치는 원물 필렛 몫 승계).
    if (this.resumed && this.source.id.startsWith('inv_filletribs_')) {
      const speciesId = this.process.profile.speciesId;
      const w = Math.max(1, Math.round((this.source.weightG ?? 100) - (this.bypWeights().ribG / 2)));
      const tpl = {
        id: `inv_filletpin_${speciesId}_${InventoryStore.nextCatchSeq()}`,
        name: `껍질이 붙어있는 ${nameKo} 필렛 ${w}g`,
        icon: '🍣', iconTexture: 'trim_fillet_skin',
        category: 'food' as const, subCategory: '손질 필렛',
        basePrice: Math.max(500, Math.round(this.source.basePrice)),
        condition: 'live' as const, conditionSinceMs: Date.now(),
        equippable: false,
        speciesId, weightG: w, lengthCm: this.source.lengthCm,
      };
      if (InventoryStore.addItem(tpl, 1)) this.grantedLog.push({ id: tpl.id, qty: 1 });
      else this.grantFailed.push(tpl.name);
    }
    this.scene.events.emit('inventory-changed');
  }

  /** 지아이 분리로 껍질 필렛이 나올 때 — 지급돼 있던 갈빗대 필렛/모프 대체 필렛 회수 (분할됨) */
  private removeGrantedRibFillets(): void {
    this.grantedLog = this.grantedLog.filter((g) => {
      if (!g.id.startsWith('inv_filletribs_') && !g.id.startsWith('inv_filletpin_')) return true;
      InventoryStore.removeQty(g.id, g.qty);
      return false;
    });
  }

  /**
   * 넙치류 — 엔가와 섹션 완료로 '엔가와 제거된 껍질 필렛'이 나올 때,
   * 지급돼 있던 '껍질+엔가와 붙은 필렛'(inv_filletengw_)을 회수한다 (대체 지급 — 중복 방지).
   */
  private removeGrantedFlatFillets(): void {
    this.grantedLog = this.grantedLog.filter((g) => {
      if (!g.id.startsWith('inv_filletengw_')) return true;
      InventoryStore.removeQty(g.id, g.qty);
      return false;
    });
  }

  /**
   * 부산물 팝업 — [보관/버리기] 토글 + 확인 / (exitAfter) 손질 마치기.
   * **작업 완료**(머리·내장) 또는 **섹션 완료**(필렛·척추뼈 등) 시점에 호출되고,
   * 확인 후 onDone으로 진행을 이어받는다.
   */
  private showByproductPopup(
    yields: ButcherySectionYield[], label: string, exitBtn: boolean, onDone: () => void,
    taskId?: string,
  ): void {
    this.closeByproductPopup();
    this.stopGuideAnim();
    const rows = this.buildYieldRows(yields, taskId);
    if (rows.length === 0) { onDone(); return; }
    this.byproductDone = onDone;
    const keep = rows.map(() => true);

    const scene = this.scene;
    const W = 420, rowH = 42;
    const H = 92 + rows.length * rowH + (exitBtn ? 92 : 52);
    const c = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(1600);
    const dim = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setInteractive();
    const bg = scene.add.graphics();
    bg.fillStyle(0x0a1628, 0.98); bg.fillRoundedRect(-W / 2, -H / 2, W, H, 8);
    bg.lineStyle(2, 0xc8a060, 1); bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 8);
    const title = scene.add.text(0, -H / 2 + 24, `부산물 발생 — ${label.replace(/ \(.*\)$/, '')}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add([dim, bg, title]);

    rows.forEach((row, i) => {
      const ry = -H / 2 + 56 + i * rowH;
      if (row.tpl.iconTexture && scene.textures.exists(row.tpl.iconTexture)) {
        const img = scene.add.image(-W / 2 + 34, ry + 12, row.tpl.iconTexture);
        const s = Math.min(36 / img.width, 30 / img.height);
        img.setScale(s);
        c.add(img);
      }
      const nameT = scene.add.text(-W / 2 + 62, ry + 12, `${row.tpl.name}${row.qty > 1 ? `  x${row.qty}` : ''}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#d0e8f5',
      }).setOrigin(0, 0.5);
      if (nameT.width > W - 240) nameT.setScale((W - 240) / nameT.width);
      // [보관] [버리기] — **선택형 2버튼** (선택된 쪽만 강조).
      //  ⚠ 구 단일 토글은 "현재 상태 표시"였는데 액션 버튼처럼 읽혀, '보관'이라 떠 있을 때
      //    누르면 오히려 버리기로 뒤집혔다 (사용자가 부산물을 의도치 않게 버리던 함정 UI).
      const tg = scene.add.graphics();
      const keepT = scene.add.text(W / 2 - 128, ry + 12, '보관', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', fontStyle: 'bold',
      }).setOrigin(0.5);
      const dropT = scene.add.text(W / 2 - 58, ry + 12, '버리기', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', fontStyle: 'bold',
      }).setOrigin(0.5);
      const paint = (): void => {
        tg.clear();
        // 보관 버튼 (좌)
        tg.fillStyle(keep[i] ? 0x0d4a2e : 0x14202e, keep[i] ? 0.95 : 0.7);
        tg.fillRoundedRect(W / 2 - 158, ry, 60, 24, 4);
        tg.lineStyle(1.4, keep[i] ? 0x4af2a1 : 0x39505e, 0.95);
        tg.strokeRoundedRect(W / 2 - 158, ry, 60, 24, 4);
        // 버리기 버튼 (우)
        tg.fillStyle(!keep[i] ? 0x4a1d1d : 0x14202e, !keep[i] ? 0.95 : 0.7);
        tg.fillRoundedRect(W / 2 - 92, ry, 68, 24, 4);
        tg.lineStyle(1.4, !keep[i] ? 0xff6b6b : 0x39505e, 0.95);
        tg.strokeRoundedRect(W / 2 - 92, ry, 68, 24, 4);
        keepT.setColor(keep[i] ? '#7fe6b0' : '#5f7d8e');
        dropT.setColor(!keep[i] ? '#ff9a9a' : '#5f7d8e');
      };
      paint();
      const keepHit = scene.add.rectangle(W / 2 - 128, ry + 12, 60, 24, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      keepHit.on('pointerdown', () => { keep[i] = true; paint(); });
      const dropHit = scene.add.rectangle(W / 2 - 58, ry + 12, 68, 24, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      dropHit.on('pointerdown', () => { keep[i] = false; paint(); });
      c.add([tg, keepT, dropT, nameT, keepHit, dropHit]);
    });

    const mkBtn = (y: number, label: string, color: string, stroke: number, onClick: () => void): void => {
      const g = scene.add.graphics();
      g.fillStyle(0x14283c, 0.98); g.fillRoundedRect(-150, y - 16, 300, 32, 5);
      g.lineStyle(1.5, stroke, 0.95); g.strokeRoundedRect(-150, y - 16, 300, 32, 5);
      const t = scene.add.text(0, y, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color, fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = scene.add.rectangle(0, y, 300, 32, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', onClick);
      c.add([g, t, hit]);
    };
    const by0 = H / 2 - (exitBtn ? 66 : 32);
    mkBtn(by0, '확인 후 계속 (Enter)', '#aee8ff', 0x33b0e0, () => this.confirmByproductPopup(false));
    if (exitBtn) {
      mkBtn(by0 + 38, '보관 후 손질 마치기 (필렛 저장)', '#ffd257', 0xc8a060, () => this.confirmByproductPopup(true));
    }

    applyScreenFixed(c);
    this.byproductPopup = c;
    // 확정 시점에 keep 상태를 읽도록 보관
    (c as Phaser.GameObjects.Container & { __rows?: typeof rows; __keep?: boolean[] }).__rows = rows;
    (c as Phaser.GameObjects.Container & { __rows?: typeof rows; __keep?: boolean[] }).__keep = keep;
  }

  private closeByproductPopup(): void {
    this.byproductPopup?.destroy();
    this.byproductPopup = undefined;
  }

  /** 열린 부산물 팝업의 [보관] 선택분을 **즉시 지급**하고 팝업을 닫는다. 지급 수 반환 */
  private absorbByproductPopup(): number {
    const c = this.byproductPopup as (Phaser.GameObjects.Container & {
      __rows?: { key: string; tpl: Omit<InvItem, 'slot' | 'qty'>; qty: number }[]; __keep?: boolean[];
    }) | undefined;
    if (!c) return 0;
    const rows = c.__rows ?? [];
    const keep = c.__keep ?? [];
    const kept = rows.filter((_, i) => keep[i]);
    // 껍질 붙은 순살 필렛(지아이 분리 산출)이 나오면 — 갈빗대 필렛 2장이 4장으로 쪼개진 것이므로
    // 앞서 지급한 갈빗대 필렛을 회수한다 (중복 방지)
    if (kept.some((r) => r.key === 'skinFillet')) this.removeGrantedRibFillets();
    // 넙치류 — 엔가와 제거 필렛(대체 지급)이 나오면 기존 엔가와 붙은 필렛 회수
    if (kept.some((r) => r.key === 'flatSkinFillet')) this.removeGrantedFlatFillets();
    this.grantRows(kept);
    this.closeByproductPopup();
    return kept.length;
  }

  /** 팝업 확정 — [보관] 행 **즉시 인벤토리 지급** (사용자 지시 2026-08-03). exitNow면 정산 종료 */
  private confirmByproductPopup(exitNow: boolean): void {
    if (!this.byproductPopup) return;
    const kept = { length: this.absorbByproductPopup() };
    const done = this.byproductDone;
    this.byproductDone = undefined;
    this.flash(kept.length
      ? `부산물 ${kept.length}종 인벤토리에 지급되었습니다`
      : '부산물을 버렸습니다', true);
    if (exitNow) {
      // 즉시 종료 — 체크포인트 갱신 후 정산 (필렛만 저장하고 손질 마침)
      if (this.section.id === 'sec_fillet_b') this.checkpoint = 'fillets';
      if (this.section.id === 'sec_rib') { this.checkpoint = 'ribs'; this.morphPendingFilletsToSkinOnly(); }
      this.settleAtCheckpoint();
      return;
    }
    if (done) done();
    else this.advanceSection();
  }

  /**
   * 레저 실지급 — `addItem`은 **칸이 없으면 조용히 false**를 반환하므로 실패를 모아 알린다.
   * (부산물이 말없이 사라지던 원인 중 하나 — 사용자 리포트 2026-07-31)
   */
  /** 부산물 행 **즉시 지급** — 성공분은 grantedLog에 기록(이탈 회수/변형용), 실패는 경고 */
  private grantRows(rows: { key: string; tpl: Omit<InvItem, 'slot' | 'qty'>; qty: number }[]): void {
    for (const p of rows) {
      const tpl = p.tpl as Parameters<typeof InventoryStore.addItem>[0];
      if (InventoryStore.addItem(tpl, p.qty)) this.grantedLog.push({ id: p.tpl.id, qty: p.qty });
      else this.grantFailed.push(p.tpl.name);
    }
    // dev 진단 — "부산물이 안 들어왔다" 리포트 시 콘솔에서 지급 시점 상태를 확인
    if (import.meta.env.DEV) {
      console.log('[Butchery] 부산물 지급:',
        rows.map((p) => `${p.tpl.name} x${p.qty}`).join(', ') || '(지급 대상 없음)',
        this.grantFailed.length ? `실패 ${this.grantFailed.length}건(칸 부족)` : '');
    }
    if (this.grantFailed.length) {
      this.flash(`⚠ 인벤토리 칸 부족 — ${this.grantFailed.length}종 미지급`, false);
    }
    this.scene.events.emit('inventory-changed');
  }

  /** 체크포인트 **전** 이탈 — 원물 보존 규칙: 이번 세션에 지급했던 부산물을 전량 회수 */
  private revokeGranted(): void {
    for (const g of this.grantedLog) InventoryStore.removeQty(g.id, g.qty);
    if (import.meta.env.DEV && this.grantedLog.length) {
      console.log('[Butchery] 체크포인트 전 이탈 — 지급분 회수:', this.grantedLog.length, '건');
    }
    this.grantedLog = [];
  }

  /** 체크포인트 정산 — 부산물은 팝업 시점에 이미 지급됨. 원물 소모 + XP + 종료 오버레이 */
  private settleAtCheckpoint(): void {
    if (this.done) return;
    this.done = true;
    this.stopGuideAnim();
    this.stopActionAnim();
    this.absorbByproductPopup();   // 아직 열린 팝업이 있으면 그 선택분까지 지급
    InventoryStore.removeItem(this.source.id, false);
    const xp = Math.round(14 + (this.checkpoint === 'ribs' ? 10 : 0));
    const lv = GameState.addFilletingXp(xp);

    // 오버레이는 고정 도마 rect 기준 — 생선 회전 상태와 무관하게 같은 자리
    const BX = this.boardX, BY = this.boardY, BW = this.boardW, BH = this.boardH;
    const c = this.scene.add.container(0, 0);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.96);
    bg.fillRoundedRect(BX + 40, BY + 20, BW - 80, BH - 40, 8);
    bg.lineStyle(2, 0xffd257, 0.95);
    bg.strokeRoundedRect(BX + 40, BY + 20, BW - 80, BH - 40, 8);
    const title = this.scene.add.text(BX + BW / 2, BY + 58, '손질 종료 — 필렛 저장', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffd257', fontStyle: 'bold',
    }).setOrigin(0.5);
    const desc = this.scene.add.text(BX + BW / 2, BY + 92,
      `보관 선택한 부산물이 인벤토리에 지급되었습니다. (+${xp} XP · Lv.${lv.level})\n`
      + '필렛은 나중에 도마에 다시 올려 이어서 손질할 수 있습니다 (추후 재장착 지원).', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#d0e8f5', align: 'center', lineSpacing: 6,
      }).setOrigin(0.5, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x14425e, 0.98);
    btnBg.fillRoundedRect(BX + BW / 2 - 70, BY + BH - 66, 140, 34, 5);
    btnBg.lineStyle(1.5, 0x33b0e0, 1);
    btnBg.strokeRoundedRect(BX + BW / 2 - 70, BY + BH - 66, 140, 34, 5);
    const btnTxt = this.scene.add.text(BX + BW / 2, BY + BH - 49, '확인', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#aee8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(BX + BW / 2, BY + BH - 49, 140, 34, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.cbs.onComplete());
    c.add([bg, title, desc, btnBg, btnTxt, hit]);
    this.add(c);
    this.applyFix();
  }

  // ═══════════════════════════════════════════════════
  // 좌표/판정 헬퍼
  // ═══════════════════════════════════════════════════
  /** 스크린 → 생선 bbox 정규화 (0~1). 영역 밖이면 null */
  private toNorm(p: Phaser.Input.Pointer, slack = 0.12): CutPoint | null {
    const u = (p.x - this.x - this.fishX) / this.fishW;
    const v = (p.y - this.y - this.fishY) / this.fishH;
    // 회전된 도마에서도 판정은 항상 **생선 로컬 좌표**에서 한다 (가이드 좌표계와 동일 기준)
    const [lx, ly] = this.unrotNorm(u, v);
    if (lx < -slack || lx > 1 + slack || ly < -slack || ly > 1 + slack) return null;
    return { x: lx, y: ly };
  }

  private freshnessFactor(item: InvItem): number {
    switch (item.condition) {
      case 'live': return 1.0;
      case 'fresh': return 0.9;
      case 'chilled': return 0.85;   // 냉장은 사시미 취급 가능
      case 'normal': return 0.6;     // 보통 — 사시미 부적합 (등급 하락)
      case 'frozen': return 0.55;
      case 'thawed': return 0.5;
      case 'bad': return 0.35;
      case 'spoiled': return 0.25;
      default: return 0.85;
    }
  }

  /** speciesId가 없는 레거시 어획물 — 이름으로 추정 */
  private guessSpecies(item: InvItem): string {
    const n = item.name;
    if (n.includes('감성돔')) return 'black_seabream';
    if (n.includes('긴꼬리')) return 'longtail_blackfish';
    if (n.includes('벵에돔')) return 'largescale_blackfish';
    if (n.includes('광어') || n.includes('넙치')) return 'flatfish';
    if (n.includes('농어')) return 'sea_bass';
    if (n.includes('방어')) return 'yellowtail';
    if (n.includes('부시리')) return 'amberjack';
    if (n.includes('참돔')) return 'red_seabream';
    if (n.includes('돌돔')) return 'stone_beakperch';
    if (n.includes('강담돔')) return 'spotted_knifejaw';
    if (n.includes('고등어')) return 'chub_mackerel';
    if (n.includes('전갱이')) return 'horse_mackerel';
    return 'black_seabream';
  }

  /** 현재 스테이지가 회칼이 필요한 회뜨기(장 뜨기/박피) 단계인지 */
  private isFilletingStage(): boolean {
    const id = this.process.stage?.id ?? '';
    return id === 'tail_grip' || id.startsWith('fillet_') || id === 'peel'
      // 넙치류 다섯장뜨기 — 포 뜨기/엔가와 분리도 회뜨기 단계 (회칼 소프트 게이트 대상)
      || id.startsWith('flat_belly_') || id.startsWith('flat_back_') || id.startsWith('engawa_');
  }

  /** 체장 미달 — 회뜨기 비효율(통마리 유도 대상) */
  private isUndersized(): boolean {
    const len = this.source.lengthCm ?? 999;
    return len < this.process.profile.minFilletLengthCm;
  }

  /**
   * 회칼 미보유 + 회뜨기 단계 하드 잠금 — TUNING.butchery.knifeHardLock=true일 때만.
   * 기본(false)은 소프트 페널티: 막칼 폴백으로 진행 허용(수율 0.85 + 등급 '상' 캡),
   * 사이드바에 안내 + [통마리로 마무리] 선택지 유지.
   */
  private knifeLocked(): boolean {
    if (!TUNING.butchery.knifeHardLock) return false;
    return !this.knife && !this.process.finished && !this.done && this.isFilletingStage();
  }

  // ═══════════════════════════════════════════════════
  // 입력 (프리미티브별)
  // ═══════════════════════════════════════════════════
  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (this.sheetViewer) return;   // 시트 뷰어 열림 중 — 손질 입력 차단 (뷰어 자체 핸들러가 처리)
    if (this.editMode) {            // dev 가이드 편집 (손질 입력 차단)
      const lx = p.x - this.x, ly = p.y - this.y;
      let best = -1, bestD = 16;
      this.editHandles.forEach((h, i) => { const d = Math.hypot(lx - h.sx, ly - h.sy); if (d < bestD) { bestD = d; best = i; } });
      // 우클릭 = 핸들 점 삭제 (곡선 다듬기)
      if (p.rightButtonDown()) {
        if (best >= 0) this.editDeletePoint(best);
        return;
      }
      // 곡선 그리기 모드 — 도마 안에서 시작하면 자유곡선 캡처
      if (this.editDraw) {
        const n0 = this.toNorm(p, 0.05);
        if (n0) {
          this.editDrawPts = [n0];
          if (!this.editDrawG) { this.editDrawG = this.scene.add.graphics(); this.add(this.editDrawG); }
          this.paintEditDraw();
        }
        return;
      }
      this.editDragIdx = best;
      return;
    }
    if (this.process.finished || this.done || this.knifeLocked() || this.flipping || this.actionAnim) return;
    if (this.awaitingSelect) {
      this.flash('우측 상단 작업 목록에서 다음 작업을 선택하세요', false);
      return;
    }
    if (this.byproductPopup) return;
    const stage = this.process.stage;
    if (!stage) return;
    const n = this.toNorm(p);
    if (!n) return;
    // 방향 불일치 — 조용한 무시 대신 명확한 안내 (수동 뒤집기 유도, 먹통 방지)
    if (!this.process.canAct()) {
      this.flash(`먼저 [${this.orientLabel(stage.orientation)}] 방향으로 — 좌우(F)/상하(V) 뒤집기`, false);
      return;
    }

    if (stage.primitive === 'tap') {
      const tp = stage.tapPoint ?? { x: 0.16, y: 0.38 };
      const dist = Math.hypot(n.x - tp.x, n.y - tp.y);
      const r = this.process.submitTap(dist);
      this.flash(r.passed ? `시메 성공 (정확도 ${(r.quality * 100).toFixed(0)}%) — 선도가 유지됩니다` : '빗나갔습니다 — 눈 뒤 지점을 다시 탭하세요', r.passed);
      const willFlip = this.process.orientation !== this.renderedOrientation;
      if (r.passed && !willFlip) this.playActionAnim(stage);   // 전환은 연출 완료 후 (플래시 방지)
      else this.refresh();
      if (r.passed) this.onStageComplete(stage.id, r.quality);
    } else if (stage.primitive === 'guided_cut') {
      this.tracing = true;
      this.tracePoints = [n];
      this.traceG.clear();
      // 넙치류 포 뜨기(경계 칼길·분리 1/2) — 칼 팔로우 세션 시작 (84차)
      if (this.flatKnifeInfo(stage.id)) this.startKnifeFollow(stage);
    } else if (stage.primitive === 'drag_fill' || stage.primitive === 'scoop') {
      // 박피 당기기 = **껍질(도마 왼쪽 회색)을 클릭**해서 시작 (사용자 지시 2026-07-31)
      if (stage.id === 'peel_pull' && n.x > 0.42) {
        this.flash('왼쪽 껍질을 잡고 시작하세요', false);
        return;
      }
      this.tracing = true;
      this.lastFillPt = n;
    } else if (stage.primitive === 'peel') {
      // 꼬리 손잡이(우측 끝)에서만 잡기 시작
      if (n.x > 0.72) this.peelStart = n;
      else this.flash('꼬리 쪽 손잡이를 잡고 시작하세요', false);
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (this.editMode) {
      // 곡선 그리기 캡처 중 — 일정 간격으로 궤적 누적 (그 외에는 핸들 드래그)
      if (this.editDraw) {
        if (this.editDrawPts.length > 0 && p.isDown) {
          const n = this.toNorm(p, 0.08);
          const last = this.editDrawPts[this.editDrawPts.length - 1];
          if (n && Math.hypot(n.x - last.x, n.y - last.y) > 0.006) {
            this.editDrawPts.push(n);
            this.paintEditDraw();
          }
        }
        return;
      }
      this.updateEditDrag(p);
      return;
    }
    if (this.done || this.knifeLocked() || this.flipping || this.actionAnim) return;
    if (!this.tracing && !this.peelStart) return;
    const stage = this.process.stage;
    if (!stage) return;
    const n = this.toNorm(p);
    if (!n) return;

    if (this.tracing && stage.primitive === 'guided_cut') {
      const last = this.tracePoints[this.tracePoints.length - 1];
      if (Math.hypot(n.x - last.x, n.y - last.y) > 0.01) {
        this.tracePoints.push(n);
        // 칼선 렌더 (은색) — 반드시 toPanelPx(회전 변환) 경유.
        //  ⚠ 좌표는 생선 로컬 정규화라, 직접 fishX+n.x·fishW로 그리면 90° 회전 시
        //    세로로 그었는데 자국이 가로로 남는다 (사용자 리포트 2026-08-06).
        const [lpx, lpy] = this.toPanelPx(last);
        const [npx, npy] = this.toPanelPx(n);
        this.traceG.lineStyle(2.2, 0xe8f4ff, 0.9);
        this.traceG.lineBetween(lpx, lpy, npx, npy);
        this.feedKnife(n);   // 포 뜨기 칼 팔로우 — 드래그 샘플 적립 (해당 스테이지가 아니면 no-op)
      }
    } else if (this.tracing && (stage.primitive === 'drag_fill' || stage.primitive === 'scoop')) {
      if (this.lastFillPt) {
        // 게이지 = 스윕 경로 커버리지 (제자리 흔들기로는 안 찬다)
        const delta = this.sweepCoverDelta(stage, n);
        // 커서가 지나가는 위치마다 비늘/부스러기 튐 (진행 방향 앞쪽으로)
        const nowMs = this.scene.time.now;
        const mvx = n.x - this.lastFillPt.x, mvy = n.y - this.lastFillPt.y;
        if (nowMs - this.lastFlakeMs > 40 && Math.hypot(mvx, mvy) > 0.004) {
          this.lastFlakeMs = nowMs;
          // 위치·진행 방향 모두 화면 좌표(toPanelPx) 기준 — 회전 시에도 커서를 따라간다
          const [bpx, bpy] = this.toPanelPx(n);
          const [blx, bly] = this.toPanelPx(this.lastFillPt);
          this.spawnScaleBurst(
            bpx, bpy,
            Math.atan2(bpy - bly, bpx - blx),
            delta > 0 ? 5 : 2,
            stage.primitive === 'drag_fill' ? 'scale' : 'gut',
          );
        }
        const res = this.process.submitFill(delta);
        if (res.stageDone) {
          // 내장/핏줄(scoop) 상태는 doneStages에서 파생 — 여기선 비늘 면수만 센다
          if (stage.primitive === 'drag_fill') this.scaledSides++;
          this.tracing = false;
          this.flash(stage.primitive === 'drag_fill' ? '비늘을 말끔히 벗겼습니다'
            : stage.id === 'vessel_scrub' ? '척추 아래 핏줄을 긁어냈습니다' : '내장을 통째로 꺼냈습니다', true);
          const willFlip = this.process.orientation !== this.renderedOrientation;
          // 박피 당기기(peel_pull)는 게이지 완료 후 **선 따라 칼 스윕 연출을 하지 않는다** —
          //  드래그 중 위아래 톱질 연출이 이미 재생됐으므로 중복·어색 (사용자 지시 2026-08-05).
          if (!willFlip && stage.id !== 'peel_pull') this.playActionAnim(stage, this.sweepPathFor(stage));
          else this.refresh();
          this.onStageComplete(stage.id, 1);
        } else {
          this.updateFillBar(res.progress);
        }
      }
      this.lastFillPt = n;
    }
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (this.editMode) {                                    // dev 편집 — 드래그/캡처 종료
      if (this.editDraw && this.editDrawPts.length > 0) this.commitEditDraw();
      this.editDragIdx = -1;
      return;
    }
    if (this.done || this.knifeLocked() || this.flipping) { this.tracing = false; this.peelStart = null; return; }
    const stage = this.process.stage;

    // 박피 당김 판정
    if (this.peelStart && stage?.primitive === 'peel') {
      const n = this.toNorm(p, 0.4) ?? this.peelStart;
      const dx = this.peelStart.x - n.x;              // 좌로 당김 = +
      const dy = Math.abs(n.y - this.peelStart.y);
      const angleQ = Math.max(0.2, 1 - dy / Math.max(0.12, dx));   // 15도 유지 근사
      const quality = Math.max(0, Math.min(1, dx * 1.5)) * angleQ;
      const r = this.process.submitPeelPull(quality);
      this.flash(r.passed
        ? (r.stageDone ? '박피 완료! 필렛이 완성되었습니다' : `껍질 분리 — 남은 장 ${r.pullsLeft}`)
        : '당김이 약합니다 — 손잡이를 잡고 왼쪽으로 길게 당기세요', r.passed);
      this.peelStart = null;
      const willFlip = this.process.orientation !== this.renderedOrientation;
      if (r.passed && !willFlip && r.stageDone === false) this.playActionAnim(stage);   // 전환은 연출 완료 후
      else this.refresh();
      if (r.stageDone) this.onStageComplete(stage.id, quality);
      return;
    }
    this.peelStart = null;

    // 가이드 컷 판정
    if (this.tracing && stage?.primitive === 'guided_cut') {
      this.tracing = false;
      const strokesBefore = stage.cut?.strokesRequired
        ? stage.cut.strokesRequired - this.process.currentStrokesLeft
        : 0;
      // 넙치류 포 뜨기 — 이 스테이지의 칼 팔로우 세션이 살아 있는가 (84차)
      const knife = !!this.knifeFx && this.knifeFx.stageId === stage.id;
      const r = this.process.submitCut(this.tracePoints);
      this.tracePoints = [];
      this.scene.time.delayedCall(150, () => this.traceG.clear());
      if (!r.passed) {
        this.flash('가이드 선을 따라 다시 그어주세요 (커버율 부족)', false);
        if (knife) this.failKnife();   // 칼 페이드아웃 + 라이브 벌어짐 원복
      } else {
        if (stage.id === 'head_flip') this.headOff = true;
        this.flash(r.stageDone
          ? `컷 성공 — 정확도 ${(r.quality * 100).toFixed(0)}%`
          : `칼집 ${r.strokesLeft}회 남음 (정확도 ${(r.quality * 100).toFixed(0)}%)`, true);
      }
      // 장뜨기 — 칼이 지나간 뒤 **벌어지는 연출** 단계 예약 (칼집 회차 = 벌어짐 정도).
      //  스테이지가 넘어가도(3회째/분리) 연출 동안은 마지막 벌어짐을 유지한다.
      if (r.passed && stage.id.startsWith('fillet_')) {
        // 배쪽(sever·ribsever·bellyribcut)=belly / 등쪽(score·ribcut)=dorsal
        const belly = stage.id.includes('sever') || stage.id.includes('belly');
        const view = belly ? 'belly' : 'dorsal';
        // **연결부 끊기 단계는 이미 완전히 벌어진 상태** — 벌어짐 3 고정.
        //  ⚠ 구 구현은 `strokesBefore + 1`이라 1스트로크 스테이지(ribcut/bellyribcut)에서 **1**이 되어,
        //    연출 순간 "살짝만 열린" 그림이 튀었다 (사용자 리포트 2026-07-31).
        //    2면은 스테이지가 쪼개져 있으므로 **완료된 앞 단계까지 누적**해서 계산한다.
        const done = (id: string): boolean => this.doneStages.has(id);
        const junction = stage.id.includes('ribsever') || stage.id.endsWith('ribcut');
        let openState: number;
        if (junction) {
          openState = 3;
        } else if (stage.id.startsWith('fillet_1')) {
          const base = belly
            ? (done('fillet_1_bellyribcut') ? 1 : 0)
            : (done('fillet_1_score') ? 1 : 0) + (done('fillet_1_score2') ? 1 : 0);
          openState = Math.min(3, base + strokesBefore + 1);
        } else {
          openState = Math.min(3, strokesBefore + 1);
        }
        this.filletOpenPending = { view, state: openState, mirrorX: stage.id.startsWith('fillet_1') };
      }
      const willFlip = this.process.orientation !== this.renderedOrientation;
      // 다중 유도선이면 방금 판정된 그 선(matchedPath)을 따라 칼이 지나간다.
      const multi = stage.cut?.guidePaths;
      const cutPath = multi && r.matchedPath >= 0 ? multi[r.matchedPath] : undefined;
      // 컷 성공 + 방향 유지 = 연출을 **pre-cut 스프라이트 위에서** 재생하고, 스프라이트/사이드바
      //  전환은 연출 완료(onComplete doRefresh)까지 미룬다 (플래시 방지). 방향 전환(뒤집기)이
      //  이어지면 flip 연출이 전환을 담당하므로 즉시 refresh.
      //  포 뜨기 칼 팔로우 스테이지는 playActionAnim 대신 **칼이 경로 끝까지 마저 진행**한다.
      if (r.passed && !willFlip) {
        if (knife) this.finishKnife();
        else this.playActionAnim(stage, cutPath);
      } else {
        if (knife && r.passed) this.stopKnifeFx();   // 뒤집기가 전환을 담당 — 칼만 정리
        this.filletOpenPending = null;
        this.refresh();
      }
      if (r.passed && r.stageDone) this.onStageComplete(stage.id, r.quality);
      return;
    }
    this.tracing = false;
    this.lastFillPt = null;
  }

  // ═══════════════════════════════════════════════════
  // 렌더
  // ═══════════════════════════════════════════════════
  /**
   * 리렌더 — 방향이 바뀌어 있으면(자동 스냅/수동 전환) 뒤집기 연출을 먼저 재생하고
   * 완료 시점에 실제 리렌더(doRefresh). 연출 중 입력은 flipping 가드로 차단.
   */
  private refresh(): void {
    if (!this.done && !this.flipping && this.process.orientation !== this.renderedOrientation) {
      this.playFlipAnim();
      return;
    }
    this.doRefresh();
  }

  private doRefresh(): void {
    this.refreshTitle();   // '손질하기 — 원물 손질 (감성돔, 900g, 38cm)'
    this.uiC.removeAll(true);
    this.syncPeelSaw();    // 박피 톱질 루프 on/off
    this.drawFish();
    if (!this.knifeLocked()) this.drawGuide();
    this.drawSidebar();
    if (this.knifeLocked()) this.drawKnifeLock();
    // 가이드 경로 루프 연출 재시작 (가이드 꺼짐/편집 모드면 외곽 화살표 큐는 정지 — 유도선은 유지)
    if (this.guideOff || this.editMode) this.stopGuideAnim();
    else if (!this.actionAnim) this.startGuideAnim();
    if (import.meta.env.DEV && this.editMode) this.drawGuideEditor();   // 편집 핸들 오버레이
    this.applyFix();
  }

  /** 뒤집기 연출 — 생선을 가로로 접었다 펴며 새 방향으로 리렌더 */
  private playFlipAnim(): void {
    this.flipping = true;
    this.stopGuideAnim();     // 옛 방향 좌표의 루프/액션 연출 정리
    this.stopActionAnim();
    this.stopKnifeFx();   // 뒤집기 중 칼 팔로우 세션은 무효 (라이브 엔벌로프 해제)
    this.guideG.clear();
    this.traceG.clear();
    this.tracing = false;
    this.peelStart = null;
    const dur = Math.max(80, TUNING.butchery.flipAnimMs);
    const cx = this.fishX + this.fishW / 2;   // 패널 로컬 뒤집기 축
    const st = { s: 1 };
    const apply = (): void => {
      if (!this.scene) return;
      this.fishG.scaleX = st.s;
      this.fishG.x = cx * (1 - st.s);
    };
    const t1 = this.scene.tweens.add({
      targets: st, s: 0, duration: dur / 2, ease: 'Sine.easeIn',
      onUpdate: apply,
      onComplete: () => {
        if (!this.scene) return;
        // 접힌 시점에 새 방향으로 몸통 교체
        this.renderedOrientation = asFishOri(this.process.orientation);
        this.drawFish();
        const t2 = this.scene.tweens.add({
          targets: st, s: 1, duration: dur / 2, ease: 'Sine.easeOut',
          onUpdate: apply,
          onComplete: () => {
            if (!this.scene) return;
            this.fishG.scaleX = 1;
            this.fishG.x = 0;
            this.flipping = false;
            this.doRefresh();
            this.runPendingAfterAction();   // 뒤집기 후로 미뤄둔 완료 처리 실행
          },
        });
        this.flipTweens.push(t2);
      },
    });
    this.flipTweens.push(t1);
  }

  /** 회칼 미보유 잠금 오버레이 — 회뜨기 단계 진입 시 안내 + [통마리로 마무리] */
  private drawKnifeLock(): void {
    const X = this.boardX, Y = this.boardY, W = this.boardW, H = this.boardH;   // 고정 도마 rect
    const g = this.scene.add.graphics();
    g.fillStyle(0x081422, 0.9);
    g.fillRoundedRect(X + 20, Y - 6, W - 40, H + 12, 8);
    g.lineStyle(2, 0xffb454, 0.95);
    g.strokeRoundedRect(X + 20, Y - 6, W - 40, H + 12, 8);
    this.uiC.add(g);

    const title = this.scene.add.text(X + W / 2, Y + 44, '회칼이 필요합니다', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffb454', fontStyle: 'bold',
    }).setOrigin(0.5);
    const desc = this.scene.add.text(X + W / 2, Y + 96, [
      '시메·방혈·손질(비늘/머리/내장)까지 마쳤습니다.',
      '회뜨기(장 뜨기·박피)는 인벤토리 기타 아이템에 회칼이 있어야 합니다.',
      '(식자재마트에서 막칼/회칼/야나기바 구매)',
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e0d0b8', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5, 0);
    this.uiC.add([title, desc]);

    const bw = 220, bx = X + W / 2, by = Y + H - 34;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x3a2e14, 0.98); bg.fillRoundedRect(bx - bw / 2, by - 18, bw, 36, 6);
    bg.lineStyle(2, 0xffb454, 1); bg.strokeRoundedRect(bx - bw / 2, by - 18, bw, 36, 6);
    const t = this.scene.add.text(bx, by, '통마리로 마무리 (손질까지)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffd9a0', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(bx, by, bw, 36, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.finishWhole());
    this.uiC.add([bg, t, hit]);
  }

  /** 회칼 미보유 종료 — 통마리(손질 완료 생선)로 지급 + 소량 XP */
  private finishWhole(): void {
    if (this.done) return;
    this.done = true;
    const speciesId = this.process.profile.speciesId;
    const fishDef = FISH_DATABASE.find((f) => f.id === speciesId);
    const nameKo = fishDef?.nameKo ?? this.source.name;
    const weightKg = (this.source.weightG
      ?? (fishDef ? (fishDef.avgWeightRangeG[0] + fishDef.avgWeightRangeG[1]) / 2 : 800)) / 1000;
    const price = Math.max(1200, Math.round((fishDef?.sashimiValuePerKg ?? 15000) * weightKg * 0.4));

    const seq = InventoryStore.nextCatchSeq();
    InventoryStore.addItem({
      id: `inv_dressed_${speciesId}_${seq}`,
      name: `${nameKo} 손질 (통마리)`,
      icon: '🐟', iconTexture: this.source.iconTexture,
      category: 'food', subCategory: '손질 통마리',
      basePrice: price, condition: this.source.condition ?? 'fresh',
      equippable: false, speciesId, lengthCm: this.source.lengthCm, weightG: this.source.weightG,
    }, 1);
    InventoryStore.removeItem(this.source.id, false);
    GameState.addFilletingXp(8);

    // 완료 오버레이 — 고정 도마 rect 기준
    this.uiC.removeAll(true);
    const BX = this.boardX, BY = this.boardY, BW = this.boardW, BH = this.boardH;
    const c = this.scene.add.container(0, 0);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.96);
    bg.fillRoundedRect(BX + 40, BY - 10, BW - 80, BH + 20, 8);
    bg.lineStyle(2, 0xffb454, 0.95);
    bg.strokeRoundedRect(BX + 40, BY - 10, BW - 80, BH + 20, 8);
    const title = this.scene.add.text(BX + BW / 2, BY + 50, '손질 완료 (통마리)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffd9a0', fontStyle: 'bold',
    }).setOrigin(0.5);
    const desc = this.scene.add.text(BX + BW / 2, BY + 100,
      `${nameKo} 손질 (통마리) — ${price.toLocaleString()}원\n회칼이 없어 회뜨기는 하지 못했습니다. 통마리 판매/조림용으로 인벤토리에 지급되었습니다.`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e0d0b8', align: 'center', lineSpacing: 8,
      }).setOrigin(0.5, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x3a2e14, 0.95);
    btnBg.fillRoundedRect(BX + BW / 2 - 80, BY + BH - 44, 160, 38, 6);
    btnBg.lineStyle(2, 0xffb454, 0.95);
    btnBg.strokeRoundedRect(BX + BW / 2 - 80, BY + BH - 44, 160, 38, 6);
    const btnTxt = this.scene.add.text(BX + BW / 2, BY + BH - 25, '확인', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffd9a0', fontStyle: 'bold',
    }).setOrigin(0.5);
    const btnHit = this.scene.add.rectangle(BX + BW / 2, BY + BH - 25, 160, 38, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    btnHit.on('pointerdown', () => this.cbs.onComplete());
    c.add([bg, title, desc, btnBg, btnTxt, btnHit]);
    this.add(c);
    this.applyFix();
  }

  /**
   * 박피 톱질 루프 — `peel_pull` 단계에서 **드래그하는 동안** 칼이 제자리 위아래로 움직인다.
   * (사용자 지시 2026-07-31 — "칼을 제자리에서 위아래로만 톱질하듯이")
   * 도마 그래픽만 다시 그려 비용을 낮춘다 (doRefresh 아님).
   */
  private syncPeelSaw(): void {
    const active = this.process.stage?.id === 'peel_pull' && !this.done && !this.process.finished;
    if (active && !this.peelSawEvent) {
      this.peelSawEvent = this.scene.time.addEvent({
        delay: 40, loop: true,
        callback: () => {
          // 드래그 중일 때만 톱질 (멈추면 그 자리에 정지)
          if (!this.tracing) return;
          this.peelSawPhase = (this.peelSawPhase + 0.09) % 1;
          this.drawFish();
        },
      });
    } else if (!active && this.peelSawEvent) {
      this.peelSawEvent.remove();
      this.peelSawEvent = undefined;
      this.peelSawPhase = 0;
    }
  }

  /** 도마 위 픽셀 생선 — 가이드 시트와 동일한 도트 스프라이트 (FSM 상태 기반) */
  private drawFish(): void {
    const g = this.fishG;
    g.clear();
    const X = this.fishX, Y = this.fishY, W = this.fishW, H = this.fishH;

    // 작업대 (도마 배경) — **회전과 무관하게 가로 고정** (생선만 돈다)
    const BX = this.boardX, BY = this.boardY, BW = this.boardW, BH = this.boardH;
    g.fillStyle(0x8a6a44, 1);
    g.fillRoundedRect(BX - 16, BY - 26, BW + 32, BH + 52, 10);
    g.fillStyle(0xa8845a, 1);
    g.fillRoundedRect(BX - 6, BY - 16, BW + 12, BH + 32, 8);

    // 도마 픽셀 생선 — 어종별 스프라이트 세트(방어류=잿방어 형태 / 그 외=감성돔 가이드 형태).
    // orientation은 화면 표시 방향(renderedOrientation) — 뒤집기 연출 중간(접힌 시점)에
    // 새 방향으로 교체된다 (process.orientation은 로직/게이트 기준).
    // 방어류·돔류(가이드 원본군)는 스프라이트 실색 그대로(무틴트), 그 외 어종은 어종 색 약한 틴트.
    const speciesId = this.process.profile.speciesId;
    const sprites = butcherSpritesFor(speciesId);
    const tint = (SASHIMI_GUIDE_GROUP[speciesId] || sprites.nativeColor) ? null : getFishColors(speciesId).body;
    // 몸통 상태는 **완료 스테이지 집합에서 파생** — 자유 순서에서도 화면과 실제 진행이 어긋나지
    // 않는다 (구 구현은 this.headOff/this.gutted 플래그라 순서에 따라 불일치 가능).
    const headOff = this.doneStages.has('head_flip') || this.doneStages.has('flat_head_scut') || this.headOff;
    const finsOff = this.doneStages.has('finectomy');
    // 넙치류는 내장이 머리와 함께 나간다(84차 — 내장 스테이지 없음) — flat은 headOff가 대변
    const gutted = this.doneStages.has('gut_scoop');
    // 90° 회전 = **생선만** 회전 (도마는 가로 고정) — 스프라이트는 가로 기준 geom으로
    // 그린 뒤 캔버스 변환으로 회전한다. (유도선 toPanelPx의 rotNorm과 수학적으로 동일한
    // 변환이라 좌표가 정확히 일치한다.)
    const rot = this.process.rotation;
    const W0 = ButcheryPanel.FISH_W0, H0 = ButcheryPanel.FISH_H0;
    const geom = rot === 0 ? { x: X, y: Y, w: W, h: H } : { x: -W0 / 2, y: -H0 / 2, w: W0, h: H0 };
    if (rot !== 0) {
      g.save();
      g.translateCanvas(this.boardCx, this.boardCy);
      g.rotateCanvas((rot * Math.PI) / 180);
      const s = this.rotated ? ButcheryPanel.ROT_SCALE : 1;
      g.scaleCanvas(s, s);
    }
    drawPixelButcherFish(g, geom, tint, {
      orientation: this.renderedOrientation,
      headOff,
      // 머리 삭제 영역 = **실제 머리 절단선**을 따라간다 (F9로 선을 옮기면 잘린 모양도 따라옴)
      headCutPath: this.headCutPathForFrame(geom, sprites),
      finsOff,
      scaledSides: this.scaledSides,
      gutted,
      hasScales: this.process.profile.hasScales,
      finished: this.process.finished,
      currentPullsLeft: this.process.currentPullsLeft,
      anusRatio: this.process.profile.anusRatio,
      stageId: this.process.stage?.id,
      // 장뜨기 길내기 진행 (완료 스트로크 수) — 단계 스프라이트/폴백 절개선 선택
      strokesDone: this.process.stage?.cut?.strokesRequired
        ? this.process.stage.cut.strokesRequired - this.process.currentStrokesLeft
        : 0,
      // 2면은 여러 스테이지로 나뉘어 있어 완료 스테이지 수로 벌어짐을 누적한다.
      //  ⚠ 연결부 끊기(ribcut)까지 포함해야 **완료 직후 전환에서 덜 벌어진 그림으로 되돌아가지 않는다**
      //    (사용자 리포트 2026-07-31 — 순간적으로 살짝 열린 이미지가 보이던 문제).
      spineOpen: (this.doneStages.has('fillet_1_score') ? 1 : 0)
        + (this.doneStages.has('fillet_1_score2') ? 1 : 0)
        + (this.doneStages.has('fillet_1_ribcut') ? 1 : 0),
      bellyOpen: (this.doneStages.has('fillet_1_sever') ? 2 : 0)
        + (this.doneStages.has('fillet_1_bellyribcut') ? 1 : 0),
      // 박피 — 당기기 진행(껍질이 늘어나는 정도) + 꼬리 손잡이 완료 여부
      peelProgress: this.process.stage?.id === 'peel_pull'
        ? Math.min(1, this.process.currentFill / (this.process.stage.fillTarget ?? 0.9)) : 0,
      peelGripDone: this.doneStages.has('peel_grip'),
      peelSawPhase: this.peelSawPhase,
      // 칼질 성공 연출 중에만 — 스테이지가 넘어가도 마지막 벌어짐을 유지
      openOverride: this.filletOpen ?? undefined,
      // 넙치류 — 현재 표시 면의 다섯장뜨기 진행 상태
      flatSide: this.process.profile.bodyShape === 'flat'
        ? this.buildFlatSideState() : undefined,
      // 엔가와 분리 슬랩 — 현재 필렛의 반쪽 종류 (upper=내장 없음 / under=내장쪽)
      flatFilletKind: this.flatFilletKind(),
    }, sprites);
    if (rot !== 0) g.restore();
  }

  /**
   * 넙치류 엔가와 분리 — 현재 작업 중인 반쪽 필렛 종류 (2026-08-07 사용자 지시).
   * 통짜 세션 = 지급 순서 매핑(배·위(1)·등·아래(4) = 내장쪽 under / 2·3 = upper).
   * 재장착(1장) 세션 = 원물 아이콘 텍스처가 반쪽을 안다 (85차 upper/under 아이콘).
   * 구세이브 합체 아이콘(_1/_2) = 반쪽 불명 → undefined (순수 필렛 슬랩 폴백).
   */
  private flatFilletKind(): 'upper' | 'under' | undefined {
    if (this.process.profile.bodyShape !== 'flat') return undefined;
    const sid = this.process.stage?.id;
    if (!sid?.startsWith('engawa_')) return undefined;
    if (this.resumed && this.source.id.startsWith('inv_filletengw_')) {
      const t = this.source.iconTexture ?? '';
      if (t.endsWith('_under')) return 'under';
      if (t.endsWith('_upper')) return 'upper';
      return undefined;
    }
    const n = Number(sid.slice('engawa_'.length));
    return n === 1 || n === 4 ? 'under' : 'upper';
  }

  /**
   * 넙치류 — 표시 면(BASE = 등 / FLIP = 배)의 다섯장뜨기 진행 상태를 doneStages에서 파생.
   * 반대쪽 면의 포는 위에서 보이지 않으므로 면별 독립 (물리적으로 정확).
   * 벌어짐 깊이 = 완료 스테이지 기준(확정) + 칼 팔로우 라이브 엔벌로프(진행 구간만).
   */
  private buildFlatSideState(): import('./PixelButcherFish.js').FlatSideState {
    const belly = this.renderedOrientation === 'FLIP';
    const side: 'belly' | 'back' = belly ? 'belly' : 'back';
    const p = `flat_${side}`;
    const has = (id: string): boolean => this.doneStages.has(id);
    // 칼 팔로우 라이브 엔벌로프 — 현재 면의 스테이지가 진행 중일 때만
    const kf = this.knifeFx;
    let live: import('./PixelButcherFish.js').FlatSideState['live'];
    if (kf && kf.stageId.startsWith(p) && kf.travel > 1) {
      live = {
        half: kf.half, fromDepth: kf.fromDepth, toDepth: kf.toDepth,
        xFrom: kf.path[0].x, xKnife: this.knifeLocalX(),
      };
    }
    return {
      center: has(`${p}_center`),
      upDepth: this.flatHalfDepth(side, 'up'),
      dnDepth: this.flatHalfDepth(side, 'dn'),
      upTaken: has(`${p}_up_sep2`),
      dnTaken: has(`${p}_dn_sep2`),
      live,
      scaled: has(belly ? 'scale_flip' : 'scale_base') || !this.process.profile.hasScales,
    };
  }

  /**
   * 현재 표시 방향의 머리 절단선을 **그려진 생선 rect 정규화 좌표**로 변환.
   * 유도선은 도마 rect(toPanelPx) 기준이고 삭제 판정은 생선 rect 기준이라 한 번 환산한다.
   */
  private headCutPathForFrame(geom: { x: number; y: number; w: number; h: number },
    sprites: ReturnType<typeof butcherSpritesFor>): { x: number; y: number }[] | undefined {
    // 넙치류 = S자 절단선 하나 (양면 공통 — 뒤집어도 머리 왼쪽·미러 없음)
    const id = this.process.profile.bodyShape === 'flat'
      ? 'flat_head_scut'
      : this.renderedOrientation === 'FLIP' ? 'head_flip' : 'head_base';
    const path = this.process.stageList.find((s) => s.id === id)?.cut?.guidePath;
    if (!path?.length) return undefined;
    const f = computeFishFrame(sprites.whole, geom);
    return path.map((p) => ({
      x: (geom.x + p.x * geom.w - f.ox) / f.dw,
      y: (geom.y + p.y * geom.h - f.oy) / f.dh,
    }));
  }

  /**
   * 스테이지 유도선 — **원물 위 절단 유도선 (항상 표시)**. 가이드 토글과 무관하게 상시 렌더
   * (사용자 지시 2026-07-30: 가이드는 켜고 끌 수 있어도 유도선 표시만은 유지).
   * 칼 모양은 그리지 않고 점선 경로 + 시작(초록 링)/끝(붉은 사각) 마커 + 진행 방향 화살촉만
   * 그린다(48차 "원물 위 칼 모양 금지" 준수). 가이드 켜짐일 때의 팝업 일러스트·외곽 화살표
   * 큐는 startGuideAnim/drawGuideCutPopup이 별도로 담당한다(guideOff로 토글).
   */
  private drawGuide(): void {
    this.guideG.clear();
    if (this.done || this.process.finished) return;
    // ① 작업 미선택(awaitingSelect) / 부산물 팝업 중 = **아직 과제를 지급하지 않은 상태** —
    //    유도선을 그리면 "고르기 전에 과제가 이미 떠 있는" 문제가 된다 (사용자 지적 2026-07-30).
    if (this.awaitingSelect || this.byproductPopup) return;
    const stage = this.process.stage;
    if (!stage) return;
    // ② 방향 불일치 = 유도선 좌표가 **다른 면 기준**이라 화면에 엉뚱한 위치로 찍힌다
    //    (예: head_flip(뒷면 x0.83)을 BASE 화면에 그리면 꼬리에 사선이 생김 — 실제 버그였음).
    //    선을 숨기고 도마 중앙에 뒤집기 안내를 띄운다.
    if (this.process.orientation !== this.renderedOrientation
      || this.process.orientation !== stage.orientation
      || !this.process.rotationOk()) {
      if (!this.editMode) this.drawFlipNeededHint(stage);
      return;
    }
    const g = this.guideG;
    if (stage.primitive === 'guided_cut' && stage.cut) {
      const multi = stage.cut.guidePaths;
      if (multi?.length) {
        // 다중 유도선 (지느러미 등·뒷·가슴) — 완료선은 흐리게, 미완료선만 또렷하게.
        // dev 편집 중에는 **편집 대상 선만** 또렷하게(나머지는 흐리게) 해 작업 대상을 구분.
        const done = this.process.donePathIndices;
        multi.forEach((path, i) => {
          const faint = this.editMode ? i !== this.editLineIdx : done.has(i);
          this.strokeGuideLine(g, path, faint);
        });
      } else {
        this.strokeGuideLine(g, stage.cut.guidePath);
      }
    } else if (stage.primitive === 'tap' && stage.tapPoint) {
      // 시메 — 목표점 링(탭 좌표 = 게임플레이)
      const [tx, ty] = this.toPanelPx(stage.tapPoint);
      g.lineStyle(2, 0xff5a4a, 0.9);
      g.strokeCircle(tx, ty, 9);
      g.fillStyle(0xff5a4a, 0.85);
      g.fillCircle(tx, ty, 3);
    } else if (stage.primitive === 'drag_fill' || stage.primitive === 'scoop' || stage.primitive === 'peel') {
      // 문지르기(꼬리→머리 좌향) / 박피(꼬리 손잡이→머리 당김) — 합성 스윕선 (편집 가능)
      this.strokeGuideLine(g, this.sweepPathFor(stage));
    }
    // wash — 버튼 인터페이스라 유도선 없음
  }

  /**
   * 뒤집기 필요 안내 — 유도선 좌표가 현재 화면 방향과 다를 때 도마 위에 크게 표시.
   * (자동 뒤집기 폐지 후 "왜 아무것도 안 되지" 먹통 체감을 막는 장치)
   */
  private drawFlipNeededHint(stage: ButcheryStage): void {
    // 회전 어긋남이 우선 — 뒤집기로는 도달할 수 없는 자세라 먼저 안내한다
    const need = !this.process.rotationOk()
      ? `[90° 회전] 필요 — R (반대: Shift+R)`
      : this.flipHintFor(this.process.orientation, stage.orientation);
    const g = this.guideG;
    const cx = this.fishX + this.fishW / 2, cy = this.fishY + this.fishH / 2;
    g.fillStyle(0x0a1420, 0.8);
    g.fillRoundedRect(cx - 186, cy - 28, 372, 56, 8);
    g.lineStyle(2, 0xffd257, 0.95);
    g.strokeRoundedRect(cx - 186, cy - 28, 372, 56, 8);
    const want = stage.rotationRequired ?? 0;
    const sub = this.process.rotationOk()
      ? `${this.orientLabel(stage.orientation)} 상태에서 손질합니다`
      : `${ROTATION_LABEL[want]} 배치에서 손질합니다`;
    const t = this.scene.add.text(cx, cy, `${need}\n${sub}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffd257',
      fontStyle: 'bold', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5);
    this.uiC.add(t);
  }

  /** 현재 방향 → 목표 방향에 필요한 뒤집기 안내 문구 (좌우 F / 상하 V / 둘 다) */
  private flipHintFor(cur: ButcheryOrientation, want: ButcheryOrientation): string {
    const LR: Partial<Record<OrientationState, OrientationState>> = {
      BASE: 'FLIP', FLIP: 'BASE', BELLY_UP: 'BACK_DOWN', BACK_DOWN: 'BELLY_UP',
    };
    const UD: Partial<Record<OrientationState, OrientationState>> = {
      BASE: 'BELLY_UP', BELLY_UP: 'BASE', FLIP: 'BACK_DOWN', BACK_DOWN: 'FLIP',
    };
    if (LR[asFishOri(cur)] === want) return '[좌우 뒤집기] 필요 — F 또는 버튼';
    if (UD[asFishOri(cur)] === want) return '[상하 뒤집기] 필요 — V 또는 버튼';
    if (want === 'FLESH_UP') return '필렛 뷰 전환 필요';
    return '[좌우(F)] + [상하(V)] 뒤집기 필요';
  }

  /** 점선 세그먼트 (lineStyle은 호출측이 설정) */
  private dashSeg(g: Phaser.GameObjects.Graphics, ax: number, ay: number, bx: number, by: number, dash = 6, gap = 4): void {
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return;
    const ux = dx / len, uy = dy / len;
    for (let d = 0; d < len; d += dash + gap) {
      const e = Math.min(len, d + dash);
      g.lineBetween(ax + ux * d, ay + uy * d, ax + ux * e, ay + uy * e);
    }
  }

  /** 진행 방향 화살촉 (칼 모양 아님 — 삼각 헤드만) */
  private drawArrowHead(g: Phaser.GameObjects.Graphics, x: number, y: number, ang: number, color: number): void {
    const c = Math.cos(ang), s = Math.sin(ang);
    const P = (dx: number, dy: number): [number, number] => [x + dx * c - dy * s, y + dx * s + dy * c];
    const [tx, ty] = P(6.5, 0);
    const [l1, l2] = P(-4.5, -4.5);
    const [r1, r2] = P(-4.5, 4.5);
    g.fillStyle(color, 0.95);
    g.fillTriangle(tx, ty, l1, l2, r1, r2);
  }

  /** 절단 유도선 — 점선 경로 + 시작(초록 링)/끝(붉은 사각) 마커 + 방향 화살촉 */
  private strokeGuideLine(g: Phaser.GameObjects.Graphics, path: CutPoint[], done = false): void {
    const pts = path.map((p) => this.toPanelPx(p));
    if (pts.length < 2) return;
    if (done) {
      // 이미 그은 선 (다중 유도선) — 흐린 실선 + 체크 마커만
      g.lineStyle(1.6, 0x4af2a1, 0.35);
      for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      g.fillStyle(0x4af2a1, 0.5);
      g.fillCircle(pts[0][0], pts[0][1], 3);
      return;
    }
    g.lineStyle(2, 0xffd257, 0.92);
    for (let i = 1; i < pts.length; i++) this.dashSeg(g, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    // 시작 마커 (초록 링)
    g.lineStyle(2, 0x2ecc71, 0.95);
    g.strokeCircle(pts[0][0], pts[0][1], 4.5);
    // 끝 마커 (붉은 사각)
    const [ex, ey] = pts[pts.length - 1];
    g.fillStyle(0xff3b30, 0.95);
    g.fillRect(ex - 2.6, ey - 2.6, 5.2, 5.2);
    // 진행 방향 화살촉 (경로 80% 지점)
    const a = this.pathPointAt(path, 0.8);
    this.drawArrowHead(g, a.x, a.y, a.ang, 0xffb43a);
  }

  // ═══════════════════════════════════════════════════
  // 가이드선 편집 (dev 전용, F9) — 유도선 끝점을 드래그해 위치 조정 + 좌표 복사
  //  guided_cut → stage.cut.guidePath(core 데이터) / tap → stage.tapPoint /
  //  비늘·내장·박피 → sweepOverride(합성선). 드래그로 맞춘 뒤 [복사]로 코드 스니펫을
  //  클립보드에 담아 ButcheryProcess.ts(cut/tapPoint) / drawGuide(스윕)에 붙여넣는다.
  // ═══════════════════════════════════════════════════
  /**
   * 스윕선(비늘/내장/박피)의 편집 가능 경로.
   * **core 스테이지 데이터(`stage.sweepPath`)가 1차 소스** — 있으면 그 배열을 그대로 참조해
   * dev 편집(F9)이 제자리 수정되고 [복사] 스니펫이 실좌표와 일치한다. 없으면 기본 직선.
   */
  private sweepPathFor(stage: ButcheryStage): CutPoint[] {
    let p = this.sweepOverride.get(stage.id);
    if (!p) {
      p = stage.sweepPath
        ?? (stage.primitive === 'peel' ? [{ x: 0.9, y: 0.5 }, { x: 0.14, y: 0.5 }]
          : stage.primitive === 'scoop' ? [{ x: 0.85, y: 0.55 }, { x: 0.28, y: 0.55 }]
            : [{ x: 0.85, y: 0.5 }, { x: 0.28, y: 0.5 }]);   // drag_fill
      this.sweepOverride.set(stage.id, p);
    }
    return p;
  }

  // ── 스윕 커버리지 게이지 (drag_fill·scoop) ──────────────────
  //  게이지 = **지정된 스윕 경로를 얼마나 훑었는지**(구현 전: 누적 이동거리 × 계수라
  //  제자리에서 흔들어도 찼다). 경로를 SWEEP_SAMPLES등분해 커서 반경 안에 든 샘플을
  //  체크 → 진행률 = 체크수/전체. 전 구간을 훑어야 100%(fillTarget 0.92) — 사용자 지시
  //  "지정한 스윕을 전부 충족할 때를 100% 기준" (2026-07-30).
  private static readonly SWEEP_SAMPLES = 44;
  /** 커서 반경(정규 좌표) — 이 안의 샘플이 훑힌 것으로 인정 */
  private static readonly SWEEP_BRUSH = 0.06;

  /** 현재 스테이지의 스윕 샘플/체크 배열 확보 (스테이지 전환 시 리셋) */
  private sweepSamplesFor(stage: ButcheryStage): { pts: CutPoint[]; hit: boolean[] } {
    if (this.sweepCoverStage !== stage.id || !this.sweepCover) {
      const path = this.sweepPathFor(stage);
      const n = ButcheryPanel.SWEEP_SAMPLES;
      const pts: CutPoint[] = [];
      // 호길이 균등 샘플 (pathPointAt은 패널 픽셀 반환이라 정규 좌표로 별도 보간)
      const segs: number[] = [];
      let total = 0;
      for (let i = 1; i < path.length; i++) {
        const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
        segs.push(d); total += d;
      }
      for (let k = 0; k < n; k++) {
        let target = total * (k / (n - 1));
        let i = 0;
        while (i < segs.length && target > segs[i]) { target -= segs[i]; i++; }
        if (i >= segs.length) { pts.push(path[path.length - 1]); continue; }
        const t = segs[i] > 0 ? target / segs[i] : 0;
        pts.push({
          x: path[i].x + (path[i + 1].x - path[i].x) * t,
          y: path[i].y + (path[i + 1].y - path[i].y) * t,
        });
      }
      this.sweepCoverStage = stage.id;
      this.sweepCover = { pts, hit: pts.map(() => false) };
    }
    return this.sweepCover;
  }

  /** 커서 위치로 새로 훑은 샘플 비율(0~1) — submitFill 델타 */
  private sweepCoverDelta(stage: ButcheryStage, n: CutPoint): number {
    const { pts, hit } = this.sweepSamplesFor(stage);
    const r = ButcheryPanel.SWEEP_BRUSH;
    let added = 0;
    for (let i = 0; i < pts.length; i++) {
      if (hit[i]) continue;
      if (Math.hypot(pts[i].x - n.x, pts[i].y - n.y) <= r) { hit[i] = true; added++; }
    }
    return added / pts.length;
  }

  /**
   * 비늘/부스러기 튐 — **마우스가 지나가는 위치마다** 즉시 튀는 파티클
   * (사용자 지시: "게이지를 채우면서 비늘을 치는 동작 시, 마우스가 호버링 되는 위치마다
   * 비늘이 튀는 연출"). 진행 방향 앞쪽으로 부채꼴 분사 후 낙하·소멸.
   */
  private spawnScaleBurst(
    px: number, py: number, ang: number, count = 4, kind: 'scale' | 'gut' = 'scale',
  ): void {
    if (!this.scene) return;
    const cols = kind === 'gut' ? [0x8a3040, 0x5a1218] : [0xeaf6ff, 0xc3dced];
    for (let k = 0; k < count; k++) {
      const spread = (Math.random() - 0.5) * 1.3;
      const dist = 14 + Math.random() * 26;
      const size = 2 + Math.round(Math.random() * 2);
      const flake = this.scene.add.rectangle(px, py, size, size,
        cols[k % 2], 0.95);
      flake.setScrollFactor(0);
      this.add(flake);
      this.flakes.add(flake);
      this.scene.tweens.add({
        targets: flake,
        x: px + Math.cos(ang + spread) * dist,
        y: py + Math.sin(ang + spread) * dist + 10 + Math.random() * 14,
        alpha: 0,
        angle: (Math.random() - 0.5) * 220,
        duration: 260 + Math.random() * 220,
        ease: 'Quad.easeOut',
        onComplete: () => { this.flakes.delete(flake); flake.destroy(); },
      });
    }
  }

  private clearFlakes(): void {
    this.flakes.forEach((f) => { this.scene?.tweens.killTweensOf(f); f.destroy(); });
    this.flakes.clear();
  }

  /**
   * 편집 대상 선 목록 — guided_cut은 다중 유도선(guidePaths)을 지원한다.
   * 없으면 guidePath 단일 선을 1개짜리 목록으로 승격해 편집 경로를 통일한다.
   */
  private editableLines(): CutPoint[][] | null {
    const stage = this.process.stage;
    if (!stage || stage.primitive !== 'guided_cut' || !stage.cut) return null;
    if (!stage.cut.guidePaths) stage.cut.guidePaths = [stage.cut.guidePath];
    return stage.cut.guidePaths;
  }

  /** 현재 스테이지의 편집 대상 점들(가변 참조) — wash는 없음 */
  private editablePoints(): CutPoint[] | null {
    const stage = this.process.stage;
    if (!stage) return null;
    if (stage.primitive === 'guided_cut' && stage.cut) {
      const lines = this.editableLines();
      if (lines?.length) {
        this.editLineIdx = Math.min(this.editLineIdx, lines.length - 1);
        return lines[this.editLineIdx];
      }
      return stage.cut.guidePath;
    }
    if (stage.primitive === 'tap') {
      if (!stage.tapPoint) stage.tapPoint = { x: 0.16, y: 0.38 };
      return [stage.tapPoint];
    }
    if (stage.primitive === 'drag_fill' || stage.primitive === 'scoop' || stage.primitive === 'peel') {
      return this.sweepPathFor(stage);
    }
    return null;   // wash — 편집 없음
  }

  /** dev — 가이드 편집 모드 토글 (F9 / 버튼) */
  private toggleEditMode(): void {
    if (!import.meta.env.DEV) return;
    this.editMode = !this.editMode;
    this.editDragIdx = -1;
    this.editDraw = false;
    this.editDrawPts = [];
    this.editLogScroll = 0;
    if (this.editMode) this.devExpand = false;   // 좌표 편집 박스와 자리 충돌 (둘 다 도마 아래)
    this.flash(this.editMode
      ? '가이드 편집 ON — 핸들 드래그 / [곡선 그리기]로 자유곡선 / 우클릭 = 점 삭제'
      : '가이드 편집 OFF', true);
    this.refresh();
  }

  // ── 곡선 편집 수학 (정규화 좌표계 — 생선 bbox 0~1) ──────────
  /** 폴리라인 호길이 균등 리샘플 (n점, 시작·끝 보존) */
  private resampleNorm(path: CutPoint[], n: number): CutPoint[] {
    if (path.length < 2 || n < 2) return path.slice();
    const seg: number[] = [];
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      const l = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
      seg.push(l); total += l;
    }
    if (total <= 1e-6) return [path[0], path[path.length - 1]];
    const out: CutPoint[] = [];
    for (let k = 0; k < n; k++) {
      let target = (k / (n - 1)) * total;
      let i = 0;
      while (i < seg.length && target > seg[i]) { target -= seg[i]; i++; }
      if (i >= seg.length) { out.push({ ...path[path.length - 1] }); continue; }
      const t = seg[i] > 1e-9 ? target / seg[i] : 0;
      out.push({
        x: path[i].x + (path[i + 1].x - path[i].x) * t,
        y: path[i].y + (path[i + 1].y - path[i].y) * t,
      });
    }
    return out;
  }

  /** Chaikin 스무딩 1회 (끝점 고정 — 모서리를 둥글게) */
  private smoothNorm(path: CutPoint[]): CutPoint[] {
    if (path.length < 3) return path.slice();
    const out: CutPoint[] = [{ ...path[0] }];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    out.push({ ...path[path.length - 1] });
    return out;
  }

  /**
   * 편집 대상 배열을 **제자리 교체** (splice) — stage.cut.guidePath / sweepOverride 배열은
   * 가변 참조라 배열 자체를 바꾸면 렌더·판정이 옛 배열을 계속 본다.
   */
  private replaceEditPath(next: CutPoint[]): void {
    const pts = this.editablePoints();
    if (!pts || next.length < 2) return;
    pts.splice(0, pts.length, ...next.map((p) => ({
      x: Phaser.Math.Clamp(p.x, 0, 1), y: Phaser.Math.Clamp(p.y, 0, 1),
    })));
  }

  /** [+ 점] — 각 세그먼트 중점을 삽입해 세분화 (직선 → 곡선으로 다듬을 준비) */
  private editSubdivide(): void {
    const pts = this.editablePoints();
    if (!pts || pts.length < 2) { this.flash('이 단계는 점 추가 대상이 아닙니다', false); return; }
    if (pts.length >= 15) { this.flash('점이 너무 많습니다 (최대 15)', false); return; }
    const next: CutPoint[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      next.push({ ...pts[i] });
      next.push({ x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 });
    }
    next.push({ ...pts[pts.length - 1] });
    this.replaceEditPath(next);
    this.flash(`점 ${next.length}개 — 중간 핸들을 끌어 곡선을 만드세요`, true);
    this.refresh();
  }

  /** [스무딩] — Chaikin 1회 후 같은 점 수로 리샘플 (형태 유지·모서리 완화) */
  private editSmooth(): void {
    const pts = this.editablePoints();
    if (!pts || pts.length < 3) { this.flash('점 3개 이상에서 스무딩 가능 ([+ 점] 먼저)', false); return; }
    const n = pts.length;
    this.replaceEditPath(this.resampleNorm(this.smoothNorm(pts), n));
    this.flash('곡선 스무딩 적용', true);
    this.refresh();
  }

  /** 핸들 우클릭 삭제 (2점 미만으로는 줄이지 않음) */
  private editDeletePoint(idx: number): void {
    const pts = this.editablePoints();
    if (!pts) return;
    if (pts.length <= 2) { this.flash('점은 최소 2개 필요합니다', false); return; }
    if (idx < 0 || idx >= pts.length) return;
    const next = pts.filter((_, i) => i !== idx);
    this.replaceEditPath(next);
    this.editDragIdx = -1;
    this.flash(`점 삭제 — 남은 점 ${next.length}개`, true);
    this.refresh();
  }

  // ── 다중 유도선 편집 (지느러미 등·뒷·가슴처럼 한 스테이지에 선이 여러 개) ──
  /** [+ 선] — 새 유도선 추가 (현재 선을 아래로 오프셋 복제 → 바로 편집 대상으로 전환) */
  private editAddLine(): void {
    const lines = this.editableLines();
    if (!lines) { this.flash('이 단계는 다중 유도선 대상이 아닙니다 (칼질 단계만)', false); return; }
    if (lines.length >= 6) { this.flash('유도선은 최대 6개입니다', false); return; }
    const src = lines[this.editLineIdx] ?? lines[0];
    lines.push(src.map((p) => ({
      x: Phaser.Math.Clamp(p.x, 0, 1),
      y: Phaser.Math.Clamp(p.y + 0.18, 0, 1),   // 겹치지 않게 아래로 살짝 내려 복제
    })));
    this.editLineIdx = lines.length - 1;
    this.flash(`유도선 ${lines.length}개 — 선 ${this.editLineIdx + 1} 편집 중 (드래그/곡선 그리기로 조정)`, true);
    this.refresh();
  }

  /** [선 삭제] — 현재 선 제거 (마지막 1개는 유지) */
  private editRemoveLine(): void {
    const lines = this.editableLines();
    if (!lines) return;
    if (lines.length <= 1) { this.flash('유도선은 최소 1개 필요합니다', false); return; }
    lines.splice(this.editLineIdx, 1);
    this.editLineIdx = Math.max(0, Math.min(this.editLineIdx, lines.length - 1));
    // guidePath(단일 선 소비 경로)도 첫 선으로 동기화
    const stage = this.process.stage;
    if (stage?.cut) stage.cut.guidePath = lines[0];
    this.flash(`선 삭제 — 남은 유도선 ${lines.length}개`, true);
    this.refresh();
  }

  /** [◀ 선 ▶] — 편집 대상 선 전환 */
  private editCycleLine(dir: -1 | 1): void {
    const lines = this.editableLines();
    if (!lines || lines.length < 2) return;
    this.editLineIdx = (this.editLineIdx + dir + lines.length) % lines.length;
    this.editLogScroll = 0;      // 다른 선 = 다른 로그 — 맨 위부터
    this.flash(`선 ${this.editLineIdx + 1} / ${lines.length} 편집 중`, true);
    this.refresh();
  }

  /** [곡선 그리기] 토글 — ON이면 도마 드래그가 자유곡선 캡처가 된다 */
  private toggleEditDraw(): void {
    const pts = this.editablePoints();
    if (!pts || pts.length < 2) { this.flash('이 단계는 곡선 편집 대상이 아닙니다 (탭/세척)', false); return; }
    this.editDraw = !this.editDraw;
    this.editDrawPts = [];
    this.editDrawG?.clear();
    this.flash(this.editDraw
      ? `곡선 그리기 ON — 시작점에서 끝점까지 드래그 (${this.editCurveN}점으로 자동 리샘플)`
      : '곡선 그리기 OFF — 핸들 드래그 모드', true);
    this.refresh();
  }

  /** 곡선 캡처 미리보기 (드래그 중 — 경량 렌더) */
  private paintEditDraw(): void {
    if (!this.editDrawG) return;
    const g = this.editDrawG;
    g.clear();
    if (this.editDrawPts.length < 2) return;
    g.lineStyle(2.4, 0x00e0ff, 0.9);
    for (let i = 1; i < this.editDrawPts.length; i++) {
      const a = this.toPanelPx(this.editDrawPts[i - 1]);
      const b = this.toPanelPx(this.editDrawPts[i]);
      g.lineBetween(a[0], a[1], b[0], b[1]);
    }
  }

  /** 곡선 캡처 커밋 — 스무딩 → N점 균등 리샘플 → 경로 제자리 교체 */
  private commitEditDraw(): void {
    const raw = this.editDrawPts;
    this.editDrawPts = [];
    this.editDrawG?.clear();
    if (raw.length < 2) return;
    // 총 길이가 너무 짧으면 오조작으로 보고 무시 (클릭 튐 방지)
    let len = 0;
    for (let i = 1; i < raw.length; i++) len += Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);
    if (len < 0.08) { this.flash('너무 짧습니다 — 시작점에서 끝점까지 길게 드래그하세요', false); return; }
    const curve = this.resampleNorm(this.smoothNorm(this.smoothNorm(raw)), this.editCurveN);
    this.replaceEditPath(curve);
    this.flash(`곡선 적용 — ${curve.length}점 (핸들로 미세조정 후 [복사])`, true);
    this.refresh();
  }

  /**
   * 편집 오버레이 — 핸들 + 좌표 리드아웃 + 툴 버튼 4종.
   * 박스는 **도마 아래**에 둔다 (도마 위는 가이드 컷 팝업/작업 선택 목록 자리라 겹침 방지).
   */
  private drawGuideEditor(): void {
    const pts = this.editablePoints();
    const stage = this.process.stage;
    if (!pts || !stage) return;
    this.editHandles = pts.map((pt) => {
      const [sx, sy] = this.toPanelPx(pt);   // 회전 변환 경유 — 90° 배치에서도 핸들이 선 위에 얹힌다
      return { pt, sx, sy };
    });
    this.editHandleG = this.scene.add.graphics();
    this.uiC.add(this.editHandleG);
    this.paintEditHandles();

    // ── 마더 HUD (좌표 로그 + 툴 버튼) — 도마 아래 상태 텍스트와 dev 항법 버튼 **사이**를 꽉 채운다 ──
    //  구 레이아웃은 고정 높이 64라 긴 좌표 로그가 박스 밖으로 흘러 버튼·하단 UI를 침범했다.
    const bw = this.boardW;
    const bx = this.boardX, by = this.boardY + this.boardH + 84;   // 고정 도마 rect — 상태줄(466) 아래
    const bh = (PANEL_H - 36) - by;          // dev 항법 버튼(PANEL_H-30) 바로 위까지
    const box = this.scene.add.graphics();
    box.fillStyle(0x0a1420, 0.94); box.fillRoundedRect(bx, by, bw, bh, 5);
    box.lineStyle(1.2, this.editDraw ? 0x00e0ff : 0x00c8e0, 0.9); box.strokeRoundedRect(bx, by, bw, bh, 5);
    this.uiC.add(box);

    // 좌표 로그 — 넘치면 잘라 보여주고 우측(버튼 앞)에 세로 스크롤바
    this.editLogRect = { x: bx + 8, y: by + 6, w: 322, h: bh - 30 };
    this.editReadout = this.scene.add.text(this.editLogRect.x, this.editLogRect.y, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#bfe8ff', lineSpacing: 2,
    });
    this.uiC.add(this.editReadout);
    this.editLogBarG = this.scene.add.graphics();
    this.uiC.add(this.editLogBarG);
    this.refreshEditReadout(stage, pts);

    // 툴 버튼 3×2 — [곡선 그리기] [+ 점] [+ 선] / [스무딩] [복사] [선 삭제]
    const mkBtn = (
      col: number, row: number, label: string, on: boolean, act: () => void, dim = false,
    ): void => {
      const w = 66, h = 26;
      const x = bx + 348 + col * 70, y = by + 6 + row * 30;
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x14505e : dim ? 0x18242e : 0x1a3a4a, 0.98); g.fillRoundedRect(x, y, w, h, 4);
      g.lineStyle(1.2, on ? 0x00e0ff : dim ? 0x39505e : 0x33d0e8, 1); g.strokeRoundedRect(x, y, w, h, 4);
      const t = this.scene.add.text(x + w / 2, y + h / 2, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px',
        color: on ? '#ffffff' : dim ? '#6f8595' : '#aef0ff', fontStyle: 'bold',
      }).setOrigin(0.5);
      if (t.width > w - 6) t.setScale((w - 6) / t.width);
      const hit = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', act);
      this.uiC.add([g, t, hit]);
    };
    const lines = this.editableLines();
    const nLines = lines?.length ?? 0;
    mkBtn(0, 0, this.editDraw ? '곡선 ON' : '곡선 그리기', this.editDraw, () => this.toggleEditDraw());
    mkBtn(1, 0, `+ 점 (${pts.length})`, false, () => this.editSubdivide());
    mkBtn(2, 0, '+ 선', false, () => this.editAddLine(), !lines);
    mkBtn(0, 1, '스무딩', false, () => this.editSmooth());
    mkBtn(1, 1, '복사', false, () => this.copyEditPath(stage, this.editHandles.map((e) => e.pt)));
    mkBtn(2, 1, '선 삭제', false, () => this.editRemoveLine(), nLines <= 1);

    // 다중 유도선 선택기 (선이 2개 이상일 때 — ◀ 선 n/N ▶).
    //  ⚠ 툴 버튼 2행(by+6 ~ by+62) **아래**에 배치 — 구 위치(by+bh-20)는 버튼과 겹쳤다.
    if (nLines >= 2) {
      const selY = by + 78, selX = bx + 348;
      const mkArrow = (ax: number, label: string, dir: -1 | 1): void => {
        const t = this.scene.add.text(ax, selY, label, {
          fontFamily: 'monospace', fontSize: '13px', color: '#aef0ff', fontStyle: 'bold',
        }).setOrigin(0.5);
        const hit = this.scene.add.rectangle(ax, selY, 20, 18, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.editCycleLine(dir));
        this.uiC.add([t, hit]);
      };
      mkArrow(selX + 8, '◀', -1);
      const lbl = this.scene.add.text(selX + 66, selY, `선 ${this.editLineIdx + 1} / ${nLines}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffd257', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.uiC.add(lbl);
      mkArrow(selX + 124, '▶', 1);
    }

    // 조작 힌트 (로그 뷰포트 아래 — 박스 하단)
    const hint = this.scene.add.text(bx + 8, by + bh - 16,
      this.editDraw
        ? '드래그 = 자유곡선 그리기 (놓으면 현재 선에 적용) · 우클릭 = 점 삭제'
        : '핸들 드래그 = 이동 · 우클릭 = 점 삭제 · [+ 선]으로 유도선 추가 (지느러미 3곳 등)', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#6f8ba0',
      });
    this.uiC.add(hint);
  }

  /**
   * 좌표 로그 갱신 — 워드랩된 줄을 **보이는 만큼만** 잘라 표시하고 스크롤바를 그린다.
   * (마스크 대신 윈도우드 렌더 — 박스 밖으로 글자가 흘러 버튼/하단 UI를 침범하지 않는다)
   */
  private refreshEditReadout(stage: ButcheryStage, pts: CutPoint[]): void {
    const r = this.editLogRect;
    if (!this.editReadout || !r) return;
    const full = this.formatEditPath(stage, pts);
    // 워드랩 결과 줄 배열을 얻기 위한 프로브 (표시는 랩 없이 슬라이스로)
    const probe = this.scene.add.text(0, 0, full, {
      fontFamily: 'monospace', fontSize: '10px', wordWrap: { width: r.w }, lineSpacing: 2,
    }).setVisible(false);
    const lines = probe.getWrappedText(full);
    probe.destroy();

    const lineH = 14;
    const visible = Math.max(1, Math.floor(r.h / lineH));
    this.editLogMax = Math.max(0, lines.length - visible);
    this.editLogScroll = Phaser.Math.Clamp(this.editLogScroll, 0, this.editLogMax);
    this.editReadout.setText(lines.slice(this.editLogScroll, this.editLogScroll + visible).join('\n'));

    const g = this.editLogBarG;
    if (!g) return;
    g.clear();
    if (this.editLogMax <= 0) return;
    const barX = r.x + r.w + 6;                  // 로그와 우측 버튼(bx+348) 사이
    g.fillStyle(0x14324a, 0.9); g.fillRoundedRect(barX, r.y, 5, r.h, 2);
    const thumbH = Math.max(20, (r.h * visible) / lines.length);
    const prog = this.editLogScroll / this.editLogMax;
    g.fillStyle(0x33d0e8, 0.95);
    g.fillRoundedRect(barX, r.y + (r.h - thumbH) * prog, 5, thumbH, 2);
  }

  /** 좌표 로그 휠 스크롤 (편집 모드 + 로그 영역 위에서만) */
  private onEditLogWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number): void => {
    if (!this.editMode || this.editLogMax <= 0) return;
    const r = this.editLogRect;
    const stage = this.process.stage;
    if (!r || !stage) return;
    const lx = p.x - this.x, ly = p.y - this.y;
    if (lx < r.x || lx > r.x + r.w + 14 || ly < r.y || ly > r.y + r.h) return;
    const next = Phaser.Math.Clamp(this.editLogScroll + Math.sign(dy), 0, this.editLogMax);
    if (next === this.editLogScroll) return;
    this.editLogScroll = next;
    this.refreshEditReadout(stage, this.editHandles.map((e) => e.pt));
  };

  private paintEditHandles(): void {
    const g = this.editHandleG;
    if (!g) return;
    g.clear();
    // 곡선 그리기 모드에서는 핸들을 작게(참고용) — 드래그는 곡선 캡처가 가져간다
    const rk = this.editDraw ? 0.6 : 1;
    this.editHandles.forEach((h, i) => {
      const single = this.editHandles.length === 1;
      const col = single ? 0xff5a4a : (i === 0 ? 0x2ecc71 : (i === this.editHandles.length - 1 ? 0xff3b30 : 0xffd257));
      g.fillStyle(col, this.editDraw ? 0.5 : 0.92); g.fillCircle(h.sx, h.sy, 7 * rk);
      g.lineStyle(2 * rk, 0x00e0ff, this.editDraw ? 0.5 : 1); g.strokeCircle(h.sx, h.sy, 8.5 * rk);
      // 중간점 번호 (곡선 다듬기 시 어느 점인지 식별)
      if (!single && !this.editDraw && i > 0 && i < this.editHandles.length - 1) {
        g.fillStyle(0x0a1420, 0.85); g.fillCircle(h.sx + 10, h.sy - 10, 6.5);
        g.lineStyle(1, 0xffd257, 0.9); g.strokeCircle(h.sx + 10, h.sy - 10, 6.5);
      }
    });
  }

  private formatEditPath(stage: ButcheryStage, pts: CutPoint[]): string {
    const f = (p: CutPoint): string => `{ x: ${p.x.toFixed(3)}, y: ${p.y.toFixed(3)} }`;
    const arr = (a: CutPoint[]): string => `[${a.map(f).join(', ')}]`;
    if (stage.primitive === 'guided_cut') {
      const lines = stage.cut?.guidePaths;
      // 다중 유도선 — guidePaths 배열 스니펫 (지느러미 3곳 등). 단일이면 기존 형식 유지.
      if (lines && lines.length > 1) {
        return `cut('${stage.id}', '${stage.orientation}', ${arr(lines[0])}, { guidePaths: [\n`
          + lines.map((l, i) => `  /* 선${i + 1} */ ${arr(l)},`).join('\n')
          + '\n] })';
      }
      return `cut('${stage.id}', '${stage.orientation}', ${arr(pts)})`;
    }
    if (stage.primitive === 'tap') return `tapPoint: ${f(pts[0])}`;
    // 스윕 경로 — core 스테이지의 sweepPath 필드에 그대로 붙여넣는 형식
    return `sweepPath: ${arr(pts)}   // ${stage.id} (${stage.primitive})`;
  }

  private copyEditPath(stage: ButcheryStage, pts: CutPoint[]): void {
    const text = this.formatEditPath(stage, pts);
    try {
      void navigator.clipboard?.writeText(text);
      this.flash('좌표 복사됨 (클립보드+콘솔)', true);
    } catch { this.flash('복사 실패 — 콘솔 참고', false); }
    console.log('[ButcheryGuideEdit]', text);
  }

  /** 편집 드래그 중 — 유도선 + 핸들 + 리드아웃만 갱신 (doRefresh 없이 경량) */
  private updateEditDrag(p: Phaser.Input.Pointer): void {
    if (this.editDragIdx < 0 || this.editDragIdx >= this.editHandles.length) return;
    const h = this.editHandles[this.editDragIdx];
    const u = Phaser.Math.Clamp((p.x - this.x - this.fishX) / this.fishW, 0, 1);
    const v = Phaser.Math.Clamp((p.y - this.y - this.fishY) / this.fishH, 0, 1);
    const [nx, ny] = this.unrotNorm(u, v);
    h.pt.x = Phaser.Math.Clamp(nx, 0, 1); h.pt.y = Phaser.Math.Clamp(ny, 0, 1);
    const [hx, hy] = this.toPanelPx(h.pt);
    h.sx = hx; h.sy = hy;
    this.drawGuide();
    this.paintEditHandles();
    const stage = this.process.stage;
    if (stage && this.editReadout) this.refreshEditReadout(stage, this.editHandles.map((e) => e.pt));
  }

  // ═══════════════════════════════════════════════════
  // dev 항법 — 섹션 건너뛰기 / 개별 작업 점프 (좌측 하단, import.meta.env.DEV 전용)
  //  손질은 앞 단계를 해야만 다음으로 넘어가므로, 뒤쪽 단계를 눈으로 확인하려면 매번
  //  처음부터 다 해야 했다. 임의 지점으로 점프하되 **앞 단계는 모두 수행된 것으로 처리**해
  //  픽셀 이미지·달성도가 그 시점 상태로 나오게 한다 (사용자 지시 2026-07-31).
  // ═══════════════════════════════════════════════════

  /** doneStages에서 파생 상태(비늘 면수·머리·체크포인트)를 재동기화 */
  private syncDerivedFromDone(): void {
    this.scaledSides = (this.doneStages.has('scale_base') ? 1 : 0)
      + (this.doneStages.has('scale_flip') ? 1 : 0);
    this.headOff = this.doneStages.has('head_flip') || this.doneStages.has('flat_head_scut');
    const secDone = (id: string): boolean => {
      const sec = this.sections.find((s) => s.id === id);
      return !!sec && sec.tasks.every((t) => t.stageIds.every((sid) => this.doneStages.has(sid)));
    };
    this.checkpoint = (secDone('sec_rib') || secDone('sec_engawa')) ? 'ribs'
      : (secDone('sec_fillet_b') || secDone('sec_flat_back') || secDone('sec_flat_belly')) ? 'fillets' : 'none';
  }

  /** 부산물 yields를 팝업 없이 **즉시 지급** (dev 항법 전용) */
  private accrueYields(yields: ButcherySectionYield[] | undefined, taskId?: string): void {
    if (!yields?.length) return;
    if (yields.includes('skinFillet')) this.removeGrantedRibFillets();
    if (yields.includes('flatSkinFillet')) this.removeGrantedFlatFillets();
    this.grantRows(this.buildYieldRows(yields, taskId));
  }

  /**
   * 현재 섹션의 모든 작업을 완료 처리하고 다음 섹션으로.
   * ⚠ 부산물은 팝업 없이 **레저에 자동 [보관] 적립**된다 — 구 동작(적립도 안 함)은
   *   dev로 진행한 뒤 나가면 원물만 소모되고 부산물이 0개가 되어 "부산물이 사라졌다"로
   *   체감됐다 (사용자 리포트 2026-08-03. 55차의 문서화된 한계였으나 함정이라 폐지).
   */
  private devSkipSection(): void {
    if (this.done || this.process.finished) return;
    const sec = this.section;
    sec.tasks.forEach((t) => {
      if (this.taskDone(t.id)) return;
      t.stageIds.forEach((id) => this.doneStages.add(id));
      this.doneTasks.set(t.id, 100);
      this.accrueYields(t.yields, t.id);      // 작업 단위 부산물 (머리·내장)
    });
    this.accrueYields(sec.yields);            // 섹션 단위 부산물 (필렛·척추뼈 등)
    if (sec.id === 'sec_rib') this.morphPendingFilletsToSkinOnly();
    this.syncDerivedFromDone();
    this.activeTaskId = null;
    this.awaitingSelect = false;
    this.flash(`dev: '${sec.label}' 건너뜀 — 부산물 레저 적립`, true);
    this.advanceSection();   // 체크포인트 갱신 + 다음 섹션 (마지막이면 최종 완료)
  }

  /**
   * 임의 작업으로 점프 — **그 앞의 모든 섹션/작업을 완료 처리**한 뒤 해당 작업의 첫 스테이지로.
   * (뒷 단계를 눌러도 앞 단계가 다 된 픽셀 이미지가 나오도록)
   */
  private devJumpToTask(secIdx: number, taskId: string): void {
    if (this.done || this.process.finished) return;
    const target = this.sections[secIdx]?.tasks.find((t) => t.id === taskId);
    if (!target) return;
    const tIdx = this.sections[secIdx].tasks.indexOf(target);

    // 상태를 처음부터 재구성 — **이번 세션 지급분을 회수한 뒤** 완료 처리분을 다시 지급
    // (구 동작은 지급 없음 → dev 진행 후 나가면 부산물 0개 함정 — 사용자 리포트 2026-08-03)
    this.doneStages.clear(); this.doneTasks.clear(); this.taskAcc.clear();
    this.revokeGranted();
    this.sections.forEach((sec, i) => {
      const whole = i < secIdx;
      sec.tasks.forEach((t, j) => {
        if (!(i < secIdx || (i === secIdx && j < tIdx))) return;
        t.stageIds.forEach((id) => this.doneStages.add(id));
        this.doneTasks.set(t.id, 100);
        this.accrueYields(t.yields, t.id);
      });
      if (whole) {
        this.accrueYields(sec.yields);
        if (sec.id === 'sec_rib') this.morphPendingFilletsToSkinOnly();
      }
    });
    this.syncDerivedFromDone();

    this.sectionIdx = secIdx;
    this.activeTaskId = taskId;
    this.awaitingSelect = false;
    this.byproductPopup?.destroy(); this.byproductPopup = undefined;
    const stageId = target.stageIds[0];
    this.process.jumpTo(stageId);
    // 표시 방향도 스테이지 요구 방향으로 스냅 (자동 뒤집기 폐지 상태라 수동 정렬 대기 방지)
    this.renderedOrientation = asFishOri(this.process.orientation);
    this.flash(`dev: ${this.sections[secIdx].label} › ${target.label}`, true);
    this.refresh();
  }

  /** dev 항법 UI — 좌측 하단 버튼 2개 + (확장 시) 전 섹션/작업 목록 */
  private drawDevNav(): void {
    if (this.done || this.process.finished) return;
    const mkBtn = (bx: number, by: number, w: number, h: number, label: string,
      on: boolean, onClick: () => void): void => {
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x143a4a : 0x1a2230, 0.96); g.fillRoundedRect(bx, by, w, h, 4);
      g.lineStyle(1.2, on ? 0x33d0e8 : 0x546074, 0.9); g.strokeRoundedRect(bx, by, w, h, 4);
      const t = this.scene.add.text(bx + w / 2, by + h / 2, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px',
        color: on ? '#aef0ff' : '#8a97a8',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(bx + w / 2, by + h / 2, w, h, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', onClick);
      this.uiC.add([g, t, hit]);
    };

    const by = PANEL_H - 30;
    mkBtn(20, by, 130, 22, 'dev: 섹션 건너뛰기', false, () => this.devSkipSection());
    mkBtn(156, by, 130, 22, this.devExpand ? '개별 작업 ▼ 닫기' : 'dev: 개별 작업(확장)',
      this.devExpand, () => {
        this.devExpand = !this.devExpand;
        if (this.devExpand && this.editMode) this.toggleEditMode();  // 좌표 편집 박스와 자리 충돌
        this.refresh();
      });
    if (!this.devExpand) return;

    // ── 확장 목록 — 전 섹션 × 작업 (클릭 = 그 지점으로 점프, 앞 단계 완료 처리) ──
    // 상태 텍스트(boardY+boardH+66) 아래에서 시작 — **고정 도마 rect 기준**
    //  ⚠ 구 fishY+fishH 기준은 90° 회전 시 548까지 밀려 세로 공간이 소멸 → 열이
    //    무한정 우측으로 흘러넘쳐 사이드바·HUD를 덮었다 (사용자 리포트 2026-08-06).
    const LX = 20, LY = this.boardY + this.boardH + 80, LW = 660, LH = PANEL_H - 36 - LY;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081420, 0.96); bg.fillRoundedRect(LX, LY, LW, LH, 6);
    bg.lineStyle(1.4, 0x33d0e8, 0.7); bg.strokeRoundedRect(LX, LY, LW, LH, 6);
    this.uiC.add(bg);
    const head = this.scene.add.text(LX + 10, LY + 6,
      'dev 개별 작업 — 클릭 시 그 작업으로 점프 (앞 단계는 모두 완료 처리)', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#7fe6b0',
      });
    this.uiC.add(head);

    // 열 수 자동 결정 — **11개 섹션이 하나도 잘리지 않도록** 들어갈 때까지 열을 늘린다
    //  (구 고정 3열은 8~11번 섹션을 조용히 버렸다)
    const SEC_H = 11, TASK_H = 14, SEC_GAP = 3;
    const colTop = LY + 22;
    const colH = LY + LH - 4 - colTop;
    const needOf = (sec: typeof this.sections[number]): number =>
      SEC_H + sec.tasks.length * TASK_H + SEC_GAP;
    const fits = (n: number): boolean => {
      let col = 0, y = 0;
      for (const sec of this.sections) {
        const h = needOf(sec);
        if (y + h > colH) { col++; y = 0; }
        if (col >= n) return false;
        y += h;
      }
      return true;
    };
    let COLS = 3;
    while (COLS < 8 && !fits(COLS)) COLS++;   // 상한 8 — 상한 초과 렌더가 박스 밖으로 새지 않게
    const COLW = Math.floor((LW - 20) / COLS);
    let col = 0, y = colTop;
    this.sections.forEach((sec, si) => {
      const need = needOf(sec);
      if (y + need > colTop + colH) { col++; y = colTop; }
      const cx = LX + 10 + col * COLW;
      // 열이 좁아져도 줄바꿈으로 높이가 밀리지 않도록 한 줄 고정(말줄임)
      const secT = clampTextWidth(this.scene.add.text(cx, y, `${si + 1}. ${sec.label}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#c8a060',
      }), COLW - 10);
      this.uiC.add(secT);
      y += SEC_H;
      sec.tasks.forEach((t) => {
        const doneMark = this.doneTasks.has(t.id) ? '✔ ' : '';
        const cur = this.sectionIdx === si && this.activeTaskId === t.id;
        const label = clampTextWidth(this.scene.add.text(cx + 6, y, `${doneMark}${t.label}`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px',
          color: cur ? '#4af2a1' : this.doneTasks.has(t.id) ? '#5f7d8e' : '#d0e8f5',
        }), COLW - 18);
        const hit = this.scene.add.rectangle(cx + COLW / 2 - 4, y + 6, COLW - 12, TASK_H, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => label.setColor('#ffd257'));
        hit.on('pointerout', () => label.setColor(cur ? '#4af2a1' : this.doneTasks.has(t.id) ? '#5f7d8e' : '#d0e8f5'));
        hit.on('pointerdown', () => this.devJumpToTask(si, t.id));
        this.uiC.add([label, hit]);
        y += TASK_H;
      });
      y += SEC_GAP;
    });
  }

  /** dev 가이드 편집 토글 버튼 (사이드바 — 가이드 토글 우측) */
  private drawEditToggle(): void {
    const bx = 916, by = PANEL_H - 30, w = 150, h = 22;
    const g = this.scene.add.graphics();
    g.fillStyle(this.editMode ? 0x143a4a : 0x1a2230, 0.96); g.fillRoundedRect(bx, by, w, h, 4);
    g.lineStyle(1.2, this.editMode ? 0x33d0e8 : 0x546074, 0.9); g.strokeRoundedRect(bx, by, w, h, 4);
    const t = this.scene.add.text(bx + w / 2, by + h / 2, this.editMode ? '가이드선 편집 ON·[F9]' : 'dev: 가이드선 편집·[F9]', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: this.editMode ? '#aef0ff' : '#8a97a8',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(bx + w / 2, by + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.toggleEditMode());
    this.uiC.add([g, t, hit]);
  }

  // ═══════════════════════════════════════════════════
  // 가이드 루프 연출 + 액션 성공 연출 (2026-07-29 — 기본 2s, TUNING으로 조율)
  //  가이드 루프: 칼이 지나갈 길을 프리뷰 (경로 하이라이트 + 이동하는 칼)
  //  액션 연출:   조작 성공 시 프리미티브별 애니 (칼질 스윕/탭 파문/문지르기/박피 당김/세척)
  // ═══════════════════════════════════════════════════
  /**
   * 생선 로컬 정규화 → 화면 정규화 (도마 회전 적용).
   * 90°(시계) = 머리(x=0)가 위로 간다 → 화면 u = 1−y, v = x.
   */
  private rotNorm(x: number, y: number): [number, number] {
    switch (this.process.rotation) {
      case 90: return [1 - y, x];
      case 180: return [1 - x, 1 - y];
      case 270: return [y, 1 - x];
      default: return [x, y];
    }
  }

  /** 화면 정규화 → 생선 로컬 정규화 (rotNorm 역변환 — 입력 판정용) */
  private unrotNorm(u: number, v: number): [number, number] {
    switch (this.process.rotation) {
      case 90: return [v, 1 - u];
      case 180: return [1 - u, 1 - v];
      case 270: return [1 - v, u];
      default: return [u, v];
    }
  }

  /** 정규화(0~1) → 패널 로컬 px (회전 반영) */
  private toPanelPx(p: CutPoint): [number, number] {
    const [u, v] = this.rotNorm(p.x, p.y);
    return [this.fishX + u * this.fishW, this.fishY + v * this.fishH];
  }

  /** 폴리라인 호길이 비례 보간 — t(0~1) 지점 좌표 + 진행 각 */
  private pathPointAt(path: CutPoint[], t: number): { x: number; y: number; ang: number } {
    const pts = path.map((p) => this.toPanelPx(p));
    if (pts.length < 2) return { x: pts[0]?.[0] ?? 0, y: pts[0]?.[1] ?? 0, ang: 0 };
    const lens: number[] = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      lens.push(l); total += l;
    }
    let target = Math.max(0, Math.min(1, t)) * total;
    for (let i = 0; i < lens.length; i++) {
      if (target <= lens[i] || i === lens.length - 1) {
        const tt = lens[i] > 0 ? Math.min(1, target / lens[i]) : 0;
        const [ax, ay] = pts[i];
        const [bx, by] = pts[i + 1];
        return { x: ax + (bx - ax) * tt, y: ay + (by - ay) * tt, ang: Math.atan2(by - ay, bx - ax) };
      }
      target -= lens[i];
    }
    const [lx, ly] = pts[pts.length - 1];
    return { x: lx, y: ly, ang: 0 };
  }

  /** 폴리라인을 호길이 t(0~1)까지만 스트로크 (lineStyle은 호출측이 설정) */
  /** 경로를 법선 방향으로 offsetPx 만큼 밀어 그린다 (장뜨기 벌어짐 궤적) */
  private strokePathOffset(g: Phaser.GameObjects.Graphics, path: CutPoint[], offsetPx: number): void {
    const pts = path.map((p) => this.toPanelPx(p));
    if (pts.length < 2) return;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / len, ny = (bx - ax) / len;   // 법선
      g.lineBetween(ax + nx * offsetPx, ay + ny * offsetPx, bx + nx * offsetPx, by + ny * offsetPx);
    }
  }

  private strokePathPartial(g: Phaser.GameObjects.Graphics, path: CutPoint[], t: number): void {
    const pts = path.map((p) => this.toPanelPx(p));
    if (pts.length < 2) return;
    const lens: number[] = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      lens.push(l); total += l;
    }
    let remain = Math.max(0, Math.min(1, t)) * total;
    for (let i = 0; i < lens.length && remain > 0; i++) {
      const frac = Math.min(1, lens[i] > 0 ? remain / lens[i] : 1);
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      g.lineBetween(ax, ay, ax + (bx - ax) * frac, ay + (by - ay) * frac);
      remain -= lens[i];
    }
  }

  /** 작은 회칼 글리프 — 칼끝이 진행 방향(ang), 블레이드+손잡이 */
  private drawKnifeGlyph(g: Phaser.GameObjects.Graphics, x: number, y: number, ang: number, alpha = 1): void {
    const c = Math.cos(ang), s = Math.sin(ang);
    const P = (dx: number, dy: number): [number, number] => [x + dx * c - dy * s, y + dx * s + dy * c];
    // 손잡이 (뒤쪽)
    const [h0x, h0y] = P(-5, -0.5);
    const [h1x, h1y] = P(-15, -0.5);
    g.lineStyle(4, 0x6a4a2c, alpha);
    g.lineBetween(h0x, h0y, h1x, h1y);
    // 블레이드 (앞쪽 삼각 — 칼끝 = 진행 방향)
    const [tipX, tipY] = P(15, 0.5);
    const [heelTX, heelTY] = P(-5, -3.6);
    const [heelBX, heelBY] = P(-5, 2.4);
    g.fillStyle(0xe8f0f6, alpha);
    g.fillTriangle(tipX, tipY, heelTX, heelTY, heelBX, heelBY);
    g.lineStyle(1, 0x9aa8b4, alpha * 0.9);
    g.lineBetween(heelTX, heelTY, tipX, tipY);
  }

  private stopGuideAnim(): void {
    this.guideAnimTween?.remove();
    this.guideAnimTween = undefined;
    this.guideAnimG?.clear();
  }

  /** 시트 스타일 주황 화살표 (굵은 샤프트+삼각 헤드 — 가이드 시트와 동일 시각 언어) */
  private drawSheetArrow(g: Phaser.GameObjects.Graphics, x: number, y: number, ang: number, len: number, alpha: number): void {
    const c = Math.cos(ang), s = Math.sin(ang);
    const P = (dx: number, dy: number): Phaser.Geom.Point =>
      new Phaser.Geom.Point(x + dx * c - dy * s, y + dx * s + dy * c);
    const half = len / 2;
    g.fillStyle(0xe0592c, alpha);
    // 샤프트 (회전 사각)
    g.fillPoints([P(-half, -3.4), P(half - 13, -3.4), P(half - 13, 3.4), P(-half, 3.4)], true);
    // 헤드 (삼각)
    const tip = P(half, 0), h1 = P(half - 14, -9.5), h2 = P(half - 14, 9.5);
    g.fillTriangle(tip.x, tip.y, h1.x, h1.y, h2.x, h2.y);
  }

  /**
   * 유도 연출 루프 — **원물 주변**에서 진행 방향을 안내 (원물 위 방향선/칼 금지.
   * 사용자 지시 2026-07-29). 시트 스타일 주황 화살표가 원물 밖(경로에 가까운 가장자리)
   * 에서 진행 방향으로 슬라이드하며 반복. 시메(tap)만 목표점 맥동 링 유지.
   */
  private startGuideAnim(): void {
    this.stopGuideAnim();
    if (this.guideOff) return;   // 가이드 꺼짐 — 외곽 화살표 큐 정지 (유도선은 drawGuide가 유지)
    if (this.done || this.process.finished || this.flipping || this.knifeLocked() || this.awaitingSelect) return;
    const stage = this.process.stage;
    if (!stage || !this.process.canAct()) return;
    const g = this.guideAnimG;
    let drawFn: ((t: number) => void) | null = null;

    // 원물 밖 화살표 배치 — 경로 중심/방향에서 가장 가까운 바깥 가장자리 산출
    const arrowCueFor = (path: CutPoint[]): { ax: number; ay: number; ang: number } => {
      const pts = path.map((p) => this.toPanelPx(p));
      const p0 = pts[0], p1 = pts[pts.length - 1];
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      const ang = Math.atan2(dy, dx);
      const midX = (p0[0] + p1[0]) / 2, midY = (p0[1] + p1[1]) / 2;
      if (Math.abs(dx) >= Math.abs(dy)) {
        // 수평 컷 — 경로가 몸 위쪽이면 원물 위, 아래쪽이면 원물 아래
        const above = midY < this.fishY + this.fishH / 2;
        return { ax: midX, ay: above ? this.fishY - 16 : this.fishY + this.fishH + 16, ang };
      }
      // 수직 컷(방혈/꼬리 홈 등) — 경로 쪽 좌/우 바깥
      const leftSide = midX < this.fishX + this.fishW / 2;
      return { ax: leftSide ? this.fishX - 20 : this.fishX + this.fishW + 20, ay: midY, ang };
    };

    const arrowLoop = (cue: { ax: number; ay: number; ang: number }): ((t: number) => void) => (t) => {
      g.clear();
      // 진행 방향 슬라이드(0~85%) + 페이드아웃(85~100%) 루프
      const move = (t < 0.85 ? t / 0.85 : 1) * 30 - 15;
      const alpha = t < 0.85 ? 0.95 : 0.95 * (1 - (t - 0.85) / 0.15);
      this.drawSheetArrow(g, cue.ax + Math.cos(cue.ang) * move, cue.ay + Math.sin(cue.ang) * move, cue.ang, 46, alpha);
    };

    if (stage.primitive === 'guided_cut' && stage.cut) {
      // 다중 유도선이면 **아직 안 그은 첫 선**으로 화살표 큐를 맞춘다 (지느러미 3곳)
      const multi = stage.cut.guidePaths;
      const target = multi?.length
        ? (multi.find((_, i) => !this.process.donePathIndices.has(i)) ?? multi[0])
        : stage.cut.guidePath;
      drawFn = arrowLoop(arrowCueFor(target));
    } else if (stage.primitive === 'tap' && stage.tapPoint) {
      // 시메 — 목표점 맥동 링 (탭 좌표 자체가 게임플레이 — 선/칼 아님)
      const [tx, ty] = this.toPanelPx(stage.tapPoint);
      drawFn = (t) => {
        g.clear();
        g.lineStyle(2.5, 0xff5a4a, 0.9 * (1 - t));
        g.strokeCircle(tx, ty, 5 + t * 22);
        g.fillStyle(0xff5a4a, 0.9);
        g.fillCircle(tx, ty, 3.2);
      };
    } else if (stage.primitive === 'drag_fill' || stage.primitive === 'scoop') {
      // 문지르기 — 실제 스윕 경로의 시작→끝 방향으로 원물 밖 화살표 (지그재그 비늘치기 포함)
      drawFn = arrowLoop(arrowCueFor(this.sweepPathFor(stage)));
    } else if (stage.primitive === 'peel') {
      // 박피 — 슬랩 위쪽 바깥에서 좌향 당김 화살표
      drawFn = arrowLoop({ ax: this.fishX + this.fishW / 2, ay: this.fishY + this.fishH * 0.12, ang: Math.PI });
    }
    if (!drawFn) return;   // wash 등 — 루프 연출 없음 (버튼이 인터페이스)
    const fn = drawFn;
    this.guideAnimTween = this.scene.tweens.addCounter({
      from: 0, to: 1, duration: Math.max(400, TUNING.butchery.guideAnimMs),
      repeat: -1, repeatDelay: 260,
      onUpdate: (tw) => fn(tw.getValue() ?? 0),
    });
  }

  private stopActionAnim(): void {
    this.actionTween?.remove();
    this.actionTween = undefined;
    this.actionAnimG?.clear();
    this.actionAnim = false;
  }

  /** 미뤄둔 완료 처리(작업/섹션 전환·부산물 팝업) 실행 — 연출/뒤집기 onComplete에서 호출 */
  private runPendingAfterAction(): void {
    const fn = this.pendingAfterAction;
    this.pendingAfterAction = null;
    if (fn) fn();
  }

  /**
   * 조작 성공 액션 연출 — 프리미티브별 애니 (입력 차단, actionAnimMs).
   * 완료 시 가이드 루프 재시작. 방향 전환(플립)이 이어질 때는 호출측이 스킵.
   */
  private playActionAnim(
    stage: { primitive: string; cut?: { guidePath: CutPoint[] }; tapPoint?: CutPoint; id?: string } | null,
    pathOverride?: CutPoint[],
  ): void {
    if (!stage || !this.scene) return;
    this.stopActionAnim();
    this.stopGuideAnim();
    const g = this.actionAnimG;
    this.actionAnim = true;
    let drawFn: (t: number) => void;

    if (stage.primitive === 'guided_cut') {
      // 다중 유도선(지느러미 3곳)은 **방금 그은 그 선**을 따라 칼이 지나가야 한다
      // (구 구현은 항상 guidePath = 1번 선만 연출 — 사용자 리포트 2026-07-30).
      const path = pathOverride ?? stage.cut?.guidePath ?? [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }];
      // 장뜨기 = 칼이 지나간 뒤 절개면이 **벌어지는** 연출 (사용자 지시 2026-07-30)
      const openTo = this.filletOpenPending;
      this.filletOpenPending = null;
      let openApplied = false;
      const SWEEP_T = openTo ? 0.5 : 1;          // 벌어짐이 있으면 전반 = 칼질 / 후반 = 벌어짐
      drawFn = (t) => {
        g.clear();
        const st = Math.min(1, t / SWEEP_T);
        // 지나간 자리 = 밝은 절개선 + 여열 글로우
        g.lineStyle(6, 0xff8a5a, 0.22);
        this.strokePathPartial(g, path, st);
        g.lineStyle(3.2, 0xffffff, 0.9);
        this.strokePathPartial(g, path, st);
        const p = this.pathPointAt(path, st);
        if (st < 1) {
          this.drawKnifeGlyph(g, p.x, p.y, p.ang, 1);
          for (let k = 0; k < 4; k++) {            // 스파크
            const a = t * 20 + k * 1.7;
            g.fillStyle(0xffe28a, 0.7 * (1 - t));
            g.fillCircle(p.x + Math.cos(a) * 9, p.y + Math.sin(a) * 9, 1.6);
          }
        }
        if (!openTo) return;
        // 후반 — 스프라이트를 벌어진 단계로 교체하고, 절개선 양쪽이 밀려나며 열리는 궤적
        if (!openApplied && t >= SWEEP_T) {
          openApplied = true;
          this.filletOpen = openTo;
          this.drawFish();
        }
        const u = Math.max(0, (t - SWEEP_T) / (1 - SWEEP_T));
        const lift = u * (openTo.state >= 3 ? 16 : openTo.state === 2 ? 8 : 4);
        for (const s of [-1, 1]) {
          g.lineStyle(2.4, s < 0 ? 0xffd9c8 : 0xe8b0a4, 0.55 * (1 - u * 0.5));
          this.strokePathOffset(g, path, s * lift);
        }
      };
    } else if (stage.primitive === 'tap') {
      const [tx, ty] = this.toPanelPx(stage.tapPoint ?? { x: 0.16, y: 0.38 });
      drawFn = (t) => {
        g.clear();
        for (let k = 0; k < 3; k++) {
          const tt = Math.max(0, Math.min(1, t * 1.6 - k * 0.22));
          if (tt <= 0) continue;
          g.lineStyle(2.4, 0xff5a4a, 0.9 * (1 - tt));
          g.strokeCircle(tx, ty, 5 + tt * 30);
        }
        g.fillStyle(0xffffff, Math.max(0, 0.9 - t * 1.4));
        g.fillCircle(tx, ty, 4);
      };
    } else if (stage.primitive === 'drag_fill' || stage.primitive === 'scoop') {
      // 마무리 스와이프 — **지정된 스윕 경로를 그대로 따라간다**(구 구현은 고정 수평선 3줄이라
      // 실제 문지른 방향과 어긋났다 — 사용자 리포트 "비늘 애니 방향이 맞지 않음").
      // 비늘/부스러기는 칼이 **진행하는 쪽 앞으로** 튄다 (날에 밀려 나가는 방향).
      const sweep = pathOverride ?? [{ x: 0.82, y: 0.5 }, { x: 0.22, y: 0.5 }];
      drawFn = (t) => {
        g.clear();
        g.lineStyle(5, 0xd8ecf8, 0.28);
        this.strokePathPartial(g, sweep, t);
        const p = this.pathPointAt(sweep, t);
        this.drawKnifeGlyph(g, p.x, p.y, p.ang, 1);
        // 진행 방향(ang) 앞쪽으로 부스러기 분사 — 좌우로 퍼지며 낙하
        for (let k = 0; k < 7; k++) {
          const spread = (k / 6 - 0.5) * 1.15;
          const dist = 8 + ((k * 13) % 17) + t * 10;
          const bx = p.x + Math.cos(p.ang + spread) * dist;
          const by = p.y + Math.sin(p.ang + spread) * dist - 4 + t * 6;
          g.fillStyle(k % 2 === 0 ? 0xeaf6ff : 0xbfd8e8, 0.85 * (1 - t * 0.7));
          g.fillCircle(bx, by, 1.3 + (k % 3) * 0.4);
        }
      };
    } else if (stage.primitive === 'peel') {
      // 껍질 스트립이 왼쪽으로 벗겨져 늘어짐 + 진행 트레일
      const path: CutPoint[] = [{ x: 0.72, y: 0.52 }, { x: 0.24, y: 0.52 }];
      drawFn = (t) => {
        g.clear();
        g.lineStyle(3, 0x7fe6b0, 0.65);
        this.strokePathPartial(g, path, t);
        const p = this.pathPointAt(path, t);
        this.drawKnifeGlyph(g, p.x, p.y, Math.PI, 1);
        // 벗겨진 껍질 스트립 (칼 뒤쪽 → 아래로 젖혀짐)
        const stripLen = this.fishW * 0.46 * t;
        g.fillStyle(0x5a6a76, 0.85);
        g.fillRoundedRect(p.x + 6, p.y + 4, stripLen, 7, 3);
      };
    } else {
      // wash — 물방울 낙하 + 푸른 세척광
      drawFn = (t) => {
        g.clear();
        g.fillStyle(0x66b8ff, 0.10 * (1 - Math.abs(t * 2 - 1)));
        g.fillRoundedRect(this.fishX, this.fishY, this.fishW, this.fishH, 12);
        for (let k = 0; k < 10; k++) {
          const dx = this.fishX + ((k * 61) % this.fishW);
          const dy = this.fishY - 8 + ((t * 1.3 + k * 0.1) % 1) * (this.fishH + 16);
          g.fillStyle(0x9fd0ff, 0.8);
          g.fillCircle(dx, dy, 1.8);
        }
      };
    }

    this.actionTween = this.scene.tweens.addCounter({
      from: 0, to: 1, duration: Math.max(300, TUNING.butchery.actionAnimMs),
      onUpdate: (tw) => drawFn(tw.getValue() ?? 0),
      onComplete: () => {
        this.stopActionAnim();
        // **연출이 다 끝난 뒤에만** 스프라이트·사이드바를 다음 상태로 전환한다 (사용자 지시
        //  2026-07-30 — "다음 단계로 넘어가기 전에 연출이 끝나야 한다"). doRefresh가 스프라이트
        //  갱신 + 가이드 루프 재시작을 담당. 연출 중엔 pre-cut 스프라이트가 그대로 유지된다.
        this.filletOpen = null;
        this.doRefresh();
        this.runPendingAfterAction();   // 미뤄둔 작업/섹션 완료 처리(전환·팝업) 실행
      },
    });
  }

  /** 우측 사이드바 — 진행/안내/방향·세척 버튼/필렛 카운트 */
  private drawSidebar(): void {
    const sx = 700;
    const stage = this.process.stage;

    const mkText = (x: number, y: number, text: string, size: number, color: string, bold = false): Phaser.GameObjects.Text => {
      const t = this.scene.add.text(x, y, text, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: `${size}px`, color,
        fontStyle: bold ? 'bold' : 'normal', wordWrap: { width: PANEL_W - sx - 40 },
      });
      this.uiC.add(t);
      return t;
    };

    // 진행도 — 섹션 n/N + 현재 스테이지 (자유 손질 개편)
    const sec = this.section;
    mkText(sx, this.contentTop + 16,
      this.process.finished
        ? '손질 완료!'
        : `섹션 ${this.sectionIdx + 1} / ${this.sections.length} — ${sec.label}`,
      15, '#ffe28a', true);

    if (!this.process.finished && stage) {
      mkText(sx, this.contentTop + 42,
        this.awaitingSelect ? '우측 상단 작업 목록에서 다음 작업을 선택하세요' : stage.guide,
        12, this.awaitingSelect ? '#ffd257' : '#d0e8f5');

      // 방향 게이트 상태
      const ok = this.process.canAct();
      mkText(sx, this.contentTop + 100,
        ok ? `방향 OK — ${this.orientLabel(this.process.orientation)}`
          : `${this.orientLabel(stage.orientation)} 방향으로 — 좌우(F)/상하(V) 뒤집기`,
        12, ok ? '#7fe6b0' : '#ff9a6a', true);

      if (ok) {
        // 반복/진행 표시 — 다중 유도선은 '남은 절단선 n / N곳'으로 표기 (지느러미 등·뒷·가슴)
        const nLines = stage.cut?.guidePaths?.length ?? 0;
        if (stage.primitive === 'guided_cut' && nLines > 1) {
          mkText(sx, this.contentTop + 124,
            `남은 절단선: ${this.process.currentStrokesLeft} / ${nLines}곳 (순서 자유)`, 11, '#9fd0e4');
        } else if (stage.primitive === 'guided_cut' && this.process.currentStrokesLeft > 1) {
          mkText(sx, this.contentTop + 124, `남은 칼집: ${this.process.currentStrokesLeft}회`, 11, '#9fd0e4');
        }
        if (stage.primitive === 'peel') {
          mkText(sx, this.contentTop + 124, `남은 장: ${this.process.currentPullsLeft}`, 11, '#9fd0e4');
        }
      }

      // ── 수동 뒤집기 버튼 2종 (자동 뒤집기 폐지 — 상하/좌우 분리. FLESH_UP=필렛 뷰는 비활성) ──
      const filletView = this.process.orientation === 'FLESH_UP';
      const flipDefs: { label: string; act: () => void }[] = [
        { label: '좌우 뒤집기 (F)', act: () => this.doFlipLR() },
        { label: '상하 뒤집기 (V)', act: () => this.doFlipUD() },
        // 회전은 뒤집기와 **독립 축** — 넙치류 지느러미쪽 칼길·포 뜨기는 세로로 세워서 한다
        { label: '↻ 90° 회전 (R)', act: () => this.doRotate(1) },
        { label: '↺ 90° 회전 (Shift+R)', act: () => this.doRotate(-1) },
      ];
      // 2×2 그리드 — 4버튼을 한 줄로 두면 사이드바 폭(160×4+간격)을 넘는다
      flipDefs.forEach((fd, i) => {
        const isRotate = i >= 2;
        // 회전은 필렛 뷰에서도 가능 (뒤집기와 독립 축이라 살 위 상태에서도 세워 놓을 수 있다)
        const dim = filletView && !isRotate;
        const bx = sx + (i % 2) * 170;
        const by = this.contentTop + 160 + Math.floor(i / 2) * 40;
        const bg = this.scene.add.graphics();
        bg.fillStyle(dim ? 0x101820 : (isRotate ? 0x175f4a : 0x155a7c), 0.95);
        bg.fillRoundedRect(bx, by, 160, 34, 4);
        bg.lineStyle(1.5, dim ? 0x2a3a48 : (isRotate ? 0x5fe0a8 : 0x5cd0ff), 0.95);
        bg.strokeRoundedRect(bx, by, 160, 34, 4);
        const t = this.scene.add.text(bx + 80, by + 17, fd.label, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
          color: dim ? '#4a5a68' : (isRotate ? '#aef2d4' : '#aee8ff'), fontStyle: 'bold',
        }).setOrigin(0.5);
        if (!dim) {
          const hit = this.scene.add.rectangle(bx + 80, by + 17, 160, 34, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true });
          hit.on('pointerdown', fd.act);
          this.uiC.add(hit);
        }
        this.uiC.add([bg, t]);
      });
      // 현재 배치 상태 표기 — 요구 회전과 어긋나면 강조
      const rotWant = this.process.stage?.rotationRequired ?? 0;
      const rotOk = this.process.rotation === rotWant;
      mkText(sx, this.contentTop + 240,
        rotOk ? `배치: ${ROTATION_LABEL[this.process.rotation]}`
          : `배치 필요: ${ROTATION_LABEL[rotWant]} — R로 회전`,
        11, rotOk ? '#7fa8c0' : '#ffd257', !rotOk);
      if (filletView) {
        mkText(sx, this.contentTop + 200, '필렛 뷰 — 뒤집기 없음 (살 위)', 10, '#607b8e');
      }

      // 세척/얼음물 버튼 (wash 프리미티브에서만)
      if (stage.primitive === 'wash') {
        const by = this.contentTop + 292;
        const label = stage.id === 'bleed_ice' ? '얼음물에 담그기' : '물로 세척하기';
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x14425e, 0.98);
        bg.fillRoundedRect(sx, by, 200, 40, 6);
        bg.lineStyle(2, 0x33b0e0, 1);
        bg.strokeRoundedRect(sx, by, 200, 40, 6);
        const t = this.scene.add.text(sx + 100, by + 20, label, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#aee8ff', fontStyle: 'bold',
        }).setOrigin(0.5);
        const hit = this.scene.add.rectangle(sx + 100, by + 20, 200, 40, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          if (this.process.submitWash()) {
            this.washCount++;
            this.flash(stage.id === 'bleed_ice' ? '방혈 완료 — 선도 보너스!' : '깨끗이 씻었습니다', true);
            this.refresh();
            this.onStageComplete(stage.id, 1);
          }
        });
        this.uiC.add([bg, t, hit]);
      }

      // 통마리 유도 — 회칼 미보유(막칼 폴백) 또는 체장 미달(회뜨기 비효율) 시 선택지 제공
      const noKnifeSoft = !this.knife && this.isFilletingStage() && !this.knifeLocked();
      const undersizedSoft = this.isUndersized() && this.isFilletingStage();
      if (noKnifeSoft || undersizedSoft) {
        const warn = noKnifeSoft ? '회칼 없음 — 막칼로 손질 중 (수율·등급 저하)'
          : `체장 미달 (${this.source.lengthCm}cm < ${this.process.profile.minFilletLengthCm}cm) — 회뜨기 비효율`;
        mkText(sx, this.contentTop + 292, warn, 11, '#ffb454', true);
        const by = this.contentTop + 314;
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a2214, 0.96);
        bg.fillRoundedRect(sx, by, 200, 30, 5);
        bg.lineStyle(1.5, 0xffb454, 0.9);
        bg.strokeRoundedRect(sx, by, 200, 30, 5);
        const t = this.scene.add.text(sx + 100, by + 15, '통마리로 마무리', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffd9a0',
        }).setOrigin(0.5);
        const hit = this.scene.add.rectangle(sx + 100, by + 15, 200, 30, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.finishWhole());
        this.uiC.add([bg, t, hit]);
      }
    }

    // 필렛/상태 요약
    mkText(sx, PANEL_H - 120,
      `필렛 ${this.process.filletsDone} / ${this.process.profile.filletCount}`
      + `   시메 ${this.process.ikejimeDone ? 'O' : 'X'} · 방혈 ${this.process.bledDone ? 'O' : 'X'} · 세척 ${this.washCount}회`,
      12, '#9fd0e4');
    mkText(sx, PANEL_H - 96,
      this.process.profile.bodyShape === 'flat' ? '광어 5장뜨기 (4필렛 + 중골)' : '삼면뜨기 (양살 2필렛 + 중골)',
      11, '#7a98ac');
    // 손질 스킬 레벨 + XP 진행 (상시 표시 — 상한 Lv.20)
    const fl = GameState.skills.filleting;
    const skillLine = fl.level >= 20
      ? '손질 스킬 Lv.20 (MAX)'
      : `손질 스킬 Lv.${fl.level}  ·  ${fl.xp} / ${(fl.level + 1) * 100} XP`;
    mkText(sx, PANEL_H - 74, skillLine, 11, '#ffd257');
    mkText(sx, PANEL_H - 54, '키: F/Space 좌우 · V 상하 · R 회전(Shift+R 반대) · Enter 세척', 10, '#607b8e');

    // 가이드 켜기/끄기 토글 (전 어종 — 끄더라도 유도선은 항상 표시)
    this.drawGuideToggle();
    if (import.meta.env.DEV) {
      this.drawEditToggle();   // dev — 가이드선 편집 토글
      this.drawDevNav();       // dev — 섹션 건너뛰기 / 개별 작업 점프 (좌측 하단)
    }

    // 삼면뜨기 픽셀 가이드 슬롯 (돔류 — 현재 스테이지의 가이드 컷 + 전체 시트 버튼)
    this.drawGuideSlot();

    // 작업 선택 목록 (도마 우측 상단 — 섹션별 작업 유형 + 완료 도장)
    this.drawTaskPanel();
  }

  /**
   * 작업 선택 목록 — 도마 우측 상단 (자유 손질 개편). 현재 섹션의 작업들을 표시하고,
   * anyOrder 섹션은 클릭으로 직접 선택. 완료 작업은 '완료됨 (정확도 %)' 도장.
   */
  private drawTaskPanel(): void {
    if (this.done || this.process.finished) return;
    const sec = this.section;
    const rowH = 26;
    // 작업 4개 이상 = **2열 그리드** (사용자 지시 2026-08-05 — 세로 스택이 도마 프레임을
    //  침범하던 것을 왼쪽으로 확장해 해소. 광어 배쪽 섹션 = 4작업 → 2×2).
    const cols = sec.tasks.length >= 4 ? 2 : 1;
    const colW = 216;
    const W = cols * colW + 6;
    const rows = Math.ceil(sec.tasks.length / cols);
    const px = this.boardX + this.boardW - W + 10;   // 고정 도마 rect 기준 (회전과 무관)
    const py = this.contentTop + 6;
    const H = 26 + rows * rowH + 6;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a1628, 0.94);
    bg.fillRoundedRect(px, py, W, H, 6);
    bg.lineStyle(1.5, this.awaitingSelect ? 0xffd257 : 0x2a5a8a, 0.95);
    bg.strokeRoundedRect(px, py, W, H, 6);
    const hdr = this.scene.add.text(px + 8, py + 6, `${sec.label}${sec.anyOrder ? ' — 작업 선택' : ''}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffe28a', fontStyle: 'bold',
    });
    if (hdr.width > W - 16) hdr.setScale((W - 16) / hdr.width);
    this.uiC.add([bg, hdr]);

    sec.tasks.forEach((task, i) => {
      const rx = px + 6 + (i % cols) * colW;             // 행 우선 배치 (좌→우, 위→아래)
      const ry = py + 26 + Math.floor(i / cols) * rowH;
      const done = this.taskDone(task.id);
      const active = this.activeTaskId === task.id;
      const selectable = !done && sec.anyOrder && this.awaitingSelect;

      // 진행 중 작업의 하위 스테이지 진행도 (예: 머리 제거 = 앞면/뒷면 2스테이지)
      const stepTotal = task.stageIds.length;
      const stepDone = task.stageIds.filter((id) => this.doneStages.has(id)).length;

      const rg = this.scene.add.graphics();
      rg.fillStyle(done ? 0x0d2a1a : active ? 0x155a7c : 0x0e1c2d, done ? 0.6 : 0.95);
      rg.fillRoundedRect(rx, ry, colW - 12, rowH - 4, 4);
      rg.lineStyle(1.2, done ? 0x2e7a58 : active ? 0x5cd0ff : selectable ? 0xffd257 : 0x1f3d5a, done ? 0.6 : 0.9);
      rg.strokeRoundedRect(rx, ry, colW - 12, rowH - 4, 4);
      const label = done
        ? `✔ ${task.label} — 완료됨 (${this.doneTasks.get(task.id)}%)`
        : active
          ? `▶ ${task.label}${stepTotal > 1 ? ` (${stepDone + 1}/${stepTotal})` : ''}`
          : task.label;
      const t = this.scene.add.text(rx + 6, ry + (rowH - 4) / 2, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px',
        color: done ? '#5f8f78' : active ? '#aee8ff' : selectable ? '#ffd257' : '#8faabf',
        fontStyle: done || active ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);
      if (t.width > colW - 24) t.setScale((colW - 24) / t.width);
      // 완료 작업 = 딤 처리 (도장만 남기고 흐리게)
      if (done) { rg.setAlpha(0.55); t.setAlpha(0.75); }
      this.uiC.add([rg, t]);

      if (selectable) {
        const hit = this.scene.add.rectangle(rx + (colW - 12) / 2, ry + (rowH - 4) / 2, colW - 12, rowH - 4, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.selectTask(task.id));
        this.uiC.add(hit);
      }
    });
  }

  /**
   * 가이드 켜기/끄기 토글 버튼 (사이드바 하단) — 팝업 일러스트·외곽 화살표 큐·캡션을 on/off.
   * **유도선(drawGuide)은 이 토글과 무관하게 항상 표시.** 전 어종 공통(guideSpeciesOk 무관).
   */
  private drawGuideToggle(): void {
    const sx = 700;
    const by = PANEL_H - 30;
    const w = 210, h = 22;
    const on = !this.guideOff;
    const g = this.scene.add.graphics();
    g.fillStyle(on ? 0x143a2a : 0x2a2214, 0.96);
    g.fillRoundedRect(sx, by, w, h, 4);
    g.lineStyle(1.2, on ? 0x33e0a0 : 0xffb454, 0.9);
    g.strokeRoundedRect(sx, by, w, h, 4);
    const t = this.scene.add.text(sx + w / 2, by + h / 2,
      on ? '가이드 켜짐 · [G] 끄기' : '가이드 꺼짐 (유도선 유지) · [G] 켜기', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px',
        color: on ? '#9fe8c8' : '#ffd9a0', fontStyle: 'bold',
      }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(sx + w / 2, by + h / 2, w, h, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.toggleGuide());
    this.uiC.add([g, t, hit]);
  }

  /** 가이드 on/off 전환 — 영속 저장 후 리렌더 (유도선은 항상 유지) */
  private toggleGuide(): void {
    this.guideOff = !this.guideOff;
    GameState.setFlag('butcheryGuideOff', this.guideOff);
    this.flash(this.guideOff ? '가이드 꺼짐 — 유도선만 표시' : '가이드 켜짐', true);
    this.refresh();
  }

  // ═══════════════════════════════════════════════════
  // 삼면뜨기 픽셀 가이드 시트 (선행 9컷 + 본편 38컷) — **수동 열람 전용**
  //  (자유 손질 개편 후 도마 위 컷 팝업은 폐지 — 시트는 1~38 순차라 섹션 진행과 매칭되지 않음)
  // ═══════════════════════════════════════════════════
  /**
   * 사이드바 [전체 시트] 버튼만 — **도마 위 가이드 컷 팝업/캡션은 폐지**
   * (사용자 지시 2026-07-30: 47컷 시트는 1~38 순차 나열이라 자유 손질 섹션/작업 진행과
   *  매칭되지 않아 오히려 혼란. 시트는 수동 열람용으로만 남긴다.)
   */
  private drawGuideSlot(): void {
    if (!this.guideSpeciesOk) return;

    const bx = 700, by = PANEL_H - 238;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x14283c, 0.96);
    bg.fillRoundedRect(bx, by, 152, 26, 4);
    bg.lineStyle(1.2, 0x33b0e0, 0.9);
    bg.strokeRoundedRect(bx, by, 152, 26, 4);
    const bt = this.scene.add.text(bx + 76, by + 13, '가이드 시트 (47컷)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#aee8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const bhit = this.scene.add.rectangle(bx + 76, by + 13, 152, 26, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    bhit.on('pointerdown', () => this.openSheetViewer());
    this.uiC.add([bg, bt, bhit]);
  }

  /** 전체 시트 뷰어 — 화면 고정 오버레이 (휠 = 세로 스크롤 · 드래그 = 팬 · ESC/X = 닫기) */
  private openSheetViewer(): void {
    if (this.sheetViewer || !this.scene) return;
    const scene = this.scene;
    const vx = 40, vy = 30, vw = GAME_WIDTH - 80, vh = GAME_HEIGHT - 60;
    const c = scene.add.container(0, 0).setDepth(1500);

    // 딤 배경 (클릭 = 닫기 아님 — 오클릭 방지, X/ESC로만)
    const dim = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setInteractive();
    c.add(dim);

    // 뷰포트 프레임
    const frame = scene.add.graphics();
    frame.fillStyle(0x0a1628, 0.97);
    frame.fillRoundedRect(vx - 6, vy - 6, vw + 12, vh + 12, 8);
    frame.lineStyle(2, 0x2a5a8a, 1);
    frame.strokeRoundedRect(vx - 6, vy - 6, vw + 12, vh + 12, 8);
    c.add(frame);

    // 시트 이미지 (네이티브 스케일 — 캡션 가독성 유지, 드래그 팬)
    const S = SASHIMI_GUIDE_SHEET;
    const img = scene.add.image(vx, vy, SASHIMI_GUIDE_TEXTURE).setOrigin(0, 0);
    c.add(img);

    // 마스크 — 화면 고정 지오메트리 (33차 교훈: scrollFactor 0 필수)
    const maskG = scene.make.graphics({}, false).setScrollFactor(0);
    maskG.fillRect(vx, vy, vw, vh);
    img.setMask(maskG.createGeometryMask());

    // 팬 상태 + 클램프
    let ox = 0, oy = 0;
    const clampPan = (): void => {
      ox = Phaser.Math.Clamp(ox, Math.min(0, vw - S.sheetW), 0);
      oy = Phaser.Math.Clamp(oy, Math.min(0, vh - S.sheetH), 0);
      img.setPosition(vx + ox, vy + oy);
    };
    clampPan();

    // 드래그 팬 + 휠 스크롤
    let dragging = false, lastX = 0, lastY = 0;
    dim.on('pointerdown', (p: Phaser.Input.Pointer) => { dragging = true; lastX = p.x; lastY = p.y; });
    const moveH = (p: Phaser.Input.Pointer): void => {
      if (!dragging || !p.isDown) { dragging = false; return; }
      ox += p.x - lastX; oy += p.y - lastY;
      lastX = p.x; lastY = p.y;
      clampPan();
    };
    const upH = (): void => { dragging = false; };
    const wheelH = (_p: Phaser.Input.Pointer, _o: unknown[], _dx: number, dy: number): void => {
      oy -= dy * 0.9;
      clampPan();
    };
    scene.input.on('pointermove', moveH);
    scene.input.on('pointerup', upH);
    scene.input.on('wheel', wheelH);

    // 헤더 + 닫기
    const title = scene.add.text(vx + 8, vy + 6, '삼면뜨기 픽셀 가이드 — 선행 9컷 + 본편 38컷 (드래그 이동 · 휠 스크롤)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffe28a', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 6, y: 3 },
    });
    const closeBg = scene.add.circle(vx + vw - 16, vy + 16, 14, 0x14283c, 0.98).setStrokeStyle(1.5, 0x4a6a8a);
    const closeTxt = scene.add.text(vx + vw - 16, vy + 16, '✕', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff9a9a', fontStyle: 'bold',
    }).setOrigin(0.5);
    const closeHit = scene.add.rectangle(vx + vw - 16, vy + 16, 34, 34, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => this.closeSheetViewer());
    c.add([title, closeBg, closeTxt, closeHit]);

    applyScreenFixed(c);
    // 뷰어 파괴 시 씬 레벨 핸들러/마스크 정리
    c.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.input?.off('pointermove', moveH);
      scene.input?.off('pointerup', upH);
      scene.input?.off('wheel', wheelH);
      maskG.destroy();
    });
    this.sheetViewer = c;
  }

  private closeSheetViewer(): void {
    this.sheetViewer?.destroy();
    this.sheetViewer = undefined;
  }

  /**
   * dev 어서션 (§7) — 모든 스테이지의 가이드 매핑이 실제 컷/프레임으로 해소되는지 +
   * 컷 방향/스테이지 방향 어긋남 목록 (브리지는 의도적 근사 — 정보 로그로만).
   */
  private devAssertGuideBinding(): void {
    if (!this.guideSpeciesOk) return;
    const problems: string[] = [];
    for (const [sid, seq] of Object.entries(LIVE_STAGE_GUIDE)) {
      for (const key of seq) {
        const cut = guideCutByKey(key);
        if (!cut) { problems.push(`${sid} → ${key}: 컷 행 없음`); continue; }
        if (!this.scene.textures.get(SASHIMI_GUIDE_TEXTURE).has(guideFrameName(key))) {
          problems.push(`${sid} → ${key}: 프레임 미등록`);
        }
      }
    }
    if (problems.length) console.warn('[ButcheryGuide] 바인딩 문제:', problems);
  }

  // ═══════════════════════════════════════════════════
  // 손질 부산물/필렛 아이콘 — trimmings 실사 에셋
  //  어종군 분리 (2026-07-30 사용자 매핑): 머리/척추뼈/갈빗대/순수 필렛 = 돔류(bream)·
  //  방어류(amberjack) 별도 에셋 / 껍질·내장·지아이뼈 = 물고기류 공통.
  // ═══════════════════════════════════════════════════
  /** 어종 → trimmings 어종군 ('amberjack' = 방어류 / 'halibut' = 넙치류 / 'bream' = 돔류·기본) */
  private trimFamily(speciesId: string): 'amberjack' | 'bream' | 'halibut' {
    if (speciesId === 'yellowtail' || speciesId === 'amberjack' || speciesId === 'greater_amberjack') return 'amberjack';
    if (this.process.profile.bodyShape === 'flat') return 'halibut';
    return 'bream';
  }

  /** 어종별 머리 아이콘 키 — 어종군 베이스 + 돔류는 색/무늬 변형 (참돔 붉게·돌돔 아가미 줄무늬) */
  private trimHeadKey(speciesId: string): string {
    const fam = this.trimFamily(speciesId);
    const base = `trim_head_${fam}`;
    if (fam !== 'bream') return base;   // 방어류/넙치류 = 실색 에셋 그대로
    const HEAD_MULT: Record<string, { mult: number; stripes?: boolean }> = {
      black_seabream: { mult: 0xffffff },                    // 감성돔 — 원본
      red_seabream: { mult: 0xff7a55 },                      // 참돔 — 붉은 발색
      night_seabream: { mult: 0xd76a52 },                    // 참돔 야간
      stone_beakperch: { mult: 0xf2f2f2, stripes: true },    // 돌돔 — 감성돔 유사 + 아가미 줄무늬
      spotted_knifejaw: { mult: 0xd8d8e2, stripes: true },   // 강담돔 — 유사 + 줄무늬
      largescale_blackfish: { mult: 0x9fb2c0 },              // 벵에돔 — 차가운 회청
      longtail_blackfish: { mult: 0xa6c2d8 },                // 긴꼬리벵에돔
    };
    const spec = HEAD_MULT[speciesId]
      ?? { mult: this.blendColor(0xffffff, getFishColors(speciesId).body, 0.45) };
    const key = speciesId === 'black_seabream' ? base : `trimhead_${speciesId}`;
    this.bakeTintedTrim(base, key, spec.mult, spec.stripes ?? false);
    return this.scene.textures.exists(key) ? key : base;
  }

  /** 어종별 순수 필렛 아이콘 키 — 어종군 로인 사진 (방어류 실색 / 돔류는 은은한 어종 색) */
  private trimFilletKey(speciesId: string): string {
    const fam = this.trimFamily(speciesId);
    // 넙치류 — 순수 필렛 전용 에셋 미제작: 엔가와 제거 필렛(껍질 면이 안 보이는 탑뷰)으로 대용
    if (fam === 'halibut') return 'trim_fillet_skinonly_halibut';
    const base = `trim_fillet_${fam}`;
    if (fam === 'amberjack') return base;   // 방어류 = 잿방어 로인 실색 그대로
    const body = getFishColors(speciesId).body;
    const key = `trimfillet_${body.toString(16)}`;
    this.bakeTintedTrim(base, key, this.blendColor(0xffffff, body, 0.26), false);
    return this.scene.textures.exists(key) ? key : base;
  }

  /**
   * 실사 트리밍 에셋을 멀티플라이 틴트(+선택적 아가미 줄무늬)로 굽는다.
   * 캔버스 텍스처(게임 레벨 TextureManager — 씬 재시작에도 유지)에 합성. 아이콘용 축소 렌더.
   */
  private bakeTintedTrim(baseKey: string, outKey: string, mult: number, stripes: boolean): void {
    const tm = this.scene.textures;
    if (tm.exists(outKey)) return;
    if (!tm.exists(baseKey)) return;
    const src = tm.get(baseKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const sw = src.width, sh = src.height;
    if (!sw || !sh) return;
    const scale = 200 / Math.max(sw, sh);                    // 아이콘용 축소 (메모리 절약)
    const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
    const cv = tm.createCanvas(outKey, w, h);
    if (!cv) return;
    const ctx = cv.context;
    const css = (c: number): string => `#${(c & 0xffffff).toString(16).padStart(6, '0')}`;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(src, 0, 0, w, h);
    if ((mult & 0xffffff) !== 0xffffff) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = css(mult);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-in';       // 원본 알파로 클립 (배경 투명 유지)
      ctx.drawImage(src, 0, 0, w, h);
    }
    if (stripes) {
      // 아가미쪽 세로 줄무늬 (머리는 좌향 — 아가미/뺨은 중앙~우중앙)
      ctx.globalCompositeOperation = 'source-atop';          // 머리 위에만
      ctx.fillStyle = 'rgba(22,24,30,0.5)';
      const bw = w * 0.05;
      for (const bx of [0.46, 0.58, 0.70]) ctx.fillRect(w * bx, 0, bw, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    cv.refresh();
  }

  /** 색 블렌드 (a에 b를 t 비율로 섞음) */
  private blendColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    const r = Math.round(ar + (br - ar) * t);
    const gg = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (gg << 8) | bl;
  }

  /** 채움 진행 바 (비늘/내장 — 즉석 표시) — 고정 도마 rect 기준 */
  private updateFillBar(progress: number): void {
    this.traceG.clear();
    const bx = this.boardX, by = this.boardY - 40, bw = this.boardW;
    this.traceG.fillStyle(0x101820, 0.9);
    this.traceG.fillRoundedRect(bx, by, bw, 12, 4);
    this.traceG.fillStyle(0x4af2a1, 0.95);
    this.traceG.fillRoundedRect(bx, by, bw * Math.min(1, progress), 12, 4);
  }

  private flashMsg?: Phaser.GameObjects.Text;
  private flash(msg: string, good: boolean): void {
    this.flashMsg?.destroy();
    // 세로 생선 하단(≈449)과 F9 편집 박스(+84) **사이**에 배치 — 양쪽 어디와도 겹치지 않게.
    // 고정 도마 rect 기준 (+66 = 466 · 텍스트 상단 ≈455).
    this.flashMsg = this.scene.add.text(this.boardX + this.boardW / 2, this.boardY + this.boardH + 66, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
      color: good ? '#7fe6b0' : '#ff9a6a', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 8, y: 3 },
    }).setOrigin(0.5);
    this.add(this.flashMsg);
    this.applyFix();
  }

  // ═══════════════════════════════════════════════════
  // 완료 — 필렛 지급 + 원본 소모
  // ═══════════════════════════════════════════════════
  private showResult(): void {
    if (this.done) return;
    this.done = true;
    const r = this.process.result();
    const speciesId = this.process.profile.speciesId;
    const fishDef = FISH_DATABASE.find((f) => f.id === speciesId);
    const nameKo = fishDef?.nameKo ?? this.source.name;

    // ── 수율/등급 산출 (core computeFilletYield) — 양(수율)과 질(등급) 분리 ──
    const weightGram = this.source.weightG
      ?? (fishDef ? (fishDef.avgWeightRangeG[0] + fishDef.avgWeightRangeG[1]) / 2 : 800);
    const lengthCm = this.source.lengthCm
      ?? (fishDef ? (fishDef.avgSizeRangeCm[0] + fishDef.avgSizeRangeCm[1]) / 2 : 30);
    const yieldRes = computeFilletYield({
      profile: this.process.profile,
      weightGram, lengthCm,
      knife: this.knife,
      skillLevel: GameState.skills.filleting.level,
      cutAccuracyAvg: r.avgCutQuality,
      freshnessFactor: this.freshnessFactor(this.source),
      ikejimeDone: r.ikejimeDone, bledDone: r.bledDone,
    });

    // 필렛 가격 — **원물에 적용되던 판매가를 그대로 필렛 수로 분할** (사용자 가격 개편 2026-08-03:
    //  "필렛 덩어리 합가격 = 원물 가격" — 구 kg당 횟값×수율 방식은 350g 필렛이 헐값이 됐다.
    //  가치 상승은 사시미 접시 완성(모듬/단품 가격표)에서 발생).
    const totalValue = Math.max(1000, InventoryStore.getSellPrice(this.source));
    const perFillet = Math.max(500, Math.round(totalValue / yieldRes.filletCount));

    // 손질 스킬 XP 지급 (정확도·등급 비례)
    const gradeXp = yieldRes.grade === '특' ? 40 : yieldRes.grade === '상' ? 25 : yieldRes.grade === '중' ? 12 : 5;
    const xpGain = Math.round(20 + r.avgCutQuality * 40 + gradeXp);
    const lv = GameState.addFilletingXp(xpGain);

    // 손질 산출물은 전부 **활어 상태로 새 시계 시작** (사용자 지정 2026-07-29 — "처음은 활어로")
    const outCond = 'live' as const;
    const outSince = Date.now();
    const perFilletG = Math.round(yieldRes.yieldMassG / Math.max(1, yieldRes.filletCount));

    const seq = InventoryStore.nextCatchSeq();
    // **재장착(껍질 붙은 필렛 1장 박피)** = 순수 필렛 1개만 (원물 수율 계산 대상이 아님)
    const single = this.resumed;
    // 재장착 원물이 **엔가와**(inv_engwskin_)면 산출물도 순수 엔가와 (넙치류 2026-08-05)
    const engawaSrc = single && this.source.id.startsWith('inv_engwskin_');
    const flat = this.process.profile.bodyShape === 'flat';
    const outCount = single ? 1 : yieldRes.filletCount;
    const outWeight = single
      ? Math.max(1, Math.round((this.source.weightG ?? 100) * 0.88))   // 껍질 제거분
      : perFilletG;
    // 필렛 — pure_pilet 실사 로인 + 어종 색 (P1-2 파라메트릭 → 2026-07-30 실사 에셋)
    InventoryStore.addItem({
      id: engawaSrc ? `inv_engawa_${speciesId}_${seq}` : `inv_fillet_${speciesId}_${seq}`,
      name: engawaSrc
        ? `${nameKo} 순수 엔가와 (${yieldRes.grade}) ${outWeight}g`
        : `${nameKo} 순수 필렛 (${yieldRes.grade}) ${outWeight}g`,
      icon: '🍣', iconTexture: engawaSrc ? 'trim_engawa_icon' : this.trimFilletKey(speciesId),
      category: 'food', subCategory: engawaSrc ? '엔가와' : '손질 필렛',
      // 재장착(1장 세션)은 원물 필렛의 기존 몫을 승계 — 이중 분할 방지
      basePrice: single ? Math.max(500, Math.round(this.source.basePrice)) : perFillet,
      condition: outCond, conditionSinceMs: outSince,
      equippable: false,
      speciesId, lengthCm: this.source.lengthCm, weightG: outWeight,
    }, outCount);

    // ── 넙치류 통짜 완주 — 순수 엔가와 ×4 동반 지급 (엔가와 껍질 제거분).
    //  세션 중 지급된 '껍질 붙은 엔가와'는 아래 grantedLog 정리에서 회수(대체 지급)된다.
    if (flat && !single) {
      const engW = Math.max(1, Math.round((this.source.weightG ?? 800) * 0.02 * 0.88));
      InventoryStore.addItem({
        id: `inv_engawa_${speciesId}_${seq}`,
        name: `${nameKo} 순수 엔가와 (${yieldRes.grade}) ${engW}g`,
        icon: '🍣', iconTexture: 'trim_engawa_icon',
        category: 'food', subCategory: '엔가와',
        basePrice: Math.max(400, engW * 25),
        condition: outCond, conditionSinceMs: outSince,
        equippable: false,
        speciesId, lengthCm: this.source.lengthCm, weightG: engW,
      }, 4);
    }

    // ── 부산물 — 각 팝업 확인 시점에 **이미 즉시 지급**됨 (2026-08-03 개편).
    //  최종 완료 시 남아있는 중간 필렛(껍질 필렛)은 순수 필렛으로 대체되므로 회수한다.
    const bp = yieldRes.byproducts;
    this.grantedLog = this.grantedLog.filter((g) => {
      // 껍질 붙은 엔가와(inv_engwskin_)는 **통짜 완주에서만** 순수 엔가와로 대체 회수한다 —
      //  재장착(1장) 세션의 엔가와 산출물은 박피 대상이 아니었으므로 남긴다 (2026-08-05)
      if (!g.id.startsWith('inv_filletskin_') && !g.id.startsWith('inv_filletribs_')
        && !g.id.startsWith('inv_filletpin_') && !g.id.startsWith('inv_filletengw_')
        && !(!single && g.id.startsWith('inv_engwskin_'))) return true;
      // 재장착(1장) 세션 — 지아이 분리 2장 중 **박피된 1장만** 회수, 나머지 1장은 남긴다
      // (박피는 필렛 1장 처리 — 전량 회수하면 반쪽 하나가 증발. 2026-08-04)
      if (single && g.id.startsWith('inv_filletskin_') && g.qty > 1) {
        InventoryStore.removeQty(g.id, 1);
        g.qty -= 1;
        return true;
      }
      InventoryStore.removeQty(g.id, g.qty);
      return false;
    });
    // 원본 생선 1마리 소모
    InventoryStore.removeItem(this.source.id, false);

    // 결과 오버레이
    const c = this.scene.add.container(0, 0);
    // 결과 오버레이 — 고정 도마 rect 기준 (생선 회전 상태와 무관)
    const BX = this.boardX, BY = this.boardY, BW = this.boardW, BH = this.boardH;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.96);
    bg.fillRoundedRect(BX + 40, BY - 10, BW - 80, BH + 20, 8);
    bg.lineStyle(2, 0x4af2a1, 0.95);
    bg.strokeRoundedRect(BX + 40, BY - 10, BW - 80, BH + 20, 8);
    c.add(bg);
    const title = this.scene.add.text(BX + BW / 2, BY + 30, `손질 완료 — ${yieldRes.grade}등급`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '22px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const knifeName = this.knife ? this.knife.nameKo : '막칼(폴백)';
    const skinNote = bp.skinPieces > 0 ? ` · 껍질 x${bp.skinPieces}` : '';
    // 결과 본문 — 버튼(btnY-19) 위쪽 공간 안에 반드시 들어가야 한다 (AGENTS §4 겹침 금지).
    //  구 레이아웃은 12px·lineSpacing 7 5줄(≈100px)이 버튼 상단(boardY+boardH-44)을 약 8px 침범했다.
    const descTop = BY + 68;
    const descMaxH = (BY + BH - 44) - descTop - 8;
    const desc = this.scene.add.text(BX + BW / 2, descTop, [
      `${nameKo} ${engawaSrc ? '순수 엔가와' : '순수 필렛'} x${outCount} (장당 ${perFillet.toLocaleString()}원)`
      + (flat && !single ? ' · 순수 엔가와 x4' : ''),
      `부산물: 각 단계 팝업에서 보관 선택분 지급${skinNote}`,
      `수율 ${yieldRes.yieldMassG}g · 슬라이스 ${yieldRes.sliceCount}점 · 컷 정확도 ${(r.avgCutQuality * 100).toFixed(0)}%`,
      `칼: ${knifeName} · 시메 ${r.ikejimeDone ? 'O' : 'X'} · 방혈 ${r.bledDone ? 'O' : 'X'} · 손질 스킬 Lv.${lv.level}${lv.leveledUp ? ' (레벨업!)' : ` (+${xpGain} XP)`}`,
      this.grantFailed.length
        ? `⚠ 인벤토리 칸 부족 — ${this.grantFailed.length}종 미지급 (${this.grantFailed.slice(0, 2).join(', ')}…)`
        : yieldRes.undersizedForFillet ? '체장이 작아 회뜨기 비효율 — 통마리 판매/조림 권장' : '인벤토리(음식 탭)에 지급되었습니다.',
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
      color: yieldRes.undersizedForFillet ? '#ffce9a' : '#d0e8f5', align: 'center', lineSpacing: 4,
      // 긴 칼 이름·레벨업 문구가 결과 박스(boardW-80) 밖으로 나가지 않게 줄바꿈
      wordWrap: { width: BW - 140 },
    }).setOrigin(0.5, 0);
    // 줄바꿈으로 줄 수가 늘어도 버튼과 겹치지 않도록 넘칠 때만 축소
    fitTextHeight(desc, descMaxH);
    c.add([title, desc]);

    // 레벨업 배너 (강조 — 레벨업 시에만)
    if (lv.leveledUp) {
      const banner = this.scene.add.text(BX + BW / 2, BY + 54,
        `★ 손질 스킬 레벨업! Lv.${lv.level} ★`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffd257', fontStyle: 'bold',
          backgroundColor: '#3a2e0acc', padding: { x: 10, y: 3 },
        }).setOrigin(0.5);
      c.add(banner);
      this.scene.tweens.add({ targets: banner, scale: { from: 0.8, to: 1.08 }, yoyo: true, repeat: 2, duration: 220 });
    }

    // 버튼 — [다음 생선 손질](인벤에 finfish 어획물 남아 있으면) + [확인]
    const hasNext = !!this.cbs.onNext && InventoryStore.items.some(
      (i) => i.subCategory === '어획물' && getButcheryFamily(i.speciesId ?? '') === 'finfish',
    );
    const btnY = BY + BH - 25;
    const mkResultBtn = (bx: number, bw: number, label: string, fill: number, stroke: number, color: string, onClick: () => void): void => {
      const g = this.scene.add.graphics();
      g.fillStyle(fill, 0.95); g.fillRoundedRect(bx - bw / 2, btnY - 19, bw, 38, 6);
      g.lineStyle(2, stroke, 0.95); g.strokeRoundedRect(bx - bw / 2, btnY - 19, bw, 38, 6);
      const t = this.scene.add.text(bx, btnY, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color, fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(bx, btnY, bw, 38, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', onClick);
      c.add([g, t, hit]);
    };
    const cxm = BX + BW / 2;
    if (hasNext) {
      mkResultBtn(cxm - 92, 168, '다음 생선 손질', 0x14425e, 0x33b0e0, '#aee8ff', () => this.cbs.onNext!());
      mkResultBtn(cxm + 92, 150, '확인', 0x0d4a2e, 0x4af2a1, '#4af2a1', () => this.cbs.onComplete());
    } else {
      mkResultBtn(cxm, 160, '확인', 0x0d4a2e, 0x4af2a1, '#4af2a1', () => this.cbs.onComplete());
    }
    this.add(c);
    this.applyFix();
  }
}
