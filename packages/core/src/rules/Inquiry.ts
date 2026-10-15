/**
 * @file Inquiry.ts
 * @description 253차 — 물어보기(조사 대화) 판정. 순수 함수만 — 상태(들은 물음 · 알게 된 화제)는 클라이언트 StoryStore가 갖는다.
 *
 *  - 화제를 「안다」 = 처음부터(`known`) · 진행 조건(`learnWhen`) · 들어서 연 것(`learned` — 세이브).
 *  - 물음이 「열렸다」 = 화제를 알고 · 조건(`requires`)이 맞고 · 꼬리 질문이면 앞 물음을 들었다.
 *  - 조사 물음(`effect.action`)은 일반 화제 목록에 나오지 않는다 — 그 편을 진행하는 대화(진행 중 화면)에서만 묻는다.
 *    단계가 맞을 때만 보여야 「먼저 물어 버려서 단계를 못 여는」 일이 없다(클라이언트가 단계를 대조한다).
 */

import type { InquiryGate, InquiryNodeDef, InquiryTopicDef, InquiryTopicKind } from '../types/Story.js';
import { INQUIRY_NODES, INQUIRY_TOPICS } from '../db-schema/StoryInquiry.js';
import { STORY_QUESTS } from '../db-schema/StoryQuestDatabase.js';
import { getStoryNpc } from '../db-schema/StoryArcs.js';

export type InquiryQuestState = 'none' | 'active' | 'done';

/** 판정 문맥 — 클라이언트가 세이브 상태로 채운다 */
export interface InquiryCtx {
  /** 누군가의 답에서 알게 된 화제(세이브) */
  learned: ReadonlySet<string>;
  /** 들은 물음(세이브) */
  asked: ReadonlySet<string>;
  questState: (questId: string) => InquiryQuestState;
  /** 메인 이야기 장(1~7) */
  chapter: number;
  hasFlag: (key: string) => boolean;
  affinity: (npcId: string) => number;
}

const TOPIC_BY_ID = new Map(INQUIRY_TOPICS.map((t) => [t.id, t]));
const NODE_BY_ID = new Map(INQUIRY_NODES.map((n) => [n.id, n]));
const KIND_ORDER: Record<InquiryTopicKind, number> = { person: 0, place: 1, thing: 2, word: 3, clue: 4 };

/** 화제 갈래 이름(목록 오른쪽 작은 글씨) */
export const INQUIRY_KIND_LABEL: Record<InquiryTopicKind, { ko: string; en: string }> = {
  person: { ko: '사람', en: 'Person' },
  place: { ko: '곳', en: 'Place' },
  thing: { ko: '물건', en: 'Thing' },
  word: { ko: '낱말', en: 'Word' },
  clue: { ko: '단서', en: 'Clue' },
};

export function inquiryTopic(id: string): InquiryTopicDef | undefined { return TOPIC_BY_ID.get(id); }
export function inquiryNode(id: string): InquiryNodeDef | undefined { return NODE_BY_ID.get(id); }

function gateOk(g: InquiryGate | undefined, ctx: InquiryCtx, npcId: string | undefined, depth: number): boolean {
  if (!g) return true;
  if (g.questSeen && ctx.questState(g.questSeen) === 'none') return false;
  if (g.questDone && ctx.questState(g.questDone) !== 'done') return false;
  if (g.questActive && ctx.questState(g.questActive) !== 'active') return false;
  if (g.questNotDone && ctx.questState(g.questNotDone) === 'done') return false;
  if (g.chapterMin !== undefined && ctx.chapter < g.chapterMin) return false;
  if (g.flag && !ctx.hasFlag(g.flag)) return false;
  if (g.asked?.some((a) => !ctx.asked.has(a))) return false;
  if (g.affinityMin !== undefined && npcId && ctx.affinity(npcId) < g.affinityMin) return false;
  if (g.topics?.some((t) => !knows(t, ctx, depth + 1))) return false;
  return true;
}

function knows(topicId: string, ctx: InquiryCtx, depth: number): boolean {
  const t = TOPIC_BY_ID.get(topicId);
  if (!t) return false;
  if (t.known || ctx.learned.has(topicId)) return true;
  if (!t.learnWhen || depth > 6) return false;
  const gates = Array.isArray(t.learnWhen) ? t.learnWhen : [t.learnWhen as InquiryGate];
  return gates.some((g) => gateOk(g, ctx, undefined, depth));
}

/** 조건 판정 — `npcId`가 있으면 우호도 조건을 그 사람으로 본다 */
export function inquiryGateOk(g: InquiryGate | undefined, ctx: InquiryCtx, npcId?: string): boolean {
  return gateOk(g, ctx, npcId, 0);
}

/** 이 화제를 아는가 */
export function inquiryKnows(topicId: string, ctx: InquiryCtx): boolean {
  return knows(topicId, ctx, 0);
}

/** 아는 화제 전부(노트 — 갈래 순) */
export function inquiryKnownTopics(ctx: InquiryCtx): InquiryTopicDef[] {
  return INQUIRY_TOPICS.filter((t) => knows(t.id, ctx, 0))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

/** 조사 물음인가 — 그 편 행동 목표의 단계를 연다(일반 목록에 나오지 않는다) */
export function isInquiryActionNode(n: InquiryNodeDef): boolean { return !!n.effect?.action; }

/** 이 물음이 지금 열려 있는가(조사 물음의 단계 대조는 하지 않는다 — 클라이언트 몫) */
export function inquiryNodeOpen(n: InquiryNodeDef, ctx: InquiryCtx): boolean {
  if (!knows(n.topic, ctx, 0)) return false;
  if (n.parent && !ctx.asked.has(n.parent)) return false;
  return gateOk(n.requires, ctx, n.npcId, 0);
}

export interface InquiryTopicEntry {
  topic: InquiryTopicDef;
  /** 이 사람에게 이 화제로 지금 물을 수 있는 물음(꼬리 포함 · 들은 것 포함) */
  nodes: InquiryNodeDef[];
  /** 아직 안 들은 물음 수 */
  fresh: number;
}

/** 이 사람에게 물을 수 있는 화제 — 열린 물음이 하나 이상인 것만. 새 물음이 있는 화제가 앞 */
export function inquiryTopicsFor(npcId: string, ctx: InquiryCtx): InquiryTopicEntry[] {
  const by = new Map<string, InquiryNodeDef[]>();
  for (const n of INQUIRY_NODES) {
    if (n.npcId !== npcId || isInquiryActionNode(n) || !inquiryNodeOpen(n, ctx)) continue;
    const list = by.get(n.topic);
    if (list) list.push(n); else by.set(n.topic, [n]);
  }
  const out: InquiryTopicEntry[] = [];
  for (const [id, nodes] of by) {
    const topic = TOPIC_BY_ID.get(id);
    if (topic) out.push({ topic, nodes, fresh: nodes.filter((n) => !ctx.asked.has(n.id)).length });
  }
  const order = new Map(INQUIRY_TOPICS.map((t, i) => [t.id, i]));
  return out.sort((a, b) => (Number(b.fresh > 0) - Number(a.fresh > 0))
    || (KIND_ORDER[a.topic.kind] - KIND_ORDER[b.topic.kind])
    || ((order.get(a.topic.id) ?? 0) - (order.get(b.topic.id) ?? 0)));
}

/** 이 물음 다음에 이어지는 꼬리 질문(열린 것 · 조사 물음 제외) */
export function inquiryFollowUps(nodeId: string, ctx: InquiryCtx): InquiryNodeDef[] {
  return INQUIRY_NODES.filter((n) => n.parent === nodeId && !isInquiryActionNode(n) && inquiryNodeOpen(n, ctx));
}

/**
 * 그 편을 진행하며 이 사람에게 물을 수 있는 물음 — 조사 물음(그 편 · 목표) + 그 편이 진행 중일 때만 열리는 곁물음.
 * 조사 물음의 단계 대조(지금 단계만)는 클라이언트가 한다.
 */
export function inquiryNodesForQuest(npcId: string, questId: string, objectiveIndex: number, ctx: InquiryCtx): InquiryNodeDef[] {
  return INQUIRY_NODES.filter((n) => n.npcId === npcId && inquiryNodeOpen(n, ctx) && (
    (n.effect?.action?.questId === questId && n.effect.action.objectiveIndex === objectiveIndex)
    || (!n.effect?.action && n.requires?.questActive === questId)));
}

/** 이 행동 목표를 물어보기가 이끄는가(일반 「방식 고르기」 대신 물음이 나온다) */
export function inquiryDrivesAction(questId: string, objectiveIndex: number): boolean {
  return INQUIRY_NODES.some((n) => n.effect?.action?.questId === questId && n.effect.action.objectiveIndex === objectiveIndex);
}

/** 사전 합류용 — 화제 이름 · 노트 · 물음 · 답(단락별 짝 포함) */
export function allInquiryLines(): [string, string][] {
  const out: [string, string][] = [];
  for (const k of Object.values(INQUIRY_KIND_LABEL)) out.push([k.ko, k.en]);
  for (const t of INQUIRY_TOPICS) out.push([t.labelKo, t.labelEn], [t.noteKo, t.noteEn]);
  for (const n of INQUIRY_NODES) {
    out.push([n.askKo, n.askEn], [n.answerKo, n.answerEn]);
    const ko = n.answerKo.split('\n\n'), en = n.answerEn.split('\n\n');
    if (ko.length > 1 && ko.length === en.length) ko.forEach((k, i) => out.push([k, en[i]]));
  }
  return out;
}

/**
 * 무결성 — 참조(화제 · 사람 · 앞 물음 · 편) · 유일 id · 닿을 수 있는 화제 · 쓸모없는 화제 · 글 규칙.
 * 문제 없으면 빈 배열.
 */
export function validateInquiry(): string[] {
  const issues: string[] = [];
  const questIds = new Set(STORY_QUESTS.map((q) => q.id));
  const seenT = new Set<string>();
  const PREFIX: Record<InquiryTopicKind, string> = { person: 'p_', place: 'pl_', thing: 't_', word: 'w_', clue: 'c_' };
  const emoji = /\p{Extended_Pictographic}/u;
  const hangul = /[가-힣]/;
  const gateRefs = (g: InquiryGate | undefined, where: string): void => {
    if (!g) return;
    for (const q of [g.questSeen, g.questDone, g.questActive, g.questNotDone]) if (q && !questIds.has(q)) issues.push(`${where}: 없는 편 ${q}`);
    for (const t of g.topics ?? []) if (!TOPIC_BY_ID.has(t)) issues.push(`${where}: 없는 화제 ${t}`);
    for (const a of g.asked ?? []) if (!NODE_BY_ID.has(a)) issues.push(`${where}: 없는 물음 ${a}`);
    if (g.flag && !/^(choice|unlock|inq)\./.test(g.flag)) issues.push(`${where}: 플래그 접두(choice. · unlock. · inq.)`);
  };
  const text = (ko: string, en: string, where: string): void => {
    if (!ko.trim() || !en.trim()) issues.push(`${where}: 빈 글`);
    if (emoji.test(ko) || emoji.test(en)) issues.push(`${where}: 이모지`);
    if (/["“”]/.test(ko) || /["“”]/.test(en)) issues.push(`${where}: 큰따옴표`);
    if (hangul.test(en)) issues.push(`${where}: 영어에 한글`);
    if (/\b[MN]\d{1,2}-\d{1,2}\b/.test(ko)) issues.push(`${where}: 내부 편 id`);
    if (ko.split('\n\n').length !== en.split('\n\n').length) issues.push(`${where}: 단락 수가 한 · 영 다르다`);
  };
  for (const t of INQUIRY_TOPICS) {
    if (seenT.has(t.id)) issues.push(`화제 id 중복 ${t.id}`);
    seenT.add(t.id);
    if (!t.id.startsWith(PREFIX[t.kind])) issues.push(`화제 ${t.id}: 갈래(${t.kind}) 접두 ${PREFIX[t.kind]}`);
    text(t.labelKo, t.labelEn, `화제 ${t.id} 이름`);
    text(t.noteKo, t.noteEn, `화제 ${t.id} 노트`);
    const gates = !t.learnWhen ? [] : Array.isArray(t.learnWhen) ? t.learnWhen : [t.learnWhen as InquiryGate];
    gates.forEach((g, i) => gateRefs(g, `화제 ${t.id} learnWhen[${i}]`));
  }
  const seenN = new Set<string>();
  const opened = new Set<string>();
  for (const n of INQUIRY_NODES) {
    const w = `물음 ${n.id}`;
    if (seenN.has(n.id)) issues.push(`물음 id 중복 ${n.id}`);
    seenN.add(n.id);
    if (!getStoryNpc(n.npcId)) issues.push(`${w}: 없는 사람 ${n.npcId}`);
    if (!n.id.startsWith(`${n.npcId}.`)) issues.push(`${w}: id는 '<사람 id>.'로 시작`);
    if (!TOPIC_BY_ID.has(n.topic)) issues.push(`${w}: 없는 화제 ${n.topic}`);
    if (n.parent) {
      const p = NODE_BY_ID.get(n.parent);
      if (!p) issues.push(`${w}: 없는 앞 물음 ${n.parent}`);
      else if (p.npcId !== n.npcId) issues.push(`${w}: 앞 물음이 다른 사람의 것`);
    }
    for (const o of n.opens ?? []) { if (!TOPIC_BY_ID.has(o)) issues.push(`${w}: 여는 화제 없음 ${o}`); opened.add(o); }
    gateRefs(n.requires, `${w} requires`);
    text(n.askKo, n.askEn, `${w} 물음`);
    text(n.answerKo, n.answerEn, `${w} 답`);
    const e = n.effect;
    if (e?.affinity !== undefined && Math.abs(e.affinity) > 0.03) issues.push(`${w}: 우호도 ±0.03 초과`);
    if (e?.flag && !e.flag.startsWith('choice.')) issues.push(`${w}: 플래그는 choice. 접두`);
    if (e?.action) {
      const q = STORY_QUESTS.find((x) => x.id === e.action!.questId);
      const o = q?.objectives[e.action.objectiveIndex];
      if (!q) issues.push(`${w}: 조사 편 없음 ${e.action.questId}`);
      else if (!o?.actionKey) issues.push(`${w}: 조사 목표 ${e.action.objectiveIndex}에 행동이 없다`);
      else if (q.giver !== n.npcId) issues.push(`${w}: 조사 물음은 그 편 의뢰인에게 묻는다(${q.giver})`);
      if (n.parent) issues.push(`${w}: 조사 물음은 꼬리 질문이 될 수 없다(곁물음을 asked 조건으로)`);
    }
  }
  // 꼬리 고리(순환)
  for (const n of INQUIRY_NODES) {
    let cur: InquiryNodeDef | undefined = n; let hops = 0;
    while (cur?.parent && hops < 50) { cur = NODE_BY_ID.get(cur.parent); hops++; }
    if (hops >= 50) issues.push(`물음 ${n.id}: 꼬리가 고리로 이어진다`);
  }
  // 닿을 수 없는 화제 · 쓸모없는 화제
  const used = new Set(INQUIRY_NODES.map((n) => n.topic));
  for (const t of INQUIRY_TOPICS) {
    if (!t.known && !t.learnWhen && !opened.has(t.id)) issues.push(`화제 ${t.id}: 알게 될 길이 없다(known · learnWhen · opens)`);
    if (!used.has(t.id)) issues.push(`화제 ${t.id}: 이 화제로 묻는 물음이 없다`);
  }
  return issues;
}
