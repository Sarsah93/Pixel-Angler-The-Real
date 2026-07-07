/**
 * @file Fishing.ts
 * @description 낚시 행위 (캐스팅 ~ 랜딩)와 관련된 타입 정의
 *
 * 낚시 세션의 각 단계를 FSM(Finite State Machine) 방식으로 정의합니다.
 * FishBiteEngine과 LinePhysics에서 이 타입을 사용합니다.
 */

// ─────────────────────────────────────────────
// 낚시 세션 단계 (Finite State Machine)
// ─────────────────────────────────────────────
export type FishingPhase =
  | 'idle'              // 채비 들고 대기
  | 'aiming'            // 캐스팅 방향/거리 조준 중
  | 'casting'           // 캐스팅 애니메이션 재생 중
  | 'in_water'          // 채비가 물속에 있음 (대기)
  | 'bite_detected'     // 어신 감지 (찌 흔들림/잠김)
  | 'setting_hook'      // 챔질 가능 타이밍
  | 'fighting'          // 대물 파이팅 (라인 텐션 관리)
  | 'landing'           // 뜰채 / 갯바위 끌어올리기
  | 'caught'            // 랜딩 성공
  | 'line_break'        // 라인 터짐 (채비 손실)
  | 'missed'            // 챔질 미스 (어신 놓침)
  | 'snagged';          // 밑걸림

// ─────────────────────────────────────────────
// 어신 (입질) 패턴
// ─────────────────────────────────────────────
export type BitePattern =
  | 'bobber_shake'      // 찌 흔들림 (잡어/경계하는 어류)
  | 'bobber_dip'        // 찌 살짝 잠김 (소심한 입질)
  | 'bobber_pull'       // 찌 강하게 당김 (확신 입질)
  | 'bobber_rise'       // 찌 떠오름 (대상어가 미끼 들고 헤엄 위로)
  | 'line_tension'      // 라인에 장력 감지 (원투/지깅)
  | 'rod_tip_bend';     // 대 끝 휨 (선상 전동 릴)

// ─────────────────────────────────────────────
// 챔질 결과
// ─────────────────────────────────────────────
export type SetHookResult =
  | 'perfect'           // 완벽한 챔질 (파이팅 시 유리)
  | 'ok'                // 적당한 챔질
  | 'weak'              // 약한 챔질 (파이팅 중 빠질 위험)
  | 'too_early'         // 너무 빠른 챔질 (입질 놓침)
  | 'too_late';         // 너무 늦은 챔질 (어류가 뱉음)

// ─────────────────────────────────────────────
// 파이팅 세션 상태
// ─────────────────────────────────────────────
export interface FightingState {
  /** 파이팅 중인 물고기 (확정 전이라 정확한 종은 미공개) */
  estimatedWeightG: number;
  /** 현재 라인 장력 (0.0 ~ 1.0, 1.0 = 최대) */
  lineTensionRatio: number;
  /** 최대 드랙력 대비 현재 드랙 설정 (0.0 ~ 1.0) */
  dragRatio: number;
  /** 물고기 체력 (0.0 ~ 1.0) */
  fishStamina: number;
  /** 남은 줄 길이 (m, 물고기가 줄 당길 때 감소) */
  remainingLineM: number;
  /** 파이팅 지속 시간 (초) */
  fightDurationSeconds: number;
}

// ─────────────────────────────────────────────
// 낚시 세션 결과
// ─────────────────────────────────────────────
export interface FishingSessionResult {
  outcome: 'caught' | 'line_break' | 'missed' | 'snagged' | 'gave_up';
  /** 잡은 물고기 정보 (outcome === 'caught' 시에만) */
  caughtFish?: {
    speciesId: string;
    lengthCm: number;
    weightGram: number;
  };
  /** 소비된 미끼 */
  baitConsumed: boolean;
  /** 손실된 채비 (밑걸림/라인 터짐 시) */
  tackleConsumed: boolean;
  /** 총 소요 시간 (초) */
  sessionDurationSeconds: number;
}

// ─────────────────────────────────────────────
// 캐스팅 결과
// ─────────────────────────────────────────────
export interface CastingResult {
  /** 채비가 떨어진 거리 (m) */
  distanceM: number;
  /** 정확도 (목표 지점과의 오차, 0.0 = 완벽) */
  accuracyError: number;
  /** 물속 랜딩 성공 여부 (갯바위/경계에 걸리지 않음) */
  landedInWater: boolean;
  /** 기상 보정 (바람 영향으로 인한 오차 m) */
  windCorrectionM: number;
}

// ─────────────────────────────────────────────
// 낚시 포인트 (스팟 내 특정 포인트)
// ─────────────────────────────────────────────
export interface FishingPoint {
  id: string;
  /** 스팟 내 위치 (타일 좌표) */
  tileX: number;
  tileY: number;
  /** 포인트 이름 — 예: "테트라포드 끝자락", "수중여 앞" */
  label: string;
  /** 평균 수심 (m) */
  depthM: number;
  /** 이 포인트에서 출현하는 어종 ID */
  possibleSpeciesIds: string[];
  /** 조류 방향 — 예: '서류', '동류' */
  currentDirection?: string;
  /** 이 포인트의 입질 보너스 (물때, 시간대 가중치 배수) */
  biteBonusMultiplier: number;
}
