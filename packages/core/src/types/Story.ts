/**
 * @file Story.ts
 * @description 스토리·퀘스트 계약 타입 (134차 — `.agents/STORY_SPEC_v3.md` §3-2·§14-4 정합판)
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
  | 'farm'           // 농사 (138차 — 시스템 도착 전까지 manual)
  | 'mine'           // 광질 (138차 — manual)
  | 'furnish'        // 가구 배치·리빙 (138차 — manual)
  | 'reachLevel'     // 레벨 도달
  | 'earn'           // 재화 누적
  | 'custom';        // 그 외 (라벨로만 설명)

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
  /** talk/deliverFree 전용 — StoryArc npc id */
  npcId?: string;
  /** craft/deliverFree/cook 전용 */
  itemId?: string;
  /** license 전용 */
  licenseId?: string;
  /** visit 전용 — 지역 id 또는 장소 키(`poi:영금정`) */
  placeKey?: string;
  /**
   * **자동 추적기 없음** — 대화 패널 [완료]로 닫는다(현행). 시스템이 생기면 false로.
   * 일지에는 '대화로 완료' 표기가 붙는다.
   */
  manual?: boolean;
}

export interface QuestDeadline {
  /** 스토리 일수 (활동 일 기준 — 침대 수면으로 하루가 간다) */
  days: number;
  /** 실패 없음 — 비용 또는 한 시즌 지연 */
  onMiss: 'cost' | 'delaySeason';
}

export interface QuestRewards {
  coins?: number;
  items?: { id: string; qty: number }[];
  /** 취득되는 면허 (자격 사다리) */
  licenses?: StoryLicenseId[];
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
  /** XP 배율 (1 = 표 값). 서브만 · 0.8~1.3 */
  xpMult?: number;
  items?: { id: string; qty: number }[];
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
