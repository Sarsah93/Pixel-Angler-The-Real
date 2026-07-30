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

/** 섹션 완료 시 발생하는 부산물 종류 (클라이언트 팝업/지급 레저가 소비) */
export type ButcherySectionYield =
  | 'head'        // 생선 머리 (어종군)
  | 'viscera'     // 생선 내장 (공통)
  | 'filletA'     // 껍질+갈빗대 붙은 필렛 (1면)
  | 'filletB'     // 껍질+갈빗대 붙은 필렛 (2면)
  | 'spine'       // 척추뼈 (어종군)
  | 'rib'         // 갈빗대뼈 ×2 (어종군)
  | 'pin'         // 생선 지아이뼈 (공통)
  | 'skin'        // 생선 껍질 (공통)
  | 'pureFillet'; // 순수 필렛 (완료)

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
      { id: 't_fa_belly', label: '배쪽 → 척추까지 (분리)', stageIds: ['fillet_0_sever'] },
    ],
    yields: ['filletA'],
  },
  {
    id: 'sec_fillet_b', label: '2면 뜨기 (자유 순서)', anyOrder: true,
    tasks: [
      { id: 't_fb_back', label: '등쪽 → 척추까지 + 척추 끊기', stageIds: ['fillet_1_score'] },
      { id: 't_fb_belly', label: '배쪽 → 척추까지 (분리)', stageIds: ['fillet_1_sever'] },
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
    yields: ['pin'],
    // 종료 불가 — 분리 직후 낱장 상태 에셋 없음 (사용자 순서도 10번)
  },
  {
    id: 'sec_peel', label: '박피 (껍질 벗기기)', anyOrder: false,
    tasks: [{ id: 't_peel', label: '껍질 분리', stageIds: ['peel'] }],
    yields: ['skin', 'pureFillet'],
  },
];

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
