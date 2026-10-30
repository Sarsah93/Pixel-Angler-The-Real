/**
 * @file StoryMeeting.ts
 * @description 291차 — 편마다 대화가 일어나는 자리(받는 자리 · 끝내는 자리 · 대화 목표).
 *
 * 의뢰인이 편의 지역에 서 있지 않은 편(76편 — 대부분 속초 인물이 다른 지역 이야기를 맡는다)만 적는다.
 * 대본이 「그 지역에서 만났다」고 쓴 자리는 `here`, 「떠나기 전 · 돌아온 뒤」라고 쓴 자리는 `home`이다.
 * 적지 않은 자리는 `any` — 의뢰인이 집에도 있고 편의 지역에도 출장 나와 있다(`rules/QuestMeeting.ts`).
 * 분류 근거(대본의 결정적인 줄)는 291차 워크로그 §3에 있다.
 */
import type { QuestMeetingDef } from '../types/Story.js';

export const QUEST_MEETING: Readonly<Record<string, QuestMeetingDef>> = {
};
