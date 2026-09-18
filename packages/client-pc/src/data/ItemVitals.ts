/**
 * @file ItemVitals.ts
 * @description 소모품 효과 단일 테이블 — 음식 회복치·보양식 버프·구급품 (129차 P7)
 *
 * ⚖ **왜 테이블인가**: 회복치를 상점 카탈로그 리터럴에만 적어두면, 그 값을 나중에 추가·수정해도
 * **이미 세이브에 들어 있는 아이템에는 영원히 반영되지 않는다**(53차 회칼 손 도구 버그와 같은 함정).
 * 그래서 id → 효과를 이 한 곳에만 두고, ① 상점 카탈로그 ② 시드 아이템 ③ **세이브 로드 백필**
 * 세 경로가 전부 여기서 읽어간다. 값을 고치면 구세이브도 다음 로드에 자동 정합된다.
 *
 * ⚖ 155차 — **허기·수분은 `FoodNutrition.ts`(실질량·열량·수분)에서 파생**한다: kcal ÷ 2,400 · ml ÷ 2,000.
 *   정식 한 끼 ≈ 30% = 하루 세 끼. 간식·통조림은 8~10%. 술·카페인은 유효 수분이 음수거나 절반.
 *
 * ⚖ 피로 회복 설계(사용자 결정 2026-09-11 (b)):
 *  - **일반 음식(간식·통조림·주먹밥)은 피로 회복 0** — 허기·수분 전담.
 *  - **중간(국물류·커피·술)은 소량**(8~20).
 *  - **보양식은 25~40 + 드레인 감소 버프**(`drainBuffMult` × `drainBuffMin` 활동 분).
 *  - **수면(침대)은 여전히 피로 0 전량 회복** — 음식은 부분 회복만 담당해 침대와 경쟁하지 않는다.
 *  - **카페인은 즉시 회복 + 리바운드 부채**(`fatigueRebound` 만큼 `fatigueReboundMin` 활동 분 뒤 복귀).
 */

import { restoreFromNutrition, FOOD_NUTRITION, type StatusCure } from '@tra/core';

/** 155차 — 허기·수분은 영양표(질량·kcal·ml)에서 파생한다. 손으로 적은 숫자를 남기지 않는다 */
const nut = (id: string): { hungerRestore: number; hydrationRestore: number } => restoreFromNutrition(FOOD_NUTRITION[id]);

/** 소모품 1회 사용 효과 — 전부 선택 필드(없으면 해당 효과 없음) */
export interface ItemVitalsDef {
  /** 허기 회복 % (음수 = 감소) */
  hungerRestore?: number;
  /** 수분 회복 % (음수 = 감소 — 술) */
  hydrationRestore?: number;
  /** 체력 회복 */
  hpRestore?: number;
  /** 피로 회복 — **양수 = 피로도가 내려간다** */
  fatigueRestore?: number;
  /** 리바운드로 되돌아오는 피로량 (카페인) */
  fatigueRebound?: number;
  /** 리바운드까지의 활동 시간(분) */
  fatigueReboundMin?: number;
  /** 보양식 드레인 감소 배율 (0.75 = 소모 −25%) */
  drainBuffMult?: number;
  /** 드레인 감소 지속 활동 시간(분) */
  drainBuffMin?: number;
  /** 구급품 — 이 종류를 요구하는 상태이상을 치료 */
  cureKind?: StatusCure;
  /** 구급품 품질 배율 */
  medicQuality?: number;
}

/**
 * id → 효과. 상점·시드·세이브 백필이 공유한다.
 * ⚠ 여기에 없는 아이템은 효과가 없다(참치 통조림 등 = 허기만 주는 것도 명시적으로 적는다).
 */
export const ITEM_VITALS: Record<string, ItemVitalsDef> = {
  // ── 편의점·마트 가공품 (일반 — 피로 회복 없음) ──
  inv_can:        { ...nut('inv_can') },
  shop_snackbar:  { ...nut('shop_snackbar') },
  shop_water:     { ...nut('shop_water') },
  shop_riceball:  { ...nut('shop_riceball') },

  // ── 식당 (중간 — 국물류) ──
  shop_meal_grilled: { ...nut('shop_meal_grilled'), hpRestore: 30, fatigueRestore: 20 },
  shop_meal_soup:    { ...nut('shop_meal_soup'), hpRestore: 15, fatigueRestore: 15 },

  // ── 식당 보양식 (129차 신설 — 피로 25~40 + 드레인 감소 버프) ──
  shop_meal_abalone: {
    ...nut('shop_meal_abalone'), hpRestore: 35, fatigueRestore: 30,
    drainBuffMult: 0.75, drainBuffMin: 40,
  },
  shop_meal_eel: {
    ...nut('shop_meal_eel'), hpRestore: 45, fatigueRestore: 40,
    drainBuffMult: 0.68, drainBuffMin: 60,
  },

  // ── 카페 (카페인 = 즉시 회복 + 리바운드 부채) ──
  shop_coffee:  {
    ...nut('shop_coffee'), fatigueRestore: 20, fatigueRebound: 10, fatigueReboundMin: 120,
  },
  shop_latte:   {
    ...nut('shop_latte'), hpRestore: 5,
    fatigueRestore: 12, fatigueRebound: 6, fatigueReboundMin: 120,
  },
  shop_dessert: { ...nut('shop_dessert'), fatigueRestore: 8 },

  // ── 주점 (술 = 수분 −) ──
  shop_makgeolli: { ...nut('shop_makgeolli'), fatigueRestore: 20 },
  shop_anju:      { ...nut('shop_anju'), hpRestore: 20, fatigueRestore: 5 },
  shop_soju:      { ...nut('shop_soju'), fatigueRestore: 10 },

  // ── 회(사시미) ──
  shop_assorted_sashimi_small:        { ...nut('shop_assorted_sashimi_small'), hpRestore: 10, fatigueRestore: 5 },
  shop_black_sea_bream_sashimi_small: { ...nut('shop_black_sea_bream_sashimi_small'), hpRestore: 12, fatigueRestore: 8 },

  // ── 구급품 (제작 P7 · 약국 판매) ──
  //  붕대 = 출혈 / 부목 = 골절 / 상비약 = 감기·독감·식중독·생물중독 등 medicine 계열.
  craft_bandage:  { cureKind: 'bandage',  medicQuality: 1 },
  craft_splint:   { cureKind: 'splint',   medicQuality: 1 },
  craft_medicine: { cureKind: 'medicine', medicQuality: 1, hpRestore: 5 },
  shop_bandage:   { cureKind: 'bandage',  medicQuality: 1.2 },
  shop_splint:    { cureKind: 'splint',   medicQuality: 1.2 },
  shop_medicine:  { cureKind: 'medicine', medicQuality: 1.3, hpRestore: 10 },
};

/** id의 효과 정의 (없으면 undefined) */
export function itemVitalsOf(id: string): ItemVitalsDef | undefined {
  return ITEM_VITALS[id];
}

/**
 * 아이템 객체에 **비어 있는 효과 필드만** 채운다 (유저 상태는 건드리지 않는다).
 * 상점 카탈로그 초기화·시드 생성·세이브 로드 백필이 공유하는 단일 진입점.
 */
export function applyItemVitals<T extends { id: string }>(item: T): T {
  const d = ITEM_VITALS[item.id];
  if (!d) return item;
  const t = item as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(d)) {
    if (t[k] === undefined) t[k] = v;
  }
  return item;
}
