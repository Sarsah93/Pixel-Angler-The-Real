/**
 * @file HometownVisit308.test.ts
 * @description 308차 — 집 안에서 서로 보기: 위치 알림에 실리는 방 안 자리 모양 검사
 */
import { describe, it, expect } from 'vitest';
import { cleanRoomPos } from './HometownVisit.js';
import { MP_ROOM_COORD_MAX } from '../types/Multiplayer.js';

describe('308 — 방 안 자리', () => {
  it('맞는 자리는 그대로 · 앉은 가구 id도', () => {
    expect(cleanRoomPos({ x: 3.5, y: 6.25, facing: 'left', moving: true })).toEqual({ x: 3.5, y: 6.25, facing: 'left', moving: true });
    expect(cleanRoomPos({ x: 2, y: 6, facing: 'right', moving: false, seat: 'sofa' })?.seat).toBe('sofa');
  });
  it('좌표가 수가 아니면 버린다(그 사람은 집 안에 안 그린다)', () => {
    expect(cleanRoomPos(null)).toBeUndefined();
    expect(cleanRoomPos({ x: 'a', y: 1 })).toBeUndefined();
    expect(cleanRoomPos({ x: 1, y: Number.NaN })).toBeUndefined();
    expect(cleanRoomPos([1, 2])).toBeUndefined();
  });
  it('범위 밖 좌표는 자르고 · 이상한 방위는 아래 · 움직임은 참일 때만 · 긴 가구 id는 뺀다', () => {
    const r = cleanRoomPos({ x: -5, y: 1e9, facing: 'north', moving: 'yes', seat: 'x'.repeat(65) })!;
    expect(r).toEqual({ x: 0, y: MP_ROOM_COORD_MAX, facing: 'down', moving: false });
  });
});
