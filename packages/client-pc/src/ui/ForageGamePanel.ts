/**
 * @file ForageGamePanel.ts
 * @description 224차 — 채집 손놀림 놀이 창(덮치기 · 줍기 · 떼기 · 파기 · 당기기).
 *
 * 판정은 core `ForageMinigame`(순수 함수) — 여기는 판 그리기와 입력(마우스 · Space)만.
 *  - 마우스를 판 위에서 움직이면 손이 따라간다(덮치기 · 줍기). 누르면 덮친다 · 뗀다 · 판다 · 당긴다.
 *  - Space도 누르기/누르고 있기와 같다.
 *  - 창에 조작 글자를 쓰지 않는다(R11) — 갈래마다 처음 열 때 체험 가이드가 짚어 준다.
 *  - ESC · ✕ = 포기 → 그 생물은 사라진다(사용자 지시 「놓친 생물은 사라지도록」).
 */

import Phaser from 'phaser';
import {
  createForageGame, stepForageGame, mulberry32,
  type ForageGameState, type ForageGameInput, type ForageTool, type ShoreCreature, type ForageGameKind,
} from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { GAME_WIDTH } from '../PhaserConfig.js';
import { t } from '../i18n/I18n.js';
import { maybeStartTour, tourSeen, type TourOptions } from './GuideTour.js';
import { forageSpotTexKey } from '../scenes/field/ForageSystem.js';

const W = 480;
const BOARD_H = 180;
const H = 32 + 12 + BOARD_H + 16;
const BX = 20;
const BW = W - 40;

/** 놀이 갈래 이름 — 창 제목 */
export const FORAGE_GAME_LABEL: Record<ForageGameKind, string> = {
  snatch: '덮치기', pick: '줍기', pry: '떼기', dig: '파기', pull: '당기기',
};

/** 처음 열 때 가이드 문장(갈래마다 다르다 — R11) */
const TOUR_TEXT: Record<ForageGameKind, string[]> = {
  snatch: [
    '달아나는 녀석이다. 마우스를 움직이면 손이 따라가고, 누르면 그 자리를 덮친다.',
    '손이 내려가는 데 잠깐 걸린다. 녀석이 움찔하면 곧 튀어 나간다 — 지금 자리가 아니라 내려갈 때의 자리를 노리자. 손을 너무 빨리 들이대면 놀라 바위 틈으로 숨는다.',
  ],
  pick: [
    '느리게 기는 녀석이다. 손을 가져가 눌러서 집는다.',
    '가시나 껍데기가 날카로운 것은 맨손이면 다칠 수 있다. 장갑을 끼거나 집게를 쓰자.',
  ],
  pry: [
    '바위에 붙은 녀석이다. 오가는 바늘이 초록 칸에 들어올 때 눌러 떼어 낸다.',
    '놓치면 꽉 조여 붙어 칸이 좁아지고 바늘이 빨라진다. 동그라미를 다 채우면 떨어진다.',
  ],
  dig: [
    '묻힌 녀석이다. 누르고 있으면 판다. 오른쪽 막대는 내가 낸 소란이다.',
    '소란이 크면 녀석이 움찔하며 더 깊이 숨는다. 쉬면 조용히 올라오지만 판 구멍도 조금씩 메워진다. 파고 쉬는 박자를 찾자.',
  ],
  pull: [
    '바위 틈에 숨은 녀석이다. 누르고 있으면 끌어낸다. 아래 막대가 줄의 긴장이다 — 밝은 칸 안에서만 끌려 나온다.',
    '녀석이 몸을 부풀리면 곧 버틴다. 그때는 놓아야 한다. 계속 당기면 다리가 끊기고 먹물을 쏘며 달아난다.',
  ],
};

export class ForageGamePanel extends DraggablePanel {
  private gs: ForageGameState;
  private readonly creature: ShoreCreature;
  private readonly rng: () => number;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly img: Phaser.GameObjects.Image | null;
  private readonly boardTop: number;
  private readonly pebbles: { x: number; y: number; r: number; c: number }[] = [];
  private aimX = 0.5;
  private pressed = false;
  private holding = false;
  private paused: boolean;
  private finished = false;
  private readonly onEnd: (s: ForageGameState) => void;
  private readonly underwater: boolean;
  private keySpace?: Phaser.Input.Keyboard.Key;

  constructor(
    scene: Phaser.Scene, creature: ShoreCreature, tool: ForageTool, opts: { dex: number; underwater: boolean },
    onEnd: (s: ForageGameState) => void, onClose: () => void,
  ) {
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const rng = mulberry32(seed);
    const state = createForageGame(creature, tool, rng, opts.dex);
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: 150, width: W, height: H,
      title: `${creature.nameKo} — ${FORAGE_GAME_LABEL[state.kind]}`, onClose, dim: true, depth: 905,
    });
    // 제목은 i18n 훅이 바꾸지 못하는 조합 문자열 — 따로 번역해 붙인다
    this.setTitle(`${t(creature.nameKo)} — ${t(FORAGE_GAME_LABEL[state.kind])}`);
    this.gs = state;
    this.creature = creature;
    this.rng = rng;
    this.onEnd = onEnd;
    this.underwater = opts.underwater;
    this.boardTop = this.contentTop + 12;
    for (let i = 0; i < 26; i++) {
      this.pebbles.push({ x: BX + this.rng() * BW, y: this.boardTop + this.rng() * BOARD_H, r: 1.5 + this.rng() * 3.5, c: this.rng() });
    }
    this.g = scene.add.graphics();
    this.add(this.g);
    const key = forageSpotTexKey(creature);
    this.img = scene.textures.exists(key) ? scene.add.image(0, 0, key).setScale(3) : null;
    if (this.img) this.add(this.img);

    // 입력 — 판 위 누르기 · 움직이기 / Space
    const hit = scene.add.rectangle(BX + BW / 2, this.boardTop + BOARD_H / 2, BW, BOARD_H, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => { this.aimFromPointer(p); this.pressed = true; this.holding = true; });
    hit.on('pointermove', (p: Phaser.Input.Pointer) => this.aimFromPointer(p));
    this.add(hit);
    scene.input.on('pointerup', this.onPointerUp, this);
    this.keySpace = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);
    this.keySpace?.on('down', this.onSpaceDown, this);
    this.keySpace?.on('up', this.onSpaceUp, this);
    scene.events.on('update', this.tick, this);
    this.once('destroy', () => {
      scene.events.off('update', this.tick, this);
      scene.input.off('pointerup', this.onPointerUp, this);
      this.keySpace?.off('down', this.onSpaceDown, this);
      this.keySpace?.off('up', this.onSpaceUp, this);
      // 끝나기 전에 닫았다 = 포기 → 놓친 것으로 친다
      if (!this.finished) { this.finished = true; this.gs.status = 'lost'; this.gs.lost = 'escaped'; this.onEnd(this.gs); }
    });

    // 처음이면 가이드가 끝날 때까지 판을 멈춘다(R11)
    const tourId = `forage_${state.kind}`;
    this.paused = !tourSeen(tourId);
    if (this.paused) maybeStartTour(scene, () => this.buildTour(tourId));
    this.draw();
    this.applyFix();
  }

  private onPointerUp = (): void => { this.holding = false; };
  private onSpaceDown = (): void => { this.pressed = true; this.holding = true; };
  private onSpaceUp = (): void => { this.holding = false; };

  private aimFromPointer(p: Phaser.Input.Pointer): void {
    const lx = p.x - this.x;
    this.aimX = Phaser.Math.Clamp((lx - BX) / BW, 0, 1);
  }

  private buildTour(id: string): TourOptions {
    const texts = TOUR_TEXT[this.gs.kind];
    return {
      id,
      alive: () => this.active,
      anchor: () => this.localRect(0, 0, W, H),
      onDone: () => { this.paused = false; },
      steps: texts.map((text) => ({ text, target: () => this.localRect(BX, this.boardTop, BW, BOARD_H) })),
    };
  }

  /** 하네스용 — 이 판의 상태 */
  get gameState(): ForageGameState { return this.gs; }
  /** 하네스용 — 가이드 없이 바로 시작 */
  devUnpause(): void { this.paused = false; }

  private tick(_time: number, delta: number): void {
    if (!this.active || this.finished) return;
    if (this.paused) { this.pressed = false; this.draw(); return; }
    const input: ForageGameInput = { aimX: this.aimX, press: this.pressed, hold: this.holding };
    this.pressed = false;
    stepForageGame(this.gs, input, delta, this.rng, this.creature);
    this.draw();
    if (this.gs.status !== 'play') {
      this.finished = true;
      this.onEnd(this.gs);
      this.requestClose();
    }
  }

  // ═══════════════════════════════════════════════════
  // 그리기
  // ═══════════════════════════════════════════════════

  private draw(): void {
    const g = this.g;
    g.clear();
    const top = this.boardTop;
    // 바닥 — 물속이면 푸른 물빛 위에, 뭍이면 바위색
    g.fillStyle(this.underwater ? 0x24506a : 0x4a463e, 1);
    g.fillRect(BX, top, BW, BOARD_H);
    for (const p of this.pebbles) {
      g.fillStyle(this.underwater ? (p.c < 0.5 ? 0x2f6683 : 0x1d4258) : (p.c < 0.5 ? 0x5c574c : 0x3a362f), 1);
      g.fillCircle(p.x, p.y, p.r);
    }
    g.lineStyle(2, 0x0a1628, 1);
    g.strokeRect(BX, top, BW, BOARD_H);
    const s = this.gs;
    if (s.snatch) this.drawSnatch();
    else if (s.pry) this.drawPry();
    else if (s.dig) this.drawDig();
    else if (s.pull) this.drawPull();
    // 남은 시간 — 판 위쪽 가는 줄
    const left = Math.max(0, 1 - s.t / s.limitMs);
    g.fillStyle(0x0a1628, 0.8); g.fillRect(BX, top - 6, BW, 3);
    g.fillStyle(left > 0.3 ? 0x9fd0e4 : 0xff9a6a, 1); g.fillRect(BX, top - 6, BW * left, 3);
  }

  private setCreature(x: number, y: number, scale: number, tint?: number, angle = 0): void {
    if (!this.img) {
      this.g.fillStyle(tint ?? 0xc8b898, 1);
      this.g.fillEllipse(x, y, 30 * scale / 3, 22 * scale / 3);
      return;
    }
    this.img.setPosition(x, y).setScale(scale).setAngle(angle);
    if (tint !== undefined) this.img.setTint(tint); else this.img.clearTint();
  }

  private drawSnatch(): void {
    const n = this.gs.snatch!;
    const g = this.g;
    const top = this.boardTop;
    const cy = top + BOARD_H * 0.58;
    // 바위 틈(양 끝)
    if (n.holes) {
      g.fillStyle(0x07121c, 0.95);
      g.fillEllipse(BX + 10, cy, 26, 60);
      g.fillEllipse(BX + BW - 10, cy, 26, 60);
    }
    const cx = BX + n.x * BW;
    const shake = n.phase === 'tell' ? (Math.sin(this.gs.t * 0.09) * 3) : 0;
    // 움찔 — 튈 쪽 반대로 모래가 튄다(예고)
    if (n.phase === 'tell') {
      g.lineStyle(2, 0xe8e2c8, 0.8);
      for (let k = 0; k < 3; k++) g.lineBetween(cx - n.dir * (18 + k * 5), cy + 8 - k * 6, cx - n.dir * (26 + k * 6), cy + 4 - k * 7);
    }
    const alarmTint = n.alarm > 0.05 ? Phaser.Display.Color.GetColor(255, Math.round(255 - n.alarm * 140), Math.round(255 - n.alarm * 140)) : undefined;
    this.setCreature(cx + shake, cy, 3, alarmTint, n.phase === 'dash' || n.phase === 'bolt' ? n.dir * 8 : 0);
    // 손 — 잡히는 반경 고리 · 덮치는 중이면 그림자가 줄어든다
    const hx = BX + n.handX * BW;
    const r = n.catchR * BW;
    g.lineStyle(2, 0xffffff, 0.85);
    g.strokeCircle(hx, cy, r);
    if (n.strikeMs > 0) {
      const k = n.strikeMs / Math.max(1, n.strikeTotalMs);
      g.fillStyle(0x000000, 0.35);
      g.fillCircle(hx, cy, r * (1 + k * 2.2));
      g.lineStyle(3, 0xffe28a, 0.9);
      g.strokeCircle(hx, cy, r * (1 + k * 2.2));
    }
    // 놓친 횟수 — 손 위 점
    for (let i = 0; i < n.misses; i++) { g.fillStyle(0xff6a5a, 1); g.fillCircle(hx - 8 + i * 8, cy - r - 10, 3); }
  }

  private drawPry(): void {
    const p = this.gs.pry!;
    const g = this.g;
    const top = this.boardTop;
    const flash = p.flash;
    const clamp = flash?.kind === 'miss' ? 0.9 : 1;
    this.setCreature(BX + BW / 2, top + 62, 3.2 * clamp, flash?.kind === 'miss' ? 0xff9a8a : undefined);
    // 막대
    const by = top + 128, bh = 20;
    g.fillStyle(0x0a1628, 0.9); g.fillRect(BX + 20, by, BW - 40, bh);
    const zx = BX + 20 + (p.zoneC - p.zoneW / 2) * (BW - 40);
    g.fillStyle(0x4af2a1, 0.85); g.fillRect(zx, by, p.zoneW * (BW - 40), bh);
    const nx = BX + 20 + p.needle * (BW - 40);
    g.fillStyle(0xffffff, 1); g.fillRect(nx - 2, by - 6, 4, bh + 12);
    g.lineStyle(1.5, flash ? (flash.kind === 'hit' ? 0x4af2a1 : 0xff6a5a) : 0x2a5a8a, 1);
    g.strokeRect(BX + 20, by, BW - 40, bh);
    // 떼어 낼 횟수
    for (let i = 0; i < p.need; i++) {
      const x = BX + BW / 2 - (p.need - 1) * 10 + i * 20;
      g.lineStyle(2, 0xffe28a, 1); g.strokeCircle(x, by + bh + 16, 6);
      if (i < p.hits) { g.fillStyle(0xffe28a, 1); g.fillCircle(x, by + bh + 16, 4); }
    }
  }

  private drawDig(): void {
    const d = this.gs.dig!;
    const g = this.g;
    const top = this.boardTop;
    const sx = BX + BW / 2 - 70, sw = 140;
    // 바닥 단면
    g.fillStyle(0x8a7a5a, 1); g.fillRect(sx, top + 8, sw, BOARD_H - 16);
    g.fillStyle(0x6e6046, 1);
    for (let i = 0; i < 4; i++) g.fillRect(sx, top + 8 + (BOARD_H - 16) * (0.25 * i + 0.12), sw, 3);
    // 판 구멍
    const depthPx = (BOARD_H - 16) * d.depth;
    g.fillStyle(0x2a2218, 1); g.fillRect(sx + sw / 2 - 18, top + 8, 36, depthPx);
    // 녀석
    const wy = top + 8 + (BOARD_H - 16) * Math.min(1, d.prey);
    const wig = Math.sin(this.gs.t * (d.flinch ? 0.05 : 0.012)) * (d.flinch ? 6 : 3);
    this.setCreature(sx + sw / 2 + wig, wy, 2.6, d.flinch ? 0xffb0a0 : undefined, d.flinch ? wig * 3 : 0);
    // 소란 막대(오른쪽)
    const mx = BX + BW - 46, mh = BOARD_H - 24, my = top + 12;
    g.fillStyle(0x0a1628, 0.9); g.fillRect(mx, my, 18, mh);
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x4af2a1), Phaser.Display.Color.ValueToColor(0xff5a4a), 100, Math.round(d.noise * 100));
    g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
    g.fillRect(mx, my + mh * (1 - d.noise), 18, mh * d.noise);
    g.lineStyle(1.5, 0x2a5a8a, 1); g.strokeRect(mx, my, 18, mh);
    // 손(갈퀴) — 누르고 있으면 흙이 튄다
    if (this.holding && !this.paused) {
      g.fillStyle(0xd8c8a0, 0.9);
      for (let k = 0; k < 4; k++) g.fillCircle(sx + sw / 2 + (this.rng() - 0.5) * 50, top + 8 + depthPx - this.rng() * 18, 2);
    }
  }

  private drawPull(): void {
    const p = this.gs.pull!;
    const g = this.g;
    const top = this.boardTop;
    // 바위 틈
    g.fillStyle(0x07121c, 1);
    g.fillTriangle(BX + BW / 2 - 60, top + 20, BX + BW / 2 + 60, top + 20, BX + BW / 2, top + 120);
    const prog = Math.max(0, Math.min(1, p.progress));
    const oy = top + 100 - prog * 70;
    const puff = p.phase === 'tell' ? 1.18 : 1;
    const shake = p.phase === 'surge' ? Math.sin(this.gs.t * 0.1) * 4 : 0;
    this.setCreature(BX + BW / 2 + shake, oy, 3 * puff, p.phase === 'calm' ? undefined : 0xff7a6a);
    // 긴장 막대 — 밝은 칸 = 끌려 나오는 범위
    const by = top + 138, bw = BW - 80, bx = BX + 40, bh = 16;
    g.fillStyle(0x0a1628, 0.9); g.fillRect(bx, by, bw, bh);
    g.fillStyle(0x4af2a1, 0.35); g.fillRect(bx + bw * 0.3, by, bw * 0.55, bh);
    g.fillStyle(0xff5a4a, 0.4); g.fillRect(bx + bw * 0.85, by, bw * 0.15, bh);
    const tx = bx + Math.min(1, p.tension) * bw;
    g.fillStyle(0xffffff, 1); g.fillRect(tx - 2, by - 5, 4, bh + 10);
    g.lineStyle(1.5, 0x2a5a8a, 1); g.strokeRect(bx, by, bw, bh);
    // 끌어낸 정도 — 가는 막대
    g.fillStyle(0x0a1628, 0.9); g.fillRect(bx, by + bh + 8, bw, 5);
    g.fillStyle(0xffe28a, 1); g.fillRect(bx, by + bh + 8, bw * prog, 5);
  }
}
