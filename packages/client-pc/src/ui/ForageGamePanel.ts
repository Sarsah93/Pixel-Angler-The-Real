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
import { ensureForageBed, bedKindFor, toolSpriteKey, addToolSprite, makeForageDemo, DEMO_H } from './ForageBoardArt.js';
import { InventoryStore } from '../store/InventoryStore.js';

/** 229차 — 손그림 도구 스프라이트의 「끝」이 위를 향하는가(손 · 장갑 = 손가락 위 / 집게 · 갈퀴 · 갈고리 = 끝이 아래) */
const TIP_UP: Record<string, boolean> = { fg_hand: true, fg_glove: true, fg_tongs: false, fg_rake: false, fg_gaff: false };
/** 1자형 혼무시 도트(파기 판 · 구멍 속 · 끌려 나오는 연출)를 쓰는 생물 */
const STRAIGHT_WORM_IDS = new Set(['marphysa_sanguinea', 'perinereis_aibuhitensis']);

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
    '바위에 꽉 붙은 녀석이다. 집게 끝(맨손이면 손끝)이 껍데기 가장자리를 따라 왔다 갔다 한다.',
    '껍데기가 살짝 들린 틈(초록)에 집게 끝이 닿는 순간 눌러 비집어 넣는다. 동그라미를 다 채우면 떨어진다.',
    '헛짚으면 녀석이 놀라 더 꽉 붙는다 — 틈이 좁아지고 손이 급해진다.',
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
  /** 229차 — 구운 바닥 그림 · 손 도구 스프라이트 · 1자형 지렁이(파기) */
  private readonly toolImg: Phaser.GameObjects.Image | null;
  private readonly toolKey: string;
  private readonly wormImg: Phaser.GameObjects.Image | null;
  private closeDelayMs = 0;
  /** 225차 — 사진 도트 판 그림인가(머리 왼쪽) · 필드 도트 16px 대비 배율 · 마지막으로 본 방향 */
  private boardArt = false;
  private imgBase = 1;
  private lastFaceRight = false;
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
    for (let i = 0; i < 14; i++) {
      this.pebbles.push({ x: BX + this.rng() * BW, y: this.boardTop + this.rng() * BOARD_H, r: 1.5 + this.rng() * 3, c: this.rng() });
    }
    // 229차 — 구운 바닥(갯바위 · 얕은 물 · 파기 단면 · 바위 틈)을 2배로 깐다. 그 위에 그래픽 · 생물 · 손 도구 순
    const bedKey = ensureForageBed(scene, bedKindFor(state.kind, opts.underwater));
    const bed = scene.add.image(BX, this.boardTop, bedKey).setOrigin(0, 0).setScale(2);
    this.add(bed);
    this.g = scene.add.graphics();
    this.add(this.g);
    // 225차 — 사진 도트 판 그림(forageboard_*)이 있으면 그쪽(머리 왼쪽 · 크기는 필드 도트 16px 기준으로 맞춘다)
    const boardKey = `forageboard_${creature.id}`;
    const key = scene.textures.exists(boardKey) ? boardKey : forageSpotTexKey(creature);
    this.boardArt = key === boardKey;
    this.img = scene.textures.exists(key) ? scene.add.image(0, 0, key).setScale(3) : null;
    if (this.img) {
      const f = this.img.frame;
      this.imgBase = 16 / Math.max(1, f.width, f.height);
      this.add(this.img);
    }
    // 229차 — 파기 판의 지렁이는 1자형 도트(구멍 속에 세로로 · 이기면 끌려 나온다)
    this.wormImg = state.kind === 'dig' && STRAIGHT_WORM_IDS.has(creature.id) && scene.textures.exists('honmushi_straight_px')
      ? scene.add.image(0, 0, 'honmushi_straight_px').setAngle(-90).setScale(1.5) : null;
    if (this.wormImg) { this.add(this.wormImg); this.img?.setVisible(false); }
    // 229차 — 손 도구 스프라이트(맨손 · 장갑 · 집게 · 갈퀴 · 갈고리)
    this.toolKey = toolSpriteKey(tool, InventoryStore.wearingGloves);
    this.toolImg = addToolSprite(scene, this.toolKey, 2);
    if (this.toolImg) { this.toolImg.setVisible(false); this.add(this.toolImg); }

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
    // 225차 — 떼기 가이드 문장을 고쳐 다시 보여 준다(_v2)
    const tourId = `forage_${state.kind}${state.kind === 'pry' ? '_v2' : ''}`;
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
    // 229차 — 말풍선마다 그림(바닥 · 생물 · 손 · 화살표)을 넣는다 — 글자만으로 설명하지 않는다
    const boardKey = `forageboard_${this.creature.id}`;
    const picKey = this.wormImg ? 'honmushi_straight_px' : this.scene.textures.exists(boardKey) ? boardKey : forageSpotTexKey(this.creature);
    const tool = this.gs.tool, gloves = InventoryStore.wearingGloves, uw = this.underwater, kind = this.gs.kind;
    return {
      id,
      alive: () => this.active,
      anchor: () => this.localRect(0, 0, W, H),
      onDone: () => { this.paused = false; },
      steps: texts.map((text) => ({
        text, target: () => this.localRect(BX, this.boardTop, BW, BOARD_H),
        picture: () => makeForageDemo(this.scene, kind, picKey, tool, gloves, uw), pictureH: DEMO_H,
      })),
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
      // 229차 — 파기에서 이기면 1자형 지렁이가 구멍 밖으로 끌려 나오는 연출을 잠깐 보여 준다
      if (this.gs.status === 'won' && this.wormImg) {
        this.closeDelayMs = 700;
        const wy = this.wormImg.y;
        this.scene.tweens.add({ targets: this.wormImg, y: wy - 70, angle: -70, duration: 520, ease: 'Back.easeOut' });
        if (this.toolImg) this.scene.tweens.add({ targets: this.toolImg, y: this.toolImg.y - 40, duration: 420, ease: 'Quad.easeOut' });
        this.scene.time.delayedCall(this.closeDelayMs, () => { if (this.active) this.requestClose(); });
        return;
      }
      this.requestClose();
    }
  }

  /** 229차 — 손 도구 스프라이트를 놓는다. `tipTo`는 끝이 향할 방향(단위 벡터). 안 주면 위를 본다 */
  private placeTool(x: number, y: number, tipTo?: { x: number; y: number }, scale = 1): void {
    const t = this.toolImg;
    if (!t) return;
    t.setVisible(true).setPosition(x, y).setScale(scale);
    if (tipTo) {
      const deg = Math.atan2(tipTo.y, tipTo.x) * 180 / Math.PI;
      t.setAngle(TIP_UP[this.toolKey] ? deg + 90 : deg - 90);
    } else t.setAngle(0);
  }

  // ═══════════════════════════════════════════════════
  // 그리기
  // ═══════════════════════════════════════════════════

  private draw(): void {
    const g = this.g;
    g.clear();
    const top = this.boardTop;
    // 바닥은 구운 그림(229차). 여기서는 자갈 몇 개로 깊이감만 더한다(단면 · 틈 판은 그림이 다 그린다)
    const s = this.gs;
    if (s.kind !== 'dig' && s.kind !== 'pull') {
      for (const p of this.pebbles) {
        g.fillStyle(this.underwater ? (p.c < 0.5 ? 0x2f6683 : 0x1d4258) : (p.c < 0.5 ? 0x5c574c : 0x3a362f), 0.8);
        g.fillCircle(p.x, p.y, p.r);
      }
    }
    g.lineStyle(2, 0x0a1628, 1);
    g.strokeRect(BX, top, BW, BOARD_H);
    this.toolImg?.setVisible(false);
    if (s.snatch) this.drawSnatch();
    else if (s.pry) this.drawPry();
    else if (s.dig) this.drawDig();
    else if (s.pull) this.drawPull();
    // 남은 시간 — 판 위쪽 가는 줄
    const left = Math.max(0, 1 - s.t / s.limitMs);
    g.fillStyle(0x0a1628, 0.8); g.fillRect(BX, top - 6, BW, 3);
    g.fillStyle(left > 0.3 ? 0x9fd0e4 : 0xff9a6a, 1); g.fillRect(BX, top - 6, BW * left, 3);
  }

  private setCreature(x: number, y: number, scale: number, tint?: number, angle = 0, faceRight?: boolean): void {
    if (!this.img) {
      this.g.fillStyle(tint ?? 0xc8b898, 1);
      this.g.fillEllipse(x, y, 30 * scale / 3, 22 * scale / 3);
      return;
    }
    // 도트가 뭉개지지 않게 1배 이상이면 0.5 단위로 맞춘다
    const k = scale * this.imgBase;
    this.img.setPosition(x, y).setScale(k >= 1 ? Math.round(k * 2) / 2 : k).setAngle(angle);
    if (this.boardArt) this.img.setFlipX(faceRight === true);   // 판 그림은 머리가 왼쪽 — 오른쪽으로 달리면 뒤집는다
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
    const moving = n.phase === 'dash' || n.phase === 'bolt' || n.phase === 'tell';
    this.setCreature(cx + shake, cy, 3, alarmTint, (n.phase === 'dash' || n.phase === 'bolt') && !this.boardArt ? n.dir * 8 : 0, moving ? n.dir > 0 : this.lastFaceRight);
    if (moving) this.lastFaceRight = n.dir > 0;
    // 손 — 잡히는 반경 고리 · 덮치는 중이면 그림자가 줄어든다. 손 그림은 고리 위에서 따라온다(229차)
    const hx = BX + n.handX * BW;
    const r = n.catchR * BW;
    g.lineStyle(2, 0xffffff, 0.85);
    g.strokeCircle(hx, cy, r);
    let hoverK = 1;
    if (n.strikeMs > 0) {
      const k = n.strikeMs / Math.max(1, n.strikeTotalMs);
      hoverK = 1 - k * 0.3;
      g.fillStyle(0x000000, 0.35);
      g.fillCircle(hx, cy, r * (1 + k * 2.2));
      g.lineStyle(3, 0xffe28a, 0.9);
      g.strokeCircle(hx, cy, r * (1 + k * 2.2));
    }
    this.placeTool(hx, cy - 6, undefined, hoverK);
    // 놓친 횟수 — 손 위 점
    for (let i = 0; i < n.misses; i++) { g.fillStyle(0xff6a5a, 1); g.fillCircle(hx - 8 + i * 8, cy - r - 10, 3); }
  }

  /**
   * 떼기 — 위에서 본 바위 위의 껍데기. 껍데기 앞쪽 가장자리(아래 반원)를 따라 집게 끝(맨손이면 손끝)이 오가고,
   * 껍데기가 살짝 들린 틈이 초록 호로 보인다. 끝이 틈에 닿을 때 누르면 비집어 들어간다.
   * (225차 — 「오가는 바늘」이 무엇인지 안 읽힌다는 지적. 판정은 그대로 0~1 바늘이다)
   */
  private drawPry(): void {
    const p = this.gs.pry!;
    const g = this.g;
    const top = this.boardTop;
    const flash = p.flash;
    const cx = BX + BW / 2, cy = top + 74;
    // 껍데기 가장자리 타원 — 그림(도트 16px × 8.4배)이 그래픽 위에 그려지므로 그림 바깥으로 잡아야 틈이 가려지지 않는다
    const a = 74, b = 54, ry = cy + 6;
    // 껍데기 — 맞힐수록 조금씩 들려 그림자가 넓어진다
    const lift = p.hits / Math.max(1, p.need);
    g.fillStyle(0x000000, 0.35); g.fillEllipse(cx, cy + 6 + lift * 4, a * 2 + 6, b * 2 + 6);
    this.setCreature(cx, cy, 8.4 * (flash?.kind === 'miss' ? 0.96 : 1), flash?.kind === 'miss' ? 0xff9a8a : undefined);
    // 가장자리 앞쪽 반원 — 각도 θ = π(1 − 바늘) (왼쪽 → 아래 → 오른쪽)
    const at = (v: number): { x: number; y: number; nx: number; ny: number } => {
      const th = Math.PI * (1 - Math.max(0, Math.min(1, v)));
      const x = cx + a * Math.cos(th), y = ry + b * Math.sin(th);
      const nx = b * Math.cos(th), ny = a * Math.sin(th), l = Math.hypot(nx, ny) || 1;
      return { x, y, nx: nx / l, ny: ny / l };
    };
    const arc = (v0: number, v1: number, w: number, color: number, alpha = 1): void => {
      g.lineStyle(w, color, alpha);
      g.beginPath();
      const n = 24;
      for (let k = 0; k <= n; k++) { const q = at(v0 + (v1 - v0) * (k / n)); if (k === 0) g.moveTo(q.x, q.y); else g.lineTo(q.x, q.y); }
      g.strokePath();
    };
    arc(0, 1, 4, 0xe8d8b8, 0.6);                                    // 가장자리 길
    arc(p.zoneC - p.zoneW / 2, p.zoneC + p.zoneW / 2, 14, 0x0a0e14); // 들린 틈(어둠)
    arc(p.zoneC - p.zoneW / 2, p.zoneC + p.zoneW / 2, 7, flash?.kind === 'hit' ? 0xffffff : 0x4af2a1);
    // 집게 끝(또는 손끝) — 바깥에서 가장자리로 들이댄다(229차 — 손그림 스프라이트, 끝이 껍데기 쪽을 본다)
    const q = at(p.needle);
    const into = { x: -q.nx, y: -q.ny };
    this.placeTool(q.x + q.nx * 26, q.y + q.ny * 26, into, 1);
    g.fillStyle(0x000000, 0.25); g.fillCircle(q.x + q.nx * 6, q.y + q.ny * 6, 5);
    if (flash) {
      g.lineStyle(2, flash.kind === 'hit' ? 0x4af2a1 : 0xff6a5a, 1);
      g.strokeCircle(q.x, q.y, 8 + (1 - flash.ms / 320) * 10);
    }
    // 비집을 횟수 — 판 왼쪽 아래
    for (let i = 0; i < p.need; i++) {
      const x = BX + 22 + i * 20, y = top + BOARD_H - 18;
      g.lineStyle(2, 0xffe28a, 1); g.strokeCircle(x, y, 6);
      if (i < p.hits) { g.fillStyle(0xffe28a, 1); g.fillCircle(x, y, 4); }
    }
  }

  private drawDig(): void {
    const d = this.gs.dig!;
    const g = this.g;
    const top = this.boardTop;
    const sx = BX + BW / 2 - 70, sw = 140;
    // 바닥 단면은 구운 그림(229차). 판 구멍만 여기서 — 가장자리는 파낸 모래가 쌓인다
    const depthPx = (BOARD_H - 16) * d.depth;
    g.fillStyle(0x2a2218, 1); g.fillRect(sx + sw / 2 - 18, top + 8, 36, depthPx);
    g.fillStyle(0x1a140c, 0.6); g.fillRect(sx + sw / 2 - 18, top + 8, 4, depthPx); g.fillRect(sx + sw / 2 + 14, top + 8, 4, depthPx);
    if (depthPx > 6) {
      g.fillStyle(0xb8a680, 1);
      g.fillEllipse(sx + sw / 2 - 30, top + 9, 26, 7); g.fillEllipse(sx + sw / 2 + 30, top + 9, 26, 7);
    }
    // 녀석
    const wy = top + 8 + (BOARD_H - 16) * Math.min(1, d.prey);
    const wig = Math.sin(this.gs.t * (d.flinch ? 0.05 : 0.012)) * (d.flinch ? 6 : 3);
    if (this.wormImg && !this.finished) {
      this.wormImg.setPosition(sx + sw / 2 + wig * 0.5, wy + 20).setAngle(-90 + (d.flinch ? wig * 2 : wig * 0.6));
      if (d.flinch) this.wormImg.setTint(0xffb0a0); else this.wormImg.clearTint();
    } else if (!this.wormImg) {
      this.setCreature(sx + sw / 2 + wig, wy, 2.6, d.flinch ? 0xffb0a0 : undefined, d.flinch ? wig * 3 : 0);
    }
    // 갈퀴(손) — 구멍 위에서 파는 만큼 내려간다 · 누르고 있으면 흔들린다
    if (!this.finished) {
      const bob = this.holding && !this.paused ? Math.sin(this.gs.t * 0.03) * 4 : 0;
      this.placeTool(sx + sw / 2 + 2, top + 8 + Math.min(depthPx, BOARD_H - 60) + bob - 6, { x: 0, y: 1 }, 1);
    }
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
    // 바위 틈은 구운 그림(229차). 녀석은 틈 가운데에서 끌려 올라온다 · 손은 그 위에서 당긴다
    const prog = Math.max(0, Math.min(1, p.progress));
    const oy = top + 100 - prog * 70;
    const puff = p.phase === 'tell' ? 1.18 : 1;
    const shake = p.phase === 'surge' ? Math.sin(this.gs.t * 0.1) * 4 : 0;
    this.setCreature(BX + BW / 2 + shake, oy, 3 * puff, p.phase === 'calm' ? undefined : 0xff7a6a);
    const pullK = this.holding && !this.paused ? 1 : 0;
    this.placeTool(BX + BW / 2 + 34 + shake * 0.5, oy - 26 - pullK * 6, { x: -0.5, y: 1 }, 1);
    if (p.phase === 'surge') {   // 먹물 기운 — 틈 위로 번진다
      g.fillStyle(0x0a0a14, 0.35); g.fillEllipse(BX + BW / 2, oy + 10, 90, 36);
    }
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
