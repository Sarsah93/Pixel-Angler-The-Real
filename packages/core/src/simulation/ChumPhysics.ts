/**
 * @file ChumPhysics.ts
 * @description 밑밥(Chum) 투척·확산 물리 엔진 (Phase 1)
 *
 *  - 수면 착수한 밑밥은 조류 벡터를 따라 수평으로 흘러가며 (정면 뷰에서는
 *    페이드아웃 모션만 표시 — 침강 시각화는 생략)
 *  - 내부 연산에서는 시간에 따라 상층→중층→하층으로 Z축 침강을 유지하며,
 *    깊어질수록 확산 반경(Radius)이 넓어진다
 *  - getChumSyncRate(baitPos): 미끼의 (x, y, z)가 밑밥 영향권(Chum Zone)에
 *    3차원 오버랩되는 정도를 동조율 0.0 ~ 1.0 로 반환
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

import type { TideVector } from './UnderwaterSinkPhysics.js';

/** 밑밥 덩이 내부 상태 */
export interface ChumBall {
  /** 수평 좌표 (m) */
  x: number;
  y: number;
  /** 침강 수심 (m) */
  z: number;
  /** 경과 시간 (초) */
  ageSec: number;
  /** 소멸 시간 (초) */
  ttlSec: number;
}

/** 3차원 좌표 (미끼 위치 판정용) */
export interface ChumProbePos {
  x: number;
  y: number;
  z: number;
}

/** 밑밥 침강 속도 (m/s) — 서서히 하층으로 */
const CHUM_SINK_MPS = 0.22;
/** 기본 확산 반경 (m) + 수심 비례 확장 */
const BASE_RADIUS_M = 1.4;
const RADIUS_PER_DEPTH = 0.75;

export class ChumPhysics {
  private balls: ChumBall[] = [];

  get activeBalls(): readonly ChumBall[] {
    return this.balls;
  }

  /** 수면 좌표에 밑밥 투척 */
  toss(x: number, y: number, ttlSec = 50): ChumBall {
    const ball: ChumBall = { x, y, z: 0, ageSec: 0, ttlSec };
    this.balls.push(ball);
    return ball;
  }

  /** 밑밥 덩이의 현재 확산 반경 (m) — 깊어질수록 넓어짐 */
  radiusOf(ball: ChumBall): number {
    return BASE_RADIUS_M + ball.z * RADIUS_PER_DEPTH;
  }

  /** 프레임 갱신: 조류 드리프트 + Z 침강 + 수명 관리 */
  update(dtSec: number, tide: TideVector, zMaxM: number): void {
    for (const ball of this.balls) {
      ball.ageSec += dtSec;
      // 수평: 조류에 흘러감 (수면 부유분은 조류를 강하게 탐)
      const surfaceFactor = ball.z < 0.5 ? 1 : 0.65;
      ball.x += tide.x * surfaceFactor * dtSec;
      ball.y += tide.y * surfaceFactor * dtSec;
      // 수직: 상층 → 중층 → 하층 침강 (바닥에서 정지)
      ball.z = Math.min(zMaxM, ball.z + CHUM_SINK_MPS * dtSec);
    }
    this.balls = this.balls.filter((b) => b.ageSec < b.ttlSec);
  }

  /**
   * 미끼 위치의 밑밥 동조율 (0.0 ~ 1.0).
   * 모든 밑밥 덩이와의 3차원 거리/반경 오버랩 중 최댓값을 반환.
   */
  getChumSyncRate(baitPos: ChumProbePos): number {
    let best = 0;
    for (const ball of this.balls) {
      const r = this.radiusOf(ball);
      const dx = baitPos.x - ball.x;
      const dy = baitPos.y - ball.y;
      const dz = baitPos.z - ball.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist >= r) continue;
      // 중심에 가까울수록 1.0, 가장자리에서 0.0 — 신선한 밑밥일수록 진함
      const freshness = 1 - Math.min(1, ball.ageSec / ball.ttlSec) * 0.4;
      const sync = (1 - dist / r) * freshness;
      if (sync > best) best = sync;
    }
    return Math.min(1, best);
  }

  clear(): void {
    this.balls = [];
  }
}
