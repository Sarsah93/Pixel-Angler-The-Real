/**
 * @file LoinKama332.test.ts
 * @description 332(2) — 가마살을 따로 내는 해체 어종(방어류 · 다랑어류 · 새치류)과 내지 않는 큰 바리류.
 *  사용자 결정: 「자바리, 다금바리, 능성어 등은 가마살 없는 걸로 하자. 어차피 매운탕용 서더리로 쓰는 용도가 더 많아서.」
 */
import { describe, it, expect } from 'vitest';
import { LOIN_KAMA_SPECIES, yieldsKama, isLoinBreakdown, LOIN_BREAKDOWN_MIN_CM, BUTCHERY_PROFILES } from '../db-schema/ButcheryProfiles.js';
import { sectionsForSpecies, LOIN_SECTIONS, LOIN_SECTIONS_NO_KAMA } from '../db-schema/ButcherySections.js';

const headTask = (speciesId: string) => sectionsForSpecies(speciesId, 'round', 'loin')
  .find((s) => s.id === 'sec_prep')!.tasks.find((t) => t.id === 't_head')!;

describe('332(2) 가마살을 내는 해체 어종', () => {
  it('가마살 어종은 모두 해체 어종이다', () => {
    for (const id of LOIN_KAMA_SPECIES) expect(isLoinBreakdown(id, 300), id).toBe(true);
  });

  it('방어류 · 다랑어류 · 새치류는 머리 작업이 가마살 둘을 함께 낸다', () => {
    for (const id of ['yellowtail', 'amberjack', 'greater_amberjack', 'bluefin_tuna', 'bigeye_tuna', 'swordfish', 'striped_marlin']) {
      expect(yieldsKama(id), id).toBe(true);
      expect(sectionsForSpecies(id, 'round', 'loin'), id).toBe(LOIN_SECTIONS);
      expect(headTask(id).yields, id).toEqual(['head', 'kama']);
    }
  });

  it('큰 바리류는 가마살을 내지 않는다 — 머리 작업은 머리만', () => {
    for (const id of ['longtooth_grouper', 'sawedged_perch', 'sevenband_grouper']) {
      expect(yieldsKama(id), id).toBe(false);
      expect(isLoinBreakdown(id, 90), id).toBe(true);
      expect(sectionsForSpecies(id, 'round', 'loin'), id).toBe(LOIN_SECTIONS_NO_KAMA);
      expect(headTask(id).yields, id).toEqual(['head']);
      expect(headTask(id).label, id).toBe('머리 떼기');
    }
  });

  it('가마살 없는 트리는 머리 작업만 다르다', () => {
    expect(LOIN_SECTIONS_NO_KAMA.length).toBe(LOIN_SECTIONS.length);
    LOIN_SECTIONS.forEach((sec, i) => {
      const other = LOIN_SECTIONS_NO_KAMA[i];
      if (sec.id !== 'sec_prep') { expect(other).toBe(sec); return; }
      expect(other.tasks.map((t) => t.id)).toEqual(sec.tasks.map((t) => t.id));
      sec.tasks.forEach((t, k) => { if (t.id !== 't_head') expect(other.tasks[k]).toBe(t); });
      expect(other.tasks.find((t) => t.id === 't_head')!.stageIds).toEqual(sec.tasks.find((t) => t.id === 't_head')!.stageIds);
    });
    // 원본 트리는 그대로다
    expect(LOIN_SECTIONS.find((s) => s.id === 'sec_prep')!.tasks.find((t) => t.id === 't_head')!.yields).toEqual(['head', 'kama']);
  });

  it('해체 어종 가운데 가마살이 없는 것은 큰 바리류 셋뿐이다', () => {
    const loin = new Set([...Object.keys(LOIN_BREAKDOWN_MIN_CM), ...Object.keys(BUTCHERY_PROFILES).filter((id) => BUTCHERY_PROFILES[id].tree === 'loin')]);
    const none = [...loin].filter((id) => !yieldsKama(id)).sort();
    expect(none).toEqual(['longtooth_grouper', 'sawedged_perch', 'sevenband_grouper']);
  });
});
