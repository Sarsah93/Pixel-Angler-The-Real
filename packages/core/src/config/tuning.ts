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

/**
 * 어종 체형 키 — 도메인 설명은 `FishSpawningOracle.FishBodyForm`(같은 유니온을 alias).
 * 여기(leaf 모듈)에 두는 이유: 오라클이 TUNING을 소비하므로 반대 방향 import는 순환이 된다.
 */
export type BodyFormKey =
  | 'deepBody' | 'fusiform' | 'elongated' | 'flat' | 'globular' | 'cephalopod' | 'roundish';

/** 체형별 파이트 물리 배수 (133차) — 같은 체중이라도 힘·압력이 다르다 */
export interface BodyFormFight {
  /** 순간 가속(burst) 배수 — 직선 추력. 장어·리본형은 단면이 작아 낮다 */
  burst: number;
  /** 정적 하중 배수 — 물살을 받는 면적. 납작한 광어가 옆으로 누우면 판자처럼 버틴다 */
  staticMult: number;
  /** 거리 저항 배수 — 줄을 끌고 나가는 힘(파이트 거리 물리) */
  resist: number;
  /** 요동(thrash) 주파수 Hz — 몸을 비트는 어종은 텐션이 주기적으로 출렁인다 */
  thrashHz: number;
  /** 요동 진폭 (요구 장력 대비 비율) */
  thrashAmp: number;
  /** 입 연약도 배수 — 몸을 비틀면 바늘구멍이 넓어진다 */
  hookOff: number;
}

/** 침강 형상 바디 타입 — 드래그/종단속도 프로파일 (루어 kind·봉돌에서 매핑) */
export type SinkBodyType = 'metalJig' | 'minnow' | 'egi' | 'softPlastic' | 'sinker';

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
  // ── 파이팅 텐션 물리 (116차 — 요구 장력 kgf ÷ 라인 인장강도 = 게이지 %) (balance) ──
  /**
   * 133차 — **체장-체중 관계(LWR) 비만도**. 표준 무게 W = a·L^b에 곱해지는 계수로,
   * "같은 길이라도 계절·산란 상태·개체에 따라 무게가 다르다"(사용자 지적)를 담당한다.
   */
  lwr: {
    /** 저수온기(비만도 최고) 월 */
    winterMonths: number[];
    /** 저수온기 가산 (영양 상태) */
    winterGain: number;
    /** 산란기(금어기 = 산란 보호기로 간주) 가산 — 알·정소 */
    roeGain: number;
    /** 산란 직후 한 달 감산 — 홀쭉해진다 */
    postSpawnLoss: number;
    /** 개체 편차 표준편차 (정규분포) */
    varianceSd: number;
    /** 비만도 하한·상한 */
    minFactor: number; maxFactor: number;
  };
  fightPhys: {
    /** 물속 정적 하중 = 체중 × 이 값 (부력 차감 — 25cm 감성돔 300g → ≈100g) */
    staticFrac: number;
    /** 어종군별 순간 가속 배수 (체중 대비 — 돔류 여 박기 3~5배 실측 문헌) */
    burst: Record<'seabream' | 'amberjack' | 'mackerel' | 'rockfish' | 'flatfish' | 'seabass' | 'cephalopod' | 'other', number>;
    /** 패턴별 힘 배수 — none(유영) / dive / lateral / jump(줄이 느슨) */
    pullIdle: number; pullDive: number; pullLateral: number; pullJump: number;
    /** 패턴에 **맞게 대응**하면 요구 장력 감쇠 (로드·드랙이 흡수) / 틀리면 증폭 */
    goodResponseMult: number; badResponseMult: number;
    /** 릴링 부하 (배수 + 상수 kg) · 버티기(↑) 강성 배수 · 슬랙(무입력) 배수 */
    reelLoadMult: number; reelLoadKg: number; holdStiffMult: number; slackMult: number;
    /** 무입력(버티기) 시 드랙이 미끄러지는 상한 (라인 강도 대비 비율) */
    dragCapFrac: number;
    /**
     * 133차 — **릴링 중 드랙 상한**. 구 모델은 릴을 감는 동안 상한이 아예 없어,
     * 스풀이 역회전하며 미끄러지는 실제 드랙과 달랐다(= 표준 채비 + 표준 어종이 전멸).
     * 100%를 살짝 밑도는 값 — 감는 것만으로는 안 터지고, 한계 텐션에서 **강행**해야 터진다.
     */
    reelDragCapFrac: number;
    /**
     * 133차 — **충격 하중 파단 임계**(라인 강도 대비 배수). 요구 장력이 이 배수를 넘으면
     * 드랙이 풀리는 속도로도 못 따라가 그대로 터진다 — "라이트 채비로 대물"(116차 4.1)과
     * "패턴 오대응 = 파단"이 여기서 성립한다.
     */
    shockBreakFrac: number;
    /**
     * 133차 — **체급 보정 안전대 하한**. 안전대(30~80)는 절대값이라, 3kg 원줄에 최대 2%를
     * 거는 24g 복섬은 영영 "느슨함"으로 판정돼 탈출 배수가 2배였다. 그 체급이 걸 수 있는
     * 최대 장력의 이 비율을 하한으로 삼아, **못 거는 장력을 못 걸었다고 벌하지 않는다.**
     */
    safeFloorFrac: number;
    /** 게이지 추종 속도 (1/s — 상승/하강) */
    tensionRiseRate: number; tensionFallRate: number;
    /** 이 게이지 아래가 이 시간(초) 이상 지속되면 바늘 빠짐 */
    slackHookOffBelow: number; slackHookOffSec: number;
    /** 랜딩 후 끌어오기(dragIn) 시간 배율 — 연출을 따라올 수 있게 느리게 (피드백 1) */
    dragInTimeScale: number;
    // ── 132차 제압도(subdue) — 랜딩(거리)과 분리된 "굴복" 축 ──
    /** 안전대 릴링 시 제압도 상승 (초당) */
    subdueReelRate: number;
    /** 패턴 정대응 / 오대응 초당 가감 */
    subdueGoodRate: number; subdueBadRate: number;
    /** 무입력(슬랙) 시 초당 감소 — 쉬게 두면 고기가 되살아난다 */
    subdueDecay: number;
    /** 여 박기 중 버티지 않으면 초당 급락 */
    subdueDiveLoss: number;
    /** 피로 잔여 → 제압도 기저 가중 (1이면 지침만으로 100) */
    subdueFatigueWeight: number;
    /** 챔질 직후 첫 패턴까지 (초, ×0.6~1.4 난수) — 훅셋 버스트 */
    firstPatternSec: number;
    /** 탈출 확률의 피로 하한 배수 — 지친 고기(잔여 0)는 이 배수까지만 바늘을 턴다 */
    escapeFatigueFloor: number;
    /** 133차 — 체형별 배수 (어종군 burst와 **직교**: 군 = 힘의 크기 / 체형 = 힘의 성질) */
    form: Record<BodyFormKey, BodyFormFight>;
  };
  /**
   * 132차 — **파이트 거리 물리** (사용자 리포트: "발앞인데 진행도가 뒤쳐진다").
   * 랜딩 진행도 = 거리 진행도이므로, 이 값들이 곧 **파이트 소요 시간**을 결정한다.
   * 설계 목표: 소형어 기준 `총시간 ≈ 패턴 대응(2~5초) + 착수거리 ÷ 실효 회수속도(≈2.0m/s)`
   * → 10m ≈ 10초 / 20m ≈ 15초 (사용자 시나리오).
   */
  fightDist: {
    /** 랜딩 판정 거리 (m) — 이 안으로 들어오면 낚아올린다 */
    landRangeM: number;
    /** 무게 0 기준 릴링 회수 속도 (m/s) */
    reelBaseMps: number;
    /** 무게(kg)당 회수 감쇠 — reel = base / (1 + kg × k) */
    reelWeightK: number;
    /** 회수 속도 하한 (m/s) — 대물이라도 아주 조금씩은 감긴다 */
    reelMinMps: number;
    /** 완전 제압(subdue 100) 시 회수 속도 배수 */
    subduedReelMult: number;
    /**
     * **저항 세기 = 회수 속도 대비 비율** (절대 m/s가 아니다).
     * 물고기의 버팀은 "내가 감을 수 있는 속도"와 겨루는 힘이므로, 기준 회수 속도
     * `reelCap`(무게 기반)에 이 비율과 체급·피로·패턴·제압도를 곱해 산출한다.
     * 1.0이면 생생한 고기가 릴링과 정확히 비긴다(= 거리 정체). 이 정규화 덕분에
     * 어떤 체급도 "영영 못 감기"거나 "저항 없이 끌려오기"가 되지 않는다.
     */
    resistFrac: number;
    /**
     * 도주 속도의 체급 스케일 — `base + power × gain`. 작은 고기도 **순간 속도는 빠르다**
     * (작은 건 지구력이지 속도가 아니다). base를 너무 낮추면 소형어가 저항 없이 끌려온다.
     */
    fleePowerBase: number; fleePowerGain: number;
    /**
     * **패턴 중 줄 붙듦** — 패턴이 진행되는 동안 물고기가 줄을 버텨 릴링이 거리를 벌지 못한다
     * (드랙이 밀린다). 회수 속도 대비 비율이며, 제압도·피로가 오르면 함께 무너진다.
     * 파이트 시간의 "상호작용 몫"을 만드는 값 — 0이면 패턴이 거리에 아무 영향이 없다.
     */
    patternHoldFrac: number;
    /**
     * **릴링 중 도주 전진 상한** (회수 속도 대비). 릴을 감는 동안에는 드랙을 잠그고 당기므로
     * 거리는 **언제나 조금씩이라도 좁혀진다**(사용자 요구: "릴링을 계속 하는 동안은 점점
     * 가까워져야 함"). 저항이 셀수록 좁혀지는 폭이 줄 뿐이고, 손을 놓으면 상한이 사라져
     * 물고기가 줄을 끌고 나간다. 1 이상이면 릴링 중에도 거리가 늘 수 있다.
     */
    reelHoldCap: number;
    /** 패턴별 저항 배수 (none = 평상 러닝. 1 초과 = 릴링을 이기고 줄이 나간다) */
    fleeIdle: number; fleeDive: number; fleeLateral: number; fleeJump: number;
    /** 제압도(0~1)가 도주 속도를 깎는 비율 (0.9 = 완전 제압 시 10%만 남음) */
    subdueFleeCut: number;
    /**
     * 수평면 도주각 (도, 0 = 플레이어 반대쪽 정면). 러닝은 이 범위 안에서 추첨되고,
     * 횡이동 패턴은 `lateralAngDeg`로 거의 옆으로 쏜다. **음수 전진(플레이어 쪽)은 없다** —
     * 저항은 언제나 유저 반대쪽(사용자 요구 2).
     */
    runSpreadDeg: number;
    lateralAngDeg: number;
    /** 러닝 방향 재추첨 주기 (초) */
    runRepickSec: number;
    /** 횡 오프셋 상한 (m) — 수평뷰 좌우 이탈 한계 */
    latMaxM: number;
    /** 횡 오프셋 복귀 속도 (1/s) — 제압·릴링 시 중앙으로 수렴 */
    latRecenterRate: number;
    /** 수심 추종 속도 (1/s) */
    depthRate: number;
    /** 패턴별 목표 수심 정규화 (0 = 수면 / 1 = 바닥) */
    depthDive: number; depthJump: number; depthCruise: number; depthSubdued: number;
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
  // ── 루어/봉돌 침강 물리 (balance — LURE_SINK_PHYSICS) ──
  // 무게가 조류 임계(Wthr)를 뚫어야 가라앉고, 못 뚫으면 표층에서 조류로 쓸린다.
  sink: {
    /** 라인각 계수 — tanθ = angleK·curMps / Weff^weightExp (경량·강조류일수록 θ↑) */
    angleK: number;
    weightExp: number;
    /** 스윕각 (도, 수직 기준) — θ가 이보다 크면 못 가라앉고 표층 흐름 */
    sweptAngleDeg: number;
    /** 조류 세기 정규화 기준 (m/s) — 다른 소비자용 (침강은 raw m/s 사용) */
    currentRefMps: number;
    /** 형상 드래그 계수 — 유효무게 Weff = Wg / dragC (유선형일수록 작음 → Weff 큼) */
    dragC: Record<SinkBodyType, number>;
    /** 종단 침강 속도 기준 (m/s, vTermRefG 무게 기준) — 형상별 */
    vTermRefMps: Record<SinkBodyType, number>;
    /** 종단속도 무게 참조 (g) + 무게 지수 (v ∝ Weff^exp) + 상하한 */
    vTermRefG: number;
    vTermWeightExp: number;
    vTermMin: number;
    vTermMax: number;
    /** swept(못 뚫음) 시 미세 잔류 침강 (m/s) — 완전 0 아님 */
    residualSweptMps: number;
    /** 릴링 시 채비 상승 각 (도) */
    reelAngleDeg: number;
    /** 못 뚫을 때(swept) 표층 횡류 배율 */
    sweptDriftK: number;
  };
  // ── 홈타운(집) · 출조 요금 · 저장 정책 (HOMETOWN_HOME_SPEC 2026-07-28) ──
  travel: {
    /** 출조 일괄 교통비 (₩) */
    baseFareKrw: number;
    /** 귀가(지역→홈타운) 요금 — 우선 무료(하루 왕복권 개념) */
    returnFareKrw: number;
  };
  save: {
    /** 저장 허용 위치 태그 (침대 상호작용 지점 — 민박 등 확장 시 태그 추가) */
    allowedTags: string[];
  };
  hometown: {
    mapW: number;
    mapH: number;
    /** 바다 비율 (지도 생성 기준값 — 정보성) */
    seaRatio: number;
  };
  // ── 회뜨기 미니게임 흐름 (SASHIMI_STAGE_FLOW_FIX 2026-07-28) ──
  butchery: {
    /**
     * 단계 전환 시 요구 방향으로 자동 스냅 — 수동 방향 전환 누락으로
     * "가이드도 없고 클릭도 안 먹는" 먹통 방지. false면 구 방식(수동 버튼 전환).
     */
    autoOrient: boolean;
    /** 뒤집기 연출 시간 (ms) */
    flipAnimMs: number;
    /**
     * true = 회칼 미보유 시 장뜨기/박피 입력 하드 차단(구 방식 — 통마리 강제).
     * false(기본) = 막칼 폴백으로 진행 허용 (수율 0.85 + 등급 '상' 캡 페널티).
     */
    knifeHardLock: boolean;
    /** 가이드 경로 루프 연출 시간 (ms) — 칼이 지나갈 길을 미리 보여주는 애니메이션 1회 주기 */
    guideAnimMs: number;
    /** 조작 성공 액션 연출 시간 (ms) — 칼질/탭/문지르기/박피 성공 애니메이션 (입력 차단) */
    actionAnimMs: number;
    /**
     * 넙치류 포 뜨기 칼 팔로우 연출 (2026-08-06 사용자 공정 재정의):
     *  유저 드래그 자리를 **딜레이 후 실사 칼 스프라이트가 천천히 따라오고**,
     *  칼이 지나간 구간부터 살이 두더지처럼 들린다 (구 후연출 flatOpenMs 폐지).
     */
    knifeFollowDelayMs: number;
    /** 칼 팔로우 이동 속도 (px/s) — 낮을수록 천천히 따라온다 */
    knifeFollowSpeedPx: number;
    /** 칼 스프라이트 표시 길이 (px) — 화면상 약 2cm 권장 */
    knifeLenPx: number;
    /** 칼 진행각 대비 바깥쪽 기울기 (deg) — 손잡이가 생선 바깥으로 눕는 각 */
    knifeTiltDeg: number;
    /**
     * 칼끝이 살에 파묻히는 비율 (텍스처 오른쪽 끝부터 0~1) — 그 경계가 드래그 접점이 된다.
     * 크게 잡을수록 칼이 더 깊이 박힌 것처럼 보이고, 보이는 날 길이는 짧아진다.
     * ⚠ 크롭·원점은 칼 세션 시작(`startKnifeFollow`) 시 재계산 — 슬라이더 변경은 다음 드래그부터 반영.
     */
    knifeBuryFrac: number;
  };
  /**
   * 두족류 손질 (CEPHALOPOD_BUTCHERY_SPEC §10) — 오징어류 3종 + 문어.
   * ⚠ 전부 mockup 초기값 — 실플레이 조율 후 스냅샷으로 확정한다.
   */
  ceph: {
    // ── 시메·개복·먹물 ──
    /** 신경 차단 허용 반경 (정규화) */
    nerveTolerance: number;
    /** 가위 소지 시 허용 반경 배율 (시메는 가위로도 가능) */
    nerveScissorsBonus: number;
    /** 2차 시메(다리쪽) 성공 시 먹물 분출 위험 감소율 */
    shimeInkRiskCut: number;
    /** 개복 절개 허용 깊이 편차 */
    slitDepthBand: number;
    /** 깊이 위반 누적 이 횟수 초과 시 먹물 터짐 */
    slitDepthFailCount: number;
    /** 시메 없이 개복 시 깊이 밴드 배율 (몸이 굳지 않아 더 어렵다) */
    slitBandNoShime: number;
    /** 내장 당김 속도 임계 (초과 시 먹물 터짐) */
    inkBurstSpeed: number;
    /** 먹물 터짐 시 등급 배율 하한 (종별 inkAmount로 보간) */
    inkPenaltyMult: number;
    /** 먹물 얼룩으로 늘어나는 세척 커버리지 */
    inkStainScrubAdd: number;
    // ── 껍질·뼈 ──
    /** 껍질 당김 중단 1회당 몸통 수율 감소 */
    peelBreakPenalty: number;
    /** 껍질 완주 요구 진행률 */
    peelTargetCoverage: number;
    /** 연골(펜) 뽑기 허용 이탈 */
    penPullTolerance: number;
    /** 한치 껍질 — **완주가 아니라 정지**가 성공 조건인 진행률 밴드 */
    peelStopBand: [number, number];
    /** 키친타월 없이 속껍질 시도 시 중단 페널티 배율 */
    peelTowelMissMult: number;
    /** 갑 들어내기 허용 각도(도) — 초과 시 파편 */
    boneLiftAngleMax: number;
    /** 막을 안 젖히고 갑을 들 때 허용 각도 배율 */
    boneLiftNoMembrane: number;
    /** 갑 파편 1개당 몸통 수율 감소 */
    boneBreakPenalty: number;
    /** 파편 발생 시 정리 커버리지 가산 */
    boneFragScrubAdd: number;
    // ── 문어 ──
    /** 외번 완료 판정 진행률 */
    invertProgressTarget: number;
    /** 외번 속도 상한 — 초과 시 목 살 찢김 */
    invertSpeedMax: number;
    /** 찢김 1회당 등급 하락 단계 */
    invertTearGradeDrop: number;
    /** 악판 뽑기 허용 이탈 */
    beakPullTolerance: number;
    /** 소금 양 밴드 (부족하면 점액이 안 지고, 과하면 조직이 조여 등급 하락) */
    saltAmountBand: [number, number];
    /** 소금 부족 시 문지르기 목표 가산 */
    saltMissScrubAdd: number;
    /** 소금 과다 시 등급 배율 */
    saltOverGradeMult: number;
    /** 점액 제거 목표 커버리지 */
    slimeScrubTarget: number;
    /** 점액 문지르기 왕복 횟수 */
    slimeScrubCycles: number;
    /** 점액 잔존 시 등급 하락 단계 */
    slimeLeftGradeDrop: number;
    /** 두족류 손질 해금 스킬 레벨 (0 = 제한 없음) */
    unlockSkillLv: number;
  };
  // ── 인-맵 채집(해루질) · 통발 (121차 — 강원 조례 재현. 초기값은 mockup, F8 조율 대기) ──
  forage: {
    /** 후보 100타일당 스팟 수 (밀도) */
    spotsPerHundred: number;
    /** 간조(조위 0)일 때 밀도 배율 (조위 1 = 1.0) */
    lowTideBonus: number;
    /** 스팟 재롤링 주기(분) — 시간 시드 슬롯 */
    respawnMinutes: number;
    /** 한 번에 존재하는 스팟 상한 */
    maxSpots: number;
    /** 기본 채집 성공 확률 */
    baseSuccess: number;
    /** 1순위 도구 사용 시 가산 */
    toolMatchBonus: number;
    /** 문어류 도주 확률 (뜰채 기준 — 갈고리는 절반) */
    octopusEscape: number;
    /** 맨손 부상(성게·굴) 스태미나 손실 */
    handInjuryStamina: number;
    /** [E] 홀드 기본 시간(ms) */
    holdMsBase: number;
    /** 랜턴 100루멘당 야간 발견 반경(타일) */
    lampRadiusPer100lm: number;
    /** 낮 발견 반경(타일) — 고착 생물만 */
    dayRadiusTiles: number;
    /** 진입 불가 풍속(m/s) · 파고(m) */
    maxWindMps: number;
    maxWaveM: number;
    /** 너울 경고 파고(m) — 이 이상이면 미끄러짐 확률 상승 */
    slipWaveM: number;
    slipChanceBase: number;
    slipChanceSwell: number;
    /** 조례 위반 채집 회차당 적발 확률 */
    enforcementChance: number;
    /** 적발 벌금 = 보유 재화 × 비율 (상한 fineCapWon) */
    fineRatio: number;
    fineCapWon: number;
  };
  trap: {
    /** 분실 위험 배율 (calculateTrapLossRisk 결과에 곱) */
    lossRiskMult: number;
    /** 수거 가능 최소 침지 시간(시간) */
    minSoakHours: number;
    /** 설치 가능 거리 — 플레이어로부터 타일 */
    maxRangeTiles: number;
    /** 설치 가능 물 타일의 최대 육지 거리(타일) — 던져 넣는 범위 */
    maxWaterDistTiles: number;
  };
  /** 플레이어 레벨 경험치 소스 (124차 — PROGRESSION_SURVIVAL_SPEC §1-3. 손질 숙련 XP와 별개) */
  xp: {
    /** 어획 기본 XP — 어종 희귀도(FishRarity)별 */
    rarityCommon: number;
    rarityUncommon: number;
    rarityRare: number;
    rarityEpic: number;
    rarityLegendary: number;
    /** 체장계수 하한/상한 (개체 길이 ÷ 어종 평균 길이 클램프) */
    sizeFactorMin: number;
    sizeFactorMax: number;
    /** 첫 포획(도감 신규) 배율 */
    firstDiscoveryMult: number;
    /** 활동 기본 XP — 등급/품질 계수는 호출부 mult로 곱 */
    butcherBase: number;
    sashimiBase: number;
    forageBase: number;
    craftBase: number;
    cookBase: number;
    /** 준법 방생(금지체장·금어기 자동 방생) = 어획 XP × 이 배율 */
    lawfulReleaseMult: number;
  };
  /** 생존 지표 — 허기·수분·피로 (125차 — SPEC §4. 드레인은 **활동 시간** 기준, 오프라인 정지) */
  vitals: {
    /** 활동별 시간 드레인 (활동 1시간당 %) — [허기, 수분, 피로] */
    drainIdle: [number, number, number];
    drainSit: [number, number, number];
    drainWalk: [number, number, number];
    drainRun: [number, number, number];
    drainBike: [number, number, number];
    drainForage: [number, number, number];
    /** 행동 1회 비용 — [허기, 수분, 피로] */
    costCast: [number, number, number];
    costFightWin: [number, number, number];
    costFightLose: [number, number, number];
    costButcher: [number, number, number];
    costSashimi: [number, number, number];
    costTravel: [number, number, number];
    costCraft: [number, number, number];
    costCook: [number, number, number];
    /** 임계 — 허기·수분이 이 % 미만이면 이동 감속·피로 가중 */
    lowPct: number;
    lowMovePenalty: number;
    lowFatigueMult: number;
    /** 허기 또는 수분 0% 시 HP 감소(분당) */
    zeroHpPerMin: number;
    /** 온도 계수 — 체감 이 온도 이상이면 수분 드레인 ×hot / 이하면 허기 ×cold */
    hotC: number;
    hotHydrationMult: number;
    coldC: number;
    coldHungerMult: number;
    /** 추위 내성(life_cold) 랭크당 저온 경계 완충(℃) */
    coldResistBufferC: number;
    /** 수면(침대) 회복 — 피로 목표치·HP 회복 비율·허기/수분 소모 */
    sleepFatigueTo: number;
    sleepHpPct: number;
    sleepHungerCost: number;
    sleepHydrationCost: number;
  };
  /** 상태이상 (125차 — SPEC §5. 시간은 활동 시간 기준 분) */
  /** 제작·구급품 (129차 P7) */
  craft: {
    /** 제작 실패 시 소모되는 재료 비율 (0.5 = 절반만 날린다) */
    failMaterialPct: number;
    /** 상비약 1개가 앞당기는 자연치유 시간(활동 분) */
    medicineShortenMin: number;
    /** 붕대·부목 기본 재발 억제 — `life_firstaid`와 곱해진다 */
    medicRelapseMult: number;
    /** 고급 제작대 판매가(원) */
    workbenchPrice: number;
    /** 병원 진료비(원) — 이상고열·독감·생물중독 처치 */
    hospitalFee: number;
  };
  status: {
    /** 진행 체인(오한→감기→독감 등) 판정 주기(활동 분) */
    progressRollMin: number;
    /** 주기당 진행 확률 */
    progressChance: number;
    /** 자연 치유 소요(활동 분) — 식중독 등 자연치유 대상 */
    selfHealMin: number;
    /** 치료 후 재발 확률 — 출혈 / 골절 */
    relapseBleed: number;
    relapseFracture: number;
    /** 이상고열 퇴원 후 '회복기' 지속(활동 분) */
    recoveryMin: number;
    /** 탈진 해제에 필요한 허기·수분 하한(%) */
    exhaustClearPct: number;
  };
  /**
   * 날씨 → 캐스팅·채비 (127차 — 사용자 지시 3건).
   * 바람은 `calmMs` **초과분만** 작동하고, 스킬 보정은 바람 몫에만·`windCompCap`까지만 먹는다.
   */
  castWeather: {
    /** 이 풍속(m/s) 이하는 아무 영향 없음 */
    calmMs: number;
    /** 맞바람 초과 1m/s당 비거리 감소율 */
    distPerMs: number;
    /** 뒷바람 초과 1m/s당 비거리 증가율 */
    tailGain: number;
    /** 비거리 배율 하한 */
    distMultMin: number;
    /** 초과 1m/s당 산포 반경 증가율 (옆바람일수록 큼) */
    scatterPerMs: number;
    /** 산포 배율 상한 */
    scatterMultMax: number;
    /** 초과 1m/s당 착수점 밀림 (캐스팅 거리 대비 비율) */
    driftPerMs: number;
    /** 밀림 비율 상한 */
    driftMax: number;
    /** 바람 보정 스킬(`wind_comp`) 상한 — "아주 미비한 정도" 유지 장치 */
    windCompCap: number;
    /** 기본 산포 반경 (거리 대비 비율 — 무스킬·무풍) */
    baseScatter: number;
    /** 강수 강도 1일 때 조류 세기 가산 */
    rainCurrentGain: number;
    /** 강수 강도 1일 때 밑걸림·채비 손실 가산 */
    rainSnagGain: number;
    /** 강수 강도 1일 때 산포 가산 */
    rainScatterGain: number;
  };
  /**
   * 기절·사망 (§6 — P4). 기본값은 v2 완화 프리셋.
   * **하드코어 프리셋**(원안): `deathCoinLossRate 0.8` · `deathDropInventory 1`.
   * 창고·냉장고 보관분은 어떤 프리셋에서도 안전하다.
   */
  collapse: {
    /** 비네트 암전 시간(ms) */
    dimMs: number;
    /** 쓰러진 뒤 팝업이 뜨기까지(ms) */
    popupDelayMs: number;
    /** 기상 시 피로도를 여기까지만 되돌린다(%) — 연속 기절 루프 방지 안전거리 */
    faintFatiguePct: number;
    /** 사망 시 재화 상실 비율 */
    deathCoinLossRate: number;
    /** 1이면 인벤토리 전량 상실 (하드코어) */
    deathDropInventory: number;
    /** 부활 시 HP(%) */
    deathReviveHpPct: number;
    /** 부활 시 허기·수분(%) */
    deathReviveVitalsPct: number;
  };
  // ── 134차 스토리·퀘스트 (STORY_SPEC_v3 §14-5) ──
  story: {
    /** Ch1 실습생 기한(일) — D-180 */
    ch1DeadlineDays: number;
    /** 기한 초과 시 비용(원) — 실습 재신청·숙소 임대료 */
    missCostKrw: number;
    /** 1 = 숙련자용 상세 안내 생략 */
    skipVerbose: number;
  };
  rep: {
    harborMax: number;
    seaMin: number;
    seaMax: number;
    /** 바다 평판 변동 */
    seaReleaseUndersize: number;
    seaRescue: number;
    seaIllegalKeep: number;
    seaRestrictedEntry: number;
    seaVillageFisheryViolation: number;
    /** 항구 신뢰 변동 */
    harborCommunityWork: number;
    harborFreeDelivery: number;
    harborAbandonedRequest: number;
  };
  law: {
    /**
     * 낚싯대 어획물 판매 금지(§3-1 LAW_SELL_ROD) 강제 단계 — 135차에 3단계로 재정의.
     *  - `0` 끔: 판정은 툴팁으로만, 판매는 허용(구 현행).
     *  - `1` 항상: 게임 시작부터 차단.
     *  - `2` **법을 배운 뒤부터**(기본): Ch1 M1-06 「팔 수 없는 물고기」를 끝낸 세이브에만 적용한다.
     *
     * ⚖ 왜 2가 기본인가 — ① 규칙을 **가르치기 전에 벌하지 않는다**(M1-06이 바로 그 교육 퀘스트)
     *   ② 스토리를 진행하지 않은 구세이브·테스터 빌드는 현행 그대로라 회귀가 0이다
     *   ③ M1-02에서 이미 품삯(DAY_JOBS)이 열려 있어 그 시점엔 대체 수입원이 존재한다.
     */
    enforceRodSell: number;
  };
  /** 일용직(품삯) — 135차 */
  job: {
    /** 품삯 배율 (경제 밸런스 조절용) */
    wageMult: number;
    /** 피로·허기·수분 소모 배율 */
    costMult: number;
    /** 일하기 최소 여력 — 피로가 이 값 이상이면 거절(탈진 방지) */
    fatigueLimit: number;
  };
  inventory: {
    /** dev 모드 탭당 슬롯 수 (= 현행 5×5) */
    devSlotsPerTab: number;
    /** 가방 미착용 주머니 */
    baseCols: number;
    baseRows: number;
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
  // ⚠ mockup 초기값 (116차) — 실플레이 조율 후 F8 스냅샷으로 확정. 근거: 25cm 감성돔(0.3kg)
  //   여 박기 순간 인장 0.8~1.5kg(체중 3~5배) · 1.2~1.5호 목줄(2.5~3kg)이면 여유 — 사용자 제공 문헌.
  // 133차 — 비만도. 감성돔 40cm 표준 953g 기준: 한겨울 알 밴 개체 ≈ 1.10배(1.05kg)
  lwr: {
    winterMonths: [11, 12, 1, 2],
    winterGain: 0.07, roeGain: 0.09, postSpawnLoss: 0.08,
    varianceSd: 0.05, minFactor: 0.82, maxFactor: 1.22,
  },
  fightPhys: {
    staticFrac: 0.35,
    burst: { seabream: 4.0, amberjack: 5.5, mackerel: 3.0, rockfish: 2.5, flatfish: 2.0, seabass: 3.5, cephalopod: 1.5, other: 2.2 },
    // 133차 — idle(유영) 부하 0.22 → 0.10. 구 값은 **감고만 있어도** 체중의 0.9배가 걸려
    //   1.8kg 감성돔이 1.5호 목줄(2.7kg)에 124%를 띄웠다(시뮬 랜딩 0/300).
    pullIdle: 0.10, pullDive: 1.0, pullLateral: 0.8, pullJump: 0.35,
    goodResponseMult: 0.6, badResponseMult: 1.35,
    // reelLoadKg = 낚시인 자체 당김. 구 0.6은 1.5호 목줄의 22%를 상수로 먹었다 —
    //   소형어 슬랙 이탈은 132차 체급 게이트가 이미 막으므로 0.25로 낮춘다(133차).
    reelLoadMult: 1.10, reelLoadKg: 0.25, holdStiffMult: 1.1, slackMult: 0.7,
    dragCapFrac: 0.85, reelDragCapFrac: 0.97, shockBreakFrac: 2.8, safeFloorFrac: 0.45,
    tensionRiseRate: 3.2, tensionFallRate: 2.6,
    slackHookOffBelow: 6, slackHookOffSec: 1.5,
    dragInTimeScale: 0.70,
    subdueReelRate: 5, subdueGoodRate: 13, subdueBadRate: 9,
    subdueDecay: 3, subdueDiveLoss: 10, subdueFatigueWeight: 0.7,
    firstPatternSec: 1.4, escapeFatigueFloor: 0.35,
    // 133차 — 체형 배수. burst는 어종군이 이미 크기를 담으므로 **체형이 군의 전제와 다를 때만**
    //   1을 벗어난다(갈치·붕장어 = 'other' 2.2 × 0.62 ≈ 1.4 — 가늘어 직선으로는 못 당긴다).
    form: {
      deepBody:   { burst: 1.0,  staticMult: 1.20, resist: 1.05, thrashHz: 0,   thrashAmp: 0,    hookOff: 1.0 },
      fusiform:   { burst: 1.0,  staticMult: 0.90, resist: 1.15, thrashHz: 0,   thrashAmp: 0,    hookOff: 1.0 },
      elongated:  { burst: 0.62, staticMult: 0.55, resist: 0.85, thrashHz: 1.2, thrashAmp: 0.45, hookOff: 1.45 },
      flat:       { burst: 0.80, staticMult: 1.90, resist: 1.10, thrashHz: 0,   thrashAmp: 0,    hookOff: 0.85 },
      globular:   { burst: 0.70, staticMult: 1.30, resist: 0.80, thrashHz: 0.5, thrashAmp: 0.18, hookOff: 0.95 },
      cephalopod: { burst: 0.90, staticMult: 1.00, resist: 0.75, thrashHz: 0.8, thrashAmp: 0.25, hookOff: 1.20 },
      roundish:   { burst: 1.0,  staticMult: 1.00, resist: 1.00, thrashHz: 0,   thrashAmp: 0,    hookOff: 1.0 },
    },
  },
  // 132차 — 거리 정합. 실효 회수 속도 ≈ 1.7m/s (실렌더 복섬 10m 10.0s / 20m 15.0s — 133차 재확인)
  fightDist: {
    landRangeM: 2.5,
    // 133차 — 2.4 → 2.05. 체급 보정 안전대(safeFloorFrac)로 소형어가 늘 '안전대 릴링'이 되어
    //   제압이 빨라진 만큼 되돌린다(실렌더 복섬 10m 10.0s / 20m 15.0s = 사용자 시나리오 목표).
    reelBaseMps: 2.05, reelWeightK: 0.55, reelMinMps: 0.35, subduedReelMult: 1.35,
    resistFrac: 2.0, fleePowerBase: 0.6, fleePowerGain: 0.6,
    fleeIdle: 1.0, fleeDive: 1.25, fleeLateral: 1.3, fleeJump: 0.5,
    patternHoldFrac: 0.92, reelHoldCap: 0.92, subdueFleeCut: 0.9,
    runSpreadDeg: 50, lateralAngDeg: 78, runRepickSec: 3.2,
    latMaxM: 6, latRecenterRate: 0.9,
    depthRate: 1.1,
    depthDive: 0.92, depthJump: 0.05, depthCruise: 0.55, depthSubdued: 0.06,
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
  // 침강 rev2 — 라인각 모델 (실측: 약조류에서 10g도 바닥, 스윕 시작 10g@0.3·30g@0.6·60g@1.0 m/s).
  //   angleK 35·weightExp 0.6로 스윕 온셋 재현, 종단속도 무게 약비례(10g≈0.5·30g≈1.3·60g≈1.6).
  sink: {
    angleK: 35, weightExp: 0.6, sweptAngleDeg: 72, currentRefMps: 0.45,
    dragC: { metalJig: 1.0, minnow: 1.2, egi: 1.5, softPlastic: 1.3, sinker: 0.75 },
    vTermRefMps: { metalJig: 1.3, minnow: 0.85, egi: 0.5, softPlastic: 0.9, sinker: 1.5 },
    vTermRefG: 30, vTermWeightExp: 0.4, vTermMin: 0.12, vTermMax: 2.6,
    residualSweptMps: 0.03, reelAngleDeg: 45, sweptDriftK: 1.0,
  },
  // 홈타운·출조 — 일괄 ₩10,000 출발 1회 + 귀가 무료 · 저장 = 집 침대에서만
  travel: { baseFareKrw: 10000, returnFareKrw: 0 },
  save: { allowedTags: ['hometown_interior'] },
  hometown: { mapW: 48, mapH: 32, seaRatio: 0.30 },
  // 회뜨기 흐름 — 자동 방향 스냅 on(먹통 방지) · 회칼 하드락 off(막칼 폴백)
  // autoOrient=false (2026-07-30 자유 손질 개편) — 자동 뒤집기 폐지, 수동 상하/좌우 뒤집기 버튼
  butchery: {
    autoOrient: false, flipAnimMs: 220, knifeHardLock: false, guideAnimMs: 2000, actionAnimMs: 2000,
    knifeFollowDelayMs: 100, knifeFollowSpeedPx: 240, knifeLenPx: 74, knifeTiltDeg: 34,
    knifeBuryFrac: 0.30,
  },
  ceph: {
    nerveTolerance: 0.045, nerveScissorsBonus: 1.4, shimeInkRiskCut: 0.6,
    slitDepthBand: 0.035, slitDepthFailCount: 3, slitBandNoShime: 0.5,
    inkBurstSpeed: 0.6, inkPenaltyMult: 0.85, inkStainScrubAdd: 0.25,
    peelBreakPenalty: 0.06, peelTargetCoverage: 0.92, penPullTolerance: 0.05,
    peelStopBand: [0.82, 0.94], peelTowelMissMult: 3.0,
    boneLiftAngleMax: 22, boneLiftNoMembrane: 0.5, boneBreakPenalty: 0.10, boneFragScrubAdd: 0.15,
    invertProgressTarget: 0.90, invertSpeedMax: 0.55, invertTearGradeDrop: 1,
    beakPullTolerance: 0.05, saltAmountBand: [0.60, 1.00], saltMissScrubAdd: 0.20,
    saltOverGradeMult: 0.94, slimeScrubTarget: 0.85, slimeScrubCycles: 6, slimeLeftGradeDrop: 1,
    unlockSkillLv: 0,
  },
  // 데이터 테이블 (대표값 — 나머지 어종 동일 형식으로 채움)
  forage: {
    spotsPerHundred: 5, lowTideBonus: 1.6, respawnMinutes: 60, maxSpots: 220,
    baseSuccess: 0.72, toolMatchBonus: 0.18, octopusEscape: 0.35, handInjuryStamina: 15,
    holdMsBase: 900, lampRadiusPer100lm: 0.55, dayRadiusTiles: 3,
    maxWindMps: 12, maxWaveM: 1.5, slipWaveM: 1.0, slipChanceBase: 0.04, slipChanceSwell: 0.22,
    enforcementChance: 0.25, fineRatio: 0.3, fineCapWon: 300_000,
  },
  trap: { lossRiskMult: 1.0, minSoakHours: 1, maxRangeTiles: 4, maxWaterDistTiles: 3 },
  xp: {
    rarityCommon: 10, rarityUncommon: 25, rarityRare: 60, rarityEpic: 150, rarityLegendary: 400,
    sizeFactorMin: 0.5, sizeFactorMax: 3.0, firstDiscoveryMult: 5,
    butcherBase: 30, sashimiBase: 50, forageBase: 12, craftBase: 15, cookBase: 12,
    lawfulReleaseMult: 0.5,
  },
  vitals: {
    drainIdle: [4.8, 6.0, 0], drainSit: [4.8, 6.0, -16], drainWalk: [10, 14, 12],
    drainRun: [16, 26, 32], drainBike: [14, 24, 20], drainForage: [14, 22, 32],
    costCast: [0.2, 0.3, 0.4], costFightWin: [1.2, 1.8, 3.0], costFightLose: [0.7, 1.0, 2.0],
    costButcher: [0.8, 0.6, 2.0], costSashimi: [1.2, 0.8, 3.0], costTravel: [5.0, 6.0, 10],
    costCraft: [0.4, 0.3, 0.8], costCook: [0.3, 0.4, 0.6],
    lowPct: 20, lowMovePenalty: 0.2, lowFatigueMult: 1.3, zeroHpPerMin: 2,
    hotC: 28, hotHydrationMult: 1.5, coldC: 5, coldHungerMult: 1.3, coldResistBufferC: 2,
    sleepFatigueTo: 0, sleepHpPct: 0.5, sleepHungerCost: 10, sleepHydrationCost: 10,
  },
  craft: {
    failMaterialPct: 0.5, medicineShortenMin: 60, medicRelapseMult: 1,
    workbenchPrice: 180_000, hospitalFee: 45_000,
  },
  status: {
    progressRollMin: 30, progressChance: 0.35, selfHealMin: 90,
    relapseBleed: 0.3, relapseFracture: 0.25, recoveryMin: 30, exhaustClearPct: 50,
  },
  castWeather: {
    calmMs: 3,
    distPerMs: 0.045, tailGain: 0.020, distMultMin: 0.55,
    scatterPerMs: 0.10, scatterMultMax: 2.5,
    driftPerMs: 0.035, driftMax: 0.35,
    windCompCap: 0.30,
    baseScatter: 0.10,
    rainCurrentGain: 0.45, rainSnagGain: 0.55, rainScatterGain: 0.15,
  },
  collapse: {
    dimMs: 500, popupDelayMs: 2000, faintFatiguePct: 80,
    deathCoinLossRate: 0.15, deathDropInventory: 0,
    deathReviveHpPct: 50, deathReviveVitalsPct: 50,
  },
  story: { ch1DeadlineDays: 180, missCostKrw: 200_000, skipVerbose: 0 },
  rep: {
    harborMax: 100, seaMin: -10, seaMax: 10,
    seaReleaseUndersize: 0.5, seaRescue: 1, seaIllegalKeep: -1, seaRestrictedEntry: -0.5, seaVillageFisheryViolation: -2,
    harborCommunityWork: 3, harborFreeDelivery: 2, harborAbandonedRequest: -5,
  },
  law: { enforceRodSell: 2 },   // 2 = 법(M1-06)을 배운 뒤부터 강제 (135차 — 구세이브·테스터 회귀 0)
  job: { wageMult: 1, costMult: 1, fatigueLimit: 88 },
  inventory: { devSlotsPerTab: 25, baseCols: 2, baseRows: 5 },
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
  // ── 제작·구급품 (129차 P7) ──
  { path: 'craft.failMaterialPct', min: 0, max: 1, step: 0.05, category: 'balance', label: '제작 실패 재료 소모율' },
  { path: 'craft.medicineShortenMin', min: 0, max: 120, step: 5, category: 'balance', label: '상비약 치유 단축(분)' },
  { path: 'craft.hospitalFee', min: 0, max: 200_000, step: 5000, category: 'balance', label: '병원 진료비(원)' },
  // ── 날씨 → 캐스팅·채비 (127차) ──
  { path: 'castWeather.calmMs', min: 0, max: 8, step: 0.5, category: 'balance', label: '바람 무시 임계(m/s)' },
  { path: 'castWeather.distPerMs', min: 0, max: 0.12, step: 0.005, category: 'balance', label: '맞바람 비거리 감소/ms' },
  { path: 'castWeather.scatterPerMs', min: 0, max: 0.3, step: 0.01, category: 'balance', label: '바람 산포 증가/ms' },
  { path: 'castWeather.driftPerMs', min: 0, max: 0.1, step: 0.005, category: 'balance', label: '바람 착수 밀림/ms' },
  { path: 'castWeather.baseScatter', min: 0, max: 0.25, step: 0.005, category: 'balance', label: '기본 산포(거리 비율)' },
  { path: 'castWeather.windCompCap', min: 0, max: 1, step: 0.05, category: 'balance', label: '바람 보정 스킬 상한' },
  { path: 'castWeather.rainCurrentGain', min: 0, max: 1.2, step: 0.05, category: 'balance', label: '강수 유속 가산' },
  { path: 'castWeather.rainSnagGain', min: 0, max: 1.5, step: 0.05, category: 'balance', label: '강수 밑걸림 가산' },
  { path: 'butchery.flipAnimMs', min: 80, max: 500, step: 20, category: 'feel', label: '손질 뒤집기 연출(ms)' },
  { path: 'butchery.guideAnimMs', min: 800, max: 4000, step: 100, category: 'feel', label: '손질 가이드 루프(ms)' },
  { path: 'butchery.actionAnimMs', min: 500, max: 4000, step: 100, category: 'feel', label: '손질 액션 연출(ms)' },
  { path: 'butchery.knifeFollowDelayMs', min: 0, max: 500, step: 20, category: 'feel', label: '포뜨기 칼 딜레이(ms)' },
  { path: 'butchery.knifeFollowSpeedPx', min: 80, max: 600, step: 20, category: 'feel', label: '포뜨기 칼 속도(px/s)' },
  { path: 'butchery.knifeLenPx', min: 40, max: 140, step: 4, category: 'feel', label: '포뜨기 칼 길이(px)' },
  { path: 'butchery.knifeTiltDeg', min: 0, max: 80, step: 2, category: 'feel', label: '포뜨기 칼 기울기(°)' },
  { path: 'butchery.knifeBuryFrac', min: 0, max: 0.6, step: 0.02, category: 'feel', label: '포뜨기 칼 파묻힘 비율' },
  // ── 두족류 손질 (CEPHALOPOD_BUTCHERY_SPEC §10 노출 목록) ──
  // saltAmountBand는 [하한, 상한] 튜플이라 인덱스 경로로 각각 노출한다(getTuning이 o[k]라 동작).
  { path: 'ceph.nerveTolerance', min: 0.02, max: 0.09, step: 0.005, category: 'feel', label: '두족류 시메 허용반경' },
  { path: 'ceph.slitDepthBand', min: 0.015, max: 0.07, step: 0.005, category: 'feel', label: '개복 깊이 밴드' },
  { path: 'ceph.inkBurstSpeed', min: 0.3, max: 1.0, step: 0.05, category: 'balance', label: '먹물 터짐 속도임계' },
  { path: 'ceph.peelBreakPenalty', min: 0.0, max: 0.15, step: 0.01, category: 'balance', label: '껍질 중단 수율감소' },
  { path: 'ceph.boneLiftAngleMax', min: 10, max: 40, step: 1, category: 'feel', label: '갑 들어내기 각도(도)' },
  { path: 'ceph.invertSpeedMax', min: 0.3, max: 1.0, step: 0.05, category: 'feel', label: '문어 외번 속도상한' },
  { path: 'ceph.saltAmountBand.0', min: 0.2, max: 0.9, step: 0.05, category: 'balance', label: '소금 양 하한' },
  { path: 'ceph.saltAmountBand.1', min: 0.7, max: 1.5, step: 0.05, category: 'balance', label: '소금 양 상한' },
  { path: 'ceph.slimeScrubTarget', min: 0.6, max: 1.0, step: 0.05, category: 'balance', label: '점액 제거 목표' },
  { path: 'ceph.unlockSkillLv', min: 0, max: 20, step: 1, category: 'balance', label: '두족류 해금 Lv' },
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
  { path: 'fightPhys.goodResponseMult', min: 0.3, max: 1.0, step: 0.05, category: 'balance', label: '패턴 정대응 감쇠' },
  { path: 'fightPhys.badResponseMult', min: 1.0, max: 2.0, step: 0.05, category: 'balance', label: '패턴 오대응 증폭' },
  { path: 'fightPhys.dragCapFrac', min: 0.6, max: 1.0, step: 0.05, category: 'balance', label: '드랙 미끄럼 상한' },
  { path: 'fightPhys.reelDragCapFrac', min: 0.7, max: 1.2, step: 0.01, category: 'balance', label: '릴링 중 드랙 상한' },
  { path: 'fightPhys.shockBreakFrac', min: 1.5, max: 5.0, step: 0.1, category: 'balance', label: '충격 파단 임계(배)' },
  { path: 'fightPhys.safeFloorFrac', min: 0, max: 1.0, step: 0.05, category: 'balance', label: '체급 안전대 하한' },
  { path: 'fightPhys.pullIdle', min: 0.05, max: 0.6, step: 0.01, category: 'balance', label: '유영 부하 배수' },
  { path: 'fightPhys.reelLoadKg', min: 0, max: 1.2, step: 0.05, category: 'balance', label: '낚시인 당김(kg)' },
  { path: 'fightPhys.tensionRiseRate', min: 1.0, max: 8.0, step: 0.2, category: 'feel', label: '텐션 상승 속도' },
  { path: 'fightPhys.dragInTimeScale', min: 0.25, max: 1.0, step: 0.05, category: 'feel', label: '끌어오기 슬로우' },
  { path: 'fightPhys.subdueReelRate', min: 3, max: 20, step: 0.5, category: 'balance', label: '제압도 릴링 상승' },
  { path: 'fightPhys.subdueGoodRate', min: 4, max: 30, step: 1, category: 'balance', label: '제압도 정대응 보상' },
  { path: 'fightPhys.subdueFatigueWeight', min: 0.3, max: 1.0, step: 0.05, category: 'balance', label: '제압도 피로 기저' },
  { path: 'fightDist.reelBaseMps', min: 0.8, max: 5.0, step: 0.1, category: 'balance', label: '릴링 회수 속도(m/s)' },
  { path: 'fightDist.reelWeightK', min: 0.1, max: 1.5, step: 0.05, category: 'balance', label: '무게 회수 감쇠' },
  { path: 'fightDist.resistFrac', min: 0.4, max: 2.5, step: 0.05, category: 'balance', label: '저항 세기(회수 대비)' },
  { path: 'fightDist.subdueFleeCut', min: 0.4, max: 1.0, step: 0.05, category: 'balance', label: '제압 도주 감쇠' },
  { path: 'fightDist.patternHoldFrac', min: 0, max: 1.4, step: 0.05, category: 'balance', label: '패턴 중 줄 붙듦' },
  { path: 'fightDist.reelHoldCap', min: 0.3, max: 1.3, step: 0.02, category: 'balance', label: '릴링 중 도주 상한' },
  { path: 'fightPhys.firstPatternSec', min: 0.4, max: 6.0, step: 0.2, category: 'feel', label: '첫 패턴까지(초)' },
  { path: 'fightPhys.escapeFatigueFloor', min: 0.1, max: 1.0, step: 0.05, category: 'balance', label: '탈출 피로 하한' },
  // 133차 — 체형 물리 / 비만도
  { path: 'fightPhys.form.elongated.staticMult', min: 0.3, max: 1.2, step: 0.05, category: 'balance', label: '장어형 정적하중' },
  { path: 'fightPhys.form.elongated.thrashAmp', min: 0, max: 0.9, step: 0.05, category: 'feel', label: '장어형 요동 진폭' },
  { path: 'fightPhys.form.elongated.thrashHz', min: 0.2, max: 3.0, step: 0.1, category: 'feel', label: '장어형 요동 Hz' },
  { path: 'fightPhys.form.elongated.hookOff', min: 1.0, max: 2.5, step: 0.05, category: 'balance', label: '장어형 바늘빠짐' },
  { path: 'fightPhys.form.flat.staticMult', min: 1.0, max: 3.0, step: 0.1, category: 'balance', label: '납작형 정적하중' },
  { path: 'fightPhys.form.deepBody.staticMult', min: 0.8, max: 2.0, step: 0.05, category: 'balance', label: '체고형 정적하중' },
  { path: 'lwr.winterGain', min: 0, max: 0.2, step: 0.01, category: 'balance', label: '겨울 비만도 가산' },
  { path: 'lwr.roeGain', min: 0, max: 0.25, step: 0.01, category: 'balance', label: '산란기 비만도 가산' },
  { path: 'lwr.varianceSd', min: 0, max: 0.12, step: 0.01, category: 'balance', label: '비만도 개체 편차' },
  { path: 'fightDist.landRangeM', min: 1.0, max: 5.0, step: 0.25, category: 'feel', label: '랜딩 판정 거리(m)' },
  { path: 'fightDist.runSpreadDeg', min: 0, max: 85, step: 5, category: 'feel', label: '도주 좌우 편향(도)' },
  { path: 'fightDist.depthRate', min: 0.3, max: 3.0, step: 0.1, category: 'feel', label: '수심 추종 속도' },
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
  { path: 'sink.angleK', min: 15, max: 60, step: 1, category: 'balance', label: '라인각 계수' },
  { path: 'sink.weightExp', min: 0.3, max: 0.9, step: 0.05, category: 'balance', label: '라인각 무게지수' },
  { path: 'sink.sweptAngleDeg', min: 60, max: 82, step: 1, category: 'balance', label: '스윕각(도)' },
  { path: 'sink.vTermRefMps.metalJig', min: 0.6, max: 2.2, step: 0.05, category: 'balance', label: '종단속도 메탈지그' },
  { path: 'sink.vTermRefMps.sinker', min: 0.8, max: 2.4, step: 0.05, category: 'balance', label: '종단속도 봉돌' },
  { path: 'sink.vTermWeightExp', min: 0.2, max: 0.7, step: 0.05, category: 'balance', label: '종단속도 무게지수' },
  { path: 'sink.reelAngleDeg', min: 30, max: 60, step: 1, category: 'feel', label: '릴링 상승각' },
  // ── 채집(해루질)·통발 (121차 mockup) ──
  { path: 'forage.spotsPerHundred', min: 1, max: 20, step: 0.5, category: 'balance', label: '채집 스팟 밀도(/100타일)' },
  { path: 'forage.lowTideBonus', min: 1, max: 3, step: 0.1, category: 'balance', label: '간조 밀도 배율' },
  { path: 'forage.baseSuccess', min: 0.3, max: 0.95, step: 0.01, category: 'balance', label: '채집 기본 성공률' },
  { path: 'forage.octopusEscape', min: 0, max: 0.8, step: 0.05, category: 'balance', label: '문어 도주 확률' },
  { path: 'forage.holdMsBase', min: 300, max: 2500, step: 50, category: 'feel', label: '채집 홀드(ms)' },
  { path: 'forage.lampRadiusPer100lm', min: 0.2, max: 1.5, step: 0.05, category: 'feel', label: '랜턴 발견 반경(타일/100lm)' },
  { path: 'forage.enforcementChance', min: 0, max: 1, step: 0.05, category: 'balance', label: '조례 위반 적발 확률' },
  { path: 'forage.fineRatio', min: 0, max: 1, step: 0.05, category: 'balance', label: '벌금 재화 비율' },
  { path: 'forage.fineCapWon', min: 0, max: 2_000_000, step: 50_000, category: 'balance', label: '벌금 상한(원)' },
  { path: 'trap.lossRiskMult', min: 0, max: 3, step: 0.1, category: 'balance', label: '통발 분실 위험 배율' },
  { path: 'trap.minSoakHours', min: 0, max: 8, step: 0.5, category: 'balance', label: '통발 최소 침지(h)' },
  // 134차 스토리
  { path: 'story.ch1DeadlineDays', min: 30, max: 365, step: 5, category: 'balance', label: 'Ch1 실습생 기한(일)' },
  { path: 'law.enforceRodSell', min: 0, max: 2, step: 1, category: 'balance', label: '낚싯대 판매 차단(0끔/1항상/2법학습후)' },
  { path: 'job.wageMult', min: 0.2, max: 3, step: 0.1, category: 'balance', label: '품삯 배율' },
  { path: 'job.costMult', min: 0.2, max: 3, step: 0.1, category: 'balance', label: '품삯 행동력 소모 배율' },
  { path: 'job.fatigueLimit', min: 50, max: 100, step: 1, category: 'balance', label: '일하기 가능 피로 상한' },
  { path: 'rep.harborCommunityWork', min: 0, max: 10, step: 0.5, category: 'balance', label: '항구 신뢰 +/공동작업' },
  { path: 'rep.seaReleaseUndersize', min: 0, max: 3, step: 0.1, category: 'balance', label: '바다 평판 +/준법 방생' },
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
