/**
 * @file TitleStore.ts
 * @description 타이틀(칭호) 업적 상태 (203차) — 행동 누적 수 · 얻은 타이틀 · 단 타이틀 · 알림 대기열 · 세이브.
 *
 * 세는 곳(행동 훅):
 *  - `StoryStore.event`(catch · release)를 그대로 받는다 — 밤 어획 · 대물 · 출조 어획 · 금지체장 자동 방생.
 *  - 직접 부르는 곳: 스스로 놓아주기(결정 패널 · 쿨러 · 정리 창) · 캐스팅 · 들어뽕 · 줄 터짐 · 거래 · 사시미 별 다섯 ·
 *    고양이 · 문 닫은 가게 · 도감 수(`syncSpecies`).
 *  - 「빈 쿨러」는 **출조** 단위 — 낚시 지역에 들어와서(`enterRegion`) 나갈 때까지 캐스팅은 했는데 한 마리도 못 잡았으면 1.
 *
 * 얻으면 알림 대기열(`takePending`)에 넣는다 — 필드 · 1인칭 · 집 씬이 각자 update에서 꺼내 배너를 띄운다
 * (일시정지된 씬은 못 그리므로 지금 돌아가는 씬이 꺼낸다). 아무것도 안 달았으면 첫 타이틀을 자동으로 단다.
 */

import {
  TITLE_DATABASE, getTitleById, titleModifiers, titleBiteMultAt, titlesNewlyEarned,
  isTitleNightHour, isTitleDawnCastHour, kstParts,
  type TitleDef, type TitleModifiers, type TitleStats, type TitleStatKey,
} from '@tra/core';
import type { StoryEvent } from './StoryStore.js';
import { DiscoveryStore } from './DiscoveryStore.js';

export interface TitleSaveState {
  stats: TitleStats;
  /** 가게(판매처 키)별 거래 수 — 「단골」은 그중 최댓값 */
  shopTrades: Record<string, number>;
  /** 얻은 순서대로 */
  owned: string[];
  equipped: string | null;
  /** 진행 중인 출조(구세이브 = 없음) */
  trip: { region: string; casts: number; catches: number } | null;
}

/** 지금 KST 시(0~23) */
function kstHourNow(): number { return Number(kstParts(new Date()).hh); }

class TitleStoreImpl {
  private stats: TitleStats = {};
  private shopTrades: Record<string, number> = {};
  private owned: string[] = [];
  private equipped: string | null = null;
  private trip: TitleSaveState['trip'] = null;
  private pending: TitleDef[] = [];
  private mods: TitleModifiers = titleModifiers(null);
  private readonly changeListeners = new Set<() => void>();

  // ── 조회 ──
  stat(k: TitleStatKey): number { return this.stats[k] ?? 0; }
  ownedIds(): readonly string[] { return this.owned; }
  ownedDefs(): TitleDef[] { return this.owned.map((id) => getTitleById(id)).filter((d): d is TitleDef => !!d); }
  /** 아직 못 얻은 타이틀 수 — S 창의 「??? × N」 */
  hiddenCount(): number { return TITLE_DATABASE.length - this.owned.length; }
  equippedId(): string | null { return this.equipped; }
  equippedDef(): TitleDef | null { return getTitleById(this.equipped); }
  modifiers(): TitleModifiers { return this.mods; }
  /** 지금 시각의 입질 배율(밤·새벽 효과 포함) */
  biteMultNow(): number { return titleBiteMultAt(this.mods, kstHourNow()); }

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

  /** StoryStore 이벤트 버스에서 — 어획 · (금지체장) 방생 */
  onStoryEvent(ev: StoryEvent): void {
    if (ev.kind === 'catch' && ev.selfCaught) {
      if (isTitleNightHour(kstHourNow())) this.stats.nightCatch = this.stat('nightCatch') + 1;
      if (ev.lengthCm >= 60) this.stats.trophyCatch = this.stat('trophyCatch') + 1;
      if (this.trip) this.trip.catches++;
      this.syncSpecies(false);
      this.check();
    } else if (ev.kind === 'release') {
      this.bump('release');
    } else if (ev.kind === 'activity' && ev.activity === 'forage') {
      this.syncSpecies();   // 채집물도 도감 종 수에 든다
    }
  }

  /** 캐스팅 한 번(1인칭 진입) — 새벽 캐스팅 · 출조 캐스팅 수 */
  recordCast(): void {
    if (this.trip) this.trip.casts++;
    if (isTitleDawnCastHour(kstHourNow())) this.bump('dawnCast');
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

  /** 새로 얻은 타이틀 처리 — 알림 대기열 · 첫 타이틀 자동 장착 */
  private check(): void {
    const fresh = titlesNewlyEarned(this.stats, new Set(this.owned));
    if (fresh.length === 0) return;
    for (const d of fresh) { this.owned.push(d.id); this.pending.push(d); }
    if (!this.equipped) this.equip(fresh[0].id);
    else this.emit();
  }

  /** 씬이 배너로 띄울 다음 알림 */
  takePending(): TitleDef | undefined { return this.pending.shift(); }
  hasPending(): boolean { return this.pending.length > 0; }

  // ── 세이브 ──
  serialize(): TitleSaveState {
    return { stats: { ...this.stats }, shopTrades: { ...this.shopTrades }, owned: [...this.owned], equipped: this.equipped, trip: this.trip ? { ...this.trip } : null };
  }

  /** 구세이브(없음) = 0부터. 얻은 타이틀 · 장착은 그대로 보존(목표가 바뀌어도 뺏지 않는다) */
  deserialize(s: TitleSaveState | undefined): void {
    this.resetAll();
    if (!s) { this.syncSpecies(false); return; }
    this.stats = { ...(s.stats ?? {}) };
    this.shopTrades = { ...(s.shopTrades ?? {}) };
    this.owned = (s.owned ?? []).filter((id) => !!getTitleById(id));
    this.trip = s.trip ?? null;
    this.equipped = s.equipped && this.owned.includes(s.equipped) ? s.equipped : null;
    this.mods = titleModifiers(getTitleById(this.equipped));
    // 로드 직후 조건을 다시 본다 — 구세이브에 이미 도감 20종이 있으면 여기서 처음 얻는다(알림도 띄운다)
    this.syncSpecies(false);
    this.check();
    this.emit();
  }

  resetAll(): void {
    this.stats = {};
    this.shopTrades = {};
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
