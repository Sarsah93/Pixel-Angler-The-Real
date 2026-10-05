/**
 * @file DayLedger.ts
 * @description 하루 기록 · 결산 (211차 — 사용자 지시 「하루 결산 화면 — 낚시만이 아니라 인게임 모든 변화」).
 *
 * 한 장(page) = **한 번 잠들 때까지** 또는 **한국 시각 날짜가 바뀔 때까지** 있었던 일.
 *  - 침대에서 자면 그 장을 닫고 결산을 보여 준다(스타듀식 하루 끝).
 *  - 자지 않고 날짜가 넘어가면 자정에 장을 닫아 두고, 다음에 들어올 때 「지난 하루」로 보여 준다
 *    (실시간 시계 컨셉 유지 — 사용자 결정 2026-10-04).
 * 기록은 세이브에 들어간다(지난 장 14장까지).
 */

/** 돈이 들고 난 까닭 */
export type CoinReason =
  | 'sell'       // 직판장 · 상점 판매
  | 'auction'    // 위판 정산
  | 'quest'      // 의뢰 보상 · 선택 결과 · 품삯
  | 'trade'      // 다른 사람과 거래
  | 'shop'       // 상점 구매
  | 'license'    // 자격 · 허가 취득
  | 'upkeep'     // 정기 지출(갱신료 · 회비 …)
  | 'repair'     // 수리
  | 'travel'     // 차비
  | 'clinic'     // 보건소
  | 'fine'       // 벌금 · 과태료
  | 'fee'        // 어장 행사료
  | 'death'      // 쓰러졌을 때 잃은 돈
  | 'other';

/** 그날 잡은 고기 한 마리 */
export interface LedgerCatch {
  speciesId: string;
  nameKo: string;
  lengthCm: number;
  weightG: number;
  /** 'kept' 보관 · 'released' 놓아줌 · 'lawful' 금지체장 · 금어기라 놓아줌 */
  fate: 'kept' | 'released' | 'lawful';
}

/** 하루 한 장 */
export interface DayLedgerPage {
  /** 장 번호(세이브 안에서 1부터 늘어난다) */
  no: number;
  /** 연 날 · 닫은 날 — 한국 시각 'YYYYMMDD' */
  openedYmd: string;
  closedYmd?: string;
  openedAtMs: number;
  closedAtMs?: number;
  /** 어떻게 닫혔나 — 잠 · 자정 */
  closedBy?: 'sleep' | 'midnight';
  /** 이 장 동안 실제로 놀던 시간(ms) */
  playMs: number;
  coinsStart: number;
  coinsEnd: number;
  earned: Partial<Record<CoinReason, number>>;
  spent: Partial<Record<CoinReason, number>>;
  catches: LedgerCatch[];
  /** 놓친 것 — 줄터짐 · 탈출 · 바늘 빠짐 · 헛챔질 */
  lost: { lineBreak: number; escaped: number; hookOff: number; missed: number };
  /** 얻은 것 · 쓴 것(이름 → 수량) */
  gained: Record<string, number>;
  used: Record<string, number>;
  questsAccepted: string[];
  questsDone: string[];
  objectivesDone: number;
  /** 인물 id → 우호도 변화(합) */
  affinity: Record<string, number>;
  xp: number;
  levelUps: number;
  /** 오른 숙련 · 새 스킬 · 새 타이틀 · 새 도감 */
  profUps: string[];
  skills: string[];
  titles: string[];
  discoveries: { kind: string; name: string }[];
  /** 생활 — 요리 · 손질 · 회 · 제작 · 통발 · 채집 · 위판 낙찰 */
  life: { cook: number; butcher: number; sashimi: number; craft: number; trap: number; forage: number; auctionLots: number };
  /** 장비 고장 · 잃은 채비(문장) */
  gear: string[];
  /** 다닌 지역 id */
  regions: string[];
  /**
   * 214차 — 이 장을 연 때의 이야기 날짜(다 잔 잠 횟수 · 0부터). 일지 「나날」이 「이야기 N번째」로 보인다.
   * 실제 날짜(`openedYmd`)와 다르다 — 하루에 두 번 자면 이야기는 두 번 넘어간다. 구세이브 장은 없다.
   */
  storyDay?: number;
}

/** 결산 화면의 카드 한 장 */
export interface LedgerCard {
  key: 'money' | 'fishing' | 'story' | 'growth' | 'codex' | 'life' | 'bag' | 'gear' | 'places';
  titleKo: string;
  /** 큰 숫자 한 줄(없으면 생략) */
  headline?: string;
  lines: string[];
  /** 대표 어종(가장 큰 고기 그림) */
  fishSpeciesId?: string;
  /** 돈 카드 — 순이익 부호(색) */
  tone?: 'good' | 'bad' | 'neutral';
}

/**
 * 결산 끝의 「내일 할 만한 것」 한 줄(212차) — 다음 날 물때 · 날씨로 고르는 제안 갈래.
 *  - stormy       : 파도 · 비가 거세다 → 바다는 쉬고 손질 · 요리 · 정비
 *  - night_forage : 물살 센 날 밤 간조 → 해루질
 *  - spring_tide  : 사리 → 무거운 채비로 만조 앞뒤
 *  - neap_tide    : 조금 → 가벼운 찌 채비로 천천히
 *  - good_tide    : 알맞은 물 → 만조 앞뒤 두 시간
 */
export type NextDayPlanKind = 'stormy' | 'night_forage' | 'spring_tide' | 'neap_tide' | 'good_tide';

/** 제안을 고르는 데 쓰는 다음 날 바다 */
export interface NextDayInput {
  /** 조류 세기 0~1 (`TideInfo.currentStrength`) */
  currentStrength: number;
  /** 만조 시각 — KST 자정부터 분 */
  highTimesMin: number[];
  /** 간조 시각 — 그날 KST 자정부터 분(다음 날 새벽 간조는 1440 + 분) */
  lowTimesMin: number[];
  /** 예보 최고 파고 (m) — 없으면 모름 */
  waveMaxM?: number;
  /** 예보 최고 강수확률 (%) */
  popMaxPct?: number;
  /** 비 · 눈 · 소나기 예보 */
  wet?: boolean;
  /** 이 파고부터 갯바위 · 해루질이 막힌다(`TUNING.forage.maxWaveM`) */
  maxSafeWaveM: number;
}

/** 고른 제안 — 문장은 화면 쪽이 로케일별로 쓴다 */
export interface NextDayPlan {
  kind: NextDayPlanKind;
  /** 짚어 줄 시각(분) — 해루질 간조 · 만조 */
  atMin?: number;
}
