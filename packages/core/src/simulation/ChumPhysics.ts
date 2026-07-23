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
  // ── rev2 (CHUM_DIFFUSION_SPEC) — 속도벡터 정렬 타원·지형 코팅 ──
  /** 마지막 스텝 속도 (m/s) — 타원 장축 신장·틸트(회전) 정렬용 */
  vx: number;
  vd: number;
  vz: number;
  /** 지형(바닥) 접촉 여부 — 접촉 후 코팅(coatMs) 동안 바닥에 깔림 */
  contacted: boolean;
  /** 접촉 시점 ageSec */
  contactAgeSec: number;
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

/** 파슬 기본 수명 (초) — 레거시 상수. rev2부터 기본값은 TUNING.chum.lifetimeMs */
export const CHUM_PARCEL_TTL_SEC = 55;
/** 초기 확산 반경 (m) */
const PARCEL_BASE_SPREAD_M = 0.3;

/** 수면 투척점에 파슬 생성 — 착수 D = 투척 시점 미끼 거리(distM), 종류별 물리 주입 */
export function createChumParcel(
  x: number, d: number,
  type: ChumTypeKey = 'grain',
  ttlSec = TUNING.chum.lifetimeMs / 1000,
): ChumParcel {
  const spec = TUNING.chumTypes[type];
  return {
    x, d, z: 0, ageSec: 0, ttlSec, type,
    sinkRateMps: spec.sinkRate,
    driftAffinity: spec.driftAffinity,
    spreadGrowPerSec: spec.spreadGrow,
    spreadM: PARCEL_BASE_SPREAD_M,
    vx: 0, vd: 0, vz: spec.sinkRate,
    contacted: false, contactAgeSec: 0,
  };
}

/** 파슬 소멸 판정 — 수명 초과 or 지형 코팅 페이드 종료 (rev2) */
export function isChumExpired(p: ChumParcel): boolean {
  if (p.ageSec >= p.ttlSec) return true;
  if (p.contacted && (p.ageSec - p.contactAgeSec) >= TUNING.chum.coatMs / 1000) return true;
  return false;
}

/**
 * 파슬 타원 반경 (m) — rev2 §2-3: 장축 = 시간·속도 신장 / 단축 = 상한 캡 (무한 원 금지).
 * planeSpeedMps: 렌더 뷰 평면의 속도 크기 (수평뷰 = |vx,vd| / 수직뷰 = |vx,vz|).
 */
export function chumEllipseRadii(p: ChumParcel, planeSpeedMps: number): { rMajorM: number; rMinorM: number } {
  const C = TUNING.chum;
  const rMajorM = C.rMajor0 + C.spreadMajorMps * p.ageSec + C.elongK * planeSpeedMps * p.ageSec;
  const rMinorM = Math.min(C.rMinorMaxM, C.rMinor0 + C.spreadMinorMps * p.ageSec);
  return { rMajorM, rMinorM };
}

/**
 * 파슬 농도 α (0~1) — rev2 §2-1: alphaStart·(1−t01^pow) 연속 곡선 (분기점 급전환 금지).
 * 지형 코팅 중에는 코팅 페이드(coatMs 선형)와의 최소값.
 */
export function chumAlpha01(p: ChumParcel): number {
  const C = TUNING.chum;
  const t01 = Math.min(1, p.ageSec / Math.max(0.001, p.ttlSec));
  let a = C.alphaStart * (1 - Math.pow(t01, C.alphaCurvePow));
  if (p.contacted) {
    const coatT = (p.ageSec - p.contactAgeSec) / Math.max(0.001, C.coatMs / 1000);
    a = Math.min(a, C.alphaStart * Math.max(0, 1 - coatT));
  }
  return Math.max(0, a);
}

/**
 * 파슬 1스텝 — z 침강(조류 감쇠) + 조류 (x, d) 드리프트 + 확산 + 지형 접촉/코팅 (rev2).
 *  - 침강: sink = max(minSink, typeSink·(1−damp·cur01)) — 조류 셀수록 느리게 (§2-2)
 *  - 속도벡터(vx/vd/vz) 기록 — 렌더가 타원 장축·틸트(회전)를 이 방향으로 정렬 (§2-3)
 *  - 지형 관통 금지: 타원 수직 반경까지 고려해 바닥 위 클램프, 접촉 시 코팅 시작 (§2-4)
 * bedDepthAt: 파슬 거리 d의 국소 바닥 수심 (SeabedProfile.depthAt — 없으면 zMaxM 평면)
 * (시뮬 하네스 chumSyncSim과 동일 수식 — 게임↔시뮬 지표 정합)
 */
export function stepChum(
  p: ChumParcel, dtSec: number, drift: ChumDrift, zMaxM: number,
  bedDepthAt?: (d: number) => number,
): void {
  const C = TUNING.chum;
  p.ageSec += dtSec;

  if (p.contacted) {
    // 코팅 중 — 바닥에 붙어 정지 (침강·드리프트 없음), 페이드는 chumAlpha01이 담당
    p.vx = 0; p.vd = 0; p.vz = 0;
    return;
  }

  // 침강 — 조류가 셀수록 느려짐 (§2-2)
  const cur01 = Math.min(1, Math.hypot(drift.x, drift.d) / Math.max(0.01, C.currentRefMps));
  const sink = Math.max(C.minSinkMps, p.sinkRateMps * (1 - C.currentSinkDamp * cur01));
  p.vz = sink;
  p.vx = drift.x * p.driftAffinity;
  p.vd = drift.d * p.driftAffinity * TUNING.chumSync.currentDWeight;
  p.z += sink * dtSec;
  p.x += p.vx * dtSec;
  p.d += p.vd * dtSec;
  p.spreadM = PARCEL_BASE_SPREAD_M + p.spreadGrowPerSec * p.ageSec;

  // 지형 접촉 (§2-4) — 회전 타원의 수직 반경(zHalf)까지 고려해 관통 금지
  const bedZ = Math.min(zMaxM, bedDepthAt ? bedDepthAt(p.d) : zMaxM);
  const { rMajorM, rMinorM } = chumEllipseRadii(p, Math.hypot(p.vx, p.vz));
  const tilt = Math.atan2(p.vz, Math.abs(p.vx) > 0.001 ? p.vx : 0.001);
  const zHalf = Math.abs(rMajorM * Math.sin(tilt)) + Math.abs(rMinorM * Math.cos(tilt));
  if (p.z + zHalf * 0.4 >= bedZ - C.coatClearanceM) {
    p.contacted = true;
    p.contactAgeSec = p.ageSec;
    p.z = Math.max(0.1, bedZ - C.coatClearanceM - zHalf * 0.4);
    p.vx = 0; p.vd = 0; p.vz = 0;
  }
}

/**
 * 파슬 1개의 미끼 동조율 (0~1) — depthGate × horizNear × freshness.
 *  depthGate: 수심 창 gauss(dz, depthSigmaM)
 *  horizNear: (x, d) 수평 근접 gauss(dh, horizSigmaM + spread·0.3)
 *  (gauss(v, σ) = exp(−(v/σ)²) — 시뮬 하네스와 동일 형태)
 */
/** 동조 판정 부가 컨텍스트 (rev2 — 바닥 코팅 보너스) */
export interface ChumSyncOpts {
  /** 미끼가 바닥층(국소 바닥 근처)에 있는지 — 코팅 파슬 보너스 대상 */
  baitNearBottom?: boolean;
}

export function computeChumSync(p: ChumParcel, bait: ChumSyncTarget, opts?: ChumSyncOpts): number {
  if (isChumExpired(p)) return 0;
  const dz = (p.z - bait.z) / TUNING.chumSync.depthSigmaM;
  const depthGate = Math.exp(-(dz * dz));
  const sigmaH = TUNING.chumSync.horizSigmaM + p.spreadM * 0.3;
  const dh = Math.hypot(p.x - bait.x, p.d - bait.d) / sigmaH;
  const horizNear = Math.exp(-(dh * dh));
  const freshness = 1 - Math.min(1, p.ageSec / p.ttlSec) * 0.4;
  let sync = depthGate * horizNear * freshness;
  // rev2 §2-5 — 바닥 코팅 중 파슬은 바닥층 미끼(볼락·감성돔 등) 동조 가산 (수평 근접 가중)
  if (opts?.baitNearBottom && p.contacted) {
    sync += TUNING.chum.bottomSyncBonus * horizNear;
  }
  return Math.min(1, sync);
}

/** 파슬 집합의 현재 최대 동조율 — HUD "밑밥 동조 %"·입질 확률에 곱 */
export function maxChumSync(parcels: readonly ChumParcel[], bait: ChumSyncTarget, opts?: ChumSyncOpts): number {
  let best = 0;
  for (const p of parcels) {
    const s = computeChumSync(p, bait, opts);
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
  bedDepthAt?: (d: number) => number,
): ChumPathPrediction {
  const p = createChumParcel(throwX, throwD, type);
  const path: ChumPathPrediction['path'] = [];
  let peakSync = 0;
  let peakIndex = 0;
  // rev2: 예측도 실제 수명(ttl)까지만 — 8초 수명 밖 경로는 존재하지 않는다
  const steps = Math.max(1, Math.round(Math.min(durationSec, p.ttlSec) / stepSec));
  for (let i = 0; i <= steps; i++) {
    path.push({ x: p.x, d: p.d, z: p.z, spreadM: p.spreadM });
    const s = computeChumSync(p, bait);
    if (s > peakSync) { peakSync = s; peakIndex = i; }
    stepChum(p, stepSec, drift, zMaxM, bedDepthAt);
    if (isChumExpired(p)) break;
  }
  return { path, peakSync, peakIndex };
}

/**
 * 최적 투척 리드 — throwX* = baitX − currentX·driftAffinity·tSink.
 * 좌측 강조류면 미끼보다 우측에 던져 좌하단 대각 드리프트로 미끼에서 피크.
 * rev2: tSink는 파슬 수명(lifetimeMs) 이내로 캡 — 수명 밖 심도는 도달 불가.
 */
export function optimalThrowX(baitX: number, baitZ: number, driftX: number, type: ChumTypeKey = 'grain'): number {
  const spec = TUNING.chumTypes[type];
  const tSink = Math.min(baitZ / Math.max(0.01, spec.sinkRate), TUNING.chum.lifetimeMs / 1000);
  return baitX - driftX * spec.driftAffinity * tSink;
}
