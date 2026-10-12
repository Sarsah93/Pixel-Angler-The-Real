/**
 * @file CropCareSim.ts
 * @description 238차 — 관리 작업 상태 · 실행 · 병해 · 쓰러짐 · 서리 · 활착 (텃밭 성장 계산 `FarmSim`이 시간마다 · 날마다 부른다)
 *
 *  - 작업은 심은 날 기준 **차례(round)** 로 센다 — 차례 = 한 횟수 + 놓친 횟수. 차례마다 열리는 날이 있고(처음 창 · 이후 간격),
 *    창이 닫히면 하루 한 번 자동으로 「놓침」 처리해 벌(수확 배수 · 품질 · 병 잘 듦 · 쓰러짐)을 준다.
 *  - 방제(`only: 'riskSeason'`)는 차례가 아니라 **철 + 보호가 끝났는가**로 「할 일」이 된다 — 안 쳐도 벌은 없다. 벌은 병 자체다.
 *  - 병든 것 걷어 내기(`only: 'diseased'`)는 병이 들었을 때만 · 사흘 간격.
 *  - 병은 하루 한 번(KST 자정) 작물마다 든다 — 철 · 비(젖은 날) · 멀칭 · 하우스 · 곁순 · 약 보호 · 방제 스킬을 곱한다.
 *    든 병은 날마다 번진다(역병은 포기를 죽여 섬을 깎고, 탄저 · 바이러스는 거둘 때 수량을 깎는다 — `diseaseYieldMult`).
 *  - 서리: 가을 첫서리(속초 평년 10월 하순 — 해마다 다르게 결정적) 뒤에는 자라지 않고 사흘 안에 거둬야 한다.
 *    봄 늦서리(4월 10~24일) 전에는 서리에 약한 작물을 옮겨 심지 못한다.
 *  - 난수는 **시각 · 칸 해시**(결정적 — 세이브 재현 · 시험 고정). `rand01` 주입은 작업 점수에만 쓴다.
 */

import type {
  CareTaskDef, CareTaskId, CropCarePlan, CropDef, CropDisease, FarmCellState, FarmEnv, FarmPlotState,
} from '../types/Farming.js';
import { carePlanOf, DISEASE_SEASON, NURSERY_PLAN, RISK_SEASON, CARE_TASK_KO } from '../db-schema/CropCareDatabase.js';

const H = 3_600_000;
const DAY = 86_400_000;
const KST = 9 * H;

function hash32(n: number, salt: number): number {
  let t = (Math.imul(n | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  t = Math.imul(t ^ (t >>> 16), 0x7feb352d);
  t = Math.imul(t ^ (t >>> 15), 0x846ca68b);
  return (t ^ (t >>> 16)) >>> 0;
}
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const u01 = (h: number): number => h / 4294967296;
const dayIndexOf = (ms: number): number => Math.floor((ms + KST) / DAY);
const monthOf = (ms: number): number => new Date(ms + KST).getUTCMonth() + 1;
const yearOf = (ms: number): number => new Date(ms + KST).getUTCFullYear();

export const CARE_TUNING = {
  /** 병이 드는 하루 확률 — 철 안 · 철 밖 */
  diseaseDaily: {
    blight: { on: 0.025, off: 0.002 }, anthracnose: { on: 0.03, off: 0.003 }, virus: { on: 0.012, off: 0.002 },
  } as Record<CropDisease, { on: number; off: number }>,
  /** 젖은 날(비 뒤 24시간) 배수 — 역병 · 탄저병 */
  wetMult: 2.0,
  /** 든 병이 하루에 번지는 양 */
  spread: { blight: 0.07, anthracnose: 0.05, virus: 0.04 } as Record<CropDisease, number>,
  /** 약 보호 중에는 번짐도 느리다 */
  spreadProtected: 0.3,
  /** 역병이 하루에 죽이는 포기(섬) = 이 값 × 심한 정도 · 바닥 */
  blightStandLoss: 0.03,
  blightStandFloor: 0.25,
  /** 거둘 때 수량 손실 — 탄저 최대 60% · 바이러스 최대 50%(심한 정도 1일 때) */
  anthracnoseLoss: 0.6,
  virusLoss: 0.5,
  /** 병이 든 동안 하루 품질 감소 × 심한 정도 */
  diseaseQualityLoss: 0.003,
  /** 처음 들 때 심한 정도 */
  onset: 0.15,
  /** 지주 없이 젖은 날 쓰러질 확률 · 쓰러지면 수확 배수 · 품질 */
  lodgeDaily: 0.25,
  lodgeYield: 0.75,
  lodgeQuality: 0.08,
  /** 활착기(2주)에 흙이 마르면 시간당 섬 감소 · 바닥 */
  establishDryLoss: 0.0015,
  establishFloor: 0.3,
  /** 서리 맞은 뒤 거둘 수 있는 시간(h) — 지나면 끝(칸이 빈다) */
  frostGraceH: 72,
  /** 덜 익은(검붉은) 고추를 거두면 품질 */
  turningQuality: 0.12,
  /** 작업 점수가 이보다 낮으면 서툴렀다 — 효과 절반 */
  clumsyBelow: 0.5,
  /** 하우스 안에서는 비를 안 맞는다 — 탄저(빗물 전파) · 역병 */
  greenhouseMult: { blight: 0.6, anthracnose: 0.3, virus: 1 } as Record<CropDisease, number>,
  /** 역병은 흙이 흠뻑 젖어 있으면 더 */
  blightSoggyMult: 1.4,
  /** 걷어 내기 — 심한 정도를 줄이는 양 · 뽑아 내는 포기(섬) */
  cull: { anthracnose: 0.4, blight: 0.3, virus: 0.5 } as Record<CropDisease, number>,
  cullStand: { anthracnose: 0, blight: 0.08, virus: 0.12 } as Record<CropDisease, number>,
};

// ─────────────────────────────────────────────
// 서리 · 철
// ─────────────────────────────────────────────

/** 속초 봄 늦서리 마지막 날(KST 날 번호) — 4월 10~24일 사이 해마다 결정적 */
export function lastFrostDayIndex(year: number): number {
  const base = dayIndexOf(Date.UTC(year, 3, 10) - KST);
  return base + Math.floor(u01(hash32(year, 4273)) * 15);
}

/** 속초 가을 첫서리 날(KST 날 번호) — 10월 25일~11월 13일 사이 해마다 결정적(평년 10월 하순) */
export function firstFrostDayIndex(year: number): number {
  const base = dayIndexOf(Date.UTC(year, 9, 25) - KST);
  return base + Math.floor(u01(hash32(year, 9311)) * 20);
}

/** 방제가 「할 일」로 보이는 철인가(5~9월) */
export function isRiskSeason(month: number): boolean {
  return RISK_SEASON.includes(month);
}

/**
 * 서리에 약한 작물을 지금 밭에 옮겨 심을 수 있는가 — 늦서리가 끝나기 전(4월)이면 막는다.
 * 실황 기온이 있으면 4월에 10℃ 밑일 때도 막는다(「최저 기온 10℃ 이상으로 안정될 때」).
 */
export function frostBlockKo(crop: CropDef, plot: Pick<FarmPlotState, 'site' | 'facilities'>, nowMs: number, tempC?: number): string | null {
  if (plot.site === 'indoor' || plot.facilities.includes('greenhouse')) return null;
  if (!carePlanOf(crop).frostEnds) return null;
  const month = monthOf(nowMs);
  if (month > 5 || month < 3) return null;
  if (dayIndexOf(nowMs) < lastFrostDayIndex(yearOf(nowMs))) return '늦서리가 끝나지 않았다 — 최저 기온이 10℃ 넘게 안정되면 옮겨 심는다(4월 하순~5월 상순)';
  if (month === 4 && tempC !== undefined && tempC < 10) return '지금은 너무 춥다 — 기온이 10℃를 넘을 때 옮겨 심는다(냉해를 입는다)';
  return null;
}

// ─────────────────────────────────────────────
// 작업 상태
// ─────────────────────────────────────────────

export type CareStatusKind = 'upcoming' | 'due' | 'done' | 'closed';

export interface CareStatus {
  def: CareTaskDef;
  status: CareStatusKind;
  /** 이번 차례(0부터) · 전체 차례 */
  round: number;
  total: number;
  /** 열리는 날(심은 날 기준 일수) — 방제 · 걷어 내기는 0 */
  dueDay: number;
  /** 열리기까지 남은 날(열렸으면 0) */
  daysLeft: number;
  /** 한 횟수 · 놓친 횟수 */
  done: number;
  skipped: number;
}

/** 이 칸의 관리 표(육묘 칸은 가식 표) */
export function planOfCell(cell: Pick<FarmCellState, 'nursery'>, crop: CropDef): CropCarePlan {
  return cell.nursery ? NURSERY_PLAN : carePlanOf(crop);
}

/** 심은 뒤 흐른 날(소수) */
export function cellDay(cell: Pick<FarmCellState, 'plantedAt'>, nowMs: number): number {
  return cell.plantedAt ? Math.max(0, (nowMs - cell.plantedAt) / DAY) : 0;
}

function rec(cell: FarmCellState, id: CareTaskId): { done: number; lastMs: number; skipped: number } {
  cell.care ??= {};
  return (cell.care[id] ??= { done: 0, lastMs: 0, skipped: 0 });
}

function roundGrace(def: CareTaskDef, round: number): number {
  if (round === 0) return def.dayWindow[1] - def.dayWindow[0];
  const every = def.repeat?.everyDays ?? 0;
  return Math.min(7, Math.max(2, every - 2));
}

function roundDueDay(def: CareTaskDef, round: number): number {
  return def.dayWindow[0] + round * (def.repeat?.everyDays ?? 0);
}

/** 든 병 — 심한 정도가 0보다 큰 것 */
export function cellDiseases(cell: Pick<FarmCellState, 'diseases'>): { id: CropDisease; severity: number; sinceMs: number }[] {
  const out: { id: CropDisease; severity: number; sinceMs: number }[] = [];
  for (const [k, v] of Object.entries(cell.diseases ?? {})) if (v && v.severity > 0) out.push({ id: k as CropDisease, severity: v.severity, sinceMs: v.sinceMs });
  return out;
}

function protectedFor(cell: FarmCellState, disease: CropDisease, nowMs: number): { untilMs: number; mult: number } | null {
  const p = cell.protect?.[disease];
  return p && nowMs < p.untilMs ? p : null;
}

/** 작업 하나의 상태(보이지 않을 조건이면 null) */
export function careStatusOf(cell: FarmCellState, _crop: CropDef, def: CareTaskDef, nowMs: number): CareStatus | null {
  const r = cell.care?.[def.id] ?? { done: 0, lastMs: 0, skipped: 0 };
  const total = 1 + (def.repeat?.times ?? 0);
  const base = { def, round: r.done + r.skipped, total, done: r.done, skipped: r.skipped };
  if (def.only === 'riskSeason') {
    const month = monthOf(nowMs);
    if (!isRiskSeason(month)) return null;
    if (cell.growth < 0.15 && cell.picks === 0) return null;   // 포기가 자리 잡은 뒤부터(막 심은 날 약부터 치지 않는다)
    if (r.done >= total) return { ...base, status: 'closed', dueDay: 0, daysLeft: 0 };
    const guards = def.effect?.protect ?? [];
    const covered = guards.length > 0 && guards.every((g) => !!protectedFor(cell, g.disease, nowMs));
    if (covered) return { ...base, status: 'done', dueDay: 0, daysLeft: 0 };
    return { ...base, status: 'due', dueDay: 0, daysLeft: 0 };
  }
  if (def.only === 'diseased') {
    if (cellDiseases(cell).length === 0) return null;
    const every = (def.repeat?.everyDays ?? 1) * DAY;
    const cooling = r.lastMs > 0 && nowMs - r.lastMs < every;
    return { ...base, status: cooling ? 'done' : 'due', dueDay: 0, daysLeft: cooling ? Math.ceil((r.lastMs + every - nowMs) / DAY) : 0 };
  }
  const round = r.done + r.skipped;
  if (round >= total) return { ...base, status: 'closed', dueDay: roundDueDay(def, total - 1), daysLeft: 0 };
  const days = cellDay(cell, nowMs);
  const dueDay = roundDueDay(def, round);
  if (days < dueDay) return { ...base, status: r.done > 0 ? 'done' : 'upcoming', dueDay, daysLeft: Math.ceil(dueDay - days) };
  return { ...base, status: 'due', dueDay, daysLeft: 0 };
}

/** 이 칸의 보이는 작업 전부(놓쳐서 닫힌 것은 뺀다 — 한 적이 있는 닫힌 것은 남긴다) */
export function careStatusList(cell: FarmCellState, crop: CropDef, nowMs: number): CareStatus[] {
  if (!cell.cropId || cell.resting) return [];
  const plan = planOfCell(cell, crop);
  const out: CareStatus[] = [];
  for (const def of plan.tasks) {
    const st = careStatusOf(cell, crop, def, nowMs);
    if (!st) continue;
    if (st.status === 'closed' && st.done === 0) continue;
    out.push(st);
  }
  return out;
}

/** 지금 할 수 있는 작업 */
export function careDue(cell: FarmCellState, crop: CropDef, nowMs: number): CareStatus[] {
  return careStatusList(cell, crop, nowMs).filter((s) => s.status === 'due');
}

/** 활착기인가(심은 뒤 며칠 · 모종) — 흙을 촉촉하게 둬야 한다 */
export function inEstablishment(cell: FarmCellState, crop: CropDef, nowMs: number): { daysLeft: number } | null {
  if (cell.nursery || !cell.cropId) return null;
  const plan = carePlanOf(crop);
  if (!plan.establishDays) return null;
  const d = cellDay(cell, nowMs);
  return d < plan.establishDays ? { daysLeft: Math.ceil(plan.establishDays - d) } : null;
}

export interface CareResult {
  ok: boolean;
  reasonKo?: string;
  /** 칸에서 쓴 물건(호출 쪽이 가방에서 뺀다 — 미리 확인하고 부른다) */
  needs: { itemId: string; qty: number }[];
  messageKo: string;
  /** 서툴렀다(점수가 낮아 효과 절반) */
  clumsy?: boolean;
}

/**
 * 작업을 한다 — 「할 일」일 때만. `score` 0..1은 작업 장면 점수(낮으면 효과 절반).
 * 가방에서 뺄 물건은 `needs`로 돌려준다(가방은 클라이언트 몫).
 */
export function doCare(cell: FarmCellState, crop: CropDef, id: CareTaskId, nowMs: number, score = 1): CareResult {
  const plan = planOfCell(cell, crop);
  const def = plan.tasks.find((t) => t.id === id);
  if (!def) return { ok: false, reasonKo: '이 작물에는 없는 일이다', needs: [], messageKo: '' };
  const st = careStatusOf(cell, crop, def, nowMs);
  if (!st || st.status !== 'due') return { ok: false, reasonKo: st?.status === 'upcoming' ? `아직 때가 아니다 — ${st.daysLeft}일 뒤` : '지금 할 일이 아니다', needs: [], messageKo: '' };
  const clumsy = score < CARE_TUNING.clumsyBelow;
  const k = clumsy ? 0.5 : 1;
  const r = rec(cell, id);
  r.done += 1;
  r.lastMs = nowMs;
  const e = def.effect;
  if (e?.yieldMult) cell.careYield = (cell.careYield ?? 1) * (1 + (e.yieldMult - 1) * k);
  if (e?.quality) cell.quality = Math.min(1, cell.quality + e.quality * k);
  for (const p of e?.protect ?? []) {
    cell.protect ??= {};
    cell.protect[p.disease] = { untilMs: nowMs + p.days * DAY * (clumsy ? 0.6 : 1), mult: clumsy ? Math.min(1, p.mult * 2) : p.mult };
  }
  if (id === 'cull_diseased') {
    for (const d of cellDiseases(cell)) {
      const cut = CARE_TUNING.cull[d.id] * k;
      const next = Math.max(0, d.severity - cut);
      cell.stand = Math.max(0.2, cell.stand - CARE_TUNING.cullStand[d.id] * k);
      if (next <= 0.001) delete cell.diseases![d.id];
      else cell.diseases![d.id] = { severity: next, sinceMs: d.sinceMs };
    }
  }
  const name = CARE_TASK_KO[id];
  const roundNote = st.total > 1 ? ` (${st.round + 1}/${st.total})` : '';
  return {
    ok: true, needs: def.needs ?? [], clumsy,
    messageKo: clumsy ? `${name}${roundNote} — 서툴러서 효과가 절반이다` : `${name}${roundNote} — 했다`,
  };
}

// ─────────────────────────────────────────────
// 날마다 — 놓친 차례 · 병 · 쓰러짐 · 서리
// ─────────────────────────────────────────────

function applyMissed(cell: FarmCellState, def: CareTaskDef): void {
  const m = def.missed;
  if (!m) return;
  if (m.yieldMult) cell.careYield = (cell.careYield ?? 1) * m.yieldMult;
  if (m.quality) cell.quality = Math.max(0.3, cell.quality - m.quality);
}

/** 창이 닫힌 차례를 놓침으로 넘긴다(벌 적용) — 하루 한 번 */
export function skipExpiredRounds(cell: FarmCellState, crop: CropDef, nowMs: number): CareTaskId[] {
  const plan = planOfCell(cell, crop);
  const days = cellDay(cell, nowMs);
  const missed: CareTaskId[] = [];
  for (const def of plan.tasks) {
    if (def.only) continue;
    const r = rec(cell, def.id);
    const total = 1 + (def.repeat?.times ?? 0);
    let guard = 0;
    while (r.done + r.skipped < total && guard++ < 64) {
      const round = r.done + r.skipped;
      if (days <= roundDueDay(def, round) + roundGrace(def, round)) break;
      r.skipped += 1;
      applyMissed(cell, def);
      if (!missed.includes(def.id)) missed.push(def.id);
    }
  }
  return missed;
}

function diseaseMultOf(cell: FarmCellState, plan: CropCarePlan, d: CropDisease): number {
  let m = 1;
  for (const def of plan.tasks) {
    const r = cell.care?.[def.id];
    if (!r) continue;
    if (r.done > 0 && def.effect?.diseaseMult?.[d]) m *= def.effect.diseaseMult[d]!;
    if (r.done === 0 && r.skipped > 0 && def.missed?.diseaseMult?.[d]) m *= def.missed.diseaseMult[d]!;
  }
  return m;
}

export interface DailyCareReport {
  /** 오늘 새로 든 병 */
  onset: CropDisease[];
  /** 오늘 놓친 작업 */
  missed: CareTaskId[];
  lodged: boolean;
  frosted: boolean;
}

/**
 * 하루 한 번(KST 자정) — 놓친 차례 · 병 발생 · 병 번짐 · 쓰러짐 · 첫서리.
 * `season` 0이면(철 밖 · 실내 불 꺼짐) 병은 들지 않고 놓친 차례만 넘긴다.
 */
export function dailyCare(
  cell: FarmCellState, crop: CropDef, plot: Pick<FarmPlotState, 'site' | 'facilities'>, ms: number, env: FarmEnv, cellIdx: number, season: number,
): DailyCareReport {
  const report: DailyCareReport = { onset: [], missed: [], lodged: false, frosted: false };
  if (!cell.cropId || cell.resting) return report;
  const plan = planOfCell(cell, crop);
  report.missed = skipExpiredRounds(cell, crop, ms);
  const indoor = plot.site === 'indoor';
  if (indoor || cell.nursery) return report;
  const day = dayIndexOf(ms);
  const month = monthOf(ms);
  const wet = (cell.wetH ?? 0) > 0;
  const salt = hashStr(`${cell.plantedAt ?? 0}|${cellIdx}|${crop.id}`);
  // 첫서리 — 서리에 끝나는 작물이 노지(하우스 없이)에 서 있으면
  if (plan.frostEnds && !cell.frostedAt && !plot.facilities.includes('greenhouse') && month >= 10 && day >= firstFrostDayIndex(yearOf(ms))) {
    cell.frostedAt = ms;
    report.frosted = true;
  }
  if (season <= 0 || cell.frostedAt) return report;
  // 쓰러짐 — 지주를 놓쳤고 젖은 날
  const stakeDef = plan.tasks.find((t) => t.id === 'stake');
  if (stakeDef?.missed?.lodging && !cell.lodged) {
    const r = cell.care?.stake;
    if (r && r.done === 0 && r.skipped > 0 && wet && u01(hash32(day, salt ^ 0x1234)) < CARE_TUNING.lodgeDaily) {
      cell.lodged = true;
      cell.careYield = (cell.careYield ?? 1) * CARE_TUNING.lodgeYield;
      cell.quality = Math.max(0.3, cell.quality - CARE_TUNING.lodgeQuality);
      report.lodged = true;
    }
  }
  // 병 — 포기가 자리 잡은 뒤(자람 10%)
  if (cell.growth < 0.1 && cell.picks === 0) return report;
  const resist = Math.max(0, 1 - (env.skill?.pestResist ?? 0));
  plan.diseases.forEach((d, i) => {
    cell.diseases ??= {};
    const cur = cell.diseases[d];
    const prot = protectedFor(cell, d, ms);
    if (cur && cur.severity > 0) {
      let rate = CARE_TUNING.spread[d];
      if (wet && d !== 'virus') rate *= 1.8;
      if (prot) rate *= CARE_TUNING.spreadProtected;
      cur.severity = Math.min(1, cur.severity + rate);
      if (d === 'blight') cell.stand = Math.max(CARE_TUNING.blightStandFloor, cell.stand - CARE_TUNING.blightStandLoss * cur.severity);
      cell.quality = Math.max(0.3, cell.quality - CARE_TUNING.diseaseQualityLoss * cur.severity);
      return;
    }
    const base = DISEASE_SEASON[d].includes(month) ? CARE_TUNING.diseaseDaily[d].on : CARE_TUNING.diseaseDaily[d].off;
    let m = diseaseMultOf(cell, plan, d) * resist;
    if (wet && d !== 'virus') m *= CARE_TUNING.wetMult;
    if (d === 'blight' && cell.moisture > 0.85) m *= CARE_TUNING.blightSoggyMult;
    if (plot.facilities.includes('greenhouse')) m *= CARE_TUNING.greenhouseMult[d];
    if (prot) m *= prot.mult;
    if (u01(hash32(day, salt ^ (0x51 + i * 977))) < base * m) {
      cell.diseases[d] = { severity: CARE_TUNING.onset, sinceMs: ms };
      report.onset.push(d);
    }
  });
  return report;
}

/** 시간마다 — 활착기에 흙이 마르면 섬이 준다(모종이 뿌리를 못 내린다) */
export function establishHour(cell: FarmCellState, crop: CropDef, nowMs: number, water: number, season: number): void {
  if (season <= 0 || water > 0 || cell.nursery) return;
  if (!inEstablishment(cell, crop, nowMs)) return;
  cell.establishDryH = (cell.establishDryH ?? 0) + 1;
  cell.stand = Math.max(CARE_TUNING.establishFloor, cell.stand - CARE_TUNING.establishDryLoss);
}

// ─────────────────────────────────────────────
// 거둘 때
// ─────────────────────────────────────────────

/** 병으로 깎이는 수확 배수(탄저 · 바이러스 — 역병은 이미 섬을 깎았다) */
export function diseaseYieldMult(cell: Pick<FarmCellState, 'diseases'>): number {
  let m = 1;
  for (const d of cellDiseases(cell)) {
    if (d.id === 'anthracnose') m *= 1 - CARE_TUNING.anthracnoseLoss * d.severity;
    else if (d.id === 'virus') m *= 1 - CARE_TUNING.virusLoss * d.severity;
  }
  return Math.max(0.02, m);
}

export type RipeStage = 'green' | 'turning' | 'red';

/** 익는 단계 — 풋 · 검붉은(덜 익음) · 홍(다 익음). 익는 작물이 아니거나 아직 안 익었으면 null */
export function ripeStageOf(cell: Pick<FarmCellState, 'ripeH' | 'growth' | 'picks' | 'regrow'>, crop: CropDef): RipeStage | null {
  const r = crop.harvest.ripenTo;
  if (!r) return null;
  const ready = cell.picks === 0 ? cell.growth >= 1 - 1e-6 : cell.regrow >= 1 - 1e-6;
  if (!ready) return null;
  const turningH = (r.turningDays ?? r.afterDays * 0.5) * 24;
  if (cell.ripeH <= turningH) return 'green';
  if (cell.ripeH <= r.afterDays * 24) return 'turning';
  return 'red';
}

export const RIPE_STAGE_KO: Record<RipeStage, string> = { green: '풋고추', turning: '검붉게 익는 중', red: '홍고추' };
export const RIPE_STAGE_EN: Record<RipeStage, string> = { green: 'Green', turning: 'Turning (dark red)', red: 'Fully red' };

/** 포기당 한 번 거두는 수 — 칸당 수량 ÷ 포기 수(상세 · 텃밭 창 「포기당」) */
export function perPlantYield(crop: CropDef, perCell: number): [number, number] {
  const n = Math.max(1, perCell);
  return [Math.max(1, Math.round(crop.harvest.qtyPerCell[0] / n)), Math.max(1, Math.round(crop.harvest.qtyPerCell[1] / n))];
}
