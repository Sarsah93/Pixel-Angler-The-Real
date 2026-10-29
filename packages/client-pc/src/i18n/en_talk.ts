/**
 * @file en_talk.ts
 * @description 286차 — 대본(주고받는 장면) · 거절 = 실패 · 장면 속 건네받기 영문.
 *
 * 대본의 말 · 몸짓 지문 · 일지 문장은 core `allTalkLines()`(Ko/En 쌍)가 정본이다 — 여기는 화면 문구와 문장 규칙만 둔다.
 */

type Tr = (s: string) => string;
type TalkRule = [RegExp, (m: RegExpMatchArray, tr: Tr) => string];

export const EN_TALK: Record<string, string> = {
  // 아이템
  '담배 한 갑': 'A pack of cigarettes',
  '기호품': 'Smokes',
  // 일지 · 대화창 — 받는 자리에서 끝내 거절(실패)
  '실패 — 거절': 'Failed — declined',
  '거절한 의뢰 — 그 일은 내 손을 떠났습니다.': 'Declined — that matter has left my hands.',
  '(결국 거절했다. 그 일은 여기서 내 손을 떠났다.)': '(In the end I said no. The matter left my hands there.)',
};

export const EN_TALK_RULES: TalkRule[] = [
  [/^\[할 일\] (.+) — 실패 \(거절\)$/, (m, tr) => `[Task] ${tr(m[1])} — failed (declined)`],
  [/^\[할 일\] (.+?)[이가] 건넨 것 — (.+)$/, (m, tr) => `[Task] ${tr(m[1])} handed you — ${m[2].split(' · ').map((x) => tr(x)).join(' · ')}`],
];
