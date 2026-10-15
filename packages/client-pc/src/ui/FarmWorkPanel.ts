/**
 * @file FarmWorkPanel.ts
 * @description 238차 — 텃밭 작업 장면(사용자 제안 「까다로움을 딸깍이 아니라 실제 동작 · 과정 · 시간으로」)
 *              245차 — 작물 84종의 일(사용자 「고추처럼 각 농작물에 대한 난이도를 추가」): 작물 모양별 그림 · 일별 표시 · 끌어 올리기 · 짝 맞추기
 *
 * 관리 작업 하나를 작업 종류(`CareWorkKind`)에 맞는 짧은 손놀림으로 한다. 왼쪽은 그 작물의 그림(절차 픽셀 그래픽), 오른쪽은 방법 · 걸리는 시간.
 *  - targets: 그림의 표시(곁순 · 첫 꽃 · 병든 열매 · 솎을 싹 · 잡초 · 순 · 꽃대 · 런너 · 벌레 · 칼집 자리 · 자를 가지)를 하나씩 누른다. 빈 곳을 누르면 실수.
 *  - place: 표시된 자리에 차례로(지주 · 멀칭 · 방충망 · 부직포 · 짚 · 유인망 · 밟을 자리 · 덮개).
 *  - tie: 흔들리는 표시가 띠 안에 들어올 때 누른다(유인줄 · 배추 묶기).
 *  - hold: 누르고 있으면 게이지가 차고, 띠 안에서 떼야 제대로(약 치기 · 분무 · 물 대기).
 *  - sprinkle: 포기 사이 표시된 자리(웃거름 · 피트모스).
 *  - tray: 작은 트레이의 싹 6개를 눌러 넓은 트레이로(가식).
 *  - drag(245): 고랑의 흙 표시를 눌러 포기 밑동까지 끌어 올린다(북주기) — 밑동 띠 밖에서 놓으면 실수.
 *  - pair(245): 수꽃을 누른 뒤 암꽃을 누른다(인공수분) — 암꽃부터 누르면 실수.
 * 작업은 손놀림이 끝나고 **걸리는 시간(초 — 실제 시간)** 이 다 차야 끝난다. 같은 작물 칸 여럿을 한 번에 하면 시간이 늘어난다(`FarmStore.careGroupSeconds`).
 * 점수(0..1)는 실수 · 타이밍으로 깎이고 낮으면 효과가 절반(core `doCare`). 조작 안내 글자는 창에 두지 않는다(R11) — 처음 열 때 가이드가 짚는다.
 * 시간 · 게이지 · 흔들림은 **벽시계**(`performance.now`)로 센다 — Phaser delta는 프레임이 늘어지면 목표값으로 잘린다(149 · 155차 함정).
 * 247차 — 거둔 뒤 밭 손질(사용자 「깨는 베고, 말리고, 털어야 한다」): 털기(마른 단을 서너 번씩 내리친다 — 알이 깔개에 떨어진다) ·
 *   꼬투리 따기(여문 것만 — 쭉정이를 따면 실수) · 묶어 거두기(마른 알뿌리를 주워 묶음으로) · 키질(띠 높이로 까부를 때 검불이 날아간다) ·
 *   모종 굳히기(트레이를 그늘 → 반그늘 → 볕으로 차례로 내놓는다).
 */

import Phaser from 'phaser';
import { CARE_TASK_KO, CARE_WORK_KO, carePlanOf, DISEASE_DEFS, type CareStatus, type CareWorkKind, type CropDef, type CropDisease } from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { cv, shapeCuesOn } from './ColorAssist.js';
import { enforceTextBounds } from './TextFit.js';
import { addPixelIcon } from './PixelIcon.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { t } from '../i18n/I18n.js';
import { cropItemTemplate } from '../data/CropItems.js';
import { shapeOf, CONTAINER, type Shape } from '../data/CropShapes.js';
import { playSfx } from '../audio/SfxBank.js';

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
  /** 245차 — 함께 하는 칸 수(같은 작물 · 같은 일) */
  cells?: number;
  /** 245차 — 걸리는 시간(초) — 묶음이면 늘어난다. 없으면 작업 정의 그대로 */
  seconds?: number;
  /** 247차 — 「쓰는 것」 줄에 더 보일 도구(도리깨 · 키처럼 있으면 돕는 것) */
  uses?: string[];
  /** 다 했다 — 점수(0..1) */
  onDone: (score: number) => void;
  onClose: () => void;
}

/** 247차 — 일 모양 머리말이 맞지 않는 일(거둔 뒤 손질 · 키질 · 모종 굳히기)은 그 일의 말로 */
const HEAD_BY_ID: Partial<Record<string, string>> = {
  thresh: '마른 단을 서너 번씩 내리친다', pick_pods: '여문 꼬투리만 딴다', gather_bundle: '마른 알뿌리를 주워 묶는다',
  winnow: '표시가 띠 높이일 때 까부른다', harden_off: '그늘 → 반그늘 → 볕 차례로 내놓는다',
};

interface P { x: number; y: number }
/** 그림이 돌려주는 자리 — 꼭대기 · 갈래 · 잎 · 열매 · 가지 끝 */
interface Anchors { top: P; fork: P; base: P; leaves: P[]; fruit: P[]; tips: P[] }

type TargetShape = 'bud' | 'flower' | 'fruit' | 'spot' | 'stake' | 'band' | 'cell' | 'weed' | 'sprout' | 'stalk' | 'small' | 'cut' | 'slit' | 'pest' | 'step' | 'male' | 'female' | 'soil' | 'leaf' | 'runner';

interface Target {
  x: number; y: number; r: number; done: boolean; obj: Phaser.GameObjects.GameObject[];
  /** 245차 — 인공수분 수꽃 · 암꽃 · 247차 쭉정이(따면 실수 — 남은 수에 세지 않는다) */
  role?: 'male' | 'female' | 'bad';
  /** 247차 — 털기: 이만큼 더 쳐야 알이 다 떨어진다 */
  hp?: number;
  /** 247차 — 털기 단 그림을 다시 그린다(남은 알) */
  redraw?: (left: number) => void;
  /** 245차 — 북주기: 끌어 올려 놓을 밑동 띠 */
  dest?: { x: number; y: number; r: number };
}

export class FarmWorkPanel extends DraggablePanel {
  private opts: FarmWorkOpts;
  private stage!: Phaser.GameObjects.Container;
  private stageTop = 0;
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
  /** 245차 — 작물 모양 · 걸리는 시간 · 끌어 올리기 · 짝 맞추기 */
  private readonly shape: Shape;
  private readonly total: number;
  private dragFrom?: Target;
  private dragLine?: Phaser.GameObjects.Graphics;
  private pairSel?: Target;
  private pairRing?: Phaser.GameObjects.Graphics;
  private moveFn?: (p: Phaser.Input.Pointer) => void;
  private upFn?: (p: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: FarmWorkOpts) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: CARE_TASK_KO[opts.status.def.id], onClose: opts.onClose, dim: true, depth: 930 });
    this.opts = opts;
    this.shape = shapeOf(opts.crop);
    this.total = Math.max(1, opts.seconds ?? opts.status.def.seconds);
    this.build();
    this.updateFn = (_t, delta) => this.tick(delta);
    this.startMs = performance.now();
    this.lastTickMs = this.startMs;
    scene.events.on('update', this.updateFn);
    if (this.def.work === 'drag') {
      this.moveFn = (p) => this.onDragMove(p);
      this.upFn = (p) => this.onDragUp(p);
      scene.input.on('pointermove', this.moveFn);
      scene.input.on('pointerup', this.upFn);
    }
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.events.off('update', this.updateFn);
    if (this.moveFn) this.scene?.input.off('pointermove', this.moveFn);
    if (this.upFn) this.scene?.input.off('pointerup', this.upFn);
    super.destroy(fromScene);
  }

  private get def() { return this.opts.status.def; }

  // ── 짜기 ───────────────────────────────────

  private build(): void {
    const scene = this.scene;
    const top = this.contentTop + 8;
    this.stageTop = top;
    // 왼쪽 — 작업 무대
    const bg = scene.add.graphics();
    const indoor = CONTAINER.has(this.shape);
    bg.fillStyle(indoor ? 0x161a20 : 0x0b1a10, 1); bg.fillRoundedRect(STAGE_X, top, STAGE_W, STAGE_H, 6);
    bg.lineStyle(1, indoor ? 0x3a4a5a : 0x2f5a3a, 1); bg.strokeRoundedRect(STAGE_X, top, STAGE_W, STAGE_H, 6);
    this.add(bg);
    this.stage = scene.add.container(STAGE_X, top);
    this.add(this.stage);
    // 오른쪽 — 방법 · 자재 · 시간
    let y = top;
    const head = scene.add.text(INFO_X, y, t(HEAD_BY_ID[this.def.id] ?? CARE_WORK_KO[this.def.work]), { fontFamily: FONT, fontSize: '13px', color: '#ffe28a', fontStyle: 'bold', wordWrap: { width: INFO_W } });
    this.add(head);
    y += head.height + 8;
    const how = scene.add.text(INFO_X, y, t(this.def.howKo), { fontFamily: FONT, fontSize: '12px', color: '#c8dceb', wordWrap: { width: INFO_W }, lineSpacing: 3 });
    this.add(how);
    y += how.height + 10;
    const cells = Math.max(1, this.opts.cells ?? 1);
    const uses = [
      ...(this.def.needs ?? []).map((n) => `${t(cropItemTemplate(n.itemId)?.name ?? n.itemId)} ×${n.qty * cells}`),
      ...(this.def.tools ?? []).map((id) => t(cropItemTemplate(id)?.name ?? id)),
      ...(this.opts.uses ?? []).map((n) => t(n)),
    ];
    if (uses.length) {
      const needs = scene.add.text(INFO_X, y, `${t('쓰는 것')}: ${uses.join(' · ')}`, { fontFamily: FONT, fontSize: '11px', color: '#9fb8c8', wordWrap: { width: INFO_W } });
      this.add(needs);
      y += needs.height + 6;
    }
    if (cells > 1) {
      const together = scene.add.text(INFO_X, y, `${t('함께 하는 칸')}: ${cells}`, { fontFamily: FONT, fontSize: '11px', color: '#9fd0e4', wordWrap: { width: INFO_W } });
      this.add(together);
      y += together.height + 6;
    }
    y += 4;
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
    const k = Math.min(1, this.elapsed / Math.max(0.1, this.total));
    g.fillStyle(0x0d1a28, 1); g.fillRect(INFO_X, this.timeBarY, w, 10);
    g.fillStyle(k >= 1 ? 0x4af2a1 : 0x6ac46a, 1); g.fillRect(INFO_X, this.timeBarY, Math.round(w * k), 10);
    g.lineStyle(1, 0x2a4a66, 1); g.strokeRect(INFO_X, this.timeBarY, w, 10);
    this.timeText.setText(`${Math.min(this.total, Math.floor(this.elapsed))} / ${this.total}${t('초')}`);
  }

  private setStatus(msg: string, ok = true): void {
    if (!ok) playSfx('work_miss');   // 252차 — 실수 · 빗나감은 모두 여기로 온다
    this.statusText.setColor(ok ? '#9fd0e4' : '#ff9a7a').setText(t(msg));
  }

  // ── 무대 — 작물 그림(245차 — 모양별) ─────────

  /** 포기 하나(줄기 · Y자 방아다리 · 잎 · 열매)를 그린다 — 밑동 (x, baseY) */
  private drawUpright(g: Phaser.GameObjects.Graphics, x: number, baseY: number, h: number, fruits: number, stake = false): Anchors {
    const forkY = baseY - h * 0.45;
    if (stake) { g.fillStyle(0x8a6038, 1); g.fillRect(x + 9, baseY - h - 14, 3, h + 14); }
    g.fillStyle(0x3a6a2a, 1); g.fillRect(x - 2, forkY, 4, baseY - forkY);
    g.lineStyle(4, 0x3a6a2a, 1);
    g.beginPath(); g.moveTo(x, forkY); g.lineTo(x - 14, baseY - h); g.strokePath();
    g.beginPath(); g.moveTo(x, forkY); g.lineTo(x + 14, baseY - h); g.strokePath();
    g.fillStyle(0x5cb84a, 1);
    const leaves: P[] = [];
    for (const [dx, dy] of [[-10, 0.3], [10, 0.3], [-16, 0.7], [16, 0.7], [-6, 0.95], [6, 0.95]] as const) {
      g.fillEllipse(x + dx, baseY - h * dy, 12, 7);
      leaves.push({ x: x + dx, y: baseY - h * dy });
    }
    g.fillStyle(0x3f9a3a, 1);
    const fruit: P[] = [];
    for (let i = 0; i < fruits; i++) { g.fillRect(x - 12 + i * 8, baseY - h * 0.6 + (i % 2) * 6, 3, 9); fruit.push({ x: x - 11 + i * 8, y: baseY - h * 0.6 + 4 }); }
    return { top: { x, y: baseY - h }, fork: { x, y: forkY }, base: { x, y: baseY }, leaves, fruit, tips: [{ x: x - 14, y: baseY - h }, { x: x + 14, y: baseY - h }] };
  }

  private drawRosette(g: Phaser.GameObjects.Graphics, x: number, baseY: number, k = 1, color = 0x5cb84a): Anchors {
    const dark = 0x3f8a34;
    const L: [number, number, number, number][] = [[-14, -10, 18, 10], [14, -10, 18, 10], [-8, -22, 14, 16], [8, -22, 14, 16], [0, -30, 12, 18]];
    const leaves: P[] = [];
    for (const [dx, dy, w, h] of L) {
      g.fillStyle(color, 1); g.fillEllipse(x + dx * k, baseY + dy * k, w * k, h * k);
      g.fillStyle(dark, 1); g.fillRect(x + dx * k - 0.5, baseY + dy * k - h * k * 0.3, 1, h * k * 0.6);
      leaves.push({ x: x + dx * k, y: baseY + dy * k });
    }
    return { top: { x, y: baseY - 38 * k }, fork: { x, y: baseY - 12 * k }, base: { x, y: baseY }, leaves, fruit: [], tips: [{ x, y: baseY - 38 * k }] };
  }

  private drawCrop(g: Phaser.GameObjects.Graphics, x: number, baseY: number, opt: { h?: number; fruits?: number; stake?: boolean; young?: boolean } = {}): Anchors {
    const crop = this.opts.crop;
    const young = !!opt.young;
    switch (this.shape) {
      case 'upright': return this.drawUpright(g, x, baseY, young ? 70 : (opt.h ?? 150), young ? 0 : opt.fruits ?? 2, opt.stake);
      case 'rosette': {
        const big = crop.id === 'napa_cabbage';
        return this.drawRosette(g, x, baseY, young ? 0.55 : big ? 1.5 : 1.1, crop.id.startsWith('jeok') ? 0xb04a5a : 0x5cb84a);
      }
      case 'root': {
        const a = this.drawRosette(g, x, baseY - 6, young ? 0.5 : 0.9);
        if (!young) {
          const c = crop.id === 'carrot' ? 0xe8802a : 0xeef0e8;
          g.fillStyle(c, 1); g.fillEllipse(x, baseY + 2, 16, 14);
          if (crop.id === 'turnip') { g.fillStyle(0x9a50b8, 1); g.fillEllipse(x, baseY - 1, 16, 7); }
        }
        return a;
      }
      case 'allium': {
        const hs = young ? [16, 22, 26, 22, 18] : [34, 44, 52, 44, 36];
        g.fillStyle(0x4aa040, 1);
        hs.forEach((h, i) => g.fillRect(x + (i - 2) * 4 - 1, baseY - h, 2, h));
        if (crop.id === 'leek') { g.fillStyle(0xeef0e8, 1); g.fillRect(x - 4, baseY - 22, 8, 22); }
        if (crop.id === 'onion' || crop.id === 'garlic') { g.fillStyle(0xd8c8a0, 1); g.fillEllipse(x, baseY - 3, 16, 10); }
        const tips = hs.map((h, i) => ({ x: x + (i - 2) * 4, y: baseY - h }));
        return { top: { x, y: baseY - Math.max(...hs) }, fork: { x, y: baseY - 14 }, base: { x, y: baseY }, leaves: tips, fruit: [], tips };
      }
      case 'bush': {
        const k = young ? 0.6 : 1;
        g.fillStyle(0x3a6a2a, 1); g.fillRect(x - 2, baseY - 20 * k, 4, 20 * k);
        g.fillStyle(0x4aa040, 1);
        const L: [number, number, number, number][] = [[0, -30, 30, 26], [-12, -18, 20, 16], [12, -18, 20, 16], [0, -44, 18, 14]];
        const leaves: P[] = [];
        for (const [dx, dy, w, h] of L) { g.fillEllipse(x + dx * k, baseY + dy * k, w * k, h * k); leaves.push({ x: x + dx * k, y: baseY + dy * k }); }
        g.fillStyle(0x6ac85a, 1); g.fillEllipse(x - 4 * k, baseY - 34 * k, 8 * k, 5 * k);
        return { top: { x, y: baseY - 52 * k }, fork: { x, y: baseY - 20 * k }, base: { x, y: baseY }, leaves, fruit: [], tips: [{ x, y: baseY - 52 * k }] };
      }
      case 'vine': {
        g.lineStyle(3, 0x3a6a2a, 1);
        g.beginPath(); g.moveTo(x - 30, baseY - 6);
        for (let i = 1; i <= 6; i++) g.lineTo(x - 30 + i * 10, baseY - 6 - (i % 2 ? 4 : 0));
        g.strokePath();
        const leaves: P[] = [];
        for (const dx of [-20, 0, 20]) { g.fillStyle(0x4aa040, 1); g.fillCircle(x + dx, baseY - 16, young ? 6 : 9); g.fillStyle(0x3a8a30, 1); g.fillRect(x + dx - 0.5, baseY - 22, 1, 10); leaves.push({ x: x + dx, y: baseY - 16 }); }
        const fc = crop.id === 'watermelon' ? 0x2a6a2a : crop.id === 'korean_melon' ? 0xf0d040 : crop.id === 'gourd' ? 0xc8e8a0 : 0x6ab04a;
        const fruit: P[] = young ? [] : [{ x: x - 10, y: baseY - 5 }, { x: x + 12, y: baseY - 5 }];
        g.fillStyle(fc, 1); for (const f of fruit) g.fillEllipse(f.x, f.y, 12, 8);
        return { top: { x: x + 30, y: baseY - 6 }, fork: { x: x - 26, y: baseY - 6 }, base: { x, y: baseY }, leaves, fruit, tips: [{ x: x + 30, y: baseY - 8 }] };
      }
      case 'corn': {
        const h = young ? 80 : 170;
        g.fillStyle(0x4a8a2a, 1); g.fillRect(x - 2, baseY - h, 4, h);
        g.fillStyle(0x5cb84a, 1);
        for (let i = 0; i < 5; i++) { const yy = baseY - 20 - i * (h / 6); g.fillEllipse(x + (i % 2 ? 14 : -14), yy, 28, 5); }
        const fruit: P[] = [];
        if (!young) {
          g.fillStyle(0xe8d070, 1); for (let i = -2; i <= 2; i++) g.fillRect(x + i * 3, baseY - h - 10, 1, 10);
          for (const yy of [baseY - 86, baseY - 64]) { g.fillStyle(0x8ac860, 1); g.fillEllipse(x + 8, yy, 8, 22); g.fillStyle(0xb8864a, 1); g.fillRect(x + 8, yy - 14, 2, 5); fruit.push({ x: x + 8, y: yy }); }
        }
        return { top: { x, y: baseY - h }, fork: { x, y: baseY - 10 }, base: { x, y: baseY }, leaves: [], fruit, tips: [{ x, y: baseY - h }] };
      }
      case 'grass': {
        g.fillStyle(0x6ab04a, 1);
        const tips: P[] = [];
        for (let i = -3; i <= 3; i++) { const h = 36 + ((i * 7 + 21) % 5) * 4; g.fillRect(x + i * 3, baseY - h, 2, h); tips.push({ x: x + i * 3, y: baseY - h }); }
        return { top: { x, y: baseY - 52 }, fork: { x, y: baseY - 10 }, base: { x, y: baseY }, leaves: tips, fruit: [], tips };
      }
      case 'shrub': {
        g.fillStyle(0x6a4a2c, 1); g.fillRect(x - 2, baseY - 60, 4, 60);
        g.lineStyle(3, 0x6a4a2c, 1);
        const tips: P[] = [{ x: x - 20, y: baseY - 92 }, { x: x + 20, y: baseY - 92 }, { x: x - 10, y: baseY - 114 }, { x: x + 10, y: baseY - 114 }];
        for (const tp of tips) { g.beginPath(); g.moveTo(x, baseY - 60); g.lineTo(tp.x, tp.y); g.strokePath(); }
        g.fillStyle(0x4aa040, 1);
        for (const tp of tips) { g.fillEllipse(tp.x - 5, tp.y + 4, 8, 5); g.fillEllipse(tp.x + 5, tp.y + 8, 8, 5); }
        const fruit: P[] = [];
        if (crop.id === 'blueberry') { g.fillStyle(0x3a4aa8, 1); for (const tp of tips) { g.fillCircle(tp.x + 2, tp.y + 14, 3); fruit.push({ x: tp.x + 2, y: tp.y + 14 }); } }
        return { top: { x, y: baseY - 114 }, fork: { x, y: baseY - 60 }, base: { x, y: baseY }, leaves: tips, fruit, tips };
      }
      case 'strawberry': {
        g.fillStyle(0x3f8a34, 1);
        for (const [dx, dy] of [[-8, -14], [0, -18], [8, -14], [-5, -8], [5, -8]] as const) g.fillEllipse(x + dx, baseY + dy, 10, 8);
        const fruit: P[] = young ? [] : [{ x: x - 10, y: baseY - 3 }, { x: x + 10, y: baseY - 3 }];
        g.fillStyle(0xe8243a, 1); for (const f of fruit) g.fillTriangle(f.x - 4, f.y - 3, f.x + 4, f.y - 3, f.x, f.y + 5);
        return { top: { x, y: baseY - 22 }, fork: { x, y: baseY - 6 }, base: { x, y: baseY }, leaves: [{ x: x - 8, y: baseY - 14 }, { x: x + 8, y: baseY - 14 }], fruit, tips: [] };
      }
      case 'jar': {
        g.fillStyle(0x7a4a2a, 1); g.fillRoundedRect(x - 34, baseY - 90, 68, 90, 10);
        g.fillStyle(0x5a3420, 1); g.fillRect(x - 36, baseY - 92, 72, 6);
        g.fillStyle(0xe8d070, 1); for (let i = -4; i <= 4; i++) g.fillCircle(x + i * 7, baseY - 96, 3);
        return { top: { x, y: baseY - 96 }, fork: { x, y: baseY - 60 }, base: { x, y: baseY }, leaves: [], fruit: [], tips: [{ x: x - 30, y: baseY - 94 }, { x: x + 30, y: baseY - 94 }] };
      }
      case 'tray': {
        g.fillStyle(0x2a3036, 1); g.fillRect(x - 70, baseY - 18, 140, 18);
        g.fillStyle(0x7ac85a, 1); for (let i = -16; i <= 16; i++) g.fillRect(x + i * 4, baseY - 30 - (i % 3) * 3, 1, 12 + (i % 3) * 3);
        g.fillStyle(0xa060c0, 1); for (let i = -15; i <= 15; i += 4) g.fillRect(x + i * 4, baseY - 32, 2, 2);
        return { top: { x, y: baseY - 34 }, fork: { x, y: baseY - 18 }, base: { x, y: baseY }, leaves: [], fruit: [], tips: [{ x: x - 60, y: baseY - 40 }, { x: x + 60, y: baseY - 40 }] };
      }
      case 'bag': {
        g.fillStyle(0xd8ccb0, 1); g.fillRoundedRect(x - 32, baseY - 110, 64, 110, 8);
        g.fillStyle(0xeee6d4, 0.6); g.fillRect(x - 26, baseY - 104, 8, 96);
        const mc = crop.id === 'wood_ear' ? 0x5a3424 : crop.id === 'lions_mane' ? 0xf4f0e6 : 0x8a8478;
        const fruit: P[] = [{ x: x + 30, y: baseY - 70 }, { x: x - 30, y: baseY - 44 }];
        g.fillStyle(mc, 1);
        for (const f of fruit) { if (crop.id === 'lions_mane') g.fillCircle(f.x, f.y, 10); else { g.fillEllipse(f.x, f.y, 18, 10); g.fillEllipse(f.x + (f.x > x ? 4 : -4), f.y + 8, 14, 8); } }
        return { top: { x, y: baseY - 110 }, fork: { x, y: baseY - 60 }, base: { x, y: baseY }, leaves: [], fruit, tips: [] };
      }
    }
  }

  private addTarget(x: number, y: number, r: number, color: number, shape: TargetShape, extra: Partial<Target> = {}): Target {
    const scene = this.scene;
    const objs: Phaser.GameObjects.GameObject[] = [];
    const g = scene.add.graphics();
    if (shape === 'bud') { g.fillStyle(color, 1); g.fillEllipse(x, y, r * 1.6, r); g.fillStyle(0xb4e47a, 1); g.fillRect(x - 1, y - r, 2, r); }
    else if (shape === 'flower') { g.fillStyle(0xf8f8f0, 1); g.fillCircle(x, y, r); g.fillStyle(0xf0c040, 1); g.fillCircle(x, y, r * 0.4); }
    else if (shape === 'fruit') {
      g.fillStyle(cv(0xd0382a), 1); g.fillRect(x - 2, y - r, 4, r * 2); g.fillStyle(0x1a0a0a, 1); g.fillRect(x - 1, y - 2, 2, 2); g.fillRect(x, y + 3, 2, 2);
      // 251차 — 「모양으로도 표시」: 다른 표적처럼 노란 고리(병든 빨강 열매 ↔ 성한 초록 열매가 같은 색으로 보이는 눈)
      if (shapeCuesOn()) { g.lineStyle(1, 0xffd257, 0.9); g.strokeCircle(x, y, r + 3); }
    }
    else if (shape === 'spot') { g.fillStyle(color, 0.55); g.fillCircle(x, y, r); g.lineStyle(1, 0xffd257, 0.9); g.strokeCircle(x, y, r); }
    else if (shape === 'stake') { g.lineStyle(1, 0xffd257, 0.9); g.strokeRect(x - 3, y - r, 6, r * 2); }
    else if (shape === 'band') { g.fillStyle(color, 0.35); g.fillRect(x - r, y - 6, r * 2, 12); g.lineStyle(1, 0xffd257, 0.8); g.strokeRect(x - r, y - 6, r * 2, 12); }
    else if (shape === 'weed') { g.fillStyle(0x2f6a24, 1); for (let i = -2; i <= 2; i++) g.fillTriangle(x + i * 3 - 2, y, x + i * 3 + 2, y, x + i * 3, y - 8 - (i % 2 ? 0 : 4)); g.lineStyle(1, 0xffd257, 0.7); g.strokeCircle(x, y - 5, r); }
    else if (shape === 'sprout') { g.fillStyle(0x7a8a3a, 1); g.fillRect(x - 1, y - 8, 2, 8); g.fillStyle(color, 1); g.fillEllipse(x - 3, y - 9, 6, 4); g.fillEllipse(x + 3, y - 9, 6, 4); g.lineStyle(1, 0xffd257, 0.7); g.strokeCircle(x, y - 6, r); }
    else if (shape === 'stalk') { g.fillStyle(0x4a8a2a, 1); g.fillRect(x - 1, y, 2, 18); g.fillStyle(color, 1); g.fillCircle(x, y, r * 0.7); g.lineStyle(1, 0xffd257, 0.8); g.strokeCircle(x, y, r); }
    else if (shape === 'small') { g.fillStyle(color, 1); g.fillEllipse(x, y, r * 1.4, r); g.lineStyle(1, 0xffd257, 0.8); g.strokeCircle(x, y, r); }
    else if (shape === 'cut') { g.lineStyle(2, 0xffd257, 0.9); g.lineBetween(x - r, y - r, x + r, y + r); g.lineStyle(1, 0xffd257, 0.6); g.strokeCircle(x, y, r + 2); }
    else if (shape === 'slit') { g.lineStyle(1, 0xffd257, 0.9); g.lineBetween(x - r, y - r, x + r, y + r); g.lineBetween(x - r, y + r, x + r, y - r); }
    else if (shape === 'pest') { g.fillStyle(color, 1); g.fillEllipse(x, y, r * 1.6, r * 0.9); g.fillStyle(0x101010, 1); g.fillRect(x + r * 0.6, y - 1, 2, 2); g.lineStyle(1, 0xffd257, 0.7); g.strokeCircle(x, y, r + 2); }
    else if (shape === 'step') { g.fillStyle(0x3a2616, 0.6); g.fillEllipse(x, y, r, r * 1.8); g.lineStyle(1, 0xffd257, 0.8); g.strokeEllipse(x, y, r + 4, r * 1.8 + 4); }
    else if (shape === 'male') { g.fillStyle(0xf0c830, 1); g.fillCircle(x, y, r); g.fillStyle(0xf8e070, 1); g.fillCircle(x, y, r * 0.45); g.fillStyle(0x4a8a2a, 1); g.fillRect(x - 1, y + r, 2, 10); }
    else if (shape === 'female') { g.fillStyle(0xf0c830, 1); g.fillCircle(x, y, r); g.fillStyle(0x8a7a20, 1); g.fillCircle(x, y, r * 0.35); g.fillStyle(0x6ab04a, 1); g.fillEllipse(x, y + r + 4, 8, 7); }
    else if (shape === 'soil') { g.fillStyle(0x6a4a2c, 1); g.fillEllipse(x, y, r * 2, r); g.lineStyle(1, 0xffd257, 0.8); g.strokeEllipse(x, y, r * 2 + 4, r + 4); }
    else if (shape === 'leaf') { g.fillStyle(color, 1); g.fillEllipse(x, y, r * 2, r); g.lineStyle(1, 0xffd257, 0.7); g.strokeEllipse(x, y, r * 2 + 3, r + 3); }
    else if (shape === 'runner') { g.lineStyle(1, 0x5a8a3a, 1); g.lineBetween(x - 18, y + 2, x, y); g.fillStyle(0x3f8a34, 1); g.fillEllipse(x + 2, y - 2, 8, 6); g.lineStyle(1, 0xffd257, 0.8); g.strokeCircle(x, y, r); }
    else { g.lineStyle(1, 0xffd257, 0.9); g.strokeRect(x - r, y - r, r * 2, r * 2); }
    this.stage.add(g);
    objs.push(g);
    const hit = scene.add.rectangle(x, y, Math.max(18, r * 2.2), Math.max(18, r * 2.2), 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    this.stage.add(hit);
    objs.push(hit);
    const tg: Target = { x, y, r, done: false, obj: objs, ...extra };
    hit.on('pointerdown', () => this.onTarget(tg));
    this.targets.push(tg);
    return tg;
  }

  /** 이 일이 다루는 벌레 · 병(벌레 잡기 · 걷어 내기 표시 색) */
  private troubleOf(): CropDisease | undefined {
    const ds = carePlanOf(this.opts.crop).diseases;
    return this.def.onlyFor?.[0] ?? ds.find((d) => (this.def.id === 'pick_pests') === (DISEASE_DEFS[d].kind !== 'disease'));
  }

  private buildStage(): void {
    const scene = this.scene;
    const g = scene.add.graphics();
    this.stage.add(g);
    const kind: CareWorkKind = this.def.work;
    const id = this.def.id;
    const baseY = STAGE_H - 36;
    const container = CONTAINER.has(this.shape);
    if (container) { g.fillStyle(0x3a2e24, 1); g.fillRect(8, baseY, STAGE_W - 16, 10); g.fillStyle(0x2a2018, 1); g.fillRect(8, baseY + 10, STAGE_W - 16, 4); }
    else {
      g.fillStyle(0x4a3220, 1); g.fillRect(8, baseY, STAGE_W - 16, 22);
      g.fillStyle(0x3a2616, 1); for (let x = 12; x < STAGE_W - 12; x += 14) g.fillRect(x, baseY + 10, 8, 3);
    }
    const plants = container ? 1 : Math.max(1, Math.min(4, this.opts.plants));
    const gap = (STAGE_W - 40) / plants;
    const px = (i: number): number => (container ? STAGE_W / 2 : 20 + gap * (i + 0.5));
    // 무대 전체 — 빗나간 클릭(실수) 판정
    this.stageHit = scene.add.rectangle(STAGE_W / 2, STAGE_H / 2, STAGE_W, STAGE_H, 0xffffff, 0.001).setInteractive();
    this.stage.add(this.stageHit);
    this.stageHit.on('pointerdown', () => this.onStageMiss());
    this.stageHit.on('pointerup', () => this.onStageRelease());
    // 247차 — 거둔 뒤 밭 손질 · 모종 굳히기는 작물 그림 대신 그 일의 무대
    if (id === 'thresh') { this.buildThresh(g, baseY); return; }
    if (id === 'pick_pods') { this.buildPickPods(g, baseY); return; }
    if (id === 'gather_bundle') { this.buildGather(g, baseY); return; }
    if (id === 'winnow') { this.buildWinnow(g, baseY); return; }
    if (id === 'harden_off') { this.buildHarden(g, baseY); return; }
    const staked = this.shape === 'upright' && !['stake', 'ridge_mulch', 'prick_out', 'thin', 'weed'].includes(id) && !!carePlanOf(this.opts.crop).tasks.find((x) => x.id === 'stake');
    const young = ['thin', 'weed', 'net_cover', 'bird_net', 'ridge_mulch', 'slit_bag', 'cover_dark', 'trellis', 'stake', 'straw_mulch'].includes(id)
      && !(this.shape === 'shrub' || this.shape === 'corn' && id === 'bird_net');
    const anchors: Anchors[] = [];
    const drawAll = (opt: Parameters<FarmWorkPanel['drawCrop']>[3] = {}): void => {
      for (let i = 0; i < plants; i++) anchors.push(this.drawCrop(g, px(i), baseY, { stake: staked, young, ...opt }));
    };

    if (kind === 'targets') {
      drawAll({ fruits: id === 'cull_diseased' ? 3 : 2 });
      const trouble = this.troubleOf();
      anchors.forEach((a, i) => {
        const x = px(i);
        if (id === 'pinch_flower') this.addTarget(a.fork.x, a.fork.y - 2, 6, 0xffffff, 'flower');
        else if (id === 'remove_suckers') {
          if (this.shape === 'upright') for (const [dx, dy] of [[-7, 18], [7, 34], [-7, 50]] as const) this.addTarget(x + dx, a.fork.y + dy, 5, 0x8fd16a, 'bud');
          else if (this.shape === 'corn') { this.addTarget(x - 10, baseY - 8, 6, 0x8fd16a, 'bud'); this.addTarget(x + 10, baseY - 10, 6, 0x8fd16a, 'bud'); }
          else { this.addTarget(a.fork.x + 4, a.fork.y - 8, 5, 0x8fd16a, 'bud'); this.addTarget(x + 4, baseY - 22, 5, 0x8fd16a, 'bud'); }
        } else if (id === 'thin') {
          for (const dx of [-12, 12]) this.addTarget(x + dx, baseY - 2, 7, 0xd8c860, 'sprout');
        } else if (id === 'weed') {
          for (const dx of [-gap * 0.32, gap * 0.32]) this.addTarget(x + dx, baseY - 1, 8, 0, 'weed');
        } else if (id === 'pinch_tip') {
          for (const tp of a.tips.slice(0, 2)) this.addTarget(tp.x, tp.y - 2, 6, 0xa8e070, 'bud');
        } else if (id === 'remove_flower') {
          this.addTarget(a.top.x + 4, a.top.y - 18, 7, 0xf4f0e0, 'stalk');
        } else if (id === 'thin_fruit') {
          const f = a.fruit[0] ?? { x: x + 6, y: baseY - 6 };
          this.addTarget(f.x + 10, f.y - 6, 6, 0x9ad070, 'small');
        } else if (id === 'prune') {
          for (const tp of a.tips.slice(0, 3)) this.addTarget((tp.x + a.fork.x) / 2, (tp.y + a.fork.y) / 2, 6, 0, 'cut');
        } else if (id === 'remove_runner') {
          this.addTarget(x + 26, baseY - 4, 7, 0, 'runner');
        } else if (id === 'strip_leaves') {
          for (const dx of [-12, 12]) this.addTarget(x + dx, baseY - 24, 7, 0xc8c050, 'leaf');
        } else if (id === 'slit_bag') {
          for (const [dx, dy] of [[-10, -76], [12, -50], [-6, -28]] as const) this.addTarget(x + dx, baseY + dy, 6, 0, 'slit');
        } else if (id === 'pick_pests') {
          const col = trouble === 'aphid' ? 0xc8f080 : trouble === 'stink_bug' ? 0x8a6a3a : trouble === 'flea_beetle' ? 0x202024 : 0x6ac040;
          for (const lf of a.leaves.slice(0, 2)) this.addTarget(lf.x, lf.y - 2, 5, col, 'pest');
        } else {
          // 병든 것 걷어 내기 — 열매 작물은 병든 열매, 잎 · 뿌리는 병든 잎, 배지는 곰팡이 자리
          if (this.shape === 'upright') for (const [dx, dy] of [[-10, 30], [12, 22]] as const) this.addTarget(x + dx, a.fork.y - dy, 6, 0xd0382a, 'fruit');
          else if (this.shape === 'bag') { this.addTarget(x - 8, baseY - 80, 8, 0x2a8a4a, 'spot'); this.addTarget(x + 10, baseY - 36, 8, 0x2a8a4a, 'spot'); }
          else {
            const col = trouble === 'powdery_mildew' ? 0xf4f6f0 : trouble === 'rust' ? 0xe8781a : 0x8a6a3a;
            for (const lf of (a.leaves.length ? a.leaves : [a.top]).slice(0, 2)) this.addTarget(lf.x, lf.y, 6, col, 'spot');
          }
        }
      });
      this.setStatus(`${t('남은 것')} ${this.targets.length}`);
    } else if (kind === 'place') {
      if (id === 'stake' || id === 'trellis') {
        drawAll({ h: 90, fruits: 0 });
        anchors.forEach((_a, i) => this.addTarget(px(i) + 10, baseY - 60, 60, 0xffd257, 'stake'));
      } else if (id === 'tread') {
        drawAll();
        for (let i = 0; i < 5; i++) this.addTarget(30 + (STAGE_W - 60) * (i / 4), baseY - 6, 8, 0, 'step');
      } else if (id === 'cover_dark' || id === 'uncover_light') {
        const a = this.drawCrop(g, px(0), baseY, {});
        if (id === 'uncover_light') { g.fillStyle(0xe8eef4, 0.55); g.fillRect(px(0) - 74, baseY - 52, 148, 30); }
        for (const tp of a.tips) this.addTarget(tp.x, tp.y, 9, 0, 'cell');
      } else if (id === 'bird_net' && this.shape === 'corn') {
        drawAll();
        for (const a of anchors) for (const f of a.fruit) this.addTarget(f.x, f.y, 9, 0, 'cell');
      } else {
        // 두둑 · 덮개 띠 4칸(멀칭 · 방충망 · 새 그물 · 부직포 · 짚)
        drawAll({ fruits: 0 });
        g.fillStyle(0x6a4a2c, 0.5); g.fillRoundedRect(20, baseY - 40, STAGE_W - 40, 34, 6);
        const n = 4, cw = (STAGE_W - 48) / n;
        for (let i = 0; i < n; i++) this.addTarget(24 + cw * (i + 0.5), baseY - 23, cw / 2 - 2, 0x101010, 'cell');
      }
      this.setStatus(`${t('차례')} 1 / ${this.targets.length}`);
    } else if (kind === 'tie') {
      this.roundsNeeded = plants;
      const head = id === 'tie_head';
      drawAll({ h: 160, fruits: 2 });
      // 띠 = 지주의 중간 높이(배추는 포기 허리). 표시가 위아래로 흔들린다
      this.addTarget(px(0) + (head ? 0 : 10), head ? baseY - 24 : baseY - 100, 14, 0x4af2a1, 'band');
      this.marker = scene.add.graphics();
      this.stage.add(this.marker);
      this.setStatus(`${t('묶은 포기')} 0 / ${plants}`);
    } else if (kind === 'hold') {
      this.roundsNeeded = Math.min(2, plants);
      drawAll({ fruits: 2 });
      if (id === 'water_flood') { g.fillStyle(0x3a7ac8, 0.45); g.fillRect(8, baseY + 4, STAGE_W - 16, 8); }
      this.gaugeG = scene.add.graphics();
      this.stage.add(this.gaugeG);
      this.drawGauge();
      this.setStatus(`${t('친 포기')} 0 / ${this.roundsNeeded}`);
    } else if (kind === 'sprinkle') {
      drawAll({ fruits: 2, h: 130 });
      const spots = plants + 1;
      for (let i = 0; i < spots; i++) this.addTarget(20 + gap * i, baseY + 8, 9, id === 'acidify' ? 0x8a6440 : 0xd8b878, 'spot');
      this.setStatus(`${t('남은 자리')} ${this.targets.length}`);
    } else if (kind === 'drag') {
      // 245차 — 북주기: 고랑의 흙(표시)을 눌러 포기 밑동 띠까지 끌어 올린다
      drawAll({ fruits: 0 });
      anchors.forEach((a, i) => {
        const dest = { x: a.base.x, y: baseY - 6, r: 14 };
        const gg = scene.add.graphics();
        gg.lineStyle(1, 0x4af2a1, 0.7); gg.strokeEllipse(dest.x, dest.y, dest.r * 2, 12);
        this.stage.add(gg);
        this.addTarget(px(i) + Math.min(28, gap * 0.36), baseY + 14, 7, 0, 'soil', { dest });
      });
      this.dragLine = scene.add.graphics();
      this.stage.add(this.dragLine);
      this.setStatus(`${t('북준 포기')} 0 / ${this.targets.length}`);
    } else if (kind === 'pair') {
      // 245차 — 인공수분: 수꽃(꽃만) · 암꽃(꽃 밑에 어린 열매)
      drawAll({ fruits: 0 });
      const pairs = Math.max(2, Math.min(3, plants + 1));
      // 꽃이 공중에 뜨지 않게 — 땅을 기는 덩굴 마디에서 수꽃 · 암꽃 꽃대가 올라온다
      const vg = scene.add.graphics();
      for (let i = 0; i < pairs; i++) {
        const x = 40 + (STAGE_W - 80) * (i / Math.max(1, pairs - 1));
        vg.lineStyle(3, 0x3a6a2a, 1); vg.lineBetween(x - 34, baseY - 6, x + 34, baseY - 8);
        vg.lineStyle(2, 0x4a8a2a, 1); vg.lineBetween(x - 14, baseY - 8, x - 14, baseY - 56); vg.lineBetween(x + 14, baseY - 8, x + 14, baseY - 36);
        vg.fillStyle(0x4aa040, 1); vg.fillCircle(x - 28, baseY - 16, 8); vg.fillCircle(x + 30, baseY - 18, 9);
        vg.fillStyle(0x3a8a30, 1); vg.fillRect(x - 28.5, baseY - 22, 1, 10); vg.fillRect(x + 29.5, baseY - 25, 1, 11);
      }
      this.stage.add(vg);
      for (let i = 0; i < pairs; i++) {
        const x = 40 + (STAGE_W - 80) * (i / Math.max(1, pairs - 1));
        this.addTarget(x - 14, baseY - 64, 7, 0, 'male', { role: 'male' });
        this.addTarget(x + 14, baseY - 44, 7, 0, 'female', { role: 'female' });
      }
      this.pairRing = scene.add.graphics();
      this.stage.add(this.pairRing);
      this.roundsNeeded = pairs;
      this.setStatus(`${t('맺어 준 꽃')} 0 / ${pairs}`);
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

  // ── 247차 — 거둔 뒤 밭 손질 무대 ─────────────

  /** 털기 단 색 — 보리 · 콩 · 참깨 · 들깨 */
  private sheafColors(): { stalk: number; head: number; seed: number } {
    switch (this.opts.crop.id) {
      case 'barley': return { stalk: 0xd8b860, head: 0xe8c870, seed: 0xd8b060 };
      case 'soybean': return { stalk: 0x8a6a40, head: 0xa8885a, seed: 0xe0d098 };
      case 'chamkkae': return { stalk: 0x9a8a5a, head: 0xb89a5a, seed: 0xf2ead2 };
      default: return { stalk: 0x7a5a3a, head: 0x6a4a2a, seed: 0x5a4030 };
    }
  }

  /** 마른 단 하나(눕힌 다발 — 왼쪽 밑동 · 오른쪽 이삭 · 꼬투리) — left = 남은 알(0..1) */
  private drawSheaf(g: Phaser.GameObjects.Graphics, x: number, y: number, left: number): void {
    const c = this.sheafColors();
    g.clear();
    // 줄기 다발(빈 단은 누렇게 바랜 짚)
    const stalk = left > 0 ? c.stalk : 0xc8b890;
    for (let k = -4; k <= 4; k++) {
      g.fillStyle(k % 2 ? stalk : Phaser.Display.Color.IntegerToColor(stalk).darken(12).color, 1);
      g.fillRect(x - 44, y + k * 3 - 1, 74, 2);
    }
    g.fillStyle(0x3a2a16, 0.35); g.fillRect(x - 44, y + 13, 74, 3);                 // 그림자
    g.fillStyle(0xe8d8a0, 1); g.fillRect(x - 16, y - 14, 5, 28);                   // 묶은 끈
    g.fillStyle(0xb8a070, 1); g.fillRect(x - 16, y - 14, 1, 28);
    if (left <= 0) return;
    const heads = Math.max(1, Math.round(9 * left));
    for (let k = 0; k < heads; k++) {
      const hx = x + 18 + (k % 3) * 9, hy = y - 10 + Math.floor(k / 3) * 9;
      if (this.opts.crop.id === 'barley') {
        g.fillStyle(c.head, 1); g.fillEllipse(hx, hy, 14, 6);
        g.lineStyle(1, c.head, 1); g.lineBetween(hx + 7, hy, hx + 16, hy - 3);
      } else {
        g.fillStyle(Phaser.Display.Color.IntegerToColor(c.head).darken(15).color, 1); g.fillEllipse(hx + 1, hy + 1, 9, 10);
        g.fillStyle(c.head, 1); g.fillEllipse(hx, hy, 8, 9);
        g.fillStyle(c.seed, 1); g.fillRect(hx - 1, hy - 2, 2, 2); g.fillRect(hx + 1, hy + 1, 2, 2);
      }
    }
  }

  /** 털기 — 깔개 위 마른 단 4개 · 단마다 세 번 */
  private buildThresh(g: Phaser.GameObjects.Graphics, baseY: number): void {
    g.fillStyle(0x3a5a2a, 1); g.fillRect(8, 40, STAGE_W - 16, STAGE_H - 40 - 8);
    g.fillStyle(0xc8b890, 1); g.fillRect(16, baseY - 120, STAGE_W - 32, 132);
    g.lineStyle(1, 0x8a7a58, 1); g.strokeRect(16, baseY - 120, STAGE_W - 32, 132);
    for (let x = 24; x < STAGE_W - 24; x += 16) { g.fillStyle(0xb8a880, 1); g.fillRect(x, baseY - 116, 1, 124); }
    const n = 4;
    for (let i = 0; i < n; i++) {
      const x = 70 + (i % 2) * 150, y = baseY - 86 + Math.floor(i / 2) * 62;
      const sg = this.scene.add.graphics();
      this.stage.add(sg);
      const tg = this.addTarget(x, y, 30, 0, 'cell', { hp: 3 });
      // 표시 테두리 대신 단 그림 — 표시 그림은 지우고 단을 그린다
      (tg.obj[0] as Phaser.GameObjects.Graphics).clear();
      tg.obj.unshift(sg);
      tg.redraw = (left) => this.drawSheaf(sg, x, y, left);
      tg.redraw(1);
    }
    this.setStatus(`${t('남은 단')} ${n}`);
  }

  /** 털기 한 번 — 알이 깔개에 튄다 */
  private sheafHit(tg: Target): void {
    const c = this.sheafColors();
    const g = this.scene.add.graphics();
    g.fillStyle(c.seed, 1);
    for (let k = 0; k < 7; k++) g.fillRect(tg.x - 20 + ((k * 13) % 44), tg.y + 16 + ((k * 7) % 14), 2, 2);
    this.stage.add(g);
    tg.redraw?.((tg.hp ?? 0) / 3);
    const sg = tg.obj[0] as Phaser.GameObjects.Graphics;
    this.scene.tweens.add({ targets: sg, x: { from: -3, to: 0 }, duration: 120, ease: 'Sine.easeOut' });
  }

  /** 꼬투리 따기(땅콩) — 뒤집어 말린 포기 3개 · 여문 꼬투리 6 · 쭉정이 3 */
  private buildPickPods(g: Phaser.GameObjects.Graphics, baseY: number): void {
    g.fillStyle(0x4a3220, 1); g.fillRect(8, baseY, STAGE_W - 16, 22);
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * 110;
      // 뒤집힌 포기 — 마른 잎은 아래, 뿌리 · 꼬투리는 위
      g.fillStyle(0x8a7a4a, 1); g.fillEllipse(x, baseY - 14, 60, 20);
      g.lineStyle(2, 0x9a8a5a, 1);
      for (let k = -2; k <= 2; k++) g.lineBetween(x + k * 6, baseY - 22, x + k * 9, baseY - 96);
      for (let k = 0; k < 2; k++) this.addTarget(x - 16 + k * 30, baseY - 70 - k * 18, 7, 0xd8c08a, 'small');
      this.addTarget(x + 6, baseY - 50, 6, 0x9a8a6a, 'small', { role: 'bad' });
    }
    // 쭉정이는 납작하고 흐리다 — 테두리를 지운다(표시는 여문 것에만)
    for (const tg of this.targets) if (tg.role === 'bad') {
      const gg = tg.obj[0] as Phaser.GameObjects.Graphics;
      gg.clear(); gg.fillStyle(0x8a7a5a, 1); gg.fillEllipse(tg.x, tg.y, 8, 4);
    }
    this.setStatus(`${t('남은 꼬투리')} ${this.goodLeft()}`);
  }

  /** 묶어 거두기(마늘 · 양파) — 마른 알뿌리 6개를 주워 오른쪽 묶음으로 */
  private buildGather(g: Phaser.GameObjects.Graphics, baseY: number): void {
    g.fillStyle(0x4a3220, 1); g.fillRect(8, baseY, STAGE_W - 16, 22);
    g.fillStyle(0x6a4a2c, 1); g.fillRect(STAGE_W - 70, 30, 6, baseY - 30);   // 매달 막대
    g.fillRect(STAGE_W - 96, 30, 60, 5);
    const col = this.opts.crop.id === 'onion' ? 0xc89a5a : 0xe8dcc8;
    for (let i = 0; i < 6; i++) {
      const x = 30 + (i % 3) * 64, y = baseY - 14 - Math.floor(i / 3) * 38;
      const tg = this.addTarget(x, y, 9, col, 'small');
      const gg = tg.obj[0] as Phaser.GameObjects.Graphics;
      gg.clear();
      gg.fillStyle(0xb8a070, 1); gg.fillRect(x - 22, y - 2, 16, 3);          // 마른 줄기
      gg.fillStyle(col, 1); gg.fillCircle(x, y, 8);
      gg.fillStyle(0x8a7a5a, 1); gg.fillRect(x - 2, y + 7, 4, 3);              // 뿌리
      gg.lineStyle(1, 0xffd257, 0.7); gg.strokeCircle(x, y, 11);
    }
    this.setStatus(`${t('남은 것')} ${this.targets.length}`);
  }

  /** 키질 — 키를 띠 높이에서 까부른다(세 번) */
  private buildWinnow(g: Phaser.GameObjects.Graphics, baseY: number): void {
    g.fillStyle(0x3a5a2a, 1); g.fillRect(8, 40, STAGE_W - 16, STAGE_H - 48);
    const cx = STAGE_W / 2 - 30;
    // 키(대나무 — 앞이 넓다)
    g.fillStyle(0xc8a860, 1); g.fillRoundedRect(cx - 60, baseY - 30, 120, 34, 14);
    g.lineStyle(1, 0x8a6a30, 1);
    for (let x = cx - 54; x < cx + 56; x += 8) g.lineBetween(x, baseY - 28, x + 4, baseY + 2);
    // 알 · 검불
    this.chaffG = this.scene.add.graphics();
    this.stage.add(this.chaffG);
    this.drawChaff(cx, baseY - 26, 1);
    this.chaffAt = { x: cx, y: baseY - 26 };
    this.roundsNeeded = 3;
    this.addTarget(cx, baseY - 120, 16, 0x4af2a1, 'band');
    this.marker = this.scene.add.graphics();
    this.stage.add(this.marker);
    this.setStatus(`${t('까부른 번')} 0 / 3`);
  }
  private chaffG?: Phaser.GameObjects.Graphics;
  private chaffAt = { x: 0, y: 0 };

  /** 키 속 — 알(무거운) + 검불(가벼운 · left 0..1) */
  private drawChaff(x: number, y: number, left: number): void {
    const g = this.chaffG!;
    const c = this.sheafColors();
    g.clear();
    g.fillStyle(c.seed, 1);
    for (let k = 0; k < 26; k++) g.fillRect(x - 40 + ((k * 17) % 80), y + 2 + ((k * 5) % 10), 2, 2);
    g.fillStyle(0xe8d8a0, 0.95);
    const n = Math.round(18 * left);
    for (let k = 0; k < n; k++) g.fillRect(x - 44 + ((k * 23) % 88), y - 2 + ((k * 11) % 12), 4, 2);
  }

  /** 모종 굳히기 — 집 안 트레이를 그늘 → 반그늘 → 볕 자리로 차례로 */
  private buildHarden(g: Phaser.GameObjects.Graphics, baseY: number): void {
    // 왼쪽 = 집 안(벽 · 문) · 오른쪽 = 마당(나무 그늘 · 볕)
    g.fillStyle(0x3a3a44, 1); g.fillRect(8, 20, 92, baseY - 20 + 22);
    g.fillStyle(0x6a4a2c, 1); g.fillRect(70, baseY - 90, 26, 90);
    g.fillStyle(0x2a3036, 1); g.fillRect(20, baseY - 30, 44, 20);           // 실내 트레이
    g.fillStyle(0x8fd16a, 1); for (let k = 0; k < 6; k++) g.fillRect(24 + k * 7, baseY - 38, 2, 8);
    g.fillStyle(0x4a6a2a, 1); g.fillRect(100, baseY, STAGE_W - 108, 22);
    g.fillStyle(0x2f5a28, 1); g.fillCircle(160, baseY - 120, 50); g.fillStyle(0x5a3a22, 1); g.fillRect(156, baseY - 80, 8, 80);
    g.fillStyle(0x000000, 0.28); g.fillEllipse(160, baseY + 4, 120, 22);      // 나무 그늘
    g.fillStyle(0xfff0a0, 0.18); g.fillCircle(STAGE_W - 40, 50, 26);          // 해
    const spots: [number, number][] = [[150, baseY - 10], [222, baseY - 10], [290, baseY - 10]];
    for (const [x, y] of spots) this.addTarget(x, y, 18, 0, 'cell');
    this.setStatus(`${t('차례')} 1 / ${this.targets.length}`);
  }

  /** 247차 — 남은 여문 것(쭉정이 빼고) */
  private goodLeft(): number { return this.targets.filter((x) => !x.done && x.role !== 'bad').length; }

  // ── 손놀림 ────────────────────────────────

  private onTarget(tg: Target): void {
    if (this.finished || tg.done) return;
    // 마지막 표시에서 시간이 이미 다 됐으면 handFinished가 창을 닫는다(this.scene이 사라진다) — 씬을 먼저 잡아 둔다
    const scene = this.scene;
    const kind = this.def.work;
    if (kind === 'place') {
      const next = this.targets.find((x) => !x.done);
      if (next !== tg) { this.wrong++; this.setStatus('차례가 아니다 — 표시된 자리부터', false); return; }
    }
    if (kind === 'tie') { this.onTieClick(); return; }
    if (kind === 'hold') return;
    if (kind === 'drag') { this.dragFrom = tg; return; }
    if (kind === 'pair') { this.onPairClick(tg); return; }
    // 247차 — 쭉정이는 남긴다(따면 실수) · 털기는 단마다 몇 번씩
    if (tg.role === 'bad') { this.wrong++; this.setStatus('덜 여문 꼬투리는 남긴다', false); return; }
    if (tg.hp !== undefined && tg.hp > 1) {
      tg.hp--;
      this.hits++;
      playSfx('farm_till');
      this.sheafHit(tg);
      this.setStatus(`${t('남은 단')} ${this.goodLeft()}`);
      restoreHandCursor(scene);
      return;
    }
    tg.done = true;
    this.hits++;
    playSfx(this.def.id === 'thresh' ? 'farm_till' : kind === 'tray' ? 'farm_plant' : kind === 'place' ? 'item_move'
      : kind === 'sprinkle' ? 'farm_fertilize' : kind === 'targets' ? 'farm_harvest' : 'work_step');
    if (tg.redraw) { tg.redraw(0); for (const o of tg.obj.slice(1)) o.destroy(); }
    else for (const o of tg.obj) o.destroy();
    const left = this.goodLeft();
    if (kind === 'tray') {
      const g = this.scene.add.graphics();
      const k = this.hits - 1;
      const cx = 216 + (k % 3) * 42, cy = 68 + Math.floor(k / 3) * 46;
      g.fillStyle(0x5c3f24, 1); g.fillRect(cx - 14, cy + 6, 28, 8);
      g.fillStyle(0x8fd16a, 1); g.fillEllipse(cx, cy, 12, 8); g.fillRect(cx - 1, cy, 2, 8);
      this.stage.add(g);
      this.setStatus(`${t('옮길 싹')} ${left}`);
    } else if (kind === 'place') {
      this.stage.add(this.placedGraphic(tg));
      this.setStatus(left > 0 ? `${t('차례')} ${this.hits + 1} / ${this.targets.length}` : '다 했다');
    } else if (kind === 'sprinkle') {
      const g = this.scene.add.graphics();
      g.fillStyle(this.def.id === 'acidify' ? 0x6a4a2c : 0xd8dce4, 1); for (let i = 0; i < 6; i++) g.fillRect(tg.x - 8 + (i * 5) % 16, tg.y - 4 + (i * 3) % 8, 2, 2);
      this.stage.add(g);
      this.setStatus(`${t('남은 자리')} ${left}`);
    } else if (this.def.id === 'thresh') {
      this.sheafHit(tg);
      this.setStatus(left > 0 ? `${t('남은 단')} ${left}` : '다 털었다');
    } else if (this.def.id === 'pick_pods') {
      this.setStatus(left > 0 ? `${t('남은 꼬투리')} ${left}` : '여문 것은 다 땄다');
    } else if (this.def.id === 'gather_bundle') {
      // 주운 알뿌리는 오른쪽 막대에 줄기째 묶여 매달린다
      const k = this.hits - 1;
      const g = this.scene.add.graphics();
      const hx = STAGE_W - 88 + (k % 3) * 18, hy = 52 + Math.floor(k / 3) * 26;
      g.lineStyle(2, 0xb8a070, 1); g.lineBetween(hx, 36, hx, hy - 6);
      g.fillStyle(this.opts.crop.id === 'onion' ? 0xc89a5a : 0xe8dcc8, 1); g.fillCircle(hx, hy, 7);
      this.stage.add(g);
      this.setStatus(left > 0 ? `${t('남은 것')} ${left}` : '다 묶어 매달았다');
    } else {
      this.setStatus(`${t('남은 것')} ${left}`);
    }
    if (left === 0) this.handFinished();
    restoreHandCursor(scene);
  }

  /** 245차 — 놓은 것의 그림(지주 · 멀칭 · 방충망 · 새 그물 · 부직포 · 짚 · 유인망 · 발자국 · 덮개) */
  private placedGraphic(tg: Target): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const id = this.def.id;
    if (id === 'stake' || id === 'trellis') {
      g.fillStyle(0x8a6038, 1); g.fillRect(tg.x - 2, tg.y - tg.r - 10, 4, tg.r * 2 + 10); g.fillStyle(0xe8d8a0, 1); g.fillRect(tg.x - 8, tg.y + 10, 14, 2);
      if (id === 'trellis') { g.lineStyle(1, 0x4aa04a, 0.9); for (let k = 0; k < 6; k++) g.lineBetween(tg.x - 30, tg.y - tg.r + k * 18, tg.x + 30, tg.y - tg.r + k * 18); }
    } else if (id === 'harden_off') {
      g.fillStyle(0x2a3036, 1); g.fillRect(tg.x - 16, tg.y - 6, 32, 12);
      g.fillStyle(0x8fd16a, 1); for (let k = 0; k < 5; k++) g.fillRect(tg.x - 12 + k * 6, tg.y - 14, 2, 8);
    } else if (id === 'tread') {
      g.fillStyle(0x2a1a10, 0.8); g.fillEllipse(tg.x, tg.y, tg.r, tg.r * 1.8);
    } else if (id === 'cover_dark') {
      g.fillStyle(0x15151a, 0.95); g.fillRect(tg.x - 20, tg.y - 6, 40, 14);
    } else if (id === 'uncover_light') {
      g.fillStyle(0xfff4c0, 0.35); g.fillCircle(tg.x, tg.y - 10, 12);
    } else if (id === 'bird_net' && this.shape === 'corn') {
      g.lineStyle(1, 0x202024, 1); g.strokeEllipse(tg.x, tg.y, 14, 28); g.lineBetween(tg.x - 7, tg.y, tg.x + 7, tg.y);
    } else {
      const fill: Record<string, [number, number]> = {
        ridge_mulch: [0x101010, 1], net_cover: [0xe8f0f4, 0.55], bird_net: [0x202024, 0.6], frost_cover: [0xf4f6f8, 0.75], straw_mulch: [0xe0c060, 0.9],
      };
      const [c, a] = fill[id] ?? [0x101010, 1];
      g.fillStyle(c, a); g.fillRect(tg.x - tg.r, tg.y - tg.r + 2, tg.r * 2, tg.r * 2 - 4);
      if (id === 'net_cover' || id === 'bird_net' || id === 'frost_cover') { g.lineStyle(1, 0x9aa8b4, 0.9); g.strokeEllipse(tg.x, tg.y - tg.r, tg.r * 2, tg.r * 2); }
      if (id === 'straw_mulch') { g.lineStyle(1, 0xb08a30, 1); for (let k = -2; k <= 2; k++) g.lineBetween(tg.x + k * 6 - 4, tg.y + 4, tg.x + k * 6 + 4, tg.y - 4); }
    }
    return g;
  }

  /** 표시 밖을 눌렀다 — targets · place · sprinkle · tray · pair는 실수 · hold는 누르기 시작 · tie는 빗나감 · drag는 무시 */
  private onStageMiss(): void {
    if (this.finished || this.handDone) return;
    const kind = this.def.work;
    if (kind === 'hold') { this.holding = true; return; }
    if (kind === 'tie') { this.onTieClick(); return; }
    if (kind === 'drag') return;
    this.wrong++;
    const id = this.def.id;
    // 247차 — 거둔 뒤 손질은 그 일의 말로
    const miss = id === 'thresh' ? '깔개를 쳤다 — 마른 단을 친다' : id === 'pick_pods' ? '꼬투리를 눌러야 한다' : id === 'gather_bundle' ? '마른 알뿌리를 줍는다'
      : kind === 'targets' ? '줄기를 건드렸다 — 표시된 것만 딴다' : kind === 'pair' ? '꽃을 눌러야 한다' : '빗나갔다 — 표시된 자리에';
    this.setStatus(miss, false);
  }

  private onStageRelease(): void {
    if (this.def.work !== 'hold' || !this.holding || this.finished) return;
    this.holding = false;
    this.attempts++;
    const inBand = this.gauge >= 0.6 && this.gauge <= 0.85;
    if (inBand) { this.hits++; playSfx('work_step'); this.setStatus('고르게 쳤다'); }
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
    if (this.def.id === 'winnow') { this.onWinnowClick(); return; }
    this.attempts++;
    const band = this.targets[0];
    const my = this.markerY();
    if (Math.abs(my - band.y) <= 7) {
      this.hits++; this.round++;
      const g = this.scene.add.graphics();
      const gap = (STAGE_W - 40) / Math.max(1, Math.min(4, this.opts.plants));
      const x = 20 + gap * (this.round - 0.5);
      g.fillStyle(0xe8d8a0, 1); g.fillRect(x - (this.def.id === 'tie_head' ? 14 : 6), band.y - 1, this.def.id === 'tie_head' ? 28 : 18, 2);
      this.stage.add(g);
      if (this.round >= this.roundsNeeded) { this.setStatus('다 묶었다'); this.handFinished(); }
      else {
        this.setStatus(`${t('묶은 포기')} ${this.round} / ${this.roundsNeeded}`);
        band.x = x + gap + (this.def.id === 'tie_head' ? 0 : 10);
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

  /** 247차 — 키질: 표시가 띠 안일 때 까부르면 검불이 바람에 날아간다 */
  private onWinnowClick(): void {
    this.attempts++;
    const band = this.targets[0];
    const my = this.markerY();
    if (Math.abs(my - band.y) <= 8) {
      this.hits++; this.round++;
      const g = this.scene.add.graphics();
      g.fillStyle(0xe8d8a0, 0.95);
      for (let k = 0; k < 8; k++) g.fillRect(this.chaffAt.x - 30 + k * 8, this.chaffAt.y - 20 - (k % 3) * 6, 4, 2);
      this.stage.add(g);
      this.scene.tweens.add({ targets: g, x: 140, y: -40, alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => g.destroy() });
      this.drawChaff(this.chaffAt.x, this.chaffAt.y, Math.max(0, 1 - this.round / this.roundsNeeded));
      if (this.round >= this.roundsNeeded) { this.setStatus('검불이 다 날아갔다'); this.handFinished(); }
      else this.setStatus(`${t('까부른 번')} ${this.round} / ${this.roundsNeeded}`);
    } else {
      this.wrong++;
      this.setStatus(my < band.y ? '너무 높이 까불렀다 — 알이 넘쳐 쏟아졌다' : '너무 낮다 — 검불이 날지 않는다', false);
    }
  }

  /** 245차 — 인공수분: 수꽃을 고른 뒤 암꽃 */
  private onPairClick(tg: Target): void {
    if (this.finished || this.handDone) return;
    const scene = this.scene;
    if (tg.role === 'male') {
      this.pairSel = tg;
      this.pairRing?.clear();
      this.pairRing?.lineStyle(2, 0x4af2a1, 1).strokeCircle(tg.x, tg.y, tg.r + 4);
      this.setStatus('수꽃을 땄다 — 암꽃 암술에 묻힌다');
      return;
    }
    if (!this.pairSel) { this.wrong++; this.setStatus('먼저 수꽃을 딴다', false); return; }
    // 짝을 맺었다 — 수꽃은 쓰고 암꽃에 꽃가루 점
    this.pairSel.done = true;
    for (const o of this.pairSel.obj) o.destroy();
    this.pairSel = undefined;
    this.pairRing?.clear();
    tg.done = true;
    const g = this.scene.add.graphics();
    g.fillStyle(0xf8e070, 1); for (let i = 0; i < 5; i++) g.fillRect(tg.x - 3 + (i * 3) % 7, tg.y - 3 + (i * 2) % 6, 2, 2);
    this.stage.add(g);
    this.hits++;
    this.round++;
    this.setStatus(`${t('맺어 준 꽃')} ${this.round} / ${this.roundsNeeded}`);
    if (this.round >= this.roundsNeeded) this.handFinished();
    restoreHandCursor(scene);
  }

  /** 245차 — 북주기 끌기: 화면 좌표 → 무대 좌표 */
  private toStage(p: Phaser.Input.Pointer): P {
    return { x: p.x - this.x - STAGE_X, y: p.y - this.y - this.stageTop };
  }

  private onDragMove(p: Phaser.Input.Pointer): void {
    if (!this.dragFrom || this.finished) return;
    const s = this.toStage(p);
    const g = this.dragLine!;
    g.clear();
    g.lineStyle(4, 0x6a4a2c, 0.9); g.lineBetween(this.dragFrom.x, this.dragFrom.y, s.x, s.y);
  }

  private onDragUp(p: Phaser.Input.Pointer): void {
    const tg = this.dragFrom;
    if (!tg || this.finished) return;
    const scene = this.scene;
    this.dragFrom = undefined;
    this.dragLine?.clear();
    const s = this.toStage(p);
    const d = tg.dest!;
    if (Math.abs(s.x - d.x) <= d.r + 6 && Math.abs(s.y - d.y) <= 14) {
      tg.done = true;
      this.hits++;
      for (const o of tg.obj) o.destroy();
      const g = this.scene.add.graphics();
      g.fillStyle(0x6a4a2c, 1); g.fillTriangle(d.x - d.r - 4, d.y + 8, d.x + d.r + 4, d.y + 8, d.x, d.y - 6);
      this.stage.add(g);
      const left = this.targets.filter((x) => !x.done).length;
      this.setStatus(`${t('북준 포기')} ${this.hits} / ${this.targets.length}`);
      if (left === 0) this.handFinished();
    } else {
      this.wrong++;
      this.setStatus('밑동까지 끌어 올린다', false);
    }
    restoreHandCursor(scene);
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
    g.fillStyle(cv(0x4af2a1), 0.3); g.fillRect(x, y0 + h * (1 - 0.85), 16, h * 0.25);
    g.fillStyle(cv(0x3a8ad0), 1); g.fillRect(x, y0 + h * (1 - this.gauge), 16, h * this.gauge);
    // 251차 — 「모양으로도 표시」: 알맞은 띠(60~85%) 경계 눈금 — 채움이 띠를 덮어도 보이게
    if (shapeCuesOn()) {
      g.lineStyle(2, 0xffffff, 0.95);
      for (const k of [0.6, 0.85]) g.lineBetween(x - 4, y0 + h * (1 - k), x + 20, y0 + h * (1 - k));
    }
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
      playSfx(/water|flood/.test(this.def.id) ? 'farm_water' : 'farm_spray');   // 누르는 동안 이어진다
      this.gauge = Math.min(1, this.gauge + delta / 2500);
      this.drawGauge();
      if (this.gauge >= 1) this.onStageRelease();
    }
    if (this.handDone && this.elapsed >= this.total) this.tryFinish();
    else if (this.handDone) this.setStatus('손은 끝났다 — 마무리하는 중');
  }

  private tryFinish(): void {
    if (this.finished || !this.handDone || this.elapsed < this.total) return;
    this.finished = true;
    playSfx('confirm');
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
  devSkipTime(): void { this.startMs = performance.now() - (this.total + 1) * 1000; }

  /** 하네스: 손놀림과 시간을 건너뛰고 점수로 끝낸다 */
  devFinish(score = 1): void {
    if (this.finished) return;
    this.finished = true;
    this.opts.onDone(score);
    this.opts.onClose();
  }

  /** 하네스: 표시(무대 좌표 · 역할 · 끌어 놓을 곳)를 본다 */
  devTargets(): { x: number; y: number; done: boolean; role?: string; dest?: { x: number; y: number } }[] {
    return this.targets.map((tg) => ({ x: tg.x, y: tg.y, done: tg.done, role: tg.role, dest: tg.dest ? { x: tg.dest.x, y: tg.dest.y } : undefined }));
  }

  /** 하네스: 무대 좌표 → 화면 좌표 */
  devStageToScreen(x: number, y: number): { x: number; y: number } {
    return { x: this.x + STAGE_X + x, y: this.y + this.stageTop + y };
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
        { text: '텃밭 손일은 그 일을 흉내 내는 짧은 손놀림이다. 왼쪽 그림에서 표시된 것을 누르거나, 누르고 있다가 띠 안에서 뗀다.', target: () => this.localRect(STAGE_X, this.contentTop + 8, STAGE_W, STAGE_H) },
        { text: '손이 끝나도 걸리는 시간이 다 차야 끝난다 — 일에는 시간이 든다. 서툴면(실수가 많으면) 효과가 절반이다.', target: () => this.localRect(INFO_X, this.timeBarY - 20, INFO_W, 36) },
      ],
    };
  }
}

/** 텃밭 창이 작업 장면을 열 때 쓰는 아이콘(작업별 자재 · 도구 아이콘 — 벌레 잡기 · 걷어 내기는 그 병해충 표식 · 없으면 싹) */
export function careTaskIcon(scene: Phaser.Scene, st: CareStatus, x: number, y: number, size = 16, crop?: CropDef): Phaser.GameObjects.Image | null {
  const need = st.def.needs?.[0]?.itemId ?? st.def.tools?.[0];
  let key = 'farm_young';
  if (need) key = `it_${need.replace(/^farm_/, '')}`;
  else if (st.def.id === 'cull_diseased' || st.def.id === 'pick_pests') {
    const ds = crop ? carePlanOf(crop).diseases : [];
    const d = st.def.onlyFor?.[0] ?? ds.find((x) => (st.def.id === 'pick_pests') === (DISEASE_DEFS[x].kind !== 'disease')) ?? 'anthracnose';
    key = `dz_${d}`;
  } else if (st.def.id === 'prick_out' || st.def.id === 'harden_off') key = 'it_tray';
  // 247차 — 거둔 뒤 밭 손질
  else if (st.def.id === 'thresh') key = 'it_flail';
  else if (st.def.id === 'winnow') key = 'it_winnow';
  else if ((st.def.id === 'pick_pods' || st.def.id === 'gather_bundle') && crop) key = crop.harvest.itemId;
  return addPixelIcon(scene, key, x, y, size);
}
