/**
 * @file FarmPanel.ts
 * @description 235차 — 텃밭 창: 칸 격자(마당 4×3 · 집 안 선반 4) + 고른 칸 자세히 + 할 일 단추 + 심기 목록 + 설비 + 절기 달력
 *
 * - 칸을 누르면 오른쪽에 그 칸이 보인다(자람 · 흙 · 품질 · 다음 수확까지) — 할 일은 그 칸에 맞는 단추만 뜬다.
 * - 「심기」는 가방의 씨앗 · 모종 · 종구 목록으로 바뀐다. 못 심는 것은 까닭(철 · 자격 · 수량)을 회색으로 붙인다.
 * - 「물 주기」는 구획 전체(물뿌리개). 「설비」는 빗물통 · 비닐 터널 · 차광막 · 냉수 수조(마당)를 놓고 걷는다.
 * - 「절기 독해」를 배우면 「달력」이 열린다 — 작물마다 심는 달 · 자라는 달.
 * - 조작 안내 문구는 창에 넣지 않는다(R11) — 처음 열 때 체험 가이드가 짚는다(`buildTour`).
 * - 238차 — 관리 표가 있는 작물(고추 · 토마토 · 가지 · 오이 …)은 칸 자세히에 「단계 · 포기당 · 익음 · 병 · 할 일」이 붙는다.
 *   할 일 단추는 작업 장면(`FarmWorkPanel`)을 열고, 끝나면 점수와 함께 `FarmStore.doCare`. 육묘 트레이 칸은 모종을 거둔다.
 * - 245차 — 84종 모두 할 일이 있다. 같은 구획의 같은 작물 칸에 같은 일이 떠 있으면 단추에 「(n칸)」이 붙고 한 번에 한다
 *   (`FarmStore.careGroup` · `doCareGroup`). 「다음:」 줄은 날 · 달력(「n일 뒤」)과 거둔 뒤 일(「거둔 뒤」)을 가린다.
 * - 247차 — 재배 요소: 물은 양(조금 · 보통 · 흠뻑)을 골라 구획 전체(위 줄) · 이 칸만(흙 줄 아래)에 준다. 흙 막대에 그 작물의 알맞은 띠를 그린다.
 *   거두기 단추 이름은 거두는 손(따기 · 베기 · 캐기 · 뽑기 · 모종 꺼내기)이고, 깨 · 콩 · 보리 · 땅콩 · 마늘 · 양파는 베어(캐어) 칸에서 말린 뒤
 *   털기(작업 장면) → 키질(키가 있으면) → 가방. 육묘 트레이는 꺼내기 창(`TrayPullPanel`)으로 한 포기씩 · 한 줄씩 꺼낸다.
 *   「기르는 법」은 그 작물의 물 · 거름 · 품 · 도구 · 거둔 뒤 손질 · 알맞은 철 · 늘리기를 한 장에 보인다. 저절로 난 싹은 자라기 전까지 「이름 모를 싹」.
 */

import Phaser from 'phaser';
import {
  CROP_DATABASE, FARM_COLS, GRADE_KO, cellReady, cellStage, cropStartOfItem, daysToNextHarvest, getCrop, supplyOfFacility,
  gradeOf, interimOpen, kstMonthOf, seasonFactor, startOf, FARM_SUPPLIES, cropGate,
  CARE_TASK_KO, RIPE_STAGE_KO, ripeStageOf, perPlantYield, hasCarePlan, cellDay, harvestPreview,
  // 247차 — 재배 요소
  cultivationOf, waterLineKo, toolLineKo, processLineKo, timingLineKo, laborLineKo, propagateLineKo, OFF_TIMING_KO, MOISTURE_STATE_KO,
  processHoursLeft, wildUnknown, WATER_AMOUNT_KO, WATER_AMOUNT_EN,
  CURE_STATION_FACILITY,
  type FarmCellState, type FarmFacility, type FarmPlotState, type LicenseType, type WaterAmount,
} from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { cv, cvCss } from './ColorAssist.js';
import { addPixelIcon } from './PixelIcon.js';
import { createItemIcon } from './ItemIcon.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { FarmStore, INDOOR_PLOT, HOMI_ID, WATERING_CAN_ID, type FarmActionResult, type FarmCareRow } from '../store/FarmStore.js';
import { careTaskIcon } from './FarmWorkPanel.js';
import { openCareTask, openProcess, openTray, type FarmActionHost } from './FarmActions.js';
import { InventoryStore, type InvItem } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { startItemName, cropItemTemplate } from '../data/CropItems.js';
import { t, getLocale } from '../i18n/I18n.js';
import { playSfx } from '../audio/SfxBank.js';
import { qtyWord } from './QtyLabel.js';
import { CurePanel } from './CurePanel.js';
import { CureQueue } from '../store/CureQueue.js';

const PANEL_W = 780;
/** 238차 — 관리 작업 줄(단계 · 병 · 할 일)이 붙어 조금 높다 · 247차 이 칸 물 주기 줄 */
const PANEL_H = 600;
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

/** 247차 — 말리는 칸의 (아직 못 누르는) 마지막 손 단추 이름 */
const PROCESS_LABEL: Record<'thresh' | 'pick' | 'gather', string> = { thresh: '털기', pick: '꼬투리 따기', gather: '묶어 거두기' };

/** 설비 → 칩 아이콘 */
const FACILITY_ICON: Record<FarmFacility, string> = {
  compost: 'it_compost', rainBarrel: 'it_rain_barrel', greenhouse: 'it_tunnel', shade: 'it_shade_net',
  hydroRack: 'it_hydro_rack', coldWater: 'it_cold_tank', sproutJar: 'it_sprout_jar',
  dryingRack: 'it_drying_rack', crock: 'it_crock',
};

/** 285차 — 갈무리 설비(누르면 갈무리 창) */
const CURE_FACILITY = new Set<FarmFacility>(['dryingRack', 'crock']);

/** 247차 — guide = 고른 칸 작물의 기르는 법 */
type Mode = 'cell' | 'plant' | 'facility' | 'almanac' | 'guide';

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
  /** 238차 — 작업 장면 같은 하위 창을 씬의 팝업 스택에 올린다 */
  openPopup?: (build: (close: () => void) => DraggablePanel) => void;
  /** 247차 — 처음 고를 칸(필드에서 칸을 겨누고 연 경우) */
  cell?: number;
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
  private did = { till: 0, plant: 0, water: 0, care: 0 };
  /** 단추 자리(가이드가 짚는다) */
  private btnRects = new Map<string, Phaser.Geom.Rectangle>();

  constructor(scene: Phaser.Scene, x: number, y: number, opts: FarmPanelOpts) {
    const indoor = opts.plotId === INDOOR_PLOT;
    // 236차 — 마당 두 구획을 넘는 텃밭은 마을 농지를 빌린 것이다(사용료 · 밀리면 새로 못 심음)
    const title = indoor ? '집 안 선반' : GameState.isRentedPlot(opts.plotId) ? '빌린 텃밭' : '텃밭';
    super(scene, { x, y, width: PANEL_W, height: indoor ? PANEL_H_INDOOR : PANEL_H, title, onClose: opts.onClose, depth: 846 });
    this.opts = opts;
    FarmStore.advanceAll();
    // 처음 열면 무엇이 자라는 첫 칸을 고른다(없으면 첫 칸)
    const cells = this.plot().cells;
    const firstCrop = cells.findIndex((c) => !!c.cropId);
    this.sel = opts.cell !== undefined && opts.cell >= 0 && opts.cell < cells.length ? opts.cell : firstCrop >= 0 ? firstCrop : 0;
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

  /** 285차 — 갈무리 창(걸대 · 장독) */
  private openCure(): void {
    const build = (close: () => void): DraggablePanel => new CurePanel(this.scene, this.x + 60, this.y + 30, this.opts.plotId, {
      onClose: () => { close(); if (this.active) this.render(); },
      onChanged: () => { this.opts.onChanged?.(); },
      log: this.opts.log,
      confirm: this.opts.confirm,
    });
    if (this.opts.openPopup) this.opts.openPopup(build);
    else this.scene.add.existing(build(() => undefined));
    restoreHandCursor(this.scene);
  }

  /** 행동 결과 → 상태 줄 · 로그 · 필드 갱신 */
  private after(r: FarmActionResult): void {
    this.setStatus(r.message, r.ok);
    if (!r.ok) playSfx('deny');
    if (r.ok) {
      this.opts.onChanged?.();
      for (const h of r.harvested ?? []) this.opts.log?.(`[텃밭] ${h.name} ${qtyWord({ unitG: cropItemTemplate(h.itemId)?.unitG }, h.qty, '×')}`);
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
    else if (this.mode === 'guide') this.renderGuide();
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
      // 236차 — 전기료가 밀려 단전이면 재배기 칩을 붉은 테 · 흐린 그림으로(멈췄다는 표시)
      const off = f === 'hydroRack' && GameState.powerCut();
      const chip = scene.add.graphics();
      chip.fillStyle(off ? 0x2a1414 : 0x10233a, 0.95); chip.fillRoundedRect(x, y, 26, 26, 4);
      chip.lineStyle(1, off ? 0xd65a4a : 0x2f5a80, 0.9); chip.strokeRoundedRect(x, y, 26, 26, 4);
      this.content.add(chip);
      const ic = addPixelIcon(scene, FACILITY_ICON[f], x + 13, y + 13, 16);
      if (ic) { if (off) ic.setAlpha(0.35); this.content.add(ic); }
      const cure = CURE_FACILITY.has(f);
      const hit = scene.add.rectangle(x + 13, y + 13, 26, 26, 0xffffff, 0.001).setInteractive(cure ? { useHandCursor: true } : undefined);
      const name = off ? `${supplyOfFacility(f)?.nameKo ?? ''} — 전기가 끊겨 멈췄다` : (supplyOfFacility(f)?.nameKo ?? '');
      hit.on('pointerover', () => this.setStatus(name));
      // 285차 — 걸대 · 장독 칩을 누르면 갈무리 창(다 된 것이 있으면 칩에 초록 점)
      if (cure) {
        hit.on('pointerdown', () => this.openCure());
        const ready = CureQueue.at(this.opts.plotId).some((b) => b.readyAtMs <= Date.now() && CURE_STATION_FACILITY[b.station] === f);
        if (ready) { const dot = scene.add.circle(x + 22, y + 4, 4, 0x4af2a1, 1).setStrokeStyle(1, 0x0b1a10, 1); this.content.add(dot); }
      }
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
    const toggle = (m: Mode): void => { this.mode = this.mode === m ? 'cell' : m; this.scroll = 0; this.render(); };
    if (GameState.skillBonus('farm_calendar') >= 1) btn('almanac', this.mode === 'almanac' ? '칸 보기' : '달력', () => toggle('almanac'));
    if (!this.indoor) btn('facility', this.mode === 'facility' ? '칸 보기' : '설비', () => toggle('facility'));
    // 247차 — 고른 칸 작물의 기르는 법
    const selCrop = this.plot().cells[this.sel]?.cropId;
    if (selCrop && !wildUnknown(this.plot().cells[this.sel])) btn('guide', this.mode === 'guide' ? '칸 보기' : '기르는 법', () => toggle('guide'));
    // 247차 — 구획 전체 물 주기(양을 고른다 · 흠뻑 → 보통 → 조금 순으로 오른쪽부터)
    const can = this.indoor || !!InventoryStore.find(WATERING_CAN_ID);
    for (const a of ['deep', 'normal', 'light'] as WaterAmount[]) {
      btn(a === 'normal' ? 'water' : `water_${a}`, `물 ${WATER_AMOUNT_KO[a]}`, () => this.water(a), can);
    }
  }

  /** 247차 — 물 주기(칸을 주면 그 칸만 · 없으면 구획 전체) */
  private water(amount: WaterAmount, cell?: number): void {
    const r = FarmStore.water(this.opts.plotId, amount, cell === undefined ? undefined : [cell]);
    if (r.ok) { this.did.water++; playSfx('farm_water'); }
    this.after(r);
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
      // 247차 — 베어(캐어) 말리는 칸은 눕힌 단 · 다 마르면 누렇게
      if (stage === 'drying' || stage === 'dried') this.paintDrying(g, cx, cy, stage === 'dried', crop?.id ?? '');
      const stageIcon = stage === 'seeded' ? 'farm_seeded' : stage === 'young' ? 'farm_young' : stage === 'growing' || stage === 'ready' ? 'farm_growing' : stage === 'resting' ? 'farm_resting' : null;
      if (stageIcon) {
        const ic = addPixelIcon(scene, stageIcon, cx + CELL / 2, cy + CELL / 2 + 4, 48);
        if (ic) this.content.add(ic);
      }
      if (crop && stage === 'ready') {
        const pv = harvestPreview(c, crop);
        const ready = addPixelIcon(scene, pv.itemId, cx + CELL - 20, cy + 20, 32);
        if (ready) this.content.add(ready);
      }
      // 238차 — 든 병(가장 심한 것) · 서리
      const dz = FarmStore.diseases(this.opts.plotId, i).sort((a, b) => b.severity - a.severity)[0];
      if (dz) {
        const di = addPixelIcon(scene, `dz_${dz.id}`, cx + 12, cy + CELL - 12, 16);
        if (di) this.content.add(di);
      }
      if (c.frostedAt) {
        const frost = scene.add.rectangle(cx + CELL / 2, cy + CELL / 2, CELL, CELL, cv(0x9fb8ff), 0.22);
        this.content.add(frost);
      }
      if (crop && interimOpen(c, crop) && crop.interim) {
        const ii = addPixelIcon(scene, crop.interim.itemId, cx + 12, cy + CELL - 12, 16);
        if (ii) this.content.add(ii);
      }
      // 흙이 마르면 물방울(247차 — 그 작물의 알맞은 띠 아래면 · 조금 마르면 흐리게) · 너무 젖으면 푸른 막 · 철이 아니면 회색 막
      const ws = this.indoor && crop?.site === 'plot' ? null : FarmStore.waterState(this.opts.plotId, i);
      if (ws && (ws.state === 'dry' || ws.state === 'low')) {
        const d = addPixelIcon(scene, 'hydration', cx + 12, cy + 12, 16);
        if (d) this.content.add(d.setAlpha(ws.state === 'dry' ? 0.95 : 0.5));
      } else if (ws?.state === 'wet' && crop) {
        this.content.add(scene.add.rectangle(cx + CELL / 2, cy + CELL / 2, CELL - 4, CELL - 4, cv(0x2a5aa0), 0.22));
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

  /** 247차 — 말리는 단(콩 · 깨 · 보리는 눕힌 다발, 마늘 · 양파 · 땅콩은 줄지어 놓은 알뿌리 · 포기) */
  private paintDrying(g: Phaser.GameObjects.Graphics, x: number, y: number, dry: boolean, cropId: string): void {
    const bulb = cropId === 'garlic' || cropId === 'onion' || cropId === 'peanut';
    const col = dry ? 0xd8b860 : 0x8a9a4a;
    for (let k = 0; k < 3; k++) {
      const yy = y + 16 + k * 20;
      if (bulb) {
        g.fillStyle(dry ? 0xc8b070 : 0x7a8a40, 1); g.fillRect(x + 8, yy + 2, 30, 3);
        g.fillStyle(cropId === 'onion' ? 0xc89a5a : cropId === 'peanut' ? 0xc8a870 : 0xeee6d4, 1);
        for (let j = 0; j < 3; j++) g.fillCircle(x + 42 + j * 9, yy + 3, 4);
      } else {
        g.lineStyle(2, col, 1);
        for (let j = -1; j <= 1; j++) g.lineBetween(x + 8, yy + j * 2, x + CELL - 10, yy + j * 2 - 3);
        g.fillStyle(0xe8d8a0, 1); g.fillRect(x + 24, yy - 4, 3, 7);
      }
    }
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
    // 247차 — 저절로 난 싹은 좀 자라야 무엇인지 안다
    const unknown = wildUnknown(c);
    const title = unknown ? '이름 모를 싹' : crop ? crop.nameKo : c.tilled ? '빈 칸' : '일구지 않은 땅';
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

    if (crop && unknown) {
      // 247차 — 이름 모를 싹: 묵힌 칸에 저절로 났다(바람 · 새가 옮긴 씨 · 지난해 떨어진 씨)
      const days = c.plantedAt ? Math.floor((Date.now() - c.plantedAt) / 86_400_000) : 0;
      row('지금', `묵힌 흙에서 저절로 싹이 텄다 · ${days > 0 ? `${days}일 전` : '오늘'}`, '#c8dceb');
      bar('자람', c.growth, 0x6ac46a, `${Math.round(c.growth * 100)}%`);
      row('무엇인가', '조금 더 자라면 잎 모양으로 알아본다', '#9fb8c8');
    } else if (crop && c.process) {
      // 247차 — 베어(캐어) 밭에서 말리는 중 · 다 말랐다
      const def = cultivationOf(crop).process;
      if (!c.process.dryAt) {
        const left = processHoursLeft(c);
        const total = (def?.dryDays ?? 1) * 24;
        bar('말리는 중', 1 - left / total, 0xd8b860, `${Math.max(1, Math.ceil(left / 24))}일 남음`);
        row('지금', '밭에 눕혀 말린다 — 비 오는 동안은 마르지 않는다', '#c8dceb');
      } else {
        const overDays = (Date.now() - c.process.dryAt) / 86_400_000;
        const late = def?.shatterDays !== undefined && overDays > def.shatterDays;
        row('지금', late ? '다 말랐는데 너무 오래 뒀다 — 꼬투리가 터져 알이 쏟아진다' : `다 말랐다 — ${def ? `${def.last === 'thresh' ? '털 때' : def.last === 'pick' ? '꼬투리를 딸 때' : '거둘 때'}` : ''}`,
          late ? '#ff9a7a' : '#8affb0');
      }
      if ((c.process.rainH ?? 0) > 6) row('비', '말리는 동안 비를 맞았다 — 품질이 조금 떨어졌다', '#ff9a7a');
      const grade = gradeOf(c.quality);
      bar('품질', c.quality, grade === 'special' ? 0xffd257 : grade === 'good' ? 0x8fd4ff : 0x9aa8b4, GRADE_KO[grade]);
    } else if (crop) {
      const st = startOf(crop, c.start);
      const days = c.plantedAt ? Math.floor((Date.now() - c.plantedAt) / 86_400_000) : 0;
      row('심은 것', c.wild ? `저절로 난 싹 · ${days > 0 ? `${days}일 전` : '오늘'}` : `${st ? startItemName(crop, st) : crop.nameKo} · ${days > 0 ? `${days}일 전` : '오늘'}`);
      // 247차 — 알맞은 철 밖에 심었다
      if (c.offTiming) row('철', `알맞은 철 밖 — ${OFF_TIMING_KO[c.offTiming]} (수량 −15%)`, '#ffb070');
      // 238차 — 어느 단계인가(육묘 · 활착기 · 초기 생장 · 개화 착과 · 수확기 · 서리)
      const stage = this.stageLine(c, crop);
      if (stage) row('단계', stage.text, stage.color);
      if (c.resting) row('지금', '거둔 뒤 쉬는 중 — 철이 바뀌면 다시 올라온다', '#c8b890');
      else {
        const prog = c.picks > 0 ? c.regrow : c.growth;
        const left = daysToNextHarvest(c, this.plot(), Date.now());
        bar(c.picks > 0 ? '다시 자람' : '자람', prog, 0x6ac46a, `${Math.round(prog * 100)}%`);
        const readyText = c.nursery ? '모종이 됐다 — 거둬서 밭에 옮겨 심는다' : c.frostedAt ? '서리 맞은 끝물 — 지금 거두면 끝' : '지금 거둘 수 있다';
        row('거둘 때', cellReady(c) ? readyText : c.frostedAt ? '서리를 맞았다 — 더 자라지 않는다' : left === null ? '철이 아니다 — 철이 오면 다시 자란다' : `약 ${Math.max(1, Math.ceil(left))}일 뒤`,
          cellReady(c) ? '#8affb0' : left === null ? '#c8b890' : '#e8f2fa');
        // 238차 — 익는 단계(풋고추 · 검붉게 익는 중 · 홍고추)
        const ripe = ripeStageOf(c, crop);
        if (ripe) row('익음', ripe === 'turning' ? `${RIPE_STAGE_KO[ripe]} — 꼭지 끝까지 빨개지면 홍고추` : RIPE_STAGE_KO[ripe], ripe === 'green' ? '#8affb0' : ripe === 'turning' ? '#ff9a5a' : '#ff6a5a');
      }
      const grade = gradeOf(c.quality);
      bar('품질', c.quality, grade === 'special' ? 0xffd257 : grade === 'good' ? 0x8fd4ff : 0x9aa8b4, GRADE_KO[grade]);
      if (c.start === 'seed') row('싹 튼 비율', `${Math.round(c.stand * 100)}%`);
      else row('뿌리 내림', `${Math.round(c.stand * 100)}%`);
      if (crop.harvest.repeat && !c.nursery) row('딴 횟수', `${c.picks} / ${crop.harvest.repeat.times + 1}`);
      // 238차 — 포기당 거두는 수(모종 칸) · 병 · 쓰러짐
      if (st?.kind === 'seedling' && crop.category === 'fruit' && hasCarePlan(crop)) {
        const [a, b] = perPlantYield(crop, st.perCell);
        row('포기당', `한 번에 ${a}~${b}개 × ${st.perCell}포기`);
      }
      for (const d of FarmStore.diseases(this.opts.plotId, this.sel)) {
        const ic = addPixelIcon(scene, `dz_${d.id}`, PANE_X + 8, y + 9, 16);
        if (ic) this.content.add(ic);
        this.content.add(scene.add.text(PANE_X + 20, y, d.name, { fontFamily: FONT, fontSize: '12px', color: '#ff9a7a', fontStyle: 'bold' }));
        const bw = PANE_W - 92 - 70;
        const g = scene.add.graphics();
        g.fillStyle(0x2a1414, 1); g.fillRect(PANE_X + 92, y + 4, bw, 9);
        g.fillStyle(0xd65a4a, 1); g.fillRect(PANE_X + 92, y + 4, Math.round(bw * Math.max(0, Math.min(1, d.severity))), 9);
        g.lineStyle(1, 0x5a2a2a, 1); g.strokeRect(PANE_X + 92, y + 4, bw, 9);
        this.content.add(g);
        this.content.add(scene.add.text(PANE_X + 92 + bw + 8, y, d.severity < 0.3 ? '초기' : d.severity < 0.7 ? '번지는 중' : '심하다', { fontFamily: FONT, fontSize: '12px', color: '#ffb0a4' }));
        y += 20;
        const ctl = scene.add.text(PANE_X + 20, y, d.control, { fontFamily: FONT, fontSize: '11px', color: '#c89a7a', wordWrap: { width: PANE_W - 24 } });
        this.content.add(ctl);
        y += ctl.height + 4;
      }
      if (c.lodged) row('쓰러짐', '비바람에 쓰러졌다 — 수확이 준다', '#ff9a7a');
      const est = FarmStore.establishment(this.opts.plotId, this.sel);
      if (est) row('활착기', `${est.daysLeft}일 더 흙을 촉촉하게 — 마르면 뿌리를 못 내린다`, cvCss(c.moisture < 0.4 ? '#ff9a7a' : '#8affb0'));
    }
    if (c.tilled && !(this.indoor && crop?.site === 'plot')) {
      // 247차 — 흙 막대에 그 작물의 알맞은 띠(초록 테) · 꼬리는 마름 · 조금 마름 · 알맞음 · 너무 젖음
      const ws = FarmStore.waterState(this.opts.plotId, this.sel);
      const st = ws?.state ?? 'ok';
      const yBar = y;
      bar('흙', c.moisture, st === 'dry' ? 0xd8804a : st === 'low' ? 0xd8b04a : st === 'wet' ? 0x3a6ad0 : 0x4aa0e0, MOISTURE_STATE_KO[st]);
      if (ws && crop && !unknown) {
        const bw = PANE_W - 92 - 70;
        const bg = scene.add.graphics();
        bg.lineStyle(1, 0x8affb0, 0.95);
        bg.strokeRect(PANE_X + 92 + Math.round(bw * ws.band[0]), yBar + 2, Math.max(2, Math.round(bw * (ws.band[1] - ws.band[0]))), 13);
        this.content.add(bg);
      }
      if (ws?.stopping) row('물 끊기', '거두기 전이다 — 물을 끊어야 맛이 들고 오래 간다', '#ffb070');
      // 이 칸만 물 주기(양)
      if (!c.process) {
        this.content.add(scene.add.text(PANE_X, y + 6, t('이 칸 물'), { fontFamily: FONT, fontSize: '12px', color: '#8fb4cc' }));
        let wx = PANE_X + 92;
        const can = this.indoor || !!InventoryStore.find(WATERING_CAN_ID);
        for (const a of ['light', 'normal', 'deep'] as WaterAmount[]) {
          // 「조금 · 보통 · 흠뻑」 낱말은 영어 사전에 두지 않는다(「조금」 물때 · 등급 「보통」과 겹친다) — 언어별 표에서 바로
          const lb = getLocale() === 'en' ? WATER_AMOUNT_EN[a] : WATER_AMOUNT_KO[a];
          const w = Math.max(56, labelW(lb) + 20);
          this.button(`cell_water_${a}`, wx, y, w, 26, lb, () => this.water(a, this.sel), can);
          wx += w + 6;
        }
        y += 32;
      }
    }
    if (c.compost) row('퇴비', '이번 작기에 넣었다', '#c8b890');

    // ── 할 일 단추 ──
    y += 6;
    const buttons: { key: string; label: string; on: boolean; run: () => void; why?: string }[] = [];
    if (!c.tilled) buttons.push({ key: 'till', label: '일구기', on: !!InventoryStore.find(HOMI_ID), run: () => { const r = FarmStore.till(this.opts.plotId, this.sel); if (r.ok) { this.did.till++; playSfx('farm_till'); } this.after(r); } });
    if (c.tilled && !c.compost && !this.indoor) buttons.push({ key: 'compost', label: '퇴비 넣기', on: !!FarmStore.compostSource(), run: () => { const r = FarmStore.compost(this.opts.plotId, this.sel); if (r.ok) playSfx('farm_fertilize'); this.after(r); } });
    if (c.tilled && !c.cropId) buttons.push({ key: 'plant', label: '심기', on: true, run: () => { this.mode = 'plant'; this.scroll = 0; this.render(); } });
    // 247차 — 거두는 손에 따라 이름(따기 · 베기 · 캐기 · 뽑기 · 털기 · 모종 꺼내기)
    const hl = FarmStore.harvestLabel(this.opts.plotId, this.sel);
    if (crop && hl) buttons.push({ key: 'harvest', label: hl, on: true, run: () => this.harvestCell() });
    if (crop && c.process && !c.process.dryAt) buttons.push({ key: 'harvest', label: PROCESS_LABEL[cultivationOf(crop).process?.last ?? 'thresh'], on: false, run: () => undefined });
    // 247차 — 포기 나누기 · 뿌리 꺾꽂이(한 해를 넘긴 산채 · 그 달에)
    const prop = crop ? cultivationOf(crop).propagate : undefined;
    if (crop && prop && prop.by !== 'offset' && c.established) {
      const why = FarmStore.divideBlock(this.opts.plotId, this.sel);
      const label = prop.by === 'cutting' ? '뿌리 꺾꽂이' : prop.by === 'runner' ? '런너 모종 떼기' : '포기 나누기';
      buttons.push({ key: 'divide', label, on: !why, run: () => { const r = FarmStore.divide(this.opts.plotId, this.sel); if (r.ok) playSfx('farm_dig'); this.after(r); }, why: why ?? undefined });
    }
    // 285차 — 씨 받기(다 익은 칸을 씨로 거둔다 — 그 작기 수확 대신 · 되돌릴 수 없어 한 번 더 묻는다)
    const seedWhy = FarmStore.seedSaveBlock(this.opts.plotId, this.sel);
    if (crop && seedWhy !== undefined && cellReady(c) && !c.process) {
      buttons.push({ key: 'seedsave', label: '씨 받기', on: seedWhy === null, run: () => this.confirmSeedSave(crop.nameKo), why: seedWhy ?? undefined });
    }
    if (crop?.interim && interimOpen(c, crop)) buttons.push({ key: 'interim', label: crop.interim.seedOnly ? '솎아 내기' : '따기', on: true, run: () => { const r = FarmStore.interim(this.opts.plotId, this.sel); if (r.ok) playSfx('farm_harvest'); this.after(r); } });
    if (crop) buttons.push({ key: 'clear', label: '걷어 내기', on: true, run: () => this.confirmClear(crop.nameKo) });
    let bx = PANE_X;
    for (const b of buttons) {
      const w = Math.max(84, labelW(b.label) + 24);
      if (bx + w > PANE_X + PANE_W) { bx = PANE_X; y += 36; }
      this.button(b.key, bx, y, w, 30, b.label, b.run, b.on, b.key === 'clear');
      // 못 하는 까닭은 단추에 올리면 상태 줄에(R11 — 창에 안내 글을 박지 않는다)
      if (!b.on && b.why) {
        const why = b.why;
        const hit = scene.add.rectangle(bx + w / 2, y + 15, w, 30, 0xffffff, 0.001).setInteractive();
        hit.on('pointerover', () => this.setStatus(why, false));
        this.content.add(hit);
      }
      bx += w + 8;
    }
    if (buttons.length) y += 40;
    // 238차 — 할 일(관리 작업) — 지금 할 수 있는 것은 단추, 다음 것은 한 줄(247차 — 말리는 칸 · 이름 모를 싹은 없다)
    if (crop && !c.process && !unknown) y = this.renderCareRows(crop, y);
    // 247차 — 작물 메모는 「기르는 법」으로 옮겼다(칸 자세히는 지금 상태만)
    void y;
  }

  /**
   * 247차 — 거두기: 육묘 트레이는 꺼내기 창 · 다 마른 칸은 털기(꼬투리 따기 · 묶어 거두기) 장면 → 키질 장면 → 가방 ·
   * 그 밖은 바로(도구 · 품 · 가시는 `FarmStore.harvest`가 본다). 장면은 필드 칸과 같은 것(`FarmActions`).
   */
  private harvestCell(): void {
    const c = this.plot().cells[this.sel];
    if (c.nursery) { openTray(this.actionHost(), this.opts.plotId, this.sel, () => this.render()); return; }
    if (c.process?.dryAt) {
      const why = openProcess(this.actionHost(), this.opts.plotId, this.sel);
      if (why) this.setStatus(why, false);
      return;
    }
    const r = FarmStore.harvest(this.opts.plotId, this.sel);
    if (r.ok) playSfx('farm_harvest');
    this.after(r);
  }

  /** 247차 — 작업 장면 · 꺼내기 창을 여는 문맥(창 자리 · 끝난 뒤) */
  private actionHost(): FarmActionHost {
    return {
      scene: this.scene,
      openPopup: this.opts.openPopup,
      at: () => ({ x: this.x + 90, y: this.y + 40 }),
      after: (r, what) => {
        if (what.kind === 'care' && r.ok) this.did.care += what.cells.length;
        if (what.kind === 'tray') { this.setStatus(r.message, r.ok); if (r.ok) this.opts.onChanged?.(); return; }
        this.after(r);
      },
    };
  }


  /**
   * 238차 — 단계 한 줄(육묘 · 활착기 · 초기 생장 · 개화 착과 · 수확기 · 서리).
   * 245차 — 방아다리 · 착과는 열매 작물 말이다. 잎 · 뿌리 · 버섯 · 시루는 「자라는 중」 · 「수확기」로만.
   */
  private stageLine(c: FarmCellState, crop: ReturnType<typeof getCrop> & object): { text: string; color: string } | null {
    if (c.nursery) return { text: '육묘 중 — 집 안 트레이에서 모종을 키운다', color: '#8fd4ff' };
    if (!hasCarePlan(crop)) return null;
    if (c.frostedAt) return { text: '서리 — 끝물', color: '#9fb8ff' };
    if (c.resting) return null;
    const ready = cellReady(c) || c.picks > 0;
    if (FarmStore.establishment(this.opts.plotId, this.sel)) return { text: '활착기 — 뿌리를 내리는 2주', color: '#9fd0e4' };
    if (crop.category !== 'fruit') return ready ? { text: '수확기 — 다 자란 것부터 거둔다', color: '#8affb0' } : null;
    if (ready) return { text: '수확기 — 익는 대로 거둔다', color: '#8affb0' };
    // 「방아다리」(첫 Y자 갈림)는 고추 말 — 다른 열매 작물은 줄기 · 잎을 키우는 때로
    const pepper = crop.id === 'chili' || crop.variant?.of === 'chili';
    if (cellDay(c, Date.now()) < 14 || c.growth < 0.55) return { text: pepper ? '초기 생장 — 방아다리가 갈라진다' : '초기 생장 — 줄기와 잎을 키운다', color: '#c8dceb' };
    return { text: '개화 · 착과 — 꽃이 피고 열매가 든다', color: '#ffe28a' };
  }

  /** 245차 — 다음 할 일 꼬리: 날 · 달력은 「n일 뒤」, 거둔 뒤 일은 「거둔 뒤」 */
  private nextWhen(r: FarmCareRow): string {
    return r.st.daysLeft < 0 ? '거둔 뒤' : `${r.st.daysLeft}일 뒤`;
  }

  /** 238차 — 할 일 줄(작업 장면으로) */
  private renderCareRows(crop: NonNullable<ReturnType<typeof getCrop>>, y: number): number {
    const scene = this.scene;
    const rows = FarmStore.careRows(this.opts.plotId, this.sel);
    if (!rows.length) return y;
    const due = rows.filter((r) => r.st.status === 'due');
    // 245차 — 「다음」은 날 · 달력 일 중 가장 가까운 것, 없으면 거둔 뒤 일
    const upcoming = rows.filter((r) => r.st.status === 'upcoming');
    const next = upcoming.filter((r) => r.st.daysLeft >= 0).sort((a, b) => a.st.daysLeft - b.st.daysLeft)[0] ?? upcoming[0];
    this.content.add(scene.add.text(PANE_X, y, t('할 일'), { fontFamily: FONT, fontSize: '12px', color: '#8fb4cc' }));
    if (!due.length) {
      const msg = next ? `${CARE_TASK_KO[next.st.def.id]} — ${this.nextWhen(next)}` : '지금은 없다';
      this.content.add(scene.add.text(PANE_X + 92, y, t(msg), { fontFamily: FONT, fontSize: '12px', color: '#c8dceb' }));
      return y + 22;
    }
    let bx = PANE_X + 92;
    let ry = y - 4;
    for (const r of due) {
      // 차례가 있는 일(웃거름 · 유인 · 곁순)만 「n/N」 — 철 따라 치는 약 · 걷어 내기는 이름만
      const name = r.st.def.repeat && !r.st.def.only ? `${CARE_TASK_KO[r.st.def.id]} ${r.st.round + 1}/${r.st.total}` : CARE_TASK_KO[r.st.def.id];
      // 245차 — 같은 작물 칸 여럿에 같은 일이 떠 있으면 한 번에(「(n칸)」)
      const group = r.missing.length === 0 ? FarmStore.careGroup(this.opts.plotId, this.sel, r.st.def.id) : [this.sel];
      const label = group.length > 1 ? `${name} (${group.length}칸)` : name;
      const w = Math.max(96, labelW(label) + 44);
      if (bx + w > PANE_X + PANE_W) { bx = PANE_X + 92; ry += 34; }
      const on = r.missing.length === 0;
      this.button(`care_${r.st.def.id}`, bx, ry, w, 28, label, () => this.openWork(r), on);
      const ic = careTaskIcon(scene, r.st, bx + 14, ry + 14, 16, crop);
      if (ic) { if (!on) ic.setAlpha(0.4); this.content.add(ic); }
      if (!on) {
        const hit = scene.add.rectangle(bx + w / 2, ry + 14, w, 28, 0xffffff, 0.001).setInteractive();
        hit.on('pointerover', () => this.setStatus(FarmStore.missingLineKo(r.missing), false));
        this.content.add(hit);
      }
      bx += w + 8;
    }
    ry += 34;
    if (next) {
      this.content.add(scene.add.text(PANE_X + 92, ry, t(`다음: ${CARE_TASK_KO[next.st.def.id]} — ${this.nextWhen(next)}`), { fontFamily: FONT, fontSize: '11px', color: '#7f93a3' }));
      ry += 18;
    }
    return ry + 4;
  }

  /** 238차 — 작업 장면을 연다. 끝나면 점수와 함께 작업을 한다 · 245차 같은 작물 칸 여럿이면 한 번에(247차 — 장면은 `FarmActions`) */
  private openWork(r: FarmCareRow): void {
    const group = FarmStore.careGroup(this.opts.plotId, this.sel, r.st.def.id);
    const why = openCareTask(this.actionHost(), this.opts.plotId, this.sel, r.st.def.id, group);
    if (why) this.setStatus(why, false);
  }

  /** 285차 — 씨 받기(칸이 끝난다) */
  private confirmSeedSave(name: string): void {
    const run = (): void => { const r = FarmStore.saveSeeds(this.opts.plotId, this.sel); if (r.ok) playSfx('farm_harvest'); this.after(r); };
    if (this.opts.confirm) this.opts.confirm(`${name}\n이번에는 거두지 않고 씨를 받는다. 칸은 비워진다.`, run, { yes: '씨 받기', no: '취소' });
    else run();
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
      this.content.add(scene.add.text(PANE_X, y, t('가방에 심을 것이 없다 — 씨앗은 생활용품점 · 종묘사, 모종은 종묘사에서 판다'), {
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
      const name = scene.add.text(PANE_X + 38, ry + 3, `${it.name}  ${qtyWord(it, it.qty)}`, { fontFamily: FONT, fontSize: '12px', color: chk.ok ? '#e8f2fa' : '#7f93a3', fontStyle: 'bold' });
      clampTextWidth(name, PANE_W - 46);
      this.content.add(name);
      // 247차 — 심을 수는 있어도 알려 줄 것(알맞은 철 밖 · 거름이 많거나 모자라다)
      const note = chk.ok ? FarmStore.plantNoteKo(this.opts.plotId, this.sel, it.id) : null;
      const why = scene.add.text(PANE_X + 38, ry + 19, chk.ok ? t(note ?? '누르면 이 칸에 심는다') : t(chk.reasonKo ?? ''), { fontFamily: FONT, fontSize: '11px', color: chk.ok ? (note ? '#ffc070' : '#8affb0') : '#c89a7a' });
      clampTextWidth(why, PANE_W - 46);
      this.content.add(why);
      if (chk.ok) {
        const hit = scene.add.rectangle(PANE_X + PANE_W / 2, ry + (ROW_H - 4) / 2, PANE_W, ROW_H - 4, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          const r = FarmStore.plant(this.opts.plotId, this.sel, it.id);
          if (r.ok) { this.did.plant++; this.mode = 'cell'; playSfx('farm_plant'); }
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

  /**
   * 247차 — 기르는 법: 고른 칸 작물의 물(양 · 알맞은 흙 · 과습 탈 · 물 끊기) · 품 · 거름 · 도구 · 거둔 뒤 손질 · 알맞은 철 · 늘리기 + 메모.
   * 사용자 「작물별로 여러 가지 고려사항(시기 · 노동 피로 · 도구 · 행위의 정도)」을 한 장에 — 줄마다 머리말 · 줄바꿈 흐름 배치.
   */
  private renderGuide(): void {
    const scene = this.scene;
    const c = this.plot().cells[this.sel];
    const crop = c?.cropId ? getCrop(c.cropId) : undefined;
    let y = this.contentTop + 40;
    if (!crop) { this.mode = 'cell'; this.renderCellPane(); return; }
    this.content.add(scene.add.text(PANE_X, y, `${crop.nameKo} — ${t('기르는 법')}`, { fontFamily: FONT, fontSize: '15px', color: '#ffe28a', fontStyle: 'bold' }));
    y += 30;
    const lines: [string, string][] = [
      ['물', waterLineKo(crop)],
      ['품 · 거름', laborLineKo(crop)],
      ['도구', toolLineKo(crop)],
      ['거둔 뒤 손질', processLineKo(crop)],
      ['알맞은 철', timingLineKo(crop)],
      ['늘리기', propagateLineKo(crop)],
    ];
    for (const [label, value] of lines) {
      if (!value) continue;
      // 이름 칸은 70px — 영어 이름이 길면 줄을 바꾸고, 줄 높이는 이름 · 값 가운데 큰 쪽(겹침 방지)
      const k = scene.add.text(PANE_X, y, t(label), { fontFamily: FONT, fontSize: '12px', color: '#8fb4cc', wordWrap: { width: 70 } });
      this.content.add(k);
      const v = scene.add.text(PANE_X + 76, y, value, { fontFamily: FONT, fontSize: '12px', color: '#e8f2fa', wordWrap: { width: PANE_W - 80 }, lineSpacing: 2 });
      this.content.add(v);
      y += Math.max(k.height, v.height) + 8;
    }
    y += 4;
    const note = scene.add.text(PANE_X, y, crop.noteKo, { fontFamily: FONT, fontSize: '12px', color: '#9fb8c8', wordWrap: { width: PANE_W }, lineSpacing: 3 });
    this.content.add(note);
  }

  /** 설비 — 놓은 것(걷기) · 가방의 농자재(놓기) */
  private renderFacilityList(): void {
    const scene = this.scene;
    let y = this.contentTop + 40;
    this.content.add(scene.add.text(PANE_X, y, t('설비'), { fontFamily: FONT, fontSize: '15px', color: '#ffe28a', fontStyle: 'bold' }));
    y += 32;
    const p = this.plot();
    const rows: { icon: string; name: string; desc: string; act: string; on: boolean; run: () => void; act2?: string; run2?: () => void }[] = [];
    for (const f of p.facilities) {
      const s = FARM_SUPPLIES.find((x) => x.facility === f);
      if (!s) continue;
      // 285차 — 걸대 · 장독은 「갈무리」 단추가 하나 더(걸어 둔 것이 있으면 걷지 못한다 — FarmStore가 막는다)
      if (CURE_FACILITY.has(f)) {
        rows.push({
          icon: FACILITY_ICON[f], name: s.nameKo, desc: s.descKo, act: '설비 걷기', on: true, run: () => this.after(FarmStore.uninstall(this.opts.plotId, f)),
          act2: '갈무리', run2: () => this.openCure(),
        });
      } else rows.push({ icon: FACILITY_ICON[f], name: s.nameKo, desc: s.descKo, act: '설비 걷기', on: true, run: () => this.after(FarmStore.uninstall(this.opts.plotId, f)) });
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
      // 285차 — 설명 줄 수로 칸 높이를 잰다(단추 둘이면 설명 폭이 좁아 줄이 는다 — 흐름 배치)
      const d = scene.add.text(PANE_X + 44, y + 22, r.desc, { fontFamily: FONT, fontSize: '11px', color: '#9fb8c8', wordWrap: { width: PANE_W - 44 - (r.act2 ? 156 : 84) } });
      const h = Math.max(58, Math.ceil(d.height) + 28);
      if (y + h > this.ph - 40) { d.destroy(); break; }
      const g = scene.add.graphics();
      g.fillStyle(0x10283a, 0.95); g.fillRoundedRect(PANE_X, y, PANE_W, h, 4);
      this.content.add(g);
      const ic = addPixelIcon(scene, r.icon, PANE_X + 20, y + h / 2, 32);
      if (ic) this.content.add(ic);
      this.content.add(scene.add.text(PANE_X + 44, y + 5, r.name, { fontFamily: FONT, fontSize: '12px', color: '#e8f2fa', fontStyle: 'bold' }));
      this.content.add(d);
      this.button(`fac_${r.name}`, PANE_X + PANE_W - 74, y + h / 2 - 13, 66, 26, r.act, r.run, r.on);
      if (r.act2 && r.run2) this.button(`fac2_${r.name}`, PANE_X + PANE_W - 146, y + h / 2 - 13, 66, 26, r.act2, r.run2, true);
      y += h + 6;
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
    // 237차 — 아직 못 기르는 단계(레벨 · 유기농업기능사)는 이름을 흐리게(가장 쉬운 심는 방법 기준)
    const lv = GameState.player.level ?? 1;
    const growable = (c: typeof crops[number]): boolean => c.starts.some((st) => {
      const g = cropGate(c, st);
      return lv >= g.level && (!g.license || GameState.hasLicense(g.license as LicenseType));
    });
    crops.slice(this.scroll, this.scroll + rows).forEach((c, k) => {
      const ry = y + k * 20;
      const nm = scene.add.text(PANE_X, ry + 2, c.nameKo, { fontFamily: FONT, fontSize: '11px', color: growable(c) ? '#c8dceb' : '#5f7080' });
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
        { text: '텃밭 한 구획이다. 한 칸이 1㎡ 남짓 — 실제 시간대로, 실제 계절대로 자란다. 꺼 둔 동안에도 자란다.', target: () => this.gridRect() },
        {
          text: '먼저 호미로 흙을 일군다. 칸을 고르고 「일구기」를 눌러 보자.',
          target: () => this.buttonRect('till') ?? this.paneRect(),
          skipIf: () => !InventoryStore.find(HOMI_ID) || this.plot().cells[this.sel]?.tilled === true,
          wait: () => this.did.till > 0,
        },
        {
          text: '일군 칸에 씨앗이나 모종을 심는다. 모종은 비싸지만 싹 틔우는 몇 주를 건너뛴다. 모종과 농자재는 종묘사가 판다.',
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
