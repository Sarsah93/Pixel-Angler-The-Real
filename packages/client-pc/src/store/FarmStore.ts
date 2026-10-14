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
 * - 238차 — 관리 작업(`careRows` · `doCare`): 작업 장면 점수를 받아 core `doCare`를 부르고 자재를 가방에서 뺀 뒤 품(피로)을 쓴다.
 *   새로 열린 할 일 · 든 병 · 쓰러짐 · 서리는 `advanceAll`이 알아채 `takeNotices`로 필드 HUD에 올린다.
 *   육묘 트레이 칸의 거두기는 모종(`sdl_*`)을 등급 꼬리 없이 준다.
 * - 245차 — 작물 84종 모두 일이 있다. 같은 구획의 같은 작물 · 같은 일은 **한 번에**(`careGroup` · `doCareGroup` — 자재는 칸마다,
 *   시간 · 품은 칸이 늘수록 덜 늘어난다). 도구(호미 · 전정가위)는 가방에 있어야 하고 닳지 않는다. 알림은 구획 · 작물 · 일로 묶는다.
 *   구세이브(`careV` < 245)는 로드할 때 지나간 차례를 벌 없이 넘긴다(`settleCareRounds` — 자라던 작물이 한꺼번에 깎이지 않게).
 * - 247차 — 재배 요소(사용자 「시기 · 노동 피로 · 도구 · 행위의 정도」): 물은 양(조금 · 보통 · 흠뻑)을 골라 칸마다 준다 ·
 *   일구기 · 퇴비 · 물 · 심기 · 거두기 · 털기에 품(피로 → 허기 · 수분)이 들고, 피로 88부터는 쉬어야 한다 ·
 *   거두는 손에 따라 도구가 있어야(낫 · 호미나 쇠스랑) 하거나 도움(수확 가위 · 쇠스랑 · 모종삽 · 도리깨 · 키) ·
 *   깨 · 콩 · 보리 · 땅콩 · 마늘 · 양파는 거두면 칸에서 말린 뒤 턴다(`finishProcess`) · 가시 작물은 장갑 · 아침에 딴 잎 · 열매는 조금 더 좋다 ·
 *   육묘 트레이는 꺼낸 만큼만 모종이 된다(`pullSeedlings`) · 한 해를 넘긴 산채는 포기를 나눈다(`divide`) · 묵힌 칸의 저절로 난 싹 알림.
 * - 248차 — 땅지렁이: 일구기 · 캐기 · 김매기 · 북주기 · 칸 비우기 뒤(그리고 비 오는 동안) 흙 위로 드러난다(core `rollEarthworms`).
 *   드러난 지렁이는 세이브하지 않는다 — 90초 안에 줍지 않으면 다시 파고든다(`pickWorms` → 가방 생미끼 「땅지렁이」).
 */

import {
  FARM_CELLS, FARM_COLS, INDOOR_SLOTS, advancePlot, canPlant, cellReady, clearCell, climateRainAt, compostCell,
  cropStartOfItem, getCrop, getFarmSupply, harvestCell, interimHarvestCell, interimOpen, kstMonthOf, newFarmPlot,
  plantCell, produceItemId, supplyOfFacility, tillCell, waterCell, newFarmCell, gradeOf, harvestPreview,
  careStatusList, careDue, doCare as coreDoCare, inEstablishment, cellDiseases, CARE_TASK_KO, DISEASE_KO, DISEASE_CONTROL_KO, TRAY_ID, variantsOf,
  planOfCell, settleCareRounds, diseaseOnsetKo, DISEASE_DEFS,
  // 247차 — 재배 요소
  cultivationOf, harvestToolEval, plantToolEval, processLastToolEval, laborOf, laborVector, tooTiredKo, CULTIVATION_TUNING, FARM_LABOR,
  startFieldProcess, finishFieldProcess, processHoursLeft, pullSeedlings as corePullSeedlings, divideBlockKo, divideCell, wildUnknown,
  WATER_AMOUNT_KO, TOOL_NAME_KO, OFF_TIMING_KO, PROCESS_LAST_KO, waterBandOf, cellDays, startOf, offTimingOf, moistureStateOf,
  TROWEL_ID, GLOVES_ID, WINNOW_ID, WILD_SPROUTS,
  // 248차 — 땅지렁이
  rollEarthworms, EARTHWORM_TUNING, type EarthwormAct,
  type CropDef, type FarmEnv, type FarmFacility, type FarmHarvestResult, type FarmPlantCtx, type FarmPlotState, type LicenseType,
  type CareStatus, type CareTaskId, type CropDisease, type FarmCellState, type WaterAmount, type CropCultivation, type MoistureState,
} from '@tra/core';
import { GameState } from './GameState.js';
import { InventoryStore, type InvCategory } from './InventoryStore.js';
import { StoryStore } from './StoryStore.js';
import { ExternalDataStore } from './ExternalDataStore.js';
import { cropItemTemplate, variantNoticeKo, looseCountKo, EARTHWORM_ID, EARTHWORM_TEMPLATE } from '../data/CropItems.js';

/** 집 안 선반 구획 키 */
export const INDOOR_PLOT = 'indoor';
/** 호미 · 퇴비 · 물뿌리개 아이템 id */
export const HOMI_ID = 'farm_homi';
export const COMPOST_ID = 'farm_compost';
export const WATERING_CAN_ID = 'inv_watering_can';
/** 247차 — 목장갑(장비 가게) — 가시 작물을 거둘 때 코팅 장갑 대신 */
export const WORK_GLOVES_ID = 'inv_gloves_work';

export interface FarmSaveState {
  v: 1;
  /** 245차 — 관리 표 판(245 = 작물 84종 표). 없거나 작으면 로드 때 지난 차례를 벌 없이 넘긴다 */
  careV?: number;
  plots: Record<string, FarmPlotState>;
  /** 236차 — 텃밭에서 거둔 횟수(본 수확 + 중간 수확). 농지 이용권 요건 — 구세이브는 0 */
  harvests?: number;
  /** 241차 — 작물별 거둔 횟수(개량종 해금 — 원종 3번). 구세이브는 빈 표(그 전에 거둔 것은 세지 않는다) */
  harvestsBy?: Record<string, number>;
}

export interface FarmActionResult {
  ok: boolean;
  message: string;
  /** 거둔 것(토스트 · 로그) */
  harvested?: { itemId: string; qty: number; name: string }[];
  /** 248차 — 이 일로 흙 위에 드러난 땅지렁이(칸 · 마리 수) — 필드가 그 칸에 그림을 띄운다 */
  worms?: { idx: number; n: number }[];
}

/** 248차 — 땅지렁이 아이템(정의는 `data/CropItems.ts` — 위키 카탈로그도 쓴다) */
export { EARTHWORM_ID, EARTHWORM_TEMPLATE };

/** 248차 — 흙 위로 드러난 땅지렁이 한 무리 */
export interface ExposedWorms { plotId: string; idx: number; n: number; untilMs: number }

const fail = (message: string): FarmActionResult => ({ ok: false, message });

/** 238차 — 텃밭 창의 할 일 한 줄: 상태 + 모자란 자재(245차 — 도구도) */
export interface FarmCareRow {
  st: CareStatus;
  missing: { itemId: string; name: string; need: number; have: number; tool?: boolean }[];
}

/** 245차 — 관리 표 판 · 247차 육묘 칸 「모종 굳히기」가 생겨 247 */
const CARE_V = 247;
/** 247차 — 아침(KST 5~10시)에 따면 품질이 조금 좋은 갈래(잎 · 열매 · 향채 · 산채) */
const MORNING_CATS = new Set(['leaf', 'fruit', 'herb', 'wild']);
/** 245차 — 묶음 작업: 칸이 하나 늘 때마다 걸리는 시간 · 품이 이만큼 는다(혼자 12칸을 해도 12배가 아니다) */
export const CARE_GROUP_STEP = { seconds: 0.45, fatigue: 0.6 };
/** 245차 — 묶음 작업에 걸리는 시간(초) */
export function careGroupSeconds(base: number, cells: number): number {
  return Math.round(base * Math.min(4, 1 + CARE_GROUP_STEP.seconds * Math.max(0, cells - 1)));
}

/** 받침이 있으면 앞 조사, 없으면 뒤 조사(을/를 · 이/가) */
function josa(word: string, withB: string, withoutB: string): string {
  const c = word.charCodeAt(word.length - 1);
  const b = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return `${word}${b ? withB : withoutB}`;
}

/** 자재 · 도구를 파는 곳 */
function shopOfSupply(itemId: string): string {
  return getFarmSupply(itemId)?.shop === 'nursery' ? '종묘사' : '생활용품점';
}

/** 247차 — 「호미나 쇠스랑」처럼 고르는 말로 잇는다(받침이 있으면 「이나」) */
function orList(names: string[]): string {
  return names.map((n, k) => (k < names.length - 1 ? josa(n, '이나', '나') : n)).join(' ');
}

/** 247차 — 저절로 난 싹이 어디서 왔나(이름이 드러날 때 한 줄) */
function wildOriginKo(cropId: string, banked: boolean): string {
  if (banked) return '지난해 흙에 떨어져 있던 씨가 올라왔다';
  const def = WILD_SPROUTS.find((w) => w.cropId === cropId);
  if (cropId === 'chopi' || cropId === 'eomnamu' || cropId === 'dureup') return '새가 열매를 먹고 떨군 씨가 났다';
  return def?.shade ? '숲에서 바람에 날아든 씨앗이 그늘 아래 텄다' : '바람에 날아든 씨앗이 텄다';
}

class FarmStoreImpl {
  private plots = new Map<string, FarmPlotState>();
  /** 236차 — 거둔 횟수(농지 이용권 요건) */
  private harvests = 0;
  private harvestsBy: Record<string, number> = {};
  /** 238차 — 이미 알린 할 일 · 병 · 쓰러짐 · 서리(키) · 아직 안 올린 알림 */
  private noticed = new Set<string>();
  private notices: string[] = [];

  /** 236차 — 텃밭에서 거둔 횟수(본 수확 + 중간 수확) */
  get harvestCount(): number { return this.harvests; }
  /** 241차 — 이 작물을 거둔 횟수(본 수확 + 중간 수확) — 개량종 진열 · 상세 보기 */
  harvestsOf(cropId: string): number { return this.harvestsBy[cropId] ?? 0; }

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
      powerOff: GameState.powerCut(),   // 236차 — 전기료가 밀리면 수경 재배기가 꺼진다
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

  // ── 248차 — 땅지렁이 ─────────────────────────

  /** 흙 위로 드러난 땅지렁이(세이브하지 않는다 — `exposeMs` 안에 줍지 않으면 다시 파고든다). 키 = `구획:칸` */
  private worms = new Map<string, ExposedWorms>();

  /** 지금 비가 오는가(홈타운 화면 날씨 → 기후 통계) */
  rainingNow(nowMs = Date.now()): boolean {
    return this.liveRaining() ?? climateRainAt(nowMs);
  }

  /** 이 일 뒤 이 칸에서 지렁이가 드러났나(마리 수 · 0 = 없음). 이미 드러나 있으면 더해지고 시계가 새로 간다 */
  private surfaceWorms(plotId: string, idx: number, act: EarthwormAct, nowMs = Date.now()): number {
    const p = this.plot(plotId);
    const cell = p.cells[idx];
    if (!cell) return 0;
    const n = rollEarthworms(act, {
      month: kstMonthOf(nowMs), moisture: cell.moisture, compost: !!cell.compost, raining: this.rainingNow(nowMs), site: p.site,
    }, Math.random);
    if (n <= 0) return 0;
    const key = `${plotId}:${idx}`;
    const prev = this.worms.get(key);
    const had = prev && prev.untilMs > nowMs ? prev.n : 0;
    this.worms.set(key, { plotId, idx, n: Math.min(9, had + n), untilMs: nowMs + EARTHWORM_TUNING.exposeMs });
    return n;
  }

  /** 일 결과에 드러난 지렁이를 붙인다(한 줄 꼬리 + 칸 목록) */
  private withWorms(r: FarmActionResult, plotId: string, cells: number[], act: EarthwormAct): FarmActionResult {
    if (!r.ok) return r;
    const found = cells.map((idx) => ({ idx, n: this.surfaceWorms(plotId, idx, act) })).filter((w) => w.n > 0);
    const total = found.reduce((a, w) => a + w.n, 0);
    if (total <= 0) return r;
    return { ...r, message: `${r.message} · 지렁이 ${total}마리가 꿈틀거린다`, worms: found };
  }

  /** 드러나 있는 지렁이 전부(파고든 것은 걷어 낸다) */
  exposedWorms(nowMs = Date.now()): ExposedWorms[] {
    for (const [k, w] of this.worms) if (w.untilMs <= nowMs) this.worms.delete(k);
    return [...this.worms.values()];
  }

  /** 이 칸에 드러난 지렁이 수 */
  wormsAt(plotId: string, idx: number, nowMs = Date.now()): number {
    const w = this.worms.get(`${plotId}:${idx}`);
    return w && w.untilMs > nowMs ? w.n : 0;
  }

  /** 드러난 지렁이를 줍는다 → 가방 생미끼 「땅지렁이」 */
  pickWorms(plotId: string, idx: number): FarmActionResult {
    const key = `${plotId}:${idx}`;
    const w = this.worms.get(key);
    if (!w || w.untilMs <= Date.now()) { this.worms.delete(key); return fail('지렁이가 흙 속으로 들어가 버렸다'); }
    if (!InventoryStore.addItem(EARTHWORM_TEMPLATE, w.n)) return fail('가방에 자리가 없다 — 한 칸 비우고 줍는다');
    this.worms.delete(key);
    GameState.markDirty();
    return { ok: true, message: `땅지렁이 ${w.n}마리를 주웠다`, harvested: [{ itemId: EARTHWORM_ID, qty: w.n, name: EARTHWORM_TEMPLATE.name }] };
  }

  /** 비 오는 동안 일군 칸에서 지렁이가 기어 나온다(필드가 텃밭 가까이 있을 때 `rainCheckMs`마다 부른다) */
  rainWorms(plotId: string, nowMs = Date.now()): { idx: number; n: number }[] {
    if (!this.plots.has(plotId) || !this.rainingNow(nowMs)) return [];
    const p = this.plot(plotId);
    const out: { idx: number; n: number }[] = [];
    p.cells.forEach((c, idx) => {
      if (!c?.tilled || this.wormsAt(plotId, idx, nowMs) > 0) return;
      const n = this.surfaceWorms(plotId, idx, 'rain', nowMs);
      if (n > 0) out.push({ idx, n });
    });
    return out;
  }

  /** 하네스 — 이 칸에 지렁이를 드러낸다 */
  devWorms(plotId: string, idx: number, n = 2): void {
    this.worms.set(`${plotId}:${idx}`, { plotId, idx, n, untilMs: Date.now() + EARTHWORM_TUNING.exposeMs });
  }

  /** 247차 — 마지막으로 굴린 시각(필드 칸 그림이 칸마다 할 일을 물어도 1초에 한 번만 굴린다) */
  private lastAdvanceMs = 0;

  /**
   * 모든 구획을 지금까지 굴린다(창을 열 때 · 필드 틱 · 로드 직후) — 굴린 뒤 새 할 일 · 병 · 쓰러짐 · 서리를 알림 줄로 모은다.
   * 247차 — 시각을 주지 않은 부름은 1초 안에 다시 굴리지 않는다(시간 단위로만 자라니 1초 늦어도 같다).
   */
  advanceAll(at?: number): void {
    const nowMs = at ?? Date.now();
    if (at === undefined && nowMs - this.lastAdvanceMs < 1000) return;
    this.lastAdvanceMs = nowMs;
    const env = this.env(nowMs);
    for (const p of this.plots.values()) advancePlot(p, nowMs, env);
    this.scanNotices(nowMs);
  }

  /**
   * 238차 — 새로 열린 할 일 · 든 병 · 쓰러짐 · 서리를 한 번씩만 알림으로.
   * 245차 — 같은 구획 · 같은 작물 · 같은 일(같은 병)은 한 줄로 묶는다(「텃밭 2번 칸 외 5칸」).
   */
  private scanNotices(nowMs: number): void {
    for (const [pid, p] of this.plots) {
      const place = pid === INDOOR_PLOT ? '집 안 선반' : '텃밭';
      const groups = new Map<string, { cells: number[]; line: (where: string) => string }>();
      const add = (key: string, gkey: string, cell: number, line: (where: string) => string): void => {
        if (this.noticed.has(key)) return;
        this.noticed.add(key);
        const g = groups.get(gkey);
        if (g) g.cells.push(cell); else groups.set(gkey, { cells: [cell], line });
      };
      p.cells.forEach((c, i) => {
        if (!c.cropId) return;
        const crop = getCrop(c.cropId);
        if (!crop) return;
        for (const st of c.process ? [] : careDue(c, crop, nowMs)) {   // 247차 — 베어 말리는 칸은 할 일이 없다
          add(`${pid}:${i}:${st.def.id}:${st.round}:${c.plantedAt ?? 0}`, `t:${crop.id}:${st.def.id}`, i,
            (where) => `[텃밭] ${crop.nameKo} — ${CARE_TASK_KO[st.def.id]} 할 때 (${where})`);
        }
        for (const d of cellDiseases(c)) {
          const line = DISEASE_DEFS[d.id].kind === 'bird'
            ? (where: string) => `[텃밭] ${josa(crop.nameKo, '을', '를')} 새가 쪼아 먹기 시작했다 — ${DISEASE_CONTROL_KO[d.id]} (${where})`
            : (where: string) => `[텃밭] ${crop.nameKo}에 ${diseaseOnsetKo(d.id)} — ${DISEASE_CONTROL_KO[d.id]} (${where})`;
          add(`${pid}:${i}:dz:${d.id}:${d.sinceMs}`, `d:${crop.id}:${d.id}`, i, line);
        }
        if (c.lodged) add(`${pid}:${i}:lodged:${c.plantedAt ?? 0}`, `l:${crop.id}`, i, (where) => `[텃밭] ${josa(crop.nameKo, '이', '가')} 비바람에 쓰러졌다 — 지주를 세웠어야 했다 (${where})`);
        // 247차 — 저절로 난 싹(이름 모름 → 자라면 드러난다) · 다 마른 깨 · 콩 · 보리
        if (c.wild) {
          if (wildUnknown(c)) add(`${pid}:${i}:wild:${c.plantedAt ?? 0}`, 'w:new', i, (where) => `[텃밭] 묵힌 칸에 이름 모를 싹이 올라왔다 (${where})`);
          else add(`${pid}:${i}:wildname:${c.plantedAt ?? 0}`, `w:${crop.id}`, i,
            (where) => `[텃밭] 이름 모를 싹은 ${josa(crop.nameKo, '이었다', '였다')} — ${wildOriginKo(crop.id, !WILD_SPROUTS.some((w) => w.cropId === crop.id))} (${where})`);
        }
        if (c.process?.dryAt) {
          const last = cultivationOf(crop).process?.last ?? 'thresh';
          const when = last === 'thresh' ? '털 때다' : last === 'pick' ? '꼬투리를 딸 때다' : '거둘 때다';
          add(`${pid}:${i}:dry:${c.process.cutAt}`, `dry:${crop.id}`, i, (where) => `[텃밭] ${josa(crop.nameKo, '이', '가')} 다 말랐다 — ${when} (${where})`);
        }
        if (c.frostedAt) add(`${pid}:${i}:frost:${c.frostedAt}`, `f:${crop.id}`, i, (where) => `[텃밭] 서리가 내렸다 — ${crop.nameKo} 남은 것을 사흘 안에 거둔다 (${where})`);
      });
      for (const g of groups.values()) {
        const where = g.cells.length > 1 ? `${place} ${g.cells[0] + 1}번 칸 외 ${g.cells.length - 1}칸` : `${place} ${g.cells[0] + 1}번 칸`;
        this.notices.push(g.line(where));
      }
    }
  }

  /** 238차 — 모아 둔 알림을 꺼낸다(필드 HUD 로그 · 떠오르는 안내) */
  takeNotices(max = 3): string[] {
    return this.notices.splice(0, max);
  }

  /** 238차 — 이 칸의 할 일 전부(상태 · 모자란 자재) */
  careRows(plotId: string, idx: number): FarmCareRow[] {
    this.advanceAll();
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    if (!cell || !crop || cell.process) return [];   // 247차 — 베어 말리는 칸은 할 일이 없다(털기만)
    return careStatusList(cell, crop, Date.now()).map((st) => ({ st, missing: this.missingFor(st.def.needs, st.def.tools) }));
  }

  private missingFor(needs?: { itemId: string; qty: number }[], tools?: string[]): FarmCareRow['missing'] {
    const out: FarmCareRow['missing'] = [];
    for (const n of needs ?? []) {
      const have = InventoryStore.find(n.itemId)?.qty ?? 0;
      if (have < n.qty) out.push({ itemId: n.itemId, name: cropItemTemplate(n.itemId)?.name ?? n.itemId, need: n.qty, have });
    }
    // 245차 — 도구(호미 · 전정가위)는 가방에 하나 있으면 된다 · 닳지 않는다
    for (const t of tools ?? []) {
      if (!InventoryStore.find(t)) out.push({ itemId: t, name: cropItemTemplate(t)?.name ?? t, need: 1, have: 0, tool: true });
    }
    return out;
  }

  /** 245차 — 모자란 것 한 줄(「복합비료 2개(1개)가 있어야 한다 — 종묘사에서 판다」 · 도구는 「호미가 있어야 한다 — 생활용품점에서 판다」) */
  missingLineKo(missing: FarmCareRow['missing']): string {
    const shops = [...new Set(missing.map((m) => shopOfSupply(m.itemId)))];
    const parts = missing.map((m) => (m.tool ? m.name : `${m.name} ${m.need}개(${m.have}개)`));
    return `${josa(parts.join(' · '), '이', '가')} 있어야 한다 — ${shops.join(' · ')}에서 판다`;
  }

  /** 238차 — 지금 이 작업을 할 수 있는가(할 때 · 자재 · 245차 도구) */
  careCheck(plotId: string, idx: number, id: CareTaskId): { ok: boolean; reasonKo?: string; row?: FarmCareRow } {
    const row = this.careRows(plotId, idx).find((r) => r.st.def.id === id);
    if (!row) return { ok: false, reasonKo: '지금 할 일이 아니다' };
    if (row.st.status !== 'due') {
      const why = row.st.status === 'upcoming' ? (row.st.daysLeft < 0 ? '아직 때가 아니다 — 거둔 뒤에 한다' : `아직 때가 아니다 — ${row.st.daysLeft}일 뒤`) : '이번 차례는 했다';
      return { ok: false, reasonKo: why, row };
    }
    if (row.missing.length) return { ok: false, reasonKo: this.missingLineKo(row.missing), row };
    return { ok: true, row };
  }

  /**
   * 245차 — 같은 구획에서 같은 작물 · 같은 일이 지금 「할 일」인 칸들(고른 칸이 맨 앞). 자재가 모자라면 되는 칸까지만.
   * 육묘 트레이 칸은 육묘 칸끼리만 묶는다.
   */
  careGroup(plotId: string, idx: number, id: CareTaskId): number[] {
    const p = this.plot(plotId);
    const base = p.cells[idx];
    const crop = base?.cropId ? getCrop(base.cropId) : undefined;
    if (!base || !crop) return [idx];
    const now = Date.now();
    const order = [idx, ...p.cells.map((_, i) => i).filter((i) => i !== idx)];
    const cells = order.filter((i) => {
      const c = p.cells[i];
      if (!c?.cropId || c.cropId !== base.cropId || !!c.nursery !== !!base.nursery) return false;
      return careStatusList(c, crop, now).some((st) => st.def.id === id && st.status === 'due');
    });
    const def = planOfCell(base, crop).tasks.find((t) => t.id === id);
    let k = cells.length;
    for (const n of def?.needs ?? []) k = Math.min(k, Math.floor((InventoryStore.find(n.itemId)?.qty ?? 0) / Math.max(1, n.qty)));
    return cells.length ? cells.slice(0, Math.max(1, k)) : [idx];
  }

  /**
   * 238차 — 작업을 한다(작업 장면이 끝난 뒤 점수와 함께). 자재를 가방에서 빼고 품(허기 · 수분 · 피로)을 쓴다.
   * 서툴면(점수 낮음) 효과가 절반이다 — 자재는 그대로 든다.
   */
  doCare(plotId: string, idx: number, id: CareTaskId, score = 1): FarmActionResult {
    return this.doCareGroup(plotId, [idx], id, score);
  }

  /**
   * 245차 — 같은 일을 여러 칸에 한 번에(작업 장면 한 번 · 점수 하나). 자재는 칸마다 들고, 품은 칸이 늘수록 덜 는다.
   * 첫 칸이 안 되면 아무것도 하지 않는다. 뒤 칸은 그사이 자재가 떨어지면 거기서 멈춘다.
   */
  doCareGroup(plotId: string, cells: number[], id: CareTaskId, score = 1): FarmActionResult {
    const first = cells[0] ?? 0;
    const chk = this.careCheck(plotId, first, id);
    if (!chk.ok) return fail(chk.reasonKo ?? '지금 할 수 없다');
    const p = this.plot(plotId);
    const def = chk.row!.st.def;
    let done = 0;
    const doneCells: number[] = [];
    let clumsy = false;
    let lastMsg = '';
    let cropId = '';
    for (const i of cells) {
      const cell = p.cells[i];
      const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
      if (!cell || !crop) continue;
      if (i !== first && !this.careCheck(plotId, i, id).ok) continue;
      const r = coreDoCare(cell, crop, id, Date.now(), score);
      if (!r.ok) continue;
      for (const n of r.needs) InventoryStore.removeQty(n.itemId, n.qty);
      done++;
      doneCells.push(i);
      clumsy ||= !!r.clumsy;
      lastMsg = r.messageKo;
      cropId = crop.id;
    }
    if (done === 0) return fail('지금 할 수 없다');
    const k = 1 + CARE_GROUP_STEP.fatigue * (done - 1);
    GameState.spendLabor(Math.round(def.fatigue * 0.5 * k), Math.round(def.fatigue * 0.7 * k), Math.round(def.fatigue * k));
    GameState.markDirty();
    StoryStore.event({ kind: 'farm', action: 'care', cropId });
    const name = CARE_TASK_KO[id];
    const message = done > 1 ? (clumsy ? `${name} ${done}칸 — 서툴러서 효과가 절반이다` : `${name} ${done}칸 — 했다`) : lastMsg;
    // 248차 — 김매기 · 북주기는 호미로 겉흙을 긁는다 — 지렁이가 드러날 수 있다
    if (id === 'weed' || id === 'hill_up') return this.withWorms({ ok: true, message }, plotId, doneCells, id);
    return { ok: true, message };
  }

  /** 238차 — 활착기(모종 심은 뒤 2주 — 흙을 촉촉하게) */
  establishment(plotId: string, idx: number): { daysLeft: number } | null {
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    return cell && crop ? inEstablishment(cell, crop, Date.now()) : null;
  }

  /** 238차 — 이 칸에 든 병(이름 · 심한 정도 · 막는 법) · 245차 병 · 벌레 · 새 */
  diseases(plotId: string, idx: number): { id: CropDisease; severity: number; name: string; control: string; kind: 'disease' | 'pest' | 'bird' }[] {
    const cell = this.plot(plotId).cells[idx];
    if (!cell) return [];
    return cellDiseases(cell).map((d) => ({ id: d.id, severity: d.severity, name: DISEASE_KO[d.id], control: DISEASE_CONTROL_KO[d.id], kind: DISEASE_DEFS[d.id].kind }));
  }

  // ── 247차 — 품 · 도구 ───────────────────────

  /** 도구 · 물건이 가방에 있는가 */
  readonly hasItem = (id: string): boolean => !!InventoryStore.find(id);

  /** 지쳐서 일을 못 하는가(피로 88 — 일하기와 같은 상한) */
  tiredBlock(): string | null {
    return tooTiredKo(GameState.vitals.fatigue);
  }

  /** 품을 쓴다 — 피로 → 허기 · 수분 · 피로(관리 작업과 같은 비) */
  private spend(fatigue: number): void {
    if (!(fatigue > 0)) return;
    const v = laborVector(fatigue);
    GameState.spendLabor(v.hunger, v.hydration, v.fatigue);
  }

  // ── 자격 · 문맥 ───────────────────────────

  plantCtx(): FarmPlantCtx {
    return {
      hasSkill: (id) => GameState.skillRank(id) > 0,
      sproutBonus: GameState.skillMult('sprout_rate') - 1,
      // 237차 — 작물 난이도 단계 요건(레벨 · 유기농업기능사)
      level: GameState.player.level ?? 1,
      hasLicense: (t) => GameState.hasLicense(t as LicenseType),
      // 238차 — 육묘 트레이(씨앗 → 모종) · 지금 기온(늦서리 뒤 4월 정식)
      hasTray: !!InventoryStore.find(TRAY_ID),
      tempC: ExternalDataStore.getKmaWeather('hometown')?.tempC,
    };
  }

  private harvestSkills(): { yieldBonus: number; seedSaver: number } {
    return { yieldBonus: GameState.skillMult('crop_yield') - 1, seedSaver: GameState.skillBonus('seed_saver') };
  }

  // ── 손질 ──────────────────────────────────

  /** 호미로 간다 — 「개간」을 배웠으면 그 칸이 든 한 줄(4칸)을 한 번에 */
  till(plotId: string, idx: number): FarmActionResult {
    if (!InventoryStore.find(HOMI_ID)) return fail('호미가 있어야 땅을 일굴 수 있다');
    const tired = this.tiredBlock();
    if (tired) return fail(tired);
    const p = this.plot(plotId);
    const targets = GameState.skillBonus('till_speed') >= 1 && p.site === 'plot'
      ? Array.from({ length: FARM_COLS }, (_, c) => Math.floor(idx / FARM_COLS) * FARM_COLS + c)
      : [idx];
    const tilled: number[] = [];
    for (const i of targets) { const c = p.cells[i]; if (c && tillCell(c)) tilled.push(i); }
    const n = tilled.length;
    if (n === 0) return fail('이미 일군 땅이다');
    this.spend(laborOf('till').fatigue * n);   // 247차 — 호미질은 품이 든다
    GameState.markDirty();
    // 248차 — 뒤집은 흙에서 지렁이가 드러난다
    return this.withWorms({ ok: true, message: n > 1 ? `${n}칸을 일궜다` : '흙을 일궜다' }, plotId, tilled, 'till');
  }

  /** 퇴비를 넣는다(칸 하나 · 퇴비 1) */
  compost(plotId: string, idx: number): FarmActionResult {
    const it = InventoryStore.find(COMPOST_ID);
    if (!it || it.qty <= 0) return fail('퇴비가 없다');
    const c = this.plot(plotId).cells[idx];
    if (!c?.tilled) return fail('먼저 땅을 일궈야 한다');
    if (c.compost) return fail('이번 작기에는 이미 퇴비를 넣었다');
    const tired = this.tiredBlock();
    if (tired) return fail(tired);
    if (!compostCell(c)) return fail('퇴비를 넣을 수 없다');
    InventoryStore.removeQty(COMPOST_ID, 1);
    this.spend(laborOf('compost').fatigue);
    GameState.markDirty();
    return { ok: true, message: '퇴비를 넣었다' };
  }

  /** 물을 준다 — 물뿌리개로 구획 전체(일군 칸) · 247차 양을 고른다(기본 보통) */
  waterAll(plotId: string, amount: WaterAmount = 'normal'): FarmActionResult {
    return this.water(plotId, amount);
  }

  /**
   * 247차 — 물을 준다: 고른 칸(없으면 일군 칸 전부) · 양(조금 · 보통 · 흠뻑). 마당은 물뿌리개가 있어야 하고 칸마다 품이 든다.
   * 그 작물에게 많은 양이면(알맞은 수분 위 · 거두기 전 물 끊기) 한 줄로 알려 준다 — 막지는 않는다(물을 줄지는 사람이 정한다).
   */
  water(plotId: string, amount: WaterAmount, cells?: number[]): FarmActionResult {
    const p = this.plot(plotId);
    if (p.site === 'plot' && !InventoryStore.find(WATERING_CAN_ID)) return fail('물뿌리개가 있어야 물을 줄 수 있다');
    const tired = this.tiredBlock();
    if (tired) return fail(tired);
    this.advanceAll();
    const list = cells ?? p.cells.map((_, i) => i);
    let n = 0;
    let warn = '';
    for (const i of list) {
      const c = p.cells[i];
      if (!c?.tilled || !waterCell(c, amount)) continue;
      n++;
      const crop = c.cropId ? getCrop(c.cropId) : undefined;
      if (warn || !crop || c.nursery || p.site !== 'plot' || c.process) continue;
      const wb = waterBandOf(crop, this.daysToFirst(c, crop));
      const cv = cultivationOf(crop);
      if (wb.stopping) warn = `${crop.nameKo} — 거두기 전에는 물을 끊는다`;
      else if (c.moisture > wb.band[1] && cv.water.over !== 'none') warn = `${crop.nameKo}에는 많다 — ${WATER_AMOUNT_KO[cv.water.amount]}씩 준다`;
    }
    if (n === 0) return fail('물을 줄 칸이 없다 — 먼저 땅을 일군다');
    if (p.site === 'plot') this.spend(laborOf('water', undefined, { amount }).fatigue * n);
    GameState.markDirty();
    const base = n > 1 ? `${n}칸에 물을 ${WATER_AMOUNT_KO[amount]} 줬다` : `물을 ${WATER_AMOUNT_KO[amount]} 줬다`;
    return { ok: true, message: warn ? `${base} — ${warn}` : base };
  }

  /**
   * 247차 — 이 칸의 알맞은 흙 수분 · 지금 상태(텃밭 창 흙 막대 · 필드 칸 표시). 일구지 않은 칸은 null.
   * 작물이 없거나 말리는 · 육묘 칸은 「마르지만 않으면 된다」(0.25 위).
   */
  waterState(plotId: string, idx: number): { band: [number, number]; stopping: boolean; state: MoistureState } | null {
    const c = this.plot(plotId).cells[idx];
    if (!c?.tilled) return null;
    const crop = c.cropId ? getCrop(c.cropId) : undefined;
    // 작물이 없거나 말리는 · 육묘 칸 · 이름 모를 싹(무엇인지 모르니 띠도 모른다)은 「마르지만 않으면」
    if (!crop || c.nursery || c.process || wildUnknown(c)) return { band: [0.25, 1], stopping: false, state: c.moisture < 0.25 ? 'dry' : 'ok' };
    const wb = waterBandOf(crop, this.daysToFirst(c, crop));
    return { ...wb, state: moistureStateOf(c.moisture, wb.band) };
  }

  /** 247차 — 첫 수확까지 남은 날(물 끊기 판정) */
  private daysToFirst(c: FarmCellState, crop: CropDef): number | undefined {
    return c.picks === 0 && c.growth < 1 ? (1 - c.growth) * cellDays(crop, c) : undefined;
  }

  /** 이 칸에 이 씨앗 · 모종으로 지금 심을 수 있는가 */
  plantCheck(plotId: string, idx: number, startItemId: string): { ok: boolean; reasonKo?: string; crop?: CropDef; need?: number } {
    const found = cropStartOfItem(startItemId);
    if (!found) return { ok: false, reasonKo: '심을 수 있는 것이 아니다' };
    const { crop, start } = found;
    // 236차 — 농지 사용료가 밀리면 빌린 텃밭에는 새로 심지 못한다(거두기 · 물주기는 된다)
    if (plotId !== INDOOR_PLOT && GameState.isRentedPlot(plotId) && GameState.farmRentOverdue()) {
      return { ok: false, reasonKo: '농지 사용료가 밀려 빌린 텃밭에는 새로 심을 수 없다', crop };
    }
    const p = this.plot(plotId);
    const cell = p.cells[idx];
    if (!cell) return { ok: false, reasonKo: '칸이 없다' };
    const chk = canPlant(crop, start, p, cell, kstMonthOf(Date.now()), this.plantCtx(), Date.now());
    if (!chk.ok) return { ok: false, reasonKo: chk.reasonKo, crop };
    const need = Math.max(1, start.perCell);
    const have = InventoryStore.find(startItemId)?.qty ?? 0;
    if (have < need) return { ok: false, reasonKo: `${need}개가 있어야 한 칸을 채운다 (${have}개)`, crop, need };
    return { ok: true, crop, need };
  }

  /** 심는다 — 씨앗 · 모종 · 종구를 칸 몫만큼 쓴다 · 247차 품 · 모종삽 · 철 · 밑거름 */
  plant(plotId: string, idx: number, startItemId: string): FarmActionResult {
    const chk = this.plantCheck(plotId, idx, startItemId);
    if (!chk.ok || !chk.crop) return fail(chk.reasonKo ?? '심을 수 없다');
    const tired = this.tiredBlock();
    if (tired) return fail(tired);
    const found = cropStartOfItem(startItemId)!;
    const p = this.plot(plotId);
    const cell = p.cells[idx];
    const tool = plantToolEval(found.start.kind, this.hasItem);
    plantCell(cell, found.crop, found.start, Date.now(), Math.random, this.plantCtx(),
      { greenhouse: p.facilities.includes('greenhouse'), trowel: tool.helpers.includes(TROWEL_ID) });
    InventoryStore.removeQty(startItemId, chk.need ?? 1);
    if (p.site === 'plot') this.spend(laborOf('plant', found.crop, { tool }).fatigue);
    GameState.markDirty();
    StoryStore.event({ kind: 'farm', action: 'plant', cropId: found.crop.id });
    const note = this.plantedNoteKo(cell, found.crop);
    return { ok: true, message: `${josa(found.crop.nameKo, '을', '를')} 심었다${note ? ` — ${note}` : ''}` };
  }

  /** 247차 — 심은 뒤 한 줄(철 밖 · 퇴비 칸의 적게 먹는 작물) */
  private plantedNoteKo(cell: FarmCellState, crop: CropDef): string {
    if (cell.offTiming) return `알맞은 철을 벗어났다 — ${OFF_TIMING_KO[cell.offTiming]}`;
    if (cell.fedAtPlant && cultivationOf(crop).feed === 'low') return '퇴비를 넣은 칸 — 거름이 많으면 잎만 무성해진다';
    return '';
  }

  /**
   * 247차 — 심기 전에 알려 줄 것(심을 수는 있다): 알맞은 철 밖 · 퇴비 칸의 적게 먹는 작물 · 많이 먹는 작물인데 퇴비가 없다.
   * 텃밭 창 심기 목록 · 필드 칸 안내가 쓴다.
   */
  plantNoteKo(plotId: string, idx: number, startItemId: string): string | null {
    const found = cropStartOfItem(startItemId);
    const p = this.plot(plotId);
    const c = p.cells[idx];
    if (!found || !c || found.start.nursery || p.site !== 'plot') return null;
    const off = offTimingOf(found.crop, kstMonthOf(Date.now()), found.start.months);
    if (off && !(off === 'cold' && p.facilities.includes('greenhouse'))) return `지금 심으면 ${OFF_TIMING_KO[off]} — 수량이 준다`;
    const feed = cultivationOf(found.crop).feed;
    if (c.compost && feed === 'low') return '퇴비를 넣은 칸 — 이 작물은 거름이 많으면 잎만 무성하다';
    if (!c.compost && feed === 'high') return '거름을 많이 먹는다 — 퇴비를 넣으면 더 난다';
    return null;
  }

  /**
   * 거둔다(본 수확) — 가방 자리부터 본다.
   * 247차 — 거두는 손에 따라 도구가 있어야 한다(낫 · 호미나 쇠스랑) · 도움 도구는 품을 줄이고 조금 좋아진다 · 아침에 딴 잎 · 열매 +품질 ·
   * 가시 작물은 장갑 · 밭 손질 작물(깨 · 콩 · 보리 · 땅콩 · 마늘 · 양파)은 베어(캐어) 칸에서 말린다 → 다 마르면 `finishProcess` ·
   * 육묘 트레이는 모종을 다 꺼낸다(골라 꺼내기는 `pullSeedlings`).
   */
  harvest(plotId: string, idx: number): FarmActionResult {
    this.advanceAll();
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    if (!cell || !crop) return fail('거둘 것이 없다');
    if (cell.process) return this.finishProcess(plotId, idx);
    if (!cellReady(cell)) return fail('아직 거둘 때가 아니다');
    const tired = this.tiredBlock();
    if (tired) return fail(tired);
    if (cell.nursery) return this.pullSeedlings(plotId, idx);
    const cv = cultivationOf(crop);
    const tool = harvestToolEval(crop, this.hasItem);
    if (tool.needsAny.length && !tool.needsAny.some(this.hasItem)) return fail(this.needToolKo(tool.needsAny, cv));
    // 밭 손질 작물 — 첫 손만 하고 칸에서 말린다(가방에 넣지 않는다)
    if (cv.process) {
      if (!startFieldProcess(cell, Date.now())) return fail('지금은 벨 수 없다');
      const act = cv.process.first === 'cut' ? 'cut' : cv.process.first === 'dig' ? 'dig' : 'pull';
      this.spend(laborOf(act, crop, { tool }).fatigue);
      GameState.markDirty();
      const verb = cv.process.first === 'cut' ? '베어' : cv.process.first === 'dig' ? '캐어' : '뽑아';
      const laid: FarmActionResult = { ok: true, message: `${josa(crop.nameKo, '을', '를')} ${verb} 밭에 눕혔다 — ${cv.process.dryDays}일 말린 뒤 ${PROCESS_LAST_KO[cv.process.last]}` };
      return act === 'dig' ? this.withWorms(laid, plotId, [idx], 'dig') : laid;
    }
    // 가방 자리 — 거둘 아이템은 미리 안다(등급 = 지금 품질 · 붉어졌는가 = 익은 뒤 흐른 시간)
    const bonus = tool.quality + this.morningBonus(crop);
    const pv = harvestPreview(cell, crop);
    const outId = produceItemId(pv.itemId, gradeOf(Math.min(1, cell.quality + bonus)));
    if (!this.roomFor(outId, crop)) return fail('가방에 자리가 없다 — 한 칸 비우고 거둔다');
    const r = harvestCell(cell, Math.random, { ...this.harvestSkills(), qualityBonus: bonus });
    if (!r) return fail('아직 거둘 때가 아니다');
    this.spend(laborOf('harvest', crop, { tool }).fatigue);
    // 가시 — 코팅 장갑이나 목장갑(장비 가게)을 가방에 두면 안 찔린다
    const thorn = !!cv.thorny && !this.hasItem(GLOVES_ID) && !this.hasItem(WORK_GLOVES_ID);
    if (thorn) GameState.applyIntake(0, 0, -CULTIVATION_TUNING.thornHp);
    const res = this.giveHarvest(r, crop);
    if (r.offsets) {
      const tpl = cropItemTemplate(r.offsets.itemId);
      if (tpl && InventoryStore.addItem(tpl, r.offsets.qty)) {
        res.harvested?.push({ itemId: tpl.id, qty: r.offsets.qty, name: tpl.name });
        res.message += ` — 곁눈 ${r.offsets.qty}개를 떼어 냈다`;
      }
    }
    if (tool.helper && res.ok) res.message += ` — ${josa(TOOL_NAME_KO[tool.helper] ?? '', '으로', '로')} ${tool.quality < 0 ? '빨리 캤지만 몇 개 찍혔다' : '빨리 거뒀다'}`;
    if (thorn) res.message += ' — 가시에 손을 찔렸다(장갑을 끼면 안 다친다)';
    // 248차 — 캐는 작물(감자 · 고구마 · 무 …)은 흙을 파 뒤집는다
    return cv.harvestBy === 'dig' ? this.withWorms(res, plotId, [idx], 'dig') : res;
  }

  /** 247차 — 도구가 없어 못 할 때 한 줄(「낫이 있어야 벤다 — 생활용품점에서 판다」) */
  private needToolKo(ids: string[], cv: CropCultivation): string {
    const names = ids.map((i) => TOOL_NAME_KO[i] ?? cropItemTemplate(i)?.name ?? i);
    const verb = (cv.process?.first ?? cv.harvestBy) === 'cut' ? '벤다' : '캔다';
    const shops = [...new Set(ids.map((i) => shopOfSupply(i)))];
    return `${josa(orList(names), '이', '가')} 있어야 ${verb} — ${shops.join(' · ')}에서 판다`;
  }

  /** 247차 — 아침(5~10시 KST)에 딴 잎 · 열매는 조금 더 좋다(이슬이 마른 서늘한 때) */
  private morningBonus(crop: CropDef): number {
    if (!MORNING_CATS.has(crop.category)) return 0;
    const h = new Date(Date.now() + 9 * 3_600_000).getUTCHours();
    const [a, b] = CULTIVATION_TUNING.morningHours;
    return h >= a && h < b ? CULTIVATION_TUNING.morningQuality : 0;
  }

  /** 247차 — 마지막 손(털기 · 꼬투리 따기 · 묶어 거두기)을 지금 못 하는 까닭(되면 null) — 작업 장면을 열기 전에 본다 */
  processBlock(plotId: string, idx: number): string | null {
    this.advanceAll();
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    const def = crop ? cultivationOf(crop).process : undefined;
    if (!cell || !crop || !def || !cell.process) return '말리는 칸이 아니다';
    if (!cell.process.dryAt) return `아직 마르는 중이다 — ${Math.max(1, Math.ceil(processHoursLeft(cell) / 24))}일 남짓 (비 오는 동안은 마르지 않는다)`;
    const tired = this.tiredBlock();
    if (tired) return tired;
    if (!this.roomFor(produceItemId(crop.harvest.itemId, gradeOf(cell.quality)), crop)) return '가방에 자리가 없다 — 한 칸 비우고 거둔다';
    return null;
  }

  /**
   * 247차 — 다 마른 칸의 마지막 손(털기 · 꼬투리 따기 · 묶어 거두기) — 도리깨가 있으면 품이 줄고, 키가 있으면 키질까지(품질 +).
   * `score` = 털기 작업 장면 점수(서툴면 품질 −0.03) · `winnowScore` = 키질 장면 점수(절반 밑이면 검불이 남는다 — 없으면 키만 보고 한 것으로).
   */
  finishProcess(plotId: string, idx: number, score = 1, winnowScore?: number): FarmActionResult {
    const why = this.processBlock(plotId, idx);
    if (why) return fail(why);
    const cell = this.plot(plotId).cells[idx];
    const crop = getCrop(cell.cropId!)!;
    const def = cultivationOf(crop).process!;
    const tool = processLastToolEval(def, this.hasItem);
    const winnowed = !!def.winnow && this.hasItem(WINNOW_ID) && (winnowScore === undefined || winnowScore >= 0.5);
    const r = finishFieldProcess(cell, Math.random, { ...this.harvestSkills(), qualityBonus: score < 0.5 ? -0.03 : 0 }, { winnowed }, Date.now());
    if (!r) return fail('지금은 털 수 없다');
    const act = def.last === 'thresh' ? 'thresh' : def.last === 'pick' ? 'pick_pods' : 'gather';
    this.spend(laborOf(act, crop, { tool }).fatigue + (winnowed ? laborOf('winnow').fatigue : 0));
    const res = this.giveHarvest(r, crop);
    const notes: string[] = [];
    if (tool.helper) notes.push('도리깨로 털었다');
    if (def.winnow) notes.push(winnowed ? '키로 까불러 검불을 날렸다' : this.hasItem(WINNOW_ID) ? '키질이 서툴러 검불이 섞였다' : '키가 없어 검불이 섞였다');
    const sh = r.processNote?.shatterLoss ?? 0;
    if (sh > 0.04) notes.push(`너무 오래 두어 ${Math.round(sh * 100)}%가 쏟아졌다`);
    if ((r.processNote?.rainLoss ?? 0) > 0.02) notes.push('말리는 동안 비를 맞았다');
    if (notes.length) res.message += ` — ${notes.join(' · ')}`;
    return res;
  }

  /** 247차 — 육묘 트레이에 남은 모종 수(아직 안 셌으면 센다 — 꺼내기 창이 쓴다) */
  trayLeft(plotId: string, idx: number): number {
    const cell = this.plot(plotId).cells[idx];
    if (!cell?.nursery || !cellReady(cell)) return 0;
    if (cell.trayLeft === undefined) corePullSeedlings(cell, Math.random, 0);
    return cell.trayLeft ?? 0;
  }

  /** 247차 — 육묘 트레이에서 모종을 꺼낸다(n포기 · 없으면 다) — 꺼낸 만큼만 모종 아이템이 되고 남은 것은 트레이에 그대로 */
  pullSeedlings(plotId: string, idx: number, n?: number): FarmActionResult {
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    if (!cell || !crop || !cell.nursery || !cellReady(cell)) return fail('아직 모종이 덜 자랐다');
    const id = startOf(crop, cell.start)?.nursery?.seedlingItemId;
    if (!id) return fail('꺼낼 모종이 없다');
    if (!this.roomFor(id, null, true)) return fail('가방에 자리가 없다 — 한 칸 비우고 꺼낸다');
    const r = corePullSeedlings(cell, Math.random, n ?? Infinity);
    if (!r) return fail('꺼낼 모종이 없다');
    this.spend(FARM_LABOR.pull_seedlings * r.qty);
    const res = this.giveHarvest(r, crop);
    if (res.ok) {
      res.message = `${crop.nameKo} 모종 ${r.qty}포기를 트레이에서 꺼냈다${r.more ? ` — ${cell.trayLeft}포기가 트레이에 남았다` : ' — 트레이가 비었다'}`;
    }
    return res;
  }

  /** 247차 — 포기 나누기 · 뿌리 꺾꽂이를 지금 못 하는 까닭(되면 null) */
  divideBlock(plotId: string, idx: number): string | null {
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    if (!cell || !crop) return '나눌 포기가 없다';
    return divideBlockKo(cell, crop, Date.now());
  }

  /** 247차 — 포기를 나눈다(호미) — 심는 물건(모종 · 종구)을 얻고 포기는 조금 성겨진다 */
  divide(plotId: string, idx: number): FarmActionResult {
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    if (!cell || !crop) return fail('나눌 포기가 없다');
    const why = divideBlockKo(cell, crop, Date.now());
    if (why) return fail(why);
    if (!this.hasItem(HOMI_ID)) return fail('호미가 있어야 포기를 나눈다');
    const tired = this.tiredBlock();
    if (tired) return fail(tired);
    const st = crop.starts.find((x) => x.kind !== 'seed') ?? crop.starts[0];
    if (!st || !this.roomFor(st.itemId, null, true)) return fail('가방에 자리가 없다 — 한 칸 비우고 나눈다');
    const r = divideCell(cell, crop, Date.now(), Math.random);
    const tpl = r ? cropItemTemplate(r.itemId) : null;
    if (!r || !tpl) return fail('나눌 수 없다');
    InventoryStore.addItem(tpl, r.qty);
    this.spend(laborOf('divide').fatigue);
    GameState.markDirty();
    const how = cultivationOf(crop).propagate?.by === 'cutting' ? '뿌리를 잘라 꺾꽂이 감을 얻었다' : '포기를 나눴다';
    return { ok: true, message: `${crop.nameKo} ${how} — ${tpl.name} ${r.qty}개`, harvested: [{ itemId: tpl.id, qty: r.qty, name: tpl.name }] };
  }

  /** 247차 — 이 칸 거두기 단추 이름(따기 · 베기 · 캐기 · 뽑기 · 털기 · 꼬투리 따기 · 묶어 거두기 · 모종 꺼내기) — 거둘 때가 아니면 null */
  harvestLabel(plotId: string, idx: number): string | null {
    const cell = this.plot(plotId).cells[idx];
    const crop = cell?.cropId ? getCrop(cell.cropId) : undefined;
    if (!cell || !crop) return null;
    const cv = cultivationOf(crop);
    if (cell.process) return cell.process.dryAt && cv.process ? PROCESS_LAST_KO[cv.process.last] : null;
    if (!cellReady(cell)) return null;
    if (cell.nursery) return '모종 꺼내기';
    const by = cv.process?.first ?? cv.harvestBy;
    return by === 'cut' ? '베기' : by === 'dig' ? '캐기' : by === 'pull' ? '뽑기' : '따기';
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
  private roomFor(outId: string, crop: CropDef | null, seedling = false): boolean {
    const parts: { tpl: { id: string; category: InvCategory }; qty: number }[] = [{ tpl: { id: outId, category: seedling ? 'consumable' : 'food' }, qty: 1 }];
    const seed = crop?.starts.find((st) => st.kind === 'seed' && st.cost > 0);
    if (seed && GameState.skillBonus('seed_saver') > 0) parts.push({ tpl: { id: seed.itemId, category: 'consumable' }, qty: 1 });
    return Object.keys(InventoryStore.slotShortfall(parts)).length === 0;
  }

  private giveHarvest(r: FarmHarvestResult, crop: CropDef): FarmActionResult {
    const id = r.seedling ? r.itemId : produceItemId(r.itemId, r.grade);
    const tpl = cropItemTemplate(id);
    if (!tpl) return fail('거둔 것을 담을 수 없다');
    InventoryStore.addItem(tpl, r.qty);
    const harvested = [{ itemId: id, qty: r.qty, name: tpl.name }];
    // 238차 — 육묘 트레이: 모종은 수확이 아니다(거둔 횟수 · 퀘스트에 세지 않는다)
    if (r.seedling) {
      GameState.markDirty();
      return { ok: true, message: `${tpl.name} ${r.qty}포기를 길러 냈다 — 늦서리 뒤 밭에 옮겨 심는다`, harvested };
    }
    if (r.seedBack) {
      const st = cropItemTemplate(r.seedBack.itemId);
      if (st && InventoryStore.addItem(st, r.seedBack.qty)) harvested.push({ itemId: st.id, qty: r.seedBack.qty, name: st.name });
    }
    this.harvests++;
    // 241차 — 작물별 횟수 · 원종을 딱 n번째 거둔 순간 개량종이 종묘사에 들어온다(알림은 20초 주기 큐 + 이 메시지 꼬리)
    const nth = (this.harvestsBy[crop.id] ?? 0) + 1;
    this.harvestsBy[crop.id] = nth;
    const opened = variantsOf(crop.id).filter((v) => v.variant?.afterHarvests === nth);
    if (opened.length) this.notices.push(variantNoticeKo(crop, opened));
    // 243차 — 낱개로 거두는 작물을 처음 거두면 포장을 한 번 알려 준다(팩 = 낱개 n + 포장 용기 1 · 제값)
    const pack = crop.harvest.pack;
    const packTip = !!pack && !GameState.getFlag('tip.farm.pack');
    if (pack && packTip) {
      GameState.setFlag('tip.farm.pack', true);
      this.notices.push(`[텃밭] 가방에서 [포장하기] — ${looseCountKo(crop.harvest.itemId, pack.units)} + 포장 용기 1개 = ${pack.nameKo} (팩은 제값 · 용기는 생활용품점)`);
    }
    GameState.markDirty();
    StoryStore.event({ kind: 'farm', action: 'harvest', cropId: crop.id });
    // 236차 — 덤(버섯 송이가 굵게 올라온 회차)은 따로 말해 준다 · 238차 — 검붉은 고추 · 서리 끝물 · 병으로 준 것
    const bonus = r.bonusQty ? ` — 송이가 굵어 ${r.bonusQty}개 더` : '';
    const turning = r.turning ? ' — 검붉게 덜 익은 것이라 품질이 떨어진다' : '';
    const frosted = r.frosted ? ' — 서리 맞은 끝물, 이 칸은 끝났다' : '';
    const sick = (r.diseaseMult ?? 1) < 0.85 ? ` — 병으로 ${Math.round((1 - (r.diseaseMult ?? 1)) * 100)}% 줄었다` : '';
    const variant = opened.length ? ` — 종묘사에 ${opened.map((v) => v.nameKo).join(' · ')}이 들어온다` : '';
    return { ok: true, message: `${tpl.name} ${r.qty}개를 거뒀다${bonus}${turning}${frosted}${sick}${variant}`, harvested };
  }

  /** 걷어 낸다(자라던 것을 버린다 — 일군 땅은 남는다) */
  clear(plotId: string, idx: number): FarmActionResult {
    const cell = this.plot(plotId).cells[idx];
    if (!cell?.cropId) return fail('걷어 낼 것이 없다');
    const name = getCrop(cell.cropId)?.nameKo ?? '';
    clearCell(cell);
    GameState.markDirty();
    return this.withWorms({ ok: true, message: `${name}을(를) 걷어 냈다` }, plotId, [idx], 'clear');
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
    return { v: 1, careV: CARE_V, plots, harvests: this.harvests, harvestsBy: { ...this.harvestsBy } };
  }

  /** 로드 — 칸 수가 어긋난(구조가 바뀐) 구획은 빈 칸으로 채워 맞춘다(유저 상태는 그대로) */
  deserialize(s: FarmSaveState | undefined | null): void {
    this.plots.clear();
    this.harvests = Math.max(0, Math.floor(s?.harvests ?? 0));
    this.harvestsBy = {};
    if (s?.harvestsBy && typeof s.harvestsBy === 'object') {
      for (const [k, v] of Object.entries(s.harvestsBy)) if (typeof v === 'number' && v > 0) this.harvestsBy[k] = Math.floor(v);
    }
    if (!s?.plots) return;
    for (const [k, p] of Object.entries(s.plots)) {
      if (!p || !Array.isArray(p.cells)) continue;
      const want = k === INDOOR_PLOT ? INDOOR_SLOTS : FARM_CELLS;
      const cells = p.cells.slice(0, want);
      while (cells.length < want) cells.push({ ...newFarmCell(Date.now()), tilled: k === INDOOR_PLOT });
      this.plots.set(k, {
        site: k === INDOOR_PLOT ? 'indoor' : 'plot', cells, facilities: Array.isArray(p.facilities) ? p.facilities : [],
        // 247차 — 구획 난수 씨 · 흙에 떨어진 씨(구세이브는 없다 — 0 · 빈 은행)
        ...(typeof p.salt === 'number' ? { salt: p.salt } : {}),
        ...(Array.isArray(p.seedBank) ? { seedBank: p.seedBank.filter((x): x is string => typeof x === 'string').slice(-6) } : {}),
      });
    }
    // 245차 — 구세이브: 245차에 생긴 일 때문에 자라던 작물이 로드 직후 「놓친 일」로 한꺼번에 깎이지 않게 지난 차례를 벌 없이 넘긴다
    if ((s.careV ?? 0) < CARE_V) {
      const now = Date.now();
      for (const p of this.plots.values()) for (const c of p.cells) {
        const crop = c.cropId ? getCrop(c.cropId) : undefined;
        if (crop) settleCareRounds(c, crop, now);
      }
    }
    this.advanceAll(Date.now());   // 로드 직후는 늘 굴린다(1초 건너뛰기 없이)
  }

  resetAll(): void { this.plots.clear(); this.harvests = 0; this.harvestsBy = {}; }
}

export const FarmStore = new FarmStoreImpl();

if (import.meta.env.DEV) {
  // 실렌더 검증 하네스용 — `import('/src/…')`는 게임 인스턴스와 별개 모듈이라(59차 `__INV` 규칙) 실싱글턴을 노출한다
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__FARM = FarmStore;
}
