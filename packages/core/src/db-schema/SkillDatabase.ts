/**
 * @file SkillDatabase.ts
 * @description 스킬 트리 데이터 (122차 골격 · 124차 증설 · **130차 확장**) —
 * 7카테고리 **92노드**(유료 87 + 시너지 히든 5) · **Σ(유료) = 정확히 215pt**.
 *
 * **215 등식(130차 재정의)**: 레벨당 1SP × MAX_LEVEL 200 **+ 면허 보너스 15** = 215SP = 유료 노드 총 비용 —
 * **"만렙 + 전 면허 취득 = 전 스킬 마스터"**. 124차 등식(200)은 (a)(c) 노드를 넣으면서 우변을 늘려 갱신했다
 * (기존 노드 비용을 깎으면 이미 찍은 세이브의 사용 포인트가 어긋나므로 **예산을 늘리는 쪽**을 택했다).
 * 노드를 추가·수정할 땐 **다른 노드 비용이 아니라 등식 양변**을 함께 본다 — 파일 하단 검사가 경고한다.
 *
 * **시너지 히든 노드(130차 (e))는 비용 0** — 조합을 다 배우면 자동으로 열리는 보상이라 예산 밖이다.
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
 * ⚠ 배치 제약(SkillTreePanel): 티어는 0~3(열 4개 고정 — 패널 폭 788px에 5열이 안 들어간다) ·
 * **티어당 노드 ≤ 8**(130차 확장 — 6 초과부터 노드 높이가 같이 줄어든다).
 */

import { MAX_LEVEL } from '../types/Progression.js';
import { SKILL_POINTS_PER_LEVEL } from '../types/Skills.js';
import { profLevel, profScale } from '../types/Skills.js';
import type {
  SkillCategoryDef, SkillCategoryId, SkillDef, SkillEffectKey, SkillRanks,
  SkillUnlockCond, SkillUnlockCtx, SkillProficiency, SkillProficiencyDef, ProfActionKey,
} from '../types/Skills.js';

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
  { id: 'fish_lure', category: 'fishing', nameKo: '루어 액션', nameEn: 'Lure Action', descKo: '루어 액션 입질 배율 +5%/랭크', descEn: 'Lure action bite multiplier +5% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 2 }], effect: mult('lure_action', 0.05), wired: false, unlock: [{ kind: 'quest', value: 'M2-05' }] },
  { id: 'fish_hook', category: 'fishing', nameKo: '챔질 타이밍', nameEn: 'Hook Set', descKo: '1·2단계 챔질 성공률 +3%p/랭크', descEn: 'Stage 1–2 hook-set success +3%p per rank', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_night', rank: 1 }], effect: add('hook_set', 0.03), wired: false },
  { id: 'fish_tide', category: 'fishing', nameKo: '조석 해석', nameEn: 'Tide Reading', descKo: '피딩타임 예보 표시가 정확해진다', descEn: 'More accurate feeding-time forecast', tier: 3, maxRank: 1, costPerRank: 2, requires: [{ id: 'fish_chum', rank: 1 }], effect: add('tide_reading', 1), wired: false },
  { id: 'fish_bigluck', category: 'fishing', nameKo: '대물 운', nameEn: "Big One's Luck", descKo: '대형·희귀 개체 확률 +2%p/랭크', descEn: 'Large/rare individual chance +2%p per rank', tier: 3, maxRank: 2, costPerRank: 2, requires: [{ id: 'fish_hook', rank: 2 }], effect: add('big_fish_luck', 0.02), wired: false, unlock: [{ kind: 'level', value: 40 }, { kind: 'categoryRanks', category: 'fishing', value: 20 }] },
  // ── 낚시 124차 증설 (+7노드 18pt — 캐스팅 산포·바람은 스펙 §3 배선 예정) ──
  { id: 'fish_scatter', category: 'fishing', nameKo: '정투', nameEn: 'Pinpoint Cast', descKo: '착수 산포 반경 -22%/랭크 · 1랭크부터 조준 홀드 가이드', descEn: 'Landing scatter radius -22% per rank · aim-hold guide from rank 1', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 1 }], effect: mult('cast_scatter', -0.22), wired: true },
  { id: 'fish_spool', category: 'fishing', nameKo: '스풀 컨트롤', nameEn: 'Spool Control', descKo: '라인 트러블 확률 -25%/랭크', descEn: 'Line trouble chance -25% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 2 }], effect: mult('spool_trouble', -0.25), wired: false },
  { id: 'fish_surf', category: 'fishing', nameKo: '원투 숙련', nameEn: 'Surf Casting', descKo: '원투 비거리 +5%/랭크 · 바닥 감지 표시', descEn: 'Surf casting distance +5% per rank · bottom detection readout', tier: 2, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_cast', rank: 2 }], effect: mult('surf_distance', 0.05), wired: false, unlock: [{ kind: 'quest', value: 'M4-08' }] },
  { id: 'fish_wind', category: 'fishing', nameKo: '바람 읽기', nameEn: 'Wind Reading', descKo: '바람 영향 보정 +10%/랭크 · 편향 화살표 표시', descEn: 'Wind effect compensation +10% per rank · bias arrow display', tier: 3, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_scatter', rank: 1 }], effect: add('wind_comp', 0.10), wired: true },
  { id: 'fish_jig', category: 'fishing', nameKo: '지깅 숙련', nameEn: 'Jigging', descKo: '저킹 효율 +6%/랭크 · 최종 랭크 = 고속 저킹 콤보', descEn: 'Jerking efficiency +6% per rank · final rank unlocks the fast-jerk combo', tier: 3, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_lure', rank: 1 }], effect: mult('jig_efficiency', 0.06), wired: false, unlock: [{ kind: 'quest', value: 'M3-02' }] },
  { id: 'fish_egi', category: 'fishing', nameKo: '에깅 숙련', nameEn: 'Eging', descKo: '에기 폴 자세 안정 +6%/랭크 · 최종 랭크 = 샤크리 2단', descEn: 'Egi fall stability +6% per rank · final rank unlocks the two-stage shakuri', tier: 3, maxRank: 3, costPerRank: 1, requires: [{ id: 'fish_lure', rank: 1 }], effect: mult('egi_stability', 0.06), wired: false, unlock: [{ kind: 'quest', value: 'M4-09' }] },
  { id: 'fish_salvage', category: 'fishing', nameKo: '원줄 절약', nameEn: 'Rig Salvage', descKo: '채비 유실 시 회수 확률 +15%/랭크', descEn: 'Chance to recover lost rig parts +15% per rank', tier: 3, maxRank: 2, costPerRank: 1, requires: [{ id: 'fish_line', rank: 1 }], effect: add('rig_salvage', 0.15), wired: false },

  // ───────────── 채집 · 통발 ─────────────
  { id: 'gath_eye', category: 'gathering', nameKo: '채집 눈', nameEn: "Gleaner's Eye", descKo: '채집 스팟 발견 반경 +10%/랭크', descEn: 'Forage spot detection radius +10% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('forage_radius', 0.10), wired: true },
  { id: 'gath_knot', category: 'gathering', nameKo: '매듭법', nameEn: 'Knot Craft', descKo: '통발 분실 위험 -20%/랭크', descEn: 'Trap loss risk -20% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('trap_loss', -0.20), wired: true },
  { id: 'gath_hands', category: 'gathering', nameKo: '단단한 손', nameEn: 'Steady Hands', descKo: '맨손 채집 부상 확률 -25%/랭크', descEn: 'Bare-hand injury chance -25% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_eye', rank: 1 }], effect: mult('hand_injury', -0.25), wired: true },
  { id: 'gath_octo', category: 'gathering', nameKo: '문어 붙잡기', nameEn: 'Octopus Grip', descKo: '문어 도주 확률 -15%/랭크', descEn: 'Octopus escape chance -15% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'gath_hands', rank: 1 }], effect: mult('octopus_escape', -0.15), wired: true, unlock: [{ kind: 'license', value: 'shore_hunting_advanced' }] },
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
  { id: 'eco_land', category: 'economy', nameKo: '토지 거래', nameEn: 'Land Dealer', descKo: '토지 매입·매도 이익 +5%/랭크 (토지 거래 예정)', descEn: 'Land buy/sell profit +5% per rank (land trade planned)', tier: 2, maxRank: 2, costPerRank: 2, requires: [{ id: 'eco_bulk', rank: 1 }], effect: mult('land_deal', 0.05), wired: false, unlock: [{ kind: 'license', value: 'land_home_lot' }] },
  { id: 'eco_stock', category: 'economy', nameKo: '주식 투자', nameEn: 'Stock Investor', descKo: '주식 시장 해금 (상세 구현 예정)', descEn: 'Unlocks the stock market (detailed later)', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'eco_market', rank: 1 }], effect: add('stock_insight', 1), wired: false, unlock: [{ kind: 'level', value: 80 }] },
  { id: 'eco_restaurant', category: 'economy', nameKo: '식당 마진', nameEn: 'Restaurant Margin', descKo: '식당 판매 마진 +4%/랭크 (식당 경영 예정)', descEn: 'Restaurant margin +4% per rank (restaurant management planned)', tier: 3, maxRank: 2, costPerRank: 2, requires: [{ id: 'eco_regular', rank: 2 }], effect: mult('restaurant_margin', 0.04), wired: false },
  // ── 경제 124차 증설 (+3노드 6pt) ──
  { id: 'eco_ledger', category: 'economy', nameKo: '장부 정리', nameEn: 'Bookkeeping', descKo: '수수료·유지비 -8%/랭크', descEn: 'Fees and upkeep -8% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'eco_haggle', rank: 2 }], effect: mult('ledger_fees', -0.08), wired: false },
  { id: 'eco_auction', category: 'economy', nameKo: '경매 배짱', nameEn: 'Auction Nerve', descKo: '경매 낙찰 보너스 +4%/랭크', descEn: 'Auction settlement bonus +4% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'eco_regular', rank: 1 }], effect: mult('auction_bonus', 0.04), wired: false, unlock: [{ kind: 'quest', value: 'M2-01' }] },
  { id: 'eco_storage', category: 'economy', nameKo: '창고 관리', nameEn: 'Storage Master', descKo: '보관 슬롯 +2/랭크', descEn: 'Storage slots +2 per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'eco_bulk', rank: 1 }], effect: add('storage_slots', 2), wired: false },

  // ───────────── 운전 · 이동 ─────────────
  { id: 'drv_run', category: 'driving', nameKo: '달리기', nameEn: 'Runner', descKo: '도보 이동 속도 +8%/랭크', descEn: 'Walking speed +8% per rank', tier: 0, maxRank: 3, costPerRank: 1, requires: [], effect: mult('run_speed', 0.08), wired: true },
  { id: 'drv_barefoot', category: 'driving', nameKo: '맨발 달리기', nameEn: 'Barefoot Runner', descKo: '모래·갯바위에서도 속도 유지', descEn: 'Keep your speed on sand and rocks', tier: 0, maxRank: 1, costPerRank: 1, requires: [], effect: add('barefoot', 1), wired: false },
  { id: 'drv_bike', category: 'driving', nameKo: '자전거 숙련', nameEn: 'Cyclist', descKo: '자전거 속도 +10%/랭크', descEn: 'Bicycle speed +10% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'drv_run', rank: 1 }], effect: mult('bike_speed', 0.10), wired: true },
  { id: 'drv_bikefat', category: 'driving', nameKo: '자전거 지구력', nameEn: 'Bike Endurance', descKo: '자전거 피로 누적 -10%/랭크', descEn: 'Bicycle fatigue -10% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'drv_run', rank: 1 }], effect: mult('bike_fatigue', -0.10), wired: false },
  { id: 'drv_car', category: 'driving', nameKo: '자동차 운전', nameEn: 'Driver', descKo: '자동차 해금 (상세 구현 예정)', descEn: 'Unlocks the car (detailed later)', tier: 2, maxRank: 1, costPerRank: 3, requires: [{ id: 'drv_bike', rank: 2 }], effect: add('car_unlock', 1), wired: false },
  { id: 'drv_boat', category: 'driving', nameKo: '보트 조종', nameEn: 'Boat Handling', descKo: '개인 보트 출조 해금 (선박 면허 필요)', descEn: 'Unlocks personal boat trips (needs boat licence)', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'drv_car', rank: 1 }], effect: add('boat_unlock', 1), wired: false, unlock: [{ kind: 'quest', value: 'M4-02' }, { kind: 'license', value: 'boat_operator' }] },
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
  { id: 'life_hygiene', category: 'life', nameKo: '위생 관념', nameEn: 'Hygiene', descKo: '식중독 확률 -20%/랭크', descEn: 'Food poisoning chance -20% per rank', tier: 3, maxRank: 2, costPerRank: 1, requires: [{ id: 'life_immune', rank: 1 }], effect: mult('hygiene', -0.20), wired: true },
  // ── 생활 130차 증설 (+4노드 15pt — (a) 생존 지표 최대치 3 + (c) 행동력 미소비 1) ──
  //  ⚠ 이 15pt가 트리 총비용을 200 → 215로 올리는 몫이고, 같은 크기의 예산(면허 15종 × 1pt)이 함께 생겼다.
  { id: 'life_belly', category: 'life', nameKo: '대식가', nameEn: 'Big Eater', descKo: '허기 최대치 +10/랭크 — 그릇이 커진다(소모 속도와 별개)', descEn: 'Max hunger +10 per rank — a bigger tank, not a slower drain', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'life_hunger', rank: 1 }], effect: add('hunger_max', 10), wired: true },
  { id: 'life_canteen', category: 'life', nameKo: '큰 물통', nameEn: 'Big Canteen', descKo: '수분 최대치 +10/랭크', descEn: 'Max hydration +10 per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'life_thirst', rank: 1 }], effect: add('thirst_max', 10), wired: true },
  { id: 'life_grit', category: 'life', nameKo: '강단', nameEn: 'Grit', descKo: '피로 최대치 +10/랭크 — 기절까지의 여유', descEn: 'Max fatigue +10 per rank — more room before collapse', tier: 2, maxRank: 2, costPerRank: 2, requires: [{ id: 'life_recover', rank: 2 }], effect: add('fatigue_max', 10), wired: true },
  { id: 'life_efficiency', category: 'life', nameKo: '요령', nameEn: 'Efficiency', descKo: '행동 1회가 행동력을 아예 안 쓸 확률 +4%p/랭크', descEn: '+4%p chance an action costs no stamina at all', tier: 3, maxRank: 5, costPerRank: 1, requires: [{ id: 'life_recover', rank: 3 }], effect: add('action_free', 0.04), wired: true, unlock: [{ kind: 'level', value: 30 }] },

  // ───────────── 농사 (카테고리 잠금) ─────────────
  { id: 'farm_till', category: 'farming', nameKo: '개간', nameEn: 'Tilling', descKo: '개간·밭갈이 속도 +15%/랭크', descEn: 'Tilling speed +15% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('till_speed', 0.15), wired: false },
  { id: 'farm_water', category: 'farming', nameKo: '물주기', nameEn: 'Watering', descKo: '물주기 효율 +20%/랭크', descEn: 'Watering efficiency +20% per rank', tier: 0, maxRank: 2, costPerRank: 1, requires: [], effect: mult('water_efficiency', 0.20), wired: false },
  { id: 'farm_yield', category: 'farming', nameKo: '수확량', nameEn: 'Harvest Yield', descKo: '작물 수확량 +10%/랭크', descEn: 'Crop yield +10% per rank', tier: 1, maxRank: 3, costPerRank: 1, requires: [{ id: 'farm_till', rank: 1 }], effect: mult('crop_yield', 0.10), wired: false },
  { id: 'farm_seed', category: 'farming', nameKo: '씨앗 회수', nameEn: 'Seed Saver', descKo: '수확 시 씨앗 회수 확률 +15%/랭크', descEn: 'Seed recovery chance on harvest +15% per rank', tier: 1, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_water', rank: 1 }], effect: add('seed_saver', 0.15), wired: false },
  { id: 'farm_fert', category: 'farming', nameKo: '비료 효율', nameEn: 'Fertilizer', descKo: '비료 효과 +20%/랭크', descEn: 'Fertilizer effect +20% per rank', tier: 2, maxRank: 2, costPerRank: 1, requires: [{ id: 'farm_yield', rank: 1 }], effect: mult('fertilizer', 0.20), wired: false },
  { id: 'farm_green', category: 'farming', nameKo: '온실', nameEn: 'Greenhouse', descKo: '온실 해금 — 계절 무관 재배', descEn: 'Unlocks the greenhouse — grow in any season', tier: 3, maxRank: 1, costPerRank: 3, requires: [{ id: 'farm_fert', rank: 1 }, { id: 'farm_seed', rank: 1 }], effect: add('greenhouse', 1), wired: false, unlock: [{ kind: 'license', value: 'farmland_use' }, { kind: 'categoryRanks', category: 'farming', value: 8 }] },
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
  { id: 'craft_rod', category: 'crafting', nameKo: '로드 빌딩', nameEn: 'Rod Building', descKo: '커스텀 로드 제작 해금 (경도·길이 선택)', descEn: 'Unlocks custom rod building (choose action and length)', tier: 3, maxRank: 1, costPerRank: 2, requires: [{ id: 'craft_bp', rank: 1 }], effect: add('rod_building', 1), wired: true, unlock: [{ kind: 'quest', value: 'M3-09' }, { kind: 'level', value: 60 }, { kind: 'categoryRanks', category: 'crafting', value: 12 }] },
  { id: 'craft_reel', category: 'crafting', nameKo: '릴 커스텀', nameEn: 'Reel Custom', descKo: '릴 기어비 튜닝 해금폭 확장', descEn: 'Wider reel gear-ratio tuning range', tier: 3, maxRank: 2, costPerRank: 1, requires: [{ id: 'craft_bp', rank: 1 }], effect: add('reel_tuning', 1), wired: true },

  // ═══════════════════════════════════════════════════════════
  // (e) 시너지 히든 스킬 (130차) — **비용 0 · 조건 충족 시 자동 습득**
  //  포인트로 사는 노드가 아니라 "조합을 다 팠을 때 열리는 보상"이라 예산(Σ) 밖에 둔다.
  //  규칙: costPerRank 0 · requires 2개 이상 · maxRank 1 (무결성 검사가 강제).
  // ═══════════════════════════════════════════════════════════
  {
    id: 'syn_tidewalker', category: 'fishing', nameKo: '물때를 읽는 손', nameEn: "Tidewalker's Hands",
    descKo: '조석 해석과 입질 감각이 맞물려 입질 확률 +5%', descEn: 'Tide reading meets bite sense — bite chance +5%',
    tier: 3, maxRank: 1, costPerRank: 0,
    requires: [{ id: 'fish_tide', rank: 1 }, { id: 'fish_bite', rank: 3 }],
    effect: mult('bite_chance', 0.05), wired: true, hidden: true,
  },
  {
    id: 'syn_moonlit', category: 'gathering', nameKo: '달빛 눈', nameEn: 'Moonlit Eyes',
    descKo: '랜턴과 갯벌 눈이 겹쳐 채집 스팟 발견 반경 +12%', descEn: 'Lantern and mudflat eye combine — forage radius +12%',
    tier: 2, maxRank: 1, costPerRank: 0,
    requires: [{ id: 'gath_eye', rank: 2 }, { id: 'gath_lantern', rank: 2 }],
    effect: mult('forage_radius', 0.12), wired: true, hidden: true,
  },
  {
    id: 'syn_broker', category: 'economy', nameKo: '시세의 직관', nameEn: "Broker's Instinct",
    descKo: '흥정과 시세 안목이 붙어 판매가 +4%', descEn: 'Haggling plus market eye — sell price +4%',
    tier: 3, maxRank: 1, costPerRank: 0,
    requires: [{ id: 'eco_haggle', rank: 3 }, { id: 'eco_market', rank: 1 }],
    effect: mult('sell_price', 0.04), wired: true, hidden: true,
  },
  {
    id: 'syn_ironbody', category: 'life', nameKo: '무쇠 몸', nameEn: 'Iron Body',
    descKo: '체력·회복력·면역이 모두 오르면 피로 회복 +15%', descEn: 'Stamina, recovery and immunity together — fatigue recovery +15%',
    tier: 3, maxRank: 1, costPerRank: 0,
    requires: [{ id: 'life_stamina', rank: 3 }, { id: 'life_recover', rank: 3 }, { id: 'life_immune', rank: 2 }],
    effect: mult('fatigue_recovery', 0.15), wired: true, hidden: true,
  },
  {
    id: 'syn_artisan', category: 'crafting', nameKo: '장인의 손', nameEn: "Artisan's Hands",
    descKo: '매듭과 공구 관리가 맞물려 제작 성공률 +5%', descEn: 'Knots and tool care — crafting success +5%',
    tier: 3, maxRank: 1, costPerRank: 0,
    requires: [{ id: 'craft_knot', rank: 3 }, { id: 'craft_tools', rank: 2 }],
    effect: mult('craft_success', 0.05), wired: true, hidden: true,
  },
];

/**
 * 스킬 트리 총 비용 정본 (130차 재정의).
 *
 * **등식: Σ(유료 노드) = 레벨 만렙 포인트(200) + 면허 보너스 총량(15) = 215.**
 *  - 124차 등식은 "만렙 = 전 스킬 마스터"(200)였다. 130차에 (a)(c) 노드 15pt를 더하면서
 *    **기존 노드 비용을 깎는 대신 예산을 늘렸다** — 비용을 깎으면 이미 찍은 세이브의
 *    사용 포인트가 어긋나기 때문이다(랭크만 저장하고 포인트는 파생이라 더 위험하다).
 *  - 늘린 예산은 **면허**에 붙였다(`SKILL_POINTS_PER_LICENSE`) → 새 등식은
 *    **"만렙 + 전 면허 취득 = 전 스킬 마스터"**.
 *  - **시너지 히든 노드(e)는 비용 0**이라 이 합계에 들어가지 않는다(보상이지 구매가 아니다).
 *
 * ⚠ 현재 발급 가능한 면허는 16종 중 9종(7종은 `plannedNote`) — 지금 도달 가능한 실예산은
 *   200 + 8이다(기본 제공 `basic_angling` 제외). 만렙과 마찬가지로 **장기 등식**이다.
 */
export const SKILL_TREE_TOTAL_PT = 215;

/** 면허 보너스로 들어오는 총 포인트 (기본 제공 면허 제외 — 등식의 우변 둘째 항) */
export const SKILL_LICENSE_BONUS_TOTAL_PT = 15;

/** 티어당 노드 수용 상한 (패널 세로 — 130차에 6 → 8로 확장, 노드 높이가 같이 줄어든다) */
export const SKILL_TIER_MAX_NODES = 8;

// ── 무결성 검사 (모듈 로드 시 1회 — 어긋나면 콘솔 경고) ──
{
  // 유료 노드만 합산 — 히든(비용 0)은 예산 밖
  const total = SKILL_DATABASE.reduce((acc, d) => acc + d.maxRank * d.costPerRank, 0);
  if (total !== SKILL_TREE_TOTAL_PT) {
    console.warn(`[SkillDatabase] 트리 총 비용 ${total}pt ≠ ${SKILL_TREE_TOTAL_PT}pt — 노드 비용 또는 등식을 맞출 것`);
  }
  if (SKILL_TREE_TOTAL_PT !== MAX_LEVEL * SKILL_POINTS_PER_LEVEL + SKILL_LICENSE_BONUS_TOTAL_PT) {
    console.warn('[SkillDatabase] 등식 불일치 — Σ(유료) = 만렙 포인트 + 면허 보너스 총량이어야 한다');
  }
  const byId = new Map(SKILL_DATABASE.map((d) => [d.id, d]));
  const perTier = new Map<string, number>();
  for (const d of SKILL_DATABASE) {
    for (const q of d.requires) {
      const pre = byId.get(q.id);
      if (!pre) { console.warn(`[SkillDatabase] ${d.id} 선행 '${q.id}' 미존재 (고아 참조)`); continue; }
      // 130차 신설 검사 — 선행 요구 랭크가 그 스킬의 maxRank를 넘으면 **영영 못 여는 노드**가 된다
      if (q.rank > pre.maxRank) {
        console.warn(`[SkillDatabase] ${d.id} 선행 '${q.id}' 요구 ${q.rank} > maxRank ${pre.maxRank} — 도달 불가`);
      }
    }
    if (d.tier < 0 || d.tier > 3) console.warn(`[SkillDatabase] ${d.id} tier ${d.tier} — 패널 열은 0~3만 지원`);
    // 130차 (e) 히든 규칙
    if (d.hidden) {
      if (d.costPerRank !== 0) console.warn(`[SkillDatabase] 히든 ${d.id} costPerRank ${d.costPerRank} ≠ 0 — 예산 등식이 깨진다`);
      if (d.maxRank !== 1) console.warn(`[SkillDatabase] 히든 ${d.id} maxRank ${d.maxRank} ≠ 1 — 히든은 단일 랭크 보상이다`);
      if (d.requires.length < 2) console.warn(`[SkillDatabase] 히든 ${d.id} 선행 ${d.requires.length}개 — 시너지는 조합(2개 이상)이어야 한다`);
    } else if (d.costPerRank <= 0) {
      console.warn(`[SkillDatabase] ${d.id} costPerRank ${d.costPerRank} — 유료 노드는 1 이상`);
    }
    // 130차 (d) 해금 조건 유효성
    for (const u of d.unlock ?? []) {
      if (u.kind === 'level' && (u.value < 1 || u.value > MAX_LEVEL)) {
        console.warn(`[SkillDatabase] ${d.id} 해금 레벨 ${u.value} — 1~${MAX_LEVEL} 범위를 벗어남`);
      }
      if (u.kind === 'categoryRanks' && u.value > categoryMaxRanks(u.category)) {
        console.warn(`[SkillDatabase] ${d.id} 해금 '${u.category}' 누적 랭크 ${u.value} > 최대 ${categoryMaxRanks(u.category)} — 도달 불가`);
      }
    }
    const k = `${d.category}:${d.tier}`;
    perTier.set(k, (perTier.get(k) ?? 0) + 1);
  }
  for (const [k, n] of perTier) {
    if (n > SKILL_TIER_MAX_NODES) {
      console.warn(`[SkillDatabase] ${k} 티어에 ${n}노드 — 패널 세로 수용(≤${SKILL_TIER_MAX_NODES}) 초과`);
    }
  }
}

/** 카테고리의 누적 랭크 상한 (해금 조건 `categoryRanks` 검증·표시용) */
export function categoryMaxRanks(cat: SkillCategoryId): number {
  return SKILL_DATABASE.filter((s) => s.category === cat).reduce((a, s) => a + s.maxRank, 0);
}

/** 카테고리의 현재 누적 랭크 */
export function categoryRanks(ranks: SkillRanks, cat: SkillCategoryId): number {
  return SKILL_DATABASE
    .filter((s) => s.category === cat)
    .reduce((a, s) => a + Math.max(0, Math.min(s.maxRank, ranks[s.id] ?? 0)), 0);
}

/** 해금 조건 1건 충족 여부 */
export function skillUnlockCondMet(cond: SkillUnlockCond, ctx: SkillUnlockCtx): boolean {
  switch (cond.kind) {
    case 'level': return ctx.level >= cond.value;
    case 'license': return ctx.licenses.includes(cond.value);
    case 'categoryRanks': return categoryRanks(ctx.ranks, cond.category) >= cond.value;
    case 'quest': return (ctx.questsDone ?? []).includes(cond.value);
    default: return true;
  }
}

/** 해금 조건 전체(AND) 충족 여부 — 조건이 없으면 항상 true */
export function skillUnlockMet(def: SkillDef, ctx: SkillUnlockCtx): boolean {
  return (def.unlock ?? []).every((c) => skillUnlockCondMet(c, ctx));
}

/** 미충족 조건만 (패널이 사유를 그대로 보여준다) */
export function skillUnlockMissing(def: SkillDef, ctx: SkillUnlockCtx): SkillUnlockCond[] {
  return (def.unlock ?? []).filter((c) => !skillUnlockCondMet(c, ctx));
}

/** 카테고리 이름 (조건 문구용) */
function catName(cat: SkillCategoryId): string {
  return SKILL_CATEGORIES.find((c) => c.id === cat)?.nameKo ?? cat;
}

/**
 * 해금 조건 문구 (130차) — 패널·안내가 **같은 문장**을 쓰도록 core가 만든다.
 * 면허는 id가 아니라 사람이 읽는 이름이 필요하지만, License DB를 참조하면 순환이 생기므로
 * 호출측이 `licenseName`으로 넘겨준다(없으면 id 그대로 — 최소한 무엇이 필요한지는 보인다).
 */
export function describeUnlockCond(
  cond: SkillUnlockCond,
  licenseName?: (type: string) => string | undefined,
): string {
  switch (cond.kind) {
    case 'level': return `Lv.${cond.value} 이상`;
    case 'license': return `면허 [${licenseName?.(cond.value) ?? cond.value}] 보유`;
    case 'categoryRanks': return `${catName(cond.category)} 누적 랭크 ${cond.value} 이상`;
    case 'quest': return `메인 퀘스트 ${cond.value} 완료`;
    default: return '';
  }
}

/**
 * 조건을 방금 충족한 **히든 시너지 스킬** 목록 (130차 (e)).
 * 호출측(GameState)이 랭크 1을 넣어주고 안내를 띄운다 — 포인트는 들지 않는다.
 */
export function newlyUnlockedHiddenSkills(ctx: SkillUnlockCtx): SkillDef[] {
  return SKILL_DATABASE.filter((d) =>
    d.hidden
    && (ctx.ranks[d.id] ?? 0) < 1
    && skillPrereqsMet(d, ctx.ranks)
    && skillUnlockMet(d, ctx));
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

// ─────────────────────────────────────────────
// 숙련도 (140차) — '기술형' 스킬은 배운 뒤 행위로 채워야 효과가 난다
// ─────────────────────────────────────────────

/**
 * 숙련도가 붙는 스킬 후보 — **몸으로 익히는 기술**만. 최대치·저항·확률 보정 같은
 * 체질형(stamina_max·cold_resist·immunity·hunger_max …)은 배우는 즉시 적용된다.
 * xpPerAction은 행위 빈도에 반비례 — 캐스팅은 수백 번, 손질은 수십 번이 자연스러운 세션 빈도.
 */
const PROFICIENCY_OF: Record<string, SkillProficiencyDef> = {
  fish_cast:     { actions: ['cast'], xpPerAction: 1 },
  fish_scatter:  { actions: ['cast'], xpPerAction: 1 },
  fish_surf:     { actions: ['surf', 'cast'], xpPerAction: 1 },
  fish_spool:    { actions: ['cast'], xpPerAction: 1 },
  fish_lure:     { actions: ['lureAction'], xpPerAction: 1 },
  fish_jig:      { actions: ['jig'], xpPerAction: 2 },
  fish_egi:      { actions: ['egi'], xpPerAction: 2 },
  fish_hook:     { actions: ['landing'], xpPerAction: 3 },
  fish_drag:     { actions: ['fight'], xpPerAction: 2 },
  fish_chum:     { actions: ['chum'], xpPerAction: 2 },
  gath_hands:    { actions: ['forage'], xpPerAction: 3 },
  gath_speed:    { actions: ['forage'], xpPerAction: 3 },
  gath_knot:     { actions: ['trap'], xpPerAction: 4 },
  life_fillet:   { actions: ['butcher', 'sashimi'], xpPerAction: 4 },
  life_cook:     { actions: ['cook'], xpPerAction: 4 },
  life_firstaid: { actions: ['firstaid'], xpPerAction: 6 },
  drv_bike:      { actions: ['ride'], xpPerAction: 1 },
  eco_haggle:    { actions: ['haggle'], xpPerAction: 2 },
  craft_knot:    { actions: ['craft'], xpPerAction: 4 },
  craft_tools:   { actions: ['craft'], xpPerAction: 4 },
  craft_sinker:  { actions: ['craft'], xpPerAction: 4 },
  craft_medic:   { actions: ['craft', 'firstaid'], xpPerAction: 4 },
};
for (const d of SKILL_DATABASE) { const pf = PROFICIENCY_OF[d.id]; if (pf) d.proficiency = pf; }

/** 숙련도가 붙은 스킬 목록 */
export function proficiencySkills(): SkillDef[] {
  return SKILL_DATABASE.filter((d) => d.proficiency);
}

/** 스킬의 현재 효과 배율(0~1.15) — 숙련도 없는 스킬은 항상 1 */
export function skillEffectScale(d: SkillDef, prof?: SkillProficiency): number {
  if (!d.proficiency) return 1;
  return profScale(profLevel(prof?.[d.id] ?? 0));
}

export interface ProfGain { skillId: string; xp: number; level: number; leveled: boolean }

/**
 * 행위 1회 → 배운 숙련도 스킬들의 XP 적립. **prof 객체를 제자리에서 갱신**하고 변동 목록을 돌려준다
 * (호출측은 leveled만 골라 안내). rank 0 스킬은 건너뛴다 — 배우지 않은 기술은 익혀지지 않는다.
 */
export function profGain(ranks: SkillRanks, prof: SkillProficiency, action: ProfActionKey, mult = 1): ProfGain[] {
  const out: ProfGain[] = [];
  for (const d of SKILL_DATABASE) {
    const pf = d.proficiency;
    if (!pf || !pf.actions.includes(action) || (ranks[d.id] ?? 0) <= 0) continue;
    const before = prof[d.id] ?? 0;
    const after = before + Math.max(0, pf.xpPerAction * mult);
    prof[d.id] = after;
    const lv = profLevel(after);
    out.push({ skillId: d.id, xp: after, level: lv, leveled: lv > profLevel(before) });
  }
  return out;
}

/** 효과 배율 — 1 + Σ(perRank × rank × 숙련 배율) (mode 'mult'만) */
export function skillMult(ranks: SkillRanks, key: SkillEffectKey, prof?: SkillProficiency): number {
  let m = 1;
  for (const d of SKILL_DATABASE) {
    if (d.effect.key !== key || d.effect.mode !== 'mult') continue;
    m += d.effect.perRank * (ranks[d.id] ?? 0) * skillEffectScale(d, prof);
  }
  return Math.max(0, m);
}

/** 효과 가산 — Σ(perRank × rank × 숙련 배율) (mode 'add'만) */
export function skillBonus(ranks: SkillRanks, key: SkillEffectKey, prof?: SkillProficiency): number {
  let v = 0;
  for (const d of SKILL_DATABASE) {
    if (d.effect.key !== key || d.effect.mode !== 'add') continue;
    v += d.effect.perRank * (ranks[d.id] ?? 0) * skillEffectScale(d, prof);
  }
  return v;
}
