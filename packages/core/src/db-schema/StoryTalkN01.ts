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
        line(P, '바람 씨는 어떻게 하셨어요?', 'What did you do, Baram?'),
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
        note: ['바람 씨가 아는 해녀 이야기를 꺼냈다. 자기가 무리한 부탁을 한 탓에 그 해녀가 물질하다 허리를 다쳤고, 생활비가 빠듯해지자 딸이 대신 물에 들어가겠다며 어머니와 다투고 있다고 했다. 바람 씨는 딸을 설득해 달라며 수영을 할 줄 아느냐고 물었다.',
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
          { f: ['내가 신뢰하는 여자에겐 담배 한 갑도 곧바로 줄 수 있다네.', "For a woman I trust, I'd hand over a whole pack of cigarettes on the spot."] }),
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
        note: ['수영은 선수급이라고 했더니, 바람 씨는 담배에 불을 붙여 한 모금 길게 내뿜고는 고맙다고 했다. 신뢰하는 사람에게는 담배 한 갑도 아깝지 않다며 한 갑을 통째로 건넸다.',
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
        note: ['같이 물에 들어가겠다고 했다가 한 소리 들었다. 바닷속은 숙련된 사람도 다치는 곳이고, 물가에서 돕는 것까지라고. 바람 씨 이름을 대고 딸부터 만나 보기로 했다.',
          "I said I'd go into the water with her and got told off. Even skilled people get hurt down there; helping at the edge is as far as it goes. I'll mention his name and meet the daughter first."],
      }),
      assist: scene([
        line(B, '자네는 내가 말하지 않아도 올바른 방향을 잘 알고 있군그래.', "You know the right way to go without my having to say it.", { act: 'nod' }),
        give(B, { affinity: { [B]: 0.25 } }),
        line(B, '가서 딸에게 먼저 말을 걸어 보게나.', 'Go and talk to the daughter first.'),
      ], {
        end: endTalk({ accept: true }),
        note: ['옆에서 딸을 돕겠다고 하자, 바람 씨는 말하지 않아도 방향을 안다며 흡족해했다. 딸에게 먼저 말을 걸어 보라고 했다.',
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
            say: ['물가에서 캐는 게 맞는 것 같아요. 우선 그분 따님을 만나 볼게요. 살아 돌아올 수 있을진 모르겠지만…', "Gathering at the edge seems right. I'll meet her daughter first. Whether I'll come back alive, I can't say..."],
            next: 'shore' }),
          opt('intrude', '그 집 일인데, 제가 끼어들어도 될까요?', "It's their family matter — should I get involved?", {
            say: ['사실, 그 집 일에 제가 끼어들어도 될까 모르겠습니다. 그분은 그렇다 치더라도, 따님 분이 저를 모르는 상태에서 거리낌 없이 반길 것 같진 않아서요.',
              "Honestly, I'm not sure I should get involved in their family's business. Her mother aside, I doubt her daughter will welcome a stranger with open arms."],
            next: 'intrude' }),
          opt('border', '물질이랑 해루질은 뭐가 다른데요?', "What's the difference between diving and shore gathering?", {
            next: 'border' }),
        ],
        note: ['수영장에서만 해 봤다고 하자, 바람 씨는 바닷속은 숙련된 사람도 다치는 곳이라며 물질을 도우라는 게 아니라 물가에서 도우라는 뜻이라고 했다.',
          "When I said I'd only swum in pools, he said even skilled people get hurt under the sea — he meant helping at the edge, not helping her dive."],
      }),
      shore: scene([
        line(B, '우선 딸이 내 이름을 알 테니, 얘기를 잘 전달해 주게. 젊은 자네가 도와준다면 괜찮을 거야.', "The daughter knows my name, so pass the word on well. With a young one like you helping, she'll be all right."),
        line(B, '아, 물론 딸이 자네를 반길지는 모르겠으니, 알아서 호감을 잘 사야 하겠지.', "Ah, of course, I can't promise she'll welcome you. You'll have to win her over yourself."),
        line(P, '네, 알겠습니다. 다녀올게요.', "All right. I'll be off, then."),
      ], {
        end: endTalk({ accept: true }),
        note: ['물가에서 캐겠다고 했다. 바람 씨는 딸이 자기 이름을 아니 얘기를 잘 전해 달라며, 반겨 줄지는 모르니 호감은 알아서 사라고 했다.',
          "I said I'd gather at the edge. He asked me to pass his word on — she knows his name — and said winning her over was up to me."],
      }),
      border: scene([
        line(B, '물질은 숨 하나로 바다 밑까지 들어가는 거야. 해녀들 일이고, 마을이 지키는 바다지.', "Diving is going down to the seabed on a single breath. It's the haenyeo's work, and the village guards that sea."),
        line(B, '해루질은 물 빠진 가장자리에서, 손 닿는 데까지만.', "Shore gathering is at the edge when the tide's out — only as far as your hands reach."),
        line(P, '그럼 그 사이에 경계가 있는 거네요.', "So there's a line between the two."),
        line(B, '그렇지. 경계를 아는 게 제일 중요해. 남의 바다엔 안 들어가는 거.', "That's it. Knowing that line matters most. You don't go into someone else's sea.", { act: 'nod' }),
        line(B, '그 딸은 그 경계 양쪽을 다 보게 될 거야. 그래서 자네가 필요해.', "That girl is going to see both sides of it. That's why you're needed."),
        line(P, '저는 물가 쪽이군요. 알겠습니다. 따님부터 만나 볼게요.', "Then I'm on the edge side. All right. I'll meet the daughter first."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_border' }),
        note: ['물질과 해루질이 무엇이 다르냐고 물었다. 바람 씨는 물질은 마을이 지키는 바다 밑 일이고 해루질은 물 빠진 가장자리 일이라며, 그 경계를 아는 게 제일 중요하다고 했다.',
          "I asked how diving differs from shore gathering. Baram said diving is the village's work under the sea and gathering is work at the exposed edge — and that knowing the line between them matters most."],
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
            note: ['돕겠다고 했다. 바람 씨 이름을 대고 딸부터 만나 보기로 했다.', "I agreed to help. I'll mention his name and meet the daughter first."] }),
          opt('no', '아무래도 힘들 것 같습니다.', "I don't think I can.", { next: 'refuse' }),
        ],
        note: ['그 집 일에 끼어들어도 되겠느냐고 했더니, 바람 씨는 담배에 불을 붙여 한 모금 내뿜고는 딸 생일에 선물을 줄 만큼 아는 사이니 자기 이름을 대면 된다고 했다.',
          "When I asked whether I should get involved in their family's business, he lit a cigarette, blew out a mouthful of smoke, and said he knows the daughter well enough to have given her a birthday present — just mention his name."],
      }),
      refuse: scene([
        line(B, '…강요하는 건 아니니, 너무 부담 갖지 말게. 내 나름대로 다른 방법을 찾아볼 테니.', "...I'm not forcing you, so don't let it weigh on you. I'll find another way of my own.", { act: 'look_away' }),
        line(P, '…', '...'),
      ], {
        end: endTalk({ fail: true }),
        note: ['결국 힘들 것 같다고 거절했다. 바람 씨는 강요하는 건 아니라며, 자기 나름대로 다른 방법을 찾아보겠다고 했다. 그 집 일은 거기서 내 손을 떠났다.',
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
          opt('baram', '바람 씨 소개로 왔어요.', 'Baram sent me.', {
            say: ['바람 씨 소개로 왔어요. 리어카 끌고 다니시는 분이요.', 'Baram sent me. The man with the cart.'], next: 'baram' }),
          opt('daughter', '혹시 부순덕 씨 따님 맞으세요?', "Are you Bu Sundeok's daughter, by any chance?", {
            say: ['혹시 부순덕 씨 따님 맞으세요?', "Excuse me — are you the daughter of Bu Sundeok, the haenyeo?"], next: 'daughter' }),
        ],
      }),
      baram: scene([
        line(H, '아… 바람 아저씨.', 'Ah... Baram.', { act: 'look_away' }),
        line(H, '엄마 다치던 날 병원까지 태워다 주신 분이죠. 고맙긴 한데… 그날 엄마한테 깊은 데 한 번만 더 들어가 달라고 한 것도 그 아저씨라던데요.',
          "He's the one who took Mom to the hospital the day she got hurt. I'm grateful, but... I heard he was also the one who asked her to go down deep one more time that day."),
        line(P, '…바람 씨도 그 일로 많이 미안해하세요.', "...He feels terrible about it."),
        line(H, '알아요. 미안하니까 사람을 보냈겠죠.', "I know. That's why he sent someone, I guess."),
        act(H, 'sigh'),
        line(H, '그래서, 아저씨가 뭐래요? 나 말리라고 해요?', "So, what did he say? Told you to stop me?"),
      ], {
        next: 'why',
        note: ['해솔 씨는 바람 씨 이름을 듣고 잠깐 시선을 피했다. 어머니를 병원까지 태워다 준 사람이지만, 그날 깊은 데로 한 번 더 들어가 달라고 한 것도 그 사람이라고 했다.',
          "Haesol looked away for a moment at Baram's name. He took her mother to the hospital, but he was also the one who asked her to go down deep one more time that day."],
      }),
      daughter: scene([
        line(H, '…그런데요?', '...What of it?', { act: 'peer' }),
        line(P, '바람 씨가 한번 만나 보라고 하셔서요.', 'Baram asked me to come and meet you.'),
        act(H, 'laugh'),
        line(H, '아, 그 리어카 아저씨. 엄마 일로 오셨구나.', "Oh, the cart man. You're here about Mom."),
        line(H, '그래서, 아저씨가 뭐래요? 나 말리라고 해요?', "So, what did he say? Told you to stop me?"),
      ], {
        next: 'why',
        note: ['해솔 씨는 처음엔 경계했지만, 바람 씨 이름이 나오자 조금 누그러졌다.', "Haesol was wary at first, but softened a little at Baram's name."],
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
            say: ['허리는 좀 어떠세요? 바람 씨가 많이 걱정하세요.', 'How is your back? Baram is very worried about you.'], next: 'greet' }),
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
          opt('daughter', '해솔 씨, 결국 어떻게 하기로 했을까요?', 'What do you think Haesol will decide in the end?', {
            say: ['그나저나 해솔 씨는… 결국 어떻게 하기로 했을까요?', 'Still... what do you think Haesol will decide in the end?'], next: 'daughter' }),
        ],
        note: ['바람 씨에게 해솔 씨와 물가에서 캔 일, 어머니가 물가는 괜찮다고 한 일을 전했다. 바람 씨는 담배에 불을 붙이고, 평생 물에 든 사람의 말이니 그게 허락이라고 했다.',
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
      daughter: scene([
        line(B, '몰라. 안 물어봤어.', "Don't know. I didn't ask."),
        act(B, 'cig_puff'),
        line(B, '우리가 알 일은 아니야. 물속을 고르든 물가를 고르든, 그 애가 고른 거니까.', "It's not ours to know. Whether she picks the water or the edge, she's the one who picked it."),
        line(P, '…그렇네요. 저희는 물가까지만 같이 가 준 거고요.', "...True. We only walked her as far as the edge."),
        line(B, '그거면 됐어.', "That's enough."),
      ], {
        end: endTalk({ complete: 'asked_daughter' }),
        note: ['해솔 씨가 결국 어떻게 할지 물었더니, 바람 씨는 안 물어봤다며 어느 쪽이든 그 애가 고른 거라고 했다.',
          "When I asked what Haesol would decide, Baram said he hadn't asked — whichever way, it would be her choice."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N01-1 「리어카」 받는 자리(바람 · 속초 좌판 앞 · 처음 만난 날 — 이름을 묻는다)
  // ═══════════════════════════════════════════
  {
    id: 'n01_1_offer', questId: 'N01-1', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '자네, 낚싯대를 들고 다니는군.', 'You carry a rod around, I see.', { act: 'look_up' }),
        line(P, '네… 그런데 누구세요?', 'Yes... who are you?'),
        line(B, '지나가는 사람. 리어카 끄는.', 'Someone passing through. I pull a cart.'),
        line(P, '성함이라도 여쭤봐도 될까요?', 'May I ask your name?'),
        line(B, '바람. 그렇게 불러.', 'Baram. Call me that.'),
        line(P, '(바람… 이름치고는 특이하네.)', '(Baram — the wind. An odd sort of name.)'),
        line(B, '저기 좌판 할머니 보이지. 아까부터 도다리, 도다리 하시더라.', 'See the old lady at the stall? She keeps saying flounder, flounder.', { act: 'look_away' }),
        line(P, '도다리요?', 'Flounder?'),
        line(B, '손주 생일상에 올리고 싶으시대. 근데 오늘은 들어온 게 없어.', "She wants one for her grandson's birthday table. But none came in today."),
        line(B, '원투 던질 줄 알아?', 'Do you know how to cast long?'),
        line(P, '조금은요. 왜요?', 'A little. Why?'),
        line(B, '한 마리 낚아서 저 좌판에 두고 와. 그러면 리어카 도면 하나 주지.', "Catch one and leave it at that stall. Then I'll give you a blueprint for a cart."),
      ], {
        choices: [
          opt('for_table', '생일상이라면 해 봐야죠', "For a birthday table, I'll give it a go", {
            say: ['생일상이라면 해 봐야죠. 던지는 법부터 알려 주세요.', "For a birthday table, I'll give it a go. Show me how to cast first."], next: 'cast' }),
          opt('ask_grandma', '좌판 그분이랑 아는 사이세요?', 'Do you know the lady at the stall?', {
            say: ['좌판 그분이랑 아는 사이세요? 어떻게 아셨어요?', 'Do you know the lady at the stall? How did you find out?'], next: 'grandma' }),
          opt('no_bike', '리어카 도면이요? 자전거도 없는데요', "A cart blueprint? I don't even have a bike", {
            say: ['리어카 도면이요? 저는 자전거도 없는데요.', "A cart blueprint? I don't even have a bike."], next: 'no_bike' }),
        ],
        note: ['좌판 앞에서 리어카를 끄는 남자를 만났다. 이름을 묻자 바람이라고만 했다. 좌판 할머니가 손주 생일상에 올릴 도다리를 못 구해 애가 탄다며, 한 마리 낚아 두고 오면 리어카 도면을 주겠다고 했다.',
          "I met a man pulling a cart by the stalls. When I asked his name he only said Baram. The old lady at the stall couldn't find a flounder for her grandson's birthday table — catch one and leave it there, he said, and he'd give me a cart blueprint."],
      }),
      cast: scene([
        line(B, '그래. 팔로 던지지 말고 허리로 던져.', "Good. Don't throw with your arm. Throw with your hips."),
        line(B, '추가 먼저 날아가고 줄이 따라가게.', 'The sinker flies first and the line follows.'),
        line(P, '허리로요… 해 볼게요.', 'With my hips... I\'ll try.'),
        line(B, '도다리는 바닥에 붙어 사는 놈이야. 멀리 던지고, 줄 세우고, 기다려.', 'Flounder live flat on the bottom. Cast far, take up the slack, and wait.'),
      ], {
        choices: [
          opt('go', '알겠습니다. 바로 던져 볼게요', "Got it. I'll cast right away", {
            end: endTalk({ accept: true, offer: 'for_table', lineKo: '할머니 한숨이 길어지기 전에.', lineEn: "Before her sighs get any longer." }),
            note: ['허리로 던지라는 말을 듣고 원투대를 쥐었다. 멀리 던져 바닥에 앉히고 기다리기로 했다.', 'Told to throw from the hips, I took the surf rod. Cast far, settle it on the bottom, and wait.'] }),
          opt('size', '크기도 봐야 하죠?', 'I should check the size too, right?', {
            say: ['그런데 아무 도다리나 되나요? 크기도 봐야 하죠?', 'But will any flounder do? I should check the size too, right?'], next: 'size' }),
        ],
        note: ['바람 씨는 팔이 아니라 허리로 던지라고 했다. 도다리는 바닥에 붙어 사니 멀리 던지고 기다리라고.', "Baram said to cast from the hips, not the arm. Flounder hug the bottom, so cast far and wait."],
      }),
      size: scene([
        line(B, '봐야지. 자를 대 보고 모자라면 다시 넣어.', 'Of course. Lay a ruler on it, and if it falls short, put it back.', { act: 'nod' }),
        line(B, '손주 생일상에 어린 놈 올리고 좋아할 할머니는 없어.', "No grandmother would be glad to put a baby fish on her grandson's birthday table."),
        line(P, '바늘은요?', 'And the hook?'),
        line(B, '작은 걸로. 도다리는 입이 작아서 큰 바늘은 건드리기만 하고 가.', 'A small one. Flounder have small mouths — with a big hook they just nudge it and leave.'),
        line(B, '그것만 알면 반은 낚은 거야.', "Know that and you've half caught it."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_size' }),
        note: ['크기도 봐야 하느냐고 물었다. 자를 대 보고 모자라면 놓아주라고, 도다리는 입이 작으니 바늘은 작은 걸로 쓰라고 했다.', 'I asked about size. Measure it and let it go if it falls short, he said, and use a small hook — flounder have small mouths.'],
      }),
      grandma: scene([
        line(B, '몰라. 처음 봐.', "No. Never seen her before.", { act: 'shake_head' }),
        line(B, '좌판 앞에 서 있는데 도다리, 도다리 하시더라. 한숨 섞어서.', 'I was standing by the stall and she kept saying flounder, flounder. With a sigh in it.'),
        line(P, '처음 보는 분 한숨을 들어 주시는 거예요?', "You're answering the sigh of someone you've never met?"),
        line(B, '한숨 소리는 어느 항구나 같아. 듣는 사람이 없을 뿐이지.', "A sigh sounds the same in every harbour. There's just nobody listening.", { act: 'look_sea' }),
        line(B, '들었으면 하나는 해 줘야지.', 'If you heard it, you ought to do one thing about it.'),
        line(P, '…알겠어요. 한 마리 해 볼게요.', "...All right. I'll try for one."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_grandma' }),
        note: ['좌판 할머니와 아는 사이냐고 물었더니, 바람 씨는 처음 본다고 했다. 한숨 소리는 어느 항구나 같고 듣는 사람이 없을 뿐이라며, 들었으면 하나는 해 줘야 한다고 했다.',
          "I asked if he knew the old lady. He'd never seen her before. A sigh sounds the same in every harbour, he said — there's just nobody listening, and if you heard it you ought to do something."],
      }),
      no_bike: scene([
        line('', '(웃지 않는다. 대신 자기 리어카 바퀴를 발로 툭 찬다.)', "(He doesn't laugh. Instead he nudges his cart wheel with his foot.)"),
        line(B, '자전거가 없으면 손으로 끌면 돼. 리어카는 원래 사람이 끄는 거야.', "No bike, then pull it by hand. A cart was always meant to be pulled by a person."),
        line(P, '그래도 도면을 왜 저한테…', 'Still, why give me a blueprint...'),
        line(B, '도면은 낚아 오면 줘. 무슨 뜻인지는 그때 알게 되고.', "You get the blueprint once you've caught it. What it means, you'll find out then."),
        line(B, '지금은 도다리부터.', 'For now, the flounder.'),
      ], {
        choices: [
          opt('ok', '일단 도다리부터 낚아 볼게요', "I'll go for the flounder first", {
            end: endTalk({ accept: true, offer: 'no_bike' }),
            note: ['왜 도면을 주는지는 묻지 않기로 했다. 일단 도다리부터 낚아 보기로 했다.', "I decided not to ask why the blueprint. The flounder came first."] }),
          opt('later', '오늘은 좀 어렵겠어요', "Today's a bit difficult", {
            say: ['죄송해요. 오늘은 좀 어렵겠어요.', "Sorry. Today's a bit difficult."],
            end: endTalk({ decline: true, lineKo: '그래. 좌판은 내일도 저기 있어.', lineEn: "Fine. The stall will be there tomorrow too." }),
            note: ['오늘은 어렵다고 미뤘다. 바람 씨는 좌판은 내일도 거기 있다고만 했다.', "I put it off for today. Baram only said the stall would be there tomorrow too."] }),
        ],
        note: ['자전거도 없는데 웬 리어카 도면이냐고 했더니, 바람 씨는 리어카는 원래 사람이 끄는 거라고 했다. 무슨 뜻인지는 낚아 오면 알게 된다고.', "When I said I didn't even have a bike, Baram said a cart was meant to be pulled by a person. I'd find out what it meant after I caught the fish."],
      }),
    },
  },

  // N01-1 — 끝내는 자리(바람). 도다리는 좌판에 갔다
  {
    id: 'n01_1_done', questId: 'N01-1', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(P, '도다리, 좌판에 두고 왔어요. 자도 대 봤고요.', 'I left the flounder at the stall. I measured it too.'),
        line(B, '됐네. 할머니 얼굴 봤어?', 'Good. Did you see her face?'),
        line(P, '네. 몇 번이나 고맙다고 하시더라고요.', 'Yes. She thanked me over and over.'),
        line(B, '그거면 됐어.', "Then that's that.", { act: 'nod' }),
        line(B, '도면은 여기. 리어카는 짐이 아니라 다리다.', "Here's the blueprint. A cart isn't a load. It's a pair of legs."),
        line(P, '다리요?', 'Legs?'),
        line(B, '끌어 보면 알아.', "You'll know once you pull one."),
      ], {
        choices: [
          opt('blueprint', '도면 받겠습니다. 만들어 쓸게요', "I'll take the blueprint and build it", {
            say: ['도면 받겠습니다. 제가 직접 만들어 쓸게요.', "I'll take the blueprint. I'll build it myself."],
            end: endTalk({ complete: 'blueprint', lineKo: '손재주는 손으로 배우는 거야. 바퀴 축부터 맞춰. 축이 비뚤면 끄는 사람이 먼저 지쳐. 다 만들면 한 바퀴 끌어 보고 와.',
              lineEn: "Handiwork is learned with the hands. Line up the axle first. If it's crooked, the one pulling tires first. When it's built, pull it round once and come back." }),
            note: ['도면을 받았다. 바퀴 축부터 맞추라고, 다 만들면 한 바퀴 끌어 보고 오라고 했다.', 'I took the blueprint. Line up the axle first, he said, and pull it round once when it is done.'] }),
          opt('cash', '도면보다는 품삯이 필요해요', 'I need wages more than a blueprint', {
            end: endTalk({ complete: 'cash', lineKo: '…그래, 그것도 답이지. 부끄러워할 거 없어. 배고플 땐 도면도 종이야. 배부르면 그때 다시 와. 도면은 리어카에 늘 있으니까.',
              lineEn: "...Right, that's an answer too. Nothing to be ashamed of. When you're hungry a blueprint is just paper. Come back when you're fed. It's always in the cart." }),
            note: ['도면 대신 품삯을 받았다. 바람 씨는 세지도 않고 지폐를 건네며, 도면은 리어카에 늘 있다고 했다.', 'I took wages instead of the blueprint. Baram handed over notes without counting and said the blueprint would always be in the cart.'] }),
          opt('gift_fish', '도다리는 그냥 드렸어요', 'I just gave her the flounder', {
            say: ['사실 도다리는 그냥 드렸어요. 생일상이잖아요.', "Actually, I just gave her the flounder. It's a birthday table."],
            end: endTalk({ complete: 'gift_fish', lineKo: '바람이 좋은 쪽으로 불었네. 자네 같은 사람이 항구에 하나는 있어야 해.',
              lineEn: 'The wind blew the right way. Every harbour needs one person like you.' }),
            note: ['도다리는 값을 받지 않고 드렸다고 했다. 바람 씨는 바람이 좋은 쪽으로 불었다고 했다. 좌판 할머니가 먼저 내게 말을 걸어 왔다.', "I said I'd given the flounder for nothing. Baram said the wind blew the right way. The old lady at the stall spoke to me first after that."] }),
          opt('your_share', '그럼 바람 씨 몫은요?', 'Then what about your share?', {
            say: ['그럼 바람 씨 몫은요? 아무것도 안 받으세요?', "Then what about your share? You don't get anything?"], next: 'share' }),
        ],
        note: ['도다리를 좌판에 두고 왔다고 전했다. 바람 씨는 할머니 얼굴을 봤으면 됐다며, 리어카는 짐이 아니라 다리라고 했다.', "I told Baram I'd left the flounder at the stall. If I'd seen her face, that was enough, he said — a cart isn't a load, it's a pair of legs."],
      }),
      share: scene([
        line(B, '내 몫? 할머니 얼굴 봤잖아. 그게 내 몫이야.', "My share? You saw her face. That's my share."),
        act(B, 'cig_light'),
        act(B, 'cig_puff'),
        line(B, '다른 건 리어카에 실을 데도 없고. 받는 게 적어야 멀리 가.', "There's no room in the cart for anything else. The less you take, the further you go."),
        line(P, '…무슨 뜻이에요?', '...What do you mean?'),
      ], {
        end: endTalk({ complete: 'your_share', lineKo: '그 말은 아직 몰라도 돼.', lineEn: "You don't need to know that one yet." }),
        note: ['바람 씨 몫은 없느냐고 물었다. 할머니 얼굴이 자기 몫이라며 담배에 불을 붙였다. 받는 게 적어야 멀리 간다고 했지만, 무슨 뜻인지는 아직 몰라도 된다고 했다.',
          "I asked what his share was. Her face was his share, he said, and lit a cigarette. The less you take, the further you go — but I didn't need to understand that yet."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N01-2 「다리 밑」 받는 자리(바람 · 부산 다리 밑에 가출한 아이)
  // ═══════════════════════════════════════════
  {
    id: 'n01_2_offer', questId: 'N01-2', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '왔나. 마침 잘 왔어.', "You're here. Good timing."),
        line(P, '무슨 일 있으세요?', 'Is something wrong?'),
        line(B, '저 다리 밑에 애 하나 있어.', "There's a kid under that bridge.", { act: 'look_away' }),
        line(P, '애요?', 'A kid?'),
        line(B, '가출이야. 중학생쯤. 아까부터 혼자 앉아 있어.', "A runaway. Middle-school age. Been sitting there alone a while."),
        line(P, '경찰에 알려야 하는 거 아니에요?', "Shouldn't we tell the police?"),
        line(B, '그러면 또 도망가.', "Then the kid just runs again.", { act: 'shake_head' }),
        line(B, '전갱이 한 마리면 될 것 같은데.', 'I think one horse mackerel would do it.'),
        line(P, '…전갱이요?', '...A horse mackerel?'),
        line(B, '같이 가자.', "Come with me."),
      ], {
        choices: [
          opt('go_sit', '가요. 혼자 두면 안 되죠', "Let's go. We can't leave the kid alone", {
            say: ['가요. 애 혼자 다리 밑에 두면 안 되죠.', "Let's go. We can't leave a kid alone under a bridge."], next: 'go_sit' }),
          opt('ask_why', '왜 집을 나왔대요?', 'Why did the kid run away?', {
            say: ['가출이요? 왜 집을 나왔대요?', 'A runaway? Why did the kid leave home?'], next: 'why' }),
          opt('why_mackerel', '왜 하필 전갱이예요?', 'Why a horse mackerel, of all things?', {
            say: ['왜 하필 전갱이예요? 한 마리면 된다는 건요?', 'Why a horse mackerel, of all things? And why would one be enough?'], next: 'mackerel' }),
        ],
        note: ['부산에서 바람 씨를 다시 만났다. 다리 밑에 가출한 중학생쯤 되는 아이가 혼자 앉아 있다고 했다. 붙잡으면 도망간다며, 전갱이 한 마리면 될 것 같으니 같이 가자고 했다.',
          "I met Baram again in Busan. A runaway, about middle-school age, was sitting alone under the bridge. Grab the kid and they'd run, he said — one horse mackerel might do it, so come along."],
      }),
      go_sit: scene([
        line(B, '그래. 근데 데리고 오려고 가는 거 아니야. 옆에 있으려고 가는 거지.', "Right. But we're not going to bring the kid back. We're going to sit beside them."),
        line(P, '옆에만요?', 'Just sit beside them?'),
        line(B, '애들은 붙잡으면 더 멀리 가. 우리는 낚시하러 온 사람이야. 그것만 기억해.', "Grab a kid and they go further. We're people who came to fish. Remember that much."),
        line(B, '나머지는 전갱이가 해.', 'The horse mackerel does the rest.'),
      ], {
        choices: [
          opt('ok', '알겠어요. 낚시하러 온 사람으로요', 'Understood. Just people come to fish', {
            end: endTalk({ accept: true, offer: 'go_sit' }),
            note: ['데려오려는 게 아니라 옆에 있으려고 가는 거라고 했다. 우리는 낚시하러 온 사람일 뿐이었다.', "We weren't going to fetch the kid, only to sit nearby. We were just people who'd come to fish."] }),
          opt('not_good', '애들 상대는 자신이 없는데요', "I'm not confident with kids", {
            say: ['솔직히 애들 상대는 자신이 없는데요. 괜히 말실수할까 봐요.', "Honestly, I'm not confident with kids. I'm afraid I'll say the wrong thing."], next: 'not_good' }),
        ],
        note: ['바람 씨는 아이를 데리고 오려는 게 아니라 옆에 있으려고 가는 거라고 했다. 나머지는 전갱이가 한다고.', "Baram said we weren't going to bring the kid back, only to sit beside them. The fish would do the rest."],
      }),
      not_good: scene([
        line(B, '그럼 말하지 마. 잘됐네.', "Then don't talk. Perfect."),
        line(B, '말 잘하는 어른은 그 애 주변에도 많았을 거야. 말 없는 어른이 하나쯤 있어도 돼.', "There'll have been plenty of grown-ups around that kid who talk well. One who doesn't won't hurt."),
        line(P, '그럼 저는 뭘 하면 돼요?', 'Then what do I do?'),
        line(B, '낚싯대만 들고 가. 그게 자네 할 말이야.', "Just bring your rod. That's what you have to say."),
      ], {
        end: endTalk({ accept: true, offer: 'not_good_kids' }),
        note: ['말실수할까 봐 걱정된다고 했더니, 그럼 말하지 말라고 했다. 낚싯대가 내 할 말이라고.', "When I worried I'd say the wrong thing, he said then don't talk. My rod would do the talking."],
      }),
      why: scene([
        line(B, '안 물어봤어. 물으면 도망가.', "I didn't ask. Ask and they bolt."),
        line(B, '그 나이엔 대답 대신 발이 먼저 나가.', 'At that age the feet answer before the mouth does.'),
        line(P, '그럼 아무것도 모르세요?', "So you don't know anything?"),
        line(B, '전화기를 계속 만지작거리더라. 누르지는 못하고.', "The kid keeps fiddling with a phone. Can't bring themselves to press it."),
        line(B, '거기까지만 알아. 나머지는 그 애가 말하고 싶을 때 하겠지.', "That's all I know. The rest the kid will say when they want to."),
        line(P, '…알겠어요. 가 봐요.', "...All right. Let's go."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_why' }),
        note: ['왜 집을 나왔는지 물었다. 바람 씨는 물으면 도망간다며 안 물었다고 했다. 아이가 전화기를 만지작거리기만 하고 누르지는 못한다는 것까지만 안다고.', "I asked why the kid had left home. Baram hadn't asked — ask and they run. All he knew was that the kid kept fiddling with a phone and couldn't press it."],
      }),
      mackerel: scene([
        line(B, '이 다리 밑엔 밤이면 불빛 따라 전갱이가 떼로 붙어. 옆에서 보기도 좋고, 잘 물고.', 'At night horse mackerel school under this bridge, following the lights. Easy to watch from beside you, and they bite well.'),
        line(P, '한 마리면 된다는 건요?', 'And why is one enough?'),
        line(B, '눈앞에서 뭐가 펄떡이면 사람은 웃게 돼 있어.', "When something flaps right in front of you, you can't help smiling."),
        line(B, '웃고 나면 무거운 버튼도 좀 가벼워지고.', 'And once you smile, a heavy button gets a little lighter.'),
        line(P, '버튼이요?', 'A button?'),
        line(B, '가 보면 알아. 어두워지기 전에 자리 잡자.', "You'll see. Let's get a spot before dark."),
      ], {
        end: endTalk({ accept: true, offer: 'why_mackerel' }),
        note: ['왜 전갱이냐고 물었다. 밤이면 다리 밑 불빛에 전갱이가 떼로 붙고, 눈앞에서 뭐가 펄떡이면 사람은 웃게 된다고 했다. 무거운 버튼도 가벼워진다는데, 무슨 버튼인지는 가 보면 안다고 했다.',
          "I asked why horse mackerel. At night they school under the bridge lights, he said, and when something flaps in front of you, you smile. A heavy button gets lighter — what button, I'd see when I got there."],
      }),
    },
  },

  // N01-2 — 끝내는 자리(바람). 아이가 전화를 걸었다
  {
    id: 'n01_2_done', questId: 'N01-2', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '전화했어.', 'The kid called.', { act: 'look_sea' }),
        line(P, '봤어요. 전갱이가 올라오니까 처음 웃더라고요.', 'I saw. When the mackerel came up, that was the first smile.'),
        line(B, '그러고는 전화기를 꺼냈지.', 'And then out came the phone.'),
        line(P, '무슨 얘기를 했을까요?', 'What do you think they talked about?'),
        line(B, '안 들었어. 그건 그 애 거야.', "I didn't listen. That's the kid's.", { act: 'shake_head' }),
        line(B, '그거면 됐어. 애들은 물고기 한 마리에 마음이 풀리더라.', "That's enough. One fish and a kid's heart loosens."),
      ], {
        choices: [
          opt('lesson', '어떻게 다가가는지 보고 배웠어요', 'I learned by watching how you went about it', {
            say: ['애한테 어떻게 다가가는지, 바람 씨가 하시는 걸 보고 배웠어요.', 'I learned how to approach a kid, watching you do it.'],
            end: endTalk({ complete: 'lesson', lineKo: '말은 안 걸었잖아. 옆에 앉았지. 그게 다야.', lineEn: "I didn't talk to the kid. I sat beside them. That's all." }),
            note: ['다가가는 법을 배웠다고 했더니, 바람 씨는 말은 안 걸고 옆에 앉았을 뿐이라고 했다. 사람 옆에 앉는 법이 무슨 뜻인지 조금 알 것 같았다.', "When I said I'd learned how to approach, he said he hadn't spoken — he'd only sat beside. I think I understood a little what it means to sit by someone."] }),
          opt('pay', '품삯으로 주세요', "I'll take it as wages", {
            end: endTalk({ complete: 'pay', lineKo: '그러지. 돈 얘기는 짧게 하는 거야. 받을 건 받고. 애 하나 옆에 말없이 앉아 있는 게 쉬운 일은 아니거든.',
              lineEn: "Sure. Money talk should be short. Take what you're owed. Sitting quietly by a kid is not easy work." }),
            note: ['품삯을 받았다. 바람 씨는 리어카 서랍에서 지폐를 꺼내며, 말없이 옆에 앉아 있는 것도 일이었다고 했다.', "I took wages. Baram took notes from the cart drawer and said sitting by someone in silence was work too."] }),
          opt('decline', '애 하나 웃게 한 건데요. 됐어요', 'We made a kid smile. That will do', {
            end: endTalk({ complete: 'decline', lineKo: '…바람이 좋은 쪽으로 불었네. 그 애가 웃을 때 자네도 웃더라. 그거면 품삯은 받은 거야.',
              lineEn: "...The wind blew the right way. When the kid smiled, so did you. That's your wages, right there." }),
            note: ['품삯은 사양했다. 바람 씨는 아이가 웃을 때 나도 웃더라며, 그거면 받은 거라고 했다.', "I turned down the wages. Baram said I smiled when the kid did, and that was payment enough."] }),
          opt('asked_how', '그 애를 어떻게 먼저 알아보셨어요?', 'How did you spot the kid first?', {
            next: 'how' }),
        ],
        note: ['바람 씨는 아이가 전화를 했다고 했다. 무슨 얘기를 했는지는 듣지 않았다고, 그건 그 애 거라고 했다.', "Baram said the kid had made the call. He hadn't listened to what was said — that belonged to the kid."],
      }),
      how: scene([
        line(B, '바람은 낮은 데로 먼저 불어. 다리 밑은 낮잖아.', "Wind blows into the low places first. Under a bridge is low."),
        line(P, '그게 다예요?', "That's all?"),
        line(B, '사람들은 위만 보고 다녀. 다리 위로 차는 그렇게 지나가는데, 밑은 아무도 안 봐.', "People only look up. All those cars go over the bridge and nobody looks underneath."),
      ], {
        end: endTalk({ complete: 'asked_how', lineKo: '이제 자네도 밑을 보겠지. 그럼 됐어.', lineEn: "Now you'll look underneath too. That's enough." }),
        note: ['아이를 어떻게 먼저 알아봤는지 물었다. 바람은 낮은 데로 먼저 분다고, 사람들은 다리 위만 보고 밑은 안 본다고 했다.', "I asked how he'd spotted the kid. Wind blows into low places first, he said — people look at the bridge, never under it."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N01-3 「덕장」 받는 자리(바람 · 포항 덕장 · 청어가 안 든다). 바람이 옆에서 담배를 피운다
  // ═══════════════════════════════════════════
  {
    id: 'n01_3_offer', questId: 'N01-3', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '왔나.', "You're here."),
        act(B, 'cig_light'),
        act(B, 'cig_puff'),
        line(B, '저기 덕장 보이지.', 'See the drying racks over there?'),
        line(P, '대만 잔뜩 서 있고, 걸린 게 별로 없네요.', "Lots of poles standing, but hardly anything hanging."),
        line(B, '그래서 주인이 힘들어해.', "That's why the owner's struggling."),
        line(P, '무슨 일인데요?', 'What happened?'),
        line(B, '청어가 안 들어. 과메기 명맥이 끊길 판이야.', "The herring don't come any more. The gwamegi tradition is about to die out."),
        line(P, '그럼 제가 뭘 할 수 있을까요?', 'Then what can I do?'),
        line(B, '얘기 좀 들어 줘. 답은 없어도 듣는 사람이 있으면 다르니까.', "Listen to him. There's no answer, but it's different when someone's listening."),
      ], {
        choices: [
          opt('listen_through', '들을게요. 끝까지요', "I'll listen. All the way through", {
            say: ['들을게요. 끝까지요. 중간에 끊지 않겠습니다.', "I'll listen. All the way through. I won't cut in."], next: 'listen' }),
          opt('ask_gwamegi', '명맥이 끊긴다는 게 무슨 말이에요?', 'What do you mean, the tradition will die out?', {
            say: ['과메기 명맥이 끊긴다는 게 무슨 말이에요?', 'What do you mean, the gwamegi tradition will die out?'], next: 'gwamegi' }),
          opt('why_not_you', '바람 씨가 들어 드리면 되잖아요', "Couldn't you listen to him yourself?", {
            say: ['바람 씨가 들어 드리면 되잖아요. 왜 저한테 맡기세요?', "Couldn't you listen to him yourself? Why leave it to me?"], next: 'not_you' }),
        ],
        note: ['포항 덕장 앞에서 바람 씨가 담배에 불을 붙였다. 청어가 안 들어 과메기 명맥이 끊길 판이라 덕장 주인이 힘들어한다며, 답은 없어도 얘기를 들어 달라고 했다.',
          "By the racks in Pohang, Baram lit a cigarette. The herring don't come, the gwamegi tradition is dying, and the rack owner is struggling, he said — there's no answer, but would I listen to him."],
      }),
      listen: scene([
        line(B, '그래. 안 끊는 게 제일 어려워. 사람은 듣다가 자꾸 답을 주려고 하거든.', "Good. Not cutting in is the hardest part. People listening keep wanting to give answers."),
        line(B, '답 주지 마. 그 사람이 제일 잘 알아.', "Don't give him answers. He knows better than anyone."),
        line(P, '그럼 저는 듣기만 하면 돼요?', 'So I just listen?'),
        line(B, '옆에서 하나 말려. 손을 놀리면 말이 덜 무거워.', "Dry something beside him. With your hands busy, the words weigh less."),
      ], {
        choices: [
          opt('ok', '알겠어요. 손 놀리면서 들을게요', "Got it. I'll listen with my hands busy", {
            end: endTalk({ accept: true, offer: 'listen_through' }),
            note: ['답은 주지 않고 듣기만 하기로 했다. 옆에서 하나 말리면서.', "I'd give no answers, only listen — drying something beside him as I did."] }),
          opt('no_answer', '답도 없는데 듣기만 하면 더 답답하지 않을까요?', "With no answer, won't just listening make it worse?", {
            say: ['그런데 답도 없는데 듣기만 하면, 그분이 더 답답하지 않을까요?', "But if there's no answer and I only listen, won't he feel even more stuck?"], next: 'no_answer' }),
        ],
        note: ['바람 씨는 듣다가 답을 주려 하지 말라고 했다. 그 사람이 제일 잘 안다고. 대신 옆에서 하나 말리라고 했다.', "Baram said not to try giving answers while I listened — he knows best. Dry something beside him instead."],
      }),
      no_answer: scene([
        act(B, 'cig_puff'),
        line(B, '답답하겠지. 그래도 혼자 답답한 거랑 둘이 답답한 건 달라.', "He'll feel stuck. But being stuck alone and being stuck with someone aren't the same."),
        line(B, '바다가 바뀌면 사람이 바뀌어야지. 근데 바뀌는 건 혼자 못 해.', "When the sea changes, people have to change. But you can't change alone."),
        line(P, '…옆에 누가 있어야 하는 거네요.', '...So someone has to be beside you.'),
      ], {
        end: endTalk({ accept: true, offer: 'no_answer', lineKo: '그래. 오늘은 자네가 옆이야.', lineEn: "Right. Today, that's you." }),
        note: ['답도 없는데 듣기만 하면 더 답답하지 않겠느냐고 물었다. 바람 씨는 연기를 길게 내뱉고, 혼자 답답한 것과 둘이 답답한 것은 다르다고 했다. 바다가 바뀌면 사람이 바뀌어야 하는데, 그건 혼자 못 한다고.',
          "I asked whether listening without an answer wouldn't make it worse. Baram let out a long breath of smoke: stuck alone and stuck together aren't the same. When the sea changes people must change, and nobody does that alone."],
      }),
      gwamegi: scene([
        line(B, '과메기는 원래 청어로 말렸어. 겨울 바닷바람에 얼었다 녹았다 하면서.', 'Gwamegi was always made from herring. Frozen and thawed over and over in the winter sea wind.'),
        line(P, '그 청어가…', 'And the herring...'),
        line(B, '이 앞에 안 들어. 대만 남고 걸 게 없는 거지.', "Don't come here any more. Only the poles are left, with nothing to hang."),
        line(B, '대를 비워 두면 그다음 해엔 대도 없어져. 사람 일이 그래.', "Leave the poles empty and the year after, the poles are gone too. That's how it goes with people."),
        line(P, '…그래서 힘들어하시는 거군요.', "...That's why he's struggling."),
        line(B, '들어 보면 알아.', "Listen to him and you'll see."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_gwamegi' }),
        note: ['과메기 명맥이 무슨 말이냐고 물었다. 원래 청어를 겨울 바닷바람에 얼렸다 녹였다 말리는데, 그 청어가 안 들어 대만 남았다고 했다. 대를 비워 두면 그다음 해엔 대도 없어진다고.',
          "I asked what the dying tradition meant. Gwamegi is herring dried in the winter sea wind, frozen and thawed — and with no herring, only the poles remain. Leave them empty and next year the poles are gone too."],
      }),
      not_you: scene([
        line(B, '나는 지나가는 사람이야.', "I'm someone passing through."),
        line(B, '지나가는 사람한테 하는 얘기랑 남아 있는 사람한테 하는 얘기는 달라.', "What you tell someone passing through isn't what you tell someone who stays."),
        act(B, 'cig_out'),
        line(P, '저도 여기 사는 사람은 아닌데요.', "I don't live here either."),
        line(B, '자네는 돌아갈 항구가 있잖아. 그런 사람한테 해야 그 사람도 대를 다시 세울 마음이 생겨.', "You've got a harbour to go back to. Tell that sort of person, and he'll find the heart to put his poles up again."),
      ], {
        end: endTalk({ accept: true, offer: 'why_not_you', lineKo: '나는 옆에서 담배나 피울게.', lineEn: "I'll just be beside you, smoking." }),
        note: ['왜 직접 들어 주지 않느냐고 물었다. 바람 씨는 꽁초를 비벼 끄며, 자기는 지나가는 사람이고 나는 돌아갈 항구가 있는 사람이라고 했다. 그런 사람에게 털어놔야 대를 다시 세울 마음이 생긴다고.',
          "I asked why he wouldn't listen himself. Grinding out his cigarette, Baram said he was only passing through, while I had a harbour to go back to — telling someone like that is what gives a man the heart to raise his poles again."],
      }),
    },
  },

  // N01-3 — 끝내는 자리(바람). 덕장 주인이 대를 비우지 않기로 했다
  {
    id: 'n01_3_done', questId: 'N01-3', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '대를 안 비운대.', "He says he won't leave the poles empty."),
        line(P, '네. 청어가 아니어도 걸 수 있는 걸 걸어 보겠다고 하셨어요.', "Yes. He said he'd hang whatever he can, even if it isn't herring."),
        line(B, '그거면 됐어.', "Then that's that.", { act: 'nod' }),
        line(P, '저는 거의 듣기만 했는데요.', 'I mostly just listened.'),
        line(B, '그게 일이었어. 바다가 바뀌면 사람이 바뀌는 거야.', "That was the job. When the sea changes, people change."),
      ], {
        choices: [
          opt('lesson', '청어가 아니어도 말리는 법을 배웠어요', "I learned to dry things that aren't herring", {
            say: ['말리는 법을 배웠어요. 청어가 아니어도 말릴 수 있는 걸요.', "I learned how to dry things. Things you can dry even if they aren't herring."],
            end: endTalk({ complete: 'lesson', lineKo: '그렇지. 그게 바뀌는 거야. 걸 수 있는 걸 거는 거야, 바다가 주는 대로. 적어 준 거 잃어버리지 마. 그 사람한테는 그게 수십 년이야.',
              lineEn: "That's it. That's what changing is. You hang what you can, whatever the sea gives. Don't lose what he wrote down for you. For him, that's decades." }),
            note: ['덕장 주인이 숙성 온도를 적어 주었다. 바람 씨는 그 종이가 그 사람에게는 수십 년이라고 했다.', 'The rack owner wrote down the curing temperatures for me. Baram said that slip of paper was decades of his life.'] }),
          opt('pay', '들어 준 값은 받을게요', "I'll take payment for listening", {
            end: endTalk({ complete: 'pay', lineKo: '그래. 리어카에 있어. 빈 대에 하나라도 걸리면 바람이 다르게 지나가. 들리지? 나는 그 소리 들으러 다니는 거야.',
              lineEn: "Fine. It's in the cart. Hang even one thing on an empty pole and the wind passes differently. Hear it? That's the sound I travel to hear." }),
            note: ['들어 준 값을 받았다. 바람 씨는 돈 얘기는 하지 않고 덕장 쪽만 보며, 빈 대에 하나라도 걸리면 바람이 다르게 지나간다고 했다.', "I took payment for listening. Baram said nothing about the money and only watched the racks — hang one thing on an empty pole and the wind sounds different."] }),
          opt('decline', '들어 준 게 무슨 일이에요. 됐어요', "Listening isn't work. No need", {
            end: endTalk({ complete: 'decline', lineKo: '…바람이 좋은 쪽으로 불었네. 듣는 값 받는 사람은 없어. 그래서 다들 안 들어. 자네는 들었고.',
              lineEn: "...The wind blew the right way. Nobody gets paid for listening. That's why nobody listens. You did." }),
            note: ['값은 사양했다. 덕장 주인이 멀리서 손을 들었고, 나도 손을 들었다.', 'I turned down the money. The rack owner raised a hand from far off, and I raised mine.'] }),
          opt('asked_saying', '그 말, 누구한테 들으셨어요?', 'Who did you hear that saying from?', {
            say: ['바다가 바뀌면 사람이 바뀐다는 말, 누구한테 들으셨어요?', 'That saying, when the sea changes people change — who did you hear it from?'], next: 'saying' }),
        ],
        note: ['덕장 주인이 대를 비우지 않기로 했다고 전했다. 나는 거의 듣기만 했는데, 바람 씨는 그게 일이었다고 했다.', "I told Baram the rack owner wouldn't leave his poles empty. I'd mostly just listened, and Baram said that was the job."],
      }),
      saying: scene([
        act(B, 'silence'),
        line(B, '…오래전에 누가 했어.', '...Someone said it, a long time ago.'),
        line(P, '누군데요?', 'Who?'),
        line(B, '이름은 몰라도 돼. 말은 이름 없이도 잘 다녀.', "You don't need the name. Words travel fine without one.", { act: 'look_sea' }),
      ], {
        end: endTalk({ complete: 'asked_saying', lineKo: '좋은 말은 주인이 없어. 들은 사람이 쓰면 그 사람 거야. 오늘부터는 자네 거기도 하고.',
          lineEn: 'A good saying has no owner. Whoever heard it and uses it, it\'s theirs. From today, it\'s yours too.' }),
        note: ['그 말을 누구에게 들었느냐고 물었다. 바람 씨는 오래전에 누가 했다며, 이름은 몰라도 된다고 했다. 좋은 말은 주인이 없다고.', "I asked who'd said it first. Someone, long ago, Baram said — I didn't need the name. A good saying has no owner."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N01-4 「절벽」 받는 자리(바람 · 거제 · 갯바위 사고 뒤 낚시를 끊은 사람)
  // ═══════════════════════════════════════════
  {
    id: 'n01_4_offer', questId: 'N01-4', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '거제 바다는 처음인가.', 'First time on the Geoje coast?'),
        line(P, '네. 바위가 정말 높네요.', 'Yes. The rocks are really high.'),
        line(B, '높지. 저 위에서 일이 난 사람이 하나 있어.', "They are. There's a man something happened to up there.", { act: 'look_sea' }),
        line(P, '일이요?', 'Something?'),
        line(B, '갯바위에서 사고가 났어. 그 뒤로 낚시를 끊었지.', "An accident on the rocks. He gave up fishing after that."),
        line(P, '그런데 그 얘기를 저한테 하시는 건…', 'And you\'re telling me this because...'),
        line(B, '해금강 같이 가자. 그 사람도 데리고.', "Come to Haegeumgang with me. We'll bring him too."),
        line(B, '그 사람은 안 던질 거야. 자네가 던져.', "He won't cast. You will."),
        line(P, '제가요?', 'Me?'),
        line(B, '초여름 갯바위면 벵에돔이 붙어. 한 마리면 돼.', 'In early summer the largescale blackfish come in on the rocks. One is enough.'),
      ], {
        choices: [
          opt('i_cast', '제가 던질게요. 그분은 보기만 하셔도 돼요', "I'll cast. He can just watch", {
            next: 'i_cast' }),
          opt('ask_accident', '무슨 사고였는데요?', 'What kind of accident was it?', {
            say: ['사고요? 무슨 일이 있었는데요?', 'An accident? What happened?'], next: 'accident' }),
          opt('dangerous_rocks', '위험한 데 아니에요? 그분을 거기로요?', "Isn't that dangerous? Taking him there?", {
            say: ['해금강 갯바위면 위험한 데 아니에요? 그분을 거기로요?', "The Haegeumgang rocks — isn't that a dangerous place? You're taking him there?"], next: 'dangerous' }),
        ],
        note: ['거제에서 바람 씨가 갯바위 사고 뒤로 낚시를 끊은 사람 이야기를 했다. 그 사람을 데리고 해금강에 가자고, 그 사람은 안 던질 테니 내가 던지라고 했다. 초여름 갯바위의 벵에돔 한 마리면 된다고.',
          "In Geoje, Baram told me about a man who gave up fishing after an accident on the rocks. We'd take him to Haegeumgang; he wouldn't cast, so I would. One early-summer blackfish off the rocks would be enough."],
      }),
      i_cast: scene([
        line(B, '그래. 보기만 하는 것도 일이야. 그 사람한테는 제일 큰 일이고.', "Good. Watching is work too. For him it's the biggest work there is."),
        line(B, '벵에돔은 예민해. 그림자만 비쳐도 안 물어.', 'Blackfish are skittish. Let your shadow fall on the water and they won\'t bite.'),
        line(P, '발소리부터 줄여야겠네요.', "Then I'd better tread quietly."),
        line(B, '그 사람 앞에서 서두르지 마. 서두르는 거 보면 그 사람은 그날이 생각나.', "And don't rush in front of him. If he sees you rush, he'll remember that day."),
      ], {
        choices: [
          opt('ok', '천천히 하겠습니다', "I'll take it slow", {
            end: endTalk({ accept: true, offer: 'i_cast' }),
            note: ['그 사람 앞에서는 서두르지 않기로 했다. 그림자도 발소리도 줄이고.', "I'd not rush in front of him — keep my shadow off the water and my footsteps quiet."] }),
          opt('feels_mean', '옆에서 혼자 잡으면 얄밉지 않을까요?', "Won't it feel mean, catching fish next to him?", {
            say: ['안 던지는 분 옆에서 혼자 잡으면 좀 얄밉지 않을까요?', "If I catch fish right beside someone who won't cast, won't that seem a bit mean?"], next: 'mean' }),
        ],
        note: ['보기만 하는 것도 그 사람에게는 제일 큰 일이라고 했다. 벵에돔은 예민하니 그림자를 비추지 말고, 그 사람 앞에서 서두르지 말라고.', "Just watching is the biggest work for him, Baram said. Blackfish are skittish — keep my shadow off the water and don't rush in front of him."],
      }),
      mean: scene([
        act(B, 'laugh'),
        line(B, '얄밉지. 그래서 자네가 던지는 거야. 얄미워야 사람이 바다를 다시 봐.', "It is mean. That's why you're the one casting. It takes a bit of envy for a man to look at the sea again."),
        line(B, '잘 낚는 사람 옆에 앉아 있으면 손이 근질거려. 그게 시작이야.', "Sit beside someone catching fish well and your hands start to itch. That's how it begins."),
        line(P, '대는 안 들어도요?', 'Even if he never picks up a rod?'),
      ], {
        end: endTalk({ accept: true, offer: 'feels_mean', lineKo: '안 들어도 돼. 손만 근질거리면 돼.', lineEn: "He doesn't have to. As long as his hands itch." }),
        note: ['혼자 잡으면 얄밉지 않겠느냐고 했더니, 바람 씨는 짧게 웃고 얄미워야 사람이 바다를 다시 본다고 했다. 손이 근질거리면 그게 시작이라고.', "When I asked if it wouldn't seem mean, Baram laughed briefly — it takes a little envy for a man to look at the sea again. Itching hands are the beginning."],
      }),
      accident: scene([
        line(B, '갯바위에서 일이 있었다는 것만 알아. 그 이상은 그 사람 거야.', "All I know is something happened on the rocks. The rest belongs to him.", { act: 'shake_head' }),
        line(B, '묻지 마. 사고 난 사람한테 사고 얘기 시키는 게 제일 잔인한 거야.', "Don't ask. Making someone talk about their accident is the cruellest thing you can do."),
        line(P, '그럼 무슨 얘기를 해야 해요?', 'Then what should I talk about?'),
        line(B, '바다 얘기를 해. 바람이 어느 쪽인지, 물이 어떤지. 그런 건 대답할 수 있으니까.', "Talk about the sea. Which way the wind is blowing, how the water looks. Those he can answer."),
        line(P, '…알겠어요.', '...I understand.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_accident', lineKo: '가자, 해금강으로.', lineEn: "Let's go. To Haegeumgang." }),
        note: ['무슨 사고였느냐고 물었다. 바람 씨는 그 이상은 그 사람 것이라며 묻지 말라고 했다. 대신 바람이나 물때 같은, 대답할 수 있는 바다 얘기를 하라고.', "I asked what the accident was. Baram said the rest was his and not to ask. Talk about the sea instead — the wind, the water — things he can answer."],
      }),
      dangerous: scene([
        line(B, '위험하지. 그래서 거기야.', "It is dangerous. That's why we're going there."),
        line(B, '무서운 데를 피해 다니면 평생 피해 다녀.', "Avoid the place that frightens you and you'll be avoiding it all your life."),
        line(P, '그래도요…', 'Even so...'),
        line(B, '발 디딜 데는 내가 먼저 봐 둘게. 물때 보고, 너울 보고.', "I'll check the footing first. The tide, the swell."),
        line(B, '초여름이라 바위에 이끼가 미끄러워. 그 사람은 그걸 누구보다 잘 알 거야.', "It's early summer, so the moss on the rocks is slippery. He'll know that better than anyone."),
      ], {
        end: endTalk({ accept: true, offer: 'dangerous_rocks' }),
        note: ['위험한 곳에 그 사람을 데려가도 되느냐고 물었다. 바람 씨는 무서운 데를 피하면 평생 피해 다닌다며, 발 디딜 곳은 자기가 먼저 봐 두겠다고 했다.', "I asked whether we should take him somewhere so dangerous. Avoid what frightens you and you avoid it forever, Baram said — he'd check the footing first."],
      }),
    },
  },

  // N01-4 — 끝내는 자리(바람). 그 사람이 뜰채를 잡았다
  {
    id: 'n01_4_done', questId: 'N01-4', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '뜰채 잡았지.', 'He took the landing net.'),
        line(P, '네. 벵에돔이 올라오니까 처음으로 바다 쪽을 보시더라고요.', 'Yes. When the blackfish came up, he looked at the sea for the first time.'),
        line(B, '절벽 아래를 오래 봤어.', 'He looked down the cliff a long while.', { act: 'look_sea' }),
        line(P, '대는 아직 안 드셨어요.', "He still didn't pick up a rod."),
        line(B, '그거면 돼. 다음엔 대를 들지도 몰라.', "That's enough. Next time he might."),
      ], {
        choices: [
          opt('lesson', '그분한테 발 딛는 법을 배웠어요', 'I learned how to keep my footing from him', {
            say: ['갯바위 발 딛는 법을 그분한테 배웠어요. 사고 난 분이 더 잘 아시더라고요.', "I learned how to keep my footing on the rocks from him. Someone who's had an accident knows better."],
            end: endTalk({ complete: 'lesson', lineKo: '그렇지. 잃어 본 사람이 제일 잘 알아. 젖은 데는 안 밟고, 바다 쪽으로 등 안 돌리고. 비싸게 배운 걸 자네한테 공짜로 보여 준 거야.',
              lineEn: "That's right. Those who've lost know best. Don't step on the wet parts, never turn your back to the sea. He paid dearly for that and showed it to you for free." }),
            note: ['그 사람에게 갯바위 발 딛는 법을 배웠다고 했다. 젖은 데는 밟지 않고, 바다 쪽으로 등을 돌리지 않는 것. 비싸게 배운 것을 공짜로 보여 준 거라고 했다.', "I said I'd learned my footing on the rocks from him: never step on the wet parts, never turn your back to the sea. He paid dearly for that, Baram said, and showed me for free."] }),
          opt('pay', '해금강까지 온 여비는 주세요', 'I\'ll take my fare out to Haegeumgang', {
            end: endTalk({ complete: 'pay', lineKo: '리어카에 있어. 거제까지 온 다리가 공짜일 순 없지. …그 사람 뜰채 잡은 거, 자네도 봤지. 그건 내가 못 주는 거야.',
              lineEn: "It's in the cart. Legs that came all the way to Geoje can't be free. ...You saw him take the net. That's something I can't give." }),
            note: ['여비를 받았다. 바람 씨는 서랍을 열다 말고 해금강 쪽을 한 번 돌아봤다.', 'I took my fare. Baram paused with the drawer half open and looked back toward Haegeumgang.'] }),
          opt('decline', '뜰채 잡은 손 봤으면 됐어요', 'Seeing his hand on the net was enough', {
            end: endTalk({ complete: 'decline', lineKo: '…바람이 좋은 쪽으로 불었네. 그 말, 그 사람한테도 해 줘. 잃어 본 사람은 자기가 다시 잡은 걸 잘 못 봐.',
              lineEn: "...The wind blew the right way. Tell him that too. People who've lost something rarely see what they've taken hold of again." }),
            note: ['값은 사양했다. 바람 씨는 그 말을 그 사람에게도 해 주라고 했다. 잃어 본 사람은 자기가 다시 잡은 걸 잘 못 본다고.', "I turned the money down. Baram said to tell him the same — people who've lost something rarely see what they've grasped again."] }),
          opt('bite_eye', '벵에돔 입질, 더 빨리 알아보고 싶어요', 'I want to read a blackfish bite faster', {
            say: ['벵에돔 입질, 다음엔 더 빨리 알아보고 싶어요.', 'Next time, I want to read a blackfish bite faster.'], next: 'bite' }),
        ],
        note: ['그 사람이 뜰채를 잡았다. 벵에돔이 올라오자 처음으로 바다를 보고 절벽 아래를 오래 봤다. 대는 아직 들지 않았지만, 바람 씨는 그거면 된다고 했다.', "He took the landing net. When the blackfish came up he looked at the sea for the first time and stared down the cliff a long while. He didn't pick up a rod yet, but Baram said that was enough."],
      }),
      bite: scene([
        line(B, '찌가 들어가는 걸 보지 말고 멈추는 걸 봐.', "Don't watch for the float going under. Watch for it stopping."),
        line(P, '멈추는 걸요?', 'Stopping?'),
        line(B, '벵에돔은 물었다 뱉는 놈이야. 찌가 멈칫할 때가 문 때야.', "A blackfish takes it and spits it out. The moment the float hesitates, that's the bite."),
      ], {
        end: endTalk({ complete: 'bite_eye', lineKo: '예민한 놈은 예민하게 상대해. 그 사람이 뜰채 잡을 때처럼. 천천히, 근데 놓치지 않게.',
          lineEn: "Treat a skittish fish skittishly. The way he took the net. Slowly, but without letting go." }),
        note: ['입질을 더 빨리 알아보고 싶다고 했다. 찌가 들어가는 게 아니라 멈칫하는 걸 보라고, 벵에돔은 물었다 뱉는다고 했다. 내 찌를 더 가벼운 것으로 바꿔 주었다.', "I said I wanted to read the bite faster. Watch for the float hesitating, not sinking, he said — a blackfish takes and spits. He swapped my float for a lighter one."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N01-6 「막배를 놓친 남자」 받는 자리(바람 · 울릉 · 결항 · 출장객) — 「나는 이제 짐이 적어도 돼」(까닭은 다음 편)
  // ═══════════════════════════════════════════
  {
    id: 'n01_6_offer', questId: 'N01-6', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '결항이야. 오늘 배 안 떠.', "The ferry's cancelled. Nothing sails today.", { act: 'look_sea' }),
        line(P, '저도 방금 들었어요. 내일은 뜰까요?', 'I just heard. Will it sail tomorrow?'),
        line(B, '바다가 정하지.', 'The sea decides.'),
        line(B, '출장 온 사람 하나가 묶였어. 육지에 급한 일이 있다는데.', "There's a man here on business who's stuck. Says he has urgent business on the mainland."),
        line(P, '많이 초조하시겠네요.', 'He must be on edge.'),
        line(B, '같이 하룻밤 있어 줘.', 'Spend the night with him.'),
        line(P, '하룻밤이요?', 'The night?'),
        line(B, '그리고 이 가방, 자네가 써.', 'And this bag — you use it.'),
        line(P, '네? 이건 바람 씨가 메고 다니시던 거잖아요.', "What? That's the one you always carry."),
        line(B, '나는 이제 짐이 적어도 돼.', "I don't need much baggage any more."),
      ], {
        choices: [
          opt('stay_night', '같이 있을게요. 밤새 말동무해 드리죠', "I'll stay. I'll keep him company all night", {
            next: 'stay' }),
          opt('ask_bag', '쓰시던 가방을 왜 저한테요?', 'Why give me your own bag?', {
            say: ['가방을요? 쓰시던 거잖아요. 왜 저한테요?', "The bag? But it's yours. Why me?"], next: 'bag' }),
          opt('ask_traveller', '그 출장객분은 어떤 사람인데요?', "What's he like, this man on business?", {
            next: 'traveller' }),
        ],
        note: ['울릉도에서 배가 결항했다. 바람 씨는 육지에 급한 일이 있는 출장객이 묶였다며, 같이 하룻밤 있어 달라고 했다. 그러면서 자기 가방을 내게 쓰라고 했다. 이제 짐이 적어도 된다고.',
          "The ferry from Ulleungdo was cancelled. Baram said a man on business with urgent matters on the mainland was stranded, and asked me to spend the night with him. Then he told me to use his bag — he didn't need much baggage any more."],
      }),
      stay: scene([
        line(B, '그래. 결항 난 밤은 길어. 배가 안 뜨는 섬에선 시간도 안 가.', "Good. A night with no ferry is long. On an island where the boats don't sail, even time stops."),
        line(B, '아침에 배 뜨면 그 사람은 가. 그 전까지만 옆에 있어.', "When the ferry sails in the morning, he goes. Just stay by him until then."),
        line(P, '낚싯대라도 하나 쥐여 드릴까요?', 'Should I put a rod in his hands?'),
        line(B, '좋지. 손이 바쁘면 걱정이 좀 덜어지거든.', 'Good idea. Busy hands lighten a worried mind.'),
      ], {
        choices: [
          opt('ok', '네. 낚싯대 챙겨 갈게요', "Right. I'll bring a rod", {
            end: endTalk({ accept: true, offer: 'stay_night' }),
            note: ['그 사람에게 낚싯대를 하나 쥐여 주고 아침까지 옆에 있기로 했다.', "I'd put a rod in his hands and stay beside him until morning."] }),
          opt('me_too', '저도 묶인 건데요. 저는 누가 있어 줘요?', "I'm stuck too. Who stays with me?", {
            say: ['결항이면 저도 묶인 건데요. 저는 누가 같이 있어 줘요?', "If the ferry's cancelled, I'm stuck too. Who stays with me?"], next: 'me_too' }),
        ],
        note: ['결항 난 밤은 길다며, 아침에 배가 뜰 때까지만 옆에 있어 달라고 했다. 손이 바쁘면 걱정이 덜어진다고.', 'A night with no ferry is long, Baram said — just stay with him until the morning boat. Busy hands lighten worry.'],
      }),
      me_too: scene([
        line(B, '나.', 'Me.', { act: 'look_up' }),
        line(B, '오늘 밤은 나도 여기 있어.', "Tonight I'm here too."),
        line(P, '…', '...'),
        line(B, '섬에 묶이는 게 나쁜 것만은 아니야. 갈 데가 없으면 있는 데를 보게 돼. 그 사람도, 자네도.', "Being stranded on an island isn't all bad. With nowhere to go, you start seeing where you are. Him, and you."),
      ], {
        end: endTalk({ accept: true, offer: 'me_too', lineKo: '의자 하나 더 가져와.', lineEn: 'Bring one more chair.' }),
        note: ['나도 묶인 건데 누가 같이 있어 주느냐고 했더니, 바람 씨는 나를 보며 자기라고 했다. 갈 데가 없으면 있는 데를 보게 된다고.', "When I asked who would stay with me, since I was stranded too, Baram looked at me and said: him. With nowhere to go, you see where you are."],
      }),
      bag: scene([
        line(B, '쓰던 거니까 주는 거야. 새 거는 아무나 줄 수 있어.', "I'm giving it because it's been used. Anyone can give a new one."),
        line(P, '그래도…', 'Still...'),
        line(B, '왜냐고는 묻지 마. 아직은.', "Don't ask why. Not yet.", { act: 'shake_head' }),
        line(B, '무게나 재 봐. 리어카보다 가볍지?', "Feel the weight. Lighter than a cart, isn't it?"),
        line(P, '…네. 가볍네요.', "...Yes. It's light."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_bag', lineKo: '그거면 돼. 오늘 밤은 그 사람 옆에 있어 줘.', lineEn: "That's all it needs to be. Tonight, stay with him." }),
        note: ['왜 쓰던 가방을 주느냐고 물었다. 쓰던 거라서 준다고, 왜냐고는 아직 묻지 말라고 했다. 들어 보니 리어카보다 가벼웠다.', "I asked why he'd give me his own bag. Because it's been used, he said, and not to ask why yet. It was lighter than a cart."],
      }),
      traveller: scene([
        line(B, '짐이 많은 사람이야. 가방에, 서류 봉투에.', "A man with a lot of baggage. Bags, envelopes of papers."),
        line(B, '저기 편의점 창가에 넥타이 푼 사람.', "That one by the convenience-store window, with his tie loosened.", { act: 'look_away' }),
        line(P, '오늘 꼭 가셔야 했나 봐요.', 'He must have had to go today.'),
        line(B, '못 가. 오늘은 바다가 안 보내 줘.', "He can't. The sea won't let him today."),
        line(B, '그걸 받아들이는 데 하룻밤이 걸려. 그 밤을 같이 있어 주는 거야.', 'It takes a night to accept that. We keep him company through that night.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_traveller' }),
        note: ['출장객이 어떤 사람이냐고 물었다. 가방에 서류 봉투에 짐이 많은 사람이라고 했다. 바다가 안 보내 주는 걸 받아들이는 데 하룻밤이 걸린다고, 그 밤을 같이 있어 주자고.', "I asked about the man. Lots of baggage, Baram said — bags, envelopes of papers. It takes a night to accept that the sea won't let you go, and we'd keep him company through it."],
      }),
    },
  },

  // N01-6 — 끝내는 자리(바람). 아침 배가 떴다 · 가방은 내 것이 됐다
  {
    id: 'n01_6_done', questId: 'N01-6', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '아침이네. 그 사람 배 탔어.', "It's morning. He got on the ferry.", { act: 'look_sea' }),
        line(P, '네. 밤새 이야기 많이 하셨어요. 집 얘기, 일 얘기.', 'Yes. He talked a lot through the night. About home, about work.'),
        line(B, '짐 많은 사람은 할 얘기도 많아.', 'People with a lot of baggage have a lot to say.'),
        line(P, '이 가방은…', 'About this bag...'),
        line(B, '가방은 자네 거야.', "The bag's yours."),
        line(B, '나는… 다음 항구에서 봐.', "I'll... see you at the next harbour."),
      ], {
        choices: [
          opt('why_less', '왜 짐이 적어도 되세요?', "Why don't you need much baggage?", {
            next: 'less' }),
          opt('lesson', '가방 싸는 법, 배워야겠어요', 'I should learn how to pack a bag', {
            say: ['가방 싸는 법, 바람 씨한테 배워야겠어요.', 'I should learn how to pack a bag from you.'],
            end: endTalk({ complete: 'lesson', lineKo: '무거운 건 아래. 자주 쓰는 건 위. 그리고 한 철 동안 안 쓴 건 빼. 짐은 사는 걸로 가벼워지지 않아. 내려놓는 걸로 가벼워져.',
              lineEn: "Heavy things at the bottom. Things you use often on top. And anything you haven't used in a season, take out. Buying never makes a load lighter. Putting things down does." }),
            note: ['가방 싸는 법을 배웠다. 무거운 건 아래, 자주 쓰는 건 위, 한 철 안 쓴 건 빼라고. 짐은 내려놓는 걸로 가벼워진다고 했다.', "I learned to pack a bag: heavy at the bottom, often-used on top, and take out what you haven't used in a season. A load gets lighter by putting things down."] }),
          opt('decline', '가방은 받을게요. 하룻밤 값은 됐어요', "I'll take the bag. The night was free", {
            end: endTalk({ complete: 'decline', lineKo: '…바람이 좋은 쪽으로 불었네. 그 사람이 배에 타면서 자네를 한 번 돌아봤어. 봤지? 그게 하룻밤 값이야.',
              lineEn: "...The wind blew the right way. When he got on the boat, he turned back and looked at you once. You saw? That's the price of the night." }),
            note: ['하룻밤 값은 사양했다. 그 사람이 배에 타면서 나를 한 번 돌아봤다. 바람 씨는 그게 하룻밤 값이라고 했다.', 'I turned down payment for the night. The man looked back at me once as he boarded. Baram said that was the price of the night.'] }),
          opt('pay', '하룻밤 품삯은 받을게요', "I'll take wages for the night", {
            say: ['하룻밤 품삯은 받을게요. 가방은 감사히 쓰고요.', "I'll take wages for the night. And I'll put the bag to good use, thank you."],
            end: endTalk({ complete: 'pay', lineKo: '그래. 리어카에 있어. 밤새 남의 걱정 들어 준 값이야. 나는 이제 짐도 돈도 적어도 되니까. …그 얘긴 다음 항구에서.',
              lineEn: "Right. It's in the cart. Payment for listening to someone's worries all night. I don't need much baggage or money any more. ...That's a talk for the next harbour." }),
            note: ['품삯을 받았다. 리어카 서랍에 든 게 전보다 적었다.', 'I took wages. There was less in the cart drawer than before.'] }),
        ],
        note: ['아침에 배가 떴고 그 사람도 탔다. 바람 씨는 가방은 내 거라며, 다음 항구에서 보자고 했다.', "The morning ferry sailed and the man was aboard. Baram said the bag was mine, and that he'd see me at the next harbour."],
      }),
      less: scene([
        act(B, 'silence'),
        line(B, '…다음 항구에서 말해 줄게. 속초야.', "...I'll tell you at the next harbour. Sokcho."),
        line(P, '속초요?', 'Sokcho?'),
        line(B, '궁금하면 속초에서 다시 물어. 그때는 대답할게.', "If you still want to know, ask me again in Sokcho. I'll answer then."),
        line(P, '(가방 안주머니에 이름 없는 명찰이 하나 들어 있었다. …그건 묻지 않기로 했다.)', "(There's a name tag with no name in the bag's inner pocket. ...I decided not to ask about that.)"),
      ], {
        end: endTalk({ complete: 'why_less', lineKo: '지금은 그 사람 배 떠나는 거나 보자.', lineEn: "For now, let's just watch his boat leave." }),
        note: ['왜 짐이 적어도 되느냐고 물었다. 바람 씨는 속초에서 다시 물으면 대답하겠다고 했다. 가방 안주머니에 이름 없는 명찰이 하나 있었지만, 묻지 않았다.', "I asked why he needed so little. Ask again in Sokcho and he'd answer, Baram said. There was a name tag with no name in the bag's inner pocket, but I didn't ask."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N01-7 「이름」 받는 자리(바람 · 속초) — 서른 해 전 배와 사람을 잃었다. 이름 자체는 그 자리에서(목표 대화)
  // ═══════════════════════════════════════════
  {
    id: 'n01_7_offer', questId: 'N01-7', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '왔나.', "You're here.", { act: 'look_up' }),
        line(P, '오늘은 리어카를 세워 두셨네요.', "You've left the cart parked today."),
        line(B, '오늘은 안 끌어. 할 얘기가 있어서.', "I'm not pulling it today. I've something to tell you."),
        line(P, '무슨 얘기요?', 'What is it?'),
        act(B, 'silence'),
        line(B, '…이름을 말해 주려고.', "...I'm going to tell you my name."),
        line(P, '바람 씨 이름이요?', 'Your name?'),
        line(B, '그 전에 들어 둘 게 있어. 서른 해 전에 배를 잃었어. 사람도.', "Before that, there's something you should hear. Thirty years ago I lost a boat. And men.", { act: 'look_sea' }),
        line(P, '…배를요?', '...A boat?'),
        line(B, '선장이었지. 리어카로 항구를 돈 건, 그 사람들 가족을 찾으려고.', "I was the captain. I went round the harbours with the cart to find their families."),
        line(B, '재개관식에 앉을게. 처음으로.', "I'll sit at the reopening. For the first time."),
        line(B, '그 전에, 서른 해 전 내가 서 있던 자리에서 한 마리만 같이 하자. 그러고 나면 이름을 말할게.', "Before that, let's catch one fish together, where I stood thirty years ago. After that, I'll tell you my name."),
      ], {
        choices: [
          opt('keep_seat', '재개관식 자리, 꼭 마련할게요', "I'll make sure there's a seat for you", {
            say: ['말씀해 주셔서 고맙습니다. 재개관식에 자리 꼭 마련할게요.', "Thank you for telling me. I'll make sure there's a seat for you at the reopening."], next: 'seat' }),
          opt('ask_families', '그 가족들은… 다 찾으셨어요?', 'Those families... did you find them all?', {
            next: 'families' }),
          opt('ask_place', '그 자리가 어딘데요?', 'Where is that spot?', {
            say: ['서른 해 전 서 계셨던 자리요? 거기가 어딘데요?', 'Where you stood thirty years ago? Where is it?'], next: 'place' }),
          opt('heavy_name', '그런 이름을 제가 들어도 될까요?', 'Is it right for me to hear a name like that?', {
            say: ['그렇게 무거운 이름을 제가 들어도 되는 건가요?', 'Is it really right for me to hear a name that heavy?'], next: 'heavy' }),
        ],
        note: ['속초에서 바람 씨가 리어카를 세워 두고 이름을 말해 주겠다고 했다. 서른 해 전 배와 사람을 잃은 선장이었고, 리어카로 항구를 돈 건 그 가족들을 찾으려고였다. 재개관식에 처음으로 앉겠다며, 그 전에 그가 서 있던 자리에서 한 마리만 같이 하자고 했다.',
          "In Sokcho Baram parked his cart and said he'd tell me his name. Thirty years ago he was a captain who lost his boat and his men; he'd pulled the cart round the harbours looking for their families. He'd sit at the reopening for the first time — but first, one fish together where he once stood."],
      }),
      seat: scene([
        line(B, '자리는 끝자리면 돼. 문 가까운 데.', "The end seat will do. One near the door."),
        line(B, '서른 해 동안 그런 자리엔 안 앉았어. 이번엔 앉아 볼게.', "For thirty years I never sat in a seat like that. This time I'll try."),
        line(P, '그럼 그 자리부터 가 봐요.', "Then let's go to that spot first."),
      ], {
        end: endTalk({ accept: true, offer: 'keep_seat' }),
        note: ['재개관식에 자리를 마련하겠다고 했다. 바람 씨는 문 가까운 끝자리면 된다고, 서른 해 동안 그런 자리엔 앉지 않았다고 했다.', "I promised him a seat at the reopening. The end seat by the door would do, he said — he hadn't sat in one like it for thirty years."],
      }),
      families: scene([
        act(B, 'silence'),
        line(B, '…그 얘긴 오늘 다 못 해. 서른 해 치야.', "...I can't tell all that today. It's thirty years' worth."),
        line(B, '찾은 것보다 찾으러 다닌 게 길었다는 것만 알아 둬.', "Just know the searching lasted longer than the finding."),
        line(P, '…네.', '...Yes.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_families', lineKo: '오늘은 그 자리에 가 보는 걸로 충분해.', lineEn: "Today, going to that spot is enough." }),
        note: ['그 가족들을 다 찾았느냐고 물었다. 바람 씨는 오래 말이 없다가, 찾은 것보다 찾으러 다닌 게 길었다는 것만 알아 두라고 했다.', "I asked if he'd found all the families. After a long silence he said only that the searching had lasted longer than the finding."],
      }),
      place: scene([
        line(B, '따라와. 말로 하면 멀어.', "Follow me. It's far, if I try to say it."),
        line(P, '(리어카는 두고 걷는다. 리어카 없이 걷는 걸 처음 본다.)', "(He leaves the cart and walks. It's the first time I've seen him walk without it.)"),
        line(B, '서른 해 전에 거기 서 있었어. 오늘은 자네가 던져.', "Thirty years ago I stood there. Today, you cast."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_place', lineKo: '나는 옆에 서 있을게. 그거면 돼.', lineEn: "I'll stand beside you. That's enough." }),
        note: ['그 자리가 어디냐고 물었더니, 말로 하면 멀다며 앞장섰다. 리어카 없이 걷는 걸 처음 봤다. 오늘은 내가 던지고 자기는 옆에 서 있겠다고 했다.', "When I asked where the spot was, he said it was too far to say and led the way. I'd never seen him walk without the cart. Today I'd cast; he'd stand beside me."],
      }),
      heavy: scene([
        line(B, '들어도 돼. 들을 사람이 필요했어.', "You may. I needed someone to hear it."),
        line(B, '처음 만난 날 자네가 이름을 물었지. 바람이라고만 했고. 그 뒤로 자네는 다시 안 물었어.', "The day we met you asked my name. I only said Baram. And you never asked again."),
        act(B, 'laugh'),
        line(B, '그래서 자네한테 말하는 거야. 이름은 무거워도 둘이 들면 좀 낫겠지.', "That's why I'm telling you. A name may be heavy, but two can carry it easier."),
      ], {
        end: endTalk({ accept: true, offer: 'heavy_name', lineKo: '가자. 그 자리부터.', lineEn: "Let's go. That spot first." }),
        note: ['그렇게 무거운 이름을 내가 들어도 되느냐고 물었다. 바람 씨는 처음 만난 날 이름을 물은 뒤로 내가 다시 묻지 않았다며 작게 웃었다. 이름은 무거워도 둘이 들면 낫다고.', "I asked whether I had the right to hear a name so heavy. Baram smiled a little — since the day we met I'd never asked again. A heavy name is easier carried by two."],
      }),
    },
  },

  // N01-7 — 끝내는 자리(바람). 재개관식 끝자리에 앉았다
  {
    id: 'n01_7_done', questId: 'N01-7', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '앉았네. 서른 해 만에.', 'I sat down. After thirty years.'),
        line(P, '끝자리, 문 가까운 데요.', 'The end seat, near the door.'),
        line(B, '자네 덕이야.', 'Thanks to you.'),
        line(P, '저는 자리만 마련했는걸요.', 'All I did was find you a seat.'),
        line(B, '바람이 좋은 쪽으로 불었어.', 'The wind blew the right way.', { act: 'look_sea' }),
      ], {
        choices: [
          opt('name', '이름, 조행록에 적을게요', "I'll write your name in my log", {
            next: 'name' }),
          opt('lesson', '항구를 도는 법을 배우고 싶어요', 'I want to learn how to travel the harbours', {
            say: ['항구를 도는 법, 서른 해 치를 배우고 싶어요.', 'I want to learn how to travel the harbours — thirty years of it.'],
            end: endTalk({ complete: 'lesson', lineKo: '한 항구에 하루. 사람 얼굴부터. 그리고 떠날 때는 인사하고 떠나. 바람처럼 왔다 가면 사람들이 얼굴을 못 외워. 자네는 이름 있는 사람으로 다녀.',
              lineEn: "One day to a harbour. Faces first. And when you leave, say goodbye. Come and go like the wind and people never learn your face. You travel as someone with a name." }),
            note: ['항구를 도는 법을 물었다. 한 항구에 하루, 사람 얼굴부터, 떠날 때는 인사하고 떠나라고 했다. 나는 이름 있는 사람으로 다니라고.', "I asked how to travel the harbours. A day to each, faces first, and say goodbye when you leave, he said. I should travel as someone with a name."] }),
          opt('decline', '앉으신 걸 봤으면 됐어요', 'Seeing you sit down was enough', {
            end: endTalk({ complete: 'decline', lineKo: '…바람이 좋은 쪽으로. 마지막이야, 이 말. 이제 그 말은 자네가 해. 누가 한 마리로 매듭을 풀면, 옆에서 한마디만. 그 말 하나면 사람이 하루를 버텨.',
              lineEn: "...The right way. That's the last time I say it. From now on, you say it. When someone unties a knot with one fish, just say those words beside them. One line like that gets a person through a day." }),
            note: ['값은 사양했다. 바람 씨는 그 말은 이제 내가 하라고 했다. 바람이 좋은 쪽으로 불었다고.', 'I turned it down. Baram said those words were mine to say now — the wind blew the right way.'] }),
          opt('sashimi_table', '품삯으로 상에 회 한 접시 더 올릴게요', "I'll use the wages for another plate of sashimi", {
            say: ['품삯은 받아서, 재개관식 상에 회 한 접시 더 올릴게요.', "I'll take the wages and put another plate of sashimi on the reopening table."],
            end: endTalk({ complete: 'sashimi_table', lineKo: '…그래. 서랍에 남은 거 다 꺼내 가. 이제 리어카에 돈 넣어 둘 일도 없어. 회 한 접시라. 그 상에 앉을 사람들한테는 그게 제일 좋은 인사야.',
              lineEn: "...All right. Take everything left in the drawer. I won't need to keep money in the cart any more. A plate of sashimi. For the people at that table, there's no better greeting." }),
            note: ['품삯으로 재개관식 상에 회를 한 접시 더 올리겠다고 했다. 리어카 서랍이 처음으로 비었다.', 'I said I would put another plate of sashimi on the reopening table with the wages. The cart drawer was empty for the first time.'] }),
        ],
        note: ['바람 씨가 서른 해 만에 재개관식 끝자리에 앉았다. 자네 덕이라고, 바람이 좋은 쪽으로 불었다고 했다.', 'After thirty years, Baram sat in the end seat at the reopening. Thanks to me, he said — the wind blew the right way.'],
      }),
      name: scene([
        line(B, '…적어. 서른 해 만에 어딘가에 적히는 이름이야.', "...Write it. It'll be the first time in thirty years that name is written anywhere."),
        line(B, '맨 끝에 적지 말고 중간쯤 적어. 아직 살아 있는 이름이니까.', "Don't write it at the end. Somewhere in the middle. It's still a living name."),
        line(P, '…네. 중간쯤에요.', '...Yes. In the middle.'),
      ], {
        end: endTalk({ complete: 'name', lineKo: '리어카는 자네가 알아서 해. 끌든 세워 두든. 다리는 이제 자네한테 있어.',
          lineEn: "The cart is yours to decide. Pull it or leave it standing. The legs are yours now." }),
        note: ['그의 이름을 조행록 중간쯤에 적었다. 아직 살아 있는 이름이라서. 바람 씨는 리어카 열쇠를 건네며 이제 안 끈다고 했다.', "I wrote his name in the middle of my log — because it's still a living name. Baram handed me the cart key; he wouldn't be pulling it any more."],
      }),
    },
  },
];
