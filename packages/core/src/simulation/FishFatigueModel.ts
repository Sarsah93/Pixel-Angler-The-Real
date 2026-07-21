/**
 * @file FishFatigueModel.ts
 * @description 파이트 피로 구간 모델 — 어종·사이즈별 4페이즈 (mock 데이터, API 아님)
 *
 * 스태미나 풀 = staminaBase(어종) × sizeFactor(무게^0.6) — 대물일수록 오래 버티고,
 * 소형은 금방 지친다. 잔여 비율 r로 4페이즈 전이:
 *  RUN(r>0.65)   강한 러닝 — thrust 최대, 줄 풀림 (버티기 구간)
 *  LULL(0.35~)   소강 — thrust 중간 (펌핑으로 줄 회수)
 *  SURGE(0.15~)  파상 저항 — 간헐 폭발(머리 흔들기·마지막 다이브, 줄터짐 위험 최고)
 *  SPENT(≤0.15)  제압 — thrust 붕괴, 옆으로 롤·부상 (랜딩 윈도우)
 *
 * 회복(고증): 슬랙(릴링·견제 없이 텐션을 풀어주면) 스태미나가 소폭 회복 —
 * "긴장 유지" 스킬 요소. 서지 버스트는 잔여 스태미나 × runPower 진폭의 주기 폭발.
 *
 * 소비: 페이즈가 thrust 출력 상한(thrustGate)을 게이팅하고, SPENT는
 * FightPhysics2D 저스태미나 롤/1인칭 제압 연출로 연결된다.
 * 순수 TS — 렌더/브라우저 API 없음.
 */

/** 피로 페이즈 */
export type FatiguePhase = 'RUN' | 'LULL' | 'SURGE' | 'SPENT';

export const FATIGUE_PHASE_LABEL: Record<FatiguePhase, string> = {
  RUN: '강한 러닝', LULL: '소강', SURGE: '파상 저항', SPENT: '제압',
};

/** 어종별 스태미나 기저 (mock — movementProfile.staminaScale과 정합, 튜닝 대상) */
export const STAMINA_BASE: Record<string, number> = {
  yellowtail: 1.7,          // 방어
  amberjack: 1.8,           // 부시리
  greater_amberjack: 1.9,   // 잿방어
  spanish_mackerel: 1.0,    // 삼치
  pacific_cod: 1.2,         // 대구
  red_seabream: 1.1,        // 참돔
  sea_bass: 0.95,           // 농어
  flatfish: 0.7,            // 광어
  squid: 0.55,              // 무늬오징어
  cuttlefish: 0.55,         // 갑오징어
  dark_banded_rockfish: 0.6, // 볼락
};
export const DEFAULT_STAMINA_BASE = 0.9;

/** 스태미나 풀 산출 — sizeFactor ≈ weightKg^0.6 (하한 0.35) */
export function staminaMaxFor(speciesId: string, weightKg: number): number {
  const base = STAMINA_BASE[speciesId] ?? DEFAULT_STAMINA_BASE;
  return base * Math.max(0.35, Math.pow(Math.max(0.05, weightKg), 0.6));
}

export interface FatigueInput {
  dtSec: number;
  /** 릴링 중 (드랙 저항으로 피로 가속) */
  reeling: boolean;
  /** 뒷줄견제/버티기 중 */
  holding: boolean;
  /** 현재 장력 비율 (0~1) — 높을수록 물고기가 힘을 쓰며 지침 */
  tensionRatio: number;
  /** 0~1 난수 (core 순수성 — 호출부 주입, 미지정 시 서지 없음) */
  randomUnit?: number;
}

export interface FatigueTick {
  phase: FatiguePhase;
  /** 잔여 스태미나 비율 (0~1) */
  ratio: number;
  /** thrust 출력 상한 게이트 (0~1.x — 서지 버스트 시 1 초과) */
  thrustGate: number;
  /** 이번 틱 서지 버스트 진폭 (0 = 없음) */
  surgeBurst: number;
  /** 슬랙으로 회복 중 여부 (긴장 유지 경고) */
  recovering: boolean;
}

/** 페이즈별 thrust 기본 게이트 */
const PHASE_GATE: Record<FatiguePhase, number> = {
  RUN: 1.0, LULL: 0.62, SURGE: 0.5, SPENT: 0.22,
};

export class FishFatigueModel {
  readonly staminaMax: number;
  private stamina: number;
  private readonly runPower: number;
  /** 다음 서지까지 남은 시간 (초) */
  private surgeIn = 3 + Math.random() * 0;   // 결정성: 첫 값은 update의 rng로 재설정
  /** 진행 중 서지 잔여 시간 */
  private surgeLeft = 0;
  private surgeSeeded = false;

  constructor(speciesId: string, weightKg: number, runPower = 1) {
    this.staminaMax = staminaMaxFor(speciesId, weightKg);
    this.stamina = this.staminaMax;
    this.runPower = runPower;
  }

  /** 잔여 비율 (0~1) */
  get ratio(): number {
    return this.staminaMax > 0 ? this.stamina / this.staminaMax : 0;
  }

  get phase(): FatiguePhase {
    const r = this.ratio;
    if (r > 0.65) return 'RUN';
    if (r > 0.35) return 'LULL';
    if (r > 0.15) return 'SURGE';
    return 'SPENT';
  }

  update(input: FatigueInput): FatigueTick {
    const { dtSec, reeling, holding, tensionRatio } = input;
    const rng = input.randomUnit;

    // ── 피로 누적: 장력이 높을수록 + 릴링/견제 저항일수록 빠르게 지침 ──
    const drainFrac =
      0.008
      + Math.max(0, tensionRatio) * 0.05
      + (reeling ? 0.014 : 0)
      + (holding ? 0.008 : 0);

    // ── 회복: 슬랙(무입력 + 낮은 장력)이면 소폭 회복 — 쉬게 두면 다시 뛴다 ──
    const recovering = !reeling && !holding && tensionRatio < 0.25 && this.ratio < 0.98;
    const recoverFrac = recovering ? 0.025 : 0;

    // 드레인은 절대량(√풀 스케일) — 풀이 큰 대물일수록 잔여 "비율"이 천천히 감소해
    // 오래 버티고, 소형은 금방 지친다 (비율 드레인이면 사이즈 풀이 무의미해짐)
    this.stamina = Math.max(0, Math.min(this.staminaMax,
      this.stamina
      + recoverFrac * dtSec * this.staminaMax
      - drainFrac * dtSec * Math.sqrt(this.staminaMax),
    ));

    const phase = this.phase;

    // ── 서지 버스트 (간헐 폭발 — SURGE 페이즈에서 빈도↑, 진폭 = 잔여 × runPower) ──
    let surgeBurst = 0;
    if (phase !== 'SPENT' && rng !== undefined) {
      if (!this.surgeSeeded) {
        this.surgeSeeded = true;
        this.surgeIn = (phase === 'SURGE' ? 2 : 5) + rng * (phase === 'SURGE' ? 2 : 4);
      }
      if (this.surgeLeft > 0) {
        this.surgeLeft -= dtSec;
        surgeBurst = Math.max(0.2, this.ratio) * this.runPower * 1.2;
      } else {
        this.surgeIn -= dtSec;
        if (this.surgeIn <= 0) {
          this.surgeLeft = 0.5;
          this.surgeIn = (phase === 'SURGE' ? 2 : 5) + rng * (phase === 'SURGE' ? 2 : 4);
        }
      }
    }

    return {
      phase,
      ratio: this.ratio,
      thrustGate: PHASE_GATE[phase] + surgeBurst,
      surgeBurst,
      recovering,
    };
  }
}
