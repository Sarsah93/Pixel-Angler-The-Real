/**
 * @file CurePanel.ts
 * @description 285차 — 갈무리 창: 텃밭의 건조 걸대에 무청 · 옥수수수염을 걸어 말리고, 장독에 깻잎 · 콩잎을 담가 삭힌다.
 *
 * 사용자 말(원문): 「미룬 가공: 시래기 말리기 … · 미룬 부산물: 옥수수수염차, 콩잎, 깻잎 장아찌 … 다 반영하기」.
 * - 왼쪽 = 이 텃밭에 놓인 설비에서 할 수 있는 일(가방 재료 수). 오른쪽 = 고른 일의 방법 · 드는 것 · 걸리는 날 · 나오는 것 · 「걸기」.
 * - 아래 = 걸어 둔 것(남은 날 · 다 되면 「거두기」 · 방금 건 것은 「도로 걷기」 · 그 뒤는 「버리기」 — 되돌릴 수 없어 한 번 더 묻는다).
 * - 조작 안내 문구를 창에 쓰지 않는다(R11) — 처음 열 때 가이드(`tour.cure`)가 짚는다. 계산은 core `rules/HomeCure.ts`.
 * 규칙: DraggablePanel · 일반 팝업 밴드(800) · 목록이 짧아 윈도우드 렌더 대신 상한(걸어 둔 것 5줄 + 「n건 더」).
 */

import Phaser from 'phaser';
import { CURE_TUNING, CURE_STATION_LABEL, cureRecipe, cureLeftKo, type CureRecipeDef } from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { createItemIcon } from './ItemIcon.js';
import { playSfx } from '../audio/SfxBank.js';
import { CureQueue, type CureBatch } from '../store/CureQueue.js';
import {
  cureRecipesFor, cureBlockKo, cureInputStock, cureSlotsLeft, startCure, collectCure, cancelCure, cureUndoable, cureOutputTemplate, hasCureStation,
} from '../store/CureActions.js';

const PANEL_W = 600;
const PANEL_H = 500;
const LIST_W = 206;
const ROW_H = 40;
const RIGHT_X = 14 + LIST_W + 14;
const RIGHT_W = PANEL_W - RIGHT_X - 14;
const FONT = '"Noto Sans KR", sans-serif';
const PENDING_ROWS = 5;

export interface CurePanelCallbacks {
  onClose: () => void;
  /** 가방이 바뀌었다(필드 HUD · 가방 창 갱신) */
  onChanged?: () => void;
  /** 필드 로그 한 줄 */
  log?: (line: string) => void;
  /** 되돌릴 수 없는 행동 확인 창 */
  confirm?: (message: string, onYes: () => void, labels: { yes: string; no: string; danger?: boolean }) => void;
}

export class CurePanel extends DraggablePanel {
  private cbs: CurePanelCallbacks;
  private plotId: string;
  private content: Phaser.GameObjects.Container;
  private sel = '';
  private status = '';
  private statusOk = true;
  private ticker?: Phaser.Time.TimerEvent;
  private lastKey = '';
  private rectList = new Phaser.Geom.Rectangle();
  private rectRight = new Phaser.Geom.Rectangle();
  private rectGo = new Phaser.Geom.Rectangle();
  private rectPending = new Phaser.Geom.Rectangle();

  constructor(scene: Phaser.Scene, x: number, y: number, plotId: string, cbs: CurePanelCallbacks) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '갈무리', onClose: cbs.onClose, depth: 800 });
    this.cbs = cbs;
    this.plotId = plotId;
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    // 재료가 다 갖춰진 첫 일을 먼저 고른다
    const list = cureRecipesFor(plotId);
    this.sel = (list.find((r) => !cureBlockKo(plotId, r)) ?? list[0])?.id ?? '';
    this.render();
    // 남은 날 · 「다 됐다」를 2초마다(바뀐 것이 있을 때만 다시 그린다)
    this.ticker = scene.time.addEvent({ delay: 2000, loop: true, callback: () => this.refreshIfChanged() });
    maybeStartTour(scene, () => this.buildTour());
  }

  private stateKey(): string {
    const now = Date.now();
    return CureQueue.at(this.plotId).map((b) => `${b.id}:${cureLeftKo(b.readyAtMs, now)}:${cureUndoable(b, now) ? 'u' : ''}`).join(',')
      + `|${cureRecipesFor(this.plotId).map((r) => r.inputs.map(cureInputStock).join('/')).join(',')}`;
  }

  private refreshIfChanged(): void {
    if (!this.active) return;
    if (this.stateKey() !== this.lastKey) this.render();
  }

  private say(msg: string, ok: boolean): void {
    this.status = msg;
    this.statusOk = ok;
    playSfx(ok ? 'confirm' : 'deny');
  }

  private btn(x: number, y: number, w: number, h: number, label: string, on: boolean, run: () => void, tone: 'go' | 'plain' | 'warn' = 'plain'): void {
    const sc = this.scene;
    const fill = !on ? 0x2a3340 : tone === 'go' ? 0x1f5a3a : tone === 'warn' ? 0x5a2a2a : 0x1f3a5a;
    const line = !on ? 0x3a4a5a : tone === 'go' ? 0x4af2a1 : tone === 'warn' ? 0xff9a7a : 0x5cb0ff;
    const r = sc.add.rectangle(x, y, w, h, fill, 1).setOrigin(0, 0).setStrokeStyle(1, line, 1);
    const tx = sc.add.text(x + w / 2, y + h / 2, label, { fontFamily: FONT, fontSize: '12px', color: on ? '#eef8ff' : '#6a7a8a', fontStyle: 'bold' }).setOrigin(0.5);
    clampTextWidth(tx, w - 8);
    if (on) {
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => { run(); if (this.active) this.render(); restoreHandCursor(sc); });
    }
    this.content.add([r, tx]);
  }

  private render(): void {
    const sc = this.scene;
    this.content.removeAll(true);
    this.lastKey = this.stateKey();
    const top = this.contentTop + 4;
    const txt = (x: number, y: number, s: string, size = 12, color = '#e8f4fd', bold = false, wrap?: number): Phaser.GameObjects.Text => {
      const o = sc.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal', ...(wrap ? { wordWrap: { width: wrap } } : {}), lineSpacing: 2 });
      this.content.add(o);
      return o;
    };

    // ── 설비 자리 수 ──
    const seats: string[] = [];
    for (const st of ['rack', 'crock'] as const) {
      if (!hasCureStation(this.plotId, st)) continue;
      seats.push(`${CURE_STATION_LABEL[st].ko} ${CURE_TUNING.slots[st] - cureSlotsLeft(this.plotId, st)}/${CURE_TUNING.slots[st]}`);
    }
    const seatT = txt(14, top, seats.join(' · ') || '놓인 설비가 없다', 12, '#9fd5ff', true);
    clampTextWidth(seatT, PANEL_W - 28);

    // ── 왼쪽: 할 일 ──
    const list = cureRecipesFor(this.plotId);
    const listTop = top + 24;
    let y = listTop;
    for (const r of list) {
      const isSel = r.id === this.sel;
      const ready = !cureBlockKo(this.plotId, r);
      const bg = sc.add.rectangle(14, y, LIST_W, ROW_H - 4, isSel ? 0x1f4a6a : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, isSel ? 0x5cd0ff : 0x2a3a4a, 1);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { this.sel = r.id; this.status = ''; this.render(); restoreHandCursor(sc); });
      this.content.add(bg);
      const icon = createItemIcon(sc, 32, y + (ROW_H - 4) / 2, cureOutputTemplate(r.output.itemId) ?? { id: r.output.itemId, icon: '' }, 26);
      this.content.add(icon);
      const name = txt(52, y + 3, r.nameKo, 12, '#e8f4fd', true);
      clampTextWidth(name, LIST_W - 46);
      const main = r.inputs[0];
      const have = main ? cureInputStock(main) : 0;
      const sub = txt(52, y + 19, `${CURE_STATION_LABEL[r.station].ko} · 가방 ${have}`, 10, ready ? '#8affb0' : '#6a8aa0');
      clampTextWidth(sub, LIST_W - 46);
      y += ROW_H;
    }
    if (list.length === 0) { txt(22, y, '건조 걸대나 장독을 놓으면 여기서 건다', 11, '#8fa8bf', false, LIST_W - 16); y += 36; }
    this.rectList.setTo(14, listTop, LIST_W, Math.max(ROW_H, y - listTop));

    // ── 오른쪽: 고른 일 ──
    const r: CureRecipeDef | undefined = cureRecipe(this.sel);
    let ry = listTop;
    if (r) {
      const how = txt(RIGHT_X, ry, r.howKo, 11, '#a8c0d4', false, RIGHT_W);
      ry += how.height + 10;
      txt(RIGHT_X, ry, '드는 것', 11, '#8fa8bf');
      ry += 18;
      for (const inp of r.inputs) {
        const have = cureInputStock(inp);
        const v = txt(RIGHT_X + 10, ry, `${inp.nameKo}  —  가방 ${have}/${inp.qty}`, 12, have >= inp.qty ? '#e8f4fd' : '#ff9a7a', false, RIGHT_W - 14);
        ry += Math.max(18, v.height + 3);
      }
      ry += 4;
      const out = cureOutputTemplate(r.output.itemId);
      const lines: [string, string][] = [
        ['걸리는 날', `${Math.round(r.hours / 24)}일`],
        ['나오는 것', `${out?.name ?? r.output.itemId} ${r.output.qty}개`],
      ];
      for (const [k, val] of lines) {
        txt(RIGHT_X, ry, k, 11, '#8fa8bf');
        const v = txt(RIGHT_X + 76, ry, val, 12, '#e8f4fd', false, RIGHT_W - 80);
        ry += Math.max(18, v.height + 4);
      }
      ry += 6;
      const why = cureBlockKo(this.plotId, r);
      if (why) { const w = txt(RIGHT_X, ry, why, 11, '#ffb48a', false, RIGHT_W); ry += w.height + 6; }
      this.btn(RIGHT_X, ry, RIGHT_W, 30, r.station === 'rack' ? '걸기' : '담그기', !why, () => {
        const res = startCure(this.plotId, r.id);
        this.say(res.message, res.ok);
        if (res.ok) { playSfx('farm_dig'); this.cbs.log?.(`[갈무리] ${res.message}`); this.cbs.onChanged?.(); }
      }, 'go');
      this.rectGo.setTo(RIGHT_X, ry, RIGHT_W, 30);
      ry += 38;
    }
    this.rectRight.setTo(RIGHT_X - 4, listTop - 2, RIGHT_W + 8, ry - listTop);

    // ── 아래: 걸어 둔 것 ──
    const pTop = Math.max(y + 8, ry);
    txt(14, pTop, '걸어 둔 것', 12, '#9fd5ff', true);
    let py = pTop + 20;
    const now = Date.now();
    const mine = CureQueue.at(this.plotId);
    if (mine.length === 0) { txt(22, py, '없음', 11, '#6a7a8a'); py += 22; }
    for (const b of mine.slice(0, PENDING_ROWS)) { this.pendingRow(b, py, now); py += 30; }
    if (mine.length > PENDING_ROWS) { txt(22, py, `외 ${mine.length - PENDING_ROWS}건`, 11, '#8fa8bf'); py += 18; }
    this.rectPending.setTo(10, pTop - 2, PANEL_W - 20, py - pTop + 4);

    if (this.status) {
      const st = txt(PANEL_W / 2, PANEL_H - 24, this.status, 11, this.statusOk ? '#8affb0' : '#ff9a7a', false, PANEL_W - 40).setOrigin(0.5, 0.5);
      st.setAlign('center');
    }
    enforceTextBounds(this.content, PANEL_W - 10, 'CurePanel');
    this.applyFix();
  }

  private pendingRow(b: CureBatch, y: number, now: number): void {
    const sc = this.scene;
    const r = cureRecipe(b.recipeId);
    const ready = b.readyAtMs <= now;
    const bg = sc.add.rectangle(14, y, PANEL_W - 28, 26, ready ? 0x173a26 : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, ready ? 0x4af2a1 : 0x2a3a4a, 1);
    this.content.add(bg);
    const name = sc.add.text(22, y + 5, `${CURE_STATION_LABEL[b.station].ko} — ${r?.nameKo ?? ''}`, { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd' });
    clampTextWidth(name, PANEL_W - 28 - 240);
    this.content.add(name);
    const left = cureLeftKo(b.readyAtMs, now);
    const state = sc.add.text(PANEL_W - 128, y + 5, ready ? '다 됐다' : `${left} 남음`, { fontFamily: FONT, fontSize: '11px', color: ready ? '#8affb0' : '#ffe28a' }).setOrigin(1, 0);
    this.content.add(state);
    if (ready) {
      this.btn(PANEL_W - 118, y + 1, 96, 24, '거두기', true, () => {
        const res = collectCure(b.id);
        this.say(res.message, res.ok);
        if (res.ok) { this.cbs.log?.(`[갈무리] ${res.message}`); this.cbs.onChanged?.(); }
      }, 'go');
    } else if (cureUndoable(b, now)) {
      this.btn(PANEL_W - 118, y + 1, 96, 24, '도로 걷기', true, () => {
        const res = cancelCure(b.id);
        this.say(res.message, res.ok);
        if (res.ok) this.cbs.onChanged?.();
      });
    } else {
      this.btn(PANEL_W - 118, y + 1, 96, 24, '버리기', true, () => {
        const run = (): void => {
          const res = cancelCure(b.id);
          this.say(res.message, res.ok);
          if (res.ok) this.cbs.onChanged?.();
          if (this.active) this.render();
        };
        if (this.cbs.confirm) this.cbs.confirm(`${r?.nameKo ?? ''}\n다 되기 전에 걷어 버린다. 되돌릴 수 없다.`, run, { yes: '버리기', no: '취소', danger: true });
        else run();
      }, 'warn');
    }
  }

  /** 패널 안 사각형 → 화면 좌표 */
  private screen(r: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x + r.x, this.y + r.y, r.width, r.height);
  }

  private buildTour(): TourOptions {
    return {
      id: 'cure',
      anchor: () => this.screen(new Phaser.Geom.Rectangle(0, 0, PANEL_W, PANEL_H)),
      alive: () => this.active,
      steps: [
        {
          text: '갈무리다. 건조 걸대에는 무청을 엮어 걸어 시래기로 말리고, 옥수수수염을 말려 덖는다. 장독에는 깻잎 · 콩잎을 담가 장아찌로 삭힌다.',
          target: () => this.screen(new Phaser.Geom.Rectangle(0, 0, PANEL_W, PANEL_H)),
        },
        {
          text: '왼쪽에서 할 일을 고른다. 이 텃밭에 놓인 설비에서 할 수 있는 것만 나온다 — 재료가 다 있으면 초록 글씨다.',
          target: () => this.screen(this.rectList),
        },
        {
          text: '드는 것 · 걸리는 날 · 나오는 것을 미리 본다. 날은 실제 날짜로 센다 — 게임을 꺼 둔 사이에도 마른다.',
          target: () => this.screen(this.rectRight),
        },
        {
          text: '걸어 둔 것은 여기에 남는다. 다 되면 거둔다. 방금 건 것은 도로 걷을 수 있다.',
          target: () => this.screen(this.rectPending),
        },
      ],
    };
  }

  override destroy(fromScene?: boolean): void {
    this.ticker?.remove(false);
    this.ticker = undefined;
    super.destroy(fromScene);
  }
}
