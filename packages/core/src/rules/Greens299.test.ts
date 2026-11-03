/**
 * @file Greens299.test.ts
 * @description 299차 — 산나물(산자락 채집): 표 · 수확물 · 지역 · 제철 · 놀이 갈래 · 굴림(산자락 후보에서만 · 지역 · 달)
 */
import { describe, it, expect } from 'vitest';
import { SHORE_CREATURE_DATABASE } from '../db-schema/ShoreCreatureDatabase.js';
import { CROP_DATABASE } from '../db-schema/CropDatabase.js';
import { WORLD_NODE_DATABASE } from '../types/WorldMap.js';
import { rollForageSpots, forageGameKindOf, isWildGreen, creatureTools, creatureSpotKinds } from '../simulation/ForagingEngine.js';
import type { ForageCandidate } from '../types/Foraging.js';
import { specialtyOf } from '../db-schema/RegionalSpecialty.js';

const greens = SHORE_CREATURE_DATABASE.filter(isWildGreen);
const hill = (n = 12): ForageCandidate[] => { const out: ForageCandidate[] = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) out.push({ tx: x * 3, ty: y * 3, kind: 'hill_grass' }); return out; };
const base = { seed: 7, isNight: false, tideLevel01: 1, hasAdvancedLicense: true, farms: [], maxSpots: 40, spotsPerHundred: 20 };

describe('299 — 산나물', () => {
  it('표 — 8종 · 수확물이 텃밭 작물에 있다 · 지역 id · 산자락 · 낮 · 맨손', () => {
    expect(greens.length).toBe(8);
    const harvestIds = new Set(CROP_DATABASE.map((c) => c.harvest.itemId));
    const regionIds = new Set(WORLD_NODE_DATABASE.map((n) => n.id));
    for (const g of greens) {
      expect(g.harvestItemId && harvestIds.has(g.harvestItemId), g.id).toBe(true);
      for (const r of g.regions ?? []) expect(regionIds.has(r), `${g.id} ${r}`).toBe(true);
      expect(creatureSpotKinds(g)).toEqual(['hill_grass']);
      expect(g.discoveryTime).toBe('day');
      expect(creatureTools(g)).toContain('hand');
      expect(g.absentMonths?.length ?? 0).toBeGreaterThan(0);
      expect(g.requiredLicense).toBeNull();
    }
  });

  it('놀이 갈래 — 잎 뜯기 = 줍기 판 · 순 꺾기 = 떼기 판 · 뿌리 캐기 = 파기 판', () => {
    expect(forageGameKindOf({ category: 'wild_green', behavior: 'leaf' } as never)).toBe('pick');
    expect(forageGameKindOf({ category: 'wild_green', behavior: 'shoot' } as never)).toBe('pry');
    expect(forageGameKindOf({ category: 'wild_green', behavior: 'root' } as never)).toBe('dig');
    expect(forageGameKindOf({ category: 'wild_green' } as never)).toBe('pick');
  });

  it('굴림 — 산자락 후보에서는 산나물만 · 속초 5월엔 울릉 전용이 없다 · 울릉엔 있다 · 11월엔 없다', () => {
    const sokcho = rollForageSpots(hill(), { ...base, month: 5, regionId: 'gangwon_sokcho' });
    expect(sokcho.length).toBeGreaterThan(0);
    for (const s of sokcho) expect(greens.some((g) => g.id === s.creatureId), s.creatureId).toBe(true);
    expect(sokcho.some((s) => s.creatureId === 'green_samnamul' || s.creatureId === 'green_bujigaengi')).toBe(false);
    const ull = rollForageSpots(hill(), { ...base, seed: 11, month: 5, regionId: 'ulleungdo' });
    expect(ull.some((s) => s.creatureId === 'green_samnamul' || s.creatureId === 'green_bujigaengi' || s.creatureId === 'green_myeongi')).toBe(true);
    const nov = rollForageSpots(hill(), { ...base, month: 11, regionId: 'gangwon_sokcho' });
    expect(nov.length).toBe(0);
    const night = rollForageSpots(hill(), { ...base, month: 5, isNight: true, regionId: 'gangwon_sokcho' });
    expect(night.length).toBe(0);
  });

  it('굴림 — 갯바위 후보에는 산나물이 안 난다 · 밀도 덮어쓰기', () => {
    const rock: ForageCandidate[] = hill().map((c) => ({ ...c, kind: 'rock_shore' }));
    const sea = rollForageSpots(rock, { ...base, month: 5, regionId: 'gangwon_sokcho', eastSea: true });
    for (const s of sea) expect(greens.some((g) => g.id === s.creatureId)).toBe(false);
    const dense = rollForageSpots(hill(20), { ...base, month: 5, regionId: 'gangwon_sokcho', spotsPerHundred: 10, maxSpots: 100 });
    const sparse = rollForageSpots(hill(20), { ...base, month: 5, regionId: 'gangwon_sokcho', spotsPerHundred: 1, maxSpots: 100 });
    expect(dense.length).toBeGreaterThan(sparse.length);
  });

  it('특산 — 울릉에서 뜯은 명이 · 속초에서 뜯은 곰취는 특산', () => {
    expect(specialtyOf('crop_myeongi', 'ulleungdo')?.id).toBe('ulleung_myeongi');
    expect(specialtyOf('crop_gomchwi', 'gangwon_sokcho')?.id).toBe('sokcho_gomchwi');
    expect(specialtyOf('crop_gomchwi', 'busan')).toBeUndefined();
  });
});
