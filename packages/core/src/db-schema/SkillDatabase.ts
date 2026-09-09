/**
 * @file SkillDatabase.ts
 * @description 스킬 트리 데이터 (122차) — 6카테고리 · 루트 1~2개 → 연관 확장 · 미구현 시스템은 `wired: false`/카테고리 잠금.
 *
 * 카테고리·루트 설계(사용자 지시 + 현 구현 기준 추천):
 *  - 낚시: 루트 = 캐스팅 거리 · 입질 감각(병렬). 라인 강도 → 드랙 제어, 입질 → 악천후/야간, 챔질 → 대물 운.
 *  - 채집·통발(기타 추천 카테고리): 루트 = 채집 눈 · 매듭. 눈 → 문어 붙잡기, 매듭 → 미끼 절약 → 통발 운.
 *  - 경제: 루트 = 흥정. → 대량 구매 덤 / 단골 어판장. 토지·주식·식당 마진은 상위(시스템 예정).
 *  - 운전: 루트 = 달리기. → 자전거 속도 → 자동차 해금(예정) / 자전거 지구력 / 맨발 달리기(독립).
 *  - 생활: 루트 = 체력 · 힘(병렬). 체력 → 추위 내성 / 피로 회복 / 평형감각(미끄러짐) / 손질·요리 손.
 *  - 농사: 카테고리 잠금(농장 경영 S8 착수 시 활성) — 트리는 열람만.
 */

import type { SkillCategoryDef, SkillCategoryId, SkillDef, SkillEffectKey, SkillRanks } from '../types/Skills.js';

export const SKILL_CATEGORIES: SkillCategoryDef[] = [
  { id: 'fishing', nameKo: '낚시', nameEn: 'Fishing', descKo: '캐스팅·입질·파이팅·보관 — 낚시 루프 전반', descEn: 'Casting, bites, fighting and storage — the whole fishing loop' },
  { id: 'gathering', nameKo: '채집 · 통발', nameEn: 'Gathering · Traps', descKo: '해루질 발견·도구 숙련·통발 운용', descEn: 'Gleaning, tool handling and trap operation' },
  { id: 'economy', nameKo: '경제', nameEn: 'Economy', descKo: '흥정·거래·시세·토지·주식', descEn: 'Haggling, trade, markets, land and stocks' },
  { id: 'driving', nameKo: '운전 · 이동', nameEn: 'Driving · Travel', descKo: '달리기·자전거·자동차·보트', descEn: 'Running, bicycle, car and boat' },
  { id: 'life', nameKo: '생활', nameEn: 'Life', descKo: '체력·힘·피로·평형·손질·요리', descEn: 'Stamina, strength, fatigue, balance, filleting and cooking' },
  {
    id: 'farming', nameKo: '농사', nameEn: 'Farming', descKo: '개간·작물·물·비료·온실', descEn: 'Tilling, crops, water, fertilizer and greenhouse',
    locked: true, lockedNoteKo: '농장 경영(홈타운 텃밭) 착수 시 활성화됩니다 — 지금은 열람만', lockedNoteEn: 'Unlocks when farm management (home garden) arrives — view only for now',
  },
];

const mult = (key: SkillEffectKey, perRank: number): SkillDef['effect'] => ({ key, perRank, mode: 'mult' });
const add = (key: SkillEffectKey, perRank: number): SkillDef['effect'] => ({ key, perRank, mode: 'add' });

export const SKILL_DATABASE: SkillDef[] = [
  // ───────────── 낚시 ─────────────
  { id: 'fish_cast', category: 'fishing', nameKo: '롱캐스트', nameEn: 'Long Cast', descKo: '캐스팅 비거리 +6%/랭크', descEn: 'Casting distance +6% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('cast_distance', 0.06), wired: true },
  { id: 'fish_bite', category: 'fishing', nameKo: '입질 감각', nameEn: 'Bite Sense', descKo: '입질 확률 +4%/랭크', descEn: 'Bite chance +4% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('bite_chance', 0.04), wired: true },
  { id: 'fish_line', category: 'fishing', nameKo: '라인 관리', nameEn: 'Line Care', descKo: '원줄·목줄 인장 강도 +5%/랭크', descEn: 'Line and leader strength +5% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 1 }], effect: mult('line_strength', 0.05), wired: false },
  { id: 'fish_weather', category: 'fishing', nameKo: '궂은날 조사', nameEn: 'Foul-Weather Angler', descKo: '비·강풍일 때 입질 확률 +8%/랭크', descEn: 'Bite chance +8% per rank in rain or strong wind', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_bite', rank: 1 }], effect: mult('weather_bite', 0.08), wired: true },
  { id: 'fish_night', category: 'fishing', nameKo: '야간 눈', nameEn: 'Night Eyes', descKo: '야간 입질 확률 +5%/랭크', descEn: 'Night bite chance +5% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_bite', rank: 2 }], effect: mult('night_bite', 0.05), wired: true },
  { id: 'fish_fresh', category: 'fishing', nameKo: '보관 요령', nameEn: 'Keeping Fresh', descKo: '어획물 신선도 유지 시간 +10%/랭크', descEn: 'Catch freshness lasts +10% longer per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 1 }], effect: mult('freshness_time', 0.10), wired: false },
  { id: 'fish_drag', category: 'fishing', nameKo: '드랙 제어', nameEn: 'Drag Control', descKo: '파이팅 텐션 저항 +6%/랭크', descEn: 'Fight tension resistance +6% per rank', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_line', rank: 1 }], effect: mult('drag_control', 0.06), wired: false },
  { id: 'fish_chum', category: 'fishing', nameKo: '밑밥 감각', nameEn: 'Chum Sense', descKo: '밑밥 동조율 +5%/랭크', descEn: 'Chum sync +5% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_bite', rank: 1 }], effect: mult('chum_sync', 0.05), wired: false },
  { id: 'fish_lure', category: 'fishing', nameKo: '루어 액션', nameEn: 'Lure Action', descKo: '루어 액션 입질 배율 +5%/랭크', descEn: 'Lure action bite multiplier +5% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 2 }], effect: mult('lure_action', 0.05), wired: false },
  { id: 'fish_hook', category: 'fishing', nameKo: '챔질 타이밍', nameEn: 'Hook Set', descKo: '1·2단계 챔질 성공률 +3%p/랭크', descEn: 'Stage 1–2 hook-set success +3%p per rank', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_night', rank: 1 }], effect: add('hook_set', 0.03), wired: false },
  { id: 'fish_tide', category: 'fishing', nameKo: '조석 해석', nameEn: 'Tide Reading', descKo: '피딩타임 예보 표시가 정확해진다', descEn: 'More accurate feeding-time forecast', tier: 3, maxRank: 1, costPerRank: 2, requires: [{ id: 'fish_chum', rank: 1 }], effect: add('tide_reading', 1), wired: false },
  { id: 'fish_bigluck', category: 'fishing', nameKo: '대물 운', nameEn: "Big One's Luck", descKo: '대형·희귀 개체 확률 +2%p/랭크', descEn: 'Large/rare individual chance +2%p per rank', tier: 3, maxRank: 2, costPerRank: 2, requires: [{ id: 'fish_hook', rank: 2 }], effect: add('big_fish_luck', 0.02), wired: false },

  // ───────────── 채집 · 통발 ─────────────
  { id: 'gath_eye', category: 'gathering', nameKo: '채집 눈', nameEn: "Gleaner's Eye", descKo: '채집 스팟 발견 반경 +10%/랭크', descEn: 'Forage spot detection radius +10% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('forage_radius', 0.10), wired: true },
  { id: 'gath_knot', category: 'gathering', nameKo: '매듭법', nameEn: 'Knot Craft', descKo: '통발 분실 위험 -20%/랭크', descEn: 'Trap loss risk -20% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('trap_loss', -0.20), wired: true },
  { id: 'gath_hands', category: 'gathering', nameKo: '단단한 손', nameEn: 'Steady Hands', descKo: '맨손 채집 부상 확률 -25%/랭크', descEn: 'Bare-hand injury chance -25% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_eye', rank: 1 }], effect: mult('hand_injury', -0.25), wired: true },
  { id: 'gath_octo', category: 'gathering', nameKo: '문어 붙잡기', nameEn: 'Octopus Grip', descKo: '문어 도주 확률 -15%/랭크', descEn: 'Octopus escape chance -15% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_hands', rank: 1 }], effect: mult('octopus_escape', -0.15), wired: true },
  { id: 'gath_bait', category: 'gathering', nameKo: '미끼 절약', nameEn: 'Bait Economy', descKo: '통발 미끼 지속 +15%/랭크', descEn: 'Trap bait lasts +15% longer per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_knot', rank: 1 }], effect: mult('trap_bait_duration', 0.15), wired: false },
  { id: 'gath_trapluck', category: 'gathering', nameKo: '통발 운', nameEn: 'Trap Luck', descKo: '통발 포획 시도 +1/랭크', descEn: 'Trap catch attempts +1 per rank', tier: 2, maxRank: 2, costPerRank: 2, requires: [{ id: 'gath_bait', rank: 1 }], effect: add('trap_attempts', 1), wired: false },

  // ───────────── 경제 ─────────────
  { id: 'eco_haggle', category: 'economy', nameKo: '흥정의 달인', nameEn: 'Master Haggler', descKo: '상점 판매가 +3%/랭크 · 구매가 -3%/랭크', descEn: 'Shop sell price +3% and buy price -3% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('sell_price', 0.03), wired: true },
  { id: 'eco_bulk', category: 'economy', nameKo: '대량 구매', nameEn: 'Bulk Buyer', descKo: '활어·선어 대량 구매 시 +5%/랭크 덤', descEn: '+5% extra per rank when buying fish in bulk', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'eco_haggle', rank: 1 }], effect: mult('bulk_bonus', 0.05), wired: false },
  { id: 'eco_regular', category: 'economy', nameKo: '어판장 단골', nameEn: 'Market Regular', descKo: '어판장 매입가 +2%/랭크', descEn: 'Fish-market buying price +2% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'eco_haggle', rank: 2 }], effect: mult('sell_price', 0.02), wired: true },
  { id: 'eco_market', category: 'economy', nameKo: '시세 읽기', nameEn: 'Market Eye', descKo: '경락 시세 변동 상세 표시', descEn: 'Detailed auction price trends', tier: 2, maxRank: 1, costPerRank: 1, requires: [{ id: 'eco_regular', rank: 1 }], effect: add('market_eye', 1), wired: false },
  { id: 'eco_land', category: 'economy', nameKo: '토지 거래', nameEn: 'Land Dealer', descKo: '토지 매입·매도 이익 +5%/랭크 (토지 거래 예정)', descEn: 'Land buy/sell profit +5% per rank (land trade planned)', tier: 2, maxRank: 2, costPerRank: 2, requires: [{ id: 'eco_bulk', rank: 1 }], effect: mult('land_deal', 0.05), wired: false },
  { id: 'eco_stock', category: 'economy', nameKo: '주식 투자', nameEn: 'Stock Investor', descKo: '주식 시장 해금 (상세 구현 예정)', descEn: 'Unlocks the stock market (detailed later)', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'eco_market', rank: 1 }], effect: add('stock_insight', 1), wired: false },
  { id: 'eco_restaurant', category: 'economy', nameKo: '식당 마진', nameEn: 'Restaurant Margin', descKo: '식당 판매 마진 +4%/랭크 (식당 경영 예정)', descEn: 'Restaurant margin +4% per rank (restaurant management planned)', tier: 3, maxRank: 2, costPerRank: 2, requires: [{ id: 'eco_regular', rank: 2 }], effect: mult('restaurant_margin', 0.04), wired: false },

  // ───────────── 운전 · 이동 ─────────────
  { id: 'drv_run', category: 'driving', nameKo: '달리기', nameEn: 'Runner', descKo: '도보 이동 속도 +8%/랭크', descEn: 'Walking speed +8% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('run_speed', 0.08), wired: true },
  { id: 'drv_barefoot', category: 'driving', nameKo: '맨발 달리기', nameEn: 'Barefoot Runner', descKo: '모래·갯바위에서도 속도 유지', descEn: 'Keep your speed on sand and rocks', tier: 0, maxRank: 1, costPerRank: 1, requires: [], effect: add('barefoot', 1), wired: false },
  { id: 'drv_bike', category: 'driving', nameKo: '자전거 숙련', nameEn: 'Cyclist', descKo: '자전거 속도 +10%/랭크', descEn: 'Bicycle speed +10% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'drv_run', rank: 1 }], effect: mult('bike_speed', 0.10), wired: true },
  { id: 'drv_bikefat', category: 'driving', nameKo: '자전거 지구력', nameEn: 'Bike Endurance', descKo: '자전거 피로 누적 -10%/랭크', descEn: 'Bicycle fatigue -10% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'drv_run', rank: 1 }], effect: mult('bike_fatigue', -0.10), wired: false },
  { id: 'drv_car', category: 'driving', nameKo: '자동차 운전', nameEn: 'Driver', descKo: '자동차 해금 (상세 구현 예정)', descEn: 'Unlocks the car (detailed later)', tier: 2, maxRank: 1, costPerRank: 3, requires: [{ id: 'drv_bike', rank: 2 }], effect: add('car_unlock', 1), wired: false },
  { id: 'drv_boat', category: 'driving', nameKo: '보트 조종', nameEn: 'Boat Handling', descKo: '개인 보트 출조 해금 (선박 면허 필요)', descEn: 'Unlocks personal boat trips (needs boat licence)', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'drv_car', rank: 1 }], effect: add('boat_unlock', 1), wired: false },

  // ───────────── 생활 ─────────────
  { id: 'life_stamina', category: 'life', nameKo: '체력', nameEn: 'Stamina', descKo: '최대 체력 +10/랭크', descEn: 'Max stamina +10 per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: add('stamina_max', 10), wired: false },
  { id: 'life_strength', category: 'life', nameKo: '힘', nameEn: 'Strength', descKo: '근력 +1/랭크 — 파이팅 견인·캐스팅', descEn: 'Strength +1 per rank — fight pulling and casting', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: add('strength', 1), wired: false },
  { id: 'life_recover', category: 'life', nameKo: '회복력', nameEn: 'Recovery', descKo: '피로 회복 속도 +10%/랭크', descEn: 'Fatigue recovery +10% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'life_stamina', rank: 1 }], effect: mult('fatigue_recovery', 0.10), wired: false },
  { id: 'life_balance', category: 'life', nameKo: '평형감각', nameEn: 'Balance', descKo: '갯바위 미끄러짐 확률 -20%/랭크', descEn: 'Rock-slip chance -20% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_strength', rank: 1 }], effect: mult('balance', -0.20), wired: true },
  { id: 'life_cold', category: 'life', nameKo: '추위 내성', nameEn: 'Cold Resistance', descKo: '야간·겨울 피로 누적 -10%/랭크', descEn: 'Night/winter fatigue -10% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_recover', rank: 1 }], effect: mult('cold_resist', -0.10), wired: false },
  { id: 'life_fillet', category: 'life', nameKo: '손질 손', nameEn: 'Fillet Hands', descKo: '회뜨기 수율 +3%/랭크', descEn: 'Fillet yield +3% per rank', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'life_strength', rank: 1 }], effect: mult('fillet_yield', 0.03), wired: false },
  { id: 'life_cook', category: 'life', nameKo: '요리 손', nameEn: "Cook's Hands", descKo: '요리 품질 +5%/랭크 (불요리 예정)', descEn: 'Cooking quality +5% per rank (fire cooking planned)', tier: 3, maxRank: 2, costPerRank: 2, requires: [{ id: 'life_fillet', rank: 2 }], effect: mult('cooking_quality', 0.05), wired: false },

  // ───────────── 농사 (카테고리 잠금) ─────────────
  { id: 'farm_till', category: 'farming', nameKo: '개간', nameEn: 'Tilling', descKo: '개간·밭갈이 속도 +15%/랭크', descEn: 'Tilling speed +15% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('till_speed', 0.15), wired: false },
  { id: 'farm_water', category: 'farming', nameKo: '물주기', nameEn: 'Watering', descKo: '물주기 효율 +20%/랭크', descEn: 'Watering efficiency +20% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('water_efficiency', 0.20), wired: false },
  { id: 'farm_yield', category: 'farming', nameKo: '수확량', nameEn: 'Harvest Yield', descKo: '작물 수확량 +10%/랭크', descEn: 'Crop yield +10% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'farm_till', rank: 1 }], effect: mult('crop_yield', 0.10), wired: false },
  { id: 'farm_seed', category: 'farming', nameKo: '씨앗 회수', nameEn: 'Seed Saver', descKo: '수확 시 씨앗 회수 확률 +15%/랭크', descEn: 'Seed recovery chance on harvest +15% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_water', rank: 1 }], effect: add('seed_saver', 0.15), wired: false },
  { id: 'farm_fert', category: 'farming', nameKo: '비료 효율', nameEn: 'Fertilizer', descKo: '비료 효과 +20%/랭크', descEn: 'Fertilizer effect +20% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_yield', rank: 1 }], effect: mult('fertilizer', 0.20), wired: false },
  { id: 'farm_green', category: 'farming', nameKo: '온실', nameEn: 'Greenhouse', descKo: '온실 해금 — 계절 무관 재배', descEn: 'Unlocks the greenhouse — grow in any season', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'farm_fert', rank: 1 }, { id: 'farm_seed', rank: 1 }], effect: add('greenhouse', 1), wired: false },
];

export function getSkillById(id: string): SkillDef | undefined {
  return SKILL_DATABASE.find((s) => s.id === id);
}

export function skillsOfCategory(cat: SkillCategoryId): SkillDef[] {
  return SKILL_DATABASE.filter((s) => s.category === cat);
}

/** 사용된 포인트 합 */
export function skillPointsSpent(ranks: SkillRanks): number {
  let sum = 0;
  for (const [id, r] of Object.entries(ranks)) {
    const d = getSkillById(id);
    if (d) sum += d.costPerRank * Math.max(0, Math.min(d.maxRank, r));
  }
  return sum;
}

/** 선행 조건 충족 여부 */
export function skillPrereqsMet(def: SkillDef, ranks: SkillRanks): boolean {
  return def.requires.every((q) => (ranks[q.id] ?? 0) >= q.rank);
}

/** 효과 배율 — 1 + Σ(perRank × rank) (mode 'mult'만) */
export function skillMult(ranks: SkillRanks, key: SkillEffectKey): number {
  let m = 1;
  for (const d of SKILL_DATABASE) {
    if (d.effect.key !== key || d.effect.mode !== 'mult') continue;
    m += d.effect.perRank * (ranks[d.id] ?? 0);
  }
  return Math.max(0, m);
}

/** 효과 가산 — Σ(perRank × rank) (mode 'add'만) */
export function skillBonus(ranks: SkillRanks, key: SkillEffectKey): number {
  let v = 0;
  for (const d of SKILL_DATABASE) {
    if (d.effect.key !== key || d.effect.mode !== 'add') continue;
    v += d.effect.perRank * (ranks[d.id] ?? 0);
  }
  return v;
}
