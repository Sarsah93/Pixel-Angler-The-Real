/**
 * @file SizeTierRules.ts
 * @description 중대형 어종 크기 등급(소/중/대) + 루어 무게·시간대·수심 게이트 규칙
 *
 * 실데이터 근거 (2026-07 리서치):
 *  - 성체 안에서도 크기대가 갈리므로 roll 길이(cm)로 sizeTier를 파생
 *    (방어 출세어 기준: 와카시 ~20 → 이나다 ~40 → 와라사 ~60 → 부리 ~80cm)
 *  - 루어가 크고 무거울수록 대물 가중 — 단 소형 tier는 작은 루어로도 항상 가능
 *  - 중형↑ 청물(방어·부시리·잿방어·삼치)은 급심(50m↑) 주간 위주 —
 *    일몰 후 입질 소멸(주간 전용), 얕은 연안은 저확률
 *  - 예외: 농어 = 야행성 + 포말지대(isWashZone) 저녁~야간 강세 → 게이트 미적용
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

/** 크기 등급 */
export type SizeTier = 'small' | 'medium' | 'large';

export const SIZE_TIER_LABEL: Record<SizeTier, string> = {
  small: '소형', medium: '중형', large: '대형',
};

/**
 * 어종별 tier 경계 [소형 상한, 중형 상한] (cm) — 초과 시 대형.
 * 등재되지 않은 어종은 tier 규칙 미적용 (기존 가우시안 roll 그대로).
 */
export const SIZE_TIER_BOUNDS: Record<string, [number, number]> = {
  yellowtail: [35, 70],          // 방어 (70+ 대방어 5kg+)
  amberjack: [40, 80],           // 부시리 (80+ 10kg+)
  greater_amberjack: [50, 100],  // 잿방어 (100+ 대물)
  spanish_mackerel: [50, 80],    // 삼치 (80+ 1m 근접)
  pacific_cod: [40, 70],         // 대구
  sea_bass: [40, 70],            // 농어 (70+ 미터급)
  red_seabream: [30, 55],        // 참돔 (55+ 1m급)
};

/** 중형↑ = 급심 주간 전용 게이트가 걸리는 청물 회유어 (농어는 예외 — 미포함) */
export const PELAGIC_DAYTIME_SPECIES: ReadonlySet<string> = new Set([
  'yellowtail', 'amberjack', 'greater_amberjack', 'spanish_mackerel',
]);

/** roll된 길이 → 크기 등급 (경계 미등재 어종은 max 대비 비율로 근사) */
export function classifySizeTier(speciesId: string, lengthCm: number, maxCm: number): SizeTier {
  const bounds = SIZE_TIER_BOUNDS[speciesId];
  if (bounds) {
    if (lengthCm <= bounds[0]) return 'small';
    if (lengthCm <= bounds[1]) return 'medium';
    return 'large';
  }
  const r = maxCm > 0 ? lengthCm / maxCm : 0;
  return r < 0.4 ? 'small' : r < 0.72 ? 'medium' : 'large';
}

/** tier 확률 컨텍스트 */
export interface TierRollContext {
  /** 루어 채비 총중량 (g) — 미끼 채비면 undefined */
  lureWeightG?: number;
  /** 착수 지점 바닥 수심 (m) */
  zMax: number;
  isNight: boolean;
  /** 보일링 히트 등 이벤트 tier 상향 가중 (회유어 대물 확률↑) */
  eventTierBoost?: boolean;
}

/**
 * 어종·컨텍스트별 [소/중/대] 확률 가중 산출.
 *
 *  - 루어 무게: 클수록 중·대형 가중 (소형 하한은 항상 열림)
 *  - 청물 주간 게이트: 야간엔 중·대형 소멸 (소형만)
 *  - 급심 게이트: 수심 50m 기준 비율로 중·대형 가중 축소 (얕은 방파제 저확률)
 */
export function rollTierWeights(speciesId: string, ctx: TierRollContext): [number, number, number] {
  // 기본 분포 — 소형 위주
  let w: [number, number, number] = [0.55, 0.33, 0.12];

  // 루어 무게 가중 (지깅 대형 지그 → 대물)
  const lw = ctx.lureWeightG ?? 0;
  if (lw >= 40) w = [0.30, 0.40, 0.30];
  else if (lw >= 28) w = [0.38, 0.40, 0.22];
  else if (lw >= 14) w = [0.48, 0.36, 0.16];
  else if (lw > 0 && lw < 10) w = [0.70, 0.25, 0.05];

  // 청물 주간 전용 — 일몰 후 중형↑ 입질 소멸
  if (PELAGIC_DAYTIME_SPECIES.has(speciesId) && ctx.isNight) {
    w = [w[0] + w[1] + w[2] - 0.02, 0.02, 0];
  }

  // 급심 게이트 — 중·대형은 깊은 물에서 부상 (50m 기준, 얕으면 저확률)
  const depthFactor = Math.min(1, Math.max(0.15, ctx.zMax / 50));
  w = [w[0], w[1] * depthFactor, w[2] * depthFactor * depthFactor];

  // 보일링 히트 등 이벤트 tier 상향 — 소형 확률 일부를 중·대형으로 이전
  if (ctx.eventTierBoost) {
    const shift = w[0] * 0.4;
    w = [w[0] - shift, w[1] + shift * 0.6, w[2] + shift * 0.4];
  }

  const sum = w[0] + w[1] + w[2];
  return [w[0] / sum, w[1] / sum, w[2] / sum];
}

/**
 * tier 규칙 기반 길이 roll (cm).
 * 등재 어종만 호출 — tier 추첨 후 해당 구간 안에서 삼각 분포로 길이 결정.
 *
 * 소형 밴드는 오라클 minCm보다 낮아도 열린다 — 방어 출세어(와카시급)처럼
 * 성체 스폰 하한(minCm 50) 아래의 유어(20~35cm)가 소형 tier로 낚이는 고증.
 */
export function rollTieredLength(
  speciesId: string, minCm: number, maxCm: number, ctx: TierRollContext,
  rng: () => number = Math.random,
): number {
  const bounds = SIZE_TIER_BOUNDS[speciesId];
  if (!bounds) return -1;

  const [pS, pM] = rollTierWeights(speciesId, ctx);
  const r = rng();
  const tier: SizeTier = r < pS ? 'small' : r < pS + pM ? 'medium' : 'large';

  // 소형 하한 = min(오라클 minCm, 소형 상한의 절반) — 유어 구간 확보
  const smallLo = Math.min(minCm, Math.max(10, Math.round(bounds[0] * 0.5)));
  const lo = tier === 'small' ? smallLo : tier === 'medium' ? bounds[0] : bounds[1];
  const hi = tier === 'small' ? bounds[0] : tier === 'medium' ? Math.min(bounds[1], maxCm) : maxCm;
  if (hi <= lo) return lo;
  // 구간 내 삼각 분포 (하단 편향 — 같은 tier 안에서도 작은 개체가 흔함)
  const t = Math.min(rng(), rng());
  return lo + (hi - lo) * t;
}
