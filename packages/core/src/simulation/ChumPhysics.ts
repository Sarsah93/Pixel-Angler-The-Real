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

// ═══════════════════════════════════════════════════════════════
// 3D 밑밥 파슬 (2026-07-22 — 투척점·침강·조류·거리를 하나의 드리프트 시뮬로 통합)
//
//  밑밥을 (좌우 X · 원근거리 D · 수심 Z) 3D 입자(parcel)로 두고,
//  궤적이 미끼를 스치는 정도를 단일 동조율로 계산한다:
//    syncRate(t) = depthGate(z(t) − baitZ) × horizNear((x,d)(t) → (baitX, baitD))
//  리드: throwX* = baitX − currentX·driftAffinity·tSink (tSink = baitZ / sinkRate).
//  거리 D는 별도 시스템 없이 3D 축 하나로 흡수 — 조류 D성분이 있으면
//  앞/뒤로 흘러 horizNear가 자동 감점된다 (부분 동조 = 고증).
//
//  모든 계수는 TUNING(chumSync/chumTypes)에서 소비 — dev 패널/시뮬 하네스
//  (scripts/chumSyncSim.ts)와 같은 값을 공유한다 (사일로 금지).
// ═══════════════════════════════════════════════════════════════

import { TUNING, ChumTypeKey } from '../config/tuning.js';

/** 3D 밑밥 파슬 — 좌우 X · 원근거리 D · 수심 Z (m). 종류별 물리는 생성 시 주입 */
export interface ChumParcel {
  /** 좌우 (m) */
  x: number;
  /** 원근 거리 (m) — 낚시꾼 기준 수면 거리 축 */
  d: number;
  /** 침강 수심 (m) */
  z: number;
  /** 경과 시간 (초) */
  ageSec: number;
  /** 소멸 시간 (초) */
  ttlSec: number;
  /** 밑밥 종류 (파우더/압맥/경단) */
  type: ChumTypeKey;
  /** 침강 속도 (m/s) — 종류별 (TUNING.chumTypes) */
  sinkRateMps: number;
  /** 조류 타는 정도 0~1 — 종류별 */
  driftAffinity: number;
  /** 확산 성장 계수 (m/s) — 종류별 */
  spreadGrowPerSec: number;
  /** 확산 반경 (m) — 0.3 + spreadGrow·age */
  spreadM: number;
}

/** 파슬 드리프트 조류 (m/s) — x: 좌우 / d: 원근거리 성분 */
export interface ChumDrift {
  x: number;
  d: number;
}

/** 동조율 판정 대상 (미끼) 3D 좌표 */
export interface ChumSyncTarget {
  x: number;
  d: number;
  z: number;
}

/** 파슬 기본 수명 (초) */
export const CHUM_PARCEL_TTL_SEC = 55;
/** 초기 확산 반경 (m) */
const PARCEL_BASE_SPREAD_M = 0.3;

/** 수면 투척점에 파슬 생성 — 착수 D = 투척 시점 미끼 거리(distM), 종류별 물리 주입 */
export function createChumParcel(
  x: number, d: number,
  type: ChumTypeKey = 'grain',
  ttlSec = CHUM_PARCEL_TTL_SEC,
): ChumParcel {
  const spec = TUNING.chumTypes[type];
  return {
    x, d, z: 0, ageSec: 0, ttlSec, type,
    sinkRateMps: spec.sinkRate,
    driftAffinity: spec.driftAffinity,
    spreadGrowPerSec: spec.spreadGrow,
    spreadM: PARCEL_BASE_SPREAD_M,
  };
}

/**
 * 파슬 1스텝 — z 침강 + 조류 (x, d) 드리프트 + 확산.
 * 조류는 종류별 driftAffinity로, 원근(D) 성분은 추가로 currentDWeight로 감쇠.
 * (시뮬 하네스 chumSyncSim과 동일 수식 — 게임↔시뮬 지표 정합)
 */
export function stepChum(p: ChumParcel, dtSec: number, drift: ChumDrift, zMaxM: number): void {
  p.ageSec += dtSec;
  p.z = Math.min(zMaxM, p.z + p.sinkRateMps * dtSec);
  p.x += drift.x * p.driftAffinity * dtSec;
  p.d += drift.d * p.driftAffinity * TUNING.chumSync.currentDWeight * dtSec;
  p.spreadM = PARCEL_BASE_SPREAD_M + p.spreadGrowPerSec * p.ageSec;
}

/**
 * 파슬 1개의 미끼 동조율 (0~1) — depthGate × horizNear × freshness.
 *  depthGate: 수심 창 gauss(dz, depthSigmaM)
 *  horizNear: (x, d) 수평 근접 gauss(dh, horizSigmaM + spread·0.3)
 *  (gauss(v, σ) = exp(−(v/σ)²) — 시뮬 하네스와 동일 형태)
 */
export function computeChumSync(p: ChumParcel, bait: ChumSyncTarget): number {
  if (p.ageSec >= p.ttlSec) return 0;
  const dz = (p.z - bait.z) / TUNING.chumSync.depthSigmaM;
  const depthGate = Math.exp(-(dz * dz));
  const sigmaH = TUNING.chumSync.horizSigmaM + p.spreadM * 0.3;
  const dh = Math.hypot(p.x - bait.x, p.d - bait.d) / sigmaH;
  const horizNear = Math.exp(-(dh * dh));
  const freshness = 1 - Math.min(1, p.ageSec / p.ttlSec) * 0.4;
  return Math.min(1, depthGate * horizNear * freshness);
}

/** 파슬 집합의 현재 최대 동조율 — HUD "밑밥 동조 %"·입질 확률에 곱 */
export function maxChumSync(parcels: readonly ChumParcel[], bait: ChumSyncTarget): number {
  let best = 0;
  for (const p of parcels) {
    const s = computeChumSync(p, bait);
    if (s > best) best = s;
  }
  return best;
}

/** 예측 궤적 결과 — 투척점 조준 고스트/피크 마커용 */
export interface ChumPathPrediction {
  /** 시뮬 경로 스냅샷 (일정 간격) */
  path: { x: number; d: number; z: number; spreadM: number }[];
  /** 궤적 최대 동조율 (max_t syncRate) */
  peakSync: number;
  /** 피크 시점 경로 인덱스 */
  peakIndex: number;
}

/**
 * 투척점 → 침강·드리프트 예측 궤적 + 궤적 최대 동조율.
 * 조류를 상수로 근사한 조준용 시뮬 (실제 파슬은 stepChum이 프레임 단위로 구동).
 */
export function predictChumPath(
  throwX: number, throwD: number,
  drift: ChumDrift, bait: ChumSyncTarget,
  zMaxM: number,
  type: ChumTypeKey = 'grain',
  durationSec = 40, stepSec = 0.5,
): ChumPathPrediction {
  const p = createChumParcel(throwX, throwD, type);
  const path: ChumPathPrediction['path'] = [];
  let peakSync = 0;
  let peakIndex = 0;
  const steps = Math.max(1, Math.round(durationSec / stepSec));
  for (let i = 0; i <= steps; i++) {
    path.push({ x: p.x, d: p.d, z: p.z, spreadM: p.spreadM });
    const s = computeChumSync(p, bait);
    if (s > peakSync) { peakSync = s; peakIndex = i; }
    stepChum(p, stepSec, drift, zMaxM);
  }
  return { path, peakSync, peakIndex };
}

/**
 * 최적 투척 리드 — throwX* = baitX − currentX·driftAffinity·tSink.
 * 좌측 강조류면 미끼보다 우측에 던져 좌하단 대각 드리프트로 미끼에서 피크.
 */
export function optimalThrowX(baitX: number, baitZ: number, driftX: number, type: ChumTypeKey = 'grain'): number {
  const spec = TUNING.chumTypes[type];
  const tSink = baitZ / Math.max(0.01, spec.sinkRate);
  return baitX - driftX * spec.driftAffinity * tSink;
}
