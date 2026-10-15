/**
 * @file StoryInquiry1.ts
 * @description 253차 — 물어보기 1묶음: 속초 사람들(정옥선 · 어촌계 · 도현수 · 탁만수 · 탁새벽)에게 묻는 화제와 답.
 *              쓰는 규칙은 `StoryInquiry.ts` 머리 주석 · 판정은 `rules/Inquiry.ts`.
 */

import type { InquiryNodeDef, InquiryTopicDef } from '../types/Story.js';
import { ask } from './StoryInquiryKit.js';

/** 이 묶음에서 새로 여는 화제(공통 화제는 `StoryInquiry.ts`) */
export const INQUIRY_TOPICS_1: InquiryTopicDef[] = [];

export const INQUIRY_NODES_1: InquiryNodeDef[] = [
  // ── 정옥선 — 기준 예시(253차 — 다른 사람도 이 밀도로) ───────────────
  ask('okseon.photo', 'okseon', 'c_photo', '이 사진, 어디서 찍은 건지 아시겠어요?', 'Can you tell where this photo was taken?',
    '(사진을 받아 들고 한참 들여다본다.) 영금정 바위는 그대로네. 저 바위는 오십 년째 저 모양이다.\n\n뒤에 찍힌 천막들은… 그 시절엔 다 저랬어. 좌판마다 천막을 쳤지. 사진은 잘 넣어 둬라. 젖으면 못 쓴다.',
    '(She takes the photo and studies it for a long while.) The Yeonggeumjeong rocks haven\'t changed. That rock has looked like that for fifty years.\n\nThe tents behind… everything looked like that back then. Every stall put up a tent. Keep that photo safe. Once it gets wet it\'s done for.',
    { requires: { questNotDone: 'M7-04' } }),
  ask('okseon.photo_after', 'okseon', 'c_photo', '그 천막 시절 얘기, 조금만 더 해 주세요.', 'Tell me a little more about the tent days.',
    '천막은 바람 불면 다 같이 붙잡는 거였다. 남의 천막도. 그게 좌판 사람들 법이었지.\n\n네 살짜리가 그 앞에 서 있었다. 기억 안 나도 된다. 내가 기억하니까.',
    'When the wind came up, everyone held the tents down together. Other people\'s too. That was the law of the stalls.\n\nA four-year-old stood in front of mine. You don\'t have to remember. I do.',
    { requires: { questDone: 'M7-04' }, effect: { affinity: 0.02 } }),
  ask('okseon.father', 'okseon', 'p_father', '혹시 저희 아버지를 아셨어요?', 'Did you happen to know my father?',
    '(손을 멈추지 않는다.) 이 항구엔 아버지들이 많았다. 다 비슷하게 생겼어. 바다 사람 얼굴은 바람이 깎으니까.\n\n네 아버지가 어떤 사람이었는지는 네가 더 잘 알겠지. 대를 봐라. 손잡이 닳은 자리가 말해 준다.',
    '(Her hands don\'t stop.) This harbour had plenty of fathers. They all looked alike. The wind carves a sea face.\n\nWhat kind of man your father was, you know better than me. Look at the rod. The worn spot on the grip will tell you.',
    { requires: { questNotDone: 'M7-04' }, opens: ['c_father_rod'] }),
  ask('okseon.law', 'okseon', 'w_law_five', '다섯 가지 법, 한 번만 다시 짚어 주세요.', 'Could you go over the five rules once more?',
    '잘 들어. 낚싯대로 잡은 건 못 판다. 계원 아니면 쓸 수 있는 어구가 정해져 있다. 불법으로 잡은 건 갖고 있지도 마라.\n\n작은 놈하고 금어기 놈은 놓아준다. 마을 앞바다 전복 · 해삼은 어촌계 허락 없이 손대지 마. 다섯이다. 손가락 다 접었지.',
    'Listen. What a rod catches, you can\'t sell. If you\'re not a member, the gear you may use is fixed. Don\'t even keep anything taken illegally.\n\nThe small ones and the out-of-season ones go back. The abalone and sea cucumber off the village, hands off without the co-op\'s say. That\'s five. All your fingers folded.',
    { opens: ['w_size_limit', 'w_closed_season', 'p_coop'] }),
  ask('okseon.law.who', 'okseon', 'w_law_five', '그 법은 누가 정한 거예요?', 'Who made those rules?',
    '나라가 정한 게 있고, 어촌계가 정한 게 있다. 나라 법은 해경이 보고, 마을 법은 계장이 본다.\n\n둘 다 바다가 먼저 정했다고 생각해라. 사람은 받아 적었을 뿐이야.',
    'Some the country made, some the co-op made. The coast guard watches the country\'s, the chief watches the village\'s.\n\nThink of it as the sea deciding first. People only wrote it down.',
    { parent: 'okseon.law', opens: ['p_coop'] }),
  ask('okseon.member', 'okseon', 'w_coop_member', '계원은 어떻게 하면 될 수 있어요?', 'How does someone become a member?',
    '아무나 못 된다. 그 바다에서 일한 날이 쌓여야 해. 계장 밑에서 실습부터 하는 거다.\n\n계원이 돼도 낚싯대로 잡은 건 못 판다. 통발 · 그물로 잡은 것만 위판에 낸다. 그거 헷갈리는 놈이 제일 많아.',
    'Not just anyone. You need days of work on that sea behind you. You start as a trainee under the chief.\n\nEven as a member, what a rod catches you can\'t sell. Only trap and net catch goes to auction. That\'s what trips up the most people.',
    { opens: ['p_coop', 'w_trap', 'w_wipan'] }),
  ask('okseon.measure', 'okseon', 'c_measure', '이 계측자, 정말 받아도 되는 거예요?', 'Are you sure I can keep this measuring rule?',
    '쓰라고 준 거다. 서랍에서 녹스는 것보다 낫지. (눈금 지워진 자리를 엄지로 문지른다.)\n\n금지체장 칸만 보면 된다. 나머지 눈금은 손이 기억해. 너도 곧 그렇게 된다.',
    'I gave it to you to use. Better than rusting in a drawer. (She rubs the worn marks with her thumb.)\n\nJust watch the minimum-size line. Your hands remember the rest of the marks. Yours will too, soon enough.',
    { opens: ['w_size_limit'] }),
  ask('okseon.hyeonsu', 'okseon', 'p_hyeonsu', '도현수는 원래 저렇게 까칠해요?', 'Is Hyeonsu always that prickly?',
    '계장 손자다. 어릴 때부터 이 방파제에서 컸어. 남이 제 바다에 들어오는 게 싫은 거지.\n\n못된 애는 아니다. 말이 먼저 나가서 그렇지. 같이 일해 보면 안다.',
    'He\'s the chief\'s grandson. Grew up on this breakwater. He doesn\'t like strangers walking into his sea.\n\nHe\'s not a bad kid. His mouth just gets there first. Work beside him and you\'ll see.',
    { opens: ['p_coop'] }),
];
