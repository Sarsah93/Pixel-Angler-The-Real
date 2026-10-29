/**
 * @file Progress287.test.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) 시험: 전 편 빠짐없음 · 자문자답 금지 ·
 * 「해녀의 딸」 사용자 문장 그대로 · 영어 사전 쌍 · 바람 대사 성별.
 */
import { describe, expect, it } from 'vitest';
import {
  STORY_PROGRESS_ASKS, PROGRESS_ASK_FALLBACK, progressAskOf, allProgressAskLines, validateProgressAsks,
} from '../db-schema/StoryProgressAsk.js';
import { STORY_QUESTS } from '../db-schema/StoryQuestDatabase.js';
import { narrativeOf } from '../db-schema/StoryNarrative.js';
import { offerTalkOf, talkNode } from './StoryTalk.js';

describe('287차 — 진행 중 물음', () => {
  it('검사가 깨끗하다(발주자가 있는 편 전부 · 목표 수만큼)', () => {
    expect(validateProgressAsks()).toEqual([]);
    const withGiver = STORY_QUESTS.filter((q) => q.giver);
    expect(Object.keys(STORY_PROGRESS_ASKS).length).toBe(withGiver.length);
    for (const q of withGiver) expect(STORY_PROGRESS_ASKS[q.id]?.length).toBe(q.objectives.length);
  });

  it('물음은 하나로 끝나고(자문자답 없음) · 조언은 다시 묻지 않는다', () => {
    for (const arr of Object.values(STORY_PROGRESS_ASKS)) {
      for (const p of arr) {
        expect(p.askKo.trim().endsWith('?')).toBe(true);
        expect(p.askKo.split('?').length - 1).toBe(1);
        expect(p.replyKo.includes('?')).toBe(false);
        expect(p.answerKo.includes('?')).toBe(false);
      }
    }
  });

  it('「해녀의 딸」 — 딸을 만나기 전 물음은 사용자 문장 그대로', () => {
    const p = progressAskOf('N01-5', 0)!;
    expect(p.askKo).toBe('딸은 만나 봤나?');
    expect(p.answerKo).toBe('…아직 만나 보지 않았습니다.');
    expect(p.replyKo).toBe('시간 잘 확인해서 너무 늦은 시간에 방문하지 않도록 하는 게 좋을 것 같네. 아 그리고, 저녁에 물속에 들어가는 건 위험하니까 조심하고.');
    // 다음 목표(물가에서 갯것 셋 · 어머니께 보여 드리기)는 다른 물음이다 — 이미 만난 뒤에 「딸은 만나 봤나?」를 묻지 않는다
    expect(progressAskOf('N01-5', 1)!.askKo).not.toBe(p.askKo);
    expect(progressAskOf('N01-5', 2)!.askKo).not.toBe(p.askKo);
  });

  it('옛 자문자답 한 줄(`progress`)은 나레이션에서 빠졌다', () => {
    const n = narrativeOf('N01-5') as unknown as Record<string, unknown>;
    expect(n.progress).toBeUndefined();
  });

  it('영어 사전 쌍 — 한 벌마다 셋 · 두루 물음 포함', () => {
    const lines = allProgressAskLines();
    const total = Object.values(STORY_PROGRESS_ASKS).reduce((s, a) => s + a.length, 0);
    expect(lines.length).toBe((total + 1) * 3);
    const map = new Map(lines);
    expect(map.get('딸은 만나 봤나?')).toBeTruthy();
    expect(map.get(PROGRESS_ASK_FALLBACK.askKo)).toBe(PROGRESS_ASK_FALLBACK.askEn);
  });
});

describe('287차 — 바람 대사 성별', () => {
  it('「신뢰하는 남자에겐」 — 여자 주인공이면 「여자에겐」', () => {
    const pro = talkNode(offerTalkOf('N01-5')!, 'pro')!;
    const l = pro.beats!.find((b) => b.kind === 'line' && b.ko.includes('담배 한 갑도 곧바로'));
    expect(l && l.kind === 'line' && l.ko).toContain('신뢰하는 남자에겐');
    expect(l && l.kind === 'line' && l.koF).toContain('신뢰하는 여자에겐');
    expect(l && l.kind === 'line' && l.enF).toContain('a woman I trust');
  });
});
