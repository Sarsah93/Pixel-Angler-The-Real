/**
 * @file MonologuePanel.ts
 * @description 혼잣말 대화창 (150차 — 사용자 지시 "처음 홈타운에서 시작할 때 혼잣말로 서사를 전개").
 *
 * 상대가 없는 대화다. `DialoguePanel`과 같은 문법을 쓰되(AGENTS §4 R3) 우호도·선택지가 없고,
 * 초상은 **주인공 얼굴**이다.
 *  - 좌→우 타이핑 · 넘치면 앞 줄이 위로 밀린다 · 단락 끝에 흰 역삼각형(▼)
 *  - **한 창에 다 넣지 않는다**(사용자 지시) — 단락을 끊어 한 번에 하나씩 읽힌다
 *  - 아무 데나 클릭 / Enter / Space = 다음. 마지막 단락 뒤에 닫는다.
 */

import Phaser from 'phaser';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { GameState } from '../store/GameState.js';
import { ensureFacePortrait } from './CharacterSprite.js';
import { characterLook } from '../data/EquipOutfit.js';
import { applyPortraitMask, type PortraitMaskHandle } from './PortraitMask.js';
import { PORTRAIT_LAYOUT } from './PortraitLayout.js';

const W = 1040;
const H = 300;
const FONT = '"Noto Sans KR", sans-serif';
/** 혼잣말 전용 32×32 초상을 5배 nearest로 표시한다. */
const FACE_SCALE = 10;
const FACE_PX = 32 * Math.round((16 * FACE_SCALE) / 32);
const PORTRAIT_W = FACE_PX + 48;
const PORTRAIT_FRAME_W = PORTRAIT_W - PORTRAIT_LAYOUT.frameSideInset;
const PORTRAIT_FRAME_H = FACE_PX + 20;
const TEXT_X = PORTRAIT_W + 12;
const TEXT_W = W - TEXT_X - 22;
const BODY_PX = 20;
const LOG_H = 152;
const TYPE_MS = 22;

export class MonologuePanel extends DraggablePanel {
  /** 검증 하네스용 */
  get logLength(): number { return this.logText?.text.length ?? 0; }
  private readonly onDone: () => void;

  private logDone = '';
  private typingPara = '';
  private typed = 0;
  private queue: string[];
  private typeTimer?: Phaser.Time.TimerEvent;
  private logText?: Phaser.GameObjects.Text;
  private logInner?: Phaser.GameObjects.Container;
  private logMask?: Phaser.GameObjects.Graphics;
  private portraitMask?: PortraitMaskHandle;
  private caret?: Phaser.GameObjects.Graphics;
  private caretTween?: Phaser.Tweens.Tween;
  private hintText?: Phaser.GameObjects.Text;
  private lastX = NaN; private lastY = NaN;
  private readonly postUpdate: () => void;
  private readonly keyHandler: (ev: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene, paras: string[], onDone: () => void, title = '혼잣말') {
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: GAME_HEIGHT - H - 24,
      width: W, height: H, title, onClose: onDone, dim: true, depth: 942, hideClose: true,
    });
    this.onDone = onDone;
    this.queue = paras.filter((p) => p.trim().length > 0);

    this.keyHandler = (ev: KeyboardEvent) => {
      if (ev.code === 'Enter' || ev.code === 'Space' || ev.code === 'Escape') { ev.preventDefault(); this.advance(); }
    };
    scene.input.keyboard?.on('keydown', this.keyHandler);
    this.postUpdate = () => {
      if (this.x !== this.lastX || this.y !== this.lastY) {
        this.syncMask();
        this.portraitMask?.sync();
      }
    };
    scene.events.on('postupdate', this.postUpdate);

    this.buildFrame();
    this.startNextPara();
  }

  override destroy(fromScene?: boolean): void {
    this.typeTimer?.remove();
    this.caretTween?.stop();
    this.scene?.input?.keyboard?.off('keydown', this.keyHandler);
    this.scene?.events?.off('postupdate', this.postUpdate);
    this.logMask?.destroy();
    this.portraitMask?.destroy();
    super.destroy(fromScene);
  }

  /** 지금 단락을 즉시 완성 → 다음 단락 → 다 읽었으면 닫는다 */
  private advance(): void {
    if (this.typed < this.typingPara.length) { this.typed = this.typingPara.length; this.paintLog(); this.afterPara(); return; }
    if (this.queue.length > 0) {
      this.logDone += (this.logDone ? '\n\n' : '') + this.typingPara;
      this.typingPara = ''; this.typed = 0;
      this.startNextPara();
      return;
    }
    this.onDone();
  }

  private buildFrame(): void {
    const c = this.scene.add.container(0, this.contentTop);
    this.add(c);

    // 주인공 얼굴
    const g = this.scene.add.graphics();
    const boxX = PORTRAIT_LAYOUT.outerInset, boxY = 4;
    const boxW = PORTRAIT_W - PORTRAIT_LAYOUT.outerInset * 2;
    const boxH = this.panelH - this.contentTop - 12;
    g.fillStyle(0x08121c, 0.96); g.fillRoundedRect(boxX, boxY, boxW, boxH, 12);
    g.lineStyle(2, 0x356b8f, 0.9); g.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);
    g.lineStyle(1, 0x18344c, 1); g.strokeRoundedRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10, 9);
    // 구성 순서: 초상화 프레임 → 호감도 예약 슬롯 → 이름 슬롯.
    // 혼잣말은 상대가 없으므로 호감도 텍스트는 비워 두되, NPC 대화와
    // 동일한 기본 구조를 유지해 두 화면의 이름 위치가 달라지지 않게 한다.
    const nameGap = PORTRAIT_LAYOUT.nameGap;
    const nameH = PORTRAIT_LAYOUT.nameHeight;
    const affinitySlotH = PORTRAIT_LAYOUT.affinityReservedHeight;
    const stackH = PORTRAIT_FRAME_H + affinitySlotH + nameGap + nameH;
    const top = boxY + Math.max(6, Math.floor((boxH - stackH) / 2));
    const frameX = PORTRAIT_W / 2 - PORTRAIT_FRAME_W / 2;
    g.fillStyle(0x12263a, 1); g.fillRoundedRect(frameX, top, PORTRAIT_FRAME_W, PORTRAIT_FRAME_H, PORTRAIT_LAYOUT.frameRadius);
    g.lineStyle(2, 0x6b9fbc, 0.95); g.strokeRoundedRect(frameX, top, PORTRAIT_FRAME_W, PORTRAIT_FRAME_H, PORTRAIT_LAYOUT.frameRadius);
    c.add(g);
    const key = ensureFacePortrait(this.scene, characterLook(), FACE_SCALE);
    // 32×32 초상 전체(얼굴·목·어깨)를 프레임 안에 넣고 상하 여백을 확보한다.
    const imageSize = Math.min(FACE_PX, PORTRAIT_FRAME_H - 16);
    const imageTop = top + Math.floor((PORTRAIT_FRAME_H - imageSize) / 2);
    const portrait = this.scene.add.image(PORTRAIT_W / 2, imageTop, key)
      .setOrigin(0.5, 0).setDisplaySize(imageSize, imageSize);
    this.portraitMask = applyPortraitMask(this.scene, c, portrait, {
      x: frameX + 3,
      y: top + 3,
      width: PORTRAIT_FRAME_W - 6,
      height: PORTRAIT_FRAME_H - 6,
      radius: 6,
    });
    c.add(portrait);

    // 사용자 캐릭터 이름은 기존 호감도 텍스트와 분리된 독립 슬롯에 표시한다.
    const nameY = top + PORTRAIT_FRAME_H + affinitySlotH + nameGap;
    const nameX = PORTRAIT_W / 2 - (PORTRAIT_FRAME_W - 8) / 2;
    const nameW = PORTRAIT_FRAME_W - 8;
    g.fillStyle(0x08121c, 0.96); g.fillRoundedRect(nameX, nameY, nameW, nameH, 5);
    g.lineStyle(1, 0x356b8f, 0.9); g.strokeRoundedRect(nameX, nameY, nameW, nameH, 5);
    const nm = this.scene.add.text(PORTRAIT_W / 2, nameY + nameH / 2, GameState.player.nickname || '나', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9a0', fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add(nm);

    // 대사 박스
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x08121c, 0.82); bg.fillRect(TEXT_X - 8, 4, TEXT_W + 16, LOG_H + 12);
    bg.lineStyle(1, 0x2c5878, 0.9); bg.strokeRect(TEXT_X - 8, 4, TEXT_W + 16, LOG_H + 12);
    c.add(bg);

    const inner = this.scene.add.container(0, 0);
    this.logInner = inner; c.add(inner);
    this.logText = this.scene.add.text(TEXT_X, 10, '', {
      fontFamily: FONT, fontSize: `${BODY_PX}px`, color: '#d6c9a8',
      lineSpacing: 7, wordWrap: { width: TEXT_W, useAdvancedWrap: true },
    });
    inner.add(this.logText);

    const maskG = this.scene.make.graphics({}, false).setScrollFactor(0);
    this.logMask = maskG;
    inner.setMask(maskG.createGeometryMask());
    this.lastX = NaN; this.syncMask();

    const car = this.scene.add.graphics();
    car.fillStyle(0xffffff, 1);
    car.fillTriangle(-7, -4, 7, -4, 0, 6);
    car.setPosition(TEXT_X + TEXT_W - 6, LOG_H + 2).setVisible(false);
    this.caret = car; c.add(car);

    this.hintText = this.scene.add.text(TEXT_X + TEXT_W / 2, LOG_H + 34, '', {
      fontFamily: FONT, fontSize: '12px', color: '#7f95aa',
    }).setOrigin(0.5, 0.5);
    c.add(this.hintText);

    const plate = this.scene.add.rectangle(W / 2, (this.panelH - this.contentTop) / 2, W, this.panelH - this.contentTop, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    plate.on('pointerdown', () => this.advance());
    c.add(plate);
    applyScreenFixed(this);
  }

  private syncMask(): void {
    const g = this.logMask;
    if (!g) return;
    this.lastX = this.x; this.lastY = this.y;
    g.clear(); g.fillStyle(0xffffff, 1);
    g.fillRect(this.x + TEXT_X - 6, this.y + this.contentTop + 6, TEXT_W + 12, LOG_H + 8);
  }

  private startNextPara(): void {
    this.typeTimer?.remove(); this.typeTimer = undefined;
    const next = this.queue.shift();
    if (next === undefined) { this.afterPara(); return; }
    this.typingPara = next; this.typed = 0;
    this.paintLog();
    this.typeTimer = this.scene.time.addEvent({
      delay: TYPE_MS, loop: true,
      callback: () => {
        this.typed = Math.min(this.typingPara.length, this.typed + 1);
        this.paintLog();
        if (this.typed >= this.typingPara.length) {
          this.typeTimer?.remove(); this.typeTimer = undefined;
          this.afterPara();
        }
      },
    });
  }

  private afterPara(): void {
    const more = this.queue.length > 0;
    this.showCaret(true);
    this.hintText?.setText(more ? '클릭 또는 Enter — 계속' : '클릭 또는 Enter — 닫기');
  }

  private paintLog(): void {
    const t = this.logText;
    if (!t) return;
    const head = this.logDone ? `${this.logDone}\n\n` : '';
    t.setText(head + this.typingPara.slice(0, this.typed));
    const over = Math.max(0, t.height - LOG_H);
    this.logInner?.setY(-over);
    if (this.typed < this.typingPara.length) { this.showCaret(false); this.hintText?.setText(''); }
  }

  private showCaret(on: boolean): void {
    this.caretTween?.stop(); this.caretTween = undefined;
    this.caret?.setVisible(on).setAlpha(1);
    if (!on || !this.caret) return;
    this.caretTween = this.scene.tweens.add({
      targets: this.caret, alpha: 0.15, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}

/**
 * 오프닝 — 캐릭터를 만들고 홈타운에서 처음 눈을 뜨는 장면 (150차).
 * 한 창에 몰지 않는다(사용자 지시) — 단락을 끊어 한 번에 한 생각씩 지나간다.
 */
export const OPENING_MONOLOGUE: string[] = [
  '눈을 떴다. 천장 무늬가 낯설다. 이 집에서 잔 게 몇 해 만인지 세어 보다가 그만뒀다.',
  '아버지가 쓰던 방이다. 장례를 치르고는 한 번도 들어오지 않았는데, 이제 갈 데가 여기밖에 없다.',
  '책상 위에 가족사진이 엎어져 있었다. 뒤집어 보니 뒤에 연필로 글자 두 개가 눌러 적혀 있다.\n영금정.',
  '아버지 글씨다. 언제 적은 건지, 왜 적었는지는 모르겠다. 물어볼 사람도 이제 없다.',
  '배낭 하나, 아버지가 쓰던 릴대 하나. 세어 보니 가진 게 그게 전부다.',
  '속초행 막차는 밤에 한 대뿐이라고 했다.\n일단 나가 보자. 여기 앉아 있어 봐야 아무것도 안 바뀐다.',
];
