/**
 * @file ConsignQueue.ts
 * @description 위판장에 맡겨 둔 물건 (213차 — R12 「퀘스트를 특정 시각에 묶지 않는다」).
 *
 * 위판은 실제 위판장처럼 새벽에만 선다(선어 01~03시 · 활어 03~07시 · 일요일 쉼). 그 시간에 들어오지 못하는 사람도
 * 위판 목표(이야기 12편)를 해낼 수 있게, 문 닫은 위판장에 물건을 **맡겨 두면** 다음 회차에 올라가고
 * 값은 끝나는 대로 들어온다(꺼 둔 사이에 열린 회차는 다음에 들어올 때 정산).
 *
 * 이 파일은 맡긴 묶음만 들고 세이브한다 — 정산(돈 · 이야기 · 장부 · 가방)은 `ConsignSettle.ts`가 한다
 * (GameState가 이 파일을 세이브로 import하므로 여기서 GameState를 import하면 순환이 된다).
 */

import type { AuctionCategory, ConsignInput } from '@tra/core';
import type { InvItem } from './InventoryStore.js';

/** 맡긴 한 묶음 — 같은 카테고리 · 같은 회차 */
export interface ConsignBatch {
  id: string;
  regionId: string;
  category: AuctionCategory;
  inputs: ConsignInput[];
  /** 맡긴 물건 그대로(유찰되면 이것을 돌려준다) */
  items: InvItem[];
  leftAtMs: number;
  /** 올라갈 회차가 열리는 시각 */
  dueAtMs: number;
}

export interface ConsignQueueSave { batches: ConsignBatch[]; counter: number }

class ConsignQueueImpl {
  private batches: ConsignBatch[] = [];
  private counter = 0;

  add(b: Omit<ConsignBatch, 'id'>): ConsignBatch {
    const full = { ...b, id: `cq_${++this.counter}` };
    this.batches.push(full);
    return full;
  }

  /** 아직 정산 전인 묶음(읽기 전용) */
  get pending(): readonly ConsignBatch[] { return this.batches; }

  /** 회차가 열린(dueAt ≤ now) 묶음을 꺼낸다 — 꺼낸 묶음은 큐에서 빠진다 */
  takeDue(nowMs: number): ConsignBatch[] {
    const due = this.batches.filter((b) => b.dueAtMs <= nowMs);
    if (due.length) this.batches = this.batches.filter((b) => b.dueAtMs > nowMs);
    return due;
  }

  /** 214차 — 회차 전에 찾아온다: 그 묶음을 큐에서 꺼낸다(없으면 null) */
  take(id: string): ConsignBatch | null {
    const b = this.batches.find((x) => x.id === id);
    if (!b) return null;
    this.batches = this.batches.filter((x) => x !== b);
    return b;
  }

  /** 정산을 못 했으면 다시 넣는다(가방이 가득 차 유찰품을 못 돌려줄 때 등) */
  restore(b: ConsignBatch): void { this.batches.push(b); }

  serialize(): ConsignQueueSave { return { batches: this.batches, counter: this.counter }; }

  /** 구세이브(필드 없음) = 빈 큐 */
  deserialize(s: ConsignQueueSave | undefined): void {
    this.batches = (s?.batches ?? []).map((b) => ({ ...b, inputs: [...b.inputs], items: [...b.items] }));
    this.counter = s?.counter ?? this.batches.length;
  }

  resetAll(): void { this.batches = []; this.counter = 0; }
}

export const ConsignQueue = new ConsignQueueImpl();
if (import.meta.env.DEV) (globalThis as unknown as { __CQ: ConsignQueueImpl }).__CQ = ConsignQueue;
