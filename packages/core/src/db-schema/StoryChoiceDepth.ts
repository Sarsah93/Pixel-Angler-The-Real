/**
 * @file StoryChoiceDepth.ts
 * @description 253차 — 모든 퀘스트(188편)의 **받는 자리 · 끝내는 자리 답을 3개 이상**으로 늘리고, 답마다 응답을 길게 한다.
 *
 * 왜(사용자 지시 원문): 「퀘스트 선택지 다양성 및 선택에 따른 더 긴 대사와 유저의 선택가능한 자유 대답(선택지 3개 이상) 추가」.
 *  - 252차까지 메인 68편의 받는 자리 답은 표준 톤 두 줄(「…알겠습니다 / 자신은 없는데, 해 보겠습니다」 — 응답 평균 14자)이었고,
 *    끝내는 자리 답이 둘뿐인 편이 62편이었다.
 *
 * 합치는 순서(`StoryChoices.choicesFor`)
 *  - 받는 자리 = 나레이션 답(`StoryNarrative` offerChoices) + `offerAdd` → 없으면 `offer` → 퀘스트 정의 → 표준 톤.
 *  - 끝내는 자리 = 나레이션 답 + `completeAdd`.
 *  - `offerReply` · `completeReply`는 이미 있는 답의 **응답만** 길게 바꾼다(id · 결과 · 라벨은 그대로 — 세이브 · 플래그 보존).
 *
 * 집필 기준(이 파일들을 쓰는 사람 · 도구 공통)
 *  1. 답(라벨)은 주인공이 그 자리에서 실제로 하는 말이다. 같은 뜻의 답 둘은 안 된다 — 수긍 · 되묻기(그 말 속 사람 · 낱말 · 사정) ·
 *     솔직한 망설임 · 농담이나 반발 · 조건 묻기처럼 **태도가 갈린다**. 한국어 8~40자 · 영어 90자 이하.
 *     상대가 어른이면 존댓말(합니다체 · 해요체). 또래(도현수 · 배누리 · 탁새벽 등)에게는 관계에 맞게.
 *  2. 응답(상대의 말)은 두세 문장 이상, 한국어 60~220자. 길면 빈 줄(`\n\n`)로 두 단락 — 대화창이 단락마다 ▼로 끊어 찍는다.
 *     한국어 · 영어의 단락 수는 같다. 따옴표는 쓰지 않는다(대화창이 붙인다). 몸짓은 괄호 지문.
 *     그 인물의 말투를 지킨다 — 같은 편 나레이션의 offer · done 문장을 먼저 읽는다.
 *  3. 받는 자리 결과는 우호도(`affinity` — 메인 ±0.06 안 · 서브 ±0.08 안) · 플래그(`choice.<편>_<뜻>`) · 미루기(`decline`)만.
 *     돈 · 물건 · 숙련도는 끝내는 자리에서만(받기도 전에 보상은 없다).
 *  4. 끝내는 자리 더하기는 이미 있는 답과 결과 · 태도가 겹치지 않게. 메인은 우호도 · 평판(`seaRep` · `harborRep` 소량) · 플래그만(메인 제약),
 *     서브는 품삯(`payMult`) · 가르침(`proficiency`) · 사양(우호도 · 신뢰) 중 그 편에 없는 결.
 *  5. 응답 늘리기(`*Reply`)는 기존 응답을 **앞에 그대로 두고** 한 단락을 잇는다 — 기존 괄호 지문(보상을 드러내는 문장)은 지우지 않는다.
 *  6. 스포일러 금지(R2) — 그 편보다 뒤에 밝혀지는 사실(떠돌이의 정체 · 조합장의 직함 · 사진 속 천막 · 남편 사연 등)을 앞당겨 말하지 않는다.
 *     얼버무림 · 말 돌리기는 좋다. 개발 용어 · 내부 id · 이모지 금지(R1 · §8).
 *  7. 영어는 자연스러운 구어. 인물 · 장소 표기는 `StoryNarrativeEn`과 같게(Jeong Okseon · Do Hyeonsu · Kang Ducheol · Manbok Store · Sokcho … — 이름에 붙임표 없음).
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { CHOICE_DEPTH_1 } from './StoryChoiceDepth1.js';
import { CHOICE_DEPTH_2 } from './StoryChoiceDepth2.js';
import { CHOICE_DEPTH_3 } from './StoryChoiceDepth3.js';
import { CHOICE_DEPTH_4 } from './StoryChoiceDepth4.js';
import { CHOICE_DEPTH_5 } from './StoryChoiceDepth5.js';
import { CHOICE_DEPTH_6 } from './StoryChoiceDepth6.js';
import { CHOICE_DEPTH_7 } from './StoryChoiceDepth7.js';
import { CHOICE_DEPTH_8 } from './StoryChoiceDepth8.js';

/** 퀘스트 id → 답 깊이 */
export const STORY_CHOICE_DEPTH: Readonly<Record<string, ChoiceDepthEntry>> = {
  ...CHOICE_DEPTH_1, ...CHOICE_DEPTH_2, ...CHOICE_DEPTH_3, ...CHOICE_DEPTH_4,
  ...CHOICE_DEPTH_5, ...CHOICE_DEPTH_6, ...CHOICE_DEPTH_7, ...CHOICE_DEPTH_8,
};

export function choiceDepthOf(questId: string): ChoiceDepthEntry | undefined {
  return STORY_CHOICE_DEPTH[questId];
}
