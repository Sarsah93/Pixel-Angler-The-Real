/**
 * @file StoryChoiceDepthKit.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 데이터(`StoryChoiceDepth*.ts`)를 쓰는 도우미.
 *
 * 쓰는 규칙(집필 기준 — `StoryChoiceDepth.ts` 머리 주석에 전부 있다)
 *  - 답(라벨)은 주인공이 실제로 하는 말이다. 「수락한다」 같은 메뉴 말이 아니라 그 자리의 대답.
 *  - 응답은 두세 문장 이상. 길면 빈 줄(`\n\n`)로 단락을 나눈다 — 대화창이 단락마다 ▼로 끊어 찍는다.
 *    한국어와 영어의 단락 수는 같아야 한다(번역 사전이 단락끼리 짝을 맞춘다).
 *  - 지문(몸짓)은 괄호로 — 기존 나레이션과 같은 문법.
 */

import type { ChoiceOutcome, ChoiceRequires, QuestChoiceDef } from '../types/Story.js';

/** 답 하나 — id는 그 편 · 그 자리 안에서 유일(세이브에 기록된다) */
export const d = (
  id: string, labelKo: string, labelEn: string, replyKo: string, replyEn: string,
  outcome: ChoiceOutcome = {}, requires?: ChoiceRequires,
): QuestChoiceDef => ({ id, labelKo, labelEn, replyKo, replyEn, outcome, ...(requires ? { requires } : {}) });

/** 지금은 받지 않는 답 — `standard` 편은 다음에 말을 걸면 다시 나오고, `once`는 영영 사라진다 */
export const dNo = (labelKo: string, labelEn: string, replyKo: string, replyEn: string, affinity = -0.03): QuestChoiceDef =>
  d('decline', labelKo, labelEn, replyKo, replyEn, { decline: true, affinity });
