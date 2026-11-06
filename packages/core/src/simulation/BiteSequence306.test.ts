/**
 * @file BiteSequence306.test.ts
 * @description 306차 — 챔질 없이 어신이 끝나면 「끝났다」는 그 틱에 **한 번만** 온다.
 *   옛 엔진은 끝난 뒤 다음 입질까지 매 틱 `ended: true`를 돌려줘, 1인칭 장면이 매 프레임 미끼를 하나씩 먹혀
 *   곽크릴 20마리가 몇 초 만에 전부 사라졌다(사용자 리포트 「크릴 새우가 싹 다 사라짐」).
 */
import { describe, it, expect } from 'vitest';
import { BiteSequenceEngine } from './BiteSequenceEngine.js';

/** 고정 난수(같은 패턴 · 같은 간격) */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

describe('306 — 어신 종료는 한 번만', () => {
  it('끝난 틱에 한 번 · 그 뒤 600틱 동안 다시 오지 않는다(여러 씨앗)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const b = new BiteSequenceEngine();
      b.start({ speciesId: 'black_rockfish', biteProbPerSec: 0.02, rng: seeded(seed) });
      let ends = 0, ticks = 0;
      // 낮은 입질 확률 = 공백이 길다(최대 180초 × 단계 수) — 넉넉히 돌린다
      while (b.active && ticks < 400_000) { if (b.update(1 / 30).ended) ends++; ticks++; }
      expect(b.active, `seed ${seed}`).toBe(false);
      for (let i = 0; i < 600; i++) if (b.update(1 / 30).ended) ends++;
      expect(ends, `seed ${seed}`).toBe(1);
    }
  });

  it('챔질로 끝낸 시퀀스 · 강제 종료(reset)는 「끝났다」를 알리지 않는다(미끼 소모는 챔질 쪽이 맡는다)', () => {
    const b = new BiteSequenceEngine();
    b.start({ speciesId: 'flatfish', biteProbPerSec: 0.2, rng: seeded(7) });   // 광어는 늘 3단계 하나
    let stage: number | null = null;
    for (let i = 0; i < 2000 && stage === null; i++) stage = b.update(1 / 30).activeStage;
    expect(stage).toBe(3);
    expect(b.attemptHook().success).toBe(true);
    for (let i = 0; i < 300; i++) expect(b.update(1 / 30).ended).toBe(false);

    b.start({ speciesId: 'black_rockfish', biteProbPerSec: 0.1, rng: seeded(3) });
    b.update(1 / 30);
    b.reset();
    for (let i = 0; i < 300; i++) expect(b.update(1 / 30).ended).toBe(false);
  });

  it('다음 입질이 끝나면 다시 한 번 온다', () => {
    const b = new BiteSequenceEngine();
    let ends = 0;
    for (const seed of [11, 12]) {
      b.start({ speciesId: 'black_rockfish', biteProbPerSec: 0.25, rng: seeded(seed) });
      for (let i = 0; i < 400_000 && b.active; i++) if (b.update(1 / 30).ended) ends++;
      for (let i = 0; i < 60; i++) if (b.update(1 / 30).ended) ends++;
    }
    expect(ends).toBe(2);
  });
});
