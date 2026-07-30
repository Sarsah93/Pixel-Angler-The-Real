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
  OrientationState, ButcheryResult, SashimiGrade,
  FilletYieldInput, FilletYieldResult,
} from '../types/Butchery.js';
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

  // 필렛 장수 — 대형 광어는 5장뜨기 분기
  let filletCount: number = profile.filletCount;
  if (profile.bodyShape === 'flat' && lengthCm >= 45) filletCount = 5;

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
  id: string, orientation: OrientationState, guidePath: CutPoint[],
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

/** 프로필 기반 손질 스테이지 목록 생성 (오리엔티드 뷰 정규화 좌표 — 머리는 항상 왼쪽 기준) */
export function buildButcheryStages(profile: ButcheryProfile, opts?: ButcheryStageOptions): ButcheryStage[] {
  const stages: ButcheryStage[] = [];

  // 1. 시메 — 눈 뒤 뇌 지점 탭 (활어→즉살, 선도 유지)
  stages.push({
    id: 'ikejime', label: '시메 (즉살)', orientation: 'BASE', primitive: 'tap',
    guide: '눈 뒤 뇌 지점을 정확히 탭하세요 — 신경 차단으로 선도가 유지됩니다',
    // dev 가이드 편집기(F9) 실측 좌표 — 돔류 (2026-07-30 사용자 확정)
    tapPoint: { x: 0.239, y: 0.410 }, tapRadius: 0.09,
  });

  // 2. 방혈 — 아가미 절개 + 얼음물
  stages.push({
    id: 'bleed_cut', label: '방혈 — 아가미 절개', orientation: 'BASE', primitive: 'guided_cut',
    guide: '아가미 안쪽을 세로로 그어 피를 빼세요',
    // 아가미 안쪽을 따라 도는 곡선 (7점 — dev 곡선 편집기 실측, 2026-07-30 사용자 확정)
    cut: cut('bleed_cut', 'BASE', [
      { x: 0.255, y: 0.392 }, { x: 0.275, y: 0.454 }, { x: 0.283, y: 0.518 },
      { x: 0.285, y: 0.583 }, { x: 0.285, y: 0.648 }, { x: 0.277, y: 0.713 },
      { x: 0.259, y: 0.775 },
    ]),
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
      sweepPath: [
        { x: 0.734, y: 0.477 }, { x: 0.695, y: 0.605 }, { x: 0.694, y: 0.403 }, { x: 0.625, y: 0.704 },
        { x: 0.648, y: 0.368 }, { x: 0.564, y: 0.779 }, { x: 0.601, y: 0.304 }, { x: 0.492, y: 0.839 },
        { x: 0.549, y: 0.247 }, { x: 0.402, y: 0.828 }, { x: 0.493, y: 0.190 }, { x: 0.319, y: 0.828 },
        { x: 0.436, y: 0.144 }, { x: 0.239, y: 0.864 }, { x: 0.375, y: 0.109 }, { x: 0.165, y: 0.807 },
        { x: 0.303, y: 0.070 }, { x: 0.162, y: 0.446 }, { x: 0.225, y: 0.080 }, { x: 0.172, y: 0.158 },
      ],
    });
    stages.push({
      id: 'scale_flip', label: '비늘치기 (뒷면)', orientation: 'FLIP', primitive: 'drag_fill',
      guide: '뒤집어서 반대면 비늘도 전부 벗기세요',
      fillTarget: 0.92,
      sweepPath: [
        { x: 0.311, y: 0.509 }, { x: 0.314, y: 0.641 }, { x: 0.367, y: 0.417 }, { x: 0.358, y: 0.701 },
        { x: 0.419, y: 0.339 }, { x: 0.406, y: 0.772 }, { x: 0.469, y: 0.258 }, { x: 0.463, y: 0.853 },
        { x: 0.528, y: 0.233 }, { x: 0.527, y: 0.889 }, { x: 0.589, y: 0.229 }, { x: 0.588, y: 0.889 },
        { x: 0.649, y: 0.236 },
      ],
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
    cut: cut('head_base', 'BASE', [{ x: 0.283, y: 0.307 }, { x: 0.346, y: 0.867 }]),
  });
  stages.push({
    id: 'head_flip', label: '머리따기 (뒷면 사선 → 분리)', orientation: 'FLIP', primitive: 'guided_cut',
    guide: '뒤집어 같은 사선을 맞추면 머리가 분리됩니다',
    cut: cut('head_flip', 'FLIP', [{ x: 0.703, y: 0.300 }, { x: 0.649, y: 0.867 }], { strong: true }),
  });

  // 4b. 지느러미 제거 (선-5 — 등·뒷지느러미 양옆 칼집 → 뽑기. 픽셀 가이드 선행부 신설)
  // 지느러미 제거 — **다중 유도선 3개**(등 / 뒷(배) / 가슴). 순서 자유, 각 1회씩.
  //  좌표는 dev 곡선 편집기(F9)로 실측 조정 예정 — 현재는 실루엣 근사 기본값.
  stages.push({
    id: 'finectomy', label: '지느러미 제거 (등·뒷·가슴)', orientation: 'BASE', primitive: 'guided_cut',
    guide: '등·뒷·가슴 지느러미 밑동을 따라 각각 칼집을 넣어 뽑으세요 (3곳 — 순서 자유)',
    // dev 곡선 편집기(F9) 실측 좌표 — 돔류 (2026-07-30 사용자 확정)
    cut: cut('finectomy', 'BASE',
      [{ x: 0.338, y: 0.282 }, { x: 0.382, y: 0.261 }, { x: 0.430, y: 0.271 }, { x: 0.467, y: 0.301 }, { x: 0.501, y: 0.338 }, { x: 0.532, y: 0.377 }, { x: 0.557, y: 0.421 }],
      {
        tolerance: 0.09, minCoverage: 0.5,
        guidePaths: [
          // 선1 — 등지느러미 밑동 (등 능선을 따라 꼬리쪽으로)
          [{ x: 0.338, y: 0.282 }, { x: 0.382, y: 0.261 }, { x: 0.430, y: 0.271 }, { x: 0.467, y: 0.301 }, { x: 0.501, y: 0.338 }, { x: 0.532, y: 0.377 }, { x: 0.557, y: 0.421 }],
          // 선2 — 뒷(배)지느러미 밑동
          [{ x: 0.362, y: 0.729 }, { x: 0.406, y: 0.751 }, { x: 0.455, y: 0.757 }, { x: 0.492, y: 0.724 }, { x: 0.518, y: 0.682 }, { x: 0.542, y: 0.638 }, { x: 0.568, y: 0.594 }],
          // 선3 — 가슴지느러미 밑동 (아가미 뒤 — 짧은 곡선)
          [{ x: 0.400, y: 0.467 }, { x: 0.391, y: 0.479 }, { x: 0.381, y: 0.490 }, { x: 0.377, y: 0.505 }, { x: 0.371, y: 0.519 }, { x: 0.370, y: 0.534 }, { x: 0.367, y: 0.548 }],
        ],
      }),
  });

  // 5. 내장 제거 — 개복(항문→머리 경계) → 긁어내기 → 세척
  stages.push({
    id: 'gut_open', label: '개복 (항문→머리 경계)', orientation: 'BELLY_UP', primitive: 'guided_cut',
    guide: '항문에서 머리 경계까지 배를 가르세요',
    cut: cut('gut_open', 'BELLY_UP', [{ x: profile.anusRatio, y: 0.5 }, { x: 0.14, y: 0.5 }], { tolerance: 0.09 }),
  });
  stages.push({
    id: 'gut_scoop', label: '내장 비우기', orientation: 'BELLY_UP', primitive: 'scoop',
    guide: '갈빗대 안쪽 내장 덩어리를 긁어 통째로 꺼내세요',
    fillTarget: 0.85,
    // 복면 뷰 — 가른 정중선을 따라 항문 → 머리 경계까지 훑어 비운다
    sweepPath: [{ x: profile.anusRatio, y: 0.5 }, { x: 0.2, y: 0.5 }],
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
    cut: cut('tail_grip', 'BASE', [{ x: 0.732, y: 0.376 }, { x: 0.736, y: 0.627 }], { minCoverage: 0.5 }),
  });
  stages.push({
    id: 'tail_grip_b', label: '꼬리 칼집 (뒷면)', orientation: 'FLIP', primitive: 'guided_cut',
    guide: '뒤집어 반대면 꼬리에도 얕은 홈을 내세요',
    cut: cut('tail_grip_b', 'FLIP', [{ x: 0.274, y: 0.395 }, { x: 0.273, y: 0.624 }], { minCoverage: 0.5 }),
  });

  // 7~8. 장 뜨기 — 면별 등쪽/배쪽 각각 척추까지 (자유 손질: 두 컷 순서 무관, 둘 다 = 분리).
  //  round=삼면뜨기(양살 2장), flat=다섯장뜨기(중앙선 기준 상·하 양측 4~5장).
  const flat = profile.bodyShape === 'flat';
  for (let f = 0; f < profile.filletCount; f++) {
    const sideLabel = flat
      ? `다섯장뜨기 ${f + 1}/${profile.filletCount}장`
      : f === 0 ? '1면' : '2면';
    // 등쪽 = **등을 카메라 쪽으로 눕힌 뷰**(머리 오른쪽·꼬리 왼쪽 — 실사 정합).
    //  칼집 3회로 길이 점점 깊어지며 벌어진다(1회 붉은 살 조금 → 2회 뼈 노출 → 3회 반대쪽까지).
    stages.push({
      id: `fillet_${f}_score`, label: `${sideLabel} — 등쪽 → 척추까지`, orientation: 'BACK_DOWN', primitive: 'guided_cut',
      guide: flat
        ? '몸통 중앙선을 기준으로 한쪽 반신의 지느러미 경계를 따라 얕은 칼집 3회'
        : '등 지느러미 자리를 따라 머리쪽(우) → 꼬리쪽(좌)으로 칼집을 넣어 척추뼈까지 뜨세요 (3회 — 점점 깊게)',
      cut: cut(`fillet_${f}_score`, 'BACK_DOWN',
        [{ x: 0.798, y: 0.575 }, { x: 0.197, y: 0.490 }], { strokesRequired: 3, tolerance: 0.09 }),
    });
    if (f === 1 && !flat) {
      // ── 2면 전용 구조 (사용자 지시 2026-07-31) — 1면이 이미 분리돼 [척추뼈+2면 살] 덩어리 ──
      //  등쪽 작업: 척추경계 3컷(위 score) + ④ 머리쪽 갈비뼈 z-index 끊기.
      //  머리 부근에서 칼을 깊게 넣어 척추뼈 뒤(z축·먼쪽·안 보임)에서 내장막을 감싼 갈비뼈가
      //  만나므로, 그 갈비뼈를 부러뜨리며 내장쪽으로 썰어낸다 (등쪽 작업 마무리).
      stages.push({
        id: 'fillet_1_ribcut', label: '2면 — 갈비뼈 끊기 (머리쪽 깊이·z축)', orientation: 'BACK_DOWN', primitive: 'guided_cut',
        guide: '머리 부근에서 칼을 깊숙히 넣어 척추뼈 뒤(안 보이는 z축)의 갈비뼈를 부러뜨리며 내장쪽으로 썰어내세요',
        cut: cut('fillet_1_ribcut', 'BACK_DOWN', [{ x: 0.78, y: 0.5 }, { x: 0.6, y: 0.62 }], { strong: true, tolerance: 0.12 }),
      });
      // 배쪽 작업 = **꼬리쪽 → 배쪽 분리** (척추는 등쪽서 이미 끊었으니 재절단 없음).
      //  꼬리쪽에서 아가미(내장 있던) 방향으로 척추뼈와 위 살덩어리 사이를 여러 번 그어 분리.
      stages.push({
        id: 'fillet_1_sever', label: '2면 — 꼬리쪽 → 배쪽 분리', orientation: 'BELLY_UP', primitive: 'guided_cut',
        guide: '꼬리쪽에서 아가미(내장 있던) 방향으로 척추뼈와 위 살덩어리 사이를 여러 번 그어 분리하세요 (3회 — 점점 깊게)',
        cut: cut('fillet_1_sever', 'BELLY_UP', [{ x: 0.2, y: 0.5 }, { x: 0.82, y: 0.5 }], { strokesRequired: 3, tolerance: 0.1 }),
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
    cut: cut('rib_a', 'FLESH_UP', [{ x: 0.12, y: 0.58 }, { x: 0.3, y: 0.68 }, { x: 0.46, y: 0.72 }], { tolerance: 0.09 }),
  });
  stages.push({
    id: 'rib_b', label: '갈빗대 제거 (필렛 B)', orientation: 'FLESH_UP', primitive: 'guided_cut',
    guide: '반대쪽 필렛도 같은 방식으로 갈빗대 판을 도려내세요',
    cut: cut('rib_b', 'FLESH_UP', [{ x: 0.12, y: 0.58 }, { x: 0.3, y: 0.68 }, { x: 0.46, y: 0.72 }], { tolerance: 0.09 }),
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

  // 11. 박피 — 꼬리 손잡이 잡고 15도 삽입 → 좌로 당김 (필렛 수만큼)
  stages.push({
    id: 'peel', label: '박피 (껍질 벗기기)', orientation: 'FLESH_UP', primitive: 'peel',
    guide: '꼬리 손잡이를 잡고 껍질/살 사이 15도로 칼을 눕혀 왼쪽으로 당기세요',
    pullsRequired: profile.filletCount,
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
  orientation: OrientationState = 'BASE';

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

  constructor(profile: ButcheryProfile, freshnessFactor: number, opts?: ButcheryStageOptions) {
    this.profile = profile;
    this.freshnessFactor = freshnessFactor;
    this.stages = buildButcheryStages(profile, opts);
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
    return !!s && this.orientation === s.orientation;
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
    if (!s || s.primitive !== 'guided_cut' || !s.cut || !this.canAct()) {
      return { coverage: 0, avgDeviationRatio: 9, quality: 0, passed: false, strokesLeft: this.strokesLeft, stageDone: false, matchedPath: -1 };
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
    if (!s || (s.primitive !== 'drag_fill' && s.primitive !== 'scoop') || !this.canAct()) {
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

  /** 세척/얼음물 버튼 */
  submitWash(): boolean {
    const s = this.stage;
    if (!s || s.primitive !== 'wash' || !this.canAct()) return false;
    if (s.id === 'bleed_ice') this._bled = true;
    this.advance();
    return true;
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
    if (s && (s.orientation === 'FLESH_UP' || TUNING.butchery.autoOrient)) {
      this.orientation = s.orientation;
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
    if (TUNING.butchery.autoOrient && this.stage) this.orientation = this.stage.orientation;
  }

  private resetStageCounters(): void {
    const s = this.stage;
    this.fillProgress = 0;
    // 다중 유도선이면 선 개수만큼 = 각 선 1회씩 (strokesRequired보다 우선)
    const multiN = s?.cut?.guidePaths?.length ?? 0;
    this.strokesLeft = multiN > 0
      ? multiN
      : (s?.cut?.strokesRequired ?? (s?.primitive === 'guided_cut' ? 1 : 0));
    this.pullsLeft = s?.pullsRequired ?? (s?.primitive === 'peel' ? 1 : 0);
    this.pathsDone.clear();
  }
}
