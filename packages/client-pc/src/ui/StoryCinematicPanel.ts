/**
 * @file StoryCinematicPanel.ts
 * @description 인게임 컷씬 런타임 (165차 재작성)
 *
 * 컷씬은 별도의 무대를 그리지 않는다. **지금 서 있는 실제 필드 위에서**
 * 플레이어·NPC가 스크립트대로 걸어 다니고, 머리 위 말풍선과 하단 대사창이
 * 순서대로 흐른다. 재생 중에는 플레이어 조작이 완전히 막히고(씬 `uiBlocked`),
 * 종료하면 카메라 추적·HUD가 그대로 돌아온다.
 *
 * ⚠ 164차까지 쓰던 「검은 배경 + 사각형 배우」 폴백 무대는 폐기했다.
 *   배우를 준비하지 못한 대사는 조용히 대사창만 쓰고, 도형을 그리지 않는다.
 *
 * 원격지(다른 지역) 컷씬은 이 런타임이 아니라 씬이 담당한다 — 씬이 페이드 후
 * 해당 지역으로 전환해 같은 스크립트를 그곳에서 재생하고, 끝나면 원래 자리로
 * 돌아온다(`RegionFieldScene.playRemoteCinematic`). 이 파일은 "한 무대에서의
 * 재생"만 책임진다.
 */

import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../PhaserConfig.js';
import { paintHudPanel } from './HudPanelStyle.js';
import { voiceOfNpc, voiceOfPlayer } from '@tra/core';
import { VoiceTyper } from '../audio/Voice.js';
import { GameState } from '../store/GameState.js';
import { getLocale, t } from '../i18n/I18n.js';

export type CineDir = 'up' | 'down' | 'left' | 'right';
export type CineEmote = 'surprise' | 'think' | 'sad' | 'joy';

/** 컷씬이 움직일 수 있는 배우 하나. 필드에 이미 존재하는 오브젝트를 빌려 쓴다. */
export interface CineActor {
  /** 본체 — 원점 (0.5, 1) 기준 이미지/컨테이너 */
  obj: Phaser.GameObjects.GameObject & { x: number; y: number; alpha: number };
  /** 본체와 함께 움직여야 하는 부속 (이름표·마커 등) */
  followers?: (Phaser.GameObjects.GameObject & { x: number; y: number })[];
  nameKo: string;
  /** 211차 — 대사 목소리 id(스토리 인물 id). 없으면 이름으로 정한다 · 'player'는 주인공 목소리 */
  voiceId?: string;
  /** 말풍선 꼬리가 닿는 머리 위 오프셋 (월드 px, 음수) */
  headY?: number;
  /** 방향 프레임 교체 (스프라이트 시트 배우만) */
  setFacing?: (dir: CineDir) => void;
  /** 167차 — 걷기 프레임 재생 on/off (임시 배우·NPC). 없으면 정지 프레임으로 미끄러진다 */
  setWalking?: (on: boolean) => void;
  /**
   * 167차 — 이 배우를 컷씬이 끝나도 원위치로 되돌리지 않는다(임시 배우 · 퇴장한 인물).
   * 원위치 복귀는 "연출 이동은 개인 화면에서만 유효"라는 165차 규칙 때문인데, 사라져야 할 사람이
   * 되살아나면 그 규칙이 오히려 틀린 그림을 만든다.
   */
  keepPosition?: boolean;
}

export type CineStep =
  /**
   * 대사 — `thought`면 말풍선 없이 독백으로만 흐른다.
   * 167차 — `bubble`을 주면 머리 위 말풍선에는 그 글(보통 `...`)만 뜨고 본문은 아래 대사창이 맡는다.
   *   두 사람이 마주 서서 주고받는 장면은 말풍선이 화자 순서대로 좌우로 교차한다(사용자 각본).
   */
  | { kind: 'say'; who: string; text: string; textEn?: string; ms?: number; thought?: boolean; bubble?: string }
  /** 배우 이동 — 타일 단위 상대 이동 */
  | { kind: 'move'; who: string; dxTiles?: number; dyTiles?: number; ms?: number; face?: CineDir }
  /** 167차 — 배우를 **절대 타일**로 걷게 한다(각본이 무대 좌표를 알 때). 가로 먼저, 세로 다음 */
  | { kind: 'moveTo'; who: string; tx: number; ty: number; ms?: number; face?: CineDir }
  | { kind: 'face'; who: string; dir: CineDir }
  /** 167차 — 다른 배우 쪽을 본다 */
  | { kind: 'faceTo'; who: string; target: string }
  | { kind: 'emote'; who: string; emote: CineEmote; ms?: number }
  /** 167차 — 투명도(숨기·나타나기·멀어져 사라지기) */
  | { kind: 'fade'; who: string; alpha: number; ms?: number }
  /** 167차 — 무대에서 빠진다(안 보임). 임시 배우는 종료 시 정리된다 */
  | { kind: 'remove'; who: string }
  /** 167차 — 물건을 건넨다(작은 아이콘이 손에서 손으로 — 명부·상자·봉투) */
  | { kind: 'give'; from: string; to: string; item?: 'book' | 'box' | 'envelope' | 'photo'; ms?: number }
  /**
   * 235차 — 가족사진을 화면 가운데 크게 펼친다/거둔다(M7-04 「사진 속 천막」). 펼친 채 대사가 이어지고
   * `show: false`에서 접힌다. 그림은 절차 픽셀(`drawFamilyPhoto`) — 줄무늬 천막 좌판 · 천막 아래 젊은 정옥선 · 네 살의 나와 부모.
   */
  | { kind: 'photo'; show: boolean; ms?: number }
  /** 카메라를 배우에게 맞춘다 */
  | { kind: 'focus'; who: string; ms?: number }
  | { kind: 'wait'; ms: number };

export interface CineScript {
  id: string;
  /** 레터박스 좌상단 장면 자막 — 플레이어가 읽는 장소 이름 */
  placeKo: string;
  placeEn?: string;
  steps: readonly CineStep[];
}

export interface StoryCinematicConfig {
  script: CineScript;
  actors: Record<string, CineActor>;
  /** 타일 한 칸 크기 (이동 스텝 환산) */
  tileSize: number;
  camera: Phaser.Cameras.Scene2D.Camera;
  onComplete: () => void;
}

const BAR_TOP = 56;
const BAR_BOTTOM = 132;
const BUBBLE_MAX_W = 250;
/** 대사 타이핑 속도 — 대화창(DialoguePanel)과 같은 18ms/자 */
const TYPE_MS = 18;
/** 다 찍힌 뒤 최소한으로 머무는 시간 */
const SAY_MIN_HOLD_MS = 450;

export class StoryCinematicPanel extends Phaser.GameObjects.Container {
  private readonly cfg: StoryCinematicConfig;
  private readonly barTop: Phaser.GameObjects.Rectangle;
  private readonly barBottom: Phaser.GameObjects.Rectangle;
  private readonly placeText: Phaser.GameObjects.Text;
  private readonly boxG: Phaser.GameObjects.Graphics;
  private readonly speakerText: Phaser.GameObjects.Text;
  /** 211차 — 대사 블립 */
  private readonly voice = new VoiceTyper(voiceOfPlayer('m'));
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly skipHint: Phaser.GameObjects.Text;
  /** 말풍선 — 화면 고정 좌표에서 배우를 매 프레임 따라간다 */
  private readonly bubbleC: Phaser.GameObjects.Container;
  private readonly bubbleG: Phaser.GameObjects.Graphics;
  private readonly bubbleText: Phaser.GameObjects.Text;
  private bubbleActor?: CineActor;
  /** 연출이 끝나면 되돌릴 배우 원위치 */
  private readonly origins = new Map<Phaser.GameObjects.GameObject, { x: number; y: number }>();
  private readonly emotes: Phaser.GameObjects.Text[] = [];
  /** `remove` 스텝으로 무대에서 뺀 배우 — 종료 시 원위치 복구에서도 안 보이게 둔다 */
  private readonly removed = new Set<CineActor>();
  private index = -1;
  private finished = false;
  private timer?: Phaser.Time.TimerEvent;
  /** 177차 — 대사 타이핑. 클릭하면 지금 줄을 즉시 다 보여주고, 다 나왔으면 다음 줄로 넘긴다 */
  private sayFull = '';
  private sayTyped = 0;
  private sayHoldMs = 0;
  private typeTimer?: Phaser.Time.TimerEvent;
  private caret?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, cfg: StoryCinematicConfig) {
    super(scene, 0, 0);
    this.cfg = cfg;
    this.setDepth(20_000).setScrollFactor(0);

    // 필드를 가리지 않는 얇은 색 보정막 + 포인터 흡수 (조작 봉쇄)
    // ⚠ 컨테이너의 scrollFactor 0 은 렌더에만 적용된다 — 히트 판정은 자식 자신의 scrollFactor 를 쓰므로
    //   여기서 0 을 걸지 않으면 스크롤된 필드에서 클릭 판정이 카메라 이동량만큼 어긋난다(177차).
    const veil = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050b12, 0.10)
      .setScrollFactor(0)
      .setInteractive();
    veil.on('pointerdown', () => this.advanceSay());
    this.add(veil);

    // 레터박스 — 위/아래에서 밀려 들어온다
    this.barTop = scene.add.rectangle(GAME_WIDTH / 2, -BAR_TOP / 2, GAME_WIDTH, BAR_TOP, 0x04080d, 0.95).setOrigin(0.5);
    this.barBottom = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + BAR_BOTTOM / 2, GAME_WIDTH, BAR_BOTTOM, 0x04080d, 0.95).setOrigin(0.5);
    this.add([this.barTop, this.barBottom]);
    scene.tweens.add({ targets: this.barTop, y: BAR_TOP / 2, duration: 320, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: this.barBottom, y: GAME_HEIGHT - BAR_BOTTOM / 2, duration: 320, ease: 'Sine.easeOut' });

    this.placeText = scene.add.text(24, 20, cfg.script.placeKo, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#cfe4f2',
    }).setAlpha(0);
    this.add(this.placeText);
    scene.tweens.add({ targets: this.placeText, alpha: 1, duration: 420, delay: 240 });

    // 대사창 — 게임의 모든 창과 같은 HUD 패널 문법
    const boxY = GAME_HEIGHT - BAR_BOTTOM + 8, boxH = BAR_BOTTOM - 20;
    this.boxG = scene.add.graphics();
    paintHudPanel(this.boxG, 26, boxY, GAME_WIDTH - 52, boxH, { alpha: 0.95, headerH: 22 });
    this.speakerText = scene.add.text(40, boxY + 4, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffe9a0', fontStyle: 'bold',
    });
    this.bodyText = scene.add.text(40, boxY + 32, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#f2f8fd',
      wordWrap: { width: GAME_WIDTH - 108 }, lineSpacing: 4,
    });
    this.skipHint = scene.add.text(GAME_WIDTH - 40, boxY + 5, '클릭 = 다음 · [ESC] 건너뛰기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#7fa0b8',
    }).setOrigin(1, 0);
    // 단락이 끝났음을 알리는 흰 역삼각형 (§4 R3)
    this.caret = scene.add.text(GAME_WIDTH - 44, boxY + boxH - 22, '▼', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffffff',
    }).setOrigin(1, 0).setVisible(false);
    this.add([this.boxG, this.speakerText, this.bodyText, this.skipHint, this.caret]);

    // 말풍선 (배우 머리 위)
    this.bubbleG = scene.add.graphics();
    this.bubbleText = scene.add.text(0, 0, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#12202c',
      align: 'center', wordWrap: { width: BUBBLE_MAX_W },
    }).setOrigin(0.5, 0.5);
    this.bubbleC = scene.add.container(0, 0, [this.bubbleG, this.bubbleText]).setVisible(false);
    this.add(this.bubbleC);

    for (const a of Object.values(cfg.actors)) {
      if (a.keepPosition) continue;
      this.origins.set(a.obj, { x: a.obj.x, y: a.obj.y });
      for (const f of a.followers ?? []) this.origins.set(f, { x: f.x, y: f.y });
    }

    cfg.camera.stopFollow();
    scene.add.existing(this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.trackBubble, this);
    this.timer = scene.time.delayedCall(380, () => this.step());
  }

  /** ESC — 남은 스텝을 버리고 즉시 종료한다. 플레이어 조작은 여전히 막혀 있다. */
  skip(): void {
    if (this.finished) return;
    this.timer?.remove(false);
    this.typeTimer?.remove(); this.typeTimer = undefined;
    for (const a of Object.values(this.cfg.actors)) {
      this.scene.tweens.killTweensOf([a.obj, ...(a.followers ?? [])]);
      a.setWalking?.(false);
    }
    this.finish();
  }

  private actorOf(who: string): CineActor | undefined { return this.cfg.actors[who]; }

  private step(): void {
    if (this.finished) return;
    this.index++;
    const step = this.cfg.script.steps[this.index];
    if (!step) { this.finish(); return; }
    if (step.kind !== 'say') { this.sayFull = ''; this.sayTyped = 0; this.caret?.setVisible(false); }
    switch (step.kind) {
      case 'say': this.runSay(step); return;
      case 'move': this.runMove(step); return;
      case 'moveTo': this.runMoveTo(step); return;
      case 'face': this.actorOf(step.who)?.setFacing?.(step.dir); this.after(120); return;
      case 'faceTo': this.runFaceTo(step); return;
      case 'fade': this.runFade(step); return;
      case 'remove': this.runRemove(step); return;
      case 'give': this.runGive(step); return;
      case 'photo': this.runPhoto(step); return;
      case 'emote': this.runEmote(step); return;
      case 'focus': this.runFocus(step); return;
      case 'wait': this.after(step.ms); return;
    }
  }

  private after(ms: number): void {
    this.timer = this.scene.time.delayedCall(Math.max(1, ms), () => this.step());
  }

  private runSay(step: Extract<CineStep, { kind: 'say' }>): void {
    const actor = this.actorOf(step.who);
    this.speakerText.setText(step.thought ? '혼잣말' : (actor?.nameKo ?? step.who));
    // 211차 — 말하는 사람 목소리(주인공 · 혼잣말은 주인공 목소리)
    this.voice.setProfile(step.who === 'player' || step.thought
      ? voiceOfPlayer(GameState.character.look.sex)
      : voiceOfNpc(actor?.voiceId ?? actor?.nameKo ?? step.who));
    this.speakerText.setColor(step.thought ? '#f0bf6c' : '#ffe9a0');
    // 235차 — 찍기 **전에** 번역한다(187차 대화창과 같은 이유). 부분 문자열은 사전에 없어서, 영어 설정에서
    //  한국어가 한 글자씩 찍히다가 마지막 글자에서야 영어로 바뀌었다. 읽는 시간은 원문 길이로 그대로 잰다.
    const shown = getLocale() === 'en' && step.textEn ? step.textEn : t(step.text);
    this.startTyping(shown, step.ms ?? Phaser.Math.Clamp(700 + step.text.length * 62, 1200, 4200));
    if (step.thought || !actor) {
      this.bubbleActor = undefined;
      this.bubbleC.setVisible(false);
    } else {
      this.bubbleActor = actor;
      this.paintBubble(step.bubble ?? step.text);
      this.bubbleC.setVisible(true);
      this.trackBubble();
    }
  }

  /**
   * 한 글자씩 찍는다. 다 찍히면 읽는 시간(`holdMs`)만큼 기다렸다가 다음 스텝으로 간다.
   * 찍는 도중 클릭하면 즉시 전부, 다 찍힌 뒤 클릭하면 기다림 없이 다음 스텝으로.
   */
  private startTyping(text: string, holdMs: number): void {
    this.typeTimer?.remove(); this.typeTimer = undefined;
    this.sayFull = text; this.sayTyped = 0; this.sayHoldMs = holdMs;
    this.caret?.setVisible(false);
    this.bodyText.setText('');
    this.typeTimer = this.scene.time.addEvent({
      delay: TYPE_MS, loop: true,
      callback: () => {
        this.sayTyped = Math.min(this.sayFull.length, this.sayTyped + 1);
        this.voice.say(this.sayFull.charAt(this.sayTyped - 1));
        this.bodyText.setText(this.sayFull.slice(0, this.sayTyped));
        if (this.sayTyped >= this.sayFull.length) this.finishTyping();
      },
    });
  }

  /** 타이핑 종료 — 읽는 시간만큼만 기다린다(타이핑에 쓴 시간은 뺀다) */
  private finishTyping(): void {
    this.typeTimer?.remove(); this.typeTimer = undefined;
    this.bodyText.setText(this.sayFull);
    this.sayTyped = this.sayFull.length;
    this.caret?.setVisible(true);
    const typedMs = this.sayFull.length * TYPE_MS;
    this.after(Math.max(SAY_MIN_HOLD_MS, this.sayHoldMs - typedMs));
  }

  /** 클릭 — 찍는 중이면 즉시 완성, 다 찍혔으면 바로 다음 스텝 */
  private advanceSay(): void {
    if (this.finished) return;
    if (this.typeTimer) { this.finishTyping(); return; }
    if (!this.sayFull) return;   // 이동·페이드 같은 연출 중에는 클릭이 아무것도 하지 않는다
    this.sayFull = '';
    this.caret?.setVisible(false);
    this.timer?.remove(false); this.timer = undefined;
    this.step();
  }

  private paintBubble(text: string): void {
    this.bubbleText.setText(text);
    const w = Math.min(BUBBLE_MAX_W + 24, this.bubbleText.width + 20);
    const h = this.bubbleText.height + 14;
    this.bubbleG.clear();
    this.bubbleG.fillStyle(0xf3f8fb, 0.97);
    this.bubbleG.fillRoundedRect(-w / 2, -h / 2, w, h, 7);
    this.bubbleG.lineStyle(2, 0x1d3b52, 0.9);
    this.bubbleG.strokeRoundedRect(-w / 2, -h / 2, w, h, 7);
    // 꼬리 — 아래 중앙
    this.bubbleG.fillStyle(0xf3f8fb, 0.97);
    this.bubbleG.fillTriangle(-6, h / 2 - 1, 6, h / 2 - 1, 0, h / 2 + 9);
    this.bubbleG.lineStyle(2, 0x1d3b52, 0.9);
    this.bubbleG.lineBetween(-6, h / 2, 0, h / 2 + 9);
    this.bubbleG.lineBetween(6, h / 2, 0, h / 2 + 9);
    (this.bubbleC as Phaser.GameObjects.Container).setData('h', h);
  }

  /** 말풍선을 배우 머리 위에 매 프레임 고정한다 (카메라가 움직여도 따라간다). */
  private trackBubble(): void {
    const a = this.bubbleActor;
    if (!a || !this.bubbleC.visible || !a.obj.active) return;
    const cam = this.cfg.camera;
    const h = (this.bubbleC.getData('h') as number) ?? 30;
    const sx = (a.obj.x - cam.scrollX) * cam.zoom;
    const sy = (a.obj.y + (a.headY ?? -52) - cam.scrollY) * cam.zoom;
    this.bubbleC.setPosition(
      Phaser.Math.Clamp(sx, 150, GAME_WIDTH - 150),
      Phaser.Math.Clamp(sy - h / 2 - 12, BAR_TOP + h / 2 + 6, GAME_HEIGHT - BAR_BOTTOM - h / 2 - 8),
    );
  }

  private runMove(step: Extract<CineStep, { kind: 'move' }>): void {
    const a = this.actorOf(step.who);
    if (!a) { this.after(60); return; }
    const T = this.cfg.tileSize;
    const dx = (step.dxTiles ?? 0) * T, dy = (step.dyTiles ?? 0) * T;
    const dir: CineDir = step.face ?? (Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'down' : 'up'));
    a.setFacing?.(dir);
    a.setWalking?.(true);
    const ms = step.ms ?? Math.max(340, Math.hypot(dx, dy) * 9);
    const targets: (Phaser.GameObjects.GameObject & { x: number; y: number })[] = [a.obj, ...(a.followers ?? [])];
    this.scene.tweens.add({
      targets, x: `+=${dx}`, y: `+=${dy}`, duration: ms, ease: 'Sine.easeInOut',
      onComplete: () => { a.setWalking?.(false); this.step(); },
    });
  }

  /** 절대 타일 이동 — 가로 먼저 걷고 세로를 걷는다(타일 통로를 따라가는 그림) */
  private runMoveTo(step: Extract<CineStep, { kind: 'moveTo' }>): void {
    const a = this.actorOf(step.who);
    if (!a) { this.after(60); return; }
    const T = this.cfg.tileSize;
    const tx = step.tx * T + T / 2, ty = step.ty * T + T;
    const dx = tx - a.obj.x, dy = ty - a.obj.y;
    const legs: { dx: number; dy: number }[] = [];
    if (Math.abs(dx) >= 1) legs.push({ dx, dy: 0 });
    if (Math.abs(dy) >= 1) legs.push({ dx: 0, dy });
    if (!legs.length) { if (step.face) a.setFacing?.(step.face); this.after(80); return; }
    const total = Math.abs(dx) + Math.abs(dy);
    const msAll = step.ms ?? Math.max(340, total * 9);
    const targets: (Phaser.GameObjects.GameObject & { x: number; y: number })[] = [a.obj, ...(a.followers ?? [])];
    const run = (i: number): void => {
      if (i >= legs.length) { if (step.face) a.setFacing?.(step.face); this.step(); return; }
      const leg = legs[i];
      const dir: CineDir = leg.dx !== 0 ? (leg.dx > 0 ? 'right' : 'left') : (leg.dy > 0 ? 'down' : 'up');
      a.setFacing?.(dir);
      a.setWalking?.(true);
      this.scene.tweens.add({
        targets, x: `+=${leg.dx}`, y: `+=${leg.dy}`,
        duration: Math.max(120, msAll * (Math.abs(leg.dx) + Math.abs(leg.dy)) / total), ease: 'Linear',
        onComplete: () => { a.setWalking?.(false); run(i + 1); },
      });
    };
    run(0);
  }

  private runFaceTo(step: Extract<CineStep, { kind: 'faceTo' }>): void {
    const a = this.actorOf(step.who), b = this.actorOf(step.target);
    if (a && b) {
      const dx = b.obj.x - a.obj.x, dy = b.obj.y - a.obj.y;
      a.setFacing?.(Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'down' : 'up'));
    }
    this.after(120);
  }

  private runFade(step: Extract<CineStep, { kind: 'fade' }>): void {
    const a = this.actorOf(step.who);
    if (!a) { this.after(60); return; }
    const ms = step.ms ?? 420;
    const targets = [a.obj, ...(a.followers ?? [])];
    this.scene.tweens.add({ targets, alpha: step.alpha, duration: ms, ease: 'Sine.easeInOut' });
    this.after(ms + 40);
  }

  private runRemove(step: Extract<CineStep, { kind: 'remove' }>): void {
    const a = this.actorOf(step.who);
    if (a) {
      (a.obj as unknown as { setVisible?: (v: boolean) => void }).setVisible?.(false);
      for (const f of a.followers ?? []) (f as unknown as { setVisible?: (v: boolean) => void }).setVisible?.(false);
      if (this.bubbleActor === a) { this.bubbleActor = undefined; this.bubbleC.setVisible(false); }
      this.removed.add(a);
    }
    this.after(80);
  }

  /** 물건 건네기 — 손 높이에서 작은 도트 아이콘이 상대에게 날아간다 */
  private runGive(step: Extract<CineStep, { kind: 'give' }>): void {
    const from = this.actorOf(step.from), to = this.actorOf(step.to);
    if (!from || !to) { this.after(60); return; }
    const ms = step.ms ?? 900;
    const cam = this.cfg.camera;
    const sx = (from.obj.x - cam.scrollX) * cam.zoom, sy = (from.obj.y - 26 - cam.scrollY) * cam.zoom;
    const ex = (to.obj.x - cam.scrollX) * cam.zoom, ey = (to.obj.y - 26 - cam.scrollY) * cam.zoom;
    const g = this.scene.add.graphics();
    const kind = step.item ?? 'book';
    if (kind === 'book') {
      g.fillStyle(0x6b3a1e, 1).fillRect(-6, -4, 12, 9);
      g.fillStyle(0xf1e6c8, 1).fillRect(-4, -3, 9, 7);
      g.fillStyle(0x6b3a1e, 1).fillRect(-6, -4, 2, 9);
    } else if (kind === 'box') {
      g.fillStyle(0xb98a4a, 1).fillRect(-7, -5, 14, 10);
      g.lineStyle(1, 0x5a3b1a, 1).strokeRect(-7, -5, 14, 10);
    } else if (kind === 'photo') {
      // 235차 — 흰 테두리 사진 한 장(하늘 · 바다 · 천막 줄무늬)
      g.fillStyle(0xf2ead8, 1).fillRect(-7, -5, 14, 11);
      g.fillStyle(0x9fd0e8, 1).fillRect(-6, -4, 12, 4);
      g.fillStyle(0xd84a3a, 1).fillRect(-6, 0, 3, 2).fillRect(-1, 0, 3, 2).fillRect(4, 0, 2, 2);
      g.fillStyle(0x8a8070, 1).fillRect(-6, 2, 12, 3);
      g.lineStyle(1, 0x3a2a1c, 1).strokeRect(-7, -5, 14, 11);
    } else {
      g.fillStyle(0xf4f1e6, 1).fillRect(-7, -4, 14, 9);
      g.lineStyle(1, 0x8b7d5a, 1).strokeRect(-7, -4, 14, 9).lineBetween(-7, -4, 0, 1).lineBetween(0, 1, 7, -4);
    }
    g.setPosition(sx, sy);
    this.add(g);
    this.emotes.push(g as unknown as Phaser.GameObjects.Text);
    from.setFacing?.(ex >= sx ? 'right' : 'left');
    to.setFacing?.(ex >= sx ? 'left' : 'right');
    this.scene.tweens.add({ targets: g, x: ex, y: ey, duration: ms * 0.7, ease: 'Sine.easeInOut',
      onComplete: () => this.scene.tweens.add({ targets: g, alpha: 0, duration: ms * 0.3 }) });
    this.after(ms + 60);
  }

  /** 235차 — 펼친 사진(화면 고정). 종료 · 건너뛰기에서 함께 걷힌다 */
  private photoC?: Phaser.GameObjects.Container;

  private runPhoto(step: Extract<CineStep, { kind: 'photo' }>): void {
    if (step.show) {
      if (!this.photoC) {
        // 대사창(아래)과 레터박스(위) 사이 가운데 — 사진이 대사를 가리지 않게
        const cy = BAR_TOP + (GAME_HEIGHT - BAR_BOTTOM - BAR_TOP) / 2;
        const g = this.scene.add.graphics();
        drawFamilyPhoto(g);
        this.photoC = this.scene.add.container(GAME_WIDTH / 2, cy, [g]).setAlpha(0).setScale(0.92);
        this.add(this.photoC);
      }
      this.scene.tweens.add({ targets: this.photoC, alpha: 1, scale: 1, duration: 360, ease: 'Sine.easeOut' });
      this.after(step.ms ?? 700);
      return;
    }
    const c = this.photoC;
    this.photoC = undefined;
    if (c) this.scene.tweens.add({ targets: c, alpha: 0, scale: 0.94, duration: 300, ease: 'Sine.easeIn', onComplete: () => c.destroy() });
    this.after(step.ms ?? 420);
  }

  private runFocus(step: Extract<CineStep, { kind: 'focus' }>): void {
    const a = this.actorOf(step.who);
    if (!a) { this.after(60); return; }
    const ms = step.ms ?? 620;
    this.cfg.camera.pan(a.obj.x, a.obj.y - 24, ms, 'Sine.easeInOut');
    this.after(ms + 80);
  }

  private runEmote(step: Extract<CineStep, { kind: 'emote' }>): void {
    const a = this.actorOf(step.who);
    if (!a) { this.after(60); return; }
    const glyph = step.emote === 'surprise' ? '!' : step.emote === 'think' ? '?' : step.emote === 'sad' ? '...' : '♪';
    const cam = this.cfg.camera;
    const t = this.scene.add.text(
      (a.obj.x - cam.scrollX) * cam.zoom,
      (a.obj.y + (a.headY ?? -52) - cam.scrollY) * cam.zoom - 14,
      glyph,
      { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffe9a0', fontStyle: 'bold' },
    ).setOrigin(0.5, 1);
    this.add(t);
    this.emotes.push(t);
    this.scene.tweens.add({ targets: t, y: t.y - 10, alpha: 0, duration: step.ms ?? 900, ease: 'Sine.easeOut' });
    this.after(step.ms ?? 900);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.photoC?.destroy(); this.photoC = undefined;
    this.timer?.remove(false);
    this.typeTimer?.remove(); this.typeTimer = undefined;
    this.bubbleC.setVisible(false);
    this.scene.tweens.add({ targets: this.barTop, y: -BAR_TOP / 2, duration: 280, ease: 'Sine.easeIn' });
    this.scene.tweens.add({
      targets: this.barBottom, y: GAME_HEIGHT + BAR_BOTTOM / 2, duration: 280, ease: 'Sine.easeIn',
      onComplete: () => {
        if (!this.active) return;
        const done = this.cfg.onComplete;
        this.destroy();
        done();
      },
    });
  }

  override destroy(fromScene?: boolean): void {
    this.timer?.remove(false);
    this.scene?.events?.off(Phaser.Scenes.Events.UPDATE, this.trackBubble, this);
    for (const e of this.emotes) e.destroy();
    this.emotes.length = 0;
    // 연출 이동은 개인 화면에서만 유효하다 — 배우와 이름표를 원래 자리로 되돌린다.
    for (const [obj, o] of this.origins) {
      if (!obj.active) continue;
      const g = obj as Phaser.GameObjects.GameObject & { x: number; y: number; alpha?: number };
      g.x = o.x; g.y = o.y;
      if (g.alpha !== undefined) g.alpha = 1;
    }
    this.removed.clear();
    super.destroy(fromScene);
  }
}

/**
 * 235차 — M7-04 「사진 속 천막」의 가족사진(절차 픽셀 · 64×44 논리 픽셀을 ×4로 그린다).
 * 프롤로그에서 받은 16px 아이콘(`it_photo`)과 같은 구도를 크게 — 하늘 · 바다 · 줄무늬 천막 좌판 ·
 * 천막 아래 머릿수건을 쓴 젊은 상인(22년 전의 정옥선) · 앞쪽에 부모와 네 살의 나. 낡은 인화지 색감.
 * 원점 = 사진 가운데.
 */
function drawFamilyPhoto(g: Phaser.GameObjects.Graphics): void {
  const P = 4, W = 64, H = 44;
  const ox = -(W * P) / 2, oy = -(H * P) / 2;
  const px = (x: number, y: number, w: number, h: number, c: number): void => {
    g.fillStyle(c, 1).fillRect(ox + x * P, oy + y * P, w * P, h * P);
  };
  // 인화지 테두리 · 그림자
  g.fillStyle(0x000000, 0.35).fillRect(ox - 14 + 6, oy - 14 + 8, W * P + 28, H * P + 28);
  g.fillStyle(0xf2ead8, 1).fillRect(ox - 14, oy - 14, W * P + 28, H * P + 28);
  // 하늘(위가 진하다) · 수평선 · 바다
  for (let y = 0; y < 14; y++) px(0, y, W, 1, y < 5 ? 0x8cc4e0 : y < 10 ? 0x9fd0e8 : 0xbfe0ee);
  px(0, 14, W, 1, 0x5f9cc6);
  for (let y = 15; y < 20; y++) px(0, y, W, 1, y % 2 ? 0x3f7fae : 0x4a8ab8);
  // 땅(안벽)
  px(0, 20, W, 24, 0x9a8f7c);
  for (let x = 0; x < W; x += 9) px(x, 20, 1, 24, 0x8a806e);
  px(0, 36, W, 1, 0x8a806e);
  // 천막 지붕 — 빨강 · 흰 줄무늬 + 물결 처마
  for (let x = 6; x < 42; x++) px(x, 8, 1, 8, Math.floor((x - 6) / 3) % 2 ? 0xf4ecdc : 0xd84a3a);
  for (let x = 6; x < 42; x += 3) px(x + 1, 16, 1, 1, Math.floor((x - 6) / 3) % 2 ? 0xf4ecdc : 0xd84a3a);
  px(6, 7, 36, 1, 0x8a2a20);
  // 간판(글씨는 흐릿한 흰 점 — 읽히지 않는 옛 인화)
  px(15, 3, 18, 5, 0x2f5a8a);
  for (const x of [17, 19, 20, 23, 25, 26, 29, 30]) px(x, 5, 1, 1, 0xe8eef2);
  px(14, 3, 1, 5, 0x1f3a5a); px(33, 3, 1, 5, 0x1f3a5a);
  // 기둥
  px(7, 16, 1, 18, 0x4a3a2a); px(40, 16, 1, 18, 0x4a3a2a);
  // 천막 아래 — 머릿수건을 쓴 젊은 상인(22년 전)
  px(23, 18, 4, 1, 0xe8d8b0);   // 수건
  px(23, 19, 4, 3, 0xe8b890);   // 얼굴
  px(22, 22, 6, 6, 0x6a8a5a);   // 앞치마 위 옷
  // 좌판 — 나무 판 · 파란 상자 · 은빛 생선
  px(9, 27, 30, 2, 0xa86a34); px(9, 29, 30, 4, 0x8a5a2a);
  for (const x of [11, 19, 27]) {
    px(x, 24, 7, 3, 0x4a8ac8);
    px(x + 1, 25, 2, 1, 0xd8dee4); px(x + 4, 25, 2, 1, 0xc8d0d8);
  }
  // 아버지(왼쪽 · 큰 키)
  px(46, 18, 4, 1, 0x2a2a2a);   // 머리카락
  px(46, 19, 4, 3, 0xe8b890);
  px(45, 22, 6, 11, 0x3a5a7a);  // 잠바
  px(46, 33, 2, 8, 0x2a2a3a); px(49, 33, 2, 8, 0x2a2a3a);
  // 어머니(오른쪽 · 긴 머리)
  px(55, 18, 4, 2, 0x3a2418); px(54, 20, 1, 4, 0x3a2418); px(59, 20, 1, 4, 0x3a2418);
  px(55, 20, 4, 3, 0xf0c4a0);
  px(54, 23, 6, 9, 0xc85a6a);
  px(55, 32, 2, 9, 0x4a4a5a); px(58, 32, 2, 9, 0x4a4a5a);
  // 네 살의 나(가운데 · 노란 옷 · 부모 손을 잡았다)
  px(51, 27, 3, 1, 0x2a2a2a);
  px(51, 28, 3, 2, 0xf0c4a0);
  px(50, 30, 5, 5, 0xf2c84a);
  px(51, 35, 1, 5, 0x3a4a6a); px(53, 35, 1, 5, 0x3a4a6a);
  px(49, 30, 1, 1, 0xf0c4a0); px(55, 30, 1, 1, 0xf0c4a0);   // 맞잡은 손
  // 바랜 인화 색감 — 옅은 노랑 막 + 모서리 얼룩
  g.fillStyle(0xf2d8a0, 0.14).fillRect(ox, oy, W * P, H * P);
  g.fillStyle(0xe0c890, 0.25).fillRect(ox, oy, 10 * P, 3 * P);
  g.fillStyle(0xe0c890, 0.2).fillRect(ox + (W - 7) * P, oy + (H - 4) * P, 7 * P, 4 * P);
  g.lineStyle(2, 0x3a2a1c, 0.8).strokeRect(ox - 14, oy - 14, W * P + 28, H * P + 28);
}
