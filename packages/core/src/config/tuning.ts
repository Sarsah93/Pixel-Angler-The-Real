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
  // ── 밑밥 확산 rev2 (feel + balance — CHUM_DIFFUSION_SPEC) ──
  chum: {
    /** parcel 총 수명 (ms) — 초과 시 완전 제거 */
    lifetimeMs: number;
    /** 농도 페이드 시작 α + 곡률 (α = alphaStart·(1−t01^pow) — 연속) */
    alphaStart: number;
    alphaCurvePow: number;
    /** 침강 하한 (m/s) — 조류 감쇠 후에도 이 밑으로는 안 느려짐 */
    minSinkMps: number;
    /** 조류 침강 감쇠 계수 — sink = typeSink·(1−damp·cur01) */
    currentSinkDamp: number;
    /** 조류 세기 정규화 기준 (m/s → cur01 = speed/ref 클램프) */
    currentRefMps: number;
    /** 타원 초기 반경/확산 속도 (m) — 장축(속도방향)/단축(수직) */
    rMajor0: number;
    rMinor0: number;
    spreadMajorMps: number;
    spreadMinorMps: number;
    /** 단축 상한 (m) — 무한 원 방지 */
    rMinorMaxM: number;
    /** 속도 기반 장축 신장 계수 */
    elongK: number;
    /** 수직에서 최대 눕힘 각 (도) — 완전 수평 과회전 방지 */
    tiltMaxDeg: number;
    /** 지형 접촉 코팅 지속 (ms) + 바닥 여유 (m) */
    coatMs: number;
    coatClearanceM: number;
    /** 바닥 코팅 중 바닥층 미끼 동조 가산 */
    bottomSyncBonus: number;
  };
  /** 정면뷰 표면 착수 확산 (침강 구름 대신 스며듦) */
  frontSplash: {
    /** 표면 확산 페이드 (ms) */
    seepFadeMs: number;
    /** 조류 쪽으로 기우는 정도 */
    leanK: number;
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
    // rev2 — 초릿대 5분절 점증 벤딩 (하중 side · 일자 축 재교차 금지)
    /** 초릿대 분절 수 (tipShare 길이와 일치) */
    tipSegments: number;
    /** 분절별 점증 각도 몫 (합 1.0 — 팁쪽일수록 크게) */
    tipShare: number[];
    /** 누적 벤딩 상한 (도) — 일자 축 대비 90° 초과 = 축 되넘음(초릿대 늘어남) 금지 */
    maxTipBendDeg: number;
    /** 근접(릴링 진행) 시 각도 가산 계수 */
    nearGain: number;
    /** 하중 앵커 화면밖 접근 시 각도 가산 계수 (드라마틱 — 상한 내에서) */
    offscreenGain: number;
    /** 전체 로드 중 초릿대(벤딩 구간) 길이 비율 */
    tipLenRatio: number;
    /** 부호·각도 스무딩 lerp (side 전환 시 0을 지나며 완화) */
    smoothLerp: number;
    /**
     * 풀 벤딩 기준 축 이탈각 (도) — 하중이 로드 일자 궤도 위(정렬 = 측면 모멘트 없음)면
     * 벤딩 0으로 연속 수렴, 이 각도 이상 벗어나면 풀 벤딩 (sin 비율 램프)
     */
    alignRefDeg: number;
    /**
     * 측면 램프 파워 커브 — 축 근처 소이탈(±5°)의 측면 굴곡을 "거의 티 안 나게" 억제
     * (lat = (|sinθ|/sinRef)^pow — 1 = 선형, 클수록 축 근처 완만)
     */
    latRampPow: number;
    /**
     * 전방 말림(포어쇼트닝) 팁 최말단 축소율 — 하중이 축 정렬 + 손잡이(릴) 쪽일수록
     * 초릿대가 z(깊이) 방향으로 말려 투영상 짧아진다. 분절별 선형 가중(팁쪽 최대)이라
     * 초릿대 전체 축소 ≈ 이 값의 절반 (0.8 → 총 2/5 = "5단 중 2단")
     */
    foldMax: number;
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
  // ── 뒷줄견제 미세 리프트 (feel — FP_HOLD_AND_VIEW_POLISH §1) ──
  hold: {
    /** 뒷줄견제(H) 순간 미세 상승 (m) — 손가락 두 마디 (구 core HOLD_LIFT_M 2m 대체) */
    liftM: number;
    /** 상승 속도 (m/s, 완만) */
    liftRateMps: number;
  };
  // ── 조경 포말 (feel — §3) ──
  foam: {
    /** 찌 부근 포말 X 분산 (px — 좁게 뭉침) */
    spreadPx: number;
  };
  // ── 정면뷰 배경 그라데이션 밴드 (feel — §4) ──
  view: {
    /** 바다 그라데이션 밴드 수 (반전: 상단 어둡게/깊게 → 하단 옅게) */
    seaBands: number;
    /** 하늘 그라데이션 보간 밴드 수 (4 앵커 → N밴드) */
    skyBands: number;
  };
  // ── 착수/드리프트 ←/→ 채비 횡 이동 (feel — CAST_MOVE_SPEC) ──
  castMove: {
    /** 이동 강도 단계 (m/s) — 조금씩<서서히<보통<많이<과감히 (mockup) */
    tinyMps: number; slowMps: number; normalMps: number; lotsMps: number; boldMps: number;
    /** 조류 세기 경계 (m/s) — 정지 / 약함 / 중간(이상=강함) */
    stillCur: number; weakCur: number; mediumCur: number;
  };
  // ── 파이트 ←/→ + 릴링 물고기 견인 (feel — §3) ──
  fightPull: {
    /** 물고기 무대 횡 견인 속도 (px/s — f2d 좌표계) */
    lateralStagePerSec: number;
  };
  // ── 뒷줄견제 목줄 스트리밍 (balance — CHUM_3D_OVERLAP §3) ──
  leader: {
    /** 무부하 목줄 처짐 각 (수직 기준, 도) */
    baseDeg: number;
    /** 뒷줄견제 홀드 시 추가 눕힘 (도) */
    holdDeg: number;
    /** 조류 세기(0~1)당 추가 각 (도) — 중간(0.5)에서 ~70° */
    curGain: number;
    /** 스트리밍 상한 (도) */
    maxDeg: number;
    /** 목줄 길이 (m — 커스텀 없을 때) */
    defaultLenM: number;
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
  // 밑밥 확산 rev2 — 8초 수명·조류 감쇠 침강·속도벡터 정렬 타원·지형 코팅.
  // 종류별 기본 침강(baseSink 역할)은 chumTypes.sinkRate가 담당 (강조류=경단 전략 유지).
  chum: {
    lifetimeMs: 8000, alphaStart: 0.9, alphaCurvePow: 1.4,
    minSinkMps: 0.12, currentSinkDamp: 0.6, currentRefMps: 0.5,
    rMajor0: 0.3, rMinor0: 0.3, spreadMajorMps: 0.7, spreadMinorMps: 0.30,
    rMinorMaxM: 1.2, elongK: 1.5, tiltMaxDeg: 72,
    coatMs: 2000, coatClearanceM: 0.10, bottomSyncBonus: 0.20,
  },
  frontSplash: { seepFadeMs: 1800, leanK: 0.4 },
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
    tipSegments: 5,
    tipShare: [0.08, 0.14, 0.20, 0.26, 0.32],
    maxTipBendDeg: 90, nearGain: 0.8, offscreenGain: 1.6,
    tipLenRatio: 0.42, smoothLerp: 0.25, alignRefDeg: 20,
    latRampPow: 1.6, foldMax: 0.8,
    powerCapacityKg: { UL: 1.5, L: 2.5, ML: 4.0, M: 6.0, MH: 9.0, H: 13.0, XH: 20.0 },
    actionTipBias: { slow: 0.40, moderato: 0.50, regular: 0.60, moderatoFast: 0.70, fast: 0.80, extraFast: 0.90 },
  },
  visual: {
    bobberAlphaFactor: 1.15, shadowAlphaMin: 0.15, depthAlphaMin: 0.25,
    lineColorWarn: 0.60, lineColorCritical: 0.85,
  },
  hold: { liftM: 0.02, liftRateMps: 0.2 },
  foam: { spreadPx: 30 },
  view: { seaBands: 14, skyBands: 12 },
  castMove: {
    tinyMps: 0.15, slowMps: 0.35, normalMps: 0.6, lotsMps: 0.9, boldMps: 1.3,
    stillCur: 0.05, weakCur: 0.18, mediumCur: 0.35,
  },
  fightPull: { lateralStagePerSec: 60 },
  leader: { baseDeg: 8, holdDeg: 34, curGain: 60, maxDeg: 78, defaultLenM: 1.2 },
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
  { path: 'chum.lifetimeMs', min: 5000, max: 10000, step: 500, category: 'feel', label: '밑밥 수명(ms)' },
  { path: 'chum.currentSinkDamp', min: 0.3, max: 0.85, step: 0.05, category: 'balance', label: '조류 침강 감쇠' },
  { path: 'chum.elongK', min: 0.5, max: 3.0, step: 0.1, category: 'feel', label: '타원 신장 계수' },
  { path: 'chum.tiltMaxDeg', min: 55, max: 80, step: 1, category: 'feel', label: '틸트 최대각' },
  { path: 'chum.rMinorMaxM', min: 0.6, max: 2.0, step: 0.1, category: 'feel', label: '타원 단축 상한' },
  { path: 'chum.coatMs', min: 1000, max: 4000, step: 100, category: 'feel', label: '지형 코팅(ms)' },
  { path: 'chum.bottomSyncBonus', min: 0, max: 0.5, step: 0.02, category: 'balance', label: '바닥 동조 보너스' },
  { path: 'rod.maxBendRad', min: 0.6, max: 1.6, step: 0.05, category: 'feel', label: '로드 최대 휨' },
  { path: 'rod.maxTipBendDeg', min: 70, max: 110, step: 1, category: 'feel', label: '초릿대 상한각' },
  { path: 'rod.nearGain', min: 0, max: 2, step: 0.05, category: 'feel', label: '근접 벤딩 가산' },
  { path: 'rod.offscreenGain', min: 0, max: 3, step: 0.1, category: 'feel', label: '화면밖 벤딩 가산' },
  { path: 'rod.tipLenRatio', min: 0.3, max: 0.55, step: 0.01, category: 'feel', label: '초릿대 길이비' },
  { path: 'rod.alignRefDeg', min: 10, max: 45, step: 1, category: 'feel', label: '풀벤딩 이탈각' },
  { path: 'rod.latRampPow', min: 1.0, max: 2.5, step: 0.1, category: 'feel', label: '측면 램프 커브' },
  { path: 'rod.foldMax', min: 0.4, max: 1.0, step: 0.05, category: 'feel', label: '전방 말림 축소율' },
  { path: 'chumSync.depthSigmaM', min: 0.3, max: 2.0, step: 0.1, category: 'balance', label: '동조 수심σ(m)' },
  { path: 'chumSync.horizSigmaM', min: 0.5, max: 3.0, step: 0.1, category: 'balance', label: '동조 수평σ(m)' },
  { path: 'chumSync.currentDWeight', min: 0.0, max: 1.0, step: 0.05, category: 'balance', label: '조류 D비중' },
  { path: 'chumSync.syncToBiteMul', min: 0.5, max: 2.0, step: 0.05, category: 'balance', label: '동조→입질 배율' },
  { path: 'chumTypes.powder.sinkRate', min: 0.2, max: 1.2, step: 0.05, category: 'balance', label: '파우더 침강' },
  { path: 'chumTypes.grain.sinkRate', min: 0.4, max: 1.6, step: 0.05, category: 'balance', label: '압맥 침강' },
  { path: 'chumTypes.ball.sinkRate', min: 0.8, max: 2.4, step: 0.05, category: 'balance', label: '경단 침강' },
  { path: 'fight.sideLoadCoef', min: 0.3, max: 1.5, step: 0.05, category: 'balance', label: '측면하중 계수' },
  { path: 'fight.recoverRatePerSec', min: 0.0, max: 0.06, step: 0.005, category: 'balance', label: '스태미나 회복' },
  { path: 'hold.liftM', min: 0, max: 0.3, step: 0.01, category: 'feel', label: '뒷줄견제 리프트(m)' },
  { path: 'foam.spreadPx', min: 10, max: 120, step: 2, category: 'feel', label: '포말 분산(px)' },
  { path: 'view.seaBands', min: 6, max: 20, step: 1, category: 'feel', label: '바다 밴드 수' },
  { path: 'view.skyBands', min: 4, max: 20, step: 1, category: 'feel', label: '하늘 밴드 수' },
  { path: 'castMove.slowMps', min: 0.15, max: 0.6, step: 0.05, category: 'feel', label: '횡이동 서서히(m/s)' },
  { path: 'castMove.normalMps', min: 0.3, max: 1.0, step: 0.05, category: 'feel', label: '횡이동 보통(m/s)' },
  { path: 'castMove.lotsMps', min: 0.6, max: 1.4, step: 0.05, category: 'feel', label: '횡이동 많이(m/s)' },
  { path: 'castMove.boldMps', min: 0.8, max: 2.0, step: 0.05, category: 'feel', label: '횡이동 과감(m/s)' },
  { path: 'fightPull.lateralStagePerSec', min: 20, max: 140, step: 5, category: 'feel', label: '파이트 견인(px/s)' },
  { path: 'leader.holdDeg', min: 10, max: 50, step: 1, category: 'balance', label: '목줄 홀드각' },
  { path: 'leader.curGain', min: 20, max: 90, step: 1, category: 'balance', label: '목줄 조류각 게인' },
  { path: 'leader.maxDeg', min: 55, max: 85, step: 1, category: 'balance', label: '목줄 스트리밍 상한' },
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
