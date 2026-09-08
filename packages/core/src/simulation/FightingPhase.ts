/**
 * @file FightingPhase.ts
 * @description 실시간 파이팅 텐션 + 물고기 탈출 방어 상태 머신 (Phase 4, 어종 패턴 확장)
 *
 *  - 원줄 텐션 0~100: 0(Slack) = 바늘 빠짐 / 100(Over) = 줄터짐
 *  - 패턴 1 '바늘털이(jump)': 수면 위로 솟구침 → 릴링을 멈추고 H를 떼어 텐션을 낮출 것
 *    (부시리·농어 등 특정 어종에서 주로 발생 — 어종별 가중치)
 *  - 패턴 2 '여 박기(dive)': 해저 암초로 돌진 → H를 꾹 눌러 버틸 것 (감성돔/우럭/쏨뱅이)
 *  - 패턴 3 '횡이동(lateral)': 좌우로 치고 나가며 여 쓸림 유도 → H를 떼고 드랙으로 버틸 것
 *    (부시리/고등어/전갱이 등 회유어)
 *  - 입 연약도(mouthFragility): 과텐션 시 바늘 빠짐 확률 급증 (전갱이)
 *  - 탈출 공식: P_escape = P_base_escape × M_tension × M_pattern × (1 − A_tackle)
 *
 * **116차 — 물리 텐션 모드** (`weightKg`·`burstMult`·`lineCapacityKg` 지정 시):
 *  텐션 게이지 = **요구 장력(kgf) ÷ 라인 인장강도(kg) × 100**.
 *  요구 장력 = 체중 × (정적 부력분 + 순간가속배수 × 패턴 × 피로 게이트 × **대응 배수**).
 *  - 패턴에 맞게 대응(dive+버티기 / jump+슬랙 / lateral+같은쪽 스티어)하면 요구 장력이 **감쇠**돼
 *    게이지가 오르지 않는다(피드백 3 — 구 모델은 버티기 자체가 텐션을 올렸다).
 *  - 라이트 채비로 큰 고기를 걸면 요구 장력이 라인 강도를 넘어 **터진다**(피드백 4.1). 단 무입력
 *    (드랙 미끄럼)에서는 `dragCapFrac`로 상한 — 고기를 달려 보내며 피로를 기다리는 정석이 성립.
 *  - 어종군 순간가속(돔류 4× · 방어류 5.5× · 광어 2× …)으로 어종 자체 난이도가 갈린다(피드백 4.2).
 *  구 상수 모드(weightKg 미지정)는 그대로 유지 — 레거시 호출 호환.
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

import { TUNING } from '../config/tuning.js';

export type FightPattern = 'none' | 'jump' | 'dive' | 'lateral';

export interface FightInput {
  dtSec: number;
  /** H키(뒷줄견제/버티기) 유지 */
  holding: boolean;
  /** 릴링 중 (마우스 좌클릭 유지) */
  reeling: boolean;
  /**
   * 로드 스티어 (←=-1 / 없음=0 / →=+1) — 파이트 2D 밀당 (2026-07).
   * 횡이동(lateral) 러닝 방향과 **같은 쪽으로 눕히면** 측면하중이 줄어 텐션 완화(버티기),
   * **반대쪽(카운터 스티어)** 은 텐션이 치솟는 대신 물고기 머리를 돌려 제압(진행 보너스).
   */
  steerDir?: -1 | 0 | 1;
  /** 피로 페이즈 추진 게이트 (FishFatigueModel.thrustGate — 0.2~1.5). 미지정 = 1 */
  thrustGate?: number;
}

export type FightEvent = 'none' | 'landed' | 'escaped' | 'line_break' | 'hook_off';

/** 현재 패턴에 대한 플레이어 대응 판정 (UI 피드백용) */
export type FightResponse = 'good' | 'bad' | 'neutral';

export interface FightStatus {
  tension: number;
  progress: number;
  pattern: FightPattern;
  patternTimeLeft: number;
  event: FightEvent;
  escapeProbPerSec: number;
  /** 횡이동(lateral) 러닝 방향 (-1=좌 / +1=우) — 스티어 정렬 판정·2D 무대 렌더용 */
  lateralDir: -1 | 1;
  /** 물리 모드 — 요구 장력(kgf) / 라인 강도(kg) / 대응 판정. 구 모드는 0·0·neutral */
  demandKg: number;
  lineCapKg: number;
  response: FightResponse;
}

export interface FightingFishSpec {
  /** 물고기 힘 계수 (0.1 ~ 1.15) */
  powerFactor: number;
  /** 채비 완성도 A_tackle (0~1, 높을수록 탈출 억제) */
  tackleA?: number;
  /** 기본 탈출 확률 (초당) */
  baseEscapePerSec?: number;
  /** 패턴 가중치 (jump/dive/lateral) — 미지정 시 균등 낮음 */
  patternWeights?: { jump: number; dive: number; lateral: number };
  /** 패턴 발동 간격 배율 (1.0 표준, 낮을수록 잦음) */
  intervalMult?: number;
  /** 입 연약도 (0~1) — 과텐션 시 바늘 빠짐 증가 */
  mouthFragility?: number;
  /** 116차 물리 모드 — 개체 무게(kg) */
  weightKg?: number;
  /** 어종군 순간가속 배수 (체중 대비 — TUNING.fightPhys.burst[fightGroupOf(id)]) */
  burstMult?: number;
  /** 라인 인장강도(kg) — 원줄·목줄 중 약한 쪽 (lineStrengthKg) */
  lineCapacityKg?: number;
}

/** 안정 텐션 구간 */
const SAFE_MIN = 30;
const SAFE_MAX = 80;
/** 패턴 간격 기본 (초) — 이전(2.5~6초)보다 완화 */
const PATTERN_BASE_MIN = 3.6;
const PATTERN_BASE_SPAN = 4.6;

export class FightingPhase {
  tension = 50;
  progress = 0;
  pattern: FightPattern = 'none';
  /** 횡이동 러닝 방향 — lateral 패턴 추첨 시 좌/우 결정 */
  private lateralDir: -1 | 1 = 1;
  private patternTimer = 0;
  private nextPatternIn: number;
  private done = false;
  private slackTimer = 0;
  private lastDemandKg = 0;
  private lastResponse: FightResponse = 'neutral';

  private readonly power: number;
  private readonly tackleA: number;
  private readonly baseEscape: number;
  private readonly weights: { jump: number; dive: number; lateral: number };
  private readonly intervalMult: number;
  private readonly fragility: number;
  /** 물리 모드 파라미터 (없으면 구 상수 모드) */
  private readonly weightKg: number;
  private readonly burst: number;
  private readonly lineCapKg: number;
  private readonly physical: boolean;

  constructor(fish: FightingFishSpec) {
    this.power = fish.powerFactor;
    this.tackleA = fish.tackleA ?? 0.7;
    this.baseEscape = fish.baseEscapePerSec ?? 0.05;
    this.weights = fish.patternWeights ?? { jump: 0.15, dive: 0.45, lateral: 0.4 };
    this.intervalMult = fish.intervalMult ?? 1.15;
    this.fragility = fish.mouthFragility ?? 0.15;
    this.weightKg = fish.weightKg ?? 0;
    this.burst = fish.burstMult ?? 2.2;
    this.lineCapKg = fish.lineCapacityKg ?? 0;
    this.physical = this.weightKg > 0 && this.lineCapKg > 0;
    this.nextPatternIn = (PATTERN_BASE_MIN + Math.random() * PATTERN_BASE_SPAN) * this.intervalMult;
  }

  /** 어종 가중치 기반 패턴 추첨 */
  private pickPattern(): FightPattern {
    const total = this.weights.jump + this.weights.dive + this.weights.lateral;
    if (total <= 0) return 'dive';
    let roll = Math.random() * total;
    roll -= this.weights.jump;
    if (roll <= 0) return 'jump';
    roll -= this.weights.dive;
    if (roll <= 0) return 'dive';
    return 'lateral';
  }

  /** 현재 패턴에 대한 대응 판정 — 텐션 감쇠/증폭과 탈출 배수가 공유 */
  private judgeResponse(holding: boolean, reeling: boolean, steer: -1 | 0 | 1): FightResponse {
    switch (this.pattern) {
      case 'dive': return holding ? 'good' : 'bad';
      case 'jump': return (!reeling && !holding) ? 'good' : 'bad';
      case 'lateral':
        if (holding) return 'bad';
        if (steer === this.lateralDir) return 'good';
        return 'neutral';
      default: return 'neutral';
    }
  }

  update(input: FightInput): FightStatus {
    if (this.done) return this.status('none', 0);
    const { dtSec, holding, reeling } = input;
    const steer = input.steerDir ?? 0;

    // ── 패턴 스케줄링 ──
    if (this.pattern === 'none') {
      this.nextPatternIn -= dtSec;
      if (this.nextPatternIn <= 0) {
        this.pattern = this.pickPattern();
        this.patternTimer = 1.6 + Math.random() * 1.4;
        if (this.pattern === 'lateral') this.lateralDir = Math.random() < 0.5 ? -1 : 1;
      }
    } else {
      this.patternTimer -= dtSec;
      if (this.patternTimer <= 0) {
        this.pattern = 'none';
        this.nextPatternIn = (PATTERN_BASE_MIN + Math.random() * PATTERN_BASE_SPAN) * this.intervalMult;
      }
    }

    const response = this.judgeResponse(holding, reeling, steer);
    this.lastResponse = response;

    if (this.physical) {
      this.updateTensionPhysical(input, response);
    } else {
      this.updateTensionLegacy(input);
    }

    // ── 로드 스티어 밀당 (횡이동 러닝 중) — 진행도 쪽만 (텐션은 위 모델이 담당) ──
    if (this.pattern === 'lateral' && steer !== 0) {
      if (steer === this.lateralDir) this.progress += 4 * dtSec;       // 버티기 성공 — 하락분 상쇄
      else {
        this.progress += 7 * dtSec;                                    // 제압 — 위험을 감수한 전진
        if (!this.physical) this.tension += 19 * dtSec;
      }
    }

    this.tension = Math.max(0, Math.min(100, this.tension));

    // ── 랜딩 진행 (기존 대비 1.2배 완화) ──
    if (reeling) {
      const inSafe = this.tension >= SAFE_MIN && this.tension <= SAFE_MAX;
      this.progress += (inSafe ? 11 : 3) * dtSec * (1.25 - this.power * 0.45);
    } else {
      this.progress = Math.max(0, this.progress - 1.2 * dtSec);
    }
    // 다이브 중 견제하지 않으면 여로 파고듦 (진행도 하락) · 횡이동 중 놓아주면 소폭 하락
    if (this.pattern === 'dive' && !holding) this.progress = Math.max(0, this.progress - 10 * dtSec);
    if (this.pattern === 'lateral' && !holding && steer !== this.lateralDir) {
      this.progress = Math.max(0, this.progress - 4 * dtSec);
    }
    this.progress = Math.min(100, this.progress);

    // ── 종료 판정: 텐션 한계 ──
    if (this.tension >= 100) return this.finish('line_break');
    if (this.physical) {
      // 물리 모드 — 느슨함이 지속돼야 바늘이 빠진다 (순간 0 = 즉사 아님)
      const P = TUNING.fightPhys;
      if (this.tension < P.slackHookOffBelow) this.slackTimer += dtSec; else this.slackTimer = 0;
      if (this.slackTimer >= P.slackHookOffSec) return this.finish('hook_off');
    } else if (this.tension <= 0) {
      return this.finish('hook_off');
    }
    if (this.progress >= 100) return this.finish('landed');

    // ── 입 연약도: 과텐션 시 바늘 빠짐 (전갱이 등) ──
    if (this.tension > 85 && Math.random() < this.fragility * 0.45 * dtSec) {
      return this.finish('hook_off');
    }

    // ── 탈출 공식 ──
    const tensionDeviation = this.tension < SAFE_MIN
      ? (SAFE_MIN - this.tension) / SAFE_MIN
      : this.tension > SAFE_MAX ? (this.tension - SAFE_MAX) / (100 - SAFE_MAX) : 0;
    const mTension = 1 + tensionDeviation * 2.5;
    let mPattern = 1;
    if (this.pattern === 'jump' && response === 'bad') mPattern = 3.0;      // 바늘털이 대응 실패
    if (this.pattern === 'dive' && response === 'bad') mPattern = 2.2;      // 여 박기 대응 실패
    if (this.pattern === 'lateral' && response === 'bad') mPattern = 2.4;   // 횡이동 중 강제 제동 → 쓸림
    const escapeProb = this.baseEscape * mTension * mPattern * (1 - this.tackleA);

    if (Math.random() < escapeProb * dtSec) {
      return this.finish('escaped');
    }

    return this.status('none', escapeProb);
  }

  /**
   * 물리 텐션 — 요구 장력(kgf)을 라인 강도로 나눠 게이지 목표를 만들고 부드럽게 추종한다.
   * 구조: 체중 × (정적 + 순간가속 × 패턴 × 피로 × 대응) → 입력 부하(릴링/버티기/슬랙) → 드랙 상한.
   */
  private updateTensionPhysical(input: FightInput, response: FightResponse): void {
    const P = TUNING.fightPhys;
    const { dtSec, holding, reeling } = input;
    const gate = input.thrustGate ?? 1;
    const patternMult = this.pattern === 'dive' ? P.pullDive
      : this.pattern === 'lateral' ? P.pullLateral
      : this.pattern === 'jump' ? P.pullJump
      : P.pullIdle;
    const respMult = response === 'good' ? P.goodResponseMult : response === 'bad' ? P.badResponseMult : 1;
    let demand = this.weightKg * (P.staticFrac + this.burst * patternMult * gate * respMult);
    if (reeling) demand = demand * P.reelLoadMult + P.reelLoadKg;
    else if (!holding) demand *= P.slackMult;
    if (holding && this.pattern !== 'dive') demand *= P.holdStiffMult;
    // 릴을 감지 않는 동안(무입력·버티기)은 드랙이 미끄러져 라인 강도의 일정 비율 위로는 안 올라간다 —
    //   줄이 터지는 건 **러닝 중에 감을 때**. 가벼운 채비로 큰 고기를 걸었을 때 "달려 보내며
    //   지치길 기다리는" 정석이 성립하고, 정대응(버티기)도 시뮬상 즉사하지 않는다.
    if (!reeling) demand = Math.min(demand, this.lineCapKg * P.dragCapFrac);
    this.lastDemandKg = demand;
    const target = Math.max(0, Math.min(140, demand / this.lineCapKg * 100));
    const rate = target > this.tension ? P.tensionRiseRate : P.tensionFallRate;
    this.tension += (target - this.tension) * Math.min(1, dtSec * rate);
  }

  /** 구 상수 모드 (레거시 호출 호환) */
  private updateTensionLegacy(input: FightInput): void {
    const { dtSec, holding, reeling } = input;
    let fishPull = 14 + this.power * 34;
    if (this.pattern === 'dive') fishPull *= 1.7;
    if (this.pattern === 'lateral') fishPull *= 1.35;
    if (this.pattern === 'jump') fishPull *= 0.5;
    if (reeling) this.tension += (16 + fishPull * 0.45) * dtSec;
    if (holding) this.tension += (10 + fishPull * 0.3) * dtSec;
    if (!reeling && !holding) this.tension -= (24 + this.power * 10) * dtSec;
    if (this.pattern === 'jump' && (reeling || holding)) this.tension += 26 * dtSec;
    if (this.pattern === 'lateral' && holding) this.tension += 22 * dtSec;
    if (this.pattern === 'lateral' && (input.steerDir ?? 0) === this.lateralDir) this.tension -= 15 * dtSec;
  }

  private finish(event: FightEvent): FightStatus {
    this.done = true;
    return this.status(event, 0);
  }

  private status(event: FightEvent, escapeProbPerSec: number): FightStatus {
    return {
      tension: this.tension,
      progress: this.progress,
      pattern: this.pattern,
      patternTimeLeft: Math.max(0, this.patternTimer),
      event,
      escapeProbPerSec,
      lateralDir: this.lateralDir,
      demandKg: this.lastDemandKg,
      lineCapKg: this.lineCapKg,
      response: this.lastResponse,
    };
  }
}
