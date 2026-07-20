/**
 * @file LineTensionPhysics.ts
 * @description 뒷줄견제(H키) 홀드 물리 + 목줄 정렬도(Alignment) 시스템 (3단계-③)
 *
 * 뒷줄견제 = 릴에서 나오는 줄을 손으로 잡아 그 지점에 채비를 홀드하는 행위 (2026-07-20 재정의):
 *  - H를 누르는 순간 미끼가 약 0.2m만 살짝 떠오른 뒤 정지한다 (원샷 리프트 — 씬에서 앵커 처리)
 *  - 홀드 중에는 침강도 드리프트도 없다 — 찌/채비가 그 지점에 고정되고,
 *    속조류 흐름이 목줄을 펴 주면서 **정렬도(A)만 계속 상승**한다
 *  - 리액션 트리거: 바닥에 안착해 있던 미끼가 H 입력으로 살짝 들리는 순간
 *    리액션 바이트 신호를 반환 (입질 확률 일시 상승)
 *  - 릴링(당김)과는 별개 — 릴링은 거리를 좁히고, 뒷줄견제는 제자리 홀드다
 *
 * 정렬도 A (0.0~1.0): 조류에 찌가 선행하고 목줄이 사선으로 펴진 정도.
 * 자유 흘림 중 서서히 상승, 뒷줄견제 홀드 중 빠르게 상승, 급조작 시 하락.
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

export interface LineTensionInput {
  dtSec: number;
  /** H키 유지 여부 */
  holding: boolean;
  /** 조류 속력 (m/s) */
  tideSpeed: number;
  /** 미끼가 바닥/한계 수심에 안착해 있는지 */
  baitSettled: boolean;
}

export interface LineTensionOutput {
  /** 찌 드리프트 제동 배율 (1 = 자유 흘림, 0 = 뒷줄견제 홀드 — 완전 정지) */
  driftBrake: number;
  /**
   * 미끼 양력 상승 속도 (m/s).
   * 뒷줄견제는 연속 상승이 아니라 원샷 0.2m 리프트 후 홀드이므로 항상 0 —
   * 앵커 목표 수심으로의 수렴은 씬(FirstPersonFishingScene)이 처리한다.
   */
  baitLiftMps: number;
  /** 이번 프레임에 리액션 리프트가 시작되었는지 (바닥의 미끼가 H로 들리는 순간) */
  reactionLiftTriggered: boolean;
}

/** 뒷줄견제 원샷 리프트 높이 (m) — 씬의 홀드 앵커 계산에 사용 */
export const HOLD_LIFT_M = 0.2;

export class LineTensionPhysics {
  /** 목줄 정렬도 A (0.0 ~ 1.0) */
  alignmentIndex = 0;
  /** 현재 뒷줄견제 입력 상태 */
  isHoldingLine = false;

  private prevHolding = false;

  update(input: LineTensionInput): LineTensionOutput {
    const { dtSec, holding, tideSpeed, baitSettled } = input;
    this.isHoldingLine = holding;

    let reactionLiftTriggered = false;
    let driftBrake = 1;

    if (holding) {
      // 홀드: 그 지점에 고정 — 드리프트 완전 정지, 침강/양력 없음
      driftBrake = 0;
      // 속조류가 목줄을 펴 주면서 정렬도만 계속 상승 (조류가 셀수록 빠르게)
      const alignRate = 0.25 + Math.min(0.3, tideSpeed * 0.4);
      this.alignmentIndex = Math.min(1, this.alignmentIndex + dtSec * alignRate);

      // 리액션 트리거: 바닥 안착 상태에서 H가 새로 눌린 순간 (0.2m 원샷 리프트)
      if (!this.prevHolding && baitSettled) {
        reactionLiftTriggered = true;
      }
    } else {
      // 자유 흘림: 조류를 타며 서서히 정렬 (조류가 아예 없으면 정렬 정체)
      const alignRate = tideSpeed > 0.05 ? 0.07 : 0.01;
      this.alignmentIndex = Math.min(1, this.alignmentIndex + dtSec * alignRate);
    }

    this.prevHolding = holding;
    return { driftBrake, baitLiftMps: 0, reactionLiftTriggered };
  }

  /** 재캐스팅/줄 감기 등 급조작 시 정렬도 초기화 */
  resetAlignment(): void {
    this.alignmentIndex = 0;
    this.prevHolding = false;
  }
}
