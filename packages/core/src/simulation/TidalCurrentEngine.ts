/**
 * @file TidalCurrentEngine.ts
 * @description 조류 종류별 물리 연산 엔진 — 조수/본대조류/횡조류/반탄류/조경지대
 *
 * 1인칭 낚시에서 채비(X: 좌우, Y: 수면 거리, Z: 수심)에 매 프레임 가해지는
 * 조류 힘을 Y거리 기반 존(Zone)으로 판정한다.
 *
 *  - 조수(전역): V_tide = 물때 계수(0.5~1.5) × sin(2π/12.5 × t) — 밀물/썰물 방향.
 *  - 반탄류(발앞 Y<counterMax): 벽에 부딪혀 되돌아 나가는 척력 — 거리 증가(+Y).
 *  - 조경지대(ripMin~ripMax): 조류 상쇄·수직 침강 강화 — Hit Zone (입질 보너스, 포말).
 *  - 횡조류(중거리): 일정한 좌/우 X 흐름 — 밑밥/채비가 나란히 흘러감.
 *  - 본대조류(Y>mainMin): X 유속 3배 — 정렬 불가·입질 급감.
 *
 * 존 경계는 캐스팅 최대거리에 비례해 스케일한다 (맵/캐스팅 거리와 무관하게 성립).
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

/** 3차원 위치/힘 (X: 좌우 m, Y: 수면 거리 m, Z: 수심 m) */
export interface TidalVector3 {
  x: number;
  y: number;
  z: number;
}

/** 조류 존 종류 */
export type TidalZone = 'counter' | 'rip' | 'cross' | 'main';

export const TIDAL_ZONE_LABEL: Record<TidalZone, string> = {
  counter: '반탄류 구역',
  rip: '조경지대 (Hit Zone)',
  cross: '횡조류 구역',
  main: '본대조류 구역',
};

/** 프레임 연산 결과 */
export interface TidalInfluence {
  /** 이번 프레임 힘 벡터 (m/s) — 위치에 dt 곱해 적분 */
  force: TidalVector3;
  /** 현재 존 */
  zone: TidalZone;
  /** 표시 라벨 */
  label: string;
  /** 입질 확률 배율 (조경지대 1.6 / 본대조류 0.35 / 그 외 1.0) */
  biteMult: number;
  /** 침강 속도 배율 (조류가 강할수록 침강이 늦어짐 — 횡류 저항) */
  sinkMult: number;
}

export interface TidalEngineOptions {
  /** 물때 계수 0.5(조금) ~ 1.5(사리) */
  tideStrength: number;
  /** 밀물 여부 (썰물이면 X 흐름 반전) */
  isFloodTide: boolean;
  /** 횡조류 기본 속도 (m/s) — 부호가 곧 방향 (+우 / -좌) */
  crossSpeed: number;
  /** 캐스팅 최대 거리 (m) — 존 경계 스케일 기준 */
  maxCastM: number;
  /** RNG 주입 (조경지대 위치 흔들림용) */
  rng?: () => number;
}

export class TidalCurrentEngine {
  readonly tideStrength: number;
  readonly isFloodTide: boolean;
  private readonly crossBase: number;
  /** 존 경계 (m) */
  readonly counterMaxY: number;
  readonly ripMinY: number;
  readonly ripMaxY: number;
  readonly mainMinY: number;

  constructor(opts: TidalEngineOptions) {
    this.tideStrength = Math.min(1.5, Math.max(0.5, opts.tideStrength));
    this.isFloodTide = opts.isFloodTide;
    // 썰물이면 횡류 방향 반전 (조수 방향성)
    this.crossBase = opts.crossSpeed * (opts.isFloodTide ? 1 : -1);

    // 존 경계 — 캐스팅 최대거리 비례 (발앞 18% / 조경 55~72% / 본류 120%+)
    const rng = opts.rng ?? Math.random;
    const jitter = 0.9 + rng() * 0.2;
    this.counterMaxY = Math.max(3, opts.maxCastM * 0.18);
    this.ripMinY = opts.maxCastM * 0.55 * jitter;
    this.ripMaxY = this.ripMinY + Math.max(2.5, opts.maxCastM * 0.14);
    this.mainMinY = opts.maxCastM * 1.2;
  }

  /** 현재 시각 조수 계수 — V_tide = 물때 × sin(2π/12.5 × t시간) (반일주조 12.5h 주기) */
  tideFactor(hoursNow: number): number {
    const s = Math.sin((2 * Math.PI / 12.5) * hoursNow);
    // 0에 수렴하는 정조 시간대에도 최소 흐름 유지
    return this.tideStrength * (0.35 + 0.65 * Math.abs(s));
  }

  /** 존 판정 */
  zoneAt(y: number): TidalZone {
    if (y < this.counterMaxY) return 'counter';
    if (y >= this.ripMinY && y <= this.ripMaxY) return 'rip';
    if (y > this.mainMinY) return 'main';
    return 'cross';
  }

  /**
   * 매 프레임 조류 영향 연산.
   * @param pos 현재 채비 위치 (x 좌우, y 수면 거리, z 수심)
   * @param sinkMps 채비 자체 침강 속도 (조류 존이 배율을 곱함)
   * @param hoursNow 현재 시각 (시 단위 — 조수 사인 주기)
   */
  calc(pos: TidalVector3, sinkMps: number, hoursNow: number): TidalInfluence {
    const vt = this.tideFactor(hoursNow);
    const cross = this.crossBase * vt;
    const zone = this.zoneAt(pos.y);

    let fx = 0;
    let fy = 0;
    let fz = sinkMps;
    let biteMult = 1.0;
    let sinkMult = 1.0;

    switch (zone) {
      case 'counter':
        // 벽면 반사 — 좌우 약화 + 낚시꾼에게서 멀어지는 척력(+Y, 수면거리 증가)
        fx = cross * 0.2;
        fy = 0.10 * this.tideStrength;
        break;
      case 'rip':
        // 흐름 상쇄 + 하강 기류 — 미끼가 안정적으로 가라앉는 Hit Zone
        fx = cross * 0.1;
        fy = 0.015;
        sinkMult = 1.35;
        fz = sinkMps * sinkMult;
        biteMult = 1.6;
        break;
      case 'main':
        // 본류 — 매우 빠른 좌우 유속, 줄이 밀리며 거리 소폭 감소, 입질 급감
        fx = cross * 3.0;
        fy = -0.06;
        sinkMult = 0.55;
        fz = sinkMps * sinkMult;
        biteMult = 0.35;
        break;
      case 'cross':
      default:
        // 횡조류 — 원심력/라인 처짐으로 거리가 조금씩 줄어드는 방향
        fx = cross;
        fy = -0.018;
        // 조류가 강할수록 침강 저항 (횡류에 채비가 눕는다)
        sinkMult = 1 / (1 + Math.abs(cross) * 0.6);
        fz = sinkMps * sinkMult;
        break;
    }

    return { force: { x: fx, y: fy, z: fz }, zone, label: TIDAL_ZONE_LABEL[zone], biteMult, sinkMult };
  }

  /** 횡조류 X 속도 (UI 표시/찌 이동용) */
  crossSpeedNow(hoursNow: number): number {
    return this.crossBase * this.tideFactor(hoursNow);
  }
}
