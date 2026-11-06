/**
 * @file VisitSync.ts
 * @description 307차 — 집 구경 동기화 조각. 필드(`RegionFieldScene`)와 집 안(`HomeInteriorScene`)이 같이 쓴다.
 *
 *  - `VISIT_SEEN`: 방문마다 마지막으로 화면에 알린 상태 — 두 장면이 같은 알림을 두 번 띄우지 않는다.
 *  - 집주인: 들인 방문이 있으면 집 모습(마당 · 텃밭 · 깃발 · 집 안)을 올린다 — 처음 · 바뀌었을 때 · 15초마다.
 *    306차에는 필드에만 있어, 집주인이 집 안에 들어가 있는 동안(필드가 멈춘 동안) 청도 못 받고 모습도 멈췄다.
 *  - 손님: 구경 중인 집의 새 판을 받아 `GameState.visitView`에 두고 판 번호(`guestViewSerial`)를 올린다 —
 *    각 장면은 자기가 입힌 판 번호와 다르면 다시 그린다(멈춰 있던 장면도 돌아오면 따라온다).
 *  - 손님: 구경 중인 집에서 나가야 하는 까닭(방문이 끝났다) — 집 안에서도 알아채 밖으로 나간다.
 */

import { guestVisitOf, hostVisitsOf, MP_VISIT_REASON_KO, type MpVisit } from '@tra/core';
import { MultiplayerClient } from './MultiplayerClient.js';
import { GameState } from '../store/GameState.js';

/** 방문 id → 마지막으로 화면에 알린 상태 */
export const VISIT_SEEN = new Map<string, string>();

let pushSig = '';
let pushAt = 0;

/** 다음 틱에 곧바로 집 모습을 올린다(손님을 막 들였을 때) */
export function kickHomeViewPush(): void { pushSig = ''; }

/** 집주인 — 들인 방문이 있으면 집 모습을 올린다(3초에 한 번 비교 · 바뀌었거나 새 손님이거나 15초마다) */
export function pumpHomeViewPush(nowMs = Date.now()): void {
  const me = MultiplayerClient.playerId;
  if (!me) return;
  const hosting = hostVisitsOf(MultiplayerClient.visits, me, 'accepted');
  if (!hosting.length) return;
  if (nowMs - pushAt <= 3000 && pushSig) return;
  pushAt = nowMs;
  const view = GameState.buildHomeView();
  const sig = JSON.stringify({ ...view, atMs: 0 });
  if (sig !== pushSig || hosting.some((v) => v.viewRev === 0) || nowMs % 15000 < 3000) {
    pushSig = sig;
    for (const v of hosting) void MultiplayerClient.putHomeView(v.id, view);
  }
}

/** 집주인 — 아직 묻지 않은 청 하나(돌려주면 본 것으로 적는다 — 묻는 창은 부른 장면이 띄운다) */
export function takeHostRequest(): MpVisit | null {
  const me = MultiplayerClient.playerId;
  if (!me) return null;
  const v = MultiplayerClient.visits.find((x) => x.toPlayerId === me && x.status === 'pending' && VISIT_SEEN.get(x.id) !== 'pending');
  if (!v) return null;
  VISIT_SEEN.set(v.id, 'pending');
  return v;
}

let viewRev = 0;
let viewAsk = 0;
let serial = 0;

/** 손님이 집에 들어설 때(필드 init) — 받은 판 번호를 비운다(곧 새로 받는다) */
export function resetGuestView(): void { viewRev = 0; viewAsk = 0; }

/** 받아 둔 집 모습의 판 번호 — 장면은 자기가 입힌 번호와 다르면 다시 그린다 */
export function guestViewSerial(): number { return serial; }

/** 손님 — 구경 중인 집의 모습이 새 판이면 받아 `GameState.visitView`에 둔다 */
export function pumpGuestView(): void {
  if (!GameState.visitingHometown) return;
  const gv = guestVisitOf(MultiplayerClient.visits, MultiplayerClient.playerId);
  const home = GameState.hometownStay.ownerHomeId;
  if (!gv || gv.status !== 'accepted' || gv.homeId !== home || gv.viewRev <= viewRev || viewAsk === gv.viewRev) return;
  viewAsk = gv.viewRev;
  void MultiplayerClient.fetchHomeView(gv.id).then((r) => {
    if (!r || !GameState.visitingHometown || GameState.hometownStay.ownerHomeId !== gv.homeId) return;
    viewRev = r.rev;
    GameState.setVisitView(r.view);
    serial++;
  });
}

/**
 * 손님 — 구경 중인 집의 방문이 끝났으면 그 까닭(한 번만 — 본 것으로 적는다). 아니면 null.
 * 같은 집에 다시 들인 방문이 살아 있으면 끝난 옛 방문은 보지 않는다.
 */
export function guestEndedReason(): string | null {
  if (!GameState.visitingHometown) return null;
  const me = MultiplayerClient.playerId;
  const home = GameState.hometownStay.ownerHomeId;
  const live = guestVisitOf(MultiplayerClient.visits, me);
  if (live && live.status === 'accepted' && live.homeId === home) return null;
  const ended = MultiplayerClient.visits.find((v) => v.fromPlayerId === me && v.homeId === home && v.status === 'ended' && VISIT_SEEN.get(v.id) !== 'ended');
  if (!ended) return null;
  VISIT_SEEN.set(ended.id, 'ended');
  return ended.reasonKo ?? MP_VISIT_REASON_KO.endedByHost;
}
