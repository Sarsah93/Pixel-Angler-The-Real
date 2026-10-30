/**
 * @file StoryTalkN19.ts
 * @description 254차 — N19 「정옥선 · 탁만수 — 오십 년의 거리」 이어지는 대화. 규칙은 `StoryTalks.ts` 머리 주석.
 *   290차 — 대본(주고받는 장면)으로 고쳐 썼다(`.agents/inputs/290_talk_brief.md`). 단계 id · 고를 말 id · 표시 · 우호도 · 조건 · 끝 · 결말은
 *   254차 그대로 두고 대사 꼴만 바꿨다. 끝말에 몸짓 · 지문이 섞여 있던 곳은 말만 남기거나, 지문이 줄거리인 곳(넷째 편 부르기 · 지켜보기)은
 *   뒤에 장면 하나를 더해 그리로 옮겼다(고른 말 id는 그대로 · 끝은 그 장면이 진다). 받는 끝은 옛 받는 답(`offer`)에 묶어 옛 표시를 잇는다.
 *   받는 · 끝내는 자리가 없던 편(일곱째 · 여덟째 · 둘째 끝 · 셋째 끝 · 넷째 받기 · 끝 · 다섯째 받기 · 여섯째 받기)은 새로 썼다.
 *
 * 인물: 탁만수(78 · 죽간 공방 — 짧고 자존심이 세다 · 「~다」 「~마라」 · 정옥선을 끝내 「그 사람」이라고만 부른다 · 다섯째 편부터 나를 「자네」라 부른다)
 *       · 정옥선(71 · 만복상회 좌판 — 퉁명스러운 반말 · 「~냐」 「아니다. 아니, 네가 좀」 · 탁만수를 「탁 씨」 「그 영감」이라 부른다 · 나를 「너」 「애」라 부른다)
 *       · 탁새벽(12 · 탁만수의 손자 — 넷째 편 부르기에만).
 *       주인공은 둘 사이를 오가는 심부름꾼이다. 두 사람은 모르는 채로 같은 말을 한다
 *       (「가까워서 못 가는 데도 있다」 · 「그 사람이 뭘」 · 「아는 거하고 말하는 거는 다르다」) — 갈래가 그 겹침을 드러낸다.
 *       290차 호칭 — 주인공은 두 사람을 「탁만수 씨」 · 「정옥선 씨」(영어는 Mansu · Okseon), 아이는 「탁새벽 씨」라 부른다.
 *
 * 정본(뒤 이야기가 기대는 아크 — 결말 `n19_seat` 하나): 고른 말은 우호도 · 대사 · 표시만 바꾸고 목표와 뒤 편은 그대로다.
 *  - 받침을 놓을 때 누가 보냈는지는 말하지 않았다(현장 지점 문장) · 반응 장면의 「…모르겠어요.」(사용자 각본 168차)는 고정이다.
 *    그래서 첫 편에는 「이름을 댔다」 갈래가 없다. 「말 못 한다고만 했다」가 가장 멀리 간 갈래다.
 *  - 「오십 년」은 「병실 앞 복도」 끝내는 자리부터 · 입원은 「병실 앞 복도」 받는 자리 전에 꺼내지 않는다 · 재개관식은 이 이야기에서 꺼내지 않는다.
 *  - 넷째 편 「대화를 끝까지 지켜본다」는 몇 마디뿐이다 — 끝내는 자리 답(「말이 없던 십 분」)과 어긋나지 않게.
 *    지어낸 「고맙다」(둘째 편)가 거기서 탁만수 자신의 말이 된다 — 이 이야기의 절정.
 *  - 「귀퉁이 바구니」는 작물 이름을 대지 않는다(텃밭 입문 — 받는 것은 철이 정한다).
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
 *  - 옛 받는 답의 표시(choice.n19_1_asked_rest · n19_2_asked_who …)는 받는 끝의 `offer`가 남긴다(290차).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const TAK = 'tak_mansu';
const OK = 'okseon';
const SAE = 'tak_saebyeok';
const P = 'player';
/** 지문(괄호 서술) */
const N = '';

export const TALKS_N19: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N19-1 「얼음과 대나무」 — 받는 자리(탁만수)
  // ═══════════════════════════════════════════
  {
    id: 'n19_1_offer', questId: 'N19-1', at: 'offer', npcId: TAK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(공방 앞 평상 위에 천으로 싼 것이 놓여 있다. 탁만수 씨가 칼을 쥔 채 턱으로 그것을 가리킨다.)',
          '(Something wrapped in cloth lies on the bench outside the workshop. Knife still in hand, Mansu points at it with his chin.)'),
        line(TAK, '그거.', 'That.'),
        line(P, '이거요? 천에 싼 거 말씀이세요?', 'This? The thing in the cloth?'),
        line(TAK, '얼음 상자 받침이다. 대로 깎았다.', "A rest for an ice box. I carved it from bamboo."),
        line(P, '공방에서 쓰시려고요?', 'For the workshop?'),
        line(TAK, '내가 쓸 거 아니다. 만복상회. 동명동 직판장 좌판.', "Not for me. Manbok Store. The stall at the Dongmyeong market."),
        line(P, '정옥선 씨 좌판이요?', "Okseon's stall?"),
        line(TAK, '지나는 길에 좀 놓고 와라. 얼음 나르는 날이면 그 김에.', "Drop it off on your way past. On a day you're hauling ice, do it then."),
        line(P, '놓기만 하면 되는 거예요?', 'I just leave it there?'),
        line(TAK, '좌판 얼음통 밑에 밀어 넣기만 하면 된다.', 'Just slide it under the ice tub at the stall.'),
        act(TAK, 'silence'),
        line(TAK, '…내가 줬다고는 하지 말고.', "...And don't say it came from me.", { act: 'look_away' }),
        line(P, '(이름을 빼 달라니… 무슨 사연이 있는 걸까.)', '(Leave his name out... I wonder what the story is.)'),
      ], {
        choices: [
          opt('carry', '지나는 길에 놓고 오겠습니다. 이름은 빼고요.', "I'll drop it off on my way. Your name stays out of it.", {
            say: ['알겠습니다. 지나는 길에 놓고 오겠습니다. 이름은 빼고요.', "All right. I'll drop it off on my way. Your name stays out of it."],
            stance: 'giver', aff: { [TAK]: 0.04 }, end: endTalk({ accept: true, offer: 'carry',
              lineKo: '…그래. 이름은 빼고. 두고만 와라. 무슨 말을 듣든 그냥 듣고 오고.',
              lineEn: "...Right. Leave the name out. Just leave it there. Whatever you hear, just hear it and come back." }),
            note: ['이름은 빼고 지나는 길에 놓고 오겠다고 했다. 탁만수 씨는 두고만 오라고, 무슨 말을 듣든 그냥 듣고 오라고 했다.',
              "I said I'd drop it off on my way and keep his name out of it. Mansu told me to just leave it, and to simply listen to whatever I heard."] }),
          opt('what_for', '받침 하나로 얼음이 그렇게 달라집니까?', 'Does one rest really make that much difference to the ice?', {
            say: ['받침 하나로 얼음이 그렇게 달라집니까?', 'Does one rest really make that much difference to the ice?'],
            stance: 'mid', next: 'rest' }),
          opt('why_not_you', '가까운데, 직접 갖다 드리시면 안 됩니까?', "It's close by. Couldn't you take it to her yourself?", {
            say: ['공방에서 직판장까지 가까운데요. 직접 갖다 드리시면 안 됩니까?', "The market's close to the workshop. Couldn't you take it to her yourself?"],
            stance: 'other', aff: { [TAK]: -0.03 }, flags: ['choice.n19_heard_close'], next: 'close' }),
          opt('not_sneak', '남의 좌판에 몰래 물건을 두는 건 내키지 않습니다.', "I don't feel right sneaking things onto someone's stall.", {
            say: ['남의 좌판에 몰래 물건을 두는 건 좀 내키지 않습니다.', "I don't feel right sneaking things onto someone's stall."],
            stance: 'self', aff: { [TAK]: -0.03 }, end: endTalk({ decline: true,
              lineKo: '…몰래가 아니다. 말을 안 할 뿐이지. 됐다, 가 봐라.',
              lineEn: "...It isn't sneaking. It's just not saying. Fine. Off you go." }),
            note: ['남의 좌판에 몰래 두는 건 내키지 않는다고 했다. 탁만수 씨는 몰래가 아니라 말을 안 할 뿐이라며 받침을 도로 내려놓았다.',
              "I said I didn't feel right sneaking it onto her stall. Mansu said it wasn't sneaking, just not saying, and set the rest back down."] }),
        ],
        note: ['탁만수 씨가 대나무로 깎은 얼음 상자 받침을 보여 주었다. 얼음 나르는 김에 만복상회 좌판 얼음통 밑에 밀어 넣고 오라며, 자기가 줬다고는 하지 말라고 했다.',
          "Mansu showed me an ice-box rest he'd carved from bamboo. He asked me to slide it under the ice tub at Manbok Store next time I haul ice, and not to say it came from him."],
      }),
      rest: scene([
        line(TAK, '봐라.', 'Look.', { act: 'peer' }),
        line(N, '(천을 걷고 받침을 뒤집어 보인다. 마디와 마디 사이가 떠 있다.)', '(He pulls back the cloth and turns the rest over. The nodes sit apart from each other.)'),
        line(P, '마디 사이가 손가락 한 마디쯤 떠 있네요.', "There's a finger's width between the nodes."),
        line(TAK, '얼음이 녹으면 물이 상자 밑에 고인다. 제 물에 잠긴 얼음은 금방 죽어.', 'When ice melts, water pools under the box. Ice sitting in its own water dies fast.'),
        line(P, '그 물이 틈으로 빠지는 거군요.', 'So the water drains through the gaps.'),
        line(TAK, '그래. 바람도 들고. 반나절은 더 간다.', 'Right. And air gets in. It buys half a day.'),
        line(TAK, '좌판 하는 사람한테 반나절이면, 그게 돈이다.', 'For someone who runs a stall, half a day is money.'),
      ], {
        choices: [
          opt('fit_level', '그럼 얼음통 밑에 수평 맞춰 넣어 두겠습니다.', "Then I'll fit it under the ice tub, nice and level.", {
            say: ['그럼 얼음통 밑에 수평 맞춰 넣어 두겠습니다.', "Then I'll fit it under the ice tub, nice and level."],
            stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({ accept: true, offer: 'ask_rest',
              lineKo: '그래. 기울면 물이 한쪽으로 몰린다. 수평 맞추고, 이름은 빼고.',
              lineEn: 'Good. If it tilts, the water runs to one side. Keep it level, and leave my name out.' }),
            note: ['수평을 맞춰 넣겠다고 하자, 탁만수 씨는 기울면 물이 한쪽으로 몰린다고 일렀다.', "When I said I'd set it level, Mansu warned that if it tilts the water runs to one side."] }),
          opt('drain_too', '얼음 나르는 김에 정옥선 씨 상자 물도 빼 드리겠습니다.', "While I'm hauling ice, I'll drain Okseon's box too.", {
            say: ['얼음 나르는 김에 정옥선 씨 상자에 고인 물도 빼 드리겠습니다.', "While I'm hauling ice, I'll drain the water from Okseon's box too."],
            stance: 'other', aff: { [TAK]: 0.02, [OK]: 0.02 }, end: endTalk({ accept: true, offer: 'ask_rest',
              lineKo: '…그래 주면. 그 상자, 혼자 기울이기엔 무겁다. …그 말은 내가 한 거 아니다. 가 봐라.',
              lineEn: "...If you would. That box is heavy to tip on your own. ...I never said that. Go on." }),
            note: ['상자 물도 빼 드리겠다고 하자, 탁만수 씨는 칼을 멈추고 혼자 기울이기엔 무거운 상자라고 했다가, 그 말은 자기가 한 게 아니라고 덧붙였다.',
              "When I offered to drain her box too, Mansu stopped his knife and said it was heavy to tip alone — then added that he'd never said so."] }),
        ],
        note: ['탁만수 씨가 받침을 뒤집어 보였다. 마디 사이를 띄워 깎아 녹은 물이 빠지고 바람이 들게 했고, 그러면 얼음이 반나절은 더 간다고 했다.',
          'Mansu turned the rest over to show me. He carved the nodes apart so meltwater drains and air gets in — it buys the ice half a day.'],
      }),
      close: scene([
        line(TAK, '…가깝지.', '...It is close.'),
        act(TAK, 'silence'),
        line(TAK, '가까워서 못 가는 데도 있다.', "Some places you can't go because they're close.", { act: 'look_away' }),
        line(P, '가까워서… 못 가신다고요?', "Because they're close... you can't go?"),
        line(TAK, '묻지 마라. 늙은이 일은 늙은이가 안다.', "Don't ask. Old people's business is for old people."),
        line(TAK, '너는 두고만 오면 돼. 그게 너한테도 편하다.', "You just leave it there. That's easier for you too."),
      ], {
        choices: [
          opt('wont_ask', '알겠습니다. 더 묻지 않겠습니다.', "Understood. I won't ask again.", {
            stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({ accept: true, offer: 'why_not_you',
              lineKo: '그래. 얼음 녹기 전에 가라.',
              lineEn: 'Good. Go before the ice melts.' }),
            note: ['더 묻지 않겠다고 했다. 탁만수 씨는 고개를 한 번 끄덕이고 얼음 녹기 전에 가라고 했다.', "I said I wouldn't ask again. Mansu nodded once and told me to go before the ice melted."] }),
          opt('if_asked', '정옥선 씨가 누가 두고 갔냐 물으시면요?', 'And if Okseon asks who left it?', {
            say: ['그럼 정옥선 씨가 누가 두고 갔냐고 물으시면요?', 'Then what if Okseon asks who left it?'],
            stance: 'mid', next: 'if_asked' }),
          opt('cant_either', '직접 못 가실 일이면 저도 못 하겠습니다.', "If you can't go yourself, I can't do it either.", {
            stance: 'self', aff: { [TAK]: -0.05 }, end: endTalk({ decline: true,
              lineKo: '…그래. 너까지 못 가면 이건 평상에서 먼지나 먹겠지. 가 봐라.',
              lineEn: "...Right. If you won't either, it just gathers dust on this bench. Go on." }),
            note: ['직접 못 가실 일이면 나도 못 하겠다고 했다. 탁만수 씨는 받침을 천으로 덮고, 그럼 평상에서 먼지나 먹겠다고 했다.',
              "I said if he couldn't go himself, I couldn't either. Mansu covered the rest and said it would just gather dust on the bench."] }),
        ],
        note: ['직접 가시면 안 되느냐고 묻자, 탁만수 씨는 가까워서 못 가는 데도 있다고만 했다. 늙은이 일은 묻지 말라고 했다.',
          "When I asked why he didn't go himself, Mansu only said some places you can't go because they're close. He told me not to ask about old people's business."],
      }),
      if_asked: scene([
        line(TAK, '…주웠다고 해라.', '...Say you found it.'),
        act(TAK, 'silence'),
        line(TAK, '아니다. 그건 거짓말이다.', "No. That's a lie.", { act: 'shake_head' }),
        line(P, '그럼 뭐라고 해요?', 'Then what do I say?'),
        line(TAK, '묻기 전에 나와라. 대답 못 할 말은 안 듣는 게 상책이다.', "Get out before she asks. Best not to hear a question you can't answer."),
        line(TAK, '그래야 너도 거짓말 안 하고, 그 사람도 거짓말 안 듣지.', 'That way you tell no lie, and she hears none.'),
      ], {
        choices: [
          opt('before_asked', '묻기 전에 나오겠습니다.', "I'll be out before she asks.", {
            stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({ accept: true, offer: 'if_asked',
              lineKo: '그래. 그게 제일 낫다. 가져가라.',
              lineEn: "Good. That's best. Take it." }),
            note: ['묻기 전에 나오겠다고 했다. 탁만수 씨는 그게 제일 낫다며 천에 싼 받침을 내 쪽으로 밀었다.', "I said I'd be out before she asked. Mansu said that was best and pushed the wrapped rest towards me."] }),
          opt('no_lie', '물으시면 거짓말은 못 하겠습니다. 정옥선 씨한테는요.', "If she asks, I can't lie. Not to Okseon.", {
            say: ['물으시면 거짓말은 못 하겠습니다. 정옥선 씨한테는요.', "If she asks, I can't lie. Not to Okseon."],
            stance: 'other', aff: { [TAK]: -0.04 }, end: endTalk({ accept: true, offer: 'if_asked',
              lineKo: '…그 사람한텐 다들 그렇지. 그래도 이름은 대지 마라. 그건 거짓말이 아니라 입을 다무는 거다.',
              lineEn: "...Everyone's like that with her. Still, don't give my name. That's not lying. That's keeping your mouth shut." }),
            note: ['정옥선 씨한테는 거짓말을 못 하겠다고 했다. 탁만수 씨는 한참 나를 보더니, 이름을 대지 않는 건 거짓말이 아니라 입을 다무는 거라고 했다.',
              "I said I couldn't lie to Okseon. Mansu looked at me a long while, then said not giving his name wasn't lying — it was keeping my mouth shut."] }),
        ],
        note: ['누가 두고 갔냐고 물으시면 어떡하느냐고 하자, 탁만수 씨는 주웠다고 하라고 했다가 그건 거짓말이라며 고쳤다. 묻기 전에 나오라고 했다.',
          "When I asked what to say if she asked who left it, Mansu told me to say I found it — then took it back as a lie. Get out before she asks, he said."],
      }),
    },
  },

  // N19-1 — 진행 중: 받침을 놓고 와서 알린다(「대나무 받침 전달」 셋째 단계 · 의뢰인 앞).
  //  다음 목표가 정옥선의 반응 장면(사용자 각본)이라 끝말은 모두 「얼음 보러 다시 가라」로 잇는다.
  {
    id: 'n19_1_report', questId: 'N19-1', at: 'action', objectiveIndex: 1, step: 2, npcId: TAK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(공방 앞 평상. 대를 깎던 칼이 내 빈손을 보고 멈춘다.)', '(The bench outside the workshop. His knife stops when he sees my empty hands.)'),
        line(TAK, '놓고 왔구나.', 'You left it.'),
        line(P, '네. 방금 놓고 왔어요.', 'Yes. Just now.'),
        line(TAK, '…그 사람, 좌판에 있더냐.', '...Was she at the stall?'),
        line(TAK, '아니다, 됐다.', 'No. Never mind.', { act: 'look_away' }),
        line(N, '(칼을 다시 든다. 칼날이 마디에 한 번 걸린다.)', '(He takes up the knife again. The blade catches once on a node.)'),
        line(TAK, '…뭐라던.', '...What did she say?'),
      ], {
        choices: [
          opt('name_out', '말씀대로 이름은 빼고, 얼음통 밑에 받쳐 두고 왔습니다.', 'As you said, I left your name out and set it under the ice tub.', {
            stance: 'giver', aff: { [TAK]: 0.04 }, next: 'edge' }),
          opt('said_secret', '누가 보낸 거냐 물으셔서, 그건 말 못 한다고만 했습니다.', "She asked who it was from. I only said I couldn't tell her.", {
            stance: 'mid', aff: { [TAK]: -0.03, [OK]: 0.03 }, flags: ['choice.n19_1_said_secret'], next: 'said_secret',
            note: ['정옥선 씨가 누가 보낸 거냐고 물어서, 그건 말 못 한다고만 했다고 털어놓았다.', "I admitted Okseon had asked who sent it, and I'd only said I couldn't tell her."] }),
          opt('she_knows', '말 안 해도 아실 겁니다. 이렇게 깎는 분이 이 항구에 또 있습니까.', "She'll know without being told. Who else in this harbour carves like that?", {
            stance: 'self', aff: { [TAK]: -0.02 }, next: 'knows' }),
          opt('go_next', '다음엔 직접 가시지요. 정옥선 씨도 그편이 나으실 겁니다.', "Next time, take it yourself. Okseon would prefer that too, I think.", {
            stance: 'other', aff: { [TAK]: -0.06 }, next: 'too_close' }),
        ],
        note: ['받침을 놓고 돌아오자 탁만수 씨는 내 빈손부터 보았다. 그 사람이 좌판에 있었느냐고 물으려다 그만두고, 뭐라더냐고만 했다.',
          'When I came back from leaving the rest, Mansu looked at my empty hands first. He started to ask whether she was at the stall, stopped, and only asked what she said.'],
      }),
      edge: scene([
        line(TAK, '…얼음통 밑에. 그래.', '...Under the ice tub. Good.'),
        line(TAK, '수평은 맞던?', 'Was it level?'),
        line(P, '네. 기울지 않게 맞춰 넣었어요.', "Yes. I fitted it so it wouldn't tilt."),
        line(TAK, '그 사람은. 보기만 하더냐. 손은 안 대고?', "And her. Did she just look at it? Didn't touch it?"),
      ], {
        choices: [
          opt('ran_edge', '모서리를 한 번 쓸어 보셨습니다.', 'She ran a hand along the edge once.', {
            say: ['모서리를 한 번 쓸어 보셨습니다. 손바닥으로요.', 'She ran her palm along the edge, once.'],
            stance: 'mid', aff: { [TAK]: 0.04 }, end: endTalk({
              lineKo: '…한 번. 그래. 한 번이면 됐다. 얼음이 오래 가는지 한 번 더 가서 봐 다오. 그 사람 말고, 얼음.',
              lineEn: '...Once. Right. Once is enough. Go back and see whether the ice lasts. Not her. The ice.' }),
            note: ['정옥선 씨가 모서리를 한 번 쓸어 보았다고 전했다. 탁만수 씨는 한참 말이 없다가, 한 번이면 됐다며 얼음이 오래 가는지 보고 오라고 했다.',
              'I told him Okseon had run a hand along the edge once. Mansu was silent a long while, then said once was enough and asked me to go and see whether the ice lasted.'] }),
          opt('pleased', '아주 마음에 들어 하시는 눈치였습니다.', 'She seemed very pleased with it.', {
            stance: 'giver', aff: { [TAK]: -0.02 }, end: endTalk({
              lineKo: '…그 사람이 그런 얼굴을 할 리가 없다. 듣기 좋게 말하려는 거, 네 얼굴에 다 쓰여 있어. 됐다. 얼음이나 오래 가는지 가서 봐라.',
              lineEn: "...She'd never make a face like that. You're trying to make it sound nice — it's written all over yours. Enough. Go and see whether the ice lasts." }),
            note: ['아주 마음에 들어 하는 눈치였다고 했다가, 듣기 좋게 말하려는 게 얼굴에 다 쓰여 있다는 소리를 들었다.', "I said she seemed very pleased, and was told it was written all over my face that I was trying to make it sound nice."] }),
          opt('nod_only', '(고개만 끄덕인다.)', '(I just nod.)', {
            stance: 'self', end: endTalk({
              lineKo: '…그래. 얼음이나 한 번 더 가서 봐 줘라.',
              lineEn: '...Right. Go and look at the ice once more for me.' }) }),
        ],
        note: ['이름은 빼고 얼음통 밑에 받쳐 두었다고 했다. 탁만수 씨는 수평이 맞았는지부터 묻고, 그 사람이 손을 대 보더냐고 물었다.',
          'I said I left his name out and set it under the ice tub. Mansu asked first whether it was level, then whether she had touched it.'],
      }),
      said_secret: scene([
        line(TAK, '말 못 한다고 했다고.', "You said you couldn't tell her."),
        act(TAK, 'silence'),
        line(TAK, '…그게 다 말한 거다.', "...That's telling her everything."),
        line(P, '네? 이름은 안 댔는데요.', "Sorry? I didn't give your name."),
        line(TAK, '보낸 사람이 따로 있다는 걸 알았으면 그 사람은 벌써 안다. 대 깎는 늙은이가 이 항구에 몇이나 된다고.', 'Once she knows there is a sender, she already knows who. How many old men carve bamboo in this harbour?'),
        act(TAK, 'sigh'),
        line(TAK, '…그래도 거짓말은 안 했구나.', "...Still, you didn't lie."),
      ], {
        choices: [
          opt('careless', '제 입이 가벼웠습니다. 다음엔 묻기 전에 나오겠습니다.', "That was careless of me. Next time I'll be out before she asks.", {
            stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({
              lineKo: '…다음이 있을지. 얼음 오래 가나, 가서 한 번 보고 와라.',
              lineEn: '...If there is a next time. Go and see whether the ice is lasting.' }) }),
          opt('couldnt_lie', '정옥선 씨 앞에서 거짓말은 못 하겠더군요.', "I couldn't bring myself to lie to Okseon's face.", {
            stance: 'other', aff: { [TAK]: -0.02 }, end: endTalk({
              lineKo: '…그 사람 앞에선 다들 그렇다. 나도 그랬다. 가 봐라. 얼음이나 오래 가는지.',
              lineEn: "...Everyone's like that in front of her. So was I. Go on. See whether the ice lasts." }),
            note: ['정옥선 씨 앞에서는 거짓말이 안 나오더라고 했다. 탁만수 씨는 한참 칼을 내려다보다가, 나도 그랬다고 했다.', "I said I couldn't lie in front of Okseon. Mansu looked down at his knife a long while and said he'd been the same."] }),
        ],
        note: ['탁만수 씨는 말 못 한다고 한 게 다 말한 거라며 한숨을 쉬었다. 그래도 거짓말은 안 했다고 했다.', "Mansu sighed that saying I couldn't tell her had told her everything. Still, he said, I hadn't lied."],
      }),
      knows: scene([
        line(TAK, '…알면 아는 거지.', '...If she knows, she knows.'),
        line(TAK, '아는 거하고 말하는 거는 다르다.', 'Knowing and saying are different things.'),
        line(P, '모른 척하실 거라는 말씀이세요?', "You mean she'll pretend not to know?"),
        line(TAK, '받침은 받침이다. 누가 깎았는지 얼음은 모른다. 그 사람도 모른 척할 거다.', "A rest is a rest. The ice doesn't know who carved it. She'll pretend not to know too."),
        line(TAK, '이 나이엔 그게 셈법이야.', "At our age, that's how the sums are done."),
      ], {
        choices: [
          opt('pretend_too', '그럼 저도 모르는 척하겠습니다.', "Then I'll pretend not to know too.", {
            stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({
              lineKo: '그래. 심부름꾼은 모르는 게 낫다. 얼음 오래 가는지나 가서 봐.',
              lineEn: "Right. Better the errand runner doesn't know. Just go and see whether the ice lasts." }) }),
          opt('too_even', '모른 척하기엔 마디가 너무 고르던데요.', 'Those nodes are too even for anyone to pretend.', {
            stance: 'other', aff: { [TAK]: -0.03 }, end: endTalk({
              lineKo: '…시끄럽다. 얼음이나 가서 봐라.',
              lineEn: '...Quiet. Go and look at the ice.' }),
            note: ['모른 척하기엔 마디가 너무 고르다고 했다가 시끄럽다는 소리를 들었다. 그래도 칼질이 조금 느려졌다.', "I said the nodes were too even to pretend, and was told to be quiet. Still, his knife slowed a little."] }),
        ],
        note: ['이렇게 깎는 사람이 또 있겠느냐고 하자, 탁만수 씨는 아는 거하고 말하는 거는 다르다고 했다. 이 나이엔 모른 척하는 게 셈법이라고.',
          "When I said nobody else carves like that, Mansu said knowing and saying are different things. At their age, pretending not to know is how the sums are done."],
      }),
      too_close: scene([
        line(TAK, '…가깝지. 가까우니까 못 가는 거다.', "...It's close. That's exactly why I can't go.", { act: 'look_up' }),
        line(TAK, '너는 몰라.', "You wouldn't know."),
        line(P, '…', '...'),
        line(TAK, '심부름꾼은 심부름만 해라. 그 사람이 뭘 낫게 여길지는 네가 정할 일이 아니다.', "An errand runner runs errands. What she'd prefer isn't yours to decide."),
      ], {
        choices: [
          opt('overstepped', '제가 주제넘었습니다.', 'I overstepped.', {
            stance: 'giver', aff: { [TAK]: 0.03 }, end: endTalk({
              lineKo: '주제넘은 게 아니라 젊은 거다. …얼음 오래 가는지 가서 봐 다오.',
              lineEn: 'Not overstepping. Just young. ...Go and see whether the ice lasts, would you.' }) }),
          opt('her_hand', '모서리를 쓸어 보시는 손이 그래 보였습니다.', 'The way her hand ran along the edge said so.', {
            stance: 'other', aff: { [TAK]: 0.02 }, end: endTalk({
              lineKo: '…손이 그랬다고. …얼음이나 가서 봐라. 오래 가는지.',
              lineEn: '...Her hand said so. ...Just go and look at the ice. See if it lasts.' }),
            note: ['정옥선 씨가 모서리를 쓸어 보던 손이 그래 보였다고 했다. 탁만수 씨의 칼 쥔 손이 오래 멈췄다.', "I said the way Okseon's hand ran along the edge told me so. The hand holding Mansu's knife stayed still a long time."] }),
        ],
        note: ['다음엔 직접 가시라고 했다가, 가까우니까 못 가는 거라는 소리를 들었다. 그 사람이 뭘 낫게 여길지는 내가 정할 일이 아니라고 했다.',
          "I told him to go himself next time and was told that being close was exactly why he couldn't. What she'd prefer wasn't mine to decide, he said."],
      }),
    },
  },

  // N19-1 — 끝내는 자리(탁만수). 반응 장면(마디를 쓸어 보고 · 얼음 상자를 올리고 · 「탁 영감이 주던가?」 · 「…모르겠어요.」) 뒤
  {
    id: 'n19_1_done', questId: 'N19-1', at: 'complete', npcId: TAK, start: 'start',
    nodes: {
      start: scene([
        line(TAK, '봤냐.', 'Did you see?'),
        line(P, '네?', 'Sorry?'),
        line(TAK, '…얼음 말이다. 오래 가더냐.', '...The ice, I mean. Is it lasting?'),
        line(P, '네. 상자 밑에 물이 안 고여서 오후까지 멀쩡했어요.', 'Yes. No water pooled under the box, so it held till the afternoon.'),
        line(TAK, '…그래.', '...Good.', { act: 'nod' }),
        act(TAK, 'silence'),
        line(TAK, '그 사람은. 뭐라던.', 'And her. What did she say?', { act: 'look_away' }),
      ], {
        choices: [
          opt('ran_nodes', '마디를 한참 쓸어 보시더니 얼음 상자를 그 위에 올리셨습니다.', 'She ran her hand over the nodes a long while, then set the ice box on top of it.', {
            stance: 'giver', aff: { [TAK]: 0.05, [OK]: 0.02 }, next: 'nodes' }),
          opt('she_asked', '탁만수 씨가 준 거냐고 물으셨습니다.', 'She asked whether it came from you.', {
            say: ['탁 영감이 준 거냐고… 그렇게 물으셨습니다.', "She asked if old Tak had given it... that's how she put it."],
            stance: 'mid', next: 'asked' }),
          opt('not_much', '별말씀 없으셨습니다.', "She didn't say much.", {
            stance: 'self', aff: { [TAK]: -0.02 }, next: 'quiet' }),
          opt('watch_carve', '그보다, 받침 깎으시는 걸 옆에서 봐도 되겠습니까?', 'More to the point, may I watch you carve the rests?', {
            stance: 'self', end: endTalk({ complete: 'lesson',
              lineKo: '조용히만 있으면. 톱이 마디에 닿으면 소리가 한 번 막힌다. 거기서 서두르면 대가 갈라져. 숨 한 번 쉬고 넘어가. 대도 사람도 막히는 데서 갈린다.',
              lineEn: 'If you keep quiet. When the saw meets a node, the sound catches once. Hurry there and the bamboo splits. Take one breath and go through. Bamboo and people both split where they catch.' }),
            note: ['받침 깎는 걸 옆에서 보게 해 달라고 했다. 톱이 마디에 닿으면 소리가 한 번 막히고, 거기서 서두르면 대가 갈라진다는 걸 들었다.',
              "I asked to watch him carve. I learned that the saw's sound catches once at a node, and if you hurry there the bamboo splits."] }),
        ],
        note: ['얼음이 오후까지 멀쩡했다고 전하자, 탁만수 씨는 고개를 끄덕이고 한참 있다가 그 사람은 뭐라더냐고 물었다.', 'When I told him the ice held till the afternoon, Mansu nodded, and after a long while asked what she had said.'],
      }),
      nodes: scene([
        line(TAK, '……그랬어?', '......She did?', { act: 'look_up' }),
        line(TAK, '그랬구나.', 'I see.'),
        act(TAK, 'silence'),
        line(P, '한참을 쓸어 보셨어요. 마디 하나하나요.', 'For a long time. Node by node.'),
        line(TAK, '마디를 쓸어 봤으면 결이 맞았다는 얘기다. 손에 걸리는 대는 그 자리에서 내려놓게 돼.', 'If she ran her hand over the nodes, the grain was right. Bamboo that snags the hand gets put down on the spot.'),
        line(TAK, '안 내려놨으면 됐다.', "If she didn't put it down, that's enough."),
      ], {
        choices: [
          opt('nod_true', '(고개를 끄덕인다.)', '(I nod.)', {
            stance: 'giver', end: endTalk({ complete: 'relay_true',
              lineKo: '…다음에 또 시킬지도 모른다. 귀찮게 굴어서 미안하다.',
              lineEn: '...I may ask you again. Sorry to keep bothering you.' }),
            note: ['고개만 끄덕였다. 탁만수 씨의 칼질 소리가 한결 부드러워졌다. 다음에 또 시킬지도 모른다며, 귀찮게 굴어 미안하다고 했다.',
              "I just nodded. Mansu's carving sounded softer. He said he might ask me again, and was sorry to keep bothering me."] }),
          opt('no_fee', '심부름값은 됐습니다. 지나는 길이었으니까요.', 'No need to pay me. I was passing anyway.', {
            stance: 'mid', end: endTalk({ complete: 'no_fee',
              lineKo: '…지나는 길. 그래, 그렇게 해 두자. 빚은 안 지는 성미인데 이건 지고 가지. 공방 앞 지날 일 있으면 들러라. 차 한 잔은 있다.',
              lineEn: "...Passing anyway. Fine, let's call it that. I'm not one for owing, but I'll owe you this one. If you're ever passing the workshop, come in. There's always a cup of tea." }),
            note: ['심부름값은 사양했다. 탁만수 씨는 빚은 안 지는 성미지만 이건 지고 가겠다며, 공방 앞을 지나거든 차 한 잔 하러 들르라고 했다.',
              "I turned down payment. Mansu said he wasn't one for owing, but he'd owe me this — and to drop by the workshop for tea."] }),
          opt('go_yourself', '다음엔 직접 가 보시지요. 표정이 좋으셨습니다.', 'Next time, go yourself. She looked pleased.', {
            stance: 'other', aff: { [TAK]: -0.04 }, end: endTalk({ complete: 'relay_true',
              lineKo: '…그 얘기는 그만.',
              lineEn: '...Enough of that.' }),
            note: ['다음엔 직접 가 보시라고 했다. 탁만수 씨는 그 얘기는 그만하라면서도 평상 밑에서 대나무 한 토막을 끌어당겼다.',
              "I told him to go himself next time. Mansu said enough of that — yet he dragged a length of bamboo out from under the bench."] }),
        ],
        note: ['정옥선 씨가 마디를 한참 쓸어 보고 얼음 상자를 그 위에 올렸다고 전했다. 탁만수 씨는 한동안 말이 없다가, 손에 걸리는 대는 그 자리에서 내려놓게 되는데 안 내려놨으면 됐다고 했다.',
          "I told him Okseon ran her hand over the nodes a long while and set the ice box on it. Mansu was quiet for a time, then said bamboo that snags the hand gets put down at once — if she didn't, that was enough."],
      }),
      asked: scene([
        line(TAK, '…물었다고. 내가 줬냐고.', '...She asked. Whether I gave it.'),
        act(TAK, 'silence'),
        line(N, '(한참 대팻밥만 쓸어 모은다.)', '(For a long while he just sweeps the shavings together.)'),
        line(TAK, '…그래서. 너는 뭐라고 했냐.', '...And? What did you say?'),
      ], {
        choices: [
          opt('dont_know', '모르겠다고만 했습니다.', "I only said I wouldn't know.", {
            stance: 'giver', aff: { [TAK]: 0.04 }, next: 'kept' }),
          opt('regret', '모르겠다고 했지만, 사실대로 말씀드릴 걸 그랬습니다.', "I said I wouldn't know. I wish I'd told her the truth.", {
            stance: 'other', aff: { [TAK]: -0.04 }, end: endTalk({ complete: 'relay_true',
              lineKo: '…사실대로 말했으면 그 사람은 받침을 안 썼을 거다. 모르는 척할 데가 있어야 쓰지. …물었구나. 그 사람이.',
              lineEn: "...If you'd told her the truth, she wouldn't have used the rest. She needs room to pretend not to know. ...She asked. Her." }),
            note: ['사실대로 말할 걸 그랬다고 하자, 탁만수 씨는 그랬으면 그 사람이 받침을 안 썼을 거라고 했다. 모르는 척할 데가 있어야 쓴다고.',
              "When I said I wished I'd told her the truth, Mansu said then she wouldn't have used the rest. She needs room to pretend not to know."] }),
        ],
        note: ['정옥선 씨가 탁 영감이 준 거냐고 물었다고 전했다. 탁만수 씨의 칼이 손에서 미끄러질 뻔했다.', "I told him Okseon had asked whether old Tak gave it. The knife nearly slipped from Mansu's hand."],
      }),
      kept: scene([
        line(TAK, '…잘했다. 모르는 게 맞다.', '...Good. Not knowing is right.', { act: 'nod' }),
        line(TAK, '심부름꾼은 모르는 게 낫다.', "Better the errand runner doesn't know."),
        line(N, '(칼을 다시 쥔다. 그런데 깎지는 않는다.)', "(He grips the knife again, but doesn't cut.)"),
        line(TAK, '…그 사람이 물었다고. 그랬구나.', '...She asked. I see.'),
      ], {
        choices: [
          opt('say_nothing', '(더 말하지 않는다.)', '(I say nothing more.)', {
            stance: 'giver', end: endTalk({ complete: 'relay_true',
              lineKo: '…다음에 또 부를지도 모른다. 그때도 지나는 길에 와라.',
              lineEn: '...I may call on you again. Come by on your way then too.' }) }),
          opt('no_fee', '심부름값은 됐습니다.', 'No need to pay me.', {
            stance: 'mid', end: endTalk({ complete: 'no_fee',
              lineKo: '…그래. 빚은 안 지는 성미인데 이건 지고 가지. 지날 일 있으면 들러라. 차 한 잔은 있다.',
              lineEn: "...Right. I'm not one for owing, but I'll owe you this one. If you're passing, come in. There's always a cup of tea." }),
            note: ['심부름값은 사양했다. 탁만수 씨는 이건 빚으로 지고 가겠다며 지날 일 있으면 차 한 잔 하러 오라고 했다.', "I turned down payment. Mansu said he'd carry this one as a debt, and to come by for tea."] }),
          opt('answer_her', '다음엔 직접 대답해 주시지요. 물으신 분께요.', "Next time, why not answer her yourself? She's the one who asked.", {
            stance: 'other', aff: { [TAK]: -0.05 }, end: endTalk({ complete: 'relay_soft',
              lineKo: '…대답은 무슨. 물은 것도 아니다. 혼잣말이지. 됐다, 가 봐라.',
              lineEn: "...Answer, nothing. That wasn't asking. Just talking to herself. Enough. Go." }),
            note: ['물은 사람에게 직접 대답해 주시라고 했다. 탁만수 씨의 칼질이 거칠어지더니, 물은 게 아니라 혼잣말이었다며 가 보라고 했다.', "I said he should answer her himself. His knife turned rough; that wasn't asking, he said, just talking to herself — and sent me off."] }),
        ],
        note: ['모르겠다고만 했다고 하자, 탁만수 씨는 아주 천천히 고개를 끄덕였다. 그 사람이 물었다는 말만 몇 번 되뇌었다.', 'When I said I had only answered that I wouldn\'t know, Mansu nodded very slowly. He kept repeating that she had asked.'],
      }),
      quiet: scene([
        line(TAK, '…그렇지. 그 사람이 뭘.', '...Of course not. What would she say.', { act: 'look_away' }),
        line(N, '(대를 다시 깎는다. 소리가 조금 거칠다.)', '(He goes back to carving. The sound is a little rougher.)'),
        line(TAK, '괜찮다. 말 안 하는 것도 대답이다.', "It's fine. Saying nothing is an answer too."),
        line(TAK, '받침이 좌판 밑에 들어갔으면 그걸로 됐어.', "If the rest went under the stall, that's enough."),
      ], {
        choices: [
          opt('bow_out', '(고개를 숙인다.)', '(I lower my head.)', {
            stance: 'self', end: endTalk({ complete: 'relay_soft',
              lineKo: '가 봐라. 얼음이 오래 가면 그만이지.',
              lineEn: "Go on. As long as the ice lasts, that's all." }) }),
          opt('correct', '실은… 마디를 한참 쓸어 보셨습니다.', 'Actually... she ran her hand over the nodes for a long time.', {
            stance: 'giver', aff: { [TAK]: 0.03 }, next: 'nodes',
            note: ['별말 없었다고 했다가, 실은 마디를 한참 쓸어 보았다고 고쳐 말했다.', 'I had said she said little, then corrected myself: she ran her hand over the nodes a long time.'] }),
        ],
        note: ['별말 없었다고 하자, 탁만수 씨는 그 사람이 뭘 하겠냐며 다시 대를 깎았다. 말 안 하는 것도 대답이라고 했다.', "When I said she said little, Mansu muttered what would she say and went back to carving. Saying nothing is an answer too, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-2 「부고 아닌 편지」 — 받는 자리(정옥선). 이번엔 거꾸로 — 할머니가 보내고, 이름을 빼 달라 한다
  // ═══════════════════════════════════════════
  {
    id: 'n19_2_offer', questId: 'N19-2', at: 'offer', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(정옥선 씨가 보자기로 싼 반찬통을 좌판 귀퉁이에 놓았다가 도로 끌어당긴다.)', '(Okseon sets a cloth-wrapped food container at the corner of the stall, then pulls it back again.)'),
        line(OK, '탁 씨가 앓아누웠다더라.', "They say Tak's laid up."),
        line(P, '탁 씨요?', 'Tak?'),
        line(OK, '이 항구에 탁 씨가 둘이냐. 대 깎는 그 영감.', 'Is there more than one Tak in this harbour? The old man who carves bamboo.'),
        line(P, '탁만수 씨가요?', 'Mansu is?'),
        line(OK, '기침 소리가 공방 밖까지 들린다고들 하더라.', 'They say you can hear him coughing outside the workshop.'),
        act(OK, 'silence'),
        line(OK, '이거… 반찬이다.', 'This... is food.', { act: 'look_away' }),
        line(P, '탁만수 씨 드리려고 싸신 거예요?', 'You packed it for Mansu?'),
        line(OK, '늙은이가 늙은이 걱정하는 거, 우습나.', 'An old woman fussing over an old man. Funny, is it?'),
        line(P, '…', '...'),
        line(OK, '갖다 줘라. 내가 보냈다고는 하지 말고.', "Take it to him. Don't tell him I sent it."),
      ], {
        choices: [
          opt('not_funny', '우습지 않습니다. 식기 전에 갖다 드리겠습니다.', "It's not funny. I'll get it to him before it goes cold.", {
            stance: 'giver', aff: { [OK]: 0.05 }, end: endTalk({ accept: true, offer: 'not_funny',
              lineKo: '…식으면 데워 먹으면 되지. 그래도 빨리 가. 문 앞에 두고 와. 얼굴 볼 거 없다. 앓는 사람은 앓는 얼굴 보이는 거 싫어해.',
              lineEn: "...If it goes cold he can heat it up. Still, go quickly. Leave it at the door. No need to see his face. Sick people hate being seen sick." }),
            note: ['우습지 않다고, 식기 전에 갖다 드리겠다고 했다. 정옥선 씨는 보자기 매듭을 한 번 더 조이며 문 앞에 두고만 오라고 했다.',
              "I said it wasn't funny and that I'd get it there before it cooled. Okseon tightened the knot once more and told me to just leave it at the door."] }),
          opt('how_bad', '많이 편찮으시답니까?', 'Is he very ill?', {
            say: ['많이 편찮으시답니까?', 'Is he very ill?'], stance: 'mid', next: 'cough' }),
          opt('go_yourself', '직접 가져가시면 탁만수 씨가 더 반기실 텐데요.', "Mansu would be gladder if you took it yourself.", {
            stance: 'other', aff: { [OK]: -0.04 }, next: 'not_me' }),
          opt('like_rest', '받침 때처럼, 물으시면 말 못 한다고만 하겠습니다.', "Like with the rest, if he asks, I'll just say I can't tell him.", {
            stance: 'mid', aff: { [OK]: 0.02 }, requires: { flag: 'choice.n19_1_said_secret' }, next: 'all_knew' }),
        ],
        note: ['탁만수 씨가 앓아누웠다는 소문이 좌판에 돌았다. 정옥선 씨는 반찬통을 싸 놓고 망설이다가, 늙은이가 늙은이 걱정하는 게 우습냐며 공방에 갖다 주라고 했다. 자기가 보냈다고는 하지 말라고.',
          "Word went round the stalls that Mansu was laid up. Okseon had packed a food container and hesitated, then asked if an old woman worrying over an old man was funny, and asked me to take it to the workshop — without saying she sent it."],
      }),
      cough: scene([
        line(OK, '모른다. 좌판에 도는 말이 그렇다는 거지.', "I don't know. That's just what's going round the stalls."),
        line(OK, '사흘째 공방 문이 닫혀 있다더라.', "The workshop door's been shut three days, they say."),
        line(P, '사흘이나요.', 'Three days.'),
        line(N, '(정옥선 씨가 보자기를 쓸어 편다.)', '(Okseon smooths out the cloth.)'),
        line(OK, '앓는 사람 입은 짧아. 그래서 이것저것 넣었다.', 'A sick man has no appetite. So I put in a bit of everything.'),
        line(OK, '하나라도 넘어가면 됐지. 많이 싼 거 아니다.', "If even one thing goes down, that's enough. It isn't a lot."),
      ], {
        choices: [
          opt('listen_cough', '가는 김에 기침이 어떠신지도 듣고 오겠습니다.', "While I'm there, I'll listen to how his cough sounds.", {
            stance: 'giver', aff: { [OK]: 0.04 }, end: endTalk({ accept: true, offer: 'ask_who',
              lineKo: '…듣기만 해. 들어가지는 말고. 기침 소리가 맑으면 낫는 거고, 탁하면… 그때 다시 얘기하자.',
              lineEn: "...Just listen. Don't go in. If the cough sounds clear he's mending, and if it's thick... we'll talk then." }),
            note: ['기침 소리도 듣고 오겠다고 했다. 정옥선 씨는 손을 멈추고, 들어가지는 말고 듣기만 하라고 했다. 맑으면 낫는 거라고.', "I said I'd listen to his cough too. Okseon stopped her hands and told me to just listen, not go in. Clear means mending, she said."] }),
          opt('heavy', '이것저것치고는 꽤 무겁습니다.', 'Heavy, for a bit of everything.', {
            stance: 'self', aff: { [OK]: -0.02 }, end: endTalk({ accept: true, offer: 'ask_food',
              lineKo: '늙은이 손이 커서 그렇다. 무거우면 두 손으로 들어. 엎지르지 말고.',
              lineEn: "An old woman's hands are generous, that's all. If it's heavy, use both hands. Don't spill it." }),
            note: ['이것저것치고는 무겁다고 했다가 눈총을 받았다. 늙은이 손이 커서 그렇다며 두 손으로 들라고 했다.', "I said it was heavy for a bit of everything and got a look for it. An old woman's hands are generous, she said — carry it with both."] }),
          opt('stay_out', '두 분 일에 제가 끼어들어도 될지 모르겠습니다.', "I'm not sure it's my place to come between you two.", {
            stance: 'self', aff: { [OK]: -0.03 }, end: endTalk({ decline: true,
              lineKo: '…끼어들긴. 반찬통 하나 나르는 거다. 됐다. 다른 사람 시키지.',
              lineEn: "...Come between us, nothing. It's carrying one food container. Fine. I'll ask someone else." }),
            note: ['두 분 일에 끼어들어도 될지 모르겠다고 했다. 정옥선 씨는 반찬통 하나 나르는 거라며 보자기를 좌판 밑으로 밀어 넣었다.', "I said I wasn't sure I should come between them. Okseon said it was only carrying a container and pushed the bundle under the stall."] }),
        ],
        note: ['얼마나 편찮으냐고 묻자, 정옥선 씨는 사흘째 공방 문이 닫혀 있다는 말만 들었다고 했다. 앓는 사람은 입이 짧아 이것저것 넣었다고.', "When I asked how ill he was, Okseon said she'd only heard the workshop door had been shut three days. A sick man eats little, so she'd put in a bit of everything."],
      }),
      not_me: scene([
        line(OK, '누가 반기래. 쓸데없는 소리 말고.', 'Who said anything about glad. Enough nonsense.'),
        line(N, '(반찬통을 내 쪽으로 떠민다.)', '(She shoves the container at me.)'),
        line(P, '그래도요.', 'Still.'),
        act(OK, 'silence'),
        line(OK, '…내가 가면 그 사람이 일어나야 해. 앓는 사람 일으키는 거 아니다.', "...If I go, he'll have to get up. You don't make a sick man get up."),
        line(OK, '그러니 네가 가. 내가 보냈다고는 하지 말고. 알았지?', "So you go. And don't tell him I sent it. Understood?"),
      ], {
        choices: [
          opt('promise', '알겠습니다. 정옥선 씨 이름은 빼겠습니다.', 'Understood. Your name stays out of it.', {
            stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({ accept: true, offer: 'go_yourself',
              lineKo: '문 앞에 두고 바로 와. 오래 서 있으면 그 사람이 안다.',
              lineEn: "Leave it at the door and come straight back. Stand there too long and he'll know." }) }),
          opt('if_he_asks', '탁만수 씨가 물으시면, 거짓말은 못 하겠습니다.', "If Mansu asks me, I can't lie to him.", {
            stance: 'other', aff: { [OK]: -0.04 }, end: endTalk({ accept: true, offer: 'go_yourself',
              lineKo: '…그럼 묻기 전에 나와. 그 사람 말이 느려. 물을 새 없이 나오면 된다.',
              lineEn: "...Then get out before he asks. He's slow to speak. Leave before he can ask, and that's that." }),
            note: ['물으시면 거짓말은 못 하겠다고 했다. 정옥선 씨는 한참 나를 보더니, 그 사람 말이 느리니 물을 새 없이 나오면 된다고 했다.', "I said I couldn't lie if he asked. Okseon looked at me a long while and said he's slow to speak — just leave before he can ask."] }),
        ],
        note: ['직접 가시면 더 반기실 거라고 했다가 쓸데없는 소리 말라는 핀잔을 들었다. 자기가 가면 앓는 사람이 일어나야 하니 내가 가라고 했다.', "I said he'd be gladder if she went herself and was told to stop talking nonsense. If she went, the sick man would have to get up — so I should go."],
      }),
      all_knew: scene([
        line(OK, '말 못 한다는 게 다 말하는 거다.', "Saying you can't tell is telling."),
        line(OK, '받침 때 나는 대번에 알았어.', 'With the rest, I knew straight away.'),
        line(P, '…알고 계셨어요?', '...You knew?'),
        line(OK, '이번엔 아예 아무 말도 하지 마. 문 앞에 두고 와. 묻기 전에.', 'This time, say nothing at all. Leave it at the door. Before he can ask.'),
      ], {
        choices: [
          opt('not_a_word', '아무 말도 안 하겠습니다.', "I won't say a word.", {
            stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({ accept: true, offer: 'not_funny',
              lineKo: '그래. …그 사람도 알 거다. 아는 거하고 말하는 거는 다르지.',
              lineEn: "Good. ...He'll know too. Knowing and saying are different things." }),
            note: ['아무 말도 안 하겠다고 했다. 정옥선 씨는 반찬통을 두 손에 들려 주며, 그 사람도 알 거라고 했다. 아는 거하고 말하는 거는 다르다고.', "I promised not to say a word. Okseon put the container in both my hands and said he'd know too. Knowing and saying are different things."] }),
          opt('taste_tells', '탁만수 씨도 아실 겁니다. 반찬 맛을 보시면요.', "Mansu will know too, once he tastes it.", {
            stance: 'other', aff: { [OK]: -0.02 }, end: endTalk({ accept: true, offer: 'ask_food',
              lineKo: '…맛은 무슨. 아무 맛도 안 나게 쌌다. 가.',
              lineEn: '...Taste, nothing. I packed it so it tastes of nothing. Go.' }) }),
        ],
        note: ['받침 때처럼 말 못 한다고만 하겠다고 하자, 정옥선 씨는 그게 다 말하는 거라며 받침 때 대번에 알았다고 했다. 이번엔 아무 말도 하지 말라고.', "When I offered to say I couldn't tell him, as with the rest, Okseon said that was telling — she'd known at once with the rest. This time, say nothing at all."],
      }),
    },
  },

  // N19-2 — 진행 중: 반찬통을 전하고 와서 알린다(「반찬통 전달」 셋째 단계 · 의뢰인 앞).
  //  지어낸 「고맙다」(choice.n19_white_thanks)는 셋째 · 넷째 편이 기억한다. 보낸 사람을 댔으면(choice.n19_told_tak) 셋째 편이 기억한다
  {
    id: 'n19_2_report', questId: 'N19-2', at: 'action', objectiveIndex: 1, step: 2, npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(좌판 얼음을 고르던 정옥선 씨의 손이 멈춘다. 내 빈손을 본다.)', '(Okseon\'s hands stop sorting the ice. She looks at my empty hands.)'),
        line(OK, '갔다 왔냐.', 'You went?'),
        line(P, '네. 방금 공방에 다녀왔어요.', 'Yes. I just got back from the workshop.'),
        line(OK, '…먹더냐.', '...Did he eat?'),
        line(OK, '아니, 받기는 하더냐. 문 앞에 두고만 왔어?', 'No — did he even take it? Did you just leave it at the door?'),
      ], {
        choices: [
          opt('chopsticks', '문간으로 손이 나와 받으셨습니다. 조금 있다 젓가락 소리가 났습니다.', 'A hand came out at the doorway and took it. A little later I heard chopsticks.', {
            stance: 'mid', aff: { [OK]: 0.05 }, next: 'eating' }),
          opt('said_thanks', '고맙다고 전해 달라셨습니다.', 'He asked me to tell you thank you.', {
            stance: 'giver', aff: { [OK]: 0.06 }, flags: ['choice.n19_white_thanks'], next: 'thanks',
            note: ['탁만수 씨가 고맙다고 전해 달랬다고 말했다. 그런 말은 듣지 못했다. 내가 지어낸 말이었다.', "I told her Mansu had asked me to pass on his thanks. He'd said no such thing. I made it up."] }),
          opt('told_him', '누가 보냈냐 물으셔서, 정옥선 씨라고 말씀드렸습니다.', 'He asked who sent it, so I told him it was you.', {
            stance: 'other', aff: { [OK]: -0.07, [TAK]: 0.04 }, flags: ['choice.n19_told_tak'], next: 'told',
            note: ['탁만수 씨가 누가 보냈냐고 물어서 정옥선 씨라고 말해 버렸다고 털어놓았다.', 'I confessed that when Mansu asked who sent it, I told him it was Okseon.'] }),
          opt('nothing_said', '아무 말씀 없으셨습니다. 기침 소리만 났습니다.', "He didn't say a word. There was only coughing.", {
            stance: 'self', aff: { [OK]: -0.02 }, next: 'silent' }),
        ],
        note: ['반찬통을 전하고 돌아오자 정옥선 씨는 얼음을 고르던 손을 멈추고, 먹더냐고 묻다가 받기는 하더냐고 고쳐 물었다.', 'When I came back from delivering the food, Okseon stopped sorting the ice and asked if he ate — then corrected herself: did he even take it?'],
      }),
      eating: scene([
        line(OK, '…젓가락 소리. 그래. 그럼 넘어간 거다.', '...Chopsticks. Right. Then it went down.'),
        line(OK, '앓는 사람이 젓가락을 들었으면 반은 나은 거야.', "When a sick man picks up his chopsticks, he's half mended."),
        line(N, '(좌판 너머 공방 쪽을 한 번 본다. 금방 고개를 돌린다.)', '(She glances once past the stall towards the workshop, then quickly looks away.)'),
        line(OK, '됐다. 그거면 됐어.', "That's enough. That's all I needed."),
      ], {
        choices: [
          opt('cough_clear', '기침 소리도 맑았습니다.', 'His cough sounded clear, too.', {
            stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({
              lineKo: '…맑았으면 됐다. 탁하면 어쩌나 했다. 이 얘기는 여기까지. 좌판에 퍼뜨리지 마라.',
              lineEn: "...If it was clear, good. I was afraid it'd be thick. That's the end of it. Don't spread it round the stalls." }),
            note: ['기침 소리도 맑았다고 했다. 정옥선 씨는 숨을 길게 내쉬고, 탁하면 어쩌나 했다고 했다.', 'I said his cough sounded clear. Okseon let out a long breath — she\'d been afraid it would be thick.'] }),
          opt('go_see', '다음엔 직접 가 보시지요. 문 앞까지만이라도요.', 'Next time, go yourself. Even just as far as the door.', {
            stance: 'other', aff: { [OK]: -0.03 }, end: endTalk({
              lineKo: '…문 앞까지 가면 문을 두드리고 싶어진다. 그러니 안 가는 거다. 됐다.',
              lineEn: "...Go as far as the door and you want to knock. That's why I don't go. Enough." }),
            note: ['문 앞까지만이라도 직접 가 보시라고 했다. 문 앞까지 가면 두드리고 싶어지니 안 가는 거라는 대답이 돌아왔다.', "I suggested she go as far as the door herself. Go that far and you want to knock, she said — that's why she doesn't."] }),
        ],
        note: ['문간으로 손이 나와 받았고 곧 젓가락 소리가 났다고 하자, 정옥선 씨는 젓가락을 들었으면 반은 나은 거라고 했다.', 'When I said a hand took it at the door and then I heard chopsticks, Okseon said a sick man who picks up chopsticks is half mended.'],
      }),
      thanks: scene([
        line(OK, '…그 사람이? 고맙다고?', '...He did? Said thank you?', { act: 'look_up' }),
        act(OK, 'silence'),
        line(OK, '그 입에서 그 말이 나왔으면 많이 앓는 거다.', 'If those words came out of that mouth, he must be very ill.'),
        line(OK, '멀쩡할 땐 죽어도 안 하는 말이야.', "He'd never say that when he's well, not if it killed him."),
        line(P, '(지어낸 말인데… 이렇게 받아들이실 줄은.)', "(I made it up... I didn't think she'd take it like this.)"),
      ], {
        choices: [
          opt('keep_quiet', '(고개를 끄덕인다.)', '(I nod.)', {
            stance: 'giver', end: endTalk({
              lineKo: '…고맙다고 했다. 그 사람이. …고맙다고. 됐다, 가 봐라. 이 얘기는 좌판에 퍼뜨리지 말고.',
              lineEn: "...He said thank you. Him. ...Thank you. That's enough, go on. And don't spread this round the stalls." }),
            note: ['고개만 끄덕였다. 정옥선 씨는 얼음 상자 뚜껑을 닫으며 고맙다고 했다는 말을 혼잣말처럼 되뇌었다. 손이 조금 떨렸다.', "I just nodded. Okseon shut the ice box lid, repeating to herself that he'd said thank you. Her hand shook a little."] }),
          opt('take_back', '…사실은 제가 지어낸 말입니다. 아무 말씀 없으셨습니다.', "...The truth is, I made that up. He didn't say anything.", {
            stance: 'mid', aff: { [OK]: -0.04 }, flags: ['choice.n19_thanks_confessed'], end: endTalk({
              lineKo: '…그렇지. 그 사람이 그런 말을 할 리가 없지. 그래도 고맙다. 지어내 준 거. 다신 하지 마라.',
              lineEn: "...Of course. He'd never say a thing like that. Still, thank you. For making it up. Don't ever do it again." }),
            note: ['지어낸 말이라고 바로 털어놓았다. 정옥선 씨는 짧게 웃더니, 지어내 준 건 고맙다며 다신 하지 말라고 했다.', "I owned up straight away that I'd made it up. Okseon gave a short laugh, thanked me for making it up, and told me never to do it again."] }),
        ],
        note: ['고맙다고 전해 달랬다는 말에 정옥선 씨의 얼음 집게가 허공에서 멈췄다. 그 입에서 그 말이 나왔으면 많이 앓는 거라고 했다.', "At the thank-you, Okseon's ice tongs stopped in midair. If those words came out of that mouth, she said, he must be very ill."],
      }),
      told: scene([
        line(OK, '뭐?', 'What?', { act: 'look_up' }),
        line(OK, '내가 보냈다고 하지 말랬지!', 'I told you not to say I sent it!'),
        act(OK, 'silence'),
        line(OK, '…그래서. 그 사람이 뭐라던.', '...So. What did he say?'),
        line(OK, '아니, 듣기 싫다. 말하지 마.', "No, I don't want to hear. Don't tell me.", { act: 'look_away' }),
      ], {
        choices: [
          opt('sorry_told', '죄송합니다. 물으시는데 거짓말이 안 나왔습니다.', "I'm sorry. He asked, and I couldn't make myself lie.", {
            stance: 'giver', aff: { [OK]: 0.02 }, end: endTalk({
              lineKo: '…그 사람 앞에선 거짓말이 안 나오지. 그건 안다. 됐다. 엎질러진 반찬이다. 다음부턴 묻기 전에 나와.',
              lineEn: "...Lies won't come out in front of him. I know that much. Fine. That's spilt food. From now on, get out before he asks." }) }),
          opt('he_ate', '이름을 듣고 한참 서 계시더니, 곧 젓가락 소리가 났습니다.', 'When he heard your name he stood a long while. Then I heard chopsticks.', {
            stance: 'other', aff: { [OK]: 0.03 }, end: endTalk({
              lineKo: '…알고 먹었으면 됐다. 모르고 먹는 것보다 낫지. 나는 그렇게 생각한다.',
              lineEn: "...If he ate it knowing, that's fine. Better than eating it not knowing. That's what I think." }),
            note: ['이름을 듣고 한참 서 있더니 곧 젓가락 소리가 났다고 했다. 정옥선 씨는 알고 먹었으면 됐다고 하고는 얼굴을 돌렸다.', 'I said he stood a long while at her name, then I heard chopsticks. Okseon said if he ate it knowing, that was fine — and turned her face away.'] }),
        ],
        note: ['보낸 사람을 댔다고 하자 정옥선 씨는 얼음 집게를 탁 내려놓았다. 그 사람이 뭐라더냐고 묻다가, 듣기 싫으니 말하지 말라고 했다.', "When I said I'd told him who sent it, Okseon slapped down her ice tongs. She asked what he'd said, then told me she didn't want to hear."],
      }),
      silent: scene([
        line(OK, '…그렇지. 그 사람이 뭘.', '...Of course not. What would he say.'),
        line(N, '(얼음 집게로 얼음을 괜히 툭툭 친다.)', '(She taps at the ice with the tongs for no reason.)'),
        line(OK, '괜찮다. 말 안 하는 것도 대답이다. 받았으면 됐어.', "It's fine. Saying nothing is an answer too. If he took it, that's enough."),
        act(OK, 'silence'),
        line(OK, '기침은… 기침은 계속 하더냐.', 'The cough... was he still coughing?'),
      ], {
        choices: [
          opt('then_chopsticks', '그러고 나서 젓가락 소리가 났습니다.', 'After that, I heard chopsticks.', {
            stance: 'mid', aff: { [OK]: 0.04 }, next: 'eating' }),
          opt('kept_coughing', '네. 문 닫히고도 한참 들렸습니다.', 'Yes. I could hear it a long while after the door shut.', {
            stance: 'self', aff: { [OK]: -0.02 }, end: endTalk({
              lineKo: '…그래. 알았다. 가 봐라. 오늘은 얼음 안 날라도 된다.',
              lineEn: "...Right. I see. Go on. You needn't carry ice today." }),
            note: ['문이 닫히고도 기침 소리가 한참 들렸다고 했다. 정옥선 씨는 한참 공방 쪽을 보다가 오늘은 얼음 안 날라도 된다고 했다.', "I said I'd heard coughing long after the door shut. Okseon looked towards the workshop for a long time, then told me I needn't carry ice today."] }),
        ],
        note: ['아무 말 없었다고 하자, 정옥선 씨는 그 사람이 뭘 하겠냐며 말 안 하는 것도 대답이라고 했다. 그러고는 기침은 계속 하더냐고 물었다.', 'When I said he said nothing, Okseon said of course not — saying nothing is an answer too. Then she asked whether he was still coughing.'],
      }),
    },
  },

  // N19-2 — 끝내는 자리(정옥선). 보고(앞 단계) 뒤 — 통을 열어 봤는지 · 품삯
  {
    id: 'n19_2_done', questId: 'N19-2', at: 'complete', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(OK, '…먼 길이었지.', '...It was a long way.'),
        line(P, '버스에서 내내 무릎에 안고 있었어요. 식을까 봐요.', 'I held it on my lap the whole bus ride. In case it cooled.'),
        line(OK, '…그랬냐.', '...Did you.', { act: 'look_away' }),
        act(OK, 'silence'),
        line(OK, '그 통, 뚜껑은 내가 닫은 그대로 갔겠지.', 'That container. The lid went just as I shut it, I suppose.', { act: 'peer' }),
        line(P, '(뚜껑을 열어 봤느냐고 물으시는 거구나.)', "(She's asking whether I opened it.)"),
      ], {
        choices: [
          opt('refuse_read', '열어 보지 않았습니다. 두 분 일이니까요.', "I didn't open it. It's between the two of you.", {
            end: endTalk({ complete: 'refuse_read',
              lineKo: '…똑똑한 애구나. 두 사람 일이라. 그래, 맞는 말이다. 그 말 할 줄 아는 애한테는 다음 심부름도 맡길 수 있어.',
              lineEn: "...You're a sharp one. Between the two of us. Yes, that's right. Someone who knows to say that, I can trust with the next errand too." }),
            note: ['뚜껑은 열어 보지 않았다고, 두 분 일이니까라고 했다. 정옥선 씨는 그 말 할 줄 아는 애한테는 다음 심부름도 맡길 수 있다고 했다.',
              "I said I hadn't opened it — it was between the two of them. Okseon said someone who knows to say that can be trusted with the next errand."] }),
          opt('read_first', '…사실 뚜껑을 열어 봤습니다. 뭘 싸셨나 궁금해서요.', "...Actually, I opened the lid. I was curious what you'd packed.", {
            next: 'opened' }),
          opt('deliver', '그대로 전했습니다. 기침 소리가 났고요.', 'I handed it over as it was. And I heard him coughing.', {
            say: ['반찬통, 그대로 전했습니다. 안에서 기침 소리가 났고요.', 'I handed the container over just as it was. I heard him coughing inside.'],
            end: endTalk({ complete: 'deliver',
              lineKo: '…고맙다. 묻지 마라. 기침을 한다니 아직 숨은 쉬는 거다. 늙은이 기침은 소리가 나야 낫는 거야. …그 얘긴 그만하자.',
              lineEn: "...Thank you. Don't ask. If he's coughing, he's still breathing. An old man's cough has to make noise to mend. ...Let's leave it there." }),
            note: ['반찬통을 그대로 전했다고 했다. 정옥선 씨는 고맙다며, 기침을 한다니 아직 숨은 쉬는 거라고 했다. 그 얘긴 그만하자고.',
              "I said I'd handed the container over as it was. Okseon thanked me — if he's coughing, he's still breathing, she said. Then she let it drop."] }),
          opt('bus_fare', '부산에서 오는 버스비만 받겠습니다.', "I'll just take the bus fare from Busan.", {
            next: 'fare' }),
        ],
        note: ['정옥선 씨는 먼 길이었다며 반찬통 뚜껑이 닫은 그대로 갔겠느냐고 넌지시 물었다.', 'Okseon said it had been a long way, and asked, sidelong, whether the lid had gone just as she shut it.'],
      }),
      opened: scene([
        line(OK, '너.', 'You.', { act: 'look_up' }),
        act(OK, 'silence'),
        act(OK, 'laugh'),
        line(OK, '남의 반찬통 여는 거 아니다. 남의 편지 여는 거랑 같아.', "You don't open someone else's food container. It's like opening someone else's letter."),
        line(P, '…죄송합니다.', "...I'm sorry."),
      ], {
        end: endTalk({ complete: 'read_first',
          lineKo: '다음엔 궁금해도 참아. 참는 것도 심부름이다.',
          lineEn: "Next time, curious or not, hold back. Holding back is part of the errand." }),
        note: ['뚜껑을 열어 봤다고 털어놓았다. 정옥선 씨는 한참 노려보다 웃더니, 남의 반찬통 여는 건 남의 편지 여는 거랑 같다고 했다.',
          "I confessed I'd opened the lid. Okseon glared at me a long while, then laughed — opening someone's food container is like opening their letter, she said."],
      }),
      fare: scene([
        line(OK, '버스비?', 'Bus fare?'),
        act(OK, 'silence'),
        line(OK, '…그래, 받아. 반찬 나르는 것도 일이다.', "...All right, take it. Carrying food is work too."),
        act(OK, 'give', { to: P }),
      ], {
        end: endTalk({ complete: 'bus_fare',
          lineKo: '다음에 또 시키면 그때도 받아. 공짜 심부름은 오래 못 간다. 받는 사람도 시키는 사람도 불편해져.',
          lineEn: "If I ask again, take it then too. Free errands don't last. They make both sides uncomfortable." }),
        note: ['부산에서 오는 버스비만 받겠다고 했다. 정옥선 씨는 동전까지 맞춰 넣은 봉투를 건네며, 공짜 심부름은 오래 못 간다고 했다.',
          "I asked only for the bus fare from Busan. Okseon handed me an envelope counted down to the coins — free errands don't last, she said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-3 「대를 다시 깎는 손」 — 받는 자리(탁만수). 앞 두 편의 표시를 읽는다
  //  290차 — 갈래 `gaps`에 「몇 개까지 깎으십니까」(옛 받는 답 how_many)를 더했다(그 표시를 잇는다)
  // ═══════════════════════════════════════════
  {
    id: 'n19_3_offer', questId: 'N19-3', at: 'offer', npcId: TAK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(평상 위에 천으로 싼 것이 또 놓여 있다. 이번 것은 틈이 조금 더 넓다.)', '(Something wrapped in cloth lies on the bench again. The gaps in this one are a little wider.)'),
        line(TAK, '두 번째다. 받침.', 'The second one. A rest.'),
        line(P, '또 깎으셨어요?', 'You carved another?'),
        line(TAK, '지나는 길에… 알지.', 'On your way past... you know.'),
        line(P, '지나는 길이요? 공방에서 직판장은 지나는 길이 아닌데요.', "On my way? The market isn't exactly on my way from here."),
        line(TAK, '…일부러라고 하면 안 간다는 거냐.', "...So if it's on purpose, you won't go?"),
        act(TAK, 'silence'),
        line(TAK, '그래, 일부러다. 그 사람 앞에서만 지나는 길인 척해 다오. 내가 줬다고 하지 말고.', "Fine, it's on purpose. Just act like you're passing, in front of her. And don't say it was me."),
        line(P, '반찬통은 받으셨어요?', 'Did you get the food container?'),
        line(TAK, '비워서 보냈다. 그거면 됐지.', "I sent it back empty. That's enough."),
        line(TAK, '맛있었다는 말은 하지 마라. 그것도 내가 한 말이 되니까.', "Don't tell her it tasted good. That'd be me saying it too."),
      ], {
        choices: [
          opt('beside_first', '첫 번째 옆에 놓고 오겠습니다. 아무 말 없이요.', "I'll set it beside the first one. Without a word.", {
            stance: 'giver', aff: { [TAK]: 0.04 }, end: endTalk({ accept: true, offer: 'beside_first',
              lineKo: '옆이든 어디든. 그 사람이 정하겠지. 물 빠지는 쪽이 바다 쪽으로 가게만 놔 다오.',
              lineEn: "Beside it or wherever. She'll decide. Just set it so the water runs off towards the sea." }),
            note: ['첫 번째 옆에 아무 말 없이 놓고 오겠다고 했다. 탁만수 씨는 매듭을 지난번보다 단단히 묶어 건네며, 물 빠지는 쪽이 바다로 가게 놔 달라고 했다.',
              "I said I'd set it beside the first one without a word. Mansu tied the knot tighter than last time and asked me to set it so the water drains towards the sea."] }),
          opt('wider_gaps', '틈이 지난번보다 넓습니다. 일부러 그러셨습니까?', 'The gaps are wider than last time. Was that on purpose?', {
            stance: 'mid', aff: { [TAK]: 0.03 }, next: 'gaps' }),
          opt('confess_thanks', '…고맙다고 하셨다고, 제가 벌써 전해 버렸습니다.', "...I've already told her you said thank you.", {
            stance: 'mid', aff: { [TAK]: -0.05 }, requires: { flag: 'choice.n19_white_thanks', notFlag: 'choice.n19_thanks_confessed' }, next: 'thanks_out',
            note: ['정옥선 씨에게 고맙다는 말을 지어내 전했다고 탁만수 씨에게 털어놓았다.', "I confessed to Mansu that I'd passed on a thank-you he never said."] }),
          opt('say_something', '이번엔 한마디라도 같이 보내시지요. 정옥선 씨도 기다리실 겁니다.', "This time, send a word with it. Okseon will be waiting for one.", {
            stance: 'other', aff: { [TAK]: -0.04 }, next: 'no_word' }),
        ],
        note: ['반찬통이 돌아간 뒤로 탁만수 씨가 두 번째 받침을 깎았다. 지나는 길이 아니라고 하자 일부러가 맞다고, 그 사람 앞에서만 지나는 길인 척해 달라고 했다. 반찬통은 비워서 보냈다고.',
          "After the food container went back, Mansu carved a second rest. When I said the market wasn't on my way, he admitted it was on purpose — just act like I'm passing, in front of her. He'd sent the container back empty."],
      }),
      gaps: scene([
        line(TAK, '봤구나.', 'You noticed.', { act: 'look_up' }),
        line(N, '(받침을 손바닥에 올려 무게를 가늠해 보인다.)', '(He weighs the rest on his palm.)'),
        line(TAK, '첫 번째는 물이 한쪽에 고이더라. 좌판이 바다 쪽으로 기울었거든.', 'With the first one, water pooled on one side. The stall leans towards the sea.'),
        line(P, '그래서 틈을 넓히셨군요.', 'So you widened the gaps.'),
        line(TAK, '써 본 사람은 안다. 어디가 모자랐는지. 모자란 데를 고치는 게 두 번째다.', "Anyone who's used it knows where it fell short. Fixing what fell short is what a second one is for."),
      ], {
        choices: [
          opt('how_known', '좌판이 기운 건 어떻게 아셨습니까?', 'How did you know the stall leans?', {
            stance: 'other', aff: { [TAK]: -0.02 }, end: endTalk({ accept: true, offer: 'ask_diff',
              lineKo: '…지나다 보면 보인다. 다 보여. 그건 묻지 말고 가.',
              lineEn: "...You see things, passing by. You see everything. Don't ask about that. Just go." }),
            note: ['좌판이 기운 걸 어떻게 아셨느냐고 물었다. 탁만수 씨는 칼을 집었다 내려놓으며, 지나다 보면 다 보인다고만 했다.', 'I asked how he knew the stall leaned. Mansu picked up his knife and set it down again — you see everything, passing by, was all he said.'] }),
          opt('drain_seaward', '물이 바다 쪽으로 빠지게 놓겠습니다.', "I'll set it so the water drains towards the sea.", {
            stance: 'giver', aff: { [TAK]: 0.03, [OK]: 0.02 }, end: endTalk({ accept: true, offer: 'ask_diff',
              lineKo: '그래. 그러면 얼음이 하루를 간다. 이름은 빼고.',
              lineEn: 'Good. Then the ice lasts the day. Leave my name out.' }) }),
          opt('empty_box', '반찬통, 정옥선 씨 것인 줄 아시고 비우신 거지요?', "You emptied that container knowing it was Okseon's, didn't you?", {
            stance: 'mid', aff: { [TAK]: 0.02 }, requires: { flag: 'choice.n19_told_tak' }, next: 'knew_sender' }),
          opt('how_many', '세 번째도 깎으실 거예요? 몇 개까지요?', 'Will there be a third? How many will you carve?', {
            say: ['그럼 세 번째도 있겠네요. 몇 개까지 깎으실 생각이세요?', "Then there'll be a third, too. How many are you planning to carve?"],
            next: 'count' }),
        ],
        note: ['틈을 일부러 넓혔느냐고 묻자, 탁만수 씨는 첫 번째는 좌판이 바다 쪽으로 기울어 물이 한쪽에 고였다고 했다. 모자란 데를 고치는 게 두 번째라고.',
          'When I asked if he widened the gaps on purpose, Mansu said the stall leans seaward, so water pooled on one side of the first. Fixing what fell short is what a second one is for.'],
      }),
      count: scene([
        line(TAK, '…모른다.', "...I don't know."),
        line(TAK, '하나 놓이면 또 하나. 대는 깎다 보면 다음 마디가 보여.', 'Once one is placed, another. When you carve bamboo, you see the next node.'),
        line(P, '세어 보신 적은 없으세요?', 'Have you never counted?'),
        line(N, '(받침 모서리를 손톱으로 고른다.)', '(He evens out the edge of the rest with a fingernail.)'),
        line(TAK, '세는 건 그만두는 사람이나 하는 거다. 나는 아직 손이 논다. 손이 놀면 깎는 거고.', "Counting is for people who are stopping. My hands are still idle. Idle hands carve."),
      ], {
        end: endTalk({ accept: true, offer: 'how_many' }),
        note: ['몇 개까지 깎으실 거냐고 묻자, 탁만수 씨는 모른다고 했다. 세는 건 그만두는 사람이나 하는 거고, 손이 놀면 깎는 거라고.',
          "When I asked how many he'd carve, Mansu said he didn't know. Counting is for people who are stopping; idle hands carve."],
      }),
      knew_sender: scene([
        line(TAK, '…네가 말했으니 알았지.', '...I knew because you told me.'),
        line(TAK, '모르고 받았으면 못 먹었다. 누가 보낸 줄 모르는 음식은 안 먹는다. 그게 내 버릇이다.', "If I'd had it not knowing, I couldn't have eaten it. I don't eat food when I don't know who sent it. That's how I am."),
        line(P, '그래서 다 비우신 거고요.', 'So you ate every bit.'),
        line(TAK, '씻어서 보냈다. 그 사람은 빈 통 돌려받는 걸 제일 좋아해.', 'I washed it and sent it back. Nothing pleases her more than getting an empty container back.'),
      ], {
        choices: [
          opt('glad_told', '그럼 말씀드리길 잘했네요.', "Then I'm glad I told you.", {
            stance: 'other', aff: { [TAK]: 0.03 }, end: endTalk({ accept: true, offer: 'ask_diff',
              lineKo: '…이번 건 그 사람한테 누가 줬다고 하지 마라. 그건 다르다.',
              lineEn: "...This one, don't tell her who it's from. That's different." }),
            note: ['말씀드리길 잘했다고 했다. 탁만수 씨는 대답 대신 받침을 내밀며, 이번 건 누가 줬다고 하지 말라고 했다. 그건 다르다고.', "I said I was glad I'd told him. Instead of answering, Mansu held out the rest — this one, don't say who it's from. That's different."] }),
        ],
        note: ['탁만수 씨는 누가 보낸 줄 알아서 반찬을 먹을 수 있었다고 했다. 모르는 음식은 안 먹는 버릇이라고. 빈 통은 씻어서 보냈다고 했다.', "Mansu said he could eat the food because he knew who sent it — he never eats food from an unknown hand. He washed the empty container and sent it back."],
      }),
      thanks_out: scene([
        act(TAK, 'silence'),
        line(TAK, '…내가. 고맙다고 했다고.', '...I. Said thank you.'),
        line(P, '…네. 제가 그렇게 전해 버렸어요.', "...Yes. That's what I told her."),
        line(N, '(대팻밥을 한 줌 쥐었다가 놓는다.)', '(He grabs a handful of shavings, then lets them go.)'),
        line(TAK, '그 사람이 그걸 믿더냐.', 'And she believed that?'),
      ], {
        choices: [
          opt('she_believed', '믿으셨습니다. 많이 편찮으신 줄 아시고요.', 'She did. She took it to mean you were very ill.', {
            stance: 'other', aff: { [TAK]: -0.02 }, next: 'not_wrong' }),
          opt('sorry_lie', '죄송합니다. 제가 지어낸 말입니다.', "I'm sorry. I made it up.", {
            stance: 'giver', aff: { [TAK]: 0.02 }, next: 'not_wrong' }),
        ],
        note: ['지어낸 고맙다는 말을 털어놓자 탁만수 씨의 칼이 오래 멈췄다. 그 사람이 그걸 믿더냐고만 물었다.', "When I confessed the made-up thank-you, Mansu's knife stopped for a long time. He only asked whether she believed it."],
      }),
      not_wrong: scene([
        act(TAK, 'silence'),
        line(TAK, '…틀린 말은 아니다. 내 입으로 못 했을 뿐이지.', "...It isn't wrong. I just couldn't say it with my own mouth."),
        line(TAK, '지어낸 말이 맞는 말이면, 그건 거짓말이냐 아니냐.', "If a made-up word turns out true, is it a lie or isn't it?", { act: 'look_away' }),
        line(P, '…', '...'),
        line(TAK, '…받침이나 가져가라.', '...Just take the rest.'),
      ], {
        choices: [
          opt('say_it_someday', '언젠가 직접 하시지요. 그 말씀.', 'Say it yourself, someday. Those words.', {
            stance: 'mid', aff: { [TAK]: 0.03 }, flags: ['choice.n19_thanks_owned'], end: endTalk({ accept: true, offer: 'beside_first',
              lineKo: '…언젠가. 가라. 이름은 빼고.',
              lineEn: '...Someday. Go. Leave my name out.' }),
            note: ['언젠가 그 말을 직접 하시라고 했다. 탁만수 씨의 칼끝이 마디에서 멈췄다. 언젠가, 하고만 대답했다.', 'I told him to say those words himself someday. The tip of his knife stopped on a node. Someday, was all he answered.'] }),
          opt('no_more_words', '다신 탁만수 씨 말을 지어내지 않겠습니다.', "I won't put words in your mouth again.", {
            stance: 'giver', aff: { [TAK]: 0.02 }, end: endTalk({ accept: true, offer: 'beside_first',
              lineKo: '그래. 내 말은 내가 한다. 못 하면 못 하는 것도 내 몫이고.',
              lineEn: "Good. My words are mine to say. And if I can't, that's mine too." }) }),
        ],
        note: ['탁만수 씨는 틀린 말은 아니라고, 자기 입으로 못 했을 뿐이라고 했다. 지어낸 말이 맞는 말이면 그건 거짓말이냐고, 대답을 바라지 않는 얼굴로 물었다.', "Mansu said it wasn't wrong — he just couldn't say it himself. If a made-up word is true, is it a lie, he asked, not wanting an answer."],
      }),
      no_word: scene([
        line(TAK, '한마디. …무슨 한마디.', 'A word. ...What word.'),
        line(TAK, '받침에 무슨 말을 붙이냐.', 'What would I hang on a rest?'),
        line(P, '잘 쓰라든가, 몸 조심하라든가요.', 'Use it well, take care of yourself — something like that.'),
        line(TAK, '대나무는 말이 없어서 좋은 거다. 말을 붙이면 그때부터 받침이 아니라 편지가 돼.', 'The good thing about bamboo is it keeps quiet. Hang words on it and it stops being a rest and turns into a letter.'),
        line(TAK, '나는 편지 쓸 줄 모른다.', "I don't know how to write letters.", { act: 'look_away' }),
      ], {
        choices: [
          opt('already_letter', '받침도 이미 편지 같은데요.', "The rest's already a kind of letter.", {
            stance: 'other', aff: { [TAK]: -0.02 }, end: endTalk({ accept: true, offer: 'beside_first',
              lineKo: '…말이 많다. 가져가라. 편지든 받침이든.',
              lineEn: '...You talk too much. Take it. Letter or rest.' }),
            note: ['받침도 이미 편지 같다고 했다. 탁만수 씨는 말이 많다면서도 받침을 내밀었다.', 'I said the rest was already a kind of letter. Mansu said I talked too much — and held out the rest anyway.'] }),
          opt('just_rest', '알겠습니다. 받침만 전하겠습니다.', 'Understood. Just the rest, then.', {
            stance: 'giver', aff: { [TAK]: 0.02 }, end: endTalk({ accept: true, offer: 'beside_first',
              lineKo: '그래. 받침만.',
              lineEn: 'Right. Just the rest.' }) }),
          opt('no_more_silent', '말 없는 심부름은 이제 못 하겠습니다.', "I can't carry silent errands any more.", {
            stance: 'self', aff: { [TAK]: -0.05 }, end: endTalk({ decline: true,
              lineKo: '…그래. 마음 바뀌면 와라. 대나무는 기다릴 줄 안다.',
              lineEn: '...Right. Come back if you change your mind. Bamboo knows how to wait.' }),
            note: ['말 없는 심부름은 이제 못 하겠다고 했다. 탁만수 씨는 받침을 평상 구석으로 밀어 두고, 대나무는 기다릴 줄 안다고 했다.', "I said I couldn't carry silent errands any more. Mansu pushed the rest into a corner of the bench and said bamboo knows how to wait."] }),
        ],
        note: ['한마디라도 같이 보내시라고 하자, 탁만수 씨는 대나무는 말이 없어서 좋은 거라고 했다. 말을 붙이면 편지가 되는데, 자기는 편지 쓸 줄 모른다고.', "When I asked him to send a word with it, Mansu said bamboo is good because it keeps quiet. Add words and it becomes a letter — and he can't write letters."],
      }),
    },
  },

  // N19-3 — 끝내는 자리(탁만수). 두 번째 받침이 첫 번째 옆에 나란히 놓였다(나레이션 정본)
  {
    id: 'n19_3_done', questId: 'N19-3', at: 'complete', npcId: TAK, start: 'start',
    nodes: {
      start: scene([
        line(TAK, '…놓고 왔냐.', '...Did you leave it?'),
        line(P, '네. 좌판에 두고 나오려는데, 정옥선 씨가 집어 들고 자리를 옮기셨어요.', 'Yes. As I was leaving it at the stall, Okseon picked it up and moved it.'),
        line(TAK, '…그 사람이.', '...She did.', { act: 'look_up' }),
        line(P, '아무 말씀은 없으셨고요.', "She didn't say anything."),
        line(TAK, '그렇겠지.', 'She wouldn\'t.'),
        act(TAK, 'silence'),
        line(TAK, '…어디에 놓더냐.', '...Where did she put it?'),
      ], {
        choices: [
          opt('relay', '첫 번째 옆에 나란히 놓으셨습니다.', 'She set it right beside the first one.', { next: 'side' }),
          opt('see_yourself', '그건 직접 가서 보시지요.', 'Go and see that for yourself.', {
            say: ['어디 두셨는지는… 직접 가서 보시지요. 제가 전하면 그것도 심부름이 되니까요.', "Where she put it... go and see for yourself. If I tell you, that becomes another errand."],
            aff: { [TAK]: -0.03 }, next: 'unsaid' }),
        ],
        note: ['두 번째 받침을 좌판에 두고 나오려는데 정옥선 씨가 집어 들고 자리를 옮겼다고 전했다. 탁만수 씨는 한참 있다가 어디에 놓더냐고 물었다.', 'I told Mansu that as I left the second rest at the stall, Okseon picked it up and moved it. After a long while he asked where she put it.'],
      }),
      side: scene([
        line(TAK, '…나란히.', '...Side by side.'),
        act(TAK, 'silence'),
        line(TAK, '나란히 놨으면 둘 다 쓴다는 거다.', 'If she set them side by side, she means to use both.'),
        line(P, '두 개 다 얼음 상자 밑에 받쳐 두셨어요.', 'Both of them are under the ice box.'),
        line(TAK, '하나는 버리고 하나만 쓰는 사람도 있는데.', 'Some people throw one out and keep only the other.'),
      ], {
        end: endTalk({ complete: 'relay',
          lineKo: '…그 사람은 안 버렸구나.',
          lineEn: "...She didn't throw it out." }),
        note: ['첫 번째 옆에 나란히 놓았다고 전했다. 탁만수 씨는 나란히 놨으면 둘 다 쓴다는 거라며, 그 사람은 안 버렸다고 몇 번 되뇌었다. 한참 뒤 세 번째를 깎기 시작했다.',
          "I told him she set it beside the first. Side by side means she uses both, Mansu said, and repeated that she hadn't thrown it out. Some time later he began carving a third."],
      }),
      unsaid: scene([
        line(TAK, '…직접은 무슨.', '...Myself, nothing.'),
        line(TAK, '말이 많구나. …그래, 그건 묻지 않으마.', "You talk too much. ...Fine. I won't ask about that."),
        line(P, '대신 하나 여쭤도 될까요?', 'Can I ask you something instead?'),
        line(TAK, '뭐냐.', 'What.'),
      ], {
        choices: [
          opt('lesson', '받침 깎는 결, 이제 좀 보여요. 저도 하나 깎아 보고 싶어요.', "I'm starting to see the grain. I'd like to carve one myself.", {
            end: endTalk({ complete: 'lesson',
              lineKo: '깎아 봐. 삐뚤어도 좋다. 칼은 마디를 넘을 때만 힘을 줘. 나머지는 대가 알아서 갈라진다. 삐뚠 건 버리지 말고 둬라. 삐뚠 첫 번째가 두 번째를 가르친다.',
              lineEn: 'Carve, then. Crooked is fine. Only put force into the knife when you cross a node. The bamboo splits the rest of the way on its own. Keep the crooked ones. A crooked first teaches the second.' }),
            note: ['받침을 하나 깎아 보고 싶다고 했다. 칼은 마디를 넘을 때만 힘을 주라는 것, 삐뚠 첫 번째가 두 번째를 가르친다는 것을 배웠다. 내가 깎은 건 공방 구석에 남았다.',
              "I asked to carve a rest myself. I learned to put force into the knife only when crossing a node, and that a crooked first teaches the second. Mine stayed in a corner of the workshop."] }),
          opt('pay', '심부름값은 받겠습니다.', "I'll take payment for the errand.", {
            end: endTalk({ complete: 'pay',
              lineKo: '…그러지. 노인 심부름값. 받는 건 잘하는 거다. 공짜로 부리면 나도 오래 못 시킨다. 다음에도 받아.',
              lineEn: "...Fair enough. An old man's errand money. Taking it is right. If I use you for free, I can't keep asking. Take it next time too." }),
            note: ['심부름값을 받겠다고 했다. 탁만수 씨는 조금 느린 손으로 돈을 건네며, 공짜로 부리면 오래 못 시킨다고 했다.', 'I asked to be paid. Mansu handed over the money a little slowly — if he used me for free, he said, he couldn\'t keep asking.'] }),
          opt('owe_one', '값은 됐습니다. 다음 받침 깎으실 때 불러만 주십시오.', "No payment. Just call me when you carve the next one.", {
            end: endTalk({ complete: 'owe_one',
              lineKo: '…부르긴. 공방 문은 늘 열려 있다. 오면 마디 고르는 거나 거들어라. 공짜로 심부름 시키는 노인 소리는 듣기 싫으니까.',
              lineEn: "...Call, nothing. The workshop door's always open. When you come, help me even out the nodes. I don't want to be known as an old man who runs people for free." }),
            note: ['값은 됐으니 다음 받침 깎을 때 불러 달라고 했다. 탁만수 씨는 공방 문은 늘 열려 있다며, 오면 마디 고르는 거나 거들라고 했다.', 'I waved off payment and asked to be called for the next rest. The workshop door is always open, Mansu said — come and help even out the nodes.'] }),
        ],
        note: ['어디 놓았는지는 직접 가서 보시라고 했다. 탁만수 씨는 말이 많다면서도 그건 묻지 않겠다고 했다.', "I told him to go and see for himself where she put it. Mansu said I talked too much, but that he wouldn't ask."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-4 「같이 늙는 일」 — 받는 자리(정옥선). 입원 · 오십 년은 아직(뒤 편 일)
  // ═══════════════════════════════════════════
  {
    id: 'n19_4_offer', questId: 'N19-4', at: 'offer', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(OK, '…요새 탁 씨가 매일 이 앞을 지나간다.', '...Lately Tak walks past here every day.', { act: 'look_away' }),
        line(P, '탁만수 씨가요?', 'Mansu does?'),
        line(OK, '좌판에 받침 두 개 놓이고부터.', 'Ever since there were two rests under the stall.'),
        line(P, '…들르시진 않고요?', "...But he doesn't stop?"),
        line(OK, '지나가기만 해. 좌판 앞에서 걸음이 좀 느려졌다가, 그냥 가.', 'He just walks past. His steps slow a bit in front of the stall, and then he goes.'),
        act(OK, 'silence'),
        line(OK, '앉으라고는 못 하고.', "I can't bring myself to ask him to sit."),
        line(P, '그럼…', 'Then...'),
        line(OK, '네가 좀. 아니다.', 'Could you. No.', { act: 'shake_head' }),
        line(OK, '…아니, 네가 좀.', '...No. Could you.'),
        line(P, '(두 분을 한자리에 앉혀 달라는 말씀이구나.)', '(She wants me to get the two of them sitting together.)'),
      ], {
        choices: [
          opt('two_chairs', '좌판 앞에 의자 두 개 놓겠습니다. 두 분 다 앉으시게요.', "I'll put two chairs in front of the stall. One for each of you.", {
            end: endTalk({ accept: true, offer: 'two_chairs',
              lineKo: '…의자는 있어. 앉을 사람이 없지. 네가 얼음 나를 때 불러. 나 혼자 부르면 안 와. 너도 같이 있으면… 올지도 모르지.',
              lineEn: "...There are chairs. It's someone to sit in them we lack. Call him when you're hauling ice. If I call alone, he won't come. With you there too... he might." }),
            note: ['좌판 앞에 의자 두 개를 놓겠다고 했다. 정옥선 씨는 의자는 있는데 앉을 사람이 없다며, 내가 얼음 나를 때 같이 불러 달라고 했다.',
              "I said I'd put two chairs in front of the stall. Okseon said there were chairs, just no one to sit — and asked me to call him over while I haul ice."] }),
          opt('ask_when', '매일 지나가신다고요? 언제쯤 지나가세요?', 'He passes every day? About when?', { next: 'when' }),
          opt('you_ask', '정옥선 씨가 먼저 앉으시라고 하시면 되지 않을까요?', 'Couldn\'t you just ask him to sit first?', { next: 'you_ask' }),
          opt('ask_past', '두 분, 예전에 무슨 일이 있으셨어요?', 'Did something happen between you two, long ago?', { next: 'past' }),
        ],
        note: ['좌판에 받침 두 개가 놓인 뒤로 탁만수 씨가 매일 좌판 앞을 지나간다고 했다. 정옥선 씨는 앉으라는 말을 못 한다며, 나더러 좀 해 달라고 했다가 말았다가 다시 부탁했다.',
          "Since the two rests went under the stall, Mansu has walked past every day. Okseon said she couldn't ask him to sit, and asked me to — then took it back — then asked again."],
      }),
      when: scene([
        line(OK, '늘 같은 때. 얼음 들어오고 좌판 정리할 무렵.', 'Always the same time. When the ice comes in and the stall gets tidied.'),
        line(N, '(말해 놓고 얼음 상자만 괜히 툭툭 친다.)', '(Having said it, she taps at the ice box for no reason.)'),
        line(P, '때까지 다 알고 계시네요.', 'You even know when.'),
        line(OK, '…내가 그걸 어떻게 아냐고는 묻지 마라.', "...Don't ask me how I know that.", { act: 'look_away' }),
        line(OK, '좌판에 앉아 있으면 다 보인다. 보이는 걸 어떡해.', "Sit at a stall and you see everything. What am I supposed to do, not see?"),
        line(P, '그 무렵에 맞춰 의자를 놓아 볼게요.', "I'll set out the chairs around then."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_when',
          lineKo: '…네가 얼음 나를 때 불러. 나 혼자 부르면 안 와.',
          lineEn: "...Call him when you're hauling ice. If I call alone, he won't come." }),
        note: ['언제쯤 지나가시느냐고 묻자, 정옥선 씨는 얼음 들어오고 좌판 정리할 무렵이라고 했다. 그걸 어떻게 아냐고는 묻지 말라고, 좌판에 앉아 있으면 다 보인다고.',
          "When I asked when he passed, Okseon said around the time the ice comes in and the stall gets tidied. Don't ask how she knows, she said — sit at a stall and you see everything."],
      }),
      you_ask: scene([
        line(OK, '그게 되면 너한테 말하겠냐.', "If I could, would I be telling you?"),
        line(N, '(얼음 상자 모서리를 손바닥으로 문지른다.)', '(She rubs the corner of the ice box with her palm.)'),
        line(OK, '…못 하니까 그렇지. 말이 목에서 안 나와.', "...It's because I can't. The words won't come out of my throat."),
        line(P, '…', '...'),
        line(OK, '그러니 네가 좀 해. 아니다. …네가 좀 해.', 'So you do it. No. ...You do it.'),
      ], {
        end: endTalk({ accept: true, offer: 'you_ask' }),
        note: ['먼저 앉으시라고 하시면 되지 않느냐고 했다. 정옥선 씨는 그게 되면 나한테 말하겠냐며, 말이 목에서 안 나온다고 했다.', "I asked why she didn't just ask him to sit. If she could, would she be telling me, Okseon said. The words won't come out."],
      }),
      past: scene([
        line(OK, '…그건 묻지 마라.', "...Don't ask about that.", { act: 'look_away' }),
        act(OK, 'silence'),
        line(N, '(얼음 한 덩이를 집어 상자에 넣는다.)', '(She picks up a lump of ice and drops it in the box.)'),
        line(OK, '지난 얘기는 꺼내면 덧난다.', 'Old stories get worse when you dig them up.'),
        line(P, '죄송해요. 괜한 걸 여쭸네요.', "Sorry. I shouldn't have asked."),
        line(OK, '너는 의자나 놓아. 앉혀만 주면 그다음은 우리가 어떻게든 한다.', "You just set out the chairs. Get us seated, and we'll manage the rest somehow."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_past' }),
        note: ['예전에 무슨 일이 있었느냐고 물었다가, 지난 얘기는 꺼내면 덧난다는 대답을 들었다. 앉혀만 주면 그다음은 두 사람이 어떻게든 한다고 했다.',
          "I asked what had happened between them long ago and was told old stories get worse when dug up. Get them seated, she said, and they'd manage the rest."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-4 「같이 늙는 일」 — 진행 중(정옥선 앞 · 「두 사람을 한자리에 앉힌다」 세 단계)
  //  셋 다 좌판 앞으로 모인다(나레이션 · 끝내는 자리 「십 분 · 말이 없었다」 정본). 갈래는 앉히는 방법과 마음만 바꾼다.
  //  290차 — 지문만으로 된 끝말은 뒤 장면(`sat` · `lifted` · `waited` …)의 지문 줄로 옮겼다.
  // ═══════════════════════════════════════════
  {
    id: 'n19_4_seats', questId: 'N19-4', at: 'action', objectiveIndex: 1, step: 0, npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(정옥선 씨가 좌판 밑에서 접이 의자 두 개를 꺼냈다가, 하나를 도로 넣는다. 그러다 다시 꺼낸다.)', '(Okseon pulls two folding chairs from under the stall, puts one back, then takes it out again.)'),
        line(OK, '…의자는 있다. 놓을 데가 없지.', "...There are chairs. It's where to put them."),
        line(P, '어디에 놓을까요?', 'Where should they go?'),
        line(OK, '네가 정해. 나는 모른다.', "You decide. I don't know."),
        line(OK, '나는 얼음만 본다.', 'I just watch the ice.', { act: 'look_away' }),
      ], {
        choices: [
          opt('side_by_side', '얼음 상자 사이에 나란히 놓겠습니다. 둘 다 바다를 보시게요.', "Side by side, between the ice boxes. You'll both face the sea.", {
            stance: 'giver', aff: { [OK]: 0.05 }, end: endTalk({
              lineKo: '…나란히. 그래. 마주 보면 둘 다 일어나 간다.',
              lineEn: "...Side by side. Yes. Face to face, we'd both get up and leave." }),
            note: ['얼음 상자 사이에 나란히, 바다를 보게 놓겠다고 했다. 정옥선 씨는 의자 하나를 받아 직접 펴고 바다 쪽으로 반 뼘 돌려놓았다.', "I said side by side between the ice boxes, facing the sea. Okseon took a chair, unfolded it herself and turned it half a hand's width towards the water."] }),
          opt('facing', '마주 보게 놓겠습니다. 얼굴은 보셔야지요.', "Facing each other. You ought to see each other's faces.", {
            stance: 'mid', aff: { [OK]: -0.05 }, next: 'no_facing' }),
          opt('workshop', '공방 앞 평상은 어떻습니까? 탁만수 씨도 편하실 텐데요.', "How about the bench outside the workshop? Mansu would be more at ease there.", {
            stance: 'other', aff: { [OK]: -0.06 }, next: 'too_close' }),
          opt('your_stall', '정옥선 씨 좌판이니 정옥선 씨가 정하시지요.', "It's your stall, Okseon. You decide.", {
            stance: 'self', aff: { [OK]: -0.02 }, next: 'you_decide' }),
        ],
        note: ['정옥선 씨가 접이 의자 두 개를 꺼냈다 넣었다 했다. 놓을 데는 나더러 정하라고, 자기는 얼음만 본다고 했다.', 'Okseon took two folding chairs out and put them back and took them out again. She told me to decide where — she just watches the ice.'],
      }),
      no_facing: scene([
        line(OK, '얼굴은 무슨.', 'Faces, nothing.'),
        line(N, '(의자를 탁 접는다.)', '(She snaps a chair shut.)'),
        line(OK, '마주 보고 앉으면 할 말이 있어야 해. 할 말 없는 늙은이 둘이 마주 앉아서 뭘 하냐.', 'Sit face to face and you need something to say. Two old people with nothing to say, sitting face to face. Doing what?'),
        line(P, '그럼 어떻게…', 'Then how...'),
        line(OK, '나란히 놔. 바다 보게. 바다는 아무 말 안 해도 돼.', "Put them side by side. Facing the sea. The sea doesn't need you to say anything.", { act: 'look_sea' }),
      ], {
        choices: [
          opt('as_you_say', '알겠습니다. 나란히 놓겠습니다.', 'All right. Side by side.', {
            stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({
              lineKo: '그래. 받침 두 개 보이는 데로. 그 사람이 앉아서 그걸 봐야지.',
              lineEn: 'Good. Where the two rests can be seen. He ought to sit and look at them.' }) }),
          opt('face_later', '그럼 오늘은 나란히, 다음엔 마주 보시는 걸로요.', 'Then side by side today, and face to face next time.', {
            stance: 'mid', aff: { [OK]: -0.02 }, end: endTalk({
              lineKo: '다음은 무슨 다음. 오늘이나 앉으면 다행이다.',
              lineEn: "Next time, nothing. We'll be lucky if we sit today." }),
            note: ['오늘은 나란히, 다음엔 마주 보시라고 했다. 정옥선 씨는 눈을 흘기면서도 의자를 나란히 폈다.', 'I suggested side by side today and face to face next time. Okseon shot me a look — but set the chairs side by side.'] }),
        ],
        note: ['마주 보게 놓자고 했다가, 할 말 없는 늙은이 둘이 마주 앉아서 뭘 하냐는 소리를 들었다. 바다는 아무 말 안 해도 된다고 했다.', 'I suggested facing each other and was asked what two old people with nothing to say would do face to face. The sea needs no words, she said.'],
      }),
      too_close: scene([
        line(OK, '거기를 내가 왜 가.', 'Why would I go there?'),
        act(OK, 'silence'),
        line(OK, '…가깝지. 가까워서 못 가는 데도 있다.', "...It's close. Some places you can't go because they're close.", { act: 'look_away' }),
        line(P, '…', '...'),
        line(OK, '여기 놔. 좌판 앞. 여기는 다들 얼음만 보지 사람은 안 봐.', 'Put them here. In front of the stall. Here everyone looks at the ice, not at people.'),
      ], {
        choices: [
          opt('same_words', '탁만수 씨도 똑같은 말씀을 하셨습니다. 가까워서 못 간다고요.', "Mansu said exactly the same thing. That it's too close to go.", {
            stance: 'other', aff: { [OK]: 0.04 }, requires: { flag: 'choice.n19_heard_close' }, end: endTalk({
              lineKo: '…그 영감이 그래? 둘 다 늙어서 그렇다. 늙으면 가까운 데가 제일 멀어.',
              lineEn: "...The old man said that? We're both old, that's why. When you're old, the closest place is the farthest." }),
            note: ['탁만수 씨도 가까워서 못 간다고 했다고 전했다. 정옥선 씨는 한참 나를 보더니 서툰 손으로 의자를 폈다. 늙으면 가까운 데가 제일 멀다고 했다.', "I told her Mansu had said the same — too close to go. Okseon looked at me a long while, then unfolded a chair with fumbling hands. When you're old, she said, the closest place is the farthest."] }),
          opt('here_then', '그럼 좌판 앞에 놓겠습니다.', "Then I'll put them in front of the stall.", {
            stance: 'giver', aff: { [OK]: 0.02 }, end: endTalk({
              lineKo: '그래. 얼음 상자 사이. 바람 덜 드는 데로.',
              lineEn: 'Good. Between the ice boxes. Out of the wind.' }) }),
        ],
        note: ['공방 앞 평상은 어떠냐고 했다. 정옥선 씨는 가까워서 못 가는 데도 있다며, 다들 얼음만 보는 좌판 앞에 놓으라고 했다.', 'I suggested the bench outside the workshop. Okseon said some places you can\'t go because they\'re close, and told me to put them in front of the stall, where everyone looks at the ice.'],
      }),
      you_decide: scene([
        act(OK, 'laugh'),
        line(OK, '내가 정할 거면 너한테 물었겠냐. 내 좌판이니까 못 정하는 거다.', "If I could decide, would I be asking you? It's my stall, that's exactly why I can't."),
        line(P, '…', '...'),
        line(OK, '정 모르겠으면 얼음 상자 사이에 둬. 바람 덜 드는 데.', "If you really don't know, put them between the ice boxes. Out of the wind."),
        line(OK, '그건 내가 말한 거 아니다.', "And I didn't say that."),
      ], {
        choices: [
          opt('between_boxes', '얼음 상자 사이에 놓겠습니다. 정옥선 씨는 아무 말씀 안 하셨고요.', "Between the ice boxes, then. And you didn't say a thing.", {
            stance: 'giver', aff: { [OK]: 0.04 }, end: endTalk({
              lineKo: '…그래. 나는 아무 말도 안 했다.',
              lineEn: '...Right. I said nothing.' }),
            note: ['얼음 상자 사이에 놓겠다고, 정옥선 씨는 아무 말도 안 한 거라고 했다. 웃음을 참는 얼굴로 의자 하나를 받아 폈다.', "I said I'd put them between the ice boxes — and that she'd said nothing. Holding back a smile, she took a chair and unfolded it."] }),
        ],
        note: ['정하시라고 했더니, 정옥선 씨는 자기 좌판이라 못 정하는 거라며 코웃음을 쳤다. 정 모르겠으면 바람 덜 드는 얼음 상자 사이에 두라고, 그건 자기가 한 말이 아니라고.', "When I told her to decide, Okseon snorted that it was her stall, so she couldn't. Put them between the ice boxes out of the wind if I really didn't know — and she hadn't said that."],
      }),
    },
  },

  // N19-4 둘째 단계 — 탁만수를 부른다. 매일 같은 때 좌판 앞을 지나간다(목표 문장). 어느 길이든 노인은 의자에 앉는다
  {
    id: 'n19_4_call', questId: 'N19-4', at: 'action', objectiveIndex: 1, step: 1, npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(얼음을 고르던 정옥선 씨의 손이 멈춘다. 좌판 너머 길을 턱으로 가리킨다.)', '(Okseon\'s hands stop sorting the ice. She points past the stall at the road with her chin.)'),
        line(OK, '저기 온다.', 'There he comes.'),
        line(P, '어디요?', 'Where?'),
        line(OK, '매일 이맘때야. 발소리만 들어도 안다.', "Every day about now. I'd know those footsteps anywhere."),
        line(OK, '어떻게 부를 건데. 내가 불렀다고는 하지 마라.', "How are you going to call him over? Don't say I called him."),
      ], {
        choices: [
          opt('ice_pretext', '얼음 좀 같이 옮겨 달라고 부르겠습니다. 지나다 우연히요.', "I'll ask him to help me shift some ice. As if by chance.", {
            stance: 'giver', aff: { [OK]: 0.04 }, next: 'pretext' }),
          opt('tell_true', '정옥선 씨가 잠깐 앉으시랍니다, 하고 부르겠습니다.', "I'll call out that Okseon would like him to sit a while.", {
            stance: 'other', aff: { [OK]: -0.08, [TAK]: 0.05 }, flags: ['choice.n19_4_told_invite'], next: 'truth',
            note: ['정옥선 씨가 앉으시란다고 사실대로 부르겠다고 했다.', 'I said I would call out the truth: that Okseon wanted him to sit.'] }),
          opt('ask_saebyeok', '탁새벽 씨한테 탁만수 씨를 모셔 오라고 하겠습니다.', "I'll get Saebyeok to bring Mansu over.", {
            stance: 'mid', aff: { [OK]: 0.02, [SAE]: 0.04 }, flags: ['choice.n19_4_sent_saebyeok'], next: 'kid',
            note: ['손자 새벽이에게 할아버지를 모셔 오라고 부탁하겠다고 했다.', "I said I'd ask his grandson Saebyeok to bring him over."] }),
          opt('let_be', '부르지 않겠습니다. 오실 마음이면 오시겠지요.', "I won't call him. If he means to come, he'll come.", {
            stance: 'self', aff: { [OK]: -0.05 }, next: 'passing' }),
        ],
        note: ['탁만수 씨가 매일 같은 때 좌판 앞을 지나간다. 정옥선 씨는 발소리만 들어도 안다며, 어떻게 부를 거냐고, 자기가 불렀다고는 하지 말라고 했다.', "Mansu passes the stall at the same time every day. Okseon said she knew his footsteps, and asked how I'd call him over — without saying she had."],
      }),
      pretext: scene([
        line(N, '(발소리가 좌판 앞에서 멈춘다. 탁만수 씨가 얼음 상자와 나와 좌판 귀퉁이를 차례로 본다.)', '(The footsteps stop in front of the stall. Mansu looks at the ice box, at me, at the corner of the stall.)'),
        line(TAK, '…얼음을. 내가. 이 허리로.', '...Ice. Me. With this back.'),
        line(P, '잠깐이면 돼요. 상자 하나만요.', 'Just a moment. Only one box.'),
        line(N, '(그래도 소매를 걷는다. 눈은 얼음 상자 사이 의자 두 개에 가 있다.)', '(Still, he rolls up his sleeves. His eyes are on the two chairs between the ice boxes.)'),
        line(TAK, '…어느 거냐.', '...Which one?'),
      ], {
        choices: [
          opt('sit_first', '드는 건 제가 하겠습니다. 잠깐 앉아 계시지요.', "I'll do the lifting. Just sit a moment.", {
            stance: 'giver', aff: { [TAK]: 0.02, [OK]: 0.02 }, next: 'sat' }),
          opt('lift_together', '같이 들어 주시면 금방입니다.', "With the two of us it'll be quick.", {
            stance: 'mid', aff: { [TAK]: -0.02 }, next: 'lifted' }),
        ],
        note: ['얼음 좀 같이 옮겨 달라고 불렀다. 탁만수 씨는 이 허리로 얼음을 드냐면서도 소매를 걷었다. 눈은 얼음 상자 사이 의자 두 개에 가 있었다.', 'I called him over to help shift ice. Mansu grumbled about his back but rolled up his sleeves. His eyes were on the two chairs between the ice boxes.'],
      }),
      sat: scene([
        line(N, '(탁만수 씨가 한참 서 있다가 의자에 앉는다. 정옥선 씨 옆자리다.)', "(Mansu stands a long while, then sits. In the chair beside Okseon's.)"),
        line(N, '(정옥선 씨는 얼음만 본다. 얼음 집게 끝이 조금 떨린다.)', '(Okseon looks only at the ice. The tip of her tongs trembles a little.)'),
      ], {
        end: endTalk({}),
        note: ['드는 건 내가 할 테니 앉아 계시라고 했다. 탁만수 씨는 한참 서 있다가 정옥선 씨 옆자리에 앉았다. 정옥선 씨의 얼음 집게 끝이 조금 떨렸다.', "I said I'd do the lifting and asked him to sit. Mansu stood a long while, then sat beside Okseon. The tip of her tongs trembled."],
      }),
      lifted: scene([
        line(N, '(둘이 얼음 상자를 든다. 내려놓고 나니 탁만수 씨 숨이 차다.)', '(We lift the ice box together. When we set it down, Mansu is short of breath.)'),
        line(N, '(정옥선 씨가 말없이 의자 하나를 발로 밀어 준다. 탁만수 씨가 앉는다.)', '(Without a word, Okseon nudges a chair towards him with her foot. He sits.)'),
      ], {
        end: endTalk({}),
        note: ['같이 얼음 상자를 들었다. 숨이 찬 탁만수 씨에게 정옥선 씨가 말없이 의자를 발로 밀어 주었고, 탁만수 씨가 앉았다.', 'We lifted the ice box together. When Mansu ran short of breath, Okseon silently nudged a chair to him with her foot, and he sat.'],
      }),
      truth: scene([
        line(OK, '너…! 내가 언제 앉으라 했어!', 'You...! When did I ever say sit!'),
        line(N, '(정옥선 씨 목소리가 좌판 앞까지 갔다. 발소리가 거기서 멈췄다.)', '(Her voice carried right to the front of the stall. The footsteps stopped there.)'),
      ], {
        choices: [
          opt('wave_him', '(이미 탁만수 씨께 손짓을 하고 있다.)', "(I'm already waving Mansu over.)", {
            stance: 'other', next: 'waved' }),
          opt('sorry_loud', '죄송합니다. 제가 말을 잘못 옮겼습니다.', "I'm sorry. I put it badly.", {
            stance: 'giver', aff: { [OK]: 0.03 }, next: 'owned_up' }),
        ],
        note: ['정옥선 씨가 앉으시란다고 큰 소리로 불렀다. 정옥선 씨는 언제 앉으라 했냐며 얼음 집게를 떨어뜨렸고, 그 목소리에 발소리가 멈췄다.', "I called out that Okseon wanted him to sit. She dropped her tongs — when did she ever say that — and at her voice the footsteps stopped."],
      }),
      waved: scene([
        line(N, '(탁만수 씨가 정옥선 씨 쪽은 보지 않은 채 중얼거린다.)', '(Without looking her way, Mansu mutters.)'),
        line(TAK, '…그 사람이 앉으라 했다고.', '...She said to sit, did she.'),
        line(N, '(한참 서 있다가 아주 천천히 의자에 앉는다. 정옥선 씨는 얼음 집게를 주워 들고 얼음만 본다. 귀가 붉다.)', '(He stands a long while, then very slowly sits. Okseon picks up her tongs and looks only at the ice. Her ears are red.)'),
      ], {
        end: endTalk({}),
        note: ['이미 손짓을 하고 있었다. 탁만수 씨는 그 사람이 앉으라 했다고 중얼거리며 아주 천천히 앉았다. 정옥선 씨는 얼음만 보았다. 귀가 붉었다.', "I was already waving him over. Mansu muttered that she'd said to sit, and very slowly sat. Okseon looked only at the ice. Her ears were red."],
      }),
      owned_up: scene([
        line(N, '(좌판 앞에 선 탁만수 씨가 나를 한 번, 정옥선 씨를 한 번 본다.)', '(Standing in front of the stall, Mansu looks once at me and once at Okseon.)'),
        line(N, '(그러고는 말없이 의자에 앉는다. 누구 말이든 상관없다는 얼굴이다.)', '(Then he sits down without a word. Whoever\'s words they were, his face says it makes no difference.)'),
      ], {
        end: endTalk({}),
        note: ['말을 잘못 옮겼다고 사과했다. 탁만수 씨는 나와 정옥선 씨를 한 번씩 보고는, 누구 말이든 상관없다는 얼굴로 앉았다.', "I apologised for putting it badly. Mansu looked once at me and once at Okseon, then sat as if it made no difference whose words they were."],
      }),
      kid: scene([
        line(N, '(새벽이가 탁만수 씨 소매를 잡아끌며 좌판으로 온다.)', "(Saebyeok comes to the stall dragging Mansu by the sleeve.)"),
        line(SAE, '할아버지, 빨리! {player} 씨가 의자 놨대. 할머니 옆에!', 'Grandpa, hurry! {player} put out a chair. Next to Grandma!'),
        line(N, '(탁만수 씨가 버티자 새벽이가 두 손으로 등을 민다.)', '(When his grandfather digs in his heels, Saebyeok pushes him from behind with both hands.)'),
        line(SAE, '앉아. 다리 아프다며. 아까부터 다리 아프다며!', "Sit. You said your legs hurt. You've been saying so all day!"),
      ], {
        choices: [
          opt('well_done', '탁새벽 씨, 잘했어요.', 'Well done, Saebyeok.', {
            stance: 'mid', aff: { [SAE]: 0.03, [TAK]: -0.02 }, next: 'kid_done' }),
          opt('easy_now', '천천히요. 탁만수 씨 넘어지시겠어요.', "Easy. You'll knock Mansu over.", {
            stance: 'other', aff: { [TAK]: 0.02 }, next: 'kid_easy' }),
        ],
        note: ['새벽이가 할아버지 소매를 잡아끌고 와서, 다리 아프다면서 왜 안 앉느냐고 등을 밀었다.', "Saebyeok dragged his grandfather over by the sleeve and pushed him from behind — hadn't he said his legs hurt?"],
      }),
      kid_done: scene([
        line(N, '(탁만수 씨가 손자 손을 털어 내고 의자 앞에 선다. 한참 서 있다가 앉는다.)', "(Mansu shakes off his grandson's hands and stands in front of the chair. After a long while he sits.)"),
        line(N, '(새벽이가 그 옆에서 히죽 웃고, 정옥선 씨는 얼음 집게로 새벽이를 가리키다 만다.)', '(Saebyeok grins beside him, and Okseon starts to point her tongs at the boy, then stops.)'),
      ], {
        end: endTalk({}),
        note: ['새벽이에게 잘했다고 했다. 탁만수 씨는 손자 손을 털어 내고 한참 서 있다가 앉았다. 새벽이는 히죽 웃었다.', 'I told Saebyeok well done. Mansu shook off the boy\'s hands, stood a long while, then sat. Saebyeok grinned.'],
      }),
      kid_easy: scene([
        line(N, '(새벽이가 손을 놓는다. 탁만수 씨가 숨을 고르고, 혼자 걸어와 의자에 앉는다.)', '(Saebyeok lets go. Mansu catches his breath, walks over on his own and sits.)'),
        line(N, '(정옥선 씨는 얼음만 본다.)', '(Okseon looks only at the ice.)'),
      ], {
        end: endTalk({}),
        note: ['새벽이에게 천천히 하라고 했다. 탁만수 씨는 숨을 고르고 혼자 걸어와 앉았다.', 'I told Saebyeok to go easy. Mansu caught his breath, walked over on his own, and sat.'],
      }),
      passing: scene([
        line(N, '(발소리가 좌판 앞을 그냥 지나간다. 정옥선 씨가 얼음 집게를 쥔 채 고개를 숙인다.)', '(The footsteps pass right by the front of the stall. Tongs still in hand, Okseon lowers her head.)'),
        line(OK, '…봐라. 그냥 간다. 매일 저래.', '...See. He just walks on. Every day the same.'),
        act(OK, 'silence'),
        line(OK, '네가 좀. 아니다.', 'Could you. No.'),
        line(OK, '…네가 좀.', '...Could you.'),
      ], {
        choices: [
          opt('call_rest', '탁만수 씨! 잠깐 쉬었다 가세요!', 'Mansu! Stop and rest a moment!', {
            stance: 'mid', aff: { [OK]: 0.03 }, next: 'called' }),
          opt('chase_ice', '(얼음 상자를 들고 탁만수 씨를 뒤쫓는다.)', '(I pick up an ice box and go after Mansu.)', {
            stance: 'giver', aff: { [OK]: 0.02 }, next: 'pretext' }),
        ],
        note: ['부르지 않았더니 발소리가 그냥 지나갔다. 정옥선 씨는 고개를 숙이고, 네가 좀, 아니다, 네가 좀 하고 작게 말했다.', 'I didn\'t call, and the footsteps went right past. Okseon lowered her head and said quietly: could you — no — could you.'],
      }),
      called: scene([
        line(N, '(발소리가 멈춘다. 탁만수 씨가 돌아보지 않은 채 한참 서 있다.)', "(The footsteps stop. Mansu stands a long while without turning.)"),
        line(N, '(그러다 돌아서서 의자 쪽으로 온다. 정옥선 씨가 얼음 집게를 고쳐 쥔다.)', '(Then he turns and comes over to the chair. Okseon shifts her grip on the tongs.)'),
      ], {
        end: endTalk({}),
        note: ['쉬었다 가시라고 불렀다. 탁만수 씨는 한참 돌아보지 않고 서 있다가, 돌아서서 의자 쪽으로 왔다.', 'I called to him to stop and rest. Mansu stood a long while without turning, then turned and came to the chair.'],
      }),
    },
  },

  // N19-4 셋째 단계 — 대화를 끝까지 지켜본다(이야기의 절정). 두 사람이 몇 마디를 주고받는다. 끼어들거나 입을 다문다.
  //  지어낸 「고맙다」가 여기서 탁만수 자신의 말이 된다(choice.n19_white_thanks · choice.n19_thanks_owned).
  {
    id: 'n19_4_watch', questId: 'N19-4', at: 'action', objectiveIndex: 1, step: 2, npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(좌판 앞, 얼음 상자 사이에 의자 두 개. 두 사람이 나란히 앉아 바다 쪽을 본다. 서로는 보지 않는다.)', '(Two chairs in front of the stall, between the ice boxes. The two of them sit side by side, facing the sea. Neither looks at the other.)'),
        line(N, '(얼음이 녹아 받침 마디 사이로 물이 똑똑 떨어진다. 한참 그 소리뿐이다.)', '(Meltwater drips between the nodes of the rests. For a long while that is the only sound.)'),
        line(P, '(…끼어들까, 말까.)', '(...Should I say something, or not?)'),
      ], {
        choices: [
          opt('wait_by_ice', '(얼음 상자 옆에 서서 기다린다.)', '(I stand by the ice boxes and wait.)', {
            stance: 'self', next: 'o_rest' }),
          opt('small_talk', '날이 좋습니다. 바다가 잔잔하네요.', "Fine day. The sea's calm.", {
            stance: 'mid', aff: { [OK]: -0.02, [TAK]: -0.02 }, next: 'o_rest' }),
          opt('clear_invite', '아까 앉으시라 한 건 제 말이었습니다. 정옥선 씨 말씀이 아니라요.', "Asking you to sit earlier was me. Not Okseon.", {
            stance: 'giver', aff: { [OK]: 0.04, [TAK]: -0.04 }, requires: { flag: 'choice.n19_4_told_invite' }, next: 'o_rest' }),
          opt('take_kid', '(새벽이를 데리고 얼음 상자 뒤로 물러선다.)', '(I take Saebyeok and step back behind the ice boxes.)', {
            stance: 'giver', aff: { [SAE]: -0.02, [OK]: 0.02 }, requires: { flag: 'choice.n19_4_sent_saebyeok' }, next: 'o_rest' }),
        ],
        note: ['두 사람이 얼음 상자 사이 의자에 나란히 앉아 바다를 보았다. 받침 마디 사이로 녹은 물 떨어지는 소리뿐이었다.', 'The two of them sat side by side on the chairs between the ice boxes, facing the sea. The only sound was meltwater dripping through the rests.'],
      }),
      o_rest: scene([
        line(OK, '…받침. 물 잘 빠지더라.', '...The rests. They drain well.', { act: 'look_sea' }),
        line(N, '(정옥선 씨는 그 말을 하고는 얼음 집게만 만지작거린다.)', '(Having said it, Okseon just fiddles with the ice tongs.)'),
      ], {
        choices: [
          opt('quiet_a', '(가만히 있는다.)', '(I keep quiet.)', { stance: 'self', next: 't_nodes' }),
          opt('tell_gaps', '두 번째 건 일부러 틈을 넓혀 깎으셨답니다.', 'He cut the gaps wider on the second one. On purpose.', {
            stance: 'giver', aff: { [OK]: 0.04, [TAK]: -0.04 }, next: 't_flustered' }),
        ],
        note: ['정옥선 씨가 바다를 본 채로, 받침이 물 잘 빠지더라고 먼저 말했다.', 'Still facing the sea, Okseon spoke first: the rests drain well.'],
      }),
      t_nodes: scene([
        line(TAK, '…마디를 띄워 깎았으니까.', '...Because I cut the nodes apart.'),
        act(TAK, 'silence'),
        line(TAK, '좌판이 바다 쪽으로 기울었더라. 그래서 두 번째는 틈을 넓혔다.', 'The stall leans towards the sea. So I widened the gaps on the second one.'),
        line(N, '(탁만수 씨는 말해 놓고 입을 다문다. 너무 많이 말했다는 얼굴이다.)', "(Mansu says it and shuts his mouth. He looks like a man who's said too much.)"),
      ], {
        choices: [
          opt('quiet_b', '(얼음만 고른다.)', '(I just sort the ice.)', { stance: 'self', next: 'o_food' }),
          opt('tell_hesitate', '정옥선 씨가 반찬 싸 놓고 한참 망설이셨습니다.', 'Okseon packed that food and hesitated over it a long time.', {
            stance: 'other', aff: { [OK]: -0.05, [TAK]: 0.04 }, next: 'o_food' }),
        ],
        note: ['탁만수 씨가 좌판이 바다 쪽으로 기울어서 두 번째는 틈을 넓혔다고 말하고는, 너무 많이 말했다는 얼굴로 입을 다물었다.', 'Mansu said the stall leans seaward so he widened the second one\'s gaps — then shut his mouth like a man who had said too much.'],
      }),
      t_flustered: scene([
        line(TAK, '…쓸데없는 소리를.', '...Nonsense.', { act: 'look_away' }),
        line(TAK, '물이 한쪽으로 고여서 고친 거다. 그뿐이다.', "Water pooled on one side, so I fixed it. That's all."),
        line(N, '(그래도 탁만수 씨는 정옥선 씨 쪽 받침을 한 번 본다. 정옥선 씨도 그 받침을 본다. 둘의 눈이 받침 위에서 잠깐 만난다.)', "(Still, Mansu glances once at the rest on Okseon's side. She looks at it too. Their eyes meet, briefly, on the rest.)"),
      ], {
        choices: [
          opt('quiet_c', '(못 본 척 얼음을 고른다.)', '(I pretend not to see and sort the ice.)', { stance: 'self', next: 'o_food' }),
        ],
        note: ['일부러 틈을 넓혔다고 내가 말해 버리자 탁만수 씨는 쓸데없는 소리라고 했다. 그래도 두 사람의 눈이 받침 위에서 잠깐 만났다.', "When I let slip that he'd widened the gaps on purpose, Mansu called it nonsense. Still, their eyes met for a moment over the rest."],
      }),
      o_food: scene([
        line(OK, '…반찬은. 입에 맞던가.', '...The food. Was it to your taste?', { act: 'look_sea' }),
        line(N, '(대답을 기다리는 얼굴은 아니다. 그래도 얼음 집게가 멈춰 있다.)', "(She doesn't look as if she's waiting for an answer. Still, the tongs have stopped.)"),
      ], {
        choices: [
          opt('quiet_e', '(가만히 있는다.)', '(I keep quiet.)', { stance: 'self', next: 't_food' }),
          opt('speak_for', '맛있게 드셨답니다. 젓가락 소리가 한참 났습니다.', 'He enjoyed it. I heard his chopsticks going a long while.', {
            stance: 'giver', aff: { [OK]: 0.03, [TAK]: -0.04 }, next: 't_food' }),
          opt('double_down', '고맙다고 하셨잖아요, 그때.', 'You said thank you, back then.', {
            stance: 'mid', aff: { [TAK]: -0.03 }, requires: { flag: 'choice.n19_white_thanks', notFlag: 'choice.n19_thanks_confessed' }, next: 'lie_out',
            note: ['지어냈던 고맙다는 말을, 탁만수 씨 앞에서 그때 하셨잖느냐고 한 번 더 밀어붙였다.', "In front of Mansu, I pushed the made-up thank-you once more: he'd said it back then, hadn't he?"] }),
          opt('say_it', '탁만수 씨, 그때 못 하신 말씀 있지 않으세요?', "Mansu, wasn't there something you couldn't say back then?", {
            stance: 'other', aff: { [TAK]: -0.02, [OK]: 0.02 }, requires: { flag: 'choice.n19_thanks_owned' }, next: 't_thanks' }),
        ],
        note: ['정옥선 씨가 바다를 본 채로 반찬은 입에 맞더냐고 물었다. 대답을 기다리는 얼굴은 아니었지만 얼음 집게가 멈춰 있었다.', "Still facing the sea, Okseon asked whether the food was to his taste. She didn't look as if she wanted an answer, but her tongs had stopped."],
      }),
      t_food: scene([
        line(TAK, '…비워 보냈잖나.', "...I sent it back empty, didn't I."),
        act(TAK, 'silence'),
        line(TAK, '씻어서.', 'Washed.'),
        line(N, '(그게 대답의 전부다. 정옥선 씨가 고개를 아주 조금 끄덕인다. 그 뒤로는 아무도 말이 없다.)', '(That is the whole of his answer. Okseon nods, very slightly. After that, nobody says anything.)'),
      ], {
        choices: [
          opt('wait_out', '(십 분이 다 갈 때까지 얼음 상자 옆을 지킨다.)', '(I stay by the ice boxes until the ten minutes are up.)', {
            stance: 'self', next: 'waited' }),
          opt('tomorrow_too', '내일도 이맘때 의자를 놓아 두겠습니다.', "I'll put the chairs out about this time tomorrow too.", {
            stance: 'mid', aff: { [OK]: 0.02, [TAK]: 0.02 }, next: 'tomorrow' }),
          opt('more_to_say', '두 분, 하실 말씀이 더 있지 않으십니까?', "Isn't there more the two of you want to say?", {
            stance: 'mid', aff: { [OK]: -0.04, [TAK]: -0.04 }, next: 'pressed' }),
        ],
        note: ['탁만수 씨는 비워 보냈잖냐고, 씻어서라고만 했다. 정옥선 씨가 아주 조금 고개를 끄덕였고, 그 뒤로는 아무도 말이 없었다.', 'Mansu only said he\'d sent it back empty — washed. Okseon nodded very slightly, and after that nobody spoke.'],
      }),
      waited: scene([
        line(N, '(탁만수 씨가 먼저 일어선다. 정옥선 씨는 그 등을 보지 않는다.)', "(Mansu gets up first. Okseon doesn't watch him go.)"),
        line(N, '(대신 얼음 상자 하나를 빈 의자 쪽으로 반 뼘 밀어 둔다.)', "(Instead she pushes one ice box half a hand's width towards the empty chair.)"),
      ], {
        end: endTalk({}),
        note: ['십 분이 다 갈 때까지 얼음 상자 옆을 지켰다. 탁만수 씨가 먼저 일어섰고, 정옥선 씨는 얼음 상자 하나를 빈 의자 쪽으로 반 뼘 밀어 두었다.', "I stood by the ice boxes until the ten minutes were up. Mansu got up first, and Okseon pushed an ice box half a hand's width towards the empty chair."],
      }),
      tomorrow: scene([
        line(OK, '…쓸데없는 소리.', '...Nonsense.'),
        line(N, '(얼음 집게를 다시 든다. 그래도 의자는 접지 않는다.)', "(She takes up the tongs again. Still, she doesn't fold the chairs.)"),
        line(N, '(일어서던 탁만수 씨가 의자 등받이를 한 번 쓸어 보고 간다.)', '(Getting to his feet, Mansu runs his hand once along the back of his chair before he goes.)'),
      ], {
        end: endTalk({}),
        note: ['내일도 이맘때 의자를 놓아 두겠다고 했다. 정옥선 씨는 쓸데없는 소리라면서도 의자를 접지 않았고, 탁만수 씨는 일어서며 등받이를 한 번 쓸어 보고 갔다.', "I said I'd set the chairs out at this time tomorrow too. Okseon called it nonsense but didn't fold the chairs, and Mansu ran a hand along the chair back as he left."],
      }),
      pressed: scene([
        line(N, '(둘 다 대답이 없다. 정옥선 씨는 얼음 상자 뚜껑을 탁 닫고, 탁만수 씨는 무릎을 짚고 일어선다.)', '(Neither answers. Okseon snaps the ice box lid shut, and Mansu puts his hands on his knees and stands.)'),
        line(N, '(그래도 십 분은 앉아 있었다.)', '(Still, they sat for ten minutes.)'),
      ], {
        end: endTalk({}),
        note: ['하실 말씀이 더 있지 않느냐고 했다가 둘 다 입을 닫았다. 그래도 십 분은 앉아 있었다.', 'I asked if they had more to say, and both of them closed up. Still, they had sat for ten minutes.'],
      }),
      lie_out: scene([
        line(TAK, '…내가? 고맙다고?', '...I did? Said thank you?'),
        line(N, '(정옥선 씨가 나를 본다. 탁만수 씨도 그 눈을 따라 나를 한참 본다.)', '(Okseon looks at me. Following her eyes, Mansu looks at me too, for a long time.)'),
        line(TAK, '…했지. 했다. 고맙다고.', '...I did. I said it. Thank you.', { act: 'look_sea' }),
      ], {
        choices: [
          opt('let_it_stand', '(아무 말도 하지 않는다.)', '(I say nothing.)', { stance: 'self', next: 'stood' }),
          opt('confess_both', '…사실은 제가 지어낸 말이었습니다.', '...The truth is, I made it up.', {
            stance: 'other', aff: { [OK]: -0.03, [TAK]: 0.04 }, next: 'both' }),
        ],
        note: ['내가 지어낸 고맙다는 말을 탁만수 씨가 바다를 보며 받아 주었다. 했다고, 고맙다고.', 'Facing the sea, Mansu took up the thank-you I had made up. He had said it, he said. Thank you.'],
      }),
      stood: scene([
        line(N, '(정옥선 씨가 얼음 상자 뚜껑을 닫는다. 귀가 붉다. 그 뒤로 십 분, 아무도 말하지 않았다.)', '(Okseon shuts the ice box lid. Her ears are red. For ten minutes after that, nobody speaks.)'),
        line(N, '(탁만수 씨가 먼저 일어서고, 정옥선 씨가 빈 의자 쪽으로 얼음 상자 하나를 반 뼘 밀어 둔다.)', "(Mansu gets up first, and Okseon pushes an ice box half a hand's width towards the empty chair.)"),
      ], {
        end: endTalk({}),
        note: ['아무 말도 하지 않았다. 정옥선 씨의 귀가 붉었다. 십 분 동안 아무도 말하지 않았다.', 'I said nothing. Okseon\'s ears were red. For ten minutes nobody spoke.'],
      }),
      both: scene([
        line(OK, '…지어낸 말을, 이 영감이 했다잖냐.', '...You made it up, and he says he said it.'),
        line(N, '(나를 노려보다가 탁만수 씨 쪽을 본다.)', '(She glares at me, then looks at Mansu.)'),
        line(OK, '그럼 한 거다.', 'Then he said it.'),
        line(N, '(정옥선 씨가 얼음 상자 뚜껑을 닫는다. 그 뒤로는 아무 말이 없었다. 십 분.)', '(Okseon shuts the ice box lid. After that, nothing more is said. Ten minutes.)'),
      ], {
        end: endTalk({}),
        note: ['지어낸 말이었다고 털어놓았다. 정옥선 씨는 이 영감이 했다고 했으니 한 거라고 했다. 그 뒤로 십 분, 아무 말이 없었다.', 'I confessed I had made it up. Okseon said if the old man says he said it, then he said it. For ten minutes after that, nothing was said.'],
      }),
      t_thanks: scene([
        line(N, '(탁만수 씨가 나를 노려본다. 그러다 바다 쪽을 본다. 한참.)', '(Mansu glares at me. Then he looks out to sea. For a long time.)'),
        line(TAK, '…고마웠다. 반찬.', '...Thank you. For the food.'),
        line(N, '(그 한마디를 하고 입을 다문다. 정옥선 씨의 얼음 집게가 허공에서 멈춘다.)', "(He says that one thing and closes his mouth. Okseon's tongs stop in midair.)"),
      ], {
        choices: [
          opt('look_away', '(못 들은 척 얼음 상자를 닦는다.)', '(I pretend not to hear and wipe down the ice box.)', { stance: 'self', next: 'unheard' }),
        ],
        note: ['그때 못 한 말이 있지 않느냐고 하자, 탁만수 씨는 한참 바다를 보다가 고마웠다고, 반찬, 하고 말했다. 정옥선 씨의 얼음 집게가 허공에서 멈췄다.', "When I asked if there wasn't something he couldn't say back then, Mansu looked out to sea a long while, then said: thank you. For the food. Okseon's tongs stopped in midair."],
      }),
      unheard: scene([
        line(N, '(정옥선 씨는 대답하지 않는다. 대신 얼음 상자 하나를 탁만수 씨 의자 쪽으로 반 뼘 밀어 둔다.)', "(Okseon doesn't answer. Instead she pushes an ice box half a hand's width towards Mansu's chair.)"),
        line(N, '(그 뒤로 십 분, 아무도 말하지 않았다.)', '(For ten minutes after that, nobody speaks.)'),
      ], {
        end: endTalk({}),
        note: ['못 들은 척 얼음 상자를 닦았다. 정옥선 씨는 대답 대신 얼음 상자 하나를 탁만수 씨 의자 쪽으로 밀어 두었다.', "I pretended not to hear and wiped down the ice box. Instead of answering, Okseon pushed an ice box towards Mansu's chair."],
      }),
    },
  },

  // N19-4 — 끝내는 자리(정옥선). 십 분 · 말이 거의 없었다(정본)
  {
    id: 'n19_4_done', questId: 'N19-4', at: 'complete', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(OK, '…앉았지.', '...We sat.', { act: 'look_sea' }),
        line(P, '네. 앉으셨어요.', 'Yes. You did.'),
        line(OK, '십 분. 말은 몇 마디 안 했어.', 'Ten minutes. Hardly a word said.'),
        line(OK, '그래도 앉았어.', 'Still, we sat.'),
        act(OK, 'silence'),
        line(OK, '네가 그랬지.', 'You did that.', { act: 'look_up' }),
        line(P, '저는 의자만 놨는걸요.', 'All I did was set out the chairs.'),
        line(OK, '의자 놓는 게 제일 어려운 거다.', 'Setting out the chairs is the hardest part.'),
      ], {
        choices: [
          opt('quiet', '말이 없던 그 십 분이 더 좋아 보였어요.', 'Those quiet ten minutes looked better than talk.', {
            say: ['십 분 동안 말씀이 거의 없으셨죠. 그게 더 좋아 보였어요.', 'You hardly spoke for ten minutes. It looked better that way.'],
            end: endTalk({ complete: 'quiet',
              lineKo: '…너는 눈치가 너무 좋아. 말 안 하는 십 분이 말하는 한 시간보다 낫더라. 나도 오늘 처음 알았다. …내일도 의자는 그대로 둬.',
              lineEn: "...You notice too much. Ten minutes without talking beat an hour of it. I only learned that today. ...Leave the chairs as they are tomorrow too." }),
            note: ['말이 없던 십 분이 더 좋아 보였다고 했다. 정옥선 씨는 눈치가 너무 좋다며, 내일도 의자는 그대로 두라고 했다. 그날 저녁 좌판에 얼음 상자가 하나 더 놓였다. 탁만수 씨 몫이었다.',
              "I said the quiet ten minutes looked better than talk. Okseon said I noticed too much, and told me to leave the chairs out tomorrow. That evening another ice box appeared at the stall — Mansu's."] }),
          opt('lesson', '얼음 나르는 척하며 사람 앉히는 법, 정옥선 씨한테 배운 거예요.', 'I learned from you how to seat people while pretending to haul ice.', {
            end: endTalk({ complete: 'lesson',
              lineKo: '나한테? 나는 그런 거 안 가르쳤다. 눈으로 배운 건 가르친 게 아니야, 훔친 거지. 훔친 거면 잘 써먹어라. 그것도 장사 밑천이다.',
              lineEn: "From me? I never taught you that. What you learn with your eyes isn't taught, it's stolen. If you stole it, put it to good use. That's capital for trade too." }),
            note: ['얼음 나르는 척 사람 앉히는 법을 정옥선 씨한테 배웠다고 했다. 눈으로 배운 건 훔친 거라며 웃었다. 품삯 봉투가 조금 두꺼웠다.', "I said I'd learned from Okseon how to seat people while pretending to haul ice. She laughed that what you learn by eye is stolen. The pay envelope was a little thick."] }),
          opt('pay', '중매값은 받겠습니다.', "I'll take my matchmaking fee.", {
            end: endTalk({ complete: 'pay',
              lineKo: '중매라니. …받아. 그 말 한 번만 더 하면 다음 얼음은 네가 다 날라. 중매는 무슨. 의자 두 개 놓은 거다.',
              lineEn: "Matchmaking? ...Take it. Say that one more time and you're hauling all the next ice. Matchmaking, nothing. You set out two chairs." }),
            note: ['중매값을 받겠다고 했다. 정옥선 씨는 노려보면서도 돈을 주었다. 중매는 무슨, 의자 두 개 놓은 거라고 했다.', 'I asked for a matchmaking fee. Okseon glared but paid. Matchmaking, nothing — I set out two chairs, she said.'] }),
          opt('ice_stack', '얼음 오래 가게 쌓는 법, 이번엔 제대로 배우고 싶어요.', 'I want to properly learn how to stack ice so it lasts.', {
            end: endTalk({ complete: 'ice_stack',
              lineKo: '큰 덩이는 밑에, 부순 얼음은 위에. 생선은 그 사이에 눕혀. 받침이 있으니 물은 알아서 빠진다. 뚜껑은 자주 열지 마. 이건 내가 가르친 거 맞다.',
              lineEn: "Big blocks at the bottom, crushed ice on top. Lay the fish between them. With the rests, the water drains on its own. Don't open the lid often. This one I did teach you." }),
            note: ['얼음 쌓는 법을 제대로 배우고 싶다고 했다. 정옥선 씨는 얼음 상자를 열고 손으로 칸을 나눠 보이며, 큰 덩이는 밑에 부순 얼음은 위에라고 일러 주었다.', "I asked to properly learn how to stack ice. Okseon opened the box and divided it with her hand: big blocks below, crushed ice above."] }),
        ],
        note: ['정옥선 씨는 십 분, 말은 몇 마디 안 했어도 앉았다고 했다. 내가 그랬다고, 의자 놓는 게 제일 어려운 거라고.', 'Okseon said they sat for ten minutes, hardly a word between them. I did that, she said — setting out the chairs is the hardest part.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-5 「병실 앞 복도」 — 받는 자리(탁만수). 입원은 여기서 처음 듣는다 · 「오십 년」은 끝내는 자리에서 · 이 편부터 나를 「자네」라 부른다
  // ═══════════════════════════════════════════
  {
    id: 'n19_5_offer', questId: 'N19-5', at: 'offer', npcId: TAK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(탁만수 씨가 평상에 앉아 있다. 칼은 내려놓았고, 손에 작은 받침 하나를 쥐고 있다.)', '(Mansu sits on the bench. His knife is set aside, and he holds a small rest in his hand.)'),
        line(TAK, '…병실.', '...The ward.'),
        line(P, '네? 병실이요?', 'Sorry? The ward?'),
        line(TAK, '그 사람이 들어갔다. 병원에.', "She's gone in. To the hospital.", { act: 'look_away' }),
        line(P, '정옥선 씨가요? 언제부터요?', 'Okseon has? Since when?'),
        line(TAK, '며칠 됐다. 좌판이 비었더라.', 'A few days now. The stall was empty.'),
        act(TAK, 'silence'),
        line(TAK, '이거, 세 번째다.', 'This. The third one.'),
        line(P, '들고 가시려고요?', "You're taking it to her?"),
        line(TAK, '복도까지는 갔다. 문 앞에서 돌아섰지.', 'I got as far as the corridor. Turned back at the door.'),
        line(TAK, '…들어가야 하는데.', '...I ought to go in.'),
        line(P, '(받침을 쥔 손등에 힘줄이 서 있다.)', '(The veins stand out on the hand gripping the rest.)'),
      ], {
        choices: [
          opt('open_for_you', '문은 제가 열겠습니다. 들어가시기만 하세요.', "I'll open the door. You only have to walk in.", { next: 'door' }),
          opt('ask_third', '세 번째 받침이요? 병실에도 얼음 상자가 있나요?', 'A third rest? Is there an ice box in the ward too?', { next: 'third' }),
          opt('deliver_for_you', '어려우시면, 제가 대신 전해 드릴까요?', "If it's hard for you, shall I take it in for you?", { next: 'carry' }),
          opt('does_she_know', '정옥선 씨는 탁만수 씨가 오신 걸 아세요?', 'Does Okseon know you came?', { next: 'know' }),
        ],
        note: ['탁만수 씨가 정옥선 씨가 병원에 들어갔다고 했다. 세 번째 받침을 깎아 들고 복도까지는 갔는데, 병실 문 앞에서 돌아섰다고. 들어가야 하는데, 하고 되뇌었다.',
          "Mansu told me Okseon had gone into hospital. He'd carved a third rest and got as far as the corridor, then turned back at the ward door. I ought to go in, he kept saying."],
      }),
      door: scene([
        line(TAK, '…문이 무거운 게 아니다.', "...It isn't that the door is heavy."),
        act(TAK, 'silence'),
        line(TAK, '그래. 열어 다오.', 'All right. Open it for me.'),
        line(P, '병원 복도에서 뵐게요.', "I'll see you in the hospital corridor."),
        line(TAK, '내가 들어가는지 안 들어가는지는 그때 보자. 못 들어가도 자네 탓은 아니다.', "Whether I go in or not, we'll see then. If I can't, it won't be your fault."),
      ], {
        end: endTalk({ accept: true, offer: 'open_for_you' }),
        note: ['문은 내가 열 테니 들어가시기만 하라고 했다. 탁만수 씨는 문이 무거운 게 아니라면서도, 열어 달라고 했다. 못 들어가도 내 탓은 아니라고.',
          "I said I'd open the door and he need only walk in. Mansu said it wasn't that the door was heavy — but asked me to open it. If he couldn't go in, it wouldn't be my fault."],
      }),
      third: scene([
        line(TAK, '병실에 얼음이 어디 있냐.', "Where would there be ice in a ward?"),
        line(TAK, '그냥 깎았다. 손이 할 줄 아는 게 이것뿐이라.', 'I just carved it. This is all my hands know how to do.'),
        line(N, '(받침을 뒤집어 마디를 쓸어 본다.)', '(He turns the rest over and runs his thumb along the nodes.)'),
        line(P, '…', '...'),
        line(TAK, '빈손으로 들어가는 건 더 못 하겠더라. 뭐라도 들고 있어야 손이 덜 떨려.', "Going in empty-handed, I couldn't do that either. If I'm holding something, my hands shake less."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_third' }),
        note: ['병실에도 얼음 상자가 있느냐고 물었다. 탁만수 씨는 그냥 깎았다고, 빈손으로는 더 못 들어가겠더라고 했다. 뭐라도 들고 있어야 손이 덜 떨린다고.',
          "I asked if there was an ice box in the ward. Mansu said he just carved it — he couldn't go in empty-handed. Holding something keeps his hands from shaking."],
      }),
      carry: scene([
        line(TAK, '…그럼 또 심부름이지.', "...Then it's another errand."),
        line(TAK, '이번엔 안 된다.', 'Not this time.', { act: 'shake_head' }),
        line(TAK, '두 번은 자네 손으로 보냈다. 세 번째까지 남의 손으로 보내면 나는 영영 그 복도에 서 있을 거다.', "Twice I sent it by your hands. Send the third by someone else's too, and I'll stand in that corridor forever."),
        line(P, '그럼 제가 뭘 하면 될까요?', 'Then what should I do?'),
        line(TAK, '문만 열어 다오.', 'Just open the door for me.'),
      ], {
        end: endTalk({ accept: true, offer: 'deliver_for_you' }),
        note: ['대신 전해 드리겠다고 하자, 탁만수 씨는 고개를 천천히 저었다. 두 번은 내 손으로 보냈지만 세 번째까지 그러면 영영 복도에 서 있을 거라고. 문만 열어 달라고 했다.',
          "When I offered to take it in for him, Mansu slowly shook his head. Twice he'd sent things by my hand; a third time and he'd stand in that corridor forever. Just open the door, he said."],
      }),
      know: scene([
        line(TAK, '모른다.', "She doesn't."),
        line(TAK, '알면… 모르겠다. 들어오라고 할지 나가라고 할지.', "If she did... I don't know. Whether she'd tell me to come in or get out.", { act: 'look_away' }),
        line(P, '…', '...'),
        line(TAK, '그래서 여태 서 있었던 거다. 모르는 채로 서 있는 게 들어가서 아는 것보다 쉬우니까.', "That's why I've been standing there. Standing not knowing is easier than going in and finding out."),
        line(TAK, '…쉬운 쪽만 골랐지, 늘.', '...I always chose the easy way.'),
      ], {
        end: endTalk({ accept: true, offer: 'does_she_know' }),
        note: ['정옥선 씨가 오신 걸 아시느냐고 물었다. 탁만수 씨는 모른다고, 알면 들어오라 할지 나가라 할지 몰라서 여태 서 있었다고 했다. 늘 쉬운 쪽만 골랐다고.',
          "I asked whether Okseon knew he'd come. She didn't, Mansu said — and not knowing whether she'd say come in or get out was why he'd kept standing there. He always chose the easy way."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-5 「병실 앞 복도」 — 끝내는 자리(탁만수). 병실에서 십 분을 보내고 나온 뒤. 「오십 년」은 여기서부터
  // ═══════════════════════════════════════════
  {
    id: 'n19_5_done', questId: 'N19-5', at: 'complete', npcId: TAK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(병실 문이 등 뒤에서 닫힌다. 탁만수 씨가 복도 벽에 등을 기댄다. 손에 들었던 받침이 없다.)', '(The ward door closes behind him. Mansu leans his back against the corridor wall. The rest he was holding is gone.)'),
        line(TAK, '…들어갔다.', '...I went in.'),
        line(P, '네. 여기서 기다렸어요.', 'Yes. I waited out here.'),
        line(TAK, '십 분.', 'Ten minutes.'),
        act(TAK, 'silence'),
        line(TAK, '오십 년 만에.', 'After fifty years.', { act: 'look_up' }),
        line(P, '(오십 년…)', '(Fifty years...)'),
        line(TAK, '자네가 문을 열었지.', 'You opened the door.'),
      ], {
        choices: [
          opt('your_feet', '문만 열었습니다. 걸어 들어가신 건 탁만수 씨 발입니다.', 'I only opened the door. Your own feet walked you in.', {
            stance: 'giver', aff: { [TAK]: 0.05 }, next: 'feet' }),
          opt('what_inside', '안에서… 무슨 말씀을 나누셨습니까?', 'Inside... what did the two of you talk about?', {
            stance: 'mid', next: 'inside' }),
          opt('how_is_she', '정옥선 씨는 좀 어떠세요?', 'How is Okseon?', {
            stance: 'other', aff: { [OK]: 0.02 }, next: 'her' }),
          opt('fare', '병원까지 온 여비는 받겠습니다.', "I'll take my fare for coming to the hospital.", {
            stance: 'self', aff: { [TAK]: -0.03 }, end: endTalk({ complete: 'pay',
              lineKo: '…그러지. 여비는 줘야지. 여기까지 끌고 온 건 나니까. 자네 아니었으면 나는 아직 이 벽에 붙어 있었을 거다.',
              lineEn: "...I will. Your fare's owed. I'm the one who dragged you here. If not for you, I'd still be stuck to this wall." }),
            note: ['병원까지 온 여비를 받겠다고 했다. 지갑을 꺼내는 탁만수 씨의 손이 떨렸다. 안도였다.', "I asked for my fare to the hospital. Mansu's hand shook as he took out his wallet. It was relief."] }),
        ],
        note: ['병실에서 나온 탁만수 씨가 복도 벽에 기대 들어갔다고, 십 분, 오십 년 만에라고 했다. 내가 문을 열었다고.', "Coming out of the ward, Mansu leaned on the corridor wall: he'd gone in. Ten minutes. After fifty years. I had opened the door, he said."],
      }),
      feet: scene([
        act(TAK, 'laugh'),
        line(TAK, '…발이라. 발은 늘 그 문 앞까지만 갔다. 거기서 돌아섰지.', '...My feet. My feet only ever got as far as that door. They turned back there.'),
        line(TAK, '열린 문으로 들어가는 건 쉽더라. 그걸 오십 년 몰랐다.', 'Walking through an open door turned out to be easy. It took me fifty years to learn that.'),
        line(TAK, '자네는 젊을 때 알았으니 다행이다.', 'Lucky you learned it young.'),
      ], {
        choices: [
          opt('bow', '(고개를 숙여 인사한다.)', '(I bow my head.)', {
            stance: 'giver', end: endTalk({ complete: 'open_door',
              lineKo: '넷째를 깎아야겠다. 머리맡에 둘 거다. 이번엔 작게.',
              lineEn: "I'll have to carve a fourth. For beside her pillow. Small, this time." }),
            note: ['고개를 숙여 인사했다. 탁만수 씨는 품에서 대나무 한 토막을 꺼내 칼집을 내며, 머리맡에 둘 넷째를 작게 깎겠다고 했다.', 'I bowed my head. Mansu took a length of bamboo from his coat and made the first cut — a fourth, small, for beside her pillow.'] }),
          opt('help_next', '넷째 받침 깎으실 때, 이번엔 옆에서 거들겠습니다.', 'When you carve the fourth, let me help this time.', {
            stance: 'mid', aff: { [TAK]: 0.02 }, end: endTalk({ complete: 'help_carve',
              lineKo: '거들어라. 병실에 둘 건 작게 깎는다. 크게 깎는 건 힘으로 하고, 작게 깎는 건 숨으로 한다. 숨 참고 해 봐.',
              lineEn: 'Help, then. One for a sickroom gets carved small. Carving big takes strength. Carving small takes breath. Hold your breath and try.' }),
            note: ['넷째를 깎을 때 거들겠다고 했다. 탁만수 씨는 대나무를 결 따라 가르는 시늉을 해 보이며, 작게 깎는 건 숨으로 한다고 했다.', 'I offered to help carve the fourth. Mansu mimed splitting bamboo along the grain — carving small takes breath, he said.'] }),
        ],
        note: ['걸어 들어간 건 탁만수 씨 발이라고 하자, 그는 소리 없이 웃었다. 발은 늘 그 문 앞에서 돌아섰는데, 열린 문으로 들어가는 건 쉽더라고. 그걸 오십 년 몰랐다고.',
          "When I said it was his own feet that walked him in, Mansu laughed without a sound. His feet always turned back at that door, he said; walking through an open door was easy. It took him fifty years to learn."],
      }),
      inside: scene([
        line(TAK, '…말은 무슨.', '...Talk, nothing.'),
        line(TAK, '받침을 내밀었다. 그 사람이 무릎에 올려놓고 마디를 세더라.', 'I held out the rest. She laid it on her lap and counted the nodes.'),
        line(TAK, '하나, 둘. 소리 내서.', 'One, two. Out loud.'),
        line(P, '십 분 동안요?', 'For ten minutes?'),
        line(TAK, '그게 다다. 십 분 동안 마디를 셌다. …그거면 됐다.', "That's all. For ten minutes she counted nodes. ...That was enough."),
      ], {
        choices: [
          opt('long_wait', '복도에서 기다린 십 분도 길었습니다.', 'The ten minutes I waited out here were long too.', {
            stance: 'mid', aff: { [TAK]: 0.03 }, end: endTalk({ complete: 'wait',
              lineKo: '오십 년보다 길었을 거다. 이거 받아라. 첫 받침 깎고 남은 마디다. 버리지 말고 둬라. 처음이 남아 있어야 끝을 안다.',
              lineEn: "Longer than fifty years, I'd think. Take this. A length left over from the first rest. Don't throw it away. You need what's left of the beginning to know the end." }),
            note: ['복도에서 기다린 십 분도 길었다고 했다. 탁만수 씨는 오십 년보다 길었을 거라며, 품삯 대신 첫 받침 깎고 남은 대나무 한 마디를 내밀었다.', 'I said the ten minutes in the corridor had been long too. Longer than fifty years, Mansu said, and instead of a wage he gave me a length of bamboo left from the first rest.'] }),
          opt('too_long', '마디만 세시기엔 오십 년이 너무 길지 않습니까.', "Isn't fifty years too long to spend just counting nodes?", {
            stance: 'other', aff: { [TAK]: -0.04 }, end: endTalk({ complete: 'pay',
              lineKo: '…긴 줄은 내가 안다. 자네가 셀 일은 아니다. 여비다. 받아라. 오늘은 여기까지.',
              lineEn: "...I know how long it was. It isn't yours to count. Your fare. Take it. That's enough for today." }),
            note: ['마디만 세기엔 오십 년이 너무 길지 않느냐고 했다가, 긴 줄은 자기가 안다는 대답을 들었다. 탁만수 씨는 여비를 쥐여 주고 오늘은 여기까지라고 했다.', "I asked if fifty years wasn't too long to just count nodes, and was told he knew how long it was. Mansu pressed my fare on me and said that was enough for today."] }),
          opt('said_it', '그때 못 하신 말씀은, 하셨습니까?', "Those words you couldn't say back then. Did you say them?", {
            stance: 'giver', aff: { [TAK]: 0.04 }, requires: { flag: 'choice.n19_thanks_owned' }, end: endTalk({ complete: 'open_door',
              lineKo: '…했다. 고마웠다고. 이번엔 얼굴 보고. 자네가 지어낸 말, 이제 다 내 말이다.',
              lineEn: "...I did. Said thank you. Looking at her, this time. Those words you made up. They're all mine now." }),
            note: ['그때 못 한 말은 했느냐고 물었다. 탁만수 씨는 한참 있다가, 했다고, 이번엔 얼굴 보고 고마웠다고 했다고 했다. 내가 지어낸 말이 이제 다 자기 말이라고.', "I asked whether he'd said the words he couldn't before. After a long while, Mansu said he had — thank you, looking at her this time. The words I made up were all his now."] }),
        ],
        note: ['안에서 무슨 말을 나눴느냐고 묻자, 탁만수 씨는 말은 없었다고 했다. 받침을 내밀었더니 그 사람이 무릎에 올려놓고 십 분 동안 소리 내어 마디를 셌다고.', 'When I asked what they talked about, Mansu said there was no talk. He held out the rest, and she laid it on her lap and counted the nodes aloud for ten minutes.'],
      }),
      her: scene([
        line(TAK, '…모른다. 의사 말은 귀에 안 들어오더라.', "...I don't know. What the doctor says doesn't go into my ears."),
        line(TAK, '얼굴이 작아졌더라. 좌판에서 보던 얼굴보다.', "Her face had got smaller. Smaller than the face I'd see at the stall."),
        act(TAK, 'silence'),
        line(TAK, '그래도 웃었다. 받침을 보고.', 'Still, she smiled. At the rest.'),
        line(TAK, '그 사람 웃는 걸 오랜만에 봤다.', "It's been a long time since I saw her smile."),
      ], {
        choices: [
          opt('smiled_enough', '웃으셨으면 됐습니다.', "If she smiled, that's what matters.", {
            stance: 'giver', aff: { [TAK]: 0.02 }, end: endTalk({ complete: 'wait',
              lineKo: '…그래. 웃었으면 됐다. 이거 받아라. 첫 받침 깎고 남은 거다. 품삯 대신이다. 버리지 말고 둬라.',
              lineEn: "...Right. If she smiled, that's enough. Take this. What was left from cutting the first rest. In place of a wage. Don't throw it away." }),
            note: ['웃으셨으면 됐다고 했다. 탁만수 씨는 벽에서 등을 떼고, 첫 받침 깎고 남은 대나무 한 마디를 품삯 대신 내 손에 쥐여 주었다.', "I said if she smiled, that was what mattered. Mansu pushed off the wall and pressed a length of bamboo left from the first rest into my hand, in place of a wage."] }),
          opt('i_told_her', '병원 가 보시라고 했던 게 저였습니다. 손이 느려지셨을 때요.', 'I was the one who told her to see a doctor. Back when her hands slowed down.', {
            stance: 'other', aff: { [TAK]: 0.03, [OK]: 0.02 }, requires: { flag: 'choice.m2_okseon_worry' }, end: endTalk({ complete: 'open_door',
              lineKo: '…자네가 그랬나. 그 사람이 병원에 제 발로 올 사람이 아닌데. 자네 말은 들었구나. 넷째를 깎아야겠다. 머리맡에 둘 거다.',
              lineEn: "...That was you? She's not one to walk into a hospital on her own feet. She listened to you, then. I'll have to carve a fourth. For beside her pillow." }),
            note: ['정옥선 씨에게 병원에 가 보시라고 했던 게 나였다고 했다. 탁만수 씨는 나를 오래 보더니, 제 발로 병원에 올 사람이 아닌데 내 말은 들었구나 했다.', "I told him I was the one who'd urged Okseon to see a doctor. Mansu looked at me a long time — she's not one to walk into a hospital on her own, he said, but she listened to me."] }),
        ],
        note: ['정옥선 씨는 어떠냐고 묻자, 탁만수 씨는 의사 말은 귀에 안 들어왔다고 했다. 얼굴이 작아졌지만 받침을 보고 웃더라고, 그 사람 웃는 걸 오랜만에 봤다고.', "When I asked how Okseon was, Mansu said the doctor's words didn't go in. Her face had got smaller, but she smiled at the rest — he hadn't seen her smile in a long time."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-6 「손을 잡는 데 오십 년」 — 받는 자리(정옥선). 요양 뒤 휠체어 — 사진 속 천막 이야기는 꺼내지 않는다
  // ═══════════════════════════════════════════
  {
    id: 'n19_6_offer', questId: 'N19-6', at: 'offer', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(정옥선 씨가 휠체어에 앉아 좌판 앞에 나와 있다. 대나무 받침 셋이 나란히 놓여 있다.)', '(Okseon sits in a wheelchair in front of the stall. Three bamboo rests lie in a row.)'),
        line(OK, '…좌판에 나왔다.', "...I've come out to the stall.", { act: 'look_up' }),
        line(P, '정옥선 씨! 나오셨네요.', "Okseon! You're out."),
        line(OK, '호들갑 떨지 마라. 바퀴 달린 의자에 앉았을 뿐이다.', "Don't make a fuss. I'm only sitting in a chair with wheels."),
        line(OK, '탁 씨가 온다더라.', "Tak's coming, I hear."),
        line(P, '여기로요?', 'Here?'),
        line(OK, '온다더라.', 'So I hear.', { act: 'look_away' }),
        act(OK, 'silence'),
        line(OK, '자리 좀. 아니다.', 'A place. No.'),
        line(OK, '…자리 좀 만들어 줘.', '...Make us a place to sit.'),
        line(P, '두 분 앉으실 자리요?', 'A place for the two of you?'),
        line(OK, '그리고 회 두 접시. 둘이 앉아서 뭐라도 집어 먹게.', 'And two plates of raw fish. So the two of us have something to pick at.'),
        line(P, '(두 분 몫으로 두 접시구나.)', '(Two plates — one for each of them.)'),
      ], {
        choices: [
          opt('make_seats', '의자 둘, 얼음 상자 사이에 놓을게요.', "Two chairs, between the ice boxes. I'll set them out.", {
            end: endTalk({ accept: true, offer: 'make_seats',
              lineKo: '…그래, 거기. 바람이 덜 드는 데다. 받침 셋도 보이게 해 둬. 그 사람이 앉아서 그걸 봐야지. 자기가 깎은 건 자기가 봐야 해.',
              lineEn: "...Yes, there. It's out of the wind. Keep the three rests in view, too. He ought to sit and see them. A man should see what he carved." }),
            note: ['의자 둘을 얼음 상자 사이에 놓겠다고 했다. 정옥선 씨는 휠체어 바퀴를 밀어 자리를 가늠하며, 받침 셋이 보이게 해 두라고 했다. 자기가 깎은 건 자기가 봐야 한다고.',
              "I said I'd put two chairs between the ice boxes. Okseon wheeled herself to judge the spot and asked me to keep the three rests in view — a man should see what he carved."] }),
          opt('ask_health', '휠체어로 좌판까지 나오셔도 괜찮으세요?', 'Is it all right for you to come out to the stall in a wheelchair?', { next: 'health' }),
          opt('who_said', '탁만수 씨가 오신다고 하셨어요? 직접요?', 'Mansu said he was coming? Himself?', { next: 'who' }),
          opt('chair_job', '의자 놓는 것도 이제 제 일이 다 됐네요.', 'Setting out chairs has become my job by now.', { next: 'job' }),
        ],
        note: ['요양을 마친 정옥선 씨가 휠체어로 좌판에 나왔다. 탁 씨가 온다며 자리를 좀 만들어 달라고, 둘이 집어 먹게 회 두 접시를 떠 달라고 했다.',
          "Done with her recovery, Okseon came out to the stall in a wheelchair. Tak was coming, she said — would I make them a place to sit, and two plates of raw fish to pick at."],
      }),
      health: scene([
        line(OK, '요양 끝났다. 앉아 있는 건 된다더라.', "My recovery's done. They say sitting is fine."),
        line(OK, '병실에 앉으나 좌판에 앉으나 앉는 건 같아.', "Sitting in a ward or sitting at a stall, it's all sitting."),
        line(P, '그래도요.', 'Still.'),
        line(N, '(좌판 냄새를 깊이 들이마신다.)', '(She breathes in the smell of the stall, deeply.)'),
        line(OK, '그런데 냄새가 다르다. 여기가 낫지. 얼음 냄새, 바다 냄새.', "But the smell is different. This is better. Ice, and the sea."),
        line(OK, '사람은 냄새 나는 데서 살아야 한다.', 'People ought to live where things smell of something.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_health' }),
        note: ['휠체어로 나와도 괜찮으냐고 물었다. 정옥선 씨는 앉아 있는 건 된다며, 병실보다 얼음 냄새 바다 냄새 나는 여기가 낫다고 했다.', "I asked if it was all right to be out in a wheelchair. Sitting is fine, Okseon said — and this place, smelling of ice and sea, beats a ward."],
      }),
      who: scene([
        line(OK, '…온다더라. 누가 전했는지는 묻지 마라.', "...He's coming, I hear. Don't ask who passed it on."),
        line(OK, '이 좌판엔 말이 바람보다 빨리 돈다.', 'Words travel faster than the wind round these stalls.'),
        line(P, '…', '...'),
        line(N, '(팔걸이를 손끝으로 두드린다.)', '(She taps the armrest with her fingertips.)'),
        line(OK, '온다고 했으면 오는 사람이다. 오십 년을 안 오다가도, 온다고 하면 와.', "If he said he's coming, he's coming. He can stay away fifty years, but if he says he'll come, he comes."),
        line(OK, '그러니 자리부터 만들어.', 'So make the place first.'),
      ], {
        end: endTalk({ accept: true, offer: 'who_said' }),
        note: ['탁만수 씨가 직접 온다고 했느냐고 물었다. 정옥선 씨는 누가 전했는지는 묻지 말라며, 온다고 했으면 오는 사람이라고 했다. 오십 년을 안 오다가도.',
          "I asked whether Mansu had said so himself. Don't ask who passed it on, Okseon said — if he says he's coming, he comes. Even after fifty years of not coming."],
      }),
      job: scene([
        line(OK, '…일이라니. 늙은이 둘 의자 놓는 게 무슨 일이냐.', "...Job? What sort of job is setting out chairs for two old people?"),
        line(N, '(나를 노려보다가 만다.)', '(She starts to glare at me, then gives up.)'),
        line(P, '세 번째잖아요.', "It's the third time."),
        line(OK, '그래도 네가 놓아라. 내가 놓으면 티 난다.', "Still, you set them out. If I do it, it shows."),
        line(OK, '네가 놓으면 그냥 좌판 정리한 거지.', "If you do it, it's just tidying the stall."),
      ], {
        end: endTalk({ accept: true, offer: 'chair_job' }),
        note: ['의자 놓는 게 이제 내 일이 다 됐다고 농을 했다. 정옥선 씨는 노려보다 말고, 그래도 내가 놓으라고 했다. 자기가 놓으면 티가 난다고.', "I joked that setting out chairs had become my job. Okseon started to glare and gave up — I should still do it, she said. If she did, it would show."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-6 「손을 잡는 데 오십 년」 — 끝내는 자리(정옥선) · 결말은 하나(정본 `n19_seat`)
  // ═══════════════════════════════════════════
  {
    id: 'n19_6_done', questId: 'N19-6', at: 'complete', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(N, '(정옥선 씨가 휠체어 팔걸이에 손을 얹은 채 바다를 본다. 옆 의자에 탁만수 씨가 앉아 있다. 받침 셋이 나란히 놓여 있다.)', '(Her hand resting on the arm of the wheelchair, Okseon looks out to sea. Mansu sits in the chair beside her. Three rests lie in a row.)'),
        line(OK, '…앉았다. 둘이.', '...We sat. The two of us.', { act: 'look_sea' }),
        line(P, '회 두 접시도 다 비우셨네요.', 'And you finished both plates of fish.'),
        line(OK, '저 영감이 더 먹었다.', 'The old man ate more.'),
        act(OK, 'silence'),
        line(OK, '손 잡았지.', 'We held hands.'),
        line(OK, '봤냐. 아니, 못 본 척했지. 그치?', 'Did you see? No. You pretended not to. Right?'),
      ], {
        choices: [
          opt('saw_nothing', '아무것도 못 봤습니다. 얼음만 보고 있었습니다.', "I didn't see a thing. I was watching the ice.", {
            stance: 'giver', aff: { [OK]: 0.04 }, next: 'good_kid' }),
          opt('saw_it', '봤습니다. 두 분 손 잡으시는 거.', 'I saw. The two of you holding hands.', {
            stance: 'other', aff: { [OK]: -0.02, [TAK]: 0.03 }, next: 'saw' }),
          opt('fifty_years', '오십 년 걸리셨네요.', 'It took you fifty years.', {
            stance: 'mid', aff: { [OK]: -0.03, [TAK]: -0.03 }, next: 'fifty' }),
          opt('fee', '중매값은 두둑이 받아야겠습니다.', "I'd better be paid well for the matchmaking.", {
            stance: 'self', aff: { [OK]: -0.02 }, end: endTalk({ complete: 'pay', ending: 'n19_seat',
              lineKo: '중매… 그래, 받아. 오십 년 치. 봉투 말고 이거다. 좌판 서랍 열쇠. 서랍 열쇠는 아무한테나 안 준다. 돈은 쓰면 없어져도 서랍은 남아.',
              lineEn: "Matchmaking... fine, take it. Fifty years' worth. Not an envelope — this. The key to the stall drawer. I don't give the drawer key to just anyone. Money's gone once it's spent. The drawer stays." }),
            note: ['중매값을 두둑이 받아야겠다고 했다. 정옥선 씨는 오십 년 치라며 봉투 대신 좌판 서랍 열쇠를 내 손바닥에 올려놓았다.', "I said I'd better be paid well for the matchmaking. Okseon said fifty years' worth, and set the key to the stall drawer on my palm instead of an envelope."] }),
        ],
        note: ['두 사람이 회 두 접시를 비우고 나란히 앉았다. 정옥선 씨는 바다를 본 채 손을 잡았다고, 못 본 척했지, 하고 물었다.', "The two of them emptied two plates of fish and sat side by side. Still facing the sea, Okseon said they had held hands — and asked if I'd pretended not to see."],
      }),
      good_kid: scene([
        line(OK, '…착한 애다. 얼음만 봤구나. 그래야지.', "...Good kid. You only saw the ice. That's right."),
        line(N, '(탁만수 씨가 헛기침을 한다. 정옥선 씨는 그쪽은 보지 않고 말을 잇는다.)', "(Mansu clears his throat. Okseon goes on without looking his way.)"),
        line(OK, '너한테 줄 게 있다. 받기 싫다고는 하지 마라.', "I've something to give you. Don't tell me you won't take it."),
      ], {
        choices: [
          opt('take_it', '(두 손으로 받는다.)', '(I take it with both hands.)', {
            stance: 'giver', end: endTalk({ complete: 'pretend', ending: 'n19_seat',
              lineKo: '이거, 만복상회 열쇠다. 좌판, 이제 네 거다. …아니. 둘이 앉을 자리만 남기고.',
              lineEn: "This is the Manbok Store key. The stall's yours now. ...No. Except for a place for two to sit." }),
            note: ['두 손으로 받았다. 만복상회 열쇠 꾸러미였다. 좌판이 이제 내 거라고, 아니, 둘이 앉을 자리만 남기고라고 했다.', 'I took it with both hands. It was the Manbok Store keys. The stall was mine now, she said — no, except for a place for two to sit.'] }),
          opt('teach_again', '그보다, 좌판 일을 정옥선 씨 말로 한 번 더 듣고 싶습니다.', "Rather than that, I'd like to hear how to run the stall once more, in your words.", {
            stance: 'mid', end: endTalk({ complete: 'stall_words', ending: 'n19_seat',
              lineKo: '말로? 그래, 손은 이제 네 거니까. 얼음 먼저, 그다음 진열, 값은 마지막. 처음에 가르친 그대로다. 그 순서만 안 잊으면 이 좌판은 안 망해.',
              lineEn: "In words? All right. The hands are yours now. Ice first, then the display, price last. Exactly what I taught you at the start. Don't forget that order and this stall won't go under." }),
            note: ['좌판 일을 한 번 더 말로 듣고 싶다고 했다. 정옥선 씨는 손가락을 하나씩 접으며 얼음 먼저, 그다음 진열, 값은 마지막이라고 일러 주었다.', 'I asked to hear how to run the stall once more, in her words. Okseon folded down a finger for each: ice first, then display, price last.'] }),
        ],
        note: ['얼음만 보고 있었다고 하자, 정옥선 씨는 입꼬리만 올려 웃으며 착한 애라고 했다. 줄 게 있으니 받기 싫다고는 하지 말라고.', 'When I said I had only watched the ice, Okseon smiled at the corners of her mouth — good kid. She had something to give me, and I wasn\'t to refuse.'],
      }),
      saw: scene([
        line(OK, '…봤어?', '...You saw?', { act: 'look_up' }),
        act(OK, 'laugh'),
        line(OK, '그래, 봐라. 봤으면 봤지. 숨길 나이도 지났다.', "Fine, look. If you saw, you saw. We're past the age for hiding."),
        line(N, '(탁만수 씨도 웃는다. 소리 없이, 어깨만.)', '(Mansu laughs too, without a sound, only his shoulders.)'),
        line(OK, '…그래도 동네방네 떠들지는 마라. 저 영감 얼굴 빨개지는 거 못 본다.', "...Still, don't go telling the whole harbour. I can't bear watching that old man's face go red."),
      ], {
        choices: [
          opt('wont_tell', '아무한테도 말 안 하겠습니다.', "I won't tell a soul.", {
            stance: 'giver', aff: { [OK]: 0.03 }, end: endTalk({ complete: 'saw', ending: 'n19_seat',
              lineKo: '그래. 너만 알아.',
              lineEn: 'Good. Just you.' }),
            note: ['아무한테도 말 안 하겠다고 했다. 정옥선 씨는 너만 알라며, 휠체어를 조금 돌려 탁만수 씨 쪽으로 반 뼘 다가앉았다.', "I promised not to tell a soul. Just you, Okseon said, and turned her wheelchair to edge half a hand's width closer to Mansu."] }),
          opt('tell_saebyeok', '탁새벽 씨한테는 말해도 되죠?', 'I can tell Saebyeok, though?', {
            stance: 'other', aff: { [TAK]: -0.03, [SAE]: 0.02 }, end: endTalk({ complete: 'saw', ending: 'n19_seat',
              lineKo: '…그 애는 벌써 알 거다. 제 할아버지 대 깎는 소리만 들어도 안다더라.',
              lineEn: "...That child knows already. He says he can tell from the sound of his grandfather's carving." }),
            note: ['새벽이한테는 말해도 되느냐고 했다. 탁만수 씨가 헛기침을 크게 했고, 정옥선 씨는 그 애는 벌써 알 거라고 했다.', 'I asked whether I could tell Saebyeok. Mansu cleared his throat loudly, and Okseon said the boy already knew.'] }),
        ],
        note: ['봤다고 하자 정옥선 씨는 얼굴이 붉어지더니 웃음을 터뜨렸다. 숨길 나이도 지났다고, 그래도 동네방네 떠들지는 말라고.', "When I said I'd seen, Okseon flushed, then burst out laughing. They were past the age for hiding, she said — but don't tell the whole harbour."],
      }),
      fifty: scene([
        line(TAK, '…세지 마라.', "...Don't count."),
        line(TAK, '세는 건 그만두는 사람이나 하는 거다.', 'Counting is for people who are stopping.'),
        line(N, '(탁만수 씨는 정옥선 씨 쪽은 보지 않는다. 대신 받침 셋을 차례로 본다.)', "(Mansu doesn't look Okseon's way. Instead he looks at the three rests, one by one.)"),
        line(TAK, '오래 걸린 건 안다. 그러니 이제부터는 안 센다.', "I know it took long. So from now on, I don't count."),
      ], {
        choices: [
          opt('no_more_count', '그럼 저도 이제 안 세겠습니다.', "Then I won't count either.", {
            stance: 'mid', aff: { [TAK]: 0.02, [OK]: 0.02 }, next: 'counted' }),
          opt('look_at_ice', '(못 들은 척 얼음만 본다.)', '(I pretend not to hear and look at the ice.)', {
            stance: 'giver', end: endTalk({ complete: 'pretend', ending: 'n19_seat',
              lineKo: '…착한 애다. 얼음만 봤지. 이거, 만복상회 열쇠다. 좌판, 이제 네 거다. 둘이 앉을 자리만 남기고.',
              lineEn: "...Good kid. You only saw the ice. This is the Manbok Store key. The stall's yours now. Except for a place for two to sit." }),
            note: ['못 들은 척 얼음만 보았다. 정옥선 씨가 웃으며 만복상회 열쇠 꾸러미를 내 손에 쥐여 주었다. 둘이 앉을 자리만 남기고.', 'I pretended not to hear and looked at the ice. Okseon smiled and closed my hand around the Manbok Store keys — except for a place for two to sit.'] }),
        ],
        note: ['오십 년 걸렸다고 하자, 탁만수 씨가 세지 말라고 했다. 세는 건 그만두는 사람이나 하는 거라고, 이제부터는 안 센다고.', "When I said it had taken fifty years, Mansu told me not to count. Counting is for people who are stopping — from now on, he doesn't count."],
      }),
      counted: scene([
        line(OK, '저 영감 말 듣지 마라.', "Don't listen to the old man."),
        act(OK, 'laugh'),
        line(OK, '하루도 안 빼고 센 사람이다.', "He's counted every single day of it."),
        line(N, '(탁만수 씨의 귀가 붉어진다. 팔걸이 위에서 두 손이 다시 겹친다.)', "(Mansu's ears go red. On the armrest, their two hands meet again.)"),
      ], {
        end: endTalk({ complete: 'saw', ending: 'n19_seat' }),
        note: ['나도 이제 안 세겠다고 했다. 정옥선 씨는 저 영감은 하루도 안 빼고 센 사람이라며 웃음을 터뜨렸다. 팔걸이 위에서 두 손이 다시 겹쳤다.', "I said I wouldn't count either. Okseon burst out laughing — the old man had counted every single day. On the armrest, their hands met again."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-7 「귀퉁이 바구니」 — 받는 자리(정옥선). 이야기 순서로는 둘째 편(「얼음과 대나무」 다음)
  //  텃밭 입문 — 작물 이름을 대지 않는다(받는 것은 철이 정한다). 「첫물」은 다음 편 말이라 꺼내지 않는다
  // ═══════════════════════════════════════════
  {
    id: 'n19_7_offer', questId: 'N19-7', at: 'offer', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(OK, '이 바구니 봤지?', 'You see this basket?'),
        line(P, '귀퉁이에 늘 있는 거요? 단골분들 봉지에 한 줌씩 얹어 주시던데요.', "The one that's always in the corner? You put a handful in your regulars' bags."),
        line(OK, '우리 집 앞 밭에서 온 거다. 파는 거 아니야.', "It comes from the field in front of my house. It's not for sale."),
        line(P, '직접 키우신 거예요?', 'You grew it yourself?'),
        line(OK, '철마다 남는 게 있어서 그래.', "There's always some left over, every season."),
        line(OK, '너, 집에 마당 있다며.', "You've got a yard at your place, I hear."),
        line(P, '네… 풀만 무성한 마당이요.', 'Yes... a yard full of weeds.'),
        line(OK, '남는 거 줄 테니 두 칸만 심어 봐.', "I'll give you some of what's left. Plant two plots."),
        line(P, '제가요? 밭은 해 본 적이 없는데요.', "Me? I've never worked a field."),
        line(OK, '사 먹는 것만 먹고는 바다 일 오래 못 한다.', "Living only on what you buy, you won't last long at sea work."),
        line(OK, '흙만 담아 주면 집 안 선반에서도 자라.', "Give it some soil and it'll even grow on a shelf indoors."),
        line(P, '(바다에서 건지는 것 말고, 땅에서 기다려 얻는 것도 있구나.)', "(Not just what you pull from the sea — some things you wait for from the land.)"),
      ], {
        choices: [
          opt('plant_two', '해 본 적은 없지만, 두 칸 심어 볼게요.', "I've never done it, but I'll plant two plots.", {
            end: endTalk({ accept: true, offer: 'plant_two',
              lineKo: '해 본 사람이 어디 있냐. 처음엔 다 흙 만지는 손이 서툴러. 흙만 덮어 줘도 반은 한 거다. 나머지 반은 기다리는 거고. 기다리는 건 바다에서 배웠지?',
              lineEn: "Who's ever done it before they did it? Everyone's clumsy with soil at first. Just covering it over is half the job. The other half is waiting. You learned waiting at sea, didn't you?" }),
            note: ['해 본 적은 없지만 두 칸 심어 보겠다고 했다. 정옥선 씨는 바구니에서 남는 걸 골라 봉지에 담아 주며, 흙만 덮어도 반은 한 거고 나머지 반은 기다리는 거라고 했다.',
              "I said I'd never done it but would plant two plots. Okseon picked out what was spare into a bag — covering it with soil is half the job, she said, and the other half is waiting."] }),
          opt('ask_yard', '마당이 풀밭인데요. 거기에 심어도 자라요?', "My yard's all weeds. Will anything grow there?", { next: 'yard' }),
          opt('ask_what', '철마다 남는 거라니, 지금은 뭐가 남았어요?', 'Left over each season — what is there now?', { next: 'what' }),
          opt('no_time', '바다 일 하면서 밭까지 돌볼 시간이 될까요?', "Will I have time to tend a field on top of the sea work?", { next: 'time' }),
        ],
        note: ['정옥선 씨 좌판 귀퉁이의 작은 바구니는 집 앞 밭에서 남은 것이라고 했다. 내 마당 얘기를 듣고는, 남는 걸 줄 테니 두 칸만 심어 보라고 했다. 마당이 아니면 집 안 선반에서도 자란다고.',
          "Okseon said the little basket at the corner of her stall holds what's left over from the field by her house. Hearing I had a yard, she offered me some to plant two plots — or even on an indoor shelf."],
      }),
      yard: scene([
        line(OK, '풀이 자라는 땅이면 뭐든 자란다. 풀 무성한 건 흙이 살아 있다는 뜻이야.', 'Ground that grows weeds grows anything. Thick weeds mean the soil is alive.'),
        line(P, '그 풀은 어떻게 해요?', 'What do I do about the weeds?'),
        line(N, '(손가락으로 흙 뒤집는 시늉을 한다.)', '(She mimes turning soil over with her fingers.)'),
        line(OK, '풀부터 뽑고 두 칸만 뒤집어. 다 하려다 지친다.', "Pull the weeds first and turn over just two plots. Try to do it all and you'll wear yourself out."),
        line(OK, '마당에 밭이 없으면 사이소에서 일구는 걸 판다더라.', "If there's no plot in the yard, they say Saiso sells things to make one."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_yard' }),
        note: ['풀밭 마당에도 자라느냐고 묻자, 정옥선 씨는 풀 무성한 건 흙이 살아 있다는 뜻이라고 했다. 풀부터 뽑고 두 칸만 뒤집으라고, 밭이 없으면 사이소에서 일구는 걸 판다고.',
          "When I asked if anything would grow in a weedy yard, Okseon said thick weeds mean living soil. Pull them, turn over just two plots — and if there's no plot, Saiso sells what you need."],
      }),
      what: scene([
        line(OK, '그건 철이 정하지. 봄이면 봄 것, 가을이면 가을 것.', 'The season decides that. Spring things in spring, autumn things in autumn.'),
        line(OK, '지금 밭에서 남는 걸 그대로 넣었다.', "I put in exactly what's spare in the field right now."),
        line(P, '이름이라도 알려 주시면…', 'If you could at least tell me what they are...'),
        line(N, '(봉지 입구를 접어 내 손에 쥐여 준다.)', '(She folds the top of the bag over and presses it into my hand.)'),
        line(OK, '열어 보면 안다. 이름 몰라도 심으면 자라. 자라면 그때 이름 불러 주면 돼.', "Open it and you'll see. It grows whether you know its name or not. Once it grows, call it by name then."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_what' }),
        note: ['지금은 뭐가 남았느냐고 묻자, 정옥선 씨는 그건 철이 정한다고 했다. 이름 몰라도 심으면 자라니, 자라면 그때 이름 불러 주라고.', "When I asked what was spare right now, Okseon said the season decides. It grows whether I know its name or not — call it by name once it's grown."],
      }),
      time: scene([
        line(OK, '된다. 바다는 물때가 정하고 밭은 철이 정해.', 'You will. The tide decides the sea, and the season decides the field.'),
        line(OK, '둘 다 기다리는 일이라 같이 할 수 있어.', "Both are waiting work, so you can do them together."),
        line(P, '정말 그럴까요?', 'Do you really think so?'),
        line(N, '(바구니를 내 쪽으로 툭 민다.)', '(She nudges the basket my way.)'),
        line(OK, '두 칸이다. 두 칸에 하루 다 안 써. 물때 기다리는 동안 풀 한 줌 뽑으면 그게 밭일이다.', "Two plots. Two plots won't take your whole day. Pull a handful of weeds while you wait for the tide, and that's field work."),
      ], {
        end: endTalk({ accept: true, offer: 'no_time' }),
        note: ['바다 일 하면서 밭까지 돌볼 수 있을지 걱정했다. 정옥선 씨는 바다는 물때가, 밭은 철이 정하니 둘 다 기다리는 일이라고 했다. 물때 기다리며 풀 한 줌 뽑으면 그게 밭일이라고.',
          "I worried I wouldn't have time for a field and the sea. Okseon said the tide rules one and the season the other — both are waiting work. Pull a handful of weeds while you wait for the tide, and that's farming."],
      }),
    },
  },

  // N19-7 — 끝내는 자리(정옥선). 두 칸을 심고 알린 뒤
  {
    id: 'n19_7_done', questId: 'N19-7', at: 'complete', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(P, '정옥선 씨, 두 칸 다 심었어요.', 'Okseon, I planted both plots.'),
        line(OK, '심었다고?', 'You planted them?', { act: 'look_up' }),
        line(OK, '어디 손 좀 봐.', "Let's see your hands.", { act: 'peer' }),
        line(P, '물도 한 번 흠뻑 줬어요.', 'I gave them a good soaking, too.'),
        line(OK, '잘했다.', 'Good.', { act: 'nod' }),
        line(OK, '이제부터는 하늘이 반, 네가 반이다.', "From here on, it's half the sky and half you."),
        line(P, '하늘이 반이요?', 'Half the sky?'),
        line(OK, '물은 비가 주고 풀은 네가 뽑아.', 'The rain does the watering, and you do the weeding.'),
      ], {
        choices: [
          opt('compost', '거름은 언제 넣는 거예요?', 'When do I put in compost?', { next: 'compost' }),
          opt('pay', '품삯은 받을게요. 밭 일구는 데 돈이 좀 들어서요.', "I'll take the pay. Starting a field cost a bit.", {
            end: endTalk({ complete: 'pay',
              lineKo: '그래, 받아. 밭도 거저는 아니지. 호미 하나, 씨 한 봉도 다 돈이다. 아끼는 건 좋은데 흙에는 아끼지 마. 흙에 아낀 건 꼭 열매에서 빠진다.',
              lineEn: "Fine, take it. A field isn't free either. A hoe, a packet of seed — it's all money. Saving is good, but don't skimp on the soil. Whatever you skimp on the soil comes out of the harvest." }),
            note: ['밭 일구는 데 돈이 들어 품삯을 받겠다고 했다. 정옥선 씨는 봉투를 건네며, 아끼는 건 좋지만 흙에는 아끼지 말라고 했다. 흙에 아낀 건 열매에서 빠진다고.',
              "I took the pay, since starting a field had cost me. Okseon handed over the envelope — save where you like, she said, but never on the soil. What you skimp there comes out of the harvest."] }),
          opt('quiet', '흙 만지는 게 이렇게 마음 편한 줄 몰랐어요.', "I didn't know handling soil could be so calming.", { next: 'calm' }),
          opt('no_wage', '품삯은 됐어요. 나눠 주신 것만으로 충분해요.', "No pay, thanks. What you shared is enough.", {
            end: endTalk({ complete: 'no_wage',
              lineKo: '…남는 거 준 거다. 나눈 거 아니야. 그 말은 다 자라서 거둘 때 다시 해라. 그때도 그 소리 하면 그땐 믿어 주지. 단골들한테는 네가 밭 일군다고 말해 둔다.',
              lineEn: "...I gave you what was spare. That isn't sharing. Say that again when it's grown and you harvest it. If you still say it then, I'll believe you. I'll tell the regulars you're working a field." }),
            note: ['나눠 주신 것만으로 충분하다며 품삯을 사양했다. 정옥선 씨는 남는 거 준 거지 나눈 게 아니라면서도 봉투를 서랍에 도로 넣었다. 단골들한테 내가 밭 일군다고 말해 두겠다고 했다.',
              "I turned down the pay — what she shared was enough. Okseon said it was only spare, not sharing, but put the envelope back in the drawer. She'd tell the regulars I was working a field."] }),
        ],
        note: ['두 칸 다 심었다고 알렸다. 정옥선 씨는 내 손을 들여다보더니 잘했다고, 이제부터는 하늘이 반, 내가 반이라고 했다. 물은 비가 주고 풀은 내가 뽑으라고.',
          "I told Okseon I'd planted both plots. She looked at my hands and said well done — from here, half the sky and half me. The rain waters; I weed."],
      }),
      compost: scene([
        line(OK, '심기 전에. 흙 갈고 바로 넣어.', 'Before planting. Right after you turn the soil.'),
        line(OK, '다 큰 다음에 넣어 봐야 늦어.', "Put it in once it's grown and you're too late."),
        line(P, '이번 두 칸은 벌써 심어 버렸는데요.', "I've already planted these two plots, though."),
        act(OK, 'give', { to: P, item: 'farm_compost' }),
        line(OK, '그러니 다음 칸에 써. 창고 자루에서 세 덩이 덜었다.', "So use it on the next plot. I took three lumps from the sack in the shed."),
      ], {
        end: endTalk({ complete: 'compost' }),
        note: ['거름은 언제 넣느냐고 묻자, 심기 전에 흙 갈고 바로 넣는 거라고 했다. 정옥선 씨는 창고 자루에서 퇴비 세 덩이를 덜어 주며 다음 칸에 쓰라고 했다.',
          "When I asked about compost, Okseon said it goes in right after turning the soil, before planting. She gave me three lumps of it from the shed for my next plot."],
      }),
      calm: scene([
        line(OK, '그렇지?', "Isn't it?"),
        line(OK, '바다는 사람을 들볶고 밭은 사람을 기다려 줘.', 'The sea hounds you, and the field waits for you.'),
        act(OK, 'give', { to: P, item: 'crop_chili_green' }),
        line(OK, '이건 내 밭 풋고추다. 네 것 자랄 동안 이거나 먹어.', "These are green chillies from my field. Eat these while yours grow."),
      ], {
        end: endTalk({ complete: 'quiet' }),
        note: ['흙 만지는 게 이렇게 마음 편한 줄 몰랐다고 했다. 정옥선 씨는 바다는 사람을 들볶고 밭은 사람을 기다려 준다며, 바구니에서 풋고추 한 줌을 집어 내 봉지에 넣었다.',
          "I said I hadn't known handling soil could be so calming. The sea hounds you and the field waits for you, Okseon said, and dropped a handful of green chillies from the basket into my bag."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N19-8 「첫물」 — 받는 자리(정옥선). 이야기 순서로는 셋째 편
  // ═══════════════════════════════════════════
  {
    id: 'n19_8_offer', questId: 'N19-8', at: 'offer', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(OK, '밭은 좀 어떠냐.', "How's the field coming?"),
        line(P, '잎이 제법 났어요. 하루가 다르게 커요.', 'The leaves are coming in nicely. It grows more every day.'),
        line(OK, '물은 주고 있고?', 'And you\'re watering?'),
        line(P, '네. 물때 기다리는 동안 풀도 뽑고요.', 'Yes. And I pull weeds while I wait for the tide.'),
        line(OK, '그래.', 'Good.', { act: 'nod' }),
        line(OK, '다 자라면, 첫물은 나 맛 좀 보여 줘.', "Once it's grown, let me have a taste of the first picking."),
        line(P, '첫물이요?', 'The first picking?'),
        line(OK, '첫물은 남 주는 거야.', 'The first picking is for giving away.'),
        line(OK, '그래야 다음 물이 잘 나온다고, 우리 어머니가 그러셨다.', 'That way the next picking comes in well — so my mother used to say.', { act: 'look_away' }),
        line(P, '(처음 거둔 걸 가져와 달라는 말씀이구나.)', '(She wants me to bring her the first thing I harvest.)'),
      ], {
        choices: [
          opt('promise_first', '첫물은 정옥선 씨께 드릴게요. 제일 좋은 걸로요.', "The first picking goes to you, Okseon. The best of it.", {
            end: endTalk({ accept: true, offer: 'promise_first',
              lineKo: '제일 좋은 거 고르지 마. 처음 딴 거. 그게 첫물이다. 좋고 나쁜 건 맛보는 사람이 정해. 너는 그냥 따서 가져와. 고르다 보면 남 주기 아까워진다.',
              lineEn: "Don't pick the best. The first one you pick. That's the first picking. Whether it's good or bad is for the taster to say. You just pick it and bring it. Start choosing and you'll grudge giving it away." }),
            note: ['첫물은 제일 좋은 걸로 드리겠다고 했다. 정옥선 씨는 제일 좋은 거 말고 처음 딴 걸 가져오라고, 고르다 보면 남 주기 아까워진다고 했다. 바구니 귀퉁이를 손바닥으로 비워 두었다.',
              "I promised her the best of the first picking. Not the best, Okseon said — the first one picked. Start choosing and you grudge giving it away. She cleared a corner of the basket with her palm."] }),
          opt('ask_word', '첫물이 정확히 뭐예요? 처음 거둔 거요?', 'What exactly is the first picking? The first harvest?', { next: 'word' }),
          opt('worried_shape', '못나게 자라면 어쩌죠? 드리기 민망할 것 같아요.', "What if it grows ugly? I'd be embarrassed to give it to you.", { next: 'shape' }),
          opt('sea_is_other', '바다에선 잡은 사람이 먼저 맛보는데, 밭은 다르네요.', "At sea, whoever catches it tastes it first. The field's different.", { next: 'sea' }),
        ],
        note: ['정옥선 씨가 밭은 어떠냐고, 물은 주고 있냐고 물었다. 다 자라면 첫물은 맛 좀 보여 달라고, 첫물은 남 주는 거라고 했다. 그래야 다음 물이 잘 나온다고 어머니가 그러셨다고.',
          "Okseon asked how the field was and whether I was watering. Once it was grown, she wanted a taste of the first picking — the first picking is for giving away. Her mother said that's how the next one comes in well."],
      }),
      word: scene([
        line(OK, '그래. 밭에서 처음 거둔 거. 바다로 치면 그해 처음 잡은 고기지.', "That's right. The first thing you harvest from a field. At sea, it'd be the first fish of the year."),
        line(N, '(손가락 하나를 세워 보인다.)', '(She holds up one finger.)'),
        line(P, '그걸 남한테 먼저 주는 거고요.', 'And you give that to someone else first.'),
        line(OK, '그걸 남한테 먼저 주면 밭이 인심을 안다고 했다. 우리 어머니 말이야.', "Give that away first, and the field knows you're generous. My mother's words."),
        line(OK, '믿든 말든 나는 지금도 그렇게 해.', 'Believe it or not, I still do it.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_word' }),
        note: ['첫물이 정확히 뭐냐고 묻자, 밭에서 처음 거둔 것, 바다로 치면 그해 처음 잡은 고기라고 했다. 그걸 남한테 먼저 주면 밭이 인심을 안다고, 어머니 말이라고.',
          "When I asked what exactly the first picking was, Okseon said the first harvest from a field — at sea, the year's first fish. Give it away first and the field knows you're generous, her mother said."],
      }),
      shape: scene([
        act(OK, 'laugh'),
        line(OK, '못생긴 거 먹어도 배부르다.', 'An ugly one fills you up just the same.'),
        line(OK, '모양 보자는 거 아니야. 네 밭 흙 맛 보자는 거지.', "It's not the shape I want to see. It's the taste of your soil."),
        line(P, '그래도요.', 'Still.'),
        line(OK, '잎이 몇 장인지는 말로 하지 말고 들고 와. 말로 들으면 다 잘 큰 것 같거든. 보는 게 제일 정직해.', "Don't tell me how many leaves — bring it. Hear it in words and everything sounds well grown. Seeing is most honest."),
      ], {
        end: endTalk({ accept: true, offer: 'worried_shape' }),
        note: ['못나게 자라면 드리기 민망할 것 같다고 하자, 정옥선 씨는 웃으며 못생긴 거 먹어도 배부르다고 했다. 모양이 아니라 내 밭 흙 맛을 보자는 거라고, 말로 하지 말고 들고 오라고.',
          "When I worried it would grow ugly, Okseon laughed that an ugly one fills you up just the same. She wanted the taste of my soil, not the shape — don't describe it, bring it."],
      }),
      sea: scene([
        line(OK, '바다는 잡은 그 자리에서 먹지.', 'At sea you eat it right where you caught it.'),
        line(OK, '밭은 같이 기다린 게 많아. 하늘도 기다렸고 흙도 기다렸어.', "A field has a lot that waited with you. The sky waited, and so did the soil."),
        line(N, '(바구니를 손끝으로 두드린다.)', '(She taps the basket with her fingertips.)'),
        line(P, '그래서 처음 건 남한테 주는 거군요.', "So that's why the first one goes to someone else."),
        line(OK, '그래. 네 몫은 다음 물부터다. 다음 물은 생각보다 금방 온다.', "Right. Your share starts with the next picking. The next one comes sooner than you think."),
      ], {
        end: endTalk({ accept: true, offer: 'sea_is_other' }),
        note: ['바다에선 잡은 사람이 먼저 맛보는데 밭은 다르다고 했다. 정옥선 씨는 밭은 하늘도 흙도 같이 기다렸으니 처음 건 남 주라고 했다. 내 몫은 다음 물부터라고.',
          "I said at sea the catcher tastes first, but the field is different. Okseon said the sky and the soil waited too, so the first goes to someone else. My share starts with the next picking."],
      }),
    },
  },

  // N19-8 — 끝내는 자리(정옥선). 처음 거둔 것을 맛보인 뒤
  {
    id: 'n19_8_done', questId: 'N19-8', at: 'complete', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(P, '정옥선 씨, 이거요. 처음 거둔 거예요.', 'Okseon, here. The first thing I harvested.'),
        line(OK, '이게 네가 기른 거냐.', 'This is what you grew?', { act: 'peer' }),
        line(P, '처음 딴 거 그대로 가져왔어요. 고르지 않고요.', "I brought the first one I picked, just as it was. I didn't choose."),
        line(OK, '그래, 그거면 됐다.', "Good. That's all it takes."),
        act(OK, 'silence'),
        line(OK, '…흙 맛이 좋다.', '...Good taste of soil.'),
        line(P, '정말요?', 'Really?'),
        line(OK, '처음 치고는 잘했다. 이제 너도 밭 있는 사람이다.', "Well done, for a first try. Now you're someone with a field too."),
      ], {
        choices: [
          opt('more', '다음엔 고추를 심어 보고 싶어요.', "Next, I'd like to try growing chillies.", {
            end: endTalk({ complete: 'more',
              lineKo: '고추는 손이 많이 간다. 지주도 세워야 하고 벌레도 꼬여. 조금 더 해 보고 와. …그래도 모종은 잎이 짙고 줄기 굵은 걸로 골라라.',
              lineEn: "Chillies take a lot of work. You have to stake them, and bugs come. Get a bit more practice first. ...Still, pick seedlings with dark leaves and thick stems." }),
            note: ['다음엔 고추를 심어 보고 싶다고 했다. 정옥선 씨는 손이 많이 간다며 조금 더 해 보고 오라면서도, 고추 모종 고르는 법을 한참 일러 주었다.',
              "I said I'd like to grow chillies next. Okseon said they take a lot of work and to get more practice first — then spent a good while telling me how to choose seedlings anyway."] }),
          opt('share', '좌판 바구니에 같이 놓아 주세요.', 'Please put some in your stall basket too.', {
            end: endTalk({ complete: 'share',
              lineKo: '네 것도 같이? …그래, 놓자. 단골들이 누가 기른 거냐고 물으면 네 이름 댄다.',
              lineEn: "Yours as well? ...All right, let's put it out. If the regulars ask who grew it, I'll give them your name." }),
            note: ['좌판 바구니에 내 것도 같이 놓아 달라고 했다. 정옥선 씨는 그러자며, 단골들이 누가 기른 거냐고 물으면 내 이름을 대겠다고 했다. 바구니 한쪽에 내 몫이 생겼다.',
              "I asked her to put some of mine in the stall basket. Okseon agreed — if the regulars asked who grew it, she'd give my name. I had a corner of the basket now."] }),
          opt('pay', '품삯은 받을게요.', "I'll take the pay.", { next: 'pay' }),
          opt('back_ache', '밭일 하고 나니 허리가 뻐근해요. 요령이 있나요?', 'My back aches after the field work. Is there a trick to it?', {
            end: endTalk({ complete: 'back_ache',
              lineKo: '쪼그려 앉지 마. 한쪽 무릎을 땅에 대고 앉아. 허리는 한번 상하면 바다 일도 끝이다. 오래 할 일은 몸부터 아껴. 밭이든 바다든 오래 하는 사람이 이기는 거야.',
              lineEn: "Don't squat. Kneel on one knee. Hurt your back once and the sea work is over too. For work you mean to do long, look after your body first. Field or sea, whoever lasts longest wins." }),
            note: ['밭일 하고 허리가 뻐근하다고 했다. 정옥선 씨는 좌판 의자에서 일어나 직접 시늉해 보이며, 쪼그려 앉지 말고 한쪽 무릎을 땅에 대라고 했다.',
              "I mentioned my back ached from the field work. Okseon got up from her stall chair to show me herself — don't squat, kneel on one knee."] }),
        ],
        note: ['처음 거둔 것을 고르지 않고 그대로 가져갔다. 정옥선 씨는 한 입 맛보더니 흙 맛이 좋다고, 처음 치고는 잘했다고 했다. 이제 나도 밭 있는 사람이라고.',
          "I brought the first thing I harvested, unchosen. Okseon tasted it and said the soil tasted good — well done for a first try. Now I was someone with a field too."],
      }),
      pay: scene([
        line(OK, '그래야지.', 'Of course.'),
        act(OK, 'give', { to: P, item: 'seed_lettuce' }),
        line(P, '봉투에 씨앗도 들어 있네요.', "There's a seed packet in the envelope too."),
        line(OK, '씨는 덤이다. 받았으면 심어. 서랍에 넣어 두면 씨도 늙는다.', "The seeds are extra. If you take them, plant them. Leave seeds in a drawer and they get old too."),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '다음 철에 그걸로 또 첫물 내.',
          lineEn: 'Next season, make another first picking with them.' }),
        note: ['품삯을 받았다. 봉투 안에 씨앗 한 봉이 같이 들어 있었다. 씨는 덤이라고, 서랍에 넣어 두면 씨도 늙으니 다음 철에 또 첫물 내라고 했다.',
          "I took the pay. There was a packet of seeds in the envelope. The seeds were extra, Okseon said — seeds age in a drawer, so make another first picking next season."],
      }),
    },
  },
];
