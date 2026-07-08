/**
 * @file Item.ts
 * @description 통합 아이템 레이어 — 신선도 상태, 사용 목적, 구매처, 인벤토리 인스턴스 타입 정의
 *
 * 낚시 채비 미끼, 마트 식재료, 직판장 활어/선어 등
 * 서로 교차하는 아이템 경제를 일관성 있게 처리합니다.
 */

// ─────────────────────────────────────────────────────────────
// 아이템 신선도 / 보관 상태
// ─────────────────────────────────────────────────────────────

/**
 * 아이템 신선도 상태 (보관 상태)
 *
 * 상태 전이 방향:
 *   live → fresh → (cooled→chilled) OR (outside→spoiled)
 *   frozen → (thaw time 경과) → fresh → ...
 *   processed / salted / dried 는 spoiled 전이만 있음 (매우 느림)
 */
export type ItemConditionState =
  | 'live'        // 활어 / 살아있는 상태 (최고 신선도)
  | 'fresh'       // 선어 상태 (갓 죽은 / 해동 직후)
  | 'chilled'     // 냉장 보관 중 (아이스팩 쿨러 내부)
  | 'frozen'      // 냉동 상태
  | 'salted'      // 염장 처리됨
  | 'dried'       // 건어 / 건제품 (반건조 포함)
  | 'processed'   // 통조림 등 가공 완료 상태
  | 'spoiled';    // 부패 / 사용 불가

// ─────────────────────────────────────────────────────────────
// 아이템 사용 목적 분류
// ─────────────────────────────────────────────────────────────

/**
 * 아이템의 현재 사용 목적 (구매처 및 변환 이력에 따라 결정됨)
 *
 * - `fishing_gear_only` : 낚시용품점 전용 재료. 요리 재료 전환 불가.
 * - `cooking_only`      : 요리 재료 전용. 낚시 미끼 전환 불가.
 * - `dual`              : 직판장 활어/선어 구매분 혹은 통조림. 양쪽 모두 가능.
 * - `cooking_convertible_to_bait` : 마트 식재료 → 낚시 미끼 1회성 변환 가능 (되돌리기 불가).
 */
export type ItemUsePurpose =
  | 'fishing_gear_only'
  | 'cooking_only'
  | 'dual'
  | 'cooking_convertible_to_bait';

// ─────────────────────────────────────────────────────────────
// 아이템 구매처
// ─────────────────────────────────────────────────────────────

/** 아이템을 최초로 획득한 경로 */
export type ItemSourceVendor =
  | 'tackle_shop'   // 낚시용품점
  | 'hanaro_mart'   // 농협 하나로마트
  | 'convenience'   // 편의점 (GS25 등)
  | 'fish_market'   // 직판장 / 수산 어판장
  | 'self_caught'   // 플레이어 직접 낚시·해루질·통발
  | 'foraged';      // 현장 채집 (갯바위 홍합 등)

// ─────────────────────────────────────────────────────────────
// 변환 규칙 및 부패 규칙 (DB 레코드 수준)
// ─────────────────────────────────────────────────────────────

/** 아이템 용도 변환 규칙 */
export interface ItemConversionRule {
  /** 낚시 미끼로 전환 가능 여부 */
  canConvertToBait: boolean;
  /** 요리 재료로 전환 가능 여부 */
  canConvertToCooking: boolean;
  /** 변환이 1회성으로 되돌릴 수 없는지 여부 */
  irreversible: boolean;
  /** 변환 후 적용될 usePurpose */
  resultPurposeAfterBaitConvert: ItemUsePurpose;
}

/**
 * 시간 경과에 따른 상태 변환 규칙 (아이템 DB에 선언)
 *
 * 모든 시간 단위는 게임 내 분(game minutes) 기준입니다.
 * GameState.elapsedGameMinutes 값과 acquiredAt / coolerStoredAt 의 차이로 계산합니다.
 */
export interface ConditionDecayRule {
  /**
   * frozen 상태에서 fresh로 해동되는 데 걸리는 게임 내 분
   * (쿨러 밖에 꺼냈을 때 기준)
   */
  thawMinutes?: number;
  /**
   * 쿨러 밖(상온)에서 fresh/live → spoiled 까지 걸리는 게임 내 분
   * live 상태에서 fresh 전이 후 이 시간이 추가 적용됩니다.
   */
  spoilMinutesOutsideCooler: number;
  /**
   * 쿨러(아이스팩 충전 상태) 안에서 → spoiled 까지 걸리는 게임 내 분
   * 아이스팩이 소진된 경우 outsideCooler 규칙으로 대체됩니다.
   */
  spoilMinutesInCooler: number;
  /**
   * 살아있는(live) 상태에서 fresh로 전이되는 데 걸리는 게임 내 분
   * 예: 활어 직판장 구매 후 보관 용기 이탈 시 적용
   */
  liveToFreshMinutes?: number;
}

// ─────────────────────────────────────────────────────────────
// 통합 아이템 DB 레코드 (정적)
// ─────────────────────────────────────────────────────────────

/**
 * UniversalItem — 아이템 데이터베이스 레코드 (DB에 저장되는 정적 정의)
 * 가격, 초기 상태, 변환 규칙, 부패 규칙 포함.
 */
export interface UniversalItem {
  /** 아이템 고유 ID */
  id: string;
  /** 한국어 명칭 */
  nameKo: string;
  /** 판매 구매처 목록 */
  availableAt: ItemSourceVendor[];
  /** 구매처별 구매 단가 (원) — 플레이어가 구매하는 금액 */
  buyPriceByVendor: Partial<Record<ItemSourceVendor, number>>;
  /** 구매처별 판매 단가 (원) — 플레이어가 판매할 때 받는 금액 */
  sellPriceByVendor: Partial<Record<ItemSourceVendor, number>>;
  /** 아이템 구매/획득 시 초기 신선도 상태 */
  initialCondition: ItemConditionState;
  /** 아이템 획득 시 초기 사용 목적 */
  initialPurpose: ItemUsePurpose;
  /**
   * 낚시 미끼로 사용 시 BaitCategory 매핑
   * undefined이면 미끼 사용 불가
   */
  baitCategory?: string;
  /**
   * 요리 재료로 사용 시 매핑되는 레시피 재료 ID
   * undefined이면 요리 재료 사용 불가
   */
  cookingIngredientId?: string;
  /** stackable 여부 (false이면 마리 단위로 인스턴스 분리) */
  stackable: boolean;
  /** 용도 변환 규칙 */
  conversionRule: ItemConversionRule;
  /** 부패 규칙 (undefined이면 부패 없음: 건어물, 통조림 등) */
  decayRule?: ConditionDecayRule;
}

// ─────────────────────────────────────────────────────────────
// 인벤토리 인스턴스 (동적, GameState에 저장)
// ─────────────────────────────────────────────────────────────

/**
 * InventoryItemInstance — 플레이어 인벤토리에 존재하는 개별 아이템 인스턴스
 *
 * UniversalItem(정적 DB)을 참조하되, 신선도 상태·획득 시점·쿨러 이력은
 * 각 인스턴스가 독립적으로 관리합니다.
 */
export interface InventoryItemInstance {
  /** 인스턴스 고유 ID (crypto.randomUUID() 또는 uuid v4) */
  instanceId: string;
  /** 참조하는 UniversalItem.id */
  itemId: string;
  /** 수량 또는 무게(g) */
  quantity: number;
  /** 현재 신선도 상태 (평가 시점마다 evaluateItemCondition()으로 갱신) */
  conditionState: ItemConditionState;
  /** 현재 사용 목적 (변환 후 고정) */
  usePurpose: ItemUsePurpose;
  /** 최초 획득 구매처 */
  sourceVendor: ItemSourceVendor;
  /**
   * 획득(구매/낚시/채집) 시점 — 게임 내 누적 분(gameMinutes) 기준
   * GameState.elapsedGameMinutes 값을 저장합니다.
   * spoilage 계산의 기준점(t=0)
   */
  acquiredAtGameMinute: number;
  /**
   * 쿨러에 보관하기 시작한 게임 내 누적 분
   * null이면 현재 쿨러 밖에 있는 상태 (상온)
   */
  coolerStoredAtGameMinute: number | null;
  /**
   * 낚시 미끼로 변환된 시점 게임 내 누적 분 (1회성 기록)
   * null이면 아직 미끼로 변환하지 않은 상태
   */
  convertedToBaitAtGameMinute: number | null;
}

// ─────────────────────────────────────────────────────────────
// 상태 평가 함수
// ─────────────────────────────────────────────────────────────

/**
 * 현재 게임 내 시간(elapsedGameMinutes) 기준으로 아이템의 실제 신선도 상태를 계산합니다.
 *
 * @param instance - 평가할 인벤토리 인스턴스
 * @param item - 해당 UniversalItem (decayRule 포함)
 * @param currentGameMinute - 현재 게임 내 누적 분 (GameState.elapsedGameMinutes)
 * @param coolerIcePacked - 현재 쿨러에 아이스팩이 남아있는지 여부
 * @returns 현재 유효한 ItemConditionState
 */
export function evaluateItemCondition(
  instance: InventoryItemInstance,
  item: UniversalItem,
  currentGameMinute: number,
  coolerIcePacked: boolean = true
): ItemConditionState {
  const { decayRule } = item;

  // 부패 규칙이 없으면 (건어물, 통조림, 건식 집어제 등) 상태 그대로
  if (!decayRule) return instance.conditionState;

  // 이미 부패한 아이템은 복구 없음
  if (instance.conditionState === 'spoiled') return 'spoiled';

  // ① 냉동(frozen) 상태 → 해동 처리
  if (instance.conditionState === 'frozen') {
    const minutesOutside =
      instance.coolerStoredAtGameMinute === null
        ? currentGameMinute - instance.acquiredAtGameMinute
        : 0;

    if (decayRule.thawMinutes !== undefined && minutesOutside >= decayRule.thawMinutes) {
      // 해동 완료 → fresh로 전이 후 부패 계산 이어서 진행
      // (실제 게임 구현에서는 instance.conditionState를 'fresh'로 저장해야 함)
      return _evaluateFreshDecay(instance, decayRule, currentGameMinute, coolerIcePacked);
    }
    return 'frozen';
  }

  // ② live 상태 → fresh 전이 후 부패 계산
  if (instance.conditionState === 'live') {
    const minutesSinceAcquired = currentGameMinute - instance.acquiredAtGameMinute;
    const liveToFreshMin = decayRule.liveToFreshMinutes ?? 30;
    if (minutesSinceAcquired < liveToFreshMin) return 'live';
    return _evaluateFreshDecay(instance, decayRule, currentGameMinute, coolerIcePacked);
  }

  // ③ fresh / chilled 상태 → 부패 계산
  return _evaluateFreshDecay(instance, decayRule, currentGameMinute, coolerIcePacked);
}

/** @internal fresh/chilled 상태 기준 부패 평가 */
function _evaluateFreshDecay(
  instance: InventoryItemInstance,
  decayRule: ConditionDecayRule,
  currentGameMinute: number,
  coolerIcePacked: boolean
): ItemConditionState {
  const isInCooler = instance.coolerStoredAtGameMinute !== null;

  if (isInCooler && coolerIcePacked) {
    // 쿨러 보관 중: coolerStoredAt 이후 경과 분 기준
    const minutesInCooler = currentGameMinute - (instance.coolerStoredAtGameMinute ?? currentGameMinute);
    if (minutesInCooler >= decayRule.spoilMinutesInCooler) return 'spoiled';
    return 'chilled';
  } else {
    // 쿨러 밖 (상온): acquiredAt 이후 경과 분 기준
    const minutesOutside = currentGameMinute - instance.acquiredAtGameMinute;
    if (minutesOutside >= decayRule.spoilMinutesOutsideCooler) return 'spoiled';
    return 'fresh';
  }
}
