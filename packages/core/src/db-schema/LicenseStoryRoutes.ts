/**
 * @file LicenseStoryRoutes.ts
 * @description 자격(면허) 이야기 경로 — 퀘스트로 여는 **두 번째 취득 경로** (170차)
 *
 * 사용자 결정(2026-09-22): *"자격 부분만 스토리로 얻는 경로를 고민해보자. 다른 건 자유도를 해칠 것 같네."*
 * 레시피·조법은 대상이 아니다 — 그쪽을 퀘스트 뒤에 두면 "이야기를 안 하면 못 하는 것"이 생긴다.
 *
 * ## 설계 원칙 (네 가지 — 전부 이 파일과 `applyLicenseWaiver`가 강제한다)
 *
 * 1. **가산만** — 면허사무소에서 조건 채우고 돈 내는 기존 경로는 **한 줄도 막지 않는다.**
 *    이야기 경로는 "추천서를 받아 수수료·실적 요건을 면제받는 지름길"이지 유일 경로가 아니다.
 * 2. **영구 소멸 금지** — `once`(거절하면 사라짐)·`event`(시기 한정) 정책 퀘스트에는 달지 않는다.
 *    거절 한 번으로 자격이 영영 막히면 그건 가산이 아니라 함정이다. 검증기가 거부한다.
 * 3. **스포일러 금지(AGENTS §8-10 / R2)** — 면허 패널은 **그 퀘스트를 아는 뒤에만** 경로를 알린다.
 *    모르는 퀘스트 이름을 회색으로라도 띄우지 않는다(판정은 client가 `known` 인자로 넘긴다).
 * 4. **사다리 보존** — 면제 대상은 **수수료와 수치 요건**(출조 횟수·어획 누계·보유 재화·평판)뿐이다.
 *    **선행 면허(`license_held`·`prerequisites`)는 절대 면제하지 않는다** — 면제로 단계를 건너뛰면
 *    자격 체계 자체가 무너진다.
 */

import type { LicenseDef, LicenseType, UnlockRequirement } from '../types/License.js';
import { LICENSE_DATABASE } from '../types/License.js';

export interface LicenseStoryRoute {
  licenseType: LicenseType;
  /** 이 퀘스트를 끝내면 면제가 열린다 */
  questId: string;
  /** 발급 수수료 면제 */
  waiveCost: boolean;
  /** 수치 요건 면제 — 선행 면허(`license_held`)는 제외된다 */
  waiveRequirements: boolean;
  /** 누가 무엇을 써 줬는지 — 면허 패널에 그대로 나간다(내부 id·용어 금지) */
  noteKo: string;
  noteEn: string;
}

/**
 * 면허 20종 중 **8종**에 경로를 뒀다. 나머지는 붙일 이야기가 아직 없거나(농지·주택 부지·상업용 통발),
 * 이미 퀘스트가 직접 수여한다(신고어업·어촌계원·낚시어선업·해양관광업).
 */
export const LICENSE_STORY_ROUTES: LicenseStoryRoute[] = [
  {
    licenseType: 'trap_basic', questId: 'M2-06',
    waiveCost: true, waiveRequirements: true,
    noteKo: '암남공원에서 통발을 직접 엮어 봤다. 조합 사무실에 그 통발을 들고 가면 실적 대신 쳐 준다.',
    noteEn: 'You wove a trap yourself at Amnam Park — the office counts that instead of a catch record.',
  },
  {
    licenseType: 'port_restricted_access', questId: 'M2-07',
    waiveCost: true, waiveRequirements: true,
    noteKo: '통제선 앞에서 합법적으로 들어가는 길을 배웠다. 항만청이 그 절차를 밟은 사람을 먼저 받아 준다.',
    noteEn: 'You learned the lawful way past the control line; the port office fast-tracks anyone who took it.',
  },
  {
    licenseType: 'boat_angling', questId: 'M2-10',
    waiveCost: true, waiveRequirements: true,
    noteKo: '면허 학원 필기를 통과했다. 같은 학원에서 선상 낚시 면허는 수수료 없이 함께 내 준다.',
    noteEn: 'You passed the written exam; the same school files the boat-angling licence with no fee.',
  },
  {
    licenseType: 'surf_casting', questId: 'M4-08',
    waiveCost: true, waiveRequirements: true,
    noteKo: '만리포에서 원투를 제대로 배웠다. 제한구역 허가는 그 실습 기록으로 대신한다.',
    noteEn: 'You learned surf casting properly at Mallipo; the practice log stands in for the permit test.',
  },
  {
    licenseType: 'food_service', questId: 'N09-4',
    waiveCost: false, waiveRequirements: true,
    noteKo: '한봄이 식당 서류를 같이 넣어 준다. 실적은 면제되지만 수수료는 그대로다.',
    noteEn: 'Hanbom files the restaurant paperwork with you — records waived, the fee still stands.',
  },
  {
    licenseType: 'shore_hunting_advanced', questId: 'N01-5',
    waiveCost: true, waiveRequirements: true,
    noteKo: '해녀 모녀가 물질과 해루질의 경계를 가르쳐 줬다. 그 보증이면 심화 허가가 바로 난다.',
    noteEn: 'The haenyeo mother and daughter vouched for you; the advanced permit issues at once.',
  },
  {
    licenseType: 'fishery_member', questId: 'N03-4',
    waiveCost: true, waiveRequirements: true,
    noteKo: '강두철이 은퇴하며 조합원 명부 1번을 비워 뒀다. 그 자리는 돈으로 사는 자리가 아니다.',
    noteEn: 'Kang Ducheol left the first line of the roster empty when he retired — that seat is not bought.',
  },
  {
    licenseType: 'shore_hunting_basic', questId: 'M4-07',
    waiveCost: true, waiveRequirements: true,
    noteKo: '서해 갯벌을 걸어 봤다. 입문 허가는 그 하루면 충분하다는 게 면허사무소 말이다.',
    noteEn: 'You walked the Yellow Sea flats; the office says one such day is enough for the basic permit.',
  },
];

/** 면제해도 절대 사라지지 않는 요건 — 구조 게이트 */
const KEEP_ALWAYS = new Set<UnlockRequirement['type']>(['license_held', 'quest_completed']);

const BY_TYPE = new Map<LicenseType, LicenseStoryRoute>(LICENSE_STORY_ROUTES.map((r) => [r.licenseType, r]));

export function licenseStoryRoute(type: LicenseType): LicenseStoryRoute | undefined {
  return BY_TYPE.get(type);
}

/** 면제가 적용된 발급 조건. 경로가 없거나 퀘스트가 끝나지 않았으면 원본 그대로 돌려준다. */
export interface LicenseIssueTerms {
  costCoins: number;
  requirements: UnlockRequirement[];
  /** 면제가 실제로 적용됐는가 */
  waived: boolean;
}

/**
 * ⚖ 면제선은 **실적·재화**(출조 횟수·어획 누계·보유 재화·평판·특정 어종·방문지)까지다.
 * **구조 게이트**(선행 면허 `license_held` · 선행 퀘스트 `quest_completed`)는 어떤 경우에도 남는다(원칙 4) —
 * 그건 "많이 하면 채워지는 것"이 아니라 자격 체계와 이야기의 뼈대다.
 */
export function applyLicenseWaiver(def: LicenseDef, questDone: boolean): LicenseIssueTerms {
  const route = BY_TYPE.get(def.type);
  if (!route || !questDone) return { costCoins: def.costCoins, requirements: def.requirements, waived: false };
  return {
    costCoins: route.waiveCost ? 0 : def.costCoins,
    requirements: route.waiveRequirements
      ? def.requirements.filter((r) => KEEP_ALWAYS.has(r.type))
      : def.requirements,
    waived: true,
  };
}

/** 검증 — 원칙 1·2·4가 데이터에서 깨지지 않았는지 본다. `quests`는 STORY_QUESTS를 넘긴다(순환 import 회피). */
export function validateLicenseStoryRoutes(
  quests: { id: string; offerPolicy?: 'standard' | 'once' | 'event' }[],
): string[] {
  const issues: string[] = [];
  const byId = new Map(quests.map((q) => [q.id, q]));
  const seen = new Set<LicenseType>();
  for (const r of LICENSE_STORY_ROUTES) {
    const def = LICENSE_DATABASE.find((l) => l.type === r.licenseType);
    if (!def) { issues.push(`${r.licenseType}: 면허 DB에 없다`); continue; }
    if (seen.has(r.licenseType)) issues.push(`${r.licenseType}: 이야기 경로가 둘 이상이다`);
    seen.add(r.licenseType);
    const q = byId.get(r.questId);
    if (!q) { issues.push(`${r.licenseType}: 퀘스트 ${r.questId}가 없다`); continue; }
    const pol = q.offerPolicy ?? 'standard';
    if (pol !== 'standard') issues.push(`${r.licenseType}: ${r.questId}는 ${pol} 정책이라 영구 소멸 위험이 있다`);
    if (!r.waiveCost && !r.waiveRequirements) issues.push(`${r.licenseType}: 아무것도 면제하지 않는 경로`);
    // 원칙 4 — 면제 후에도 선행 면허 요건은 남아야 한다
    const after = applyLicenseWaiver(def, true).requirements;
    for (const k of KEEP_ALWAYS) {
      const before = def.requirements.filter((x) => x.type === k).length;
      if (after.filter((x) => x.type === k).length !== before) {
        issues.push(`${r.licenseType}: 구조 게이트(${k})가 면제됐다`);
      }
    }
  }
  return issues;
}
