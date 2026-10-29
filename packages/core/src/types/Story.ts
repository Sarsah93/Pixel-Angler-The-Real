/**
 * @file Story.ts
 * @description 스토리·퀘스트 계약 타입 (134차 — `docs/archive/specs/STORY_SPEC_v3.md` §3-2·§14-4 정합판)
 *
 * 메인 「조행록(釣行錄)」 7챕터 65퀘 + NPC 17아크 55퀘를 한 스키마로 표현한다.
 * - 퀘스트 정의는 `db-schema/StoryQuestDatabase.ts`, 조행록 17장은 `db-schema/JournalPages.ts`,
 *   NPC 아크는 `db-schema/StoryArcs.ts`. 이 파일은 **타입과 상수만** 갖는다(Phaser/DOM 금지).
 * - 진행 상태(수락/진행/완료)는 client `GameState`가 갖고, 판정은 순수 함수로 여기 둔다.
 *
 * ⚖ 결정(§0.5): 스펙의 `QuestDef`를 그대로 쓰되 **목표에 `manual` 플래그**를 둔다 —
 *   아직 자동 추적기가 없는 목표(NPC 대화·무상 납품·자리 지키기·배 출조 …)는 대화 패널의
 *   [완료]로 닫는다. 추적기가 생기면 플래그만 빼면 된다.
 */

import type { SkillCategoryId } from './Skills.js';

// ─────────────────────────────────────────────
// 어획 출처 · 법 규칙 (§3-2)
// ─────────────────────────────────────────────

/** 어획 경로 — 판매 가능 여부의 1차 결정자 */
export type CatchMethod =
  | 'rod'        // 낚싯대·릴 (LAW_SELL_ROD 대상)
  | 'handline'   // 외줄낚시·손줄
  | 'trap'       // 가리·외통발
  | 'net'        // 투망·반두·쪽대
  | 'gather'     // 집게·갈고리·호미·손 (해루질 포함)
  | 'commercial' // 어업인 자격으로 행한 조업
  | 'bought'     // 상점·경매 구매
  | 'gift';      // 무상 수령

/**
 * 어획 장소 종류 (149차) — 목표의 "○○에서 낚기" 조건을 실제로 강제하는 축.
 * 어획 경로(`CatchMethod`)와 **직교**한다: 같은 낚싯대라도 어디에 서 있었는지는 별개다.
 *  - `breakwater` — 방파제(상판·피복·사석 전부). `hole`도 여기에 포함된다.
 *  - `hole`       — 테트라포드·사석 틈 구멍치기 (방파제의 부분집합)
 *  - `shore`      — 갯바위·해변·안벽 등 뭍
 *  - `boat`       — 배 위
 */
export type StorySpotKind = 'breakwater' | 'hole' | 'shore' | 'boat';

/** `spotKind` 목표 조건 충족 판정 — 구멍치기는 방파제 조건도 함께 만족한다 */
export function spotKindSatisfies(required: StorySpotKind, actual: StorySpotKind | undefined): boolean {
  if (!actual) return false;
  if (required === actual) return true;
  return required === 'breakwater' && actual === 'hole';
}

export const SPOT_KIND_LABEL: Record<StorySpotKind, { ko: string; en: string }> = {
  breakwater: { ko: '방파제', en: 'breakwater' },
  hole: { ko: '구멍치기', en: 'hole fishing' },
  shore: { ko: '뭍(갯바위·해변)', en: 'shore' },
  boat: { ko: '배 위', en: 'boat' },
};

/** 스토리 자격 사다리에서 쓰는 면허 id — `LicenseType`의 부분집합 */
export type StoryLicenseId =
  | 'reported_fishery'   // 신고어업(맨손어업)
  | 'coop_member'        // 어촌계원
  | 'boat_operator'      // 소형선박조종사 (기존 면허 재사용)
  | 'angling_boat_biz'   // 낚시어선업 신고
  | 'marine_tourism';    // 해양관광업 등록

export type LegalFlag =
  | 'undersize'          // LAW_SIZE_SEASON — 금지체장 미만
  | 'closed_season'      // LAW_SIZE_SEASON — 금어기
  | 'restricted_gear'    // LAW_NONFISHER_GEAR — 비어업인 미허용 어구
  | 'village_fishery';   // LAW_VILLAGE_FISHERY — 마을어업권 대상종 무단 채취

export interface CatchProvenance {
  method: CatchMethod;
  caughtByPlayer: boolean;
  regionId: string;
  /** 게임 내 일차(스토리 날짜) — 0 = 미기록 */
  gameDayCaught: number;
  lengthCm?: number;
  /** 랜딩 시점에 확정. 이후 불변 */
  legalFlags: LegalFlag[];
}

export type FisheryLawRuleId =
  | 'LAW_SELL_ROD'
  | 'LAW_NONFISHER_GEAR'
  | 'LAW_ILLEGAL_CATCH'
  | 'LAW_SIZE_SEASON'
  | 'LAW_VILLAGE_FISHERY';

export interface LawVerdict {
  allowed: boolean;
  ruleId?: FisheryLawRuleId;
  /** UI 툴팁에 그대로 노출 */
  reasonKo: string;
  reasonEn: string;
  /** 합법 대안 (원칙 §1-2·§13-7: 거부 시 항상 1개 이상) */
  alternatives: string[];
  alternativesEn: string[];
}

// ─────────────────────────────────────────────
// 계절 · 챕터
// ─────────────────────────────────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 월(1~12) → 계절. 12·1·2 겨울 / 3~5 봄 / 6~8 여름 / 9~11 가을 */
export function seasonOfMonth(month: number): Season {
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

export const SEASON_LABEL: Record<Season, { ko: string; en: string }> = {
  spring: { ko: '봄', en: 'Spring' },
  summer: { ko: '여름', en: 'Summer' },
  autumn: { ko: '가을', en: 'Autumn' },
  winter: { ko: '겨울', en: 'Winter' },
};

export type StoryPart = 1 | 2 | 3 | 4 | 5;
export type StoryChapter = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface StoryChapterDef {
  chapter: StoryChapter;
  part: StoryPart;
  partTitleKo: string;
  partTitleEn: string;
  titleKo: string;
  titleEn: string;
  /** 레벨 밴드 (진입~종료) */
  levelBand: [number, number];
  /** 이 챕터가 여는 지역 (WorldMap `RegionDef.id`) */
  regionIds: string[];
  /** 중심 질문 — 일지 챕터 헤더에 그대로 */
  questionKo: string;
  questionEn: string;
  /** 기한이 걸린 자격 — 자격 사다리(§6) */
  qualification?: QualificationStep;
  /** §8-1 수치 계약 — 메인/서브 퀘 수와 XP 합계 (무결성 검사 기준) */
  contract: { mainCount: number; mainXp: number; subCount: number; subXp: number };
}

/** 자격 사다리 한 칸 (§6) */
export interface QualificationStep {
  chapter: StoryChapter;
  /** 이 챕터에서 얻는 자격 라벨 */
  labelKo: string;
  labelEn: string;
  /** 취득해야 하는 면허 id (0개 = 자격이 아니라 인수) */
  licenseIds: StoryLicenseId[];
  /** 기한 표기 */
  deadlineKo: string;
  deadlineEn: string;
  /** 초과 시 (실패 없음 — 비용·한 시즌 지연) */
  onMissKo: string;
  onMissEn: string;
  /** 여는 것 */
  unlocksKo: string;
  unlocksEn: string;
}

// ─────────────────────────────────────────────
// 퀘스트 (§14-4)
// ─────────────────────────────────────────────

export type StoryQuestKind = 'main' | 'sub';

/**
 * 목표 종류. **자동 추적기 보유 여부**는 `StoryObjective.manual`이 결정한다 —
 * 종류 자체는 서사 의미(일지 표기)이고, 추적은 client 훅이 같은 종류를 emit 할 때만 된다.
 */
export type StoryObjectiveKind =
  | 'catch'          // 어획 (speciesId·minCm·season·method·selfCaught)
  | 'release'        // 준법 방생 / 계측 후 방류
  | 'deliverFree'    // 무상 납품 (§3 준수 — 유상 아님)
  | 'sell'           // 위판·판매 (통발/맨손 어획물)
  | 'craft'          // 제작 (itemId 또는 아무 도면)
  | 'cook'           // 요리
  | 'butcher'        // 원물 손질
  | 'sashimi'        // 회뜨기
  | 'license'        // 면허 취득
  | 'gather'         // 해루질 채집
  | 'trap'           // 통발 수거
  | 'talk'           // NPC 대화
  | 'visit'          // 지역/장소 도착
  | 'holdPosition'   // 일몰까지 자리 지키기 (N12-1 — 조과 0 허용)
  | 'boatTrip'       // 배 출조 완주
  | 'survive'        // 생존 이벤트 통과 (밀물 고립·해무·오한)
  | 'communityWork'  // 공동작업 참여
  | 'cull'           // 과증식 생물 수거 (138차 — 해파리·불가사리)
  | 'farm'           // 농사 (235차 — 텃밭 심기 이벤트로 진행 · 237차 `farmAction: 'harvest'`면 거두기)
  | 'mine'           // 광질 (138차 — manual)
  | 'furnish'        // 가구 배치·리빙 (138차 — manual)
  | 'reachLevel'     // 레벨 도달
  | 'earn'           // 재화 누적
  | 'collect'        // 233차 — 개인 전용 퀘스트 아이템 모으기(확률 드롭 · 귀속 · 그 사람에게만)
  | 'custom';        // 그 외 (라벨로만 설명)

/**
 * 실제 행동으로 닫혀야 하는 기존 custom 목표의 식별자.
 * 목표 라벨을 파싱해 행동을 추측하지 않고, 각 시스템이 명시적으로 이벤트를 발행한다.
 */
export type StoryActionKey =
  | 'cooler_ice_review'
  | 'quality_course'
  | 'legal_route_choice'
  | 'stall_display_rebuild'
  | 'vessel_exam'
  | 'oral_history'
  | 'vessel_safety_inspection'
  | 'marine_tourism_registration'
  | 'stall_operation_day'
  | 'long_voyage_plan'
  | 'tray_delivery'
  | 'rig_tying'
  | 'bamboo_selection'
  | 'auction_price_review'
  | 'food_container_delivery'
  | 'oral_history_entry'
  | 'second_tray_delivery'
  | 'hull_inspection'
  | 'reconcile_okseon_tak'
  | 'sort_arguments'
  | 'stove_repair'
  | 'label_violation_review'
  | 'hospital_assistance'
  | 'distribution_route_explain'
  | 'reopening_preparation'
  | 'codex_species_review'
  | 'video_frame_selection';

export interface StoryObjective {
  kind: StoryObjectiveKind;
  labelKo: string;
  labelEn: string;
  /** 목표 수량 (기본 1) */
  target?: number;
  /** catch/release 전용 */
  speciesId?: string;
  minCm?: number;
  season?: Season[];
  method?: CatchMethod;
  /** 자가어획 필수 — 구매/선물로 대체 불가 (§3-4) */
  selfCaught?: boolean;
  /**
   * 233차 — **직접 마련한 것만** 인정한다(까다로운 퀘스트). 거래로 받은 것(계보 포함 — 그 원물로 뜬 필렛 · 회 ·
   * 요리)으로 한 손질 · 회뜨기 · 요리 · 위판은 이 목표를 채우지 않는다. 표시가 없는 목표는 거래품도 인정한다.
   */
  ownOnly?: boolean;
  /**
   * catch 전용 장소 조건 (149차) — "방파제에서 낚기" 같은 라벨을 **실제로 강제**한다.
   * 구멍치기(`hole`)는 `breakwater` 조건도 함께 만족한다(`spotKindSatisfies`).
   */
  spotKind?: StorySpotKind;
  /** talk/deliverFree 전용 — StoryArc npc id */
  npcId?: string;
  /** craft/deliverFree/cook 전용 · 233차 collect = 모을 퀘스트 아이템 id(`QUEST_ITEMS`) */
  itemId?: string;
  /** license 전용 */
  licenseId?: string;
  /** 237차 — farm 전용: 무엇을 세나(기본 `plant` = 심기 · `harvest` = 거두기 — 본 수확 · 중간 수확 모두) */
  farmAction?: 'plant' | 'harvest' | 'care';   // 238차 — `care` = 관리 작업(지주 · 곁순 · 웃거름 · 방제 …)
  /** visit 전용 — 지역 id 또는 장소 키(`poi:영금정`) */
  placeKey?: string;
  /** 286차 — gather 등 활동 목표를 그 지역에서 한 것만 센다(WorldMap 지역 id). 없으면 어디서든 */
  regionId?: string;
  /** custom 목표를 실제 행동 이벤트에 연결하는 키 */
  actionKey?: StoryActionKey;
  /**
   * **자동 추적기 없음** — 대화 패널 [완료]로 닫는다(현행). 시스템이 생기면 false로.
   * 일지에는 '대화로 완료' 표기가 붙는다.
   */
  manual?: boolean;
  /**
   * 165차 — 이 목표를 막 끝냈을 때 「지금 할 일」 창이 대신 보여 줄 한 줄.
   * "무엇을 했고 이제 무엇을 할 차례인지"를 한 문장으로 잇는다.
   * 이 줄이 걸려 있는 동안 제목 뒤에 `(완료!)`가 붙는다.
   */
  afterKo?: string;
  afterEn?: string;
  /**
   * 165차 — 「방법」 한 줄을 이 목표만 따로 적을 때. 없으면 종류별 기본 문장을 쓴다.
   * (`custom`처럼 종류만으로는 무엇을 눌러야 하는지 알 수 없는 목표에 쓴다.)
   */
  howToKo?: string;
  howToEn?: string;
  /** 165차 — 화살표가 가리킬 장소. 목표 종류와 무관하게 우선한다 */
  guidePlaceKey?: string;
}

export interface QuestDeadline {
  /** 스토리 일수 (활동 일 기준 — 침대 수면으로 하루가 간다) */
  days: number;
  /** 실패 없음 — 비용 또는 한 시즌 지연 */
  onMiss: 'cost' | 'delaySeason';
}

/**
 * 보상 아이템 1건. `bound` = **귀속** — 판매·양도 불가(상점 매입 목록에서 제외). 메인 스트림이 주는
 * 고급 장비는 전부 귀속이라 "메인을 깨서 돈을 버는" 우회가 생기지 않는다(141차).
 */
export interface QuestRewardItem { id: string; qty: number; bound?: boolean }

/**
 * 퀘스트 고정 보상. 141차부터 **메인 = 해금형**(귀속 장비 · 가방 · 재화 · 기술 해금 · 상점 해금 ·
 * 장소/면허), **서브 = 진행 보조**(선택지로 갈리는 품삯·가르침·스킬 포인트)로 종류를 갈라 겹치지 않게 한다.
 */
export interface QuestRewards {
  coins?: number;
  items?: QuestRewardItem[];
  /** 취득되는 면허 (자격 사다리) */
  licenses?: StoryLicenseId[];
  /** 이 퀘스트가 열어 주는 스킬 id — 해당 스킬의 `unlock: [{ kind: 'quest', value: <이 id> }]`와 짝 */
  skillUnlocks?: string[];
  /** 상점 품목 해금 키 — `ShopEntry.unlockKey`와 짝. 완료 시 `unlock.shop.<key>` 플래그 */
  shopUnlocks?: string[];
}

/**
 * 발주 정책 (141차).
 *  - `standard` — 언제든 다시 받을 수 있다(기본).
 *  - `once` — **거절하면 영영 사라진다.** 발주 선택지에 `decline: true` 답이 있어야 한다.
 *  - `event` — 시기 조건(`event`)이 맞을 때만 발주된다. 거절하면 `cooldownDays` 뒤에 다시 찾아온다.
 */
export type QuestOfferPolicy = 'standard' | 'once' | 'event';

export interface QuestEventWindow {
  /** 이 계절에만 (KST 실제 월 기준) */
  seasons?: Season[];
  /** 이 레벨 구간에만 [min, max] — 지나치면 더는 오지 않는다 */
  levelBand?: [number, number];
  /** 거절·미수락 후 재발주까지 스토리 일수 (기본 30) */
  cooldownDays?: number;
}

export type QuestTeaches =
  | 'movement' | 'inventory' | 'statusPanel' | 'worldMap' | 'shop' | 'wages'
  | 'homeBase' | 'save' | 'placement' | 'deadline' | 'budgetGear' | 'holeFishing' | 'tetrapodSafety'
  | 'casting' | 'floatRig' | 'bite' | 'fight' | 'law' | 'measure' | 'release' | 'codex'
  | 'butchery' | 'sashimi' | 'freshness' | 'cooking' | 'crafting' | 'backpack' | 'firstAid'
  | 'tideland' | 'tideTable' | 'lantern' | 'cold' | 'communityWork' | 'bicycle' | 'skills' | 'reputation'
  | 'licenseFlow' | 'auction' | 'lure' | 'trap' | 'boatTrip' | 'jigging' | 'egging' | 'surf'
  | 'seasickness' | 'weather' | 'oralHistory' | 'restocking' | 'boatOwnership' | 'guideBusiness'
  | 'tournament' | 'villageFishery' | 'ferry' | 'stallOps' | 'voyagePlan' | 'journalComplete'
  // 137차 — 회귀 고리(이전 지역 재방문)와 손님 응대
  | 'returnTrip' | 'grading' | 'guestTrip'
  // 138차 — 과증식 대응 · 콘텐츠 제작 · 생활(제작/농사/광질/리빙)
  | 'bloom' | 'nuisance' | 'aquaculture' | 'streaming' | 'farming' | 'mining' | 'living';

// ─────────────────────────────────────────────
// 대화 선택지 (140차) — 선택에 따라 결과·보상이 갈린다
// ─────────────────────────────────────────────

/**
 * 선택지 하나가 만드는 결과. 전부 **가산**이다 — 퀘스트 표의 xp·coins는 그대로 두고 여기 값을 더한다.
 *  - 메인 퀘는 `validateStoryQuests`가 xpMult·items·skillPoints·proficiencyLevelUp을 **금지**한다
 *    (메인 스트림을 해치지 않는 선 — 톤·우호도·소액 재화·평판만).
 *  - 서브 퀘는 자유 — 장비·아이템·돈·XP·스킬 포인트·숙련도 XP·숙련도 레벨업 전부 가능.
 */
export interface ChoiceOutcome {
  coins?: number;
  /** 표준 품삯 배율 — `choicesFor`가 `payChoiceCoins(q) × payMult`를 coins로 환산한다(나레이션 데이터 전용) */
  payMult?: number;
  /** XP 배율 (1 = 표 값). 서브만 · 0.8~1.3 */
  xpMult?: number;
  items?: QuestRewardItem[];
  skillPoints?: number;
  /** 숙련도 XP — skillId 지정 또는 카테고리의 **배운** 스킬 전부 */
  proficiency?: { skillId?: string; category?: SkillCategoryId; xp: number };
  /** 숙련도 즉시 1레벨 (그 스킬을 배운 경우에만 — 안 배웠으면 조용히 무시하지 않고 안내) */
  proficiencyLevelUp?: string;
  /** 발주 NPC 우호도 변동 (−1~1 축) */
  affinity?: number;
  /** 다른 NPC 우호도 (심부름꾼 구조 — N19 정옥선↔탁만수) */
  affinityOther?: { npcId: string; delta: number }[];
  harborRep?: number;
  seaRep?: number;
  /** 후속 분기 플래그 — 반드시 `choice.` 접두 (GameState.flags) */
  flag?: string;
  /**
   * **발주 선택지 전용** — 이 답을 고르면 퀘스트를 받지 않는다. `once` 정책이면 영구 소멸,
   * `event`면 쿨다운 뒤 재발주, `standard`면 다음 대화에서 다시 보인다.
   */
  decline?: boolean;
}

/** 선택지 노출 조건 — 전부 AND. 없으면 항상 보인다 */
export interface ChoiceRequires {
  affinityMin?: number;
  affinityMax?: number;
  level?: number;
  license?: string;
  flag?: string;
  notFlag?: string;
}

export interface QuestChoiceDef {
  /** 세트 안에서 유일 — 세이브에 기록된다 */
  id: string;
  labelKo: string;
  labelEn: string;
  /** NPC 응답 대사 (선택 직후 한 줄) */
  replyKo: string;
  replyEn: string;
  outcome: ChoiceOutcome;
  requires?: ChoiceRequires;
  /** 결과 미리보기 한 줄 — 없으면 outcome에서 자동 생성 */
  hintKo?: string;
  hintEn?: string;
}

/** 발주(수락) 시점 선택지와 완료(보고) 시점 선택지 */
export interface QuestChoiceSet {
  offer?: QuestChoiceDef[];
  complete?: QuestChoiceDef[];
}

/**
 * 253차 — 받는 자리 · 끝내는 자리 답의 깊이(퀘스트 id → 이것 · `db-schema/StoryChoiceDepth*.ts`).
 * 모든 편이 **답 3개 이상**이고, 응답은 두세 문장(빈 줄로 단락을 나누면 대화창이 단락마다 ▼로 끊어 찍는다).
 * 합치는 순서는 `StoryChoices.choicesFor` 머리 주석.
 */
export interface ChoiceDepthEntry {
  /** 받는 자리 답 전체 — 나레이션(`StoryNarrative`)에 받는 자리 답이 없는 편 */
  offer?: QuestChoiceDef[];
  /** 나레이션에 받는 자리 답이 이미 있는 편 — 그 뒤에 붙인다 */
  offerAdd?: QuestChoiceDef[];
  /** 끝내는 자리 답 더하기 — 나레이션 답과 합쳐 3개 이상 */
  completeAdd?: QuestChoiceDef[];
  /** 이미 있는 받는 자리 답의 응답을 길게 — 답 id → [ko, en] */
  offerReply?: Record<string, readonly [string, string]>;
  /** 이미 있는 끝내는 자리 답의 응답을 길게 — 답 id → [ko, en] */
  completeReply?: Record<string, readonly [string, string]>;
}

// ─────────────────────────────────────────────
// 물어보기 — 조사 대화 (253차 · 킹덤컴 방식)
//  사람 · 곳 · 물건 · 낱말 · 단서를 「화제」로 알고 있으면, 그 화제를 아무에게나 물을 수 있다.
//  사람마다 답이 다르고, 답 속에서 새 화제가 열리며(꼬리에 꼬리), 같은 화제의 꼬리 질문이 이어진다.
//  데이터 = `db-schema/StoryInquiry*.ts` · 판정 = `rules/Inquiry.ts` · 상태(아는 화제 · 들은 물음) = 클라이언트 StoryStore.
// ─────────────────────────────────────────────

/** 화제 갈래 — 사람 · 곳 · 물건 · 낱말 · 단서 */
export type InquiryTopicKind = 'person' | 'place' | 'thing' | 'word' | 'clue';

/** 물어보기 조건 — 전부 AND. 진행에 따라 열리는 말(스포일러 금지 — R2)은 이것으로 막는다 */
export interface InquiryGate {
  /** 이 편을 받았다(진행 중이거나 마쳤다) */
  questSeen?: string;
  /** 이 편을 마쳤다 */
  questDone?: string;
  /** 이 편이 진행 중이다 */
  questActive?: string;
  /** 이 편을 아직 마치지 않았다 — 그 편 전까지만 하는 말 */
  questNotDone?: string;
  /** 메인 이야기 장(1~7)이 이 이상 */
  chapterMin?: number;
  /** 세이브 플래그(`choice.` · `unlock.` 등)가 켜져 있다 */
  flag?: string;
  /** 이 화제들을 알고 있다 */
  topics?: string[];
  /** 이 물음들을 들었다 */
  asked?: string[];
  /** 묻는 상대와의 우호도가 이 이상 */
  affinityMin?: number;
}

/** 화제 하나 — 목록에 보이는 이름 + 「알게 된 것」 한 줄 */
export interface InquiryTopicDef {
  /** 'p_okseon' · 'w_size_limit' — 갈래 접두(p_ 사람 · pl_ 곳 · t_ 물건 · w_ 낱말 · c_ 단서) */
  id: string;
  kind: InquiryTopicKind;
  labelKo: string;
  labelEn: string;
  /** 주인공이 아는 것 한 줄(노트) — 1인칭 */
  noteKo: string;
  noteEn: string;
  /** 처음부터 안다(아버지 · 가족사진 …) */
  known?: boolean;
  /** 이 조건이 되면 저절로 안다(그 편을 받으며 이름을 들었다 등) — 배열이면 하나만 맞아도 된다 */
  learnWhen?: InquiryGate | readonly InquiryGate[];
}

/** 물음을 처음 들을 때 생기는 것 */
export interface InquiryEffect {
  /** 묻는 상대 우호도 — ±0.03 안(물어봐 준 것에 대한 작은 반응) */
  affinity?: number;
  /** 세이브 플래그 — `choice.` 접두 */
  flag?: string;
  /**
   * 조사 목표 — 이 물음이 그 편 행동 목표의 **지금 단계**를 연다.
   * 그 단계가 「의뢰인 앞에서 고르는 단계」일 때만 오른다(현장 · 창 출처 단계는 그대로 그 출처로).
   */
  action?: { questId: string; objectiveIndex: number; step: number };
}

/** 물음 하나 — 한 사람에게 한 화제로 묻는 말과 그 답. 꼬리 질문은 `parent`로 잇는다 */
export interface InquiryNodeDef {
  /** '<npc>.<화제>[.<꼬리>]' — 세이브(들은 물음)에 기록된다 */
  id: string;
  /** 묻는 상대(StoryNpc id) */
  npcId: string;
  /** 어느 화제의 물음인가 */
  topic: string;
  /** 꼬리 질문이면 앞 물음 id — 앞 물음을 들어야 보인다 */
  parent?: string;
  /** 주인공이 묻는 말(선택지 줄) */
  askKo: string;
  askEn: string;
  /** 상대의 답 — 단락은 빈 줄(`\n\n`) · 한 · 영 단락 수 같게 */
  answerKo: string;
  answerEn: string;
  /** 이 답을 들으면 알게 되는 화제 */
  opens?: string[];
  requires?: InquiryGate;
  effect?: InquiryEffect;
}

// ─────────────────────────────────────────────
// 254차 — 이어지는 대화(갈래) · 결말
//   사용자 지시: 「선택지에 따라 대화 대상에 대한 우호도가 감소하거나 증가 … 상대가 반응하고 대화가 이어진다 …
//   A에게 한 말이 B에게도 미친다」 · 「이야기의 결말은 1~3개 — 하나로 모이는 결말 · 흐름이 갈라지는 결말 · 이도 저도 아닌 결말」
// ─────────────────────────────────────────────

/**
 * 답의 입장(검사 · 일지 표기용) — 대사 자체가 입장을 드러낸다. 양 끝 사이에 가운데가 있다.
 *  giver = 의뢰인(A) 편 · other = 맞은편(B) 편 · mid = 가운데(중재 · 양쪽 다 듣기) · self = 어느 편도 아닌 제 생각 · 물러섬
 */
export type TalkStance = 'giver' | 'other' | 'mid' | 'self';

/** 답이 보일 조건 — 앞에서 고른 것(표시) · 그 사람과의 사이 */
export interface TalkGate {
  /** 이 표시가 켜져 있다 */
  flag?: string;
  /** 이 표시가 꺼져 있다 */
  notFlag?: string;
  /** 이 사람과의 우호도가 이 이상 [npcId, 값] */
  affinityMin?: readonly [string, number];
  /** 이 사람과의 우호도가 이 이하 [npcId, 값] */
  affinityMax?: readonly [string, number];
}

/** 대화가 끝날 때 — 대화가 열린 자리마다 뜻이 다르다 */
export interface TalkEndDef {
  /** 받는 자리 — 받는다 */
  accept?: boolean;
  /** 받는 자리 — 미룬다(서브만 · 메인은 늘 받는 쪽으로 끝난다) */
  decline?: boolean;
  /**
   * 286차 — 받는 자리에서 거절로 끝난다 = 그 편은 **실패**로 닫힌다(서브만 · 사용자 「곁가지는 개시를 선택적으로 안 할 수도 있다 →
   * 거절 = 실패」). 다시 받을 수 없고, 이야기는 다음 편으로 이어진다(실패한 편은 지나간 것으로 친다).
   */
  fail?: boolean;
  /** 끝내는 자리 — 이 답 id로 마친다(그 답의 보상 · 기록). 없으면 보상 답 없이 마친다 */
  complete?: string;
  /** 끝내는 자리 — 이 결말로 이야기를 맺는다(`StoryEndingDef.id`) */
  ending?: string;
  /** 끝나며 상대가 하는 마지막 말 · 지문(단락은 빈 줄) */
  lineKo?: string;
  lineEn?: string;
}

export interface TalkChoiceDef {
  /** 그 단계 안에서 유일 */
  id: string;
  /** 주인공이 하는 말(대화창 줄) */
  labelKo: string;
  labelEn: string;
  stance?: TalkStance;
  /** 사람마다 우호도 증감 — 대화 상대만이 아니라 그 자리에 없는 사람도(소문 · 전해 듣기) */
  affinity?: Readonly<Record<string, number>>;
  /** 남길 표시(`choice.`로 시작) — 뒤 대화 · 결말이 읽는다 */
  flags?: readonly string[];
  requires?: TalkGate;
  /** 다음 단계 id — 없으면 `end`로 끝난다(둘 중 하나만) */
  next?: string;
  end?: TalkEndDef;
  /**
   * 286차 — 고른 뒤 주인공이 **실제로 입에 올리는 말**(라벨은 고르는 줄에 보이는 짧은 뜻 · 이것은 대화창에 찍히는 대사).
   * 없으면 라벨을 그대로 말한다. 여자 주인공이면 `sayKoF`가 있을 때 그것.
   */
  sayKo?: string;
  sayEn?: string;
  sayKoF?: string;
  sayEnF?: string;
  /** 286차 — 일지(J)에 남는 한 문장(이 말을 골랐다는 것 — 1인칭 · 무엇을 말했고 어떻게 느꼈나) */
  noteKo?: string;
  noteEn?: string;
}

/**
 * 286차 — 대화 장면의 몸짓(사용자 지시 원문: 「담배를 꺼내 문 상태에서, 연기를 내뿜을 때 실제로 사람이 말을 하면서 저 동작을
 *  동시에 할 순 없잖아? … 저런 연출이 나오고 있는데 갑자기 대화 코멘트가 열리거나 그러지 않았으면 … (물론, 말을 하면서 동시에
 *  몸짓 연출이 들어갈 수 있는 부분들도 있겠지만)」).
 * 몸짓마다 말과 함께 할 수 있는지(`TalkActDef.speech`)가 정해져 있다 — 입이나 두 손이 바쁜 몸짓은 끝날 때까지 다음 말이 열리지 않는다.
 * 표는 core `rules/TalkActs.ts`.
 */
export type TalkActId =
  | 'cig_light' | 'cig_puff' | 'cig_out'
  | 'give' | 'receive'
  | 'nod' | 'shake_head' | 'look_away' | 'look_sea' | 'look_up' | 'sigh' | 'laugh' | 'silence' | 'peer';

export interface TalkActDef {
  id: TalkActId;
  /** block = 끝날 때까지 다음 말이 열리지 않는다 · overlap = 말과 함께 한다(그 말이 찍히는 동안 같이) */
  speech: 'block' | 'overlap';
  /** 몸짓 길이(ms) */
  ms: number;
  /** 지문(일지 · 위키 · 필드 인물이 없을 때 대화창이 대신 찍는 괄호 글) — 3인칭 현재형 */
  captionKo: string;
  captionEn: string;
  /** 이 몸짓을 하려면 들고 있어야 하는 것 */
  needs?: 'cigarette';
  /** 이 몸짓 뒤로 들고 있는 것(대화가 끝날 때까지 — 말과 함께 연기가 가늘게 오른다) */
  holds?: 'cigarette';
  /** 이 몸짓으로 내려놓는 것 */
  drops?: 'cigarette';
  /** 효과음(`SfxBank` 키) */
  sfx?: string;
}

/** 286차 — 대사 한 줄. who = 말하는 사람(인물 id · `'player'` 주인공 · `''` 지문). 괄호로만 된 주인공 줄은 속말 */
export interface TalkLineBeat {
  kind: 'line';
  who: string;
  ko: string;
  en: string;
  /** 여자 주인공일 때(「신뢰하는 남자」 → 「신뢰하는 사람」 등) */
  koF?: string;
  enF?: string;
  /** 이 말과 함께 하는 몸짓 — `speech: 'overlap'`인 몸짓만 */
  act?: TalkActId;
}

/** 286차 — 몸짓 하나(말 없이). block 몸짓이면 끝날 때까지 다음 줄이 열리지 않는다 */
export interface TalkActBeat {
  kind: 'act';
  who: string;
  act: TalkActId;
  /** give · receive — 건네는 상대 */
  to?: string;
  /** give · receive — 오가는 물건(아이템 id — 그림) */
  item?: string;
}

/** 286차 — 장면 안에서 받는 것(물건 · 마음 · 표시). 처음 한 번만(다시 열어 같은 장면을 지나도 두 번 받지 않는다) */
export interface TalkGiveBeat {
  kind: 'give';
  /** 준 사람(우호도 · 기록) */
  from: string;
  items?: readonly { id: string; qty: number }[];
  /** 사람마다 우호도 증감 */
  affinity?: Readonly<Record<string, number>>;
  flags?: readonly string[];
}

export type TalkBeat = TalkLineBeat | TalkActBeat | TalkGiveBeat;

export interface TalkNodeDef {
  /** 말하는 사람 — 없으면 대화 상대 · `''` = 지문(괄호 서술) */
  speaker?: string;
  /** 상대의 말(단락은 빈 줄 · 한 · 영 단락 수 같게) — 286차 대본(`beats`)이 있으면 빈 글 */
  lineKo: string;
  lineEn: string;
  /**
   * 286차 — 대본(주고받는 장면). 있으면 `lineKo` 대신 이것을 차례로 연다 — 대사(누가 말하나 · 초상과 이름이 바뀐다) · 몸짓 · 받기.
   * 사용자 「혼자서 대답을 다 해버리고 … 정보를 한번에 전달하는 형태는 잘못된 대화 방법」 — 주인공의 말도 이 안에 있다.
   */
  beats?: readonly TalkBeat[];
  /** 고를 말 1~4개 — 286차 `next` · `end`가 있으면 비운다(고르지 않고 이어지거나 끝나는 장면) */
  choices: readonly TalkChoiceDef[];
  /** 286차 — 고르지 않고 다음 장면으로 */
  next?: string;
  /** 286차 — 고르지 않고 대화가 끝난다 */
  end?: TalkEndDef;
  /** 286차 — 일지(J)에 남는 한 문장(이 장면을 지났다는 것 — 1인칭) */
  noteKo?: string;
  noteEn?: string;
}

/**
 * 이어지는 대화 하나. 대화창이 열린 자리(`at`)에서 표준 답 · 방식 고르기 · 장면 대신 이 대화가 돈다.
 *  - offer: 받는 자리 — 끝은 받기/미루기
 *  - objective: 장면으로 닫히는 목표(대화 · 수동) — 끝나면 그 목표가 닫힌다
 *  - action: 행동 목표의 「의뢰인 앞 선택」 단계(`step`) — 끝나면 그 단계가 오른다
 *  - complete: 끝내는 자리 — 끝은 보상 답(`complete`) · 결말(`ending`)
 */
export interface StoryTalkDef {
  id: string;
  questId: string;
  at: 'offer' | 'objective' | 'action' | 'complete';
  /** objective · action 전용 — 목표 번호 */
  objectiveIndex?: number;
  /** action 전용 — 행동 단계 번호(0부터) */
  step?: number;
  /** 대화 상대 */
  npcId: string;
  /** 첫 단계 id */
  start: string;
  nodes: Readonly<Record<string, TalkNodeDef>>;
}

/** 결말 종류 — 1 하나로 모이는 결말(뒤 이야기가 기대는 정본) · 2 흐름이 갈라지는 결말 · 3 이도 저도 아닌 결말 */
export type StoryEndingKind = 'canon' | 'rupture' | 'neutral';

/** 그 사람 가게의 조건(결말이 바꾼다) */
export interface NpcShopTerms {
  /** 값을 깎아 주지 않는다 — 흥정 기술 · 단골 인심이 이 가게에서 듣지 않는다 */
  noHaggle?: boolean;
  /** 귀한 물건 — none = 더는 들이지 않는다 · more = 늘 진열한다 */
  rare?: 'none' | 'more';
}

export interface StoryEndingEffects {
  /** 우호도 더하기 */
  affinity?: Readonly<Record<string, number>>;
  /** 우호도를 이 값으로 */
  affinitySet?: Readonly<Record<string, number>>;
  /** 앞으로 우호도가 이 값을 넘지 않는다(영영 상한 — 사이가 영구히 상했다) */
  affinityCap?: Readonly<Record<string, number>>;
  /** 그 사람 가게 조건 */
  shop?: Readonly<Record<string, NpcShopTerms>>;
  /** 그 사람의 나이 · 직업 한 줄이 바뀐다(영구 피해 — 가게를 접었다 등) */
  role?: Readonly<Record<string, { ko: string; en: string }>>;
  flags?: readonly string[];
}

export interface StoryEndingDef {
  id: string;
  /** 어느 이야기(서브 아크 id)의 결말인가 — 이야기 하나에 1~3개 */
  arcId: string;
  kind: StoryEndingKind;
  /** 결말을 정하는 편 — 이 편의 끝내는 자리 대화가 고른다(정본만 있는 이야기는 이 편을 마치면 그것) */
  questId: string;
  titleKo: string;
  titleEn: string;
  /** 일지에 남는 한두 문장 */
  summaryKo: string;
  summaryEn: string;
  effects?: StoryEndingEffects;
}

// ─────────────────────────────────────────────
// NPC 우호도 (140차) — −1(최저) ~ 0(기본) ~ +1(최고)
// ─────────────────────────────────────────────

export type AffinityTier = 'hostile' | 'cold' | 'neutral' | 'warm' | 'close';

/** npcId → 우호도 */
export type AffinityState = Record<string, number>;

export interface StoryQuestDef {
  /** 'M1-04' / 'N05-3' */
  id: string;
  kind: StoryQuestKind;
  part: StoryPart;
  chapter: StoryChapter;
  /** 서브 = 소속 아크 (N01~N17) */
  arcId?: string;
  titleKo: string;
  titleEn: string;
  /** 서사 한 줄 (일지 본문) */
  descKo: string;
  descEn: string;
  minLevel: number;
  /** 본 문서 표 값 — §8-1 합계 보존(무결성 검사) */
  xp: number;
  /** 발주 NPC id ('' = 무발주 자동 시작) */
  giver: string;
  /** 지역 id (WorldMap `RegionDef.id`) */
  region: string;
  prereq: string[];
  deadline?: QuestDeadline;
  teaches?: QuestTeaches[];
  objectives: StoryObjective[];
  /** 완료 시 평판 변동 */
  reputation?: { harbor?: Record<string, number>; sea?: number };
  /** 이 퀘 완료가 채우는 조행록 장 (1~17) */
  journalPage?: number;
  /** 해금 키 (지역·시스템 — `GameState.flags` 'unlock.<key>') */
  unlocks?: string[];
  rewards?: QuestRewards;
  /**
   * 대화 선택지 (140차). 없으면 `defaultChoicesFor(q)`가 종류별 표준 세트를 만든다 —
   * 메인 = 톤 2종(결과 동일 · 우호도만) / 서브 = 품삯·가르침·사양·(친밀 전용) 4종.
   */
  choices?: QuestChoiceSet;
  /**
   * 목표를 **순서대로만** 닫는다 (188차 — M1-01 프롤로그).
   * 앞 목표가 남아 있으면 뒤 목표의 이벤트는 무시된다. 「지금 할 일」이 언제나 첫 미완 목표 하나를 가리키는
   * 튜토리얼 흐름용 — 일반 퀘스트는 순서 자유가 기본이다.
   */
  ordered?: boolean;
  /** 발주 정책 (141차) — 없으면 `standard` */
  offerPolicy?: QuestOfferPolicy;
  /**
   * 286차 — 이 지역에서 의뢰인을 만났을 때만 받는다(떠돌이 의뢰인이 그 땅에서 꺼내는 이야기 — 「해녀의 딸」은 제주에서).
   * 다른 지역에서 만나면 받을 일이 없는 것처럼 굴고, 할 일 안내는 이 지역을 가리킨다. 없으면 어디서든.
   */
  offerRegion?: string;
  /** `event` 정책의 시기 조건 */
  event?: QuestEventWindow;
}

// ─────────────────────────────────────────────
// 나레이션 층 (141차) — 퀘스트를 "표"가 아니라 "이야기"로 읽게 하는 문장들
// ─────────────────────────────────────────────

/**
 * 퀘스트 한 편의 서사 텍스트. 데이터는 `db-schema/StoryNarrative.ts`.
 *  - `intro` — **주인공 시점 나레이션**(1인칭 현재형). 누가·어디서·왜·어떻게가 문장 안에 있어야 한다.
 *    정의문("첫 품삯이 기본 재화다")은 금지 — 감각·판단·기대로 쓴다.
 *  - `offer`/`done` — 발주 NPC의 **말**(따옴표 없이 대사만). 없으면 `StoryDialogue` 폴백.
 *    진행 중 화면의 말은 287차부터 목표마다 「물음 · 내 답 · 조언」(`ProgressAskDef` — `db-schema/StoryProgressAsk.ts`)이 맡는다.
 *  - `objectives` — 목표를 문장으로 바꾼 라벨(순서 = `StoryQuestDef.objectives`). 없으면 원 라벨.
 *  - `epilogue` — 완료 후 주인공 한 줄(일지 하단·대화 응답 뒤).
 * 영문은 선택 — 없으면 한국어가 그대로 노출된다(사전 미수록 규칙과 동일).
 */
export interface QuestNarrative {
  intro: string;
  introEn?: string;
  offer?: string;
  offerEn?: string;
  done?: string;
  doneEn?: string;
  objectives?: string[];
  objectivesEn?: string[];
  epilogue?: string;
  epilogueEn?: string;
  /** 267차 — 받는 자리에서 의뢰인이 덧붙이는 주의(영업시간 등 — 대화창이 빨간 글로 따로 찍는다) */
  hint?: string;
  hintEn?: string;
}

/**
 * 287차 — 진행 중 물음 한 벌(목표 하나에 하나 · 순서 = `StoryQuestDef.objectives`).
 * 사용자 「'딸은 만나봤나?'로만 물어보고, 선택지 1) …아직 만나보지 않았습니다. 2) 나가기 … 1)을 누르면 바람: 시간 잘 확인해서 …」.
 *  - `ask` — 의뢰인이 **지금 할 목표**를 묻는 말. 물음 하나로 끝나고 스스로 답하지 않는다(옛 「딸은 만나 봤나? 물속은 안 돼.」 자문자답 금지).
 *  - `answer` — 주인공의 답. 고르는 말이자 실제로 하는 말(주인공 칸에서 찍힌다). 그 목표를 아직 못 했다는 말이다.
 *  - `reply` — 답을 들은 의뢰인이 일러 주는 말(그 목표를 이루는 단서 · 주의).
 * 진행 나레이션(「해야 할 것은 …」)은 대화창에 찍지 않는다 — 일지(J)가 맡는다.
 */
export interface ProgressAskDef {
  askKo: string;
  askEn: string;
  answerKo: string;
  answerEn: string;
  replyKo: string;
  replyEn: string;
}

// ─────────────────────────────────────────────
// 조행록 17장 (§7)
// ─────────────────────────────────────────────

export interface JournalPageDef {
  page: number;
  /** WorldMap 지역 id */
  regionId: string;
  /** 지역 안 권역 키 (OSM 확장으로 실체화 전엔 예약 문자열) */
  areaKey?: string;
  labelKo: string;
  labelEn: string;
  /** 지표 어종 (오라클 id — 반드시 등록된 종) */
  speciesId: string;
  seasons: Season[];
  /** 시간대·조법 설명 */
  howKo: string;
  howEn: string;
  /** 조건 — minCm / 마릿수 / 계측만 / 계측 후 방류 */
  minCm?: number;
  count?: number;
  releaseAfter?: boolean;
  /** 함께 완주해야 하는 서브 아크 */
  arcId: string;
  /** v3 원안에서 대체된 경우 원 어종 표기 (추가 권장 목록) */
  substitutedFrom?: string;
}

/** 조행록 한 장의 두 조건 — 어획(계측)과 아크 완주 */
export interface JournalPageState {
  page: number;
  caught: boolean;
  arcDone: boolean;
}

// ─────────────────────────────────────────────
// NPC 아크 (§12)
// ─────────────────────────────────────────────

export interface StoryNpcDef {
  id: string;
  nameKo: string;
  nameEn: string;
  /** 나이·직업 한 줄 */
  roleKo: string;
  roleEn: string;
  /**
   * 253차 — 밝혀지기 전의 나이 · 직업 한 줄(스포일러 금지 — R2). `untilSeen` 편을 받기(진행 중 · 마침) 전에는
   * 대화창 제목 · 미니맵 정보 카드가 `roleKo` 대신 이것을 쓴다(예: 강두철 — 조합장임이 들키기 전은 초보 낚시꾼).
   */
  veil?: { untilSeen: string; roleKo: string; roleEn: string };
  /**
   * 이 사람이 물건을 판다면 그 상점 id (150차).
   * 있으면 대화창에 **"물건을 볼 수 있을까요?"** 선택지가 뜬다 — 없으면 뜨지 않는다
   * (사용자 지시: 거래 가능한 NPC가 아닐 경우 그 선택지는 제외).
   */
  shopId?: string;
}

export interface StoryArcDef {
  /** 'N01' ~ 'N17' */
  id: string;
  titleKo: string;
  titleEn: string;
  npcs: StoryNpcDef[];
  /** 관계 원형 → 배경 → 주인공과 맞물리는 각도 (§12-1) */
  relationKo: string;
  relationEn: string;
  angleKo: string;
  angleEn: string;
  /** 주 무대 지역 id */
  regionId: string;
  /** 아크에 속한 퀘 id (순서대로) */
  questIds: string[];
  /** 완주 시 열리는 반복 의뢰 라벨 (미구현 — 표기용) */
  repeatableKo?: string;
  repeatableEn?: string;
}

// ─────────────────────────────────────────────
// 평판 2종 (§6-1)
// ─────────────────────────────────────────────

export interface ReputationState {
  /** 항구 신뢰 — 지역별 0~100 */
  harbor: Record<string, number>;
  /** 바다 평판 — −10~+10 */
  sea: number;
}

export function createDefaultReputation(): ReputationState {
  return { harbor: {}, sea: 0 };
}

/** 항구 신뢰 클램프 (0~max) */
export function clampHarbor(v: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(v)));
}

/** 바다 평판 클램프 (min~max) */
export function clampSea(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v * 10) / 10));
}
