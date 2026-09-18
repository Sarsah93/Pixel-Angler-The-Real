/**
 * @file SashimiQuality.ts
 * @description 사시미 접시 **맛 별 5개** (155차 — 사용자 지시 "사시미에도 불요리처럼 완성도 별도 기준").
 *
 * 불요리(`CookingSim.dishStarsAt`)와 같은 문법 — 다섯 항목을 각각 0~1로 채점하고, 문턱을 넘은 항목마다
 * 별 하나. 다섯째 별(완성도)은 앞 넷이 **전부** 문턱을 넘어야 켜진다(하나라도 모자라면 5별은 없다).
 *
 *  ① 신선도 — 접시가 계승한 신선도 상태(가장 먼저 상하는 조각) + 담은 뒤 흐른 시간.
 *  ② 칼질   — 회썰기 미니게임의 평균 컷 정확도(조각 아이템 `cutQuality`의 평균).
 *  ③ 식감   — 두께·결. 고급 사시미(야나기바 사선 16컷)가 최상, 일반 회칼 다음, 막칼은 두께가 제멋대로다.
 *              썰어 둔 뒤 시간이 지나면 결이 처진다(120분부터 감점).
 *  ④ 구성   — 모듬(2종 이상)·표준 인분량 충족·방위별 균형.
 *  ⑤ 완성도 — 넷의 조화. 넷이 전부 문턱 위이고 평균이 0.85 이상이어야 켜진다.
 *
 * 순수 함수 — 접시 아이템은 `SashimiPlateMeta`(담을 때의 사실)만 들고, "지금" 별점은 매번 다시 센다.
 * 판매가는 **담을 때 별점**으로 확정(`sashimiStarPriceMult`)하고, 신선도 하락은 판매 경로의 상태 배율이 맡는다.
 */

import type { SashimiSizeTier } from '../db-schema/SashimiSlicing.js';
import { SINGLE_SASHIMI_PRICING } from '../db-schema/SashimiSlicing.js';

export type SashimiKnifeTier = 'utility' | 'sashimi' | 'yanagiba';

/** 접시에 담을 때 확정되는 사실 — 세이브에 그대로 들어간다 */
export interface SashimiPlateMeta {
  madeAtMs: number;
  mode: 'basic' | 'advanced';
  size: SashimiSizeTier;
  species: string[];
  totalG: number;
  pieces: number;
  /** 조각별 컷 정확도 평균 (0~1). 정보가 없는 구 조각은 0.7로 본다 */
  cutQ: number;
  knifeTier: SashimiKnifeTier;
  /** 방위별 g 균형 (0~1 — 1 = 네 방위가 같은 양) */
  quadBalance: number;
  /** 담을 때 별점 (판매가 확정용) */
  starsAtMake: number;
}

export type SashimiStarKey = 'fresh' | 'cut' | 'texture' | 'compose' | 'finish';
export interface SashimiStarPart { key: SashimiStarKey; labelKo: string; labelEn: string; score: number; earned: boolean }
export interface SashimiStars { stars: number; total: number; parts: SashimiStarPart[] }

export const SASHIMI_STAR_LABEL_KO: Record<SashimiStarKey, string> = {
  fresh: '신선도', cut: '칼질', texture: '식감', compose: '구성', finish: '완성도',
};
export const SASHIMI_STAR_LABEL_EN: Record<SashimiStarKey, string> = {
  fresh: 'Freshness', cut: 'Knife work', texture: 'Texture', compose: 'Composition', finish: 'Finish',
};

/** 신선도 상태 문자열 → 점수 (클라 InvCondition 8단계 + 구 5단계 이름을 함께 받는다) */
export function sashimiFreshScore(condition: string | undefined): number {
  switch (condition) {
    case 'live': return 1;
    case 'fresh': return 0.95;
    case 'chilled': return 0.85;
    case 'normal': return 0.55;
    case 'frozen': return 0.5;
    case 'thawed': return 0.45;
    case 'bad': return 0.15;
    case 'spoiled': return 0;
    default: return 0.9;
  }
}

const THRESH = 0.8;

/**
 * "지금" 별점. `condition`은 접시 아이템의 현재 신선도, `nowMs`는 벽시계.
 * 담은 직후 별점을 원하면 `nowMs = meta.madeAtMs`, `condition = 담을 때 상태`로 부른다.
 */
export function sashimiStarsAt(meta: SashimiPlateMeta, condition: string | undefined, nowMs: number): SashimiStars {
  const ageMin = Math.max(0, (nowMs - meta.madeAtMs) / 60_000);
  // ① 신선도 — 상태 점수 × 담은 뒤 시간(12시간에 0.6까지)
  const fresh = sashimiFreshScore(condition) * Math.max(0.6, 1 - ageMin / 720);
  // ② 칼질
  const cut = Math.max(0, Math.min(1, meta.cutQ));
  // ③ 식감 — 조법·칼 + 시간(120분부터 처진다, 6시간에 −0.3)
  const base = meta.mode === 'advanced' ? 1
    : meta.knifeTier === 'yanagiba' ? 0.9
      : meta.knifeTier === 'sashimi' ? 0.85 : 0.55;
  const texture = Math.max(0, base - Math.max(0, ageMin - 120) / 360 * 0.3);
  // ④ 구성 — 모듬 가산 · 표준 인분량 · 방위 균형
  const std = SINGLE_SASHIMI_PRICING[meta.mode][meta.size].sashimiG;
  const portion = Math.min(1, meta.totalG / Math.max(1, std * 0.9));
  const variety = meta.species.length >= 2 ? 1 : 0.85;
  const compose = Math.max(0, Math.min(1, 0.5 * portion + 0.3 * variety + 0.2 * meta.quadBalance)) * (portion < 0.6 ? 0.7 : 1);
  const four = [fresh, cut, texture, compose];
  const earnedFour = four.map((s) => s >= THRESH);
  const mean = four.reduce((a, b) => a + b, 0) / 4;
  const allFour = earnedFour.every(Boolean);
  const finish = allFour ? mean : mean * 0.7;
  const parts: SashimiStarPart[] = [
    { key: 'fresh', labelKo: SASHIMI_STAR_LABEL_KO.fresh, labelEn: SASHIMI_STAR_LABEL_EN.fresh, score: fresh, earned: earnedFour[0] },
    { key: 'cut', labelKo: SASHIMI_STAR_LABEL_KO.cut, labelEn: SASHIMI_STAR_LABEL_EN.cut, score: cut, earned: earnedFour[1] },
    { key: 'texture', labelKo: SASHIMI_STAR_LABEL_KO.texture, labelEn: SASHIMI_STAR_LABEL_EN.texture, score: texture, earned: earnedFour[2] },
    { key: 'compose', labelKo: SASHIMI_STAR_LABEL_KO.compose, labelEn: SASHIMI_STAR_LABEL_EN.compose, score: compose, earned: earnedFour[3] },
    { key: 'finish', labelKo: SASHIMI_STAR_LABEL_KO.finish, labelEn: SASHIMI_STAR_LABEL_EN.finish, score: finish, earned: allFour && mean >= 0.85 },
  ];
  return { stars: parts.filter((p) => p.earned).length, total: Math.round(finish * 100), parts };
}

/** 별점 → 판매가 배율 (담을 때 한 번 확정) */
export function sashimiStarPriceMult(stars: number): number {
  return [0.45, 0.6, 0.75, 0.9, 1.05, 1.2][Math.max(0, Math.min(5, stars))];
}

/** 접시 이름 — 요리와 같은 문법 `(별 N개)` */
export function sashimiPlateName(baseName: string, stars: number, en = false): string {
  return en ? `${baseName} (${stars} star${stars === 1 ? '' : 's'})` : `${baseName} (별 ${stars}개)`;
}

/** 방위별 g 배열 → 균형 0~1 (표준편차/평균) */
export function quadBalanceOf(quadG: number[]): number {
  const n = quadG.length;
  if (n === 0) return 0;
  const mean = quadG.reduce((a, b) => a + b, 0) / n;
  if (mean <= 0) return 0;
  const sd = Math.sqrt(quadG.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  return Math.max(0, Math.min(1, 1 - sd / mean));
}
