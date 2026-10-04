/**
 * @file TideFlow.ts
 * @description 물때 흐름 8단계 타입 (204차 — 사용자 지시 「들물·날물 구체화」).
 *
 * 하루 두 번 오르내리는 물을 낚시꾼이 부르는 말로 나눈다:
 *  - 들물(밀물): 초들물(간조 뒤 ~2시간) · 중들물(2~4시간) · 끝들물(4시간~만조 30분 전)
 *  - 날물(썰물): 초날물(만조 뒤 ~2시간) · 중날물(2~4시간) · 끝날물(4시간~간조 30분 전)
 *  - 물돌이(정조): 만조·간조 앞뒤 30분 — 물이 멈추거나 돈다
 *
 * ⚠ 기존 `TideInfo.tidePhase`(1~15물 — 음력 날짜의 사리·조금)와 다른 축이다.
 *   「몇 물」은 하루의 조류 세기, 「흐름 단계」는 지금 이 시각 물이 어디쯤 흐르는가.
 */

/** 물때 흐름 단계 */
export type TideFlowPhase =
  | 'flood_early' | 'flood_mid' | 'flood_late' | 'slack_high'
  | 'ebb_early' | 'ebb_mid' | 'ebb_late' | 'slack_low';

/** 물 방향 */
export type TideFlowDirection = 'flood' | 'ebb' | 'slack';

/** 지금 시각의 물때 흐름 */
export interface TideFlowState {
  phase: TideFlowPhase;
  direction: TideFlowDirection;
  /** 직전 만조/간조 이후 지난 분 */
  minutesSinceExtreme: number;
  /** 다음 만조/간조까지 남은 분 */
  minutesToNextExtreme: number;
  /** 다음 조위 극점 종류 */
  nextExtreme: 'high' | 'low';
  /** 이 단계가 끝나기까지 남은 분(다음 단계 예고용) */
  minutesToPhaseEnd: number;
  /** 다음 단계 */
  nextPhase: TideFlowPhase;
}

/** 단계별 낚시 성향 — 입질·대물·조류 */
export interface TideFlowProfile {
  /** 입질도 별(★ 0.5 단위, 표시·위키용) */
  stars: number;
  /** 입질 배율 기준값(사리 기준 — 조금이면 1에 가깝게 눌린다) */
  biteMult: number;
  /** 대물 가중 0~1 — 크기 등급을 위로 민다(물돌이·끝물) */
  sizeBias: number;
  /** 조류 세기 배율 — 채비가 흐르는 속도 */
  currentMult: number;
}

// ── 205차 — 어종 × 물때 · 장르 조건 (TIDE_PHASE_STRATEGY_SPEC P1~P3) ──

/** 단계별 배율 한 줄(누락 단계 = 1.0) */
export type TidePhaseRow = Partial<Record<TideFlowPhase, number>>;

/** 어종 묶음 하나의 물때 선호 — 같은 성향의 어종을 한 줄로 묶는다 */
export interface TidePhasePrefGroup {
  /** 묶음 키(위키·발견 기록용) */
  id: string;
  /** 묶음 이름(위키용 — 어종 이름 나열) */
  nameKo: string;
  nameEn: string;
  /** 속한 어종 id */
  members: string[];
  /** 단계별 입질 배율(사리 · 남해 기준 — 동해·조금이면 1에 가깝게 눌린다) */
  bite: TidePhaseRow;
  /** 단계별 대물 가중 0~1(없으면 공통 단계 가중만) */
  size?: TidePhaseRow;
  /** 잡아 본 뒤 남는 한 줄(1인칭 — 발견 기록 · 위키) */
  noteKo: string;
  noteEn: string;
  /** 근거 강도 — 위키 표기용 */
  evidence: 'research' | 'community' | 'folk';
}

/** 루어 종류별 물때 반응 묶음 */
export type TideLureGroup = 'swim' | 'egi' | 'tairaba' | 'soft' | 'other';

/** 원투 봉돌이 물살에 구르는지 판정 결과 */
export interface SurfSinkerTideResult {
  /** 입질 배율 */
  biteMult: number;
  /** 밑걸림 배율 */
  snagMult: number;
  /** 봉돌이 구르는 중 — 채비가 하류로 끌린다 */
  rolling: boolean;
}
