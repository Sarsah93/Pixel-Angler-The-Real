/**
 * @file Consignment.ts
 * @description 위판 출품 규칙 — 인벤토리 아이템 → core 위판 로트 입력 (147차)
 *
 * 패널(목록·자격 표시)과 씬(세션 생성·정산)이 **같은 규칙**을 쓰도록 한 곳에 모은다.
 * 판정 자체는 core `canConsign`이 하고, 여기서는 아이템 필드를 그 계약으로 옮기기만 한다.
 */

import type { AuctionCategory, ConsignInput, LawVerdict } from '@tra/core';
import { canConsign, provenanceOf } from '@tra/core';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';

/** 최저 희망가 모드 — 시세 대비 비율. 유찰되면 그대로 돌려받는다 */
export type ReserveMode = 'none' | 'p70' | 'p90';

export const RESERVE_LABEL: Record<ReserveMode, string> = {
  none: '없음 (부르는 대로)',
  p70: '시세 70%',
  p90: '시세 90%',
};

const RESERVE_FRAC: Record<ReserveMode, number> = { none: 0, p70: 0.7, p90: 0.9 };

/** 신선도 → 위판 등급. 선도가 곧 등급이다(M2-02 「유찰」의 교훈). */
export function consignGradeOf(item: InvItem): '특' | '상' | '보통' {
  switch (item.condition) {
    case 'live': case 'fresh': return '특';
    case 'chilled': case 'frozen': return '상';
    default: return '보통';
  }
}

/** 활어는 활어 경매(03~07시), 나머지는 선어 경매(01~03시) */
export function consignCategoryOf(item: InvItem): AuctionCategory {
  return item.condition === 'live' ? 'fish_live' : 'fish_fresh';
}

/**
 * 이 아이템을 위판할 수 있는가.
 *
 * ⚠ 일반 판매(`StoryStore.sellVerdict`)는 `TUNING.law.enforceRodSell` 토글을 보지만,
 *   위판은 **토글과 무관하게 항상 자격을 본다** — 위판장은 벌칙 장치가 아니라 계원 창구이고,
 *   낚싯대 어획을 배제하는 것이 위판이 일반 판매와 다른 이유 그 자체다.
 */
export function consignVerdictOf(item: InvItem, licenses: readonly string[], regionId: string, day: number): LawVerdict | null {
  if (item.subCategory !== '어획물' || !item.speciesId) {
    return {
      allowed: false, reasonKo: '위판장은 어획물만 받습니다.', reasonEn: 'Only catch can be consigned.',
      alternatives: ['상점에 판매'], alternativesEn: ['Sell at a shop'],
    };
  }
  const v = canConsign(provenanceOf(item.catchMethod ?? 'rod', regionId, item.lengthCm, day), licenses);
  return v.allowed ? null : v;
}

/** 위판 가능한 어획물만 추린다 (그리드에 올라간 것 · 부패·0원 제외) */
export function consignableItems(licenses: readonly string[], regionId: string, day: number): InvItem[] {
  return InventoryStore.items.filter((i) =>
    i.slot >= 0
    && i.subCategory === '어획물'
    && !!i.speciesId
    && !i.bound
    && !consignVerdictOf(i, licenses, regionId, day)
    && InventoryStore.getSellPrice(i) > 0,
  );
}

/**
 * 아이템 → 로트 입력. 기준 단가는 `getSellPrice`(경락 시세 캐시 + 신선도 배율)를 kg으로 환산한다.
 * ⚠ 여기에 `getMarketPriceFactor`를 **또** 곱하지 말 것 — 시세 이중 적용(39차 함정).
 */
export function consignInputOf(item: InvItem, reserve: ReserveMode, origin: string, crated: boolean): ConsignInput {
  const weightKg = Math.max(0.01, (item.weightG ?? 0) / 1000);
  const basePricePerKg = Math.round(InventoryStore.getSellPrice(item) / weightKg);
  return {
    sourceItemId: item.id,
    speciesId: item.speciesId!,
    nameKo: item.name,
    category: consignCategoryOf(item),
    weightKg,
    grade: consignGradeOf(item),
    origin,
    basePricePerKg,
    method: item.catchMethod ?? 'rod',
    reservePerKg: Math.round(basePricePerKg * RESERVE_FRAC[reserve]),
    crated,
  };
}

/** 위판 규격 상자 보유 여부 — M2-01 보상으로 해금되는 직판장 품목 */
export function hasCrate(): boolean {
  return InventoryStore.items.some((i) => i.id === 'crate_std_pro' && i.qty > 0);
}
