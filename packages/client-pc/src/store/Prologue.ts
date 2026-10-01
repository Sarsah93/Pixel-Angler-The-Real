/**
 * @file Prologue.ts
 * @description 프롤로그 「떠나는 날 아침」 (188차 — 사용자 확정 시나리오 A)
 *
 * 새 캐릭터는 아버지가 남긴 집 안에서 눈을 뜬다. M1-01 「막차」의 앞 14개 목표(`prologue:*`)가
 * 조작을 하나씩 **직접 해 보게** 하며 속초까지 데려간다.
 *
 *   상자 열기 → 대 손에 들기(I) → 릴 달기(E) → 사진 뒷면(상세보기) → 일지(J) → 냉동고 오징어 →
 *   침대 저장 → 집 나서기 → 우물 → 상태 창(S) → 지도(M) → 막차(속초 도착) →
 *   직판장에서 기본 채비 하나씩 사기(원줄·바늘·봉돌·찌·미끼) → 오징어 팔기
 *
 * 설계:
 *  - 각 단계는 **행동 플래그**(`prologue.<key>`) 또는 **현재 상태**(대·릴 착용)로 판정한다.
 *    `syncPrologue()`가 앞에서부터 차례로 맞춰 닫는다(M1-01은 `ordered` — 앞이 남으면 뒤를 받지 않는다).
 *    순서를 어겨 먼저 해 둔 행동도 플래그로 남아 있다가 차례가 오면 바로 닫힌다 — 막힘(데드락)이 없다.
 *  - 단축키는 배운 만큼만 열린다(`prologueKeyAllowed`) — 아직 배우지 않은 창이 튀어나오지 않게.
 *  - 구세이브(이미 집을 떠난 사람)는 StoryStore가 앞 14개를 완료로 채워 둔다(`remapPrologue`).
 */

import { getStoryQuest } from '@tra/core';
import { GameState } from './GameState.js';
import { StoryStore } from './StoryStore.js';
import { InventoryStore, type InvItem } from './InventoryStore.js';

const QID = 'M1-01';

export type PrologueKey =
  | 'box' | 'rod' | 'reel' | 'photo' | 'journal' | 'squid' | 'save' | 'leave'
  | 'well' | 'status' | 'map' | 'arrive' | 'buy' | 'sell';

/** 기본 채비 다섯 갈래 — 하나씩 사 보게 한다 */
export const PROLOGUE_BUY_KINDS = ['line', 'hook', 'sinker', 'float', 'bait'] as const;
export type PrologueBuyKind = typeof PROLOGUE_BUY_KINDS[number];

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

/** 앞에서부터 차례로 — 조건이 서 있는 목표를 닫고, 처음 막히는 곳에서 멈춘다 */
export function syncPrologue(): void {
  if (!StoryStore.isActive(QID)) return;
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

/** 산 물건이 기본 채비 다섯 갈래 중 무엇인가 */
export function buyKindOf(e: Pick<InvItem, 'id' | 'subCategory'> & { floatBuoyG?: number; sinkerKind?: string }): PrologueBuyKind | null {
  const sub = e.subCategory ?? '';
  if (sub === '원줄 스풀' || sub === '목줄 스풀') return 'line';
  if (sub === '바늘/훅') return 'hook';
  if (e.sinkerKind || e.id === 'inv_sinkerG2') return 'sinker';
  if ((e.floatBuoyG ?? 0) > 0) return 'float';
  if (sub === '냉동미끼' || sub === '선어미끼' || sub === '생미끼') return 'bait';
  return null;
}

/** 직판장 구매 기록 (RegionFieldScene.handleBuy) */
export function noteProloguePurchase(e: Parameters<typeof buyKindOf>[0]): void {
  if (!inPrologue()) return;
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
