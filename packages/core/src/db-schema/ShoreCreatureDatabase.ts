/**
 * @file ShoreCreatureDatabase.ts
 * @description 해루질 대상 생물 데이터베이스
 *
 * 한국 조간대 및 연안에 서식하는 채취 가능 생물 데이터.
 * 계절성, 서식 위치, 법적 채취 제한 등을 포함합니다.
 */

import type { ShoreCreatureCategory } from '../types/Activities.js';
import type { ClosedSeason, LegalRegionKey, RegionalLegalRule } from '../types/LegalSeason.js';
import type { SpotType } from '../types/Environment.js';
import type { ForageTool, ForageSpotKind, ForageAccess, ForageBehavior } from '../types/Foraging.js';

// ─────────────────────────────────────────────
// 해루질 생물 스키마
// ─────────────────────────────────────────────

export interface ShoreCreature {
  id: string;
  nameKo: string;
  nameEn: string;
  scientificName: string;
  spriteKey: string;
  category: ShoreCreatureCategory;
  /** 서식 가능 스팟 타입 */
  habitatSpotTypes: SpotType[];
  /** 주요 서식 위치 설명 */
  habitatDesc: string;
  /** 최소 법정 채취 크기 (cm, 0=제한없음) */
  minLegalSizeCm: number;
  /** 일일 채취 제한량 (g, 0=무제한) */
  dailyLimitG: number;
  /** 금어기 월 (1~12) — 달 단위 호환용. 날짜 구간(`closedSeasons`)이 있으면 그쪽이 정본이고 이건 걸치는 달 */
  closedSeasonMonths: number[];
  /** 227차 — 금어기 날짜 구간(국가 기준 · 강원 기본 적용). 판정은 `resolveLegal` · `isClosedOn` */
  closedSeasons?: ClosedSeason[];
  /** 227차 — 지역 규정이 다르면 덮어쓴다(제주 전복 · 소라 · 오분자기) */
  regional?: Partial<Record<LegalRegionKey, RegionalLegalRule>>;
  /** 발견 가능 조도 (낮/밤/모두) */
  discoveryTime: 'day' | 'night' | 'both';
  /** 발견에 필요한 최소 랜턴 루멘 */
  minLampLumens: number;
  /** 시장 가격 (원/kg) */
  marketValuePerKg: number;
  /** 식당 메뉴 활용 가능 여부 */
  isRestaurantIngredient: boolean;
  /** 낚시 미끼로 활용 가능 여부 */
  canBeUsedAsBait: boolean;
  /** 설명 */
  description: string;
  /** 해금 라이선스 타입 (null = 기본 허가로 채취 가능) */
  requiredLicense: 'shore_hunting_basic' | 'shore_hunting_advanced' | null;
  // ── 인-맵 채집 (121차) — 없으면 ForagingEngine이 카테고리·서식지로 추론 ──
  /** 허용 도구 (앞이 1순위 — 성공률 가산) */
  tools?: ForageTool[];
  /** 나올 수 있는 스팟 종류 */
  spotKinds?: ForageSpotKind[];
  /** 맨손 시도 시 부상(성게 가시·굴 껍질) */
  handInjury?: boolean;
  /** 접근 방식 — 'shore'(기본) / 후속 'wade'·'dive'(스킨/스쿠버 전용 생물) */
  access?: ForageAccess;
  /** 강원 조례 어촌계 어장 보호 5종 — 표기용 (판정은 GANGWON_FORAGE_ORDINANCE) */
  ordinanceProtected?: boolean;
  // ── 224차 — 서식 현실화(웹 조사 2026-10-06 · 사용자 지시) ──
  /** 사는 모양 → 채집 손놀림 놀이 갈래(파기 · 떼기 · 당기기 · 줍기 · 덮치기). 없으면 카테고리로 추론 */
  behavior?: ForageBehavior;
  /** 얕은 물 바닥 — soft(모래 · 펄 · 자갈) / rock(갯바위) / 없으면 아무 데나 */
  substrate?: 'soft' | 'rock';
  /** 동해(강원 · 경북) 출현 배율 — 0 = 동해에 없다(오분자기) · 1 = 기본. 남해 · 서해는 언제나 1 */
  eastSeaWeight?: number;
  /** 생태상 안 보이는 달(여름잠 · 추위) — 금어기(법)와 별개 */
  absentMonths?: number[];
  /** 잡으면 이 미끼 아이템으로 가방에 들어간다(쫄장게 · 갯강구 · 갯지렁이) */
  baitItemId?: string;
  /** 달아나는 빠르기 0~1(덮치기 · 줍기) — 없으면 갈래 기본 */
  agility?: number;
  /** 떼기 — 떼어 낼 때 맞혀야 하는 수 */
  pryHits?: number;
  /** 떼기 — 한 번 놓치면 꽉 조여 붙는다(삿갓조개 — 놀라기 전에 한 번에) */
  clampsHard?: boolean;
}

// ─────────────────────────────────────────────
// 초기 데이터
// ─────────────────────────────────────────────

export const SHORE_CREATURE_DATABASE: ShoreCreature[] = [
  // ────────── 조개류 ──────────
  {
    id: 'clam_varicosa',
    nameKo: '바지락',
    nameEn: 'Short-necked Clam',
    scientificName: 'Ruditapes philippinarum',
    spriteKey: 'creature_clam_varicosa',
    category: 'bivalve',
    habitatSpotTypes: ['beach', 'tidal_flat'],
    habitatDesc: '모래가 섞인 갯벌 조간대에 10cm 안팎으로 묻혀 산다. 동해(강원)에는 거의 없다.',
    minLegalSizeCm: 0,
    dailyLimitG: 3000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 8000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '전국 갯벌에서 채취 가능한 국민 조개. 바지락 칼국수, 바지락 술찜의 핵심 재료.',
    requiredLicense: 'shore_hunting_basic',
    behavior: 'buried',
    access: 'wade',
    spotKinds: ['shallows'],
    substrate: 'soft',
    tools: ['rake', 'hand'],
    eastSeaWeight: 0.05,
  },
  {
    id: 'turbo_cornutus',
    nameKo: '소라',
    nameEn: 'Horned Turban',
    scientificName: 'Turbo cornutus',
    spriteKey: 'creature_turbo',
    category: 'gastropod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '해조가 많은 얕은 암초. 밤에 기어 나와 해조를 갉는다. 수온이 올라 북쪽(울진)까지 올라왔지만 속초에선 드물다.',
    minLegalSizeCm: 5.0,
    dailyLimitG: 5000,
    closedSeasonMonths: [],
    discoveryTime: 'night',
    minLampLumens: 500,
    marketValuePerKg: 25000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '해루질의 대표 종. 야간에 바위 표면을 기어다니므로 집어등으로 쉽게 발견 가능.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['tongs', 'hand'],
    behavior: 'crawler',
    access: 'wade',
    spotKinds: ['shallows'],
    substrate: 'rock',
    eastSeaWeight: 0.3,
    handInjury: true,
    // 국가 금어기 없음 · 각고 5cm — 제주만 6.1~8.31 금어기 · 각고 7cm
    regional: { jeju: { closedSeasons: [{ from: [6, 1], to: [8, 31] }], minLegalSizeCm: 7 } },
  },
  {
    id: 'oyster_gigas',
    nameKo: '굴',
    nameEn: 'Pacific Oyster',
    scientificName: 'Crassostrea gigas',
    spriteKey: 'creature_oyster',
    category: 'bivalve',
    habitatSpotTypes: ['rocky_shore', 'breakwater', 'tidal_flat'],
    habitatDesc: '조간대 중·하부 바위에 시멘트처럼 붙는다. 껍데기 가장자리가 칼날처럼 날카롭다.',
    minLegalSizeCm: 0,
    dailyLimitG: 5000,
    closedSeasonMonths: [],  // 227차 — 국가 금어기 없음(봄철 패류독소 채취 금지는 별개 — 백로그 BG)
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 12000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '바위에 붙어있는 굴은 장갑 끼고 돌칼로 분리. 生굴 특유의 달콤한 바다향.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['tongs', 'hand'], handInjury: true, spotKinds: ['rock_shore', 'harbor_wall'],
    behavior: 'attached',
    pryHits: 2,
  },
  {
    id: 'haliotis_discus',
    nameKo: '전복',
    nameEn: 'Pacific Abalone',
    scientificName: 'Haliotis discus hannai',
    spriteKey: 'creature_abalone',
    category: 'gastropod',
    habitatSpotTypes: ['rocky_shore'],
    habitatDesc: '물속 바위 밑에 숨었다가 밤에 기어 나온다. 건드리면 꽉 붙는다 — 깊으면 집게, 가까우면 장갑 낀 손.',
    minLegalSizeCm: 7.0,
    dailyLimitG: 2000,
    closedSeasonMonths: [9, 10],  // 산란기 보호 — 9.1~10.31(국가) · 제주 10.1~12.31 · 각장 10cm
    discoveryTime: 'night',
    minLampLumens: 1500,
    marketValuePerKg: 90000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '해루질의 로망. 작은 갈고리로 바위에서 분리. 심화 라이선스 필수.',
    requiredLicense: 'shore_hunting_advanced',
    tools: ['tongs', 'hand'], spotKinds: ['shallows'], ordinanceProtected: true,
    behavior: 'attached',
    access: 'wade',
    substrate: 'rock',
    handInjury: true,
    pryHits: 3,
    eastSeaWeight: 0.5,
    closedSeasons: [{ from: [9, 1], to: [10, 31] }],
    regional: { jeju: { closedSeasons: [{ from: [10, 1], to: [12, 31] }], minLegalSizeCm: 10 } },
  },
  // ────────── 갑각류 ──────────
  {
    id: 'portunus_trituberculatus',
    nameKo: '꽃게',
    nameEn: 'Swimming Crab',
    scientificName: 'Portunus trituberculatus',
    spriteKey: 'creature_portunus',
    category: 'crustacean',
    habitatSpotTypes: ['beach', 'tidal_flat', 'breakwater'],
    habitatDesc: '낮엔 모래에 묻혀 있다가 밤에 얕은 물로 들어온다. 헤엄쳐 달아나는 게라 빠르다. 동해엔 드물다.',
    minLegalSizeCm: 6.4,
    dailyLimitG: 0,
    closedSeasonMonths: [6, 7, 8],  // 6.21~8.20(시·도 고시 통상값) · 6.4cm(두흉갑장) — 민꽃게에는 해당 없음
    discoveryTime: 'night',
    minLampLumens: 500,
    marketValuePerKg: 40000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '야간 해루질의 대표 수확물. 통발에도 잘 걸리며 꽃게탕, 꽃게찜으로 최고.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['net', 'tongs', 'hand'], spotKinds: ['shallows'],
    behavior: 'runner',
    access: 'wade',
    substrate: 'soft',
    eastSeaWeight: 0.15,
    agility: 0.75,
    handInjury: true,
    closedSeasons: [{ from: [6, 21], to: [8, 20] }],
  },
  {
    id: 'charybdis_japonica',
    nameKo: '민꽃게 (돌게)',
    nameEn: 'Japanese Swimming Crab',
    scientificName: 'Charybdis japonica',
    spriteKey: 'creature_charybdis',
    category: 'crustacean',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '낮엔 물속 돌 밑에 숨고 밤에 나온다. 집게 힘이 세서 물리면 크게 다친다.',
    minLegalSizeCm: 0,
    dailyLimitG: 0,
    closedSeasonMonths: [],
    discoveryTime: 'night',
    minLampLumens: 300,
    marketValuePerKg: 20000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '돌 밑을 들추면 튀어나오는 게. 게장용으로 좋다. 장갑 없이 손대지 말 것.',
    // 229차 — 국가 금어기 · 체장 · 조례 · 패류독소 어디에도 안 걸리는 「입문 채집물」. 허가 없이 갯바위 · 안벽에서도 잡는다(사용자 결정).
    requiredLicense: null,
    tools: ['tongs', 'net', 'hand'], spotKinds: ['shallows', 'rock_shore', 'armor_foot', 'harbor_wall'],
    behavior: 'runner',
    substrate: 'rock',
    agility: 0.55,
    handInjury: true,
    eastSeaWeight: 0.4,
  },
  // ────────── 두족류 ──────────
  {
    id: 'octopus_minor',
    nameKo: '낙지',
    nameEn: 'Long-arm Octopus',
    scientificName: 'Octopus minor',
    spriteKey: 'creature_octopus_minor',
    category: 'cephalopod',
    habitatSpotTypes: ['tidal_flat', 'beach'],
    habitatDesc: '펄 갯벌 구멍 속. 밤에 구멍 밖으로 나온다. 펄이 없는 동해엔 드물다.',
    minLegalSizeCm: 0,
    dailyLimitG: 0,
    closedSeasonMonths: [6],
    discoveryTime: 'night',
    minLampLumens: 0,
    marketValuePerKg: 60000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '갯벌 낙지 잡기는 고도의 기술이 필요. 꼬챙이로 구멍 속을 찌르면 촉수가 올라옴.',
    requiredLicense: 'shore_hunting_advanced',
    behavior: 'buried',
    access: 'wade',
    spotKinds: ['shallows'],
    substrate: 'soft',
    tools: ['rake', 'hand'],
    eastSeaWeight: 0.1,
    closedSeasons: [{ from: [6, 1], to: [6, 30] }],
  },
  {
    id: 'octopus_vulgaris',
    nameKo: '돌문어',
    nameEn: 'Common Octopus',
    scientificName: 'Octopus vulgaris',
    spriteKey: 'creature_octopus',
    category: 'cephalopod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '얕은 물 바위 틈에 숨어 빨판으로 버틴다. 밤에 나와 먹이를 찾고, 놀라면 먹물을 쏘고 순식간에 달아난다.',
    minLegalSizeCm: 0,
    dailyLimitG: 0,
    closedSeasonMonths: [5, 6],  // 참문어(동해 「돌문어」) 5.16~6.30 — 금지체중은 국가 기준 없음
    discoveryTime: 'night',
    minLampLumens: 1000,
    marketValuePerKg: 45000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '장화를 신고 물에 들어가 바위 틈의 문어를 집게로 끌어낸다. 강원 시장에서 「참문어」라 부르는 것은 대개 대문어다.',
    requiredLicense: 'shore_hunting_advanced',
    tools: ['tongs', 'gaff', 'net'], spotKinds: ['shallows'], ordinanceProtected: true,
    behavior: 'crevice',
    access: 'wade',
    substrate: 'rock',
    eastSeaWeight: 0.6,
    closedSeasons: [{ from: [5, 16], to: [6, 30] }],
  },
  // ────────── 극피동물 ──────────
  {
    id: 'strongylocentrotus_nudus',
    nameKo: '성게 (보라성게)',
    nameEn: 'Sea Urchin',
    scientificName: 'Strongylocentrotus nudus',
    spriteKey: 'creature_sea_urchin',
    category: 'echinoderm',
    habitatSpotTypes: ['rocky_shore'],
    habitatDesc: '얕은 물 바위 표면과 틈. 아주 느리게 움직인다. 가시가 길고 날카로워 부러져 박힌다.',
    minLegalSizeCm: 0,
    dailyLimitG: 1000,
    closedSeasonMonths: [],  // 산란기 보호
    discoveryTime: 'both',
    minLampLumens: 300,
    marketValuePerKg: 80000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '성게알 (생식소)은 고급 횟집 재료. 채취 시 장갑 필수.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['tongs', 'hand'], handInjury: true, spotKinds: ['shallows'], ordinanceProtected: true,
    behavior: 'crawler',
    access: 'wade',
    substrate: 'rock',
    agility: 0.1,
  },
  {
    id: 'stichopus_japonicus',
    nameKo: '해삼',
    nameEn: 'Japanese Sea Cucumber',
    scientificName: 'Stichopus japonicus',
    spriteKey: 'creature_sea_cucumber',
    category: 'echinoderm',
    habitatSpotTypes: ['rocky_shore', 'tidal_flat'],
    habitatDesc: '겨울~봄엔 얕은 물 돌 밑까지 올라온다. 물이 17도를 넘으면 먹이를 끊고 25도가 넘으면 여름잠에 든다.',
    minLegalSizeCm: 0,
    dailyLimitG: 2000,
    closedSeasonMonths: [7],  // 하면 (夏眠)
    discoveryTime: 'both',
    minLampLumens: 200,
    marketValuePerKg: 100000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '겨울이 제철인 귀한 식재료. 건해삼은 가격이 매우 비쌈.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['tongs', 'hand'], spotKinds: ['shallows'], ordinanceProtected: true,
    behavior: 'crawler',
    access: 'wade',
    substrate: 'rock',
    absentMonths: [8, 9],
    agility: 0.1,
    closedSeasons: [{ from: [7, 1], to: [7, 31] }],
  },
  // ────────── 동해 암반 조간대 4종 (121차 — 속초 갯바위·방파제 실제 채집물) ──────────
  {
    id: 'mytilus_coruscus',
    nameKo: '홍합 (섭)',
    nameEn: 'Korean Mussel',
    scientificName: 'Mytilus coruscus',
    spriteKey: 'creature_mussel',
    category: 'bivalve',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '족사로 바위에 붙는다. 동해 섭(참담치)은 물속 깊이 살고, 갯바위·안벽의 작은 홍합은 대부분 진주담치다.',
    minLegalSizeCm: 0,
    dailyLimitG: 5000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 6000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '강원 조례 보호종 — 어촌계 어장 안에서는 채취 금지. 섭국·섭죽의 주재료.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['hand', 'tongs'], spotKinds: ['rock_shore', 'harbor_wall', 'armor_foot'], ordinanceProtected: true,
    behavior: 'attached',
    pryHits: 1,
  },
  {
    id: 'omphalius_rusticus',
    nameKo: '보말 (팽이고둥)',
    nameEn: 'Top Shell',
    scientificName: 'Omphalius rusticus',
    spriteKey: 'creature_top_shell',
    category: 'gastropod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '조간대 바위 틈과 웅덩이. 낮에도 줍는다.',
    minLegalSizeCm: 0,
    dailyLimitG: 3000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 9000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '해녀들이 보말이라 부르는 작은 고둥. 삶아서 이쑤시개로 빼 먹거나 보말죽으로.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['hand', 'tongs'], spotKinds: ['rock_shore', 'tidepool', 'armor_foot'],
    behavior: 'crawler',
    agility: 0.2,
  },
  {
    id: 'capitulum_mitella',
    nameKo: '거북손',
    nameEn: 'Goose Barnacle',
    scientificName: 'Capitulum mitella',
    spriteKey: 'creature_barnacle',
    category: 'shellfish',
    habitatSpotTypes: ['rocky_shore'],
    habitatDesc: '파도가 세게 치는 갯바위 틈에 다닥다닥. 집게로 뜯어낸다.',
    minLegalSizeCm: 0,
    dailyLimitG: 2000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 15000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: true,
    description: '삶으면 게와 조개 사이의 맛. 갯바위 채집의 별미.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['tongs'], handInjury: true, spotKinds: ['rock_shore'],
    behavior: 'attached',
    pryHits: 2,
  },
  {
    id: 'cellana_grata',
    nameKo: '삿갓조개 (배말)',
    nameEn: 'Limpet',
    scientificName: 'Cellana grata',
    spriteKey: 'creature_limpet',
    category: 'gastropod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '바위에 흡착해 산다. 건드리면 즉시 조여 붙어 손으로는 거의 못 뗀다 — 놀라기 전에 한 번에.',
    minLegalSizeCm: 0,
    dailyLimitG: 2000,
    closedSeasonMonths: [],
    discoveryTime: 'both',
    minLampLumens: 0,
    marketValuePerKg: 8000,
    isRestaurantIngredient: true,
    canBeUsedAsBait: false,
    description: '눌러 붙으면 안 떨어진다 — 집게로 한 번에. 배말국·배말밥.',
    requiredLicense: 'shore_hunting_basic',
    tools: ['tongs', 'hand'], spotKinds: ['rock_shore', 'harbor_wall'],
    behavior: 'attached',
    pryHits: 1,
    clampsHard: true,
  },
  // ────────── 추가 조간대 종 — 사용자 요청 2026-09-20 ──────────
  {
    id: 'haliotis_diversicolor', nameKo: '오분자기', nameEn: 'Small Abalone',
    scientificName: 'Haliotis diversicolor', spriteKey: 'creature_abalone_small', category: 'gastropod',
    habitatSpotTypes: ['rocky_shore', 'breakwater'], habitatDesc: '제주와 남해 일부의 얕은 바다 바위 틈. 동해에는 살지 않는다.',
    minLegalSizeCm: 0, dailyLimitG: 0, closedSeasonMonths: [], discoveryTime: 'night', minLampLumens: 800,   // 227차 — 금어기 · 체장은 제주 한정(아래 regional)
    marketValuePerKg: 45000, isRestaurantIngredient: true, canBeUsedAsBait: false,
    description: '전복보다 작은 암반성 소형 전복류. 바위에 단단히 붙어 집게나 갈고리가 필요하다.',
    requiredLicense: 'shore_hunting_advanced', tools: ['gaff', 'tongs'], spotKinds: ['shallows'], ordinanceProtected: true,
    behavior: 'attached',
    access: 'wade',
    substrate: 'rock',
    eastSeaWeight: 0,
    pryHits: 2,
    regional: { jeju: { closedSeasons: [{ from: [7, 1], to: [8, 31] }], minLegalSizeCm: 4 } },
  },
  {
    id: 'heliocidaris_crassispina', nameKo: '말똥성게', nameEn: 'Black-spined Urchin',
    scientificName: 'Hemicentrotus pulcherrimus', spriteKey: 'creature_urchin_black', category: 'echinoderm',
    habitatSpotTypes: ['rocky_shore', 'breakwater'], habitatDesc: '조간대 바위의 돌 밑·틈. 밤에 나와 해조를 먹는다. 가시가 짧아 장갑이면 손으로도 된다.',
    minLegalSizeCm: 0, dailyLimitG: 2000, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 200,
    marketValuePerKg: 28000, isRestaurantIngredient: true, canBeUsedAsBait: false,
    description: '가시가 굵고 검은 성게. 맨손 채집 시 부상 위험이 있어 집게를 사용한다.',
    requiredLicense: 'shore_hunting_basic', tools: ['tongs', 'hand'], handInjury: true, spotKinds: ['rock_shore', 'tidepool', 'shallows'], ordinanceProtected: true,
    behavior: 'crawler',
    substrate: 'rock',
    agility: 0.1,
    eastSeaWeight: 0.4,
  },
  {
    id: 'aplysia_kurodai', nameKo: '참군소', nameEn: 'Sea Hare',
    scientificName: 'Aplysia kurodai', spriteKey: 'creature_sea_hare', category: 'gastropod',
    habitatSpotTypes: ['rocky_shore'], habitatDesc: '해조류가 자라는 얕은 암반과 조수웅덩이.',
    minLegalSizeCm: 0, dailyLimitG: 1500, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 0,
    marketValuePerKg: 9000, isRestaurantIngredient: false, canBeUsedAsBait: false,
    description: '해조류 사이를 느리게 이동하는 군소. 관찰·도감 기록 중심의 해루질 발견물.',
    requiredLicense: 'shore_hunting_basic', tools: ['hand', 'tongs'], spotKinds: ['tidepool', 'shallows'],
    behavior: 'crawler',
    agility: 0.15,
  },
  {
    id: 'hemigrapsus_sanguineus', nameKo: '쫄장게', nameEn: 'Asian Shore Crab',
    scientificName: 'Hemigrapsus sanguineus', spriteKey: 'creature_shore_crab', category: 'crustacean',
    habitatSpotTypes: ['rocky_shore', 'breakwater'], habitatDesc: '갯바위·사석의 돌 밑과 바위 틈. 불빛이나 그림자에 옆걸음으로 달아나 돌 밑으로 숨는다.',
    minLegalSizeCm: 0, dailyLimitG: 1000, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 0,
    marketValuePerKg: 12000, isRestaurantIngredient: true, canBeUsedAsBait: true,
    description: '엄지손톱만 한 갯바위 게. 감성돔 생미끼로 특효 — 집게발 하나를 떼고 그 자리로 바늘을 꿴다.',
    requiredLicense: 'shore_hunting_basic', tools: ['hand', 'tongs', 'net'], spotKinds: ['rock_shore', 'armor_foot', 'tidepool'],
    behavior: 'runner',
    agility: 0.7,
    baitItemId: 'inv_bait_shorecrab',
  },
  // ────────── 224차 — 미끼로 쓰는 갯것 (사용자 지시 「직접 파낸 갯지렁이 · 갯강구 · 쫄장게를 미끼로」) ──────────
  {
    id: 'ligia_exotica', nameKo: '갯강구', nameEn: 'Sea Slater',
    scientificName: 'Ligia exotica', spriteKey: 'creature_sea_slater', category: 'crustacean',
    habitatSpotTypes: ['rocky_shore', 'breakwater'],
    habitatDesc: '물속엔 들어가지 않는다. 파도가 튀는 갯바위 · 방파제 벽 · 해조 더미에 떼 지어 산다. 다가가면 순식간에 흩어진다.',
    minLegalSizeCm: 0, dailyLimitG: 0, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 0,
    marketValuePerKg: 0, isRestaurantIngredient: false, canBeUsedAsBait: true,
    description: '「바다 바퀴벌레」. 쓰는 사람은 적지만 입질이 잦은 미끼다 — 망상어 · 벵에돔 · 감성돔. 크릴처럼 꼬리에서 머리로 꿴다.',
    requiredLicense: null, tools: ['hand', 'net'], spotKinds: ['rock_shore', 'armor_foot', 'harbor_wall'],
    behavior: 'runner', agility: 0.97, absentMonths: [1, 2], baitItemId: 'inv_bait_slater',
  },
  {
    id: 'perinereis_aibuhitensis', nameKo: '청갯지렁이', nameEn: 'Clam Worm',
    scientificName: 'Perinereis aibuhitensis', spriteKey: 'creature_ragworm', category: 'annelid',
    habitatSpotTypes: ['tidal_flat', 'beach'],
    habitatDesc: '펄 · 모래 · 자갈이 섞인 얕은 물가 바닥 속. 동해는 펄이 적어 드물다 — 귀한 현지 미끼.',
    minLegalSizeCm: 0, dailyLimitG: 0, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 0,
    marketValuePerKg: 0, isRestaurantIngredient: false, canBeUsedAsBait: true,
    description: '사실상 만능 미끼 — 우럭 · 노래미 · 감성돔. 삽질은 몸을 끊는다. 갈퀴로 살살 긁어 뒤집는다.',
    requiredLicense: null, tools: ['rake', 'hand'], spotKinds: ['shallows'], access: 'wade',
    behavior: 'buried', substrate: 'soft', eastSeaWeight: 0.35, baitItemId: 'inv_ragworm',
  },
  {
    id: 'marphysa_sanguinea', nameKo: '혼무시 (바위털갯지렁이)', nameEn: 'Rock Worm',
    scientificName: 'Marphysa sanguinea', spriteKey: 'creature_honmushi', category: 'annelid',
    habitatSpotTypes: ['rocky_shore', 'tidal_flat'],
    habitatDesc: '물이 빠진 갯바위 아래 펄 섞인 자갈 속. 돌을 뒤집어 그 밑을 판다. 남해 · 서해에 많고 동해엔 드물다.',
    minLegalSizeCm: 0, dailyLimitG: 0, closedSeasonMonths: [], discoveryTime: 'both', minLampLumens: 0,
    marketValuePerKg: 0, isRestaurantIngredient: false, canBeUsedAsBait: true,
    description: '굵고 붉은 최고가 미끼(참갯지렁이). 감성돔 · 돌돔 · 참돔. 놀라면 더 깊이 파고든다.',
    requiredLicense: null, tools: ['rake', 'hand'], spotKinds: ['rock_shore', 'shallows'],
    behavior: 'buried', eastSeaWeight: 0.25, absentMonths: [12, 1, 2], baitItemId: 'inv_honmushi',
  },
];

export function getCreatureById(id: string): ShoreCreature | undefined {
  return SHORE_CREATURE_DATABASE.find((c) => c.id === id);
}

export function getCreaturesByCategory(category: ShoreCreatureCategory): ShoreCreature[] {
  return SHORE_CREATURE_DATABASE.filter((c) => c.category === category);
}

export function getCreaturesBySpotType(spotType: SpotType): ShoreCreature[] {
  return SHORE_CREATURE_DATABASE.filter((c) => c.habitatSpotTypes.includes(spotType));
}

export function getActiveCreaturesByMonth(month: number): ShoreCreature[] {
  return SHORE_CREATURE_DATABASE.filter((c) => !c.closedSeasonMonths.includes(month));
}
