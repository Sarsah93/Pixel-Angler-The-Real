/**
 * @file FightPhysics2D.ts
 * @description 파이트 모드 2D 횡 러닝 물리 (측면하중 + heading/displacement 분리)
 *
 * 기존 LinePhysics.ts의 축방향(1D) 드랙/장력/락업/파손 로직을 재사용하고,
 * 물고기의 도주 방향(heading)과 로드 스티어(rodLean)에서 발생하는
 * 측면하중(side-load)을 추가로 계산한다.
 *
 * 흐름: ①스티어(←/→)로 rodLeanAngle 누적 → ②라인각+스티어=유효각,
 * heading과의 차 angleErr → ③추진력을 축(장력)+측면(하중)으로 분해 →
 * ④축은 기존 드랙 슬립/릴링 로직 → ⑤측면하중을 더한 결합 장력으로
 * 위험도(0.6/0.85)·파손(125%) 판정 → ⑥측면압으로 물고기 머리를 라인 쪽으로
 * 돌리기(제압, turnResist 감쇠) + 저스태미나 강제 회전·롤 →
 * ⑦displacement(추진 − 줄이 끄는 힘)로 위치 갱신.
 *
 * 난수는 core 순수성을 위해 호출부에서 주입한다. 뷰 스케일(m→px)도 입력으로 받는다.
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { ReelSpec, LineSpec } from '../types/Gear.js';
import {
  getEffectiveDragKg,
  getTensionDangerLevel,
  getRetrieveSpeedMps,
  type LineState,
} from './LinePhysics.js';
import type { SizeTier } from './SizeTierRules.js';

// ────────────────────────────────────────────────────────────
// TUNING 상수 (플레이 테스트로 조정)
// ────────────────────────────────────────────────────────────
/** 측면 성분 → 장력 가산 계수 */
const SIDE_LOAD_COEF = 0.85;
/** 스티어 입력당 로드 기울기 각속도 (rad/s) */
const STEER_RATE = 2.6;
/** 로드 최대 기울기 (±60°) */
const MAX_LEAN = Math.PI / 3;
/** 측면압으로 물고기 머리를 돌리는 기본 속도 */
const TURN_RATE = 1.4;
/** 추진력→로컬 이동 환산 (뷰 px/(kg·s) 근사) */
const SWIM_SPEED = 6.0;
/** 측면압에 의한 물고기 추가 피로 계수 */
const LATERAL_FATIGUE = 0.020;
/** 드랙 저항 피로 (기존 LinePhysics 0.015와 정합) */
const DRAG_FATIGUE = 0.015;
/** 기본 피로 누적 */
const BASE_FATIGUE = 0.005;
/** 이 이하에서 머리 로드팁쪽 강제 회전 + 옆으로 롤 ("떠오른 물고기") */
export const LOW_STAMINA_ROLL = 0.15;
const LINE_LB_TO_KG = 0.453592;

/** tier → 파이트 파워 배율 (SizeTierRules 연동 — 소0.8/중1.0/대1.3) */
export const TIER_POWER_MUL: Record<SizeTier, number> = {
  small: 0.8, medium: 1.0, large: 1.3,
};

/** tier → 스태미나 배율 (대형일수록 오래 버팀) */
export const TIER_STAMINA_MUL: Record<SizeTier, number> = {
  small: 0.8, medium: 1.0, large: 1.3,
};

// ────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────
export interface Vec2 { x: number; y: number; }

/** 어종별 파이트 성향 (연속 heading 편향값 — 방향 하드코딩 금지) */
export interface MovementProfile {
  /** 0~1 횡 러닝 성향 */
  lateralBias: number;
  /** 0~1 수직 박기(수심↓) 성향 */
  diveBias: number;
  /** 0~1 상방 점프/헤드셰이킹 성향 */
  jumpBias: number;
  /** 0~1 뒤로 제트(두족류) 성향 */
  jetBias: number;
  /** 추진력 배율 */
  runPower: number;
  /** 한 번의 러닝 지속 (초) */
  runDurationSec: number;
  /** 머리 돌리기 저항 (클수록 제압 어려움) */
  turnResist: number;
  /** 스태미나 스케일 */
  staminaScale: number;
}

/** 파이트 2D 상태 (앵커=뷰 상단중앙=로컬 원점, +x 우, +y 아래=수심) */
export interface FightState2D {
  /** 앵커 기준 로컬 좌표 (뷰 px) */
  fishPos: Vec2;
  /** rad — 물고기가 향한 방향(도주 의지) */
  fishHeading: number;
  /** rad — 누적 로드 기울기(스티어) */
  rodLeanAngle: number;
  /** 기존 축방향 라인 상태 재사용 */
  line: LineState;
  /** 현재 러닝 경과 (초, 패턴 갱신용) */
  runElapsedSec: number;
}

export interface FightInput2D {
  /** difficulty × tier × stamina × fishRage 순간 추진력 (kg) — computeFishThrustKg */
  fishThrustKg: number;
  /** ← / 없음 / → */
  steerDir: -1 | 0 | 1;
  /** 좌클릭 유지 (감기 전용 — 방향성 없음) */
  isReeling: boolean;
  profile: MovementProfile;
  /** 0~1 (저스태미나 롤 판정) */
  fishStamina: number;
  /** m → 뷰 로컬 px 환산 (기본 40 — FishingFocusWindow 반경에 맞춰 조정) */
  viewScalePxPerM?: number;
}

export interface FightTick2DResult {
  newState: FightState2D;
  /** 라인방향 장력 (드랙이 처리) */
  axialTensionKg: number;
  /** 측면하중 */
  lateralLoadKg: number;
  /** (축+측면)/줄강도, 0~1 */
  combinedTensionRatio: number;
  dangerLevel: 'safe' | 'warning' | 'critical' | 'broken';
  /** +풀림 / -감김 (m) */
  lineOutDelta: number;
  /** 이번 틱 물고기 피로 감소치 */
  fishFatigueDelta: number;
  /** 이번 틱 heading 변화 (연출용) */
  headingTurnedRad: number;
  /** 저스태미나 옆으로 눕기 (제압 신호) */
  isRolling: boolean;
}

// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────
function wrapPi(a: number): number {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function norm(v: Vec2): Vec2 {
  const d = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / d, y: v.y / d };
}

/**
 * 순간 추진력(kg) 산출 — updateFightingLoop에서 매 틱 호출.
 * 기존 fishRage(주기 sin + 랜덤 버스트)를 유지하되 버스트 확률을
 * dt 정규화(1 - exp(-rate·dt))로 교체해 프레임레이트 의존을 제거한다.
 * @param randomUnit 0~1 난수 (호출부 주입 — core 순수성)
 */
export function computeFishThrustKg(
  difficulty: number,
  tierPowerMul: number,
  stamina: number,
  profile: MovementProfile,
  nowMs: number,
  dtSec: number,
  randomUnit: number,
): number {
  const base = difficulty * 2.2 * tierPowerMul * profile.runPower;
  const rhythmic = 1.0 + Math.sin(nowMs / 350) * 0.45;
  const burstProbPerSec = 4.8;
  const burst = randomUnit < (1 - Math.exp(-burstProbPerSec * dtSec)) ? 0.8 : 0.0;
  return base * (rhythmic + burst) * Math.max(0.05, stamina);
}

// ────────────────────────────────────────────────────────────
// 핵심: 2D 파이트 틱
// ────────────────────────────────────────────────────────────
export function simulateFightTick2D(
  state: FightState2D,
  input: FightInput2D,
  reel: ReelSpec,
  line: LineSpec,
  deltaMs: number,
): FightTick2DResult {
  const dt = deltaMs / 1000;
  const thrust = input.fishThrustKg;
  const lineStrengthKg = line.strengthLb * LINE_LB_TO_KG;

  // 1) 로드 스티어 → 누적 기울기 (입력 없으면 서서히 복원)
  let rodLeanAngle = state.rodLeanAngle;
  if (input.steerDir !== 0) {
    rodLeanAngle = clamp(rodLeanAngle + input.steerDir * STEER_RATE * dt, -MAX_LEAN, MAX_LEAN);
  } else {
    rodLeanAngle *= Math.max(0, 1 - 1.6 * dt);
  }

  // 2) 라인 각도(앵커→물고기) + 스티어 반영 유효각, heading과의 차.
  //    부호: 물고기가 우측(heading≈0)으로 러닝할 때 → 스티어(+1)를 누르면
  //    유효각이 heading 쪽으로 돌아 각도차↓(버티기), ← 역스티어는 각도차↑(제압/스파이크).
  const lineAngle = Math.atan2(state.fishPos.y, state.fishPos.x);
  const effLineAngle = lineAngle - rodLeanAngle;
  const angleErr = wrapPi(state.fishHeading - effLineAngle);

  // 3) 추진력 분해: 축(장력) + 측면(하중)
  const axialPull = Math.max(0, thrust * Math.cos(angleErr));   // 앵커 쪽으로 향하면 슬랙
  const lateralLoadKg = Math.abs(thrust * Math.sin(angleErr)) * SIDE_LOAD_COEF;

  // 4) 축방향 드랙/장력/줄길이 — 기존 LinePhysics 1D 수식 재사용
  const effectiveDrag = getEffectiveDragKg(reel, state.line.dragRatio);
  let axialTension = 0;
  let lineOutDelta = 0;
  let fatigue = BASE_FATIGUE * dt;

  if (axialPull > effectiveDrag) {
    // 드랙 슬립 (줄 풀림)
    axialTension = effectiveDrag + (axialPull - effectiveDrag) * 0.1;
    lineOutDelta = (axialPull - effectiveDrag) * 1.8 * dt;
    fatigue += DRAG_FATIGUE * (effectiveDrag / reel.maxDragKg) * dt;
  } else {
    axialTension = axialPull;
    if (input.isReeling) {
      axialTension += 1.5;
      lineOutDelta = -getRetrieveSpeedMps(reel, 1.2) * dt;
      fatigue += 0.01 * dt;
    }
  }

  // 5) 측면하중 합산 → 결합 장력/위험도/파손 (기존 임계 0.6/0.85/1.0·125% 재사용)
  const combinedTension = axialTension + lateralLoadKg;
  const combinedTensionRatio = Math.min(1.0, combinedTension / lineStrengthKg);
  const dangerLevel = getTensionDangerLevel(combinedTensionRatio);
  const isLineBroken = combinedTension > lineStrengthKg * 1.25;
  // 측면압에 의한 추가 피로 (제압 진행)
  fatigue += LATERAL_FATIGUE * (lateralLoadKg / reel.maxDragKg) * dt;

  // 6) 머리 돌리기(제압): 측면압↑ → heading이 라인 쪽으로. turnResist 감쇠.
  let headingTurn = wrapPi(effLineAngle - state.fishHeading)
    * TURN_RATE * (lateralLoadKg / Math.max(thrust, 0.001)) * dt
    / Math.max(0.2, input.profile.turnResist);
  // 저스태미나: 강제로 머리를 로드팁 쪽으로 (딸려옴) + 롤
  const isRolling = input.fishStamina <= LOW_STAMINA_ROLL;
  if (isRolling) {
    headingTurn += wrapPi(effLineAngle - state.fishHeading) * 0.8 * dt;
  }
  const newHeading = wrapPi(state.fishHeading + headingTurn);

  // 7) displacement: 추진(heading 방향) − 줄이 앵커쪽으로 끌어당김(감김량 비례)
  const swim = thrust * SWIM_SPEED * dt;
  const pullIn = Math.max(0, -lineOutDelta) * (input.viewScalePxPerM ?? 40);
  const lineUnit = norm(state.fishPos);
  const newPos: Vec2 = {
    x: state.fishPos.x + Math.cos(newHeading) * swim - lineUnit.x * pullIn,
    y: state.fishPos.y + Math.sin(newHeading) * swim - lineUnit.y * pullIn,
  };
  // 원형 뷰 반경 클램프는 뷰(FishingFocusWindow)가 담당

  const newLine: LineState = {
    currentTensionKg: combinedTension,
    dragRatio: state.line.dragRatio,
    lineLengthOutM: Math.max(0, state.line.lineLengthOutM + lineOutDelta),
    isLineBroken: state.line.isLineBroken || isLineBroken,
  };

  return {
    newState: {
      fishPos: newPos,
      fishHeading: newHeading,
      rodLeanAngle,
      line: newLine,
      runElapsedSec: state.runElapsedSec + dt,
    },
    axialTensionKg: axialTension,
    lateralLoadKg,
    combinedTensionRatio,
    dangerLevel,
    lineOutDelta,
    fishFatigueDelta: fatigue,
    headingTurnedRad: headingTurn,
    isRolling,
  };
}

/**
 * 러닝 패턴 갱신(behavior) — runDurationSec마다 profile 성향으로 새 heading 선택.
 * 방향 하드코딩 금지: lateral(좌우)·dive(아래)·jump(위)·jet(앵커 반대로 도주)
 * 성향값을 **가중 추첨**해 지배 모드를 고르고, 모드 방향 ± 스프레드 + 노이즈로
 * 연속 각을 만든다 (가중 "합산"은 성향을 대각선으로 뭉개므로 금지).
 * 난수는 호출부에서 주입 (r1 = 모드 추첨, r2 = 좌우/스프레드).
 */
export function pickRunHeading(
  profile: MovementProfile,
  anchorToFishAngle: number,
  r1: number, r2: number,
): number {
  // 화면각: 0=우, +y 아래=수심, −y 위=수면
  const wl = profile.lateralBias;
  const wd = profile.diveBias;
  const wj = profile.jumpBias;
  const wt = profile.jetBias;
  const total = wl + wd + wj + wt || 1;

  let base: number;
  let roll = r1 * total;
  if ((roll -= wl) < 0) {
    // 횡 러닝 — 좌/우 수평 (약간의 상하 스프레드)
    base = (r2 < 0.5 ? Math.PI : 0) + (r2 < 0.5 ? -(r2 - 0.25) : (r2 - 0.75)) * 0.8;
  } else if ((roll -= wd) < 0) {
    // 수직 박기 — 아래(+y) ± 스프레드
    base = Math.PI / 2 + (r2 - 0.5) * 0.8;
  } else if ((roll -= wj) < 0) {
    // 상방 점프/헤드셰이킹 — 위(−y) ± 스프레드
    base = -Math.PI / 2 + (r2 - 0.5) * 0.8;
  } else {
    // 뒤로 제트 — 앵커 반대 방향(라인 연장선)으로 후퇴
    base = anchorToFishAngle + (r2 - 0.5) * 0.4;
  }

  // 소량 노이즈 (r1 소수부 재활용 — 모드 추첨과 독립적 분포)
  const noise = ((r1 * 7.13) % 1 - 0.5) * 0.4;
  return wrapPi(base + noise);
}

// ────────────────────────────────────────────────────────────
// 어종별 movementProfile (표준 실코드 id — 튜닝 대상)
// ────────────────────────────────────────────────────────────
export const MOVEMENT_PROFILES: Record<string, MovementProfile> = {
  // 청물 회유 — 강한 횡 러닝, 파워/지속 큼
  yellowtail:        { lateralBias: 0.85, diveBias: 0.30, jumpBias: 0.05, jetBias: 0.00, runPower: 1.50, runDurationSec: 3.5, turnResist: 0.70, staminaScale: 1.30 }, // 방어
  amberjack:         { lateralBias: 0.90, diveBias: 0.35, jumpBias: 0.05, jetBias: 0.00, runPower: 1.70, runDurationSec: 4.0, turnResist: 0.80, staminaScale: 1.50 }, // 부시리
  greater_amberjack: { lateralBias: 0.90, diveBias: 0.45, jumpBias: 0.05, jetBias: 0.00, runPower: 1.90, runDurationSec: 4.5, turnResist: 0.85, staminaScale: 1.70 }, // 잿방어

  // 표층 고속 — 빠른 버스트, 금방 지침
  spanish_mackerel:  { lateralBias: 0.70, diveBias: 0.20, jumpBias: 0.20, jetBias: 0.00, runPower: 1.30, runDurationSec: 2.0, turnResist: 0.50, staminaScale: 0.90 }, // 삼치

  // 저층 무거움 — 수직 박기
  pacific_cod:       { lateralBias: 0.20, diveBias: 0.85, jumpBias: 0.00, jetBias: 0.00, runPower: 1.20, runDurationSec: 2.5, turnResist: 0.60, staminaScale: 1.10 }, // 대구
  red_seabream:      { lateralBias: 0.35, diveBias: 0.80, jumpBias: 0.10, jetBias: 0.00, runPower: 1.20, runDurationSec: 2.0, turnResist: 0.55, staminaScale: 1.00 }, // 참돔 (초반 다이브 강)
  flatfish:          { lateralBias: 0.30, diveBias: 0.70, jumpBias: 0.00, jetBias: 0.00, runPower: 0.90, runDurationSec: 1.2, turnResist: 0.50, staminaScale: 0.70 }, // 광어 (바닥 완강)

  // 연안 루어 — 점프/헤드셰이킹, 포말 격렬
  sea_bass:          { lateralBias: 0.50, diveBias: 0.30, jumpBias: 0.75, jetBias: 0.00, runPower: 1.15, runDurationSec: 1.5, turnResist: 0.40, staminaScale: 0.85 }, // 농어

  // 두족류 — 뒤로 제트, 약한 지속
  squid:             { lateralBias: 0.40, diveBias: 0.20, jumpBias: 0.00, jetBias: 0.80, runPower: 0.70, runDurationSec: 1.0, turnResist: 0.30, staminaScale: 0.60 }, // 무늬오징어
  cuttlefish:        { lateralBias: 0.35, diveBias: 0.30, jumpBias: 0.00, jetBias: 0.70, runPower: 0.60, runDurationSec: 0.8, turnResist: 0.30, staminaScale: 0.50 }, // 갑오징어

  // 락피시 — 구조물로 파고듦(하방), 순함
  dark_banded_rockfish: { lateralBias: 0.40, diveBias: 0.60, jumpBias: 0.05, jetBias: 0.00, runPower: 0.80, runDurationSec: 1.0, turnResist: 0.50, staminaScale: 0.60 }, // 볼락
};

/** 미등록 어종 폴백 */
export const DEFAULT_MOVEMENT_PROFILE: MovementProfile = {
  lateralBias: 0.50, diveBias: 0.40, jumpBias: 0.20, jetBias: 0.00,
  runPower: 1.00, runDurationSec: 2.0, turnResist: 0.55, staminaScale: 1.00,
};

export function getMovementProfile(speciesId: string): MovementProfile {
  return MOVEMENT_PROFILES[speciesId] ?? DEFAULT_MOVEMENT_PROFILE;
}
