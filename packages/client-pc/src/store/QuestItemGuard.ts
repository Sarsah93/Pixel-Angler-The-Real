/**
 * @file QuestItemGuard.ts
 * @description 이야기 진행에 꼭 필요한 물건 지키기 · 되살리기 (234차 — 퀘스트 물건 수명 감사)
 *
 * 사용자 질문(234차): 「퀘스트 진행 물건을 버렸을 때 퀘스트가 꼬이는 부분은 없는지 —
 * 버렸을 때는 아예 소멸하게끔 해야 버그 사유가 없을 것 같아」.
 *
 * 감사 결론 — 물건마다 답이 다르다:
 *  - **모으는 물건**(`qi_*` — 확률로 줍는 개인 퀘스트 물건): 버리면 **소멸**하고, 진행은 가방에 든 수로
 *    다시 센다(`StoryStore.syncHeldQuestItems`). 다시 주우면 되므로 꼬일 데가 없다.
 *  - **맡은 물건**(M1-02 얼음 상자 · M1-10 자전거 — 들고 가야 목표가 닫힌다): 그 일이 끝날 때까지
 *    버리기 · 완전제거 · 거래 · 집 보관을 막는다. 그래도 없어졌으면(구세이브 · 예외 경로)
 *    바닥에 둔 것을 거둬 오거나 다시 준다 — 같은 물건이 둘이 되지 않게 가방 · 바닥 · 집 선반을 먼저 본다.
 *  - **이야기 기념품**(가족사진): 다시 얻을 길이 없고 뒤 장(M7-04 「사진 속 천막」)이 다시 꺼낸다 — 버리지 않는다.
 *  - **귀속 보상 장비**(`qr_*`): 버릴 수는 있되 「다시 얻을 수 없다」고 한 번 더 묻는다(`InventoryPanel`).
 *  - **심부름 물건**(`qd_*` — 235차 · 현장 지점에서 받아 들고 가는 받침 · 반찬통): 받은 뒤 내려놓을 때까지 맡은 물건과 같다.
 *
 * 저장소(인벤토리 · 집 보관함)는 이 파일을 import하지 않고 `ItemKeepGuard`로만 묻는다(순환 import 회피).
 */

import { getStoryQuest } from '@tra/core';
import { StoryStore } from './StoryStore.js';
import { InventoryStore } from './InventoryStore.js';
import { GroundItemStore } from './GroundItemStore.js';
import { HomeStore } from './HomeStore.js';
import { QUEST_REWARD_ITEMS } from '../data/QuestRewardItems.js';
import { prologueProtects, PROLOGUE_PROTECT_MSG, PROLOGUE_PHOTO_ID } from './Prologue.js';
import { setItemKeepGuard } from './ItemKeepGuard.js';

/** M1-02 「얼음 나르기」의 상자 */
export const ICE_CRATE_ID = 'quest_ice_crate';
/** M1-10 「공동작업」에서 어촌계가 내주는 자전거 */
export const COOP_BIKE_ID = 'inv_bike';

/** 퀘스트의 목표 하나가 아직 남았는가 (`placeKey`로 찾는다 — 목표 순서가 바뀌어도 맞게) */
function pending(questId: string, placeKey: string): boolean {
  if (!StoryStore.isActive(questId)) return false;
  const q = getStoryQuest(questId);
  const i = q ? q.objectives.findIndex((o) => o.placeKey === placeKey) : -1;
  return !!q && i >= 0 && !StoryStore.objectiveDone(q, i);
}

/**
 * 235차 — 심부름 지점에서 받아 든 물건(받은 단계 1 → 내려놓는 단계 2 사이).
 * 받침은 N19-1 · N19-3 두 의뢰가 같은 물건을 쓴다(동시에 둘이 열리지 않는다 — 아크 순서).
 */
const DELIVERY_CARRY: readonly { itemId: string; questId: string; keepKo: string }[] = [
  { itemId: 'qd_bamboo_tray', questId: 'N19-1', keepKo: '탁만수가 깎은 대나무 받침이다. 만복상회 좌판에 놓을 때까지 지니고 있자.' },
  { itemId: 'qd_bamboo_tray', questId: 'N19-3', keepKo: '탁만수가 다시 깎은 받침이다. 만복상회 수조 옆에 놓을 때까지 지니고 있자.' },
  { itemId: 'qd_food_box', questId: 'N19-2', keepKo: '정옥선이 싸 준 반찬통이다. 죽간 공방에 건넬 때까지 지니고 있자.' },
];

/** 그 심부름 물건을 지금 들고 가는 중인가(받았고 아직 내려놓지 않았다) — 맞으면 그 줄 */
function carrying(itemId: string): (typeof DELIVERY_CARRY)[number] | undefined {
  return DELIVERY_CARRY.find((d) => {
    if (d.itemId !== itemId || !StoryStore.isActive(d.questId)) return false;
    const q = getStoryQuest(d.questId);
    const i = q ? q.objectives.findIndex((o) => !!o.actionKey) : -1;
    return !!q && i >= 0 && !StoryStore.objectiveDone(q, i) && StoryStore.actionStep(d.questId, i) === 1;
  });
}

/** 얼음 상자가 아직 필요한가 — 경매장에 내려놓을 때까지 */
export function iceCrateNeeded(): boolean { return pending('M1-02', 'ice:auction-drop'); }
/** 어촌계 자전거가 아직 필요한가 — 한 번 타 볼 때까지 */
export function coopBikeNeeded(): boolean { return pending('M1-10', 'bikeMount'); }

/**
 * 지금 잃으면 안 되는 물건이면 까닭 한 줄, 아니면 null.
 * 버리기 · 완전제거 · 먹기 · 분해 · 거래 · 집 보관이 이것을 묻는다(내려놓기는 장면이 따로 판단한다).
 */
export function questKeepReason(itemId: string): string | null {
  if (prologueProtects(itemId)) return PROLOGUE_PROTECT_MSG;
  if (itemId === ICE_CRATE_ID && iceCrateNeeded()) return '정옥선에게 맡은 얼음 상자다. 경매장에 내려놓을 때까지 지니고 있자.';
  if (itemId === COOP_BIKE_ID && coopBikeNeeded()) return '어촌계에서 내준 자전거다. 한 번 타 볼 때까지는 지니고 있자.';
  if (itemId === PROLOGUE_PHOTO_ID) return '아버지가 남긴 가족사진이다. 버릴 수 없다.';
  const carry = carrying(itemId);
  if (carry) return carry.keepKo;
  return null;
}

setItemKeepGuard(questKeepReason);

/** 그 물건을 어디든 갖고 있는가 — 가방 · 집 선반 · 옷장 */
function heldAnywhere(itemId: string): boolean {
  if (InventoryStore.find(itemId)) return true;
  return (['shelf', 'wardrobe'] as const).some((k) => HomeStore.slots(k).some((s) => s?.id === itemId));
}

/** 바닥에 놓아 둔 그 물건을 전부 거둬 온다(지역 무관). 거둔 수량 */
function sweepGround(itemId: string): number {
  let n = 0;
  for (const g of [...GroundItemStore.all]) {
    if (g.tpl.id !== itemId) continue;
    GroundItemStore.take(g.uid);
    n += g.qty;
  }
  return n;
}

let repairing = false;
/**
 * 맡은 물건이 사라졌으면 되살린다. 필드 진입 · 인벤토리 변화 · 불러오기 직후에 부른다.
 * @returns 무언가 고쳤으면 그 줄(로그용) 목록
 */
export function repairQuestItems(): string[] {
  if (repairing) return [];
  repairing = true;
  const fixed: string[] = [];
  try {
    // M1-02 — 구세이브(2026-09-21 이전 2목표 시절)는 목표 배열 길이가 다르다 → 처음부터 다시(상자 확인부터)
    if (StoryStore.isActive('M1-02') && StoryStore.resetIfLayoutChanged('M1-02')) {
      fixed.push('[할 일] 얼음 나르기 — 바뀐 순서에 맞춰 처음부터 다시 진행합니다');
    }
    if (iceCrateNeeded() && !InventoryStore.find(ICE_CRATE_ID)) {
      sweepGround(ICE_CRATE_ID);
      const tpl = QUEST_REWARD_ITEMS.find((i) => i.id === ICE_CRATE_ID);
      if (tpl && InventoryStore.addItem({ ...tpl, bound: true }, 1, { silent: true })) {
        fixed.push('[할 일] 정옥선의 얼음 상자를 다시 챙겼다');
        // 상자 확인 목표가 남아 있으면(구세이브 재배치 직후) 지금 가방에 들어온 것으로 닫는다
        StoryStore.event({ kind: 'custom', key: 'quest:ice-crate-check' });
      }
    }
    // 235차 — 받아 든 심부름 물건이 사라졌으면(구세이브 · 예외 경로) 바닥에서 거두거나 다시 쥐여 준다
    for (const id of new Set(DELIVERY_CARRY.map((d) => d.itemId))) {
      if (!carrying(id) || InventoryStore.find(id)) continue;
      sweepGround(id);
      const tpl = QUEST_REWARD_ITEMS.find((i) => i.id === id);
      if (tpl && InventoryStore.addItem({ ...tpl, bound: true }, 1, { silent: true })) fixed.push(`[할 일] ${tpl.name}을(를) 다시 챙겼다`);
    }
    // 235차 — M7-04 「사진 속 천막」은 사진을 꺼내 보여야 닫힌다. 어디에도 없으면(구세이브에서 잃은 경우) 되찾는다
    if (StoryStore.isActive('M7-04') && !heldAnywhere(PROLOGUE_PHOTO_ID)) {
      sweepGround(PROLOGUE_PHOTO_ID);
      const tpl = QUEST_REWARD_ITEMS.find((i) => i.id === PROLOGUE_PHOTO_ID);
      if (tpl && InventoryStore.addItem({ ...tpl, bound: true }, 1, { silent: true })) fixed.push('[할 일] 아버지의 상자 밑에서 가족사진을 다시 찾았다');
    }
    if (coopBikeNeeded() && !heldAnywhere(COOP_BIKE_ID)) {
      const back = sweepGround(COOP_BIKE_ID) > 0;
      const tpl = InventoryStore.seedTemplate(COOP_BIKE_ID);
      if (tpl && InventoryStore.addItem(tpl, 1, { silent: true })) {
        fixed.push(back ? '[할 일] 어촌계 자전거를 다시 끌고 왔다' : '[할 일] 어촌계에서 자전거를 다시 내주었다');
      }
    }
  } finally {
    repairing = false;
  }
  return fixed;
}
