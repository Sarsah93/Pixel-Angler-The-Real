/**
 * @file CropDatabase.ts
 * @description 텃밭 작물 DB (235차) — 실제 재배 자료를 칸(1㎡) 단위로 옮긴 표
 *
 * 환산 규칙
 *  - **칸 = 1㎡**(주말농장 한 구획 12㎡ = 텃밭 4×3칸). **칸당 수량 = 10a(1,000㎡) 수량 ÷ 1,000** — 통계의 10a는
 *    고랑 · 통로까지 포함한 면적이라 칸과 같은 기준이다(예: 시금치 10a 975kg → 칸당 약 1kg = 200g 단 3~5개).
 *    통계는 2024 농산물소득조사 · 생산량조사를 우선하고, 없으면 시험 · 재배 자료의 포기 수 × 포기당 수량으로 채웠다.
 *  - **씨앗 「1칸 분」** = 그 칸에 뿌리는 양(상추 1봉 ≈ 1,000립 중 한 이랑 몫). 섬 = 발아율(종자관리요강 · 봉투 표기:
 *    상추 60% · 시금치 65% · 무 70% · 고추 65%). 실험실 발아율 기준(일본 가정원예 표준 · 미국 연방 기준)을 넘지 않는다
 *    (당근 55% · 옥수수 · 풋콩 75%). 모종은 활착률 0.95 안팎, 맨뿌리로 옮기는 양파 · 대파는 0.88
 *    — **모종 = 육묘 기간(3~6주)을 건너뛴다**.
 *  - 종구 · 종서 대비 수확: 씨감자 1 → 약 10배 · 마늘 종구 1 → 6~7배 · 고구마순 1 → 0.4~0.5kg(전국 평균) ·
 *    콩나물 콩 100g → 400~600g · 녹두 100g → 숙주 800g~1kg · 느타리 배지 1.5kg → 두 번에 약 400g.
 *  - 기간(days)은 **적온 · 물 충분 · 노지** 기준. 실제 계절 밖이면 자라지 않는다(겨울나기 작물은 휴면).
 *  - 값은 2023~2025 도매 · 소매 평균을 단위 값으로(원). 달별 지수는 같은 기간의 계절 흐름(금배추 · 여름 상추).
 *  - **희귀 · 고가 · 저생산 작물**(산채 · 고추냉이 · 두릅)은 실제 값 흐름을 따르되 `rebalance`로 단가를 살짝 누른다
 *    — 칸 · 날 수익이 낚시를 넘지 않게(화면에는 드러내지 않는다 · 사용자 지시 2026-10-08).
 *
 * ⚠ 아이템 id 규칙: 씨앗 `seed_*` · 모종 `sdl_*` · 종구/종서/배지 `set_*` · 수확물 `crop_*`(클라이언트 `CropItems`가 템플릿을 만든다).
 */

import type { CropCare, CropDef, CropDifficulty, CropGrade, CropStart, FarmFacility, FarmSite, CropPack, CropBag, CropByproduct } from '../types/Farming.js';
import { farmResidueDef } from './FarmResidues.js';

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// ── 달별 값 지수(1~12월 · **연평균 = 1.00**) — 같은 갈래끼리 공유 ──
//  235차 조사(aT 소매 2023~2025 · 평년 · 소비자물가 등락률로 맞춘 추정치 — scratchpad farm_research/prices.md §1.3)로 다시 맞췄다.
//  전엔 손으로 그린 곡선이라 연평균이 1.04~1.18로 떠 있었다(한 해 내내 기준값보다 비싸게 팔렸다).
const P_LETTUCE = [1.05, 1.0, 0.86, 0.77, 0.73, 0.77, 1.14, 1.32, 1.27, 1.14, 0.95, 1.0];   // 상추 · 쑥갓 · 아욱 · 근대 · 루꼴라
const P_PERILLA = [1.12, 1.07, 1.01, 0.94, 0.87, 0.82, 0.84, 0.94, 1.03, 1.07, 1.1, 1.19];  // 깻잎 · 공심채 · 바질(여름 잎)
const P_SPINACH = [0.78, 0.73, 0.69, 0.73, 0.82, 0.99, 1.29, 1.6, 1.6, 1.17, 0.82, 0.78];
const P_YEOLMU = [1.18, 1.18, 1.07, 0.93, 0.82, 0.78, 0.84, 1.07, 1.07, 0.96, 1.0, 1.1];    // 열무 · 얼갈이
const P_CHIVE = [1.26, 1.21, 1.0, 0.86, 0.8, 0.78, 0.82, 1.02, 1.05, 1.0, 1.02, 1.18];
const P_SCALLION = [1.1, 1.12, 1.02, 0.9, 0.88, 0.95, 1.05, 1.12, 1.02, 0.93, 0.93, 0.98];
const P_CUCUMBER = [1.22, 1.28, 1.07, 0.8, 0.69, 0.71, 0.93, 1.1, 1.2, 1.0, 0.9, 1.1];     // 오이 · 여주 · 오크라 · 박
const P_ZUCCHINI = [1.33, 1.36, 1.16, 0.87, 0.74, 0.71, 0.78, 0.94, 1.07, 0.94, 0.94, 1.16];
const P_EGGPLANT = [1.25, 1.28, 1.15, 0.95, 0.85, 0.8, 0.78, 0.82, 0.92, 0.98, 1.05, 1.17];
const P_CHERRY_TOMATO = [1.15, 1.17, 1.1, 0.95, 0.82, 0.75, 0.8, 0.9, 1.0, 1.1, 1.14, 1.12];
const P_CHILI = [1.3, 1.35, 1.28, 1.05, 0.88, 0.78, 0.7, 0.68, 0.74, 0.88, 1.1, 1.26];
const P_CABBAGE = [0.91, 0.99, 1.04, 1.02, 0.82, 0.72, 0.85, 1.16, 1.64, 1.33, 0.77, 0.75];  // 금배추는 9월
const P_RADISH = [0.98, 0.91, 0.91, 0.93, 0.96, 0.93, 1.03, 1.19, 1.26, 1.01, 0.91, 0.98];   // 무 · 순무
const P_POTATO = [1.04, 1.1, 1.18, 1.16, 1.06, 0.84, 0.84, 0.9, 0.94, 0.96, 0.98, 1.0];
const P_SWEETPOTATO = [0.98, 1.0, 1.04, 1.08, 1.11, 1.12, 1.08, 1.0, 0.92, 0.87, 0.88, 0.92]; // 고구마 · 야콘
const P_CARROT = [1.01, 1.03, 1.03, 1.02, 1.0, 0.96, 0.95, 1.0, 1.05, 1.02, 0.97, 0.96];
const P_GARLIC = [1.01, 1.02, 1.03, 1.04, 1.03, 0.97, 0.95, 0.96, 0.98, 1.0, 1.0, 1.01];
const P_ONION = [1.04, 1.08, 1.08, 1.04, 0.93, 0.87, 0.89, 0.95, 1.0, 1.02, 1.06, 1.04];
const P_LEEK = [1.03, 1.05, 1.07, 1.02, 0.91, 0.88, 0.91, 1.0, 1.1, 1.05, 0.98, 1.0];
const P_GINGER = [0.98, 0.99, 1.0, 1.01, 1.02, 1.03, 1.03, 1.03, 1.03, 0.98, 0.95, 0.95];   // 생강 · 울금(저장 뿌리)
// 찰옥수수 — 조사값은 제철(6~9월)뿐이다. 철 밖은 냉동 · 진공 옥수수 값으로 둔다(추정)
const P_CORN = [1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.0, 0.88, 0.92, 1.1, 1.2, 1.2];
const P_MUSHROOM = [1.05, 1.05, 1.02, 0.98, 0.95, 0.94, 0.96, 0.98, 1.0, 1.0, 1.02, 1.05]; // 느타리
const P_SHIITAKE = [1.08, 1.06, 1.0, 0.94, 0.94, 0.98, 1.02, 1.03, 1.05, 0.96, 0.94, 1.0]; // 노루궁뎅이 · 목이(표고 흐름)
const P_PULSE = [0.98, 0.99, 1.0, 1.01, 1.02, 1.02, 1.03, 1.03, 1.02, 0.97, 0.96, 0.97];   // 콩 · 동부(들깨 · 서리태 흐름)
// 산나물 — 조사 자료가 없다. 봄 제철이 가장 싸고 철 밖은 말린 · 저장품 값(추정 · 연평균 1.0으로 맞춤)
const P_WILD = [1.17, 1.17, 1.03, 0.85, 0.76, 0.81, 0.9, 0.99, 0.99, 1.08, 1.17, 1.17];
const P_FLAT = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
// 241차 — 새 작물 곡선(aT 소매 2023~2025 흐름을 손으로 옮긴 뒤 연평균 1.00으로 맞춘다)
const norm = (a: number[]): number[] => { const m = a.reduce((x, y) => x + y, 0) / a.length; return a.map((v) => Math.round((v / m) * 100) / 100); };
const P_MELON = norm([1.35, 1.35, 1.3, 1.25, 1.05, 0.8, 0.7, 0.72, 0.85, 1.05, 1.3, 1.35]);          // 참외 — 초물 4~5월 비싸고 7~8월 싸다 · 철 밖은 저장 · 수입
const P_WATERMELON = norm([1.4, 1.4, 1.4, 1.3, 1.1, 0.85, 0.7, 0.72, 0.9, 1.2, 1.4, 1.4]);          // 수박 — 7~8월 성수기
const P_BLUEBERRY = norm([1.15, 1.15, 1.15, 1.15, 1.05, 0.78, 0.72, 0.85, 1.0, 1.15, 1.15, 1.15]); // 블루베리 — 국산 6~7월
const P_STRAWBERRY = norm([0.85, 0.8, 0.75, 0.72, 0.8, 1.1, 1.3, 1.3, 1.3, 1.3, 1.2, 0.95]);        // 딸기 — 겨울~봄 제철(시설) · 여름엔 거의 없다

const seed = (crop: string, months: number[], establish: number, days: number, cost: number, extra: Partial<CropStart> = {}): CropStart =>
  ({ kind: 'seed', itemId: `seed_${crop}`, perCell: 1, establish, days, months, cost, ...extra });
const seedling = (crop: string, months: number[], perCell: number, days: number, cost: number, extra: Partial<CropStart> = {}): CropStart =>
  ({ kind: 'seedling', itemId: `sdl_${crop}`, perCell, establish: 0.95, days, months, cost, ...extra });
const setOf = (crop: string, months: number[], establish: number, days: number, cost: number, labelKo: string, labelEn: string, extra: Partial<CropStart> = {}): CropStart =>
  ({ kind: 'set', itemId: `set_${crop}`, perCell: 1, establish, days, months, cost, labelKo, labelEn, ...extra });

/** 284차 — 밭 부산물 줄(g · 퇴비 대신 밭에 넣기 — `FarmResidues`) */
const residue = (id: string, at: CropByproduct['at'], perCell: [number, number], extra: Partial<CropByproduct> = {}): CropByproduct => {
  const r = farmResidueDef(id);
  if (!r) throw new Error(`밭 부산물 정의 없음: ${id}`);
  return {
    itemId: id, nameKo: r.nameKo, nameEn: r.nameEn, kind: 'residue', at, perCell, unitG: 1, price: 0, holdDays: 999,
    uses: r.mulchPerCell ? ['soil', 'mulch'] : ['soil'], soilPerCell: r.soilPerCell, noteKo: r.noteKo, noteEn: r.noteEn, ...extra,
  };
};
/** 284차 — 키질로 갈라낸 검불(낱알 1g당 g · 키질했을 때만) */
const chaff = (perUnit: number): CropByproduct => ({ ...residue('res_chaff', 'process', [0, 0]), perCell: undefined, perUnit, winnowedOnly: true });

export const CROP_DATABASE: CropDef[] = [
  // ═════ 실내 — 시루 · 배지 (철 무관 · 매일 거리) ═════
  {
    id: 'bean_sprout', nameKo: '콩나물', nameEn: 'Soybean sprouts', category: 'sprout', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'indoor', growMonths: ALL, water: 'high',
    // 나물콩 100g → 콩나물 400~600g(5~8일 · 재래 나물콩 시험 121~695%) · 직접 키운 백태 200g으로도 앉힌다(1.8배)
    starts: [
      seed('bean_sprout', ALL, 0.92, 6, 1200, { labelKo: '나물콩 100g (시루 한 번)', labelEn: 'Sprouting soybeans 100g (one jar)' }),
      // 284차 — 직접 거둔 콩은 g으로 센다(한 시루 = 200g)
      { kind: 'seed', itemId: 'crop_soybean', perCell: 200, establish: 0.85, days: 6, months: ALL, cost: 0, qtyMult: 1.8 },
    ],
    harvest: { itemId: 'crop_bean_sprout', nameKo: '콩나물 한 줌 (100g)', nameEn: 'Bean sprouts, a handful (100g)', qtyPerCell: [4, 6], holdDays: 2 },
    price: { base: 330, season: P_FLAT, volatility: 0.08 }, cookIngredient: 'bean_sprout',
    noteKo: '나물콩 100g이 시루에서 4~6배로 불어난다. 하루에 여러 번 물을 줘야 곧게 자란다.',
    noteEn: '100g of sprouting soybeans swells four- to sixfold in the jar. Water them several times a day or they grow crooked.',
  },
  {
    id: 'mung_sprout', nameKo: '숙주', nameEn: 'Mung bean sprouts', category: 'sprout', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'indoor', growMonths: ALL, water: 'high',
    // 녹두 100g → 숙주 760~1,110g(5일 · 농진청 「채흔」 762% · 산포 1,110%)
    starts: [seed('mung_sprout', ALL, 0.9, 5, 900, { labelKo: '녹두 100g (시루 한 번)', labelEn: 'Mung beans 100g (one jar)' })],
    harvest: { itemId: 'crop_mung_sprout', nameKo: '숙주 한 줌 (100g)', nameEn: 'Mung bean sprouts, a handful (100g)', qtyPerCell: [8, 10], holdDays: 2 },
    price: { base: 300, season: P_FLAT, volatility: 0.08 },
    noteKo: '녹두 100g → 숙주 800g~1kg, 닷새. 빛을 가리면 하얗게 자란다.',
    noteEn: '100g of mung beans becomes 800g to 1kg of sprouts in five days. Keep the light off and they stay white.',
  },
  {
    id: 'microgreens', nameKo: '새싹채소', nameEn: 'Microgreens', category: 'sprout', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'indoor', growMonths: ALL, water: 'high',
    starts: [seed('microgreens', ALL, 0.85, 8, 1500, { labelKo: '새싹채소 씨앗 (한 판 분)', labelEn: 'Microgreen seeds (one tray)' })],
    // 243차 — 판에서 한 줌씩 벤다(25g) · 두 줌을 용기에 담으면 한 팩(50g)
    harvest: { itemId: 'crop_microgreens', nameKo: '새싹채소 한 줌 (25g)', nameEn: 'Microgreens, a handful (25g)', qtyPerCell: [4, 6], holdDays: 2,
      pack: { itemId: 'crop_microgreens_pack', nameKo: '새싹채소 한 팩 (50g)', nameEn: 'Microgreens, a pack (50g)', units: 2 } },
    price: { base: 750, season: P_FLAT, volatility: 0.1 },
    noteKo: '무순 · 브로콜리 · 적양배추 새싹. 씨앗 10g이 일주일 남짓이면 100~150g.',
    noteEn: 'Radish, broccoli and red cabbage shoots. 10g of seed gives 100-150g in a little over a week.',
  },
  {
    id: 'oyster_mushroom', nameKo: '느타리버섯', nameEn: 'Oyster mushroom', category: 'mushroom', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'indoor', growMonths: ALL, water: 'high',
    // 균이 다 자란 배지를 사 온다 → 7~12일에 첫 발생 · 12일쯤 뒤 한 번 더
    //  배지 1kg → 첫물 155~161g · 수량의 94%가 1 · 2주기(경기도 시험) → 1.5kg 배지 두 번에 약 400g
    starts: [setOf('oyster_mushroom', ALL, 0.95, 11, 5000, '느타리 배지 (1.5kg)', 'Oyster mushroom block (1.5kg)')],
    // 243차 — 송이째 딴다(약 100g) · 두 송이를 용기에 담으면 한 팩(200g)
    harvest: { itemId: 'crop_oyster_mushroom', nameKo: '느타리 (1송이 · 약 100g)', nameEn: 'Oyster mushroom (one cluster, about 100g)', qtyPerCell: [2, 2], repeat: { everyDays: 12, times: 1 }, holdDays: 2, bonusSteps: 3,
      pack: { itemId: 'crop_oyster_mushroom_pack', nameKo: '느타리 한 팩 (200g)', nameEn: 'Oyster mushrooms, a pack (200g)', units: 2 } },
    price: { base: 1000, season: P_MUSHROOM, volatility: 0.1 },
    // 236차 — 송이 크기는 들쭉날쭉하다: 거둘 때마다 0~30% 덤(bonusSteps 3 · 평균 +15%)
    byproducts: [residue('res_spent_substrate', 'harvest', [1000, 1300], { onEnd: true })],   // 284차 — 다 거둔 배지(1.5kg → 수분 빠진 폐배지)
    noteKo: '배지 1.5kg에서 두 번 돋는다. 세 번째는 거의 나지 않는다. 첫물이 가장 굵다.',
    noteEn: 'A 1.5kg block fruits twice; a third flush hardly comes. The first flush is the thickest.',
  },

  // ═════ 잎채소 (시설 상한 ×2.0) ═════
  {
    // 242차 — 상추는 품종별로 따로 기른다(사용자 지시 「상추-적로메인 (X) · 적로메인 (O)」). id `lettuce`는 세이브 · 퀘스트(정옥선 모종) 호환으로 두고 이름만 「청치마」.
    //   잎 따기형(청치마 · 적치마 · 꽃상추 · 청축면 · 적축면 · 생채)은 겉잎을 4일마다, 포기형(청로메인 · 적로메인 · 버터헤드)은 포기째 한 번.
    id: 'lettuce', nameKo: '청치마', nameEn: 'Green leaf lettuce (Cheongchima)', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    // 포기간 25~30cm → 칸당 9포기 · 잎 따기 4일마다 포기당 25g 안팎 · 한여름은 꽃대가 올라 멈춘다
    starts: [seed('lettuce', [3, 4, 5, 8, 9], 0.62, 55, 200), seedling('lettuce', [4, 5, 9, 10], 9, 25, 300)],
    harvest: { itemId: 'crop_lettuce', nameKo: '청치마 한 줌 (100g)', nameEn: 'Cheongchima, a handful (100g)', qtyPerCell: [2, 3], repeat: { everyDays: 4, times: 10 }, holdDays: 6 },
    price: { base: 1200, season: P_LETTUCE, volatility: 0.3 },
    noteKo: '흔히 「상추」라 부르는 청상추. 겉잎부터 따면 속에서 계속 올라온다. 여름 더위에는 꽃대가 서서 잎이 쓰다.',
    noteEn: 'The everyday green "sangchu". Pick the outer leaves and new ones keep coming from the centre. In summer heat it bolts and the leaves turn bitter.',
  },
  {
    id: 'jeokchima', nameKo: '적치마', nameEn: 'Red leaf lettuce (Jeokchima)', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    starts: [seed('jeokchima', [3, 4, 5, 8, 9], 0.62, 55, 200), seedling('jeokchima', [4, 5, 9, 10], 9, 25, 300)],
    harvest: { itemId: 'crop_jeokchima', nameKo: '적치마 한 줌 (100g)', nameEn: 'Jeokchima, a handful (100g)', qtyPerCell: [2, 3], repeat: { everyDays: 4, times: 10 }, holdDays: 6 },
    price: { base: 1300, season: P_LETTUCE, volatility: 0.3 },
    noteKo: '잎끝이 자주색으로 물드는 적상추. 햇빛을 많이 받을수록 붉다. 쌈에 가장 많이 오르는 품종.',
    noteEn: 'Red-tipped leaf lettuce — the more sun, the redder. The variety most often on a ssam table.',
  },
  {
    id: 'kkot_lettuce', nameKo: '꽃상추', nameEn: 'Red oak-style lettuce (Kkot-sangchu)', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    starts: [seed('kkot_lettuce', [3, 4, 5, 8, 9], 0.6, 55, 220), seedling('kkot_lettuce', [4, 5, 9, 10], 9, 25, 320)],
    harvest: { itemId: 'crop_kkot_lettuce', nameKo: '꽃상추 한 줌 (100g)', nameEn: 'Kkot-sangchu, a handful (100g)', qtyPerCell: [2, 3], repeat: { everyDays: 4, times: 10 }, holdDays: 5 },
    price: { base: 1400, season: P_LETTUCE, volatility: 0.3 },
    noteKo: '잎 가장자리가 꽃잎처럼 갈라지고 끝이 붉다. 잎이 얇아 더위에 약하고 하루만 지나도 시든다.',
    noteEn: 'Leaves split like petals with red tips. Thin leaves — dislikes heat and wilts within a day.',
  },
  {
    id: 'cheongchukmyeon', nameKo: '청축면', nameEn: 'Green frilly lettuce (Cheongchukmyeon)', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    starts: [seed('cheongchukmyeon', [3, 4, 5, 8, 9], 0.62, 55, 200), seedling('cheongchukmyeon', [4, 5, 9, 10], 9, 25, 300)],
    harvest: { itemId: 'crop_cheongchukmyeon', nameKo: '청축면 한 줌 (100g)', nameEn: 'Cheongchukmyeon, a handful (100g)', qtyPerCell: [2, 3], repeat: { everyDays: 4, times: 10 }, holdDays: 6 },
    price: { base: 1300, season: P_LETTUCE, volatility: 0.3 },
    noteKo: '잎이 곱슬곱슬 오그라드는(축면) 청상추. 포기가 둥글게 차서 한 번에 따는 양이 많다.',
    noteEn: 'Crinkled ("chukmyeon") green lettuce. Forms a round bush, so each picking is generous.',
  },
  {
    id: 'jeokchukmyeon', nameKo: '적축면', nameEn: 'Red frilly lettuce (Jeokchukmyeon)', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    starts: [seed('jeokchukmyeon', [3, 4, 5, 8, 9], 0.6, 55, 220), seedling('jeokchukmyeon', [4, 5, 9, 10], 9, 25, 320)],
    harvest: { itemId: 'crop_jeokchukmyeon', nameKo: '적축면 한 줌 (100g)', nameEn: 'Jeokchukmyeon, a handful (100g)', qtyPerCell: [2, 3], repeat: { everyDays: 4, times: 10 }, holdDays: 6 },
    price: { base: 1400, season: P_LETTUCE, volatility: 0.3 },
    noteKo: '곱슬잎이 자줏빛으로 물드는 적상추. 색이 진할수록 값을 더 쳐준다.',
    noteEn: 'Crinkled red lettuce. Deeper colour fetches a better price.',
  },
  {
    id: 'saengchae', nameKo: '생채', nameEn: 'Saengchae lettuce', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    starts: [seed('saengchae', [3, 4, 5, 8, 9], 0.62, 55, 200), seedling('saengchae', [4, 5, 9, 10], 9, 25, 300)],
    harvest: { itemId: 'crop_saengchae', nameKo: '생채 한 줌 (100g)', nameEn: 'Saengchae, a handful (100g)', qtyPerCell: [2, 3], repeat: { everyDays: 4, times: 10 }, holdDays: 6 },
    price: { base: 1300, season: P_LETTUCE, volatility: 0.3 },
    noteKo: '연한 잎이 속부터 겹겹이 차는 잎상추. 쌉쌀한 맛이 적어 무침 · 겉절이로 쓴다.',
    noteEn: 'Loose-leaf lettuce that fills from the centre. Little bitterness — used for salads and quick kimchi.',
  },
  {
    id: 'cheongromaine', nameKo: '청로메인', nameEn: 'Green romaine (Cheongromaine)', category: 'leaf', speedClass: 'leafy', rarity: 'uncommon',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    // 포기째 한 번 — 정식 뒤 35~40일 · 포기 300g 안팎 · 칸당 9포기
    starts: [seed('cheongromaine', [3, 4, 5, 8, 9], 0.6, 65, 260), seedling('cheongromaine', [4, 5, 9, 10], 9, 40, 400)],
    harvest: { itemId: 'crop_cheongromaine', nameKo: '청로메인 (1포기 · 약 300g)', nameEn: 'Green romaine (1 head, about 300g)', qtyPerCell: [8, 9], holdDays: 5 },
    price: { base: 1500, season: P_LETTUCE, volatility: 0.2 },
    noteKo: '잎이 곧게 서서 포기를 이룬다. 겉잎을 따지 않고 포기째 벤다. 아삭하고 단맛이 있어 샐러드용.',
    noteEn: 'Upright leaves form a head; cut whole rather than picking leaves. Crisp and slightly sweet — a salad lettuce.',
  },
  {
    id: 'jeokromaine', nameKo: '적로메인', nameEn: 'Red romaine (Jeokromaine)', category: 'leaf', speedClass: 'leafy', rarity: 'uncommon',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    starts: [seed('jeokromaine', [3, 4, 5, 8, 9], 0.58, 65, 280), seedling('jeokromaine', [4, 5, 9, 10], 9, 40, 420)],
    harvest: { itemId: 'crop_jeokromaine', nameKo: '적로메인 (1포기 · 약 300g)', nameEn: 'Red romaine (1 head, about 300g)', qtyPerCell: [8, 9], holdDays: 5 },
    price: { base: 1700, season: P_LETTUCE, volatility: 0.2 },
    noteKo: '잎이 적갈색으로 물든 로메인. 서늘할수록 색이 깊고, 더우면 녹색으로 돌아온다.',
    noteEn: 'Romaine with reddish-brown leaves. Cool weather deepens the colour; heat turns it back to green.',
  },
  {
    id: 'butterhead', nameKo: '버터헤드', nameEn: 'Butterhead lettuce', category: 'leaf', speedClass: 'leafy', rarity: 'uncommon',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    // 반결구 — 속잎이 버터처럼 부드럽다 · 포기 250g 안팎
    starts: [seed('butterhead', [3, 4, 5, 8, 9], 0.58, 65, 280), seedling('butterhead', [4, 5, 9, 10], 9, 40, 420)],
    harvest: { itemId: 'crop_butterhead', nameKo: '버터헤드 (1포기 · 약 250g)', nameEn: 'Butterhead (1 head, about 250g)', qtyPerCell: [8, 9], holdDays: 4 },
    price: { base: 1800, season: P_LETTUCE, volatility: 0.2 },
    noteKo: '속잎이 버터처럼 부드럽게 겹치는 반결구 상추. 잎이 연해 상하기 쉽고, 포기째 거둬 바로 판다.',
    noteEn: 'Semi-heading lettuce with soft, buttery inner leaves. Bruises easily — cut whole and sell soon.',
  },
  {
    id: 'perilla', nameKo: '깻잎', nameEn: 'Perilla leaves', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    starts: [seed('perilla', [4, 5], 0.7, 60, 200), seedling('perilla', [5, 6], 4, 35, 300)],
    harvest: { itemId: 'crop_perilla', nameKo: '깻잎 한 묶음 (20장)', nameEn: 'Perilla leaves, a bundle (20 leaves)', qtyPerCell: [2, 3], repeat: { everyDays: 5, times: 12 }, holdDays: 7 },
    price: { base: 800, season: P_PERILLA, volatility: 0.2 },
    // 284차 — 깻순(순지르기한 새순 — 관리 일 `pinch_tip`에서 나온다 · 들깨 밭에서도 같은 것) · 데쳐 볶는 나물
    byproducts: [{
      itemId: 'crop_perilla_shoot', nameKo: '깻순 한 줌 (100g)', nameEn: 'Perilla shoots, a handful (100g)', kind: 'food', at: 'care',
      price: 800, holdDays: 2, cookIngredient: 'namul', uses: ['cook', 'sell'],
      noteKo: '순지르기로 딴 들깨 새순. 살짝 데쳐 들기름에 볶으면 깻순나물 — 깻잎보다 연하고 향이 짙다.',
      noteEn: 'Perilla tips pinched out while training the plant. Blanched and stir-fried in perilla oil they make kkaesun namul — softer than the leaves, with a stronger scent.',
    }],
    noteKo: '들깨 한 포기에서 한여름 내내 잎을 딴다. 순을 지르면 곁가지가 늘어난다.',
    noteEn: 'One perilla plant gives leaves all summer. Pinch the tip and it branches out.',
  },
  {
    id: 'spinach', nameKo: '시금치', nameEn: 'Spinach', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 9, 10, 11], overwinter: true, water: 'mid',
    // 10a 975kg(1기작) → 칸당 약 1kg · 발아율 하한 65%(종자관리요강)
    starts: [seed('spinach', [3, 4, 9, 10], 0.65, 40, 250)],
    harvest: { itemId: 'crop_spinach', nameKo: '시금치 한 단 (200g)', nameEn: 'Spinach, a bunch (200g)', qtyPerCell: [3, 5], holdDays: 7 },
    price: { base: 1500, season: P_SPINACH, volatility: 0.3 },
    noteKo: '가을에 뿌린 시금치는 겨울을 넘기며 달아진다(월동 시금치).',
    noteEn: 'Spinach sown in autumn grows sweeter as it sits out the winter.',
  },
  {
    id: 'crown_daisy', nameKo: '쑥갓', nameEn: 'Crown daisy', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'mid',
    starts: [seed('crown_daisy', [3, 4, 5, 8, 9], 0.6, 40, 200)],
    harvest: { itemId: 'crop_crown_daisy', nameKo: '쑥갓 한 줌', nameEn: 'Crown daisy, a handful', qtyPerCell: [3, 4], repeat: { everyDays: 14, times: 2 }, holdDays: 6 },
    price: { base: 1000, season: P_LETTUCE, volatility: 0.2 }, cookIngredient: 'crown_daisy',
    noteKo: '원줄기를 베면 곁순이 다시 올라온다. 매운탕의 마지막 향.',
    noteEn: 'Cut the main stem and side shoots come back. The last fragrant touch on a spicy fish stew.',
  },
  {
    id: 'young_radish', nameKo: '열무', nameEn: 'Young summer radish', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10], water: 'high',
    starts: [seed('young_radish', [4, 5, 6, 7, 8, 9], 0.7, 28, 200)],
    harvest: { itemId: 'crop_young_radish', nameKo: '열무 한 단 (1kg)', nameEn: 'Young radish, a bunch (1kg)', qtyPerCell: [1, 2], holdDays: 5 },
    price: { base: 2500, season: P_YEOLMU, volatility: 0.25 },
    noteKo: '한 달이면 거두는 여름 김치 채소. 늦으면 질겨진다.',
    noteEn: 'A summer kimchi green ready in a month. Leave it late and it turns tough.',
  },
  {
    id: 'ugeolgari', nameKo: '얼갈이배추', nameEn: 'Ugeolgari cabbage', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 8, 9, 10], water: 'mid',
    starts: [seed('ugeolgari', [3, 4, 5, 8, 9], 0.7, 35, 200)],
    harvest: { itemId: 'crop_ugeolgari', nameKo: '얼갈이 한 단 (1kg)', nameEn: 'Ugeolgari, a bunch (1kg)', qtyPerCell: [1, 2], holdDays: 6 },
    price: { base: 2500, season: P_YEOLMU, volatility: 0.3 },
    noteKo: '속이 차기 전에 거두는 배추. 겉절이 · 된장국.',
    noteEn: 'Cabbage picked before the heart fills. For fresh kimchi and soybean-paste soup.',
  },
  {
    id: 'chive', nameKo: '부추', nameEn: 'Garlic chives', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 7, 8, 9, 10], perennial: true, water: 'mid',
    starts: [seed('chive', [3, 4, 5], 0.6, 80, 300), seedling('chive', [4, 5, 9], 1, 35, 2500, { labelKo: '부추 포기 모종 (1칸 분)', labelEn: 'Garlic chive clumps (one cell)' })],
    harvest: { itemId: 'crop_chive', nameKo: '부추 한 단 (250g)', nameEn: 'Garlic chives, a bunch (250g)', qtyPerCell: [2, 3], repeat: { everyDays: 25, times: 4 }, holdDays: 8 },
    price: { base: 1500, season: P_CHIVE, volatility: 0.2 },
    noteKo: '한 번 심으면 몇 해를 벤다. 베고 나면 3~4주에 다시 올라온다.',
    noteEn: 'Plant once and cut it for years. It grows back three to four weeks after each cut.',
  },
  {
    id: 'scallion', nameKo: '쪽파', nameEn: 'Scallion', category: 'bulb', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 8, 9, 10, 11], overwinter: true, water: 'mid',
    starts: [setOf('scallion', [8, 9], 0.9, 45, 2500, '쪽파 종구 (1칸 분)', 'Scallion bulbs (one cell)')],
    harvest: { itemId: 'crop_scallion', nameKo: '쪽파 한 단 (500g)', nameEn: 'Scallions, a bunch (500g)', qtyPerCell: [2, 3], repeat: { everyDays: 25, times: 1 }, holdDays: 10 },
    price: { base: 3500, season: P_SCALLION, volatility: 0.25 },
    noteKo: '늦여름에 종구를 심으면 김장철에 맞는다. 베어도 한 번 더 자란다.',
    noteEn: 'Plant the bulbs in late summer and they are ready for kimchi-making season. Cut once and it grows back again.',
  },
  {
    id: 'water_parsley', nameKo: '미나리', nameEn: 'Water parsley', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 9, 10, 11], perennial: true, water: 'high',
    starts: [setOf('water_parsley', [3, 4, 8, 9], 0.85, 45, 2000, '미나리 줄기 (1칸 분)', 'Water parsley cuttings (one cell)')],
    harvest: { itemId: 'crop_water_parsley', nameKo: '미나리 한 줌', nameEn: 'Water parsley, a handful', qtyPerCell: [3, 4], repeat: { everyDays: 30, times: 2 }, holdDays: 7 },
    price: { base: 1100, season: [0.96, 0.86, 0.81, 0.86, 0.96, 1.15, 1.24, 1.24, 1.05, 0.96, 0.96, 0.96], volatility: 0.2 }, cookIngredient: 'water_parsley',
    noteKo: '젖은 땅을 좋아한다. 줄기 마디를 꽂아 두면 뿌리를 내린다.',
    noteEn: 'Loves wet ground. Push a stem joint into the soil and it takes root.',
  },
  {
    id: 'mallow', nameKo: '아욱', nameEn: 'Curled mallow', category: 'leaf', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10], water: 'mid',
    starts: [seed('mallow', [3, 4, 5, 8, 9], 0.7, 40, 250)],
    harvest: { itemId: 'crop_mallow', nameKo: '아욱 한 단 (300g)', nameEn: 'Mallow, a bunch (300g)', qtyPerCell: [2, 3], repeat: { everyDays: 12, times: 3 }, holdDays: 6 },
    price: { base: 2000, season: P_LETTUCE, volatility: 0.15 },
    noteKo: '마트에서는 거의 안 보이는 국거리. 「가을 아욱국은 사립문 닫고 먹는다」.',
    noteEn: 'A soup green you almost never see in shops. "Autumn mallow soup is so good you shut the gate to eat it alone."',
  },
  {
    id: 'chard', nameKo: '근대', nameEn: 'Swiss chard', category: 'leaf', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10], water: 'mid',
    starts: [seed('chard', [3, 4, 5, 8, 9], 0.7, 50, 250)],
    harvest: { itemId: 'crop_chard', nameKo: '근대 한 단 (300g)', nameEn: 'Chard, a bunch (300g)', qtyPerCell: [2, 3], repeat: { everyDays: 7, times: 6 }, holdDays: 7 },
    price: { base: 2000, season: P_LETTUCE, volatility: 0.15 },
    noteKo: '더위에 강해 여름 내내 겉잎을 딴다. 된장국 거리.',
    noteEn: 'Takes the heat well, so you pick outer leaves all summer. For soybean-paste soup.',
  },
  {
    id: 'godeulppaegi', nameKo: '고들빼기', nameEn: 'Godeulppaegi', category: 'leaf', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [3, 4, 9, 10, 11], overwinter: true, water: 'low',
    starts: [seed('godeulppaegi', [9, 10], 0.5, 70, 400)],
    harvest: { itemId: 'crop_godeulppaegi', nameKo: '고들빼기 한 단 (300g)', nameEn: 'Godeulppaegi, a bunch (300g)', qtyPerCell: [1, 2], holdDays: 20 },
    price: { base: 4500, season: P_WILD, volatility: 0.15 }, rebalance: 0.9,
    noteKo: '쌉싸름한 김치 거리. 발아가 까다롭고 뿌리째 거둔다.',
    noteEn: 'A pleasantly bitter kimchi green. Fussy to germinate, harvested root and all.',
  },
  {
    id: 'bangpung', nameKo: '방풍나물', nameEn: 'Coastal hog fennel', category: 'leaf', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [3, 4, 5, 6], perennial: true, water: 'low',
    // 갯기름나물 — 바닷가 바위틈에서 자라는 봄나물. 바다 동네 텃밭에 어울린다
    starts: [seedling('bangpung', [3, 4, 9, 10], 6, 50, 700)],
    harvest: { itemId: 'crop_bangpung', nameKo: '방풍나물 한 단 (200g)', nameEn: 'Hog fennel, a bunch (200g)', qtyPerCell: [2, 3], repeat: { everyDays: 20, times: 2 }, holdDays: 10 },
    price: { base: 3500, season: P_WILD, volatility: 0.15 }, rebalance: 0.9,
    cookIngredient: 'namul',   // 284차 — 데쳐서 나물 볶음
    noteKo: '갯기름나물. 바닷바람을 맞는 자리에서 향이 짙다. 봄에 순을 꺾는다.',
    noteEn: 'A coastal herb that smells strongest where the sea wind hits it. Snap off the shoots in spring.',
  },

  // ═════ 산채 — 자격: 산채 재배 스킬 + 차광막 ═════
  {
    id: 'gomchwi', nameKo: '곰취', nameEn: 'Gomchwi (Ligularia)', category: 'wild', speedClass: 'leafy', rarity: 'rare',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7], perennial: true, water: 'high',
    requires: { skill: 'farm_wild', facility: 'shade' },
    // 차광 30~50% · 무가온 5~7월에 3번 · 특품 도매 4월 kg 1만원 안팎(임업관측)
    starts: [seedling('gomchwi', [3, 4, 10], 9, 45, 900)],
    harvest: { itemId: 'crop_gomchwi', nameKo: '곰취 한 묶음 (100g)', nameEn: 'Gomchwi, a bundle (100g)', qtyPerCell: [4, 6], repeat: { everyDays: 20, times: 2 }, holdDays: 10 },
    price: { base: 1100, season: P_WILD, volatility: 0.15 }, rebalance: 0.85,
    cookIngredient: 'namul',   // 284차 — 데쳐서 나물 볶음
    noteKo: '고랭지 그늘 산나물. 볕이 세면 잎이 탄다 — 차광막 아래에서만.',
    noteEn: 'A shade-loving highland green. Strong sun scorches the leaves — grows only under a shade net.',
  },
  {
    id: 'myeongi', nameKo: '산마늘', nameEn: 'Alpine leek (myeongi)', category: 'wild', speedClass: 'leafy', rarity: 'rare',
    inMart: false, site: 'plot', growMonths: [3, 4, 5], perennial: true, water: 'mid',
    requires: { skill: 'farm_wild', facility: 'shade' },
    // 씨에서 4~5년 → 2~3년생 모종으로 시작 · 4월 초~중순 2주 수확 · 포기당 잎 한 장은 남긴다
    starts: [seedling('myeongi', [3, 9, 10], 16, 40, 1200)],
    harvest: { itemId: 'crop_myeongi', nameKo: '산마늘 잎 한 묶음 (100g)', nameEn: 'Alpine leek leaves, a bundle (100g)', qtyPerCell: [6, 9], holdDays: 14 },
    price: { base: 1500, season: P_WILD, volatility: 0.12 }, rebalance: 0.8,
    noteKo: '명이나물. 울릉 · 강원 고지대 산채. 씨부터면 4년 — 모종도 한 해를 기다린다.',
    noteEn: 'A wild green from the Ulleung and Gangwon highlands. Four years from seed — even seedlings need a year.',
  },
  {
    id: 'samnamul', nameKo: '눈개승마', nameEn: 'Goat\'s beard shoots (samnamul)', category: 'wild', speedClass: 'leafy', rarity: 'very_rare',
    inMart: false, site: 'plot', growMonths: [4, 5], perennial: true, water: 'mid',
    requires: { skill: 'farm_wild', facility: 'shade' },
    starts: [seedling('samnamul', [3, 4, 10], 4, 50, 2500)],
    harvest: { itemId: 'crop_samnamul', nameKo: '눈개승마 한 묶음 (100g)', nameEn: 'Samnamul, a bundle (100g)', qtyPerCell: [3, 5], holdDays: 10 },
    price: { base: 3500, season: P_WILD, volatility: 0.1 }, rebalance: 0.7,
    cookIngredient: 'namul',   // 284차 — 데쳐서 나물 볶음
    noteKo: '삼나물. 울릉도에서 처음 길러 낸 산채로 다른 나물보다 두세 배 비싸다.',
    noteEn: 'A mountain green first farmed on Ulleungdo, two or three times the price of other greens.',
  },
  {
    id: 'eosuri', nameKo: '어수리', nameEn: 'Eosuri (Heracleum)', category: 'wild', speedClass: 'leafy', rarity: 'rare',
    inMart: false, site: 'plot', growMonths: [3, 4, 5, 6], perennial: true, water: 'mid',
    requires: { skill: 'farm_wild', facility: 'shade' },
    starts: [seedling('eosuri', [3, 4, 10], 4, 45, 1200)],
    harvest: { itemId: 'crop_eosuri', nameKo: '어수리 한 묶음 (100g)', nameEn: 'Eosuri, a bundle (100g)', qtyPerCell: [1, 2], repeat: { everyDays: 25, times: 1 }, holdDays: 10 },
    price: { base: 2000, season: P_WILD, volatility: 0.12 }, rebalance: 0.85,
    cookIngredient: 'namul',   // 284차 — 데쳐서 나물 볶음
    noteKo: '해발 700m 위에서 자라던 산나물. 2년생 모종으로 시작한다.',
    noteEn: 'A green that grew wild above 700m. Start it from two-year-old seedlings.',
  },
  {
    id: 'bujigaengi', nameKo: '부지깽이', nameEn: 'Ulleung aster (bujigaengi)', category: 'wild', speedClass: 'leafy', rarity: 'rare',
    inMart: false, site: 'plot', growMonths: [3, 4, 5, 6], perennial: true, water: 'mid',
    requires: { skill: 'farm_wild' },
    starts: [seedling('bujigaengi', [3, 4, 9], 6, 40, 800)],
    harvest: { itemId: 'crop_bujigaengi', nameKo: '부지깽이 한 묶음 (100g)', nameEn: 'Bujigaengi, a bundle (100g)', qtyPerCell: [3, 4], repeat: { everyDays: 20, times: 1 }, holdDays: 10 },
    price: { base: 1100, season: P_WILD, volatility: 0.12 }, rebalance: 0.9,
    cookIngredient: 'namul',   // 284차 — 데쳐서 나물 볶음
    noteKo: '섬쑥부쟁이. 울릉도 봄나물 — 차광 없이도 자란다.',
    noteEn: 'An island aster, a spring green from Ulleungdo — grows without shade.',
  },
  {
    id: 'dureup', nameKo: '두릅', nameEn: 'Fatsia shoots (dureup)', category: 'wild', speedClass: 'seasonal', rarity: 'rare',
    inMart: false, site: 'plot', growMonths: [4, 5], perennial: true, water: 'low',
    requires: { skill: 'farm_wild' },
    // 1년생 묘목 · 정아와 첫 곁눈만 딴다(두 번) · 도매 3월 말 kg 3~4만원
    starts: [seedling('dureup', [3, 4, 11], 1, 55, 6000, { labelKo: '두릅 묘목 (1그루)', labelEn: 'Fatsia sapling (one tree)' })],
    harvest: { itemId: 'crop_dureup', nameKo: '두릅 한 묶음 (250g)', nameEn: 'Dureup, a bundle (250g)', qtyPerCell: [1, 1], repeat: { everyDays: 7, times: 1 }, holdDays: 5 },
    price: { base: 7500, season: [1.14, 1.14, 1.04, 0.95, 0.81, 0.95, 0.95, 0.95, 0.95, 0.95, 1.04, 1.14], volatility: 0.15 }, rebalance: 0.8,
    noteKo: '나무 끝 새순. 순 길이 12~15cm에 딴다 — 너무 따면 나무가 약해진다.',
    noteEn: 'The new shoots at the tip of the tree. Pick them at 12-15cm — take too many and the tree weakens.',
  },
  {
    id: 'wasabi', nameKo: '고추냉이', nameEn: 'Wasabi', category: 'root', speedClass: 'seasonal', rarity: 'very_rare',
    inMart: false, site: 'plot', growMonths: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12], water: 'high',
    requires: { skill: 'farm_hydro', facility: 'coldWater' },
    // 8~20℃ 맑은 흐르는 물 · 정식 후 근경까지 18~20개월 · 잎은 반년이면 딴다 · 근경 kg 10~20만원
    starts: [seedling('wasabi', [3, 4, 9, 10], 9, 520, 2500)],
    harvest: { itemId: 'crop_wasabi_root', nameKo: '고추냉이 근경 (1뿌리 · 약 80g)', nameEn: 'Wasabi rhizome (one, about 80g)', qtyPerCell: [6, 9], holdDays: 60 },
    interim: {
      itemId: 'crop_wasabi_leaf', labelKo: '고추냉이 잎 한 묶음 (100g)', labelEn: 'Wasabi leaves, a bundle (100g)',
      window: [0.3, 0.9], qtyPerCell: [2, 3], mainYieldMult: 0.97, price: 1500, inMart: false,
    },
    price: { base: 9000, season: P_FLAT, volatility: 0.08 }, rebalance: 0.6,
    noteKo: '찬 지하수가 흐르는 자갈밭에서만. 근경은 1년 반을 기다려야 한다.',
    noteEn: 'Grows only in gravel beds with cold groundwater running through. The root takes a year and a half.',
  },

  // ═════ 열매 (철 작물 — 시설 상한 ×1.4) ═════
  {
    id: 'chili', nameKo: '고추', nameEn: 'Chili pepper', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], water: 'mid',
    // 주간 40cm 안팎 → 칸당 3포기 · 7~9월 일주일마다 · 따지 않고 두면 붉어진다(4일부터 검붉게 · 10일이면 홍고추)
    // 238차 — 씨앗은 밭에 바로 뿌리지 않는다: 2~3월 따뜻한 실내 육묘 트레이에 뿌려 70~90일(75일) 기르면 모종 20~30포기 ·
    //   모종은 늦서리 뒤 4월 하순~5월 상순에 옮겨 심는다(`frostBlockKo`). 포기당 한 번에 6~9개.
    starts: [
      seed('chili', [2, 3], 0.65, 75, 300, { nursery: { seedlings: [20, 30], seedlingItemId: 'sdl_chili' } }),
      seedling('chili', [4, 5], 3, 60, 500),
    ],
    harvest: {
      itemId: 'crop_chili_green', nameKo: '풋고추 (1개)', nameEn: 'Green chili (one)', qtyPerCell: [18, 28], repeat: { everyDays: 7, times: 10 }, holdDays: 10,
      ripenTo: { itemId: 'crop_chili_red', nameKo: '홍고추 (1개)', nameEn: 'Red chili (one)', afterDays: 10, price: 140, cookIngredient: 'chili_red', turningDays: 4 },
    },
    interim: {
      itemId: 'crop_pepper_leaf', labelKo: '고춧잎 한 줌 (100g)', labelEn: 'Chili leaves, a handful (100g)',
      window: [0.5, 1.0], qtyPerCell: [2, 3], mainYieldMult: 0.97, price: 1200, inMart: false, cookIngredient: 'namul',   // 284차 — 고춧잎나물
    },
    price: { base: 120, season: P_CHILI, volatility: 0.25 }, cookIngredient: 'chili_green',
    noteKo: '씨앗은 2월 따뜻한 실내 트레이에 뿌려 모종을 키우고, 모종은 늦서리가 끝난 4월 하순~5월 상순에 옮겨 심는다. 끝물에 잎을 훑어 고춧잎 나물을 한다.',
    noteEn: 'Sow seed in a warm indoor tray in February to raise seedlings; transplant after the last frost, late April to early May. Strip the leaves at season end for seasoned pepper greens.',
  },
  {
    id: 'cherry_tomato', nameKo: '방울토마토', nameEn: 'Cherry tomato', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    starts: [seedling('cherry_tomato', [4, 5], 2, 60, 1000)],
    // 243차 — 한 알씩 딴다(약 12.5g) · 스무 알을 용기에 담으면 한 팩(250g)
    harvest: { itemId: 'crop_cherry_tomato', nameKo: '방울토마토 (1개)', nameEn: 'Cherry tomato (one)', qtyPerCell: [40, 80], repeat: { everyDays: 6, times: 10 }, holdDays: 5,
      pack: { itemId: 'crop_cherry_tomato_pack', nameKo: '방울토마토 한 팩 (250g)', nameEn: 'Cherry tomatoes, a pack (250g)', units: 20 } },
    price: { base: 125, season: P_CHERRY_TOMATO, volatility: 0.2 },
    noteKo: '곁순을 따 주면 열매가 굵다. 한 포기 3~4kg.',
    noteEn: 'Pinch out the side shoots and the fruit grows bigger. 3-4kg per plant.',
  },
  {
    id: 'cucumber', nameKo: '오이', nameEn: 'Cucumber', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'high',
    // 이랑 150~180cm 두 줄 · 주간 35~40cm → 칸당 2포기 · 2~3일마다
    starts: [seed('cucumber', [5], 0.75, 60, 300), seedling('cucumber', [4, 5], 2, 40, 800)],
    harvest: { itemId: 'crop_cucumber', nameKo: '오이 (1개)', nameEn: 'Cucumber (one)', qtyPerCell: [4, 6], repeat: { everyDays: 3, times: 12 }, holdDays: 3 },
    price: { base: 800, season: P_CUCUMBER, volatility: 0.25 },
    noteKo: '하루 이틀만 늦어도 늙은 오이가 된다.',
    noteEn: 'Leave it a day or two too long and it becomes an old yellow cucumber.',
  },
  {
    id: 'zucchini', nameKo: '애호박', nameEn: 'Korean zucchini', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    starts: [seedling('zucchini', [4, 5], 1, 45, 1000)],
    harvest: { itemId: 'crop_zucchini', nameKo: '애호박 (1개)', nameEn: 'Zucchini (one)', qtyPerCell: [2, 3], repeat: { everyDays: 4, times: 10 }, holdDays: 4 },
    interim: {
      itemId: 'crop_pumpkin_leaf', labelKo: '호박잎 한 묶음 (20장)', labelEn: 'Pumpkin leaves, a bundle (20)',
      window: [0.5, 1.0], qtyPerCell: [1, 2], mainYieldMult: 1.0, price: 1500, inMart: false,
    },
    price: { base: 1500, season: P_ZUCCHINI, volatility: 0.3 },
    noteKo: '덩굴이 뻗으면 잎을 쪄서 쌈으로. 장마 뒤에 값이 뛴다.',
    noteEn: 'Once the vines spread, steam the leaves for wraps. Prices jump after the rainy season.',
  },
  {
    id: 'eggplant', nameKo: '가지', nameEn: 'Eggplant', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    starts: [seedling('eggplant', [5], 2, 55, 800)],
    harvest: { itemId: 'crop_eggplant', nameKo: '가지 (1개)', nameEn: 'Eggplant (one)', qtyPerCell: [3, 4], repeat: { everyDays: 6, times: 10 }, holdDays: 6 },
    price: { base: 900, season: P_EGGPLANT, volatility: 0.2 },
    noteKo: '첫 꽃 아래 곁순은 다 딴다. 더위에 강하다.',
    noteEn: 'Remove every side shoot below the first flower. Handles heat well.',
  },
  {
    id: 'corn', nameKo: '찰옥수수', nameEn: 'Waxy corn', category: 'grain', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    // 70×30cm → 칸당 4~5포기 · 상품 이삭은 포기의 6할 남짓(10a 2,796이삭 — 2024 소득조사) · 미끼(감성돔 옥수수)로도 쓴다
    starts: [seed('corn', [4, 5, 6], 0.75, 90, 400), seedling('corn', [5], 4, 70, 300)],
    harvest: { itemId: 'crop_corn', nameKo: '찰옥수수 (1자루)', nameEn: 'Waxy corn (one ear)', qtyPerCell: [2, 4], holdDays: 7 },
    price: { base: 1000, season: P_CORN, volatility: 0.2 },
    byproducts: [residue('res_corn_stalk', 'harvest', [1200, 2400])],   // 284차 — 옥수숫대(포기당 0.5~1kg 생체 · 추정)
    noteKo: '수염이 갈색으로 마르면 거둔다. 삶은 알갱이는 감성돔 미끼가 된다.',
    noteEn: 'Harvest when the silk dries brown. Boiled kernels make bait for black sea bream.',
  },
  {
    id: 'bitter_melon', nameKo: '여주', nameEn: 'Bitter melon', category: 'fruit', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [6, 7, 8, 9], water: 'mid',
    starts: [seedling('bitter_melon', [5], 1, 60, 1500)],
    harvest: { itemId: 'crop_bitter_melon', nameKo: '여주 (1개)', nameEn: 'Bitter melon (one)', qtyPerCell: [2, 3], repeat: { everyDays: 7, times: 8 }, holdDays: 5 },
    price: { base: 1500, season: P_CUCUMBER, volatility: 0.15 },
    noteKo: '쓴맛이 약이 된다는 덩굴 열매. 그늘막처럼 키운다.',
    noteEn: 'A vine fruit whose bitterness is said to be good for you. Grow it like a living sunshade.',
  },
  {
    id: 'okra', nameKo: '오크라', nameEn: 'Okra', category: 'fruit', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [6, 7, 8, 9], water: 'mid',
    starts: [seedling('okra', [5], 3, 55, 1200)],
    harvest: { itemId: 'crop_okra', nameKo: '오크라 한 줌 (10개)', nameEn: 'Okra, a handful (10 pods)', qtyPerCell: [1, 2], repeat: { everyDays: 3, times: 15 }, holdDays: 3 },
    price: { base: 3000, season: P_CUCUMBER, volatility: 0.15 }, rebalance: 0.9,
    noteKo: '손가락 길이일 때 딴다. 이틀만 늦어도 섬유질이 된다.',
    noteEn: 'Pick the pods at finger length. Two days late and they turn woody.',
  },

  // ═════ 뿌리 · 덩이 · 비늘줄기 ═════
  {
    id: 'potato', nameKo: '감자', nameEn: 'Potato', category: 'tuber', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 8, 9, 10, 11], water: 'mid',
    // 씨감자 1칸 분(약 200g · 5조각) → 약 2kg(1:10) · 봄감자 3월 · 가을감자 8월
    starts: [setOf('potato', [3, 4, 8], 0.9, 100, 800, '씨감자 (1칸 분 · 200g)', 'Seed potatoes (one cell, 200g)')],
    harvest: { itemId: 'crop_potato', nameKo: '감자 1kg', nameEn: 'Potatoes 1kg', qtyPerCell: [2, 3], holdDays: 20 },
    price: { base: 4000, season: P_POTATO, volatility: 0.25 },
    noteKo: '하지 무렵 잎이 누렇게 지면 캔다. 씨감자 한 조각에 눈 두 개.',
    noteEn: 'Dig them up around midsummer when the leaves yellow. Two eyes to each seed-potato piece.',
  },
  {
    id: 'sweet_potato', nameKo: '고구마', nameEn: 'Sweet potato', category: 'tuber', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], water: 'low',
    // 순 1개 → 0.4~0.5kg(10a 1,686kg — 2024 소득조사) · 한여름에 순을 끊어 고구마순 나물(본 수확 조금 준다)
    starts: [setOf('sweet_potato', [5, 6], 0.9, 120, 1200, '고구마순 (1칸 분 · 4줄기)', 'Sweet potato slips (one cell, 4)')],
    harvest: { itemId: 'crop_sweet_potato', nameKo: '고구마 1kg', nameEn: 'Sweet potatoes 1kg', qtyPerCell: [1, 3], holdDays: 20 },
    interim: {
      // 284차 — 시장 이름 「고구마줄기」(고구마순과 같은 것 — 심는 순과 헷갈리지 않게) · 생선조림 바닥 · 나물 볶음
      itemId: 'crop_sweetpotato_stem', labelKo: '고구마줄기 한 단 (300g)', labelEn: 'Sweet potato stems, a bunch (300g)',
      window: [0.4, 0.8], qtyPerCell: [2, 3], mainYieldMult: 0.95, price: 2500, inMart: false, cookIngredient: 'sweetpotato_stem',
    },
    price: { base: 5000, season: P_SWEETPOTATO, volatility: 0.2 },
    noteKo: '서리 오기 전에 캔다. 줄기는 껍질을 벗겨 나물로 볶는다.',
    noteEn: 'Dig them before the frost. Peel the stems and stir-fry them as greens.',
  },
  {
    id: 'radish', nameKo: '김장무', nameEn: 'Autumn radish', category: 'root', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [8, 9, 10, 11], water: 'mid',
    // 한 구멍 3~4알 → 솎아 한 포기 · 10a 5~6t → 칸당 1.2kg 무 4~6개
    starts: [seed('radish', [8, 9], 0.7, 75, 300)],
    harvest: { itemId: 'crop_radish', nameKo: '무 (1개 · 약 1.2kg)', nameEn: 'Radish (one, about 1.2kg)', qtyPerCell: [4, 6], holdDays: 20 },
    interim: {
      itemId: 'crop_thinned_radish', labelKo: '솎음무 한 줌 (300g)', labelEn: 'Thinned radish, a handful (300g)',
      window: [0.18, 0.45], qtyPerCell: [1, 2], mainYieldMult: 1.0, price: 1200, seedOnly: true, inMart: false,
    },
    price: { base: 2000, season: P_RADISH, volatility: 0.35 }, cookIngredient: 'radish',
    // 284차 — 무청(무 한 개에 한 묶음 300~500g · 데치면 시래기 — 조사: 생무청 10kg → 시래기 1kg · 시래기 고등어조림)
    byproducts: [{
      itemId: 'crop_radish_greens', nameKo: '무청 한 묶음 (약 400g)', nameEn: 'Radish greens, a bunch (about 400g)', kind: 'food', at: 'harvest',
      perUnit: 1, price: 500, holdDays: 3, cookIngredient: 'siraegi', uses: ['cook', 'sell'],
      noteKo: '무에 달린 잎줄기. 데치면 시래기다 — 생선조림 바닥에 깔고 나물로 볶는다. 말리면 열에 하나로 준다.',
      noteEn: 'The leafy tops of the radish. Blanched, they become siraegi — laid under braised fish or stir-fried as greens. Dried, they shrink to a tenth.',
    }],
    noteKo: '처서 무렵 뿌린다. 솎은 어린 무는 열무처럼 먹는다.',
    noteEn: 'Sow in late August. Eat the thinned young radishes like summer radish greens.',
  },
  {
    id: 'napa_cabbage', nameKo: '김장배추', nameEn: 'Napa cabbage', category: 'leaf', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [8, 9, 10, 11], water: 'high',
    // 60×40cm → 칸당 3포기 · 포기 2~3kg · 2024 가을 금배추(도매 1만원대)
    starts: [seed('napa_cabbage', [8], 0.75, 95, 300), seedling('napa_cabbage', [8, 9], 3, 70, 500)],
    harvest: { itemId: 'crop_napa_cabbage', nameKo: '배추 (1통 · 약 2.5kg)', nameEn: 'Napa cabbage (one head, about 2.5kg)', qtyPerCell: [2, 3], holdDays: 25 },
    interim: {
      itemId: 'crop_thinned_cabbage', labelKo: '솎음배추 한 줌 (300g)', labelEn: 'Thinned cabbage, a handful (300g)',
      window: [0.15, 0.4], qtyPerCell: [1, 2], mainYieldMult: 1.0, price: 1200, seedOnly: true, inMart: false,
    },
    price: { base: 4000, season: P_CABBAGE, volatility: 0.45 },
    // 284차 — 겉잎(통에서 다듬어 내는 억센 잎 · 데치면 우거지 — 우거지 코다리조림 · 해장국)
    byproducts: [{
      itemId: 'crop_cabbage_outer', nameKo: '배추 겉잎 (우거지감 · 약 300g)', nameEn: 'Outer cabbage leaves (for ugeoji, about 300g)', kind: 'food', at: 'harvest',
      perUnit: 1, price: 400, holdDays: 4, cookIngredient: 'ugeoji', uses: ['cook', 'sell'],
      noteKo: '배추를 다듬으며 떼어 낸 바깥 억센 잎. 데치면 우거지 — 생선조림에 얹으면 비린 맛을 잡는다.',
      noteEn: 'The tough outer leaves trimmed off the head. Blanched, they are ugeoji — laid over braised fish they take the fishiness away.',
    }],
    noteKo: '입동 무렵 속이 차면 김장. 날씨 따라 값이 몇 배로 뛴다.',
    noteEn: 'When the hearts fill in early November, it is kimchi-making time. Bad weather can multiply the price.',
  },
  {
    id: 'carrot', nameKo: '당근', nameEn: 'Carrot', category: 'root', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [7, 8, 9, 10, 11], water: 'mid',
    starts: [seed('carrot', [7, 8], 0.55, 100, 300)],
    harvest: { itemId: 'crop_carrot', nameKo: '당근 (1개 · 약 200g)', nameEn: 'Carrot (one, about 200g)', qtyPerCell: [14, 20], holdDays: 25 },
    price: { base: 600, season: P_CARROT, volatility: 0.25 }, cookIngredient: 'carrot',
    noteKo: '발아가 더디다 — 흙이 마르지 않게 덮어 둔다.',
    noteEn: 'Slow to germinate — keep the soil covered so it never dries out.',
  },
  {
    id: 'garlic', nameKo: '마늘', nameEn: 'Garlic', category: 'bulb', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 10, 11], overwinter: true, water: 'low',
    // 종구 1칸 분(40쪽) → 통마늘 30~36통(1:6~7) · 5월 마늘종을 뽑아 주면 통이 굵어진다
    starts: [setOf('garlic', [10, 11], 0.9, 165, 3000, '마늘 종구 (1칸 분 · 40쪽)', 'Seed garlic (one cell, 40 cloves)')],
    harvest: { itemId: 'crop_garlic', nameKo: '통마늘 (1통 · 약 50g)', nameEn: 'Garlic bulb (one, about 50g)', qtyPerCell: [30, 36], holdDays: 20 },
    interim: {
      itemId: 'crop_garlic_scape', labelKo: '마늘종 한 단 (300g)', labelEn: 'Garlic scapes, a bunch (300g)',
      window: [0.78, 0.93], qtyPerCell: [1, 2], mainYieldMult: 1.05, price: 2500, inMart: false, cookIngredient: 'namul',   // 284차 — 마늘종볶음
    },
    price: { base: 600, season: P_GARLIC, volatility: 0.2 }, cookIngredient: 'garlic',
    noteKo: '가을에 심어 겨울을 나고 하지에 캔다. 마늘종은 5월 잠깐.',
    noteEn: 'Plant in autumn, let it winter over, dig it up at midsummer. Garlic scapes come for a short while in May.',
  },
  {
    id: 'onion', nameKo: '양파', nameEn: 'Onion', category: 'bulb', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 10, 11], overwinter: true, water: 'mid',
    starts: [seedling('onion', [10, 11], 25, 160, 80, { establish: 0.88, labelKo: '양파 모종 (1포기)', labelEn: 'Onion seedling (one)' })],
    harvest: { itemId: 'crop_onion', nameKo: '양파 (1개 · 약 250g)', nameEn: 'Onion (one, about 250g)', qtyPerCell: [22, 26], holdDays: 25 },
    price: { base: 600, season: P_ONION, volatility: 0.25 }, cookIngredient: 'onion',
    noteKo: '늦가을 모종을 내 겨울을 나게 한다. 잎이 쓰러지면 거둘 때.',
    noteEn: 'Set out seedlings in late autumn to winter over. When the tops fall over, it is ready.',
  },
  {
    id: 'leek', nameKo: '대파', nameEn: 'Green onion', category: 'bulb', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10, 11], water: 'mid',
    starts: [seedling('leek', [4, 5, 6], 15, 90, 100, { establish: 0.88, labelKo: '대파 모종 (1포기)', labelEn: 'Green onion seedling (one)' })],
    harvest: { itemId: 'crop_leek', nameKo: '대파 (1대)', nameEn: 'Green onion (one stalk)', qtyPerCell: [12, 15], holdDays: 40 },
    price: { base: 400, season: P_LEEK, volatility: 0.35 }, cookIngredient: 'leek',
    noteKo: '흙을 북돋워 흰 대를 길게 키운다. 2021년 「파테크」 때는 한 단 7천원.',
    noteEn: 'Hill up the soil to grow long white stalks. In the 2021 green-onion price spike a bunch cost 7,000 won.',
  },
  {
    id: 'taro', nameKo: '토란', nameEn: 'Taro', category: 'tuber', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], water: 'high',
    starts: [setOf('taro', [4, 5], 0.85, 150, 2500, '종토란 (1칸 분)', 'Seed taro (one cell)')],
    harvest: { itemId: 'crop_taro', nameKo: '토란 1kg', nameEn: 'Taro 1kg', qtyPerCell: [1, 2], holdDays: 25 },
    price: { base: 6000, season: [1.02, 1.02, 1.02, 1.02, 1.02, 1.02, 0.93, 1.02, 1.21, 0.93, 0.84, 0.93], volatility: 0.15 },
    // 284차 — 토란대(잎자루 — 조사: 10a 엽병 100~310kg : 덩이 730~1,680kg → 덩이의 14~18%). 옥살산칼슘 — 장갑 · 푹 삶기
    byproducts: [{
      itemId: 'crop_taro_stem', nameKo: '토란대 한 묶음 (300g)', nameEn: 'Taro stems, a bunch (300g)', kind: 'food', at: 'harvest',
      perCell: [0.6, 1.2], price: 1500, holdDays: 5, cookIngredient: 'taro_stem', uses: ['cook', 'sell'],
      noteKo: '토란 잎자루. 맨손으로 만지면 가렵다 — 장갑을 끼고 껍질을 벗겨 푹 삶는다. 들깨가루에 볶으면 토란대나물.',
      noteEn: 'The leaf stalks of taro. Bare hands itch — peel them with gloves on and boil them well. Stir-fried with perilla powder, they make taro-stem namul.',
    }],
    noteKo: '추석 토란국. 잎이 우산만큼 큰 물 좋아하는 덩이.',
    noteEn: 'For Chuseok taro soup. A water-loving tuber with leaves as big as umbrellas.',
  },
  {
    id: 'yacon', nameKo: '야콘', nameEn: 'Yacon', category: 'tuber', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], water: 'mid',
    // 4월 중하순 정식 적기 · 포기당 괴근 1~1.2kg(제주 시험) · 국내 육성 품종 없음
    starts: [seedling('yacon', [4, 5], 2, 170, 1500)],
    harvest: { itemId: 'crop_yacon', nameKo: '야콘 1kg', nameEn: 'Yacon 1kg', qtyPerCell: [2, 3], holdDays: 25 },
    price: { base: 4000, season: P_SWEETPOTATO, volatility: 0.15 },
    noteKo: '배처럼 아삭한 안데스 덩이뿌리. 서리 맞기 전에 캔다.',
    noteEn: 'An Andean root as crisp as a pear. Dig it before the frost.',
  },
  {
    id: 'choseokjam', nameKo: '초석잠', nameEn: 'Chinese artichoke', category: 'tuber', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10, 11], water: 'mid',
    // 4월 20일 정식이 10a 654kg(경남농기원) → 칸당 약 650g
    starts: [setOf('choseokjam', [3, 4], 0.85, 190, 2000, '초석잠 종근 (1칸 분)', 'Chinese artichoke tubers (one cell)')],
    harvest: { itemId: 'crop_choseokjam', nameKo: '초석잠 500g', nameEn: 'Chinese artichoke 500g', qtyPerCell: [1, 2], holdDays: 30 },
    price: { base: 6000, season: P_FLAT, volatility: 0.12 }, rebalance: 0.9,
    noteKo: '누에 모양 덩이줄기. 장아찌로 먹는다.',
    noteEn: 'Tubers shaped like silkworms. Eaten pickled.',
  },
  {
    id: 'jerusalem', nameKo: '돼지감자', nameEn: 'Jerusalem artichoke', category: 'tuber', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10, 11], perennial: true, water: 'low',
    starts: [setOf('jerusalem', [3, 4, 5], 0.9, 180, 1500, '돼지감자 종괴 (1칸 분)', 'Jerusalem artichoke tubers (one cell)')],
    harvest: { itemId: 'crop_jerusalem', nameKo: '돼지감자 1kg', nameEn: 'Jerusalem artichoke 1kg', qtyPerCell: [2, 3], holdDays: 30 },
    price: { base: 3000, season: P_FLAT, volatility: 0.12 },
    noteKo: '뚱딴지. 캐다 남은 덩이에서 이듬해 또 난다.',
    noteEn: 'Any tubers you miss come up again the next year.',
  },
  {
    id: 'ginger', nameKo: '생강', nameEn: 'Ginger', category: 'tuber', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], water: 'mid',
    // 60×25cm → 칸당 6~7포기 · 10a 1,873kg(2024 소득조사) → 칸당 약 1.9kg
    starts: [setOf('ginger', [4, 5], 0.8, 170, 2500, '종강 (1칸 분)', 'Seed ginger (one cell)')],
    harvest: { itemId: 'crop_ginger', nameKo: '생강 500g', nameEn: 'Ginger 500g', qtyPerCell: [3, 5], holdDays: 25 },
    price: { base: 5000, season: P_GINGER, volatility: 0.15 }, cookIngredient: 'ginger',
    noteKo: '따뜻해야 싹이 튼다. 서리 전에 캔다.',
    noteEn: 'Needs warmth to sprout. Dig it before the frost.',
  },

  // ═════ 곡식 · 콩 ═════
  {
    id: 'barley', nameKo: '보리', nameEn: 'Barley', category: 'grain', speedClass: 'seasonal', rarity: 'common',
    inMart: false, site: 'plot', growMonths: [3, 4, 5, 6, 10, 11], overwinter: true, water: 'low',
    // 10a 400~500kg → 칸당 약 0.45kg · 압맥(눌린 보리)으로 밑밥에 넣는다
    starts: [seed('barley', [10, 11], 0.85, 150, 300)],
    // 284차 — 털어 낸 낟알은 g으로 센다(사용자 「상품성을 지니는 수준을 중량으로」) · 1kg 봉지로 판다 · 보릿짚은 짚 덮기 · 밭에 넣기
    harvest: { itemId: 'crop_barley', nameKo: '보리 낟알', nameEn: 'Barley grain', qtyPerCell: [400, 500], holdDays: 15, unitG: 1,
      bags: [{ itemId: 'crop_barley_b1000', nameKo: '보리 한 봉지 (1kg)', nameEn: 'Barley, a bag (1kg)', grams: 1000 }] },
    price: { base: 3, season: P_FLAT, volatility: 0.1 },
    byproducts: [residue('res_barley_straw', 'process', [420, 600]), chaff(0.15)],   // 284차 — 보릿짚(수확지수 0.46~0.54) · 까락 · 겨 검불
    noteKo: '가을에 뿌려 겨울을 나고 6월에 벤다. 눌러 압맥을 만들면 밑밥 재료.',
    noteEn: 'Sow in autumn, let it winter over, cut it in June. Rolled barley goes into groundbait.',
  },
  {
    id: 'soybean', nameKo: '콩', nameEn: 'Soybean', category: 'legume', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [6, 7, 8, 9, 10], water: 'low',
    // 10a 200~250kg → 칸당 약 220g · 직접 키운 백태로 콩나물을 앉힐 수 있다
    starts: [seed('soybean', [5, 6], 0.75, 120, 300)],
    // 284차 — g으로 센다 · 500g · 1kg 봉지로 판다
    harvest: { itemId: 'crop_soybean', nameKo: '콩 (백태)', nameEn: 'Soybeans', qtyPerCell: [180, 250], holdDays: 20, unitG: 1,
      bags: [
        { itemId: 'crop_soybean_b500', nameKo: '콩 한 봉지 (500g)', nameEn: 'Soybeans, a bag (500g)', grams: 500 },
        { itemId: 'crop_soybean_b1000', nameKo: '콩 한 봉지 (1kg)', nameEn: 'Soybeans, a bag (1kg)', grams: 1000 },
      ] },
    price: { base: 8, season: P_PULSE, volatility: 0.1 },
    byproducts: [residue('res_bean_stalk', 'process', [160, 330]), chaff(0.2)],   // 284차 — 콩대 · 깍지(수확지수 0.38~0.56)
    noteKo: '꼬투리가 누렇게 마르면 거둔다. 콩나물 시루에도 앉힌다.',
    noteEn: 'Harvest when the pods dry yellow. They also go into the sprouting jar.',
  },
  // 247차 — 깨(사용자 「깻잎 수확과 별도로 '깨'는 베고, 말리고, 털어야 함」) — 거두면 칸에 베어 말린 뒤 털고 키질한다(`CropCultivation.process`)
  {
    id: 'deulkkae', nameKo: '들깨', nameEn: 'Perilla (deulkkae)', category: 'grain', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [6, 7, 8, 9, 10], water: 'mid',
    // 씨용 들깨 — 6월 중순 파종 · 이식(적기 — 너무 이르면 웃자라 쓰러진다) → 10월 초중순 베기. 10a 70~100kg → 칸당 약 100g
    starts: [seed('deulkkae', [6], 0.75, 115, 300), seedling('deulkkae', [6, 7], 4, 95, 200)],
    // 284차 — 털어 낸 깨는 g으로 센다 · 500g · 1kg 봉지로 판다 · 방앗간에서 들기름(350ml ≈ 950g) · 들깨가루
    harvest: { itemId: 'crop_deulkkae', nameKo: '들깨', nameEn: 'Perilla seeds', qtyPerCell: [80, 120], holdDays: 10, unitG: 1,
      bags: [
        { itemId: 'crop_deulkkae_b500', nameKo: '들깨 한 봉지 (500g)', nameEn: 'Perilla seeds, a bag (500g)', grams: 500 },
        { itemId: 'crop_deulkkae_b1000', nameKo: '들깨 한 봉지 (1kg)', nameEn: 'Perilla seeds, a bag (1kg)', grams: 1000 },
      ] },
    price: { base: 18, season: P_PULSE, volatility: 0.12 },
    byproducts: [residue('res_sesame_stalk', 'process', [300, 550]), chaff(0.3)],   // 284차 — 들깻대(수확지수 0.15~0.25 추정) · 키질한 검불
    noteKo: '깻잎을 따는 그 들깨 — 씨를 받으려면 6월에 심어 10월에 벤다. 베어 말려 털고 키질해야 들깨가 된다.',
    noteEn: 'The same plant that gives perilla leaves — for seed, plant in June and cut in October. Cut, dry, thresh and winnow before it becomes perilla seed.',
  },
  {
    id: 'chamkkae', nameKo: '참깨', nameEn: 'Sesame', category: 'grain', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'low',
    // 5월 상중순 파종 → 8월 하순~9월 베기(아래 꼬투리가 벌어질 때). 10a 40~60kg → 칸당 약 50g · 습해 · 역병에 약하다
    starts: [seed('chamkkae', [5, 6], 0.7, 100, 300)],
    // 284차 — g으로 센다 · 300g · 500g 봉지로 판다(작은 텃밭도 한 봉지를 채우게) · 방앗간에서 참기름(350ml ≈ 850g) · 깨소금
    harvest: { itemId: 'crop_chamkkae', nameKo: '참깨', nameEn: 'Sesame seeds', qtyPerCell: [40, 60], holdDays: 7, unitG: 1,
      bags: [
        { itemId: 'crop_chamkkae_b300', nameKo: '참깨 한 봉지 (300g)', nameEn: 'Sesame seeds, a bag (300g)', grams: 300 },
        { itemId: 'crop_chamkkae_b500', nameKo: '참깨 한 봉지 (500g)', nameEn: 'Sesame seeds, a bag (500g)', grams: 500 },
      ] },
    price: { base: 36, season: P_PULSE, volatility: 0.12 },
    byproducts: [residue('res_sesame_stalk', 'process', [80, 230]), chaff(0.3)],   // 284차 — 참깻대(수확지수 0.18~0.38) · 키질한 검불
    noteKo: '물 빠짐 좋은 밭에서 기른다 — 장마에 물이 고이면 역병으로 쓰러진다. 베어 세워 말린 뒤 거꾸로 들고 턴다.',
    noteEn: 'Grow it in free-draining ground — water pooling in the monsoon brings blight. Cut, stand to dry, then hold upside down and shake out the seed.',
  },

  // ═════ 235차 추가 — 마트에 없는 작물(조사 96종 중 텃밭 · 바다 요리와 이어지는 21종) ═════
  //  값 · 수량은 산지 판매글 · 시험 수량을 칸(1㎡) 단위로 옮긴 출발값이다(조사 문서의 「추정」 표기 포함).
  {
    id: 'gondre', nameKo: '곤드레', nameEn: 'Gondre (Korean thistle)', category: 'wild', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9], perennial: true, water: 'mid',
    // 고려엉겅퀴 잎 · 생잎은 산지에서만(건곤드레만 흔하다) · 포기당 200~400g · 4~6월 잎 따기 2~3회
    starts: [seed('gondre', [3, 4], 0.55, 90, 400), seedling('gondre', [4, 5, 9], 6, 40, 600)],
    harvest: { itemId: 'crop_gondre', nameKo: '곤드레 한 묶음 (200g)', nameEn: 'Gondre, a bundle (200g)', qtyPerCell: [2, 3], repeat: { everyDays: 20, times: 2 }, holdDays: 10 },
    price: { base: 2500, season: P_WILD, volatility: 0.12 },
    cookIngredient: 'namul',   // 284차 — 데쳐서 나물 볶음
    noteKo: '고려엉겅퀴 잎. 데쳐 들기름에 버무려 지은 곤드레밥이 정선의 맛이다.',
    noteEn: 'Korean thistle leaves. Blanched and tossed in perilla oil, they make gondre rice, the taste of Jeongseon.',
  },
  {
    id: 'danggui', nameKo: '당귀잎', nameEn: 'Angelica leaves (danggui)', category: 'herb', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9], perennial: true, water: 'mid',
    // 일당귀 35% 차광 · 5회 채취가 최다 수량(10a 잎 497kg → ㎡당 약 0.5kg)
    starts: [seed('danggui', [4, 5], 0.6, 60, 500), seedling('danggui', [4, 5, 6], 9, 30, 400)],
    harvest: { itemId: 'crop_danggui', nameKo: '당귀잎 한 묶음 (100g)', nameEn: 'Angelica leaves, a bundle (100g)', qtyPerCell: [3, 4], repeat: { everyDays: 15, times: 4 }, holdDays: 8 },
    price: { base: 1250, season: P_WILD, volatility: 0.12 },
    noteKo: '셀러리를 닮은 향긋한 쌈 잎. 회를 싸 먹는다. 볕을 조금 가리면 잎이 연하다.',
    noteEn: 'Fragrant, celery-like wrapping leaves for raw fish. A little shade keeps them tender.',
  },
  {
    id: 'kangkong', nameKo: '공심채', nameEn: 'Water spinach (kangkong)', category: 'leaf', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'high',
    // 고온 · 다습 · 30~40일에 첫 베기 → 베고 다시 · 국산 kg 7,650~14,500원(2026)
    starts: [seed('kangkong', [5, 6, 7], 0.8, 35, 400)],
    harvest: { itemId: 'crop_kangkong', nameKo: '공심채 한 단 (300g)', nameEn: 'Water spinach, a bunch (300g)', qtyPerCell: [3, 4], repeat: { everyDays: 15, times: 4 }, holdDays: 4 },
    price: { base: 3000, season: P_PERILLA, volatility: 0.2 }, rebalance: 0.9,
    noteKo: '더위와 물을 좋아하는 속 빈 줄기. 새우 · 오징어와 마늘에 볶아 액젓으로 간한다.',
    noteEn: 'Hollow stems that love heat and water. Stir-fry with shrimp or squid and garlic, seasoned with fish sauce.',
  },
  {
    id: 'arugula', nameKo: '루꼴라', nameEn: 'Arugula', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: false, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'mid',
    starts: [seed('arugula', [3, 4, 5, 9, 10], 0.8, 35, 300)],
    harvest: { itemId: 'crop_arugula', nameKo: '루꼴라 한 봉 (100g)', nameEn: 'Arugula, a bag (100g)', qtyPerCell: [4, 6], repeat: { everyDays: 14, times: 2 }, holdDays: 5 },
    price: { base: 2000, season: P_LETTUCE, volatility: 0.2 },
    noteKo: '톡 쏘는 매운 잎. 관자 · 새우 샐러드나 연어 카르파초에 얹는다. 더위에는 꽃대가 선다.',
    noteEn: 'Peppery leaves for scallop or shrimp salad and salmon carpaccio. It bolts in the heat.',
  },
  {
    id: 'myoga', nameKo: '양하', nameEn: 'Myoga ginger (yangha)', category: 'herb', speedClass: 'seasonal', rarity: 'rare',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10], perennial: true, water: 'high',
    requires: { facility: 'shade' },
    // 그늘 · 습기 · 봄에 뿌리줄기 → 8~10월 꽃봉오리를 여러 번 · 이듬해부터 본격
    starts: [setOf('myoga', [3, 4, 5], 0.85, 150, 3000, '양하 뿌리줄기 (1칸 분)', 'Myoga rhizomes (one cell)')],
    harvest: { itemId: 'crop_myoga', nameKo: '양하 꽃봉오리 (10개)', nameEn: 'Myoga buds (ten)', qtyPerCell: [2, 4], repeat: { everyDays: 10, times: 4 }, holdDays: 4 },
    price: { base: 3000, season: P_FLAT, volatility: 0.12 }, rebalance: 0.85,
    noteKo: '그늘진 처마 밑에서 피는 생강 꽃봉오리. 채 썰어 회 · 생선구이에 곁들인다(제주 양애).',
    noteEn: 'Ginger flower buds that come up in the shade under the eaves. Shred them over raw or grilled fish (Jeju yang-ae).',
  },
  {
    id: 'gourd', nameKo: '박', nameEn: 'Bottle gourd', category: 'fruit', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    // 덩굴 · 꽃 핀 뒤 10~15일의 어린 박 · 포기당 5~10통
    starts: [seed('gourd', [4, 5], 0.75, 95, 400), seedling('gourd', [5], 1, 70, 1500)],
    harvest: { itemId: 'crop_gourd', nameKo: '어린 박 (1통)', nameEn: 'Young bottle gourd (one)', qtyPerCell: [2, 3], repeat: { everyDays: 12, times: 3 }, holdDays: 6 },
    price: { base: 6000, season: P_CUCUMBER, volatility: 0.15 }, rebalance: 0.85,
    noteKo: '어린 박 속살을 얇게 썰어 국물을 내고 산낙지를 데쳐 먹는다(박속낙지탕).',
    noteEn: 'Thin slices of young gourd flesh make the broth for blanching live octopus (baksok nakji-tang).',
  },
  {
    id: 'turnip', nameKo: '강화순무', nameEn: 'Ganghwa turnip', category: 'root', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [8, 9, 10, 11], water: 'mid',
    starts: [seed('turnip', [8, 9], 0.75, 80, 300)],
    harvest: { itemId: 'crop_turnip', nameKo: '강화순무 (1개 · 500g)', nameEn: 'Ganghwa turnip (one, 500g)', qtyPerCell: [5, 7], holdDays: 15 },
    price: { base: 2000, season: P_RADISH, volatility: 0.15 },
    noteKo: '보랏빛 순무. 겨자처럼 코끝이 찡한 김치를 새우젓 · 밴댕이젓으로 담근다.',
    noteEn: 'A purple turnip whose kimchi has a mustard-like bite, made with salted shrimp or salted gizzard shad.',
  },
  {
    id: 'banga', nameKo: '방아', nameEn: 'Korean mint (banga)', category: 'herb', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], perennial: true, water: 'mid',
    // 배초향 · 월동 · 6~10월 잎 따기 · 순지르기로 곁가지
    starts: [seed('banga', [4, 5], 0.7, 60, 300), seedling('banga', [4, 5, 6], 4, 30, 800)],
    harvest: { itemId: 'crop_banga', nameKo: '방아잎 한 줌 (50g)', nameEn: 'Korean mint, a handful (50g)', qtyPerCell: [3, 4], repeat: { everyDays: 12, times: 6 }, holdDays: 6 },
    price: { base: 1200, season: P_FLAT, volatility: 0.1 },
    noteKo: '경상도 매운탕 · 장어국의 향채. 생선 비린내를 잡으려 집 가까이에 심었다.',
    noteEn: 'The aromatic herb of Gyeongsang fish stews and eel soup. People grew it by the house to tame the smell of fish.',
  },
  {
    id: 'shiso', nameKo: '차조기', nameEn: 'Shiso (chajogi)', category: 'herb', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    // 갓 받은 씨는 휴면이 있어 발아가 낮다 · 6~9월 잎 · 9월 꽃이삭(회 장식)
    starts: [seed('shiso', [4, 5], 0.55, 55, 400), seedling('shiso', [5, 6], 4, 30, 700)],
    harvest: { itemId: 'crop_shiso', nameKo: '차조기잎 한 묶음 (20장)', nameEn: 'Shiso leaves, a bundle (20)', qtyPerCell: [3, 4], repeat: { everyDays: 7, times: 10 }, holdDays: 5 },
    price: { base: 1500, season: P_FLAT, volatility: 0.12 }, rebalance: 0.8,
    noteKo: '고등어 · 전갱이 같은 등푸른생선 회에 곁들이는 잎. 깻잎을 닮았지만 향이 맵다.',
    noteEn: 'The leaf served with oily fish like mackerel and horse mackerel. It looks like perilla but smells sharper.',
  },
  {
    id: 'chopi', nameKo: '초피', nameEn: 'Korean pepper (chopi)', category: 'herb', speedClass: 'seasonal', rarity: 'rare',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10], perennial: true, water: 'low',
    requires: { skill: 'farm_wild' },
    // 2년생 암나무 묘목 → 이듬해 풋열매(7~8월) · 껍질가루 1kg 23만~30만원 · 생 풋열매 kg 3만~5만원
    starts: [seedling('chopi', [3, 4, 10, 11], 1, 240, 12000, { labelKo: '초피 암나무 묘목 (1그루)', labelEn: 'Female chopi sapling (one tree)' })],
    harvest: { itemId: 'crop_chopi', nameKo: '초피 열매 한 줌 (50g)', nameEn: 'Chopi berries, a handful (50g)', qtyPerCell: [4, 6], repeat: { everyDays: 10, times: 2 }, holdDays: 15 },
    price: { base: 2000, season: P_FLAT, volatility: 0.1 },
    noteKo: '잎이 마주나는 가시나무. 암나무에만 열리고, 껍질을 빻은 제피가루를 추어탕 · 매운탕에 뿌린다.',
    noteEn: 'A thorny shrub with paired leaves. Only female trees fruit; the ground husks are sprinkled on loach soup and spicy fish stew.',
  },
  {
    id: 'dill', nameKo: '딜', nameEn: 'Dill', category: 'herb', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 9, 10], water: 'mid',
    starts: [seed('dill', [4, 5, 9], 0.7, 50, 400)],
    harvest: { itemId: 'crop_dill', nameKo: '딜 한 묶음 (30g)', nameEn: 'Dill, a bundle (30g)', qtyPerCell: [4, 6], repeat: { everyDays: 10, times: 2 }, holdDays: 5 },
    price: { base: 2500, season: P_FLAT, volatility: 0.12 }, rebalance: 0.85,
    noteKo: '연어 절임 · 훈제연어에 빠지지 않는 허브. 꽃대가 빨리 서니 두세 주마다 또 뿌린다.',
    noteEn: 'The herb gravlax and smoked salmon cannot do without. It bolts fast, so sow again every two or three weeks.',
  },
  {
    id: 'fennel', nameKo: '펜넬', nameEn: 'Florence fennel', category: 'herb', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [4, 5, 6, 7, 8, 9, 10], water: 'mid',
    starts: [seed('fennel', [4, 5, 8], 0.65, 90, 500)],
    harvest: { itemId: 'crop_fennel', nameKo: '펜넬 구근 (1개)', nameEn: 'Fennel bulb (one)', qtyPerCell: [4, 6], holdDays: 10 },
    price: { base: 3500, season: P_FLAT, volatility: 0.12 }, rebalance: 0.85,
    noteKo: '도미 · 농어를 통째로 구울 때 배 속에 넣는 아니스 향 구근.',
    noteEn: 'An anise-scented bulb tucked inside sea bream or sea bass before roasting them whole.',
  },
  {
    id: 'basil', nameKo: '바질', nameEn: 'Basil', category: 'herb', speedClass: 'leafy', rarity: 'common',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    starts: [seed('basil', [4, 5], 0.75, 50, 300), seedling('basil', [5, 6], 4, 25, 1500)],
    harvest: { itemId: 'crop_basil', nameKo: '바질 한 줌 (30g)', nameEn: 'Basil, a handful (30g)', qtyPerCell: [3, 5], repeat: { everyDays: 10, times: 8 }, holdDays: 4 },
    price: { base: 2000, season: P_PERILLA, volatility: 0.15 }, rebalance: 0.85,
    noteKo: '서리 전에 순을 따 해산물 파스타 · 조개찜에 얹는다. 10°C 아래에서는 잎이 검게 상한다.',
    noteEn: 'Pinch the tips before frost for seafood pasta or steamed clams. Below 10°C the leaves turn black.',
  },
  {
    id: 'lions_mane', nameKo: '노루궁뎅이버섯', nameEn: 'Lion\'s mane mushroom', category: 'mushroom', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'indoor', growMonths: ALL, water: 'high',
    // 참나무 톱밥 배지 · 습도 95% 이상 · 접종 후 40~45일 · 배지 1kg당 150~250g
    starts: [setOf('lions_mane', ALL, 0.9, 40, 7000, '노루궁뎅이 배지 (1kg)', 'Lion\'s mane block (1kg)')],
    harvest: { itemId: 'crop_lions_mane', nameKo: '노루궁뎅이 한 송이 (200g)', nameEn: 'Lion\'s mane, one head (200g)', qtyPerCell: [1, 2], repeat: { everyDays: 20, times: 1 }, holdDays: 2, bonusSteps: 3 },
    price: { base: 5000, season: P_SHIITAKE, volatility: 0.1 }, rebalance: 0.85,
    byproducts: [residue('res_spent_substrate', 'harvest', [650, 850], { onEnd: true })],   // 284차 — 다 거둔 배지(1kg)
    noteKo: '흰 털이 늘어진 공 모양 버섯. 습도를 높게 지켜야 돋는다 — 전복 · 관자 버터구이에 곁들인다.',
    noteEn: 'A ball of hanging white spines that only fruits in steady high humidity. Serve it with abalone or scallops seared in butter.',
  },
  {
    id: 'wood_ear', nameKo: '목이버섯', nameEn: 'Wood ear mushroom', category: 'mushroom', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'indoor', growMonths: ALL, water: 'high',
    starts: [setOf('wood_ear', ALL, 0.9, 60, 4000, '목이 배지 (1봉)', 'Wood ear block (one bag)')],
    // 243차 — 한 장씩 뗀다(약 15g) · 열 개를 용기에 담으면 한 팩(150g)
    harvest: { itemId: 'crop_wood_ear', nameKo: '생목이 (1개)', nameEn: 'Fresh wood ear (one)', qtyPerCell: [20, 30], repeat: { everyDays: 15, times: 2 }, holdDays: 3, bonusSteps: 3,
      pack: { itemId: 'crop_wood_ear_pack', nameKo: '생목이 한 팩 (150g)', nameEn: 'Fresh wood ear, a pack (150g)', units: 10 } },
    price: { base: 150, season: P_SHIITAKE, volatility: 0.1 },
    byproducts: [residue('res_spent_substrate', 'harvest', [800, 1100], { onEnd: true })],   // 284차 — 다 거둔 배지(한 봉)
    noteKo: '국산 생목이는 귀하다. 탱글한 식감을 해파리냉채 · 해물볶음에.',
    noteEn: 'Fresh domestic wood ear is hard to find. Its bouncy bite suits jellyfish salad and seafood stir-fries.',
  },
  {
    id: 'peanut', nameKo: '땅콩', nameEn: 'Peanut', category: 'legume', speedClass: 'seasonal', rarity: 'common',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], water: 'low',
    // 생땅콩은 9~10월 햇것만(나머지는 볶은 것) · 포기당 50~100g × 칸당 9포기
    starts: [seed('peanut', [5], 0.8, 120, 1500, { labelKo: '씨땅콩 (1칸 분 · 30알)', labelEn: 'Seed peanuts (one cell, 30)' })],
    harvest: { itemId: 'crop_peanut', nameKo: '생땅콩 (500g)', nameEn: 'Fresh peanuts (500g)', qtyPerCell: [1, 2], holdDays: 12 },
    price: { base: 9000, season: [1.09, 1.09, 1.09, 1.09, 1.09, 1.09, 1.09, 1, 0.77, 0.72, 0.91, 1], volatility: 0.1 },
    noteKo: '모래땅에서 잘 들고, 까치가 씨를 파먹는다. 멸치땅콩볶음의 그 땅콩.',
    noteEn: 'Likes sandy soil, and magpies dig up the seed. The peanuts in stir-fried anchovies with peanuts.',
  },
  {
    id: 'cowpea', nameKo: '동부', nameEn: 'Cowpea (dongbu)', category: 'legume', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'low',
    starts: [seed('cowpea', [5, 6], 0.8, 70, 300)],
    harvest: { itemId: 'crop_cowpea', nameKo: '풋동부 한 줌 (200g)', nameEn: 'Fresh cowpeas, a handful (200g)', qtyPerCell: [2, 3], repeat: { everyDays: 10, times: 4 }, holdDays: 6 },
    price: { base: 1500, season: P_PULSE, volatility: 0.12 },
    noteKo: '더위와 가뭄에 강한 콩. 꼬투리를 여러 번 따 동부밥 · 떡고물을 한다.',
    noteEn: 'A bean that shrugs off heat and drought. Pick the pods again and again for cowpea rice and rice-cake dusting.',
  },
  {
    id: 'amaranth', nameKo: '비름', nameEn: 'Amaranth greens (bireum)', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8], water: 'low',
    starts: [seed('amaranth', [5, 6], 0.75, 35, 300)],
    harvest: { itemId: 'crop_amaranth', nameKo: '비름 한 줌 (200g)', nameEn: 'Amaranth greens, a handful (200g)', qtyPerCell: [2, 3], repeat: { everyDays: 10, times: 4 }, holdDays: 5 },
    price: { base: 1200, season: P_FLAT, volatility: 0.12 },
    noteKo: '여름 마당에 저절로도 나는 나물. 순을 따 고추장 · 들기름에 무친다.',
    noteEn: 'A summer green that even sows itself in the yard. Pick the tips and dress them with chili paste and perilla oil.',
  },
  {
    id: 'eomnamu', nameKo: '엄나무순', nameEn: 'Castor aralia shoots (eomnamu)', category: 'wild', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [4, 5], perennial: true, water: 'low',
    requires: { skill: 'farm_wild' },
    // 가시 굵은 나무 · 4월 중순~5월 초 2~3주 · 산지 kg 3만~4만원(2025~2026 판매글)
    starts: [seedling('eomnamu', [3, 4, 11], 1, 50, 5000, { labelKo: '엄나무 묘목 (1그루)', labelEn: 'Castor aralia sapling (one tree)' })],
    harvest: { itemId: 'crop_eomnamu', nameKo: '엄나무순 한 묶음 (250g)', nameEn: 'Castor aralia shoots, a bundle (250g)', qtyPerCell: [1, 1], repeat: { everyDays: 7, times: 1 }, holdDays: 5 },
    price: { base: 7000, season: P_WILD, volatility: 0.15 }, rebalance: 0.8,
    noteKo: '가시 돋은 음나무 새순. 참두릅보다 쌉싸름해 숙회로 초장에 찍는다.',
    noteEn: 'New shoots of the thorny castor aralia. More bitter than fatsia shoots — blanch and dip in vinegared chili paste.',
  },
  {
    id: 'meowi', nameKo: '머위', nameEn: 'Butterbur (meowi)', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: false, site: 'plot', growMonths: [3, 4, 5, 6, 7, 8], perennial: true, water: 'high',
    starts: [setOf('meowi', [3, 4, 9, 10], 0.85, 60, 1500, '머위 땅속줄기 (1칸 분)', 'Butterbur runners (one cell)')],
    harvest: { itemId: 'crop_meowi', nameKo: '머위 한 묶음 (300g)', nameEn: 'Butterbur, a bundle (300g)', qtyPerCell: [2, 3], repeat: { everyDays: 20, times: 3 }, holdDays: 10 },
    price: { base: 1000, season: P_WILD, volatility: 0.15 },
    noteKo: '그늘 · 젖은 땅도 마다하지 않고 번진다. 봄엔 잎쌈, 여름엔 머위대 들깨볶음.',
    noteEn: 'Spreads happily even in shade and wet ground. Leaf wraps in spring, stems stir-fried with perilla seed in summer.',
  },
  {
    id: 'turmeric', nameKo: '울금', nameEn: 'Turmeric (ulgeum)', category: 'tuber', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: false, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10, 11], water: 'mid',
    requires: { facility: 'greenhouse' },
    // 열대 원산 · 4월 하순~5월 정식 → 11~12월 수확 · 중부는 하우스 · 10a 약 4,000kg → 포기당 약 0.85kg
    starts: [setOf('turmeric', [4, 5], 0.8, 180, 3000, '울금 종근 (1칸 분)', 'Turmeric seed rhizomes (one cell)')],
    harvest: { itemId: 'crop_turmeric', nameKo: '생울금 (500g)', nameEn: 'Fresh turmeric (500g)', qtyPerCell: [3, 5], holdDays: 20 },
    price: { base: 7000, season: P_GINGER, volatility: 0.1 }, rebalance: 0.85,
    noteKo: '열대에서 온 노란 뿌리. 비닐 안에서 길러 서리 무렵 캔다 — 생선 카레 · 튀김옷에 색과 향을 낸다.',
    noteEn: 'A yellow root from the tropics. Grow it under plastic and dig it at the first frost; it colours and scents fish curry and frying batter.',
  },

  // ═════ 241차 — 새 작물 5종(참외 · 수박 · 블루베리 · 토마토 · 딸기 — 고구마는 235차부터 있다) ═════
  {
    id: 'korean_melon', nameKo: '참외', nameEn: 'Korean melon', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    // 성주 노지 기준 정식 4월 하순~5월 · 포기 사이 60cm × 이랑 2m → 칸당 1포기(덩굴이 옆 칸으로 뻗는다) · 포기당 6~10개(400g) ·
    //   어미덩굴 4~5마디 적심 → 아들덩굴 3~4개 → 손자덩굴에 달린다 · 7월 상순부터 5일마다 · 농진청 「어려움」(병 · 벌레 · 적심)
    starts: [seedling('korean_melon', [4, 5], 1, 70, 1500)],
    harvest: { itemId: 'crop_korean_melon', nameKo: '참외 (1개 · 약 400g)', nameEn: 'Korean melon (one, about 400g)', qtyPerCell: [1, 2], repeat: { everyDays: 5, times: 5 }, holdDays: 5 },
    price: { base: 2000, season: P_MELON, volatility: 0.25 },
    noteKo: '어미덩굴을 4~5마디에서 끊어 아들덩굴 서넛을 키우면 손자덩굴에 달린다. 꼭지가 떨어지려 할 때 딴다.',
    noteEn: 'Pinch the mother vine at 4-5 nodes and let three or four side vines run; the fruit sets on the grandchild vines. Pick when the stem begins to slip.',
  },
  {
    id: 'watermelon', nameKo: '수박', nameEn: 'Watermelon', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    // 접목 모종 정식 5월 상순(지온 15℃ 이상) · 이랑 2.5~3m × 포기 70cm → 칸당 1포기(덩굴 3~4m) · 포기당 1~2통(6~8kg) ·
    //   어미덩굴 적심 · 아들덩굴 3개 · 15~20마디 암꽃에 인공수분 · 수분 뒤 35~40일 · 농진청 「어려움」
    starts: [seedling('watermelon', [5], 1, 85, 2500, { labelKo: '수박 접목 모종 (1포기)', labelEn: 'Grafted watermelon seedling (1 plant)' })],
    harvest: { itemId: 'crop_watermelon', nameKo: '수박 (1통 · 약 7kg)', nameEn: 'Watermelon (one, about 7kg)', qtyPerCell: [1, 2], holdDays: 7 },
    price: { base: 18000, season: P_WATERMELON, volatility: 0.3 },
    noteKo: '한 포기에 한두 통만 남기고 나머지는 딴다. 두드려 둔탁한 소리가 나고 꼭지 옆 덩굴손이 마르면 익은 것이다.',
    noteEn: 'Leave only one or two fruits per plant and remove the rest. Ripe when it sounds dull to a knock and the tendril by the stem has dried.',
  },
  {
    id: 'blueberry', nameKo: '블루베리', nameEn: 'Blueberry', category: 'fruit', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11], water: 'high', perennial: true,
    // 3년생 묘목 1주/칸(포기 사이 1~1.5m → 사실상 한 칸) · 심은 해 6~7월 소량 · 이듬해부터 제대로(여러해살이 — 다음 철은 절반 기간) ·
    //   pH 4.5 산성 흙(피트모스 · 소나무 껍질) · 물을 많이 먹고 뿌리가 얕다 · 익는 3~4주 동안 5일마다 · 봄 · 가을 식재
    starts: [seedling('blueberry', [3, 4, 10, 11], 1, 95, 15000, { labelKo: '블루베리 묘목 (3년생 · 1주)', labelEn: 'Blueberry bush (3-year, 1 plant)' })],
    // 243차 — 익은 알만 하나씩 딴다(약 2g) · 쉰 알을 용기에 담으면 한 팩(100g)
    harvest: { itemId: 'crop_blueberry', nameKo: '블루베리 (1알)', nameEn: 'Blueberry (one berry)', qtyPerCell: [100, 200], repeat: { everyDays: 5, times: 4 }, holdDays: 3,
      pack: { itemId: 'crop_blueberry_pack', nameKo: '블루베리 한 팩 (100g)', nameEn: 'Blueberries, a pack (100g)', units: 50 } },
    price: { base: 60, season: P_BLUEBERRY, volatility: 0.2 },
    noteKo: '피트모스를 섞어 산성 흙을 만들어야 자란다. 한 번 심으면 해마다 돌아오고, 묘목 값은 이듬해부터 뽑는다.',
    noteEn: 'Needs acid soil — mix in peat moss. Plant once and it comes back every year; the bush pays for itself from the second season.',
  },
  {
    id: 'tomato', nameKo: '토마토', nameEn: 'Tomato', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    // 완숙 토마토(대과) · 포기 사이 45cm → 칸당 2포기 · 포기당 3~4kg · 정식 60일 뒤 첫 수확 · 7일마다 ·
    //   씨앗은 고추처럼 2~3월 실내 트레이(60일 · 모종 20~30) · 곁순 · 지주 · 역병 · 탄저 · 바이러스 · 농진청 「보통」
    starts: [
      seed('tomato', [2, 3], 0.8, 60, 400, { nursery: { seedlings: [20, 30], seedlingItemId: 'sdl_tomato' } }),
      seedling('tomato', [4, 5], 2, 60, 1200),
    ],
    harvest: { itemId: 'crop_tomato', nameKo: '토마토 1kg', nameEn: 'Tomatoes 1kg', qtyPerCell: [1, 1], repeat: { everyDays: 7, times: 6 }, holdDays: 4 },
    price: { base: 4500, season: P_CHERRY_TOMATO, volatility: 0.25 },
    noteKo: '곁순은 보이는 대로 따고 한 줄기로 키운다. 꼭지 쪽까지 붉게 익은 것을 딴다 — 덜 익은 것은 창가에서 후숙.',
    noteEn: 'Pinch every sucker and train to a single stem. Pick when red right up to the shoulder; underripe fruit finishes on a windowsill.',
  },
  {
    id: 'strawberry', nameKo: '딸기', nameEn: 'Strawberry', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'mid', overwinter: true,
    // 노지 딸기(설향) · 9월 중하순 런너 묘 정식 · 포기 25cm × 두 줄 → 칸당 6포기 · 겨울을 나고 4월 하순~5월 수확 · 포기당 300~400g(500g 팩 4~5개/칸) ·
    //   자라는 날만 세면 9~11월 70일 + 3~4월 60일 = 130일 · 꽃이 피면 멀칭 · 탄저 · 흰가루
    starts: [seedling('strawberry', [9, 10], 6, 130, 600, { labelKo: '딸기 모종 (런너 묘 · 1포기)', labelEn: 'Strawberry runner plant (1)' })],
    // 243차 — 한 알씩 딴다(약 20g) · 스물다섯 알을 용기에 담으면 한 팩(500g)
    harvest: { itemId: 'crop_strawberry', nameKo: '딸기 (1개)', nameEn: 'Strawberry (one)', qtyPerCell: [22, 28], repeat: { everyDays: 5, times: 4 }, holdDays: 2,
      pack: { itemId: 'crop_strawberry_pack', nameKo: '딸기 한 팩 (500g)', nameEn: 'Strawberries, a pack (500g)', units: 25 } },
    price: { base: 320, season: P_STRAWBERRY, volatility: 0.25 },
    noteKo: '가을에 심어 겨울을 나고 봄에 딴다. 꽃이 피면 짚이나 비닐을 깔아 열매가 흙에 닿지 않게 한다.',
    noteEn: 'Plant in autumn, overwinter, pick in spring. Once it flowers, lay straw or film so the fruit never touches the soil.',
  },

  // ═════ 241차 — 개량종 3종(원종을 세 번 거두면 종묘사에 들어온다 — `variant`) ═════
  {
    id: 'stevia_tomato', nameKo: '스테비아 토마토', nameEn: 'Stevia tomato', category: 'fruit', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    variant: { of: 'tomato', afterHarvests: 3, diffKo: '스테비아 발효액을 네 번 주어 당도를 올린다 — 값은 토마토의 1.8배, 거르면 보통 토마토 맛', diffEn: 'Fed four times with stevia ferment for sweetness — 1.8× the price of plain tomatoes; skip the feeds and you get ordinary tomatoes' },
    // 토마토와 같은 재배 + 정식 3주 뒤부터 2주 간격 스테비아 발효액 4회(관리 작업 `stevia_feed` — 거르면 품질이 깎인다) · 소매 1kg 7,000~10,000원
    starts: [seedling('stevia_tomato', [4, 5], 2, 60, 1500, { labelKo: '스테비아 토마토 모종 (1포기)', labelEn: 'Stevia tomato seedling (1 plant)' })],
    harvest: { itemId: 'crop_stevia_tomato', nameKo: '스테비아 토마토 1kg', nameEn: 'Stevia tomatoes 1kg', qtyPerCell: [1, 1], repeat: { everyDays: 7, times: 6 }, holdDays: 4 },
    price: { base: 8000, season: P_CHERRY_TOMATO, volatility: 0.25 },
    noteKo: '가게의 스테비아 토마토는 거둔 뒤 담근 것이 많지만, 여기서는 스테비아 발효액을 땅과 잎에 주어 기른다(스테비아 농법). 당도가 두 배 가까이 오른다.',
    noteEn: 'Shop "stevia tomatoes" are often dipped after harvest; here they are grown with stevia ferment fed to soil and leaf (the stevia method). Sugar content nearly doubles.',
  },
  {
    id: 'pumpkin_sweet_potato', nameKo: '호박고구마', nameEn: 'Pumpkin sweet potato', category: 'tuber', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], water: 'low',
    variant: { of: 'sweet_potato', afterHarvests: 3, diffKo: '속이 노랗고 촉촉하다 — 값은 1.3배, 칸당 조금 덜 나오고 저장성이 짧다(12일)', diffEn: 'Yellow, moist flesh — 1.3× the price, slightly lower yield per cell and keeps less well (12 days)' },
    // 베니하루카 계통 · 밤고구마보다 수량이 조금 적고(10a 1,400kg 안팎) 저장성이 짧다 · 소매 1kg 5,500~7,500원 · 순은 두는 편이 좋아 중간 수확이 없다
    starts: [setOf('pumpkin_sweet_potato', [5, 6], 0.9, 120, 1500, '호박고구마순 (1칸 분 · 4줄기)', 'Pumpkin sweet potato slips (one cell, 4)')],
    harvest: { itemId: 'crop_pumpkin_sweet_potato', nameKo: '호박고구마 1kg', nameEn: 'Pumpkin sweet potatoes 1kg', qtyPerCell: [1, 2], holdDays: 12 },
    price: { base: 6500, season: P_SWEETPOTATO, volatility: 0.2 },
    noteKo: '베니하루카 계통. 밤고구마보다 수분이 많아 캐서 열흘쯤 말려야 단맛이 오르고, 오래 두면 상한다.',
    noteEn: 'Beniharuka type. Moister than chestnut sweet potatoes — cure for about ten days after digging to bring up the sugar; it does not store long.',
  },
  {
    id: 'cheongyang', nameKo: '청양고추', nameEn: 'Cheongyang chili', category: 'fruit', speedClass: 'seasonal', rarity: 'uncommon',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9, 10], water: 'mid',
    variant: { of: 'chili', afterHarvests: 3, diffKo: '훨씬 맵다 — 값은 1.3배, 한 번에 달리는 수는 조금 적다. 손 가는 일은 고추와 같다', diffEn: 'Far hotter — 1.3× the price, a few less fruit per picking. Same work as ordinary chili' },
    // 고추와 같은 재배(트레이 육묘 · 지주 · 곁순 · 웃거름 · 방제) · 열매가 가늘어 포기당 조금 덜 달린다 · 소매 100g 1,500원 → 개당 150원
    starts: [
      seed('cheongyang', [2, 3], 0.65, 75, 400, { nursery: { seedlings: [20, 30], seedlingItemId: 'sdl_cheongyang' } }),
      seedling('cheongyang', [4, 5], 3, 60, 700),
    ],
    harvest: { itemId: 'crop_cheongyang', nameKo: '청양고추 (1개)', nameEn: 'Cheongyang chili (one)', qtyPerCell: [15, 24], repeat: { everyDays: 7, times: 10 }, holdDays: 10 },
    price: { base: 150, season: P_CHILI, volatility: 0.25 }, cookIngredient: 'chili_green',
    noteKo: '청양 · 음성에서 나온 매운 품종. 열매는 가늘고 날씨가 더울수록 맵다. 날로 먹으면 물을 찾게 된다.',
    noteEn: 'The hot cultivar bred in Cheongyang and Eumseong. Slender pods, hotter in hot weather. Eat one raw and you will reach for water.',
  },
];

// ─────────────────────────────────────────────
// 237차 — 기르기 어려운 정도 · 까다로운 점 (사용자 제안 「작물별 난이도에 따라 자격 요건 차등」)
//
// 기준(농촌진흥청 텃밭 재배 분류 — 병과 벌레가 많은 작물 · 지주 · 육묘를 어렵게 본다):
//   쉬움 = 상추 · 시금치 · 쑥갓 · 배추 · 당근 · 무 · 고구마 · 감자 / 보통 = 토마토 · 호박 · 고추 · 가지 / 어려움 = 오이(· 수박 · 참외).
// 분류에 없는 작물은 까다로운 점으로 견준다 — 지주 · 덩굴 · 반년 재배 · 월동이면 보통,
// 시설(차광 · 비닐) · 고온 긴 재배(생강)면 까다로움, 산채 · 고추냉이(기술 + 시설)는 아주 까다로움.
// 씨앗 · 모종 · 키트(배지 · 시루)는 같은 작물이라도 다르다 — `nursery`가 붙은 작물은 씨앗으로 시작하면 한 단계 위.
// ─────────────────────────────────────────────
export const CROP_DIFFICULTY: Readonly<Record<string, { tier: CropDifficulty; care: CropCare[] }>> = {
  // ── 쉬움 — 누구나 ──
  bean_sprout: { tier: 1, care: [] },
  mung_sprout: { tier: 1, care: [] },
  microgreens: { tier: 1, care: [] },
  oyster_mushroom: { tier: 1, care: [] },              // 균이 다 자란 배지(키트)를 사 온다
  lettuce: { tier: 1, care: [] },                      // 농진청 「쉬움」
  jeokchima: { tier: 1, care: [] }, kkot_lettuce: { tier: 1, care: [] }, cheongchukmyeon: { tier: 1, care: [] }, jeokchukmyeon: { tier: 1, care: [] },  // 242차 상추 품종 — 전부 「쉬움」
  saengchae: { tier: 1, care: [] }, cheongromaine: { tier: 1, care: [] }, jeokromaine: { tier: 1, care: [] }, butterhead: { tier: 1, care: [] },
  perilla: { tier: 1, care: [] },
  spinach: { tier: 1, care: ['overwinter'] },          // 농진청 「쉬움」
  crown_daisy: { tier: 1, care: [] },                  // 농진청 「쉬움」
  young_radish: { tier: 1, care: ['pests'] },          // 벼룩잎벌레
  ugeolgari: { tier: 1, care: ['pests'] },
  chive: { tier: 1, care: ['nursery'] },               // 씨앗은 80일 · 포기 모종이 쉽다
  scallion: { tier: 1, care: [] },
  water_parsley: { tier: 1, care: ['water'] },
  mallow: { tier: 1, care: [] },
  chard: { tier: 1, care: [] },
  potato: { tier: 1, care: [] },                       // 농진청 「쉬움」
  sweet_potato: { tier: 1, care: [] },                 // 농진청 「쉬움」
  radish: { tier: 1, care: ['pests'] },                // 농진청 「쉬움」
  napa_cabbage: { tier: 1, care: ['pests', 'nursery'] }, // 농진청 「쉬움」(모종) · 씨앗은 육묘
  carrot: { tier: 1, care: ['germination'] },          // 농진청 「쉬움」 · 싹 틔우기만 까다롭다
  soybean: { tier: 1, care: [] },
  deulkkae: { tier: 1, care: [] },                     // 247차 — 기르기는 쉽고 베고 말리고 터는 손이 많다
  chamkkae: { tier: 2, care: ['pests', 'water'] },     // 247차 — 습해 · 역병
  cowpea: { tier: 1, care: [] },
  amaranth: { tier: 1, care: [] },
  arugula: { tier: 1, care: [] },
  basil: { tier: 1, care: [] },
  shiso: { tier: 1, care: [] },
  banga: { tier: 1, care: [] },
  dill: { tier: 1, care: [] },
  kangkong: { tier: 1, care: ['heat'] },
  turnip: { tier: 1, care: ['pests'] },
  meowi: { tier: 1, care: ['water'] },
  jerusalem: { tier: 1, care: [] },                    // 한 번 심으면 퍼질 만큼 억세다
  // ── 보통 — 레벨 ──
  chili: { tier: 2, care: ['pests', 'support', 'nursery'] }, // 농진청 「보통」 · 씨앗 육묘 70~80일
  cherry_tomato: { tier: 2, care: ['pests', 'support'] },    // 농진청 「보통」(토마토)
  zucchini: { tier: 2, care: ['pests'] },                    // 농진청 「보통」(호박) — 흰가루병
  eggplant: { tier: 2, care: ['pests', 'support'] },         // 농진청 「보통」
  corn: { tier: 2, care: ['pests'] },                        // 조명나방 · 새
  leek: { tier: 2, care: ['soil'] },                         // 북주기
  onion: { tier: 2, care: ['overwinter', 'longSeason'] },
  garlic: { tier: 2, care: ['overwinter', 'longSeason'] },
  barley: { tier: 2, care: ['overwinter'] },
  taro: { tier: 2, care: ['water', 'longSeason'] },
  yacon: { tier: 2, care: ['longSeason'] },
  choseokjam: { tier: 2, care: ['longSeason'] },
  peanut: { tier: 2, care: ['soil'] },                       // 모래흙 · 씨앗을 새가 판다
  lions_mane: { tier: 2, care: ['humidity'] },
  wood_ear: { tier: 2, care: ['humidity'] },
  godeulppaegi: { tier: 2, care: ['overwinter', 'germination'] },
  bangpung: { tier: 2, care: ['soil'] },
  gondre: { tier: 2, care: ['nursery', 'shade'] },
  danggui: { tier: 2, care: ['nursery'] },                   // 씨앗 싹이 잘 안 튼다
  fennel: { tier: 2, care: ['soil'] },                       // 알뿌리를 굵히려면 북을 준다 · 꽃대
  gourd: { tier: 2, care: ['support'] },
  bitter_melon: { tier: 2, care: ['support', 'heat'] },
  okra: { tier: 2, care: ['heat'] },
  // ── 까다로움 — 레벨 + 유기농업기능사 ──
  cucumber: { tier: 3, care: ['pests', 'support', 'water'] }, // 농진청 「어려움」 — 노균병 · 흰가루병 · 덩굴 3~4m
  ginger: { tier: 3, care: ['heat', 'soil', 'longSeason'] },  // 땅이 데워져야 싹이 트고 종강이 잘 썩는다
  myoga: { tier: 3, care: ['shade', 'longSeason'] },
  turmeric: { tier: 3, care: ['heat', 'longSeason'] },
  // ── 아주 까다로움 — 레벨 + 유기농업기능사 + 그 작물의 기술(산채 재배 · 수경 재배) ──
  gomchwi: { tier: 4, care: ['shade', 'water'] },
  myeongi: { tier: 4, care: ['shade', 'longSeason'] },        // 씨앗부터면 수확까지 5년
  samnamul: { tier: 4, care: ['shade', 'longSeason'] },
  eosuri: { tier: 4, care: ['shade'] },
  bujigaengi: { tier: 4, care: ['shade'] },
  dureup: { tier: 4, care: ['longSeason'] },                  // 나무
  eomnamu: { tier: 4, care: ['longSeason'] },                 // 나무
  chopi: { tier: 4, care: ['longSeason'] },                   // 나무
  wasabi: { tier: 4, care: ['water', 'longSeason'] },         // 찬물 · 1년 반
  // ── 241차 — 새 작물 · 개량종 ──
  korean_melon: { tier: 3, care: ['pests', 'heat'] },         // 농진청 「어려움」 — 흰가루 · 덩굴쪼김 · 적심
  watermelon: { tier: 3, care: ['pests', 'heat'] },           // 농진청 「어려움」 — 접목묘 · 인공수분 · 덩굴 3~4m
  blueberry: { tier: 2, care: ['soil', 'longSeason', 'water'] }, // 산성 흙 · 묘목 · 얕은 뿌리
  tomato: { tier: 2, care: ['pests', 'support', 'nursery'] }, // 농진청 「보통」 · 씨앗 육묘 60일
  strawberry: { tier: 2, care: ['pests', 'overwinter'] },     // 탄저 · 흰가루 · 가을 정식 → 봄 수확
  stevia_tomato: { tier: 2, care: ['pests', 'support'] },     // 토마토 + 발효액 4회
  pumpkin_sweet_potato: { tier: 1, care: [] },               // 고구마와 같다
  cheongyang: { tier: 2, care: ['pests', 'support', 'nursery'] }, // 고추와 같다
};

for (const c of CROP_DATABASE) {
  const d = CROP_DIFFICULTY[c.id];
  if (d) { c.difficulty = d.tier; c.care = d.care; }
}

const BY_ID = new Map(CROP_DATABASE.map((c) => [c.id, c]));
export function getCrop(id: string): CropDef | undefined {
  return BY_ID.get(id);
}

/**
 * 씨앗 · 모종 · 종구 아이템 → (작물, 심는 방법). 직접 키운 콩(`crop_soybean` — 등급 꼬리 포함)으로
 * 콩나물을 앉히는 것처럼 수확물이 씨앗이 되는 경우도 찾는다.
 */
export function cropStartOfItem(itemId: string): { crop: CropDef; start: CropStart } | null {
  const ids = [itemId];
  const base = parseProduceId(itemId).baseId;
  if (base !== itemId) ids.push(base);
  for (const id of ids) {
    for (const crop of CROP_DATABASE) {
      const start = crop.starts.find((s) => s.itemId === id);
      if (start) return { crop, start };
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// 등급별 수확물 id — 가방에서 등급마다 따로 쌓인다(섞이면 값이 뭉개진다)
// ─────────────────────────────────────────────

/** 등급 꼬리 — 상(기본 id) · 특 `_sp` · 보통 `_nm` */
export const PRODUCE_GRADE_SUFFIX: Record<CropGrade, string> = { special: '_sp', good: '', normal: '_nm' };

/** 수확물 기본 id + 등급 → 가방 아이템 id */
export function produceItemId(baseId: string, grade: CropGrade): string {
  return `${baseId}${PRODUCE_GRADE_SUFFIX[grade]}`;
}

/** 가방 아이템 id → 수확물 기본 id + 등급(꼬리가 없으면 상) */
export function parseProduceId(itemId: string): { baseId: string; grade: CropGrade } {
  if (itemId.endsWith('_sp')) return { baseId: itemId.slice(0, -3), grade: 'special' };
  if (itemId.endsWith('_nm')) return { baseId: itemId.slice(0, -3), grade: 'normal' };
  return { baseId: itemId, grade: 'good' };
}

const PRODUCE_BASE_IDS = new Map<string, CropDef>();
for (const c of CROP_DATABASE) {
  PRODUCE_BASE_IDS.set(c.harvest.itemId, c);
  if (c.harvest.ripenTo) PRODUCE_BASE_IDS.set(c.harvest.ripenTo.itemId, c);
  if (c.interim) PRODUCE_BASE_IDS.set(c.interim.itemId, c);
  if (c.harvest.pack) PRODUCE_BASE_IDS.set(c.harvest.pack.itemId, c);   // 243차 — 포장한 팩
  for (const b of c.harvest.bags ?? []) PRODUCE_BASE_IDS.set(b.itemId, c);   // 284차 — 낱알 봉지
  for (const b of c.byproducts ?? []) if (b.kind === 'food') PRODUCE_BASE_IDS.set(b.itemId, c);   // 284차 — 먹는 부산물
}

/** 수확물 아이템(등급 꼬리 포함) → 작물(본 수확 · 붉어진 것 · 중간 수확 · 243차 팩 모두) */
export function cropOfProduce(itemId: string): CropDef | undefined {
  return PRODUCE_BASE_IDS.get(itemId) ?? PRODUCE_BASE_IDS.get(parseProduceId(itemId).baseId);
}

/** 243차 — 포장 용기(생활용품점 · 낱개로 산다). 「포장하기」 한 번에 하나 든다 */
export const FARM_PACK_CONTAINER = 'farm_pack_tray';

/** 243차 — 포장한 팩인가(등급 꼬리 포함) */
export function isProducePack(itemId: string): boolean {
  const c = cropOfProduce(itemId);
  return !!c?.harvest.pack && parseProduceId(itemId).baseId === c.harvest.pack.itemId;
}

/** 243차 — 낱개(등급 꼬리 포함) → 담을 팩 id(같은 등급) · 포장 단위. 포장 단위가 없는 수확물이면 null */
export function packOfLoose(itemId: string): { crop: CropDef; pack: CropPack; packItemId: string; grade: CropGrade } | null {
  const c = cropOfProduce(itemId);
  const { baseId, grade } = parseProduceId(itemId);
  if (!c?.harvest.pack || baseId !== c.harvest.itemId) return null;
  return { crop: c, pack: c.harvest.pack, packItemId: produceItemId(c.harvest.pack.itemId, grade), grade };
}

/** 243차 — 팩(등급 꼬리 포함) → 뜯으면 나오는 낱개 id(같은 등급) · 수. 팩이 아니면 null */
export function looseOfPack(itemId: string): { crop: CropDef; looseItemId: string; units: number; grade: CropGrade } | null {
  const c = cropOfProduce(itemId);
  const { baseId, grade } = parseProduceId(itemId);
  if (!c?.harvest.pack || baseId !== c.harvest.pack.itemId) return null;
  return { crop: c, looseItemId: produceItemId(c.harvest.itemId, grade), units: c.harvest.pack.units, grade };
}

/**
 * 243차 — 구세이브 이전: 242차까지 「한 팩」 단위로 거둔 수확물(`crop_strawberry` 「딸기 한 팩 (500g) · 상」)을 팩 id로 옮긴다.
 * 낱개 id인데 저장된 이름이 그 작물의 팩 이름으로 시작하면 팩이다(새 낱개 이름은 「(1개)」 · 「한 줌」이라 겹치지 않는다).
 * @returns 옮길 팩 id(같은 등급) · 아니면 null
 */
export function legacyPackItemId(itemId: string, savedName: string | undefined): string | null {
  const p = packOfLoose(itemId);
  if (!p || !savedName) return null;
  return savedName.startsWith(p.pack.nameKo) ? p.packItemId : null;
}

/** 텃밭에서 거둔 것인가(등급 꼬리 포함) */
export function isFarmProduce(itemId: string): boolean {
  return !!cropOfProduce(itemId);
}

// ─────────────────────────────────────────────
// 284차 — 무게 수확물(낱알 g) · 봉지
// ─────────────────────────────────────────────

/** 284차 — 곡물 봉투(생활용품점 · 낱개로 산다). 「봉지 담기」 한 번에 하나 든다 */
export const FARM_BAG_CONTAINER = 'farm_grain_bag';

/** 284차 — g으로 세는 수확물인가(등급 꼬리 포함 · 낱알만 — 봉지는 아니다). 한 단위의 g(없으면 null) */
export function produceUnitG(itemId: string): number | null {
  const c = cropOfProduce(itemId);
  if (!c?.harvest.unitG) return null;
  return parseProduceId(itemId).baseId === c.harvest.itemId ? c.harvest.unitG : null;
}

/** 284차 — 낱알(등급 꼬리 포함) → 담을 수 있는 봉지들(같은 등급 id). 무게 수확물이 아니면 빈 배열 */
export function bagsOfLoose(itemId: string): { crop: CropDef; bag: CropBag; bagItemId: string; grade: CropGrade }[] {
  const c = cropOfProduce(itemId);
  const { baseId, grade } = parseProduceId(itemId);
  if (!c?.harvest.bags || baseId !== c.harvest.itemId) return [];
  return c.harvest.bags.map((bag) => ({ crop: c, bag, bagItemId: produceItemId(bag.itemId, grade), grade }));
}

/** 284차 — 봉지(등급 꼬리 포함) → 뜯으면 나오는 낱알 id(같은 등급) · g. 봉지가 아니면 null */
export function looseOfBag(itemId: string): { crop: CropDef; bag: CropBag; looseItemId: string; grams: number; grade: CropGrade } | null {
  const c = cropOfProduce(itemId);
  const { baseId, grade } = parseProduceId(itemId);
  const bag = c?.harvest.bags?.find((b) => b.itemId === baseId);
  if (!c || !bag) return null;
  return { crop: c, bag, looseItemId: produceItemId(c.harvest.itemId, grade), grams: bag.grams, grade };
}

/** 284차 — 봉지인가(등급 꼬리 포함) */
export function isProduceBag(itemId: string): boolean {
  return !!looseOfBag(itemId);
}

/**
 * 284차 — 구세이브 이전: 283차까지 단위로 센 낱알(「들깨 (100g)」 1개 = 100g)을 g으로 바꾼다.
 * 저장된 이름이 옛 단위 이름으로 시작하면 그 배수를 돌려준다(이름이 바뀌어 두 번 곱하지 않는다).
 */
const LEGACY_UNIT_NAMES: Record<string, { nameKo: string; grams: number }> = {
  crop_deulkkae: { nameKo: '들깨 (100g)', grams: 100 },
  crop_chamkkae: { nameKo: '참깨 (50g)', grams: 50 },
  crop_soybean: { nameKo: '콩 (백태) 200g', grams: 200 },
  crop_barley: { nameKo: '보리 낟알 500g', grams: 500 },
};
export function legacyUnitGrams(itemId: string, savedName: string | undefined): number | null {
  if (!savedName) return null;
  const old = LEGACY_UNIT_NAMES[parseProduceId(itemId).baseId];
  return old && savedName.startsWith(old.nameKo) ? old.grams : null;
}

/** 284차 — 먹는 부산물인가(등급 꼬리 포함) → 그 정의 · 작물 */
export function byproductOf(itemId: string): { crop: CropDef; def: CropByproduct } | null {
  const c = cropOfProduce(itemId);
  const base = parseProduceId(itemId).baseId;
  const def = c?.byproducts?.find((b) => b.itemId === base || b.itemId === itemId);
  return c && def ? { crop: c, def } : null;
}

// ─────────────────────────────────────────────
// 농자재 — 도구 · 퇴비 · 설비(텃밭 · 실내)
// ─────────────────────────────────────────────

export interface FarmSupplyDef {
  itemId: string;
  nameKo: string;
  nameEn: string;
  /** 가게 값(원) */
  price: number;
  /** tool = 가방에 두고 쓴다(닳지 않음) · consumable = 칸에 넣으면 사라진다 · facility = 텃밭/실내에 놓는다 */
  kind: 'tool' | 'consumable' | 'facility';
  /** 설비가 되는 것 */
  facility?: FarmFacility;
  /** 설비를 두는 곳 */
  site?: FarmSite;
  /** 사거나 놓으려면 배워야 하는 스킬 */
  requiresSkill?: string;
  /** 희귀도 — 가게 재고 */
  rarity?: 'common' | 'uncommon' | 'rare';
  /** 238차 — 파는 가게(없으면 생활용품점). 종묘사 = 육묘 트레이 · 지주대 · 유인끈 · 멀칭 비닐 · 비료 · 농약 */
  shop?: 'daily' | 'nursery';
  /** 238차 — 아이콘 키(없으면 `it_<id 꼬리>`) */
  icon?: string;
  /** 243차 — 한 번에 살 수 있는 수(없으면 가게 기본 — 소모품 12 · 종묘사 24) */
  buyMax?: number;
  descKo: string;
  descEn: string;
}

/**
 * 농자재 표 — 값은 2024~2025 소매 시세(호미 3천 · 퇴비 20kg 포대 6~8천원 → 1칸 분 3kg 1천원 ·
 * 빗물통 200L 4~5만 · 소형 비닐 터널(활대 · 비닐 · 12㎡) 10~15만 · 차광망 30만원대 → 텃밭 한 구획 분 3만 ·
 * 콩나물 시루 1만 안팎 · 가정용 수경 재배기 8~10만 · 냉수 순환 수조(칠러 포함) 25~30만).
 */
export const FARM_SUPPLIES: FarmSupplyDef[] = [
  { itemId: 'farm_homi', nameKo: '호미', nameEn: 'Homi (hand hoe)', price: 3000, kind: 'tool',
    descKo: '텃밭 흙을 일군다. 갈지 않은 칸에는 아무것도 심을 수 없다.', descEn: 'Turns over garden soil. Nothing can be planted in untilled ground.' },
  { itemId: 'farm_compost', nameKo: '퇴비 (1칸 분 · 3kg)', nameEn: 'Compost (one cell, 3kg)', price: 1000, kind: 'consumable',
    descKo: '심기 전 칸에 넣으면 이번 작기에 더 빨리 자라고 품질이 오른다.', descEn: 'Worked into a cell before planting: faster growth and better quality this season.' },
  { itemId: 'farm_rain_barrel', nameKo: '빗물통 (점적 호스)', nameEn: 'Rain barrel (drip hose)', price: 45000, kind: 'facility', facility: 'rainBarrel', site: 'plot',
    descKo: '빗물을 받아 두었다가 흙이 마르면 조금씩 흘려 준다. 자리를 비워도 흙이 바짝 마르지 않는다.', descEn: 'Stores rainwater and drips it out when the soil dries. The bed never goes bone-dry while you are away.' },
  { itemId: 'farm_tunnel', nameKo: '비닐 터널 (한 구획 분)', nameEn: 'Plastic tunnel (one bed)', price: 120000, kind: 'facility', facility: 'greenhouse', site: 'plot',
    requiresSkill: 'farm_green', rarity: 'uncommon',
    descKo: '활대에 비닐을 씌운다. 철 앞뒤 한 달을 더 기르고 추운 달에 빨리 자란다. 비는 막는다.', descEn: 'Plastic over hoops: one extra month on each side of the season and faster growth in cold months. Keeps the rain off.' },
  { itemId: 'farm_shade_net', nameKo: '차광막 (한 구획 분)', nameEn: 'Shade net (one bed)', price: 30000, kind: 'facility', facility: 'shade', site: 'plot',
    descKo: '볕을 절반쯤 가린다. 그늘에서 자라는 산나물은 이 아래에서만 기른다.', descEn: 'Cuts the sun by about half. Shade-loving mountain greens grow only under it.' },
  { itemId: 'farm_cold_tank', nameKo: '냉수 순환 수조', nameEn: 'Cold-water circulation tank', price: 280000, kind: 'facility', facility: 'coldWater', site: 'plot',
    requiresSkill: 'farm_hydro', rarity: 'rare',
    descKo: '찬물을 자갈 사이로 계속 흘려보낸다. 고추냉이를 기를 수 있는 유일한 자리.', descEn: 'Keeps cold water flowing through gravel. The only place wasabi will grow.' },
  { itemId: 'farm_sprout_jar', nameKo: '콩나물 시루', nameEn: 'Sprouting jar', price: 9000, kind: 'facility', facility: 'sproutJar', site: 'indoor',
    descKo: '구멍 뚫린 옹기 시루. 집 안에 두고 콩나물 · 숙주 · 새싹을 기른다.', descEn: 'A clay jar with holes in the bottom. Keep it indoors to grow bean sprouts, mung sprouts and microgreens.' },
  { itemId: 'farm_hydro_rack', nameKo: '수경 재배기', nameEn: 'Hydroponic rack', price: 89000, kind: 'facility', facility: 'hydroRack', site: 'indoor', rarity: 'uncommon',
    descKo: '불빛과 물이 도는 두 칸 선반. 잎채소를 철과 상관없이 집 안에서 기른다.', descEn: 'A two-shelf rack with grow lights and circulating water. Grows leafy greens indoors in any season.' },
  // ── 238차 — 종묘사 자재(관리 작업에 쓴다). 값은 소매 시세를 칸 한 번 분으로 나눈 게임 값
  //   (50구 트레이 2~3천 · 지주대 1.5m 5~7백 · 유인끈 1타래 1천 · 멀칭 비닐 1m 5백 · 복합비료 20kg 1.5만 → 1칸 분 4백 ·
  //    살균제 500ml 1~2만 · 아인산 1kg 1.5만 · 칼슘액비 1L 1만 · 살충제 250ml 1.5만 → 1칸 한 번 분 5~8백)
  { itemId: 'farm_tray', nameKo: '육묘 트레이 (50구)', nameEn: 'Seedling tray (50 cells)', price: 2500, kind: 'tool', shop: 'nursery', icon: 'it_tray',
    descKo: '씨앗을 뿌려 모종을 키우는 트레이. 집 안 선반에서 쓴다 — 2월 따뜻한 창가에서 싹을 틔운다.', descEn: 'Tray for raising seedlings from seed. Used on the indoor shelf — a warm February windowsill gets them going.' },
  { itemId: 'farm_stake', nameKo: '지주대 (1.5m)', nameEn: 'Stake (1.5m)', price: 600, kind: 'consumable', shop: 'nursery', icon: 'it_stake',
    descKo: '고추 · 토마토 · 가지처럼 쓰러지는 작물 옆에 세운다. 포기마다 하나.', descEn: 'Driven beside crops that blow over — chili, tomato, eggplant. One per plant.' },
  { itemId: 'farm_twine', nameKo: '유인끈 (1타래)', nameEn: 'Tying twine (one hank)', price: 1000, kind: 'consumable', shop: 'nursery', icon: 'it_twine',
    descKo: '줄기를 지주에 묶는다. 지주 세울 때 한 타래, 유인할 때마다 한 타래.', descEn: 'Ties stems to stakes. One hank when staking, one per tying round.' },
  { itemId: 'farm_mulch', nameKo: '멀칭 비닐 (1칸 분)', nameEn: 'Black mulch film (one cell)', price: 500, kind: 'consumable', shop: 'nursery', icon: 'it_mulch',
    descKo: '두둑을 덮는 검은 비닐. 흙이 튀지 않아 탄저병 · 역병이 덜 들고 물이 덜 마른다.', descEn: 'Black film over the ridge. No soil splash — less anthracnose and blight, and the soil dries slower.' },
  { itemId: 'farm_fert', nameKo: '복합비료 (1칸 한 번 분)', nameEn: 'Compound fertilizer (one application)', price: 400, kind: 'consumable', shop: 'nursery', icon: 'it_fert',
    descKo: '웃거름. 정식 15일 뒤부터 15~20일 간격으로 포기 사이에 준다. 안 주면 수확이 준다.', descEn: 'Top-dressing. From 15 days after transplanting, every 15–20 days between plants. Skip it and the harvest shrinks.' },
  { itemId: 'farm_fungicide', nameKo: '살균제 (1칸 한 번 분)', nameEn: 'Fungicide (one application)', price: 800, kind: 'consumable', shop: 'nursery', icon: 'it_fungicide',
    descKo: '탄저병 · 역병 예방. 장마철 비 전후 7~10일 간격으로 친다. 열흘 동안 든다.', descEn: 'Prevents anthracnose and blight. Spray every 7–10 days around rain in the wet season. Lasts ten days.' },
  { itemId: 'farm_phosphite', nameKo: '아인산 (1칸 한 번 분)', nameEn: 'Phosphite (one application)', price: 700, kind: 'consumable', shop: 'nursery', icon: 'it_phosphite',
    descKo: '역병 예방. 7~14일 간격. 두 주 동안 든다.', descEn: 'Blight prevention. Every 7–14 days. Lasts two weeks.' },
  { itemId: 'farm_calcium', nameKo: '칼슘액비 (1칸 한 번 분)', nameEn: 'Calcium foliar feed (one application)', price: 500, kind: 'consumable', shop: 'nursery', icon: 'it_calcium',
    descKo: '잎에 뿌리는 칼슘. 열매 껍질이 단단해져 탄저병이 덜 들고 품질이 오른다.', descEn: 'Foliar calcium. Firmer fruit skin — less anthracnose, better quality.' },
  { itemId: 'farm_insecticide', nameKo: '살충제 (1칸 한 번 분)', nameEn: 'Insecticide (one application)', price: 700, kind: 'consumable', shop: 'nursery', icon: 'it_insecticide',
    descKo: '총채벌레 · 진딧물을 막는다 — 바이러스병을 옮기는 벌레다. 열이틀 동안 든다.', descEn: 'Keeps off thrips and aphids — the insects that carry the viruses. Lasts twelve days.' },
  // ── 243차 — 포장(사용자 결정 「한 팩 단위는 패키징을 별도로」) · PET 투명 용기 낱개 100원 안팎(생활용품점)
  { itemId: 'farm_pack_tray', nameKo: '농산물 포장 용기', nameEn: 'Produce clamshell', price: 100, kind: 'consumable', icon: 'it_pack_tray', buyMax: 50,
    descKo: '뚜껑 달린 투명 용기. 낱개로 거둔 딸기 · 방울토마토 · 블루베리 · 버섯 · 새싹채소를 가방에서 「포장하기」로 한 팩씩 담는다. 팩은 제값을 받는다.',
    descEn: 'A clear lidded tub. Use "Pack" in your bag to put loose strawberries, cherry tomatoes, blueberries, mushrooms or microgreens into packs. Packs fetch the full price.' },
  // ── 284차 — 낱알 봉지(사용자 「상품성을 지니는 수준을 중량으로 — 몇 백 그람 단위로」) · 지퍼 곡물 봉투 낱개 100원 안팎
  { itemId: 'farm_grain_bag', nameKo: '곡물 봉투', nameEn: 'Grain bag', price: 100, kind: 'consumable', icon: 'it_breadpack', buyMax: 50,
    descKo: '지퍼 달린 곡물 봉투. 털어 둔 깨 · 콩 · 보리를 가방에서 「봉지 담기」로 300g · 500g · 1kg씩 담는다. 낱알은 가게가 사지 않는다 — 봉지째 판다.',
    descEn: 'A zip-top grain bag. Use "Bag" in your bag to fill threshed sesame, perilla, beans or barley into 300g, 500g or 1kg bags. Shops won\'t buy loose grain — sell it bagged.' },
  // ── 241차 — 스테비아 농법(스테비아 토마토) · 1L 1.5만 → 1칸 한 번 분 1,200원
  { itemId: 'farm_stevia', nameKo: '스테비아 발효액 (1칸 한 번 분)', nameEn: 'Stevia ferment (one application)', price: 1200, kind: 'consumable', shop: 'nursery', icon: 'it_stevia',
    descKo: '스테비아 잎을 삭힌 액. 포기 둘레 흙에 붓고 잎에 뿌리면 토마토가 달아진다 — 스테비아 토마토 모종에만 쓴다.', descEn: 'Fermented stevia leaf. Poured round the plant and misted on the leaves it sweetens the fruit — only for stevia tomato plants.' },
  // ── 245차 — 작물별 일의 자재(사용자 「고추처럼 각 농작물에 대한 난이도를 추가」). 값 = 소매 시세를 칸 한 번 분으로 나눈 게임 값
  //   (한랭사 1.8×10m + 활대 1.5만 → 1칸 1,200 · 조류 방지망 2×10m 1만 → 800 · 부직포 1.5×10m 8천 → 600 · 볏짚 한 단 2천 → 500 ·
  //    오이망 2×10m 5천 → 600 · 피트모스 50L 2만 → 1,500 · 전정가위 1~2만)
  { itemId: 'farm_insect_net', nameKo: '방충망 (한랭사 · 1칸 분)', nameEn: 'Insect mesh (one cell)', price: 1200, kind: 'consumable', shop: 'nursery', icon: 'it_insect_net',
    descKo: '활대에 씌우는 고운 망. 배추 · 무 · 열무 · 순무 · 루꼴라를 씨 뿌린 날 덮으면 나비 · 벼룩잎벌레가 들어오지 못한다.',
    descEn: 'Fine mesh drawn over hoops. Laid over cabbage, radish, young radish, turnip or rocket on sowing day, it keeps butterflies and flea beetles out.' },
  { itemId: 'farm_bird_net', nameKo: '새 그물 (1칸 분)', nameEn: 'Bird netting (one cell)', price: 800, kind: 'consumable', shop: 'nursery', icon: 'it_bird_net',
    descKo: '눈이 굵은 검은 그물. 익어 가는 블루베리 · 옥수수 이삭과 막 뿌린 콩 · 땅콩을 새에게서 지킨다.',
    descEn: 'Wide black netting. Guards ripening blueberries and corn ears — and freshly sown beans and peanuts — from birds.' },
  { itemId: 'farm_fleece', nameKo: '부직포 (1칸 분)', nameEn: 'Frost fleece (one cell)', price: 600, kind: 'consumable', shop: 'nursery', icon: 'it_fleece',
    descKo: '숨을 쉬는 흰 덮개. 겨울을 나는 시금치 · 딸기 · 양하를 덮으면 잎과 뿌리줄기가 얼지 않는다.',
    descEn: 'A breathable white cover. Over overwintering spinach, strawberries or myoga it keeps leaves and rhizomes from freezing.' },
  { itemId: 'farm_straw', nameKo: '볏짚 (1칸 분)', nameEn: 'Rice straw (one cell)', price: 500, kind: 'consumable', shop: 'nursery', icon: 'it_straw',
    descKo: '흙을 덮는 볏짚. 마늘 · 양파의 겨울 이불, 딸기 열매 받침, 생강 · 산나물의 마름 막기로 쓴다.',
    descEn: 'Straw for covering soil. A winter blanket for garlic and onions, a bed under strawberries, and a moisture keeper for ginger and wild greens.' },
  { itemId: 'farm_trellis_net', nameKo: '오이망 (1칸 분)', nameEn: 'Trellis net (one cell)', price: 600, kind: 'consumable', shop: 'nursery', icon: 'it_trellis_net',
    descKo: '지주 사이에 치는 유인망. 오이 · 여주 · 박 덩굴이 감고 올라간다. 지주대와 함께 쓴다.',
    descEn: 'A climbing net strung between stakes. Cucumber, bitter melon and gourd vines wind up it. Used with stakes.' },
  { itemId: 'farm_peat', nameKo: '피트모스 (1칸 한 번 분)', nameEn: 'Peat moss (one application)', price: 1500, kind: 'consumable', shop: 'nursery', icon: 'it_peat',
    descKo: '산성 이끼 흙. 봄마다 블루베리 포기 둘레에 섞어 흙을 산성으로 맞춘다.',
    descEn: 'Acidic moss compost. Worked round blueberry bushes each spring to keep the soil acid.' },
  { itemId: 'farm_shears', nameKo: '전정가위', nameEn: 'Pruning shears', price: 12000, kind: 'tool', shop: 'nursery', icon: 'it_shears',
    descKo: '가지를 자르는 가위. 블루베리 · 두릅 · 엄나무 · 초피의 가지치기에 쓴다. 닳지 않는다.',
    descEn: 'Shears for cutting branches. Used to prune blueberry, fatsia (dureup), castor aralia and Korean pepper. They don’t wear out.' },
  // ── 247차 — 거두기 · 심기 · 손질 도구(사용자 「고추 가위 사용 시 더 빠르고 아주 조금 더 좋은 고추 수확」).
  //   값 = 2025 소매 시세(낫 5~9천 · 수확 가위 6~1만 · 쇠스랑 1.2~2만 · 모종삽 2~4천 · 도리깨 2~3만 · 대나무 키 1.5~3만 · 코팅 장갑 1~2천)
  { itemId: 'farm_sickle', nameKo: '낫', nameEn: 'Sickle', price: 7000, kind: 'tool', icon: 'it_sickle',
    descKo: '깨 · 콩 · 보리를 벨 때 꼭 있어야 한다. 부추 · 미나리 · 공심채도 낫으로 베면 그루터기가 깔끔하다. 닳지 않는다.',
    descEn: 'You cannot cut sesame, perilla, beans or barley without one. Chives, water parsley and water spinach cut with a sickle leave clean stubble. Never wears out.' },
  { itemId: 'farm_harvest_scissors', nameKo: '수확 가위', nameEn: 'Harvest snips', price: 8000, kind: 'tool', shop: 'nursery', icon: 'it_harvest_scissors',
    descKo: '고추 가위. 고추 · 토마토 · 가지 · 오이 · 참외 · 수박의 꼭지를 자른다 — 손으로 비틀어 따는 것보다 빠르고, 상처가 없어 조금 더 좋은 것을 거둔다.',
    descEn: 'Pepper snips. Clip the stems of chili, tomato, eggplant, cucumber, melon and watermelon — quicker than twisting them off by hand, and no torn stems, so a slightly better harvest.' },
  { itemId: 'farm_fork', nameKo: '쇠스랑', nameEn: 'Digging fork', price: 15000, kind: 'tool', icon: 'it_fork',
    descKo: '감자 · 고구마 · 토란 · 생강 · 땅콩을 캘 때 흙을 크게 들어 올린다. 호미보다 훨씬 빠르지만 감자 · 고구마는 날에 몇 개 찍힌다.',
    descEn: 'Lifts big clods when digging potatoes, sweet potatoes, taro, ginger and peanuts. Much faster than a homi, though a few potatoes and sweet potatoes get speared.' },
  { itemId: 'farm_trowel', nameKo: '모종삽', nameEn: 'Hand trowel', price: 3000, kind: 'tool', icon: 'it_trowel',
    descKo: '모종 심을 구덩이를 판다. 뿌리 흙이 덜 깨져 모종이 잘 산다 — 심는 품도 준다.',
    descEn: 'Digs planting holes for seedlings. The root ball stays whole so more of them take, and planting is less work.' },
  { itemId: 'farm_flail', nameKo: '도리깨', nameEn: 'Threshing flail', price: 25000, kind: 'tool', shop: 'nursery', icon: 'it_flail',
    descKo: '말린 콩대 · 깻단 · 보릿단을 내리쳐 알을 턴다. 없으면 막대기로 두드려야 해 품이 훨씬 든다.',
    descEn: 'Beats dried bean, sesame and barley sheaves to knock the grain out. Without one you thrash them with a stick — far more work.' },
  { itemId: 'farm_winnow', nameKo: '키', nameEn: 'Winnowing basket', price: 15000, kind: 'tool', icon: 'it_winnow',
    descKo: '대나무로 엮은 키. 턴 알곡을 까불러 검불 · 쭉정이를 날린다 — 없으면 검불이 섞여 값을 덜 받는다.',
    descEn: 'A woven bamboo basket. Toss threshed grain in it to blow away chaff and empty husks — without it, chaff stays in and the grain sells for less.' },
  { itemId: 'farm_gloves', nameKo: '코팅 장갑', nameEn: 'Coated work gloves', price: 2000, kind: 'tool', icon: 'it_farm_gloves',
    descKo: '손바닥에 고무를 입힌 장갑. 가시 돋친 두릅 · 엄나무순 · 초피를 딸 때 손을 지킨다.',
    descEn: 'Gloves with rubber-coated palms. Protect your hands when picking thorny fatsia shoots, castor aralia and Korean pepper.' },
];

const SUPPLY_BY_ID = new Map(FARM_SUPPLIES.map((s) => [s.itemId, s]));
export function getFarmSupply(itemId: string): FarmSupplyDef | undefined {
  return SUPPLY_BY_ID.get(itemId);
}

/** 설비 → 농자재 아이템(걷어 내면 돌려준다) */
export function supplyOfFacility(f: FarmFacility): FarmSupplyDef | undefined {
  return FARM_SUPPLIES.find((s) => s.facility === f);
}

// ─────────────────────────────────────────────
// 241차 — 개량종 조회(원종 ↔ 개량종)
// ─────────────────────────────────────────────

/** 이 작물(원종)의 개량종들 — 없으면 빈 배열 */
export function variantsOf(baseId: string): CropDef[] {
  return CROP_DATABASE.filter((c) => c.variant?.of === baseId);
}

/** 개량종의 원종(개량종이 아니면 undefined) */
export function baseCropOf(crop: CropDef): CropDef | undefined {
  return crop.variant ? BY_ID.get(crop.variant.of) : undefined;
}

/**
 * 개량종이 종묘사에 들어올 조건 한 줄 — 「토마토를 3번 거두면 종묘사에 들어온다 (지금 1번)」.
 * `harvestsOf`는 그 원종을 거둔 횟수(없으면 조건만).
 */
export function variantUnlockKo(crop: CropDef, harvestsOf?: number): string {
  const v = crop.variant;
  if (!v) return '';
  const base = BY_ID.get(v.of)?.nameKo ?? v.of;
  const head = `${base}를 ${v.afterHarvests}번 거두면 종묘사에 들어온다`;
  if (harvestsOf === undefined) return head;
  return harvestsOf >= v.afterHarvests ? `${head} — 열렸다` : `${head} (지금 ${harvestsOf}번)`;
}
