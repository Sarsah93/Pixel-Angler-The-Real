/**
 * @file MailDeliver.ts
 * @description 296차 — 우편함에 넣기 · 받기(가방 · 신선도). `MailboxStore`는 편지만 들고, 가방 · 세이브 더티는 여기서 다룬다.
 *
 *  - 유찰품 · 회차 실패 반환(`ConsignSettle`)은 **언제나** 우편함으로 온다 — 위판장이 돌려보내는 물건은 집에서 받는다
 *    (구: 어디에 있든 가방에 바로 넣었고, 가방이 가득하면 사라졌다 — 하모니 F-0048의 자동 경로).
 *  - 자동 반환 중 가방이 가득한 것(걷은 통발 · 용기)은 `addItemOrMail`로 — 들어가면 가방, 아니면 우편함(`overflow`).
 *  - 받기(`takeMail`)는 들어간 첨부만 떼고 못 넣은 것은 남긴다. 든 동안 신선도는 멈춘 것으로 쳐 `conditionSinceMs`를 뒤로 민다.
 */

import { getRegionById } from '@tra/core';
import { InventoryStore, type InvItem, type InvItemTemplate } from './InventoryStore.js';
import { MailboxStore, type MailAttachment, type MailLetter } from './MailboxStore.js';
import { GameState } from './GameState.js';

/** InvItem → 첨부(칸 · 착용 상태를 뗀다) */
export function attachmentOf(item: InvItem): MailAttachment {
  const { slot: _slot, qty, equippedHand: _hand, ...rest } = item;
  return { tpl: { ...rest, equipped: false } as InvItemTemplate, qty: qty || 1 };
}

/** 위판장 보낸 이 — 「속초 위판장」 */
export function consignMailFrom(regionId: string): string {
  const r = getRegionById(regionId);
  return `${r?.shortNameKo ?? r?.nameKo ?? '수협'} 위판장`;
}

/** 유찰품 — 위판장이 돌려보낸다 */
export function mailUnsold(regionId: string, items: readonly InvItem[]): MailLetter | null {
  if (!items.length) return null;
  const l = MailboxStore.send({
    kind: 'consign', from: consignMailFrom(regionId),
    title: '유찰된 물건을 돌려보냅니다',
    body: `맡기신 물건 ${items.length}건이 이번 회차에 팔리지 않았습니다. 그대로 돌려보내니 우편함에서 받아 가세요. 다음 회차에 다시 맡기셔도 됩니다.`,
    items: items.map(attachmentOf),
  });
  GameState.markDirty();
  return l;
}

/** 회차가 서지 않았다(장이 쉬는 날 등) — 맡긴 그대로 돌려보낸다 */
export function mailConsignFailed(regionId: string, items: readonly InvItem[]): MailLetter | null {
  if (!items.length) return null;
  const l = MailboxStore.send({
    kind: 'consign', from: consignMailFrom(regionId),
    title: '회차가 서지 않아 돌려보냅니다',
    body: `맡기신 물건 ${items.length}건을 올릴 회차가 서지 않았습니다. 그대로 돌려보내니 우편함에서 받아 가세요.`,
    items: items.map(attachmentOf),
  });
  GameState.markDirty();
  return l;
}

export interface OverflowLetter { from: string; title: string; body: string }

/** 가방에 넣고, 자리가 없으면 우편함으로(사라지지 않는다). 어디로 갔는지 돌려준다 */
export function addItemOrMail(tpl: InvItemTemplate, qty: number, letter: OverflowLetter): 'bag' | 'mail' {
  if (InventoryStore.addItem(tpl, qty, { silent: true })) return 'bag';
  MailboxStore.send({ kind: 'overflow', ...letter, items: [{ tpl: { ...tpl }, qty }] });
  GameState.markDirty();
  return 'mail';
}

export interface MailTakeResult { taken: number; left: number }

/** 편지 한 통의 첨부를 받는다 — 들어간 것만 떼고, 못 넣은 것은 남긴다(사유 = 가방 자리) */
export function takeMail(id: string, nowMs = Date.now()): MailTakeResult {
  const l = MailboxStore.byId(id);
  if (!l) return { taken: 0, left: 0 };
  let taken = 0;
  for (let i = l.items.length - 1; i >= 0; i--) {   // 뒤에서부터 떼면 앞 번호가 흔들리지 않는다
    const a = l.items[i]!;
    const tpl: InvItemTemplate = { ...a.tpl };
    if (tpl.conditionSinceMs !== undefined) tpl.conditionSinceMs += Math.max(0, nowMs - l.atMs);   // 든 동안 신선도 멈춤
    if (!InventoryStore.addItem(tpl, a.qty, { silent: true })) continue;
    MailboxStore.detach(id, i);
    taken += 1;
  }
  MailboxStore.markRead(id);
  if (taken) GameState.markDirty();
  return { taken, left: l.items.length };
}

/** 첨부가 든 편지 전부 받기 */
export function takeAllMail(nowMs = Date.now()): MailTakeResult {
  let taken = 0, left = 0;
  for (const l of [...MailboxStore.all]) {
    if (!l.items.length) continue;
    const r = takeMail(l.id, nowMs);
    taken += r.taken; left += r.left;
  }
  return { taken, left };
}

/** 첨부가 없는 편지를 지운다 */
export function deleteMail(id: string): boolean {
  const ok = MailboxStore.remove(id);
  if (ok) GameState.markDirty();
  return ok;
}
