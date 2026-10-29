/**
 * @file CureQueue.ts
 * @description 285차 — 갈무리(건조 걸대에 걸어 말리기 · 장독에 담가 삭히기) 대기열. 한 거리씩 들고 세이브한다.
 *
 * 텃밭 구획(`plotId`)마다 놓인 설비(걸대 · 장독)에 건다. 설비 하나에 걸 수 있는 거리는 core `CURE_TUNING.slots`.
 * 다 되면(실제 시간 — core `rules/HomeCure.ts`) 그 텃밭에서 거둔다. 알림은 방앗간과 같은 길(`ui/MillNotifier.ts`).
 * 걸고 · 거두기(가방)는 `store/CureActions.ts` — GameState가 이 파일을 세이브로 import하므로 여기서 GameState를 부르지 않는다.
 */

import type { CureStation } from '@tra/core';

/** 건 한 거리 */
export interface CureBatch {
  id: string;
  recipeId: string;
  /** 건 텃밭 구획(설치물 instanceId) */
  plotId: string;
  station: CureStation;
  /** 넣은 것(무르면 돌려준다 — 등급별 id) */
  inputs: { itemId: string; qty: number }[];
  startMs: number;
  readyAtMs: number;
  /** 「다 됐다」 알림을 보냈는가 */
  notified?: boolean;
}

export interface CureQueueSave { batches: CureBatch[]; counter: number }

class CureQueueImpl {
  private batches: CureBatch[] = [];
  private counter = 0;

  add(b: Omit<CureBatch, 'id'>): CureBatch {
    const full = { ...b, id: `cure_${++this.counter}` };
    this.batches.push(full);
    return full;
  }

  /** 걸어 둔 것 전부(건 순서) */
  get pending(): readonly CureBatch[] { return this.batches; }

  /** 이 텃밭 · 이 설비에 걸린 것 */
  at(plotId: string, station?: CureStation): CureBatch[] {
    return this.batches.filter((b) => b.plotId === plotId && (!station || b.station === station));
  }

  /** 다 된 것 */
  ready(nowMs: number): CureBatch[] { return this.batches.filter((b) => b.readyAtMs <= nowMs); }

  /** 다 됐는데 아직 알리지 않은 것 */
  unnotified(nowMs: number): CureBatch[] { return this.batches.filter((b) => b.readyAtMs <= nowMs && !b.notified); }

  markNotified(id: string): void { const b = this.batches.find((x) => x.id === id); if (b) b.notified = true; }

  take(id: string): CureBatch | null {
    const b = this.batches.find((x) => x.id === id);
    if (!b) return null;
    this.batches = this.batches.filter((x) => x !== b);
    return b;
  }

  serialize(): CureQueueSave {
    return { batches: this.batches.map((b) => ({ ...b, inputs: [...b.inputs] })), counter: this.counter };
  }

  /** 구세이브(필드 없음) = 빈 대기열 */
  deserialize(s: CureQueueSave | undefined): void {
    this.batches = (s?.batches ?? []).map((b) => ({ ...b, inputs: [...(b.inputs ?? [])] }));
    this.counter = s?.counter ?? this.batches.length;
  }

  resetAll(): void { this.batches = []; this.counter = 0; }
}

export const CureQueue = new CureQueueImpl();
if (import.meta.env.DEV) (globalThis as unknown as { __CURE: CureQueueImpl }).__CURE = CureQueue;
