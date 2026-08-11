/**
 * @file ButcheryProcess.ts
 * @description 회 뜨기 손질 상태 머신 + 컷 판정(CutValidator) + 사시미 등급 산정
 *
 * 흐름 (원형어 삼면뜨기 기준 — SASHIMI_BUTCHERY_SPEC):
 *  시메(뇌 탭) → 방혈(아가미 컷+얼음물) → 비늘치기(BASE·FLIP+세척) →
 *  머리따기(사선 양면) → 내장제거(BELLY_UP 개복→긁어내기→세척) → 꼬리 손잡이 →
 *  첫 장(등 칼집 ×3 → 강한 썰기 분리) → 둘째 장(미러) → 박피(FLESH_UP 당김).
 *  광어(flat)는 5장뜨기 — 장 뜨기 쌍을 4필렛만큼 반복.
 *
 * 컷/입력 판정은 전부 여기(core)서 수행하고 client는 렌더·입력 수집만 한다.
 * 품질 = 방혈 × 시메 × 컷 정확도 평균 × 신선도 → 사시미 등급/판매가 배율.
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type {
  ButcheryProfile, ButcheryStage, CutSpec, CutPoint, CutEvalResult,
  ButcheryOrientation, BoardRotation, ButcheryResult, SashimiGrade,
  FilletYieldInput, FilletYieldResult,
} from '../types/Butchery.js';
import { primitiveInput } from '../types/Butchery.js';
import { buildCephalopodStages } from '../db-schema/CephalopodStages.js';
import { TUNING } from '../config/tuning.js';

/** 0~1 등 범위 클램프 */
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ────────────────────────────────────────────────────────────
// CutValidator — 가이드 경로 트레이스 판정
// ────────────────────────────────────────────────────────────

/** 폴리라인을 n등분 샘플링 */
function resamplePath(path: CutPoint[], n: number): CutPoint[] {
  if (path.length < 2) return path.slice();
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    segLens.push(d);
    total += d;
  }
  if (total <= 0) return [path[0]];
  const out: CutPoint[] = [];
  for (let k = 0; k < n; k++) {
    let target = (k / (n - 1)) * total;
    let i = 0;
    while (i < segLens.length && target > segLens[i]) { target -= segLens[i]; i++; }
    if (i >= segLens.length) { out.push(path[path.length - 1]); continue; }
    const t = segLens[i] > 0 ? target / segLens[i] : 0;
    out.push({
      x: path[i].x + (path[i + 1].x - path[i].x) * t,
      y: path[i].y + (path[i + 1].y - path[i].y) * t,
    });
  }
  return out;
}

/** 점→폴리라인 최소 거리 */
function distToPath(p: CutPoint, path: CutPoint[]): number {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const ax = path[i - 1].x, ay = path[i - 1].y;
    const bx = path[i].x, by = path[i].y;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / len2)) : 0;
    const d = Math.hypot(p.x - (ax + dx * t), p.y - (ay + dy * t));
    if (d < best) best = d;
  }
  return best;
}

/**
 * 컷 판정 — 트레이스가 가이드 경로를 얼마나 정확히 따라갔는지.
 *  coverage: 가이드 샘플 중 트레이스가 tolerance 안에 닿은 비율
 *  avgDeviationRatio: 트레이스 점들의 평균 이탈(tolerance 배수)
 *  quality: coverage × 이탈 감점 (0~1)
 */
export function evaluateCut(traced: CutPoint[], spec: CutSpec): CutEvalResult {
  if (traced.length < 2) {
    return { coverage: 0, avgDeviationRatio: 9, quality: 0, passed: false };
  }
  const guide = resamplePath(spec.guidePath, 32);

  let covered = 0;
  for (const g of guide) {
    if (distToPath(g, traced) <= spec.tolerance) covered++;
  }
  const coverage = covered / guide.length;

  let devSum = 0;
  for (const p of traced) devSum += distToPath(p, spec.guidePath);
  const avgDeviationRatio = (devSum / traced.length) / Math.max(0.001, spec.tolerance);

  const quality = Math.max(0, Math.min(1,
    coverage * Math.max(0.25, Math.min(1, 1.05 - avgDeviationRatio * 0.55)),
  ));
  return { coverage, avgDeviationRatio, quality, passed: coverage >= spec.minCoverage };
}

// ────────────────────────────────────────────────────────────
// 사시미 등급
// ────────────────────────────────────────────────────────────
export interface SashimiGradeInput {
  ikejimeDone: boolean;
  bledDone: boolean;
  /** 컷 정확도 평균 (0~1) */
  avgCutQuality: number;
  /** 신선도 계수 (활어 1.0 ~ 상함 0.2 — Item 신선도 레이어 재사용) */
  freshnessFactor: number;
}

/** 품질 종합 → 등급/판매가 배율 (방혈·시메 = 선도 보너스 리서치 반영) */
export function computeSashimiGrade(input: SashimiGradeInput): { grade: SashimiGrade; gradeMult: number; score: number } {
  const score = (input.ikejimeDone ? 1 : 0.85)
    * (input.bledDone ? 1 : 0.8)
    * (0.3 + 0.7 * Math.max(0, Math.min(1, input.avgCutQuality)))
    * Math.max(0.2, Math.min(1, input.freshnessFactor));
  const grade: SashimiGrade = score >= 0.9 ? '특' : score >= 0.68 ? '상' : score >= 0.5 ? '중' : '하';
  const gradeMult = grade === '특' ? 1.5 : grade === '상' ? 1.25 : grade === '중' ? 1.0 : 0.7;
  return { grade, gradeMult, score };
}

// ────────────────────────────────────────────────────────────
// 회뜨기 수율 산출 (양) + 등급(질) — SASHIMI_YIELD_SPEC 2026-07
//   수율(양)과 등급(질)을 분리한다: "많이 뜨기 vs 곱게 뜨기" 트레이드오프.
// ────────────────────────────────────────────────────────────

/**
 * 체장·무게·도구·스킬·신선도로 회 살 질량 / 필렛 장수 / 슬라이스 수 / 등급을 산출한다.
 *
 *  yieldMass = weightGram × baseYieldRate × toolYield × skillYield × freshness
 *  sliceCount = floor( yieldMass / (sliceGramBase / (toolThin × skillThin)) )
 *    → 큰 물고기·좋은 칼·높은 스킬일수록 얇게 많이.
 *  등급 = (방혈×시메×컷정확도×신선도) × (칼×스킬 보정) → 특/상/중/하.
 *
 * knife가 null이면 회뜨기 불가 상태이므로 상위 레이어(ButcheryPanel)가 게이트해야 한다.
 * (여기서는 안전 폴백으로 막칼(0.85) 수율을 가정해 계산만 수행한다.)
 */
export function computeFilletYield(input: FilletYieldInput): FilletYieldResult {
  const { profile, weightGram, lengthCm, knife, skillLevel, cutAccuracyAvg, freshnessFactor } = input;

  const toolYield = knife ? Math.min(1.15, knife.toolYieldFactor) : 0.85;
  const toolThin = knife ? knife.toolThinness : 0.8;
  const skillYield = clamp(0.8 + skillLevel * 0.03 + cutAccuracyAvg * 0.15, 0.8, 1.2);
  const skillThin = clamp(0.85 + skillLevel * 0.02 + cutAccuracyAvg * 0.2, 0.85, 1.3);
  const freshness = clamp(freshnessFactor, 0.2, 1.05);

  const yieldMassG = Math.max(0, Math.round(
    weightGram * profile.baseYieldRate * toolYield * skillYield * freshness,
  ));

  // 필렛 장수 — 넙치류는 항상 4장 (다섯장뜨기의 '5장' = 필렛 4장 + 중골 뼈 프레임.
  //  구 "대형 ≥45cm = 5필렛" 분기는 오해였음 — 사용자 순서도 2026-08-05로 정정)
  const filletCount: number = profile.filletCount;

  const sliceGramEff = profile.sliceGramBase / (toolThin * skillThin);
  const sliceCount = Math.max(1, Math.floor(yieldMassG / Math.max(1, sliceGramEff)));

  const undersizedForFillet = lengthCm < profile.minFilletLengthCm;

  // 등급 — 방혈·시메·컷정확도·신선도 기반 점수에 칼·스킬 보정을 곱한다.
  const base = computeSashimiGrade({
    ikejimeDone: input.ikejimeDone, bledDone: input.bledDone,
    avgCutQuality: cutAccuracyAvg, freshnessFactor: freshness,
  });
  const qualBoost = clamp(toolYield * (skillYield / 1.0), 0.75, 1.18);
  const score = clamp(base.score * qualBoost, 0, 1);
  let grade: SashimiGrade = score >= 0.9 ? '특' : score >= 0.68 ? '상' : score >= 0.5 ? '중' : '하';
  // 회칼 미보유(막칼 폴백) = 최고 등급 '상' 캡 — 회칼 없이 특급 사시미 불가 (고증)
  if (!knife && grade === '특') grade = '상';
  const gradeMult = grade === '특' ? 1.5 : grade === '상' ? 1.25 : grade === '중' ? 1.0 : 0.7;

  // 부산물 — 살(yieldMass)을 뺀 나머지를 부위별로 분리 지급 (어종 무관 근사 비율):
  //  머리 12% + 척추뼈(중골) 6% + 갈빗대뼈 4% (= 구 boneHead 22%) + 가시뼈(핀본) 2% + 내장 8%.
  //  껍질은 박피가 있는 어종만 필렛 수만큼.
  const headG = Math.round(weightGram * 0.12);
  const spineG = Math.round(weightGram * 0.06);
  const ribG = Math.round(weightGram * 0.04);
  const pinBoneG = Math.round(weightGram * 0.02);
  const visceraG = Math.round(weightGram * 0.08);
  const skinPieces = profile.skinToughness >= 0.4 ? filletCount : 0;

  return {
    yieldMassG, filletCount, sliceCount, grade, gradeMult, undersizedForFillet,
    byproducts: { headG, spineG, ribG, pinBoneG, visceraG, skinPieces },
  };
}

// ────────────────────────────────────────────────────────────
// 스테이지 빌더 — 프로필 → 손질 단계 목록
// ────────────────────────────────────────────────────────────
function cut(
  id: string, orientation: ButcheryOrientation, guidePath: CutPoint[],
  opts: Partial<CutSpec> = {},
): CutSpec {
  return {
    id, orientationRequired: orientation, tool: 'knife', guidePath,
    tolerance: opts.tolerance ?? 0.08,
    minCoverage: opts.minCoverage ?? 0.6,
    strokesRequired: opts.strokesRequired,
    strong: opts.strong,
    guidePaths: opts.guidePaths,
  };
}

/** 스테이지 빌더 옵션 (SASHIMI_PIXEL_GUIDE_SPEC §3-2) */
export interface ButcheryStageOptions {
  /**
   * 비늘치기 스킵 (선-1·선-2 분기) — 박피까지 갈 거면 생략 가능.
   * 스킵 개체의 껍질(fish_skin) 부산물은 등급 하락(비늘 붙은 껍질 = 식용 불가) 대상.
   */
  skipDescale?: boolean;
}

/** 방어류(방추형) — 돔류(체고형)와 실루엣이 달라 가이드 좌표를 따로 둔다 */
const AMBERJACK_GUIDE_SPECIES: ReadonlySet<string> = new Set([
  'yellowtail', 'amberjack', 'greater_amberjack',
]);

/** 어종군별 가이드 좌표 세트 (전부 dev F9 실측 — 도마 rect 정규화) */
interface GuideCoordSet {
  ikejime: CutPoint;
  bleed: CutPoint[];
  headBase: CutPoint[];
  headFlip: CutPoint[];
  scaleBase: CutPoint[];
  scaleFlip: CutPoint[];
  /** 지느러미 3선 — [등, 뒷(배), 가슴] 순서 무관하게 각 1회 */
  finectomy: [CutPoint[], CutPoint[], CutPoint[]];
  tailA: CutPoint[];
  tailB: CutPoint[];
}

const GUIDE_COORDS: Record<'bream' | 'amberjack', GuideCoordSet> = {
  // ── 돔류 (2026-07-30~31 실측) ──
  bream: {
    ikejime: { x: 0.239, y: 0.410 },
    bleed: [
      { x: 0.255, y: 0.392 }, { x: 0.275, y: 0.454 }, { x: 0.283, y: 0.518 },
      { x: 0.285, y: 0.583 }, { x: 0.285, y: 0.648 }, { x: 0.277, y: 0.713 },
      { x: 0.259, y: 0.775 },
    ],
    headBase: [{ x: 0.283, y: 0.307 }, { x: 0.346, y: 0.867 }],
    headFlip: [{ x: 0.703, y: 0.300 }, { x: 0.649, y: 0.867 }],
    scaleBase: [
      { x: 0.522, y: 0.250 }, { x: 0.360, y: 0.260 }, { x: 0.584, y: 0.353 }, { x: 0.310, y: 0.376 },
      { x: 0.640, y: 0.456 }, { x: 0.324, y: 0.506 }, { x: 0.693, y: 0.586 }, { x: 0.340, y: 0.640 },
      { x: 0.648, y: 0.693 }, { x: 0.357, y: 0.776 }, { x: 0.575, y: 0.810 }, { x: 0.367, y: 0.897 },
    ],
    scaleFlip: [
      { x: 0.454, y: 0.240 }, { x: 0.640, y: 0.233 }, { x: 0.399, y: 0.346 }, { x: 0.678, y: 0.343 },
      { x: 0.348, y: 0.453 }, { x: 0.669, y: 0.476 }, { x: 0.302, y: 0.570 }, { x: 0.655, y: 0.610 },
      { x: 0.329, y: 0.663 }, { x: 0.644, y: 0.723 }, { x: 0.377, y: 0.756 }, { x: 0.635, y: 0.830 },
      { x: 0.433, y: 0.857 },
    ],
    finectomy: [
      [{ x: 0.295, y: 0.276 }, { x: 0.358, y: 0.217 }, { x: 0.443, y: 0.230 }, { x: 0.519, y: 0.271 }, { x: 0.579, y: 0.336 }, { x: 0.643, y: 0.397 }, { x: 0.682, y: 0.476 }],
      [{ x: 0.320, y: 0.830 }, { x: 0.379, y: 0.896 }, { x: 0.462, y: 0.927 }, { x: 0.536, y: 0.879 }, { x: 0.604, y: 0.821 }, { x: 0.651, y: 0.745 }, { x: 0.699, y: 0.670 }],
      [{ x: 0.407, y: 0.516 }, { x: 0.373, y: 0.516 }, { x: 0.349, y: 0.540 }, { x: 0.334, y: 0.571 }, { x: 0.320, y: 0.603 }, { x: 0.308, y: 0.636 }, { x: 0.299, y: 0.670 }],
    ],
    tailA: [{ x: 0.732, y: 0.376 }, { x: 0.736, y: 0.627 }],
    tailB: [{ x: 0.274, y: 0.395 }, { x: 0.273, y: 0.624 }],
  },
  // ── 방어류 (2026-08-04 사용자 실측 — 방추형 전용) ──
  amberjack: {
    ikejime: { x: 0.159, y: 0.341 },
    bleed: [
      { x: 0.218, y: 0.288 }, { x: 0.228, y: 0.343 }, { x: 0.230, y: 0.399 },
      { x: 0.227, y: 0.456 }, { x: 0.220, y: 0.512 }, { x: 0.208, y: 0.568 },
      { x: 0.192, y: 0.622 },
    ],
    headBase: [{ x: 0.255, y: 0.236 }, { x: 0.295, y: 0.795 }],
    headFlip: [{ x: 0.761, y: 0.225 }, { x: 0.686, y: 0.830 }],
    scaleBase: [
      { x: 0.427, y: 0.225 }, { x: 0.259, y: 0.257 }, { x: 0.520, y: 0.278 }, { x: 0.272, y: 0.362 },
      { x: 0.589, y: 0.355 }, { x: 0.279, y: 0.475 }, { x: 0.645, y: 0.443 }, { x: 0.288, y: 0.584 },
      { x: 0.717, y: 0.517 }, { x: 0.295, y: 0.689 }, { x: 0.722, y: 0.626 }, { x: 0.299, y: 0.805 },
      { x: 0.660, y: 0.763 }, { x: 0.383, y: 0.875 },
    ],
    scaleFlip: [
      { x: 0.524, y: 0.222 }, { x: 0.747, y: 0.225 }, { x: 0.462, y: 0.288 }, { x: 0.734, y: 0.327 },
      { x: 0.402, y: 0.359 }, { x: 0.723, y: 0.429 }, { x: 0.341, y: 0.440 }, { x: 0.711, y: 0.524 },
      { x: 0.279, y: 0.517 }, { x: 0.697, y: 0.636 }, { x: 0.287, y: 0.633 }, { x: 0.684, y: 0.749 },
      { x: 0.334, y: 0.745 }, { x: 0.665, y: 0.858 }, { x: 0.399, y: 0.830 },
    ],
    finectomy: [
      // 선1 = 가슴지느러미 밑동 (아가미 뒤 짧은 곡선)
      [{ x: 0.255, y: 0.408 }, { x: 0.256, y: 0.449 }, { x: 0.265, y: 0.490 }, { x: 0.278, y: 0.529 }, { x: 0.289, y: 0.569 }, { x: 0.308, y: 0.605 }, { x: 0.328, y: 0.640 }],
      // 선2 = 등지느러미 밑동 (등 능선을 따라 꼬리쪽으로)
      [{ x: 0.254, y: 0.190 }, { x: 0.357, y: 0.183 }, { x: 0.453, y: 0.213 }, { x: 0.535, y: 0.273 }, { x: 0.612, y: 0.340 }, { x: 0.678, y: 0.418 }, { x: 0.740, y: 0.499 }],
      // 선3 = 배(뒷)지느러미 밑동 — 뱃살에서 꼬리로 이어지는 라인
      [{ x: 0.241, y: 0.791 }, { x: 0.335, y: 0.840 }, { x: 0.439, y: 0.851 }, { x: 0.538, y: 0.816 }, { x: 0.634, y: 0.773 }, { x: 0.708, y: 0.697 }, { x: 0.760, y: 0.605 }],
    ],
    tailA: [{ x: 0.756, y: 0.489 }, { x: 0.755, y: 0.643 }],
    tailB: [{ x: 0.247, y: 0.464 }, { x: 0.245, y: 0.651 }],
  },
};

/**
 * 넙치류(flat) 다섯장뜨기 가이드 좌표 — 도마 rect 정규화 (근사 기본값, dev F9 실측 예정).
 * 뷰 규칙: BASE = 등면(어두운 면) 위 / FLIP = 배면(흰 면) 위 — **둘 다 머리 왼쪽**
 * (납작한 생선을 장축 기준으로 뒤집으므로 좌우 미러 없음).
 */
const FLAT_GUIDE = {
  /** 시메 — 눈 뒤 뇌 지점 (등면 좌상단). F9 실측 2026-08-05 */
  ikejime: { x: 0.230, y: 0.400 },
  /** 방혈 — 아가미 안쪽 세로 호 (F9 실측 7점) */
  bleed: [
    { x: 0.265, y: 0.249 }, { x: 0.253, y: 0.330 }, { x: 0.259, y: 0.411 }, { x: 0.276, y: 0.491 },
    { x: 0.281, y: 0.573 }, { x: 0.270, y: 0.653 }, { x: 0.237, y: 0.726 },
  ],
  /**
   * 머리 S자 절단 (사용자 캡처 1 — 도마 왼쪽에 머리, 절단면이 'S' 모양. F9 실측 7점).
   * 위에서 아래로: 왼쪽으로 파고들다 → 내장 주머니를 피해 오른쪽으로 불룩 → 다시 왼쪽 아래로.
   */
  headScut: [
    { x: 0.278, y: 0.178 }, { x: 0.265, y: 0.278 }, { x: 0.256, y: 0.379 }, { x: 0.280, y: 0.475 },
    { x: 0.288, y: 0.572 }, { x: 0.260, y: 0.669 }, { x: 0.208, y: 0.755 },
  ],
  /** 비늘치기 스윕 — 면별 실측 분리 (F9 2026-08-05. 등면/배면 지그재그가 미묘하게 다름) */
  scaleSweepBase: [
    { x: 0.439, y: 0.125 }, { x: 0.312, y: 0.202 }, { x: 0.496, y: 0.173 }, { x: 0.269, y: 0.302 },
    { x: 0.550, y: 0.211 }, { x: 0.281, y: 0.421 }, { x: 0.600, y: 0.259 }, { x: 0.317, y: 0.498 },
    { x: 0.650, y: 0.307 }, { x: 0.303, y: 0.617 }, { x: 0.693, y: 0.378 }, { x: 0.263, y: 0.722 },
    { x: 0.712, y: 0.474 }, { x: 0.304, y: 0.793 }, { x: 0.673, y: 0.602 }, { x: 0.360, y: 0.865 },
    { x: 0.573, y: 0.769 },
  ],
  scaleSweepFlip: [
    { x: 0.449, y: 0.102 }, { x: 0.312, y: 0.202 }, { x: 0.505, y: 0.121 }, { x: 0.269, y: 0.302 },
    { x: 0.558, y: 0.178 }, { x: 0.281, y: 0.421 }, { x: 0.609, y: 0.240 }, { x: 0.306, y: 0.512 },
    { x: 0.655, y: 0.316 }, { x: 0.296, y: 0.636 }, { x: 0.684, y: 0.421 }, { x: 0.272, y: 0.760 },
    { x: 0.682, y: 0.550 }, { x: 0.355, y: 0.827 }, { x: 0.625, y: 0.717 }, { x: 0.423, y: 0.898 },
    { x: 0.564, y: 0.850 },
  ],
  /** 꼬리 칼집 (등/배 공통 세로선 — F9 실측) */
  tail: [{ x: 0.732, y: 0.393 }, { x: 0.732, y: 0.574 }],
  /**
   * 중앙선(척추선) 칼집 — **머리 절단면(S컷)부터 꼬리 칼집(x 0.732)까지 전장**
   * (사용자 지시 2026-08-05 — F9 실측 0.288→0.718을 양끝 랜드마크까지 연장).
   */
  center: [{ x: 0.280, y: 0.500 }, { x: 0.732, y: 0.488 }],
  /**
   * 위쪽 지느러미 경계 칼길 (F9 실측 7점 — 배면 FLIP 기준, 등면 공용).
   * ⚠ 점 순서 = **꼬리(x 0.737) → 머리(x 0.262)** — 세로로 세운 도마에서 꼬리 끝부터 머리쪽으로
   * 긋는 실제 손질 방향(사용자 지시 + 자세한 뷰.pdf). 화살촉·유도 큐가 이 순서를 따른다.
   */
  upScore: [
    { x: 0.737, y: 0.421 }, { x: 0.667, y: 0.323 }, { x: 0.619, y: 0.206 }, { x: 0.541, y: 0.107 },
    { x: 0.428, y: 0.100 }, { x: 0.329, y: 0.177 }, { x: 0.262, y: 0.283 },
  ],
  /**
   * 포 뜨기 분리 경로 (2/3)·(3/3) — 사용자 공정 재정의 (2026-08-06 캡처 3장):
   *  (1/3) = upScore/dnScore(지느러미 경계 칼길, **꼬리→머리**) →
   *  (2/3) = 칼길을 따라 살·뼈 분리 — **머리→꼬리**, 경로가 중앙선 쪽으로 들어옴(깊이 ~45%) →
   *  (3/3) = 거의 중앙선(깊이 ~85%) — 칼끝이 중앙선 칼집에 닿으며 필렛 분리. **머리→꼬리**.
   *  아래 좌표는 실측 경계(upScore)와 중앙선(center)의 보간 파생 근사 — dev F9 실측 예정.
   */
  upSep1: [
    { x: 0.262, y: 0.381 }, { x: 0.329, y: 0.322 }, { x: 0.428, y: 0.278 }, { x: 0.541, y: 0.281 },
    { x: 0.619, y: 0.334 }, { x: 0.667, y: 0.398 }, { x: 0.737, y: 0.451 },
  ],
  upSep2: [
    { x: 0.262, y: 0.467 }, { x: 0.329, y: 0.450 }, { x: 0.428, y: 0.437 }, { x: 0.541, y: 0.435 },
    { x: 0.619, y: 0.448 }, { x: 0.667, y: 0.465 }, { x: 0.737, y: 0.478 },
  ],
  /** 아래쪽 지느러미 경계 칼길 — 중앙선 대칭 미러 근사(upScore 기준). **꼬리 → 머리** 순서 */
  dnScore: [
    { x: 0.737, y: 0.555 }, { x: 0.667, y: 0.656 }, { x: 0.619, y: 0.776 }, { x: 0.541, y: 0.879 },
    { x: 0.428, y: 0.892 }, { x: 0.329, y: 0.820 }, { x: 0.262, y: 0.717 },
  ],
  dnSep1: [
    { x: 0.262, y: 0.619 }, { x: 0.329, y: 0.675 }, { x: 0.428, y: 0.714 }, { x: 0.541, y: 0.705 },
    { x: 0.619, y: 0.648 }, { x: 0.667, y: 0.581 }, { x: 0.737, y: 0.525 },
  ],
  dnSep2: [
    { x: 0.262, y: 0.533 }, { x: 0.329, y: 0.547 }, { x: 0.428, y: 0.555 }, { x: 0.541, y: 0.551 },
    { x: 0.619, y: 0.534 }, { x: 0.667, y: 0.515 }, { x: 0.737, y: 0.498 },
  ],
  /**
   * 엔가와 분리 — 필렛 가장자리의 지느러미살 ↔ 살코기 경계 (꼬리 왼쪽 → 머리 오른쪽으로 처지는 호).
   * ⚠ **슬랩이 kind별로 다른 실사**라 좌표도 분리한다 (85차: 필렛 1·4 = under(내장쪽) /
   *   2·3 = upper — `fillet_under_halibut` 128×47 vs `fillet_upper_halibut` 128×38로 실루엣이 다르다).
   *   구 2점 수평 근사(y=0.70 직선)는 폐기.
   */
  /** under(내장쪽 = 필렛 1·4) — 사용자 F9 실측 2026-08-07 (필렛 1 화면 기준) */
  engawaUnder: [
    { x: 0.056, y: 0.193 }, { x: 0.186, y: 0.276 }, { x: 0.292, y: 0.396 }, { x: 0.410, y: 0.503 },
    { x: 0.541, y: 0.589 }, { x: 0.691, y: 0.628 }, { x: 0.817, y: 0.544 },
  ],
  /**
   * upper(필렛 2·3) — 사용자 F9 실측 2026-08-07 (필렛 2 화면 기준).
   * under와 진행 방향이 반대다 — upper 슬랩은 왼쪽이 두껍고 오른쪽으로 올라가는 실루엣이라
   * 경계선이 **왼쪽 아래 → 오른쪽 위**로 훑고 끝에서 살짝 내려온다.
   */
  engawaUpper: [
    { x: 0.046, y: 0.667 }, { x: 0.207, y: 0.638 }, { x: 0.332, y: 0.527 }, { x: 0.459, y: 0.424 },
    { x: 0.586, y: 0.319 }, { x: 0.737, y: 0.259 }, { x: 0.880, y: 0.338 },
  ],
};

/**
 * 넙치류(광어·도다리) **다섯장뜨기** 스테이지 트리 (사용자 순서도 2026-08-05 · 공정 재정의 2026-08-06):
 *  시메 → 방혈 → [머리 S자 절단(**내장 동반 배출**) / 비늘치기 — 자유] (지느러미 제거 없음) →
 *  꼬리 앞뒤 칼집 → **배쪽(흰 면·FLIP) 먼저**: 중앙선 → 위(내장 위치)/아래 각 **포 뜨기 3단계** →
 *  **등쪽(BASE)**: 동일 구조 (2장) → 엔가와 4장 분리 → 박피 (필렛 1장 — 재장착으로 나머지).
 *  = 필렛 4장 + 중골(뼈 프레임) = 5장. **척추뼈 끊기·내장 제거 스테이지 없음**.
 */
function buildFlatStages(profile: ButcheryProfile, opts?: ButcheryStageOptions): ButcheryStage[] {
  const F = FLAT_GUIDE;
  const stages: ButcheryStage[] = [];

  stages.push({
    id: 'ikejime', label: '시메 (즉살)', orientation: 'BASE', primitive: 'tap',
    guide: '눈 뒤 뇌 지점을 정확히 탭하세요 — 신경 차단으로 선도가 유지됩니다',
    tapPoint: F.ikejime, tapRadius: 0.09,
  });
  stages.push({
    id: 'bleed_cut', label: '방혈 — 아가미 절개', orientation: 'BASE', primitive: 'guided_cut',
    guide: '아가미 안쪽을 세로로 그어 피를 빼세요',
    cut: cut('bleed_cut', 'BASE', F.bleed),
  });
  stages.push({
    id: 'bleed_ice', label: '방혈 — 얼음물 담그기', orientation: 'BASE', primitive: 'wash',
    guide: '얼음물에 담가 방혈을 완료하세요 (잡내 감소·선도 향상)',
  });

  if (profile.hasScales && !opts?.skipDescale) {
    stages.push({
      id: 'scale_base', label: '비늘치기 (등면)', orientation: 'BASE', primitive: 'drag_fill',
      guide: '꼬리→머리 역결 방향으로 지그재그로 문질러 비늘을 전부 벗기세요',
      fillTarget: 0.92, sweepPath: F.scaleSweepBase,
    });
    stages.push({
      id: 'scale_flip', label: '비늘치기 (배면)', orientation: 'FLIP', primitive: 'drag_fill',
      guide: '뒤집어서 흰 면 비늘도 전부 벗기세요',
      fillTarget: 0.92, sweepPath: F.scaleSweepFlip,
    });
    stages.push({
      id: 'scale_wash', label: '세척', orientation: 'FLIP', primitive: 'wash',
      guide: '비늘 부스러기를 씻어내세요',
    });
  }

  // 머리 S자 절단 — 내장 주머니를 피해 S자로 (한 번에 관통. 사용자 캡처 1의 검은 S 선)
  //  ⚠ 넙치류는 **내장이 머리와 함께 딸려 나온다** (사용자 지시 2026-08-06) —
  //    별도 내장 제거 스테이지 없음. 부산물(viscera)은 머리 작업 완료 시 함께 지급.
  stages.push({
    id: 'flat_head_scut', label: '머리 S자 절단', orientation: 'BASE', primitive: 'guided_cut',
    guide: '내장 주머니를 피해 S자로 머리를 잘라내세요 — 내장은 머리와 함께 딸려 나옵니다',
    cut: cut('flat_head_scut', 'BASE', F.headScut, { strong: true, tolerance: 0.09 }),
  });

  // 꼬리 끝 앞뒤 살짝 절단
  stages.push({
    id: 'tail_grip', label: '꼬리 칼집 (등면)', orientation: 'BASE', primitive: 'guided_cut',
    guide: '꼬리 끝 쪽에 얕은 칼집을 넣으세요 (등면)',
    cut: cut('tail_grip', 'BASE', F.tail, { minCoverage: 0.5 }),
  });
  stages.push({
    id: 'tail_grip_b', label: '꼬리 칼집 (배면)', orientation: 'FLIP', primitive: 'guided_cut',
    guide: '뒤집어 배면 꼬리에도 얕은 칼집을 넣으세요',
    cut: cut('tail_grip_b', 'FLIP', F.tail, { minCoverage: 0.5 }),
  });

  // ── 포 뜨기 = 반쪽(위/아래)마다 **3단계** (사용자 공정 재정의 2026-08-06 캡처 3장):
  //  (1/3) 지느러미 경계 칼길(꼬리→머리·칼날 위) → (2/3) 칼길 따라 살·뼈 분리(머리→꼬리·더 깊이)
  //  → (3/3) 거의 중앙선 — 칼끝이 중앙선 칼집에 닿으며 필렛 분리. 각 1회 긋기·경로가 다르다
  //  (56차 원칙: 다회 칼집은 회차별 독립 스테이지 + 각자 좌표).
  const mkLift = (side: 'belly' | 'back', half: 'up' | 'dn'): void => {
    const ori: 'BASE' | 'FLIP' = side === 'belly' ? 'FLIP' : 'BASE';
    const halfKo = half === 'up' ? '위쪽' : '아래쪽';
    const sideKo = side === 'belly' ? '배쪽' : '등쪽';
    const score = half === 'up' ? F.upScore : F.dnScore;
    const sep1 = half === 'up' ? F.upSep1 : F.dnSep1;
    const sep2 = half === 'up' ? F.upSep2 : F.dnSep2;
    const p = `flat_${side}_${half}`;
    stages.push({
      id: `${p}_score`, label: `${sideKo} ${halfKo} — 경계 칼길 (1/3)`, orientation: ori, primitive: 'guided_cut',
      rotationRequired: 90,
      guide: '꼬리에서 머리 방향으로 지느러미(엔가와) 경계를 따라 칼길을 내세요 (칼날 위쪽)',
      cut: cut(`${p}_score`, ori, score, { tolerance: 0.09 }),
    });
    stages.push({
      id: `${p}_sep1`, label: `${sideKo} ${halfKo} — 살·뼈 분리 (2/3)`, orientation: ori, primitive: 'guided_cut',
      rotationRequired: 90,
      guide: '머리에서 꼬리로 — 만들어둔 칼길을 따라 살과 뼈를 더 깊이 가르세요',
      cut: cut(`${p}_sep1`, ori, sep1, { strong: true, tolerance: 0.1 }),
    });
    stages.push({
      id: `${p}_sep2`, label: `${sideKo} ${halfKo} — 필렛 분리 (3/3)`, orientation: ori, primitive: 'guided_cut',
      rotationRequired: 90,
      guide: '거의 중앙선까지 — 칼끝이 중앙선 칼집에 닿게 갈라 필렛을 떠내세요',
      cut: cut(`${p}_sep2`, ori, sep2, { strong: true, tolerance: 0.1 }),
      yieldsFillet: true,
    });
  };

  // ── 배쪽(흰 면·FLIP) 먼저 — 위(내장 위치)/아래 2장. 내장 제거 스테이지 없음(머리와 동반) ──
  stages.push({
    id: 'flat_belly_center', label: '배쪽 — 중앙선 칼집', orientation: 'FLIP', primitive: 'guided_cut',
    rotationRequired: 90,
    guide: '머리 경계에서 꼬리까지 몸통 중앙(척추선)을 따라 칼집을 넣으세요',
    cut: cut('flat_belly_center', 'FLIP', F.center, { tolerance: 0.07 }),
  });
  mkLift('belly', 'up');
  mkLift('belly', 'dn');

  // ── 등쪽(어두운 면·BASE) — 동일 구조 2장 ──
  stages.push({
    id: 'flat_back_center', label: '등쪽 — 중앙선 칼집', orientation: 'BASE', primitive: 'guided_cut',
    rotationRequired: 90,
    guide: '뒤집어 등면도 중앙(척추선)을 따라 칼집을 넣으세요',
    cut: cut('flat_back_center', 'BASE', F.center, { tolerance: 0.07 }),
  });
  mkLift('back', 'up');
  mkLift('back', 'dn');

  // ── 엔가와 분리 — 필렛 4장 각각 지느러미살/살코기 경계 절단 ──
  for (let i = 1; i <= 4; i++) {
    stages.push({
      id: `engawa_${i}`, label: `엔가와 분리 (필렛 ${i})`, orientation: 'FLESH_UP', primitive: 'guided_cut',
      guide: '필렛 가장자리의 지느러미살(엔가와)과 살코기 경계를 칼로 갈라 분리하세요',
      // 85차 지급 순서 매핑 — 필렛 1·4 = under(내장쪽) / 2·3 = upper (슬랩 실사가 다르다)
      cut: cut(`engawa_${i}`, 'FLESH_UP', i === 1 || i === 4 ? F.engawaUnder : F.engawaUpper,
        { tolerance: 0.09 }),
    });
  }

  // ── 박피 — 원형어와 동일 절차 (필렛 1장 처리, id 공유 = 클라 전용 렌더 재사용) ──
  //  좌표는 **광어 필렛 실측** (사용자 F9 2026-08-07) — 원형어 블록과 별도 유지.
  stages.push({
    id: 'peel_grip', label: '박피 ① 꼬리 손잡이 만들기', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '꼬리(왼쪽) 살코기에 작은 칼집을 넣어 잡을 손잡이를 만드세요',
    cut: cut('peel_grip', 'FLESH_UP',
      [{ x: 0.096, y: 0.539 }, { x: 0.093, y: 0.575 }, { x: 0.091, y: 0.612 }, { x: 0.091, y: 0.648 },
        { x: 0.089, y: 0.685 }, { x: 0.089, y: 0.721 }, { x: 0.093, y: 0.757 }], { tolerance: 0.1 }),
  });
  stages.push({
    id: 'peel_insert', label: '박피 ② 껍질과 살 사이 칼 넣기', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '측면에서 껍질과 살코기 경계면을 따라 칼을 넣으세요',
    cut: cut('peel_insert', 'FLESH_UP',
      [{ x: 0.245, y: 0.715 }, { x: 0.288, y: 0.783 }], { tolerance: 0.09 }),
  });
  stages.push({
    id: 'peel_pull', label: '박피 ③ 껍질 잡고 분리', orientation: 'FLESH_UP', primitive: 'drag_fill',
    guide: '껍질을 잡고 도마 왼쪽으로 지그재그로 당겨 벗기세요',
    fillTarget: 0.9,
    sweepPath: [
      { x: 0.320, y: 0.500 }, { x: 0.292, y: 0.320 }, { x: 0.268, y: 0.680 },
      { x: 0.244, y: 0.320 }, { x: 0.220, y: 0.680 }, { x: 0.196, y: 0.320 },
      { x: 0.172, y: 0.680 }, { x: 0.148, y: 0.330 }, { x: 0.124, y: 0.670 },
      { x: 0.100, y: 0.360 }, { x: 0.078, y: 0.640 }, { x: 0.058, y: 0.420 },
      { x: 0.042, y: 0.580 }, { x: 0.030, y: 0.500 },
    ],
  });

  return stages;
}

/** 프로필 기반 손질 스테이지 목록 생성 (오리엔티드 뷰 정규화 좌표 — 머리는 항상 왼쪽 기준) */
export function buildButcheryStages(profile: ButcheryProfile, opts?: ButcheryStageOptions): ButcheryStage[] {
  // 넙치류 = 다섯장뜨기 전용 트리 (2026-08-05 — 원형어 삼면뜨기와 구조가 다르다)
  if (profile.bodyShape === 'flat') return buildFlatStages(profile, opts);
  const stages: ButcheryStage[] = [];
  const G = GUIDE_COORDS[AMBERJACK_GUIDE_SPECIES.has(profile.speciesId) ? 'amberjack' : 'bream'];

  // 1. 시메 — 눈 뒤 뇌 지점 탭 (활어→즉살, 선도 유지)
  stages.push({
    id: 'ikejime', label: '시메 (즉살)', orientation: 'BASE', primitive: 'tap',
    guide: '눈 뒤 뇌 지점을 정확히 탭하세요 — 신경 차단으로 선도가 유지됩니다',
    // dev 가이드 편집기(F9) 실측 좌표 — 돔류 (2026-07-30 사용자 확정)
    tapPoint: G.ikejime, tapRadius: 0.09,
  });

  // 2. 방혈 — 아가미 절개 + 얼음물
  stages.push({
    id: 'bleed_cut', label: '방혈 — 아가미 절개', orientation: 'BASE', primitive: 'guided_cut',
    guide: '아가미 안쪽을 세로로 그어 피를 빼세요',
    // 아가미 안쪽을 따라 도는 곡선 (7점 — dev 곡선 편집기 실측, 2026-07-30 사용자 확정)
    cut: cut('bleed_cut', 'BASE', G.bleed),
  });
  stages.push({
    id: 'bleed_ice', label: '방혈 — 얼음물 담그기', orientation: 'BASE', primitive: 'wash',
    guide: '얼음물에 담가 방혈을 완료하세요 (잡내 감소·선도 향상)',
  });

  // 3. 비늘치기 (양면) + 세척 — hasScales 어종만. skipDescale = 선-1·2 스킵 분기
  //  (박피 예정이면 생략 가능 — 스킵 개체의 껍질 부산물은 등급 하락. §3-2)
  if (profile.hasScales && !opts?.skipDescale) {
    // 비늘치기 — 스윕 경로 전 구간 커버리지가 게이지 기준 (dev 편집기 실측 좌표, 2026-07-30)
    stages.push({
      id: 'scale_base', label: '비늘치기 (앞면)', orientation: 'BASE', primitive: 'drag_fill',
      guide: '꼬리→머리 역결 방향으로 지그재그로 문질러 비늘을 전부 벗기세요',
      fillTarget: 0.92,
      sweepPath: G.scaleBase,
    });
    stages.push({
      id: 'scale_flip', label: '비늘치기 (뒷면)', orientation: 'FLIP', primitive: 'drag_fill',
      guide: '뒤집어서 반대면 비늘도 전부 벗기세요',
      fillTarget: 0.92,
      sweepPath: G.scaleFlip,
    });
    stages.push({
      id: 'scale_wash', label: '세척', orientation: 'FLIP', primitive: 'wash',
      guide: '비늘 부스러기를 씻어내세요',
    });
  }

  // 4. 머리따기 — 아가미 사선 양면 → 분리
  stages.push({
    id: 'head_base', label: '머리따기 (앞면 사선)', orientation: 'BASE', primitive: 'guided_cut',
    guide: '아가미 뒤에서 가슴지느러미 쪽으로 사선을 넣으세요',
    cut: cut('head_base', 'BASE', G.headBase),
  });
  stages.push({
    id: 'head_flip', label: '머리따기 (뒷면 사선 → 분리)', orientation: 'FLIP', primitive: 'guided_cut',
    guide: '뒤집어 같은 사선을 맞추면 머리가 분리됩니다',
    cut: cut('head_flip', 'FLIP', G.headFlip, { strong: true }),
  });

  // 4b. 지느러미 제거 (선-5 — 등·뒷지느러미 양옆 칼집 → 뽑기. 픽셀 가이드 선행부 신설)
  // 지느러미 제거 — **다중 유도선 3개**(등 / 뒷(배) / 가슴). 순서 자유, 각 1회씩.
  //  좌표는 dev 곡선 편집기(F9)로 실측 조정 예정 — 현재는 실루엣 근사 기본값.
  stages.push({
    id: 'finectomy', label: '지느러미 제거 (등·뒷·가슴)', orientation: 'BASE', primitive: 'guided_cut',
    guide: '등·뒷·가슴 지느러미 밑동을 따라 각각 칼집을 넣어 뽑으세요 (3곳 — 순서 자유)',
    // dev 곡선 편집기(F9) 실측 좌표 — 돔류 (2026-07-31 사용자 재실측: 원형 틀 고정 프레임 기준)
    cut: cut('finectomy', 'BASE', G.finectomy[0], {
      tolerance: 0.09, minCoverage: 0.5, guidePaths: G.finectomy,
    }),
  });

  // 5. 내장 제거 — 개복(항문→머리 경계) → 긁어내기 → 세척
  stages.push({
    id: 'gut_open', label: '개복 (항문→머리 경계)', orientation: 'BELLY_UP', primitive: 'guided_cut',
    guide: '항문에서 머리 경계까지 배를 가르세요',
    // 복면 뷰 실측 (2026-07-31 사용자) — 항문(우) → 머리 경계(좌) 정중선
    cut: cut('gut_open', 'BELLY_UP', [{ x: 0.217, y: 0.510 }, { x: 0.558, y: 0.506 }], { tolerance: 0.09 }),
  });
  stages.push({
    id: 'gut_scoop', label: '내장 비우기', orientation: 'BELLY_UP', primitive: 'scoop',
    guide: '갈빗대 안쪽 내장 덩어리를 긁어 통째로 꺼내세요',
    fillTarget: 0.85,
    // 복면 뷰 — 가른 정중선을 따라 항문 → 머리 경계까지 훑어 비운다 (2026-07-31 실측)
    sweepPath: [{ x: 0.529, y: 0.496 }, { x: 0.272, y: 0.503 }],
  });
  // 5b. 핏줄(신장) 긁기 — 척추 아래 혈관막 제거 (자유 손질 개편 2026-07-30 — 내장과 분리)
  stages.push({
    id: 'vessel_scrub', label: '핏줄(신장) 긁기', orientation: 'BELLY_UP', primitive: 'scoop',
    guide: '내장 자리 천장 — 척추뼈 아래 검붉은 혈관막을 긁어 남은 피를 제거하세요',
    fillTarget: 0.85,
    // 체강 탑뷰 — 척추 아래 고인 피 홈(중앙 검붉은 띠)을 머리 쪽으로 긁는다
    sweepPath: [{ x: 0.74, y: 0.5 }, { x: 0.16, y: 0.5 }],
  });
  stages.push({
    id: 'gut_wash', label: '뱃속 세척', orientation: 'BELLY_UP', primitive: 'wash',
    guide: '뱃속을 흐르는 물에 깨끗이 씻으세요',
  });

  // 6. 꼬리 칼집 — 앞/뒤 양면 (박피 손잡이 홈)
  stages.push({
    id: 'tail_grip', label: '꼬리 칼집 (앞면)', orientation: 'BASE', primitive: 'guided_cut',
    guide: '꼬리 쪽에 얕은 홈을 내 박피 손잡이를 만드세요 (앞면)',
    cut: cut('tail_grip', 'BASE', G.tailA, { minCoverage: 0.5 }),
  });
  stages.push({
    id: 'tail_grip_b', label: '꼬리 칼집 (뒷면)', orientation: 'FLIP', primitive: 'guided_cut',
    guide: '뒤집어 반대면 꼬리에도 얕은 홈을 내세요',
    cut: cut('tail_grip_b', 'FLIP', G.tailB, { minCoverage: 0.5 }),
  });

  // 7~8. 장 뜨기 — 면별 등쪽/배쪽 각각 척추까지 (자유 손질: 두 컷 순서 무관, 둘 다 = 분리).
  //  ⚠ flat(다섯장뜨기)은 함수 최상단에서 buildFlatStages로 조기 분기 (2026-08-05) —
  //    이 루프는 round(삼면뜨기) 전용이다. flat 상수는 구 분기 코드 보존용 false 고정.
  const flat = false as boolean;
  for (let f = 0; f < profile.filletCount; f++) {
    const sideLabel = flat
      ? `다섯장뜨기 ${f + 1}/${profile.filletCount}장`
      : f === 0 ? '1면' : '2면';
    // 등쪽 = **등을 카메라 쪽으로 눕힌 뷰**(머리 오른쪽·꼬리 왼쪽 — 실사 정합).
    //  칼집 3회로 길이 점점 깊어지며 벌어진다(1회 붉은 살 조금 → 2회 뼈 노출 → 3회 반대쪽까지).
    // 2면(f=1)은 **회차별 실측 경로가 다르다** — 1회차와 2회차를 별도 스테이지로 나눈다.
    //  (구조: 한 스테이지 strokesRequired 3 = 세 번 모두 같은 선 → 벌어진 뒤엔 선이 살과 안 맞아
    //   손이 쏠리고 커버율이 떨어졌다. 사용자 리포트 2026-07-31 "2단계부터 커버율 부족")
    const score2 = f === 1 && !flat;
    stages.push({
      id: `fillet_${f}_score`, label: `${sideLabel} — 등쪽 → 척추까지${score2 ? ' (1회차)' : ''}`,
      orientation: 'BACK_DOWN', primitive: 'guided_cut',
      guide: flat
        ? '몸통 중앙선을 기준으로 한쪽 반신의 지느러미 경계를 따라 얕은 칼집 3회'
        : score2
          ? '등 지느러미 자리를 따라 머리쪽(우) → 꼬리쪽(좌)으로 칼집을 넣어 척추뼈까지 뜨세요 (1회차)'
          : '등 지느러미 자리를 따라 머리쪽(우) → 꼬리쪽(좌)으로 칼집을 넣어 척추뼈까지 뜨세요 (3회 — 점점 깊게)',
      cut: score2
        // 2면 1회차 — 사용자 F9 실측 (2026-07-31)
        ? cut(`fillet_${f}_score`, 'BACK_DOWN',
          [{ x: 0.804, y: 0.663 }, { x: 0.192, y: 0.666 }], { tolerance: 0.1 })
        : cut(`fillet_${f}_score`, 'BACK_DOWN',
          [{ x: 0.798, y: 0.575 }, { x: 0.197, y: 0.490 }], { strokesRequired: 3, tolerance: 0.09 }),
    });
    if (f === 1 && !flat) {
      // 2면 2회차 — 벌어진 상태에 맞춰 다시 실측한 경로 (머리쪽 시작점이 앞으로 당겨진다)
      stages.push({
        id: 'fillet_1_score2', label: '2면 — 등쪽 → 척추까지 (2회차)', orientation: 'BACK_DOWN', primitive: 'guided_cut',
        guide: '벌어진 틈을 따라 한 번 더 깊게 그어 척추뼈까지 완전히 뜨세요 (2회차)',
        cut: cut('fillet_1_score2', 'BACK_DOWN',
          [{ x: 0.725, y: 0.646 }, { x: 0.192, y: 0.666 }], { tolerance: 0.1 }),
      });
    }
    if (f === 1 && !flat) {
      // ── 2면 전용 구조 (사용자 지시 2026-07-31) — 1면이 이미 분리돼 [척추뼈+2면 살] 덩어리 ──
      //  등쪽 작업: 척추경계 3컷(위 score) + ④ 머리쪽 갈비뼈 z-index 끊기.
      //  머리 부근에서 칼을 깊게 넣어 척추뼈 뒤(z축·먼쪽·안 보임)에서 내장막을 감싼 갈비뼈가
      //  만나므로, 그 갈비뼈를 부러뜨리며 내장쪽으로 썰어낸다 (등쪽 작업 마무리).
      //  ③ 벌어진 상태에서 **머리쪽에 드러난 척추뼈 ↔ 갈비뼈 연결부**를 끊는다
      //     (사용자 지시 2026-07-31 — 캡처의 노란 점선 자리. 좌표는 F9 재실측 예정)
      stages.push({
        id: 'fillet_1_ribcut', label: '2면 — 갈비뼈·척추 연결부 끊기', orientation: 'BACK_DOWN', primitive: 'guided_cut',
        guide: '머리쪽에 드러난 척추뼈와 갈비뼈가 연결된 지점을 끊어 2면을 완전히 떼어내세요',
        // 사용자 F9 실측 (2026-08-04)
        cut: cut('fillet_1_ribcut', 'BACK_DOWN',
          [{ x: 0.819, y: 0.610 }, { x: 0.640, y: 0.670 }], { strong: true, tolerance: 0.11 }),
      });
      // 배쪽 작업 = **꼬리쪽 → 배쪽 분리** — 등쪽과 같은 구조로 2회 긋고,
      //  마지막에 머리(배)쪽에 연결된 척추뼈·갈비뼈를 끊어 완전 분리 (사용자 지시 2026-07-31).
      stages.push({
        id: 'fillet_1_sever', label: '2면 — 꼬리쪽 → 배쪽 분리', orientation: 'BELLY_UP', primitive: 'guided_cut',
        guide: '꼬리쪽(우)에서 머리(배)쪽으로 척추뼈와 살덩어리 사이를 그어 분리하세요 (2회 — 점점 깊게)',
        // 사용자 F9 실측 (2026-07-31)
        cut: cut('fillet_1_sever', 'BELLY_UP',
          [{ x: 0.798, y: 0.657 }, { x: 0.190, y: 0.647 }], { strokesRequired: 2, tolerance: 0.1 }),
      });
      stages.push({
        id: 'fillet_1_bellyribcut', label: '2면 — 배쪽 갈비뼈·척추 연결부 끊기', orientation: 'BELLY_UP', primitive: 'guided_cut',
        guide: '머리(배)쪽에 드러난 척추뼈와 갈비뼈가 연결된 지점을 끊어 2면을 완전히 떼어내세요',
        // 사용자 F9 실측 (2026-08-04)
        cut: cut('fillet_1_bellyribcut', 'BELLY_UP',
          [{ x: 0.180, y: 0.565 }, { x: 0.367, y: 0.702 }], { strong: true, tolerance: 0.11 }),
        yieldsFillet: true,
      });
    } else {
      // ── 1면(및 광어 각 장) 구조 — 배쪽 2회 분리 + 갈비뼈·척추 끊어 분리 ──
      stages.push({
        id: `fillet_${f}_sever`, label: `${sideLabel} — 배쪽 → 척추까지`, orientation: 'BELLY_UP', primitive: 'guided_cut',
        guide: flat
          ? '중앙 뼈(중골) 위를 강하게 썰어 반신 한 장을 분리 — 상·하 양측으로 남은 장 반복'
          : '꼬리 칼집(우)에서 항문 위 뱃살을 지나 아가미까지 척추뼈 바로 위를 일자로 뜨세요 (2회 — 점점 깊게)',
        cut: cut(`fillet_${f}_sever`, 'BELLY_UP',
          [{ x: 0.796, y: 0.470 }, { x: 0.189, y: 0.470 }], { strokesRequired: 2, tolerance: 0.1 }),
      });
      stages.push({
        id: `fillet_${f}_ribsever`, label: `${sideLabel} — 갈비뼈·척추 끊어 분리`, orientation: 'BELLY_UP', primitive: 'guided_cut',
        guide: '아가미 지느러미 쪽 갈비뼈와 척추뼈 사이를 등쪽 지느러미 방향으로 강하게 썰어 뼈를 끊고 윗면 살을 떠내세요',
        cut: cut(`fillet_${f}_ribsever`, 'BELLY_UP',
          [{ x: 0.42, y: 0.44 }, { x: 0.16, y: 0.42 }], { strong: true, tolerance: 0.11 }),
        yieldsFillet: true,
      });
    }
  }

  // 9. 필렛 손질 ① 갈빗대 제거 — 척추 자리→내장막 대각 도려내기 (필렛 A/B)
  stages.push({
    id: 'rib_a', label: '갈빗대 제거 (필렛 A)', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '척추뼈 자리에서 내장막 쪽으로 대각선 칼집 — 갈빗대 판만 얇게 도려내세요',
    // 사용자 F9 실측 (2026-07-31 — 실사 fillet_ribs 뷰 기준)
    cut: cut('rib_a', 'FLESH_UP',
      [{ x: 0.117, y: 0.446 }, { x: 0.197, y: 0.504 }, { x: 0.274, y: 0.567 }, { x: 0.348, y: 0.633 },
        { x: 0.418, y: 0.703 }, { x: 0.463, y: 0.791 }, { x: 0.486, y: 0.888 }], { tolerance: 0.09 }),
  });
  stages.push({
    id: 'rib_b', label: '갈빗대 제거 (필렛 B)', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '반대쪽 필렛도 같은 방식으로 갈빗대 판을 도려내세요',
    // 사용자 F9 실측 (2026-07-31 — 좌우 미러된 필렛 B 기준)
    cut: cut('rib_b', 'FLESH_UP',
      [{ x: 0.917, y: 0.373 }, { x: 0.817, y: 0.431 }, { x: 0.711, y: 0.482 }, { x: 0.622, y: 0.556 },
        { x: 0.561, y: 0.655 }, { x: 0.529, y: 0.768 }, { x: 0.511, y: 0.885 }], { tolerance: 0.09 }),
  });

  // 10. 필렛 손질 ② 지아이뼈 분리 — 세로 2회 절단 (머리쪽 가운데 → 꼬리쪽 일자)
  stages.push({
    id: 'pin_a', label: '지아이뼈 분리 (필렛 A)', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '가운데 지아이뼈 라인을 따라 세로로 2회 잘라 등살/지아이뼈/뱃살로 분리하세요',
    cut: cut('pin_a', 'FLESH_UP', [{ x: 0.16, y: 0.5 }, { x: 0.9, y: 0.5 }], { strokesRequired: 2, tolerance: 0.08 }),
  });
  stages.push({
    id: 'pin_b', label: '지아이뼈 분리 (필렛 B)', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '반대쪽 필렛도 지아이 라인을 2회 잘라 분리하세요',
    cut: cut('pin_b', 'FLESH_UP', [{ x: 0.16, y: 0.5 }, { x: 0.9, y: 0.5 }], { strokesRequired: 2, tolerance: 0.08 }),
  });

  // 11. 박피 — **2단계** (사용자 지시 2026-07-31): ① 꼬리 손잡이 칼집 ② 껍질 분리(경계 칼 → 당기기).
  //  껍질 붙은 필렛 1장을 벗겨 [생선 껍질 + 순수 필렛 1개]를 얻는다. 꼬리는 **도마 왼쪽**.
  stages.push({
    id: 'peel_grip', label: '박피 ① 꼬리 손잡이 만들기', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '꼬리(왼쪽) 살코기에 작은 칼집을 넣어 잡을 손잡이를 만드세요',
    // 사용자 F9 실측 (2026-07-31)
    cut: cut('peel_grip', 'FLESH_UP',
      [{ x: 0.106, y: 0.350 }, { x: 0.065, y: 0.562 }], { tolerance: 0.1 }),
  });
  stages.push({
    id: 'peel_insert', label: '박피 ② 껍질과 살 사이 칼 넣기', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '측면에서 껍질(회색)과 살코기 경계면을 따라 칼을 넣으세요',
    // 측면 단면 뷰 — 껍질(회색)↔살 경계에 칼끝을 꽂아 넣는 짧은 컷 (사용자 F9 실측 2026-07-31)
    cut: cut('peel_insert', 'FLESH_UP',
      [{ x: 0.209, y: 0.779 }, { x: 0.281, y: 0.783 }], { tolerance: 0.09 }),
  });
  stages.push({
    id: 'peel_pull', label: '박피 ③ 껍질 잡고 분리', orientation: 'FLESH_UP', primitive: 'drag_fill',
    guide: '껍질을 잡고 도마 왼쪽으로 지그재그로 당겨 벗기세요',
    fillTarget: 0.9,
    // 왼쪽으로 진행하는 지그재그 — 경로가 길어 완주에 약 4~5초 걸린다 (사용자 지정)
    sweepPath: [
      { x: 0.320, y: 0.500 }, { x: 0.292, y: 0.320 }, { x: 0.268, y: 0.680 },
      { x: 0.244, y: 0.320 }, { x: 0.220, y: 0.680 }, { x: 0.196, y: 0.320 },
      { x: 0.172, y: 0.680 }, { x: 0.148, y: 0.330 }, { x: 0.124, y: 0.670 },
      { x: 0.100, y: 0.360 }, { x: 0.078, y: 0.640 }, { x: 0.058, y: 0.420 },
      { x: 0.042, y: 0.580 }, { x: 0.030, y: 0.500 },
    ],
  });

  return stages;
}

// ────────────────────────────────────────────────────────────
// ButcheryProcess FSM
// ────────────────────────────────────────────────────────────
export class ButcheryProcess {
  readonly profile: ButcheryProfile;
  private stages: ButcheryStage[];
  private idx = 0;

  /** 현재 방향 상태 (client의 Orient 버튼이 전환) */
  orientation: ButcheryOrientation = 'BASE';

  /**
   * 도마 회전 (0 = 가로·머리 왼쪽 / 90 = 세로·머리 위). 좌우·상하 뒤집기와 **독립 축**이다 —
   * 넙치류 지느러미쪽 칼길·포 뜨기는 세로로 세운 자세에서 꼬리→머리로 긋는다(자세한 뷰.pdf).
   */
  rotation: BoardRotation = 0;

  private cutQualities: number[] = [];
  private fillProgress = 0;
  private strokesLeft = 0;
  /** 다중 유도선 — 이미 그은 선 인덱스 (스테이지 전환 시 리셋) */
  private pathsDone = new Set<number>();
  private pullsLeft = 0;
  private _fillets = 0;
  private _ikejime = false;
  private _bled = false;
  private freshnessFactor: number;

  /**
   * 두족류 트리로 돌고 있는가 (87차) — 뷰 전환 방식이 어류와 다르다.
   * 어류는 플레이어가 뒤집기 버튼으로 방향을 맞추지만, 두족류의 뷰 전이는
   * **공정 자체**(개복 → 펼침 → 껍질면 → 살코기면)라 스테이지 진행에 딸려간다.
   */
  readonly cephalopod: boolean;

  constructor(profile: ButcheryProfile, freshnessFactor: number, opts?: ButcheryStageOptions) {
    this.profile = profile;
    this.freshnessFactor = freshnessFactor;
    // 두족류는 어류 스테이지 트리와 구조가 통째로 달라 최상단에서 갈라진다
    const ceph = buildCephalopodStages(profile.speciesId);
    this.cephalopod = !!ceph;
    this.stages = ceph ?? buildButcheryStages(profile, opts);
    if (ceph) this.orientation = ceph[0].orientation;
    this.resetStageCounters();
  }

  get stage(): ButcheryStage | null {
    return this.stages[this.idx] ?? null;
  }
  get stageIndex(): number { return this.idx; }
  get stageCount(): number { return this.stages.length; }
  get finished(): boolean { return this.idx >= this.stages.length; }
  get filletsDone(): number { return this._fillets; }
  get ikejimeDone(): boolean { return this._ikejime; }
  get bledDone(): boolean { return this._bled; }
  /** drag_fill/scoop 진행률 (0~1) */
  get currentFill(): number { return this.fillProgress; }
  /** guided_cut 남은 반복 컷 수 */
  get currentStrokesLeft(): number { return this.strokesLeft; }
  /** peel 남은 당김 수 */
  get currentPullsLeft(): number { return this.pullsLeft; }
  /** 다중 유도선 — 이미 그은 선 인덱스 (client가 완료선을 흐리게 렌더) */
  get donePathIndices(): ReadonlySet<number> { return this.pathsDone; }

  /** 현재 방향이 스테이지 요구와 일치하는가 (칼질 활성 게이트) */
  canAct(): boolean {
    const s = this.stage;
    return !!s && this.orientation === s.orientation && this.rotation === (s.rotationRequired ?? 0);
  }

  /** 도마 회전이 스테이지 요구와 맞는가 (방향은 맞는데 회전만 어긋난 경우 구분용) */
  rotationOk(): boolean {
    const s = this.stage;
    return !!s && this.rotation === (s.rotationRequired ?? 0);
  }

  /** 도마 90° 회전 — dir 1 = 시계방향 / -1 = 반시계방향 */
  rotate(dir: 1 | -1): BoardRotation {
    this.rotation = (((this.rotation + dir * 90) % 360) + 360) % 360 as BoardRotation;
    return this.rotation;
  }

  /** 시메 탭 — 목표점과의 거리(정규화)로 품질 판정 */
  submitTap(dist: number): { passed: boolean; quality: number } {
    const s = this.stage;
    if (!s || s.primitive !== 'tap' || !this.canAct()) return { passed: false, quality: 0 };
    const r = s.tapRadius ?? 0.08;
    if (dist > r * 1.6) return { passed: false, quality: 0 };   // 크게 빗나감 — 재시도
    const quality = Math.max(0.3, 1 - dist / r);
    this._ikejime = true;
    this.cutQualities.push(quality);
    this.advance();
    return { passed: true, quality };
  }

  /** 가이드 컷 제출 — strokesRequired 반복 처리 */
  submitCut(traced: CutPoint[]): CutEvalResult & { strokesLeft: number; stageDone: boolean; matchedPath: number } {
    const s = this.stage;
    // 경로형 프리미티브 전부 수용 — guided_cut + 두족류 신규(mantle_slit·lift_flap·drag_out…)
    if (!s || primitiveInput(s.primitive) !== 'path' || !s.cut || !this.canAct()) {
      return { coverage: 0, avgDeviationRatio: 9, quality: 0, passed: false, strokesLeft: this.strokesLeft, stageDone: false, matchedPath: -1 };
    }
    // nerve_cut — 길이 무관, **시작 위치 정확도** 단독 판정 (§3.1). 짧게 정확히 끊는 동작이라
    //  커버율을 요구하면 오히려 길게 긋도록 유도된다.
    if (s.primitive === 'nerve_cut') {
      const r = this.evalNerveCut(traced, s);
      if (r.passed) { this.cutQualities.push(r.quality); this._ikejime = true; this.advance(); }
      return { ...r, strokesLeft: 0, stageDone: r.passed, matchedPath: r.passed ? 0 : -1 };
    }
    const multi = s.cut.guidePaths;
    let res: CutEvalResult;
    let matchedPath = -1;

    if (multi && multi.length > 0) {
      // ── 다중 유도선 — 미완료 선 중 **가장 잘 맞는 것**으로 판정 (그은 순서 자유) ──
      let best: CutEvalResult | null = null;
      for (let i = 0; i < multi.length; i++) {
        if (this.pathsDone.has(i)) continue;
        const r = evaluateCut(traced, { ...s.cut, guidePath: multi[i] });
        if (!best || r.coverage > best.coverage) { best = r; matchedPath = i; }
      }
      res = best ?? { coverage: 0, avgDeviationRatio: 9, quality: 0, passed: false };
    } else {
      res = evaluateCut(traced, s.cut);
    }

    if (!res.passed) {
      return { ...res, strokesLeft: this.strokesLeft, stageDone: false, matchedPath: -1 };
    }
    this.cutQualities.push(res.quality);
    if (s.id === 'bleed_cut') this._bled = true;   // 얼음물까지 완료 시 확정되지만 컷 자체를 방혈로 기록
    if (matchedPath >= 0) this.pathsDone.add(matchedPath);
    this.strokesLeft = Math.max(0, this.strokesLeft - 1);
    if (this.strokesLeft > 0) {
      return { ...res, strokesLeft: this.strokesLeft, stageDone: false, matchedPath };
    }
    if (s.yieldsFillet) this._fillets++;
    this.advance();
    return { ...res, strokesLeft: 0, stageDone: true, matchedPath };
  }

  /** 비늘치기/내장 긁기 — 스트로크 이동량 누적 (0~1 delta) */
  submitFill(delta: number): { progress: number; stageDone: boolean } {
    const s = this.stage;
    // 영역 문지르기 계열 — drag_fill·scoop + 두족류 hold_scrub·salt_apply
    if (!s || primitiveInput(s.primitive) !== 'fill' || !this.canAct()) {
      return { progress: this.fillProgress, stageDone: false };
    }
    this.fillProgress = Math.min(1, this.fillProgress + delta);
    const target = s.fillTarget ?? 0.7;
    if (this.fillProgress >= target) {
      // 채움류(비늘/내장)는 이진 완료 — 품질 평균에 포함하지 않음 (컷 정확도 희석 방지)
      this.advance();
      return { progress: 1, stageDone: true };
    }
    return { progress: this.fillProgress / target, stageDone: false };
  }

  /**
   * 버튼 1탭으로 통과하는 스테이지 — 세척/얼음물 + 두족류 `result`(결과 확인)·`flip`(뷰 반전).
   * `result`는 조작이 없으므로 `canAct()`가 항상 참이어야 한다 (§3.1).
   */
  submitWash(): boolean {
    const s = this.stage;
    if (!s || primitiveInput(s.primitive) !== 'button') return false;
    if (s.primitive !== 'result' && !this.canAct()) return false;
    if (s.id === 'bleed_ice') this._bled = true;
    this.advance();
    return true;
  }

  /**
   * `nerve_cut` 판정 (§3.1) — **유도선 위에서 시작** + 스트로크 길이가 유도선 길이에 비례.
   * 커버율을 보지 않는 이유: 시메는 "짧고 정확하게"가 요구조건이라 길이를 늘리면 오히려 실패다.
   * ⚠ 구 판정(경로 **중점** 반경 시작 + 절대 길이 0.03~0.12)은 F9 실측으로 유도선이 길어지자
   *   (0.28~0.32) **가이드의 시작 링에서 긋기 시작해도 실패**했다(끝점↔중점 거리 > 반경) —
   *   시작점을 "선 위 아무 지점"으로, 길이 상한을 선 길이 비례로 완화 (2026-08-11).
   */
  private evalNerveCut(traced: CutPoint[], s: ButcheryStage): CutEvalResult {
    const fail = { coverage: 0, avgDeviationRatio: 9, quality: 0, passed: false };
    if (traced.length < 2 || !s.cut) return fail;
    const g = s.cut.guidePath;
    const r = s.tapRadius ?? 0.06;
    // 시작 정확도 = 유도선까지의 거리 (선 위 어디서 시작해도 좋다 — 끝점 시작이 자연스럽다)
    const d0 = distToPath(traced[0], g);
    let gLen = 0;
    for (let i = 1; i < g.length; i++) {
      gLen += Math.hypot(g[i].x - g[i - 1].x, g[i].y - g[i - 1].y);
    }
    let len = 0;
    for (let i = 1; i < traced.length; i++) {
      len += Math.hypot(traced[i].x - traced[i - 1].x, traced[i].y - traced[i - 1].y);
    }
    // 하한 = 유도선의 1/3은 그어야 "끊었다" / 상한 = 유도선 1.8배 넘게 길게 끌면 실패
    const minLen = Math.max(0.03, gLen * 0.35);
    const maxLen = Math.max(0.12, gLen * 1.8);
    if (d0 > r * 1.6 || len < minLen || len > maxLen) {
      return { ...fail, coverage: d0 <= r * 1.6 ? 1 : 0, avgDeviationRatio: d0 / r };
    }
    const quality = Math.max(0.3, 1 - d0 / (r * 1.6));
    return { coverage: 1, avgDeviationRatio: d0 / r, quality, passed: true };
  }

  /** 박피 당김 1회 (품질 0~1: 각도·거리 판정은 client가 계산해 전달) */
  submitPeelPull(quality: number): { passed: boolean; pullsLeft: number; stageDone: boolean } {
    const s = this.stage;
    if (!s || s.primitive !== 'peel' || !this.canAct()) {
      return { passed: false, pullsLeft: this.pullsLeft, stageDone: false };
    }
    if (quality < 0.25) return { passed: false, pullsLeft: this.pullsLeft, stageDone: false };
    this.cutQualities.push(Math.min(1, quality));
    this.pullsLeft = Math.max(0, this.pullsLeft - 1);
    if (this.pullsLeft > 0) return { passed: true, pullsLeft: this.pullsLeft, stageDone: false };
    this.advance();
    return { passed: true, pullsLeft: 0, stageDone: true };
  }

  /** 최종 결과 (finished 후 호출) */
  result(): ButcheryResult {
    const avg = this.cutQualities.length > 0
      ? this.cutQualities.reduce((a, b) => a + b, 0) / this.cutQualities.length
      : 0;
    const g = computeSashimiGrade({
      ikejimeDone: this._ikejime, bledDone: this._bled,
      avgCutQuality: avg, freshnessFactor: this.freshnessFactor,
    });
    return {
      filletCount: this._fillets,
      avgCutQuality: avg,
      ikejimeDone: this._ikejime,
      bledDone: this._bled,
      grade: g.grade,
      gradeMult: g.gradeMult,
    };
  }

  /** 전체 스테이지 정의 (자유 손질 섹션 컨트롤러/검증용 — 읽기 전용) */
  get stageList(): readonly ButcheryStage[] { return this.stages; }

  /**
   * 자유 손질 — 지정 스테이지로 점프 (섹션/작업 선택이 호출. 2026-07-30 자유 손질 개편).
   * 방향은 자동 전환하지 않는다(수동 뒤집기 원칙) — 단 FLESH_UP(필렛 뷰) 진입은
   * 뒤집기로 도달 불가한 뷰 전환이라 예외로 스냅한다.
   */
  jumpTo(stageId: string): boolean {
    const i = this.stages.findIndex((s) => s.id === stageId);
    if (i < 0) return false;
    this.idx = i;
    this.resetStageCounters();
    const s = this.stage;
    // dev 항법·재개는 **방향·회전 모두 스냅** — 수동 정렬/회전 대기로 조용히 멈추지 않게.
    //  (구: FLESH_UP·autoOrient만 방향 스냅 → dev 점프 후 FLIP 스테이지가 입력 차단되던 결함)
    if (s) {
      this.orientation = s.orientation;
      this.rotation = s.rotationRequired ?? 0;
    }
    return true;
  }

  /** 섹션 컨트롤러가 모든 작업 완료를 판정했을 때 강제 완료 처리 */
  forceFinish(): void {
    this.idx = this.stages.length;
  }

  private advance(): void {
    this.idx++;
    this.resetStageCounters();
    // 단계 전환 시 요구 방향으로 자동 정렬 (SASHIMI_STAGE_FLOW_FIX) —
    // 구 방식("client가 버튼으로 전환")은 수동 전환 누락 시 canAct() false로
    // 가이드·입력이 조용히 죽어 "머리따기 이후 진행 불가"로 체감되던 주원인.
    // autoOrient=false면 구 방식 유지 (client가 뒤집기 버튼/키로 전환).
    //  ⚠ 두족류는 예외 — 뷰 전이(개복→펼침→껍질면→살코기면)가 **공정 자체**라
    //    뒤집기 버튼으로 도달할 수 있는 자세가 아니다. 항상 스테이지 요구 뷰로 스냅한다.
    if ((this.cephalopod || TUNING.butchery.autoOrient) && this.stage) {
      this.orientation = this.stage.orientation;
    }
  }

  private resetStageCounters(): void {
    const s = this.stage;
    this.fillProgress = 0;
    // 다중 유도선이면 선 개수만큼 = 각 선 1회씩 (strokesRequired보다 우선)
    const multiN = s?.cut?.guidePaths?.length ?? 0;
    // 경로형 프리미티브는 기본 1회 (nerve_cut은 자체 판정이라 카운터를 쓰지 않는다)
    const pathPrim = !!s && primitiveInput(s.primitive) === 'path' && s.primitive !== 'nerve_cut';
    this.strokesLeft = multiN > 0
      ? multiN
      : (s?.cut?.strokesRequired ?? (pathPrim ? 1 : 0));
    this.pullsLeft = s?.pullsRequired ?? (s?.primitive === 'peel' ? 1 : 0);
    this.pathsDone.clear();
  }
}
