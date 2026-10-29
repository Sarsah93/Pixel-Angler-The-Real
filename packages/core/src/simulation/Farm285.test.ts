/**
 * @file Farm285.test.ts
 * @description 285차 — 생기름 · 압맥(방앗간) · 갈무리(건조 걸대 · 장독) · 옥수수수염 · 단풍콩잎 · 받은 씨앗 · 딸기 런너 · 나물 볶음 이름
 */
import { describe, expect, it } from 'vitest';
import {
  newFarmPlot, plantCell, harvestCell, divideBlockKo, divideCell, seedSaveBlockKo, saveSeedsCell, seedPacketsFromGrain, applySavedSeed,
  SAVED_SEED_TUNING,
} from './FarmSim.js';
import { createDishInstance } from './DishFactory.js';
import { CROP_DATABASE, getCrop, cropStartOfItem, savedSeedItemId, isSavedSeedId, FARM_SUPPLIES, byproductOf } from '../db-schema/CropDatabase.js';
import { CROP_NO_RAW } from '../db-schema/CropRawEatDatabase.js';
import { cultivationOf, propagateLineKo } from '../db-schema/CropCultivationDatabase.js';
import { getFireRecipe } from '../db-schema/FireRecipeDatabase.js';
import { dishVariantCandidates, dishVariantKind, allDishVariantLines } from '../db-schema/DishDiscovery.js';
import { namulVariantOf, parseNamulVariant, NAMUL_VEG } from '../db-schema/NamulDishes.js';
import { oilQuote, grindQuote, millService, MILL_TUNING, OILCAKE_ID, oilBottleDef, millStepG } from '../rules/OilMill.js';
import { CURE_RECIPES, cureRecipesAt, cureReadyAt, cureLeftKo, CURE_STATION_FACILITY } from '../rules/HomeCure.js';
import type { DishData, FarmPlotState } from '../types/Farming.js';

const H = 3_600_000;
const kst = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d) - 9 * H;
const half = (): number => 0.5;
const ctx = { hasSkill: () => true, hasTray: true };

function planted(cropId: string, kind: 'seed' | 'seedling' | 'set', atMs: number): FarmPlotState {
  const plot = newFarmPlot('plot', atMs);
  const cell = plot.cells[0];
  cell.tilled = true;
  const crop = getCrop(cropId)!;
  plantCell(cell, crop, crop.starts.find((s) => s.kind === kind)!, atMs, half, ctx);
  return plot;
}

describe('285차 — 생기름(볶지 않고 저온 압착)', () => {
  it('생참기름 350ml = 참깨 1kg · 볶음 손실 없이 깻묵 · 공임 kg당 5,000원 + 병값 · 90분', () => {
    const q = oilQuote('sesame_oil_raw', { 350: 1 })!;
    expect(q.seedG).toBe(1000);
    expect(q.outputs.find((o) => o.itemId === 'oil_sesame_raw_350')?.qty).toBe(1);
    expect(q.outputs.find((o) => o.itemId === OILCAKE_ID)?.qty).toBe(Math.round(1000 - 350 * MILL_TUNING.oilDensity));
    expect(q.feeWon).toBe(5000 + 600);
    expect(q.waitMin).toBe(90);
  });
  it('생기름은 볶은 기름보다 깨가 더 들고 값이 더 높다 · 따면 같은 1큰술', () => {
    for (const oil of ['sesame', 'perilla'] as const) for (const ml of [180, 350] as const) {
      const raw = oilBottleDef(`oil_${oil}_raw_${ml}`)!, roast = oilBottleDef(`oil_${oil}_${ml}`)!;
      expect(raw.raw).toBe(true);
      expect(raw.value).toBeGreaterThan(roast.value);
      expect(raw.spoonItemId).toBe(roast.spoonItemId);
      expect(raw.nameKo.startsWith('생')).toBe(true);
    }
    expect(oilQuote('perilla_oil_raw', { 350: 1 })!.seedG).toBeGreaterThan(oilQuote('perilla_oil', { 350: 1 })!.seedG);
  });
});

describe('285차 — 압맥(보리 누르기)', () => {
  it('보리 1kg 단위 · 1kg에 밑밥용 압맥 한 봉 · 공임 1,500원 · 30분 · 1kg 못 미치면 못 맡긴다', () => {
    const s = millService('barley_press')!;
    expect(millStepG(s)).toBe(1000);
    const q = grindQuote('barley_press', 2400)!;
    expect(q.seedG).toBe(2000);
    expect(q.outputs).toEqual([{ itemId: 'inv_chum_apmac', qty: 2 }]);
    expect(q.feeWon).toBe(3000);
    expect(q.waitMin).toBe(30);
    expect(grindQuote('barley_press', 999)).toBeNull();
    // 기존 갈기는 그대로 100g 단위
    expect(millStepG(millService('perilla_powder')!)).toBe(100);
  });
});

describe('285차 — 갈무리(건조 걸대 · 장독)', () => {
  it('다섯 가지 — 걸대 셋(시래기 둘 · 옥수수수염차) · 장독 둘(깻잎 · 콩잎 장아찌)', () => {
    expect(CURE_RECIPES.map((r) => r.id)).toEqual(['siraegi_hang', 'siraegi_blanch', 'corn_silk_tea', 'pickle_perilla', 'pickle_bean_leaf']);
    expect(cureRecipesAt('rack').length).toBe(3);
    expect(cureRecipesAt('crock').length).toBe(2);
    expect(CURE_STATION_FACILITY).toEqual({ rack: 'dryingRack', crock: 'crock' });
    // 데쳐 말리면 더 빨리 마른다 · 콩잎은 가장 오래 삭힌다
    const h = Object.fromEntries(CURE_RECIPES.map((r) => [r.id, r.hours]));
    expect(h.siraegi_blanch).toBeLessThan(h.siraegi_hang);
    expect(Math.max(...Object.values(h))).toBe(h.pickle_bean_leaf);
  });
  it('설비 둘은 텃밭에 놓는 생활용품점 물건이다', () => {
    for (const f of ['dryingRack', 'crock'] as const) {
      const s = FARM_SUPPLIES.find((x) => x.facility === f)!;
      expect(s.site).toBe('plot');
      expect(s.shop).toBe('daily');
    }
  });
  it('다 되는 시각 · 남은 시간 글', () => {
    const r = CURE_RECIPES[0];
    const t0 = kst(2026, 11, 1);
    const at = cureReadyAt(t0, r);
    expect(at - t0).toBe(6 * 24 * H);
    expect(cureLeftKo(at, t0)).toBe('6일');
    expect(cureLeftKo(at, at - 26 * H)).toBe('1일 2시간');
    expect(cureLeftKo(at, at)).toBe('다 됐다');
  });
});

describe('285차 — 옥수수수염 · 단풍콩잎', () => {
  it('옥수수를 거두면 자루마다 수염 15g', () => {
    const plot = planted('corn', 'seed', kst(2026, 5, 1));
    const c = plot.cells[0]; c.growth = 1; c.stand = 1;
    const r = harvestCell(c, half)!;
    const silk = r.byproducts?.find((b) => b.itemId === 'crop_corn_silk');
    expect(silk?.qty).toBe(r.qty * 15);
  });
  it('둘 다 날로 먹지 않는다 · 부산물 표에 있다', () => {
    for (const id of ['crop_corn_silk', 'crop_bean_leaf']) {
      expect(CROP_NO_RAW[id], id).toBeDefined();
      expect(byproductOf(id)?.def.itemId).toBe(id);
    }
  });
});

describe('285차 — 받은 씨앗 다시 심기', () => {
  it('상추가 다 익으면 씨를 받는다 — 칸은 끝나고 받은 씨앗이 나온다 · 덜 익으면 못 받는다', () => {
    const plot = planted('lettuce', 'seed', kst(2026, 4, 1));
    const c = plot.cells[0];
    c.growth = 0.6;
    expect(seedSaveBlockKo(c, getCrop('lettuce')!)).toBe('다 익어야 씨가 여문다');
    c.growth = 1; c.stand = 1;
    const r = saveSeedsCell(c, getCrop('lettuce')!, half)!;
    expect(r.itemId).toBe('seed_lettuce_saved');
    expect(r.qty).toBeGreaterThanOrEqual(2);
    expect(r.qty).toBeLessThanOrEqual(3);
    expect(c.cropId).toBeNull();
  });
  it('받은 씨앗은 그 작물 씨앗처럼 심는다 · 덜 고르다 · 교잡종이면 수확 ×0.85', () => {
    expect(isSavedSeedId('seed_chili_saved')).toBe(true);
    expect(cropStartOfItem('seed_chili_saved')?.crop.id).toBe('chili');
    expect(savedSeedItemId(getCrop('lettuce')!)).toBe('seed_lettuce_saved');
    const plot = planted('chili', 'seed', kst(2026, 3, 1));
    const c = plot.cells[0];
    const stand = c.stand;
    applySavedSeed(c, getCrop('chili')!);
    expect(c.savedSeed).toBe(true);
    expect(c.stand).toBeCloseTo(Math.max(0.2, stand * SAVED_SEED_TUNING.standMult));
    expect(c.careYield).toBeCloseTo(SAVED_SEED_TUNING.hybridYield);
    const p2 = planted('lettuce', 'seed', kst(2026, 4, 1));
    applySavedSeed(p2.cells[0], getCrop('lettuce')!);
    expect(p2.cells[0].careYield).toBe(1);
  });
  it('콩 · 깨 · 보리는 털어 낸 낱알에서 덜어 둔다(1칸 분 g)', () => {
    expect(seedPacketsFromGrain(getCrop('soybean')!, 20)).toBe(3);
    expect(seedPacketsFromGrain(getCrop('barley')!, 40)).toBe(2);
    expect(seedSaveBlockKo(planted('soybean', 'seed', kst(2026, 5, 20)).cells[0], getCrop('soybean')!)).toContain('씨앗으로 덜기');
    // 씨를 받는 작물은 모두 씨앗 심기가 있다
    for (const c of CROP_DATABASE) if (c.seedSave) expect(c.starts.some((s) => s.kind === 'seed'), c.id).toBe(true);
  });
});

describe('285차 — 딸기 런너', () => {
  it('열매를 딴 어미 포기는 여름에 런너 새끼 포기를 준다 · 안 딴 포기 · 철 밖은 안 된다', () => {
    const crop = getCrop('strawberry')!;
    expect(cultivationOf(crop).propagate?.by).toBe('runner');
    expect(propagateLineKo(crop)).toContain('런너 받기');
    const plot = planted('strawberry', 'seedling', kst(2025, 10, 1));
    const c = plot.cells[0];
    expect(divideBlockKo(c, crop, kst(2026, 7, 10))).toBe('열매를 한 번 딴 어미 포기라야 런너를 뻗는다');
    c.picks = 2;
    expect(divideBlockKo(c, crop, kst(2026, 5, 10))).toContain('나눈다');
    const r = divideCell(c, crop, kst(2026, 7, 10), half)!;
    expect(r.itemId).toBe('sdl_strawberry');
    expect(r.qty).toBeGreaterThanOrEqual(2);
    expect(r.qty).toBeLessThanOrEqual(4);
  });
});

describe('285차 — 나물 볶음 주재료별 이름', () => {
  const AT = Date.UTC(2026, 9, 15, 3);
  const dish = (): DishData => ({
    recipeId: 'stirfry_namul', cookedAtMs: AT, tempAtDoneC: 60,
    base: { season: 0.9, temp: 0.9, texture: 0.9, fresh: 0.9, finish: 0.9 },
    saltLabel: 'ok', sugarLabel: 'ok', contents: [], stoveKind: 'home', cookwareId: 'pan', burnt: false, servings: 2, skillRank: 0, missingRequired: 0,
  } as unknown as DishData);
  const make = (variant: string | null) => createDishInstance(getFireRecipe('stirfry_namul')!, dish(),
    { speciesId: variant, nameKo: null, nameEn: null, weightG: 400, freshness01: 0.65 }, 3);

  it('넣은 것으로 고른다 — 토란대 + 들깨가루 = 「토란대 들깨볶음」 · 곰취(나물) = 「곰취나물 볶음」', () => {
    expect(namulVariantOf([{ ing: 'taro_stem', units: 1 }, { ing: 'perilla_powder', units: 2 }])).toBe('veg_taro_stem_perilla');
    expect(namulVariantOf([{ ing: 'namul', units: 1, srcItemId: 'crop_gomchwi_sp' }])).toBe('veg_gomchwi');
    expect(namulVariantOf([{ ing: 'siraegi', units: 1 }, { ing: 'namul', units: 2, srcItemId: 'crop_garlic_scape' }])).toBe('veg_garlic_scape');
    expect(namulVariantOf([{ ing: 'namul', units: 1, srcItemId: 'crop_unknown' }])).toBeNull();
    expect(make('veg_taro_stem_perilla').result.nameKo).toBe('토란대 들깨볶음');
    expect(make('veg_gomchwi').result.nameKo).toBe('곰취나물 볶음');
    expect(make('veg_siraegi').result.nameKo).toBe('시래기 볶음');
    expect(make(null).result.nameKo).toBe('나물 볶음');
  });
  it('들깨볶음은 효과가 조금 크다 · 도감 후보 = 나물 13 × 2 · 영어 이름이 있다', () => {
    const plain = make('veg_taro_stem').result.effects[0];
    const per = make('veg_taro_stem_perilla').result.effects[0];
    expect(per.magnitude).toBeGreaterThan(plain.magnitude);
    expect(dishVariantKind('stirfry_namul')).toBe('veg');
    expect(dishVariantCandidates('stirfry_namul').length).toBe(NAMUL_VEG.length * 2);
    expect(parseNamulVariant('veg_ugeoji_perilla')?.perilla).toBe(true);
    const lines = new Map(allDishVariantLines());
    expect(lines.get('토란대 들깨볶음')).toBe('Taro stems with perilla seed');
    expect(lines.get('시래기 볶음')).toBe('Stir-fried siraegi');
  });
});
