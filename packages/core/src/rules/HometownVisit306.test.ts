/**
 * @file HometownVisit306.test.ts
 * @description 306차 — 홈타운 방문(집 구경) 규칙: 허락 판정 · 손님/집주인 방문 고르기 · 집 모습 모양 검사
 */
import { describe, it, expect } from 'vitest';
import { isVisitLive, visitAllowedFor, guestVisitOf, hostVisitsOf, liveVisitBetween, cleanHomeView, isVisitShape } from './HometownVisit.js';
import { newHomeId } from './HometownOwnership.js';
import { MP_HOME_VIEW_MAX_JSON, type MpVisit } from '../types/Multiplayer.js';

const HA = newHomeId(() => 0.2, 1_790_000_000_000);
const HB = newHomeId(() => 0.8, 1_790_000_000_000);
const v = (over: Partial<MpVisit>): MpVisit => ({
  id: 'v1', fromPlayerId: 'pB', fromName: '을순', toPlayerId: 'pA', toName: '갑돌', homeId: HA,
  status: 'pending', createdMs: 1, viewRev: 0, ...over,
});

describe('306 — 방문 허락', () => {
  it('들인 방문만 허락 — 청한 것 · 사양 · 끝남 · 남의 방문 · 다른 집은 아니다', () => {
    expect(visitAllowedFor([v({ status: 'accepted' })], 'pB', HA)).toBe(true);
    for (const st of ['pending', 'declined', 'ended', 'expired'] as const) expect(visitAllowedFor([v({ status: st })], 'pB', HA), st).toBe(false);
    expect(visitAllowedFor([v({ status: 'accepted' })], 'pC', HA)).toBe(false);   // 남이 들어간 방문
    expect(visitAllowedFor([v({ status: 'accepted' })], 'pB', HB)).toBe(false);   // 다른 집
    expect(visitAllowedFor([v({ status: 'accepted' })], '', HA)).toBe(false);     // 접속 전
  });
  it('살아 있는 방문 · 손님 쪽 · 집주인 쪽 · 둘 사이', () => {
    expect(isVisitLive(v({}))).toBe(true);
    expect(isVisitLive(v({ status: 'accepted' }))).toBe(true);
    expect(isVisitLive(v({ status: 'ended' }))).toBe(false);
    const list = [v({ id: 'a', status: 'ended' }), v({ id: 'b', status: 'accepted' }), v({ id: 'c', fromPlayerId: 'pC', status: 'pending' })];
    expect(guestVisitOf(list, 'pB')?.id).toBe('b');
    expect(hostVisitsOf(list, 'pA').map((x) => x.id)).toEqual(['b', 'c']);
    expect(hostVisitsOf(list, 'pA', 'accepted').map((x) => x.id)).toEqual(['b']);
    expect(liveVisitBetween(list, 'pA', 'pB')?.id).toBe('b');
    expect(liveVisitBetween(list, 'pB', 'pA')?.id).toBe('b');   // 방향 무관
    expect(liveVisitBetween(list, 'pB', 'pC')).toBeUndefined();
  });
  it('응답 모양 검사', () => {
    expect(isVisitShape(v({}))).toBe(true);
    expect(isVisitShape({ ...v({}), homeId: 'u-secret' })).toBe(false);
    expect(isVisitShape({ ...v({}), status: 'weird' })).toBe(false);
    expect(isVisitShape(null)).toBe(false);
  });
});

describe('306 — 집 모습(읽기 전용) 모양 검사', () => {
  const good = {
    world: { removedIds: ['tree_3'], moved: [{ instanceId: 'rock_1', tx: 4, ty: 5 }], placed: [{ instanceId: 'pl_1', type: 'fence', tx: 3, ty: 3, fw: 1, fh: 1 }] },
    farm: { pl_farm: { site: 'plot', cells: [] } },
    mailboxFlag: true, atMs: 123,
  };
  it('맞는 모양은 통과', () => { expect(cleanHomeView(good)).not.toBeNull(); });
  it('모양이 틀리면 버린다', () => {
    expect(cleanHomeView(null)).toBeNull();
    expect(cleanHomeView({ ...good, world: { ...good.world, placed: [{ type: 'fence', tx: 1, ty: 1 }] } })).toBeNull();   // id 없음
    expect(cleanHomeView({ ...good, world: { ...good.world, moved: [{ instanceId: 'x', tx: 'a', ty: 1 }] } })).toBeNull();
    expect(cleanHomeView({ ...good, farm: [] })).toBeNull();
    expect(cleanHomeView({ ...good, mailboxFlag: 'yes' })).toBeNull();
  });
  it('너무 크면 버린다', () => {
    const big = { ...good, farm: { pl_farm: { site: 'plot', cells: [], pad: 'x'.repeat(MP_HOME_VIEW_MAX_JSON) } } };
    expect(cleanHomeView(big)).toBeNull();
  });
});
