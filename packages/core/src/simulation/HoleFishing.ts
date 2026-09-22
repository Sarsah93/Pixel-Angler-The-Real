/**
 * @file HoleFishing.ts
 * @description 구멍치기(穴釣り) 조법 판정 — 테트라포드·사석 틈에 채비를 수직으로 내리는 조법 (149차)
 *
 * 캐스팅이 아니라 **발밑 구멍에 그대로 내린다**. 그래서 다른 조법과 세 가지가 다르다.
 *  ① 거리가 없다 — 수면 거리 1~2m. 조류 존은 발앞 반탄류뿐이고 비거리·바람이 개입하지 않는다.
 *  ② 밑걸림이 기본값이다 — 콘크리트 블록 틈이라 채비는 언제든 걸린다. 그래서 **저가 장비**로 한다
 *     (M1-04 도현수: "그 대는 아까우니까 여기다 쓰지 마").
 *  ③ 대상이 다르다 — 구멍에 숨은 볼락·우럭·노래미·쏨뱅이·붕장어. 회유어는 오지 않는다.
 *
 * 지형 판정(`breakwaterClassAt` 2 = 테트라포드 피복 / 3 = 사석)은 114차부터 이미 있다 —
 * 이 모듈은 그 분류를 받아 **구멍의 성질**(깊이·밑걸림·어종 가중·발 디딤 위험)만 산출한다.
 * 렌더·입력은 client, 여기는 순수 함수다.
 */

import { TUNING } from '../config/tuning.js';

/** 구멍 종류 — 방파제 단면 분류(`breakwaterClassAt`) 2·3과 1:1 */
export type HoleSpotKind = 'tetrapod' | 'riprap';

/** 단면 분류(0 안벽 · 1 상판 · 2 피복 · 3 사석) → 구멍 종류. 구멍이 없으면 null */
export function holeKindOfBreakwaterClass(k: number): HoleSpotKind | null {
  if (k === 2) return 'tetrapod';
  if (k === 3) return 'riprap';
  return null;
}

export const HOLE_KIND_LABEL: Record<HoleSpotKind, { ko: string; en: string }> = {
  tetrapod: { ko: '테트라포드', en: 'Tetrapods' },
  riprap: { ko: '사석', en: 'Riprap' },
};

/**
 * 구멍에 사는 어종 가중 (스폰 오라클 `speciesWeightBias`에 그대로 넘긴다).
 * 필터가 아니라 **가중**이다 — 구멍에도 가끔 다른 것이 들어온다.
 */
export const HOLE_SPECIES_BIAS: Readonly<Record<string, number>> = Object.freeze({
  blue_rockfish: 2.6,          // 청볼락 — 구멍 대표 어종
  black_rockfish: 2.4,         // 조피볼락(우럭) — 물면 틈으로 파고든다
  red_snapper_rockfish: 1.8,   // 열기(불볼락)
  golden_rockfish: 1.4,        // 황볼락
  scorpionfish: 2.2,           // 쏨뱅이
  greenling: 2.0,              // 노래미
  fat_greenling: 1.8,          // 쥐노래미
  conger_eel: 1.5,             // 붕장어
  surfperch: 1.2,              // 망상어
  // 회유·표층성은 구멍에 들지 않는다
  yellowtail: 0.1, amberjack: 0.1, greater_amberjack: 0.1, spanish_mackerel: 0.1,
  chub_mackerel: 0.2, horse_mackerel: 0.3, pacific_saury: 0.05, halfbeak: 0.1,
  flatfish: 0.2, northern_whiting: 0.15,
});

export interface HoleSpotInput {
  kind: HoleSpotKind;
  /** 구멍 타일 해시 시드 — 같은 구멍은 늘 같은 깊이 */
  seed: number;
  /** 그 자리 연안 수심(m) — 방파제 발밑 실측/프로필 값 */
  shoreDepthM: number;
  /** 조위 0(간조)~1(만조) — 만조일수록 구멍이 깊어진다 */
  tideLevel01?: number;
}

export interface HoleSpotInfo {
  kind: HoleSpotKind;
  /** 구멍 바닥 수심(m) — 1인칭 Z_max */
  depthM: number;
  /** 수면 거리(m) — 발밑이라 캐스팅 거리 대신 쓴다 */
  distanceM: number;
  /** 밑걸림 확률 배율 (낚시터 snagRisk와 곱해진다) */
  snagRiskMult: number;
  /** 어종 가중 */
  speciesBias: Readonly<Record<string, number>>;
  /** 발 디딤 미끄러짐 확률 (0~1) — 파고가 높을수록 오른다 */
  slipChance: number;
  labelKo: string;
  labelEn: string;
}

/** 0~1 결정적 해시 (구멍마다 고정) */
function hash01(seed: number, salt: number): number {
  let h = (seed ^ (salt * 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/**
 * 구멍 하나의 성질.
 *
 * 깊이 = 연안 수심 × 종류 계수 + 구멍 편차. 테트라포드는 블록이 겹겹이 쌓여 **연안 수심보다 깊은
 * 수직 굴**이 생기고, 사석은 완만해 그만큼 얕다. 어느 쪽이든 `minDepthM` 아래로는 안 내려간다
 * (너무 얕으면 채비가 설 자리가 없다).
 */
export function evaluateHoleSpot(input: HoleSpotInput): HoleSpotInfo {
  const T = TUNING.hole;
  const { kind, seed } = input;
  const tide = Math.min(1, Math.max(0, input.tideLevel01 ?? 0.5));
  const deep = kind === 'tetrapod';
  const base = Math.max(0, input.shoreDepthM) * (deep ? T.depthMultTetrapod : T.depthMultRiprap);
  const varyM = (hash01(seed, 1) * 2 - 1) * T.depthVarianceM;
  const depthM = Math.max(T.minDepthM, Math.min(T.maxDepthM, base + varyM + tide * T.tideDepthM));
  const distanceM = T.distanceM + hash01(seed, 2) * T.distanceVarianceM;
  return {
    kind,
    depthM: Math.round(depthM * 10) / 10,
    distanceM: Math.round(distanceM * 100) / 100,
    snagRiskMult: deep ? T.snagMultTetrapod : T.snagMultRiprap,
    speciesBias: HOLE_SPECIES_BIAS,
    slipChance: deep ? T.slipChanceTetrapod : T.slipChanceRiprap,
    labelKo: HOLE_KIND_LABEL[kind].ko,
    labelEn: HOLE_KIND_LABEL[kind].en,
  };
}

/** 파고(m)를 반영한 실제 미끄러짐 확률 — 너울이 넘치면 블록 위는 젖어 미끄럽다 */
export function holeSlipChance(info: HoleSpotInfo, waveHeightM: number): number {
  const T = TUNING.hole;
  const over = Math.max(0, waveHeightM - T.slipWaveM);
  return Math.min(0.6, info.slipChance + over * T.slipWaveSlope);
}

/**
 * 장비 위험 안내 — 구멍치기는 채비를 잃는 조법이라 **비싼 대를 쓰면 손해**다.
 * 고가 장비면 경고 문구를 돌려준다(차단하지 않는다 — 선택은 플레이어 몫).
 * @param rodPrice 손에 쥔 낚싯대의 기준가(원)
 */
export function holeGearWarning(rodPrice: number | undefined): { ko: string; en: string } | null {
  const limit = TUNING.hole.budgetRodPriceWon;
  if (rodPrice === undefined || rodPrice <= limit) return null;
  return {
    ko: '구멍치기는 채비를 자주 잃습니다 — 저가 릴대를 쓰는 편이 낫습니다',
    en: 'Hole fishing eats tackle — a budget rod is the wiser choice',
  };
}
