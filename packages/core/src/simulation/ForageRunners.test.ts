/**
 * @file ForageRunners.test.ts
 * @description 235차 — 달아나는 채집 생물 공용 움직임: 두 사람이 같은 앵커에서 같은 칸을 보는지
 */
import { describe, expect, it } from 'vitest';
import {
  advanceRunner, decodeRunnerFlee, encodeRunnerFlee, runnerEpoch, runnerFleeKey, runnerStepIntervalMs, runnerHash,
  RUNNER_STEP_MIN_MS, RUNNER_STEP_SPAN_MS, type RunnerAnchor, type RunnerCursor,
} from './ForageRunners.js';

/** 7×7 격자 — 가운데(3,3)만 막힌 정적 칸 */
const blocked = new Set(['3,3']);
const neighbors = (tx: number, ty: number): { tx: number; ty: number }[] => {
  const out: { tx: number; ty: number }[] = [];
  for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) {
    if ((x === tx && y === ty) || x < 0 || y < 0 || x > 6 || y > 6 || blocked.has(`${x},${y}`)) continue;
    out.push({ tx: x, ty: y });
  }
  return out;
};

describe('ForageRunners — 공용 어슬렁', () => {
  const anchor: RunnerAnchor = { tx: 1, ty: 1, atMs: 1_000_000, epoch: runnerEpoch(1234, 'spot_7', 0) };

  it('같은 앵커 · 같은 시각이면 두 사람이 같은 칸을 본다', () => {
    for (const t of [0, 1999, 2000, 5_000, 60_000, 1_799_000]) {
      const a = advanceRunner(anchor, null, anchor.atMs + t, neighbors);
      const b = advanceRunner({ ...anchor }, null, anchor.atMs + t, neighbors);
      expect([a.tx, a.ty, a.k]).toEqual([b.tx, b.ty, b.k]);
    }
  });

  it('프레임마다 이어서 센 결과 = 한 번에 센 결과', () => {
    let cur: RunnerCursor | null = null;
    for (let t = 0; t <= 600_000; t += 333) cur = advanceRunner(anchor, cur, anchor.atMs + t, neighbors);
    const once = advanceRunner(anchor, null, anchor.atMs + 600_000, neighbors);
    expect([cur!.tx, cur!.ty, cur!.k, cur!.tAcc]).toEqual([once.tx, once.ty, once.k, once.tAcc]);
  });

  it('막힌 칸은 밟지 않고 한 걸음은 이웃 한 칸이다', () => {
    let cur: RunnerCursor | null = null;
    let px = anchor.tx, py = anchor.ty;
    for (let t = 0; t <= 300_000; t += 500) {
      cur = advanceRunner(anchor, cur, anchor.atMs + t, neighbors);
      expect(blocked.has(`${cur.tx},${cur.ty}`)).toBe(false);
      expect(Math.max(Math.abs(cur.tx - px), Math.abs(cur.ty - py))).toBeLessThanOrEqual(1);
      px = cur.tx; py = cur.ty;
    }
    expect(cur!.k).toBeGreaterThan(40);   // 5분이면 대략 80걸음(평균 3.75초)
  });

  it('걸음 간격은 224차 범위(2~5.5초) 안이다', () => {
    const h = runnerHash(anchor.epoch);
    for (let k = 0; k < 200; k++) {
      const iv = runnerStepIntervalMs(h, k);
      expect(iv).toBeGreaterThanOrEqual(RUNNER_STEP_MIN_MS);
      expect(iv).toBeLessThan(RUNNER_STEP_MIN_MS + RUNNER_STEP_SPAN_MS);
    }
  });

  it('갈래(도망 번호)가 다르면 다른 걸음을 걷는다', () => {
    const a = advanceRunner(anchor, null, anchor.atMs + 120_000, neighbors);
    const b = advanceRunner({ ...anchor, epoch: runnerEpoch(1234, 'spot_7', 1) }, null, anchor.atMs + 120_000, neighbors);
    expect(`${a.tx},${a.ty},${a.k}`).not.toEqual(`${b.tx},${b.ty},${b.k}`);
  });

  it('도망 기록은 그대로 왕복한다', () => {
    const f = { tx: 12, ty: 40, atMs: 1_791_400_000_123 };
    expect(decodeRunnerFlee(encodeRunnerFlee(f))).toEqual(f);
    expect(decodeRunnerFlee('x,1,2')).toBeNull();
    expect(decodeRunnerFlee(undefined)).toBeNull();
    expect(runnerFleeKey('sokcho_v2', 'c_88', 1)).toBe('r:sokcho_v2|c_88|1');
  });
});
