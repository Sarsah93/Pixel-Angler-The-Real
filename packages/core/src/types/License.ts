/**
 * @file License.ts
 * @description 라이선스 / 해금 시스템 타입 정의
 *
 * 통발 조업 허가, 해루질 해금, 식당 사업자, 선상콘도 운영권 등
 * 게임 내 활동 잠금 해제를 관리합니다.
 */

// ─────────────────────────────────────────────
// 라이선스 종류
// ─────────────────────────────────────────────

export type LicenseType =
  // 낚시 관련
  | 'basic_angling'         // 기본 낚시 (기본 제공)
  | 'boat_angling'          // 선상 낚시 허가
  | 'surf_casting'          // 원투 낚시 (해수욕장 등 제한 구역)
  // 해루질
  | 'shore_hunting_basic'   // 해루질 기본 (조개/고동류)
  | 'shore_hunting_advanced'// 해루질 심화 (문어/낙지/전복)
  // 통발
  | 'trap_basic'            // 게·새우 통발 기초
  | 'trap_advanced'         // 장어·문어 통발 심화
  | 'commercial_trap'       // 상업용 통발 (개수 무제한)
  // 사업 운영
  | 'food_service'          // 식품위생법 영업허가 (식당 경영)
  | 'marine_tourism'        // 해양관광사업 등록 (선상콘도)
  | 'tournament_host';      // 토너먼트 주최권

// ─────────────────────────────────────────────
// 라이선스 상세 정의
// ─────────────────────────────────────────────

export interface LicenseDef {
  type: LicenseType;
  nameKo: string;
  description: string;
  /** 취득 비용 (앵글러 코인) */
  costCoins: number;
  /** 취득에 필요한 선행 라이선스 */
  prerequisites: LicenseType[];
  /** 취득 조건 (클리어 퀘스트, 낚시 횟수 등) */
  requirements: UnlockRequirement[];
  /** 갱신 필요 여부 (true면 인게임 연 단위 갱신) */
  requiresRenewal: boolean;
  renewalIntervalDays?: number;
  /** 취득 후 활성화되는 기능 */
  unlocksFeatures: UnlockableFeature[];
}

// ─────────────────────────────────────────────
// 해금 조건 타입
// ─────────────────────────────────────────────

export type UnlockRequirement =
  | { type: 'min_angling_trips'; value: number }              // 최소 출조 횟수
  | { type: 'min_fish_caught'; value: number }                // 최소 어획 누계
  | { type: 'specific_fish_caught'; fishId: string }          // 특정 어종 포획
  | { type: 'min_coins'; value: number }                      // 최소 보유 코인
  | { type: 'license_held'; licenseType: LicenseType }        // 특정 라이선스 보유
  | { type: 'quest_completed'; questId: string }              // 특정 퀘스트 완료
  | { type: 'spot_visited'; spotId: string }                  // 특정 스팟 방문
  | { type: 'min_reputation'; value: number };                // 식당/콘도 평판

// ─────────────────────────────────────────────
// 활성화되는 기능 목록
// ─────────────────────────────────────────────

export type UnlockableFeature =
  | 'shore_hunting_mode'      // 해루질 모드 진입
  | 'trap_deployment'         // 통발 설치
  | 'trap_commercial'         // 상업용 통발 (기본 3개 → 무제한)
  | 'restaurant_open'         // 식당 개업
  | 'condo_operation'         // 선상콘도 운영
  | 'tournament_entry'        // 토너먼트 참가
  | 'tournament_hosting'      // 토너먼트 주최
  | 'boat_rental'             // 보트 대여 서비스
  | 'protected_area_access'   // 보호구역 조건부 출입
  | 'abalone_hunting'         // 전복 해루질 허가
  | 'eel_trapping'            // 장어 통발 허가
  | 'catch_and_cook_advanced';// 고급 캐치앤쿡 (회뜨기/구이)

// ─────────────────────────────────────────────
// 플레이어 라이선스 보유 현황
// ─────────────────────────────────────────────

export interface PlayerLicenses {
  playerId: string;
  held: HeldLicense[];
}

export interface HeldLicense {
  type: LicenseType;
  acquiredAt: Date;
  expiresAt?: Date;         // 갱신 필요한 라이선스의 만료일
  isExpired: boolean;
}

// ─────────────────────────────────────────────
// 라이선스 데이터베이스
// ─────────────────────────────────────────────

export const LICENSE_DATABASE: LicenseDef[] = [
  {
    type: 'basic_angling',
    nameKo: '기본 낚시 면허',
    description: '방파제/갯바위에서의 기본 찌낚시/루어낚시를 허용합니다.',
    costCoins: 0,
    prerequisites: [],
    requirements: [],
    requiresRenewal: false,
    unlocksFeatures: [],
  },
  {
    type: 'boat_angling',
    nameKo: '선상 낚시 면허',
    description: '선장의 배를 빌려 선상 낚시를 즐길 수 있습니다.',
    costCoins: 5000,
    prerequisites: ['basic_angling'],
    requirements: [
      { type: 'min_angling_trips', value: 5 },
    ],
    requiresRenewal: false,
    unlocksFeatures: ['boat_rental'],
  },
  {
    type: 'shore_hunting_basic',
    nameKo: '해루질 입문 허가',
    description: '야간 조간대에서 조개류·소라·게를 채취할 수 있습니다.',
    costCoins: 3000,
    prerequisites: ['basic_angling'],
    requirements: [
      { type: 'min_angling_trips', value: 10 },
      { type: 'spot_visited', spotId: 'geoje_gujora_breakwater' },
    ],
    requiresRenewal: true,
    renewalIntervalDays: 365,
    unlocksFeatures: ['shore_hunting_mode'],
  },
  {
    type: 'shore_hunting_advanced',
    nameKo: '해루질 심화 허가 (문어·전복)',
    description: '문어, 낙지, 전복 채취 허가. 반드시 입문 허가 보유 후 취득 가능.',
    costCoins: 15000,
    prerequisites: ['shore_hunting_basic'],
    requirements: [
      { type: 'min_angling_trips', value: 30 },
      { type: 'license_held', licenseType: 'shore_hunting_basic' },
    ],
    requiresRenewal: true,
    renewalIntervalDays: 365,
    unlocksFeatures: ['abalone_hunting'],
  },
  {
    type: 'trap_basic',
    nameKo: '통발 조업 기본 면허',
    description: '게·새우 통발을 최대 3개까지 설치할 수 있습니다.',
    costCoins: 8000,
    prerequisites: ['basic_angling'],
    requirements: [
      { type: 'min_angling_trips', value: 20 },
      { type: 'min_fish_caught', value: 50 },
    ],
    requiresRenewal: true,
    renewalIntervalDays: 365,
    unlocksFeatures: ['trap_deployment'],
  },
  {
    type: 'trap_advanced',
    nameKo: '통발 조업 심화 면허 (장어·문어)',
    description: '장어 통발과 문어 단지를 사용할 수 있습니다.',
    costCoins: 20000,
    prerequisites: ['trap_basic'],
    requirements: [
      { type: 'license_held', licenseType: 'trap_basic' },
      { type: 'min_angling_trips', value: 50 },
    ],
    requiresRenewal: true,
    renewalIntervalDays: 365,
    unlocksFeatures: ['eel_trapping'],
  },
  {
    type: 'food_service',
    nameKo: '식품위생법 영업허가',
    description: '식당을 개업하고 조리 식품을 판매할 수 있습니다.',
    costCoins: 30000,
    prerequisites: ['basic_angling'],
    requirements: [
      { type: 'min_coins', value: 50000 },
      { type: 'min_fish_caught', value: 100 },
      { type: 'quest_completed', questId: 'quest_first_catch_and_cook' },
    ],
    requiresRenewal: true,
    renewalIntervalDays: 365,
    unlocksFeatures: ['restaurant_open', 'catch_and_cook_advanced'],
  },
  {
    type: 'marine_tourism',
    nameKo: '해양관광사업 등록',
    description: '선상콘도를 운영하고 낚시 체험 패키지를 판매할 수 있습니다.',
    costCoins: 80000,
    prerequisites: ['boat_angling', 'food_service'],
    requirements: [
      { type: 'min_coins', value: 200000 },
      { type: 'min_reputation', value: 60 },
      { type: 'license_held', licenseType: 'boat_angling' },
    ],
    requiresRenewal: true,
    renewalIntervalDays: 365,
    unlocksFeatures: ['condo_operation'],
  },
  {
    type: 'tournament_host',
    nameKo: '토너먼트 주최권',
    description: '낚시 토너먼트를 직접 주최하고 참가비로 수익을 얻을 수 있습니다.',
    costCoins: 50000,
    prerequisites: ['basic_angling'],
    requirements: [
      { type: 'min_angling_trips', value: 100 },
      { type: 'min_reputation', value: 80 },
    ],
    requiresRenewal: false,
    unlocksFeatures: ['tournament_hosting'],
  },
];

export function getLicenseByType(type: LicenseType): LicenseDef | undefined {
  return LICENSE_DATABASE.find((l) => l.type === type);
}

export function checkUnlockRequirements(
  requirements: UnlockRequirement[],
  context: {
    totalTrips: number;
    totalFishCaught: number;
    caughtFishIds: string[];
    coins: number;
    heldLicenses: LicenseType[];
    completedQuests: string[];
    visitedSpots: string[];
    reputationScore: number;
  }
): { met: boolean; failedReqs: UnlockRequirement[] } {
  const failedReqs: UnlockRequirement[] = [];

  for (const req of requirements) {
    let met = false;
    switch (req.type) {
      case 'min_angling_trips':
        met = context.totalTrips >= req.value;
        break;
      case 'min_fish_caught':
        met = context.totalFishCaught >= req.value;
        break;
      case 'specific_fish_caught':
        met = context.caughtFishIds.includes(req.fishId);
        break;
      case 'min_coins':
        met = context.coins >= req.value;
        break;
      case 'license_held':
        met = context.heldLicenses.includes(req.licenseType);
        break;
      case 'quest_completed':
        met = context.completedQuests.includes(req.questId);
        break;
      case 'spot_visited':
        met = context.visitedSpots.includes(req.spotId);
        break;
      case 'min_reputation':
        met = context.reputationScore >= req.value;
        break;
    }
    if (!met) failedReqs.push(req);
  }

  return { met: failedReqs.length === 0, failedReqs };
}
