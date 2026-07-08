/**
 * @file Gear.ts
 * @description 낚시 장비 및 채비 관련 타입 정의
 *
 * 실제 낚시 장비 제원(스펙)을 최대한 반영합니다.
 * GearSpecs.ts의 실제 데이터와 함께 사용됩니다.
 */

// ─────────────────────────────────────────────
// 낚싯대 (Rod) 스펙
// ─────────────────────────────────────────────
export interface RodSpec {
  id: string;
  brand: string;
  modelName: string;
  /** 대 길이 (m) — 예: 5.3, 7.2 */
  lengthM: number;
  /** 호수 표기 — 예: 1.5호, 2호 */
  lineWeightGrade: string;
  /** 적정 원줄 호수 범위 */
  recommendedLineNo: [number, number];
  /** 루어 중량 범위 (g) — 지깅/루어 대용 */
  lureWeightRangeG?: [number, number];
  /** 선수 (가이드 수) */
  guideCount: number;
  /** 조립 수 */
  pieces: number;
  /** 무게 (g) */
  weightG: number;
  /** 가격 (원) */
  priceKRW: number;
  rodType: RodType;
  description: string;
}

export type RodType =
  | 'float_fishing'    // 찌낚시 대
  | 'surfcasting'      // 원투 대
  | 'jigging'          // 지깅 대
  | 'boat_rod'         // 선상 대
  | 'spin'             // 스피닝 대 (루어)
  | 'bait_casting';    // 베이트캐스팅 대

// ─────────────────────────────────────────────
// 릴 (Reel) 스펙
// ─────────────────────────────────────────────
export interface ReelSpec {
  id: string;
  brand: string;
  modelName: string;
  /** 번수 — 예: 2500, 3000, 4000 */
  reelSize: number;
  /** 기어비 — 예: 5.2:1 */
  gearRatio: string;
  /** 최대 드랙력 (kg) */
  maxDragKg: number;
  /** 1회전 권취 길이 (cm) */
  retrievePerCrank: number;
  /** 베어링 수 */
  bearingCount: string;
  /** 자중 (g) */
  weightG: number;
  /** 표준 스풀 원줄 용량 */
  lineCapacity: string;
  /** 가격 (원) */
  priceKRW: number;
  reelType: ReelType;
}

export type ReelType = 'spinning' | 'bait_casting' | 'electric' | 'conventional';

// ─────────────────────────────────────────────
// 낚싯줄 (Line) 스펙
// ─────────────────────────────────────────────
export interface LineSpec {
  id: string;
  brand: string;
  modelName: string;
  /** 호수 — 예: 1.5, 2.0, 3.0 */
  lineNo: number;
  /** 강도 (lb / kg 변환) */
  strengthLb: number;
  /** 굵기 (mm) */
  diameterMm: number;
  /** 소재 */
  material: 'nylon' | 'fluorocarbon' | 'pe_braid' | 'monofilament';
  /** 색상 */
  color: string;
  /** 가격 (원/100m) */
  priceKRW: number;
}

// ─────────────────────────────────────────────
// 찌 (Float) 스펙
// ─────────────────────────────────────────────
export interface FloatSpec {
  id: string;
  brand: string;
  modelName: string;
  /** 호수 — 예: B, 2B, 3B, 00, 0, G2, G5 */
  buoyancyGrade: string;
  /** 부력 (g) — 음수=잠길찌, 양수=뜰찌 */
  buoyancyG: number;
  floatType: FloatType;
  /** 자중 (g) */
  weightG: number;
  /** 가격 (원) */
  priceKRW: number;
}

export type FloatType =
  | 'tube_float'         // 구멍찌 (원줄이 관통)
  | 'fixed_float'        // 고정찌
  | 'sinking_float'      // 잠길찌 (수중찌)
  | 'remote_float';      // 원거리찌

// ─────────────────────────────────────────────
// 채비 유형 (Rig)
// ─────────────────────────────────────────────
export type RigType =
  | 'full_float_flowing'    // 전유동 찌낚시
  | 'semi_float_flowing'    // 반유동 찌낚시
  | 'fixed_float'           // 고정 찌낚시
  | 'surfcasting'           // 원투 채비
  | 'jigging_metal'         // 메탈지그 지깅
  | 'jigging_spoon'         // 스푼 지깅
  | 'sabiki'                // 카드 채비 (Sabiki)
  | 'live_bait_float'       // 생미끼 찌낚시
  | 'bottom_sinker';        // 바닥 봉돌 채비

// ─────────────────────────────────────────────
// 채비 셋업 (플레이어가 실제 설정하는 조합)
// ─────────────────────────────────────────────
export interface TackleSetup {
  rod: RodSpec;
  reel: ReelSpec;
  mainLine: LineSpec;
  /** 목줄 (없을 수도 있음) */
  leaderLine?: LineSpec;
  rigType: RigType;
  /** 찌 (찌낚시 시에만) */
  float?: FloatSpec;
  /** 목줄 길이 (cm) */
  leaderLengthCm?: number;
  /** 바늘 (훅) */
  hook: HookSpec;
  /** 미끼 */
  bait: BaitItem;
  /** 봉돌 (g) — 원투/반유동 등 */
  sinkerG?: number;
  /** 수심 설정 (cm) — 반유동 시 */
  depthCm?: number;
}

export interface HookSpec {
  id: string;
  name: string;
  /** 훅 사이즈 — 예: 4호, 6호 */
  hookSize: string;
  hookType: 'circle' | 'j_hook' | 'treble' | 'octopus';
  material: 'carbon_steel' | 'stainless' | 'vanadium';
}

export interface BaitItem {
  id: string;
  name: string;
  category: BaitCategory;
  /** 입질 보너스 (%). 어종별 보정치는 FishBiteEngine에서 계산 */
  baseEffectiveness: number;
  /** 소모성 여부 (사용 후 교체 필요) */
  isConsumable: boolean;
  /** 야외 채집 가능 여부 */
  canBeForaged: boolean;
  foragingSpotType?: 'rocky_shore' | 'breakwater' | 'sandy_beach';
  /**
   * 아이템 현재 신선도 상태 (UniversalItem 연동 시 설정)
   * undefined이면 상태 변화 없는 가공/인조 미끼
   */
  conditionState?: import('./Item.js').ItemConditionState;
  /**
   * 아이템 현재 사용 목적 (구매처/변환 이력에 따라 결정)
   * undefined이면 기본 fishing_gear_only 처리
   */
  usePurpose?: import('./Item.js').ItemUsePurpose;
}

export type BaitCategory =
  | 'earthworm'                    // 지렁이
  | 'sandworm'                     // 갯지렁이 (청갯지렁이, 참갯지렁이)
  | 'squid'                        // 오징어 (낚시점 조각)
  | 'mussel'                       // 홍합
  | 'barnacle'                     // 거북손
  | 'crab'                         // 돌게/게류
  | 'prawn'                        // 새우
  | 'fish_strip'                   // 생선 살점
  | 'artificial_lure'              // 루어 (스푼, 지그 등)
  | 'artificial_worm'              // 인조 웜
  | 'ground_bait'                  // 집어제 (기존 통합)
  | 'dry_ground_bait'              // 건식 집어제 (빵가루형)
  | 'wet_ground_bait'              // 습식 집어제
  | 'krill_frozen'                 // 냉동 크릴 (각크릴)
  | 'boiled_barley'                // 보리 압맥
  | 'corn'                         // 옥수수 (통조림 포함)
  | 'live_fish'                    // 활어 생미끼 (직판장 구매)
  | 'chilled_fish_strip'           // 선어 조각 미끼
  | 'organic_liquid_attractant'    // 생물 내장 액기스
  | 'bread';                       // 빵 (잡어용, 마트 빵가루 대체)
