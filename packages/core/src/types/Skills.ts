/**
 * @file Skills.ts
 * @description 스킬 트리 타입 (122차) — RPG 요소. 레벨마다 스킬 포인트를 얻고 카테고리별 트리에서 소비한다.
 *
 * 구조(사용자 지시 2026-09-09): 도움말 라이브러리처럼 **카테고리 → 우측 트리**. 각 카테고리는 **저비용 루트 스킬
 * 1~2개**(독립/병렬)에서 시작해 연관 스킬로 확장(`requires`)되고, 논리적 연결이 없는 것은 **상위 티어**로만 배치한다.
 * 효과는 `effect.key`(효과 키) × `perRank`로 데이터화 — 소비처는 `GameState.skillMult(key)`/`skillBonus(key)`를 읽는다.
 * **정의만 있고 배선이 안 된 효과**는 `SkillDef.wired === false`로 표시(패널이 "예정" 배지) — 스케일만 잡는 단계.
 */

export type SkillCategoryId = 'fishing' | 'gathering' | 'economy' | 'driving' | 'life' | 'farming' | 'crafting';

/**
 * 효과 키 — 소비처가 읽는 배율/가산 이름. `mult` = 1 + Σ(perRank×rank) 배율 · `add` = Σ 가산.
 * 새 키를 추가하면 소비처 배선 여부를 `wired`로 남긴다.
 */
export type SkillEffectKey =
  // 낚시
  | 'cast_distance' | 'bite_chance' | 'line_strength' | 'freshness_time' | 'weather_bite' | 'drag_control'
  | 'chum_sync' | 'night_bite' | 'lure_action' | 'hook_set' | 'big_fish_luck' | 'tide_reading'
  // 낚시 — 124차 증설 (캐스팅 산포·바람·스풀·지깅·에깅·원투·채비 회수)
  | 'cast_scatter' | 'wind_comp' | 'spool_trouble' | 'jig_efficiency' | 'egi_stability' | 'surf_distance' | 'rig_salvage'
  // 채집·통발
  | 'forage_radius' | 'hand_injury' | 'octopus_escape' | 'trap_bait_duration' | 'trap_attempts' | 'trap_loss' | 'balance'
  // 채집·통발 — 124차 증설 (간조 보너스·랜턴 반경·채집 속도·회수물 신선도)
  | 'forage_tide' | 'lantern_range' | 'forage_speed' | 'trap_harvest_fresh'
  // 경제
  | 'sell_price' | 'buy_price' | 'bulk_bonus' | 'land_deal' | 'stock_insight' | 'market_eye' | 'restaurant_margin'
  // 경제 — 124차 증설 (경매·수수료·보관 슬롯)
  | 'auction_bonus' | 'ledger_fees' | 'storage_slots'
  // 운전
  | 'run_speed' | 'bike_speed' | 'bike_fatigue' | 'car_unlock' | 'boat_unlock' | 'barefoot'
  // 운전 — 124차 증설 (적재·야간 이동·멀미·면허 이론)
  | 'cargo_slots' | 'night_move' | 'motion_fatigue' | 'license_theory'
  // 생활
  | 'stamina_max' | 'strength' | 'fatigue_recovery' | 'cold_resist' | 'cooking_quality' | 'fillet_yield'
  // 생활 — 124차 증설 (허기·수분·수면·면역·응급·위생 — 생존 지표 P2 소비 예정)
  | 'hunger_drain' | 'thirst_drain' | 'sleep_recovery' | 'immunity' | 'firstaid' | 'hygiene'
  // 농사
  | 'till_speed' | 'crop_yield' | 'water_efficiency' | 'seed_saver' | 'greenhouse' | 'fertilizer'
  // 농사 — 124차 증설 (발아·병충해·절기 캘린더)
  | 'sprout_rate' | 'pest_resist' | 'farm_calendar'
  // 제작 — 124차 신설 카테고리 (P7 제작 시스템 소비 예정)
  | 'craft_success' | 'sinker_material' | 'lure_tuning' | 'egi_tuning' | 'trap_durability' | 'medic_quality'
  | 'chum_slots' | 'rod_building' | 'reel_tuning' | 'craft_material' | 'blueprint_grade' | 'craft_batch';

export interface SkillEffect {
  key: SkillEffectKey;
  /** 랭크당 값 — mult면 비율(0.06 = +6%), add면 가산 */
  perRank: number;
  mode: 'mult' | 'add';
}

export interface SkillDef {
  id: string;
  category: SkillCategoryId;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  /** 트리 열 (0 = 루트) — 패널 가로 배치 */
  tier: number;
  maxRank: number;
  /** 랭크당 스킬 포인트 */
  costPerRank: number;
  /** 선행 스킬 (id → 최소 랭크). 비면 루트(독립/병렬) */
  requires: { id: string; rank: number }[];
  effect: SkillEffect;
  /** 소비처 배선 여부 — false = 정의만(패널 '예정' 배지) */
  wired: boolean;
}

export interface SkillCategoryDef {
  id: SkillCategoryId;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  /** 카테고리 자체 잠금 — 시스템 미구현(농사) → 스킬 습득 불가, 트리는 열람만 */
  locked?: boolean;
  lockedNoteKo?: string;
  lockedNoteEn?: string;
}

/** 스킬 랭크 상태 — 세이브 영속 (id → rank). 포인트는 레벨에서 파생하므로 저장하지 않는다 */
export type SkillRanks = Record<string, number>;

/** 레벨당 스킬 포인트 — Lv.1 = 1점(첫 스킬 체험), 이후 레벨마다 +1 */
export const SKILL_POINTS_PER_LEVEL = 1;

export function skillPointsForLevel(level: number): number {
  return Math.max(0, Math.floor(level)) * SKILL_POINTS_PER_LEVEL;
}
