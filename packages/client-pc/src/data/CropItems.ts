/**
 * @file CropItems.ts
 * @description 235차 — 텃밭 아이템 템플릿(씨앗 · 모종 · 종구 · 수확물 3등급 · 농자재)과 가게 진열. 정본은 core 작물 DB.
 *
 * - 수확물은 **등급마다 다른 id**(`crop_lettuce` = 상 · `_sp` = 특 · `_nm` = 보통) — 가방에서 따로 쌓인다
 *   (한 칸에 섞이면 값이 뭉개진다). 이름 꼬리(「· 특」)가 등급을 말한다.
 * - 값은 팔 때 다시 센다(`producePrice` — 달 지수 · 주간 출렁임 · 등급 · 숨은 재조정). `basePrice`는 기준값이다.
 * - 아이콘 = `px:<기본 id>`(작물 갈래 원형 + 작물 팔레트 — `tools/gen_pixel_icons.py`).
 * - 가게: 생활용품점 = 씨앗 · 호미 · 퇴비 · 설비 / 식자재마트 = 모종 · 종구(심는 철에만 진열).
 *   희귀할수록 하루 재고가 적다(`stockMult`) · 배워야 쓰는 자격 물건은 배운 뒤에 진열된다(`requiresSkill`).
 */

import {
  CROP_DATABASE, FARM_SUPPLIES, FARM_TUNING, GRADE_KO, cropOfProduce, parseProduceId, produceItemId,
  type CropDef, type CropGrade, type CropRarity, type CropStart,
} from '@tra/core';
import type { InvItemTemplate } from '../store/InventoryStore.js';
import type { FurnKind } from './HomeFurniture.js';

/** 수확물 소분류 — 가게 매입(`shopBuysItem`)과 요리 출처가 이 이름으로 알아본다 */
export const PRODUCE_SUB = '농산물';
/** 씨앗 · 모종 · 종구 */
export const SEED_SUB = '씨앗 · 모종';
/** 호미 · 퇴비 · 설비 */
export const FARM_SUB = '농사 도구';

const GRADES: CropGrade[] = ['special', 'good', 'normal'];

/** 희귀도 → 하루 재고 배율(가게 규모 × 이 값) */
export const RARITY_STOCK: Record<CropRarity, number> = { common: 1, uncommon: 0.35, rare: 0.12, very_rare: 0.05 };

/** 1 qty가 요리 재료 몇 단위인가(마트 식자재 단위와 맞춘다 — 무 1개 = 국물용 토막 12개 · 통마늘 1통 = 다진마늘 4큰술) */
const COOK_UNITS: Record<string, number> = {
  crop_radish: 12, crop_onion: 3, crop_bean_sprout: 1.5, crop_carrot: 5, crop_garlic: 4, crop_ginger: 80,
};

/** 밑밥(낟알)으로 갤 수 있는 수확물 — 압맥 · 옥수수 */
const CHUM_GRAIN = new Set(['crop_barley', 'crop_corn']);

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
  if (baseId === crop.harvest.ripenTo?.itemId) return crop.harvest.ripenTo.nameKo;
  return crop.interim?.labelKo ?? crop.nameKo;
}

/** 등급 1의 기준 값(원) — 달 지수 · 출렁임 없이(카탈로그용). 실제 판매가는 `producePrice` */
function produceBaseValue(crop: CropDef, baseId: string, grade: CropGrade): number {
  const unit = baseId === crop.harvest.itemId ? crop.price.base
    : baseId === crop.harvest.ripenTo?.itemId ? crop.harvest.ripenTo.price
      : crop.interim?.price ?? crop.price.base;
  return Math.max(10, Math.round((unit * FARM_TUNING.gradePrice[grade] * (crop.rebalance ?? 1)) / 10) * 10);
}

function produceCookIngredient(crop: CropDef, baseId: string): string | undefined {
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
    ...(cook ? { cookIngredient: cook, ...(COOK_UNITS[base] ? { cookUnitsPerQty: COOK_UNITS[base] } : {}) } : {}),
    ...(CHUM_GRAIN.has(base) ? { chumKind: 'grain' as const } : {}),
  };
}

/** 한 작물의 수확물 기본 id들(본 · 붉어진 것 · 중간) */
function produceBaseIds(crop: CropDef): string[] {
  return [crop.harvest.itemId, ...(crop.harvest.ripenTo ? [crop.harvest.ripenTo.itemId] : []), ...(crop.interim ? [crop.interim.itemId] : [])];
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
    id: s.itemId, name: s.nameKo, icon: '', iconTexture: SUPPLY_ICON[s.itemId] ?? 'px:it_farm_kit',
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
    });
  }
  for (const s of FARM_SUPPLIES) {
    const furn = INDOOR_FURN[s.itemId];
    out.push({
      ...supplyTemplate(s), price: s.price, maxPerPurchase: s.kind === 'consumable' ? 12 : 1,
      desc: furn ? `${s.descKo}\n집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.` : s.descKo,
      ...(furn ? { furnKind: furn, category: 'etc' as const, subCategory: '가구' } : {}),
      ...(s.requiresSkill ? { requiresSkill: s.requiresSkill } : {}),
      ...(s.rarity ? { stockMult: s.rarity === 'rare' ? 0.12 : s.rarity === 'uncommon' ? 0.35 : 1 } : {}),
    });
  }
  return out;
}

/** 식자재마트 — 모종 · 종구 · 배지(심는 철에만 진열 · 산채 모종은 배운 뒤에) */
export function martFarmEntries(): CropShopEntry[] {
  const out: CropShopEntry[] = [];
  for (const crop of CROP_DATABASE) for (const st of crop.starts) {
    if (st.kind === 'seed' || st.itemId.startsWith('crop_')) continue;
    const allYear = st.months.length >= 12;
    out.push({
      ...startTemplate(crop, st), price: st.cost, maxPerPurchase: st.kind === 'seedling' ? Math.max(10, st.perCell * 4) : 8,
      desc: startDesc(crop, st), stockMult: RARITY_STOCK[crop.rarity],
      ...(allYear ? {} : { seasonMonths: st.months }),
      ...(crop.requires?.skill ? { requiresSkill: crop.requires.skill } : {}),
    });
  }
  return out;
}
