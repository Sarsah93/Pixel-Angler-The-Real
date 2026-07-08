/**
 * @file TileGatherEngine.ts
 * @description 타일 기반 채집 엔진
 *
 * 방파제 직벽, 갯바위 수면 경계 등 특정 위험 구역에서의
 * 채집 가능 아이템 결정 및 미끄러짐(Slip) 위험 계산을 담당합니다.
 *
 * 규칙:
 * - 방파제 직벽(BREAKWATER_EDGE): 만조 시 성게(뜰채), 갯강구/바위게(손) 채집 가능
 * - 갯바위 수면 경계(ROCKY_EDGE): 거북손(칼 도구) 채집 가능
 * - 위험 칸 이동 시 30% 슬립 확률 → 체력/피로도 50% 감소, 한 칸 강제 후퇴
 */

// ─────────────────────────────────────────────
// 채집 타일 종류
// ─────────────────────────────────────────────

export type EdgeTileType = 'BREAKWATER_EDGE' | 'ROCKY_EDGE' | 'TIDAL_FLAT_EDGE' | 'NONE';

// ─────────────────────────────────────────────
// 채집 가능 아이템 정의
// ─────────────────────────────────────────────

export type GatherToolType = 'hand' | 'net' | 'knife' | 'trap';

export interface GatherableItem {
  /** 아이템 고유 ID */
  id: string;
  /** 아이템 한국어 명칭 */
  nameKo: string;
  /** 채집에 필요한 도구 */
  requiredTool: GatherToolType;
  /** 필요한 도구 한국어 라벨 */
  toolNameKo: string;
  /** 채집 성공 확률 (0.0 ~ 1.0) */
  baseSuccessRate: number;
  /** 만조 필요 여부 */
  requiresHighTide: boolean;
  /** 야간 전용 여부 */
  nightOnly: boolean;
  /** 획득 개수 범위 */
  quantityMin: number;
  quantityMax: number;
  /** 단가 (원) */
  unitPriceWon: number;
  /** 아이콘 이모지 */
  icon: string;
  /** 설명 */
  description: string;
}

/** 엣지 타일 종류별 채집 가능 아이템 DB */
export const GATHER_ITEM_DATABASE: Record<EdgeTileType, GatherableItem[]> = {
  BREAKWATER_EDGE: [
    {
      id: 'sea_urchin',
      nameKo: '성게',
      requiredTool: 'net',
      toolNameKo: '뜰채',
      baseSuccessRate: 0.65,
      requiresHighTide: true,
      nightOnly: false,
      quantityMin: 1,
      quantityMax: 4,
      unitPriceWon: 3500,
      icon: '🦔',
      description: '만조 시 방파제 직벽 수면 아래에 붙어 있는 성게. 뜰채로 긁어낸다.',
    },
    {
      id: 'sea_roach',
      nameKo: '갯강구',
      requiredTool: 'hand',
      toolNameKo: '맨손',
      baseSuccessRate: 0.8,
      requiresHighTide: false,
      nightOnly: false,
      quantityMin: 2,
      quantityMax: 8,
      unitPriceWon: 200,
      icon: '🪲',
      description: '방파제 벽면 틈새를 빠르게 기어다니는 갯강구. 루어 미끼로 활용 가능.',
    },
    {
      id: 'rock_crab',
      nameKo: '바위게',
      requiredTool: 'hand',
      toolNameKo: '맨손',
      baseSuccessRate: 0.6,
      requiresHighTide: false,
      nightOnly: false,
      quantityMin: 1,
      quantityMax: 3,
      unitPriceWon: 1200,
      icon: '🦀',
      description: '방파제와 테트라포드 틈 사이에 숨어있는 바위게. 통발 미끼로 최적.',
    },
  ],
  ROCKY_EDGE: [
    {
      id: 'gooseneck_barnacle',
      nameKo: '거북손',
      requiredTool: 'knife',
      toolNameKo: '칼',
      baseSuccessRate: 0.7,
      requiresHighTide: false,
      nightOnly: false,
      quantityMin: 3,
      quantityMax: 10,
      unitPriceWon: 1800,
      icon: '🦵',
      description: '갯바위 수면 바로 위에 군락을 이루는 거북손. 과도나 사시미 칼로 뿌리째 떼어낸다. 국내 별미.',
    },
    {
      id: 'limpet',
      nameKo: '삿갓조개',
      requiredTool: 'knife',
      toolNameKo: '칼',
      baseSuccessRate: 0.75,
      requiresHighTide: false,
      nightOnly: false,
      quantityMin: 2,
      quantityMax: 6,
      unitPriceWon: 900,
      icon: '🐚',
      description: '갯바위에 단단히 붙어있는 삿갓조개. 칼끝으로 비틀어 떼어낸다.',
    },
    {
      id: 'rock_crab',
      nameKo: '바위게',
      requiredTool: 'hand',
      toolNameKo: '맨손',
      baseSuccessRate: 0.55,
      requiresHighTide: false,
      nightOnly: false,
      quantityMin: 1,
      quantityMax: 2,
      unitPriceWon: 1200,
      icon: '🦀',
      description: '갯바위 틈새에 숨어있는 바위게.',
    },
  ],
  TIDAL_FLAT_EDGE: [
    {
      id: 'clam',
      nameKo: '바지락',
      requiredTool: 'hand',
      toolNameKo: '맨손',
      baseSuccessRate: 0.85,
      requiresHighTide: false,
      nightOnly: false,
      quantityMin: 4,
      quantityMax: 15,
      unitPriceWon: 600,
      icon: '🦪',
      description: '조간대 모래질 바닥에 묻혀 있는 바지락. 손으로 긁어내어 채취.',
    },
  ],
  NONE: [],
};

// ─────────────────────────────────────────────
// 채집 결과
// ─────────────────────────────────────────────

export interface GatherAttemptResult {
  success: boolean;
  item: GatherableItem;
  quantityGained: number;
  totalValueWon: number;
  message: string;
}

// ─────────────────────────────────────────────
// 미끄러짐(Slip) 판정 결과
// ─────────────────────────────────────────────

export interface SlipCheckResult {
  slipped: boolean;
  /** 잃은 체력 (0 = 미끄러지지 않음) */
  staminaLost: number;
  /** 잃은 피로도 */
  fatigueLost: number;
}

// ─────────────────────────────────────────────
// 엔진 함수
// ─────────────────────────────────────────────

/**
 * 위험 칸 이동 시 미끄러짐 판정
 * @param slipProbability 기본 미끄러짐 확률 (기본 0.3)
 * @param currentStamina 현재 체력
 * @param currentFatigue 현재 피로도
 */
export function checkSlipHazard(
  slipProbability = 0.3,
  currentStamina = 100,
  currentFatigue = 0,
): SlipCheckResult {
  const slipped = Math.random() < slipProbability;
  if (!slipped) return { slipped: false, staminaLost: 0, fatigueLost: 0 };

  const staminaLost = Math.floor(currentStamina * 0.5);
  const fatigueLost = Math.floor((100 - currentFatigue) * 0.5);

  return { slipped: true, staminaLost, fatigueLost };
}

/**
 * 해당 엣지 타일 타입에서 채집 가능한 아이템 목록 반환
 * @param edgeType 타일 종류
 * @param isHighTide 현재 만조 여부
 * @param isNight 현재 야간 여부
 */
export function getAvailableGatherItems(
  edgeType: EdgeTileType,
  isHighTide: boolean,
  isNight: boolean,
): GatherableItem[] {
  const all = GATHER_ITEM_DATABASE[edgeType] ?? [];
  return all.filter((item) => {
    if (item.requiresHighTide && !isHighTide) return false;
    if (item.nightOnly && !isNight) return false;
    return true;
  });
}

/**
 * 채집 시도 실행
 * @param item 채집 대상 아이템
 * @param hasTool 해당 도구 보유 여부
 */
export function attemptGather(
  item: GatherableItem,
  hasTool: boolean,
): GatherAttemptResult {
  if (!hasTool) {
    return {
      success: false,
      item,
      quantityGained: 0,
      totalValueWon: 0,
      message: `${item.toolNameKo}이(가) 없어 채집할 수 없습니다.`,
    };
  }

  const success = Math.random() < item.baseSuccessRate;
  if (!success) {
    return {
      success: false,
      item,
      quantityGained: 0,
      totalValueWon: 0,
      message: `${item.nameKo} 채집에 실패했습니다...`,
    };
  }

  const qty =
    item.quantityMin + Math.floor(Math.random() * (item.quantityMax - item.quantityMin + 1));
  const totalValue = qty * item.unitPriceWon;

  return {
    success: true,
    item,
    quantityGained: qty,
    totalValueWon: totalValue,
    message: `${item.icon} ${item.nameKo} ${qty}개 채집 성공! (+${totalValue.toLocaleString()}원 상당)`,
  };
}
