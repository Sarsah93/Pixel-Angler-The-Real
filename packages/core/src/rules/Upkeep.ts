/**
 * @file Upkeep.ts
 * @description 정기 지출(유지비) 계약 — 인게임 일자 기준.
 *
 * 배경(171차 사용자 지적): 170차에 자격 취득 수수료를 이야기 경로로 면제하면서
 * "취득 이후로 수수료가 발생하지 않으면 밸런스가 안 맞는다"는 문제가 드러났다.
 * 실제 문제는 면제 폭(전체 면허 수수료 841,000원 중 181,000원)이 아니라,
 * **자격 비용이 애초에 1회성이었다**는 구조다 — 한 번 사면 영원히 유지된다.
 *
 * 그래서 지출을 **되풀이되는 것**으로 바꾼다:
 *   ① 자격 갱신료 — 주기마다 다시 낸다(미납 시 만료)
 *   ② 수협 조합비 — 정기 자동 납부, 대신 위판 수수료 할인
 *   ③ 어장 행사료 — 어촌계 어장에서 채취할 때 건당
 *   ④ 선박 유지비 — 보험·정기검사·계류비
 *   ⑤ 위생 점검 — 식당 영업의 정기 점검(불합격 시 재검사료)
 *
 * ⚖ **시계는 인게임 일자(StoryStore.day)** 다. 구현되어 있던 `HeldLicense.expiresAt`은
 *   실제 벽시계 365일이라 플레이 중 단 한 번도 만료될 수 없었다(사문). 침대 수면이
 *   하루를 넘기는 게임이므로, 주기는 전부 **게임 일수**로 센다.
 *
 * ⚖ **만료는 봉쇄가 아니라 압박**이다 — 자격이 사라지지 않고 '미갱신' 상태가 된다.
 *   위판 창구만 막히고 평판이 깎이며, 갱신하면 즉시 원상 복구된다. 진행 중 세이브가
 *   영영 막히는 상태를 만들지 않는다(149차 「닫히지 않는 목표는 만들지 않는다」와 같은 원칙).
 */

import type { LicenseType, LicenseDef } from '../types/License.js';
import { TUNING } from '../config/tuning.js';

// ─────────────────────────────────────────────
// 1. 종류
// ─────────────────────────────────────────────

export type UpkeepKind =
  | 'license_renewal'      // 자격 갱신료
  | 'coop_dues'            // 수협 조합비
  | 'vessel_upkeep'        // 선박 보험·정기검사·계류비
  | 'hygiene_inspection';  // 식품위생 정기 점검

/** 정기 지출 1건의 상태 (인게임 일자 기준) */
export interface UpkeepItem {
  kind: UpkeepKind;
  /** 고유 키 — 자격 갱신은 LicenseType, 나머지는 kind와 동일 */
  key: string;
  nameKo: string;
  nameEn: string;
  /** 이번 회차 납부액(원) */
  costKrw: number;
  /** 납부 주기(게임 일수) */
  intervalDays: number;
  /** 다음 납부 예정일(게임 일자) */
  dueDay: number;
  /** 남은 일수 — 음수면 연체 */
  daysLeft: number;
  /** 연체 일수 (0이면 정상) */
  overdueDays: number;
  /** 연체 중인가 */
  overdue: boolean;
}

/** 저장되는 납부 이력 — key → 마지막 납부한 게임 일자 */
export type UpkeepLedger = Record<string, number>;

// ─────────────────────────────────────────────
// 2. 자격 갱신
// ─────────────────────────────────────────────

/**
 * 자격 1건의 갱신료(원).
 * 취득가에 비례하되 **하한**을 둔다 — 무료 자격(기본 낚시)도 갱신료는 0으로 남는다.
 */
export function licenseRenewalFee(def: Pick<LicenseDef, 'costCoins' | 'requiresRenewal'>): number {
  if (!def.requiresRenewal) return 0;
  const u = TUNING.upkeep;
  const raw = Math.round(def.costCoins * u.renewFeeRate);
  if (def.costCoins <= 0) return 0;
  return Math.max(u.renewFeeFloorKrw, Math.round(raw / 500) * 500);
}

/** 자격 갱신 주기(게임 일수) — 정의에 값이 있으면 그것, 없으면 기본 주기 */
export function licenseRenewalDays(def: Pick<LicenseDef, 'renewalIntervalDays'>): number {
  const d = def.renewalIntervalDays;
  // ⚠ 구 데이터는 실제 벽시계 365일을 전제로 적혀 있다. 게임 일수로는 지나치게 길어
  //   (침대 수면 1회 = 1일) 한 회차도 못 겪는다 → 기본 주기로 정규화한다.
  if (!d || d >= 300) return TUNING.upkeep.renewIntervalDays;
  return d;
}

// ─────────────────────────────────────────────
// 3. 정기 지출 목록 산출
// ─────────────────────────────────────────────

export interface UpkeepContext {
  /** 현재 게임 일자 */
  day: number;
  /** 보유 자격 (만료 여부와 무관하게 '가지고 있는' 것) */
  heldLicenses: LicenseType[];
  /** 자격 정의 조회 */
  licenseDef: (t: LicenseType) => LicenseDef | undefined;
  /** 납부 이력 */
  ledger: UpkeepLedger;
}

/** 이 키의 다음 납부 예정일 — 이력이 없으면 "지금부터 한 주기 뒤" */
function dueDayOf(ledger: UpkeepLedger, key: string, day: number, interval: number): number {
  const last = ledger[key];
  if (last === undefined) return day + interval;
  return last + interval;
}

function mk(
  kind: UpkeepKind, key: string, nameKo: string, nameEn: string,
  costKrw: number, intervalDays: number, dueDay: number, day: number,
): UpkeepItem {
  const daysLeft = dueDay - day;
  return {
    kind, key, nameKo, nameEn, costKrw, intervalDays, dueDay, daysLeft,
    overdueDays: Math.max(0, -daysLeft),
    overdue: daysLeft < 0,
  };
}

/** 현재 걸려 있는 정기 지출 전체 (납부 예정일 순) */
export function listUpkeep(ctx: UpkeepContext): UpkeepItem[] {
  const u = TUNING.upkeep;
  const out: UpkeepItem[] = [];

  // ① 자격 갱신료
  for (const t of ctx.heldLicenses) {
    const def = ctx.licenseDef(t);
    if (!def?.requiresRenewal) continue;
    const fee = licenseRenewalFee(def);
    if (fee <= 0) continue;
    const iv = licenseRenewalDays(def);
    out.push(mk('license_renewal', t, `${def.nameKo} 갱신`, `${def.nameEn ?? def.nameKo} renewal`,
      fee, iv, dueDayOf(ctx.ledger, t, ctx.day, iv), ctx.day));
  }

  // ② 수협 조합비 — 조합원증 보유 시. 대신 위판 수수료를 깎아 준다(coopDuesFeeCut).
  if (ctx.heldLicenses.includes('fishery_member')) {
    out.push(mk('coop_dues', 'coop_dues', '수협 조합비', 'Cooperative dues',
      u.coopDuesKrw, u.coopDuesDays, dueDayOf(ctx.ledger, 'coop_dues', ctx.day, u.coopDuesDays), ctx.day));
  }

  // ③ 선박 유지비 — 낚시어선업 신고자(배를 굴리는 사람)
  if (ctx.heldLicenses.includes('angling_boat_biz')) {
    out.push(mk('vessel_upkeep', 'vessel_upkeep', '선박 보험 · 정기검사 · 계류비', 'Vessel insurance, inspection and mooring',
      u.vesselUpkeepKrw, u.vesselUpkeepDays, dueDayOf(ctx.ledger, 'vessel_upkeep', ctx.day, u.vesselUpkeepDays), ctx.day));
  }

  // ④ 위생 점검 — 식품위생법 영업허가 보유 시
  if (ctx.heldLicenses.includes('food_service')) {
    out.push(mk('hygiene_inspection', 'hygiene_inspection', '식품위생 정기 점검', 'Food hygiene inspection',
      u.hygieneFeeKrw, u.hygieneDays, dueDayOf(ctx.ledger, 'hygiene_inspection', ctx.day, u.hygieneDays), ctx.day));
  }

  out.sort((a, b) => a.dueDay - b.dueDay);
  return out;
}

/** 곧 다가오거나 이미 지난 것만 (알림용) */
export function upkeepAlerts(items: UpkeepItem[]): UpkeepItem[] {
  const warn = TUNING.upkeep.warnDays;
  return items.filter((i) => i.daysLeft <= warn);
}

// ─────────────────────────────────────────────
// 4. 미갱신(만료) 상태의 효과
// ─────────────────────────────────────────────

/** 미갱신 상태에서의 불이익 */
export interface UpkeepPenalty {
  /** 위판(경매 출품)을 막는가 */
  blockConsign: boolean;
  /** 하루마다 깎이는 항구 평판 */
  repPerDay: number;
  /** 단속 적발 확률 배수 (1 = 변화 없음) */
  enforceMult: number;
  /** 연체 중인 항목 이름 (안내문용) */
  overdueNames: string[];
}

export function upkeepPenalty(items: UpkeepItem[]): UpkeepPenalty {
  const u = TUNING.upkeep;
  const over = items.filter((i) => i.overdue);
  if (!over.length) {
    return { blockConsign: false, repPerDay: 0, enforceMult: 1, overdueNames: [] };
  }
  // 자격 갱신 연체만 위판을 막는다 — 조합비·유지비는 평판과 단속으로 벌한다.
  const licenseOverdue = over.some((i) => i.kind === 'license_renewal');
  return {
    blockConsign: licenseOverdue,
    // 여러 건이 한꺼번에 밀려도 하루 감점에는 상한을 둔다 — 한 번 무너진 사람이
    // 평판만으로 회복 불가능해지지 않게 한다.
    repPerDay: Math.min(u.overdueRepCap, u.overdueRepPerDay * over.length),
    enforceMult: licenseOverdue ? u.overdueEnforceMult : 1,
    overdueNames: over.map((i) => i.nameKo),
  };
}

// ─────────────────────────────────────────────
// 5. 어장 행사료 (건당 — 주기 지출이 아니다)
// ─────────────────────────────────────────────

/**
 * 어촌계 어장 안에서 채취할 때 내는 행사료(원).
 * ⚖ 조합원증이 있으면 계원 요율, 없으면 외부인 요율(비싸다).
 *   **막지 않는다** — 121차 조례는 어장 안 5종 채취를 적발·압수로 다루고, 여기는
 *   합법적으로 계원이 채취할 때의 비용이다.
 */
export function fisheryGroundFee(isCoopMember: boolean): number {
  const u = TUNING.upkeep;
  return isCoopMember ? u.groundFeeMemberKrw : u.groundFeeOutsiderKrw;
}

/** 조합비를 성실히 낸 사람의 위판 수수료 할인폭(비율 포인트) */
export function coopDuesFeeCut(hasPaidDues: boolean): number {
  return hasPaidDues ? TUNING.upkeep.coopDuesFeeCut : 0;
}
