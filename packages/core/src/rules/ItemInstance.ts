/**
 * @file ItemInstance.ts
 * @description 개체 아이템 id (282차 — 백로그 CX · 사용자 결정 「장비랑 루어만 개체로 나누는 걸로」).
 *
 * 장비(낚싯대 · 릴 · 뜰채 · 칼 · 물뿌리개 · 옷 · 신발 · 장갑 · 가방 등)와 단단한 루어(미노우 · 스푼 · 에기 · 메탈지그 등)는
 * 한 개씩 따로 다룬다. 같은 물건이라도 고장 · 쓴 횟수 · 착용 상태가 저마다 다르기 때문이다.
 * 이런 아이템의 id는 `<카탈로그 id>#<번호>`(예: `shop_rod_float_53#4`)다.
 *
 * - 카탈로그(제원 · 그림 · 값 · 설명) 조회는 언제나 `itemBaseId`로 번호를 떼고 한다.
 * - 미끼 · 봉돌 · 바늘 · 찌 · 줄 · 웜 같은 소모품은 지금처럼 같은 id 한 칸에 수량으로 쌓는다(번호 없음).
 *
 * 순수 TS — 브라우저 API 없음.
 */

/** 개체 번호를 붙이는 구분자 */
export const ITEM_INSTANCE_SEP = '#';

/** 개체 id → 카탈로그 id (번호가 없으면 그대로) */
export function itemBaseId(id: string): string {
  const k = id.indexOf(ITEM_INSTANCE_SEP);
  return k < 0 ? id : id.slice(0, k);
}

/** 번호가 붙은 개체 id인가 */
export function isInstanceId(id: string): boolean {
  return id.includes(ITEM_INSTANCE_SEP);
}

/** 카탈로그 id(또는 다른 개체 id)에 새 번호를 붙인다 */
export function makeInstanceId(id: string, n: number): string {
  return `${itemBaseId(id)}${ITEM_INSTANCE_SEP}${Math.max(1, Math.floor(n))}`;
}

/** 개체 id의 번호 (번호가 없거나 숫자가 아니면 null) */
export function instanceNumberOf(id: string): number | null {
  const k = id.indexOf(ITEM_INSTANCE_SEP);
  if (k < 0) return null;
  const n = Number(id.slice(k + 1));
  return Number.isFinite(n) ? n : null;
}

/** 두 id가 같은 카탈로그 물건인가(번호는 보지 않는다) */
export function sameItemKind(a: string, b: string): boolean {
  return itemBaseId(a) === itemBaseId(b);
}
