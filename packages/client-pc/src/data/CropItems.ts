/**
 * @file CropItems.ts
 * @description 235차 — 텃밭 아이템 템플릿(씨앗 · 모종 · 종구 · 수확물 3등급 · 농자재)과 가게 진열. 정본은 core 작물 DB.
 *
 * - 수확물은 **등급마다 다른 id**(`crop_lettuce` = 상 · `_sp` = 특 · `_nm` = 보통) — 가방에서 따로 쌓인다
 *   (한 칸에 섞이면 값이 뭉개진다). 이름 꼬리(「· 특」)가 등급을 말한다.
 * - 값은 팔 때 다시 센다(`producePrice` — 달 지수 · 주간 출렁임 · 등급 · 숨은 재조정). `basePrice`는 기준값이다.
 * - 아이콘 = `px:<기본 id>`(작물 갈래 원형 + 작물 팔레트 — `tools/gen_pixel_icons.py`).
 * - 가게: 생활용품점 = 씨앗 · 호미 · 퇴비 · 설비 / 종묘사(238차) = 씨앗 · 모종 · 종구 · 배지(심는 철에만 진열) · 육묘 트레이 · 지주대 ·
 *   유인끈 · 멀칭 비닐 · 비료 · 농약(`FarmSupplyDef.shop === 'nursery'`). 식자재마트는 모종을 팔지 않는다.
 *   희귀할수록 하루 재고가 적다(`stockMult`) · 배워야 쓰는 자격 물건은 배운 뒤에 진열된다(`requiresSkill`).
 * - 237차 — 작물 난이도 단계(`cropGate`)가 레벨 · 자격을 요구하면 갖춘 뒤에 진열된다(`minLevel` · `requiresLicense`).
 *   씨앗으로 키우면 육묘가 긴 작물은 한 단계 위라, 같은 작물이라도 모종이 먼저 나온다.
 */

import {
  CROP_DATABASE, FARM_SUPPLIES, FARM_TUNING, GRADE_KO, cropOfProduce, parseProduceId, produceItemId, cropGate, getCrop,
  CROP_RAW_EAT, pieceItemId, producePriceBase, roundWon, looseOfPack, legacyPackItemId,
  looseOfBag, byproductOf, FARM_RESIDUES, legacyUnitGrams,
  type CropDef, type CropGrade, type CropRarity, type CropStart, type FarmResidueDef,
} from '@tra/core';
import type { InvItemTemplate } from '../store/InventoryStore.js';
import type { FurnKind } from './HomeFurniture.js';
import { itemVitalsOf } from './ItemVitals.js';

/** 수확물 소분류 — 가게 매입(`shopBuysItem`)과 요리 출처가 이 이름으로 알아본다 */
export const PRODUCE_SUB = '농산물';
/** 씨앗 · 모종 · 종구 */
export const SEED_SUB = '씨앗 · 모종';
/** 호미 · 퇴비 · 설비 */
export const FARM_SUB = '농사 도구';
/** 241차 — 큰 수확물을 「나누기」한 조각(수박 한 쪽 · 무 한 토막 …) — 먹기용 · 등급 없음 · 가게는 안 산다 */
export const PIECE_SUB = '농산물 조각';
/** 284차 — 밭 부산물(깻대 · 콩대 · 보릿짚 · 옥수숫대 · 검불 · 폐배지 · 깻묵) — g으로 센다 · 밭에 넣는다 · 가게는 안 산다 */
export const RESIDUE_SUB = '밭 부산물';

/** 248차 — 텃밭에서 주운 땅지렁이(생미끼 — 바다낚시에서도 쓴다 · 어종 선호는 core `baitPrefOf` · 바닷물에서 늘어짐 `earthwormSeaFade`) */
export const EARTHWORM_ID = 'inv_earthworm';
export const EARTHWORM_TEMPLATE: InvItemTemplate = {
  id: EARTHWORM_ID, name: '땅지렁이', icon: '', iconTexture: 'item_earthworm', category: 'tackle', subCategory: '생미끼',
  basePrice: 100, condition: 'live', equippable: false,
};
/** 위키 · 상세 창 한 줄 설명 */
export const EARTHWORM_DESC = '텃밭 흙에서 주운 땅지렁이. 바닷물에 넣으면 몇 분 만에 늘어져 갯지렁이만은 못하지만 망둥어 · 숭어 · 가자미류는 곧잘 문다. 오래 담가 두었으면 새로 끼운다.';

const GRADES: CropGrade[] = ['special', 'good', 'normal'];

/** 희귀도 → 하루 재고 배율(가게 규모 × 이 값) */
export const RARITY_STOCK: Record<CropRarity, number> = { common: 1, uncommon: 0.35, rare: 0.12, very_rare: 0.05 };

/** 1 qty가 요리 재료 몇 단위인가(마트 식자재 단위와 맞춘다 — 무 1개 = 국물용 토막 12개 · 통마늘 1통 = 다진마늘 4큰술) */
const COOK_UNITS: Record<string, number> = {
  crop_radish: 12, crop_onion: 3, crop_bean_sprout: 1.5, crop_carrot: 5, crop_garlic: 4, crop_ginger: 80,
};

/** 밑밥(낟알)으로 갤 수 있는 수확물 — 압맥 · 옥수수 · 284차 보리는 g(밑밥 칸에는 한 번에 한 줌 = `CHUM_GRAIN_PORTION_G`) */
const CHUM_GRAIN = new Set(['crop_barley', 'crop_corn']);
/** 284차 — g으로 세는 낟알을 밑밥에 넣을 때 한 번에 쓰는 양(옥수수 1개와 비슷한 낟알 양) */
export const CHUM_GRAIN_PORTION_G = 200;

// ─────────────────────────────────────────────
// 씨앗 · 모종 · 종구
// ─────────────────────────────────────────────

/** 심는 물건 이름(데이터에 단위 이름이 없으면 「○○ 씨앗 (1칸 분)」 · 「○○ 모종」 · 「○○ 종구 (1칸 분)」) */
export function startItemName(crop: CropDef, st: CropStart): string {
  if (st.labelKo) return st.labelKo;
  if (st.kind === 'seed') return `${crop.nameKo} 씨앗 (1칸 분)`;
  if (st.kind === 'seedling') return `${crop.nameKo} 모종 (1포기)`;
  return `${crop.nameKo} 종구 (1칸 분)`;
}

/** 심는 물건 영어 이름(i18n 사전 등록용 — 데이터에 단위 이름이 있으면 그것) */
export function startItemNameEn(crop: CropDef, st: CropStart): string {
  if (st.labelEn) return st.labelEn;
  if (st.kind === 'seed') return `${crop.nameEn} seeds (1 cell)`;
  if (st.kind === 'seedling') return `${crop.nameEn} seedling (1 plant)`;
  return `${crop.nameEn} sets (1 cell)`;
}

/** 가게 설명 — 메모 한 줄 + 모종 포기 수(줄을 나눠야 사전이 줄마다 번역한다) */
function startDesc(crop: CropDef, st: CropStart): string {
  const per = st.kind === 'seedling' && st.perCell > 1 ? `\n한 칸에 ${st.perCell}포기를 심는다.` : '';
  return `${crop.noteKo}${per}`;
}

/** 심는 물건 템플릿(수확물이 씨앗이 되는 경우 — 직접 기른 콩 — 는 빼고) */
function startTemplate(crop: CropDef, st: CropStart): InvItemTemplate {
  return {
    id: st.itemId, name: startItemName(crop, st), icon: '', iconTexture: `px:${st.itemId}`,
    category: 'consumable', subCategory: SEED_SUB, basePrice: st.cost, equippable: false,
  };
}

// ─────────────────────────────────────────────
// 수확물(등급 3)
// ─────────────────────────────────────────────

/** 수확물 단위 이름(등급 꼬리 없이) */
export function produceBaseName(baseId: string): string {
  const crop = cropOfProduce(baseId);
  if (!crop) return baseId;
  if (baseId === crop.harvest.itemId) return crop.harvest.nameKo;
  if (baseId === crop.harvest.pack?.itemId) return crop.harvest.pack.nameKo;   // 243차 — 포장한 팩
  // 284차 — 낱알 봉지 · 먹는 부산물(무청 · 배추 겉잎 · 토란대 · 깻순)
  const bag = crop.harvest.bags?.find((b) => b.itemId === baseId);
  if (bag) return bag.nameKo;
  const bp = crop.byproducts?.find((b) => b.itemId === baseId);
  if (bp) return bp.nameKo;
  if (baseId === crop.harvest.ripenTo?.itemId) return crop.harvest.ripenTo.nameKo;
  return crop.interim?.labelKo ?? crop.nameKo;
}

/** 243차 — 낱개 단위 말(이름의 「(1개)」 · 「(1알)」 · 「(1송이 …)」 · 「한 줌」에서 읽는다) */
function looseCounter(name: string): string {
  const m = /\((\d+)\s*(개|알|송이)/.exec(name);
  return m ? m[2] : /한 줌/.test(name) ? '줌' : '개';
}
/** 243차 — 낱개 이름에서 단위를 뗀 것(「딸기 (1개)」 → 딸기 · 「새싹채소 한 줌 (25g)」 → 새싹채소) */
export function looseShortName(name: string): string {
  return name.replace(/\s*\(.*\)\s*$/, '').replace(/\s*한 (줌|팩|단|묶음)$/, '').trim();
}
/** 243차 — 낱개 n개를 사람 말로(「딸기 25개」 · 「블루베리 50알」 · 「느타리 2송이」 · 「새싹채소 2줌」) */
export function looseCountKo(baseId: string, n: number): string {
  const name = produceBaseName(parseProduceId(baseId).baseId);
  return `${looseShortName(name)} ${n}${looseCounter(name)}`;
}
/** 243차 — 영어 사전용: 포장 단위가 있는 낱개의 짧은 이름 쌍(「딸기」 ↔ 「Strawberry」) */
export function looseShortNamePairs(): [string, string][] {
  return CROP_DATABASE.filter((c) => c.harvest.pack).map((c) => [looseShortName(c.harvest.nameKo),
    c.harvest.nameEn.replace(/\s*\(.*\)\s*$/, '').replace(/,\s*a (handful|pack)$/, '').trim()]);
}

/** 등급 1의 기준 값(원) — 달 지수 · 출렁임 없이(카탈로그용). 실제 판매가는 `producePrice` · 243차 팩 · 낱개 8할은 core 식 그대로 */
function produceBaseValue(crop: CropDef, baseId: string, grade: CropGrade): number {
  return roundWon(producePriceBase(crop, baseId) * FARM_TUNING.gradePrice[grade] * (crop.rebalance ?? 1));
}

function produceCookIngredient(crop: CropDef, baseId: string): string | undefined {
  if (looseOfPack(baseId)) return undefined;   // 280차 — 팩은 요리 재료가 아니다(뜯어서 낱개로) — 아래 중간 수확물 재료로 새지 않게
  if (looseOfBag(baseId)) return undefined;    // 284차 — 봉지도 뜯어야 한다
  const bp = crop.byproducts?.find((b) => b.itemId === baseId);
  if (bp) return bp.cookIngredient;
  if (baseId === crop.harvest.itemId) return crop.cookIngredient;
  if (baseId === crop.harvest.ripenTo?.itemId) return crop.harvest.ripenTo.cookIngredient;
  return crop.interim?.cookIngredient;
}

/** 수확물 템플릿 — 등급 꼬리 id도 받는다 */
export function produceTemplate(itemId: string): InvItemTemplate | null {
  const crop = cropOfProduce(itemId);
  if (!crop) return null;
  const { baseId, grade } = parseProduceId(itemId);
  const base = cropOfProduce(baseId) ? baseId : itemId;
  const g: CropGrade = base === itemId ? 'good' : grade;
  const cook = produceCookIngredient(crop, base);
  return {
    id: produceItemId(base, g), name: `${produceBaseName(base)} · ${GRADE_KO[g]}`, icon: '', iconTexture: `px:${base}`,
    category: 'food', subCategory: PRODUCE_SUB, basePrice: produceBaseValue(crop, base, g), condition: 'fresh', equippable: false,
    // 241차 — 날로 먹는 수확물은 거둘 때부터 허기 · 수분이 붙는다(세이브 백필을 기다리지 않는다 — `ITEM_VITALS`가 표)
    ...(itemVitalsOf(produceItemId(base, g)) ?? {}),
    ...(cook ? { cookIngredient: cook, ...(COOK_UNITS[base] ? { cookUnitsPerQty: COOK_UNITS[base] } : {}) } : {}),
    ...(CHUM_GRAIN.has(base) ? { chumKind: 'grain' as const } : {}),
    // 284차 — 털어 낸 낱알(깨 · 콩 · 보리)은 가방 수량이 g이다 — 팔려면 봉지에 담는다
    ...(base === crop.harvest.itemId && crop.harvest.unitG ? { unitG: crop.harvest.unitG } : {}),
    // 241차 — 한 번에 먹기엔 큰 단위는 「나누기」(224차 포장 뜯기와 같은 unpack)로 조각을 낸다
    ...(CROP_RAW_EAT[base]?.pieces ? { unpack: { id: pieceItemId(base), qty: CROP_RAW_EAT[base].pieces.count } } : {}),
    // 243차 — 포장한 팩은 「포장 뜯기」로 같은 등급 낱개가 된다(용기는 버린다) · 284차 봉지도 같다(낱알 g)
    ...packUnpackOf(produceItemId(base, g)),
  };
}

/** 243차 — 팩 → 뜯으면 나오는 낱개(같은 등급) · 284차 봉지 → 낱알 g */
function packUnpackOf(itemId: string): Pick<InvItemTemplate, 'unpack'> {
  const lp = looseOfPack(itemId);
  if (lp) return { unpack: { id: lp.looseItemId, qty: lp.units } };
  const lb = looseOfBag(itemId);
  return lb ? { unpack: { id: lb.looseItemId, qty: lb.grams } } : {};
}

/**
 * 243차 — 구세이브 이전: 242차까지 「한 팩」 단위로 거둔 수확물(`crop_strawberry` 「딸기 한 팩 (500g) · 상」)을 팩 id로 옮긴다.
 * 수량 · 신선도 · 칸은 그대로 두고 id · 그림 · 기준값 · 뜯기만 팩 것으로 바꾼다. 해당이 없으면 그대로 돌려준다.
 */
export function migrateLegacyPackItem<T extends {
  id: string; name?: string; qty?: number; iconTexture?: string; basePrice?: number; unpack?: { id: string; qty: number }; unitG?: number;
}>(i: T): T {
  // 284차 — 283차까지 「들깨 (100g)」 · 「참깨 (50g)」 · 「콩 (백태) 200g」 · 「보리 낟알 500g」 한 단위로 센 낱알은 g으로 바꾼다
  //  (수량 × 옛 단위 g · 신선도 · 칸은 그대로 · 이름 · 기준값은 새 g 단위 것). 이름이 이미 새것이면 건드리지 않는다
  const g = legacyUnitGrams(i.id, i.name);
  if (g) {
    const tpl = produceTemplate(i.id);
    if (tpl) return { ...i, qty: (i.qty ?? 1) * g, name: tpl.name, basePrice: tpl.basePrice, unitG: tpl.unitG };
  }
  const packId = legacyPackItemId(i.id, i.name);
  if (!packId) return i;
  const tpl = produceTemplate(packId);
  if (!tpl) return i;
  return { ...i, id: packId, iconTexture: tpl.iconTexture, basePrice: tpl.basePrice, unpack: tpl.unpack };
}

/** 241차 — 조각 템플릿(수확물 기본 id → `<id>_pc`): 같은 아이콘 · 값은 단위 값 ÷ 조각 수 · 등급 없음 */
export function pieceTemplate(baseId: string): InvItemTemplate | null {
  const crop = cropOfProduce(baseId);
  const def = CROP_RAW_EAT[baseId];
  if (!crop || !def?.pieces) return null;
  return {
    id: pieceItemId(baseId), name: def.pieces.labelKo, icon: '', iconTexture: `px:${baseId}`,
    category: 'food', subCategory: PIECE_SUB, basePrice: Math.max(10, Math.round(produceBaseValue(crop, baseId, 'good') / def.pieces.count / 10) * 10),
    condition: 'fresh', equippable: false,
    ...(itemVitalsOf(pieceItemId(baseId)) ?? {}),
  };
}

/** 한 작물의 수확물 기본 id들(본 · 붉어진 것 · 중간 · 243차 팩 · 284차 봉지 · 먹는 부산물) */
function produceBaseIds(crop: CropDef): string[] {
  return [crop.harvest.itemId, ...(crop.harvest.ripenTo ? [crop.harvest.ripenTo.itemId] : []), ...(crop.interim ? [crop.interim.itemId] : []),
    ...(crop.harvest.pack ? [crop.harvest.pack.itemId] : []),
    ...(crop.harvest.bags ?? []).map((b) => b.itemId),
    ...(crop.byproducts ?? []).filter((b) => b.kind === 'food').map((b) => b.itemId)];
}

// ─────────────────────────────────────────────
// 284차 — 밭 부산물(g · 밭에 넣기)
// ─────────────────────────────────────────────

/** 밭 부산물 그림 — Gemini 그림이 없을 때의 16px 손그림(퇴비 자루 · 짚) */
const RESIDUE_PX: Record<string, string> = {
  res_barley_straw: 'px:it_straw', res_corn_stalk: 'px:it_straw', res_sesame_stalk: 'px:it_straw', res_bean_stalk: 'px:it_straw',
};

/** 밭 부산물 템플릿 — 가방 수량 = g · 값 없음(가게가 안 산다) · 신선도 없음(마른 것) */
export function residueTemplate(def: FarmResidueDef): InvItemTemplate {
  return {
    id: def.itemId, name: def.nameKo, icon: '', iconTexture: RESIDUE_PX[def.itemId] ?? 'px:it_compost',
    category: 'consumable', subCategory: RESIDUE_SUB, basePrice: def.itemId === 'farm_oilcake' ? 1 : 0, equippable: false, unitG: 1,
  };
}

/** 284차 — 먹는 부산물(무청 · 배추 겉잎 · 토란대 · 깻순)인가 */
export function isFoodByproduct(itemId: string): boolean {
  return byproductOf(parseProduceId(itemId).baseId)?.def.kind === 'food';
}

// ─────────────────────────────────────────────
// 농자재
// ─────────────────────────────────────────────

const SUPPLY_ICON: Record<string, string> = {
  farm_homi: 'px:it_homi', farm_compost: 'px:it_compost', farm_rain_barrel: 'px:it_rain_barrel', farm_tunnel: 'px:it_tunnel',
  farm_shade_net: 'px:it_shade_net', farm_cold_tank: 'px:it_cold_tank', farm_sprout_jar: 'px:it_sprout_jar', farm_hydro_rack: 'px:it_hydro_rack',
};

function supplyTemplate(s: (typeof FARM_SUPPLIES)[number]): InvItemTemplate {
  return {
    id: s.itemId, name: s.nameKo, icon: '', iconTexture: s.icon ? `px:${s.icon}` : (SUPPLY_ICON[s.itemId] ?? 'px:it_farm_kit'),
    category: s.kind === 'consumable' ? 'consumable' : 'etc', subCategory: FARM_SUB, basePrice: s.price, equippable: false,
  };
}

// ─────────────────────────────────────────────
// 표 · 조회
// ─────────────────────────────────────────────

/** 텃밭 아이템 전부(씨앗 · 모종 · 종구 · 수확물 3등급 · 농자재) — 도감 · 지급 · 세이브 백필이 읽는다 */
export const CROP_ITEM_TEMPLATES: InvItemTemplate[] = (() => {
  const out: InvItemTemplate[] = [];
  const seen = new Set<string>();
  const push = (t: InvItemTemplate | null): void => { if (t && !seen.has(t.id)) { seen.add(t.id); out.push(t); } };
  for (const crop of CROP_DATABASE) {
    for (const st of crop.starts) if (!st.itemId.startsWith('crop_')) push(startTemplate(crop, st));
  }
  for (const crop of CROP_DATABASE) {
    for (const base of produceBaseIds(crop)) for (const g of GRADES) push(produceTemplate(produceItemId(base, g)));
  }
  // 241차 — 조각(나눈 것)
  for (const crop of CROP_DATABASE) for (const base of produceBaseIds(crop)) push(pieceTemplate(base));
  // 284차 — 밭 부산물(깻대 · 콩대 · 보릿짚 · 옥수숫대 · 검불 · 폐배지 · 깻묵)
  for (const r of FARM_RESIDUES) push(residueTemplate(r));
  // 집 안 설비(시루 · 수경 재배기)는 가방 물건이 아니라 가구다(집 「넣어 둔 가구」로 배달)
  for (const s of FARM_SUPPLIES) if (s.site !== 'indoor') push(supplyTemplate(s));
  return out;
})();

const TPL_BY_ID = new Map(CROP_ITEM_TEMPLATES.map((t) => [t.id, t]));

/** id → 텃밭 아이템 템플릿(없으면 null) */
export function cropItemTemplate(id: string): InvItemTemplate | null {
  return TPL_BY_ID.get(id) ?? null;
}

/** 수확물인가(등급 꼬리 포함 — 소분류로도 본다) */
export function isProduceItem(i: { id: string; subCategory?: string }): boolean {
  return i.subCategory === PRODUCE_SUB || !!cropOfProduce(i.id);
}

// ─────────────────────────────────────────────
// 가게 진열
// ─────────────────────────────────────────────

/** 가게 진열 한 줄 — `ShopEntry`와 같은 모양(순환 import를 피하려고 구조만 맞춘다) */
export interface CropShopEntry extends InvItemTemplate {
  price: number;
  maxPerPurchase: number;
  desc: string;
  /** 진열하는 달(KST) — 없으면 늘 */
  seasonMonths?: number[];
  /** 배운 뒤에 진열 */
  requiresSkill?: string;
  /** 하루 재고 배율(희귀할수록 적다) */
  stockMult?: number;
  /** 집 가구로 배달(시루 · 수경 재배기) */
  furnKind?: FurnKind;
  /** 237차 — 이 레벨부터 진열(작물 난이도 단계) */
  minLevel?: number;
  /** 237차 — 이 자격을 가진 뒤에 진열(까다로운 작물 — 유기농업기능사) */
  requiresLicense?: string;
  /** 241차 — 개량종: 원종을 이만큼 거둔 뒤에 진열 */
  requiresHarvests?: { cropId: string; count: number };
  /** 247차 — 아주 까다로운 작물은 열흘에 한 번꼴 들어오는 날에만 진열 */
  rareArrival?: boolean;
}

/** 237차 — 단계가 열릴 때 예로 드는 작물(이름은 작물 DB에서 읽는다) */
const TIER_EXAMPLES: Record<number, string[]> = {
  2: ['chili', 'cherry_tomato', 'garlic'],
  3: ['cucumber', 'ginger', 'myoga', 'turmeric'],
  4: ['gomchwi', 'dureup', 'wasabi'],
};
const TIER_PHRASE: Record<number, string> = { 2: '보통 난이도 작물', 3: '까다로운 작물', 4: '아주 까다로운 작물' };

/**
 * 237차 — 레벨이 올라 작물 단계가 열렸을 때의 한 줄(채널 로그 · 떠오르는 안내).
 * 3단계부터는 유기농업기능사도 있어야 한다 — 아직 없으면 그 조건을 붙인다.
 */
export function farmTierNoticeKo(tier: number, hasCert: boolean): string {
  const lv = FARM_TUNING.tierLevels[tier - 1] ?? 1;
  const names = (TIER_EXAMPLES[tier] ?? []).map((id) => getCrop(id)?.nameKo).filter((x): x is string => !!x).join(' · ');
  const cond = tier >= FARM_TUNING.certTier && !hasCert ? '유기농업기능사가 있으면' : '이제';
  return `[텃밭] 레벨 ${lv} — ${cond} ${TIER_PHRASE[tier] ?? '작물'}도 기를 수 있다 (${names})`;
}

/** 237차 — 씨앗 · 모종의 난이도 단계 요건 → 진열 조건 · 241차 — 개량종은 원종을 거둔 횟수도 · 247차 아주 까다로움은 들어오는 날에만 */
function gateFields(crop: CropDef, st: CropStart): Pick<CropShopEntry, 'minLevel' | 'requiresLicense' | 'requiresHarvests' | 'rareArrival'> {
  const g = cropGate(crop, st);
  return {
    ...(g.level > 1 ? { minLevel: g.level } : {}), ...(g.license ? { requiresLicense: g.license } : {}),
    // 247차 — 아주 까다로운 작물(사용자 「씨앗을 일반 종묘사에서 구하기 힘들게」) — 늘 있지 않고 들어오는 날에만
    ...(g.tier >= 4 ? { rareArrival: true } : {}),
    ...(crop.variant ? { requiresHarvests: { cropId: crop.variant.of, count: crop.variant.afterHarvests } } : {}),
  };
}

/** 241차 — 원종을 거둬 개량종이 열렸을 때 한 줄(채널 로그 · 떠오르는 안내) */
export function variantNoticeKo(base: CropDef, opened: CropDef[]): string {
  const names = opened.map((v) => v.nameKo).join(' · ');
  return `[텃밭] ${base.nameKo}를 ${opened[0]?.variant?.afterHarvests ?? 3}번 거뒀다 — 종묘사에 ${names}이 들어온다`;
}

/** 집 안 설비 → 가구 종류 */
const INDOOR_FURN: Record<string, FurnKind> = { farm_sprout_jar: 'sprout_jar', farm_hydro_rack: 'hydro_rack' };

/** 생활용품점 — 씨앗 봉투 · 호미 · 퇴비 · 설비(희귀 씨앗은 재고가 적다) */
export function dailyFarmEntries(): CropShopEntry[] {
  const out: CropShopEntry[] = [];
  for (const crop of CROP_DATABASE) for (const st of crop.starts) {
    if (st.kind !== 'seed' || st.itemId.startsWith('crop_')) continue;
    out.push({
      ...startTemplate(crop, st), price: st.cost, maxPerPurchase: 12, desc: startDesc(crop, st),
      stockMult: RARITY_STOCK[crop.rarity], ...(crop.requires?.skill ? { requiresSkill: crop.requires.skill } : {}),
      ...gateFields(crop, st),
    });
  }
  for (const s of FARM_SUPPLIES) {
    if (s.shop === 'nursery') continue;   // 238차 — 종묘사 자재
    const furn = INDOOR_FURN[s.itemId];
    out.push({
      ...supplyTemplate(s), price: s.price, maxPerPurchase: s.buyMax ?? (s.kind === 'consumable' ? 12 : 1),
      desc: furn ? `${s.descKo}\n집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.` : s.descKo,
      ...(furn ? { furnKind: furn, category: 'etc' as const, subCategory: '가구' } : {}),
      ...(s.requiresSkill ? { requiresSkill: s.requiresSkill } : {}),
      ...(s.rarity ? { stockMult: s.rarity === 'rare' ? 0.12 : s.rarity === 'uncommon' ? 0.35 : 1 } : {}),
    });
  }
  return out;
}

/**
 * 종묘사(238차 — 식자재마트에서 옮겨 왔다) — 씨앗 · 모종 · 종구 · 배지(모종 · 종구는 심는 철에만 진열 · 산채 모종은 배운 뒤에)
 * + 관리 작업 자재(육묘 트레이 · 지주대 · 유인끈 · 멀칭 비닐 · 복합비료 · 살균제 · 아인산 · 칼슘액비 · 살충제).
 */
export function nurseryFarmEntries(): CropShopEntry[] {
  const out: CropShopEntry[] = [];
  for (const crop of CROP_DATABASE) for (const st of crop.starts) {
    if (st.itemId.startsWith('crop_')) continue;
    const allYear = st.months.length >= 12;
    out.push({
      ...startTemplate(crop, st), price: st.cost, maxPerPurchase: st.kind === 'seedling' ? Math.max(10, st.perCell * 4) : st.kind === 'seed' ? 12 : 8,
      desc: startDesc(crop, st), stockMult: RARITY_STOCK[crop.rarity],
      ...(allYear || st.kind === 'seed' ? {} : { seasonMonths: st.months }),
      ...(crop.requires?.skill ? { requiresSkill: crop.requires.skill } : {}),
      ...gateFields(crop, st),
    });
  }
  for (const s of FARM_SUPPLIES) {
    if (s.shop !== 'nursery') continue;
    out.push({ ...supplyTemplate(s), price: s.price, maxPerPurchase: s.buyMax ?? (s.kind === 'consumable' ? 24 : 1), desc: s.descKo });
  }
  return out;
}
