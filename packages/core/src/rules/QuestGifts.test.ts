/**
 * @file QuestGifts.test.ts
 * @description 237차 — N19-7 정옥선의 철 따라 다른 선물 · 텃밭 입문 퀘스트 2편(귀퉁이 바구니 · 첫물) 시험
 */
import { describe, expect, it } from 'vitest';
import { okseonSpareGift } from './QuestGifts.js';
import { cropStartOfItem } from '../db-schema/CropDatabase.js';
import { cropGate } from '../simulation/FarmSim.js';
import { STORY_QUESTS, getStoryQuest, validateStoryQuests } from '../db-schema/StoryQuestDatabase.js';
import { narrativeOf } from '../db-schema/StoryNarrative.js';
import { choicesFor, lessonCategoryOf, validateStoryChoices } from '../db-schema/StoryChoices.js';
import { objectiveTarget } from './QuestGuide.js';

describe('237차 — 정옥선의 남는 모종 · 씨앗(철마다 다르다)', () => {
  it('어느 달에 받아도 그달 바로 심을 수 있는 쉬운 작물이다', () => {
    for (let m = 1; m <= 12; m++) {
      const g = okseonSpareGift(m, { homi: true, sproutJar: true });
      const starts = g.items.map((it) => cropStartOfItem(it.id)).filter((x) => !!x);
      expect(starts.length, `${m}월`).toBe(1);
      const { crop, start } = starts[0]!;
      expect(crop.site === 'indoor' || start.months.includes(m), `${m}월 ${crop.id}`).toBe(true);
      expect(g.site, `${m}월`).toBe(crop.site);
      expect(cropGate(crop, start), `${m}월 ${crop.id}`).toEqual({ tier: 1, level: 1 });
      // 두 칸을 채울 만큼 준다(모종은 칸당 포기 수 × 2)
      expect(g.items[0].qty, `${m}월`).toBe(Math.max(1, start.perCell) * 2);
    }
  });

  it('호미는 텃밭 철에만 · 가방에 없을 때만 / 시루는 겨울에만 · 집에 없을 때만', () => {
    expect(okseonSpareGift(4, { homi: false, sproutJar: false }).items.some((i) => i.id === 'farm_homi')).toBe(true);
    expect(okseonSpareGift(4, { homi: true, sproutJar: false }).items.some((i) => i.id === 'farm_homi')).toBe(false);
    expect(okseonSpareGift(4, { homi: false, sproutJar: false }).furniture).toBeUndefined();
    expect(okseonSpareGift(12, { homi: false, sproutJar: false }).furniture).toBe('sprout_jar');
    expect(okseonSpareGift(12, { homi: false, sproutJar: true }).furniture).toBeUndefined();
    expect(okseonSpareGift(12, { homi: false, sproutJar: false }).items.some((i) => i.id === 'farm_homi')).toBe(false);
  });
});

describe('237차 — 텃밭 입문 서브 퀘스트(N19-7 귀퉁이 바구니 · N19-8 첫물)', () => {
  it('무결성 검사가 깨끗하다(퀘스트 188편 · 선택지)', () => {
    expect(STORY_QUESTS.length).toBe(188);
    expect(validateStoryQuests()).toEqual([]);
    expect(validateStoryChoices()).toEqual([]);
  });

  it('Ch1 서브 · 레벨 12 · 정옥선 · 심기 두 칸 → 거두기 한 번', () => {
    const a = getStoryQuest('N19-7')!; const b = getStoryQuest('N19-8')!;
    for (const q of [a, b]) {
      expect(q.kind).toBe('sub');
      expect(q.chapter).toBe(1);
      expect(q.minLevel).toBe(12);
      expect(q.giver).toBe('okseon');
      expect(lessonCategoryOf(q)).toBe('farming');
      expect(objectiveTarget(q, q.objectives[0])).toEqual({ kind: 'region', regionId: 'hometown' });
    }
    expect(a.prereq).toContain('M1-02');
    expect(b.prereq).toEqual(['N19-7']);
    expect(a.objectives[0]).toMatchObject({ kind: 'farm', target: 2 });
    expect(a.objectives[0].farmAction ?? 'plant').toBe('plant');
    expect(b.objectives[0]).toMatchObject({ kind: 'farm', farmAction: 'harvest' });
    // 작물을 가리지 않는다 — 철이 지나도 막히지 않는다(R12)
    expect(a.objectives[0].itemId).toBeUndefined();
    expect(b.objectives[0].itemId).toBeUndefined();
  });

  it('나레이션 · 선택지 영어가 다 있다', () => {
    for (const id of ['N19-7', 'N19-8']) {
      const n = narrativeOf(id)!;
      expect(n.introEn && n.introEn !== n.intro, id).toBeTruthy();
      for (const k of ['offer', 'progress', 'done', 'epilogue'] as const) {
        const en = n[`${k}En` as const];
        expect(en && en !== n[k], `${id} ${k}`).toBeTruthy();
      }
      const s = choicesFor(getStoryQuest(id)!);
      for (const c of s.complete) {
        expect(c.labelEn, `${id}/${c.id}`).not.toBe(c.labelKo);
        expect(c.replyEn, `${id}/${c.id}`).not.toBe(c.replyKo);
      }
    }
  });
});
