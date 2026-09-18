/**
 * @file CookingSim.ts
 * @description 불요리 조리 시뮬 + 맛 별 5개 판정 (154차 — `.agents/FIRE_COOKING_SPEC.md` §5·§6·§7)
 *
 * 순수 스텝 시뮬 — 씬은 `stepCook(state, …, dtSec)`만 부른다(wall-clock을 `TUNING.cook.timeScale`로 환산해서).
 * 판정은 전부 여기(간·온도·식감·신선도·완성도) — 클라이언트는 표시만 한다.
 *
 * 열 모델: `dT = (W − k·(T−주변)) · dt ÷ (m·c + 열관성)`. 물이 있으면 100°C 캡, 초과 에너지는 증발.
 *  · 약불(0.25) = 평형 73~87°C로 끓지 않는 **보온** → 졸지도 타지도 않는다 = 걸어두기 안전(과조리는 느리게 진행).
 *  · 강불(1.0) = 분당 30g 넘게 졸아든다 → 물 800ml는 시뮬 25분(실시간 4분) 뒤 졸아붙는다.
 *  · 팬(물 없음) = 중불 평형 ≈ 175°C(구이 적정대) · 강불 ≈ 250°C(탄다).
 */

import type {
  CookContent, CookSessionState, CookwareDef, DishData, DishScores, DishStars, FireRecipeDef,
  HeatLevel, HeatSourceDef, RecipeIngredientReq, SaltLabel, SugarLabel,
} from '../types/Cooking.js';
import { getCookIngredient } from '../db-schema/CookIngredientDatabase.js';
import { HEAT_FRAC } from '../db-schema/CookwareDatabase.js';
import { TUNING } from '../config/tuning.js';

const SPECIFIC_HEAT = 4.0;      // J/gK (물·채소·살 평균)
const LATENT_HEAT = 2260;       // J/g (증발)
const EVENT_KEEP = 12;

// ─────────────────────────────────────────────
// 세션 생성 · 재료 투입 · 조작
// ─────────────────────────────────────────────

export function createCookSession(recipeId: string, cookwareId: string, ambientC = 20): CookSessionState {
  return {
    recipeId, cookwareId, heat: 0, tempC: ambientC, elapsedSec: 0, boiling: false, boilAtSec: null,
    mainCookedAtSec: null, doneAtSec: null, contents: [], waterMl: 0, evaporatedMl: 0,
    lastFlipSec: 0, flips: 0, inBandSec: 0, outBandSec: 0, stageNow: 0, status: 'idle', events: [], offHeatAtSec: null,
  };
}

function pushEvent(s: CookSessionState, msg: string): void {
  s.events.push(msg);
  if (s.events.length > EVENT_KEEP) s.events.splice(0, s.events.length - EVENT_KEEP);
}

/** 레시피에서 이 재료를 받는 요구 항목 (택1 그룹 포함) */
export function reqFor(recipe: FireRecipeDef, ing: string): { req: RecipeIngredientReq; required: boolean } | null {
  for (const r of recipe.required) if (matchReq(r, ing)) return { req: r, required: true };
  for (const r of recipe.optional) if (matchReq(r, ing)) return { req: r, required: false };
  return null;
}
function matchReq(r: RecipeIngredientReq, ing: string): boolean {
  return Array.isArray(r.ing) ? r.ing.includes(ing) : r.ing === ing;
}

export function unitsOf(s: CookSessionState, ing: string): number {
  return s.contents.filter((c) => c.ing === ing).reduce((a, c) => a + c.units, 0);
}

export interface AddCheck { ok: boolean; reasonKo?: string; reasonEn?: string }

/**
 * 투입 가능 판정 — 레시피에 없는 재료는 거부(창작 요리 배제), 상한 초과 거부, 냄비 용량 초과 거부,
 * 팬 전용 재료(식용유)는 석쇠에 거부.
 */
export function canAddIngredient(
  s: CookSessionState, recipe: FireRecipeDef, cookware: CookwareDef, ing: string, units: number,
): AddCheck {
  const def = getCookIngredient(ing);
  if (!def) return { ok: false, reasonKo: '조리 재료가 아닙니다', reasonEn: 'Not a cooking ingredient' };
  const hit = reqFor(recipe, ing);
  if (!hit) return { ok: false, reasonKo: `${recipe.nameKo}에는 넣지 않는 재료입니다`, reasonEn: `Not used in ${recipe.nameEn}` };
  if (hit.req.onlyWith && hit.req.onlyWith !== cookware.kind) {
    return { ok: false, reasonKo: `${def.nameKo}은(는) ${hit.req.onlyWith === 'pan' ? '팬' : '이 용기'}에서만 씁니다`, reasonEn: `${def.nameEn} is only for a ${hit.req.onlyWith}` };
  }
  const have = unitsOf(s, ing);
  if (have + units > hit.req.max + 1e-6) {
    // 아직 하나도 안 넣었는데 넘친다 = 한 마리가 너무 크다(1.6kg 광어를 지리 냄비에) — "이미 충분"은 거짓말이다
    if (have <= 0 && def.unit === 'g') {
      return { ok: false, reasonKo: `${def.nameKo}이(가) 너무 큽니다 (한도 ${fmtUnits(def.unit, hit.req.max)}) — 손질해서 필렛·서더리로 넣으세요`, reasonEn: `${def.nameEn} is too big (limit ${fmtUnits(def.unit, hit.req.max)}) — butcher it and add fillets or the frame` };
    }
    return { ok: false, reasonKo: `${def.nameKo}은(는) 이미 충분합니다 (한도 ${fmtUnits(def.unit, hit.req.max)})`, reasonEn: `Enough ${def.nameEn} already (limit ${fmtUnits(def.unit, hit.req.max)})` };
  }
  if (s.status === 'burnt') return { ok: false, reasonKo: '이미 탔습니다 — 내려서 정리하세요', reasonEn: 'Already burnt — take it off' };
  if (cookware.capacityMl) {
    // ⚖ 고형물은 물에 잠긴 만큼만 부피를 차지한다(생선·무는 수면 위로 솟는다) — 1:1로 세면 코펠(1.8L)에
    //   38cm 감성돔 한 마리 + 무 + 물 3컵이 들어가지 않는다(실측 1,950 > 1,800). `solidVolumeFrac`.
    const solidMl = def.waterMlPerUnit ? def.waterMlPerUnit * units : def.massGPerUnit * units * TUNING.cook.solidVolumeFrac;
    const vol = s.waterMl + solidsG(s) * TUNING.cook.solidVolumeFrac + solidMl;
    if (vol > cookware.capacityMl) return { ok: false, reasonKo: '용기 용량을 넘습니다', reasonEn: 'Exceeds the pot capacity' };
  }
  return { ok: true };
}

export function fmtUnits(unit: CookIngredientUnit, n: number): string {
  if (unit === 'g') return `${Math.round(n)}g`;
  if (unit === 'spoon') return `${n}큰술`;
  if (unit === 'cup') return `${n}컵`;
  return `${n}개`;
}
type CookIngredientUnit = 'g' | 'ea' | 'spoon' | 'cup';

export function addIngredient(
  s: CookSessionState, ing: string, units: number, freshness01: number, srcItemId?: string, weightG?: number,
): void {
  const def = getCookIngredient(ing);
  if (!def) return;
  if (def.waterMlPerUnit) s.waterMl += def.waterMlPerUnit * units;
  // 같은 재료는 같은 단계에 넣었으면 합친다(양념 스테퍼 · 채소 여러 개)
  const same = s.contents.find((c) => c.ing === ing && c.addedStage === s.stageNow && Math.abs(c.addedAtSec - s.elapsedSec) < 20);
  if (same && def.unit !== 'g') { same.units += units; same.freshness01 = Math.min(same.freshness01, freshness01); }
  else {
    s.contents.push({ ing, units, addedAtSec: s.elapsedSec, addedStage: s.stageNow, doneness: 0, burnt: 0, freshness01, srcItemId, weightG });
  }
  if (s.status === 'idle') s.status = 'cooking';
  pushEvent(s, `${def.nameKo} ${fmtUnits(def.unit, units)} 투입`);
}

export function setHeat(s: CookSessionState, level: HeatLevel): void {
  if (s.heat === level) return;
  s.heat = level;
  if (level === 0 && s.status !== 'idle') s.offHeatAtSec = s.elapsedSec;
  if (level > 0) s.offHeatAtSec = null;
}

/** 뒤집기/젓기 — 구이·볶음·죽의 아래면 탐을 리셋 */
export function flip(s: CookSessionState): void {
  s.lastFlipSec = s.elapsedSec;
  s.flips += 1;
}

// ─────────────────────────────────────────────
// 스텝
// ─────────────────────────────────────────────

export interface CookEnv {
  /** 풍속 (m/s — 현장만. 집은 0) */
  windMps: number;
  ambientC: number;
  /** 연료가 있는가 (없으면 불이 꺼진 것으로 본다) */
  fuelOk: boolean;
}

export interface CookStepResult {
  /** 이번 스텝 연료 소모 (강불 기준 분) */
  fuelUsedMin: number;
  /** 새로 생긴 사건 */
  events: string[];
}

function solidsG(s: CookSessionState): number {
  return s.contents.reduce((a, c) => {
    const d = getCookIngredient(c.ing);
    if (!d || d.waterMlPerUnit) return a;
    return a + (c.weightG ?? d.massGPerUnit * c.units);
  }, 0);
}

/** 화력(W) — 바람 취약도 반영 */
export function effectiveHeatW(src: HeatSourceDef, level: HeatLevel, windMps: number): number {
  const wind = Math.max(0, Math.min(1, (windMps - TUNING.cook.windCalmMps) / TUNING.cook.windSpanMps));
  return src.maxHeatW * HEAT_FRAC[level] * (1 - src.windSensitivity * wind);
}

export function stepCook(
  s: CookSessionState, recipe: FireRecipeDef, cookware: CookwareDef, src: HeatSourceDef, dtSec: number, env: CookEnv,
): CookStepResult {
  const before = s.events.length;
  const hasWater = s.waterMl > 0;
  const heatOn = s.heat > 0 && env.fuelOk;
  const W = heatOn ? effectiveHeatW(src, s.heat, env.windMps) : 0;
  const k = TUNING.cook.lossWPerK * cookware.lossMult;
  const mass = s.waterMl + solidsG(s);
  const capJK = Math.max(60, mass * SPECIFIC_HEAT + cookware.thermalMassJK);
  // 빈 용기(내용물 0)는 열관성만 — 예열이 빠르다
  const loss = k * (s.tempC - env.ambientC);
  let net = W - loss;
  const cap = hasWater ? 100 : cookware.maxTempC;
  if (s.tempC >= cap - 0.01 && net > 0) {
    // 캡에 걸림 — 물이 있으면 증발, 없으면 그대로 캡
    if (hasWater) {
      const evapG = (net * dtSec) / LATENT_HEAT;
      s.waterMl = Math.max(0, s.waterMl - evapG);
      s.evaporatedMl += evapG;
      if (s.waterMl <= 0) pushEvent(s, '국물이 다 졸아붙었다!');
    }
    s.tempC = cap;
  } else {
    s.tempC = Math.min(cap, Math.max(env.ambientC, s.tempC + (net * dtSec) / capJK));
  }
  s.elapsedSec += dtSec;

  // 끓음 / 달궈짐 트리거
  const boilC = cookware.kind === 'pot' ? TUNING.cook.boilC : TUNING.cook.panHotC;
  if (!s.boiling && s.tempC >= boilC) {
    s.boiling = true;
    if (s.boilAtSec === null) { s.boilAtSec = s.elapsedSec; pushEvent(s, cookware.kind === 'pot' ? '끓기 시작했다' : '충분히 달궈졌다'); }
  } else if (s.boiling && s.tempC < boilC - 8) {
    s.boiling = false;
  }

  // 익음 · 탐
  const sinceFlip = s.elapsedSec - s.lastFlipSec;
  const needFlip = recipe.flipEverySec !== undefined && sinceFlip > recipe.flipEverySec;
  // 졸아붙음 = 물을 부었다가 다 날아간 뒤 — 물을 아직 안 부은 볶기 단계(죽·볶음 시작)는 온도로만 탄다
  const dryPot = cookware.kind === 'pot' && s.waterMl <= 0 && s.evaporatedMl > 0 && heatOn;
  for (const c of s.contents) {
    const d = getCookIngredient(c.ing);
    if (!d || d.cookSec <= 1) continue;
    if (s.tempC >= d.cookMinC) {
      const rate = Math.min(TUNING.cook.rateCap, ((s.tempC - d.cookMinC) / Math.max(1, 100 - d.cookMinC)) ** TUNING.cook.rateExp);
      c.doneness += (rate / d.cookSec) * dtSec;
    }
    let burnRate = 0;
    if (s.tempC > d.burnC) burnRate += 1 / TUNING.cook.burnSec;
    if (needFlip && s.tempC > TUNING.cook.flipBurnC && heatOn) burnRate += 1 / (TUNING.cook.burnSec * 1.5);
    if (dryPot) burnRate += 1 / TUNING.cook.dryBurnSec;
    if (burnRate > 0) c.burnt = Math.min(1, c.burnt + burnRate * dtSec);
  }

  // 단계 전이 — 주재료 익음
  const mains = s.contents.filter((c) => isMainRole(recipe, c.ing));
  if (s.mainCookedAtSec === null && mains.length > 0 && mains.every((c) => c.doneness >= 1)) {
    s.mainCookedAtSec = s.elapsedSec;
    pushEvent(s, '주재료가 익었다');
  }
  s.stageNow = stageNowOf(s, recipe);

  // 적정대 관리 — 조리 중(완성 전)에만 센다. 완성 뒤 약불 보온은 화력 관리 실패가 아니다(걸어두기 규칙).
  if (heatOn && s.contents.length > 0 && s.doneAtSec === null) {
    const [lo, hi] = recipe.tempBand;
    if (s.tempC >= lo - 1 && s.tempC <= hi + 1) s.inBandSec += dtSec;
    // 아래쪽 이탈은 **한 번 밴드에 들어온 뒤**부터 센다 — 예열 구간은 실패가 아니다
    else if (s.tempC > hi + 1 || (s.inBandSec > 0 && s.tempC < lo - 1)) s.outBandSec += dtSec;
  }

  // 완성 · 탐 상태
  if (s.status === 'cooking' && isReady(s, recipe)) {
    if (s.doneAtSec === null) { s.doneAtSec = s.elapsedSec; pushEvent(s, '완성할 수 있다 — 불을 끄고 내리자'); }
    s.status = 'done';
  }
  if (s.status !== 'burnt' && mains.some((c) => c.burnt >= TUNING.cook.burntThreshold)) {
    s.status = 'burnt';
    pushEvent(s, '탔다…');
  }
  if (s.status === 'done' && s.doneAtSec !== null && heatOn && s.elapsedSec - s.doneAtSec > TUNING.cook.overcookWarnSec) {
    const last = s.events[s.events.length - 1];
    if (last !== '너무 오래 끓고 있다') pushEvent(s, '너무 오래 끓고 있다');
  }

  const fuelUsedMin = heatOn ? (dtSec / 60) * HEAT_FRAC[s.heat] : 0;
  return { fuelUsedMin, events: s.events.slice(before) };
}

function isMainRole(recipe: FireRecipeDef, ing: string): boolean {
  const hit = reqFor(recipe, ing);
  return !!hit && (hit.req.role === 'main' || hit.req.role === 'grain');
}

function stageNowOf(s: CookSessionState, recipe: FireRecipeDef): number {
  let st = 0;
  recipe.stages.forEach((sd, i) => {
    if (sd.trigger === 'start') st = Math.max(st, i);
    else if (sd.trigger === 'boil' && s.boilAtSec !== null) st = Math.max(st, i);
    else if (sd.trigger === 'mainCooked' && s.mainCookedAtSec !== null) st = Math.max(st, i);
    else if (sd.trigger === 'final' && s.mainCookedAtSec !== null && s.elapsedSec - s.mainCookedAtSec >= TUNING.cook.finalStageAfterSec) st = Math.max(st, i);
  });
  return st;
}

/** 완성 판정 — 주재료 익음 / 졸아듦(조림) / 전부 익음 */
export function isReady(s: CookSessionState, recipe: FireRecipeDef): boolean {
  const mains = s.contents.filter((c) => isMainRole(recipe, c.ing));
  if (mains.length === 0) return false;
  const mainOk = mains.every((c) => c.doneness >= 1);
  if (recipe.doneWhen === 'mainCooked') return mainOk;
  if (recipe.doneWhen === 'reduced') {
    const water0 = s.waterMl + s.evaporatedMl;
    return mainOk && water0 > 0 && s.waterMl <= water0 * TUNING.cook.reduceRatio;
  }
  return s.contents.filter((c) => { const d = getCookIngredient(c.ing); return d && d.cookSec > 1; }).every((c) => c.doneness >= 1);
}

// ─────────────────────────────────────────────
// 판정 (간 · 온도 · 식감 · 신선도 · 완성도)
// ─────────────────────────────────────────────

const gauss = (x: number, mu: number, sigma: number): number => Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export interface CompositionCheck {
  missing: string[];
  oneOfViolations: number;
  extraKinds: number;
  optionalUsed: number;
}

/** 필수 충족·택1·부가 종 수 — 완성 게이트와 완성도 산식이 공유 */
export function checkComposition(s: CookSessionState, recipe: FireRecipeDef, cookware: CookwareDef): CompositionCheck {
  const missing: string[] = [];
  let oneOfViolations = 0;
  for (const r of recipe.required) {
    if (r.onlyWith && r.onlyWith !== cookware.kind) continue;
    const ids = Array.isArray(r.ing) ? r.ing : [r.ing];
    const present = ids.filter((id) => unitsOf(s, id) > 0);
    if (present.length === 0 || ids.reduce((a, id) => a + unitsOf(s, id), 0) < r.min - 1e-6) {
      missing.push(ids.map((id) => getCookIngredient(id)?.nameKo ?? id).join('/'));
    }
    if (Array.isArray(r.ing) && present.length > 1) oneOfViolations += present.length - 1;
  }
  let extraKinds = 0, optionalUsed = 0;
  for (const r of recipe.optional) {
    const ids = Array.isArray(r.ing) ? r.ing : [r.ing];
    const present = ids.filter((id) => unitsOf(s, id) > 0);
    if (present.length > 0) { extraKinds += 1; optionalUsed += 1; }
    if (Array.isArray(r.ing) && present.length > 1) oneOfViolations += present.length - 1;
  }
  return { missing, oneOfViolations, extraKinds, optionalUsed };
}

export interface SeasonEval { score: number; saltPct: number; sugarSpoons: number; saltLabel: SaltLabel; sugarLabel: SugarLabel }

export function evalSeason(s: CookSessionState, recipe: FireRecipeDef): SeasonEval {
  let saltG = 0, sugarG = 0;
  for (const c of s.contents) {
    const d = getCookIngredient(c.ing);
    if (!d) continue;
    saltG += d.saltGPerUnit * c.units;
    sugarG += d.sugarGPerUnit * c.units;
  }
  const denom = Math.max(50, s.waterMl + solidsG(s));
  const saltPct = (saltG / denom) * 100;
  const sugarSpoons = sugarG / 12;
  const saltScore = gauss(saltPct, recipe.targetSaltPct, TUNING.cook.saltSigmaPct);
  const sugarScore = gauss(sugarSpoons - recipe.targetSugarSpoons, 0, TUNING.cook.sugarSigmaSpoons);
  const saltLabel: SaltLabel = saltPct < recipe.targetSaltPct * 0.72 ? 'bland' : saltPct > recipe.targetSaltPct * 1.38 ? 'salty' : 'ok';
  const diff = sugarSpoons - recipe.targetSugarSpoons;
  const sugarLabel: SugarLabel = diff > 0.8 ? 'sweet' : (recipe.targetSugarSpoons > 0 && diff < -0.8) ? 'flat' : 'ok';
  // 내용물이 아직 없으면 판정 자체가 무의미 — 0
  const score = s.contents.length === 0 ? 0 : clamp01(0.75 * saltScore + 0.25 * sugarScore);
  return { score, saltPct, sugarSpoons, saltLabel, sugarLabel };
}

export function evalTexture(s: CookSessionState, recipe: FireRecipeDef): number {
  let wsum = 0, acc = 0;
  for (const c of s.contents) {
    const d = getCookIngredient(c.ing);
    // 양념(마늘·생강)은 식감 판정에서 뺀다 — 익힘 정도가 아니라 향이다
    if (!d || d.cookSec <= 1 || d.kind === 'season') continue;
    const hit = reqFor(recipe, c.ing);
    const role = hit?.req.role ?? d.kind;
    const w = role === 'main' || role === 'grain' ? 0.6 : role === 'finish' ? 0.1 : 0.15;
    const dn = c.doneness;
    // 플래토 0.9~1.6 = 만점 · 덜 익음은 가파르게 · 과조리는 3.4까지 완만하게
    //  (실측: 매운탕 완성 뒤 약불 보온 20분(실시간 3.3분)까지 5별, 30분부터 식감 별을 잃는다)
    let sc: number;
    if (dn < 0.75) sc = 0.3 * (dn / 0.75);
    else if (dn < 0.9) sc = 0.3 + 0.7 * ((dn - 0.75) / 0.15);
    else if (dn <= 1.6) sc = 1;
    else if (dn <= 3.4) sc = 1 - (dn - 1.6) / 1.8;
    else sc = 0;
    sc *= 1 - c.burnt;
    acc += sc * w; wsum += w;
  }
  return wsum === 0 ? 0 : clamp01(acc / wsum);
}

export function evalFresh(s: CookSessionState, recipe: FireRecipeDef): number {
  let minMain = 1, minVeg = 1, hasMain = false, hasVeg = false;
  for (const c of s.contents) {
    const hit = reqFor(recipe, c.ing);
    const role = hit?.req.role;
    if (role === 'main' || role === 'grain') { minMain = Math.min(minMain, c.freshness01); hasMain = true; }
    else if (role === 'veg' || role === 'base' || role === 'finish') { minVeg = Math.min(minVeg, c.freshness01); hasVeg = true; }
  }
  if (!hasMain) return 0;
  return clamp01(hasVeg ? 0.75 * minMain + 0.25 * minVeg : minMain);
}

export function evalTempAt(tempC: number, recipe: FireRecipeDef): number {
  return clamp01((tempC - 40) / Math.max(1, recipe.servingC - 40));
}

export interface FinishEval { score: number; comp: number; order: number; heatCtl: number }

export function evalFinish(
  s: CookSessionState, recipe: FireRecipeDef, cookware: CookwareDef, others: { season: number; temp: number; texture: number; fresh: number }, skillRank: number,
): FinishEval {
  const cc = checkComposition(s, recipe, cookware);
  // 구성 — 택1 위반·종류 초과는 부가 보너스로 상쇄되지 않게 페널티를 보너스 상한(0.18)보다 크게 둔다
  const comp = clamp01(1 - 0.25 * cc.missing.length - 0.25 * cc.oneOfViolations
    - 0.15 * Math.max(0, cc.extraKinds - recipe.maxExtraKinds) + Math.min(0.18, 0.06 * cc.optionalUsed));
  let diffSum = 0, n = 0;
  for (const c of s.contents) {
    const hit = reqFor(recipe, c.ing);
    if (!hit) continue;
    diffSum += Math.abs(c.addedStage - hit.req.stage); n += 1;
  }
  const order = n === 0 ? 0 : clamp01(1 - 0.2 * (diffSum / n));
  const total = s.inBandSec + s.outBandSec;
  const heatCtl = total < 30 ? 0.6 : clamp01(s.inBandSec / total);
  // 구성은 곱한다 — 재료를 잘못 넣으면 순서·화력이 완벽해도 완성도가 그만큼 깎인다
  let score = clamp01(comp * (0.5 + 0.25 * order + 0.25 * heatCtl) * (1 + TUNING.cook.skillPerRank * skillRank));
  if (Math.min(others.season, others.temp, others.texture, others.fresh) < TUNING.cook.finishGateMin) score = Math.min(score, TUNING.cook.finishCap);
  const burnt = s.contents.some((c) => c.burnt >= TUNING.cook.burntThreshold);
  if (burnt) score *= 0.3;
  return { score, comp, order, heatCtl };
}

/** 라이브 미리보기 — 지금 내리면 이 점수 */
export function evaluateSession(s: CookSessionState, recipe: FireRecipeDef, cookware: CookwareDef, skillRank: number): DishScores & { seasonEval: SeasonEval; finishEval: FinishEval } {
  const seasonEval = evalSeason(s, recipe);
  const temp = evalTempAt(s.tempC, recipe);
  const texture = evalTexture(s, recipe);
  const fresh = evalFresh(s, recipe);
  const finishEval = evalFinish(s, recipe, cookware, { season: seasonEval.score, temp, texture, fresh }, skillRank);
  return { season: seasonEval.score, temp, texture, fresh, finish: finishEval.score, seasonEval, finishEval };
}

// ─────────────────────────────────────────────
// 완성 · 별점(시간 감쇠) · 값
// ─────────────────────────────────────────────

export function finishCook(
  s: CookSessionState, recipe: FireRecipeDef, cookware: CookwareDef,
  opts: { nowMs: number; skillRank: number; stoveKind: 'home' | 'field' },
): DishData {
  const ev = evaluateSession(s, recipe, cookware, opts.skillRank);
  const cc = checkComposition(s, recipe, cookware);
  const burnt = s.contents.some((c) => c.burnt >= TUNING.cook.burntThreshold);
  return {
    recipeId: recipe.id, cookedAtMs: opts.nowMs, tempAtDoneC: s.tempC,
    base: { season: ev.season, temp: ev.temp, texture: ev.texture, fresh: ev.fresh, finish: ev.finish },
    saltLabel: ev.seasonEval.saltLabel, sugarLabel: ev.seasonEval.sugarLabel,
    contents: mergeContents(s.contents), stoveKind: opts.stoveKind, cookwareId: cookware.id,
    burnt, servings: recipe.servings, skillRank: opts.skillRank, missingRequired: cc.missing.length,
  };
}

function mergeContents(cs: CookContent[]): { ing: string; units: number }[] {
  const m = new Map<string, number>();
  for (const c of cs) m.set(c.ing, (m.get(c.ing) ?? 0) + c.units);
  return [...m.entries()].map(([ing, units]) => ({ ing, units: Math.round(units * 100) / 100 }));
}

const STAR_W = { season: 0.25, temp: 0.15, texture: 0.25, fresh: 0.15, finish: 0.20 } as const;

/**
 * 조회 시점 별점 — 온도(τ 감쇠)·식감(시간당 감점)·신선도(아이템 신선도 배율)는 시간이 깎고,
 * 완성도는 넷을 다 얻어야 열린다(사용자 원문 "여기서 비로소 만점").
 * @param condMult 아이템 신선도 상태 배율 (신선 1 · 보통 0.7 · 나쁨 0.25 · 부패 0)
 */
export function dishStarsAt(dish: DishData, recipe: FireRecipeDef, nowMs: number, condMult = 1, ambientC = 20): DishStars {
  const minutes = Math.max(0, (nowMs - dish.cookedAtMs) / 60_000);
  const tempC = ambientC + (dish.tempAtDoneC - ambientC) * Math.exp(-minutes / Math.max(1, recipe.coolTauMin));
  const temp = dish.burnt ? Math.min(dish.base.temp, 0.3) : evalTempAt(tempC, recipe);
  const texture = clamp01(dish.base.texture - recipe.textureDecayPerHour * (minutes / 60));
  const fresh = clamp01(dish.base.fresh * condMult);
  const season = dish.base.season;
  let finish = dish.base.finish;
  if (Math.min(season, temp, texture, fresh) < TUNING.cook.finishGateMin) finish = Math.min(finish, TUNING.cook.finishCap);
  const th = TUNING.cook.starThreshold;
  const e0 = season >= th, e1 = temp >= th, e2 = texture >= th, e3 = fresh >= th;
  const e4 = e0 && e1 && e2 && e3 && finish >= th;
  const earned: [boolean, boolean, boolean, boolean, boolean] = [e0, e1, e2, e3, e4];
  const stars = earned.filter(Boolean).length;
  const total = Math.round(100 * (season * STAR_W.season + temp * STAR_W.temp + texture * STAR_W.texture + fresh * STAR_W.fresh + finish * STAR_W.finish));
  const tempLabel: DishStars['tempLabel'] = tempC >= recipe.servingC - 5 ? 'hot' : tempC >= 38 ? 'warm' : 'cold';
  return { scores: { season, temp, texture, fresh, finish }, earned, stars, total, tempC, tempLabel };
}

/** 판매가 — 탄 것 0 · 별점 총점 비례 */
export function dishValueKrw(dish: DishData, recipe: FireRecipeDef, stars: DishStars): number {
  if (dish.burnt) return 0;
  return Math.round(recipe.baseValueKrw * (0.3 + 0.9 * (stars.total / 100)) / 100) * 100;
}

/** 섭취 효과 배율 — 별 5 = 1.2배 · 탄 것 = 0.4배 */
export function dishVitalsMult(dish: DishData, stars: DishStars): number {
  if (dish.burnt) return 0.4;
  return 0.45 + 0.75 * (stars.total / 100);
}

/** 요리 아이템 이름 */
export function dishItemName(recipe: FireRecipeDef, dish: DishData, stars: DishStars, en = false): string {
  if (dish.burnt) return en ? `Burnt ${recipe.nameEn}` : `탄 ${recipe.nameKo}`;
  return en ? `${recipe.nameEn} (${stars.stars} star${stars.stars === 1 ? '' : 's'})` : `${recipe.nameKo} (별 ${stars.stars}개)`;
}

export const SALT_LABEL_KO: Record<SaltLabel, string> = { bland: '싱겁다', ok: '적당하다', salty: '짜다' };
export const SALT_LABEL_EN: Record<SaltLabel, string> = { bland: 'Bland', ok: 'Just right', salty: 'Too salty' };
export const SUGAR_LABEL_KO: Record<SugarLabel, string> = { ok: '', sweet: '달다', flat: '단맛이 부족하다' };
export const SUGAR_LABEL_EN: Record<SugarLabel, string> = { ok: '', sweet: 'Too sweet', flat: 'Lacks sweetness' };
export const STAR_NAME_KO = ['간', '온도', '식감', '신선도', '완성도'] as const;
export const STAR_NAME_EN = ['Seasoning', 'Temperature', 'Texture', 'Freshness', 'Finish'] as const;
