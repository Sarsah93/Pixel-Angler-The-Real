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
  orientationRequired: ButcheryOrientation;
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

// ────────────────────────────────────────────────────────────
// 두족류 뷰 상태 (CEPHALOPOD_BUTCHERY_SPEC §2.2)
//  — 어류 5종(OrientationState)과 별개 유니온 2개. 오징어류는 개복해 펼치고,
//    문어는 개복하지 않고 외번(外飜)하므로 뷰 체계 자체가 다르다.
// ────────────────────────────────────────────────────────────
/** 오징어·갑오징어 — 개복해 펼치는 종 */
export type CephOrientation =
  | 'CEPH_DORSAL'    // 통몸통, 등(갑) 면이 위 — 시메 단계
  | 'CEPH_VENTRAL'   // 통몸통, 배(깔때기) 면이 위 — 개복 절개면
  | 'CEPH_OPEN'      // 개복 후 펼친 시트 — 내장/아가미/연골(갑)이 보이는 면
  | 'CEPH_SKIN_UP'   // 펼친 시트, 껍질 면이 위 (장축 180° 회전 후)
  | 'CEPH_FLESH_UP'  // 펼친 시트, 살코기 면이 위
  | 'CEPH_PARTS';    // 도마 위 분리된 덩어리 배치 — 확인 전용 (체인에 끼지 않음)

/** 문어 — 개복하지 않고 외번하는 종 */
export type OctopusOrientation =
  | 'OCTO_WHOLE'     // 통마리, 등(외투막 겉면)이 위
  | 'OCTO_INVERTED'  // 머리(외투막)가 뒤집힌 상태 — 속면이 밖
  | 'OCTO_ORAL';     // 구면(빨판·입)이 정면 — 방사 배치 (guide space = radial)

/** 손질 뷰 상태 전체 — 어류 5종 + 두족류 9종 */
export type ButcheryOrientation = OrientationState | CephOrientation | OctopusOrientation;

export const CEPH_ORIENTATION_LABEL: Record<CephOrientation | OctopusOrientation, string> = {
  CEPH_DORSAL: '등면 위 (통몸통)',
  CEPH_VENTRAL: '배면 위 (개복면)',
  CEPH_OPEN: '펼친 시트 (내장면)',
  CEPH_SKIN_UP: '펼친 시트 (껍질면)',
  CEPH_FLESH_UP: '펼친 시트 (살코기면)',
  CEPH_PARTS: '분리 결과 확인',
  OCTO_WHOLE: '통마리 (등면 위)',
  OCTO_INVERTED: '머리 뒤집힘 (속면)',
  OCTO_ORAL: '구면 정면 (빨판·입)',
};

/** 뷰 상태 라벨 — 어류·두족류 통합 조회 */
export function orientationLabel(o: ButcheryOrientation): string {
  return (o in CEPH_ORIENTATION_LABEL)
    ? CEPH_ORIENTATION_LABEL[o as CephOrientation | OctopusOrientation]
    : ORIENTATION_LABEL[o as OrientationState];
}

/**
 * 뷰 반전 종류 (§2.3) — 스테이지 진입 시 선행 반전.
 * ⚠ `longAxis180`은 **장축 회전**이라 머리는 계속 좌측이다 — 좌우 반전(⇄) 아이콘 금지.
 */
export type FlipKind =
  | 'longAxis180'   // 장축 180° 회전 — 등↔배 교대 (오징어류 껍질 단계)
  | 'fleshUp'       // 껍질면 → 내장면 되뒤집기 (한치 마무리 정리)
  | 'oralUp'        // 구면(빨판·입)이 위로 (문어)
  | 'headRestore';  // 외번했던 머리를 되돌림 — headInverted를 false로 (문어 완료)

/**
 * 인터랙션 프리미티브 종류 (client가 종류별 입력을 렌더)
 *
 * ⚠ 두족류 스펙(v3)은 `lift_flap`·`drag_out`·`vessel_cut`·`fin_cut`을 "기존 어류 프리미티브"로
 * 전제했으나 실제로는 존재하지 않았다 — v3.1 §0.5.3에 따라 두족류 신규분과 함께 여기서 신설한다.
 */
export type ButcheryPrimitive =
  // ── 어류 기존 6종 ──
  | 'tap'          // 시메 — 지점 탭 (뇌 지점)
  | 'guided_cut'   // 가이드 경로 트레이스
  | 'drag_fill'    // 영역 스트로크 채움 (비늘치기)
  | 'scoop'        // 내장 긁어내기 (배 영역 채움)
  | 'wash'         // 세척/얼음물 버튼
  | 'peel'         // 껍질 당겨 벗기기 (판정 파라미터는 프로필/스테이지가 준다)
  // ── 두족류 (CEPHALOPOD_BUTCHERY_SPEC §3) ──
  | 'nerve_cut'    // 짧은 정밀 절단 1회 — 위치 정확도 단독 판정(길이 무관)
  | 'mantle_slit'  // 강내 삽입 후 장축 롱드래그 — 깊이 게이지 동반
  | 'result'       // 비조작 확인 프레임 — 입력 없이 [확인] 1탭으로 통과
  | 'lift_flap'    // 시트/막을 젖혀 펼침
  | 'drag_out'     // 덩어리를 잡아 빼냄 (내장·연골·악판)
  | 'vessel_cut'   // 덩어리 분할 절단 (머리부 3분할·촉완)
  | 'fin_cut'      // 날개(지느러미) 분리
  | 'bone_lift'    // 강체 판(갑)을 각도 유지한 채 통째로 들어냄
  | 'invert'       // 주머니를 안팎으로 뒤집음 — 진행률 + 속도 판정
  | 'salt_apply'   // 영역 위에 입자 도포 — 양(量) 밴드 판정
  | 'hold_scrub'   // 왕복 문지르기 (아가미·점액)
  | 'flip';        // 뷰 반전 단독 — 반전 방향만 맞으면 성공

/** 손질 스테이지 정의 (FSM 노드) */
export interface ButcheryStage {
  id: string;
  label: string;
  /** 하단 안내 문구 */
  guide: string;
  /** 요구 뷰 상태 — 어류 5종 또는 두족류 9종 */
  orientation: ButcheryOrientation;
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

  // ── 두족류 전용 (CEPHALOPOD_BUTCHERY_SPEC §2.3·§3·§4) ──
  /** 이 스테이지 진입 시 선행 뷰 반전 */
  flipBefore?: FlipKind;
  /** 되돌리기 허용 (문어 외번 — 잘못 밀었을 때 원상복구) */
  reversible?: boolean;
  /**
   * peel 성공 조건이 **완주가 아니라 정지**인 스테이지의 진행률 밴드 (한치 껍질 중단).
   * 이 구간에서 포인터를 떼야 통과하며, 1.0까지 당기면 다음 절단선이 사라진다.
   */
  peelStopBand?: [number, number];
  /** peel 도구 강제 — 'towel'이면 키친타월 필요(없으면 중단 페널티 배증) */
  peelTool?: 'hand' | 'towel';
  /** salt_apply·hold_scrub 대상 영역 폴리곤 (정규화) */
  regionPoly?: CutPoint[];
  /** 방사 좌표계 뷰(문어 구면) — u·v가 몸 축이 아니라 화면 평면 좌표 */
  radialSpace?: boolean;
  /** flip 프리미티브가 요구하는 반전 방향 */
  flipKind?: FlipKind;

  /**
   * **도마 회전 요구** (넙치류 포 뜨기 — `자세한 뷰.pdf` 기준).
   * 지느러미쪽 칼길·포 뜨기는 생선을 **세로로 세워**(꼬리 아래·머리 위) 꼬리→머리 방향으로 긋는다.
   * 좌우/상하 뒤집기로는 도달할 수 없는 자세라 90° 회전을 별도 축으로 둔다.
   * 미지정이면 0(가로 배치) 요구.
   */
  rotationRequired?: BoardRotation;
}

/** 도마 회전 (도) — 0 = 가로(머리 왼쪽) / 90 = 세로(머리 위·꼬리 아래) */
export type BoardRotation = 0 | 90 | 180 | 270;

/** 회전 라벨 (뒤집기 힌트·버튼 표기) */
export const ROTATION_LABEL: Record<BoardRotation, string> = {
  0: '가로 (머리 왼쪽)',
  90: '세로 (머리 위·꼬리 아래)',
  180: '가로 (머리 오른쪽)',
  270: '세로 (머리 아래·꼬리 위)',
};

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

// ────────────────────────────────────────────────────────────
// 두족류 프로필·부산물 (CEPHALOPOD_BUTCHERY_SPEC §5·§6)
// ────────────────────────────────────────────────────────────
/** 두족류 계열 — 렌더러와 프로필 기본값을 고르는 데 쓴다 (트리는 speciesId로 고른다) */
export type CephalopodKind = 'squid' | 'cuttlefish' | 'octopus';

/** 두족류 부산물 id (§5) — 어류 부산물(ButcherySectionYield)과 별개 체계 */
export type CephByproductId =
  // 오징어류·갑오징어
  | 'ceph_head_mass' | 'ceph_pen' | 'ceph_skin' | 'ceph_gill'
  | 'ceph_fin_meat' | 'ceph_arms' | 'ceph_head' | 'ceph_ink_sac'
  | 'ceph_gonad' | 'ceph_mantle_fillet'
  | 'ceph_tentacle' | 'ceph_cuttlebone' | 'ceph_inner_skin' | 'ceph_beak'
  // 문어
  | 'octo_viscera' | 'octo_ink_sac' | 'octo_beak' | 'octo_slime' | 'octo_whole';

/** 두족류 부산물 정의 */
export interface CephByproductDef {
  id: CephByproductId;
  nameKo: string;
  /** 기본 선택 — 'keep' 보관 / 'discard' 버리기 / 'auto_discard' 인벤토리 미적재 */
  defaultAction: 'keep' | 'discard' | 'auto_discard';
  /** 버리기 선택지 차단 (손질 진행에 필수인 산출물) */
  forced?: boolean;
  /** 인벤토리 스택 상한 */
  stack: number;
  /** 개당 판매가 (원). auto_discard는 0 */
  price: number;
  /** 쓰임새 설명 (상세보기) */
  use: string;
  /**
   * 아이콘 텍스처 키 (`trim_*` — BootScene 로드분). 전용 에셋이 없으면 생략.
   * 몸통 순살처럼 **종별로 다른 에셋**을 쓰는 부산물은 `cephByproductIcon()`이 분기한다.
   */
  icon?: string;
}

/**
 * 두족류 손질 프로필 (§6) — 공정 형태·수율 비율·리스크.
 * ⚠ `spawningMonths`는 v3.1 신설: 어종 DB에 산란기 필드가 없어 프로필이 직접 들고 있는다.
 */
export interface CephalopodProfile {
  readonly speciesId: string;
  readonly kind: CephalopodKind;

  // ── 공정 형태 ──
  readonly shimeStages: 0 | 2;             // 문어 0, 오징어류 2
  readonly needsInversion: boolean;        // 외번 — 문어만
  readonly needsSaltScrub: boolean;        // 소금 문지르기 — 문어만
  readonly skinLayers: 0 | 1 | 2;          // 문어 0 / 오징어·한치 1 / 갑오징어 2
  readonly hasPen: boolean;                // 얇은 투명 연골
  readonly hasCuttlebone: boolean;         // 두꺼운 석회질 판
  readonly beakRemoval: 'with_head_split' | 'dedicated' | 'none';
  readonly gillRemoval: 'separate' | 'with_pen' | 'with_viscera' | 'none';
  readonly hasTentacles: boolean;          // 촉완 2가닥 — 문어 false

  // ── 수율 비율 ──
  readonly mantleRatio: number;
  readonly finRatio: number;
  readonly armsRatio: number;
  readonly tentacleRatio: number;
  readonly headRatio: number;
  readonly boneRatio: number;              // 갑·펜이 차지하는 중량 비율
  readonly baseYieldRate: number;

  // ── 리스크 ──
  readonly inkAmount: number;              // 0~1 — 갑오징어가 최대(0.90)
  readonly gonadChance: number;            // 산란기 내 생식소 등장 확률
  /** 산란기(월) — 이 밖에서 잡힌 개체엔 생식소가 없다 */
  readonly spawningMonths: readonly number[];

  /** 슬라이싱 트리 입력 모드 — 오징어류 채썰기 / 문어 어슷썰기·숙회 */
  readonly sliceMode: 'strip' | 'whole';
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
