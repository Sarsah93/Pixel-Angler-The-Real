/**
 * @file CarryWeight.ts
 * @description 324차 — 가방 무게와 과적 4단계(사용자 지정 2026-11-13).
 *
 *  「이전에 없었던 가방 무게 개념이 추가되면 모든 아이템들의 무게를 부여해야 하고 … 과적 정도를 4단계로」
 *   1단계 40kg 이하 = 평소와 같다 · 2단계 40kg 초과 = 걷기 · 달리기가 느려지고 탈것을 못 탄다 · 허기 · 수분 · 피로가 더 든다 ·
 *   3단계 55kg 초과 = 훨씬 심하다 · 4단계 70kg 초과 = 제자리에서 움직이지 못한다. 단계 사이 값은 비례해서 잇는다.
 *
 * 무게는 아이템에 저장하지 않는다 — 그때그때 센다(구세이브 백필 불필요). 정하는 순서:
 *  ① 개체가 가진 무게(`weightG` — 고기 · 갯것 · 필렛) ② 무게로 세는 물건(`unitG`) ③ 낚싯대 · 릴 제원(자중)
 *  ④ 낚싯줄 스풀(남은 길이 × 굵기 × 비중 + 스풀) ⑤ 봉돌 · 헤드(`sinkerWeightG`) ⑥ 찌(부력 → 자중)
 *  ⑦ 이 파일의 id 표 ⑧ 이름에 적힌 무게(「600g」 · 「1kg」 · 「500ml」) ⑨ 씨앗 · 모종 규칙 ⑩ 소분류 기본값.
 * 순수 TS — 렌더 없음.
 */

import { TUNING } from '../config/tuning.js';
import { reelSpecFor, rodSpecFor } from '../db-schema/RodCatalog.js';
import type { ReelItemSpec } from '../types/RodItem.js';
import { itemBaseId } from './ItemInstance.js';

/** 무게를 셀 때 보는 아이템의 모습(클라이언트 `InvItem`이 그대로 들어온다) */
export interface CarryWeightItem {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  qty: number;
  basePrice?: number;
  weightG?: number;
  unitG?: number;
  sinkerWeightG?: number;
  floatBuoyG?: number;
  tool?: string;
  lineMaterial?: string;
  lineNo?: number;
  lineLengthM?: number;
  lineUsedM?: number;
  netReachM?: number;
  /** 담다 만 사시미 접시 — 접시 + 조각 */
  plateWip?: { quads: ReadonlyArray<ReadonlyArray<{ weightG: number }>> };
}

/** 낚싯줄 비중(g/cm³) — 나일론 1.14 · 카본 1.78 · 합사 0.97 */
const LINE_DENSITY: Record<string, number> = { nylon: 1.14, monofilament: 1.14, fluorocarbon: 1.78, pe_braid: 0.97 };

/** 낚싯줄 굵기(mm) — 1호 = 0.165mm, 굵기는 호수의 제곱근에 비례한다 */
export function lineDiameterMm(lineNo: number): number {
  return 0.165 * Math.sqrt(Math.max(0.05, lineNo));
}

/** 낚싯줄만의 무게(g) = 단면적(mm²) × 길이(m) × 비중 */
export function lineMassG(lineNo: number, lengthM: number, material = 'nylon'): number {
  const d = lineDiameterMm(lineNo);
  return (Math.PI / 4) * d * d * Math.max(0, lengthM) * (LINE_DENSITY[material] ?? 1.14);
}

/** 릴 자중(g) — 제원에 있으면 그것, 없으면 번수로 어림한다(스피닝 2500번 ≈ 240g · 14000번 ≈ 740g · 베이트 150번 ≈ 210g) */
export function reelWeightG(spec: ReelItemSpec): number {
  if (spec.weightG) return spec.weightG;
  if (spec.kind === 'bait') return Math.round(150 + spec.size * 0.4);
  if (spec.size >= 8000) return Math.round(650 + (spec.size - 8000) * 0.0155);
  return Math.round(150 + spec.size * 0.035 + (spec.castMult >= 1.05 ? 180 : 0));
}

/** id로 정한 무게(g) — 이름에 무게가 없고 소분류 기본값으로는 어긋나는 것들 */
const ITEM_WEIGHT_G: Record<string, number> = {
  // 손도구 · 입는 것
  inv_watering_can: 600,
  inv_cap: 90, inv_glasses: 30, inv_top: 450, inv_pants: 500, inv_watch: 60,
  inv_gloves: 90, inv_gloves_rubber: 150, inv_gloves_work: 40, farm_gloves: 60,
  inv_shoes: 800, inv_boots_wading: 1600,
  // 가방
  qr_tackle_pouch: 300, qr_bag_field: 900, qr_bag_expedition: 1400, qr_bag_guide: 1200, qr_bag_voyage: 1500,
  inv_bag_mountain: 1300, inv_bag_tackle_vest: 700, inv_bag_dry: 500,
  // 밑밥 · 소모품
  inv_chum: 1500, inv_chum_powder: 1000, inv_chum_powder_heavy: 1200, inv_chum_bread: 500, inv_chum_apmac: 800, inv_chum_corn: 340,
  inv_ice_bulk: 3000, inv_coarse_salt: 500, inv_spray: 220, inv_oil: 60, inv_carekit: 350,
  inv_bandage: 40, inv_potion: 130, inv_seasick: 15, inv_mosquito: 120,
  shop_bandage: 40, shop_splint: 250, shop_medicine: 80,
  cook_butane_can: 330, inv_cigarette_pack: 25,
  // 먹을 것
  inv_can: 190, shop_snackbar: 55, shop_riceball: 130, shop_meal_grilled: 550, shop_meal_soup: 700,
  shop_coffee: 380, shop_latte: 380, shop_dessert: 150, shop_makgeolli: 790, shop_anju: 300, shop_soju: 650,
  shop_meal_abalone: 500, shop_meal_eel: 400, shop_assorted_sashimi_small: 350, shop_black_sea_bream_sashimi_small: 300,
  shop_flatfish: 1500, shop_squid: 350,
  inv_veges: 800, cook_radish: 1000, cook_leek: 100, shop_sauce: 600, cook_onion: 220, cook_bean_sprout: 300, cook_carrot: 180,
  cook_crown_daisy: 150, cook_water_parsley: 200, cook_chili_green: 80, cook_chili_red: 80, cook_lemon: 120,
  cook_salt: 500, cook_gochugaru: 250, cook_garlic: 200, cook_soy: 550, cook_soy_dark: 550, cook_fish_sauce: 550,
  cook_gochujang: 500, cook_ginger: 100, cook_sugar: 500, cook_pepper: 60, cook_sesame_oil: 330, cook_cooking_oil: 500,
  cook_perilla_oil: 330, cook_perilla_powder: 200, cook_sesame_salt: 120,
  cure_siraegi: 300,
  // 미끼
  inv_worm: 3, inv_ragworm: 4, inv_honmushi: 8, inv_earthworm: 2, pack_ragworm: 60, pack_bait_urchin: 500,
  inv_krill: 1, pack_krill_box: 60, inv_breadbait: 5, inv_fishcut: 8, pack_bait_clam: 120, pack_bait_corn: 200,
  // 채비 부속 · 루어 묶음
  inv_minnow: 10, lure_starter_set: 80, egi_pro_set: 60,
  inv_sinkerG2: 1, inv_swivel: 1, inv_swivel_barrel: 1, inv_cushion: 1, inv_cushion_bell: 1, inv_cushion_round: 1, inv_bead_halfmoon: 1,
  inv_tairaba_skirt_red: 3, inv_tairaba_necktie_orange: 3, inv_chinu3: 1, inv_treble: 2,
  hook_ishidai_16: 3, hook_tuna_circle: 15,   // 324차 — 굵은 바늘
  // 조리도구 · 식기 · 화구
  knife_sashimi: 200, knife_utility: 250, knife_yanagiba_pro: 230, knife_yanagiba: 230, knife_yanagiba_basic: 210, qr_knife_okseon: 220,
  cook_pot_camp: 350, cook_pot_home: 1100, cook_pan: 900, cook_grate: 400, cook_stove_portable: 1400,
  inv_plate_s: 300, inv_plate_m: 500, inv_plate_l: 800, inv_plate_xl: 1200,
  // 낚시 · 해루질 도구
  inv_bucket: 250, inv_cooler: 3500, crate_std_pro: 1200, inv_bakkan: 900, shop_rod_holder: 1300,
  inv_headlamp: 110, qr_headlamp_trainee: 120, qr_headlamp_keeper: 180, inv_tongs: 250, inv_gaff: 350, inv_rake: 450,
  // 통발
  inv_trap_trap_crab_basic: 1500, inv_trap_trap_crab_pro: 3000, inv_trap_trap_shrimp_basic: 800, inv_trap_trap_eel_basic: 1200,
  inv_trap_trap_eel_pro: 3500, inv_trap_trap_octopus_earthen: 2500, inv_trap_trap_octopus_pvc: 700, inv_trap_trap_fish_net: 2000,
  // 재료
  inv_mat_tin: 500, inv_mat_mesh: 300, inv_mat_wire: 200, inv_mat_wood: 1500, inv_mat_blank: 150, inv_mat_gear: 120,
  inv_mat_cloth: 150, inv_mat_herb: 30, workshop_pro_tools: 3500, inv_mat_resin: 400, inv_mat_paint: 600, inv_junk: 150,
  // 설치형 · 가구 — 들고 다니기에는 무겁다(집까지 옮기는 일이 짐이다)
  inv_place_farm: 4000, inv_place_fence: 3000, inv_place_aq_live: 25000, inv_place_aq_disp: 12000, inv_place_workbench: 18000,
  furn_chair: 4500, furn_island: 16000, furn_sofa: 32000, furn_rug: 3500, furn_plant: 2500, furn_stand: 2200, furn_radio: 1300,
  furn_aquarium: 9000, farm_sprout_jar: 1800, farm_hydro_rack: 6000,
  // 농사 도구
  farm_homi: 300, farm_rain_barrel: 3500, farm_tunnel: 2500, farm_shade_net: 1800, farm_cold_tank: 14000, farm_drying_rack: 5000,
  farm_crock: 9000, farm_sickle: 300, farm_fork: 1400, farm_trowel: 220, farm_winnow: 600, farm_tray: 250, farm_shears: 250,
  farm_harvest_scissors: 120, farm_flail: 900,
  farm_pack_tray: 20, farm_grain_bag: 15, farm_stake: 350, farm_twine: 150, farm_mulch: 500, farm_fert: 200, farm_fungicide: 100,
  farm_phosphite: 100, farm_calcium: 100, farm_insecticide: 100, farm_stevia: 150, farm_insect_net: 350, farm_bird_net: 300,
  farm_fleece: 300, farm_straw: 1500, farm_trellis_net: 200, farm_peat: 1500,
  // 자전거는 타거나 끌고 다닌다 — 짐으로 세지 않는다
  inv_bike: 0,
  // 이야기 물건
  quest_ice_crate: 4000, qd_bamboo_tray: 800, qd_food_box: 900, quest_family_photo: 10, inv_skill_reset: 5,
};

/** 소분류 기본값(g) — 위 규칙에 걸리지 않은 것(새로 생긴 아이템 · 실행 중 만들어지는 것) */
const SUBCATEGORY_WEIGHT_G: Record<string, number> = {
  '어획물': 800, '채집물': 150, '수산물': 500, '손질 필렛': 350, '손질 통마리': 700, '부산물': 200, '엔가와': 60,
  '요리(회)': 300, '요리(숙회)': 300, '요리': 500, '보양식': 450, '가공품': 250, '식자재': 250,
  '농산물': 250, '농산물 조각': 250, '갈무리': 200, '양념': 300, '씨앗 · 모종': 20, '농사 도구': 300, '밭 부산물': 100,
  '집어제/밑밥': 1000, '보냉': 3000, '조미/손질': 500, '스프레이/오일': 150, '장비 수리': 350, '의약품': 60, '구급품': 80,
  '야간 대비': 120, '연료': 330,
  '원줄 스풀': 120, '목줄 스풀': 60, '채비 부속': 5, '바늘/훅': 1, '생미끼': 4, '냉동미끼': 2, '반죽미끼': 5, '선어미끼': 8,
  '미끼': 100, '루어': 15, '지그헤드': 5, '편대': 15,
  '손도구': 400, '낚싯대': 250, '릴': 280, '가방': 1000, '모자': 90, '안경': 30, '상의': 450, '하의': 500, '장갑': 80, '신발': 900, '시계': 60,
  '재료': 300, '조리도구': 400, '낚시도구': 1000, '해루질 도구': 250, '통발': 1500, '식기': 500, '설치형': 5000, '화구': 1400, '가구': 6000,
  '도면': 5, '증서': 5, '잡동사니': 150, '탈것': 0, '기호품': 25, '심부름': 1000, '이야기 물건': 20,
};

const CATEGORY_WEIGHT_G: Record<string, number> = { gear: 400, tackle: 10, lure: 15, food: 300, consumable: 150, etc: 500, quest: 200 };

/** 이름에 적힌 무게 — 「600g」 · 「1kg」 · 「3.5L」 · 「500ml」(없으면 null). 「800lm」 · 「5.3m」는 무게가 아니다 */
export function weightFromNameG(name: string): number | null {
  let m = name.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (m) return Number(m[1]) * 1000;
  m = name.match(/(\d+(?:\.\d+)?)\s*g(?![a-zA-Z가-힣])/);
  if (m) return Number(m[1]);
  m = name.match(/(\d+)\s*ml/i);
  if (m) return Number(m[1]);
  m = name.match(/(\d+(?:\.\d+)?)\s*L(?![a-zA-Z])/);
  if (m) return Number(m[1]) * 1000;
  return null;
}

/** 씨앗 · 모종 · 종구 — 봉지는 가볍고 포트 모종 · 묘목 · 종구는 무겁다 */
function seedWeightG(id: string, name: string): number | null {
  if (id === 'sdl_blueberry') return 2500;
  if (id === 'set_wood_ear') return 1300;
  if (id === 'set_garlic') return 250;
  if (/^set_(sweet_potato|pumpkin_sweet_potato)$/.test(id)) return 80;
  if (id.startsWith('sdl_')) return /묘목/.test(name) ? 900 : /1칸 분/.test(name) ? 300 : 120;
  if (id.startsWith('set_')) return 300;
  if (id.startsWith('seed_')) return /한 판/.test(name) ? 20 : /30알/.test(name) ? 25 : 5;
  return null;
}

/** 찌 자중(g) — 부력찌는 몸통이 제 부력만큼 크고, 수중찌는 침력이 곧 무게다 */
function floatWeightG(it: CarryWeightItem): number | null {
  if (it.floatBuoyG !== undefined) return it.floatBuoyG >= 0 ? Math.round(6 + it.floatBuoyG * 0.9) : Math.round(2 - it.floatBuoyG);
  const ho = Number(it.name.match(/(\d+(?:\.\d+)?)\s*호/)?.[1] ?? NaN);
  if (/수중찌|잠길찌/.test(it.name)) return Math.round(2 + (ho || 0.5) * 3.75);
  if (/찌/.test(it.name)) return Math.round(6 + (ho || 0.5) * 3.4);
  return null;
}

/** 한 개(수량 1)의 무게(g). 무게로 세는 물건(`unitG`)은 수량 1이 `unitG`g이다 */
export function itemUnitWeightG(it: CarryWeightItem): number {
  if (it.plateWip) {
    const pieces = it.plateWip.quads.reduce((a, q) => a + q.reduce((b, p) => b + (p.weightG || 0), 0), 0);
    return 500 + pieces;
  }
  if (it.weightG !== undefined && it.weightG > 0) return it.weightG;
  if (it.unitG) return it.unitG;
  const id = itemBaseId(it.id);
  if (it.tool === 'rod' || it.subCategory === '낚싯대') return rodSpecFor(id, it.name, it.basePrice).weightG;
  if (it.subCategory === '릴') return reelWeightG(reelSpecFor(id, it.name));
  if (it.tool === 'net' || /^뜰채/.test(it.name)) {
    const reach = it.netReachM ?? Number(it.name.match(/(\d+(?:\.\d+)?)\s*m/)?.[1] ?? 5);
    return Math.round(250 + 85 * reach);
  }
  if (it.lineLengthM !== undefined && it.lineNo !== undefined) {
    const left = Math.max(0, it.lineLengthM - (it.lineUsedM ?? 0));
    return Math.round(25 + lineMassG(it.lineNo, left, it.lineMaterial));
  }
  if (it.sinkerWeightG !== undefined && it.sinkerWeightG > 0) return it.sinkerWeightG;
  const table = ITEM_WEIGHT_G[id];
  if (table !== undefined) return table;
  if (it.subCategory === '채비 부속') {
    const f = floatWeightG(it);
    if (f !== null) return f;
  }
  const named = weightFromNameG(it.name);
  if (named !== null) return named;
  const seed = seedWeightG(id, it.name);
  if (seed !== null) return seed;
  return SUBCATEGORY_WEIGHT_G[it.subCategory] ?? CATEGORY_WEIGHT_G[it.category] ?? 200;
}

/** 칸 하나(묶음)의 무게(g) */
export function itemStackWeightG(it: CarryWeightItem): number {
  // 수량이 숫자가 아니면(깨진 세이브 · 잘못 만든 아이템) 한 개로 센다 — NaN이 합계를 오염시키면 과적 판정이 통째로 틀어진다
  const qty = Number.isFinite(it.qty) ? Math.max(0, it.qty) : 1;
  const unit = itemUnitWeightG(it);
  return (Number.isFinite(unit) ? Math.max(0, unit) : 0) * qty;
}

/** 여러 칸의 무게 합(g) */
export function carriedWeightG(items: Iterable<CarryWeightItem>): number {
  let g = 0;
  for (const it of items) g += itemStackWeightG(it);
  return g;
}

/** 과적 단계 — 1(가볍다) · 2(무겁다) · 3(매우 무겁다) · 4(움직이지 못한다) */
export type EncumbranceStage = 1 | 2 | 3 | 4;

/** 지금 무게가 몸에 주는 것 */
export interface Encumbrance {
  totalKg: number;
  stage: EncumbranceStage;
  /** 걷기 속도 배율(4단계 0) */
  moveMult: number;
  /** 달리기 가산분(달리기 배율 − 1) 가운데 남는 비율 — 0이면 달리지 못한다 */
  runBonus: number;
  canRun: boolean;
  /** 탈것(자전거)을 탈 수 있나 — 1단계만 */
  canRide: boolean;
  /** 소모 배율 [허기, 수분, 피로] */
  drainMult: [number, number, number];
  /** 제자리에서 움직이지 못한다 */
  immobile: boolean;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * Math.max(0, Math.min(1, t));

/** 든 무게(kg) → 과적 단계와 배율. 경계를 「넘으면」 다음 단계다(40.0kg은 1단계) */
export function encumbranceOf(totalKg: number): Encumbrance {
  const E = TUNING.encumbrance;
  const kg = Number.isFinite(totalKg) ? Math.max(0, totalKg) : 0;   // 숫자가 아니면 가볍다고 본다(움직이지 못하게 가두지 않는다)
  if (kg <= E.freeKg) {
    return { totalKg: kg, stage: 1, moveMult: 1, runBonus: 1, canRun: true, canRide: true, drainMult: [1, 1, 1], immobile: false };
  }
  if (kg > E.maxKg) {
    return { totalKg: kg, stage: 4, moveMult: 0, runBonus: 0, canRun: false, canRide: false, drainMult: [...E.drainAtMax], immobile: true };
  }
  if (kg <= E.heavyKg) {
    const t = (kg - E.freeKg) / Math.max(0.001, E.heavyKg - E.freeKg);
    return {
      totalKg: kg, stage: 2, moveMult: lerp(1, E.moveAtHeavy, t), runBonus: lerp(1, E.runBonusAtHeavy, t), canRun: true, canRide: false,
      drainMult: [lerp(1, E.drainAtHeavy[0], t), lerp(1, E.drainAtHeavy[1], t), lerp(1, E.drainAtHeavy[2], t)], immobile: false,
    };
  }
  const t = (kg - E.heavyKg) / Math.max(0.001, E.maxKg - E.heavyKg);
  return {
    totalKg: kg, stage: 3, moveMult: lerp(E.moveAtHeavy, E.moveAtMax, t), runBonus: 0, canRun: false, canRide: false,
    drainMult: [
      lerp(E.drainAtHeavy[0], E.drainAtMax[0], t), lerp(E.drainAtHeavy[1], E.drainAtMax[1], t), lerp(E.drainAtHeavy[2], E.drainAtMax[2], t),
    ],
    immobile: false,
  };
}

/** 단계 이름 — 화면 표기 */
export const ENCUMBRANCE_LABEL: Record<EncumbranceStage, { ko: string; en: string }> = {
  1: { ko: '가볍다', en: 'Light' },
  2: { ko: '무겁다', en: 'Heavy' },
  3: { ko: '매우 무겁다', en: 'Very heavy' },
  4: { ko: '움직일 수 없다', en: 'Cannot move' },
};

/** 무게 글 — 1kg 아래는 g, 그 위는 kg(소수 첫째 자리) */
export function carryWeightText(g: number): string {
  const n = Math.max(0, g);
  if (n < 1000) return `${Math.round(n)}g`;
  return `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}kg`;
}

/** 큰 고기를 집으로 보내는 용달 값(원) — 기본 + kg당, 500원 단위 */
export function haulFeeWon(weightKg: number): number {
  const E = TUNING.encumbrance;
  return Math.round((E.haulBaseWon + Math.max(0, weightKg) * E.haulPerKgWon) / 500) * 500;
}
