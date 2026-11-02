/**
 * @file ProcessPanel.ts
 * @description 295차 — 지역 가공대 창: 그 지역 가공(과메기 · 명이 장아찌 · 오징어순대 · 대구포 · 반건조 옥돔)을 몇 묶음 맡기고, 다 된 것을 찾는다.
 *  방앗간 창(`MillPanel`)과 같은 짜임 — 왼쪽 할 일 · 오른쪽 고른 일(재료 · 공임 · 시간 · 묶음 수) · 아래 맡긴 것.
 *  처음 열면 체험 가이드(`GuideTour` id `process`)가 짚는다(R11 — 창에 조작 문구 없음).
 */

import Phaser from 'phaser';
import { processRecipesOf, processQuote, processRecipe, type ProcessRecipeDef } from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { playSfx } from '../audio/SfxBank.js';
import { GameState } from '../store/GameState.js';
import { ProcessQueue, type ProcessOrder } from '../store/ProcessQueue.js';
import { processStock, processMaxBatches, placeProcessOrder, collectProcessOrder } from '../store/ProcessActions.js';
import { processedItemTemplate } from '../data/ProcessedItems.js';

const PANEL_W = 580;
const PANEL_H = 480;
const LIST_W = 196;
const ROW_H = 40;
const RIGHT_X = 14 + LIST_W + 14;
const RIGHT_W = PANEL_W - RIGHT_X - 14;
const FONT = '"Noto Sans KR", sans-serif';
const PENDING_ROWS = 4;

export interface ProcessPanelCallbacks {
  onClose: () => void;
  /** 가방 · 돈이 바뀌었다(필드 HUD · 가방 창 갱신) */
  onChanged?: () => void;
  /** 필드 로그 한 줄 */
  log?: (line: string) => void;
}

export class ProcessPanel extends DraggablePanel {
  private cbs: ProcessPanelCallbacks;
  private shopName: string;
  private regionId: string;
  private content: Phaser.GameObjects.Container;
  private recipes: ProcessRecipeDef[];
  private sel = '';
  private batches = 1;
  private status = '';
  private statusOk = true;
  private ticker?: Phaser.Time.TimerEvent;
  private lastKey = '';
  private rectList = new Phaser.Geom.Rectangle();
  private rectAmount = new Phaser.Geom.Rectangle();
  private rectGo = new Phaser.Geom.Rectangle();
  private rectPending = new Phaser.Geom.Rectangle();

  constructor(scene: Phaser.Scene, x: number, y: number, shopName: string, regionId: string, cbs: ProcessPanelCallbacks) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: shopName, onClose: cbs.onClose, depth: 800 });
    this.cbs = cbs;
    this.shopName = shopName;
    this.regionId = regionId;
    this.recipes = processRecipesOf(regionId);
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    // 재료가 가장 많은 일을 먼저 고른다
    const best = [...this.recipes].sort((a, b) => processStock(b) - processStock(a))[0];
    this.sel = best?.id ?? '';
    this.fitBatches();
    this.render();
    this.ticker = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshIfChanged() });
    maybeStartTour(scene, () => this.buildTour());
  }

  private get recipe(): ProcessRecipeDef | undefined { return processRecipe(this.sel); }

  private fitBatches(): void {
    const r = this.recipe;
    if (!r) { this.batches = 1; return; }
    const max = processMaxBatches(r);
    this.batches = Math.max(1, Math.min(this.batches, max || 1));
  }

  private stateKey(): string {
    const now = Date.now();
    return ProcessQueue.pending.map((o) => `${o.id}:${o.readyAtMs <= now ? 'r' : Math.ceil((o.readyAtMs - now) / 60_000)}`).join(',')
      + `|${GameState.player.inventory.coins}|${this.recipes.map((r) => processStock(r)).join(',')}`;
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

    // ── 왼쪽: 이 지역의 가공 ──
    let y = top;
    if (this.recipes.length === 0) txt(22, y, '이 고장에서 맡길 가공이 없다', 12, '#8fa8c0');
    for (const r of this.recipes) {
      const have = processStock(r);
      const isSel = r.id === this.sel;
      const bg = sc.add.rectangle(14, y, LIST_W, ROW_H - 2, isSel ? 0x1f4a6a : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, isSel ? 0x5cd0ff : 0x2a3a4a, 1);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { this.sel = r.id; this.status = ''; this.fitBatches(); this.render(); restoreHandCursor(sc); });
      this.content.add(bg);
      const name = txt(22, y + 3, r.nameKo, 12, '#e8f4fd', true);
      clampTextWidth(name, LIST_W - 16);
      const sub = txt(22, y + 20, `가방 ${r.input.nameKo} ${have}개`, 10, have > 0 ? '#9fd5ff' : '#6a7a8a');
      clampTextWidth(sub, LIST_W - 16);
      y += ROW_H;
    }
    this.rectList.setTo(14, top, LIST_W, Math.max(ROW_H, ROW_H * this.recipes.length));

    // ── 오른쪽: 고른 일 ──
    const r = this.recipe;
    let ry = top;
    if (r) {
      const have = processStock(r);
      const max = processMaxBatches(r);
      const q = processQuote(r, this.batches);
      const title = txt(RIGHT_X, ry, r.stationKo, 13, '#ffe28a', true);
      clampTextWidth(title, RIGHT_W);
      ry += 20;
      const how = txt(RIGHT_X, ry, r.howKo, 11, '#b8ccdc', false, RIGHT_W);
      ry += how.height + 8;
      // 묶음 수
      this.rectAmount.setTo(RIGHT_X, ry, RIGHT_W, 30);
      txt(RIGHT_X, ry + 6, `묶음 수 (한 묶음 = ${r.input.nameKo} ${r.input.qty}개)`, 11, '#9fd5ff');
      this.btn(RIGHT_X + RIGHT_W - 112, ry, 30, 26, '−', this.batches > 1, () => { this.batches = Math.max(1, this.batches - 1); });
      const cnt = txt(RIGHT_X + RIGHT_W - 78, ry + 5, `${this.batches}`, 13, '#eef8ff', true);
      cnt.setOrigin(0.5, 0).setX(RIGHT_X + RIGHT_W - 60);
      this.btn(RIGHT_X + RIGHT_W - 42, ry, 30, 26, '+', this.batches < max, () => { this.batches = Math.min(max, this.batches + 1); });
      ry += 34;
      // 견적
      const outTpl = processedItemTemplate(r.output.itemId);
      const lines = [
        `드는 것  ${r.input.nameKo} ${q.inputQty}개 (가방 ${have}개)`,
        `나오는 것  ${outTpl?.name ?? r.output.itemId} ${q.outputQty}개`,
        `공임  ${q.feeWon.toLocaleString()}원 (가진 돈 ${GameState.player.inventory.coins.toLocaleString()}원)`,
        `찾는 때  ${q.waitMin}분 뒤`,
      ];
      for (const l of lines) { const o = txt(RIGHT_X, ry, l, 11, '#e8f4fd'); clampTextWidth(o, RIGHT_W); ry += 16; }
      ry += 4;
      const can = max >= 1 && GameState.player.inventory.coins >= q.feeWon;
      this.rectGo.setTo(RIGHT_X, ry, RIGHT_W, 28);
      this.btn(RIGHT_X, ry, RIGHT_W, 28, can ? '맡기기' : max < 1 ? `${r.input.nameKo}가 없다` : '공임이 모자란다', can, () => {
        const res = placeProcessOrder(r.id, this.batches, this.shopName);
        this.say(res.message, res.ok);
        if (res.ok) { this.cbs.log?.(`[가공장] ${res.message}`); this.cbs.onChanged?.(); this.fitBatches(); }
      }, 'go');
      ry += 34;
    }

    // ── 아래: 맡긴 것 ──
    const now = Date.now();
    const pendY = Math.max(ry, top + this.rectList.height + 10, top + 230);
    txt(14, pendY, '맡긴 것', 12, '#ffe28a', true);
    const mine = ProcessQueue.pending.filter((o) => o.shopName === this.shopName || o.regionId === this.regionId);
    let py = pendY + 18;
    if (mine.length === 0) txt(22, py + 4, '아직 맡긴 것이 없다', 11, '#6a7a8a');
    for (const o of mine.slice(0, PENDING_ROWS)) { this.pendingRow(o, py, now); py += 28; }
    if (mine.length > PENDING_ROWS) txt(22, py + 2, `… ${mine.length - PENDING_ROWS}건 더`, 10, '#8fa8c0');
    this.rectPending.setTo(14, pendY, PANEL_W - 28, Math.max(30, 18 + 28 * Math.min(PENDING_ROWS, Math.max(1, mine.length))));

    // ── 상태 줄 ──
    if (this.status) {
      const st = txt(14, PANEL_H - 24, this.status, 11, this.statusOk ? '#8affb0' : '#ff9a8a', false, PANEL_W - 28);
      clampTextWidth(st, PANEL_W - 28);
    }
    enforceTextBounds(this.content, PANEL_W - 20, '가공장');
    this.applyFix();
  }

  private pendingRow(o: ProcessOrder, y: number, now: number): void {
    const sc = this.scene;
    const r = processRecipe(o.recipeId);
    const ready = o.readyAtMs <= now;
    const bg = sc.add.rectangle(14, y, PANEL_W - 28, 26, ready ? 0x173a26 : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, ready ? 0x4af2a1 : 0x2a3a4a, 1);
    this.content.add(bg);
    const outName = processedItemTemplate(o.output.itemId)?.name ?? o.output.itemId;
    const name = sc.add.text(22, y + 5, `${r?.nameKo ?? ''} — ${outName} ${o.output.qty}개`, { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd' });
    clampTextWidth(name, PANEL_W - 28 - 230);
    this.content.add(name);
    const left = Math.max(1, Math.ceil((o.readyAtMs - now) / 60_000));
    const state = sc.add.text(PANEL_W - 128, y + 5, ready ? '다 됐다' : `${left}분 남음`, { fontFamily: FONT, fontSize: '11px', color: ready ? '#8affb0' : '#ffe28a' }).setOrigin(1, 0);
    this.content.add(state);
    if (ready) {
      this.btn(PANEL_W - 118, y + 1, 96, 24, '찾기', true, () => {
        const res = collectProcessOrder(o.id);
        this.say(res.message, res.ok);
        if (res.ok) { this.cbs.log?.(`[가공장] ${res.message}`); this.cbs.onChanged?.(); }
      }, 'go');
    }
  }

  /** 패널 안 사각형 → 화면 좌표 */
  private screen(r: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x + r.x, this.y + r.y, r.width, r.height);
  }

  private buildTour(): TourOptions {
    return {
      id: 'process',
      anchor: () => this.screen(new Phaser.Geom.Rectangle(0, 0, PANEL_W, PANEL_H)),
      alive: () => this.active,
      steps: [
        {
          text: '이 고장의 가공장이다. 여기서 잡은 것 · 거둔 것을 맡기면 이 고장만의 가공품이 된다 — 다른 고장 가게에 가져가면 더 쳐준다.',
          target: () => this.screen(new Phaser.Geom.Rectangle(0, 0, PANEL_W, PANEL_H)),
        },
        {
          text: '왼쪽에서 할 일을 고른다. 아래 숫자는 가방에 든 재료의 수다 — 상한 것은 세지 않는다.',
          target: () => this.screen(this.rectList),
        },
        {
          text: '몇 묶음을 맡길지 고른다. 한 묶음에 드는 재료와 나오는 것, 공임, 찾는 때를 미리 본다.',
          target: () => this.screen(this.rectAmount),
        },
        {
          text: '「맡기기」를 누르면 재료와 공임이 나간다. 시간이 지나면 손목시계가 알려 주고, 이 가공장에서 찾는다.',
          target: () => this.screen(this.rectGo),
        },
      ],
    };
  }

  override destroy(fromScene?: boolean): void {
    this.ticker?.remove(false);
    super.destroy(fromScene);
  }
}
