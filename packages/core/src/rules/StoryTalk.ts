/**
 * @file StoryTalk.ts
 * @description 254차 — 이어지는 대화(갈래) · 결말 판정 · 무결성 검사 (순수 함수 — 상태는 client `StoryStore`가 든다).
 *
 * 사용자 지시(254차): 「선택지에 따라 대화 대상에 대한 우호도가 감소하거나 증가 … A에게 한 말이 B에게도」
 * 「이야기의 결말은 1~3개 — ① 하나로 모이는 결말(뒤 이야기가 기대는 정본) ② 흐름 자체가 갈라지는 결말
 *   (한쪽은 영구히 손해 · 한쪽은 사이가 완전히 틀어진다 — 그 사람과 거래할 때 값 깎기 막힘 · 귀한 물건이 줄어든다)
 *   ③ 이도 저도 아닌 결말(손해도 이득도 없이 경험치와 이야기 진행만)」.
 *
 *  - 대화 = 단계(상대 대사 + 고를 말 1~4) 그래프. 고른 말마다 여러 사람의 우호도가 오르내리고 표시(`choice.`)가 남는다.
 *    다음 단계로 이어지거나 끝난다. 끝은 대화가 열린 자리에 따라 받기/미루기 · 목표 닫기 · 단계 오름 · 마침(보상 답 · 결말).
 *  - 결말 = 이야기(서브 아크) 하나에 1~3개. 끝내는 자리 대화의 끝이 고른다. 효과는 우호도 · 영영 상한 · 가게 조건 · 직업 한 줄.
 *  - 이 모듈은 데이터 조회 · 조건 판정 · 효과 합치기 · 사전 줄 · 무결성 검사만. 적용(우호도 · 세이브)은 client.
 */

import type {
  NpcShopTerms, QuestChoiceDef, StoryEndingDef, StoryQuestDef, StoryTalkDef, TalkBeat, TalkChoiceDef, TalkEndDef, TalkGate, TalkNodeDef, TalkStance,
} from '../types/Story.js';
import { TALK_ACTS, talkActDef, talkActStep } from './TalkActs.js';
import { npcAddressIssue, playerAddressIssues, playerTokenIssue } from './PlayerAddress.js';
import { STORY_QUESTS } from '../db-schema/StoryQuestDatabase.js';
import { STORY_ARCS, getStoryNpc } from '../db-schema/StoryArcs.js';
import { choicesFor } from '../db-schema/StoryChoices.js';
import { STORY_TALKS } from '../db-schema/StoryTalks.js';
import { STORY_ENDINGS } from '../db-schema/StoryEndings.js';

const TALK_BY_ID = new Map(STORY_TALKS.map((t) => [t.id, t]));
const ENDING_BY_ID = new Map(STORY_ENDINGS.map((e) => [e.id, e]));

/** 판정 컨텍스트 — client가 세이브에서 채운다 */
export interface TalkCtx {
  hasFlag(key: string): boolean;
  affinity(npcId: string): number;
}

export function talkById(id: string): StoryTalkDef | undefined { return TALK_BY_ID.get(id); }
export function talksOfQuest(questId: string): StoryTalkDef[] { return STORY_TALKS.filter((t) => t.questId === questId); }
export function offerTalkOf(questId: string): StoryTalkDef | undefined { return STORY_TALKS.find((t) => t.questId === questId && t.at === 'offer'); }
export function completeTalkOf(questId: string): StoryTalkDef | undefined { return STORY_TALKS.find((t) => t.questId === questId && t.at === 'complete'); }
export function objectiveTalkOf(questId: string, objectiveIndex: number): StoryTalkDef | undefined {
  return STORY_TALKS.find((t) => t.questId === questId && t.at === 'objective' && t.objectiveIndex === objectiveIndex);
}
export function actionTalkOf(questId: string, objectiveIndex: number, step: number): StoryTalkDef | undefined {
  return STORY_TALKS.find((t) => t.questId === questId && t.at === 'action' && t.objectiveIndex === objectiveIndex && t.step === step);
}
/** 이 사람과 하는 진행 중 대화들(목표 · 행동 단계) — 지금 차례인지는 client가 본다 */
export function progressTalksOfNpc(npcId: string): StoryTalkDef[] {
  return STORY_TALKS.filter((t) => t.npcId === npcId && (t.at === 'objective' || t.at === 'action'));
}

export function talkNode(t: StoryTalkDef, nodeId: string): TalkNodeDef | undefined { return t.nodes[nodeId]; }

export function talkGateOk(g: TalkGate | undefined, ctx: TalkCtx): boolean {
  if (!g) return true;
  if (g.flag && !ctx.hasFlag(g.flag)) return false;
  if (g.notFlag && ctx.hasFlag(g.notFlag)) return false;
  if (g.affinityMin && ctx.affinity(g.affinityMin[0]) < g.affinityMin[1]) return false;
  if (g.affinityMax && ctx.affinity(g.affinityMax[0]) > g.affinityMax[1]) return false;
  return true;
}

/** 지금 보이는 고를 말 */
export function talkVisibleChoices(node: TalkNodeDef, ctx: TalkCtx): TalkChoiceDef[] {
  return node.choices.filter((c) => talkGateOk(c.requires, ctx));
}

// ── 결말 ─────────────────────────────────────────────────

export function endingById(id: string): StoryEndingDef | undefined { return ENDING_BY_ID.get(id); }
export function endingsOfArc(arcId: string): StoryEndingDef[] { return STORY_ENDINGS.filter((e) => e.arcId === arcId); }
/** 정본 결말(하나로 모이는 결말) */
export function canonEndingOf(arcId: string): StoryEndingDef | undefined { return STORY_ENDINGS.find((e) => e.arcId === arcId && e.kind === 'canon'); }
/** 이 편이 결말을 정하는 편이면 그 이야기 id */
export function endingArcOfQuest(questId: string): string | undefined { return STORY_ENDINGS.find((e) => e.questId === questId)?.arcId; }

/** 다다른 결말들이 이 사람 가게에 남긴 조건(여럿이면 막는 쪽이 이긴다) */
export function npcShopTerms(npcId: string, reached: readonly string[]): NpcShopTerms {
  const out: { noHaggle?: boolean; rare?: 'none' | 'more' } = {};
  for (const id of reached) {
    const t = endingById(id)?.effects?.shop?.[npcId];
    if (!t) continue;
    if (t.noHaggle) out.noHaggle = true;
    if (t.rare === 'none') out.rare = 'none';
    else if (t.rare === 'more' && out.rare !== 'none') out.rare = 'more';
  }
  return out;
}

/** 다다른 결말들이 이 사람과의 사이에 건 영영 상한(없으면 undefined) */
export function npcAffinityCap(npcId: string, reached: readonly string[]): number | undefined {
  let cap: number | undefined;
  for (const id of reached) {
    const c = endingById(id)?.effects?.affinityCap?.[npcId];
    if (c !== undefined) cap = cap === undefined ? c : Math.min(cap, c);
  }
  return cap;
}

/** 다다른 결말이 바꾼 이 사람의 나이 · 직업 한 줄(가장 나중 것) */
export function npcEndingRole(npcId: string, reached: readonly string[]): { ko: string; en: string } | undefined {
  let r: { ko: string; en: string } | undefined;
  for (const id of reached) { const x = endingById(id)?.effects?.role?.[npcId]; if (x) r = x; }
  return r;
}

// ── 사전(영어) ───────────────────────────────────────────

/** 대화 · 결말의 한 · 영 짝 — 단락이 여럿이면 단락끼리도 */
export function allTalkLines(): [string, string][] {
  const out: [string, string][] = [];
  const pair = (ko: string | undefined, en: string | undefined): void => {
    if (!ko || !en) return;
    out.push([ko, en]);
    const k = ko.split('\n\n'), e = en.split('\n\n');
    if (k.length > 1 && k.length === e.length) k.forEach((p, i) => out.push([p, e[i]]));
  };
  for (const t of STORY_TALKS) {
    for (const n of Object.values(t.nodes)) {
      pair(n.lineKo, n.lineEn);
      pair(n.noteKo, n.noteEn);   // 286차 — 일지 한 문장
      pair(n.end?.lineKo, n.end?.lineEn);
      for (const b of n.beats ?? []) if (b.kind === 'line') { pair(b.ko, b.en); pair(b.koF, b.enF); }
      for (const c of n.choices) {
        pair(c.labelKo, c.labelEn); pair(c.end?.lineKo, c.end?.lineEn);
        pair(c.sayKo, c.sayEn); pair(c.sayKoF, c.sayEnF); pair(c.noteKo, c.noteEn);   // 286차
      }
    }
  }
  for (const a of TALK_ACTS) pair(a.captionKo, a.captionEn);   // 286차 — 몸짓 지문(필드 인물이 없을 때 · 일지)
  for (const e of STORY_ENDINGS) {
    pair(e.titleKo, e.titleEn); pair(e.summaryKo, e.summaryEn);
    for (const r of Object.values(e.effects?.role ?? {})) pair(r.ko, r.en);   // 결말이 바꾼 나이 · 직업 한 줄(대화창 제목 · 정보 카드)
  }
  return out;
}

// ── 무결성 ───────────────────────────────────────────────

const STANCES: readonly TalkStance[] = ['giver', 'other', 'mid', 'self'];
/** 화면에 나가면 안 되는 말(R1) */
const DEV = /(자격 사다리|서브 아크|메인 스파인|메인 퀘스트|서브 퀘스트|퀘스트|우호도|플래그|경험치|숙련도|아크|게이트)/;
/** 한 번 고른 말이 움직이는 우호도 폭 */
export const TALK_AFFINITY_MAX = 0.15;
/** 286차 — 장면 안에서 받는 마음의 폭(「우호도 +0.25」처럼 큰 신뢰의 몸짓 — 사용자 지정) */
export const TALK_GIVE_AFFINITY_MAX = 0.3;

/** 286차 — 대본 박자 검사(누가 · 몸짓 · 받기 · 글) */
function checkBeats(beats: readonly TalkBeat[], where: string, issues: string[], text: (ko: string | undefined, en: string | undefined, w: string) => void,
  speech: (who: string, ko: string, w: string) => void): void {
  const who = (id: string, w: string): void => {
    if (id !== '' && id !== 'player' && !getStoryNpc(id)) issues.push(`${w}: 없는 사람 ${id}`);
  };
  beats.forEach((b, i) => {
    const w = `${where}#${i}`;
    if (b.kind === 'line') {
      who(b.who, w);
      text(b.ko, b.en, `${w} 대사`);
      if (b.koF !== undefined || b.enF !== undefined) text(b.koF, b.enF, `${w} 여자 주인공 대사`);
      speech(b.who, b.ko, w);
      if (b.koF) speech(b.who, b.koF, `${w} 여자 주인공`);
      if (b.act) {
        const d = talkActDef(b.act);
        if (!d) issues.push(`${w}: 없는 몸짓 ${b.act}`);
        else if (d.speech !== 'overlap') issues.push(`${w}: 말과 함께 할 수 없는 몸짓 ${b.act} — 따로 박자로(말이 멈춘다)`);
      }
    } else if (b.kind === 'act') {
      who(b.who, w);
      if (b.who === '') issues.push(`${w}: 몸짓은 사람이 한다`);
      if (!talkActDef(b.act)) issues.push(`${w}: 없는 몸짓 ${b.act}`);
      if ((b.act === 'give' || b.act === 'receive') && b.to !== undefined) who(b.to, w);
    } else {
      who(b.from, w);
      for (const [npc, d] of Object.entries(b.affinity ?? {})) {
        if (!getStoryNpc(npc)) issues.push(`${w}: 우호도 대상 없음 ${npc}`);
        if (Math.abs(d) > TALK_GIVE_AFFINITY_MAX) issues.push(`${w}: 우호도 ±${TALK_GIVE_AFFINITY_MAX} 초과`);
      }
      for (const f of b.flags ?? []) if (!/^choice\.[a-z0-9_]+$/.test(f)) issues.push(`${w}: 표시는 choice.소문자`);
      for (const it of b.items ?? []) if (!it.id || !(it.qty > 0)) issues.push(`${w}: 물건 id · 수`);
    }
  });
}

/** 286차 — 몸짓의 든 것(담배)을 길마다 따라가며 앞뒤가 맞는지 본다 */
function checkHeld(t: StoryTalkDef, issues: string[]): void {
  const seen = new Set<string>();
  const walk = (nodeId: string, held: Set<string>): void => {
    const key = `${nodeId}|${[...held].sort().join(',')}`;
    if (seen.has(key)) return;
    seen.add(key);
    const n = t.nodes[nodeId];
    if (!n) return;
    let h = held;
    for (const b of n.beats ?? []) {
      if (b.kind !== 'act' || b.who === 'player') continue;
      const r = talkActStep(h, b.act);
      if (r.issue) issues.push(`대화 ${t.id}/${nodeId}: ${r.issue}`);
      h = r.held;
    }
    if (n.next) walk(n.next, h);
    for (const c of n.choices) if (c.next) walk(c.next, h);
  };
  walk(t.start, new Set());
}

/**
 * 290차 — 끝이 묶인 옛 답(받는 답 `end.offer` · 보상 답 `end.complete`). 대본으로 다시 쓴 대화도 옛 답의 결과 · 조건을 그대로 쓴다.
 * 그 답에 조건(우호도 · 레벨 · 면허 · 표시)이 있으면 그 말은 조건이 맞을 때만 보인다(client `StoryStore.talkChoices`).
 */
export function talkAnswerRef(t: StoryTalkDef, end: TalkEndDef | undefined): { stage: 'offer' | 'complete'; id: string } | undefined {
  if (!end) return undefined;
  if (t.at === 'complete' && end.complete) return { stage: 'complete', id: end.complete };
  if (t.at === 'offer' && end.offer) return { stage: 'offer', id: end.offer };
  return undefined;
}

function answerOf(q: StoryQuestDef, t: StoryTalkDef, end: TalkEndDef | undefined): QuestChoiceDef | undefined {
  const ref = talkAnswerRef(t, end);
  return ref ? choicesFor(q)[ref.stage].find((c) => c.id === ref.id) : undefined;
}

/** 이 말이 조건이 있는가 — 제 조건(`requires`) · 묶인 옛 답의 조건 */
function talkChoiceGated(q: StoryQuestDef, t: StoryTalkDef, c: TalkChoiceDef): boolean {
  return !!c.requires || !!answerOf(q, t, c.end)?.requires;
}

/**
 * 290차 — 다시 쓰기 덮개 검사: 의뢰인이 있는 편마다 받는 자리 · 끝내는 자리 대본이 있고, 옛 답이 남기던 것을 잃지 않았는가.
 *  - 받는 자리: 옛 받는 답이 남기던 표시(`outcome.flag`)를 대본 어딘가(고른 말 · 건네기 · 묶인 답)가 남긴다 ·
 *    한 번뿐(once) · 때가 있는(event) 곁가지는 미루기 · 거절 끝이 있다.
 *  - 끝내는 자리: 옛 보상 답이 모두 대본의 끝에 묶여 있다(품삯 · 가르침 · 사양 · 청탁 — 고르는 맛을 잃지 않게).
 *  - 대본 장면(`beats`)으로 쓰여 있다.
 * `onlyQuests`를 주면 그 편들만 본다(집필 묶음 검사).
 */
export function talkCoverageIssues(talks: readonly StoryTalkDef[] = STORY_TALKS, onlyQuests?: ReadonlySet<string>): string[] {
  const issues: string[] = [];
  for (const q of STORY_QUESTS) {
    if (!q.giver || (onlyQuests && !onlyQuests.has(q.id))) continue;
    const w = `편 ${q.id}`;
    const offer = talks.find((x) => x.questId === q.id && x.at === 'offer');
    const done = talks.find((x) => x.questId === q.id && x.at === 'complete');
    const set = choicesFor(q);
    for (const [t, label] of [[offer, '받는 자리'], [done, '끝내는 자리']] as const) {
      if (!t) { issues.push(`${w}: ${label} 대본이 없다`); continue; }
      if (!Object.values(t.nodes).some((n) => n.beats)) issues.push(`${w}: ${label} 대화가 대본 장면(주고받기)이 아니다`);
      if (Object.values(t.nodes).some((n) => !n.beats)) issues.push(`${w}: ${label}에 대본이 아닌 단계(상대 대사 한 덩어리)가 남았다`);
    }
    const allEnds = (t: StoryTalkDef | undefined): TalkEndDef[] => {
      const out: TalkEndDef[] = [];
      for (const n of Object.values(t?.nodes ?? {})) {
        if (n.end) out.push(n.end);
        for (const c of n.choices) if (c.end) out.push(c.end);
      }
      return out;
    };
    if (offer) {
      const flags = new Set<string>();
      for (const n of Object.values(offer.nodes)) {
        for (const c of n.choices) for (const f of c.flags ?? []) flags.add(f);
        for (const b of n.beats ?? []) if (b.kind === 'give') for (const f of b.flags ?? []) flags.add(f);
      }
      const ends = allEnds(offer);
      for (const e of ends) if (e.offer) { const a = set.offer.find((c) => c.id === e.offer); if (a?.outcome.flag) flags.add(a.outcome.flag); }
      for (const a of set.offer) if (a.outcome.flag && !flags.has(a.outcome.flag)) issues.push(`${w}: 받는 답 ${a.id}의 표시 ${a.outcome.flag}를 대본이 남기지 않는다`);
      if (q.kind === 'sub' && (q.offerPolicy === 'once' || q.offerPolicy === 'event') && !ends.some((e) => e.decline || e.fail)) {
        issues.push(`${w}: 한 번뿐 · 때가 있는 곁가지인데 미루기 · 거절 끝이 없다`);
      }
    }
    if (done) {
      const used = new Set(allEnds(done).map((e) => e.complete).filter((x): x is string => !!x));
      for (const a of set.complete) if (!used.has(a.id)) issues.push(`${w}: 보상 답 ${a.id}이(가) 끝내는 자리 대본에 없다`);
    }
  }
  return issues;
}

/** 290차 — 주인공 말 속 「가리키는」 부름말(부르는 꼴은 `validateTalks` 오류) — 사람이 보고 이름으로 고친다 */
export function talkAddressWarnings(talks: readonly StoryTalkDef[] = STORY_TALKS): string[] {
  const out: string[] = [];
  const look = (ko: string | undefined, where: string): void => {
    for (const a of playerAddressIssues(ko ?? '')) if (!a.vocative) out.push(`${where}: 주인공 말에 「${a.word}」 — 그 사람이면 「이름 씨」 · 「그분」`);
  };
  for (const t of talks) {
    for (const [nid, n] of Object.entries(t.nodes)) {
      for (const [i, b] of (n.beats ?? []).entries()) if (b.kind === 'line' && b.who === 'player') { look(b.ko, `${t.id}/${nid}#${i}`); look(b.koF, `${t.id}/${nid}#${i}F`); }
      for (const c of n.choices) { look(c.labelKo, `${t.id}/${nid}/${c.id}`); look(c.sayKo, `${t.id}/${nid}/${c.id} 하는 말`); look(c.sayKoF, `${t.id}/${nid}/${c.id} 여자`); }
    }
  }
  return out;
}

/**
 * 무결성 — 참조(편 · 사람 · 목표 · 단계 · 결말 · 보상 답) · 자리별 끝 규칙 · 막다른 길 · 글 규칙.
 * 문제 없으면 빈 배열. `talks`를 주면 그 묶음만 본다(집필 도구 `tools/check_talks.mjs` — 묶음 파일 하나를 따로 검사).
 */
export function validateTalks(talks: readonly StoryTalkDef[] = STORY_TALKS): string[] {
  const issues: string[] = [];
  const emoji = /\p{Extended_Pictographic}/u;
  const hangul = /[가-힣]/;
  const text = (ko: string | undefined, en: string | undefined, where: string): void => {
    if (!ko?.trim() || !en?.trim()) { issues.push(`${where}: 빈 글`); return; }
    if (emoji.test(ko) || emoji.test(en)) issues.push(`${where}: 이모지`);
    if (/["“”]/.test(ko) || /["“”]/.test(en)) issues.push(`${where}: 큰따옴표(대화창이 붙인다)`);
    if (hangul.test(en)) issues.push(`${where}: 영어에 한글`);
    if (/\b[MN]\d{1,2}-\d{1,2}\b/.test(ko + en)) issues.push(`${where}: 내부 편 id`);
    const dev = DEV.exec(ko); if (dev) issues.push(`${where}: 개발 용어 「${dev[1]}」`);
    if (ko.split('\n\n').length !== en.split('\n\n').length) issues.push(`${where}: 단락 수가 한 · 영 다르다`);
    const tok = playerTokenIssue(ko, en); if (tok) issues.push(`${where}: ${tok}`);
    if (/일지$/.test(where) && /\{player\}/.test(ko + en)) issues.push(`${where}: 일지 글(1인칭)에 주인공 이름 자리 표시`);
  };
  // 290차 — 호칭 「OOO 씨」: 주인공이 부르는 꼴의 나이 · 성별 · 직함 부름말 · 인물이 주인공을 성별 · 나이로 부르는 꼴
  const speech = (who: string, ko: string, where: string): void => {
    if (who === 'player') {
      for (const a of playerAddressIssues(ko)) if (a.vocative) issues.push(`${where}: 주인공이 「${a.word}」로 부른다 — 「이름 씨」로`);
    } else if (who !== '') {
      const bad = npcAddressIssue(ko); if (bad) issues.push(`${where}: 주인공을 「${bad}」로 부른다 — {player} 씨 · 자네 · 너 · 당신`);
    }
  };
  const seen = new Set<string>();
  for (const t of talks) {
    const w = `대화 ${t.id}`;
    if (seen.has(t.id)) issues.push(`${w}: id 중복`);
    seen.add(t.id);
    const q = STORY_QUESTS.find((x) => x.id === t.questId);
    if (!q) { issues.push(`${w}: 없는 편 ${t.questId}`); continue; }
    if (!getStoryNpc(t.npcId)) issues.push(`${w}: 없는 사람 ${t.npcId}`);
    // 자리마다
    if (t.at === 'offer' || t.at === 'complete') {
      if (t.npcId !== q.giver) issues.push(`${w}: 받는 · 끝내는 자리 대화 상대는 의뢰인(${q.giver})`);
      if (talks.some((x) => x !== t && x.questId === t.questId && x.at === t.at)) issues.push(`${w}: 같은 자리 대화가 둘`);
    }
    if (talks.some((x) => x !== t && x.questId === t.questId && x.at === t.at && x.objectiveIndex === t.objectiveIndex && x.step === t.step
      && (t.at === 'objective' || t.at === 'action'))) issues.push(`${w}: 같은 목표 · 단계에 대화가 둘`);
    if (t.at === 'objective' || t.at === 'action') {
      const o = t.objectiveIndex === undefined ? undefined : q.objectives[t.objectiveIndex];
      if (!o) issues.push(`${w}: 목표 번호 ${t.objectiveIndex}`);
      else if (t.at === 'objective') {
        if (!(o.kind === 'talk' || (o.manual && !o.actionKey))) issues.push(`${w}: 장면으로 닫히는 목표(대화 · 수동)만`);
        const who = o.npcId ?? q.giver;
        if (who && who !== t.npcId) issues.push(`${w}: 목표의 상대(${who})와 대화 상대가 다르다`);
      } else {
        if (!o.actionKey) issues.push(`${w}: 행동 목표가 아니다`);
        // 행동 단계의 「고르는 자리」는 의뢰인 대화창(진행 중 화면)에서만 열린다
        if (t.npcId !== q.giver) issues.push(`${w}: 행동 단계 대화 상대는 의뢰인(${q.giver})`);
        if (t.step === undefined || t.step < 0 || t.step > 4) issues.push(`${w}: 행동 단계 번호`);
      }
    }
    // 단계 · 길
    const ids = Object.keys(t.nodes);
    if (!t.nodes[t.start]) issues.push(`${w}: 첫 단계 ${t.start} 없음`);
    const ends: { end: NonNullable<TalkChoiceDef['end']>; where: string }[] = [];
    for (const [nid, n] of Object.entries(t.nodes)) {
      const wn = `${w}/${nid}`;
      if (n.speaker && !getStoryNpc(n.speaker)) issues.push(`${wn}: 없는 말하는 사람 ${n.speaker}`);
      // 286차 — 대본이 있으면 대사 대신 박자를 본다
      if (n.beats) {
        if (n.beats.length === 0) issues.push(`${wn}: 빈 대본`);
        if (n.lineKo || n.lineEn) issues.push(`${wn}: 대본과 대사를 함께 쓰지 않는다`);
        checkBeats(n.beats, wn, issues, text, speech);
      } else { text(n.lineKo, n.lineEn, `${wn} 대사`); speech(n.speaker ?? t.npcId, n.lineKo, `${wn} 대사`); }
      if (n.noteKo !== undefined || n.noteEn !== undefined) text(n.noteKo, n.noteEn, `${wn} 일지`);
      const flows = (n.next ? 1 : 0) + (n.end ? 1 : 0);
      if (flows > 1) issues.push(`${wn}: next와 end 중 하나만`);
      if (flows === 1) {
        if (n.choices.length) issues.push(`${wn}: 이어짐 · 끝이 있는 장면에는 고를 말을 두지 않는다`);
        if (!n.beats) issues.push(`${wn}: 이어짐 · 끝은 대본 장면만`);
        if (n.next && !t.nodes[n.next]) issues.push(`${wn}: 없는 다음 단계 ${n.next}`);
        if (n.end) {
          ends.push({ end: n.end, where: `${wn}/끝` });
          if (n.end.lineKo || n.end.lineEn) { text(n.end.lineKo, n.end.lineEn, `${wn} 끝말`); speech(t.npcId, n.end.lineKo ?? '', `${wn} 끝말`); }
          if (answerOf(q, t, n.end)?.requires) issues.push(`${wn}: 고르지 않고 끝나는 장면이 조건 있는 답(${n.end.complete ?? n.end.offer})에 묶였다 — 고를 말로`);
        }
      } else {
        if (n.choices.length < 1 || n.choices.length > 4) issues.push(`${wn}: 고를 말 ${n.choices.length}개 — 1~4`);
        if (!n.choices.some((c) => !talkChoiceGated(q, t, c))) issues.push(`${wn}: 조건 없는 말이 하나는 있어야 한다(막힘 — 조건 있는 답에 묶인 말도 조건이 있는 것으로 친다)`);
      }
      const cids = new Set<string>();
      for (const c of n.choices) {
        const wc = `${wn}/${c.id}`;
        if (cids.has(c.id)) issues.push(`${wc}: id 중복`);
        cids.add(c.id);
        if (!/^[a-z][a-z0-9_]*$/.test(c.id)) issues.push(`${wc}: id 형식`);
        text(c.labelKo, c.labelEn, `${wc} 말`);
        if (c.sayKo !== undefined || c.sayEn !== undefined) text(c.sayKo, c.sayEn, `${wc} 하는 말`);
        if (c.sayKoF !== undefined || c.sayEnF !== undefined) text(c.sayKoF, c.sayEnF, `${wc} 여자 주인공 말`);
        speech('player', c.labelKo, `${wc} 말`);
        if (c.sayKo) speech('player', c.sayKo, `${wc} 하는 말`);
        if (c.sayKoF) speech('player', c.sayKoF, `${wc} 여자 주인공 말`);
        if (c.noteKo !== undefined || c.noteEn !== undefined) text(c.noteKo, c.noteEn, `${wc} 일지`);
        if (c.stance && !STANCES.includes(c.stance)) issues.push(`${wc}: 입장 ${c.stance}`);
        if (!!c.next === !!c.end) issues.push(`${wc}: next와 end 중 하나만`);
        if (c.next && !t.nodes[c.next]) issues.push(`${wc}: 없는 다음 단계 ${c.next}`);
        for (const [npc, d] of Object.entries(c.affinity ?? {})) {
          if (!getStoryNpc(npc)) issues.push(`${wc}: 우호도 대상 없음 ${npc}`);
          if (Math.abs(d) > TALK_AFFINITY_MAX) issues.push(`${wc}: 우호도 ±${TALK_AFFINITY_MAX} 초과`);
        }
        for (const f of c.flags ?? []) if (!/^choice\.[a-z0-9_]+$/.test(f)) issues.push(`${wc}: 표시는 choice.소문자`);
        const g = c.requires;
        if (g?.flag && !/^(choice|unlock|inq)\./.test(g.flag)) issues.push(`${wc}: 조건 표시 접두`);
        if (g?.affinityMin && !getStoryNpc(g.affinityMin[0])) issues.push(`${wc}: 조건 사람 없음`);
        if (c.end) {
          ends.push({ end: c.end, where: wc });
          if (c.end.lineKo || c.end.lineEn) { text(c.end.lineKo, c.end.lineEn, `${wc} 끝말`); speech(t.npcId, c.end.lineKo ?? '', `${wc} 끝말`); }
        }
      }
    }
    // 닿지 않는 단계 · 끝이 없는 단계
    const reach = new Set<string>([t.start]);
    const stack = [t.start];
    while (stack.length) {
      const n = t.nodes[stack.pop()!];
      const nexts = [...(n?.choices ?? []).map((c) => c.next), n?.next];   // 286차 — 고르지 않고 이어지는 장면
      for (const nx of nexts) if (nx && !reach.has(nx)) { reach.add(nx); stack.push(nx); }
    }
    for (const id of ids) if (!reach.has(id)) issues.push(`${w}/${id}: 첫 단계에서 닿지 않는다`);
    const canEnd = new Set<string>();
    let grew = true;
    while (grew) {
      grew = false;
      for (const [nid, n] of Object.entries(t.nodes)) {
        if (canEnd.has(nid)) continue;
        if (n.end || (n.next && canEnd.has(n.next))
          || n.choices.some((c) => !talkChoiceGated(q, t, c) && (c.end || (c.next && canEnd.has(c.next))))) { canEnd.add(nid); grew = true; }
      }
    }
    for (const id of ids) if (!canEnd.has(id)) issues.push(`${w}/${id}: 조건 없이 끝에 닿는 길이 없다(갇힘)`);
    // 끝 규칙
    const endArc = endingArcOfQuest(t.questId);
    const completeIds = new Set(choicesFor(q).complete.map((c) => c.id));
    const offerIds = new Map(choicesFor(q).offer.map((c) => [c.id, c] as const));
    for (const { end, where } of ends) {
      if (t.at === 'offer') {
        if (!end.accept && !end.decline && !end.fail) issues.push(`${where}: 받는 자리 끝은 받기 · 미루기 · 거절(실패)`);
        if ((end.decline || end.fail) && q.kind === 'main') issues.push(`${where}: 메인은 미루지 · 거절하지 않는다`);
        if ([end.accept, end.decline, end.fail].filter(Boolean).length > 1) issues.push(`${where}: 받기 · 미루기 · 거절 중 하나만`);
        if (end.complete || end.ending) issues.push(`${where}: 받는 자리에 마침 · 결말`);
        if (end.offer) {
          const a = offerIds.get(end.offer);
          if (!a) issues.push(`${where}: 없는 받는 답 ${end.offer}`);
          else if (a.outcome.decline && !end.decline) issues.push(`${where}: 미루는 답 ${end.offer}에는 decline`);
          else if (!a.outcome.decline && !end.accept) issues.push(`${where}: 받는 답 ${end.offer}에는 accept`);
          if (end.fail) issues.push(`${where}: 거절(실패)은 답에 묶지 않는다`);
        }
      } else if (t.at === 'complete') {
        if (end.accept || end.decline || end.offer) issues.push(`${where}: 끝내는 자리에 받기 · 미루기`);
        if (end.complete && !completeIds.has(end.complete)) issues.push(`${where}: 없는 보상 답 ${end.complete}`);
        if (end.ending) {
          const e = endingById(end.ending);
          if (!e) issues.push(`${where}: 없는 결말 ${end.ending}`);
          else if (e.questId !== t.questId) issues.push(`${where}: 결말 ${end.ending}은 ${e.questId}에서 정한다`);
        } else if (endArc && endingsOfArc(endArc).length > 1) issues.push(`${where}: 결말이 여럿인 이야기 — 끝마다 결말을 정한다`);
      } else if (end.accept || end.decline || end.fail || end.complete || end.ending || end.offer) issues.push(`${where}: 진행 중 대화 끝에 받기 · 마침 · 결말`);
      if (end.fail && t.at !== 'offer') issues.push(`${where}: 거절(실패)은 받는 자리에서만`);
    }
    checkHeld(t, issues);   // 286차 — 담배를 물지 않고 내뿜는 장면 등
    if (t.at === 'offer' && !ends.some((e) => e.end.accept)) issues.push(`${w}: 받는 길이 없다`);
  }
  return issues;
}

/** 결말 무결성 — 이야기마다 1~3개 · 종류 · 효과 · 정하는 편 · 대화가 모든 결말에 닿는가 */
export function validateEndings(): string[] {
  const issues: string[] = [];
  const arcIds = new Set(STORY_ENDINGS.map((e) => e.arcId));
  const seen = new Set<string>();
  for (const e of STORY_ENDINGS) {
    const w = `결말 ${e.id}`;
    if (seen.has(e.id)) issues.push(`${w}: id 중복`);
    seen.add(e.id);
    const arc = STORY_ARCS.find((a) => a.id === e.arcId);
    if (!arc) issues.push(`${w}: 없는 이야기 ${e.arcId}`);
    else if (!arc.questIds.includes(e.questId)) issues.push(`${w}: ${e.questId}는 이 이야기의 편이 아니다`);
    for (const [ko, en, where] of [[e.titleKo, e.titleEn, '이름'], [e.summaryKo, e.summaryEn, '요약']] as const) {
      if (!ko.trim() || !en.trim() || /[가-힣]/.test(en)) issues.push(`${w} ${where}: 빈 글 · 영어에 한글`);
    }
    const fx = e.effects ?? {};
    const npcs = [...Object.keys(fx.affinity ?? {}), ...Object.keys(fx.affinitySet ?? {}), ...Object.keys(fx.affinityCap ?? {}),
      ...Object.keys(fx.shop ?? {}), ...Object.keys(fx.role ?? {})];
    for (const n of npcs) if (!getStoryNpc(n)) issues.push(`${w}: 없는 사람 ${n}`);
    const harsh = Object.values(fx.affinitySet ?? {}).some((v) => v <= -0.6) || Object.keys(fx.affinityCap ?? {}).length > 0
      || Object.values(fx.shop ?? {}).some((s) => s.noHaggle || s.rare === 'none');
    if (e.kind === 'rupture' && !harsh) issues.push(`${w}: 갈라지는 결말인데 영구한 손해(우호도 적대 · 상한 · 가게 조건)가 없다`);
    if (e.kind !== 'rupture' && harsh) issues.push(`${w}: 갈라지는 결말이 아닌데 영구한 손해가 있다`);
    if (e.kind === 'neutral' && (Object.keys(fx.affinity ?? {}).length || Object.keys(fx.shop ?? {}).length)) issues.push(`${w}: 이도 저도 아닌 결말에 이득 · 손해`);
  }
  for (const arcId of arcIds) {
    const list = endingsOfArc(arcId);
    if (list.length < 1 || list.length > 3) issues.push(`이야기 ${arcId}: 결말 ${list.length}개 — 1~3`);
    for (const k of ['canon', 'rupture', 'neutral'] as const) if (list.filter((e) => e.kind === k).length > 1) issues.push(`이야기 ${arcId}: ${k} 결말이 둘`);
    if (list.length === 1 && list[0].kind !== 'canon') issues.push(`이야기 ${arcId}: 결말이 하나면 그것은 하나로 모이는 결말(canon)`);
    const qids = new Set(list.map((e) => e.questId));
    if (qids.size > 1) issues.push(`이야기 ${arcId}: 결말을 정하는 편이 여럿`);
    if (list.length > 1) {
      const t = completeTalkOf(list[0].questId);
      if (!t) { issues.push(`이야기 ${arcId}: 결말이 여럿인데 끝내는 자리 대화가 없다`); continue; }
      const used = new Set<string>();
      for (const n of Object.values(t.nodes)) for (const c of n.choices) if (c.end?.ending) used.add(c.end.ending);
      for (const e of list) if (!used.has(e.id)) issues.push(`결말 ${e.id}: 대화에서 닿는 끝이 없다`);
    }
  }
  return issues;
}
