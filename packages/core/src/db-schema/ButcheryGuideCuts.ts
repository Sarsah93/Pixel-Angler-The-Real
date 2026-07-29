/**
 * @file ButcheryGuideCuts.ts
 * @description 삼면뜨기 픽셀 가이드 — 선행 9컷 + 본편 38컷 ↔ 스테이지 바인딩 (SASHIMI_PIXEL_GUIDE_SPEC)
 *
 * 원본: 감성돔 실사 손질 PDF 38페이지(1:1) + 선행 4과정 신규 작화 9컷 = 47컷 시트
 * (sashimi_pixel_guide.svg → PNG 2024×2154, 6열×8행). 이 파일은 로직 신규 정의가
 * 아니라 **그림 ↔ 스테이지 바인딩 규격**이다:
 *  - SASHIMI_GUIDE_CUTS: 캐노니컬 47행 (스펙 §1-A·§2 대조표 — 스펙 stageId 기준)
 *  - LIVE_STAGE_GUIDE  : 실제 ButcheryProcess 스테이지 id → 가이드 컷 시퀀스 브리지
 *    (기존 검증된 FSM id를 유지한 채 컷을 바인딩 — 47-스테이지 풀 트리 재작성은 차기)
 *  - 시트 그리드 지오메트리(클라이언트 프레임 등록용) + 어종 그룹/프로필
 *
 * 방향 불변식(§1): 머리는 47컷 내내 왼쪽(←) — 예외는 박피 4컷(34~37, 꼬리 왼쪽).
 * 뒤집기는 좌우 반전이 아니라 **장축 뒤집기**(머리 고정, 등↔배 반전).
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { OrientationState, ButcheryGuideProfile } from '../types/Butchery.js';

// ────────────────────────────────────────────────────────────
// 시트 그리드 지오메트리 (클라이언트가 단일 PNG에서 프레임 등록)
// ────────────────────────────────────────────────────────────
/** 픽셀 가이드 시트 레이아웃 — sashimi_pixel_guide.png (2024×2154) 기준 */
export const SASHIMI_GUIDE_SHEET = {
  /** 시트 전체 크기 (px) */
  sheetW: 2024, sheetH: 2154,
  /** 패널 프레임 크기 (px) */
  panelW: 316, panelH: 186,
  /** 그리드 원점 + 피치 */
  gridX0: 24, gridY0: 112, pitchX: 332, pitchY: 254,
  cols: 6,
  /** 총 컷 수 (선행 9 + 본편 38) */
  totalCuts: 47,
} as const;

/**
 * 컷 키 → 시트 그리드 인덱스 (row-major). 배치: 1행 6칸 + 2행 앞 3칸 = 선행 9컷,
 * 이어서 본편 38컷, 마지막 1칸 공백. 키: 'pre1'~'pre9' / 'p01'~'p38'.
 */
export function guideCutGridIndex(key: string): number {
  if (key.startsWith('pre')) return Number(key.slice(3)) - 1;          // pre1 → 0
  return 9 + Number(key.slice(1)) - 1;                                  // p01 → 9
}

/** 컷 키 → 시트 픽셀 사각형 (클라이언트 texture.add 프레임 등록용) */
export function guideCutFrameRect(key: string): { x: number; y: number; w: number; h: number } {
  const S = SASHIMI_GUIDE_SHEET;
  const idx = guideCutGridIndex(key);
  const col = idx % S.cols;
  const row = Math.floor(idx / S.cols);
  return { x: S.gridX0 + col * S.pitchX, y: S.gridY0 + row * S.pitchY, w: S.panelW, h: S.panelH };
}

/** 전체 컷 키 목록 (프레임 일괄 등록용) */
export function allGuideCutKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 9; i++) keys.push(`pre${i}`);
  for (let i = 1; i <= 38; i++) keys.push(`p${String(i).padStart(2, '0')}`);
  return keys;
}

// ────────────────────────────────────────────────────────────
// 캐노니컬 47행 — 스펙 §1-A(선행) + §2(본편) 대조표
// ────────────────────────────────────────────────────────────
/** 가이드 컷 1행 — 그림 ↔ 스테이지 바인딩 (§4-A) */
export interface ButcheryGuideCut {
  /** 본편 패널 번호 (1..38 = 원본 PDF 페이지와 동일) */
  panel?: number;
  /** 선행 번호 (1..9) — 있으면 panel 대신 이 번호 (본편 번호 오염 금지) */
  pre?: number;
  /** 스펙 스테이지 id (캐노니컬 — 실제 FSM id는 LIVE_STAGE_GUIDE 브리지 참조) */
  stageId: string;
  /** 다회 스트로크 스테이지의 회차 */
  pass?: number;
  /** 한국어 캡션 한 줄 */
  caption: string;
  /** 스펙 기준 방향 (§1 매핑 — 1~8=BASE / 9~17=FLIP / 18~37=FLESH_UP) */
  orientation: OrientationState;
  /** 칼길 시작 가장자리 — 판정 힌트와 정합해야 함 (dev 어서션 대상) */
  startEdge: 'belly' | 'back' | 'none';
}

/** 컷 키 ('pre3' | 'p07') 생성 */
export function guideCutKey(cut: ButcheryGuideCut): string {
  return cut.pre !== undefined ? `pre${cut.pre}` : `p${String(cut.panel).padStart(2, '0')}`;
}

export const SASHIMI_GUIDE_CUTS: ButcheryGuideCut[] = [
  // ── 선행 9컷 (§1-A) — 비늘치기 → 머리 제거 → 지느러미 → 배따기·내장 ──
  { pre: 1, stageId: 'pre_descale_a', caption: '비늘치기 ① — 꼬리(→)에서 머리(←)쪽으로 역방향 긁기', orientation: 'BASE', startEdge: 'none' },
  { pre: 2, stageId: 'pre_descale_b', caption: '비늘치기 ② — 장축 뒤집어 반대면 (머리 계속 ← · 등↔배 반전)', orientation: 'FLIP', startEdge: 'none' },
  { pre: 3, stageId: 'pre_head_cut', caption: '머리 제거 ① — 가슴지느러미 뒤 사선 절단선 (양면 동일)', orientation: 'BASE', startEdge: 'none' },
  { pre: 4, stageId: 'pre_head_done', caption: '머리 제거 ② — 머리 분리 완료 (머리는 따로 보관)', orientation: 'BASE', startEdge: 'none' },
  { pre: 5, stageId: 'pre_finectomy', caption: '등·배 지느러미 제거 — 양옆에 칼집 → 잡아 뽑기', orientation: 'BASE', startEdge: 'back' },
  { pre: 6, stageId: 'pre_gut_open', caption: '배 따기 — 항문(뒤)에서 목(앞)까지 복면 정중선을 세로로 가르기', orientation: 'BASE', startEdge: 'belly' },
  { pre: 7, stageId: 'pre_gut_pull', caption: '내장 제거 — 갈빗대 안쪽 내장을 통째로 꺼내기', orientation: 'BASE', startEdge: 'belly' },
  { pre: 8, stageId: 'pre_kidney_wash', caption: '핏줄(신장) 긁기 — 척추 아래 검붉은 막 제거 후 세척 (도구 = 숟가락)', orientation: 'BASE', startEdge: 'belly' },
  { pre: 9, stageId: 'fil_ready', caption: '선행 완료 = 본편 (1)번 상태 — 여기서 삼면뜨기 시작', orientation: 'BASE', startEdge: 'none' },
  // ── 본편 38컷 (§2) — 패널 번호 = PDF 페이지 번호 ──
  { panel: 1, stageId: 'fil_ready', caption: '손질된 몸통 — 머리·지느러미·내장 제거 완료 (머리 ← / 꼬리 →)', orientation: 'BASE', startEdge: 'none' },
  { panel: 2, stageId: 'fil_belly_path', pass: 1, caption: '배쪽 길 만들기 ① — 배선을 얕게 (머리→꼬리)', orientation: 'BASE', startEdge: 'belly' },
  { panel: 3, stageId: 'fil_belly_path', pass: 2, caption: '배쪽 길 만들기 ② — 같은 선을 다시 깊게', orientation: 'BASE', startEdge: 'belly' },
  { panel: 4, stageId: 'fil_belly_path', pass: 3, caption: '배쪽 길 만들기 ③ — 갈빗대 위까지 도달', orientation: 'BASE', startEdge: 'belly' },
  { panel: 5, stageId: 'fil_spine_a', caption: '배 안쪽에서 척추뼈 끊기 — 머리쪽 척추부터 (아직 한 몸)', orientation: 'BASE', startEdge: 'belly' },
  { panel: 6, stageId: 'fil_belly_through', caption: '배쪽 → 등쪽까지 길 만들기 (척추 위를 넘김)', orientation: 'BASE', startEdge: 'belly' },
  { panel: 7, stageId: 'fil_cut_a', caption: '배쪽→등쪽 잘라내기 — 아래 반대쪽 필렛 + 그 위 척추뼈', orientation: 'BASE', startEdge: 'belly' },
  { panel: 8, stageId: 'fil_done_a', caption: '필렛 1면 완성 — 껍질·갈빗대·지아이뼈 포함 (갈빗대 = 아래·배쪽)', orientation: 'BASE', startEdge: 'none' },
  { panel: 9, stageId: 'fil_back_path', pass: 1, caption: '뒤집기 → 등쪽 길 만들기 ① (등이 아래, 머리는 계속 ←)', orientation: 'FLIP', startEdge: 'back' },
  { panel: 10, stageId: 'fil_back_path', pass: 2, caption: '등쪽 길 만들기 ② — 같은 선을 다시 깊게', orientation: 'FLIP', startEdge: 'back' },
  { panel: 11, stageId: 'fil_back_path', pass: 3, caption: '등쪽 길 만들기 ③ — 척추 옆까지 도달', orientation: 'FLIP', startEdge: 'back' },
  { panel: 12, stageId: 'fil_spine_b', caption: '등쪽에서 배 안쪽으로 척추뼈 끊기 — 머리쪽부터 (아직 한 몸)', orientation: 'FLIP', startEdge: 'back' },
  { panel: 13, stageId: 'fil_cut_b', caption: '등쪽 → 배 안쪽 길을 따라 잘라내기', orientation: 'FLIP', startEdge: 'back' },
  { panel: 14, stageId: 'fil_tail_release', caption: '꼬리~배쪽 사이 미절삭부 추가 절삭 (꼬리 →)', orientation: 'FLIP', startEdge: 'back' },
  { panel: 15, stageId: 'fil_lift', caption: '꼬리를 잡고 위로 들어 척추뼈에서 분리', orientation: 'FLIP', startEdge: 'none' },
  { panel: 16, stageId: 'fil_done_b', caption: '필렛 2면 완성 — (8)의 상하 반전 (갈빗대 = 위·배쪽)', orientation: 'FLIP', startEdge: 'none' },
  { panel: 17, stageId: 'fil_layout', caption: '정리 — 필렛 2장 + 중골 1장 (머리 ← / 꼬리지느러미 →)', orientation: 'FLIP', startEdge: 'none' },
  { panel: 18, stageId: 'rib_a', pass: 1, caption: '[필렛 A] 갈빗대 제거 ① — 갈빗대 아래로 칼 넣기', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 19, stageId: 'rib_a', pass: 2, caption: '[필렛 A] 갈빗대 제거 ② — 칼을 눕혀 밀며 저며냄', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 20, stageId: 'rib_a', pass: 3, caption: '[필렛 A] 갈빗대 제거 ③ — 갈빗대 판 분리 완료', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 21, stageId: 'rib_b', pass: 1, caption: '[필렛 B] 갈빗대 제거 ① (반대쪽 필렛도 동일 반복)', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 22, stageId: 'rib_b', pass: 2, caption: '[필렛 B] 갈빗대 제거 ②', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 23, stageId: 'rib_b', pass: 3, caption: '[필렛 B] 갈빗대 제거 ③', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 24, stageId: 'pin_a', pass: 1, caption: '[필렛 A] 지아이뼈 라인 확인 — 가로 붉은 점 줄', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 25, stageId: 'pin_a', pass: 2, caption: '[필렛 A] 지아이 라인을 따라 일자로 절단', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 26, stageId: 'pin_a', pass: 3, caption: '[필렛 A] 절단면에서 지아이뼈 저며내기', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 27, stageId: 'pin_a', pass: 4, caption: '[필렛 A] 심지 제거 → 등쪽·배쪽 로인 2조각', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 28, stageId: 'pin_b', pass: 1, caption: '[필렛 B] 지아이뼈 라인 확인 (동일 반복)', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 29, stageId: 'pin_b', pass: 2, caption: '[필렛 B] 지아이 라인을 따라 일자 절단', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 30, stageId: 'pin_b', pass: 3, caption: '[필렛 B] 절단면 지아이뼈 저며내기', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 31, stageId: 'pin_b', pass: 4, caption: '[필렛 B] 심지 제거 → 로인 2조각', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 32, stageId: 'loin_a', caption: '뼈 없는 껍질붙은 로인 2조각 (필렛 A)', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 33, stageId: 'loin_all', caption: '총 4조각 — 등쪽 2 + 배쪽 2 (껍질 있음)', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 34, stageId: 'peel', pass: 1, caption: '박피 ① — 꼬리쪽(←) 끝살만 세로로 살짝 잘라 손잡이 만들기', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 35, stageId: 'peel', pass: 2, caption: '박피 ② — 살과 껍질 사이로 칼날을 세워서 넣기 (칼 세로·진행 수평)', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 36, stageId: 'peel', pass: 3, caption: '박피 ③ — 껍질을 잡고 세운 칼을 머리(→)쪽으로 수평으로 밀기', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 37, stageId: 'peel', pass: 4, caption: '박피 ④ — 껍질 완전 분리', orientation: 'FLESH_UP', startEdge: 'none' },
  { panel: 38, stageId: 'peel_done', caption: '순수 필렛 완성 — 같은 작업 4회 반복 (→ 회썰기 단계)', orientation: 'FLESH_UP', startEdge: 'none' },
];

/** 캐노니컬 스테이지 id의 컷 시퀀스 (pass 오름차순 — 없으면 등재 순) */
export function getGuideCuts(stageId: string): ButcheryGuideCut[] {
  return SASHIMI_GUIDE_CUTS
    .filter((c) => c.stageId === stageId)
    .sort((a, b) => (a.pass ?? 0) - (b.pass ?? 0));
}

// ────────────────────────────────────────────────────────────
// LIVE 브리지 — 실제 ButcheryProcess 스테이지 id → 가이드 컷 키 시퀀스
//  (기존 검증된 FSM(17~18 스테이지)을 유지한 채 그림만 바인딩.
//   47-스테이지 풀 트리(fil_spine/rib/pin/loin 개별 스테이지) 재작성은 차기 —
//   그때 이 브리지는 1:1로 수렴한다.)
// ────────────────────────────────────────────────────────────
/**
 * 실 FSM 스테이지 id → 컷 키 배열. 다회(칼집 ×3, 박피 당김 ×N) 스테이지는
 * 진행 회차(passIndex)로 배열을 순회한다 (범위 초과 시 마지막 컷 유지).
 * 시메/방혈(활어 즉살)은 47컷 범위 밖 — 매핑 없음(가이드 슬롯 숨김).
 */
export const LIVE_STAGE_GUIDE: Record<string, string[]> = {
  scale_base: ['pre1'],
  scale_flip: ['pre2'],
  scale_wash: ['pre2'],
  head_base: ['pre3'],
  head_flip: ['pre4'],
  finectomy: ['pre5'],
  gut_open: ['pre6'],
  gut_scoop: ['pre7'],
  gut_wash: ['pre8'],
  // 꼬리 손잡이 홈 = 박피① 손잡이 만들기 (실 FSM은 필렛 전에 먼저 파둔다)
  tail_grip: ['p34'],
  // 1면(첫 장): 배쪽 길 ①②③ → 잘라내기
  fillet_0_score: ['p02', 'p03', 'p04'],
  fillet_0_sever: ['p05', 'p07'],
  // 2면(둘째 장): 등쪽 길 ①②③ → 잘라내기
  fillet_1_score: ['p09', 'p10', 'p11'],
  fillet_1_sever: ['p12', 'p13'],
  // 박피 — 당김 회차별 ② 칼 넣기 → ③ 밀기 → ④ 분리
  peel: ['p35', 'p36', 'p37'],
};

/** 완료(결과 화면) 컷 키 — 순수 필렛 완성 */
export const GUIDE_CUT_DONE_KEY = 'p38';

/** 컷 키 → 캐노니컬 행 조회 */
export function guideCutByKey(key: string): ButcheryGuideCut | undefined {
  return SASHIMI_GUIDE_CUTS.find((c) => guideCutKey(c) === key);
}

/**
 * 실 FSM 스테이지의 현재 표시 컷 해소 — passIndex = 완료한 스트로크/당김 수 (0부터).
 * 매핑이 없거나(시메/방혈) 어종이 가이드 그룹 밖이면 null.
 */
export function resolveLiveGuideCut(
  liveStageId: string, passIndex = 0,
): { key: string; cut: ButcheryGuideCut } | null {
  const seq = LIVE_STAGE_GUIDE[liveStageId];
  if (!seq || seq.length === 0) return null;
  const key = seq[Math.max(0, Math.min(seq.length - 1, passIndex))];
  const cut = guideCutByKey(key);
  return cut ? { key, cut } : null;
}

// ────────────────────────────────────────────────────────────
// 어종 그룹 — 돔류 전체가 감성돔 시트를 공유 (팔레트 변형 시트는 차기)
// ────────────────────────────────────────────────────────────
/**
 * speciesId → 가이드 시트 그룹. 등재된 어종만 가이드 슬롯/시트 열람 활성.
 * 돔류(체형·손질 순서 동일)는 감성돔 기본 시트 재사용 — 참돔 등 색 변형은
 * SVG 팔레트 스왑 → 재렌더로 생성 예정(§5-1, 작업량 최소화).
 * 광어(오면뜨기)·장어·두족류·복어는 별도 시퀀스라 미등재 (§5-2).
 */
export const SASHIMI_GUIDE_GROUP: Record<string, string> = {
  black_seabream: 'seabream',      // 감성돔 (기본 작화)
  red_seabream: 'seabream',        // 참돔 (팔레트 변형 대상 — 배 흰색/중간 주황/등 분홍)
  night_seabream: 'seabream',      // 참돔 야간 엔트리
  blackfish: 'seabream',           // 벵에돔
  longtail_blackfish: 'seabream',  // 긴꼬리벵에돔
  stone_beakperch: 'seabream',     // 돌돔
  spotted_knifejaw: 'seabream',    // 강담돔
};

/** 감성돔(돔류 기준) 가이드 프로필 — §5-1 파라메트릭 재생성 파라미터 */
export const SEABREAM_GUIDE_PROFILE: ButcheryGuideProfile = {
  speciesGroup: 'seabream',
  depthRatio: 0.53, peduncle: 0.17, caudal: 'forked',
  skinRamp: ['#2c3540', '#3a4550', '#4a5662', '#5c6874', '#707c88', '#8a95a0', '#a8b2ba', '#c8d0d6'],
  bars: [0.22, 0.36, 0.50, 0.64, 0.78],
  fleshRamp: ['#f3d9d4', '#eecac4', '#e8bab2', '#e0a89e', '#d4948a'],
  headRatio: 0.22, snout: 'blunt', eyeSize: 3, gillLine: 0.26,
  dorsalSpines: 11, dorsalSpan: [0.04, 0.88], analSpan: [0.60, 0.90],
  ventPos: 0.62, scaleType: 'ctenoid',
};

// ────────────────────────────────────────────────────────────
// 부산물 테이블 (§6-C) — 팝업 발생 지점 = 가이드 패널 (데이터 스키마.
//  팝업 UI/재장착 배선은 차기 — 47-스테이지 풀 트리와 함께)
// ────────────────────────────────────────────────────────────
import type { ButcheryProductId } from '../types/Butchery.js';

/** 부산물 발생 1행 — cutKey에 도달(완료)했을 때 생성되는 산출물 */
export interface ButcheryByproductRow {
  /** 발생 지점 컷 키 ('pre4' | 'p08' 등) */
  cutKey: string;
  productId: ButcheryProductId;
  label: string;
  /** 도마 재장착 가능 여부 (§6-D) */
  remountable: boolean;
  /** remountable일 때 이어갈 캐노니컬 스테이지 id */
  nextStageId?: string;
}

export const BUTCHERY_BYPRODUCT_TABLE: ButcheryByproductRow[] = [
  { cutKey: 'pre2', productId: 'fish_scale', label: '비늘', remountable: false },
  { cutKey: 'pre4', productId: 'fish_head', label: '머리', remountable: false },
  { cutKey: 'pre5', productId: 'fish_fin', label: '지느러미', remountable: false },
  { cutKey: 'pre7', productId: 'viscera', label: '내장', remountable: false },
  { cutKey: 'p08', productId: 'fillet_raw', label: '필렛(갈빗대+지아이+껍질)', remountable: true, nextStageId: 'rib_a' },
  { cutKey: 'p16', productId: 'fillet_raw', label: '필렛(갈빗대+지아이+껍질)', remountable: true, nextStageId: 'rib_b' },
  { cutKey: 'p17', productId: 'spine_bone', label: '척추뼈(중골)', remountable: false },
  { cutKey: 'p15', productId: 'tail', label: '꼬리', remountable: false },
  { cutKey: 'p20', productId: 'rib_bone', label: '갈빗대뼈', remountable: false },
  { cutKey: 'p23', productId: 'rib_bone', label: '갈빗대뼈', remountable: false },
  { cutKey: 'p26', productId: 'pin_bone', label: '지아이뼈', remountable: false },
  { cutKey: 'p30', productId: 'pin_bone', label: '지아이뼈', remountable: false },
  { cutKey: 'p27', productId: 'loin_skinon', label: '껍질붙은 로인', remountable: true, nextStageId: 'peel' },
  { cutKey: 'p31', productId: 'loin_skinon', label: '껍질붙은 로인', remountable: true, nextStageId: 'peel' },
  { cutKey: 'p37', productId: 'fish_skin', label: '껍질', remountable: false },
  { cutKey: 'p38', productId: 'loin_clean', label: '순수 필렛(로인)', remountable: true, nextStageId: 'slice' },
];
