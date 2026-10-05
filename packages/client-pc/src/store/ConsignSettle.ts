/**
 * @file ConsignSettle.ts
 * @description 맡겨 둔 위판 정산 (213차).
 *
 * 회차가 열린 묶음을 core 위판 엔진으로 끝까지 굴려(`runConsignmentToEnd`) 낙찰 · 유찰을 정한다 — 현장에서 지켜본 경매와 같은 규칙.
 *  - 낙찰분: 실수령액 입금(`auction`) · 이야기 `sell` · 하루 장부 · 타이틀.
 *  - 유찰분: 맡긴 물건을 그대로 가방에 돌려준다.
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

export interface ConsignSettleReport {
  soldLots: number;
  unsoldLots: number;
  netWon: number;
  feeWon: number;
  /** 회차가 선 시각(ms) — 여러 묶음이면 마지막 것 */
  atMs: number;
}

/** 회차가 열린 맡긴 물건을 정산한다. 정산한 게 없으면 null */
export function settleDueConsignments(nowMs = Date.now()): ConsignSettleReport | null {
  const due = ConsignQueue.takeDue(nowMs);
  if (!due.length) return null;
  const rep: ConsignSettleReport = { soldLots: 0, unsoldLots: 0, netWon: 0, feeWon: 0, atMs: 0 };
  for (const b of due) {
    const k = new Date(b.dueAtMs + 9 * 3_600_000);   // 그 회차의 KST 벽시계
    const session = openConsignmentSession(
      b.category, buildConsignmentLots(b.inputs), k.getUTCHours(), k.getUTCMinutes(), k.getUTCDay(),
      StoryStore.harborRep(b.regionId), undefined, coopDuesFeeCut(GameState.coopDuesPaid()),
    );
    if (!session) { returnItems(b.items); rep.unsoldLots += b.items.length; continue; }
    runConsignmentToEnd(session);
    const result = settleConsignment(session);
    const soldIds = new Set(result.perLot.filter((r) => r.status === 'sold').map((r) => r.sourceItemId));
    for (let i = 0; i < result.soldLots; i++) StoryStore.event({ kind: 'sell' });
    returnItems(b.items.filter((it) => !soldIds.has(it.id)));
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

/** 유찰 · 회차 실패 — 맡긴 물건을 그대로 돌려준다 */
function returnItems(items: readonly import('./InventoryStore.js').InvItem[]): void {
  for (const it of items) {
    const { slot: _slot, qty, ...tpl } = it;
    InventoryStore.addItem({ ...tpl, equipped: false }, qty || 1, { silent: true });
  }
}
