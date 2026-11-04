/**
 * @file RegionalPlotStore.ts
 * @description 300차 — 지역 텃밭 1단계: **그 고장 종묘사에서 빌린 밭** 계약(고장마다 하나 · 주 단위 선납 사용료).
 *
 *  - 빌리기 = 첫 주 사용료를 내고 계약을 적는다. 텃밭 구획은 `FarmStore`에 `rent:<고장>`(4칸 · 갈아 둔 흙 · 빗물통 = 종묘사가 물을 준다)로 만든다.
 *  - 창을 열 때마다 `settle` — 밀린 주를 차례로 낸다. 못 내면 구획에 잠금(`FarmStore.setPlotLock`) → 새로 심지 못한다(거두기 · 물 주기는 된다).
 *  - 돌려주기 = 심어 둔 것이 없을 때만. 설비는 종묘사 것이라 돌려받지 않는다.
 *  - 세이브 `regionalPlots`(구세이브 = 없음). 구획 칸은 텃밭 세이브(`farm.plots`)가 들고 있다.
 *  거둔 것의 산지는 `GameState.originRegionId`(창은 그 고장 종묘사 안에서만 열린다 = 지금 지역) — 295차 특산 봉인이 그대로 찍힌다.
 */

import {
  regionalPlotOffer, regionalPlotId, newPlotContract, settlePlotRent, plotRentDueWeeks,
  type RegionalPlotContract, type RegionalPlotOffer, type PlotRentSettle,
} from '@tra/core';
import { GameState } from './GameState.js';
import { FarmStore } from './FarmStore.js';

export interface RegionalPlotSave {
  v: 1;
  contracts: RegionalPlotContract[];
}

/** 사용료가 밀렸을 때 새로 심지 못하는 까닭(텃밭 창 심기 목록 · 상태 줄) */
export const PLOT_RENT_LOCK_KO = '사용료가 밀려 새로 심을 수 없다 — 돈을 마련해 밭 창을 다시 열면 바로 풀린다';

class RegionalPlotStoreImpl {
  private contracts = new Map<string, RegionalPlotContract>();

  offerOf(regionId: string): RegionalPlotOffer | undefined { return regionalPlotOffer(regionId); }
  contract(regionId: string): RegionalPlotContract | undefined { return this.contracts.get(regionId); }
  has(regionId: string): boolean { return this.contracts.has(regionId); }
  /** 빌린 고장 전부(일지 · 알림) */
  get all(): RegionalPlotContract[] { return [...this.contracts.values()]; }

  /** 밭을 빌린다 — 첫 주 사용료 선납 · 구획 생성 */
  rent(regionId: string, nowMs = Date.now()): { ok: boolean; message?: string } {
    const offer = regionalPlotOffer(regionId);
    if (!offer) return { ok: false, message: '여기서는 빌릴 밭이 없다' };
    if (this.contracts.has(regionId)) return { ok: false, message: '이미 빌린 밭이 있다' };
    if (!GameState.addCoins(-offer.weeklyFeeWon, false, 'upkeep')) return { ok: false, message: `첫 주 사용료 ${offer.weeklyFeeWon.toLocaleString()}원이 모자라다` };
    this.contracts.set(regionId, newPlotContract(regionId, nowMs));
    FarmStore.ensureRegionalPlot(regionalPlotId(regionId), offer.cells);
    FarmStore.setPlotLock(regionalPlotId(regionId), null);
    GameState.markDirty();
    return { ok: true };
  }

  /** 밀린 주를 낸다(돈이 있는 만큼) — 결과에 따라 구획 잠금을 켜고 끈다 */
  settle(regionId: string, nowMs = Date.now()): PlotRentSettle {
    const c = this.contracts.get(regionId);
    const offer = regionalPlotOffer(regionId);
    if (!c || !offer) return { paidWeeks: 0, paidWon: 0, overdue: false, dueWeeks: 0 };
    const r = settlePlotRent(c, nowMs, offer.weeklyFeeWon, (won) => GameState.addCoins(-won, false, 'upkeep'));
    FarmStore.setPlotLock(regionalPlotId(regionId), r.overdue ? PLOT_RENT_LOCK_KO : null);
    if (r.paidWeeks > 0) GameState.markDirty();
    return r;
  }

  /** 지금 밀려 있는가(창을 열지 않고도 — 일지 · 안내) */
  overdue(regionId: string, nowMs = Date.now()): boolean {
    const c = this.contracts.get(regionId);
    return !!c && plotRentDueWeeks(c, nowMs) > 0;
  }

  /** 밭을 돌려준다 — 심어 둔 것이 없을 때만. 설비는 종묘사 것 */
  returnPlot(regionId: string): { ok: boolean; message?: string } {
    if (!this.contracts.has(regionId)) return { ok: false, message: '빌린 밭이 없다' };
    const r = FarmStore.removeRegionalPlot(regionalPlotId(regionId));
    if (!r.ok) return r;
    this.contracts.delete(regionId);
    GameState.markDirty();
    return { ok: true };
  }

  serialize(): RegionalPlotSave {
    return { v: 1, contracts: this.all.map((c) => ({ ...c })) };
  }

  deserialize(s: RegionalPlotSave | undefined | null): void {
    this.contracts.clear();
    if (!s?.contracts) return;
    for (const c of s.contracts) {
      if (!c || typeof c.regionId !== 'string' || !regionalPlotOffer(c.regionId)) continue;   // 표에서 사라진 고장은 버린다
      const startedMs = Number.isFinite(c.startedMs) ? c.startedMs : Date.now();
      const paidUntilMs = Number.isFinite(c.paidUntilMs) ? c.paidUntilMs : startedMs;
      this.contracts.set(c.regionId, { regionId: c.regionId, startedMs, paidUntilMs });
      // 구획이 세이브에 없으면(어긋난 세이브) 빈 구획으로 되살린다
      FarmStore.ensureRegionalPlot(regionalPlotId(c.regionId), regionalPlotOffer(c.regionId)?.cells ?? 4);
      FarmStore.setPlotLock(regionalPlotId(c.regionId), plotRentDueWeeks(this.contracts.get(c.regionId)!, Date.now()) > 0 ? PLOT_RENT_LOCK_KO : null);
    }
  }

  resetAll(): void { this.contracts.clear(); }
}

export const RegionalPlotStore = new RegionalPlotStoreImpl();

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__RPLOT = RegionalPlotStore;
}
