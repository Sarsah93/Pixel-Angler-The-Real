/**
 * @file Cooking.ts
 * @description 불요리 타입 (154차 — `.agents/FIRE_COOKING_SPEC.md`)
 *
 * 화구(열원) × 용기 × 연료 × 재료 × 레시피 × 조리 세션 × 완성 요리(맛 별 5개).
 * 순수 타입 — 렌더·브라우저 API 없음. 시뮬은 `simulation/CookingSim.ts`.
 *
 * ⚖ 조리 가능 여부는 `recipe.cookware ∩ 용기 종류`로 결정한다(데이터 교집합) —
 *   `if (recipe.id === …)` 하드코딩 금지.
 */

// ─────────────────────────────────────────────
// 화구 · 용기 · 연료
// ─────────────────────────────────────────────

/** 용기 종류 — 레시피가 요구하는 것과 교집합으로 매칭 */
export type CookwareKind = 'pot' | 'pan' | 'grate';

export interface HeatSourceDef {
  id: string;
  nameKo: string;
  nameEn: string;
  /** 최대 화력 (W — 강불 기준) */
  maxHeatW: number;
  /** 바람 취약도 0~1 (현장 화력 = maxHeat × (1 − wind × clamp((풍속−3)/9))) */
  windSensitivity: number;
  /** 연료 무한(집 가스레인지) */
  infiniteFuel: boolean;
  /** 어디에 서는가 */
  stage: 'home' | 'field';
}

export interface CookwareDef {
  id: string;
  nameKo: string;
  nameEn: string;
  kind: CookwareKind;
  /** 열관성 (J/K) — 클수록 천천히 오르고 천천히 식는다 = 실수 여유 */
  thermalMassJK: number;
  /** 용량 (ml — pot만. 초과 투입 거부) */
  capacityMl?: number;
  /** 최대 온도 캡 (°C — 물이 없을 때) */
  maxTempC: number;
  /** 열 손실 배율 — 팬·석쇠는 냄비보다 손실이 작아 같은 불에서 더 뜨겁다 */
  lossMult: number;
}

export interface FuelDef {
  id: string;
  nameKo: string;
  nameEn: string;
  /** 1개당 연료 (강불 기준 분) */
  minutesPerUnit: number;
  /** 어떤 화구에 맞는가 */
  heatSourceId: string;
}

// ─────────────────────────────────────────────
// 재료
// ─────────────────────────────────────────────

export type IngredientKind = 'main' | 'base' | 'veg' | 'season' | 'liquid' | 'oil' | 'grain' | 'finish';
/** 투입 단위 — g(주재료 실중량) · ea(1개/한 줌) · spoon(1큰술 = 정량 1) · cup(200ml) */
export type IngredientUnit = 'g' | 'ea' | 'spoon' | 'cup';

export interface CookIngredientDef {
  id: string;
  nameKo: string;
  nameEn: string;
  kind: IngredientKind;
  unit: IngredientUnit;
  /** 1단위 염분(g) — 간 계산 */
  saltGPerUnit: number;
  /** 1단위 당분(g) — 달다 판정 */
  sugarGPerUnit: number;
  /** 1단위 질량(g) — 염도 분모 (g 단위 재료는 실중량) */
  massGPerUnit: number;
  /** 익기 시작하는 온도 (°C) */
  cookMinC: number;
  /** 100°C(또는 팬 기준 온도)에서 익는 데 걸리는 시뮬 초 */
  cookSec: number;
  /** 타기 시작하는 온도 (°C — 팬·졸아붙음) */
  burnC: number;
  /** 물 기여 (ml/단위 — liquid만) */
  waterMlPerUnit?: number;
}

// ─────────────────────────────────────────────
// 레시피
// ─────────────────────────────────────────────

export type RecipeFamily = 'stew_red' | 'stew_clear' | 'grill' | 'braise' | 'stirfry' | 'porridge';
export type RecipeRole = 'main' | 'liquid' | 'base' | 'season' | 'veg' | 'finish' | 'oil' | 'grain';
export type StageTrigger = 'start' | 'boil' | 'mainCooked' | 'final';

export interface RecipeIngredientReq {
  /** 재료 id 또는 택1 그룹(배열) */
  ing: string | string[];
  role: RecipeRole;
  /** 허용 단위 범위 (max = 과다 상한 — 넘으면 투입 거부) */
  min: number;
  max: number;
  /** 정량 (양념 — 간 계산의 기준. 없으면 min) */
  ideal?: number;
  /** 이상적 투입 단계 index (stages[]) */
  stage: number;
  /** 팬 전용 조건 등 — 용기 종류가 이것일 때만 필수 */
  onlyWith?: CookwareKind;
}

export interface RecipeStageDef {
  labelKo: string;
  labelEn: string;
  trigger: StageTrigger;
}

export interface DishVitals {
  hungerRestore: number;
  hydrationRestore: number;
  hpRestore: number;
  fatigueRestore: number;
  drainBuffMult?: number;
  drainBuffMin?: number;
}

export interface FireRecipeDef {
  id: string;
  nameKo: string;
  nameEn: string;
  family: RecipeFamily;
  descKo: string;
  descEn: string;
  /** 허용 용기 종류 */
  cookware: CookwareKind[];
  required: RecipeIngredientReq[];
  optional: RecipeIngredientReq[];
  /** 부가 재료 종류 상한 — 초과 시 완성도 감점 */
  maxExtraKinds: number;
  /** 목표 염도 (%) */
  targetSaltPct: number;
  /** 목표 당분 (설탕 큰술 상당) */
  targetSugarSpoons: number;
  stages: RecipeStageDef[];
  /** 완성 판정 — 주재료 익음 / 국물 졸아듦(조림) / 전부 익음 */
  doneWhen: 'mainCooked' | 'reduced' | 'allCooked';
  /** 적정 온도 밴드 (°C) */
  tempBand: [number, number];
  /** 서빙 온도 (°C — 이 이상이면 온도 별 만점) */
  servingC: number;
  /** 온도 감쇠 τ (분 — wall-clock) */
  coolTauMin: number;
  /** 식감 감쇠 (시간당 감점) */
  textureDecayPerHour: number;
  /** 뒤집기/젓기 필요 간격 (시뮬 초 — 구이·볶음만) */
  flipEverySec?: number;
  /** 기준 조리 시간(시뮬 분 — 안내용) */
  cookMin: number;
  servings: number;
  baseValueKrw: number;
  vitals: DishVitals;
}

// ─────────────────────────────────────────────
// 조리 세션 (화구 위 상태 — 세이브 영속)
// ─────────────────────────────────────────────

export type HeatLevel = 0 | 1 | 2 | 3;

export interface CookContent {
  ing: string;
  units: number;
  /** 투입 시각 (시뮬 초) */
  addedAtSec: number;
  /** 투입 당시 단계 */
  addedStage: number;
  doneness: number;
  burnt: number;
  /** 재료 신선도 0~1 (주재료·채소) */
  freshness01: number;
  /** 원천 인벤 아이템 id (표시용) */
  srcItemId?: string;
  /** 실중량 (g 단위 재료) */
  weightG?: number;
}

export type CookStatus = 'idle' | 'cooking' | 'done' | 'burnt';

export interface CookSessionState {
  recipeId: string;
  cookwareId: string;
  heat: HeatLevel;
  tempC: number;
  elapsedSec: number;
  boiling: boolean;
  boilAtSec: number | null;
  mainCookedAtSec: number | null;
  doneAtSec: number | null;
  contents: CookContent[];
  waterMl: number;
  evaporatedMl: number;
  /** 마지막 뒤집기/젓기 (시뮬 초) */
  lastFlipSec: number;
  flips: number;
  inBandSec: number;
  outBandSec: number;
  stageNow: number;
  status: CookStatus;
  /** 최근 사건 로그 (최대 12) */
  events: string[];
  /** 완성 뒤 불을 껐는가 (온도 감쇠 시작) */
  offHeatAtSec: number | null;
}

/** 설치된 화구 — 세이브 영속 · 필드/집 공통 */
export interface DeployedStove {
  instanceId: string;
  heatSourceId: string;
  /** 설치 맵 (집 = 'home') */
  mapId: string;
  tileX: number;
  tileY: number;
  /** 연료 잔량 (강불 기준 분 · 집은 무한 = Infinity 대신 -1) */
  fuelRemainMin: number;
  /** 장착 용기 (없으면 null) */
  cookwareId: string | null;
  /** 장착 용기의 인벤 아이템 id (회수 시 반환) */
  cookwareItemId: string | null;
  /** 스토브 아이템 id (회수 시 반환) */
  stoveItemId: string | null;
  placedAtMs: number;
  /** 마지막 시뮬 시각 (wall-clock) */
  lastTickMs: number;
  session: CookSessionState | null;
}

// ─────────────────────────────────────────────
// 완성 요리 (아이템에 실린다)
// ─────────────────────────────────────────────

export interface DishScores {
  season: number;
  temp: number;
  texture: number;
  fresh: number;
  finish: number;
}

export type SaltLabel = 'bland' | 'ok' | 'salty';
export type SugarLabel = 'ok' | 'sweet' | 'flat';

export interface DishData {
  recipeId: string;
  cookedAtMs: number;
  tempAtDoneC: number;
  /** 완성 시 기준 점수 — 시간 감쇠는 조회 시 `dishStarsAt`이 계산 */
  base: DishScores;
  saltLabel: SaltLabel;
  sugarLabel: SugarLabel;
  contents: { ing: string; units: number }[];
  stoveKind: 'home' | 'field';
  cookwareId: string;
  burnt: boolean;
  servings: number;
  skillRank: number;
  /** 필수 누락(탄 것과 별개 — 이름을 못 쓰는 경우는 완성이 막히므로 보통 0) */
  missingRequired: number;
}

export interface DishStars {
  scores: DishScores;
  /** 별 획득 여부 (간·온도·식감·신선·완성 순) */
  earned: [boolean, boolean, boolean, boolean, boolean];
  stars: number;
  /** 총점 0~100 */
  total: number;
  /** 현재 온도 (°C) */
  tempC: number;
  tempLabel: 'hot' | 'warm' | 'cold';
}
