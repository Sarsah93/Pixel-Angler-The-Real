/**
 * @file Butchery.ts
 * @description 회 뜨기(활어 손질~삼면뜨기~박피) 미니게임 타입 정의
 *
 * 핵심 아키텍처 결정 (SASHIMI_BUTCHERY_SPEC 2026-07):
 *  - 자유 3D 회전 금지 → **방향 상태 머신**(정방향 5종)만 두고 2D 미러/회전으로 전환.
 *    각 손질 단계는 orientationRequired를 만족해야 칼질이 활성된다.
 *  - 어종×방향×단계 스프라이트 폭발 방지 → 파라메트릭 생선 템플릿 1종(+납작형)에
 *    ButcheryProfile(체형/비늘/항문 위치/껍질 난이도)만 주입해 변형.
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

/** 손질 정방향 상태 (자유 회전 대체) */
export type OrientationState =
  | 'BASE'       // 머리 좌·왼눈 보임, 꼬리 우
  | 'FLIP'       // 뒤집기 — 머리 우·오른눈 보임, 꼬리 좌
  | 'BELLY_UP'   // 배가 위로 (내장 제거)
  | 'BACK_DOWN'  // 등이 아래·항문이 위 (첫/둘째 장 뜨기)
  | 'FLESH_UP';  // 필렛 살이 위로 (박피)

export const ORIENTATION_LABEL: Record<OrientationState, string> = {
  BASE: '기본 (머리 왼쪽)',
  FLIP: '뒤집기 (머리 오른쪽)',
  BELLY_UP: '배 위로',
  // 장뜨기 전용 — 등을 카메라 쪽으로 눕힌 자세 (머리 오른쪽)
  BACK_DOWN: '등 위로 (머리 오른쪽)',
  FLESH_UP: '살 위로 (필렛)',
};

/** 손질 도구 */
export type ButcheryTool = 'knife' | 'hand' | 'scaler';

/** 정규화(0~1) 좌표점 — 오리엔티드 뷰(현재 방향 기준) 생선 바운딩박스 좌표계 */
export interface CutPoint { x: number; y: number; }

/** 가이드 경로를 따라 긋는 컷 1건 */
export interface CutSpec {
  id: string;
  orientationRequired: OrientationState;
  tool: ButcheryTool;
  /** 정규화(0~1) 가이드 폴리라인 (오리엔티드 뷰 기준) — 다중 유도선이면 첫 선 */
  guidePath: CutPoint[];
  /**
   * **다중 유도선** — 한 스테이지에 서로 다른 절단선이 여러 개일 때 (지느러미 = 등/뒷/가슴 3곳).
   * 각 선을 1회씩 그어야 스테이지 완료이며 **순서는 자유**(그은 획에 가장 잘 맞는 미완료 선으로 판정).
   * 없으면 guidePath 단일 선 + strokesRequired(같은 선 반복) 방식.
   */
  guidePaths?: CutPoint[][];
  /** 허용 이탈 (0~1 정규화 거리) */
  tolerance: number;
  /** 경로 커버율 임계 (0~1) — 미달 시 컷 실패(재시도) */
  minCoverage: number;
  /** 반복 컷 요구 수 (등쪽 얕은 칼집 ×3 등) */
  strokesRequired?: number;
  /** 뼈 끊기(강한 썰기) 여부 — 연출용 플래그 */
  strong?: boolean;
}

/** 필렛 형상 — 아이콘/템플릿 렌더 분기 (붉은살 로인 / 넓은 흰살 / 작은 조각) */
export type FilletShape = 'loin_thick' | 'flat_wide' | 'small';

/**
 * 손질 형태 분류 — 어종을 손질 방식별로 나눈다 (도마 투입/미니게임 게이트 기준).
 *  - finfish     : 원형/납작 지느러미어 (삼면뜨기·다섯장뜨기) — ButcheryProcess FSM 구현
 *  - cephalopod  : 두족류 (오징어·문어·갑오징어) — 눈 위 신경·먹물·다리 손질(준비중 스텁)
 *  - pufferfish  : 복어류 — 자격증·독 제거 필요 (준비중 스텁, 투입 차단)
 *  - unsupported : 손질 프로필 미정 어종
 */
export type ButcheryFamily = 'finfish' | 'cephalopod' | 'pufferfish' | 'unsupported';

/** 어종 해부/손질 파라미터 */
export interface ButcheryProfile {
  /** FISH_DATABASE / 오라클 표준 id */
  speciesId: string;
  /** round = 삼면뜨기(3장: 양살+중골) / flat = 광어 5장뜨기(4살+중골) */
  bodyShape: 'round' | 'flat';
  /** 비늘치기 필요 여부 (가죽류·두족류 false) */
  hasScales: boolean;
  /** 0~1 — 비늘치기 스트로크 요구량 */
  scaleToughness: number;
  /** 머리(0)~꼬리(1) 배쪽 항문 위치 — 개복 시작점 */
  anusRatio: number;
  /** 박피 난이도 (0~1) */
  skinToughness: number;
  /** 방혈/머리따기 연출량 (0~1) */
  bloodAmount: number;
  /** round=2, flat(광어)=4 (엔가와 포함), 대형 광어=5장뜨기(computeFilletYield에서 분기) */
  filletCount: 2 | 4 | 5;

  // ── 수율·형상 (SASHIMI_YIELD_SPEC 2026-07) ──
  /** 살수율 (가식부 비율) — 총 회 살 질량 ≈ weightGram × baseYieldRate × 도구 × 스킬 × 신선도 */
  baseYieldRate: number;
  /** 슬라이스 1점 기준 무게(g) — 흰살은 작게(얇게 많이) / 붉은살은 크게(두껍게 적게) */
  sliceGramBase: number;
  /** 회뜨기 효율 최소 체장(cm) — 미만이면 통마리/조림 유도(경고) */
  minFilletLengthCm: number;
  /** 체고/체장 비 (파라메트릭 생선 템플릿 변형) */
  bodyRatio: number;
  /** 필렛 형상 (아이콘/렌더 분기) */
  filletShape: FilletShape;
}

/** 회칼 등급 스펙 (인벤토리 '기타' 아이템 — id는 인벤토리 아이템 id와 동일) */
export interface KnifeSpec {
  id: string;
  nameKo: string;
  tier: 'utility' | 'sashimi' | 'yanagiba';
  /** 수율 계수 (막칼 0.85 / 회칼 1.0 / 야나기바 1.10, 상한 1.15) */
  toolYieldFactor: number;
  /** 슬라이스 얇기 계수 (클수록 얇게 많이) */
  toolThinness: number;
}

/** 회뜨기 수율 산출 입력 (전부 상위 레이어가 수집해 전달 — core는 계산만) */
export interface FilletYieldInput {
  profile: ButcheryProfile;
  /** 원본 개체 무게(g) */
  weightGram: number;
  /** 원본 개체 체장(cm) */
  lengthCm: number;
  /** 보유 최고 회칼 (null이면 회뜨기 불가 — 게이트) */
  knife: KnifeSpec | null;
  /** 손질 스킬 레벨 (GameState.skills.filleting.level) */
  skillLevel: number;
  /** 컷 정확도 평균 (0~1 — GuidedCut/CutValidator 결과) */
  cutAccuracyAvg: number;
  /** 신선도 계수 (활어 1.0 ~ 상함 0.25) */
  freshnessFactor: number;
  ikejimeDone: boolean;
  bledDone: boolean;
}

/** 회뜨기 수율 산출 결과 */
export interface FilletYieldResult {
  /** 총 가식부(회 살) 질량 (g) */
  yieldMassG: number;
  /** 필렛 장수 (round=2 / 광어=4, 대형 광어=5) */
  filletCount: number;
  /** 회 슬라이스(점) 수 */
  sliceCount: number;
  grade: SashimiGrade;
  /** 판매가 배율 */
  gradeMult: number;
  /** 체장 미달 — 회뜨기 비효율(통마리 유도) */
  undersizedForFillet: boolean;
  /** 부산물 (수율의 나머지 — 중골+머리 육수용, 껍질) */
  byproducts: ButcheryByproducts;
}

/**
 * 손질 부산물 — 어종명 접두 개별 아이템으로 지급 (2026-07-29 세분화):
 *  생선 머리·척추뼈·갈빗대뼈 = 매운탕/지리 재료(요리 탭 사용) / 내장 = 밑밥 전환('만들기') /
 *  껍질 = 구이·육수. (구 boneHeadG 22% 통합을 머리 12% + 척추 6% + 갈빗대 4%로 분리)
 */
export interface ButcheryByproducts {
  /** 생선 머리 질량 (g) — 매운탕/육수 */
  headG: number;
  /** 척추뼈(중골) 질량 (g) — 매운탕/육수 */
  spineG: number;
  /** 갈빗대뼈 질량 (g) — 매운탕/육수 */
  ribG: number;
  /** 가시뼈(핀본) 질량 (g) — 필렛에서 발라낸 잔가시. 육수/폐기 */
  pinBoneG: number;
  /** 내장 질량 (g) — 밑밥 전환용 (신선도 급감 프로필: 활어 10분 → 나쁨 1시간 → 부패) */
  visceraG: number;
  /** 껍질 장수 (박피 산출 — 구이/육수용). 껍질 없는 어종은 0 */
  skinPieces: number;
}

/** 인터랙션 프리미티브 종류 (client가 종류별 입력을 렌더) */
export type ButcheryPrimitive =
  | 'tap'          // 시메 — 지점 탭 (뇌 지점)
  | 'guided_cut'   // 가이드 경로 트레이스
  | 'drag_fill'    // 영역 스트로크 채움 (비늘치기)
  | 'scoop'        // 내장 긁어내기 (배 영역 채움)
  | 'wash'         // 세척/얼음물 버튼
  | 'peel';        // 껍질 당겨 벗기기 (꼬리 손잡이 → 좌로 당김)

/** 손질 스테이지 정의 (FSM 노드) */
export interface ButcheryStage {
  id: string;
  label: string;
  /** 하단 안내 문구 */
  guide: string;
  orientation: OrientationState;
  primitive: ButcheryPrimitive;
  /** guided_cut용 컷 스펙 */
  cut?: CutSpec;
  /** tap용 목표점/허용 반경 (정규화) */
  tapPoint?: CutPoint;
  tapRadius?: number;
  /** drag_fill/scoop 요구 채움량 (0~1) */
  fillTarget?: number;
  /**
   * 문지르기/박피 스윕 경로 (drag_fill·scoop·peel) — 커서가 따라가야 할 유도선.
   * **채움 게이지는 이 경로의 커버리지 기준**(전 구간을 문질러야 100%). 없으면 client 기본값.
   */
  sweepPath?: CutPoint[];
  /** peel 당김 반복 수 (필렛 수만큼) */
  pullsRequired?: number;
  /** 완료 시 필렛 +1 (장 뜨기 분리 스테이지) */
  yieldsFillet?: boolean;
}

/** 컷 판정 결과 */
export interface CutEvalResult {
  /** 가이드 경로 커버율 (0~1) */
  coverage: number;
  /** 평균 이탈 (tolerance 배수) */
  avgDeviationRatio: number;
  /** 종합 품질 (0~1) */
  quality: number;
  /** minCoverage 충족 여부 */
  passed: boolean;
}

/** 사시미 등급 */
export type SashimiGrade = '특' | '상' | '중' | '하';

export interface ButcheryResult {
  filletCount: number;
  /** 컷 정확도 평균 (0~1) */
  avgCutQuality: number;
  ikejimeDone: boolean;
  bledDone: boolean;
  grade: SashimiGrade;
  /** 판매가 배율 */
  gradeMult: number;
}

// ────────────────────────────────────────────────────────────
// 픽셀 가이드 어종 프로필 (SASHIMI_PIXEL_GUIDE_SPEC §5-1)
//  — 선행 9컷 + 본편 26컷(S/A/B/C군)을 어종별로 자동 재생성하는 파라미터.
//  손그림 신규 드로잉 없이 이 값 + 팔레트만으로 시트 변형을 만든다.
// ────────────────────────────────────────────────────────────
/** 가이드 시트 파라메트릭 생성 프로필 — 어종 그룹 단위 */
export interface ButcheryGuideProfile {
  /** 시트 그룹 키 ('seabream' | 'seabass' | 'mackerel' ...) */
  speciesGroup: string;
  /** 체고/체장 비 — 감성돔 0.53, 농어 0.34, 고등어 0.28 */
  depthRatio: number;
  /** 꼬리자루 굵기 (감성돔 0.17) */
  peduncle: number;
  /** 꼬리지느러미 형태 */
  caudal: 'forked' | 'truncate' | 'lunate' | 'rounded';
  /** 등→배 8단계 피부색 */
  skinRamp: string[];
  /** 세로 줄무늬 위치 (감성돔 5줄 — 없으면 생략) */
  bars?: number[];
  /** 살색 5단계 (흰살/붉은살) */
  fleshRamp: string[];
  // ── 선행 9컷(S·A군)용 — 머리/지느러미/배따기 파라미터 ──
  /** 머리 길이/체장 — 감성돔 0.22, 농어 0.28, 대구 0.32 */
  headRatio: number;
  /** 주둥이 형태 — 돔류 blunt */
  snout: 'blunt' | 'pointed' | 'protruding';
  /** 눈 지름(도트) */
  eyeSize: number;
  /** 아가미뚜껑 뒤 절단선 기울기 (감성돔 0.26) */
  gillLine: number;
  /** 등지느러미 가시 수 (감성돔 11) */
  dorsalSpines: number;
  /** 등지느러미 시작/끝 t */
  dorsalSpan: [number, number];
  /** 뒷지느러미 시작/끝 t */
  analSpan: [number, number];
  /** 항문 위치 t — 배 가르기 종점 */
  ventPos: number;
  /** 비늘 종류 — 비늘치기 연출(무린어는 선행 1·2컷 스킵) */
  scaleType: 'ctenoid' | 'cycloid' | 'none';
}

// ────────────────────────────────────────────────────────────
// 부산물 · 손질 진척 · 재장착 (SASHIMI_PIXEL_GUIDE_SPEC §6)
//  — 스키마 선행 정의. 팝업/재장착 UI 배선은 47-스테이지 풀 트리와 함께 차기.
// ────────────────────────────────────────────────────────────
/** 손질 산출물 종류 */
export type ButcheryProductId =
  | 'fillet_raw'     // 필렛 (갈빗대+지아이+껍질)
  | 'spine_bone'     // 척추뼈(중골) — 육수/사료
  | 'tail'           // 꼬리
  | 'rib_bone'       // 갈빗대뼈
  | 'pin_bone'       // 지아이뼈
  | 'loin_skinon'    // 껍질붙은 로인
  | 'fish_skin'      // 껍질 (구이/부각)
  | 'loin_clean'     // 순수 필렛(로인) → 회썰기
  | 'fish_scale'     // 비늘
  | 'fish_head'      // 머리 (매운탕/육수)
  | 'fish_fin'       // 지느러미
  | 'viscera'        // 내장
  | 'fish_dressed';  // 손질 중인 몸통 (선행 도중 이탈 시)

/** 아이템에 박아두는 손질 진척 스냅샷 — 도마 재장착 시 이 지점부터 재개 */
export interface ButcheryProgress {
  /** 다음에 수행할 캐노니컬 스테이지 id */
  stageId: string;
  /** 가이드 컷 번호 (오버레이 동기화 — 본편 1..38) */
  panel: number;
  /** 필렛 2장 구분 */
  side?: 'A' | 'B';
  /** 로인 4조각 중 몇 번째 */
  loinIndex?: 0 | 1 | 2 | 3;
  flags: { ribRemoved: boolean; pinRemoved: boolean; skinRemoved: boolean };
}

/** 손질 중 분리된 부산물 팝업 페이로드 (§6-B) */
export interface ButcheryYieldPopup {
  productId: ButcheryProductId;
  /** 팝업 문구의 "{어종명}" */
  speciesName: string;
  /** '필렛(갈빗대+지아이+껍질)' 등 표시명 */
  label: string;
  count: number;
  /** 수율 계산 결과 (SASHIMI_YIELD_SPEC) */
  weightG: number;
  /** 아이템에 그대로 승계 */
  freshness: number;
  /** 살 계열만 */
  grade?: SashimiGrade;
  /** 도마에 다시 올릴 수 있는가 (§6-D) */
  remountable: boolean;
  /** remountable일 때 이어갈 스테이지 */
  nextStageId?: string;
}

/** 스택 판정 최소 형태 — 인벤토리 아이템에서 발췌 */
export interface ButcheryStackable {
  productId?: ButcheryProductId | string;
  speciesId?: string;
  progress?: ButcheryProgress;
  grade?: SashimiGrade | string;
}

/**
 * 손질 산출물 스택 판정 (§6-F) — progress 보유 = 개체별 진척이 달라 항상 비스택.
 * 부산물(비늘/머리/내장/뼈 등)만 어종+등급 단위로 스택된다.
 * 전용 임시 슬롯 없이 일반 인벤토리 규칙만으로 성립하는 것이 §6-F의 결정.
 */
export function canStack(a: ButcheryStackable, b: ButcheryStackable): boolean {
  if (a.productId !== b.productId) return false;
  if (a.speciesId !== b.speciesId) return false;
  if (a.progress || b.progress) return false;   // progress 보유 = 항상 개체 취급
  return a.grade === b.grade;
}
