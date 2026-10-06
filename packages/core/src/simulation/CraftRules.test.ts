/**
 * @file CraftRules.test.ts
 * @description 223차 — 도면 DB 무결성(얻는 길 · 분해 갈래 · 기술 조건) + 레벨 차 보정 · 분해 규칙.
 */
import { describe, it, expect } from 'vitest';
import {
  CRAFT_BLUEPRINTS, CRAFT_SCRAP_GROUPS, blueprintPaperId, blueprintsByOutput,
} from '../db-schema/CraftingDatabase.js';
import { getSkillById, isSkillPending } from '../db-schema/SkillDatabase.js';
import { craftLevelBonus, craftScrapReturn, craftScrapLearnChance } from './CraftRules.js';

describe('도면 DB', () => {
  it('id · 도면 종이 id가 겹치지 않는다', () => {
    const ids = CRAFT_BLUEPRINTS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    const papers = ids.map(blueprintPaperId);
    expect(new Set(papers).size).toBe(papers.length);
  });

  it('얻는 길이 올바르다(상점 값 > 0 · 분해 확률 0~1 · 분해 도면은 분해할 수 있는 갈래)', () => {
    for (const b of CRAFT_BLUEPRINTS) {
      if (!b.learn) continue;
      if (b.learn.via === 'shop') {
        expect(b.learn.priceWon, b.id).toBeGreaterThan(0);
        expect(b.learn.shop.length, b.id).toBeGreaterThan(0);
      } else {
        expect(b.learn.chance, b.id).toBeGreaterThan(0);
        expect(b.learn.chance, b.id).toBeLessThan(1);
        expect(CRAFT_SCRAP_GROUPS.includes(b.group), b.id).toBe(true);
        expect(blueprintsByOutput(b.outputId).length, b.id).toBeGreaterThan(0);
      }
    }
  });

  it('기술 조건은 실제 있는, 잠기지 않은 스킬이다', () => {
    for (const b of CRAFT_BLUEPRINTS) {
      if (!b.requiresSkill) continue;
      const d = getSkillById(b.requiresSkill.id);
      expect(d, b.id).toBeDefined();
      expect(isSkillPending(d!), b.id).toBe(false);
      expect(b.requiresSkill.rank, b.id).toBeLessThanOrEqual(d!.maxRank);
    }
  });
});

describe('레벨 차 보정', () => {
  it('10레벨마다 3% · 상한 9%', () => {
    expect(craftLevelBonus(19, 10)).toBe(0);
    expect(craftLevelBonus(20, 10)).toBeCloseTo(0.03);
    expect(craftLevelBonus(40, 10)).toBeCloseTo(0.09);
    expect(craftLevelBonus(200, 10)).toBeCloseTo(0.09);
    expect(craftLevelBonus(5, 10)).toBe(0);
  });
});

describe('분해', () => {
  const bundle = CRAFT_BLUEPRINTS.find((b) => b.id === 'bp_sinker_bundle')!;
  it('굴림이 모두 낮으면 재료 전부 · 모두 높으면 없음', () => {
    const all = craftScrapReturn(bundle, () => 0);
    expect(all.reduce((a, l) => a + l.qty, 0)).toBe(bundle.materials.reduce((a, m) => a + m.qty, 0));
    expect(craftScrapReturn(bundle, () => 0.99)).toEqual([]);
  });
  it('여러 개 나오는 도면은 하나를 풀어도 기대값이 재료의 일부다', () => {
    let n = 0;
    let seed = 7;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 4000; i++) n += craftScrapReturn(bundle, rng).reduce((a, l) => a + l.qty, 0);
    const per = n / 4000;
    const units = bundle.materials.reduce((a, m) => a + m.qty, 0);
    expect(per).toBeLessThan(units / bundle.outputQty);
  });
  it('분해로 얻는 도면만 깨칠 수 있고 상한을 넘지 않는다', () => {
    expect(craftScrapLearnChance(bundle, 0)).toBeCloseTo(0.3);
    expect(craftScrapLearnChance(bundle, 999)).toBeLessThanOrEqual(0.8);
    const shopBp = CRAFT_BLUEPRINTS.find((b) => b.learn?.via === 'shop')!;
    expect(craftScrapLearnChance(shopBp, 50)).toBe(0);
  });
});
