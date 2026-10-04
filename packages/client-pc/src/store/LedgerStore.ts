/**
 * @file LedgerStore.ts
 * @description 하루 기록 장부 (211차 — 하루 결산).
 *
 * 게임 안에서 일어나는 변화(돈 · 어획 · 아이템 · 이야기 · 우호도 · 성장 · 도감 · 타이틀 · 생활 · 장비 · 다닌 곳)를
 * **지금 장(page)** 에 쌓는다. 장은 침대에서 잠들 때(`closeForSleep`) 또는 한국 시각 날짜가 바뀔 때 닫힌다.
 * 닫힌 장은 최대 `KEEP_PAGES`장 보관하고 세이브에 함께 저장한다.
 *
 * ⚠ 다른 스토어를 import하지 않는다(순환 참조 방지) — 지금 가진 돈은 GameState가 `coinsOf`로 주입한다.
 * ⚠ 세이브 불러오기 · 새 게임 중에는 `suspend`로 기록을 멈춘다(불러오며 다시 쌓이는 발견 · 타이틀 · 시드 아이템이 오늘 일로 잡히지 않게).
 */

import {
  kstYmd, newLedgerPage, normalizeLedgerPage,
  type CoinReason, type DayLedgerPage, type LedgerCatch,
} from '@tra/core';

const KEEP_PAGES = 14;

export interface LedgerSaveState {
  current: DayLedgerPage | null;
  history: DayLedgerPage[];
  counter: number;
  /** 결산을 이미 보여 준 마지막 장 번호 */
  shownNo: number;
}

class LedgerStoreImpl {
  private current: DayLedgerPage | null = null;
  private history: DayLedgerPage[] = [];
  private counter = 0;
  private shownNo = 0;
  private suspended = 0;
  /** 지금 가진 돈 — GameState가 주입 */
  coinsOf: () => number = () => 0;
  /** dev — 하네스가 날짜를 넘긴다(실시간 시계를 기다릴 수 없다) */
  private ymdOverride: string | null = null;

  private ymd(): string { return this.ymdOverride ?? kstYmd(); }

  /** 기록 멈춤/재개 — 중첩 가능 */
  suspend(on: boolean): void { this.suspended = Math.max(0, this.suspended + (on ? 1 : -1)); }
  get recording(): boolean { return this.suspended === 0; }

  /**
   * 지금 장을 돌려준다. 날짜가 바뀌었으면 자정에 닫고 새 장을 연다.
   * 기록 중이 아니면 null(아무것도 쌓지 않는다).
   */
  private page(): DayLedgerPage | null {
    if (!this.recording) return null;
    const today = this.ymd();
    // 날짜가 **앞으로** 넘어갔을 때만 닫는다(기기 시계 · 시간대가 뒤로 가도 장을 쪼개지 않는다)
    if (this.current && today > this.current.openedYmd) this.close('midnight');
    if (!this.current) this.current = newLedgerPage(++this.counter, today, Date.now(), this.coinsOf());
    this.current.coinsEnd = this.coinsOf();
    return this.current;
  }

  private close(by: 'sleep' | 'midnight'): DayLedgerPage | null {
    const p = this.current;
    if (!p) return null;
    p.closedBy = by;
    p.closedAtMs = Date.now();
    p.closedYmd = by === 'midnight' ? p.openedYmd : this.ymd();
    if (by === 'sleep') p.coinsEnd = this.coinsOf();
    this.history.push(p);
    if (this.history.length > KEEP_PAGES) this.history.splice(0, this.history.length - KEEP_PAGES);
    this.current = null;
    return p;
  }

  // ── 기록 ────────────────────────────────────────────

  coin(amount: number, reason: CoinReason): void {
    const p = this.page();
    if (!p || amount === 0) return;
    const bag = amount > 0 ? p.earned : p.spent;
    bag[reason] = (bag[reason] ?? 0) + Math.abs(amount);
  }

  fish(c: LedgerCatch): void {
    const p = this.page();
    if (!p) return;
    p.catches.push(c);
    if (p.catches.length > 80) p.catches.shift();
  }

  /** 방금 보관으로 적은 고기 n마리를 놓아줌으로 고친다(결정 창에서 놓아주기) */
  released(n: number): void {
    const p = this.page();
    if (!p) return;
    for (let i = p.catches.length - 1; i >= 0 && n > 0; i--) {
      if (p.catches[i]!.fate === 'kept') { p.catches[i]!.fate = 'released'; n--; }
    }
  }

  lost(kind: keyof DayLedgerPage['lost']): void {
    const p = this.page();
    if (p) p.lost[kind]++;
  }

  gained(name: string, qty: number): void {
    const p = this.page();
    if (p && qty > 0) p.gained[name] = (p.gained[name] ?? 0) + qty;
  }

  used(name: string, qty: number): void {
    const p = this.page();
    if (p && qty > 0) p.used[name] = (p.used[name] ?? 0) + qty;
  }

  questAccepted(title: string): void {
    const p = this.page();
    if (p && !p.questsAccepted.includes(title)) p.questsAccepted.push(title);
  }

  questDone(title: string): void {
    const p = this.page();
    if (p && !p.questsDone.includes(title)) p.questsDone.push(title);
  }

  objective(): void {
    const p = this.page();
    if (p) p.objectivesDone++;
  }

  affinity(npcId: string, d: number): void {
    const p = this.page();
    if (p && d !== 0) p.affinity[npcId] = (p.affinity[npcId] ?? 0) + d;
  }

  xp(amount: number, levelUps: number): void {
    const p = this.page();
    if (!p) return;
    p.xp += Math.max(0, amount);
    p.levelUps += levelUps;
  }

  private pushUnique(arr: string[], v: string): void { if (!arr.includes(v)) arr.push(v); }
  profUp(name: string): void { const p = this.page(); if (p) this.pushUnique(p.profUps, name); }
  skill(name: string): void { const p = this.page(); if (p) this.pushUnique(p.skills, name); }
  title(name: string): void { const p = this.page(); if (p) this.pushUnique(p.titles, name); }

  discovery(kind: string, name: string): void {
    const p = this.page();
    if (p && !p.discoveries.some((d) => d.kind === kind && d.name === name)) p.discoveries.push({ kind, name });
  }

  life(key: keyof DayLedgerPage['life'], n = 1): void {
    const p = this.page();
    if (p) p.life[key] += n;
  }

  gear(line: string): void {
    const p = this.page();
    if (p) { p.gear.push(line); if (p.gear.length > 20) p.gear.shift(); }
  }

  region(id: string): void {
    const p = this.page();
    if (p && !p.regions.includes(id)) p.regions.push(id);
  }

  /** 노는 시간 — 필드 · 집 · 1인칭 update가 매 프레임 부른다 */
  playTick(ms: number): void {
    const p = this.page();
    if (p) p.playMs += Math.min(ms, 1000);
  }

  // ── 잠 · 결산 ──────────────────────────────────────

  /** 잠들었다 — 지금 장을 닫고 돌려준다(결산 화면이 그린다). 장이 비어 있어도 닫는다 */
  closeForSleep(): DayLedgerPage | null {
    this.page();   // 날짜가 바뀌었으면 자정 장부터 정리하고, 지금 장을 연다
    const p = this.close('sleep');
    if (p) this.shownNo = Math.max(this.shownNo, p.no);
    return p;
  }

  /** 아직 보여 주지 않은 지난 장(자정에 닫힌 것) — 가장 최근 것 하나 */
  unseenClosed(): DayLedgerPage | null {
    this.page();   // 날짜 넘김을 먼저 반영
    const last = this.history[this.history.length - 1];
    return last && last.no > this.shownNo ? last : null;
  }

  markShown(no: number): void { this.shownNo = Math.max(this.shownNo, no); }

  /** 지금 장(읽기 전용 복사) — 「오늘 하루」 미리보기 */
  peekCurrent(): DayLedgerPage | null {
    const p = this.page();
    return p ? JSON.parse(JSON.stringify(p)) as DayLedgerPage : null;
  }

  /** 닫힌 장들(오래된 → 최근) */
  closedPages(): DayLedgerPage[] { return [...this.history]; }

  // ── 세이브 ─────────────────────────────────────────

  serialize(): LedgerSaveState {
    if (this.current) this.current.coinsEnd = this.coinsOf();
    return { current: this.current, history: this.history, counter: this.counter, shownNo: this.shownNo };
  }

  /** 구세이브(필드 없음) = 빈 장부. 지금 장은 그대로 이어 쓴다(날짜가 지났으면 다음 기록 때 자정으로 닫힌다) */
  deserialize(s: LedgerSaveState | undefined): void {
    this.current = s?.current ? normalizeLedgerPage(s.current) : null;
    this.history = (s?.history ?? []).map((p) => normalizeLedgerPage(p));
    this.counter = s?.counter ?? Math.max(0, ...this.history.map((p) => p.no), this.current?.no ?? 0);
    this.shownNo = s?.shownNo ?? this.counter;   // 구세이브는 보여 줄 지난 장이 없다
  }

  resetAll(): void {
    this.current = null; this.history = []; this.counter = 0; this.shownNo = 0;
  }

  /** dev — 날짜를 바꾼다(null = 실제 한국 날짜) */
  devSetYmd(ymd: string | null): void { this.ymdOverride = ymd; }
}

export const LedgerStore = new LedgerStoreImpl();
if (import.meta.env.DEV) (globalThis as unknown as { __LEDGER: LedgerStoreImpl }).__LEDGER = LedgerStore;
