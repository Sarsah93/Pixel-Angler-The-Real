/**
 * @file ProcessQueue.ts
 * @description 295차 — 지역 가공대 대기열(맡긴 것 · 다 되는 때). 방앗간 `MillQueue` · 갈무리 `CureQueue`와 같은 짜임.
 *
 * 세이브 키 `processQueue`(`GameState`). 알림은 방앗간과 같은 길(`ui/MillNotifier.ts` — 채널 `[가공장]` · 손목시계 알람).
 * 맡기고 · 찾기(가방 · 돈)는 `store/ProcessActions.ts` — GameState가 이 파일을 세이브로 import하므로 여기서 GameState를 부르지 않는다.
 */

/** 맡긴 한 건 */
export interface ProcessOrder {
  id: string;
  recipeId: string;
  /** 몇 묶음 */
  batches: number;
  /** 넣은 것(기록용 — 가공은 무르지 못한다) */
  inputs: { itemId: string; qty: number }[];
  output: { itemId: string; qty: number };
  feeWon: number;
  /** 맡긴 가공장이 있는 지역(WorldMap 지역 id — 가공품의 `originRegion`) */
  regionId: string;
  leftAtMs: number;
  readyAtMs: number;
  /** 맡긴 가공장 상호(느낌표 · 찾는 자리) */
  shopName: string;
  /** 「다 됐다」 알림을 보냈는가 */
  notified?: boolean;
}

export interface ProcessQueueSave { orders: ProcessOrder[]; counter: number }

class ProcessQueueImpl {
  private orders: ProcessOrder[] = [];
  private counter = 0;

  add(o: Omit<ProcessOrder, 'id'>): ProcessOrder {
    const full = { ...o, id: `proc_${++this.counter}` };
    this.orders.push(full);
    return full;
  }

  /** 맡긴 것 전부(맡긴 순서) */
  get pending(): readonly ProcessOrder[] { return this.orders; }

  /** 다 된 것 */
  ready(nowMs: number): ProcessOrder[] { return this.orders.filter((o) => o.readyAtMs <= nowMs); }

  /** 다 됐는데 아직 알리지 않은 것 */
  unnotified(nowMs: number): ProcessOrder[] { return this.orders.filter((o) => o.readyAtMs <= nowMs && !o.notified); }

  markNotified(id: string): void { const o = this.orders.find((x) => x.id === id); if (o) o.notified = true; }

  take(id: string): ProcessOrder | null {
    const o = this.orders.find((x) => x.id === id);
    if (!o) return null;
    this.orders = this.orders.filter((x) => x !== o);
    return o;
  }

  serialize(): ProcessQueueSave {
    return { orders: this.orders.map((o) => ({ ...o, inputs: [...o.inputs], output: { ...o.output } })), counter: this.counter };
  }

  /** 구세이브(필드 없음) = 빈 대기열 */
  deserialize(s: ProcessQueueSave | undefined): void {
    this.orders = (s?.orders ?? []).map((o) => ({ ...o, inputs: [...(o.inputs ?? [])], output: { ...o.output } }));
    this.counter = s?.counter ?? this.orders.length;
  }

  resetAll(): void { this.orders = []; this.counter = 0; }
}

export const ProcessQueue = new ProcessQueueImpl();
if (import.meta.env.DEV) (globalThis as unknown as { __PROC: ProcessQueueImpl }).__PROC = ProcessQueue;
