/**
 * @file QuestMeeting.test.ts
 * @description 291차 — 출장 인물 · 받는 · 끝내는 자리 · 인물이 지금 있는 지역 판정과 만나는 자리 표의 무결성.
 */
import { describe, expect, it } from 'vitest';
import { meetPlaceOf, meetStageOpenIn, npcRegionNow, questGuestsIn, type MeetingCtx } from './QuestMeeting.js';
import { QUEST_MEETING } from '../db-schema/StoryMeeting.js';
import { STORY_QUESTS } from '../db-schema/StoryQuestDatabase.js';
import type { StoryQuestDef } from '../types/Story.js';
import { isRegionOpenAtChapter } from '../db-schema/StoryChapters.js';

/** 시험용 편 둘 — 의뢰인 hyeonsu는 속초에만 산다 */
const QA: StoryQuestDef = {
  id: 'T-1', kind: 'main', part: 1, chapter: 2, titleKo: '', titleEn: '', descKo: '', descEn: '', minLevel: 1, xp: 0,
  giver: 'hyeonsu', region: 'busan', prereq: [],
  objectives: [{ kind: 'talk', npcId: 'tak_mansu', labelKo: '', labelEn: '' }, { kind: 'catch', labelKo: '', labelEn: '' }],
} as unknown as StoryQuestDef;
const QB: StoryQuestDef = { ...QA, id: 'T-2', giver: 'seo_harin' } as StoryQuestDef;

const ctx = (st: Record<string, string>, open: Record<string, boolean[]> = {}, done: Record<string, boolean> = {}): MeetingCtx => ({
  placedIn: (npc, r) => (npc === 'seo_harin' ? r === 'busan' : r === 'gangwon_sokcho'),
  status: (q) => st[q.id] ?? 'locked',
  allObjectivesDone: (q) => !!done[q.id],
  objectiveOpen: (q, i) => !!open[q.id]?.[i],
});

describe('291 출장 인물', () => {
  it('받을 수 있는 편 — 집 자리가 없는 의뢰인이 편의 지역에 나온다 · 사는 사람은 그대로', () => {
    expect(questGuestsIn('busan', ctx({ 'T-1': 'available', 'T-2': 'available' }), [QA, QB])).toEqual([{ npcId: 'hyeonsu', questId: 'T-1', stage: 'offer' }]);
    expect(questGuestsIn('gangwon_sokcho', ctx({ 'T-1': 'available' }), [QA])).toEqual([]);
    expect(questGuestsIn('busan', ctx({ 'T-1': 'locked' }), [QA])).toEqual([]);
  });
  it('진행 중 — 열린 대화 목표의 상대가 먼저 · 그다음 의뢰인', () => {
    const g = questGuestsIn('busan', ctx({ 'T-1': 'active' }, { 'T-1': [true, true] }), [QA]);
    expect(g.map((x) => x.npcId)).toEqual(['tak_mansu', 'hyeonsu']);
    expect(g[0].stage).toBe(0);
    const g2 = questGuestsIn('busan', ctx({ 'T-1': 'active' }, { 'T-1': [false, true] }), [QA]);
    expect(g2.map((x) => x.npcId)).toEqual(['hyeonsu']);
  });
  it('끝난 편은 아무도 부르지 않는다', () => {
    expect(questGuestsIn('busan', ctx({ 'T-1': 'done' }), [QA])).toEqual([]);
  });
});

describe('291 받는 · 끝내는 자리', () => {
  const placedIn = ctx({}).placedIn;
  it('표에 없는 편 = 어디서든 · 의뢰인이 편의 지역에 살면 늘 열린다', () => {
    expect(meetPlaceOf('없는 편', 'offer')).toBe('any');
    expect(meetStageOpenIn(QA, 'offer', 'gangwon_sokcho', placedIn)).toBe(true);
    expect(meetStageOpenIn(QB, 'offer', 'gangwon_sokcho', placedIn)).toBe(true);
  });
  it('인물이 지금 있는 지역 — 추적 중인 할 일의 지역에 나와 있으면 그곳 · 아니면 출장 지역 → 집', () => {
    const c = ctx({ 'T-1': 'available' });
    // 실제 편 표로 판정하므로 시험 편 대신 npc 하나로 본다 — 출장이 없으면 집
    expect(npcRegionNow('nobody', ['gangwon_sokcho'], c, 'busan', ['busan'])).toBe('gangwon_sokcho');
    expect(npcRegionNow('nobody', ['gangwon_sokcho'], c, 'gangwon_sokcho', ['busan'])).toBe('gangwon_sokcho');
  });
});

describe('291 만나는 자리 표', () => {
  const byId = new Map(STORY_QUESTS.map((q) => [q.id, q]));
  it('표의 편은 의뢰인이 있는 편 · 대화 목표 번호는 실제 대화 목표', () => {
    const bad: string[] = [];
    for (const [id, m] of Object.entries(QUEST_MEETING)) {
      const q = byId.get(id);
      if (!q) { bad.push(`${id} 없는 편`); continue; }
      if (!q.giver) bad.push(`${id} 의뢰인 없음`);
      for (const k of Object.keys(m.talks ?? {})) {
        const o = q.objectives[Number(k)];
        if (!o || (o.kind !== 'talk' && o.kind !== 'deliverFree')) bad.push(`${id}#${k} 대화 목표 아님`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('받는 · 끝내는 자리가 `here`인 편은 그 지역이 편의 장에서 열려 있다(받으러 · 보고하러 갈 수 있다)', () => {
    const bad: string[] = [];
    for (const [id, m] of Object.entries(QUEST_MEETING)) {
      const q = byId.get(id)!;
      if ((m.offer === 'here' || m.complete === 'here') && !isRegionOpenAtChapter(q.region, q.chapter)) bad.push(`${id} ${q.region} ${q.chapter}장`);
    }
    expect(bad).toEqual([]);
  });
});
