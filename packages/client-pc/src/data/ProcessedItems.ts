/**
 * @file ProcessedItems.ts
 * @description 295차 — 지역 가공대에서 나온 가공품(과메기 · 명이 장아찌 · 오징어순대 · 대구포 · 반건조 옥돔)의 가방 모양.
 *
 * 정본은 core `rules/RegionalProcessing.ts`(`PROCESSED_ITEMS` — 이름 · 값 · 허기). 여기는 가방 템플릿만 만든다.
 * - 말리고 · 삭히고 · 쪄 둔 것이라 신선도가 없다(`condition` 없음 — 갈무리 전례).
 * - 그림은 Gemini 아이템 그림(`ItemImages.ts` — 아이템 id)이 정본이고, 없을 때는 16px 공용 아이콘.
 * - 얻은 지역(`originRegion`)은 찾을 때 가공장 지역으로 찍는다(`store/ProcessActions.ts`) — 그래야 특산 꼬리표 · 택배 차익이 붙는다.
 */

import { PROCESSED_ITEMS, processedItem, type ProcessedItemDef } from '@tra/core';
import type { InvItemTemplate } from '../store/InventoryStore.js';

/** 소분류 — 가게 매입 · 위키 선반 · 판매가가 이 이름으로 알아본다 */
export const PROCESSED_SUB = '가공품';

/** 그림이 없을 때 쓰는 16px 아이콘 */
const FALLBACK_PX: Record<string, string> = {
  proc_gwamegi: 'px:it_dish_grill', proc_myeongi_jangajji: 'px:it_crock', proc_squid_sundae: 'px:it_dish_braise',
  proc_daegupo: 'px:it_dish_grill', proc_dried_tilefish: 'px:it_dish_grill',
};

function processedTemplate(d: ProcessedItemDef): InvItemTemplate {
  return {
    id: d.id, name: d.nameKo, icon: '', iconTexture: FALLBACK_PX[d.id] ?? 'px:it_dish_grill',
    category: 'food', subCategory: PROCESSED_SUB, basePrice: d.basePrice, equippable: false,
    ...(d.hungerRestore !== undefined ? { hungerRestore: d.hungerRestore } : {}),
    ...(d.hydrationRestore !== undefined ? { hydrationRestore: d.hydrationRestore } : {}),
  };
}

/** 가공품 전부 — 도감 · 세이브 백필 · 지급이 읽는다 */
export const PROCESSED_ITEM_TEMPLATES: InvItemTemplate[] = PROCESSED_ITEMS.map(processedTemplate);

const BY_ID = new Map(PROCESSED_ITEM_TEMPLATES.map((t) => [t.id, t]));

/** id → 가공품 템플릿(없으면 null) */
export function processedItemTemplate(id: string): InvItemTemplate | null {
  return BY_ID.get(id) ?? null;
}

/** 가공품 설명(위키 · 상세 창) */
export function processedItemDesc(id: string): string | undefined {
  return processedItem(id)?.descKo;
}
