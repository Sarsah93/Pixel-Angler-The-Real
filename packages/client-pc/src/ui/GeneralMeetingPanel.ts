/**
 * @file GeneralMeetingPanel.ts
 * @description 어촌계 총회 연출 (147차) — M1-11 「총회」의 표결 장면
 *
 * 나레이션(`StoryNarrative` M1-11)이 이미 "손을 든 사람이 몇인지 세지 못했다"고 적고 있다.
 * 이 패널은 그 장면을 눈으로 보여 준다 — 계장이 안건을 읽고, 참석자가 한 명씩 손을 들고,
 * 집계가 끝나면 이름이 불린다.
 *
 * ⚠ **부결은 없다.** 진행이 막히는 무작위를 만들지 않는다(138차 설계 원칙 §3).
 *   항구 평판은 **찬성률**로만 드러나고, 과반 초과분이 신뢰 보너스가 되어
 *   이후 위판 수수료로 이어진다(평판 소비처 ①②가 여기서 만난다).
 *
 * 진행 틱은 `scene.events.on('update')` — `scene.time` 타이머는 헤드리스에서 발화하지 않는다(128차).
 */

import Phaser from 'phaser';
import { DraggablePanel } from './DraggablePanel.js';
import { StoryStore } from '../store/StoryStore.js';

const PANEL_W = 540;
const PANEL_H = 400;
/** 손 드는 간격 (초) */
const HAND_INTERVAL = 0.09;

export interface GeneralMeetingCallbacks {
  /** 표결이 끝나고 [이름을 듣는다]를 누르면 — 씬이 이어서 대화창을 연다 */
  onDone: (repGain: number) => void;
  onClose: () => void;
}

export class GeneralMeetingPanel extends DraggablePanel {
  private cbs: GeneralMeetingCallbacks;
  private vote = StoryStore.meetingVote();

  private seatsG!: Phaser.GameObjects.Graphics;
  private tallyText!: Phaser.GameObjects.Text;
  private lineText!: Phaser.GameObjects.Text;
  private shown = 0;
  private elapsed = 0;
  private finished = false;
  private updateHandler: (t: number, dt: number) => void;

  constructor(scene: Phaser.Scene, cbs: GeneralMeetingCallbacks) {
    super(scene, {
      x: (scene.scale.width - PANEL_W) / 2, y: (scene.scale.height - PANEL_H) / 2,
      width: PANEL_W, height: PANEL_H, title: '어촌계 총회', onClose: cbs.onClose,
      depth: 930, dim: true, hideClose: true,
    });
    this.cbs = cbs;

    const t = this.contentTop;
    const agenda = scene.add.text(16, t + 4,
      '안건 — 예비계원의 정계원 승격 건', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4ff', fontStyle: 'bold',
      });
    this.add(agenda);

    const sub = scene.add.text(16, t + 24,
      '계장이 서류 네 장을 확인하고 이름을 읽는다. 찬성하시는 분은 손을 들어 주십시오.', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
        wordWrap: { width: PANEL_W - 32 },
      });
    this.add(sub);

    this.seatsG = scene.add.graphics();
    this.add(this.seatsG);

    this.tallyText = scene.add.text(PANEL_W / 2, t + 196, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.tallyText);

    this.lineText = scene.add.text(PANEL_W / 2, PANEL_H - 96, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
      wordWrap: { width: PANEL_W - 48 }, align: 'center',
    }).setOrigin(0.5);
    this.add(this.lineText);

    this.updateHandler = (_t: number, dt: number): void => this.tick(dt / 1000);
    scene.events.on('update', this.updateHandler);

    this.drawSeats();
    this.applyFix();
  }

  private tick(dtSec: number): void {
    if (this.finished || !this.scene) return;
    this.elapsed += dtSec;
    const want = Math.min(this.vote.yes, Math.floor(this.elapsed / HAND_INTERVAL));
    if (want !== this.shown) {
      this.shown = want;
      this.drawSeats();
    }
    if (this.shown >= this.vote.yes) this.finish();
  }

  /** 좌석 격자 — 손을 든 사람은 채워진 원, 아직인 사람은 빈 원 */
  private drawSeats(): void {
    const g = this.seatsG;
    g.clear();
    const cols = 8, cell = 40;
    const x0 = (PANEL_W - cols * cell) / 2 + cell / 2;
    const y0 = this.contentTop + 66;
    for (let i = 0; i < this.vote.total; i++) {
      const cx = x0 + (i % cols) * cell;
      const cy = y0 + Math.floor(i / cols) * 34;
      const raised = i < this.shown;
      g.fillStyle(raised ? 0x4af2a1 : 0x1f3d5a, raised ? 0.95 : 0.7);
      g.fillCircle(cx, cy, 8);
      if (raised) {
        // 든 손 — 머리 위로 뻗은 짧은 막대
        g.fillStyle(0x4af2a1, 0.95);
        g.fillRect(cx - 1.5, cy - 18, 3, 9);
      }
    }
    this.tallyText.setText(`찬성 ${this.shown} / ${this.vote.total}`);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.scene.events.off('update', this.updateHandler);

    const pct = Math.round(this.vote.ratio * 100);
    this.tallyText.setText(`찬성 ${this.vote.yes} / ${this.vote.total}  (${pct}%)`);
    this.tallyText.setColor('#4af2a1');
    this.lineText.setText(
      `가결되었습니다. ${this.vote.repGain > 0
        ? `과반을 크게 넘겼습니다 — 항구 신뢰 +${this.vote.repGain}`
        : '간신히 과반입니다. 이름값은 이제부터 만드는 것입니다.'}`,
    );
    this.addButton(PANEL_W / 2, PANEL_H - 44, '이름을 듣는다', () => {
      this.cbs.onDone(this.vote.repGain);
      this.requestClose();
    });
    this.applyFix();
  }

  private addButton(cx: number, cy: number, label: string, onClick: () => void): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0d4a2e, 0.95);
    bg.fillRoundedRect(cx - 100, cy - 18, 200, 36, 5);
    bg.lineStyle(2, 0x4af2a1, 0.95);
    bg.strokeRoundedRect(cx - 100, cy - 18, 200, 36, 5);
    const txt = this.scene.add.text(cx, cy, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(cx, cy, 200, 36, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => txt.setColor('#ffffff'));
    hit.on('pointerout', () => txt.setColor('#4af2a1'));
    hit.on('pointerdown', onClick);
    this.add([bg, txt, hit]);
  }

  /** 표결 중에는 ESC로 못 나간다 — 총회장을 도중에 떠날 수는 없다 */
  onEscIntercept(): boolean { return !this.finished; }

  /** dev·검증용 — 표결 즉시 종료 */
  devFinish(): void { this.shown = this.vote.yes; this.drawSeats(); this.finish(); }

  override destroy(fromScene?: boolean): void {
    this.scene?.events?.off('update', this.updateHandler);
    super.destroy(fromScene);
  }
}
