/**
 * @file StoryTalkKit.ts
 * @description 254차 — 이어지는 대화(갈래) 데이터를 쓰는 도우미. 묶음 파일(`StoryTalk*.ts`)이 이것만 쓴다.
 *
 * - `say(한, 영, [답…], 말하는 사람?)` = 대화 한 단계(상대 대사 + 고를 말).
 * - `opt(id, 한, 영, { next | end, aff, flags, stance, requires })` = 고를 말 하나.
 * - `endTalk({ accept | decline | complete | ending, lineKo, lineEn })` = 끝.
 * 규칙(입장 · 우호도 폭 · 글 규칙)은 `rules/StoryTalk.ts` `validateTalks`가 본다.
 */

import type { TalkChoiceDef, TalkEndDef, TalkGate, TalkNodeDef, TalkStance } from '../types/Story.js';

export interface OptExtra {
  next?: string;
  end?: TalkEndDef;
  stance?: TalkStance;
  /** 사람마다 우호도 증감 — { okseon: 0.05, tak_mansu: -0.03 } */
  aff?: Readonly<Record<string, number>>;
  flags?: readonly string[];
  requires?: TalkGate;
}

/** 고를 말 하나 */
export function opt(id: string, labelKo: string, labelEn: string, x: OptExtra): TalkChoiceDef {
  return {
    id, labelKo, labelEn,
    ...(x.stance ? { stance: x.stance } : {}),
    ...(x.aff ? { affinity: x.aff } : {}),
    ...(x.flags ? { flags: x.flags } : {}),
    ...(x.requires ? { requires: x.requires } : {}),
    ...(x.next ? { next: x.next } : {}),
    ...(x.end ? { end: x.end } : {}),
  };
}

/** 대화 한 단계 — 말하는 사람이 대화 상대가 아니면 넷째 인자(`''` = 지문) */
export function say(lineKo: string, lineEn: string, choices: readonly TalkChoiceDef[], speaker?: string): TalkNodeDef {
  return { lineKo, lineEn, choices, ...(speaker !== undefined ? { speaker } : {}) };
}

/** 대화의 끝 */
export function endTalk(e: TalkEndDef): TalkEndDef {
  return e;
}
