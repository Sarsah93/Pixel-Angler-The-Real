/**
 * @file StoryTalkM2.ts
 * @description 254차 — 제2부 「위판」 이어지는 대화(M2-09 「총회」). 규칙은 `StoryTalks.ts` 머리 주석.
 *
 * 인물: 동명항 어촌계 계장(도현수의 할아버지 — 짧게, 규칙으로 말한다 · 나를 「너」라 부른다 · 「계장이 한 사람 편 들면 그날로 계가 아니다」)
 *       · 도현수(24 · 라이벌 — 퉁명스러운 반말 · 문간에서 「네가 싫어서가 아니야」 한마디만 남긴다).
 * 정본: 메인 편이라 받는 자리는 늘 받는다 · 반대표의 까닭은 끝내 나오지 않는다(나레이션 · 물어보기와 같다 — 「표는 표야」).
 *  갈래는 계장 · 도현수의 마음과, 정옥선의 마음(보증서 도장 — 총회장에서 손자 탓을 하면 그 도장이 같이 욕먹는다)만 바꾼다.
 *  뒤 편(다음 표결에서 도현수가 어느 쪽에 손을 드는지)은 앞당기지 않는다.
 *
 * 표시(남기는 곳 → 읽는 곳)
 *  - choice.m2_09_asked_favor     받는 자리(계장에게 손자에게 한마디 넣어 달라 했다) → 끝내는 자리(도현수에게 그것 때문이냐고 묻는다)
 *  - choice.m2_09_owned_unsold    받는 자리(유찰된 상자를 내 입으로 먼저 꺼내겠다) → 끝내는 자리(그게 표가 됐느냐고 묻는다)
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, say, endTalk } from './StoryTalkKit.js';

const COOP = 'coop';
const HS = 'hyeonsu';
const OK = 'okseon';

export const TALKS_M2: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // M2-09 「총회」 — 받는 자리(어촌계장) · 메인 — 미루는 끝이 없다
  // ═══════════════════════════════════════════
  {
    id: 'm2_09_offer', questId: 'M2-09', at: 'offer', npcId: COOP, start: 'start',
    nodes: {
      start: say(
        '(서류철을 탁자에 내려놓는다.) 분기 총회다. 지위 심사. 네가 부산에서 한 일이 표가 된다. 네 이름이 항구에서 어떻게 도는지도 같이 본다.\n\n위판 다섯 건은 채워 와. 그 밑으로는 아무리 성실해도 손이 안 올라간다. 나는 그날 아무 말 안 한다.',
        "(He sets a file down on the table.) The quarterly meeting. A review of your standing. What you did in Busan turns into votes. How your name goes round the harbour gets weighed too.\n\nBring in five consigned lots. Below that, however hard you've worked, no hands go up. And on the day, I say nothing.",
        [
          opt('five_lots', '다섯 건 채워서 서겠습니다.', "I'll fill the five and stand.",
            { stance: 'giver', aff: { [COOP]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '그래. 그날은 서 있어라. 서서 듣는 것도 심사다.',
              lineEn: 'Good. On the day, stay on your feet. Standing and listening is part of the review.' }) }),
          opt('ask_rival', '도현수도 그날 손을 듭니까?', 'Will Do Hyeonsu raise his hand that day too?',
            { stance: 'mid', next: 'rival' }),
          opt('unsold', '부산에서 한 일이면, 유찰된 상자 얘기도 나오겠군요.', "If it's what I did in Busan, the unsold crate will come up too.",
            { stance: 'self', next: 'record' }),
        ]),
      rival: say(
        '계원이면 다 든다. 그 애도. (안경을 고쳐 쓴다.)\n\n누가 어디에 손 드는지는 미리 묻는 게 아니다. 그날 보면 안다. 어디에 들든 그건 그 애 표다.',
        "Every member does. Him too. (He pushes his glasses up.)\n\nYou don't ask ahead where people's hands will go. You'll see on the day. Wherever his goes, it's his vote.",
        [
          opt('his_vote', '도현수 표는 도현수 거지요. 저는 제 실적만 챙기겠습니다.', "Hyeonsu's vote is his. I'll look after my own record.",
            { stance: 'other', aff: { [COOP]: 0.03, [HS]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '(처음으로 고개를 끄덕인다.) 그 말이면 됐다. 다섯 건 채워서 서라.',
              lineEn: '(For the first time, he nods.) That\'ll do. Fill your five and stand.' }) }),
          opt('put_word', '할아버지시니, 한마디 넣어 주실 수는 없겠습니까?', "You're his grandfather. Couldn't you put in a word with him?",
            { stance: 'self', aff: { [COOP]: -0.06, [HS]: -0.03 }, flags: ['choice.m2_09_asked_favor'], next: 'no_favor' }),
        ]),
      no_favor: say(
        '(서류철을 덮는다.) 손자다. 그래서 더 안 봐준다. 계장이 한 사람 편 들면 그날로 계가 아니다.\n\n그리고 그 말, 그 애 귀에도 들어간다. 계는 좁아. 네가 그런 부탁을 했다는 것까지 다 돈다.',
        "(He closes the file.) He's my grandson. Which is exactly why he gets no favours. The day the chief takes one person's side, it stops being a co-op.\n\nAnd what you just said will reach his ears too. The co-op is a small world. Even the fact that you asked will go round.",
        [
          opt('withdraw', '제가 잘못 여쭸습니다. 실적으로만 서겠습니다.', "I shouldn't have asked. I'll stand on my record alone.",
            { stance: 'giver', aff: { [COOP]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '그래. 그게 계원 답이다. 다섯 건, 잊지 마라.',
              lineEn: "Right. That's a member's answer. Five lots. Don't forget." }) }),
          opt('only_asked', '여쭤본 것뿐입니다.', 'I was only asking.',
            { stance: 'self', aff: { [COOP]: -0.02 }, end: endTalk({ accept: true,
              lineKo: '묻는 것도 표다. (서류철을 내 쪽으로 민다.) 가서 다섯 건이나 채워 와.',
              lineEn: 'Asking is a vote too. (He pushes the file towards me.) Go and fill your five.' }) }),
        ]),
      record: say(
        '나온다. 얼음 아껴서 유찰된 것까지 다. (서류철을 한 장 넘긴다.) 심사는 잘한 것만 보는 자리가 아니다.\n\n감추면 감춘 게 나오고, 꺼내면 꺼낸 게 나온다. 어느 쪽이 표가 되는지는 너도 알 거다.',
        "It will. Right down to the lot that went unsold because you skimped on ice. (He turns a page in the file.) A review isn't only for looking at what went well.\n\nHide it and the hiding comes out. Bring it up and the bringing up comes out. You know which one turns into votes.",
        [
          opt('own_it', '제가 먼저 꺼내겠습니다. 얼음을 아낀 건 제 잘못입니다.', "I'll bring it up myself. Skimping on ice was my mistake.",
            { stance: 'giver', aff: { [COOP]: 0.05 }, flags: ['choice.m2_09_owned_unsold'], end: endTalk({ accept: true,
              lineKo: '(서류철에 무언가를 적는다.) 그 말 그대로 총회장에서 해라. 손이 올라갈 거다.',
              lineEn: '(He writes something in the file.) Say exactly that at the meeting. Hands will go up.' }) }),
          opt('leave_out', '그 얘기는 빼 주시면 안 됩니까?', "Couldn't that part be left out?",
            { stance: 'self', aff: { [COOP]: -0.05 }, end: endTalk({ accept: true,
              lineKo: '(안경 너머로 나를 본다.) 나는 아무 말 안 한다고 했다. 꺼낼지 말지는 계원들이 정한다. 다섯 건이나 채워 와.',
              lineEn: '(He looks at me over his glasses.) I told you I say nothing. Whether it comes up is for the members. Just fill your five.' }) }),
        ]),
    },
  },

  // M2-09 — 끝내는 자리(어촌계장). 총회가 끝난 회의실 — 도현수가 문간에서 걸음을 멈춘다
  {
    id: 'm2_09_done', questId: 'M2-09', at: 'complete', npcId: COOP, start: 'start',
    nodes: {
      start: say(
        '(회의실 의자가 하나둘 비어 간다. 계장이 명부를 덮는다.) 통과다. 도현수가 반대했지. 하나.\n\n이유는 그 애한테 들어. 나는 거기 계장으로 앉아 있었다. 할아버지로 앉아 있던 게 아니다.',
        "(The chairs in the meeting room empty one by one. The chief closes the roll.) Passed. Do Hyeonsu voted against. One.\n\nAsk him for the reason. I sat there as the chief. Not as his grandfather.",
        [
          opt('ask_him', '도현수한테 직접 묻겠습니다.', "I'll ask Hyeonsu myself.",
            { stance: 'giver', next: 'door' }),
          opt('as_grandpa', '할아버지로서는, 그 표가 어떠셨습니까?', 'And as his grandfather? How did that vote sit with you?',
            { stance: 'mid', next: 'grandpa' }),
          opt('shamed', '할아버지 앞에서 손자가 망신을 준 셈 아닙니까.', 'Isn\'t that your grandson shaming me in front of you?',
            { stance: 'self', aff: { [COOP]: -0.05, [HS]: -0.04, [OK]: -0.02 }, next: 'shame' }),
          opt('one_is_fine', '하나쯤은 괜찮습니다. 통과했으니까요.', "One's fine. I passed.",
            { stance: 'self', end: endTalk({ complete: 'ignore',
              lineKo: '그것도 방법이다. 다만 그 하나가 누군지는 잊지 마라. (봉투를 내민다.)\n\n계에서 격려금이다. 쓸 데 알지.',
              lineEn: "That's one way. Just don't forget whose one it was. (He holds out an envelope.)\n\nAn allowance from the co-op. You know what it's for." }) }),
        ]),
      door: say(
        '(문간을 나서던 도현수가 걸음을 멈춘다. 돌아보지는 않는다.) …네가 싫어서가 아니야.\n\n(그 말만 하고 서 있다. 더 붙일 말은 없어 보인다.)',
        "(On his way out through the door, Do Hyeonsu stops. He doesn't turn round.) ...It isn't because I dislike you.\n\n(Having said it, he just stands there. He doesn't seem to have anything to add.)",
        [
          opt('then_why', '그럼 왜 반대했어?', 'Then why vote against?',
            { stance: 'giver', aff: { [HS]: -0.02 }, next: 'vote_is_vote' }),
          opt('thanks_no', '반대표, 고맙다. 덕분에 내 숫자를 다시 봤어.', 'Thanks for the no. It made me look at my numbers again.',
            { stance: 'other', aff: { [HS]: 0.07, [COOP]: 0.02 }, next: 'thanked' }),
          opt('favor_q', '혹시 내가 계장님께 부탁드린 것 때문이야?', 'Is it because I asked your grandfather for a favour?',
            { stance: 'mid', aff: { [HS]: -0.03 }, requires: { flag: 'choice.m2_09_asked_favor' }, next: 'favor' }),
          opt('nod_back', '(그 등에 대고 고개만 끄덕인다.)', '(I just nod at his back.)',
            { stance: 'self', aff: { [HS]: 0.02 }, end: endTalk({ complete: 'ask_hyeonsu',
              lineKo: '(도현수가 나가고 문이 닫힌다. 계장이 봉투를 건넨다. 생각보다 두툼하다.) …그 애한테는 그걸로 됐다. 따지고 들면 입부터 닫는 애다.\n\n격려금이다. 얼음을 사든 상자를 사든 네 마음대로 써라.',
              lineEn: "(Hyeonsu leaves and the door closes. The chief hands me an envelope. It's thicker than I expected.) ...With him, that's enough. Push him and the first thing he does is shut his mouth.\n\nYour allowance. Spend it on ice or crates, however you like." }) }),
        ], HS),
      vote_is_vote: say(
        '표는 표야. (주머니에 손을 넣는다.) 이유를 달면 그때부터 표가 아니라 말싸움이 돼.\n\n통과했으면 됐잖아. …다음 총회 때 보자.',
        "A vote's a vote. (He puts his hands in his pockets.) Hang reasons on it and from then on it isn't a vote, it's an argument.\n\nYou passed, didn't you. ...See you at the next meeting.",
        [
          opt('see_you_next', '알았어. 다음 총회 때 보자.', 'Fine. See you at the next one.',
            { stance: 'other', aff: { [HS]: 0.03 }, end: endTalk({ complete: 'ask_hyeonsu',
              lineKo: '(문이 닫힌다. 계장이 봉투를 건넨다. 액수가 생각보다 크다.) 물을 땐 따지지 말고 물어라. 그 애는 따지고 들면 입부터 닫는다.\n\n격려금이다. 쓸 데 알지.',
              lineEn: "(The door closes. The chief hands me an envelope. There's more in it than I expected.) When you ask, ask. Don't accuse. Push him and the first thing he does is shut his mouth.\n\nYour allowance. You know what it's for." }) }),
          opt('argue_then', '말싸움이라도 좋으니까 말해 봐.', "I don't care if it's an argument. Tell me.",
            { stance: 'self', aff: { [HS]: -0.05 }, end: endTalk({ complete: 'ignore',
              lineKo: '(도현수가 대답 없이 나간다. 문이 세게 닫힌다. 계장이 한숨을 쉰다.) …봤지. 따지면 입부터 닫는 애다.\n\n(봉투를 내민다.) 격려금이다. 반대표는 적이 아니라 숙제다. 그 하나가 누군지는 잊지 마라.',
              lineEn: "(Hyeonsu leaves without answering. The door slams. The chief sighs.) ...You saw. Push him and the first thing he does is shut his mouth.\n\n(He holds out an envelope.) Your allowance. A vote against isn't an enemy, it's homework. Don't forget whose it was." }) }),
        ], HS),
      thanked: say(
        '(처음으로 돌아본다.) …고맙다고? 반대표가?\n\n(한참 나를 본다.) 별나네, 너. (그래도 입꼬리가 조금 올라간다.) 숫자 다시 봤으면 됐네. 다음엔 반대 안 할 수도 있고. …할 수도 있고.',
        "(For the first time, he turns round.) ...Thanks? For a vote against?\n\n(He looks at me a long while.) You're an odd one. (Still, the corner of his mouth lifts a little.) If you looked at your numbers again, good. Next time I might not vote against. ...Or I might.",
        [
          opt('see_you', '그래. 다음 총회 때 보자.', 'Right. See you at the next meeting.',
            { stance: 'other', aff: { [HS]: 0.02 }, end: endTalk({ complete: 'ask_hyeonsu',
              lineKo: '(도현수가 나가고 문이 닫힌다. 계장이 한참 문 쪽을 본다.) …그 애가 돌아보는 건 나도 오랜만에 본다.\n\n(봉투를 건넨다. 생각보다 두툼하다.) 격려금이다. 쓸 데 알지.',
              lineEn: "(Hyeonsu leaves and the door closes. The chief looks at the door for a long while.) ...It's been a long time since I saw him turn round, myself.\n\n(He hands me an envelope. It's thicker than I expected.) Your allowance. You know what it's for." }) }),
        ], HS),
      favor: say(
        '…그런 말 들으면 손 더 들고 싶어지긴 하지. (돌아본다.) 근데 그것 때문은 아니야.\n\n그건 진짜야. 할아버지는 원래 아무 말 안 해. 너도 알잖아.',
        "...Hearing that does make you want to raise your hand all the more. (He turns round.) But that's not why.\n\nThat much is true. Grandfather never says anything anyway. You know that.",
        [
          opt('my_mistake', '그 부탁은 내가 잘못했어.', 'Asking him was wrong of me.',
            { stance: 'other', aff: { [HS]: 0.04 }, end: endTalk({ complete: 'ask_hyeonsu',
              lineKo: '(도현수가 고개를 한 번 까딱하고 나간다.) …사과할 줄 아는 놈이면 표는 다음에 따라온다.\n\n(봉투를 건넨다.) 격려금이다. 쓸 데 알지.',
              lineEn: '(Hyeonsu gives a single nod and leaves.) ...If you know how to apologise, the votes come round next time.\n\n(He hands me an envelope.) Your allowance. You know what it\'s for.' }) }),
        ], HS),
      grandpa: say(
        '어떻긴. 총회에선 손자도 계원 하나다. (명부를 덮는다.)\n\n…그 애 표는 그 애 거다. 이유도 그 애 거고. 다만 그 애는 아무 이유 없이 손 드는 애가 아니다. 그건 알아 둬라.',
        "How should it sit? At a general meeting my grandson is just one member. (He closes the roll.)\n\n...His vote is his. So is his reason. But he isn't one to raise his hand for no reason. Know that much.",
        [
          opt('hear_someday', '알겠습니다. 이유는 언젠가 본인한테 듣겠습니다.', "Understood. Someday I'll hear the reason from him.",
            { stance: 'giver', aff: { [COOP]: 0.03 }, end: endTalk({ complete: 'ask_grandfather',
              lineKo: '그래. 언젠가. (봉투를 내민다.) 계에서 격려금이다.\n\n그 애 얘기는 그 애한테 들어라. 할아버지가 하는 손자 얘기는 다 팔이 안으로 굽은 얘기다.',
              lineEn: 'Right. Someday. (He holds out an envelope.) An allowance from the co-op.\n\nHear about him from him. Anything a grandfather says about his grandson bends his way.' }) }),
          opt('owned_q', '유찰 얘기는 제가 먼저 꺼냈습니다. 그게 표가 됐습니까?', 'I brought up the unsold lot myself. Did that turn into votes?',
            { stance: 'mid', aff: { [COOP]: 0.03 }, requires: { flag: 'choice.m2_09_owned_unsold' }, end: endTalk({ complete: 'ask_grandfather',
              lineKo: '(처음으로 웃는다. 아주 조금.) 됐지. 감추는 놈한테는 손이 안 올라간다. 그 애 손 빼고는 다 올라갔다.\n\n(봉투를 건넨다.) 격려금이다. 쓸 데 알지.',
              lineEn: "(For the first time, he smiles. Only a little.) It did. Hands don't go up for someone who hides things. Every hand went up but his.\n\n(He hands me an envelope.) Your allowance. You know what it's for." }) }),
        ]),
      shame: say(
        '(명부를 덮던 손이 멈춘다.) 망신? 표 하나가 망신이면 계원 노릇 못 한다.\n\n그리고 그 말, 여기서만 해라. 정옥선 그 양반 도장 받아서 들어온 사람이 총회장에서 손자 탓을 했다는 말이 돌면, 그 도장이 같이 욕먹는다.',
        "(His hand stops on the roll.) Shamed? If one vote shames you, you're not fit to be a member.\n\nAnd you say that here and nowhere else. If word goes round that someone who came in on Jeong Okseon's seal stood in the meeting hall blaming my grandson, that seal takes the blame with you.",
        [
          opt('spoke_wrong', '제가 말이 지나쳤습니다.', 'I spoke out of turn.',
            { stance: 'giver', aff: { [COOP]: 0.03 }, end: endTalk({ complete: 'ignore',
              lineKo: '(한숨을 쉰다.) 그래. 반대표는 적이 아니라 숙제다. 다음 총회 때 그 손이 어디로 가는지 봐라.\n\n(봉투를 내민다.) 격려금이다. 쓸 데 알지.',
              lineEn: "(He sighs.) Right. A vote against isn't an enemy, it's homework. Watch where that hand goes at the next meeting.\n\n(He holds out an envelope.) Your allowance. You know what it's for." }) }),
          opt('deserve_reason', '그래도 이유 정도는 들을 자격이 있습니다.', 'Still, I deserve to hear the reason at least.',
            { stance: 'self', aff: { [COOP]: -0.03 }, next: 'door' }),
        ]),
    },
  },
];
