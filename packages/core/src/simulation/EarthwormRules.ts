/**
 * @file EarthwormRules.ts
 * @description 248차 — 텃밭 흙에서 나오는 땅지렁이(줍기)와, 바다낚시 미끼로 쓴 땅지렁이.
 *
 * 실제(조사 요약 — 상세는 워크로그 248 §1):
 *  - 지렁이는 축축하고 유기물이 많은 겉흙(0~30cm)에 산다. 호미로 흙을 뒤집거나 뿌리 작물을 캐면 드러난다.
 *    퇴비를 넣은 흙에는 훨씬 많다. 흙이 마르면 깊이 내려가고(한여름 가뭄), 흙이 얼면 깊은 곳에서 쉰다 —
 *    흙 온도 10~20℃인 봄 · 가을에 가장 활발하다.
 *  - 비가 오면 굴에 물이 차 겉으로 기어 나온다.
 *  - 바다낚시 미끼로도 쓴다 — 망둥어 · 숭어 · 가자미류 · 감성돔(기수역)이 곧잘 문다(어종 값은 오라클 표).
 *    다만 바닷물에 넣으면 염분 때문에 몇 분 만에 힘이 빠져 늘어진다 — 꿈틀거림이 줄어 입질을 덜 부른다(`earthwormSeaFade`).
 *
 * 순수 함수 — 난수는 호출 쪽이 주입한다(`rand01`).
 */

import type { FarmSite } from '../types/Farming.js';

/**
 * 지렁이가 드러날 수 있는 때 — 일구기 · 캐기(뿌리 작물 수확) · 김매기 · 북주기 · 칸 비우기 ·
 * `rain`(비가 오는 동안 일군 칸 하나를 20초마다 한 번 본다 — 굴에 물이 차 기어 나온다)
 */
export type EarthwormAct = 'till' | 'dig' | 'weed' | 'hill_up' | 'clear' | 'rain';

export const EARTHWORM_TUNING = {
  /** 일마다 한 칸에서 지렁이가 나올 기본 확률 — 흙을 깊이 뒤집을수록 높다 */
  chance: { till: 0.3, dig: 0.35, weed: 0.12, hill_up: 0.18, clear: 0.1, rain: 0.015 } as Readonly<Record<EarthwormAct, number>>,
  /** 비 오는 날 기어 나오는 것을 보는 간격(ms) — 텃밭 가까이 있을 때만 */
  rainCheckMs: 20_000,
  /** 한 번에 나오는 마리 수(같은 확률) */
  countMin: 1,
  countMax: 3,
  /** 퇴비를 넣은 칸 */
  compostMult: 1.6,
  /** 촉촉한 흙(수분 이 값 이상) · 마른 흙(이 값 미만) */
  moistAt: 0.45,
  moistMult: 1.3,
  dryAt: 0.2,
  dryMult: 0.35,
  /** 달별 배수(1~12월) — 봄 · 가을이 많고 한여름 · 한겨울은 적다 */
  monthMult: [0.1, 0.15, 0.6, 1.0, 1.1, 0.9, 0.7, 0.6, 0.95, 1.1, 0.7, 0.2] as readonly number[],
  /** 비가 오는 동안 — 겉으로 나와 있다 */
  rainMult: 1.8,
  /** 확률 상한 */
  maxChance: 0.85,
  /** 드러난 지렁이가 다시 흙으로 파고드는 시간(ms) — 그 안에 주워야 한다 */
  exposeMs: 90_000,
  /** 바다 미끼 — 오라클 표에 땅지렁이 값이 없는 어종은 청갯지렁이 선호의 이 몫(염분에 금방 늘어진다) */
  seaPrefRatio: 0.4,
  /** 바닷물에 담근 뒤 매력이 줄어드는 시간(초) · 바닥(늘어져도 냄새는 남는다) */
  seaFadeSec: 240,
  seaFadeFloor: 0.35,
};

/** 지렁이 판정에 쓰는 칸 · 날씨 */
export interface EarthwormCtx {
  /** 1~12 */
  month: number;
  /** 흙 수분 0..1 */
  moisture: number;
  /** 이번 작기에 퇴비를 넣었나 */
  compost?: boolean;
  /** 지금 비가 오는가 */
  raining?: boolean;
  /** 마당 · 빌린 밭(`plot`)만 — 실내 선반 · 수경에는 지렁이가 없다 */
  site: FarmSite;
}

/** 이 일 · 이 칸에서 지렁이가 나올 확률(0..maxChance) */
export function earthwormChance(act: EarthwormAct, ctx: EarthwormCtx): number {
  if (ctx.site !== 'plot') return 0;
  const T = EARTHWORM_TUNING;
  let p = T.chance[act] ?? 0;
  p *= T.monthMult[Math.min(11, Math.max(0, Math.round(ctx.month) - 1))] ?? 1;
  if (ctx.compost) p *= T.compostMult;
  if (ctx.moisture >= T.moistAt) p *= T.moistMult;
  else if (ctx.moisture < T.dryAt) p *= T.dryMult;
  if (ctx.raining) p *= T.rainMult;
  return Math.min(T.maxChance, Math.max(0, p));
}

/** 이번 일에서 나온 지렁이 수(0 = 안 나왔다). 난수 두 번(나왔나 · 몇 마리) */
export function rollEarthworms(act: EarthwormAct, ctx: EarthwormCtx, rand01: () => number): number {
  const p = earthwormChance(act, ctx);
  if (p <= 0 || rand01() >= p) return 0;
  const T = EARTHWORM_TUNING;
  return T.countMin + Math.min(T.countMax - T.countMin, Math.floor(rand01() * (T.countMax - T.countMin + 1)));
}

/**
 * 바닷물에 `soakSec`초 담근 땅지렁이의 입질 매력 배수(1 → seaFadeFloor).
 * 처음 1분은 그대로 꿈틀거리고, 그 뒤 seaFadeSec까지 곧게 줄어든다.
 */
export function earthwormSeaFade(soakSec: number): number {
  const T = EARTHWORM_TUNING;
  const s = Math.max(0, soakSec - 60);
  return Math.max(T.seaFadeFloor, 1 - (1 - T.seaFadeFloor) * (s / Math.max(1, T.seaFadeSec - 60)));
}

/** 오라클 표에 땅지렁이 값이 없는 어종의 선호 — 청갯지렁이 선호(없으면 기본 5)의 seaPrefRatio 몫 */
export function earthwormSeaPref(wormBluePref: number | undefined): number {
  return Math.round((wormBluePref ?? 5) * EARTHWORM_TUNING.seaPrefRatio);
}
