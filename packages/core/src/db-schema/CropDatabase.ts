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

import type { CropDef, CropGrade, CropStart, FarmFacility, FarmSite } from '../types/Farming.js';

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

const seed = (crop: string, months: number[], establish: number, days: number, cost: number, extra: Partial<CropStart> = {}): CropStart =>
  ({ kind: 'seed', itemId: `seed_${crop}`, perCell: 1, establish, days, months, cost, ...extra });
const seedling = (crop: string, months: number[], perCell: number, days: number, cost: number, extra: Partial<CropStart> = {}): CropStart =>
  ({ kind: 'seedling', itemId: `sdl_${crop}`, perCell, establish: 0.95, days, months, cost, ...extra });
const setOf = (crop: string, months: number[], establish: number, days: number, cost: number, labelKo: string, labelEn: string, extra: Partial<CropStart> = {}): CropStart =>
  ({ kind: 'set', itemId: `set_${crop}`, perCell: 1, establish, days, months, cost, labelKo, labelEn, ...extra });

export const CROP_DATABASE: CropDef[] = [
  // ═════ 실내 — 시루 · 배지 (철 무관 · 매일 거리) ═════
  {
    id: 'bean_sprout', nameKo: '콩나물', nameEn: 'Soybean sprouts', category: 'sprout', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'indoor', growMonths: ALL, water: 'high',
    // 나물콩 100g → 콩나물 400~600g(5~8일 · 재래 나물콩 시험 121~695%) · 직접 키운 백태 200g으로도 앉힌다(1.8배)
    starts: [
      seed('bean_sprout', ALL, 0.92, 6, 1200, { labelKo: '나물콩 100g (시루 한 번)', labelEn: 'Sprouting soybeans 100g (one jar)' }),
      { kind: 'seed', itemId: 'crop_soybean', perCell: 1, establish: 0.85, days: 6, months: ALL, cost: 0, qtyMult: 1.8 },
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
    harvest: { itemId: 'crop_microgreens', nameKo: '새싹채소 한 팩 (50g)', nameEn: 'Microgreens, a pack (50g)', qtyPerCell: [2, 3], holdDays: 2 },
    price: { base: 1500, season: P_FLAT, volatility: 0.1 },
    noteKo: '무순 · 브로콜리 · 적양배추 새싹. 씨앗 10g이 일주일 남짓이면 100~150g.',
    noteEn: 'Radish, broccoli and red cabbage shoots. 10g of seed gives 100-150g in a little over a week.',
  },
  {
    id: 'oyster_mushroom', nameKo: '느타리버섯', nameEn: 'Oyster mushroom', category: 'mushroom', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'indoor', growMonths: ALL, water: 'high',
    // 균이 다 자란 배지를 사 온다 → 7~12일에 첫 발생 · 12일쯤 뒤 한 번 더
    //  배지 1kg → 첫물 155~161g · 수량의 94%가 1 · 2주기(경기도 시험) → 1.5kg 배지 두 번에 약 400g
    starts: [setOf('oyster_mushroom', ALL, 0.95, 11, 5000, '느타리 배지 (1.5kg)', 'Oyster mushroom block (1.5kg)')],
    harvest: { itemId: 'crop_oyster_mushroom', nameKo: '느타리 한 팩 (200g)', nameEn: 'Oyster mushrooms, a pack (200g)', qtyPerCell: [1, 1], repeat: { everyDays: 12, times: 1 }, holdDays: 2 },
    price: { base: 2000, season: P_MUSHROOM, volatility: 0.1 },
    noteKo: '배지 1.5kg에서 두 번 돋는다. 세 번째는 거의 나지 않는다. 첫물이 가장 굵다.',
    noteEn: 'A 1.5kg block fruits twice; a third flush hardly comes. The first flush is the thickest.',
  },

  // ═════ 잎채소 (시설 상한 ×2.0) ═════
  {
    id: 'lettuce', nameKo: '상추', nameEn: 'Lettuce', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [3, 4, 5, 6, 9, 10, 11], water: 'high',
    // 포기간 25~30cm → 칸당 9포기 · 잎 따기 4일마다 포기당 25g 안팎 · 한여름은 꽃대가 올라 멈춘다
    starts: [seed('lettuce', [3, 4, 5, 8, 9], 0.62, 55, 200), seedling('lettuce', [4, 5, 9, 10], 9, 25, 300)],
    harvest: { itemId: 'crop_lettuce', nameKo: '상추 한 줌 (100g)', nameEn: 'Lettuce, a handful (100g)', qtyPerCell: [2, 3], repeat: { everyDays: 4, times: 10 }, holdDays: 6 },
    price: { base: 1200, season: P_LETTUCE, volatility: 0.3 },
    noteKo: '겉잎부터 따면 속에서 계속 올라온다. 여름 더위에는 꽃대가 서서 잎이 쓰다.',
    noteEn: 'Pick the outer leaves and new ones keep coming from the centre. In summer heat it bolts and the leaves turn bitter.',
  },
  {
    id: 'perilla', nameKo: '깻잎', nameEn: 'Perilla leaves', category: 'leaf', speedClass: 'leafy', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    starts: [seed('perilla', [4, 5], 0.7, 60, 200), seedling('perilla', [5, 6], 4, 35, 300)],
    harvest: { itemId: 'crop_perilla', nameKo: '깻잎 한 묶음 (20장)', nameEn: 'Perilla leaves, a bundle (20 leaves)', qtyPerCell: [2, 3], repeat: { everyDays: 5, times: 12 }, holdDays: 7 },
    price: { base: 800, season: P_PERILLA, volatility: 0.2 },
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
    // 주간 40cm 안팎 → 칸당 3포기 · 7~9월 일주일마다 · 따지 않고 두면 붉어진다
    starts: [seed('chili', [3], 0.65, 120, 300), seedling('chili', [5], 3, 60, 500)],
    harvest: {
      itemId: 'crop_chili_green', nameKo: '풋고추 (1개)', nameEn: 'Green chili (one)', qtyPerCell: [18, 28], repeat: { everyDays: 7, times: 10 }, holdDays: 10,
      ripenTo: { itemId: 'crop_chili_red', nameKo: '홍고추 (1개)', nameEn: 'Red chili (one)', afterDays: 10, price: 140, cookIngredient: 'chili_red' },
    },
    interim: {
      itemId: 'crop_pepper_leaf', labelKo: '고춧잎 한 줌 (100g)', labelEn: 'Chili leaves, a handful (100g)',
      window: [0.5, 1.0], qtyPerCell: [2, 3], mainYieldMult: 0.97, price: 1200, inMart: false,
    },
    price: { base: 120, season: P_CHILI, volatility: 0.25 }, cookIngredient: 'chili_green',
    noteKo: '모종은 늦서리가 끝난 5월에. 끝물에 잎을 훑어 고춧잎 나물을 한다.',
    noteEn: 'Plant seedlings in May after the last frost. At the end of the season, strip the leaves for seasoned pepper greens.',
  },
  {
    id: 'cherry_tomato', nameKo: '방울토마토', nameEn: 'Cherry tomato', category: 'fruit', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [5, 6, 7, 8, 9], water: 'mid',
    starts: [seedling('cherry_tomato', [4, 5], 2, 60, 1000)],
    harvest: { itemId: 'crop_cherry_tomato', nameKo: '방울토마토 한 팩 (250g)', nameEn: 'Cherry tomatoes, a pack (250g)', qtyPerCell: [2, 4], repeat: { everyDays: 6, times: 10 }, holdDays: 5 },
    price: { base: 2500, season: P_CHERRY_TOMATO, volatility: 0.2 },
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
      itemId: 'crop_sweetpotato_stem', labelKo: '고구마순 한 단 (300g)', labelEn: 'Sweet potato stems, a bunch (300g)',
      window: [0.4, 0.8], qtyPerCell: [2, 3], mainYieldMult: 0.95, price: 2500, inMart: false,
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
      window: [0.78, 0.93], qtyPerCell: [1, 2], mainYieldMult: 1.05, price: 2500, inMart: false,
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
    harvest: { itemId: 'crop_barley', nameKo: '보리 낟알 500g', nameEn: 'Barley grain 500g', qtyPerCell: [1, 1], holdDays: 15 },
    price: { base: 1500, season: P_FLAT, volatility: 0.1 },
    noteKo: '가을에 뿌려 겨울을 나고 6월에 벤다. 눌러 압맥을 만들면 밑밥 재료.',
    noteEn: 'Sow in autumn, let it winter over, cut it in June. Rolled barley goes into groundbait.',
  },
  {
    id: 'soybean', nameKo: '콩', nameEn: 'Soybean', category: 'legume', speedClass: 'seasonal', rarity: 'common',
    inMart: true, site: 'plot', growMonths: [6, 7, 8, 9, 10], water: 'low',
    // 10a 200~250kg → 칸당 약 220g · 직접 키운 백태로 콩나물을 앉힐 수 있다
    starts: [seed('soybean', [5, 6], 0.75, 120, 300)],
    harvest: { itemId: 'crop_soybean', nameKo: '콩 (백태) 200g', nameEn: 'Soybeans 200g', qtyPerCell: [1, 1], holdDays: 20 },
    price: { base: 1600, season: P_PULSE, volatility: 0.1 },
    noteKo: '꼬투리가 누렇게 마르면 거둔다. 콩나물 시루에도 앉힌다.',
    noteEn: 'Harvest when the pods dry yellow. They also go into the sprouting jar.',
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
    harvest: { itemId: 'crop_lions_mane', nameKo: '노루궁뎅이 한 송이 (200g)', nameEn: 'Lion\'s mane, one head (200g)', qtyPerCell: [1, 2], repeat: { everyDays: 20, times: 1 }, holdDays: 2 },
    price: { base: 5000, season: P_SHIITAKE, volatility: 0.1 }, rebalance: 0.85,
    noteKo: '흰 털이 늘어진 공 모양 버섯. 습도를 높게 지켜야 돋는다 — 전복 · 관자 버터구이에 곁들인다.',
    noteEn: 'A ball of hanging white spines that only fruits in steady high humidity. Serve it with abalone or scallops seared in butter.',
  },
  {
    id: 'wood_ear', nameKo: '목이버섯', nameEn: 'Wood ear mushroom', category: 'mushroom', speedClass: 'leafy', rarity: 'uncommon',
    inMart: false, site: 'indoor', growMonths: ALL, water: 'high',
    starts: [setOf('wood_ear', ALL, 0.9, 60, 4000, '목이 배지 (1봉)', 'Wood ear block (one bag)')],
    harvest: { itemId: 'crop_wood_ear', nameKo: '생목이 한 팩 (150g)', nameEn: 'Fresh wood ear, a pack (150g)', qtyPerCell: [2, 3], repeat: { everyDays: 15, times: 2 }, holdDays: 3 },
    price: { base: 1500, season: P_SHIITAKE, volatility: 0.1 },
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
];

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
}

/** 수확물 아이템(등급 꼬리 포함) → 작물(본 수확 · 붉어진 것 · 중간 수확 모두) */
export function cropOfProduce(itemId: string): CropDef | undefined {
  return PRODUCE_BASE_IDS.get(itemId) ?? PRODUCE_BASE_IDS.get(parseProduceId(itemId).baseId);
}

/** 텃밭에서 거둔 것인가(등급 꼬리 포함) */
export function isFarmProduce(itemId: string): boolean {
  return !!cropOfProduce(itemId);
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
];

const SUPPLY_BY_ID = new Map(FARM_SUPPLIES.map((s) => [s.itemId, s]));
export function getFarmSupply(itemId: string): FarmSupplyDef | undefined {
  return SUPPLY_BY_ID.get(itemId);
}

/** 설비 → 농자재 아이템(걷어 내면 돌려준다) */
export function supplyOfFacility(f: FarmFacility): FarmSupplyDef | undefined {
  return FARM_SUPPLIES.find((s) => s.facility === f);
}
