/**
 * @file GuideTour.ts
 * @description 기능창 단계별 체험 가이드 (188차 — 사용자 지시 "기능을 텍스트로 표시하지 말고, USE CASE 시나리오로 한 번씩 써 보게 하라")
 *
 * 창을 **처음** 열면 말풍선이 그 창의 구성 요소 옆에 하나씩 뜬다.
 *  - 말풍선 문장은 **타이핑되듯** 한 글자씩 나온다(말풍선 클릭 · Enter = 바로 다 보기).
 *  - 설명할 자리는 **하이라이트**(주변을 어둡게 + 깜빡이는 금색 테두리)로 짚는다.
 *  - 단계는 두 종류다.
 *    ① 설명 단계 — [다음]을 눌러 넘어간다.
 *    ② 체험 단계 — `wait()`가 참이 될 때까지(유저가 그 기능을 **직접 써 볼 때까지**) 기다린다.
 *  - 가이드가 떠 있는 동안 **허용한 자리(`allow`) 밖의 입력은 막는다** — 화면 전체를 덮는 방패를
 *    허용 사각형만 뚫어 깐다. 키보드는 각 씬이 `GuideTour.blocksKey()`로 거른다.
 *  - 끝나면 세이브 플래그 `tour.<id>`를 켠다 — 다시 뜨지 않는다(다시 보기는 도움말 라이브러리 · 설정).
 *
 * ⚠ 헤드리스(하네스)에서는 `scene.time` 타이머가 돌지 않는다(verify-render 스킬) —
 *   타이핑·폴링은 씬 `update` 이벤트로 돈다. 하네스는 `GuideTour.active.finish()`로 건너뛸 수 있다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { t } from '../i18n/I18n.js';
import { GameState } from '../store/GameState.js';

export type TourRect = Phaser.Geom.Rectangle;

export interface TourStep {
  /** 말풍선 문장 (한국어 원문 — `t()`로 번역) */
  text: string;
  /** 짚을 자리 (화면 좌표) — 창이 움직일 수 있으니 매 프레임 다시 묻는다 */
  target?: () => TourRect | null | undefined;
  /** 체험 단계 — 참이 되면 다음으로. 없으면 [다음] 버튼 */
  wait?: () => boolean;
  /** 입력을 허용할 자리. 기본 = 체험 단계면 target, 설명 단계면 없음 */
  allow?: () => (TourRect | null | undefined)[];
  /** 이 단계에서 허용할 키 (KeyboardEvent.code — 'KeyI' · 'Escape' …) */
  allowKeys?: string[];
  /** 해당 없으면 건너뛴다 (예: 빈 가방이면 드래그 체험 생략) */
  skipIf?: () => boolean;
  /** 단계에 들어설 때 한 번 */
  onEnter?: () => void;
}

export interface TourOptions {
  /** 세이브 플래그 키 `tour.<id>` */
  id: string;
  steps: TourStep[];
  /** 말풍선을 좌·우에 붙일 기준(보통 창 외곽). 없으면 단계 target 기준 */
  anchor?: () => TourRect | null | undefined;
  /** 창이 닫혔는지 등 — 거짓이면 가이드를 접는다(플래그는 켜지 않는다 — 다음에 다시 뜬다) */
  alive?: () => boolean;
  onDone?: () => void;
}

const BUBBLE_W = 300;
const PAD = 14;
const TYPE_MS = 26;
const DEPTH = 1400;
const FONT = '"Noto Sans KR", sans-serif';

/** 이미 본 가이드인가 */
export function tourSeen(id: string): boolean {
  return GameState.getFlag(`tour.${id}`);
}

/** 처음이면 가이드를 띄운다 — 다른 가이드가 진행 중이면 끝난 뒤 이어서 */
export function maybeStartTour(scene: Phaser.Scene, build: () => TourOptions | null): void {
  GuideTour.request(scene, build);
}

export class GuideTour {
  /** 지금 떠 있는 가이드 (씬과 무관하게 하나뿐) */
  static active: GuideTour | null = null;
  private static queue: { scene: Phaser.Scene; build: () => TourOptions | null }[] = [];

  /** 키 입력을 막아야 하는가 — 각 씬의 단축키 처리 앞에서 묻는다 */
  static blocksKey(code: string): boolean {
    const a = GuideTour.active;
    if (!a) return false;
    const step = a.opts.steps[a.index];
    if (!step) return true;
    if (step.allowKeys?.includes(code)) return false;
    // 설명 단계의 Enter·Space = [다음] — 말풍선이 받는다(아래 창으로 새지 않게 막는다)
    return true;
  }

  static request(scene: Phaser.Scene, build: () => TourOptions | null): void {
    if (GuideTour.active) { GuideTour.queue.push({ scene, build }); return; }
    // 창이 자리를 잡은 다음 프레임에 연다(생성자 안에서 바로 열면 좌표가 0이다)
    const once = (): void => {
      scene.events.off('update', once);
      if (GuideTour.active) { GuideTour.queue.push({ scene, build }); return; }
      const opts = build();
      if (!opts || tourSeen(opts.id) || opts.steps.length === 0) { GuideTour.next(); return; }
      new GuideTour(scene, opts);
    };
    scene.events.on('update', once);
  }

  private static next(): void {
    while (GuideTour.queue.length && !GuideTour.active) {
      const n = GuideTour.queue.shift()!;
      if (!n.scene.sys.isActive() && !n.scene.sys.isPaused()) continue;
      GuideTour.request(n.scene, n.build);
      return;
    }
  }

  readonly opts: TourOptions;
  private scene: Phaser.Scene;
  private index = -1;
  private dimG: Phaser.GameObjects.Graphics;
  private frameG: Phaser.GameObjects.Graphics;
  private shields: Phaser.GameObjects.Rectangle[] = [];
  private shieldSig = '';
  private bubble: Phaser.GameObjects.Container;
  private bubbleBg: Phaser.GameObjects.Graphics;
  private bodyText: Phaser.GameObjects.Text;
  private countText: Phaser.GameObjects.Text;
  private nextBtn: Phaser.GameObjects.Container;
  private nextLabel: Phaser.GameObjects.Text;
  private fullText = '';
  private typed = 0;
  private typeAcc = 0;
  private pulse = 0;
  /** 체험 단계 완료 후 다음으로 넘어가기까지 남은 시간 (ms) */
  private advanceIn = -1;
  private updateFn: (time: number, delta: number) => void;
  private keyFn: (ev: KeyboardEvent) => void;
  private shutdownFn: () => void;

  private constructor(scene: Phaser.Scene, opts: TourOptions) {
    this.scene = scene;
    this.opts = opts;
    GuideTour.active = this;

    this.dimG = scene.add.graphics().setDepth(DEPTH).setScrollFactor(0);
    this.frameG = scene.add.graphics().setDepth(DEPTH + 3).setScrollFactor(0);

    this.bubble = scene.add.container(0, 0).setDepth(DEPTH + 4).setScrollFactor(0);
    this.bubbleBg = scene.add.graphics();
    this.bodyText = scene.add.text(PAD, PAD, '', {
      fontFamily: FONT, fontSize: '15px', color: '#f2f6fa', lineSpacing: 5,
      wordWrap: { width: BUBBLE_W - PAD * 2, useAdvancedWrap: true },
    });
    this.countText = scene.add.text(PAD, 0, '', { fontFamily: FONT, fontSize: '11px', color: '#7f97ab' });
    this.nextBtn = scene.add.container(0, 0);
    const nbBg = scene.add.rectangle(0, 0, 76, 28, 0x2a5d3f, 1).setOrigin(0, 0).setStrokeStyle(1, 0x6fe0a0, 1);
    this.nextLabel = scene.add.text(38, 14, '다음', { fontFamily: FONT, fontSize: '13px', color: '#e8fff0', fontStyle: 'bold' }).setOrigin(0.5);
    const nbHit = scene.add.rectangle(0, 0, 76, 28, 0xffffff, 0.001).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    nbHit.on('pointerdown', () => this.onNext());
    this.nextBtn.add([nbBg, this.nextLabel, nbHit]);
    const bodyHit = scene.add.rectangle(0, 0, BUBBLE_W, 10, 0xffffff, 0.001).setOrigin(0, 0).setInteractive();
    bodyHit.on('pointerdown', () => this.completeTyping());
    this.bubble.add([this.bubbleBg, bodyHit, this.bodyText, this.countText, this.nextBtn]);
    this.bubble.setData('bodyHit', bodyHit);

    this.updateFn = (_t, delta) => this.tick(delta);
    scene.events.on('update', this.updateFn);
    this.keyFn = (ev: KeyboardEvent) => {
      if (GuideTour.active !== this) return;
      if (ev.code === 'Enter' || ev.code === 'Space' || ev.code === 'NumpadEnter') this.onNext();
    };
    scene.input.keyboard?.on('keydown', this.keyFn);
    this.shutdownFn = () => this.teardown(false);
    scene.events.once('shutdown', this.shutdownFn);

    this.go(0);
  }

  /** 하네스·디버그 — 남은 단계를 건너뛰고 끝낸다 */
  finish(): void { this.teardown(true); }

  private get step(): TourStep | undefined { return this.opts.steps[this.index]; }

  private go(i: number): void {
    let n = i;
    while (n < this.opts.steps.length && this.opts.steps[n].skipIf?.()) n++;
    if (n >= this.opts.steps.length) { this.teardown(true); return; }
    this.index = n;
    this.advanceIn = -1;
    const st = this.opts.steps[n];
    st.onEnter?.();
    this.fullText = t(st.text);
    this.typed = 0;
    this.typeAcc = 0;
    this.bodyText.setText('');
    const total = this.opts.steps.filter((s) => !s.skipIf?.()).length;
    const pos = this.opts.steps.slice(0, n + 1).filter((s) => !s.skipIf?.()).length;
    this.countText.setText(`${pos} / ${total}`);
    const last = n === this.opts.steps.length - 1 || this.opts.steps.slice(n + 1).every((s) => s.skipIf?.());
    this.nextLabel.setText(t(last ? '확인' : '다음'));
    this.layoutBubble();
  }

  private completeTyping(): void {
    if (this.typed < this.fullText.length) { this.typed = this.fullText.length; this.bodyText.setText(this.fullText); this.layoutBubble(); }
  }

  private onNext(): void {
    const st = this.step;
    if (!st) return;
    if (this.typed < this.fullText.length) { this.completeTyping(); return; }
    if (st.wait) return;   // 체험 단계는 직접 해 봐야 넘어간다
    this.go(this.index + 1);
  }

  private tick(delta: number): void {
    if (GuideTour.active !== this) return;
    if (this.opts.alive && !this.opts.alive()) { this.teardown(false); return; }
    const st = this.step;
    if (!st) return;
    // 타이핑
    if (this.typed < this.fullText.length) {
      this.typeAcc += delta;
      const add = Math.floor(this.typeAcc / TYPE_MS);
      if (add > 0) {
        this.typeAcc -= add * TYPE_MS;
        this.typed = Math.min(this.fullText.length, this.typed + add);
        this.bodyText.setText(this.fullText.slice(0, this.typed));
        this.layoutBubble();
      }
    }
    // 체험 단계 — 직접 해 보면 잠깐 뒤 다음으로
    if (st.wait && this.advanceIn < 0 && st.wait()) this.advanceIn = 380;
    if (this.advanceIn >= 0) {
      this.advanceIn -= delta;
      if (this.advanceIn <= 0) { this.go(this.index + 1); return; }
    }
    this.pulse += delta;
    this.drawHighlight();
    this.layoutBubble();
  }

  private targetRect(): TourRect | null {
    const r = this.step?.target?.();
    return r ?? null;
  }

  private drawHighlight(): void {
    const r = this.targetRect();
    const g = this.dimG;
    g.clear();
    g.fillStyle(0x000814, 0.5);
    if (!r) {
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      const x = Math.max(0, r.x - 4), y = Math.max(0, r.y - 4);
      const x2 = Math.min(GAME_WIDTH, r.right + 4), y2 = Math.min(GAME_HEIGHT, r.bottom + 4);
      g.fillRect(0, 0, GAME_WIDTH, y);
      g.fillRect(0, y2, GAME_WIDTH, GAME_HEIGHT - y2);
      g.fillRect(0, y, x, y2 - y);
      g.fillRect(x2, y, GAME_WIDTH - x2, y2 - y);
    }
    const f = this.frameG;
    f.clear();
    if (r) {
      const a = 0.55 + 0.45 * Math.abs(Math.sin(this.pulse / 320));
      f.lineStyle(3, 0xffce54, a);
      f.strokeRoundedRect(r.x - 5, r.y - 5, r.width + 10, r.height + 10, 6);
    }
    this.syncShields(r);
  }

  /** 허용 사각형만 뚫은 입력 방패 */
  private syncShields(target: TourRect | null): void {
    const st = this.step;
    const holes = (st?.allow ? st.allow() : st?.wait && target ? [target] : [])
      .filter((h): h is TourRect => !!h)
      .map((h) => new Phaser.Geom.Rectangle(Math.max(0, Math.floor(h.x)), Math.max(0, Math.floor(h.y)),
        Math.ceil(h.width), Math.ceil(h.height)));
    const sig = holes.map((h) => `${h.x},${h.y},${h.width},${h.height}`).join('|');
    if (sig === this.shieldSig && this.shields.length) return;
    this.shieldSig = sig;
    this.shields.forEach((s) => s.destroy());
    this.shields = [];
    const ys = new Set<number>([0, GAME_HEIGHT]);
    for (const h of holes) { ys.add(Math.min(GAME_HEIGHT, h.y)); ys.add(Math.min(GAME_HEIGHT, h.bottom)); }
    const ySorted = [...ys].sort((a, b) => a - b);
    for (let i = 0; i < ySorted.length - 1; i++) {
      const y0 = ySorted[i], y1 = ySorted[i + 1];
      if (y1 <= y0) continue;
      const spans = holes.filter((h) => h.y <= y0 && h.bottom >= y1).map((h) => [h.x, h.right] as [number, number]).sort((a, b) => a[0] - b[0]);
      let x = 0;
      const push = (x0: number, x1: number): void => {
        if (x1 - x0 < 1) return;
        const s = this.scene.add.rectangle(x0, y0, x1 - x0, y1 - y0, 0x000000, 0.001)
          .setOrigin(0, 0).setDepth(DEPTH + 1).setScrollFactor(0).setInteractive();
        // 아무 일도 하지 않는다 — 아래 창으로 클릭이 새지 않게 삼킨다
        s.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => ev.stopPropagation());
        this.shields.push(s);
      };
      for (const [a, b] of spans) { if (a > x) push(x, a); x = Math.max(x, b); }
      if (x < GAME_WIDTH) push(x, GAME_WIDTH);
    }
  }

  private layoutBubble(): void {
    const textH = Math.max(this.bodyText.height, 20);
    const st = this.step;
    const btnShown = !st?.wait && this.typed >= this.fullText.length;
    const h = PAD + textH + 12 + 28 + PAD;
    this.countText.setPosition(PAD, h - PAD - 21);
    this.nextBtn.setPosition(BUBBLE_W - PAD - 76, h - PAD - 28).setVisible(btnShown);
    (this.bubble.getData('bodyHit') as Phaser.GameObjects.Rectangle).setSize(BUBBLE_W, h);

    const target = this.targetRect();
    const anchor = this.opts.anchor?.() ?? target;
    const ty = target ? target.centerY : GAME_HEIGHT / 2;
    let bx: number, by: number, tail: 'left' | 'right' | 'none' = 'none';
    if (anchor && anchor.right + 18 + BUBBLE_W <= GAME_WIDTH - 6) { bx = anchor.right + 18; tail = 'left'; }
    else if (anchor && anchor.x - 18 - BUBBLE_W >= 6) { bx = anchor.x - 18 - BUBBLE_W; tail = 'right'; }
    else { bx = (GAME_WIDTH - BUBBLE_W) / 2; }
    by = Phaser.Math.Clamp(ty - h / 2, 8, GAME_HEIGHT - h - 8);
    if (tail === 'none' && target) by = target.bottom + 16 + h <= GAME_HEIGHT ? target.bottom + 16 : Math.max(8, target.y - 16 - h);
    this.bubble.setPosition(Math.round(bx), Math.round(by));

    const g = this.bubbleBg;
    g.clear();
    g.fillStyle(0x0d2131, 0.97);
    g.fillRoundedRect(0, 0, BUBBLE_W, h, 8);
    g.lineStyle(2, 0xffce54, 1);
    g.strokeRoundedRect(0, 0, BUBBLE_W, h, 8);
    if (tail !== 'none') {
      const yy = Phaser.Math.Clamp(ty - by, 14, h - 14);
      g.fillStyle(0xffce54, 1);
      if (tail === 'left') g.fillTriangle(0, yy - 8, 0, yy + 8, -12, yy);
      else g.fillTriangle(BUBBLE_W, yy - 8, BUBBLE_W, yy + 8, BUBBLE_W + 12, yy);
    }
  }

  private teardown(done: boolean): void {
    if (GuideTour.active !== this) return;
    GuideTour.active = null;
    this.scene.events.off('update', this.updateFn);
    this.scene.events.off('shutdown', this.shutdownFn);
    this.scene.input.keyboard?.off('keydown', this.keyFn);
    this.shields.forEach((s) => s.destroy());
    this.dimG.destroy();
    this.frameG.destroy();
    this.bubble.destroy();
    if (done) {
      GameState.setFlag(`tour.${this.opts.id}`);
      GameState.markDirty();
      this.opts.onDone?.();
    }
    GuideTour.next();
  }
}
