/**
 * @file Specialty295.test.ts
 * @description 295차 — 독도새우(통발 전용 · 울릉 바다만) · 지역 가공 · 지역 레시피 해금 · 특산 50 정합.
 */
import { describe, it, expect } from 'vitest';
import { getCreatureById } from '../db-schema/ShoreCreatureDatabase.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import { rollForageSpots } from '../simulation/ForagingEngine.js';
import { harvestTrap, type TrapDeploymentContext } from '../simulation/TrapSystem.js';
import type { DeployedTrap } from '../types/Activities.js';
import type { TideInfo } from '../types/Environment.js';
import { REGIONAL_SPECIALTIES, specialtySellMult, SPECIALTY_AWAY_MULT } from '../db-schema/RegionalSpecialty.js';
import { PROCESS_RECIPES, PROCESSED_ITEMS, processQuote, processRecipesOf } from './RegionalProcessing.js';
import { FIRE_RECIPES } from '../db-schema/FireRecipeDatabase.js';
import { STORY_QUESTS } from '../db-schema/StoryQuestDatabase.js';
import { RECIPE_LORE } from '../db-schema/RecipeLore.js';
import { FOOD_NUTRITION } from '../db-schema/FoodNutrition.js';

const tide = {
  tidePhase: 7, tidePhaseLabel: '7물', currentStrength: 0.5, highTideTimes: [], lowTideTimes: [],
  currentWaterLevelCm: 100, highTideHeightCm: 200, lowTideHeightCm: 20,
} as unknown as TideInfo;
const trapOf = (specId: string): DeployedTrap => ({
  instanceId: 't1', trapSpecId: specId, spotId: 's', tileX: 0, tileY: 0,
  deployedAt: new Date(Date.now() - 8 * 3600_000), nextCheckAt: new Date(), baitItemId: 'b', baitRemainingRatio: 1,
  catchInside: [], isLostOrDamaged: false,
} as unknown as DeployedTrap);
const ctx = (regionId: string): TrapDeploymentContext => ({ spotType: 'breakwater', depthM: 10, tide, month: 11, day: 10, regionId, currentStrength: 0.5 });
const caught = (specId: string, regionId: string, n = 120): Set<string> => {
  const out = new Set<string>();
  for (let i = 0; i < n; i++) for (const it of harvestTrap(trapOf(specId), ctx(regionId)).items) out.add(it.creatureId);
  return out;
};

describe('295 — 도화새우(독도새우)', () => {
  const shrimp = getCreatureById('pandalus_hypsinotus')!;
  it('통발 전용 · 새우 통발 · 울릉 바다', () => {
    expect(shrimp.trapOnly).toBe(true);
    expect(shrimp.trapTypes).toEqual(['shrimp_trap']);
    expect(shrimp.trapSeas).toEqual(['ulleung']);
    expect(shrimp.size?.axis).toBe('body_length');
  });
  it('해루질 자리에는 나오지 않는다', () => {
    const cands = Array.from({ length: 400 }, (_, i) => ({ tx: (i % 40) * 3, ty: Math.floor(i / 40) * 3, kind: 'armor_foot' as const, substrate: 'rock' as const }));
    for (let k = 0; k < 20; k++) {
      const spots = rollForageSpots(cands, { seed: k, month: 11, isNight: true, tideLevel01: 0.3, hasAdvancedLicense: true, farms: [], maxSpots: 400, eastSea: true });
      expect(spots.some((s) => s.creatureId === 'pandalus_hypsinotus')).toBe(false);
    }
  });
  it('독도 · 울릉의 새우 통발에만 든다(속초 · 게 통발 ✕)', () => {
    expect(caught('trap_shrimp_basic', 'dokdo').has('pandalus_hypsinotus')).toBe(true);
    expect(caught('trap_shrimp_basic', 'ulleungdo').has('pandalus_hypsinotus')).toBe(true);
    expect(caught('trap_shrimp_basic', 'gangwon_sokcho').has('pandalus_hypsinotus')).toBe(false);
    expect(caught('trap_crab_basic', 'dokdo').has('pandalus_hypsinotus')).toBe(false);
  });
});

describe('295 — 섬 어종 넷 · 특산 50 · 택배 차익', () => {
  it('어종 넷이 도감에 있다', () => {
    for (const id of ['pearl_spot_chromis', 'bulgyhead_wrasse', 'red_tilefish', 'bluefin_tuna']) expect(FISH_DATABASE.some((f) => f.id === id), id).toBe(true);
  });
  it('특산 50 · 가공품 특산 5 · 산지 밖 가게는 ×1.15', () => {
    expect(REGIONAL_SPECIALTIES.length).toBe(51);   // 299차 — 설악 곰취
    expect(REGIONAL_SPECIALTIES.filter((d) => d.kind === 'processed').length).toBe(5);
    expect(specialtySellMult('chub_mackerel', 'busan', 10, 'busan')).toBeCloseTo(1.3);
    expect(specialtySellMult('chub_mackerel', 'busan', 10, 'gangwon_sokcho')).toBeCloseTo(1.3 * SPECIALTY_AWAY_MULT);
    expect(specialtySellMult('chub_mackerel', 'busan', 10, undefined)).toBeCloseTo(1.3);
    expect(specialtySellMult('chub_mackerel', 'gangwon_sokcho', 10, 'busan')).toBe(1);
  });
});

describe('295 — 지역 가공대', () => {
  it('가공 5 · 지역마다 하나 · 출력 아이템 · 특산 열쇠가 실재한다', () => {
    expect(PROCESS_RECIPES.length).toBe(5);
    const ids = new Set(PROCESSED_ITEMS.map((d) => d.id));
    for (const r of PROCESS_RECIPES) {
      expect(ids.has(r.output.itemId), r.id).toBe(true);
      if (r.input.kind === 'species') expect(FISH_DATABASE.some((f) => f.id === (r.input as { speciesId: string }).speciesId), r.id).toBe(true);
      expect(REGIONAL_SPECIALTIES.some((d) => d.kind === 'processed' && d.keys.includes(r.output.itemId) && d.regionIds.some((x) => r.regionIds.includes(x))), r.id).toBe(true);
    }
    expect(processRecipesOf('gyeongbuk_pohang').map((r) => r.id)).toEqual(['gwamegi']);
    expect(processRecipesOf('incheon')).toEqual([]);
  });
  it('묶음 견적', () => {
    const r = PROCESS_RECIPES.find((x) => x.id === 'gwamegi')!;
    expect(processQuote(r, 2)).toEqual({ inputQty: 10, outputQty: 10, feeWon: 8000, waitMin: 240 });
    expect(processQuote(r, 0).inputQty).toBe(5);
  });
});

describe('295 — 지역 레시피', () => {
  const regional = FIRE_RECIPES.filter((r) => r.learn);
  it('넷 · 주재료 어종 고정 · 편 · 로어 · 영양 · 요리 사진(303)', () => {
    expect(regional.map((r) => r.id)).toEqual(['stew_cod_geoje', 'grill_tilefish_jeju', 'braise_saury_guryongpo', 'stew_hamo_yeosu']);
    for (const r of regional) {
      expect(r.mainSpecies?.length, r.id).toBeGreaterThan(0);
      for (const sp of r.mainSpecies ?? []) expect(FISH_DATABASE.some((f) => f.id === sp), sp).toBe(true);
      const q = STORY_QUESTS.find((x) => x.id === r.learn!.questId)!;
      expect(q, r.id).toBeDefined();
      expect(q.unlocks).toContain(`recipe:${r.id}`);
      expect(RECIPE_LORE[r.id], r.id).toBeDefined();
      expect(FOOD_NUTRITION[r.id], r.id).toBeDefined();
      expect(r.photoKey, r.id).toBe(`food_${r.id}`);   // 303차 — 레시피마다 제 사진(같은 계열 기본 요리 사진을 빌리지 않는다)
    }
  });
  it('기존 열 가지는 learn이 없다(처음부터 안다)', () => {
    expect(FIRE_RECIPES.filter((r) => !r.learn).length).toBe(FIRE_RECIPES.length - 4);
  });
});
