/**
 * @file SeabedProfile.ts
 * @description 유저↔투척 지점 사이 해저 지형 프로필 (거리 기반 연속 지형)
 *
 * 캐스팅 시드로 결정되는 연속 해저 단면 — 수심 모식도의 바닥 렌더와
 * 채비 바닥 안착/밑걸림(여밭) 판정의 단일 기준.
 *
 *  - 기반 수심: 발앞(거리 0)은 얕고 멀어질수록 깊어진다 (완만한 멱함수).
 *  - 암초/여밭: 값 노이즈(연속) 기반 — 높낮이가 있는 융기 지대가 이어지다
 *    자연스럽게 모래 바닥으로 전환된다 (갑자기 끊기지 않음).
 *  - 해조류(켈프): 암초 지대 중 노이즈가 짙은 곳에 자란다.
 *
 * 추후 어탐 레이더 기능이 이 프로필을 그대로 조회하는 것을 전제로 설계
 * (거리 → 수심/지형 종류/해조류를 결정적으로 반환).
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

/** 지형 샘플 (렌더/어탐용) */
export interface SeabedSample {
  /** 거리 (m, 0 = 유저 발앞) */
  d: number;
  /** 해저 수심 (m) */
  depth: number;
  /** 암초/여밭 여부 */
  rock: boolean;
  /** 해조류(켈프) 여부 */
  kelp: boolean;
}

/** 정수 해시 → [0,1) */
function hash01(seed: number, i: number): number {
  let h = (seed ^ Math.imul(i + 0x9e3779b9, 2654435761)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 코사인 보간 값 노이즈 (연속) */
function valueNoise(seed: number, x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash01(seed, i);
  const b = hash01(seed, i + 1);
  const t = (1 - Math.cos(f * Math.PI)) / 2;
  return a * (1 - t) + b * t;
}

export class SeabedProfile {
  private readonly seed: number;
  readonly maxDepthM: number;
  readonly maxDistM: number;

  /**
   * @param seed 캐스팅 착수 시드 (reefSeed)
   * @param maxDepthM 최대 수심 (지역 Z_max)
   * @param maxDistM 프로필 범위 (캐스팅 최대 거리 + 여유)
   */
  constructor(seed: number, maxDepthM: number, maxDistM: number) {
    this.seed = seed >>> 0;
    this.maxDepthM = Math.max(2, maxDepthM);
    this.maxDistM = Math.max(8, maxDistM);
  }

  /** 기반 수심 — 발앞 얕고 멀수록 깊다 (암초 융기 미반영) */
  private baseDepth(d: number): number {
    const t = Math.min(1, Math.max(0, d / this.maxDistM));
    return this.maxDepthM * (0.16 + 0.84 * Math.pow(t, 0.8));
  }

  /** 암초 강도 0~1 (연속 노이즈 — 6m 셀) */
  private rockiness(d: number): number {
    return valueNoise(this.seed, d / 6);
  }

  /** 암초 지대 여부 (여밭 — 밑걸림/입질 지형 판정) */
  isRockAt(d: number): boolean {
    return this.rockiness(Math.max(0, d)) > 0.55;
  }

  /** 해조류(켈프) 여부 — 짙은 암초 지대에만 */
  hasKelpAt(d: number): boolean {
    return this.rockiness(Math.max(0, d)) > 0.72 && valueNoise(this.seed ^ 0x5f3759df, d / 3) > 0.5;
  }

  /**
   * 거리 d 지점의 해저 수심 (m).
   * 암초 지대는 기반 수심에서 융기(최대 45%)해 얕아진다 — 높낮이/단차가 있는
   * 암초 지대가 이어지다 모래 바닥으로 자연스럽게 전환된다.
   */
  depthAt(d: number): number {
    const dd = Math.max(0, d);
    const base = this.baseDepth(dd);
    const r = this.rockiness(dd);
    // 0.55 초과분에 비례한 융기 + 세부 요철(1.7m 셀 노이즈)
    const rise = r > 0.55
      ? base * (0.45 * ((r - 0.55) / 0.45)) * (0.55 + 0.45 * valueNoise(this.seed ^ 0x1234abcd, dd / 1.7))
      : 0;
    return Math.min(this.maxDepthM, Math.max(0.8, base - rise));
  }

  /** 렌더/어탐용 균일 샘플 n개 (d: 0 → maxDist) */
  sample(n: number): SeabedSample[] {
    const out: SeabedSample[] = [];
    for (let i = 0; i < n; i++) {
      const d = (i / (n - 1)) * this.maxDistM;
      out.push({ d, depth: this.depthAt(d), rock: this.isRockAt(d), kelp: this.hasKelpAt(d) });
    }
    return out;
  }
}
