/**
 * @file Upkeep.test.ts
 * @description 236차 — 수경 재배기 전기료 · 농지 사용료(정기 지출) · 단전 · 빌린 밭 묶임 · 구획 상한 · 농지 이용권 요건 시험
 */
import { describe, expect, it } from 'vitest';
import { listUpkeep, upkeepPenalty, POWER_UPKEEP_KEY, FARM_RENT_UPKEEP_KEY } from './Upkeep.js';
import { TUNING } from '../config/tuning.js';
import { farmPlotCap, rentedPlotCount, FARM_TUNING } from '../simulation/FarmSim.js';
import { LICENSE_DATABASE, checkUnlockRequirements } from '../types/License.js';

const base = { heldLicenses: [], licenseDef: () => undefined };

describe('수경 재배기 전기료', () => {
  it('재배기가 없으면 청구가 없다', () => {
    expect(listUpkeep({ ...base, day: 10, ledger: {}, hydroRacks: 0 })).toHaveLength(0);
  });

  it('대수만큼 · 30일마다 · 기산일부터 센다', () => {
    const items = listUpkeep({ ...base, day: 10, ledger: { [POWER_UPKEEP_KEY]: 5 }, hydroRacks: 2 });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('electricity');
    expect(items[0].costKrw).toBe(TUNING.upkeep.hydroPowerKrw * 2);
    expect(items[0].intervalDays).toBe(TUNING.upkeep.hydroPowerDays);
    expect(items[0].dueDay).toBe(5 + TUNING.upkeep.hydroPowerDays);
  });

  it('밀리면 단전 — 항구 신뢰는 깎지 않는다', () => {
    const items = listUpkeep({ ...base, day: 50, ledger: { [POWER_UPKEEP_KEY]: 5 }, hydroRacks: 1 });
    expect(items[0].overdue).toBe(true);
    const pen = upkeepPenalty(items);
    expect(pen.powerCut).toBe(true);
    expect(pen.repPerDay).toBe(0);
    expect(pen.blockConsign).toBe(false);
  });

  it('제때 냈으면 단전이 아니다', () => {
    const items = listUpkeep({ ...base, day: 30, ledger: { [POWER_UPKEEP_KEY]: 5 }, hydroRacks: 1 });
    expect(upkeepPenalty(items).powerCut).toBe(false);
  });
});

describe('농지 사용료 · 구획 상한', () => {
  it('마당 두 구획은 자격 없이 · 농지 이용권이면 다섯 구획 더', () => {
    expect(farmPlotCap(false)).toBe(FARM_TUNING.yardPlots);
    expect(farmPlotCap(true)).toBe(FARM_TUNING.yardPlots + FARM_TUNING.rentPlotsMax);
    expect(FARM_TUNING.yardPlots).toBe(2);
    expect(FARM_TUNING.rentPlotsMax).toBe(5);
  });

  it('빌린 구획 = 마당 구획을 넘는 수', () => {
    expect(rentedPlotCount(0)).toBe(0);
    expect(rentedPlotCount(2)).toBe(0);
    expect(rentedPlotCount(3)).toBe(1);
    expect(rentedPlotCount(7)).toBe(5);
  });

  it('빌린 구획마다 30일 사용료 — 마당만 쓰면 청구가 없다', () => {
    expect(listUpkeep({ ...base, day: 10, ledger: {}, rentedPlots: 0 })).toHaveLength(0);
    const items = listUpkeep({ ...base, day: 10, ledger: { [FARM_RENT_UPKEEP_KEY]: 4 }, rentedPlots: 3 });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('farm_rent');
    expect(items[0].nameKo).toBe('농지 사용료 (3구획)');
    expect(items[0].costKrw).toBe(TUNING.upkeep.farmRentKrw * 3);
    expect(items[0].dueDay).toBe(4 + TUNING.upkeep.farmRentDays);
  });

  it('밀리면 빌린 밭이 묶일 뿐 — 항구 신뢰 · 위판은 그대로', () => {
    const items = listUpkeep({ ...base, day: 60, ledger: { [FARM_RENT_UPKEEP_KEY]: 4 }, rentedPlots: 1 });
    const pen = upkeepPenalty(items);
    expect(pen.rentOverdue).toBe(true);
    expect(pen.powerCut).toBe(false);
    expect(pen.repPerDay).toBe(0);
    expect(pen.blockConsign).toBe(false);
  });

  it('전기료 · 사용료가 같이 밀려도 둘은 따로 판정한다', () => {
    const items = listUpkeep({ ...base, day: 60, ledger: { [FARM_RENT_UPKEEP_KEY]: 40, [POWER_UPKEEP_KEY]: 4 }, rentedPlots: 1, hydroRacks: 1 });
    const pen = upkeepPenalty(items);
    expect(pen.powerCut).toBe(true);
    expect(pen.rentOverdue).toBe(false);
  });
});

describe('농지 이용권', () => {
  const def = LICENSE_DATABASE.find((l) => l.type === 'farmland_use')!;
  const ctx = {
    totalTrips: 0, totalFishCaught: 0, caughtFishIds: [], coins: 0, heldLicenses: [], completedQuests: [],
    visitedSpots: [], reputationScore: 0,
  };

  it('텃밭에서 세 번 거둬 본 사람에게 — 출조 실적 · 주택 부지 허가는 묻지 않는다', () => {
    expect(def.prerequisites).toEqual(['basic_angling']);
    expect(checkUnlockRequirements(def.requirements, { ...ctx, farmHarvests: 2 }).met).toBe(false);
    expect(checkUnlockRequirements(def.requirements, { ...ctx, farmHarvests: 3 }).met).toBe(true);
    // 구 호출(거둔 횟수를 모르는 곳)은 0번으로 본다
    expect(checkUnlockRequirements(def.requirements, ctx).met).toBe(false);
  });

  it('되풀이 비용은 갱신료가 아니라 구획 사용료다(이중 청구 없음)', () => {
    expect(def.requiresRenewal).toBe(false);
    const items = listUpkeep({ ...base, heldLicenses: ['farmland_use'], licenseDef: () => def, day: 400, ledger: {} });
    expect(items).toHaveLength(0);
  });
});
