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
  ButcheryProcess, getButcheryProfile, CutPoint, OrientationState,
  ORIENTATION_LABEL, FISH_DATABASE, FilletShape, getButcheryFamily,
  computeFilletYield, getBestKnife, KnifeSpec,
  TUNING,
} from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { DraggablePanel } from './DraggablePanel.js';
import { drawFishTemplate, getFishColors } from './FishTemplateRenderer.js';

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

    this.fishG = scene.add.graphics();
    this.guideG = scene.add.graphics();
    this.traceG = scene.add.graphics();
    this.uiC = scene.add.container(0, 0);
    this.add([this.fishG, this.guideG, this.traceG, this.uiC]);

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
    if (this.done || this.flipping || this.process.finished) return;
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
        this.refresh();
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
    if (this.process.finished || this.done || this.knifeLocked() || this.flipping) return;
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
      this.refresh();
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
    if (this.done || this.knifeLocked() || this.flipping) return;
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
          this.refresh();
        } else {
          this.updateFillBar(res.progress);
        }
      }
      this.lastFillPt = n;
    }
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
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
      this.refresh();
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
      this.refresh();
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
    this.uiC.removeAll(true);
    this.drawFish();
    if (!this.knifeLocked()) this.drawGuide();
    this.drawSidebar();
    if (this.knifeLocked()) this.drawKnifeLock();
    this.applyFix();
  }

  /** 뒤집기 연출 — 생선을 가로로 접었다 펴며 새 방향으로 리렌더 */
  private playFlipAnim(): void {
    this.flipping = true;
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

  /** 파라메트릭 생선 템플릿 — 방향 상태 + 손질 진행 플래그 기반 렌더 */
  private drawFish(): void {
    const g = this.fishG;
    g.clear();
    const X = this.fishX, Y = this.fishY, W = this.fishW, H = this.fishH;

    // 작업대 (도마 배경)
    g.fillStyle(0x8a6a44, 1);
    g.fillRoundedRect(X - 16, Y - 26, W + 32, H + 52, 10);
    g.fillStyle(0xa8845a, 1);
    g.fillRoundedRect(X - 6, Y - 16, W + 12, H + 32, 8);

    // 파라메트릭 생선 — FSM 진행 상태 주입 (공용 렌더러 — 도마/고스트와 동일 소스)
    // orientation은 화면 표시 방향(renderedOrientation) — 뒤집기 연출 중간(접힌 시점)에
    // 새 방향으로 교체된다 (process.orientation은 로직/게이트 기준).
    drawFishTemplate(g, { x: X, y: Y, w: W, h: H }, this.process.profile,
      getFishColors(this.process.profile.speciesId), {
        orientation: this.renderedOrientation,
        headOff: this.headOff,
        scaledSides: this.scaledSides,
        gutted: this.gutted,
        finished: this.process.finished,
        filletCount: this.process.profile.filletCount,
        currentPullsLeft: this.process.currentPullsLeft,
        stagePrimitive: this.process.stage?.primitive,
        stageId: this.process.stage?.id,
      });
  }

  /** 현재 스테이지 가이드 (노란 점선 칼선 / 탭 목표점 / 손잡이 표시) */
  private drawGuide(): void {
    const g = this.guideG;
    g.clear();
    const stage = this.process.stage;
    if (!stage || this.process.finished) return;
    // 방향 불일치 시에도 숨기지 않고 고스트(흐리게)로 표시 — "먹통" 방지.
    // (autoOrient on이면 대부분 정렬 상태라 고스트는 수동 전환 중에만 보임)
    const ghost = !this.process.canAct();
    const ga = ghost ? 0.28 : 0.95;

    const toPx = (p: CutPoint): [number, number] => [this.fishX + p.x * this.fishW, this.fishY + p.y * this.fishH];

    if (stage.primitive === 'guided_cut' && stage.cut) {
      const path = stage.cut.guidePath;
      g.lineStyle(2, 0xffd257, ga);
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = toPx(path[i - 1]);
        const [bx, by] = toPx(path[i]);
        // 점선
        const segs = Math.max(4, Math.floor(Math.hypot(bx - ax, by - ay) / 12));
        for (let s = 0; s < segs; s += 2) {
          const t0 = s / segs, t1 = Math.min(1, (s + 1) / segs);
          g.lineBetween(ax + (bx - ax) * t0, ay + (by - ay) * t0, ax + (bx - ax) * t1, ay + (by - ay) * t1);
        }
      }
      const [sx, sy] = toPx(path[0]);
      g.fillStyle(0xffd257, ga);
      g.fillCircle(sx, sy, 5);
    } else if (stage.primitive === 'tap' && stage.tapPoint) {
      const [tx, ty] = toPx(stage.tapPoint);
      g.lineStyle(2, 0xff5a4a, ga);
      g.strokeCircle(tx, ty, 14);
      g.fillStyle(0xff5a4a, ga);
      g.fillCircle(tx, ty, 3);
    } else if (stage.primitive === 'peel') {
      // 손잡이 존 + 당김 방향 화살표
      g.lineStyle(2, 0x7fe6b0, ghost ? 0.28 : 0.9);
      g.strokeRoundedRect(this.fishX + this.fishW * 0.74, this.fishY + this.fishH * 0.3, this.fishW * 0.2, this.fishH * 0.4, 8);
      g.lineStyle(3, 0xffd257, ga);
      const ay = this.fishY + this.fishH * 0.5;
      g.lineBetween(this.fishX + this.fishW * 0.7, ay, this.fishX + this.fishW * 0.24, ay);
      g.fillStyle(0xffd257, ga);
      g.fillTriangle(this.fishX + this.fishW * 0.24, ay, this.fishX + this.fishW * 0.3, ay - 8, this.fishX + this.fishW * 0.3, ay + 8);
    }
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
  }

  /**
   * 필렛 아이콘 텍스처 키 — filletShape 3종 × 어종 색 틴트 (P1-2).
   * 색이 겹치는 어종은 텍스처를 공유(키에 색 hex 포함).
   */
  private filletIconKey(shape: FilletShape, speciesId: string): string {
    const col = getFishColors(speciesId).body;
    const key = `fillet_${shape}_${col.toString(16)}`;
    if (!this.scene.textures.exists(key)) this.bakeFilletIcon(key, shape, col);
    return key;
  }

  /** filletShape별 파라메트릭 필렛 아이콘 (살색 + 어종 틴트 + 껍질 엣지) */
  private bakeFilletIcon(key: string, shape: FilletShape, speciesCol: number): void {
    const W = 64, H = 48;
    const g = this.scene.add.graphics();
    // 살색(분홍) + 어종 색 22% 블렌드 = 틴트
    const flesh = this.blendColor(0xf2a6a2, speciesCol, 0.22);
    const fleshDark = this.blendColor(flesh, 0x000000, 0.22);
    const mid = W / 2, cy = H / 2;
    if (shape === 'flat_wide') {
      // 넓은 흰살 슬랩 (광어) — 가로로 길고 얇게
      g.fillStyle(flesh, 1); g.fillRoundedRect(4, cy - 9, W - 8, 18, 8);
      g.fillStyle(speciesCol, 0.85); g.fillRect(4, cy + 6, W - 8, 4);           // 껍질 엣지
      g.lineStyle(1.2, 0xffffff, 0.5);
      for (let i = 1; i <= 6; i++) g.lineBetween(6 + i * 8, cy - 7, 4 + i * 8, cy + 5);
    } else if (shape === 'small') {
      // 작은 조각 (볼락/전갱이) — 통통한 소형
      g.fillStyle(flesh, 1); g.fillEllipse(mid, cy, W * 0.6, H * 0.5);
      g.fillStyle(speciesCol, 0.85); g.fillEllipse(mid, cy + 9, W * 0.55, 7);   // 껍질
      g.lineStyle(1.2, 0xffffff, 0.5);
      for (let i = 1; i <= 4; i++) g.lineBetween(mid - 14 + i * 7, cy - 8, mid - 16 + i * 7, cy + 6);
    } else {
      // loin_thick — 두꺼운 붉은살 로인 (방어/참돔) — 중앙 핏줄 라인
      g.fillStyle(flesh, 1); g.fillRoundedRect(6, cy - 12, W - 12, 24, 10);
      g.fillStyle(fleshDark, 1); g.fillRoundedRect(10, cy - 3, W - 20, 6, 3);   // 혈합육 라인
      g.fillStyle(speciesCol, 0.85); g.fillRect(6, cy + 8, W - 12, 4);          // 껍질 엣지
      g.lineStyle(1.4, 0xffffff, 0.45);
      for (let i = 1; i <= 5; i++) g.lineBetween(10 + i * 9, cy - 10, 7 + i * 9, cy + 6);
    }
    g.generateTexture(key, W, H);
    g.destroy();
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

    // 부산물·필렛은 원본 신선도를 승계 (같은 시점부터 감쇄)
    const srcCond = this.source.condition ?? 'fresh';
    const srcSince = this.source.conditionSinceMs ?? Date.now();
    const perFilletG = Math.round(yieldRes.yieldMassG / Math.max(1, yieldRes.filletCount));

    const seq = InventoryStore.nextCatchSeq();
    // 필렛 — 어종 색 틴트 + filletShape별 아이콘 (P1-2)
    InventoryStore.addItem({
      id: `inv_fillet_${speciesId}_${seq}`,
      name: `${nameKo} 필렛 (${yieldRes.grade}) ${perFilletG}g`,
      icon: '🍣', iconTexture: this.filletIconKey(this.process.profile.filletShape, speciesId),
      category: 'food', subCategory: '손질 필렛',
      basePrice: perFillet,
      condition: srcCond, conditionSinceMs: srcSince,
      equippable: false,
      speciesId, lengthCm: this.source.lengthCm, weightG: perFilletG,
    }, yieldRes.filletCount);
    // 부산물 ① 중골+머리 (매운탕/지리·육수) — 무게 비례가 + 신선도 승계
    InventoryStore.addItem({
      id: `inv_bone_${speciesId}_${seq}`,
      name: `${nameKo} 중골·머리 (육수용) ${yieldRes.byproducts.boneHeadG}g`,
      icon: '🦴', category: 'food', subCategory: '부산물', byproductKind: 'boneHead',
      basePrice: Math.max(400, Math.round(yieldRes.byproducts.boneHeadG * 3)),
      condition: srcCond, conditionSinceMs: srcSince, equippable: false,
      speciesId, weightG: yieldRes.byproducts.boneHeadG,
    }, 1);
    // 부산물 ② 껍질 (구이·육수) — 박피가 있는 어종만
    if (yieldRes.byproducts.skinPieces > 0) {
      InventoryStore.addItem({
        id: `inv_skin_${speciesId}_${seq}`,
        name: `${nameKo} 껍질 (구이·육수용)`,
        icon: '🫓', category: 'food', subCategory: '부산물', byproductKind: 'skin',
        basePrice: 250, condition: srcCond, conditionSinceMs: srcSince, equippable: false,
        speciesId,
      }, yieldRes.byproducts.skinPieces);
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
    const skinNote = yieldRes.byproducts.skinPieces > 0 ? ` · 껍질 x${yieldRes.byproducts.skinPieces}` : '';
    const desc = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + 74, [
      `${nameKo} 필렛 x${yieldRes.filletCount} (장당 ${perFillet.toLocaleString()}원)`,
      `부산물: 중골·머리 ${yieldRes.byproducts.boneHeadG}g${skinNote}  (매운탕/지리·육수)`,
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
