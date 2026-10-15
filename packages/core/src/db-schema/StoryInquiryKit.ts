/**
 * @file StoryInquiryKit.ts
 * @description 253차 — 물어보기 데이터(`StoryInquiry*.ts`)를 쓰는 도우미. 쓰는 규칙은 `StoryInquiry.ts` 머리 주석.
 */

import type { InquiryNodeDef, InquiryTopicDef } from '../types/Story.js';

/** 화제 하나 — id 접두: p_ 사람 · pl_ 곳 · t_ 물건 · w_ 낱말 · c_ 단서 */
export const topic = (
  id: string, kind: InquiryTopicDef['kind'], labelKo: string, labelEn: string, noteKo: string, noteEn: string,
  more: Pick<InquiryTopicDef, 'known' | 'learnWhen'> = {},
): InquiryTopicDef => ({ id, kind, labelKo, labelEn, noteKo, noteEn, ...more });

/** 물음 하나 — id = '<사람 id>.<화제 줄임>[.<꼬리>]' */
export const ask = (
  id: string, npcId: string, topicId: string, askKo: string, askEn: string, answerKo: string, answerEn: string,
  more: Pick<InquiryNodeDef, 'parent' | 'opens' | 'requires' | 'effect'> = {},
): InquiryNodeDef => ({ id, npcId, topic: topicId, askKo, askEn, answerKo, answerEn, ...more });
