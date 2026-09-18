/**
 * @file CookingStore.ts
 * @description 불요리 스토어 (154차) — 설치된 화구(현장·집)와 그 위의 조리 세션을 소유한다.
 *
 * - 상태의 원본은 `GameState.deployedStoves`(세이브 영속). 이 스토어는 그 배열을 조작하는 단일 창구다.
 * - **시뮬은 wall-clock** — `syncAll(now)`가 `lastTickMs`부터 지금까지를 `TUNING.cook.timeScale`로 환산해
 *   `stepCook`을 잘게(≤5 시뮬 초) 돌린다. 패널이 닫혀 있어도, 다른 맵에 가 있어도 익는다(통발 규칙).
 *   오프라인(게임 종료)은 `GameState.applySaveData`가 갭을 밀어 정지시킨다.
 * - 판정·값은 전부 core(`CookingSim`) — 여기는 인벤토리 소비/지급과 XP·스토리 이벤트 배선만.
 *
 * ⚠ 캐니스터는 끼우는 순간 소모된다 — 화구를 회수해도 남은 연료는 돌아오지 않는다(설치 확인창에 명시).
 */

import {
  TUNING, getHeatSource, getCookware, getFuel, getFireRecipe, getCookIngredient, ingredientOfItem,
  createCookSession, canAddIngredient, addIngredient as coreAddIngredient, setHeat as coreSetHeat, flip as coreFlip,
  stepCook, finishCook, dishStarsAt, dishValueKrw, dishVitalsMult, dishItemName, checkComposition,
  type DeployedStove, type HeatLevel, type DishData, type CookEnv, type FireRecipeDef, type CookwareDef,
} from '@tra/core';
import { GameState } from './GameState.js';
import { InventoryStore, type InvItem, type InvItemTemplate } from './InventoryStore.js';
import { DiscoveryStore } from './DiscoveryStore.js';

export const HOME_STOVE_ID = 'home_stove';
/** 요리 아이템 신선도 배율 — dishStarsAt(condMult) */
const COND_MULT: Record<string, number> = { live: 1, fresh: 1, chilled: 1, normal: 0.7, frozen: 0.9, thawed: 0.75, bad: 0.25, spoiled: 0 };

export interface CookActionResult { ok: boolean; message: string }

class CookingStoreClass {
  /** 현장 풍속 공급자 — RegionFieldScene이 세운다(집은 0) */
  windProvider: (mapId: string) => number = () => 0;

  // ═══════════════════════════════════════════════
  // 화구 목록
  // ═══════════════════════════════════════════════

  all(): DeployedStove[] { return GameState.deployedStoves; }
  byId(id: string): DeployedStove | undefined { return GameState.deployedStoves.find((s) => s.instanceId === id); }
  onMap(mapId: string): DeployedStove[] { return GameState.deployedStoves.filter((s) => s.mapId === mapId); }

  /** 집 가스레인지 — 항상 존재(없으면 만든다). 연료 무한·수도 무한 */
  ensureHomeStove(): DeployedStove {
    let st = this.byId(HOME_STOVE_ID);
    if (!st) {
      st = {
        instanceId: HOME_STOVE_ID, heatSourceId: 'home_range', mapId: 'home', tileX: 2, tileY: 2,
        fuelRemainMin: -1, cookwareId: null, cookwareItemId: null, stoveItemId: null,
        placedAtMs: Date.now(), lastTickMs: Date.now(), session: null,
      };
      GameState.deployedStoves.push(st);
    }
    return st;
  }

  isHome(st: DeployedStove): boolean { return st.instanceId === HOME_STOVE_ID; }

  // ═══════════════════════════════════════════════
  // 설치 · 회수 · 연료 · 용기
  // ═══════════════════════════════════════════════

  /** 현장 설치 — 스토브 1 + 캐니스터 1 소모, 용기는 선택(있으면 장착) */
  place(stoveItem: InvItem, fuelItem: InvItem, cookwareItem: InvItem | null, mapId: string, tileX: number, tileY: number): DeployedStove | null {
    const src = getHeatSource(stoveItem.stoveHeatId ?? '');
    const fuel = getFuel(fuelItem.fuelId ?? '');
    if (!src || !fuel || fuel.heatSourceId !== src.id) return null;
    if (!InventoryStore.removeQty(stoveItem.id, 1)) return null;
    if (!InventoryStore.removeQty(fuelItem.id, 1)) { InventoryStore.recoverPlaceable(stoveItem.id); return null; }
    const now = Date.now();
    const st: DeployedStove = {
      instanceId: `stove_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      heatSourceId: src.id, mapId, tileX, tileY, fuelRemainMin: fuel.minutesPerUnit,
      cookwareId: null, cookwareItemId: null, stoveItemId: stoveItem.id, placedAtMs: now, lastTickMs: now, session: null,
    };
    GameState.deployedStoves.push(st);
    if (cookwareItem) this.attachCookware(st, cookwareItem);
    GameState.markDirty();
    return st;
  }

  /** 회수 가능 사유 — 조리 중·완성 얹힘이면 거부 */
  recoverBlockReason(st: DeployedStove): string | null {
    if (this.isHome(st)) return '집 가스레인지는 회수할 수 없습니다';
    if (st.session && st.session.contents.length > 0) return '먼저 요리를 내리세요';
    return null;
  }

  /** 회수 — 스토브·용기 반환(연료는 소실) */
  recover(st: DeployedStove): CookActionResult {
    const why = this.recoverBlockReason(st);
    if (why) return { ok: false, message: why };
    const idx = GameState.deployedStoves.indexOf(st);
    if (idx < 0) return { ok: false, message: '없는 화구입니다' };
    const back: string[] = [];
    if (st.stoveItemId && InventoryStore.recoverPlaceable(st.stoveItemId)) back.push('스토브');
    if (st.cookwareItemId && InventoryStore.recoverPlaceable(st.cookwareItemId)) back.push('용기');
    GameState.deployedStoves.splice(idx, 1);
    GameState.markDirty();
    return { ok: true, message: back.length ? `${back.join('·')} 회수` : '회수했습니다' };
  }

  attachCookware(st: DeployedStove, item: InvItem): CookActionResult {
    const cw = getCookware(item.cookwareId ?? '');
    if (!cw) return { ok: false, message: '용기가 아닙니다' };
    if (st.session && st.session.contents.length > 0) return { ok: false, message: '조리 중에는 용기를 바꿀 수 없습니다' };
    if (st.cookwareItemId) this.detachCookware(st);
    if (!InventoryStore.removeQty(item.id, 1)) return { ok: false, message: '용기가 없습니다' };
    st.cookwareId = cw.id; st.cookwareItemId = item.id; st.session = null;
    GameState.markDirty();
    return { ok: true, message: `${cw.nameKo} 장착` };
  }

  detachCookware(st: DeployedStove): CookActionResult {
    if (!st.cookwareItemId) return { ok: false, message: '장착된 용기가 없습니다' };
    if (st.session && st.session.contents.length > 0) return { ok: false, message: '먼저 요리를 내리세요' };
    if (!InventoryStore.recoverPlaceable(st.cookwareItemId)) return { ok: false, message: '인벤토리 칸이 부족합니다' };
    st.cookwareId = null; st.cookwareItemId = null; st.session = null;
    GameState.markDirty();
    return { ok: true, message: '용기를 내렸습니다' };
  }

  addFuel(st: DeployedStove, canItem: InvItem): CookActionResult {
    const fuel = getFuel(canItem.fuelId ?? '');
    if (!fuel || fuel.heatSourceId !== st.heatSourceId) return { ok: false, message: '이 화구에 맞는 연료가 아닙니다' };
    if (this.isHome(st)) return { ok: false, message: '집 가스레인지는 연료가 필요 없습니다' };
    if (st.fuelRemainMin > fuel.minutesPerUnit * 0.5) return { ok: false, message: '아직 연료가 남아 있습니다' };
    if (!InventoryStore.removeQty(canItem.id, 1)) return { ok: false, message: '캐니스터가 없습니다' };
    st.fuelRemainMin = Math.max(0, st.fuelRemainMin) + fuel.minutesPerUnit;
    GameState.markDirty();
    return { ok: true, message: `연료 ${Math.round(st.fuelRemainMin)}분` };
  }

  fuelOk(st: DeployedStove): boolean { return st.fuelRemainMin < 0 || st.fuelRemainMin > 0; }

  // ═══════════════════════════════════════════════
  // 세션 (레시피 선택 · 재료 · 불 · 뒤집기 · 내리기)
  // ═══════════════════════════════════════════════

  startRecipe(st: DeployedStove, recipeId: string): CookActionResult {
    const r = getFireRecipe(recipeId);
    const cw = st.cookwareId ? getCookware(st.cookwareId) : undefined;
    if (!r) return { ok: false, message: '없는 요리입니다' };
    if (!cw) return { ok: false, message: '용기를 먼저 올리세요' };
    if (!r.cookware.includes(cw.kind)) return { ok: false, message: `${r.nameKo}은(는) ${cw.nameKo}(으)로 만들 수 없습니다` };
    if (st.session && st.session.contents.length > 0) return { ok: false, message: '먼저 지금 요리를 내리거나 버리세요' };
    st.session = createCookSession(r.id, cw.id);
    st.lastTickMs = Date.now();
    GameState.markDirty();
    return { ok: true, message: `${r.nameKo} — 재료를 넣고 불을 켜세요` };
  }

  /** 집 수도 — 물은 아이템 없이 붓는다 */
  addWaterFromTap(st: DeployedStove, cups: number): CookActionResult {
    if (!this.isHome(st)) return { ok: false, message: '현장에서는 생수가 필요합니다' };
    return this.addIngredientRaw(st, 'water', cups, 1, undefined);
  }

  /** 인벤 아이템을 재료로 넣는다 — units = 넣을 단위 수(g 재료는 아이템 전체) */
  addIngredientItem(st: DeployedStove, item: InvItem, units: number): CookActionResult {
    const m = ingredientOfItem(item);
    if (!m) return { ok: false, message: '조리 재료가 아닙니다' };
    const def = getCookIngredient(m.ing);
    if (!def) return { ok: false, message: '조리 재료가 아닙니다' };
    if (item.condition === 'bad' || item.condition === 'spoiled') return { ok: false, message: `${item.name} — 상해서 넣을 수 없습니다` };
    if (item.condition === 'frozen') return { ok: false, message: `${item.name} — 해동한 뒤 쓰세요` };
    const fresh01 = item.condition ? ({ live: 1, fresh: 0.92, chilled: 0.9, normal: 0.65, thawed: 0.55 } as Record<string, number>)[item.condition] ?? 0.9 : 0.95;
    if (def.unit === 'g') {
      const r = this.addIngredientRaw(st, m.ing, m.units, fresh01, item.id, m.weightG);
      if (r.ok) InventoryStore.removeItem(item.id, false);
      return r;
    }
    const perQty = item.cookUnitsPerQty ?? 1;
    const needQty = Math.max(1, Math.ceil(units / perQty - 1e-6));
    if (item.qty < needQty) return { ok: false, message: `${item.name}이(가) 부족합니다 (${needQty}개 필요)` };
    const r = this.addIngredientRaw(st, m.ing, units, fresh01, item.id);
    if (r.ok) InventoryStore.removeQty(item.id, needQty);
    return r;
  }

  private addIngredientRaw(st: DeployedStove, ing: string, units: number, fresh01: number, srcItemId?: string, weightG?: number): CookActionResult {
    const s = st.session; const r = s ? getFireRecipe(s.recipeId) : undefined; const cw = st.cookwareId ? getCookware(st.cookwareId) : undefined;
    if (!s || !r || !cw) return { ok: false, message: '먼저 요리를 고르세요' };
    this.syncOne(st, Date.now());
    const chk = canAddIngredient(s, r, cw, ing, units);
    if (!chk.ok) return { ok: false, message: chk.reasonKo ?? '넣을 수 없습니다' };
    coreAddIngredient(s, ing, units, fresh01, srcItemId, weightG);
    GameState.markDirty();
    const def = getCookIngredient(ing);
    return { ok: true, message: `${def?.nameKo ?? ing} 투입` };
  }

  setHeat(st: DeployedStove, level: HeatLevel): CookActionResult {
    if (!st.session) return { ok: false, message: '먼저 요리를 고르세요' };
    if (level > 0 && !this.fuelOk(st)) return { ok: false, message: '연료가 없습니다 — 캐니스터를 끼우세요' };
    this.syncOne(st, Date.now());
    coreSetHeat(st.session, level);
    GameState.markDirty();
    return { ok: true, message: '' };
  }

  flip(st: DeployedStove): CookActionResult {
    if (!st.session) return { ok: false, message: '' };
    this.syncOne(st, Date.now());
    coreFlip(st.session);
    return { ok: true, message: '' };
  }

  /** 내리기 — 필수 재료가 다 들어 있어야 요리명을 쓸 수 있다 (탄 것은 언제나 내릴 수 있다) */
  takeOffBlockReason(st: DeployedStove): string | null {
    const s = st.session; const r = s ? getFireRecipe(s.recipeId) : undefined; const cw = st.cookwareId ? getCookware(st.cookwareId) : undefined;
    if (!s || !r || !cw) return '요리가 없습니다';
    if (s.contents.length === 0) return '아직 아무것도 넣지 않았습니다';
    if (s.status === 'burnt') return null;
    const cc = checkComposition(s, r, cw);
    if (cc.missing.length > 0) return `${r.nameKo}에는 ${cc.missing.join(' · ')}이(가) 꼭 들어갑니다`;
    if (s.status === 'cooking' || s.status === 'idle') {
      const mains = s.contents.filter((c) => { const h = r.required.find((q) => (Array.isArray(q.ing) ? q.ing.includes(c.ing) : q.ing === c.ing) && (q.role === 'main' || q.role === 'grain')); return !!h; });
      if (mains.some((c) => c.doneness < 0.75)) return '주재료가 아직 덜 익었습니다';
    }
    return null;
  }

  /** 완성 — 요리 아이템 지급 + XP + 스토리 이벤트. 인벤 칸이 없으면 냄비에 그대로 둔다 */
  takeOff(st: DeployedStove): CookActionResult & { item?: InvItem } {
    const why = this.takeOffBlockReason(st);
    if (why) return { ok: false, message: why };
    const s = st.session!; const r = getFireRecipe(s.recipeId)!; const cw = getCookware(st.cookwareId!)!;
    this.syncOne(st, Date.now());
    const rank = GameState.skillRanks['life_cook'] ?? 0;
    const dish = finishCook(s, r, cw, { nowMs: Date.now(), skillRank: rank, stoveKind: this.isHome(st) ? 'home' : 'field' });
    const tpl = this.dishTemplate(dish, r);
    if (!InventoryStore.addItem(tpl, 1)) return { ok: false, message: '인벤토리 칸이 없습니다 — 한 칸 비우고 내리세요' };
    const item = InventoryStore.find(tpl.id)!;
    st.session = null;
    // XP — 총점 비례(탄 것은 0.3배). 반드시 addActivityXp 경유(progression.md §6 규칙 0 — 숙련도·스토리 이벤트 동반)
    const stars = dishStarsAt(dish, r, Date.now());
    const mult = dish.burnt ? 0.3 : Math.max(0.3, stars.total / TUNING.cook.xpTotalRef);
    GameState.addActivityXp('cook', mult);
    GameState.applyVitalsAction('cook');
    DiscoveryStore.record('item', tpl.id.replace(/_\d+$/, ''), 'inventory');
    GameState.markDirty();
    return { ok: true, message: `${item.name} 완성`, item };
  }

  /** 버리기 — 내용물을 버리고 용기를 비운다 (탄 것 정리) */
  discard(st: DeployedStove): CookActionResult {
    if (!st.session) return { ok: false, message: '' };
    st.session = null;
    GameState.markDirty();
    return { ok: true, message: '내용물을 버렸습니다' };
  }

  /** 요리 아이템 템플릿 — 이름·아이콘·회복치(별점 반영)·판매 기준가 */
  private dishTemplate(dish: DishData, r: FireRecipeDef): InvItemTemplate {
    const now = Date.now();
    const stars = dishStarsAt(dish, r, now);
    const mult = dishVitalsMult(dish, stars);
    const v = r.vitals;
    const seq = InventoryStore.nextCatchSeq();
    return {
      id: `inv_dish_${r.id}_${seq}`,
      name: dishItemName(r, dish, stars),
      icon: '', iconTexture: `px:it_dish_${r.family}`,
      category: 'food', subCategory: '요리', basePrice: dishValueKrw(dish, r, stars),
      condition: 'fresh', conditionSinceMs: now, equippable: false,
      dish,
      hungerRestore: Math.round(v.hungerRestore * mult), hydrationRestore: Math.round(v.hydrationRestore * mult),
      hpRestore: Math.round(v.hpRestore * mult), fatigueRestore: Math.round(v.fatigueRestore * mult),
      ...(v.drainBuffMult && v.drainBuffMin && !dish.burnt && stars.stars >= 3 ? { drainBuffMult: v.drainBuffMult, drainBuffMin: v.drainBuffMin } : {}),
    };
  }

  // ═══════════════════════════════════════════════
  // 시뮬 동기 (wall-clock)
  // ═══════════════════════════════════════════════

  /** 모든 화구를 지금까지 진행 — 씬 update가 1초마다 부른다. 세션이 없는 화구는 시각만 민다 */
  syncAll(nowMs = Date.now()): void {
    for (const st of GameState.deployedStoves) this.syncOne(st, nowMs);
  }

  syncOne(st: DeployedStove, nowMs: number): void {
    const gapMs = nowMs - st.lastTickMs;
    if (gapMs <= 0) return;
    st.lastTickMs = nowMs;
    const s = st.session;
    if (!s || s.contents.length === 0 && s.heat === 0) return;
    const r = getFireRecipe(s.recipeId); const cw = st.cookwareId ? getCookware(st.cookwareId) : undefined; const src = getHeatSource(st.heatSourceId);
    if (!r || !cw || !src) return;
    let simSec = (gapMs / 1000) * TUNING.cook.timeScale;
    // 오래 비운 뒤(1시간 초과 실경과)는 시뮬 상한 — 어차피 탔거나 식었다
    simSec = Math.min(simSec, 6 * 3600);
    const env: CookEnv = { windMps: this.isHome(st) ? 0 : this.windProvider(st.mapId), ambientC: 20, fuelOk: this.fuelOk(st) };
    let changed = false;
    while (simSec > 0) {
      const dt = Math.min(5, simSec);
      simSec -= dt;
      const res = stepCook(s, r, cw, src, dt, env);
      if (res.fuelUsedMin > 0 && st.fuelRemainMin >= 0) {
        st.fuelRemainMin = Math.max(0, st.fuelRemainMin - res.fuelUsedMin);
        if (st.fuelRemainMin <= 0) { env.fuelOk = false; if (s.heat > 0) { s.events.push('연료가 떨어졌다'); if (s.events.length > 12) s.events.shift(); } }
      }
      changed = true;
    }
    if (changed) GameState.markDirty();
  }

  // ═══════════════════════════════════════════════
  // 조회 헬퍼 (UI)
  // ═══════════════════════════════════════════════

  recipeOf(st: DeployedStove): FireRecipeDef | undefined { return st.session ? getFireRecipe(st.session.recipeId) : undefined; }
  cookwareOf(st: DeployedStove): CookwareDef | undefined { return st.cookwareId ? getCookware(st.cookwareId) : undefined; }

  /** 요리 아이템의 현재 별점 (신선도 반영) */
  starsOfItem(item: Pick<InvItem, 'dish' | 'condition'>, nowMs = Date.now()) {
    if (!item.dish) return null;
    const r = getFireRecipe(item.dish.recipeId);
    if (!r) return null;
    return dishStarsAt(item.dish, r, nowMs, COND_MULT[item.condition ?? 'fresh'] ?? 1);
  }

  /** 탑다운 배지 문구 — 상태 한 줄 */
  statusLabel(st: DeployedStove): { text: string; color: string } {
    const s = st.session;
    if (!st.cookwareId) return { text: '용기 없음', color: '#8a97a8' };
    if (!s) return { text: this.cookwareOf(st)?.nameKo ?? '', color: '#c8d8e8' };
    const r = getFireRecipe(s.recipeId);
    const name = r?.nameKo ?? '';
    if (s.status === 'burnt') return { text: `${name} — 탔다!`, color: '#ff5a4a' };
    if (s.status === 'done') {
      const idleMin = s.doneAtSec !== null ? (s.elapsedSec - s.doneAtSec) / 60 / TUNING.cook.timeScale : 0;
      return { text: `${name} 완성${s.heat > 0 ? ' · 불 켜짐' : ''}`, color: idleMin > TUNING.cook.idleWarnMin ? '#ff9a4a' : '#8affb0' };
    }
    if (s.contents.length === 0) return { text: `${name} — 재료 대기`, color: '#c8d8e8' };
    if (s.heat === 0) return { text: `${name} — 불 꺼짐`, color: '#ffe0a8' };
    const mains = s.contents.filter((c) => { const d = getCookIngredient(c.ing); return d && (d.kind === 'main' || d.kind === 'grain'); });
    const prog = mains.length ? Math.min(1, mains.reduce((a, c) => a + Math.min(1, c.doneness), 0) / mains.length) : 0;
    return { text: `${name} ${s.boiling ? '끓는 중' : '데우는 중'} ${Math.round(prog * 100)}%`, color: '#ffe0a8' };
  }
}

export const CookingStore = new CookingStoreClass();

if (import.meta.env.DEV) {
  // 실렌더 검증 하네스용 — `import('/src/…')`는 게임 인스턴스와 별개 모듈이라(59차 `__INV` 규칙) 실싱글턴을 노출한다
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__COOK = CookingStore;
}
