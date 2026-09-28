/**
 * @file GroundItemStore.ts
 * @description 바닥에 놓인 아이템 (178차 — 「내려놓기 / 줍기」)
 *
 * 사용자 지시(178차): 퀘스트 아이템을 **내려놓아야** 진행되는 할 일이 있고, 잘못 놓았으면
 * **회수**할 수 있어야 한다. 또 금지체장·금어기·자격이 걸리지 않는 해산물(쫄장게 등)은
 * 해루질 장비 없이 그냥 **주울** 수 있어야 한다. 두 경우가 같은 그릇을 쓴다 — 「바닥의 물건」.
 *
 * ⚠ 홈타운 설치물(`MapObject` + `WorldObjectState.placed`)과 **다른 층**이다.
 *   설치물은 지형·충돌·기능을 갖는 구조물이고 홈타운 전용이며, 여기 있는 것은
 *   지형과 무관하게 어느 지역에서나 바닥에 놓이는 **아이템 한 스택**이다(충돌 없음).
 *
 * 저장은 `SaveData.groundItems` — 지역 id별 목록. 좌표는 **월드 타일**.
 */
import type { InvItem, InvItemTemplate } from './InventoryStore.js';

export interface GroundItem {
  uid: string;
  regionId: string;
  tx: number;
  ty: number;
  /** 아이템 정적 필드 (수량·소켓 제외) */
  tpl: InvItemTemplate;
  qty: number;
  /**
   * 유저가 **의도적으로 내려놓은** 물건(퀘스트 배치 등)이면 true.
   * 주워 쓰라고 바닥에 생성된 채집물과 구분해 안내 문구를 바꾼다(「회수하기」).
   */
  placed?: boolean;
  /** 놓인 시각 (wall-clock) — 신선도 재시작 기준 */
  droppedAtMs: number;
}

export interface GroundItemSaveState {
  items: GroundItem[];
}

class GroundItemStoreClass {
  private _items: GroundItem[] = [];
  private seq = 0;

  get all(): readonly GroundItem[] { return this._items; }

  /** 이 지역에 놓인 것만 */
  inRegion(regionId: string): GroundItem[] {
    return this._items.filter((g) => g.regionId === regionId);
  }

  /**
   * 캐릭터가 서 있는 범위에 걸리는 물건 (사용자 지시 — "필드 타일의 캐릭터 서있는 범위 내").
   * `radiusTiles`는 체비쇼프 거리(정사각 범위)로 센다 — 타일 격자에서 직관적이다.
   */
  at(regionId: string, tx: number, ty: number, radiusTiles = 1): GroundItem[] {
    return this._items.filter((g) => g.regionId === regionId
      && Math.abs(g.tx - tx) <= radiusTiles && Math.abs(g.ty - ty) <= radiusTiles);
  }

  /** 한 칸에 몇 개나 놓여 있는지 (과밀 방지 게이트용) */
  countAt(regionId: string, tx: number, ty: number): number {
    return this._items.filter((g) => g.regionId === regionId && g.tx === tx && g.ty === ty).length;
  }

  /** 바닥에 놓기 — 같은 칸에 같은 아이템이 있으면 수량을 합친다 */
  drop(regionId: string, tx: number, ty: number, item: InvItem | InvItemTemplate, qty: number, placed = false): GroundItem {
    const { qty: _q, slot: _s, ...tpl } = item as InvItem;
    const same = this._items.find((g) => g.regionId === regionId && g.tx === tx && g.ty === ty && g.tpl.id === tpl.id);
    if (same) {
      same.qty += qty;
      same.placed = same.placed || placed;
      return same;
    }
    const g: GroundItem = {
      uid: `gi_${Date.now().toString(36)}_${this.seq++}`,
      regionId, tx, ty, tpl: tpl as InvItemTemplate, qty, placed, droppedAtMs: Date.now(),
    };
    this._items.push(g);
    return g;
  }

  /** 집어 올리기 — 목록에서 제거하고 그 항목을 돌려준다 */
  take(uid: string): GroundItem | undefined {
    const i = this._items.findIndex((g) => g.uid === uid);
    if (i < 0) return undefined;
    return this._items.splice(i, 1)[0];
  }

  serialize(): GroundItemSaveState { return { items: this._items.map((g) => ({ ...g })) }; }

  deserialize(s: GroundItemSaveState | undefined | null): void {
    // 구세이브에는 이 필드가 없다 — 빈 목록으로 시작한다(§세이브 하위호환)
    this._items = (s?.items ?? []).map((g) => ({ ...g }));
    this.seq = this._items.length;
  }

  resetAll(): void { this._items = []; this.seq = 0; }
}

export const GroundItemStore = new GroundItemStoreClass();
