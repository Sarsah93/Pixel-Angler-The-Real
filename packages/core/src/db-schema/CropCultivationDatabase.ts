/**
 * @file CropCultivationDatabase.ts
 * @description 247차 — 작물마다 다른 재배 요소(사용자 「고추 뿐 아니라 다른 작물들의 심기부터 재배까지 고려되는 모든 환경/요소들 —
 *              시기 · 노동 피로 정도 · 특정 도구 사용 · 행위의 정도(물을 조금만 줘야 하거나 많이 줘야 하는 경우)」)
 *
 * 한 작물에 한 벌(`CropCultivation`) — 작물 DB(`CropDatabase`)의 `water`(마르는 속도)와 따로 둔다.
 *  - **물**: 알맞은 흙 수분 구간(`band`) · 한 번에 줄 양(조금 · 보통 · 흠뻑) · 오래 젖어 있으면 생기는 탈(썩음 · 열과 · 맛 묽어짐 · 웃자람) ·
 *    거두기 전 물 끊기(`stopDays` — 고구마 · 양파 · 마늘 · 수박 · 참외). 구간 아래(0.25 이상)는 더디게(×0.85) 자란다.
 *  - **거름**: 적게(콩 · 땅콩 · 고구마 — 퇴비를 넣은 칸이면 잎 · 덩굴만 무성 −8%) · 보통 · 많이(배추 · 고추 · 오이 · 수박 — 퇴비 칸 +8%).
 *  - **품**: 심기 · 거두기 한 칸의 피로(1~3) — 씨 뿌리기 · 잎 따기는 가볍고, 덩이 캐기 · 베기 · 털기는 무겁다.
 *  - **도구**: 거두는 손(`harvestBy`)이 정한다 — 베기는 낫이 **있어야** 하고, 캐기는 호미나 쇠스랑이 있어야 한다.
 *    수확 가위(고추 가위) · 쇠스랑 · 모종삽 · 도리깨는 **있으면** 품이 줄고(×0.6) 아주 조금 좋아진다(품질 +0.02 · 키 +0.04).
 *  - **거둔 뒤 손질**: 깨 · 콩 · 보리는 베어 밭에서 말린 뒤 털고 키질한다. 땅콩은 캐어 말려 꼬투리를 따고, 마늘 · 양파는 캐어 말려 거둔다.
 *  - **시기**: 심을 수 있는 달 가운데 알맞은 달(`timing.best`) — 밖이면 수량 −15%에 까닭(꽃대가 일찍 · 냉해 · 더위 · 철이 짧다).
 *  - **가시**: 두릅 · 엄나무 · 초피는 장갑 없이 거두면 손을 찔린다(HP −2).
 *  - **늘리기**: 아주 까다로운 산채는 종묘사에 늘 있지 않다 — 포기 나누기 · 뿌리 꺾꽂이 · 곁눈으로 늘린다(`propagate`).
 *
 * 근거는 농촌진흥청 농사로 작목별 재배 기술 · 텃밭 가꾸기 · 국립원예특작과학원 · 지역 농업기술센터 자료를 247차 조사로 모았다
 * (작물별 출처는 워크로그 247 · 조사 정리본 `docs/wiki/03-WORKLOG/2026-10-14-247-*.md` §1).
 */

import type {
  CropCultivation, CropDef, FarmLaborAction, HarvestBy, OffTimingKind, OverwaterHarm, WaterAmount, FieldProcessDef, CropCategory,
} from '../types/Farming.js';
import { CROP_CULTIVATION } from './CropCultivationData.js';

// ─────────────────────────────────────────────
// 도구 id(농자재 `FARM_SUPPLIES`에 같은 id로 등록)
// ─────────────────────────────────────────────

export const SICKLE_ID = 'farm_sickle';
export const HARVEST_SCISSORS_ID = 'farm_harvest_scissors';
export const FORK_ID = 'farm_fork';
export const TROWEL_ID = 'farm_trowel';
export const FLAIL_ID = 'farm_flail';
export const WINNOW_ID = 'farm_winnow';
export const GLOVES_ID = 'farm_gloves';
/** 호미(땅 일구기 · 김매기 · 캐기) — `CropCareDatabase.FARM_HOMI_ID`와 같은 id */
const HOMI = 'farm_homi';

// ─────────────────────────────────────────────
// 수치
// ─────────────────────────────────────────────

export const CULTIVATION_TUNING = {
  /** 물 한 번에 오르는 흙 수분 — 조금 · 보통 · 흠뻑(흠뻑 = 가득) */
  waterAdd: { light: 0.3, normal: 0.55, deep: 1 } as Record<WaterAmount, number>,
  /** 알맞은 구간 아래(그래도 0.25 이상)면 생장 배율 */
  belowBandGrowth: 0.85,
  /**
   * 구간 위로 이만큼(h) **잇달아** 젖어 있어야 탈이 나기 시작한다 — 비 한 번 · 하루 한 번 물 주기는 견딘다.
   * 물을 좋아하지 않는 작물(구간 위가 낮다)에 날마다 흠뻑 주면 마를 틈이 없어 탈이 난다(고구마 · 땅콩 · 콩).
   */
  soggyGraceH: 36,
  /** 견디는 시간을 정하는 기준 증발(한여름 시간당) — 그보다 덜 마르는 달은 그만큼 길게 견딘다 */
  soggyRefEvap: 0.012,
  /** 구간 밑으로 내려오면 젖은 시간이 이만큼씩 빠진다(거의 바로 풀린다 — 「잇달아」 젖은 시간만 센다) */
  soggyDryRate: 6,
  /** 탈의 시간당 피해(유예가 지난 뒤) */
  harm: {
    rot: { stand: 0.0008, quality: 0.0006, standFloor: 0.5 },
    crack: { quality: 0.002 },
    bland: { quality: 0.0012 },
    leggy: { quality: 0.0006 },
  },
  /** 물 끊기 기간에는 알맞은 수분의 위가 아래 + 이만큼으로 낮아진다 */
  stopBandSpan: 0.12,
  /** 거름 요구 — 퇴비 칸의 수량 배수 */
  feedYield: { low: 0.92, mid: 1, high: 1.08 } as Record<CropCultivation['feed'], number>,
  /** 알맞은 철 밖 — 수량 배수 · 꽃대는 쇠는 기간 배수 · 냉해 섬 · 더위 섬과 품질 */
  offTimingYield: 0.85,
  boltHoldMult: 0.5,
  coldStand: 0.08,
  heatStand: 0.05,
  heatQuality: 0.03,
  /** 도움 도구 — 품 배수 · 품질 · 걸리는 시간 배수 */
  toolLabor: 0.6,
  toolQuality: 0.02,
  toolSeconds: 0.6,
  /** 키질 — 있으면 + · 없으면 − */
  winnowQuality: 0.04,
  /** 말리는 동안 비 맞은 시간당 품질 */
  dryRainLoss: 0.002,
  /** 다 마른 뒤 꼬투리가 터지기 시작하면 하루 수량 손실 · 바닥 */
  shatterDaily: 0.02,
  shatterFloor: 0.6,
  /** 가시에 찔리면 HP */
  thornHp: 2,
  /** 아침(5~10시 KST) 잎 · 열매를 따면 품질 + — 이슬이 마른 서늘한 때 */
  morningQuality: 0.02,
  morningHours: [5, 10] as [number, number],
  /** 품 — 힘들면 쉬어야 한다(일하기 피로 상한과 같은 값) */
  fatigueLimit: 88,
  hungerPerFatigue: 0.5,
  hydrationPerFatigue: 0.7,
};

/**
 * 247차 — 한 칸 일의 피로(품). 관리 작업(`CareTaskDef.fatigue` 2~6 · 묶음이면 칸마다 ×0.6 더)과 같은 저울이다.
 *  - 땅 일구기 1.8 — 호미로 1㎡를 갈아엎는다(품삯 일 50분 = 9와 견주면 10분 남짓)
 *  - 심기 · 거두기는 작물의 `labor`(1~3) 칸을 고른다 · 물은 양에 따라
 */
export const FARM_LABOR = {
  till: 1.8,
  compost: 0.8,
  water: { light: 0.25, normal: 0.4, deep: 0.6 } as Record<WaterAmount, number>,
  plant: [0, 0.5, 1, 1.8] as readonly number[],
  harvest: [0, 0.5, 1.1, 2.2] as readonly number[],
  interim: 0.5,
  cut: 1.5,
  dig: 2.2,
  pull: 0.8,
  thresh: 2,
  pick_pods: 1.2,
  gather: 0.5,
  winnow: 0.6,
  divide: 1.5,
  pull_seedlings: 0.3,
};

/** 걸리는 시간(초 — 필드 동작 · 실제 시간). 도움 도구는 ×0.6 */
export const FARM_SECONDS = {
  till: 0.9, compost: 0.6, water: { light: 0.5, normal: 0.8, deep: 1.1 } as Record<WaterAmount, number>,
  plant: [0, 0.6, 1, 1.3] as readonly number[], harvest: [0, 0.5, 0.9, 1.4] as readonly number[],
  interim: 0.6, cut: 1.2, dig: 1.4, pull: 0.7, thresh: 1.5, pick_pods: 1.2, gather: 0.6, winnow: 1, divide: 1.2, pull_seedlings: 0.4,
};

// ─────────────────────────────────────────────
// 이름(ko/en)
// ─────────────────────────────────────────────

export const WATER_AMOUNT_KO: Record<WaterAmount, string> = { light: '조금', normal: '보통', deep: '흠뻑' };
export const WATER_AMOUNT_EN: Record<WaterAmount, string> = { light: 'A little', normal: 'Normal', deep: 'Soak' };
export const OVERWATER_KO: Record<OverwaterHarm, string> = {
  rot: '뿌리 · 덩이가 썩는다', crack: '열매 · 뿌리가 갈라진다', bland: '맛이 묽어진다', leggy: '웃자라 연약해진다', none: '물을 좋아한다',
};
export const OVERWATER_EN: Record<OverwaterHarm, string> = {
  rot: 'Roots and tubers rot', crack: 'Fruit and roots split', bland: 'The flavour goes watery', leggy: 'Grows leggy and weak', none: 'Loves water',
};
export const FEED_KO: Record<CropCultivation['feed'], string> = { low: '적게', mid: '보통', high: '많이' };
export const FEED_EN: Record<CropCultivation['feed'], string> = { low: 'Light', mid: 'Moderate', high: 'Heavy' };
export const HARVEST_BY_KO: Record<HarvestBy, string> = { pick: '손으로 딴다', snip: '꼭지를 자른다', cut: '낫으로 벤다', dig: '캔다', pull: '뽑는다' };
export const HARVEST_BY_EN: Record<HarvestBy, string> = { pick: 'Picked by hand', snip: 'Stems clipped', cut: 'Cut with a sickle', dig: 'Dug up', pull: 'Pulled' };
export const OFF_TIMING_KO: Record<OffTimingKind, string> = {
  bolt: '꽃대가 일찍 서서 빨리 쇤다', cold: '냉해로 몸살을 앓는다', heat: '더위에 시달린다', short: '자랄 철이 짧다',
};
export const OFF_TIMING_EN: Record<OffTimingKind, string> = {
  bolt: 'bolts early and turns tough fast', cold: 'suffers a cold check', heat: 'struggles in the heat', short: 'runs short of season',
};
export const PROCESS_FIRST_KO: Record<FieldProcessDef['first'], string> = { cut: '베기', dig: '캐기', pull: '뽑기' };
export const PROCESS_FIRST_EN: Record<FieldProcessDef['first'], string> = { cut: 'Cut', dig: 'Dig up', pull: 'Pull' };
export const PROCESS_LAST_KO: Record<FieldProcessDef['last'], string> = { thresh: '털기', pick: '꼬투리 따기', gather: '묶어 거두기' };
export const PROCESS_LAST_EN: Record<FieldProcessDef['last'], string> = { thresh: 'Thresh', pick: 'Pick the pods', gather: 'Bundle and gather' };
export const LABOR_KO = ['', '가볍다', '보통', '무겁다'];
export const LABOR_EN = ['', 'Light', 'Moderate', 'Heavy'];

// ─────────────────────────────────────────────
// 갈래 기본값 — 표에 없는 작물(새 작물 대비)
// ─────────────────────────────────────────────

type Base = Omit<CropCultivation, 'noteKo' | 'noteEn'>;
const CATEGORY_DEFAULT: Record<CropCategory, Base> = {
  sprout: { water: { band: [0.6, 1], amount: 'deep', over: 'none' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'pull' },
  mushroom: { water: { band: [0.55, 0.95], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick' },
  leaf: { water: { band: [0.45, 0.85], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick' },
  fruit: { water: { band: [0.4, 0.8], amount: 'normal', over: 'crack' }, feed: 'high', labor: { plant: 2, harvest: 2 }, harvestBy: 'snip' },
  root: { water: { band: [0.35, 0.75], amount: 'normal', over: 'crack' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pull' },
  tuber: { water: { band: [0.25, 0.65], amount: 'light', over: 'rot', stopDays: 14 }, feed: 'mid', labor: { plant: 3, harvest: 3 }, harvestBy: 'dig' },
  bulb: { water: { band: [0.3, 0.7], amount: 'normal', over: 'rot', stopDays: 14 }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'pull' },
  grain: { water: { band: [0.25, 0.7], amount: 'light', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 3 }, harvestBy: 'cut' },
  legume: { water: { band: [0.25, 0.65], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick' },
  wild: { water: { band: [0.5, 0.9], amount: 'normal', over: 'rot' }, feed: 'low', labor: { plant: 2, harvest: 1 }, harvestBy: 'pick' },
  herb: { water: { band: [0.35, 0.75], amount: 'light', over: 'leggy' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick' },
};

/** 작물별 표(247차 조사) — `CropCultivationData.ts`가 채운다(작물 수가 많아 파일을 나눴다) */
export { CROP_CULTIVATION };

const cache = new Map<string, CropCultivation>();

/** 이 작물의 재배 요소 — 표가 있으면 그것, 없으면 갈래 기본값 */
export function cultivationOf(crop: Pick<CropDef, 'id' | 'category'>): CropCultivation {
  const hit = cache.get(crop.id);
  if (hit) return hit;
  const row = CROP_CULTIVATION[crop.id];
  const base = CATEGORY_DEFAULT[crop.category] ?? CATEGORY_DEFAULT.leaf;
  const out: CropCultivation = row ?? { ...base, noteKo: '', noteEn: '' };
  cache.set(crop.id, out);
  return out;
}

// ─────────────────────────────────────────────
// 도구 판정
// ─────────────────────────────────────────────

export interface ToolEval {
  /** 이것들 가운데 하나가 있어야 한다(없으면 못 한다) — 비면 맨손으로 된다 */
  needsAny: string[];
  /** 지금 쓴 도움 도구(있으면 — 여럿이면 품 배수를 곱한다) */
  helper?: string;
  helpers: string[];
  /** 품 · 걸리는 시간 배수 · 품질 ± */
  laborMult: number;
  secondsMult: number;
  quality: number;
}

const noTool = (): ToolEval => ({ needsAny: [], helpers: [], laborMult: 1, secondsMult: 1, quality: 0 });
/** 도움 도구 하나를 더한다(품 · 시간은 곱하고 품질은 더한다) */
function addHelper(t: ToolEval, id: string, labor = CULTIVATION_TUNING.toolLabor, quality = CULTIVATION_TUNING.toolQuality): ToolEval {
  t.helpers.push(id);
  t.helper ??= id;
  t.laborMult *= labor;
  t.secondsMult *= labor === CULTIVATION_TUNING.toolLabor ? CULTIVATION_TUNING.toolSeconds : labor;
  t.quality += quality;
  return t;
}

/**
 * 거둘 때 도구 — 베기(밭 손질이 있는 작물) = 낫이 있어야 · 캐기 = 호미나 쇠스랑이 있어야(쇠스랑은 빠르지만 덩이가 찍히는 작물이 있다) ·
 * 꼭지 자르기 = 수확 가위가 도움 · 잎채소 베기 = 낫이나 수확 가위가 도움 · 덩굴을 먼저 걷는 작물 = 낫이 도움(×0.8) · 따기 · 뽑기 = 맨손.
 */
export function harvestToolEval(crop: Pick<CropDef, 'id' | 'category'>, has: (itemId: string) => boolean): ToolEval {
  const cv = cultivationOf(crop);
  const by = cv.process?.first ?? cv.harvestBy;
  const t = noTool();
  switch (by) {
    case 'cut':
      if (cv.process) t.needsAny = [SICKLE_ID];
      else if (has(SICKLE_ID)) addHelper(t, SICKLE_ID);
      else if (has(HARVEST_SCISSORS_ID)) addHelper(t, HARVEST_SCISSORS_ID);
      break;
    case 'dig':
      t.needsAny = [FORK_ID, HOMI];
      if (has(FORK_ID)) addHelper(t, FORK_ID, CULTIVATION_TUNING.toolLabor, cv.forkSpears ? -CULTIVATION_TUNING.toolQuality : CULTIVATION_TUNING.toolQuality);
      break;
    case 'snip':
      if (has(HARVEST_SCISSORS_ID)) addHelper(t, HARVEST_SCISSORS_ID);
      break;
    default: break;
  }
  if (cv.vines && has(SICKLE_ID) && !t.helpers.includes(SICKLE_ID)) addHelper(t, SICKLE_ID, 0.8, 0);
  return t;
}

/** 심을 때 도구 — 모종은 모종삽이 도움(품 ×0.6 · 섬 +0.02). 종구 · 씨앗은 맨손 */
export function plantToolEval(kind: 'seed' | 'seedling' | 'set', has: (itemId: string) => boolean): ToolEval {
  const t = noTool();
  if (kind === 'seedling' && has(TROWEL_ID)) addHelper(t, TROWEL_ID);
  return t;
}

/** 밭 손질 마지막 손의 도구 — 털기는 도리깨가 도움(없으면 막대로 두드린다) */
export function processLastToolEval(def: FieldProcessDef, has: (itemId: string) => boolean): ToolEval {
  const t = noTool();
  if (def.last === 'thresh' && has(FLAIL_ID)) addHelper(t, FLAIL_ID, CULTIVATION_TUNING.toolLabor, 0);
  return t;
}

// ─────────────────────────────────────────────
// 품
// ─────────────────────────────────────────────

/** 한 칸 일의 피로 · 걸리는 시간 — 도구 배수를 곱한다 */
export function laborOf(
  action: FarmLaborAction, crop?: Pick<CropDef, 'id' | 'category'>, opt: { amount?: WaterAmount; tool?: ToolEval } = {},
): { fatigue: number; seconds: number } {
  const k = opt.tool?.laborMult ?? 1;
  const ks = opt.tool?.secondsMult ?? 1;
  const cv = crop ? cultivationOf(crop) : undefined;
  let f: number;
  let s: number;
  switch (action) {
    case 'water': { const a = opt.amount ?? 'normal'; f = FARM_LABOR.water[a]; s = FARM_SECONDS.water[a]; break; }
    case 'plant': { const l = cv?.labor.plant ?? 1; f = FARM_LABOR.plant[l]; s = FARM_SECONDS.plant[l]; break; }
    case 'harvest': { const l = cv?.labor.harvest ?? 1; f = FARM_LABOR.harvest[l]; s = FARM_SECONDS.harvest[l]; break; }
    default: f = FARM_LABOR[action]; s = FARM_SECONDS[action]; break;
  }
  return { fatigue: f * k, seconds: s * ks };
}

/** 피로 → 허기 · 수분 · 피로 벡터(관리 작업과 같은 비) */
export function laborVector(fatigue: number): { hunger: number; hydration: number; fatigue: number } {
  return {
    hunger: fatigue * CULTIVATION_TUNING.hungerPerFatigue,
    hydration: fatigue * CULTIVATION_TUNING.hydrationPerFatigue,
    fatigue,
  };
}

/** 지쳐서 일을 못 하는가(일하기 피로 상한과 같은 값) */
export function tooTiredKo(fatigue: number): string | null {
  return fatigue >= CULTIVATION_TUNING.fatigueLimit ? `너무 지쳤다 (피로 ${Math.round(fatigue)}) — 쉬고 나서 한다` : null;
}

// ─────────────────────────────────────────────
// 물
// ─────────────────────────────────────────────

/** 물을 준 뒤 흙 수분 */
export function wateredMoisture(moisture: number, amount: WaterAmount): number {
  return amount === 'deep' ? 1 : Math.min(1, moisture + CULTIVATION_TUNING.waterAdd[amount]);
}

/**
 * 지금 이 칸의 알맞은 흙 수분 [아래, 위] — 물 끊기 기간(거두기 `stopDays` 앞 · 첫 수확 전)에는 위가 낮아진다.
 * `daysLeft` = 첫 수확까지 남은 날(적온 기준 · 모르면 undefined).
 */
export function waterBandOf(crop: Pick<CropDef, 'id' | 'category'>, daysLeft?: number): { band: [number, number]; stopping: boolean } {
  const w = cultivationOf(crop).water;
  if (w.stopDays && daysLeft !== undefined && daysLeft > 0 && daysLeft <= w.stopDays) {
    return { band: [w.band[0], Math.min(w.band[1], w.band[0] + CULTIVATION_TUNING.stopBandSpan)], stopping: true };
  }
  return { band: w.band, stopping: false };
}

/** 흙 수분이 어디인가 — 마름 · 조금 마름 · 알맞음 · 젖음 */
export type MoistureState = 'dry' | 'low' | 'ok' | 'wet';
export function moistureStateOf(moisture: number, band: [number, number]): MoistureState {
  if (moisture < 0.25) return 'dry';
  if (moisture < band[0]) return 'low';
  if (moisture > band[1]) return 'wet';
  return 'ok';
}
export const MOISTURE_STATE_KO: Record<MoistureState, string> = { dry: '바짝 말랐다', low: '조금 마르다', ok: '알맞다', wet: '너무 젖었다' };
export const MOISTURE_STATE_EN: Record<MoistureState, string> = { dry: 'Bone dry', low: 'A little dry', ok: 'Just right', wet: 'Too wet' };

// ─────────────────────────────────────────────
// 시기
// ─────────────────────────────────────────────

/** 이 달에 심으면 알맞은 철 밖인가(까닭) — 표에 알맞은 달이 없거나 그 달이면 null */
export function offTimingOf(crop: Pick<CropDef, 'id' | 'category'>, month: number, startMonths: readonly number[]): OffTimingKind | null {
  const t = cultivationOf(crop).timing;
  if (!t) return null;
  const best = t.best.filter((m) => startMonths.includes(m));
  if (best.length === 0 || best.includes(month)) return null;
  return t.offMonths?.[month] ?? t.off;
}

// ─────────────────────────────────────────────
// 저절로 나는 싹(사용자 「우연히 자라게 하거나 — 실제처럼」)
// ─────────────────────────────────────────────

/**
 * 247차 — 오래 묵힌 칸(일군 채 2주 넘게 비어 있다)에 저절로 올라오는 싹.
 * 산나물 씨앗은 바람 · 새를 타고 숲 가장자리에서 날아든다 — 그늘(차광막) 아래 축축한 흙이어야 싹이 튼다(곰취 · 눈개승마 · 어수리 · 산마늘).
 * 초피 · 엄나무 · 두릅은 새가 열매를 먹고 떨군 씨가 난다(그늘이 없어도). 비름은 여름 마당 어디서나 난다.
 * 칸마다 하루 확률 · 달 · 그늘이 맞아야 하고, 한 구획에 저절로 난 싹은 한 번에 하나만 둔다(드물게).
 */
export interface WildSproutDef {
  cropId: string;
  /** 차광막 아래에서만 */
  shade: boolean;
  /** 싹이 트는 달 */
  months: number[];
  /** 고를 때의 무게 */
  weight: number;
}
export const WILD_SPROUTS: readonly WildSproutDef[] = [
  { cropId: 'gomchwi', shade: true, months: [3, 4, 5], weight: 3 },
  { cropId: 'samnamul', shade: true, months: [3, 4, 5], weight: 2 },
  { cropId: 'eosuri', shade: true, months: [3, 4, 5, 9], weight: 2 },
  { cropId: 'myeongi', shade: true, months: [3, 4, 9, 10], weight: 1 },
  { cropId: 'bujigaengi', shade: false, months: [4, 5, 9], weight: 2 },
  { cropId: 'chopi', shade: false, months: [4, 5], weight: 2 },
  { cropId: 'eomnamu', shade: false, months: [4, 5], weight: 1 },
  { cropId: 'dureup', shade: false, months: [4, 5], weight: 1 },
  { cropId: 'amaranth', shade: false, months: [5, 6, 7], weight: 6 },
];
export const WILD_TUNING = {
  /** 칸마다 하루 확률 — 그늘 산나물 · 그 밖 · 흙에 떨어진 씨가 있을 때(그 철) */
  dailyShade: 0.004,
  dailyOpen: 0.0015,
  dailySeedBank: 0.01,
  /** 떨어진 씨(씨앗 은행)에서 나는 것의 무게 · 텃밭이 기억하는 작물 수 */
  seedBankWeight: 5,
  seedBankMax: 6,
  /** 묵힌 지 이만큼(일) 지나야 */
  fallowDays: 14,
  /** 저절로 난 싹의 섬 · 품질 */
  stand: 0.35,
  quality: 0.7,
  /** 자람이 이만큼 되면 이름을 안다 */
  revealGrowth: 0.25,
};

/** 이 달 · 그늘에서 날 수 있는 것 가운데 무게로 하나를 고른다(r ∈ [0,1)) — `extra` = 그 텃밭 흙에 떨어진 씨 */
export function pickWildSprout(month: number, shade: boolean, r: number, extra: readonly WildSproutDef[] = []): WildSproutDef | null {
  const pool = [...WILD_SPROUTS, ...extra].filter((w) => w.months.includes(month) && (!w.shade || shade));
  const total = pool.reduce((a, w) => a + w.weight, 0);
  if (total <= 0) return null;
  let x = r * total;
  for (const w of pool) { x -= w.weight; if (x < 0) return w; }
  return pool[pool.length - 1] ?? null;
}

/** 아주 까다로운 작물이 종묘사에 들어오는 날 — 열흘에 한 번꼴(작물마다 다른 날 · 결정적) */
export const RARE_ARRIVAL_EVERY = 10;

// ─────────────────────────────────────────────
// 상세 · 위키 한 줄
// ─────────────────────────────────────────────

const monthsList = (ms: readonly number[]): string => {
  const s = [...new Set(ms)].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const m of s) { const l = runs[runs.length - 1]; if (l && m === l[1] + 1) l[1] = m; else runs.push([m, m]); }
  return runs.map(([a, b]) => (a === b ? `${a}월` : `${a}~${b}월`)).join(' · ');
};
const MONTH_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthsListEn = (ms: readonly number[]): string => {
  const s = [...new Set(ms)].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const m of s) { const l = runs[runs.length - 1]; if (l && m === l[1] + 1) l[1] = m; else runs.push([m, m]); }
  return runs.map(([a, b]) => (a === b ? MONTH_EN[a] : `${MONTH_EN[a]}–${MONTH_EN[b]}`)).join(', ');
};

/** 도구 이름(상세 줄) */
export const TOOL_NAME_KO: Record<string, string> = {
  [SICKLE_ID]: '낫', [HARVEST_SCISSORS_ID]: '수확 가위', [FORK_ID]: '쇠스랑', [TROWEL_ID]: '모종삽', [FLAIL_ID]: '도리깨',
  [WINNOW_ID]: '키', [GLOVES_ID]: '코팅 장갑', [HOMI]: '호미',
};
export const TOOL_NAME_EN: Record<string, string> = {
  [SICKLE_ID]: 'sickle', [HARVEST_SCISSORS_ID]: 'harvest snips', [FORK_ID]: 'digging fork', [TROWEL_ID]: 'hand trowel', [FLAIL_ID]: 'flail',
  [WINNOW_ID]: 'winnowing basket', [GLOVES_ID]: 'work gloves', [HOMI]: 'homi',
};

/** 물 한 줄 — 「조금씩 · 알맞은 흙 25~65% · 넘치면 덩이가 썩는다 · 캐기 2주 전부터 끊는다」 */
export function waterLineKo(crop: Pick<CropDef, 'id' | 'category'>): string {
  const w = cultivationOf(crop).water;
  const parts = [`${WATER_AMOUNT_KO[w.amount]}씩`, `알맞은 흙 ${Math.round(w.band[0] * 100)}~${Math.round(w.band[1] * 100)}%`];
  if (w.over !== 'none') parts.push(`넘치면 ${OVERWATER_KO[w.over]}`); else parts.push(OVERWATER_KO.none);
  if (w.stopDays) parts.push(`거두기 ${w.stopDays}일 전부터 끊는다`);
  return parts.join(' · ');
}
export function waterLineEn(crop: Pick<CropDef, 'id' | 'category'>): string {
  const w = cultivationOf(crop).water;
  const parts = [`${WATER_AMOUNT_EN[w.amount]} each time`, `soil ${Math.round(w.band[0] * 100)}–${Math.round(w.band[1] * 100)}% moist`];
  parts.push(w.over === 'none' ? OVERWATER_EN.none : `too much: ${OVERWATER_EN[w.over].toLowerCase()}`);
  if (w.stopDays) parts.push(`stop ${w.stopDays} days before harvest`);
  return parts.join(' · ');
}

/** 도구 한 줄 — 「거둘 때 낫이 있어야 한다 · 털 때 도리깨가 도움 · 키질」 */
export function toolLineKo(crop: Pick<CropDef, 'id' | 'category'>): string {
  const cv = cultivationOf(crop);
  const parts: string[] = [];
  const by = cv.process?.first ?? cv.harvestBy;
  if (by === 'cut' && cv.process) parts.push('벨 때 낫이 있어야 한다');
  else if (by === 'cut') parts.push('낫이나 수확 가위로 베면 품이 준다');
  else if (by === 'dig') parts.push(cv.forkSpears ? '호미나 쇠스랑으로 캔다 — 쇠스랑은 빠르지만 몇 개 찍힌다' : '호미나 쇠스랑으로 캔다 — 쇠스랑이 빠르다');
  if (cv.vines) parts.push('캐기 전 덩굴은 낫으로 걷는다');
  else if (by === 'snip') parts.push('수확 가위가 있으면 빠르고 조금 더 좋다');
  if (cv.process?.last === 'thresh') parts.push('털 때 도리깨가 도움');
  if (cv.process?.winnow) parts.push('키로 까부르면 값을 더 받는다');
  if (cv.thorny) parts.push('가시 — 장갑을 낀다');
  if (cv.labor.plant >= 2) parts.push('모종삽이 있으면 심는 품이 준다');
  return parts.join(' · ');
}
export function toolLineEn(crop: Pick<CropDef, 'id' | 'category'>): string {
  const cv = cultivationOf(crop);
  const parts: string[] = [];
  const by = cv.process?.first ?? cv.harvestBy;
  if (by === 'cut' && cv.process) parts.push('needs a sickle to cut');
  else if (by === 'cut') parts.push('a sickle or snips makes cutting easier');
  else if (by === 'dig') parts.push(cv.forkSpears ? 'dug with a homi or a digging fork — the fork is faster but spears a few' : 'dug with a homi or a digging fork — the fork is faster');
  if (cv.vines) parts.push('clear the vines with a sickle first');
  else if (by === 'snip') parts.push('harvest snips are quicker and a touch better');
  if (cv.process?.last === 'thresh') parts.push('a flail helps with threshing');
  if (cv.process?.winnow) parts.push('winnowing fetches a better price');
  if (cv.thorny) parts.push('thorny — wear gloves');
  if (cv.labor.plant >= 2) parts.push('a trowel eases planting');
  return parts.join(' · ');
}

/** 거둔 뒤 손질 한 줄 — 「베기 → 밭에서 7일 말리기 → 털기 → 키질」 */
export function processLineKo(crop: Pick<CropDef, 'id' | 'category'>): string {
  const p = cultivationOf(crop).process;
  if (!p) return '';
  const steps = [PROCESS_FIRST_KO[p.first], `밭에서 ${p.dryDays}일 말리기`, PROCESS_LAST_KO[p.last]];
  if (p.winnow) steps.push('키질');
  return steps.join(' → ');
}
export function processLineEn(crop: Pick<CropDef, 'id' | 'category'>): string {
  const p = cultivationOf(crop).process;
  if (!p) return '';
  const steps = [PROCESS_FIRST_EN[p.first], `dry ${p.dryDays} days in the field`, PROCESS_LAST_EN[p.last]];
  if (p.winnow) steps.push('Winnow');
  return steps.join(' → ');
}

/** 알맞은 철 한 줄 — 「알맞은 달 4~5월 — 그 밖은 꽃대가 일찍 서서 빨리 쇤다(수량 −15%)」 */
export function timingLineKo(crop: Pick<CropDef, 'id' | 'category'>): string {
  const t = cultivationOf(crop).timing;
  return t ? `알맞은 달 ${monthsList(t.best)} — 그 밖은 ${OFF_TIMING_KO[t.off]} (수량 −15%)` : '';
}
export function timingLineEn(crop: Pick<CropDef, 'id' | 'category'>): string {
  const t = cultivationOf(crop).timing;
  return t ? `Best months ${monthsListEn(t.best)} — otherwise it ${OFF_TIMING_EN[t.off]} (yield −15%)` : '';
}

/** 품 한 줄 — 「심기 가볍다 · 거두기 무겁다 · 거름 많이」 */
export function laborLineKo(crop: Pick<CropDef, 'id' | 'category'>): string {
  const cv = cultivationOf(crop);
  return `심기 ${LABOR_KO[cv.labor.plant]} · 거두기 ${LABOR_KO[cv.labor.harvest]} (${HARVEST_BY_KO[cv.process?.first === 'cut' ? 'cut' : cv.harvestBy]}) · 거름 ${FEED_KO[cv.feed]}`;
}
export function laborLineEn(crop: Pick<CropDef, 'id' | 'category'>): string {
  const cv = cultivationOf(crop);
  return `Planting ${LABOR_EN[cv.labor.plant].toLowerCase()} · harvest ${LABOR_EN[cv.labor.harvest].toLowerCase()} (${HARVEST_BY_EN[cv.process?.first === 'cut' ? 'cut' : cv.harvestBy].toLowerCase()}) · feeding ${FEED_EN[cv.feed].toLowerCase()}`;
}

/** 늘리는 법 한 줄 */
export function propagateLineKo(crop: Pick<CropDef, 'id' | 'category'>): string {
  const p = cultivationOf(crop).propagate;
  if (!p) return '';
  const how = p.by === 'division' ? '포기 나누기' : p.by === 'cutting' ? '뿌리 꺾꽂이' : p.by === 'runner' ? '런너 받기' : '거둘 때 곁눈';
  return p.months.length ? `${how} — ${monthsList(p.months)}에 한 포기에서 ${p.qty[0]}~${p.qty[1]}개` : `${how} ${p.qty[0]}~${p.qty[1]}개`;
}
export function propagateLineEn(crop: Pick<CropDef, 'id' | 'category'>): string {
  const p = cultivationOf(crop).propagate;
  if (!p) return '';
  const how = p.by === 'division' ? 'Division' : p.by === 'cutting' ? 'Root cuttings' : p.by === 'runner' ? 'Runners' : 'Offsets at harvest';
  return p.months.length ? `${how} — ${p.qty[0]}–${p.qty[1]} per plant in ${monthsListEn(p.months)}` : `${how}: ${p.qty[0]}–${p.qty[1]}`;
}
