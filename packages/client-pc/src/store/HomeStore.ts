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
 *  - 190차: 화분·스탠드 상태를 **개체(id)별**로(상점에서 같은 가구를 여럿 살 수 있다) · 고양이(밥·정) ·
 *    관상 수조 속 물고기 · 상점에서 산 가구(`addStored`) · 벽 장식 앞자리도 길 판정에 넣는다.
 *    구세이브의 `plantWateredMs`(화분 하나)는 기본 화분 id `plant`로 옮겨 읽는다.
 */

import type { InvItem, InvCategory } from './InventoryStore.js';
import { itemKeepReason } from './ItemKeepGuard.js';
import {
  DEFAULT_LAYOUT, FURN_DEFS, DOOR_MAT, WALL_DECOR, footprint, inFloor, onDoorMat, wallDecorCols, ROOM_W, ROOM_H, FLOOR_TOP,
  type FurnInstance, type FurnKind, type FurnDir,
} from '../data/HomeFurniture.js';
import type { CatchMethod } from '@tra/core';

export type HomeStorageKind = 'wardrobe' | 'shelf';

/** 보관함 칸 수 · 받는 물건 */
export const HOME_STORAGE: Record<HomeStorageKind, { slots: number; cols: number; accepts: InvCategory[] }> = {
  wardrobe: { slots: 20, cols: 5, accepts: ['gear'] },
  shelf: { slots: 15, cols: 5, accepts: ['tackle', 'lure', 'consumable', 'etc'] },
};

/** 화분이 목말라지는 시간 — 사흘 */
export const PLANT_DRY_MS = 3 * 24 * 3600 * 1000;

/** 관상 수조 칸 수 · 넣을 수 있는 최대 몸길이(cm) */
export const TANK_SLOTS = 4;
export const TANK_MAX_CM = 45;

/** 관상 수조 속 물고기 (190차) — 쿨러 개체와 같은 실측치를 들고 있다가 꺼낼 때 그대로 돌려준다 */
export interface TankFish {
  speciesId: string;
  nameKo: string;
  lengthCm: number;
  weightG: number;
  sex: 'M' | 'F';
  iconTexture?: string;
  catchMethod?: CatchMethod;
  /**
   * 234차 — 패류독소 채취 금지 기간에 캔 조개(229차 표지). 수조를 거쳐도 **그대로 남는다**
   * (구: 수조에 넣었다 빼면 표지가 사라져 먹어도 탈이 안 나는 「세탁」이 됐다).
   */
  toxin?: boolean;
  /** 234차 — 거래로 받은 개체(233차 계보 표지) — 수조를 거쳐도 「직접 마련한 것만」 퀘스트에서 빠진다 */
  traded?: boolean;
  /** 넣은 시각 (ms) */
  addedMs: number;
}

/** 고양이 (190차) — 마지막으로 밥을 먹은 시각 · 정(0~100) · 마지막으로 쓰다듬은 시각 */
export interface HomeCatState {
  fedMs: number;
  affection: number;
  lastPetMs: number;
  /** 쓰다듬어 마음이 풀린(피로 회복) 마지막 시각 — 30분에 한 번 */
  lastCalmMs: number;
}

export interface HomeSaveState {
  placed: FurnInstance[];
  stored: FurnInstance[];
  wardrobe: (InvItem | null)[];
  shelf: (InvItem | null)[];
  /** 구세이브 호환 — 기본 화분(`plant`)의 마지막 물 준 시각 */
  plantWateredMs: number;
  /** 190차 — 화분 id → 마지막 물 준 시각 */
  watered?: Record<string, number>;
  /** 190차 — 스탠드 id → 켜짐 */
  lampOn?: Record<string, boolean>;
  /** 190차 */
  cat?: HomeCatState;
  /** 190차 — 수조 id → 물고기 */
  tanks?: Record<string, TankFish[]>;
  /** 191차 — 방에서 아주 치운 기본 가구 id (로드 때 기본 배치로 다시 채우지 않는다 — 아버지의 낚시 상자) */
  discarded?: string[];
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
  /** 화분 id → 마지막 물 준 시각 (없으면 「막 물 줌」으로 본다 — 새로 들인 화분) */
  watered: Record<string, number> = {};
  lampOn: Record<string, boolean> = {};
  cat: HomeCatState = HomeStoreManager.freshCat();
  tanks: Record<string, TankFish[]> = {};
  /** 191차 — 치운 기본 가구 (세이브) */
  discarded: string[] = [];

  private static freshCat(now = Date.now()): HomeCatState {
    // 새 게임 — 누가 아침까지는 밥을 챙겨 준 모양이다(바로 배고파하지 않게)
    return { fedMs: now, affection: 10, lastPetMs: 0, lastCalmMs: 0 };
  }

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

  /** 그 화분이 목마른가 (id 없이 부르면 방에 놓인 화분 중 하나라도) */
  plantDry(id?: string, now = Date.now()): boolean {
    if (id === undefined) return this.placed.some((f) => f.kind === 'plant' && this.plantDry(f.id, now));
    const at = this.watered[id];
    return at !== undefined && now - at > PLANT_DRY_MS;
  }

  waterPlant(id = 'plant', now = Date.now()): void {
    this.watered[id] = now;
  }

  /** 구세이브 호환 접근자 — 기본 화분의 물 준 시각 */
  get plantWateredMs(): number { return this.watered.plant ?? Date.now(); }

  isLampOn(id: string): boolean { return !!this.lampOn[id]; }

  toggleLamp(id: string): boolean {
    this.lampOn[id] = !this.lampOn[id];
    return this.lampOn[id];
  }

  /** 상점에서 산 가구 → 「넣어 둔 가구」 (190차). 새 개체 id를 돌려준다 */
  addStored(kind: FurnKind): string {
    const used = new Set(this.placed.concat(this.stored).map((f) => f.id));
    let n = 1;
    while (used.has(`${kind}_b${n}`)) n++;
    const id = `${kind}_b${n}`;
    this.stored.push({ id, kind, tx: 0, ty: 0, dir: 'down' });
    if (kind === 'plant') this.watered[id] = Date.now();
    return id;
  }

  /** 넣어 둔 가구를 종류별로 묶는다 (트레이 한 칸 = 한 종류 · 개수) */
  storedGroups(): { kind: FurnKind; items: FurnInstance[] }[] {
    const out: { kind: FurnKind; items: FurnInstance[] }[] = [];
    for (const f of this.stored) {
      const g = out.find((x) => x.kind === f.kind);
      if (g) g.items.push(f); else out.push({ kind: f.kind, items: [f] });
    }
    return out;
  }

  // ── 관상 수조 ───────────────────────────────────────

  tank(id: string): TankFish[] {
    return (this.tanks[id] ??= []);
  }

  /** 수조에 넣을 수 없는 까닭 (넣을 수 있으면 null) */
  tankReason(id: string, lengthCm: number): string | null {
    if (this.tank(id).length >= TANK_SLOTS) return '수조가 가득 찼다';
    if (lengthCm > TANK_MAX_CM) return '수조에 넣기에는 너무 크다';
    return null;
  }

  addToTank(id: string, fish: Omit<TankFish, 'addedMs'>, now = Date.now()): boolean {
    if (this.tankReason(id, fish.lengthCm)) return false;
    this.tank(id).push({ ...fish, addedMs: now });
    return true;
  }

  takeFromTank(id: string, idx: number): TankFish | null {
    const t = this.tank(id);
    const f = t[idx] ?? null;
    if (f) t.splice(idx, 1);
    return f;
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
    // 190차 — 벽 장식(책·달력·어탁) 앞 바닥 한 칸 이상은 닿아야 한다
    for (const d of WALL_DECOR) {
      if (!wallDecorCols(d).some((c) => seen.has(`${c},${FLOOR_TOP}`))) return '벽 장식 앞으로 갈 길이 막힌다';
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

  /**
   * 191차 — 방에서 아주 치운다(넣어 둔 가구로도 가지 않는다). 아버지의 낚시 상자 = 열면 내 가방이 된다.
   * 치운 id는 `discarded`로 저장해 로드가 기본 배치로 되살리지 않는다(구세이브는 집 씬이 입장 때 플래그로 정리).
   */
  discard(id: string): void {
    this.placed = this.placed.filter((p) => p.id !== id);
    this.stored = this.stored.filter((p) => p.id !== id);
    if (!this.discarded.includes(id)) this.discarded.push(id);
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
    // 234차 — 귀속(이야기가 준 장비)도 집에는 둘 수 있다(구: 가방 말고 둘 곳이 없어 가방이 차고, 보상을 못 받는 일이 잦았다 — 감사 중간-1).
    //  집 보관함은 내 것이라 판매 · 양도 금지와 부딪치지 않는다.
    if (item.equipped) return false;
    if (itemKeepReason(item.id)) return false;   // 234차 — 맡은 물건 · 프롤로그 물건은 집에 넣어 두지 않는다(그 일이 막힌다)
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
      watered: { ...this.watered },
      lampOn: { ...this.lampOn },
      cat: { ...this.cat },
      tanks: Object.fromEntries(Object.entries(this.tanks).map(([k, v]) => [k, v.map((f) => ({ ...f }))])),
      discarded: [...this.discarded],
    };
  }

  /**
   * 로드 — 구세이브(필드 없음)는 기본 배치. 알 수 없는 종류는 버리고, 기본 배치에 새로 생긴 가구
   * (세이브에 없는 id)는 기본 자리가 비어 있으면 놓고 아니면 넣어 둔 목록에 넣는다(유실 금지).
   */
  deserialize(s?: Partial<HomeSaveState>): void {
    this.resetAll();
    if (!s) return;
    if (Array.isArray(s.discarded)) this.discarded = s.discarded.filter((x): x is string => typeof x === 'string');
    const valid = (f: FurnInstance | null | undefined): f is FurnInstance =>
      !!f && typeof f.id === 'string' && !!FURN_DEFS[f.kind as FurnKind] && DIRS.includes(f.dir);
    if (Array.isArray(s.placed)) {
      this.placed = s.placed.filter(valid).map((f) => ({ ...f }));
      this.stored = (s.stored ?? []).filter(valid).filter((f) => !this.placed.some((p) => p.id === f.id)).map((f) => ({ ...f }));
      for (const d of DEFAULT_LAYOUT) {
        if (this.placed.some((p) => p.id === d.id) || this.stored.some((p) => p.id === d.id)) continue;
        if (this.discarded.includes(d.id)) continue;
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
    // 화분 — 190차 개체별 맵이 우선, 없으면 구세이브 단일 값을 기본 화분에
    if (s.watered && typeof s.watered === 'object') {
      for (const [k, v] of Object.entries(s.watered)) if (typeof v === 'number' && Number.isFinite(v)) this.watered[k] = v;
    } else if (typeof s.plantWateredMs === 'number' && Number.isFinite(s.plantWateredMs)) {
      this.watered.plant = s.plantWateredMs;
    }
    if (s.lampOn && typeof s.lampOn === 'object') for (const [k, v] of Object.entries(s.lampOn)) this.lampOn[k] = !!v;
    if (s.cat && typeof s.cat === 'object') {
      const c = s.cat;
      this.cat = {
        fedMs: Number.isFinite(c.fedMs) ? c.fedMs : this.cat.fedMs,
        affection: Math.max(0, Math.min(100, Number.isFinite(c.affection) ? c.affection : this.cat.affection)),
        lastPetMs: Number.isFinite(c.lastPetMs) ? c.lastPetMs : 0,
        lastCalmMs: Number.isFinite(c.lastCalmMs) ? c.lastCalmMs : 0,
      };
    }
    if (s.tanks && typeof s.tanks === 'object') {
      for (const [k, v] of Object.entries(s.tanks)) {
        if (Array.isArray(v)) this.tanks[k] = v.filter((f) => f && typeof f.speciesId === 'string').slice(0, TANK_SLOTS).map((f) => ({ ...f }));
      }
    }
  }

  resetAll(): void {
    this.placed = DEFAULT_LAYOUT.map((f) => ({ ...f }));
    this.stored = [];
    this.boxes = {
      wardrobe: new Array(HOME_STORAGE.wardrobe.slots).fill(null),
      shelf: new Array(HOME_STORAGE.shelf.slots).fill(null),
    };
    this.watered = { plant: Date.now() };
    this.lampOn = {};
    this.cat = HomeStoreManager.freshCat();
    this.tanks = {};
    this.discarded = [];
  }
}

/** 방 크기 — 씬 판정용 재노출 */
export const HOME_ROOM = { w: ROOM_W, h: ROOM_H, floorTop: FLOOR_TOP };

export const HomeStore = new HomeStoreManager();

// dev 하네스용 (verify-render 스킬 — 하네스의 import는 게임과 다른 모듈 인스턴스를 잡을 수 있다)
if (import.meta.env?.DEV) {
  (globalThis as unknown as { __HOME?: unknown }).__HOME = HomeStore;
}
