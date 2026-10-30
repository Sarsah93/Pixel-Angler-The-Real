/**
 * @file StoryTalks.ts
 * @description 254차 — 이어지는 대화(갈래) 모음. 묶음 파일을 합칠 뿐 — 쓰는 규칙은 아래.
 *
 * 왜(사용자 지시 원문 요지): 「대화 선택지에 따라 대화 대상에 대한 우호도가 감소하거나 증가 … A의 말에 B 편을 드는 듯한 답을 하면
 *  A의 우호도가 떨어지고 "너는 지금 누구 편을 드는 거냐" → "둘 다 같은 사람인 것 같습니다" → "너는 나를 도울 생각이 없는 거지?" …
 *  B에게 가서 사실대로 말하거나 감추고 A가 원한 대로 자극하거나 … 양 끝 사이에 중도도 있다」.
 *
 * 쓰는 규칙(묶음 파일 · 집필 도구 공통 — `rules/StoryTalk.ts` `validateTalks`가 검사한다)
 *  1. 대화 = 단계(상대 대사 + 고를 말 1~4개)의 그래프. 고른 말 하나가 **여러 사람**의 우호도를 바꿀 수 있다(그 자리에 없는 사람도 —
 *     전해 듣거나 길 건너에서 보고 있다). 한 번에 ±0.15 안. 같은 말은 처음 고를 때 한 번만 센다(되돌아 다시 골라도 쌓이지 않는다).
 *  2. 고른 말은 표시(`choice.<편 소문자>_<뜻>`)를 남긴다. 뒤 대화의 고를 말이 그 표시 · 우호도로 열리고 닫힌다(`requires`).
 *     단계마다 조건 없는 말이 하나는 있어야 한다(막힘 금지) · 모든 단계는 끝에 닿아야 한다.
 *  3. 끝(`end`)은 대화가 열린 자리마다 뜻이 다르다 — 받는 자리 = 받기/미루기(메인은 미루지 않는다) · 진행 중 = 그 목표/단계가 닫힌다 ·
 *     끝내는 자리 = 보상 답(`complete` — 그 편 끝내는 자리 답 id) · 결말(`ending` — 결말이 여럿인 이야기의 마지막 편).
 *  4. 말투 · 글: 상대 대사는 그 인물의 말투(같은 편 나레이션 offer · done을 먼저 읽는다). 따옴표 없음(대화창이 붙인다) ·
 *     몸짓은 괄호 · 긴 대사는 빈 줄로 단락 · 한 · 영 단락 수 같게 · 이모지 · 내부 id · 개발 용어(우호도 · 퀘스트 …) 금지.
 *     주인공의 말(라벨)은 실제로 입으로 하는 말 — 8~45자 · 몸짓만 하는 답은 괄호로.
 *  5. 스포일러 금지(R2) — 그 편보다 뒤에 밝혀질 사실을 앞당기지 않는다.
 *
 * 290차 — 의뢰인이 있는 편은 모두 받는 자리 · 끝내는 자리 대본(주고받는 장면)을 갖는다. 묶음 파일 = 이야기마다 하나(`StoryTalk<이야기>.ts`).
 *  지침 `.agents/inputs/290_talk_brief.md` · 덮개 검사 `talkCoverageIssues` · 호칭 「OOO 씨」(`rules/PlayerAddress.ts`).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { TALKS_M1 } from './StoryTalkM1.js';
import { TALKS_M2 } from './StoryTalkM2.js';
import { TALKS_M3 } from './StoryTalkM3.js';
import { TALKS_M4 } from './StoryTalkM4.js';
import { TALKS_M5 } from './StoryTalkM5.js';
import { TALKS_M6 } from './StoryTalkM6.js';
import { TALKS_M7 } from './StoryTalkM7.js';
import { TALKS_N01 } from './StoryTalkN01.js';
import { TALKS_N02 } from './StoryTalkN02.js';
import { TALKS_N03 } from './StoryTalkN03.js';
import { TALKS_N04 } from './StoryTalkN04.js';
import { TALKS_N05 } from './StoryTalkN05.js';
import { TALKS_N06 } from './StoryTalkN06.js';
import { TALKS_N07 } from './StoryTalkN07.js';
import { TALKS_N08 } from './StoryTalkN08.js';
import { TALKS_N09 } from './StoryTalkN09.js';
import { TALKS_N10 } from './StoryTalkN10.js';
import { TALKS_N11 } from './StoryTalkN11.js';
import { TALKS_N12 } from './StoryTalkN12.js';
import { TALKS_N13 } from './StoryTalkN13.js';
import { TALKS_N14 } from './StoryTalkN14.js';
import { TALKS_N15 } from './StoryTalkN15.js';
import { TALKS_N16 } from './StoryTalkN16.js';
import { TALKS_N17 } from './StoryTalkN17.js';
import { TALKS_N18 } from './StoryTalkN18.js';
import { TALKS_N19 } from './StoryTalkN19.js';
import { TALKS_N20 } from './StoryTalkN20.js';
import { TALKS_N21 } from './StoryTalkN21.js';
import { TALKS_N22 } from './StoryTalkN22.js';
import { TALKS_N23 } from './StoryTalkN23.js';
import { TALKS_N24 } from './StoryTalkN24.js';

export const STORY_TALKS: readonly StoryTalkDef[] = [
  ...TALKS_M1, ...TALKS_M2, ...TALKS_M3, ...TALKS_M4, ...TALKS_M5, ...TALKS_M6, ...TALKS_M7,
  ...TALKS_N01, ...TALKS_N02, ...TALKS_N03, ...TALKS_N04, ...TALKS_N05, ...TALKS_N06, ...TALKS_N07, ...TALKS_N08, ...TALKS_N09, ...TALKS_N10, ...TALKS_N11, ...TALKS_N12,
  ...TALKS_N13, ...TALKS_N14, ...TALKS_N15, ...TALKS_N16, ...TALKS_N17, ...TALKS_N18, ...TALKS_N19, ...TALKS_N20, ...TALKS_N21, ...TALKS_N22, ...TALKS_N23, ...TALKS_N24,
];
