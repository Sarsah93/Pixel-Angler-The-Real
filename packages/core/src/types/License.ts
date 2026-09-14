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
  // 토지·주거 (122차)
  | 'land_home_lot'         // 주택 부지 이용 허가 (집 증축·마당 시설)
  | 'farmland_use'          // 농지 이용권 (텃밭 확장·경작)
  // 선박·어업 (122차)
  | 'boat_operator'         // 소형 선박 조종 면허 (개인 보트 운항)
  | 'fishery_member'        // 수협 조합원증 (어업인 등록 — 어촌계 어장 채취 허용)
  // 스토리 자격 사다리 (134차 — STORY_SPEC_v3 §6). 스킬 포인트 보너스 제외(Σ 215 불변)
  | 'reported_fishery'      // 신고어업(맨손어업) 등록 — 통발·맨손 어획물 위판 개방
  | 'coop_member'           // 어촌계원 — 총회 승낙 (Ch1)
  | 'angling_boat_biz'      // 낚시어선업 신고 (Ch4)
  | 'marine_tourism'        // 해양관광업 등록 (Ch5)
  | 'port_restricted_access'// 항만 제한구역 낚시 허가
  // 사업 운영
  | 'food_service'          // 식품위생법 영업허가 (식당 경영)
  | 'marine_tourism'        // 해양관광사업 등록 (선상콘도)
  | 'tournament_host';      // 토너먼트 주최권

// ─────────────────────────────────────────────
// 라이선스 상세 정의
// ─────────────────────────────────────────────

/** 면허 분류 (122차) — 패널 그룹·순서 */
export type LicenseCategory = 'fishing' | 'gathering' | 'trap' | 'land' | 'vessel' | 'business';
export const LICENSE_CATEGORY_ORDER: LicenseCategory[] = ['fishing', 'gathering', 'trap', 'land', 'vessel', 'business'];
export const LICENSE_CATEGORY_LABEL: Record<LicenseCategory, string> = {
  fishing: '낚시', gathering: '해루질', trap: '통발', land: '토지 · 주거', vessel: '선박 · 어업', business: '사업',
};

export interface LicenseDef {
  type: LicenseType;
  category: LicenseCategory;
  nameKo: string;
  /** 영어 로케일 표시명 — 데이터가 곧 번역 (I18n.buildRuntimeDict) */
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  /** 게이트 대상 시스템이 아직 없으면 그 사실을 적는다 (패널 ※ 표기) */
  plannedNote?: string;
  plannedNoteEn?: string;
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
  | 'catch_and_cook_advanced' // 고급 캐치앤쿡 (회뜨기/구이)
  // 122차 — 토지·주거 / 선박·어업
  | 'home_expansion'          // 집 증축·마당 시설 확장
  | 'farm_plots'              // 농지(텃밭) 확장·경작
  | 'boat_operation'          // 개인 보트 운항
  | 'village_fishery_gathering' // 어촌계 어장 안 정착성 수산물 채취 (조례 면제 — 어업인)
  | 'restricted_port_fishing';  // 항만 제한구역 낚시

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
    category: 'fishing',
    nameKo: '기본 낚시 면허',
    nameEn: 'Basic Angling Licence',
    description: '방파제/갯바위에서의 기본 찌낚시/루어낚시를 허용합니다.',
    descriptionEn: 'Allows basic float and lure fishing from breakwaters and rocks.',
    costCoins: 0,
    prerequisites: [],
    requirements: [],
    requiresRenewal: false,
    unlocksFeatures: [],
  },
  {
    type: 'boat_angling',
    category: 'fishing',
    nameKo: '선상 낚시 면허',
    nameEn: 'Boat Angling Licence',
    description: '선장의 배를 빌려 선상 낚시를 즐길 수 있습니다.',
    descriptionEn: 'Rent a captain\'s boat and fish offshore.',
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
    category: 'gathering',
    nameKo: '해루질 입문 허가',
    nameEn: 'Basic Gleaning Permit',
    description: '야간 조간대에서 조개류·소라·게를 채취할 수 있습니다.',
    descriptionEn: 'Gather shellfish, sea snails and crabs on the night shore.',
    costCoins: 3000,
    prerequisites: ['basic_angling'],
    // 121차: 구 '거제 구조라 방문' 조건 제거 — 심리스 속초에선 영영 달성 불가했다(visitedSpots 판정)
    requirements: [
      { type: 'min_angling_trips', value: 10 },
    ],
    requiresRenewal: true,
    renewalIntervalDays: 365,
    unlocksFeatures: ['shore_hunting_mode'],
  },
  {
    type: 'shore_hunting_advanced',
    category: 'gathering',
    nameKo: '해루질 심화 허가 (문어·전복)',
    nameEn: 'Advanced Gleaning Permit (Octopus · Abalone)',
    description: '문어, 낙지, 전복 채취 허가. 반드시 입문 허가 보유 후 취득 가능.',
    descriptionEn: 'Permits octopus, long-arm octopus and abalone. Requires the basic permit first.',
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
    category: 'trap',
    nameKo: '통발 조업 기본 면허',
    nameEn: 'Basic Trap Licence',
    description: '게·새우 통발을 최대 3개까지 설치할 수 있습니다.',
    descriptionEn: 'Set up to three crab and shrimp traps.',
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
    category: 'trap',
    nameKo: '통발 조업 심화 면허 (장어·문어)',
    nameEn: 'Advanced Trap Licence (Eel · Octopus)',
    description: '장어 통발과 문어 단지를 사용할 수 있습니다.',
    descriptionEn: 'Use eel traps and octopus pots.',
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
    category: 'business',
    nameKo: '식품위생법 영업허가',
    nameEn: 'Food Service Licence',
    description: '식당을 개업하고 조리 식품을 판매할 수 있습니다.',
    descriptionEn: 'Open a restaurant and sell cooked dishes.',
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
    category: 'business',
    nameKo: '해양관광사업 등록',
    nameEn: 'Marine Tourism Registration',
    description: '선상콘도를 운영하고 낚시 체험 패키지를 판매할 수 있습니다.',
    descriptionEn: 'Run the floating condo and sell fishing packages.',
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
    category: 'business',
    nameKo: '토너먼트 주최권',
    nameEn: 'Tournament Host Rights',
    description: '낚시 토너먼트를 직접 주최하고 참가비로 수익을 얻을 수 있습니다.',
    descriptionEn: 'Host fishing tournaments and earn entry fees.',
    costCoins: 50000,
    prerequisites: ['basic_angling'],
    requirements: [
      { type: 'min_angling_trips', value: 100 },
      { type: 'min_reputation', value: 80 },
    ],
    requiresRenewal: false,
    unlocksFeatures: ['tournament_hosting'],
  },
  // ───────────── 122차 신설 — 낚시 제한구역 · 상업 통발 · 토지·주거 · 선박·어업 ─────────────
  {
    type: 'surf_casting', category: 'fishing',
    nameKo: '원투 낚시 허가 (제한구역)', nameEn: 'Surf Casting Permit (restricted areas)',
    description: '해수욕장 등 제한 구역에서 원투 낚시를 허용합니다.', descriptionEn: 'Allows surf casting in restricted areas such as beaches.',
    costCoins: 5000, prerequisites: ['basic_angling'], requirements: [{ type: 'min_angling_trips', value: 3 }],
    requiresRenewal: false, unlocksFeatures: ['protected_area_access'],
    plannedNote: '해수욕장 제한 구역 지정은 지역 확장 시 — 현재는 게이트만',
  },
  {
    type: 'port_restricted_access', category: 'fishing',
    nameKo: '항만 제한구역 낚시 허가', nameEn: 'Port Restricted-Area Fishing Permit',
    description: '항만 안벽·부두 등 제한 구역에서의 낚시를 허용합니다.', descriptionEn: 'Allows fishing from restricted port quays and piers.',
    costCoins: 20000, prerequisites: ['basic_angling'], requirements: [{ type: 'min_angling_trips', value: 15 }],
    requiresRenewal: true, renewalIntervalDays: 365, unlocksFeatures: ['restricted_port_fishing'],
    plannedNote: '항만 제한구역 지정(안벽·부두 캐스팅 차단)은 후속 — 현재는 게이트만',
  },
  {
    type: 'commercial_trap', category: 'trap',
    nameKo: '상업용 통발 면허', nameEn: 'Commercial Trap Licence',
    description: '통발을 최대 30개까지 설치할 수 있습니다.', descriptionEn: 'Deploy up to 30 traps.',
    costCoins: 60000, prerequisites: ['trap_advanced'], requirements: [{ type: 'min_angling_trips', value: 80 }, { type: 'license_held', licenseType: 'trap_advanced' }],
    requiresRenewal: true, renewalIntervalDays: 365, unlocksFeatures: ['trap_commercial'],
  },
  {
    type: 'land_home_lot', category: 'land',
    nameKo: '주택 부지 이용 허가', nameEn: 'Home Lot Use Permit',
    description: '집 증축(평수·지하·2층)과 마당 시설 확장을 허가합니다.', descriptionEn: 'Permits home expansion (floor, basement, second storey) and yard facilities.',
    costCoins: 40000, prerequisites: ['basic_angling'], requirements: [{ type: 'min_coins', value: 50000 }],
    requiresRenewal: false, unlocksFeatures: ['home_expansion'],
    plannedNote: '하우스 Tier 1~3 확장 도입 시 소비 — 현재는 게이트만',
  },
  {
    type: 'farmland_use', category: 'land',
    nameKo: '농지 이용권', nameEn: 'Farmland Use Right',
    description: '홈타운 농지(텃밭 확장·경작)를 이용할 수 있습니다.', descriptionEn: 'Use of hometown farmland (garden expansion and cultivation).',
    costCoins: 25000, prerequisites: ['land_home_lot'], requirements: [{ type: 'min_angling_trips', value: 10 }],
    requiresRenewal: true, renewalIntervalDays: 365, unlocksFeatures: ['farm_plots'],
    plannedNote: '농장 경영(S8) 착수 시 텃밭 확장 게이트 — 현재는 게이트만',
  },
  {
    type: 'boat_operator', category: 'vessel',
    nameKo: '소형 선박 조종 면허', nameEn: 'Small Vessel Operator Licence',
    description: '개인 보트를 직접 운항해 출조할 수 있습니다 (울릉·독도 등 배 전용 지역).', descriptionEn: 'Pilot your own boat on trips (boat-only regions such as Ulleung and Dokdo).',
    costCoins: 80000, prerequisites: ['boat_angling'], requirements: [{ type: 'min_angling_trips', value: 30 }, { type: 'min_fish_caught', value: 60 }],
    requiresRenewal: true, renewalIntervalDays: 365, unlocksFeatures: ['boat_operation'],
    plannedNote: '개인 보트 출조 콘텐츠 도입 시 필수 — 현재는 게이트만',
  },
  {
    type: 'fishery_member', category: 'vessel',
    nameKo: '수협 조합원증 (어업인 등록)', nameEn: 'Fisheries Co-op Membership (registered fisher)',
    description: '어업인으로 등록되어 어촌계 어장(마을어장·협동양식장) 안에서도 정착성 수산물을 채취할 수 있습니다. 비어업인 조례 규제가 면제됩니다.',
    descriptionEn: 'Registered as a fisher — you may gather sedentary seafood inside village fisheries and co-op farms. Exempt from the non-fisher ordinance.',
    costCoins: 150000, prerequisites: ['shore_hunting_advanced', 'trap_advanced'],
    requirements: [{ type: 'min_angling_trips', value: 60 }, { type: 'min_coins', value: 200000 }],
    requiresRenewal: true, renewalIntervalDays: 365, unlocksFeatures: ['village_fishery_gathering'],
  },
  // ── 134차 스토리 자격 사다리 — 취득은 메인 퀘스트 완료가 조건(§6). 비용 0 = 신고/승낙, 사업 등록만 유상 ──
  {
    type: 'reported_fishery', category: 'vessel',
    nameKo: '신고어업(맨손어업) 등록', nameEn: 'Reported Fishery (hand-gathering) Registration',
    description: '비어업인 어구(통발·투망·맨손)로 잡은 것을 위판·판매할 수 있습니다. 낚싯대 어획물은 여전히 판매 불가.',
    descriptionEn: 'Lets you auction catch taken with non-fisher gear (traps, nets, hands). Rod-caught fish still cannot be sold.',
    costCoins: 0, prerequisites: ['basic_angling'], requirements: [{ type: 'quest_completed', questId: 'M1-11' }],
    requiresRenewal: false, unlocksFeatures: [],
    plannedNote: 'Ch1 「총회」(M1-11) 완료 시 자동 취득 — 위판 UI 게이트는 후속',
    plannedNoteEn: 'Granted on completing Ch1 "General Meeting" (M1-11) — auction gate wiring is follow-up',
  },
  {
    type: 'coop_member', category: 'vessel',
    nameKo: '어촌계원', nameEn: 'Fishing Village Co-op Member',
    description: '동명항 어촌계 총회 승낙. 공동작업·위판·어촌계 어장 동행 채집이 열립니다.',
    descriptionEn: 'Accepted by the Dongmyeong co-op general meeting. Opens community work, auctions and escorted village-fishery gathering.',
    costCoins: 0, prerequisites: ['basic_angling'], requirements: [{ type: 'quest_completed', questId: 'M1-11' }],
    requiresRenewal: false, unlocksFeatures: ['village_fishery_gathering'],
    plannedNote: '실습생 D-180 → 예비계원 → 총회 승낙(M1-11)',
    plannedNoteEn: 'Trainee D-180 → candidate → accepted at the general meeting (M1-11)',
  },
  {
    type: 'angling_boat_biz', category: 'business',
    nameKo: '낚시어선업 신고', nameEn: 'Angling Boat Business Registration',
    description: '자기 배에 손님을 태우고 유상 출조를 할 수 있습니다 (선박 등록·검사 필요).',
    descriptionEn: 'Carry paying passengers on your own boat (vessel registration and inspection required).',
    costCoins: 100000, prerequisites: ['boat_operator'], requirements: [{ type: 'quest_completed', questId: 'M4-06' }],
    requiresRenewal: true, renewalIntervalDays: 365, unlocksFeatures: [],
    plannedNote: '배 출조 계통(§11-1 ④) 도입 시 소비 — 현재는 게이트만',
    plannedNoteEn: 'Consumed when the boat-trip system (§11-1 stage 4) lands — gate only for now',
  },
  {
    type: 'marine_tourism', category: 'business',
    nameKo: '해양관광업 등록', nameEn: 'Marine Tourism Business Registration',
    description: '낚시 가이드 영업(포인트 선정·조황 책임·평점)을 할 수 있습니다.',
    descriptionEn: 'Operate as a fishing guide (spot selection, catch responsibility, ratings).',
    costCoins: 150000, prerequisites: ['angling_boat_biz'], requirements: [{ type: 'quest_completed', questId: 'M5-04' }],
    requiresRenewal: true, renewalIntervalDays: 365, unlocksFeatures: [],
    plannedNote: '가이드 영업 루프(§11-1 ⑤) 도입 시 소비 — 현재는 게이트만',
    plannedNoteEn: 'Consumed when the guide business loop (§11-1 stage 5) lands — gate only for now',
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
