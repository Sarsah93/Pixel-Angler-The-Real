/**
 * @file Prologue.ts
 * @description 프롤로그 「떠나는 날 아침」 (188차 — 사용자 확정 시나리오 A)
 *
 * 새 캐릭터는 아버지가 남긴 집 안에서 눈을 뜬다. M1-01 「막차」의 앞 14개 목표(`prologue:*`)가
 * 조작을 하나씩 **직접 해 보게** 하며 속초까지 데려간다.
 *
 *   상자 열기 → 대 손에 들기(I) → 릴 달기(E) → 사진 뒷면(상세보기) → 일지(J) → 냉동고 오징어 →
 *   침대 저장 → 집 나서기 → 우물 → 상태 창(S) → 지도(M) → 막차(속초 도착) →
 *   직판장에서 원투 채비 하나씩 사기(원줄·목줄·봉돌·바늘·미끼 — 236차, 구: 찌 채비) → 오징어 팔기
 *
 * 설계:
 *  - 각 단계는 **행동 플래그**(`prologue.<key>`) 또는 **현재 상태**(대·릴 착용)로 판정한다.
 *    `syncPrologue()`가 앞에서부터 차례로 맞춰 닫는다(M1-01은 `ordered` — 앞이 남으면 뒤를 받지 않는다).
 *    순서를 어겨 먼저 해 둔 행동도 플래그로 남아 있다가 차례가 오면 바로 닫힌다 — 막힘(데드락)이 없다.
 *  - 단축키는 배운 만큼만 열린다(`prologueKeyAllowed`) — 아직 배우지 않은 창이 튀어나오지 않게.
 *  - 구세이브(이미 집을 떠난 사람)는 StoryStore가 앞 14개를 완료로 채워 둔다(`remapPrologue`).
 *  - 219차 — **진행 막힘 안전망**(사용자 리포트: 오징어를 꺼냈다가 냉동고에 다시 넣고 나서면 판매 단계에서 막혔다).
 *    ① 단계에 필요한 물건(대 · 릴 · 사진 · 오징어)은 그 단계가 끝날 때까지 버리기 · 먹기 · 보관 · 요리 · 거래를 막는다
 *       (`prologueProtects` — 창들이 묻는다).
 *    ② 그래도 사라졌으면 `syncPrologue()`가 되살린다 — 냉장고에 있으면 꺼내 오고, 없으면 다시 준다(`repairPrologue`).
 */

import { getStoryQuest, ROD_SPEC_BY_ID } from '@tra/core';
import { GameState } from './GameState.js';
import { StoryStore } from './StoryStore.js';
import { InventoryStore, FATHER_BOX_ITEMS, type InvItem } from './InventoryStore.js';
import { FridgeStore, type FridgeSection } from './FridgeStore.js';
import { QUEST_REWARD_ITEMS } from '../data/QuestRewardItems.js';

const QID = 'M1-01';

export type PrologueKey =
  | 'box' | 'rod' | 'reel' | 'photo' | 'journal' | 'squid' | 'save' | 'leave'
  | 'well' | 'status' | 'map' | 'arrive' | 'buy' | 'sell';

/**
 * 첫 장보기 다섯 갈래 — 하나씩 사 보게 한다.
 * 236차(사용자 지시): 찌 채비가 아니라 **원투 채비**다 — 원줄 → 유동 봉돌 → 직결 매듭 → 목줄 → 바늘 → 미끼.
 * 다섯 가지를 다 사면 그 자리에서 던질 수 있는 한 벌이 된다(구 찌 채비는 원줄 · 목줄 중 하나만 사서 덜 갖춰졌다).
 */
export const PROLOGUE_BUY_KINDS = ['line', 'leader', 'sinker', 'hook', 'bait'] as const;
export type PrologueBuyKind = typeof PROLOGUE_BUY_KINDS[number];

/** 갈래 표시 이름 — 말풍선 · 도움말이 같은 말을 쓴다 */
export const PROLOGUE_BUY_LABEL: Record<PrologueBuyKind, string> = {
  line: '원줄', leader: '목줄', sinker: '원투 봉돌', hook: '바늘', bait: '미끼',
};

/**
 * 236차 — 아버지 대(1.5호 갯바위대)가 견디는 채비 무게 상한(g). 이보다 무거운 원투 봉돌(10호 38g~)을
 * 세게 던지면 초릿대가 부러질 수 있다(`rodTipSnapChance`) → 첫 장보기로 치지 않고 말풍선이 바로잡는다.
 */
export const PROLOGUE_SINKER_MAX_G = ROD_SPEC_BY_ID.inv_rod?.loadG[1] ?? 15;

export const PROLOGUE_PHOTO_ID = 'quest_family_photo';
export const PROLOGUE_SQUID_ID = 'inv_frozen_squid';

const flagKey = (k: string): string => `prologue.${k}`;

/** 새 게임 냉동고에 넣어 둘 오징어 — 직판장 판매 체험용 */
export function prologueSquid(): InvItem {
  return {
    id: PROLOGUE_SQUID_ID, name: '냉동 오징어', icon: '', iconTexture: 'fish_squid',
    category: 'food', subCategory: '수산물', qty: 2, basePrice: 8000, condition: 'frozen',
    conditionSinceMs: Date.now(), equippable: false, slot: 0,
  };
}

function objIndex(key: PrologueKey): number {
  const q = getStoryQuest(QID);
  return q ? q.objectives.findIndex((o) => o.placeKey === `prologue:${key}`) : -1;
}

/** 그 단계를 닫았는가 (M1-01이 이미 끝났으면 전부 참) */
export function prologueStepDone(key: PrologueKey): boolean {
  const q = getStoryQuest(QID);
  const i = objIndex(key);
  if (!q || i < 0) return true;
  if (!StoryStore.isActive(QID)) return StoryStore.status(q) === 'done';
  return StoryStore.objectiveDone(q, i);
}

/** 집·홈타운 단계(속초 도착 전)인가 — 단축키를 단계별로 연다 */
export function prologueRunning(): boolean {
  return StoryStore.isActive(QID) && !prologueStepDone('arrive');
}

/** 프롤로그 목표가 하나라도 남았는가 (직판장 구매·판매 포함) */
export function inPrologue(): boolean {
  if (!StoryStore.isActive(QID)) return false;
  return !prologueStepDone('sell');
}

/** 행동 기록 — 플래그를 켜고 바로 맞춘다 */
export function markPrologue(key: PrologueKey): void {
  if (!StoryStore.isActive(QID)) return;
  if (!GameState.getFlag(flagKey(key))) {
    GameState.setFlag(flagKey(key));
    GameState.markDirty();
  }
  syncPrologue();
}

function value(key: string): number {
  switch (key) {
    case 'rod': return InventoryStore.getEquippedRod() ? 1 : 0;
    case 'reel': return InventoryStore.equippedReel ? 1 : 0;
    case 'squid':
      if (InventoryStore.find(PROLOGUE_SQUID_ID)) GameState.setFlag(flagKey('squid'));
      return GameState.getFlag(flagKey('squid')) ? 1 : 0;
    case 'buy': return PROLOGUE_BUY_KINDS.filter((k) => GameState.getFlag(`prologue.buy.${k}`)).length;
    default: return GameState.getFlag(flagKey(key)) ? 1 : 0;
  }
}

/** 아버지 상자 물건 id — 순환 import를 피하려고 처음 쓸 때 만든다 */
let boxIds: Set<string> | null = null;
const isBoxItem = (id: string): boolean => (boxIds ??= new Set(FATHER_BOX_ITEMS.map((t) => t.id))).has(id);

/**
 * 219차 — 이 물건을 지금 잃으면(버리기 · 먹기 · 보관 · 요리 · 거래) 프롤로그가 막히는가.
 * 참이면 그 행동을 막고 「아직 필요한 물건이다」를 알린다.
 */
export function prologueProtects(id: string): boolean {
  if (!StoryStore.isActive(QID)) return false;
  if (id === PROLOGUE_SQUID_ID) return !prologueStepDone('sell');
  if (id === PROLOGUE_PHOTO_ID) return !prologueStepDone('photo');
  if (isBoxItem(id)) return !prologueStepDone('rod') || !prologueStepDone('reel');
  return false;
}

/** 219차 — 막을 때 보여 줄 한 줄 */
export const PROLOGUE_PROTECT_MSG = '지금 꼭 필요한 물건이다. 할 일을 마친 뒤에 정리하자.';

/** 219차 — 냉장고 · 냉동고에서 그 물건을 꺼낸다(있으면) */
function takeFromFridge(id: string): InvItem | null {
  for (const sec of ['freezer', 'fridge'] as FridgeSection[]) {
    for (let i = 0; i < FridgeStore.capacity(sec); i++) {
      if (FridgeStore.get(sec, i)?.id === id) return FridgeStore.take(sec, i);
    }
  }
  return null;
}

let repairing = false;
/**
 * 219차 — 단계에 필요한 물건이 사라졌으면 되살린다(진행 막힘 방지). `syncPrologue()`가 매번 부른다.
 *  - 상자를 연 뒤 대 · 릴 단계가 남았는데 가방(착용 포함)에 없으면 다시 넣는다.
 *  - 사진 단계가 남았는데 사진이 없으면 다시 넣는다.
 *  - 오징어를 챙긴 뒤 판매 단계가 남았는데 가방에 없으면 — 냉장고에 있으면 꺼내 오고, 없으면 다시 준다.
 */
export function repairPrologue(): boolean {
  if (repairing || !StoryStore.isActive(QID)) return false;
  repairing = true;
  let fixed = false;
  try {
    const boxOpen = GameState.getFlag(flagKey('box'));
    if (boxOpen && (!prologueStepDone('rod') || !prologueStepDone('reel'))) {
      for (const tpl of FATHER_BOX_ITEMS) {
        if (InventoryStore.find(tpl.id)) continue;
        const back = takeFromFridge(tpl.id);
        InventoryStore.addItem(back ?? { ...tpl }, 1);
        fixed = true;
      }
    }
    if (boxOpen && !prologueStepDone('photo') && !InventoryStore.find(PROLOGUE_PHOTO_ID)) {
      const photo = QUEST_REWARD_ITEMS.find((q) => q.id === PROLOGUE_PHOTO_ID);
      if (photo) { InventoryStore.addItem(takeFromFridge(PROLOGUE_PHOTO_ID) ?? { ...photo, bound: true }, 1); fixed = true; }
    }
    if (GameState.getFlag(flagKey('squid')) && !prologueStepDone('sell') && !InventoryStore.find(PROLOGUE_SQUID_ID)) {
      // 234차 — 냉장고에서 꺼낸 묶음은 그 수량 그대로(구: 2마리를 꺼내 1마리만 넣었다)
      const back = takeFromFridge(PROLOGUE_SQUID_ID);
      InventoryStore.addItem(back ?? prologueSquid(), back?.qty ?? 1);
      fixed = true;
    }
    if (fixed) GameState.markDirty();
  } finally {
    repairing = false;
  }
  return fixed;
}

/** 앞에서부터 차례로 — 조건이 서 있는 목표를 닫고, 처음 막히는 곳에서 멈춘다 */
export function syncPrologue(): void {
  if (!StoryStore.isActive(QID)) return;
  repairPrologue();
  const q = getStoryQuest(QID);
  if (!q) return;
  for (let i = 0; i < q.objectives.length; i++) {
    const pk = q.objectives[i].placeKey ?? '';
    if (!pk.startsWith('prologue:')) break;
    if (StoryStore.objectiveDone(q, i)) continue;
    const v = value(pk.slice(9));
    if (v <= 0) break;
    StoryStore.setObjectiveProgress(QID, i, v);
    if (!StoryStore.objectiveDone(q, i)) break;
  }
}

/** 이 단계를 닫아야 열리는 단축키 — 표에 없는 패널 키는 속초에 도착한 뒤에 열린다 */
const KEY_AFTER: Record<string, PrologueKey> = {
  KeyI: 'box', KeyE: 'rod', KeyJ: 'photo', KeyS: 'well', KeyM: 'status',
};

/** 이 단축키를 지금 받아도 되는가 (프롤로그 밖이면 언제나 참) */
export function prologueKeyAllowed(code: string): boolean {
  if (!prologueRunning()) return true;
  const need = KEY_AFTER[code];
  return need ? prologueStepDone(need) : false;
}

type BuyView = Pick<InvItem, 'id' | 'subCategory'> & { sinkerKind?: string; sinkerWeightG?: number };

/** 236차 — 아버지 대에 너무 무거운 원투 봉돌인가 */
export function prologueHeavySinker(e: BuyView): boolean {
  return !!e.sinkerKind && (e.sinkerWeightG ?? 0) > PROLOGUE_SINKER_MAX_G;
}

/** 산 물건이 첫 장보기 다섯 갈래 중 무엇인가 (찌 · 좁쌀봉돌은 원투 채비가 아니다) */
export function buyKindOf(e: BuyView): PrologueBuyKind | null {
  const sub = e.subCategory ?? '';
  if (sub === '원줄 스풀') return 'line';
  if (sub === '목줄 스풀') return 'leader';
  if (sub === '바늘/훅') return 'hook';
  if (e.sinkerKind) return prologueHeavySinker(e) ? null : 'sinker';
  if (sub === '냉동미끼' || sub === '선어미끼' || sub === '생미끼') return 'bait';
  return null;
}

/** 직판장 구매 기록 (RegionFieldScene.handleBuy) */
export function noteProloguePurchase(e: BuyView): void {
  if (!inPrologue()) return;
  // 236차 — 무거운 원투 봉돌은 치지 않는다. 말풍선이 「대가 견디는 무게」를 일러 준다(한 번 켜 두면 남는다)
  if (prologueHeavySinker(e) && !GameState.getFlag('prologue.buy.sinker')) {
    GameState.setFlag('prologue.heavySinker');
    GameState.markDirty();
  }
  const k = buyKindOf(e);
  if (!k) return;
  GameState.setFlag(`prologue.buy.${k}`);
  GameState.markDirty();
  syncPrologue();
}

/** 판매 기록 (RegionFieldScene.handleSell) */
export function notePrologueSale(item: Pick<InvItem, 'id'>): void {
  if (item.id === PROLOGUE_SQUID_ID) markPrologue('sell');
}
