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
} from '../types/Butchery.js';

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
  };
}

/** 프로필 기반 손질 스테이지 목록 생성 (오리엔티드 뷰 정규화 좌표 — 머리는 항상 왼쪽 기준) */
export function buildButcheryStages(profile: ButcheryProfile): ButcheryStage[] {
  const stages: ButcheryStage[] = [];

  // 1. 시메 — 눈 뒤 뇌 지점 탭 (활어→즉살, 선도 유지)
  stages.push({
    id: 'ikejime', label: '시메 (즉살)', orientation: 'BASE', primitive: 'tap',
    guide: '눈 뒤 뇌 지점을 정확히 탭하세요 — 신경 차단으로 선도가 유지됩니다',
    tapPoint: { x: 0.16, y: 0.38 }, tapRadius: 0.09,
  });

  // 2. 방혈 — 아가미 절개 + 얼음물
  stages.push({
    id: 'bleed_cut', label: '방혈 — 아가미 절개', orientation: 'BASE', primitive: 'guided_cut',
    guide: '아가미 안쪽을 세로로 그어 피를 빼세요',
    cut: cut('bleed_cut', 'BASE', [{ x: 0.22, y: 0.28 }, { x: 0.245, y: 0.62 }]),
  });
  stages.push({
    id: 'bleed_ice', label: '방혈 — 얼음물 담그기', orientation: 'BASE', primitive: 'wash',
    guide: '얼음물에 담가 방혈을 완료하세요 (잡내 감소·선도 향상)',
  });

  // 3. 비늘치기 (양면) + 세척 — hasScales 어종만
  if (profile.hasScales) {
    stages.push({
      id: 'scale_base', label: '비늘치기 (앞면)', orientation: 'BASE', primitive: 'drag_fill',
      guide: '꼬리→머리 역결 방향으로 문질러 비늘을 벗기세요',
      fillTarget: 0.55 + profile.scaleToughness * 0.35,
    });
    stages.push({
      id: 'scale_flip', label: '비늘치기 (뒷면)', orientation: 'FLIP', primitive: 'drag_fill',
      guide: '뒤집어서 반대면 비늘도 벗기세요',
      fillTarget: 0.55 + profile.scaleToughness * 0.35,
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
    cut: cut('head_base', 'BASE', [{ x: 0.175, y: 0.22 }, { x: 0.27, y: 0.7 }]),
  });
  stages.push({
    id: 'head_flip', label: '머리따기 (뒷면 사선 → 분리)', orientation: 'FLIP', primitive: 'guided_cut',
    guide: '뒤집어 같은 사선을 맞추면 머리가 분리됩니다',
    cut: cut('head_flip', 'FLIP', [{ x: 0.825, y: 0.22 }, { x: 0.73, y: 0.7 }], { strong: true }),
  });

  // 5. 내장 제거 — 개복(항문→머리 경계) → 긁어내기 → 세척
  stages.push({
    id: 'gut_open', label: '개복 (항문→머리 경계)', orientation: 'BELLY_UP', primitive: 'guided_cut',
    guide: '항문에서 머리 경계까지 배를 가르세요',
    cut: cut('gut_open', 'BELLY_UP', [{ x: profile.anusRatio, y: 0.5 }, { x: 0.14, y: 0.5 }], { tolerance: 0.09 }),
  });
  stages.push({
    id: 'gut_scoop', label: '내장 비우기 + 척추 피 긁기', orientation: 'BELLY_UP', primitive: 'scoop',
    guide: '내장을 긁어내고 척추의 피(신장막)를 긁으세요',
    fillTarget: 0.7,
  });
  stages.push({
    id: 'gut_wash', label: '뱃속 세척', orientation: 'BELLY_UP', primitive: 'wash',
    guide: '뱃속을 흐르는 물에 깨끗이 씻으세요',
  });

  // 6. 꼬리 손잡이 — 박피용 홈
  stages.push({
    id: 'tail_grip', label: '꼬리 손잡이 홈', orientation: 'BASE', primitive: 'guided_cut',
    guide: '꼬리 쪽에 얕은 홈을 내 박피 손잡이를 만드세요',
    cut: cut('tail_grip', 'BASE', [{ x: 0.87, y: 0.36 }, { x: 0.885, y: 0.62 }], { minCoverage: 0.5 }),
  });

  // 7~8. 장 뜨기 — 등 경계 얕은 칼집 ×3 → 강한 썰기(뼈 끊기) 분리. 필렛 수만큼 반복.
  const filletPairs = profile.filletCount / 2;
  for (let f = 0; f < profile.filletCount; f++) {
    const sideLabel = profile.bodyShape === 'flat'
      ? `${f + 1}번째 장 (5장뜨기 ${f + 1}/${profile.filletCount})`
      : f === 0 ? '첫 장' : '둘째 장';
    void filletPairs;
    stages.push({
      id: `fillet_${f}_score`, label: `${sideLabel} — 등 경계 칼집`, orientation: 'BACK_DOWN', primitive: 'guided_cut',
      guide: '등 경계를 따라 얕은 칼집을 3회 넣으세요 (머리 자리→꼬리)',
      cut: cut(`fillet_${f}_score`, 'BACK_DOWN',
        [{ x: 0.14, y: 0.3 }, { x: 0.86, y: 0.28 }], { strokesRequired: 3, tolerance: 0.09 }),
    });
    stages.push({
      id: `fillet_${f}_sever`, label: `${sideLabel} — 중골 위 강한 분리`, orientation: 'BACK_DOWN', primitive: 'guided_cut',
      guide: '내장 자리~척추 위를 강하게 썰어(뼈 끊기) 한 장을 분리하세요',
      cut: cut(`fillet_${f}_sever`, 'BACK_DOWN',
        [{ x: 0.13, y: 0.5 }, { x: 0.88, y: 0.5 }], { strong: true, tolerance: 0.1 }),
      yieldsFillet: true,
    });
  }

  // 9. 박피 — 꼬리 손잡이 잡고 15도 삽입 → 좌로 당김 (필렛 수만큼)
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
  private pullsLeft = 0;
  private _fillets = 0;
  private _ikejime = false;
  private _bled = false;
  private freshnessFactor: number;

  constructor(profile: ButcheryProfile, freshnessFactor: number) {
    this.profile = profile;
    this.freshnessFactor = freshnessFactor;
    this.stages = buildButcheryStages(profile);
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
  submitCut(traced: CutPoint[]): CutEvalResult & { strokesLeft: number; stageDone: boolean } {
    const s = this.stage;
    if (!s || s.primitive !== 'guided_cut' || !s.cut || !this.canAct()) {
      return { coverage: 0, avgDeviationRatio: 9, quality: 0, passed: false, strokesLeft: this.strokesLeft, stageDone: false };
    }
    const res = evaluateCut(traced, s.cut);
    if (!res.passed) {
      return { ...res, strokesLeft: this.strokesLeft, stageDone: false };
    }
    this.cutQualities.push(res.quality);
    if (s.id === 'bleed_cut') this._bled = true;   // 얼음물까지 완료 시 확정되지만 컷 자체를 방혈로 기록
    this.strokesLeft = Math.max(0, this.strokesLeft - 1);
    if (this.strokesLeft > 0) {
      return { ...res, strokesLeft: this.strokesLeft, stageDone: false };
    }
    if (s.yieldsFillet) this._fillets++;
    this.advance();
    return { ...res, strokesLeft: 0, stageDone: true };
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

  private advance(): void {
    this.idx++;
    this.resetStageCounters();
    // 다음 스테이지 방향 게이트 힌트를 위해 orientation은 유지 (client가 버튼으로 전환)
  }

  private resetStageCounters(): void {
    const s = this.stage;
    this.fillProgress = 0;
    this.strokesLeft = s?.cut?.strokesRequired ?? (s?.primitive === 'guided_cut' ? 1 : 0);
    this.pullsLeft = s?.pullsRequired ?? (s?.primitive === 'peel' ? 1 : 0);
  }
}
