/**
 * @file StoryTalkN01.ts
 * @description 286차 — N01-5 「해녀의 딸」 대본(주고받는 장면 · 시범). 규칙은 `StoryTalks.ts` 머리 주석 + 아래 286차 덧붙임.
 *
 * 사용자 지시(285 · 286차 원문 요지):
 *  - 「이렇게 대화하듯이 되어야 해. 너가 지금 해놓은 문맥은 혼자서 대답을 다해버리고, 강제로 내용을 주고 받는 대화 하나 없이
 *    그냥 정보를 한번에 전달하는 형태야. 그건 잘못된 대화 방법이야.」 — 주인공의 말이 장면 안에 있다(`line('player', …)`).
 *  - 받는 자리는 사용자 대본(`.agents/inputs/285_n01_5_user_script.md`)을 그대로 옮겼다. 다듬은 것은 맞춤법 · 띄어쓰기뿐이다
 *    (「제주도 전국을」 → 「전국을」 — 바람은 전국 항구를 도는 떠돌이다).
 *  - 몸짓: 「담배를 꺼내 문 상태에서, 연기를 내뿜을 때 실제로 사람이 말을 하면서 저 동작을 동시에 할 순 없잖아?」 —
 *    불붙이기 · 내뿜기 · 건네기 · 한숨 · 웃음 · 침묵은 말이 멈추는 박자(`act`), 끄덕이기 · 시선은 말과 함께(`line … { act }`).
 *  - 곁가지는 거절할 수 있다 — 거절 = 실패(`endTalk({ fail: true })`). 우호도 +0.25 · 담배 한 갑은 사용자 지정.
 *  - 대화 내용은 요약해 일지(J)에 남는다 — 장면마다 `note`(1인칭 한두 문장).
 *
 * 인물: 바람(떠돌이 조사 · 「자네」 · 「~지」 · 「~군그래」) · 부순덕(58 · 서귀포 해녀 · 허리를 다쳐 쉬는 중 · 무뚝뚝 · 제주 말씨 조금)
 *   · 강해솔(24 · 부순덕의 딸 · 처음엔 경계 · 존댓말 · 어머니 자리를 잇고 싶다).
 * 표시: choice.n01_5_wanted_dive(물속에 같이 들어가겠다고 했다) · choice.n01_5_tell_mom(어머니께 알리자고 했다) · choice.n01_5_kept_secret(아직 말하지 않기로).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, give, scene } from './StoryTalkKit.js';

const B = 'baram';
const S = 'bu_sundeok';
const H = 'kang_haesol';
const P = 'player';

export const TALKS_N01: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N01-5 「해녀의 딸」 — 받는 자리(바람) · 사용자 대본
  // ═══════════════════════════════════════════
  {
    id: 'n01_5_offer', questId: 'N01-5', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '리어카로 전국을 돌아다니다 보면, 많은 인연을 만들기도 해.', 'Going all over the country with a cart, you end up making a lot of connections.'),
        line(B, '최근 이 근처에 아는 누님이 하나 생겼는데, 얼마 전에 내가 무리한 부탁을 한 탓일까. 물질을 하다가 허리를 다쳐서, 그날 리어카에 태워 병원까지 옮겨 줬었지.',
          "Lately I've come to know a lady around here — older than me, so I call her noonim. Maybe it was because I asked too much of her the other day. She hurt her back while diving, and that day I carried her to the hospital in my cart."),
        line(B, '지금은 퇴원해서 집에서 잠깐 쉬고 있다는 소식을 들었어. 그래서 병문안 겸 과일을 좀 사 들고 누님 집 근처로 갔는데, 딸하고 싸우는 소리가 들리더라.',
          "I heard she's out of the hospital now, resting at home for a while. So I bought some fruit and went over to see her, and near the house I could hear her arguing with her daughter."),
        line(P, '…어떤 내용이었나요?', '...What were they arguing about?'),
        line(B, '누님이 다쳐서 물질을 못 하게 되니까, 생활비 대기가 어려워지고 있다는 얘기였어. 그래서 딸이 직접 나서서 물질을 하겠다고 큰소리를 치고, 누님은 그걸 말리고 있었지.',
          "With her hurt and unable to dive, they're having a hard time making ends meet. So the daughter was shouting that she'd go diving herself, and noonim was trying to stop her."),
        line(P, '아저씨는 어떻게 하셨어요?', 'What did you do?'),
        line(B, '괜히 나 때문에 다친 것도 같고 미안한 마음에, 대화에 끼어들 수는 없었지. 지금까지도 다투고 있다고 하더라.',
          "I felt it might be my fault she got hurt, and I was sorry, so I couldn't butt in. I hear they're still at it.", { act: 'look_away' }),
        line(P, '어떻게 하고 싶으신 거예요?', 'What is it you want to do?'),
        line(B, '인생을 살아 보니, 남이 쉽게 하는 일은 결코 쉬워서 하는 게 아니더라고. 평생을 물질을 했기에 그렇게 잘하고 안전할 수 있는 거지. 내 생각에도 딸은 경험이 없으니 위험할 거야.',
          "Living this long, I've learned that when someone makes a thing look easy, it's never because it is. She's dived her whole life — that's why she's so good and so safe at it. I think the daughter has no experience. It'd be dangerous.", { act: 'look_sea' }),
        line(P, '…', '...'),
        line(B, '혹시, 자네가 좀 도와줄 수 있겠나?', 'Would you be able to help, by any chance?'),
        line(P, '제가 어떻게 도와드릴 수 있을까요?', 'How could I help?'),
        line(B, '딸을 설득하는 편이 아무래도 제일 좋겠지. 수영은 할 줄 아나?', 'Talking the daughter round would be best, I think. Can you swim?'),
        line(P, '수영은…', 'Swim...'),
      ], {
        choices: [
          opt('pro', '선수급으로 잘한다', 'Like a pro', {
            say: ['선수급으로 잘하죠. 이래 봬도 어릴 때 수영을 많이 했었으니까요.', "Like a pro. I may not look it, but I swam a lot as a kid."],
            next: 'pro' }),
          opt('pool', '수영장에서만 해 봐서 잘 모르겠다', "Only in pools — I'm not sure", {
            say: ['수영장에서만 해 봤지, 사실 해수욕장 말고는 자신이 없습니다.', "I've only swum in pools. Honestly, past a beach, I'm not confident."],
            next: 'pool' }),
        ],
        note: ['바람 아저씨가 해녀 누님 이야기를 꺼냈다. 자기가 무리한 부탁을 한 탓에 누님이 물질하다 허리를 다쳤고, 생활비가 빠듯해지자 딸이 대신 물에 들어가겠다며 어머니와 다투고 있다고 했다. 아저씨는 딸을 설득해 달라며 수영을 할 줄 아느냐고 물었다.',
          "Baram told me about a haenyeo he calls noonim. Because he asked too much of her, she hurt her back diving, and now that money is tight her daughter wants to dive in her place and they keep fighting about it. He asked me to talk the daughter round, and whether I could swim."],
      }),

      // ── 1) 선수급 ──
      pro: scene([
        line(B, '그래? 그 정도면 믿음이 가는군그래.', "Oh? Well, that's reassuring."),
        act(B, 'cig_light'),
        act(B, 'cig_puff'),
        line(B, '고맙군.', "Thanks."),
        act(B, 'give', { to: P, item: 'inv_cigarette_pack' }),
        line(B, '내가 신뢰하는 남자에겐 담배 한 갑도 곧바로 줄 수 있다네.', "For a man I trust, I'd hand over a whole pack of cigarettes on the spot.",
          { f: ['내가 신뢰하는 사람에겐 담배 한 갑도 곧바로 줄 수 있다네.', "For someone I trust, I'd hand over a whole pack of cigarettes on the spot."] }),
        give(B, { items: [{ id: 'inv_cigarette_pack', qty: 1 }], affinity: { [B]: 0.25 } }),
        line(P, '…그렇게까지 말씀해 주시니… 감사합니다.', "...Coming from you... thank you.", { act: 'receive' }),
        line(B, '자네 생각엔 그럼 어떻게 도와줄 수 있겠나?', 'So how do you think you could help?'),
      ], {
        choices: [
          opt('dive_with', '물속에 들어가서 같이 해루질을 하면 되겠군요', 'I could go into the water and gather with her', {
            say: ['물속에 들어가서 같이 해루질을 하면 되겠군요.', 'I could go into the water and gather alongside her.'],
            flags: ['choice.n01_5_wanted_dive'], next: 'dive_with' }),
          opt('assist', '옆에서 따님 분을 보조해 주면 되겠군요', 'I could help her from the side', {
            say: ['옆에서 따님 분을 보조해 주면 되겠군요.', 'I could stay at her side and help her out.'],
            next: 'assist' }),
        ],
        note: ['수영은 선수급이라고 했더니, 아저씨는 담배에 불을 붙여 한 모금 길게 내뿜고는 고맙다고 했다. 신뢰하는 사람에게는 담배 한 갑도 아깝지 않다며 한 갑을 통째로 건넸다.',
          'When I said I swim like a pro, he lit a cigarette, let out a long breath of smoke and thanked me. Saying he would give a whole pack to someone he trusts, he handed me one.'],
      }),
      dive_with: scene([
        line(B, '아니야, 이 사람아. 해수욕장이 아닌 바닷속은 아무도 모르고 무서운 곳이야. 숙련된 사람도 다치니까.', "No, no, my friend. The sea past the beach is a place nobody truly knows, and it's frightening. Even skilled people get hurt.", { act: 'shake_head' }),
        line(B, '내가 수영을 물어본 이유는 물질을 도우라는 뜻이 아니야. 물가 근처에서 도와주는 건 가능하겠지.', "I didn't ask about swimming so you'd help her dive. Helping near the water's edge — that you can do."),
        line(P, '그것도 그렇군요. 생각이 짧았습니다.', "That's true. I didn't think it through."),
        line(B, '자네가 다치면 무슨 소용이겠나. 우선, 딸을 한 번 만나 보게. 내 이름을 얘기하면 될 거야.', "What good would it do if you got hurt? First, go and meet the daughter. Just mention my name."),
        line(P, '네. 우선 만나 볼게요. 살아 돌아올 수 있을진 모르겠지만…', "Right. I'll meet her first. Whether I'll come back alive, I can't say..."),
      ], {
        end: endTalk({ accept: true }),
        note: ['같이 물에 들어가겠다고 했다가 한 소리 들었다. 바닷속은 숙련된 사람도 다치는 곳이고, 물가에서 돕는 것까지라고. 아저씨 이름을 대고 딸부터 만나 보기로 했다.',
          "I said I'd go into the water with her and got told off. Even skilled people get hurt down there; helping at the edge is as far as it goes. I'll mention his name and meet the daughter first."],
      }),
      assist: scene([
        line(B, '자네는 내가 말하지 않아도 올바른 방향을 잘 알고 있군그래.', "You know the right way to go without my having to say it.", { act: 'nod' }),
        give(B, { affinity: { [B]: 0.25 } }),
        line(B, '가서 딸에게 먼저 말을 걸어 보게나.', 'Go and talk to the daughter first.'),
      ], {
        end: endTalk({ accept: true }),
        note: ['옆에서 딸을 돕겠다고 하자, 아저씨는 말하지 않아도 방향을 안다며 흡족해했다. 딸에게 먼저 말을 걸어 보라고 했다.',
          'When I said I would help the daughter from her side, he looked pleased — I knew the way without being told. He told me to go and talk to her first.'],
      }),

      // ── 2) 수영장에서만 ──
      pool: scene([
        line(B, '해수욕장이 아닌 바닷속은 아무도 모르고 무서운 곳이야. 숙련된 사람도 다치니까.', "The sea past the beach is a place nobody truly knows, and it's frightening. Even skilled people get hurt."),
        line(B, '내가 수영을 물어본 이유는 물질을 도우라는 뜻이 아니고, 물가 근처에서 도와주는 건 가능하겠지. 다만, 빠질 수도 있으니 수영은 할 줄 알아야 하지 않겠나?',
          "I didn't ask so you'd help her dive. Helping near the edge, that you can do. Still, you might fall in, so you'd want to be able to swim, wouldn't you?"),
        line(P, '그것도 그렇군요.', "That's true."),
        line(B, '어떻게 도와주고 싶은가?', 'How would you like to help?'),
      ], {
        choices: [
          opt('shore', '물가에서 캐는 게 맞는 것 같아요', 'Gathering at the edge seems right', {
            say: ['물가에서 캐는 게 맞는 것 같아요. 우선 누님의 따님을 만나 볼게요. 살아 돌아올 수 있을진 모르겠지만…', "Gathering at the edge seems right. I'll meet her daughter first. Whether I'll come back alive, I can't say..."],
            next: 'shore' }),
          opt('intrude', '그 집 일인데, 제가 끼어들어도 될까요?', "It's their family matter — should I get involved?", {
            say: ['사실, 그 집 일에 제가 끼어들어도 될까 모르겠습니다. 누님은 그렇다 치더라도, 따님 분이 저를 모르는 상태에서 거리낌 없이 반길 것 같진 않아서요.',
              "Honestly, I'm not sure I should get involved in their family's business. Noonim aside, I doubt her daughter will welcome a stranger with open arms."],
            next: 'intrude' }),
        ],
        note: ['수영장에서만 해 봤다고 하자, 아저씨는 바닷속은 숙련된 사람도 다치는 곳이라며 물질을 도우라는 게 아니라 물가에서 도우라는 뜻이라고 했다.',
          "When I said I'd only swum in pools, he said even skilled people get hurt under the sea — he meant helping at the edge, not helping her dive."],
      }),
      shore: scene([
        line(B, '우선 딸이 내 이름을 알 테니, 얘기를 잘 전달해 주게. 젊은 자네가 도와준다면 괜찮을 거야.', "The daughter knows my name, so pass the word on well. With a young one like you helping, she'll be all right."),
        line(B, '아, 물론 딸이 자네를 반길지는 모르겠으니, 알아서 호감을 잘 사야 하겠지.', "Ah, of course, I can't promise she'll welcome you. You'll have to win her over yourself."),
        line(P, '네, 알겠습니다. 다녀올게요.', "All right. I'll be off, then."),
      ], {
        end: endTalk({ accept: true }),
        note: ['물가에서 캐겠다고 했다. 아저씨는 딸이 자기 이름을 아니 얘기를 잘 전해 달라며, 반겨 줄지는 모르니 호감은 알아서 사라고 했다.',
          "I said I'd gather at the edge. He asked me to pass his word on — she knows his name — and said winning her over was up to me."],
      }),
      intrude: scene([
        line(B, '그것도 그렇겠지.', "I suppose so."),
        act(B, 'cig_light'),
        act(B, 'cig_puff'),
        line(B, '그래도 내가 누님 딸내미 생일 때 선물을 직접 주기도 했고, 서로 잘 아는 사이니, 내 이름을 잘 말하면 될 거야. 젊은 자네가 옆에서 안전하게 지켜 주면 되지 않겠는가.',
          "Still, I gave her daughter a birthday present myself once — we know each other well. Just mention my name. A young one like you keeping her safe from the side — wouldn't that do?"),
        line(P, '(갑자기 담배를 피우시네…)', '(Smoking all of a sudden...)'),
        line(B, '그래서, 도와줄 건가?', "So — will you help?"),
      ], {
        choices: [
          opt('yes', '네, 알겠습니다. 다녀올게요.', "Yes. I'll go.", { end: endTalk({ accept: true }),
            note: ['돕겠다고 했다. 아저씨 이름을 대고 딸부터 만나 보기로 했다.', "I agreed to help. I'll mention his name and meet the daughter first."] }),
          opt('no', '아무래도 힘들 것 같습니다.', "I don't think I can.", { next: 'refuse' }),
        ],
        note: ['그 집 일에 끼어들어도 되겠느냐고 했더니, 아저씨는 담배에 불을 붙여 한 모금 내뿜고는 딸 생일에 선물을 줄 만큼 아는 사이니 자기 이름을 대면 된다고 했다.',
          "When I asked whether I should get involved in their family's business, he lit a cigarette, blew out a mouthful of smoke, and said he knows the daughter well enough to have given her a birthday present — just mention his name."],
      }),
      refuse: scene([
        line(B, '…강요하는 건 아니니, 너무 부담 갖지 말게. 내 나름대로 다른 방법을 찾아볼 테니.', "...I'm not forcing you, so don't let it weigh on you. I'll find another way of my own.", { act: 'look_away' }),
        line(P, '…', '...'),
      ], {
        end: endTalk({ fail: true }),
        note: ['결국 힘들 것 같다고 거절했다. 아저씨는 강요하는 건 아니라며, 자기 나름대로 다른 방법을 찾아보겠다고 했다. 그 집 일은 거기서 내 손을 떠났다.',
          "In the end I said I couldn't. He said he wasn't forcing me, and that he'd find another way of his own. That family's matter left my hands there."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N01-5 — 첫 목표: 해솔에게 말을 건다
  // ═══════════════════════════════════════════
  {
    id: 'n01_5_haesol', questId: 'N01-5', at: 'objective', objectiveIndex: 0, npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…누구세요? 이 동네 분은 아니시죠.', "...Who are you? You're not from around here.", { act: 'look_up' }),
      ], {
        choices: [
          opt('baram', '바람 아저씨 소개로 왔어요.', 'Baram sent me.', {
            say: ['바람 아저씨 소개로 왔어요. 리어카 끌고 다니시는 분이요.', 'Baram sent me. The man with the cart.'], next: 'baram' }),
          opt('daughter', '혹시 부순덕 해녀님 따님 맞으세요?', "Are you Bu Sundeok's daughter, by any chance?", {
            say: ['혹시 부순덕 해녀님 따님 맞으세요?', "Excuse me — are you the daughter of Bu Sundeok, the haenyeo?"], next: 'daughter' }),
        ],
      }),
      baram: scene([
        line(H, '아… 바람 아저씨.', 'Ah... Baram.', { act: 'look_away' }),
        line(H, '엄마 다치던 날 병원까지 태워다 주신 분이죠. 고맙긴 한데… 그날 엄마한테 깊은 데 한 번만 더 들어가 달라고 한 것도 그 아저씨라던데요.',
          "He's the one who took Mom to the hospital the day she got hurt. I'm grateful, but... I heard he was also the one who asked her to go down deep one more time that day."),
        line(P, '…아저씨도 그 일로 많이 미안해하세요.', "...He feels terrible about it."),
        line(H, '알아요. 미안하니까 사람을 보냈겠죠.', "I know. That's why he sent someone, I guess."),
        act(H, 'sigh'),
        line(H, '그래서, 아저씨가 뭐래요? 나 말리라고 해요?', "So, what did he say? Told you to stop me?"),
      ], {
        next: 'why',
        note: ['해솔 씨는 바람 아저씨 이름을 듣고 잠깐 시선을 피했다. 어머니를 병원까지 태워다 준 사람이지만, 그날 깊은 데로 한 번 더 들어가 달라고 한 것도 그 사람이라고 했다.',
          "Haesol looked away for a moment at Baram's name. He took her mother to the hospital, but he was also the one who asked her to go down deep one more time that day."],
      }),
      daughter: scene([
        line(H, '…그런데요?', '...What of it?', { act: 'peer' }),
        line(P, '바람 아저씨가 한번 만나 보라고 하셔서요.', 'Baram asked me to come and meet you.'),
        act(H, 'laugh'),
        line(H, '아, 그 리어카 아저씨. 엄마 일로 오셨구나.', "Oh, the cart man. You're here about Mom."),
        line(H, '그래서, 아저씨가 뭐래요? 나 말리라고 해요?', "So, what did he say? Told you to stop me?"),
      ], {
        next: 'why',
        note: ['해솔 씨는 처음엔 경계했지만, 바람 아저씨 이름이 나오자 조금 누그러졌다.', "Haesol was wary at first, but softened a little at Baram's name."],
      }),
      why: scene([
        line(H, '다들 그 얘기부터 하더라고요.', "That's what everyone starts with."),
      ], {
        choices: [
          opt('not_stop', '말리러 온 건 아니에요.', "I'm not here to stop you.", {
            say: ['말리러 온 건 아니에요. 같이 방법을 찾아보러 왔어요.', "I'm not here to stop you. I came to look for a way together."],
            aff: { [H]: 0.08 }, next: 'listen' }),
          opt('mom_right', '어머니 걱정도 이해가 가요.', 'I understand why your mother worries.', {
            say: ['어머니 걱정도 이해가 가요. 바다는 위험하잖아요.', "I understand why your mother worries. The sea is dangerous."],
            aff: { [H]: -0.05, [S]: 0.03 }, next: 'mom_right' }),
          opt('hear_out', '(가만히 이야기를 기다린다)', '(Wait quietly for her to go on)', {
            aff: { [H]: 0.04 }, next: 'listen' }),
        ],
      }),
      mom_right: scene([
        line(H, '다들 그렇게 말해요. 위험하다고.', 'Everyone says that. That it\'s dangerous.', { act: 'shake_head' }),
        line(H, '그럼 뭐 먹고 살아요? 엄마 병원비에, 소라값은 떨어지고. 내가 아무것도 안 하면 누가 해요?',
          "Then how are we supposed to live? Mom's hospital bills, and the price of turban shells keeps dropping. If I don't do anything, who will?"),
        line(P, '…그러니까 같이 방법을 찾아보자는 거예요.', "...That's why I want us to find a way together."),
      ], { next: 'listen' }),
      listen: scene([
        line(H, '엄마가 허리를 다치고 나서는 물에 못 들어가요. 병원비도 나가고… 그래서 제가 들어가겠다고 했어요.',
          "Since Mom hurt her back she can't go into the water. And there are hospital bills... so I said I'd go in instead.", { act: 'look_sea' }),
        line(H, '엄마는 펄쩍 뛰었고요. 엄마 친구분이 몇 년 전에 물에서 못 나오셨대요. 그 얘기만 나오면 엄마는 아무 말도 안 해요.',
          "Mom hit the roof. A friend of hers didn't come back up from the water a few years ago. Whenever it comes up, Mom won't say a word."),
        act(H, 'silence'),
        line(P, '…그런 일이 있었군요.', "...So that happened."),
        line(H, '근데 저도 이 바다 보고 자랐어요. 숨 참는 거, 어릴 때부터 엄마 따라 해 봤고요.',
          "But I grew up looking at this sea too. Holding my breath — I've copied Mom since I was little."),
      ], {
        choices: [
          opt('edge_first', '물속 말고 물가부터 같이 해 봐요.', "Let's start at the edge together, not underwater.", {
            say: ['물속 말고, 물 빠질 때 물가부터 같이 해 보는 건 어때요? 소라나 보말이라도요.', "How about starting at the edge together when the tide's out, instead of underwater? Turban shells, top shells, whatever we find."],
            aff: { [H]: 0.05 }, next: 'edge' }),
          opt('border', '물질하고 해루질은 다른 일이잖아요.', 'Diving and shore gathering are different things.', {
            say: ['물질하고 해루질은 다른 일이잖아요. 물속은 마을이 지키는 바다고요.', "Diving and shore gathering aren't the same thing. The sea underwater is the village's to protect."],
            next: 'border' }),
          opt('her_call', '해솔 씨가 정할 일이에요.', "It's yours to decide.", {
            say: ['어느 쪽이든, 결국 해솔 씨가 정할 일이에요. 저는 옆에서 도울게요.', "Either way, in the end it's yours to decide. I'll help from your side."],
            aff: { [H]: 0.06 }, next: 'edge' }),
        ],
        note: ['어머니가 허리를 다친 뒤로 병원비가 들고 소라값은 떨어져, 해솔 씨가 대신 물에 들어가겠다고 했단다. 어머니는 몇 년 전 물에서 돌아오지 못한 친구 때문에 그 얘기만 나오면 입을 닫는다고 했다.',
          "With hospital bills and falling shell prices since her mother's injury, Haesol said she'd go in instead. Her mother goes silent whenever it comes up — a friend of hers never came back up a few years ago."],
      }),
      border: scene([
        line(H, '알아요. 마을 어장 표지 안쪽은 해녀 삼촌들 바다예요. 아무나 못 들어가요.', "I know. Inside the village markers is the haenyeo aunties' sea. Not just anyone can go in."),
        line(H, '그래서 더 들어가고 싶은 거예요. 엄마 자리잖아요.', "That's why I want in even more. It's Mom's place."),
        line(P, '그럼 그 자리에 들어가기 전에, 물가에서 먼저 손을 익혀 보는 건요?', 'Then before you take that place, how about getting your hands used to it at the edge first?'),
      ], { next: 'edge' }),
      edge: scene([
        line(H, '물가요? 갯바위에서 소라 줍고 보말 따는 거요?', 'The edge? Picking turban shells and top shells off the rocks?', { act: 'look_up' }),
        line(H, '…그걸로 돈이 돼요?', '...Is there money in that?'),
        line(P, '큰돈은 아니어도, 혼자 물에 들어가는 것보다는 나아요. 물때 보는 눈도 생기고요.', "Not much, but it's better than going into the water alone. And you learn to read the tides."),
        act(H, 'silence'),
        line(H, '…엄마도 처음엔 물가에서 시작했다고 했어요.', '...Mom said she started at the edge too.'),
        line(H, '좋아요. 물 빠질 때 갯바위로 나와요. 같이 캐요.', "All right. Come out to the rocks when the tide's out. We'll gather together."),
        line(H, '대신, 엄마한테는 아직 말하지 마세요.', "But don't tell Mom yet."),
      ], {
        choices: [
          opt('promise', '알겠어요. 대신 무리하지 않기로 약속해요.', "All right. But promise you won't push it.", {
            flags: ['choice.n01_5_kept_secret'], aff: { [H]: 0.05 }, next: 'promise' }),
          opt('tell_mom', '어머니께는 알리는 게 맞지 않을까요?', "Shouldn't your mother know?", {
            say: ['어머니께는 알리는 게 맞지 않을까요? 걱정하실 텐데요.', "Shouldn't your mother know? She'll worry."],
            flags: ['choice.n01_5_tell_mom'], aff: { [S]: 0.03 }, next: 'tell' }),
        ],
        note: ['물가부터 해 보자고 했다. 해솔 씨는 어머니도 처음엔 물가에서 시작했다며, 물 빠질 때 갯바위로 나오라고 했다.',
          "I suggested starting at the edge. Haesol said her mother started at the edge too, and told me to come out to the rocks when the tide is out."],
      }),
      promise: scene([
        line(H, '약속해요. 물 들어오기 시작하면 바로 나오기.', 'Promise. The moment the tide turns, we get out.', { act: 'nod' }),
      ], {
        end: endTalk({}),
        note: ['어머니께는 아직 말하지 않기로 했다. 대신 무리하지 않기로 약속했다.', "We agreed not to tell her mother yet. In return, she promised not to push it."],
      }),
      tell: scene([
        act(H, 'sigh'),
        line(H, '빈손으로 말하면 또 싸워요. 캐 온 걸 보여 주면서 같이 말해요. 그럼 엄마도 들을 거예요.', "If we tell her empty-handed we'll just fight again. Let's tell her together while we show her what we gathered. Then she'll listen."),
        line(P, '좋아요. 그렇게 해요.', "Good. Let's do that."),
      ], {
        end: endTalk({}),
        note: ['어머니께 알리자고 했다. 해솔 씨는 빈손으로 말하면 또 싸운다며, 캐 온 것을 보여 주며 같이 말하자고 했다.',
          "I said her mother should know. Haesol said they'd only fight if she told her empty-handed — we'll tell her together while showing what we gathered."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N01-5 — 셋째 목표: 해솔의 어머니를 찾아간다
  // ═══════════════════════════════════════════
  {
    id: 'n01_5_sundeok', questId: 'N01-5', at: 'objective', objectiveIndex: 2, npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '누구우꽈? …아, 바람이 보낸 사람이구먼.', "Who's that? ...Ah, the one Baram sent.", { act: 'look_up' }),
      ], {
        choices: [
          opt('with_haesol', '해솔 씨랑 캐 온 걸 보여 드리려고요.', "I came to show you what Haesol and I gathered.", {
            say: ['해솔 씨랑 같이 갯바위에서 캐 온 걸 보여 드리려고요. 해솔 씨가 같이 말씀드리자고 했어요.', "I came to show you what Haesol and I gathered on the rocks. She wanted us to tell you together."],
            requires: { flag: 'choice.n01_5_tell_mom' }, aff: { [S]: 0.04 }, next: 'show' }),
          opt('confess', '사실 해솔 씨랑 갯바위에 다녀왔어요.', "The truth is, Haesol and I went out to the rocks.", {
            say: ['사실… 해솔 씨랑 물 빠질 때 갯바위에 다녀왔어요. 말씀 안 드리고요.', "The truth is... Haesol and I went out to the rocks at low tide. Without telling you."],
            next: 'confess' }),
          opt('greet', '허리는 좀 어떠세요?', 'How is your back?', {
            say: ['허리는 좀 어떠세요? 바람 아저씨가 많이 걱정하세요.', 'How is your back? Baram is very worried about you.'], next: 'greet' }),
        ],
      }),
      greet: scene([
        line(S, '그 양반은 미안하면 꼭 남을 보내더라.', 'That man always sends someone else when he feels sorry.'),
        act(S, 'sigh'),
        line(S, '누워 있으면 좀 낫고, 일어나면 도로 아파. 물질하는 사람한테 허리는 다라.', "Lying down it's better, and the moment I get up it hurts again. For a diver, the back is everything."),
        line(P, '…사실 해솔 씨랑 갯바위에 다녀왔어요.', "...The truth is, Haesol and I went out to the rocks."),
      ], { next: 'confess' }),
      confess: scene([
        line(S, '…뭐?', '...What?', { act: 'look_up' }),
        act(S, 'silence'),
        line(S, '물에는, 안 들어갔지?', "You didn't go into the water, did you?"),
        line(P, '네. 물 빠질 때 물가에서만요. 물 들어오기 시작하자마자 나왔어요.', "No. Only at the edge when the tide was out. We got out as soon as it started coming in."),
        act(S, 'sigh'),
        line(S, '그 애가 하겠다고 하면 말릴 수가 없어. 지 아빠 닮아서.', "Once that girl decides on something, there's no stopping her. Takes after her father."),
      ], { next: 'show' }),
      show: scene([
        line(S, '어디 봐.', "Let me see.", { act: 'peer' }),
        line(S, '소라 크기 보는 눈은 있네. 작은 건 놔두고 왔지?', "You've an eye for turban-shell size. You left the small ones, didn't you?"),
      ], {
        choices: [
          opt('released', '작은 건 바다에 돌려보냈어요.', 'We put the small ones back in the sea.', { aff: { [S]: 0.06 }, next: 'soften' }),
          opt('haesol_picked', '해솔 씨가 골랐어요. 저보다 잘 봐요.', 'Haesol picked them. She sees better than I do.', {
            aff: { [S]: 0.04, [H]: 0.05 }, next: 'proud' }),
          opt('didnt_know', '솔직히 크기는 잘 몰랐어요.', "Honestly, I didn't really know the sizes.", { aff: { [S]: -0.02 }, next: 'teach' }),
        ],
        note: ['해솔 씨 어머니께 갯바위에서 캐 온 것을 보여 드렸다.', "I showed Haesol's mother what we gathered on the rocks."],
      }),
      proud: scene([
        line(S, '…그 애가?', '...She did?'),
        act(S, 'peer'),
        line(S, '어릴 때 내 뒤만 졸졸 따라다니더니… 그걸 다 보고 있었구나.', "Always trailing after me when she was little... so she was watching all along."),
      ], { next: 'soften' }),
      teach: scene([
        line(S, '그럼 배워야지. 소라는 손가락 두 마디가 안 되면 놔두는 거야. 크기 안 된 건 내년 거라.', "Then learn. If a turban shell isn't two finger-joints across, you leave it. The small ones belong to next year."),
        line(P, '명심할게요.', "I'll remember that."),
      ], { next: 'soften' }),
      soften: scene([
        line(S, '물속은 안 돼. 그건 지금도 안 돼.', "Not underwater. That's still a no.", { act: 'look_sea' }),
        line(S, '…근데 물가는, 나랑 같이 나가는 날이면 괜찮겠지. 허리 좀 나으면.', "...But the edge — on days she goes out with me, that'd be all right. Once my back's better."),
        line(P, '그 말씀, 해솔 씨한테 직접 해 주세요.', 'Tell Haesol that yourself.'),
        act(S, 'laugh'),
        line(S, '그건 내 몫이지. 고맙수다.', "That's my job. Thank you."),
      ], {
        end: endTalk({}),
        note: ['어머니는 물속은 지금도 안 된다고 했다. 그래도 물가는, 허리가 나으면 같이 나가는 날이면 괜찮겠다고 했다. 그 말은 해솔 씨에게 직접 하겠다고 했다.',
          "Her mother said the water is still a no. But the edge — on days they go out together, once her back heals — would be all right. She said she'd tell Haesol herself."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N01-5 — 끝내는 자리(바람)
  // ═══════════════════════════════════════════
  {
    id: 'n01_5_complete', questId: 'N01-5', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '왔나. 어떻게 됐어?', "You're back. How did it go?"),
        line(P, '해솔 씨랑 물가에서 캐 왔어요. 어머니도 물가는 같이 나가는 날이면 괜찮다고 하셨고요.', "Haesol and I gathered at the edge. And her mother said the edge is fine on days they go out together."),
        act(B, 'cig_light'),
        act(B, 'cig_puff'),
        line(B, '…그래. 평생 물에 든 사람 말이니, 그게 허락이야.', "...I see. Coming from someone who's spent her life in the water, that's permission."),
      ], {
        choices: [
          opt('lesson', '어머니께 숨 고르는 법을 조금 들었어요.', 'Her mother told me a little about breathing.', {
            say: ['어머니께 숨 고르는 법을 조금 들었어요. 따라 하진 못하겠지만요.', "Her mother told me a little about how to breathe. Not that I could copy it."], next: 'lesson' }),
          opt('pay', '제주까지 온 여비는 주셔야죠.', "You owe me my fare to Jeju.", {
            say: ['그나저나, 제주까지 온 여비는 주셔야죠.', "By the way — you owe me my fare out to Jeju."], next: 'pay' }),
          opt('decline', '좋은 분들 만났으니 그걸로 됐어요.', "I met good people. That's enough.", { next: 'decline' }),
        ],
        note: ['바람 아저씨에게 해솔 씨와 물가에서 캔 일, 어머니가 물가는 괜찮다고 한 일을 전했다. 아저씨는 담배에 불을 붙이고, 평생 물에 든 사람의 말이니 그게 허락이라고 했다.',
          "I told Baram about gathering at the edge with Haesol, and that her mother said the edge was fine. He lit a cigarette and said that, from someone who's spent her life in the water, it was permission."],
      }),
      lesson: scene([
        line(B, '해녀 숨은 못 배워. 그래도 들은 건 남지.', "You can't learn a haenyeo's breath. But what you hear stays with you."),
        act(B, 'cig_puff'),
        line(B, '물가에서도 숨 고를 일은 많아.', "There's plenty of breathing to do at the edge, too."),
      ], { end: endTalk({ complete: 'lesson' }) }),
      pay: scene([
        act(B, 'laugh'),
        line(B, '그렇지. 리어카 손잡이 밑에 넣어 둔 봉투야. 많진 않아.', "Fair enough. There's an envelope under the cart handle. It isn't much."),
      ], { end: endTalk({ complete: 'pay' }) }),
      decline: scene([
        act(B, 'silence'),
        line(B, '…자네는 바람이 좋은 쪽으로 부는군.', '...The wind blows the right way with you.'),
        act(B, 'cig_out'),
        line(B, '다음에 이 앞을 지나다 테왁이 하나 더 떠 있으면, 그때 알겠지.', "If I pass by here one day and there's one more float on the water, I'll know then."),
      ], { end: endTalk({ complete: 'decline' }) }),
    },
  },
];
