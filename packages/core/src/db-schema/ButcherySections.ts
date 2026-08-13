/**
 * @file ButcherySections.ts
 * @description 자유 손질 섹션/작업 정의 — 달성도 기반 회뜨기 (2026-07-30 자유 손질 개편)
 *
 * 손질은 선형 스테이지 강제가 아니라 **섹션 순서 + 섹션 내 작업 자유 순서**다:
 *  - 섹션은 반드시 순서대로 (머리를 따지 않고 내장 제거 불가 등 순서도 분기점).
 *  - anyOrder 섹션은 작업(머리/지느러미/비늘 등)을 아무 순서로 골라 진행 —
 *    전부 완료해야 다음 섹션 개방. 작업 선택 UI는 클라이언트(도마 우측 상단).
 *  - 부산물 발생 섹션 완료 시 팝업(보관/버리기) — exitAfter 섹션에서는 손질을
 *    거기서 마칠 수 있다 (필렛만 저장하고 종료 → 이후 필렛 재장착으로 이어서).
 *
 * 스테이지 id는 buildButcheryStages(round)와 1:1 — 섹션은 그 위의 항법 레이어다.
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { CephByproductId } from '../types/Butchery.js';

/** 섹션 완료 시 발생하는 부산물 종류 (클라이언트 팝업/지급 레저가 소비) */
export type ButcherySectionYield =
  | 'head'        // 생선 머리 (어종군)
  | 'viscera'     // 생선 내장 (공통)
  | 'filletA'     // 껍질+갈빗대 붙은 필렛 (1면)
  | 'filletB'     // 껍질+갈빗대 붙은 필렛 (2면)
  | 'spine'       // 척추뼈 (어종군)
  | 'rib'         // 갈빗대뼈 ×2 (어종군)
  | 'pin'         // 생선 지아이뼈 (공통)
  | 'skinFillet'  // 껍질이 붙어있는 순살 필렛 ×4 (지아이 분리 후 — 1·2면에서 각 2장)
  | 'skin'        // 생선 껍질 (공통)
  | 'pureFillet'  // 순수 필렛 (완료)
  // ── 넙치류 다섯장뜨기 전용 (2026-08-05) ──
  | 'flatFillet'      // 껍질+엔가와 붙은 필렛 1장 (포 뜨기 작업마다 1장 — 총 4장)
  | 'engawaSkin'      // 껍질이 붙어있는 엔가와 1장 (엔가와 분리 작업마다 — 총 4장)
  | 'flatSkinFillet'  // 엔가와 제거된 껍질 필렛 ×4 (엔가와 섹션 완료 — 기존 flatFillet 대체)
  /**
   * ── 두족류 (87차) ──
   * 어류는 부위 종류를 yield 키로 추상화했지만, 두족류는 부산물 테이블
   * (`CEPH_BYPRODUCTS`)이 이미 id 단위로 존재한다. 중간 매핑 층을 또 만들지 않고
   * **`CephByproductId`를 그대로 yield 키로 쓴다** — 값이 겹치지 않아 안전하다.
   */
  | CephByproductId;

/** 섹션 내 작업 1건 — 스테이지 id 목록을 순서대로 수행하면 작업 완료 */
export interface ButcheryTaskDef {
  id: string;
  label: string;
  stageIds: string[];
  /**
   * **작업 완료 시점**에 발생하는 부산물 (머리·내장처럼 그 작업만으로 물리적으로 분리되는 것).
   * 섹션 전체가 끝나야 나오는 것(필렛·척추뼈 등)은 ButcherySectionDef.yields에 둔다.
   */
  yields?: ButcherySectionYield[];
}

/** 손질 섹션 — 순서 강제 구간. anyOrder면 내부 작업은 자유 순서 */
export interface ButcherySectionDef {
  id: string;
  label: string;
  /** true = 작업을 플레이어가 선택 (자유 순서) / false = 순서대로 자동 진행 */
  anyOrder: boolean;
  tasks: ButcheryTaskDef[];
  /** 섹션 완료 시 발생 부산물 (팝업 대상) */
  yields?: ButcherySectionYield[];
  /** 이 섹션 완료 후 손질을 종료(체크포인트 정산)할 수 있는가 */
  exitAfter?: boolean;
}

/**
 * 원물(round) 자유 손질 섹션 트리 — 사용자 지정 순서도 (2026-07-30):
 *  1 시메·방혈 → 2 밑손질(머리/지느러미/비늘 자유) → 3 배따기·내장 → 4 핏줄 →
 *  5 세척 → 6 꼬리 칼집(앞/뒤) → 7 1면 뜨기(등/배 자유) → 8 2면 뜨기(등/배 자유)
 *  [→ 여기서 종료 가능 = 필렛 저장] → 9 갈빗대 → 10 지아이뼈 → 11 박피 (완료).
 */
export const WHOLE_FISH_SECTIONS: ButcherySectionDef[] = [
  {
    id: 'sec_ikejime', label: '시메·방혈', anyOrder: false,
    tasks: [
      { id: 't_ikejime', label: '시메 (즉살)', stageIds: ['ikejime'] },
      { id: 't_bleed', label: '방혈', stageIds: ['bleed_cut', 'bleed_ice'] },
    ],
  },
  {
    id: 'sec_prep', label: '밑손질 (자유 순서)', anyOrder: true,
    tasks: [
      // 머리는 '머리 제거' 작업이 끝나는 순간 물리적으로 분리된다 → 작업 단위 부산물
      { id: 't_head', label: '머리 제거', stageIds: ['head_base', 'head_flip'], yields: ['head'] },
      { id: 't_fins', label: '지느러미 제거', stageIds: ['finectomy'] },
      { id: 't_descale', label: '비늘치기', stageIds: ['scale_base', 'scale_flip', 'scale_wash'] },
    ],
  },
  {
    id: 'sec_gut', label: '배따기·내장 제거', anyOrder: false,
    tasks: [
      { id: 't_gut', label: '개복 → 내장 꺼내기', stageIds: ['gut_open', 'gut_scoop'], yields: ['viscera'] },
    ],
  },
  {
    id: 'sec_vessel', label: '핏줄 긁기', anyOrder: false,
    tasks: [{ id: 't_vessel', label: '척추 아래 혈관 긁기', stageIds: ['vessel_scrub'] }],
  },
  {
    id: 'sec_wash', label: '세척', anyOrder: false,
    tasks: [{ id: 't_wash', label: '내장 자리 세척', stageIds: ['gut_wash'] }],
  },
  {
    id: 'sec_tail', label: '꼬리 칼집 (앞/뒤)', anyOrder: true,
    tasks: [
      { id: 't_tail_a', label: '꼬리 칼집 (앞면)', stageIds: ['tail_grip'] },
      { id: 't_tail_b', label: '꼬리 칼집 (뒷면)', stageIds: ['tail_grip_b'] },
    ],
  },
  {
    id: 'sec_fillet_a', label: '1면 뜨기 (자유 순서)', anyOrder: true,
    tasks: [
      { id: 't_fa_back', label: '등쪽 → 척추까지', stageIds: ['fillet_0_score'] },
      { id: 't_fa_belly', label: '배쪽 → 척추 + 갈비뼈 끊어 분리', stageIds: ['fillet_0_sever', 'fillet_0_ribsever'] },
    ],
    yields: ['filletA'],
  },
  {
    id: 'sec_fillet_b', label: '2면 뜨기 (자유 순서)', anyOrder: true,
    tasks: [
      // 3단계 — 척추까지 칼집 1·2회차 → 머리쪽 갈비뼈·척추 연결부 끊기 (사용자 지시 2026-07-31)
      { id: 't_fb_back', label: '등쪽 → 척추까지 + 갈비뼈 끊기', stageIds: ['fillet_1_score', 'fillet_1_score2', 'fillet_1_ribcut'] },
      // 등쪽과 같은 구조 — 2회 긋기 + 배쪽 갈비뼈·척추 연결부 끊기 (사용자 지시 2026-07-31)
      { id: 't_fb_belly', label: '꼬리쪽 → 배쪽 분리', stageIds: ['fillet_1_sever', 'fillet_1_bellyribcut'] },
    ],
    yields: ['filletB', 'spine'],
    exitAfter: true,   // ← 필렛(껍질+갈빗대)만 저장하고 손질 종료 가능
  },
  {
    id: 'sec_rib', label: '갈빗대 제거 (자유 순서)', anyOrder: true,
    tasks: [
      { id: 't_rib_a', label: '필렛 A 갈빗대', stageIds: ['rib_a'] },
      { id: 't_rib_b', label: '필렛 B 갈빗대', stageIds: ['rib_b'] },
    ],
    yields: ['rib'],
    exitAfter: true,   // ← 지아이뼈·껍질 붙은 필렛 상태로 종료 가능
  },
  {
    id: 'sec_pin', label: '지아이뼈 분리', anyOrder: true,
    tasks: [
      { id: 't_pin_a', label: '필렛 A 지아이 라인 ×2', stageIds: ['pin_a'] },
      { id: 't_pin_b', label: '필렛 B 지아이 라인 ×2', stageIds: ['pin_b'] },
    ],
    // 지아이 분리 결과 = 지아이뼈 2개 + **껍질 붙은 순살 필렛 4장**(1·2면에서 각 2장)
    yields: ['pin', 'skinFillet'],
    exitAfter: true,   // ← 껍질 붙은 필렛 4장 상태로 종료 가능 (박피는 재장착으로 이어서)
  },
  {
    // 박피 = **필렛 1장** 처리 → 생선 껍질 + 순수 필렛 1개 (사용자 지시 2026-07-31).
    //  ① 꼬리 손잡이 칼집 ② 껍질 분리(경계 칼 넣기 → 잡고 좌측 지그재그 당기기)
    id: 'sec_peel', label: '박피 (껍질 벗기기)', anyOrder: false,
    tasks: [
      { id: 't_peel_grip', label: '꼬리 손잡이 만들기', stageIds: ['peel_grip'] },
      { id: 't_peel_skin', label: '껍질 분리', stageIds: ['peel_insert', 'peel_pull'] },
    ],
    yields: ['skin', 'pureFillet'],
  },
];

/**
 * 넙치류(광어·도다리) **다섯장뜨기** 섹션 트리 (사용자 순서도 2026-08-05 · 공정 재정의 2026-08-06):
 *  1 시메·방혈 → 2 밑손질(머리 S자 절단/비늘 자유 — 지느러미 제거 없음) → 3 꼬리 칼집(앞/뒤) →
 *  4 배쪽(흰 면) 뜨기: 중앙선 → 위(내장 위치) 포 3단계 → 아래 포 3단계 (2장) [종료 가능] →
 *  5 등쪽 뜨기: 동일 (2장 + 중골) [종료 가능] → 6 엔가와 4장 분리 [종료 가능] → 7 박피 (완료).
 *  필렛 4장 + 중골 = 5장. 척추뼈 끊기 작업 없음 (중앙 척추 기준 4면을 각각 뜬다).
 *  **내장은 머리 S자 절단 시 머리와 함께 딸려 나온다** (사용자 지시 2026-08-06) —
 *  별도 내장 제거 작업 없음, viscera는 머리 작업 yields로 지급.
 */
export const FLAT_FISH_SECTIONS: ButcherySectionDef[] = [
  {
    id: 'sec_ikejime', label: '시메·방혈', anyOrder: false,
    tasks: [
      { id: 't_ikejime', label: '시메 (즉살)', stageIds: ['ikejime'] },
      { id: 't_bleed', label: '방혈', stageIds: ['bleed_cut', 'bleed_ice'] },
    ],
  },
  {
    id: 'sec_prep', label: '밑손질 (자유 순서)', anyOrder: true,
    tasks: [
      // 넙치류는 머리와 내장이 한 덩어리로 딸려 나온다 — viscera를 머리 작업에서 함께 지급
      { id: 't_head', label: '머리 S자 절단 (내장 동반)', stageIds: ['flat_head_scut'], yields: ['head', 'viscera'] },
      { id: 't_descale', label: '비늘치기', stageIds: ['scale_base', 'scale_flip', 'scale_wash'] },
    ],
  },
  {
    id: 'sec_tail', label: '꼬리 칼집 (앞/뒤)', anyOrder: true,
    tasks: [
      { id: 't_tail_a', label: '꼬리 칼집 (등면)', stageIds: ['tail_grip'] },
      { id: 't_tail_b', label: '꼬리 칼집 (배면)', stageIds: ['tail_grip_b'] },
    ],
  },
  {
    id: 'sec_flat_belly', label: '배쪽 뜨기 (흰 면 — 2장)', anyOrder: false,
    tasks: [
      { id: 't_flb_center', label: '중앙선 칼집', stageIds: ['flat_belly_center'] },
      {
        id: 't_flb_upper', label: '위쪽(내장 위치) 포 뜨기',
        stageIds: ['flat_belly_up_score', 'flat_belly_up_sep1', 'flat_belly_up_sep2'], yields: ['flatFillet'],
      },
      {
        id: 't_flb_lower', label: '아래쪽 포 뜨기',
        stageIds: ['flat_belly_dn_score', 'flat_belly_dn_sep1', 'flat_belly_dn_sep2'], yields: ['flatFillet'],
      },
    ],
    exitAfter: true,   // ← 배쪽 필렛 2장 저장하고 종료 가능
  },
  {
    id: 'sec_flat_back', label: '등쪽 뜨기 (2장)', anyOrder: false,
    tasks: [
      { id: 't_flk_center', label: '중앙선 칼집', stageIds: ['flat_back_center'] },
      {
        id: 't_flk_upper', label: '위쪽 포 뜨기',
        stageIds: ['flat_back_up_score', 'flat_back_up_sep1', 'flat_back_up_sep2'], yields: ['flatFillet'],
      },
      {
        id: 't_flk_lower', label: '아래쪽 포 뜨기',
        stageIds: ['flat_back_dn_score', 'flat_back_dn_sep1', 'flat_back_dn_sep2'], yields: ['flatFillet'],
      },
    ],
    yields: ['spine'],   // 4장을 다 뜨면 중골(뼈 프레임)이 남는다 — 다섯장뜨기의 5번째 장
    exitAfter: true,
  },
  {
    id: 'sec_engawa', label: '엔가와 분리 (자유 순서)', anyOrder: true,
    tasks: [
      { id: 't_engawa_1', label: '필렛 1 엔가와', stageIds: ['engawa_1'], yields: ['engawaSkin'] },
      { id: 't_engawa_2', label: '필렛 2 엔가와', stageIds: ['engawa_2'], yields: ['engawaSkin'] },
      { id: 't_engawa_3', label: '필렛 3 엔가와', stageIds: ['engawa_3'], yields: ['engawaSkin'] },
      { id: 't_engawa_4', label: '필렛 4 엔가와', stageIds: ['engawa_4'], yields: ['engawaSkin'] },
    ],
    // 엔가와가 다 분리되면 기존 필렛(엔가와 붙음)을 **엔가와 제거된 껍질 필렛**으로 대체 지급
    yields: ['flatSkinFillet'],
    exitAfter: true,
  },
  {
    id: 'sec_peel', label: '박피 (껍질 벗기기)', anyOrder: false,
    tasks: [
      { id: 't_peel_grip', label: '꼬리 손잡이 만들기', stageIds: ['peel_grip'] },
      { id: 't_peel_skin', label: '껍질 분리', stageIds: ['peel_insert', 'peel_pull'] },
    ],
    yields: ['skin', 'pureFillet'],
  },
];

/**
 * 무늬오징어 섹션 트리 (CEPHALOPOD_BUTCHERY_SPEC §0.5.4 — 87차).
 *
 * 구조 규약이 어류와 다르다:
 *  - **스테이지 1개 = 작업 1개** (v3 스테이지별 부산물이 `ButcheryTaskDef.yields`로 그대로 산다)
 *  - **전 섹션 `anyOrder: false`** — 두족류 공정은 순서가 고정이다
 *  - 섹션 경계 = v3의 `result` 스테이지(= 구간 종료 지점)
 *  - `exitAfter`는 **몸통 순살이 확정되는 섹션 이후**에만 (오징어류 = 껍질 완료)
 *
 * 몸통 순살(`ceph_mantle_fillet`)은 어느 스테이지도 내놓지 않는다 — "다 떼고 남은 것"이라
 * 트리 완주 시점에 자동 산출한다 (§4.5).
 */
export const SQUID_SECTIONS: ButcherySectionDef[] = [
  {
    id: 'sec_ceph_shime', label: '시메 (신경 차단)', anyOrder: false,
    tasks: [
      { id: 't_ceph_shime_1', label: '시메 ① 갑–눈 사이', stageIds: ['ceph_shime_mantle'] },
      { id: 't_ceph_shime_2', label: '시메 ② 눈–다리 사이', stageIds: ['ceph_shime_arms'] },
    ],
  },
  {
    id: 'sec_ceph_open', label: '개복 · 내장 분리', anyOrder: false,
    tasks: [
      { id: 't_ceph_open', label: '몸통 절개', stageIds: ['ceph_mantle_open'] },
      // 펼치기·분리 결과 확인은 사용자 지시로 제거(2026-08-11) — 개복 완료 화면이 곧 펼쳐진
      // 화면이고, 결과는 머리+다리 덩어리 **부산물 팝업**(전용 실사 아이콘)이 보여준다.
      // 094차: 내장 분리 = 드래그 2회 분할 (뽑기 1 → 뽑기 2 미러 — 프레임 연결이 아니라 단계)
      { id: 't_ceph_viscera_1', label: '내장 분리 1/2', stageIds: ['ceph_viscera_pull_1'] },
      { id: 't_ceph_viscera_2', label: '내장 분리 2/2', stageIds: ['ceph_viscera_pull_2'], yields: ['ceph_head_mass'] },
    ],
  },
  {
    id: 'sec_ceph_pen', label: '연골 제거', anyOrder: false,
    tasks: [
      { id: 't_ceph_pen', label: '오징어뼈(연골) 빼기', stageIds: ['ceph_pen_out'], yields: ['ceph_pen'] },
    ],
  },
  {
    id: 'sec_ceph_skin', label: '껍질 벗기기', anyOrder: false,
    tasks: [
      { id: 't_ceph_flip_skin', label: '뒤집어 껍질 잡기', stageIds: ['ceph_flip_skin'] },
      // 095차: 가로 뜯기 = 4단계 분할 (조금씩 당길 때마다 다음 사진 — 사용자 지시)
      { id: 't_ceph_peel_1', label: '껍질 뜯기(가로) 1/4', stageIds: ['ceph_skin_peel_1'] },
      { id: 't_ceph_peel_2', label: '껍질 뜯기(가로) 2/4', stageIds: ['ceph_skin_peel_2'] },
      { id: 't_ceph_peel_3', label: '껍질 뜯기(가로) 3/4', stageIds: ['ceph_skin_peel_3'] },
      { id: 't_ceph_peel_4', label: '껍질 뜯기(가로) 4/4', stageIds: ['ceph_skin_peel_4'] },
      { id: 't_ceph_peel_finish', label: '껍질 뜯기 ② (아래로)', stageIds: ['ceph_skin_finish'] },
      // 껍질은 097차부터 부산물 미지급 (사용자 지시)
      { id: 't_ceph_skin_done', label: '껍질 분리 완료', stageIds: ['ceph_skin_done'] },
    ],
    // 여기까지 하면 몸통 순살이 확정된다 — 이후 이탈은 정산(§0.5.4)
    exitAfter: true,
  },
  {
    id: 'sec_ceph_trim', label: '날개 · 아가미 정리', anyOrder: false,
    tasks: [
      // 날개별 2스테이지 분할(2026-08-13) + **094차 순서 재정의**(사용자):
      // **날개살 분리 1/2·2/2 → 껍질째 뜯기 1/2·2/2** (2/2는 좌우 반전 뷰).
      // 아가미·닦기(완료본 실사)는 맨 뒤 — 날개 앞에 두면 완료본 다음에 날개가 다시 나타난다.
      { id: 't_ceph_fin_1', label: '날개살 분리 1/2', stageIds: ['ceph_fin_off_1'] },
      // 날개살 부산물(2장 스택)은 양쪽을 다 분리한 시점에 일괄 지급
      { id: 't_ceph_fin_2', label: '날개살 분리 2/2', stageIds: ['ceph_fin_off_2'], yields: ['ceph_fin_meat'] },
      { id: 't_ceph_finskin_1', label: '날개 뜯기(껍질째) 1/2', stageIds: ['ceph_finskin_off_1'] },
      { id: 't_ceph_finskin_2', label: '날개 뜯기(껍질째) 2/2', stageIds: ['ceph_finskin_off_2'] },
      // 아가미는 097차부터 부산물 미지급 (사용자 지시)
      { id: 't_ceph_gill', label: '아가미 제거 · 내장면 닦기', stageIds: ['ceph_gill_wash'] },
    ],
    exitAfter: true,
  },
  {
    id: 'sec_ceph_head', label: '머리부 분할', anyOrder: false,
    tasks: [
      {
        id: 't_ceph_head_split', label: '머리부 3분할', stageIds: ['ceph_head_split'],
        yields: ['ceph_arms', 'ceph_head', 'ceph_ink_sac'],
      },
      { id: 't_ceph_beak', label: '부리 빼내기', stageIds: ['ceph_beak_out'], yields: ['ceph_beak'] },
    ],
    // 완주 산출물 — 몸통 순살은 "다 떼고 남은 것"이라 여기서 확정한다 (§4.5)
    yields: ['ceph_mantle_fillet'],
  },
];

/**
 * 참문어 섹션 트리 (097차 — 칼을 쓰지 않는 유일한 트리: 외번·내장·소금·문지르기·세척·악판).
 * §0.5.4 규약 동일: 스테이지 1개 = 작업 1개 · 전부 순서 강제.
 */
export const OCTOPUS_SECTIONS: ButcherySectionDef[] = [
  {
    id: 'sec_octo_invert', label: '외번 · 내장 분리', anyOrder: false,
    tasks: [
      { id: 't_octo_invert', label: '머리 뒤집기(외번)', stageIds: ['octo_invert'] },
      { id: 't_octo_viscera', label: '내장 떼어내기', stageIds: ['octo_viscera_pull'], yields: ['octo_viscera', 'octo_ink_sac'] },
      { id: 't_octo_revert', label: '머리 되돌리기', stageIds: ['octo_revert'] },
    ],
  },
  {
    id: 'sec_octo_clean', label: '소금 치대기 · 세척', anyOrder: false,
    tasks: [
      { id: 't_octo_salt', label: '굵은소금 치대기', stageIds: ['octo_salt'] },
      { id: 't_octo_scrub', label: '거품 · 점액 문지르기', stageIds: ['octo_scrub'] },
      { id: 't_octo_wash', label: '흐르는 물 세척', stageIds: ['octo_wash'] },
    ],
    exitAfter: true,
  },
  {
    id: 'sec_octo_beak', label: '악판(입) 제거 · 완료', anyOrder: false,
    tasks: [
      { id: 't_octo_beak', label: '악판 뽑아내기', stageIds: ['octo_beak_out'], yields: ['octo_beak'] },
      // 완주 산출물 — 문어 통마리 순살 (숙회·슬라이싱 입력)
      { id: 't_octo_done', label: '손질 완료', stageIds: ['octo_done'], yields: ['octo_whole'] },
    ],
  },
];

/** 두족류 섹션 트리 — 미구현 종은 undefined (게이트가 준비 중 안내를 유지한다) */
export function sectionsForCephalopod(speciesId: string): ButcherySectionDef[] | undefined {
  switch (speciesId) {
    // 한치 = 무늬오징어와 같은 공정 공유 (097차 — 부산물·회뜨기 규칙 공통)
    case 'squid': case 'swordtip_squid': return SQUID_SECTIONS;
    case 'octopus': case 'giant_octopus': return OCTOPUS_SECTIONS;
    default: return undefined;
  }
}

/**
 * 어종 → 섹션 트리 선택. 두족류 우선, 그다음 체형(넙치/원형어).
 * ⚠ `bodyShape`만 보던 구 `sectionsForBodyShape`는 두족류를 어류 트리로 흘린다 — 신규 호출은 이쪽을 쓸 것.
 */
export function sectionsForSpecies(speciesId: string, bodyShape: 'round' | 'flat'): ButcherySectionDef[] {
  return sectionsForCephalopod(speciesId) ?? sectionsForBodyShape(bodyShape);
}

/** 프로필 체형 → 섹션 트리 선택 (어류 전용) */
export function sectionsForBodyShape(bodyShape: 'round' | 'flat'): ButcherySectionDef[] {
  return bodyShape === 'flat' ? FLAT_FISH_SECTIONS : WHOLE_FISH_SECTIONS;
}

/** 스테이지 id → 소속 작업/섹션 조회 (클라 컨트롤러 유틸) */
export function findTaskOfStage(
  sections: ButcherySectionDef[], stageId: string,
): { section: ButcherySectionDef; task: ButcheryTaskDef } | null {
  for (const sec of sections) {
    for (const t of sec.tasks) {
      if (t.stageIds.includes(stageId)) return { section: sec, task: t };
    }
  }
  return null;
}
