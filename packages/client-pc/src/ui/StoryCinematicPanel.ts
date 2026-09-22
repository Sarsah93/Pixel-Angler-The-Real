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

export type CineDir = 'up' | 'down' | 'left' | 'right';
export type CineEmote = 'surprise' | 'think' | 'sad' | 'joy';

/** 컷씬이 움직일 수 있는 배우 하나. 필드에 이미 존재하는 오브젝트를 빌려 쓴다. */
export interface CineActor {
  /** 본체 — 원점 (0.5, 1) 기준 이미지/컨테이너 */
  obj: Phaser.GameObjects.GameObject & { x: number; y: number; alpha: number };
  /** 본체와 함께 움직여야 하는 부속 (이름표·마커 등) */
  followers?: (Phaser.GameObjects.GameObject & { x: number; y: number })[];
  nameKo: string;
  /** 말풍선 꼬리가 닿는 머리 위 오프셋 (월드 px, 음수) */
  headY?: number;
  /** 방향 프레임 교체 (스프라이트 시트 배우만) */
  setFacing?: (dir: CineDir) => void;
}

export type CineStep =
  /** 대사 — `thought`면 말풍선 없이 독백으로만 흐른다 */
  | { kind: 'say'; who: string; text: string; textEn?: string; ms?: number; thought?: boolean }
  /** 배우 이동 — 타일 단위 상대 이동 */
  | { kind: 'move'; who: string; dxTiles?: number; dyTiles?: number; ms?: number; face?: CineDir }
  | { kind: 'face'; who: string; dir: CineDir }
  | { kind: 'emote'; who: string; emote: CineEmote; ms?: number }
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

export class StoryCinematicPanel extends Phaser.GameObjects.Container {
  private readonly cfg: StoryCinematicConfig;
  private readonly barTop: Phaser.GameObjects.Rectangle;
  private readonly barBottom: Phaser.GameObjects.Rectangle;
  private readonly placeText: Phaser.GameObjects.Text;
  private readonly boxG: Phaser.GameObjects.Graphics;
  private readonly speakerText: Phaser.GameObjects.Text;
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
  private index = -1;
  private finished = false;
  private timer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, cfg: StoryCinematicConfig) {
    super(scene, 0, 0);
    this.cfg = cfg;
    this.setDepth(20_000).setScrollFactor(0);

    // 필드를 가리지 않는 얇은 색 보정막 + 포인터 흡수 (조작 봉쇄)
    const veil = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050b12, 0.10)
      .setInteractive();
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
    this.skipHint = scene.add.text(GAME_WIDTH - 40, boxY + 5, '[ESC] 건너뛰기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#7fa0b8',
    }).setOrigin(1, 0);
    this.add([this.boxG, this.speakerText, this.bodyText, this.skipHint]);

    // 말풍선 (배우 머리 위)
    this.bubbleG = scene.add.graphics();
    this.bubbleText = scene.add.text(0, 0, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#12202c',
      align: 'center', wordWrap: { width: BUBBLE_MAX_W },
    }).setOrigin(0.5, 0.5);
    this.bubbleC = scene.add.container(0, 0, [this.bubbleG, this.bubbleText]).setVisible(false);
    this.add(this.bubbleC);

    for (const a of Object.values(cfg.actors)) {
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
    this.scene.tweens.killTweensOf(Object.values(this.cfg.actors).map((a) => a.obj));
    this.finish();
  }

  private actorOf(who: string): CineActor | undefined { return this.cfg.actors[who]; }

  private step(): void {
    if (this.finished) return;
    this.index++;
    const step = this.cfg.script.steps[this.index];
    if (!step) { this.finish(); return; }
    switch (step.kind) {
      case 'say': this.runSay(step); return;
      case 'move': this.runMove(step); return;
      case 'face': this.actorOf(step.who)?.setFacing?.(step.dir); this.after(120); return;
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
    this.speakerText.setColor(step.thought ? '#f0bf6c' : '#ffe9a0');
    this.bodyText.setText(step.text);
    if (step.thought || !actor) {
      this.bubbleActor = undefined;
      this.bubbleC.setVisible(false);
    } else {
      this.bubbleActor = actor;
      this.paintBubble(step.text);
      this.bubbleC.setVisible(true);
      this.trackBubble();
    }
    // 읽는 속도 — 한 글자당 약 62ms, 최소 1.2초
    this.after(step.ms ?? Phaser.Math.Clamp(700 + step.text.length * 62, 1200, 4200));
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
    const ms = step.ms ?? Math.max(340, Math.hypot(dx, dy) * 9);
    const targets: (Phaser.GameObjects.GameObject & { x: number; y: number })[] = [a.obj, ...(a.followers ?? [])];
    this.scene.tweens.add({
      targets, x: `+=${dx}`, y: `+=${dy}`, duration: ms, ease: 'Sine.easeInOut',
      onComplete: () => this.step(),
    });
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
    this.timer?.remove(false);
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
      const g = obj as Phaser.GameObjects.GameObject & { x: number; y: number };
      g.x = o.x; g.y = o.y;
    }
    super.destroy(fromScene);
  }
}
