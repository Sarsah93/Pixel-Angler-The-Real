/**
 * @file MillItems.ts
 * @description 284차 — 방앗간 아이템: 기름병 넷(참기름 · 들기름 × 180ml · 350ml)과 방앗간 진열.
 *
 * 사용자 결정(2026-10-28): 「방앗간 가게로 하고 병은 180ml · 350ml 두 가지로」.
 * - 병은 깨를 맡겨 짜야만 생긴다(가게가 병을 팔지 않는다 — 산 병을 되파는 돈벌이를 막는다).
 * - 병은 「병 따기」로 1큰술(15ml)씩 요리 재료가 된다(`unpack` — 참기름 350ml = 23큰술). 따지 않은 병은 식자재마트 · 식당이 산다.
 * - 계산(수율 · 공임 · 깻묵)은 core `rules/OilMill.ts`, 맡기기 · 찾기는 `store/MillQueue.ts`, 창은 `ui/MillPanel.ts`.
 */

import { OIL_BOTTLES, oilBottleDef, FARM_SUPPLIES, FARM_BAG_CONTAINER, type OilBottleDef } from '@tra/core';
import type { InvItemTemplate } from '../store/InventoryStore.js';
import { COOK_CORNER } from './CookItems.js';

/** 기름병 그림 — Gemini 그림(`ItemImages.ts` 아이템 id)이 없을 때 쓰는 원래 참기름 · 식용유 그림 */
const BOTTLE_ART: Record<string, string> = { sesame: 'art_sesame_oil', perilla: 'art_cooking_oil' };

/** 기름병 한 병의 가방 모양 */
export function oilBottleTemplate(def: OilBottleDef): InvItemTemplate {
  const kind = def.itemId.startsWith('oil_sesame') ? 'sesame' : 'perilla';
  return {
    id: def.itemId, name: def.nameKo, icon: '', iconTexture: BOTTLE_ART[kind], category: 'consumable', subCategory: '양념',
    basePrice: def.value, equippable: false, unpack: { id: def.spoonItemId, qty: def.spoons },
  };
}

/** 방앗간 아이템 전부(기름병 넷) — 도감 · 세이브 백필 · 포장 뜯기가 읽는다 */
export const MILL_ITEM_TEMPLATES: InvItemTemplate[] = OIL_BOTTLES.map(oilBottleTemplate);

const BY_ID = new Map(MILL_ITEM_TEMPLATES.map((t) => [t.id, t]));

/** id → 방앗간 아이템 템플릿(없으면 null) */
export function millItemTemplate(id: string): InvItemTemplate | null {
  return BY_ID.get(id) ?? null;
}

/** 기름병인가 */
export function isOilBottle(id: string): boolean {
  return !!oilBottleDef(id);
}

/** 진열 한 줄(`ShopEntry`와 같은 모양 — 순환 import를 피하려고 구조만 맞춘다) */
export type MillShopEntry = InvItemTemplate & { price: number; maxPerPurchase: number; desc: string };

/**
 * 방앗간 진열 — 곡물 봉투(털어 둔 깨를 담아 갈 봉투) + 덜어 파는 들기름 · 들깨가루 · 깨소금(1큰술).
 * 1큰술 값은 식자재마트와 같다(같은 물건). 병은 팔지 않는다(위 머리말).
 */
export function millShopEntries(): MillShopEntry[] {
  const out: MillShopEntry[] = [];
  const bag = FARM_SUPPLIES.find((s) => s.itemId === FARM_BAG_CONTAINER);
  if (bag) {
    out.push({
      id: bag.itemId, name: bag.nameKo, icon: '', iconTexture: `px:${bag.icon ?? 'it_breadpack'}`, category: 'consumable', subCategory: '농사 도구',
      basePrice: bag.price, price: bag.price, maxPerPurchase: bag.buyMax ?? 50, equippable: false, desc: bag.descKo,
    });
  }
  for (const id of ['cook_perilla_oil', 'cook_perilla_powder', 'cook_sesame_salt', 'cook_sesame_oil']) {
    const e = COOK_CORNER.find((x) => x.id === id);
    if (e) out.push({ ...e } as MillShopEntry);
  }
  return out;
}
