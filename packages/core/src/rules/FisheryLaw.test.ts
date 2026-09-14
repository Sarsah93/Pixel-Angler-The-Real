/**
 * @file FisheryLaw.test.ts
 * @description STORY_SPEC_v3 §3-5 수용 기준 T1~T7 (vitest). `pnpm --filter @tra/core test`.
 * 빌드에서는 제외(tsconfig.build exclude). 동일 케이스를 `scripts/storyIntegrity.ts`도 실행한다.
 */
import { describe, expect, it } from 'vitest';
import { canGather, canKeep, canSell, landingLegalFlags, provenanceOf, rodProvenance } from './FisheryLaw.js';

describe('FisheryLaw §3-5', () => {
  it('T1 낚싯대 감성돔 45cm + 신고어업 → 불가 LAW_SELL_ROD', () => {
    const v = canSell(rodProvenance('gangwon_sokcho', 45), ['reported_fishery']);
    expect(v.allowed).toBe(false);
    expect(v.ruleId).toBe('LAW_SELL_ROD');
  });
  it('T2 통발 문어 + 신고어업 → 허용', () => {
    expect(canSell(provenanceOf('trap', 'gangwon_sokcho'), ['reported_fishery']).allowed).toBe(true);
  });
  it('T3 통발 문어 + 면허 없음 → 불가, 대안에 자가소비', () => {
    const v = canSell(provenanceOf('trap', 'gangwon_sokcho'), []);
    expect(v.allowed).toBe(false);
    expect(v.alternatives.some((a) => a.includes('자가소비'))).toBe(true);
  });
  it('T4 금지체장 미만 → canKeep 불가', () => {
    const flags = landingLegalFlags({ lengthCm: 20, legalMinCm: 25, month: 6 });
    expect(canKeep(rodProvenance('busan', 20, 0, flags)).allowed).toBe(false);
  });
  it('T5 상점 구매 → 되팔기 허용', () => {
    expect(canSell(provenanceOf('bought', 'busan'), []).allowed).toBe(true);
  });
  it('T6 마을어업권 전복 채집 → 불가 LAW_VILLAGE_FISHERY', () => {
    const v = canGather('abalone', true, []);
    expect(v.allowed).toBe(false);
    expect(v.ruleId).toBe('LAW_VILLAGE_FISHERY');
  });
  it('T7 모든 거부 Verdict 는 대안 ≥ 1', () => {
    const cases = [
      canSell(rodProvenance('a', 30), []),
      canSell(provenanceOf('trap', 'a'), []),
      canSell(provenanceOf('gift', 'a'), []),
      canSell(provenanceOf('commercial', 'a'), []),
      canKeep(rodProvenance('a', 10, 0, ['closed_season'])),
      canGather('sea_cucumber', true, []),
    ];
    for (const v of cases) { expect(v.allowed).toBe(false); expect(v.alternatives.length).toBeGreaterThanOrEqual(1); }
  });
});
