/**
 * @file HomeStore.ts
 * @description 집 실내 상태 — 가구 배치(놓인 것 · 넣어 둔 것) · 옷장/수납 선반 보관함 · 화분 물 준 시각 (189차)
 *
 *  - 가구 배치: `placed`(방에 놓인 가구) + `stored`(넣어 둔 가구). 배치 모드가 둘 사이를 옮기고 돌린다.
 *    판정(`checkPlace`)은 칸 단위 — 방 바닥 안 · 현관 매트 밖 · 겹침 금지 · 내가 선 자리 금지 ·
 *    **문까지 가는 길과 쓸 수 있는 가구 앞자리가 막히지 않을 것**(BFS). 막히는 배치는 놓이지 않는다.
 *  - 옷장(장비만) · 수납 선반(낚시용품·소모품·기타) — 냉장고(FridgeStore)와 같은 칸 보관함.
 *    보관 중에는 아이템 상태를 그대로 둔다(신선도가 있는 음식은 받지 않는다).
 *  - 화분: 마지막으로 물을 준 시각. 사흘이 넘으면 잎이 처진다(그림만 — 죽지는 않는다).
 *  - 세이브: `GameState` SaveData.home. 구세이브(필드 없음)는 기본 배치 · 빈 보관함 · 「지금 막 물 줌」.
 */

import type { InvItem, InvCategory } from './InventoryStore.js';
import {
  DEFAULT_LAYOUT, FURN_DEFS, DOOR_MAT, footprint, inFloor, onDoorMat, ROOM_W, ROOM_H, FLOOR_TOP,
  type FurnInstance, type FurnKind, type FurnDir,
} from '../data/HomeFurniture.js';

export type HomeStorageKind = 'wardrobe' | 'shelf';

/** 보관함 칸 수 · 받는 물건 */
export const HOME_STORAGE: Record<HomeStorageKind, { slots: number; cols: number; accepts: InvCategory[] }> = {
  wardrobe: { slots: 20, cols: 5, accepts: ['gear'] },
  shelf: { slots: 15, cols: 5, accepts: ['tackle', 'lure', 'consumable', 'etc'] },
};

/** 화분이 목말라지는 시간 — 사흘 */
export const PLANT_DRY_MS = 3 * 24 * 3600 * 1000;

export interface HomeSaveState {
  placed: FurnInstance[];
  stored: FurnInstance[];
  wardrobe: (InvItem | null)[];
  shelf: (InvItem | null)[];
  plantWateredMs: number;
}

export interface PlaceCheck {
  ok: boolean;
  /** 놓을 수 없는 까닭 (한국어 원문 — i18n 키) */
  reason?: string;
  cells: { c: number; r: number; ok: boolean }[];
}

const DIRS: FurnDir[] = ['down', 'left', 'up', 'right'];

function cellsOf(f: FurnInstance): { c: number; r: number }[] {
  const { w, h } = footprint(f.kind, f.dir);
  const out: { c: number; r: number }[] = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) out.push({ c: f.tx + c, r: f.ty + r });
  return out;
}

class HomeStoreManager {
  placed: FurnInstance[] = DEFAULT_LAYOUT.map((f) => ({ ...f }));
  stored: FurnInstance[] = [];
  private boxes: Record<HomeStorageKind, (InvItem | null)[]> = {
    wardrobe: new Array(HOME_STORAGE.wardrobe.slots).fill(null),
    shelf: new Array(HOME_STORAGE.shelf.slots).fill(null),
  };
  plantWateredMs = Date.now();

  // ── 가구 ─────────────────────────────────────────────

  find(id: string): FurnInstance | undefined {
    return this.placed.find((f) => f.id === id);
  }

  /** 칸 수(방향 반영) */
  size(f: FurnInstance): { w: number; h: number } {
    return footprint(f.kind, f.dir);
  }

  cells(f: FurnInstance): { c: number; r: number }[] {
    return cellsOf(f);
  }

  plantDry(now = Date.now()): boolean {
    return now - this.plantWateredMs > PLANT_DRY_MS;
  }

  waterPlant(now = Date.now()): void {
    this.plantWateredMs = now;
  }

  /**
   * 이 자리에 놓을 수 있는가.
   * `others` = 판정 상대(들고 있는 가구는 빠진 배치). `player` = 발밑(칸 단위 실수 좌표).
   */
  checkPlace(cand: FurnInstance, others: FurnInstance[], player?: { x: number; y: number }): PlaceCheck {
    const def = FURN_DEFS[cand.kind];
    const mine = cellsOf(cand);
    const taken = new Set<string>();
    for (const o of others) {
      if (!!FURN_DEFS[o.kind].floor !== !!def.floor) continue;   // 러그는 가구 밑에 깔린다
      for (const k of cellsOf(o)) taken.add(`${k.c},${k.r}`);
    }
    let reason: string | undefined;
    const cells = mine.map(({ c, r }) => {
      let ok = true;
      if (!inFloor(c, r)) { ok = false; reason ??= '방 밖에는 둘 수 없다'; }
      else if (onDoorMat(c, r)) { ok = false; reason ??= '현관 매트 위에는 둘 수 없다'; }
      else if (taken.has(`${c},${r}`)) { ok = false; reason ??= '다른 가구와 겹친다'; }
      return { c, r, ok };
    });
    if (reason) return { ok: false, reason, cells };
    if (!def.collides) return { ok: true, cells };
    // 내가 선 자리 (씬의 충돌 상자와 같은 여유 — 좌우 8px · 위 8px · 아래 12px)
    if (player) {
      const { w, h } = footprint(cand.kind, cand.dir);
      const pad = 8 / 48, padB = 12 / 48;
      if (player.x > cand.tx - pad && player.x < cand.tx + w + pad && player.y > cand.ty + pad && player.y < cand.ty + h + padB) {
        return { ok: false, reason: '내가 서 있는 자리다', cells: cells.map((k) => ({ ...k, ok: false })) };
      }
    }
    const path = this.pathReason(others.concat(cand), player);
    if (path) return { ok: false, reason: path, cells: cells.map((k) => ({ ...k, ok: false })) };
    return { ok: true, cells };
  }

  /**
   * 길 판정 — 현관 매트에서 4방향으로 퍼져 나가며
   *  ① 내가 선 칸 ② 쓸 수 있는 가구(기능 있는 가구)의 앞자리 하나 이상 에 닿는지 본다. 막히면 까닭을 돌려준다.
   */
  private pathReason(layout: FurnInstance[], player?: { x: number; y: number }): string | null {
    const blocked = new Set<string>();
    for (const f of layout) if (FURN_DEFS[f.kind].collides) for (const k of cellsOf(f)) blocked.add(`${k.c},${k.r}`);
    const seen = new Set<string>();
    const q: [number, number][] = [];
    for (let c = DOOR_MAT.tx; c < DOOR_MAT.tx + DOOR_MAT.fw; c++) { q.push([c, DOOR_MAT.ty]); seen.add(`${c},${DOOR_MAT.ty}`); }
    while (q.length) {
      const [c, r] = q.shift()!;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nc = c + dc, nr = r + dr, k = `${nc},${nr}`;
        if (seen.has(k) || !inFloor(nc, nr) || blocked.has(k)) continue;
        seen.add(k);
        q.push([nc, nr]);
      }
    }
    if (player) {
      const pc = Math.floor(player.x), pr = Math.floor(player.y);
      if (inFloor(pc, pr) && !seen.has(`${pc},${pr}`) && !blocked.has(`${pc},${pr}`)) return '나갈 길이 막힌다';
    }
    for (const f of layout) {
      if (!FURN_DEFS[f.kind].action) continue;
      const own = new Set(cellsOf(f).map((k) => `${k.c},${k.r}`));
      const reach = cellsOf(f).some(({ c, r }) =>
        ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([dc, dr]) => {
          const k = `${c + dc},${r + dr}`;
          return !own.has(k) && seen.has(k);
        }));
      if (!reach) return '가구 앞으로 갈 길이 막힌다';
    }
    return null;
  }

  /** 놓기(들고 있던 가구를 새 자리로) — 판정은 호출측이 먼저 한다 */
  place(f: FurnInstance): void {
    this.placed = this.placed.filter((p) => p.id !== f.id).concat({ ...f });
    this.stored = this.stored.filter((s) => s.id !== f.id);
  }

  /** 넣어 두기 */
  store(id: string): boolean {
    const f = this.placed.find((p) => p.id === id) ?? this.stored.find((s) => s.id === id);
    if (!f || !FURN_DEFS[f.kind].storable) return false;
    this.placed = this.placed.filter((p) => p.id !== id);
    if (!this.stored.some((s) => s.id === id)) this.stored.push({ ...f });
    return true;
  }

  // ── 옷장 · 수납 선반 ────────────────────────────────

  slots(kind: HomeStorageKind): (InvItem | null)[] {
    return this.boxes[kind];
  }

  accepts(kind: HomeStorageKind, item: InvItem): boolean {
    if (item.equipped || item.bound) return false;
    return HOME_STORAGE[kind].accepts.includes(item.category);
  }

  firstEmpty(kind: HomeStorageKind): number {
    return this.boxes[kind].findIndex((s) => s === null);
  }

  /** 보관 — 같은 아이템(쌓이는 것)이 이미 있으면 그 칸에 합친다 */
  put(kind: HomeStorageKind, item: InvItem, qty: number): boolean {
    const arr = this.boxes[kind];
    const same = arr.findIndex((s) => s && s.id === item.id && !item.equippable);
    if (same >= 0) { arr[same]!.qty += qty; return true; }
    const idx = this.firstEmpty(kind);
    if (idx < 0) return false;
    arr[idx] = { ...item, qty };
    return true;
  }

  take(kind: HomeStorageKind, slot: number): InvItem | null {
    const arr = this.boxes[kind];
    const it = arr[slot] ?? null;
    if (it) arr[slot] = null;
    return it;
  }

  /** 한 칸에서 들어낸 것을 되돌린다 (가방이 꽉 차 꺼내지 못했을 때) */
  restore(kind: HomeStorageKind, slot: number, item: InvItem): void {
    this.boxes[kind][slot] = item;
  }

  // ── 세이브 ──────────────────────────────────────────

  serialize(): HomeSaveState {
    const copy = (a: (InvItem | null)[]): (InvItem | null)[] => a.map((s) => (s ? { ...s } : null));
    return {
      placed: this.placed.map((f) => ({ ...f })),
      stored: this.stored.map((f) => ({ ...f })),
      wardrobe: copy(this.boxes.wardrobe),
      shelf: copy(this.boxes.shelf),
      plantWateredMs: this.plantWateredMs,
    };
  }

  /**
   * 로드 — 구세이브(필드 없음)는 기본 배치. 알 수 없는 종류는 버리고, 기본 배치에 새로 생긴 가구
   * (세이브에 없는 id)는 기본 자리가 비어 있으면 놓고 아니면 넣어 둔 목록에 넣는다(유실 금지).
   */
  deserialize(s?: Partial<HomeSaveState>): void {
    this.resetAll();
    if (!s) return;
    const valid = (f: FurnInstance | null | undefined): f is FurnInstance =>
      !!f && typeof f.id === 'string' && !!FURN_DEFS[f.kind as FurnKind] && DIRS.includes(f.dir);
    if (Array.isArray(s.placed)) {
      this.placed = s.placed.filter(valid).map((f) => ({ ...f }));
      this.stored = (s.stored ?? []).filter(valid).filter((f) => !this.placed.some((p) => p.id === f.id)).map((f) => ({ ...f }));
      for (const d of DEFAULT_LAYOUT) {
        if (this.placed.some((p) => p.id === d.id) || this.stored.some((p) => p.id === d.id)) continue;
        const others = this.placed;
        if (this.checkPlace(d, others).ok) this.placed.push({ ...d });
        else this.stored.push({ ...d });
      }
      // 넣을 수 없는 가구(침대)가 넣어 둔 목록에 있으면 기본 자리로 되돌린다
      for (const f of this.stored.filter((x) => !FURN_DEFS[x.kind].storable)) {
        this.stored = this.stored.filter((x) => x !== f);
        this.placed.push({ ...(DEFAULT_LAYOUT.find((d) => d.id === f.id) ?? f) });
      }
    }
    for (const k of ['wardrobe', 'shelf'] as HomeStorageKind[]) {
      const src = s[k];
      if (!Array.isArray(src)) continue;
      src.forEach((it, i) => { if (i < HOME_STORAGE[k].slots) this.boxes[k][i] = it ? { ...it } : null; });
    }
    if (typeof s.plantWateredMs === 'number' && Number.isFinite(s.plantWateredMs)) this.plantWateredMs = s.plantWateredMs;
  }

  resetAll(): void {
    this.placed = DEFAULT_LAYOUT.map((f) => ({ ...f }));
    this.stored = [];
    this.boxes = {
      wardrobe: new Array(HOME_STORAGE.wardrobe.slots).fill(null),
      shelf: new Array(HOME_STORAGE.shelf.slots).fill(null),
    };
    this.plantWateredMs = Date.now();
  }
}

/** 방 크기 — 씬 판정용 재노출 */
export const HOME_ROOM = { w: ROOM_W, h: ROOM_H, floorTop: FLOOR_TOP };

export const HomeStore = new HomeStoreManager();

// dev 하네스용 (verify-render 스킬 — 하네스의 import는 게임과 다른 모듈 인스턴스를 잡을 수 있다)
if (import.meta.env?.DEV) {
  (globalThis as unknown as { __HOME?: unknown }).__HOME = HomeStore;
}
