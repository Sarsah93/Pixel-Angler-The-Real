/**
 * @file HometownOwnership305.test.ts
 * @description 305차 — 홈타운은 사람마다 한 벌: 세션 키 꼬리표 · 방문자 허용 행동 · 머무는 집 정하기 · 서버 길이 상한 안
 */
import { describe, it, expect } from 'vitest';
import {
  newHomeId, isHomeId, isHometownRegion, mpScopedRegionId, mpUnscopeRegionId, mpScopedMapKey, mpScopedWorldKey,
  hometownAllows, HOMETOWN_VISITOR_ACTIONS, claimHometownOwner, resolveHometownStay,
} from './HometownOwnership.js';
import { MP_TAKEN_KEY_MAX, MP_TAKEN_KEY_PREFIXES } from '../types/Multiplayer.js';
import type { HometownAction } from '../types/Multiplayer.js';

const A = newHomeId(() => 0.3, 1_790_000_000_000);
const B = newHomeId(() => 0.7, 1_790_000_000_000);

describe('305 — 집 id', () => {
  it('모양 · 서로 다름 · 재접속 열쇠 모양(u…)은 집 id가 아니다', () => {
    expect(isHomeId(A)).toBe(true);
    expect(isHomeId(B)).toBe(true);
    expect(A).not.toBe(B);
    expect(isHomeId('u' + A.slice(1))).toBe(false);
    expect(isHomeId('')).toBe(false);
    expect(isHomeId('h@x')).toBe(false);
    for (let i = 0; i < 200; i++) expect(isHomeId(newHomeId())).toBe(true);
  });
});

describe('305 — 세션 키 꼬리표', () => {
  it('홈타운만 · 다른 지역은 그대로 · 풀면 원래대로', () => {
    const s = mpScopedRegionId('hometown', A);
    expect(s).toBe(`hometown@${A}`);
    expect(mpScopedRegionId('gangwon_sokcho', A)).toBe('gangwon_sokcho');
    expect(mpScopedRegionId('hometown', '')).toBe('hometown');   // 집 id가 없으면 손대지 않는다
    expect(mpUnscopeRegionId(s)).toEqual({ regionId: 'hometown', homeId: A });
    expect(mpUnscopeRegionId('hometown')).toEqual({ regionId: 'hometown' });
    expect(mpUnscopeRegionId('busan')).toEqual({ regionId: 'busan' });
    expect(isHometownRegion(s)).toBe(true);
    expect(isHometownRegion('hometown')).toBe(true);
    expect(isHometownRegion('gangwon_sokcho')).toBe(false);
    expect(s.length).toBeLessThanOrEqual(64);   // 서버 지역 키 상한
  });

  it('맵 키 — 홈타운 맵만 · 두 번 붙지 않음 · 두 집은 서로 다른 키', () => {
    const a = mpScopedMapKey('hometown:hometown_home', A);
    expect(a).toBe(`hometown@${A}:hometown_home`);
    expect(mpScopedMapKey(a, A)).toBe(a);
    expect(mpScopedMapKey('hometown:hometown_home', B)).not.toBe(a);
    expect(mpScopedMapKey('gangwon_sokcho:sokcho_v2', A)).toBe('gangwon_sokcho:sokcho_v2');
    expect(a.length).toBeLessThanOrEqual(64);   // 서버 설치물 맵 키 상한
  });

  it('공유 소비 키 — 채집 · 달아나는 생물은 맵 꼬리표 · 과증식은 홈타운에 있을 때만 · 날씨는 그대로 · 접두사 · 길이 상한', () => {
    const f = mpScopedWorldKey('f:hometown:hometown_home|spot_12_34', A, true);
    expect(f).toBe(`f:hometown@${A}:hometown_home|spot_12_34`);
    expect(mpScopedWorldKey('f:gangwon_sokcho:sokcho_v2|spot_1', A, false)).toBe('f:gangwon_sokcho:sokcho_v2|spot_1');
    const r = mpScopedWorldKey('r:hometown:hometown_home|s|3', A, true);
    expect(r).toBe(`r:hometown@${A}:hometown_home|s|3`);
    const n = mpScopedWorldKey('n:123456|7', A, true);
    expect(n).toBe(`n:hometown@${A}|123456|7`);
    expect(mpScopedWorldKey(n, A, true)).toBe(n);   // 두 번 붙지 않는다
    expect(mpScopedWorldKey('n:123456|7', A, false)).toBe('n:123456|7');
    expect(mpScopedWorldKey('w:hometown|4012', A, true)).toBe('w:hometown|4012');
    for (const k of [f, r, n]) {
      expect(MP_TAKEN_KEY_PREFIXES.some((p) => k.startsWith(p)), k).toBe(true);
      expect(k.length, k).toBeLessThanOrEqual(MP_TAKEN_KEY_MAX);
    }
  });
});

describe('305 — 소유 판정', () => {
  const ALL: HometownAction[] = ['look', 'talk', 'trade', 'gift', 'enterHouse', 'mailbox', 'farm', 'place', 'pickup', 'yard', 'forage'];
  it('내 집 = 전부 · 머무는 집 없음(혼자) = 내 집', () => {
    for (const a of ALL) {
      expect(hometownAllows(a, A, A)).toBe(true);
      expect(hometownAllows(a, A, undefined)).toBe(true);
    }
  });
  it('남의 집 = 보기 · 말 · 거래 · 선물만', () => {
    for (const a of ALL) expect(hometownAllows(a, A, B), a).toBe(HOMETOWN_VISITOR_ACTIONS.has(a));
    expect([...HOMETOWN_VISITOR_ACTIONS].sort()).toEqual(['gift', 'look', 'talk', 'trade']);
  });
  it('로컬 세이브의 홈타운 데이터는 언제나 그 세이브 주인 것(구세이브 · 다른 id는 다시 적는다)', () => {
    expect(claimHometownOwner(undefined, A)).toEqual({ ownerHomeId: A, restamped: true });
    expect(claimHometownOwner(A, A)).toEqual({ ownerHomeId: A, restamped: false });
    expect(claimHometownOwner(B, A)).toEqual({ ownerHomeId: A, restamped: true });
  });
});

describe('305 — 머무는 집 정하기', () => {
  const base = { myHomeId: A, connected: true, ownerOnline: (h: string) => h === B, visitAllowed: (h: string) => h === B };
  it('내 집 · 요청 없음 = 내 집', () => {
    expect(resolveHometownStay(undefined, base)).toEqual({ stay: { ownerHomeId: A } });
    expect(resolveHometownStay({ ownerHomeId: A }, base)).toEqual({ stay: { ownerHomeId: A } });
  });
  it('남의 집 — 접속 · 주인 있음 · 허락 셋 다 참일 때만', () => {
    expect(resolveHometownStay({ ownerHomeId: B, ownerName: '갑돌' }, base)).toEqual({ stay: { ownerHomeId: B, ownerName: '갑돌' } });
    expect(resolveHometownStay({ ownerHomeId: B }, { ...base, connected: false })).toEqual({ stay: { ownerHomeId: A }, fallback: 'notConnected' });
    expect(resolveHometownStay({ ownerHomeId: B }, { ...base, ownerOnline: () => false })).toEqual({ stay: { ownerHomeId: A }, fallback: 'ownerAway' });
    expect(resolveHometownStay({ ownerHomeId: B }, { ...base, visitAllowed: () => false })).toEqual({ stay: { ownerHomeId: A }, fallback: 'notAllowed' });
    expect(resolveHometownStay({ ownerHomeId: 'u-secret' }, base)).toEqual({ stay: { ownerHomeId: A }, fallback: 'badId' });
  });
});
