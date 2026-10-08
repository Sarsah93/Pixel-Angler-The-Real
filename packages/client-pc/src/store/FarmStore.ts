/**
 * @file FarmStore.ts
 * @description 235차 — 텃밭 상태 · 시간 흐름 · 손질(갈기 · 퇴비 · 물 · 심기 · 거두기 · 설비) · 세이브
 *
 * - 마당 텃밭은 설치물(`farm_plot` 4×3칸) 하나가 구획 하나다 — 키 = 설치물 `instanceId`.
 *   집 안 선반(시루 · 수경 재배기)은 구획 `indoor` 하나(4칸)이고, 설비는 집에 놓인 가구에서 읽는다.
 * - **실제 시간대로 자란다** — 꺼 둔 동안도 core `advancePlot`이 시간 단위로 따라잡는다(최대 400일).
 *   비 = 기후 통계(`climateRainAt`) · 지금 이 시각만 화면의 날씨(홈타운)를 쓴다(보이는 비 = 맞는 비).
 * - 스킬은 효과 키로 읽는다(`farm_water` 마름 · `farm_fert` 퇴비 · `farm_pest` 방제 · `farm_sprout` 발아 ·
 *   `farm_yield` 수확량 · `farm_seed` 씨앗 회수 · `farm_till` 한 줄 갈기).
 * - 행동은 가방을 고친다(씨앗 · 모종 · 퇴비 소모 · 수확물 지급). 가방에 자리가 없으면 거두기 전에 막는다
 *   (234차 규칙 — 「넣다 실패하면 사라지는」 지급 금지).
 */

import {
  FARM_CELLS, FARM_COLS, INDOOR_SLOTS, advancePlot, canPlant, cellReady, clearCell, climateRainAt, compostCell,
  cropStartOfItem, getCrop, getFarmSupply, harvestCell, interimHarvestCell, interimOpen, kstMonthOf, newFarmPlot,
  plantCell, produceItemId, supplyOfFacility, tillCell, waterCell, newFarmCell, gradeOf,
  type CropDef, type FarmEnv, type FarmFacility, type FarmHarvestResult, type FarmPlantCtx, type FarmPlotState,
} from '@tra/core';
import { GameState } from './GameState.js';
import { InventoryStore, type InvCategory } from './InventoryStore.js';
import { StoryStore } from './StoryStore.js';
import { ExternalDataStore } from './ExternalDataStore.js';
import { cropItemTemplate } from '../data/CropItems.js';

/** 집 안 선반 구획 키 */
export const INDOOR_PLOT = 'indoor';
/** 호미 · 퇴비 · 물뿌리개 아이템 id */
export const HOMI_ID = 'farm_homi';
export const COMPOST_ID = 'farm_compost';
export const WATERING_CAN_ID = 'inv_watering_can';

export interface FarmSaveState {
  v: 1;
  plots: Record<string, FarmPlotState>;
}

export interface FarmActionResult {
  ok: boolean;
  message: string;
  /** 거둔 것(토스트 · 로그) */
  harvested?: { itemId: string; qty: number; name: string }[];
}

const fail = (message: string): FarmActionResult => ({ ok: false, message });

class FarmStoreImpl {
  private plots = new Map<string, FarmPlotState>();

  // ── 구획 ──────────────────────────────────

  /** 구획(없으면 만든다 — 마당 텃밭은 설치물 instanceId, 집 안은 `indoor`) */
  plot(id: string): FarmPlotState {
    let p = this.plots.get(id);
    if (!p) {
      p = newFarmPlot(id === INDOOR_PLOT ? 'indoor' : 'plot', Date.now());
      this.plots.set(id, p);
    }
    return p;
  }

  has(id: string): boolean { return this.plots.has(id); }

  /** 무엇이든 자라고 있는가(설치물 회수 막기) */
  hasCrops(id: string): boolean {
    return !!this.plots.get(id)?.cells.some((c) => !!c.cropId);
  }

  /**
   * 설치물을 거두며 구획을 없앤다 — 설비는 아이템으로 돌려준다. 작물이 있으면 거부(호출 쪽이 먼저 막는다).
   * @returns 돌려준 설비 수(가방 자리가 없으면 남겨 두고 false)
   */
  removePlot(id: string): { ok: boolean; message?: string } {
    const p = this.plots.get(id);
    if (!p) return { ok: true };
    if (p.cells.some((c) => !!c.cropId)) return { ok: false, message: '심어 둔 것을 다 거둔 뒤에 걷을 수 있다' };
    const back = p.facilities.map((f) => supplyOfFacility(f)).filter((s): s is NonNullable<typeof s> => !!s);
    const parts = back.map((s) => ({ tpl: cropItemTemplate(s.itemId)!, qty: 1 })).filter((x) => !!x.tpl);
    if (Object.keys(InventoryStore.slotShortfall(parts)).length) return { ok: false, message: '설비를 돌려받을 가방 자리가 없다' };
    for (const x of parts) InventoryStore.addItem(x.tpl, 1);
    this.plots.delete(id);
    GameState.markDirty();
    return { ok: true };
  }

  /** 집 안 선반의 설비 — 집에 놓인 시루 · 수경 재배기로 정한다(집 씬이 알려 준다) */
  setIndoorFacilities(fs: FarmFacility[]): void {
    const p = this.plot(INDOOR_PLOT);
    const next = [...new Set(fs)].sort();
    if (next.join(',') !== [...p.facilities].sort().join(',')) { p.facilities = next; GameState.markDirty(); }
  }

  // ── 시간 ──────────────────────────────────

  /** 성장 환경 — 비(기후 통계 + 지금 이 시각은 화면의 날씨) · 스킬 */
  env(nowMs = Date.now()): FarmEnv {
    const liveRain = this.liveRaining();
    return {
      rainAt: (ms) => (liveRain !== null && Math.abs(ms - nowMs) < 3_600_000 ? liveRain : climateRainAt(ms)),
      skill: {
        waterEff: GameState.skillMult('water_efficiency') - 1,
        fertilizer: GameState.skillMult('fertilizer') - 1,
        pestResist: 1 - GameState.skillMult('pest_resist'),
      },
    };
  }

  /** 홈타운에 있으면 화면의 날씨로 지금 비가 오는가(아니면 null — 기후 통계) */
  private liveRaining(): boolean | null {
    if (GameState.currentRegionId !== 'hometown') return null;
    const k = ExternalDataStore.getWeatherKind('hometown');
    return k === 'rain' || k === 'shower' || k === 'sleet' || k === 'snow';
  }

  /** 모든 구획을 지금까지 굴린다(창을 열 때 · 필드 틱 · 로드 직후) */
  advanceAll(nowMs = Date.now()): void {
    const env = this.env(nowMs);
    for (const p of this.plots.values()) advancePlot(p, nowMs, env);
  }

  // ── 자격 · 문맥 ───────────────────────────

  plantCtx(): FarmPlantCtx {
    return {
      hasSkill: (id) => GameState.skillRank(id) > 0,
      sproutBonus: GameState.skillMult('sprout_rate') - 1,
    };
  }

  private harvestSkills(): { yieldBonus: number; seedSaver: number } {
    return { yieldBonus: GameState.skillMult('crop_yield') - 1, seedSaver: GameState.skillBonus('seed_saver') };
  }

  // ── 손질 ──────────────────────────────────

  /** 호미로 간다 — 「개간」을 배웠으면 그 칸이 든 한 줄(4칸)을 한 번에 */
  till(plotId: string, idx: number): FarmActionResult {
    if (!InventoryStore.find(HOMI_ID)) return fail('호미가 있어야 땅을 일굴 수 있다');
    const p = this.plot(plotId);
    const targets = GameState.skillBonus('till_speed') >= 1 && p.site === 'plot'
      ? Array.from({ length: FARM_COLS }, (_, c) => Math.floor(idx / FARM_COLS) * FARM_COLS + c)
      : [idx];
    let n = 0;
    for (const i of targets) { const c = p.cells[i]; if (c && tillCell(c)) n++; }
    if (n === 0) return fail('이미 일군 땅이다');
    GameState.markDirty();
    return { ok: true, message: n > 1 ? `${n}칸을 일궜다` : '흙을 일궜다' };
  }

  /** 퇴비를 넣는다(칸 하나 · 퇴비 1) */
  compost(plotId: string, idx: number): FarmActionResult {
    const it = InventoryStore.find(COMPOST_ID);
    if (!it || it.qty <= 0) return fail('퇴비가 없다');
    const c = this.plot(plotId).cells[idx];
    if (!c?.tilled) return fail('먼저 땅을 일궈야 한다');
    if (c.compost) return fail('이번 작기에는 이미 퇴비를 넣었다');
    if (!compostCell(c)) return fail('퇴비를 넣을 수 없다');
    InventoryStore.removeQty(COMPOST_ID, 1);
    GameState.markDirty();
    return { ok: true, message: '퇴비를 넣었다' };
  }

  /** 물을 준다 — 물뿌리개로 구획 전체(일군 칸) */
  waterAll(plotId: string): FarmActionResult {
    const p = this.plot(plotId);
    if (p.site === 'plot' && !InventoryStore.find(WATERING_CAN_ID)) return fail('물뿌리개가 있어야 물을 줄 수 있다');
    this.advanceAll();
    let n = 0;
    for (const c of p.cells) if (c.tilled && waterCell(c)) n++;
    if (n === 0) return fail('물을 줄 칸이 없다 — 먼저 땅을 일군다');
    GameState.markDirty();
    return { ok: true, message: '흙이 촉촉해졌다' };
  }

  /** 이 칸에 이 씨앗 · 모종으로 지금 심을 수 있는가 */
  plantCheck(plotId: string, idx: number, startItemId: string): { ok: boolean; reasonKo?: string; crop?: CropDef; need?: number } {
    const found = cropStartOfItem(startItemId);
    if (!found) return { ok: false, reasonKo: '심을 수 있는 것이 아니다' };
    const { crop, start } = found;
    const p = this.plot(plotId);
    const cell = p.cells[idx];
    if (!cell) return { ok: false, reasonKo: '칸이 없다' };
    const chk = canPlant(crop, start, p, cell, kstMonthOf(Date.now()), this.plantCtx());
    if (!chk.ok) return { ok: false, reasonKo: chk.reasonKo, crop };
    const need = Math.max(1, start.perCell);
    const have = InventoryStore.find(startItemId)?.qty ?? 0;
    if (have < need) return { ok: false, reasonKo: `${need}개가 있어야 한 칸을 채운다 (${have}개)`, crop, need };
    return { ok: true, crop, need };
  }

  /** 심는다 — 씨앗 · 모종 · 종구를 칸 몫만큼 쓴다 */
  plant(plotId: string, idx: number, startItemId: string): FarmActionResult {
    const chk = this.plantCheck(plotId, idx, startItemId);
    if (!chk.ok || !chk.crop) return fail(chk.reasonKo ?? '심을 수 없다');
    const found = cropStartOfItem(startItemId)!;
    const cell = this.plot(plotId).cells[idx];
    plantCell(cell, found.crop, found.start, Date.now(), Math.random, this.plantCtx());
    InventoryStore.removeQty(startItemId, chk.need ?? 1);
    GameState.markDirty();
    StoryStore.event({ kind: 'farm', action: 'plant', cropId: found.crop.id });
    return { ok: true, message: `${found.crop.nameKo}을(를) 심었다` };
  }

  /** 거둔다(본 수확) — 가방 자리부터 본다 */
  harvest(plotId: string, idx: number): FarmActionResult {
    this.advanceAll();
    const cell = this.plot(plotId).cells[idx];
    if (!cell || !cellReady(cell)) return fail('아직 거둘 때가 아니다');
    const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
    if (!crop) return fail('거둘 것이 없다');
    // 가방 자리 — 거둘 아이템은 미리 안다(등급 = 지금 품질 · 붉어졌는가 = 익은 뒤 흐른 시간)
    const ripened = !!crop.harvest.ripenTo && cell.ripeH > crop.harvest.ripenTo.afterDays * 24;
    const outId = produceItemId(ripened ? crop.harvest.ripenTo!.itemId : crop.harvest.itemId, gradeOf(cell.quality));
    if (!this.roomFor(outId, crop)) return fail('가방에 자리가 없다 — 한 칸 비우고 거둔다');
    const r = harvestCell(cell, Math.random, this.harvestSkills());
    if (!r) return fail('아직 거둘 때가 아니다');
    return this.giveHarvest(r, crop);
  }

  /** 중간 수확(솎음 · 마늘종 · 고구마순 · 고춧잎 · 호박잎) */
  interim(plotId: string, idx: number): FarmActionResult {
    this.advanceAll();
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    if (!cell || !crop || !crop.interim || !interimOpen(cell, crop)) return fail('지금은 솎거나 딸 것이 없다');
    if (!this.roomFor(produceItemId(crop.interim.itemId, gradeOf(cell.quality)), null)) return fail('가방에 자리가 없다 — 한 칸 비우고 거둔다');
    const r = interimHarvestCell(cell, Math.random, this.harvestSkills());
    if (!r) return fail('지금은 솎거나 딸 것이 없다');
    return this.giveHarvest(r, crop);
  }

  /** 거둘 것(+ 씨앗 회수를 배웠으면 씨앗 봉투)이 가방에 들어가는가 */
  private roomFor(outId: string, crop: CropDef | null): boolean {
    const parts: { tpl: { id: string; category: InvCategory }; qty: number }[] = [{ tpl: { id: outId, category: 'food' }, qty: 1 }];
    const seed = crop?.starts.find((st) => st.kind === 'seed' && st.cost > 0);
    if (seed && GameState.skillBonus('seed_saver') > 0) parts.push({ tpl: { id: seed.itemId, category: 'consumable' }, qty: 1 });
    return Object.keys(InventoryStore.slotShortfall(parts)).length === 0;
  }

  private giveHarvest(r: FarmHarvestResult, crop: CropDef): FarmActionResult {
    const id = produceItemId(r.itemId, r.grade);
    const tpl = cropItemTemplate(id);
    if (!tpl) return fail('거둔 것을 담을 수 없다');
    InventoryStore.addItem(tpl, r.qty);
    const harvested = [{ itemId: id, qty: r.qty, name: tpl.name }];
    if (r.seedBack) {
      const st = cropItemTemplate(r.seedBack.itemId);
      if (st && InventoryStore.addItem(st, r.seedBack.qty)) harvested.push({ itemId: st.id, qty: r.seedBack.qty, name: st.name });
    }
    GameState.markDirty();
    StoryStore.event({ kind: 'farm', action: 'harvest', cropId: crop.id });
    return { ok: true, message: `${tpl.name} ${r.qty}개를 거뒀다`, harvested };
  }

  /** 걷어 낸다(자라던 것을 버린다 — 일군 땅은 남는다) */
  clear(plotId: string, idx: number): FarmActionResult {
    const cell = this.plot(plotId).cells[idx];
    if (!cell?.cropId) return fail('걷어 낼 것이 없다');
    const name = getCrop(cell.cropId)?.nameKo ?? '';
    clearCell(cell);
    GameState.markDirty();
    return { ok: true, message: `${name}을(를) 걷어 냈다` };
  }

  // ── 설비 ──────────────────────────────────

  /** 마당 텃밭에 설비를 놓는다(가방의 농자재 1개를 쓴다) */
  install(plotId: string, supplyItemId: string): FarmActionResult {
    const s = getFarmSupply(supplyItemId);
    const p = this.plot(plotId);
    if (!s?.facility || s.site !== p.site) return fail('여기에 놓는 설비가 아니다');
    if (s.requiresSkill && GameState.skillRank(s.requiresSkill) <= 0) return fail('다룰 줄 알아야 놓을 수 있다');
    if (p.facilities.includes(s.facility)) return fail('이미 놓았다');
    if (!InventoryStore.find(supplyItemId)) return fail(`${s.nameKo}이(가) 없다`);
    InventoryStore.removeQty(supplyItemId, 1);
    p.facilities.push(s.facility);
    GameState.markDirty();
    return { ok: true, message: `${s.nameKo}을(를) 놓았다` };
  }

  /** 설비를 걷어 가방으로 돌려받는다 */
  uninstall(plotId: string, f: FarmFacility): FarmActionResult {
    const p = this.plot(plotId);
    if (!p.facilities.includes(f)) return fail('놓인 설비가 아니다');
    const s = supplyOfFacility(f);
    const tpl = s ? cropItemTemplate(s.itemId) : null;
    if (!tpl) return fail('돌려받을 수 없다');
    if (!InventoryStore.addItem(tpl, 1)) return fail('가방에 자리가 없다');
    p.facilities = p.facilities.filter((x) => x !== f);
    GameState.markDirty();
    return { ok: true, message: `${tpl.name}을(를) 걷었다` };
  }

  // ── 세이브 ────────────────────────────────

  serialize(): FarmSaveState {
    const plots: Record<string, FarmPlotState> = {};
    for (const [k, p] of this.plots) plots[k] = p;
    return { v: 1, plots };
  }

  /** 로드 — 칸 수가 어긋난(구조가 바뀐) 구획은 빈 칸으로 채워 맞춘다(유저 상태는 그대로) */
  deserialize(s: FarmSaveState | undefined | null): void {
    this.plots.clear();
    if (!s?.plots) return;
    for (const [k, p] of Object.entries(s.plots)) {
      if (!p || !Array.isArray(p.cells)) continue;
      const want = k === INDOOR_PLOT ? INDOOR_SLOTS : FARM_CELLS;
      const cells = p.cells.slice(0, want);
      while (cells.length < want) cells.push({ ...newFarmCell(Date.now()), tilled: k === INDOOR_PLOT });
      this.plots.set(k, { site: k === INDOOR_PLOT ? 'indoor' : 'plot', cells, facilities: Array.isArray(p.facilities) ? p.facilities : [] });
    }
    this.advanceAll();
  }

  resetAll(): void { this.plots.clear(); }
}

export const FarmStore = new FarmStoreImpl();

if (import.meta.env.DEV) {
  // 실렌더 검증 하네스용 — `import('/src/…')`는 게임 인스턴스와 별개 모듈이라(59차 `__INV` 규칙) 실싱글턴을 노출한다
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__FARM = FarmStore;
}
