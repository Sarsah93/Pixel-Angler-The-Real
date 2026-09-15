/**
 * @file GearDurability.ts
 * @description 장비 고장·파손 정의 (136차) — 로드/릴/찌/루어
 *
 * ## 설계 원칙
 * 1. **고장은 사고지 세금이 아니다.** 확률은 저가 장비 기준으로 잡고(사용자 지시),
 *    좋은 장비일수록 `qualityMult`로 줄어든다. 같은 값을 쓰는 캐스팅 100회에서
 *    사이소 로드는 초릿대가 한 번쯤 나가고, 고급 로드는 거의 나가지 않는다.
 * 2. **내구도는 "못 쓰게 되는 시계"가 아니라 "고장이 잦아지는 계수"다.**
 *    사용자 제시값(사이소 = 던지기 200회)을 `rodMaxCasts`의 기준으로 삼되, 0이 되어도
 *    즉시 사용불가가 되지는 않는다 — 대신 `wearFactor`가 1 → 3.5로 올라 고장이 잦아진다.
 *    (즉시 사용불가는 생활 경영 RPG의 호흡을 끊는다. 고장 형태 자체가 페널티다.)
 * 3. **수리는 언제나 새로 사는 것보다 싸다.** 수리비 = `basePrice × feeFrac`(하한 `minFee`),
 *    500원 단위 반올림. 절지 파단·찌 파손만 수리 불가(폐기).
 *
 * 순수 데이터 + 순수 함수. Phaser/DOM 금지(§3).
 */

/** 고장 종류 */
export type GearFaultId =
  | 'rod_tip'          // 초릿대 부서짐 — 사용불가, 본드칠(자가) 또는 수리점
  | 'rod_section'      // 절지 파단 — 사용불가, 수리 불가(폐기)
  | 'reel_tangle'      // 스풀 원줄 꼬임 — 사용불가, 원줄 카트리지 소모(자가) 또는 수리점
  | 'reel_bail'        // 베일 휨·늘어남 — 사용 가능하나 줄이 샌다, 수리점
  | 'reel_handle'      // 핸들 부러짐 — 사용불가, 수리점
  | 'float_buoyancy'   // 찌 부력 변성 — 사용 가능, 입질 확률 감소, 수리 불가
  | 'float_cracked'    // 찌 깨짐 — 사용불가, 수리 불가(폐기)
  | 'lure_damaged';    // 루어 부분 파손 — 사용 가능, 입질 확률 감소, 수리점(훅·아이 교체)

export type GearRepairKind = 'shop' | 'self_or_shop' | 'none';

export interface GearFaultDef {
  id: GearFaultId;
  labelKo: string;
  labelEn: string;
  /** 무엇이 일어났는가 (상세보기 본문) */
  descKo: string;
  /** 어떻게 고치는가 (상세보기 안내) */
  fixKo: string;
  /** 고장 상태에서도 장착·사용이 되는가 */
  usable: boolean;
  repair: GearRepairKind;
  /** 수리비 = max(minFee, basePrice × feeFrac) */
  feeFrac: number;
  minFee: number;
  /** 자가수리 성공률 (repair === 'self_or_shop') */
  selfSuccess?: number;
  /**
   * 자가수리에 소모하는 아이템 subCategory (없으면 맨손).
   * 원줄 꼬임은 스풀을 통째로 새로 감으므로 '원줄 스풀' 하나를 먹는다.
   */
  selfConsumes?: string;
  /** 자가수리 성공 시 남는 흠집 — 성능 배수(1 = 완전 복구) */
  selfQuality?: number;
  /** 사용 가능한 고장의 입질 확률 배수 */
  biteMult?: number;
}

export const GEAR_FAULTS: Record<GearFaultId, GearFaultDef> = {
  rod_tip: {
    id: 'rod_tip', labelKo: '초릿대 부서짐', labelEn: 'Broken rod tip',
    descKo: '던지고 감는 과정에서 초릿대 끝이 부러졌다. 가이드가 빠져 원줄이 걸린다.',
    fixKo: '끝을 본드칠해 임시로 붙이거나(자가 · 성공률 65% · 비거리 5% 손실) 수리점에 맡긴다.',
    usable: false, repair: 'self_or_shop', feeFrac: 0.15, minFee: 3000,
    selfSuccess: 0.65, selfQuality: 0.95,
  },
  rod_section: {
    id: 'rod_section', labelKo: '절지 파단', labelEn: 'Snapped rod section',
    descKo: '버틸 수 있는 한계를 넘는 힘이 걸려 중간단이 부러졌다. 카본이 갈라져 되살릴 수 없다.',
    fixKo: '수리할 수 없다. 버리고 새 대를 마련해야 한다.',
    usable: false, repair: 'none', feeFrac: 0, minFee: 0,
  },
  reel_tangle: {
    id: 'reel_tangle', labelKo: '스풀 원줄 꼬임', labelEn: 'Spool backlash',
    descKo: '스풀에서 줄이 뭉텅이로 튀어나와 엉켰다. 이대로는 캐스팅도 회수도 되지 않는다.',
    fixKo: '원줄 스풀 하나를 풀어 새로 감거나(자가) 수리점에 맡긴다.',
    usable: false, repair: 'self_or_shop', feeFrac: 0.08, minFee: 2000,
    selfSuccess: 1, selfConsumes: '원줄 스풀',
  },
  reel_bail: {
    id: 'reel_bail', labelKo: '베일 휨', labelEn: 'Bent bail arm',
    descKo: '베일 암이 휘어 스풀을 제대로 잠그지 못한다. 닫아도 줄이 조금씩 밀려 나간다.',
    fixKo: '수리점에서 베일 암을 교정한다.',
    usable: true, repair: 'shop', feeFrac: 0.20, minFee: 5000,
  },
  reel_handle: {
    id: 'reel_handle', labelKo: '핸들 부러짐', labelEn: 'Broken handle',
    descKo: '핸들 축이 부러져 감을 수가 없다.',
    fixKo: '수리점에서 핸들을 교체한다.',
    usable: false, repair: 'shop', feeFrac: 0.30, minFee: 8000,
  },
  float_buoyancy: {
    id: 'float_buoyancy', labelKo: '부력 변성', labelEn: 'Buoyancy drift',
    descKo: '오래 물을 먹어 표면이 무거워졌다. 잔존 부력이 흔들려 예신이 뭉개진다.',
    fixKo: '되돌릴 수 없다. 정밀한 조과가 필요하면 새 찌를 쓴다.',
    usable: true, repair: 'none', feeFrac: 0, minFee: 0, biteMult: 0.78,
  },
  float_cracked: {
    id: 'float_cracked', labelKo: '깨져 부서짐', labelEn: 'Cracked float',
    descKo: '캐스팅이 뭍이나 바위를 때리면서 몸통이 깨졌다. 물이 들어차 서지 않는다.',
    fixKo: '수리할 수 없다. 버리고 여유분으로 교체한다.',
    usable: false, repair: 'none', feeFrac: 0, minFee: 0,
  },
  lure_damaged: {
    id: 'lure_damaged', labelKo: '부분 파손', labelEn: 'Damaged lure',
    descKo: '바위에 찍히고 이빨에 씹혀 아이가 휘고 훅이 무뎌졌다. 액션이 흐트러진다.',
    fixKo: '수리점에서 훅과 스플릿링을 갈아 끼운다.',
    usable: true, repair: 'shop', feeFrac: 0.25, minFee: 2000, biteMult: 0.72,
  },
};

/**
 * 기본 발생 확률 — **저가 장비 기준**(사용자 지시).
 * `cast` 계열은 던지고 감는 **1회당**, 나머지는 해당 사건당 확률이다.
 */
export const GEAR_FAULT_BASE: Record<GearFaultId, number> = {
  rod_tip: 0.015,        // 캐스팅 1회당 1.5%
  rod_section: 0.0005,   // 캐스팅 1회당 0.05% (과부하 시엔 별도 15%)
  reel_tangle: 0.015,
  reel_bail: 0.0005,
  reel_handle: 0.0001,
  float_buoyancy: 0.005, // 300회 초과 시점부터 캐스팅 1회당 0.5%
  float_cracked: 0.5,    // 뭍·바위 충돌 1회당 50%
  lure_damaged: 0.35,    // 밑걸림 회수·충돌 1회당 35%
};

/** 과부하(밑걸림 강제 회수·대물) 시 절지 파단 확률 — 로드가 라인보다 약할 때만 */
export const ROD_OVERLOAD_SNAP = 0.15;

/** 종류별 저가 기준가 (원) — 품질 보정의 분모 */
export const GEAR_REF_PRICE = {
  rod: 12000,     // 사이소 민물대 2.4m
  reel: 8000,     // 사이소 소형 스피닝릴
  float: 3000,
  lure: 8000,
} as const;

/** 찌 부력 변성 판정이 시작되는 누적 캐스팅 횟수 (사용자 지시) */
export const FLOAT_BUOYANCY_AFTER_CASTS = 300;

/**
 * 품질 보정 — 비쌀수록 덜 고장난다. 지수 −0.35, 하한 0.25.
 *  사이소 로드(12,000) = 1.00 · 중급(45,000) = 0.62 · 시드 로드(185,000) = 0.38
 */
export function gearQualityMult(basePrice: number, refPrice: number): number {
  const r = Math.max(1, basePrice) / Math.max(1, refPrice);
  return Math.min(1, Math.max(0.25, Math.pow(r, -0.35)));
}

/**
 * 로드 전체 내구도(던질 수 있는 횟수) — 사이소 200회 기준으로 가격에 비례해 보정.
 *  사이소(12,000) = 200 · 중급(45,000) = 359 · 시드 로드(185,000) = 684
 */
export function rodMaxCasts(basePrice: number): number {
  const r = Math.max(1, basePrice) / GEAR_REF_PRICE.rod;
  return Math.min(1200, Math.max(120, Math.round(200 * Math.pow(r, 0.45))));
}

/**
 * 마모 계수 — 새것 1.0, 내구도를 다 쓰면 3.5. 고장 확률에 곱한다.
 * **0이 되어도 사용은 된다** — 다만 초릿대가 자주 나간다.
 */
export function wearFactor(usedCasts: number, maxCasts: number): number {
  const spent = Math.min(1, Math.max(0, usedCasts / Math.max(1, maxCasts)));
  return 1 + 2.5 * spent;
}

/** 이번 사건의 고장 확률 */
export function gearFaultChance(args: {
  fault: GearFaultId;
  basePrice: number;
  refPrice: number;
  /** wearFactor 결과. 미지정 = 1 */
  wear?: number;
}): number {
  return Math.min(0.95,
    GEAR_FAULT_BASE[args.fault]
    * gearQualityMult(args.basePrice, args.refPrice)
    * (args.wear ?? 1));
}

/** 수리비 (원) — 500원 단위 반올림. 수리 불가면 0 */
export function gearRepairFee(fault: GearFaultId, basePrice: number): number {
  const def = GEAR_FAULTS[fault];
  if (def.repair === 'none') return 0;
  const raw = Math.max(def.minFee, basePrice * def.feeFrac);
  return Math.round(raw / 500) * 500;
}

/** 이 고장이 붙은 장비를 낄 수 있는가 */
export function gearUsable(fault?: GearFaultId | null): boolean {
  return !fault || GEAR_FAULTS[fault].usable;
}

/** 사용 가능한 고장의 입질 확률 배수 (없으면 1) */
export function gearBiteMult(fault?: GearFaultId | null): number {
  return fault ? (GEAR_FAULTS[fault].biteMult ?? 1) : 1;
}

// ═══════════════════════════════════════════════════════════════
// 밑걸림 대처 (136차 — 사용자 확률표)
// ═══════════════════════════════════════════════════════════════

/** 밑걸림 대처 결과 — 무엇이 살아남았는가 */
export type SnagOutcome =
  | 'all_saved'        // 채비 완전 회수
  | 'bait_lost'        // 미끼만 손실
  | 'hook_bait_lost'   // 바늘 + 미끼(+좁쌀봉돌) 손실
  | 'below_swivel'     // 도래 아래 전부 손실 (찌·수중찌·도래는 생존)
  | 'all_lost';        // 채비 전량 손실

export interface SnagOutcomeRow {
  outcome: SnagOutcome;
  /** 0~1 */
  p: number;
  labelKo: string;
}

/**
 * ① 로드 위로 끌어당기기 — 살살 들어 빼낸다.
 * 확률표는 사용자 지시값 그대로(10 / 10 / 30 / 50).
 */
export const SNAG_PULL_UP: SnagOutcomeRow[] = [
  { outcome: 'all_saved', p: 0.10, labelKo: '채비가 통째로 빠져나왔다' },
  { outcome: 'bait_lost', p: 0.10, labelKo: '미끼만 떨어져 나갔다' },
  { outcome: 'hook_bait_lost', p: 0.30, labelKo: '바늘과 미끼를 잃었다' },
  { outcome: 'all_lost', p: 0.50, labelKo: '채비가 통째로 뜯겼다 — 처음부터 다시' },
];

/**
 * ② 로드 뒤로 당겨 끊기 — 100% 채비 손실. 도래 위가 살아남느냐만 반반.
 */
export const SNAG_BREAK_OFF: SnagOutcomeRow[] = [
  { outcome: 'below_swivel', p: 0.50, labelKo: '도래 아래가 터졌다 — 찌·수중찌·도래는 남았다' },
  { outcome: 'all_lost', p: 0.50, labelKo: '원줄이 터졌다 — 처음부터 다시' },
];

/** 확률표에서 하나를 뽑는다 (rnd = 0~1 난수 주입 — 테스트 가능) */
export function rollSnagOutcome(table: SnagOutcomeRow[], rnd: number): SnagOutcomeRow {
  let acc = 0;
  for (const row of table) {
    acc += row.p;
    if (rnd < acc) return row;
  }
  return table[table.length - 1];
}
