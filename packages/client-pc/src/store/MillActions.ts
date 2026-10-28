/**
 * @file MillActions.ts
 * @description 284차 — 방앗간 맡기기 · 찾기 · 무르기(가방 · 돈). 계산은 core `rules/OilMill.ts`, 대기열 데이터는 `MillQueue.ts`.
 *
 * - 맡길 깨는 **털어 낸 낱알(g)** 이다. 등급이 섞여 있으면 보통 → 상 → 특 순서로 덜어 간다(좋은 것은 봉지로 팔게 남긴다).
 *   봉지에 담은 깨는 가방에서 「봉지 뜯기」를 한 뒤 맡긴다.
 * - 공임(+ 병값)은 맡길 때 낸다. 다 되기 전에 무르면 깨와 공임을 그대로 돌려받는다.
 * - 찾을 때 가방에 자리가 없으면 그대로 방앗간에 둔다(다음에 와서 찾는다).
 */

import {
  oilQuote, grindQuote, millService, produceItemId, MILL_TUNING,
  type MillQuote, type MillServiceId, type OilBottleMl, type CropGrade,
} from '@tra/core';
import { GameState } from './GameState.js';
import { InventoryStore, type InvItemTemplate } from './InventoryStore.js';
import { MillQueue, type MillOrder } from './MillQueue.js';
import { cropItemTemplate } from '../data/CropItems.js';
import { millItemTemplate } from '../data/MillItems.js';
import { cookCornerTemplate } from '../data/CookItems.js';
import { gramsText } from '../ui/QtyLabel.js';

/** 받침이 있으면 앞 조사, 없으면 뒤 조사 */
function josa(word: string, withB: string, withoutB: string): string {
  const c = word.charCodeAt(word.length - 1);
  const b = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return `${word}${b ? withB : withoutB}`;
}

/** 덜어 가는 등급 순서(낮은 것부터) */
const GRADE_ORDER: CropGrade[] = ['normal', 'good', 'special'];

export interface MillActionResult { ok: boolean; message: string; order?: MillOrder }

/** 맡길 수 있는 낱알(g) — 등급 셋을 합친다 */
export function seedStockG(seedBaseId: string): number {
  let g = 0;
  for (const gr of GRADE_ORDER) {
    const it = InventoryStore.find(produceItemId(seedBaseId, gr));
    if (it) g += it.qty * (it.unitG ?? 1);
  }
  return g;
}

/** 맡길 일의 견적 — 기름은 병 수, 갈기 · 볶기는 g */
export function millQuoteOf(serviceId: MillServiceId, req: { bottles?: Partial<Record<OilBottleMl, number>>; grams?: number }): MillQuote | null {
  const s = millService(serviceId);
  if (!s) return null;
  return s.kind === 'oil' ? oilQuote(serviceId, req.bottles ?? {}) : grindQuote(serviceId, req.grams ?? 0);
}

/** 찾을 것 → 가방 모양(기름병 · 깻묵 · 1큰술) */
export function millOutputTemplate(itemId: string): InvItemTemplate | null {
  return millItemTemplate(itemId) ?? cropItemTemplate(itemId) ?? cookCornerTemplate(itemId);
}

/** 맡긴다 — 깨를 덜고 공임을 낸다 */
export function placeMillOrder(
  serviceId: MillServiceId, req: { bottles?: Partial<Record<OilBottleMl, number>>; grams?: number }, shopName: string,
): MillActionResult {
  const s = millService(serviceId);
  const q = millQuoteOf(serviceId, req);
  if (!s || !q) return { ok: false, message: s?.kind === 'oil' ? '몇 병을 짤지 고른다' : `${MILL_TUNING.grindStepG}g 단위로 맡긴다` };
  const have = seedStockG(s.seedItemId);
  const seedName = cropItemTemplate(s.seedItemId)?.name.replace(/\s*·.*$/, '') ?? s.seedItemId;
  if (have < q.seedG) return { ok: false, message: `털어 둔 ${josa(seedName, '이', '가')} 모자란다 — ${gramsText(q.seedG)}이 든다 (가방 ${gramsText(have)} · 봉지는 뜯어서 맡긴다)` };
  if (GameState.player.inventory.coins < q.feeWon) return { ok: false, message: `공임 ${q.feeWon.toLocaleString()}원이 모자란다` };
  // 깨를 낮은 등급부터 덜어 간다
  let left = q.seedG;
  const seeds: { itemId: string; qty: number }[] = [];
  for (const gr of GRADE_ORDER) {
    if (left <= 0) break;
    const id = produceItemId(s.seedItemId, gr);
    const it = InventoryStore.find(id);
    if (!it) continue;
    const per = it.unitG ?? 1;
    const take = Math.min(it.qty, Math.ceil(left / per));
    if (take <= 0) continue;
    InventoryStore.removeQty(id, take);
    seeds.push({ itemId: id, qty: take });
    left -= take * per;
  }
  GameState.addCoins(-q.feeWon, false, 'shop');
  const now = Date.now();
  const order = MillQueue.add({
    service: serviceId, seeds, outputs: q.outputs, feeWon: q.feeWon, oilMl: q.oilMl,
    leftAtMs: now, readyAtMs: now + q.waitMin * 60_000, shopName,
  });
  GameState.markDirty();
  return { ok: true, message: `${s.nameKo} — ${gramsText(q.seedG)}을 맡겼다 · ${q.waitMin}분 뒤에 찾는다 (공임 ${q.feeWon.toLocaleString()}원)`, order };
}

/** 다 된 일을 찾는다 — 가방에 자리가 없으면 방앗간에 그대로 둔다 */
export function collectMillOrder(id: string, nowMs = Date.now()): MillActionResult {
  const o = MillQueue.pending.find((x) => x.id === id);
  if (!o) return { ok: false, message: '맡긴 것이 없다' };
  if (o.readyAtMs > nowMs) return { ok: false, message: `아직 하는 중이다 — ${Math.ceil((o.readyAtMs - nowMs) / 60_000)}분 남았다` };
  const parts = o.outputs.map((x) => ({ tpl: millOutputTemplate(x.itemId), qty: x.qty }))
    .filter((p): p is { tpl: InvItemTemplate; qty: number } => !!p.tpl);
  const lack = InventoryStore.slotShortfall(parts);
  if (Object.keys(lack).length) return { ok: false, message: '가방에 자리가 없다 — 한 칸 비우고 찾는다' };
  MillQueue.take(o.id);
  const got: string[] = [];
  for (const p of parts) {
    if (!InventoryStore.addItem(p.tpl, p.qty)) continue;
    got.push(p.tpl.unitG ? `${p.tpl.name} ${gramsText(p.qty * p.tpl.unitG)}` : `${p.tpl.name} ${p.qty}개`);
  }
  GameState.markDirty();
  return { ok: true, message: `찾았다 — ${got.join(' · ')}` };
}

/** 다 되기 전에 무른다 — 깨와 공임을 돌려받는다 */
export function cancelMillOrder(id: string, nowMs = Date.now()): MillActionResult {
  const o = MillQueue.pending.find((x) => x.id === id);
  if (!o) return { ok: false, message: '맡긴 것이 없다' };
  if (o.readyAtMs <= nowMs) return { ok: false, message: '이미 다 됐다 — 찾아 간다' };
  const parts = o.seeds.map((x) => ({ tpl: cropItemTemplate(x.itemId), qty: x.qty }))
    .filter((p): p is { tpl: InvItemTemplate; qty: number } => !!p.tpl);
  if (Object.keys(InventoryStore.slotShortfall(parts)).length) return { ok: false, message: '가방에 자리가 없다 — 한 칸 비우고 무른다' };
  MillQueue.take(o.id);
  for (const p of parts) InventoryStore.addItem(p.tpl, p.qty, { silent: true });
  GameState.addCoins(o.feeWon, true, 'shop');
  GameState.markDirty();
  return { ok: true, message: `물렀다 — 깨와 공임 ${o.feeWon.toLocaleString()}원을 돌려받았다` };
}

/** 다 된 일 수(창 · 일지 · 간판 혼잣말) */
export function readyMillCount(nowMs = Date.now()): number {
  return MillQueue.ready(nowMs).length;
}

if (import.meta.env.DEV) {
  // 실렌더 하네스용 — `import('/src/…')`는 게임과 별개 모듈이라(59차 `__INV` 규칙) 게임이 쓰는 함수를 노출한다
  (globalThis as unknown as { __MILLACT: unknown }).__MILLACT = { placeMillOrder, collectMillOrder, cancelMillOrder, seedStockG, millQuoteOf, readyMillCount };
}
