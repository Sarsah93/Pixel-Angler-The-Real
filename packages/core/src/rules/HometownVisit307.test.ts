/**
 * @file HometownVisit307.test.ts
 * @description 307차 — 집 안 구경: 주인 집 모습에 실린 집 안(가구 배치 · 화분 · 스탠드 · 수조 · 어탁) 모양 검사
 */
import { describe, it, expect } from 'vitest';
import { cleanHomeView } from './HometownVisit.js';

const base = {
  world: { removedIds: [], moved: [], placed: [] },
  farm: {},
  mailboxFlag: false, atMs: 1,
};
const interior = {
  placed: [
    { id: 'bed', kind: 'bed', tx: 9, ty: 2, dir: 'down' },
    { id: 'aquarium_1', kind: 'aquarium', tx: 3, ty: 6, dir: 'left' },
  ],
  dryPlants: ['plant'],
  lampsOn: ['stand'],
  tanks: { aquarium_1: [{ speciesId: 'black_rockfish', lengthCm: 21, sex: 'M' }] },
  fishPrint: { speciesId: 'red_seabream', lengthCm: 48 },
};

describe('307 — 집 안 모습 모양 검사', () => {
  it('집 안이 없는 옛 모습도 그대로 통과(손님은 집 안에 못 들어갈 뿐)', () => {
    expect(cleanHomeView(base)).not.toBeNull();
    expect(cleanHomeView(base)?.interior).toBeUndefined();
  });
  it('맞는 집 안은 통과 · 어탁이 없어도 된다', () => {
    expect(cleanHomeView({ ...base, interior })?.interior?.placed.length).toBe(2);
    const { fishPrint: _f, ...noPrint } = interior;
    expect(cleanHomeView({ ...base, interior: noPrint })).not.toBeNull();
  });
  it('모양이 틀린 집 안이면 모습 전체를 버린다', () => {
    const bad = (iv: unknown): boolean => cleanHomeView({ ...base, interior: iv }) === null;
    expect(bad(null)).toBe(true);
    expect(bad({ ...interior, placed: [{ id: 'x', kind: 'bed', tx: 1, ty: 1, dir: 'north' }] })).toBe(true);   // 방위
    expect(bad({ ...interior, placed: [{ kind: 'bed', tx: 1, ty: 1, dir: 'down' }] })).toBe(true);             // id 없음
    expect(bad({ ...interior, lampsOn: [3] })).toBe(true);
    expect(bad({ ...interior, tanks: { a: [{ speciesId: 'x', lengthCm: 'big', sex: 'M' }] } })).toBe(true);
    expect(bad({ ...interior, tanks: { a: new Array(9).fill({ speciesId: 'x', lengthCm: 10, sex: 'F' }) } })).toBe(true);   // 수조 칸 넘침
    expect(bad({ ...interior, fishPrint: { speciesId: 'x' } })).toBe(true);
    expect(bad({ ...interior, placed: new Array(81).fill(interior.placed[0]) })).toBe(true);   // 가구 상한
  });
  it('보관함 속 같은 주인 몫 필드는 모양에 없다(실어 보내지 않는다)', () => {
    const v = cleanHomeView({ ...base, interior })!;
    expect(Object.keys(v.interior!).sort()).toEqual(['dryPlants', 'fishPrint', 'lampsOn', 'placed', 'tanks']);
  });
});
