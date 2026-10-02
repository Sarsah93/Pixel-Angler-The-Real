/**
 * @file LandingDrop.ts
 * @description 랜딩(들어뽕) 바늘 빠짐 판정 — 196차
 *
 * 파이트를 이겨 고기를 수면에 띄워도, **물 밖으로 들어 올리는 순간** 입에 걸린 바늘이 빠지는 일이
 * 실제로 꽤 잦다(사용자 지적 — 통계로도 검증된 얘기). 그래서 낚시 성공 팝업이 뜰 때 한 번 더 판정한다.
 *
 * 사용자 지정 기준값(발판 2m 이하 · 40cm 미만 · 뜰채 없음)
 *   - 한 마리 0.5% · 두 마리 중 한 마리 0.5% · 세 마리 중 한 마리 1%
 *   - 전갱이는 입이 약하다 → 위 모든 경우 +1%p
 *   - **한 마리만** 빠진다 — 둘 다·셋 중 둘·셋 다는 없다(밸런스)
 *
 * 196차에 얹은 현실 요인(수치는 임의 설정 — 사용자 위임)
 *   - 발판 높이: 들어 올리는 높이가 2m를 넘으면 1m마다 +0.5%p, 무거울수록 더(× (1 + 무게kg, 최대 3배)).
 *     방파제 상판(약 4m)에서 1kg 고기를 뜰채 없이 들면 +2%p — 바늘 구멍이 무게로 찢어진다.
 *   - 테트라포드: 들어 올리다 블록에 부딪힌다 +0.5%p.
 *   - 모래·자갈 해변: 들지 않고 끌어 올린다 → 기준값 절반.
 *   - 큰 고기(40cm 이상): +1.5%p, 40cm를 넘는 1cm마다 +0.1%p, 최대 +4%p.
 *   - 뜰채: **쓸 수 있으면 0**. 자루가 짧아 수면까지 닿지 않으면(높이 + 담글 여유 0.5m) 못 쓴다.
 *     테트라포드 구멍치기는 틈이 좁아 뜰채가 들어가지 않는다.
 *   - 상한 25%.
 *
 * 순수 판정만 둔다 — 발판·뜰채·고기 목록·난수는 호출측이 넘긴다.
 */

/** 발판 종류 — 탑다운에서 캐릭터가 선 자리로 정한다 */
export type FootingKind =
  | 'beach' | 'rocks' | 'riprap' | 'quay' | 'breakwater_top' | 'tetrapod' | 'hole' | 'boat';

/** 발판별 평균 들어 올림 높이(m, 평균 해수면 기준) */
export const FOOTING_LIFT_M: Readonly<Record<FootingKind, number>> = {
  beach: 0, rocks: 1.2, riprap: 1.8, quay: 2.5, breakwater_top: 4.0, tetrapod: 3.0, hole: 2.5, boat: 1.2,
};

/** 발판 이름(위키·도움말·결과 문구) */
export const FOOTING_LABEL: Readonly<Record<FootingKind, string>> = {
  beach: '해변', rocks: '갯바위', riprap: '사석', quay: '안벽', breakwater_top: '방파제 상판',
  tetrapod: '테트라포드', hole: '테트라포드 구멍', boat: '배',
};

/** 마릿수별 기준 확률(사용자 지정) */
export const LANDING_DROP_BASE: Readonly<Record<1 | 2 | 3, number>> = { 1: 0.005, 2: 0.005, 3: 0.01 };
/** 입이 약한 어종의 가산(%p) — 전갱이 */
export const WEAK_MOUTH_ADD: Readonly<Record<string, number>> = { horse_mackerel: 0.01 };
/** 들어 올림 높이 기준선(m) — 이 높이까지는 기준값 그대로 */
export const LIFT_FREE_M = 2;
/** 기준선 위 1m당 가산 */
export const LIFT_ADD_PER_M = 0.005;
/** 무게 배율 상한(1 + kg, 최대 3) */
export const LIFT_WEIGHT_MULT_MAX = 3;
/** 테트라포드 블록 충돌 가산 */
export const TETRAPOD_ADD = 0.005;
/** 해변(끌어올림) 배율 */
export const BEACH_MULT = 0.5;
/** 큰 고기 기준 길이(cm) · 가산 */
export const BIG_FISH_CM = 40;
export const BIG_FISH_ADD = 0.015;
export const BIG_FISH_ADD_PER_CM = 0.001;
export const BIG_FISH_ADD_MAX = 0.04;
/** 뜰채를 수면에 담글 여유(m) */
export const NET_DIP_MARGIN_M = 0.5;
/** 판정 상한 */
export const LANDING_DROP_MAX = 0.25;

export interface LandingFish {
  speciesId: string;
  lengthCm: number;
  weightG: number;
}

export interface LandingDropInput {
  /** 이번에 낚아 올린 무리(문 고기 포함 1~3마리) */
  fish: readonly LandingFish[];
  footing: FootingKind;
  /** 물때로 달라지는 높이(m) — 간조면 +, 만조면 −. 없으면 0 */
  tideLiftM?: number;
  /** 손에 든 뜰채 자루 길이(m) — 없으면 null */
  netReachM: number | null;
}

export interface LandingDropOdds {
  /** 최종 확률(0~LANDING_DROP_MAX) */
  chance: number;
  /** 들어 올린 높이(m) */
  liftM: number;
  /** 뜰채로 떴는가(확률 0) */
  netUsed: boolean;
  /** 뜰채를 들었지만 자루가 짧거나 구멍이라 못 썼는가 */
  netBlocked: boolean;
  /** 항목별 가산(위키·검증용) */
  parts: { base: number; weakMouth: number; lift: number; tetrapod: number; bigFish: number; beachMult: number };
}

/** 이 발판·높이에서 뜰채를 쓸 수 있는가 */
export function netUsable(footing: FootingKind, liftM: number, netReachM: number | null): boolean {
  if (netReachM === null || netReachM <= 0) return false;
  if (footing === 'hole') return false;   // 블록 틈이 좁아 뜰채가 들어가지 않는다
  return netReachM >= liftM + NET_DIP_MARGIN_M;
}

/** 확률 산출 */
export function landingDropOdds(input: LandingDropInput): LandingDropOdds {
  const n = Math.max(1, Math.min(3, input.fish.length)) as 1 | 2 | 3;
  const liftM = Math.max(0, FOOTING_LIFT_M[input.footing] + (input.tideLiftM ?? 0));
  const parts = { base: 0, weakMouth: 0, lift: 0, tetrapod: 0, bigFish: 0, beachMult: 1 };
  const netOk = netUsable(input.footing, liftM, input.netReachM);
  if (netOk) return { chance: 0, liftM, netUsed: true, netBlocked: false, parts };

  parts.base = LANDING_DROP_BASE[n];
  parts.weakMouth = Math.max(0, ...input.fish.map((f) => WEAK_MOUTH_ADD[f.speciesId] ?? 0));
  const kg = input.fish.reduce((a, f) => a + Math.max(0, f.weightG), 0) / 1000;
  parts.lift = Math.max(0, liftM - LIFT_FREE_M) * LIFT_ADD_PER_M * Math.min(LIFT_WEIGHT_MULT_MAX, 1 + kg);
  if (input.footing === 'tetrapod' || input.footing === 'hole') parts.tetrapod = TETRAPOD_ADD;
  const maxLen = Math.max(0, ...input.fish.map((f) => f.lengthCm));
  if (maxLen >= BIG_FISH_CM) {
    parts.bigFish = Math.min(BIG_FISH_ADD_MAX, BIG_FISH_ADD + (maxLen - BIG_FISH_CM) * BIG_FISH_ADD_PER_CM);
  }
  if (input.footing === 'beach') parts.beachMult = BEACH_MULT;
  const raw = (parts.base + parts.weakMouth) * parts.beachMult + parts.lift + parts.tetrapod + parts.bigFish;
  return {
    chance: Math.min(LANDING_DROP_MAX, raw),
    liftM, netUsed: false, netBlocked: input.netReachM !== null, parts,
  };
}

export interface LandingDropResult extends LandingDropOdds {
  /** 빠진 고기의 순번(input.fish 기준) — 안 빠졌으면 null. **최대 한 마리** */
  droppedIndex: number | null;
}

/**
 * 판정.
 * @param roll 빠짐 여부 난수(0~1)
 * @param pickRoll 어느 고기가 빠졌는가 난수(0~1)
 */
export function rollLandingDrop(input: LandingDropInput, roll: number, pickRoll: number): LandingDropResult {
  const odds = landingDropOdds(input);
  if (input.fish.length === 0 || roll >= odds.chance) return { ...odds, droppedIndex: null };
  const idx = Math.min(input.fish.length - 1, Math.floor(pickRoll * input.fish.length));
  return { ...odds, droppedIndex: idx };
}
