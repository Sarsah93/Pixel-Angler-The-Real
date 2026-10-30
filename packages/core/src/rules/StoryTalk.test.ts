/**
 * @file StoryTalk.test.ts
 * @description 254차 — 이어지는 대화 · 결말 시험(무결성 · 사용자 예시 흐름 · 결말 효과 · 가게 조건)
 */
import { describe, expect, it } from 'vitest';
import {
  validateTalks, validateEndings, offerTalkOf, objectiveTalkOf, completeTalkOf, talkVisibleChoices, talkNode,
  endingsOfArc, canonEndingOf, npcShopTerms, npcAffinityCap, npcEndingRole, allTalkLines, endingArcOfQuest, type TalkCtx,
} from './StoryTalk.js';
import { STORY_TALKS } from '../db-schema/StoryTalks.js';
import { STORY_ENDINGS } from '../db-schema/StoryEndings.js';
import { STORY_ARCS } from '../db-schema/StoryArcs.js';
import type { TalkNodeDef } from '../types/Story.js';

const ctx = (flags: string[] = [], aff: Record<string, number> = {}): TalkCtx => ({
  hasFlag: (k) => flags.includes(k), affinity: (n) => aff[n] ?? 0,
});

/** 290차 — 대본 장면이면 박자 대사를 이어 붙인 글(옛 꼴이면 lineKo) */
const nodeText = (n: TalkNodeDef): string => [n.lineKo, ...(n.beats ?? []).map((b) => (b.kind === 'line' ? b.ko : ''))].join('\n');

describe('254차 — 이어지는 대화', () => {
  it('무결성 검사가 깨끗하다', () => {
    expect(validateTalks()).toEqual([]);
    expect(validateEndings()).toEqual([]);
  });

  it('이야기마다 결말은 1~3개 · 결말이 하나면 정본이다', () => {
    const arcs = new Set(STORY_ENDINGS.map((e) => e.arcId));
    for (const a of arcs) {
      const list = endingsOfArc(a);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.length).toBeLessThanOrEqual(3);
      if (list.length === 1) expect(list[0].kind).toBe('canon');
      expect(STORY_ARCS.some((x) => x.id === a)).toBe(true);
    }
    // 뒤 이야기가 기대는 아크는 정본 하나
    for (const a of ['N19', 'N02', 'N03']) {
      expect(endingsOfArc(a).map((e) => e.kind)).toEqual(['canon']);
      expect(canonEndingOf(a)).toBeDefined();
    }
    expect(endingsOfArc('N24').map((e) => e.kind).sort()).toEqual(['canon', 'neutral', 'rupture']);
    expect(endingArcOfQuest('N24-3')).toBe('N24');
  });

  it('사용자 예시 — B를 감싸면 A가 「누구 편이냐」 → 「둘 다 같은 사람」 → 「도울 생각이 없는 거지?」 → 두 갈래', () => {
    const t = offerTalkOf('N24-2')!;
    expect(t).toBeDefined();
    const start = talkNode(t, t.start)!;
    const notBad = start.choices.find((c) => c.id === 'not_bad')!;
    expect(notBad.affinity?.mun_pilgu).toBeLessThan(0);
    const side = talkNode(t, notBad.next!)!;
    expect(nodeText(side)).toContain('누구 편을 드는 거냐');
    const same = side.choices.find((c) => c.labelKo === '둘 다 같은 사람인 것 같습니다.')!;
    const noHelp = talkNode(t, same.next!)!;
    expect(nodeText(noHelp)).toContain('도울 생각이 없는 거지');
    const labels = noHelp.choices.map((c) => c.labelKo);
    expect(labels).toContain('그건 아닙니다만…');
    const tell = noHelp.choices.find((c) => c.id === 'ask_him')!;
    expect(tell.end?.lineKo).toContain('다 내가 시킨 일이니 그렇다고 해라');
    expect(tell.flags).toContain('choice.n24_mission_tell');
    const provoke = noHelp.choices.find((c) => c.id === 'not_that')!;
    expect(provoke.end?.lineKo).toContain('영배를 자극해');
  });

  it('B 앞에서 사실대로든 자극이든 B의 마음이 식는다 — 「너도 매한가지로구나」', () => {
    const t = objectiveTalkOf('N24-2', 1)!;
    const start = talkNode(t, t.start)!;
    // 사실대로 말하기는 A가 그렇게 시켰을 때만 보인다
    expect(talkVisibleChoices(start, ctx()).some((c) => c.id === 'tell_truth')).toBe(false);
    expect(talkVisibleChoices(start, ctx(['choice.n24_mission_tell'])).some((c) => c.id === 'tell_truth')).toBe(true);
    for (const id of ['tell_truth', 'provoke']) {
      const c = start.choices.find((x) => x.id === id)!;
      expect(c.affinity?.cha_yeongbae).toBeLessThan(0);
      expect(nodeText(talkNode(t, c.next!)!)).toContain('너도 매한가지로구나');
    }
  });

  it('결말 — 화해는 찢긴 장을 봤을 때만 · 갈라지는 결말은 값 깎기 막힘 · 귀한 물건 없음 · 영영 상한', () => {
    const t = completeTalkOf('N24-3')!;
    const start = talkNode(t, t.start)!;
    expect(talkVisibleChoices(start, ctx()).some((c) => c.id === 'both')).toBe(false);
    expect(talkVisibleChoices(start, ctx(['choice.n24_saw_torn'])).some((c) => c.id === 'both')).toBe(true);
    expect(npcShopTerms('cha_yeongbae', ['n24_dark'])).toEqual({ noHaggle: true, rare: 'none' });
    expect(npcAffinityCap('cha_yeongbae', ['n24_dark'])).toBe(-0.4);
    expect(npcEndingRole('cha_yeongbae', ['n24_dark'])?.ko).toContain('간판을 내린');
    expect(npcShopTerms('mun_pilgu', ['n24_together'])).toEqual({ rare: 'more' });
    expect(npcShopTerms('mun_pilgu', ['n24_apart'])).toEqual({});
    expect(npcAffinityCap('mun_pilgu', ['n24_dark'])).toBeUndefined();
  });

  it('사전 — 대화 · 결말 한 · 영 짝이 있다', () => {
    const pairs = allTalkLines();
    expect(pairs.length).toBeGreaterThan(100);
    for (const [ko, en] of pairs) { expect(ko.length).toBeGreaterThan(0); expect(/[가-힣]/.test(en)).toBe(false); }
    expect(STORY_TALKS.length).toBeGreaterThanOrEqual(9);
  });
});
