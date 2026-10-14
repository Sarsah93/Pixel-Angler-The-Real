/**
 * @file CropCare245.test.ts
 * @description 245차 — 작물 84종의 일 · 병해충 16종 · 달력 · 자람 · 거둘 때마다 차례 · 면제 · 씨앗 칸 · 여러해살이 작기 · 난이도 무게 시험
 *              (사용자 「고추처럼 각 농작물에 대한 난이도를 추가해줘」)
 */
import { describe, expect, it } from 'vitest';
import { newFarmPlot, plantCell, advanceCell, harvestCell } from './FarmSim.js';
import {
  careStatusList, careDue, doCare, skipExpiredRounds, dailyCare, windowKeyAt, lastEndedWindow, daysUntilWindow, careTierScale,
  inEstablishment,
} from './CropCareSim.js';
import { CROP_DATABASE, getCrop, FARM_SUPPLIES } from '../db-schema/CropDatabase.js';
import {
  carePlanOf, hasCarePlan, carePlanSummaryKo, carePlanSummaryEn, CARE_TASK_KO, CARE_TASK_EN, DISEASE_KO, DISEASE_EN, DISEASE_SYMPTOM_KO,
  DISEASE_SYMPTOM_EN, DISEASE_CONTROL_KO, DISEASE_CONTROL_EN, riskMonthsOf, taskWhenKo, monthsKo, diseaseOnsetKo,
  NET_ID, BIRD_NET_ID, FLEECE_ID, STRAW_ID, TRELLIS_ID, PEAT_ID, SHEARS_ID, FARM_HOMI_ID,
} from '../db-schema/CropCareDatabase.js';
import type { FarmEnv, FarmPlotState } from '../types/Farming.js';

const H = 3_600_000;
const DAY = 86_400_000;
const KST = 9 * H;
const kst = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d) - KST;
const neverRain: FarmEnv = { rainAt: () => false };
const half = (): number => 0.5;
const ctx = { hasSkill: () => true, hasTray: true };

function planted(cropId: string, kind: 'seed' | 'seedling' | 'set', atMs: number, site: 'plot' | 'indoor' = 'plot'): FarmPlotState {
  const plot = newFarmPlot(site, atMs);
  const cell = plot.cells[0];
  cell.tilled = true;
  const crop = getCrop(cropId)!;
  plantCell(cell, crop, crop.starts.find((s) => s.kind === kind)!, atMs, half, ctx);
  return plot;
}

describe('245차 — 84종 전부 관리 표', () => {
  it('모든 작물에 일이 있고 · 방법은 ko/en · 자재는 농자재 표 · 도구는 닳지 않는 것 · 약은 그 작물 병만 막는다', () => {
    for (const c of CROP_DATABASE) {
      expect(hasCarePlan(c), c.id).toBe(true);
      const plan = carePlanOf(c);
      for (const t of plan.tasks) {
        expect(CARE_TASK_KO[t.id], t.id).toBeTruthy();
        expect(CARE_TASK_EN[t.id], t.id).toBeTruthy();
        expect(t.howKo.length, `${c.id}:${t.id}`).toBeGreaterThan(8);
        expect(t.howEn.length, `${c.id}:${t.id}`).toBeGreaterThan(8);
        expect(t.howEn, `${c.id}:${t.id}`).not.toMatch(/[가-힣]/);
        for (const n of t.needs ?? []) expect(FARM_SUPPLIES.some((s) => s.itemId === n.itemId), n.itemId).toBe(true);
        for (const tool of t.tools ?? []) expect(FARM_SUPPLIES.find((s) => s.itemId === tool)?.kind, tool).toBe('tool');
        for (const p of t.effect?.protect ?? []) expect(plan.diseases, `${c.id}:${t.id}`).toContain(p.disease);
        for (const d of t.onlyFor ?? []) expect(plan.diseases, `${c.id}:${t.id}`).toContain(d);
      }
      for (const d of plan.diseases) {
        for (const tbl of [DISEASE_KO, DISEASE_EN, DISEASE_SYMPTOM_KO, DISEASE_SYMPTOM_EN, DISEASE_CONTROL_KO, DISEASE_CONTROL_EN]) expect(tbl[d], d).toBeTruthy();
        // 든 것이 있으면 손쓸 일이 있다 — 걷어 내기 · 벌레 잡기 · 약 · 망 · 멀칭
        const remedy = plan.tasks.some((t) => (t.only === 'diseased' && (!t.onlyFor || t.onlyFor.includes(d)))
          || !!t.effect?.protect?.some((p) => p.disease === d) || (t.effect?.diseaseMult?.[d] ?? 1) < 1);
        expect(remedy, `${c.id}:${d}`).toBe(true);
      }
      expect(carePlanSummaryKo(c).length, c.id).toBeGreaterThan(0);
      expect(carePlanSummaryEn(c), c.id).not.toMatch(/[가-힣]/);
    }
  });

  it('난이도가 오를수록 손이 많이 간다 — 쉬움 < 보통 < 까다로움(단계별 평균 일 수)', () => {
    const avg = (tier: number): number => {
      const cs = CROP_DATABASE.filter((c) => c.difficulty === tier);
      return cs.reduce((a, c) => a + carePlanOf(c).tasks.length, 0) / cs.length;
    };
    expect(avg(1)).toBeLessThan(avg(2));
    expect(avg(2)).toBeLessThan(avg(3));
    // 쉬운 작물은 놓친 일의 벌이 절반 · 병해충이 덜 든다 — 보통 이상은 238차 그대로
    expect(careTierScale(getCrop('lettuce')!)).toEqual({ missed: 0.5, disease: 0.6, spread: 0.7 });
    expect(careTierScale(getCrop('chili')!)).toEqual({ missed: 1, disease: 1, spread: 1 });
  });

  it('새 자재 7종은 종묘사가 판다 · 전정가위 · 호미는 도구', () => {
    for (const id of [NET_ID, BIRD_NET_ID, FLEECE_ID, STRAW_ID, TRELLIS_ID, PEAT_ID, SHEARS_ID]) {
      const s = FARM_SUPPLIES.find((x) => x.itemId === id);
      expect(s, id).toBeTruthy();
      expect(s!.shop).toBe('nursery');
      expect(s!.icon).toMatch(/^it_/);
    }
    expect(FARM_SUPPLIES.find((x) => x.itemId === SHEARS_ID)!.kind).toBe('tool');
    expect(FARM_SUPPLIES.find((x) => x.itemId === FARM_HOMI_ID)!.kind).toBe('tool');
  });

  it('알림 문장 — 병은 생겼다 · 벌레는 붙었다 · 새는 쪼아 먹는다(받침에 맞는 조사)', () => {
    expect(diseaseOnsetKo('anthracnose')).toBe('탄저병이 생겼다');
    expect(diseaseOnsetKo('caterpillar')).toBe('애벌레가 붙었다');
    expect(diseaseOnsetKo('aphid')).toBe('진딧물이 붙었다');
    expect(diseaseOnsetKo('birds')).toBe('새가 쪼아 먹기 시작했다');
  });
});

describe('245차 — 때를 세는 네 가지', () => {
  it('씨앗 칸만 — 상추를 씨앗으로 뿌린 칸에만 솎아 주기가 있다', () => {
    const lettuce = getCrop('lettuce')!;
    const t0 = kst(2026, 4, 5);
    const seed = planted('lettuce', 'seed', t0);
    const sdl = planted('lettuce', 'seedling', t0);
    expect(careDue(seed.cells[0], lettuce, t0 + 14 * DAY).map((s) => s.def.id)).toContain('thin');
    expect(careStatusList(sdl.cells[0], lettuce, t0 + 14 * DAY).some((s) => s.def.id === 'thin')).toBe(false);
    // 쉬운 작물은 놓친 벌이 절반 — 솎기 0.9 → 0.95
    skipExpiredRounds(seed.cells[0], lettuce, t0 + 30 * DAY);
    expect(seed.cells[0].care?.thin?.skipped).toBe(1);
    expect(seed.cells[0].careYield).toBeCloseTo(0.95, 5);
  });

  it('달력 — 마늘 짚 덮기는 11~12월 · 안 하면 이듬해 1월에 한 번 놓침 · 구간 끝 사흘 안에 심었으면 벌 없음', () => {
    const garlic = getCrop('garlic')!;
    const p = planted('garlic', 'set', kst(2026, 10, 15));
    const c = p.cells[0];
    const up = careStatusList(c, garlic, kst(2026, 10, 20)).find((s) => s.def.id === 'straw_mulch')!;
    expect(up.status).toBe('upcoming');
    expect(up.daysLeft).toBe(12);
    expect(careDue(c, garlic, kst(2026, 11, 10)).some((s) => s.def.id === 'straw_mulch')).toBe(true);
    skipExpiredRounds(c, garlic, kst(2027, 1, 2));
    expect(c.care?.straw_mulch?.skipped).toBe(1);
    expect(c.careYield).toBeCloseTo(0.9, 5);
    skipExpiredRounds(c, garlic, kst(2027, 1, 20));
    expect(c.care?.straw_mulch?.skipped).toBe(1);   // 한 구간은 한 번만 센다
    // 한 일은 그 구간에 다시 뜨지 않고 놓침도 없다
    const c2 = planted('garlic', 'set', kst(2026, 10, 15)).cells[0];
    expect(doCare(c2, garlic, 'straw_mulch', kst(2026, 11, 20), 1).ok).toBe(true);
    expect(careDue(c2, garlic, kst(2026, 12, 5)).some((s) => s.def.id === 'straw_mulch')).toBe(false);
    skipExpiredRounds(c2, garlic, kst(2027, 1, 2));
    expect(c2.care?.straw_mulch?.skipped).toBe(0);
    // 구간이 끝나기 사흘 안에 심었으면 벌하지 않는다(할 틈이 없었다)
    const c3 = planted('garlic', 'set', kst(2026, 12, 30)).cells[0];
    skipExpiredRounds(c3, garlic, kst(2027, 1, 2));
    expect(c3.care?.straw_mulch?.skipped ?? 0).toBe(0);
  });

  it('달력 구간 계산 — 12~1월처럼 해를 넘는 구간 · 지난 구간 · 남은 날', () => {
    expect(windowKeyAt([12, 1], kst(2027, 1, 10))).toBe(2026 * 12 + 11);
    expect(windowKeyAt([12, 1], kst(2026, 12, 10))).toBe(2026 * 12 + 11);
    expect(windowKeyAt([12, 1], kst(2027, 2, 10))).toBeNull();
    expect(lastEndedWindow([12, 1], kst(2027, 2, 10))).toEqual({ key: 2026 * 12 + 11, endMs: kst(2027, 2, 1) });
    expect(daysUntilWindow([3], kst(2027, 2, 27))).toBe(2);
    expect(monthsKo([12, 1])).toBe('12~1월');
  });

  it('자람 — 배추 묶기는 자람 70~95% · 지나면 놓침(쉬운 작물이라 벌 절반)', () => {
    const napa = getCrop('napa_cabbage')!;
    const c = planted('napa_cabbage', 'seedling', kst(2026, 8, 25)).cells[0];
    c.growth = 0.5;
    expect(careStatusList(c, napa, kst(2026, 9, 20)).find((s) => s.def.id === 'tie_head')!.status).toBe('upcoming');
    c.growth = 0.8;
    expect(careDue(c, napa, kst(2026, 10, 20)).some((s) => s.def.id === 'tie_head')).toBe(true);
    c.growth = 0.97;
    const q0 = c.quality;
    skipExpiredRounds(c, napa, kst(2026, 10, 30));
    expect(c.care?.tie_head?.skipped).toBe(1);
    expect(c.quality).toBeCloseTo(q0 - 0.06 * 0.5, 5);
  });

  it('거둘 때마다 — 부추는 벤 뒤 웃거름 · 다시 자람 60%를 넘기면 놓침', () => {
    const chive = getCrop('chive')!;
    const c = planted('chive', 'seedling', kst(2026, 4, 10)).cells[0];
    c.growth = 1;
    expect(careStatusList(c, chive, kst(2026, 5, 20)).find((s) => s.def.id === 'topdress')!.daysLeft).toBe(-1);
    expect(harvestCell(c, half)).toBeTruthy();
    expect(careDue(c, chive, kst(2026, 5, 20)).some((s) => s.def.id === 'topdress')).toBe(true);
    expect(doCare(c, chive, 'topdress', kst(2026, 5, 20), 1).ok).toBe(true);
    expect(careDue(c, chive, kst(2026, 5, 21)).some((s) => s.def.id === 'topdress')).toBe(false);
    c.regrow = 1;
    expect(harvestCell(c, half)).toBeTruthy();
    c.regrow = 0.7;
    skipExpiredRounds(c, chive, kst(2026, 6, 30));
    expect(c.care?.topdress?.skipped).toBe(1);
    expect(c.care?.topdress?.done).toBe(1);
  });

  it('면제 — 고구마 두둑에 비닐을 덮으면 김매기가 없고 놓쳐도 벌이 없다', () => {
    const sp = getCrop('sweet_potato')!;
    const t0 = kst(2026, 5, 10);
    const a = planted('sweet_potato', 'set', t0).cells[0];
    const b = planted('sweet_potato', 'set', t0).cells[0];
    expect(doCare(a, sp, 'ridge_mulch', t0 + DAY, 1).ok).toBe(true);
    expect(careStatusList(a, sp, t0 + 20 * DAY).some((s) => s.def.id === 'weed')).toBe(false);
    expect(careDue(b, sp, t0 + 20 * DAY).some((s) => s.def.id === 'weed')).toBe(true);
    skipExpiredRounds(a, sp, t0 + 60 * DAY);
    expect(a.care?.weed?.skipped ?? 0).toBe(0);
    skipExpiredRounds(b, sp, t0 + 60 * DAY);
    expect(b.care?.weed?.skipped).toBe(1);
  });
});

describe('245차 — 병해충 · 새 · 버섯 · 여러해살이', () => {
  it('약 치는 철 = 그 작물에 드는 병의 철 + 한 달 앞 · 고추 살균제는 238 그대로 5~9월 · 살균제는 그 작물 병만 막는다', () => {
    const chili = carePlanOf(getCrop('chili')!);
    const fung = chili.tasks.find((t) => t.id === 'spray_fungicide')!;
    expect(riskMonthsOf(chili, fung)).toEqual([5, 6, 7, 8, 9]);
    expect(taskWhenKo(chili, fung)).toBe('5~9월(철마다)');
    const corn = carePlanOf(getCrop('corn')!);
    expect(riskMonthsOf(corn, corn.tasks.find((t) => t.id === 'spray_insecticide')!)).toEqual([5, 6, 7, 8]);
    const cuc = carePlanOf(getCrop('cucumber')!);
    expect(cuc.tasks.find((t) => t.id === 'spray_fungicide')!.effect!.protect!.map((p) => p.disease).sort()).toEqual(['downy_mildew', 'powdery_mildew']);
  });

  it('버섯 — 칼집은 첫날 · 분무는 배지를 적신다 · 푸른곰팡이병은 집 안에서도 들고 걷어 내기가 뜬다', () => {
    const lm = getCrop('lions_mane')!;
    const p = planted('lions_mane', 'set', kst(2026, 6, 1), 'indoor');
    const c = p.cells[0];
    expect(careDue(c, lm, kst(2026, 6, 1)).map((s) => s.def.id)).toEqual(['slit_bag']);
    c.moisture = 0.3;
    expect(careDue(c, lm, kst(2026, 6, 6)).some((s) => s.def.id === 'mist')).toBe(true);
    expect(doCare(c, lm, 'mist', kst(2026, 6, 6), 1).ok).toBe(true);
    expect(c.moisture).toBe(1);
    c.growth = 0.5;
    let at = 0;
    for (let d = 0; d < 400 && !at; d++) {
      const t = kst(2026, 6, 10) + d * DAY;
      if (dailyCare(c, lm, p, t, neverRain, 0, 1).onset.includes('green_mold')) at = t;
    }
    expect(at).toBeGreaterThan(0);
    expect(careDue(c, lm, at).some((s) => s.def.id === 'cull_diseased')).toBe(true);
    // 집 안 수경 상추에는 진딧물이 들지 않는다(실내 병만)
    const lettuce = getCrop('lettuce')!;
    const ip = planted('lettuce', 'seedling', kst(2026, 4, 1), 'indoor');
    ip.cells[0].growth = 0.5;
    for (let d = 0; d < 200; d++) dailyCare(ip.cells[0], lettuce, ip, kst(2026, 4, 2) + d * DAY, neverRain, 0, 1);
    expect(ip.cells[0].diseases?.aphid).toBeUndefined();
  });

  it('새는 열매가 익을 무렵에만 온다 · 새 그물을 치면 훨씬 덜 온다(블루베리)', () => {
    const bb = getCrop('blueberry')!;
    const young = planted('blueberry', 'seedling', kst(2026, 3, 10));
    young.cells[0].growth = 0.3;
    for (let d = 0; d < 150; d++) dailyCare(young.cells[0], bb, young, kst(2026, 4, 1) + d * DAY, neverRain, 0, 1);
    expect(young.cells[0].diseases?.birds).toBeUndefined();
    const count = (net: boolean): number => {
      let n = 0;
      for (let i = 0; i < 10; i++) {
        const p = planted('blueberry', 'seedling', kst(2026, 3, 10) + i * H);
        const c = p.cells[0];
        c.growth = 0.9;
        if (net) expect(doCare(c, bb, 'bird_net', kst(2026, 5, 2), 1).ok).toBe(true);
        for (let d = 0; d < 60; d++) {
          if (dailyCare(c, bb, p, kst(2026, 5, 3) + d * DAY, neverRain, i, 1).onset.includes('birds')) { n++; break; }
        }
      }
      return n;
    };
    const bare = count(false);
    const netted = count(true);
    expect(bare).toBeGreaterThanOrEqual(8);
    expect(netted).toBeLessThan(bare);
  });

  it('활착기는 모종을 옮겨 심은 칸만 — 씨앗으로 뿌린 배추 칸은 마른 흙에도 포기가 줄지 않는다', () => {
    const napa = getCrop('napa_cabbage')!;
    const at = kst(2026, 8, 20);
    const sown = planted('napa_cabbage', 'seed', at).cells[0];
    const moved = planted('napa_cabbage', 'seedling', at).cells[0];
    expect(inEstablishment(sown, napa, at + 3 * DAY)).toBeNull();
    expect(inEstablishment(moved, napa, at + 3 * DAY)?.daysLeft).toBe(11);
  });

  it('여러해살이 — 부추가 겨울을 나면 날로 세는 일 · 병 · 관리 배수가 새 작기로(달력 일 기록은 이어진다)', () => {
    const chive = getCrop('chive')!;
    const p = planted('chive', 'seedling', kst(2026, 4, 10));
    const c = p.cells[0];
    skipExpiredRounds(c, chive, kst(2026, 6, 1));
    expect(c.care?.weed?.skipped).toBe(1);
    expect(doCare(c, chive, 'remove_flower', kst(2026, 8, 20), 1).ok).toBe(true);
    c.resting = true;
    advanceCell(p, 0, kst(2026, 12, 15), neverRain);
    expect(c.resting).toBe(false);
    expect(c.cycleAt).toBe(0);
    expect(c.care?.weed?.skipped ?? 0).toBe(0);   // 지난해 놓친 김매기는 새 작기로 넘어오지 않는다
    expect(c.care?.remove_flower?.done).toBe(1);
    expect(c.careYield).toBe(1);
    advanceCell(p, 0, kst(2027, 3, 5), neverRain);
    expect(c.cycleAt!).toBeGreaterThanOrEqual(kst(2027, 3, 1));
    expect(careDue(c, chive, c.cycleAt! + 12 * DAY).some((s) => s.def.id === 'weed')).toBe(true);
  });
});
