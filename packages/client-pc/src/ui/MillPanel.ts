/**
 * @file MillPanel.ts
 * @description 284차 — 방앗간 압착기 창: 참기름 · 들기름 짜기(180ml · 350ml 병) · 들깨 갈기 · 참깨 볶기를 맡기고, 다 되면 찾는다.
 *
 * 사용자 결정(2026-10-28): 「방앗간 가게로 하고 병은 180ml · 350ml 두 가지로」.
 * - 왼쪽 = 일 넷(가방에 든 깨 g). 오른쪽 = 병 수(기름) 또는 g(갈기 · 볶기) · 견적(드는 깨 · 나오는 것 · 공임 · 찾는 때) · 「맡기기」.
 * - 아래 = 맡겨 둔 것(남은 분 · 「찾기」 · 다 되기 전 「무르기」).
 * - 조작 안내 문구를 창에 쓰지 않는다(R11) — 처음 열 때 가이드(`tour.mill`)가 짚는다. 계산은 core `rules/OilMill.ts`.
 * 규칙: DraggablePanel · 일반 팝업 밴드(800) · 목록이 짧아 윈도우드 렌더 대신 상한(맡긴 것 4줄 + 「n건 더」).
 */

import Phaser from 'phaser';
import { MILL_SERVICES, MILL_TUNING, OIL_BOTTLE_SIZES, maxBottles, type MillServiceId, type OilBottleMl } from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { playSfx } from '../audio/SfxBank.js';
import { GameState } from '../store/GameState.js';
import { MillQueue, type MillOrder } from '../store/MillQueue.js';
import {
  seedStockG, millQuoteOf, millOutputTemplate, placeMillOrder, collectMillOrder, cancelMillOrder,
} from '../store/MillActions.js';
import { gramsText } from './QtyLabel.js';

const PANEL_W = 600;
const PANEL_H = 470;
const LIST_W = 196;
const ROW_H = 44;
const RIGHT_X = 14 + LIST_W + 14;
const RIGHT_W = PANEL_W - RIGHT_X - 14;
const FONT = '"Noto Sans KR", sans-serif';
const PENDING_ROWS = 4;

export interface MillPanelCallbacks {
  onClose: () => void;
  /** 가방 · 돈이 바뀌었다(필드 HUD · 가방 창 갱신) */
  onChanged?: () => void;
  /** 필드 로그 한 줄 */
  log?: (line: string) => void;
}

export class MillPanel extends DraggablePanel {
  private cbs: MillPanelCallbacks;
  private shopName: string;
  private content: Phaser.GameObjects.Container;
  private sel: MillServiceId = 'sesame_oil';
  private bottles: Record<OilBottleMl, number> = { 180: 0, 350: 1 };
  private grams = 500;
  private status = '';
  private statusOk = true;
  private ticker?: Phaser.Time.TimerEvent;
  private lastKey = '';
  // 가이드가 짚을 자리(패널 안 좌표)
  private rectList = new Phaser.Geom.Rectangle();
  private rectAmount = new Phaser.Geom.Rectangle();
  private rectQuote = new Phaser.Geom.Rectangle();
  private rectGo = new Phaser.Geom.Rectangle();
  private rectPending = new Phaser.Geom.Rectangle();

  constructor(scene: Phaser.Scene, x: number, y: number, shopName: string, cbs: MillPanelCallbacks) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: shopName, onClose: cbs.onClose, depth: 800 });
    this.cbs = cbs;
    this.shopName = shopName;
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    // 가진 깨가 가장 많은 일을 먼저 고른다
    const best = [...MILL_SERVICES].sort((a, b) => seedStockG(b.seedItemId) - seedStockG(a.seedItemId))[0];
    if (best) this.sel = best.id;
    this.fitAmounts();
    this.render();
    // 남은 분 · 「다 됐다」를 1초마다(바뀐 것이 있을 때만 다시 그린다)
    this.ticker = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshIfChanged() });
    maybeStartTour(scene, () => this.buildTour());
  }

  /** 고른 일에 맞게 병 수 · g을 가진 깨 안으로 줄인다 */
  private fitAmounts(): void {
    const s = MILL_SERVICES.find((x) => x.id === this.sel);
    if (!s) return;
    const have = seedStockG(s.seedItemId);
    if (s.kind === 'oil') {
      const q = (): number => millQuoteOf(this.sel, { bottles: this.bottles })?.seedG ?? 0;
      while (this.bottles[350] > 0 && q() > have) this.bottles[350]--;
      while (this.bottles[180] > 0 && q() > have) this.bottles[180]--;
      if (this.bottles[180] + this.bottles[350] === 0) {
        if (maxBottles(this.sel, 350, have) > 0) this.bottles[350] = 1;
        else if (maxBottles(this.sel, 180, have) > 0) this.bottles[180] = 1;
      }
    } else {
      const step = MILL_TUNING.grindStepG;
      const cap = Math.floor(have / step) * step;
      this.grams = Math.max(step, Math.min(this.grams, cap || step));
    }
  }

  private stateKey(): string {
    const now = Date.now();
    return MillQueue.pending.map((o) => `${o.id}:${o.readyAtMs <= now ? 'r' : Math.ceil((o.readyAtMs - now) / 60_000)}`).join(',')
      + `|${GameState.player.inventory.coins}|${MILL_SERVICES.map((s) => seedStockG(s.seedItemId)).join(',')}`;
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
      r.on('pointerdown', () => { run(); this.render(); restoreHandCursor(sc); });
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

    // ── 왼쪽: 일 넷 ──
    let y = top;
    MILL_SERVICES.forEach((s) => {
      const have = seedStockG(s.seedItemId);
      const isSel = s.id === this.sel;
      const bg = sc.add.rectangle(14, y, LIST_W, ROW_H - 4, isSel ? 0x1f4a6a : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, isSel ? 0x5cd0ff : 0x2a3a4a, 1);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { this.sel = s.id; this.status = ''; this.fitAmounts(); this.render(); restoreHandCursor(sc); });
      this.content.add(bg);
      const name = txt(22, y + 4, s.nameKo, 13, '#e8f4fd', true);
      clampTextWidth(name, LIST_W - 16);
      const seed = millOutputTemplate(s.seedItemId)?.name.replace(/\s*·.*$/, '') ?? '';
      const sub = txt(22, y + 22, `가방 ${seed} ${gramsText(have)}`, 11, have > 0 ? '#9fd5ff' : '#6a7a8a');
      clampTextWidth(sub, LIST_W - 16);
      y += ROW_H;
    });
    this.rectList.setTo(14, top, LIST_W, ROW_H * MILL_SERVICES.length);

    // ── 오른쪽: 고른 일 ──
    const s = MILL_SERVICES.find((x) => x.id === this.sel)!;
    const have = seedStockG(s.seedItemId);
    let ry = top;
    const how = txt(RIGHT_X, ry, s.howKo, 11, '#a8c0d4', false, RIGHT_W);
    ry += how.height + 10;
    const amountTop = ry;
    if (s.kind === 'oil') {
      for (const ml of OIL_BOTTLE_SIZES) {
        const per = s.seedPerBottle?.[ml] ?? 0;
        const lbl = txt(RIGHT_X, ry + 6, `${ml}ml 병`, 13, '#ffe28a', true);
        // 흐름 배치 — 영어(「180ml bottle」)는 이름이 길어 고정 x면 겹친다
        const perX = Math.max(RIGHT_X + 76, lbl.x + lbl.width + 8);
        const perT = txt(perX, ry + 8, `한 병에 ${gramsText(per)}`, 11, '#8fa8bf');
        clampTextWidth(perT, Math.max(40, RIGHT_X + 200 - perX));
        const n = this.bottles[ml];
        const room = maxBottles(this.sel, ml, have - (millQuoteOf(this.sel, { bottles: { ...this.bottles, [ml]: 0 } })?.seedG ?? 0));
        this.btn(RIGHT_X + 206, ry + 2, 30, 26, '−', n > 0, () => { this.bottles[ml] = Math.max(0, n - 1); this.status = ''; });
        txt(RIGHT_X + 252, ry + 6, `${n}`, 14, '#ffffff', true).setOrigin(0.5, 0);
        this.btn(RIGHT_X + 268, ry + 2, 30, 26, '+', n < room, () => { this.bottles[ml] = n + 1; this.status = ''; });
        ry += 34;
      }
    } else {
      const step = MILL_TUNING.grindStepG;
      const cap = Math.floor(have / step) * step;
      txt(RIGHT_X, ry + 6, '맡길 양', 13, '#ffe28a', true);
      this.btn(RIGHT_X + 140, ry + 2, 30, 26, '−', this.grams > step, () => { this.grams = Math.max(step, this.grams - step); this.status = ''; });
      txt(RIGHT_X + 202, ry + 6, gramsText(this.grams), 14, '#ffffff', true).setOrigin(0.5, 0);
      this.btn(RIGHT_X + 234, ry + 2, 30, 26, '+', this.grams + step <= cap, () => { this.grams += step; this.status = ''; });
      this.btn(RIGHT_X + 270, ry + 2, 46, 26, '전부', cap >= step && this.grams !== cap, () => { this.grams = cap; this.status = ''; });
      ry += 34;
    }
    this.rectAmount.setTo(RIGHT_X - 4, amountTop - 2, RIGHT_W + 8, ry - amountTop + 4);

    // 견적 — 흐름 배치(줄 수가 데이터에 따라 바뀐다)
    ry += 4;
    const quoteTop = ry;
    const q = millQuoteOf(this.sel, s.kind === 'oil' ? { bottles: this.bottles } : { grams: this.grams });
    const lines: { label: string; value: string; color?: string }[] = [];
    if (q) {
      lines.push({ label: '드는 깨', value: `${gramsText(q.seedG)} (가방 ${gramsText(have)})`, color: q.seedG > have ? '#ff9a7a' : undefined });
      const outs = q.outputs.map((o) => {
        const tpl = millOutputTemplate(o.itemId);
        if (!tpl) return o.itemId;
        return tpl.unitG ? `${tpl.name} ${gramsText(o.qty * tpl.unitG)}` : `${tpl.name} ${o.qty}${s.kind === 'oil' ? '병' : '개'}`;
      });
      lines.push({ label: '나오는 것', value: outs.join(' · ') });
      lines.push({ label: '공임', value: `${q.feeWon.toLocaleString()}원${s.kind === 'oil' ? ' (병값 포함)' : ''}`, color: q.feeWon > GameState.player.inventory.coins ? '#ff9a7a' : undefined });
      lines.push({ label: '찾는 때', value: `${q.waitMin}분 뒤` });
    } else {
      lines.push({ label: '드는 깨', value: s.kind === 'oil' ? '병을 고른다' : `${MILL_TUNING.grindStepG}g 단위` });
    }
    for (const l of lines) {
      txt(RIGHT_X, ry, l.label, 11, '#8fa8bf');
      const v = txt(RIGHT_X + 76, ry, l.value, 12, l.color ?? '#e8f4fd', false, RIGHT_W - 80);
      ry += Math.max(18, v.height + 4);
    }
    this.rectQuote.setTo(RIGHT_X - 4, quoteTop - 2, RIGHT_W + 8, ry - quoteTop + 4);
    ry += 6;
    const can = !!q && q.seedG <= have && q.feeWon <= GameState.player.inventory.coins;
    this.btn(RIGHT_X, ry, RIGHT_W, 30, '맡기기', can, () => {
      const r = placeMillOrder(this.sel, s.kind === 'oil' ? { bottles: this.bottles } : { grams: this.grams }, this.shopName);
      this.say(r.message, r.ok);
      if (r.ok) { this.cbs.log?.(`[방앗간] ${r.message}`); this.cbs.onChanged?.(); this.fitAmounts(); }
    }, 'go');
    this.rectGo.setTo(RIGHT_X, ry, RIGHT_W, 30);
    ry += 38;

    // ── 아래: 맡겨 둔 것 ──
    const listTop = Math.max(top + ROW_H * MILL_SERVICES.length + 10, ry);
    txt(14, listTop, '맡겨 둔 것', 12, '#9fd5ff', true);
    let py = listTop + 20;
    const now = Date.now();
    const pending = MillQueue.pending;
    if (pending.length === 0) {
      txt(22, py, '없음', 11, '#6a7a8a');
      py += 22;
    }
    for (const o of pending.slice(0, PENDING_ROWS)) {
      this.pendingRow(o, py, now);
      py += 30;
    }
    if (pending.length > PENDING_ROWS) { txt(22, py, `외 ${pending.length - PENDING_ROWS}건`, 11, '#8fa8bf'); py += 18; }
    this.rectPending.setTo(10, listTop - 2, PANEL_W - 20, py - listTop + 4);

    // 상태 줄 — 패널 안쪽 아래(R6)
    if (this.status) {
      const st = txt(PANEL_W / 2, PANEL_H - 26, this.status, 11, this.statusOk ? '#8affb0' : '#ff9a7a', false, PANEL_W - 40).setOrigin(0.5, 0.5);
      st.setAlign('center');
    }
    enforceTextBounds(this.content, PANEL_W - 10, 'MillPanel');
    this.applyFix();
  }

  private pendingRow(o: MillOrder, y: number, now: number): void {
    const sc = this.scene;
    const s = MILL_SERVICES.find((x) => x.id === o.service);
    const ready = o.readyAtMs <= now;
    const bg = sc.add.rectangle(14, y, PANEL_W - 28, 26, ready ? 0x173a26 : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, ready ? 0x4af2a1 : 0x2a3a4a, 1);
    this.content.add(bg);
    const outs = o.outputs.filter((x) => !millOutputTemplate(x.itemId)?.unitG)
      .map((x) => { const tpl = millOutputTemplate(x.itemId); return `${tpl?.name ?? x.itemId} ${x.qty}${s?.kind === 'oil' ? '병' : '개'}`; }).join(' · ');
    const name = sc.add.text(22, y + 5, `${s?.nameKo ?? ''} — ${outs}`, { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd' });
    clampTextWidth(name, PANEL_W - 28 - 230);
    this.content.add(name);
    const left = Math.max(1, Math.ceil((o.readyAtMs - now) / 60_000));
    const state = sc.add.text(PANEL_W - 128, y + 5, ready ? '다 됐다' : `${left}분 남음`, { fontFamily: FONT, fontSize: '11px', color: ready ? '#8affb0' : '#ffe28a' }).setOrigin(1, 0);
    this.content.add(state);
    if (ready) {
      this.btn(PANEL_W - 118, y + 1, 96, 24, '찾기', true, () => {
        const r = collectMillOrder(o.id);
        this.say(r.message, r.ok);
        if (r.ok) { this.cbs.log?.(`[방앗간] ${r.message}`); this.cbs.onChanged?.(); }
      }, 'go');
    } else {
      this.btn(PANEL_W - 118, y + 1, 96, 24, '무르기', true, () => {
        const r = cancelMillOrder(o.id);
        this.say(r.message, r.ok);
        if (r.ok) { this.cbs.log?.(`[방앗간] ${r.message}`); this.cbs.onChanged?.(); this.fitAmounts(); }
      }, 'warn');
    }
  }

  /** 패널 안 사각형 → 화면 좌표 */
  private screen(r: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x + r.x, this.y + r.y, r.width, r.height);
  }

  private buildTour(): TourOptions {
    return {
      id: 'mill',
      anchor: () => this.screen(new Phaser.Geom.Rectangle(0, 0, PANEL_W, PANEL_H)),
      alive: () => this.active,
      steps: [
        {
          text: '방앗간 압착기다. 털어 둔 깨를 맡기면 볶아서 기름을 짜 병에 담아 준다. 들깨는 곱게 갈고, 참깨는 볶아 깨소금으로 만들어 준다.',
          target: () => this.screen(new Phaser.Geom.Rectangle(0, 0, PANEL_W, PANEL_H)),
        },
        {
          text: '왼쪽에서 할 일을 고른다. 아래 숫자는 가방에 털어 둔 깨의 무게다 — 봉지에 담은 깨는 가방에서 뜯어야 여기에 잡힌다.',
          target: () => this.screen(this.rectList),
        },
        {
          text: '기름은 180ml · 350ml 병을 몇 병 짤지 고른다. 갈기 · 볶기는 100g 단위로 맡길 양을 고른다.',
          target: () => this.screen(this.rectAmount),
        },
        {
          text: '여기서 드는 깨 · 나오는 것 · 공임 · 찾는 때를 미리 본다. 기름을 짜면 깻묵도 함께 돌려준다 — 밭에 넣으면 거름이다.',
          target: () => this.screen(this.rectQuote),
        },
        {
          text: '「맡기기」를 누르면 깨와 공임이 나간다. 시간이 지나면 이 압착기에서 찾는다.',
          target: () => this.screen(this.rectGo),
        },
        {
          text: '맡겨 둔 것은 여기에 남는다. 다 되기 전에는 무를 수 있다 — 깨와 공임을 돌려받는다.',
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
