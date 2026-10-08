/**
 * @file FarmSim.test.ts
 * @description 235차 — 텃밭 성장 · 수확 · 시세 · 별점 상한 시험(실제 시간 · 실제 계절 · 시설 상한 · 시들 뿐 죽지 않는다)
 */
import { describe, expect, it } from 'vitest';
import {
  newFarmPlot, plantCell, advanceCell, harvestCell, interimHarvestCell, interimOpen, cellReady, canPlant, speedMultOf,
  producePrice, cropDailyValue, climateRainAt, kstMonthOf, waterCell, compostCell, gradeOf, FARM_TUNING,
} from './FarmSim.js';
import {
  CROP_DATABASE, getCrop, produceItemId, parseProduceId, cropOfProduce, cropStartOfItem, FARM_SUPPLIES, supplyOfFacility,
} from '../db-schema/CropDatabase.js';
import { dishStarsAt } from './CookingSim.js';
import { getFireRecipe } from '../db-schema/FireRecipeDatabase.js';
import type { FarmEnv, FarmPlotState } from '../types/Farming.js';
import type { DishData } from '../types/Cooking.js';

const DAY = 86_400_000;
/** KST 자정 기준 날짜(달은 1~12) */
const kst = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d) - 9 * 3_600_000;
const alwaysRain: FarmEnv = { rainAt: () => true };
const neverRain: FarmEnv = { rainAt: () => false };
const half = (): number => 0.5;
const ctxAll = { hasSkill: () => true };

function planted(cropId: string, kind: 'seed' | 'seedling' | 'set', atMs: number, site: 'plot' | 'indoor' = 'plot'): FarmPlotState {
  const plot = newFarmPlot(site, atMs);
  const cell = plot.cells[0];
  cell.tilled = true;
  const crop = getCrop(cropId)!;
  const start = crop.starts.find((s) => s.kind === kind)!;
  plantCell(cell, crop, start, atMs, half, ctxAll);
  return plot;
}

describe('FarmSim — 실제 시간대로 자란다', () => {
  it('상추 모종은 씨앗보다 빨리 첫 잎을 딴다(육묘 건너뛰기)', () => {
    const t0 = kst(2026, 4, 5);
    const a = planted('lettuce', 'seedling', t0);
    const b = planted('lettuce', 'seed', t0);
    advanceCell(a, 0, t0 + 26 * DAY, alwaysRain);
    advanceCell(b, 0, t0 + 26 * DAY, alwaysRain);
    expect(cellReady(a.cells[0])).toBe(true);
    expect(cellReady(b.cells[0])).toBe(false);
    // 씨앗 55일(정식 후 25~30일 + 육묘 약 4주 — 농진청 웹진) → 26일이면 절반 가까이
    expect(b.cells[0].growth).toBeGreaterThan(0.4);
    expect(b.cells[0].growth).toBeLessThan(0.6);
  });

  it('잎 따기는 정해진 횟수만큼 다시 자라고, 그 뒤 칸이 빈다', () => {
    const t0 = kst(2026, 4, 5);
    const plot = planted('lettuce', 'seedling', t0);
    let t = t0 + 26 * DAY;
    advanceCell(plot, 0, t, alwaysRain);
    let picks = 0;
    for (let i = 0; i < 20 && plot.cells[0].cropId; i++) {
      const r = harvestCell(plot.cells[0], half);
      if (r) picks++;
      t += 5 * DAY;
      advanceCell(plot, 0, t, alwaysRain);
    }
    expect(picks).toBe(11);   // 첫 수확 + 10번 더
    expect(plot.cells[0].cropId).toBeNull();
  });

  it('마늘은 가을에 심어 겨울을 쉬고 이듬해 6월에 거둔다 · 5월에는 마늘종', () => {
    const t0 = kst(2026, 10, 10);
    const plot = planted('garlic', 'set', t0);
    advanceCell(plot, 0, kst(2027, 1, 15), alwaysRain);
    const winter = plot.cells[0].growth;
    const winterQ = plot.cells[0].quality;
    advanceCell(plot, 0, kst(2027, 2, 25), alwaysRain);
    expect(plot.cells[0].growth).toBeCloseTo(winter, 5);   // 휴면 — 자라지 않는다
    expect(plot.cells[0].quality).toBeCloseTo(winterQ, 5); // 겨울나기 작물은 추위에 상하지 않는다(휴면 중엔 병충해도 없다)
    advanceCell(plot, 0, kst(2027, 5, 20), alwaysRain);
    expect(interimOpen(plot.cells[0], getCrop('garlic')!)).toBe(true);
    const scape = interimHarvestCell(plot.cells[0], half);
    expect(scape?.itemId).toBe('crop_garlic_scape');
    advanceCell(plot, 0, kst(2027, 6, 25), alwaysRain);
    expect(cellReady(plot.cells[0])).toBe(true);
    const bulbs = harvestCell(plot.cells[0], half)!;
    // 종구 40쪽 → 30~36통 × 섬 × 마늘종 효과(1.05)
    expect(bulbs.qty).toBeGreaterThanOrEqual(27);
    expect(bulbs.qty).toBeLessThanOrEqual(38);
  });

  it('씨감자 1칸 분(200g) → 2~3kg — 약 10배', () => {
    const t0 = kst(2026, 3, 20);
    const plot = planted('potato', 'set', t0);
    advanceCell(plot, 0, t0 + 110 * DAY, alwaysRain);
    const r = harvestCell(plot.cells[0], half)!;
    expect(r.itemId).toBe('crop_potato');
    expect(r.qty).toBeGreaterThanOrEqual(2);
    expect(r.qty).toBeLessThanOrEqual(3);
  });

  it('물을 안 줘도 죽지 않는다 — 시들어 품질만 바닥(0.3)까지 내려간다', () => {
    const t0 = kst(2026, 7, 1);
    const plot = planted('cucumber', 'seedling', t0);
    advanceCell(plot, 0, t0 + 40 * DAY, neverRain);
    const c = plot.cells[0];
    expect(c.cropId).toBe('cucumber');
    expect(c.quality).toBeGreaterThanOrEqual(FARM_TUNING.qualityFloor);
    expect(c.quality).toBeLessThan(0.5);
    expect(c.dryH).toBeGreaterThan(24 * 20);
    expect(c.growth).toBeLessThan(1);   // 마른 동안은 자라지 않는다
    waterCell(c);
    expect(c.moisture).toBe(1);
  });

  it('빗물통이 있으면 비우는 동안에도 흙이 마르지 않는다', () => {
    const t0 = kst(2026, 7, 1);
    const plot = planted('cucumber', 'seedling', t0);
    plot.facilities.push('rainBarrel');
    advanceCell(plot, 0, t0 + 42 * DAY, neverRain);
    expect(plot.cells[0].dryH).toBe(0);
    expect(cellReady(plot.cells[0])).toBe(true);
  });

  it('여러해살이(부추)는 다 거둔 뒤 쉬고, 겨울을 넘기면 절반 기간에 다시 올라온다', () => {
    const t0 = kst(2026, 4, 10);
    const plot = planted('chive', 'seedling', t0);
    let t = t0;
    for (let i = 0; i < 40 && !plot.cells[0].resting; i++) {
      t += 7 * DAY;
      advanceCell(plot, 0, t, alwaysRain);
      harvestCell(plot.cells[0], half);
    }
    expect(plot.cells[0].resting).toBe(true);
    advanceCell(plot, 0, kst(2027, 1, 10), alwaysRain);
    expect(plot.cells[0].resting).toBe(false);
    expect(plot.cells[0].established).toBe(true);
    advanceCell(plot, 0, kst(2027, 3, 1) + 19 * DAY, alwaysRain);   // 35일 × 0.5 ≈ 18일
    expect(cellReady(plot.cells[0])).toBe(true);
  });
});

describe('FarmSim — 시설 배율 상한(잎채소 ×2.0 · 철 작물 ×1.4)', () => {
  it('수경 랙 + 퇴비 잎채소는 ×2.0에서 멈춘다', () => {
    const lettuce = getCrop('lettuce')!;
    const m = speedMultOf(lettuce, { compost: true }, { site: 'indoor', facilities: ['hydroRack'] }, 1);
    expect(m).toBe(2.0);
  });
  it('하우스 + 퇴비 철 작물은 ×1.4에서 멈춘다', () => {
    const garlic = getCrop('garlic')!;
    const m = speedMultOf(garlic, { compost: true }, { site: 'plot', facilities: ['greenhouse'] }, 12);
    expect(m).toBeCloseTo(1.4, 5);
  });
  it('퇴비는 품질을 올려 특 등급에 닿게 한다', () => {
    const plot = newFarmPlot('plot', 0);
    const cell = plot.cells[0];
    cell.tilled = true;
    compostCell(cell);
    const crop = getCrop('lettuce')!;
    plantCell(cell, crop, crop.starts[1], kst(2026, 4, 5), half, ctxAll);
    expect(gradeOf(cell.quality)).toBe('special');
  });
});

describe('FarmSim — 자격 · 철', () => {
  it('산채는 스킬과 차광막이 있어야 심는다', () => {
    const plot = newFarmPlot('plot', 0);
    plot.cells[0].tilled = true;
    const crop = getCrop('gomchwi')!;
    const st = crop.starts[0];
    expect(canPlant(crop, st, plot, plot.cells[0], 4, { hasSkill: () => false }).ok).toBe(false);
    expect(canPlant(crop, st, plot, plot.cells[0], 4, ctxAll).reasonKo).toContain('차광막');
    plot.facilities.push('shade');
    expect(canPlant(crop, st, plot, plot.cells[0], 4, ctxAll).ok).toBe(true);
  });
  it('철이 아니면 심지 못하고, 하우스는 앞뒤 한 달을 연다', () => {
    const plot = newFarmPlot('plot', 0);
    plot.cells[0].tilled = true;
    const crop = getCrop('chili')!;
    const st = crop.starts.find((s) => s.kind === 'seedling')!;
    const no = canPlant(crop, st, plot, plot.cells[0], 4, ctxAll);
    expect(no.ok).toBe(false);
    expect(no.reasonKo).toContain('5월');
    plot.facilities.push('greenhouse');
    expect(canPlant(crop, st, plot, plot.cells[0], 4, ctxAll).ok).toBe(true);
  });
  it('시루 작물은 실내 선반에만 — 시루가 있어야 한다', () => {
    const plot = newFarmPlot('indoor', 0);
    const crop = getCrop('bean_sprout')!;
    expect(canPlant(crop, crop.starts[0], plot, plot.cells[0], 10, ctxAll).ok).toBe(false);
    plot.facilities.push('sproutJar');
    expect(canPlant(crop, crop.starts[0], plot, plot.cells[0], 10, ctxAll).ok).toBe(true);
  });
  it('솎음은 씨앗으로 시작했을 때만 열린다', () => {
    const t0 = kst(2026, 8, 25);
    const a = planted('napa_cabbage', 'seed', t0);
    const b = planted('napa_cabbage', 'seedling', t0);
    advanceCell(a, 0, t0 + 20 * DAY, alwaysRain);
    advanceCell(b, 0, t0 + 15 * DAY, alwaysRain);
    expect(interimOpen(a.cells[0], getCrop('napa_cabbage')!)).toBe(true);
    expect(interimOpen(b.cells[0], getCrop('napa_cabbage')!)).toBe(false);
  });
});

describe('FarmSim — 비 · 시세 · 수익 균형', () => {
  it('기후 비는 결정적이고 7월이 1월보다 비가 잦다', () => {
    const count = (y: number, m: number): number => {
      let n = 0;
      for (let d = 1; d <= 28; d++) for (let h = 0; h < 24; h++) if (climateRainAt(kst(y, m, d) + h * 3_600_000)) { n++; break; }
      return n;
    };
    expect(count(2026, 7)).toBeGreaterThan(count(2026, 1));
    expect(climateRainAt(kst(2026, 7, 3) + 5 * 3_600_000)).toBe(climateRainAt(kst(2026, 7, 3) + 5 * 3_600_000));
    expect(kstMonthOf(kst(2026, 7, 1))).toBe(7);
  });

  it('값은 등급 · 달 · 숨은 재조정을 따른다', () => {
    const t = kst(2026, 10, 8);
    const good = producePrice('crop_lettuce', t, 'good')!;
    const sp = producePrice('crop_lettuce', t, 'special')!;
    const nm = producePrice('crop_lettuce', t, 'normal')!;
    expect(sp).toBeGreaterThan(good);
    expect(nm).toBeLessThan(good);
    // 산마늘 — 기준가 1,500원 × 재조정 0.8 → 같은 달 같은 출렁임에서 재조정만큼 낮다
    const myeongi = getCrop('myeongi')!;
    const raw = myeongi.price.base * myeongi.price.season[9];
    expect(producePrice('crop_myeongi', t, 'good')!).toBeLessThan(raw * 2.5 * 0.8 + 10);
    expect(producePrice('crop_nothing', t)).toBeNull();
  });

  it('칸 · 날 수익이 상한(1,000원)을 넘는 작물이 없다', () => {
    for (const crop of CROP_DATABASE) for (const st of crop.starts) {
      if (st.cost === 0) continue;
      expect(cropDailyValue(crop, st.kind), `${crop.id}/${st.kind}`).toBeLessThanOrEqual(1000);
    }
  });

  it('마트에 없는 작물이 서른다섯 종을 넘는다(235차 조사 96종 중 21종 추가)', () => {
    expect(CROP_DATABASE.filter((c) => !c.inMart).length).toBeGreaterThanOrEqual(35);
  });

  it('작물 id · 아이템 id가 겹치지 않는다', () => {
    const ids = CROP_DATABASE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const items = CROP_DATABASE.flatMap((c) => [...c.starts.filter((s) => !s.itemId.startsWith('crop_')).map((s) => s.itemId), c.harvest.itemId,
      ...(c.harvest.ripenTo ? [c.harvest.ripenTo.itemId] : []), ...(c.interim ? [c.interim.itemId] : [])]);
    expect(new Set(items).size).toBe(items.length);
  });
});

describe('등급별 수확물 id · 농자재', () => {
  it('등급 꼬리가 왕복한다(상 = 꼬리 없음)', () => {
    expect(produceItemId('crop_lettuce', 'good')).toBe('crop_lettuce');
    expect(produceItemId('crop_lettuce', 'special')).toBe('crop_lettuce_sp');
    expect(parseProduceId('crop_lettuce_nm')).toEqual({ baseId: 'crop_lettuce', grade: 'normal' });
    expect(parseProduceId('crop_chili_red')).toEqual({ baseId: 'crop_chili_red', grade: 'good' });
  });
  it('등급 꼬리가 붙어도 작물 · 값 · 씨앗 조회가 된다', () => {
    expect(cropOfProduce('crop_garlic_scape_sp')?.id).toBe('garlic');
    const t = kst(2026, 5, 10);
    const good = producePrice('crop_lettuce', t)!;
    expect(producePrice('crop_lettuce_sp', t)).toBe(Math.max(10, Math.round(good / 10 / FARM_TUNING.gradePrice.good * FARM_TUNING.gradePrice.special) * 10));
    expect(producePrice('crop_lettuce_nm', t)!).toBeLessThan(good);
    expect(cropStartOfItem('crop_soybean_nm')?.crop.id).toBe('bean_sprout');
  });
  it('설비마다 사는 농자재가 하나씩 있다', () => {
    for (const f of ['rainBarrel', 'greenhouse', 'shade', 'coldWater', 'sproutJar', 'hydroRack'] as const) {
      expect(supplyOfFacility(f)?.facility).toBe(f);
    }
    expect(FARM_SUPPLIES.every((s) => s.price > 0)).toBe(true);
  });
});

describe('CookingSim — 가게 채소 별점 상한(235차)', () => {
  const recipe = getFireRecipe('stew_red')!;
  const base: DishData = {
    recipeId: 'stew_red', cookedAtMs: 1_000_000, tempAtDoneC: recipe.servingC + 5,
    base: { season: 1, temp: 1, texture: 1, fresh: 1, finish: 1 }, saltLabel: 'ok', sugarLabel: 'ok',
    contents: [], stoveKind: 'home', cookwareId: 'pot_home', burnt: false, servings: 2, skillRank: 0, missingRequired: 0,
  };
  it('직접 기른 채소면 별 5개', () => {
    const st = dishStarsAt({ ...base, produce: 'homegrown' }, recipe, base.cookedAtMs);
    expect(st.stars).toBe(5);
    expect(st.rating).toBe(5);
  });
  it('가게 채소면 4개 — 완성도 별이 막힌다', () => {
    const st = dishStarsAt({ ...base, produce: 'store' }, recipe, base.cookedAtMs);
    expect(st.stars).toBe(4);
    expect(st.rating).toBe(4);
    expect(st.produceCapped).toBe(true);
    expect(st.total).toBeLessThanOrEqual(85);
  });
  it('가게 채소라도 요리 스킬 2단계면 4.5개까지', () => {
    const st = dishStarsAt({ ...base, produce: 'store', halfStar: true }, recipe, base.cookedAtMs);
    expect(st.stars).toBe(4);
    expect(st.rating).toBe(4.5);
  });
});
