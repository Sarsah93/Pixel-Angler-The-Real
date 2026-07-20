/**
 * @file CoolerStore.ts
 * @description 쿨러(어창) 세션 스토어 — 어획 3x3 보관 + 밑밥 배합 상태
 *
 * 1인칭 낚시(FirstPersonFishingScene)와 탑다운(RegionFieldScene)이 공유하는
 * 싱글톤 세션 상태:
 *  - 어창 9칸(3x3): 낚은 개체를 활어 상태로 보관. 물칸 활어 보관이므로
 *    **쿨러 안에서는 신선도 시계가 멈춘다** (인벤토리 이송 시점부터 'live'로 진행)
 *    → 일반 인벤토리 보관보다 신선도가 오래 유지된다.
 *  - 밑밥 배합(품질): U 밑밥 품질 탭에서 재료 투입 → 물 넣기 → 섞기 완료 시 100.
 *    1인칭 C 투척 1회당 25 소모, 0이 되면 '비어있음'으로 리셋.
 */

/** 쿨러에 보관되는 어획 개체 (실측치 보존 — 인벤토리 이송 시 그대로 전달) */
export interface CoolerFish {
  speciesId: string;
  nameKo: string;
  lengthCm: number;
  weightG: number;
  sex: 'M' | 'F';
  /** 실사 픽셀 생선 텍스처 키 (있으면 아이콘으로 사용) */
  iconTexture?: string;
}

/** 어창 최대 보관 수 (3x3) */
export const COOLER_CAPACITY = 9;

/** 밑밥 재료 종류 — 투입 연출/통 안 쌓임 렌더 분기 */
export type ChumIngredientKind = 'powder' | 'krill' | 'grain';

/** 밑밥 통에 투입된 재료 (순서 보존 — 쌓임 렌더용) */
export interface ChumIngredient {
  kind: ChumIngredientKind;
  name: string;
}

/** 밑밥 투척 1회당 소모량 (추후 능력치/고급 제품으로 감소 예정) */
export const CHUM_THROW_COST = 25;

class CoolerStoreImpl {
  /** 어창 9칸 — null = 빈 칸 */
  slots: (CoolerFish | null)[] = Array.from({ length: COOLER_CAPACITY }, () => null);

  // ── 밑밥 배합 상태 ──
  /** 통에 투입된 재료 (순서대로) */
  chumIngredients: ChumIngredient[] = [];
  /** 물 넣기 완료 여부 (1회) */
  chumWaterAdded = false;
  /** 섞기 완료 여부 (1회 — 완료 시 remaining 100) */
  chumMixed = false;
  /** 남은 밑밥량 (0~100, 0 = 비어있음) */
  chumRemaining = 0;

  // ── 어창 ────────────────────────────────────────────
  count(): number {
    return this.slots.filter(Boolean).length;
  }

  isFull(): boolean {
    return this.count() >= COOLER_CAPACITY;
  }

  /** 어획 추가 — 빈 칸 인덱스 반환, 가득 차면 -1 */
  add(fish: CoolerFish): number {
    const idx = this.slots.findIndex((s) => s === null);
    if (idx < 0) return -1;
    this.slots[idx] = fish;
    return idx;
  }

  get(idx: number): CoolerFish | null {
    return this.slots[idx] ?? null;
  }

  /** 방생/이송 등으로 칸 비우기 — 제거된 개체 반환 */
  removeAt(idx: number): CoolerFish | null {
    const f = this.slots[idx] ?? null;
    if (f) this.slots[idx] = null;
    return f;
  }

  /** 보관 중인 전체 개체 (빈 칸 제외) */
  all(): CoolerFish[] {
    return this.slots.filter((s): s is CoolerFish => s !== null);
  }

  clearFish(): void {
    this.slots = Array.from({ length: COOLER_CAPACITY }, () => null);
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
