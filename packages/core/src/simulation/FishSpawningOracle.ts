/**
 * @file FishSpawningOracle.ts
 * @description 다차원 어종 마스터 + 물때/미끼/지형 연동 오라클 (Phase 3, 43종)
 *
 * 입질이 성공했을 때 어떤 물고기가 낚일지 결정한다.
 *  - 마스터 스키마: 서식 지형/수심 범위/수심층/미끼 선호도(0~100)/크기·무게 분포/
 *    성비(성전환 규칙 포함)/규제(금지체장·금어기)/1~15물때 활성도/야간 보정/
 *    파이팅 프로필(여박기·횡이동·바늘털이 패턴 가중치, 입 강도, 목줄 절단)
 *  - 필터·가중: 현재 미끼 수심층 + 지형(여밭/모래) + 미끼 종류 + 물때 + 주야간
 *  - 정규 분포(Box-Muller)로 최종 크기(cm)/무게(g)/성별 결정
 *
 * 실측 기반 데이터 (2026-07-15~16 사용자 제공 43종) — 추후 API 연동으로 교체 예정.
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
  | 'bread'       // 빵가루 경단·떡밥 (벵에돔/숭어류)
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
  /** 에기 전용 두족류 — 스폰 필터(speciesFilter)에 포함될 때만 후보에 오른다 */
  egiOnly?: boolean;
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
 * 어종 마스터 DB (43종 — 사용자 제공 실측 데이터 기반)
 * 추후 API 연동 매칭 예정.
 */
export const ORACLE_FISH_DB: FishMasterSpec[] = [
  {
    speciesId: 'stone_beakperch', nameKo: '돌돔', nameEn: 'Striped Beakperch',
    habitat: ['reef'], minDepthM: 5, maxDepthM: 30, preferredLayers: ['bottom'],
    baitPreference: { urchin: 50, worm_king: 30, crab: 15, krill: 5 },
    minCm: 20, maxCm: 80, meanCm: 48, sdCm: 10, weightFactor: 0.022, maleRatio: 0.5,
    sexNote: '수컷 성어는 줄무늬가 사라지고 주둥이가 검게 변함(강구)',
    // 주행성 — 시력에 의존하는 낮 사냥꾼, 야간 활동 거의 없음
    legalMinCm: 24, nightBonus: 0.35, tideActivity: sariPeak(0.4, 0.85),
    fight: { basePower: 0.85, patternWeights: { jump: 0.1, dive: 0.7, lateral: 0.2 }, intervalMult: 0.9, mouthFragility: 0.1 },
  },
  {
    speciesId: 'spotted_knifejaw', nameKo: '강담돔', nameEn: 'Spotted Knifejaw',
    habitat: ['reef'], minDepthM: 10, maxDepthM: 40, preferredLayers: ['bottom'],
    baitPreference: { urchin: 45, crab: 30, worm_king: 20, krill: 5 },
    minCm: 22, maxCm: 90, meanCm: 52, sdCm: 11, weightFactor: 0.024, maleRatio: 0.5,
    sexNote: '수컷 성어는 주둥이가 하얗게 변함(백화)',
    // 주행성 — 돌돔과 동일한 낮 시력 사냥꾼
    legalMinCm: 24, nightBonus: 0.35, tideActivity: sariPeak(0.35, 0.8),
    fight: { basePower: 0.9, patternWeights: { jump: 0.1, dive: 0.65, lateral: 0.25 }, intervalMult: 0.9, mouthFragility: 0.1 },
  },
  {
    speciesId: 'amberjack', nameKo: '부시리', nameEn: 'Yellowtail Amberjack',
    habitat: ['open'], minDepthM: 2, maxDepthM: 30, preferredLayers: ['surface', 'mid'],
    baitPreference: { livefish: 50, lure: 30, krill: 20 },
    minCm: 50, maxCm: 150, meanCm: 95, sdCm: 20, weightFactor: 0.01, maleRatio: 0.5,
    sexNote: '자웅이체 — 드랙을 치고 나가 여 밭에 줄을 쓸어버리는 힘이 강함',
    // 여명/황혼 피딩 회유어 — 한밤엔 활성 급감
    nightBonus: 0.5, tideActivity: sariPeak(0.3, 0.9),
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
    // 주야 모두 먹지만 밤 대물 원투/타이라바 실적이 좋은 어종
    legalMinCm: 25, nightBonus: 1.3, tideActivity: sariPeak(0.4, 0.85),
    fight: { basePower: 0.8, patternWeights: { jump: 0.2, dive: 0.45, lateral: 0.35 }, intervalMult: 1.0, mouthFragility: 0.15 },
  },
  {
    speciesId: 'chub_mackerel', nameKo: '고등어', nameEn: 'Chub Mackerel',
    // 표층~중층 회유 — 서식 수심대 자체는 0~300m로 넓음 (실측 데이터 2026-07-16)
    habitat: ['open', 'structure'], minDepthM: 0, maxDepthM: 300, preferredLayers: ['surface', 'mid'],
    baitPreference: { krill: 60, worm_blue: 30, lure: 10 },
    minCm: 15, maxCm: 60, meanCm: 32, sdCm: 5, weightFactor: 0.0185, maleRatio: 0.5,
    sexNote: '무리 지어 회유 — 찌를 사방으로 빠르게 끌고 다님',
    // 야간 집어등 불빛에 유집 — 방파제 밤 고등어 카드채비 실적
    legalMinCm: 21, closedMonths: [4, 5, 6], nightBonus: 1.2, tideActivity: flatTide(0.75),
    fight: { basePower: 0.35, patternWeights: { jump: 0.25, dive: 0.05, lateral: 0.7 }, intervalMult: 0.8, mouthFragility: 0.3 },
  },
  {
    speciesId: 'horse_mackerel', nameKo: '전갱이', nameEn: 'Japanese Horse Mackerel',
    // 연안 회유 5~50m, 야간 집어등에 강하게 반응 (실측 데이터 2026-07-16)
    habitat: ['structure', 'reef'], minDepthM: 5, maxDepthM: 50, preferredLayers: ['mid', 'bottom'],
    baitPreference: { krill: 60, worm_blue: 30, lure: 10 },
    minCm: 12, maxCm: 50, meanCm: 25, sdCm: 5, weightFactor: 0.016, maleRatio: 0.5,
    sexNote: '입가가 약해 과텐션 시 입술이 찢어져 바늘이 빠지기 쉬움. 야간 집어등 불빛에 강하게 반응',
    nightBonus: 1.4, tideActivity: flatTide(0.75),
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
    // 놀래기류는 해가 지면 모래에 파묻혀 잠든다 — 야간엔 사실상 안 잡힘
    nightBonus: 0.1, tideActivity: flatTide(0.85),
    fight: { basePower: 0.15, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 1.2, mouthFragility: 0.3 },
  },
  {
    speciesId: 'fine_puffer', nameKo: '졸복어', nameEn: 'Finepatterned Puffer',
    habitat: ['sand', 'structure'], minDepthM: 1, maxDepthM: 10, preferredLayers: ['bottom'],
    baitPreference: { krill: 50, worm_blue: 45, shellfish: 5 },
    minCm: 6, maxCm: 15, meanCm: 10, sdCm: 2, weightFactor: 0.05, maleRatio: 0.5,
    sexNote: '테트로도톡신 맹독 — 이빨로 바늘과 목줄을 갉아 끊음',
    // 복어류는 주행성 — 밤엔 모래에 몸을 묻고 휴면
    nightBonus: 0.4, tideActivity: flatTide(0.8),
    fight: { basePower: 0.1, patternWeights: { jump: 0.2, dive: 0.3, lateral: 0.5 }, intervalMult: 1.3, mouthFragility: 0.2, lineCutter: true },
  },
  {
    speciesId: 'tiger_puffer', nameKo: '참복어(자주복)', nameEn: 'Tiger Puffer',
    habitat: ['mixed'], minDepthM: 10, maxDepthM: 50, preferredLayers: ['bottom'],
    baitPreference: { shellfish: 40, worm_king: 30, krill: 20, fishcut: 10 },
    minCm: 18, maxCm: 75, meanCm: 40, sdCm: 9, weightFactor: 0.028, maleRatio: 0.5,
    sexNote: '치명적 맹독 — 이빨 힘이 강해 와이어가 아니면 채비를 끊음',
    // 복어류는 주행성
    nightBonus: 0.4, tideActivity: flatTide(0.6),
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
    // 낮 생활낚시 대표 어종 — 밤엔 활성 저하
    nightBonus: 0.6, tideActivity: flatTide(0.9),
    fight: { basePower: 0.1, patternWeights: { jump: 0.2, dive: 0.4, lateral: 0.4 }, intervalMult: 1.4, mouthFragility: 0.3 },
  },
  {
    speciesId: 'surfperch', nameKo: '망상어', nameEn: 'Ditrema temminckii',
    habitat: ['structure'], minDepthM: 2, maxDepthM: 10, preferredLayers: ['mid', 'bottom'],
    baitPreference: { krill: 60, worm_blue: 35, corn: 5 },
    minCm: 12, maxCm: 30, meanCm: 21, sdCm: 3, weightFactor: 0.027, maleRatio: 0.5,
    sexNote: '태생 어종 — 봄에 완전히 자란 새끼를 직접 출산',
    // 주행성 — 봄철 낮 방파제 찌낚시 어종
    nightBonus: 0.4, tideActivity: flatTide(0.7),
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
    // 주행성 저서 어종 — 밤엔 활성 저하
    legalMinCm: 20, closedMonths: [11, 12], nightBonus: 0.6, tideActivity: flatTide(0.65),
    fight: { basePower: 0.45, patternWeights: { jump: 0.1, dive: 0.6, lateral: 0.3 }, intervalMult: 1.0, mouthFragility: 0.15 },
  },
  {
    speciesId: 'greenling', nameKo: '노래미', nameEn: 'Hexagrammos otakii',
    habitat: ['reef', 'structure'], minDepthM: 1, maxDepthM: 15, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 60, krill: 30, shellfish: 10 },
    minCm: 10, maxCm: 30, meanCm: 18, sdCm: 3, weightFactor: 0.02, maleRatio: 0.5,
    sexNote: '측선 1개 (쥐노래미는 5개) — 꼬리 끝이 둥근 부채꼴',
    // 주행성 저서 어종
    nightBonus: 0.6, tideActivity: flatTide(0.75),
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
    // 볼락류 공통 야행성 — 밤 중층 부상 피딩
    legalMinCm: 15, nightBonus: 1.8, tideActivity: sariPeak(0.5, 0.85),
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
    // 모래 바닥 10~200m (실측 데이터 2026-07-16)
    habitat: ['sand'], minDepthM: 10, maxDepthM: 200, preferredLayers: ['bottom'],
    baitPreference: { livefish: 50, lure: 40, worm_king: 10 },
    minCm: 20, maxCm: 120, meanCm: 50, sdCm: 13, weightFactor: 0.013,
    maleRatio: 0.5,
    sexRule: (len) => (len > 70 ? 0.2 : 0.5),
    sexNote: '두 눈이 왼쪽 — 암컷이 압도적으로 크게 자람',
    // 낮 매복 사냥이 메인 — 밤에도 먹지만 활성 저하
    legalMinCm: 35, nightBonus: 0.7, tideActivity: sariPeak(0.4, 0.75),
    fight: { basePower: 0.7, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 1.0, mouthFragility: 0.1 },
  },
  {
    speciesId: 'flounder', nameKo: '참도다리(문치가자미)', nameEn: 'Marbled Flounder',
    // 모래·뻘 10~100m, 대한민국 전 해역 (실측 데이터 2026-07-16)
    habitat: ['sand', 'mud'], minDepthM: 10, maxDepthM: 100, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 70, worm_king: 20, krill: 10 },
    minCm: 15, maxCm: 50, meanCm: 30, sdCm: 6, weightFactor: 0.015, maleRatio: 0.5,
    sexNote: '두 눈이 오른쪽 — 입이 작고 예민해 소형 바늘에 잘 잡힘. 시장에서 흔히 도다리로 유통',
    // 주행성 가자미류
    legalMinCm: 20, closedMonths: [12, 1], nightBonus: 0.7, tideActivity: flatTide(0.6),
    fight: { basePower: 0.3, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 1.2, mouthFragility: 0.2 },
  },
  // ── 신규 어종 12종 (2026-07-16 사용자 제공 실측 데이터) ──
  {
    speciesId: 'frog_flounder', nameKo: '도다리', nameEn: 'Frog Flounder',
    // 표준명 도다리 — 모래·뻘 50~100m, 군산/목포/여수/마산/진해/부산 분포
    habitat: ['sand', 'mud'], minDepthM: 50, maxDepthM: 100, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 70, worm_king: 20, krill: 10 },
    minCm: 15, maxCm: 40, meanCm: 27, sdCm: 5, weightFactor: 0.015, maleRatio: 0.5,
    sexNote: '눈 사이에 가시가 솟은 표준명 도다리 — 문치가자미와 달리 남해 서부에 국지 분포',
    // 주행성 가자미류
    legalMinCm: 20, nightBonus: 0.7, tideActivity: flatTide(0.6),
    fight: { basePower: 0.3, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 1.2, mouthFragility: 0.2 },
  },
  {
    speciesId: 'starry_flounder', nameKo: '강도다리', nameEn: 'Starry Flounder',
    // 모래·뻘 20~250m — 20~40cm급은 전 해역 기수역(주로 울산 강 하구)
    habitat: ['sand', 'mud'], minDepthM: 20, maxDepthM: 250, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 65, worm_king: 20, krill: 15 },
    minCm: 18, maxCm: 70, meanCm: 30, sdCm: 7, weightFactor: 0.011, maleRatio: 0.5,
    sexNote: '지느러미의 검은 줄무늬가 선명한 냉수성 가자미 — 금지체장 없음(14cm 미만 자율 방생 권장)',
    // 주행성 가자미류
    nightBonus: 0.7, tideActivity: flatTide(0.6),
    fight: { basePower: 0.35, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 1.2, mouthFragility: 0.2 },
  },
  {
    speciesId: 'tonguefish', nameKo: '개서대', nameEn: 'Robust Tonguefish',
    // 진흙·갯벌·모래 20~100m, 회유 4~6월 제주/서해 → 7~10월 서해/남해
    habitat: ['mud', 'sand'], minDepthM: 20, maxDepthM: 100, preferredLayers: ['bottom'],
    baitPreference: { worm_blue: 70, shellfish: 20, krill: 10 },
    minCm: 18, maxCm: 60, meanCm: 32, sdCm: 6, weightFactor: 0.008, maleRatio: 0.5,
    sexNote: '혓바닥처럼 길쭉한 서대류 — 입이 작아 미끼를 빨아들이듯 삼킨다',
    nightBonus: 1.8, tideActivity: flatTide(0.6),
    fight: { basePower: 0.25, patternWeights: { jump: 0.05, dive: 0.5, lateral: 0.45 }, intervalMult: 1.25, mouthFragility: 0.25 },
  },
  {
    speciesId: 'pike_conger', nameKo: '갯장어', nameEn: 'Daggertooth Pike Conger',
    // 모래·암초 20~50m, 회유 4~7월 제주>서해 / 10~12월 서해>제주. 남해·동해 소규모 분포
    habitat: ['sand', 'reef'], minDepthM: 20, maxDepthM: 50, preferredLayers: ['bottom'],
    baitPreference: { fishcut: 60, livefish: 30, worm_blue: 10 },
    minCm: 40, maxCm: 200, meanCm: 70, sdCm: 18, weightFactor: 0.0005, maleRatio: 0.5,
    sexNote: '하모 — 단검 같은 이빨로 목줄을 단숨에 끊고 손까지 물어뜯는 난폭한 장어',
    legalMinCm: 40, nightBonus: 1.6, tideActivity: flatTide(0.6),
    fight: { basePower: 0.7, patternWeights: { jump: 0.1, dive: 0.55, lateral: 0.35 }, intervalMult: 0.95, mouthFragility: 0.1, lineCutter: true },
  },
  {
    speciesId: 'pacific_saury', nameKo: '꽁치', nameEn: 'Pacific Saury',
    // 표층·중층 0~50m, 회유 4~7월 제주>남해>동해>북한 / 9~12월 동해>남해>제주>일본
    habitat: ['open'], minDepthM: 0, maxDepthM: 50, preferredLayers: ['surface', 'mid'],
    baitPreference: { krill: 60, lure: 25, worm_blue: 15 },
    minCm: 20, maxCm: 45, meanCm: 35, sdCm: 4, weightFactor: 0.0025, maleRatio: 0.5,
    sexNote: '표층을 빠르게 스치는 가늘고 긴 등푸른 회유어 — 집어등 불빛에 몰린다',
    nightBonus: 1.9, tideActivity: flatTide(0.65),
    fight: { basePower: 0.2, patternWeights: { jump: 0.35, dive: 0.05, lateral: 0.6 }, intervalMult: 1.0, mouthFragility: 0.5 },
  },
  {
    speciesId: 'blackthroat_seaperch', nameKo: '눈볼대(금태)', nameEn: 'Blackthroat Seaperch',
    // 모래·진흙 저층 100~400m(수온 10~20°C) — 회유 7~8월 제주, 8~6월 제주>남해>일본
    habitat: ['sand', 'mud'], minDepthM: 100, maxDepthM: 400, preferredLayers: ['bottom'],
    baitPreference: { fishcut: 50, livefish: 30, lure: 20 },
    minCm: 15, maxCm: 50, meanCm: 30, sdCm: 6, weightFactor: 0.011, maleRatio: 0.5,
    sexNote: '아카무츠 — 목구멍이 검고 눈이 큰 심해 고급어. 기름기가 풍부해 최고급 횟감',
    nightBonus: 1.7, tideActivity: flatTide(0.55),
    fight: { basePower: 0.45, patternWeights: { jump: 0.05, dive: 0.7, lateral: 0.25 }, intervalMult: 1.05, mouthFragility: 0.3 },
  },
  {
    speciesId: 'round_herring', nameKo: '눈퉁멸', nameEn: 'Round Herring',
    // 표층·중층 50~150m, 회유 12월 제주/남해 → 1~8월 일본>남해>제주
    habitat: ['open'], minDepthM: 50, maxDepthM: 150, preferredLayers: ['surface', 'mid'],
    baitPreference: { krill: 70, lure: 20, worm_blue: 10 },
    minCm: 10, maxCm: 26, meanCm: 18, sdCm: 3, weightFactor: 0.009, maleRatio: 0.5,
    sexNote: '눈이 유난히 큰 소형 청어류 — 대형어의 주 먹이(베이트피시)라 생미끼로도 쓰인다',
    nightBonus: 1.8, tideActivity: flatTide(0.65),
    fight: { basePower: 0.12, patternWeights: { jump: 0.25, dive: 0.1, lateral: 0.65 }, intervalMult: 1.3, mouthFragility: 0.55 },
  },
  {
    speciesId: 'pacific_cod', nameKo: '대구', nameEn: 'Pacific Cod',
    // 45~450m, 주로 남해 분포 — 회유 12월 제주/남해 → 1~8월 일본>남해>제주
    habitat: ['sand', 'mud', 'open'], minDepthM: 45, maxDepthM: 450, preferredLayers: ['bottom'],
    baitPreference: { livefish: 40, fishcut: 30, lure: 30 },
    minCm: 30, maxCm: 120, meanCm: 55, sdCm: 12, weightFactor: 0.014, maleRatio: 0.5,
    sexNote: '입이 머리만큼 큰 한류성 대형 저서어 — 겨울 거제·진해 대구탕의 주인공',
    legalMinCm: 35, closedMonths: [1, 2], tideActivity: flatTide(0.6),
    fight: { basePower: 0.75, patternWeights: { jump: 0.05, dive: 0.7, lateral: 0.25 }, intervalMult: 1.0, mouthFragility: 0.2 },
  },
  {
    speciesId: 'korean_pomfret', nameKo: '덕대', nameEn: 'Korean Pomfret',
    // 모래·뻘 0~100m, 남해/서해 분포 (6~9월)
    habitat: ['sand', 'mud'], minDepthM: 0, maxDepthM: 100, preferredLayers: ['mid', 'bottom'],
    baitPreference: { krill: 50, worm_blue: 30, shellfish: 20 },
    minCm: 12, maxCm: 28, meanCm: 17, sdCm: 3, weightFactor: 0.05, maleRatio: 0.5,
    sexNote: '병어와 쏙 닮은 소형종 — 입이 아주 작아 큰 바늘에는 걸리지 않는다. 14cm 미만 자율 방생 권장',
    // 주간 무리 지어 피딩
    nightBonus: 0.7, tideActivity: flatTide(0.6),
    fight: { basePower: 0.25, patternWeights: { jump: 0.1, dive: 0.35, lateral: 0.55 }, intervalMult: 1.2, mouthFragility: 0.4 },
  },
  {
    speciesId: 'silver_pomfret', nameKo: '병어', nameEn: 'Silver Pomfret',
    // 모래·뻘 0~100m, 남해/서해 분포 및 회유 (6~9월)
    habitat: ['sand', 'mud'], minDepthM: 0, maxDepthM: 100, preferredLayers: ['mid', 'bottom'],
    baitPreference: { krill: 50, worm_blue: 30, shellfish: 20 },
    minCm: 14, maxCm: 40, meanCm: 25, sdCm: 5, weightFactor: 0.026, maleRatio: 0.5,
    sexNote: '납작한 마름모꼴 은빛 몸통 — 뼈가 연해 통째로 썰어 먹는 여름 별미. 14.6cm 미만 자율 방생 권장',
    // 주간 무리 지어 피딩
    nightBonus: 0.7, tideActivity: flatTide(0.6),
    fight: { basePower: 0.35, patternWeights: { jump: 0.1, dive: 0.35, lateral: 0.55 }, intervalMult: 1.15, mouthFragility: 0.4 },
  },
  {
    speciesId: 'sandfish', nameKo: '도루묵', nameEn: 'Japanese Sandfish',
    // 모래·진흙 140~150m — 동해. 10~12월 산란을 위해 2~10m 연안으로 몰려든다
    habitat: ['sand', 'mud'], minDepthM: 2, maxDepthM: 150, preferredLayers: ['bottom'],
    baitPreference: { krill: 40, worm_blue: 35, lure: 25 },
    minCm: 10, maxCm: 30, meanCm: 18, sdCm: 3, weightFactor: 0.013, maleRatio: 0.5,
    sexNote: '늦가을 산란기에만 연안 해조류로 붙는 동해 어종 — 알이 가득 찬 암컷이 별미',
    legalMinCm: 11, nightBonus: 1.5, tideActivity: flatTide(0.6),
    fight: { basePower: 0.2, patternWeights: { jump: 0.15, dive: 0.4, lateral: 0.45 }, intervalMult: 1.25, mouthFragility: 0.35 },
  },
  {
    speciesId: 'black_scraper', nameKo: '말쥐치', nameEn: 'Black Scraper',
    // 내만·암초·해조류 70~100m — 회유 1~3월 제주, 4~11월 남해>동해, 6~10월 제주>서해
    habitat: ['reef', 'structure'], minDepthM: 20, maxDepthM: 100, preferredLayers: ['mid', 'bottom'],
    baitPreference: { shellfish: 45, krill: 35, worm_blue: 20 },
    minCm: 12, maxCm: 36, meanCm: 22, sdCm: 4, weightFactor: 0.017, maleRatio: 0.5,
    sexNote: '쥐치보다 크고 길쭉한 쥐포의 주 원료 — 작은 입으로 미끼만 갉아먹는 악명 높은 미끼 도둑',
    // 쥐치류는 주행성 — 밤엔 취면(수면) 상태
    legalMinCm: 18, closedMonths: [5, 6, 7], nightBonus: 0.3, tideActivity: flatTide(0.65),
    fight: { basePower: 0.3, patternWeights: { jump: 0.15, dive: 0.4, lateral: 0.45 }, intervalMult: 1.25, mouthFragility: 0.25 },
  },
  // ── FISH_DATABASE 통합 추가분 (2026-07-16 — 기존 DB 어종을 오라클에 편입) ──
  {
    speciesId: 'largescale_blackfish', nameKo: '벵에돔', nameEn: 'Largescale Blackfish',
    // 조류 완만한 내만성 갯바위/암초/테트라포드, 해조류 무성한 곳 (실측 데이터 2026-07-16)
    habitat: ['reef', 'structure'], minDepthM: 3, maxDepthM: 15, preferredLayers: ['mid'],
    baitPreference: { bread: 50, krill: 30, worm_blue: 20 },
    minCm: 15, maxCm: 55, meanCm: 30, sdCm: 5, weightFactor: 0.033, maleRatio: 0.5,
    sexNote: '수온·소음에 극도로 예민 — 이물감이 느껴지면 바로 뱉는 약은 입질. 금지체장 없음(20~23cm 미만 자율 방생 권장)',
    // 주행성 — 낮 찌낚시 대표 어종
    nightBonus: 0.5, tideActivity: sariPeak(0.4, 0.85),
    fight: { basePower: 0.7, patternWeights: { jump: 0.1, dive: 0.6, lateral: 0.3 }, intervalMult: 0.9, mouthFragility: 0.3 },
  },
  {
    speciesId: 'longtail_blackfish', nameKo: '긴꼬리벵에돔', nameEn: 'Japanese Largescale Blackfish',
    // 조류 소통 원활한 외양성 암초 — 10~30m에 머물다 밑밥 반응 시 표층 1~5m까지 부상
    habitat: ['reef', 'open'], minDepthM: 10, maxDepthM: 30, preferredLayers: ['mid', 'surface'],
    baitPreference: { krill: 70, bread: 15, worm_blue: 15 },
    minCm: 20, maxCm: 60, meanCm: 38, sdCm: 7, weightFactor: 0.025, maleRatio: 0.5,
    sexNote: '아가미 테두리 검은 띠 + 제비꼬리. 난류 선호(제주/남해 먼바다). 이빨이 날카로워 목줄을 잘 끊음. 22~25cm 미만 자율 방생',
    // 여름밤 제주 밤낚시 대물 실적 — 벵에돔과 달리 야간에도 활발
    nightBonus: 1.3, tideActivity: sariPeak(0.35, 0.95),
    fight: { basePower: 0.75, patternWeights: { jump: 0.1, dive: 0.5, lateral: 0.4 }, intervalMult: 0.85, mouthFragility: 0.2, lineCutter: true },
  },
  {
    speciesId: 'hairtail', nameKo: '갈치', nameEn: 'Hairtail',
    // 진흙·모래 바닥 위를 회유 — 여름 50~100m, 겨울 70~120m (실측 데이터 2026-07-16)
    habitat: ['mud', 'sand', 'open'], minDepthM: 20, maxDepthM: 150, preferredLayers: ['mid', 'surface'],
    baitPreference: { fishcut: 60, krill: 20, lure: 20 },
    minCm: 40, maxCm: 130, meanCm: 70, sdCm: 15, weightFactor: 0.002, maleRatio: 0.5,
    sexNote: '야간 집어등에 유집되는 은빛 회유어 — 이빨이 날카로워 목줄 주의. 법정 금지체장은 항문장 18cm(≈ 전장 47cm)',
    // 법정 기준은 항문장 18cm이나 게임은 전장(lengthCm)으로 판정 — 전장 환산값 47cm 사용
    legalMinCm: 47, closedMonths: [7],
    nightBonus: 2.5, tideActivity: flatTide(0.6),
    fight: { basePower: 0.45, patternWeights: { jump: 0.1, dive: 0.4, lateral: 0.5 }, intervalMult: 1.0, mouthFragility: 0.25, lineCutter: true },
  },
  {
    speciesId: 'yellowtail', nameKo: '방어', nameEn: 'Japanese Amberjack',
    habitat: ['open'], minDepthM: 5, maxDepthM: 40, preferredLayers: ['mid', 'surface'],
    baitPreference: { livefish: 50, lure: 35, krill: 15 },
    minCm: 50, maxCm: 150, meanCm: 90, sdCm: 18, weightFactor: 0.012, maleRatio: 0.5,
    sexNote: '겨울 대방어 — 부시리와 함께 드랙을 치고 나가는 대형 회유어',
    // 여명/황혼 피딩 회유어 — 한밤엔 활성 급감
    nightBonus: 0.5, tideActivity: sariPeak(0.3, 0.85),
    fight: { basePower: 0.95, patternWeights: { jump: 0.2, dive: 0.25, lateral: 0.55 }, intervalMult: 0.75, mouthFragility: 0.05 },
  },
  {
    speciesId: 'dark_banded_rockfish', nameKo: '볼락', nameEn: 'Dark-banded Rockfish',
    habitat: ['reef', 'structure'], minDepthM: 3, maxDepthM: 30, preferredLayers: ['surface', 'mid'],
    baitPreference: { krill: 60, worm_blue: 25, lure: 15 },
    minCm: 12, maxCm: 42, meanCm: 22, sdCm: 4, weightFactor: 0.018, maleRatio: 0.5,
    sexNote: '야간 상층 피딩 보일링을 형성하는 대표 야행성 어종',
    legalMinCm: 15, nightBonus: 2.0, tideActivity: flatTide(0.7),
    fight: { basePower: 0.25, patternWeights: { jump: 0.2, dive: 0.4, lateral: 0.4 }, intervalMult: 1.1, mouthFragility: 0.3 },
  },
  {
    speciesId: 'red_snapper_rockfish', nameKo: '열기(불볼락)', nameEn: 'Goldeye Rockfish',
    habitat: ['reef'], minDepthM: 20, maxDepthM: 80, preferredLayers: ['bottom', 'mid'],
    baitPreference: { krill: 55, fishcut: 25, worm_king: 20 },
    minCm: 14, maxCm: 35, meanCm: 22, sdCm: 4, weightFactor: 0.025, maleRatio: 0.5,
    nightBonus: 1.6, tideActivity: flatTide(0.6),
    fight: { basePower: 0.3, patternWeights: { jump: 0.1, dive: 0.6, lateral: 0.3 }, intervalMult: 1.1, mouthFragility: 0.2 },
  },
  {
    speciesId: 'sea_bass', nameKo: '농어', nameEn: 'Japanese Seabass',
    habitat: ['open', 'structure'], minDepthM: 1, maxDepthM: 30, preferredLayers: ['mid', 'surface'],
    baitPreference: { lure: 45, livefish: 35, krill: 10, worm_blue: 10 },
    minCm: 30, maxCm: 110, meanCm: 60, sdCm: 14, weightFactor: 0.01, maleRatio: 0.5,
    sexNote: '점프하며 아가미를 터는 에라 세척(바늘털이)의 대명사',
    legalMinCm: 30, nightBonus: 1.6, tideActivity: sariPeak(0.35, 0.9),
    fight: { basePower: 0.8, patternWeights: { jump: 0.45, dive: 0.2, lateral: 0.35 }, intervalMult: 0.85, mouthFragility: 0.25 },
  },
  {
    speciesId: 'striped_mullet', nameKo: '참숭어(숭어)', nameEn: 'Flathead Grey Mullet',
    // 물 흐름 있는 연안 암초/내만, 표층 회유성 (실측 데이터 2026-07-16 — 방언: 개숭어/보리숭어)
    habitat: ['structure', 'open', 'mud'], minDepthM: 0.5, maxDepthM: 10, preferredLayers: ['surface', 'mid'],
    baitPreference: { worm_blue: 55, krill: 25, worm_king: 10, bread: 10 },
    minCm: 25, maxCm: 80, meanCm: 50, sdCm: 9, weightFactor: 0.016, maleRatio: 0.5,
    sexNote: '꼬리가 V자로 깊게 갈라짐. 겨울엔 눈에 기름눈꺼풀(백태). 보리 익을 무렵(3~5월)이 제철 보리숭어',
    // 낮 표층 회유 — 밤엔 활성 저하
    nightBonus: 0.6, tideActivity: flatTide(0.7),
    fight: { basePower: 0.5, patternWeights: { jump: 0.5, dive: 0.1, lateral: 0.4 }, intervalMult: 0.9, mouthFragility: 0.3 },
  },
  {
    speciesId: 'redlip_mullet', nameKo: '가숭어(밀치)', nameEn: 'Redlip Mullet',
    // 진흙/모래 연안·강 하구(기수역), 숭어류 중 가장 크게 성장 (실측 데이터 2026-07-16)
    habitat: ['mud', 'sand'], minDepthM: 1, maxDepthM: 15, preferredLayers: ['surface', 'mid'],
    baitPreference: { worm_blue: 50, krill: 30, bread: 20 },
    minCm: 35, maxCm: 100, meanCm: 65, sdCm: 12, weightFactor: 0.013, maleRatio: 0.5,
    sexNote: '눈 테두리가 선명한 노란색, 꼬리 끝이 일직선. 산란기 5~6월, 겨울(11~2월) 밀치회가 별미',
    // 낮 표층 회유 — 밤엔 활성 저하
    nightBonus: 0.6, tideActivity: flatTide(0.65),
    fight: { basePower: 0.65, patternWeights: { jump: 0.4, dive: 0.2, lateral: 0.4 }, intervalMult: 0.85, mouthFragility: 0.25 },
  },
  {
    speciesId: 'filefish', nameKo: '쥐치', nameEn: 'Thread-sail Filefish',
    // 갯바위·방파제 수중여 주변 5~30m (실측 데이터 2026-07-16)
    habitat: ['reef', 'structure'], minDepthM: 5, maxDepthM: 30, preferredLayers: ['mid'],
    baitPreference: { shellfish: 40, krill: 40, worm_blue: 20 },
    minCm: 10, maxCm: 30, meanCm: 18, sdCm: 4, weightFactor: 0.03, maleRatio: 0.5,
    sexNote: '작은 입으로 미끼를 갉아먹는 미끼 도둑 — 쥐포의 원료',
    // 쥐치류는 주행성 — 밤엔 취면(수면) 상태
    nightBonus: 0.25, tideActivity: flatTide(0.7),
    fight: { basePower: 0.2, patternWeights: { jump: 0.2, dive: 0.4, lateral: 0.4 }, intervalMult: 1.3, mouthFragility: 0.2 },
  },
  {
    speciesId: 'black_seabream', nameKo: '감성돔', nameEn: 'Black Seabream',
    habitat: ['reef'], minDepthM: 10, maxDepthM: 40, preferredLayers: ['bottom'],
    baitPreference: { crab: 40, corn: 30, krill: 20, worm_blue: 10 },
    minCm: 18, maxCm: 72, meanCm: 40, sdCm: 8, weightFactor: 0.023,
    maleRatio: 0.5,
    sexRule: (len) => (len < 30 ? 0.9 : len < 40 ? 0.6 : 0.25),
    sexNote: '모두 수컷으로 태어나 4~5년생에 70~80%가 암컷으로 성전환',
    // 야행성 성향 — 밤 원투/찌낚시 대물 실적이 좋은 대표 어종
    legalMinCm: 25, closedMonths: [5], nightBonus: 1.5, tideActivity: sariPeak(0.4, 1.0),
    fight: { basePower: 0.75, patternWeights: { jump: 0.05, dive: 0.75, lateral: 0.2 }, intervalMult: 0.95, mouthFragility: 0.1 },
  },
  // ── 두족류 (에기 전용 — egiOnly) ─────────────────────
  {
    speciesId: 'squid', nameKo: '무늬오징어', nameEn: 'Bigfin Reef Squid',
    habitat: ['reef', 'structure', 'open'], minDepthM: 3, maxDepthM: 30, preferredLayers: ['mid', 'bottom'],
    baitPreference: { lure: 90 }, egiOnly: true,
    minCm: 15, maxCm: 45, meanCm: 26, sdCm: 6, weightFactor: 0.02, maleRatio: 0.5,
    sexNote: '가을 무늬오징어 시즌이 에깅 최성기 — 먹물 주의',
    // 야행성 — 야간 에깅이 최성기
    nightBonus: 1.6, tideActivity: sariPeak(0.4, 0.9),
    fight: { basePower: 0.4, patternWeights: { jump: 0.1, dive: 0.3, lateral: 0.6 }, intervalMult: 1.1, mouthFragility: 0.4 },
  },
  {
    speciesId: 'octopus', nameKo: '문어', nameEn: 'Common Octopus',
    habitat: ['reef', 'structure'], minDepthM: 2, maxDepthM: 25, preferredLayers: ['bottom'],
    baitPreference: { lure: 80, crab: 30 }, egiOnly: true,
    minCm: 20, maxCm: 70, meanCm: 38, sdCm: 10, weightFactor: 0.05, maleRatio: 0.5,
    sexNote: '바닥에 붙는 힘이 강해 초반에 띄우는 것이 관건',
    // 야행성 — 밤에 은신처를 벗어나 사냥
    nightBonus: 1.5, tideActivity: flatTide(0.6),
    fight: { basePower: 0.55, patternWeights: { jump: 0.0, dive: 0.8, lateral: 0.2 }, intervalMult: 1.0, mouthFragility: 0.2 },
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

  // ── 루어 채비 연동 (LureSpec 데이터 소비) ──────────────
  /**
   * 스폰 후보 제한 (에기 spawnBinding 등). 지정 시 이 speciesId만 후보에 남는다.
   * egiOnly 두족류는 이 필터에 포함될 때만 등장한다.
   */
  speciesFilter?: string[];
  /** 어종별 타겟 가중치 (LureSpec.speciesWeightBias) — weight ×(1+bias) */
  speciesWeightBias?: Partial<Record<string, number>>;
  /** 서식 성향 가중 (LureSpec.targetHabitatBias) — 서식 지형 교집합이면 가중 */
  habitatBias?: string[];
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

  const filterSet = ctx.speciesFilter && ctx.speciesFilter.length > 0 ? new Set(ctx.speciesFilter) : null;

  return ORACLE_FISH_DB.map((spec) => {
    // 에기 전용 두족류는 스폰 필터에 포함될 때만 후보에 오른다
    if (spec.egiOnly && !(filterSet && filterSet.has(spec.speciesId))) return { spec, weight: 0 };
    // 스폰 필터가 있으면 그 어종만 남긴다 (에기 spawnBinding)
    if (filterSet && !filterSet.has(spec.speciesId)) return { spec, weight: 0 };

    // 수심층 적합 — 선호층 1.0 / 인접층 0.15 / 두 층 어긋남 0.03
    // (저서 어종이 표층에, 표층 회유어가 바닥에 나타나는 일은 사실상 없어야 한다)
    const layerOrder: Record<SwimLayer, number> = { surface: 0, mid: 1, bottom: 2 };
    const layerDist = Math.min(
      ...spec.preferredLayers.map((l) => Math.abs(layerOrder[l] - layerOrder[layer])),
    );
    const layerW = layerDist === 0 ? 1 : layerDist === 1 ? 0.15 : 0.03;
    // 서식 수심 범위 적합 (바닥 수심 기준 느슨하게)
    const depthW = ctx.zMax >= spec.minDepthM * 0.5 && ctx.zMax <= spec.maxDepthM * 1.5 ? 1 : 0.2;
    // 지형 적합
    const terrW = terrainFit(spec, ctx.inReef);
    // 미끼 선호도 (미정의 미끼는 기본 5)
    const baitW = Math.max(0.03, (spec.baitPreference[ctx.baitKey] ?? 5) / 50);
    // 물때 활성도
    const tideW = Math.max(0.05, spec.tideActivity[tideIdx] ?? 0.5);
    // 주야간 — 야간엔 nightBonus 그대로 (야행성 증폭 / 주행성 nb<1 억제),
    // 주간엔 강한 야행성(nb>1.5)만 0.55로 억제하고 주행성은 1.0 유지
    const nb = spec.nightBonus ?? 1;
    const dayNightW = ctx.isNight ? nb : nb > 1.5 ? 0.55 : 1;
    // 지역 어획량 통계 가중 (KOSIS 캐시 — 없으면 1.0)
    const catchW = ctx.catchWeightBySpecies?.[spec.speciesId] ?? 1;
    // 루어 타겟 가중 (speciesWeightBias) + 서식 성향 가중 (habitatBias)
    const lureBias = 1 + (ctx.speciesWeightBias?.[spec.speciesId] ?? 0);
    const habW = ctx.habitatBias && ctx.habitatBias.some((h) => spec.habitat.includes(h as HabitatTerrain)) ? 1.3 : 1;

    return { spec, weight: layerW * depthW * terrW * baitW * tideW * dayNightW * catchW * lureBias * habW };
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
