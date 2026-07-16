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

import { ExternalDataStore } from './ExternalDataStore.js';

/** 인벤토리 카테고리 탭 */
export type InvCategory = 'gear' | 'consumable' | 'food' | 'tackle' | 'etc';

/** 신선도 상태 (표시용) */
export type InvCondition = 'live' | 'fresh' | 'chilled' | 'frozen' | 'spoiled';

/** 카테고리별 소켓 수 (5x5) */
export const GRID_CAPACITY = 25;

export const CATEGORY_LABEL: Record<InvCategory, string> = {
  gear: '장비',
  consumable: '소모품',
  food: '음식',
  tackle: '낚시용품',
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
}

/** 상점 카탈로그/구매용 아이템 템플릿 (slot/qty 없이 정의) */
export type InvItemTemplate = Omit<InvItem, 'slot' | 'qty'>;

/** 채비(리그) 조립 단계 키 */
export type RigStepKey =
  | 'mainLine' | 'floatStop' | 'float' | 'swivel' | 'leader' | 'sinker' | 'hookBait';

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
    { id: 'inv_chum',     name: '집어제 (크릴 배합)',       icon: '🧂', category: 'consumable', subCategory: '집어제/밑밥',   qty: 5, basePrice: 6000,  equippable: false },
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
    { id: 'inv_float08',  name: '구멍찌 0.8호',             icon: '🟠', category: 'tackle', subCategory: '채비 부속', qty: 3,  basePrice: 8000,  equippable: false },
    { id: 'inv_subfloat', name: '수중찌 -0.8호',            icon: '🟠', category: 'tackle', subCategory: '채비 부속', qty: 3,  basePrice: 8000,  equippable: false },
    { id: 'inv_sinkerG2', name: '좁쌀봉돌 G2',              icon: '⚙️', category: 'tackle', subCategory: '채비 부속', qty: 20, basePrice: 2000,  equippable: false },
    { id: 'inv_swivel',   name: '맨도래',                   icon: '⚙️', category: 'tackle', subCategory: '채비 부속', qty: 10, basePrice: 2500,  equippable: false },
    { id: 'inv_cushion',  name: '쿠션고무 / 반달구슬',      icon: '⚙️', category: 'tackle', subCategory: '채비 부속', qty: 12, basePrice: 2000,  equippable: false },

    // ── 기타 ──
    { id: 'inv_junk',     name: '낡은 릴 부품',             icon: '📦', category: 'etc', subCategory: '잡동사니', qty: 1, basePrice: 500, equippable: false },
  ];

  // 카테고리별 소켓 순차 배정
  const counters: Record<InvCategory, number> = { gear: 0, consumable: 0, food: 0, tackle: 0, etc: 0 };
  return defs.map((d) => ({ ...d, slot: counters[d.category]++ }));
}

class InventoryStoreManager {
  private _items: InvItem[] = createSeedItems();

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
    hookBait: 'inv_krill',
  };

  /** 면사매듭 수심 한계 Z_limit (m) — 채비가 도달할 최대 수심 */
  rigDepthLimitM = 5;

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
   * 상점 매입가 (기준가의 60%).
   * 어획물은 경락가 API 캐시(ExternalDataStore)의 당일 시세 배율(0.5~2.0)을 반영해
   * 직판장 매입가가 실시간 시세를 따라 움직인다.
   */
  getSellPrice(item: InvItem): number {
    let marketFactor = 1;
    if (item.subCategory === '어획물') {
      const speciesId = item.id.startsWith('inv_catch_')
        ? item.id.slice('inv_catch_'.length)
        : item.id === 'inv_fish_1' ? 'black_seabream' : undefined;
      if (speciesId) marketFactor = ExternalDataStore.getMarketPriceFactor(speciesId);
    }
    return Math.max(100, Math.floor(item.basePrice * 0.6 * marketFactor));
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
  }

  /** 캐스팅에 필수인 채비 소켓 (감성돔 반유동 기준) */
  private static readonly REQUIRED_RIG: { key: RigStepKey; label: string }[] = [
    { key: 'mainLine', label: '원줄' },
    { key: 'float', label: '찌' },
    { key: 'leader', label: '목줄' },
    { key: 'hookBait', label: '바늘/미끼' },
  ];

  /** 비어 있는 필수 채비 부품 라벨 목록 (비어 있으면 캐스팅 불가) */
  getMissingRigParts(): string[] {
    return InventoryStoreManager.REQUIRED_RIG
      .filter((r) => !this._rig[r.key])
      .map((r) => r.label);
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
}

export const InventoryStore = new InventoryStoreManager();
