/**
 * @file TideLoreStore.ts
 * @description 물때 공략 발견 기록 (205차 — 조사 보고서 P3 「겪은 뒤에 알려 준다」).
 *
 *  - 어종별 물때 선호(`TIDE_PHASE_PREF_GROUPS`)는 미리 보이지 않는다(R2). 그 어종을
 *    **잘 무는 단계**(원배율 1.15 이상)에 낚아 올리면 그 묶음의 한 줄이 기록으로 남는다.
 *  - 남는 곳: 지역 채널 `[물때] …` 한 줄(그때 한 번) + 도감 카드 「물때」 줄(이후 계속).
 *  - 세이브: `GameState` SaveData `tideLore`(구세이브 = 빈 기록).
 */

import {
  isFavoredTidePhase, tidePhasePrefGroupOf, TIDE_PREF_PHASE_ORDER, TIDE_FLOW_LABEL_KO,
  type TideFlowPhase, type TidePhasePrefGroup,
} from '@tra/core';

export interface TideLoreSaveState {
  /** 기록된 묶음 id */
  groups: string[];
}

class TideLoreStoreImpl {
  private learned = new Set<string>();

  /**
   * 어획 1건을 본다 — 이 어종이 잘 무는 단계에 잡혔고 아직 기록이 없으면 기록하고 그 묶음을 돌려준다.
   * @returns 새로 알게 된 묶음(없으면 null)
   */
  observeCatch(speciesId: string, phase: TideFlowPhase | null | undefined): TidePhasePrefGroup | null {
    if (!phase) return null;
    const g = tidePhasePrefGroupOf(speciesId);
    if (!g || this.learned.has(g.id)) return null;
    if (!isFavoredTidePhase(speciesId, phase)) return null;
    this.learned.add(g.id);
    return g;
  }

  /** 이 어종의 물때 기록을 알고 있나 */
  knows(speciesId: string): boolean {
    const g = tidePhasePrefGroupOf(speciesId);
    return !!g && this.learned.has(g.id);
  }

  /** 도감 한 줄 — 잘 무는 단계 이름(최대 `max`개 · 배율 높은 순). 모르면 null */
  favoredLabel(speciesId: string, max = 2): string | null {
    const g = tidePhasePrefGroupOf(speciesId);
    if (!g || !this.learned.has(g.id)) return null;
    const best = TIDE_PREF_PHASE_ORDER
      .filter((p) => (g.bite[p] ?? 1) >= 1.15)
      .sort((a, b) => (g.bite[b] ?? 1) - (g.bite[a] ?? 1))
      .slice(0, max)
      .map((p) => TIDE_FLOW_LABEL_KO[p]);
    return best.length ? best.join(' · ') : null;
  }

  /** dev·하네스 — 기록된 묶음 수 */
  get count(): number { return this.learned.size; }

  serialize(): TideLoreSaveState {
    return { groups: [...this.learned] };
  }

  deserialize(s: TideLoreSaveState | undefined): void {
    this.learned = new Set((s?.groups ?? []).filter((id) => typeof id === 'string'));
  }

  resetAll(): void { this.learned.clear(); }
}

export const TideLoreStore = new TideLoreStoreImpl();
// dev 전용 — 하네스가 게임과 같은 인스턴스를 보게(모듈 import는 다른 인스턴스를 잡는다)
if (import.meta.env.DEV) (globalThis as unknown as { __TIDELORE?: unknown }).__TIDELORE = TideLoreStore;
