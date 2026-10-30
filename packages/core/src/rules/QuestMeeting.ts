/**
 * @file QuestMeeting.ts
 * @description 291차 — 「어디서 만나는가」 판정: 출장 나온 인물 · 받는 · 끝내는 자리가 열리는 지역 · 인물이 지금 있는 지역.
 *
 * 배경(285 조사 · 291 실측): 의뢰인이 있는 189편 중 76편은 의뢰인이 편의 지역에 서 있지 않다(속초 인물이 부산 · 포항 · 제주 이야기를 맡는다).
 * 대본은 「너도 감천 왔냐」처럼 그 지역에서 만났다고 쓰는데 인물은 속초에만 있어 대화가 속초에서 일어났고,
 * 안내 화살표는 인물이 실제로 선 곳이 아니라 편의 지역을 가리켜 「같은 지역인데 안내 없음」 · 「엉뚱한 지역」이 났다.
 *
 * 규칙
 *  - 의뢰인(또는 대화 목표 인물)이 편의 지역에 자리가 없으면, 그 편이 받을 수 있는 동안 · 진행 중인 동안 편의 지역에 **출장**으로 나온다.
 *    단 그 단계의 자리가 `home`이면 나오지 않는다(`db-schema/StoryMeeting.ts`).
 *  - 받는 · 끝내는 자리: `here` = 편의 지역에서만 · `home` = 그 사람이 사는 지역에서만 · `any` = 어디서든.
 *  - 의뢰인이 편의 지역에 사는 편은 이 표와 상관없다(늘 그 자리).
 * 자리(좌표)는 클라이언트 데이터라 `placedIn`으로 주입받는다. 순수 함수 — 렌더 없음.
 */
import type { MeetPlace, StoryObjective, StoryQuestDef } from '../types/Story.js';
import { QUEST_MEETING } from '../db-schema/StoryMeeting.js';
import { STORY_QUESTS } from '../db-schema/StoryQuestDatabase.js';

/** 만나는 단계 — 받는 자리 · 끝내는 자리 · 대화 목표 번호 */
export type MeetStage = 'offer' | 'complete' | number;

/** 이 편 이 단계의 만나는 자리(표에 없으면 `any`) */
export function meetPlaceOf(questId: string, stage: MeetStage): MeetPlace {
  const m = QUEST_MEETING[questId];
  if (!m) return 'any';
  if (stage === 'offer') return m.offer ?? 'any';
  if (stage === 'complete') return m.complete ?? 'any';
  return m.talks?.[stage] ?? 'any';
}

/** 판정에 필요한 진행 상태 — 클라이언트 `StoryStore`가 채운다 */
export interface MeetingCtx {
  /** 그 인물이 그 지역에 좌표 있는 자리를 갖는가(집 자리) */
  placedIn(npcId: string, regionId: string): boolean;
  /** 편 상태(`available` · `active` · …) */
  status(q: StoryQuestDef): string;
  allObjectivesDone(q: StoryQuestDef): boolean;
  /** 이 목표가 지금 열려 있고 아직 안 닫혔는가(순서형이면 앞 목표를 다 닫았는가) */
  objectiveOpen(q: StoryQuestDef, i: number): boolean;
}

/** 출장 나온 인물 하나 — 어느 편의 어느 단계 때문에 나왔는가 */
export interface QuestGuest {
  npcId: string;
  questId: string;
  /** 'offer' · 'progress'(진행 중 — 물음 · 끝내는 자리) · 대화 목표 번호 */
  stage: 'offer' | 'progress' | number;
}

function isTalkObjective(o: StoryObjective): boolean {
  return o.kind === 'talk' || o.kind === 'deliverFree';
}

/**
 * 이 지역에 출장 나와 있는 인물 — 집 자리가 이 지역에 없는 의뢰인 · 대화 목표 인물 중 지금 이 지역 편이 부르는 사람.
 * 같은 사람이 여러 편으로 불려도 한 번만 낸다(앞선 편 — 메인 먼저).
 */
export function questGuestsIn(regionId: string, ctx: MeetingCtx, quests: readonly StoryQuestDef[] = STORY_QUESTS): QuestGuest[] {
  const out: QuestGuest[] = [];
  const seen = new Set<string>();
  const add = (npcId: string, questId: string, stage: QuestGuest['stage']): void => {
    if (seen.has(npcId)) return;
    seen.add(npcId);
    out.push({ npcId, questId, stage });
  };
  const ordered = [...quests].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'main' ? -1 : 1));
  for (const q of ordered) {
    if (q.region !== regionId) continue;
    const st = ctx.status(q);
    if (st !== 'available' && st !== 'active') continue;
    const giverAway = !!q.giver && !ctx.placedIn(q.giver, regionId);
    if (st === 'available') {
      if (giverAway && meetPlaceOf(q.id, 'offer') !== 'home') add(q.giver, q.id, 'offer');
      continue;
    }
    // 진행 중 — 대화 목표 인물이 먼저(장면의 상대) · 그다음 의뢰인(진행 중 물음 · 끝내는 자리)
    q.objectives.forEach((o, i) => {
      if (!isTalkObjective(o)) return;
      const n = o.npcId ?? q.giver;
      if (!n || ctx.placedIn(n, regionId) || !ctx.objectiveOpen(q, i)) return;
      if (meetPlaceOf(q.id, i) !== 'home') add(n, q.id, i);
    });
    if (giverAway && meetPlaceOf(q.id, 'complete') !== 'home') add(q.giver, q.id, 'progress');
  }
  return out;
}

/**
 * 받는 · 끝내는 자리가 이 지역에서 열리는가. 의뢰인이 편의 지역에 살면 늘 열린다(표 해당 없음).
 * `here` = 편의 지역에서만 · `home` = 의뢰인이 사는 지역에서만 · `any` = 어디서든.
 */
export function meetStageOpenIn(q: StoryQuestDef, stage: 'offer' | 'complete', regionId: string, placedIn: MeetingCtx['placedIn']): boolean {
  if (!q.giver || placedIn(q.giver, q.region)) return true;
  const m = meetPlaceOf(q.id, stage);
  if (m === 'here') return regionId === q.region;
  if (m === 'home') return placedIn(q.giver, regionId);
  return true;
}

/**
 * 인물이 지금 있는 지역 — 집 자리(`homeRegions`) + 출장(그 지역 편이 부를 때).
 * `prefer`가 그중 하나면 그것(추적 중인 할 일의 지역), 아니면 출장 지역 → 집 순.
 */
export function npcRegionNow(npcId: string, homeRegions: readonly string[], ctx: MeetingCtx, prefer?: string, regions?: readonly string[]): string | undefined {
  const guestIn = (r: string): boolean => questGuestsIn(r, ctx).some((g) => g.npcId === npcId);
  if (prefer && (homeRegions.includes(prefer) || guestIn(prefer))) return prefer;
  const pool = regions ?? [...new Set(STORY_QUESTS.map((q) => q.region))];
  for (const r of pool) if (!homeRegions.includes(r) && guestIn(r)) return r;
  return homeRegions[0];
}
