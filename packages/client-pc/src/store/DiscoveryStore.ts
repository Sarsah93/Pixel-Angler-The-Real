/**
 * @file DiscoveryStore.ts
 * @description 발견(도감/위키) 기록 스토어 — 어종·해양생물·아이템 공용 싱글톤
 *
 * "한 번이라도 조우한 것만 도감/위키에 공개"의 단일 소스.
 * - 기록 시점: 낚시 어획 / 통발 포획 / 해루질 채집 / 인벤토리 취득 (각 배선처에서 record 호출)
 * - 대상당 최초 1회만 기록 — 이후 호출은 무시 (최초 발견 경로·시각 보존)
 * - 세이브 영속: GameState SaveData.discoveries (serialize/deserialize)
 * - 구세이브 백필: 엔트리가 없으면 caughtFishHistory에서 어종 발견을 'legacy'로 복원
 * - 신규 발견 알림: onNew 훅 (HUD가 등록 — pushLog "도감에 등록되었습니다")
 */

import type { DiscoveryKind, DiscoverySource, DiscoveryEntry } from '@tra/core';
import { discoveryKey, FISH_DATABASE } from '@tra/core';
import { SHORE_CREATURE_DATABASE } from '@tra/core';

/** 세이브 직렬화 형태 */
export interface DiscoverySaveState {
  entries: DiscoveryEntry[];
}

class DiscoveryStoreClass {
  private entries = new Map<string, DiscoveryEntry>();

  /** 신규 발견 시 호출되는 훅 (HUD 토스트용 — 씬이 등록/해제) */
  onNew: ((entry: DiscoveryEntry, displayName: string) => void) | null = null;

  /**
   * 발견 기록. 신규 발견이면 true 반환 + onNew 훅 발화.
   * 이미 발견된 대상은 무시(false) — 최초 기록 불변.
   */
  record(kind: DiscoveryKind, id: string, source: DiscoverySource): boolean {
    const key = discoveryKey(kind, id);
    if (this.entries.has(key)) return false;
    const entry: DiscoveryEntry = { kind, id, firstAtMs: Date.now(), source };
    this.entries.set(key, entry);
    if (this.onNew) {
      this.onNew(entry, this.displayNameOf(kind, id));
    }
    return true;
  }

  isDiscovered(kind: DiscoveryKind, id: string): boolean {
    return this.entries.has(discoveryKey(kind, id));
  }

  get(kind: DiscoveryKind, id: string): DiscoveryEntry | undefined {
    return this.entries.get(discoveryKey(kind, id));
  }

  countByKind(kind: DiscoveryKind): number {
    let n = 0;
    for (const e of this.entries.values()) if (e.kind === kind) n++;
    return n;
  }

  /** 표시용 이름 조회 (어종/생물은 DB, 아이템은 id 그대로 — 호출측이 이름을 알면 그쪽 우선) */
  displayNameOf(kind: DiscoveryKind, id: string): string {
    if (kind === 'fish') {
      return FISH_DATABASE.find((f) => f.id === id)?.nameKo ?? id;
    }
    if (kind === 'creature') {
      return SHORE_CREATURE_DATABASE.find((c) => c.id === id)?.nameKo ?? id;
    }
    return id;
  }

  // ─── dev 전용 ───────────────────────────────

  /** dev: 특정 종류 전체 해금 (어종/생물 — 아이템은 카탈로그 목록을 호출측이 전달) */
  devUnlockAll(kind: DiscoveryKind, ids: string[]): number {
    let added = 0;
    for (const id of ids) {
      const key = discoveryKey(kind, id);
      if (this.entries.has(key)) continue;
      this.entries.set(key, { kind, id, firstAtMs: Date.now(), source: 'dev' });
      added++;
    }
    return added;
  }

  /** dev: 전체 발견 기록 초기화 */
  devResetAll(): void {
    this.entries.clear();
  }

  // ─── 세이브 연동 ────────────────────────────

  serialize(): DiscoverySaveState {
    return { entries: [...this.entries.values()] };
  }

  /**
   * 복원. 구세이브(필드 없음)는 legacyFishIds(caughtFishHistory의 어종)로 백필 —
   * 기존 유저의 도감이 갑자기 전부 "미발견"으로 잠기지 않게 한다.
   */
  deserialize(saved: DiscoverySaveState | undefined, legacyFishIds?: string[]): void {
    this.entries.clear();
    if (saved?.entries?.length) {
      for (const e of saved.entries) {
        if (!e?.kind || !e?.id) continue;
        this.entries.set(discoveryKey(e.kind, e.id), e);
      }
      return;
    }
    // 구세이브 백필 — 어획 기록이 있는 어종은 발견 처리
    if (legacyFishIds?.length) {
      for (const id of legacyFishIds) {
        const key = discoveryKey('fish', id);
        if (this.entries.has(key)) continue;
        this.entries.set(key, { kind: 'fish', id, firstAtMs: Date.now(), source: 'legacy' });
      }
    }
  }

  /** 새 게임 시작 시 리셋 */
  resetAll(): void {
    this.entries.clear();
  }
}

export const DiscoveryStore = new DiscoveryStoreClass();

// dev 하네스 전용 노출 (__INV/__GS 관례 — 프로덕션 미노출)
if (import.meta.env.DEV) {
  (globalThis as Record<string, unknown>).__DISC = DiscoveryStore;
}
