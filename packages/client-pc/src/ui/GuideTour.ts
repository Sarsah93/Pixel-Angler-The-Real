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
 * 219차 — **창과 겹치지 않는다**(사용자 지적: 라디오 창 위에 말풍선 · 금색 테두리가 올라탔다).
 *  - 씬에 열린 창(`DraggablePanel` 전부 + 씬이 `setOccluders`로 알린 메뉴 등)을 매 프레임 본다.
 *  - 말풍선이 창에 걸리면 창 옆 · 화면 귀퉁이로 비키고, 자리가 없으면 창이 닫힐 때까지 숨는다.
 *  - 짚는 대상이 창에 가려지면 금색 테두리를 그리지 않는다(창보다 앞에 테두리가 뜨지 않게).
 *  - 가이드가 짚는 그 창(대상 · 기준이 그 창 안)은 가림 목록에서 뺀다.
 * 219차 — **가이드 밖 행동 막기**(사용자 지시: 가이드대로 하지 않고 고양이를 만지는 등 다른 행동을 못 하게 유도):
 *  - 단계에 `focus`(허용 행동 id 목록)를 두면, 씬은 행동 전에 `GuideTour.allows(id)`를 묻고
 *    거절이면 `GuideTour.nudge()` — 말풍선이 흔들리며 지금 할 일을 다시 보여 준다.
 *
 * ⚠ 헤드리스(하네스)에서는 `scene.time` 타이머가 돌지 않는다(verify-render 스킬) —
 *   타이핑·폴링은 씬 `update` 이벤트로 돈다. 하네스는 `GuideTour.active.finish()`로 건너뛸 수 있다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { t } from '../i18n/I18n.js';
import { GameState } from '../store/GameState.js';
import { GUIDE_VOICE } from '@tra/core';
import { VoiceTyper } from '../audio/Voice.js';
import { DraggablePanel } from './DraggablePanel.js';

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
  /**
   * 세상 안에서 직접 해 보는 단계 (걷기·뛰기·[F]) — 화면을 어둡게 하지 않고 입력도 막지 않는다.
   * 말풍선과 금색 테두리만 띄운다. 키 입력은 그대로 씬에 간다.
   */
  passive?: boolean;
  /**
   * 191차 — 말풍선을 기준 사각형의 어느 쪽에 붙일지. 'auto' = 짚는 대상이 화면 중심의 왼쪽이면 왼쪽.
   * 기본은 오른쪽이 들어가면 오른쪽.
   */
  side?: 'left' | 'right' | 'auto';
  /** 191차 — 말풍선 세로 위치를 이 사각형 가운데에 맞춘다(짚는 대상과 다를 때 — 예: 우클릭 메뉴를 짚되 아이템 높이에) */
  alignTo?: () => TourRect | null | undefined;
  /** 191차 — 짚는 대상이 없을 때 말풍선 위쪽 y (없으면 화면 세로 가운데) */
  dockY?: number;
  /**
   * 219차 — 이 단계에서 허용하는 세상 행동 id(씬이 정한다 — 예: 집 'sofa' · 'stand' · 'father_box').
   * 없으면 막지 않는다. 빈 배열이면 세상 행동을 전부 막는다(걷기는 행동이 아니다).
   */
  focus?: string[];
  /**
   * 229차 — 말풍선 위쪽에 넣는 그림(글자만으로 설명하지 않는다). 폭은 말풍선 안쪽(272)에 맞추고
   * 높이는 `pictureH`(기본 76). 단계가 바뀌면 파괴된다.
   */
  picture?: () => Phaser.GameObjects.Container | null;
  pictureH?: number;
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
  /** 191차 — 끝나도 `tour.<id>` 플래그를 남기지 않는다(프롤로그 코치처럼 상태로 판정하는 일회성 말풍선) */
  ephemeral?: boolean;
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
  /** 다음 프레임에 열기로 한 요청 수 (request ~ 첫 update 사이) */
  private static pending = 0;

  /** 가이드가 떠 있거나 열릴 차례를 기다리는 중인가 — 프롤로그 코치는 이때 끼어들지 않는다 */
  static get busy(): boolean {
    return !!GuideTour.active || GuideTour.queue.length > 0 || GuideTour.pending > 0;
  }

  /**
   * 191차 — 세상(이동·상호작용)을 멈춰야 하는가. 세상 안 체험 단계(passive — 걷기·프롤로그 코치)는 멈추지 않는다.
   * 필드의 `uiBlocked`가 `GuideTour.active`만 보면 코치 말풍선이 떠 있는 동안 캐릭터가 얼어붙는다.
   */
  static get blocking(): boolean {
    const a = GuideTour.active;
    if (!a) return false;
    return !a.opts.steps[a.index]?.passive;
  }

  /** 219차 — 씬별 「창」 사각형 공급자(DraggablePanel이 아닌 메뉴 · 대화 상자 등) */
  private static occluderFns = new Map<Phaser.Scene, () => (TourRect | null | undefined)[]>();

  /** 219차 — 씬이 DraggablePanel 밖의 창(작은 고를 거리 메뉴 등)을 알린다. 씬이 내려가면 지운다. */
  static setOccluders(scene: Phaser.Scene, fn: () => (TourRect | null | undefined)[]): void {
    GuideTour.occluderFns.set(scene, fn);
    scene.events.once('shutdown', () => { if (GuideTour.occluderFns.get(scene) === fn) GuideTour.occluderFns.delete(scene); });
  }

  /**
   * 219차 — 지금 단계가 이 세상 행동을 허용하는가. 씬은 행동 직전에 묻고, 거절이면 `nudge()`를 부른다.
   * 가이드가 없거나 단계에 `focus`가 없으면 허용.
   */
  static allows(action: string): boolean {
    const st = GuideTour.active?.step;
    if (!st?.focus) return true;
    return st.focus.includes(action);
  }

  /** 219차 — 가이드 밖 행동을 하려 했다: 말풍선을 흔들어 지금 할 일을 다시 짚는다 */
  static nudge(): void {
    GuideTour.active?.shake();
  }

  /** 키 입력을 막아야 하는가 — 각 씬의 단축키 처리 앞에서 묻는다 */
  static blocksKey(code: string): boolean {
    const a = GuideTour.active;
    if (!a) return false;
    const step = a.opts.steps[a.index];
    if (!step) return true;
    if (step.passive) return false;
    if (step.allowKeys?.includes(code)) return false;
    // 설명 단계의 Enter·Space = [다음] — 말풍선이 받는다(아래 창으로 새지 않게 막는다)
    return true;
  }

  static request(scene: Phaser.Scene, build: () => TourOptions | null): void {
    // 191차 — 씬이 내려가면 그 씬이 걸어 둔 요청은 버린다. 씬 인스턴스·`scene.events`는 재사용되므로
    //   남겨 두면 다음 세대(재시작·새 게임)에서 **파괴된 창을 붙잡은 build**가 실행된다.
    let armed = false;
    const disarm = (): void => { if (armed) { armed = false; GuideTour.pending = Math.max(0, GuideTour.pending - 1); } };
    const purge = (): void => {
      scene.events.off('update', once);
      disarm();
      GuideTour.queue = GuideTour.queue.filter((q) => q.scene !== scene);
    };
    const enqueue = (): void => {
      GuideTour.queue.push({ scene, build });
      scene.events.once('shutdown', purge);
    };
    // 창이 자리를 잡은 다음 프레임에 연다(생성자 안에서 바로 열면 좌표가 0이다)
    const once = (): void => {
      scene.events.off('update', once);
      scene.events.off('shutdown', purge);
      disarm();
      if (GuideTour.active) { enqueue(); return; }
      const opts = build();
      if (!opts || tourSeen(opts.id) || opts.steps.length === 0) { GuideTour.next(); return; }
      new GuideTour(scene, opts);
    };
    if (GuideTour.active) { enqueue(); return; }
    armed = true;
    GuideTour.pending++;
    scene.events.on('update', once);
    scene.events.once('shutdown', purge);
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
  /** 211차 — 안내 말풍선 목소리(부드럽고 높낮이가 작다) */
  private readonly blips = new VoiceTyper(GUIDE_VOICE);
  private typeAcc = 0;
  private pulse = 0;
  /** 체험 단계 완료 후 다음으로 넘어가기까지 남은 시간 (ms) */
  private advanceIn = -1;
  /** 219차 — 흔들림(가이드 밖 행동) 남은 시간 · 창에 가려 숨었는가 */
  private shakeMs = 0;
  private occluded: TourRect[] = [];
  /** 219차 — 단계가 시작된 뒤 새로 열린 창(유저가 연 상세보기 등) — 막지 않고 덮지 않는다 */
  private baseline = new Set<DraggablePanel>();
  private freshOcc: TourRect[] = [];
  /** 219차 — 그중 모달(확인 · 수량 창 — depth 900대) — 어둡게 덮지 않고 방패에 구멍을 낸다(가두지 않게) */
  private modalOcc: TourRect[] = [];
  private updateFn: (time: number, delta: number) => void;
  private keyFn: (ev: KeyboardEvent) => void;
  private shutdownFn: () => void;
  /** 229차 — 이 단계의 그림 */
  private picture?: Phaser.GameObjects.Container;
  private pictureH = 0;

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
    // 219차 — 컨테이너 안 자식도 화면 고정이어야 히트 판정이 맞는다(카메라가 움직이는 필드 · 실내에서
    //   「다음」이 눌리지 않았다 — 사용자 리포트). 자식 scrollFactor 1이면 카메라 이동량만큼 어긋난다.
    const fix = (o: Phaser.GameObjects.GameObject): void => {
      (o as unknown as { setScrollFactor?: (v: number) => void }).setScrollFactor?.(0);
      if (o instanceof Phaser.GameObjects.Container) o.list.forEach(fix);
    };
    fix(this.bubble);

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

  /** 191차 — 완료 처리 없이 접는다(프롤로그 코치가 단계가 바뀌었을 때) */
  dismiss(): void { this.teardown(false); }

  private get step(): TourStep | undefined { return this.opts.steps[this.index]; }

  /** 219차 — 가이드 밖 행동 신호: 문장을 다 보이고 말풍선을 잠깐 흔든다 */
  shake(): void {
    this.completeTyping();
    this.shakeMs = 420;
  }

  /**
   * 219차 — 이 씬에 열린 창 사각형. 가이드가 짚는 창(대상 중심이 그 안 · 기준 사각형이 그 안)은 뺀다.
   * 가이드 자신의 그림(말풍선 · 방패)은 DraggablePanel이 아니므로 섞이지 않는다.
   */
  private collectOccluders(): TourRect[] {
    const list: TourRect[] = [];
    const modal: TourRect[] = [];
    const fresh: TourRect[] = [];
    const opened: TourRect[] = [];   // 단계가 시작된 뒤에 열린 창(모달 포함)
    for (const o of this.scene.children.list) {
      if (!(o instanceof DraggablePanel) || !o.active || !o.visible) continue;
      const b = o.panelBounds();
      list.push(b);
      if (!this.baseline.has(o)) opened.push(b);
      if (o.depth >= 900) modal.push(b);
      else if (!this.baseline.has(o)) fresh.push(b);
    }
    this.modalOcc = modal;
    this.freshOcc = fresh;
    const extra = GuideTour.occluderFns.get(this.scene)?.() ?? [];
    for (const r of extra) if (r && r.width > 0 && r.height > 0) list.push(r);
    const target = this.targetRect();
    const anchor = this.opts.anchor?.() ?? null;
    return list.filter((r) => {
      const grown = new Phaser.Geom.Rectangle(r.x - 2, r.y - 2, r.width + 4, r.height + 4);
      // 대상이 그 창 안에 있으면 「이 가이드가 설명하는 창」이다 — 단, **단계가 시작된 뒤에 열린 창**(라디오 혼잣말 등)은
      //   대상을 덮고 있어도 가리는 창이다(219차 — 상자 단계에 라디오 창이 상자 위를 덮었는데 테두리 · 말풍선이 그 위에 떴다)
      if (target && grown.contains(target.centerX, target.centerY) && !opened.includes(r)) return false;
      if (anchor && Phaser.Geom.Rectangle.ContainsRect(grown, anchor)) return false;
      return true;
    });
  }

  private go(i: number): void {
    let n = i;
    while (n < this.opts.steps.length && this.opts.steps[n].skipIf?.()) n++;
    if (n >= this.opts.steps.length) { this.teardown(true); return; }
    this.index = n;
    this.advanceIn = -1;
    // 219차 — 이 단계가 시작될 때 이미 떠 있던 창들. 그 뒤에 열린 창은 유저가 연 것이다(✕ · 조작을 막지 않는다)
    this.baseline = new Set(this.scene.children.list.filter((o): o is DraggablePanel => o instanceof DraggablePanel));
    const st = this.opts.steps[n];
    st.onEnter?.();
    this.fullText = t(st.text);
    this.typed = 0;
    this.typeAcc = 0;
    this.bodyText.setText('');
    // 229차 — 단계 그림(있으면 글 위에)
    this.picture?.destroy();
    this.picture = undefined;
    this.pictureH = 0;
    const pic = st.picture?.();
    if (pic) {
      this.picture = pic;
      this.pictureH = (st.pictureH ?? 76) + 10;
      pic.setPosition(PAD, PAD);
      this.bubble.addAt(pic, 2);   // 배경 · 본문 히트 위, 글 아래
      pic.iterate((o: Phaser.GameObjects.GameObject) => (o as unknown as { setScrollFactor?: (v: number) => void }).setScrollFactor?.(0));
      pic.setScrollFactor(0);
    }
    this.bodyText.setY(PAD + this.pictureH);
    const total = this.opts.steps.filter((s) => !s.skipIf?.()).length;
    const pos = this.opts.steps.slice(0, n + 1).filter((s) => !s.skipIf?.()).length;
    this.countText.setText(total > 1 ? `${pos} / ${total}` : '');   // 191차 — 한 단계짜리(프롤로그 코치)는 쪽수 없이
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
    // 219차 — 단계 도중에 대상이 사라지면(버린 아이템 등) 그 단계를 건너뛴다 — 기다릴 수 없는 일을 기다리며 화면을 막지 않는다
    if (st.skipIf?.() && this.advanceIn < 0) { this.go(this.index + 1); return; }
    // 타이핑
    if (this.typed < this.fullText.length) {
      this.typeAcc += delta;
      const add = Math.floor(this.typeAcc / TYPE_MS);
      if (add > 0) {
        this.typeAcc -= add * TYPE_MS;
        const from = this.typed;
        this.typed = Math.min(this.fullText.length, this.typed + add);
        for (let i = from; i < this.typed; i++) this.blips.say(this.fullText.charAt(i));
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
    if (this.shakeMs > 0) this.shakeMs = Math.max(0, this.shakeMs - delta);
    this.occluded = this.collectOccluders();
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
    if (this.step?.passive || this.modalOcc.length || this.freshOcc.length) {
      // 세상 안 체험 — 어둡게 하지 않는다 / 219차 — 확인 창이 떠 있으면 그 창을 어둡게 덮지 않는다
    } else if (!r) {
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
    // 219차 — 창이 대상을 가리면 테두리를 그리지 않는다(창보다 앞에 뜨면 안 된다)
    const hidden = !!r && this.occluded.some((o) => Phaser.Geom.Rectangle.Overlaps(o, r));
    if (r && !hidden) {
      const a = 0.55 + 0.45 * Math.abs(Math.sin(this.pulse / 320));
      f.lineStyle(3, this.shakeMs > 0 ? 0xff8a5a : 0xffce54, this.shakeMs > 0 ? 1 : a);
      f.strokeRoundedRect(r.x - 5, r.y - 5, r.width + 10, r.height + 10, 6);
    }
    this.syncShields(r);
  }

  /** 허용 사각형만 뚫은 입력 방패 */
  private syncShields(target: TourRect | null): void {
    const st = this.step;
    if (st?.passive) {
      if (this.shields.length) { this.shields.forEach((sh) => sh.destroy()); this.shields = []; }
      this.shieldSig = 'passive';
      return;
    }
    const holes = [...(st?.allow ? st.allow() : st?.wait && target ? [target] : []), ...this.modalOcc, ...this.freshOcc]
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
    const textH = Math.max(this.bodyText.height, 20) + this.pictureH;
    const st = this.step;
    const btnShown = !st?.wait && this.typed >= this.fullText.length;
    // 191차 — 단추도 쪽수도 없는 말풍선(체험 대기 · 한 단계짜리)은 아래 여백을 줄인다
    const footer = !st?.wait || this.countText.text !== '';
    const h = footer ? PAD + textH + 12 + 28 + PAD : PAD + textH + PAD;
    this.countText.setPosition(PAD, h - PAD - 21);
    this.nextBtn.setPosition(BUBBLE_W - PAD - 76, h - PAD - 28).setVisible(btnShown);
    (this.bubble.getData('bodyHit') as Phaser.GameObjects.Rectangle).setSize(BUBBLE_W, h);

    const target = this.targetRect();
    const anchor = this.opts.anchor?.() ?? target;
    const align = st?.alignTo?.() ?? target;
    const ty = align ? align.centerY : GAME_HEIGHT / 2;
    let bx: number, by: number, tail: 'left' | 'right' | 'none' = 'none';
    const fitsRight = !!anchor && anchor.right + 18 + BUBBLE_W <= GAME_WIDTH - 6;
    const fitsLeft = !!anchor && anchor.x - 18 - BUBBLE_W >= 6;
    let side = st?.side ?? 'right';
    if (side === 'auto') side = target && target.centerX < GAME_WIDTH / 2 ? 'left' : 'right';
    const goLeft = side === 'left' ? fitsLeft : !fitsRight && fitsLeft;
    if (anchor && goLeft) { bx = anchor.x - 18 - BUBBLE_W; tail = 'right'; }
    else if (anchor && fitsRight) { bx = anchor.right + 18; tail = 'left'; }
    else { bx = (GAME_WIDTH - BUBBLE_W) / 2; }
    by = Phaser.Math.Clamp(ty - h / 2, 8, GAME_HEIGHT - h - 8);
    if (!align && st?.dockY !== undefined) by = Phaser.Math.Clamp(st.dockY, 8, GAME_HEIGHT - h - 8);
    if (tail === 'none' && target) by = target.bottom + 16 + h <= GAME_HEIGHT ? target.bottom + 16 : Math.max(8, target.y - 16 - h);
    // 191차 — 짚는 대상이 없는 말풍선(걷기·뛰기·단축키 안내)에는 꼬리를 달지 않는다 — 가리킬 것이 없다
    let pointAt = !!target || !!st?.alignTo;
    // 219차 — 열린 창에 걸리면 비킨다: 창들 옆 → 화면 네 귀퉁이 · 위아래 가운데. 자리가 없으면 숨는다.
    const occ = this.occluded;
    const hits = (x: number, y: number): boolean => {
      const rr = new Phaser.Geom.Rectangle(x - 4, y - 4, BUBBLE_W + 8, h + 8);
      return occ.some((o) => Phaser.Geom.Rectangle.Overlaps(o, rr));
    };
    let show = true;
    if (occ.length && hits(bx, by)) {
      const U = occ.reduce((a, b) => Phaser.Geom.Rectangle.Union(a, b));
      const clampY = (y: number): number => Phaser.Math.Clamp(y, 8, GAME_HEIGHT - h - 8);
      const cands: [number, number][] = [
        [U.x - 18 - BUBBLE_W, clampY(ty - h / 2)], [U.right + 18, clampY(ty - h / 2)],
        [U.x - 18 - BUBBLE_W, 8], [U.right + 18, 8],
        [(GAME_WIDTH - BUBBLE_W) / 2, U.y - 16 - h], [(GAME_WIDTH - BUBBLE_W) / 2, U.bottom + 16],
        [8, 8], [GAME_WIDTH - BUBBLE_W - 8, 8], [8, GAME_HEIGHT - h - 8], [GAME_WIDTH - BUBBLE_W - 8, GAME_HEIGHT - h - 8],
      ];
      const ok = cands.find(([x, y]) => x >= 6 && y >= 6 && x + BUBBLE_W <= GAME_WIDTH - 6 && y + h <= GAME_HEIGHT - 6 && !hits(x, y));
      if (ok) { [bx, by] = ok; tail = 'none'; pointAt = false; } else show = false;
    }
    this.bubble.setVisible(show);
    const shakeX = this.shakeMs > 0 ? Math.round(Math.sin(this.shakeMs / 22) * 6) : 0;
    this.bubble.setPosition(Math.round(bx) + shakeX, Math.round(by));

    const g = this.bubbleBg;
    g.clear();
    g.fillStyle(0x0d2131, 0.97);
    g.fillRoundedRect(0, 0, BUBBLE_W, h, 8);
    g.lineStyle(2, this.shakeMs > 0 ? 0xff8a5a : 0xffce54, 1);
    g.strokeRoundedRect(0, 0, BUBBLE_W, h, 8);
    if (tail !== 'none' && pointAt) {
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
    this.picture?.destroy();
    this.bubble.destroy();
    if (done) {
      if (!this.opts.ephemeral) {
        GameState.setFlag(`tour.${this.opts.id}`);
        GameState.markDirty();
      }
      this.opts.onDone?.();
    }
    GuideTour.next();
  }
}

// dev 하네스 전용 — 진행 중 가이드 확인·건너뛰기(`__TOUR.active?.finish()`). 프로덕션 미노출(`__INV`/`__GS`와 같은 규칙)
if (import.meta.env.DEV) (globalThis as unknown as { __TOUR?: unknown }).__TOUR = GuideTour;
