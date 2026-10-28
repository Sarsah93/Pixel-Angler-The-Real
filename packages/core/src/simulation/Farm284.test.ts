/**
 * @file Farm284.test.ts
 * @description 284차 — 작물 부산물(무청 · 배추 겉잎 · 토란대 · 깻순 · 깻대 · 콩대 · 보릿짚 · 옥수숫대 · 검불 · 폐배지) ·
 *   무게(g) 낱알과 봉지 · 옛 단위 이전 · 방앗간(기름 180/350ml · 들깨 갈기 · 참깨 볶기 · 깻묵) · 나물 볶음 · 생선조림 묵은 나물
 */
import { describe, expect, it } from 'vitest';
import { newFarmPlot, plantCell, harvestCell, advanceCell, startFieldProcess, finishFieldProcess, rollByproducts, producePriceBase } from './FarmSim.js';
import { doCare } from './CropCareSim.js';
import { createCookSession, canAddIngredient, addIngredient, checkComposition } from './CookingSim.js';
import {
  CROP_DATABASE, getCrop, bagsOfLoose, looseOfBag, isProduceBag, produceUnitG, legacyUnitGrams, byproductOf, FARM_SUPPLIES, FARM_BAG_CONTAINER,
  cropOfProduce,
} from '../db-schema/CropDatabase.js';
import { FARM_RESIDUES, farmResidueDef, mulchResidues } from '../db-schema/FarmResidues.js';
import { carePlanOf, PERILLA_SHOOT_ID, BARLEY_STRAW_ID } from '../db-schema/CropCareDatabase.js';
import { rawEatStatus, CROP_NO_RAW, CROP_RAW_EAT } from '../db-schema/CropRawEatDatabase.js';
import { getCookIngredient } from '../db-schema/CookIngredientDatabase.js';
import { getFireRecipe } from '../db-schema/FireRecipeDatabase.js';
import { getCookware } from '../db-schema/CookwareDatabase.js';
import { FOOD_NUTRITION, restoreFromNutrition } from '../db-schema/FoodNutrition.js';
import { recipeEffectOf } from '../db-schema/FoodEffects.js';
import { RECIPE_LORE } from '../db-schema/RecipeLore.js';
import { isVariantRecipe } from '../db-schema/DishDiscovery.js';
import {
  OIL_BOTTLES, OIL_BOTTLE_SIZES, MILL_SERVICES, MILL_TUNING, oilBottleDef, oilQuote, grindQuote, maxBottles, OILCAKE_ID,
} from '../rules/OilMill.js';
import type { FarmEnv, FarmPlotState } from '../types/Farming.js';

const DAY = 86_400_000;
const H = 3_600_000;
const kst = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d) - 9 * H;
const neverRain: FarmEnv = { rainAt: () => false };
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

/** 베어 말린 뒤 털 수 있는 칸 하나 */
function dried(cropId: string, plantAt: number, cutAt: number): FarmPlotState {
  const plot = planted(cropId, 'seed', plantAt);
  const c = plot.cells[0];
  c.growth = 1; c.lastMs = cutAt; c.stand = 1;
  expect(startFieldProcess(c, cutAt)).toBe(true);
  advanceCell(plot, 0, cutAt + 12 * DAY, neverRain);
  expect(c.process?.dryAt).toBeDefined();
  return plot;
}

describe('284차 — 무게(g)로 세는 낱알 · 봉지', () => {
  const GRAIN = ['deulkkae', 'chamkkae', 'soybean', 'barley'];

  it('깨 · 콩 · 보리 넷은 가방 수량이 g이다 · 칸당 g은 수확지수 조사 범위 안이다', () => {
    for (const id of GRAIN) {
      const c = getCrop(id)!;
      expect(c.harvest.unitG, id).toBe(1);
      expect(produceUnitG(c.harvest.itemId), id).toBe(1);
      expect(produceUnitG(`${c.harvest.itemId}_sp`), id).toBe(1);
    }
    expect(getCrop('deulkkae')!.harvest.qtyPerCell).toEqual([80, 120]);
    expect(getCrop('chamkkae')!.harvest.qtyPerCell).toEqual([40, 60]);
    expect(getCrop('soybean')!.harvest.qtyPerCell).toEqual([180, 250]);
    expect(getCrop('barley')!.harvest.qtyPerCell).toEqual([400, 500]);
    // 낱개 작물은 g이 아니다
    expect(produceUnitG('crop_radish')).toBeNull();
  });

  it('봉지 크기 — 참깨 300 · 500g · 들깨 · 콩 500g · 1kg · 보리 1kg', () => {
    const sizes = (id: string): number[] => bagsOfLoose(getCrop(id)!.harvest.itemId).map((b) => b.bag.grams);
    expect(sizes('chamkkae')).toEqual([300, 500]);
    expect(sizes('deulkkae')).toEqual([500, 1000]);
    expect(sizes('soybean')).toEqual([500, 1000]);
    expect(sizes('barley')).toEqual([1000]);
    expect(bagsOfLoose('crop_radish')).toEqual([]);
  });

  it('봉지 ↔ 낱알 왕복 · 등급 꼬리는 봉지에도 붙는다 · 봉지도 그 작물의 수확물이다', () => {
    const [b500] = bagsOfLoose('crop_deulkkae_sp');
    expect(b500.bagItemId).toBe('crop_deulkkae_b500_sp');
    expect(isProduceBag(b500.bagItemId)).toBe(true);
    const back = looseOfBag(b500.bagItemId)!;
    expect(back.looseItemId).toBe('crop_deulkkae_sp');
    expect(back.grams).toBe(500);
    expect(back.grade).toBe('special');
    expect(cropOfProduce(b500.bagItemId)?.id).toBe('deulkkae');
    expect(isProduceBag('crop_deulkkae')).toBe(false);
  });

  it('봉지 값 = g 기준가 × g(제값) — 들깨 1kg 18,000원 · 참깨 500g 18,000원 · 보리 1kg 3,000원', () => {
    const p = (crop: string, bag: string): number => producePriceBase(getCrop(crop)!, bag);
    expect(p('deulkkae', 'crop_deulkkae_b1000')).toBe(18000);
    expect(p('chamkkae', 'crop_chamkkae_b500')).toBe(18000);
    expect(p('barley', 'crop_barley_b1000')).toBe(3000);
    expect(p('soybean', 'crop_soybean_b500')).toBe(4000);
  });

  it('봉지 용기는 생활용품점 농자재에 있다', () => {
    const s = FARM_SUPPLIES.find((x) => x.itemId === FARM_BAG_CONTAINER);
    expect(s).toBeDefined();
    expect(s!.price).toBeGreaterThan(0);
  });

  it('옛 세이브 — 이름에 옛 단위가 남은 칸만 g으로 바꾼다(들깨 100g · 참깨 50g · 콩 200g · 보리 500g)', () => {
    expect(legacyUnitGrams('crop_deulkkae', '들깨 (100g)')).toBe(100);
    expect(legacyUnitGrams('crop_deulkkae_sp', '들깨 (100g)')).toBe(100);
    expect(legacyUnitGrams('crop_chamkkae', '참깨 (50g)')).toBe(50);
    expect(legacyUnitGrams('crop_soybean', '콩 (백태) 200g')).toBe(200);
    expect(legacyUnitGrams('crop_barley', '보리 낟알 500g')).toBe(500);
    // 이미 새 이름이면 그대로 · 다른 작물은 무관
    expect(legacyUnitGrams('crop_deulkkae', '들깨')).toBeNull();
    expect(legacyUnitGrams('crop_deulkkae', undefined)).toBeNull();
    expect(legacyUnitGrams('crop_radish', '무 (1개 · 약 1.2kg)')).toBeNull();
  });

  it('봉지는 뜯어야 먹는다(낱알은 날로 못 먹는다)', () => {
    const st = rawEatStatus('crop_soybean_b500');
    expect(st?.kind).toBe('pack');
    if (st?.kind === 'pack') { expect(st.units).toBe(500); expect(st.edible).toBe(false); }
  });
});

describe('284차 — 부산물 표', () => {
  it('부산물이 있는 작물 — 먹는 것 넷 · 밭에 넣는 것 일곱', () => {
    const food = new Set<string>(); const res = new Set<string>();
    for (const c of CROP_DATABASE) for (const b of c.byproducts ?? []) (b.kind === 'food' ? food : res).add(b.itemId);
    expect([...food].sort()).toEqual(['crop_cabbage_outer', 'crop_perilla_shoot', 'crop_radish_greens', 'crop_taro_stem']);
    expect([...res].sort()).toEqual(['res_barley_straw', 'res_bean_stalk', 'res_chaff', 'res_corn_stalk', 'res_sesame_stalk', 'res_spent_substrate'].sort());
  });

  it('먹는 부산물은 요리 재료 · 값 · 날로 안 먹는 까닭이 있다', () => {
    for (const c of CROP_DATABASE) for (const b of c.byproducts ?? []) {
      if (b.kind !== 'food') continue;
      expect(getCookIngredient(b.cookIngredient!), b.itemId).toBeDefined();
      expect(b.price, b.itemId).toBeGreaterThan(0);
      expect(producePriceBase(c, b.itemId), b.itemId).toBe(b.price);
      expect(CROP_NO_RAW[b.itemId] ?? CROP_RAW_EAT[b.itemId], b.itemId).toBeDefined();
      expect(byproductOf(b.itemId)?.def.itemId).toBe(b.itemId);
      expect(cropOfProduce(b.itemId), b.itemId).toBeDefined();
    }
  });

  it('밭 부산물은 전부 「밭에 넣기」 g이 있다 · 보릿짚만 짚 덮기도 된다', () => {
    for (const r of FARM_RESIDUES) expect(r.soilPerCell, r.itemId).toBeGreaterThan(0);
    expect(mulchResidues().map((r) => r.itemId)).toEqual([BARLEY_STRAW_ID]);
    expect(farmResidueDef(OILCAKE_ID)?.soilPerCell).toBe(200);
    expect(farmResidueDef('crop_radish')).toBeUndefined();
  });

  it('무를 거두면 무 한 개에 무청 한 묶음 · 칸이 비어도 섬을 쓴다', () => {
    const plot = planted('radish', 'seed', kst(2026, 8, 20));
    const c = plot.cells[0]; c.growth = 1; c.stand = 1;
    const r = harvestCell(c, half)!;
    expect(r.byproducts).toEqual([{ itemId: 'crop_radish_greens', qty: r.qty }]);
  });

  it('버섯 폐배지는 마지막으로 거둘 때만 나온다', () => {
    const plot = newFarmPlot('indoor', kst(2026, 5, 1));
    const c = plot.cells[0];
    const crop = getCrop('oyster_mushroom')!;
    plantCell(c, crop, crop.starts[0], kst(2026, 5, 1), half, ctx);
    c.growth = 1; c.stand = 1;
    const first = harvestCell(c, half)!;
    expect(first.more).toBe(true);
    expect(first.byproducts ?? []).toEqual([]);
    c.regrow = 1;
    const last = harvestCell(c, half)!;
    expect(last.more).toBe(false);
    const sub = last.byproducts?.find((b) => b.itemId === 'res_spent_substrate');
    expect(sub?.qty).toBeGreaterThanOrEqual(1000);
    expect(sub?.qty).toBeLessThanOrEqual(1300);
  });

  it('깨를 털면 깻대 · 키질하면 검불 — 키 없이 털면 검불은 없다(알에 섞여 품질이 깎인다)', () => {
    const a = dried('deulkkae', kst(2026, 6, 10), kst(2026, 10, 5)).cells[0];
    const ra = finishFieldProcess(a, half, {}, { winnowed: true }, a.process!.dryAt! + DAY)!;
    const stalk = ra.byproducts?.find((b) => b.itemId === 'res_sesame_stalk');
    expect(stalk?.qty).toBeGreaterThanOrEqual(300);
    expect(stalk?.qty).toBeLessThanOrEqual(550);
    const chaff = ra.byproducts?.find((b) => b.itemId === 'res_chaff');
    expect(chaff?.qty).toBeCloseTo(ra.qty * 0.3, -1);
    const b = dried('deulkkae', kst(2026, 6, 10), kst(2026, 10, 5)).cells[0];
    const rb = finishFieldProcess(b, half, {}, { winnowed: false }, b.process!.dryAt! + DAY)!;
    expect(rb.byproducts?.some((x) => x.itemId === 'res_chaff')).toBe(false);
    expect(rb.byproducts?.some((x) => x.itemId === 'res_sesame_stalk')).toBe(true);
  });

  it('콩대 · 보릿짚 — 털 때 나온다(콩 160~330g · 보리 420~600g)', () => {
    const s = dried('soybean', kst(2026, 6, 1), kst(2026, 10, 10)).cells[0];
    const rs = finishFieldProcess(s, half, {}, { winnowed: true }, s.process!.dryAt! + DAY)!;
    const bean = rs.byproducts?.find((x) => x.itemId === 'res_bean_stalk')!;
    expect(bean.qty).toBeGreaterThanOrEqual(160);
    expect(bean.qty).toBeLessThanOrEqual(330);
    const crop = getCrop('barley')!;
    const straw = rollByproducts(crop, 1, 450, 'process', half, { winnowed: true });
    const st = straw.find((x) => x.itemId === BARLEY_STRAW_ID)!;
    expect(st.qty).toBeGreaterThanOrEqual(420);
    expect(st.qty).toBeLessThanOrEqual(600);
  });

  it('기대값이 맞는다 — 남는 몫은 그 확률로 하나 더(무청 perUnit 1 · 토란대 perCell 0.6~1.2)', () => {
    const taro = getCrop('taro')!;
    let sum = 0; let n = 0; let seed = 1;
    const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 4000; i++) {
      const out = rollByproducts(taro, 1, 10, 'harvest', rnd);
      sum += out.find((x) => x.itemId === 'crop_taro_stem')?.qty ?? 0; n += 1;
    }
    expect(sum / n).toBeCloseTo(0.9, 1);
  });

  it('깻잎 · 들깨 순지르기에서 깻순이 나온다', () => {
    for (const id of ['perilla', 'deulkkae']) {
      const t = carePlanOf(getCrop(id)!).tasks.find((x) => x.yields);
      expect(t?.yields?.itemId, id).toBe(PERILLA_SHOOT_ID);
    }
  });

  it('순지르기를 하면 깻순을 손에 쥔다(깻잎 모종 · 30~45일)', () => {
    const t0 = kst(2026, 5, 10);
    const plot = planted('perilla', 'seedling', t0);
    const c = plot.cells[0];
    const crop = getCrop('perilla')!;
    const task = carePlanOf(crop).tasks.find((x) => x.yields)!;
    let got: { itemId: string; qty: number } | undefined;
    for (let d = 20; d <= 60 && !got; d++) {
      const r = doCare(c, crop, task.id, t0 + d * DAY, 1, () => 0.99);
      if (r.ok) got = r.yields;
    }
    expect(got?.itemId).toBe(PERILLA_SHOOT_ID);
    expect(got!.qty).toBeGreaterThanOrEqual(1);
  });
});

describe('284차 — 방앗간', () => {
  it('병은 180 · 350ml 두 가지 · 따면 1큰술(15ml)씩', () => {
    expect([...OIL_BOTTLE_SIZES]).toEqual([180, 350]);
    expect(OIL_BOTTLES.map((b) => b.itemId).sort()).toEqual(['oil_perilla_180', 'oil_perilla_350', 'oil_sesame_180', 'oil_sesame_350']);
    expect(oilBottleDef('oil_sesame_350')?.spoons).toBe(23);
    expect(oilBottleDef('oil_perilla_180')?.spoons).toBe(12);
    for (const b of OIL_BOTTLES) expect(getCookIngredient(b.spoonItemId.replace(/^cook_/, ''))).toBeDefined();
  });

  it('참기름 350ml = 볶은 참깨 850g · 180ml = 440g · 깻묵은 깨 − 볶음 손실 − 기름', () => {
    const q = oilQuote('sesame_oil', { 350: 1 })!;
    expect(q.seedG).toBe(850);
    expect(q.oilMl).toBe(350);
    const cake = q.outputs.find((o) => o.itemId === OILCAKE_ID)!;
    expect(cake.qty).toBe(Math.round(850 * (1 - MILL_TUNING.roastLoss) - 350 * MILL_TUNING.oilDensity));
    expect(q.outputs.find((o) => o.itemId === 'oil_sesame_350')?.qty).toBe(1);
    // 공임 = kg당 4,000원(100원 단위) + 병값 600원 · 바닥 1,000원
    expect(q.feeWon).toBe(3400 + 600);
    const s = oilQuote('sesame_oil', { 180: 1 })!;
    expect(s.seedG).toBe(440);
    expect(s.feeWon).toBe(1800 + 400);
  });

  it('들기름 350ml = 950g · 두 크기를 함께 맡길 수 있다', () => {
    const q = oilQuote('perilla_oil', { 350: 2, 180: 1 })!;
    expect(q.seedG).toBe(950 * 2 + 490);
    expect(q.oilMl).toBe(880);
    expect(q.outputs.map((o) => o.itemId)).toEqual(['oil_perilla_180', 'oil_perilla_350', OILCAKE_ID]);
    expect(oilQuote('perilla_oil', {})).toBeNull();
    expect(oilQuote('perilla_powder', { 350: 1 })).toBeNull();
  });

  it('가진 깨로 짤 수 있는 병 수', () => {
    expect(maxBottles('sesame_oil', 350, 1800)).toBe(2);
    expect(maxBottles('perilla_oil', 180, 489)).toBe(0);
    expect(maxBottles('perilla_oil', 180, 490)).toBe(1);
  });

  it('들깨 갈기 · 참깨 볶기 — 100g 단위 · 큰술로 나온다', () => {
    const g = grindQuote('perilla_powder', 550)!;
    expect(g.seedG).toBe(500);
    expect(g.outputs).toEqual([{ itemId: 'cook_perilla_powder', qty: Math.floor((500 * 0.95) / 7) }]);
    expect(g.feeWon).toBe(1500);
    const s = grindQuote('sesame_salt', 100)!;
    expect(s.outputs[0].itemId).toBe('cook_sesame_salt');
    expect(s.feeWon).toBe(MILL_TUNING.minFee);
    expect(grindQuote('perilla_powder', 90)).toBeNull();
  });

  it('맡기는 낱알은 무게 수확물이다', () => {
    for (const s of MILL_SERVICES) expect(produceUnitG(s.seedItemId), s.id).toBe(1);
  });

  it('병 값 — 깨를 봉지로 파는 것보다 조금 더 받는다(공임 몫)', () => {
    const sesameBagPerG = producePriceBase(getCrop('chamkkae')!, 'crop_chamkkae_b500') / 500;
    const perillaBagPerG = producePriceBase(getCrop('deulkkae')!, 'crop_deulkkae_b1000') / 1000;
    expect(oilBottleDef('oil_sesame_350')!.value).toBeGreaterThan(sesameBagPerG * 850);
    expect(oilBottleDef('oil_perilla_350')!.value).toBeGreaterThan(perillaBagPerG * 950);
  });
});

describe('284차 — 나물 볶음 · 생선조림 묵은 나물', () => {
  const pan = getCookware('pan')!;
  const pot = getCookware('pot_home')!;

  it('나물 볶음은 팬 요리 · 이름이 갈리지 않는다 · 영양 · 효과 · 설명이 있다', () => {
    const r = getFireRecipe('stirfry_namul')!;
    expect(r.cookware).toEqual(['pan']);
    expect(isVariantRecipe('stirfry_namul')).toBe(false);
    const n = FOOD_NUTRITION.stirfry_namul;
    expect(restoreFromNutrition(n)).toEqual({ hungerRestore: r.vitals.hungerRestore, hydrationRestore: r.vitals.hydrationRestore });
    expect(recipeEffectOf('stirfry_namul')).toBeDefined();
    expect(RECIPE_LORE.stirfry_namul.shortDescriptionKo.length).toBeGreaterThan(5);
  });

  it('주재료는 나물 하나(시래기 · 우거지 · 고구마줄기 · 토란대 · 깻순 나물) · 기름은 들기름 · 참기름 · 식용유 중 하나', () => {
    const r = getFireRecipe('stirfry_namul')!;
    const s = createCookSession('stirfry_namul', 'pan');
    for (const ing of ['siraegi', 'ugeoji', 'sweetpotato_stem', 'taro_stem', 'namul', 'perilla_oil', 'perilla_powder', 'sesame_salt']) {
      expect(canAddIngredient(s, r, pan, ing, 1).ok, ing).toBe(true);
    }
    expect(canAddIngredient(s, r, pan, 'fish', 300).ok).toBe(false);
    addIngredient(s, 'siraegi', 1, 1);
    addIngredient(s, 'perilla_oil', 1, 1);
    addIngredient(s, 'garlic', 0.5, 1);
    addIngredient(s, 'soy', 0.5, 1);
    expect(checkComposition(s, r, pan).missing).toEqual([]);
    expect(canAddIngredient(s, r, pan, 'siraegi', 2).ok).toBe(false);   // 두 묶음까지
  });

  it('생선조림 바닥에 시래기 · 우거지 · 고구마줄기를 깔 수 있다(하나만)', () => {
    const r = getFireRecipe('braise_fish')!;
    const s = createCookSession('braise_fish', 'pot_home');
    for (const ing of ['siraegi', 'ugeoji', 'sweetpotato_stem']) expect(canAddIngredient(s, r, pot, ing, 1).ok, ing).toBe(true);
    addIngredient(s, 'siraegi', 1, 1);
    addIngredient(s, 'ugeoji', 1, 1);
    expect(checkComposition(s, r, pot).oneOfViolations).toBe(1);
  });

  it('고구마줄기 · 고춧잎 · 마늘종 · 산나물은 요리 재료가 된다', () => {
    const interimIng = (cropId: string): string | undefined => getCrop(cropId)?.interim?.cookIngredient;
    expect(interimIng('sweet_potato')).toBe('sweetpotato_stem');
    for (const id of ['gondre', 'samnamul', 'bujigaengi', 'eosuri', 'gomchwi', 'bangpung']) {
      const c = getCrop(id);
      expect(c, id).toBeDefined();
      expect(c!.interim?.cookIngredient ?? c!.cookIngredient, id).toBe('namul');
    }
  });
});
