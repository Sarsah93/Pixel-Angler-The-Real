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
  ORIENTATION_LABEL, FISH_DATABASE,
} from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import { DraggablePanel } from './DraggablePanel.js';

const PANEL_W = 1080;
const PANEL_H = 620;

/** 어종별 몸통 팔레트 (파라메트릭 템플릿 주입값) */
const FISH_COLORS: Record<string, { body: number; belly: number; fin: number }> = {
  black_seabream: { body: 0x4a5560, belly: 0xb8bec6, fin: 0x333a44 },
  largescale_blackfish: { body: 0x2e3a46, belly: 0x9aa6b0, fin: 0x1e2830 },
  longtail_blackfish: { body: 0x35506a, belly: 0xa8c0d4, fin: 0x24384e },
  flatfish: { body: 0x6a5a3e, belly: 0xd8cdb4, fin: 0x4a3f2c },
  sea_bass: { body: 0x5a6a74, belly: 0xc6d0d6, fin: 0x3e4c56 },
  yellowtail: { body: 0x3e5a74, belly: 0xc0ccd4, fin: 0x2c4256 },
};
const DEFAULT_COLORS = { body: 0x50606c, belly: 0xbcc6cc, fin: 0x38444e };

export interface ButcheryCallbacks {
  onClose: () => void;
  /** 손질 완료 — 필렛 지급/원본 소모까지 끝난 뒤 호출 (도마 비우기용) */
  onComplete: () => void;
}

export class ButcheryPanel extends DraggablePanel {
  private source: InvItem;
  private process: ButcheryProcess;
  private cbs: ButcheryCallbacks;

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

  private butcheryMoveHandler: (p: Phaser.Input.Pointer) => void;
  private butcheryUpHandler: (p: Phaser.Input.Pointer) => void;

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
    super.destroy(fromScene);
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
      case 'chilled': return 0.75;
      case 'frozen': return 0.6;
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
    return 'black_seabream';
  }

  // ═══════════════════════════════════════════════════
  // 입력 (프리미티브별)
  // ═══════════════════════════════════════════════════
  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (this.process.finished) return;
    const stage = this.process.stage;
    if (!stage || !this.process.canAct()) return;
    const n = this.toNorm(p);
    if (!n) return;

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
  private refresh(): void {
    this.uiC.removeAll(true);
    this.drawFish();
    this.drawGuide();
    this.drawSidebar();
    this.applyFix();
  }

  /** 파라메트릭 생선 템플릿 — 방향 상태 + 손질 진행 플래그 기반 렌더 */
  private drawFish(): void {
    const g = this.fishG;
    g.clear();
    const o = this.process.orientation;
    const colors = FISH_COLORS[this.process.profile.speciesId] ?? DEFAULT_COLORS;
    const flat = this.process.profile.bodyShape === 'flat';
    const X = this.fishX, Y = this.fishY, W = this.fishW, H = this.fishH;
    const cx = X + W / 2, cy = Y + H / 2;
    const bodyH = H * (flat ? 0.72 : 0.56);

    // 작업대 (도마 배경)
    g.fillStyle(0x8a6a44, 1);
    g.fillRoundedRect(X - 16, Y - 26, W + 32, H + 52, 10);
    g.fillStyle(0xa8845a, 1);
    g.fillRoundedRect(X - 6, Y - 16, W + 12, H + 32, 8);

    if (this.process.finished || o === 'FLESH_UP') {
      // 필렛 뷰 — 분홍 살 슬랩 + 줄무늬 (+박피 전 껍질층)
      const peelsDone = (this.process.stage?.primitive === 'peel')
        ? (this.process.profile.filletCount - this.process.currentPullsLeft) : this.process.profile.filletCount;
      g.fillStyle(0xf0a0a0, 1);
      g.fillRoundedRect(X + W * 0.1, cy - bodyH * 0.3, W * 0.8, bodyH * 0.6, 18);
      g.lineStyle(1.4, 0xffffff, 0.5);
      for (let i = 1; i <= 5; i++) {
        const sx = X + W * (0.14 + i * 0.12);
        g.lineBetween(sx, cy - bodyH * 0.22, sx - W * 0.05, cy + bodyH * 0.22);
      }
      if (!this.process.finished && this.process.currentPullsLeft > 0) {
        // 남은 껍질층 (아래 어두운 띠) + 꼬리 손잡이
        g.fillStyle(colors.body, 0.95);
        g.fillRoundedRect(X + W * 0.1, cy + bodyH * 0.18, W * 0.8, bodyH * 0.14, 8);
        g.fillStyle(0x3a2c1e, 1);
        g.fillRoundedRect(X + W * 0.86, cy - bodyH * 0.1, W * 0.07, bodyH * 0.34, 5);
      }
      void peelsDone;
      return;
    }

    const mirror = o === 'FLIP';
    const headX = mirror ? X + W * 0.92 : X + W * 0.08;
    const tailX = mirror ? X + W * 0.06 : X + W * 0.94;
    const dir = mirror ? -1 : 1;

    // 몸통
    g.fillStyle(colors.body, 1);
    g.fillEllipse(cx, cy, W * 0.74, bodyH);
    // 배/등 밴드 (방향별)
    g.fillStyle(colors.belly, 0.9);
    if (o === 'BELLY_UP') g.fillEllipse(cx, cy - bodyH * 0.22, W * 0.66, bodyH * 0.34);
    else if (o === 'BACK_DOWN') g.fillEllipse(cx, cy - bodyH * 0.1, W * 0.66, bodyH * 0.5);
    else g.fillEllipse(cx, cy + bodyH * 0.18, W * 0.66, bodyH * 0.4);

    // 꼬리
    g.fillStyle(colors.fin, 1);
    g.fillTriangle(tailX, cy, tailX + dir * -W * 0.0, cy, tailX + dir * W * 0.06, cy - bodyH * 0.34);
    g.fillTriangle(tailX, cy, tailX + dir * W * 0.06, cy + bodyH * 0.34, tailX + dir * W * 0.02, cy);

    // 머리/눈/아가미 (BASE·FLIP에서만, 머리 분리 전)
    if (!this.headOff && (o === 'BASE' || o === 'FLIP')) {
      g.fillStyle(colors.body, 1);
      g.fillEllipse(headX + dir * W * 0.05, cy, W * 0.2, bodyH * 0.8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(headX + dir * W * 0.03, cy - bodyH * 0.16, 7);
      g.fillStyle(0x111418, 1);
      g.fillCircle(headX + dir * W * 0.035, cy - bodyH * 0.16, 3.6);
      g.lineStyle(2, colors.fin, 0.9);
      g.beginPath();
      g.arc(headX + dir * W * 0.1, cy, bodyH * 0.34, mirror ? Math.PI * 0.6 : -Math.PI * 0.4, mirror ? Math.PI * 1.4 : Math.PI * 0.4);
      g.strokePath();
    } else if (this.headOff && (o === 'BASE' || o === 'FLIP')) {
      // 머리 분리 단면
      g.fillStyle(0xd87878, 1);
      g.fillEllipse(headX + dir * W * 0.08, cy, W * 0.035, bodyH * 0.66);
    }

    // 비늘 오버레이 (제거 전 반짝임 점)
    const needScale = this.process.profile.hasScales && this.scaledSides < 2 && (o === 'BASE' || o === 'FLIP');
    if (needScale && !(this.scaledSides >= 1 && o === 'BASE')) {
      g.fillStyle(0xe8f0f6, 0.5);
      for (let i = 0; i < 40; i++) {
        const sx = cx + (((i * 73) % 100) / 100 - 0.5) * W * 0.6;
        const sy = cy + (((i * 37) % 100) / 100 - 0.5) * bodyH * 0.7;
        g.fillCircle(sx, sy, 2);
      }
    }

    // 내장 오버레이 (BELLY_UP, 개복 후·제거 전)
    if (o === 'BELLY_UP' && !this.gutted && this.process.stage?.id === 'gut_scoop') {
      g.fillStyle(0x8a3040, 0.9);
      g.fillEllipse(cx - W * 0.08, cy - bodyH * 0.2, W * 0.3, bodyH * 0.24);
    }

    // 항문 마커 (BACK_DOWN — 위쪽)
    if (o === 'BACK_DOWN') {
      g.fillStyle(0xffd257, 1);
      g.fillCircle(X + W * this.process.profile.anusRatio, cy - bodyH * 0.42, 3.5);
    }
  }

  /** 현재 스테이지 가이드 (노란 점선 칼선 / 탭 목표점 / 손잡이 표시) */
  private drawGuide(): void {
    const g = this.guideG;
    g.clear();
    const stage = this.process.stage;
    if (!stage || this.process.finished) return;
    if (!this.process.canAct()) return;   // 방향 불일치 시 가이드 숨김 (힌트만)

    const toPx = (p: CutPoint): [number, number] => [this.fishX + p.x * this.fishW, this.fishY + p.y * this.fishH];

    if (stage.primitive === 'guided_cut' && stage.cut) {
      const path = stage.cut.guidePath;
      g.lineStyle(2, 0xffd257, 0.95);
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
      g.fillStyle(0xffd257, 1);
      g.fillCircle(sx, sy, 5);
    } else if (stage.primitive === 'tap' && stage.tapPoint) {
      const [tx, ty] = toPx(stage.tapPoint);
      g.lineStyle(2, 0xff5a4a, 0.95);
      g.strokeCircle(tx, ty, 14);
      g.fillStyle(0xff5a4a, 0.9);
      g.fillCircle(tx, ty, 3);
    } else if (stage.primitive === 'peel') {
      // 손잡이 존 + 당김 방향 화살표
      g.lineStyle(2, 0x7fe6b0, 0.9);
      g.strokeRoundedRect(this.fishX + this.fishW * 0.74, this.fishY + this.fishH * 0.3, this.fishW * 0.2, this.fishH * 0.4, 8);
      g.lineStyle(3, 0xffd257, 0.95);
      const ay = this.fishY + this.fishH * 0.5;
      g.lineBetween(this.fishX + this.fishW * 0.7, ay, this.fishX + this.fishW * 0.24, ay);
      g.fillStyle(0xffd257, 1);
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

      // 반복/진행 표시
      if (stage.primitive === 'guided_cut' && this.process.currentStrokesLeft > 1) {
        mkText(sx, this.contentTop + 124, `남은 칼집: ${this.process.currentStrokesLeft}회`, 11, '#9fd0e4');
      }
      if (stage.primitive === 'peel') {
        mkText(sx, this.contentTop + 124, `남은 장: ${this.process.currentPullsLeft}`, 11, '#9fd0e4');
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
    }

    // 필렛/상태 요약
    mkText(sx, PANEL_H - 120,
      `필렛 ${this.process.filletsDone} / ${this.process.profile.filletCount}`
      + `   시메 ${this.process.ikejimeDone ? 'O' : 'X'} · 방혈 ${this.process.bledDone ? 'O' : 'X'} · 세척 ${this.washCount}회`,
      12, '#9fd0e4');
    mkText(sx, PANEL_H - 96,
      this.process.profile.bodyShape === 'flat' ? '광어 5장뜨기 (4필렛 + 중골)' : '삼면뜨기 (양살 2필렛 + 중골)',
      11, '#7a98ac');
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
    const r = this.process.result();
    const speciesId = this.process.profile.speciesId;
    const fishDef = FISH_DATABASE.find((f) => f.id === speciesId);
    const nameKo = fishDef?.nameKo ?? this.source.name;

    // 필렛 가격 — 어종 kg당 횟값 × 추정 중량 × 등급 배율 / 필렛 수
    const weightKg = (this.source.weightG
      ?? (fishDef ? (fishDef.avgWeightRangeG[0] + fishDef.avgWeightRangeG[1]) / 2 : 800)) / 1000;
    const perFillet = Math.max(1500, Math.round(
      (fishDef?.sashimiValuePerKg ?? 20000) * weightKg * r.gradeMult * 0.55 / r.filletCount,
    ));

    const seq = InventoryStore.nextCatchSeq();
    InventoryStore.addItem({
      id: `inv_fillet_${speciesId}_${seq}`,
      name: `${nameKo} 필렛 (${r.grade})`,
      icon: '🍣', iconTexture: 'food_assorted_sashimi',
      category: 'food', subCategory: '손질 필렛',
      basePrice: perFillet,
      condition: this.source.condition ?? 'fresh',
      equippable: false,
      speciesId, lengthCm: this.source.lengthCm,
    }, r.filletCount);
    InventoryStore.addItem({
      id: `inv_bone_${speciesId}_${seq}`,
      name: `${nameKo} 중골·머리 (육수용)`,
      icon: '🦴', category: 'food', subCategory: '부산물',
      basePrice: 600, equippable: false,
    }, 1);
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
    const title = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + 40, `손질 완료 — ${r.grade}등급`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '22px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const desc = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + 96, [
      `${nameKo} 필렛 x${r.filletCount} (장당 ${perFillet.toLocaleString()}원) + 중골·머리`,
      `컷 정확도 평균 ${(r.avgCutQuality * 100).toFixed(0)}% · 시메 ${r.ikejimeDone ? 'O' : 'X'} · 방혈 ${r.bledDone ? 'O' : 'X'}`,
      '인벤토리(음식 탭)에 지급되었습니다.',
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#d0e8f5', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x0d4a2e, 0.95);
    btnBg.fillRoundedRect(this.fishX + this.fishW / 2 - 80, this.fishY + this.fishH - 44, 160, 38, 6);
    btnBg.lineStyle(2, 0x4af2a1, 0.95);
    btnBg.strokeRoundedRect(this.fishX + this.fishW / 2 - 80, this.fishY + this.fishH - 44, 160, 38, 6);
    const btnTxt = this.scene.add.text(this.fishX + this.fishW / 2, this.fishY + this.fishH - 25, '확인', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const btnHit = this.scene.add.rectangle(this.fishX + this.fishW / 2, this.fishY + this.fishH - 25, 160, 38, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    btnHit.on('pointerdown', () => this.cbs.onComplete());
    c.add([title, desc, btnBg, btnTxt, btnHit]);
    this.add(c);
    this.applyFix();
  }
}
