/**
 * @file SkillDatabase.ts
 * @description 스킬 트리 데이터 (122차 골격 + 124차 증설) — 7카테고리 83노드 · **Σ 비용 = 정확히 200pt**.
 *
 * **200 등식(PROGRESSION_SURVIVAL_SPEC §2)**: 레벨당 1SP × MAX_LEVEL 200 = 200SP = 트리 총 비용 —
 * "만렙 = 전 스킬 마스터". 노드를 추가·수정할 땐 다른 노드 비용을 조정해 합을 200으로 유지한다
 * (파일 하단 dev assert가 어긋나면 콘솔 경고).
 *
 * 카테고리·루트 설계(사용자 지시 + 현 구현 기준 추천):
 *  - 낚시: 루트 = 캐스팅 거리 · 입질 감각(병렬). 라인 강도 → 드랙 제어, 입질 → 악천후/야간, 챔질 → 대물 운.
 *  - 채집·통발(기타 추천 카테고리): 루트 = 채집 눈 · 매듭. 눈 → 문어 붙잡기, 매듭 → 미끼 절약 → 통발 운.
 *  - 경제: 루트 = 흥정. → 대량 구매 덤 / 단골 어판장. 토지·주식·식당 마진은 상위(시스템 예정).
 *  - 운전: 루트 = 달리기. → 자전거 속도 → 자동차 해금(예정) / 자전거 지구력 / 맨발 달리기(독립).
 *  - 생활: 루트 = 체력 · 힘(병렬). 체력 → 추위 내성 / 피로 회복 / 평형감각(미끄러짐) / 손질·요리 손.
 *  - 농사: 카테고리 잠금(농장 경영 S8 착수 시 활성) — 트리는 열람만.
 *  - 제작(124차): 카테고리 잠금(U '제작' 탭 — P7 구현 시 활성) — 트리는 열람만.
 *
 * ⚠ 배치 제약(SkillTreePanel): 티어는 0~3(열 4개 고정) · **티어당 노드 ≤ 6**(6일 때 행 간격 자동 압축).
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
  {
    // 129차 P7 — U 창 '제작' 탭 + 고급 제작대가 들어오면서 잠금 해제.
    id: 'crafting', nameKo: '제작', nameEn: 'Crafting', descKo: '채비·루어·통발·구급품·로드 빌딩', descEn: 'Rigs, lures, traps, first-aid supplies and rod building',
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
  // ── 낚시 124차 증설 (+7노드 18pt — 캐스팅 산포·바람은 스펙 §3 배선 예정) ──
  { id: 'fish_scatter', category: 'fishing', nameKo: '정투', nameEn: 'Pinpoint Cast', descKo: '착수 산포 반경 -22%/랭크 · 1랭크부터 조준 홀드 가이드', descEn: 'Landing scatter radius -22% per rank · aim-hold guide from rank 1', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 1 }], effect: mult('cast_scatter', -0.22), wired: true },
  { id: 'fish_spool', category: 'fishing', nameKo: '스풀 컨트롤', nameEn: 'Spool Control', descKo: '라인 트러블 확률 -25%/랭크', descEn: 'Line trouble chance -25% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 2 }], effect: mult('spool_trouble', -0.25), wired: false },
  { id: 'fish_surf', category: 'fishing', nameKo: '원투 숙련', nameEn: 'Surf Casting', descKo: '원투 비거리 +5%/랭크 · 바닥 감지 표시', descEn: 'Surf casting distance +5% per rank · bottom detection readout', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 2 }], effect: mult('surf_distance', 0.05), wired: false },
  { id: 'fish_wind', category: 'fishing', nameKo: '바람 읽기', nameEn: 'Wind Reading', descKo: '바람 영향 보정 +10%/랭크 · 편향 화살표 표시', descEn: 'Wind effect compensation +10% per rank · bias arrow display', tier: 3, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_scatter', rank: 1 }], effect: add('wind_comp', 0.10), wired: true },
  { id: 'fish_jig', category: 'fishing', nameKo: '지깅 숙련', nameEn: 'Jigging', descKo: '저킹 효율 +6%/랭크 · 최종 랭크 = 고속 저킹 콤보', descEn: 'Jerking efficiency +6% per rank · final rank unlocks the fast-jerk combo', tier: 3, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_lure', rank: 1 }], effect: mult('jig_efficiency', 0.06), wired: false },
  { id: 'fish_egi', category: 'fishing', nameKo: '에깅 숙련', nameEn: 'Eging', descKo: '에기 폴 자세 안정 +6%/랭크 · 최종 랭크 = 샤크리 2단', descEn: 'Egi fall stability +6% per rank · final rank unlocks the two-stage shakuri', tier: 3, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_lure', rank: 1 }], effect: mult('egi_stability', 0.06), wired: false },
  { id: 'fish_salvage', category: 'fishing', nameKo: '원줄 절약', nameEn: 'Rig Salvage', descKo: '채비 유실 시 회수 확률 +15%/랭크', descEn: 'Chance to recover lost rig parts +15% per rank', tier: 3, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_line', rank: 1 }], effect: add('rig_salvage', 0.15), wired: false },

  // ───────────── 채집 · 통발 ─────────────
  { id: 'gath_eye', category: 'gathering', nameKo: '채집 눈', nameEn: "Gleaner's Eye", descKo: '채집 스팟 발견 반경 +10%/랭크', descEn: 'Forage spot detection radius +10% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('forage_radius', 0.10), wired: true },
  { id: 'gath_knot', category: 'gathering', nameKo: '매듭법', nameEn: 'Knot Craft', descKo: '통발 분실 위험 -20%/랭크', descEn: 'Trap loss risk -20% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('trap_loss', -0.20), wired: true },
  { id: 'gath_hands', category: 'gathering', nameKo: '단단한 손', nameEn: 'Steady Hands', descKo: '맨손 채집 부상 확률 -25%/랭크', descEn: 'Bare-hand injury chance -25% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_eye', rank: 1 }], effect: mult('hand_injury', -0.25), wired: true },
  { id: 'gath_octo', category: 'gathering', nameKo: '문어 붙잡기', nameEn: 'Octopus Grip', descKo: '문어 도주 확률 -15%/랭크', descEn: 'Octopus escape chance -15% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_hands', rank: 1 }], effect: mult('octopus_escape', -0.15), wired: true },
  { id: 'gath_bait', category: 'gathering', nameKo: '미끼 절약', nameEn: 'Bait Economy', descKo: '통발 미끼 지속 +15%/랭크', descEn: 'Trap bait lasts +15% longer per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_knot', rank: 1 }], effect: mult('trap_bait_duration', 0.15), wired: false },
  { id: 'gath_trapluck', category: 'gathering', nameKo: '통발 운', nameEn: 'Trap Luck', descKo: '통발 포획 시도 +1/랭크', descEn: 'Trap catch attempts +1 per rank', tier: 2, maxRank: 2, costPerRank: 2, requires: [{ id: 'gath_bait', rank: 1 }], effect: add('trap_attempts', 1), wired: false },
  // ── 채집·통발 124차 증설 (+4노드 9pt) ──
  { id: 'gath_tide', category: 'gathering', nameKo: '물때 감각', nameEn: 'Tide Sense', descKo: '간조 채집 보너스 +8%/랭크', descEn: 'Low-tide foraging bonus +8% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_eye', rank: 1 }], effect: mult('forage_tide', 0.08), wired: false },
  { id: 'gath_harvest', category: 'gathering', nameKo: '통발 회수 요령', nameEn: 'Careful Harvest', descKo: '통발 회수물 신선도 +10%/랭크', descEn: 'Trap harvest freshness +10% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_knot', rank: 1 }], effect: mult('trap_harvest_fresh', 0.10), wired: false },
  { id: 'gath_lantern', category: 'gathering', nameKo: '헤드랜턴 효율', nameEn: 'Lantern Reach', descKo: '야간 채집 랜턴 반경 +12%/랭크', descEn: 'Night foraging lantern radius +12% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_eye', rank: 2 }], effect: mult('lantern_range', 0.12), wired: false },
  { id: 'gath_speed', category: 'gathering', nameKo: '채집 손놀림', nameEn: 'Quick Hands', descKo: '채집 홀드 속도 +8%/랭크 · 피로 -6%', descEn: 'Foraging hold speed +8% per rank · fatigue -6%', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'gath_hands', rank: 1 }], effect: mult('forage_speed', 0.08), wired: true },

  // ───────────── 경제 ─────────────
  { id: 'eco_haggle', category: 'economy', nameKo: '흥정의 달인', nameEn: 'Master Haggler', descKo: '상점 판매가 +3%/랭크 · 구매가 -3%/랭크', descEn: 'Shop sell price +3% and buy price -3% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('sell_price', 0.03), wired: true },
  { id: 'eco_bulk', category: 'economy', nameKo: '대량 구매', nameEn: 'Bulk Buyer', descKo: '활어·선어 대량 구매 시 +5%/랭크 덤', descEn: '+5% extra per rank when buying fish in bulk', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'eco_haggle', rank: 1 }], effect: mult('bulk_bonus', 0.05), wired: false },
  { id: 'eco_regular', category: 'economy', nameKo: '어판장 단골', nameEn: 'Market Regular', descKo: '어판장 매입가 +2%/랭크', descEn: 'Fish-market buying price +2% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'eco_haggle', rank: 2 }], effect: mult('sell_price', 0.02), wired: true },
  { id: 'eco_market', category: 'economy', nameKo: '시세 읽기', nameEn: 'Market Eye', descKo: '경락 시세 변동 상세 표시', descEn: 'Detailed auction price trends', tier: 2, maxRank: 1, costPerRank: 1, requires: [{ id: 'eco_regular', rank: 1 }], effect: add('market_eye', 1), wired: false },
  { id: 'eco_land', category: 'economy', nameKo: '토지 거래', nameEn: 'Land Dealer', descKo: '토지 매입·매도 이익 +5%/랭크 (토지 거래 예정)', descEn: 'Land buy/sell profit +5% per rank (land trade planned)', tier: 2, maxRank: 2, costPerRank: 2, requires: [{ id: 'eco_bulk', rank: 1 }], effect: mult('land_deal', 0.05), wired: false },
  { id: 'eco_stock', category: 'economy', nameKo: '주식 투자', nameEn: 'Stock Investor', descKo: '주식 시장 해금 (상세 구현 예정)', descEn: 'Unlocks the stock market (detailed later)', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'eco_market', rank: 1 }], effect: add('stock_insight', 1), wired: false },
  { id: 'eco_restaurant', category: 'economy', nameKo: '식당 마진', nameEn: 'Restaurant Margin', descKo: '식당 판매 마진 +4%/랭크 (식당 경영 예정)', descEn: 'Restaurant margin +4% per rank (restaurant management planned)', tier: 3, maxRank: 2, costPerRank: 2, requires: [{ id: 'eco_regular', rank: 2 }], effect: mult('restaurant_margin', 0.04), wired: false },
  // ── 경제 124차 증설 (+3노드 6pt) ──
  { id: 'eco_ledger', category: 'economy', nameKo: '장부 정리', nameEn: 'Bookkeeping', descKo: '수수료·유지비 -8%/랭크', descEn: 'Fees and upkeep -8% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'eco_haggle', rank: 2 }], effect: mult('ledger_fees', -0.08), wired: false },
  { id: 'eco_auction', category: 'economy', nameKo: '경매 배짱', nameEn: 'Auction Nerve', descKo: '경매 낙찰 보너스 +4%/랭크', descEn: 'Auction settlement bonus +4% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'eco_regular', rank: 1 }], effect: mult('auction_bonus', 0.04), wired: false },
  { id: 'eco_storage', category: 'economy', nameKo: '창고 관리', nameEn: 'Storage Master', descKo: '보관 슬롯 +2/랭크', descEn: 'Storage slots +2 per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'eco_bulk', rank: 1 }], effect: add('storage_slots', 2), wired: false },

  // ───────────── 운전 · 이동 ─────────────
  { id: 'drv_run', category: 'driving', nameKo: '달리기', nameEn: 'Runner', descKo: '도보 이동 속도 +8%/랭크', descEn: 'Walking speed +8% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('run_speed', 0.08), wired: true },
  { id: 'drv_barefoot', category: 'driving', nameKo: '맨발 달리기', nameEn: 'Barefoot Runner', descKo: '모래·갯바위에서도 속도 유지', descEn: 'Keep your speed on sand and rocks', tier: 0, maxRank: 1, costPerRank: 1, requires: [], effect: add('barefoot', 1), wired: false },
  { id: 'drv_bike', category: 'driving', nameKo: '자전거 숙련', nameEn: 'Cyclist', descKo: '자전거 속도 +10%/랭크', descEn: 'Bicycle speed +10% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'drv_run', rank: 1 }], effect: mult('bike_speed', 0.10), wired: true },
  { id: 'drv_bikefat', category: 'driving', nameKo: '자전거 지구력', nameEn: 'Bike Endurance', descKo: '자전거 피로 누적 -10%/랭크', descEn: 'Bicycle fatigue -10% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'drv_run', rank: 1 }], effect: mult('bike_fatigue', -0.10), wired: false },
  { id: 'drv_car', category: 'driving', nameKo: '자동차 운전', nameEn: 'Driver', descKo: '자동차 해금 (상세 구현 예정)', descEn: 'Unlocks the car (detailed later)', tier: 2, maxRank: 1, costPerRank: 3, requires: [{ id: 'drv_bike', rank: 2 }], effect: add('car_unlock', 1), wired: false },
  { id: 'drv_boat', category: 'driving', nameKo: '보트 조종', nameEn: 'Boat Handling', descKo: '개인 보트 출조 해금 (선박 면허 필요)', descEn: 'Unlocks personal boat trips (needs boat licence)', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'drv_car', rank: 1 }], effect: add('boat_unlock', 1), wired: false },
  // ── 운전·이동 124차 증설 (+4노드 7pt) ──
  { id: 'drv_nightride', category: 'driving', nameKo: '야간 주행', nameEn: 'Night Rider', descKo: '야간 이동 페널티 -25%/랭크', descEn: 'Night travel penalty -25% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'drv_run', rank: 2 }], effect: mult('night_move', -0.25), wired: false },
  { id: 'drv_cargo', category: 'driving', nameKo: '짐받이 확장', nameEn: 'Cargo Rack', descKo: '자전거 적재 슬롯 +1/랭크', descEn: 'Bicycle cargo slots +1 per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'drv_bike', rank: 1 }], effect: add('cargo_slots', 1), wired: false },
  { id: 'drv_motion', category: 'driving', nameKo: '멀미 내성', nameEn: 'Iron Stomach', descKo: '이동 중 피로 가중 -20%', descEn: 'Fatigue gain while travelling -20%', tier: 2, maxRank: 1, costPerRank: 1, requires: [{ id: 'drv_bikefat', rank: 1 }], effect: mult('motion_fatigue', -0.20), wired: false },
  { id: 'drv_theory', category: 'driving', nameKo: '운전 이론', nameEn: 'Traffic Theory', descKo: '자동차·보트 면허 실기 판정 완화', descEn: 'Easier practical exams for car and boat licences', tier: 3, maxRank: 1, costPerRank: 2, requires: [{ id: 'drv_car', rank: 1 }], effect: add('license_theory', 1), wired: false },

  // ───────────── 생활 ─────────────
  { id: 'life_stamina', category: 'life', nameKo: '체력', nameEn: 'Stamina', descKo: '최대 체력 +10/랭크', descEn: 'Max stamina +10 per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: add('stamina_max', 10), wired: true },
  { id: 'life_strength', category: 'life', nameKo: '힘', nameEn: 'Strength', descKo: '근력 +1/랭크 — 파이팅 견인·캐스팅', descEn: 'Strength +1 per rank — fight pulling and casting', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: add('strength', 1), wired: false },
  { id: 'life_recover', category: 'life', nameKo: '회복력', nameEn: 'Recovery', descKo: '피로 회복 속도 +10%/랭크', descEn: 'Fatigue recovery +10% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'life_stamina', rank: 1 }], effect: mult('fatigue_recovery', 0.10), wired: true },
  { id: 'life_balance', category: 'life', nameKo: '평형감각', nameEn: 'Balance', descKo: '갯바위 미끄러짐 확률 -20%/랭크', descEn: 'Rock-slip chance -20% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_strength', rank: 1 }], effect: mult('balance', -0.20), wired: true },
  { id: 'life_cold', category: 'life', nameKo: '추위 내성', nameEn: 'Cold Resistance', descKo: '야간·겨울 피로 누적 -10%/랭크', descEn: 'Night/winter fatigue -10% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_recover', rank: 1 }], effect: mult('cold_resist', -0.10), wired: true },
  { id: 'life_fillet', category: 'life', nameKo: '손질 손', nameEn: 'Fillet Hands', descKo: '회뜨기 수율 +3%/랭크', descEn: 'Fillet yield +3% per rank', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'life_strength', rank: 1 }], effect: mult('fillet_yield', 0.03), wired: true },
  { id: 'life_cook', category: 'life', nameKo: '요리 손', nameEn: "Cook's Hands", descKo: '요리 품질 +5%/랭크 (불요리 예정)', descEn: 'Cooking quality +5% per rank (fire cooking planned)', tier: 3, maxRank: 2, costPerRank: 2, requires: [{ id: 'life_fillet', rank: 2 }], effect: mult('cooking_quality', 0.05), wired: false },
  // ── 생활 124차 증설 (+6노드 14pt — 생존 지표(P2) 소비 예정) ──
  { id: 'life_hunger', category: 'life', nameKo: '소식가', nameEn: 'Light Eater', descKo: '허기 소모 -8%/랭크', descEn: 'Hunger drain -8% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_stamina', rank: 1 }], effect: mult('hunger_drain', -0.08), wired: true },
  { id: 'life_thirst', category: 'life', nameKo: '수분 관리', nameEn: 'Hydration', descKo: '수분 소모 -8%/랭크', descEn: 'Hydration drain -8% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_stamina', rank: 1 }], effect: mult('thirst_drain', -0.08), wired: true },
  { id: 'life_sleep', category: 'life', nameKo: '쾌면', nameEn: 'Sound Sleeper', descKo: '침대 회복량 +10%/랭크', descEn: 'Bed rest recovery +10% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_recover', rank: 1 }], effect: mult('sleep_recovery', 0.10), wired: true },
  { id: 'life_immune', category: 'life', nameKo: '면역력', nameEn: 'Immunity', descKo: '상태이상 발생 확률 -8%/랭크 · 최종 랭크 = 감기→독감 진행 반감', descEn: 'Status effect chance -8% per rank · final rank halves cold→flu progression', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'life_recover', rank: 2 }], effect: mult('immunity', -0.08), wired: true },
  { id: 'life_firstaid', category: 'life', nameKo: '응급처치', nameEn: 'First Aid', descKo: '붕대·부목 재발률 -10%p/랭크 · 최종 랭크 = 출혈 자가 지혈 1회/일', descEn: 'Bandage/splint relapse -10%p per rank · final rank self-staunches bleeding once a day', tier: 3, maxRank: 3, costPerRank: 1, requires: [{ id: 'life_immune', rank: 1 }], effect: add('firstaid', 0.10), wired: false },
  { id: 'life_hygiene', category: 'life', nameKo: '위생 관념', nameEn: 'Hygiene', descKo: '식중독 확률 -20%/랭크', descEn: 'Food poisoning chance -20% per rank', tier: 3, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_immune', rank: 1 }], effect: mult('hygiene', -0.20), wired: false },

  // ───────────── 농사 (카테고리 잠금) ─────────────
  { id: 'farm_till', category: 'farming', nameKo: '개간', nameEn: 'Tilling', descKo: '개간·밭갈이 속도 +15%/랭크', descEn: 'Tilling speed +15% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('till_speed', 0.15), wired: false },
  { id: 'farm_water', category: 'farming', nameKo: '물주기', nameEn: 'Watering', descKo: '물주기 효율 +20%/랭크', descEn: 'Watering efficiency +20% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('water_efficiency', 0.20), wired: false },
  { id: 'farm_yield', category: 'farming', nameKo: '수확량', nameEn: 'Harvest Yield', descKo: '작물 수확량 +10%/랭크', descEn: 'Crop yield +10% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'farm_till', rank: 1 }], effect: mult('crop_yield', 0.10), wired: false },
  { id: 'farm_seed', category: 'farming', nameKo: '씨앗 회수', nameEn: 'Seed Saver', descKo: '수확 시 씨앗 회수 확률 +15%/랭크', descEn: 'Seed recovery chance on harvest +15% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_water', rank: 1 }], effect: add('seed_saver', 0.15), wired: false },
  { id: 'farm_fert', category: 'farming', nameKo: '비료 효율', nameEn: 'Fertilizer', descKo: '비료 효과 +20%/랭크', descEn: 'Fertilizer effect +20% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_yield', rank: 1 }], effect: mult('fertilizer', 0.20), wired: false },
  { id: 'farm_green', category: 'farming', nameKo: '온실', nameEn: 'Greenhouse', descKo: '온실 해금 — 계절 무관 재배', descEn: 'Unlocks the greenhouse — grow in any season', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'farm_fert', rank: 1 }, { id: 'farm_seed', rank: 1 }], effect: add('greenhouse', 1), wired: false },
  // ── 농사 124차 증설 (+3노드 6pt — 농장 경영(S8) 착수 시 배선·해제) ──
  { id: 'farm_sprout', category: 'farming', nameKo: '파종 감각', nameEn: 'Sowing Sense', descKo: '발아율 +8%/랭크', descEn: 'Germination rate +8% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_till', rank: 1 }], effect: mult('sprout_rate', 0.08), wired: false },
  { id: 'farm_pest', category: 'farming', nameKo: '해충 방제', nameEn: 'Pest Control', descKo: '병충해 확률 -15%/랭크', descEn: 'Pest/disease chance -15% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_yield', rank: 1 }], effect: mult('pest_resist', -0.15), wired: false },
  { id: 'farm_season', category: 'farming', nameKo: '절기 독해', nameEn: 'Almanac Reading', descKo: '파종 적기 캘린더 표시', descEn: 'Shows the sowing-season calendar', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_sprout', rank: 1 }], effect: add('farm_calendar', 1), wired: false },

  // ───────────── 제작 (124차 신설 — 카테고리 잠금: U '제작' 탭(P7) 구현 시 활성) ─────────────
  { id: 'craft_knot', category: 'crafting', nameKo: '매듭 숙련', nameEn: 'Knot Mastery', descKo: '채비 제작 성공률 +6%/랭크 · 강도 +4%', descEn: 'Rig crafting success +6% per rank · strength +4%', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('craft_success', 0.06), wired: true },
  { id: 'craft_tools', category: 'crafting', nameKo: '공구 관리', nameEn: 'Tool Care', descKo: '제작 재료 소모 -6%/랭크', descEn: 'Crafting material use -6% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('craft_material', -0.06), wired: true },
  { id: 'craft_sinker', category: 'crafting', nameKo: '봉돌 주조', nameEn: 'Sinker Casting', descKo: '봉돌 재료 -10%', descEn: 'Sinker material cost -10%', tier: 1, maxRank: 1, costPerRank: 1, requires: [{ id: 'craft_knot', rank: 1 }], effect: mult('sinker_material', -0.10), wired: true },
  { id: 'craft_chum', category: 'crafting', nameKo: '밑밥 블렌딩', nameEn: 'Chum Blending', descKo: '배합 슬롯 +1/랭크 · 동조율 +4%', descEn: 'Chum mix slots +1 per rank · sync +4%', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'craft_knot', rank: 1 }], effect: add('chum_slots', 1), wired: false },
  { id: 'craft_paint', category: 'crafting', nameKo: '루어 도색', nameEn: 'Lure Painting', descKo: '커스텀 루어 성능 편차 축소', descEn: 'Narrows custom lure performance variance', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'craft_tools', rank: 1 }], effect: add('lure_tuning', 1), wired: true },
  { id: 'craft_medic', category: 'crafting', nameKo: '구급품 제작', nameEn: 'Field Medic', descKo: '붕대·부목·상비약 품질 +8%/랭크', descEn: 'Bandage/splint/medicine quality +8% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'craft_tools', rank: 1 }], effect: mult('medic_quality', 0.08), wired: true },
  { id: 'craft_egi', category: 'crafting', nameKo: '에기 튜닝', nameEn: 'Egi Tuning', descKo: '에기 침강 밸런스 조정폭 확장', descEn: 'Wider egi sink-balance tuning range', tier: 2, maxRank: 1, costPerRank: 1, requires: [{ id: 'craft_paint', rank: 1 }], effect: add('egi_tuning', 1), wired: true },
  { id: 'craft_trap', category: 'crafting', nameKo: '통발 제작', nameEn: 'Trap Making', descKo: '통발 내구 +8%/랭크 · 최종 랭크 = 개량 통발 도면', descEn: 'Trap durability +8% per rank · final rank unlocks the improved trap blueprint', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'craft_knot', rank: 2 }], effect: mult('trap_durability', 0.08), wired: true },
  { id: 'craft_bp', category: 'crafting', nameKo: '도면 독해', nameEn: 'Blueprint Literacy', descKo: '희귀 도면 해독 등급 +1', descEn: 'Rare blueprint literacy grade +1', tier: 2, maxRank: 1, costPerRank: 1, requires: [{ id: 'craft_tools', rank: 2 }], effect: add('blueprint_grade', 1), wired: false },
  { id: 'craft_batch', category: 'crafting', nameKo: '인내심', nameEn: 'Patience', descKo: '연속 제작 배치 +2', descEn: 'Consecutive crafting batch +2', tier: 2, maxRank: 1, costPerRank: 1, requires: [{ id: 'craft_medic', rank: 1 }], effect: add('craft_batch', 2), wired: false },
  { id: 'craft_rod', category: 'crafting', nameKo: '로드 빌딩', nameEn: 'Rod Building', descKo: '커스텀 로드 제작 해금 (경도·길이 선택)', descEn: 'Unlocks custom rod building (choose action and length)', tier: 3, maxRank: 1, costPerRank: 2, requires: [{ id: 'craft_bp', rank: 1 }], effect: add('rod_building', 1), wired: true },
  { id: 'craft_reel', category: 'crafting', nameKo: '릴 커스텀', nameEn: 'Reel Custom', descKo: '릴 기어비 튜닝 해금폭 확장', descEn: 'Wider reel gear-ratio tuning range', tier: 3, maxRank: 2, costPerRank: 1, requires: [{ id: 'craft_bp', rank: 1 }], effect: add('reel_tuning', 1), wired: true },
];

/** 스킬 트리 총 비용 정본 — MAX_LEVEL(200) × 레벨당 1SP = 200pt ("만렙 = 전 스킬 마스터" 등식) */
export const SKILL_TREE_TOTAL_PT = 200;

// ── 무결성 검사 (모듈 로드 시 1회 — 어긋나면 콘솔 경고. 200 등식·선행 참조·티어 배치 제약) ──
{
  const total = SKILL_DATABASE.reduce((s, d) => s + d.maxRank * d.costPerRank, 0);
  if (total !== SKILL_TREE_TOTAL_PT) {
    console.warn(`[SkillDatabase] 트리 총 비용 ${total}pt ≠ ${SKILL_TREE_TOTAL_PT}pt — 노드 비용을 조정해 등식을 복구할 것`);
  }
  const ids = new Set(SKILL_DATABASE.map((d) => d.id));
  const perTier = new Map<string, number>();
  for (const d of SKILL_DATABASE) {
    for (const q of d.requires) {
      if (!ids.has(q.id)) console.warn(`[SkillDatabase] ${d.id} 선행 '${q.id}' 미존재 (고아 참조)`);
    }
    if (d.tier < 0 || d.tier > 3) console.warn(`[SkillDatabase] ${d.id} tier ${d.tier} — 패널 열은 0~3만 지원`);
    const k = `${d.category}:${d.tier}`;
    perTier.set(k, (perTier.get(k) ?? 0) + 1);
  }
  for (const [k, n] of perTier) {
    if (n > 6) console.warn(`[SkillDatabase] ${k} 티어에 ${n}노드 — 패널 세로 수용(≤6) 초과`);
  }
}

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
