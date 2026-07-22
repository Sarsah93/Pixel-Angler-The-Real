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
  BACK_DOWN: '등 아래로 (항문 위)',
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
  /** 정규화(0~1) 가이드 폴리라인 (오리엔티드 뷰 기준) */
  guidePath: CutPoint[];
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
