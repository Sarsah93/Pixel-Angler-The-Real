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
import type { ForageCandidate, ForageSpot, ForageSpotKind, ForageTool, FishFarm, ForageBehavior, ForageGameKind } from '../types/Foraging.js';
import { GANGWON_FORAGE_ORDINANCE, farmAt, isProtectedFarmKind } from '../types/Foraging.js';
import { TUNING, type ViolationKind } from '../config/tuning.js';
import { closedFor, resolveLegal } from '../rules/ClosedSeason.js';

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
    case 'annelid': return ['rake', 'hand'];
    default: return ['tongs', 'hand'];
  }
}

export const FORAGE_TOOL_LABEL: Record<ForageTool, string> = {
  hand: '맨손', tongs: '집게', net: '뜰채', gaff: '갈고리', rake: '갈퀴',
};

/** 224차 — 사는 모양(DB `behavior` 우선, 없으면 카테고리로) */
export function forageBehaviorOf(c: ShoreCreature): ForageBehavior {
  if (c.behavior) return c.behavior;
  switch (c.category) {
    case 'cephalopod': return 'crevice';
    case 'crustacean': return 'runner';
    case 'annelid': return 'buried';
    case 'bivalve': return 'buried';
    default: return 'crawler';
  }
}

/** 224차 — 사는 모양 → 손놀림 놀이 갈래 */
export function forageGameKindOf(c: ShoreCreature): ForageGameKind {
  switch (forageBehaviorOf(c)) {
    case 'runner': return 'snatch';
    case 'attached': return 'pry';
    case 'buried': return 'dig';
    case 'crevice': return 'pull';
    default: return 'pick';
  }
}

/**
 * 224차 — 물가 한 칸 얕은 물의 지금 수심(m). 물때 수위 0(간조)~1(만조)로 0.25~1.1m.
 * 1m 이상이면 장화로 들어갈 수 없다(사용자 지시 「수심 1m가 채 안 되는 곳만」 — 만조 무렵엔 닫힌다).
 */
export function shallowWaterDepthM(tideLevel01: number): number {
  return Math.round((0.25 + 0.85 * Math.max(0, Math.min(1, tideLevel01))) * 100) / 100;
}

/** 224차 — 동해(강원 · 경북) 지역인가 — 출현 배율(`eastSeaWeight`)을 건다 */
export function isEastSeaRegion(regionId: string): boolean {
  return /gangwon|sokcho|gangneung|pohang|gyeongbuk|uljin|donghae/.test(regionId);
}

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
  /** 224차 — 동해 지역이면 생물별 `eastSeaWeight`를 곱한다(0 = 안 나온다) */
  eastSea?: boolean;
  /** 227차 — 오늘 날짜(1~31) · 지역 id — 금어기를 날짜 단위 · 지역 규정(제주)으로 */
  day?: number;
  regionId?: string;
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
    if (closedFor(c, opts.month, opts.day, opts.regionId)) return false;
    if (c.absentMonths?.includes(opts.month)) return false;           // 224차 — 여름잠 · 추위
    if (opts.eastSea && (c.eastSeaWeight ?? 1) <= 0) return false;     // 224차 — 동해에 없는 종
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
    // 224차 — 얕은 물은 바닥이 맞아야 한다(모래 속 갯지렁이 · 바위 틈 문어)
    const fit = pool.filter((c) => creatureSpotKinds(c).includes(cand.kind)
      && (!c.substrate || !cand.substrate || cand.substrate === 'mixed' || cand.substrate === c.substrate));
    if (fit.length === 0) continue;
    // 시장가 역가중 — 값비싼 생물일수록 드물게 · 224차 동해 출현 배율
    const weights = fit.map((c) => (opts.eastSea ? (c.eastSeaWeight ?? 1) : 1) / Math.sqrt(Math.max(3000, c.marketValuePerKg)));
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
export interface ForageMods {
  escapeMult?: number;
  injuryChance?: number;
  /** 205차 — 성공 확률 배율(해루질 간조 시간창 `forageTideMult`) */
  successMult?: number;
}

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
  p *= Math.max(0, mods.successMult ?? 1);
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

/**
 * 224차 — 손놀림 놀이에 이긴 뒤의 수확(크기 · 무게 · 법정 크기 미달). `attemptForage`의 뒷부분을 떼어 냈다.
 * 갯지렁이처럼 미끼로 들어가는 것은 마리로 센다(크기는 몸길이).
 */
export interface ForageHarvest extends Pick<ForageResult, 'sizeCm' | 'weightG' | 'undersized'> {
  /** 229차 — 게류는 배딱지로 암수를 가린다(그 밖은 undefined) */
  sex?: 'M' | 'F';
  /** 229차 — 알을 밴(외포란) 암컷 — 자동 방생 대상 */
  berried?: boolean;
}

/** 229차 — 게류(갑각류 중 게) — 암수 · 외포란이 있는 생물 */
export function isCrabCreature(c: Pick<ShoreCreature, 'id' | 'category'>): boolean {
  return c.category === 'crustacean' && /portunus|charybdis|hemigrapsus/.test(c.id);
}

/** 229차 — 꽃게류 외포란 철(4~9월) · 그 철 암컷의 외포란 확률 */
export const BERRIED_MONTHS: readonly number[] = [4, 5, 6, 7, 8, 9];
export const BERRIED_CHANCE = 0.35;

export function rollForageHarvest(c: ShoreCreature, rng: () => number, regionId?: string, month?: number): ForageHarvest {
  const legal = resolveLegal(c, regionId).minLegalSizeCm;   // 227차 — 지역 규정(제주 전복 10cm 등)
  const sizeCm = legal > 0 ? legal * (0.8 + rng() * 1.0)
    : c.category === 'annelid' ? 8 + rng() * 14
    : c.id === 'ligia_exotica' ? 2.5 + rng() * 2
    : 4 + rng() * 12;
  const undersized = legal > 0 && sizeCm < legal;
  const perCm = c.category === 'cephalopod' ? 60 : c.category === 'annelid' ? 0.6 : c.id === 'ligia_exotica' ? 0.4 : 14;
  const weightG = Math.max(1, Math.round(sizeCm * perCm + rng() * sizeCm * (perCm < 5 ? 0.3 : 10)));
  const out: ForageHarvest = { sizeCm: Math.round(sizeCm * 10) / 10, weightG, undersized };
  if (isCrabCreature(c)) {
    out.sex = rng() < 0.5 ? 'M' : 'F';
    // 쫄장게(미끼)는 작아 외포란을 가리지 않는다 — 꽃게 · 민꽃게만
    out.berried = out.sex === 'F' && c.id !== 'hemigrapsus_sanguineus' && month !== undefined && BERRIED_MONTHS.includes(month) && rng() < BERRIED_CHANCE;
  }
  return out;
}

/** 224차 — 다침 판정 결과(맨손 · 장갑) */
export interface ForageInjury {
  injured: boolean;
  /** 다쳐서 놓쳤다(성게 가시 · 게 집게에 손을 뗐다) */
  dropped: boolean;
  /** 상태이상 — 가시 = 생물중독 · 그 외 = 출혈 */
  status?: 'bleed' | 'bio_poison';
}

/**
 * 224차 — 손으로 잡을 때 다치는가. 장갑을 끼면 덜 다치고, 다쳐도 놓치지 않는다(가시가 긴 성게만 예외).
 *  - 맨손(장갑 없이) + 다치는 생물: 55% 다침 · 다치면 놓친다.
 *  - 장갑: 12% 다침 · 성게만 놓친다.
 *  - 도구(집게 · 갈고리 · 뜰채 · 갈퀴)는 손이 닿지 않는다.
 */
export function forageInjuryRoll(c: ShoreCreature, tool: ForageTool, gloves: boolean, rng: () => number, injuryMult = 1): ForageInjury {
  if (tool !== 'hand' || !c.handInjury) return { injured: false, dropped: false };
  // 성게(가시)는 맨손이면 열에 일곱 넘게 찔린다(225차 사용자 지시 75%) — 장갑도 가시가 뚫고 들어온다
  const spiny = c.category === 'echinoderm' && c.id !== 'stichopus_japonicus';
  const base = spiny ? (gloves ? 0.25 : 0.75) : (gloves ? 0.12 : 0.55);
  const p = Math.min(1, base * Math.max(0, injuryMult));
  if (rng() >= p) return { injured: false, dropped: false };
  return { injured: true, dropped: !gloves || spiny, status: spiny ? 'bio_poison' : 'bleed' };
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
 * 위반 종류별 벌금 — **min(한도, max(기본 금액, 가진 돈 × 비율))** (`TUNING.law.fines`).
 * 가진 돈이 적으면 기본 금액, 많으면 비율만큼, 아무리 많아도 한도까지. 돈은 여기서 깎지 않는다.
 */
export function enforcementFineWon(coins: number, kind: ViolationKind = 'ordinance'): number {
  const r = TUNING.law.fines[kind];
  const have = Number.isFinite(coins) ? Math.max(0, coins) : 0;
  return Math.max(0, Math.round(Math.min(r.capWon, Math.max(r.baseWon, have * r.ratio))));
}

/**
 * 위반 회차마다 적발 롤 — 적발 시 압수 + 벌금(`enforcementFineWon`).
 * 가진 돈이 모자라면 호출부가 「파산」으로 잇는다(`GameState.addCoins`가 false → `host.bankrupt`).
 * @param mult 적발 확률 배수 (171차 — 자격 갱신을 연체 중이면 더 자주 걸린다)
 * @param kind 위반 종류 — 벌금 등급을 고른다(기본 = 조례 위반 채취 · 포획)
 */
export function rollEnforcement(coins: number, rng: () => number, mult = 1, kind: ViolationKind = 'ordinance'): EnforcementResult {
  if (rng() >= Math.min(1, TUNING.forage.enforcementChance * Math.max(0, mult))) return { caught: false, fineWon: 0 };
  return { caught: true, fineWon: enforcementFineWon(coins, kind) };
}

/** 통발 포획물의 산란기 규제 — 도루묵 10~12월 (도내 전 수역) */
export function trapSeasonViolations(items: { creatureId: string; isFishSpecies?: boolean }[], month: number): string[] {
  const out: string[] = [];
  if (GANGWON_FORAGE_ORDINANCE.sandfishSpawnMonths.includes(month) && items.some((i) => i.isFishSpecies && i.creatureId === 'sandfish')) {
    out.push('sandfish');
  }
  return out;
}
