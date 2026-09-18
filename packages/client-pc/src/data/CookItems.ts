/**
 * @file CookItems.ts
 * @description 불요리 아이템 정적 테이블 (154차) — 식자재·양념·용기·화구·연료 → 조리 필드 단일 소스
 *
 * ⚖ ItemVitals(129차)와 같은 이유로 **테이블**이다: 조리 필드(`cookIngredient`·`cookwareId`·`stoveHeatId`·
 *   `fuelId`)를 상점 카탈로그 리터럴에만 적으면 이미 세이브에 든 아이템에는 영원히 반영되지 않는다.
 *   ① 상점 카탈로그 ② 시드 ③ 세이브 로드 백필 세 경로가 전부 여기서 읽는다(`applyCookItemFields`).
 *
 * 단위 규칙(스펙 §3): 채소 1개 = 1 qty · 양념 1큰술 = 1 qty · 생수 1병 = 2.5컵 · 쌀 1kg = 6컵.
 */

import type { InvItemTemplate } from '../store/InventoryStore.js';

export interface CookItemDef {
  /** core 재료 id */
  cookIngredient?: string;
  /** 1 qty가 몇 단위인가 (없으면 1) — 생수 1병 = 2.5컵, 쌀 1kg = 6컵 */
  cookUnitsPerQty?: number;
  /** 용기 (core COOKWARES id) */
  cookwareId?: string;
  /** 화구 (core HEAT_SOURCES id) — 설치형 스토브 아이템 */
  stoveHeatId?: string;
  /** 연료 (core FUELS id) */
  fuelId?: string;
}

export const COOK_ITEMS: Record<string, CookItemDef> = {
  // ── 식자재 (채소·곡물·물) ──
  cook_radish: { cookIngredient: 'radish' },
  cook_leek: { cookIngredient: 'leek' },
  cook_onion: { cookIngredient: 'onion' },
  cook_bean_sprout: { cookIngredient: 'bean_sprout' },
  cook_carrot: { cookIngredient: 'carrot' },
  cook_crown_daisy: { cookIngredient: 'crown_daisy' },
  cook_water_parsley: { cookIngredient: 'water_parsley' },
  cook_chili_green: { cookIngredient: 'chili_green' },
  cook_chili_red: { cookIngredient: 'chili_red' },
  cook_lemon: { cookIngredient: 'lemon' },
  shop_rice: { cookIngredient: 'rice', cookUnitsPerQty: 6 },
  shop_water: { cookIngredient: 'water', cookUnitsPerQty: 2.5 },
  // ── 양념 (1 qty = 1큰술) ──
  cook_salt: { cookIngredient: 'salt' },
  cook_soy: { cookIngredient: 'soy' },
  cook_soy_dark: { cookIngredient: 'soy_dark' },
  cook_fish_sauce: { cookIngredient: 'fish_sauce' },
  cook_gochugaru: { cookIngredient: 'gochugaru' },
  cook_gochujang: { cookIngredient: 'gochujang' },
  cook_garlic: { cookIngredient: 'garlic' },
  cook_ginger: { cookIngredient: 'ginger' },
  cook_sugar: { cookIngredient: 'sugar' },
  cook_pepper: { cookIngredient: 'pepper' },
  cook_sesame_oil: { cookIngredient: 'sesame_oil' },
  cook_cooking_oil: { cookIngredient: 'cooking_oil' },
  // 굵은소금(문어 손질용 · 097차)도 소금이다 — 손질과 요리가 같은 봉지를 쓴다
  inv_coarse_salt: { cookIngredient: 'salt' },
  // ── 용기 ──
  cook_pot_camp: { cookwareId: 'pot_camp' },
  cook_pot_home: { cookwareId: 'pot_home' },
  cook_pan: { cookwareId: 'pan' },
  cook_grate: { cookwareId: 'grill_grate' },
  // ── 화구 · 연료 ──
  cook_stove_portable: { stoveHeatId: 'portable_gas' },
  cook_butane_can: { fuelId: 'butane_can' },
};

/** 아이템 객체에 **비어 있는 조리 필드만** 채운다 (유저 상태는 건드리지 않는다) */
export function applyCookItemFields<T extends { id: string }>(item: T): T {
  const d = COOK_ITEMS[item.id];
  if (!d) return item;
  const t = item as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(d)) {
    if (t[k] === undefined) t[k] = v;
  }
  return item;
}

/** 식자재마트 요리 코너 — 상점 카탈로그가 스프레드한다 */
const F = (id: string, name: string, icon: string, basePrice: number, price: number, maxPerPurchase: number, desc: string,
  extra: Partial<InvItemTemplate> = {}): InvItemTemplate & { price: number; maxPerPurchase: number; desc: string } => ({
  id, name, icon: '', iconTexture: `px:${icon}`, category: 'food', subCategory: '식자재', basePrice, price, maxPerPurchase,
  equippable: false, desc, ...extra, ...COOK_ITEMS[id],
});
const S = (id: string, name: string, basePrice: number, price: number, maxPerPurchase: number, desc: string,
  extra: Partial<InvItemTemplate> = {}): InvItemTemplate & { price: number; maxPerPurchase: number; desc: string } => ({
  id, name, icon: '', iconTexture: 'px:it_spice', category: 'consumable', subCategory: '양념', basePrice, price, maxPerPurchase,
  equippable: false, desc, ...extra, ...COOK_ITEMS[id],
});

export const COOK_CORNER = [
  // 채소 — 1개 = 1 qty · 신선도 있음(냉장고에 두면 정지)
  F('cook_radish', '무', 'it_veg', 1200, 1500, 10, '탕·조림의 시원한 국물 밑바탕. 1개.', { condition: 'fresh' }),
  F('cook_leek', '대파', 'it_veg', 500, 600, 20, '마지막에 넣는다. 1대.', { condition: 'fresh' }),
  F('cook_onion', '양파', 'it_veg', 600, 700, 10, '단맛과 감칠맛. 1개.', { condition: 'fresh' }),
  F('cook_bean_sprout', '콩나물', 'it_veg', 800, 1000, 10, '시원한 국물. 한 줌.', { condition: 'fresh' }),
  F('cook_carrot', '당근', 'it_veg', 500, 600, 10, '볶음·죽에 색을 낸다. 1개.', { condition: 'fresh' }),
  F('cook_crown_daisy', '쑥갓', 'it_veg', 900, 1100, 10, '매운탕 마지막 향채. 미나리와 둘 다 넣지 않는다. 한 줌.', { condition: 'fresh' }),
  F('cook_water_parsley', '미나리', 'it_veg', 900, 1100, 10, '맑은탕의 향채. 한 줌.', { condition: 'fresh' }),
  F('cook_chili_green', '청양고추', 'it_veg', 300, 400, 20, '칼칼함. 홍고추와 택1. 1개.', { condition: 'fresh' }),
  F('cook_chili_red', '홍고추', 'it_veg', 300, 400, 20, '색과 은은한 매운맛. 1개.', { condition: 'fresh' }),
  F('cook_lemon', '레몬', 'it_veg', 800, 1000, 10, '구이 마무리. 1개.', { condition: 'fresh' }),
  // 양념 — 1큰술 = 1 qty
  S('cook_salt', '소금', 100, 150, 30, '간의 시작. 1큰술.'),
  S('cook_soy', '국간장', 200, 250, 30, '탕의 간. 1큰술.'),
  S('cook_soy_dark', '진간장', 200, 250, 30, '조림·볶음·장어 양념. 1큰술.'),
  S('cook_fish_sauce', '액젓', 250, 300, 20, '감칠맛. 1큰술.'),
  S('cook_gochugaru', '고춧가루', 400, 500, 30, '매운탕을 매운탕으로 만드는 것. 1큰술.'),
  S('cook_gochujang', '고추장', 400, 500, 20, '볶음 양념. 1큰술.'),
  S('cook_garlic', '다진마늘', 300, 350, 30, '비린내를 잡는 최소한의 방어선. 1큰술.'),
  S('cook_ginger', '생강', 300, 350, 20, '장어·조림의 잡내 제거. 1큰술.'),
  S('cook_sugar', '설탕', 150, 200, 30, '조림·볶음의 단맛. 탕에는 넣지 않는다. 1큰술.'),
  S('cook_pepper', '후추', 200, 250, 20, '구이 마무리. 1큰술.'),
  S('cook_sesame_oil', '참기름', 500, 600, 20, '죽을 볶고 볶음을 마무리한다. 1큰술.'),
  S('cook_cooking_oil', '식용유', 200, 250, 30, '팬 구이·볶음. 1큰술.'),
  // 용기 · 화구 · 연료 (기타)
  { id: 'cook_pot_camp', name: '코펠 냄비 (1.8L)', icon: '', iconTexture: 'px:it_pot', category: 'etc', subCategory: '조리도구', basePrice: 18000, price: 22000, maxPerPurchase: 2, equippable: false,
    desc: '가볍고 얇다 — 빨리 끓고 빨리 식는다. 탕·조림·죽.', ...COOK_ITEMS.cook_pot_camp },
  { id: 'cook_pot_home', name: '양수 냄비 (3.5L)', icon: '', iconTexture: 'px:it_pot', category: 'etc', subCategory: '조리도구', basePrice: 38000, price: 45000, maxPerPurchase: 1, equippable: false,
    desc: '두껍고 크다 — 온도가 천천히 움직여 실수 여유가 있다. 탕·조림·죽.', ...COOK_ITEMS.cook_pot_home },
  { id: 'cook_pan', name: '프라이팬', icon: '', iconTexture: 'px:it_pan', category: 'etc', subCategory: '조리도구', basePrice: 22000, price: 26000, maxPerPurchase: 1, equippable: false,
    desc: '구이·볶음. 중불이 적정, 강불은 탄다.', ...COOK_ITEMS.cook_pan },
  { id: 'cook_grate', name: '석쇠', icon: '', iconTexture: 'px:it_grate', category: 'etc', subCategory: '조리도구', basePrice: 9000, price: 11000, maxPerPurchase: 1, equippable: false,
    desc: '직화 구이. 기름 없이 굽는다.', ...COOK_ITEMS.cook_grate },
  { id: 'cook_stove_portable', name: '휴대용 가스스토브', icon: '', iconTexture: 'px:it_stove', category: 'etc', subCategory: '화구', basePrice: 32000, price: 38000, maxPerPurchase: 1, equippable: false,
    desc: '현장 화구. 인벤토리에서 [화구 설치] — 캐니스터를 끼워야 불이 켜진다. 바람이 세면 화력이 준다.', ...COOK_ITEMS.cook_stove_portable },
  { id: 'cook_butane_can', name: '부탄 캐니스터', icon: '', iconTexture: 'px:it_gascan', category: 'consumable', subCategory: '연료', basePrice: 1500, price: 2000, maxPerPurchase: 10, equippable: false,
    desc: '강불 기준 55분. 끼우면 되돌릴 수 없다.', ...COOK_ITEMS.cook_butane_can },
] as const;
