/**
 * @file FisheryLaw.ts
 * @description 어업·낚시 법 규칙 5조 — 코어 승격 구현 계약 (134차, STORY_SPEC_v3 §3)
 *
 * 전부 **순수 함수**다. 어떤 상태도 갖지 않고, 인자로 받은 출처(`CatchProvenance`)·면허 목록만 본다.
 * UI는 `LawVerdict.reasonKo`를 툴팁에 그대로 노출하고, 거부 시 `alternatives`를 2개까지 보여준다(§3-6).
 *
 * ⚖ 핵심 오해 방지(§3-3): **어업인이 되어도 낚싯대로 잡은 것은 여전히 못 판다.**
 *   어업인 자격이 여는 것은 통발·투망·맨손어업 어획물의 위판이다.
 *
 * ⚠ 강제(enforcement)는 client 몫이고 `TUNING.law.enforceRodSell`로 켠다(§0.5-6).
 *   이 모듈은 판정만 한다 — 판정을 숨기지 말고 회색 처리 + 사유로 노출할 것(교육 목적).
 */

import type { CatchMethod, CatchProvenance, FisheryLawRuleId, LawVerdict, LegalFlag } from '../types/Story.js';

// ─────────────────────────────────────────────
// 규칙 5조 (§3-1) — 근거 법령은 실재, 수치는 `[VERIFY]` 대상
// ─────────────────────────────────────────────

export interface FisheryLawRule {
  id: FisheryLawRuleId;
  titleKo: string;
  titleEn: string;
  /** 규칙 평문 (도움말 ⑬에 그대로) */
  textKo: string;
  textEn: string;
  /** 근거 */
  basisKo: string;
  basisEn: string;
  /** 판정 대상 시점 */
  whenKo: string;
  whenEn: string;
}

export const FISHERY_LAW_RULES: FisheryLawRule[] = [
  {
    id: 'LAW_SELL_ROD',
    titleKo: '낚시로 잡은 것은 팔 수 없다', titleEn: 'Rod-caught fish cannot be sold',
    textKo: '낚시로 포획한 수산동물은 누구도 판매·판매 목적 저장·운반·진열할 수 없습니다. 어업인이 되어도 마찬가지입니다.',
    textEn: 'Aquatic animals caught by angling may not be sold, stored, transported or displayed for sale — by anyone, registered fisher or not.',
    basisKo: '낚시 관리 및 육성법 제7조의2', basisEn: 'Fishing Management and Promotion Act, Art. 7-2',
    whenKo: '판매 · 위판 · 유상 납품', whenEn: 'Sale · auction · paid delivery',
  },
  {
    id: 'LAW_NONFISHER_GEAR',
    titleKo: '비어업인의 어구 제한', titleEn: 'Gear restrictions for non-fishers',
    textKo: '비어업인은 투망 · 반두 · 쪽대 · 외줄낚시 · 가리 · 외통발 · 집게 · 갈고리 · 호미 · 손으로만 포획·채취할 수 있습니다.',
    textEn: 'Non-fishers may only catch with cast nets, scoop nets, handlines, single pots, tongs, gaffs, hoes or bare hands.',
    basisKo: '수산자원관리법 제18조', basisEn: 'Fishery Resources Management Act, Art. 18',
    whenKo: '어구 사용 시점', whenEn: 'When gear is used',
  },
  {
    id: 'LAW_ILLEGAL_CATCH',
    titleKo: '불법 포획물 소지 금지', titleEn: 'Possession of illegal catch',
    textKo: '불법으로 포획한 수산동물은 소지 · 유통 · 가공 · 보관 · 판매할 수 없습니다.',
    textEn: 'Illegally caught aquatic animals may not be possessed, distributed, processed, stored or sold.',
    basisKo: '수산자원관리법 제17조', basisEn: 'Fishery Resources Management Act, Art. 17',
    whenKo: '인벤토리 보관 · 조리 · 이동', whenEn: 'Inventory · cooking · transfer',
  },
  {
    id: 'LAW_SIZE_SEASON',
    titleKo: '금지체장 · 금어기', titleEn: 'Minimum size · closed season',
    textKo: '금지체장 미만 개체와 금어기 어종은 잡을 수 없습니다. 랜딩 순간 판정되며 보관 대신 방생만 됩니다.',
    textEn: 'Undersized fish and species in closed season may not be taken. Judged at landing — release is the only option.',
    basisKo: '수산자원관리법 시행령 · 고시', basisEn: 'Enforcement decree and notices',
    whenKo: '랜딩 직후', whenEn: 'Right after landing',
  },
  {
    id: 'LAW_VILLAGE_FISHERY',
    titleKo: '마을어업권 구역', titleEn: 'Village fishery rights',
    textKo: '마을어업권 구역 안의 정착성 수산동식물(전복 · 해삼 등)은 어촌계 허락 없이 채취할 수 없습니다.',
    textEn: 'Sedentary seafood (abalone, sea cucumber…) inside a village fishery may not be gathered without the co-op\'s permission.',
    basisKo: '수산업법 · 마을어업권', basisEn: 'Fisheries Act · village fishery rights',
    whenKo: '해루질 · 잠수 채집', whenEn: 'Tideland and dive gathering',
  },
];

export function getFisheryLawRule(id: FisheryLawRuleId): FisheryLawRule {
  return FISHERY_LAW_RULES.find((r) => r.id === id) as FisheryLawRule;
}

// ─────────────────────────────────────────────
// 기본 대안 사전 — 거부 Verdict 는 항상 1개 이상을 갖는다 (T7)
// ─────────────────────────────────────────────

const ALT = {
  eat: { ko: '자가소비(요리·회)', en: 'Eat it yourself (cook / sashimi)' },
  codex: { ko: '도감 등록 후 방생', en: 'Register in the codex, then release' },
  giveFree: { ko: '무상 납품(퀘스트·선물)', en: 'Deliver for free (quests / gifts)' },
  release: { ko: '즉시 방생', en: 'Release immediately' },
  register: { ko: '신고어업(맨손어업) 등록 후 통발·맨손 어획물 위판', en: 'Register as a reported fisher, then auction trap / hand-gathered catch' },
  gearList: { ko: '허용 어구 사용(외줄 · 외통발 · 집게 · 손)', en: 'Use permitted gear (handline · single pot · tongs · hands)' },
  askCoop: { ko: '어촌계 동행 · 어촌계원 자격', en: 'Go with the co-op · become a co-op member' },
  outside: { ko: '마을어업권 구역 밖에서 채집', en: 'Gather outside the village fishery' },
  buy: { ko: '상점에서 구매한 것은 되팔 수 있음', en: 'Store-bought seafood may be resold' },
} as const;

type AltKey = keyof typeof ALT;
function deny(ruleId: FisheryLawRuleId, reasonKo: string, reasonEn: string, alts: AltKey[]): LawVerdict {
  const list: AltKey[] = alts.length ? alts : ['release'];
  return {
    allowed: false, ruleId, reasonKo, reasonEn,
    alternatives: list.map((k) => ALT[k].ko),
    alternativesEn: list.map((k) => ALT[k].en),
  };
}

const OK: LawVerdict = { allowed: true, reasonKo: '', reasonEn: '', alternatives: [], alternativesEn: [] };

/** 비어업인 허용 어구 — 스펙 §14-5 `law.nonFisherGearWhitelist` (어구 id 규칙은 통발/채집 시스템의 id) */
export const NON_FISHER_GEAR_WHITELIST: readonly string[] = [
  'castnet', 'scoopnet', 'handline', 'trap_single', 'hand', 'hoe', 'gaff', 'tongs',
];

/** 마을어업권 대상 정착성 종 (해양생물 DB id) — `law.villageFisheryTargets` */
export const VILLAGE_FISHERY_TARGETS: readonly string[] = [
  'abalone', 'sea_cucumber', 'sea_urchin', 'mussel', 'turban_shell', 'octopus',
];

const isFisher = (licenses: readonly string[]): boolean =>
  licenses.includes('reported_fishery') || licenses.includes('coop_member') || licenses.includes('fishery_member');

// ─────────────────────────────────────────────
// 판정 함수 5종 (§3-3)
// ─────────────────────────────────────────────

/**
 * 판매 가능? — 결정 순서(첫 매치 반환):
 *  1. legalFlags 있음 → LAW_ILLEGAL_CATCH
 *  2. rod/handline → LAW_SELL_ROD (면허 무관)
 *  3. bought → 허용(되팔기)
 *  4. commercial → 신고어업 없으면 불가
 *  5. trap/net/gather → 비어업인은 자가소비만, 신고어업 보유 시 허용
 *  6. gift → 유상 판매 불가(자가소비·재선물) — 원칙 §1-2
 */
export function canSell(provenance: CatchProvenance, licenses: readonly string[]): LawVerdict {
  if (provenance.legalFlags.length > 0) {
    return deny('LAW_ILLEGAL_CATCH',
      '불법 포획물(금지체장·금어기·미허용 어구·마을어장)은 판매할 수 없습니다.',
      'Illegal catch (undersized, closed season, restricted gear, village fishery) cannot be sold.',
      ['release']);
  }
  const m = provenance.method;
  if (m === 'rod' || m === 'handline') {
    return deny('LAW_SELL_ROD',
      '낚시로 잡은 물고기는 팔 수 없습니다 — 어업인 자격이 있어도 마찬가지입니다.',
      'Rod-caught fish cannot be sold — even with a fisher registration.',
      ['eat', 'codex', 'giveFree', 'release']);
  }
  if (m === 'bought') return OK;
  if (m === 'commercial') {
    return isFisher(licenses) ? OK : deny('LAW_SELL_ROD',
      '어업인 자격(신고어업)이 없으면 조업 어획물을 위판할 수 없습니다.',
      'Without a fisher registration, commercial catch cannot be auctioned.',
      ['register', 'eat']);
  }
  if (m === 'trap' || m === 'net' || m === 'gather') {
    return isFisher(licenses) ? OK : deny('LAW_SELL_ROD',
      '비어업인의 통발·투망·맨손 어획물은 자가소비만 됩니다.',
      'Non-fishers may only consume trap, net or hand-gathered catch themselves.',
      ['eat', 'register', 'giveFree']);
  }
  // gift
  return deny('LAW_SELL_ROD',
    '무상으로 받은 어획물은 팔 수 없습니다.',
    'Seafood received as a gift cannot be sold.',
    ['eat', 'giveFree']);
}

/** 소지·보관·조리 가능? (LAW_ILLEGAL_CATCH) */
export function canKeep(provenance: CatchProvenance): LawVerdict {
  if (provenance.legalFlags.length === 0) return OK;
  const f = provenance.legalFlags[0];
  const why: Record<LegalFlag, [string, string]> = {
    undersize: ['금지체장 미만 개체는 보관할 수 없습니다.', 'Undersized fish cannot be kept.'],
    closed_season: ['금어기 어종은 보관할 수 없습니다.', 'Fish in closed season cannot be kept.'],
    restricted_gear: ['허용되지 않은 어구로 잡은 것은 보관할 수 없습니다.', 'Catch taken with restricted gear cannot be kept.'],
    village_fishery: ['마을어업권 구역에서 무단 채취한 것은 보관할 수 없습니다.', 'Seafood taken from a village fishery cannot be kept.'],
  };
  const [ko, en] = why[f];
  return deny(f === 'restricted_gear' ? 'LAW_NONFISHER_GEAR' : f === 'village_fishery' ? 'LAW_VILLAGE_FISHERY' : 'LAW_SIZE_SEASON',
    ko, en, ['release', 'codex']);
}

/** 어구 사용 가능? — 비어업인은 화이트리스트만 */
export function canUseGear(gearId: string, licenses: readonly string[], _regionId?: string): LawVerdict {
  if (isFisher(licenses)) return OK;
  if (NON_FISHER_GEAR_WHITELIST.includes(gearId)) return OK;
  return deny('LAW_NONFISHER_GEAR',
    '어업인 전용 어구입니다 — 비어업인은 사용할 수 없습니다.',
    'Fisher-only gear — non-fishers may not use it.',
    ['gearList', 'register']);
}

/** 채집 가능? — 마을어업권 구역 안 대상종은 어촌계원/어업인만 */
export function canGather(targetId: string, insideVillageFishery: boolean, licenses: readonly string[]): LawVerdict {
  if (!insideVillageFishery) return OK;
  if (!VILLAGE_FISHERY_TARGETS.includes(targetId)) return OK;
  if (licenses.includes('coop_member') || licenses.includes('fishery_member')) return OK;
  return deny('LAW_VILLAGE_FISHERY',
    '마을어업권 구역의 정착성 수산물은 어촌계 허락 없이 채취할 수 없습니다.',
    'Sedentary seafood inside a village fishery may not be gathered without the co-op.',
    ['outside', 'askCoop']);
}

/** 행위 → 필요한 면허 (없으면 null) */
export function requiredLicenseFor(action: 'auction' | 'commercialGear' | 'villageGather' | 'boatPilot' | 'anglingBoatBiz' | 'guideBiz'): string | null {
  switch (action) {
    case 'auction': return 'reported_fishery';
    case 'commercialGear': return 'reported_fishery';
    case 'villageGather': return 'coop_member';
    case 'boatPilot': return 'boat_operator';
    case 'anglingBoatBiz': return 'angling_boat_biz';
    case 'guideBiz': return 'marine_tourism';
    default: return null;
  }
}

/**
 * 랜딩 시점 legalFlags 확정 — 체장·금어기(+어구·어장은 호출부가 판단해 넘긴다).
 * 반환 배열은 이후 불변(§3-2).
 */
export function landingLegalFlags(input: {
  lengthCm: number; legalMinCm?: number; closedMonths?: readonly number[]; month: number;
  restrictedGear?: boolean; villageFishery?: boolean;
}): LegalFlag[] {
  const out: LegalFlag[] = [];
  if (input.legalMinCm && input.lengthCm < input.legalMinCm) out.push('undersize');
  if (input.closedMonths?.includes(input.month)) out.push('closed_season');
  if (input.restrictedGear) out.push('restricted_gear');
  if (input.villageFishery) out.push('village_fishery');
  return out;
}

/** 어획 출처 헬퍼 — 낚싯대 자가어획 기본형 */
export function rodProvenance(regionId: string, lengthCm: number, gameDay = 0, flags: LegalFlag[] = []): CatchProvenance {
  return { method: 'rod', caughtByPlayer: true, regionId, gameDayCaught: gameDay, lengthCm, legalFlags: flags };
}

export function provenanceOf(method: CatchMethod, regionId: string, lengthCm?: number, gameDay = 0): CatchProvenance {
  return { method, caughtByPlayer: method !== 'bought' && method !== 'gift', regionId, gameDayCaught: gameDay, lengthCm, legalFlags: [] };
}
