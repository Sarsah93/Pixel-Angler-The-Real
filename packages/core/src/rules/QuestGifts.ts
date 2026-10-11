/**
 * @file QuestGifts.ts
 * @description 237차 — 이야기 인물이 퀘스트를 맡길 때 **철 따라 다르게** 건네는 물건.
 *
 * N19-7 「귀퉁이 바구니」: 정옥선 좌판 귀퉁이 바구니는 할머니 집 앞 밭에서 온다. 남는 것을 나눠 주는데,
 * 남는 것은 철마다 다르다 — **그달 바로 심을 수 있는 것**만 준다(받고 나서 철이 막혀 못 심는 일이 없게).
 *  - 봄(4 · 5월) · 가을(9 · 10월): 상추 모종 두 칸 몫(칸당 9포기 × 2 = 18포기) — 텃밭
 *  - 3월: 시금치 씨앗 2봉 — 텃밭(봄 파종 첫 달)
 *  - 여름(6~8월): 열무 씨앗 2봉 — 텃밭(여름에도 한 달이면 거둔다)
 *  - 겨울(11~2월): 나물콩 2봉 + 콩나물 시루(집에 없을 때) — 집 안 선반(밖은 얼어서 못 심는다)
 *  - 텃밭에 심는 철이면 호미도 하나(가방에 없을 때) — 할머니가 쓰던 것이다.
 * 모두 난이도 1단계(쉬움) 작물이라 레벨 · 자격 요건이 없다.
 */

/** 건네는 물건 한 줄 */
export interface QuestGiftItem { id: string; qty: number }

export interface OkseonSpareGift {
  /** 가방에 넣을 것 */
  items: QuestGiftItem[];
  /** 집 「넣어 둔 가구」로 보낼 것(겨울 — 콩나물 시루) */
  furniture?: 'sprout_jar';
  /** 어디에 심는 선물인가 — 텃밭(마당) · 집 안 선반 */
  site: 'plot' | 'indoor';
}

/** 지금 가진 것(중복 지급을 막는다) */
export interface OkseonSpareHave { homi: boolean; sproutJar: boolean }

const WINTER = new Set([11, 12, 1, 2]);

/** N19-7 수락 때 정옥선이 건네는 것 — 달(KST 1~12)과 지금 가진 것으로 정한다 */
export function okseonSpareGift(month: number, have: OkseonSpareHave): OkseonSpareGift {
  if (WINTER.has(month)) {
    return { items: [{ id: 'seed_bean_sprout', qty: 2 }], site: 'indoor', ...(have.sproutJar ? {} : { furniture: 'sprout_jar' as const }) };
  }
  const items: QuestGiftItem[] = month === 3 ? [{ id: 'seed_spinach', qty: 2 }]
    : month >= 6 && month <= 8 ? [{ id: 'seed_young_radish', qty: 2 }]
      : [{ id: 'sdl_lettuce', qty: 18 }];
  if (!have.homi) items.push({ id: 'farm_homi', qty: 1 });
  return { items, site: 'plot' };
}
