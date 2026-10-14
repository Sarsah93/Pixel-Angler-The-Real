/**
 * @file CropCareSim.ts
 * @description 238차 — 관리 작업 상태 · 실행 · 병해 · 쓰러짐 · 서리 · 활착 (텃밭 성장 계산 `FarmSim`이 시간마다 · 날마다 부른다)
 *              245차 — 작물 84종의 일 · 병해충 16종으로 일반화(달력 · 자람 · 거둘 때마다 차례 · 도구 · 여러해살이 작기)
 *
 *  - 작업은 **차례(round)** 로 센다 — 차례 = 한 횟수 + 놓친 횟수. 차례마다 열리는 때가 있고, 때가 지나면 하루 한 번 자동으로
 *    「놓침」 처리해 벌(수확 배수 · 품질 · 병 잘 듦 · 쓰러짐)을 준다. 때를 세는 방법은 넷:
 *      ① 날(`dayWindow` · `repeat`) — 심은 날부터(여러해살이는 올해 다시 올라온 날부터 — `cycleAt`)
 *      ② 달력(`months`) — 해마다 그 달 구간에 한 번(겨울 덮기 · 이른 봄 웃거름 · 가지치기 · 보리밟기)
 *      ③ 자람(`growth`) — 자람이 그 구간일 때 한 번(배추 묶기 · 열매 솎기 · 이삭 망)
 *      ④ 거둘 때마다(`afterPick`) — 벤 뒤 다시 자람이 60%를 넘기 전(벤 뒤 웃거름)
 *  - 방제(`only: 'riskSeason'`)는 차례가 아니라 **그 작물에 드는 병의 철(한 달 앞 예방) + 보호가 끝났는가**로 「할 일」이 된다 — 안 쳐도 벌은 없다.
 *  - 걷어 내기 · 벌레 잡기(`only: 'diseased'`)는 그것(`onlyFor`)이 들었을 때만 · 사흘 간격.
 *  - 병 · 벌레 · 새는 하루 한 번(KST 자정) 작물마다 든다 — 철 · 비(젖은 날) · 흠뻑 젖은 흙 · 하우스 · 멀칭 · 방충망 · 곁순 · 약 보호 ·
 *    방제 스킬을 곱한다. 든 것은 날마다 번진다(역병 · 무름병 · 뿌리썩음병은 포기를 죽여 섬을 깎고, 나머지는 거둘 때 수량을 깎는다).
 *    새는 열매가 익을 무렵에만 온다. 버섯 배지의 푸른곰팡이병만 집 안에서도 든다.
 *  - 서리: 가을 첫서리(속초 평년 10월 하순 — 해마다 다르게 결정적) 뒤에는 자라지 않고 사흘 안에 거둬야 한다.
 *    봄 늦서리(4월 10~24일) 전에는 서리에 약한 작물을 옮겨 심지 못한다.
 *  - 난수는 **시각 · 칸 해시**(결정적 — 세이브 재현 · 시험 고정). `rand01` 주입은 작업 점수에만 쓴다.
 */

import type {
  CareTaskDef, CareTaskId, CropCarePlan, CropDef, CropDisease, FarmCellState, FarmEnv, FarmPlotState,
} from '../types/Farming.js';
import { carePlanOf, DISEASE_DEFS, NURSERY_PLAN, CARE_TASK_KO, riskMonthsOf, monthRuns } from '../db-schema/CropCareDatabase.js';

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
  /** 처음 들 때 심한 정도 */
  onset: 0.15,
  /** 약 보호 중에는 번짐도 느리다 */
  spreadProtected: 0.3,
  /** 포기를 죽이는 병(역병 · 무름병 · 뿌리썩음병)이 남기는 섬의 바닥 */
  blightStandFloor: 0.25,
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
  /** 245차 — 거둔 뒤 일(벤 뒤 웃거름)은 다시 자람이 이만큼 되기 전에 */
  afterPickRegrow: 0.6,
  /** 245차 — 달력 일은 구간이 끝나기 이 날 수 안에 심었으면 놓쳐도 벌하지 않는다 */
  monthLateGraceDays: 3,
  /** 245차 — 달력 일은 이 날 수 안에 열릴 때만 「다음 할 일」로 보인다(반년 뒤 겨울 덮기는 감춘다) */
  monthUpcomingDays: 60,
  /**
   * 245차 — 난이도별 손을 놓았을 때의 무게: 쉬운 작물(1)은 놓친 일의 벌이 절반 · 병해충이 덜 들고(×0.6) 덜 번진다(×0.7).
   * 난이도가 「할 일의 수」와 함께 「놓쳤을 때 얼마나 잃는가」로도 읽힌다. 보통 이상은 238차 그대로(시험이 지킨다).
   */
  tierScale: {
    1: { missed: 0.5, disease: 0.6, spread: 0.7 }, 2: { missed: 1, disease: 1, spread: 1 }, 3: { missed: 1, disease: 1, spread: 1 }, 4: { missed: 1, disease: 1, spread: 1 },
  } as Record<number, { missed: number; disease: number; spread: number }>,
};

/** 245차 — 이 작물의 난이도 무게(표에 없으면 1) */
export function careTierScale(crop: CropDef): { missed: number; disease: number; spread: number } {
  return CARE_TUNING.tierScale[crop.difficulty ?? 1] ?? { missed: 1, disease: 1, spread: 1 };
}

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

/** 고추 방제가 「할 일」로 보이는 철인가(5~9월 — 238차 · 245차부터 작물마다 `riskMonthsOf`) */
export function isRiskSeason(month: number): boolean {
  return month >= 5 && month <= 9;
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
// 달력 구간(245차 — `months` 일)
// ─────────────────────────────────────────────

/** (해, 달) → 달 번호(구간 열쇠) */
const monthNo = (y: number, m: number): number => y * 12 + (m - 1);
const fromMonthNo = (n: number): { y: number; m: number } => ({ y: Math.floor(n / 12), m: (n % 12) + 1 });
/** 그 달 1일 0시(KST)의 ms */
const monthStartMs = (n: number): number => { const { y, m } = fromMonthNo(n); return Date.UTC(y, m - 1, 1) - KST; };

/** 지금이 구간 안이면 그 구간의 열쇠(시작 달 번호) · 아니면 null */
export function windowKeyAt(months: readonly number[], ms: number): number | null {
  const set = new Set(months);
  const now = monthNo(yearOf(ms), monthOf(ms));
  if (!set.has(fromMonthNo(now).m)) return null;
  let n = now;
  for (let k = 0; k < 12 && set.has(fromMonthNo(n - 1).m); k++) n -= 1;
  return n;
}

/** 지금보다 앞서 끝난 마지막 구간 — 열쇠 · 끝난 시각(다음 달 1일). 없으면 null */
export function lastEndedWindow(months: readonly number[], ms: number): { key: number; endMs: number } | null {
  const set = new Set(months);
  if (set.size === 0 || set.size === 12) return null;
  let n = monthNo(yearOf(ms), monthOf(ms));
  // 지금 구간 안이면 그 구간의 시작 앞으로 물러난다
  for (let k = 0; k < 12 && set.has(fromMonthNo(n).m); k++) n -= 1;
  // 구간의 마지막 달을 찾는다
  for (let k = 0; k < 12 && !set.has(fromMonthNo(n).m); k++) n -= 1;
  if (!set.has(fromMonthNo(n).m)) return null;
  const endMs = monthStartMs(n + 1);
  let start = n;
  for (let k = 0; k < 12 && set.has(fromMonthNo(start - 1).m); k++) start -= 1;
  return { key: start, endMs };
}

/** 다음 구간이 열리기까지 남은 날(지금 구간 안이면 0) */
export function daysUntilWindow(months: readonly number[], ms: number): number {
  if (windowKeyAt(months, ms) !== null) return 0;
  const runs = monthRuns(months);
  if (!runs.length) return Infinity;
  const now = monthNo(yearOf(ms), monthOf(ms));
  let best = Infinity;
  for (const [a] of runs) {
    let n = now;
    for (let k = 0; k < 13 && fromMonthNo(n).m !== a; k++) n += 1;
    best = Math.min(best, Math.ceil((monthStartMs(n) - ms) / DAY));
  }
  return Math.max(0, best);
}

// ─────────────────────────────────────────────
// 작업 상태
// ─────────────────────────────────────────────

export type CareStatusKind = 'upcoming' | 'due' | 'done' | 'closed';

export interface CareStatus {
  def: CareTaskDef;
  status: CareStatusKind;
  /** 이번 차례(0부터) · 전체 차례(달력 · 거둘 때마다 일은 지금까지 + 1) */
  round: number;
  total: number;
  /** 열리는 날(심은 날 기준 일수) — 방제 · 걷어 내기 · 달력 · 자람 · 거둔 뒤 일은 0 */
  dueDay: number;
  /** 열리기까지 남은 날(열렸으면 0 · 245차 −1 = 「다음에 거둔 뒤」) */
  daysLeft: number;
  /** 한 횟수 · 놓친 횟수 */
  done: number;
  skipped: number;
}

/** 이 칸의 관리 표(육묘 칸은 가식 표) */
export function planOfCell(cell: Pick<FarmCellState, 'nursery'>, crop: CropDef): CropCarePlan {
  return cell.nursery ? NURSERY_PLAN : carePlanOf(crop);
}

/** 심은 뒤(245차 — 여러해살이는 올해 다시 올라온 뒤) 흐른 날(소수). 다시 올라오기를 기다리는 동안은 0 */
export function cellDay(cell: Pick<FarmCellState, 'plantedAt' | 'cycleAt'>, nowMs: number): number {
  if (cell.cycleAt === 0) return 0;
  const from = cell.cycleAt ?? cell.plantedAt;
  return from ? Math.max(0, (nowMs - from) / DAY) : 0;
}

function rec(cell: FarmCellState, id: CareTaskId): { done: number; lastMs: number; skipped: number; win?: number } {
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

/** 이 칸에 해당하지 않는 일(씨앗 칸만 · 다른 일로 면제) */
function notApplicable(cell: FarmCellState, def: CareTaskDef): boolean {
  if (def.startKinds && !def.startKinds.includes(cell.start ?? 'seed')) return true;
  if (def.waivedBy && (cell.care?.[def.waivedBy]?.done ?? 0) > 0) return true;
  return false;
}

/** 거둔 뒤 일 — 처리를 기다리는 거둠이 있는가(차례 = 한 + 놓친) */
function afterPickPending(cell: FarmCellState, r: { done: number; skipped: number }): boolean {
  return cell.picks > r.done + r.skipped;
}

/** 작업 하나의 상태(보이지 않을 조건이면 null) */
export function careStatusOf(cell: FarmCellState, crop: CropDef, def: CareTaskDef, nowMs: number, plan: CropCarePlan = planOfCell(cell, crop)): CareStatus | null {
  if (notApplicable(cell, def)) return null;
  const r = cell.care?.[def.id] ?? { done: 0, lastMs: 0, skipped: 0 };
  const total = 1 + (def.repeat?.times ?? 0);
  const base = { def, round: r.done + r.skipped, total, done: r.done, skipped: r.skipped };
  if (def.only === 'riskSeason') {
    if (!riskMonthsOf(plan, def).includes(monthOf(nowMs))) return null;
    if (cell.growth < 0.15 && cell.picks === 0) return null;   // 포기가 자리 잡은 뒤부터(막 심은 날 약부터 치지 않는다)
    if (r.done >= total) return { ...base, status: 'closed', dueDay: 0, daysLeft: 0 };
    const guards = def.effect?.protect ?? [];
    const covered = guards.length > 0 && guards.every((g) => !!protectedFor(cell, g.disease, nowMs));
    if (covered) return { ...base, status: 'done', dueDay: 0, daysLeft: 0 };
    return { ...base, status: 'due', dueDay: 0, daysLeft: 0 };
  }
  if (def.only === 'diseased') {
    const present = cellDiseases(cell).filter((d) => !def.onlyFor || def.onlyFor.includes(d.id));
    if (present.length === 0) return null;
    const every = (def.repeat?.everyDays ?? 1) * DAY;
    const cooling = r.lastMs > 0 && nowMs - r.lastMs < every;
    return { ...base, status: cooling ? 'done' : 'due', dueDay: 0, daysLeft: cooling ? Math.ceil((r.lastMs + every - nowMs) / DAY) : 0 };
  }
  if (def.months) {
    const key = windowKeyAt(def.months, nowMs);
    const open = { ...base, total: base.round + 1, dueDay: 0 };
    if (key !== null) return { ...open, status: r.win === key && r.done > 0 ? 'done' : 'due', daysLeft: 0 };
    const left = daysUntilWindow(def.months, nowMs);
    if (left > CARE_TUNING.monthUpcomingDays) return r.done > 0 ? { ...open, status: 'done', daysLeft: left } : null;
    return { ...open, status: r.done > 0 ? 'done' : 'upcoming', daysLeft: left };
  }
  if (def.growth) {
    if (r.done + r.skipped >= 1) return { ...base, status: 'closed', dueDay: 0, daysLeft: 0 };
    const g = cell.picks > 0 ? 1 : cell.growth;
    if (g > def.growth[1]) return { ...base, status: 'closed', dueDay: 0, daysLeft: 0 };
    if (g >= def.growth[0]) return { ...base, status: 'due', dueDay: 0, daysLeft: 0 };
    const st = crop.starts.find((s) => s.kind === cell.start) ?? crop.starts[0];
    return { ...base, status: 'upcoming', dueDay: 0, daysLeft: Math.max(1, Math.ceil((def.growth[0] - g) * (st?.days ?? 60))) };
  }
  if (def.afterPick) {
    const open = { ...base, total: base.round + 1, dueDay: 0 };
    if (afterPickPending(cell, r) && cell.regrow < CARE_TUNING.afterPickRegrow) return { ...open, status: 'due', daysLeft: 0 };
    return { ...open, status: r.done > 0 ? 'done' : 'upcoming', daysLeft: -1 };
  }
  if (cell.cycleAt === 0) return null;   // 여러해살이가 다시 올라오기를 기다리는 중 — 날로 세는 일은 올라온 뒤
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
    const st = careStatusOf(cell, crop, def, nowMs, plan);
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

/** 활착기인가(모종을 심은 뒤 며칠) — 흙을 촉촉하게 둬야 한다. 여러해살이가 다시 올라오는 해에는 없다 */
export function inEstablishment(cell: FarmCellState, crop: CropDef, nowMs: number): { daysLeft: number } | null {
  if (cell.nursery || !cell.cropId || cell.established) return null;
  // 245차 — 활착은 모종을 옮겨 심은 칸만(씨앗 · 종구로 시작한 칸은 뿌리를 처음부터 그 자리에 내린다)
  if (cell.start && cell.start !== 'seedling') return null;
  const plan = carePlanOf(crop);
  if (!plan.establishDays) return null;
  const d = cell.plantedAt ? Math.max(0, (nowMs - cell.plantedAt) / DAY) : 0;
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
 * 가방에서 뺄 물건은 `needs`로 돌려준다(가방 · 도구 확인은 클라이언트 몫).
 */
export function doCare(cell: FarmCellState, crop: CropDef, id: CareTaskId, nowMs: number, score = 1): CareResult {
  const plan = planOfCell(cell, crop);
  const def = plan.tasks.find((t) => t.id === id);
  if (!def) return { ok: false, reasonKo: '이 작물에는 없는 일이다', needs: [], messageKo: '' };
  const st = careStatusOf(cell, crop, def, nowMs, plan);
  if (!st || st.status !== 'due') {
    const why = st?.status === 'upcoming' ? (st.daysLeft < 0 ? '아직 때가 아니다 — 거둔 뒤에 한다' : `아직 때가 아니다 — ${st.daysLeft}일 뒤`) : '지금 할 일이 아니다';
    return { ok: false, reasonKo: why, needs: [], messageKo: '' };
  }
  const clumsy = score < CARE_TUNING.clumsyBelow;
  const k = clumsy ? 0.5 : 1;
  const r = rec(cell, id);
  r.done += 1;
  r.lastMs = nowMs;
  if (def.months) r.win = windowKeyAt(def.months, nowMs) ?? r.win;
  const e = def.effect;
  if (e?.yieldMult) cell.careYield = (cell.careYield ?? 1) * (1 + (e.yieldMult - 1) * k);
  if (e?.quality) cell.quality = Math.min(1, cell.quality + e.quality * k);
  if (e?.water) cell.moisture = 1;
  for (const p of e?.protect ?? []) {
    cell.protect ??= {};
    cell.protect[p.disease] = { untilMs: nowMs + p.days * DAY * (clumsy ? 0.6 : 1), mult: clumsy ? Math.min(1, p.mult * 2) : p.mult };
  }
  if (def.only === 'diseased') {
    for (const d of cellDiseases(cell)) {
      if (def.onlyFor && !def.onlyFor.includes(d.id)) continue;
      const dd = DISEASE_DEFS[d.id];
      const next = Math.max(0, d.severity - dd.cull * k);
      cell.stand = Math.max(0.2, cell.stand - dd.cullStand * k);
      if (next <= 0.001) delete cell.diseases![d.id];
      else cell.diseases![d.id] = { severity: next, sinceMs: d.sinceMs };
    }
  }
  const name = CARE_TASK_KO[id];
  const roundNote = def.repeat && !def.only && st.total > 1 ? ` (${st.round + 1}/${st.total})` : '';
  return {
    ok: true, needs: def.needs ?? [], clumsy,
    messageKo: clumsy ? `${name}${roundNote} — 서툴러서 효과가 절반이다` : `${name}${roundNote} — 했다`,
  };
}

// ─────────────────────────────────────────────
// 날마다 — 놓친 차례 · 병 · 쓰러짐 · 서리
// ─────────────────────────────────────────────

function applyMissed(cell: FarmCellState, def: CareTaskDef, k = 1): void {
  const m = def.missed;
  if (!m) return;
  if (m.yieldMult) cell.careYield = (cell.careYield ?? 1) * (1 - (1 - m.yieldMult) * k);
  if (m.quality) cell.quality = Math.max(0.3, cell.quality - m.quality * k);
}

/** 때가 지난 차례를 놓침으로 넘긴다(벌 적용) — 하루 한 번. `penalize` false면 벌 없이 차례만 넘긴다(구세이브 이전) */
export function skipExpiredRounds(cell: FarmCellState, crop: CropDef, nowMs: number, penalize = true): CareTaskId[] {
  const plan = planOfCell(cell, crop);
  const missed: CareTaskId[] = [];
  const k = cell.nursery ? 1 : careTierScale(crop).missed;
  const miss = (def: CareTaskDef, r: { skipped: number }): void => {
    r.skipped += 1;
    if (penalize) applyMissed(cell, def, k);
    if (!missed.includes(def.id)) missed.push(def.id);
  };
  for (const def of plan.tasks) {
    if (def.only || notApplicable(cell, def)) continue;
    const r = rec(cell, def.id);
    if (def.months) {
      const ended = lastEndedWindow(def.months, nowMs);
      if (!ended || (r.win !== undefined && r.win >= ended.key)) continue;
      // 구간이 끝나기 며칠 전에 심었으면 벌하지 않고 매듭만 짓는다(할 틈이 없었다)
      const from = cell.plantedAt ?? nowMs;
      if (ended.endMs - from > CARE_TUNING.monthLateGraceDays * DAY) miss(def, r);
      r.win = ended.key;
      continue;
    }
    if (def.growth) {
      if (r.done + r.skipped >= 1) continue;
      const g = cell.picks > 0 ? 1 : cell.growth;
      if (g > def.growth[1]) miss(def, r);
      continue;
    }
    if (def.afterPick) {
      let guard = 0;
      while (afterPickPending(cell, r) && guard++ < 64) {
        const latest = cell.picks === r.done + r.skipped + 1;
        if (latest && cell.regrow < CARE_TUNING.afterPickRegrow) break;
        miss(def, r);
      }
      continue;
    }
    if (cell.cycleAt === 0) continue;
    const days = cellDay(cell, nowMs);
    const total = 1 + (def.repeat?.times ?? 0);
    let guard = 0;
    while (r.done + r.skipped < total && guard++ < 64) {
      const round = r.done + r.skipped;
      if (days <= roundDueDay(def, round) + roundGrace(def, round)) break;
      miss(def, r);
    }
  }
  return missed;
}

/**
 * 245차 — 구세이브 이전: 지금까지 때가 지난 차례를 **벌 없이** 넘긴다. 245차에 작물마다 일이 생겨, 이미 자라던 작물이
 * 로드 직후 「놓친 일」로 한꺼번에 깎이지 않게 한다(세이브 하위호환 — 유저 상태 보존). 넘긴 차례 수를 돌려준다.
 */
export function settleCareRounds(cell: FarmCellState, crop: CropDef, nowMs: number): number {
  if (!cell.cropId || cell.resting) return 0;
  const before = Object.values(cell.care ?? {}).reduce((a, r) => a + (r?.skipped ?? 0), 0);
  skipExpiredRounds(cell, crop, nowMs, false);
  return Object.values(cell.care ?? {}).reduce((a, r) => a + (r?.skipped ?? 0), 0) - before;
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
  /** 오늘 새로 든 병 · 벌레 · 새 */
  onset: CropDisease[];
  /** 오늘 놓친 작업 */
  missed: CareTaskId[];
  lodged: boolean;
  frosted: boolean;
}

/**
 * 하루 한 번(KST 자정) — 놓친 차례 · 병 발생 · 병 번짐 · 쓰러짐 · 첫서리.
 * `season` 0이면(철 밖 · 실내 불 꺼짐) 병은 들지 않고 놓친 차례만 넘긴다. 집 안 선반은 배지 곰팡이(`indoor`)만 든다.
 */
export function dailyCare(
  cell: FarmCellState, crop: CropDef, plot: Pick<FarmPlotState, 'site' | 'facilities'>, ms: number, env: FarmEnv, cellIdx: number, season: number,
): DailyCareReport {
  const report: DailyCareReport = { onset: [], missed: [], lodged: false, frosted: false };
  if (!cell.cropId || cell.resting) return report;
  const plan = planOfCell(cell, crop);
  report.missed = skipExpiredRounds(cell, crop, ms);
  const indoor = plot.site === 'indoor';
  if (cell.nursery) return report;
  if (indoor && !plan.diseases.some((d) => DISEASE_DEFS[d].indoor)) return report;
  const day = dayIndexOf(ms);
  const month = monthOf(ms);
  const wet = !indoor && (cell.wetH ?? 0) > 0;
  const salt = hashStr(`${cell.plantedAt ?? 0}|${cellIdx}|${crop.id}`);
  // 첫서리 — 서리에 끝나는 작물이 노지(하우스 없이)에 서 있으면
  if (!indoor && plan.frostEnds && !cell.frostedAt && !plot.facilities.includes('greenhouse') && month >= 10 && day >= firstFrostDayIndex(yearOf(ms))) {
    cell.frostedAt = ms;
    report.frosted = true;
  }
  if (season <= 0 || cell.frostedAt) return report;
  // 쓰러짐 — 지주를 놓쳤고 젖은 날
  const stakeDef = plan.tasks.find((t) => t.id === 'stake');
  if (!indoor && stakeDef?.missed?.lodging && !cell.lodged) {
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
  const tier = careTierScale(crop);
  const resist = Math.max(0, 1 - (env.skill?.pestResist ?? 0)) * tier.disease;
  const ripe = cell.growth >= 0.75 || cell.picks > 0;
  plan.diseases.forEach((d, i) => {
    const dd = DISEASE_DEFS[d];
    if (indoor && !dd.indoor) return;
    cell.diseases ??= {};
    const cur = cell.diseases[d];
    const prot = protectedFor(cell, d, ms);
    if (cur && cur.severity > 0) {
      let rate = dd.spread * tier.spread;
      if (wet) rate *= 1 + (dd.wet - 1) * 0.8;
      if (prot) rate *= CARE_TUNING.spreadProtected;
      cur.severity = Math.min(1, cur.severity + rate);
      if (dd.standLoss) cell.stand = Math.max(CARE_TUNING.blightStandFloor, cell.stand - dd.standLoss * cur.severity);
      cell.quality = Math.max(0.3, cell.quality - dd.qualityLoss * cur.severity);
      return;
    }
    if (dd.ripeOnly && !ripe) return;
    const base = dd.season.includes(month) ? dd.daily.on : dd.daily.off;
    let m = diseaseMultOf(cell, plan, d) * resist;
    if (wet) m *= dd.wet;
    if (dd.soggy && cell.moisture > 0.85) m *= dd.soggy;
    if (!indoor && plot.facilities.includes('greenhouse')) m *= dd.greenhouse;
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

/**
 * 245차 — 여러해살이가 겨울을 나고 다시 올라올 차례 — 날로 세는 일 · 병 · 관리 배수를 새 작기로 돌린다.
 * 달력 일(겨울 덮기 · 가지치기)의 기록은 해를 넘겨 이어진다. `cycleAt` = 0(기다림) → 철이 와 자라기 시작한 시각으로(`FarmSim`).
 */
export function resetCareCycle(cell: FarmCellState, crop: CropDef): void {
  const plan = planOfCell(cell, crop);
  const keep: NonNullable<FarmCellState['care']> = {};
  for (const def of plan.tasks) {
    const r = cell.care?.[def.id];
    if (r && def.months) keep[def.id] = r;
  }
  cell.care = keep;
  cell.cycleAt = 0;
  cell.careYield = 1;
  cell.diseases = {};
  cell.protect = {};
  cell.lodged = false;
}

// ─────────────────────────────────────────────
// 거둘 때
// ─────────────────────────────────────────────

/** 병 · 벌레 · 새로 깎이는 수확 배수(포기를 죽이는 병은 이미 섬을 깎았다) */
export function diseaseYieldMult(cell: Pick<FarmCellState, 'diseases'>): number {
  let m = 1;
  for (const d of cellDiseases(cell)) m *= 1 - DISEASE_DEFS[d.id].yieldLoss * d.severity;
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
