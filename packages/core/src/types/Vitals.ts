/**
 * @file Vitals.ts
 * @description 생존 지표 — 체력·피로도·허기·수분 (125차 — PROGRESSION_SURVIVAL_SPEC v2 §4)
 *
 * ⚖ 시계 규칙: 드레인은 **활동 세션 시간**으로만 진행한다. 오프라인(게임 종료)·일시정지·모달 중에는
 * 정지 — 호출측이 `tickVitals`를 부르지 않으면 아무 일도 일어나지 않는다(쿨러·인벤 신선도의
 * `savedAtMs` 오프라인 정지 패턴과 같은 규약). 로드 시엔 `lastSyncMs`를 현재 시각으로 밀어
 * 저장~로드 사이 경과를 버린다.
 *
 * HP·피로도는 기존 `player.stamina`/`player.fatigue`를 승계한다(별도 필드 신설 아님) —
 * 이 모듈은 **계산만** 하고, 상태 보관·세이브는 client `GameState.vitals`가 맡는다.
 */

import { TUNING } from '../config/tuning.js';

/** 생존 지표 상태 (client GameState가 보관·직렬화) */
export interface VitalsState {
  /** 체력 0~maxHp */
  hp: number;
  maxHp: number;
  /** 피로도 0~maxFatigue (상태이상이 최대치를 깎을 수 있다) */
  fatigue: number;
  maxFatigue: number;
  /** 허기 0~100 (100 = 배부름) */
  hunger: number;
  /** 수분 0~100 (100 = 충분) */
  hydration: number;
}

/** 시간 드레인이 적용되는 활동 종류 */
export type VitalsActivity = 'idle' | 'sit' | 'walk' | 'run' | 'bike' | 'forage';

/** 1회성 행동 비용 종류 */
export type VitalsAction =
  | 'cast' | 'fightWin' | 'fightLose' | 'butcher' | 'sashimi' | 'travel' | 'craft' | 'cook';

/** [허기, 수분, 피로] 3요소 비용 벡터 */
type Triple = readonly [number, number, number];

function drainOf(activity: VitalsActivity): Triple {
  const v = TUNING.vitals;
  switch (activity) {
    case 'sit': return v.drainSit;
    case 'walk': return v.drainWalk;
    case 'run': return v.drainRun;
    case 'bike': return v.drainBike;
    case 'forage': return v.drainForage;
    default: return v.drainIdle;
  }
}

function costOf(action: VitalsAction): Triple {
  const v = TUNING.vitals;
  switch (action) {
    case 'cast': return v.costCast;
    case 'fightWin': return v.costFightWin;
    case 'fightLose': return v.costFightLose;
    case 'butcher': return v.costButcher;
    case 'sashimi': return v.costSashimi;
    case 'travel': return v.costTravel;
    case 'craft': return v.costCraft;
    default: return v.costCook;
  }
}

/** 지표 기본값 — 새 게임/구세이브 백필은 만복 상태로 시작한다(§4-1) */
export function createVitals(maxHp = 100, maxFatigue = 100): VitalsState {
  return { hp: maxHp, maxHp, fatigue: 0, maxFatigue, hunger: 100, hydration: 100 };
}

const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);

/** 허기 또는 수분이 임계(기본 20%) 미만인가 — 이동 감속·피로 가중의 단일 판정 */
export function isVitalsLow(v: VitalsState): boolean {
  const t = TUNING.vitals.lowPct;
  return v.hunger < t || v.hydration < t;
}

/** 이동 속도 배율 — 임계 미만이면 감속(기본 −20%) */
export function vitalsSpeedMult(v: VitalsState): number {
  return isVitalsLow(v) ? 1 - TUNING.vitals.lowMovePenalty : 1;
}

/** 피로 가중 배율 — 임계 미만이면 피로가 더 빨리 쌓인다(기본 ×1.3) */
export function vitalsFatigueMult(v: VitalsState): number {
  return isVitalsLow(v) ? TUNING.vitals.lowFatigueMult : 1;
}

/** 환경 계수 입력 — 체감온도·추위 내성(life_cold 랭크) */
export interface VitalsEnv {
  /** 체감온도(℃). 없으면 온도 보정 없음 */
  feelsLikeC?: number;
  /** 추위 내성 랭크 — 저온 경계를 랭크당 coldResistBufferC 만큼 낮춘다 */
  coldResistRank?: number;
  /** 스킬·상태이상에서 온 추가 배율 (허기·수분·피로 순) */
  extraMult?: Triple;
}

/** `tickVitals` 결과 — 호출측이 연출·상태이상 판정에 쓰는 신호 */
export interface VitalsTickResult {
  /** 이번 틱에 소모된 HP (허기·수분 0% 페널티) */
  hpLost: number;
  /** 허기·수분 둘 중 하나라도 0인가 → 탈진 판정 소스 */
  starving: boolean;
  /** 피로도가 최대치에 도달했는가 → 기절 판정 소스(§6) */
  fainted: boolean;
}

/**
 * 활동 시간 드레인 적용. `dtMs`는 **활동 시간**만 넘길 것(일시정지·오프라인 구간 제외).
 * 온도 계수: 체감 hotC 이상이면 수분 ×hotHydrationMult, coldC 이하면 허기 ×coldHungerMult.
 */
export function tickVitals(
  v: VitalsState,
  dtMs: number,
  activity: VitalsActivity = 'idle',
  env: VitalsEnv = {},
): VitalsTickResult {
  const out: VitalsTickResult = { hpLost: 0, starving: false, fainted: false };
  if (!(dtMs > 0)) return out;
  const hours = dtMs / 3_600_000;
  const t = TUNING.vitals;
  const [dh, dw, df] = drainOf(activity);

  let hungerMult = 1;
  let hydrationMult = 1;
  const feels = env.feelsLikeC;
  if (feels !== undefined) {
    const coldEdge = t.coldC - (env.coldResistRank ?? 0) * t.coldResistBufferC;
    if (feels >= t.hotC) hydrationMult *= t.hotHydrationMult;
    if (feels <= coldEdge) hungerMult *= t.coldHungerMult;
  }
  const ex = env.extraMult ?? ([1, 1, 1] as const);

  v.hunger = clamp(v.hunger - dh * hours * hungerMult * ex[0], 0, 100);
  v.hydration = clamp(v.hydration - dw * hours * hydrationMult * ex[1], 0, 100);

  // 피로: 음수 드레인(앉기)은 회복. 임계 미만이면 가중.
  const fatigueGain = df * hours * ex[2] * (df > 0 ? vitalsFatigueMult(v) : 1);
  v.fatigue = clamp(v.fatigue + fatigueGain, 0, v.maxFatigue);

  if (v.hunger <= 0 || v.hydration <= 0) {
    out.starving = true;
    const loss = t.zeroHpPerMin * (dtMs / 60_000);
    out.hpLost = Math.min(loss, v.hp);
    v.hp = clamp(v.hp - loss, 0, v.maxHp);
  }
  out.fainted = v.fatigue >= v.maxFatigue;
  return out;
}

/** 1회성 행동 비용 적용 (캐스팅·파이팅·손질·이동 등). `mult`로 강도 조절 */
export function applyVitalsAction(v: VitalsState, action: VitalsAction, mult = 1): void {
  const [dh, dw, df] = costOf(action);
  v.hunger = clamp(v.hunger - dh * mult, 0, 100);
  v.hydration = clamp(v.hydration - dw * mult, 0, 100);
  v.fatigue = clamp(v.fatigue + df * mult * vitalsFatigueMult(v), 0, v.maxFatigue);
}

/** 섭취 회복 — 음수 허용(술 = 수분 −). 상한 100 클램프 */
export function applyIntake(
  v: VitalsState, hunger = 0, hydration = 0, hp = 0, fatigue = 0,
): void {
  if (hunger) v.hunger = clamp(v.hunger + hunger, 0, 100);
  if (hydration) v.hydration = clamp(v.hydration + hydration, 0, 100);
  if (hp) v.hp = clamp(v.hp + hp, 0, v.maxHp);
  // 피로 회복(129차 P7 — 사용자 결정): **양수 = 피로가 줄어든다**(허기·수분과 같은 "회복량" 방향).
  // 음수면 피로가 오른다(카페인 리바운드).
  if (fatigue) v.fatigue = clamp(v.fatigue - fatigue, 0, v.maxFatigue);
}

/** 수면(침대) — 즉시 회복: 피로 0 · HP +50% · 허기/수분 −10 (`life_sleep` 배율은 호출측이 곱) */
export function applySleep(v: VitalsState, mult = 1): void {
  const t = TUNING.vitals;
  v.fatigue = clamp(t.sleepFatigueTo, 0, v.maxFatigue);
  v.hp = clamp(v.hp + v.maxHp * t.sleepHpPct * mult, 0, v.maxHp);
  v.hunger = clamp(v.hunger - t.sleepHungerCost, 0, 100);
  v.hydration = clamp(v.hydration - t.sleepHydrationCost, 0, 100);
}

/** 최대치 변경(레벨업·상태이상) — 현재값을 새 상한으로 클램프 */
export function setVitalsCaps(v: VitalsState, maxHp?: number, maxFatigue?: number): void {
  if (maxHp !== undefined && maxHp > 0) {
    v.maxHp = maxHp;
    v.hp = clamp(v.hp, 0, maxHp);
  }
  if (maxFatigue !== undefined && maxFatigue > 0) {
    v.maxFatigue = maxFatigue;
    v.fatigue = clamp(v.fatigue, 0, maxFatigue);
  }
}
