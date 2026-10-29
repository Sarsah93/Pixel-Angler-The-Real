/**
 * @file StoryProgressAsk.ts
 * @description 287차 — 진행 중 물음(목표마다 「물음 · 내 답 · 조언」) 모음 · 조회 · 영어 사전 쌍 · 검사.
 *
 * 왜 바꿨나(사용자 실검증 — 「해녀의 딸」을 받은 직후 바람에게 다시 말을 걸었을 때)
 *  - 옛 진행 중 화면은 의뢰인 한 줄(`progress` — 「딸은 만나 봤나? 물속은 안 돼. 물 빠질 때, 물가에서.」)에
 *    진행 나레이션(「해야 할 것은 …」)을 붙였다. 사용자 「혼자 자문자답하고, 문장 구조가 이상하고, 문맥이 맞지 않지」
 *    · 「이 텍스트도 나오는 게 너무 이상해. 차라리 빼줘. 일지에서 확인하도록.」
 *  - 이제 의뢰인은 **지금 할 목표** 하나를 묻고(물음 하나), 고르는 말은 [내 답 · 나가기], 답하면 의뢰인이 일러 준다.
 *
 * 데이터는 의뢰인 묶음별 파일 8개(`StoryProgressAsk1~8.ts` — 한 사람의 말투가 한 파일에 모인다).
 */

import type { ProgressAskDef } from '../types/Story.js';
import { STORY_QUESTS } from './StoryQuestDatabase.js';
import { PROGRESS_ASKS_1 } from './StoryProgressAsk1.js';
import { PROGRESS_ASKS_2 } from './StoryProgressAsk2.js';
import { PROGRESS_ASKS_3 } from './StoryProgressAsk3.js';
import { PROGRESS_ASKS_4 } from './StoryProgressAsk4.js';
import { PROGRESS_ASKS_5 } from './StoryProgressAsk5.js';
import { PROGRESS_ASKS_6 } from './StoryProgressAsk6.js';
import { PROGRESS_ASKS_7 } from './StoryProgressAsk7.js';
import { PROGRESS_ASKS_8 } from './StoryProgressAsk8.js';

/** 편 id → 목표 순서대로의 물음 한 벌들 */
export const STORY_PROGRESS_ASKS: Readonly<Record<string, readonly ProgressAskDef[]>> = {
  ...PROGRESS_ASKS_1, ...PROGRESS_ASKS_2, ...PROGRESS_ASKS_3, ...PROGRESS_ASKS_4,
  ...PROGRESS_ASKS_5, ...PROGRESS_ASKS_6, ...PROGRESS_ASKS_7, ...PROGRESS_ASKS_8,
};

/** 한 목표의 진행 중 물음(없으면 undefined — 대화창은 두루 쓰는 물음으로 떨어진다) */
export function progressAskOf(questId: string, objectiveIndex: number): ProgressAskDef | undefined {
  return STORY_PROGRESS_ASKS[questId]?.[objectiveIndex];
}

/**
 * 데이터가 빠졌을 때 쓰는 두루 물음 — 검사가 빠짐을 잡으므로 실제로는 거의 안 쓰인다.
 * 말투가 사람마다 달라 반말 · 존댓말 어느 쪽에도 크게 어긋나지 않는 말로 둔다.
 */
export const PROGRESS_ASK_FALLBACK: ProgressAskDef = {
  askKo: '부탁한 일은 어떻게 돼 가요?', askEn: 'How is that errand coming along?',
  answerKo: '…아직 다 마치지 못했습니다.', answerEn: "...I haven't finished it yet.",
  replyKo: '서두를 것 없어요. 다 되면 그때 다시 와요.', replyEn: 'No rush. Come back when it is done.',
};

/** 사전 합류용 ko → en 쌍 */
export function allProgressAskLines(): [string, string][] {
  const out: [string, string][] = [];
  const all = [...Object.values(STORY_PROGRESS_ASKS).flat(), PROGRESS_ASK_FALLBACK];
  for (const p of all) out.push([p.askKo, p.askEn], [p.answerKo, p.answerEn], [p.replyKo, p.replyEn]);
  return out;
}

/** 화면에 안 맞는 말(개발 용어) — R1 */
const DEV_WORDS = /퀘스트|인벤토리|레벨|아이템|슬롯|경험치|게임|UI/;
const HANGUL = /[가-힣]/;

/**
 * 검사 — 발주자가 있는 편은 목표 수만큼 물음이 있고, 물음은 하나(스스로 답하지 않는다) ·
 * 내 답은 평서문(어른에겐 존댓말 · 또래 · 아이에겐 그 사람에게 늘 쓰던 말투) · 조언은 다시 묻지 않는다 · 영어가 있다.
 */
export function validateProgressAsks(): string[] {
  const issues: string[] = [];
  const byId = new Map(STORY_QUESTS.map((q) => [q.id, q]));
  for (const id of Object.keys(STORY_PROGRESS_ASKS)) {
    const q = byId.get(id);
    if (!q) issues.push(`${id}: 없는 편의 진행 중 물음`);
    else if (!q.giver) issues.push(`${id}: 발주자가 없는 편에 진행 중 물음`);
  }
  for (const q of STORY_QUESTS) {
    if (!q.giver) continue;
    const arr = STORY_PROGRESS_ASKS[q.id];
    if (!arr) { issues.push(`${q.id}: 진행 중 물음 없음`); continue; }
    if (arr.length !== q.objectives.length) issues.push(`${q.id}: 목표 ${q.objectives.length}개인데 물음 ${arr.length}벌`);
    arr.forEach((p, i) => {
      const w = `${q.id}#${i}`;
      const ask = p.askKo.trim();
      if (!ask.endsWith('?') || (ask.match(/\?/g) ?? []).length !== 1) issues.push(`${w}: 물음은 물음표 하나로 끝난다(자문자답 금지) — 「${ask}」`);
      const ans = p.answerKo.trim();
      if (ans.includes('?') || !/(다|요)\.$/.test(ans)) issues.push(`${w}: 내 답은 평서문(-다. · -요.) — 「${ans}」`);
      if (p.replyKo.includes('?')) issues.push(`${w}: 조언은 다시 묻지 않는다 — 「${p.replyKo}」`);
      for (const s of [ask, ans, p.replyKo]) if (DEV_WORDS.test(s)) issues.push(`${w}: 개발 용어 — 「${s}」`);
      for (const s of [p.askEn, p.answerEn, p.replyEn]) if (!s.trim() || HANGUL.test(s)) issues.push(`${w}: 영어 없음 · 한글 섞임 — 「${s}」`);
    });
  }
  return issues;
}
