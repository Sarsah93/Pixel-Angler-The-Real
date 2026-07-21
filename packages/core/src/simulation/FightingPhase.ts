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
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

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
}

export type FightEvent = 'none' | 'landed' | 'escaped' | 'line_break' | 'hook_off';

export interface FightStatus {
  tension: number;
  progress: number;
  pattern: FightPattern;
  patternTimeLeft: number;
  event: FightEvent;
  escapeProbPerSec: number;
  /** 횡이동(lateral) 러닝 방향 (-1=좌 / +1=우) — 스티어 정렬 판정·2D 무대 렌더용 */
  lateralDir: -1 | 1;
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

  private readonly power: number;
  private readonly tackleA: number;
  private readonly baseEscape: number;
  private readonly weights: { jump: number; dive: number; lateral: number };
  private readonly intervalMult: number;
  private readonly fragility: number;

  constructor(fish: FightingFishSpec) {
    this.power = fish.powerFactor;
    this.tackleA = fish.tackleA ?? 0.7;
    this.baseEscape = fish.baseEscapePerSec ?? 0.05;
    this.weights = fish.patternWeights ?? { jump: 0.15, dive: 0.45, lateral: 0.4 };
    this.intervalMult = fish.intervalMult ?? 1.15;
    this.fragility = fish.mouthFragility ?? 0.15;
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

    // ── 물고기 저항력 (패턴 중 증폭) ──
    let fishPull = 14 + this.power * 34;
    if (this.pattern === 'dive') fishPull *= 1.7;
    if (this.pattern === 'lateral') fishPull *= 1.35;
    if (this.pattern === 'jump') fishPull *= 0.5;   // 점프 중엔 줄이 느슨해짐

    // ── 텐션 역학 ──
    if (reeling) this.tension += (16 + fishPull * 0.45) * dtSec;
    if (holding) this.tension += (10 + fishPull * 0.3) * dtSec;
    if (!reeling && !holding) this.tension -= (24 + this.power * 10) * dtSec;
    // 점프 중 릴링/견제 유지 → 순간 장력 스파이크
    if (this.pattern === 'jump' && (reeling || holding)) this.tension += 26 * dtSec;
    // 횡이동 중 H로 잡아 세우면 여 쓸림 — 텐션 급상승
    if (this.pattern === 'lateral' && holding) this.tension += 22 * dtSec;
    // 다이브 중 견제하지 않으면 여로 파고듦 (진행도 하락)
    if (this.pattern === 'dive' && !holding) this.progress = Math.max(0, this.progress - 10 * dtSec);
    // 횡이동 중 놓아주면 진행도만 소폭 하락 (드랙으로 버티는 구간)
    if (this.pattern === 'lateral' && !holding) this.progress = Math.max(0, this.progress - 4 * dtSec);

    // ── 로드 스티어 밀당 (횡이동 러닝 중) ──
    //  같은쪽 눕히기 = 라인 각도차↓ → 측면하중 감소(텐션 완화 + 진행 하락 상쇄)
    //  카운터 스티어 = 각도차↑ → 텐션 스파이크, 대신 머리를 돌려 제압(진행 보너스)
    if (this.pattern === 'lateral' && steer !== 0) {
      if (steer === this.lateralDir) {
        this.tension -= 15 * dtSec;
        this.progress += 4 * dtSec;   // 버티기 성공 — 하락분 상쇄
      } else {
        this.tension += 19 * dtSec;
        this.progress += 7 * dtSec;   // 제압 — 위험을 감수한 전진
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

    // ── 종료 판정: 텐션 한계 ──
    if (this.tension >= 100) return this.finish('line_break');
    if (this.tension <= 0) return this.finish('hook_off');
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
    if (this.pattern === 'jump' && (reeling || holding)) mPattern = 3.0;    // 바늘털이 대응 실패
    if (this.pattern === 'dive' && !holding) mPattern = 2.2;                // 여 박기 대응 실패
    if (this.pattern === 'lateral' && holding) mPattern = 2.4;              // 횡이동 중 강제 제동 → 쓸림
    const escapeProb = this.baseEscape * mTension * mPattern * (1 - this.tackleA);

    if (Math.random() < escapeProb * dtSec) {
      return this.finish('escaped');
    }

    return this.status('none', escapeProb);
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
    };
  }
}
