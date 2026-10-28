/**
 * @file MillQueue.ts
 * @description 284차 — 방앗간에 맡겨 둔 일(기름 짜기 · 들깨 갈기 · 참깨 볶기). 맡긴 한 건씩 들고 세이브한다.
 *
 * 맡길 때 깨(g)와 공임을 내고, 실제 시간으로 정해진 만큼 지나면(기름 60분 · 갈기 · 볶기 20분 — core `MILL_TUNING`)
 * 다시 방앗간 압착기에서 찾는다. 다 되기 전에는 무르면 깨와 공임을 그대로 돌려받는다.
 * 계산은 core `rules/OilMill.ts`, 맡기기 · 찾기 · 무르기(가방 · 돈)는 `store/MillActions.ts`가 한다
 * (GameState가 이 파일을 세이브로 import하므로 여기서 GameState를 import하면 순환이 된다 — 213차 `ConsignQueue`와 같은 짜임).
 */

import type { MillServiceId } from '@tra/core';

/** 맡긴 한 건 */
export interface MillOrder {
  id: string;
  service: MillServiceId;
  /** 맡긴 낱알(등급별 id · g) — 무르면 이것을 그대로 돌려준다 */
  seeds: { itemId: string; qty: number }[];
  /** 찾을 것(기름병 · 깻묵 g · 1큰술) */
  outputs: { itemId: string; qty: number }[];
  /** 낸 공임 + 병값(원) */
  feeWon: number;
  /** 짠 기름(ml — 기름일 때) */
  oilMl: number;
  leftAtMs: number;
  readyAtMs: number;
  /** 맡긴 방앗간 이름(창 · 일지에 쓴다) */
  shopName: string;
}

export interface MillQueueSave { orders: MillOrder[]; counter: number }

class MillQueueImpl {
  private orders: MillOrder[] = [];
  private counter = 0;

  add(o: Omit<MillOrder, 'id'>): MillOrder {
    const full = { ...o, id: `mill_${++this.counter}` };
    this.orders.push(full);
    return full;
  }

  /** 맡겨 둔 일 전부(읽기 전용 · 맡긴 순서) */
  get pending(): readonly MillOrder[] { return this.orders; }

  /** 다 된 일 */
  ready(nowMs: number): MillOrder[] { return this.orders.filter((o) => o.readyAtMs <= nowMs); }

  /** 한 건을 꺼낸다(찾기 · 무르기) — 없으면 null */
  take(id: string): MillOrder | null {
    const o = this.orders.find((x) => x.id === id);
    if (!o) return null;
    this.orders = this.orders.filter((x) => x !== o);
    return o;
  }

  /** 꺼냈는데 줄 수 없었으면(가방이 가득) 다시 넣는다 */
  restore(o: MillOrder): void { this.orders.push(o); this.orders.sort((a, b) => a.leftAtMs - b.leftAtMs); }

  serialize(): MillQueueSave { return { orders: this.orders.map((o) => ({ ...o, seeds: [...o.seeds], outputs: [...o.outputs] })), counter: this.counter }; }

  /** 구세이브(필드 없음) = 빈 대기열 */
  deserialize(s: MillQueueSave | undefined): void {
    this.orders = (s?.orders ?? []).map((o) => ({ ...o, seeds: [...(o.seeds ?? [])], outputs: [...(o.outputs ?? [])] }));
    this.counter = s?.counter ?? this.orders.length;
  }

  resetAll(): void { this.orders = []; this.counter = 0; }
}

export const MillQueue = new MillQueueImpl();
if (import.meta.env.DEV) (globalThis as unknown as { __MILL: MillQueueImpl }).__MILL = MillQueue;
