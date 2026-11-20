/**
 * @file ItemIdAlias.ts
 * @description 256차 — 같은 물건인데 id가 둘이던 아이템의 옛 id → 정본 id (게임 모듈을 싣지 않는 표 — 여러 스토어가 같이 쓴다).
 *
 * 시작 아이템(`inv_*`)과 상점 · 루어 카탈로그 아이템이 이름 · 제원이 같은데 id만 달라
 * 위키 · 도감에 같은 이름이 두 장 보이고(사용자 지적 — 「뜰채 5m」 둘), 가방에서도 따로 쌓였다.
 *  - 정본은 **시작 아이템 쪽** — 상점이 시작 아이템 id를 그대로 파는 기존 관례(구멍찌 0.8호 · 합사 원줄 · 카본 목줄 · 감성돔 바늘)를 따른다.
 *  - **지그헤드만 루어 카탈로그 id**(`lure_jighead_3`)가 정본 — 채비 무게를 id의 숫자로 읽어(`jigHeadWeightById`)
 *    `inv_jighead`는 0g으로 계산되고 있었다.
 * 옛 id는 세이브 로드(`InventoryStore.deserialize`) · 아이템 추가(`addItem`) · 상점 즐겨찾기 · 도감 기록에서 정본으로 바뀐다.
 */
import { upgradeWeightSuffix } from '@tra/core';

/** 332 — 손질 창이 만드는 산출물 id(머리 · 뼈 · 껍질 · 필렛 · 엔가와 · 손질한 통마리 · 가마살 · 중골 살 · 덩어리) */
const BUTCHERY_PRODUCT_ID = /^inv_(byp|fillet|filletribs|filletskin|filletpin|filletengw|engawa|engwskin|dressed|kama|nakaochi|loinskin)_/;

/**
 * 332 — 손질 산출물 이름 끝의 옛 무게 표기(「… 18,269g」)를 새 표기(「… 18.3kg(18,269g)」)로 — 1,000g 넘는 것만 바뀐다.
 * 이름만 바꾼다(무게 · 값 · 칸은 그대로). 가방(`canonicalizeItem`) · 냉장고 · 바닥에 놓인 것을 불러올 때 거친다.
 */
export function upgradeButcheryWeightName<T extends { id: string }>(t: T): T {
  const name = (t as { name?: unknown }).name;
  if (typeof name !== 'string' || !BUTCHERY_PRODUCT_ID.test(t.id)) return t;
  const next = upgradeWeightSuffix(name);
  return next === name ? t : { ...t, name: next };
}

export const ITEM_ID_ALIAS: Readonly<Record<string, string>> = {
  shop_net_5: 'inv_net',          // 뜰채 5m — 상점 · 시작 아이템
  shop_float10: 'inv_float10',    // 구멍찌 1.0호 — 상점 · 제작 결과 · 시작 아이템
  shop_carbon3: 'inv_carbon15',   // AMSTRONG 카본 목줄 3호 · 150m — 상점이 둘을 다른 값(10,500 · 14,000원)에 같이 팔고 있었다
  inv_jighead: 'lure_jighead_3',  // 지그헤드 3g — 시작 아이템(낚시용품 탭) · 루어 카탈로그(루어 탭)
};

/**
 * 정본 id(별칭이 아니면 그대로).
 * 282차 — 개체 id(`shop_net_5#3` — 장비 · 단단한 루어)는 번호 앞(카탈로그 id)만 바꾸고 번호는 그대로 둔다.
 */
export function canonicalItemId(id: string): string {
  const k = id.indexOf('#');
  if (k < 0) return ITEM_ID_ALIAS[id] ?? id;
  const base = ITEM_ID_ALIAS[id.slice(0, k)];
  return base ? base + id.slice(k) : id;
}
