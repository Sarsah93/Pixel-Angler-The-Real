/**
 * @file StoryStore.ts
 * @description 스토리·퀘스트 진행 스토어 (134차 — STORY_SPEC_v3 §14-4 엔진)
 *
 * - 정의는 core(`STORY_QUESTS`·`JOURNAL_PAGES`·`STORY_ARCS`), **상태만** 여기 있다.
 * - GameState가 `bind(host)`로 XP·재화·면허·플래그 조작 권한을 넘긴다(순환 import 회피).
 * - 이벤트 한 종류(`event()`)로 모든 자동 추적 목표를 채운다 — 어획/방생/활동/면허/통발/방문/커스텀/레벨/재화.
 *   `manual` 목표는 대화 패널의 [다음 단계]가 `advanceManual`로 닫는다. `talk`는 대화를 열면 자동.
 * - 스토리 날짜(`day`)는 **침대 수면**으로만 간다 — 활동 시간 규칙(125차)과 같은 원리로 오프라인엔 멈춘다.
 * - 조행록 17장: `pageCatch[page]`(제철 자가어획 누적) + 아크 완주 = 채움.
 *
 * ⚠ 세이브 하위호환: `story` 필드가 없으면 새 게임과 같이 M1-01만 활성. 구세이브의 레벨이 높아도
 *   퀘스트는 처음부터 — 스킵 수단은 dev 콘솔(추후)뿐.
 */

import {
  STORY_QUESTS, getStoryQuest, lastMainQuestOfChapter, JOURNAL_PAGES, journalCatchMatches, STORY_ARCS, getStoryArc,
  seasonOfMonth, createDefaultReputation, clampHarbor, clampSea, canSell, provenanceOf, TUNING,
  type StoryQuestDef, type StoryObjective, type ReputationState, type CatchMethod, type JournalPageState, type LawVerdict,
} from '@tra/core';

export interface QuestProgress {
  status: 'active' | 'done';
  /** 목표별 진행 수치 (target 대비) */
  obj: number[];
  /** 수락/완료 스토리 일차 */
  day: number;
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
}

export interface StoryHost {
  grantXp(n: number): void;
  addCoins(n: number): void;
  acquireLicense(t: string): boolean;
  heldLicenses(): string[];
  level(): number;
  coins(): number;
  setFlag(k: string, v?: boolean): void;
  markQuestDone(id: string): void;
  markDirty(): void;
}

export type StoryEvent =
  | { kind: 'catch'; speciesId: string; lengthCm: number; method: CatchMethod; selfCaught: boolean; regionId: string; month: number }
  | { kind: 'release'; speciesId: string; lengthCm: number }
  | { kind: 'activity'; activity: 'butcher' | 'sashimi' | 'forage' | 'craft' | 'cook'; itemId?: string }
  | { kind: 'license'; licenseId: string }
  | { kind: 'trap' }
  | { kind: 'sell' }
  | { kind: 'visit'; placeKey: string }
  | { kind: 'custom'; key: string }
  | { kind: 'talk'; npcId: string }
  | { kind: 'level'; level: number }
  | { kind: 'coins'; coins: number };

export type QuestStatus = 'done' | 'active' | 'available' | 'locked';

/** 어획물 아이템의 판매 판정에 필요한 최소 형태 */
interface SellableLike { speciesId?: string; subCategory?: string; catchMethod?: CatchMethod; lengthCm?: number }

class StoryStoreManager {
  private host: StoryHost | null = null;
  private quests: Record<string, QuestProgress> = {};
  private rep: ReputationState = createDefaultReputation();
  private pageCatch: Record<string, number> = {};
  private day = 0;
  private traineeDay: number | null = null;
  /** UI 통지 훅 — 퀘 완료/수락/조행록 갱신 (필드 HUD 토스트) */
  onNotify: ((msg: string) => void) | null = null;

  bind(host: StoryHost): void { this.host = host; }

  // ── 세이브 ──
  serialize(): StorySaveState {
    return { quests: this.quests, rep: this.rep, pageCatch: this.pageCatch, day: this.day, traineeDay: this.traineeDay };
  }
  deserialize(s?: StorySaveState): void {
    this.quests = s?.quests ?? {};
    this.rep = s?.rep ?? createDefaultReputation();
    this.pageCatch = s?.pageCatch ?? {};
    this.day = s?.day ?? 0;
    this.traineeDay = s?.traineeDay ?? null;
    this.refreshAutoQuests();
  }
  resetAll(): void { this.deserialize(undefined); }

  // ── 조회 ──
  get storyDay(): number { return this.day; }
  get reputation(): ReputationState { return this.rep; }
  harborRep(regionId: string): number { return this.rep.harbor[regionId] ?? 0; }
  get seaRep(): number { return this.rep.sea; }

  progress(id: string): QuestProgress | undefined { return this.quests[id]; }
  isDone(id: string): boolean { return this.quests[id]?.status === 'done'; }
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
    return this.isAvailable(q) ? 'available' : 'locked';
  }
  private isAvailable(q: StoryQuestDef): boolean {
    if (!this.chapterOpen(q.chapter)) return false;
    if (!q.prereq.every((p) => this.isDone(p))) return false;
    const lv = this.host?.level() ?? 1;
    return lv >= q.minLevel;
  }

  objectiveTarget(o: StoryObjective): number { return o.target ?? 1; }
  objectiveDone(q: StoryQuestDef, i: number): boolean {
    const p = this.quests[q.id];
    if (!p) return false;
    return (p.obj[i] ?? 0) >= this.objectiveTarget(q.objectives[i]);
  }
  allObjectivesDone(q: StoryQuestDef): boolean {
    return q.objectives.every((_o, i) => this.objectiveDone(q, i));
  }

  /** NPC 대화용 — 이 NPC가 발주한 퀘스트 분류 */
  questsForNpc(npcId: string): { completable: StoryQuestDef[]; active: StoryQuestDef[]; offer: StoryQuestDef[] } {
    const mine = STORY_QUESTS.filter((q) => q.giver === npcId);
    return {
      completable: mine.filter((q) => this.isActive(q.id) && this.allObjectivesDone(q)),
      active: mine.filter((q) => this.isActive(q.id) && !this.allObjectivesDone(q)),
      offer: mine.filter((q) => this.status(q) === 'available'),
    };
  }

  // ── 진행 ──
  accept(id: string): boolean {
    const q = getStoryQuest(id);
    if (!q || this.status(q) !== 'available') return false;
    this.quests[id] = { status: 'active', obj: q.objectives.map(() => 0), day: this.day };
    // 상태형 목표는 수락 즉시 평가 (레벨·재화·이미 보유한 면허)
    this.evaluateStateful(q);
    this.host?.markDirty();
    this.onNotify?.(`[퀘스트] ${q.titleKo} 수락`);
    return true;
  }

  /** manual 목표를 한 단계 진행 (대화 패널 [다음 단계]) */
  advanceManual(id: string, objIdx: number): boolean {
    const q = getStoryQuest(id); const p = this.quests[id];
    if (!q || !p || p.status !== 'active') return false;
    const o = q.objectives[objIdx];
    if (!o || !o.manual || this.objectiveDone(q, objIdx)) return false;
    p.obj[objIdx] = (p.obj[objIdx] ?? 0) + 1;
    this.host?.markDirty();
    return true;
  }

  /** 완료 + 보상 지급. 목표 미달이면 false */
  complete(id: string): boolean {
    const q = getStoryQuest(id); const p = this.quests[id];
    if (!q || !p || p.status !== 'active' || !this.allObjectivesDone(q)) return false;
    p.status = 'done'; p.day = this.day;
    const h = this.host;
    h?.grantXp(q.xp);
    if (q.rewards?.coins) h?.addCoins(q.rewards.coins);
    for (const lic of q.rewards?.licenses ?? []) h?.acquireLicense(lic);
    if (q.rewards?.items?.length) console.info(`[Story] ${id} 아이템 보상 보류(가방 사다리 UI 대기): ${q.rewards.items.map((i) => i.id).join(', ')}`);
    if (q.reputation?.sea) this.addSeaRep(q.reputation.sea);
    for (const [r, d] of Object.entries(q.reputation?.harbor ?? {})) this.addHarborRep(r, d);
    if (q.journalPage) this.pageCatch[String(q.journalPage)] = Math.max(this.pageCatch[String(q.journalPage)] ?? 0, 99);
    for (const u of q.unlocks ?? []) {
      h?.setFlag(`unlock.${u}`, true);
      if (u === 'trainee' && this.traineeDay == null) this.traineeDay = this.day;
    }
    h?.markQuestDone(id);
    h?.markDirty();
    this.onNotify?.(`[퀘스트] ${q.titleKo} 완료 — XP +${q.xp.toLocaleString()}`);
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
    });
  }

  /** 자동 추적 이벤트 — 활성 퀘 전체의 미완 목표와 대조 */
  event(ev: StoryEvent): void {
    let changed = false;
    for (const q of STORY_QUESTS) {
      const p = this.quests[q.id];
      if (!p || p.status !== 'active') continue;
      q.objectives.forEach((o, i) => {
        if (this.objectiveDone(q, i)) return;
        if (o.manual && ev.kind !== 'talk') return;
        const hit = this.match(o, ev);
        if (hit === null) return;
        p.obj[i] = hit === 'set' ? this.setValue(o, ev) : (p.obj[i] ?? 0) + 1;
        changed = true;
        if (this.objectiveDone(q, i)) this.onNotify?.(`[퀘스트] ${q.titleKo} — ${o.labelKo} 달성`);
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
        return 'inc';
      case 'release':
        if (o.kind !== 'release') return null;
        if (o.speciesId && o.speciesId !== ev.speciesId) return null;
        return 'inc';
      case 'activity': {
        const map: Record<string, StoryObjective['kind']> = { butcher: 'butcher', sashimi: 'sashimi', forage: 'gather', craft: 'craft', cook: 'cook' };
        if (o.kind !== map[ev.activity]) return null;
        if (o.itemId && ev.itemId && o.itemId !== ev.itemId) return null;
        return 'inc';
      }
      case 'license': return o.kind === 'license' && (!o.licenseId || o.licenseId === ev.licenseId) ? 'set' : null;
      case 'trap': return o.kind === 'trap' ? 'inc' : null;
      case 'sell': return o.kind === 'sell' ? 'inc' : null;
      case 'visit': return o.kind === 'visit' && o.placeKey === ev.placeKey ? 'inc' : null;
      case 'custom': return o.kind === 'custom' && o.placeKey === ev.key ? 'inc' : null;
      case 'talk': return o.kind === 'talk' && o.npcId === ev.npcId ? 'set' : null;
      case 'level': return o.kind === 'reachLevel' ? 'set' : null;
      case 'coins': return o.kind === 'earn' ? 'set' : null;
      default: return null;
    }
  }
  private setValue(o: StoryObjective, ev: StoryEvent): number {
    if (ev.kind === 'level') return ev.level;
    if (ev.kind === 'coins') return ev.coins;
    return this.objectiveTarget(o);
  }

  // ── 날짜 · 기한 ──
  advanceDay(): number { this.day++; this.host?.markDirty(); return this.day; }
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
    const a = getStoryArc(arcId); return !!a && a.questIds.every((id) => this.isDone(id));
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
  sellVerdict(item: SellableLike, regionId = ''): LawVerdict | null {
    if (!TUNING.law.enforceRodSell) return null;
    if (!item.speciesId || item.subCategory !== '어획물') return null;
    const method: CatchMethod = item.catchMethod ?? 'rod';
    const v = canSell(provenanceOf(method, regionId, item.lengthCm, this.day), this.host?.heldLicenses() ?? []);
    return v.allowed ? null : v;
  }

  // ── 통계 (일지 헤더) ──
  counts(): { mainDone: number; mainTotal: number; subDone: number; subTotal: number } {
    const m = STORY_QUESTS.filter((q) => q.kind === 'main'), s = STORY_QUESTS.filter((q) => q.kind === 'sub');
    return { mainDone: m.filter((q) => this.isDone(q.id)).length, mainTotal: m.length, subDone: s.filter((q) => this.isDone(q.id)).length, subTotal: s.length };
  }
}

export const StoryStore = new StoryStoreManager();

// dev 검증용 전역 노출 — `__INV`/`__GS`와 같은 이유(하네스의 import 인스턴스 분화 회피)
if (import.meta.env.DEV) {
  (globalThis as unknown as { __STORY?: unknown }).__STORY = StoryStore;
}
