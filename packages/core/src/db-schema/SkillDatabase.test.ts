/**
 * @file SkillDatabase.test.ts
 * @description 스킬 트리 무결성 (222차 — 사용자 지시 「이름이 겹치지 않게 · 미구현 시스템 스킬은 잠그되 선행으로 쓰지 않기」)
 */
import { describe, it, expect } from 'vitest';
import { SKILL_DATABASE, skillPendingViolations, isSkillPending } from './SkillDatabase.js';

describe('스킬 트리 무결성', () => {
  it('한국어 · 영어 이름이 서로 겹치지 않는다', () => {
    const dupKo = SKILL_DATABASE.map((s) => s.nameKo).filter((n, i, a) => a.indexOf(n) !== i);
    const dupEn = SKILL_DATABASE.map((s) => s.nameEn).filter((n, i, a) => a.indexOf(n) !== i);
    expect(dupKo).toEqual([]);
    expect(dupEn).toEqual([]);
  });

  it('잠긴 스킬(아직 없는 시스템)은 다른 열린 스킬의 선행이 아니다', () => {
    expect(skillPendingViolations()).toEqual([]);
  });

  it('열린 스킬은 전부 효과가 배선돼 있다(배울 수 있는데 아무 일도 안 하는 스킬 없음)', () => {
    const unwired = SKILL_DATABASE.filter((s) => !isSkillPending(s) && !s.wired).map((s) => s.id);
    expect(unwired).toEqual([]);
  });
});
