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
  ORIENTATION_LABEL, FISH_DATABASE, getButcheryFamily,
  computeFilletYield, getBestKnife, KnifeSpec,
  TUNING,
  SASHIMI_GUIDE_GROUP, SASHIMI_GUIDE_SHEET, LIVE_STAGE_GUIDE,
  resolveLiveGuideCut, guideCutByKey, GUIDE_CUT_DONE_KEY,
} from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { getFishColors } from './FishTemplateRenderer.js';
import { drawPixelButcherFish, butcherSpritesFor } from './PixelButcherFish.js';
import { SASHIMI_GUIDE_TEXTURE, guideFrameName, hasGuideFrames } from '../data/SashimiGuideFrames.js';

const PANEL_W = 1080;
const PANEL_H = 620;

export interface ButcheryCallbacks {
  onClose: () => void;
  /** 손질 완료 — 필렛 지급/원본 소모까지 끝난 뒤 호출 (도마 비우기용) */
  onComplete: () => void;
  /** [다음 생선 손질] — 인벤토리의 다음 finfish 어획물로 이어서 손질 (연속 흐름, P1-4). 없으면 미제공 */
  onNext?: () => void;
}

export class ButcheryPanel extends DraggablePanel {
  private source: InvItem;
  private process: ButcheryProcess;
  private cbs: ButcheryCallbacks;
  /** 보유 최고 회칼 (null이면 회뜨기 단계 잠금) */
  private knife: KnifeSpec | null;
  /** 결과 처리 완료 후 추가 입력 차단 */
  private done = false;

  // 생선 렌더 영역 (패널 로컬)
  private readonly fishX = 56;
  private readonly fishY = 190;
  private readonly fishW = 560;
  private readonly fishH = 210;

  private fishG!: Phaser.GameObjects.Graphics;
  private guideG!: Phaser.GameObjects.Graphics;
  private traceG!: Phaser.GameObjects.Graphics;
  private uiC!: Phaser.GameObjects.Container;

  // 트레이스/드래그 상태
  private tracing = false;
  private tracePoints: CutPoint[] = [];
  private lastFillPt: CutPoint | null = null;
  private peelStart: CutPoint | null = null;

  // 연출 상태 플래그 (렌더 전용)
  private scaledSides = 0;
  private headOff = false;
  private gutted = false;
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
  /** 유도 팝업 마지막 컷 키 — 전환 시에만 팝인 연출 */
  private lastPopupKey: string | null = null;
  private popupTween?: Phaser.Tweens.Tween;
  /**
   * 가이드 끄기 — true면 팝업 일러스트·외곽 화살표 큐·캡션을 숨긴다.
   * **유도선(drawGuide)은 토글과 무관하게 항상 표시.** GameState.flags에 영속.
   */
  private guideOff = false;

  // ── 가이드선 편집 (dev 전용, F9) — 유도선 끝점을 드래그해 위치 조정 + 좌표 복사 ──
  private editMode = false;
  private editDragIdx = -1;
  private editHandles: { pt: CutPoint; sx: number; sy: number }[] = [];
  private editHandleG?: Phaser.GameObjects.Graphics;
  private editReadout?: Phaser.GameObjects.Text;
  /** 합성 스윕선(비늘/내장/박피)의 편집 오버라이드 — stage.id별 편집 가능 배열 */
  private sweepOverride = new Map<string, CutPoint[]>();

  constructor(scene: Phaser.Scene, source: InvItem, cbs: ButcheryCallbacks) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2,
      y: (GAME_HEIGHT - PANEL_H) / 2,
      width: PANEL_W, height: PANEL_H,
      title: `생선 손질 — 회 뜨기 (${source.name})`,
      onClose: cbs.onClose, dim: true, depth: 900,
    });
    this.source = source;
    this.cbs = cbs;

    const speciesId = source.speciesId ?? this.guessSpecies(source);
    this.process = new ButcheryProcess(getButcheryProfile(speciesId), this.freshnessFactor(source));
    // 회칼 게이팅 — 인벤토리 '기타' 아이템에 회칼이 있어야 회뜨기(장 뜨기/박피)가 열린다
    this.knife = getBestKnife(InventoryStore.items.map((i) => i.id));

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

    // 키보드 — F/Space 요구 방향 뒤집기 · 1~5 방향 직접 · Enter 세척 확정
    this.keyHandler = (ev) => this.onKey(ev);
    scene.input.keyboard?.on('keydown', this.keyHandler);

    this.renderedOrientation = this.process.orientation;
    this.refresh();
    this.applyFix();
  }

  private onPointerDownBound(p: Phaser.Input.Pointer): void {
    this.onPointerDown(p);
  }

  override destroy(fromScene?: boolean): void {
    this.closeSheetViewer();
    this.stopGuideAnim();
    this.stopActionAnim();
    this.popupTween?.remove();
    this.popupTween = undefined;
    this.scene?.input?.off('pointermove', this.butcheryMoveHandler);
    this.scene?.input?.off('pointerup', this.butcheryUpHandler);
    this.scene?.input?.off('pointerdown', this.onPointerDownBound, this);
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
    if (this.done || this.flipping || this.actionAnim || this.process.finished) return;
    const stage = this.process.stage;
    if (!stage) return;
    if (ev.code === 'KeyF' || ev.code === 'Space') {
      // 요구 방향으로 원터치 정렬 (autoOrient on이면 대부분 이미 정렬 상태)
      if (this.process.orientation !== stage.orientation) {
        this.process.orientation = stage.orientation;
        this.refresh();
      }
    } else if (ev.code === 'Enter' || ev.code === 'NumpadEnter') {
      if (stage.primitive === 'wash' && this.process.submitWash()) {
        this.washCount++;
        this.flash(stage.id === 'bleed_ice' ? '방혈 완료 — 선도 보너스!' : '깨끗이 씻었습니다', true);
        const willFlip = this.process.orientation !== this.renderedOrientation;
        this.refresh();
        if (!willFlip && !this.process.finished) this.playActionAnim(stage);
        if (this.process.finished) this.showResult();
      }
    } else if (ev.code.startsWith('Digit')) {
      const idx = Number(ev.code.slice(5)) - 1;
      const orients: OrientationState[] = ['BASE', 'FLIP', 'BELLY_UP', 'BACK_DOWN', 'FLESH_UP'];
      if (idx >= 0 && idx < orients.length && this.process.orientation !== orients[idx]) {
        this.process.orientation = orients[idx];
        this.refresh();
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 좌표/판정 헬퍼
  // ═══════════════════════════════════════════════════
  /** 스크린 → 생선 bbox 정규화 (0~1). 영역 밖이면 null */
  private toNorm(p: Phaser.Input.Pointer, slack = 0.12): CutPoint | null {
    const lx = (p.x - this.x - this.fishX) / this.fishW;
    const ly = (p.y - this.y - this.fishY) / this.fishH;
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
    return id === 'tail_grip' || id.startsWith('fillet_') || id === 'peel';
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
    if (this.editMode) {            // dev 가이드 편집 — 핸들 드래그 시작 (손질 입력 차단)
      const lx = p.x - this.x, ly = p.y - this.y;
      let best = -1, bestD = 16;
      this.editHandles.forEach((h, i) => { const d = Math.hypot(lx - h.sx, ly - h.sy); if (d < bestD) { bestD = d; best = i; } });
      this.editDragIdx = best;
      return;
    }
    if (this.process.finished || this.done || this.knifeLocked() || this.flipping || this.actionAnim) return;
    const stage = this.process.stage;
    if (!stage) return;
    const n = this.toNorm(p);
    if (!n) return;
    // 방향 불일치 — 조용한 무시 대신 명확한 안내 (F/뒤집기 버튼 유도, 먹통 방지)
    if (!this.process.canAct()) {
      this.flash(`먼저 [${ORIENTATION_LABEL[stage.orientation]}] 방향으로 뒤집으세요 — F키 또는 [뒤집기] 버튼`, false);
      return;
    }

    if (stage.primitive === 'tap') {
      const tp = stage.tapPoint ?? { x: 0.16, y: 0.38 };
      const dist = Math.hypot(n.x - tp.x, n.y - tp.y);
      const r = this.process.submitTap(dist);
      this.flash(r.passed ? `시메 성공 (정확도 ${(r.quality * 100).toFixed(0)}%) — 선도가 유지됩니다` : '빗나갔습니다 — 눈 뒤 지점을 다시 탭하세요', r.passed);
      const willFlip = this.process.orientation !== this.renderedOrientation;
      this.refresh();
      if (r.passed && !willFlip) this.playActionAnim(stage);
    } else if (stage.primitive === 'guided_cut') {
      this.tracing = true;
      this.tracePoints = [n];
      this.traceG.clear();
    } else if (stage.primitive === 'drag_fill' || stage.primitive === 'scoop') {
      this.tracing = true;
      this.lastFillPt = n;
    } else if (stage.primitive === 'peel') {
      // 꼬리 손잡이(우측 끝)에서만 잡기 시작
      if (n.x > 0.72) this.peelStart = n;
      else this.flash('꼬리 쪽 손잡이를 잡고 시작하세요', false);
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (this.editMode) { this.updateEditDrag(p); return; }   // dev 편집 — 핸들 드래그
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
        // 칼선 렌더 (은색)
        this.traceG.lineStyle(2.2, 0xe8f4ff, 0.9);
        this.traceG.lineBetween(
          this.fishX + last.x * this.fishW, this.fishY + last.y * this.fishH,
          this.fishX + n.x * this.fishW, this.fishY + n.y * this.fishH,
        );
      }
    } else if (this.tracing && (stage.primitive === 'drag_fill' || stage.primitive === 'scoop')) {
      if (this.lastFillPt) {
        const d = Math.hypot(n.x - this.lastFillPt.x, n.y - this.lastFillPt.y);
        const res = this.process.submitFill(d * 0.28);
        if (res.stageDone) {
          if (stage.primitive === 'drag_fill') this.scaledSides++;
          else this.gutted = true;
          this.tracing = false;
          this.flash(stage.primitive === 'drag_fill' ? '비늘을 말끔히 벗겼습니다' : '내장을 비우고 척추 피를 긁었습니다', true);
          const willFlip = this.process.orientation !== this.renderedOrientation;
          this.refresh();
          if (!willFlip) this.playActionAnim(stage);
        } else {
          this.updateFillBar(res.progress);
        }
      }
      this.lastFillPt = n;
    }
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (this.editMode) { this.editDragIdx = -1; return; }   // dev 편집 — 드래그 종료
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
      this.refresh();
      if (r.passed && !willFlip && !this.process.finished) this.playActionAnim(stage);
      if (this.process.finished) this.showResult();
      return;
    }
    this.peelStart = null;

    // 가이드 컷 판정
    if (this.tracing && stage?.primitive === 'guided_cut') {
      this.tracing = false;
      const r = this.process.submitCut(this.tracePoints);
      this.tracePoints = [];
      this.scene.time.delayedCall(150, () => this.traceG.clear());
      if (!r.passed) {
        this.flash('가이드 선을 따라 다시 그어주세요 (커버율 부족)', false);
      } else {
        if (stage.id === 'head_flip') this.headOff = true;
        this.flash(r.stageDone
          ? `컷 성공 — 정확도 ${(r.quality * 100).toFixed(0)}%`
          : `칼집 ${r.strokesLeft}회 남음 (정확도 ${(r.quality * 100).toFixed(0)}%)`, true);
      }
      const willFlip = this.process.orientation !== this.renderedOrientation;
      this.refresh();
      // 컷 성공 액션 연출 — 방향 전환(플립 연출)이 이어지면 스킵 (플립이 피드백)
      if (r.passed && !willFlip && !this.process.finished) this.playActionAnim(stage);
      if (this.process.finished) this.showResult();
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
    this.popupTween?.remove();          // 파괴될 팝업 컨테이너 대상 트윈 정리
    this.popupTween = undefined;
    this.uiC.removeAll(true);
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
        this.renderedOrientation = this.process.orientation;
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
          },
        });
        this.flipTweens.push(t2);
      },
    });
    this.flipTweens.push(t1);
  }

  /** 회칼 미보유 잠금 오버레이 — 회뜨기 단계 진입 시 안내 + [통마리로 마무리] */
  private drawKnifeLock(): void {
    const X = this.fishX, Y = this.fishY, W = this.fishW, H = this.fishH;
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

    // 완료 오버레이
    this.uiC.removeAll(true);
    const c = this.scene.add.container(0, 0);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.96);
    bg.fillRoundedRect(this.fishX + 40, this.fishY - 10, this.fishW - 80, this.fishH + 20, 8);
    bg.lineStyle(2, 0xffb454, 0.95);
    bg.strokeRoundedRect(this.fishX + 40, this.fishY - 10, this.fishW - 80, this.fishH + 20, 8);
    const title = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + 50, '손질 완료 (통마리)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffd9a0', fontStyle: 'bold',
    }).setOrigin(0.5);
    const desc = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + 100,
      `${nameKo} 손질 (통마리) — ${price.toLocaleString()}원\n회칼이 없어 회뜨기는 하지 못했습니다. 통마리 판매/조림용으로 인벤토리에 지급되었습니다.`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e0d0b8', align: 'center', lineSpacing: 8,
      }).setOrigin(0.5, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x3a2e14, 0.95);
    btnBg.fillRoundedRect(this.fishX + this.fishW / 2 - 80, this.fishY + this.fishH - 44, 160, 38, 6);
    btnBg.lineStyle(2, 0xffb454, 0.95);
    btnBg.strokeRoundedRect(this.fishX + this.fishW / 2 - 80, this.fishY + this.fishH - 44, 160, 38, 6);
    const btnTxt = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + this.fishH - 25, '확인', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffd9a0', fontStyle: 'bold',
    }).setOrigin(0.5);
    const btnHit = this.scene.add.rectangle(this.fishX + this.fishW / 2, this.fishY + this.fishH - 25, 160, 38, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    btnHit.on('pointerdown', () => this.cbs.onComplete());
    c.add([bg, title, desc, btnBg, btnTxt, btnHit]);
    this.add(c);
    this.applyFix();
  }

  /** 도마 위 픽셀 생선 — 가이드 시트와 동일한 도트 스프라이트 (FSM 상태 기반) */
  private drawFish(): void {
    const g = this.fishG;
    g.clear();
    const X = this.fishX, Y = this.fishY, W = this.fishW, H = this.fishH;

    // 작업대 (도마 배경)
    g.fillStyle(0x8a6a44, 1);
    g.fillRoundedRect(X - 16, Y - 26, W + 32, H + 52, 10);
    g.fillStyle(0xa8845a, 1);
    g.fillRoundedRect(X - 6, Y - 16, W + 12, H + 32, 8);

    // 도마 픽셀 생선 — 어종별 스프라이트 세트(방어류=잿방어 형태 / 그 외=감성돔 가이드 형태).
    // orientation은 화면 표시 방향(renderedOrientation) — 뒤집기 연출 중간(접힌 시점)에
    // 새 방향으로 교체된다 (process.orientation은 로직/게이트 기준).
    // 방어류·돔류(가이드 원본군)는 스프라이트 실색 그대로(무틴트), 그 외 어종은 어종 색 약한 틴트.
    const speciesId = this.process.profile.speciesId;
    const sprites = butcherSpritesFor(speciesId);
    const tint = (SASHIMI_GUIDE_GROUP[speciesId] || sprites.nativeColor) ? null : getFishColors(speciesId).body;
    drawPixelButcherFish(g, { x: X, y: Y, w: W, h: H }, tint, {
      orientation: this.renderedOrientation,
      headOff: this.headOff,
      scaledSides: this.scaledSides,
      gutted: this.gutted,
      hasScales: this.process.profile.hasScales,
      finished: this.process.finished,
      currentPullsLeft: this.process.currentPullsLeft,
      anusRatio: this.process.profile.anusRatio,
      stageId: this.process.stage?.id,
    }, sprites);
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
    // 방향 불일치(수동 이탈) 시엔 좌표가 어긋나므로 유도선 숨김 — autoOrient로 대부분 정렬됨
    if (this.process.orientation !== this.renderedOrientation) return;
    const stage = this.process.stage;
    if (!stage) return;
    const g = this.guideG;
    if (stage.primitive === 'guided_cut' && stage.cut) {
      this.strokeGuideLine(g, stage.cut.guidePath);
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
  private strokeGuideLine(g: Phaser.GameObjects.Graphics, path: CutPoint[]): void {
    const pts = path.map((p) => this.toPanelPx(p));
    if (pts.length < 2) return;
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
  /** 합성 스윕선(비늘/내장/박피)의 편집 가능 경로 — 오버라이드 없으면 기본값 생성 */
  private sweepPathFor(stage: ButcheryStage): CutPoint[] {
    let p = this.sweepOverride.get(stage.id);
    if (!p) {
      p = stage.primitive === 'peel' ? [{ x: 0.9, y: 0.5 }, { x: 0.14, y: 0.5 }]
        : stage.primitive === 'scoop' ? [{ x: 0.85, y: 0.55 }, { x: 0.28, y: 0.55 }]
          : [{ x: 0.85, y: 0.5 }, { x: 0.28, y: 0.5 }];   // drag_fill
      this.sweepOverride.set(stage.id, p);
    }
    return p;
  }

  /** 현재 스테이지의 편집 대상 점들(가변 참조) — wash는 없음 */
  private editablePoints(): CutPoint[] | null {
    const stage = this.process.stage;
    if (!stage) return null;
    if (stage.primitive === 'guided_cut' && stage.cut) return stage.cut.guidePath;
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
    this.flash(this.editMode ? '가이드 편집 ON — 끝점을 드래그, [복사]로 좌표 획득' : '가이드 편집 OFF', true);
    this.refresh();
  }

  /** 편집 오버레이(핸들 + 좌표 리드아웃 + 복사 버튼) — editMode일 때 doRefresh에서 렌더 */
  private drawGuideEditor(): void {
    const pts = this.editablePoints();
    const stage = this.process.stage;
    if (!pts || !stage) return;
    this.editHandles = pts.map((pt) => ({ pt, sx: this.fishX + pt.x * this.fishW, sy: this.fishY + pt.y * this.fishH }));
    this.editHandleG = this.scene.add.graphics();
    this.uiC.add(this.editHandleG);
    this.paintEditHandles();

    // 좌표 리드아웃(도마 위 좌상단) + 복사 버튼
    const bx = this.fishX, by = this.fishY - 66;
    const box = this.scene.add.graphics();
    box.fillStyle(0x0a1420, 0.92); box.fillRoundedRect(bx, by, 424, 54, 5);
    box.lineStyle(1.2, 0x00c8e0, 0.9); box.strokeRoundedRect(bx, by, 424, 54, 5);
    this.uiC.add(box);
    this.editReadout = this.scene.add.text(bx + 8, by + 6, this.formatEditPath(stage, pts), {
      fontFamily: 'monospace', fontSize: '11px', color: '#bfe8ff', wordWrap: { width: 322 },
    });
    this.uiC.add(this.editReadout);
    const cbx = bx + 348, cby = by + 8;
    const cbg = this.scene.add.graphics();
    cbg.fillStyle(0x1a3a4a, 0.98); cbg.fillRoundedRect(cbx, cby, 66, 38, 4);
    cbg.lineStyle(1.2, 0x33d0e8, 1); cbg.strokeRoundedRect(cbx, cby, 66, 38, 4);
    const ct = this.scene.add.text(cbx + 33, cby + 19, '복사', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#aef0ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const chit = this.scene.add.rectangle(cbx + 33, cby + 19, 66, 38, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    chit.on('pointerdown', () => this.copyEditPath(stage, this.editHandles.map((e) => e.pt)));
    this.uiC.add([cbg, ct, chit]);
  }

  private paintEditHandles(): void {
    const g = this.editHandleG;
    if (!g) return;
    g.clear();
    this.editHandles.forEach((h, i) => {
      const single = this.editHandles.length === 1;
      const col = single ? 0xff5a4a : (i === 0 ? 0x2ecc71 : (i === this.editHandles.length - 1 ? 0xff3b30 : 0xffd257));
      g.fillStyle(col, 0.92); g.fillCircle(h.sx, h.sy, 7);
      g.lineStyle(2, 0x00e0ff, 1); g.strokeCircle(h.sx, h.sy, 8.5);
    });
  }

  private formatEditPath(stage: ButcheryStage, pts: CutPoint[]): string {
    const f = (p: CutPoint): string => `{ x: ${p.x.toFixed(3)}, y: ${p.y.toFixed(3)} }`;
    const arr = `[${pts.map(f).join(', ')}]`;
    if (stage.primitive === 'guided_cut') return `cut('${stage.id}', '${stage.orientation}', ${arr})`;
    if (stage.primitive === 'tap') return `tapPoint: ${f(pts[0])}`;
    return `${stage.id} (${stage.primitive}) 스윕: ${arr}`;
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
    const nx = Phaser.Math.Clamp((p.x - this.x - this.fishX) / this.fishW, 0, 1);
    const ny = Phaser.Math.Clamp((p.y - this.y - this.fishY) / this.fishH, 0, 1);
    h.pt.x = nx; h.pt.y = ny;
    h.sx = this.fishX + nx * this.fishW; h.sy = this.fishY + ny * this.fishH;
    this.drawGuide();
    this.paintEditHandles();
    const stage = this.process.stage;
    if (stage && this.editReadout) this.editReadout.setText(this.formatEditPath(stage, this.editHandles.map((e) => e.pt)));
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
  /** 정규화(0~1) → 패널 로컬 px */
  private toPanelPx(p: CutPoint): [number, number] {
    return [this.fishX + p.x * this.fishW, this.fishY + p.y * this.fishH];
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
    if (this.done || this.process.finished || this.flipping || this.knifeLocked()) return;
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
      drawFn = arrowLoop(arrowCueFor(stage.cut.guidePath));
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
      // 문지르기 — 원물 위쪽 바깥에서 꼬리→머리(좌향) 화살표 (시트 선-1·선-7과 동일)
      drawFn = arrowLoop({ ax: this.fishX + this.fishW / 2, ay: this.fishY - 16, ang: Math.PI });
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

  /**
   * 조작 성공 액션 연출 — 프리미티브별 애니 (입력 차단, actionAnimMs).
   * 완료 시 가이드 루프 재시작. 방향 전환(플립)이 이어질 때는 호출측이 스킵.
   */
  private playActionAnim(stage: { primitive: string; cut?: { guidePath: CutPoint[] }; tapPoint?: CutPoint } | null): void {
    if (!stage || !this.scene) return;
    this.stopActionAnim();
    this.stopGuideAnim();
    const g = this.actionAnimG;
    this.actionAnim = true;
    let drawFn: (t: number) => void;

    if (stage.primitive === 'guided_cut') {
      const path = stage.cut?.guidePath ?? [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }];
      drawFn = (t) => {
        g.clear();
        // 지나간 자리 = 밝은 절개선 + 여열 글로우
        g.lineStyle(6, 0xff8a5a, 0.22);
        this.strokePathPartial(g, path, t);
        g.lineStyle(3.2, 0xffffff, 0.9);
        this.strokePathPartial(g, path, t);
        const p = this.pathPointAt(path, t);
        this.drawKnifeGlyph(g, p.x, p.y, p.ang, 1);
        // 스파크
        for (let k = 0; k < 4; k++) {
          const a = t * 20 + k * 1.7;
          g.fillStyle(0xffe28a, 0.7 * (1 - t));
          g.fillCircle(p.x + Math.cos(a) * 9, p.y + Math.sin(a) * 9, 1.6);
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
      // 빠른 3연속 스와이프 + 부스러기 튐 (비늘/내장 마무리)
      drawFn = (t) => {
        g.clear();
        for (let k = 0; k < 3; k++) {
          const tt = Math.max(0, Math.min(1, t * 2.2 - k * 0.35));
          if (tt <= 0) continue;
          const y = this.fishY + this.fishH * (0.36 + k * 0.14);
          const x0 = this.fishX + this.fishW * 0.72;
          const x1 = this.fishX + this.fishW * (0.72 - 0.5 * tt);
          g.lineStyle(3, 0xd8ecf8, 0.7 * (1 - tt * 0.6));
          g.lineBetween(x0, y, x1, y);
          g.fillStyle(0xbfd8e8, 0.8 * (1 - tt));
          g.fillCircle(x1 + 6, y - 6 - tt * 14, 1.8);
          g.fillCircle(x1 + 14, y - 3 - tt * 20, 1.4);
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
        this.startGuideAnim();
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

    // 진행도
    mkText(sx, this.contentTop + 16,
      this.process.finished
        ? '손질 완료!'
        : `단계 ${this.process.stageIndex + 1} / ${this.process.stageCount} — ${stage?.label ?? ''}`,
      15, '#ffe28a', true);

    if (!this.process.finished && stage) {
      mkText(sx, this.contentTop + 46, stage.guide, 12, '#d0e8f5');

      // 방향 게이트 상태
      const ok = this.process.canAct();
      mkText(sx, this.contentTop + 100,
        ok ? `방향 OK — ${ORIENTATION_LABEL[this.process.orientation]}`
          : `${ORIENTATION_LABEL[stage.orientation]} 방향으로 바꿔주세요`,
        12, ok ? '#7fe6b0' : '#ff9a6a', true);

      if (!ok) {
        // 원터치 뒤집기 대형 버튼 — 불일치 상태에서 즉시 요구 방향으로 (F키 동일)
        const by = this.contentTop + 122;
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x3a2e14, 0.98);
        bg.fillRoundedRect(sx, by, 220, 32, 5);
        bg.lineStyle(2, 0xffd257, 1);
        bg.strokeRoundedRect(sx, by, 220, 32, 5);
        const t = this.scene.add.text(sx + 110, by + 16, `뒤집기 → ${ORIENTATION_LABEL[stage.orientation]} (F)`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffd257', fontStyle: 'bold',
        }).setOrigin(0.5);
        const hit = this.scene.add.rectangle(sx + 110, by + 16, 220, 32, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          this.process.orientation = stage.orientation;
          this.refresh();
        });
        this.uiC.add([bg, t, hit]);
      } else {
        // 반복/진행 표시
        if (stage.primitive === 'guided_cut' && this.process.currentStrokesLeft > 1) {
          mkText(sx, this.contentTop + 124, `남은 칼집: ${this.process.currentStrokesLeft}회`, 11, '#9fd0e4');
        }
        if (stage.primitive === 'peel') {
          mkText(sx, this.contentTop + 124, `남은 장: ${this.process.currentPullsLeft}`, 11, '#9fd0e4');
        }
      }

      // 방향(Orient) 버튼
      const orients: OrientationState[] = ['BASE', 'FLIP', 'BELLY_UP', 'BACK_DOWN', 'FLESH_UP'];
      orients.forEach((o, i) => {
        const bx = sx + (i % 2) * 170;
        const by = this.contentTop + 160 + Math.floor(i / 2) * 38;
        const sel = this.process.orientation === o;
        const need = stage.orientation === o;
        const bg = this.scene.add.graphics();
        bg.fillStyle(sel ? 0x155a7c : 0x0e1c2d, 0.95);
        bg.fillRoundedRect(bx, by, 160, 30, 4);
        bg.lineStyle(1.5, sel ? 0x5cd0ff : need ? 0xffd257 : 0x2a5a8a, 0.95);
        bg.strokeRoundedRect(bx, by, 160, 30, 4);
        const t = this.scene.add.text(bx + 80, by + 15, ORIENTATION_LABEL[o], {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
          color: sel ? '#aee8ff' : need ? '#ffd257' : '#8faabf',
        }).setOrigin(0.5);
        const hit = this.scene.add.rectangle(bx + 80, by + 15, 160, 30, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => { this.process.orientation = o; this.refresh(); });
        this.uiC.add([bg, t, hit]);
      });

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
            if (this.process.finished) this.showResult();
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
    mkText(sx, PANEL_H - 54, '키: F/Space 뒤집기 · 1~5 방향 · Enter 세척', 10, '#607b8e');

    // 가이드 켜기/끄기 토글 (전 어종 — 끄더라도 유도선은 항상 표시)
    this.drawGuideToggle();
    if (import.meta.env.DEV) this.drawEditToggle();   // dev — 가이드선 편집 토글

    // 삼면뜨기 픽셀 가이드 슬롯 (돔류 — 현재 스테이지의 가이드 컷 + 전체 시트 버튼)
    this.drawGuideSlot();
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
  // 삼면뜨기 픽셀 가이드 (선행 9컷 + 본편 38컷 — SASHIMI_PIXEL_GUIDE_SPEC §4-A/§4-B)
  // ═══════════════════════════════════════════════════
  /** 현재 스테이지의 가이드 컷 해소 — 다회 스테이지는 진행 회차로 컷 전환 */
  private currentGuideCutKey(): string | null {
    if (this.process.finished) return GUIDE_CUT_DONE_KEY;
    const stage = this.process.stage;
    if (!stage) return null;
    // 진행 회차 = 완료한 스트로크/당김 수 (스테이지 시작 시 0)
    let passIdx = 0;
    if (stage.primitive === 'guided_cut' && stage.cut?.strokesRequired) {
      passIdx = stage.cut.strokesRequired - this.process.currentStrokesLeft;
    } else if (stage.primitive === 'peel' && stage.pullsRequired) {
      passIdx = stage.pullsRequired - this.process.currentPullsLeft;
    }
    return resolveLiveGuideCut(stage.id, passIdx)?.key ?? null;
  }

  /** 사이드바 [전체 시트] 버튼 + 캡션 (일러스트는 원물 주변 팝업으로 이동 — drawGuideCutPopup) */
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

    // 가이드 꺼짐이면 여기서 종료 — 시트 버튼(수동 열람)만 남기고 캡션·팝업은 숨김
    if (this.guideOff) { this.lastPopupKey = null; return; }

    // 현재 컷 캡션 (버튼 아래 — 팝업 일러스트의 텍스트 보조)
    const key = this.currentGuideCutKey();
    const cut = key ? guideCutByKey(key) : undefined;
    if (cut) {
      const cap = this.scene.add.text(bx, by + 32, cut.caption, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#9fb8c8',
        wordWrap: { width: PANEL_W - bx - 28 }, lineSpacing: 2,
      });
      this.uiC.add(cap);
    }

    // 유도 팝업 (원물 주변 — 도마 위쪽)
    this.drawGuideCutPopup();
  }

  /**
   * 유도 팝업 — 현재 스테이지의 시트 컷 일러스트가 **원물 주변(도마 위쪽)에서 팝업**.
   * 일러스트 안에 시트의 화살표·절단선이 들어 있어 "안내하듯" 행동을 유도한다
   * (원물 자체에는 아무 표시 없음). 스테이지/회차 전환 시 팝인 연출.
   */
  private drawGuideCutPopup(): void {
    if (!this.guideSpeciesOk) { this.lastPopupKey = null; return; }
    const key = this.currentGuideCutKey();
    if (!key) { this.lastPopupKey = null; return; }
    const cut = guideCutByKey(key);

    const imgW = 168, imgH = 99;   // 도마 위 공간(contentTop~보드 상단 164px)에 맞춤
    const cx = this.fishX + this.fishW - imgW / 2 - 2;
    const cy = this.contentTop + 10 + imgH / 2;
    const cont = this.scene.add.container(cx, cy);
    const frame = this.scene.add.image(0, 0, SASHIMI_GUIDE_TEXTURE, guideFrameName(key))
      .setDisplaySize(imgW, imgH);
    const border = this.scene.add.graphics();
    border.lineStyle(2, 0xffd257, 0.95);
    border.strokeRoundedRect(-imgW / 2 - 2, -imgH / 2 - 2, imgW + 4, imgH + 4, 5);
    const chipLabel = cut?.pre !== undefined ? `선-${cut.pre}` : `${cut?.panel ?? '?'} / 38`;
    const chip = this.scene.add.text(-imgW / 2 + 2, -imgH / 2 + 2, `가이드 ${chipLabel}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ffe28a', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 3, y: 1 },
    });
    cont.add([frame, border, chip]);
    this.uiC.add(cont);

    // 스테이지/회차 전환 시 팝인 (동일 컷 리렌더는 조용히)
    if (this.lastPopupKey !== key) {
      this.lastPopupKey = key;
      this.popupTween?.remove();
      cont.setScale(0.62).setAlpha(0.3);
      this.popupTween = this.scene.tweens.add({
        targets: cont, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut',
      });
    }
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
  // 손질 부산물/필렛 아이콘 — trimmings 실사 에셋 (머리는 어종별 색 변형)
  // ═══════════════════════════════════════════════════
  /** 어종별 머리 아이콘 키 — 감성돔 원본 기준, 돔류는 색/무늬 변형 (참돔 붉게·돌돔 아가미 줄무늬) */
  private trimHeadKey(speciesId: string): string {
    // 감성돔 원본(trim_head)을 기준으로 돔류별 색/무늬만 바꿔 재사용 (사용자 지시 2026-07-30)
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
    const key = speciesId === 'black_seabream' ? 'trim_head' : `trimhead_${speciesId}`;
    this.bakeTintedTrim('trim_head', key, spec.mult, spec.stripes ?? false);
    return this.scene.textures.exists(key) ? key : 'trim_head';
  }

  /** 어종별 필렛 아이콘 키 — pure_pilet 로인 사진 + 은은한 어종 색 (흰살 옅게 / 붉은살 진하게) */
  private trimFilletKey(speciesId: string): string {
    const body = getFishColors(speciesId).body;
    const key = `trimfillet_${body.toString(16)}`;
    this.bakeTintedTrim('trim_fillet', key, this.blendColor(0xffffff, body, 0.26), false);
    return this.scene.textures.exists(key) ? key : 'trim_fillet';
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

  /** 채움 진행 바 (비늘/내장 — 즉석 표시) */
  private updateFillBar(progress: number): void {
    this.traceG.clear();
    const bx = this.fishX, by = this.fishY - 40, bw = this.fishW;
    this.traceG.fillStyle(0x101820, 0.9);
    this.traceG.fillRoundedRect(bx, by, bw, 12, 4);
    this.traceG.fillStyle(0x4af2a1, 0.95);
    this.traceG.fillRoundedRect(bx, by, bw * Math.min(1, progress), 12, 4);
  }

  private flashMsg?: Phaser.GameObjects.Text;
  private flash(msg: string, good: boolean): void {
    this.flashMsg?.destroy();
    this.flashMsg = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + this.fishH + 34, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px',
      color: good ? '#7fe6b0' : '#ff9a6a', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 10, y: 5 },
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

    // 필렛 가격 — 어종 kg당 횟값 × 실제 수율(kg) × 등급 배율 / 필렛 수
    const totalValue = Math.round(
      (fishDef?.sashimiValuePerKg ?? 20000) * (yieldRes.yieldMassG / 1000) * yieldRes.gradeMult,
    );
    const perFillet = Math.max(1500, Math.round(totalValue / yieldRes.filletCount));

    // 손질 스킬 XP 지급 (정확도·등급 비례)
    const gradeXp = yieldRes.grade === '특' ? 40 : yieldRes.grade === '상' ? 25 : yieldRes.grade === '중' ? 12 : 5;
    const xpGain = Math.round(20 + r.avgCutQuality * 40 + gradeXp);
    const lv = GameState.addFilletingXp(xpGain);

    // 손질 산출물은 전부 **활어 상태로 새 시계 시작** (사용자 지정 2026-07-29 — "처음은 활어로")
    const outCond = 'live' as const;
    const outSince = Date.now();
    const perFilletG = Math.round(yieldRes.yieldMassG / Math.max(1, yieldRes.filletCount));

    const seq = InventoryStore.nextCatchSeq();
    // 필렛 — pure_pilet 실사 로인 + 어종 색 (P1-2 파라메트릭 → 2026-07-30 실사 에셋)
    InventoryStore.addItem({
      id: `inv_fillet_${speciesId}_${seq}`,
      name: `${nameKo} 필렛 (${yieldRes.grade}) ${perFilletG}g`,
      icon: '🍣', iconTexture: this.trimFilletKey(speciesId),
      category: 'food', subCategory: '손질 필렛',
      basePrice: perFillet,
      condition: outCond, conditionSinceMs: outSince,
      equippable: false,
      speciesId, lengthCm: this.source.lengthCm, weightG: perFilletG,
    }, yieldRes.filletCount);

    // ── 부산물 — 어종명 접두 개별 아이템 (매운탕 3종 + 내장 + 껍질) ──
    const bp = yieldRes.byproducts;
    // 부산물 아이콘 = trimmings 실사 에셋 (머리는 어종별 색 변형 / 부위별 전용 뼈 에셋)
    const byproductTex = (kind: 'head' | 'spine' | 'rib' | 'pin' | 'viscera'): string =>
      kind === 'head' ? this.trimHeadKey(speciesId)
        : kind === 'spine' ? 'trim_spine'
          : kind === 'rib' ? 'trim_rib'
            : kind === 'pin' ? 'trim_pin'
              : 'trim_guts';   // viscera
    const addByproduct = (
      kind: 'head' | 'spine' | 'rib' | 'pin' | 'viscera', label: string, icon: string,
      weightG: number, priceFactor: number,
    ): void => {
      if (weightG <= 0) return;
      InventoryStore.addItem({
        id: `inv_byp_${kind}_${speciesId}_${seq}`,
        name: `${nameKo} ${label} ${weightG}g`,
        icon, iconTexture: byproductTex(kind),
        category: 'food', subCategory: '부산물', byproductKind: kind,
        basePrice: Math.max(200, Math.round(weightG * priceFactor)),
        condition: outCond, conditionSinceMs: outSince, equippable: false,
        speciesId, weightG,
        // 내장 = 신선도 급감 프로필 (활어 10분 → 나쁨 → 1시간 후 부패)
        ...(kind === 'viscera' ? { condProfile: 'viscera' as const } : {}),
      }, 1);
    };
    addByproduct('head', '생선 머리', '🐟', bp.headG, 3);        // 매운탕/지리·육수
    addByproduct('spine', '척추뼈', '🦴', bp.spineG, 3);          // 매운탕/지리·육수
    addByproduct('rib', '갈빗대뼈', '🍖', bp.ribG, 3);            // 매운탕/지리·육수
    addByproduct('pin', '가시뼈', '🦴', bp.pinBoneG, 2);          // 잔가시(핀본) — 육수/폐기
    addByproduct('viscera', '내장', '🫀', bp.visceraG, 1.5);      // 밑밥 전환('만들기')
    // 껍질 (구이·육수) — 박피가 있는 어종만, 필렛 수만큼
    if (bp.skinPieces > 0) {
      InventoryStore.addItem({
        id: `inv_skin_${speciesId}_${seq}`,
        name: `${nameKo} 껍질`,
        icon: '🫓', iconTexture: 'trim_skin',
        category: 'food', subCategory: '부산물', byproductKind: 'skin',
        basePrice: 250, condition: outCond, conditionSinceMs: outSince, equippable: false,
        speciesId,
      }, bp.skinPieces);
    }
    // 원본 생선 1마리 소모
    InventoryStore.removeItem(this.source.id, false);

    // 결과 오버레이
    const c = this.scene.add.container(0, 0);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.96);
    bg.fillRoundedRect(this.fishX + 40, this.fishY - 10, this.fishW - 80, this.fishH + 20, 8);
    bg.lineStyle(2, 0x4af2a1, 0.95);
    bg.strokeRoundedRect(this.fishX + 40, this.fishY - 10, this.fishW - 80, this.fishH + 20, 8);
    c.add(bg);
    const title = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + 30, `손질 완료 — ${yieldRes.grade}등급`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '22px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const knifeName = this.knife ? this.knife.nameKo : '막칼(폴백)';
    const skinNote = bp.skinPieces > 0 ? ` · 껍질 x${bp.skinPieces}` : '';
    const desc = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + 74, [
      `${nameKo} 필렛 x${yieldRes.filletCount} (장당 ${perFillet.toLocaleString()}원)`,
      `부산물: 머리 ${bp.headG}g · 척추뼈 ${bp.spineG}g · 갈빗대뼈 ${bp.ribG}g (매운탕) · 내장 ${bp.visceraG}g (밑밥)${skinNote}`,
      `수율 ${yieldRes.yieldMassG}g · 슬라이스 ${yieldRes.sliceCount}점 · 컷 정확도 ${(r.avgCutQuality * 100).toFixed(0)}%`,
      `칼: ${knifeName} · 시메 ${r.ikejimeDone ? 'O' : 'X'} · 방혈 ${r.bledDone ? 'O' : 'X'} · 손질 스킬 Lv.${lv.level}${lv.leveledUp ? ' (레벨업!)' : ` (+${xpGain} XP)`}`,
      yieldRes.undersizedForFillet ? '체장이 작아 회뜨기 비효율 — 통마리 판매/조림 권장' : '인벤토리(음식 탭)에 지급되었습니다.',
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
      color: yieldRes.undersizedForFillet ? '#ffce9a' : '#d0e8f5', align: 'center', lineSpacing: 7,
    }).setOrigin(0.5, 0);
    c.add([title, desc]);

    // 레벨업 배너 (강조 — 레벨업 시에만)
    if (lv.leveledUp) {
      const banner = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + 54,
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
    const btnY = this.fishY + this.fishH - 25;
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
    const cxm = this.fishX + this.fishW / 2;
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
