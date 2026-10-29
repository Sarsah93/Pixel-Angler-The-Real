/**
 * @file StoryProgressAskKit.ts
 * @description 287차 — 진행 중 물음 데이터를 쓰는 도구. 한 · 영을 짝으로 적는다(`[한국어, 영어]`).
 *
 * 한 목표 = `pa(물음, 내 답, 조언)`:
 *  - 물음 = 의뢰인이 그 목표를 묻는 말 하나(물음표 하나 · 맨 끝). 스스로 답하거나 조언을 붙이지 않는다.
 *  - 내 답 = 주인공이 실제로 하는 말(공손한 말 — 「…아직 만나 보지 않았습니다.」).
 *  - 조언 = 답을 들은 의뢰인의 말(그 목표의 단서 · 주의). 물음으로 끝내지 않는다.
 */

import type { ProgressAskDef } from '../types/Story.js';

/** 한국어 · 영어 짝 */
export type KoEn = readonly [ko: string, en: string];

/** 목표 하나의 진행 중 물음 한 벌 */
export const pa = (ask: KoEn, answer: KoEn, reply: KoEn): ProgressAskDef => ({
  askKo: ask[0], askEn: ask[1],
  answerKo: answer[0], answerEn: answer[1],
  replyKo: reply[0], replyEn: reply[1],
});
