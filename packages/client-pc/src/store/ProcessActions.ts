/**
 * @file ProcessActions.ts
 * @description 295차 — 지역 가공대 맡기기 · 찾기(가방 · 돈 · 대기열). 창 `ui/ProcessPanel.ts`가 부른다.
 *
 *  - 재료는 어종(`speciesId` — 어획물 칸 · 상한 것 제외)이거나 수확물(기본 id — 등급 칸을 전부 센다).
 *  - 찾을 때 가공품에 가공장 지역을 `originRegion`으로 찍는다 — 그 지역 특산이면 꼬리표 · 택배 차익이 붙는다.
 */

import { processRecipe, processQuote, parseProduceId, type ProcessRecipeDef } from '@tra/core';
import { InventoryStore, type InvItem } from './InventoryStore.js';
import { GameState } from './GameState.js';
import { ProcessQueue, type ProcessOrder } from './ProcessQueue.js';
import { processedItemTemplate } from '../data/ProcessedItems.js';

export interface ProcessActionResult { ok: boolean; message: string; order?: ProcessOrder }

/** 재료로 쓸 수 있는 가방 칸(상한 것 · 미완성 접시 제외) */
export function processInputItems(r: ProcessRecipeDef): InvItem[] {
  const inp = r.input;
  return InventoryStore.items.filter((i) => {
    if (i.condition === 'spoiled' || i.plateWip) return false;
    if (inp.kind === 'species') return i.subCategory === '어획물' && i.speciesId === inp.speciesId;
    return i.id === inp.itemId || parseProduceId(i.id).baseId === inp.itemId;
  });
}

/** 가방에 든 재료 수량 */
export function processStock(r: ProcessRecipeDef): number {
  return processInputItems(r).reduce((n, i) => n + i.qty, 0);
}

/** 맡길 수 있는 최대 묶음 수(재료 기준) */
export function processMaxBatches(r: ProcessRecipeDef): number {
  return Math.floor(processStock(r) / r.input.qty);
}

/** 맡긴다 — 재료를 덜고 공임을 낸다 */
export function placeProcessOrder(recipeId: string, batches: number, shopName: string): ProcessActionResult {
  const r = processRecipe(recipeId);
  if (!r) return { ok: false, message: '맡길 수 없다' };
  const n = Math.max(1, Math.floor(batches));
  const q = processQuote(r, n);
  const have = processStock(r);
  if (have < q.inputQty) return { ok: false, message: `${r.input.nameKo}가 모자란다 — ${q.inputQty}개가 든다 (가방 ${have}개)` };
  if (GameState.player.inventory.coins < q.feeWon) return { ok: false, message: `공임 ${q.feeWon.toLocaleString()}원이 모자란다` };
  // 재료를 덜어 간다 — 상태가 나쁜 것부터(오래된 것부터 쓴다)
  const order: Record<string, number> = { live: 3, fresh: 2, normal: 1, bad: 0 };
  const pool = processInputItems(r).sort((a, b) => (order[a.condition ?? 'fresh'] ?? 1) - (order[b.condition ?? 'fresh'] ?? 1));
  let left = q.inputQty;
  const inputs: { itemId: string; qty: number }[] = [];
  for (const it of pool) {
    if (left <= 0) break;
    const take = Math.min(it.qty, left);
    if (take <= 0) continue;
    InventoryStore.removeQty(it.id, take);
    inputs.push({ itemId: it.id, qty: take });
    left -= take;
  }
  GameState.addCoins(-q.feeWon, false, 'shop');
  const now = Date.now();
  const placed = ProcessQueue.add({
    recipeId, batches: n, inputs, output: { itemId: r.output.itemId, qty: q.outputQty }, feeWon: q.feeWon,
    regionId: GameState.currentRegionId, leftAtMs: now, readyAtMs: now + q.waitMin * 60_000, shopName,
  });
  GameState.markDirty();
  return { ok: true, message: `${r.nameKo} — ${r.input.nameKo} ${q.inputQty}개를 맡겼다 · ${q.waitMin}분 뒤에 찾는다 (공임 ${q.feeWon.toLocaleString()}원)`, order: placed };
}

/** 다 된 것을 찾는다 — 가방에 자리가 없으면 가공장에 그대로 둔다 */
export function collectProcessOrder(id: string, nowMs = Date.now()): ProcessActionResult {
  const o = ProcessQueue.pending.find((x) => x.id === id);
  if (!o) return { ok: false, message: '맡긴 것이 없다' };
  if (o.readyAtMs > nowMs) return { ok: false, message: `아직 하는 중이다 — ${Math.ceil((o.readyAtMs - nowMs) / 60_000)}분 남았다` };
  const tpl = processedItemTemplate(o.output.itemId);
  if (!tpl) return { ok: false, message: '찾을 것이 없다' };
  const withOrigin = { ...tpl, originRegion: o.regionId };
  const lack = InventoryStore.slotShortfall([{ tpl: withOrigin, qty: o.output.qty }]);
  if (Object.keys(lack).length) return { ok: false, message: '가방에 자리가 없다 — 한 칸 비우고 찾는다' };
  ProcessQueue.take(o.id);
  if (!InventoryStore.addItem(withOrigin, o.output.qty)) return { ok: false, message: '가방에 넣지 못했다' };
  GameState.markDirty();
  return { ok: true, message: `찾았다 — ${tpl.name} ${o.output.qty}개` };
}

/** 다 된 것이 몇 건인가(느낌표 · 알림) */
export function readyProcessCount(nowMs = Date.now()): number {
  return ProcessQueue.ready(nowMs).length;
}
