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
 */

import {
  FARM_CELLS, FARM_COLS, INDOOR_SLOTS, advancePlot, canPlant, cellReady, clearCell, climateRainAt, compostCell,
  cropStartOfItem, getCrop, getFarmSupply, harvestCell, interimHarvestCell, interimOpen, kstMonthOf, newFarmPlot,
  plantCell, produceItemId, supplyOfFacility, tillCell, waterCell, newFarmCell, gradeOf, harvestPreview,
  careStatusList, careDue, doCare as coreDoCare, inEstablishment, cellDiseases, CARE_TASK_KO, DISEASE_KO, DISEASE_CONTROL_KO, TRAY_ID, variantsOf,
  planOfCell, settleCareRounds, diseaseOnsetKo, DISEASE_DEFS,
  type CropDef, type FarmEnv, type FarmFacility, type FarmHarvestResult, type FarmPlantCtx, type FarmPlotState, type LicenseType,
  type CareStatus, type CareTaskId, type CropDisease,
} from '@tra/core';
import { GameState } from './GameState.js';
import { InventoryStore, type InvCategory } from './InventoryStore.js';
import { StoryStore } from './StoryStore.js';
import { ExternalDataStore } from './ExternalDataStore.js';
import { cropItemTemplate, variantNoticeKo, looseCountKo } from '../data/CropItems.js';

/** 집 안 선반 구획 키 */
export const INDOOR_PLOT = 'indoor';
/** 호미 · 퇴비 · 물뿌리개 아이템 id */
export const HOMI_ID = 'farm_homi';
export const COMPOST_ID = 'farm_compost';
export const WATERING_CAN_ID = 'inv_watering_can';

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
}

const fail = (message: string): FarmActionResult => ({ ok: false, message });

/** 238차 — 텃밭 창의 할 일 한 줄: 상태 + 모자란 자재(245차 — 도구도) */
export interface FarmCareRow {
  st: CareStatus;
  missing: { itemId: string; name: string; need: number; have: number; tool?: boolean }[];
}

/** 245차 — 관리 표 판 */
const CARE_V = 245;
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

  /** 모든 구획을 지금까지 굴린다(창을 열 때 · 필드 틱 · 로드 직후) — 굴린 뒤 새 할 일 · 병 · 쓰러짐 · 서리를 알림 줄로 모은다 */
  advanceAll(nowMs = Date.now()): void {
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
        for (const st of careDue(c, crop, nowMs)) {
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
    if (!cell || !crop) return [];
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
    // 가방 자리 — 거둘 아이템은 미리 안다(등급 = 지금 품질 · 붉어졌는가 = 익은 뒤 흐른 시간 · 육묘 칸이면 모종)
    const pv = harvestPreview(cell, crop);
    const outId = pv.seedling ? pv.itemId : produceItemId(pv.itemId, gradeOf(cell.quality));
    if (!this.roomFor(outId, pv.seedling ? null : crop, pv.seedling)) return fail('가방에 자리가 없다 — 한 칸 비우고 거둔다');
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
      this.plots.set(k, { site: k === INDOOR_PLOT ? 'indoor' : 'plot', cells, facilities: Array.isArray(p.facilities) ? p.facilities : [] });
    }
    // 245차 — 구세이브: 245차에 생긴 일 때문에 자라던 작물이 로드 직후 「놓친 일」로 한꺼번에 깎이지 않게 지난 차례를 벌 없이 넘긴다
    if ((s.careV ?? 0) < CARE_V) {
      const now = Date.now();
      for (const p of this.plots.values()) for (const c of p.cells) {
        const crop = c.cropId ? getCrop(c.cropId) : undefined;
        if (crop) settleCareRounds(c, crop, now);
      }
    }
    this.advanceAll();
  }

  resetAll(): void { this.plots.clear(); this.harvests = 0; this.harvestsBy = {}; }
}

export const FarmStore = new FarmStoreImpl();

if (import.meta.env.DEV) {
  // 실렌더 검증 하네스용 — `import('/src/…')`는 게임 인스턴스와 별개 모듈이라(59차 `__INV` 규칙) 실싱글턴을 노출한다
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__FARM = FarmStore;
}
