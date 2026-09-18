/**
 * @file CookIngredientDatabase.ts
 * @description 불요리 재료 DB + 인벤 아이템 → 재료 매핑 (154차 — 스펙 §3)
 *
 * 간(염도)·당분·질량·익음 온도/시간·타는 온도를 재료마다 데이터로 둔다.
 * 아이템 매핑은 **id 규칙과 필드**로만 한다(어획물 subCategory · byproductKind · forageCatch+speciesId ·
 * 손질 산출 id 접두 · 식자재 `cookIngredient` 필드). 어종·아이템을 여기 하드코딩하지 않는다.
 *
 * 염분 기준(1큰술): 소금 15g · 국간장 2.4g · 액젓 3.0g · 고추장 1.2g / 당분: 설탕 12g · 고추장 3g.
 */

import type { CookIngredientDef } from '../types/Cooking.js';

const I = (
  id: string, nameKo: string, nameEn: string, kind: CookIngredientDef['kind'], unit: CookIngredientDef['unit'],
  massGPerUnit: number, cookMinC: number, cookSec: number, burnC: number,
  extra: Partial<Pick<CookIngredientDef, 'saltGPerUnit' | 'sugarGPerUnit' | 'waterMlPerUnit'>> = {},
): CookIngredientDef => ({
  id, nameKo, nameEn, kind, unit, massGPerUnit, cookMinC, cookSec, burnC,
  saltGPerUnit: extra.saltGPerUnit ?? 0, sugarGPerUnit: extra.sugarGPerUnit ?? 0,
  ...(extra.waterMlPerUnit !== undefined ? { waterMlPerUnit: extra.waterMlPerUnit } : {}),
});

export const COOK_INGREDIENTS: CookIngredientDef[] = [
  // ── 주재료 (g 단위 — 아이템 실중량) ──
  I('fish', '생선 (원물)', 'Whole fish', 'main', 'g', 1, 60, 480, 215),
  I('fish_dressed', '손질 생선·필렛', 'Dressed fish / fillet', 'main', 'g', 1, 60, 400, 215),
  I('seodeori', '서더리 (머리·뼈)', 'Fish frame (head & bones)', 'main', 'g', 1, 60, 720, 215),
  I('squid', '오징어', 'Squid', 'main', 'g', 1, 60, 150, 250),
  I('clam', '바지락', 'Manila clam', 'main', 'g', 1, 65, 240, 230),
  I('mussel', '홍합', 'Mussel', 'main', 'g', 1, 65, 260, 230),
  I('oyster', '굴', 'Oyster', 'main', 'g', 1, 62, 150, 230),
  I('abalone', '전복', 'Abalone', 'main', 'g', 1, 60, 900, 230),   // 죽에서 쌀과 함께 오래 끓여도 무르지 않는다
  I('eel', '장어', 'Eel', 'main', 'g', 1, 60, 540, 220),
  // ── 국물 채소 ──
  I('radish', '무', 'Radish', 'base', 'ea', 100, 70, 600, 200),
  I('leek', '대파', 'Green onion', 'finish', 'ea', 25, 70, 100, 225),
  I('onion', '양파', 'Onion', 'veg', 'ea', 80, 70, 300, 225),
  I('bean_sprout', '콩나물', 'Bean sprouts', 'veg', 'ea', 60, 70, 240, 220),
  I('carrot', '당근', 'Carrot', 'veg', 'ea', 40, 75, 360, 225),
  I('crown_daisy', '쑥갓', 'Crown daisy', 'finish', 'ea', 20, 70, 40, 180),
  I('water_parsley', '미나리', 'Water parsley', 'finish', 'ea', 20, 70, 45, 180),
  I('chili_green', '청양고추', 'Green chili', 'finish', 'ea', 8, 70, 80, 225),
  I('chili_red', '홍고추', 'Red chili', 'finish', 'ea', 8, 70, 80, 225),
  I('lemon', '레몬', 'Lemon', 'finish', 'ea', 30, 70, 60, 180),
  // ── 양념 (spoon = 1큰술 = 정량 1) ──
  I('salt', '소금', 'Salt', 'season', 'spoon', 15, 0, 1, 999, { saltGPerUnit: 15 }),
  I('soy', '국간장', 'Soup soy sauce', 'season', 'spoon', 15, 0, 1, 999, { saltGPerUnit: 2.4 }),
  I('soy_dark', '진간장', 'Soy sauce', 'season', 'spoon', 15, 0, 1, 999, { saltGPerUnit: 2.2, sugarGPerUnit: 0.6 }),
  I('fish_sauce', '액젓', 'Fish sauce', 'season', 'spoon', 15, 0, 1, 999, { saltGPerUnit: 3.0 }),
  I('gochugaru', '고춧가루', 'Chili flakes', 'season', 'spoon', 8, 0, 1, 999),
  I('gochujang', '고추장', 'Chili paste', 'season', 'spoon', 18, 0, 1, 999, { saltGPerUnit: 1.2, sugarGPerUnit: 3 }),
  I('garlic', '다진마늘', 'Minced garlic', 'season', 'spoon', 12, 60, 120, 205),
  I('ginger', '생강', 'Ginger', 'season', 'spoon', 6, 60, 120, 205),
  I('sugar', '설탕', 'Sugar', 'season', 'spoon', 12, 0, 1, 999, { sugarGPerUnit: 12 }),
  I('pepper', '후추', 'Black pepper', 'season', 'spoon', 2, 0, 1, 999),
  I('sesame_oil', '참기름', 'Sesame oil', 'oil', 'spoon', 12, 0, 1, 999),
  I('cooking_oil', '식용유', 'Cooking oil', 'oil', 'spoon', 12, 0, 1, 999),
  // ── 물 · 곡물 ──
  I('water', '물', 'Water', 'liquid', 'cup', 200, 0, 1, 999, { waterMlPerUnit: 200 }),
  I('rice', '쌀', 'Rice', 'grain', 'cup', 160, 80, 1200, 215),
];

const BY_ID = new Map(COOK_INGREDIENTS.map((i) => [i.id, i]));
export function getCookIngredient(id: string): CookIngredientDef | undefined {
  return BY_ID.get(id);
}

/** 아이템 → 재료 매핑에 필요한 최소 필드 (client `InvItem`의 부분집합) */
export interface CookableItemLike {
  id: string;
  subCategory?: string;
  byproductKind?: string;
  forageCatch?: boolean;
  speciesId?: string;
  weightG?: number;
  /** 식자재 아이템이 직접 지정하는 재료 id (상점 카탈로그 정본) */
  cookIngredient?: string;
  /** 통마리/필렛 등 손질 산출은 이름으로 오징어 여부를 가른다 */
  name?: string;
}

/** 장어류 어종 — 장어구이 주재료 */
const EEL_SPECIES = new Set(['conger_eel', 'hagfish', 'pike_conger']);
/** 두족류 어종 — 오징어볶음 주재료 (문어·낙지는 볶음 재료로 인정하지 않는다 — 별도 요리) */
const SQUID_SPECIES = new Set(['squid', 'cuttlefish', 'swordtip_squid']);
/** 채집 생물 → 재료 */
const FORAGE_TO_ING: Record<string, string> = {
  clam_varicosa: 'clam', mytilus_coruscus: 'mussel', oyster_gigas: 'oyster', haliotis_discus: 'abalone',
};

/** 어종이 어떤 주재료가 되는가 (156차 — 요리 도감 변형 후보 산출용) */
export function speciesMainIngredient(speciesId: string): 'fish' | 'eel' | 'squid' {
  if (EEL_SPECIES.has(speciesId)) return 'eel';
  if (SQUID_SPECIES.has(speciesId)) return 'squid';
  return 'fish';
}

export interface IngredientMatch {
  ing: string;
  /** 투입 단위 수 (g 재료 = 중량) */
  units: number;
  weightG?: number;
}

/**
 * 인벤 아이템 하나가 어떤 재료인가. null이면 조리 재료가 아니다.
 * ⚠ 어종 id를 여기 나열하지 않는다 — 장어·오징어만 **재료 종류가 다른** 예외 집합이다.
 */
export function ingredientOfItem(item: CookableItemLike): IngredientMatch | null {
  if (item.cookIngredient && BY_ID.has(item.cookIngredient)) return { ing: item.cookIngredient, units: 1 };
  const w = Math.max(1, Math.round(item.weightG ?? 0));
  // 손질 부산물 — 머리·척추·갈빗대 = 서더리
  if (item.byproductKind === 'head' || item.byproductKind === 'spine' || item.byproductKind === 'rib' || item.byproductKind === 'boneHead') {
    return { ing: 'seodeori', units: w, weightG: w };
  }
  // 채집물 (조례상 판매 금지 — 요리 sink)
  if (item.forageCatch && item.speciesId && FORAGE_TO_ING[item.speciesId]) {
    return { ing: FORAGE_TO_ING[item.speciesId], units: w, weightG: w };
  }
  // 두족류 손질 산출 (몸통살·통마리) — 오징어
  if (item.id.startsWith('inv_ceph_')) {
    if (/octo/.test(item.id)) return null;
    return { ing: 'squid', units: w, weightG: w };
  }
  // 손질 원물·필렛 — 손질 생선
  if (item.id.startsWith('inv_dressed_') || item.id.startsWith('inv_fillet') || item.id.startsWith('inv_engawa_') || item.id.startsWith('inv_engwskin_')) {
    return { ing: 'fish_dressed', units: w, weightG: w };
  }
  // 어획물 원물
  if (item.subCategory === '어획물' && item.speciesId && item.weightG) {
    if (EEL_SPECIES.has(item.speciesId)) return { ing: 'eel', units: w, weightG: w };
    if (SQUID_SPECIES.has(item.speciesId)) return { ing: 'squid', units: w, weightG: w };
    return { ing: 'fish', units: w, weightG: w };
  }
  return null;
}
