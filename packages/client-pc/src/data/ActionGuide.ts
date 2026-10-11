/**
 * @file ActionGuide.ts
 * @description 235차 — 행동 목표의 **지금 단계** 안내(어디로 · 어떻게). 일지 · 필드 추적기 · 화살표가 같은 답을 쓴다.
 *
 * 단계의 출처(`StoryActionRegistry` `eventOrigins`)가 답을 정한다.
 *  - 현장 지점(`trigger:` · N18-6 각본 지점) → 그 지점을 가리킨다. 대화로만 닿는 지점(`viaNpc`)은 그 사람을.
 *  - 의뢰인 앞 선택(`action-choice:*`) → 의뢰인을 가리킨다.
 *  - 좌판 하루 판매(`stall-day:<인물>`) → 좌판 주인을 가리킨다(오늘 몫을 했으면 「다음 날」).
 *  - 창(면허 · 장비 · 지도 · 쿨러 · 도감) → 화살표 없이 여는 법만.
 * 출처를 정하지 않은 옛 행동이면 null — 호출 쪽이 core `objectiveHowToKo`로 떨어진다.
 */

import type { StoryQuestDef } from '@tra/core';
import { StoryStore } from '../store/StoryStore.js';
import { actionOriginHowToKo, isChoiceOrigin } from '../store/StoryActionRegistry.js';
import { STORY_FIELD_TRIGGERS, type StoryFieldTrigger } from './StoryNpcs.js';

export interface ActionStepGuide {
  /** 화살표가 가리킬 인물(의뢰인 · 좌판 주인 · 대화 지점의 상대) */
  npcId?: string;
  /** 화살표가 가리킬 현장 지점 */
  trigger?: StoryFieldTrigger;
  /** 위판장 창구(경매 현장이 열리는 곳) */
  market?: boolean;
  /** 「방법」 한 줄 */
  howToKo: string;
}

/** 행동 목표 `idx`의 지금 단계 안내. 행동 목표가 아니거나 이미 끝났으면 null */
export function actionStepGuide(q: StoryQuestDef, idx: number, npcName: (id: string) => string): ActionStepGuide | null {
  const o = q.objectives[idx];
  if (!o?.actionKey || StoryStore.objectiveDone(q, idx)) return null;
  const origin = StoryStore.actionExpectedOrigin(q.id, idx);
  if (!origin) return null;
  const step = StoryStore.actionStep(q.id, idx);
  const giverName = q.giver ? npcName(q.giver) : '의뢰인';
  const trig = STORY_FIELD_TRIGGERS.find((t) => t.questId === q.id && t.objectiveIndex === idx && t.phase === step);
  if (trig?.viaNpc) return { npcId: trig.viaNpc, howToKo: `${npcName(trig.viaNpc)}에게 [F] → 「${trig.labelKo}」` };
  if (trig) return { trigger: trig, howToKo: actionOriginHowToKo(`trigger:${trig.id}`, giverName, trig.labelKo) };
  if (isChoiceOrigin(origin)) return { npcId: q.giver || undefined, howToKo: actionOriginHowToKo(origin, giverName) };
  if (origin.startsWith('stall-day:')) {
    return {
      npcId: origin.slice('stall-day:'.length),
      howToKo: StoryStore.actionDoneToday(q.id, idx)
        ? '오늘 몫은 팔았다 — 다음 날 다시 좌판에서 판다'
        : actionOriginHowToKo(origin, giverName),
    };
  }
  return { market: origin === 'auction-open', howToKo: actionOriginHowToKo(origin, giverName) };
}
