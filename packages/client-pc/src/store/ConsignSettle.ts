/**
 * @file ConsignSettle.ts
 * @description 맡겨 둔 위판 정산 (213차).
 *
 * 회차가 열린 묶음을 core 위판 엔진으로 끝까지 굴려(`runConsignmentToEnd`) 낙찰 · 유찰을 정한다 — 현장에서 지켜본 경매와 같은 규칙.
 *  - 낙찰분: 실수령액 입금(`auction`) · 이야기 `sell` · 하루 장부 · 타이틀.
 *  - 유찰분: 296차 — 위판장이 **집 우편함**으로 돌려보낸다(`MailDeliver.mailUnsold`). 구: 어디에 있든 가방에 바로 넣었고,
 *    가방이 가득하면 사라졌다(하모니 F-0048 자동 경로 — 사용자 결정 2026-11-02 「유실 경로를 우편함으로」).
 * 필드 · 집 씬이 1초마다 `settleDueConsignments()`를 부른다(꺼 둔 사이 열린 회차는 다음에 들어올 때 정산).
 */

import {
  buildConsignmentLots, openConsignmentSession, runConsignmentToEnd, settleConsignment, coopDuesFeeCut,
} from '@tra/core';
import { ConsignQueue } from './ConsignQueue.js';
import { GameState } from './GameState.js';
import { InventoryStore } from './InventoryStore.js';
import { StoryStore } from './StoryStore.js';
import { LedgerStore } from './LedgerStore.js';
import { TitleStore } from './TitleStore.js';
import { mailUnsold, mailConsignFailed } from './MailDeliver.js';   // 296차

export interface ConsignSettleReport {
  soldLots: number;
  unsoldLots: number;
  netWon: number;
  feeWon: number;
  /** 회차가 선 시각(ms) — 여러 묶음이면 마지막 것 */
  atMs: number;
  /** 296차 — 집 우편함으로 돌려보낸 물건 수(유찰 · 회차 실패) */
  mailed: number;
}

/** 회차가 열린 맡긴 물건을 정산한다. 정산한 게 없으면 null */
export function settleDueConsignments(nowMs = Date.now()): ConsignSettleReport | null {
  const due = ConsignQueue.takeDue(nowMs);
  if (!due.length) return null;
  const rep: ConsignSettleReport = { soldLots: 0, unsoldLots: 0, netWon: 0, feeWon: 0, atMs: 0, mailed: 0 };
  for (const b of due) {
    const k = new Date(b.dueAtMs + 9 * 3_600_000);   // 그 회차의 KST 벽시계
    const session = openConsignmentSession(
      b.category, buildConsignmentLots(b.inputs), k.getUTCHours(), k.getUTCMinutes(), k.getUTCDay(),
      StoryStore.harborRep(b.regionId), undefined, coopDuesFeeCut(GameState.coopDuesPaid()) + GameState.ledgerFeeCut(),
    );
    if (!session) { mailConsignFailed(b.regionId, b.items); rep.unsoldLots += b.items.length; rep.mailed += b.items.length; continue; }   // 296차 — 우편함으로
    runConsignmentToEnd(session);
    const result = settleConsignment(session);
    const soldIds = new Set(result.perLot.filter((r) => r.status === 'sold').map((r) => r.sourceItemId));
    // 233차 — 낙찰된 것 하나하나가 거래로 받은 것(계보)인지 실어 보낸다 — 「직접 마련한 것만」 위판 목표는 세지 않는다
    for (const it of b.items) if (soldIds.has(it.id)) StoryStore.event({ kind: 'sell', ...(it.traded ? { traded: true } : {}) });
    const unsold = b.items.filter((it) => !soldIds.has(it.id));
    mailUnsold(b.regionId, unsold);   // 296차 — 유찰품은 집 우편함으로(가방이 가득해도 사라지지 않는다)
    rep.mailed += unsold.length;
    if (result.netWon > 0) GameState.addCoins(result.netWon, false, 'auction');
    LedgerStore.life('auctionLots', result.soldLots);
    TitleStore.bump('auctionSold', result.soldLots);
    rep.soldLots += result.soldLots;
    rep.unsoldLots += result.unsoldLots;
    rep.netWon += result.netWon;
    rep.feeWon += result.feeWon;
    rep.atMs = Math.max(rep.atMs, b.dueAtMs);
  }
  GameState.markDirty();
  return rep;
}

/** 하모니 — 찾아오기 전 자리 확인. 가방에 다 들어가지 않으면 사유(한 줄), 괜찮으면 null */
export function consignRetrieveBlock(batchId: string): string | null {
  const b = ConsignQueue.serialize().batches.find((x) => x.id === batchId);
  if (!b) return null;
  const lack = InventoryStore.slotShortfall(b.items.map((it) => ({ tpl: it, qty: it.qty || 1 })));
  return Object.keys(lack).length ? '가방에 자리가 없어 찾아올 수 없다.' : null;
}

/**
 * 214차 — 경매 전에 찾아온다(위판장 창구에서만). 맡긴 그대로 가방에 돌아온다 — 맡긴 동안 신선도는 멈춰 있었다.
 * @returns 돌려준 물건 수(묶음이 없으면 0)
 */
export function retrieveConsignment(batchId: string): number {
  if (consignRetrieveBlock(batchId)) return 0;   // 가방이 모자라면 묶음을 그대로 둔다(돌려주다 사라지지 않게)
  const b = ConsignQueue.take(batchId);
  if (!b) return 0;
  returnItems(b.items);
  GameState.markDirty();
  return b.items.length;
}

/** 경매 전 찾아오기 — 맡긴 물건을 그대로 가방에 돌려준다(자리는 `consignRetrieveBlock`이 먼저 봤다) */
function returnItems(items: readonly import('./InventoryStore.js').InvItem[]): void {
  for (const it of items) {
    const { slot: _slot, qty, ...tpl } = it;
    InventoryStore.addItem({ ...tpl, equipped: false }, qty || 1, { silent: true });
  }
}
