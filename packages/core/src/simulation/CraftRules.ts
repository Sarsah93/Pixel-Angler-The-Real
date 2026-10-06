/**
 * @file CraftRules.ts
 * @description 제작 판정 규칙 (222차 — 사용자 확정 기획 `.agents/CRAFTING_EXPANSION_SPEC.md`)
 *
 *  - **시간**: 1개 = `timeSec`(없으면 위치별 기본값) × 분야 숙련 · 손 상태 배수.
 *  - **품질**: 보통 / 좋음 / 훌륭함. 기본 22% · 3%에 분야 숙련이 조금 얹힌다(상한 있음 — 큰 이득 금지).
 *  - **실패**: 재료 하나하나를 따로 잃을 확률(`lossChance` · 공구 관리 스킬이 줄인다). 못 잃은 것은 돌려받는다.
 *  - **취소**(사용자 지정): 지금 만드는 1개의 진행이 25% 이하면 재료 전부 · 50% 이하면 절반 · 그 위면 전부 잃는다.
 *    「중지」는 지금 것을 마저 만들고 멈추는 것이라 잃는 게 없다.
 *  - **분야 숙련(손재주)**: 갈래(채비 · 봉돌·찌 …)마다 따로 쌓는 제작 경험. 레벨이 성공률 · 시간 · 품질을 조금씩 돕는다.
 *    「손재주」 = 분야 숙련 합 + 배운 제작 기술 숙련 + 레벨 몫(해루질 등 다른 손 쓰는 일에도 쓴다).
 *  - **손 상태**: 피로 · 다친 손(출혈 · 골절) · 몸살(오한 · 감기 · 독감) · 술이 성공률을 깎고 시간을 늘린다.
 *  - **레벨 차**(223차): 도면 최소 레벨보다 10 높을 때마다 성공 배수 +3%(상한 +9%) — 익숙한 일은 덜 틀린다.
 *  - **분해**(223차): 만든 물건(산출물)을 풀면 재료 1단위마다 `scrapReturn / 산출 수` 확률로 돌려받고,
 *    분해로 깨치는 도면이면 `chance + 손재주 몫`으로 도면을 얻는다. 사는 값보다 많이 돌려받지 않게 산출 수로 나눈다.
 *
 * 순수 규칙만 — 상태(큐 · 숙련 XP)는 클라이언트 `CraftingStore`.
 */

import { TUNING } from '../config/tuning.js';
import { CRAFT_DEFAULT_TIME_SEC, type CraftBlueprint, type CraftGroup } from '../db-schema/CraftingDatabase.js';

export type CraftQuality = 'normal' | 'good' | 'great';

export const CRAFT_QUALITY_LABEL: Record<CraftQuality, { ko: string; en: string }> = {
  normal: { ko: '보통', en: 'Normal' },
  good: { ko: '좋음', en: 'Good' },
  great: { ko: '훌륭함', en: 'Excellent' },
};

/** 분야 숙련 레벨 문턱(누적 XP) — 레벨 1~10 */
export const CRAFT_MASTERY_XP: readonly number[] = [20, 60, 130, 240, 400, 620, 900, 1250, 1700, 2250];
export const CRAFT_MASTERY_MAX = CRAFT_MASTERY_XP.length;

export function craftMasteryLevel(xp: number): number {
  let lv = 0;
  for (const t of CRAFT_MASTERY_XP) { if (xp >= t) lv++; else break; }
  return lv;
}

/** 다음 레벨 문턱(만렙이면 null) */
export function craftMasteryNextXp(level: number): number | null {
  return level >= CRAFT_MASTERY_MAX ? null : CRAFT_MASTERY_XP[level];
}

/** 손 상태 — 클라이언트가 지금 몸 상태에서 채운다 */
export interface CraftHandState {
  /** 피로 0~1 */
  fatigue: number;
  /** 출혈 · 골절 */
  injured: boolean;
  /** 오한 · 감기 · 독감 */
  ill: boolean;
  /** 술기운 */
  drunk: boolean;
}

export interface CraftModifiers {
  /** 성공률 배수(분야 숙련 × 손 상태) */
  successMult: number;
  /** 시간 배수(1보다 작으면 빨라짐) */
  timeMult: number;
  /** 좋음 이상 확률에 더할 몫(0~) */
  qualityBonus: number;
  /** 손 상태가 깎은 몫(0 = 멀쩡) — 창에 까닭을 보여 준다 */
  handPenalty: number;
  /** 깎인 까닭(한국어 낱말) */
  handNotes: string[];
}

/** 223차 — 도면 최소 레벨을 넘긴 만큼의 성공 배수 몫(10레벨마다 +3% · 상한 +9%) */
export function craftLevelBonus(level: number, minLevel = 0): number {
  const T = TUNING.craft;
  const steps = Math.floor(Math.max(0, level - minLevel) / 10);
  return Math.min(T.levelBonusCap, steps * T.levelBonusPer10);
}

/** 분야 숙련 레벨 + 손 상태(+ 223차 레벨 차 몫) → 배수 */
export function craftModifiers(masteryLv: number, hand: CraftHandState, levelBonus = 0): CraftModifiers {
  const T = TUNING.craft;
  const lv = Math.max(0, Math.min(CRAFT_MASTERY_MAX, masteryLv));
  const notes: string[] = [];
  let pen = 0;
  if (hand.fatigue >= T.handFatigueAt) { pen += T.handFatiguePenalty; notes.push('지침'); }
  if (hand.injured) { pen += T.handInjuryPenalty; notes.push('다친 손'); }
  if (hand.ill) { pen += T.handIllPenalty; notes.push('몸살'); }
  if (hand.drunk) { pen += T.handDrunkPenalty; notes.push('술기운'); }
  pen = Math.min(0.6, pen);
  return {
    successMult: (1 + lv * T.masterySuccessPerLv) * (1 + Math.max(0, levelBonus)) * (1 - pen),
    timeMult: Math.max(0.5, 1 - lv * T.masteryTimePerLv) * (1 + pen),
    qualityBonus: Math.min(T.qualityBonusCap, lv * T.masteryQualityPerLv),
    handPenalty: pen,
    handNotes: notes,
  };
}

/** 1개 성공률 — 도면 기본 × 스킬(매듭 숙련 등) × 숙련 · 손 상태, 0.05~0.99 */
export function craftSuccessFinal(bp: CraftBlueprint, skillMult: number, mods: CraftModifiers): number {
  return Math.max(0.05, Math.min(0.99, bp.baseSuccess * skillMult * mods.successMult));
}

/** 1개 시간(ms) */
export function craftUnitMs(bp: CraftBlueprint, mods: CraftModifiers): number {
  const sec = bp.timeSec ?? CRAFT_DEFAULT_TIME_SEC[bp.station];
  return Math.max(1000, Math.round(sec * 1000 * mods.timeMult));
}

/** 실패 시 재료 1단위를 잃을 확률 — 공구 관리(`craft_material` 배수)가 줄인다 */
export function craftLossChance(bp: CraftBlueprint, materialMult = 1): number {
  return Math.max(0, Math.min(1, (bp.lossChance ?? TUNING.craft.failLossChance) * materialMult));
}

/** 품질 굴림 — 기본 좋음 22% · 훌륭함 3% + 숙련 몫(좋음 4 : 훌륭함 1로 나눈다) */
export function rollCraftQuality(rng: () => number, bonus = 0): CraftQuality {
  const T = TUNING.craft;
  const great = T.qualityGreat + bonus * 0.2;
  const good = T.qualityGood + bonus * 0.8;
  const r = rng();
  if (r < great) return 'great';
  if (r < great + good) return 'good';
  return 'normal';
}

/**
 * 취소할 때 지금 만들던 1개의 재료를 돌려받는 비율(사용자 지정 계단).
 * 진행 ≤ 25% → 1 · ≤ 50% → 0.5 · 그 위 → 0.
 */
export function craftCancelRefund(progress: number): number {
  const T = TUNING.craft;
  if (progress <= T.cancelFullUpTo) return 1;
  if (progress <= T.cancelHalfUpTo) return 0.5;
  return 0;
}

/** 분야 숙련 XP — 성공은 도면 XP 그대로, 실패도 조금(손은 배운다) */
export function craftMasteryGain(bp: CraftBlueprint, success: boolean): number {
  return Math.max(1, Math.round(bp.xp * (success ? 1 : TUNING.craft.masteryFailShare)));
}

export interface DexterityInput {
  /** 분야별 숙련 레벨 */
  mastery: Partial<Record<CraftGroup, number>>;
  /** 배운 제작 기술들의 숙련 레벨(0~5) */
  craftSkillProf: number[];
  /** 캐릭터 레벨 */
  level: number;
}

/**
 * 손재주 — 분야 숙련 합 + 제작 기술 숙련 합 × 2 + 레벨 / 10.
 * 새 스탯을 만들지 않고 이미 쌓는 것들을 묶어 보여 준다(사용자 확정). 해루질 맨손 채집 등 손 쓰는 일의 바탕.
 */
export function dexterityScore(d: DexterityInput): number {
  const m = Object.values(d.mastery).reduce<number>((a, v) => a + (v ?? 0), 0);
  const p = d.craftSkillProf.reduce((a, v) => a + v, 0);
  return Math.round(m + p * 2 + Math.floor(d.level / 10));
}

/** 223차 — 분해 결과 한 줄(재료 1종) */
export interface CraftScrapLine {
  /** 재료 목록의 순번(bp.materials) */
  index: number;
  qty: number;
}

/**
 * 223차 — 산출물 1개를 분해했을 때 돌려받는 재료.
 * 재료 1단위마다 `TUNING.craft.scrapReturn / outputQty` 확률 — 한 번에 여러 개 나오는 도면(봉돌 2개 등)은
 * 하나를 풀어 봐야 재료의 일부만 나온다. 기대값이 언제나 재료값보다 작다(사서 풀어 재료를 버는 길 차단).
 */
export function craftScrapReturn(bp: CraftBlueprint, rng: () => number): CraftScrapLine[] {
  const p = Math.max(0, Math.min(1, TUNING.craft.scrapReturn / Math.max(1, bp.outputQty)));
  const out: CraftScrapLine[] = [];
  bp.materials.forEach((m, index) => {
    let n = 0;
    for (let k = 0; k < m.qty; k++) if (rng() < p) n++;
    if (n > 0) out.push({ index, qty: n });
  });
  return out;
}

/** 223차 — 분해로 도면을 깨칠 확률(분해로 얻는 도면만 · 손재주가 조금 돕는다) */
export function craftScrapLearnChance(bp: CraftBlueprint, dexterity: number): number {
  if (bp.learn?.via !== 'scrap') return 0;
  const T = TUNING.craft;
  return Math.min(T.scrapLearnCap, bp.learn.chance + Math.max(0, dexterity) * T.scrapLearnPerDex);
}
