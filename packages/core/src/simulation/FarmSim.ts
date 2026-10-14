/**
 * @file FarmSim.ts
 * @description 텃밭 성장 계산 (235차 — 실제 시간 · 실제 계절 · 비 = 물 · 시설 배율 상한 · 시들 뿐 죽지 않는다)
 *
 * 한 시간 단위로 굴린다(`advanceCell`). 꺼 둔 동안도 같은 식으로 따라잡는다(최대 400일).
 *  1. 흙 수분 — 달별 증발(×물 요구 · ×물주기 스킬) · 비(노지만 — 하우스 · 실내는 비를 못 맞는다) ·
 *     빗물통(점적)은 수분이 0.5 밑으로 내려가지 않게 한다. 수경 랙은 늘 젖어 있다.
 *  2. 철 — 노지는 `growMonths` 안에서만 자란다. 하우스는 앞뒤 1달을 0.85배로 연다. 겨울나기 작물은 쉬기만 한다.
 *  3. 물 — 0.25 이상 정상 · 0.1~0.25 절반 · 그 밑은 멈추고 품질이 조금씩 준다(바닥 0.3 — **죽지 않는다**).
 *  4. 배율 — 퇴비 ×1.15(+비료 스킬) · 하우스 추운 달 ×1.25 · 수경 랙 ×1.8 → **잎채소 ×2.0 · 철 작물 ×1.4 상한**.
 *  5. 다 익은 뒤 — `holdDays`를 넘기면 쇤다(품질 감소). 풋고추는 붉어진다(`ripenTo`).
 *  6. 병충해 — 노지 하루 한 번 판정(여름 ↑ · 방제 스킬 ↓) — 품질만 깎는다.
 *  7. 238차 — 관리 표가 있는 작물(245차부터 84종 전부)은 `CropCareSim`이 날마다 놓친 작업 · 병 · 벌레 · 새 ·
 *     쓰러짐 · 첫서리를 굴리고, 시간마다 활착기 마름을 본다. 거둘 때 관리 · 병 배수가 곱해지고, 검붉은 고추는 품질이 깎인다.
 *     여러해살이는 겨울을 나고 다시 올라올 때 날로 세는 일 · 병을 새 작기로 돌린다(`resetCareCycle`).
 *     씨앗을 육묘 트레이에 뿌린 칸(`nursery`)은 다 자라면 **모종**을 준다.
 *
 * 순수 함수 + 상태 객체 변경. 난수는 호출 쪽이 주입한다(`rand01`) — 세이브 재현 · 시험 고정.
 */

import type {
  CropCare, CropDef, CropDifficulty, CropGrade, CropStart, CropStartKind, FarmCellState, FarmEnv, FarmHarvestResult,
  FarmPlantCtx, FarmPlotState, FarmSite, FieldProcessStage, WaterAmount,
} from '../types/Farming.js';
import { getCrop, cropOfProduce, parseProduceId } from '../db-schema/CropDatabase.js';
import { produceMarketRatio } from '../rules/ProduceMarket.js';
import { carePlanOf } from '../db-schema/CropCareDatabase.js';
import { CARE_TUNING, dailyCare, diseaseYieldMult, establishHour, frostBlockKo, ripeStageOf, resetCareCycle } from './CropCareSim.js';
import {
  CULTIVATION_TUNING, RARE_ARRIVAL_EVERY, WILD_TUNING, cultivationOf, offTimingOf, pickWildSprout, waterBandOf, wateredMoisture,
} from '../db-schema/CropCultivationDatabase.js';

/** 텃밭 한 구획 = 4×3칸(설치물 `farm_plot` footprint와 같다) */
export const FARM_COLS = 4;
export const FARM_ROWS = 3;
export const FARM_CELLS = FARM_COLS * FARM_ROWS;
/** 실내 선반 칸 수(시루 · 배지 · 수경) */
export const INDOOR_SLOTS = 4;

export const FARM_TUNING = {
  /** 시설 배율 상한 — 잎채소 · 철 작물 */
  speedCap: { leafy: 2.0, seasonal: 1.4 },
  compostMult: 1.15,
  compostQuality: 0.1,
  greenhouseColdMult: 1.25,
  greenhouseShoulder: 0.85,
  hydroMult: 1.8,
  startQuality: { seed: 0.72, seedling: 0.76, set: 0.74 } as Record<CropStartKind, number>,
  /** 등급 경계 — 특 · 상 */
  gradeSpecial: 0.85,
  gradeGood: 0.65,
  /** 마른 흙에서 시간당 품질 감소 · 바닥 */
  dryLoss: 0.003,
  qualityFloor: 0.3,
  /** 과숙(쇠기) — 시간당 감소 · 바닥 */
  overripeLoss: 0.002,
  overripeFloor: 0.35,
  /** 노지 겨울 추위(겨울나기 아닌 작물) — 시간당 */
  frostLoss: 0.0015,
  pestHit: 0.04,
  rainBarrelFloor: 0.5,
  /** 씨앗 한 구멍에 넣는 알 수(섬 = 1 − (1 − 발아율)^이 값) */
  seedsPerHole: 2.5,
  /** 꺼 둔 동안 따라잡는 최대 시간 */
  maxCatchUpHours: 24 * 400,
  /** 여러해살이 — 이듬해 다시 올라오는 기간 배수 */
  perennialRegrow: 0.5,
  /** 등급별 값 */
  gradePrice: { special: 1.3, good: 1.0, normal: 0.72 } as Record<CropGrade, number>,
  /**
   * 243차 — 포장 단위가 있는 수확물(딸기 · 방울토마토 · 블루베리 · 버섯 · 새싹채소)을 **낱개로** 팔 때 받는 몫.
   * 가게가 다시 담아야 해서 8할만 쳐준다 — 「포장하기」로 팩을 만들면 제값(낱개 기준가 × 팩 낱개 수).
   */
  looseSellMult: 0.8,
  /** 실내 시루 · 배지 흙(물) 마름 — 시간당 */
  indoorEvap: 0.015,
  /**
   * 236차 — 마당(내 땅) 텃밭 구획 수. 자격 없이 낸다 — 2구획 = 경작 24㎡(약 7평), 집 마당 텃밭 크기.
   * 이보다 많은 구획은 마을 농지를 빌린 것이다(농지 이용권 · 구획마다 사용료).
   */
  yardPlots: 2,
  /** 236차 — 농지 이용권으로 더 빌리는 구획 수 상한(서울시 주말농장 1인 최대 5구획 — 2025 모집 공고) */
  rentPlotsMax: 5,
  /**
   * 237차 — 난이도 단계별 레벨 요건(쉬움 · 보통 · 까다로움 · 아주 까다로움). 챕터 레벨대에 맞췄다 —
   * 보통 = 속초 후반(Ch1 1~20) · 까다로움 = 부산 초입(Ch2 20~45) · 아주 까다로움 = 부산 끝.
   */
  tierLevels: [1, 15, 25, 40] as readonly number[],
  /** 237차 — 이 단계부터 자격증(유기농업기능사)이 있어야 한다 */
  certTier: 3,
  certLicense: 'organic_farming',
};

/** 237차 — 난이도 이름 */
export const CROP_TIER_KO: Record<CropDifficulty, string> = { 1: '쉬움', 2: '보통', 3: '까다로움', 4: '아주 까다로움' };
export const CROP_TIER_EN: Record<CropDifficulty, string> = { 1: 'Easy', 2: 'Normal', 3: 'Demanding', 4: 'Very demanding' };
/**
 * 237차 — 까다로운 점 이름. 화면은 ` · `로 잇는다 — 이름 안에 ` · `를 넣지 않는다(한 항목이 둘로 읽힌다).
 */
export const CROP_CARE_KO: Record<CropCare, string> = {
  pests: '병해충', support: '지주 세우기', nursery: '씨앗이면 육묘', germination: '싹 틔우기', overwinter: '겨울나기',
  longSeason: '긴 재배', soil: '흙을 가림', heat: '더위와 땅 온도', shade: '반그늘', water: '물을 가림', humidity: '습도',
};
export const CROP_CARE_EN: Record<CropCare, string> = {
  pests: 'Pests', support: 'Staking', nursery: 'Long nursery from seed', germination: 'Germination', overwinter: 'Overwintering',
  longSeason: 'Long season', soil: 'Fussy about soil', heat: 'Heat and soil warmth', shade: 'Part shade', water: 'Fussy about water', humidity: 'Humidity',
};

/** 237차 — 이 작물 · 이 심는 방법의 난이도. `nursery`가 붙은 작물은 씨앗으로 시작하면 한 단계 위(최대 4) */
export function cropTier(crop: CropDef, start?: CropStart): CropDifficulty {
  const base = crop.difficulty ?? 1;
  const up = start?.kind === 'seed' && crop.care?.includes('nursery') ? 1 : 0;
  return Math.min(4, base + up) as CropDifficulty;
}

/** 237차 — 단계 요건(레벨 · 자격증) */
export function tierGate(tier: CropDifficulty): { level: number; license?: string } {
  const level = FARM_TUNING.tierLevels[tier - 1] ?? 1;
  return tier >= FARM_TUNING.certTier ? { level, license: FARM_TUNING.certLicense } : { level };
}

/** 237차 — 이 작물 · 심는 방법의 난이도와 요건 */
export function cropGate(crop: CropDef, start?: CropStart): { tier: CropDifficulty; level: number; license?: string } {
  const tier = cropTier(crop, start);
  return { tier, ...tierGate(tier) };
}

/**
 * 237차 — 지금 이 작물을 못 기르는 이유(되면 null). 문맥에 레벨 · 면허 판정이 없으면 그 요건은 보지 않는다.
 * 기술(산채 재배 · 수경 재배) · 설비 요건은 `canPlant`가 따로 본다.
 */
export function cropGateBlock(crop: CropDef, start: CropStart | undefined, ctx: Pick<FarmPlantCtx, 'level' | 'hasLicense'>): string | null {
  const g = cropGate(crop, start);
  const needLv = ctx.level !== undefined && ctx.level < g.level;
  const needLic = !!g.license && !!ctx.hasLicense && !ctx.hasLicense(g.license);
  if (!needLv && !needLic) return null;
  if (!needLic) return `레벨 ${g.level}부터 기를 수 있는 작물이다`;
  const who = g.tier >= 4 ? '아주 까다로운 작물이다' : '까다로운 작물이다';
  return needLv ? `${who} — 레벨 ${g.level} · 유기농업기능사가 있어야 기를 수 있다` : `${who} — 유기농업기능사가 있어야 기를 수 있다`;
}

/** 236차 — 마당에 낼 수 있는 텃밭 구획 수(마당 + 빌린 농지) */
export function farmPlotCap(hasFarmland: boolean): number {
  return FARM_TUNING.yardPlots + (hasFarmland ? FARM_TUNING.rentPlotsMax : 0);
}

/** 236차 — 낸 구획 중 빌린 것(마당 구획을 넘는 수) */
export function rentedPlotCount(plots: number): number {
  return Math.max(0, Math.floor(plots) - FARM_TUNING.yardPlots);
}

const H = 3_600_000;
const KST = 9 * H;
/** 달별 노지 증발(시간당 흙 수분 감소) */
const EVAP = [0.004, 0.005, 0.007, 0.009, 0.011, 0.013, 0.012, 0.013, 0.010, 0.008, 0.006, 0.004];
const WATER_NEED = { low: 0.7, mid: 1, high: 1.4 } as const;
/** 동해안(속초) 달별 강수일 비율 — 평년 강수일수(7·6·8·8·9·10·15·14·11·8·8·7일)를 달 일수로 나눈 근사 */
const RAIN_DAY_FRAC = [0.23, 0.21, 0.26, 0.27, 0.29, 0.33, 0.48, 0.45, 0.37, 0.26, 0.27, 0.23];
/** 서리 달 — 겨울나기 아닌 노지 작물이 철 밖에 서 있으면 상한다 */
const FROST_MONTHS = new Set([11, 12, 1, 2, 3]);
/** 병충해 하루 확률 — 갈래 · 여름 */
const PEST_DAILY = { summer: 0.05, other: 0.02 };
const SUMMER = new Set([6, 7, 8, 9]);

// ─────────────────────────────────────────────
// 시각 · 해시
// ─────────────────────────────────────────────

/** KST 달(1~12) */
export function kstMonthOf(ms: number): number {
  return new Date(ms + KST).getUTCMonth() + 1;
}

/** KST 날 번호(1970-01-01 KST부터) */
export function kstDayIndex(ms: number): number {
  return Math.floor((ms + KST) / 86_400_000);
}

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

/**
 * 기후 통계로 본 비 — 실황이 없을 때(꺼 둔 동안 · 실황 미수신). 날마다 강수일 비율로 비 오는 날을 정하고,
 * 그날 한 차례(3시간) 내린다. 같은 시각이면 누구에게나 같은 답(결정적).
 */
export function climateRainAt(ms: number): boolean {
  const day = kstDayIndex(ms);
  const month = kstMonthOf(ms);
  if (u01(hash32(day, 7919)) >= RAIN_DAY_FRAC[month - 1]) return false;
  const start = Math.floor(u01(hash32(day, 104729)) * 21);
  const hour = Math.floor(((ms + KST) % 86_400_000) / H);
  return hour >= start && hour < start + 3;
}

// ─────────────────────────────────────────────
// 상태 생성 · 조회
// ─────────────────────────────────────────────

export function newFarmCell(nowMs = 0): FarmCellState {
  return {
    tilled: false, cropId: null, growth: 0, moisture: 0.5, quality: 0.7, stand: 0,
    picks: 0, regrow: 0, ripeH: 0, lastMs: nowMs, dryH: 0,
  };
}

export function newFarmPlot(site: FarmSite, nowMs = 0): FarmPlotState {
  const n = site === 'indoor' ? INDOOR_SLOTS : FARM_CELLS;
  // 247차 — 구획마다 다른 난수 씨(저절로 나는 싹)
  return { site, cells: Array.from({ length: n }, () => ({ ...newFarmCell(nowMs), tilled: site === 'indoor' })), facilities: [], salt: Math.floor(nowMs / 1000) >>> 0 };
}

export function startOf(crop: CropDef, kind: CropStartKind | undefined, itemId?: string): CropStart | undefined {
  return (itemId && crop.starts.find((s) => s.itemId === itemId)) || crop.starts.find((s) => s.kind === kind) || crop.starts[0];
}

export function gradeOf(quality: number): CropGrade {
  return quality >= FARM_TUNING.gradeSpecial ? 'special' : quality >= FARM_TUNING.gradeGood ? 'good' : 'normal';
}

export const GRADE_KO: Record<CropGrade, string> = { special: '특', good: '상', normal: '보통' };
export const GRADE_EN: Record<CropGrade, string> = { special: 'Prime', good: 'High', normal: 'Normal' };   // UI 사전의 특 · 상 · 보통과 같은 말

/** 지금 거둘 수 있는가 */
export function cellReady(cell: FarmCellState): boolean {
  if (!cell.cropId || cell.resting) return false;
  // 시간마다 1/(일수×24)를 더해 가므로 부동소수 오차로 0.99999…에서 멈출 수 있다 — 아주 작은 여유
  return cell.picks === 0 ? cell.growth >= 1 - 1e-6 : cell.regrow >= 1 - 1e-6;
}

/** 중간 수확(솎음 · 마늘종 · 고구마순 …)이 지금 열려 있는가 */
export function interimOpen(cell: FarmCellState, crop: CropDef): boolean {
  const it = crop.interim;
  if (!it || cell.interimDone || cell.picks > 0 || cell.resting) return false;
  if (it.seedOnly && cell.start !== 'seed') return false;
  return cell.growth >= it.window[0] && cell.growth <= it.window[1];
}

const monthIn = (months: readonly number[], m: number): boolean => months.includes(m);
const adjacent = (months: readonly number[], m: number): boolean =>
  monthIn(months, ((m + 10) % 12) + 1) || monthIn(months, (m % 12) + 1);

/** 이 달 이 텃밭에서의 생장 배율(철) — 0이면 멈춘다 */
export function seasonFactor(crop: CropDef, month: number, plot: Pick<FarmPlotState, 'site' | 'facilities'>): number {
  if (plot.site === 'indoor') return 1;
  if (monthIn(crop.growMonths, month)) return 1;
  if (plot.facilities.includes('greenhouse') && adjacent(crop.growMonths, month)) return FARM_TUNING.greenhouseShoulder;
  return 0;
}

/** 시설 배율(상한 적용) */
export function speedMultOf(
  crop: CropDef, cell: Pick<FarmCellState, 'compost'>, plot: Pick<FarmPlotState, 'site' | 'facilities'>, month: number, env?: FarmEnv,
): number {
  let m = 1;
  if (cell.compost) m *= 1 + (FARM_TUNING.compostMult - 1) * (1 + (env?.skill?.fertilizer ?? 0));
  if (plot.site === 'plot' && plot.facilities.includes('greenhouse') && FROST_MONTHS.has(month)) m *= FARM_TUNING.greenhouseColdMult;
  if (plot.site === 'indoor' && crop.site === 'plot' && plot.facilities.includes('hydroRack')) m *= FARM_TUNING.hydroMult;
  return Math.min(m, FARM_TUNING.speedCap[crop.speedClass]);
}

/** 이 칸 작물의 첫 수확까지 기간(일) — 여러해살이 이듬해는 절반 */
export function cellDays(crop: CropDef, cell: FarmCellState): number {
  const st = startOf(crop, cell.start);
  return (st?.days ?? 60) * (cell.established ? FARM_TUNING.perennialRegrow : 1);
}

// ─────────────────────────────────────────────
// 시간 흐름
// ─────────────────────────────────────────────

/** 247차 — 첫 수확까지 남은 날(적온 기준 · 물 끊기 판정용). 이미 거둔 적이 있거나 다 자랐으면 undefined */
function daysToFirstHarvest(cell: FarmCellState, crop: CropDef): number | undefined {
  if (cell.picks > 0 || cell.growth >= 1 - 1e-6) return undefined;
  return (1 - cell.growth) * cellDays(crop, cell);
}

/**
 * 247차 — 알맞은 흙 수분: 구간 아래(0.25 이상)면 더디게(×0.85), 구간 위로 오래(36시간 넘게) 젖어 있으면 작물마다 탈 —
 * 썩음(섬 · 품질) · 열과(익을 무렵 품질) · 맛 묽어짐(익을 무렵 품질) · 웃자람(품질). 물 끊기 기간에는 구간 위가 낮아진다.
 * 돌려주는 값 = 이번 시간의 물 배율.
 */
function soggyHour(cell: FarmCellState, crop: CropDef, water: number, month: number): number {
  const cv = cultivationOf(crop);
  const { band } = waterBandOf(crop, daysToFirstHarvest(cell, crop));
  const T = CULTIVATION_TUNING;
  if (cell.moisture > band[1]) cell.soggyH = (cell.soggyH ?? 0) + 1;
  else if ((cell.soggyH ?? 0) > 0) cell.soggyH = Math.max(0, (cell.soggyH ?? 0) - T.soggyDryRate);
  // 서늘한 달은 흙이 늦게 마르고 뿌리도 숨을 덜 쉰다 — 견디는 시간이 길다(한여름 36시간 · 최대 3배)
  const grace = T.soggyGraceH * Math.min(3, Math.max(1, T.soggyRefEvap / EVAP[month - 1]));
  if ((cell.soggyH ?? 0) > grace) {
    const fruiting = cell.picks > 0 || cell.growth >= 0.8;
    switch (cv.water.over) {
      case 'rot':
        cell.stand = Math.max(Math.min(cell.stand, T.harm.rot.standFloor), cell.stand - T.harm.rot.stand);
        cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - T.harm.rot.quality);
        break;
      case 'crack':
        if (fruiting) cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - T.harm.crack.quality);
        break;
      case 'bland':
        if (fruiting) cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - T.harm.bland.quality);
        break;
      case 'leggy':
        cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - T.harm.leggy.quality);
        break;
      default: break;
    }
  }
  return water === 1 && cell.moisture < band[0] ? T.belowBandGrowth : water;
}

/** 247차 — 씨가 여물어 흙에 떨어졌다(떨어진 씨로 이듬해 저절로 나는 작물) — 텃밭의 씨앗 은행에 적는다 */
function dropSeeds(plot: FarmPlotState, crop: CropDef): void {
  if (!cultivationOf(crop).selfSeeds || plot.site !== 'plot') return;
  plot.seedBank ??= [];
  if (plot.seedBank.includes(crop.id)) return;
  plot.seedBank.push(crop.id);
  while (plot.seedBank.length > WILD_TUNING.seedBankMax) plot.seedBank.shift();
}

/** 247차 — 밭에서 말리기 한 시간: 비가 오면 세지 않고 품질이 준다 · 다 마르면 그 시각을 적는다 · 너무 오래 두면 깨 · 콩이 쏟아진다 */
function processHour(cell: FarmCellState, crop: CropDef, plot: FarmPlotState, ms: number, rain: boolean): void {
  const pr = cell.process;
  const def = cultivationOf(crop).process;
  if (!pr || !def) return;
  if (pr.dryAt) {
    if (def.shatterDays !== undefined && ms - pr.dryAt > def.shatterDays * 86_400_000) dropSeeds(plot, crop);
    return;
  }
  if (rain) {
    pr.rainH += 1;
    cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - CULTIVATION_TUNING.dryRainLoss);
    return;
  }
  pr.dryH += 1;
  if (pr.dryH >= def.dryDays * 24) pr.dryAt = ms;
}

function stepHour(cell: FarmCellState, crop: CropDef, plot: FarmPlotState, ms: number, env: FarmEnv, cellIdx: number): void {
  const month = kstMonthOf(ms);
  const indoor = plot.site === 'indoor';
  const hydro = indoor && crop.site === 'plot' && !cell.nursery;   // 238차 — 육묘 트레이는 재배기 없이 창가에서 큰다
  // 236차 — 실내에 들인 텃밭 작물(잎채소 등)은 수경 재배기 불빛으로만 자란다. 재배기를 치웠거나
  //   전기료가 밀려 단전되면 멈춘다(시들지는 않는다 — 철 밖과 같은 취급). 시루 · 버섯은 어두워도 큰다
  const lightOff = hydro && (!!env.powerOff || !plot.facilities.includes('hydroRack'));
  // 1) 흙 수분(재배기 펌프가 돌면 늘 젖어 있다)
  const rain = !indoor && !plot.facilities.includes('greenhouse') && env.rainAt(ms);
  if (hydro && !lightOff) cell.moisture = 1;
  else {
    if (rain) { cell.moisture = 1; cell.wetH = 24; }   // 238차 — 비 뒤 하루는 젖어 있다(역병 · 탄저병)
    else {
      const evap = (indoor ? FARM_TUNING.indoorEvap : EVAP[month - 1]) * WATER_NEED[crop.water] * Math.max(0, 1 - (env.skill?.waterEff ?? 0));
      cell.moisture = Math.max(0, cell.moisture - evap);
      if (!indoor && plot.facilities.includes('rainBarrel')) cell.moisture = Math.max(cell.moisture, FARM_TUNING.rainBarrelFloor);
    }
  }
  if (!rain && (cell.wetH ?? 0) > 0) cell.wetH = Math.max(0, (cell.wetH ?? 0) - 1);
  // 247차 — 베어(캐어) 밭에 말리는 칸: 자라지도 병들지도 않는다. 비 오는 시간은 세지 않고 품질이 조금 준다
  if (cell.process) { processHour(cell, crop, plot, ms, rain); return; }
  // 238차 — 첫서리를 맞은 작물은 더 자라지 않는다. 사흘 안에 거두지 않으면 끝(칸이 빈다)
  if (cell.frostedAt) {
    if (ms - cell.frostedAt > CARE_TUNING.frostGraceH * H) { clearCell(cell); return; }
  }
  const season = lightOff || cell.frostedAt ? 0 : seasonFactor(crop, month, plot);
  // 2) 다 거두고 쉬는 여러해살이 — 철이 끝나면(겨울) 뿌리가 자리 잡고 다음 철에 다시 올라온다
  if (cell.resting) {
    if (season === 0) {
      cell.resting = false; cell.growth = 0; cell.picks = 0; cell.regrow = 0; cell.ripeH = 0;
      cell.interimDone = false; cell.established = true;
      resetCareCycle(cell, crop);   // 245차 — 날로 세는 일 · 병 · 관리 배수는 새 작기로(달력 일 기록은 이어진다)
    }
    return;
  }
  // 245차 — 다시 올라오기를 기다리던 여러해살이: 철이 와 자라기 시작한 때가 올해 일의 기준
  if (cell.cycleAt === 0 && season > 0) cell.cycleAt = ms;
  // 3) 물
  let water = cell.moisture >= 0.25 ? 1 : cell.moisture >= 0.1 ? 0.55 : 0;
  if (water === 0 && season > 0) {
    cell.dryH += 1;
    cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - FARM_TUNING.dryLoss);
  }
  // 247차 — 작물마다 알맞은 흙 수분(조금 마르면 더디고 · 오래 젖어 있으면 탈) — 육묘 · 수경 · 시루는 따로 본다
  if (!cell.nursery && !hydro && season > 0) water = soggyHour(cell, crop, water, month);
  // 238차 — 활착기(모종 심은 뒤 2주)에 마르면 뿌리를 못 내려 섬이 준다
  establishHour(cell, crop, ms, water, season);
  // 4) 노지 겨울 추위 — 겨울나기 · 여러해살이가 아니면 철 밖 서리 달에 조금씩 상한다(죽지는 않는다)
  if (!indoor && season === 0 && !crop.overwinter && !crop.perennial && FROST_MONTHS.has(month) && !plot.facilities.includes('greenhouse')) {
    cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - FARM_TUNING.frostLoss);
  }
  // 5) 생장 · 다시 자람 · 다 익은 뒤
  const mult = speedMultOf(crop, cell, plot, month, env);
  if (!cellReady(cell)) {
    if (cell.picks === 0) cell.growth = Math.min(1, cell.growth + (season * water * mult) / (cellDays(crop, cell) * 24));
    else cell.regrow = Math.min(1, cell.regrow + (season * water * mult) / ((crop.harvest.repeat?.everyDays ?? 7) * 24));
  } else {
    cell.ripeH += 1;
    // 247차 — 철 밖에 심어 꽃대가 일찍 선 것은 빨리 쇤다
    const bolt = cell.offTiming === 'bolt' ? CULTIVATION_TUNING.boltHoldMult : 1;
    const hold = (crop.harvest.holdDays * bolt + (crop.harvest.ripenTo?.afterDays ?? 0)) * 24;
    if (cell.ripeH > hold) cell.quality = Math.max(FARM_TUNING.overripeFloor, cell.quality - FARM_TUNING.overripeLoss);
    // 247차 — 거두지 않고 두면 꽃이 피어 씨가 떨어진다(비름 · 차조기 · 방아 · 딜 · 깨 …)
    if (cell.ripeH > hold + 24 * 7) dropSeeds(plot, crop);
  }
  // 7) 238차 — 관리 작업 · 병해 · 쓰러짐 · 첫서리(하루 한 번 · KST 자정 시간) — 표가 있는 작물 · 육묘 칸
  const midnight = Math.floor(((ms + KST) % 86_400_000) / H) === 0;
  const plan = cell.nursery ? null : carePlanOf(crop);
  const hasPlan = cell.nursery || (plan !== null && (plan.tasks.length > 0 || plan.diseases.length > 0 || !!plan.frostEnds));
  if (midnight && hasPlan) dailyCare(cell, crop, plot, ms, env, cellIdx, season);
  // 6) 병충해 — 노지 · 하루 한 번(KST 자정 시간) — 병해 표가 있는 작물은 위 엔진이 대신한다
  if (!indoor && season > 0 && midnight && !(plan && plan.diseases.length > 0)) {
    const base = SUMMER.has(month) ? PEST_DAILY.summer : PEST_DAILY.other;
    const p = base * Math.max(0, 1 - (env.skill?.pestResist ?? 0));
    const roll = u01(hash32(kstDayIndex(ms), hashStr(`${cell.plantedAt ?? 0}|${cellIdx}`)));
    if (roll < p) cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - FARM_TUNING.pestHit);
  }
}

/**
 * 247차 — 묵힌 칸에 저절로 나는 싹(사용자 「우연히 자라게 하거나 — 실제처럼」). 일군 채 2주 넘게 비어 있는 노지 칸에서
 * 날마다(KST 자정) 굴린다 — 그늘(차광막) 아래면 산나물이 잘 트고, 그 밖은 새가 떨군 씨 · 바람에 날린 씨 · 여름 비름.
 * 한 구획에 저절로 난 싹은 한 번에 하나만(드물게). 났으면 칸을 심은 상태로 만들고 `lastMs`를 그 시각으로 둔다.
 */
function rollWildSprout(plot: FarmPlotState, idx: number, toMs: number): boolean {
  const cell = plot.cells[idx];
  if (!cell || cell.cropId || !cell.tilled || plot.site !== 'plot') return false;
  if (cell.fallowSince === undefined) { cell.fallowSince = cell.lastMs > 0 ? cell.lastMs : toMs; return false; }
  if (plot.cells.some((c) => c.wild && c.cropId)) return false;
  const shade = plot.facilities.includes('shade');
  const from = Math.max(kstDayIndex(Math.max(cell.lastMs, cell.fallowSince)) + 1, kstDayIndex(cell.fallowSince) + WILD_TUNING.fallowDays);
  const to = kstDayIndex(toMs);
  const salt = ((plot.salt ?? 0) ^ Math.imul(idx + 1, 0x2545f491)) >>> 0;
  // 흙에 떨어진 씨 — 그 작물이 씨로 심기는 달에 올라온다
  const bank = (plot.seedBank ?? []).flatMap((id) => {
    const c = getCrop(id);
    const st = c?.starts.find((x) => x.kind === 'seed') ?? c?.starts[0];
    return c && st ? [{ cropId: id, shade: false, months: st.months, weight: WILD_TUNING.seedBankWeight }] : [];
  });
  for (let d = Math.max(from, to - 400); d <= to; d++) {
    const dayMs = d * 86_400_000 - KST;
    const month = kstMonthOf(dayMs + 12 * H);
    const banked = bank.some((b) => b.months.includes(month));
    const p = Math.max(shade ? WILD_TUNING.dailyShade : WILD_TUNING.dailyOpen, banked ? WILD_TUNING.dailySeedBank : 0);
    if (u01(hash32(d, salt ^ 0x77e1)) >= p) continue;
    const def = pickWildSprout(month, shade, u01(hash32(d, salt ^ 0x1b873593)), bank);
    const crop = def ? getCrop(def.cropId) : undefined;
    const st = crop?.starts[0];
    if (!crop || !st) continue;
    const at = Math.min(toMs, dayMs + 6 * H);
    plantCell(cell, crop, st, at, () => 0.5, { hasSkill: () => true });
    cell.stand = WILD_TUNING.stand;
    cell.quality = WILD_TUNING.quality;
    cell.wild = true;
    cell.lastMs = at;
    return true;
  }
  return false;
}

/** 247차 — 저절로 난 싹이 아직 이름을 모르는 때인가(자람 25% 전) */
export function wildUnknown(cell: Pick<FarmCellState, 'wild' | 'growth' | 'picks' | 'cropId'>): boolean {
  return !!cell.wild && !!cell.cropId && cell.picks === 0 && cell.growth < WILD_TUNING.revealGrowth;
}

/**
 * 칸 하나를 `toMs`까지 굴린다. 시간 단위로만 진행하고 남은 조각은 다음 호출로 넘긴다(시간을 잃지 않는다).
 * 빈 칸은 시각만 맞춘다.
 */
export function advanceCell(plot: FarmPlotState, idx: number, toMs: number, env: FarmEnv): void {
  const cell = plot.cells[idx];
  if (!cell) return;
  // 247차 — 빈 칸: 오래 묵히면 저절로 싹이 난다(났으면 그 시각부터 이어서 굴린다)
  if (!cell.cropId && !rollWildSprout(plot, idx, toMs)) { cell.lastMs = Math.max(cell.lastMs, toMs); return; }
  const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
  if (!crop) { cell.lastMs = Math.max(cell.lastMs, toMs); return; }
  if (cell.lastMs <= 0 || cell.lastMs > toMs) cell.lastMs = Math.min(toMs, cell.lastMs > 0 ? cell.lastMs : toMs);
  let hours = Math.floor((toMs - cell.lastMs) / H);
  if (hours <= 0) return;
  if (hours > FARM_TUNING.maxCatchUpHours) {
    cell.lastMs = toMs - FARM_TUNING.maxCatchUpHours * H;
    hours = FARM_TUNING.maxCatchUpHours;
  }
  for (let i = 0; i < hours; i++) {
    cell.lastMs += H;
    stepHour(cell, crop, plot, cell.lastMs, env, idx);
  }
}

export function advancePlot(plot: FarmPlotState, toMs: number, env: FarmEnv): void {
  for (let i = 0; i < plot.cells.length; i++) advanceCell(plot, i, toMs, env);
}

// ─────────────────────────────────────────────
// 손질 — 갈기 · 퇴비 · 물 · 심기 · 거두기
// ─────────────────────────────────────────────

export function tillCell(cell: FarmCellState): boolean {
  if (cell.tilled || cell.cropId) return false;
  cell.tilled = true;
  cell.fallowSince = undefined;   // 247차 — 묵힌 날은 일군 뒤부터 센다
  return true;
}

export function compostCell(cell: FarmCellState): boolean {
  if (!cell.tilled || cell.compost) return false;
  cell.compost = true;
  if (cell.cropId) cell.quality = Math.min(1, cell.quality + FARM_TUNING.compostQuality * 0.5);   // 자라는 중에 주면 절반만
  return true;
}

export function waterCell(cell: FarmCellState, amount: WaterAmount = 'deep'): boolean {
  if (!cell.tilled) return false;
  // 247차 — 조금 · 보통 · 흠뻑(기본 = 흠뻑 — 235차 그대로). 작물마다 알맞은 양이 다르다(`CropCultivation.water`)
  cell.moisture = wateredMoisture(cell.moisture, amount);
  return true;
}

/** 「1~2월 · 8~9월」처럼 달 목록을 묶어 읽는다 */
export function monthRangeKo(months: readonly number[]): string {
  const ms = [...new Set(months)].sort((a, b) => a - b);
  if (ms.length === 12) return '언제나';
  const runs: [number, number][] = [];
  for (const m of ms) {
    const last = runs[runs.length - 1];
    if (last && m === last[1] + 1) last[1] = m; else runs.push([m, m]);
  }
  return runs.map(([a, b]) => (a === b ? `${a}월` : `${a}~${b}월`)).join(' · ');
}

export interface PlantCheck { ok: boolean; reasonKo?: string }

/** 지금 이 칸에 이 방법으로 심을 수 있는가 — 철 · 장소 · 자격(스킬 · 시설) */
export function canPlant(crop: CropDef, start: CropStart, plot: FarmPlotState, cell: FarmCellState, month: number, ctx: FarmPlantCtx, nowMs?: number): PlantCheck {
  if (cell.cropId) return { ok: false, reasonKo: '이미 자라는 것이 있다' };
  if (!cell.tilled) return { ok: false, reasonKo: '먼저 땅을 갈아야 한다' };
  if (plot.site === 'indoor') {
    const hydroLeaf = crop.site === 'plot' && crop.category === 'leaf' && crop.speedClass === 'leafy' && plot.facilities.includes('hydroRack');
    // 238차 — 육묘 트레이 파종(고추 씨앗): 집 안 선반에 트레이가 있을 때 · 뿌리는 달(2~3월)에만
    if (start.nursery) {
      if (ctx.hasTray === false) return { ok: false, reasonKo: '육묘 트레이가 있어야 씨앗을 뿌려 모종을 키운다 — 종묘사에서 판다' };
      if (!start.months.includes(month)) return { ok: false, reasonKo: `${monthRangeKo(start.months)}에 뿌려 모종을 키운다 — 늦으면 옮겨 심을 철을 놓친다` };
    } else if (crop.site !== 'indoor' && !hydroLeaf) {
      return { ok: false, reasonKo: crop.category === 'leaf' && crop.speedClass === 'leafy' ? '실내에서 키우려면 수경 재배기가 있어야 한다' : '마당 텃밭에 심는 작물이다' };
    }
    if (crop.category === 'sprout' && !plot.facilities.includes('sproutJar')) return { ok: false, reasonKo: '콩나물 시루가 있어야 한다' };
  } else {
    if (crop.site === 'indoor') return { ok: false, reasonKo: '집 안 선반에서 키운다(시루 · 배지)' };
    if (start.nursery) return { ok: false, reasonKo: '밭에 바로 뿌리지 않는다 — 집 안 선반 육묘 트레이에 뿌려 모종을 키운다' };
    const inMonth = start.months.includes(month) || (plot.facilities.includes('greenhouse') && adjacent(start.months, month));
    if (!inMonth) return { ok: false, reasonKo: `지금은 심을 철이 아니다 — ${monthRangeKo(start.months)}에 심는다` };
    // 238차 — 늦서리 전에는 서리에 약한 작물(고추 · 토마토 · 가지 · 오이 …)을 옮겨 심지 못한다
    const frost = frostBlockKo(crop, plot, nowMs ?? Date.now(), ctx.tempC);
    if (frost) return { ok: false, reasonKo: frost };
  }
  // 237차 — 난이도 단계 요건(레벨 · 유기농업기능사)
  const gate = cropGateBlock(crop, start, ctx);
  if (gate) return { ok: false, reasonKo: gate };
  const req = crop.requires;
  if (req?.skill && !ctx.hasSkill(req.skill)) {
    return { ok: false, reasonKo: req.skill === 'farm_wild' ? '산채 재배를 배워야 기를 수 있다' : req.skill === 'farm_hydro' ? '수경 재배를 배워야 기를 수 있다' : '이 작물을 기를 줄 모른다' };
  }
  if (req?.facility && plot.site === 'plot' && !plot.facilities.includes(req.facility)) {
    return { ok: false, reasonKo: req.facility === 'shade' ? '차광막 아래에서만 자란다' : req.facility === 'coldWater' ? '찬물이 흐르는 수조가 있어야 한다' : req.facility === 'greenhouse' ? '비닐 터널 안에서만 자란다' : '설비가 모자라다' };
  }
  return { ok: true };
}

/** 심는다 — 섬(발아 · 활착)을 정하고 칸을 초기화한다 */
export function plantCell(
  cell: FarmCellState, crop: CropDef, start: CropStart, nowMs: number, rand01: () => number, ctx: FarmPlantCtx,
  opts: { greenhouse?: boolean; trowel?: boolean } = {},
): void {
  let stand: number;
  if (start.kind === 'seed') {
    const g = Math.min(0.98, start.establish * (1 + (ctx.sproutBonus ?? 0)));
    stand = 1 - Math.pow(1 - g, FARM_TUNING.seedsPerHole) + (rand01() - 0.5) * 0.1;
  } else {
    stand = start.establish + (rand01() - 0.5) * 0.06;
  }
  cell.cropId = crop.id;
  cell.start = start.kind;
  cell.plantedAt = nowMs;
  cell.lastMs = nowMs;
  cell.growth = 0;
  cell.picks = 0;
  cell.regrow = 0;
  cell.ripeH = 0;
  cell.dryH = 0;
  cell.interimDone = false;
  cell.resting = false;
  cell.established = false;
  cell.stand = Math.max(0.2, Math.min(1, stand));
  cell.quality = Math.min(1, FARM_TUNING.startQuality[start.kind]
    + (cell.compost ? FARM_TUNING.compostQuality : 0));
  // 238차 — 관리 작업 · 병 · 육묘
  cell.care = {}; cell.diseases = {}; cell.protect = {};
  cell.lodged = false; cell.frostedAt = undefined; cell.careYield = 1; cell.establishDryH = 0; cell.wetH = 0;
  cell.nursery = !!start.nursery;
  cell.cycleAt = undefined;
  // 247차 — 재배 요소: 철(알맞은 달 밖 — 냉해 · 더위는 섬이 준다) · 밑거름(퇴비 칸) · 모종삽 · 저절로 난 싹 표시
  cell.soggyH = 0; cell.process = undefined; cell.wild = false; cell.dividedYear = undefined; cell.fallowSince = undefined;
  cell.fedAtPlant = !!cell.compost;
  const off = start.nursery ? null : offTimingOf(crop, kstMonthOf(nowMs), start.months);
  cell.offTiming = off === 'cold' && opts.greenhouse ? undefined : off ?? undefined;
  const T = CULTIVATION_TUNING;
  if (cell.offTiming === 'cold') cell.stand = Math.max(0.2, cell.stand - T.coldStand);
  if (cell.offTiming === 'heat') { cell.stand = Math.max(0.2, cell.stand - T.heatStand); cell.quality = Math.max(FARM_TUNING.qualityFloor, cell.quality - T.heatQuality); }
  if (opts.trowel && start.kind === 'seedling') cell.stand = Math.min(1, cell.stand + T.toolQuality);
}

/** 걷어 낸다(작물만 — 갈아 둔 땅은 남는다) */
export function clearCell(cell: FarmCellState): void {
  cell.cropId = null;
  cell.start = undefined;
  cell.plantedAt = undefined;
  cell.growth = 0; cell.picks = 0; cell.regrow = 0; cell.ripeH = 0; cell.dryH = 0;
  cell.interimDone = false; cell.resting = false; cell.established = false; cell.compost = false;
  cell.stand = 0;
  cell.care = undefined; cell.diseases = undefined; cell.protect = undefined; cell.lodged = false; cell.frostedAt = undefined;
  cell.careYield = undefined; cell.nursery = false; cell.establishDryH = 0; cell.wetH = 0; cell.cycleAt = undefined;
  // 247차 — 재배 요소(묵힌 날은 다음 굴림에서 지금부터 센다)
  cell.soggyH = 0; cell.offTiming = undefined; cell.process = undefined; cell.wild = false; cell.dividedYear = undefined;
  cell.fedAtPlant = undefined; cell.fallowSince = undefined; cell.trayLeft = undefined;
}

export interface HarvestSkills {
  yieldBonus?: number;
  seedSaver?: number;
  /** 247차 — 도구(수확 가위 · 쇠스랑 · 낫) · 아침 수확 · 키질로 오르내리는 품질(호출 쪽이 정한다) */
  qualityBonus?: number;
  /** 247차 — 그 밖의 수량 배수(밭 손질 — 꼬투리 터짐) */
  yieldMult?: number;
}

/**
 * 247차 — 육묘 트레이에서 모종을 꺼낸다(사용자 「트레이에서 걷어내기 → 옮기는 개체만 별도의 아이템으로」).
 * 처음 꺼낼 때 트레이의 모종 수를 정하고(`trayLeft`), 꺼낸 만큼만 모종 아이템이 된다 — 남은 것은 트레이에 그대로 있다.
 * 다 꺼내면 칸이 빈다. `n`이 없으면 다 꺼낸다.
 */
export function pullSeedlings(cell: FarmCellState, rand01: () => number, n = Infinity): FarmHarvestResult | null {
  const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
  if (!crop || !cellReady(cell) || !cell.nursery) return null;
  const st = startOf(crop, cell.start);
  if (!st?.nursery) return null;
  if (cell.trayLeft === undefined) {
    const [a, b] = st.nursery.seedlings;
    cell.trayLeft = Math.max(1, Math.round((a + (b - a) * rand01()) * cell.stand * (cell.careYield ?? 1)));
  }
  const qty = Math.max(0, Math.min(cell.trayLeft, Math.floor(n)));
  if (qty <= 0) return null;
  const quality = cell.quality;
  cell.trayLeft -= qty;
  const more = cell.trayLeft > 0;
  if (!more) clearCell(cell);
  return { itemId: st.nursery.seedlingItemId, qty, grade: gradeOf(quality), quality, more, seedling: true };
}

/** 거둔다 — 반복 수확이면 다시 자라고, 여러해살이는 쉬고, 나머지는 칸이 빈다 */
export function harvestCell(cell: FarmCellState, rand01: () => number, skills: HarvestSkills = {}): FarmHarvestResult | null {
  const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
  if (!crop || !cellReady(cell)) return null;
  const st = startOf(crop, cell.start);
  // 238차 — 육묘 트레이 칸: 다 자라면 모종을 준다(가식을 거르면 줄어든다 — careYield) · 247차 남은 것을 다 꺼낸다
  if (cell.nursery && st?.nursery) return pullSeedlings(cell, rand01);
  const [lo, hi] = crop.harvest.qtyPerCell;
  const careMult = cell.careYield ?? 1;
  const diseaseMult = diseaseYieldMult(cell);
  const stage = ripeStageOf(cell, crop);
  // 247차 — 거름(퇴비 칸에 심었으면 적게 먹는 작물 −8% · 많이 먹는 작물 +8%) · 알맞은 철 밖(−15%) · 밭 손질(꼬투리 터짐)
  const cv = cultivationOf(crop);
  const feedMult = cell.fedAtPlant ? CULTIVATION_TUNING.feedYield[cv.feed] : 1;
  const timingMult = cell.offTiming ? CULTIVATION_TUNING.offTimingYield : 1;
  const raw = (lo + (hi - lo) * rand01()) * cell.stand * (1 + (skills.yieldBonus ?? 0)) * (st?.qtyMult ?? 1)
    * (cell.interimDone ? (crop.interim?.mainYieldMult ?? 1) : 1) * careMult * diseaseMult * feedMult * timingMult * (skills.yieldMult ?? 1);
  const base = Math.max(1, Math.round(raw));
  // 236차 — 덤: 0~bonusSteps단계(10%씩)를 고르게. 한 팩짜리의 10~30%는 반올림하면 사라지므로
  //   남는 몫은 그 확률로 한 개 더 준다 — 기대값이 정확히 「수량 × 덤%」가 된다
  const steps = crop.harvest.bonusSteps ?? 0;
  const bonusPct = steps > 0 ? 10 * Math.min(steps, Math.floor(rand01() * (steps + 1))) : 0;
  let bonusQty = 0;
  if (bonusPct > 0) {
    const e = base * bonusPct / 100;
    bonusQty = Math.floor(e) + (rand01() < e - Math.floor(e) ? 1 : 0);
  }
  const qty = base + bonusQty;
  // 238차 — 검붉게 익는 중(덜 익음)에 거두면 홍고추로 치되 품질이 깎인다(꼭지 끝까지 빨개야 빛깔이 좋다)
  const ripened = stage === 'red' || stage === 'turning';
  const turning = stage === 'turning';
  const itemId = ripened ? crop.harvest.ripenTo!.itemId : crop.harvest.itemId;
  const quality = Math.min(1, Math.max(FARM_TUNING.qualityFloor, cell.quality - (turning ? CARE_TUNING.turningQuality : 0) + (skills.qualityBonus ?? 0)));
  const grade = gradeOf(quality);
  const frosted = !!cell.frostedAt;
  const seedStart = crop.starts.find((s) => s.kind === 'seed' && s.cost > 0);
  const seedBack = seedStart && (skills.seedSaver ?? 0) > 0 && rand01() < (skills.seedSaver ?? 0)
    ? { itemId: seedStart.itemId, qty: 1 } : undefined;
  // 247차 — 곁눈(고추냉이): 거둘 때 뿌리줄기 옆에 붙은 어린 포기를 떼어 다시 심는다
  const prop = cv.propagate;
  const offsetStart = prop?.by === 'offset' ? crop.starts.find((s) => s.kind !== 'seed') ?? crop.starts[0] : undefined;
  const offsets = offsetStart && prop
    ? { itemId: offsetStart.itemId, qty: prop.qty[0] + Math.floor(rand01() * (prop.qty[1] - prop.qty[0] + 1)) } : undefined;
  const rep = crop.harvest.repeat;
  cell.picks += 1;
  let more = false;
  if (frosted) {
    clearCell(cell);   // 238차 — 서리 맞은 끝물: 남은 것을 거두면 끝
  } else if (rep && cell.picks <= rep.times) {
    cell.regrow = 0; cell.ripeH = 0; more = true;
  } else if (crop.perennial) {
    cell.resting = true; cell.regrow = 0; cell.ripeH = 0;
  } else {
    clearCell(cell);
  }
  return {
    itemId, qty, grade, quality, ...(seedBack ? { seedBack } : {}), more, ...(bonusQty > 0 ? { bonusQty, bonusPct } : {}),
    careMult, diseaseMult, ...(turning ? { turning } : {}), ...(frosted ? { frosted } : {}),
    ...(offsets && offsets.qty > 0 ? { offsets } : {}),
  };
}

// ─────────────────────────────────────────────
// 247차 — 거둔 뒤 밭 손질(베기 → 말리기 → 털기 · 키질)
// ─────────────────────────────────────────────

const DAY_MS = 86_400_000;

/** 밭 손질 단계 — 베기 전이면 null */
export function processStageOf(cell: Pick<FarmCellState, 'process'>): FieldProcessStage | null {
  if (!cell.process) return null;
  return cell.process.dryAt ? 'dry' : 'drying';
}

/** 다 마르기까지 남은 시간(h — 비 오는 시간은 세지 않는다). 다 말랐거나 손질 중이 아니면 0 */
export function processHoursLeft(cell: FarmCellState): number {
  const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
  const def = crop ? cultivationOf(crop).process : undefined;
  if (!def || !cell.process || cell.process.dryAt) return 0;
  return Math.max(0, def.dryDays * 24 - cell.process.dryH);
}

/** 첫 손(베기 · 캐기 · 뽑기) — 다 익은 칸만 · 밭 손질이 있는 작물만. 칸은 그대로 두고 말리기가 시작된다 */
export function startFieldProcess(cell: FarmCellState, nowMs: number): boolean {
  const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
  if (!crop || !cellReady(cell) || cell.process || cell.nursery) return false;
  if (!cultivationOf(crop).process) return false;
  cell.process = { cutAt: nowMs, dryH: 0, rainH: 0 };
  return true;
}

/**
 * 마지막 손(털기 · 꼬투리 따기 · 묶어 거두기) — 다 마른 칸만. 수량 · 등급은 거두기와 같은 식에
 * 꼬투리 터짐(다 마른 뒤 `shatterDays`가 지나면 하루 2% · 바닥 60%)과 키질(± 품질)을 더한다. 칸이 빈다.
 */
export function finishFieldProcess(
  cell: FarmCellState, rand01: () => number, skills: HarvestSkills, opts: { winnowed: boolean }, nowMs: number,
): FarmHarvestResult | null {
  const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
  const def = crop ? cultivationOf(crop).process : undefined;
  if (!crop || !def || !cell.process?.dryAt) return null;
  const T = CULTIVATION_TUNING;
  const over = def.shatterDays !== undefined ? Math.max(0, (nowMs - cell.process.dryAt) / DAY_MS - def.shatterDays) : 0;
  const shatter = over > 0 ? Math.max(T.shatterFloor, 1 - T.shatterDaily * over) : 1;
  const winnowQ = def.winnow ? (opts.winnowed ? T.winnowQuality : -T.winnowQuality) : 0;
  const rainLoss = cell.process.rainH * T.dryRainLoss;
  const r = harvestCell(cell, rand01, { ...skills, yieldMult: (skills.yieldMult ?? 1) * shatter, qualityBonus: (skills.qualityBonus ?? 0) + winnowQ });
  if (r) r.processNote = { ...(def.winnow ? { winnowed: opts.winnowed } : {}), rainLoss, shatterLoss: 1 - shatter };
  return r;
}

// ─────────────────────────────────────────────
// 247차 — 포기 나누기 · 뿌리 꺾꽂이(아주 까다로운 산채를 늘리는 법)
// ─────────────────────────────────────────────

const kstYearOf = (ms: number): number => new Date(ms + KST).getUTCFullYear();

/** 지금 이 칸을 나눌 수 없는 까닭(되면 null) */
export function divideBlockKo(cell: FarmCellState, crop: CropDef, nowMs: number): string | null {
  const p = cultivationOf(crop).propagate;
  if (!p || p.by === 'offset') return '나누어 늘리는 작물이 아니다';
  if (cell.process || cell.nursery) return '지금은 나눌 수 없다';
  if (!cell.established) return '한 해를 넘겨 뿌리가 자리 잡은 포기라야 나눈다';
  if (!p.months.includes(kstMonthOf(nowMs))) return `${monthRangeKo(p.months)}에 나눈다`;
  if (cell.dividedYear === kstYearOf(nowMs)) return '올해는 이미 나눴다 — 포기가 힘을 되찾게 둔다';
  return null;
}

/** 나눈다 — 심는 물건(모종 · 종구)을 돌려준다. 포기는 조금 성겨진다(섬 −0.15 · 바닥 0.5) */
export function divideCell(cell: FarmCellState, crop: CropDef, nowMs: number, rand01: () => number): { itemId: string; qty: number } | null {
  if (divideBlockKo(cell, crop, nowMs)) return null;
  const p = cultivationOf(crop).propagate!;
  const st = crop.starts.find((s) => s.kind !== 'seed') ?? crop.starts[0];
  if (!st) return null;
  const qty = p.qty[0] + Math.floor(rand01() * (p.qty[1] - p.qty[0] + 1));
  cell.stand = Math.max(Math.min(cell.stand, 0.5), cell.stand - 0.15);
  cell.dividedYear = kstYearOf(nowMs);
  return { itemId: st.itemId, qty };
}

/**
 * 247차 — 아주 까다로운 작물의 모종 · 종근은 종묘사에 늘 있지 않다(사용자 「일반 묘종사에서 구하기 힘들거나」).
 * 산채 농원에서 열흘에 한 번꼴 들어온다 — 작물마다 다른 날(결정적). 들어오는 날까지 남은 날(오늘이면 0).
 */
export function rareArrivalInDays(itemId: string, nowMs: number): number {
  const d = kstDayIndex(nowMs);
  const off = hashStr(itemId) % RARE_ARRIVAL_EVERY;
  return (RARE_ARRIVAL_EVERY - ((d + off) % RARE_ARRIVAL_EVERY)) % RARE_ARRIVAL_EVERY;
}

/** 238차 — 지금 거두면 나오는 아이템 id(등급 꼬리 없이) · 모종인가 — 가방 자리 확인용 */
export function harvestPreview(cell: FarmCellState, crop: CropDef): { itemId: string; seedling: boolean } {
  const st = startOf(crop, cell.start);
  if (cell.nursery && st?.nursery) return { itemId: st.nursery.seedlingItemId, seedling: true };
  const stage = ripeStageOf(cell, crop);
  const ripened = stage === 'red' || stage === 'turning';
  return { itemId: ripened ? crop.harvest.ripenTo!.itemId : crop.harvest.itemId, seedling: false };
}

/** 중간 수확(솎음 · 마늘종 · 고구마순 · 고춧잎 · 호박잎 · 고추냉이 잎) */
export function interimHarvestCell(cell: FarmCellState, rand01: () => number, skills: HarvestSkills = {}): FarmHarvestResult | null {
  const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
  if (!crop || !crop.interim || !interimOpen(cell, crop)) return null;
  const [lo, hi] = crop.interim.qtyPerCell;
  const qty = Math.max(1, Math.round((lo + (hi - lo) * rand01()) * cell.stand * (1 + (skills.yieldBonus ?? 0))));
  cell.interimDone = true;
  return { itemId: crop.interim.itemId, qty, grade: gradeOf(cell.quality), quality: cell.quality, more: true };
}

// ─────────────────────────────────────────────
// 그림 단계 · 남은 기간
// ─────────────────────────────────────────────

export type FarmCellStage = 'untilled' | 'tilled' | 'seeded' | 'young' | 'growing' | 'ready' | 'resting' | 'drying' | 'dried';

export function cellStage(cell: FarmCellState): FarmCellStage {
  if (!cell.tilled) return 'untilled';
  if (!cell.cropId) return 'tilled';
  if (cell.resting) return 'resting';
  if (cell.process) return cell.process.dryAt ? 'dried' : 'drying';   // 247차 — 베어(캐어) 말리는 칸
  if (cellReady(cell)) return 'ready';
  const g = cell.picks > 0 ? 0.7 + 0.3 * cell.regrow : cell.growth;
  return g < 0.15 ? 'seeded' : g < 0.5 ? 'young' : 'growing';
}

/** 적온 · 물 충분일 때 다음 수확까지 남은 날(철 밖이면 null — 철이 와야 자란다) */
export function daysToNextHarvest(cell: FarmCellState, plot: FarmPlotState, nowMs: number): number | null {
  const crop = cell.cropId ? getCrop(cell.cropId) : undefined;
  if (!crop || cell.resting) return null;
  if (cellReady(cell)) return 0;
  if (cell.frostedAt) return null;   // 238차 — 서리 뒤에는 더 자라지 않는다
  const month = kstMonthOf(nowMs);
  const season = seasonFactor(crop, month, plot);
  if (season === 0) return null;
  const mult = speedMultOf(crop, cell, plot, month) * season;
  if (cell.picks === 0) return ((1 - cell.growth) * cellDays(crop, cell)) / mult;
  return ((1 - cell.regrow) * (crop.harvest.repeat?.everyDays ?? 7)) / mult;
}

// ─────────────────────────────────────────────
// 시세
// ─────────────────────────────────────────────

/** 날씨 · 작황 출렁임 — 주 단위로 부드럽게 잇고 가끔(6%) 크게 뛴다(금배추 · 파테크). 같은 시각이면 누구에게나 같다 */
export function producePriceShock(cropId: string, nowMs: number, volatility: number): number {
  const weekF = (nowMs + KST) / (7 * 86_400_000);
  const w = Math.floor(weekF), t = weekF - w;
  const salt = hashStr(cropId);
  const n = (k: number): number => {
    const base = u01(hash32(k, salt)) * 2 - 1;
    return base + (u01(hash32(k, salt ^ 0x5bd1e995)) < 0.06 ? 1.2 : 0);
  };
  const v = n(w) * (1 - t) + n(w + 1) * t;
  return Math.max(0.5, Math.min(2.5, 1 + volatility * v));
}

/**
 * 수확물 한 단위 값(원) — 단가 × 달 지수 × 출렁임 × 등급 × 숨은 재조정. 수확물이 아니면 null.
 * 등급은 아이템 id 꼬리(`_sp` 특 · `_nm` 보통)에서 읽는다 — `grade`를 넘기면 그쪽이 이긴다.
 * 236차 — 출렁임은 **실제 소매가가 평년보다 얼마나 비싼지**(KAMIS 하루치 스냅샷 · `produceMarketRatio`)가 있으면
 *   그것을, 없으면(매핑 없는 작물 · 못 받은 날) 주간 출렁임을 쓴다.
 */
export function producePrice(itemId: string, nowMs: number, grade?: CropGrade): number | null {
  const crop = cropOfProduce(itemId);
  if (!crop) return null;
  const parsed = parseProduceId(itemId);
  const pack = crop.harvest.pack;
  const id = crop.harvest.itemId === itemId || crop.harvest.ripenTo?.itemId === itemId || crop.interim?.itemId === itemId || pack?.itemId === itemId
    ? itemId : parsed.baseId;
  grade = grade ?? (id === itemId ? 'good' : parsed.grade);
  const base = producePriceBase(crop, id);
  const season = crop.price.season[kstMonthOf(nowMs) - 1] ?? 1;
  const shock = produceMarketRatio(crop.id) ?? producePriceShock(crop.id, nowMs, crop.price.volatility);
  return roundWon(base * season * shock * FARM_TUNING.gradePrice[grade] * (crop.rebalance ?? 1));
}

/**
 * 243차 — 수확물 기본 id 하나의 기준가(원 · 상 등급 · 달 지수 · 출렁임 전). 본 · 붉어진 것 · 중간 · 팩 · 낱개(포장 단위가 있으면 8할).
 * 가게 카탈로그(`CropItems.produceBaseValue`)와 오늘 값(`producePrice`)이 같은 식을 쓴다.
 */
export function producePriceBase(crop: CropDef, baseId: string): number {
  const pack = crop.harvest.pack;
  if (pack && baseId === pack.itemId) return crop.price.base * pack.units;
  if (baseId === crop.harvest.itemId) return crop.price.base * (pack ? FARM_TUNING.looseSellMult : 1);
  if (baseId === crop.harvest.ripenTo?.itemId) return crop.harvest.ripenTo.price;
  return crop.interim?.price ?? crop.price.base;
}

/** 243차 — 값 반올림: 100원 이상은 10원 단위 · 그 아래(블루베리 한 알 · 방울토마토 한 개)는 1원 단위(10원 반올림이 15%까지 틀어진다) */
export function roundWon(v: number): number {
  return v >= 100 ? Math.round(v / 10) * 10 : Math.max(1, Math.round(v));
}

/**
 * 밸런스 점검용 — 칸 하나가 한 작기에 버는 하루 값(원/일 · 기준가 · 상 등급 · 섬 1).
 * 반복 수확은 모든 수확을 더하고 그 기간으로 나눈다. 시험(`FarmSim.test`)이 상한을 지킨다.
 */
export function cropDailyValue(crop: CropDef, startKind?: CropStartKind): number {
  const st = startOf(crop, startKind) ?? crop.starts[0];
  if (st.nursery) return 0;   // 238차 — 트레이 씨앗은 모종을 낼 뿐 수확물이 아니다
  const avgQty = (crop.harvest.qtyPerCell[0] + crop.harvest.qtyPerCell[1]) / 2;
  const picks = 1 + (crop.harvest.repeat?.times ?? 0);
  const days = st.days + (crop.harvest.repeat ? crop.harvest.repeat.everyDays * crop.harvest.repeat.times : 0);
  const value = avgQty * picks * crop.price.base * (crop.rebalance ?? 1) * (st.qtyMult ?? 1);
  const cost = st.cost * st.perCell;
  return (value - cost) / Math.max(1, days);
}
