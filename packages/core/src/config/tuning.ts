/**
 * @file tuning.ts
 * @description 전 시스템 튜닝값 단일 소스 (core). feel=눈/dev패널, balance=시뮬.
 *
 * 규칙: 매직넘버를 코드에 흩지 말고 여기서만 관리. core 시뮬·client 렌더 공유.
 * TUNING은 dev 튜닝 패널(F8)이 실시간 수정할 수 있게 **가변 객체**(as const 아님).
 * 슬라이더 대상 스칼라는 TUNING_META에 등록. 확정값은 스펙에 스냅샷으로 기록.
 *
 * 분류: feel(눈 — dev 패널 라이브 조정) vs balance(수치 시뮬로 분포 확정).
 * ⚠ fight/rod/yield 테이블은 선언만 이전된 상태 — 기존 시뮬(FightPhysics2D/
 * ButcheryProcess 등)의 소비 전환은 차기 단계에서 점진 진행.
 */

// ────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────
/** 밑밥 종류별 물리 특성 (침강/확산/조류 친화) */
export interface ChumTypeSpec {
  /** 침강 속도 (m/s) */
  sinkRate: number;
  /** 확산 성장 계수 (m/s — spreadM = 0.3 + spreadGrow·age) */
  spreadGrow: number;
  /** 조류 타는 정도 0~1 */
  driftAffinity: number;
}
/** 밑밥 종류 — powder(크릴/미세 파우더) / grain(압맥·보리) / ball(무거운 경단) */
export type ChumTypeKey = 'powder' | 'grain' | 'ball';

export interface TuningConfig {
  // ── 회수·랜딩 접근 연출 (feel — FP_CAST_RETRIEVE_SPEC) ──
  retrieve: {
    /** 도달 세로위치(화면높이 비) — 70% 지점 */
    anchorYRatio: number;
    /** 착수 최소 크기 대비 최대 배율 (70% 도달 시) */
    growFactor: number;
    /** 착수 시 최소 스케일 (구 BASE_RIG_SCALE) */
    castScaleMin: number;
    /** 접근 트윈 힌트(실제는 distM 구동) */
    durationHintMs: number;
    /** 원줄 굵기 (px — 스케일과 무관하게 고정) */
    mainLineWidth: number;
    /** 원줄 투명도 = 채비α × 이 계수 (0.5 = 물고기보다 2배 투명) */
    mainLineAlphaFactor: number;
    /** 물고기 그림자 α — 원거리/70% 도달 */
    shadowAlphaFar: number;
    shadowAlphaNear: number;
    /** 착수 침강 카메오 지속(ms) — 무입력·무조류일 때만, 릴링 시 취소 */
    sinkCameoMs: number;
    /** 카메오 중 살짝 하강하는 픽셀량 */
    sinkCameoDescentPx: number;
    /** (선택) 전방 조류 성분의 크기 가산 계수 — 0 = distM 감소로만 반영 */
    forwardCurrentScaleK: number;
  };
  // ── 해저 지형 관통 방지 (balance — FP_FLOAT_RIG_DEPTH_SPEC §2) ──
  seabed: {
    /** 채비-바닥 최소 여유 (m) — 채비는 항상 바닥 위 이 간격을 유지 */
    rigClearanceM: number;
    /** 여밭 융기 시 채비가 바닥을 타고 오르는 속도 (m/s) */
    followRiseMps: number;
  };
  // ── 조류 존 (balance) ──
  zone: {
    /** 조경지대 침강 가속(sinkMult) 상한 — 급수직강하 인상 완화 */
    sinkMultCap: number;
  };
  // ── 구멍찌 입질 잠김 (feel) ──
  float: {
    /** 입질 단계별 찌 잠김 목표 (m) — core 기본 진폭을 데이터로 재매핑 */
    biteDipS1M: number;
    biteDipS2M: number;
    biteDipS3M: number;
    /** 잠김 px → α 페이드 구간 (잠길수록 연속으로 옅어짐) */
    biteFadeSpanPx: number;
  };
  // ── 수중찌 (feel) ──
  subfloat: {
    /** 드리프트 중 수중찌 잠김 깊이 (m — 추후 호수 연동) */
    buoyancyDepthM: number;
    /** 수중찌/구멍찌 재등장 시작 approach (등장 앵커 [appearFrom→0, 0.95→0.10, 1→1]) */
    appearFrom: number;
  };
  // ── 밑밥 투척 (feel + balance) ──
  chumThrow: {
    /** 투척점 수(중앙1+좌우) — 홀수 권장 */
    pointCount: number;
    /** 예측 드리프트 고스트 표시 */
    predictGhost: boolean;
    /** 밑밥 구름 초기 반경(px) */
    cloudBaseR: number;
  };
  // ── 밑밥 동조 (balance) ──
  chumSync: {
    /** 수심 일치 가우시안 시그마(m) */
    depthSigmaM: number;
    /** 수평 근접 가우시안 시그마(m) */
    horizSigmaM: number;
    /** 조류 원근(D) 성분 비중 */
    currentDWeight: number;
    /** 동조율→입질 배율 스케일 */
    syncToBiteMul: number;
  };
  chumTypes: Record<ChumTypeKey, ChumTypeSpec>;
  // ── 파이트 2D (balance) ──
  fight: {
    sideLoadCoef: number; steerRate: number; maxLeanRad: number;
    turnRate: number; swimSpeed: number;
    baseFatigue: number; dragFatigue: number; lateralFatigue: number;
    lowStaminaRoll: number; burstProbPerSec: number;
    /** 피로 페이즈 임계 (잔여 스태미나 비율) */
    phaseRun: number; phaseLull: number; phaseSurge: number;
    /** 슬랙 시 회복 */
    recoverRatePerSec: number;
  };
  // ── 로드 벤딩 (feel/balance) ──
  rod: {
    maxBendRad: number; sub: number;
    powerCapacityKg: Record<'UL' | 'L' | 'ML' | 'M' | 'MH' | 'H' | 'XH', number>;
    actionTipBias: Record<'slow' | 'moderato' | 'regular' | 'moderatoFast' | 'fast' | 'extraFast', number>;
  };
  // ── 시각 (feel) ──
  visual: {
    /** 깊이→투명 (1.15면 하드다이브 소멸) */
    bobberAlphaFactor: number;
    shadowAlphaMin: number; depthAlphaMin: number;
    /** 텐션 임계 (줄 색 경고/위험) */
    lineColorWarn: number; lineColorCritical: number;
  };
  // ── 데이터 테이블 (balance, 슬라이더 대상 아님) ──
  /** 어종 id → 피로 스태미나 base */
  fatigueStaminaBase: Record<string, number>;
  /** 어종 id → 살수율 */
  yieldBaseRate: Record<string, number>;
  /** 어종 id → 슬라이스 기준 g */
  yieldSliceGram: Record<string, number>;
  knifeToolFactor: Record<'utility' | 'sashimi' | 'yanagiba', number>;
  yieldSkill: { base: number; perLevel: number; accuracyWeight: number };
  freshnessFactor: Record<'live' | 'chilled' | 'frozen' | 'spoiled', number>;
}

// ────────────────────────────────────────────────────────────
// 기본값
// ────────────────────────────────────────────────────────────
export const TUNING: TuningConfig = {
  retrieve: {
    anchorYRatio: 0.70, growFactor: 2.0, castScaleMin: 0.72,
    durationHintMs: 1200, mainLineWidth: 1.4, mainLineAlphaFactor: 0.5,
    shadowAlphaFar: 0.15, shadowAlphaNear: 0.90,
    sinkCameoMs: 800, sinkCameoDescentPx: 14, forwardCurrentScaleK: 0.0,
  },
  seabed: { rigClearanceM: 0.15, followRiseMps: 3.0 },
  zone: { sinkMultCap: 1.6 },
  float: { biteDipS1M: 0.06, biteDipS2M: 0.14, biteDipS3M: 0.40, biteFadeSpanPx: 26 },
  subfloat: { buoyancyDepthM: 0.8, appearFrom: 0.90 },
  // predictGhost 기본 off — 드리프트 경로 예측선은 표시하지 않고, 수평뷰 조류 방향을
  // 보고 감으로 리드를 잡는 플레이를 유도한다 (피드백 ④. dev 튜닝 패널에서 재활성 가능)
  chumThrow: { pointCount: 13, predictGhost: false, cloudBaseR: 6 },
  chumSync: { depthSigmaM: 0.8, horizSigmaM: 1.2, currentDWeight: 0.6, syncToBiteMul: 1.0 },
  chumTypes: {
    powder: { sinkRate: 0.5, spreadGrow: 0.9, driftAffinity: 1.0 }, // 크릴/미세 집어제
    grain:  { sinkRate: 0.9, spreadGrow: 0.6, driftAffinity: 0.7 }, // 압맥·보리
    ball:   { sinkRate: 1.5, spreadGrow: 0.35, driftAffinity: 0.4 },// 무거운 경단
  },
  fight: {
    sideLoadCoef: 0.85, steerRate: 2.6, maxLeanRad: 1.05,
    turnRate: 1.4, swimSpeed: 6.0,
    baseFatigue: 0.005, dragFatigue: 0.015, lateralFatigue: 0.020,
    lowStaminaRoll: 0.15, burstProbPerSec: 4.8,
    phaseRun: 0.65, phaseLull: 0.35, phaseSurge: 0.15,
    recoverRatePerSec: 0.02,
  },
  rod: {
    maxBendRad: 1.15, sub: 6,
    powerCapacityKg: { UL: 1.5, L: 2.5, ML: 4.0, M: 6.0, MH: 9.0, H: 13.0, XH: 20.0 },
    actionTipBias: { slow: 0.40, moderato: 0.50, regular: 0.60, moderatoFast: 0.70, fast: 0.80, extraFast: 0.90 },
  },
  visual: {
    bobberAlphaFactor: 1.15, shadowAlphaMin: 0.15, depthAlphaMin: 0.25,
    lineColorWarn: 0.60, lineColorCritical: 0.85,
  },
  // 데이터 테이블 (대표값 — 나머지 어종 동일 형식으로 채움)
  fatigueStaminaBase: {
    yellowtail: 1.6, amberjack: 1.7, greater_amberjack: 1.9, spanish_mackerel: 1.0,
    pacific_cod: 1.2, red_seabream: 1.1, sea_bass: 0.95, flatfish: 0.7,
    squid: 0.55, cuttlefish: 0.55, dark_banded_rockfish: 0.6,
  },
  yieldBaseRate: {
    flatfish: 0.48, yellowtail: 0.52, amberjack: 0.52, greater_amberjack: 0.53,
    red_seabream: 0.42, sea_bass: 0.45, spanish_mackerel: 0.50,
    dark_banded_rockfish: 0.38, pacific_cod: 0.32,
  },
  yieldSliceGram: {
    flatfish: 9, yellowtail: 14, amberjack: 14, greater_amberjack: 15,
    red_seabream: 11, sea_bass: 11, spanish_mackerel: 13,
    dark_banded_rockfish: 10, pacific_cod: 12,
  },
  knifeToolFactor: { utility: 0.85, sashimi: 1.0, yanagiba: 1.10 },
  yieldSkill: { base: 0.80, perLevel: 0.03, accuracyWeight: 0.15 },
  freshnessFactor: { live: 1.05, chilled: 1.0, frozen: 0.9, spoiled: 0.7 },
};

// ────────────────────────────────────────────────────────────
// dev 슬라이더 메타 (path, 범위, 분류)
// ────────────────────────────────────────────────────────────
export interface TuningParamMeta {
  path: string; min: number; max: number; step: number;
  category: 'feel' | 'balance'; label: string;
}
export const TUNING_META: TuningParamMeta[] = [
  { path: 'retrieve.anchorYRatio', min: 0.65, max: 0.75, step: 0.01, category: 'feel', label: '회수 도달 Y비' },
  { path: 'retrieve.growFactor', min: 1.8, max: 2.4, step: 0.05, category: 'feel', label: '회수 최대 배율' },
  { path: 'retrieve.mainLineWidth', min: 0.8, max: 2.5, step: 0.1, category: 'feel', label: '원줄 굵기' },
  { path: 'retrieve.mainLineAlphaFactor', min: 0.4, max: 0.6, step: 0.01, category: 'feel', label: '원줄 α 계수' },
  { path: 'retrieve.sinkCameoMs', min: 400, max: 1200, step: 50, category: 'feel', label: '침강 카메오(ms)' },
  { path: 'seabed.rigClearanceM', min: 0.05, max: 0.4, step: 0.01, category: 'balance', label: '채비-바닥 여유(m)' },
  { path: 'seabed.followRiseMps', min: 1.0, max: 6.0, step: 0.5, category: 'balance', label: '융기 추종 상승' },
  { path: 'zone.sinkMultCap', min: 1.2, max: 2.2, step: 0.05, category: 'balance', label: '조경 침강 상한' },
  { path: 'float.biteFadeSpanPx', min: 14, max: 40, step: 1, category: 'feel', label: '찌 잠김 페이드px' },
  { path: 'subfloat.appearFrom', min: 0.85, max: 0.95, step: 0.01, category: 'feel', label: '수중찌 등장 시점' },
  { path: 'chumThrow.pointCount', min: 9, max: 17, step: 2, category: 'feel', label: '투척점 수' },
  { path: 'chumThrow.cloudBaseR', min: 3, max: 14, step: 1, category: 'feel', label: '밑밥 구름 반경' },
  { path: 'rod.maxBendRad', min: 0.6, max: 1.6, step: 0.05, category: 'feel', label: '로드 최대 휨' },
  { path: 'chumSync.depthSigmaM', min: 0.3, max: 2.0, step: 0.1, category: 'balance', label: '동조 수심σ(m)' },
  { path: 'chumSync.horizSigmaM', min: 0.5, max: 3.0, step: 0.1, category: 'balance', label: '동조 수평σ(m)' },
  { path: 'chumSync.currentDWeight', min: 0.0, max: 1.0, step: 0.05, category: 'balance', label: '조류 D비중' },
  { path: 'chumSync.syncToBiteMul', min: 0.5, max: 2.0, step: 0.05, category: 'balance', label: '동조→입질 배율' },
  { path: 'chumTypes.powder.sinkRate', min: 0.2, max: 1.2, step: 0.05, category: 'balance', label: '파우더 침강' },
  { path: 'chumTypes.grain.sinkRate', min: 0.4, max: 1.6, step: 0.05, category: 'balance', label: '압맥 침강' },
  { path: 'chumTypes.ball.sinkRate', min: 0.8, max: 2.4, step: 0.05, category: 'balance', label: '경단 침강' },
  { path: 'fight.sideLoadCoef', min: 0.3, max: 1.5, step: 0.05, category: 'balance', label: '측면하중 계수' },
  { path: 'fight.recoverRatePerSec', min: 0.0, max: 0.06, step: 0.005, category: 'balance', label: '스태미나 회복' },
];

// ── path 유틸 (dev 패널 공용) ──
/** 'a.b.c' 경로의 튜닝 스칼라 조회 */
export function getTuning(path: string): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split('.').reduce<any>((o, k) => (o == null ? o : o[k]), TUNING);
}
/** 'a.b.c' 경로의 튜닝 스칼라 설정 (dev 패널 슬라이더) */
export function setTuning(path: string, value: number): void {
  const keys = path.split('.');
  const last = keys.pop() as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = keys.reduce<any>((o, k) => (o == null ? o : o[k]), TUNING);
  if (obj) obj[last] = value;
}
