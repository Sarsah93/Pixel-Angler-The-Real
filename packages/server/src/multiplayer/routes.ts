/**
 * @file routes.ts
 * @description 멀티플레이 세션 REST 라우터 (143차 신설)
 *
 * 로비(세션 열기·참가·이름 중복 검사)와 위치 알림을 **평범한 HTTP 요청**으로 처리한다.
 * 소켓을 쓰지 않는 이유: 로비는 전부 "묻고 답하기"라 요청/응답이면 충분하고,
 * 위치 공유도 1초 주기 폴링이면 이름표를 띄우기에 모자라지 않는다.
 * (부드러운 실시간 이동 보간이 필요해지면 Socket.IO 경로로 올린다 — 그때 이 계약을 그대로 쓴다.)
 */

import { Router } from 'express';
import { SessionRegistry } from './SessionRegistry.js';
import type { MpPeer, MpActivity, MpPlacedTrap } from '@tra/core';

export const sessionRegistry = new SessionRegistry();

export const multiplayerRouter: Router = Router();

multiplayerRouter.post('/session', (_req, res) => {
  res.json({ ok: true, code: sessionRegistry.create() });
});

multiplayerRouter.get('/session/:code', (req, res) => {
  const info = sessionRegistry.info(req.params.code);
  if (!info) { res.json({ ok: false, reasonKo: '세션을 찾을 수 없습니다.' }); return; }
  res.json({ ok: true, code: req.params.code.toUpperCase(), playerCount: info.playerCount, names: info.names });
});

multiplayerRouter.post('/session/:code/name-check', (req, res) => {
  const b = req.body as { name?: string; userId?: string };
  res.json(sessionRegistry.checkName(req.params.code, String(b.name ?? ''), b.userId));
});

multiplayerRouter.post('/session/:code/join', (req, res) => {
  const b = req.body as { name?: string; userId?: string; look?: MpPeer['look'] };
  res.json(sessionRegistry.join(req.params.code, String(b.name ?? ''), String(b.userId ?? ''), b.look));
});

multiplayerRouter.post('/presence', (req, res) => {
  const b = req.body as {
    code?: string; playerId?: string; regionId?: string;
    x?: number; y?: number; facing?: MpPeer['facing']; moving?: boolean;
    activity?: MpActivity; look?: MpPeer['look'];
    say?: string; chatSince?: number;
  };
  if (!b.code || !b.playerId) { res.json({ ok: false, reasonKo: '세션 정보가 없습니다.' }); return; }
  res.json(sessionRegistry.presence(b.code, b.playerId, {
    regionId: b.regionId ?? '', x: b.x ?? 0, y: b.y ?? 0,
    facing: b.facing ?? 'down', moving: b.moving ?? false,
    activity: b.activity, look: b.look,
  }, { say: b.say, chatSince: b.chatSince }));
});

// ── 145차 설치물 공유 — 통발은 놓는 순간 남에게도 보인다 ──
multiplayerRouter.post('/trap/place', (req, res) => {
  const b = req.body as { code?: string; playerId?: string; trap?: Omit<MpPlacedTrap, 'ownerId' | 'ownerName'> };
  if (!b.code || !b.playerId || !b.trap) { res.json({ ok: false, reasonKo: '요청이 올바르지 않습니다.' }); return; }
  res.json(sessionRegistry.placeTrap(b.code, b.playerId, b.trap));
});

multiplayerRouter.post('/trap/remove', (req, res) => {
  const b = req.body as { code?: string; playerId?: string; instanceId?: string };
  if (!b.code || !b.playerId || !b.instanceId) { res.json({ ok: false, reasonKo: '요청이 올바르지 않습니다.' }); return; }
  res.json(sessionRegistry.removeTrap(b.code, b.playerId, b.instanceId));
});

multiplayerRouter.post('/leave', (req, res) => {
  const b = req.body as { code?: string; playerId?: string };
  if (b.code && b.playerId) sessionRegistry.leave(b.code, b.playerId);
  res.json({ ok: true });
});
