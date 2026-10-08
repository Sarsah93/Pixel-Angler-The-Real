/**
 * @file FarmPanel.ts
 * @description 235차 — 텃밭 창: 칸 격자(마당 4×3 · 집 안 선반 4) + 고른 칸 자세히 + 할 일 단추 + 심기 목록 + 설비 + 절기 달력
 *
 * - 칸을 누르면 오른쪽에 그 칸이 보인다(자람 · 흙 · 품질 · 다음 수확까지) — 할 일은 그 칸에 맞는 단추만 뜬다.
 * - 「심기」는 가방의 씨앗 · 모종 · 종구 목록으로 바뀐다. 못 심는 것은 까닭(철 · 자격 · 수량)을 회색으로 붙인다.
 * - 「물 주기」는 구획 전체(물뿌리개). 「설비」는 빗물통 · 비닐 터널 · 차광막 · 냉수 수조(마당)를 놓고 걷는다.
 * - 「절기 독해」를 배우면 「달력」이 열린다 — 작물마다 심는 달 · 자라는 달.
 * - 조작 안내 문구는 창에 넣지 않는다(R11) — 처음 열 때 체험 가이드가 짚는다(`buildTour`).
 */

import Phaser from 'phaser';
import {
  CROP_DATABASE, FARM_COLS, GRADE_KO, cellReady, cellStage, cropStartOfItem, daysToNextHarvest, getCrop, supplyOfFacility,
  gradeOf, interimOpen, kstMonthOf, seasonFactor, startOf, FARM_SUPPLIES,
  type FarmCellState, type FarmFacility, type FarmPlotState,
} from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { addPixelIcon } from './PixelIcon.js';
import { createItemIcon } from './ItemIcon.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { FarmStore, INDOOR_PLOT, HOMI_ID, COMPOST_ID, WATERING_CAN_ID, type FarmActionResult } from '../store/FarmStore.js';
import { InventoryStore, type InvItem } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { startItemName } from '../data/CropItems.js';
import { t } from '../i18n/I18n.js';

const PANEL_W = 780;
const PANEL_H = 520;
/** 집 안 선반은 칸이 한 줄(4칸)이라 낮게 — 심을 것 목록 6줄이 들어가는 높이 */
const PANEL_H_INDOOR = 430;
const CELL = 72;
const GAP = 8;
const GRID_X = 18;
const PANE_X = GRID_X + FARM_COLS * (CELL + GAP) + 10;
const PANE_W = PANEL_W - PANE_X - 18;
const ROW_H = 40;
const FONT = '"Noto Sans KR", sans-serif';

/** 단추 글자 폭 어림(12px 굵게 — 한글 13px · 라틴 7.5px). 번역된 글자로 잰다(영어 단추가 잘리지 않게) */
function labelW(label: string): number {
  let w = 0;
  for (const ch of t(label)) w += /[가-힣]/.test(ch) ? 13 : 7.5;
  return Math.ceil(w);
}

/** 설비 → 칩 아이콘 */
const FACILITY_ICON: Record<FarmFacility, string> = {
  compost: 'it_compost', rainBarrel: 'it_rain_barrel', greenhouse: 'it_tunnel', shade: 'it_shade_net',
  hydroRack: 'it_hydro_rack', coldWater: 'it_cold_tank', sproutJar: 'it_sprout_jar',
};

type Mode = 'cell' | 'plant' | 'facility' | 'almanac';

export interface FarmPanelOpts {
  /** 마당 텃밭 = 설치물 instanceId · 집 안 = `indoor` */
  plotId: string;
  onClose: () => void;
  /** 칸이 바뀌었다(필드 그림 · 일지 갱신) */
  onChanged?: () => void;
  /** 되돌릴 수 없는 행동 확인 창(씬의 팝업 스택에 올린다) */
  confirm?: (message: string, onYes: () => void, labels: { yes: string; no: string; danger?: boolean }) => void;
  /** 로그 한 줄(필드 HUD) */
  log?: (line: string) => void;
}

export class FarmPanel extends DraggablePanel {
  private opts: FarmPanelOpts;
  private content!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private sel = 0;
  private mode: Mode = 'cell';
  private scroll = 0;
  private tick?: Phaser.Time.TimerEvent;
  private wheelFn: (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => void;
  /** 가이드 판정 — 이번 창에서 한 일 */
  private did = { till: 0, plant: 0, water: 0 };
  /** 단추 자리(가이드가 짚는다) */
  private btnRects = new Map<string, Phaser.Geom.Rectangle>();

  constructor(scene: Phaser.Scene, x: number, y: number, opts: FarmPanelOpts) {
    const indoor = opts.plotId === INDOOR_PLOT;
    super(scene, { x, y, width: PANEL_W, height: indoor ? PANEL_H_INDOOR : PANEL_H, title: indoor ? '집 안 선반' : '텃밭', onClose: opts.onClose, depth: 846 });
    this.opts = opts;
    FarmStore.advanceAll();
    // 처음 열면 무엇이 자라는 첫 칸을 고른다(없으면 첫 칸)
    const cells = this.plot().cells;
    const firstCrop = cells.findIndex((c) => !!c.cropId);
    this.sel = firstCrop >= 0 ? firstCrop : 0;
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    this.statusText = scene.add.text(GRID_X, (indoor ? PANEL_H_INDOOR : PANEL_H) - 28, '', {
      fontFamily: FONT, fontSize: '12px', color: '#9fd0e4', wordWrap: { width: PANE_X - GRID_X - 8 },
    });
    this.add(this.statusText);
    this.wheelFn = (p, _o, _dx, dy) => {
      if (this.mode === 'cell') return;
      if (p.x < this.x + PANE_X || p.x > this.x + PANEL_W || p.y < this.y || p.y > this.y + this.ph) return;
      this.scroll = Math.max(0, this.scroll + (dy > 0 ? 1 : -1));
      this.render();
    };
    scene.input.on('wheel', this.wheelFn);
    // 시간이 흐르면 자람 · 흙이 바뀐다 — 열려 있는 동안 20초마다 다시 센다
    this.tick = scene.time.addEvent({ delay: 20_000, loop: true, callback: () => { FarmStore.advanceAll(); if (this.mode === 'cell') this.render(); } });
    this.render();
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input.off('wheel', this.wheelFn);
    this.tick?.remove();
    super.destroy(fromScene);
  }

  private plot(): FarmPlotState { return FarmStore.plot(this.opts.plotId); }
  private get indoor(): boolean { return this.opts.plotId === INDOOR_PLOT; }
  /** 창 높이(집 안 선반은 낮다) */
  private get ph(): number { return this.indoor ? PANEL_H_INDOOR : PANEL_H; }

  // ── 가이드용 사각형 ─────────────────────────────

  gridRect(): Phaser.Geom.Rectangle {
    const n = this.plot().cells.length;
    const rows = Math.ceil(n / FARM_COLS);
    return this.localRect(GRID_X - 4, this.gridY - 4, FARM_COLS * (CELL + GAP) - GAP + 8, rows * (CELL + GAP) - GAP + 8);
  }
  paneRect(): Phaser.Geom.Rectangle { return this.localRect(PANE_X - 4, this.contentTop + 36, PANE_W + 8, this.ph - this.contentTop - 70); }
  buttonRect(key: string): Phaser.Geom.Rectangle | null {
    const r = this.btnRects.get(key);
    return r ? this.localRect(r.x, r.y, r.width, r.height) : null;
  }

  private get gridY(): number { return this.contentTop + 40; }

  private setStatus(msg: string, ok = true): void {
    this.statusText.setColor(ok ? '#9fd0e4' : '#ff9a7a').setText(t(msg));
  }

  /** 행동 결과 → 상태 줄 · 로그 · 필드 갱신 */
  private after(r: FarmActionResult): void {
    this.setStatus(r.message, r.ok);
    if (r.ok) {
      this.opts.onChanged?.();
      for (const h of r.harvested ?? []) this.opts.log?.(`[텃밭] ${h.name} ×${h.qty}`);
    }
    this.render();
    restoreHandCursor(this.scene);
  }

  // ── 그리기 ──────────────────────────────────

  private render(): void {
    this.content.removeAll(true);
    this.btnRects.clear();
    this.renderTopBar();
    this.renderGrid();
    if (this.mode === 'cell') this.renderCellPane();
    else if (this.mode === 'plant') this.renderPlantList();
    else if (this.mode === 'facility') this.renderFacilityList();
    else this.renderAlmanac();
    enforceTextBounds(this, PANEL_W - 12, 'FarmPanel');
    this.applyFix();
  }

  /** 위 줄 — 설비 칩 · 물 주기 · 설비 · 달력 */
  private renderTopBar(): void {
    const scene = this.scene;
    const y = this.contentTop + 4;
    const p = this.plot();
    let x = GRID_X;
    for (const f of p.facilities) {
      const chip = scene.add.graphics();
      chip.fillStyle(0x10233a, 0.95); chip.fillRoundedRect(x, y, 26, 26, 4);
      chip.lineStyle(1, 0x2f5a80, 0.9); chip.strokeRoundedRect(x, y, 26, 26, 4);
      this.content.add(chip);
      const ic = addPixelIcon(scene, FACILITY_ICON[f], x + 13, y + 13, 16);
      if (ic) this.content.add(ic);
      const hit = scene.add.rectangle(x + 13, y + 13, 26, 26, 0xffffff, 0.001).setInteractive();
      const name = supplyOfFacility(f)?.nameKo ?? '';
      hit.on('pointerover', () => this.setStatus(name));
      this.content.add(hit);
      x += 30;
    }
    // 오른쪽 단추들 — 오른쪽 끝에서 왼쪽으로
    let bx = PANEL_W - 18;
    const btn = (key: string, label: string, onClick: () => void, on = true): void => {
      const w = Math.max(76, labelW(label) + 22);
      bx -= w;
      this.button(key, bx, y, w, 26, label, onClick, on);
      bx -= 6;
    };
    if (GameState.skillBonus('farm_calendar') >= 1) btn('almanac', this.mode === 'almanac' ? '칸 보기' : '달력', () => { this.mode = this.mode === 'almanac' ? 'cell' : 'almanac'; this.scroll = 0; this.render(); });
    if (!this.indoor) btn('facility', this.mode === 'facility' ? '칸 보기' : '설비', () => { this.mode = this.mode === 'facility' ? 'cell' : 'facility'; this.scroll = 0; this.render(); });
    btn('water', '물 주기', () => { const r = FarmStore.waterAll(this.opts.plotId); if (r.ok) this.did.water++; this.after(r); },
      this.indoor || !!InventoryStore.find(WATERING_CAN_ID));
  }

  private renderGrid(): void {
    const scene = this.scene;
    const p = this.plot();
    const now = Date.now();
    p.cells.forEach((c, i) => {
      const cx = GRID_X + (i % FARM_COLS) * (CELL + GAP);
      const cy = this.gridY + Math.floor(i / FARM_COLS) * (CELL + GAP);
      const g = scene.add.graphics();
      this.paintSoil(g, cx, cy, c);
      if (i === this.sel) { g.lineStyle(2, 0xffd257, 1); g.strokeRoundedRect(cx - 1, cy - 1, CELL + 2, CELL + 2, 5); }
      this.content.add(g);
      const stage = cellStage(c);
      const crop = c.cropId ? getCrop(c.cropId) : undefined;
      const stageIcon = stage === 'seeded' ? 'farm_seeded' : stage === 'young' ? 'farm_young' : stage === 'growing' || stage === 'ready' ? 'farm_growing' : stage === 'resting' ? 'farm_resting' : null;
      if (stageIcon) {
        const ic = addPixelIcon(scene, stageIcon, cx + CELL / 2, cy + CELL / 2 + 4, 48);
        if (ic) this.content.add(ic);
      }
      if (crop && stage === 'ready') {
        const ready = addPixelIcon(scene, crop.harvest.itemId, cx + CELL - 20, cy + 20, 32);
        if (ready) this.content.add(ready);
      }
      if (crop && interimOpen(c, crop) && crop.interim) {
        const ii = addPixelIcon(scene, crop.interim.itemId, cx + 12, cy + CELL - 12, 16);
        if (ii) this.content.add(ii);
      }
      // 흙이 마르면 물방울(흙 = 마름) · 철이 아니면 회색 막
      if (c.tilled && c.moisture < 0.25 && !(this.indoor && crop?.site === 'plot')) {
        const d = addPixelIcon(scene, 'hydration', cx + 12, cy + 12, 16);
        if (d) this.content.add(d.setAlpha(0.95));
      }
      if (crop && !c.resting && seasonFactor(crop, kstMonthOf(now), p) === 0) {
        const fog = scene.add.rectangle(cx + CELL / 2, cy + CELL / 2, CELL, CELL, 0x0a1220, 0.35);
        this.content.add(fog);
      }
      const hit = scene.add.rectangle(cx + CELL / 2, cy + CELL / 2, CELL, CELL, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this.sel = i; if (this.mode !== 'plant') this.mode = 'cell'; this.render(); });
      this.content.add(hit);
    });
  }

  /** 흙 — 일구지 않은 땅 · 이랑 · 젖은 흙(픽셀 점 무늬 — 둥근 사각형 위에) */
  private paintSoil(g: Phaser.GameObjects.Graphics, x: number, y: number, c: FarmCellState): void {
    if (this.indoor) {
      g.fillStyle(0x3a3f48, 1); g.fillRoundedRect(x, y, CELL, CELL, 4);
      g.fillStyle(0x4c535e, 1); g.fillRect(x + 4, y + CELL - 14, CELL - 8, 8);
      return;
    }
    if (!c.tilled) {
      g.fillStyle(0x4f6a34, 1); g.fillRoundedRect(x, y, CELL, CELL, 4);
      for (let yy = 4; yy < CELL - 2; yy += 6) for (let xx = 4 + ((yy / 6) % 2) * 3; xx < CELL - 2; xx += 7) {
        g.fillStyle(0x6a8a44, 1); g.fillRect(x + xx, y + yy, 2, 2);
      }
      return;
    }
    const wet = c.moisture >= 0.6;
    g.fillStyle(wet ? 0x4a3220 : 0x6a4a2c, 1); g.fillRoundedRect(x, y, CELL, CELL, 4);
    for (let yy = 6; yy < CELL - 4; yy += 12) {
      g.fillStyle(wet ? 0x3a2616 : 0x553a22, 1); g.fillRect(x + 3, y + yy + 6, CELL - 6, 4);
      g.fillStyle(wet ? 0x5c4028 : 0x8a6038, 1); g.fillRect(x + 3, y + yy, CELL - 6, 2);
    }
    if (c.compost) { g.fillStyle(0x2a1a10, 0.8); for (let k = 0; k < 6; k++) g.fillRect(x + 8 + k * 10, y + CELL - 9, 3, 3); }
  }

  /** 고른 칸 자세히 + 할 일 단추 */
  private renderCellPane(): void {
    const scene = this.scene;
    const c = this.plot().cells[this.sel];
    if (!c) return;
    const crop = c.cropId ? getCrop(c.cropId) : undefined;
    let y = this.contentTop + 40;
    const title = crop ? crop.nameKo : c.tilled ? '빈 칸' : '일구지 않은 땅';
    this.content.add(scene.add.text(PANE_X, y, title, { fontFamily: FONT, fontSize: '16px', color: '#ffe28a', fontStyle: 'bold' }));
    y += 30;
    const row = (label: string, value: string, color = '#e8f2fa'): void => {
      this.content.add(scene.add.text(PANE_X, y, t(label), { fontFamily: FONT, fontSize: '12px', color: '#8fb4cc' }));
      const v = scene.add.text(PANE_X + 92, y, value, { fontFamily: FONT, fontSize: '12px', color, wordWrap: { width: PANE_W - 96 } });
      this.content.add(v);
      y += Math.max(20, v.height + 4);
    };
    const bar = (label: string, v01: number, col: number, tail: string): void => {
      this.content.add(scene.add.text(PANE_X, y, t(label), { fontFamily: FONT, fontSize: '12px', color: '#8fb4cc' }));
      const bw = PANE_W - 92 - 70;
      const g = scene.add.graphics();
      g.fillStyle(0x0d1a28, 1); g.fillRect(PANE_X + 92, y + 4, bw, 9);
      g.fillStyle(col, 1); g.fillRect(PANE_X + 92, y + 4, Math.round(bw * Math.max(0, Math.min(1, v01))), 9);
      g.lineStyle(1, 0x2a4a66, 1); g.strokeRect(PANE_X + 92, y + 4, bw, 9);
      this.content.add(g);
      this.content.add(scene.add.text(PANE_X + 92 + bw + 8, y, tail, { fontFamily: FONT, fontSize: '12px', color: '#c8dceb' }));
      y += 22;
    };

    if (crop) {
      const st = startOf(crop, c.start);
      const days = c.plantedAt ? Math.floor((Date.now() - c.plantedAt) / 86_400_000) : 0;
      row('심은 것', `${st ? startItemName(crop, st) : crop.nameKo} · ${days > 0 ? `${days}일 전` : '오늘'}`);
      if (c.resting) row('지금', '거둔 뒤 쉬는 중 — 철이 바뀌면 다시 올라온다', '#c8b890');
      else {
        const prog = c.picks > 0 ? c.regrow : c.growth;
        const left = daysToNextHarvest(c, this.plot(), Date.now());
        bar(c.picks > 0 ? '다시 자람' : '자람', prog, 0x6ac46a, `${Math.round(prog * 100)}%`);
        row('거둘 때', cellReady(c) ? '지금 거둘 수 있다' : left === null ? '철이 아니다 — 철이 오면 다시 자란다' : `약 ${Math.max(1, Math.ceil(left))}일 뒤`,
          cellReady(c) ? '#8affb0' : left === null ? '#c8b890' : '#e8f2fa');
      }
      const grade = gradeOf(c.quality);
      bar('품질', c.quality, grade === 'special' ? 0xffd257 : grade === 'good' ? 0x8fd4ff : 0x9aa8b4, GRADE_KO[grade]);
      if (c.start === 'seed') row('싹 튼 비율', `${Math.round(c.stand * 100)}%`);
      else row('뿌리 내림', `${Math.round(c.stand * 100)}%`);
      if (crop.harvest.repeat) row('딴 횟수', `${c.picks} / ${crop.harvest.repeat.times + 1}`);
    }
    if (c.tilled && !(this.indoor && crop?.site === 'plot')) {
      bar('흙', c.moisture, c.moisture < 0.25 ? 0xd8804a : 0x4aa0e0, c.moisture < 0.1 ? '바싹 마름' : c.moisture < 0.25 ? '마름' : c.moisture < 0.6 ? '알맞음' : '촉촉');
    }
    if (c.compost) row('퇴비', '이번 작기에 넣었다', '#c8b890');

    // ── 할 일 단추 ──
    y += 6;
    const buttons: { key: string; label: string; on: boolean; run: () => void }[] = [];
    if (!c.tilled) buttons.push({ key: 'till', label: '일구기', on: !!InventoryStore.find(HOMI_ID), run: () => { const r = FarmStore.till(this.opts.plotId, this.sel); if (r.ok) this.did.till++; this.after(r); } });
    if (c.tilled && !c.compost && !this.indoor) buttons.push({ key: 'compost', label: '퇴비 넣기', on: !!InventoryStore.find(COMPOST_ID), run: () => this.after(FarmStore.compost(this.opts.plotId, this.sel)) });
    if (c.tilled && !c.cropId) buttons.push({ key: 'plant', label: '심기', on: true, run: () => { this.mode = 'plant'; this.scroll = 0; this.render(); } });
    if (crop && cellReady(c)) buttons.push({ key: 'harvest', label: '거두기', on: true, run: () => this.after(FarmStore.harvest(this.opts.plotId, this.sel)) });
    if (crop?.interim && interimOpen(c, crop)) buttons.push({ key: 'interim', label: crop.interim.seedOnly ? '솎아 내기' : '따기', on: true, run: () => this.after(FarmStore.interim(this.opts.plotId, this.sel)) });
    if (crop) buttons.push({ key: 'clear', label: '걷어 내기', on: true, run: () => this.confirmClear(crop.nameKo) });
    let bx = PANE_X;
    for (const b of buttons) {
      const w = Math.max(84, labelW(b.label) + 24);
      if (bx + w > PANE_X + PANE_W) { bx = PANE_X; y += 36; }
      this.button(b.key, bx, y, w, 30, b.label, b.run, b.on, b.key === 'clear');
      bx += w + 8;
    }
    if (buttons.length) y += 40;
    if (crop) {
      const note = scene.add.text(PANE_X, y, crop.noteKo, { fontFamily: FONT, fontSize: '12px', color: '#9fb8c8', wordWrap: { width: PANE_W }, lineSpacing: 3 });
      this.content.add(note);
    }
  }

  private confirmClear(name: string): void {
    const run = (): void => this.after(FarmStore.clear(this.opts.plotId, this.sel));
    if (this.opts.confirm) this.opts.confirm(`${name}\n자라던 것을 걷어 낸다. 되돌릴 수 없다.`, run, { yes: '걷어 내기', no: '취소', danger: true });
    else run();
  }

  /** 심기 — 가방의 씨앗 · 모종 · 종구 */
  private plantables(): InvItem[] {
    return InventoryStore.items.filter((i) => i.qty > 0 && !!cropStartOfItem(i.id));
  }

  private renderPlantList(): void {
    const scene = this.scene;
    let y = this.contentTop + 40;
    this.content.add(scene.add.text(PANE_X, y, t('무엇을 심을까'), { fontFamily: FONT, fontSize: '15px', color: '#ffe28a', fontStyle: 'bold' }));
    this.button('back', PANE_X + PANE_W - 76, y - 2, 76, 24, '뒤로', () => { this.mode = 'cell'; this.render(); });
    y += 32;
    const items = this.plantables();
    if (items.length === 0) {
      this.content.add(scene.add.text(PANE_X, y, t('가방에 심을 것이 없다 — 씨앗은 생활용품점, 모종은 식자재마트에서 판다'), {
        fontFamily: FONT, fontSize: '12px', color: '#8fa8b8', wordWrap: { width: PANE_W },
      }));
      return;
    }
    const rows = Math.floor((this.ph - y - 30) / ROW_H);
    this.scroll = Math.min(this.scroll, Math.max(0, items.length - rows));
    items.slice(this.scroll, this.scroll + rows).forEach((it, k) => {
      const ry = y + k * ROW_H;
      const chk = FarmStore.plantCheck(this.opts.plotId, this.sel, it.id);
      const g = scene.add.graphics();
      g.fillStyle(chk.ok ? 0x10283a : 0x141c26, 0.95); g.fillRoundedRect(PANE_X, ry, PANE_W, ROW_H - 4, 4);
      this.content.add(g);
      this.content.add(createItemIcon(scene, PANE_X + 18, ry + (ROW_H - 4) / 2, it, 24));
      const name = scene.add.text(PANE_X + 38, ry + 3, `${it.name}  x${it.qty}`, { fontFamily: FONT, fontSize: '12px', color: chk.ok ? '#e8f2fa' : '#7f93a3', fontStyle: 'bold' });
      clampTextWidth(name, PANE_W - 46);
      this.content.add(name);
      const why = scene.add.text(PANE_X + 38, ry + 19, chk.ok ? t('누르면 이 칸에 심는다') : t(chk.reasonKo ?? ''), { fontFamily: FONT, fontSize: '11px', color: chk.ok ? '#8affb0' : '#c89a7a' });
      clampTextWidth(why, PANE_W - 46);
      this.content.add(why);
      if (chk.ok) {
        const hit = scene.add.rectangle(PANE_X + PANE_W / 2, ry + (ROW_H - 4) / 2, PANE_W, ROW_H - 4, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          const r = FarmStore.plant(this.opts.plotId, this.sel, it.id);
          if (r.ok) { this.did.plant++; this.mode = 'cell'; }
          this.after(r);
        });
        this.content.add(hit);
      }
    });
    if (items.length > rows) {
      this.content.add(scene.add.text(PANE_X + PANE_W, this.ph - 22, `${this.scroll + 1}–${Math.min(items.length, this.scroll + rows)} / ${items.length}`, {
        fontFamily: FONT, fontSize: '11px', color: '#7f93a3',
      }).setOrigin(1, 0));
    }
  }

  /** 설비 — 놓은 것(걷기) · 가방의 농자재(놓기) */
  private renderFacilityList(): void {
    const scene = this.scene;
    let y = this.contentTop + 40;
    this.content.add(scene.add.text(PANE_X, y, t('설비'), { fontFamily: FONT, fontSize: '15px', color: '#ffe28a', fontStyle: 'bold' }));
    y += 32;
    const p = this.plot();
    const rows: { icon: string; name: string; desc: string; act: string; on: boolean; run: () => void }[] = [];
    for (const f of p.facilities) {
      const s = FARM_SUPPLIES.find((x) => x.facility === f);
      if (!s) continue;
      rows.push({ icon: FACILITY_ICON[f], name: s.nameKo, desc: s.descKo, act: '설비 걷기', on: true, run: () => this.after(FarmStore.uninstall(this.opts.plotId, f)) });
    }
    for (const s of FARM_SUPPLIES) {
      if (!s.facility || s.site !== 'plot' || p.facilities.includes(s.facility)) continue;
      const have = InventoryStore.find(s.itemId)?.qty ?? 0;
      if (have <= 0) continue;
      const skillOk = !s.requiresSkill || GameState.skillRank(s.requiresSkill) > 0;
      rows.push({ icon: FACILITY_ICON[s.facility], name: s.nameKo, desc: skillOk ? s.descKo : '다룰 줄 알아야 놓을 수 있다', act: '놓기', on: skillOk, run: () => this.after(FarmStore.install(this.opts.plotId, s.itemId)) });
    }
    if (rows.length === 0) {
      this.content.add(scene.add.text(PANE_X, y, t('놓을 설비가 없다 — 빗물통 · 차광막 · 비닐 터널은 생활용품점에서 판다'), {
        fontFamily: FONT, fontSize: '12px', color: '#8fa8b8', wordWrap: { width: PANE_W },
      }));
      return;
    }
    for (const r of rows) {
      const g = scene.add.graphics();
      const h = 58;
      g.fillStyle(0x10283a, 0.95); g.fillRoundedRect(PANE_X, y, PANE_W, h, 4);
      this.content.add(g);
      const ic = addPixelIcon(scene, r.icon, PANE_X + 20, y + h / 2, 32);
      if (ic) this.content.add(ic);
      this.content.add(scene.add.text(PANE_X + 44, y + 5, r.name, { fontFamily: FONT, fontSize: '12px', color: '#e8f2fa', fontStyle: 'bold' }));
      const d = scene.add.text(PANE_X + 44, y + 22, r.desc, { fontFamily: FONT, fontSize: '11px', color: '#9fb8c8', wordWrap: { width: PANE_W - 44 - 84 } });
      this.content.add(d);
      this.button(`fac_${r.name}`, PANE_X + PANE_W - 74, y + h / 2 - 13, 66, 26, r.act, r.run, r.on);
      y += h + 6;
      if (y > this.ph - 70) break;
    }
  }

  /** 절기 달력 — 작물마다 심는 달(진한 칸) · 자라는 달(옅은 칸) */
  private renderAlmanac(): void {
    const scene = this.scene;
    let y = this.contentTop + 40;
    this.content.add(scene.add.text(PANE_X, y, t('절기 달력'), { fontFamily: FONT, fontSize: '15px', color: '#ffe28a', fontStyle: 'bold' }));
    y += 26;
    const nameW = 92;
    const cw = Math.floor((PANE_W - nameW) / 12);
    const month = kstMonthOf(Date.now());
    for (let m = 1; m <= 12; m++) {
      const mx = PANE_X + nameW + (m - 1) * cw;
      this.content.add(scene.add.text(mx + cw / 2, y, String(m), { fontFamily: FONT, fontSize: '10px', color: m === month ? '#ffd257' : '#7f93a3' }).setOrigin(0.5, 0));
    }
    y += 16;
    const crops = CROP_DATABASE.filter((c) => c.site === (this.indoor ? 'indoor' : 'plot') || (this.indoor && c.category === 'leaf' && c.speedClass === 'leafy'));
    const rows = Math.floor((this.ph - y - 30) / 20);
    this.scroll = Math.min(this.scroll, Math.max(0, crops.length - rows));
    // 넘치는 줄은 휠로 — 몇 번째인지 늘 보인다(조용히 잘리지 않게)
    if (crops.length > rows) {
      this.content.add(scene.add.text(PANE_X + PANE_W, this.ph - 22, `${this.scroll + 1}–${Math.min(crops.length, this.scroll + rows)} / ${crops.length}`, {
        fontFamily: FONT, fontSize: '11px', color: '#7f93a3',
      }).setOrigin(1, 0));
    }
    crops.slice(this.scroll, this.scroll + rows).forEach((c, k) => {
      const ry = y + k * 20;
      const nm = scene.add.text(PANE_X, ry + 2, c.nameKo, { fontFamily: FONT, fontSize: '11px', color: '#c8dceb' });
      clampTextWidth(nm, nameW - 4);
      this.content.add(nm);
      const sow = new Set(c.starts.flatMap((s) => s.months));
      const g = scene.add.graphics();
      for (let m = 1; m <= 12; m++) {
        const mx = PANE_X + nameW + (m - 1) * cw;
        const col = sow.has(m) ? 0x5cb84a : c.growMonths.includes(m) ? 0x2f5a3a : 0x18222e;
        g.fillStyle(col, 1); g.fillRect(mx + 1, ry + 3, cw - 2, 12);
        if (m === month) { g.lineStyle(1, 0xffd257, 0.9); g.strokeRect(mx + 0.5, ry + 2.5, cw - 1, 13); }
      }
      this.content.add(g);
    });
  }

  // ── 단추 ──────────────────────────────────

  private button(key: string, x: number, y: number, w: number, h: number, label: string, onClick: () => void, on = true, danger = false): void {
    const scene = this.scene;
    const g = scene.add.graphics();
    const fill = !on ? 0x15202c : danger ? 0x3a1a16 : 0x0d4a2e;
    const stroke = !on ? 0x2a3a4a : danger ? 0xc86a5a : 0x4af2a1;
    g.fillStyle(fill, 0.95); g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1.2, stroke, 0.95); g.strokeRoundedRect(x, y, w, h, 4);
    const txt = scene.add.text(x + w / 2, y + h / 2, t(label), {
      fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: !on ? '#4a5a6a' : danger ? '#ffb0a4' : '#4af2a1',
    }).setOrigin(0.5);
    clampTextWidth(txt, w - 8);
    this.content.add([g, txt]);
    this.btnRects.set(key, new Phaser.Geom.Rectangle(x, y, w, h));
    if (!on) return;
    const hit = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => txt.setColor('#ffffff'));
    hit.on('pointerout', () => txt.setColor(danger ? '#ffb0a4' : '#4af2a1'));
    hit.on('pointerdown', onClick);
    this.content.add(hit);
  }

  // ── dev 하네스 ────────────────────────────

  /** 하네스: 칸 고르기 · 모드 바꾸기 */
  devSelect(idx: number, mode: Mode = 'cell'): void { this.sel = idx; this.mode = mode; this.render(); }

  // ── 가이드 ────────────────────────────────

  private buildTour(): TourOptions {
    const indoor = this.indoor;
    return {
      id: indoor ? 'farm_indoor' : 'farm_plot',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: indoor ? [
        { text: '집 안 선반이다. 시루에는 콩나물 · 숙주 · 새싹을, 수경 재배기에는 잎채소를 기른다. 철을 타지 않는다.', target: () => this.gridRect() },
        { text: '칸을 누르면 오른쪽에 자라는 정도와 거둘 때가 보인다.', target: () => this.paneRect() },
        { text: '시루는 자주 물을 줘야 곧게 자란다. 물을 한 번 줘 보자.', target: () => this.buttonRect('water'), wait: () => this.did.water > 0 },
      ] : [
        { text: '텃밭 한 구획이다. 한 칸이 한 평 남짓 — 실제 시간대로, 실제 계절대로 자란다. 꺼 둔 동안에도 자란다.', target: () => this.gridRect() },
        {
          text: '먼저 호미로 흙을 일군다. 칸을 고르고 「일구기」를 눌러 보자.',
          target: () => this.buttonRect('till') ?? this.paneRect(),
          skipIf: () => !InventoryStore.find(HOMI_ID) || this.plot().cells[this.sel]?.tilled === true,
          wait: () => this.did.till > 0,
        },
        {
          text: '일군 칸에 씨앗이나 모종을 심는다. 모종은 비싸지만 싹 틔우는 몇 주를 건너뛴다.',
          target: () => this.buttonRect('plant') ?? this.paneRect(),
          skipIf: () => this.plantables().length === 0 || !this.plot().cells[this.sel]?.tilled,
          wait: () => this.did.plant > 0,
        },
        { text: '비가 오면 저절로 물이 든다. 흙이 마르면 자람이 멈추고 품질이 조금씩 떨어질 뿐 — 시들어도 죽지는 않는다.', target: () => this.buttonRect('water') },
        { text: '거둔 채소는 식자재마트 · 식당이 산다. 값은 철과 그 주 날씨를 따라 오르내린다. 직접 기른 채소라야 요리가 별 다섯이 된다.', target: () => this.paneRect() },
      ],
    };
  }
}
