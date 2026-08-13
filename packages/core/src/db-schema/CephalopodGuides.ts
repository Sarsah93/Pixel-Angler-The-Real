/**
 * @file CephalopodGuides.ts
 * @description 두족류 손질 가이드 좌표 (CEPHALOPOD_BUTCHERY_SPEC §4.6)
 *
 * **정본은 `docs/mockups/{squid,hanchi,gapo,octo}_guide.svg` 4장이다.**
 * 값은 시트 오버레이 좌표를 76×40 셀 캔버스에서 정규화한 것 — 시트를 고치면 여기도 같이 고친다.
 *
 * ⚠ 스펙 v3은 `FishUV {u,v}`를 썼지만 이 레포의 정규화 좌표 타입은 **`CutPoint {x,y}`** 다
 * (v3.1 §0.5.2). u→x, v→y로 옮겨 적었다.
 * ⚠ 몸 전장이 아니라 **시트 그리드**로 정규화했으므로 몸 끝은 x=1.00이 아니라 0.93~0.95다.
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { CutPoint } from '../types/Butchery.js';

// ── 오징어류 3종 공통 ────────────────────────────────
// ⚠ 무늬오징어(squid) 값은 **F9 실측 확정** (사용자 측정 2026-08-11 — 89차 피사체 rect 기준).
//   좌표 기준은 도마 전체가 아니라 **그 스테이지 스프라이트의 실점유 rect**다.
/** 개복 절개 — 외투막 입구 → 몸통 끝 (실측: squid_shime2 뷰) */
export const CEPH_SLIT_PATH: readonly CutPoint[] = [{ x: 0.538, y: 0.499 }, { x: 0.971, y: 0.531 }];
/** 시메 ① — 갑(몸통)–눈 사이 (실측 경로 중점) */
export const CEPH_SHIME_1: CutPoint = { x: 0.535, y: 0.571 };
/** 시메 ② — 눈–다리 사이 (실측 경로 중점) */
export const CEPH_SHIME_2: CutPoint = { x: 0.441, y: 0.576 };

// ── 종별 분리 — 시작점·방향이 실사에서 서로 다르다 ──
/**
 * 껍질 잡는 지점.
 * 무늬오징어 = detail 목업 「껍질 벗기기 1」의 곡선 시작점(초록 링) — 좌표는 **회전 뷰(270)
 * 화면 기준을 로컬로 역변환**한 값. 뜯기 ① 스윕(CEPH_PEEL_PATH)의 시작점과 동일.
 */
export const CEPH_SKIN_GRIP: Record<string, CutPoint> = {
  squid:          { x: 0.58, y: 0.87 },
  swordtip_squid: { x: 0.93, y: 0.46 },   // 몸통 꼭대기
  cuttlefish:     { x: 0.28, y: 0.16 },   // 개복부 모서리 (몸통 끝이 두껍고 각침이 남을 수 있다)
};

/** 껍질 당김 경로 */
export const CEPH_PEEL_PATH: Record<string, readonly CutPoint[]> = {
  // 무늬오징어 = detail 목업 「껍질 벗기기 1」의 곡선 가이드 (095차부터 **4단계 분할** —
  // 실제 소비는 `CEPH_PEEL_STEP_SWEEPS`. 이 전체 곡선은 참고용으로 보존).
  squid: [
    { x: 0.58, y: 0.87 }, { x: 0.67, y: 0.74 }, { x: 0.70, y: 0.60 },
    { x: 0.70, y: 0.45 }, { x: 0.67, y: 0.32 },
  ],
  // 한치는 머리쪽 부착부를 남기고 멈춘다 — 끝점이 그 부착부
  swordtip_squid: [{ x: 0.93, y: 0.46 }, { x: 0.61, y: 0.47 }, { x: 0.29, y: 0.55 }],
  // 갑오징어만 방향이 반대(좌→우) — 개복부 모서리에서 시작해 반대편으로 밀어낸다
  cuttlefish:     [{ x: 0.28, y: 0.16 }, { x: 0.58, y: 0.15 }, { x: 0.87, y: 0.15 }],
};

/**
 * 껍질 뜯기(가로) **4단계 각각의 당김 스윕** — **F9 실측** (사용자 2026-08-13, 096차).
 * 각 단계의 좌표 기준은 **그 단계의 시작 프레임**
 * (1단계 = 들춘 손잡이(0-1) / 2단계 = 1-2 / 3단계 = 2 / 4단계 = 3).
 */
export const CEPH_PEEL_STEP_SWEEPS: readonly (readonly CutPoint[])[] = [
  [{ x: 0.661, y: 0.730 }, { x: 0.550, y: 0.530 }],   // 1/4 (실측)
  [{ x: 0.670, y: 0.668 }, { x: 0.668, y: 0.366 }],   // 2/4 (실측)
  [{ x: 0.613, y: 0.547 }, { x: 0.729, y: 0.187 }],   // 3/4 (실측)
  [{ x: 0.557, y: 0.530 }, { x: 0.552, y: 0.217 }],   // 4/4 (실측)
];

/**
 * 부리(입) 빼내기 — **오징어류 3종 공통** (사용자 지시 2026-08-05).
 * 다리 밑동이 모이는 중심에서 부리를 눌러 밀어 올린 뒤 통째로 뽑는다.
 * 문어의 `OCTO_BEAK_*`와 같은 동작이지만, 오징어는 머리부 분할 뷰(CEPH_PARTS)에서 수행한다.
 * 좌표 = **F9 실측** (사용자 2026-08-13 — 「이빨 제거」 목업의 잡기→당기기와 정합).
 */
export const CEPH_BEAK_CENTER: CutPoint = { x: 0.575, y: 0.613 };
export const CEPH_BEAK_PATH: readonly CutPoint[] = [{ x: 0.575, y: 0.613 }, { x: 0.493, y: 0.559 }];

/**
 * ── 스펙 §4.6에 없는 경로 (87차 신설) ────────────────
 * v3 §4.6은 절개·박리·부리만 상수화했고, 나머지 스테이지(펼치기·내장·펜·아가미·날개·3분할)는
 * 경로를 명시하지 않았다. §2.1 랜드마크 표(팔 밑동 0.25 · 눈 0.33 · 외투막 입구 0.39 ·
 * 내장 중심 0.72 · 몸통 끝 0.95)에 맞춰 **근사값**으로 둔다.
 * ⚠ 전부 **F9 실측 대상** — 시트(`docs/mockups/squid_guide.svg`)가 정본이다.
 */
/** 시메 ①② — 축을 가로지르는 짧은 정밀 절단 (F9 실측 — 중점이 CEPH_SHIME_1/2) */
export const CEPH_SHIME_1_PATH: readonly CutPoint[] = [{ x: 0.535, y: 0.432 }, { x: 0.535, y: 0.709 }];
export const CEPH_SHIME_2_PATH: readonly CutPoint[] = [{ x: 0.441, y: 0.418 }, { x: 0.440, y: 0.733 }];
/**
 * 내장 분리 1/2 (F9 실측 — squid_spread 뷰) — 머리·다리 덩어리를 잡고 내장과 함께 뜯기 시작.
 * ⚠ 펼치기(구 ceph_mantle_spread)는 사용자 지시로 **스테이지에서 제거**(2026-08-11) —
 *   개복 완료 시 펼쳐진 화면으로 바로 넘어가고, 그 화면에서 이 경로로 내장을 분리한다.
 * 094차부터 2스테이지 분할(사용자 지시 — 연출 프레임 연결이 아니라 단계별 드래그):
 * 1/2 완료 = 뽑기 1(미러) 화면 / 2/2 완료 = 뽑기 2(미러) 화면 + 부산물 팝업.
 */
export const CEPH_VISCERA_PATH: readonly CutPoint[] = [
  { x: 0.045, y: 0.514 }, { x: 0.882, y: 0.507 },
];
/**
 * 내장 분리 2/2 — 뽑기 1(squid_viscera_lift1 — 미러) 화면에서 들린 덩어리를 잡아
 * 오른쪽으로 마저 뽑아낸다. ⚠ **근사 — F9 실측 대상** (사용자 좌표 미제공).
 */
export const CEPH_VISCERA_PATH_2: readonly CutPoint[] = [
  { x: 0.42, y: 0.45 }, { x: 0.90, y: 0.40 },
];
/**
 * 펜(연골) 뽑기 (F9 실측 — squid_pen 뷰) — 몸통 끝에서 잡아 머리 쪽으로 **당겨 빼내는** 동작.
 * 칼 절삭이 아니다 — 연출도 칼 글리프 없이 당김으로 표현한다 (사용자 지시 2026-08-11).
 */
export const CEPH_PEN_PATH: readonly CutPoint[] = [{ x: 0.929, y: 0.507 }, { x: 0.089, y: 0.524 }];
/**
 * 껍질 시작점 잡기 — 몸통 끝 가장자리를 들춘다 (박리 시작 전 준비 동작).
 * **F9 실측** (사용자 2026-08-13 — 좌 90° 회전 뷰(BoardRotation 270) **화면 좌표**로 측정.
 * detail 캡처 「껍질 벗기기 0」이 조준 링을 화면 우상단에 표시 → 로컬 = [1−v, u] 역변환으로 확정.
 * ⚠ 092차 1차 반영은 로컬로 오해석해 링이 화면 좌상에 갔다 — 093차 정정).
 * 이 스테이지는 **탭(클릭 1회)** — 경로 중점(`CEPH_SKIN_LIFT_TAP`)이 목표점이다.
 */
export const CEPH_SKIN_LIFT_PATH: readonly CutPoint[] = [
  { x: 0.784, y: 0.835 }, { x: 0.784, y: 0.814 }, { x: 0.778, y: 0.795 },
  { x: 0.770, y: 0.777 }, { x: 0.759, y: 0.760 }, { x: 0.744, y: 0.746 },
  { x: 0.737, y: 0.728 },
];
/** 껍질 들추기 탭 목표점 — 실측 경로의 중점 (회전 뷰 화면 우상단 (0.777, 0.230)에 표시된다) */
export const CEPH_SKIN_LIFT_TAP: CutPoint = { x: 0.770, y: 0.777 };
/**
 * 껍질 뜯기 ② — **마무리 당김 (회전 뷰에서 상→하)**.
 * 093차 재정의: 껍질 섹션 전체가 **회전 뷰(270) 유지** — 뜯기 ① 완료(4.1) 상태에서 좌측에
 * 늘어진 잔여 껍질을 잡아 **아래로** 끝까지 당긴다 (detail 캡처 4의 ↓ 화살표).
 * 화면 (0.25,0.40)→(0.28,0.85) 하강 경로의 로컬 역변환. ⚠ 근사 — F9 실측 대상.
 */
export const CEPH_PEEL_FINISH_SWEEP: readonly CutPoint[] = [
  { x: 0.60, y: 0.25 }, { x: 0.15, y: 0.28 },
];
/**
 * 날개 뜯기 ① — **껍질째 분리** (092차부터 스테이지 2개로 분할 — 날개 하나씩).
 * [0] = 1/2 (squid_finskin_on 뷰) / [1] = 2/2 (**좌우 미러 뷰** squid_finskin_on_m 기준 = [0]의 x 반전).
 * 실사(날개뜯기1)의 절단면 띠를 따라 아래→위로 뜯는다.
 * ⚠ **근사값 — F9 실측 대상**.
 */
export const CEPH_FINSKIN_PATHS: readonly (readonly CutPoint[])[] = [
  [{ x: 0.24, y: 0.82 }, { x: 0.36, y: 0.55 }, { x: 0.48, y: 0.30 }],   // 1/2 (원본 뷰)
  [{ x: 0.76, y: 0.82 }, { x: 0.64, y: 0.55 }, { x: 0.52, y: 0.30 }],   // 2/2 (미러 뷰 — [0]의 x 반전)
];
/**
 * 아가미 제거·내장면 닦기 영역 — 아가미(깃털 기관)가 붙은 중앙 좌측부
 * (092차 — 실측 스윕이 지나는 영역으로 갱신. 합성 스프라이트 squid_gill_on의 아가미 위치와 정합).
 */
export const CEPH_GILL_REGION: readonly CutPoint[] = [
  { x: 0.10, y: 0.26 }, { x: 0.74, y: 0.26 }, { x: 0.74, y: 0.78 }, { x: 0.10, y: 0.78 },
];
/**
 * 아가미 문지르기 스윕 — **F9 실측** (사용자 2026-08-13 — squid_clean 뷰 기준.
 * 합성 squid_gill_on은 같은 베이스라 좌표가 그대로 유효하다).
 */
export const CEPH_GILL_SWEEP: readonly CutPoint[] = [
  { x: 0.593, y: 0.335 }, { x: 0.340, y: 0.342 }, { x: 0.256, y: 0.480 },
  { x: 0.502, y: 0.514 }, { x: 0.663, y: 0.634 }, { x: 0.424, y: 0.692 },
  { x: 0.170, y: 0.692 },
];
/**
 * 날개살 분리 (094차부터 **날개 뜯기(껍질째)보다 먼저** — 사용자 순서 재정의 + F9 실측 2026-08-13).
 * [0] = 1/2 (squid_fin0 뷰 — 우→좌 수평) / [1] = 2/2 (squid_fin0_m 미러 뷰).
 */
export const CEPH_FIN_PATHS: readonly (readonly CutPoint[])[] = [
  [{ x: 0.822, y: 0.240 }, { x: 0.212, y: 0.247 }],   // 1/2 (실측)
  [{ x: 0.842, y: 0.647 }, { x: 0.185, y: 0.657 }],   // 2/2 (실측)
];
/** 머리부 3분할 — 2컷 (CEPH_PARTS 뷰 · **F9 실측** 사용자 2026-08-13) */
export const CEPH_HEAD_SPLIT_PATHS: readonly (readonly CutPoint[])[] = [
  [{ x: 0.771, y: 0.247 }, { x: 0.773, y: 0.905 }],   // 선1 (실측)
  [{ x: 0.510, y: 0.177 }, { x: 0.510, y: 0.979 }],   // 선2 (실측)
];

/** 속껍질 제거 경로 — 갑오징어 전용 */
export const CEPH_INNER_SKIN_PATH: readonly CutPoint[] = [{ x: 0.61, y: 0.15 }, { x: 0.89, y: 0.15 }];
/** 키친타월 쥐는 위치 */
export const CEPH_TOWEL_GRIP: CutPoint = { x: 0.22, y: 0.28 };

/**
 * 갑 윤곽 — `bone_lift` 판정·렌더용 8점 (gapo_guide.svg ⑤⑥ 실루엣 기준 근사).
 * 갑은 v 0.34~0.66까지 퍼지는 넓은 타원판이라, v 0.48~0.52의 가는 막대인 펜과 폭이 다르다.
 * ⚠ 시트 실측 반영 예정 — 현재는 스펙 서술(폭·진행 방향)에 맞춘 근사값.
 */
export const CEPH_BONE_OUTLINE: readonly CutPoint[] = [
  { x: 0.44, y: 0.50 }, { x: 0.50, y: 0.38 }, { x: 0.60, y: 0.34 }, { x: 0.72, y: 0.36 },
  { x: 0.82, y: 0.44 }, { x: 0.82, y: 0.56 }, { x: 0.68, y: 0.64 }, { x: 0.52, y: 0.60 },
];
/** 갑 들어내기 진행 방향 — 앞끝(둥근 쪽) → 뒤끝(각침). 반대로 끌면 즉시 파손 */
export const CEPH_BONE_LIFT_PATH: readonly CutPoint[] = [{ x: 0.50, y: 0.48 }, { x: 0.84, y: 0.50 }];

// ── 문어 전용 ────────────────────────────────────────
// 098차 — 실사 스프라이트(octo_* — KEEP_POLY 추출본)의 subjectRect 기준으로 재근사.
// 구 097차 값은 파라메트릭 렌더 기준이라 전부 폐기. ⚠ 여전히 근사 — 사용자 F9 실측 대상.
/** 외번 — 목(눈 부근) → 외투막 끝으로 밀어 넣는다 (098-b `octo_live` 기준 — 머리 돔이 왼쪽) */
export const OCTO_INVERT_PATH: readonly CutPoint[] = [{ x: 0.33, y: 0.28 }, { x: 0.06, y: 0.44 }];
/** 내장 잡기·뽑기 — 외번된 속면(사진 3)의 내장 덩어리 중심 → 우상단으로 당김 */
export const OCTO_VISCERA_GRIP: CutPoint = { x: 0.50, y: 0.42 };
export const OCTO_VISCERA_PATH: readonly CutPoint[] = [{ x: 0.50, y: 0.42 }, { x: 0.84, y: 0.16 }];
/** 악판 중심 — 사진 5의 검은 부리 위치 (radial space — OCTO_ORAL 뷰) */
export const OCTO_BEAK_CENTER: CutPoint = { x: 0.28, y: 0.42 };
export const OCTO_BEAK_PATH: readonly CutPoint[] = [{ x: 0.28, y: 0.42 }, { x: 0.10, y: 0.20 }];
/** 소금 도포 영역 — 몸 전체 (사진 8 — 소금 덮인 몸통) */
export const OCTO_SALT_REGION: readonly CutPoint[] = [
  { x: 0.03, y: 0.06 }, { x: 0.95, y: 0.06 }, { x: 0.95, y: 0.94 }, { x: 0.03, y: 0.94 },
];
/** 문지르기 영역 — 사진 9(움켜쥔 몸통 띠) 전체 */
export const OCTO_SCRUB_REGION: readonly CutPoint[] = [
  { x: 0.05, y: 0.04 }, { x: 0.95, y: 0.04 }, { x: 0.95, y: 0.95 }, { x: 0.05, y: 0.95 },
];
