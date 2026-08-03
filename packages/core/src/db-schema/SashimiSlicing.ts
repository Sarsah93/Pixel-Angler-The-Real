/**
 * @file SashimiSlicing.ts
 * @description 회썰기(사시미) 미니게임 규칙 데이터 — 순수 필렛 → 사시미 (2026-08-03).
 *
 * 손질하기(원물 손질, ButcheryProcess)와 **별도 과정**이다:
 *  순수 필렛(`inv_fillet_*`)을 도마에 올려 측면 뷰에서 컷 유도선을 따라 썬다.
 *  - **일반 회뜨기** (z plane 정면뷰): 세로 14컷 — 야나기바 미만 회칼(일반 사시미칼)로 진행.
 *  - **고급 사시미 뜨기** (y plane 정면뷰): 사선 16컷 — **야나기바 이상 장착 시에만** 버튼 활성.
 *    고급 사시미는 추후 '스시' 만들기 연계 산출물.
 *  둘 다 측면 뷰(살코기 머리쪽 = 오른쪽) — 모드 차이는 유도선 방향/개수 (사용자 도식 2026-08-03).
 *
 * 순수 TS — 렌더/브라우저 API 없음. 컷 판정은 기존 evaluateCut(ButcheryProcess)을 재사용.
 */

import type { CutPoint } from '../types/Butchery.js';

export type SashimiMode = 'basic' | 'advanced';

export interface SashimiModeSpec {
  mode: SashimiMode;
  /** 버튼/타이틀 라벨 */
  label: string;
  /** 컷 수 (일반 14 / 고급 16 — 사용자 도식) */
  cuts: number;
  /** 유도선 기울기 (수직 기준 도(deg), 머리쪽(+x)으로 기움) — 일반 = 살짝 / 고급 = 사선(소기즈쿠리) */
  tiltDeg: number;
  /** 최소 회칼 티어 — advanced = 야나기바 이상 하드 게이트 */
  minKnifeTier: 'utility' | 'sashimi' | 'yanagiba';
  /** evaluateCut 허용 이탈 (정규화 거리) */
  tolerance: number;
  /** 경로 커버율 임계 */
  minCoverage: number;
  /** 산출가 배율 (고급 사시미 프리미엄) */
  priceMult: number;
  /** 산출물 이름 접두 ('' / '고급 ') */
  namePrefix: string;
}

export const SASHIMI_MODES: Record<SashimiMode, SashimiModeSpec> = {
  basic: {
    mode: 'basic', label: '일반 회뜨기', cuts: 14, tiltDeg: 7,
    minKnifeTier: 'utility', tolerance: 0.055, minCoverage: 0.72,
    priceMult: 1.0, namePrefix: '',
  },
  advanced: {
    mode: 'advanced', label: '고급 사시미 뜨기', cuts: 16, tiltDeg: 38,
    minKnifeTier: 'yanagiba', tolerance: 0.05, minCoverage: 0.72,
    priceMult: 1.5, namePrefix: '고급 ',
  },
};

/** 사시미 크기 등급 — 원물 필렛 무게(g) 연동 (소/중/대/특대) */
export type SashimiSizeTier = '소' | '중' | '대' | '특대';

/** 크기 경계 (weightG 상한, 오름차순) — 밸런스 튜닝값 ★ */
export const SASHIMI_SIZE_BOUNDS: { tier: SashimiSizeTier; maxG: number }[] = [
  { tier: '소', maxG: 200 },
  { tier: '중', maxG: 400 },
  { tier: '대', maxG: 700 },
  { tier: '특대', maxG: Number.POSITIVE_INFINITY },
];

export function sashimiSizeTier(weightG: number): SashimiSizeTier {
  for (const b of SASHIMI_SIZE_BOUNDS) if (weightG < b.maxG) return b.tier;
  return '특대';
}

/** 썰기 등급 — 전 컷 평균 정확도 → 특/상/중/하 (+가격 배율). 손질 등급 체계와 동일 배율 */
export function sashimiGradeFromQuality(avgQuality: number): { grade: '특' | '상' | '중' | '하'; mult: number } {
  if (avgQuality >= 0.9) return { grade: '특', mult: 1.5 };
  if (avgQuality >= 0.75) return { grade: '상', mult: 1.25 };
  if (avgQuality >= 0.55) return { grade: '중', mult: 1.0 };
  return { grade: '하', mult: 0.8 };
}

// ═══════════════ 접시 플레이팅 (사시미 만들기 — 2026-08-03) ═══════════════

/**
 * 접시 스펙 — 크기별 **방위(좌상/우상/좌하/우하)당 최대 배치 점수** (사용자 도식):
 *  소 4×4=16점 / 중 5×4=20점 / 대 6×4=24점 / 특대 7×4=28점.
 */
export const SASHIMI_PLATE_SPECS: Record<SashimiSizeTier, { perQuad: number }> = {
  '소': { perQuad: 4 },
  '중': { perQuad: 5 },
  '대': { perQuad: 6 },
  '특대': { perQuad: 7 },
};

/**
 * **모듬 사시미**(서로 다른 어종 2종 이상) 고정 판매가 + g 하한 (사용자 가격표 2026-08-03).
 * g 하한 = 값싼 소형 어종만으로 큰 접시를 채우기 어렵게 하는 제한.
 */
export const MIXED_SASHIMI_PRICING: Record<'basic' | 'advanced', Record<SashimiSizeTier, { price: number; minG: number }>> = {
  basic: {
    '소': { price: 35000, minG: 350 },
    '중': { price: 55000, minG: 550 },
    '대': { price: 70000, minG: 750 },
    '특대': { price: 110000, minG: 1200 },
  },
  advanced: {
    '소': { price: 40000, minG: 320 },
    '중': { price: 60000, minG: 500 },
    '대': { price: 80000, minG: 700 },
    '특대': { price: 125000, minG: 1000 },
  },
};

/**
 * **단품 사시미**(한 어종) 가격 모델 — **횟집 괴리율 보정식** (사용자 지시 2026-08-04).
 *
 * 원물 kg 시세와 횟집 완성 회 가격의 괴리(실측: 참돔 단품 소(350g) ≈ 55,000원 /
 * 벵에돔 단품 소 ≈ 70,000원 — 원물 kg가의 1.5~2배)를 두 단계로 명시 반영한다:
 *
 *   판매가 = 원물 kg시세 × **필요 원물량(kg)** × **인분 마진(크기별)**
 *   필요 원물량 = 완성 회 중량(sashimiG) ÷ 실수율(yieldRate)
 *
 *  ① **실수율** — 직판장은 kg당 원물을 사고, 내장/머리/손질을 거쳐 "회로만" 남는 비율이
 *     ~35%(일반). 고급(야나기바 정교 손질)은 다듬어 버리는 살이 많아 ~28%로 더 낮다.
 *     (구 KG_FACTOR 1.0/1.5/2.0/2.5는 사실상 350g÷0.35 등 이 식의 근사값이었음.)
 *  ② **인분 마진** — 횟집은 크기별 인분수로 카운트해 마진을 얹는다. 큰 접시일수록
 *     단위 마진은 소폭 하락(대량 할인). 인게임 kg시세가 소비자 시세대(참돔 ~37k)라
 *     소 기준 1.6배로 캘리브레이션 — 참돔 소 ≈ 59k / 벵에돔 소 ≈ 67k (실측 정합).
 *
 *  조각/필렛 체인은 **원물가 승계(원가 기반)** 를 유지하고, 이 마진은 접시 완성
 *  시점에만 실현된다 (손질+썰기+플레이팅 노력의 부가가치).
 */
export interface SingleSashimiPriceRow {
  /** 완성 회 중량 기준 (g) — 접시 크기별 표준 인분량 */
  sashimiG: number;
  /** 실수율 — 원물에서 회로만 남는 비율 (필요 원물 kg = sashimiG/1000/yieldRate) */
  yieldRate: number;
  /** 횟집 인분 마진 (크기가 클수록 단위 마진 소폭 하락) */
  servingMargin: number;
}

export const SINGLE_SASHIMI_PRICING: Record<'basic' | 'advanced', Record<SashimiSizeTier, SingleSashimiPriceRow>> = {
  basic: {
    '소': { sashimiG: 350, yieldRate: 0.35, servingMargin: 1.60 },
    '중': { sashimiG: 550, yieldRate: 0.35, servingMargin: 1.45 },
    '대': { sashimiG: 750, yieldRate: 0.35, servingMargin: 1.35 },
    '특대': { sashimiG: 1200, yieldRate: 0.35, servingMargin: 1.25 },
  },
  advanced: {
    '소': { sashimiG: 320, yieldRate: 0.28, servingMargin: 1.85 },
    '중': { sashimiG: 500, yieldRate: 0.28, servingMargin: 1.68 },
    '대': { sashimiG: 700, yieldRate: 0.28, servingMargin: 1.55 },
    '특대': { sashimiG: 1000, yieldRate: 0.28, servingMargin: 1.45 },
  },
};

/** 단품 사시미 접시 판매가 — kgPriceKRW = 그 어종 원물 1kg 시세 (evaluateFishSellPrice 등) */
export function singleSashimiPlatePrice(
  kgPriceKRW: number, mode: SashimiMode, size: SashimiSizeTier,
): number {
  const row = SINGLE_SASHIMI_PRICING[mode][size];
  const needKg = row.sashimiG / 1000 / row.yieldRate;
  return Math.max(3000, Math.round(kgPriceKRW * needKg * row.servingMargin));
}

/**
 * 컷 유도선 배치 — 필렛 실루엣 위에 N개의 유도선(위→아래 긋기)을 생성한다.
 *
 * 뷰 공용(2026-08-03 사용자 정정 — 일반 = **탑뷰**(위에서 본 필렛) / 고급 = **측면 뷰**):
 *  - 탑뷰: topAt/botAt = 필렛 상·하 윤곽 (유도선이 필렛 폭을 가로지름)
 *  - 측면: topAt = 윗면 실루엣 / botAt = 접지 라인(상수)
 *
 * 좌표계 = **필렛 스프라이트 rect 정규화(0~1)** — 클라이언트가 화면 px로 매핑.
 * 각 유도선은 [윗점, 아랫점] 2점 폴리라인:
 *  - 아랫점 x = 살코기 구간 [u0, u1]을 균등 분할
 *  - 윗점 x = 아랫점에서 tiltDeg만큼 머리쪽(+x)으로 기움 (aspect = rect W/H 보정)
 *  - 윗점 y = 그 x의 상단 윤곽 (topAt) — 칼이 살 밖에서 시작하지 않게 고정점 반복으로 수렴
 *
 * @param topAt  정규화 x → 정규화 상단 윤곽 y
 * @param botAt  정규화 x → 정규화 하단 윤곽 y (측면 뷰 = 접지 라인 상수)
 * @param aspect 표시 rect의 W/H (기울기 각도의 시각 보정)
 */
export function buildSashimiCutPaths(
  spec: SashimiModeSpec,
  topAt: (u: number) => number,
  botAt: (u: number) => number,
  u0: number,
  u1: number,
  aspect: number,
): CutPoint[][] {
  const paths: CutPoint[][] = [];
  const tan = Math.tan((spec.tiltDeg * Math.PI) / 180);
  for (let i = 0; i < spec.cuts; i++) {
    // 아랫점 — 살코기 구간 균등 분할 (양 끝 여백 절반 스텝)
    const ub = u0 + ((i + 0.5) / spec.cuts) * (u1 - u0);
    const yb = botAt(ub);
    // 윗점 x — 컷 길이에 비례해 머리쪽으로 기움. topAt이 x에 의존하므로 고정점 반복(3회)로 수렴
    let ut = ub;
    let yt = topAt(ut);
    for (let k = 0; k < 3; k++) {
      const hNorm = Math.max(0, yb - yt);               // 그 지점 컷 길이 (정규화)
      ut = Math.min(0.995, ub + tan * hNorm / aspect);  // 정규화 x 오프셋 = tan(θ)·h × (H/W)
      yt = topAt(ut);
    }
    // 살 밖(실루엣 밖) 시작 방지 — 윗점을 윤곽 살짝 바깥(-0.015)에서 시작해 긋는 맛 유지
    paths.push([
      { x: ut, y: Math.max(0.02, yt - 0.015) },
      { x: ub, y: Math.min(0.98, yb + 0.015) },
    ]);
  }
  return paths;
}
