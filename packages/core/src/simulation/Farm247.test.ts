/**
 * @file Farm247.test.ts
 * @description 247차 — 작물마다 다른 재배 요소(물 양 · 과습 탈 · 거름 · 철 · 품 · 도구 · 거둔 뒤 밭 손질 · 저절로 나는 싹 · 포기 나누기 · 모종 꺼내기)
 */
import { describe, expect, it } from 'vitest';
import {
  newFarmPlot, plantCell, advanceCell, harvestCell, waterCell, cellReady, cellStage, cellDays, clearCell, wildUnknown,
  pullSeedlings, processStageOf, startFieldProcess, finishFieldProcess, divideBlockKo, divideCell, rareArrivalInDays,
} from './FarmSim.js';
import { CROP_DATABASE, getCrop, FARM_SUPPLIES } from '../db-schema/CropDatabase.js';
import {
  CROP_CULTIVATION, CULTIVATION_TUNING, FORK_ID, HARVEST_SCISSORS_ID, SICKLE_ID, TROWEL_ID, FLAIL_ID, WILD_TUNING, RARE_ARRIVAL_EVERY,
  cultivationOf, harvestToolEval, plantToolEval, processLastToolEval, laborOf, laborVector, tooTiredKo, wateredMoisture, waterBandOf,
  moistureStateOf, offTimingOf, pickWildSprout,
} from '../db-schema/CropCultivationDatabase.js';
import { carePlanOf, NURSERY_PLAN } from '../db-schema/CropCareDatabase.js';
import type { FarmEnv, FarmPlotState } from '../types/Farming.js';

const DAY = 86_400_000;
const H = 3_600_000;
const kst = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d) - 9 * H;
const neverRain: FarmEnv = { rainAt: () => false };
const half = (): number => 0.5;
const ctx = { hasSkill: () => true, hasTray: true };

function planted(cropId: string, kind: 'seed' | 'seedling' | 'set', atMs: number, opts: { compost?: boolean } = {}): FarmPlotState {
  const plot = newFarmPlot('plot', atMs);
  const cell = plot.cells[0];
  cell.tilled = true;
  if (opts.compost) cell.compost = true;
  const crop = getCrop(cropId)!;
  plantCell(cell, crop, crop.starts.find((s) => s.kind === kind)!, atMs, half, ctx);
  return plot;
}

/** 날마다 그 작물에 알맞게 물을 준다(흙이 구간 아래로 마르면 · 물 끊기 동안은 바짝 마를 때만) */
function growWell(plot: FarmPlotState, from: number, days: number): number {
  const cell = plot.cells[0];
  let t = from;
  for (let d = 0; d < days; d++) {
    t += DAY;
    const crop = getCrop(cell.cropId!)!;
    const left = cell.picks === 0 && cell.growth < 1 ? (1 - cell.growth) * cellDays(crop, cell) : undefined;
    const { band, stopping } = waterBandOf(crop, left);
    if (stopping) { if (cell.moisture < 0.25) waterCell(cell, 'light'); } else if (cell.moisture < band[0] + 0.05) waterCell(cell, cultivationOf(crop).water.amount);
    advanceCell(plot, 0, t, neverRain);
  }
  return t;
}

/** 날마다 흠뻑 준다(물을 좋아하지 않는 작물에는 과습) */
function soakDaily(plot: FarmPlotState, from: number, days: number): number {
  let t = from;
  for (let d = 0; d < days; d++) { t += DAY; waterCell(plot.cells[0], 'deep'); advanceCell(plot, 0, t, neverRain); }
  return t;
}

describe('247차 — 재배 요소 표', () => {
  it('작물 86종 전부 표가 있고, 표에 없는 id가 없다 · 알맞은 수분은 아래 < 위', () => {
    const ids = new Set(CROP_DATABASE.map((c) => c.id));
    for (const c of CROP_DATABASE) expect(CROP_CULTIVATION[c.id], c.id).toBeDefined();
    for (const id of Object.keys(CROP_CULTIVATION)) expect(ids.has(id), id).toBe(true);
    for (const [id, cv] of Object.entries(CROP_CULTIVATION)) {
      expect(cv.water.band[0], id).toBeLessThan(cv.water.band[1]);
      expect(cv.noteKo.length, id).toBeGreaterThan(5);
      expect(cv.noteEn.length, id).toBeGreaterThan(5);
    }
  });

  it('조사 근거 — 물 끊기는 마늘 14일 · 양파 7일 · 수박 10일 · 미나리 · 고추냉이는 물에 잠겨 자란다', () => {
    expect(CROP_CULTIVATION.garlic.water.stopDays).toBe(14);
    expect(CROP_CULTIVATION.onion.water.stopDays).toBe(7);
    expect(CROP_CULTIVATION.watermelon.water.stopDays).toBe(10);
    expect(CROP_CULTIVATION.water_parsley.water.over).toBe('none');
    expect(CROP_CULTIVATION.wasabi.water.band[0]).toBeGreaterThanOrEqual(0.7);
    expect(CROP_CULTIVATION.sweet_potato.water.amount).toBe('light');
    expect(CROP_CULTIVATION.sweet_potato.feed).toBe('low');
    expect(CROP_CULTIVATION.napa_cabbage.feed).toBe('high');
  });

  it('새 도구 7가지가 농자재에 있다(닳지 않는 도구)', () => {
    for (const id of [SICKLE_ID, HARVEST_SCISSORS_ID, FORK_ID, TROWEL_ID, FLAIL_ID, 'farm_winnow', 'farm_gloves']) {
      expect(FARM_SUPPLIES.find((s) => s.itemId === id)?.kind, id).toBe('tool');
    }
  });
});

describe('247차 — 물 양 · 알맞은 수분 · 과습 탈', () => {
  it('조금 +0.3 · 보통 +0.55 · 흠뻑 = 가득', () => {
    expect(wateredMoisture(0.2, 'light')).toBeCloseTo(0.5, 5);
    expect(wateredMoisture(0.2, 'normal')).toBeCloseTo(0.75, 5);
    expect(wateredMoisture(0.2, 'deep')).toBe(1);
    expect(wateredMoisture(0.9, 'normal')).toBe(1);
    expect(moistureStateOf(0.1, [0.35, 0.8])).toBe('dry');
    expect(moistureStateOf(0.3, [0.35, 0.8])).toBe('low');
    expect(moistureStateOf(0.5, [0.35, 0.8])).toBe('ok');
    expect(moistureStateOf(0.9, [0.35, 0.8])).toBe('wet');
  });

  it('고구마에 날마다 흠뻑 주면 마를 틈이 없어 덩이가 썩는다 — 알맞게 주면 그대로', () => {
    const t0 = kst(2026, 5, 15);
    const wet = planted('sweet_potato', 'set', t0);
    const ok = planted('sweet_potato', 'set', t0);
    soakDaily(wet, t0, 40);
    growWell(ok, t0, 40);
    expect(wet.cells[0].stand).toBeLessThan(ok.cells[0].stand - 0.05);
    expect(wet.cells[0].quality).toBeLessThan(ok.cells[0].quality);
    expect(ok.cells[0].stand).toBeCloseTo(getCrop('sweet_potato')!.starts[0].establish, 1);
  });

  it('보통 물 작물(고추)은 하루 한 번 흠뻑이면 탈이 없다 — 견디는 시간은 잇달아 젖은 시간만 센다', () => {
    const t0 = kst(2026, 5, 10);
    const plot = planted('chili', 'seedling', t0);
    const s0 = plot.cells[0].stand;
    soakDaily(plot, t0, 30);
    expect(plot.cells[0].stand).toBeCloseTo(s0, 5);
    expect(plot.cells[0].soggyH ?? 0).toBeLessThanOrEqual(CULTIVATION_TUNING.soggyGraceH);
  });

  it('미나리는 늘 물에 잠겨도 탈이 없다(물을 좋아한다)', () => {
    const t0 = kst(2026, 9, 1);
    const plot = planted('water_parsley', 'set', t0);
    const s0 = plot.cells[0].stand;
    soakDaily(plot, t0, 30);
    expect(plot.cells[0].stand).toBeCloseTo(s0, 5);
  });

  it('조금 마르면(구간 아래 · 0.25 이상) 더디게 자란다', () => {
    const t0 = kst(2026, 5, 10);
    const a = planted('cucumber', 'seedling', t0);
    const b = planted('cucumber', 'seedling', t0);
    for (let h = 1; h <= 10 * 24; h++) {
      a.cells[0].moisture = 0.7; b.cells[0].moisture = 0.4;   // 오이 알맞은 수분 0.5~0.95 — 시간마다 맞춰 둔다
      advanceCell(a, 0, t0 + h * H, neverRain); advanceCell(b, 0, t0 + h * H, neverRain);
    }
    expect(b.cells[0].growth).toBeLessThan(a.cells[0].growth);
    expect(b.cells[0].growth / a.cells[0].growth).toBeCloseTo(CULTIVATION_TUNING.belowBandGrowth, 2);
  });

  it('물 끊기 — 거두기 이만큼 앞부터는 알맞은 수분의 위가 낮아진다(마늘)', () => {
    const garlic = getCrop('garlic')!;
    expect(waterBandOf(garlic, 30).stopping).toBe(false);
    const s = waterBandOf(garlic, 10);
    expect(s.stopping).toBe(true);
    expect(s.band[1]).toBeLessThan(CROP_CULTIVATION.garlic.water.band[1]);
  });
});

describe('247차 — 거름 · 철', () => {
  it('퇴비 칸에 심으면 많이 먹는 작물 +8% · 적게 먹는 작물 −8%(잎 · 덩굴만 무성)', () => {
    const t0 = kst(2026, 5, 15);
    const base = planted('sweet_potato', 'set', t0);
    const fed = planted('sweet_potato', 'set', t0, { compost: true });
    expect(fed.cells[0].fedAtPlant).toBe(true);
    for (const p of [base, fed]) { p.cells[0].growth = 1; p.cells[0].lastMs = t0; }
    const a = harvestCell(base.cells[0], half)!.qty;
    const b = harvestCell(fed.cells[0], half)!.qty;
    expect(b).toBeLessThanOrEqual(a);
  });

  it('알맞은 달 밖에 심으면 까닭이 붙고 수량이 준다 — 상추 5월 = 꽃대 · 10월 = 철이 짧다 · 하우스면 냉해는 없다', () => {
    const lettuce = getCrop('lettuce')!;
    const seedling = lettuce.starts.find((s) => s.kind === 'seedling')!;
    expect(offTimingOf(lettuce, 4, seedling.months)).toBeNull();
    expect(offTimingOf(lettuce, 5, seedling.months)).toBe('bolt');
    expect(offTimingOf(lettuce, 10, seedling.months)).toBe('short');
    const cuke = getCrop('cucumber')!;
    const cs = cuke.starts.find((s) => s.kind === 'seedling')!;
    const plot = newFarmPlot('plot', 0);
    plot.cells[0].tilled = true;
    plantCell(plot.cells[0], cuke, cs, kst(2026, 4, 20), half, ctx);
    expect(plot.cells[0].offTiming).toBe('cold');
    const gh = newFarmPlot('plot', 0);
    gh.cells[0].tilled = true;
    plantCell(gh.cells[0], cuke, cs, kst(2026, 4, 20), half, ctx, { greenhouse: true });
    expect(gh.cells[0].offTiming).toBeUndefined();
    expect(gh.cells[0].stand).toBeGreaterThan(plot.cells[0].stand);
  });
});

describe('247차 — 품 · 도구', () => {
  it('고추는 수확 가위가 있으면 품이 줄고(×0.6) 아주 조금 좋아진다(+0.02)', () => {
    const chili = getCrop('chili')!;
    const bare = harvestToolEval(chili, () => false);
    const snips = harvestToolEval(chili, (id) => id === HARVEST_SCISSORS_ID);
    expect(bare.needsAny).toEqual([]);
    expect(snips.helper).toBe(HARVEST_SCISSORS_ID);
    expect(snips.laborMult).toBeCloseTo(0.6, 5);
    expect(snips.quality).toBeCloseTo(0.02, 5);
    expect(laborOf('harvest', chili, { tool: snips }).fatigue).toBeLessThan(laborOf('harvest', chili, { tool: bare }).fatigue);
  });

  it('깨 · 콩 · 보리는 낫이 있어야 벤다 · 감자는 호미나 쇠스랑 — 쇠스랑은 빠르지만 감자가 찍힌다 · 고구마는 덩굴을 낫으로', () => {
    expect(harvestToolEval(getCrop('soybean')!, () => false).needsAny).toEqual([SICKLE_ID]);
    expect(harvestToolEval(getCrop('deulkkae')!, () => false).needsAny).toEqual([SICKLE_ID]);
    const potato = harvestToolEval(getCrop('potato')!, (id) => id === FORK_ID);
    expect(potato.needsAny).toContain('farm_homi');
    expect(potato.laborMult).toBeLessThan(1);
    expect(potato.quality).toBeLessThan(0);
    const peanut = harvestToolEval(getCrop('peanut')!, (id) => id === FORK_ID);
    expect(peanut.quality).toBeGreaterThan(0);
    const sp = harvestToolEval(getCrop('sweet_potato')!, (id) => id === 'farm_homi' || id === SICKLE_ID);
    expect(sp.helpers).toContain(SICKLE_ID);
    expect(sp.laborMult).toBeCloseTo(0.8, 5);
    expect(plantToolEval('seedling', (id) => id === TROWEL_ID).laborMult).toBeCloseTo(0.6, 5);
    expect(processLastToolEval(CROP_CULTIVATION.soybean.process!, (id) => id === FLAIL_ID).laborMult).toBeCloseTo(0.6, 5);
  });

  it('품 → 허기 · 수분 · 피로 · 너무 지치면(88) 일을 못 한다', () => {
    const v = laborVector(2);
    expect(v.hunger).toBeCloseTo(1, 5);
    expect(v.hydration).toBeCloseTo(1.4, 5);
    expect(tooTiredKo(50)).toBeNull();
    expect(tooTiredKo(90)).toContain('지쳤다');
    expect(laborOf('harvest', getCrop('potato')!).fatigue).toBeGreaterThan(laborOf('harvest', getCrop('lettuce')!).fatigue);
    expect(laborOf('water', undefined, { amount: 'deep' }).fatigue).toBeGreaterThan(laborOf('water', undefined, { amount: 'light' }).fatigue);
  });
});

describe('247차 — 거둔 뒤 밭 손질(깨 · 콩 · 보리 · 땅콩 · 마늘 · 양파)', () => {
  it('콩: 베면 칸에 남아 마른다 → 다 마르면 턴다 · 키질하면 품질 + · 비 오는 시간은 세지 않는다', () => {
    const t0 = kst(2026, 6, 1);
    const plot = planted('soybean', 'seed', t0);
    const cell = plot.cells[0];
    cell.growth = 1; cell.lastMs = kst(2026, 10, 10);
    const cutAt = kst(2026, 10, 10);
    expect(startFieldProcess(cell, cutAt)).toBe(true);
    expect(processStageOf(cell)).toBe('drying');
    expect(cellStage(cell)).toBe('drying');
    // 비가 계속 오면 마르지 않는다
    advanceCell(plot, 0, cutAt + 5 * DAY, { rainAt: () => true });
    expect(processStageOf(cell)).toBe('drying');
    expect(cell.process!.rainH).toBeGreaterThan(100);
    // 사흘 맑으면 다 마른다
    advanceCell(plot, 0, cutAt + 8 * DAY + 2 * H, neverRain);
    expect(processStageOf(cell)).toBe('dry');
    expect(cellStage(cell)).toBe('dried');
    const q = cell.quality;
    const r = finishFieldProcess(cell, half, {}, { winnowed: true }, cutAt + 9 * DAY)!;
    expect(r.itemId).toBe('crop_soybean');
    expect(r.quality).toBeCloseTo(Math.min(1, q + CULTIVATION_TUNING.winnowQuality), 5);
    expect(r.processNote?.winnowed).toBe(true);
    expect(cell.cropId).toBeNull();
  });

  it('다 마른 뒤 너무 오래 두면 꼬투리가 터져 줄어든다(하루 2% · 바닥 60%) · 키 없이 털면 품질 −', () => {
    const mk = (): FarmPlotState => {
      const plot = planted('deulkkae', 'seed', kst(2026, 6, 10));
      const c = plot.cells[0];
      c.growth = 1; c.lastMs = kst(2026, 10, 5);
      startFieldProcess(c, kst(2026, 10, 5));
      advanceCell(plot, 0, kst(2026, 10, 5) + 8 * DAY, neverRain);
      return plot;
    };
    const a = mk(); const b = mk();
    const dryAt = a.cells[0].process!.dryAt!;
    const ra = finishFieldProcess(a.cells[0], () => 0.99, {}, { winnowed: true }, dryAt + DAY)!;
    const rb = finishFieldProcess(b.cells[0], () => 0.99, {}, { winnowed: false }, dryAt + 60 * DAY)!;
    expect(rb.processNote!.shatterLoss).toBeCloseTo(1 - CULTIVATION_TUNING.shatterFloor, 5);
    expect(rb.quality).toBeLessThan(ra.quality);
  });

  it('베기 전에는 손질이 시작되지 않는다 · 손질이 없는 작물은 시작되지 않는다', () => {
    const plot = planted('soybean', 'seed', kst(2026, 6, 1));
    expect(startFieldProcess(plot.cells[0], kst(2026, 6, 2))).toBe(false);   // 아직 안 익었다
    const lettuce = planted('lettuce', 'seedling', kst(2026, 4, 5));
    lettuce.cells[0].growth = 1;
    expect(startFieldProcess(lettuce.cells[0], kst(2026, 5, 5))).toBe(false);
  });
});

describe('247차 — 모종 꺼내기 · 모종 굳히기', () => {
  it('트레이에서 꺼낸 만큼만 모종이 되고, 남은 것은 트레이에 있다 — 다 꺼내면 칸이 빈다', () => {
    const plot = newFarmPlot('indoor', kst(2026, 2, 10));
    const cell = plot.cells[0];
    const chili = getCrop('chili')!;
    plantCell(cell, chili, chili.starts.find((s) => s.kind === 'seed')!, kst(2026, 2, 10), half, ctx);
    cell.growth = 1;
    const a = pullSeedlings(cell, half, 3)!;
    expect(a.itemId).toBe('sdl_chili');
    expect(a.qty).toBe(3);
    expect(a.more).toBe(true);
    const left = cell.trayLeft!;
    expect(left).toBeGreaterThan(5);
    const b = pullSeedlings(cell, half)!;
    expect(b.qty).toBe(left);
    expect(cell.cropId).toBeNull();
  });

  it('육묘 표에 모종 굳히기가 있다(옮겨 심기 전 · 거르면 모종이 준다)', () => {
    const h = NURSERY_PLAN.tasks.find((t) => t.id === 'harden_off')!;
    expect(h.growth).toBeDefined();
    expect(h.missed?.yieldMult).toBeLessThan(1);
  });
});

describe('247차 — 저절로 나는 싹 · 씨앗 은행', () => {
  it('묵힌 칸(2주 넘게)에서만 · 한 구획에 하나만 · 결정적', () => {
    const run = (): FarmPlotState => {
      const plot = newFarmPlot('plot', kst(2026, 3, 1));
      plot.facilities.push('shade');
      for (const c of plot.cells) c.tilled = true;
      for (let d = 1; d <= 240; d++) for (let i = 0; i < plot.cells.length; i++) advanceCell(plot, i, kst(2026, 3, 1) + d * DAY, neverRain);
      return plot;
    };
    const a = run(); const b = run();
    const wa = a.cells.filter((c) => c.wild && c.cropId);
    expect(wa.length).toBeLessThanOrEqual(1);
    expect(a.cells.map((c) => c.cropId)).toEqual(b.cells.map((c) => c.cropId));
  });

  it('저절로 난 싹은 자람 25% 전까지 이름을 모른다', () => {
    const plot = planted('gomchwi', 'seedling', kst(2026, 4, 1));
    const c = plot.cells[0];
    c.wild = true; c.growth = 0.1;
    expect(wildUnknown(c)).toBe(true);
    c.growth = WILD_TUNING.revealGrowth + 0.01;
    expect(wildUnknown(c)).toBe(false);
  });

  it('그늘이 없으면 그늘 산나물은 나지 않는다 · 흙에 떨어진 씨는 그 철에 고른다', () => {
    for (let r = 0; r < 1; r += 0.05) {
      const p = pickWildSprout(4, false, r);
      if (p) expect(['bujigaengi', 'chopi', 'eomnamu', 'dureup']).toContain(p.cropId);
    }
    const banked = pickWildSprout(6, false, 0.99, [{ cropId: 'shiso', shade: false, months: [6], weight: 100 }]);
    expect(banked?.cropId).toBe('shiso');
  });

  it('씨가 떨어지는 작물을 거두지 않고 두면 씨앗 은행에 든다', () => {
    const plot = planted('amaranth', 'seed', kst(2026, 5, 10));
    const c = plot.cells[0];
    c.growth = 1; c.lastMs = kst(2026, 6, 20);
    advanceCell(plot, 0, kst(2026, 6, 20) + 30 * DAY, neverRain);
    expect(plot.seedBank).toContain('amaranth');
    clearCell(c);
  });
});

describe('247차 — 포기 나누기 · 산채 모종 들어오는 날', () => {
  it('한 해를 넘긴 포기만 · 그 달에만 · 한 해 한 번 — 심는 물건을 돌려준다', () => {
    const gomchwi = getCrop('gomchwi')!;
    const plot = planted('gomchwi', 'seedling', kst(2026, 4, 1));
    const c = plot.cells[0];
    expect(divideBlockKo(c, gomchwi, kst(2027, 3, 20))).toContain('한 해');
    c.established = true;
    expect(divideBlockKo(c, gomchwi, kst(2027, 7, 1))).toContain('3');
    const r = divideCell(c, gomchwi, kst(2027, 3, 20), half)!;
    expect(r.itemId).toBe('sdl_gomchwi');
    expect(r.qty).toBeGreaterThanOrEqual(2);
    expect(divideBlockKo(c, gomchwi, kst(2027, 4, 2))).toContain('이미');
  });

  it('고추냉이는 거둘 때 곁눈을 준다', () => {
    const plot = planted('wasabi', 'seedling', kst(2026, 4, 1));
    const c = plot.cells[0];
    c.growth = 1;
    const r = harvestCell(c, half)!;
    expect(r.offsets?.itemId).toBe('sdl_wasabi');
    expect(r.offsets!.qty).toBeGreaterThanOrEqual(2);
  });

  it('산채 모종은 열흘에 한 번꼴 들어온다(작물마다 다른 날)', () => {
    const t = kst(2026, 4, 1);
    let days = 0;
    for (let d = 0; d < 40; d++) if (rareArrivalInDays('sdl_gomchwi', t + d * DAY) === 0) days++;
    expect(days).toBe(40 / RARE_ARRIVAL_EVERY);
    const n = rareArrivalInDays('sdl_gomchwi', t);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThan(RARE_ARRIVAL_EVERY);
  });

  it('아주 까다로운 작물의 관리 표 · 재배 요소가 다 있다(늘리는 법 포함)', () => {
    for (const id of ['gomchwi', 'myeongi', 'samnamul', 'eosuri', 'bujigaengi', 'dureup', 'eomnamu', 'wasabi', 'chopi']) {
      const crop = getCrop(id)!;
      expect(crop.difficulty, id).toBe(4);
      expect(carePlanOf(crop).tasks.length, id).toBeGreaterThan(0);
      expect(cultivationOf(crop).propagate, id).toBeDefined();
    }
  });
});

describe('247차 — 새 작물(들깨 · 참깨)', () => {
  it('씨로 심고 · 거두면 베어 말려 턴다 · 날로 먹지 않는다', () => {
    for (const id of ['deulkkae', 'chamkkae']) {
      const crop = getCrop(id)!;
      const cv = cultivationOf(crop);
      expect(cv.process?.first, id).toBe('cut');
      expect(cv.process?.last, id).toBe('thresh');
      expect(cv.process?.winnow, id).toBe(true);
      expect(crop.harvest.itemId).toBe(`crop_${id}`);
    }
    const plot = planted('deulkkae', 'seed', kst(2026, 6, 10));
    expect(cellReady(plot.cells[0])).toBe(false);
  });
});
