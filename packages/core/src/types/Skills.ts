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
  // 생활 — 130차 증설 (a) 생존 지표 **최대치** + (c) 행동력 미소비
  //  ⚠ `*_drain`(소모 속도)과 `*_max`(그릇 크기)는 다른 축이다 — 섞지 말 것.
  | 'hunger_max' | 'thirst_max' | 'fatigue_max' | 'action_free'
  // 농사
  | 'till_speed' | 'crop_yield' | 'water_efficiency' | 'seed_saver' | 'greenhouse' | 'fertilizer'
  // 농사 — 124차 증설 (발아·병충해·절기 캘린더)
  | 'sprout_rate' | 'pest_resist' | 'farm_calendar'
  // 제작 — 124차 신설 카테고리 (P7 제작 시스템 소비 예정)
  | 'craft_success' | 'sinker_material' | 'lure_tuning' | 'egi_tuning' | 'trap_durability' | 'medic_quality'
  | 'chum_slots' | 'rod_building' | 'reel_tuning' | 'craft_material' | 'blueprint_grade' | 'craft_batch';

/**
 * 스킬 해금 조건 (130차 (d)) — `requires`(선행 랭크)와 **직교**하는 추가 관문.
 * 선행 랭크만으로는 "낚시를 많이 했다"밖에 표현 못 해서, 레벨·면허·카테고리 숙련을 조건으로 쓴다.
 * 전부 **AND** — 하나라도 미충족이면 잠김(패널이 사유를 그대로 보여준다).
 */
export type SkillUnlockCond =
  /** 플레이어 레벨 n 이상 */
  | { kind: 'level'; value: number }
  /** 특정 면허 보유 (LicenseType 문자열 — core License.ts와 순환 참조를 피해 string으로 둔다) */
  | { kind: 'license'; value: string }
  /** 같은/지정 카테고리의 누적 랭크 n 이상 — "그 분야를 판 사람만" */
  | { kind: 'categoryRanks'; category: SkillCategoryId; value: number };

/** 해금 조건 판정에 필요한 바깥 상태 */
export interface SkillUnlockCtx {
  level: number;
  /** 보유(유효) 면허 타입 목록 */
  licenses: string[];
  ranks: SkillRanks;
}

export interface SkillEffect {
  key: SkillEffectKey;
  /** 랭크당 값 — mult면 비율(0.06 = +6%), add면 가산 */
  perRank: number;
  mode: 'mult' | 'add';
}

// ─────────────────────────────────────────────
// 숙련도 (140차) — 배워도 곧바로 효과가 나지 않는 '기술형' 스킬
// ─────────────────────────────────────────────

/**
 * 숙련도를 채우는 행위. 스킬이 나열한 행위를 할 때마다 그 스킬의 숙련도 XP가 쌓인다
 * (**배운 스킬만** — rank 0이면 아무것도 쌓이지 않는다).
 */
export type ProfActionKey =
  | 'cast' | 'landing' | 'fight' | 'lureAction' | 'jig' | 'egi' | 'surf' | 'chum'
  | 'forage' | 'trap' | 'butcher' | 'sashimi' | 'cook' | 'craft' | 'ride' | 'firstaid' | 'haggle';

export interface SkillProficiencyDef {
  actions: ProfActionKey[];
  /** 행위 1회당 숙련도 XP */
  xpPerAction: number;
}

/** skillId → 누적 숙련도 XP (세이브 영속) */
export type SkillProficiency = Record<string, number>;

/**
 * 숙련도 레벨 임계(누적 XP) — 인덱스 i 이상이면 레벨 i+1. 최대 5레벨.
 * 캐스팅(xp 1/회) 기준: 15회면 효과가 처음 나고, 360회면 만숙.
 */
export const PROF_LEVEL_XP: readonly number[] = [15, 45, 100, 200, 360];
export const PROF_MAX_LEVEL = PROF_LEVEL_XP.length;

/**
 * 숙련도 레벨별 효과 배율 — 인덱스 = 레벨. **레벨 0 = 효과 0**(배우기만 한 상태) …
 * 4 = 표기값 100%, 5(만숙) = 115%. 표기 수치가 곧 '숙련 4' 값이라 밸런스 표가 그대로 유효하다.
 */
export const PROF_EFFECT_SCALE: readonly number[] = [0, 0.35, 0.6, 0.85, 1.0, 1.15];

export function profLevel(xp: number): number {
  let lv = 0;
  for (const t of PROF_LEVEL_XP) { if (xp >= t) lv++; else break; }
  return lv;
}
export function profScale(level: number): number {
  return PROF_EFFECT_SCALE[Math.max(0, Math.min(PROF_MAX_LEVEL, level))] ?? 1;
}
/** 다음 레벨까지 필요한 누적 XP (만숙이면 null) */
export function profNextXp(xp: number): number | null {
  const lv = profLevel(xp);
  return lv >= PROF_MAX_LEVEL ? null : PROF_LEVEL_XP[lv];
}
/** 해당 레벨의 시작 XP (진행 바용) */
export function profLevelStartXp(level: number): number {
  return level <= 0 ? 0 : PROF_LEVEL_XP[Math.min(PROF_MAX_LEVEL, level) - 1];
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
  /** 추가 해금 조건 (130차 (d)) — 없으면 선행 랭크만 본다 */
  unlock?: SkillUnlockCond[];
  /**
   * 시너지 히든 스킬 (130차 (e)) — 조합을 다 배우면 **자동으로 열리는 보상 노드**.
   * 규칙: `costPerRank: 0`(포인트 예산 밖) · `requires` 2개 이상 · 조건 충족 시 랭크 1 자동 습득.
   * 패널은 조건 미충족 동안 이름·효과를 숨기고 `???`로만 표시한다.
   */
  hidden?: boolean;
  /**
   * 숙련도 (140차) — 있으면 배운 뒤에도 **행위로 숙련도를 채워야** 효과가 난다.
   * 소비처는 `skillMult(ranks, key, prof)`처럼 숙련도를 함께 넘긴다. 없는 스킬은 즉시 효과.
   */
  proficiency?: SkillProficiencyDef;
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

/**
 * 면허 1종당 보너스 스킬 포인트 (130차) — **기본 제공 면허는 제외**한다.
 *
 * ⚖ 왜 도입했나: (a)(c) 신규 노드를 넣으면 트리 총비용이 200을 넘는데,
 * 기존 노드 비용을 깎아 200에 맞추면 **이미 찍은 세이브의 사용 포인트가 어긋난다**.
 * 그래서 총비용을 늘리고 **예산도 같이 늘렸다** — 그 증가분을 면허에 붙여
 * "면허를 따면 스킬도 열린다"는 (d) 해금 조건과 같은 방향을 보게 했다.
 *
 * 등식: **Σ(유료 노드) = 레벨 만렙 포인트 + 면허 보너스 총량.**
 */
export const SKILL_POINTS_PER_LICENSE = 1;

/** 기본 제공이라 보너스에서 빼는 면허 */
export const SKILL_BONUS_EXCLUDED_LICENSES: readonly string[] = [
  'basic_angling',
  // 134차 — 스토리 자격 사다리 4종은 서사 관문이지 스킬 예산이 아니다(Σ 215 = 만렙 200 + 면허 15 불변)
  'reported_fishery', 'coop_member', 'angling_boat_biz', 'marine_tourism',
];

/** 보유 면허 → 보너스 포인트 (만료 면허는 호출측이 걸러서 넘긴다) */
export function skillPointsFromLicenses(heldTypes: readonly string[]): number {
  const uniq = new Set(heldTypes.filter((t) => !SKILL_BONUS_EXCLUDED_LICENSES.includes(t)));
  return uniq.size * SKILL_POINTS_PER_LICENSE;
}
