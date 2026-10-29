/**
 * @file CureActions.ts
 * @description 285차 — 갈무리 걸기 · 거두기 · 걷어 내기(가방). 계산은 core `rules/HomeCure.ts`, 대기열 데이터는 `CureQueue.ts`.
 *
 * - 걸 거리는 텃밭에 놓은 설비(건조 걸대 · 장독)에서만 고른다. 설비 하나에 거는 수는 `CURE_TUNING.slots`.
 * - 작물 수확물은 등급을 가리지 않는다 — 보통 → 상 → 특 순서로 덜어 간다(좋은 것은 팔게 남긴다).
 * - 소금은 굵은소금도 쓴다(손질용 굵은소금과 같은 봉지 — `CookItems`의 정합).
 * - 방금 건 것(한 시간 안)은 도로 걷어 가방으로 돌려받는다. 그 뒤에 걷으면 버린다(되살려 신선도를 되돌리는 길을 막는다).
 */

import {
  CURE_RECIPES, CURE_TUNING, CURE_STATION_FACILITY, cureRecipe, cureReadyAt, produceItemId,
  type CureInputDef, type CureRecipeDef, type CureStation, type CropGrade,
} from '@tra/core';
import { GameState } from './GameState.js';
import { InventoryStore, type InvItemTemplate } from './InventoryStore.js';
import { FarmStore } from './FarmStore.js';
import { CureQueue, type CureBatch } from './CureQueue.js';
import { cropItemTemplate } from '../data/CropItems.js';
import { cureItemTemplate } from '../data/CureItems.js';

/** 덜어 가는 등급 순서(낮은 것부터) */
const GRADE_ORDER: CropGrade[] = ['normal', 'good', 'special'];
/** 같은 재료로 쳐 주는 다른 아이템 */
const ALT_IDS: Record<string, string[]> = { cook_salt: ['inv_coarse_salt'] };
/** 도로 걷어 돌려받을 수 있는 때(실제 시간) */
export const CURE_UNDO_MS = 60 * 60_000;

export interface CureActionResult { ok: boolean; message: string; batch?: CureBatch }

/** 받침이 있으면 앞 조사, 없으면 뒤 조사 */
function josa(word: string, withB: string, withoutB: string): string {
  const c = word.charCodeAt(word.length - 1);
  const b = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return `${word}${b ? withB : withoutB}`;
}

/** 이 재료로 쓸 수 있는 가방 아이템 id(덜어 갈 순서) */
function sourceIds(input: CureInputDef): string[] {
  if (input.itemId.startsWith('crop_')) return GRADE_ORDER.map((g) => produceItemId(input.itemId, g));
  return [input.itemId, ...(ALT_IDS[input.itemId] ?? [])];
}

/** 가방에 든 재료 수(등급 · 다른 봉지 합) */
export function cureInputStock(input: CureInputDef): number {
  let n = 0;
  for (const id of sourceIds(input)) n += InventoryStore.find(id)?.qty ?? 0;
  return n;
}

/** 이 텃밭에 그 설비가 놓였는가 */
export function hasCureStation(plotId: string, station: CureStation): boolean {
  if (!FarmStore.has(plotId)) return false;
  return FarmStore.plot(plotId).facilities.includes(CURE_STATION_FACILITY[station]);
}

/** 이 텃밭에서 할 수 있는 갈무리(놓인 설비 기준) */
export function cureRecipesFor(plotId: string): CureRecipeDef[] {
  return CURE_RECIPES.filter((r) => hasCureStation(plotId, r.station));
}

/** 이 설비에 남은 자리 */
export function cureSlotsLeft(plotId: string, station: CureStation): number {
  return CURE_TUNING.slots[station] - CureQueue.at(plotId, station).length;
}

/** 걸 수 없는 까닭(되면 null) */
export function cureBlockKo(plotId: string, r: CureRecipeDef): string | null {
  if (!hasCureStation(plotId, r.station)) return r.station === 'rack' ? '건조 걸대를 놓아야 건다' : '장독을 놓아야 담근다';
  if (cureSlotsLeft(plotId, r.station) <= 0) return r.station === 'rack' ? '걸대가 다 찼다 — 마른 것을 먼저 거둔다' : '장독이 다 찼다 — 삭은 것을 먼저 꺼낸다';
  for (const inp of r.inputs) {
    const have = cureInputStock(inp);
    if (have < inp.qty) return `${josa(inp.nameKo.replace(/\s*\(.*\)$/, ''), '이', '가')} 모자란다 (${have}/${inp.qty})`;
  }
  return null;
}

/** 건다 · 담근다 — 재료를 덜어 간다 */
export function startCure(plotId: string, recipeId: string, nowMs = Date.now()): CureActionResult {
  const r = cureRecipe(recipeId);
  if (!r) return { ok: false, message: '할 수 없는 일이다' };
  const why = cureBlockKo(plotId, r);
  if (why) return { ok: false, message: why };
  const taken: { itemId: string; qty: number }[] = [];
  for (const inp of r.inputs) {
    let left = inp.qty;
    for (const id of sourceIds(inp)) {
      if (left <= 0) break;
      const it = InventoryStore.find(id);
      if (!it) continue;
      const take = Math.min(it.qty, left);
      if (take <= 0) continue;
      InventoryStore.removeQty(id, take);
      taken.push({ itemId: id, qty: take });
      left -= take;
    }
  }
  const batch = CureQueue.add({ recipeId: r.id, plotId, station: r.station, inputs: taken, startMs: nowMs, readyAtMs: cureReadyAt(nowMs, r) });
  GameState.markDirty();
  const days = Math.round(r.hours / 24);
  return { ok: true, message: `${r.nameKo} — ${days}일 뒤에 거둔다`, batch };
}

/** 다 된 것 → 가방 모양 */
export function cureOutputTemplate(itemId: string): InvItemTemplate | null {
  return cureItemTemplate(itemId);
}

/** 다 된 것을 거둔다 — 가방에 자리가 없으면 그대로 둔다 */
export function collectCure(id: string, nowMs = Date.now()): CureActionResult {
  const b = CureQueue.pending.find((x) => x.id === id);
  const r = b ? cureRecipe(b.recipeId) : undefined;
  if (!b || !r) return { ok: false, message: '걸어 둔 것이 없다' };
  if (b.readyAtMs > nowMs) return { ok: false, message: '아직 덜 됐다' };
  const tpl = cureOutputTemplate(r.output.itemId);
  if (!tpl) return { ok: false, message: '거둘 수 없다' };
  if (Object.keys(InventoryStore.slotShortfall([{ tpl, qty: r.output.qty }])).length) return { ok: false, message: '가방에 자리가 없다 — 한 칸 비우고 거둔다' };
  CureQueue.take(b.id);
  InventoryStore.addItem(tpl, r.output.qty);
  GameState.markDirty();
  return { ok: true, message: `거뒀다 — ${tpl.name} ${r.output.qty}개` };
}

/** 걷어 낼 때 돌려받는가(방금 건 것) */
export function cureUndoable(b: CureBatch, nowMs = Date.now()): boolean {
  return nowMs - b.startMs < CURE_UNDO_MS && b.readyAtMs > nowMs;
}

/** 덜 된 것을 걷어 낸다 — 한 시간 안이면 재료를 돌려받고, 그 뒤면 버린다 */
export function cancelCure(id: string, nowMs = Date.now()): CureActionResult {
  const b = CureQueue.pending.find((x) => x.id === id);
  if (!b) return { ok: false, message: '걸어 둔 것이 없다' };
  if (b.readyAtMs <= nowMs) return { ok: false, message: '이미 다 됐다 — 거둔다' };
  if (cureUndoable(b, nowMs)) {
    const parts = b.inputs.map((x) => ({ tpl: cropItemTemplate(x.itemId) ?? InventoryStore.seedTemplate(x.itemId), qty: x.qty }))
      .filter((p): p is { tpl: InvItemTemplate; qty: number } => !!p.tpl);
    if (Object.keys(InventoryStore.slotShortfall(parts)).length) return { ok: false, message: '가방에 자리가 없다 — 한 칸 비우고 걷는다' };
    CureQueue.take(b.id);
    for (const p of parts) InventoryStore.addItem(p.tpl, p.qty, { silent: true });
    GameState.markDirty();
    return { ok: true, message: '도로 걷어 가방에 넣었다' };
  }
  CureQueue.take(b.id);
  GameState.markDirty();
  return { ok: true, message: '걷어 버렸다' };
}

if (import.meta.env.DEV) {
  (globalThis as unknown as { __CUREACT: unknown }).__CUREACT = { startCure, collectCure, cancelCure, cureBlockKo, cureInputStock, cureRecipesFor };
}
