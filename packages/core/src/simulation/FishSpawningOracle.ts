/**
 * @file FishSpawningOracle.ts
 * @description 다차원 어종 마스터 + 물때/미끼/지형 연동 오라클 (Phase 3, 21종 확장)
 *
 * 입질이 성공했을 때 어떤 물고기가 낚일지 결정한다.
 *  - 마스터 스키마: 서식 지형/수심 범위/수심층/미끼 선호도(0~100)/크기·무게 분포/
 *    성비(성전환 규칙 포함)/규제(금지체장·금어기)/1~15물때 활성도/야간 보정/
 *    파이팅 프로필(여박기·횡이동·바늘털이 패턴 가중치, 입 강도, 목줄 절단)
 *  - 필터·가중: 현재 미끼 수심층 + 지형(여밭/모래) + 미끼 종류 + 물때 + 주야간
 *  - 정규 분포(Box-Muller)로 최종 크기(cm)/무게(g)/성별 결정
 *
 * 실측 기반 데이터 (2026-07-15 사용자 제공 21종) — 추후 API 연동으로 교체 예정.
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

/** 수심층 분류 */
export type SwimLayer = 'surface' | 'mid' | 'bottom';

/** 미끼 분류 키 */
export type BaitKey =
  | 'krill'       // 크릴
  | 'worm_blue'   // 청갯지렁이/지렁이
  | 'worm_king'   // 참갯지렁이(혼무시)
  | 'crab'        // 게·소라
  | 'shellfish'   // 조개살·개불
  | 'urchin'      // 성게
  | 'corn'        // 옥수수
  | 'fishcut'     // 생선·오징어 살
  | 'livefish'    // 살아있는 생미끼 (전갱이/미꾸라지 등)
  | 'lure';       // 루어류

/** 서식 지형 분류 */
export type HabitatTerrain = 'reef' | 'sand' | 'mud' | 'mixed' | 'open' | 'structure';

/** 파이팅 프로필 — 어종별 저항 패턴/난이도 */
export interface FightProfile {
  /** 기본 힘 계수 (0.1 잔어 ~ 1.0 대형 회유어) */
  basePower: number;
  /** 패턴 가중치 — jump: 바늘털이 / dive: 여 박기 / lateral: 좌우 횡이동(쓸림) */
  patternWeights: { jump: number; dive: number; lateral: number };
  /** 패턴 발동 간격 배율 (1.0 표준, 낮을수록 자주 저항) */
  intervalMult: number;
  /** 입 연약도 (0~1) — 높으면 과텐션 시 바늘 빠짐 급증 (전갱이 등) */
  mouthFragility: number;
  /** 목줄 절단 어종 (복어류 — 탈출 시 목줄 손실) */
  lineCutter?: boolean;
}

/** 어종 마스터 스펙 */
export interface FishMasterSpec {
  speciesId: string;
  nameKo: string;
  nameEn: string;
  /** 서식 지형 */
  habitat: HabitatTerrain[];
  /** 서식 수심 범위 (m) */
  minDepthM: number;
  maxDepthM: number;
  /** 선호 수심층 */
  preferredLayers: SwimLayer[];
  /** 미끼 선호도 (0~100) */
  baitPreference: Partial<Record<BaitKey, number>>;
  /** 크기 분포 (cm) */
  minCm: number;
  maxCm: number;
  meanCm: number;
  sdCm: number;
  /** 무게 계수 — W(g) ≈ factor × L(cm)^3 */
  weightFactor: number;
  /** 수컷 비율 (0~1) — sexRule 있으면 크기 기반으로 대체 */
  maleRatio: number;
  /** 크기(cm) → 수컷 비율 (성전환 어종: 감성돔/참돔/용치놀래기 등) */
  sexRule?: (lengthCm: number) => number;
  /** 생태 특이사항 (도감 표시용) */
  sexNote?: string;
  /** 금지체장 (cm) */
  legalMinCm?: number;
  /** 금어기 (월) */
  closedMonths?: number[];
  /** 1~15물때 활성도 (0~1) */
  tideActivity: number[];
  /** 야간 활성 배율 (기본 1.0, 2.0 = 야간 어종) */
  nightBonus?: number;
  fight: FightProfile;
}

/** 균일 15칸 활성도 */
function flatTide(v: number): number[] {
  return Array.from({ length: 15 }, () => v);
}
/** 사리(7~9물) 피크 활성도 */
function sariPeak(base: number, peak: number): number[] {
  return Array.from({ length: 15 }, (_, i) => {
    const d = Math.abs(i + 1 - 8);
    return base + (peak - base) * Math.max(0, 1 - d / 5);
  });
}

/**
 * 어종 마스터 DB (21종 — 사용자 제공 실측 데이터 기반)
 * 추후 API 연동 매칭 예정.
 */
export const ORACLE_FISH_DB: FishMasterSpec[] = [
  {
    speciesId: 'stone_beakperch', nameKo: '돌돔', nameEn: 'Striped Beakperch',
    habitat: ['reef'], minDepthM: 5, maxDepthM: 30, preferredLayers: ['bottom'],
    baitPreference: { urchin: 50, worm_king: 30, crab: 15, krill: 5 },
    minCm: 20, maxCm: 80, meanCm: 48, sdCm: 10, weightFactor: 0.022, maleRatio: 0.5,
    sexNote: '수컷 성어는 줄무늬가 사라지고 주둥이가 검게 변함(강구)',
    legalMinCm: 24, tideActivity: sariPeak(0.4, 0.85),
    fight: { basePower: 0.85, patternWeights: { jump: 0.1, dive: 0.7, lateral: 0.2 }, intervalMult: 0.9, mouthFragility: 0.1 },
  },
  {
    speciesId: 'spotted_knifejaw', nameKo: '강담돔', nameEn: 'Spotted Knifejaw',
    habitat: ['reef'], minDepthM: 10, maxDepthM: 40, preferredLayers: ['bottom'],
    baitPreference: { urchin: 45, crab: 30, worm_king: 20, krill: 5 },
    minCm: 22, maxCm: 90, meanCm: 52, sdCm: 11, weightFactor: 0.024, maleRatio: 0.5,
    sexNote: '수컷 성어는 주둥이가 하얗게 변함(백화)',
    legalMinCm: 24, tideActivity: sariPeak(0.35, 0.8),
    fight: { basePower: 0.9, patternWeights: { jump: 0.1, dive: 0.65, lateral: 0.25 }, intervalMult: 0.9, mouthFragility: 0.1 },
  },
  {
    speciesId: 'amberjack', nameKo: '부시리', nameEn: 'Yellowtail Amberjack',
    habitat: ['open'], minDepthM: 2, maxDepthM: 30, preferredLayers: ['surface', 'mid'],
    baitPreference: { livefish: 50, lure: 30, krill: 20 },
    minCm: 50, maxCm: 150, meanCm: 95, sdCm: 20, weightFactor: 0.01, maleRatio: 0.5,
    sexNote: '자웅이체 — 드랙을 치고 나가 여 밭에 줄을 쓸어버리는 힘이 강함',
    tideActivity: sariPeak(0.3, 0.9),
    fight: { basePower: 1.0, patternWeights: { jump: 0.3, dive: 0.1, lateral: 0.6 }, intervalMult: 0.7, mouthFragility: 0.05 },
  },
  {
    speciesId: 'red_seabream', nameKo: '참돔', nameEn: 'Red Seabream',
    habitat: ['mixed'], minDepthM: 20, maxDepthM: 100, preferredLayers: ['mid', 'bottom'],
    baitPreference: { worm_king: 40, krill: 30, shellfish: 20, corn: 10 },
    minCm: 22, maxCm: 100, meanCm: 52, sdCm: 13, weightFactor: 0.019,
    maleRatio: 0.5,
    sexRule: (len) => (len < 30 ? 0.5 : 0.55),
    sexNote: '자웅동체 성전환 — 이마가 튀어나온 개체는 주로 수컷 성어',
    legalMinCm: 25, tideActivity: sariPeak(0.4, 0.85),
    fight: { basePower: 0.8, patternWeights: { jump: 0.2, dive: 0.45, lateral: 0.35 }, intervalMult: 1.0, mouthFragility: 0.15 },
  },
  {
    speciesId: 'chub_mackerel', nameKo: '고등어', nameEn: 'Chub Mackerel',
    habitat: ['open', 'structure'], minDepthM: 0, maxDepthM: 20, preferredLayers: ['surface', 'mid'],
    baitPreference: { krill: 60, worm_blue: 30, lure: 10 },
    minCm: 15, maxCm: 50, meanCm: 30, sdCm: 5, weightFactor: 0.0185, maleRatio: 0.5,
    sexNote: '무리 지어 회유 — 찌를 사방으로 빠르게 끌고 다님',
    legalMinCm: 21, closedMonths: [5], tideActivity: flatTide(0.75),
    fight: { basePower: 0.35, patternWeights: { jump: 0.25, dive: 0.05, lateral: 0.7 }, intervalMult: 0.8, mouthFragility: 0.3 },
  },
  {
    speciesId: 'horse_mackerel', nameKo: '전갱이', nameEn: 'Horse Mackerel',
    habitat: ['structure', 'reef'], minDepthM: 5, maxDepthM: 30, preferredLayers: ['mid', 'bottom'],
    baitPreference: { krill: 60, worm_blue: 30, lure: 10 },
    minCm: 12, maxCm: 45, meanCm: 25, sdCm: 5, weightFactor: 0.016, maleRatio: 0.5,
    sexNote: '입가가 약해 과텐션 시 입술이 찢어져 바늘이 빠지기 쉬움',
    tideActivity: flatTide(0.75),
    fight: { basePower: 0.3, patternWeights: { jump: 0.3, dive: 0.1, lateral: 0.6 }, intervalMult: 1.0, mouthFragility: 0.8 },
  },
  {
    speciesId: 'rainbow_wrasse', nameKo: '용치놀래기', nameEn: 'Multicolorfin Rainbow Wrasse',
    habitat: ['reef'], minDepthM: 2, maxDepthM: 15, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 50, krill: 40, shellfish: 10 },
    minCm: 10, maxCm: 26, meanCm: 18, sdCm: 3, weightFactor: 0.02,
    maleRatio: 0.3,
    sexRule: (len) => (len > 22 ? 0.85 : 0.3),
    sexNote: '암컷→수컷 성전환 — 우두머리가 화려한 녹색 수컷으로 변함',
    tideActivity: flatTide(0.85),
    fight: { basePower: 0.15, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 1.2, mouthFragility: 0.3 },
  },
  {
    speciesId: 'fine_puffer', nameKo: '졸복어', nameEn: 'Finepatterned Puffer',
    habitat: ['sand', 'structure'], minDepthM: 1, maxDepthM: 10, preferredLayers: ['bottom'],
    baitPreference: { krill: 50, worm_blue: 45, shellfish: 5 },
    minCm: 6, maxCm: 15, meanCm: 10, sdCm: 2, weightFactor: 0.05, maleRatio: 0.5,
    sexNote: '테트로도톡신 맹독 — 이빨로 바늘과 목줄을 갉아 끊음',
    tideActivity: flatTide(0.8),
    fight: { basePower: 0.1, patternWeights: { jump: 0.2, dive: 0.3, lateral: 0.5 }, intervalMult: 1.3, mouthFragility: 0.2, lineCutter: true },
  },
  {
    speciesId: 'tiger_puffer', nameKo: '참복어(자주복)', nameEn: 'Tiger Puffer',
    habitat: ['mixed'], minDepthM: 10, maxDepthM: 50, preferredLayers: ['bottom'],
    baitPreference: { shellfish: 40, worm_king: 30, krill: 20, fishcut: 10 },
    minCm: 18, maxCm: 75, meanCm: 40, sdCm: 9, weightFactor: 0.028, maleRatio: 0.5,
    sexNote: '치명적 맹독 — 이빨 힘이 강해 와이어가 아니면 채비를 끊음',
    tideActivity: flatTide(0.6),
    fight: { basePower: 0.55, patternWeights: { jump: 0.2, dive: 0.5, lateral: 0.3 }, intervalMult: 1.1, mouthFragility: 0.15, lineCutter: true },
  },
  {
    speciesId: 'conger_eel', nameKo: '붕장어', nameEn: 'Conger Eel',
    habitat: ['sand', 'mud'], minDepthM: 5, maxDepthM: 100, preferredLayers: ['bottom'],
    baitPreference: { fishcut: 60, worm_blue: 40 },
    minCm: 25, maxCm: 100, meanCm: 55, sdCm: 15, weightFactor: 0.005, maleRatio: 0.4,
    sexRule: (len) => (len > 60 ? 0.01 : 0.5),
    sexNote: '60cm 이상 대물은 99% 암컷 — 원줄을 휘감아 꼬아버림',
    legalMinCm: 35, nightBonus: 2.2, tideActivity: flatTide(0.6),
    fight: { basePower: 0.5, patternWeights: { jump: 0.1, dive: 0.6, lateral: 0.3 }, intervalMult: 1.1, mouthFragility: 0.1 },
  },
  {
    speciesId: 'yellowfin_goby', nameKo: '문절망둑', nameEn: 'Yellowfin Goby',
    habitat: ['mud', 'sand'], minDepthM: 0.5, maxDepthM: 5, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 70, krill: 20, lure: 10 },
    minCm: 8, maxCm: 25, meanCm: 15, sdCm: 3, weightFactor: 0.021, maleRatio: 0.5,
    sexNote: '1년생 — 식탐이 강해 미끼를 넣자마자 삼킴',
    tideActivity: flatTide(0.9),
    fight: { basePower: 0.1, patternWeights: { jump: 0.2, dive: 0.4, lateral: 0.4 }, intervalMult: 1.4, mouthFragility: 0.3 },
  },
  {
    speciesId: 'surfperch', nameKo: '망상어', nameEn: 'Ditrema temminckii',
    habitat: ['structure'], minDepthM: 2, maxDepthM: 10, preferredLayers: ['mid', 'bottom'],
    baitPreference: { krill: 60, worm_blue: 35, corn: 5 },
    minCm: 12, maxCm: 30, meanCm: 21, sdCm: 3, weightFactor: 0.027, maleRatio: 0.5,
    sexNote: '태생 어종 — 봄에 완전히 자란 새끼를 직접 출산',
    tideActivity: flatTide(0.7),
    fight: { basePower: 0.25, patternWeights: { jump: 0.2, dive: 0.3, lateral: 0.5 }, intervalMult: 1.2, mouthFragility: 0.35 },
  },
  {
    speciesId: 'scorpionfish', nameKo: '쏨뱅이', nameEn: 'False Kelpfish',
    habitat: ['reef', 'structure'], minDepthM: 5, maxDepthM: 40, preferredLayers: ['bottom'],
    baitPreference: { fishcut: 40, worm_blue: 40, krill: 20 },
    minCm: 10, maxCm: 35, meanCm: 20, sdCm: 4, weightFactor: 0.031, maleRatio: 0.5,
    sexNote: '난태생 — 미끼가 눈앞에 정렬될 때 물고 틈새로 파고듦',
    nightBonus: 1.5, tideActivity: flatTide(0.65),
    fight: { basePower: 0.35, patternWeights: { jump: 0.05, dive: 0.8, lateral: 0.15 }, intervalMult: 1.0, mouthFragility: 0.1 },
  },
  {
    speciesId: 'fat_greenling', nameKo: '쥐노래미', nameEn: 'Fat Greenling',
    habitat: ['reef'], minDepthM: 2, maxDepthM: 30, preferredLayers: ['bottom'],
    baitPreference: { worm_king: 45, krill: 35, crab: 20 },
    minCm: 15, maxCm: 65, meanCm: 35, sdCm: 8, weightFactor: 0.016, maleRatio: 0.5,
    sexNote: '산란기 수컷은 황금색 혼인색으로 변해 알을 지킴',
    legalMinCm: 20, closedMonths: [11, 12], tideActivity: flatTide(0.65),
    fight: { basePower: 0.45, patternWeights: { jump: 0.1, dive: 0.6, lateral: 0.3 }, intervalMult: 1.0, mouthFragility: 0.15 },
  },
  {
    speciesId: 'greenling', nameKo: '노래미', nameEn: 'Hexagrammos otakii',
    habitat: ['reef', 'structure'], minDepthM: 1, maxDepthM: 15, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 60, krill: 30, shellfish: 10 },
    minCm: 10, maxCm: 30, meanCm: 18, sdCm: 3, weightFactor: 0.02, maleRatio: 0.5,
    sexNote: '측선 1개 (쥐노래미는 5개) — 꼬리 끝이 둥근 부채꼴',
    tideActivity: flatTide(0.75),
    fight: { basePower: 0.2, patternWeights: { jump: 0.1, dive: 0.6, lateral: 0.3 }, intervalMult: 1.3, mouthFragility: 0.2 },
  },
  {
    speciesId: 'golden_rockfish', nameKo: '황볼락', nameEn: 'Golden Rockfish',
    habitat: ['reef'], minDepthM: 15, maxDepthM: 50, preferredLayers: ['bottom'],
    baitPreference: { fishcut: 45, worm_king: 35, krill: 20 },
    minCm: 12, maxCm: 35, meanCm: 21, sdCm: 4, weightFactor: 0.026, maleRatio: 0.5,
    sexNote: '난태생 — 야간에 바위 그늘에 군집',
    legalMinCm: 15, nightBonus: 2.0, tideActivity: flatTide(0.6),
    fight: { basePower: 0.3, patternWeights: { jump: 0.1, dive: 0.6, lateral: 0.3 }, intervalMult: 1.1, mouthFragility: 0.2 },
  },
  {
    speciesId: 'blue_rockfish', nameKo: '청볼락', nameEn: 'Blue Rockfish',
    habitat: ['reef'], minDepthM: 2, maxDepthM: 15, preferredLayers: ['mid'],
    baitPreference: { krill: 60, lure: 30, worm_blue: 10 },
    minCm: 10, maxCm: 30, meanCm: 18, sdCm: 3, weightFactor: 0.024, maleRatio: 0.5,
    sexNote: '중층에 무리 지어 조류를 타는 회유성 — 찌낚시 주 타겟',
    legalMinCm: 15, tideActivity: sariPeak(0.5, 0.85),
    fight: { basePower: 0.3, patternWeights: { jump: 0.2, dive: 0.3, lateral: 0.5 }, intervalMult: 1.1, mouthFragility: 0.25 },
  },
  {
    speciesId: 'black_rockfish', nameKo: '조피볼락(우럭)', nameEn: 'Jacopever',
    habitat: ['reef', 'structure'], minDepthM: 5, maxDepthM: 80, preferredLayers: ['bottom'],
    baitPreference: { livefish: 45, fishcut: 30, worm_king: 20, krill: 5 },
    minCm: 15, maxCm: 60, meanCm: 35, sdCm: 8, weightFactor: 0.021, maleRatio: 0.5,
    sexNote: '탐식성 — 물면 돌 틈으로 단숨에 파고드는 여박기 대표 주자',
    legalMinCm: 23, nightBonus: 1.4, tideActivity: flatTide(0.6),
    fight: { basePower: 0.6, patternWeights: { jump: 0.05, dive: 0.85, lateral: 0.1 }, intervalMult: 0.9, mouthFragility: 0.1 },
  },
  {
    speciesId: 'flatfish', nameKo: '광어(넙치)', nameEn: 'Olive Flounder',
    habitat: ['sand'], minDepthM: 5, maxDepthM: 100, preferredLayers: ['bottom'],
    baitPreference: { livefish: 50, lure: 40, worm_king: 10 },
    minCm: 20, maxCm: 100, meanCm: 60, sdCm: 13, weightFactor: 0.013,
    maleRatio: 0.5,
    sexRule: (len) => (len > 70 ? 0.2 : 0.5),
    sexNote: '두 눈이 왼쪽 — 암컷이 압도적으로 크게 자람',
    legalMinCm: 21, tideActivity: sariPeak(0.4, 0.75),
    fight: { basePower: 0.7, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 1.0, mouthFragility: 0.1 },
  },
  {
    speciesId: 'flounder', nameKo: '도다리(문치가자미)', nameEn: 'Starry Flounder',
    habitat: ['sand', 'mud'], minDepthM: 10, maxDepthM: 150, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 70, worm_king: 20, krill: 10 },
    minCm: 12, maxCm: 50, meanCm: 28, sdCm: 6, weightFactor: 0.018, maleRatio: 0.5,
    sexNote: '두 눈이 오른쪽 — 입이 작고 예민해 소형 바늘에 잘 잡힘',
    legalMinCm: 20, closedMonths: [12, 1], tideActivity: flatTide(0.6),
    fight: { basePower: 0.3, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 1.2, mouthFragility: 0.2 },
  },
  {
    speciesId: 'black_seabream', nameKo: '감성돔', nameEn: 'Black Seabream',
    habitat: ['reef'], minDepthM: 10, maxDepthM: 40, preferredLayers: ['bottom'],
    baitPreference: { crab: 40, corn: 30, krill: 20, worm_blue: 10 },
    minCm: 18, maxCm: 72, meanCm: 40, sdCm: 8, weightFactor: 0.023,
    maleRatio: 0.5,
    sexRule: (len) => (len < 30 ? 0.9 : len < 40 ? 0.6 : 0.25),
    sexNote: '모두 수컷으로 태어나 4~5년생에 70~80%가 암컷으로 성전환',
    legalMinCm: 25, closedMonths: [5], tideActivity: sariPeak(0.4, 1.0),
    fight: { basePower: 0.75, patternWeights: { jump: 0.05, dive: 0.75, lateral: 0.2 }, intervalMult: 0.95, mouthFragility: 0.1 },
  },
];

/** 스폰/입질 컨텍스트 */
export interface SpawnContext {
  /** 현재 미끼 수심 (m) */
  depthZ: number;
  /** 착수 지점 바닥 수심 (m) */
  zMax: number;
  /** 지역 ID */
  region: string;
  /** 물때 (1~15) */
  tidePhase: number;
  /** 월 (1~12) */
  month: number;
  /** 현재 미끼 종류 */
  baitKey: BaitKey;
  /** 미끼가 여 밭(암초) 지형에 있는지 */
  inReef: boolean;
  /** 야간 여부 */
  isNight: boolean;
  /**
   * 지역 어획량 기반 스폰 가중 배율 (speciesId → 배율).
   * KOSIS 시도별 어종별 어획량 API를 캐시한 값 — 미지정 어종은 1.0.
   */
  catchWeightBySpecies?: Partial<Record<string, number>>;
}

/** 당첨 물고기 결과 */
export interface SpawnedFish {
  speciesId: string;
  nameKo: string;
  lengthCm: number;
  weightG: number;
  sex: 'M' | 'F';
  isUndersized: boolean;
  isClosedSeason: boolean;
  /** 파이팅 힘 계수 (크기 × 어종 기본 힘) */
  powerFactor: number;
  /** 어종 파이팅 프로필 */
  fight: FightProfile;
  /** 목줄 절단 어종 (복어류) */
  lineCutter: boolean;
  sexNote?: string;
}

/** 정규 분포 난수 (Box-Muller) */
function gaussian(mean: number, sd: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * sd;
}

/** 수심(m)/바닥 수심 비율로 수심층 분류 */
export function classifyLayer(depthZ: number, zMax: number): SwimLayer {
  const ratio = zMax > 0 ? depthZ / zMax : 0;
  if (ratio < 0.33) return 'surface';
  if (ratio < 0.72) return 'mid';
  return 'bottom';
}

/** 지형 적합 여부 */
function terrainFit(spec: FishMasterSpec, inReef: boolean): number {
  const reefLike = spec.habitat.some((h) => h === 'reef' || h === 'structure');
  const sandLike = spec.habitat.some((h) => h === 'sand' || h === 'mud' || h === 'open');
  const mixed = spec.habitat.includes('mixed');
  if (inReef) return reefLike || mixed ? 1 : 0.15;
  return sandLike || mixed ? 1 : 0.25;
}

/** 후보 어종 + 가중치 계산 (스폰/미끼 친화도 공용) */
function weightedCandidates(ctx: SpawnContext): { spec: FishMasterSpec; weight: number }[] {
  const layer = classifyLayer(ctx.depthZ, ctx.zMax);
  const tideIdx = Math.min(14, Math.max(0, Math.round(ctx.tidePhase) - 1));

  return ORACLE_FISH_DB.map((spec) => {
    // 수심층 적합
    const layerW = spec.preferredLayers.includes(layer) ? 1 : 0.15;
    // 서식 수심 범위 적합 (바닥 수심 기준 느슨하게)
    const depthW = ctx.zMax >= spec.minDepthM * 0.5 && ctx.zMax <= spec.maxDepthM * 1.5 ? 1 : 0.2;
    // 지형 적합
    const terrW = terrainFit(spec, ctx.inReef);
    // 미끼 선호도 (미정의 미끼는 기본 5)
    const baitW = Math.max(0.03, (spec.baitPreference[ctx.baitKey] ?? 5) / 50);
    // 물때 활성도
    const tideW = Math.max(0.05, spec.tideActivity[tideIdx] ?? 0.5);
    // 주야간
    const nb = spec.nightBonus ?? 1;
    const dayNightW = ctx.isNight ? nb : nb > 1.5 ? 0.55 : 1;
    // 지역 어획량 통계 가중 (KOSIS 캐시 — 없으면 1.0)
    const catchW = ctx.catchWeightBySpecies?.[spec.speciesId] ?? 1;

    return { spec, weight: layerW * depthW * terrW * baitW * tideW * dayNightW * catchW };
  }).filter((c) => c.weight > 0.001);
}

/**
 * 현재 미끼/지형/수심 조건의 미끼 친화도 (0.25 ~ 1.6).
 * BiteProbabilityEngine의 기본 입질 확률에 곱해 사용한다.
 */
export function getBaitAffinity(ctx: SpawnContext): number {
  const candidates = weightedCandidates(ctx);
  if (candidates.length === 0) return 0.25;
  const totalW = candidates.reduce((a, c) => a + c.weight, 0);
  // 가중 평균 미끼 선호도
  const avgPref = candidates.reduce(
    (a, c) => a + (c.spec.baitPreference[ctx.baitKey] ?? 5) * c.weight, 0,
  ) / totalW;
  return Math.min(1.6, Math.max(0.25, avgPref / 40));
}

/**
 * 입질 성공 시 당첨 어종/개체 결정 팩토리.
 * 지형·수심층·미끼 선호·물때·주야간 가중 추첨 → 정규 분포 개체 생성.
 */
export function spawnFish(ctx: SpawnContext): SpawnedFish {
  let candidates = weightedCandidates(ctx);
  if (candidates.length === 0) {
    candidates = ORACLE_FISH_DB.map((spec) => ({ spec, weight: 1 }));
  }

  const total = candidates.reduce((a, c) => a + c.weight, 0);
  let roll = Math.random() * total;
  let picked = candidates[0].spec;
  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) { picked = c.spec; break; }
  }

  // 개체 생성
  const lengthCm = Math.round(
    Math.min(picked.maxCm, Math.max(picked.minCm, gaussian(picked.meanCm, picked.sdCm))) * 10,
  ) / 10;
  const weightG = Math.round(picked.weightFactor * Math.pow(lengthCm, 3));
  const maleRatio = picked.sexRule ? picked.sexRule(lengthCm) : picked.maleRatio;
  const sex: 'M' | 'F' = Math.random() < maleRatio ? 'M' : 'F';

  const isUndersized = picked.legalMinCm !== undefined && lengthCm < picked.legalMinCm;
  const isClosedSeason = picked.closedMonths?.includes(ctx.month) ?? false;
  // 힘 계수: 어종 기본 힘 × 크기 비율 보정
  const powerFactor = Math.min(1.15, Math.max(0.12,
    picked.fight.basePower * (0.55 + 0.65 * (lengthCm / picked.maxCm)),
  ));

  return {
    speciesId: picked.speciesId,
    nameKo: picked.nameKo,
    lengthCm,
    weightG,
    sex,
    isUndersized,
    isClosedSeason,
    powerFactor,
    fight: picked.fight,
    lineCutter: picked.fight.lineCutter ?? false,
    sexNote: picked.sexNote,
  };
}
