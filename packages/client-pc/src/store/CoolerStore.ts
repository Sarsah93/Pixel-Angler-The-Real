/**
 * @file CoolerStore.ts
 * @description 쿨러(어창) 세션 스토어 — 어획 3x3 보관 + 매질(해수/얼음) + 밑밥 배합 상태
 *
 * 1인칭 낚시(FirstPersonFishingScene)와 탑다운(RegionFieldScene)이 공유하는
 * 싱글톤 세션 상태:
 *  - 어창 9칸(3x3): 낚은 개체를 보관. **자동으로 인벤토리로 이송되지 않는다** —
 *    쿨러 팝업의 우클릭 메뉴 '인벤토리로 넣기'로 직접 옮겨야 한다.
 *  - 매질(medium): 해수/얼음/없음 — 개체별 신선도 진행 규칙이 달라진다.
 *      · 없음: 상온과 동일하게 진행 (활어 10분 → 신선 → …)
 *      · 해수(1시간): 활어 시계 정지(무제한 유지). 만료 시 남은 개체 강제 '보통'.
 *      · 얼음(2시간): 활어는 1시간 유지 후 '신선', 신선 이하 상태는 시계 정지.
 *        만료 시 남은 개체 강제 '해동'.
 *    만료된 매질은 '비우기' 후 새로 채워야 한다.
 *  - 신선도 진행은 lazy sync() — 마지막 동기화 이후 경과를 구간 분할(만료 이벤트
 *    전/후)로 적용한다. 개체는 절대 시각이 아니라 **상태 내 누적 경과(stateElapsedMs)**
 *    를 갖는다 (일시정지 구간은 누적되지 않음).
 *  - 밑밥 배합(품질): U 밑밥 품질 탭에서 재료 투입 → 물 넣기 → 섞기 완료 시 100.
 *    1인칭 C 투척 1회당 25 소모, 0이 되면 '비어있음'으로 리셋.
 */

import {
  InvCondition, CONDITION_NEXT, CONDITION_DURATION_MIN,
} from './InventoryStore.js';
import type { ChumTypeKey } from '@tra/core';

/** 쿨러에 보관되는 어획 개체 (실측치 보존 — 인벤토리 이송 시 그대로 전달) */
export interface CoolerFish {
  speciesId: string;
  nameKo: string;
  lengthCm: number;
  weightG: number;
  sex: 'M' | 'F';
  /** 실사 픽셀 생선 텍스처 키 (있으면 아이콘으로 사용) */
  iconTexture?: string;
  /** 현재 신선도 상태 (매질 규칙에 따라 진행) */
  condition: InvCondition;
  /** 현재 상태에서 누적된 경과 시간 (ms) — 일시정지 구간은 누적되지 않음 */
  stateElapsedMs: number;
}

/** add()에 넘기는 입력 — 신선도 필드는 스토어가 활어로 초기화 */
export type CoolerFishInput = Omit<CoolerFish, 'condition' | 'stateElapsedMs'>;

/** 어창 최대 보관 수 (3x3) */
export const COOLER_CAPACITY = 9;

/** 쿨러 매질 종류 */
export type CoolerMedium = 'none' | 'seawater' | 'ice';

export const MEDIUM_LABEL: Record<CoolerMedium, string> = {
  none: '없음',
  seawater: '해수',
  ice: '얼음',
};

/** 매질 유지 시간 (ms) — 해수 1시간 / 얼음 2시간 */
export const MEDIUM_DURATION_MS: Record<'seawater' | 'ice', number> = {
  seawater: 60 * 60_000,
  ice: 120 * 60_000,
};

/** 해수 교체 경고 임계 (남은 시간 ≤ 10분) */
export const SEAWATER_SWAP_WARN_MS = 10 * 60_000;

/** 얼음 매질에서의 활어 유지 시간 (분) — 기본 10분 대신 1시간 */
const ICE_LIVE_DURATION_MIN = 60;

/** 밑밥 재료 종류 — 투입 연출/통 안 쌓임 렌더 분기 */
export type ChumIngredientKind = 'powder' | 'krill' | 'grain';

/** 밑밥 통에 투입된 재료 (순서 보존 — 쌓임 렌더용) */
export interface ChumIngredient {
  kind: ChumIngredientKind;
  name: string;
}

/** 밑밥 투척 1회당 소모량 (추후 능력치/고급 제품으로 감소 예정) */
export const CHUM_THROW_COST = 25;

/** 쿨러 세이브 스냅샷 (GameState SaveData에 포함 — 전부 JSON 안전 타입) */
export interface CoolerSaveState {
  slots: (CoolerFish | null)[];
  medium: CoolerMedium;
  mediumSetAtMs: number;
  mediumExpiredApplied: boolean;
  /** 저장 시점 (ms) — 로드 시 이 시각부터 현재까지의 실경과를 sync()로 반영 */
  lastSyncMs: number;
  chumIngredients: ChumIngredient[];
  chumWaterAdded: boolean;
  chumMixed: boolean;
  chumRemaining: number;
}

class CoolerStoreImpl {
  /** 어창 9칸 — null = 빈 칸 */
  slots: (CoolerFish | null)[] = Array.from({ length: COOLER_CAPACITY }, () => null);

  // ── 매질 상태 ──
  /** 현재 채워진 매질 (만료 후에도 '비우기' 전까지 유지된다) */
  medium: CoolerMedium = 'none';
  /** 매질 투입 시각 (ms) */
  mediumSetAtMs = 0;
  /** 만료 강제 전이(보통/해동) 적용 완료 여부 — 이벤트 1회만 적용 */
  private mediumExpiredApplied = false;
  /** 마지막 신선도 동기화 시각 */
  private lastSyncMs = Date.now();

  // ── 밑밥 배합 상태 ──
  /** 통에 투입된 재료 (순서대로) */
  chumIngredients: ChumIngredient[] = [];
  /** 물 넣기 완료 여부 (1회) */
  chumWaterAdded = false;
  /** 섞기 완료 여부 (1회 — 완료 시 remaining 100) */
  chumMixed = false;
  /** 남은 밑밥량 (0~100, 0 = 비어있음) */
  chumRemaining = 0;

  // ═══════════════════════════════════════════════════
  // 신선도 동기화 엔진
  // ═══════════════════════════════════════════════════

  /** 매질 만료 시각 (ms) — 매질 없으면 null */
  mediumExpiryMs(): number | null {
    if (this.medium === 'none') return null;
    return this.mediumSetAtMs + MEDIUM_DURATION_MS[this.medium];
  }

  /** 매질 남은 시간 (ms, 만료/없음 = 0) */
  mediumRemainMs(now = Date.now()): number {
    const expiry = this.mediumExpiryMs();
    if (expiry === null) return 0;
    return Math.max(0, expiry - now);
  }

  /** 현재 효과가 살아있는 매질 — 만료 처리 후에는 'none' 취급 */
  private activeMedium(): CoolerMedium {
    if (this.medium === 'none' || this.mediumExpiredApplied) return 'none';
    return this.medium;
  }

  /** 해수 교체 경고 (남은 시간 ≤ 10분, 만료 후 미비움 포함) */
  needsSeawaterSwap(now = Date.now()): boolean {
    this.sync(now);
    return this.medium === 'seawater' && this.mediumRemainMs(now) <= SEAWATER_SWAP_WARN_MS;
  }

  /**
   * 신선도 lazy 동기화 — 마지막 동기화 이후 경과를 적용한다.
   * 매질 만료 시점이 구간 안에 있으면 [이전, 만료) 활성 구간 → 만료 이벤트 →
   * [만료, 현재) 비활성 구간으로 분할해 순서대로 적용한다.
   */
  sync(now = Date.now()): void {
    let t = this.lastSyncMs;
    if (now <= t) { this.lastSyncMs = now; return; }

    const expiry = this.mediumExpiryMs();
    if (expiry !== null && !this.mediumExpiredApplied && expiry <= now) {
      this.advanceFish(Math.max(0, expiry - t));
      this.applyMediumExpiry();
      t = Math.max(t, expiry);
    }
    this.advanceFish(now - t);
    this.lastSyncMs = now;
  }

  /** 현재 활성 매질 규칙으로 전 개체의 신선도를 deltaMs만큼 진행 */
  private advanceFish(deltaMs: number): void {
    if (deltaMs <= 0) return;
    const med = this.activeMedium();
    for (const f of this.slots) {
      if (!f) continue;
      let remain = deltaMs;
      while (remain > 0) {
        if (this.isPaused(f.condition, med)) break;
        const durMin = med === 'ice' && f.condition === 'live'
          ? ICE_LIVE_DURATION_MIN
          : CONDITION_DURATION_MIN[f.condition];
        if (!Number.isFinite(durMin)) break;   // 종착(부패)
        const durMs = durMin * 60_000;
        const need = durMs - f.stateElapsedMs;
        if (remain >= need) {
          const next = CONDITION_NEXT[f.condition];
          if (!next) break;
          f.condition = next;
          f.stateElapsedMs = 0;
          remain -= need;
        } else {
          f.stateElapsedMs += remain;
          remain = 0;
        }
      }
    }
  }

  /** 매질별 시계 정지 규칙 */
  private isPaused(cond: InvCondition, med: CoolerMedium): boolean {
    if (med === 'seawater') return cond === 'live';       // 해수: 활어 무제한
    if (med === 'ice') return cond !== 'live';            // 얼음: 활어(1h 특례) 외 전 상태 정지
    return false;
  }

  /** 매질 만료 강제 전이 — 해수: 보통 / 얼음: 해동 (이미 더 나쁜 상태는 유지) */
  private applyMediumExpiry(): void {
    const forced: InvCondition = this.medium === 'ice' ? 'thawed' : 'normal';
    // 강제 전이 대상: 아직 '나쁨/부패/해동'에 이르지 않은 상태만 (악화 방향으로만 적용)
    const target = new Set<InvCondition>(['live', 'fresh', 'chilled', 'normal', 'frozen']);
    if (this.medium === 'seawater') target.delete('normal');   // 이미 보통이면 그대로
    for (const f of this.slots) {
      if (!f) continue;
      if (target.has(f.condition)) {
        f.condition = forced;
        f.stateElapsedMs = 0;
      }
    }
    this.mediumExpiredApplied = true;
  }

  /**
   * 개체의 다음 상태까지 남은 시간 (ms).
   * 현재 매질 규칙으로 시계가 정지된 상태면 null (= '무제한' 표기).
   */
  fishRemainMs(f: CoolerFish, now = Date.now()): number | null {
    this.sync(now);
    const med = this.activeMedium();
    if (this.isPaused(f.condition, med)) return null;
    const durMin = med === 'ice' && f.condition === 'live'
      ? ICE_LIVE_DURATION_MIN
      : CONDITION_DURATION_MIN[f.condition];
    if (!Number.isFinite(durMin)) return null;   // 종착(부패)
    return Math.max(0, durMin * 60_000 - f.stateElapsedMs);
  }

  // ── 매질 조작 ────────────────────────────────────────
  /** 새 매질을 넣을 수 있는가 (기존 매질은 만료됐어도 비워야 함) */
  canAddMedium(): boolean {
    this.sync();
    return this.medium === 'none';
  }

  /** 해수 채우기 (1시간) — 두레박 보유/바다 근처 판정은 UI가 담당 */
  addSeawater(): boolean {
    if (!this.canAddMedium()) return false;
    this.medium = 'seawater';
    this.mediumSetAtMs = Date.now();
    this.mediumExpiredApplied = false;
    return true;
  }

  /** 얼음 채우기 (2시간) — 각얼음 소모는 UI가 담당 */
  addIce(): boolean {
    if (!this.canAddMedium()) return false;
    this.medium = 'ice';
    this.mediumSetAtMs = Date.now();
    this.mediumExpiredApplied = false;
    return true;
  }

  /** 매질 비우기 */
  emptyMedium(): void {
    this.sync();
    this.medium = 'none';
    this.mediumSetAtMs = 0;
    this.mediumExpiredApplied = false;
  }

  // ── 어창 ────────────────────────────────────────────
  count(): number {
    return this.slots.filter(Boolean).length;
  }

  isFull(): boolean {
    return this.count() >= COOLER_CAPACITY;
  }

  /** 어획 추가 (활어 상태로 시작) — 빈 칸 인덱스 반환, 가득 차면 -1 */
  add(fish: CoolerFishInput): number {
    this.sync();
    const idx = this.slots.findIndex((s) => s === null);
    if (idx < 0) return -1;
    this.slots[idx] = { ...fish, condition: 'live', stateElapsedMs: 0 };
    return idx;
  }

  get(idx: number): CoolerFish | null {
    this.sync();
    return this.slots[idx] ?? null;
  }

  /** 방생/이송 등으로 칸 비우기 — 제거된 개체 반환 */
  removeAt(idx: number): CoolerFish | null {
    this.sync();
    const f = this.slots[idx] ?? null;
    if (f) this.slots[idx] = null;
    return f;
  }

  /** 보관 중인 전체 개체 (빈 칸 제외) */
  all(): CoolerFish[] {
    this.sync();
    return this.slots.filter((s): s is CoolerFish => s !== null);
  }

  clearFish(): void {
    this.slots = Array.from({ length: COOLER_CAPACITY }, () => null);
  }

  // ── 세이브/로드 (쿨러 = 휴대 보관함 — GameState SaveData에 포함) ──
  /** 현재 상태 스냅샷 — 저장 직전 sync로 최신화 */
  serialize(): CoolerSaveState {
    this.sync();
    return {
      slots: this.slots.map((s) => (s ? { ...s } : null)),
      medium: this.medium,
      mediumSetAtMs: this.mediumSetAtMs,
      mediumExpiredApplied: this.mediumExpiredApplied,
      lastSyncMs: this.lastSyncMs,
      chumIngredients: this.chumIngredients.map((c) => ({ ...c })),
      chumWaterAdded: this.chumWaterAdded,
      chumMixed: this.chumMixed,
      chumRemaining: this.chumRemaining,
    };
  }

  /**
   * 세이브 복원 — 저장 시점(lastSyncMs)부터 현재까지의 **실경과 시간**을
   * sync()가 그대로 반영한다: 어획물 신선도 진행 + 해수/얼음 만료(강제 전이) 처리.
   * 밑밥은 시간 규칙이 없어 그대로 사용 가능.
   */
  deserialize(s: CoolerSaveState | undefined | null): void {
    if (!s) { this.resetAll(); return; }
    this.slots = Array.from({ length: COOLER_CAPACITY }, (_, i) => {
      const f = s.slots?.[i];
      if (!f) return null;
      // 구버전/결손 필드 방어 — 신선도 필드 기본값 병합
      return { ...f, condition: f.condition ?? 'live', stateElapsedMs: f.stateElapsedMs ?? 0 };
    });
    this.medium = s.medium ?? 'none';
    this.mediumSetAtMs = s.mediumSetAtMs ?? 0;
    this.mediumExpiredApplied = s.mediumExpiredApplied ?? false;
    this.lastSyncMs = s.lastSyncMs ?? Date.now();
    this.chumIngredients = (s.chumIngredients ?? []).map((c) => ({ ...c }));
    this.chumWaterAdded = s.chumWaterAdded ?? false;
    this.chumMixed = s.chumMixed ?? false;
    this.chumRemaining = s.chumRemaining ?? 0;
    // 저장~로드 사이 흐른 실제 시간 적용 (매질 만료 이벤트 포함)
    this.sync();
  }

  /** 전체 초기화 (새 게임/세이브 없음) */
  resetAll(): void {
    this.clearFish();
    this.medium = 'none';
    this.mediumSetAtMs = 0;
    this.mediumExpiredApplied = false;
    this.lastSyncMs = Date.now();
    this.resetChumBox();
  }

  // ── 밑밥 ────────────────────────────────────────────
  /** 새 배합을 시작할 수 있는가 (남은 밑밥이 없어야 함) */
  canStartChumMix(): boolean {
    return this.chumRemaining <= 0;
  }

  addChumIngredient(kind: ChumIngredientKind, name: string): void {
    this.chumIngredients.push({ kind, name });
  }

  /** 섞기 완료 — 밑밥 100 충전 */
  completeChumMix(): void {
    this.chumMixed = true;
    this.chumRemaining = 100;
  }

  /**
   * 현재 배합의 밑밥 종류 (TUNING.chumTypes 키) — 침강/확산/조류 친화 물리 분기.
   *  고비중 파우더 포함 = ball(무거운 경단 성격 — 빠른 침강·정밀)
   *  압맥/보리(grain)가 다수 = grain(범용)
   *  그 외(집어 파우더/빵가루/크릴) = powder(느림·넓음·조류 잘 탐)
   */
  chumTypeKey(): ChumTypeKey {
    if (this.chumIngredients.some((i) => i.name.includes('고비중'))) return 'ball';
    const grain = this.chumIngredients.filter((i) => i.kind === 'grain').length;
    const light = this.chumIngredients.length - grain;
    return grain > light ? 'grain' : 'powder';
  }

  /** 밑밥 1회 투척 소모 — 부족하면 false. 0 도달 시 통 상태 리셋(비어있음) */
  consumeChumThrow(): boolean {
    if (this.chumRemaining < CHUM_THROW_COST) return false;
    this.chumRemaining -= CHUM_THROW_COST;
    if (this.chumRemaining <= 0) this.resetChumBox();
    return true;
  }

  /** 통 비우기 (밑밥 소진/새 배합 시작) */
  resetChumBox(): void {
    this.chumIngredients = [];
    this.chumWaterAdded = false;
    this.chumMixed = false;
    this.chumRemaining = 0;
  }
}

/** 쿨러 싱글톤 (세션 단위) */
export const CoolerStore = new CoolerStoreImpl();
