/**
 * @file CastingPhysicsEngine.ts
 * @description 3D 탑다운 캐스팅 탄도 물리 엔진 (1단계)
 *
 * 캐릭터 완력(strength) × 게이지 파워 × 조준 방향으로 초기 속도 벡터
 * V0 = (v0x, v0y, v0z)를 만들고, 매 프레임 바람 벡터와 공기저항으로
 * 수평 감속/편향, 중력으로 수직 하강을 적용한다.
 * 가상 높이 z <= 0 이 되는 순간 착수 — (x_land, y_land)를 확정한다.
 *
 * 렌더링 규칙 (Phaser 쪽):
 *  - 그림자(Shadow)는 순수 (x, y) 좌표로 수면을 미끄러지듯 이동
 *  - 찌(Float)는 화면 y_render = y - z 로 보정해 포물선 비행 연출
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

/** 바람 벡터 (수평 가속 성분, px/s²) */
export interface WindVector {
  x: number;
  y: number;
}

/** 캐스팅 발사 파라미터 */
export interface CastLaunchParams {
  /** 발사 원점 (탑다운 월드 px) */
  originX: number;
  originY: number;
  /** 조준 방향 (정규화 벡터) */
  dirX: number;
  dirY: number;
  /** 게이지 파워 (0.0 ~ 1.0) */
  power: number;
  /** 캐릭터 완력 스탯 (기본 12) */
  strength: number;
  /** 실시간 바람 벡터 */
  wind: WindVector;
  /** 채비 공기저항 계수 (0.2 가벼움 ~ 0.8 무거움/저항 큼) — 기본 0.4 */
  airDragCd?: number;
}

/** 비행 중인 캐스팅 발사체 상태 */
export interface CastProjectile {
  x: number;
  y: number;
  /** 가상 높이 (px 단위 스케일) */
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** 경과 시간 (초) */
  t: number;
  landed: boolean;
  wind: WindVector;
  airDragCd: number;
}

/** 중력 가속도 (px/s², 탑다운 스케일 보정값) */
const GRAVITY = 420;

/** 캐스팅 발사체 생성 — 완력·파워에 비례한 초기 벡터 */
export function launchCast(p: CastLaunchParams): CastProjectile {
  // 수평 초기 속도: 파워 + 완력 기여 (맞바람 극복은 비행 중 바람 가속으로 반영)
  const horizontal = 170 + p.power * 230 + p.strength * 6;
  // 수직 초기 속도: 포물선 고각 — 파워가 클수록 높게 떠서 멀리 감
  const vertical = 120 + p.power * 150;

  return {
    x: p.originX,
    y: p.originY,
    z: 6,
    vx: p.dirX * horizontal,
    vy: p.dirY * horizontal,
    vz: vertical,
    t: 0,
    landed: false,
    wind: p.wind,
    airDragCd: p.airDragCd ?? 0.4,
  };
}

/**
 * 비행 1스텝 진행 (dtSec 초). 상태를 제자리 갱신하며,
 * z <= 0 도달 시 landed = true 로 확정하고 (x, y)가 착수 좌표가 된다.
 */
export function stepCast(proj: CastProjectile, dtSec: number): CastProjectile {
  if (proj.landed) return proj;

  // 수평: 바람 가속 + 공기저항 감속
  proj.vx += (proj.wind.x - proj.vx * proj.airDragCd) * dtSec;
  proj.vy += (proj.wind.y - proj.vy * proj.airDragCd) * dtSec;
  // 수직: 중력
  proj.vz -= GRAVITY * dtSec;

  proj.x += proj.vx * dtSec;
  proj.y += proj.vy * dtSec;
  proj.z += proj.vz * dtSec;
  proj.t += dtSec;

  if (proj.z <= 0) {
    proj.z = 0;
    proj.landed = true;
  }
  return proj;
}

/**
 * 발사 파라미터 기준 예상 비행 시뮬레이션 (조준 가이드용).
 * 최대 maxSteps 프레임(60fps 가정)까지 전체 궤적을 미리 계산해 반환.
 */
export function simulateCastTrajectory(p: CastLaunchParams, maxSteps = 300): { x: number; y: number; z: number }[] {
  const proj = launchCast(p);
  const points: { x: number; y: number; z: number }[] = [];
  const dt = 1 / 60;
  for (let i = 0; i < maxSteps && !proj.landed; i++) {
    stepCast(proj, dt);
    points.push({ x: proj.x, y: proj.y, z: proj.z });
  }
  return points;
}
