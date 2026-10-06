/**
 * @file ShopStock.ts
 * @description 상점 진열 재고 규칙 (221차 — 사용자 지시)
 *
 * 「낚시용품점이나 대형마트는 하루에 다 쓰지도 못할 만큼(수백 개) 들여 놓고, 작은 낚시점은 매대에 몇십 개뿐」.
 *  - 가게 규모 3단계(`large` · `medium` · `small`)는 **가게 종류 + 상호 + 좌판/인물 가게 여부**로 정한다.
 *  - 한 품목의 하루 재고 = 규모 × 품목 갈래(흔한 소모품 `bulk` / 큰 물건 `big`) 기본값 × 품목마다 고정된 흔들림(0.75~1.25).
 *    흔들림은 가게 키 + 품목 키 해시라 매일 같다(어느 가게는 그 미끼를 넉넉히 두고, 어느 가게는 조금 둔다).
 *  - 재고는 하루 경계(KST 새벽 4시 — `logicalYmd`)에 다시 찬다. 이야기가 여는 물건 · 퀘스트 물건은 동나지 않는다(막힘 방지).
 *
 * 순수 규칙만 둔다 — 판 수량 장부 · 세이브는 클라이언트 `ShopStore`.
 */

/** 가게 규모 */
export type ShopScale = 'large' | 'medium' | 'small';

/** 품목 갈래 — 흔한 소모품 / 큰 물건(낚싯대 · 릴 · 가구 · 칼 등 한 번에 한두 개 사는 것) */
export type StockBucket = 'bulk' | 'big';

/** 규모 × 갈래 하루 기본 재고 */
export const SHOP_STOCK_BASE: Record<ShopScale, Record<StockBucket, number>> = {
  large: { bulk: 400, big: 12 },
  medium: { bulk: 80, big: 5 },
  small: { bulk: 24, big: 2 },
};

/** 이 수 이상 남으면 칸에 숫자를 쓰지 않는다(「넉넉」) — 대형 가게 진열대가 숫자로 시끄럽지 않게 */
export const SHOP_STOCK_PLENTY = 100;

/** 대형으로 읽는 상호 — 수협 · 위판 · 활어센터 · 시장 · 대형/할인/창고형 · 농협/축협 하나로 · 백화점 */
const LARGE_NAME = /수협|위판|활어\s*센터|어판장|공판장|수산\s*시장|관광\s*수산|시장|대형|할인|창고|하나로|농협|축협|프레시|백화|아울렛|월드/;
/** 작게 읽는 상호 — 동네 슈퍼 · 상회 · 가게 · 좌판 */
const SMALL_NAME = /슈퍼|상회|가게|난전|노점|좌판|구멍/;

export interface ShopScaleInput {
  /** 건물 종류(클라이언트 `BuildingKind`) */
  kind: string;
  /** 상호(없으면 빈 문자열) */
  name: string;
  /** 길가 좌판 */
  stall?: boolean;
  /** 이야기 인물이 여는 가게(공방 · 집 앞 등) */
  npc?: boolean;
  /** 상호가 없는 기본 가게(지역 대표 — 프롤로그 직판장 등) */
  fallback?: boolean;
}

/**
 * 가게 규모. 직판장(=낚시용품을 겸하는 곳)은 대표 직판장 · 수협 · 시장 · 대형 상호면 대형, 그 밖의 낚시점은 작은 가게다.
 * 마트는 「○○마트」면 중간, 농협 · 창고형이면 대형, 동네 슈퍼면 작다. 편의점 · 약국은 늘 작다.
 */
export function shopScaleOf(s: ShopScaleInput): ShopScale {
  if (s.stall || s.npc) return 'small';
  const name = s.name ?? '';
  switch (s.kind) {
    case 'market':
      if (s.fallback || LARGE_NAME.test(name)) return 'large';
      return 'small';
    case 'mart':
      if (SMALL_NAME.test(name)) return 'small';
      if (LARGE_NAME.test(name)) return 'large';
      return 'medium';
    case 'daily':
      return LARGE_NAME.test(name) ? 'large' : 'medium';
    case 'convenience':
    case 'pharmacy':
      return 'small';
    default:
      // 음식점 · 카페 · 주점 — 하루에 만들어 두는 만큼
      return 'medium';
  }
}

export interface StockEntryInput {
  /** 인벤토리 분류(gear · consumable · food · tackle · lure · quest · etc) */
  category: string;
  /** 1회 구매 상한 — 1~2면 한두 개씩 사는 큰 물건 */
  maxPerPurchase: number;
  /** 이야기가 여는 물건 */
  unlockKey?: string;
  /** 집 가구 */
  furnKind?: string;
  /** 판매가 — 비싼 물건(낚싯대 등)은 한두 개씩 들여놓는다 */
  price?: number;
}

/** 이 값 이상이면 큰 물건으로 친다(낚싯대 · 릴 · 공구 — 소모품 묶음은 이보다 싸다) */
export const SHOP_STOCK_BIG_PRICE = 40000;

/** 품목 갈래 */
export function stockBucketOf(e: StockEntryInput): StockBucket {
  return e.furnKind || e.category === 'gear' || e.maxPerPurchase <= 2 || (e.price ?? 0) >= SHOP_STOCK_BIG_PRICE ? 'big' : 'bulk';
}

/** 동나지 않는 물건 — 이야기가 연 물건 · 퀘스트 물건(그날 못 사면 이야기가 하루 막힌다) */
export function stockUnlimited(e: StockEntryInput): boolean {
  return !!e.unlockKey || e.category === 'quest';
}

/** 문자열 해시 → [0,1) (FNV-1a) */
function hash01(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * 그 가게 그 품목의 하루 재고. `null` = 동나지 않는다.
 * @param shopKey 가게 키(지점 — `region:osm:id` 등)
 * @param entryKey 품목 키(`id|이름`)
 */
export function shopStockCap(scale: ShopScale, e: StockEntryInput, shopKey: string, entryKey: string): number | null {
  if (stockUnlimited(e)) return null;
  const base = SHOP_STOCK_BASE[scale][stockBucketOf(e)];
  const k = 0.75 + 0.5 * hash01(`${shopKey}#${entryKey}`);
  return Math.max(1, Math.round(base * k));
}
