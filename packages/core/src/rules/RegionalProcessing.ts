/**
 * @file RegionalProcessing.ts
 * @description 295차 — 지역 가공대(사용자 지시 「지역 가공대」 — 294 특산 후속 ③). 그 지역 특산을 그 지역 가공장에 맡기면
 *  얼마 뒤 가공품이 된다 — 구룡포 과메기 덕장(꽁치) · 울릉 명이 장아찌(산마늘) · 아바이 오징어순대(살오징어) · 지세포 대구 덕장(대구) ·
 *  서귀포 옥돔 건조장(옥돔). 방앗간(`OilMill.ts`)과 같은 「맡기고 찾기」 틀이되 입력이 어종 · 수확물이라 수량 단위다.
 *
 *  - 가공품은 **상하지 않는다**(`condition` 없음 — 갈무리 전례) · 얻은 지역(`originRegion`) = 가공장 지역이라 특산 꼬리표 · 택배 차익이 붙는다.
 *  - 공임 · 시간은 실제 분(mockup · 방앗간 기름 60분 기준보다 길다 — 덕장은 말리는 일).
 *  - 가게 종류 `processor`(클라이언트 `ShopCatalog`) · 손 POI(`pois.json` `shopKind: 'processor'`) · 창 `ui/ProcessPanel.ts` · 대기열 `store/ProcessQueue.ts`.
 */

export type ProcessInputDef =
  | { kind: 'species'; speciesId: string; qty: number; nameKo: string; nameEn: string }
  | { kind: 'item'; itemId: string; qty: number; nameKo: string; nameEn: string };

export interface ProcessRecipeDef {
  id: string;
  /** 이 가공을 받는 지역(WorldMap 지역 id) */
  regionIds: readonly string[];
  /** 가공장 이름(간판 · 창 제목 폴백) */
  stationKo: string;
  stationEn: string;
  nameKo: string;
  nameEn: string;
  /** 한 묶음에 드는 것 */
  input: ProcessInputDef;
  /** 한 묶음에 나오는 것 */
  output: { itemId: string; qty: number };
  /** 한 묶음 공임(원) */
  feeWon: number;
  /** 다 될 때까지(실제 분) */
  waitMin: number;
  howKo: string;
  howEn: string;
}

export interface ProcessedItemDef {
  id: string;
  nameKo: string;
  nameEn: string;
  basePrice: number;
  /** 먹으면 허기 회복(%) — 없으면 먹지 않는다 */
  hungerRestore?: number;
  hydrationRestore?: number;
  descKo: string;
  descEn: string;
}

/** 가공품 다섯 — 클라이언트 `data/ProcessedItems.ts`가 가방 템플릿을 만든다 */
export const PROCESSED_ITEMS: readonly ProcessedItemDef[] = [
  { id: 'proc_gwamegi', nameKo: '과메기 (1마리)', nameEn: 'Gwamegi, half-dried saury (1)', basePrice: 3000, hungerRestore: 14,
    descKo: '구룡포 덕장에서 북서풍에 얼렸다 녹였다 하며 말린 꽁치. 김 · 미역 · 쪽파 · 초장과 싸 먹는다.', descEn: 'Saury half-dried on Guryongpo racks, freezing and thawing in the northwest wind. Wrapped with laver, seaweed, scallion and vinegar-chili sauce.' },
  { id: 'proc_myeongi_jangajji', nameKo: '명이 장아찌 (1통)', nameEn: 'Pickled alpine leek, a tub', basePrice: 14000, hungerRestore: 6,
    descKo: '울릉도 산마늘 잎을 간장에 삭힌 장아찌. 고기 쌈에 한 장씩.', descEn: 'Ulleungdo alpine leek leaves cured in soy sauce. One leaf per wrap of meat.' },
  { id: 'proc_squid_sundae', nameKo: '오징어순대 (1마리)', nameEn: 'Squid sundae (1)', basePrice: 9000, hungerRestore: 22, hydrationRestore: 2,
    descKo: '아바이마을 실향민이 돼지 창자 대신 오징어 몸통에 속을 채워 쪄 낸 순대. 썰어서 달걀물을 입혀 부친다.', descEn: 'Abai Village sundae — refugees stuffed squid instead of pig intestine and steamed it. Sliced, dipped in egg and pan-fried.' },
  { id: 'proc_daegupo', nameKo: '대구포 (1장)', nameEn: 'Dried cod, a sheet', basePrice: 16000, hungerRestore: 10,
    descKo: '지세포 덕장에서 겨울 바닷바람에 말린 대구. 찢어 먹거나 구워 먹는다.', descEn: 'Cod dried in the winter sea wind on Jisepo racks. Torn or grilled.' },
  { id: 'proc_dried_tilefish', nameKo: '반건조 옥돔 (1마리)', nameEn: 'Half-dried red tilefish (1)', basePrice: 38000, hungerRestore: 18,
    descKo: '소금 간을 해 하루 말린 제주 옥돔. 그대로 구우면 살이 희고 달다 — 제사상에 오르는 생선.', descEn: 'Jeju red tilefish salted and dried a day. Grilled as is, the flesh is white and sweet — a fish for the ancestral table.' },
];

/** 지역 가공 다섯 — 지역마다 하나 */
export const PROCESS_RECIPES: readonly ProcessRecipeDef[] = [
  { id: 'gwamegi', regionIds: ['gyeongbuk_pohang'], stationKo: '구룡포 과메기 덕장', stationEn: 'Guryongpo gwamegi racks', nameKo: '꽁치 과메기 말리기', nameEn: 'Dry saury into gwamegi',
    input: { kind: 'species', speciesId: 'pacific_saury', qty: 5, nameKo: '꽁치', nameEn: 'saury' }, output: { itemId: 'proc_gwamegi', qty: 5 }, feeWon: 4000, waitMin: 240,
    howKo: '꽁치를 반으로 갈라 내장을 빼고 덕장에 건다. 영일만 북서풍에 밤에 얼고 낮에 녹기를 되풀이하면 기름이 돌면서 꾸덕꾸덕 마른다.',
    howEn: 'The saury is split, gutted and hung on the racks. Freezing at night and thawing by day in the Yeongil Bay wind, it dries half-way while the oil rises.' },
  { id: 'myeongi_jangajji', regionIds: ['ulleungdo'], stationKo: '울릉 명이 장아찌 공방', stationEn: 'Ulleung alpine leek pickling', nameKo: '명이 장아찌 담그기', nameEn: 'Pickle alpine leek',
    input: { kind: 'item', itemId: 'crop_myeongi', qty: 3, nameKo: '산마늘 잎', nameEn: 'alpine leek leaves' }, output: { itemId: 'proc_myeongi_jangajji', qty: 1 }, feeWon: 3000, waitMin: 180,
    howKo: '잎을 씻어 물기를 빼고 간장 · 식초 · 설탕을 끓여 식힌 장물을 붓는다. 사흘은 삭혀야 맛이 든다 — 여기서는 세 시간.',
    howEn: 'The washed leaves are drained and covered with a cooled brew of soy, vinegar and sugar. Three days to cure in life — three hours here.' },
  { id: 'squid_sundae', regionIds: ['gangwon_sokcho'], stationKo: '아바이 오징어순대집', stationEn: 'Abai squid sundae kitchen', nameKo: '오징어순대 만들기', nameEn: 'Make squid sundae',
    input: { kind: 'species', speciesId: 'flying_squid', qty: 1, nameKo: '살오징어', nameEn: 'flying squid' }, output: { itemId: 'proc_squid_sundae', qty: 1 }, feeWon: 3000, waitMin: 40,
    howKo: '몸통을 비우고 다리 · 두부 · 숙주 · 당면 · 당근을 다져 속을 채운다. 찜통에 쪄 식힌다.',
    howEn: 'The mantle is emptied and stuffed with chopped tentacles, tofu, bean sprouts, glass noodles and carrot, then steamed and cooled.' },
  { id: 'daegupo', regionIds: ['gyeongnam_geoje'], stationKo: '지세포 대구 덕장', stationEn: 'Jisepo cod racks', nameKo: '대구 말리기', nameEn: 'Dry cod',
    input: { kind: 'species', speciesId: 'pacific_cod', qty: 1, nameKo: '대구', nameEn: 'cod' }, output: { itemId: 'proc_daegupo', qty: 2 }, feeWon: 5000, waitMin: 300,
    howKo: '대구를 등 쪽으로 갈라 펼치고 소금을 쳐 덕장에 건다. 진해만 겨울 바람이 닷새를 말린다 — 여기서는 다섯 시간.',
    howEn: 'The cod is split along the back, salted and hung. The Jinhae Bay winter wind dries it for five days — five hours here.' },
  { id: 'dried_tilefish', regionIds: ['jeju'], stationKo: '서귀포 옥돔 건조장', stationEn: 'Seogwipo tilefish drying', nameKo: '옥돔 반건조', nameEn: 'Half-dry red tilefish',
    input: { kind: 'species', speciesId: 'red_tilefish', qty: 1, nameKo: '옥돔', nameEn: 'red tilefish' }, output: { itemId: 'proc_dried_tilefish', qty: 1 }, feeWon: 3000, waitMin: 120,
    howKo: '옥돔을 등 쪽으로 갈라 소금을 뿌리고 그늘진 바람에 하루 널어 둔다. 비늘은 두고 말려야 살이 안 마른다.',
    howEn: 'The tilefish is split along the back, salted and left a day in shaded wind. Scales stay on so the flesh does not dry out.' },
];

export function processRecipe(id: string): ProcessRecipeDef | undefined {
  return PROCESS_RECIPES.find((r) => r.id === id);
}

/** 이 지역의 가공(가공장 창 목록) */
export function processRecipesOf(regionId: string): ProcessRecipeDef[] {
  return PROCESS_RECIPES.filter((r) => r.regionIds.includes(regionId));
}

export function processedItem(id: string): ProcessedItemDef | undefined {
  return PROCESSED_ITEMS.find((d) => d.id === id);
}

export interface ProcessQuote { inputQty: number; outputQty: number; feeWon: number; waitMin: number }

/** 몇 묶음 맡길 때 드는 것 · 나오는 것 · 공임 · 시간(시간은 묶음 수와 무관) */
export function processQuote(r: ProcessRecipeDef, batches: number): ProcessQuote {
  const n = Math.max(1, Math.floor(batches));
  return { inputQty: r.input.qty * n, outputQty: r.output.qty * n, feeWon: r.feeWon * n, waitMin: r.waitMin };
}
