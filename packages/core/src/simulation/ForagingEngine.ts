/**
 * @file ForagingEngine.ts
 * @description 인-맵 채집(해루질) 판정 엔진 (121차) — 스팟 롤링 · 안전 판정 · 도구/홀드 · 채집 결과 · 조례 단속.
 *
 * 씬(RegionFieldScene)은 지형에서 후보 타일만 만들고, "무엇이 어디에 얼마나 나오나 / 잡히나 / 걸리나"는
 * 전부 여기서 결정한다(수치는 TUNING.forage). 난수는 호출자가 시드 PRNG를 넘긴다 — 시간 시드로
 * 스팟이 재현되므로 세이브가 필요 없다.
 */

import type { ShoreCreature } from '../db-schema/ShoreCreatureDatabase.js';
import { SHORE_CREATURE_DATABASE } from '../db-schema/ShoreCreatureDatabase.js';
import type { ForageCandidate, ForageSpot, ForageSpotKind, ForageTool, FishFarm } from '../types/Foraging.js';
import { GANGWON_FORAGE_ORDINANCE, farmAt, isProtectedFarmKind } from '../types/Foraging.js';
import { TUNING } from '../config/tuning.js';

// ─────────────────────────────────────────────
// 시드 PRNG (mulberry32) — 시간 시드 재현용
// ─────────────────────────────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 채집 스팟 롤링 시드 — 맵 × 시각(시간 단위). 같은 시간대엔 같은 스팟 배치 */
export function forageSeed(mapKey: string, epochMs: number): number {
  let h = 2166136261;
  for (let i = 0; i < mapKey.length; i++) h = Math.imul(h ^ mapKey.charCodeAt(i), 16777619);
  const hourSlot = Math.floor(epochMs / (TUNING.forage.respawnMinutes * 60_000));
  return (h ^ Math.imul(hourSlot, 2654435761)) >>> 0;
}

// ─────────────────────────────────────────────
// 환경 컨텍스트 · 안전 판정
// ─────────────────────────────────────────────

export interface ForageEnvContext {
  month: number;
  isNight: boolean;
  windSpeedMs: number;
  waveHeightM: number;
  /** 현재 조위 / 만조 조위 (0~1 — 낮을수록 간조) */
  tideLevel01: number;
  hasAdvancedLicense: boolean;
}

export interface ForageSafety {
  allowed: boolean;
  /** 진입 불가 사유 (풍속·파고) */
  danger?: string;
  /** 진입은 되나 경고 (너울·낮·만조) */
  warning?: string;
  /** 갯바위 미끄러짐 위험 배율 (너울) */
  slipChance: number;
}

/** 실황 풍속·파고·조위로 채집 가능 여부 — canPerformNightHunting(레거시)과 같은 임계를 TUNING으로 */
export function forageSafety(ctx: ForageEnvContext): ForageSafety {
  const t = TUNING.forage;
  if (ctx.windSpeedMs > t.maxWindMps) {
    return { allowed: false, danger: `풍속 ${ctx.windSpeedMs.toFixed(0)}m/s — 해루질 위험 (${t.maxWindMps}m/s 초과)`, slipChance: 1 };
  }
  if (ctx.waveHeightM > t.maxWaveM) {
    return { allowed: false, danger: `파고 ${ctx.waveHeightM.toFixed(1)}m — 갯바위·조간대 접근 위험 (${t.maxWaveM}m 초과)`, slipChance: 1 };
  }
  let warning: string | undefined;
  let slipChance = t.slipChanceBase;
  if (ctx.waveHeightM >= t.slipWaveM) {
    warning = `너울 ${ctx.waveHeightM.toFixed(1)}m — 갯바위 미끄러짐 주의`;
    slipChance = t.slipChanceSwell;
  } else if (!ctx.isNight) {
    warning = '낮에는 야행성 생물이 숨는다 — 야간(일몰 후)이 적기';
  } else if (ctx.tideLevel01 > 0.7) {
    warning = '조위가 높다 — 간조 전후가 적기';
  }
  return { allowed: true, warning, slipChance };
}

// ─────────────────────────────────────────────
// 생물 ↔ 스팟 종류 · 도구
// ─────────────────────────────────────────────

/** 생물이 나올 수 있는 스팟 종류 — DB `spotKinds` 우선, 없으면 서식 스팟 타입으로 추론 */
export function creatureSpotKinds(c: ShoreCreature): ForageSpotKind[] {
  if (c.spotKinds && c.spotKinds.length) return c.spotKinds;
  const out = new Set<ForageSpotKind>();
  if (c.habitatSpotTypes.includes('rocky_shore')) { out.add('rock_shore'); out.add('tidepool'); }
  if (c.habitatSpotTypes.includes('breakwater')) { out.add('armor_foot'); out.add('harbor_wall'); }
  return [...out];
}

/** 허용 도구 — DB `tools` 우선, 없으면 카테고리 기본 */
export function creatureTools(c: ShoreCreature): ForageTool[] {
  if (c.tools && c.tools.length) return c.tools;
  switch (c.category) {
    case 'cephalopod': return ['net', 'gaff'];
    case 'crustacean': return ['tongs', 'net', 'hand'];
    case 'echinoderm': return ['tongs'];
    default: return ['tongs', 'hand'];
  }
}

export const FORAGE_TOOL_LABEL: Record<ForageTool, string> = {
  hand: '맨손', tongs: '집게', net: '뜰채', gaff: '갈고리',
};

/** 보유 도구 중 이 생물에 쓸 수 있는 가장 좋은 도구 (없으면 undefined). 맨손은 항상 후보 */
export function pickForageTool(c: ShoreCreature, owned: ForageTool[]): ForageTool | undefined {
  const allowed = creatureTools(c);
  for (const t of allowed) if (t !== 'hand' && owned.includes(t)) return t;
  return allowed.includes('hand') ? 'hand' : undefined;
}

/** 홀드 시간(ms) — 도구가 맞으면 짧고, 맨손·문어는 길다 */
export function forageHoldMs(c: ShoreCreature, tool: ForageTool): number {
  const t = TUNING.forage;
  let ms = t.holdMsBase;
  if (tool === 'hand') ms *= 1.35;
  if (c.category === 'cephalopod') ms *= 1.5;
  if (c.category === 'echinoderm' || c.id === 'haliotis_discus') ms *= 1.2;
  return Math.round(ms);
}

// ─────────────────────────────────────────────
// 스팟 롤링
// ─────────────────────────────────────────────

export interface RollForageOpts {
  seed: number;
  month: number;
  isNight: boolean;
  tideLevel01: number;
  hasAdvancedLicense: boolean;
  farms: FishFarm[];
  /** 상한 (밀도 계산 결과와 min) */
  maxSpots: number;
}

/**
 * 후보 타일에서 채집 스팟을 결정적으로 뽑는다.
 *  - 밀도 = 후보 100타일당 `spotsPerHundred` × 간조 보너스(조위 낮을수록 ↑).
 *  - 생물은 스팟 종류·금어기·야간 조건·면허로 필터 → 시장가 역가중(비싼 것이 드물게).
 */
export function rollForageSpots(candidates: ForageCandidate[], opts: RollForageOpts): ForageSpot[] {
  if (candidates.length === 0) return [];
  const rng = mulberry32(opts.seed);
  const t = TUNING.forage;
  const tideBonus = 1 + (1 - Math.max(0, Math.min(1, opts.tideLevel01))) * (t.lowTideBonus - 1);
  const target = Math.min(opts.maxSpots, Math.max(1, Math.round((candidates.length / 100) * t.spotsPerHundred * tideBonus)));

  const pool = SHORE_CREATURE_DATABASE.filter((c) => {
    if (c.closedSeasonMonths.includes(opts.month)) return false;
    if (c.discoveryTime === 'night' && !opts.isNight) return false;
    if (c.discoveryTime === 'day' && opts.isNight) return false;
    if (c.requiredLicense === 'shore_hunting_advanced' && !opts.hasAdvancedLicense) return false;
    return creatureSpotKinds(c).length > 0;
  });
  if (pool.length === 0) return [];

  // 후보 셔플 (Fisher-Yates, 시드)
  const idx = candidates.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }

  const spots: ForageSpot[] = [];
  const used = new Set<string>();
  for (const i of idx) {
    if (spots.length >= target) break;
    const cand = candidates[i]!;
    // 같은 타일·인접 1타일 중복 방지 (뭉침 억제)
    let near = false;
    for (let dr = -1; dr <= 1 && !near; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (used.has(`${cand.tx + dc},${cand.ty + dr}`)) { near = true; break; }
    }
    if (near) continue;
    const fit = pool.filter((c) => creatureSpotKinds(c).includes(cand.kind));
    if (fit.length === 0) continue;
    // 시장가 역가중 — 값비싼 생물일수록 드물게
    const weights = fit.map((c) => 1 / Math.sqrt(Math.max(3000, c.marketValuePerKg)));
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = rng() * sum;
    let pick = fit[0]!;
    for (let k = 0; k < fit.length; k++) { r -= weights[k]!; if (r <= 0) { pick = fit[k]!; break; } }
    const farm = farmAt(opts.farms, cand.tx + 0.5, cand.ty + 0.5);
    used.add(`${cand.tx},${cand.ty}`);
    spots.push({
      id: `fs_${cand.tx}_${cand.ty}`,
      tx: cand.tx, ty: cand.ty, kind: cand.kind,
      creatureId: pick.id, minLampLumens: pick.minLampLumens,
      farmName: farm?.name, farmKind: farm?.kind,
    });
  }
  return spots;
}

// ─────────────────────────────────────────────
// 채집 시도 · 조례 판정
// ─────────────────────────────────────────────

export type ForageOutcome = 'success' | 'escaped' | 'injured' | 'failed';

export interface ForageResult {
  outcome: ForageOutcome;
  creatureId: string;
  nameKo: string;
  sizeCm: number;
  weightG: number;
  /** 법정 크기 미달 — 방류 (수확 없음) */
  undersized: boolean;
  /** 맨손 부상 등 스태미나 손실 */
  staminaLoss: number;
  message: string;
}

/** 스킬 트리 보정 (122차) — escapeMult = 문어 도주 배율 · injuryChance = 맨손 부상 확률 배율(1 = 항상) */
export interface ForageMods { escapeMult?: number; injuryChance?: number }

export function attemptForage(c: ShoreCreature, tool: ForageTool, rng: () => number, mods: ForageMods = {}): ForageResult {
  const t = TUNING.forage;
  const allowed = creatureTools(c);
  const base: Omit<ForageResult, 'outcome' | 'message'> = {
    creatureId: c.id, nameKo: c.nameKo, sizeCm: 0, weightG: 0, undersized: false, staminaLoss: 0,
  };
  // 맨손 부상 (성게 가시·굴 껍질) — 채집 실패 + 스태미나 손실
  if (tool === 'hand' && c.handInjury && rng() < Math.max(0, Math.min(1, mods.injuryChance ?? 1))) {
    return { ...base, outcome: 'injured', staminaLoss: t.handInjuryStamina,
      message: `${c.nameKo}에 맨손이 찔렸다 — 집게가 필요하다 (HP -${t.handInjuryStamina})` };
  }
  if (!allowed.includes(tool)) {
    return { ...base, outcome: 'failed', message: `${c.nameKo}은(는) ${allowed.map((x) => FORAGE_TOOL_LABEL[x]).join('/')}(으)로만 잡을 수 있다` };
  }
  // 문어류 도주 — 뜰채가 갈고리보다 놓치기 쉽다
  if (c.category === 'cephalopod') {
    const esc = (tool === 'gaff' ? t.octopusEscape * 0.5 : t.octopusEscape) * Math.max(0, mods.escapeMult ?? 1);
    if (rng() < esc) return { ...base, outcome: 'escaped', message: `${c.nameKo}이(가) 바위틈으로 달아났다!` };
  }
  let p = t.baseSuccess;
  if (tool !== 'hand' && allowed[0] === tool) p += t.toolMatchBonus;
  if (rng() > Math.min(0.97, p)) return { ...base, outcome: 'failed', message: `${c.nameKo}을(를) 놓쳤다…` };

  // 크기·무게 — 법정 크기 기준 밴드 (미달 개체는 방류)
  const legal = c.minLegalSizeCm;
  const sizeCm = legal > 0 ? legal * (0.8 + rng() * 1.0) : 4 + rng() * 12;
  const undersized = legal > 0 && sizeCm < legal;
  const weightG = Math.round(sizeCm * (c.category === 'cephalopod' ? 60 : 14) + rng() * sizeCm * 10);
  return {
    ...base, outcome: 'success', sizeCm: Math.round(sizeCm * 10) / 10, weightG, undersized,
    message: undersized ? `${c.nameKo} ${sizeCm.toFixed(1)}cm — 법정 크기(${legal}cm) 미달, 방류` : `${c.nameKo} ${weightG}g 채집!`,
  };
}

/** 조례 위반 — 어촌계 어장(마을어장·협동양식장) 안에서 보호 5종 채집 */
export function isOrdinanceViolation(creatureId: string, farm: FishFarm | undefined): boolean {
  if (!farm || !isProtectedFarmKind(farm.kind)) return false;
  return GANGWON_FORAGE_ORDINANCE.protectedCreatureIds.includes(creatureId);
}

export interface EnforcementResult {
  caught: boolean;
  fineWon: number;
}

/**
 * 위반 회차마다 적발 롤 — 적발 시 압수 + 벌금(보유 재화 비율·상한).
 * @param mult 적발 확률 배수 (171차 — 자격 갱신을 연체 중이면 더 자주 걸린다)
 */
export function rollEnforcement(coins: number, rng: () => number, mult = 1): EnforcementResult {
  const t = TUNING.forage;
  if (rng() >= Math.min(1, t.enforcementChance * Math.max(0, mult))) return { caught: false, fineWon: 0 };
  const fine = Math.min(t.fineCapWon, Math.round(coins * t.fineRatio));
  return { caught: true, fineWon: Math.max(0, fine) };
}

/** 통발 포획물의 산란기 규제 — 도루묵 10~12월 (도내 전 수역) */
export function trapSeasonViolations(items: { creatureId: string; isFishSpecies?: boolean }[], month: number): string[] {
  const out: string[] = [];
  if (GANGWON_FORAGE_ORDINANCE.sandfishSpawnMonths.includes(month) && items.some((i) => i.isFishSpecies && i.creatureId === 'sandfish')) {
    out.push('sandfish');
  }
  return out;
}
