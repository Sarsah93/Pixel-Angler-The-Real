/**
 * @file LineTensionPhysics.ts
 * @description 뒷줄견제(H키) 제동 물리 + 목줄 정렬도(Alignment) 시스템 (3단계-③)
 *
 *  - H키 유지: 유저 방향 장력(F_hold) 발생 → 찌 드리프트 속도 70%+ 급감,
 *    조류 상대속도차로 미끼가 대각선 위로 떠오르는 양력(Lift) 발생
 *  - 정렬도 A (0.0~1.0): 조류에 찌가 선행하고 목줄이 사선으로 펴진 정도.
 *    자유 흘림 중 서서히 상승, 뒷줄견제 중 빠르게 상승, 급조작 시 하락.
 *  - 리액션 트리거: 가라앉거나 바닥에 누운 미끼가 H 입력으로 떠오르는
 *    과도기 순간을 감지해 리액션 바이트 신호를 반환.
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
  /** 찌 드리프트 제동 배율 (1 = 자유, 0.28 = 뒷줄견제 중) */
  driftBrake: number;
  /** 미끼 양력 상승 속도 (m/s) */
  baitLiftMps: number;
  /** 이번 프레임에 리액션 리프트가 시작되었는지 (H로 미끼가 떠오르기 시작) */
  reactionLiftTriggered: boolean;
}

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
    let baitLiftMps = 0;

    if (holding) {
      // 찌 제동: 흘러가던 속도 70% 이상 급감
      driftBrake = 0.28;
      // 미끼 양력: 조류가 셀수록 상대속도차 커져 더 잘 떠오름
      baitLiftMps = 0.7 + tideSpeed * 0.6;
      // 뒷줄견제는 목줄을 팽팽하게 펴 정렬도를 빠르게 올림
      this.alignmentIndex = Math.min(1, this.alignmentIndex + dtSec * 0.35);

      // 리액션 트리거: 안착 상태에서 H가 새로 눌린 순간
      if (!this.prevHolding && baitSettled) {
        reactionLiftTriggered = true;
      }
    } else {
      // 자유 흘림: 조류를 타며 서서히 정렬 (조류가 아예 없으면 정렬 정체)
      const alignRate = tideSpeed > 0.05 ? 0.07 : 0.01;
      this.alignmentIndex = Math.min(1, this.alignmentIndex + dtSec * alignRate);
    }

    this.prevHolding = holding;
    return { driftBrake, baitLiftMps, reactionLiftTriggered };
  }

  /** 재캐스팅/줄 감기 등 급조작 시 정렬도 초기화 */
  resetAlignment(): void {
    this.alignmentIndex = 0;
    this.prevHolding = false;
  }
}
