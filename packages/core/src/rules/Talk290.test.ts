/**
 * @file Talk290.test.ts
 * @description 290차 — 호칭 「OOO 씨」 · 주인공 이름 자리 표시 · 대본 다시 쓰기 덮개(옛 답 표시 · 보상 답 · 미루기) 검사.
 */
import { describe, expect, it } from 'vitest';
import { fillPlayerName, npcAddressIssue, playerAddressIssues, playerTokenIssue } from './PlayerAddress.js';
import { talkAddressWarnings, talkAnswerRef, talkCoverageIssues, validateTalks } from './StoryTalk.js';
import { STORY_TALKS } from '../db-schema/StoryTalks.js';
import { STORY_QUESTS } from '../db-schema/StoryQuestDatabase.js';
import { progressAskOf } from '../db-schema/StoryProgressAsk.js';
import { INQUIRY_NODES } from '../db-schema/StoryInquiry.js';
import { choicesFor } from '../db-schema/StoryChoices.js';
import { narrativeOf } from '../db-schema/StoryNarrative.js';
import { STORY_NARRATIVE_EN } from '../db-schema/StoryNarrativeEn.js';
import { getJournalPage } from '../db-schema/JournalPages.js';

describe('290 호칭 — 부름말 찾기', () => {
  it('부르는 꼴 · 가리키는 꼴 · 자기 집안', () => {
    expect(playerAddressIssues('할머니, 이거 드세요.')).toEqual([{ word: '할머니', at: 0, vocative: true }]);
    expect(playerAddressIssues('선장님!')[0]?.vocative).toBe(true);
    expect(playerAddressIssues('형, 같이 가요')[0]).toMatchObject({ word: '형', vocative: true });
    expect(playerAddressIssues('아저씨는 어떻게 하셨어요?')[0]).toMatchObject({ word: '아저씨', vocative: false });
    expect(playerAddressIssues('우리 할머니가 그랬어요.')).toEqual([]);
    expect(playerAddressIssues('너희 할아버지는 원래 말이 없어?')).toEqual([]);
    expect(playerAddressIssues('지형이 험하네요. 형편이 어렵대요.')).toEqual([]);
    expect(playerAddressIssues('정옥선 씨, 다녀왔습니다.')).toEqual([]);
  });
  it('인물이 주인공을 성별 · 나이로 부르는 꼴', () => {
    expect(npcAddressIssue('총각, 이리 와 봐')).toBe('총각');
    expect(npcAddressIssue('젊은이, 고맙네')).toBe('젊은이');
    expect(npcAddressIssue('{player} 씨, 고맙네')).toBeUndefined();
    expect(npcAddressIssue('우리 아가씨 시절엔 말이야')).toBeUndefined();
  });
});

describe('290 주인공 이름 자리 표시', () => {
  it('이름으로 바꾼다 · 이름이 없으면 당신', () => {
    expect(fillPlayerName('{player} 씨, 왔나?', '한여름')).toBe('한여름 씨, 왔나?');
    expect(fillPlayerName('{player}, you came?', 'Haneul')).toBe('Haneul, you came?');
    expect(fillPlayerName('{player} 씨, 왔나?', '')).toBe('당신, 왔나?');
    expect(fillPlayerName('자리 표시 없음', '한여름')).toBe('자리 표시 없음');
  });
  it('꼴 검사 — 한국어는 「{player} 씨」만 · 영어에도', () => {
    expect(playerTokenIssue('{player} 씨, 왔나?', '{player}, you came?')).toBeUndefined();
    expect(playerTokenIssue('{player}가 왔다', '{player} came')).toBeDefined();
    expect(playerTokenIssue('{player} 씨, 왔나?', 'You came?')).toBeDefined();
    expect(playerTokenIssue('{name} 씨', '{name}')).toBeDefined();
  });
});

describe('290 대본 — 무결성 · 덮개 · 호칭', () => {
  it('대본 전부가 검사를 통과한다', () => {
    expect(validateTalks()).toEqual([]);
  });
  it('의뢰인이 있는 편마다 받는 · 끝내는 자리 대본 · 옛 답 표시 · 보상 답 · 미루기', () => {
    expect(talkCoverageIssues()).toEqual([]);
    const givers = STORY_QUESTS.filter((q) => q.giver).length;
    expect(STORY_TALKS.filter((t) => t.at === 'offer').length).toBe(givers);
    expect(STORY_TALKS.filter((t) => t.at === 'complete').length).toBe(givers);
  });
  it('주인공 말에 나이 · 성별 · 직함 부름말이 없다(가리키는 말까지)', () => {
    expect(talkAddressWarnings()).toEqual([]);
  });
  it('대본 밖 주인공 말(목표 줄 · 진행 중 내 답 · 물어보기)에도 부름말이 없다', () => {
    const bad: string[] = [];
    for (const q of STORY_QUESTS) {
      q.objectives.forEach((o, i) => {
        for (const a of playerAddressIssues(o.labelKo)) bad.push(`${q.id}#${i} 목표 「${a.word}」`);
        const p = progressAskOf(q.id, i);
        for (const a of playerAddressIssues(p?.answerKo ?? '')) bad.push(`${q.id}#${i} 내 답 「${a.word}」`);
      });
    }
    for (const n of INQUIRY_NODES) for (const a of playerAddressIssues(n.askKo)) bad.push(`${n.id} 물음 「${a.word}」`);
    expect(bad).toEqual([]);
  });
  it('옛 답 문구(고를 말)에도 주인공의 나이 · 성별 · 직함 부름말이 없다', () => {
    const bad: string[] = [];
    for (const q of STORY_QUESTS) {
      const s = choicesFor(q);
      for (const c of [...s.offer, ...s.complete]) {
        for (const a of playerAddressIssues(c.labelKo)) bad.push(`${q.id}/${c.id} 「${a.word}」`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('끝이 묶인 옛 답 — 받는 자리 offer · 끝내는 자리 complete', () => {
    const offer = STORY_TALKS.find((t) => t.at === 'offer')!;
    const done = STORY_TALKS.find((t) => t.at === 'complete')!;
    expect(talkAnswerRef(offer, { accept: true, offer: 'x' })).toEqual({ stage: 'offer', id: 'x' });
    expect(talkAnswerRef(done, { complete: 'y' })).toEqual({ stage: 'complete', id: 'y' });
    expect(talkAnswerRef(done, { accept: true, offer: 'x' })).toBeUndefined();
  });
});

/** 편 하나에 걸린 글 전부(제목 · 소개 · 목표 줄 · 옛 나레이션 · 옛 답 · 대본 · 진행 중 물음) */
function questTexts(id: string): string[] {
  const out: string[] = [];
  const walk = (o: unknown): void => {
    if (typeof o === 'string') out.push(o);
    else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  };
  const q = STORY_QUESTS.find((x) => x.id === id)!;
  walk([q.titleKo, q.titleEn, q.descKo, q.descEn, q.objectives]);
  walk(narrativeOf(id));
  walk(STORY_NARRATIVE_EN[id]);
  walk(choicesFor(q));
  for (const t of STORY_TALKS) if (t.questId === id) walk(t.nodes);
  q.objectives.forEach((_, i) => walk(progressAskOf(id, i)));
  return out;
}

describe('290(2) 데이터 어긋남', () => {
  it('M3-08 「겨울 참돔」 — 목표도 겨울', () => {
    const q = STORY_QUESTS.find((x) => x.id === 'M3-08')!;
    expect(q.objectives[0].season).toEqual(['winter']);
    expect(q.objectives[0].labelKo).toContain('겨울');
    // 이 편이 채우는 조행록 6장도 겨울 참돔을 받는다
    expect(getJournalPage(6)?.seasons).toContain('winter');
  });
  it('M4-03 「지세포의 밤」 — 목표 줄이 낮을 말하지 않는다', () => {
    const q = STORY_QUESTS.find((x) => x.id === 'M4-03')!;
    expect(q.objectives[0].labelKo).not.toMatch(/주간|낮/);
    expect(q.objectives[0].labelKo).toContain('밤');
  });
  it('네 살 사진은 18년 전(주인공 22세) — 「22년」은 아버지 배에만', () => {
    for (const id of ['M7-04', 'M7-08', 'N22-8']) {
      expect(questTexts(id).filter((s) => /22년|twenty-two years/i.test(s))).toEqual([]);
    }
    expect(questTexts('M7-04').some((s) => s.includes('18년'))).toBe(true);
  });
  it('강두철의 신분(조합장) · 초보 행세는 N03-2 전에 닿는 편에 나오지 않는다', () => {
    const byId = new Map(STORY_QUESTS.map((q) => [q.id, q]));
    const before = (id: string, seen = new Set<string>()): Set<string> => {
      for (const p of byId.get(id)?.prereq ?? []) if (!seen.has(p)) { seen.add(p); before(p, seen); }
      return seen;
    };
    const bad: string[] = [];
    for (const q of STORY_QUESTS) {
      if (q.id === 'N03-2' || before(q.id).has('N03-2')) continue;
      for (const s of questTexts(q.id)) {
        if (/조합장|chairman|Mr\. President|척하던|초보 행세|playing beginner|pretended he could not/i.test(s)) bad.push(`${q.id}: ${s.slice(0, 60)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
