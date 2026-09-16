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
  dayJobsOfNpc, getDayJob,
  clampAffinity, affinityRewardMult, affinityJobWageMult, canOfferSubQuest, canOfferJobs, choicesFor, choiceVisible,
  type StoryQuestDef, type StoryObjective, type ReputationState, type CatchMethod, type JournalPageState, type LawVerdict,
  type DayJobDef, type AffinityState, type QuestChoiceDef, type ChoiceOutcome, type ChoiceCtx, type SkillCategoryId,
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
  /** 일용직 일감 — 일감 id → { 마지막 근무 일차, 그날 횟수 } (135차) */
  jobs?: Record<string, { day: number; count: number }>;
  /** NPC 우호도 (140차) — npcId → −1~1. 없으면 0 */
  affinity?: AffinityState;
  /** 퀘스트별 고른 선택지 (140차) — questId → { offer, complete } */
  choices?: Record<string, { offer?: string; complete?: string }>;
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
  /** 품삯 노동 비용 — 허기·수분 감소 / 피로 증가 (135차) */
  spendLabor(hunger: number, hydration: number, fatigue: number): void;
  /** 현재 피로 (0~100) — 일하기 가능 여부 판정 */
  fatigue(): number;
  // 140차 — 선택지 결과 보상
  hasFlag(k: string): boolean;
  /** 카탈로그 아이템 실지급 (없는 id는 false) */
  giveItem(id: string, qty: number): boolean;
  addSkillPoints(n: number): void;
  grantProfXp(target: { skillId?: string; category?: SkillCategoryId }, xp: number): string[];
  grantProfLevelUp(skillId: string): boolean;
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
  | { kind: 'coins'; coins: number }
  /** 138차 — 과증식 생물 수거 (해파리·불가사리) */
  | { kind: 'cull'; speciesId: string };

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
  private jobs: Record<string, { day: number; count: number }> = {};
  private affinity: AffinityState = {};
  private choices: Record<string, { offer?: string; complete?: string }> = {};
  /** UI 통지 훅 — 퀘 완료/수락/조행록 갱신 (필드 HUD 토스트) */
  onNotify: ((msg: string) => void) | null = null;

  bind(host: StoryHost): void { this.host = host; }

  // ── 세이브 ──
  serialize(): StorySaveState {
    return {
      quests: this.quests, rep: this.rep, pageCatch: this.pageCatch, day: this.day, traineeDay: this.traineeDay, jobs: this.jobs,
      affinity: this.affinity, choices: this.choices,
    };
  }
  deserialize(s?: StorySaveState): void {
    this.quests = s?.quests ?? {};
    this.rep = s?.rep ?? createDefaultReputation();
    this.pageCatch = s?.pageCatch ?? {};
    this.day = s?.day ?? 0;
    this.traineeDay = s?.traineeDay ?? null;
    this.jobs = s?.jobs ?? {};
    this.affinity = s?.affinity ?? {};
    this.choices = s?.choices ?? {};
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

  /**
   * NPC 대화용 — 이 NPC가 발주한 퀘스트 분류.
   * 140차: 우호도가 `subGateMin` 미만이면 **서브** 발주는 감춘다(`refusedSub`에 표시용으로 남긴다).
   * 메인은 우호도와 무관하게 항상 발주한다 — 메인 스트림 불침범.
   */
  questsForNpc(npcId: string): { completable: StoryQuestDef[]; active: StoryQuestDef[]; offer: StoryQuestDef[]; refusedSub: StoryQuestDef[] } {
    const mine = STORY_QUESTS.filter((q) => q.giver === npcId);
    const avail = mine.filter((q) => this.status(q) === 'available');
    const open = canOfferSubQuest(this.affinityOf(npcId));
    return {
      completable: mine.filter((q) => this.isActive(q.id) && this.allObjectivesDone(q)),
      active: mine.filter((q) => this.isActive(q.id) && !this.allObjectivesDone(q)),
      offer: avail.filter((q) => q.kind === 'main' || open),
      refusedSub: open ? [] : avail.filter((q) => q.kind === 'sub'),
    };
  }

  // ── 우호도 · 선택지 (140차) ──
  affinityOf(npcId: string): number { return this.affinity[npcId] ?? 0; }
  addAffinity(npcId: string, d: number): number {
    const v = clampAffinity(this.affinityOf(npcId) + d);
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
  /** 기록된 선택 (분기 확인·일지 표기) */
  chosen(questId: string): { offer?: string; complete?: string } | undefined { return this.choices[questId]; }

  /** 선택지 결과 적용 — 전부 가산. 반환 = 사용자에게 보여줄 한 줄 요약 */
  private applyOutcome(q: StoryQuestDef, o: ChoiceOutcome): string[] {
    const h = this.host; const out: string[] = [];
    if (o.coins) { h?.addCoins(o.coins); out.push(`${o.coins > 0 ? '+' : ''}${o.coins.toLocaleString()}원`); }
    for (const it of o.items ?? []) {
      const ok = h?.giveItem(it.id, it.qty) ?? false;
      out.push(ok ? `${it.id} ×${it.qty}` : `${it.id} (인벤토리 공간 부족 — 미지급)`);
    }
    if (o.skillPoints) { h?.addSkillPoints(o.skillPoints); out.push(`스킬 포인트 +${o.skillPoints}`); }
    if (o.proficiency) {
      const got = h?.grantProfXp({ skillId: o.proficiency.skillId, category: o.proficiency.category }, o.proficiency.xp) ?? [];
      out.push(got.length ? `숙련도 +${o.proficiency.xp} (${got.length}개 기술)` : '숙련도 — 배운 기술이 없어 흘러갔습니다');
    }
    if (o.proficiencyLevelUp) {
      const ok = h?.grantProfLevelUp(o.proficiencyLevelUp) ?? false;
      out.push(ok ? '숙련도 1레벨 상승' : '숙련도 레벨업 — 그 기술을 배우지 않아 무효');
    }
    if (o.affinity) { const v = this.addAffinity(q.giver, o.affinity); out.push(`우호도 ${o.affinity > 0 ? '+' : ''}${o.affinity} (${v.toFixed(2)})`); }
    for (const a of o.affinityOther ?? []) { this.addAffinity(a.npcId, a.delta); out.push(`${a.npcId} 우호도 ${a.delta > 0 ? '+' : ''}${a.delta}`); }
    if (o.harborRep) { this.addHarborRep(q.region, o.harborRep); out.push(`항구 신뢰 +${o.harborRep}`); }
    if (o.seaRep) { this.addSeaRep(o.seaRep); out.push(`바다 평판 +${o.seaRep}`); }
    if (o.flag) h?.setFlag(o.flag, true);
    return out;
  }

  // ── 진행 ──
  accept(id: string, choiceId?: string): boolean {
    const q = getStoryQuest(id);
    if (!q || this.status(q) !== 'available') return false;
    if (q.kind === 'sub' && q.giver && !canOfferSubQuest(this.affinityOf(q.giver))) return false;   // 140차 — 우호도 게이트
    this.quests[id] = { status: 'active', obj: q.objectives.map(() => 0), day: this.day };
    // 140차 — 발주 톤 선택지(우호도 미세 차이)
    if (choiceId) {
      const c = this.visibleChoices(q, 'offer').find((x) => x.id === choiceId);
      if (c) { this.choices[id] = { ...this.choices[id], offer: c.id }; this.applyOutcome(q, c.outcome); }
    }
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

  /** 직전 완료의 결과 요약 — 대화창이 한 번 읽고 지운다 */
  lastOutcomeLines: string[] = [];

  /**
   * 완료 + 보상 지급. 목표 미달이면 false.
   * 140차: 완료 선택지(`choiceId`)의 결과를 **가산**하고, 서브 퀘 재화·XP에 우호도 배율을 곱한다
   * (메인 XP는 §8-1 계약 그대로 · 메인 재화는 1±0.1 밴드).
   */
  complete(id: string, choiceId?: string): boolean {
    const q = getStoryQuest(id); const p = this.quests[id];
    if (!q || !p || p.status !== 'active' || !this.allObjectivesDone(q)) return false;
    p.status = 'done'; p.day = this.day;
    const h = this.host;
    const aff = this.affinityOf(q.giver);
    const choice = choiceId ? this.visibleChoices(q, 'complete').find((c) => c.id === choiceId) : undefined;
    const xpMult = affinityRewardMult(aff, q.kind, 'xp') * (q.kind === 'sub' ? (choice?.outcome.xpMult ?? 1) : 1);
    const coinMult = affinityRewardMult(aff, q.kind, 'coins');
    const xp = Math.round(q.xp * xpMult);
    h?.grantXp(xp);
    if (q.rewards?.coins) h?.addCoins(Math.round(q.rewards.coins * coinMult));
    for (const lic of q.rewards?.licenses ?? []) h?.acquireLicense(lic);
    // 140차 — 아이템 보상 실지급(구 '가방 사다리 UI 대기' 보류 해소). 공간 부족은 안내로 남긴다.
    for (const it of q.rewards?.items ?? []) {
      if (!h?.giveItem(it.id, it.qty)) this.onNotify?.(`[퀘스트] 보상 ${it.id} — 인벤토리 공간이 부족해 받지 못했습니다`);
    }
    const lines: string[] = [];
    if (choice) { this.choices[id] = { ...this.choices[id], complete: choice.id }; lines.push(...this.applyOutcome(q, choice.outcome)); }
    if (q.giver) this.addAffinity(q.giver, q.kind === 'sub' ? TUNING.affinity.onSubComplete : TUNING.affinity.onMainComplete);
    this.lastOutcomeLines = lines;
    if (q.reputation?.sea) this.addSeaRep(q.reputation.sea);
    for (const [r, d] of Object.entries(q.reputation?.harbor ?? {})) this.addHarborRep(r, d);
    if (q.journalPage) this.pageCatch[String(q.journalPage)] = Math.max(this.pageCatch[String(q.journalPage)] ?? 0, 99);
    for (const u of q.unlocks ?? []) {
      h?.setFlag(`unlock.${u}`, true);
      if (u === 'trainee' && this.traineeDay == null) this.traineeDay = this.day;
    }
    h?.markQuestDone(id);
    h?.markDirty();
    this.onNotify?.(`[퀘스트] ${q.titleKo} 완료 — XP +${xp.toLocaleString()}${xpMult !== 1 ? ` (×${xpMult.toFixed(2)})` : ''}`);
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
      case 'custom':
        if (o.kind === 'custom' && o.placeKey === ev.key) return 'inc';
        // 어촌계 공동작업 일감은 `communityWork` 목표도 닫는다 (135차 — 일감 = 실시스템)
        if (o.kind === 'communityWork' && ev.key === 'job:coop_work') return 'inc';
        return null;
      case 'talk': return o.kind === 'talk' && o.npcId === ev.npcId ? 'set' : null;
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
    if (!this.lawEnforced()) return null;
    if (!item.speciesId || item.subCategory !== '어획물') return null;
    const method: CatchMethod = item.catchMethod ?? 'rod';
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
    if (job.rep) this.addHarborRep(job.regionId, job.rep);
    const rec = this.jobs[jobId];
    this.jobs[jobId] = rec && rec.day === this.day
      ? { day: this.day, count: rec.count + 1 }
      : { day: this.day, count: 1 };
    // 퀘스트 목표 자동 충족 (custom placeKey / communityWork)
    this.event({ kind: 'custom', key: job.questKey });
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

// dev 검증용 전역 노출 — `__INV`/`__GS`와 같은 이유(하네스의 import 인스턴스 분화 회피)
if (import.meta.env.DEV) {
  (globalThis as unknown as { __STORY?: unknown }).__STORY = StoryStore;
}
