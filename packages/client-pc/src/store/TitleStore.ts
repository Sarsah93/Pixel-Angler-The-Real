/**
 * @file TitleStore.ts
 * @description 타이틀(칭호) 업적 상태 — 행동 누적 수 · 얻은 타이틀 · 단 타이틀 · 알림 대기열 · 세이브 (203차 · 204차 재설계).
 *
 * 세는 곳(행동 훅):
 *  - `StoryStore.event`를 그대로 받는다 — 어획(밤 · 대물 점수 · 물때 단계 · 사리/조금 · 날씨 · 구멍치기 · 출조) ·
 *    금지체장 자동 방생 · 채집 · 손질 · 요리 · 통발 수거 · 자격.
 *  - 직접 부르는 곳: 스스로 놓아주기 · 캐스팅 · 들어뽕 · 줄 터짐 · 쌍걸이 · 거래 · 사시미 별 다섯 · 고양이 ·
 *    문 닫은 가게 · 위판 낙찰 · 쓰러짐 · 도감 수(`syncSpecies`).
 *  - 「꽝 조사」는 **출조** 단위 — 낚시 지역에 들어와서(`enterRegion`) 나갈 때까지 캐스팅은 했는데 한 마리도 못 잡았으면 1.
 *
 * 204차:
 *  - 조건 = 경로(OR) × 조건(AND) + 전설 레벨 문턱. 레벨은 `GameState`가 `setLevelSource`로 넣어 준다(순환 import 회피).
 *  - 물때 단계별 어획 수(`phaseCatch`)를 따로 들고 「물때표 인간」(8단계 모두 10마리)을 판정한다.
 *  - 구세이브 `trophyCatch`(60cm 마릿수) → `trophyPts`(1점씩) 백필.
 *
 * 얻으면 알림 대기열(`takePending`)에 넣는다 — 필드 · 1인칭 · 집 씬이 각자 update에서 꺼내 배너를 띄운다.
 * 아무것도 안 달았으면 첫 타이틀을 자동으로 단다.
 */

import { LedgerStore } from './LedgerStore.js';
import {
  TITLE_DATABASE, getTitleById, titleModifiers, titleBiteMultAt, titlesNewlyEarned,
  isTitleNightHour, isTitleDawnHour, trophyPointsOf, kstParts, calculateTideInfo,
  tideFlowStateAt, isSlackPhase,
  type TitleDef, type TitleModifiers, type TitleStats, type TitleStatKey, type TideFlowPhase,
} from '@tra/core';
import type { StoryEvent } from './StoryStore.js';
import { DiscoveryStore } from './DiscoveryStore.js';
import { ExternalDataStore } from './ExternalDataStore.js';

export interface TitleSaveState {
  stats: TitleStats;
  /** 가게(판매처 키)별 거래 수 — 「외상 되는 손님」은 그중 최댓값 */
  shopTrades: Record<string, number>;
  /** 204차 — 물때 단계별 어획 수(「물때표 인간」) */
  phaseCatch?: Partial<Record<TideFlowPhase, number>>;
  /** 얻은 순서대로 */
  owned: string[];
  equipped: string | null;
  /** 진행 중인 출조(구세이브 = 없음) */
  trip: { region: string; casts: number; catches: number } | null;
}

/** 「물때표 인간」 — 한 단계를 「겪어 봤다」고 치는 어획 수 */
const PHASE_COVER_MIN = 10;

/** 지금 KST 시(0~23) */
function kstHourNow(): number { return Number(kstParts(new Date()).hh); }

/** 비·눈 */
function isFoul(regionId: string | undefined): boolean {
  if (!regionId) return false;
  const wk = ExternalDataStore.getWeatherKind(regionId);
  return wk === 'rain' || wk === 'shower' || wk === 'sleet' || wk === 'snow';
}

class TitleStoreImpl {
  private stats: TitleStats = {};
  private shopTrades: Record<string, number> = {};
  private phaseCatch: Partial<Record<TideFlowPhase, number>> = {};
  private owned: string[] = [];
  private equipped: string | null = null;
  private trip: TitleSaveState['trip'] = null;
  private pending: TitleDef[] = [];
  private mods: TitleModifiers = titleModifiers(null);
  private readonly changeListeners = new Set<() => void>();
  private levelOf: () => number = () => 1;

  /** GameState가 레벨 조회 함수를 넣어 준다(전설 문턱) */
  setLevelSource(fn: () => number): void { this.levelOf = fn; }

  // ── 조회 ──
  stat(k: TitleStatKey): number { return this.stats[k] ?? 0; }
  ownedIds(): readonly string[] { return this.owned; }
  ownedDefs(): TitleDef[] { return this.owned.map((id) => getTitleById(id)).filter((d): d is TitleDef => !!d); }
  /** 아직 못 얻은 타이틀 수 — S 창의 「??? × N」 */
  hiddenCount(): number { return TITLE_DATABASE.length - this.owned.length; }
  equippedId(): string | null { return this.equipped; }
  equippedDef(): TitleDef | null { return getTitleById(this.equipped); }
  modifiers(): TitleModifiers { return this.mods; }
  /** 지금 시각·물때·날씨의 입질 배율(밤 · 새벽 · 물때 단계 · 궂은 날 효과 포함) */
  biteMultNow(foulWeather = false): number {
    const phase = this.mods.phases.length > 0 ? tideFlowStateAt().phase : null;
    return titleBiteMultAt(this.mods, kstHourNow(), phase, foulWeather);
  }

  /** 이름표·멀티 동기화가 듣는다(장착 변경 · 새 타이틀) */
  onChange(fn: () => void): () => void { this.changeListeners.add(fn); return () => this.changeListeners.delete(fn); }
  private emit(): void { for (const fn of [...this.changeListeners]) fn(); }

  // ── 장착 ──
  equip(id: string | null): void {
    if (id !== null && !this.owned.includes(id)) return;
    this.equipped = id;
    this.mods = titleModifiers(getTitleById(id));
    this.emit();
  }

  // ── 세기 ──
  bump(k: TitleStatKey, n = 1): void {
    if (n <= 0) return;
    this.stats[k] = (this.stats[k] ?? 0) + n;
    this.check();
  }

  /** 지금 값으로 맞추는 통계(도감 수 · 자격 수) — 줄어들 수도 있다 */
  setStat(k: TitleStatKey, v: number): void {
    this.stats[k] = Math.max(0, v);
    this.check();
  }

  private add(k: TitleStatKey, n = 1): void { this.stats[k] = (this.stats[k] ?? 0) + n; }

  /** StoryStore 이벤트 버스에서 */
  onStoryEvent(ev: StoryEvent): void {
    switch (ev.kind) {
      case 'catch': {
        if (!ev.selfCaught) return;
        if (isTitleNightHour(kstHourNow())) this.add('nightCatch');
        const pts = trophyPointsOf(ev.lengthCm);
        if (pts > 0) this.add('trophyPts', pts);
        if (this.trip) this.trip.catches++;
        // 물때 — 낚싯대로 잡은 것만(채집·통발은 따로 센다)
        if (ev.method === 'rod') {
          const phase = tideFlowStateAt().phase;
          this.phaseCatch[phase] = (this.phaseCatch[phase] ?? 0) + 1;
          if (phase === 'flood_early') this.add('floodEarlyCatch');
          if (phase === 'flood_mid' || phase === 'ebb_mid') this.add('midFlowCatch');
          if (phase === 'ebb_late') this.add('ebbLateCatch');
          if (isSlackPhase(phase) && ev.lengthCm >= 50) this.add('slackBigCatch');
          this.stats.phasesCovered = Object.values(this.phaseCatch).filter((v) => (v ?? 0) >= PHASE_COVER_MIN).length;
          const moon = calculateTideInfo().tidePhase;
          if (moon >= 6 && moon <= 9) this.add('springCatch');
          if (moon >= 12) this.add('neapCatch');
          if (isFoul(ev.regionId)) this.add('foulCatch');
          if (ev.spotKind === 'hole') this.add('holeCatch');
        }
        this.syncSpecies(false);
        this.check();
        return;
      }
      case 'release': this.bump('release'); return;
      case 'activity':
        if (ev.activity === 'forage') { this.add('forage'); this.syncSpecies(); }
        else if (ev.activity === 'cook') this.bump('cookDone');
        else if (ev.activity === 'butcher') this.bump('butcherDone');
        return;
      case 'trap': this.bump('trapHarvest'); return;
      default: return;
    }
  }

  /** 캐스팅 한 번(1인칭 진입) — 새벽 캐스팅 · 출조 캐스팅 수 */
  recordCast(): void {
    if (this.trip) this.trip.casts++;
    if (isTitleDawnHour(kstHourNow())) this.bump('dawnCast');
  }

  /** 상점 거래 한 번(사기 · 팔기) — 가게(판매처)마다 센다 */
  recordTrade(branchKey: string | undefined): void {
    if (!branchKey) return;
    this.shopTrades[branchKey] = (this.shopTrades[branchKey] ?? 0) + 1;
    this.stats.shopRegular = Math.max(this.stat('shopRegular'), this.shopTrades[branchKey]);
    this.check();
  }

  /** 도감에 남은 바다 생물 수(어종 + 채집 생물)를 다시 센다 — 누적이 아니라 지금 값 */
  syncSpecies(check = true): void {
    this.stats.speciesFound = DiscoveryStore.countByKind('fish') + DiscoveryStore.countByKind('creature');
    if (check) this.check();
  }

  /**
   * 지역에 들어왔다 — 낚시 지역이면 출조를 이어 가거나 새로 시작하고, 아니면(집 동네·월드맵) 출조를 끝낸다.
   * 같은 지역에서 맵을 옮기는 재시작은 같은 출조로 본다.
   */
  enterRegion(regionId: string | null, fishing: boolean): void {
    if (fishing && regionId && this.trip?.region === regionId) return;
    this.endTrip();
    if (fishing && regionId) this.trip = { region: regionId, casts: 0, catches: 0 };
  }

  private endTrip(): void {
    const t = this.trip;
    this.trip = null;
    if (t && t.casts > 0 && t.catches === 0) this.bump('emptyTrip');
  }

  /** 레벨이 올랐을 때 — 전설 문턱을 다시 본다 */
  recheck(): void { this.check(); }

  /** 새로 얻은 타이틀 처리 — 알림 대기열 · 첫 타이틀 자동 장착 */
  private check(): void {
    // 「바다가 키운 사람」은 다른 타이틀 수를 센다 — 얻을 때마다 다시 본다(연쇄)
    for (let guard = 0; guard < 4; guard++) {
      this.stats.titlesOwned = this.owned.length;
      const fresh = titlesNewlyEarned(this.stats, new Set(this.owned), this.levelOf());
      if (fresh.length === 0) return;
      for (const d of fresh) { this.owned.push(d.id); this.pending.push(d); LedgerStore.title(d.nameKo); }   // 211차
      if (!this.equipped) this.equip(fresh[0].id);
      else this.emit();
    }
  }

  /** 씬이 배너로 띄울 다음 알림 */
  takePending(): TitleDef | undefined { return this.pending.shift(); }
  hasPending(): boolean { return this.pending.length > 0; }

  // ── 세이브 ──
  serialize(): TitleSaveState {
    return {
      stats: { ...this.stats }, shopTrades: { ...this.shopTrades }, phaseCatch: { ...this.phaseCatch },
      owned: [...this.owned], equipped: this.equipped, trip: this.trip ? { ...this.trip } : null,
    };
  }

  /** 구세이브(없음) = 0부터. 얻은 타이틀 · 장착은 그대로 보존(목표가 바뀌어도 뺏지 않는다) */
  deserialize(s: TitleSaveState | undefined): void {
    this.resetAll();
    if (!s) { this.syncSpecies(false); return; }
    this.stats = { ...(s.stats ?? {}) };
    // 204차 — 203차 세이브의 60cm 마릿수(`trophyCatch`)를 대물 점수로(1점씩)
    const legacy = (s.stats as Record<string, number> | undefined)?.trophyCatch;
    if (legacy && !this.stats.trophyPts) this.stats.trophyPts = legacy;
    delete (this.stats as Record<string, number>).trophyCatch;
    this.shopTrades = { ...(s.shopTrades ?? {}) };
    this.phaseCatch = { ...(s.phaseCatch ?? {}) };
    this.owned = (s.owned ?? []).filter((id) => !!getTitleById(id));
    this.trip = s.trip ?? null;
    this.equipped = s.equipped && this.owned.includes(s.equipped) ? s.equipped : null;
    this.mods = titleModifiers(getTitleById(this.equipped));
    // 로드 직후 조건을 다시 본다 — 구세이브에 이미 조건이 차 있으면 여기서 처음 얻는다(알림도 띄운다)
    this.syncSpecies(false);
    this.check();
    this.emit();
  }

  resetAll(): void {
    this.stats = {};
    this.shopTrades = {};
    this.phaseCatch = {};
    this.owned = [];
    this.equipped = null;
    this.trip = null;
    this.pending = [];
    this.mods = titleModifiers(null);
  }
}

export const TitleStore = new TitleStoreImpl();

// dev 하네스용 — import 인스턴스 분화 회피(`__INV`/`__GS`와 같은 규칙)
if (import.meta.env?.DEV) (globalThis as unknown as { __TITLE?: unknown }).__TITLE = TitleStore;
