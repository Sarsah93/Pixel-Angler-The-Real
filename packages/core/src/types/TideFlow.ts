/**
 * @file TideFlow.ts
 * @description 물때 흐름 8단계 타입 (204차 — 사용자 지시 「들물·날물 구체화」).
 *
 * 하루 두 번 오르내리는 물을 낚시꾼이 부르는 말로 나눈다:
 *  - 들물(밀물): 초들물(간조 뒤 ~2시간) · 중들물(2~4시간) · 끝들물(4시간~만조 30분 전)
 *  - 날물(썰물): 초날물(만조 뒤 ~2시간) · 중날물(2~4시간) · 끝날물(4시간~간조 30분 전)
 *  - 물돌이(정조): 만조·간조 앞뒤 30분 — 물이 멈추거나 돈다
 *
 * ⚠ 기존 `TideInfo.tidePhase`(1~15물 — 음력 날짜의 사리·조금)와 다른 축이다.
 *   「몇 물」은 하루의 조류 세기, 「흐름 단계」는 지금 이 시각 물이 어디쯤 흐르는가.
 */

/** 물때 흐름 단계 */
export type TideFlowPhase =
  | 'flood_early' | 'flood_mid' | 'flood_late' | 'slack_high'
  | 'ebb_early' | 'ebb_mid' | 'ebb_late' | 'slack_low';

/** 물 방향 */
export type TideFlowDirection = 'flood' | 'ebb' | 'slack';

/** 지금 시각의 물때 흐름 */
export interface TideFlowState {
  phase: TideFlowPhase;
  direction: TideFlowDirection;
  /** 직전 만조/간조 이후 지난 분 */
  minutesSinceExtreme: number;
  /** 다음 만조/간조까지 남은 분 */
  minutesToNextExtreme: number;
  /** 다음 조위 극점 종류 */
  nextExtreme: 'high' | 'low';
  /** 이 단계가 끝나기까지 남은 분(다음 단계 예고용) */
  minutesToPhaseEnd: number;
  /** 다음 단계 */
  nextPhase: TideFlowPhase;
}

/** 단계별 낚시 성향 — 입질·대물·조류 */
export interface TideFlowProfile {
  /** 입질도 별(★ 0.5 단위, 표시·위키용) */
  stars: number;
  /** 입질 배율 기준값(사리 기준 — 조금이면 1에 가깝게 눌린다) */
  biteMult: number;
  /** 대물 가중 0~1 — 크기 등급을 위로 민다(물돌이·끝물) */
  sizeBias: number;
  /** 조류 세기 배율 — 채비가 흐르는 속도 */
  currentMult: number;
}
