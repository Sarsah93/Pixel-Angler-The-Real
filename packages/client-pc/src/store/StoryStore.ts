/**
 * @file StoryStore.ts
 * @description 스토리·퀘스트 진행 스토어 (134차 — STORY_SPEC_v3 §14-4 엔진)
 *
 * - 정의는 core(`STORY_QUESTS`·`JOURNAL_PAGES`·`STORY_ARCS`), **상태만** 여기 있다.
 * - GameState가 `bind(host)`로 XP·재화·면허·플래그 조작 권한을 넘긴다(순환 import 회피).
 * - 이벤트 한 종류(`event()`)로 모든 자동 추적 목표를 채운다 — 어획/방생/활동/면허/통발/방문/커스텀/레벨/재화.
 *   `manual` 목표는 일반 목표와 분리된다. `actionKey`가 붙은 목표는 실제 행동 계통이
 *   `emitActionSource()`를 발행할 때만 단계가 오르고, `talk` 목표만 해당 NPC 대화에서 닫힌다.
 * - 스토리 날짜(`day`)는 **침대 수면**으로만 간다 — 활동 시간 규칙(125차)과 같은 원리로 오프라인엔 멈춘다.
 * - 조행록 17장: `pageCatch[page]`(제철 자가어획 누적) + 아크 완주 = 채움.
 *
 * ⚠ 세이브 하위호환: `story` 필드가 없으면 새 게임과 같이 M1-01만 활성. 구세이브의 레벨이 높아도
 *   퀘스트는 처음부터 — 스킵 수단은 dev 콘솔(추후)뿐.
 */

import { LedgerStore } from './LedgerStore.js';
import {
  STORY_QUESTS, getStoryQuest, lastMainQuestOfChapter, JOURNAL_PAGES, journalCatchMatches, STORY_ARCS, getStoryArc,
  seasonOfMonth, createDefaultReputation, clampHarbor, clampSea, canSell, canConsign, provenanceOf, TUNING,
  spotKindSatisfies, SPOT_KIND_LABEL, QUEST_ITEM_DROPS, getQuestItem,
  dayJobsOfNpc, getDayJob,
  clampAffinity, affinityRewardMult, affinityJobWageMult, canOfferSubQuest, canOfferJobs, choicesFor, choiceVisible,
  getLicenseByType, getSkillById, getStoryNpc, getRegionById, okseonSpareGift, particle,
  type StoryQuestDef, type StoryObjective, type StoryActionKey, type ReputationState, type CatchMethod, type StorySpotKind, type JournalPageState, type LawVerdict,
  type DayJobDef, type AffinityState, type QuestChoiceDef, type ChoiceOutcome, type ChoiceCtx, type SkillCategoryId,
  type OkseonSpareGift,
  inquiryTopicsFor, inquiryFollowUps, inquiryNodesForQuest, inquiryKnownTopics, inquiryNode, inquiryDrivesAction,
  type InquiryCtx, type InquiryTopicEntry, type InquiryNodeDef, type InquiryTopicDef,
  offerTalkOf, completeTalkOf, objectiveTalkOf, actionTalkOf, talkNode, talkGateOk, talkVisibleChoices,
  endingById, endingsOfArc, endingArcOfQuest, npcShopTerms, npcAffinityCap, npcEndingRole,
  type TalkCtx, type StoryTalkDef, type TalkChoiceDef, type TalkEndDef, type NpcShopTerms, type StoryEndingDef,
} from '@tra/core';
import {
  storyActionSpec, originMatches, isChoiceOrigin, DAILY_ACTION_ORIGINS, type StoryActionChoice, type StoryActionSource,
} from './StoryActionRegistry.js';
import { TitleStore } from './TitleStore.js';

export interface QuestProgress {
  status: 'active' | 'done';
  /** 목표별 진행 수치 (target 대비) */
  obj: number[];
  /** 수락/완료 스토리 일차 */
  day: number;
  /** 행동 목표별 현재 단계 — 세이브 후에도 절차를 이어 간다 */
  actionSteps?: Record<string, number>;
  /** 대화·선택 행동에서 단계별로 고른 분기 — 세이브 후에도 결과 맥락을 유지한다 */
  actionChoices?: Record<string, string>;
  /** 235차 — 하루 한 단계 출처(`DAILY_ACTION_ORIGINS`)가 마지막으로 오른 이야기 일차 (목표 번호 → 일차) */
  actionDays?: Record<string, number>;
}

export interface StorySaveState {
  quests: Record<string, QuestProgress>;
  rep: ReputationState;
  /** 조행록 장별 제철 자가어획 누적 */
  pageCatch: Record<string, number>;
  /** 스토리 일차 (침대 수면마다 +1) */
  day: number;
  /** 실습생 증 수령 일차 (D-180 기준점) — null = 미수령 */
  traineeDay: number | null;
  /** 일용직 일감 — 일감 id → { 마지막 근무 일차, 그날 횟수 } (135차) */
  jobs?: Record<string, { day: number; count: number }>;
  /** 155차 — 일지에서 「추적하기」를 켠 할 일 (구 단일 고정 — 165차 이후 메인 칸으로 승계) */
  tracked?: string | null;
  /** 165차 — 일지에서 고정한 할 일. 메인·서브 각 1건 */
  pinned?: { main?: string | null; sub?: string | null };
  /** NPC 우호도 (140차) — npcId → −1~1. 없으면 0 */
  affinity?: AffinityState;
  /** 퀘스트별 고른 선택지 (140차) — questId → { offer, complete } */
  choices?: Record<string, { offer?: string; complete?: string }>;
  /** 206차 — 한 번이라도 끝낸 퀘스트(다시 받는 서브 퀘스트 구분 — 구세이브는 done 상태에서 채운다) */
  everDone?: string[];
  /** 거절해 영영 사라진 once 퀘스트 (141차) */
  declined?: string[];
  /** 286차 — 받는 자리 대화에서 끝내 거절해 실패로 닫힌 곁가지(다시 오지 않는다 · 뒤 편은 열린다) */
  failed?: string[];
  /** 거절·미수락 뒤 재발주 가능 일차 (141차 — event 정책) — questId → 스토리 일차 */
  offerCooldown?: Record<string, number>;
  /** 253차 — 물어보기: 누군가의 답에서 알게 된 화제 · 들은 물음(구세이브는 없다 — 빈 채로 시작) */
  inquiry?: { learned: string[]; asked: string[] };
  /**
   * 254차 — 이어지는 대화. `seen` = 한 번이라도 고른 말(「대화/단계/말」 — 우호도는 처음 한 번만 센다) ·
   * `at` = 하다 만 대화의 지금 단계(창을 닫았다 다시 열면 거기서 잇는다) · `path` = 고른 길(일지 · 검증용).
   */
  talk?: { seen: string[]; at: Record<string, string>; path: Record<string, string[]> };
  /** 254차 — 다다른 이야기 결말 — 이야기 id → 결말 id(영구 — 결말의 효과는 이 표에서 매번 다시 읽는다) */
  endings?: Record<string, string>;
}

/** 254차 — 이어지는 대화에서 말 하나를 고른 결과(대화창이 그린다) */
export interface TalkStepResult {
  /** 끝의 일이 거절됐다(가방 자리 등) — 대화는 그 단계에 머문다 */
  ok: boolean;
  next?: string;
  end?: TalkEndDef;
  /** 실제로 움직인 우호도(처음 고른 말만 · 상한에 걸리면 덜 움직인다) */
  moved: { npcId: string; delta: number }[];
  /** 끝내는 자리 — 이 대화로 다다른 결말 */
  ending?: StoryEndingDef;
}

export interface StoryHost {
  grantXp(n: number): void;
  addCoins(n: number): void;
  acquireLicense(t: string): boolean;
  heldLicenses(): string[];
  level(): number;
  coins(): number;
  /** 287차 — 지금 서 있는 지역(받는 순간 「○○에 도착한다」 목표를 바로 센다) */
  currentRegion?(): string;
  setFlag(k: string, v?: boolean): void;
  markQuestDone(id: string): void;
  markDirty(): void;
  /** 품삯 노동 비용 — 허기·수분 감소 / 피로 증가 (135차) */
  spendLabor(hunger: number, hydration: number, fatigue: number): void;
  /** 현재 피로 (0~100) — 일하기 가능 여부 판정 */
  fatigue(): number;
  // 140차 — 선택지 결과 보상
  hasFlag(k: string): boolean;
  /** 카탈로그 아이템 실지급 (없는 id는 false). bound = 귀속(141차) */
  giveItem(id: string, qty: number, bound?: boolean): boolean;
  /** 카탈로그 아이템 이름 (보상 표기용) */
  itemName(id: string): string;
  /** 현재 KST 월 (1~12) — event 정책 계절 판정 */
  month(): number;
  addSkillPoints(n: number): void;
  grantProfXp(target: { skillId?: string; category?: SkillCategoryId }, xp: number): string[];
  grantProfLevelUp(skillId: string): boolean;
  /** 233차 — 개인 전용 퀘스트 아이템 1개를 가방에 넣는다(귀속). 공간이 없으면 false */
  giveQuestItem?(itemId: string): boolean;
  /** 233차 — 퀘스트를 마치면 모은 퀘스트 아이템을 의뢰인에게 넘긴다(가방에서 뺀다 · 234차 바닥에 둔 것도 거둔다) */
  takeQuestItems?(itemId: string, qty: number): void;
  /** 234차 — 가방에 든 그 아이템 수(`collect` 목표 진행 = 보유 수) */
  countItem?(itemId: string): number;
  /**
   * 234차 — 이 물건들이 가방에 다 들어가는가. 모자라면 「장비 칸 1개」 같은 한 줄, 다 들어가면 null.
   * 완료 · 수락 보상을 주기 **전에** 묻는다(가방이 차서 못 받은 보상은 다시 얻을 길이 없다).
   */
  roomFor?(items: readonly { id: string; qty: number }[]): string | null;
  /** 237차 — 집 가구(놓인 것 · 넣어 둔 것 포함)를 이미 갖고 있는가 */
  hasFurniture?(kind: string): boolean;
  /** 237차 — 집 「넣어 둔 가구」로 보낸다(가방 자리를 차지하지 않는다) */
  giveFurniture?(kind: string): boolean;
}

/** 235차 — N22-7 「씨앗」 수락 때 하늬가 건네는 씨앗 봉투 */
const N22_7_SEEDS: { id: string; qty: number }[] = [{ id: 'seed_mallow', qty: 2 }, { id: 'seed_chard', qty: 2 }];

export type StoryEvent =
  | { kind: 'catch'; speciesId: string; lengthCm: number; method: CatchMethod; selfCaught: boolean; regionId: string; month: number; spotKind?: StorySpotKind }
  | { kind: 'release'; speciesId: string; lengthCm: number }
  | { kind: 'activity'; activity: 'butcher' | 'sashimi' | 'forage' | 'craft' | 'cook'; itemId?: string; traded?: boolean; regionId?: string }
  | { kind: 'license'; licenseId: string }
  | { kind: 'trap' }
  | { kind: 'sell'; traded?: boolean }
  /** 235차 — 텃밭: 심었다 · 거뒀다 (목표 `farm`은 심기를 센다) */
  | { kind: 'farm'; action: 'plant' | 'harvest' | 'care'; cropId: string }
  /** 233차 — 개인 전용 퀘스트 아이템을 찾았다(`rollQuestDrops`가 낸다) */
  | { kind: 'questItem'; itemId: string }
  | { kind: 'visit'; placeKey: string }
  | { kind: 'custom'; key: string }
  | { kind: 'action'; key: StoryActionKey; source?: string }
  /**
   * 167차 — 대화창을 여는 것만으로는 아무 목표도 닫히지 않는다. `talk`·수동 목표는 그 목표의
   * **장면(컷씬)** 이 끝났을 때만 `scene` 이벤트로 닫힌다. `talk` 이벤트는 호환용으로 남겨 두되 무시한다.
   */
  | { kind: 'talk'; npcId: string }
  | { kind: 'scene'; questId: string; objectiveIndex: number }
  | { kind: 'level'; level: number }
  | { kind: 'coins'; coins: number }
  /** 138차 — 과증식 생물 수거 (해파리·불가사리) */
  | { kind: 'cull'; speciesId: string };

export type QuestStatus = 'done' | 'active' | 'available' | 'locked' | 'declined' | 'failed';

/** 어획물 아이템의 판매 판정에 필요한 최소 형태 */
interface SellableLike { id?: string; speciesId?: string; subCategory?: string; catchMethod?: CatchMethod; lengthCm?: number }

/**
 * 어획물의 획득 경로 (188차 — AG ①b).
 * `catchMethod`가 없으면 구세이브 어획물이라 낚싯대로 본다(가장 보수적) — 단 **상점에서 산
 * 물고기**(`shop_*` 카탈로그 id)는 구매품이다. 이 구분이 없으면 산 물고기가 '직접 잡은 것'으로
 * 위판 판정을 통과할 수 있었다.
 */
export function catchMethodOfItem(item: SellableLike): CatchMethod {
  if (item.catchMethod) return item.catchMethod;
  return item.id?.startsWith('shop_') ? 'bought' : 'rod';
}

/** 234차 — `collect`(개인 퀘스트 물건 모으기) 목표가 있는 퀘스트 — 진행을 가방 보유 수로 맞출 대상 */
const COLLECT_QUEST_IDS: ReadonlySet<string> = new Set(
  STORY_QUESTS.filter((q) => q.objectives.some((o) => o.kind === 'collect' && !!o.itemId)).map((q) => q.id),
);

class StoryStoreManager {
  private host: StoryHost | null = null;
  private quests: Record<string, QuestProgress> = {};
  private rep: ReputationState = createDefaultReputation();
  private pageCatch: Record<string, number> = {};
  private day = 0;
  private traineeDay: number | null = null;
  private jobs: Record<string, { day: number; count: number }> = {};
  /** 141차 — 거절로 사라진 once 퀘 · event 재발주 쿨다운 */
  private declined = new Set<string>();
  /** 286차 — 거절 = 실패로 닫힌 곁가지 */
  private failed = new Set<string>();
  private offerCooldown: Record<string, number> = {};
  private affinity: AffinityState = {};
  private choices: Record<string, { offer?: string; complete?: string }> = {};
  /** 206차 — 한 번이라도 끝낸 퀘스트 id(퀘스트 첫 진행 밑걸림 완화 판정) */
  private everDone = new Set<string>();
  /** 254차 — 이어지는 대화 · 결말(세이브 `talk` · `endings`) */
  private talkSeen = new Set<string>();
  private talkAt: Record<string, string> = {};
  private talkPath: Record<string, string[]> = {};
  private endings: Record<string, string> = {};
  /** 253차 — 물어보기: 들어서 알게 된 화제 · 들은 물음 */
  private inqLearned = new Set<string>();
  private inqAsked = new Set<string>();
  /**
   * 165차 — 일지에서 고정한 할 일. **메인 1건 · 서브 1건**만 동시에 고정되고,
   * 「지금 할 일」 창과 필드 화살표가 이 둘을 최우선으로 가리킨다.
   */
  pinned: { main: string | null; sub: string | null } = { main: null, sub: null };
  /** 구 단일 추적 호환 — 메인 고정을 가리킨다 */
  get trackedId(): string | null { return this.pinned.main ?? this.pinned.sub; }
  /** UI 통지 훅 — 퀘 완료/수락/조행록 갱신 (필드 HUD 토스트) */
  onNotify: ((msg: string) => void) | null = null;
  /** 155차 — 재화 지급 훅(토스트). 로그 한 줄로만 오가던 보상을 눈에 보이게 */
  onCoins: ((amount: number, whyKo: string) => void) | null = null;
  onActionProgress: ((key: StoryActionKey, step: number, source?: string) => void) | null = null;

  bind(host: StoryHost): void { this.host = host; }

  // ── 세이브 ──
  serialize(): StorySaveState {
    return {
      quests: this.quests, rep: this.rep, pageCatch: this.pageCatch, day: this.day, traineeDay: this.traineeDay, jobs: this.jobs,
      affinity: this.affinity, choices: this.choices, tracked: this.pinned.main, pinned: { ...this.pinned },
      declined: [...this.declined], failed: [...this.failed], offerCooldown: this.offerCooldown, everDone: [...this.everDone],
      inquiry: { learned: [...this.inqLearned], asked: [...this.inqAsked] },
      talk: { seen: [...this.talkSeen], at: { ...this.talkAt }, path: { ...this.talkPath } },
      endings: { ...this.endings },
    };
  }
  deserialize(s?: StorySaveState): void {
    this.quests = s?.quests ?? {};
    StoryStoreManager.remapPrologue(this.quests);
    this.rep = s?.rep ?? createDefaultReputation();
    this.pageCatch = s?.pageCatch ?? {};
    this.day = s?.day ?? 0;
    this.traineeDay = s?.traineeDay ?? null;
    this.jobs = s?.jobs ?? {};
    this.affinity = s?.affinity ?? {};
    delete this.affinity[''];   // 155차 — 구세이브에 빈 npc id로 쌓인 우호도(M1-01 톤 선택지) 정리
    this.choices = s?.choices ?? {};
    // 구세이브의 단일 추적 값은 해당 할 일의 종류(메인/서브) 칸으로 승계한다.
    this.pinned = { main: s?.pinned?.main ?? null, sub: s?.pinned?.sub ?? null };
    if (!s?.pinned && s?.tracked) {
      const k = getStoryQuest(s.tracked)?.kind;
      if (k === 'sub') this.pinned.sub = s.tracked; else this.pinned.main = s.tracked;
    }
    this.declined = new Set(s?.declined ?? []);
    this.failed = new Set(s?.failed ?? []);   // 286차 — 구세이브는 없다(빈 채로)
    this.offerCooldown = s?.offerCooldown ?? {};
    // 206차 — 구세이브는 지금 끝난 상태인 퀘스트로 채운다
    this.everDone = new Set([...(s?.everDone ?? []), ...Object.entries(this.quests).filter(([, p]) => p.status === 'done').map(([id]) => id)]);
    // 253차 — 물어보기 상태(구세이브는 없다 — 진행으로 저절로 아는 화제는 `learnWhen`이 채운다)
    this.inqLearned = new Set(s?.inquiry?.learned ?? []);
    this.inqAsked = new Set(s?.inquiry?.asked ?? []);
    // 254차 — 이어지는 대화 · 결말(구세이브는 없다 — 빈 채로. 정본 결말은 이미 마친 편에서 채운다)
    this.talkSeen = new Set(s?.talk?.seen ?? []);
    this.talkAt = { ...(s?.talk?.at ?? {}) };
    this.talkPath = { ...(s?.talk?.path ?? {}) };
    this.endings = { ...(s?.endings ?? {}) };
    this.backfillCanonEndings();
    this.refreshAutoQuests();
  }
  resetAll(): void { this.deserialize(undefined); }

  /**
   * 188차 — M1-01 「막차」가 3목표 → 17목표(프롤로그 14개를 앞에 끼움)로 늘었다.
   * 구세이브의 M1-01 진행은 **이미 집을 떠난 사람**이므로 앞 14개를 완료로 채우고 옛 3개 값을 뒤에 붙인다.
   * (완료된 M1-01은 obj를 다시 보지 않으므로 손대지 않아도 되지만, 길이를 맞춰 둔다)
   */
  private static remapPrologue(quests: Record<string, QuestProgress>): void {
    const p = quests['M1-01'];
    const q = getStoryQuest('M1-01');
    if (!p || !q) return;
    const extra = q.objectives.length - p.obj.length;
    if (extra <= 0) return;
    const head = q.objectives.slice(0, extra).map((o) => o.target ?? 1);
    p.obj = [...head, ...p.obj];
  }

  // ── 조회 ──
  get storyDay(): number { return this.day; }
  get reputation(): ReputationState { return this.rep; }
  harborRep(regionId: string): number { return this.rep.harbor[regionId] ?? 0; }
  get seaRep(): number { return this.rep.sea; }

  progress(id: string): QuestProgress | undefined {
    if (COLLECT_QUEST_IDS.has(id)) this.syncHeldQuestItems(id);   // 234차 — 모으는 목표는 가방 보유 수로
    return this.quests[id];
  }

  /**
   * 234차 — `collect` 목표의 진행 = **지금 가방에 든 그 물건 수**(주운 횟수 누적이 아니다).
   * 버리면 물건은 소멸하고 진행도 같이 내려가 다시 모으면 된다(드롭도 다시 굴러간다).
   * 「다 모았다」고 적혀 있는데 가방은 비어 의뢰인에게 넘길 게 없는 상태가 생기지 않는다.
   * @param only 이 퀘스트만 맞춘다(없으면 진행 중인 모으기 퀘스트 전부)
   * @returns 바뀐 것이 있었는가
   */
  syncHeldQuestItems(only?: string): boolean {
    const h = this.host;
    if (!h?.countItem) return false;
    let changed = false;
    for (const id of only ? [only] : COLLECT_QUEST_IDS) {
      const p = this.quests[id];
      const q = p?.status === 'active' ? getStoryQuest(id) : undefined;
      if (!q || !p) continue;
      q.objectives.forEach((o, i) => {
        if (o.kind !== 'collect' || !o.itemId) return;
        const v = Math.min(this.objectiveTarget(o), h.countItem!(o.itemId));
        if ((p.obj[i] ?? 0) !== v) { p.obj[i] = v; changed = true; }
      });
    }
    if (changed) h.markDirty();
    return changed;
  }

  /**
   * 234차 — 목표 구성이 바뀐 퀘스트의 구세이브 진행을 처음부터 다시 잡는다(목표 배열 길이가 다르면).
   * M1-02 「얼음 나르기」가 2목표(일감 · 상점)에서 4목표(상자 확인 · 운반 · 하역 · 보고)로 바뀌어,
   * 옛 진행값이 엉뚱한 목표 자리에 앉아 상자 없이 막혔다(감사 치명-5).
   * @returns 다시 잡았는가
   */
  resetIfLayoutChanged(id: string): boolean {
    const q = getStoryQuest(id); const p = this.quests[id];
    if (!q || !p || p.status !== 'active' || p.obj.length === q.objectives.length) return false;
    p.obj = q.objectives.map(() => 0);
    p.actionSteps = {}; p.actionChoices = {};
    this.host?.markDirty();
    return true;
  }

  /**
   * 234차 — 지금 이 장소에 닿기를 기다리는 목표가 있는가(진행 중 · 미완 · 차례가 온 `visit`).
   * 필드는 기다리는 목표가 있을 때만 「도착했다」를 알리고 사건을 보낸다 — 퀘스트를 받기 전에 지나간
   * 자리가 그 세션 동안 영영 안 잡히던 문제(감사 치명-4)를 없앤다.
   */
  wantsVisit(placeKey: string): boolean {
    for (const [id, p] of Object.entries(this.quests)) {
      if (p.status !== 'active') continue;
      const q = getStoryQuest(id);
      if (!q) continue;
      for (let i = 0; i < q.objectives.length; i++) {
        const o = q.objectives[i];
        if (o.kind !== 'visit' || o.placeKey !== placeKey || o.manual) continue;
        if (!this.objectiveDone(q, i) && this.objectiveReachable(q, i)) return true;
      }
    }
    return false;
  }
  isDone(id: string): boolean { return this.quests[id]?.status === 'done'; }
  /** 286차 — 실패로 닫혔는가(받는 자리에서 끝내 거절) */
  isFailed(id: string): boolean { return this.failed.has(id); }
  /** 286차 — 닫힌 편 = 끝냈거나 실패로 닫혔다(뒤 편 · 이야기 완주는 이것으로 센다 — 이야기는 나 없이도 흘러간다) */
  isClosed(id: string): boolean { return this.isDone(id) || this.failed.has(id); }
  isActive(id: string): boolean { return this.quests[id]?.status === 'active'; }

  /** 챕터 개방 = 이전 챕터 마지막 메인 완료 (Ch1은 항상) */
  chapterOpen(ch: number): boolean {
    if (ch <= 1) return true;
    const last = lastMainQuestOfChapter(ch - 1);
    return !!last && this.isDone(last.id);
  }
  currentChapter(): number {
    let ch = 1;
    while (ch < 7 && this.chapterOpen(ch + 1)) ch++;
    return ch;
  }

  status(q: StoryQuestDef): QuestStatus {
    const p = this.quests[q.id];
    if (p?.status === 'done') return 'done';
    if (p?.status === 'active') return 'active';
    if (this.failed.has(q.id)) return 'failed';
    if (this.declined.has(q.id)) return 'declined';
    return this.isAvailable(q) ? 'available' : 'locked';
  }
  private isAvailable(q: StoryQuestDef): boolean {
    if (import.meta.env.DEV && this.devOffer.has(q.id)) return true;   // 286차 — dev 「받는 자리부터 다시」
    if (!this.chapterOpen(q.chapter)) return false;
    if (!q.prereq.every((p) => this.isClosed(p))) return false;   // 286차 — 앞 편이 실패로 닫혀도 뒤 편은 열린다
    const lv = this.host?.level() ?? 1;
    if (lv < q.minLevel) return false;
    // 141차 — 발주 정책: 거절 쿨다운 · event 시기 창
    if ((this.offerCooldown[q.id] ?? -1) > this.day) return false;
    if (q.offerPolicy === 'event' && !this.eventWindowOpen(q)) return false;
    return true;
  }
  /** event 정책의 시기 창 — 계절(KST 실제 월)·레벨 구간. event 퀘가 아니면 항상 true */
  eventWindowOpen(q: StoryQuestDef): boolean {
    const e = q.event;
    if (!e) return true;
    if (e.seasons && !e.seasons.includes(seasonOfMonth(this.host?.month() ?? 1))) return false;
    const lv = this.host?.level() ?? 1;
    if (e.levelBand && (lv < e.levelBand[0] || lv > e.levelBand[1])) return false;
    return true;
  }
  /** 왜 지금 못 받는지 한 줄 (일지·대화창) — event/once/쿨다운. 해당 없으면 null */
  offerNoteKo(q: StoryQuestDef): string | null {
    if (this.failed.has(q.id)) return '거절한 의뢰 — 그 일은 내 손을 떠났습니다.';
    if (this.declined.has(q.id)) return '거절한 의뢰 — 다시 오지 않습니다.';
    if ((this.offerCooldown[q.id] ?? -1) > this.day) return `미룬 의뢰 — ${this.offerCooldown[q.id] - this.day}일 뒤에 다시 찾아옵니다.`;
    if (q.offerPolicy === 'once') return '한 번뿐인 의뢰 — 거절하면 다시 오지 않습니다.';
    if (q.offerPolicy === 'event' && q.event) {
      const parts: string[] = [];
      if (q.event.seasons) parts.push(q.event.seasons.map((x) => ({ spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' })[x]).join('·'));
      if (q.event.levelBand) parts.push(`Lv${q.event.levelBand[0]}~${q.event.levelBand[1]}`);
      return `시기 의뢰 — ${parts.join(' · ')}에만 찾아옵니다.`;
    }
    return null;
  }

  objectiveTarget(o: StoryObjective): number {
    return o.actionKey ? storyActionSpec(o.actionKey).stepsKo.length : (o.target ?? 1);
  }
  objectiveDone(q: StoryQuestDef, i: number): boolean {
    const p = this.quests[q.id];
    if (!p) return false;
    const o = q.objectives[i];
    if (o.actionKey) {
      const savedSteps = p.actionSteps?.[String(i)];
      // action 목표는 절차 전체를 마친 경우에만 완료다. 예전 세이브의
      // `obj: 1`은 첫 행동 진행값으로 읽어야 하며, 완료로 승격하지 않는다.
      return savedSteps !== undefined
        ? savedSteps >= this.objectiveTarget(o)
        : (p.obj[i] ?? 0) >= this.objectiveTarget(o);
    }
    return (p.obj[i] ?? 0) >= this.objectiveTarget(o);
  }
  allObjectivesDone(q: StoryQuestDef): boolean {
    return q.objectives.every((_o, i) => this.objectiveDone(q, i));
  }
  /**
   * 206차 — 처음 진행하는 퀘스트에 **낚싯대로 잡아야 하는 목표**가 지금 열려 있는가.
   * QA: 「밑걸림이 너무 잦아 퀘스트를 진행하기 어렵다 — 처음 1회 진행 시 고려」 → 1인칭 밑걸림 위험을 낮춘다.
   * (한 번 끝낸 퀘스트를 다시 받으면 해당 없음 · 채집·통발 같은 낚싯대 밖 어획은 제외)
   */
  firstRunRodObjectiveOpen(): boolean {
    for (const [id, p] of Object.entries(this.quests)) {
      if (p.status !== 'active' || this.everDone.has(id)) continue;
      const q = getStoryQuest(id);
      if (!q) continue;
      for (let i = 0; i < q.objectives.length; i++) {
        const o = q.objectives[i];
        if (o.kind !== 'catch' && o.kind !== 'release') continue;
        if (o.method && o.method !== 'rod') continue;
        if (this.objectiveDone(q, i) || !this.objectiveReachable(q, i)) continue;
        return true;
      }
    }
    return false;
  }
  /**
   * 289차 — 지금 열린 낚싯대 어획 목표의 어종(사용자 결정 D1 「드물게」 — 이야기가 찾는 어종은 그 자리에서도 아주 드물지는 않다).
   * 1인칭 스폰 문맥 `storyTargets`로 간다. 어종이 없는 목표(「아무거나 한 마리」)는 뺀다.
   */
  rodCatchTargets(): string[] {
    const out = new Set<string>();
    for (const [id, p] of Object.entries(this.quests)) {
      if (p.status !== 'active') continue;
      const q = getStoryQuest(id);
      if (!q) continue;
      for (let i = 0; i < q.objectives.length; i++) {
        const o = q.objectives[i];
        if (o.kind !== 'catch' || !o.speciesId) continue;
        if (o.method && o.method !== 'rod') continue;
        if (this.objectiveDone(q, i) || !this.objectiveReachable(q, i)) continue;
        out.add(o.speciesId);
      }
    }
    return [...out];
  }
  /** 188차 — 순서형 퀘스트(`ordered`)는 앞 목표를 다 닫아야 이 목표를 받는다 */
  objectiveReachable(q: StoryQuestDef, i: number): boolean {
    if (!q.ordered) return true;
    for (let k = 0; k < i; k++) if (!this.objectiveDone(q, k)) return false;
    return true;
  }

  /**
   * 188차 — 목표 진행값을 직접 맞춘다(프롤로그 동기화 `story/Prologue.ts` 전용).
   * 순서형이면 앞 목표가 남았을 때 거부한다. 값은 줄이지 않는다(되감기 금지).
   * @returns 이번 호출로 목표가 새로 닫혔는가
   */
  setObjectiveProgress(questId: string, i: number, value: number): boolean {
    const q = getStoryQuest(questId); const p = this.quests[questId];
    if (!q || !p || p.status !== 'active' || !q.objectives[i]) return false;
    if (!this.objectiveReachable(q, i) || this.objectiveDone(q, i)) return false;
    const o = q.objectives[i];
    const v = Math.min(this.objectiveTarget(o), Math.max(p.obj[i] ?? 0, value));
    if (v === (p.obj[i] ?? 0)) return false;
    p.obj[i] = v;
    const done = this.objectiveDone(q, i);
    if (done) { this.onNotify?.(`[할 일] ${q.titleKo} — ${o.labelKo} 달성`); LedgerStore.objective(); }
    if (q.giver === '' && this.allObjectivesDone(q)) this.complete(q.id);
    this.host?.markDirty();
    return done;
  }

  /**
   * NPC 대화용 — 이 NPC가 발주한 퀘스트 분류.
   * 140차: 우호도가 `subGateMin` 미만이면 **서브** 발주는 감춘다(`refusedSub`에 표시용으로 남긴다).
   * 메인은 우호도와 무관하게 항상 발주한다 — 메인 스트림 불침범.
   */
  questsForNpc(npcId: string, regionId?: string): { completable: StoryQuestDef[]; active: StoryQuestDef[]; offer: StoryQuestDef[]; refusedSub: StoryQuestDef[] } {
    const mine = STORY_QUESTS.filter((q) => q.giver === npcId);
    // 286차 — 그 땅에서 꺼내는 이야기(`offerRegion`)는 그 지역에서 만났을 때만 받는다(떠돌이 바람 — 「해녀의 딸」은 서귀포)
    const avail = mine.filter((q) => this.status(q) === 'available' && (!q.offerRegion || !regionId || q.offerRegion === regionId));
    const open = canOfferSubQuest(this.affinityOf(npcId));
    return {
      completable: mine.filter((q) => this.isActive(q.id) && this.allObjectivesDone(q)),
      active: mine.filter((q) => this.isActive(q.id) && !this.allObjectivesDone(q)),
      offer: avail.filter((q) => q.kind === 'main' || open),
      refusedSub: open ? [] : avail.filter((q) => q.kind === 'sub'),
    };
  }

  /**
   * 167차 — 장면으로만 닫히는 목표인가. `talk` 전부 + 자동 추적기·행동 키가 없는 수동 목표
   * (boatTrip·survive·holdPosition·deliverFree·furnish·mine·farm — 시스템이 도착하기 전까지).
   * 대화창 클릭 한 번으로 닫히던 자리가 전부 여기로 온다.
   */
  isSceneObjective(o: StoryObjective): boolean {
    return o.kind === 'talk' || (!!o.manual && !o.actionKey);
  }

  /** 장면의 상대 인물 — `talk`는 그 사람, 나머지 수동 목표는 발주자. 발주자가 없으면 혼자(`''`). */
  sceneNpcOf(q: StoryQuestDef, o: StoryObjective): string {
    return o.npcId ?? q.giver ?? '';
  }

  /** 지금 필드에 서 있는 스토리 인물 — 씬이 배치할 때 알려 준다(장면 입구 판정용) */
  private fieldNpcIds: string[] = [];
  setFieldNpcs(ids: readonly string[]): void { this.fieldNpcIds = [...ids]; }

  /**
   * 장면의 **입구**가 되는 인물 — 상대가 이 필드에 있으면 그 사람, 없으면 발주자(그 사람은 임시 배우로 걸어온다).
   * 둘 다 없으면 `''`(이 지역에서는 열 수 없다).
   */
  sceneEntryNpc(q: StoryQuestDef, o: StoryObjective): string {
    const who = this.sceneNpcOf(q, o);
    if (who && this.fieldNpcIds.includes(who)) return who;
    if (q.giver && this.fieldNpcIds.includes(q.giver)) return q.giver;
    return this.fieldNpcIds.length ? '' : who;
  }

  /**
   * 이 사람에게 말을 걸면 이어지는 장면들 — 활성 퀘스트 중 앞 목표가 다 끝나 **지금 차례인** 장면 목표만.
   * 발주자가 아닌 인물(예: 정옥선 앞 M1-01)도 여기서 잡힌다.
   */
  sceneObjectivesFor(npcId: string): { questId: string; objectiveIndex: number; labelKo: string; main: boolean }[] {
    const out: { questId: string; objectiveIndex: number; labelKo: string; main: boolean }[] = [];
    for (const q of STORY_QUESTS) {
      if (!this.isActive(q.id)) continue;
      const i = q.objectives.findIndex((_o, k) => !this.objectiveDone(q, k));
      if (i < 0) continue;
      const o = q.objectives[i];
      if (!this.isSceneObjective(o) || this.sceneEntryNpc(q, o) !== npcId) continue;
      out.push({ questId: q.id, objectiveIndex: i, labelKo: o.labelKo, main: q.kind === 'main' });
    }
    return out.sort((a, b) => Number(b.main) - Number(a.main));
  }

  // ── 우호도 · 선택지 (140차) ──
  affinityOf(npcId: string): number { return this.affinity[npcId] ?? 0; }

  /** 253차 — 지금 보여 줄 나이 · 직업 한 줄(밝혀지기 전이면 가린 쪽 — R2) */
  npcRole(npcId: string): { ko: string; en: string } {
    const n = getStoryNpc(npcId);
    if (!n) return { ko: '', en: '' };
    const v = n.veil;
    if (v && !this.quests[v.untilSeen] && !this.everDone.has(v.untilSeen)) return { ko: v.roleKo, en: v.roleEn };
    // 254차 — 결말이 바꾼 한 줄(가게를 접었다 등 — 영구 피해)
    const r = npcEndingRole(npcId, this.reachedEndings());
    if (r) return r;
    return { ko: n.roleKo, en: n.roleEn };
  }

  // ── 253차 물어보기(조사 대화) ──
  /** 판정 문맥 — 편 상태 · 장 · 플래그 · 우호도 · 세이브의 알게 된 화제와 들은 물음 */
  inquiryCtx(): InquiryCtx {
    return {
      learned: this.inqLearned, asked: this.inqAsked,
      questState: (id) => (this.quests[id]?.status === 'active' ? 'active' : (this.quests[id]?.status === 'done' || this.everDone.has(id)) ? 'done' : 'none'),
      chapter: this.currentChapter(),
      hasFlag: (k) => this.host?.hasFlag(k) ?? false,
      affinity: (npc) => this.affinityOf(npc),
    };
  }
  /** 이 사람에게 물을 수 있는 화제(새 물음이 있는 화제가 앞) */
  inquiryTopics(npcId: string): InquiryTopicEntry[] { return inquiryTopicsFor(npcId, this.inquiryCtx()); }
  /** 이 물음 다음 꼬리 질문 */
  inquiryFollowUps(nodeId: string): InquiryNodeDef[] { return inquiryFollowUps(nodeId, this.inquiryCtx()); }
  inquiryAsked(nodeId: string): boolean { return this.inqAsked.has(nodeId); }
  /** 아는 화제 전부(노트) */
  inquiryKnownTopics(): InquiryTopicDef[] { return inquiryKnownTopics(this.inquiryCtx()); }

  /** 이 행동 목표를 물어보기가 이끄는가 — 진행 중 화면이 「방식 고르기」 대신 물음을 낸다 */
  inquiryDrivesAction(questId: string, objIdx: number): boolean { return inquiryDrivesAction(questId, objIdx); }

  /**
   * 진행 중 화면의 조사 물음 — 그 편이 진행 중일 때 열리는 곁물음 + **지금 단계**의 열쇠 물음.
   * 열쇠 물음은 그 단계가 의뢰인 앞에서 여는 단계이고, 앞 목표가 끝났을 때만 나온다(먼저 물어 버려 단계를 못 여는 일이 없게).
   */
  inquiryQuestNodes(npcId: string, questId: string, objIdx: number): InquiryNodeDef[] {
    const step = this.actionStep(questId, objIdx);
    const open = this.canPerformAction(questId, objIdx, step) && this.actionStepIsChoice(questId, objIdx);
    return inquiryNodesForQuest(npcId, questId, objIdx, this.inquiryCtx())
      .filter((n) => !n.effect?.action || (open && n.effect.action.step === step));
  }

  /**
   * 묻는다. 처음 듣는 물음이면 우호도 · 플래그 · 화제 열기를 적용하고, 열쇠 물음이면(지금 단계가 맞을 때 — 다시 받은 편도)
   * 그 행동 단계를 연다. 반환 = 새로 알게 된 화제 · 처음인가 · 단계가 올랐는가.
   */
  inquiryAsk(nodeId: string): { node: InquiryNodeDef; first: boolean; learned: InquiryTopicDef[]; advanced: boolean } | null {
    const node = inquiryNode(nodeId);
    if (!node) return null;
    const before = new Set(inquiryKnownTopics(this.inquiryCtx()).map((t) => t.id));
    const first = !this.inqAsked.has(node.id);
    this.inqAsked.add(node.id);
    if (first) {
      for (const tId of node.opens ?? []) this.inqLearned.add(tId);
      const e = node.effect;
      if (e?.affinity) this.addAffinity(node.npcId, e.affinity);
      if (e?.flag) this.host?.setFlag(e.flag, true);
    }
    let advanced = false;
    const a = node.effect?.action;
    if (a) {
      const q = getStoryQuest(a.questId); const p = this.quests[a.questId]; const o = q?.objectives[a.objectiveIndex];
      const step = this.actionStep(a.questId, a.objectiveIndex);
      if (q && p && o?.actionKey && step === a.step && this.canPerformAction(a.questId, a.objectiveIndex, step)
        && this.actionStepIsChoice(a.questId, a.objectiveIndex)) {
        p.actionChoices = { ...(p.actionChoices ?? {}), [`${a.objectiveIndex}:${step}`]: `inq:${node.id}` };
        this.emitAction(o.actionKey, 'action-choice:inquiry');
        advanced = this.actionStep(a.questId, a.objectiveIndex) > step || this.objectiveDone(q, a.objectiveIndex);
      }
    }
    const learned = inquiryKnownTopics(this.inquiryCtx()).filter((t) => !before.has(t.id));
    this.host?.markDirty();
    return { node, first, learned, advanced };
  }
  addAffinity(npcId: string, d: number): number {
    const before = this.affinityOf(npcId);
    let v = clampAffinity(before + d);
    // 254차 — 결말이 건 영영 상한(사이가 영구히 상했다) — 오르는 쪽만 막는다
    const cap = npcAffinityCap(npcId, this.reachedEndings());
    if (cap !== undefined && d > 0) v = Math.min(v, Math.max(before, cap));
    LedgerStore.affinity(npcId, v - before);   // 211차 — 실제로 바뀐 만큼
    if (v !== 0) this.affinity[npcId] = v; else delete this.affinity[npcId];
    this.host?.markDirty();
    return v;
  }
  /** 선택지 노출 판정 컨텍스트 */
  choiceCtx(npcId: string): ChoiceCtx {
    return {
      affinity: this.affinityOf(npcId), level: this.host?.level() ?? 1,
      licenses: this.host?.heldLicenses() ?? [], hasFlag: (k) => this.host?.hasFlag(k) ?? false,
    };
  }
  /** 지금 보이는 선택지 목록 (조건 미충족은 감춘다 — 조건이 무엇인지는 데이터가 안다) */
  visibleChoices(q: StoryQuestDef, stage: 'offer' | 'complete'): QuestChoiceDef[] {
    const ctx = this.choiceCtx(q.giver);
    return choicesFor(q)[stage].filter((c) => choiceVisible(c, ctx));
  }
  /**
   * 165차 — 고정 토글. **메인·서브 칸마다 1건**이라 같은 종류를 새로 고정하면 앞의 것이 풀린다.
   *
   * 177차 — 아직 받지 않은(받을 수 있는) 할 일도 고정된다. 구 구현은 수락한 것만 허용해
   * 체크는 그려지는데 아무 일도 일어나지 않았다(사용자 리포트). 완료·잠긴 것은 여전히 못 고정한다.
   */
  setTracked(id: string | null): void {
    if (id === null) { this.pinned = { main: null, sub: null }; this.host?.markDirty(); return; }
    const q = getStoryQuest(id);
    if (!q) return;
    const st = this.status(q);
    if (st !== 'active' && st !== 'available') return;
    const slot: 'main' | 'sub' = q.kind === 'sub' ? 'sub' : 'main';
    this.pinned[slot] = this.pinned[slot] === id ? null : id;
    this.host?.markDirty();
  }

  /** 이 할 일이 고정되어 있는가 */
  isPinned(id: string): boolean { return this.pinned.main === id || this.pinned.sub === id; }

  /** 기록된 선택 (분기 확인·일지 표기) */
  chosen(questId: string): { offer?: string; complete?: string } | undefined { return this.choices[questId]; }

  /** 선택지 결과 적용 — 전부 가산. 반환 = 사용자에게 보여줄 한 줄 요약 */
  /**
   * 고른 답의 결과를 적용하고 **받은 것**(눈에 보이는 몫 — 돈 · 물건 · 스킬 포인트 · 숙련도)만 줄로 돌려준다.
   * 258차 — 우호도 · 항구 신뢰 · 바다 평판 같은 숨은 값과 「이 답으로 — …」 요약은 대화창에 찍지 않는다
   *  (사용자 「인게임에서 유저에게 보여주는 내용이 아니어야 해 … 위키로만」). 낸 돈은 획득 알림(`onCoins`)이 알린다.
   */
  private applyOutcome(q: StoryQuestDef, o: ChoiceOutcome): string[] {
    const h = this.host; const got: string[] = [];
    if (o.coins) { h?.addCoins(o.coins); if (o.coins > 0) got.push(`${o.coins.toLocaleString()}원`); this.onCoins?.(o.coins, q.titleKo); }
    for (const it of o.items ?? []) {
      const ok = h?.giveItem(it.id, it.qty, it.bound) ?? false;   // 234차 — 귀속 표지도 싣는다
      // 188차 — 내부 id(`inv_rod_budget`) 대신 아이템 이름 (R1)
      const name = h?.itemName(it.id) ?? '물건';
      if (ok) got.push(`${name}${it.qty > 1 ? ` ×${it.qty}` : ''}${it.bound ? ' (귀속)' : ''}`);
      else this.onNotify?.(`[할 일] 보상 ${name} — 인벤토리 공간이 부족해 받지 못했습니다`);
    }
    if (o.skillPoints) { h?.addSkillPoints(o.skillPoints); got.push(`스킬 포인트 +${o.skillPoints}`); }
    if (o.proficiency) {
      const n = h?.grantProfXp({ skillId: o.proficiency.skillId, category: o.proficiency.category }, o.proficiency.xp) ?? [];
      if (n.length) got.push(`숙련도 +${o.proficiency.xp}`);
    }
    if (o.proficiencyLevelUp && (h?.grantProfLevelUp(o.proficiencyLevelUp) ?? false)) got.push('숙련도 1레벨');
    // 155차 — 무발주(혼자 하는) 할 일은 우호도를 받을 상대가 없다. 구 코드는 빈 npc id('')에 쌓았다.
    if (o.affinity && q.giver) this.addAffinity(q.giver, o.affinity);
    for (const a of o.affinityOther ?? []) this.addAffinity(a.npcId, a.delta);
    if (o.harborRep) this.addHarborRep(q.region, o.harborRep);
    if (o.seaRep) this.addSeaRep(o.seaRep);
    if (o.flag) h?.setFlag(o.flag, true);
    return got;
  }

  // ── 254차 이어지는 대화(갈래) · 결말 ──
  /** 판정 문맥 — 표시 · 우호도 */
  talkCtx(): TalkCtx {
    return { hasFlag: (k) => this.host?.hasFlag(k) ?? false, affinity: (n) => this.affinityOf(n) };
  }
  /** 받는 자리 대화(있으면 표준 답 대신 돈다) */
  offerTalk(q: StoryQuestDef): StoryTalkDef | undefined { return offerTalkOf(q.id); }
  /** 끝내는 자리 대화 */
  completeTalk(q: StoryQuestDef): StoryTalkDef | undefined { return completeTalkOf(q.id); }
  /** 장면으로 닫히는 목표의 대화 — 지금 차례이고 이 사람과 하는 것만 */
  objectiveTalk(questId: string, objIdx: number, npcId: string): StoryTalkDef | undefined {
    const t = objectiveTalkOf(questId, objIdx);
    return t && t.npcId === npcId ? t : undefined;
  }
  /** 행동 목표의 지금 단계가 의뢰인 앞에서 고르는 단계이고 그 단계의 대화가 있으면 */
  actionTalk(questId: string, objIdx: number): StoryTalkDef | undefined {
    const step = this.actionStep(questId, objIdx);
    if (!this.canPerformAction(questId, objIdx, step) || !this.actionStepIsChoice(questId, objIdx)) return undefined;
    return actionTalkOf(questId, objIdx, step);
  }
  /** 이어 할 단계(하다 만 대화면 그 단계 · 아니면 처음) */
  talkResume(t: StoryTalkDef): string {
    const at = this.talkAt[t.id];
    return at && t.nodes[at] ? at : t.start;
  }
  /** 이 단계에서 지금 보이는 말 */
  talkChoices(t: StoryTalkDef, nodeId: string): TalkChoiceDef[] {
    const n = talkNode(t, nodeId);
    return n ? talkVisibleChoices(n, this.talkCtx()) : [];
  }
  /** 이 말을 전에 골라 본 적이 있는가(우호도는 처음 한 번만 — 일지 · 검증용) */
  talkChosenBefore(t: StoryTalkDef, nodeId: string, choiceId: string): boolean {
    return this.talkSeen.has(`${t.id}/${nodeId}/${choiceId}`);
  }
  /** 고른 길(일지 · 검증용) */
  talkPathOf(talkId: string): readonly string[] { return this.talkPath[talkId] ?? []; }

  /**
   * 말 하나를 고른다. 표시를 남기고(늘) · 우호도는 이 말을 처음 고를 때만 움직이고 · 다음 단계를 기억한다.
   * 끝이면 대화가 열린 자리의 일을 한다 — 받기/미루기 · 목표 닫기 · 행동 단계 올리기 · 마침(보상 답 · 결말).
   * 끝의 일이 거절되면(가방 자리 등) 대화는 이 단계에 머물러 다시 고를 수 있다.
   */
  talkChoose(t: StoryTalkDef, nodeId: string, choiceId: string): TalkStepResult | null {
    const node = talkNode(t, nodeId);
    const c = node?.choices.find((x) => x.id === choiceId);
    if (!node || !c || !talkGateOk(c.requires, this.talkCtx())) return null;
    const q = getStoryQuest(t.questId);
    if (!q) return null;
    const key = `${t.id}/${nodeId}/${c.id}`;
    const first = !this.talkSeen.has(key);
    this.talkSeen.add(key);
    for (const f of c.flags ?? []) this.host?.setFlag(f, true);
    const moved: { npcId: string; delta: number }[] = [];
    if (first) {
      for (const [npc, d] of Object.entries(c.affinity ?? {})) {
        const before = this.affinityOf(npc);
        const after = this.addAffinity(npc, d);
        if (Math.abs(after - before) > 1e-9) moved.push({ npcId: npc, delta: Math.round((after - before) * 100) / 100 });
      }
    }
    // 일지 · 검증용 길 — 처음 단계에서 다시 시작하면 새로 적는다
    const path = nodeId === t.start ? [] : [...(this.talkPath[t.id] ?? [])];
    path.push(`${nodeId}/${c.id}`);
    this.talkPath[t.id] = path.slice(-24);
    if (c.next) {
      this.talkAt[t.id] = c.next;
      this.host?.markDirty();
      return { ok: true, next: c.next, moved };
    }
    const end = c.end ?? {};
    const ok = this.talkEnd(t, q, end);
    if (ok) delete this.talkAt[t.id]; else this.talkAt[t.id] = nodeId;
    const ending = ok && t.at === 'complete' ? this.endingOfQuestRun : undefined;
    this.endingOfQuestRun = undefined;
    this.host?.markDirty();
    return { ok, end, moved, ending };
  }
  /**
   * 286차 — 고르지 않고 흐르는 장면의 다음(`next`) · 끝(`end`). 길에 `단계/>`(이어짐) · `단계/.`(끝)을 적는다.
   * 끝의 일이 거절되면(가방 자리 등) 그 단계에 머문다.
   */
  talkContinue(t: StoryTalkDef, nodeId: string): TalkStepResult | null {
    const node = talkNode(t, nodeId);
    const q = getStoryQuest(t.questId);
    if (!node || !q || (!node.next && !node.end)) return null;
    const path = nodeId === t.start ? [] : [...(this.talkPath[t.id] ?? [])];
    path.push(`${nodeId}/${node.next ? '>' : '.'}`);
    this.talkPath[t.id] = path.slice(-24);
    if (node.next) {
      this.talkAt[t.id] = node.next;
      this.host?.markDirty();
      return { ok: true, next: node.next, moved: [] };
    }
    const end = node.end ?? {};
    const ok = this.talkEnd(t, q, end);
    if (ok) delete this.talkAt[t.id]; else this.talkAt[t.id] = nodeId;
    const ending = ok && t.at === 'complete' ? this.endingOfQuestRun : undefined;
    this.endingOfQuestRun = undefined;
    this.host?.markDirty();
    return { ok, end, moved: [], ending };
  }

  /**
   * 286차 — 장면 속에서 건네받는다(대본의 `give` 박자): 물건 · 마음 · 표시. **대화마다 한 번만**(다시 열어 같은 장면을 지나도 또 받지 않는다).
   * @returns 받은 물건 이름 · 실제로 움직인 마음 — 이미 받았으면 null
   */
  talkGive(t: StoryTalkDef, nodeId: string, beatIndex: number): { names: string[]; moved: { npcId: string; delta: number }[] } | null {
    const node = talkNode(t, nodeId);
    const b = node?.beats?.[beatIndex];
    if (!b || b.kind !== 'give') return null;
    const key = `${t.id}/${nodeId}/give#${beatIndex}`;
    const itemKey = `${key}/items`;   // 물건은 따로 센다 — 가방이 차서 못 받았으면 다음에 이 장면을 지날 때 다시
    const h = this.host;
    const names: string[] = [];
    const items = b.items ?? [];
    if (items.length && !this.talkSeen.has(itemKey)) {
      const lack = h?.roomFor?.(items.map((it) => ({ id: it.id, qty: it.qty })));   // 자리가 모자라면 그 까닭 글 · 넉넉하면 null
      if (lack) {
        this.onNotify?.(`[할 일] 가방에 자리가 없다 — 한 칸 비우고 다시 「${getStoryQuest(t.questId)?.titleKo ?? ''}」`);
      } else {
        for (const it of items) if (h?.giveItem(it.id, it.qty, false)) names.push(it.qty > 1 ? `${h.itemName(it.id)} ×${it.qty}` : h.itemName(it.id));
        this.talkSeen.add(itemKey);
      }
    }
    if (this.talkSeen.has(key)) {
      if (names.length) this.host?.markDirty();
      return names.length ? { names, moved: [] } : null;
    }
    this.talkSeen.add(key);
    const moved: { npcId: string; delta: number }[] = [];
    for (const [npc, d] of Object.entries(b.affinity ?? {})) {
      const before = this.affinityOf(npc);
      const after = this.addAffinity(npc, d);
      if (Math.abs(after - before) > 1e-9) moved.push({ npcId: npc, delta: Math.round((after - before) * 100) / 100 });
    }
    for (const f of b.flags ?? []) h?.setFlag(f, true);
    const giver = getStoryNpc(b.from)?.nameKo;
    if (names.length) this.onNotify?.(`[할 일] ${giver ? `${giver}${particle(giver, '이', '가')} 건넨 것` : '받은 것'} — ${names.join(' · ')}`);
    this.host?.markDirty();
    return { names, moved };
  }

  /**
   * 286차 — 일지(J)에 남는 대화 요약: 이 편의 대화(받는 자리 → 목표 → 끝내는 자리)를 실제로 지나온 길대로 따라가며
   * 장면 · 고른 말의 한두 문장(`note`)을 잇는다. 대본에 적힌 것만 — 없으면 빈 배열.
   */
  talkNotes(questId: string): { ko: string; en: string }[] {
    const out: { ko: string; en: string }[] = [];
    const order = (x: StoryTalkDef): number => (x.at === 'offer' ? 0 : x.at === 'complete' ? 99 : 1 + (x.objectiveIndex ?? 0));
    const talks = [offerTalkOf(questId), ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => objectiveTalkOf(questId, i)), completeTalkOf(questId)]
      .filter((x): x is StoryTalkDef => !!x).sort((a, b) => order(a) - order(b));
    for (const t of talks) {
      const path = this.talkPath[t.id] ?? [];
      const seenNodes = new Set<string>();
      for (const step of path) {
        const [nid, cid] = step.split('/');
        const n = t.nodes[nid];
        if (!n) continue;
        if (!seenNodes.has(nid) && n.noteKo) { out.push({ ko: n.noteKo, en: n.noteEn ?? n.noteKo }); seenNodes.add(nid); }
        const c = n.choices.find((x) => x.id === cid);
        if (c?.noteKo) out.push({ ko: c.noteKo, en: c.noteEn ?? c.noteKo });
      }
    }
    return out;
  }

  /** `talkEnd`가 이번 마침에서 다다른 결말(결과에 실어 준다) */
  private endingOfQuestRun: StoryEndingDef | undefined;

  /** 대화의 끝 — 대화가 열린 자리마다 할 일 */
  private talkEnd(t: StoryTalkDef, q: StoryQuestDef, end: TalkEndDef): boolean {
    switch (t.at) {
      case 'offer':
        if (end.fail && q.kind === 'sub') { this.failOffer(q); return true; }   // 286차 — 끝내 거절 = 실패
        if (end.decline && q.kind === 'sub') { this.declineOffer(q); return true; }
        return this.accept(q.id, undefined, true);
      case 'objective':
        if (t.objectiveIndex === undefined || this.objectiveDone(q, t.objectiveIndex)) return false;
        this.event({ kind: 'scene', questId: q.id, objectiveIndex: t.objectiveIndex });
        return this.objectiveDone(q, t.objectiveIndex);
      case 'action': {
        const idx = t.objectiveIndex ?? -1; const o = q.objectives[idx]; const p = this.quests[q.id];
        if (!o?.actionKey || !p) return false;
        const step = this.actionStep(q.id, idx);
        p.actionChoices = { ...(p.actionChoices ?? {}), [`${idx}:${step}`]: `talk:${t.id}` };
        this.emitAction(o.actionKey, 'action-choice:talk');
        return this.actionStep(q.id, idx) > step || this.objectiveDone(q, idx);
      }
      case 'complete': {
        const ok = this.complete(q.id, end.complete);
        if (!ok) return false;
        // 결말 — 대화가 고른 결말, 없으면 그 이야기의 결말이 하나뿐일 때 그것(정본)
        const arcId = endingArcOfQuest(q.id);
        const pick = end.ending ? endingById(end.ending) : (arcId && endingsOfArc(arcId).length === 1 ? endingsOfArc(arcId)[0] : undefined);
        if (pick) this.endingOfQuestRun = this.applyEnding(pick.id) ?? undefined;
        return true;
      }
    }
    return false;
  }

  /** 286차 — 받는 자리 대화에서 끝내 거절했다(서브만): 실패로 닫힌다 — 다시 오지 않고, 뒤 편은 열린다 */
  private failOffer(q: StoryQuestDef): void {
    this.failed.add(q.id);
    if (this.pinned.sub === q.id) this.pinned.sub = null;
    if (this.pinned.main === q.id) this.pinned.main = null;
    this.lastAction = 'failed';
    this.host?.markDirty();
    this.onNotify?.(`[할 일] ${q.titleKo} — 실패 (거절)`);
  }

  /** 받는 자리에서 미룬다(서브만) — 표준 미루기 답과 같은 규칙(once = 영영 · event = 쿨다운 · standard = 다음에 다시) */
  private declineOffer(q: StoryQuestDef): void {
    if (q.offerPolicy === 'once') this.declined.add(q.id);
    else if (q.offerPolicy === 'event') this.offerCooldown[q.id] = this.day + (q.event?.cooldownDays ?? 30);
    this.lastAction = 'declined';
    this.host?.markDirty();
    this.onNotify?.(`[할 일] ${q.titleKo} — ${q.offerPolicy === 'once' ? '거절 (다시 오지 않습니다)' : '미룸'}`);
  }

  /**
   * 결말에 다다른다(이야기마다 한 번 — 이미 정해졌으면 그대로). 효과: 우호도 더하기 · 정하기 · 표시.
   * 영영 상한 · 가게 조건 · 직업 한 줄은 저장하지 않고 다다른 결말 표에서 매번 다시 읽는다(`npcShopTerms` 등).
   */
  applyEnding(endingId: string): StoryEndingDef | null {
    const e = endingById(endingId);
    if (!e) return null;
    if (this.endings[e.arcId]) return endingById(this.endings[e.arcId]) ?? null;
    this.endings[e.arcId] = e.id;
    const fx = e.effects ?? {};
    for (const [npc, v] of Object.entries(fx.affinitySet ?? {})) {
      const before = this.affinityOf(npc);
      const after = clampAffinity(v);
      LedgerStore.affinity(npc, after - before);
      if (after !== 0) this.affinity[npc] = after; else delete this.affinity[npc];
    }
    for (const [npc, d] of Object.entries(fx.affinity ?? {})) this.addAffinity(npc, d);
    for (const f of fx.flags ?? []) this.host?.setFlag(f, true);
    this.host?.markDirty();
    this.onNotify?.(`[이야기] 결말 — 「${e.titleKo}」`);
    return e;
  }
  /** 다다른 결말 id들 */
  reachedEndings(): string[] { return Object.values(this.endings); }
  /** 이 이야기의 결말(없으면 undefined) */
  endingOf(arcId: string): StoryEndingDef | undefined {
    const id = this.endings[arcId];
    return id ? endingById(id) : undefined;
  }
  /** 이 사람 가게 조건(결말이 정한 것 — 값 깎기 막힘 · 귀한 물건) */
  shopTermsOf(npcId: string): NpcShopTerms { return npcShopTerms(npcId, this.reachedEndings()); }
  /**
   * 구세이브 — 결말이 하나뿐인 이야기(정본)를 이미 마친 세이브는 결말을 채운다(효과 없는 정본만 — 우호도를 다시 주지 않는다).
   */
  private backfillCanonEndings(): void {
    for (const q of STORY_QUESTS) {
      const arcId = endingArcOfQuest(q.id);
      if (!arcId || this.endings[arcId] || !this.everDone.has(q.id)) continue;
      const list = endingsOfArc(arcId);
      if (list.length === 1 && !list[0].effects) this.endings[arcId] = list[0].id;
    }
  }

  // ── 진행 ──
  accept(id: string, choiceId?: string, fromTalk = false): boolean {
    const q = getStoryQuest(id);
    if (!q || this.status(q) !== 'available') return false;
    // 140차 — 우호도 게이트. 254차 — 받는 자리 대화가 「받는다」로 끝났으면 다시 묻지 않는다
    //  (대화 도중 고른 말로 언짢아졌어도 의뢰인이 일을 건네는 대사로 끝났다 — 게이트는 대화를 열 때 이미 봤다)
    if (!fromTalk && q.kind === 'sub' && q.giver && !canOfferSubQuest(this.affinityOf(q.giver))) return false;
    const c = choiceId ? this.visibleChoices(q, 'offer').find((x) => x.id === choiceId) : undefined;
    // 141차 — 거절 답: once = 영구 소멸 · event = 쿨다운 · standard = 다음 대화에 다시
    if (c?.outcome.decline) {
      this.choices[id] = { ...this.choices[id], offer: c.id };
      this.applyOutcome(q, c.outcome);
      if (q.offerPolicy === 'once') this.declined.add(id);
      else if (q.offerPolicy === 'event') this.offerCooldown[id] = this.day + (q.event?.cooldownDays ?? 30);
      this.lastAction = 'declined';
      this.host?.markDirty();
      this.onNotify?.(`[할 일] ${q.titleKo} — ${q.offerPolicy === 'once' ? '거절 (다시 오지 않습니다)' : '미룸'}`);
      return true;
    }
    // 234차 — 수락하며 받는 물건(답에 딸린 물건 · M1-10 자전거)이 가방에 들어갈 자리부터 본다(못 받으면 다시 얻을 길이 없다)
    this.lastRefusal = null;
    const acceptItems = [...(c?.outcome.items ?? [])];
    if (id === 'M1-10' && !(this.host?.countItem?.('inv_bike') ?? 0)) acceptItems.push({ id: 'inv_bike', qty: 1 });
    // 235차 — N22-7 「씨앗」: 하늬가 건네는 씨앗 봉투(마트에 없는 아욱 · 근대)
    if (id === 'N22-7') acceptItems.push(...N22_7_SEEDS);
    // 237차 — N19-7 「귀퉁이 바구니」: 정옥선의 남는 모종 · 씨앗(그달 심을 수 있는 것 · 겨울은 콩나물 시루까지)
    const okseonGift = id === 'N19-7' ? this.okseonGiftNow() : null;
    if (okseonGift) acceptItems.push(...okseonGift.items);
    const lackAccept = this.rewardRoomShortfall(acceptItems);
    if (lackAccept) {
      this.lastRefusal = lackAccept.replace('보상을 받을', '받을 물건이 들어갈');
      this.onNotify?.(`[할 일] ${this.lastRefusal}`);
      return false;
    }
    this.quests[id] = { status: 'active', obj: q.objectives.map(() => 0), day: this.day };
    // M1-02는 별도 일감 클릭이 아니라 의뢰를 수락하는 순간 실제 퀘스트
    // 오브젝트를 받는다. 이후 확인→운반→하역→보고 순서를 밟아야 한다.
    if (id === 'M1-02') {
      const received = this.host?.giveItem('quest_ice_crate', 1, true) ?? false;
      if (!received) {
        delete this.quests[id];
        this.onNotify?.('[할 일] 얼음 상자를 받을 인벤토리 공간이 없습니다');
        return false;
      }
      this.event({ kind: 'custom', key: 'quest:ice-crate-check' });
    }
    // 188차 — 새 게임은 자전거가 없다(빈손 시작). 「공동작업」의 자전거 수리·탑승 목표에 쓸
    //   어촌계의 낡은 자전거를 수락할 때 내준다(구: dev 시드에만 있어 실플레이로는 R·bikeMount 불가).
    //  234차 — 구세이브(시드 자전거)처럼 가방에 이미 있으면 한 대 더 주지 않는다
    if (id === 'M1-10' && !(this.host?.countItem?.('inv_bike') ?? 0)) this.host?.giveItem('inv_bike', 1, false);
    if (id === 'N22-7') for (const it of N22_7_SEEDS) this.host?.giveItem(it.id, it.qty, false);
    if (okseonGift) this.giveOkseonGift(okseonGift);
    this.lastAction = 'accepted';
    // 140차 — 발주 톤 선택지(우호도 미세 차이)
    if (c) { this.choices[id] = { ...this.choices[id], offer: c.id }; this.applyOutcome(q, c.outcome); }
    // 상태형 목표는 수락 즉시 평가 (레벨·재화·이미 보유한 면허)
    this.evaluateStateful(q);
    this.host?.markDirty();
    this.onNotify?.(`[할 일] ${q.titleKo} 수락`);
    LedgerStore.questAccepted(q.titleKo);   // 211차
    return true;
  }

  /** 237차 — N19-7 수락 때 정옥선이 건넬 것(이달 · 지금 가진 것 기준) */
  private okseonGiftNow(): OkseonSpareGift {
    const h = this.host;
    return okseonSpareGift(h?.month() ?? 4, {
      homi: (h?.countItem?.('farm_homi') ?? 0) > 0,
      sproutJar: h?.hasFurniture?.('sprout_jar') ?? false,
    });
  }

  /** 237차 — 건넨 것을 실제로 지급하고 한 줄로 알린다(가방 자리는 수락 전에 이미 봤다) */
  private giveOkseonGift(g: OkseonSpareGift): void {
    const h = this.host;
    if (!h) return;
    const names: string[] = [];
    for (const it of g.items) if (h.giveItem(it.id, it.qty, false)) names.push(it.qty > 1 ? `${h.itemName(it.id)} ×${it.qty}` : h.itemName(it.id));
    if (g.furniture && h.giveFurniture?.(g.furniture)) names.push('콩나물 시루(집으로 배달)');
    if (names.length) this.onNotify?.(`[할 일] 정옥선이 건넨 것 — ${names.join(' · ')}`);
  }

  /** manual 목표를 한 단계 진행 (장면 끝·행동 이벤트가 부른다 — 구 대화 패널 [다음 단계] 버튼은 167차 폐기) */
  advanceManual(id: string, objIdx: number): boolean {
    const q = getStoryQuest(id); const p = this.quests[id];
    if (!q || !p || p.status !== 'active') return false;
    const o = q.objectives[objIdx];
    if (!o || !o.manual || o.actionKey || this.objectiveDone(q, objIdx)) return false;
    p.obj[objIdx] = (p.obj[objIdx] ?? 0) + 1;
    this.host?.markDirty();
    return true;
  }

  /** 행동 목표의 현재 단계 번호(0부터) */
  actionStep(id: string, objIdx: number): number {
    const q = getStoryQuest(id); const o = q?.objectives[objIdx];
    const total = o?.actionKey ? storyActionSpec(o.actionKey).stepsKo.length : 0;
    const p = this.quests[id];
    const saved = p?.actionSteps?.[String(objIdx)];
    if (saved !== undefined) return Math.min(saved, total);
    return o?.actionKey ? Math.min(p?.obj[objIdx] ?? 0, total) : 0;
  }

  /** 특정 행동 목표가 지금 필드 연출/상호작용을 받을 차례인지 확인한다. */
  canStartAction(id: string, objIdx: number): boolean {
    const q = getStoryQuest(id); const p = this.quests[id]; const o = q?.objectives[objIdx];
    if (!q || !p || p.status !== 'active' || !o?.actionKey || this.objectiveDone(q, objIdx)) return false;
    if (objIdx > 0 && !this.objectiveDone(q, objIdx - 1)) return false;
    return this.actionStep(id, objIdx) === 0;
  }

  /** 시작 이후의 다음 실제 행동도 같은 방식으로 게이트한다. */
  canPerformAction(id: string, objIdx: number, phase: number): boolean {
    const q = getStoryQuest(id); const p = this.quests[id]; const o = q?.objectives[objIdx];
    if (!q || !p || p.status !== 'active' || !o?.actionKey || this.objectiveDone(q, objIdx)) return false;
    if (objIdx > 0 && !this.objectiveDone(q, objIdx - 1)) return false;
    return this.actionStep(id, objIdx) === phase;
  }

  /** 현재 단계가 요구하는 origin을 공개한다. 일반 목표는 null이다. */
  actionExpectedOrigin(id: string, objIdx: number): string | null {
    const q = getStoryQuest(id); const o = q?.objectives[objIdx];
    if (!o?.actionKey) return null;
    const spec = storyActionSpec(o.actionKey);
    return spec.eventOrigins?.[this.actionStep(id, objIdx)] ?? null;
  }

  /**
   * 235차 — 지금 단계가 **의뢰인 앞에서 고르는 단계**인가(대화창 선택 → 장면 → 오름).
   * 출처를 정하지 않은 옛 정의는 계통(대화 · 선택)으로 판단한다.
   */
  actionStepIsChoice(id: string, objIdx: number): boolean {
    const q = getStoryQuest(id); const o = q?.objectives[objIdx];
    if (!o?.actionKey) return false;
    const spec = storyActionSpec(o.actionKey);
    if (spec.eventOrigins?.length) return isChoiceOrigin(spec.eventOrigins[this.actionStep(id, objIdx)]);
    return spec.source === 'dialogue' || spec.source === 'selection';
  }

  /** 235차 — 하루 한 단계 출처를 오늘 이미 썼는가 */
  actionDoneToday(id: string, objIdx: number): boolean {
    return this.quests[id]?.actionDays?.[String(objIdx)] === this.day;
  }

  /** DEV 전용: 선행 퀘스트를 건너뛰고 actionKey 시나리오만 검증한다. */
  devActivateAction(id: string): boolean {
    const q = getStoryQuest(id);
    if (!q || !q.objectives.some((o) => o.actionKey)) return false;
    const first = q.objectives.findIndex((o) => !!o.actionKey);
    this.quests[id] = {
      status: 'active', day: this.day,
      obj: q.objectives.map((o, i) => i < first ? this.objectiveTarget(o) : 0),
      actionSteps: {}, actionChoices: {},
    };
    this.host?.markDirty();
    this.onNotify?.(`[dev] ${q.titleKo} actionKey 시나리오 활성화`);
    return true;
  }

  /**
   * DEV 전용(286차): 편 하나를 **받는 자리부터 다시** — 진행 · 실패 · 거절 · 그 편 대화의 길 · 본 말 · 건네받기를 지우고,
   * 장 · 레벨 · 앞 편 조건 없이 「받을 수 있음」으로 둔다(대본 시범을 몇 번이고 다시 보려고). 세이브의 다른 것은 그대로.
   */
  devOfferQuest(id: string): boolean {
    if (!import.meta.env.DEV) return false;
    const q = getStoryQuest(id);
    if (!q) return false;
    delete this.quests[id];
    this.failed.delete(id); this.declined.delete(id); delete this.offerCooldown[id];
    for (const t of [offerTalkOf(id), completeTalkOf(id), ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => objectiveTalkOf(id, i))]) {
      if (!t) continue;
      delete this.talkAt[t.id]; delete this.talkPath[t.id];
      for (const k of [...this.talkSeen]) if (k.startsWith(`${t.id}/`)) this.talkSeen.delete(k);
    }
    this.devOffer.add(id);
    this.host?.markDirty();
    return true;
  }
  /** 286차 — dev 「받는 자리부터 다시」로 조건을 건너뛰는 편 */
  private devOffer = new Set<string>();

  /** DEV 전용(167차): 아무 퀘스트나 활성화하고 `objIdx` 앞 목표를 채운 상태로 둔다 — 장면 검증용 */
  devActivateQuest(id: string, objIdx = 0): boolean {
    const q = getStoryQuest(id);
    if (!q) return false;
    this.quests[id] = {
      status: 'active', day: this.day,
      obj: q.objectives.map((o, i) => i < objIdx ? this.objectiveTarget(o) : 0),
      actionSteps: {}, actionChoices: {},
    };
    this.host?.markDirty();
    return true;
  }

  /** DEV 전용: 특정 actionKey를 원하는 단계로 되돌려 반복 검증한다. */
  devSetActionStep(id: string, step: number): boolean {
    const q = getStoryQuest(id); const p = this.quests[id];
    const idx = q?.objectives.findIndex((o) => !!o.actionKey) ?? -1;
    if (!q || !p || idx < 0) return false;
    const o = q.objectives[idx]; const total = this.objectiveTarget(o);
    const next = Math.max(0, Math.min(total, Math.floor(step)));
    p.status = 'active'; p.actionSteps = { ...(p.actionSteps ?? {}), [String(idx)]: next }; p.obj[idx] = next;
    this.host?.markDirty();
    return true;
  }

  /** 행동 목표의 한 단계를 수행하고, 마지막 단계에서 action 이벤트를 발행한다 */
  advanceAction(id: string, objIdx: number): boolean {
    const q = getStoryQuest(id); const p = this.quests[id];
    if (!q || !p || p.status !== 'active') return false;
    const o = q.objectives[objIdx];
    if (!o?.actionKey || this.objectiveDone(q, objIdx)) return false;
    if (objIdx > 0 && !this.objectiveDone(q, objIdx - 1)) return false;
    // 레거시/dev 호출도 동일한 실제 행동 이벤트 경로를 사용한다.
    this.emitAction(o.actionKey, 'dialogue-action');
    return true;
  }

  /** 실제 행동 시스템이 발행하는 퀘스트 행동 이벤트 진입점 */
  emitAction(key: StoryActionKey, source?: string): void {
    this.event({ kind: 'action', key, source });
  }

  /** 대화 교차검증·선택형 행동의 분기 선택. 빈 클릭이나 대사 넘김과 분리된 실제 행동이다. */
  chooseAction(id: string, objIdx: number, choiceId: string, deferEmit = false): StoryActionChoice | null {
    const q = getStoryQuest(id); const p = this.quests[id];
    if (!q || !p || p.status !== 'active') return null;
    const o = q.objectives[objIdx];
    if (!o?.actionKey || this.objectiveDone(q, objIdx)) return null;
    if (objIdx > 0 && !this.objectiveDone(q, objIdx - 1)) return null;
    const spec = storyActionSpec(o.actionKey);
    if (spec.choices.length === 0) return null;
    const choice = spec.choices.find((x) => x.id === choiceId);
    if (!choice) return null;
    const step = this.actionStep(id, objIdx);
    const choiceKey = `${objIdx}:${step}`;
    if (p.actionChoices?.[choiceKey]) return null;
    p.actionChoices = { ...(p.actionChoices ?? {}), [choiceKey]: choice.id };
    // 후속 대사·결말이 선택 이력을 읽을 수 있도록 분기 플래그도 남긴다.
    this.host?.setFlag(`choice.action.${o.actionKey}.${choice.id}`, true);
    if (q.giver && choice.affinityDelta) this.addAffinity(q.giver, choice.affinityDelta);
    // 대화·선택은 선택 자체가 해당 행동의 성공 이벤트다. 제작·운반·검사·현장은
    // 선택을 기록한 뒤 실제 시스템 성공 이벤트가 별도로 들어와야 단계가 오른다.
    // 167차 — 대화·선택 계통도 **선택 클릭이 아니라 장면이 끝난 뒤**에 오른다(`deferEmit` — 씬이 장면을
    //  재생하고 `finishActionChoice`를 부른다). 장면을 재생할 수 없는 호출측만 즉시 올린다.
    // 235차 — 계통이 아니라 **지금 단계의 출처**로 판단한다(검사 · 현장 행동도 마지막 단계는 의뢰인 앞 선택이다).
    if (!deferEmit && this.actionStepIsChoice(id, objIdx)) {
      this.emitAction(o.actionKey, `action-choice:${choice.id}`);
    }
    this.onNotify?.(`[할 일] ${q.titleKo} — ${choice.labelKo}`);
    this.host?.markDirty();
    return choice;
  }

  /** 167차 — 대화·선택 계통의 장면이 끝난 뒤 실제 단계를 올린다 */
  finishActionChoice(id: string, objIdx: number, choiceId: string): void {
    const q = getStoryQuest(id); const o = q?.objectives[objIdx];
    if (!o?.actionKey || this.objectiveDone(q!, objIdx)) return;
    this.emitAction(o.actionKey, `action-choice:${choiceId}`);
  }

  /** 234차 — 이 행동 목표의 방식을 의뢰인에게 한 번이라도 골랐는가(단계 무관) */
  private actionEngaged(p: QuestProgress, objIdx: number): boolean {
    return Object.keys(p.actionChoices ?? {}).some((k) => k.startsWith(`${objIdx}:`));
  }

  /** 현재 action 단계에서 이미 전략/대화 선택을 기록했는지 */
  actionChoiceTaken(id: string, objIdx: number): boolean {
    const p = this.quests[id];
    return !!p?.actionChoices?.[`${objIdx}:${this.actionStep(id, objIdx)}`];
  }

  /**
   * 235차 — 계통 없이 **출처 하나**를 알린다(면허 창 · 장비 창 · 전체 지도 · 제작 갈래 · 좌판 판매).
   * 출처를 정한 활성 행동 목표만 후보가 되고, 단계 대조는 `event`가 한다.
   */
  emitActionOrigin(origin: string): void {
    const keys = new Set<StoryActionKey>();
    for (const q of STORY_QUESTS) {
      const p = this.quests[q.id];
      if (!p || p.status !== 'active') continue;
      q.objectives.forEach((o, i) => {
        if (!o.actionKey || this.objectiveDone(q, i)) return;
        if (i > 0 && !this.objectiveDone(q, i - 1)) return;
        const spec = storyActionSpec(o.actionKey);
        if (spec.eventOrigins?.some((e) => originMatches(e, origin))) keys.add(o.actionKey);
      });
    }
    for (const key of keys) this.emitAction(key, origin);
  }

  /**
   * 제작·운반·검사·선택·현장·대화 시스템의 성공 지점에서 호출한다.
   * 현재 활성 목표 중 같은 계통의 actionKey만 수집한 뒤 발행하므로,
   * 비활성 퀘스트나 다른 계통의 수동 목표가 함께 진행되지 않는다.
   */
  emitActionSource(source: StoryActionSource, origin?: string): void {
    const keys = new Set<StoryActionKey>();
    const talkNpc = source === 'dialogue' && origin?.startsWith('talk-action:')
      ? origin.slice('talk-action:'.length) : undefined;
    // 165차 — 같은 계통의 활성 목표가 여럿이면 한 사건에 전부 오르던 중복 매칭을 막는다.
    //  · 사건 출처(`eventOrigins`)를 지정한 목표는 그 출처와 맞을 때만 후보가 된다.
    //  · 출처를 지정하지 않은 일반 목표는 **가장 앞선 활성 할 일 하나**만 오른다(메인 → 서브 순).
    const generic: StoryActionKey[] = [];
    for (const q of [...STORY_QUESTS].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'main' ? -1 : 1))) {
      const p = this.quests[q.id];
      if (!p || p.status !== 'active') continue;
      // 대화 행동은 현재 대화 중인 의뢰 NPC의 목표만 진행한다. 다른 NPC의
      // 대화창을 열어 둔 상태에서 엉뚱한 퀘스트가 오르는 것을 막는다.
      if (talkNpc && q.giver !== talkNpc) continue;
      q.objectives.forEach((o, i) => {
        if (!o.actionKey || this.objectiveDone(q, i)) return;
        if (i > 0 && !this.objectiveDone(q, i - 1)) return;   // 앞 목표가 남았으면 아직 이 행동의 차례가 아니다
        const spec = storyActionSpec(o.actionKey);
        // 235차 — 출처를 정한 목표는 **계통이 아니라 출처로만** 맞춘다(면허 창 하나가 선택 · 검사 계통 둘 다에 걸린다)
        if (spec.eventOrigins?.length) {
          if (origin && spec.eventOrigins.some((e) => originMatches(e, origin))) keys.add(o.actionKey);
          return;
        }
        if (spec.source !== source) return;
        // 234차 — 출처를 정하지 않은 행동 목표가 엉뚱한 사건에 오르던 것을 막는다(감사 중간-2 —
        //  다른 의뢰를 세 번 수락하면 「선장 필기 합격」이 닫히고, 아무 일감 세 번에 「받침 전달」이 끝났다).
        //  · 대화 · 선택 계통은 의뢰인 앞에서 고른 답 → 장면(`finishActionChoice`)으로만 오른다.
        //  · 제작 · 운반 · 검사 · 현장 계통은 의뢰인에게 그 목표의 방식을 고른 뒤의 사건만 센다.
        if (spec.source === 'dialogue' || spec.source === 'selection') return;
        if (!this.actionEngaged(p, i)) return;
        generic.push(o.actionKey);
      });
    }
    if (generic.length) keys.add(generic[0]);
    for (const key of keys) this.emitAction(key, origin ?? source);
  }

  /** 직전 완료의 고정 보상 요약(141차 — 경험치·재화·면허·귀속 장비·해금). 완료 뒤에만 보인다 */
  lastRewardLines: string[] = [];
  /** 직전 accept/complete가 무엇이었나 (대화창 응답 화면 분기) */
  lastAction: 'accepted' | 'declined' | 'completed' | 'failed' | null = null;
  /** 234차 — 직전 accept/complete가 거절된 까닭(가방 자리 부족 등). 대화창이 「지금은 진행할 수 없습니다」 대신 보여 준다 */
  lastRefusal: string | null = null;

  /**
   * 234차 — 이 보상들이 가방에 다 들어가는가. 모자라면 까닭 한 줄(대화창 · 알림용), 다 들어가면 null.
   * 받지 못한 보상은 다시 얻을 길이 없으므로 **주기 전에** 막는다(감사 높음-1).
   */
  private rewardRoomShortfall(items: readonly { id: string; qty: number }[]): string | null {
    if (!items.length || !this.host?.roomFor) return null;
    const lack = this.host.roomFor(items);
    return lack ? `보상을 받을 가방 자리가 없습니다 — ${lack}를 비운 뒤 다시 말을 거세요` : null;   // lack은 늘 「…칸 N개」로 끝난다
  }

  /**
   * 완료 + 보상 지급. 목표 미달이면 false.
   * 140차: 완료 선택지(`choiceId`)의 결과를 **가산**하고, 서브 퀘 재화·XP에 우호도 배율을 곱한다
   * (메인 XP는 §8-1 계약 그대로 · 메인 재화는 1±0.1 밴드).
   */
  complete(id: string, choiceId?: string): boolean {
    const q = getStoryQuest(id); const p = this.quests[id];
    this.lastRefusal = null;
    if (q && COLLECT_QUEST_IDS.has(id)) this.syncHeldQuestItems(id);   // 234차 — 모은 물건은 지금 가방에 든 수로
    if (!q || !p || p.status !== 'active' || !this.allObjectivesDone(q)) return false;
    const choice = choiceId ? this.visibleChoices(q, 'complete').find((c) => c.id === choiceId) : undefined;
    // 234차 — 보상 물건(고정 보상 + 고른 답의 물건)이 가방에 다 들어가야 완료한다. 모자라면 완료하지 않고 까닭을 알린다
    const lack = this.rewardRoomShortfall([...(q.rewards?.items ?? []), ...(choice?.outcome.items ?? [])]);
    if (lack) { this.lastRefusal = lack; this.onNotify?.(`[할 일] ${lack}`); return false; }
    p.status = 'done'; p.day = this.day;
    this.everDone.add(id);
    const h = this.host;
    const aff = this.affinityOf(q.giver);
    const xpMult = affinityRewardMult(aff, q.kind, 'xp') * (q.kind === 'sub' ? (choice?.outcome.xpMult ?? 1) : 1);
    const coinMult = affinityRewardMult(aff, q.kind, 'coins');
    const xp = Math.round(q.xp * xpMult);
    h?.grantXp(xp);
    const rwl: string[] = [`경험치 +${xp.toLocaleString()}`];
    if (q.rewards?.coins) { const c = Math.round(q.rewards.coins * coinMult); h?.addCoins(c); rwl.push(`${c.toLocaleString()}원`); this.onCoins?.(c, q.titleKo); }
    for (const lic of q.rewards?.licenses ?? []) { h?.acquireLicense(lic); rwl.push(`자격: ${getLicenseByType(lic as never)?.nameKo ?? lic}`); }
    // 140차 — 아이템 보상 실지급. 141차 — 귀속(bound) 플래그를 실어 준다. 공간 부족은 안내로 남긴다.
    for (const it of q.rewards?.items ?? []) {
      const name = h?.itemName(it.id) ?? it.id;
      if (h?.giveItem(it.id, it.qty, it.bound)) rwl.push(`${name}${it.qty > 1 ? ` ×${it.qty}` : ''}${it.bound ? ' (귀속)' : ''}`);
      else this.onNotify?.(`[할 일] 보상 ${name} — 인벤토리 공간이 부족해 받지 못했습니다`);
    }
    // 141차 — 기술·상점 해금 (스킬 게이트는 questsDone으로, 상점은 플래그로)
    for (const sk of q.rewards?.skillUnlocks ?? []) {
      h?.setFlag(`unlock.skill.${sk}`, true);
      // 222차 — 아직 없는 시스템에 걸린 스킬은 「해금」이라고 말하지 않는다(배울 수 없으니까)
      if (!getSkillById(sk)?.pendingSystem) rwl.push(`기술 해금: ${getSkillById(sk)?.nameKo ?? sk}`);
    }
    for (const sh of q.rewards?.shopUnlocks ?? []) { h?.setFlag(`unlock.shop.${sh}`, true); rwl.push('상점 품목 해금'); }
    // 188차 — '지역 개방: busan'처럼 지역 id가 나갔다(R1) → 지역 이름
    if (q.unlocks?.length) rwl.push(...q.unlocks.filter((u) => u.startsWith('region:')).map((u) => `지역 개방: ${getRegionById(u.slice(7))?.nameKo ?? '새 지역'}`));
    this.lastRewardLines = rwl;
    this.lastAction = 'completed';
    if (this.pinned.main === id) this.pinned.main = null;
    if (this.pinned.sub === id) this.pinned.sub = null;
    // 258차 — 답의 몫은 「받은 것」에 함께 싣는다. 숨은 값(우호도 · 신뢰 · 평판)과 「이 답으로 — …」 요약은 찍지 않는다(위키에만)
    if (choice) { this.choices[id] = { ...this.choices[id], complete: choice.id }; this.lastRewardLines.push(...this.applyOutcome(q, choice.outcome)); }
    if (q.giver) this.addAffinity(q.giver, q.kind === 'sub' ? TUNING.affinity.onSubComplete : TUNING.affinity.onMainComplete);
    if (q.reputation?.sea) this.addSeaRep(q.reputation.sea);
    for (const [r, d] of Object.entries(q.reputation?.harbor ?? {})) this.addHarborRep(r, d);
    if (q.journalPage) this.pageCatch[String(q.journalPage)] = Math.max(this.pageCatch[String(q.journalPage)] ?? 0, 99);
    for (const u of q.unlocks ?? []) {
      h?.setFlag(`unlock.${u}`, true);
      if (u === 'trainee' && this.traineeDay == null) this.traineeDay = this.day;
    }
    // 233차 — 모은 개인 전용 퀘스트 아이템은 의뢰인에게 넘어간다
    //  234차 — 목표 수를 넘게 쥔 것 · 바닥에 둔 것까지 전부 거둔다(끝난 퀘스트의 물건이 쓸모없이 남지 않게)
    for (const o of q.objectives) if (o.kind === 'collect' && o.itemId) h?.takeQuestItems?.(o.itemId, Number.POSITIVE_INFINITY);
    h?.markQuestDone(id);
    h?.markDirty();
    LedgerStore.questDone(q.titleKo);   // 211차
    this.onNotify?.(`[할 일] ${q.titleKo} 완료 — XP +${xp.toLocaleString()}${xpMult !== 1 ? ` (×${xpMult.toFixed(2)})` : ''}`);
    this.refreshAutoQuests();
    return true;
  }

  /** 무발주(giver '') 퀘스트는 가능해지는 즉시 활성 */
  private refreshAutoQuests(): void {
    for (const q of STORY_QUESTS) {
      if (q.giver === '' && this.status(q) === 'available') {
        this.quests[q.id] = { status: 'active', obj: q.objectives.map(() => 0), day: this.day };
        this.evaluateStateful(q);
      }
    }
  }

  private evaluateStateful(q: StoryQuestDef): void {
    const p = this.quests[q.id]; if (!p) return;
    q.objectives.forEach((o, i) => {
      if (o.kind === 'reachLevel') p.obj[i] = Math.max(p.obj[i] ?? 0, this.host?.level() ?? 1);
      if (o.kind === 'earn') p.obj[i] = Math.max(p.obj[i] ?? 0, this.host?.coins() ?? 0);
      if (o.kind === 'license' && o.licenseId && this.host?.heldLicenses().includes(o.licenseId)) p.obj[i] = this.objectiveTarget(o);
      // 287차 — 「○○에 도착한다」(`region:*`)는 지역에 내릴 때만 셌다 → 그 지역 안에서 받으면 다시 들어올 때까지 안 닫혔다
      //  (포항 남궁현 N10-4 · 울릉 오세라 M6-01 · 태안 M4-07 · N13-3 · 부산 N06-4 — 287 집필 작업자 보고)
      const here = this.host?.currentRegion?.();
      if (o.kind === 'visit' && here && o.placeKey === `region:${here}`) p.obj[i] = this.objectiveTarget(o);
    });
  }

  /** 자동 추적 이벤트 — 활성 퀘 전체의 미완 목표와 대조 */
  /**
   * 233차 — 개인 전용 퀘스트 아이템 드롭. **내 행동에서만, 내 클라이언트가** 굴린다(멀티에서도 남과 공유하지 않는다).
   * 그 퀘스트가 진행 중이고 해당 `collect` 목표가 아직 덜 찼을 때만 나온다. 반환 = 이번에 나온 아이템 이름들.
   */
  rollQuestDrops(ctx: { kind: 'gather' | 'catch'; regionId: string; creatureId?: string; speciesId?: string }, rng: () => number = Math.random): string[] {
    const got: string[] = [];
    for (const d of QUEST_ITEM_DROPS) {
      if (d.on.kind !== ctx.kind) continue;
      if (d.on.regionId && d.on.regionId !== ctx.regionId) continue;
      if (d.on.creatureId && d.on.creatureId !== ctx.creatureId) continue;
      if (d.on.speciesId && d.on.speciesId !== ctx.speciesId) continue;
      const q = getStoryQuest(d.questId); const p = this.quests[d.questId];
      if (!q || !p || p.status !== 'active') continue;
      this.syncHeldQuestItems(d.questId);   // 234차 — 버려서 줄었으면 다시 굴린다
      const idx = q.objectives.findIndex((o) => o.kind === 'collect' && o.itemId === d.itemId);
      if (idx < 0 || this.objectiveDone(q, idx) || !this.objectiveReachable(q, idx)) continue;
      if (rng() >= d.chance) continue;
      if (!this.host?.giveQuestItem?.(d.itemId)) { this.onNotify?.('[할 일] 무언가 눈에 띄었지만 가방에 자리가 없다'); continue; }
      got.push(getQuestItem(d.itemId)?.nameKo ?? d.itemId);
      this.event({ kind: 'questItem', itemId: d.itemId });
    }
    return got;
  }

  event(ev: StoryEvent): void {
    TitleStore.onStoryEvent(ev);   // 203차 — 타이틀 업적도 같은 사건을 센다(어획 · 방생)
    let changed = false;
    // 167차 — 장면 종료 = 그 목표 하나만 닫는다. 다른 퀘스트·다른 목표로 새지 않는다.
    if (ev.kind === 'scene') {
      const q = getStoryQuest(ev.questId); const p = this.quests[ev.questId];
      const o = q?.objectives[ev.objectiveIndex];
      if (!q || !p || p.status !== 'active' || !o || !this.isSceneObjective(o) || this.objectiveDone(q, ev.objectiveIndex)) return;
      if (!this.objectiveReachable(q, ev.objectiveIndex)) return;
      p.obj[ev.objectiveIndex] = this.objectiveTarget(o);
      this.onNotify?.(`[할 일] ${q.titleKo} — ${o.labelKo} 달성`);
      LedgerStore.objective();   // 211차
      if (q.giver === '' && this.allObjectivesDone(q)) this.complete(q.id);
      this.host?.markDirty();
      return;
    }
    for (const q of STORY_QUESTS) {
      const p = this.quests[q.id];
      if (!p || p.status !== 'active') continue;
      q.objectives.forEach((o, i) => {
        if (this.objectiveDone(q, i)) return;
        if (!this.objectiveReachable(q, i)) return;   // 188차 — 순서형(M1-01 프롤로그)
        if (o.manual && ev.kind !== 'talk' && !(ev.kind === 'action' && o.actionKey === ev.key)) return;
        if (ev.kind === 'action' && o.actionKey === ev.key) {
          // actionKey 목표는 한 번의 이벤트로 즉시 완료하지 않는다. 같은 계통의
          // 실제 성공 이벤트가 절차의 각 단계를 순서대로 통과시켜야 한다.
          if (i > 0 && !this.objectiveDone(q, i - 1)) return;
          const spec = storyActionSpec(o.actionKey);
          const expectedOrigin = spec.eventOrigins?.[p.actionSteps?.[String(i)] ?? p.obj[i] ?? 0];
          if (expectedOrigin && !originMatches(expectedOrigin, ev.source)) return;
          // 235차 — 「좌판 사흘 운영」처럼 하루에 한 단계만 오르는 출처
          if (expectedOrigin && DAILY_ACTION_ORIGINS.has(expectedOrigin)) {
            // 같은 날 두 번째 판매부터는 조용히 넘긴다(물건마다 알림이 쏟아지지 않게 — 추적기가 「다음 날」을 말한다)
            if (p.actionDays?.[String(i)] === this.day) return;
            p.actionDays = { ...(p.actionDays ?? {}), [String(i)]: this.day };
          }
          const stepKey = String(i);
          const step = p.actionSteps?.[stepKey] ?? 0;
          const nextStep = Math.min(step + 1, spec.stepsKo.length);
          p.actionSteps = { ...(p.actionSteps ?? {}), [stepKey]: nextStep };
          // 기존 obj 배열도 같은 완료 횟수를 반영해 구 세이브/일지와
          // 신규 actionSteps 세이브가 항상 같은 진행률을 보게 한다.
          p.obj[i] = nextStep;
          changed = true;
          this.onNotify?.(nextStep >= spec.stepsKo.length
            ? `[할 일] ${q.titleKo} — ${spec.stepsKo.length}/${spec.stepsKo.length} (준비 완료!)`
            : `[할 일] ${q.titleKo} — 행동 ${nextStep}/${spec.stepsKo.length}`);
          this.onActionProgress?.(o.actionKey, nextStep, ev.source);
          return;
        }
        const hit = this.match(o, ev);
        if (hit === null) {
          // 149차 — **장소 조건만** 어긋난 어획은 조용히 버리지 않고 이유를 알린다.
          //  (조건 라벨이 "방파제에서"인데 아무 데서나 낚고 목표가 안 차면 버그로 읽힌다)
          if (ev.kind === 'catch' && o.kind === 'catch' && o.spotKind
            && !spotKindSatisfies(o.spotKind, ev.spotKind)
            && this.match({ ...o, spotKind: undefined }, ev) !== null) {
            this.onNotify?.(`[할 일] ${q.titleKo} — ${SPOT_KIND_LABEL[o.spotKind].ko}에서 낚아야 인정됩니다`);
          }
          // 233차 — 거래품이라서만 빠진 경우도 이유를 알린다
          if (o.ownOnly && (ev.kind === 'activity' || ev.kind === 'sell') && ev.traded
            && this.match({ ...o, ownOnly: false }, ev) !== null) {
            this.onNotify?.(`[할 일] ${q.titleKo} — 거래로 받은 것은 인정되지 않습니다. 직접 마련해야 합니다`);
          }
          return;
        }
        p.obj[i] = hit === 'set' ? this.setValue(o, ev) : (p.obj[i] ?? 0) + 1;
        changed = true;
        if (this.objectiveDone(q, i)) { this.onNotify?.(`[할 일] ${q.titleKo} — ${o.labelKo} 달성`); LedgerStore.objective(); }
      });
    }
    // 조행록 — 제철 자가어획 누적 (퀘스트와 무관하게 언제나)
    if (ev.kind === 'catch' && ev.selfCaught) {
      const season = seasonOfMonth(ev.month);
      for (const pg of JOURNAL_PAGES) {
        if (!journalCatchMatches(pg, { speciesId: ev.speciesId, lengthCm: ev.lengthCm, season, selfCaught: true })) continue;
        const k = String(pg.page);
        const before = this.pageCatch[k] ?? 0;
        if (before >= (pg.count ?? 1)) continue;
        this.pageCatch[k] = before + 1;
        changed = true;
        if (this.pageCatch[k] >= (pg.count ?? 1)) this.onNotify?.(`[조행록] ${pg.page}장 지표 어종 어획 — ${pg.labelKo}`);
      }
    }
    if (ev.kind === 'level') this.refreshAutoQuests();
    // 무발주 퀘는 목표를 다 채우면 스스로 완료된다 (M1-01 「막차」 · M7-08 「실습생」)
    for (const q of STORY_QUESTS) if (q.giver === '' && this.isActive(q.id) && this.allObjectivesDone(q)) this.complete(q.id);
    if (changed) this.host?.markDirty();
  }

  /** null = 무관 / 'inc' = +1 / 'set' = 값 대입 */
  private match(o: StoryObjective, ev: StoryEvent): 'inc' | 'set' | null {
    switch (ev.kind) {
      case 'catch':
        if (o.kind !== 'catch') return null;
        if (o.speciesId && o.speciesId !== ev.speciesId) return null;
        if (o.minCm && ev.lengthCm < o.minCm) return null;
        if (o.season && !o.season.includes(seasonOfMonth(ev.month))) return null;
        if (o.method && o.method !== ev.method) return null;
        if (o.selfCaught && !ev.selfCaught) return null;
        // 149차 — 장소 조건("방파제에서 낚기")을 실제로 강제한다. 구멍치기는 방파제도 만족.
        if (o.spotKind && !spotKindSatisfies(o.spotKind, ev.spotKind)) return null;
        return 'inc';
      case 'release':
        if (o.kind !== 'release') return null;
        if (o.speciesId && o.speciesId !== ev.speciesId) return null;
        return 'inc';
      case 'activity': {
        const map: Record<string, StoryObjective['kind']> = { butcher: 'butcher', sashimi: 'sashimi', forage: 'gather', craft: 'craft', cook: 'cook' };
        if (o.kind !== map[ev.activity]) return null;
        if (o.itemId && ev.itemId && o.itemId !== ev.itemId) return null;
        if (o.ownOnly && ev.traded) return null;   // 233차 — 까다로운 퀘스트는 직접 마련한 것만
        if (o.regionId && ev.regionId !== o.regionId) return null;   // 286차 — 「제주 물가에서」 같은 지역 조건
        return 'inc';
      }
      case 'license': return o.kind === 'license' && (!o.licenseId || o.licenseId === ev.licenseId) ? 'set' : null;
      case 'trap': return o.kind === 'trap' ? 'inc' : null;
      // 235차 — 「심는다」 목표는 심기를 센다(작물을 정하면 그 작물만) · 237차 `farmAction: 'harvest'`는 거두기를 센다
      case 'farm': return o.kind === 'farm' && ev.action === (o.farmAction ?? 'plant') && (!o.itemId || o.itemId === ev.cropId) ? 'inc' : null;
      case 'sell': return o.kind === 'sell' && !(o.ownOnly && ev.traded) ? 'inc' : null;
      // 234차 — 진행 = 가방 보유 수(`setValue`) — 버리면 줄고 다시 주우면 는다
      case 'questItem': return o.kind === 'collect' && o.itemId === ev.itemId ? (this.host?.countItem ? 'set' : 'inc') : null;
      case 'visit': return o.kind === 'visit' && o.placeKey === ev.placeKey ? 'inc' : null;
      case 'custom':
        if (o.kind === 'custom' && o.placeKey === ev.key) return 'inc';
        // 어촌계 공동작업 일감은 `communityWork` 목표도 닫는다 (135차 — 일감 = 실시스템)
        if (o.kind === 'communityWork' && ev.key === 'job:coop_work') return 'inc';
        return null;
      case 'action': return o.actionKey === ev.key ? 'inc' : null;
      case 'talk': return null;   // 167차 — 대화를 여는 것은 행동이 아니다. talk 목표는 `scene`으로만 닫힌다
      case 'scene': return null;  // event() 상단에서 전용 처리
      case 'level': return o.kind === 'reachLevel' ? 'set' : null;
      case 'coins': return o.kind === 'earn' ? 'set' : null;
      case 'cull':
        if (o.kind !== 'cull') return null;
        if (o.speciesId && o.speciesId !== ev.speciesId) return null;
        return 'inc';
      default: return null;
    }
  }
  private setValue(o: StoryObjective, ev: StoryEvent): number {
    if (ev.kind === 'level') return ev.level;
    if (ev.kind === 'coins') return ev.coins;
    if (ev.kind === 'questItem') return Math.min(this.objectiveTarget(o), this.host?.countItem?.(ev.itemId) ?? 0);
    return this.objectiveTarget(o);
  }

  // ── 날짜 · 기한 ──
  advanceDay(): number {
    this.day++;
    this.applyDeadlinePenalty();
    this.host?.markDirty();
    return this.day;
  }

  /**
   * 기한 초과 벌칙 (147차 — `deadline.onMiss: 'cost'`의 실구현).
   *
   * ⚖ **재화가 아니라 항구 평판을 깎는다**(사용자 결정). M1-06을 끝내면 어획물 판매가
   *   전면 막히고 `reported_fishery`는 M1-11 총회에서야 나오므로, 그 구간에서 재화를
   *   빼앗으면 회복 불가능한 상태가 만들어진다. 평판은 일을 더 해서 되돌릴 수 있다.
   *   `TUNING.story.missCostKrw`는 하드코어 프리셋용으로 남겨 두고 배선하지 않는다.
   *
   * 하루 넘길 때마다 한 번씩 깎이고, 평판 하한(0)에서 자연히 멈춘다.
   */
  private applyDeadlinePenalty(): void {
    const left = this.deadlineDaysLeft();
    if (left === null || left >= 0) return;
    const d = TUNING.story.missRepPerDay;
    if (d <= 0) return;
    this.addHarborRep(this.homeRegionId, -d);
  }

  /**
   * 총회 연출을 열 때인가 (147차) — M1-11이 진행 중이고 레벨 목표는 채웠는데
   * 아직 총회에 서지 않았다. 계장(`coop`)과 대화를 여는 순간 이 장면이 먼저 나온다.
   */
  meetingReady(): boolean {
    const p = this.quests['M1-11'];
    if (!p || p.status !== 'active') return false;
    const q = getStoryQuest('M1-11');
    if (!q) return false;
    return this.objectiveDone(q, 0) && !this.objectiveDone(q, 1);
  }

  /** 기한·총회 기준 항구 (Ch1 무대) */
  private get homeRegionId(): string { return 'gangwon_sokcho'; }

  /**
   * 총회 표결 (147차 — 평판 소비처 ②).
   *
   * ⚠ **부결은 없다.** 진행이 막히는 무작위를 만들지 않는다는 설계 원칙(138차 §3)에 따라
   *   가결은 보장하고 **찬성률만** 평판에 따라 달라진다. 찬성률이 높으면 그만큼 항구 평판이
   *   더 붙어, "이미 신뢰를 쌓아 둔 사람은 시작부터 유리하다"가 위판 수수료로 이어진다.
   */
  meetingVote(): { yes: number; total: number; ratio: number; repGain: number } {
    const total = 24;
    const rep = this.harborRep(this.homeRegionId);
    const ratio = Math.max(0.3, Math.min(1, TUNING.story.meetingBaseYes + rep * TUNING.story.meetingRepSlope));
    const yes = Math.max(1, Math.round(total * ratio));
    // 과반 초과분이 곧 신뢰 보너스 (0~6)
    const repGain = Math.max(0, Math.round((yes - total / 2) / 2));
    return { yes, total, ratio, repGain };
  }
  /** Ch1 D-day 잔여 (실습생 증 전·총회 후엔 null) */
  deadlineDaysLeft(): number | null {
    if (this.traineeDay == null || this.isDone('M1-11')) return null;
    return TUNING.story.ch1DeadlineDays - (this.day - this.traineeDay);
  }

  // ── 평판 ──
  addSeaRep(d: number): void { this.rep.sea = clampSea(this.rep.sea + d, TUNING.rep.seaMin, TUNING.rep.seaMax); this.host?.markDirty(); }
  addHarborRep(regionId: string, d: number): void {
    this.rep.harbor[regionId] = clampHarbor((this.rep.harbor[regionId] ?? 0) + d, TUNING.rep.harborMax); this.host?.markDirty();
  }

  // ── 조행록 ──
  arcDone(arcId: string): boolean {
    const a = getStoryArc(arcId); return !!a && a.questIds.every((id) => this.isClosed(id));   // 286차 — 실패로 닫힌 편도 닫힌 것
  }
  journalPageStates(): JournalPageState[] {
    return JOURNAL_PAGES.map((p) => ({
      page: p.page, caught: (this.pageCatch[String(p.page)] ?? 0) >= (p.count ?? 1), arcDone: this.arcDone(p.arcId),
    }));
  }
  journalFilledCount(): number { return this.journalPageStates().filter((s) => s.caught && s.arcDone).length; }
  arcProgress(arcId: string): { done: number; total: number } {
    const a = getStoryArc(arcId); if (!a) return { done: 0, total: 0 };
    return { done: a.questIds.filter((id) => this.isDone(id)).length, total: a.questIds.length };
  }
  arcs(): typeof STORY_ARCS { return STORY_ARCS; }

  // ── 법 규칙 판정 (판매 UI) ──
  /**
   * 어획물 판매 판정 — `TUNING.law.enforceRodSell`이 꺼져 있으면 null(현행 허용).
   * catchMethod 없는 구세이브 어획물은 낚싯대로 본다(가장 보수적).
   */
  /** 보유 면허 — 위판 자격 판정 등에서 쓴다 */
  heldLicenses(): string[] { return this.host?.heldLicenses() ?? []; }

  /**
   * 위판 자격 판정 (147차).
   *
   * ⚠ 일반 판매(`sellVerdict`)는 `TUNING.law.enforceRodSell` 토글 뒤에 있지만
   *   **위판은 토글과 무관하게 항상 자격을 본다** — 위판장은 벌칙 장치가 아니라 계원 창구이고,
   *   낚싯대 어획을 배제하는 것이 위판이 일반 판매와 갈리는 이유 그 자체다.
   */
  consignVerdict(item: SellableLike, regionId = ''): LawVerdict | null {
    if (item.subCategory !== '어획물' || !item.speciesId) {
      return {
        allowed: false, reasonKo: '위판장은 어획물만 받습니다.', reasonEn: 'Only catch can be consigned.',
        alternatives: ['상점에 판매'], alternativesEn: ['Sell at a shop'],
      };
    }
    const method: CatchMethod = catchMethodOfItem(item);
    const v = canConsign(provenanceOf(method, regionId, item.lengthCm, this.day), this.heldLicenses());
    return v.allowed ? null : v;
  }

  sellVerdict(item: SellableLike, regionId = ''): LawVerdict | null {
    if (!this.lawEnforced()) return null;
    if (!item.speciesId || item.subCategory !== '어획물') return null;
    const method: CatchMethod = catchMethodOfItem(item);
    const v = canSell(provenanceOf(method, regionId, item.lengthCm, this.day), this.host?.heldLicenses() ?? []);
    return v.allowed ? null : v;
  }

  // ── 일용직(품삯) — 135차 ─────────────────────────
  /**
   * NPC가 오늘 줄 수 있는 일감 목록.
   * `remaining` 0이면 오늘 몫을 다 했다는 뜻(회색 표시 — 감추지 않는다. 내일 오면 된다는 안내가 된다).
   */
  jobsOfNpc(npcId: string, regionId: string): { job: DayJobDef; remaining: number; locked: string | null }[] {
    const hostile = !canOfferJobs(this.affinityOf(npcId));   // 140차 — 적대 NPC는 일을 안 준다
    return dayJobsOfNpc(npcId, regionId).map((job) => ({
      job,
      remaining: this.jobRemaining(job.id),
      locked: hostile ? '이 사람은 지금 당신에게 일을 주고 싶지 않습니다' : this.jobLockReason(job),
    }));
  }
  /** 품삯 배율 — 우호도 × TUNING.job.wageMult (대화창 표기와 지급이 같은 식을 쓴다) */
  jobWage(job: DayJobDef): number {
    return Math.max(0, Math.round(job.wage * TUNING.job.wageMult * affinityJobWageMult(this.affinityOf(job.npcId))));
  }

  /** 오늘 남은 근무 횟수 */
  jobRemaining(jobId: string): number {
    const job = getDayJob(jobId);
    if (!job) return 0;
    const rec = this.jobs[jobId];
    const usedToday = rec && rec.day === this.day ? rec.count : 0;
    return Math.max(0, job.perDay - usedToday);
  }

  /** 자격·레벨 잠금 사유 (없으면 null) */
  private jobLockReason(job: DayJobDef): string | null {
    if ((this.host?.level() ?? 1) < job.minLevel) return `레벨 ${job.minLevel} 필요`;
    if (job.needsTrainee && this.traineeDay == null) return '실습생 증을 먼저 받아야 합니다';
    if (job.requires && !(this.host?.heldLicenses() ?? []).includes(job.requires)) return '자격이 필요합니다';
    return null;
  }

  /**
   * 일하기 — 행동력을 쓰고 품삯을 받는다.
   * 실패는 전부 **사유를 돌려준다**(조용한 무시 금지 — 55차 먹통 방지 규칙과 같은 원칙).
   */
  work(jobId: string): { ok: boolean; reason?: string; wage?: number; flavorKo?: string } {
    const job = getDayJob(jobId);
    if (!job) return { ok: false, reason: '없는 일감입니다.' };
    const locked = canOfferJobs(this.affinityOf(job.npcId)) ? this.jobLockReason(job) : '이 사람은 지금 당신에게 일을 주고 싶지 않습니다';
    if (locked) return { ok: false, reason: locked };
    if (this.jobRemaining(jobId) <= 0) return { ok: false, reason: '오늘 몫은 다 했습니다 — 자고 나서 다시 오세요.' };
    const fat = this.host?.fatigue() ?? 0;
    if (fat >= TUNING.job.fatigueLimit) {
      return { ok: false, reason: `너무 지쳤습니다 (피로 ${Math.round(fat)}) — 쉬고 오세요.` };
    }
    const c = TUNING.job.costMult;
    this.host?.spendLabor(job.hunger * c, job.hydration * c, job.fatigue * c);
    const wage = this.jobWage(job);
    this.host?.addCoins(wage);
    this.onCoins?.(wage, `품삯 · ${job.nameKo}`);
    if (job.rep) this.addHarborRep(job.regionId, job.rep);
    const rec = this.jobs[jobId];
    this.jobs[jobId] = rec && rec.day === this.day
      ? { day: this.day, count: rec.count + 1 }
      : { day: this.day, count: 1 };
    // 퀘스트 목표 자동 충족 (custom placeKey / communityWork)
    this.event({ kind: 'custom', key: job.questKey });
    // 일감 성공은 실제 운반/현장 운영 행동이다. 수동 목표를 클릭으로 닫지 않고
    // 이 성공 지점에서만 다음 행동 단계가 진행되게 한다.
    this.emitActionSource('delivery', `job:${job.id}`);
    this.emitActionSource('field', `job:${job.id}`);
    this.host?.markDirty();
    this.onNotify?.(`${job.nameKo} — 품삯 ${wage.toLocaleString()}원`);
    return { ok: true, wage, flavorKo: job.flavorKo };
  }

  /**
   * 법 규칙 §3 강제 여부 (135차) — `TUNING.law.enforceRodSell`
   *  0 = 끔 / 1 = 항상 / 2 = **M1-06 「팔 수 없는 물고기」를 끝낸 뒤부터**(기본).
   *
   * 2가 기본인 이유: 규칙을 가르치는 퀘스트를 치르기 전에 벌하지 않고,
   * 스토리를 진행하지 않은 구세이브는 현행 그대로 유지된다(회귀 0).
   */
  lawEnforced(): boolean {
    const mode = TUNING.law.enforceRodSell;
    if (mode <= 0) return false;
    if (mode === 1) return true;
    return this.isDone('M1-06');
  }

  // ── 통계 (일지 헤더) ──
  counts(): { mainDone: number; mainTotal: number; subDone: number; subTotal: number } {
    const m = STORY_QUESTS.filter((q) => q.kind === 'main'), s = STORY_QUESTS.filter((q) => q.kind === 'sub');
    return { mainDone: m.filter((q) => this.isDone(q.id)).length, mainTotal: m.length, subDone: s.filter((q) => this.isDone(q.id)).length, subTotal: s.length };
  }
}

export const StoryStore = new StoryStoreManager();
// dev 하네스 전용 — 프로덕션 미노출(72차 `__GS`·60차 `__INV`와 같은 규칙)
if (import.meta.env.DEV) (globalThis as unknown as { __STORY?: unknown }).__STORY = StoryStore;

// dev 검증용 전역 노출 — `__INV`/`__GS`와 같은 이유(하네스의 import 인스턴스 분화 회피)
if (import.meta.env.DEV) {
  (globalThis as unknown as { __STORY?: unknown }).__STORY = StoryStore;
}
