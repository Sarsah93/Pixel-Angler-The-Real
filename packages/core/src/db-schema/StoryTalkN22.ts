/**
 * @file StoryTalkN22.ts
 * @description 290차 — 곁가지 「하늬 — 손으로 짓는 것」(N22-1 ~ N22-8) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = `StoryTalkN01.ts`(286차 시범).
 *
 * 인물: 하늬(35 · 생활공방(목공 · 수리) 주인 · 짧은 해요체 · 「그쵸?」 · 「~해 봐요」 · 「노동은 노동」 ·
 *   말보다 손 — 대팻밥을 쓸고 손가락으로 세어 보인다 · 가끔 「당신」 · 담배는 피우지 않는다).
 * 주인공은 「하늬 씨」라고 부른다(영어 Ha-nui). 다른 사람은 「정옥선 씨」 · 「탁만수 씨」(N22-8 집들이).
 * 받는 끝은 옛 받는 답(`end.offer`)에, 끝내는 끝은 옛 보상 답(`end.complete`)에 묶는다 — 옛 표시(`choice.n22_*`)는 묶인 답이 남긴다.
 * 새 표시는 만들지 않는다. 물러서는 길: N22-1 「오늘은 구경만」(미루기) · N22-4 옛 미루는 답 · N22-6 「무서워서 못 가겠다」(거절 = 실패).
 * 몸짓 `give`는 실제로 물건이 오가는 곳만 — N22-2 품삯(원줄 한 타래) · N22-7 받을 때(씨앗 봉투).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const HN = 'ha_nui';
const P = 'player';

export const TALKS_N22: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N22-1 「작업대를 세우다」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_1_offer', questId: 'N22-1', at: 'offer', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '어서 와요. 대팻밥 날리니까 문 앞 말고 이쪽에 서요.', "Come in. Shavings fly around here, so don't stand by the door — over this way.", { act: 'look_up' }),
        line(P, '여기 공방이에요? 간판만 보고 들어와 봤어요.', 'Is this a workshop? I just saw the sign and came in.'),
        line(HN, '생활공방이요. 고치는 것도 하고, 만드는 것도 해요. 저는 하늬예요.', "A maker's workshop. I fix things and I make things. I'm Ha-nui."),
        line(P, '낚시 소품 같은 것도 파세요? 봉돌 틀이나, 장비 올려 둘 선반 같은 거요.', 'Do you sell fishing things too? A sinker mold, or a shelf to keep tackle on?'),
        line(HN, '그런 건 시내 가게에 더 많아요. 사서 쓰는 것도 방법이에요.', 'Shops in town have more of that. Buying is one way to go.'),
        line(P, '…여기서는 안 파세요?', "...You don't sell them here?"),
        line(HN, '팔긴 하죠. 근데 처음 온 손님한테는 먼저 시켜 보는 게 있어요.', 'I do. But first-time customers, I have them try something first.', { act: 'look_away' }),
        line(P, '뭘요?', 'Try what?'),
        line(HN, '한 번은 만들어 봐야 뭘 사야 할지 알거든요. 저 벽 도면 중에 하나 골라서 만들어 봐요.', 'You have to make one yourself once to know what to buy. Pick a plan off that wall and make it.'),
        line(HN, '다 만들면 그대로 들고 와서 보여 줘요. 작업대는 빌려줄게요.', "When you're done, bring it as it is and show me. I'll lend you a bench."),
        line(P, '(물건 사러 왔다가 숙제를 받았다…)', '(I came in to buy something and got homework...)'),
      ], {
        choices: [
          opt('make', '사기 전에 하나 만들어 보는 거, 해 볼게요', "I'll try making one before buying", {
            say: ['사기 전에 하나 만들어 보는 거, 해 보고 싶어요.', "Making one before buying — I'd like to try that."], next: 'make' }),
          opt('plans', '도면은 보고 따라 하기만 하면 돼요?', 'Do I just follow the plan?', {
            say: ['도면은 어디서 구해요? 그냥 보고 따라 하면 돼요?', 'Where do plans come from? Do I just look and follow along?'], next: 'plans' }),
          opt('doubt', '솔직히 자신이 없는데요', "Honestly, I'm not confident", { next: 'doubt' }),
        ],
        note: ['부산의 한 생활공방에서 하늬 씨를 만났다. 낚시 소품을 사러 들어갔는데, 한 번은 만들어 봐야 뭘 살지 안다며 벽의 도면 중 하나로 무엇이든 만들어 와 보여 달라고 했다.',
          "At a maker's workshop in Busan I met Ha-nui. I went in to buy fishing gear, but she said you only know what to buy once you've made one, and told me to make anything from a plan on her wall and show it to her."],
      }),
      make: scene([
        line(HN, '그쵸? 만들어 보면 파는 물건이 다르게 보여요. 어디에 손이 갔는지 보이거든요.', "Right? Once you've made one, things in shops look different. You can see where the hands went."),
        line(P, '처음이라 뭘 골라야 할지 모르겠어요.', "It's my first time, so I don't know what to pick."),
        line(HN, '쉬운 걸로요. 첫 번째는 어차피 연습이에요. 연습은 아까우면 안 돼요.', "Something easy. The first one is practice anyway. Practice shouldn't be something you'd hate to lose."),
        line(P, '그럼 저 봉돌 틀로 해 볼게요.', "Then I'll try that sinker mold."),
      ], {
        end: endTalk({ accept: true, offer: 'make_first' }),
        note: ['사기 전에 하나 만들어 보겠다고 했다. 하늬 씨는 첫 번째는 연습이니 쉬운 것부터 고르라고 했고, 나는 봉돌 틀을 골랐다.',
          "I said I'd make one before buying. Ha-nui said the first one is practice, so pick something easy, and I chose the sinker mold."],
      }),
      plans: scene([
        line(HN, '처음부터 아는 것도 있고, 가게에서 사는 것도 있어요. 다 만든 물건을 뜯어 보다가 짜임새를 깨치기도 하고요.', 'Some I knew from the start, some I buy at shops. Sometimes you learn the joinery by taking a finished piece apart.'),
        line(P, '그럼 도면만 있으면 누구나 만들 수 있겠네요.', 'So anyone can make it if they have the plan.'),
        line(HN, '도면은 순서만 알려 줘요. 손은 안 알려 줘요.', "A plan only tells you the order. It doesn't tell your hands anything.", { act: 'shake_head' }),
        line(P, '손은요?', 'And the hands?'),
        line(HN, '그건 해 봐야 알아요. 골라 봐요, 아무거나.', 'That you only learn by doing. Go on, pick one. Any one.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_plans' }),
        note: ['도면은 어디서 나느냐고 물었다. 하늬 씨는 도면은 순서만 알려 줄 뿐 손은 해 봐야 안다고 했다.',
          'I asked where plans come from. Ha-nui said a plan only tells you the order; your hands learn by doing.'],
      }),
      doubt: scene([
        line(HN, '뭐가요? 손이요, 시간이요?', 'About what? Your hands, or your time?', { act: 'peer' }),
        line(P, '…둘 다요.', '...Both.'),
        line(HN, '그럼 하나씩 말해 봐요.', 'Then tell me one at a time.'),
      ], {
        choices: [
          opt('clumsy', '손재주가 없어서 재료만 버릴 것 같아요', "I'm clumsy — I'll just waste materials", {
            say: ['제가 손재주가 없어서요. 재료만 버리는 거 아닐까요?', "I'm not good with my hands. Won't I just waste the materials?"], next: 'clumsy' }),
          opt('just_buy', '그냥 사서 쓰면 더 빠르잖아요', "Wouldn't buying be faster?", {
            say: ['그냥 사서 쓰면 안 돼요? 그게 더 빠를 텐데요.', "Can't I just buy one? That'd be faster."], next: 'just_buy' }),
          opt('later', '오늘은 구경만 하고 갈게요', "I'll just look around today", {
            say: ['오늘은 구경만 하고 갈게요. 다음에 다시 올게요.', "I'll just look around today. I'll come back another time."], next: 'later' }),
        ],
      }),
      clumsy: scene([
        line(HN, '버려요. 처음엔 다 버려요.', 'You will. Everyone does at first.', { act: 'nod' }),
        line(P, '…위로가 안 되는데요.', "...That's not very comforting."),
        line(HN, '근데 버린 재료가 제일 많이 가르쳐 줘요. 어디서 틀렸는지 손에 남거든요.', 'But wasted material teaches you the most. Where you went wrong stays in your hands.'),
        line(HN, '재료값은 수업료라고 생각하고, 하나 골라 봐요.', 'Think of the materials as tuition, and pick one.'),
      ], {
        end: endTalk({ accept: true, offer: 'clumsy' }),
        note: ['손재주가 없다고 털어놓았다. 하늬 씨는 처음엔 다 버린다며, 버린 재료가 제일 많이 가르쳐 주니 재료값은 수업료로 치라고 했다.',
          "I admitted I'm clumsy. Ha-nui said everyone wastes material at first, that wasted material teaches the most, and to count it as tuition."],
      }),
      just_buy: scene([
        line(HN, '돼요. 사서 쓰는 것도 방법이라니까요.', "You can. I told you, buying's one way."),
        line(HN, '근데 한 번 만들어 본 사람은 살 때 안 속아요. 이음새를 보거든요.', "But someone who's made one never gets fooled when buying. They look at the joints."),
        line(P, '이음새요?', 'The joints?'),
        line(HN, '나무랑 나무가 만나는 데요. 싼 물건은 거기서 티가 나요. 하나만 만들어 봐요. 그다음엔 사도 돼요.', 'Where wood meets wood. Cheap things give themselves away there. Make just one. After that, buy all you like.'),
      ], {
        end: endTalk({ accept: true, offer: 'just_buy' }),
        note: ['그냥 사면 안 되느냐고 했다. 하늬 씨는 된다면서도, 한 번 만들어 본 사람은 이음새를 보고 사기 때문에 안 속는다고 했다.',
          "I asked why I couldn't just buy one. Ha-nui said I could, but someone who's made one checks the joints and never gets fooled."],
      }),
      later: scene([
        line(HN, '그래요. 도면은 안 도망가요.', "Sure. The plans aren't going anywhere."),
        line(HN, '마음 생기면 와요. 작업대 하나는 늘 비어 있어요.', "Come when you feel like it. There's always a free bench."),
      ], {
        end: endTalk({ decline: true }),
        note: ['오늘은 구경만 하겠다고 했다. 하늬 씨는 도면은 안 도망간다며, 마음이 생기면 오라고 했다.',
          "I said I'd just look around today. Ha-nui said the plans weren't going anywhere — come when I felt like it."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-1 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_1_done', questId: 'N22-1', at: 'complete', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(P, '하늬 씨, 도면 보고 하나 만들어 왔어요.', 'Ha-nui, I made something from one of the plans.'),
        line(HN, '다듬은 거 아니죠? 그대로 줘 봐요.', "You didn't sand it down after, did you? Hand it over as it is.", { act: 'receive' }),
        line(HN, '…여기 모서리, 톱이 두 번 지나갔네요.', '...This corner — the saw went over it twice.', { act: 'peer' }),
        line(P, '티 나요? 마무리가 영 거칠어서 보여 드리기 좀 민망했어요.', 'Does it show? The finish is so rough I was a little embarrassed to bring it.'),
        act(HN, 'laugh'),
        line(HN, '거친 게 정상이에요. 두 번째부터 매끈해져요.', 'Rough is normal. It gets smooth from the second one on.'),
        line(P, '(처음으로 웃는 얼굴을 봤다.)', '(First time I have seen her smile.)'),
        line(HN, '작업대, 이제 세운 거예요.', "That's your bench set up now."),
      ], {
        choices: [
          opt('lesson', '마무리를 매끈하게 하는 법을 배우고 싶어요', 'I want to learn to get a smooth finish', { next: 'lesson',
            note: ['마무리를 매끈하게 하는 법을 물었다.', 'I asked how to get a smooth finish.'] }),
          opt('pay', '재료값은 냈으니 품삯은 받을게요', "I paid for materials, so I'll take a wage", {
            say: ['재료값은 제가 냈으니, 품삯은 받을게요.', "I paid for the materials myself, so I'll take a wage for the work."],
            end: endTalk({ complete: 'pay',
              lineKo: '맞아요. 노동은 노동이죠. 거칠어도 손이 간 건 값이 있어요. 장부 첫 줄에 적어 둘게요. 첫 줄은 오래 남아요.',
              lineEn: "Right. Work is work. Rough or not, anything with hands in it has a value. I'll put you on the first line of my ledger. First lines last." }),
            note: ['품삯을 받았다. 하늬 씨는 공방 장부 첫 줄에 내 이름을 적었다.', 'I took a wage. Ha-nui wrote my name on the first line of her workshop ledger.'] }),
          opt('decline', '배운 게 있으니 그걸로 됐어요', 'I learned something. That is enough', {
            end: endTalk({ complete: 'decline',
              lineKo: '…그 말, 공방 손님 중에 처음이에요. 거친 첫 작품도 버리지 마요. 두 번째 걸 만들 때 옆에 두고 봐요.',
              lineEn: "...You're the first customer to say that. Don't throw away that rough first piece. Keep it beside you when you make the second." }),
            note: ['배운 게 있으니 됐다고 했다. 하늬 씨는 그런 손님은 처음이라며 공방 작업대 한 칸을 내 자리로 내줬다.', "I said what I'd learned was enough. Ha-nui said I was the first customer to say so, and gave me a spot at one of her benches."] }),
          opt('shop_eye', '가게 물건 값이 왜 그런지 알겠어요', 'Now I see why shop prices are what they are', {
            say: ['만들어 보니까 가게 물건 값이 왜 그런지 알겠어요.', 'Having made one, I can see why things in shops cost what they do.'], next: 'shop_eye' }),
        ],
        note: ['도면으로 만든 것을 하늬 씨에게 보여 줬다. 마무리가 거칠었는데, 하늬 씨는 처음으로 웃으며 거친 게 정상이라고, 이제 작업대를 세운 거라고 했다.',
          'I showed Ha-nui what I made from the plan. The finish was rough, but she smiled for the first time and said rough is normal — I had set up my bench now.'],
      }),
      lesson: scene([
        line(HN, '사포 방향이에요. 결을 따라서.', "It's the direction you sand. Along the grain."),
        line(P, '결이요?', 'The grain?'),
        line(HN, '결을 거스르면 나무가 일어나요. 털처럼요.', 'Go against the grain and the wood stands up. Like fur.'),
      ], {
        end: endTalk({ complete: 'lesson',
          lineKo: '손바닥으로 쓸어 봐요. 걸리는 쪽이 거스르는 쪽이에요.',
          lineEn: "Run your palm over it. The way it catches is the way against the grain." }),
        note: ['사포는 결을 따라 미는 거라고 배웠다. 손바닥으로 쓸어서 걸리는 쪽이 거스르는 쪽이다.', 'I learned to sand along the grain. Run a palm over it — the way it catches is against the grain.'],
      }),
      shop_eye: scene([
        line(HN, '맞아요. 이제 살 때 이음새부터 볼 거예요.', "That's it. Now you'll check the joints first when you buy.", { act: 'nod' }),
        line(HN, '비싼 데는 이유가 있고, 싼 데도 이유가 있어요.', "There's a reason something's expensive, and a reason something's cheap."),
        line(P, '그 이유를 알면요?', 'And if you know the reason?'),
      ], {
        end: endTalk({ complete: 'shop_eye',
          lineKo: '덜 내고 더 좋은 걸 사요. 공방 손님한테 제일 먼저 가르치고 싶은 게 그거예요.',
          lineEn: "You pay less and buy better. That's the first thing I want to teach anyone who walks into this workshop." }),
        note: ['만들어 보니 가게 물건 값이 보인다고 했다. 하늬 씨는 그 이유를 아는 사람이 덜 내고 더 좋은 걸 산다고 했다.', 'I said I could see why shop prices are what they are. Ha-nui said people who know why pay less and buy better.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-2 「빈 방」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_2_offer', questId: 'N22-2', at: 'offer', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '왔어요? 지난번에 만든 거, 어디 뒀어요?', 'There you are. The thing you made last time — where did you put it?', { act: 'look_up' }),
        line(P, '방 구석에요. 아직 써 보진 못했어요.', "In a corner of my room. I haven't used it yet."),
        line(HN, '방 구석이요? 요즘은 어디서 자요?', 'In a corner? Where are you sleeping these days?'),
        line(P, '빌린 방이요. 들어가면 씻고 바로 자요.', 'A rented room. I go in, wash, and fall asleep.'),
        line(HN, '방에 뭐 있어요?', "What's in the room?"),
        line(P, '침대랑 가방이요. …그게 다예요.', "A bed and my bag. ...That's it."),
        act(HN, 'silence'),
        line(HN, '자는 데랑 사는 데는 달라요.', "A place you sleep and a place you live aren't the same."),
        line(P, '네?', 'Sorry?'),
        line(HN, '방에 둘 걸 하나 만들어요. 그걸 방에 놓고, 방을 보여 줘요. 딱 하나만요.', 'Make one thing for the room. Put it in your room, and show me the room. Just one.'),
        line(P, '(방에 뭘 둘지라… 생각해 본 적이 없었다.)', "(What to put in my room... I'd never thought about it.)"),
      ], {
        choices: [
          opt('one', '잠만 자던 방이라… 하나부터 놓아 볼게요', "A room I only sleep in... I'll start with one", {
            say: ['잠만 자던 방이라… 하나부터 놓아 볼게요.', "It's a room I only sleep in... I'll start by putting one thing in."], next: 'one' }),
          opt('why', '자는 데랑 사는 데가 어떻게 달라요?', 'How are they different?', {
            say: ['자는 데랑 사는 데가 어떻게 다른데요?', "How is a place you sleep different from a place you live?"], next: 'living' }),
          opt('bed', '침대 하나면 충분하지 않아요?', "Isn't a bed enough?", {
            say: ['침대 하나면 충분하지 않아요? 어차피 자러 들어가는데.', "Isn't a bed enough? I only go in to sleep anyway."], next: 'bed' }),
        ],
        note: ['다시 만난 하늬 씨가 내 방에 뭐가 있느냐고 물었다. 침대와 가방뿐이라고 하자, 자는 데와 사는 데는 다르다며 방에 둘 것을 하나 만들어 놓고 보여 달라고 했다.',
          "When we met again, Ha-nui asked what was in my room. When I said only a bed and a bag, she said a place to sleep isn't a place to live, and asked me to make one thing for the room, put it there, and show her."],
      }),
      one: scene([
        line(HN, '하나요. 처음부터 채우면 방이 숨을 못 쉬어요.', "One. Fill it all at once and the room can't breathe.", { act: 'nod' }),
        line(P, '뭘 놓을지는 어떻게 정해요?', 'How do I decide what to put?'),
        line(HN, '방에 서서 정해요. 아침에 어디서 눈을 뜨는지, 저녁에 어디에 앉고 싶은지.', "Stand in the room and decide. Where you open your eyes in the morning, where you'd want to sit in the evening."),
        line(HN, '그게 답이에요.', "That's your answer."),
      ], {
        end: endTalk({ accept: true, offer: 'one_thing' }),
        note: ['하나부터 놓아 보겠다고 했다. 하늬 씨는 아침에 눈뜨는 자리, 저녁에 앉고 싶은 자리를 보면 답이 나온다고 했다.',
          "I said I'd start with one thing. Ha-nui said the answer is where I wake in the morning and where I'd want to sit in the evening."],
      }),
      living: scene([
        line(HN, '자는 데는 눈 감으면 끝이에요. 사는 데는 눈 뜨고 있는 시간이 있어요.', 'A place you sleep ends when you close your eyes. A place you live has hours with your eyes open.'),
        line(P, '눈 뜨고 있는 시간이요?', 'Hours with my eyes open?'),
        line(HN, '앉아 있고, 뭘 보고, 뭘 만지고. 그 시간이 생기면 방이 사람을 닮아 가요.', 'Sitting, looking at something, touching something. Once those hours exist, the room starts to look like the person.', { act: 'look_away' }),
        line(P, '…저 구석 낡은 의자처럼요?', '...Like that old chair in the corner?'),
        line(HN, '저건 제 거라 저를 닮았죠. 하나부터요.', "That one's mine, so it looks like me. Start with one."),
      ], {
        choices: [
          opt('got_it', '하나부터 해 볼게요', "I'll start with one", { end: endTalk({ accept: true, offer: 'ask_living' }),
            note: ['자는 데와 사는 데의 차이를 들었다. 눈 뜨고 있는 시간이 생기면 방이 사람을 닮아 간다고 했다.', 'I heard the difference between sleeping and living: once there are waking hours in a room, it starts to resemble you.'] }),
          opt('ask_first', '하늬 씨라면 뭘 먼저 놓으세요?', 'What would you put first, Ha-nui?', {
            say: ['뭘 놓을지 모르겠어요. 하늬 씨라면 뭘 먼저 놓으세요?', "I don't know what to put. What would you put first, Ha-nui?"], next: 'first' }),
        ],
        note: ['하늬 씨는 자는 데는 눈 감으면 끝이지만, 사는 데는 앉고 보고 만지는 시간이 있다고 했다. 구석의 낡은 의자는 하늬 씨를 닮아 있었다.',
          "Ha-nui said a place you sleep ends when your eyes close, but a place you live has time spent sitting, looking and touching. The old chair in her corner looked like her."],
      }),
      first: scene([
        line(HN, '제 방 얘기는 반칙이에요.', 'Talking about my room would be cheating.', { act: 'shake_head' }),
        line(HN, '대신 하나만 물을게요. 방에서 제일 오래 있는 데가 어디예요?', 'Instead, let me ask you one thing. Where in the room do you spend the longest?'),
        line(P, '…창가요. 창밖 보면서 채비 묶을 때가 제일 길어요.', '...By the window. Tying rigs while I look outside — that takes the longest.'),
        line(HN, '그럼 거기 놓을 걸 만들어요. 앉는 거든, 올려 두는 거든. 쓰는 데에 놓아야 물건이 살아요.', 'Then make something for there. Something to sit on, something to set things on. Things come alive where they get used.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_first' }),
        note: ['하늬 씨라면 뭘 먼저 놓겠느냐고 물었더니, 자기 방 얘기는 반칙이라며 내가 제일 오래 있는 자리를 물었다. 창가라고 하자, 거기 둘 것을 만들라고 했다.',
          "When I asked what she'd put first, Ha-nui said her room was cheating and asked where I spend the longest. When I said the window, she told me to make something for there."],
      }),
      bed: scene([
        act(HN, 'laugh'),
        line(HN, '그 말 하는 사람들 방은 다 똑같아요. 침대, 가방, 벗어 둔 옷.', 'Everyone who says that has the same room. Bed, bag, clothes on the floor.'),
        line(P, '…벗어 둔 옷까지 맞혔네요.', '...You even got the clothes right.'),
        line(HN, '딱 하나만 놓아 봐요. 그래도 침대만 있는 게 좋으면 그때 빼요. 빼는 건 금방이에요.', 'Try putting in just one thing. If you still prefer only the bed, take it out then. Taking it out is quick.'),
      ], {
        end: endTalk({ accept: true, offer: 'bed_enough' }),
        note: ['침대 하나면 충분하지 않으냐고 했다가 벗어 둔 옷까지 들켰다. 하늬 씨는 하나만 놓아 보고, 그래도 싫으면 그때 빼라고 했다.',
          'I asked if a bed wasn\'t enough and she guessed even the clothes on my floor. Ha-nui said to try one thing, and take it out if I still didn\'t like it.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-2 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_2_done', questId: 'N22-2', at: 'complete', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(P, '하늬 씨, 방에 하나 놓았어요. 직접 만든 의자요.', 'Ha-nui, I put something in my room. A chair I made.'),
        line(HN, '어디에요?', 'Where?', { act: 'look_up' }),
        line(P, '창가요. 채비 묶는 자리에요.', 'By the window. Where I tie my rigs.'),
        line(HN, '앉아 봤어요?', 'Have you sat in it?'),
        line(P, '네. 앉아 보니까 방이 좀 달라 보였어요.', 'Yes. Sitting there, the room looked a little different.'),
        line(P, '잠만 자던 방이, 잠깐 앉아 있는 방이 됐어요.', 'The room I only slept in became a room I sit in for a while.'),
        line(HN, '시작이에요. 방이 사람 같아졌어요.', "That's a start. The room's become like a person.", { act: 'nod' }),
        line(P, '사람 같아요?', 'Like a person?'),
        line(HN, '누가 사는지 보이잖아요. 전에는 안 보였어요.', "You can see who lives there now. Before, you couldn't."),
      ], {
        choices: [
          opt('lesson', '가구 놓는 자리, 왜 거기가 맞는지 배우고 싶어요', 'I want to learn why a spot is right for furniture', {
            end: endTalk({ complete: 'lesson',
              lineKo: '빛이에요. 창에서 들어오는 빛. 빛이 닿는 데에 앉을 걸 두고, 안 닿는 데에 넣어 둘 걸 둬요. 해가 어디로 옮겨 가는지도 한번 봐 두고요.',
              lineEn: 'Light. The light from the window. Put things to sit on where it reaches, and things to store where it doesn\'t. And watch once where the sun moves over the day.' }),
            note: ['가구 자리를 배웠다. 빛이 닿는 데에 앉을 것, 안 닿는 데에 넣어 둘 것.', 'I learned where furniture goes: things to sit on where the light reaches, things to store where it doesn\'t.'] }),
          opt('pay', '조언 값은 제가 드려야 하나요?', 'Should I be paying you for the advice?', {
            say: ['조언 값은 받아야 하는 거 아니에요? 제가 드려야 하나요?', "Shouldn't you get paid for the advice? Should I be paying you?"], next: 'pay' }),
          opt('decline', '방이 달라 보였어요. 그걸로 됐어요', 'The room looked different. That is enough', {
            end: endTalk({ complete: 'decline',
              lineKo: '…그 말이 제가 듣고 싶은 말이었어요. 방이 달라 보였다는 건, 방보다 사람이 달라졌다는 뜻이에요. 의자 하나로요.',
              lineEn: "...That's what I wanted to hear. If the room looked different, it means the person changed more than the room. With one chair." }),
            note: ['방이 달라 보였으니 됐다고 했다. 하늬 씨는 그건 방보다 사람이 달라졌다는 뜻이라며, 손님 명부에 내 방 그림을 붙였다.', 'I said the room looking different was enough. Ha-nui said that meant I had changed more than the room, and pinned a sketch of my room in her customer book.'] }),
          opt('sleep_well', '침대 자리도 봐 주실래요?', 'Could you look at where my bed is, too?', {
            say: ['잠도 좀 더 잘 자고 싶은데, 침대 자리도 봐 주실래요?', "I'd like to sleep better too — could you look at where my bed is?"], next: 'sleep' }),
        ],
        note: ['창가 채비 자리에 직접 만든 의자를 놓았다고 하늬 씨에게 알렸다. 하늬 씨는 시작이라며, 이제 누가 사는 방인지 보인다고 했다.',
          'I told Ha-nui I had put a chair I made by the window where I tie rigs. She said it was a start — now you could see who lived in that room.'],
      }),
      pay: scene([
        line(HN, '아니요, 제가 배웠어요. 사람 방 보는 건 늘 배워요.', "No, I'm the one who learned. Looking at people's rooms always teaches me something.", { act: 'shake_head' }),
        act(HN, 'give', { to: P, item: 'inv_line_nylon3' }),
        line(HN, '대신 이거 가져가요. 손님이 수리값 대신 두고 간 원줄인데, 저보다 당신이 더 잘 쓰겠죠.', 'Take this instead. A customer left this line in place of a repair fee. You\'ll get more use out of it than I will.'),
        line(P, '…이걸 받아도 돼요?', '...Is it all right for me to take this?', { act: 'receive' }),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '의자 하나로 방이 달라지는 걸 보는 게 이 일의 재미예요. 오늘은 제가 덤을 받은 셈이에요.',
          lineEn: "Seeing one chair change a room is the fun of this work. Today I'm the one who got the extra." }),
        note: ['조언 값을 드리려 했더니, 하늬 씨는 오히려 자기가 배웠다며 손님이 두고 간 원줄 한 타래를 건넸다.', 'When I offered to pay for the advice, Ha-nui said she was the one who learned, and handed me a spool of line a customer had left.'],
      }),
      sleep: scene([
        line(HN, '어디 봐요. 침대 머리가 어느 쪽이에요?', "Let's see. Which way is the head of your bed?"),
        line(P, '문 쪽이요.', 'Toward the door.'),
        line(HN, '그래서 그래요. 문이 열릴 때마다 깨요.', "That's why. You wake every time the door opens.", { act: 'nod' }),
      ], {
        end: endTalk({ complete: 'sleep_well',
          lineKo: '벽 쪽으로 돌려요. 창 바로 밑도 피하고요. 바람이 머리로 와요. 잠은 자리가 반이에요.',
          lineEn: 'Turn it toward the wall. And avoid right under the window — the draft comes at your head. Half of sleep is where you lie.' }),
        note: ['침대 머리를 문 쪽에 두면 문이 열릴 때마다 깬다고 했다. 벽 쪽으로 돌리고, 창 바로 밑은 피하라고 했다.', 'Ha-nui said with my head toward the door I would wake whenever it opened. Turn it to the wall, and keep away from right under the window.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-3 「돌을 고르다」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_3_offer', questId: 'N22-3', at: 'offer', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '봉돌, 한 달에 몇 개나 날려요?', 'How many sinkers do you lose in a month?', { act: 'look_up' }),
        line(P, '많이요. 바닥에 걸리면 줄째 끊어 내니까요.', 'Lots. When it snags the bottom, I cut the whole line.'),
        line(HN, '그거 다 돈이잖아요.', "That's all money."),
        line(P, '그러니까요. 봉돌값이 은근히 나가요.', 'Tell me about it. Sinkers add up.'),
        line(HN, '살 돈 아까우면 고르면 돼요.', 'If buying them hurts, pick them.'),
        line(P, '고른다고요? 뭘요?', 'Pick them? Pick what?'),
        line(HN, '돌이요. 무게 맞는 돌은 봉돌 대신 써요. 갯가에서 세 개 골라 오고, 채석 자리에서도 캐 봐요.', 'Stones. A stone of the right weight works in place of a sinker. Pick three on the shore, and try digging at the quarry spot too.'),
        line(P, '채석 자리면 깨서 꺼내야 하는 거죠? 어디를 깨야 해요?', 'At a quarry I have to break them out, right? Where do I break it?'),
        line(HN, '어디를 깨야 나오는지는… 따로 배워요.', "Where to break it so it comes out... that's a separate lesson.", { act: 'look_away' }),
        line(HN, '고른 건 가져와요. 같이 봐요.', "Bring what you pick. We'll look at them together."),
        line(P, '(따로 배운다니, 가르쳐 줄 생각은 있는 모양이다.)', '(A separate lesson — so she does mean to teach me.)'),
      ], {
        choices: [
          opt('pick', '봉돌값 아끼는 거라면 대찬성이에요', "If it saves on sinkers, I'm all for it", {
            say: ['봉돌값 아끼는 거라면 대찬성이에요. 골라 볼게요.', "If it saves on sinkers, I'm all for it. I'll pick some."], next: 'pick' }),
          opt('why_break', '어디를 깨는지는 왜 따로 배워요?', 'Why is breaking a separate lesson?', {
            say: ['어디를 깨야 나오는지는 왜 따로 배워요?', 'Why is where to break it a separate lesson?'], next: 'why_break' }),
          opt('allowed', '갯가 돌은 아무나 주워 가도 돼요?', 'Can anyone just take stones from the shore?', {
            say: ['갯가 돌은 아무나 막 주워 가도 돼요?', 'Can just anyone take stones off the shore?'], next: 'allowed' }),
        ],
        note: ['봉돌값이 아까우면 돌을 고르면 된다고 하늬 씨가 말했다. 갯가에서 무게 맞는 돌 세 개를 고르고, 채석 자리에서도 캐 와서 보여 달라고 했다. 어디를 깨야 나오는지는 따로 배운다고 했다.',
          "Ha-nui said if sinkers cost too much, I could pick stones instead. She asked me to choose three of the right weight on the shore, dig some at the quarry spot too, and bring them to show her. Where to break the rock was a separate lesson, she said."],
      }),
      pick: scene([
        line(HN, '그쵸? 바닥에 걸리면 하루에도 몇 개씩 날아가잖아요.', 'Right? Snag the bottom and you lose several in a single day.'),
        line(HN, '이런 거요. 손에 쏙 들어오고, 한쪽으로 안 쏠리는 거.', "Like this one. Fits right in the hand, doesn't lean to one side."),
        line(P, '…매끈하네요. 이게 갯돌이에요?', "...It's smooth. That's a shore stone?", { act: 'peer' }),
        line(HN, '네. 이런 걸로 세 개요.', 'Yes. Three like this.'),
      ], {
        choices: [
          opt('go', '세 개, 골라 올게요', "I'll pick three", { end: endTalk({ accept: true, offer: 'pick_own' }),
            note: ['하늬 씨가 주머니에서 매끈한 갯돌을 꺼내 보였다. 손에 쏙 들어오고 한쪽으로 안 쏠리는 것으로 세 개를 골라 오기로 했다.', 'Ha-nui took a smooth shore stone from her pocket to show me. I agreed to bring back three that fit the hand and don\'t lean.'] }),
          opt('pretty', '돌 주워서 돈 아끼는 건 처음이네요', 'Saving money by picking up stones is new', {
            say: ['돌 주워서 돈을 아낀다니, 어릴 때 이후로 처음이네요.', "Saving money by picking up stones — first time since I was a kid."], next: 'pretty' }),
        ],
      }),
      pretty: scene([
        line(HN, '어릴 때 주운 돌은 예뻐서 주웠죠? 이번엔 무게 보고 주워요.', 'When you were a kid you picked stones because they were pretty, right? This time pick by weight.'),
        line(P, '예쁜 돌이랑 쓸 돌이 달라요?', 'Pretty stones and useful stones are different?'),
        line(HN, '예쁜 돌은 눈으로 고르고, 쓸 돌은 손으로 골라요. 눈 감고 골라도 돼요.', 'You pick pretty ones with your eyes and useful ones with your hands. You could even pick with your eyes shut.'),
      ], {
        end: endTalk({ accept: true, offer: 'pretty_rocks' }),
        note: ['어릴 때 이후로 돌을 줍는 건 처음이라고 했다. 하늬 씨는 예쁜 돌은 눈으로, 쓸 돌은 손으로 고르는 거라고 했다.', 'I said I hadn\'t picked up stones since I was a kid. Ha-nui said you choose pretty stones with your eyes, and useful ones with your hands.'],
      }),
      why_break: scene([
        line(HN, '그건 손이 먼저 알아야 해서요. 말로 하면 반도 안 전해져요.', 'Because your hands have to know it first. In words, not even half of it gets across.'),
        line(P, '그럼 오늘은 뭐부터요?', "Then what's first today?"),
        line(HN, '고르는 것부터요. 갯가에서 세 개 줍고, 채석 자리에서도 캐 보고요.', 'Picking. Three from the shore, and try digging at the quarry spot.'),
        line(HN, '깨는 건 고른 걸 보고 나서 얘기해요.', "We'll talk about breaking once I've seen what you picked."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_break' }),
        note: ['어디를 깨는지는 왜 따로 배우느냐고 물었다. 손이 먼저 알아야 해서라며, 오늘은 고르는 것부터라고 했다.', 'I asked why breaking was a separate lesson. The hands have to learn it first, she said — today was for picking.'],
      }),
      allowed: scene([
        line(HN, '막은 안 돼요. 필요한 만큼만이요.', 'Not however you like. Only what you need.', { act: 'shake_head' }),
        line(P, '널린 게 돌인데요?', 'There are stones everywhere, though.'),
        line(HN, '바닷가 돌은 파도가 몇 년을 굴려서 만든 거예요. 그래서 세 개예요.', "Shore stones are made by waves rolling them for years. That's why it's three."),
        line(HN, '한 자루 퍼 가는 사람은 봉돌값이 아니라 바닷가를 가져가는 거예요.', "Someone who shovels off a sackful isn't taking sinker money — they're taking the shore."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_allowed' }),
        note: ['갯가 돌을 막 주워도 되느냐고 물었다. 파도가 몇 년을 굴린 돌이라 필요한 만큼, 세 개만이라고 했다.', 'I asked if I could take shore stones freely. They are rolled by waves for years, she said — only what I need, three.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-3 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_3_done', questId: 'N22-3', at: 'complete', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(P, '하늬 씨, 골라 온 돌이에요. 갯가에서 셋, 채석 자리에서 캔 것도 있어요.', 'Ha-nui, here are the stones I picked. Three from the shore, and some I dug at the quarry.'),
        line(HN, '이리 줘 봐요.', 'Let me see.', { act: 'receive' }),
        line(HN, '…이건 되고, 이건 안 돼요.', "...This one works. This one doesn't.", { act: 'peer' }),
        line(P, '왜요? 둘 다 비슷한데요.', 'Why? They look about the same.'),
        line(HN, '손에 들어 보면 알아요. 자, 둘 다 들어 봐요.', "You'll know once you hold them. Here, hold both."),
        line(P, '…이건 한쪽으로 기우네요.', '...This one tips to one side.'),
        line(HN, '그쵸. 두 개 건졌네요.', "Right. You've got two good ones.", { act: 'nod' }),
        line(P, '무게 맞는 돌 고르는 데만 한 시간이 걸렸어요.', 'It took me an hour just to find stones of the right weight.'),
        line(HN, '처음에 한 시간이면 빠른 거예요.', 'An hour, the first time — that\'s fast.'),
      ], {
        choices: [
          opt('lesson', '어디를 깨야 나오는지, 이제 배우고 싶어요', 'Now I want to learn where to break it', {
            say: ['어디를 깨야 나오는지, 이제 그걸 배우고 싶어요.', "Where to break it so it comes out — I'd like to learn that now."],
            end: endTalk({ complete: 'lesson',
              lineKo: '결이에요. 돌도 결이 있어요. 결 따라 치면 한 번에 떨어지고, 거슬러 치면 손만 울려요. 겉에 난 가는 줄무늬가 돌이 갈라지고 싶은 방향이에요.',
              lineEn: "Grain. Stone has grain too. Strike along it and it comes away in one go; strike against it and only your hand rings. The fine stripes on the surface are the way the stone wants to split." }),
            note: ['드디어 깨는 법을 배웠다. 돌에도 결이 있어서, 겉의 가는 줄무늬를 따라 치면 한 번에 떨어진다.', 'At last I learned how to break it. Stone has grain — strike along the fine surface stripes and it comes away in one go.'] }),
          opt('pay', '돌은 제가 캤으니 공방에 팔게요', "I dug them, so I'll sell them to the workshop", {
            say: ['돌은 제가 캤으니, 공방에 팔게요.', "I dug the stones, so I'll sell them to the workshop."],
            end: endTalk({ complete: 'pay',
              lineKo: '살게요. 재료값으로요. 무게가 고른 돌은 찾는 사람이 꼭 있어요. 봉돌값 아까운 사람이 저 말고도 많거든요.',
              lineEn: "I'll buy them. As materials. Stones of even weight always find a buyer. Plenty of people besides me hate paying for sinkers." }),
            note: ['고른 돌을 공방에 팔았다. 공방 장부에 처음으로 매입이 적혔다.', 'I sold the stones to the workshop. It was the first purchase in her ledger.'] }),
          opt('decline', '봉돌값 아꼈으니 됐어요', 'I saved on sinkers. That is enough', {
            end: endTalk({ complete: 'decline',
              lineKo: '아꼈죠. 그게 시작이에요. 아낀 돈보다 고르는 눈이 더 오래가요. 다음에 갯가에 가면 발밑부터 보게 될 거예요.',
              lineEn: "You did. That's the start. The eye for picking lasts longer than the money saved. Next time you're on the shore, you'll look at your feet first." }),
            note: ['봉돌값 아꼈으니 됐다고 했다. 하늬 씨는 공방 재료 선반 한 칸을 내 몫으로 내줬다.', 'I said saving on sinkers was enough. Ha-nui gave me a shelf of my own in the workshop\'s material rack.'] }),
          opt('cast', '봉돌도 직접 부어 보고 싶어졌어요', 'Now I want to cast my own sinkers', {
            say: ['고른 돌을 보니까, 봉돌도 직접 부어 보고 싶어졌어요.', "Seeing these stones, I want to try casting sinkers myself."], next: 'cast' }),
        ],
        note: ['골라 온 돌을 하늬 씨가 손에 들어 보고 두 개를 골라냈다. 되는 것과 안 되는 것은 손에 들어 보면 안다고 했다.',
          'Ha-nui weighed the stones in her hand and picked out two. You can tell what works and what doesn\'t once you hold it, she said.'],
      }),
      cast: scene([
        line(HN, '좋아요. 붓는 건 주석이에요. 녹여서 틀에 부어요.', 'Good. For casting you use tin. Melt it and pour it into a mold.'),
        line(P, '그때 만든 봉돌 틀로요?', 'With the sinker mold I made?'),
        act(HN, 'laugh'),
        line(HN, '그것도 되고요. 근데 돌 고를 때랑 같아요. 무게보다 중심이 먼저예요.', "That'll do. But it's like picking stones. Balance comes before weight."),
      ], {
        end: endTalk({ complete: 'cast_sinker',
          lineKo: '한쪽으로 쏠린 봉돌은 물속에서 돌아요. 줄이 꼬여요. 틀에 부을 때 기포 없이, 고르게요.',
          lineEn: 'A sinker that leans to one side spins in the water. It twists your line. When you pour, no bubbles — keep it even.' }),
        note: ['봉돌도 직접 부어 보고 싶다고 했다. 하늬 씨는 무게보다 중심이 먼저라며, 기포 없이 고르게 부으라고 했다.', 'I said I wanted to cast my own sinkers. Ha-nui said balance comes before weight — pour evenly, with no bubbles.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-4 「한 이랑」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_4_offer', questId: 'N22-4', at: 'offer', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '밑밥 통 냄새가 여기까지 나요.', 'I can smell your chum bucket from here.', { act: 'look_up' }),
        line(P, '아, 죄송해요. 오는 길에 크릴을 좀 샀거든요.', 'Oh, sorry. I bought some krill on the way.'),
        line(HN, '밑밥 재료, 매번 사 오실 거예요?', 'Are you going to buy chum ingredients every time?'),
        line(P, '그럼 어디서 구해요?', 'Where else would I get them?'),
        line(HN, '길러요. 옥수수 한 이랑이면 한 철은 가요.', 'Grow them. One furrow of corn lasts a season.'),
        line(P, '…밑밥을 길러요?', '...Grow chum?'),
        line(HN, '텃밭에 한 이랑, 네 칸 심어 봐요. 그동안 밑밥 재료는 사지 말고 손으로 네 번 모아 오고요.', "Plant one furrow in a vegetable patch — four plots. Meanwhile, don't buy chum ingredients; gather them by hand, four times."),
        line(P, '심고, 모으고… 다 하면요?', 'Plant, gather... and when that\'s done?'),
        line(HN, '심은 거 저한테 보여 줘요. 제대로 섰는지 같이 봐요.', "Show me what you planted. We'll see together whether it took."),
      ], {
        choices: [
          opt('grow', '낚시꾼이 농사라, 해 볼게요', 'An angler farming — I\'ll give it a go', {
            say: ['밑밥 재료를 직접 기른다니… 낚시꾼이 농사라, 해 볼게요.', "Growing my own chum... an angler farming. I'll give it a go."], next: 'grow' }),
          opt('corn', '옥수수가 밑밥이 돼요?', 'Corn works as chum?', {
            say: ['옥수수가 밑밥이 돼요? 크릴만 쓰는 줄 알았어요.', 'Corn works as chum? I thought it was only krill.'], next: 'corn' }),
          opt('dirt', '흙 만지는 건 영 자신이 없는데요', "I'm not great with soil", {
            say: ['흙 만지는 건 영 자신이 없는데요. 손톱에 다 낄 텐데.', "I'm really not confident with soil. It'll get under all my nails."], next: 'dirt' }),
        ],
        note: ['밑밥 재료를 매번 사 올 거냐고 하늬 씨가 물었다. 옥수수 한 이랑이면 한 철은 간다며, 텃밭에 네 칸을 심고 그동안 밑밥 재료를 손으로 네 번 모아 본 뒤 심은 것을 보여 달라고 했다.',
          'Ha-nui asked if I planned to buy chum every time. One furrow of corn lasts a season, she said — plant four plots in a vegetable patch, gather chum ingredients by hand four times meanwhile, and show her what I planted.'],
      }),
      grow: scene([
        line(HN, '낚시꾼이 흙 만지는 거, 이상할 거 없어요. 바다 일도 철 따라 하잖아요.', 'Nothing strange about an angler handling soil. Sea work goes by the seasons too.'),
        line(P, '하긴, 물고기도 철마다 다르니까요.', 'True. The fish change with the seasons too.'),
        line(HN, '네 칸 다 붙이지 말고 사이를 띄워요. 붙으면 서로 뺏어 먹어요.', "Don't cram all four together — leave space. Packed tight, they steal from each other."),
      ], {
        end: endTalk({ accept: true, offer: 'grow_own' }),
        note: ['낚시꾼이 농사라니 해 보겠다고 했다. 하늬 씨는 바다 일도 철 따라 한다며, 네 칸 사이를 띄워 심으라고 했다.', 'I said an angler farming was worth a try. Ha-nui said sea work also follows the seasons, and to leave space between the four plots.'],
      }),
      corn: scene([
        line(HN, '섞어요. 크릴만 뿌리면 금방 흩어지고 잔챙이만 몰려요.', 'You mix it. Krill alone scatters fast and only brings in the small fry.'),
        line(P, '그건 저도 겪어 봤어요.', "I've had that happen."),
        line(HN, '옥수수 알갱이는 무거워서 바닥까지 가라앉아요. 감성돔 같은 놈은 바닥에서 먹거든요.', 'Corn kernels are heavy, so they sink to the bottom. Fish like black porgy feed down there.'),
        line(P, '바닥까지 내려가는 게 있어야 하는구나.', 'So you need something that gets all the way down.'),
        line(HN, '그걸 매번 사면 돈이 꽤 나가요. 한 이랑 심어 봐요.', 'Buying that every time costs a fair bit. Plant a furrow.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_corn' }),
        note: ['옥수수가 밑밥이 되느냐고 물었다. 크릴만 뿌리면 흩어지지만 옥수수는 바닥까지 가라앉아, 바닥에서 먹는 감성돔에게 닿는다고 했다.', 'I asked if corn worked as chum. Krill alone scatters, she said, but corn sinks to the bottom where fish like black porgy feed.'],
      }),
      dirt: scene([
        act(HN, 'laugh'),
        line(HN, '껴요. 비늘도 끼는데 흙이라고 안 끼겠어요?', "It will. Fish scales get in there — why wouldn't soil?"),
        line(HN, '제 손톱 봐요. 나무 가루예요. 씻으면 돼요.', 'Look at my nails. Sawdust. It washes off.'),
        line(HN, '흙도 한 번 만져 보면 바다랑 비슷해요. 물이 들고 나는 때가 있어요.', 'Once you handle soil, it\'s a lot like the sea. There are times the water comes and goes.'),
      ], {
        choices: [
          opt('try', '한 이랑만 해 볼게요', "I'll try one furrow", { end: endTalk({ accept: true, offer: 'dirty_hands' }),
            note: ['흙이 손톱에 낄까 걱정했더니, 하늬 씨가 나무 가루 낀 손톱을 보여 줬다. 흙도 바다처럼 물이 들고 나는 때가 있다고 했다.', 'When I worried about dirt under my nails, Ha-nui showed me hers, full of sawdust. Soil has its tides too, she said.'] }),
          opt('later', '흙은 다음에 만질게요', "I'll handle soil another time", {
            say: ['흙은 다음에 만질게요. 지금은 바다 일이 밀려서요.', "I'll get my hands dirty another time. I'm behind on sea work right now."], next: 'later' }),
        ],
      }),
      later: scene([
        line(HN, '그래요. 씨앗은 기다려 줘요. 철만 안 놓치면요.', "All right. Seeds will wait. As long as you don't miss the season."),
        line(HN, '밑밥 사러 갈 때마다 한 번씩 생각나면, 그때 와요. 이랑은 그대로 있어요.', 'If it crosses your mind each time you go buy chum, come then. The furrow will still be there.'),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['바다 일이 밀려 흙은 다음에 만지겠다고 했다. 하늬 씨는 씨앗은 기다려 준다며, 생각나면 그때 오라고 했다.', 'I said I was behind on sea work and would handle soil another time. Ha-nui said seeds will wait — come when it crosses my mind.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-4 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_4_done', questId: 'N22-4', at: 'complete', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(P, '하늬 씨, 텃밭에 옥수수 한 이랑 심었어요. 네 칸이요.', 'Ha-nui, I planted a furrow of corn in the vegetable patch. Four plots.'),
        line(HN, '간격은요?', 'Spacing?', { act: 'look_up' }),
        line(P, '띄웠어요. 밑밥 재료도 네 번 손으로 모아 봤고요.', 'I spaced them. And I gathered chum ingredients by hand four times.'),
        line(HN, '손 좀 봐요.', 'Let me see your hands.', { act: 'peer' }),
        act(HN, 'laugh'),
        line(HN, '흙이 꼈네요. 낚시꾼 손이 아니라 농사꾼 손 같아요.', "Soil under the nails. Those look like a farmer's hands, not an angler's."),
        line(P, '낚시꾼이 흙을 만지는 게 좀 이상했어요.', 'It felt a bit strange, an angler handling soil.'),
        line(HN, '심었네요. 물 주는 때 적어 드릴게요. 물때표 옆에 붙여요.', "You planted it. I'll write down when to water. Stick it next to your tide table."),
      ], {
        choices: [
          opt('lesson', '농사도 물때가 있네요. 더 배우고 싶어요', 'Farming has its tides too. I want to learn more', {
            end: endTalk({ complete: 'lesson',
              lineKo: '해랑 물이에요. 바다랑 같아요. 해는 못 바꾸니까 물로 맞춰요. 손가락 한 마디만 흙에 넣어 봐요. 마른 데까지가 줄 만큼이에요.',
              lineEn: "Sun and water. Same as the sea. You can't change the sun, so you match it with water. Push one finger-joint into the soil. Down to where it's dry is how much to give." }),
            note: ['농사의 물때를 배웠다. 손가락 한 마디를 흙에 넣어 마른 데까지가 줄 물의 양이다.', 'I learned farming\'s tides: push a finger-joint into the soil — down to where it\'s dry is how much water to give.'] }),
          opt('pay', '씨앗값은 냈으니 노동값은 받을게요', "I paid for the seed, so I'll take a wage", {
            say: ['씨앗값은 제가 냈으니, 노동값은 받을게요.', "I paid for the seed myself, so I'll take a wage for the labor."],
            end: endTalk({ complete: 'pay',
              lineKo: '맞아요. 노동은 노동. 많지는 않아요. 그래도 장부에 텃밭이라는 칸이 생긴 건 처음이에요. 칸이 생기면 계속 적게 돼요.',
              lineEn: "Right. Labor is labor. It isn't much. But it's the first time my ledger's had a column for the garden. Once there's a column, you keep filling it." }),
            note: ['노동값을 받았다. 공방 장부에 처음으로 텃밭 칸이 생겼다.', 'I took a wage for the labor. Her ledger got a garden column for the first time.'] }),
          opt('decline', '한 철 밑밥이 생겼으면 됐어요', "A season's chum is enough", {
            end: endTalk({ complete: 'decline',
              lineKo: '…그렇게 계산하는 사람 좋아요. 돈 말고 철로 세는 사람이요. 한 철 밑밥이면 한 철 낚시죠.',
              lineEn: "...I like people who count like that. In seasons, not money. A season of chum is a season of fishing." }),
            note: ['한 철 밑밥이 생겼으면 됐다고 했다. 하늬 씨는 돈 말고 철로 세는 사람이 좋다며, 공방 뒤 텃밭 한 이랑을 내 몫으로 내줬다.', 'I said a season of chum was enough. Ha-nui said she liked people who count in seasons, and gave me a furrow of her own garden behind the workshop.'] }),
          opt('farm_tip', '옥수수가 잘 크려면 뭘 조심해요?', 'What should I watch for with corn?', {
            say: ['옥수수가 잘 크려면 뭘 조심해야 해요? 하나만 알려 주세요.', 'What should I watch out for so the corn grows well? Just tell me one thing.'], next: 'farm_tip' }),
        ],
        note: ['옥수수 한 이랑을 심고 밑밥 재료도 네 번 모았다고 하늬 씨에게 알렸다. 흙 낀 손을 보더니 웃었다. 물 주는 때를 적어 줄 테니 물때표 옆에 붙이라고 했다.',
          'I told Ha-nui I had planted a furrow of corn and gathered chum four times. She laughed at the dirt under my nails, and said she would write down when to water — to stick next to my tide table.'],
      }),
      farm_tip: scene([
        line(HN, '하나만요? 그럼 이웃이요.', 'Just one? Then neighbors.'),
        line(P, '이웃이요?', 'Neighbors?'),
        line(HN, '옥수수는 혼자 서 있으면 알이 덜 차요. 꽃가루가 옆 포기로 날아가야 하거든요.', "Corn standing alone fills out poorly. The pollen has to fly to the plant next door."),
      ], {
        end: endTalk({ complete: 'farm_tip',
          lineKo: '그래서 한 포기 말고 한 이랑이에요. 키가 크면 바람도 타요. 쓰러진 건 바로 세우고 흙을 북돋아 줘요.',
          lineEn: "That's why it's a furrow, not one plant. Once it's tall it catches the wind. Stand fallen ones up right away and heap soil around them." }),
        note: ['옥수수는 이웃이 있어야 알이 찬다고 배웠다. 그래서 한 포기가 아니라 한 이랑이다.', 'I learned corn needs neighbors to fill out. That is why it is a furrow, not a single plant.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-5 「창가의 수조」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_5_offer', questId: 'N22-5', at: 'offer', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '요즘도 매일 잡고, 재고, 손질해요?', 'Still catching, measuring and cleaning every day?', { act: 'look_up' }),
        line(P, '네. 그게 일이니까요.', "Yes. That's the job."),
        line(HN, '그럼 하나쯤은 그냥 보는 게 있어야 해요.', 'Then you need one thing you just look at.'),
        line(P, '그냥 보는 거요?', 'Just look at?'),
        line(HN, '관상 수조요. 팔 것도 먹을 것도 아니에요. 그냥 두고 보는 거.', 'An aquarium. Nothing to sell, nothing to eat. Just there to look at.'),
        line(P, '물고기를 보기만 한다니, 생각해 본 적도 없어요.', "Fish just to look at — I'd never even thought of that."),
        line(HN, '받침은 직접 짜고, 넣어 둘 한 마리 데려오고, 수조는 창가에 놓아 봐요.', 'Build the stand yourself, bring back one fish to keep, and set the tank by your window.'),
        line(P, '넣을 건 제가 잡으면 되고요?', 'And I catch the one that goes in?'),
        line(HN, '네. 뭘 넣을지는 다 놓고 나서 같이 정해요.', "Yes. We'll decide what goes in together once it's all set up."),
      ], {
        choices: [
          opt('look', '하나쯤 있으면 좋겠네요', 'It would be nice to have one', {
            say: ['팔지도 먹지도 않는 물고기라… 하나쯤 있으면 좋겠네요.', 'A fish I neither sell nor eat... it would be nice to have one.'], next: 'look' }),
          opt('window', '왜 하필 창가예요?', 'Why the window, of all places?', {
            say: ['왜 하필 창가예요? 수조는 그늘에 두는 거 아니에요?', "Why the window, of all places? Don't tanks go in the shade?"], next: 'window' }),
          opt('joke', '배고프면… 아, 농담이에요', 'If I get hungry... just kidding', {
            say: ['넣어 두다가 배고프면… 아, 농담이에요.', 'And if I get hungry while it\'s in there... just kidding.'], next: 'joke' }),
        ],
        note: ['하늬 씨가 매일 잡고 재고 손질하는 사람에게는 그냥 보는 것이 하나쯤 있어야 한다며, 관상 수조를 권했다. 받침을 직접 짜고, 넣을 한 마리를 잡아 오고, 창가에 놓은 뒤 무엇을 넣을지 같이 정하자고 했다.',
          'Ha-nui said someone who catches, measures and cleans fish every day needs one thing just to look at, and suggested an aquarium. Build the stand myself, catch one fish to keep, set it by the window — then we would decide together what goes in.'],
      }),
      look: scene([
        line(HN, '그쵸. 받침부터요. 물 채운 수조는 생각보다 훨씬 무거워요.', "Right. Start with the stand. A full tank is much heavier than you'd think."),
        line(P, '받침이 기울면 큰일이겠네요.', 'If the stand tilts, that would be trouble.'),
        line(HN, '물이 제일 먼저 알아요. 수면이 비뚤어지거든요.', 'The water knows first. The surface goes crooked.'),
      ], {
        choices: [
          opt('build', '받침부터 짜 볼게요', "I'll build the stand first", { end: endTalk({ accept: true, offer: 'just_look' }),
            note: ['하나쯤 있으면 좋겠다고 했다. 하늬 씨는 물 채운 수조는 무거우니 받침부터 짜라고 했다.', 'I said it would be nice to have one. Ha-nui said a full tank is heavy, so build the stand first.'] }),
          opt('what', '큰 놈을 넣어야 보기 좋을까요?', 'Would a big one look best?', {
            say: ['뭘 넣어야 해요? 큰 놈을 넣어야 보기 좋을까요?', 'What should go in? Would a big one look best?'], next: 'what' }),
        ],
      }),
      what: scene([
        line(HN, '큰 놈은 그 안에서 돌아서지도 못해요.', "A big one can't even turn around in there.", { act: 'shake_head' }),
        line(HN, '손가락 한 마디만 한 놈이 오래 가요.', 'One about a finger-joint long lasts.'),
        line(P, '작은 놈이요.', 'A small one, then.'),
        line(HN, '그래도 정하는 건 다 놓고 나서요. 천천히요.', "Still, decide once it's all set up. Take your time."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_what' }),
        note: ['큰 놈을 넣어야 보기 좋으냐고 물었다. 하늬 씨는 큰 놈은 돌아서지도 못한다며 손가락 한 마디만 한 놈이 오래 간다고 했다.', 'I asked if a big fish would look best. Ha-nui said a big one couldn\'t even turn around — one about a finger-joint long lasts.'],
      }),
      window: scene([
        line(HN, '그늘이 맞아요. 볕이 바로 닿으면 물이 데워지고 유리에 초록 물이 들어요.', 'Shade is right. Direct sun warms the water and turns the glass green.'),
        line(P, '그런데도 창가예요?', 'And yet, the window?'),
        line(HN, '창가 중에서도 해가 비스듬히 지나가는 데요. 창가에 두는 건 물고기 때문이 아니라 사람 때문이에요.', "A spot by the window where the sun only slants past. It goes by the window for the person, not the fish."),
        line(P, '사람 때문에요?', 'For the person?'),
        line(HN, '지나가다 한 번씩 보게요. 보려고 두는 거니까요.', "So you glance at it whenever you pass. It's there to be looked at."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_window' }),
        note: ['왜 하필 창가냐고 물었다. 해가 비스듬히 지나가는 창가에 두는 건 물고기가 아니라 지나가다 보는 사람 때문이라고 했다.', 'I asked why the window. A spot where the sun slants past, she said — it\'s there for the person passing by, not the fish.'],
      }),
      joke: scene([
        line(HN, '그 농담 하는 사람 수조는 오래 못 가요.', "People who make that joke don't keep a tank for long.", { act: 'peer' }),
        act(HN, 'laugh'),
        line(HN, '이름을 붙여 줘요. 이름 있는 건 못 먹어요.', "Give it a name. You can't eat something with a name."),
        line(P, '이름이라… 그건 확실히 못 먹겠네요.', 'A name... I definitely couldn\'t eat it then.'),
        line(HN, '제일 쉬운 방법이에요. 받침부터 만들고요.', 'Easiest trick there is. Start by building the stand.'),
      ], {
        end: endTalk({ accept: true, offer: 'eat_joke' }),
        note: ['배고프면 먹겠다는 농담을 했다가 눈총을 받았다. 하늬 씨는 이름을 붙여 주면 못 먹는다고 했다.', 'I joked about eating it if I got hungry and got a look for it. Ha-nui said to give it a name — then you can\'t eat it.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-5 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_5_done', questId: 'N22-5', at: 'complete', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(P, '하늬 씨, 수조 놓았어요. 창가에, 해가 비스듬히 드는 데요.', 'Ha-nui, I set up the tank. By the window, where the sun slants in.'),
        line(HN, '받침은요?', 'And the stand?', { act: 'look_up' }),
        line(P, '직접 짰어요. 넣어 둘 한 마리도 데려왔고요.', 'I built it myself. And I brought back one fish to keep.'),
        line(HN, '그럼 이제 뭘 넣을지만 정하면 되겠네요.', "Then all that's left is deciding what goes in."),
        line(P, '그게… 아직 아무것도 안 넣었어요. 빈 수조를 하루 보고만 있었어요.', "Well... I haven't put anything in yet. I just looked at the empty tank for a day."),
        line(HN, '비어 있어요?', "It's empty?", { act: 'peer' }),
        line(P, '네. 물만 있는데, 그게 이상하게 좋더라고요.', 'Yes. Just water, but somehow I liked it.'),
        act(HN, 'silence'),
        line(HN, '비어 있는 것도 넣은 거예요. 그렇게 보는 사람이 있어요.', 'Empty counts as something you put in. Some people see it that way.'),
      ], {
        choices: [
          opt('empty', '당분간은 이대로 비워 둘래요', "I'll leave it empty for now", {
            say: ['당분간은 이대로 비워 둘래요. 그게 좋았으니까요.', "I'll leave it empty for now. That's what I liked."], next: 'empty' }),
          opt('lesson', '물 관리는 활어 수조랑 달라요?', 'Is the water care different from a live tank?', {
            say: ['수조 물 관리는 활어 수조랑 달라요?', 'Is caring for the water different from a live-fish tank?'],
            end: endTalk({ complete: 'lesson',
              lineKo: '달라요. 팔 게 아니니까 천천히요. 물은 한 번에 다 갈지 말고 조금씩 바꿔요. 활어 수조는 며칠 버티면 되지만, 이건 몇 년을 봐야 하니까요.',
              lineEn: "It is. You're not selling it, so go slow. Don't change all the water at once; swap a little at a time. A live tank only has to hold out a few days. This one you'll be watching for years." }),
            note: ['관상 수조 물은 한 번에 다 갈지 말고 조금씩 바꾸라고 배웠다. 며칠이 아니라 몇 년을 볼 수조라서다.', 'I learned to change an aquarium\'s water a little at a time, never all at once — it\'s a tank for years, not days.'] }),
          opt('level', '받침이 조금 흔들려요', 'The stand wobbles a little', {
            say: ['받침이 조금 흔들려요. 수평 맞추는 요령이 있어요?', 'The stand wobbles a little. Is there a trick to leveling it?'], next: 'level' }),
          opt('pay', '설치 조언비는 제가 드려야죠', 'I should pay you for the setup advice', {
            say: ['설치 조언비는… 제가 드려야 하나요?', 'The setup advice... should I be paying you for it?'],
            end: endTalk({ complete: 'pay',
              lineKo: '아니요. 제가 봤잖아요, 빈 수조를. 그게 값이에요. 수초도 급할 거 없어요. 빈 수조도 좋고, 풀만 있는 수조도 좋아요.',
              lineEn: "No. I got to see it, didn't I — an empty tank. That's payment. No rush on plants either. An empty tank is good, and so is one with only weeds." }),
            note: ['조언비를 드리려 했더니, 하늬 씨는 빈 수조를 본 것이 값이라며 받지 않았다.', 'When I offered to pay for the advice, Ha-nui refused — seeing an empty tank was payment enough.'] }),
        ],
        note: ['수조를 창가에 놓고 한 마리도 데려왔지만, 아직 아무것도 넣지 않고 빈 수조를 하루 봤다고 했다. 하늬 씨는 잠시 말이 없다가, 비어 있는 것도 넣은 거라고 했다.',
          'I told Ha-nui the tank was by the window and I had brought a fish, but had put nothing in and spent a day looking at it empty. She was quiet for a moment, then said empty counts as something you put in.'],
      }),
      empty: scene([
        line(HN, '…그 말 오래 기다렸어요.', "...I've waited a long time to hear that."),
        line(HN, '다들 채우려고만 해요. 빈 걸 보고 좋다고 하는 사람은 드물어요.', 'Everyone only wants to fill it. People who look at an empty one and like it are rare.', { act: 'look_away' }),
      ], {
        end: endTalk({ complete: 'empty',
          lineKo: '나중에 뭘 넣어도, 오늘 본 빈 수조는 잊지 마요.',
          lineEn: "Whatever you put in later, don't forget the empty tank you saw today." }),
        note: ['당분간 비워 두겠다고 했다. 하늬 씨는 그 말을 오래 기다렸다며, 나중에 뭘 넣어도 오늘의 빈 수조를 잊지 말라고 했다.', 'I said I would leave it empty for now. Ha-nui said she had waited a long time to hear that, and told me never to forget today\'s empty tank.'],
      }),
      level: scene([
        line(HN, '물부터 좀 빼요. 바닥에 얇게만 남기면 어느 쪽이 깊은지 보여요.', 'Drain some water first. Leave just a thin layer and you can see which side is deeper.'),
        line(P, '깊은 쪽이 낮은 쪽이고요.', 'And the deeper side is the low side.'),
        line(HN, '네. 낮은 쪽 다리 밑은 얇게 깎은 쐐기로 받쳐요.', 'Yes. Shim the leg on the low side with a thinly whittled wedge.', { act: 'nod' }),
      ], {
        end: endTalk({ complete: 'level_tip',
          lineKo: '다 채우고 맞추면 늦어요. 그때는 무거워서 손을 못 대요. 물이 얕을 때 맞춰요.',
          lineEn: "Leveling it full is too late. By then it's too heavy to touch. Do it while the water is shallow." }),
        note: ['수평 맞추는 법을 배웠다. 물을 얕게 남겨 깊은 쪽을 보고, 낮은 다리 밑을 얇은 쐐기로 받친다.', 'I learned to level it: leave the water shallow to see the deep side, and shim the low leg with a thin wedge.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-6 「광맥」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_6_offer', questId: 'N22-6', at: 'offer', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '인천 쪽 폐채석장, 알아요?', 'Do you know the abandoned quarry out by Incheon?', { act: 'look_up' }),
        line(P, '아니요. 채석장이 그쪽에 있어요?', "No. There's a quarry out there?"),
        line(HN, '문 닫은 지 오래됐어요. 근데 거기 뭐가 남았대요.', "It closed a long time ago. But word is there's something left."),
        line(P, '뭐가요?', 'Like what?'),
        line(HN, '공방 손님 하나는 광맥이라고까지 하더라고요.', 'One of my customers went as far as calling it a seam.'),
        line(P, '광맥이요? 폐채석장에서요?', 'A seam? In an abandoned quarry?'),
        line(HN, '가 보세요. 주변을 세 번쯤 훑어보고 나서, 캘 만한 데서 캐 와요.', 'Go and see. Look over the area about three times first, then dig where it looks worth it.'),
        line(P, '하늬 씨는 안 가요?', "You're not coming?"),
        line(HN, '저는 공방 봐야죠. 캔 건 가져와요. 나눠요. 반반.', "I have the workshop to mind. Bring back what you dig. We'll split it. Half and half."),
      ], {
        choices: [
          opt('half', '반반이면 공평하네요', 'Half and half sounds fair', {
            say: ['반반이면 공평하네요. 뭐가 나오든 들고 올게요.', "Half and half is fair. Whatever turns up, I'll bring it back."], next: 'half' }),
          opt('rumor', '뭐가 남았다는 거예요? 누가 그래요?', 'Left what? Who says so?', { next: 'rumor' }),
          opt('safety', '무너질 데도 있지 않아요?', "Aren't there places that could collapse?", {
            say: ['폐채석장이면 무너질 데도 있지 않아요?', "If it's an abandoned quarry, aren't there places that could collapse?"], next: 'safety' }),
        ],
        note: ['인천 쪽 폐채석장에 쓸 만한 게 남았다는 말이 있다고 하늬 씨가 말했다. 손님 하나는 광맥이라고까지 했단다. 주변을 세 번쯤 훑고 캘 만한 데서 캐 오면, 캔 것은 반반 나누자고 했다.',
          "Ha-nui said word was there was something worth having left in the abandoned quarry near Incheon — one customer even called it a seam. Look over the area about three times, dig where it's worth it, and we'd split what I found half and half."],
      }),
      half: scene([
        line(HN, '공평하죠. 손은 당신이 쓰고, 눈은 제가 쓰니까요.', 'It is fair. You use your hands, and I use my eye.'),
        line(P, '눈이요?', 'Your eye?'),
        line(HN, '쓸 데를 알아보는 눈이요. 캔 걸 보면 어디에 쓸지 보여요.', "The eye for what a thing's good for. When I see what you dug, I'll know where it goes."),
        line(HN, '거기 바닥, 돌 부스러기라 미끄러워요. 다치면 반반이 아니라 전부 손해예요.', "The ground there is loose rubble — slippery. If you get hurt, it's not half and half, it's a total loss."),
      ], {
        end: endTalk({ accept: true, offer: 'half_half' }),
        note: ['반반이면 공평하다고 했다. 하늬 씨는 손은 내가, 쓸 데를 보는 눈은 자기가 쓴다며, 다치면 전부 손해니 발밑을 조심하라고 했다.', 'I said half and half was fair. Ha-nui said I would use my hands and she her eye for what things are good for — and to mind my feet, since getting hurt would be a total loss.'],
      }),
      rumor: scene([
        line(HN, '공방 손님들이요. 봉돌감을 캐 왔다는 사람도 있고, 아무것도 없었다는 사람도 있어요.', 'Customers at the workshop. Some say they dug out sinker material; others say there was nothing.'),
        line(P, '말부터 반반이네요.', 'Even the rumors are half and half.'),
        act(HN, 'laugh'),
        line(HN, '그러니까 가 봐야 알아요. 소문은 반만 믿어요. 나머지 반은 손으로 확인하고요.', "So you have to go and see. Believe half a rumor. Check the other half with your hands."),
      ], {
        choices: [
          opt('check', '나머지 반, 확인하고 올게요', "I'll go check the other half", { end: endTalk({ accept: true, offer: 'ask_rumor' }),
            note: ['소문을 물었다. 캐 왔다는 사람도, 없었다는 사람도 있어 소문은 반만 믿고 나머지 반은 손으로 확인하라고 했다.', 'I asked about the rumor. Some found something, some found nothing — believe half, she said, and check the rest with my hands.'] }),
          opt('gold', '광맥이면 금이라도 나오는 거 아니에요?', "If it's a seam, could there be gold?", { next: 'gold' }),
        ],
      }),
      gold: scene([
        line(HN, '금이 나오면 반반 말고 칠 대 삼으로 해요. 제가 칠이요.', "If gold turns up, it's seventy-thirty, not half and half. Me seventy."),
        line(P, '…방금 진지하게 한 말이에요?', '...Were you serious just now?'),
        act(HN, 'laugh'),
        line(HN, '폐채석장이에요. 쓸 만한 건 다 캐 가고 남은 데요. 그래도 남은 데에 남은 게 있어요. 그거 찾으러 가는 거예요.', "It's an abandoned quarry. Everything useful's been dug out. But there's something left in what's left. That's what you're going for."),
      ], {
        end: endTalk({ accept: true, offer: 'vein_joke' }),
        note: ['금이라도 나오느냐고 했더니, 하늬 씨는 금이 나오면 칠 대 삼이고 자기가 칠이라며 태연하게 받았다. 남은 데에 남은 것을 찾으러 가는 거라고 했다.', "When I asked if there might be gold, Ha-nui calmly said that would make it seventy-thirty, her seventy. I'd be looking for what's left in what's left, she said."],
      }),
      safety: scene([
        line(HN, '있어요. 깎아 낸 벽 아래로는 가지 마요. 돌이 위에서 떨어지거든요.', "There are. Don't go under the cut walls. Rocks come down from above."),
        line(P, '그럼 어디서 캐요?', 'Then where do I dig?'),
        line(HN, '평평한 데서만요. 주변부터 훑어보고, 그다음에 캐요. 순서가 거꾸로면 위험해요.', 'Only on flat ground. Look the area over first, then dig. Do it the other way round and it gets dangerous.'),
      ], {
        choices: [
          opt('careful', '훑고 나서 캘게요. 조심할게요', "Look first, then dig. I'll be careful", { end: endTalk({ accept: true, offer: 'ask_safety' }),
            note: ['폐채석장이 위험하지 않으냐고 물었다. 깎아 낸 벽 아래는 피하고, 평평한 데서 주변부터 훑은 다음 캐라고 했다.', 'I asked if the quarry was dangerous. Avoid the cut walls, she said; on flat ground, look around first and dig after.'] }),
          opt('scared', '그런 데는 무서워서 못 가겠어요', "That's too frightening for me", {
            say: ['…솔직히 그런 데는 무서워서 못 가겠어요. 이번 일은 못 하겠습니다.', "...Honestly, a place like that frightens me. I can't take this one on."], next: 'refuse' }),
        ],
      }),
      refuse: scene([
        act(HN, 'silence'),
        line(HN, '…그래요. 무서운 건 무서운 거예요.', '...All right. Scary is scary.'),
        line(HN, '억지로 보냈다가 다치면 제가 더 미안하죠. 소문은 다른 사람이 확인하겠죠.', "If I pushed you and you got hurt, I'd feel worse. Someone else will check the rumor."),
        line(P, '죄송해요.', "I'm sorry."),
      ], {
        end: endTalk({ fail: true }),
        note: ['폐채석장은 무서워서 못 가겠다고 했다. 하늬 씨는 무서운 건 무서운 거라며 소문은 다른 사람이 확인할 거라고 했다. 그 일은 내 손을 떠났다.', "I said the quarry frightened me and I couldn't go. Ha-nui said scary is scary, and someone else would check the rumor. That job left my hands."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-6 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_6_done', questId: 'N22-6', at: 'complete', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(P, '하늬 씨, 폐채석장 다녀왔어요. 주변 훑고, 평평한 데서 캤어요.', 'Ha-nui, I went to the abandoned quarry. Looked around, then dug on flat ground.'),
        line(HN, '다친 데는요?', 'Hurt anywhere?', { act: 'look_up' }),
        line(P, '없어요. 발밑만 보고 다녔어요.', 'No. I kept my eyes on my feet.'),
        line(HN, '어디 봐요.', 'Let me see.', { act: 'peer' }),
        line(HN, '…봉돌용 납은 아니네요.', "...It's not lead for sinkers."),
        line(P, '그럼 뭐예요?', 'Then what is it?'),
        line(HN, '다른 거요. 쓸 데는 있어요. 광맥은 과장이었네요. 그래도 한 철 봉돌값은 돼요.', "Something else. It has its uses. Calling it a seam was an exaggeration. Still, it's a season's worth of sinker money."),
        line(P, '그럼 약속대로…', 'Then, as promised...'),
        line(HN, '반반.', 'Half and half.', { act: 'nod' }),
      ], {
        choices: [
          opt('lesson', '쓸 만한 걸 고르는 눈, 배우고 싶어요', 'I want to learn the eye for what is useful', {
            say: ['폐채석장에서 쓸 만한 걸 고르는 눈, 배우고 싶어요.', "I'd like to learn the eye for picking out what's useful in a quarry."],
            end: endTalk({ complete: 'lesson',
              lineKo: '색이에요. 회색 말고 검은 회색. 검은 회색은 무거워요. 같은 크기면 손에서 먼저 티가 나요. 눈으로 고르고, 손으로 한 번 더 달아 봐요.',
              lineEn: "Color. Not gray — blackish gray. Blackish gray is heavy. At the same size, your hand feels it first. Pick with your eye, then weigh it once more in your hand." }),
            note: ['쓸 만한 광물은 검은 회색이고, 같은 크기면 손에서 먼저 무게가 느껴진다고 배웠다.', 'I learned that useful ore is blackish gray, and at the same size your hand feels the weight first.'] }),
          opt('pay', '제 몫 반은 공방에 팔게요', "I'll sell my half to the workshop", {
            end: endTalk({ complete: 'pay',
              lineKo: '살게요. 재료값으로요. 캔 걸 파는 사람은 많아요. 반반 약속을 지키고 나서 파는 사람은 드물고요. 장부에 그렇게 적어 둘게요.',
              lineEn: "I'll buy it. As materials. Lots of people sell what they dig. Few sell only after keeping a half-and-half promise. I'll note that in the ledger." }),
            note: ['반을 나눈 뒤 내 몫을 공방에 팔았다. 하늬 씨는 약속을 지키고 파는 사람은 드물다며 장부에 그렇게 적었다.', 'After the split I sold my half to the workshop. Ha-nui said people who keep the promise first are rare, and wrote that in her ledger.'] }),
          opt('decline', '반반이면 됐어요. 광맥 아니어도요', 'Half is enough, seam or no seam', {
            say: ['반반이면 됐어요. 광맥이 아니어도요.', "Half and half is enough. Even if it wasn't a seam."], next: 'decline' }),
          opt('split', '반반은 무게로 나눠요, 값으로 나눠요?', 'Do we split by weight or by value?', { next: 'split' }),
        ],
        note: ['폐채석장에서 캔 것을 하늬 씨에게 보였다. 봉돌용 납은 아니었고, 광맥은 과장이었지만 한 철 봉돌값은 된다고 했다. 약속대로 반반이었다.',
          "I showed Ha-nui what I dug at the quarry. It wasn't lead for sinkers, and the seam was an exaggeration, but it was a season's sinker money, she said. Half and half, as promised."],
      }),
      decline: scene([
        act(HN, 'silence'),
        line(HN, '…그렇게 말하니까 광맥 같네요.', "...Hearing you say that, it feels like a seam after all."),
        line(P, '네?', 'Sorry?'),
        line(HN, '광맥은 돌 속에만 있는 게 아니에요. 같이 캐러 갈 사람이 있으면 그게 광맥이에요.', "A seam isn't only inside rock. Having someone to go digging with — that's a seam."),
      ], {
        end: endTalk({ complete: 'decline',
          lineKo: '다음에 또 소문이 들리면 먼저 말할게요.',
          lineEn: "Next time I hear a rumor, you'll be the first I tell." }),
        note: ['광맥이 아니어도 반반이면 됐다고 했다. 하늬 씨는 같이 캐러 갈 사람이 있으면 그게 광맥이라며, 공방 재료 선반 두 칸을 내 몫으로 내줬다.', 'I said half was enough even without a seam. Ha-nui said having someone to dig with is the real seam, and gave me two shelves of her material rack.'],
      }),
      split: scene([
        line(HN, '좋은 질문이에요. 값으로요.', 'Good question. By value.'),
        line(P, '무게가 더 간단하지 않아요?', "Isn't weight simpler?"),
        line(HN, '무게로 나누면 쓸모없는 돌을 많이 든 쪽이 이겨요.', 'Split by weight and whoever holds the most useless rock wins.', { act: 'shake_head' }),
      ], {
        end: endTalk({ complete: 'split_value',
          lineKo: '그래서 먼저 쓸 것과 못 쓸 것을 가르고, 쓸 것만 반으로 나눠요. 나누기 전에 고르는 게 진짜 셈이에요.',
          lineEn: "So first you separate the useful from the useless, and only halve what's useful. Sorting before splitting — that's the real arithmetic." }),
        note: ['반반은 값으로 나눈다고 배웠다. 쓸 것과 못 쓸 것을 먼저 가르고, 쓸 것만 반으로 나눈다.', 'I learned to split by value: separate the useful from the useless first, then halve only what is useful.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-7 「씨앗」 — 받는 자리 (받으면 씨앗 봉투를 건넨다 — client `N22_7_SEEDS`)
  // ═══════════════════════════════════════════
  {
    id: 'n22_7_offer', questId: 'N22-7', at: 'offer', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '손 내밀어 봐요.', 'Hold out your hand.', { act: 'look_up' }),
        line(P, '손이요? …뭔데요?', 'My hand? ...What is it?'),
        line(HN, '씨앗이에요. 봉투 하나.', 'Seeds. One envelope.'),
        line(P, '무슨 씨앗인데요?', 'What kind of seeds?'),
        line(HN, '뭐가 나올지는… 저도 몰라요. 봉투에 아무것도 안 적혀 있어요.', "What'll come up... I don't know either. There's nothing written on the envelope."),
        line(P, '하늬 씨도 모르는 걸 저한테 주시는 거예요?', "You're giving me something even you don't know?"),
        line(HN, '그래서 드리는 거예요. 심을 데는 알아서 찾으세요. 네 군데쯤 훑어보고, 텃밭에 두 칸만요.', "That's exactly why. Find somewhere to plant them yourself. Look over about four places, then just two plots in a vegetable patch."),
        line(P, '다 심으면요?', 'And once they\'re planted?'),
        line(HN, '수확하면 가져와요. 안 나와도 오고요.', 'Bring the harvest when it comes. Come even if nothing does.'),
      ], {
        choices: [
          opt('take', '모르는 씨앗이라니, 오히려 좋네요', 'Unknown seeds — I like that, actually', {
            say: ['뭐가 나올지 모르는 씨앗이라니, 오히려 좋네요. 받을게요.', "Seeds where you don't know what'll come up — I like that, actually. I'll take them."], next: 'take' }),
          opt('where', '어디서 난 거예요? 정말 모르세요?', "Where are they from? You really don't know?", {
            say: ['이 씨앗, 어디서 난 거예요? 정말 뭔지 모르세요?', "Where did these seeds come from? You really don't know what they are?"], next: 'where' }),
          opt('worry', '말려 죽이면 어떡해요?', 'What if I let them dry out and die?', {
            say: ['제가 키우다 말려 죽이면 어떡해요? 귀한 씨앗 같은데요.', 'What if I let them dry out and die? They seem precious.'], next: 'worry' }),
        ],
        note: ['하늬 씨가 이름 없는 씨앗 봉투를 내밀었다. 뭐가 나올지 자기도 모른다며, 심을 데는 네 군데쯤 훑어보고 알아서 찾아 텃밭에 두 칸만 심으라고 했다. 수확하면 가져오고, 안 나와도 오라고 했다.',
          "Ha-nui held out an unlabeled envelope of seeds. She didn't know what would come up either. Look over about four places, find my own spot, plant just two plots in a vegetable patch — and bring the harvest, or come even if nothing grew."],
      }),
      take: scene([
        act(HN, 'give', { to: P }),
        line(HN, '좋죠? 봉투에 이름이 없으면 기다리는 게 재밌어져요.', 'Nice, right? When the envelope has no name, the waiting gets fun.'),
        line(P, '가볍네요. 사락사락 소리가 나요.', "It's light. It rustles.", { act: 'receive' }),
        line(HN, '싹이 나면 제일 먼저 보여 줘요.', 'When something sprouts, show me first.'),
      ], {
        choices: [
          opt('ok', '싹 나면 제일 먼저 보여 드릴게요', "I'll show you first when it sprouts", { end: endTalk({ accept: true, offer: 'take_seeds' }),
            note: ['모르는 씨앗이라 오히려 좋다며 봉투를 받았다. 싹이 나면 하늬 씨에게 제일 먼저 보여 주기로 했다.', 'I took the envelope, saying unknown seeds were all the better. I promised to show Ha-nui first when they sprouted.'] }),
          opt('weed', '혹시 잡초 씨 아니에요?', "It isn't weed seed, is it?", {
            say: ['이름 없는 씨앗이라… 혹시 잡초 씨 아니에요?', 'Seeds with no name... these aren\'t weed seeds, are they?'], next: 'weed' }),
        ],
      }),
      weed: scene([
        line(HN, '잡초는 봉투에 안 넣어요. 알아서 나니까요.', 'Nobody puts weeds in an envelope. They come up on their own.'),
        line(P, '…그건 그렇네요.', '...Fair point.'),
        line(HN, '잡초면 잡초 수확이죠. 그래도 가져와요. 뭐가 나왔는지 보는 게 약속이니까요.', "If it's weeds, it's a weed harvest. Bring it anyway. Seeing what came up is the promise."),
      ], {
        end: endTalk({ accept: true, offer: 'weed_joke' }),
        note: ['잡초 씨 아니냐고 했더니, 잡초는 알아서 나니 봉투에 안 넣는다고 했다. 잡초가 나와도 가져오라고 했다.', 'When I asked if they were weed seeds, she said nobody bags weeds — they come up on their own. Bring it even if it is weeds.'],
      }),
      where: scene([
        line(HN, '몰라요. 정말로요. 봐요, 뒷면도 비었어요.', "I don't. Really. Look, the back's blank too."),
        line(P, '모르는 걸 심는다는 게 좀 이상해요.', 'Planting something unknown feels a bit strange.'),
        line(HN, '아는 걸 심으면 맞히는 거고, 모르는 걸 심으면 기다리는 거예요. 그것도 배우는 거예요.', "Plant what you know and you're guessing right. Plant what you don't and you're waiting. That's learning too."),
        act(HN, 'give', { to: P }),
        line(HN, '두 칸만 심어 봐요.', 'Just plant two plots.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_where' }),
        note: ['씨앗이 어디서 났는지 물었다. 하늬 씨도 정말 모른다며, 아는 걸 심으면 맞히는 거고 모르는 걸 심으면 기다리는 거라고 했다.', 'I asked where the seeds came from. Ha-nui really didn\'t know — plant what you know and you guess right; plant what you don\'t and you wait.'],
      }),
      worry: scene([
        act(HN, 'laugh'),
        line(HN, '그럼 말라 죽은 걸 들고 와요. 그것도 배운 거예요.', "Then bring the dead ones. That's something learned too."),
        line(P, '그래도요…', 'Still...'),
        act(HN, 'give', { to: P }),
        line(HN, '두 칸 심을 만큼은 들어 있어요. 하나가 안 되면 하나는 돼요. 씨앗은 사람보다 덜 겁내요.', "There's enough for two plots. If one fails, the other won't. Seeds are less scared than people."),
      ], {
        end: endTalk({ accept: true, offer: 'worry' }),
        note: ['말려 죽일까 걱정했더니, 하늬 씨는 웃으며 말라 죽은 것도 들고 오라고 했다. 씨앗은 사람보다 덜 겁낸다고 했다.', 'When I worried about killing them, Ha-nui laughed and said to bring the dead ones too. Seeds are less scared than people, she said.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-7 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_7_done', questId: 'N22-7', at: 'complete', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(P, '하늬 씨, 씨앗 심었어요. 텃밭에 두 칸이요.', 'Ha-nui, I planted the seeds. Two plots in the vegetable patch.'),
        line(HN, '어디에요?', 'Where?', { act: 'look_up' }),
        line(P, '속초 텃밭이요. 몇 군데 둘러봤는데, 거기가 제일 손이 자주 가서요.', "My patch in Sokcho. I looked at a few places, but that's where I go most often."),
        line(HN, '잘 골랐네요. 뭐가 나올 것 같아요?', 'Good choice. What do you think will come up?', { act: 'nod' }),
        line(P, '모르겠어요. 그래서 자꾸 들여다보게 돼요.', "No idea. That's why I keep going to look."),
        line(HN, '심었네요. 수확 약속. 안 나와도 와요.', 'You planted them. Promise me the harvest. Come even if nothing comes up.'),
        line(P, '안 나와도요?', 'Even if nothing does?'),
        line(HN, '그게 약속이에요.', "That's the promise."),
      ], {
        choices: [
          opt('promise', '안 나와도 올게요', "I'll come even if nothing grows", {
            say: ['안 나와도 올게요. 약속해요.', "I'll come even if nothing grows. I promise."], next: 'promise' }),
          opt('lesson', '모르고 심는 것도 배우는 거죠?', 'Planting blind is learning too, right?', {
            say: ['무슨 씨앗인지 모르고 심는 법, 그것도 배우는 거죠?', "Planting without knowing what the seed is — that's something to learn too, isn't it?"],
            end: endTalk({ complete: 'lesson',
              lineKo: '그게 농사예요. 바다랑 같아요. 뭐가 물지 모르고 던지죠. 던지고 나서 할 수 있는 건 기다리는 거랑 물 주는 거예요. 이름은 나중이에요.',
              lineEn: "That's farming. Same as the sea. You cast without knowing what'll bite. After you cast, all you can do is wait and water. The name comes later." }),
            note: ['모르고 심는 것도 배우는 거냐고 물었다. 하늬 씨는 그게 농사라며, 바다처럼 던지고 기다리는 거라고 했다.', 'I asked if planting blind was something to learn. Ha-nui said that is farming — like the sea, you cast and wait.'] }),
          opt('pay', '씨앗값은 제가 드려야죠', 'I should pay for the seeds', {
            end: endTalk({ complete: 'pay',
              lineKo: '아니요. 수확으로요. 안 나오면 안 받고요. 돈으로 받으면 씨앗이 물건이 되고, 수확으로 받으면 약속이 돼요. 저는 약속이 더 좋아요.',
              lineEn: "No. Pay me in harvest. If nothing comes up, I take nothing. Paid in money, the seeds become goods; paid in harvest, they become a promise. I prefer promises." }),
            note: ['씨앗값을 드리려 했더니, 하늬 씨는 돈 말고 수확으로 받겠다고 했다. 돈은 물건이 되고 수확은 약속이 된다고 했다.', 'When I offered to pay for the seeds, Ha-nui said she would take harvest, not money — money makes them goods, harvest makes them a promise.'] }),
          opt('sprout', '싹 날 때까지 제가 할 게 있어요?', 'Is there anything I can do until it sprouts?', {
            say: ['싹이 날 때까지 제가 할 수 있는 게 있어요?', 'Is there anything I can do until something sprouts?'], next: 'sprout' }),
        ],
        note: ['씨앗을 속초 텃밭 두 칸에 심었다고 하늬 씨에게 알렸다. 뭐가 나올지 몰라 자꾸 들여다보게 된다고 하자, 수확을 약속하라며 안 나와도 오라고, 그게 약속이라고 했다.',
          "I told Ha-nui I had planted the seeds in two plots in Sokcho. When I said I kept checking because I didn't know what would come up, she asked me to promise the harvest — and to come even if nothing did. That was the promise."],
      }),
      promise: scene([
        act(HN, 'silence'),
        line(HN, '…그 말이 수확이에요.', '...Those words are the harvest.'),
        line(HN, '씨앗은 안 나올 수도 있어요. 그래도 오겠다는 사람은 나와요. 문 앞에요.', "Seeds might not come up. But someone who says they'll come does turn up. At the door."),
      ], {
        end: endTalk({ complete: 'promise',
          lineKo: '공방 문은 늘 열어 둘게요. 언제든 와요.',
          lineEn: "I'll always leave the workshop door open. Come anytime." }),
        note: ['안 나와도 오겠다고 약속했다. 하늬 씨는 그 말이 수확이라며, 공방 문은 늘 열어 둘 테니 언제든 오라고 했다.', "I promised to come even if nothing grew. Ha-nui said those words were the harvest, and that she would always leave the workshop door open for me."],
      }),
      sprout: scene([
        line(HN, '흙 겉이 하얗게 마르지만 않게요. 씨앗은 물을 먹어야 껍질을 깨요.', "Just don't let the surface dry out white. A seed has to drink before it can crack its shell."),
        line(P, '그럼 물을 넉넉히…', 'Then plenty of water...'),
        line(HN, '넉넉하면 고여요. 고이면 씨앗이 숨을 못 쉬어요.', "Plenty and it pools. If it pools, the seed can't breathe.", { act: 'shake_head' }),
      ], {
        end: endTalk({ complete: 'sprout_tip',
          lineKo: '그리고 매일 들여다보지 마요. 궁금하면 흙을 파 보고 싶어지거든요. 파 보면 끝이에요.',
          lineEn: "And don't check on it every day. You get curious and want to dig it up. Dig it up and that's the end." }),
        note: ['싹이 날 때까지는 흙 겉이 마르지 않게만 하되 물이 고이지 않게 하라고 배웠다. 궁금해도 파 보지 말라고 했다.', 'I learned to keep the surface from drying until it sprouts, without letting water pool — and never to dig it up out of curiosity.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-8 「집」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n22_8_offer', questId: 'N22-8', at: 'offer', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '요즘 방은 어때요?', "How's your room these days?", { act: 'look_up' }),
        line(P, '의자도 있고, 창가에 수조도 있어요. 들어가면 바로 자진 않아요.', "There's a chair, and a tank by the window. I don't go straight to sleep anymore."),
        line(HN, '들어갈 때는요? 기분이 어때요?', 'And when you go in? How does it feel?'),
        line(P, '…돌아간다는 느낌이에요. 예전엔 그냥 들어갔는데.', '...Like going back. Before, I just went in.'),
        act(HN, 'silence'),
        line(HN, '그럼 이제 마무리해요.', "Then it's time to finish it."),
        line(P, '마무리요?', 'Finish it?'),
        line(HN, '세간 다섯 점이요. 전부 손으로 만들어서, 집에 자리 잡아 줘요.', 'Five household pieces. Make them all by hand and give them their places at home.'),
        line(HN, '돌아올 곳이 됐으면 집들이예요. 저도 갈게요. 다들 부르세요.', "Once it's somewhere you come back to, you have a housewarming. I'll come. Invite everyone."),
        line(P, '집들이요? 제 방에서요?', 'A housewarming? In my room?'),
      ], {
        choices: [
          opt('warm', '집들이라니, 생각만 해도 좋네요', 'A housewarming — I like the sound of it', {
            say: ['집들이라니, 생각만 해도 좋네요. 마무리부터 할게요.', "A housewarming — I like the sound of that. I'll start by finishing the place."], next: 'warm' }),
          opt('everyone', '다들이면 누구까지 불러야 해요?', 'Everyone — who should I invite?', {
            say: ['다들 부르라니, 누구까지 불러야 해요?', 'Invite everyone — how far does everyone go?'], next: 'everyone' }),
          opt('room', '집이라기엔 방 한 칸뿐인데요?', "It's only one room, though", {
            say: ['집이라기엔 아직 방 한 칸뿐인데요?', "It's still just one room — hardly a house."], next: 'room' }),
        ],
        note: ['방에 들어갈 때 돌아간다는 느낌이 든다고 하자, 하늬 씨는 이제 마무리하라고 했다. 세간 다섯 점을 손으로 만들어 집에 자리 잡아 주고, 돌아올 곳이 됐으면 집들이를 하자며 다들 부르라고 했다.',
          'When I said going into my room now felt like going back, Ha-nui said it was time to finish it: make five household pieces by hand, give them their places, and once it was somewhere to come back to, hold a housewarming and invite everyone.'],
      }),
      warm: scene([
        line(HN, '좋아요. 다섯 점 전부 손으로요. 자기가 만든 게 있어야 집이 자기 거 같아요.', 'Good. All five by hand. A home feels like yours when there are things you made in it.'),
        line(P, '뭘 만들어야 해요?', 'What should I make?'),
        line(HN, '그건 당신 집이니까 당신이 정해요. 하나만 부탁할게요. 조행록 둘 자리요.', "It's your home, so you decide. Just one request. A place for your fishing log."),
        line(P, '조행록이요?', 'My fishing log?'),
        line(HN, '매일 쓰잖아요. 그게 제자리에 있어야 집이에요. 저는 그날 빈손으로 안 갈게요.', "You write in it every day. It needs its own place for it to be a home. And I won't come empty-handed."),
      ], {
        end: endTalk({ accept: true, offer: 'housewarming' }),
        note: ['집들이를 하겠다고 했다. 하늬 씨는 다섯 점 전부 손으로 만들되, 매일 쓰는 조행록 둘 자리만은 꼭 만들라고 했다.', 'I said I would hold a housewarming. Ha-nui said to make all five pieces by hand, and to be sure one of them was a place for the fishing log I write in every day.'],
      }),
      everyone: scene([
        line(HN, '고마운 사람이요. 처음 왔을 때부터 세어 봐요.', "People you're grateful to. Count from when you first got here."),
        line(P, '밥 한 끼 얻어먹은 사람, 일 하나 맡겨 준 사람…', 'People who fed me a meal, people who trusted me with a job...'),
        act(HN, 'laugh'),
        line(HN, '손가락이 모자라죠? 다 오진 못할 거예요. 그래도 불러요. 부른 건 오래 남아요.', "Not enough fingers, right? Not all of them will make it. Invite them anyway. Being invited stays with people."),
      ], {
        choices: [
          opt('finish', '그럼 집부터 마무리할게요', "Then I'll finish the place first", { end: endTalk({ accept: true, offer: 'ask_everyone' }),
            note: ['누구까지 부르느냐고 물었다. 처음 왔을 때부터 고마운 사람을 세어 보라고 했다. 손가락이 모자랐다.', 'I asked who to invite. Count everyone I was grateful to since I arrived, she said. I ran out of fingers.'] }),
          opt('nervous', '뭘 대접해야 할지 모르겠어요', "I don't know what to serve", {
            say: ['손님을 불러 본 적이 없어서요. 뭘 대접해야 할지…', "I've never had guests over. I don't know what to serve..."], next: 'nervous' }),
        ],
      }),
      nervous: scene([
        line(HN, '잡은 거 구우면 돼요. 바닷가 집들이에 그만한 게 어디 있어요.', "Grill what you catch. What could beat that at a seaside housewarming?"),
        line(P, '그것만으로 돼요?', "That's enough?"),
        line(HN, '집들이는 손님이 집을 보러 오는 거예요. 상을 보러 오는 게 아니라요.', 'At a housewarming, guests come to see the home. Not the table.'),
        line(HN, '앉을 데만 넉넉하게 만들어 둬요.', 'Just make sure there are plenty of places to sit.'),
      ], {
        end: endTalk({ accept: true, offer: 'nervous_host' }),
        note: ['손님을 불러 본 적이 없어 뭘 대접할지 걱정했다. 하늬 씨는 잡은 걸 구우면 된다며, 손님은 상이 아니라 집을 보러 오니 앉을 데만 넉넉히 만들라고 했다.', "I worried about what to serve, never having had guests. Ha-nui said to grill what I catch — guests come to see the home, not the table, so just make plenty of seats."],
      }),
      room: scene([
        line(HN, '방 한 칸이어도 돌아오고 싶으면 집이에요. 큰 데 살아도 돌아가기 싫으면 숙소고요.', "Even one room is a home if you want to come back to it. Live somewhere big and dread going back, and it's just lodging."),
        line(HN, '지금 그 방, 돌아가고 싶어요?', 'That room of yours — do you want to go back to it?', { act: 'peer' }),
        line(P, '…네. 그런 것 같아요.', '...Yes. I think I do.'),
        line(HN, '그럼 집이에요. 마무리만 하면 돼요.', "Then it's a home. You just need to finish it."),
      ], {
        end: endTalk({ accept: true, offer: 'room_only' }),
        note: ['방 한 칸뿐이라고 했더니, 하늬 씨는 돌아오고 싶으면 집이라며 그 방에 돌아가고 싶으냐고 물었다. 그렇다고 답했다.', 'When I said it was only one room, Ha-nui said it is a home if you want to come back to it, and asked whether I did. I said yes.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N22-8 — 끝내는 자리(집들이)
  // ═══════════════════════════════════════════
  {
    id: 'n22_8_done', questId: 'N22-8', at: 'complete', npcId: HN, start: 'start',
    nodes: {
      start: scene([
        line(HN, '집이네요, {player} 씨. 잠만 자던 방이.', "It's a home, {player}. The room you only used to sleep in.", { act: 'look_up' }),
        line(P, '의자, 수조, 창가, 그리고 조행록 놓을 선반이요. 전부 제 손으로 만들었어요.', 'The chair, the tank, the window, and a shelf for my fishing log. I made them all myself.'),
        line(HN, '선반, 조행록 자리가 딱 맞네요.', 'The shelf fits the fishing log just right.', { act: 'peer' }),
        line(P, '정옥선 씨도 와 주셨어요. 제일 먼저요.', 'Okseon came too. First of anyone.'),
        line(HN, '봤어요. 받침 네 번째, 봤어요? 탁 씨가요.', 'I saw. Did you see the fourth tray? From Tak Mansu.'),
        line(P, '네. 탁만수 씨가 이 집 거라고 놓고 가셨어요.', 'Yes. Mansu left it, saying it belongs to this house.'),
        act(HN, 'silence'),
        line(HN, '…네 번째는 이 집이네요.', '...So the fourth one is this house\'s.'),
      ], {
        choices: [
          opt('home', '돌아올 곳. 그 말을 이제 알아요', 'Somewhere to come back to. Now I know what that means', { next: 'home' }),
          opt('lesson', '마무리 순서, 다음 사람한테 가르쳐야겠어요', 'I should teach the next person the order', {
            say: ['집을 마무리하는 순서, 다음 사람한테 가르쳐야겠어요.', 'The order for finishing a home — I should teach it to the next person.'],
            end: endTalk({ complete: 'lesson',
              lineKo: '의자부터요. 앉을 데가 있어야 집이에요. 그다음이 불이고, 그다음이 물건 둘 데예요. 순서는 사람마다 달라도 의자는 늘 처음이에요.',
              lineEn: 'Start with a chair. A place to sit makes a home. Then light, then places to keep things. The order changes from person to person, but the chair always comes first.' }),
            note: ['집을 마무리하는 순서를 배웠다. 의자, 불, 물건 둘 데. 의자는 늘 처음이다.', 'I learned the order for finishing a home: a chair, then light, then places to keep things. The chair always comes first.'] }),
          opt('pay', '집들이 선물은 안 받는 게 예의라던데요', "I heard it's polite to refuse housewarming gifts", { next: 'pay' }),
          opt('chair_legs', '의자 다리 맞추는 게 제일 어려웠어요', 'Evening out the chair legs was hardest', {
            say: ['의자 다리 네 개 길이 맞추는 게 제일 어려웠어요.', 'Getting the four chair legs the same length was the hardest part.'], next: 'legs' }),
        ],
        note: ['집들이 날, 하늬 씨가 잠만 자던 방이 집이 됐다고 했다. 정옥선 씨가 제일 먼저 왔고, 탁만수 씨는 대나무 받침을 하나 더 놓고 갔다. 네 번째, 이 집 것이라고.',
          'On the day of the housewarming, Ha-nui said the room I used only for sleeping had become a home. Okseon came first, and Mansu left one more bamboo tray. The fourth — this house\'s, he said.'],
      }),
      home: scene([
        act(HN, 'silence'),
        line(HN, '…오래 걸렸네요.', '...It took a long time.'),
        line(HN, '아니, 저는 몰라요. 그렇게 들었어요.', "No — I wouldn't know. That's what I heard.", { act: 'look_away' }),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'home',
          lineKo: '문패 하나 깎아 왔어요. 이름은 직접 새겨요. 이 집 거니까요.',
          lineEn: "I carved you a nameplate. Carve the name yourself. It belongs to this house." }),
        note: ['돌아올 곳이라는 말을 이제 안다고 했다. 하늬 씨는 오래 걸렸다고 하고는, 직접 깎은 문패를 건네며 이름은 내가 새기라고 했다.', 'I said I finally knew what somewhere to come back to meant. Ha-nui said it had taken a long time, then gave me a nameplate she had carved, and told me to carve the name myself.'],
      }),
      pay: scene([
        act(HN, 'laugh'),
        line(HN, '받으세요. 예의는 다음에.', 'Take them. Manners can wait.'),
        line(P, '이렇게 많이요? 거의 다 먹을 거네요.', 'This many? And nearly all of it food.'),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '집들이 선물은 갚으라고 주는 게 아니에요. 다음에 그 사람 집에 갈 이유를 주는 거예요. 그러니까 다 받아요.',
          lineEn: "Housewarming gifts aren't given to be paid back. They give you a reason to visit that person's home next. So take them all." }),
        note: ['집들이 선물을 사양하려 하자, 하늬 씨는 예의는 다음에 하고 다 받으라고 했다. 선물은 다음에 그 사람 집에 갈 이유라고 했다.', 'When I tried to refuse the gifts, Ha-nui told me to save my manners and take them all — a gift is a reason to visit that person next.'],
      }),
      legs: scene([
        line(HN, '다들 거기서 막혀요. 하나씩 맞추면 끝이 없어요.', 'Everyone gets stuck there. Fit them one at a time and it never ends.'),
        line(P, '맞아요. 하나 깎으면 다른 게 길어지고요.', 'Exactly. Trim one and another ends up longer.'),
        line(HN, '네 개를 한데 묶어서 같이 깎아요.', 'Bundle all four together and trim them at once.'),
      ], {
        end: endTalk({ complete: 'chair_legs',
          lineKo: '그리고 바닥을 믿지 마요. 방바닥은 생각보다 기울어 있어요. 마지막 손질은 그 방 바닥에 맞춰서 해요.',
          lineEn: "And don't trust the floor. Floors slope more than you'd think. Do the last trim to fit that room's floor." }),
        note: ['의자 다리 맞추기가 어려웠다고 했다. 하늬 씨는 네 개를 묶어 같이 깎고, 마지막 손질은 그 방 바닥에 맞추라고 했다.', 'I said evening out the chair legs was hardest. Ha-nui said to bundle all four and trim them together, then do the last trim to fit the room\'s floor.'],
      }),
    },
  },
];
