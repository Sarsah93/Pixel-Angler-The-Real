/**
 * @file MultiplayerLobbyScene.ts
 * @description 멀티플레이 로비 — 세션 열기 · 코드로 참가 (143차 신설)
 *
 * 순서는 **세션이 먼저**다. 방을 잡고 들어온 뒤에야 저장 슬롯 3칸이 보이고,
 * 슬롯을 고르면 캐릭터를 새로 만든다. 캐릭터 이름은 그 세션 안에서 유일해야 하므로
 * 중복 검사는 캐릭터 만들기의 마지막 단추에서 한다(여기서는 방까지만).
 *
 * 화면 문법은 게임의 다른 창과 같은 `paintHudPanel` — 별도 스타일을 만들지 않는다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { paintHudPanel, paintHudSlot } from '../ui/HudPanelStyle.js';
import { MultiplayerClient } from '../net/MultiplayerClient.js';
import { SESSION_CODE_LEN } from '@tra/core';

const FONT = '"Noto Sans KR", sans-serif';
const COL = { text: '#d0e8f5', dim: '#8fa6bd', accent: '#ffe9a0', ok: '#7fe0b0', warn: '#ff8a7a' };

type Field = 'server' | 'code';

export class MultiplayerLobbyScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private serverText!: Phaser.GameObjects.Text;
  private codeText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private enterBtn!: { g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text; hit: Phaser.GameObjects.Rectangle };
  private editing: Field | null = null;
  private serverBuf = '';
  private codeBuf = '';
  private busy = false;
  private ready = false;

  constructor() { super({ key: 'MultiplayerLobbyScene' }); }

  create(): void {
    this.editing = null;
    this.busy = false;
    this.ready = false;
    this.serverBuf = MultiplayerClient.server;
    this.codeBuf = MultiplayerClient.code;

    this.cameras.main.setBackgroundColor('#050a12');
    const g = this.add.graphics();
    paintHudPanel(g, 300, 120, 680, 470, { headerH: 30 });

    this.add.text(320, 128, '여럿이 하기', { fontFamily: FONT, fontSize: '16px', color: '#4af2a1', fontStyle: 'bold' });
    this.add.text(340, 176,
      '한 사람이 방을 열고 코드를 알려주면, 같은 코드로 들어온 사람들이 같은 바다에서 놉니다.\n같은 지역에 있으면 서로의 이름이 머리 위에 보입니다.', {
        fontFamily: FONT, fontSize: '12px', color: COL.dim, lineSpacing: 4, wordWrap: { width: 600 },
      });

    this.row('서버 주소', 240, () => this.serverBuf || '(비어 있음)', 'server');
    this.row('세션 코드', 292, () => this.codeBuf || '(없음)', 'code');

    this.button(340, 348, 180, 40, '방 열기', () => void this.onCreate());
    this.button(540, 348, 180, 40, '코드로 참가', () => void this.onJoin());
    this.button(740, 348, 180, 40, '뒤로', () => this.back());

    this.infoText = this.add.text(340, 404, '', { fontFamily: FONT, fontSize: '12px', color: COL.text, wordWrap: { width: 600 } });
    this.statusText = this.add.text(340, 432, '방을 열거나, 받은 코드로 참가하세요.', {
      fontFamily: FONT, fontSize: '12px', color: COL.dim, wordWrap: { width: 600 },
    });

    this.enterBtn = this.button(340, 494, 580, 46, '이 방으로 들어가기', () => this.enter());
    this.setEnterEnabled(false);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 42,
      '칸을 눌러 직접 입력합니다 · Enter 확정 · ESC 뒤로', {
        fontFamily: FONT, fontSize: '11px', color: '#4e6678',
      }).setOrigin(0.5, 0);

    this.input.keyboard?.on('keydown', this.onKey, this);
    this.events.once('shutdown', () => this.input.keyboard?.off('keydown', this.onKey, this));
    this.cameras.main.fadeIn(200, 0, 8, 18);

    if (MultiplayerClient.code) {
      this.ready = true;
      this.setEnterEnabled(true);
      this.infoText.setText(`이전에 들어갔던 방: ${MultiplayerClient.code}`);
    }
  }

  // ── 부품 ──────────────────────────────────────────
  private row(label: string, y: number, value: () => string, field: Field): void {
    this.add.text(340, y + 10, label, { fontFamily: FONT, fontSize: '13px', color: COL.text });
    const g = this.add.graphics();
    paintHudSlot(g, 660, y + 18, 440, 34, false);
    const t = this.add.text(660, y + 18, value(), { fontFamily: FONT, fontSize: '13px', color: COL.accent }).setOrigin(0.5);
    if (field === 'server') this.serverText = t; else this.codeText = t;
    this.add.rectangle(660, y + 18, 440, 34, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startEdit(field));
  }

  private button(
    x: number, y: number, w: number, h: number, label: string, onClick: () => void,
  ): { g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text; hit: Phaser.GameObjects.Rectangle } {
    const g = this.add.graphics();
    paintHudSlot(g, x + w / 2, y + h / 2, w, h, false);
    const t = this.add.text(x + w / 2, y + h / 2, label, { fontFamily: FONT, fontSize: '14px', color: COL.text }).setOrigin(0.5);
    const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => t.setColor('#4af2a1'));
    hit.on('pointerout', () => t.setColor(COL.text));
    hit.on('pointerdown', () => { if (!this.busy) onClick(); });
    return { g, t, hit };
  }

  private setEnterEnabled(on: boolean): void {
    this.enterBtn.t.setColor(on ? COL.ok : '#4a5a68');
    this.enterBtn.hit.setInteractive({ useHandCursor: on });
    this.enterBtn.hit.input!.enabled = on;
  }

  // ── 입력 ──────────────────────────────────────────
  private startEdit(field: Field): void {
    this.editing = field;
    this.statusText.setText(field === 'server'
      ? '서버 주소를 입력하세요. 같은 컴퓨터에서 서버를 켰다면 http://localhost:4000 입니다.'
      : `받은 코드 ${SESSION_CODE_LEN}자를 입력하세요.`);
    this.refresh();
  }

  private onKey(ev: KeyboardEvent): void {
    if (ev.code === 'Escape') {
      if (this.editing) { this.editing = null; this.refresh(); }
      else this.back();
      return;
    }
    if (!this.editing) return;
    ev.preventDefault();
    const isServer = this.editing === 'server';
    if (ev.code === 'Enter') {
      if (isServer) MultiplayerClient.setServer(this.serverBuf);
      this.editing = null;
      this.refresh();
      return;
    }
    if (ev.code === 'Backspace') {
      if (isServer) this.serverBuf = this.serverBuf.slice(0, -1);
      else this.codeBuf = this.codeBuf.slice(0, -1);
      this.refresh();
      return;
    }
    if (ev.key.length !== 1) return;
    if (isServer) {
      if (this.serverBuf.length < 64) this.serverBuf += ev.key;
    } else if (this.codeBuf.length < SESSION_CODE_LEN) {
      this.codeBuf += ev.key.toUpperCase();
    }
    this.refresh();
  }

  private refresh(): void {
    this.serverText.setText((this.serverBuf || '(비어 있음)') + (this.editing === 'server' ? '_' : ''));
    this.codeText.setText((this.codeBuf || '(없음)') + (this.editing === 'code' ? '_' : ''));
  }

  // ── 동작 ──────────────────────────────────────────
  private async onCreate(): Promise<void> {
    this.busy = true;
    MultiplayerClient.setServer(this.serverBuf);
    this.statusText.setText('방을 여는 중…').setColor(COL.dim);
    const res = await MultiplayerClient.createSession();
    this.busy = false;
    if (!res.ok || !res.code) {
      this.statusText.setText(res.reasonKo ?? '방을 열지 못했습니다.').setColor(COL.warn);
      return;
    }
    this.codeBuf = res.code;
    this.refresh();
    this.ready = true;
    this.setEnterEnabled(true);
    this.infoText.setText(`방 코드 ${res.code} — 같이 놀 사람에게 이 코드를 알려주세요.`).setColor(COL.accent);
    this.statusText.setText('준비됐습니다. 아래에서 들어가세요.').setColor(COL.ok);
  }

  private async onJoin(): Promise<void> {
    if (this.codeBuf.trim().length === 0) {
      this.statusText.setText('코드를 먼저 입력하세요.').setColor(COL.warn);
      return;
    }
    this.busy = true;
    MultiplayerClient.setServer(this.serverBuf);
    this.statusText.setText('방을 찾는 중…').setColor(COL.dim);
    const res = await MultiplayerClient.joinSession(this.codeBuf);
    this.busy = false;
    if (!res.ok) {
      this.ready = false;
      this.setEnterEnabled(false);
      this.statusText.setText(res.reasonKo ?? '방을 찾지 못했습니다.').setColor(COL.warn);
      return;
    }
    this.ready = true;
    this.setEnterEnabled(true);
    const names = (res.names ?? []).join(' · ');
    this.infoText.setText(`${res.code} — 지금 ${res.playerCount ?? 0}명${names ? ` (${names})` : ''}`).setColor(COL.accent);
    this.statusText.setText('준비됐습니다. 아래에서 들어가세요.').setColor(COL.ok);
  }

  private enter(): void {
    if (!this.ready) return;
    this.cameras.main.fadeOut(200, 1, 8, 18);
    this.time.delayedCall(240, () => this.scene.start('MainMenuScene', { gotoSlots: true }));
  }

  private back(): void {
    MultiplayerClient.leave();
    this.cameras.main.fadeOut(200, 1, 8, 18);
    this.time.delayedCall(240, () => this.scene.start('MainMenuScene'));
  }
}
