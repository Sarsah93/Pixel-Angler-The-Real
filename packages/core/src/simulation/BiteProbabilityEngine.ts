/**
 * @file BiteProbabilityEngine.ts
 * @description 통합 실시간 입질 확률 엔진 (Phase 2 + 지형/정렬도/리액션 커널)
 *
 * 최종 수식:
 *   P_bite = P_base × M_terrain × (1 + k·A) × M_action × M_chum
 *
 *  - M_terrain: 여 밭(Reef) 안착(Hold) 2.5배 / 여 밭 통과 중 1.2배 / 모래 1.0배
 *  - A: 목줄 정렬도 (LineTensionPhysics.alignmentIndex, 0.0~1.0)
 *       → 여 밭에 들어가도 라인이 정렬되지 않으면 입질이 오지 않음
 *  - M_action: H키 리액션 리프트 후 1.5초간 2.0배
 *  - M_chum: 밑밥 동조율(0~1)에 따라 1.0 ~ 최대 4.0배 (유연 적용)
 *  - 밑걸림: 여 밭 Hold 상태 5초 이상 + 뒷줄견제 없음 → 확률적 Snagged
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

/** 프레임 입질 판정 컨텍스트 */
export interface BiteContext {
  dtSec: number;
  /** 어종/수온/물때 기준 기본 활성도 확률 (초당, 예: 0.03) */
  baseProbPerSec: number;
  /** 미끼가 여 밭(Reef Zone) 내부인지 */
  inReefZone: boolean;
  /** 채비 안착(Hold — 이동 속도 0 수렴) 상태인지 */
  isHold: boolean;
  /** 목줄 정렬도 A (0.0 ~ 1.0) */
  alignmentIndex: number;
  /** 뒷줄견제(H) 유지 중인지 */
  isHoldingLine: boolean;
  /** 밑밥 동조율 (0.0 ~ 1.0) */
  chumSyncRate: number;
}

/** 프레임 판정 결과 */
export interface BiteTickResult {
  event: 'none' | 'bite' | 'snagged';
  /** 현재 초당 입질 확률 */
  probPerSec: number;
  /** 배율 내역 (UI 표시용) */
  multipliers: {
    terrain: number;
    alignmentFactor: number;
    action: number;
    chum: number;
  };
  /** 밑걸림 진행도 (0~1, UI 경고용) */
  snagProgress: number;
  /** 리액션 가중치 잔여 시간 (초) */
  actionTimeLeft: number;
}

/** 밑걸림 유예 시간 (초) — 이 시간 이상 방치 시 확률 트리거 */
const SNAG_GRACE_SEC = 5;
/** 유예 초과 후 초당 밑걸림 확률 */
const SNAG_PROB_PER_SEC = 0.25;
/** 리액션 바이트 지속 시간 (초) */
const ACTION_WINDOW_SEC = 1.5;
/** 정렬도 계수 k */
const ALIGNMENT_K = 1.0;
/** 밑밥 최대 가중치 */
const CHUM_MAX_MULT = 4.0;

export class BiteProbabilityEngine {
  private actionTimer = 0;
  private snagTimer = 0;

  /**
   * H키 리액션 리프트 발동 — 밑걸림 타이머 즉시 초기화 +
   * 1.5초간 actionMultiplier 2.0 부여.
   */
  triggerReactionLift(): void {
    this.actionTimer = ACTION_WINDOW_SEC;
    this.snagTimer = 0;
  }

  /** 재캐스팅 등 상태 초기화 */
  reset(): void {
    this.actionTimer = 0;
    this.snagTimer = 0;
  }

  /** 현재 컨텍스트의 초당 입질 확률 계산 (판정 없이 수치만) */
  calculateBiteProbability(ctx: BiteContext): number {
    const m = this.computeMultipliers(ctx);
    return ctx.baseProbPerSec * m.terrain * m.alignmentFactor * m.action * m.chum;
  }

  private computeMultipliers(ctx: BiteContext): BiteTickResult['multipliers'] {
    // 지형 가중치: 여 밭 + Hold 안착 = 2.5배 (은신 포인트 급증)
    const terrain = ctx.inReefZone ? (ctx.isHold ? 2.5 : 1.2) : 1.0;
    // 정렬도: (1 + k·A) — A가 0이면 가중 없음
    const alignmentFactor = 1 + ALIGNMENT_K * ctx.alignmentIndex;
    // 리액션 바이트
    const action = this.actionTimer > 0 ? 2.0 : 1.0;
    // 밑밥 동조: 1.0 ~ 4.0배 유연 적용
    const chum = 1 + ctx.chumSyncRate * (CHUM_MAX_MULT - 1);
    return { terrain, alignmentFactor, action, chum };
  }

  /**
   * 프레임 갱신 + 입질/밑걸림 판정.
   * 'bite' 발생 시 호출 측(씬)에서 찌 빨림 'Biting' 이벤트를 발송한다.
   */
  update(ctx: BiteContext): BiteTickResult {
    this.actionTimer = Math.max(0, this.actionTimer - ctx.dtSec);

    const multipliers = this.computeMultipliers(ctx);
    const probPerSec = ctx.baseProbPerSec
      * multipliers.terrain * multipliers.alignmentFactor
      * multipliers.action * multipliers.chum;

    // ── 밑걸림 타이머: 여 밭 Hold + 뒷줄견제 없음 ──
    let event: BiteTickResult['event'] = 'none';
    if (ctx.inReefZone && ctx.isHold && !ctx.isHoldingLine) {
      this.snagTimer += ctx.dtSec;
      if (this.snagTimer >= SNAG_GRACE_SEC) {
        if (Math.random() < SNAG_PROB_PER_SEC * ctx.dtSec) {
          event = 'snagged';
        }
      }
    } else {
      // 흐르거나 견제 중이면 서서히 회복
      this.snagTimer = Math.max(0, this.snagTimer - ctx.dtSec * 2);
    }

    // ── 입질 판정 ──
    if (event === 'none' && Math.random() < probPerSec * ctx.dtSec) {
      event = 'bite';
    }

    return {
      event,
      probPerSec,
      multipliers,
      snagProgress: Math.min(1, this.snagTimer / SNAG_GRACE_SEC),
      actionTimeLeft: this.actionTimer,
    };
  }
}
