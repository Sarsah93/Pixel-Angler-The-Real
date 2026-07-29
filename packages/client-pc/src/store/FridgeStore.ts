/**
 * @file FridgeStore.ts
 * @description 집(홈타운 실내) 냉장고 보관 — 냉동고(위, 4×2=8칸) + 냉장고(아래, 4×4=16칸)
 *
 * HOMETOWN_HOME_SPEC 후속:
 *  - 냉동고 8칸 / 냉장고 16칸. 보관 시 상태를 냉동('frozen')/냉장('chilled')으로 설정.
 *  - 보관 중에는 신선도 시계가 정지(변질 진행 없음) — 꺼내는 시점부터 재시작.
 *  - 세이브(GameState SaveData.fridge)에 영속.
 */

import type { InvItem } from './InventoryStore.js';

export type FridgeSection = 'freezer' | 'fridge';

/** 냉동고 8칸(가로4×세로2) / 냉장고 16칸(가로4×세로4) */
export const FREEZER_SLOTS = 8;
export const FRIDGE_SLOTS = 16;
export const FRIDGE_COLS = 4;

export interface FridgeSaveState {
  freezer: (InvItem | null)[];
  fridge: (InvItem | null)[];
}

class FridgeStoreManager {
  freezer: (InvItem | null)[] = new Array(FREEZER_SLOTS).fill(null);
  fridge: (InvItem | null)[] = new Array(FRIDGE_SLOTS).fill(null);

  private slots(section: FridgeSection): (InvItem | null)[] {
    return section === 'freezer' ? this.freezer : this.fridge;
  }

  capacity(section: FridgeSection): number {
    return section === 'freezer' ? FREEZER_SLOTS : FRIDGE_SLOTS;
  }

  get(section: FridgeSection, slot: number): InvItem | null {
    return this.slots(section)[slot] ?? null;
  }

  /** 첫 빈 소켓 인덱스 (없으면 -1) */
  firstEmpty(section: FridgeSection): number {
    return this.slots(section).findIndex((s) => s === null);
  }

  /** 채워진 소켓 수 */
  filledCount(section: FridgeSection): number {
    return this.slots(section).filter(Boolean).length;
  }

  /** 보관 — 지정 소켓(또는 첫 빈칸)에 넣고 상태를 냉동/냉장으로 설정, 시계 정지 */
  place(section: FridgeSection, item: InvItem, slot?: number): boolean {
    const arr = this.slots(section);
    const idx = slot ?? this.firstEmpty(section);
    if (idx < 0 || idx >= arr.length || arr[idx]) return false;
    const stored: InvItem = { ...item };
    if (stored.condition) {
      stored.condition = section === 'freezer' ? 'frozen' : 'chilled';
      stored.conditionSinceMs = Date.now();   // 보관 시점 기록 (꺼낼 때까지 정지 취급)
    }
    arr[idx] = stored;
    return true;
  }

  /** 꺼내기 — 소켓 비우고 아이템 반환 (신선도 시계는 꺼낸 시점부터 재시작) */
  take(section: FridgeSection, slot: number): InvItem | null {
    const arr = this.slots(section);
    const it = arr[slot] ?? null;
    if (it) {
      arr[slot] = null;
      if (it.condition) it.conditionSinceMs = Date.now();
    }
    return it;
  }

  count(): number {
    return this.freezer.filter(Boolean).length + this.fridge.filter(Boolean).length;
  }

  // ── 세이브/로드 ──────────────────────────────────────
  serialize(): FridgeSaveState {
    return {
      freezer: this.freezer.map((s) => (s ? { ...s } : null)),
      fridge: this.fridge.map((s) => (s ? { ...s } : null)),
    };
  }

  deserialize(s?: FridgeSaveState): void {
    this.freezer = new Array(FREEZER_SLOTS).fill(null);
    this.fridge = new Array(FRIDGE_SLOTS).fill(null);
    if (!s) return;
    (s.freezer ?? []).forEach((it, i) => { if (i < FREEZER_SLOTS) this.freezer[i] = it ? { ...it } : null; });
    (s.fridge ?? []).forEach((it, i) => { if (i < FRIDGE_SLOTS) this.fridge[i] = it ? { ...it } : null; });
  }

  resetAll(): void {
    this.deserialize(undefined);
  }
}

export const FridgeStore = new FridgeStoreManager();
