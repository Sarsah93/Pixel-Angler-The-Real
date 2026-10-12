/**
 * @file FarmWorkPanel.ts
 * @description 238차 — 텃밭 작업 장면(사용자 제안 「까다로움을 딸깍이 아니라 실제 동작 · 과정 · 시간으로」)
 *
 * 관리 작업 하나(지주 세우기 · 유인 · 첫 꽃 · 곁순 · 웃거름 · 약 치기 · 가식 · 멀칭 · 병든 것 걷어 내기)를
 * 작업 종류(`CareWorkKind`)에 맞는 짧은 손놀림으로 한다. 왼쪽은 포기 그림(절차 픽셀 그래픽), 오른쪽은 방법 · 걸리는 시간.
 *  - targets: 포기 그림의 표시(곁순 · 첫 꽃 · 병든 열매)를 하나씩 누른다. 줄기를 누르면 실수.
 *  - place: 표시된 자리에 차례로(지주 3개 · 멀칭 띠 4칸).
 *  - tie: 흔들리는 표시가 띠 안에 들어올 때 누른다(포기 3).
 *  - hold: 누르고 있으면 게이지가 차고, 띠 안에서 떼야 제대로(포기 2).
 *  - sprinkle: 포기 사이 표시된 자리 4곳.
 *  - tray: 작은 트레이의 싹 6개를 눌러 넓은 트레이로.
 * 작업은 손놀림이 끝나고 **걸리는 시간(초 — 실제 시간)** 이 다 차야 끝난다 — 시간이 든다는 뜻이다. 점수(0..1)는 실수 · 타이밍으로 깎이고,
 * 낮으면 효과가 절반(core `doCare`). 조작 안내 글자는 창에 두지 않는다(R11) — 처음 열 때 가이드가 한 번 짚는다.
 * 시간 · 게이지 · 흔들림은 **벽시계**(`performance.now`)로 센다 — Phaser delta는 프레임이 늘어지면 목표값으로 잘려(헤드리스 · 백그라운드 탭)
 *   10초가 몇 분이 된다(149 · 155차 함정).
 */

import Phaser from 'phaser';
import { CARE_TASK_KO, CARE_WORK_KO, type CareStatus, type CareWorkKind, type CropDef } from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { enforceTextBounds } from './TextFit.js';
import { addPixelIcon } from './PixelIcon.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { t } from '../i18n/I18n.js';
import { cropItemTemplate } from '../data/CropItems.js';

const PANEL_W = 600;
const PANEL_H = 400;
const STAGE_X = 16;
const STAGE_W = 340;
const STAGE_H = 270;
const INFO_X = STAGE_X + STAGE_W + 14;
const INFO_W = PANEL_W - INFO_X - 16;
const FONT = '"Noto Sans KR", sans-serif';

export interface FarmWorkOpts {
  crop: CropDef;
  status: CareStatus;
  /** 포기 수(그림에 세운다) */
  plants: number;
  /** 다 했다 — 점수(0..1) */
  onDone: (score: number) => void;
  onClose: () => void;
}

interface Target { x: number; y: number; r: number; done: boolean; obj: Phaser.GameObjects.GameObject[] }

export class FarmWorkPanel extends DraggablePanel {
  private opts: FarmWorkOpts;
  private stage!: Phaser.GameObjects.Container;
  private timeBar!: Phaser.GameObjects.Graphics;
  private timeText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private elapsed = 0;
  /** 벽시계 기준(ms) — 연 순간 · 마지막 틱 */
  private startMs = performance.now();
  private lastTickMs = performance.now();
  private handDone = false;
  private finished = false;
  private wrong = 0;
  private attempts = 0;
  private hits = 0;
  private targets: Target[] = [];
  private updateFn: (_t: number, delta: number) => void;
  /** tie — 흔들리는 표시 · hold — 게이지 */
  private marker?: Phaser.GameObjects.Graphics;
  private markerT = 0;
  private holding = false;
  private gauge = 0;
  private gaugeG?: Phaser.GameObjects.Graphics;
  private round = 0;
  private roundsNeeded = 1;
  private stageHit?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: FarmWorkOpts) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: CARE_TASK_KO[opts.status.def.id], onClose: opts.onClose, dim: true, depth: 930 });
    this.opts = opts;
    this.build();
    this.updateFn = (_t, delta) => this.tick(delta);
    this.startMs = performance.now();
    this.lastTickMs = this.startMs;
    scene.events.on('update', this.updateFn);
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.events.off('update', this.updateFn);
    super.destroy(fromScene);
  }

  private get def() { return this.opts.status.def; }

  // ── 짜기 ───────────────────────────────────

  private build(): void {
    const scene = this.scene;
    const top = this.contentTop + 8;
    // 왼쪽 — 작업 무대
    const bg = scene.add.graphics();
    bg.fillStyle(0x0b1a10, 1); bg.fillRoundedRect(STAGE_X, top, STAGE_W, STAGE_H, 6);
    bg.lineStyle(1, 0x2f5a3a, 1); bg.strokeRoundedRect(STAGE_X, top, STAGE_W, STAGE_H, 6);
    this.add(bg);
    this.stage = scene.add.container(STAGE_X, top);
    this.add(this.stage);
    // 오른쪽 — 방법 · 자재 · 시간
    let y = top;
    const head = scene.add.text(INFO_X, y, t(CARE_WORK_KO[this.def.work]), { fontFamily: FONT, fontSize: '13px', color: '#ffe28a', fontStyle: 'bold', wordWrap: { width: INFO_W } });
    this.add(head);
    y += head.height + 8;
    const how = scene.add.text(INFO_X, y, t(this.def.howKo), { fontFamily: FONT, fontSize: '12px', color: '#c8dceb', wordWrap: { width: INFO_W }, lineSpacing: 3 });
    this.add(how);
    y += how.height + 10;
    if (this.def.needs?.length) {
      const needs = scene.add.text(INFO_X, y, `${t('쓰는 것')}: ${this.def.needs.map((n) => `${t(cropItemTemplate(n.itemId)?.name ?? n.itemId)} ×${n.qty}`).join(' · ')}`, {
        fontFamily: FONT, fontSize: '11px', color: '#9fb8c8', wordWrap: { width: INFO_W },
      });
      this.add(needs);
      y += needs.height + 10;
    }
    this.add(scene.add.text(INFO_X, y, t('걸리는 시간'), { fontFamily: FONT, fontSize: '12px', color: '#8fb4cc' }));
    y += 18;
    this.timeBar = scene.add.graphics();
    this.add(this.timeBar);
    this.timeText = scene.add.text(INFO_X + INFO_W, y - 18, '', { fontFamily: FONT, fontSize: '12px', color: '#c8dceb' }).setOrigin(1, 0);
    this.add(this.timeText);
    this.timeBarY = y;
    y += 24;
    this.statusText = scene.add.text(INFO_X, y, '', { fontFamily: FONT, fontSize: '12px', color: '#9fd0e4', wordWrap: { width: INFO_W }, lineSpacing: 3 });
    this.add(this.statusText);
    // 그만두기
    this.button('quit', INFO_X, top + STAGE_H - 30, 96, 28, '그만두기', () => this.opts.onClose(), true, true);
    this.buildStage();
    this.drawTime();
    enforceTextBounds(this, PANEL_W - 12, 'FarmWorkPanel');
    this.applyFix();
  }

  private timeBarY = 0;

  private drawTime(): void {
    const g = this.timeBar;
    g.clear();
    const w = INFO_W;
    const k = Math.min(1, this.elapsed / Math.max(0.1, this.def.seconds));
    g.fillStyle(0x0d1a28, 1); g.fillRect(INFO_X, this.timeBarY, w, 10);
    g.fillStyle(k >= 1 ? 0x4af2a1 : 0x6ac46a, 1); g.fillRect(INFO_X, this.timeBarY, Math.round(w * k), 10);
    g.lineStyle(1, 0x2a4a66, 1); g.strokeRect(INFO_X, this.timeBarY, w, 10);
    this.timeText.setText(`${Math.min(this.def.seconds, Math.floor(this.elapsed))} / ${this.def.seconds}${t('초')}`);
  }

  private setStatus(msg: string, ok = true): void {
    this.statusText.setColor(ok ? '#9fd0e4' : '#ff9a7a').setText(t(msg));
  }

  // ── 무대 — 포기 그림 ───────────────────────

  /** 포기 하나(줄기 · Y자 방아다리 · 잎 · 열매)를 그린다 — 밑동 (x, baseY) */
  private drawPlant(g: Phaser.GameObjects.Graphics, x: number, baseY: number, h: number, fruits: number, stake = false): { forkY: number } {
    const forkY = baseY - h * 0.45;
    if (stake) { g.fillStyle(0x8a6038, 1); g.fillRect(x + 9, baseY - h - 14, 3, h + 14); }
    g.fillStyle(0x3a6a2a, 1); g.fillRect(x - 2, forkY, 4, baseY - forkY);
    // Y자 가지
    g.lineStyle(4, 0x3a6a2a, 1);
    g.beginPath(); g.moveTo(x, forkY); g.lineTo(x - 14, baseY - h); g.strokePath();
    g.beginPath(); g.moveTo(x, forkY); g.lineTo(x + 14, baseY - h); g.strokePath();
    // 잎
    g.fillStyle(0x5cb84a, 1);
    for (const [dx, dy] of [[-10, 0.3], [10, 0.3], [-16, 0.7], [16, 0.7], [-6, 0.95], [6, 0.95]] as const) {
      g.fillEllipse(x + dx, baseY - h * dy, 12, 7);
    }
    // 열매
    g.fillStyle(0x3f9a3a, 1);
    for (let i = 0; i < fruits; i++) g.fillRect(x - 12 + i * 8, baseY - h * 0.6 + (i % 2) * 6, 3, 9);
    return { forkY };
  }

  private addTarget(x: number, y: number, r: number, color: number, shape: 'bud' | 'flower' | 'fruit' | 'spot' | 'stake' | 'band' | 'cell'): Target {
    const scene = this.scene;
    const objs: Phaser.GameObjects.GameObject[] = [];
    const g = scene.add.graphics();
    if (shape === 'bud') { g.fillStyle(color, 1); g.fillEllipse(x, y, r * 1.6, r); g.fillStyle(0xb4e47a, 1); g.fillRect(x - 1, y - r, 2, r); }
    else if (shape === 'flower') { g.fillStyle(0xf8f8f0, 1); g.fillCircle(x, y, r); g.fillStyle(0xf0c040, 1); g.fillCircle(x, y, r * 0.4); }
    else if (shape === 'fruit') { g.fillStyle(0xd0382a, 1); g.fillRect(x - 2, y - r, 4, r * 2); g.fillStyle(0x1a0a0a, 1); g.fillRect(x - 1, y - 2, 2, 2); g.fillRect(x, y + 3, 2, 2); }
    else if (shape === 'spot') { g.fillStyle(color, 0.55); g.fillCircle(x, y, r); g.lineStyle(1, 0xffd257, 0.9); g.strokeCircle(x, y, r); }
    else if (shape === 'stake') { g.lineStyle(1, 0xffd257, 0.9); g.strokeRect(x - 3, y - r, 6, r * 2); }
    else if (shape === 'band') { g.fillStyle(color, 0.35); g.fillRect(x - r, y - 6, r * 2, 12); g.lineStyle(1, 0xffd257, 0.8); g.strokeRect(x - r, y - 6, r * 2, 12); }
    else { g.lineStyle(1, 0xffd257, 0.9); g.strokeRect(x - r, y - r, r * 2, r * 2); }
    this.stage.add(g);
    objs.push(g);
    const hit = scene.add.rectangle(x, y, Math.max(18, r * 2.2), Math.max(18, r * 2.2), 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    this.stage.add(hit);
    objs.push(hit);
    const tg: Target = { x, y, r, done: false, obj: objs };
    hit.on('pointerdown', () => this.onTarget(tg));
    this.targets.push(tg);
    return tg;
  }

  private buildStage(): void {
    const scene = this.scene;
    const g = scene.add.graphics();
    this.stage.add(g);
    const kind: CareWorkKind = this.def.work;
    const baseY = STAGE_H - 36;
    // 흙
    g.fillStyle(0x4a3220, 1); g.fillRect(8, baseY, STAGE_W - 16, 22);
    g.fillStyle(0x3a2616, 1); for (let x = 12; x < STAGE_W - 12; x += 14) g.fillRect(x, baseY + 10, 8, 3);
    const plants = Math.max(1, Math.min(4, this.opts.plants));
    const gap = (STAGE_W - 40) / plants;
    const px = (i: number): number => 20 + gap * (i + 0.5);
    // 무대 전체 — 빗나간 클릭(실수) 판정
    this.stageHit = scene.add.rectangle(STAGE_W / 2, STAGE_H / 2, STAGE_W, STAGE_H, 0xffffff, 0.001).setInteractive();
    this.stage.add(this.stageHit);
    this.stageHit.on('pointerdown', () => this.onStageMiss());
    this.stageHit.on('pointerup', () => this.onStageRelease());
    const staked = this.def.id !== 'stake' && this.def.id !== 'ridge_mulch' && this.def.id !== 'prick_out';

    if (kind === 'targets') {
      const id = this.def.id;
      for (let i = 0; i < plants; i++) {
        const { forkY } = this.drawPlant(g, px(i), baseY, 150, id === 'cull_diseased' ? 3 : 2, staked);
        if (id === 'pinch_flower') this.addTarget(px(i), forkY - 2, 6, 0xffffff, 'flower');
        else if (id === 'remove_suckers') {
          for (const [dx, dy] of [[-7, 18], [7, 34], [-7, 50]] as const) this.addTarget(px(i) + dx, forkY + dy, 5, 0x8fd16a, 'bud');
        } else {
          for (const [dx, dy] of [[-10, 30], [12, 22]] as const) this.addTarget(px(i) + dx, forkY - dy, 6, 0xd0382a, 'fruit');
        }
      }
      this.setStatus(`${t('남은 것')} ${this.targets.length}`);
    } else if (kind === 'place') {
      if (this.def.id === 'stake') {
        for (let i = 0; i < plants; i++) {
          this.drawPlant(g, px(i), baseY, 90, 0, false);
          this.addTarget(px(i) + 10, baseY - 60, 60, 0xffd257, 'stake');
        }
      } else {
        // 멀칭 — 두둑 띠 4칸
        g.fillStyle(0x6a4a2c, 1); g.fillRoundedRect(20, baseY - 40, STAGE_W - 40, 34, 6);
        const n = 4, cw = (STAGE_W - 48) / n;
        for (let i = 0; i < n; i++) this.addTarget(24 + cw * (i + 0.5), baseY - 23, cw / 2 - 2, 0x101010, 'cell');
      }
      this.setStatus(`${t('차례')} 1 / ${this.targets.length}`);
    } else if (kind === 'tie') {
      this.roundsNeeded = plants;
      for (let i = 0; i < plants; i++) this.drawPlant(g, px(i), baseY, 160, 2, true);
      // 띠 = 지주의 중간 높이. 표시가 위아래로 흔들린다
      this.addTarget(px(0) + 10, baseY - 100, 14, 0x4af2a1, 'band');
      this.marker = scene.add.graphics();
      this.stage.add(this.marker);
      this.setStatus(`${t('묶은 포기')} 0 / ${plants}`);
    } else if (kind === 'hold') {
      this.roundsNeeded = Math.min(2, plants);
      for (let i = 0; i < plants; i++) this.drawPlant(g, px(i), baseY, 150, 2, staked);
      this.gaugeG = scene.add.graphics();
      this.stage.add(this.gaugeG);
      this.drawGauge();
      this.setStatus(`${t('친 포기')} 0 / ${this.roundsNeeded}`);
    } else if (kind === 'sprinkle') {
      for (let i = 0; i < plants; i++) this.drawPlant(g, px(i), baseY, 130, 2, staked);
      const spots = plants + 1;
      for (let i = 0; i < spots; i++) this.addTarget(20 + gap * i, baseY + 8, 9, 0xd8b878, 'spot');
      this.setStatus(`${t('남은 자리')} ${this.targets.length}`);
    } else {
      // tray — 왼쪽 작은 트레이(싹 6) → 오른쪽 넓은 트레이
      g.fillStyle(0x14181c, 1); g.fillRoundedRect(16, 60, 120, 150, 4);
      g.fillStyle(0x14181c, 1); g.fillRoundedRect(190, 40, 134, 190, 4);
      g.fillStyle(0x2a3036, 1);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.fillRect(198 + c * 42, 48 + r * 46, 36, 40);
      for (let i = 0; i < 6; i++) this.addTarget(36 + (i % 3) * 40, 84 + Math.floor(i / 3) * 56, 7, 0x8fd16a, 'bud');
      this.setStatus(`${t('옮길 싹')} ${this.targets.length}`);
    }
  }

  // ── 손놀림 ────────────────────────────────

  private onTarget(tg: Target): void {
    if (this.finished || tg.done) return;
    const kind = this.def.work;
    if (kind === 'place') {
      const next = this.targets.find((x) => !x.done);
      if (next !== tg) { this.wrong++; this.setStatus('차례가 아니다 — 표시된 자리부터', false); return; }
    }
    if (kind === 'tie') { this.onTieClick(); return; }
    if (kind === 'hold') return;
    tg.done = true;
    this.hits++;
    for (const o of tg.obj) o.destroy();
    const left = this.targets.filter((x) => !x.done).length;
    if (kind === 'tray') {
      const g = this.scene.add.graphics();
      const k = this.hits - 1;
      const cx = 216 + (k % 3) * 42, cy = 68 + Math.floor(k / 3) * 46;
      g.fillStyle(0x5c3f24, 1); g.fillRect(cx - 14, cy + 6, 28, 8);
      g.fillStyle(0x8fd16a, 1); g.fillEllipse(cx, cy, 12, 8); g.fillRect(cx - 1, cy, 2, 8);
      this.stage.add(g);
      this.setStatus(`${t('옮길 싹')} ${left}`);
    } else if (kind === 'place') {
      const g = this.scene.add.graphics();
      if (this.def.id === 'stake') { g.fillStyle(0x8a6038, 1); g.fillRect(tg.x - 2, tg.y - tg.r - 10, 4, tg.r * 2 + 10); g.fillStyle(0xe8d8a0, 1); g.fillRect(tg.x - 8, tg.y + 10, 14, 2); }
      else { g.fillStyle(0x101010, 1); g.fillRect(tg.x - tg.r, tg.y - tg.r + 2, tg.r * 2, tg.r * 2 - 4); }
      this.stage.add(g);
      this.setStatus(left > 0 ? `${t('차례')} ${this.hits + 1} / ${this.targets.length}` : '다 세웠다');
    } else if (kind === 'sprinkle') {
      const g = this.scene.add.graphics();
      g.fillStyle(0xd8dce4, 1); for (let i = 0; i < 6; i++) g.fillRect(tg.x - 8 + (i * 5) % 16, tg.y - 4 + (i * 3) % 8, 2, 2);
      this.stage.add(g);
      this.setStatus(`${t('남은 자리')} ${left}`);
    } else {
      this.setStatus(`${t('남은 것')} ${left}`);
    }
    if (left === 0) this.handFinished();
    restoreHandCursor(this.scene);
  }

  /** 표시 밖을 눌렀다 — targets · place · sprinkle · tray는 실수 · hold는 누르기 시작 · tie는 빗나감 */
  private onStageMiss(): void {
    if (this.finished || this.handDone) return;
    const kind = this.def.work;
    if (kind === 'hold') { this.holding = true; return; }
    if (kind === 'tie') { this.onTieClick(); return; }
    this.wrong++;
    this.setStatus(kind === 'targets' ? '줄기를 건드렸다 — 표시된 것만 딴다' : '빗나갔다 — 표시된 자리에', false);
  }

  private onStageRelease(): void {
    if (this.def.work !== 'hold' || !this.holding || this.finished) return;
    this.holding = false;
    this.attempts++;
    const inBand = this.gauge >= 0.6 && this.gauge <= 0.85;
    if (inBand) { this.hits++; this.setStatus('고르게 쳤다'); }
    else if (this.gauge < 0.6) this.setStatus('너무 적게 쳤다 — 띠 안에서 뗀다', false);
    else this.setStatus('너무 많이 쳤다 — 잎이 상한다', false);
    this.round++;
    this.gauge = 0;
    this.drawGauge();
    if (this.round >= this.roundsNeeded) this.handFinished();
    else this.setStatus(`${t('친 포기')} ${this.round} / ${this.roundsNeeded}`);
  }

  private onTieClick(): void {
    if (this.finished || this.handDone) return;
    this.attempts++;
    const band = this.targets[0];
    const my = this.markerY();
    if (Math.abs(my - band.y) <= 7) {
      this.hits++; this.round++;
      const g = this.scene.add.graphics();
      const gap = (STAGE_W - 40) / Math.max(1, Math.min(4, this.opts.plants));
      const x = 20 + gap * (this.round - 0.5);
      g.fillStyle(0xe8d8a0, 1); g.fillRect(x - 6, band.y - 1, 18, 2);
      this.stage.add(g);
      if (this.round >= this.roundsNeeded) { this.setStatus('다 묶었다'); this.handFinished(); }
      else {
        this.setStatus(`${t('묶은 포기')} ${this.round} / ${this.roundsNeeded}`);
        band.x = x + gap + 10;
        for (const o of band.obj) o.destroy();
        band.obj = [];
        const ng = this.scene.add.graphics();
        ng.fillStyle(0x4af2a1, 0.35); ng.fillRect(band.x - band.r, band.y - 6, band.r * 2, 12);
        ng.lineStyle(1, 0xffd257, 0.8); ng.strokeRect(band.x - band.r, band.y - 6, band.r * 2, 12);
        this.stage.add(ng);
        band.obj.push(ng);
      }
    } else {
      this.wrong++;
      this.setStatus('띠를 벗어났다 — 표시가 띠 안에 들어올 때', false);
    }
  }

  private markerY(): number {
    const band = this.targets[0];
    return band.y + Math.sin(this.markerT) * 42;
  }

  private drawGauge(): void {
    const g = this.gaugeG;
    if (!g) return;
    g.clear();
    const x = STAGE_W - 40, y0 = 30, h = STAGE_H - 90;
    g.fillStyle(0x0d1a28, 1); g.fillRect(x, y0, 16, h);
    g.fillStyle(0x4af2a1, 0.3); g.fillRect(x, y0 + h * (1 - 0.85), 16, h * 0.25);
    g.fillStyle(0x3a8ad0, 1); g.fillRect(x, y0 + h * (1 - this.gauge), 16, h * this.gauge);
    g.lineStyle(1, 0x2a4a66, 1); g.strokeRect(x, y0, 16, h);
  }

  private handFinished(): void {
    this.handDone = true;
    this.stageHit?.disableInteractive();
    this.tryFinish();
  }

  private tick(_delta: number): void {
    if (this.finished) return;
    const now = performance.now();
    const delta = Math.min(250, now - this.lastTickMs);
    this.lastTickMs = now;
    this.elapsed = (now - this.startMs) / 1000;
    this.drawTime();
    if (this.def.work === 'tie' && this.marker && !this.handDone) {
      this.markerT = (now - this.startMs) / 420;
      const band = this.targets[0];
      const y = this.markerY();
      this.marker.clear();
      this.marker.fillStyle(0xffd257, 1); this.marker.fillRect(band.x - 10, y - 2, 20, 4);
    }
    if (this.def.work === 'hold' && this.holding) {
      this.gauge = Math.min(1, this.gauge + delta / 2500);
      this.drawGauge();
      if (this.gauge >= 1) this.onStageRelease();
    }
    if (this.handDone && this.elapsed >= this.def.seconds) this.tryFinish();
    else if (this.handDone) this.setStatus('손은 끝났다 — 마무리하는 중');
  }

  private tryFinish(): void {
    if (this.finished || !this.handDone || this.elapsed < this.def.seconds) return;
    this.finished = true;
    this.opts.onDone(this.score());
    this.opts.onClose();
  }

  /** 점수 0..1 — 실수 · 빗나간 타이밍으로 깎인다 */
  score(): number {
    const kind = this.def.work;
    if (kind === 'tie' || kind === 'hold') return this.attempts > 0 ? Math.max(0, Math.min(1, this.hits / this.attempts)) : 1;
    return Math.max(0, 1 - this.wrong * 0.15);
  }

  // ── dev 하네스 ──
  /** 하네스: 걸리는 시간을 다 지난 것으로 */
  devSkipTime(): void { this.startMs = performance.now() - (this.def.seconds + 1) * 1000; }

  /** 하네스: 손놀림과 시간을 건너뛰고 점수로 끝낸다 */
  devFinish(score = 1): void {
    if (this.finished) return;
    this.finished = true;
    this.opts.onDone(score);
    this.opts.onClose();
  }

  // ── 단추 ──
  private button(key: string, x: number, y: number, w: number, h: number, label: string, onClick: () => void, on = true, danger = false): void {
    const scene = this.scene;
    const g = scene.add.graphics();
    g.fillStyle(!on ? 0x15202c : danger ? 0x3a1a16 : 0x0d4a2e, 0.95); g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1.2, !on ? 0x2a3a4a : danger ? 0xc86a5a : 0x4af2a1, 0.95); g.strokeRoundedRect(x, y, w, h, 4);
    const txt = scene.add.text(x + w / 2, y + h / 2, t(label), { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: danger ? '#ffb0a4' : '#4af2a1' }).setOrigin(0.5);
    this.add([g, txt]);
    if (!on) return;
    const hit = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
    this.add(hit);
    void key;
  }

  private buildTour(): TourOptions {
    return {
      id: 'farm_work',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [
        { text: '텃밭 손일은 그 일을 흉내 내는 짧은 손놀림이다. 왼쪽 포기 그림에서 표시된 것을 누르거나, 누르고 있다가 띠 안에서 뗀다.', target: () => this.localRect(STAGE_X, this.contentTop + 8, STAGE_W, STAGE_H) },
        { text: '손이 끝나도 걸리는 시간이 다 차야 끝난다 — 일에는 시간이 든다. 서툴면(실수가 많으면) 효과가 절반이다.', target: () => this.localRect(INFO_X, this.timeBarY - 20, INFO_W, 36) },
      ],
    };
  }
}

/** 텃밭 창이 작업 장면을 열 때 쓰는 아이콘(작업별 자재 아이콘 — 없으면 작물 그림) */
export function careTaskIcon(scene: Phaser.Scene, st: CareStatus, x: number, y: number, size = 16): Phaser.GameObjects.Image | null {
  const need = st.def.needs?.[0]?.itemId;
  const key = need ? `it_${need.replace(/^farm_/, '')}` : st.def.id === 'cull_diseased' ? 'dz_anthracnose' : st.def.id === 'prick_out' ? 'it_tray' : 'farm_young';
  return addPixelIcon(scene, key, x, y, size);
}
