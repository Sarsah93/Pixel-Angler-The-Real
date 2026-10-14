/**
 * @file CropCareSim.test.ts
 * @description 238차 — 관리 작업 · 병해 3종 · 육묘 트레이 · 늦서리 · 첫서리 · 검붉은 고추 · 포기당 수량 시험
 */
import { describe, expect, it } from 'vitest';
import {
  newFarmPlot, plantCell, advanceCell, harvestCell, cellReady, canPlant, waterCell, harvestPreview, cropDailyValue, FARM_TUNING,
} from './FarmSim.js';
import {
  CARE_TUNING, careStatusList, careDue, doCare, skipExpiredRounds, diseaseYieldMult, ripeStageOf, lastFrostDayIndex, firstFrostDayIndex,
  inEstablishment, cellDiseases, perPlantYield, frostBlockKo,
} from './CropCareSim.js';
import { getCrop, FARM_SUPPLIES, cropStartOfItem } from '../db-schema/CropDatabase.js';
import {
  carePlanOf, hasCarePlan, carePlanSummaryKo, CROP_CARE_PLANS, NURSERY_PLAN, CARE_TASK_KO, DISEASE_KO, TRAY_ID, STAKE_ID, TWINE_ID, MULCH_ID,
  FERT_ID, FUNGICIDE_ID, PHOSPHITE_ID, CALCIUM_ID, INSECTICIDE_ID,
} from '../db-schema/CropCareDatabase.js';
import type { FarmEnv, FarmPlotState, FarmCellState } from '../types/Farming.js';

const H = 3_600_000;
const DAY = 86_400_000;
const KST = 9 * H;
/** KST 자정 기준 날짜(달은 1~12) */
const kst = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d) - KST;
const dayIdx = (ms: number): number => Math.floor((ms + KST) / DAY);
const neverRain: FarmEnv = { rainAt: () => false };
const alwaysRain: FarmEnv = { rainAt: () => true };
const half = (): number => 0.5;
const ctx = { hasSkill: () => true, hasTray: true };

function plantedAt(cropId: string, kind: 'seed' | 'seedling', atMs: number, site: 'plot' | 'indoor' = 'plot'): FarmPlotState {
  const plot = newFarmPlot(site, atMs);
  const cell = plot.cells[0];
  cell.tilled = true;
  const crop = getCrop(cropId)!;
  const start = crop.starts.find((s) => s.kind === kind)!;
  plantCell(cell, crop, start, atMs, half, ctx);
  return plot;
}

/** 하루씩 굴리며 날마다 물을 준다(활착기 · 실내 트레이) */
function runDays(plot: FarmPlotState, fromMs: number, days: number, env: FarmEnv, water = true): number {
  let t = fromMs;
  for (let d = 0; d < days; d++) {
    t += DAY;
    if (water) waterCell(plot.cells[0]);
    advanceCell(plot, 0, t, env);
  }
  return t;
}

const chili = getCrop('chili')!;
const chiliSeedling = chili.starts.find((s) => s.kind === 'seedling')!;
const chiliSeed = chili.starts.find((s) => s.kind === 'seed')!;
/** 늦서리가 확실히 지난 5월 1일 */
const MAY1 = kst(2026, 5, 1);

describe('238차 — 고추 관리 표 · 종묘사 자재', () => {
  it('고추 표는 6단계를 작업으로 쪼갠다 — 멀칭 · 지주 · 첫 꽃 · 곁순 · 유인 · 웃거름 · 방제 4종 · 걷어 내기 · 병해 3종 · 활착 2주 · 서리에 끝', () => {
    const plan = CROP_CARE_PLANS.chili;
    expect(plan.tasks.map((t) => t.id)).toEqual([
      'ridge_mulch', 'stake', 'pinch_flower', 'remove_suckers', 'tie', 'topdress',
      'spray_fungicide', 'spray_phosphite', 'spray_calcium', 'spray_insecticide', 'cull_diseased',
    ]);
    expect(plan.diseases).toEqual(['blight', 'anthracnose', 'virus']);
    expect(plan.establishDays).toBe(14);
    expect(plan.frostEnds).toBe(true);
    // 지주 1회 + 유인 2회 · 웃거름 5회(정식 15일 뒤 1차 · 18일 간격)
    const tie = plan.tasks.find((t) => t.id === 'tie')!;
    expect(1 + (tie.repeat?.times ?? 0)).toBe(2);
    const top = plan.tasks.find((t) => t.id === 'topdress')!;
    expect(1 + (top.repeat?.times ?? 0)).toBe(5);
    expect(top.dayWindow[0]).toBe(15);
    // 지주는 포기 수(3)만큼 + 끈
    const st = plan.tasks.find((t) => t.id === 'stake')!;
    expect(st.needs).toEqual([{ itemId: STAKE_ID, qty: 3 }, { itemId: TWINE_ID, qty: 1 }]);
    expect(carePlanSummaryKo(chili)).toContain('지주 세우기');
    expect(carePlanSummaryKo(chili)).toContain('웃거름 5회');
    expect(carePlanSummaryKo(chili)).toContain(DISEASE_KO.anthracnose);
  });

  it('방울토마토는 238 뼈대 그대로(지주 · 곁순 · 병해 3종) · 245차 — 상추도 표가 있다(솎기 · 웃거름 · 진딧물)', () => {
    const tomato = carePlanOf(getCrop('cherry_tomato')!);
    expect(tomato.tasks.map((t) => t.id)).toEqual(['stake', 'tie', 'remove_suckers', 'spray_fungicide', 'spray_insecticide', 'cull_diseased', 'topdress']);
    expect(tomato.diseases).toEqual(['blight', 'anthracnose', 'virus']);
    expect(tomato.frostEnds).toBe(true);
    const lettuce = carePlanOf(getCrop('lettuce')!);
    expect(lettuce.tasks.map((t) => t.id)).toEqual(['thin', 'topdress', 'pick_pests']);
    expect(lettuce.diseases).toEqual(['aphid']);
    expect(hasCarePlan(getCrop('lettuce')!)).toBe(true);
    expect(hasCarePlan(getCrop('eggplant')!)).toBe(true);
    // 모든 작업 이름이 있다
    for (const t of [...CROP_CARE_PLANS.chili.tasks, ...NURSERY_PLAN.tasks]) expect(CARE_TASK_KO[t.id]).toBeTruthy();
    // 이름 안에 목록 구분자(·)가 없다 — 요약 줄이 ` · `로 잇는다
    for (const name of Object.values(CARE_TASK_KO)) expect(name.includes('\u00b7'), name).toBe(false);
  });

  it('종묘사 자재 9종이 농자재 표에 있고 아이콘 · 가게가 붙어 있다', () => {
    for (const id of [TRAY_ID, STAKE_ID, TWINE_ID, MULCH_ID, FERT_ID, FUNGICIDE_ID, PHOSPHITE_ID, CALCIUM_ID, INSECTICIDE_ID]) {
      const s = FARM_SUPPLIES.find((x) => x.itemId === id);
      expect(s, id).toBeTruthy();
      expect(s!.shop).toBe('nursery');
      expect(s!.icon).toMatch(/^it_/);
    }
    expect(FARM_SUPPLIES.find((x) => x.itemId === 'farm_homi')!.shop).toBeUndefined();
  });

  it('포기당 수량 — 고추 모종 3포기 칸 18~28개 → 포기당 6~9개', () => {
    expect(perPlantYield(chili, chiliSeedling.perCell)).toEqual([6, 9]);
  });
});

describe('238차 — 육묘 트레이(씨앗 → 모종)', () => {
  it('고추 씨앗은 2~3월 집 안 선반 트레이에만 뿌린다 — 트레이가 없거나 밭이면 막힌다', () => {
    const indoor = newFarmPlot('indoor', kst(2026, 2, 10));
    const okChk = canPlant(chili, chiliSeed, indoor, indoor.cells[0], 2, ctx, kst(2026, 2, 10));
    expect(okChk.ok).toBe(true);
    const noTray = canPlant(chili, chiliSeed, indoor, indoor.cells[0], 2, { ...ctx, hasTray: false }, kst(2026, 2, 10));
    expect(noTray.ok).toBe(false);
    expect(noTray.reasonKo).toContain('육묘 트레이');
    const late = canPlant(chili, chiliSeed, indoor, indoor.cells[0], 5, ctx, kst(2026, 5, 10));
    expect(late.ok).toBe(false);
    expect(late.reasonKo).toContain('2~3월');
    const plot = newFarmPlot('plot', kst(2026, 3, 10));
    plot.cells[0].tilled = true;
    const field = canPlant(chili, chiliSeed, plot, plot.cells[0], 3, ctx, kst(2026, 3, 10));
    expect(field.ok).toBe(false);
    expect(field.reasonKo).toContain('육묘 트레이');
  });

  it('가식을 하면 75일 뒤 모종 20~30포기를 거둔다 · 거르면 0.6배', () => {
    const run = (prick: boolean): number => {
      const t0 = kst(2026, 2, 10);
      const plot = plantedAt('chili', 'seed', t0, 'indoor');
      const cell = plot.cells[0];
      expect(cell.nursery).toBe(true);
      let t = runDays(plot, t0, 12, neverRain);
      if (prick) {
        const due = careDue(cell, chili, t);
        expect(due.map((d) => d.def.id)).toEqual(['prick_out']);
        const r = doCare(cell, chili, 'prick_out', t, 1);
        expect(r.ok).toBe(true);
        expect(careDue(cell, chili, t)).toEqual([]);
      }
      t = runDays(plot, t, 70, neverRain);
      expect(cellReady(cell)).toBe(true);
      expect(harvestPreview(cell, chili)).toEqual({ itemId: 'sdl_chili', seedling: true });
      const h = harvestCell(cell, half)!;
      expect(h.seedling).toBe(true);
      expect(h.itemId).toBe('sdl_chili');
      expect(cell.cropId).toBeNull();
      return h.qty;
    };
    const withPrick = run(true);
    const without = run(false);
    expect(withPrick).toBeGreaterThanOrEqual(18);
    expect(withPrick).toBeLessThanOrEqual(30);
    expect(without).toBeLessThan(withPrick);
    expect(without / withPrick).toBeCloseTo(0.6, 1);
    // 거둔 모종은 그대로 고추 모종 심기로 이어진다
    expect(cropStartOfItem('sdl_chili')!.start.kind).toBe('seedling');
  });

  it('트레이 씨앗의 칸 · 날 값은 0(수확물이 아니라 모종)', () => {
    expect(cropDailyValue(chili, 'seed')).toBe(0);
    expect(cropDailyValue(chili, 'seedling')).toBeLessThan(1000);
  });
});

describe('238차 — 늦서리 · 첫서리', () => {
  it('늦서리(4월 10~24일) 전에는 고추 모종을 밭에 못 심고, 지난 뒤 4월에도 기온 10℃ 밑이면 막는다', () => {
    const plot = newFarmPlot('plot', 0);
    plot.cells[0].tilled = true;
    const lf = lastFrostDayIndex(2026);
    expect(lf - dayIdx(kst(2026, 4, 10))).toBeGreaterThanOrEqual(0);
    expect(lf - dayIdx(kst(2026, 4, 10))).toBeLessThan(15);
    const before = kst(2026, 4, 5);
    expect(canPlant(chili, chiliSeedling, plot, plot.cells[0], 4, ctx, before).reasonKo).toContain('늦서리');
    const after = (lf + 1) * DAY - KST + 12 * H;
    expect(canPlant(chili, chiliSeedling, plot, plot.cells[0], 4, ctx, after).ok).toBe(true);
    expect(canPlant(chili, chiliSeedling, plot, plot.cells[0], 4, { ...ctx, tempC: 6 }, after).reasonKo).toContain('10℃');
    expect(canPlant(chili, chiliSeedling, plot, plot.cells[0], 5, { ...ctx, tempC: 6 }, MAY1).ok).toBe(true);
    // 서리에 상관없는 작물(상추)은 그대로
    const lettuce = getCrop('lettuce')!;
    expect(frostBlockKo(lettuce, plot, before)).toBeNull();
    // 하우스 안이면 서리를 보지 않는다
    expect(frostBlockKo(chili, { site: 'plot', facilities: ['greenhouse'] }, before)).toBeNull();
  });

  it('가을 첫서리(10월 25일~11월 13일)를 맞으면 더 자라지 않고 사흘 안에 거두면 끝 · 안 거두면 칸이 빈다', () => {
    const ff = firstFrostDayIndex(2026);
    expect(ff - dayIdx(kst(2026, 10, 25))).toBeGreaterThanOrEqual(0);
    expect(ff - dayIdx(kst(2026, 10, 25))).toBeLessThan(20);
    const t0 = kst(2026, 8, 20);
    const plot = plantedAt('chili', 'seedling', t0);
    const cell = plot.cells[0];
    let t = runDays(plot, t0, 60, alwaysRain);   // 비 = 물 · 60일이면 첫 수확
    expect(cellReady(cell)).toBe(true);
    const frostMs = ff * DAY - KST + 12 * H;
    advanceCell(plot, 0, frostMs, alwaysRain);
    expect(cell.frostedAt).toBeTruthy();
    const h = harvestCell(cell, half)!;
    expect(h.frosted).toBe(true);
    expect(cell.cropId).toBeNull();
    // 안 거두면 사흘 뒤 칸이 빈다
    const plot2 = plantedAt('chili', 'seedling', t0);
    t = runDays(plot2, t0, 60, alwaysRain);
    advanceCell(plot2, 0, frostMs, alwaysRain);
    expect(plot2.cells[0].frostedAt).toBeTruthy();
    advanceCell(plot2, 0, frostMs + (CARE_TUNING.frostGraceH + 2) * H, alwaysRain);
    expect(plot2.cells[0].cropId).toBeNull();
  });
});

describe('238차 — 작업 차례 · 놓침 · 활착', () => {
  it('정식 직후 멀칭 · 지주가 할 일이고, 20일 뒤 첫 꽃 · 곁순 · 웃거름이 열린다 · 한 일은 다시 뜨지 않는다', () => {
    const plot = plantedAt('chili', 'seedling', MAY1);
    const cell = plot.cells[0];
    // 막 심은 날 — 방제(철)는 포기가 자리 잡은 뒤에야 뜬다
    expect(careDue(cell, chili, MAY1).map((s) => s.def.id)).toEqual(['ridge_mulch', 'stake']);
    expect(inEstablishment(cell, chili, MAY1)).toEqual({ daysLeft: 14 });
    const r = doCare(cell, chili, 'stake', MAY1, 1);
    expect(r.ok).toBe(true);
    expect(r.needs).toEqual([{ itemId: STAKE_ID, qty: 3 }, { itemId: TWINE_ID, qty: 1 }]);
    expect(careDue(cell, chili, MAY1).map((s) => s.def.id)).toEqual(['ridge_mulch']);
    expect(doCare(cell, chili, 'pinch_flower', MAY1, 1).ok).toBe(false);   // 아직 때가 아니다
    const t20 = runDays(plot, MAY1, 20, neverRain);
    expect(inEstablishment(cell, chili, t20)).toBeNull();
    const due = careDue(cell, chili, t20).map((s) => s.def.id);
    expect(due).toContain('pinch_flower');
    expect(due).toContain('remove_suckers');
    expect(due).toContain('topdress');
    expect(due).not.toContain('ridge_mulch');   // 창(7일)이 닫혀 놓쳤다
    expect(cell.care?.ridge_mulch?.skipped).toBe(1);
    // 5월은 방제 철 — 살균제 · 살충제가 보인다 · 병이 없으니 걷어 내기는 없다
    expect(due).toContain('spray_fungicide');
    expect(due).not.toContain('cull_diseased');
    // 웃거름 1차를 하면 다음 차례(18일 뒤)까지 「했다」
    expect(doCare(cell, chili, 'topdress', t20, 1).ok).toBe(true);
    const top = careStatusList(cell, chili, t20).find((s) => s.def.id === 'topdress')!;
    expect(top.status).toBe('done');
    expect(top.round).toBe(1);
    expect(top.total).toBe(5);
    expect(top.daysLeft).toBeGreaterThan(10);
  });

  it('서툴면(점수 낮음) 효과가 절반 — 살균제 보호 기간 · 배수', () => {
    const t = kst(2026, 6, 10);
    const plot = plantedAt('chili', 'seedling', MAY1);
    runDays(plot, MAY1, 40, neverRain);
    const cell = plot.cells[0];
    const good = doCare(cell, chili, 'spray_fungicide', t, 1);
    expect(good.ok).toBe(true);
    expect(good.clumsy).toBeFalsy();
    const p = cell.protect!.anthracnose!;
    expect(p.untilMs - t).toBe(10 * DAY);
    expect(p.mult).toBe(0.25);
    cell.protect = {};
    const bad = doCare(cell, chili, 'spray_fungicide', t, 0.2);
    expect(bad.clumsy).toBe(true);
    expect(cell.protect!.anthracnose!.untilMs - t).toBe(6 * DAY);
    expect(cell.protect!.anthracnose!.mult).toBe(0.5);
  });

  it('웃거름을 한 번도 안 주면 수확 배수가 0.7 — 그래도 거둔다', () => {
    const plot = plantedAt('chili', 'seedling', MAY1);
    const cell = plot.cells[0];
    runDays(plot, MAY1, 120, neverRain);
    const missed = skipExpiredRounds(cell, chili, MAY1 + 120 * DAY);
    expect(missed).toEqual([]);   // 이미 날마다 넘겼다
    expect(cell.care?.topdress?.skipped).toBe(5);
    // 0.93^5 ≈ 0.70 × 첫 꽃 0.92 × 곁순 0.95² × 유인 0.95² (지주 · 멀칭은 수확 배수를 깎지 않는다 — 쓰러짐 · 병)
    const expected = Math.pow(0.93, 5) * 0.92 * Math.pow(0.95, 2) * Math.pow(0.95, 2);
    expect(cell.careYield!).toBeCloseTo(expected, 2);
    // 지주를 안 세웠으니 비바람에 쓰러질 수 있다 — 젖은 날이 이어지면 거의 반드시
    const t2 = runDays(plot, MAY1 + 120 * DAY, 30, alwaysRain);
    expect(cell.lodged).toBe(true);
    expect(cellReady(cell) || cell.regrow < 1).toBe(true);
    void t2;
  });

  it('활착기 2주에 물을 안 주면 섬이 준다(바닥 0.3) · 주면 그대로', () => {
    const dry = plantedAt('chili', 'seedling', MAY1);
    const wet = plantedAt('chili', 'seedling', MAY1);
    const s0 = dry.cells[0].stand;
    runDays(dry, MAY1, 14, neverRain, false);
    runDays(wet, MAY1, 14, neverRain, true);
    expect(dry.cells[0].stand).toBeLessThan(s0);
    expect(dry.cells[0].stand).toBeGreaterThanOrEqual(CARE_TUNING.establishFloor);
    expect(dry.cells[0].establishDryH).toBeGreaterThan(200);
    expect(wet.cells[0].stand).toBeCloseTo(s0, 5);
  });
});

describe('238차 — 병해 3종', () => {
  function summer(care: boolean): { cell: FarmCellState; plot: FarmPlotState; t: number } {
    const plot = plantedAt('chili', 'seedling', MAY1);
    const cell = plot.cells[0];
    let t = MAY1;
    for (let d = 0; d < 110; d++) {
      t += DAY;
      waterCell(cell);
      advanceCell(plot, 0, t, d % 3 === 0 ? alwaysRain : neverRain);   // 사흘에 하루 비
      if (care) {
        for (const s of careDue(cell, chili, t)) doCare(cell, chili, s.def.id, t, 1);
      }
    }
    return { cell, plot, t };
  }

  it('방제 없이 여름을 나면 병이 든다 · 심한 정도는 0~1 · 품질 · 섬이 준다', () => {
    const { cell } = summer(false);
    const ds = cellDiseases(cell);
    expect(ds.length).toBeGreaterThan(0);
    for (const d of ds) { expect(d.severity).toBeGreaterThan(0); expect(d.severity).toBeLessThanOrEqual(1); }
    expect(cell.quality).toBeLessThan(FARM_TUNING.startQuality.seedling + 0.001);
  });

  it('철마다 약을 치고 걷어 내면 병이 훨씬 덜하다(결정적 비교)', () => {
    const bare = summer(false);
    const kept = summer(true);
    const sum = (c: FarmCellState): number => cellDiseases(c).reduce((a, d) => a + d.severity, 0);
    expect(sum(kept.cell)).toBeLessThan(sum(bare.cell));
    expect(diseaseYieldMult(kept.cell)).toBeGreaterThanOrEqual(diseaseYieldMult(bare.cell));
  });

  it('세 병이 다 번지면 한 번에 한 개 날까 말까 — 그래도 0은 아니다', () => {
    const plot = plantedAt('chili', 'seedling', MAY1);
    const cell = plot.cells[0];
    runDays(plot, MAY1, 60, alwaysRain);
    expect(cellReady(cell)).toBe(true);
    cell.diseases = { blight: { severity: 1, sinceMs: 0 }, anthracnose: { severity: 1, sinceMs: 0 }, virus: { severity: 1, sinceMs: 0 } };
    cell.stand = CARE_TUNING.blightStandFloor;   // 역병이 포기를 다 죽인 뒤 바닥
    expect(diseaseYieldMult(cell)).toBeCloseTo((1 - 0.6) * (1 - 0.5), 5);
    const h = harvestCell(cell, half)!;
    expect(h.qty).toBeGreaterThanOrEqual(1);
    expect(h.qty).toBeLessThanOrEqual(2);
    expect(h.diseaseMult).toBeCloseTo(0.2, 5);
  });

  it('걷어 내기는 병이 있을 때만 뜨고, 하면 심한 정도가 준다', () => {
    const plot = plantedAt('chili', 'seedling', MAY1);
    const cell = plot.cells[0];
    const t = runDays(plot, MAY1, 30, neverRain);
    cell.diseases = {};   // 5월에도 바이러스가 들 수 있다(결정적 해시) — 비교를 위해 비운다
    expect(careDue(cell, chili, t).some((s) => s.def.id === 'cull_diseased')).toBe(false);
    cell.diseases = { anthracnose: { severity: 0.6, sinceMs: t } };
    expect(careDue(cell, chili, t).some((s) => s.def.id === 'cull_diseased')).toBe(true);
    expect(doCare(cell, chili, 'cull_diseased', t, 1).ok).toBe(true);
    expect(cell.diseases.anthracnose!.severity).toBeCloseTo(0.2, 5);
    // 사흘 안에는 다시 못 한다
    expect(doCare(cell, chili, 'cull_diseased', t + DAY, 1).ok).toBe(false);
    expect(doCare(cell, chili, 'cull_diseased', t + 4 * DAY, 1).ok).toBe(true);
    expect(cell.diseases.anthracnose).toBeUndefined();
  });
});

describe('238차 — 풋고추 · 검붉은 고추 · 홍고추', () => {
  it('익은 뒤 4일까지 풋고추 · 10일까지 검붉게 · 그 뒤 홍고추 — 검붉은 채로 거두면 홍고추지만 품질이 깎인다', () => {
    const mk = (ripeDays: number): FarmCellState => {
      const plot = plantedAt('chili', 'seedling', MAY1);
      runDays(plot, MAY1, 60, alwaysRain);
      const cell = plot.cells[0];
      expect(cellReady(cell)).toBe(true);
      cell.ripeH = ripeDays * 24;
      return cell;
    };
    const g = mk(2);
    expect(ripeStageOf(g, chili)).toBe('green');
    expect(harvestPreview(g, chili).itemId).toBe('crop_chili_green');
    const q0 = g.quality;
    expect(harvestCell(g, half)!.itemId).toBe('crop_chili_green');
    const tn = mk(6);
    expect(ripeStageOf(tn, chili)).toBe('turning');
    const ht = harvestCell(tn, half)!;
    expect(ht.itemId).toBe('crop_chili_red');
    expect(ht.turning).toBe(true);
    expect(ht.quality).toBeCloseTo(q0 - CARE_TUNING.turningQuality, 5);
    const rd = mk(11);
    expect(ripeStageOf(rd, chili)).toBe('red');
    const hr = harvestCell(rd, half)!;
    expect(hr.itemId).toBe('crop_chili_red');
    expect(hr.turning).toBeUndefined();
    expect(hr.quality).toBeCloseTo(q0, 5);
  });
});
