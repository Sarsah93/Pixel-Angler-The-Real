/**
 * @file StoryTalkN19.ts
 * @description 254차 — N19 「정옥선 · 탁만수 — 오십 년의 거리」 이어지는 대화. 규칙은 `StoryTalks.ts` 머리 주석.
 *
 * 인물: 탁만수(78 · 죽간 공방 — 짧고 자존심이 세다 · 정옥선을 끝내 「그 사람」이라고만 부른다 · 다섯째 편부터 나를 「자네」라 부른다)
 *       · 정옥선(71 · 만복상회 좌판 — 퉁명스러운 반말 · 탁만수를 「탁 씨」 「그 영감」이라 부른다).
 *       주인공은 둘 사이를 오가는 심부름꾼이다. 두 사람은 모르는 채로 같은 말을 한다
 *       (「가까워서 못 가는 데도 있다」 · 「그 사람이 뭘」 · 「아는 거하고 말하는 거는 다르다」) — 갈래가 그 겹침을 드러낸다.
 *
 * 정본(뒤 이야기가 기대는 아크 — 결말 `n19_seat` 하나): 고른 말은 우호도 · 대사 · 표시만 바꾸고 목표와 뒤 편은 그대로다.
 *  - 받침을 놓을 때 누가 보냈는지는 말하지 않았다(현장 지점 문장) · 반응 장면의 「…모르겠어요.」(사용자 각본 168차)는 고정이다.
 *    그래서 첫 편에는 「이름을 댔다」 갈래가 없다. 「말 못 한다고만 했다」가 가장 멀리 간 갈래다.
 *  - 「오십 년」은 다섯째 편(병실 앞 복도)부터 · 입원은 다섯째 편 전에 꺼내지 않는다 · 재개관식은 이 이야기에서 꺼내지 않는다.
 *  - 넷째 편 「대화를 끝까지 지켜본다」는 몇 마디뿐이다 — 끝내는 자리 답(「십 분 동안 아무 말이 없었습니다」)과 어긋나지 않게.
 *    지어낸 「고맙다」(둘째 편)가 거기서 탁만수 자신의 말이 된다 — 이 이야기의 절정.
 *
 * 표시(남기는 곳 → 읽는 곳)
 *  - choice.n19_heard_close       첫 편 받는 자리(「가까워서 못 가는 데도 있다」를 들었다) → 넷째 편 자리 고르기(정옥선도 같은 말을 한다)
 *  - choice.n19_1_said_secret     첫 편 보고(「누가 보냈는지는 말 못 한다」고 했다) → 둘째 편 받는 자리(「그게 다 말하는 거다」)
 *  - choice.n19_white_thanks      둘째 편 보고(「고맙다고 하셨습니다」 — 지어낸 말) → 셋째 편 받는 자리 · 넷째 편 지켜보기
 *  - choice.n19_thanks_confessed  둘째 편 보고(그 자리에서 바로 털어놓았다) → 셋째 · 넷째 편(지어낸 말 갈래를 닫는다)
 *  - choice.n19_thanks_owned      셋째 편(「언젠가 직접 하시지요」) → 넷째 편 지켜보기(「고마웠다」) · 다섯째 편 끝내는 자리
 *  - choice.n19_told_tak          둘째 편 보고(보낸 사람을 탁만수에게 댔다) → 셋째 편 받는 자리(「알고 먹었다」)
 *  - choice.n19_4_told_invite · choice.n19_4_sent_saebyeok   넷째 편 부르기 → 넷째 편 지켜보기
 *  - (이야기 밖) choice.m2_okseon_worry(「되돌아온 상자」 끝내는 자리 — 병원에 가 보시라 했다) → 다섯째 편 끝내는 자리
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, say, endTalk } from './StoryTalkKit.js';

const TAK = 'tak_mansu';
const OK = 'okseon';
const SAE = 'tak_saebyeok';

export const TALKS_N19: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N19-1 「얼음과 대나무」 — 받는 자리(탁만수)
  // ═══════════════════════════════════════════
  {
    id: 'n19_1_offer', questId: 'N19-1', at: 'offer', npcId: TAK, start: 'start',
    nodes: {
      start: say(
        '(평상 위에 천으로 싼 것이 놓여 있다. 칼을 쥔 채 턱으로 그것을 가리킨다.) 그거, 지나는 길에 만복상회에 좀 놓고 와라. 얼음 상자 받침이다.\n\n얼음 나르는 날이면 그 김에. 좌판 얼음통 밑에 밀어 넣기만 하면 된다. …내가 줬다고는 하지 말고.',
        "(Something wrapped in cloth lies on the bench. Knife still in hand, he points at it with his chin.) That. Drop it off at Manbok Store on your way past. It's a rest for an ice box.\n\nOn a day you're hauling ice, do it then. Just slide it under the ice tub at the stall. ...And don't say it came from me.",
        [
          opt('carry', '지나는 길에 놓고 오겠습니다. 이름은 빼고요.', "I'll drop it off on my way. Your name stays out of it.",
            { stance: 'giver', aff: { [TAK]: 0.04 }, end: endTalk({ accept: true,
              lineKo: '…그래. 이름은 빼고. (천 매듭을 한 번 더 조여서 건넨다.)\n\n두고만 와라. 무슨 말을 듣든 그냥 듣고 오고.',
              lineEn: "...Right. Leave the name out. (He pulls the knot of the cloth tighter and hands it over.)\n\nJust leave it there. Whatever you hear, just hear it and come back." }) }),
          opt('what_for', '받침 하나로 얼음이 그렇게 달라집니까?', 'Does one rest really make that much difference to the ice?',
            { stance: 'mid', next: 'rest' }),
          opt('why_not_you', '가까운데, 직접 갖다 드리시면 안 됩니까?', "It's close by. Couldn't you take it to her yourself?",
            { stance: 'other', aff: { [TAK]: -0.03 }, flags: ['choice.n19_heard_close'], next: 'close' }),
          opt('not_sneak', '남의 좌판에 몰래 물건을 두는 건 내키지 않습니다.', "I don't feel right sneaking things onto someone's stall.",
            { stance: 'self', aff: { [TAK]: -0.03 }, end: endTalk({ decline: true,
              lineKo: '…몰래가 아니다. 말을 안 할 뿐이지. (받침을 도로 평상에 내려놓는다.) 됐다, 가 봐라.',
              lineEn: "...It isn't sneaking. It's just not saying. (He sets the rest back down on the bench.) Fine. Off you go." }) }),
        ]),
      rest: say(
        '(천을 걷고 받침을 뒤집어 보인다. 마디와 마디 사이가 손가락 한 마디씩 떠 있다.) 얼음이 녹으면 물이 상자 밑에 고인다. 제 물에 잠긴 얼음은 금방 죽어.\n\n마디를 띄워 깎았으니 물은 틈으로 빠지고 바람이 든다. 반나절은 더 간다. 좌판 하는 사람한테 반나절이면 그게 돈이다.',
        "(He pulls back the cloth and turns the rest over. The nodes sit a finger's width apart.) When ice melts, water pools under the box. Ice sitting in its own water dies fast.\n\nI cut the nodes apart, so the water drains through the gaps and air gets in. It buys half a day. For someone who runs a stall, half a day is money.",
        [
          opt('fit_level', '그럼 얼음통 밑에 수평 맞춰 넣어 두겠습니다.', "Then I'll fit it under the ice tub, nice and level.",
            { stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '그래. 기울면 물이 한쪽으로 몰린다. (받침을 다시 천에 싼다.) 수평 맞추고, 이름은 빼고.',
              lineEn: 'Good. If it tilts, the water runs to one side. (He wraps the rest in the cloth again.) Keep it level, and leave my name out.' }) }),
          opt('drain_too', '얼음 나르는 김에 할머니 상자 물도 빼 드리겠습니다.', "While I'm hauling ice, I'll drain the water from her box too.",
            { stance: 'other', aff: { [TAK]: 0.02, [OK]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '(칼을 멈추고 나를 본다.) …그래 주면. 그 상자, 혼자 기울이기엔 무겁다.\n\n…그 말은 내가 한 거 아니다. 가 봐라.',
              lineEn: "(He stops the knife and looks at me.) ...If you would. That box is heavy to tip on your own.\n\n...I never said that. Go on." }) }),
        ]),
      close: say(
        '(칼을 내려놓았다가 다시 든다.) …가깝지. 가까워서 못 가는 데도 있다.\n\n묻지 마라. 늙은이 일은 늙은이가 안다. 너는 두고만 오면 돼. 그게 너한테도 편하다.',
        "(He puts down the knife, then picks it up again.) ...It is close. Some places you can't go because they're close.\n\nDon't ask. Old people's business is for old people. You just leave it there. That's easier for you too.",
        [
          opt('wont_ask', '알겠습니다. 더 묻지 않겠습니다.', "Understood. I won't ask again.",
            { stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '(고개를 한 번 끄덕인다.) 얼음 녹기 전에 가라.',
              lineEn: '(He nods once.) Go before the ice melts.' }) }),
          opt('if_asked', '할머니가 누가 두고 갔냐 물으시면요?', 'And if she asks who left it?',
            { stance: 'mid', next: 'if_asked' }),
          opt('cant_either', '직접 못 가실 일이면 저도 못 하겠습니다.', "If you can't go yourself, I can't do it either.",
            { stance: 'self', aff: { [TAK]: -0.05 }, end: endTalk({ decline: true,
              lineKo: '…그래. 너까지 못 가면 이건 평상에서 먼지나 먹겠지. (받침을 천으로 덮는다.) 가 봐라.',
              lineEn: "...Right. If you won't either, it just gathers dust on this bench. (He covers the rest with the cloth.) Go on." }) }),
        ]),
      if_asked: say(
        '…주웠다고 해라. (말해 놓고 칼끝을 내려다본다.) 아니다. 그건 거짓말이다.\n\n묻기 전에 나와라. 대답 못 할 말은 안 듣는 게 상책이다. 그래야 너도 거짓말 안 하고, 그 사람도 거짓말 안 듣지.',
        "...Say you found it. (He says it, then looks down at the tip of his knife.) No. That's a lie.\n\nGet out before she asks. Best not to hear a question you can't answer. That way you tell no lie, and she hears none.",
        [
          opt('before_asked', '묻기 전에 나오겠습니다.', "I'll be out before she asks.",
            { stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '그래. 그게 제일 낫다. (천에 싼 받침을 내 쪽으로 민다.)',
              lineEn: "Good. That's best. (He pushes the wrapped rest towards me.)" }) }),
          opt('no_lie', '물으시면 거짓말은 못 하겠습니다. 할머니한테는요.', "If she asks, I can't lie. Not to her.",
            { stance: 'other', aff: { [TAK]: -0.04 }, end: endTalk({ accept: true,
              lineKo: '(한참 나를 본다.) …그 사람한텐 다들 그렇지. 그래도 이름은 대지 마라. 그건 거짓말이 아니라 입을 다무는 거다.',
              lineEn: "(He looks at me a long while.) ...Everyone's like that with her. Still, don't give my name. That's not lying. That's keeping your mouth shut." }) }),
        ]),
    },
  },

  // N19-1 — 진행 중: 받침을 놓고 와서 알린다(「대나무 받침 전달」 셋째 단계 · 의뢰인 앞).
  //  다음 목표가 정옥선의 반응 장면(사용자 각본)이라 끝말은 모두 「얼음 보러 다시 가라」로 잇는다.
  {
    id: 'n19_1_report', questId: 'N19-1', at: 'action', objectiveIndex: 1, step: 2, npcId: TAK, start: 'start',
    nodes: {
      start: say(
        '(공방 앞 평상. 대를 깎던 칼이 내 빈손을 보고 멈춘다.) 놓고 왔구나.\n\n…그 사람, 좌판에 있더냐. 아니다, 됐다. (칼을 다시 든다. 칼날이 마디에 한 번 걸린다.) …뭐라던.',
        "(The bench outside the workshop. His knife stops when he sees my empty hands.) You left it.\n\n...Was she at the stall? No, never mind. (He takes up the knife again. The blade catches once on a node.) ...What did she say?",
        [
          opt('name_out', '말씀대로 이름은 빼고, 얼음통 밑에 받쳐 두고 왔습니다.', 'As you said, I left your name out and set it under the ice tub.',
            { stance: 'giver', aff: { [TAK]: 0.04 }, next: 'edge' }),
          opt('said_secret', '누가 보낸 거냐 물으셔서, 그건 말 못 한다고만 했습니다.', "She asked who it was from. I only said I couldn't tell her.",
            { stance: 'mid', aff: { [TAK]: -0.03, [OK]: 0.03 }, flags: ['choice.n19_1_said_secret'], next: 'said_secret' }),
          opt('she_knows', '말 안 해도 아실 겁니다. 이렇게 깎는 분이 이 항구에 또 있습니까.', "She'll know without being told. Who else in this harbour carves like that?",
            { stance: 'self', aff: { [TAK]: -0.02 }, next: 'knows' }),
          opt('go_next', '다음엔 직접 가시지요. 할머니도 그편이 나으실 겁니다.', "Next time, take it yourself. She'd prefer that too, I think.",
            { stance: 'other', aff: { [TAK]: -0.06 }, next: 'too_close' }),
        ]),
      edge: say(
        '(칼이 멈춘다.) …얼음통 밑에. 그래. 수평은 맞던?\n\n그 사람은. 보기만 하더냐. 손은 안 대고?',
        '(The knife stops.) ...Under the ice tub. Good. Was it level?\n\nAnd her. Did she just look at it? Didn\'t touch it?',
        [
          opt('ran_edge', '모서리를 한 번 쓸어 보셨습니다.', 'She ran a hand along the edge once.',
            { stance: 'mid', aff: { [TAK]: 0.04 }, end: endTalk({
              lineKo: '(한참 말이 없다. 칼끝으로 마디 하나를 고른다.) …한 번. 그래. 한 번이면 됐다.\n\n얼음이 오래 가는지 한 번 더 가서 봐 다오. 그 사람 말고, 얼음.',
              lineEn: '(He says nothing for a long while. He evens out a node with the tip of the knife.) ...Once. Right. Once is enough.\n\nGo back and see whether the ice lasts. Not her. The ice.' }) }),
          opt('pleased', '아주 마음에 들어 하시는 눈치였습니다.', 'She seemed very pleased with it.',
            { stance: 'giver', aff: { [TAK]: -0.02 }, end: endTalk({
              lineKo: '(칼날 끝만 본다.) …그 사람이 그런 얼굴을 할 리가 없다. 네 얼굴에 다 쓰여 있어. 듣기 좋게 말하려는 거.\n\n됐다. 얼음이나 오래 가는지 가서 봐라.',
              lineEn: "(He looks only at the tip of the blade.) ...She'd never make a face like that. It's written all over yours. You're trying to make it sound nice.\n\nEnough. Go and see whether the ice lasts." }) }),
          opt('nod_only', '(고개만 끄덕인다.)', '(I just nod.)',
            { stance: 'self', end: endTalk({
              lineKo: '(그걸로 됐다는 듯 다시 칼을 놀린다. 대팻밥이 길게 말려 떨어진다.) …얼음이나 한 번 더 가서 봐 줘라.',
              lineEn: '(As if that were answer enough, he works the knife again. A long shaving curls off and drops.) ...Go and look at the ice once more for me.' }) }),
        ]),
      said_secret: say(
        '(칼을 내려놓는다.) 말 못 한다고 했다고. …그게 다 말한 거다.\n\n보낸 사람이 따로 있다는 걸 알았으면 그 사람은 벌써 안다. 대나무 깎는 늙은이가 이 항구에 몇이나 된다고. (한숨) …그래도 거짓말은 안 했구나.',
        "(He puts down the knife.) You said you couldn't tell her. ...That's telling her everything.\n\nOnce she knows there's a sender, she already knows who. How many old men carve bamboo in this harbour? (A sigh.) ...Still, you didn't lie.",
        [
          opt('careless', '제 입이 가벼웠습니다. 다음엔 묻기 전에 나오겠습니다.', "That was careless of me. Next time I'll be out before she asks.",
            { stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({
              lineKo: '…다음이 있을지. (그래도 칼을 다시 든다.) 얼음 오래 가나, 가서 한 번 보고 와라.',
              lineEn: '...If there is a next time. (Still, he takes up the knife again.) Go and see whether the ice is lasting.' }) }),
          opt('couldnt_lie', '할머니 앞에서 거짓말은 못 하겠더군요.', "I couldn't bring myself to lie to her face.",
            { stance: 'other', aff: { [TAK]: -0.02 }, end: endTalk({
              lineKo: '(한참 칼을 내려다본다.) …그 사람 앞에선 다들 그렇다. 나도 그랬다.\n\n가 봐라. 얼음이나 오래 가는지.',
              lineEn: "(He looks down at the knife for a long while.) ...Everyone's like that in front of her. So was I.\n\nGo on. See whether the ice lasts." }) }),
        ]),
      knows: say(
        '(칼날이 마디에 걸려 멈춘다.) …알면 아는 거지. 아는 거하고 말하는 거는 다르다.\n\n받침은 받침이다. 누가 깎았는지 얼음은 모른다. 그 사람도 모른 척할 거다. 이 나이엔 그게 셈법이야.',
        "(The blade catches on a node and stops.) ...If she knows, she knows. Knowing and saying are different things.\n\nA rest is a rest. The ice doesn't know who carved it. She'll pretend not to know too. At our age, that's how the sums are done.",
        [
          opt('pretend_too', '그럼 저도 모르는 척하겠습니다.', "Then I'll pretend not to know too.",
            { stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({
              lineKo: '(코로 짧게 웃는다.) 그래. 심부름꾼은 모르는 게 낫다. 얼음 오래 가는지나 가서 봐.',
              lineEn: "(He gives a short laugh through his nose.) Right. Better the errand runner doesn't know. Just go and see whether the ice lasts." }) }),
          opt('too_even', '모른 척하기엔 마디가 너무 고르던데요.', 'Those nodes are too even for anyone to pretend.',
            { stance: 'other', aff: { [TAK]: -0.03 }, end: endTalk({
              lineKo: '…시끄럽다. (그래도 칼질이 조금 느려진다.) 얼음이나 가서 봐라.',
              lineEn: '...Quiet. (Still, his knife slows a little.) Go and look at the ice.' }) }),
        ]),
      too_close: say(
        '(눈을 치켜뜬다.) …가깝지. 가까우니까 못 가는 거다. 너는 몰라.\n\n심부름꾼은 심부름만 해라. 그 사람이 뭘 낫게 여길지는 네가 정할 일이 아니다.',
        "(His eyes come up to mine.) ...It's close. That's exactly why I can't go. You wouldn't know.\n\nAn errand runner runs errands. What she'd prefer isn't yours to decide.",
        [
          opt('overstepped', '제가 주제넘었습니다.', 'I overstepped.',
            { stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({
              lineKo: '(고개를 젓는다.) 주제넘은 게 아니라 젊은 거다. …얼음 오래 가는지 가서 봐 다오.',
              lineEn: '(He shakes his head.) Not overstepping. Just young. ...Go and see whether the ice lasts, would you.' }) }),
          opt('her_hand', '모서리를 쓸어 보시는 손이 그래 보였습니다.', 'The way her hand ran along the edge said so.',
            { stance: 'other', aff: { [TAK]: 0.02 }, end: endTalk({
              lineKo: '(칼을 쥔 손이 오래 멈춘다.) …손이 그랬다고. (한참 뒤) 얼음이나 가서 봐라. 오래 가는지.',
              lineEn: '(The hand holding the knife stays still a long time.) ...Her hand said so. (After a long pause) Just go and look at the ice. See if it lasts.' }) }),
        ]),
    },
  },

  // N19-1 — 끝내는 자리(탁만수). 반응 장면(마디를 쓸어 보고 · 얼음 상자를 올리고 · 「탁 영감이 주던가?」 · 「…모르겠어요.」) 뒤
  {
    id: 'n19_1_done', questId: 'N19-1', at: 'complete', npcId: TAK, start: 'start',
    nodes: {
      start: say(
        '(평상에 앉은 채 고개도 들지 않는다.) 봤냐. …얼음 말이다. 오래 가더냐.\n\n(칼질이 멈췄다가 다시 이어진다.) 그 사람은. 뭐라던.',
        "(He stays on the bench and doesn't even look up.) Did you see? ...The ice, I mean. Is it lasting?\n\n(His knife stops, then carries on.) And her. What did she say?",
        [
          opt('ran_nodes', '마디를 한참 쓸어 보시더니 얼음 상자를 그 위에 올리셨습니다.', 'She ran her hand over the nodes a long while, then set the ice box on top of it.',
            { stance: 'giver', aff: { [TAK]: 0.05, [OK]: 0.02 }, next: 'nodes' }),
          opt('she_asked', '노인장이 주신 거냐고 물으셨습니다.', 'She asked whether it came from you.',
            { stance: 'mid', next: 'asked' }),
          opt('not_much', '별말씀 없으셨습니다.', "She didn't say much.",
            { stance: 'self', aff: { [TAK]: -0.02 }, next: 'quiet' }),
          opt('watch_carve', '그보다, 받침 깎으시는 걸 옆에서 봐도 되겠습니까?', 'More to the point, may I watch you carve the rests?',
            { stance: 'self', end: endTalk({ complete: 'lesson',
              lineKo: '조용히만 있으면. (톱을 집어 마디 앞에 댄다.) 톱이 마디에 닿으면 소리가 한 번 막힌다. 거기서 서두르면 대가 갈라져.\n\n숨 한 번 쉬고 넘어가. 대도 사람도 막히는 데서 갈린다.',
              lineEn: 'If you keep quiet. (He picks up the saw and sets it to a node.) When the saw meets a node, the sound catches once. Hurry there and the bamboo splits.\n\nTake one breath and go through. Bamboo and people both split where they catch.' }) }),
        ]),
      nodes: say(
        '……그랬어? 그랬구나. (칼을 쥔 손이 멈춘다. 한동안 말이 없다.)\n\n마디를 쓸어 봤으면 결이 맞았다는 얘기다. 손에 걸리는 대는 그 자리에서 내려놓게 돼. 안 내려놨으면 됐다.',
        "......She did? I see. (The hand holding the knife stops. For a while he says nothing.)\n\nIf she ran her hand over the nodes, the grain was right. Bamboo that snags the hand gets put down on the spot. If she didn't put it down, that's enough.",
        [
          opt('nod_true', '(고개를 끄덕인다.)', '(I nod.)',
            { stance: 'giver', end: endTalk({ complete: 'relay_true',
              lineKo: '(칼을 다시 든다. 칼질 소리가 한결 부드럽다.) …다음에 또 시킬지도 모른다. 귀찮게 굴어서 미안하다.',
              lineEn: '(He takes up the knife again. It sounds softer now.) ...I may ask you again. Sorry to keep bothering you.' }) }),
          opt('no_fee', '심부름값은 됐습니다. 지나는 길이었으니까요.', 'No need to pay me. I was passing anyway.',
            { stance: 'mid', end: endTalk({ complete: 'no_fee',
              lineKo: '…지나는 길. 그래, 그렇게 해 두자. (칼을 내려놓고 나를 한 번 본다.)\n\n빚은 안 지는 성미인데 이건 지고 가지. 공방 앞 지날 일 있으면 들러라. 차 한 잔은 있다.',
              lineEn: "...Passing anyway. Fine, let's call it that. (He puts down the knife and looks at me once.)\n\nI'm not one for owing, but I'll owe you this one. If you're ever passing the workshop, come in. There's always a cup of tea." }) }),
          opt('go_yourself', '다음엔 직접 가 보시지요. 표정이 좋으셨습니다.', 'Next time, go yourself. She looked pleased.',
            { stance: 'other', aff: { [TAK]: -0.04 }, end: endTalk({ complete: 'relay_true',
              lineKo: '…그 얘기는 그만. (칼끝이 멈춘다. 그래도 평상 밑에서 대나무 한 토막을 끌어당긴다.)',
              lineEn: '...Enough of that. (The knife tip stops. Still, he drags a length of bamboo out from under the bench.)' }) }),
        ]),
      asked: say(
        '(칼이 손에서 미끄러질 뻔한다.) …물었다고. 내가 줬냐고.\n\n(한참 대팻밥만 쓸어 모은다.) …그래서. 너는 뭐라고 했냐.',
        '(The knife nearly slips from his hand.) ...She asked. Whether I gave it.\n\n(For a long while he just sweeps the shavings together.) ...And? What did you say?',
        [
          opt('dont_know', '모르겠다고만 했습니다.', 'I only said I wouldn\'t know.',
            { stance: 'giver', aff: { [TAK]: 0.04 }, next: 'kept' }),
          opt('regret', '모르겠다고 했지만, 사실대로 말씀드릴 걸 그랬습니다.', "I said I wouldn't know. I wish I'd told her the truth.",
            { stance: 'other', aff: { [TAK]: -0.04 }, end: endTalk({ complete: 'relay_true',
              lineKo: '(칼을 내려놓는다.) …사실대로 말했으면 그 사람은 받침을 안 썼을 거다. 모르는 척할 데가 있어야 쓰지.\n\n(그러고는 혼잣말처럼) 물었구나. 그 사람이.',
              lineEn: "(He puts down the knife.) ...If you'd told her the truth, she wouldn't have used the rest. She needs room to pretend not to know.\n\n(Then, as if to himself) She asked. Her." }) }),
        ]),
      kept: say(
        '(아주 천천히 고개를 끄덕인다.) …잘했다. 모르는 게 맞다. 심부름꾼은 모르는 게 낫다.\n\n(칼을 다시 쥔다. 그런데 깎지는 않는다.) …그 사람이 물었다고. 그랬구나.',
        "(He nods, very slowly.) ...Good. Not knowing is right. Better the errand runner doesn't know.\n\n(He grips the knife again, but doesn't cut.) ...She asked. I see.",
        [
          opt('say_nothing', '(더 말하지 않는다.)', '(I say nothing more.)',
            { stance: 'giver', end: endTalk({ complete: 'relay_true',
              lineKo: '(대팻밥을 한 줌 쥐었다 놓는다.) …다음에 또 부를지도 모른다. 그때도 지나는 길에 와라.',
              lineEn: '(He grabs a handful of shavings and lets them fall.) ...I may call on you again. Come by on your way then too.' }) }),
          opt('no_fee', '심부름값은 됐습니다.', 'No need to pay me.',
            { stance: 'mid', end: endTalk({ complete: 'no_fee',
              lineKo: '…그래. (칼을 내려놓는다.) 빚은 안 지는 성미인데 이건 지고 가지. 지날 일 있으면 들러라. 차 한 잔은 있다.',
              lineEn: "...Right. (He puts down the knife.) I'm not one for owing, but I'll owe you this one. If you're passing, come in. There's always a cup of tea." }) }),
          opt('answer_her', '다음엔 직접 대답해 주시지요. 물으신 분께요.', "Next time, why not answer her yourself? She's the one who asked.",
            { stance: 'other', aff: { [TAK]: -0.05 }, end: endTalk({ complete: 'relay_soft',
              lineKo: '(칼질이 거칠어진다.) …대답은 무슨. 물은 것도 아니다. 혼잣말이지. 됐다, 가 봐라.',
              lineEn: "(His knife turns rough.) ...Answer, nothing. That wasn't asking. Just talking to herself. Enough. Go." }) }),
        ]),
      quiet: say(
        '…그렇지. 그 사람이 뭘. (대를 다시 깎는다. 소리가 조금 거칠다.)\n\n괜찮다. 말 안 하는 것도 대답이다. 받침이 좌판 밑에 들어갔으면 그걸로 됐어.',
        "...Of course not. What would she say. (He goes back to carving. The sound is a little rougher.)\n\nIt's fine. Saying nothing is an answer too. If the rest went under the stall, that's enough.",
        [
          opt('bow_out', '(고개를 숙인다.)', '(I lower my head.)',
            { stance: 'self', end: endTalk({ complete: 'relay_soft',
              lineKo: '(대팻밥이 거칠게 튄다.) 가 봐라. 얼음이 오래 가면 그만이지.',
              lineEn: '(Shavings fly roughly.) Go on. As long as the ice lasts, that\'s all.' }) }),
          opt('correct', '실은… 마디를 한참 쓸어 보셨습니다.', 'Actually... she ran her hand over the nodes for a long time.',
            { stance: 'giver', aff: { [TAK]: 0.03 }, next: 'nodes' }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N19-2 「부고 아닌 편지」 — 받는 자리(정옥선). 이번엔 거꾸로 — 할머니가 보내고, 이름을 빼 달라 한다
  // ═══════════════════════════════════════════
  {
    id: 'n19_2_offer', questId: 'N19-2', at: 'offer', npcId: OK, start: 'start',
    nodes: {
      start: say(
        '(보자기로 싼 반찬통을 좌판 귀퉁이에 놓았다가 도로 끌어당긴다.) 탁 씨가 앓아누웠다더라. 기침 소리가 공방 밖까지 들린다고.\n\n이거… 반찬이다. 늙은이가 늙은이 걱정하는 거, 우습나. 갖다 줘라. 내가 보냈다고는 하지 말고.',
        "(She sets a cloth-wrapped food container at the corner of the stall, then pulls it back again.) They say Tak's laid up. You can hear the coughing outside the workshop.\n\nThis... it's food. An old woman fussing over an old man. Funny, is it? Take it to him. Don't tell him I sent it.",
        [
          opt('not_funny', '우습지 않습니다. 식기 전에 갖다 드리겠습니다.', "It's not funny. I'll get it to him before it goes cold.",
            { stance: 'giver', aff: { [OK]: 0.05 }, end: endTalk({ accept: true,
              lineKo: '…식으면 데워 먹으면 되지. 그래도 빨리 가. (보자기 매듭을 한 번 더 조인다.)\n\n문 앞에 두고 와. 얼굴 볼 거 없다. 앓는 사람은 앓는 얼굴 보이는 거 싫어해.',
              lineEn: "...If it goes cold he can heat it up. Still, go quickly. (She pulls the knot of the cloth tighter once more.)\n\nLeave it at the door. No need to see his face. Sick people hate being seen sick." }) }),
          opt('how_bad', '많이 편찮으시답니까?', 'Is he very ill?',
            { stance: 'mid', next: 'cough' }),
          opt('go_yourself', '직접 가져가시면 노인장이 더 반기실 텐데요.', "He'd be gladder if you took it yourself.",
            { stance: 'other', aff: { [OK]: -0.04 }, next: 'not_me' }),
          opt('like_rest', '받침 때처럼, 물으시면 말 못 한다고만 하겠습니다.', "Like with the rest, if he asks, I'll just say I can't tell him.",
            { stance: 'mid', aff: { [OK]: 0.02 }, requires: { flag: 'choice.n19_1_said_secret' }, next: 'all_knew' }),
        ]),
      cough: say(
        '모른다. 좌판에 도는 말이 그렇다는 거지. 사흘째 공방 문이 닫혀 있다더라.\n\n(보자기를 쓸어 편다.) 앓는 사람 입은 짧아. 그래서 이것저것 넣었다. 하나라도 넘어가면 됐지. 많이 싼 거 아니다.',
        "I don't know. That's just what's going round the stalls. The workshop door's been shut three days, they say.\n\n(She smooths out the cloth.) A sick man has no appetite. So I put in a bit of everything. If even one thing goes down, that's enough. It isn't a lot.",
        [
          opt('listen_cough', '가는 김에 기침이 어떠신지도 듣고 오겠습니다.', "While I'm there, I'll listen to how his cough sounds.",
            { stance: 'giver', aff: { [OK]: 0.04 }, end: endTalk({ accept: true,
              lineKo: '(손을 멈춘다.) …듣기만 해. 들어가지는 말고. 기침 소리가 맑으면 낫는 거고, 탁하면… 그때 다시 얘기하자.',
              lineEn: "(Her hands stop.) ...Just listen. Don't go in. If the cough sounds clear he's mending, and if it's thick... we'll talk then." }) }),
          opt('heavy', '이것저것치고는 꽤 무겁습니다.', 'Heavy, for a bit of everything.',
            { stance: 'self', aff: { [OK]: -0.02 }, end: endTalk({ accept: true,
              lineKo: '(눈을 흘긴다.) 늙은이 손이 커서 그렇다. 무거우면 두 손으로 들어. 엎지르지 말고.',
              lineEn: "(She shoots me a look.) An old woman's hands are generous, that's all. If it's heavy, use both hands. Don't spill it." }) }),
          opt('stay_out', '두 분 일에 제가 끼어들어도 될지 모르겠습니다.', "I'm not sure it's my place to come between you two.",
            { stance: 'self', aff: { [OK]: -0.03 }, end: endTalk({ decline: true,
              lineKo: '…끼어들긴. 반찬통 하나 나르는 거다. (보자기를 좌판 밑으로 밀어 넣는다.) 됐다. 다른 사람 시키지.',
              lineEn: "...Come between us, nothing. It's carrying one food container. (She pushes the bundle under the stall.) Fine. I'll ask someone else." }) }),
        ]),
      not_me: say(
        '누가 반기래. (반찬통을 내 쪽으로 떠민다.) 쓸데없는 소리 말고.\n\n…내가 가면 그 사람이 일어나야 해. 앓는 사람 일으키는 거 아니다. 그러니 네가 가. 내가 보냈다고는 하지 말고. 알았지?',
        "Who said anything about glad. (She shoves the container at me.) Enough nonsense.\n\n...If I go, he'll have to get up. You don't make a sick man get up. So you go. And don't tell him I sent it. Understood?",
        [
          opt('promise', '알겠습니다. 할머니 이름은 빼겠습니다.', 'Understood. Your name stays out of it.',
            { stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '(고개를 끄덕인다.) 문 앞에 두고 바로 와. 오래 서 있으면 그 사람이 안다.',
              lineEn: "(She nods.) Leave it at the door and come straight back. Stand there too long and he'll know." }) }),
          opt('if_he_asks', '노인장이 물으시면, 거짓말은 못 하겠습니다.', "If he asks me, I can't lie to him.",
            { stance: 'other', aff: { [OK]: -0.04 }, end: endTalk({ accept: true,
              lineKo: '(한참 나를 본다.) …그럼 묻기 전에 나와. 그 사람 말이 느려. 물을 새 없이 나오면 된다.',
              lineEn: "(She looks at me a long while.) ...Then get out before he asks. He's slow to speak. Leave before he can ask, and that's that." }) }),
        ]),
      all_knew: say(
        '(눈을 흘긴다.) 말 못 한다는 게 다 말하는 거다. 받침 때 나는 대번에 알았어.\n\n이번엔 아예 아무 말도 하지 마. 문 앞에 두고 와. 묻기 전에.',
        '(She shoots me a look.) Saying you can\'t tell is telling. With the rest, I knew straight away.\n\nThis time, say nothing at all. Leave it at the door. Before he can ask.',
        [
          opt('not_a_word', '아무 말도 안 하겠습니다.', "I won't say a word.",
            { stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '그래. (반찬통을 두 손에 들려 준다.) …그 사람도 알 거다. 아는 거하고 말하는 거는 다르지.',
              lineEn: "Good. (She puts the container into both my hands.) ...He'll know too. Knowing and saying are different things." }) }),
          opt('taste_tells', '노인장도 아실 겁니다. 반찬 맛을 보시면요.', "He'll know too, once he tastes it.",
            { stance: 'other', aff: { [OK]: -0.02 }, end: endTalk({ accept: true,
              lineKo: '(얼굴을 돌린다.) …맛은 무슨. 아무 맛도 안 나게 쌌다. 가.',
              lineEn: '(She turns her face away.) ...Taste, nothing. I packed it so it tastes of nothing. Go.' }) }),
        ]),
    },
  },

  // N19-2 — 진행 중: 반찬통을 전하고 와서 알린다(「반찬통 전달」 셋째 단계 · 의뢰인 앞).
  //  지어낸 「고맙다」(choice.n19_white_thanks)는 셋째 · 넷째 편이 기억한다. 보낸 사람을 댔으면(choice.n19_told_tak) 셋째 편이 기억한다
  {
    id: 'n19_2_report', questId: 'N19-2', at: 'action', objectiveIndex: 1, step: 2, npcId: OK, start: 'start',
    nodes: {
      start: say(
        '(좌판 얼음을 고르던 손이 멈춘다. 내 빈손을 본다.) 갔다 왔냐.\n\n…먹더냐. 아니, 받기는 하더냐. 문 앞에 두고만 왔어?',
        '(Her hands stop sorting the ice. She looks at my empty hands.) You went?\n\n...Did he eat? No, did he even take it? Did you just leave it at the door?',
        [
          opt('chopsticks', '문간으로 손이 나와 받으셨습니다. 조금 있다 젓가락 소리가 났습니다.', 'A hand came out at the doorway and took it. A little later I heard chopsticks.',
            { stance: 'mid', aff: { [OK]: 0.05 }, next: 'eating' }),
          opt('said_thanks', '고맙다고 전해 달라셨습니다.', 'He asked me to tell you thank you.',
            { stance: 'giver', aff: { [OK]: 0.06 }, flags: ['choice.n19_white_thanks'], next: 'thanks' }),
          opt('told_him', '누가 보냈냐 물으셔서, 할머니라고 말씀드렸습니다.', 'He asked who sent it, so I told him it was you.',
            { stance: 'other', aff: { [OK]: -0.07, [TAK]: 0.04 }, flags: ['choice.n19_told_tak'], next: 'told' }),
          opt('nothing_said', '아무 말씀 없으셨습니다. 기침 소리만 났습니다.', "He didn't say a word. There was only coughing.",
            { stance: 'self', aff: { [OK]: -0.02 }, next: 'silent' }),
        ]),
      eating: say(
        '(얼음 집게를 내려놓는다.) …젓가락 소리. 그래. 그럼 넘어간 거다.\n\n앓는 사람이 젓가락을 들었으면 반은 나은 거야. (좌판 너머 공방 쪽을 한 번 본다. 금방 고개를 돌린다.) 됐다. 그거면 됐어.',
        "(She puts down the ice tongs.) ...Chopsticks. Right. Then it went down.\n\nWhen a sick man picks up his chopsticks, he's half mended. (She glances once past the stall towards the workshop, then quickly looks away.) That's enough. That's all I needed.",
        [
          opt('cough_clear', '기침 소리도 맑았습니다.', 'His cough sounded clear, too.',
            { stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({
              lineKo: '(숨을 길게 내쉰다.) …맑았으면 됐다. 탁하면 어쩌나 했다.\n\n(얼음을 한 덩이 집어 상자에 넣는다.) 이 얘기는 여기까지. 좌판에 퍼뜨리지 마라.',
              lineEn: "(She lets out a long breath.) ...If it was clear, good. I was afraid it'd be thick.\n\n(She drops a lump of ice into the box.) That's the end of it. Don't spread it round the stalls." }) }),
          opt('go_see', '다음엔 직접 가 보시지요. 문 앞까지만이라도요.', 'Next time, go yourself. Even just as far as the door.',
            { stance: 'other', aff: { [OK]: -0.03 }, end: endTalk({
              lineKo: '(얼음 집게를 다시 든다.) …문 앞까지 가면 문을 두드리고 싶어진다. 그러니 안 가는 거다. 됐다.',
              lineEn: "(She takes up the tongs again.) ...Go as far as the door and you want to knock. That's why I don't go. Enough." }) }),
        ]),
      thanks: say(
        '(얼음 집게가 허공에서 멈춘다.) …그 사람이? 고맙다고?\n\n(한참 말이 없다가) 그 입에서 그 말이 나왔으면 많이 앓는 거다. 멀쩡할 땐 죽어도 안 하는 말이야.',
        "(The ice tongs stop in midair.) ...He did? Said thank you?\n\n(After a long silence) If those words came out of that mouth, he must be very ill. He'd never say that when he's well, not if it killed him.",
        [
          opt('keep_quiet', '(고개를 끄덕인다.)', '(I nod.)',
            { stance: 'giver', end: endTalk({
              lineKo: '(얼음 상자 뚜껑을 닫는다. 손이 조금 떨린다.) …고맙다고 했다. 그 사람이. (혼잣말처럼 한 번 더 되뇐다.)\n\n됐다. 가 봐라. 이 얘기는 좌판에 퍼뜨리지 말고.',
              lineEn: "(She shuts the ice box lid. Her hand shakes a little.) ...He said thank you. Him. (She says it once more, as if to herself.)\n\nThat's enough. Go on. And don't spread this round the stalls." }) }),
          opt('take_back', '…사실은 제가 지어낸 말입니다. 아무 말씀 없으셨습니다.', "...The truth is, I made that up. He didn't say anything.",
            { stance: 'mid', aff: { [OK]: -0.04 }, flags: ['choice.n19_thanks_confessed'], end: endTalk({
              lineKo: '(나를 한참 본다. 그러다 웃는다. 웃음이 짧다.) …그렇지. 그 사람이 그런 말을 할 리가 없지.\n\n그래도 고맙다. 지어내 준 거. 다신 하지 마라.',
              lineEn: "(She looks at me a long while. Then she laughs, briefly.) ...Of course. He'd never say a thing like that.\n\nStill, thank you. For making it up. Don't ever do it again." }) }),
        ]),
      told: say(
        '뭐? (얼음 집게를 탁 내려놓는다.) 내가 보냈다고 하지 말랬지!\n\n…그래서. 그 사람이 뭐라던. (목소리가 작아진다.) 아니, 듣기 싫다. 말하지 마.',
        "What? (She slaps down the ice tongs.) I told you not to say I sent it!\n\n...So. What did he say? (Her voice drops.) No, I don't want to hear. Don't tell me.",
        [
          opt('sorry_told', '죄송합니다. 물으시는데 거짓말이 안 나왔습니다.', "I'm sorry. He asked, and I couldn't make myself lie.",
            { stance: 'giver', aff: { [OK]: 0.02 }, end: endTalk({
              lineKo: '(한숨을 쉰다.) …그 사람 앞에선 거짓말이 안 나오지. 그건 안다.\n\n됐다. 엎질러진 반찬이다. 다음부턴 묻기 전에 나와.',
              lineEn: "(She sighs.) ...Lies won't come out in front of him. I know that much.\n\nFine. That's spilt food. From now on, get out before he asks." }) }),
          opt('he_ate', '이름을 듣고 한참 서 계시더니, 곧 젓가락 소리가 났습니다.', 'When he heard your name he stood a long while. Then I heard chopsticks.',
            { stance: 'other', aff: { [OK]: 0.03 }, end: endTalk({
              lineKo: '…알고 먹었으면 됐다. (얼음 집게를 다시 쥔다. 한참 쥐고만 있다.)\n\n모르고 먹는 것보다 낫지. 나는 그렇게 생각한다. (그 말을 하고 얼굴을 돌린다.)',
              lineEn: "...If he ate it knowing, that's fine. (She picks up the tongs again and just holds them for a while.)\n\nBetter than eating it not knowing. That's what I think. (Having said it, she turns her face away.)" }) }),
        ]),
      silent: say(
        '…그렇지. 그 사람이 뭘. (얼음 집게로 얼음을 괜히 툭툭 친다.)\n\n괜찮다. 말 안 하는 것도 대답이다. 받았으면 됐어. 기침은… 기침은 계속 하더냐.',
        "...Of course not. What would he say. (She taps at the ice with the tongs for no reason.)\n\nIt's fine. Saying nothing is an answer too. If he took it, that's enough. The cough... was he still coughing?",
        [
          opt('then_chopsticks', '그러고 나서 젓가락 소리가 났습니다.', 'After that, I heard chopsticks.',
            { stance: 'mid', aff: { [OK]: 0.04 }, next: 'eating' }),
          opt('kept_coughing', '네. 문 닫히고도 한참 들렸습니다.', 'Yes. I could hear it a long while after the door shut.',
            { stance: 'self', aff: { [OK]: -0.02 }, end: endTalk({
              lineKo: '(얼음 집게를 내려놓는다.) …그래. 알았다. (한참 공방 쪽을 본다.) 가 봐라. 오늘은 얼음 안 날라도 된다.',
              lineEn: "(She puts the tongs down.) ...Right. I see. (She looks towards the workshop for a long time.) Go on. You needn't carry ice today." }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N19-3 「대를 다시 깎는 손」 — 받는 자리(탁만수). 앞 두 편의 표시를 읽는다
  // ═══════════════════════════════════════════
  {
    id: 'n19_3_offer', questId: 'N19-3', at: 'offer', npcId: TAK, start: 'start',
    nodes: {
      start: say(
        '(평상 위에 천으로 싼 것이 또 놓여 있다. 이번 것은 틈이 조금 더 넓다.) 두 번째다. 받침. 지나는 길에… 알지. 내가 줬다고 하지 마라.\n\n반찬통은 비워서 보냈다. 그거면 됐지. 맛있었다는 말은 하지 마라. 그것도 내가 한 말이 되니까.',
        "(Something wrapped in cloth lies on the bench again. The gaps in this one are a little wider.) The second one. A rest. On your way past... you know. Don't tell her it was me.\n\nI sent the food container back empty. That's enough. Don't tell her it tasted good. That'd be me saying it too.",
        [
          opt('beside_first', '첫 번째 옆에 놓고 오겠습니다. 아무 말 없이요.', "I'll set it beside the first one. Without a word.",
            { stance: 'giver', aff: { [TAK]: 0.04 }, end: endTalk({ accept: true,
              lineKo: '(천 매듭을 단단히 묶어 건넨다.) 옆이든 어디든. 그 사람이 정하겠지. 물 빠지는 쪽이 바다 쪽으로 가게만 놔 다오.',
              lineEn: '(He ties the cloth firmly and hands it over.) Beside it or wherever. She\'ll decide. Just set it so the water runs off towards the sea.' }) }),
          opt('wider_gaps', '틈이 지난번보다 넓습니다. 일부러 그러셨습니까?', 'The gaps are wider than last time. Was that on purpose?',
            { stance: 'mid', aff: { [TAK]: 0.03 }, next: 'gaps' }),
          opt('confess_thanks', '…고맙다고 하셨다고, 제가 벌써 전해 버렸습니다.', "...I've already told her you said thank you.",
            { stance: 'mid', aff: { [TAK]: -0.05 }, requires: { flag: 'choice.n19_white_thanks', notFlag: 'choice.n19_thanks_confessed' }, next: 'thanks_out' }),
          opt('say_something', '이번엔 한마디라도 같이 보내시지요. 할머니도 기다리실 겁니다.', 'This time, send a word with it. She\'ll be waiting for one.',
            { stance: 'other', aff: { [TAK]: -0.04 }, next: 'no_word' }),
        ]),
      gaps: say(
        '봤구나. (받침을 손바닥에 올려 무게를 가늠해 보인다.) 첫 번째는 물이 한쪽에 고이더라. 좌판이 바다 쪽으로 기울었거든.\n\n써 본 사람은 안다. 어디가 모자랐는지. 모자란 데를 고치는 게 두 번째다.',
        "You noticed. (He weighs the rest on his palm.) With the first one, water pooled on one side. The stall leans towards the sea.\n\nAnyone who's used it knows where it fell short. Fixing what fell short is what a second one is for.",
        [
          opt('how_known', '좌판이 기운 건 어떻게 아셨습니까?', 'How did you know the stall leans?',
            { stance: 'other', aff: { [TAK]: -0.02 }, end: endTalk({ accept: true,
              lineKo: '(칼을 집었다가 내려놓는다.) …지나다 보면 보인다. 다 보여. (천에 싼 받침을 내 쪽으로 민다.) 그건 묻지 말고 가.',
              lineEn: "(He picks up the knife, then puts it down.) ...You see things, passing by. You see everything. (He pushes the wrapped rest towards me.) Don't ask about that. Just go." }) }),
          opt('drain_seaward', '물이 바다 쪽으로 빠지게 놓겠습니다.', "I'll set it so the water drains towards the sea.",
            { stance: 'giver', aff: { [TAK]: 0.03, [OK]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '그래. (고개를 끄덕인다.) 그러면 얼음이 하루를 간다. 이름은 빼고.',
              lineEn: "Good. (He nods.) Then the ice lasts the day. Leave my name out." }) }),
          opt('empty_box', '반찬통, 할머니 것인 줄 아시고 비우신 거지요?', "You emptied that container knowing it was hers, didn't you?",
            { stance: 'mid', aff: { [TAK]: 0.02 }, requires: { flag: 'choice.n19_told_tak' }, next: 'knew_sender' }),
        ]),
      knew_sender: say(
        '…네가 말했으니 알았지. (칼을 내려놓는다.) 모르고 받았으면 못 먹었다. 누가 보낸 줄 모르는 음식은 안 먹는다. 그게 내 버릇이다.\n\n그래서 비웠다. 씻어서. 그 사람은 빈 통 돌려받는 걸 제일 좋아해.',
        "...I knew because you told me. (He puts down the knife.) If I'd had it not knowing, I couldn't have eaten it. I don't eat food when I don't know who sent it. That's how I am.\n\nSo I emptied it. Washed it. Nothing pleases her more than getting an empty container back.",
        [
          opt('glad_told', '그럼 말씀드리길 잘했네요.', "Then I'm glad I told you.",
            { stance: 'other', aff: { [TAK]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '(대답 대신 받침을 천에 싸서 내민다.) …이번 건 그 사람한테 누가 줬다고 하지 마라. 그건 다르다.',
              lineEn: "(Instead of answering, he wraps the rest and holds it out.) ...This one, don't tell her who it's from. That's different." }) }),
        ]),
      thanks_out: say(
        '(칼이 멈춘다. 오래.) …내가. 고맙다고 했다고.\n\n(대팻밥을 한 줌 쥐었다가 놓는다.) 그 사람이 그걸 믿더냐.',
        '(The knife stops. For a long time.) ...I. Said thank you.\n\n(He grabs a handful of shavings, then lets them go.) And she believed that?',
        [
          opt('she_believed', '믿으셨습니다. 많이 편찮으신 줄 아시고요.', 'She did. She took it to mean you were very ill.',
            { stance: 'other', aff: { [TAK]: -0.02 }, next: 'not_wrong' }),
          opt('sorry_lie', '죄송합니다. 제가 지어낸 말입니다.', "I'm sorry. I made it up.",
            { stance: 'giver', aff: { [TAK]: 0.02 }, next: 'not_wrong' }),
        ]),
      not_wrong: say(
        '(한참 있다가 칼을 다시 든다.) …틀린 말은 아니다. 내 입으로 못 했을 뿐이지.\n\n지어낸 말이 맞는 말이면, 그건 거짓말이냐 아니냐. (대답을 바라는 얼굴은 아니다.) …받침이나 가져가라.',
        "(After a long while he takes up the knife again.) ...It isn't wrong. I just couldn't say it with my own mouth.\n\nIf a made-up word turns out true, is it a lie or isn't it? (His face isn't asking for an answer.) ...Just take the rest.",
        [
          opt('say_it_someday', '언젠가 직접 하시지요. 그 말씀.', 'Say it yourself, someday. Those words.',
            { stance: 'mid', aff: { [TAK]: 0.03 }, flags: ['choice.n19_thanks_owned'], end: endTalk({ accept: true,
              lineKo: '(칼끝이 마디에서 멈춘다.) …언젠가. (천에 싼 받침을 내민다.) 가라. 이름은 빼고.',
              lineEn: '(The knife tip stops on a node.) ...Someday. (He holds out the wrapped rest.) Go. Leave my name out.' }) }),
          opt('no_more_words', '다신 노인장 말을 지어내지 않겠습니다.', "I won't put words in your mouth again.",
            { stance: 'giver', aff: { [TAK]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '그래. 내 말은 내가 한다. 못 하면 못 하는 것도 내 몫이고. (받침을 건넨다.)',
              lineEn: "Good. My words are mine to say. And if I can't, that's mine too. (He hands over the rest.)" }) }),
        ]),
      no_word: say(
        '(칼을 내려놓는다.) 한마디. …무슨 한마디. 받침에 무슨 말을 붙이냐.\n\n대나무는 말이 없어서 좋은 거다. 말을 붙이면 그때부터 받침이 아니라 편지가 돼. 나는 편지 쓸 줄 모른다.',
        "(He puts down the knife.) A word. ...What word. What would I hang on a rest?\n\nThe good thing about bamboo is it keeps quiet. Hang words on it and it stops being a rest and turns into a letter. I don't know how to write letters.",
        [
          opt('already_letter', '받침도 이미 편지 같은데요.', "The rest's already a kind of letter.",
            { stance: 'other', aff: { [TAK]: -0.02 }, end: endTalk({ accept: true,
              lineKo: '(한참 나를 본다.) …말이 많다. (그래도 받침을 내민다.) 가져가라. 편지든 받침이든.',
              lineEn: '(He looks at me a long time.) ...You talk too much. (Still, he holds out the rest.) Take it. Letter or rest.' }) }),
          opt('just_rest', '알겠습니다. 받침만 전하겠습니다.', "Understood. Just the rest, then.",
            { stance: 'giver', aff: { [TAK]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '그래. 받침만. (천에 싼 것을 건넨다. 매듭이 지난번보다 단단하다.)',
              lineEn: 'Right. Just the rest. (He hands over the bundle. The knot is tighter than last time.)' }) }),
          opt('no_more_silent', '말 없는 심부름은 이제 못 하겠습니다.', "I can't carry silent errands any more.",
            { stance: 'self', aff: { [TAK]: -0.05 }, end: endTalk({ decline: true,
              lineKo: '…그래. (받침을 평상 구석으로 밀어 둔다.) 마음 바뀌면 와라. 대나무는 기다릴 줄 안다.',
              lineEn: '...Right. (He pushes the rest into a corner of the bench.) Come back if you change your mind. Bamboo knows how to wait.' }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N19-4 「같이 늙는 일」 — 진행 중(정옥선 앞 · 「두 사람을 한자리에 앉힌다」 세 단계)
  //  셋 다 좌판 앞으로 모인다(나레이션 · 끝내는 자리 「십 분 · 아무 말 없었다」 정본). 갈래는 앉히는 방법과 마음만 바꾼다.
  // ═══════════════════════════════════════════
  {
    id: 'n19_4_seats', questId: 'N19-4', at: 'action', objectiveIndex: 1, step: 0, npcId: OK, start: 'start',
    nodes: {
      start: say(
        '(좌판 밑에서 접이 의자 두 개를 꺼냈다가 하나를 도로 넣는다. 그러다 다시 꺼낸다.) …의자는 있다. 놓을 데가 없지.\n\n어디다 놓을래. 네가 정해. 나는 모른다. 나는 얼음만 본다.',
        "(She pulls two folding chairs from under the stall, puts one back, then takes it out again.) ...There are chairs. It's where to put them.\n\nWhere will you put them? You decide. I don't know. I just watch the ice.",
        [
          opt('side_by_side', '얼음 상자 사이에 나란히 놓겠습니다. 둘 다 바다를 보시게요.', "Side by side, between the ice boxes. You'll both face the sea.",
            { stance: 'giver', aff: { [OK]: 0.05 }, end: endTalk({
              lineKo: '(의자 하나를 받아 직접 편다. 바다 쪽으로 반 뼘 돌려놓는다.) …나란히. 그래. 마주 보면 둘 다 일어나 간다.',
              lineEn: "(She takes one chair and unfolds it herself, turning it a hand's width towards the sea.) ...Side by side. Yes. Face to face, we'd both get up and leave." }) }),
          opt('facing', '마주 보게 놓겠습니다. 얼굴은 보셔야지요.', 'Facing each other. You ought to see each other\'s faces.',
            { stance: 'mid', aff: { [OK]: -0.05 }, next: 'no_facing' }),
          opt('workshop', '공방 앞 평상은 어떻습니까? 노인장도 편하실 텐데요.', "How about the bench outside the workshop? He'd be more at ease there.",
            { stance: 'other', aff: { [OK]: -0.06 }, next: 'too_close' }),
          opt('your_stall', '할머니 좌판이니 할머니가 정하시지요.', "It's your stall. You decide.",
            { stance: 'self', aff: { [OK]: -0.02 }, next: 'you_decide' }),
        ]),
      no_facing: say(
        '얼굴은 무슨. (의자를 탁 접는다.) 마주 보고 앉으면 할 말이 있어야 해. 할 말 없는 늙은이 둘이 마주 앉아서 뭘 하냐.\n\n나란히 놔. 바다 보게. 바다는 아무 말 안 해도 돼.',
        "Faces, nothing. (She snaps a chair shut.) Sit face to face and you need something to say. Two old people with nothing to say, sitting face to face. Doing what?\n\nPut them side by side. Facing the sea. The sea doesn't need you to say anything.",
        [
          opt('as_you_say', '알겠습니다. 나란히 놓겠습니다.', 'All right. Side by side.',
            { stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({
              lineKo: '(접었던 의자를 다시 편다.) 그래. 받침 두 개 보이는 데로. 그 사람이 앉아서 그걸 봐야지.',
              lineEn: '(She unfolds the chair again.) Good. Where the two rests can be seen. He ought to sit and look at them.' }) }),
          opt('face_later', '그럼 오늘은 나란히, 다음엔 마주 보시는 걸로요.', 'Then side by side today, and face to face next time.',
            { stance: 'mid', aff: { [OK]: -0.02 }, end: endTalk({
              lineKo: '다음은 무슨 다음. (눈을 흘긴다.) 오늘이나 앉으면 다행이다. (그래도 의자를 나란히 편다.)',
              lineEn: "Next time, nothing. (She shoots me a look.) We'll be lucky if we sit today. (Still, she sets the chairs side by side.)" }) }),
        ]),
      too_close: say(
        '(얼음 집게가 멈춘다.) 거기를 내가 왜 가. …가깝지. 가까워서 못 가는 데도 있다.\n\n여기 놔. 좌판 앞. 여기는 다들 얼음만 보지 사람은 안 봐.',
        "(The ice tongs stop.) Why would I go there? ...It's close. Some places you can't go because they're close.\n\nPut them here. In front of the stall. Here everyone looks at the ice, not at people.",
        [
          opt('same_words', '노인장도 똑같은 말씀을 하셨습니다. 가까워서 못 간다고요.', "He said exactly the same thing. That it's too close to go.",
            { stance: 'other', aff: { [OK]: 0.04 }, requires: { flag: 'choice.n19_heard_close' }, end: endTalk({
              lineKo: '(한참 나를 본다.) …그 영감이 그래? (얼음 집게를 내려놓고 의자를 편다. 손이 조금 서툴다.)\n\n둘 다 늙어서 그렇다. 늙으면 가까운 데가 제일 멀어.',
              lineEn: '(She looks at me a long while.) ...The old man said that? (She puts down the tongs and unfolds a chair. Her hands fumble a little.)\n\nWe\'re both old, that\'s why. When you\'re old, the closest place is the farthest.' }) }),
          opt('here_then', '그럼 좌판 앞에 놓겠습니다.', "Then I'll put them in front of the stall.",
            { stance: 'giver', aff: { [OK]: 0.02 }, end: endTalk({
              lineKo: '그래. 얼음 상자 사이. 바람 덜 드는 데로.',
              lineEn: 'Good. Between the ice boxes. Out of the wind.' }) }),
        ]),
      you_decide: say(
        '(코웃음을 친다.) 내가 정할 거면 너한테 물었겠냐. 내 좌판이니까 못 정하는 거다.\n\n…정 모르겠으면 얼음 상자 사이에 둬. 바람 덜 드는 데. 그건 내가 말한 거 아니다.',
        "(She snorts.) If I could decide, would I be asking you? It's my stall, that's exactly why I can't.\n\n...If you really don't know, put them between the ice boxes. Out of the wind. And I didn't say that.",
        [
          opt('between_boxes', '얼음 상자 사이에 놓겠습니다. 할머니는 아무 말씀 안 하셨고요.', "Between the ice boxes, then. And you didn't say a thing.",
            { stance: 'giver', aff: { [OK]: 0.04 }, end: endTalk({
              lineKo: '…그래. 나는 아무 말도 안 했다. (웃음을 참는 얼굴로 의자 하나를 받아 편다.)',
              lineEn: '...Right. I said nothing. (Holding back a smile, she takes one chair and unfolds it.)' }) }),
        ]),
    },
  },

  // N19-4 둘째 단계 — 탁만수를 부른다. 매일 같은 때 좌판 앞을 지나간다(목표 문장). 어느 길이든 노인은 의자에 앉는다
  {
    id: 'n19_4_call', questId: 'N19-4', at: 'action', objectiveIndex: 1, step: 1, npcId: OK, start: 'start',
    nodes: {
      start: say(
        '(얼음을 고르던 손이 멈춘다. 좌판 너머 길을 턱으로 가리킨다.) 저기 온다. 매일 이맘때야. 발소리만 들어도 안다.\n\n(목소리를 낮춘다.) 어떻게 부를 건데. 내가 불렀다고는 하지 마라.',
        "(Her hands stop sorting the ice. She points past the stall at the road with her chin.) There he comes. Every day about now. I'd know those footsteps anywhere.\n\n(She lowers her voice.) How are you going to call him over? Don't say I called him.",
        [
          opt('ice_pretext', '얼음 좀 같이 옮겨 달라고 부르겠습니다. 지나다 우연히요.', "I'll ask him to help me shift some ice. As if by chance.",
            { stance: 'giver', aff: { [OK]: 0.04 }, next: 'pretext' }),
          opt('tell_true', '할머니가 잠깐 앉으시랍니다, 하고 부르겠습니다.', "I'll call out that you'd like him to sit a while.",
            { stance: 'other', aff: { [OK]: -0.08, [TAK]: 0.05 }, flags: ['choice.n19_4_told_invite'], next: 'truth' }),
          opt('ask_saebyeok', '새벽이한테 할아버지를 이리 모셔 오라고 하겠습니다.', "I'll get Saebyeok to bring his grandfather over.",
            { stance: 'mid', aff: { [OK]: 0.02, [SAE]: 0.04 }, flags: ['choice.n19_4_sent_saebyeok'], next: 'kid' }),
          opt('let_be', '부르지 않겠습니다. 오실 마음이면 오시겠지요.', "I won't call him. If he means to come, he'll come.",
            { stance: 'self', aff: { [OK]: -0.05 }, next: 'passing' }),
        ]),
      pretext: say(
        '(발소리가 좌판 앞에서 멈춘다. 얼음 상자와 나와 좌판 귀퉁이를 차례로 본다.) …얼음을. 내가. 이 허리로.\n\n(그래도 소매를 걷는다. 눈은 얼음 상자 사이 의자 두 개에 가 있다.) …어느 거냐.',
        '(The footsteps stop in front of the stall. He looks at the ice box, at me, at the corner of the stall.) ...Ice. Me. With this back.\n\n(Still, he rolls up his sleeves. His eyes are on the two chairs between the ice boxes.) ...Which one?',
        [
          opt('sit_first', '드는 건 제가 하겠습니다. 잠깐 앉아 계시지요.', "I'll do the lifting. Just sit a moment.",
            { stance: 'giver', aff: { [TAK]: 0.02, [OK]: 0.02 }, end: endTalk({
              lineKo: '(탁 노인이 한참 서 있다가 의자에 앉는다. 할머니 옆자리다. 할머니는 얼음만 본다. 얼음 집게 끝이 조금 떨린다.)',
              lineEn: '(Old Tak stands a long while, then sits. In the chair beside her. She looks only at the ice. The tip of her tongs trembles a little.)' }) }),
          opt('lift_together', '같이 들어 주시면 금방입니다.', "With the two of us it'll be quick.",
            { stance: 'mid', aff: { [TAK]: -0.02 }, end: endTalk({
              lineKo: '(둘이 얼음 상자를 든다. 내려놓고 나니 탁 노인 숨이 차다. 할머니가 말없이 의자 하나를 발로 밀어 준다. 노인이 앉는다.)',
              lineEn: '(We lift the ice box together. When we set it down, Old Tak is short of breath. Without a word she nudges a chair towards him with her foot. He sits.)' }) }),
        ], TAK),
      truth: say(
        '(얼음 집게를 떨어뜨린다.) 너…! 내가 언제 앉으라 했어!\n\n(목소리가 좌판 앞까지 갔다. 발소리가 거기서 멈췄다.)',
        '(She drops the tongs.) You...! When did I ever say sit!\n\n(Her voice carried right to the front of the stall. The footsteps stopped there.)',
        [
          opt('wave_him', '(이미 노인장께 손짓을 하고 있다.)', "(I'm already waving him over.)",
            { stance: 'other', end: endTalk({
              lineKo: '(탁 노인이 할머니 쪽은 보지 않은 채 중얼거린다. 그 사람이 앉으라 했다고. 한참 서 있다가 아주 천천히 의자에 앉는다. 할머니는 얼음 집게를 주워 들고 얼음만 본다. 귀가 붉다.)',
              lineEn: '(Without looking her way, Old Tak mutters: she said to sit, did she. He stands a long while, then very slowly sits. She picks up the tongs and looks only at the ice. Her ears are red.)' }) }),
          opt('sorry_loud', '죄송합니다. 제가 말을 잘못 옮겼습니다.', 'I\'m sorry. I put it badly.',
            { stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({
              lineKo: '(좌판 앞에 선 탁 노인이 나를 한 번, 할머니를 한 번 본다. 그러고는 말없이 의자에 앉는다. 누구 말이든 상관없다는 얼굴이다.)',
              lineEn: "(Standing in front of the stall, Old Tak looks once at me and once at her. Then he sits down without a word. Whoever's words they were, his face says it makes no difference.)" }) }),
        ]),
      kid: say(
        '(할아버지 소매를 잡아끌며 좌판으로 온다.) 할아버지, 빨리! 아저씨가 의자 놨대. 할머니 옆에!\n\n(할아버지가 버티자 두 손으로 등을 민다.) 앉아. 다리 아프다며. 아까부터 다리 아프다며!',
        "(He comes to the stall dragging his grandfather by the sleeve.) Grandpa, hurry! Mister put out a chair. Next to Grandma!\n\n(When his grandfather digs in his heels, he pushes him from behind with both hands.) Sit. You said your legs hurt. You've been saying so all day!",
        [
          opt('well_done', '새벽아, 잘했다.', 'Well done, Saebyeok.',
            { stance: 'mid', aff: { [SAE]: 0.03, [TAK]: -0.02 }, end: endTalk({
              lineKo: '(탁 노인이 손자 손을 털어 내고 의자 앞에 선다. 한참 서 있다가 앉는다. 새벽이가 그 옆에서 히죽 웃고, 할머니는 얼음 집게로 새벽이를 가리키다 만다.)',
              lineEn: '(Old Tak shakes off his grandson\'s hands and stands in front of the chair. After a long while he sits. Saebyeok grins beside him, and Okseon starts to point her tongs at the boy, then stops.)' }) }),
          opt('easy_now', '새벽아, 천천히. 할아버지 넘어지시겠다.', "Easy, Saebyeok. You'll knock your grandpa over.",
            { stance: 'other', aff: { [TAK]: 0.02 }, end: endTalk({
              lineKo: '(새벽이가 손을 놓는다. 탁 노인이 숨을 고르고, 혼자 걸어와 의자에 앉는다. 할머니는 얼음만 본다.)',
              lineEn: '(Saebyeok lets go. Old Tak catches his breath, walks over on his own and sits. She looks only at the ice.)' }) }),
        ], SAE),
      passing: say(
        '(발소리가 좌판 앞을 그냥 지나간다. 얼음 집게를 쥔 채 고개를 숙인다.)\n\n…봐라. 그냥 간다. 매일 저래. (작게) 네가 좀. 아니다. …네가 좀.',
        '(The footsteps pass right by the front of the stall. Tongs still in hand, she lowers her head.)\n\n...See. He just walks on. Every day the same. (Quietly) Could you. No. ...Could you.',
        [
          opt('call_rest', '노인장! 잠깐 쉬었다 가시지요!', 'Sir! Stop and rest a moment!',
            { stance: 'mid', aff: { [OK]: 0.03 }, end: endTalk({
              lineKo: '(발소리가 멈춘다. 탁 노인이 돌아보지 않은 채 한참 서 있다. 그러다 돌아서서 의자 쪽으로 온다. 할머니가 얼음 집게를 고쳐 쥔다.)',
              lineEn: '(The footsteps stop. Old Tak stands a long while without turning. Then he turns and comes over to the chair. She shifts her grip on the tongs.)' }) }),
          opt('chase_ice', '(얼음 상자를 들고 노인장을 뒤쫓는다.)', '(I pick up an ice box and go after him.)',
            { stance: 'giver', aff: { [OK]: 0.02 }, next: 'pretext' }),
        ]),
    },
  },

  // N19-4 셋째 단계 — 대화를 끝까지 지켜본다(이야기의 절정). 두 사람이 몇 마디를 주고받는다. 끼어들거나 입을 다문다.
  //  지어낸 「고맙다」가 여기서 탁만수 자신의 말이 된다(choice.n19_white_thanks · choice.n19_thanks_owned).
  {
    id: 'n19_4_watch', questId: 'N19-4', at: 'action', objectiveIndex: 1, step: 2, npcId: OK, start: 'start',
    nodes: {
      start: say(
        '(좌판 앞, 얼음 상자 사이에 의자 두 개. 두 사람이 나란히 앉아 바다 쪽을 본다. 서로는 보지 않는다.)\n\n(얼음이 녹아 받침 마디 사이로 물이 똑똑 떨어진다. 한참 그 소리뿐이다.)',
        '(Two chairs in front of the stall, between the ice boxes. The two of them sit side by side, facing the sea. Neither looks at the other.)\n\n(Meltwater drips between the nodes of the rests. For a long while that is the only sound.)',
        [
          opt('wait_by_ice', '(얼음 상자 옆에 서서 기다린다.)', '(I stand by the ice boxes and wait.)',
            { stance: 'self', next: 'o_rest' }),
          opt('small_talk', '날이 좋습니다. 바다가 잔잔하네요.', 'Fine day. The sea\'s calm.',
            { stance: 'mid', aff: { [OK]: -0.02, [TAK]: -0.02 }, next: 'o_rest' }),
          opt('clear_invite', '아까 앉으시라 한 건 제 말이었습니다. 할머니 말씀이 아니라요.', 'Asking you to sit earlier was me. Not her.',
            { stance: 'giver', aff: { [OK]: 0.04, [TAK]: -0.04 }, requires: { flag: 'choice.n19_4_told_invite' }, next: 'o_rest' }),
          opt('take_kid', '(새벽이를 데리고 얼음 상자 뒤로 물러선다.)', '(I take Saebyeok and step back behind the ice boxes.)',
            { stance: 'giver', aff: { [SAE]: -0.02, [OK]: 0.02 }, requires: { flag: 'choice.n19_4_sent_saebyeok' }, next: 'o_rest' }),
        ], ''),
      o_rest: say(
        '(바다를 본 채로) …받침. 물 잘 빠지더라.\n\n(그 말을 하고는 얼음 집게만 만지작거린다.)',
        '(Still facing the sea) ...The rests. They drain well.\n\n(Having said it, she just fiddles with the ice tongs.)',
        [
          opt('quiet_a', '(가만히 있는다.)', '(I keep quiet.)',
            { stance: 'self', next: 't_nodes' }),
          opt('tell_gaps', '두 번째 건 일부러 틈을 넓혀 깎으셨답니다.', 'He cut the gaps wider on the second one. On purpose.',
            { stance: 'giver', aff: { [OK]: 0.04, [TAK]: -0.04 }, next: 't_flustered' }),
        ]),
      t_nodes: say(
        '…마디를 띄워 깎았으니까. (무릎을 짚는다. 한참 있다가) 좌판이 바다 쪽으로 기울었더라. 그래서 두 번째는 틈을 넓혔다.\n\n(말해 놓고 입을 다문다. 너무 많이 말했다는 얼굴이다.)',
        "...Because I cut the nodes apart. (He rests his hands on his knees. After a long while) The stall leans towards the sea. So I widened the gaps on the second one.\n\n(He says it and shuts his mouth. He looks like a man who's said too much.)",
        [
          opt('quiet_b', '(얼음만 고른다.)', '(I just sort the ice.)',
            { stance: 'self', next: 'o_food' }),
          opt('tell_hesitate', '할머니가 반찬 싸 놓고 한참 망설이셨습니다.', 'She packed that food and hesitated over it a long time.',
            { stance: 'other', aff: { [OK]: -0.05, [TAK]: 0.04 }, next: 'o_food' }),
        ], TAK),
      t_flustered: say(
        '(헛기침을 한다.) …쓸데없는 소리를. 물이 한쪽으로 고여서 고친 거다. 그뿐이다.\n\n(그래도 할머니 쪽 받침을 한 번 본다. 할머니도 그 받침을 본다. 둘의 눈이 받침 위에서 잠깐 만난다.)',
        "(He clears his throat.) ...Nonsense. Water pooled on one side, so I fixed it. That's all.\n\n(Still, he glances once at the rest on her side. She looks at it too. Their eyes meet, briefly, on the rest.)",
        [
          opt('quiet_c', '(못 본 척 얼음을 고른다.)', '(I pretend not to see and sort the ice.)',
            { stance: 'self', next: 'o_food' }),
        ], TAK),
      o_food: say(
        '(얼음 집게를 만지작거리다가, 바다를 본 채로) …반찬은. 입에 맞던가.\n\n(대답을 기다리는 얼굴은 아니다. 그래도 집게가 멈춰 있다.)',
        "(Fiddling with the tongs, still facing the sea) ...The food. Was it to your taste?\n\n(She doesn't look as if she's waiting for an answer. Still, the tongs have stopped.)",
        [
          opt('quiet_e', '(가만히 있는다.)', '(I keep quiet.)',
            { stance: 'self', next: 't_food' }),
          opt('speak_for', '맛있게 드셨답니다. 젓가락 소리가 한참 났습니다.', 'He enjoyed it. I heard his chopsticks going a long while.',
            { stance: 'giver', aff: { [OK]: 0.03, [TAK]: -0.04 }, next: 't_food' }),
          opt('double_down', '고맙다고 하셨잖아요, 그때.', 'You said thank you, back then.',
            { stance: 'mid', aff: { [TAK]: -0.03 }, requires: { flag: 'choice.n19_white_thanks', notFlag: 'choice.n19_thanks_confessed' }, next: 'lie_out' }),
          opt('say_it', '노인장, 그때 못 하신 말씀 있지 않으십니까.', "Sir, wasn't there something you couldn't say back then?",
            { stance: 'other', aff: { [TAK]: -0.02, [OK]: 0.02 }, requires: { flag: 'choice.n19_thanks_owned' }, next: 't_thanks' }),
        ]),
      t_food: say(
        '…비워 보냈잖나. (한참 있다가) 씻어서.\n\n(그게 대답의 전부다. 할머니가 고개를 아주 조금 끄덕인다. 그 뒤로는 아무도 말이 없다.)',
        "...I sent it back empty, didn't I. (After a long while) Washed.\n\n(That is the whole of his answer. She nods, very slightly. After that, nobody says anything.)",
        [
          opt('wait_out', '(십 분이 다 갈 때까지 얼음 상자 옆을 지킨다.)', '(I stay by the ice boxes until the ten minutes are up.)',
            { stance: 'self', end: endTalk({
              lineKo: '(탁 노인이 먼저 일어선다. 할머니는 그 등을 보지 않는다. 대신 얼음 상자 하나를 빈 의자 쪽으로 반 뼘 밀어 둔다.)',
              lineEn: "(Old Tak gets up first. She doesn't watch him go. Instead she pushes one ice box half a hand's width towards the empty chair.)" }) }),
          opt('tomorrow_too', '내일도 이맘때 의자를 놓아 두겠습니다.', "I'll put the chairs out about this time tomorrow too.",
            { stance: 'mid', aff: { [OK]: 0.02, [TAK]: 0.02 }, end: endTalk({
              lineKo: '…쓸데없는 소리. (얼음 집게를 다시 든다. 그래도 의자는 접지 않는다. 일어서던 탁 노인이 의자 등받이를 한 번 쓸어 보고 간다.)',
              lineEn: '...Nonsense. (She takes up the tongs again. Still, she doesn\'t fold the chairs. Getting to his feet, Old Tak runs his hand once along the back of his chair before he goes.)' }) }),
          opt('more_to_say', '두 분, 하실 말씀이 더 있지 않으십니까?', "Isn't there more the two of you want to say?",
            { stance: 'mid', aff: { [OK]: -0.04, [TAK]: -0.04 }, end: endTalk({
              lineKo: '(둘 다 대답이 없다. 할머니는 얼음 상자 뚜껑을 탁 닫고, 탁 노인은 무릎을 짚고 일어선다. 그래도 십 분은 앉아 있었다.)',
              lineEn: '(Neither answers. She snaps the ice box lid shut, and Old Tak puts his hands on his knees and stands. Still, they sat for ten minutes.)' }) }),
        ], TAK),
      lie_out: say(
        '(무릎을 짚던 손이 멈춘다.) …내가? 고맙다고?\n\n(할머니가 나를 본다. 탁 노인도 나를 본다. 한참. 그러다 노인이 바다 쪽으로 고개를 돌린다.) …했지. 했다. 고맙다고.',
        '(The hand on his knee goes still.) ...I did? Said thank you?\n\n(She looks at me. So does he. For a long time. Then the old man turns his face to the sea.) ...I did. I said it. Thank you.',
        [
          opt('let_it_stand', '(아무 말도 하지 않는다.)', '(I say nothing.)',
            { stance: 'self', end: endTalk({
              lineKo: '(할머니가 얼음 상자 뚜껑을 닫는다. 귀가 붉다. 그 뒤로 십 분, 아무도 말하지 않았다. 탁 노인이 먼저 일어서고, 할머니가 빈 의자 쪽으로 얼음 상자 하나를 반 뼘 밀어 둔다.)',
              lineEn: "(She shuts the ice box lid. Her ears are red. For ten minutes after that, nobody speaks. Old Tak gets up first, and she pushes an ice box half a hand's width towards the empty chair.)" }) }),
          opt('confess_both', '…사실은 제가 지어낸 말이었습니다.', '...The truth is, I made it up.',
            { stance: 'other', aff: { [OK]: -0.03, [TAK]: 0.04 }, end: endTalk({
              lineKo: '…지어낸 말을, 이 영감이 했다잖냐. (나를 노려보다가 탁 노인 쪽을 본다.) 그럼 한 거다.\n\n(얼음 상자 뚜껑을 닫는다. 그 뒤로는 아무 말이 없었다. 십 분.)',
              lineEn: "...You made it up, and he says he said it. (She glares at me, then looks at Old Tak.) Then he said it.\n\n(She shuts the ice box lid. After that, nothing more is said. Ten minutes.)" }) }),
        ], TAK),
      t_thanks: say(
        '(나를 노려본다. 그러다 바다 쪽을 본다. 한참.)\n\n…고마웠다. 반찬. (그 한마디를 하고 입을 다문다. 할머니의 얼음 집게가 허공에서 멈춘다.)',
        '(He glares at me. Then he looks out to sea. For a long time.)\n\n...Thank you. For the food. (He says that one thing and closes his mouth. Her tongs stop in midair.)',
        [
          opt('look_away', '(못 들은 척 얼음 상자를 닦는다.)', '(I pretend not to hear and wipe down the ice box.)',
            { stance: 'self', end: endTalk({
              lineKo: '(할머니는 대답하지 않는다. 대신 얼음 상자 하나를 탁 노인 의자 쪽으로 반 뼘 밀어 둔다. 그 뒤로 십 분, 아무도 말하지 않았다.)',
              lineEn: "(She doesn't answer. Instead she pushes an ice box half a hand's width towards Old Tak's chair. For ten minutes after that, nobody speaks.)" }) }),
        ], TAK),
    },
  },

  // ═══════════════════════════════════════════
  // N19-5 「병실 앞 복도」 — 끝내는 자리(탁만수). 병실에서 십 분을 보내고 나온 뒤. 「오십 년」은 여기서부터
  // ═══════════════════════════════════════════
  {
    id: 'n19_5_done', questId: 'N19-5', at: 'complete', npcId: TAK, start: 'start',
    nodes: {
      start: say(
        '(병실 문이 등 뒤에서 닫힌다. 탁 노인이 복도 벽에 등을 기댄다. 손에 들었던 받침이 없다. 지팡이만 쥐고 있다.) …들어갔다. 십 분.\n\n오십 년 만에. (천장을 본다.) 자네가 문을 열었지.',
        "(The ward door closes behind him. Old Tak leans his back against the corridor wall. The rest he was holding is gone. Only the cane is in his hand.) ...I went in. Ten minutes.\n\nAfter fifty years. (He looks up at the ceiling.) You opened the door.",
        [
          opt('your_feet', '문만 열었습니다. 걸어 들어가신 건 노인장 발입니다.', 'I only opened the door. Your own feet walked you in.',
            { stance: 'giver', aff: { [TAK]: 0.05 }, next: 'feet' }),
          opt('what_inside', '안에서… 무슨 말씀을 나누셨습니까?', 'Inside... what did the two of you talk about?',
            { stance: 'mid', next: 'inside' }),
          opt('how_is_she', '할머니는 좀 어떠십니까?', 'How is she?',
            { stance: 'other', aff: { [OK]: 0.02 }, next: 'her' }),
          opt('fare', '병원까지 온 여비는 받겠습니다.', "I'll take my fare for coming to the hospital.",
            { stance: 'self', aff: { [TAK]: -0.03 }, end: endTalk({ complete: 'pay',
              lineKo: '…그러지. (지갑을 꺼내는 손이 떨린다. 안도다.)\n\n여비는 줘야지. 여기까지 끌고 온 건 나니까. 자네 아니었으면 나는 아직 이 벽에 붙어 있었을 거다.',
              lineEn: "...I will. (His hand shakes taking out his wallet. Relief.)\n\nYour fare's owed. I'm the one who dragged you here. If not for you, I'd still be stuck to this wall." }) }),
        ]),
      feet: say(
        '(벽에 기댄 채 소리 없이 웃는다.) …발이라. 발은 늘 그 문 앞까지만 갔다. 거기서 돌아섰지.\n\n열린 문으로 들어가는 건 쉽더라. 그걸 오십 년 몰랐다. 자네는 젊을 때 알았으니 다행이다.',
        "(Still leaning on the wall, he laughs without a sound.) ...My feet. My feet only ever got as far as that door. They turned back there.\n\nWalking through an open door turned out to be easy. It took me fifty years to learn that. Lucky you learned it young.",
        [
          opt('bow', '(고개를 숙여 인사한다.)', '(I bow my head.)',
            { stance: 'giver', end: endTalk({ complete: 'open_door',
              lineKo: '(품에서 대나무 한 토막을 꺼내 칼집을 낸다.) 넷째를 깎아야겠다. 머리맡에 둘 거다. 이번엔 작게.',
              lineEn: '(He takes a length of bamboo from his coat and makes a first cut.) I\'ll have to carve a fourth. For beside her pillow. Small, this time.' }) }),
          opt('help_next', '넷째 받침 깎으실 때, 이번엔 옆에서 거들겠습니다.', "When you carve the fourth, let me help this time.",
            { stance: 'mid', aff: { [TAK]: 0.02 }, end: endTalk({ complete: 'help_carve',
              lineKo: '거들어라. 병실에 둘 건 작게 깎는다. (대나무를 결 따라 가르는 시늉을 해 보인다.)\n\n크게 깎는 건 힘으로 하고, 작게 깎는 건 숨으로 한다. 숨 참고 해 봐.',
              lineEn: 'Help, then. One for a sickroom gets carved small. (He mimes splitting bamboo along the grain.)\n\nCarving big takes strength. Carving small takes breath. Hold your breath and try.' }) }),
        ]),
      inside: say(
        '…말은 무슨. (손바닥을 내려다본다.) 받침을 내밀었다. 그 사람이 무릎에 올려놓고 마디를 세더라. 하나, 둘. 소리 내서.\n\n그게 다다. 십 분 동안 마디를 셌다. …그거면 됐다.',
        "...Talk, nothing. (He looks down at his palms.) I held out the rest. She laid it on her lap and counted the nodes. One, two. Out loud.\n\nThat's all. For ten minutes she counted nodes. ...That was enough.",
        [
          opt('long_wait', '복도에서 기다린 십 분도 길었습니다.', 'The ten minutes I waited out here were long too.',
            { stance: 'mid', aff: { [TAK]: 0.03 }, end: endTalk({ complete: 'wait',
              lineKo: '오십 년보다 길었을 거다. (품에서 대나무 한 마디를 꺼내 내민다.) 첫 받침 깎고 남은 거다.\n\n버리지 말고 둬라. 처음이 남아 있어야 끝을 안다.',
              lineEn: "Longer than fifty years, I'd think. (He takes a single length of bamboo from his coat and holds it out.) What was left from cutting the first rest.\n\nDon't throw it away. You need what's left of the beginning to know the end." }) }),
          opt('too_long', '마디만 세시기엔 오십 년이 너무 길지 않습니까.', 'Isn\'t fifty years too long to spend just counting nodes?',
            { stance: 'other', aff: { [TAK]: -0.04 }, end: endTalk({ complete: 'pay',
              lineKo: '(벽에서 등을 뗀다.) …긴 줄은 내가 안다. 자네가 셀 일은 아니다.\n\n(지갑을 꺼낸다.) 여비다. 받아라. 오늘은 여기까지.',
              lineEn: "(He pushes himself off the wall.) ...I know how long it was. It isn't yours to count.\n\n(He takes out his wallet.) Your fare. Take it. That's enough for today." }) }),
          opt('said_it', '그때 못 하신 말씀은, 하셨습니까?', "Those words you couldn't say back then. Did you say them?",
            { stance: 'giver', aff: { [TAK]: 0.04 }, requires: { flag: 'choice.n19_thanks_owned' }, end: endTalk({ complete: 'open_door',
              lineKo: '(한참 있다가 고개를 끄덕인다.) …했다. 고마웠다고. 이번엔 얼굴 보고.\n\n자네가 지어낸 말, 이제 다 내 말이다.',
              lineEn: "(After a long while, he nods.) ...I did. Said thank you. Looking at her, this time.\n\nThose words you made up. They're all mine now." }) }),
        ]),
      her: say(
        '…모른다. 의사 말은 귀에 안 들어오더라. (손바닥을 내려다본다.) 얼굴이 작아졌더라. 좌판에서 보던 얼굴보다.\n\n그래도 웃었다. 받침을 보고. 그 사람 웃는 걸 오랜만에 봤다.',
        "...I don't know. What the doctor says doesn't go into my ears. (He looks down at his palms.) Her face had got smaller. Smaller than the face I'd see at the stall.\n\nStill, she smiled. At the rest. It's been a long time since I saw her smile.",
        [
          opt('smiled_enough', '웃으셨으면 됐습니다.', "If she smiled, that's what matters.",
            { stance: 'giver', aff: { [TAK]: 0.02 }, end: endTalk({ complete: 'wait',
              lineKo: '(벽에서 등을 뗀다.) …그래. 웃었으면 됐다. (품에서 대나무 한 마디를 꺼내 내 손에 쥐여 준다.)\n\n첫 받침 깎고 남은 거다. 품삯 대신이다. 버리지 말고 둬라.',
              lineEn: "(He pushes himself off the wall.) ...Right. If she smiled, that's enough. (He takes a length of bamboo from his coat and presses it into my hand.)\n\nWhat was left from cutting the first rest. In place of a wage. Don't throw it away." }) }),
          opt('i_told_her', '병원 가 보시라고 했던 게 저였습니다. 손이 느려지셨을 때요.', 'I was the one who told her to see a doctor. Back when her hands slowed down.',
            { stance: 'other', aff: { [TAK]: 0.03, [OK]: 0.02 }, requires: { flag: 'choice.m2_okseon_worry' }, end: endTalk({ complete: 'open_door',
              lineKo: '(나를 오래 본다.) …자네가 그랬나. 그 사람이 병원에 제 발로 올 사람이 아닌데. 자네 말은 들었구나.\n\n(품에서 대나무 토막을 꺼낸다.) 넷째를 깎아야겠다. 머리맡에 둘 거다.',
              lineEn: "(He looks at me a long time.) ...That was you? She's not one to walk into a hospital on her own feet. She listened to you, then.\n\n(He takes a length of bamboo from his coat.) I'll have to carve a fourth. For beside her pillow." }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N19-6 「손을 잡는 데 오십 년」 — 끝내는 자리(정옥선) · 결말은 하나(정본 `n19_seat`)
  // ═══════════════════════════════════════════
  {
    id: 'n19_6_done', questId: 'N19-6', at: 'complete', npcId: OK, start: 'start',
    nodes: {
      start: say(
        '(휠체어 팔걸이에 손을 얹은 채 바다를 본다. 옆 의자에 탁 노인이 앉아 있다. 받침 셋이 나란히 놓여 있다.) …앉았다. 둘이.\n\n(목소리를 낮춘다.) 손 잡았지. 봤냐. 아니, 못 본 척했지. 그치?',
        "(Her hand resting on the arm of the wheelchair, she looks out to sea. Old Tak sits in the chair beside her. Three rests lie in a row.) ...We sat. The two of us.\n\n(She lowers her voice.) We held hands. Did you see? No. You pretended not to. Right?",
        [
          opt('saw_nothing', '아무것도 못 봤습니다. 얼음만 보고 있었습니다.', "I didn't see a thing. I was watching the ice.",
            { stance: 'giver', aff: { [OK]: 0.04 }, next: 'good_kid' }),
          opt('saw_it', '봤습니다. 두 분 손 잡으시는 거.', 'I saw. The two of you holding hands.',
            { stance: 'other', aff: { [OK]: -0.02, [TAK]: 0.03 }, next: 'saw' }),
          opt('fifty_years', '오십 년 걸리셨네요.', 'It took you fifty years.',
            { stance: 'mid', aff: { [OK]: -0.03, [TAK]: -0.03 }, next: 'fifty' }),
          opt('fee', '중매값은 두둑이 받아야겠습니다.', "I'd better be paid well for the matchmaking.",
            { stance: 'self', aff: { [OK]: -0.02 }, end: endTalk({ complete: 'pay', ending: 'n19_seat',
              lineKo: '중매… 그래, 받아. 오십 년 치. (봉투 대신 좌판 서랍 열쇠를 내 손바닥에 올려 놓는다.)\n\n서랍 열쇠는 아무한테나 안 준다. 돈은 쓰면 없어져도 서랍은 남아.',
              lineEn: "Matchmaking... fine, take it. Fifty years' worth. (Instead of an envelope she sets the key to the stall drawer on my palm.)\n\nI don't give the drawer key to just anyone. Money's gone once it's spent. The drawer stays." }) }),
        ]),
      good_kid: say(
        '(입꼬리만 올려 웃는다.) …착한 애다. 얼음만 봤구나. 그래야지.\n\n(탁 노인이 헛기침을 한다. 그쪽은 보지 않고 말을 잇는다.) 너한테 줄 게 있다. 받기 싫다고는 하지 마라.',
        "(She smiles, only at the corners of her mouth.) ...Good kid. You only saw the ice. That's right.\n\n(Old Tak clears his throat. She goes on without looking his way.) I've something to give you. Don't tell me you won't take it.",
        [
          opt('take_it', '(두 손으로 받는다.)', '(I take it with both hands.)',
            { stance: 'giver', end: endTalk({ complete: 'pretend', ending: 'n19_seat',
              lineKo: '(만복상회 열쇠 꾸러미를 내 손에 쥐여 준다.) 좌판, 이제 네 거다. …아니. 둘이 앉을 자리만 남기고.',
              lineEn: "(She closes my hand around the Manbok Store keys.) The stall's yours now. ...No. Except for a place for two to sit." }) }),
          opt('teach_again', '그보다, 좌판 일을 할머니 말로 한 번 더 듣고 싶습니다.', "Rather than that, I'd like to hear how to run the stall once more, in your words.",
            { stance: 'mid', end: endTalk({ complete: 'stall_words', ending: 'n19_seat',
              lineKo: '말로? 그래, 손은 이제 네 거니까. (손가락을 하나씩 접는다.) 얼음 먼저, 그다음 진열, 값은 마지막.\n\n처음에 가르친 그대로다. 그 순서만 안 잊으면 이 좌판은 안 망해.',
              lineEn: "In words? All right. The hands are yours now. (She folds down a finger for each.) Ice first, then the display, price last.\n\nExactly what I taught you at the start. Don't forget that order and this stall won't go under." }) }),
        ]),
      saw: say(
        '…봤어? (얼굴이 붉어진다. 그러다 웃음이 터진다.) 그래, 봐라. 봤으면 봤지.\n\n숨길 나이도 지났다. (탁 노인도 웃는다. 소리 없이, 어깨만.) …그래도 동네방네 떠들지는 마라. 저 영감 얼굴 빨개지는 거 못 본다.',
        "...You saw? (Her face flushes. Then she bursts out laughing.) Fine, look. If you saw, you saw.\n\nWe're past the age for hiding. (Old Tak laughs too, without a sound, only his shoulders.) ...Still, don't go telling the whole harbour. I can't bear watching that old man's face go red.",
        [
          opt('wont_tell', '아무한테도 말 안 하겠습니다.', "I won't tell a soul.",
            { stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({ complete: 'saw', ending: 'n19_seat',
              lineKo: '그래. 너만 알아. (고개를 끄덕이고는, 휠체어를 조금 돌려 탁 노인 쪽으로 반 뼘 다가앉는다.)',
              lineEn: 'Good. Just you. (She nods, then turns her wheelchair a little and edges half a hand\'s width closer to Old Tak.)' }) }),
          opt('tell_saebyeok', '새벽이한테는 말해도 되지요?', 'I can tell Saebyeok, though?',
            { stance: 'other', aff: { [TAK]: -0.03, [SAE]: 0.02 }, end: endTalk({ complete: 'saw', ending: 'n19_seat',
              lineKo: '(탁 노인이 헛기침을 크게 한다.) …그 애는 벌써 알 거다. 제 할아버지 대 깎는 소리만 들어도 안다더라.',
              lineEn: '(Old Tak clears his throat loudly.) ...That child knows already. He says he can tell from the sound of his grandfather\'s carving.' }) }),
        ]),
      fifty: say(
        '(헛기침을 한다.) …세지 마라. 세는 건 그만두는 사람이나 하는 거다.\n\n(할머니 쪽은 보지 않는다. 대신 받침 셋을 차례로 본다.) 오래 걸린 건 안다. 그러니 이제부터는 안 센다.',
        "(He clears his throat.) ...Don't count. Counting is for people who are stopping.\n\n(He doesn't look her way. Instead he looks at the three rests, one by one.) I know it took long. So from now on, I don't count.",
        [
          opt('no_more_count', '그럼 저도 이제 안 세겠습니다.', "Then I won't count either.",
            { stance: 'mid', aff: { [TAK]: 0.02, [OK]: 0.02 }, end: endTalk({ complete: 'saw', ending: 'n19_seat',
              lineKo: '저 영감 말 듣지 마라. (웃음을 터뜨린다.) 하루도 안 빼고 센 사람이다.\n\n(탁 노인의 귀가 붉어진다. 팔걸이 위에서 두 손이 다시 겹친다.)',
              lineEn: "Don't listen to the old man. (She bursts out laughing.) He's counted every single day of it.\n\n(Old Tak's ears go red. On the armrest, their two hands meet again.)" }) }),
          opt('look_at_ice', '(못 들은 척 얼음만 본다.)', '(I pretend not to hear and look at the ice.)',
            { stance: 'giver', end: endTalk({ complete: 'pretend', ending: 'n19_seat',
              lineKo: '(웃는다.) …착한 애다. 얼음만 봤지. (만복상회 열쇠 꾸러미를 내 손에 쥐여 준다.)\n\n좌판, 이제 네 거다. 둘이 앉을 자리만 남기고.',
              lineEn: "(She smiles.) ...Good kid. You only saw the ice. (She closes my hand around the Manbok Store keys.)\n\nThe stall's yours now. Except for a place for two to sit." }) }),
        ], TAK),
    },
  },
];
