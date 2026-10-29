/**
 * @file CureItems.ts
 * @description 285차 — 갈무리해 나온 것(말린 시래기 · 옥수수수염차 · 깻잎 장아찌 · 콩잎 장아찌)의 가방 모양.
 *
 * 정본은 core `rules/HomeCure.ts`(`CURE_ITEMS` — 이름 · 값 · 영양 · 요리 재료). 여기는 가방 템플릿만 만든다.
 * - 말려서 · 삭혀서 오래 두는 것이라 신선도가 없다(`condition` 없음).
 * - 그림은 Gemini 아이템 그림(`ItemImages.ts` — 아이템 id)이 정본이고, 없을 때는 16px 공용 아이콘.
 * - 걸고 · 담그고 · 거두는 일은 `store/CureQueue.ts` · `ui/CurePanel.ts`.
 */

import { CURE_ITEMS, type CureItemDef } from '@tra/core';
import type { InvItemTemplate } from '../store/InventoryStore.js';
import { itemVitalsOf } from './ItemVitals.js';

/** 소분류 — 가게 매입 · 위키 선반이 이 이름으로 알아본다 */
export const CURE_SUB = '갈무리';

/** 그림이 없을 때 쓰는 16px 아이콘 */
const FALLBACK_PX: Record<string, string> = {
  cure_siraegi: 'px:it_herb', cure_corn_silk_tea: 'px:it_herb',
  cure_pickle_perilla: 'px:it_crock', cure_pickle_bean_leaf: 'px:it_crock',
};

function cureTemplate(d: CureItemDef): InvItemTemplate {
  return {
    id: d.id, name: d.nameKo, icon: '', iconTexture: FALLBACK_PX[d.id] ?? 'px:it_veg',
    category: 'food', subCategory: CURE_SUB, basePrice: d.basePrice, equippable: false,
    ...(d.cookIngredient ? { cookIngredient: d.cookIngredient } : {}),
    ...itemVitalsOf(d.id),   // 수염차 · 장아찌 — 허기 · 수분(영양표) · 따뜻한 차는 피로 조금
  };
}

/** 갈무리 아이템 전부 — 도감 · 세이브 백필 · 지급이 읽는다 */
export const CURE_ITEM_TEMPLATES: InvItemTemplate[] = CURE_ITEMS.map(cureTemplate);

const BY_ID = new Map(CURE_ITEM_TEMPLATES.map((t) => [t.id, t]));

/** id → 갈무리 아이템 템플릿(없으면 null) */
export function cureItemTemplate(id: string): InvItemTemplate | null {
  return BY_ID.get(id) ?? null;
}

/** 갈무리 아이템 설명(위키 · 상세 창) */
export function cureItemDesc(id: string): string | undefined {
  return CURE_ITEMS.find((c) => c.id === id)?.descKo;
}
