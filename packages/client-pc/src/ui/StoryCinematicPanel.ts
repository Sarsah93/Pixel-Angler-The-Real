/**
 * 개인 전용 스토리 연출.
 *
 * 필드 씬을 멈추고 같은 화면 위에 얹는 작은 연출 런타임이다. 대화 패널의
 * 선택지처럼 플레이어가 다음 버튼을 눌러야 하는 UI가 아니라, 짧은 장면을
 * 타임라인으로 재생한다. 서버에는 연출 내용이 아니라 `cinematic` 활동만
 * 공개하므로 다른 플레이어의 화면에는 원래 필드와 머리 위 `바쁨`만 남는다.
 */

import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../PhaserConfig.js';

export interface StoryCinematicLine {
  speaker: string;
  text: string;
  actor: 'player' | 'watcher' | 'courier' | 'thought';
  durationMs?: number;
}

export interface StoryCinematicConfig {
  title: string;
  place: string;
  lines: readonly StoryCinematicLine[];
  /** 실제 RegionFieldScene에 이미 배치된 배우. 없을 때만 개발용 폴백 무대를 사용한다. */
  fieldActors?: Partial<Record<'player' | 'watcher' | 'courier', Phaser.GameObjects.GameObject>>;
  onComplete: () => void;
}

type ActorKey = 'player' | 'watcher' | 'courier';

export class StoryCinematicPanel extends Phaser.GameObjects.Container {
  private readonly cfg: StoryCinematicConfig;
  private readonly actors = new Map<ActorKey, Phaser.GameObjects.Container>();
  private readonly speechBg: Phaser.GameObjects.Rectangle;
  private readonly speech: Phaser.GameObjects.Text;
  private readonly dialogueSpeaker: Phaser.GameObjects.Text;
  private readonly dialogueText: Phaser.GameObjects.Text;
  private readonly stage: Phaser.GameObjects.Container;
  private readonly fieldProps: Phaser.GameObjects.GameObject[] = [];
  private readonly fieldOrigins = new Map<Phaser.GameObjects.GameObject, { x: number; y: number; alpha: number }>();
  private index = -1;
  private finished = false;
  private timer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, cfg: StoryCinematicConfig) {
    super(scene, 0, 0);
    this.cfg = cfg;
    for (const actor of Object.values(cfg.fieldActors ?? {})) {
      if (!actor || !('x' in actor) || !('y' in actor)) continue;
      const a = actor as Phaser.GameObjects.GameObject & { x: number; y: number; alpha: number };
      this.fieldOrigins.set(actor, { x: a.x, y: a.y, alpha: a.alpha });
    }
    this.setDepth(20_000).setScrollFactor(0);

    const inField = !!cfg.fieldActors;
    // 실제 필드 연출은 맵과 NPC가 보여야 한다. 검은 무대는 배우를 준비하지 못한
    // 개발용 폴백에서만 사용하고, 정상 경로는 얇은 색 보정막만 씌운다.
    const veil = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050b12, inField ? 0.12 : 0.98)
      .setInteractive();
    this.add(veil);

    this.stage = scene.add.container(0, 0);
    this.add(this.stage);
    if (!inField) this.drawStage();
    else {
      // 상·하 레터박스만 얹어 필드와 대사창의 경계를 만든다. 맵 자체는 가리지 않는다.
      this.add([
        scene.add.rectangle(GAME_WIDTH / 2, 18, GAME_WIDTH, 36, 0x050b12, 0.72),
        scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 146, GAME_WIDTH, 28, 0x050b12, 0.72),
      ]);
    }

    const heading = scene.add.text(34, 28, cfg.title, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '17px', color: '#eef7ff', fontStyle: 'bold',
    });
    const place = scene.add.text(36, 54, cfg.place, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8fa8bf',
    });
    this.add([heading, place]);

    this.speechBg = scene.add.rectangle(0, 0, 10, 10, 0x071522, 0.96)
      .setStrokeStyle(1, 0x8db8ce, 0.8).setVisible(false);
    this.speech = scene.add.text(0, 0, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffffff',
      align: 'center', wordWrap: { width: 290 }, padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setVisible(false);
    this.add([this.speechBg, this.speech]);

    const dialogueBg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 86, GAME_WIDTH - 72, 94, 0x081723, 0.98)
      .setStrokeStyle(1, 0x2f6680, 0.95);
    this.dialogueSpeaker = scene.add.text(58, GAME_HEIGHT - 127, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#6ee7c8', fontStyle: 'bold',
    });
    this.dialogueText = scene.add.text(58, GAME_HEIGHT - 105, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#f4f8fb',
      wordWrap: { width: GAME_WIDTH - 116 }, lineSpacing: 5,
    });
    this.add([dialogueBg, this.dialogueSpeaker, this.dialogueText]);

    scene.add.existing(this);
    this.playIntro();
  }

  private drawStage(): void {
    const s = this.scene;
    const back = s.add.rectangle(GAME_WIDTH / 2, 310, GAME_WIDTH - 84, 420, 0x17232c, 1)
      .setStrokeStyle(1, 0x344c57, 1);
    const market = s.add.rectangle(790, 236, 430, 112, 0x314650, 1)
      .setStrokeStyle(2, 0x536d77, 1);
    const roof = s.add.triangle(790, 156, 550, 224, 1030, 224, 0x1c2e38, 1);
    const sign = s.add.text(790, 250, '인천 도매시장 · 후문', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#d0e2e7',
    }).setOrigin(0.5);
    const wall = s.add.rectangle(295, 324, 118, 190, 0x25343c, 1)
      .setStrokeStyle(2, 0x53626a, 1);
    const wallLine = s.add.line(295, 324, -45, 0, 45, 0, 0x71858b, 0.5).setLineWidth(2);
    const ledgerTable = s.add.rectangle(840, 406, 210, 16, 0x4f3327, 1);
    this.stage.add([back, market, roof, sign, wall, wallLine, ledgerTable]);

    this.actors.set('player', this.makeActor(250, 500, 0x4b83a5, '나'));
    this.actors.set('watcher', this.makeActor(505, 450, 0x4c4d55, '1'));
    this.actors.set('courier', this.makeActor(1020, 450, 0x78624d, '2'));
    for (const actor of this.actors.values()) this.stage.add(actor);
    this.actors.get('player')!.setAlpha(0.25);
    this.actors.get('courier')!.setX(1110);
  }

  private makeActor(x: number, y: number, colour: number, label: string): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const shadow = this.scene.add.ellipse(0, 3, 36, 10, 0x000000, 0.35);
    const body = this.scene.add.rectangle(0, -28, 24, 50, colour, 1)
      .setStrokeStyle(1, 0xb9d0d8, 0.35);
    const head = this.scene.add.circle(0, -66, 14, colour, 1)
      .setStrokeStyle(1, 0xddebf0, 0.45);
    const tag = this.scene.add.text(0, -94, label, {
      fontFamily: 'monospace', fontSize: '10px', color: '#e7f0f2', backgroundColor: '#07131dcc', padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    c.add([shadow, body, head, tag]);
    return c;
  }

  private playIntro(): void {
    this.dialogueSpeaker.setText('기록');
    this.dialogueText.setText('잠깐 멈춰 선다. 시장 뒤편에서 종이 넘기는 소리가 들린다.');
    const fieldCourier = this.cfg.fieldActors?.courier;
    const fieldWatcher = this.cfg.fieldActors?.watcher;
    if (fieldCourier && fieldWatcher && 'x' in fieldCourier && 'x' in fieldWatcher) {
      const courier = fieldCourier as Phaser.GameObjects.GameObject & { x: number; y: number };
      const watcher = fieldWatcher as Phaser.GameObjects.GameObject & { x: number; y: number };
      this.timer = this.scene.time.delayedCall(450, () => {
        const watcherX = watcher.x;
        const watcherY = watcher.y;
        this.scene.tweens.add({
          targets: courier,
          x: watcherX + 42,
          y: watcherY,
          duration: 1050,
          ease: 'Sine.easeInOut',
          onComplete: () => this.nextLine(),
        });
      });
      return;
    }
    if (this.cfg.fieldActors) {
      this.timer = this.scene.time.delayedCall(450, () => this.nextLine());
      return;
    }
    this.timer = this.scene.time.delayedCall(900, () => {
      const player = this.actors.get('player');
      if (!player) return;
      this.scene.tweens.add({ targets: player, x: 350, alpha: 1, duration: 1100, ease: 'Sine.easeInOut',
        onComplete: () => this.nextLine() });
    });
  }

  private nextLine(): void {
    if (this.finished) return;
    this.index++;
    const line = this.cfg.lines[this.index];
    if (!line) { this.finish(); return; }
    const fieldActor = line.actor === 'thought'
      ? this.cfg.fieldActors?.player
      : this.cfg.fieldActors?.[line.actor];
    const actor = fieldActor ?? (line.actor === 'thought' ? this.actors.get('player') : this.actors.get(line.actor));
    if (line.actor === 'thought') {
      this.speech.setVisible(false); this.speechBg.setVisible(false);
    } else if (actor) {
      const point = fieldActor ? this.fieldScreenPoint(fieldActor) : this.actorPoint(actor);
      const x = Phaser.Math.Clamp(point.x, 170, GAME_WIDTH - 170);
      const y = Phaser.Math.Clamp(point.y - (fieldActor ? 72 : 128), 90, 330);
      this.speech.setText(line.text).setPosition(x, y).setVisible(true);
      this.speechBg.setSize(Math.min(340, Math.max(110, this.speech.width + 14)), this.speech.height + 8)
        .setPosition(x, y).setVisible(true);
    }
    this.dialogueSpeaker.setText(line.speaker);
    this.dialogueText.setText(line.text);
    if (line.actor === 'courier' && line.text.includes('명부')) this.showLedgerHandoff();
    if (line.actor === 'thought') {
      this.dialogueSpeaker.setColor('#f0bf6c');
    } else {
      this.dialogueSpeaker.setColor('#6ee7c8');
    }
    const duration = line.durationMs ?? Math.max(1200, Math.min(3600, 850 + line.text.length * 52));
    this.timer = this.scene.time.delayedCall(duration, () => this.nextLine());
  }

  private showLedgerHandoff(): void {
    const courier = this.actors.get('courier');
    const watcher = this.actors.get('watcher');
    if (!courier || !watcher) return;
    const ledger = this.scene.add.rectangle(courier.x - 25, courier.y - 54, 18, 25, 0xd4c18c, 1)
      .setAngle(-8).setStrokeStyle(1, 0x342d20, 1);
    if (this.cfg.fieldActors) this.fieldProps.push(ledger);
    else this.stage.add(ledger);
    this.scene.tweens.add({ targets: ledger, x: watcher.x + 10, duration: 800, ease: 'Sine.easeInOut',
      onComplete: () => { this.scene.tweens.add({ targets: ledger, alpha: 0, duration: 380, onComplete: () => ledger.destroy() }); },
    });
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.timer?.remove(false);
    this.speech.setVisible(false); this.speechBg.setVisible(false);
    this.scene.time.delayedCall(this.cfg.fieldActors ? 650 : 2200, () => {
      if (!this.active) return;
      this.cfg.onComplete();
      this.destroy();
    });
  }

  /** 월드 배우를 화면 고정 UI 좌표로 변환한다. 카메라가 움직여도 말풍선은 배우를 따라간다. */
  private fieldScreenPoint(actor: Phaser.GameObjects.GameObject): { x: number; y: number } {
    const a = actor as unknown as { x: number; y: number };
    const cam = this.scene.cameras.main;
    return {
      x: (a.x - cam.scrollX) * cam.zoom,
      y: (a.y - cam.scrollY) * cam.zoom,
    };
  }

  private actorPoint(actor: Phaser.GameObjects.GameObject): { x: number; y: number } {
    const a = actor as unknown as { x: number; y: number };
    return { x: a.x, y: a.y };
  }

  override destroy(fromScene?: boolean): void {
    this.timer?.remove(false);
    for (const prop of this.fieldProps) prop.destroy();
    this.fieldProps.length = 0;
    // 연출용 이동은 개인 화면에서만 유효하다. 종료하면 배우를 원래 필드 위치로 되돌린다.
    for (const [actor, origin] of this.fieldOrigins) {
      if (!actor.active) continue;
      const a = actor as Phaser.GameObjects.GameObject & { x: number; y: number; alpha: number };
      a.x = origin.x; a.y = origin.y; a.alpha = origin.alpha;
    }
    super.destroy(fromScene);
  }
}
