/**
 * @file Backpack.ts
 * @description 인벤토리·가방 사다리 core 모델 (134차, STORY_SPEC_v3 §8-3)
 *
 * 가방을 **장비(등) 슬롯에 착용해야만** 탭당 용량이 늘어난다. `D` = dev 모드 탭당 슬롯 수
 * (`TUNING.inventory.devSlotsPerTab` — 현행 5×5 = 25 를 그대로 상수화).
 *
 * ⚠ 134차는 **모델만** 넣는다 — 인벤 그리드 축소(2×5)와 등 슬롯·가방 아이템 UI 배선은
 *   Ch1 1-8 「간이 백팩」 흐름이 플레이 가능해질 때 함께(§0.5-5). 지금 켜면 테스터 세이브의
 *   슬롯 11~25 아이템이 갈 곳이 없다.
 */

import { TUNING } from '../config/tuning.js';

export type BackpackId = 'improvised' | 'tackle_vest' | 'dry_bag' | 'mountain';

export interface BackpackSpec {
  id: BackpackId;
  nameKo: string;
  nameEn: string;
  /** 탭당 용량 = round(D × ratio) */
  slotsPerTabRatio: number;
  equipSlot: 'back';
  traits: ('waterproof' | 'quickAccess')[];
  /** 획득 경로 (퀘 id) */
  fromQuest: string;
}

export const BASE_SLOTS_PER_TAB = { cols: 2, rows: 5 } as const;

export const BACKPACK_SPECS: Record<BackpackId, BackpackSpec> = {
  improvised: { id: 'improvised', nameKo: '간이 백팩', nameEn: 'Improvised Backpack', slotsPerTabRatio: 0.5, equipSlot: 'back', traits: [], fromQuest: 'M1-08' },
  tackle_vest: { id: 'tackle_vest', nameKo: '태클 베스트', nameEn: 'Tackle Vest', slotsPerTabRatio: 0.75, equipSlot: 'back', traits: ['quickAccess'], fromQuest: 'N06-3' },
  dry_bag: { id: 'dry_bag', nameKo: '드라이백', nameEn: 'Dry Bag', slotsPerTabRatio: 0.9, equipSlot: 'back', traits: ['waterproof'], fromQuest: 'N11-2' },
  mountain: { id: 'mountain', nameKo: '마운틴 백팩', nameEn: 'Mountain Backpack', slotsPerTabRatio: 1.0, equipSlot: 'back', traits: [], fromQuest: 'N01-6' },
};

/** 착용 가방 → 탭당 슬롯 수. 미착용 = 주머니 2×5 */
export function resolveSlotsPerTab(equipped: BackpackSpec | null, devSlots = TUNING.inventory.devSlotsPerTab): number {
  if (!equipped) return TUNING.inventory.baseCols * TUNING.inventory.baseRows;
  return Math.max(BASE_SLOTS_PER_TAB.cols * BASE_SLOTS_PER_TAB.rows, Math.round(devSlots * equipped.slotsPerTabRatio));
}

/**
 * 해제 가능? — 소지량이 낮은 용량을 초과하면 차단(바닥에 흘리지 않는다 — 스타듀 톤).
 * @param usedPerTab 탭별 사용 슬롯 수
 * @param targetCapacity 해제 후 탭당 용량
 */
export function canUnequipBag(usedPerTab: Record<string, number>, targetCapacity: number): { ok: boolean; overflow: number } {
  let overflow = 0;
  for (const n of Object.values(usedPerTab)) overflow += Math.max(0, n - targetCapacity);
  return { ok: overflow === 0, overflow };
}
