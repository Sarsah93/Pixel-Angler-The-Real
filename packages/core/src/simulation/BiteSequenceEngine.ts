/**
 * @file BiteSequenceEngine.ts
 * @description 입질 시퀀스 엔진 — 초릿대 구부러짐 3단계 + 챔질(우클릭) 판정
 *
 * BiteProbabilityEngine의 'bite' 이벤트를 트리거로 입질 패턴(7종 확률 분포)을
 * 시작한다. 유저는 초릿대 구부러짐을 보고 우클릭 챔질로 파이팅에 진입한다
 * (기존 자동 파이팅 진입을 대체).
 *
 * 구부러짐 단계 (1회 애니메이션 프로파일 — 각 단계 시각적으로 구분되는 형태):
 *  1단계: 미끼 건드림 — 톡 한 번 (0.4초 20°까지 짧게 굽었다 펴짐).    챔질 성공률 5%
 *  2단계: 부분 섭취   — 두 번 끄덕 (35°→18°→32°→펴짐, 1.45초).       챔질 성공률 20%
 *  3단계: 완전 흡입   — 크게 실려 유지 (0.35초 50° → 1.5초까지 42°) → 챔질 성공률 100%
 *          0.25초 펴짐(이 릴리즈 구간에 챔질하면 100% 실패 "너무 늦게").
 *  (2026-07-20: 각 단계 피크 각도 -10° 완화 + 단계별 형태 차별화)
 *
 * 입질 패턴 (트리거 시 확률 추첨):
 *  1) 1→2→3 (30%)  2) 1→3 (10%)  3) 1→(장기 공백)→1 (20%)
 *  4) 2→3 (10%)    5) 2→2 (10%)  6) 2→1→3 (10%)   7) 3 (10%)
 *  단계 간 간격: 1초~180초 랜덤 (입질 확률이 높을수록 짧아짐).
 *  입질 확률이 높으면 시퀀스가 최대 5회 연속 반복되고 굽힘 강도도 +.
 *
 * 어종별 mock 입질 형태 (추후 어종 전체 확장 예정):
 *  광어(flatfish): 3단계 단발 / 감성돔(black_seabream): 1단계 → 3단계.
 *
 * 찌 잠김 깊이: 1단계 0.05m / 2단계 0.10m / 3단계 0.25m (UI 표기용).
 *
 * 순수 TS — 렌더링/브라우저 API 없음. RNG 주입 가능(테스트 결정성).
 */

/** 구부러짐 단계 */
export type BendStage = 1 | 2 | 3;

/** 단계별 찌 잠김 깊이 (m) */
export const FLOAT_SINK_BY_STAGE: Record<BendStage, number> = {
  1: 0.05, 2: 0.10, 3: 0.25,
};

/** 단계별 챔질 기본 성공률 */
export const HOOKSET_SUCCESS: Record<BendStage, number> = {
  1: 0.05, 2: 0.20, 3: 1.0,
};

/** 입질 패턴 정의 — 단계 나열 + 3번 패턴의 '장기 공백' 마커 */
interface BitePattern {
  stages: BendStage[];
  weight: number;
  /** stages[i] 이후 공백이 '한동안'(장기)인 인덱스 (패턴 3 전용) */
  longGapAfter?: number;
}

const PATTERNS: BitePattern[] = [
  { stages: [1, 2, 3], weight: 30 },
  { stages: [1, 3],    weight: 10 },
  { stages: [1, 1],    weight: 20, longGapAfter: 0 },
  { stages: [2, 3],    weight: 10 },
  { stages: [2, 2],    weight: 10 },
  { stages: [2, 1, 3], weight: 10 },
  { stages: [3],       weight: 10 },
];

/** 어종별 고정 입질 형태 (mock — 추후 어종 DB로 이관) */
const SPECIES_PATTERN: Record<string, BendStage[]> = {
  flatfish: [3],              // 광어 — 3단계 단발
  black_seabream: [1, 3],     // 감성돔 — 1단계 후 곧바로 3단계
};

/** 단계 애니메이션 키프레임: [시각(초), 각도(도)] 목록 (선형 보간) */
const STAGE_PROFILE: Record<BendStage, [number, number][]> = {
  // 1단계: 짧은 단발 '톡' — 작게 한 번 굽었다 빠르게 펴짐
  1: [[0, 0], [0.4, 20], [0.62, 8], [1.0, 0]],
  // 2단계: 두 번 끄덕 '톡-톡' — 중간 굽힘 후 살짝 풀렸다 다시 굽고 펴짐
  2: [[0, 0], [0.4, 35], [0.72, 18], [1.05, 32], [1.45, 0]],
  // 3단계: 크게 실려 오래 유지 — 깊게 굽어 버티다 마지막에 펴짐
  3: [[0, 0], [0.35, 50], [0.85, 44], [1.5, 42], [1.75, 0]],
};

/** 단계 총 길이 (초) — 챔질 여유를 위해 각 단계 +0.5초 (2026-07-20) */
const STAGE_DURATION: Record<BendStage, number> = { 1: 1.0, 2: 1.45, 3: 1.75 };

/** 3단계 릴리즈(펴짐) 시작 시각 — 이 이후 챔질은 '너무 늦음' 100% 실패 */
const STAGE3_RELEASE_START = 1.5;

/** 챔질 시도 결과 */
export interface HooksetResult {
  success: boolean;
  /** 실패 사유 (성공 시 undefined) */
  reason?: 'too_early_s1' | 'too_early_s2' | 'too_late' | 'no_bite';
  /** 표시 메시지 */
  message: string;
  /** 챔질 시점의 활성 단계 (no_bite면 null) */
  stage: BendStage | null;
}

/** 프레임 상태 */
export interface BiteSequenceTick {
  /** 현재 초릿대 굽힘 각도 (도) — 애니메이션 구동값 */
  bendAngleDeg: number;
  /** 현재 활성 단계 (구부러짐 진행 중일 때만, 공백 구간은 null) */
  activeStage: BendStage | null;
  /** 찌 잠김 깊이 (m) — 단계 잠김 표기용 */
  floatSinkM: number;
  /** 시퀀스 전체 종료 여부 (챔질 없이 어신이 끝남 — 미끼만 잃었을 수 있음) */
  ended: boolean;
  /** 시퀀스 진행 중 여부 */
  active: boolean;
}

export interface BiteSequenceOptions {
  /** 어종 ID — SPECIES_PATTERN에 있으면 고정 형태 사용 */
  speciesId?: string;
  /**
   * 트리거 시점의 초당 입질 확률 (BiteProbabilityEngine probPerSec).
   * 높을수록 단계 간 간격이 짧아지고, 반복 횟수(최대 5)와 굽힘 강도가 커진다.
   */
  biteProbPerSec: number;
  /**
   * 단계 지속시간 배율 (기본 1.0). 구멍 봉돌 등 이물감 감소 채비는 1.15로
   * 예신 단계가 길어져 챔질 타이밍 피드백이 완만해진다(+15% 버프).
   */
  stageTimeScale?: number;
  /** RNG 주입 (기본 Math.random) */
  rng?: () => number;
}

export class BiteSequenceEngine {
  private rng: () => number = Math.random;

  private queue: BendStage[] = [];
  private gaps: number[] = [];          // queue[i] 시작 전 대기 시간
  private idx = -1;                     // 현재 진행 중인 단계 인덱스 (-1 = 시작 전)
  private stageT = 0;                   // 현재 단계 경과 시간
  private gapT = 0;                     // 현재 공백 경과 시간
  private inGap = false;
  private _active = false;
  private _ended = false;
  /** 입질 확률 기반 강도 보정 (0~1) — 굽힘 각도 +최대 8도 */
  private intensity = 0;
  /** 단계 지속시간 배율 (구멍 봉돌 버프 등) */
  private timeScale = 1;
  /** 입질 유도(provoke) 사용 여부 — 시퀀스당 1회만 판정 */
  private provoked = false;

  /** 시퀀스 활성 여부 */
  get active(): boolean { return this._active; }

  /** 입질 트리거 — 패턴 추첨 + 간격/반복 산출 */
  start(opts: BiteSequenceOptions): void {
    this.rng = opts.rng ?? Math.random;
    this.timeScale = Math.max(0.5, Math.min(2, opts.stageTimeScale ?? 1));

    // 강도: probPerSec 0.02(낮음) ~ 0.25(높음) → 0~1
    this.intensity = Math.min(1, Math.max(0, (opts.biteProbPerSec - 0.02) / 0.23));

    // 패턴 결정 (어종 고정 형태 우선)
    let stages: BendStage[];
    let longGapAfter: number | undefined;
    const fixed = opts.speciesId ? SPECIES_PATTERN[opts.speciesId] : undefined;
    if (fixed) {
      stages = [...fixed];
    } else {
      const total = PATTERNS.reduce((a, p) => a + p.weight, 0);
      let roll = this.rng() * total;
      let picked = PATTERNS[0];
      for (const p of PATTERNS) { roll -= p.weight; if (roll <= 0) { picked = p; break; } }
      stages = [...picked.stages];
      longGapAfter = picked.longGapAfter;
    }

    // 입질 확률이 높으면 시퀀스 반복 (최대 5회 연속)
    const repeats = 1 + Math.floor(this.intensity * 4 * this.rng());
    const base = [...stages];
    for (let r = 1; r < repeats; r++) stages = stages.concat(base);

    // 단계 간 간격: 1초~180초 — 강도가 높을수록 짧게 (지수 편향)
    this.queue = stages;
    this.gaps = stages.map((_, i) => {
      if (i === 0) return 0.4 + this.rng() * 1.2;   // 첫 단계는 빠르게
      const isLong = longGapAfter !== undefined && i === longGapAfter + 1;
      const maxGap = isLong ? 180 : 180 * (1 - this.intensity * 0.9);
      const t = Math.pow(this.rng(), 2.2 - this.intensity);   // 짧은 쪽 편향
      return Math.min(180, Math.max(1, isLong ? 20 + t * (maxGap - 20) : 1 + t * (maxGap - 1)));
    });

    this.idx = -1;
    this.stageT = 0;
    this.gapT = 0;
    this.inGap = true;
    this._active = true;
    this._ended = false;
    this.provoked = false;
  }

  /** 시퀀스 강제 종료 (챔질 성공/재캐스팅 등) */
  reset(): void {
    this._active = false;
    this._ended = false;
    this.idx = -1;
    this.queue = [];
    this.provoked = false;
  }

  /**
   * 입질 유도 — 1~2단계(또는 그 직후 공백) 중 릴링을 1초 유지하거나 뒷줄견제(H)로
   * 미끼를 살짝 움직이면 **70% 확률로 다음 단계가 3단계(완전 흡입)로 승격**된다
   * (짧은 공백 0.6~1.6초 후 이어짐). 시퀀스당 1회만 판정 — 실패(30%)해도
   * 페널티는 없고 원래 패턴이 그대로 이어진다.
   */
  provoke(): 'escalated' | 'failed' | 'unavailable' {
    if (!this._active || this.provoked) return 'unavailable';
    // 기준 단계: 진행 중이면 현재 단계, 공백이면 직전 단계 (아직 첫 어신 전이면 불가)
    const refStage = this.idx >= 0 && this.idx < this.queue.length ? this.queue[this.idx] : null;
    if (refStage === null || refStage === 3) return 'unavailable';
    this.provoked = true;
    if (this.rng() >= 0.7) return 'failed';

    // 다음 단계를 3단계로 강제 + 짧은 공백으로 이어붙임
    if (this.idx + 1 < this.queue.length) {
      this.queue[this.idx + 1] = 3;
    } else {
      this.queue.push(3);
      this.gaps.push(0);
    }
    this.gaps[this.idx + 1] = 0.6 + this.rng();
    if (this.inGap) this.gapT = 0;
    return 'escalated';
  }

  /** 현재 활성 단계 (구부러짐 진행 중일 때만) */
  private currentStage(): BendStage | null {
    if (!this._active || this.inGap || this.idx < 0 || this.idx >= this.queue.length) return null;
    return this.queue[this.idx];
  }

  /** 단계 프로파일 보간 → 현재 각도 */
  private angleAt(stage: BendStage, t: number): number {
    const prof = STAGE_PROFILE[stage];
    for (let i = 1; i < prof.length; i++) {
      const [t0, a0] = prof[i - 1];
      const [t1, a1] = prof[i];
      if (t <= t1) {
        const k = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
        return a0 + (a1 - a0) * Math.min(1, Math.max(0, k));
      }
    }
    return 0;
  }

  update(dtSec: number): BiteSequenceTick {
    if (!this._active) {
      return { bendAngleDeg: 0, activeStage: null, floatSinkM: 0, ended: this._ended, active: false };
    }

    if (this.inGap) {
      this.gapT += dtSec;
      const need = this.gaps[this.idx + 1] ?? 0;
      if (this.gapT >= need) {
        this.idx += 1;
        this.inGap = false;
        this.stageT = 0;
        if (this.idx >= this.queue.length) {
          // 모든 단계 소진 — 어신 종료 (물고기가 떠남)
          this._active = false;
          this._ended = true;
          return { bendAngleDeg: 0, activeStage: null, floatSinkM: 0, ended: true, active: false };
        }
      }
    } else {
      const stage = this.queue[this.idx];
      this.stageT += dtSec;
      if (this.stageT >= STAGE_DURATION[stage] * this.timeScale) {
        // 단계 종료 → 다음 공백 (마지막 단계였다면 종료)
        if (this.idx >= this.queue.length - 1) {
          this._active = false;
          this._ended = true;
          return { bendAngleDeg: 0, activeStage: null, floatSinkM: 0, ended: true, active: false };
        }
        this.inGap = true;
        this.gapT = 0;
      }
    }

    const stage = this.currentStage();
    // 강도 보정: 최대 +4도 (단계 간 각도 차이가 흐려지지 않도록 완만하게)
    const boost = 1 + this.intensity * (4 / 50);
    // 프로파일은 원본 시간축 기준 — timeScale 만큼 늘어난 실경과를 되돌려 보간
    const angle = stage ? this.angleAt(stage, this.stageT / this.timeScale) * boost : 0;
    const sink = stage ? FLOAT_SINK_BY_STAGE[stage] * Math.min(1, angle / (20 * boost)) : 0;

    return {
      bendAngleDeg: angle,
      activeStage: stage,
      floatSinkM: sink,
      ended: this._ended,
      active: this._active,
    };
  }

  /**
   * 챔질(우클릭) 판정.
   *  - 1단계 중: 5% 성공 / 실패 "너무 빠른 챔질로 실패하였습니다."
   *  - 2단계 중: 20% 성공 / 실패 "섣부른 챔질로 실패하였습니다."
   *  - 3단계 굽힘/유지 중: 100% 성공
   *  - 3단계 릴리즈(1.0s~) 중: 100% 실패 "너무 늦게 챔질하였습니다."
   *  - 어신 없음: no_bite (허탕 — 페널티 없음, 호출 측에서 안내만)
   */
  attemptHook(): HooksetResult {
    const stage = this.currentStage();
    if (!stage) {
      return { success: false, reason: 'no_bite', stage: null, message: '입질이 없습니다 — 초릿대를 지켜보세요.' };
    }

    if (stage === 3) {
      if (this.stageT >= STAGE3_RELEASE_START * this.timeScale) {
        this.reset();
        return { success: false, reason: 'too_late', stage, message: '너무 늦게 챔질하였습니다.' };
      }
      this.reset();
      return { success: true, stage, message: '챔질 성공! 파이팅 개시!' };
    }

    const p = HOOKSET_SUCCESS[stage];
    if (this.rng() < p) {
      this.reset();
      return { success: true, stage, message: '챔질 성공! 파이팅 개시!' };
    }
    this.reset();
    return {
      success: false,
      reason: stage === 1 ? 'too_early_s1' : 'too_early_s2',
      stage,
      message: stage === 1 ? '너무 빠른 챔질로 실패하였습니다.' : '섣부른 챔질로 실패하였습니다.',
    };
  }
}