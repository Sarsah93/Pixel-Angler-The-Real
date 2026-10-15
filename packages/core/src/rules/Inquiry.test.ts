/**
 * @file Inquiry.test.ts
 * @description 253차 — 물어보기(조사 대화) 판정 · 데이터 무결성 시험
 */
import { describe, expect, it } from 'vitest';
import {
  inquiryKnows, inquiryNodeOpen, inquiryTopicsFor, inquiryNodesForQuest, inquiryDrivesAction, inquiryNode,
  allInquiryLines, validateInquiry, type InquiryCtx, type InquiryQuestState,
} from './Inquiry.js';
import { INQUIRY_NODES } from '../db-schema/StoryInquiry.js';

/** 판정 문맥 — 끝낸 편 · 진행 중 편 · 들은 물음만 바꿔 본다 */
function ctx(o: { done?: string[]; active?: string[]; asked?: string[]; learned?: string[]; chapter?: number; flags?: string[] } = {}): InquiryCtx {
  const done = new Set(o.done ?? []); const active = new Set(o.active ?? []);
  return {
    learned: new Set(o.learned ?? []), asked: new Set(o.asked ?? []),
    questState: (id): InquiryQuestState => (active.has(id) ? 'active' : done.has(id) ? 'done' : 'none'),
    chapter: o.chapter ?? 1,
    hasFlag: (k) => (o.flags ?? []).includes(k),
    affinity: () => 0,
  };
}

describe('253차 — 물어보기 데이터 무결성', () => {
  it('참조 · 유일 id · 닿을 수 있는 화제 · 글 규칙이 다 맞다', () => {
    expect(validateInquiry()).toEqual([]);
  });

  it('사전 짝 — 모든 물음 · 답에 영어가 있고 단락끼리도 짝이 있다', () => {
    const lines = allInquiryLines();
    for (const [ko, en] of lines) { expect(en.trim().length, ko.slice(0, 20)).toBeGreaterThan(0); expect(/[가-힣]/.test(en), en.slice(0, 30)).toBe(false); }
    const multi = INQUIRY_NODES.filter((n) => n.answerKo.includes('\n\n'));
    for (const n of multi) for (const p of n.answerKo.split('\n\n')) expect(lines.some(([k]) => k === p), `${n.id} 단락`).toBe(true);
  });
});

describe('253차 — 아는 화제 · 열린 물음', () => {
  it('처음부터 아는 화제 · 진행으로 아는 화제 · 들어서 아는 화제', () => {
    expect(inquiryKnows('c_photo', ctx())).toBe(true);
    expect(inquiryKnows('p_okseon', ctx())).toBe(false);
    expect(inquiryKnows('p_okseon', ctx({ done: ['M1-01'] }))).toBe(true);
    expect(inquiryKnows('p_coop', ctx({ learned: ['p_coop'] }))).toBe(true);
    expect(inquiryKnows('c_measure', ctx({ flags: ['choice.m1_law_story'] }))).toBe(true);
  });

  it('꼬리 질문은 앞 물음을 들어야 열린다', () => {
    const tail = inquiryNode('okseon.law.who')!;
    const base = { done: ['M1-01', 'M1-06'] };
    expect(inquiryNodeOpen(tail, ctx(base))).toBe(false);
    expect(inquiryNodeOpen(tail, ctx({ ...base, asked: ['okseon.law'] }))).toBe(true);
  });

  it('밝혀지기 전과 뒤의 대답이 갈린다(스포일러 금지)', () => {
    const before = inquiryNode('okseon.photo')!; const after = inquiryNode('okseon.photo_after')!;
    const early = ctx({ done: ['M1-01'] });
    const late = ctx({ done: ['M1-01', 'M7-04'], chapter: 7 });
    expect(inquiryNodeOpen(before, early)).toBe(true);
    expect(inquiryNodeOpen(after, early)).toBe(false);
    expect(inquiryNodeOpen(before, late)).toBe(false);
    expect(inquiryNodeOpen(after, late)).toBe(true);
  });

  it('화제 목록은 새 물음이 있는 화제가 앞이고, 조사 물음은 일반 목록에 없다', () => {
    const c = ctx({ done: ['M1-01', 'M1-06'], asked: ['okseon.law'] });
    const list = inquiryTopicsFor('okseon', c);
    expect(list.length).toBeGreaterThan(0);
    const firstStale = list.findIndex((e) => e.fresh === 0);
    if (firstStale >= 0) expect(list.slice(firstStale).every((e) => e.fresh === 0)).toBe(true);
    for (const e of list) for (const n of e.nodes) expect(n.effect?.action, n.id).toBeUndefined();
  });
});

describe('253차 — 조사 목표(물어서 단계를 연다)', () => {
  /** 편 · 목표 · 물음으로 여는 단계(의뢰인 앞 선택 단계) */
  const CASES: [string, number, number[]][] = [
    ['M2-02', 1, [2]], ['M2-05', 2, [0, 1, 2]], ['M3-06', 1, [0, 1, 2]], ['N18-2', 1, [2]], ['N18-3', 1, [0, 1, 2]],
  ];
  it('조사 편마다 단계별 열쇠 물음이 있다', () => {
    for (const [q, obj, steps] of CASES) {
      expect(inquiryDrivesAction(q, obj), q).toBe(true);
      const keys = INQUIRY_NODES.filter((n) => n.effect?.action?.questId === q && n.effect.action.objectiveIndex === obj);
      for (const s of steps) expect(keys.some((n) => n.effect!.action!.step === s), `${q} 단계 ${s}`).toBe(true);
    }
  });

  it('조사 물음은 그 편이 진행 중일 때 진행 화면에 나온다', () => {
    for (const [q, obj] of CASES) {
      const giver = INQUIRY_NODES.find((n) => n.effect?.action?.questId === q)!.npcId;
      const nodes = inquiryNodesForQuest(giver, q, obj, ctx({ active: [q], done: ['M1-01', 'M1-06', 'M1-04', 'M2-01'], chapter: 3 }));
      // 열쇠 물음이 곁물음을 먼저 요구할 수 있다 — 그 편의 물음이 하나라도 열려 있으면 된다
      expect(nodes.length, q).toBeGreaterThan(0);
    }
  });
});
