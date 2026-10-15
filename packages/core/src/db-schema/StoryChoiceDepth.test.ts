/**
 * @file StoryChoiceDepth.test.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 시험(전 편 3개 이상 · 긴 응답 · 영어 · 단락 짝 · 원래 답 보존)
 */
import { describe, expect, it } from 'vitest';
import { STORY_QUESTS } from './StoryQuestDatabase.js';
import { choicesFor, allChoiceLines, validateStoryChoices } from './StoryChoices.js';
import { STORY_CHOICE_DEPTH } from './StoryChoiceDepth.js';
import { narrativeOf } from './StoryNarrative.js';

const HANGUL = /[가-힣]/;
const len = (s: string): number => [...s].length;

describe('253차 — 답 깊이', () => {
  it('모든 편에 답 깊이 데이터가 있다(191편)', () => {
    const missing = STORY_QUESTS.filter((q) => !STORY_CHOICE_DEPTH[q.id]).map((q) => q.id);
    expect(missing).toEqual([]);
    expect(Object.keys(STORY_CHOICE_DEPTH).every((id) => STORY_QUESTS.some((q) => q.id === id))).toBe(true);
  });

  it('받는 자리 · 끝내는 자리 모두 늘 보이는 답이 3개 이상이다', () => {
    for (const q of STORY_QUESTS) {
      const s = choicesFor(q);
      expect(s.offer.filter((c) => !c.requires).length, `${q.id} 받는 자리`).toBeGreaterThanOrEqual(3);
      expect(s.complete.filter((c) => !c.requires).length, `${q.id} 끝내는 자리`).toBeGreaterThanOrEqual(3);
    }
  });

  it('표준 톤 두 줄(「그래.」 3자)은 더 나오지 않는다 — 받는 자리 응답은 30자 이상', () => {
    for (const q of STORY_QUESTS) {
      for (const c of choicesFor(q).offer) {
        expect(c.id.startsWith('tone_'), `${q.id}/${c.id}`).toBe(false);
        expect(len(c.replyKo), `${q.id}/${c.id} ${c.replyKo.slice(0, 20)}`).toBeGreaterThanOrEqual(30);
      }
    }
  });

  it('영어가 다 있고 한글이 섞이지 않는다 · 응답 단락 수가 한 · 영 같다', () => {
    for (const q of STORY_QUESTS) {
      const s = choicesFor(q);
      for (const c of [...s.offer, ...s.complete]) {
        const w = `${q.id}/${c.id}`;
        expect(HANGUL.test(c.labelEn), `${w} 라벨`).toBe(false);
        expect(HANGUL.test(c.replyEn), `${w} 응답`).toBe(false);
        expect(c.replyKo.split('\n\n').length, w).toBe(c.replyEn.split('\n\n').length);
      }
    }
  });

  it('응답을 늘려도 원래 응답은 앞에 그대로 남는다(보상을 드러내는 괄호 지문 보존)', () => {
    for (const [id, d] of Object.entries(STORY_CHOICE_DEPTH)) {
      const n = narrativeOf(id);
      for (const [cid, pair] of Object.entries(d.completeReply ?? {})) {
        const orig = n?.complete?.find((c) => c.id === cid);
        if (orig) expect(pair[0].startsWith(orig.replyKo.trim()), `${id}/${cid}`).toBe(true);
      }
      for (const [cid, pair] of Object.entries(d.offerReply ?? {})) {
        const orig = n?.offerChoices?.find((c) => c.id === cid);
        if (orig) expect(pair[0].startsWith(orig.replyKo.trim()), `${id}/${cid}`).toBe(true);
      }
    }
  });

  it('메인 편 받는 자리에는 미루기가 없다(이야기가 막히지 않게)', () => {
    for (const q of STORY_QUESTS.filter((x) => x.kind === 'main')) {
      expect(choicesFor(q).offer.some((c) => c.outcome.decline), q.id).toBe(false);
    }
  });

  it('사전 — 여러 단락 응답은 단락끼리도 짝이 있다', () => {
    const keys = new Set(allChoiceLines().map(([k]) => k));
    for (const q of STORY_QUESTS) {
      for (const c of [...choicesFor(q).offer, ...choicesFor(q).complete]) {
        if (!c.replyKo.includes('\n\n')) continue;
        for (const p of c.replyKo.split('\n\n')) expect(keys.has(p), `${q.id}/${c.id}`).toBe(true);
      }
    }
  });

  it('검증기 문제 0', () => {
    expect(validateStoryChoices()).toEqual([]);
  });
});
