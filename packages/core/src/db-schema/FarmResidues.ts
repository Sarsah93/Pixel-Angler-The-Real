/**
 * @file FarmResidues.ts
 * @description 284차 — 밭 부산물(영농부산물): 깻대 · 콩대 · 보릿짚 · 옥수숫대 · 검불 · 버섯 폐배지 · 깻묵.
 *
 * 사용자 「현재 구현된 모든 작물 기준으로 쓰임새가 있는 부산물들 전체적으로 다 찾고 … 반영하자」(2026-10-28).
 * 조사(같은 날 — scratchpad `byproduct_research.md`):
 *  - 들깨 · 참깨 · 콩 · 보리를 털고 남는 줄기 · 짚 · 깍지는 예전엔 땔감 · 쇠죽 · 퇴비였다. 지금은 태우지 않고(영농부산물 소각 금지)
 *    **잘게 썰어 밭에 넣는다**(토양 환원) — 게임은 이것을 「퇴비 대신 밭에 넣기」로 쓴다(칸 하나 = `soilPerCell` g).
 *  - 양(칸 1㎡ 기준 — 수확지수에서 환산): 들깻대 300~550g(추정 — 들깨 수확지수 자료 없음 · 0.15~0.25로 둠) ·
 *    참깻대 80~230g(수확지수 0.18~0.38) · 콩대 · 깍지 160~330g(0.38~0.56) · 보릿짚 420~600g(0.46~0.54) ·
 *    옥수숫대 포기당 0.5~1kg 생체(추정).
 *  - 보릿짚은 볏짚처럼 짚 덮기에도 쓴다(500g = 볏짚 1칸 분). 검불은 키질로 갈라낸 꼬투리 부스러기 · 쭉정이.
 *  - 버섯 수확후배지(폐배지)는 톱밥 배지 — 퇴비가 주 쓰임(경기농기원 — 가축분퇴비의 톱밥 대신 배지 40%).
 *  - 깻묵(방앗간에서 짜고 남은 것) = 유박(油粕) — 질소 2.4% · 인산 1.3% · 칼륨 1.2%. 밑거름 · 웃거름으로 쓴다(1㎡에 100~200g).
 *    민물 떡밥(신장떡밥) 재료지만 **바다 밑밥에 쓰는 근거는 없다** — 게임은 바다낚시라 미끼로 잇지 않는다.
 *
 * 모두 g으로 센다(가방 수량 = g) · 가게는 사지 않는다 · 신선도가 없다(마른 것).
 */

/** 밭 부산물 한 가지 */
export interface FarmResidueDef {
  itemId: string;
  nameKo: string;
  nameEn: string;
  /** 이만큼(g) 넣으면 그 칸에 퇴비를 넣은 것과 같다(「밭에 넣기」) */
  soilPerCell: number;
  /** 짚 덮기(볏짚 1칸 분 대신) — 이만큼(g) */
  mulchPerCell?: number;
  /** 한 줄(상세 · 위키) */
  noteKo: string;
  noteEn: string;
}

export const FARM_RESIDUES: readonly FarmResidueDef[] = [
  {
    itemId: 'res_sesame_stalk', nameKo: '깻대', nameEn: 'Sesame stalks', soilPerCell: 1000,
    noteKo: '들깨 · 참깨를 털고 남은 마른 줄기. 예전엔 불쏘시개였다 — 이제는 잘게 썰어 밭에 넣는다.',
    noteEn: 'The dry stalks left after threshing perilla and sesame. Once kindling — now chopped and worked back into the soil.',
  },
  {
    itemId: 'res_bean_stalk', nameKo: '콩대', nameEn: 'Bean stalks', soilPerCell: 1000,
    noteKo: '콩을 털고 남은 줄기와 깍지. 옛날엔 쇠죽에 넣었다 — 썰어 밭에 넣으면 흙이 부드러워진다.',
    noteEn: 'Stalks and empty pods left after threshing beans. They once went into cattle mash — chopped into the soil, they loosen it.',
  },
  {
    itemId: 'res_barley_straw', nameKo: '보릿짚', nameEn: 'Barley straw', soilPerCell: 1000, mulchPerCell: 500,
    noteKo: '보리를 털고 남은 짚. 볏짚처럼 이랑을 덮는 데도 쓴다(500g이 볏짚 한 칸 분).',
    noteEn: 'The straw left after threshing barley. It covers beds like rice straw too (500g does the work of one cell of rice straw).',
  },
  {
    itemId: 'res_corn_stalk', nameKo: '옥수숫대', nameEn: 'Corn stalks', soilPerCell: 1500,
    noteKo: '이삭을 따고 남은 옥수수 줄기 · 잎. 질겨서 더디 썩는다 — 잘게 썰어 넣는다.',
    noteEn: 'The stalks and leaves left after picking the ears. Tough and slow to rot — chop them fine before working them in.',
  },
  {
    itemId: 'res_chaff', nameKo: '검불', nameEn: 'Chaff', soilPerCell: 300,
    noteKo: '키질로 날려 보낸 꼬투리 부스러기와 쭉정이. 가볍지만 모아 두면 밭에 넣을 거리가 된다.',
    noteEn: 'Pod fragments and empty husks blown off by winnowing. Light, but gathered up they are something to work into the soil.',
  },
  {
    itemId: 'res_spent_substrate', nameKo: '폐배지', nameEn: 'Spent mushroom substrate', soilPerCell: 1000,
    noteKo: '버섯을 다 거둔 톱밥 배지. 버섯 균사가 톱밥을 반쯤 삭혀 두어 좋은 퇴비 재료다.',
    noteEn: 'The sawdust block after the last mushroom flush. The mycelium has half-broken the sawdust down — good compost material.',
  },
  {
    itemId: 'farm_oilcake', nameKo: '깻묵', nameEn: 'Oil cake (kkaemuk)', soilPerCell: 200,
    noteKo: '방앗간에서 기름을 짜고 남은 깨 덩이. 유박 거름이다 — 한 칸에 200g이면 밑거름이 된다. 여름엔 쌓아 두면 저절로 불이 붙기도 한다.',
    noteEn: 'The pressed cake left when the mill squeezes out the oil. An oil-cake fertiliser — 200g feeds one cell. Piled up in summer it can catch fire by itself.',
  },
];

const BY_ID = new Map(FARM_RESIDUES.map((r) => [r.itemId, r]));

/** 밭 부산물인가 → 그 정의 */
export function farmResidueDef(itemId: string): FarmResidueDef | undefined {
  return BY_ID.get(itemId);
}

/** 짚 덮기에 볏짚 대신 쓸 수 있는 밭 부산물(보릿짚) */
export function mulchResidues(): readonly FarmResidueDef[] {
  return FARM_RESIDUES.filter((r) => r.mulchPerCell);
}
