/**
 * @file CropRawEatDatabase.ts
 * @description 241차 — 수확물을 **익히지 않고 먹을 수 있나**(사용자 지시 「가열/조리하지 않아도 먹을 수 있는 작물을 식별하고
 * 영양 · 수분 · 상태이상을 적용 · 상세보기에 섭취 시 일어날 일을 가볍게」).
 *
 * 규칙
 *  - 수확 단위(`CropHarvest.nameKo`의 양) 하나를 **그대로 먹었을 때**의 실질량 · 열량 · 수분을 적는다(식품성분표 통상치).
 *    허기 · 수분 회복은 `FoodNutrition`과 같은 식(kcal ÷ 2,400 · ml ÷ 2,000)으로 파생한다 — 손으로 적은 회복치는 없다.
 *  - **한 번에 먹기엔 큰 단위**(수박 1통 · 무 1개 · 배추 1통 · 1kg 덩이 · 500g 땅콩)는 `pieces`로 나눈다 —
 *    가방의 「나누기」(224차 포장 뜯기와 같은 `unpack`)로 조각 아이템(`<id>_pc`)이 되고, 영양은 **조각 하나** 기준이다.
 *  - 매운 것(청양고추 · 홍고추 · 생마늘 · 생강 · 고추냉이)은 **유효 수분을 깎는다**(`mlNet` — 물을 찾게 된다). 그 밖의 상태이상은 없다.
 *  - **날로 못 먹는 것**(`CROP_NO_RAW`)은 가방에 「사용하기」가 아예 없다 — 날생선 · 부산물과 같은 규칙(InventoryPanel).
 *    독이 있거나(감자 싹 · 토란 · 생콩 · 두릅 · 머위) · 소화가 안 되거나(옥수수 · 보리) · 생식 관행이 없는 것(버섯 · 나물류 · 양념)이다.
 *  - 수확물 기본 id마다 **반드시 둘 중 하나**에 있다(`CropRawEat.test` — 빠진 작물이 생기면 시험이 막는다).
 */

import type { FoodNutrition } from './FoodNutrition.js';
import { FOOD_NUTRITION } from './FoodNutrition.js';
import { CROP_DATABASE, parseProduceId, PRODUCE_GRADE_SUFFIX } from './CropDatabase.js';

/** 날로 먹을 수 있는 수확물 — 영양은 단위 하나(조각이 있으면 조각 하나) */
export interface RawEatDef extends FoodNutrition {
  /** 먹으면 어떤가 — 맛 · 식감 · 주의 한 줄(상세 보기 · 위키) */
  noteKo: string;
  noteEn: string;
  /** 큰 단위를 나눠 먹는다 — 「나누기」로 조각 `count`개(조각 이름은 단위 포함) */
  pieces?: { count: number; labelKo: string; labelEn: string };
}

/** 날로 못 먹는 수확물 — 이유 한 줄 */
export interface NoRawDef {
  whyKo: string;
  whyEn: string;
}

/** 조각 아이템 id 꼬리 */
export const PIECE_SUFFIX = '_pc';
export function pieceItemId(baseId: string): string {
  return `${baseId}${PIECE_SUFFIX}`;
}

const pc = (count: number, labelKo: string, labelEn: string): RawEatDef['pieces'] => ({ count, labelKo, labelEn });

export const CROP_RAW_EAT: Readonly<Record<string, RawEatDef>> = {
  // ── 시루 · 새싹 ──
  crop_mung_sprout: { g: 100, kcal: 15, ml: 92, noteKo: '아삭하고 살짝 풋내 — 월남쌈처럼 날로도 먹는다', noteEn: 'Crisp with a faint green taste — eaten raw in spring rolls' },
  crop_microgreens: { g: 50, kcal: 12, ml: 46, noteKo: '알싸한 무순 맛 — 그대로 샐러드', noteEn: 'Peppery radish-shoot taste — straight into a salad' },
  // ── 잎채소 ──
  crop_lettuce: { g: 100, kcal: 15, ml: 95, noteKo: '쌈 그대로 — 배는 안 부르고 물기만 찬다', noteEn: 'Wrap leaves as they are — hardly filling, mostly water' },
  crop_perilla: { g: 40, kcal: 16, ml: 34, noteKo: '향이 강한 쌈 잎', noteEn: 'Strongly scented wrap leaves' },
  crop_spinach: { g: 200, kcal: 46, ml: 182, noteKo: '날로 먹으면 떫다(옥살산) — 데쳐 먹는 게 보통', noteEn: 'Astringent raw (oxalic acid) — usually blanched' },
  crop_crown_daisy: { g: 100, kcal: 20, ml: 93, noteKo: '쑥 향이 진하다 — 생으로 무쳐도 먹는다', noteEn: 'Strong herbal scent — also eaten raw, dressed' },
  crop_young_radish: { g: 250, kcal: 40, ml: 232, noteKo: '아삭하고 알싸하다 — 겉절이 감', noteEn: 'Crisp and peppery — the stuff of fresh kimchi', pieces: pc(4, '열무 한 줌 (250g)', 'Young radish greens, a handful (250g)') },
  crop_ugeolgari: { g: 250, kcal: 36, ml: 234, noteKo: '연하고 달다 — 겉절이 감', noteEn: 'Tender and sweet — fresh-kimchi material', pieces: pc(4, '얼갈이 한 줌 (250g)', 'Spring cabbage, a handful (250g)') },
  crop_chive: { g: 250, kcal: 60, ml: 225, noteKo: '매콤하고 질기다 — 생으로는 조금씩', noteEn: 'Pungent and a little tough — only a bit raw' },
  crop_scallion: { g: 500, kcal: 130, ml: 450, noteKo: '맵다 — 한 단을 날로 먹으면 속이 쓰리다', noteEn: 'Sharp — a whole bunch raw burns the stomach' },
  crop_water_parsley: { g: 100, kcal: 15, ml: 94, noteKo: '향긋하고 아삭하다 — 생채', noteEn: 'Fragrant and crisp — eaten raw' },
  crop_chard: { g: 300, kcal: 57, ml: 278, noteKo: '어린 잎은 샐러드, 큰 잎은 질겨서 데친다', noteEn: 'Young leaves go in salad; big ones are tough and get blanched' },
  crop_godeulppaegi: { g: 300, kcal: 60, ml: 270, noteKo: '몹시 쓰다 — 우려서 김치를 담그는 나물', noteEn: 'Very bitter — normally soaked and made into kimchi' },
  crop_bangpung: { g: 200, kcal: 40, ml: 184, noteKo: '향이 좋은 쌈 · 생채', noteEn: 'Aromatic — wraps or dressed raw' },
  // ── 산나물 ──
  crop_gomchwi: { g: 100, kcal: 24, ml: 92, noteKo: '향 짙은 쌈 잎 — 고기 없이 먹으면 쓰다', noteEn: 'Deeply scented wrap leaf — bitter without something to wrap' },
  crop_myeongi: { g: 100, kcal: 30, ml: 90, noteKo: '마늘 향 쌈 잎 — 생으로 먹으면 입에 향이 남는다', noteEn: 'Garlic-scented wrap leaf — the taste lingers' },
  crop_eosuri: { g: 100, kcal: 28, ml: 90, noteKo: '향이 좋은 쌈 잎', noteEn: 'Aromatic wrap leaf' },
  crop_wasabi_root: { g: 80, kcal: 72, ml: 55, mlNet: -20, noteKo: '갈아서 조금씩 — 통째로 베어 물면 코가 뚫리고 물을 찾는다', noteEn: 'Grate a little at a time — bite it whole and your sinuses clear and you reach for water' },
  crop_wasabi_leaf: { g: 100, kcal: 25, ml: 90, noteKo: '알싸한 쌈 잎', noteEn: 'Peppery wrap leaf' },
  // ── 열매 ──
  crop_chili_green: { g: 10, kcal: 3, ml: 9, noteKo: '아삭하고 약간 맵다 — 된장에 찍어 먹는 그것', noteEn: 'Crisp and mildly hot — the one you dip in soybean paste' },
  crop_chili_red: { g: 10, kcal: 4, ml: 8, mlNet: -20, noteKo: '맵다 — 물을 찾게 된다', noteEn: 'Hot — you will want water' },
  crop_cherry_tomato: { g: 250, kcal: 45, ml: 235, noteKo: '달고 신선하다 — 한 팩이 간식', noteEn: 'Sweet and fresh — a pack makes a snack' },
  crop_cucumber: { g: 200, kcal: 30, ml: 192, noteKo: '시원하고 수분이 많다', noteEn: 'Cool and watery' },
  crop_zucchini: { g: 300, kcal: 51, ml: 282, noteKo: '맹맹하다 — 볶거나 전으로 먹는 게 보통', noteEn: 'Bland raw — usually fried or made into pancakes' },
  crop_bitter_melon: { g: 250, kcal: 42, ml: 235, noteKo: '몹시 쓰다 — 속을 긁는다', noteEn: 'Very bitter — rough on the stomach' },
  crop_okra: { g: 100, kcal: 33, ml: 90, noteKo: '끈적하고 아삭하다', noteEn: 'Sticky and crisp' },
  // ── 뿌리 · 덩이 · 비늘줄기 ──
  crop_sweet_potato: { g: 200, kcal: 260, ml: 140, noteKo: '생고구마는 달고 아삭하다 — 배가 든든하다', noteEn: 'Raw sweet potato is sweet and crisp — filling', pieces: pc(5, '고구마 1개 (200g)', 'Sweet potato (one, 200g)') },
  crop_radish: { g: 300, kcal: 54, ml: 285, noteKo: '아삭하고 시원하다 — 윗동이 달다', noteEn: 'Crisp and cooling — the top end is sweet', pieces: pc(4, '무 한 토막 (300g)', 'Radish, a chunk (300g)') },
  crop_thinned_radish: { g: 300, kcal: 50, ml: 280, noteKo: '어린 무와 잎 — 아삭하고 알싸하다', noteEn: 'Baby radish with its greens — crisp and peppery' },
  crop_napa_cabbage: { g: 400, kcal: 52, ml: 380, noteKo: '고소하고 달다 — 쌈', noteEn: 'Nutty and sweet — wraps', pieces: pc(6, '배추 속잎 한 줌 (400g)', 'Napa cabbage heart leaves, a handful (400g)') },
  crop_thinned_cabbage: { g: 300, kcal: 40, ml: 285, noteKo: '연하고 달다 — 겉절이 감', noteEn: 'Tender and sweet — fresh-kimchi material' },
  crop_carrot: { g: 200, kcal: 70, ml: 176, noteKo: '달고 단단하다 — 오래 씹는다', noteEn: 'Sweet and firm — a long chew' },
  crop_garlic: { g: 50, kcal: 70, ml: 30, mlNet: -30, noteKo: '생마늘 한 통 — 맵고 속이 쓰리다', noteEn: 'A whole raw bulb — hot and hard on the stomach' },
  crop_garlic_scape: { g: 300, kcal: 100, ml: 250, noteKo: '아삭하고 매콤하다', noteEn: 'Crisp and mildly pungent' },
  crop_onion: { g: 250, kcal: 95, ml: 220, noteKo: '맵다 — 눈물이 난다', noteEn: 'Sharp — it brings tears' },
  crop_leek: { g: 100, kcal: 35, ml: 88, noteKo: '맵다 — 흰 밑동은 달다', noteEn: 'Sharp — the white base is sweet' },
  crop_yacon: { g: 250, kcal: 110, ml: 215, noteKo: '배처럼 달고 아삭하다 — 수분이 많다', noteEn: 'Sweet and crisp like a pear — very juicy', pieces: pc(4, '야콘 1개 (250g)', 'Yacon (one, 250g)') },
  crop_choseokjam: { g: 500, kcal: 200, ml: 380, noteKo: '아삭하고 담백하다 — 보통은 장아찌', noteEn: 'Crisp and plain — usually pickled' },
  crop_jerusalem: { g: 200, kcal: 146, ml: 156, noteKo: '아삭하고 달다 — 많이 먹으면 배에 가스가 찬다', noteEn: 'Crisp and sweet — too much and you get gassy', pieces: pc(5, '돼지감자 1개 (200g)', 'Jerusalem artichoke (one, 200g)') },
  crop_ginger: { g: 50, kcal: 40, ml: 40, mlNet: -20, noteKo: '맵고 알싸하다 — 몸이 더워진다', noteEn: 'Hot and pungent — warms you up', pieces: pc(10, '생강 한 쪽 (50g)', 'Ginger, a knob (50g)') },
  // ── 향채 · 잎 ──
  crop_danggui: { g: 100, kcal: 30, ml: 88, noteKo: '한약 향 쌈 잎', noteEn: 'Herbal-medicine scented wrap leaf' },
  crop_kangkong: { g: 300, kcal: 57, ml: 276, noteKo: '줄기가 아삭하다 — 볶는 게 보통', noteEn: 'Crisp hollow stems — usually stir-fried' },
  crop_arugula: { g: 100, kcal: 25, ml: 91, noteKo: '쌉싸래하고 고소하다 — 샐러드', noteEn: 'Bitter and nutty — salad' },
  crop_myoga: { g: 100, kcal: 12, ml: 94, noteKo: '알싸한 향 — 채 썰어 얹는다', noteEn: 'Sharp aroma — shredded as a garnish' },
  crop_turnip: { g: 500, kcal: 140, ml: 460, noteKo: '겨자 향 — 생채 · 김치', noteEn: 'Mustardy — dressed raw or as kimchi' },
  crop_banga: { g: 50, kcal: 15, ml: 44, noteKo: '향이 아주 세다 — 몇 장이면 충분', noteEn: 'Very strong aroma — a few leaves is plenty' },
  crop_shiso: { g: 20, kcal: 7, ml: 17, noteKo: '향긋한 자주색 잎', noteEn: 'Fragrant purple leaves' },
  crop_dill: { g: 30, kcal: 13, ml: 26, noteKo: '향이 세다 — 생선 위에 조금', noteEn: 'Strong herb — a little over fish' },
  crop_fennel: { g: 250, kcal: 78, ml: 225, noteKo: '감초 향에 아삭하다 — 얇게 썰어 샐러드', noteEn: 'Aniseed-scented and crisp — sliced thin into salad' },
  crop_basil: { g: 30, kcal: 7, ml: 27, noteKo: '향긋하다 — 토마토와', noteEn: 'Fragrant — with tomato' },
  crop_peanut: { g: 100, kcal: 567, ml: 6, noteKo: '풋내 나는 생땅콩 — 고소하고 배가 든든하다', noteEn: 'Raw peanuts with a green taste — rich and filling', pieces: pc(5, '생땅콩 한 줌 (100g)', 'Raw peanuts, a handful (100g)') },
  // ── 241차 새 작물 · 개량종 ──
  crop_korean_melon: { g: 400, kcal: 84, ml: 365, noteKo: '달고 아삭하다 — 껍질째 먹어도 된다', noteEn: 'Sweet and crunchy — the skin is edible too' },
  crop_watermelon: { g: 800, kcal: 240, ml: 730, noteKo: '한 쪽이면 갈증이 가신다', noteEn: 'One slice and the thirst is gone', pieces: pc(8, '수박 한 쪽 (800g)', 'Watermelon, a slice (800g)') },
  crop_blueberry: { g: 100, kcal: 57, ml: 84, noteKo: '새콤달콤 — 한 팩이 간식', noteEn: 'Sweet-tart — a pack makes a snack' },
  crop_tomato: { g: 200, kcal: 36, ml: 188, noteKo: '소금 조금 뿌려 그대로', noteEn: 'A pinch of salt and eat as is', pieces: pc(5, '토마토 1개 (200g)', 'Tomato (one, 200g)') },
  crop_strawberry: { g: 500, kcal: 160, ml: 455, noteKo: '달고 물기가 많다 — 한 팩을 앉은 자리에서', noteEn: 'Sweet and juicy — a pack goes in one sitting' },
  crop_stevia_tomato: { g: 200, kcal: 40, ml: 186, noteKo: '설탕을 뿌린 듯 달다', noteEn: 'Sweet as if sugared', pieces: pc(5, '스테비아 토마토 1개 (200g)', 'Stevia tomato (one, 200g)') },
  crop_pumpkin_sweet_potato: { g: 200, kcal: 240, ml: 145, noteKo: '속이 노랗고 촉촉하다 — 생으로도 달다', noteEn: 'Yellow, moist flesh — sweet even raw', pieces: pc(5, '호박고구마 1개 (200g)', 'Pumpkin sweet potato (one, 200g)') },
  crop_cheongyang: { g: 10, kcal: 3, ml: 8, mlNet: -40, noteKo: '몹시 맵다 — 물을 찾게 된다', noteEn: 'Very hot — you will reach for water' },
};

export const CROP_NO_RAW: Readonly<Record<string, NoRawDef>> = {
  crop_bean_sprout: { whyKo: '생콩나물은 비리고 배탈이 난다 — 데치거나 끓인다', whyEn: 'Raw bean sprouts are beany and upset the stomach — blanch or boil' },
  crop_oyster_mushroom: { whyKo: '생버섯은 소화가 안 되고 배탈이 난다 — 익힌다', whyEn: 'Raw mushrooms are indigestible and upset the stomach — cook them' },
  crop_mallow: { whyKo: '거칠고 점액이 많다 — 된장국에 넣는다', whyEn: 'Coarse and slimy raw — goes in soybean-paste soup' },
  crop_samnamul: { whyKo: '생것은 떫고 독성이 있다 — 데쳐서 먹는다', whyEn: 'Astringent and mildly toxic raw — blanch it' },
  crop_bujigaengi: { whyKo: '쓰고 거칠다 — 데쳐서 무친다', whyEn: 'Bitter and coarse — blanch and dress' },
  crop_dureup: { whyKo: '생두릅은 독성(아랄린)이 있어 배탈이 난다 — 데친다', whyEn: 'Raw aralia shoots carry a toxin (aralin) that upsets the stomach — blanch' },
  crop_pepper_leaf: { whyKo: '쓰고 질기다 — 데쳐서 나물', whyEn: 'Bitter and tough — blanched as greens' },
  crop_pumpkin_leaf: { whyKo: '잔털이 거칠다 — 쪄서 쌈', whyEn: 'Coarse hairs — steam for wraps' },
  crop_eggplant: { whyKo: '날가지는 떫고 솔라닌이 있어 배탈이 난다 — 익힌다', whyEn: 'Raw eggplant is astringent and its solanine upsets the stomach — cook it' },
  crop_corn: { whyKo: '생옥수수는 소화가 안 된다 — 찐다', whyEn: 'Raw corn is indigestible — steam it' },
  crop_potato: { whyKo: '생감자는 솔라닌과 전분 때문에 배탈이 난다 — 삶거나 굽는다', whyEn: 'Raw potato upsets the stomach (solanine, raw starch) — boil or roast' },
  crop_sweetpotato_stem: { whyKo: '껍질을 벗겨 삶아야 한다', whyEn: 'Must be peeled and boiled' },
  crop_taro: { whyKo: '생토란은 입과 목이 아리고 독성이 있다 — 반드시 익힌다', whyEn: 'Raw taro stings the mouth and throat and is toxic — always cook' },
  crop_barley: { whyKo: '낟알 — 삶아야 먹는다', whyEn: 'Grain — must be boiled' },
  crop_soybean: { whyKo: '생콩은 소화를 막는 성분이 있어 배탈이 난다 — 삶는다', whyEn: 'Raw soybeans block digestion and upset the stomach — boil them' },
  crop_gondre: { whyKo: '데쳐서 나물 · 밥에 넣는다', whyEn: 'Blanched as greens or cooked with rice' },
  crop_gourd: { whyKo: '생박은 쓰고 설사를 부른다 — 익힌다', whyEn: 'Raw gourd is bitter and brings on diarrhoea — cook it' },
  crop_chopi: { whyKo: '양념이다 — 그대로 먹으면 입이 얼얼하다', whyEn: 'A spice — eaten as is it numbs the mouth' },
  crop_lions_mane: { whyKo: '생버섯은 배탈이 난다 — 익힌다', whyEn: 'Raw mushrooms upset the stomach — cook them' },
  crop_wood_ear: { whyKo: '생목이는 햇빛 알레르기를 부른다 — 반드시 익힌다', whyEn: 'Raw wood ear can trigger sun-sensitivity reactions — always cook' },
  crop_cowpea: { whyKo: '생콩 꼬투리 — 삶는다', whyEn: 'Raw bean pods — boil them' },
  crop_amaranth: { whyKo: '거칠고 옥살산이 많다 — 데쳐서 무친다', whyEn: 'Coarse and high in oxalic acid — blanch and dress' },
  crop_eomnamu: { whyKo: '쓰고 가시가 있다 — 데친다', whyEn: 'Bitter and thorny — blanch' },
  crop_meowi: { whyKo: '쓰고 독성이 있다 — 데쳐서 우린다', whyEn: 'Bitter and toxic raw — blanch and soak' },
  crop_turmeric: { whyKo: '향신료다 — 쓰고 흙내가 난다', whyEn: 'A spice — bitter and earthy raw' },
};

/** 날로 먹기 판정 — 먹을 수 있다 · 나눠야 한다 · 못 먹는다 · 수확물이 아니다(null) */
export type RawEatStatus =
  | { kind: 'eat'; def: RawEatDef; baseId: string }
  | { kind: 'split'; def: RawEatDef; baseId: string }
  | { kind: 'no'; why: NoRawDef; baseId: string };

/** 가방 아이템 id(등급 꼬리 · 조각 꼬리 포함) → 날로 먹기 상태 */
export function rawEatStatus(itemId: string): RawEatStatus | null {
  const isPiece = itemId.endsWith(PIECE_SUFFIX);
  const baseId = isPiece ? itemId.slice(0, -PIECE_SUFFIX.length) : parseProduceId(itemId).baseId;
  const def = CROP_RAW_EAT[baseId];
  if (def) {
    if (def.pieces && !isPiece) return { kind: 'split', def, baseId };
    return { kind: 'eat', def, baseId };
  }
  const why = CROP_NO_RAW[baseId];
  return why ? { kind: 'no', why, baseId } : null;
}

/** 조각 아이템 id인가 */
export function isPieceItemId(itemId: string): boolean {
  return itemId.endsWith(PIECE_SUFFIX) && !!CROP_RAW_EAT[itemId.slice(0, -PIECE_SUFFIX.length)]?.pieces;
}

/**
 * 날로 먹을 수 있는 **가방 아이템 id 전부**(등급 꼬리 3 × 단위 아이템 + 조각) — 클라이언트 효과 표 · 영양표가 이 목록으로 채운다.
 * 조각이 있는 단위 아이템은 직접 먹지 못하므로 들어가지 않는다.
 */
export const RAW_EAT_ITEM_IDS: readonly string[] = (() => {
  const out: string[] = [];
  for (const [base, def] of Object.entries(CROP_RAW_EAT)) {
    if (def.pieces) { out.push(pieceItemId(base)); continue; }
    for (const sfx of Object.values(PRODUCE_GRADE_SUFFIX)) out.push(`${base}${sfx}`);
  }
  return out;
})();

// 영양표에 등록 — `foodNutritionOf` · 상세 「영양」 줄 · 허기/수분 파생이 한 표를 본다
for (const id of RAW_EAT_ITEM_IDS) {
  const st = rawEatStatus(id);
  if (st?.kind === 'eat' && !FOOD_NUTRITION[id]) {
    const { g, kcal, ml, mlNet } = st.def;
    FOOD_NUTRITION[id] = mlNet !== undefined ? { g, kcal, ml, mlNet } : { g, kcal, ml };
  }
}

/** 수확물 기본 id 전부(본 · 붉어진 것 · 중간) — 시험 · 위키가 빠진 것을 찾는다 */
export function allProduceBaseIds(): string[] {
  const ids: string[] = [];
  for (const c of CROP_DATABASE) {
    ids.push(c.harvest.itemId);
    if (c.harvest.ripenTo) ids.push(c.harvest.ripenTo.itemId);
    if (c.interim) ids.push(c.interim.itemId);
  }
  return [...new Set(ids)];
}

/** 상세 보기 「날로 먹기」 줄 — 「허기 +11 · 수분 +7 — 아삭하다」 (조각이면 조각 하나 기준) */
export function rawEatLineKo(def: RawEatDef): string {
  const hunger = Math.round((def.kcal / 2400) * 100);
  const water = Math.round(((def.mlNet ?? def.ml) / 2000) * 100);
  const w = water < 0 ? `수분 −${Math.abs(water)}` : `수분 +${water}`;
  return `허기 +${hunger} · ${w} — ${def.noteKo}`;
}
