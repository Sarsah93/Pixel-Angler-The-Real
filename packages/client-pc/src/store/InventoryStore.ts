/**
 * @file InventoryStore.ts
 * @description 클라이언트 인벤토리 뷰 모델 스토어
 *
 * 인벤토리 패널(InventoryPanel), HUD 퀵슬롯(RegionHud), 상점(ShopPanel),
 * 활용 창(UtilizationPanel)이 공유하는 세션 단위 상태:
 *  - 카테고리(탭)별 5x5 소켓 그리드 — 아이템은 자기 카테고리 그리드의 slot(0~24)을 가짐
 *  - 퀵슬롯 8칸 배정
 *  - 채비(리그) 조립 상태 + 면사매듭 수심 한계(Z_limit)
 *
 * 아이템 아이콘은 임시로 "종류별 통일 아이콘" 정책을 따른다.
 * 데이터 원본(@tra/core UniversalItemDatabase)과의 정식 연동은 추후 작업.
 */

import {
  evaluateFishSellPrice, WEIGHT_SINKER_DB, WeightSinkerKind,
  SINKER_BASE_DRAG_CD, SINKER_BUNDLE_DRAG_CD, SINKER_HOLE_FEEDBACK_MULT,
  LURES_CATALOG_DB, JIGHEAD_WEIGHTS_G, getLureSpec, jigHeadWeightById,
  computeLureRigWeight, getLureCastCd,
} from '@tra/core';
import { ExternalDataStore } from './ExternalDataStore.js';

/** 인벤토리 카테고리 탭 */
export type InvCategory = 'gear' | 'consumable' | 'food' | 'tackle' | 'lure' | 'etc';

/** 신선도 상태 (표시용) */
export type InvCondition = 'live' | 'fresh' | 'chilled' | 'frozen' | 'spoiled';

/** 카테고리별 소켓 수 (5x5) */
export const GRID_CAPACITY = 25;

export const CATEGORY_LABEL: Record<InvCategory, string> = {
  gear: '장비',
  consumable: '소모품',
  food: '음식',
  tackle: '낚시용품',
  lure: '루어',
  etc: '기타',
};

export const CONDITION_LABEL: Record<InvCondition, string> = {
  live: '활어',
  fresh: '신선',
  chilled: '냉장',
  frozen: '냉동',
  spoiled: '상함',
};

export const CONDITION_COLOR: Record<InvCondition, string> = {
  live: '#c07cff',
  fresh: '#4af2a1',
  chilled: '#66b8ff',
  frozen: '#dfe9ff',
  spoiled: '#ff6b6b',
};

/** 손 도구 종류 (좌/우 손 착용 대상) */
export type HandTool = 'rod' | 'net';

/** 착용 손 (L = 왼손, R = 오른손) */
export type EquipHand = 'L' | 'R';

/** 인벤토리 아이템 인스턴스 (클라이언트 뷰 모델) */
export interface InvItem {
  id: string;
  name: string;
  /** 종류별 통일 아이콘 (임시 — 추후 도트 에셋 교체) */
  icon: string;
  /** 픽셀 이미지 아이콘 텍스처 키 (지정 시 이모지 대신 이미지 표시) */
  iconTexture?: string;
  category: InvCategory;
  /** 표시용 소분류 (미끼/라인/바늘/채비 부속, 장비 부위 등) */
  subCategory: string;
  /** 자기 카테고리 그리드 내 소켓 위치 (0~24) */
  slot: number;
  qty: number;
  /** 기준가 (원) — 상점 판매가 산정 기준 */
  basePrice: number;
  /** 신선도 (음식/미끼류만) */
  condition?: InvCondition;
  /** 착용 가능 여부 (장비류) */
  equippable: boolean;
  equipped?: boolean;
  /** 손 도구 종류 (낚싯대/뜰채 — 좌/우 손 선택 착용) */
  tool?: HandTool;
  /** 착용 중인 손 (손 도구만) */
  equippedHand?: EquipHand;

  /**
   * 밑밥 재료 종류 (U 밑밥 품질 탭 드래그 앤 드랍 대상) —
   * powder = 빵가루/집어 파우더(들이붓기 연출) / krill = 냉동 크릴 블록(쪼개짐 연출) /
   * grain = 압맥/옥수수(낱알 낙하 연출)
   */
  chumKind?: 'powder' | 'krill' | 'grain';

  // ── 어획물 전용 (subCategory === '어획물') ──
  // 개체별 실측치를 보존해야 어판장 수매가(evaluateFishSellPrice)를 산정할 수 있다.
  // 이 값이 없으면 basePrice 폴백으로 계산된다.
  /** 어종 ID (오라클/FISH_DATABASE 표준 ID) */
  speciesId?: string;
  /** 개체 몸길이 (cm) */
  lengthCm?: number;
  /** 개체 무게 (g) */
  weightG?: number;

  // ── 원투 메인 싱커(무게추 봉돌) 전용 ──
  /** 봉돌 종류 (고리/구멍/묶음추) — 존재하면 무게추 봉돌 */
  sinkerKind?: WeightSinkerKind;
  /** 봉돌 자중 (g) — 총 무게/침강 속도 산정 */
  sinkerWeightG?: number;
  /** 봉돌 호수 */
  sinkerHo?: number;
}

/** 상점 카탈로그/구매용 아이템 템플릿 (slot/qty 없이 정의) */
export type InvItemTemplate = Omit<InvItem, 'slot' | 'qty'>;

/**
 * 채비(리그) 조립 단계 키.
 * 2026-07-16: `hookBait` 통합 소켓을 `hook`(바늘) / `bait`(미끼)로 분리.
 * 바늘 소켓에 루어(가짜미끼 — 미노우 등, 바늘 일체형)를 달면 미끼 소켓은 비활성화된다.
 */
export type RigStepKey =
  | 'mainLine' | 'floatStop' | 'float' | 'swivel' | 'leader' | 'sinker' | 'hook' | 'bait';

/** 미끼로 취급하는 소분류 (생미끼/냉동미끼/반죽미끼/선어미끼 등 '미끼' 포함 전부) */
export function isBaitItem(i: InvItem): boolean {
  return i.subCategory.includes('미끼') || i.subCategory === '생미끼';
}

/** 바늘 소켓에 들어가는 아이템 — 단품 바늘 또는 루어(바늘 일체형) */
export function isHookItem(i: InvItem): boolean {
  return i.subCategory === '바늘/훅' || i.subCategory === '루어';
}

/** 루어(가짜미끼) 여부 — 바늘 일체형이라 미끼가 필요 없다 */
export function isLureItem(i: InvItem): boolean {
  return i.subCategory === '루어';
}

/** 원투 메인 싱커(무게추 봉돌) 여부 — sinkerKind 보유 */
export function isWeightSinker(i: InvItem): boolean {
  return i.sinkerKind !== undefined;
}

/** 좁쌀 봉돌(찌 채비 목줄용) 여부 */
export function isSplitShot(i: InvItem): boolean {
  return i.name.includes('좁쌀') && i.name.includes('봉돌');
}

/** 루어 카탈로그 아이템 여부 (LureSpec 보유) */
export function isLureCatalogItem(i: InvItem): boolean {
  return getLureSpec(i.id) !== undefined;
}

/** 지그헤드 아이템 여부 */
export function isJigHeadItem(i: InvItem): boolean {
  return i.subCategory === '지그헤드';
}

// ── 원투 편대/서브 채비 (2026-07-17) ──────────────────
/** 편대 채비 종류 */
export type SpreaderKind = 'NONE' | 'T_BAR' | 'CARD_RIG' | 'HAKGONGCHI' | 'GALCHI';

/** 카드 채비 하위 타입 (단수/바늘 간격) */
export type CardRigType = 'yeolgi' | 'godeungeo' | 'jeongaengi';

export const SPREADER_LABEL: Record<SpreaderKind, string> = {
  NONE: '단일 봉돌+바늘',
  T_BAR: 'T자 천평 편대',
  CARD_RIG: '카드 채비',
  HAKGONGCHI: '학꽁치 던질찌',
  GALCHI: '갈치 와이어',
};

export const CARD_RIG_INFO: Record<CardRigType, { label: string; hooks: number; gapM: number }> = {
  yeolgi:     { label: '열기 (7단)',   hooks: 7, gapM: 0.3 },
  godeungeo:  { label: '고등어 (5단)', hooks: 5, gapM: 0.5 },
  jeongaengi: { label: '전갱이 (3단)', hooks: 3, gapM: 0.5 },
};

/** 편대/서브 채비 상태 — 카드 채비는 단수별 미끼를 개별 장착 */
export interface SpreaderState {
  kind: SpreaderKind;
  cardType?: CardRigType;
  /** 카드 채비 단수별 미끼 아이템 id (MultiHookContainer) */
  hookBaits: (string | null)[];
}

/** 낚싯대 허용 채비 중량 (g) — 찌낚시 경량 채비 기준. 초과 시 과부하 가이드 */
export const ROD_CAPACITY_G = 28;
/** 원투(던질대) 허용 채비 중량 (g) — 무게추 봉돌(60~113g)을 감당 */
export const SURF_ROD_CAPACITY_G = 150;

/** 시작 시 지급되는 목업 아이템 세트 (slot은 카테고리별 순차 배정) */
function createSeedItems(): InvItem[] {
  const defs: Omit<InvItem, 'slot'>[] = [
    // ── 장비 (손/의류) ──
    { id: 'inv_rod',      name: '용상 파조기 1.5호 5.3m',   icon: '🎣', category: 'gear', subCategory: '손도구', qty: 1, basePrice: 185000, equippable: true, equipped: true, tool: 'rod', equippedHand: 'R' },
    { id: 'inv_reel',     name: '다이오 2500L 스피닝릴',    icon: '⚙️', category: 'gear', subCategory: '릴',     qty: 1, basePrice: 95000,  equippable: true, equipped: true },
    { id: 'inv_net',      name: '뜰채 5m',                  icon: '🥅', category: 'gear', subCategory: '손도구', qty: 1, basePrice: 30000, equippable: true, tool: 'net' },
    { id: 'inv_cap',      name: '낚시 모자',                icon: '🧢', category: 'gear', subCategory: '모자',   qty: 1, basePrice: 12000, equippable: true },
    { id: 'inv_glasses',  name: '편광 안경',                icon: '🕶️', category: 'gear', subCategory: '안경',   qty: 1, basePrice: 45000, equippable: true },
    { id: 'inv_top',      name: '낚시 조끼',                icon: '👕', category: 'gear', subCategory: '상의',   qty: 1, basePrice: 25000, equippable: true },
    { id: 'inv_gloves',   name: '기모 장갑',                icon: '🧤', category: 'gear', subCategory: '장갑',   qty: 1, basePrice: 8000,  equippable: true },
    { id: 'inv_watch',    name: '조과 기록 시계',           icon: '⌚', category: 'gear', subCategory: '시계',   qty: 1, basePrice: 60000, equippable: true },
    { id: 'inv_pants',    name: '방수 바지',                icon: '👖', category: 'gear', subCategory: '하의',   qty: 1, basePrice: 22000, equippable: true },
    { id: 'inv_shoes',    name: '갯바위 단화',              icon: '👟', category: 'gear', subCategory: '신발',   qty: 1, basePrice: 30000, equippable: true },

    // ── 소모품 ──
    { id: 'inv_chum',     name: '집어제 (크릴 배합)',       icon: '🧂', category: 'consumable', subCategory: '집어제/밑밥',   qty: 5, basePrice: 6000,  equippable: false, chumKind: 'powder' },
    // 밑밥 배합 재료 (U 밑밥 품질 탭 — 드래그 앤 드랍 투입)
    { id: 'inv_chum_powder',       name: '감성돔 집어 파우더',   icon: '🧂', category: 'consumable', subCategory: '집어제/밑밥', qty: 3, basePrice: 8000,  equippable: false, chumKind: 'powder' },
    { id: 'inv_chum_powder_heavy', name: '고비중 파우더',        icon: '🧂', category: 'consumable', subCategory: '집어제/밑밥', qty: 2, basePrice: 11000, equippable: false, chumKind: 'powder' },
    { id: 'inv_chum_bread',        name: '빵가루 (밑밥용)',      icon: '🍞', category: 'consumable', subCategory: '집어제/밑밥', qty: 3, basePrice: 4000,  equippable: false, chumKind: 'powder' },
    { id: 'inv_chum_krill_block',  name: '냉동 크릴 (밑밥 블록)', icon: '🦐', category: 'consumable', subCategory: '집어제/밑밥', qty: 4, basePrice: 7000,  equippable: false, condition: 'frozen', chumKind: 'krill' },
    { id: 'inv_chum_apmac',        name: '압맥 (눌린 보리)',     icon: '🌾', category: 'consumable', subCategory: '집어제/밑밥', qty: 3, basePrice: 5000,  equippable: false, chumKind: 'grain' },
    { id: 'inv_chum_corn',         name: '옥수수 캔 (밑밥용)',   icon: '🌽', category: 'consumable', subCategory: '집어제/밑밥', qty: 2, basePrice: 4500,  equippable: false, chumKind: 'grain' },
    { id: 'inv_spray',    name: '기능성 스프레이',          icon: '🧴', category: 'consumable', subCategory: '스프레이/오일', qty: 2, basePrice: 9000,  equippable: false },
    { id: 'inv_oil',      name: '릴 오일',                  icon: '🧴', category: 'consumable', subCategory: '스프레이/오일', qty: 1, basePrice: 7000,  equippable: false },
    { id: 'inv_carekit',  name: '도구 케어 세트',           icon: '🧰', category: 'consumable', subCategory: '장비 수리',     qty: 1, basePrice: 15000, equippable: false },
    { id: 'inv_bandage',  name: '상처 연고',                icon: '💊', category: 'consumable', subCategory: '의약품',        qty: 3, basePrice: 3000,  equippable: false },
    { id: 'inv_potion',   name: 'HP 회복 드링크',           icon: '💊', category: 'consumable', subCategory: '의약품',        qty: 2, basePrice: 5000,  equippable: false },
    { id: 'inv_seasick',  name: '멀미약',                   icon: '💊', category: 'consumable', subCategory: '의약품',        qty: 2, basePrice: 4000,  equippable: false },
    { id: 'inv_mosquito', name: '모기향',                   icon: '🌀', category: 'consumable', subCategory: '야간 대비',     qty: 4, basePrice: 2500,  equippable: false },

    // ── 음식 ──
    { id: 'inv_can',      name: '참치 통조림',              icon: '🥫', category: 'food', subCategory: '가공품', qty: 3, basePrice: 2000,  equippable: false },
    { id: 'inv_fish_1',   name: '감성돔 (38cm)',            icon: '🐟', iconTexture: 'fish_black_sea_bream', category: 'food', subCategory: '어획물', qty: 1, basePrice: 15000, condition: 'fresh', equippable: false },
    { id: 'inv_veges',    name: '식자재 묶음 (대파/양파)',  icon: '🥬', category: 'food', subCategory: '식자재', qty: 2, basePrice: 5000,  condition: 'fresh', equippable: false },

    // ── 낚시용품 ──
    { id: 'inv_worm',     name: '지렁이',                   icon: '🪱', category: 'tackle', subCategory: '생미끼',    qty: 20, basePrice: 5000,  condition: 'live',    equippable: false },
    { id: 'inv_ragworm',  name: '갯지렁이',                 icon: '🪱', category: 'tackle', subCategory: '생미끼',    qty: 15, basePrice: 6000,  condition: 'live',    equippable: false },
    { id: 'inv_honmushi', name: '혼무시',                   icon: '🪱', category: 'tackle', subCategory: '생미끼',    qty: 8,  basePrice: 12000, condition: 'live',    equippable: false },
    { id: 'inv_krill',    name: '크릴 (냉동)',              icon: '🦐', category: 'tackle', subCategory: '냉동미끼',  qty: 30, basePrice: 4000,  condition: 'frozen',  equippable: false },
    { id: 'inv_breadbait', name: '빵가루 경단',             icon: '🍞', category: 'tackle', subCategory: '반죽미끼',  qty: 15, basePrice: 3000,  equippable: false },
    { id: 'inv_fishcut',  name: '생선 조각 미끼',           icon: '🦐', category: 'tackle', subCategory: '선어미끼',  qty: 6,  basePrice: 3000,  condition: 'chilled', equippable: false },
    { id: 'inv_pe1',      name: 'PE 합사 원줄 1호',         icon: '🧵', category: 'tackle', subCategory: '원줄 스풀', qty: 1,  basePrice: 18000, equippable: false },
    { id: 'inv_carbon15', name: '카본 목줄 1.5호',          icon: '🧵', category: 'tackle', subCategory: '목줄 스풀', qty: 1,  basePrice: 9000,  equippable: false },
    { id: 'inv_nylon2',   name: '나일론 목줄 2호',          icon: '🧵', category: 'tackle', subCategory: '목줄 스풀', qty: 1,  basePrice: 6000,  equippable: false },
    { id: 'inv_chinu3',   name: '감성돔 바늘 3호',          icon: '🪝', category: 'tackle', subCategory: '바늘/훅',   qty: 12, basePrice: 3000,  equippable: false },
    { id: 'inv_treble',   name: '루어용 트레블 훅',         icon: '🪝', category: 'tackle', subCategory: '바늘/훅',   qty: 6,  basePrice: 4000,  equippable: false },
    { id: 'inv_jighead',  name: '지그헤드 3g',              icon: '🪝', category: 'tackle', subCategory: '바늘/훅',   qty: 8,  basePrice: 3500,  equippable: false },
    // 루어 — 바늘 일체형 가짜미끼. 바늘 소켓에 장착하며 미끼 소켓이 비활성화된다.
    { id: 'inv_minnow',   name: '미노우 90F (플로팅)',      icon: '🐟', category: 'tackle', subCategory: '루어',      qty: 2,  basePrice: 14000, equippable: false },
    { id: 'inv_metaljig', name: '메탈지그 20g',             icon: '🐟', category: 'tackle', subCategory: '루어',      qty: 3,  basePrice: 8000,  equippable: false },
    { id: 'inv_float08',  name: '구멍찌 0.8호',             icon: '🟠', category: 'tackle', subCategory: '채비 부속', qty: 3,  basePrice: 8000,  equippable: false },
    { id: 'inv_subfloat', name: '수중찌 -0.8호',            icon: '🟠', category: 'tackle', subCategory: '채비 부속', qty: 3,  basePrice: 8000,  equippable: false },
    { id: 'inv_sinkerG2', name: '좁쌀봉돌 G2',              icon: '⚙️', category: 'tackle', subCategory: '채비 부속', qty: 20, basePrice: 2000,  equippable: false },
    { id: 'inv_swivel',   name: '맨도래',                   icon: '⚙️', category: 'tackle', subCategory: '채비 부속', qty: 10, basePrice: 2500,  equippable: false },
    { id: 'inv_cushion',  name: '쿠션고무 / 반달구슬',      icon: '⚙️', category: 'tackle', subCategory: '채비 부속', qty: 12, basePrice: 2000,  equippable: false },

    // ── 기타 ──
    { id: 'inv_junk',     name: '낡은 릴 부품',             icon: '📦', category: 'etc', subCategory: '잡동사니', qty: 1, basePrice: 500, equippable: false },
  ];

  // ── 원투 메인 싱커(무게추 봉돌) — SinkerDatabase(core)에서 생성 ──
  // 대표 호수 3종만 초기 지급 (나머지는 낚시점 구매). 종류별 물리 특성은 sinkerKind로 분기.
  const seedSinkerIds = new Set(['inv_sinker_ring_20', 'inv_sinker_hole_20', 'inv_sinker_bundle_25']);
  for (const s of WEIGHT_SINKER_DB) {
    if (!seedSinkerIds.has(s.id)) continue;
    defs.push({
      id: s.id, name: `${s.nameKo} (${s.weightG}g)`, icon: '🔩',
      category: 'tackle', subCategory: '채비 부속', qty: 3, basePrice: s.price, equippable: false,
      sinkerKind: s.kind, sinkerWeightG: s.weightG, sinkerHo: s.ho,
    });
  }

  // ── 루어 카탈로그 전종 + 지그헤드 (루어 카테고리 — 종류별 제원 수동 검증용) ──
  const lureIcon: Record<string, string> = {
    worm_grub: '🪱', soft_jerkbait: '🐟', plug_minnow: '🐟',
    spoon: '🥄', spinner: '🌀', egi: '🦑', metal_jig: '🔩', tairaba: '🔴',
  };
  for (const lure of LURES_CATALOG_DB) {
    defs.push({
      id: lure.id, name: `${lure.nameKo} (${lure.weightG}g)`, icon: lureIcon[lure.kind] ?? '🎣',
      category: 'lure', subCategory: '루어', qty: lure.family === 'soft' ? 8 : 3,
      basePrice: Math.round(400 + lure.weightG * 220), equippable: false,
    });
  }
  for (const w of JIGHEAD_WEIGHTS_G) {
    defs.push({
      id: `lure_jighead_${w}`, name: `지그헤드 ${w}g`, icon: '🪝',
      category: 'lure', subCategory: '지그헤드', qty: 10,
      basePrice: 1500 + w * 200, equippable: false,
    });
  }

  // 카테고리별 소켓 순차 배정
  const counters: Record<InvCategory, number> = { gear: 0, consumable: 0, food: 0, tackle: 0, lure: 0, etc: 0 };
  return defs.map((d) => ({ ...d, slot: counters[d.category]++ }));
}

class InventoryStoreManager {
  private _items: InvItem[] = createSeedItems();

  /** 어획물 인스턴스 고유 번호 시퀀스 (nextCatchSeq) */
  private _catchSeq = 0;

  /** 퀵슬롯 8칸 — 아이템 id 또는 null */
  private _quickslots: (string | null)[] = [
    'inv_rod', 'inv_krill', 'inv_chum', null, null, null, null, null,
  ];

  /**
   * 채비(리그) 조립 상태 — 단계 키 → 아이템 id.
   * dev 기본: 감성돔 반유동 채비 프리셋 (원줄 PE + 구멍찌 + 도래 + 카본 목줄 + 좁쌀봉돌 + 크릴)
   */
  private _rig: Record<RigStepKey, string | null> = {
    mainLine: 'inv_pe1',
    floatStop: null,
    float: 'inv_float08',
    swivel: 'inv_swivel',
    leader: 'inv_carbon15',
    sinker: 'inv_sinkerG2',
    hook: 'inv_chinu3',
    bait: 'inv_krill',
  };

  /** 면사매듭 수심 한계 Z_limit (m) — 채비가 도달할 최대 수심 */
  rigDepthLimitM = 5;

  /**
   * 면사매듭 존재 여부 — 제거하면 전유동 채비 (Z_limit 무한, 무한 침강).
   * U 채비하기의 면사매듭 소켓에서 토글한다.
   */
  hasFloatStop = true;

  /**
   * 원투 편대/서브 채비 (찌 소켓 비움 + 도래 장착 시 활성).
   * 기존 rig 모델과 병렬 — 역호환을 위해 rig 소켓 구조는 건드리지 않는다.
   */
  spreader: SpreaderState = { kind: 'NONE', hookBaits: [] };

  /**
   * 채비 모드 — 'bait'(미끼/원투 등) / 'lure'(루어 낚시).
   * lure 모드에서는 찌·면사매듭·수중찌·봉돌 검증을 건너뛰고 루어 소켓만 필수 검사.
   * "소켓 해제"가 아니라 모드 분기로 검증 규칙 자체를 전환한다(상태 오염 방지).
   */
  rigMode: 'bait' | 'lure' = 'bait';
  /** 루어 소켓 (메인 1개) — lure 모드 전용 */
  private _lure: string | null = null;
  /** 지그헤드 소켓 — 소프트 베이트(requiresJigHead) 전용 */
  private _jigHead: string | null = null;

  get lureId(): string | null { return this._lure; }
  get jigHeadId(): string | null { return this._jigHead; }

  get items(): InvItem[] {
    return this._items;
  }

  get quickslots(): (string | null)[] {
    return this._quickslots;
  }

  get rig(): Record<RigStepKey, string | null> {
    return this._rig;
  }

  getByCategory(cat: InvCategory): InvItem[] {
    return this._items.filter((i) => i.category === cat);
  }

  find(id: string): InvItem | undefined {
    return this._items.find((i) => i.id === id);
  }

  itemAtSlot(cat: InvCategory, slot: number): InvItem | undefined {
    return this._items.find((i) => i.category === cat && i.slot === slot);
  }

  /**
   * 상점 매입가 (일반 품목은 기준가의 60%).
   *
   * 어획물은 `evaluateFishSellPrice`(core) 정식 엔진으로 산정한다:
   *   가격 = kg당 단가(어종별) × 중량 × 등급 배율 × 크기(길이) 배율
   * 실시간 경락가 캐시가 있으면 kg당 단가가 당일 시세로 대체되므로,
   * 여기서 별도의 시세 배율을 다시 곱하면 이중 적용이 된다 — 곱하지 말 것.
   *
   * 개체 실측치(speciesId/weightG)가 없는 레거시 어획물은 basePrice 폴백.
   */
  getSellPrice(item: InvItem): number {
    if (item.subCategory === '어획물') {
      const speciesId = item.speciesId ?? (item.id === 'inv_fish_1' ? 'black_seabream' : undefined);
      if (speciesId && item.weightG) {
        const cache = ExternalDataStore.getWholesaleCache(speciesId);
        return evaluateFishSellPrice(speciesId, item.lengthCm ?? 0, item.weightG, cache).finalPrice;
      }
      // 레거시 폴백 — 실측치가 없으면 기존 방식(기준가 × 시세 배율)
      const factor = speciesId ? ExternalDataStore.getMarketPriceFactor(speciesId) : 1;
      return Math.max(100, Math.floor(item.basePrice * 0.6 * factor));
    }
    return Math.max(100, Math.floor(item.basePrice * 0.6));
  }

  /**
   * 어획물 인스턴스 고유 번호 발급.
   * 같은 어종이라도 개체별 크기/무게가 다르므로 id를 분리해야 한다
   * (addItem은 동일 id를 수량 병합하며, 병합되면 실측치가 유실된다).
   */
  nextCatchSeq(): number {
    return ++this._catchSeq;
  }

  // ── 소켓 이동 (드래그 앤 드랍) ───────────────────────
  /** 같은 카테고리 그리드 내 소켓 이동 — 대상 소켓에 아이템이 있으면 서로 교환 */
  moveItem(cat: InvCategory, fromSlot: number, toSlot: number): void {
    if (fromSlot === toSlot || toSlot < 0 || toSlot >= GRID_CAPACITY) return;
    const src = this.itemAtSlot(cat, fromSlot);
    if (!src) return;
    const dst = this.itemAtSlot(cat, toSlot);
    src.slot = toSlot;
    if (dst) dst.slot = fromSlot;
  }

  private findFreeSlot(cat: InvCategory): number {
    for (let s = 0; s < GRID_CAPACITY; s++) {
      if (!this.itemAtSlot(cat, s)) return s;
    }
    return -1;
  }

  /** 카테고리 그리드의 빈 소켓 수 — 쿨러 어획 이송 가능량 판정용 */
  freeSlotCount(cat: InvCategory): number {
    return GRID_CAPACITY - this.getByCategory(cat).length;
  }

  // ── 획득/구매 ───────────────────────────────────────
  /** 아이템 추가 — 동일 id 존재 시 수량 병합, 없으면 빈 소켓에 배치. 실패 시 false */
  addItem(template: InvItemTemplate, qty: number): boolean {
    const existing = this.find(template.id);
    if (existing) {
      existing.qty += qty;
      return true;
    }
    const slot = this.findFreeSlot(template.category);
    if (slot < 0) return false;
    this._items.push({ ...template, slot, qty });
    return true;
  }

  /** 수량 차감 (판매/사용) — 0 이하가 되면 인스턴스 제거. 성공 여부 반환 */
  removeQty(itemId: string, qty: number): boolean {
    const item = this.find(itemId);
    if (!item || item.qty < qty) return false;
    item.qty -= qty;
    if (item.qty <= 0) this.deleteInstance(itemId);
    return true;
  }

  // ── 착용 ────────────────────────────────────────────
  /**
   * 착용/해제 토글 (손 도구 제외 일반 장비).
   * 동일 부위(subCategory) 기존 착용은 교체 해제.
   * 손 도구(tool 존재)는 equipHand()를 사용해야 하므로 false 반환.
   */
  toggleEquip(itemId: string): boolean {
    const item = this.find(itemId);
    if (!item || !item.equippable) return false;
    if (item.tool) {
      // 손 도구: 착용 중이면 해제만 허용, 착용은 equipHand()로
      if (item.equipped) {
        item.equipped = false;
        item.equippedHand = undefined;
        return true;
      }
      return false;
    }
    if (item.equipped) {
      item.equipped = false;
    } else {
      this._items.forEach((i) => {
        if (i.subCategory === item.subCategory && i.equipped) i.equipped = false;
      });
      item.equipped = true;
    }
    return true;
  }

  /**
   * 손 도구를 지정한 손에 착용.
   * 해당 손에 기존 도구가 있으면 교체(해제 후 착용), 없으면 그 자리에 착용.
   */
  equipHand(itemId: string, hand: EquipHand): boolean {
    const item = this.find(itemId);
    if (!item || !item.tool) return false;
    // 대상 손의 기존 도구 해제
    this._items.forEach((i) => {
      if (i.equipped && i.equippedHand === hand) {
        i.equipped = false;
        i.equippedHand = undefined;
      }
    });
    item.equipped = true;
    item.equippedHand = hand;
    return true;
  }

  /** 부위(subCategory)별 현재 착용 아이템 (손 도구 제외 일반 장비) */
  getEquipped(subCategory: string): InvItem | undefined {
    return this._items.find((i) => i.equipped && i.subCategory === subCategory);
  }

  /** 지정한 손에 착용된 도구 */
  getHandEquipped(hand: EquipHand): InvItem | undefined {
    return this._items.find((i) => i.equipped && i.equippedHand === hand);
  }

  /** 현재 손에 착용된 낚싯대 (없으면 undefined) — 캐스팅 가능 조건 */
  getEquippedRod(): InvItem | undefined {
    return this._items.find((i) => i.equipped && i.tool === 'rod');
  }

  // ── 제거 ────────────────────────────────────────────
  /**
   * 아이템 제거.
   * all=false → 1개 버리기 (수량 감소, 0이 되면 삭제)
   * all=true  → 완전제거 (인스턴스 삭제)
   */
  removeItem(itemId: string, all: boolean): void {
    const item = this.find(itemId);
    if (!item) return;
    if (!all && item.qty > 1) {
      item.qty -= 1;
      return;
    }
    this.deleteInstance(itemId);
  }

  private deleteInstance(itemId: string): void {
    const idx = this._items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    this._items.splice(idx, 1);
    // 퀵슬롯/리그 참조 정리
    for (let i = 0; i < this._quickslots.length; i++) {
      if (this._quickslots[i] === itemId) this._quickslots[i] = null;
    }
    (Object.keys(this._rig) as RigStepKey[]).forEach((k) => {
      if (this._rig[k] === itemId) this._rig[k] = null;
    });
    if (this._lure === itemId) this._lure = null;
    if (this._jigHead === itemId) this._jigHead = null;
  }

  // ── 퀵슬롯 ──────────────────────────────────────────
  /** 퀵슬롯 배정 (같은 아이템이 다른 슬롯에 있으면 해제 후 이동) */
  assignQuickslot(slotIndex: number, itemId: string): void {
    if (slotIndex < 0 || slotIndex >= 8) return;
    for (let i = 0; i < this._quickslots.length; i++) {
      if (this._quickslots[i] === itemId) this._quickslots[i] = null;
    }
    this._quickslots[slotIndex] = itemId;
  }

  clearQuickslot(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= 8) return;
    this._quickslots[slotIndex] = null;
  }

  // ── 채비(리그) ──────────────────────────────────────
  setRigPart(step: RigStepKey, itemId: string | null): void {
    this._rig[step] = itemId;
    // 바늘 소켓에 루어(바늘 일체형)를 달면 미끼 소켓은 의미가 없으므로 비운다
    // — 남겨두면 소모/손실 계산에 유령 미끼가 끼어든다.
    if (step === 'hook' && itemId && !this.hookNeedsBait()) {
      this._rig.bait = null;
    }
  }

  /** 캐스팅에 필수인 채비 소켓 (감성돔 반유동 기준) — 미끼는 조건부라 별도 처리 */
  private static readonly REQUIRED_RIG: { key: RigStepKey; label: string }[] = [
    { key: 'mainLine', label: '원줄' },
    { key: 'float', label: '찌' },
    { key: 'leader', label: '목줄' },
    { key: 'hook', label: '바늘' },
  ];

  /**
   * 현재 바늘 소켓 기준으로 미끼가 필요한지.
   * 루어 모드이거나 바늘 소켓에 루어(바늘 일체형 가짜미끼) 장착 시 false —
   * 소모성 미끼가 없으므로 입질/실패 시 미끼 소모·손실 로직이 건너뛰어진다.
   * 바늘이 비어 있으면 true(일반 바늘 전제).
   */
  hookNeedsBait(): boolean {
    if (this.rigMode === 'lure') return false;
    const id = this._rig.hook;
    if (!id) return true;
    const item = this.find(id);
    return !item || !isLureItem(item);
  }

  // ── 루어 채비 (rigMode === 'lure') ───────────────────
  setRigMode(mode: 'bait' | 'lure'): void {
    this.rigMode = mode;
  }

  /** 루어 소켓 설정 — 하드 베이트 장착 시 지그헤드 소켓은 자동 비움 */
  setLure(lureId: string | null): void {
    this._lure = lureId;
    const spec = lureId ? getLureSpec(lureId) : undefined;
    if (!spec?.requiresJigHead) this._jigHead = null;
  }

  setJigHead(id: string | null): void {
    this._jigHead = id;
  }

  /** 현재 장착 루어의 카탈로그 스펙 (없으면 undefined) */
  getEquippedLureSpec() {
    return this._lure ? getLureSpec(this._lure) : undefined;
  }

  /** 루어 채비 총중량 (g) — 소프트는 웜+지그헤드, 하드는 자중 (core 연산) */
  getLureRigWeightG(): number {
    const spec = this.getEquippedLureSpec();
    if (!spec) return 0;
    return computeLureRigWeight(spec, jigHeadWeightById(this._jigHead));
  }

  /** 비어 있는 필수 채비 부품 라벨 목록 (비어 있으면 캐스팅 불가) */
  getMissingRigParts(): string[] {
    // ── 루어 모드: 원줄+목줄+루어(+소프트면 지그헤드)만 필수 ──
    if (this.rigMode === 'lure') {
      const missing: string[] = [];
      if (!this._rig.mainLine) missing.push('원줄');
      if (!this._rig.leader) missing.push('목줄');
      const spec = this.getEquippedLureSpec();
      if (!spec) missing.push('루어');
      else if (spec.requiresJigHead && !this._jigHead) missing.push('지그헤드');
      return missing;
    }
    // 원투 낚시(찌 없이 도래 직결) 모드 — 단일 봉돌·편대 모두 포함.
    // 이 모드에서는 '찌'가 필수가 아니며, 대신 메인 싱커(무게추 봉돌)가 필수다.
    const surfRig = this.isSurfRigReady();
    const missing = InventoryStoreManager.REQUIRED_RIG
      .filter((r) => !(surfRig && r.key === 'float'))
      .filter((r) => !this._rig[r.key])
      .map((r) => r.label);
    // 원투 모드: 메인 싱커(무게추 봉돌)를 반드시 달아야 캐스팅 가능
    if (surfRig) {
      const sinker = this._rig.sinker ? this.find(this._rig.sinker) : undefined;
      if (!sinker || !isWeightSinker(sinker)) missing.push('무게추 봉돌');
    }
    // 미끼는 일반 바늘일 때만 필수 — 루어 장착 시 제외.
    // 카드 채비는 다단 미끼(hookBaits)가 1개 이상이면 통과.
    const cardBaited = this.spreader.kind === 'CARD_RIG' && this.spreader.hookBaits.some(Boolean);
    if (this.hookNeedsBait() && !this._rig.bait && !cardBaited) missing.push('미끼');
    return missing;
  }

  // ── 원투 편대/서브 채비 ───────────────────────────────
  /**
   * 원투(편대) 채비 조건 — 찌 소켓 비움 + 도래 장착.
   * 이때 U창에 편대 선택 슬롯이 병렬로 활성화된다.
   */
  isSurfRigReady(): boolean {
    return !this._rig.float && !!this._rig.swivel;
  }

  /** 현재 모드의 낚싯대 허용 채비 중량 (g) — 원투는 무거운 싱커 감당 */
  getRodCapacityG(): number {
    return this.isSurfRigReady() ? SURF_ROD_CAPACITY_G : ROD_CAPACITY_G;
  }

  /** 현재 봉돌 소켓의 무게추 봉돌 (없으면 undefined) */
  getEquippedWeightSinker(): InvItem | undefined {
    const id = this._rig.sinker;
    const item = id ? this.find(id) : undefined;
    return item && isWeightSinker(item) ? item : undefined;
  }

  /**
   * 채비 공기 저항 계수 C_d — 캐스팅 비거리 입력(airDragCd).
   * 루어 모드는 장착 루어의 dragCoefficient(메탈지그는 낮아 초장타),
   * 아니면 묶음추 봉돌 0.58 / 그 외 0.42.
   */
  getRigDragCd(): number {
    if (this.rigMode === 'lure') {
      const spec = this.getEquippedLureSpec();
      if (spec) return getLureCastCd(spec);
    }
    return this.getEquippedWeightSinker()?.sinkerKind === 'bundle'
      ? SINKER_BUNDLE_DRAG_CD : SINKER_BASE_DRAG_CD;
  }

  /** 예신 타이밍 피드백 배율 — 구멍 봉돌 장착 시 1.15 (이물감 감소 버프) */
  getBiteFeedbackMult(): number {
    return this.getEquippedWeightSinker()?.sinkerKind === 'hole'
      ? SINKER_HOLE_FEEDBACK_MULT : 1;
  }

  /** 편대 종류 설정 — 카드 채비면 단수만큼 미끼 슬롯 초기화 */
  setSpreader(kind: SpreaderKind, cardType?: CardRigType): void {
    if (kind === 'CARD_RIG') {
      const ct = cardType ?? 'jeongaengi';
      const prev = this.spreader.cardType === ct ? this.spreader.hookBaits : [];
      const n = CARD_RIG_INFO[ct].hooks;
      this.spreader = {
        kind, cardType: ct,
        hookBaits: Array.from({ length: n }, (_, i) => prev[i] ?? null),
      };
    } else {
      this.spreader = { kind, hookBaits: [] };
    }
  }

  /** 카드 채비 단수별 미끼 장착 */
  setSpreaderBait(hookIdx: number, itemId: string | null): void {
    if (hookIdx >= 0 && hookIdx < this.spreader.hookBaits.length) {
      this.spreader.hookBaits[hookIdx] = itemId;
    }
  }

  /**
   * 채비 총중량 (g) — 편대 자체 + 봉돌 + 다단 바늘/미끼 합산.
   * ROD_CAPACITY_G 초과 시 과부하 (U창 가이드 표시용).
   */
  getRigTotalWeightG(): number {
    let w = 0;
    (Object.keys(this._rig) as RigStepKey[]).forEach((k) => {
      const item = this._rig[k] ? this.find(this._rig[k]!) : undefined;
      if (!item) return;
      if (isWeightSinker(item)) w += item.sinkerWeightG ?? 0;
      else if (item.name.includes('봉돌')) w += 3.2;
      else if (item.name.includes('수중찌')) w += 8;
      else if (isLureItem(item)) { const m = item.name.match(/(\d+)\s*g/); w += m ? Number(m[1]) : 9; }
      else if (item.subCategory === '바늘/훅') w += 0.5;
      else if (isBaitItem(item)) w += 1.2;
    });
    const sp = this.spreader;
    if (sp.kind !== 'NONE') {
      w += sp.kind === 'T_BAR' ? 5 : sp.kind === 'CARD_RIG' ? 4 + sp.hookBaits.length * 0.5 : 6;
      w += sp.hookBaits.filter(Boolean).length * 1.2;
    }
    return w;
  }

  /**
   * 채비 소켓 아이템 1개 소모 (입질 시 미끼 소모 등).
   * 수량이 남으면 소켓 유지(자동 재장착), 소진되면 소켓 비움.
   */
  consumeRigItem(step: RigStepKey): void {
    const id = this._rig[step];
    if (!id) return;
    this.removeQty(id, 1);
    if (!this.find(id)) this._rig[step] = null;
  }

  /**
   * 채비 손실 처리 (미끼 털림/목줄 터짐/찌 터짐).
   * 각 소켓: 인벤토리 1개 소모 + 소켓 비움 (재장착은 U 채비하기에서 수동).
   * 잃은 부품 이름 목록 반환.
   */
  loseRigParts(steps: RigStepKey[]): string[] {
    const lost: string[] = [];
    for (const step of steps) {
      const id = this._rig[step];
      if (!id) continue;
      const item = this.find(id);
      if (item) {
        lost.push(item.name);
        this.removeQty(id, 1);
      }
      this._rig[step] = null;
    }
    return lost;
  }

  /**
   * 루어 채비 손실 — 목줄째 터지는(줄터짐/복어 절단) 경우에만 호출.
   * 루어(+소프트면 지그헤드) 1개씩 소모 + 소켓 비움. 잃은 이름 반환.
   * (입질 실패/챔질 실패/미끼 털림 등에는 호출하지 않는다 — 루어는 회수된다.)
   */
  loseLureRig(): string[] {
    const lost: string[] = [];
    for (const id of [this._lure, this._jigHead]) {
      if (!id) continue;
      const item = this.find(id);
      if (item) { lost.push(item.name); this.removeQty(id, 1); }
    }
    if (this._lure && !this.find(this._lure)) this._lure = null;
    if (this._jigHead && !this.find(this._jigHead)) this._jigHead = null;
    return lost;
  }
}

export const InventoryStore = new InventoryStoreManager();
