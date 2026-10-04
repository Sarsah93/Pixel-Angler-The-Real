/**
 * @file RigLoss.ts
 * @description 채비 손실 계획 타입 (206차 — 채비 트리 기준 손실 정리).
 *
 * 밑걸림 · 줄터짐 · 복어 절단이 **트리의 어느 아래가 떨어져 나갔는가**로 같은 규칙을 탄다.
 */

import type { SnagOutcome } from '../db-schema/GearDurability.js';

/** 무엇 때문에 잃는가 — 밑걸림 대처 결과 4종 + 파이팅 중 파단 */
export type RigLossCause =
  | SnagOutcome
  /** 파이팅 중 목줄(도래 아래)이 터졌다 */
  | 'line_break_leader'
  /** 파이팅 중 찌 위 원줄이 터졌다 */
  | 'line_break_main'
  /** 복어·갈치 이빨에 목줄째 잘렸다 */
  | 'cutter';

/** 잃은 범위 — 메시지 고르기용 */
export type RigLossScope =
  | 'none'
  /** 미끼 한 칸 */
  | 'bait'
  /** 바늘(+미끼 · 좁쌀봉돌) */
  | 'hook'
  /** 묶음추·카드 채비 한 벌(바늘이 고정이라 가지 하나가 뜯기면 한 벌을 버린다) */
  | 'kit'
  /** 루어(+지그헤드) */
  | 'lure'
  /** 도래(없으면 매듭) 아래 전부 */
  | 'below_swivel'
  /** 찌 위 원줄부터 전부 */
  | 'all';

export interface RigLossPlan {
  scope: RigLossScope;
  /** 개수로 소모하는 칸 — 미끼 칸은 `bait: true`(한 바늘 두 미끼면 qty 2) */
  items: { nodeIdx: number; itemId: string; qty: number; bait?: boolean }[];
  /** 스풀에서 잘려 나가는 줄 길이(원줄 · 목줄은 스풀째 잃지 않는다) */
  lines: { nodeIdx: number; itemId: string; meters: number }[];
}
