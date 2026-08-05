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
/** 개복 절개 — 외투막 입구 → 몸통 끝 */
export const CEPH_SLIT_PATH: readonly CutPoint[] = [{ x: 0.39, y: 0.50 }, { x: 0.95, y: 0.50 }];
/** 시메 ① — 갑(몸통)–눈 사이 */
export const CEPH_SHIME_1: CutPoint = { x: 0.36, y: 0.50 };
/** 시메 ② — 눈–다리 사이 */
export const CEPH_SHIME_2: CutPoint = { x: 0.29, y: 0.50 };

// ── 종별 분리 — 시작점·방향이 실사에서 서로 다르다 ──
/** 껍질 잡는 지점 */
export const CEPH_SKIN_GRIP: Record<string, CutPoint> = {
  squid:          { x: 0.90, y: 0.44 },   // 몸통 끝 가장자리
  swordtip_squid: { x: 0.93, y: 0.46 },   // 몸통 꼭대기
  cuttlefish:     { x: 0.28, y: 0.16 },   // 개복부 모서리 (몸통 끝이 두껍고 각침이 남을 수 있다)
};

/** 껍질 당김 경로 */
export const CEPH_PEEL_PATH: Record<string, readonly CutPoint[]> = {
  // 무늬오징어·한치는 몸통 끝 → 머리 방향(우→좌)
  squid:          [{ x: 0.90, y: 0.44 }, { x: 0.66, y: 0.45 }, { x: 0.42, y: 0.46 }],
  // 한치는 머리쪽 부착부를 남기고 멈춘다 — 끝점이 그 부착부
  swordtip_squid: [{ x: 0.93, y: 0.46 }, { x: 0.61, y: 0.47 }, { x: 0.29, y: 0.55 }],
  // 갑오징어만 방향이 반대(좌→우) — 개복부 모서리에서 시작해 반대편으로 밀어낸다
  cuttlefish:     [{ x: 0.28, y: 0.16 }, { x: 0.58, y: 0.15 }, { x: 0.87, y: 0.15 }],
};

/**
 * 부리(입) 빼내기 — **오징어류 3종 공통** (사용자 지시 2026-08-05).
 * 다리 밑동이 모이는 중심에서 부리를 눌러 밀어 올린 뒤 통째로 뽑는다.
 * 문어의 `OCTO_BEAK_*`와 같은 동작이지만, 오징어는 머리부 분할 뷰(CEPH_PARTS)에서 수행한다.
 */
export const CEPH_BEAK_CENTER: CutPoint = { x: 0.22, y: 0.50 };
export const CEPH_BEAK_PATH: readonly CutPoint[] = [{ x: 0.22, y: 0.50 }, { x: 0.10, y: 0.38 }];

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
/** 외번 — 목(0.46) → 외투막 끝 */
export const OCTO_INVERT_PATH: readonly CutPoint[] = [{ x: 0.46, y: 0.50 }, { x: 0.93, y: 0.50 }];
export const OCTO_VISCERA_GRIP: CutPoint = { x: 0.70, y: 0.46 };
export const OCTO_VISCERA_PATH: readonly CutPoint[] = [{ x: 0.70, y: 0.46 }, { x: 0.92, y: 0.34 }];
/** 악판 중심 — radial space (OCTO_ORAL 뷰) */
export const OCTO_BEAK_CENTER: CutPoint = { x: 0.42, y: 0.50 };
export const OCTO_BEAK_PATH: readonly CutPoint[] = [{ x: 0.42, y: 0.50 }, { x: 0.16, y: 0.34 }];
/** 소금 도포 영역 — 몸 전체 */
export const OCTO_SALT_REGION: readonly CutPoint[] = [
  { x: 0.03, y: 0.06 }, { x: 0.95, y: 0.06 }, { x: 0.95, y: 0.94 }, { x: 0.03, y: 0.94 },
];
/** 문지르기 영역 — 다리·빨판 쪽 */
export const OCTO_SCRUB_REGION: readonly CutPoint[] = [
  { x: 0.03, y: 0.10 }, { x: 0.44, y: 0.10 }, { x: 0.44, y: 0.92 }, { x: 0.03, y: 0.92 },
];
