/**
 * @file GiftTags.ts
 * @description 297차 — 가방 물건에서 선물 꼬리표를 뽑는다(`kind:` · `item:` · `species:` · `specialty:`). 규칙은 core `rules/Gifts.ts`.
 *
 *  줄 수 있는 것 = 먹을거리(어획물 · 갯것 · 농산물 · 가공품 · 요리 · 회 · 술 · 커피 · 단것 · 안주) · 식자재 · 양념 · 기호품.
 *  장비 · 채비 · 도구 · 이야기 물건(귀속 · quest 분류) · 설치물은 선물이 아니다.
 */

import { specialtyOf, type GiftItemView, type GiftKind } from '@tra/core';
import type { InvItem } from '../store/InventoryStore.js';
import { isInstanceItem } from '../store/InventoryStore.js';

/** 아이템 id → 종류(가게 물건 중 종류가 이름으로 안 보이는 것) */
const KIND_BY_ID: Readonly<Record<string, GiftKind>> = {
  shop_coffee: 'coffee', shop_latte: 'coffee',
  shop_dessert: 'sweet', shop_snackbar: 'sweet',
  shop_makgeolli: 'drink', shop_soju: 'drink',
  shop_anju: 'snack', shop_riceball: 'snack', inv_can: 'snack',
  inv_cigarette_pack: 'smoke',
};

/** 종류 하나 — 없으면 선물이 아니다 */
export function giftKindOf(item: Pick<InvItem, 'id' | 'category' | 'subCategory' | 'speciesId' | 'forageCatch'>): GiftKind | undefined {
  const byId = KIND_BY_ID[item.id];
  if (byId) return byId;
  if (item.forageCatch) return 'forage';
  const sub = item.subCategory ?? '';
  if (sub === '어획물' || (item.speciesId && item.category === 'food')) return 'fish';
  if (sub === '농산물') return 'crop';
  if (sub === '가공품') return item.id.startsWith('proc_') ? 'processed' : 'snack';
  if (sub.startsWith('요리(회') || sub.startsWith('요리(숙회')) return 'sashimi';
  if (sub.startsWith('요리')) return 'dish';
  if (sub === '식자재' || sub === '양념' || sub === '재료') return 'ingredient';
  if (sub === '기호품') return 'smoke';
  if (item.category === 'food') return 'snack';
  return undefined;
}

/** 줄 수 있는 물건인가 */
export function isGiftable(item: InvItem): boolean {
  if (item.bound || item.category === 'quest' || item.qty <= 0) return false;
  if (isInstanceItem(item)) return false;   // 장비 · 단단한 루어 개체
  return giftKindOf(item) !== undefined;
}

/** 규칙이 보는 한 칸 */
export function giftViewOf(item: InvItem): GiftItemView {
  const tags: string[] = [`item:${item.id}`];
  const kind = giftKindOf(item);
  if (kind) tags.push(`kind:${kind}`);
  if (item.speciesId) tags.push(`species:${item.speciesId}`);
  // 294차 명산지 꼬리표 — 얻은 지역의 특산이면 specialty:<id>
  const key = item.speciesId ?? item.id;
  const sp = specialtyOf(key, item.originRegion) ?? specialtyOf(item.id, item.originRegion);
  if (sp) tags.push(`specialty:${sp.id}`);
  return { id: item.id, nameKo: item.name, tags, originRegion: item.originRegion };
}
