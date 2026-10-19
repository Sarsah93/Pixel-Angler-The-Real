/**
 * @file KoreanPhrase.test.ts
 * @description 267차 — 할 일 문장 명사형 · 말하듯 잇기 규칙 시험. 이야기 목표 전부를 돌려 규칙이 깨지는 문장이 없는지 본다.
 */
import { describe, it, expect } from 'vitest';
import { objectiveNominalKo, spokenProgressKo, spokenDoneKo, particle } from './KoreanPhrase.js';
import { STORY_QUESTS } from '../db-schema/StoryQuestDatabase.js';
import { STORY_NARRATIVE } from '../db-schema/StoryNarrative.js';

describe('objectiveNominalKo', () => {
  it('받침 없는 어간(ㄴ다) · 받침 있는 어간(는다) · ㄹ 탈락 · 하다', () => {
    expect(objectiveNominalKo('사이소에서 저가 릴대를 산다')).toBe('사이소에서 저가 릴대를 사는 것');
    expect(objectiveNominalKo('테트라포드 틈에서 한 마리를 올린다')).toBe('테트라포드 틈에서 한 마리를 올리는 것');
    expect(objectiveNominalKo('얼음 상자를 지정된 위치에 내려놓는다')).toBe('얼음 상자를 지정된 위치에 내려놓는 것');
    expect(objectiveNominalKo('정옥선에게 보고한다')).toBe('정옥선에게 보고하는 것');
    expect(objectiveNominalKo('채비를 만든다')).toBe('채비를 만드는 것');
    expect(objectiveNominalKo('문을 연다')).toBe('문을 여는 것');
    expect(objectiveNominalKo('일지를 펼쳐 오늘 할 일을 확인한다')).toBe('일지를 펼쳐 오늘 할 일을 확인하는 것');
  });
  it('서술이 아니면 「」로 감싼다', () => {
    expect(objectiveNominalKo('전갱이 1마리')).toBe('「전갱이 1마리」');
    expect(objectiveNominalKo('덕장 주인과 대화')).toBe('「덕장 주인과 대화」');
  });
  it('이야기 목표 전부 — 명사형이거나 「」', () => {
    let n = 0;
    for (const q of STORY_QUESTS) {
      const nar = STORY_NARRATIVE[q.id];
      q.objectives.forEach((o, i) => {
        const label = nar?.objectives?.[i] ?? o.labelKo;
        const r = objectiveNominalKo(label);
        n++;
        expect(r.endsWith('는 것') || (r.startsWith('「') && r.endsWith('」'))).toBe(true);
      });
    }
    expect(n).toBeGreaterThan(300);
  });
});

describe('spokenProgressKo', () => {
  const items = [
    { label: '사이소에서 저가 릴대를 산다', done: true },
    { label: '테트라포드 틈에서 한 마리를 올린다', done: false },
  ];
  it('일부 끝냄', () => {
    expect(spokenProgressKo(items)).toBe('사이소에서 저가 릴대를 사는 것은 끝냈다. 이제 테트라포드 틈에서 한 마리를 올리는 것이 남았다.');
  });
  it('하나도 안 함 · 세는 목표', () => {
    expect(spokenProgressKo([{ label: '전갱이를 다섯 마리 낚는다', done: false, cur: 2, target: 5 }]))
      .toBe('해야 할 것은 전갱이를 다섯 마리 낚는 것(지금 2/5)이다.');
  });
  it('다 함', () => {
    expect(spokenProgressKo(items.map((o) => ({ ...o, done: true })))).toBe('할 일은 다 했다. 말을 다시 걸면 보고할 수 있다.');
    expect(spokenDoneKo(items)).toBe('사이소에서 저가 릴대를 사는 것은 끝냈다.');
  });
  it('조사', () => {
    expect(particle('것', '은', '는')).toBe('은');
    expect(particle('1마리', '은', '는')).toBe('는');
    expect(particle('「덕장 주인과 대화」', '이', '가')).toBe('가');
  });
});
