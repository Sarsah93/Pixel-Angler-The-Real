/**
 * @file StoryTalkN20.ts
 * @description 290차 — N20 「유하랑 — 카메라를 든 사람」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 받는 끝은 옛 받는 답(`offer`)에 묶어 옛 표시를 잇고,
 *   끝내는 끝은 옛 보상 답(`complete`)에 모두 묶었다.
 *
 * 인물: 유하랑(27 · 구독자 300명의 낚시 방송인 — 밝은 해요체 · 느낌표가 많다 · 말해 놓고 스스로 고친다(「…아니, 나쁜 거 맞아요.」) ·
 *   「진짜로」 · 나를 「그쪽」이라 부른다 · 카메라 · 구독자 · 섬네일 · 합방 · 편집본 같은 방송 말을 쓴다).
 *   주인공은 「유하랑 씨」(영어 Harang)라 부른다. 정옥선은 유하랑에게 「좌판 할머니」다(인물끼리의 말 — 그대로).
 *
 * 흐름(7편): 부산에서 처음 만나 카메라 앞 한 마리(구독자 삼백 · 열두 명) → 울산 방어진 노을 섬네일(등) → 속초 합방(만복상회 앞)
 *   → 제주 금어기 개체(재고 바로 놓아준다 — 어느 답이든) → 울릉 오프라인(카메라를 끈다) → 독도 마지막 라이브(시청자 0)
 *   → 자막 없는 영상(돌돔 한 마리 · 한 컷 · 다음 항구). 다음 항구 이야기는 마지막 편에서만 꺼낸다.
 *
 * 남기는 표시: 새로 만든 표시는 없다. 옛 받는 답의 표시(choice.n20_1_asked_viewers · n20_2_asked_shot …)는 받는 끝의 `offer`가,
 *   옛 보상 답의 표시(choice.n20_1_subscribed · n20_explained · n20_zero · n20_cut …)는 끝내는 끝의 `complete`가 남긴다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const H = 'yu_harang';
const P = 'player';
/** 지문(괄호 서술) */
const N = '';

export const TALKS_N20: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N20-1 「구독자 삼백」 — 받는 자리(유하랑 · 처음 만난다 · 한 번뿐 — 미루면 다음 날 다른 항구로 간다)
  // ═══════════════════════════════════════════
  {
    id: 'n20_1_offer', questId: 'N20-1', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(N, '(방파제 끝에 삼각대가 서 있다. 한 사람이 휴대폰 화면에 대고 혼자 떠들고 있다.)', '(A tripod stands at the end of the breakwater. Someone is chattering away alone at a phone screen.)'),
        line(H, '…네, 여러분, 오늘도 입질이 없네요. 아, 잠깐만요.', '...Yes, everyone, still no bites today. Oh, hang on.'),
        line(H, '저기요! 저기… 낚시하시는 분 맞죠?', 'Excuse me! Um... you fish, right?', { act: 'look_up' }),
        line(P, '네? 저요?', 'Sorry? Me?'),
        line(H, '저 유하랑이라고 해요. 낚시 방송 해요. 구독자 삼백.', "I'm Yu Harang. I run a fishing channel. Three hundred subscribers."),
        line(P, '방송이요? 지금 찍고 계신 거예요?', "A channel? You're filming right now?"),
        line(H, '라이브예요. 근데 두 시간째 한 마리도 못 잡았어요.', "It's live. But I haven't caught a thing in two hours."),
        act(H, 'sigh'),
        line(H, '한 마리만 잡아 주시면 안 돼요? 그림이 안 나와서.', "Could you catch just one for me? I've got nothing to show."),
        line(P, '제가 잡는 걸 찍으시겠다는 거죠?', 'You want to film me catching it?'),
        line(H, '네! 카메라 앞에서 딱 한 마리요. 지금 열두 명 보고 있어요.', 'Yes! Just one, in front of the camera. Twelve people are watching right now.'),
        line(P, '(삼백 명 중에 열두 명…)', '(Twelve out of three hundred...)'),
      ], {
        choices: [
          opt('go', '한 마리 정도라면요. 카메라는 손만 찍어 주세요.', 'Just one, then. Keep the camera on my hands.', {
            end: endTalk({ accept: true, offer: 'go',
              lineKo: '네! 손만! 고마워요! 여러분, 지나가던 분이 한 마리 도와주신대요. 얼굴은 비밀이에요! …아직 열두 명 그대로 있어요. 다행이다.',
              lineEn: "Yes! Just hands! Thank you! Everyone, someone passing by is going to help us catch one. Their face is a secret! ...Still twelve of you. Phew." }),
            note: ['한 마리 정도라면 하겠다고, 카메라는 손만 찍어 달라고 했다. 유하랑 씨는 삼각대를 낮춰 렌즈를 내 손 쪽으로 돌렸다.',
              "I agreed to one fish, if the camera stayed on my hands. Harang lowered the tripod and turned the lens towards my hands."] }),
          opt('ask_twelve', '열두 명이 지금 이 화면을 보고 있다고요?', 'Twelve people are watching this screen right now?', { next: 'twelve' }),
          opt('stiff_hands', '카메라 앞이면 손이 굳을 것 같은데요.', "I think my hands would freeze up in front of a camera.", { next: 'stiff' }),
          opt('decline', '촬영은 사양할게요.', "I'd rather not be filmed.", {
            say: ['죄송하지만, 촬영은 사양할게요.', "Sorry, but I'd rather not be filmed."], next: 'declined' }),
        ],
        note: ['방파제 끝에서 삼각대를 세워 놓고 혼자 떠드는 사람을 만났다. 유하랑, 구독자 삼백의 낚시 방송인. 두 시간째 못 잡았다며 카메라 앞에서 한 마리만 잡아 달라고 했다. 지금 열두 명이 보고 있다고.',
          "At the end of the breakwater I met someone talking alone at a tripod. Yu Harang, a fishing streamer with three hundred subscribers. Two hours without a catch, she asked me to land just one on camera. Twelve people were watching."],
      }),
      twelve: scene([
        line(H, '네! 지금요! 여기 숫자 보이죠, 열둘.', 'Yes! Right now! See the number here — twelve.'),
        line(N, '(화면을 내 쪽으로 돌린다. 댓글 창이 조용하다.)', '(She turns the screen towards me. The comments are quiet.)'),
        line(P, '…댓글은 조용하네요.', "...The comments are quiet."),
        line(H, '삼백 명 중에 열두 명이면 나쁜 거 아니에요.', "Twelve out of three hundred isn't bad."),
        act(H, 'silence'),
        line(H, '…아니, 나쁜 거 맞아요. 그러니까 한 마리만요. 한 마리면 열세 명 될지도 몰라요.', "...No, it is bad. So, just one. One fish and it might be thirteen."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_twelve' }),
        note: ['열두 명이 정말 보고 있느냐고 묻자, 유하랑 씨는 화면 숫자를 보여 주었다. 나쁜 거 아니라고 했다가, 나쁜 거 맞다고 고쳐 말하고는 한 마리만 부탁했다.',
          "When I asked if twelve people were really watching, Harang showed me the number. Not bad, she said — then corrected herself: it was bad. So, just one fish."],
      }),
      stiff: scene([
        line(H, '저도 그래요! 맨날 굳어요.', 'Me too! Mine freeze up every time.'),
        act(H, 'laugh'),
        line(H, '그래서 혼자 떠드는 거예요, 안 굳으려고.', "That's why I talk to myself — so they don't."),
        line(P, '얼굴이 나오는 건 좀…', "I'd rather my face didn't..."),
        line(H, '얼굴은 안 나오게 할게요. 물고기만 나오면 돼요.', "I'll keep your face out of it. All we need is the fish."),
        line(H, '손이 굳어도 물고기는 안 굳으니까요. 한 마리만요, 진짜로.', "Your hands might freeze, but the fish won't. Just one, really."),
      ], {
        end: endTalk({ accept: true, offer: 'stiff_hands' }),
        note: ['카메라 앞이면 손이 굳을 것 같다고 했다. 유하랑 씨는 자기도 맨날 굳는다고, 그래서 혼자 떠드는 거라며 웃었다. 얼굴은 안 나오게 하겠다고.',
          "I said my hands would freeze up on camera. Harang laughed that hers did too — that's why she talks to herself. She promised to keep my face out of it."],
      }),
      declined: scene([
        line(H, '…아, 네. 죄송해요. 갑자기 붙잡아서요.', '...Oh, right. Sorry. For grabbing you like that.', { act: 'look_away' }),
        line(N, '(유하랑 씨가 삼각대를 접는다. 접은 삼각대를 메고 화면에 대고 인사한다.)', '(Harang folds up the tripod. Shouldering it, she says goodbye to the screen.)'),
        line(H, '오늘은 그림이 안 나왔네요, 여러분. 다음 항구에서는 꼭 보여 드릴게요.', "No good shots today, everyone. At the next harbour I'll show you something, I promise."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['촬영은 사양했다. 유하랑 씨는 미안하다며 삼각대를 접고, 다음 항구에서는 꼭 보여 드리겠다고 화면에 인사했다. 그 사람은 다음 날 다른 항구로 갔다.',
          "I declined to be filmed. Harang apologised, folded her tripod, and told her screen she'd show them something at the next harbour. The next day she moved on to another port."],
      }),
    },
  },

  // N20-1 — 끝내는 자리(유하랑). 방송을 끄고 이야기한 뒤
  {
    id: 'n20_1_done', questId: 'N20-1', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '방송 껐어요. 봤어요? 열두 명이 끝까지 봤어요!', "I've turned it off. Did you see? All twelve watched to the end!"),
        line(P, '한 명도 안 나갔어요?', 'Not one of them left?'),
        line(H, '한 명도요! 챔질할 때 댓글도 하나 달렸어요.', "Not one! And someone commented when you set the hook."),
        line(P, '뭐라고요?', 'What did it say?'),
        line(H, '왔다, 래요. 두 글자.', 'It said: here it comes. Just that.'),
        act(H, 'laugh'),
        line(H, '고마워요. 진짜로.', 'Thank you. Really.'),
        line(P, '(손이 좀 굳긴 했는데, 그래도 한 마리는 올라왔다.)', '(My hands did stiffen a bit, but one came up all the same.)'),
      ], {
        choices: [
          opt('encourage', '열두 명도 보는 사람이에요. 계속하세요.', "Twelve people are still people watching. Keep going.", {
            end: endTalk({ complete: 'encourage',
              lineKo: '…그 말 방송에서 해 주시면 안 돼요? 아니, 됐어요. 제가 기억할게요. 열두 명이면 열두 번 인사할 수 있잖아요. …그렇게 생각하니까 좀 낫네요.',
              lineEn: "...Could you say that on the stream? No, never mind. I'll remember it. With twelve, I can say hello to each one. ...Thinking of it that way helps." }),
            note: ['열두 명도 보는 사람이니 계속하라고 했다. 유하랑 씨는 그 말을 기억하겠다며, 열두 명이면 열두 번 인사할 수 있다고 삼각대를 다시 폈다. 편집본 첫 컷이 내 챔질이었다.',
              "I told her twelve watchers are still people — keep going. Harang said she'd remember it; with twelve she could greet each one. She set the tripod up again. The first shot of her edit was my hookset."] }),
          opt('pay', '출연료라는 게 있으면 받을게요.', "If there's such a thing as an appearance fee, I'll take it.", { next: 'fee' }),
          opt('lesson', '카메라 앞에서 손이 굳는 건 어떻게 풀어요?', 'How do you loosen up when your hands freeze on camera?', {
            end: endTalk({ complete: 'lesson',
              lineKo: '저도 굳어요. 그냥 렌즈를 물고기라고 생각해요. 물고기는 사람 얼굴 안 보잖아요. 렌즈도 그래요. 그쪽 손만 봐요. 손은 그쪽이 제일 잘 아는 거고요.',
              lineEn: "Mine freeze too. I just think of the lens as a fish. Fish don't look at people's faces, right? Neither does the lens. It only watches your hands. And your hands are what you know best." }),
            note: ['카메라 앞에서 손이 굳는 건 어떻게 푸느냐고 물었다. 렌즈를 물고기라고 생각하라고, 렌즈는 얼굴이 아니라 손만 본다고 했다. 묘하게 던지는 게 편해졌다.',
              "I asked how she loosens up on camera. Think of the lens as a fish, Harang said — it only watches your hands. Oddly, casting felt easier after that."] }),
          opt('subscribe', '구독은 어떻게 해요? 제가 하나 보탤게요.', "How do I subscribe? I'll add one more.", { next: 'sub' }),
        ],
        note: ['방송을 끈 유하랑 씨가 열두 명이 끝까지 봤다고 들떠 말했다. 챔질할 때 「왔다」 두 글자 댓글도 달렸다고. 고맙다고, 진짜로.',
          "With the stream off, Harang said excitedly that all twelve watched to the end. Someone even commented just as I set the hook. Thank you, she said — really."],
      }),
      fee: scene([
        line(H, '있어요… 광고 수익…', 'There is... ad revenue...'),
        line(H, '이번 달은 쥐꼬리만 해요.', "This month it's a pittance."),
        line(P, '아, 그럼 괜찮아요. 농담이에요.', "Oh, then don't worry. I was joking."),
        line(H, '아니요! 진지하게 반 나눌게요.', 'No! I mean it — half is yours.'),
        act(H, 'give', { to: P }),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '다음 달엔 두 배 될 거예요. 아마요. 두 배 되면 또 반 드릴게요. 방금 정한 출연료 계약이에요.',
          lineEn: "Next month it'll double. Probably. When it does, I'll give you half again. That's our appearance contract, just signed." }),
        note: ['출연료가 있으면 받겠다고 했더니, 유하랑 씨는 쥐꼬리만 한 이번 달 광고 수익을 진지하게 반으로 나눠 주었다. 다음 달 두 배가 되면 또 반이라고.',
          "When I asked about an appearance fee, Harang solemnly split this month's tiny ad revenue in half with me. When it doubles next month, half again, she said."],
      }),
      sub: scene([
        line(H, '구독이요?', 'Subscribe?', { act: 'look_up' }),
        line(N, '(유하랑 씨가 화면을 보다가 소리를 지른다.)', '(Harang looks at her screen and shrieks.)'),
        line(H, '삼백 하나! 방송 끈 게 아깝다, 이거 찍었어야 했는데!', "Three hundred and one! I can't believe I turned it off — I should have filmed this!"),
      ], {
        end: endTalk({ complete: 'subscribe',
          lineKo: '…버튼은 여기요. 종 모양도 눌러 주시면 알림이 가요. 안 눌러도 돼요! 눌러 주시면 좋고요.',
          lineEn: "...The button's here. If you tap the bell too, you'll get alerts. You don't have to! But it'd be nice." }),
        note: ['구독하겠다고 했다. 유하랑 씨는 화면을 보다가 삼백 하나라며 소리를 질렀다. 방송 끈 게 아깝다고.', "I said I'd subscribe. Harang looked at her screen and shrieked — three hundred and one. She wished she hadn't turned the stream off."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N20-2 「섬네일 각」 — 받는 자리(유하랑 · 울산 방어진 방파제)
  // ═══════════════════════════════════════════
  {
    id: 'n20_2_offer', questId: 'N20-2', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '어! 또 만났네요!', 'Oh! We meet again!', { act: 'look_up' }),
        line(P, '유하랑 씨? 울산까지 오셨어요?', 'Harang? You came all the way to Ulsan?'),
        line(H, '방어진 방파제가 노을 맛집이래요. 그래서 왔죠.', "They say Bangeojin breakwater has the best sunsets. So here I am."),
        line(H, '근데 마침 잘 오셨어요. 부탁이 있어요.', "And you've come at just the right time. I've got a favour to ask."),
        line(P, '또 한 마리요?', 'Another fish?'),
        line(H, '아뇨! 이번엔 해 떨어지는 그림이 필요해요.', 'No! This time I need a shot of the sun going down.'),
        line(P, '해 떨어지는 그림이요?', 'A shot of the sun going down?'),
        line(H, '일몰까지만 저기 앉아 있어 줘요. 조과는 욕심 안 내요.', "Just sit over there until sunset. I'm not greedy about the catch."),
        line(H, '해 질 무렵에 두 마리만 올라오면, 그거면 그림이 살아요.', "If two bite around dusk, that brings the shot to life."),
        line(P, '(낚시를 하러 와서, 앉아 있는 게 일이라니.)', "(Come out fishing, and the job is to sit.)"),
      ], {
        choices: [
          opt('sit_till_dusk', '앉아 있는 건 자신 있어요. 해 질 때까지 있을게요.', "Sitting still I can do. I'll stay till the sun goes down.", {
            end: endTalk({ accept: true, offer: 'sit_till_dusk',
              lineKo: '다행이다! 사람들이 앉아 있는 걸 제일 못해요. 다들 뭘 하려고 해서. 얼굴 말고 등이 나와요. 해랑 등. 움직이고 싶으면 바다만 보세요.',
              lineEn: "Phew! Sitting still is what people are worst at. Everyone wants to do something. It'll be your back, not your face. The sun and your back. If you want to move, just look at the sea." }),
            note: ['앉아 있는 건 자신 있다고, 해 질 때까지 있겠다고 했다. 유하랑 씨는 삼각대를 내 등 뒤로 옮기며, 얼굴 말고 등이 나온다고 했다.',
              "I said sitting still was something I could do, and I'd stay till sunset. Harang moved the tripod behind me — it would be my back, not my face."] }),
          opt('why_person', '노을만 찍어도 되지 않아요?', "Couldn't you just film the sunset?", {
            say: ['해 떨어지는 그림이면 노을만 찍어도 되지 않아요?', "If it's a sunset shot, couldn't you just film the sunset?"], next: 'shot' }),
          opt('itchy_hands', '앉아만 있으면 손이 근질거릴 것 같은데요.', 'Just sitting there, my hands would get itchy.', { next: 'itchy' }),
          opt('decline', '오늘은 해 질 때까지 못 있어요. 다음에 할게요.', "I can't stay till sunset today. Another time.", {
            end: endTalk({ decline: true, offer: 'decline',
              lineKo: '아… 해는 내일도 떨어지니까요. 괜찮아요! 다음에 와 주세요. 노을은 매일 다르대요. 내일 건 오늘보다 나을지도 몰라요.',
              lineEn: "Ah... the sun goes down tomorrow too. It's fine! Come next time. They say every sunset's different. Tomorrow's might beat today's." }),
            note: ['오늘은 해 질 때까지 못 있겠다고 했다. 유하랑 씨는 해는 내일도 떨어진다며 삼각대 다리를 하나씩 접었다.', "I said I couldn't stay till sunset today. The sun sets tomorrow too, Harang said, folding the tripod legs one by one."] }),
        ],
        note: ['울산 방어진 방파제에서 유하랑 씨를 다시 만났다. 이번엔 해 떨어지는 그림이 필요하다며, 일몰까지 앉아 있어 달라고 했다. 해 질 무렵 두 마리만 올라오면 그림이 산다고.',
          "I ran into Harang again at Bangeojin breakwater in Ulsan. This time she needed a sunset shot, and asked me to sit there until sundown. Two fish around dusk would bring the shot to life."],
      }),
      shot: scene([
        line(H, '노을만 찍으면 그냥 노을이에요.', "Film just the sunset and it's just a sunset."),
        line(H, '사람이 하나 있어야 이야기가 돼요.', 'You need one person in it to make a story.'),
        line(N, '(손가락으로 네모를 만들어 그 안에 나를 넣는다.)', '(She makes a frame with her fingers and puts me in it.)'),
        line(P, '그게 저예요?', "And that's me?"),
        line(H, '바다 보는 사람 하나. 그게 제일 많이 눌려요.', 'One person looking at the sea. That gets the most clicks.'),
        line(H, '아, 이건 비밀이에요. 영업 비밀.', "Oh, that's a secret. A trade secret."),
      ], {
        end: endTalk({ accept: true, offer: 'why_person' }),
        note: ['노을만 찍어도 되지 않느냐고 묻자, 유하랑 씨는 노을만 찍으면 그냥 노을이라고 했다. 바다 보는 사람 하나가 있어야 이야기가 되고, 그게 제일 많이 눌린다고. 영업 비밀이라고.',
          "When I asked why not just film the sunset, Harang said then it's just a sunset. One person looking at the sea makes a story — and gets the most clicks. A trade secret, she said."],
      }),
      itchy: scene([
        line(H, '던져도 돼요! 해 질 무렵엔 입질이 온대요.', "You can cast! They say the bites come around dusk."),
        line(P, '그럼 낚시는 해도 되는 거죠?', 'So fishing is allowed?'),
        line(H, '대신 일어나지만 마요. 일어나면 그림이 바뀌어요.', "Just don't stand up. If you stand, the shot changes."),
        line(N, '(엄지를 들어 보인다.)', '(She gives a thumbs up.)'),
        line(H, '앉아서 던지는 건 괜찮아요. 그것도 그림이에요.', "Casting sitting down is fine. That's a shot too."),
      ], {
        end: endTalk({ accept: true, offer: 'itchy_hands' }),
        note: ['앉아만 있으면 손이 근질거릴 것 같다고 했다. 유하랑 씨는 던져도 된다고, 일어나지만 말라고 했다. 앉아서 던지는 것도 그림이라고.', "I said my hands would itch just sitting. Harang said I could cast — just not stand up. Casting while seated was a shot too."],
      }),
    },
  },

  // N20-2 — 끝내는 자리(유하랑). 찍힌 걸 같이 본 뒤
  {
    id: 'n20_2_done', questId: 'N20-2', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '이거 봐요. 찍힌 거.', 'Look at this. The footage.'),
        line(P, '이게… 저예요?', "That's... me?", { act: 'peer' }),
        line(H, '등이요. 해 넘어가는 쪽으로 앉은 등.', 'Your back. Sitting facing where the sun went down.'),
        line(P, '등만 나오네요.', "It's only my back."),
        line(H, '등이… 좋아요.', 'Your back... it\'s good.'),
        act(H, 'silence'),
        line(H, '섬네일 이걸로 할래요.', "I'm using this for the thumbnail."),
      ], {
        choices: [
          opt('watch', '낚시 안 하고 바다만 본 건 처음이었어요.', 'That was the first time I watched the sea without fishing.', {
            end: endTalk({ complete: 'watch',
              lineKo: '그렇죠? 저는 그게 좋아서 찍어요. 잡는 영상은 많아요. 기다리는 영상은 없어요. 그래서 제 채널이 작은가 봐요. 그래도 저는 이게 좋아요.',
              lineEn: "Right? That's why I film. There are loads of catching videos. There are no waiting videos. Maybe that's why my channel is small. Still, I like this." }),
            note: ['낚시 안 하고 바다만 본 건 처음이었다고 했다. 유하랑 씨는 그게 좋아서 찍는다고, 기다리는 영상은 없어서 채널이 작은가 보다고 했다. 영상 제목이 낚시가 아니라 사람이 됐다.',
              "I said it was my first time just watching the sea without fishing. That's why she films, Harang said — nobody makes waiting videos, maybe that's why her channel is small. The video's title became a person, not fishing."] }),
          opt('pay', '출연료 받을게요.', "I'll take an appearance fee.", { next: 'fee' }),
          opt('lesson', '구도 잡는 법, 저도 알고 싶어요.', "I'd like to know how you frame a shot.", {
            end: endTalk({ complete: 'lesson',
              lineKo: '해를 왼쪽에 두고 사람을 오른쪽에. 가운데 두면 그림이 멈춰요. 한쪽으로 비켜 두면 사람이 어딘가로 가는 것 같아요. 그게 이야기예요.',
              lineEn: "Sun on the left, person on the right. Put them in the middle and the picture stops. Set them off to one side and they look like they're going somewhere. That's a story." }),
            note: ['구도 잡는 법을 물었다. 해를 왼쪽에, 사람을 오른쪽에 두라고 했다. 한쪽으로 비켜 두면 사람이 어딘가로 가는 것 같다고. 사람을 보는 눈이 조금 달라졌다.',
              "I asked how she frames a shot. Sun on the left, person on the right, Harang said — set off to one side, they seem to be going somewhere. I started seeing people a little differently."] }),
          opt('small_back', '제 등이 그렇게 작은 줄 몰랐어요. 좀 서운한데요.', "I didn't know my back looked that small. I'm a bit hurt.", {
            end: endTalk({ complete: 'small_back',
              lineKo: '작아서 좋은 거예요! 바다가 커 보이잖아요. 사람이 작게 나와야 바다가 주인공이 돼요. 그쪽 등이 그걸 해 줬어요. 큰 등은 바다를 가려요.',
              lineEn: "Small is what makes it good! The sea looks huge. The person has to be small for the sea to be the star. Your back did that. A big back would hide the sea." }),
            note: ['등이 그렇게 작은 줄 몰라 서운하다고 했다. 유하랑 씨는 화면을 키워 보여 주며, 사람이 작게 나와야 바다가 주인공이 된다고 했다.', "I said I was a little hurt my back looked so small. Harang enlarged the screen to show me — the person has to be small for the sea to be the star."] }),
        ],
        note: ['찍힌 걸 같이 보았다. 해 넘어가는 쪽으로 앉은 내 등이 생각보다 작았다. 유하랑 씨는 등이 좋다며 섬네일로 하겠다고 했다.', 'We watched the footage together. My back, facing the setting sun, was smaller than I expected. Harang said it was good — she would use it for the thumbnail.'],
      }),
      fee: scene([
        line(H, '이번 달 광고 수익, 두 배 됐어요!', "This month's ad revenue doubled!"),
        line(P, '두 배요?', 'Doubled?'),
        line(H, '진지하게 반이에요. 계약대로.', 'Half is yours, seriously. As agreed.'),
        act(H, 'give', { to: P }),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '반은 그쪽 등 값이에요. 섬네일이 등이니까요. 나머지 반은 노을 값이고요. 노을은 돈을 안 받아서 제가 가져요.',
          lineEn: "Half is for your back, since the thumbnail is your back. The other half is for the sunset. The sunset doesn't take money, so I keep that." }),
        note: ['출연료를 받겠다고 했다. 유하랑 씨는 광고 수익이 두 배가 됐다며 반을 주었다. 반은 내 등 값, 나머지는 노을 값이라 자기가 갖는다고.', "I took an appearance fee. Ad revenue had doubled, Harang said, and gave me half — half for my back, and the sunset's half she kept."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N20-3 「합방 요청」 — 받는 자리(유하랑 · 거제에서 · 카메라가 속초까지 따라온다)
  // ═══════════════════════════════════════════
  {
    id: 'n20_3_offer', questId: 'N20-3', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '저 결심했어요.', "I've made up my mind."),
        line(P, '뭘요?', 'About what?'),
        line(H, '합방해요! 그쪽이랑.', "Let's do a collab! You and me."),
        line(P, '합방이요?', 'A collab?'),
        line(H, '대신 그쪽 홈그라운드로 갈게요.', "But I'll come to your home ground."),
        line(P, '제 홈그라운드라면…', 'My home ground...'),
        line(H, '속초요! 둘이 나란히 앉아서 두 마리 올리는 거예요.', "Sokcho! We sit side by side and land two fish."),
        line(H, '좌판도 찍고요. 아, 허락 받고요.', 'And film the stalls too. Oh — with permission, of course.'),
        line(P, '(카메라가 속초까지 따라오겠구나.)', "(So the camera's following me all the way to Sokcho.)"),
      ], {
        choices: [
          opt('guide_sokcho', '속초라면 안내할게요. 만복상회 앞자리가 좋아요.', "If it's Sokcho, I'll show you round. The spot in front of Manbok Store is good.", {
            end: endTalk({ accept: true, offer: 'guide_sokcho',
              lineKo: '만복상회! 이름부터 그림이에요. 둘이 나란히 두 마리. 그게 합방이에요. 한 사람이 잘하는 거 말고, 둘이 같이 하는 거요. 제가 못 낚아도 그쪽이 낚으면 돼요.',
              lineEn: "Manbok Store! Even the name's a picture. Two of us, side by side, two fish. That's a collab. Not one person doing well — two people doing it together. If I can't catch one, you can." }),
            note: ['속초라면 안내하겠다고, 만복상회 앞자리가 좋다고 했다. 유하랑 씨는 이름부터 그림이라며 수첩에 받아 적었다. 둘이 나란히 두 마리가 합방이라고.',
              "I offered to show her Sokcho — the spot in front of Manbok Store. Harang wrote it down; even the name's a picture, she said. Two people side by side, two fish: that's a collab."] }),
          opt('ask_collab', '합방이 정확히 뭐예요? 같이 방송한다는 거예요?', 'What exactly is a collab? We stream together?', { next: 'collab' }),
          opt('ask_permission', '좌판은 정옥선 씨께 먼저 여쭤야 해요. 허락 없이는 안 돼요.', "We'd have to ask Okseon about the stall first. Not without her permission.", { next: 'permission' }),
          opt('home_ground', '홈그라운드라니, 제가 속초 사람 다 됐나 봐요.', "Home ground — I guess I've become a Sokcho local.", { next: 'home' }),
        ],
        note: ['유하랑 씨가 합방을 하자고 했다. 대신 내 홈그라운드인 속초로 오겠다고, 둘이 나란히 앉아 두 마리를 올리고 좌판도 허락 받고 찍겠다고 했다.',
          "Harang proposed a collab. She'd come to my home ground, Sokcho — we'd sit side by side and land two fish, and film the stalls, with permission."],
      }),
      collab: scene([
        line(H, '네! 한 화면에 둘이요.', 'Yes! Two people on one screen.'),
        line(H, '제 구독자가 그쪽을 보고, 그쪽 구독자가… 아, 그쪽은 구독자가 없죠.', "My subscribers see you, and your subscribers... oh, you don't have any."),
        act(H, 'laugh'),
        line(P, '없죠.', "I don't."),
        line(H, '그러니까 제 쪽에서 그쪽을 소개하는 거예요. 속초 바다랑 같이.', "So I introduce you, on my side. Along with the Sokcho sea."),
        line(H, '그 동네는 그 동네 사람이 보여 주는 게 제일 좋거든요.', "A place is best shown by someone who lives there."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_collab' }),
        note: ['합방이 뭐냐고 물었다. 한 화면에 둘이 나오는 거라고, 내겐 구독자가 없으니 자기 쪽에서 나를 속초 바다랑 같이 소개하겠다고 했다. 그 동네는 그 동네 사람이 보여 주는 게 제일 좋다고.',
          "I asked what a collab was. Two people on one screen, Harang said — and since I had no subscribers, she'd introduce me along with the Sokcho sea. A place is best shown by its own people."],
      }),
      permission: scene([
        line(H, '당연하죠! 그래서 허락 받는다고 했잖아요.', "Of course! That's why I said with permission."),
        line(H, '정옥선 씨요? 좌판 주인분이죠?', 'Okseon? She runs the stall?'),
        line(P, '네. 만복상회요.', 'Yes. Manbok Store.'),
        line(N, '(두 손을 모은다.)', '(She presses her palms together.)'),
        line(H, '같이 가서 여쭤봐 주세요. 제가 혼자 가면 삼각대 든 수상한 사람이에요.', "Please come and ask her with me. If I go alone, I'm just a suspicious person with a tripod."),
        line(H, '그쪽이 옆에 있으면 덜 수상하겠죠.', "With you beside me, I'll look less suspicious."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_permission' }),
        note: ['좌판은 정옥선 씨께 먼저 여쭤야 한다고 했다. 유하랑 씨는 당연하다며, 혼자 가면 삼각대 든 수상한 사람이니 같이 가서 여쭤 달라고 했다.',
          "I said we'd have to ask Okseon first about the stall. Of course, Harang said — alone she'd be a suspicious person with a tripod, so would I come and ask with her."],
      }),
      home: scene([
        line(H, '다 됐어요! 그쪽은 속초 얘기할 때 표정이 달라요.', "You have! Your face changes when you talk about Sokcho."),
        line(H, '그거 찍으러 가는 거예요.', "That's what I'm going to film."),
        line(N, '(카메라를 들어 내 얼굴에 대 보는 시늉을 한다.)', '(She lifts the camera and pretends to aim it at my face.)'),
        line(P, '얼굴은 좀…', 'Not my face...'),
        line(H, '…아, 맞다. 그쪽은 얼굴보다 등이 더 잘 나오죠. 섬네일 때 봤잖아요. 등으로 할게요.', "...Oh, right. Your back comes out better than your face. We saw that with the thumbnail. Back it is."),
      ], {
        end: endTalk({ accept: true, offer: 'home_ground' }),
        note: ['홈그라운드라니 속초 사람 다 됐나 보다고 했다. 유하랑 씨는 내가 속초 얘기할 때 표정이 달라서 그걸 찍으러 가는 거라고 했다. 그러다 얼굴보다 등이 잘 나오니 등으로 하겠다고.',
          "I said I must have become a Sokcho local. Harang said my face changes when I talk about Sokcho — that's what she wanted to film. Then she remembered my back films better, so: back it is."],
      }),
    },
  },

  // N20-3 — 끝내는 자리(유하랑). 편집본을 확인한 뒤
  {
    id: 'n20_3_done', questId: 'N20-3', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '편집본 봤죠?', "You've seen the edit, right?"),
        line(P, '네. 둘이 나란히 앉아서 두 마리 올리는 데까지요.', 'Yes. Right up to the two of us side by side, landing the two fish.'),
        line(H, '그거 말고요. 그 뒤에요.', 'Not that. Right after.'),
        line(P, '뒤에요?', 'After?'),
        line(H, '좌판 할머니가 뒤로 지나가시는 컷이요. 얼음 상자 들고.', 'The shot where the stall grandma walks by behind us. Carrying an ice box.'),
        line(P, '정옥선 씨요? 카메라는 한 번도 안 보셨는데요.', 'Okseon? She never once looked at the camera.'),
        line(H, '그래서 좋았어요.', "That's why it was good.", { act: 'nod' }),
        line(H, '그 컷, 남길래요. 그게 제일 좋았어요.', "I'm keeping that shot. It was the best part."),
      ], {
        choices: [
          opt('keep_cut', '그 컷은 꼭 남겨 주세요.', 'Please do keep that shot.', {
            end: endTalk({ complete: 'keep_cut',
              lineKo: '네! 그 컷이 메인이에요! 카메라 안 보는 사람이 제일 잘 나오거든요. 영상 나가면 할머니께도 꼭 보여 드릴게요.',
              lineEn: "Yes! That shot's the main one! People who don't look at the camera come out best. When it goes up, I'll be sure to show her." }),
            note: ['그 컷은 꼭 남겨 달라고 했다. 유하랑 씨는 그 컷이 메인이라고 했다. 나중에 정옥선 씨가 영상 속 자기를 보고 웃었다는 걸 들었다.',
              "I asked her to keep that shot. It was the main one, Harang said. Later I heard Okseon had laughed when she saw herself in the video."] }),
          opt('pay', '합방 출연료 받을게요.', "I'll take the collab appearance fee.", {
            end: endTalk({ complete: 'pay',
              lineKo: '이번엔 진짜 있어요! 구독자 천 넘었어요! 속초 편을 제일 많이 봤대요. 그쪽 동네 덕이에요. 봉투에 동네 몫도 들어 있다고 생각해 주세요.',
              lineEn: "This time there really is one! Subscribers passed a thousand! The Sokcho episode got the most views. That's thanks to your town. Think of the envelope as having the town's share in it too." }),
            note: ['합방 출연료를 받았다. 구독자가 천을 넘었다고, 속초 편을 제일 많이 봤다고 했다. 봉투가 처음으로 봉투다웠다.', "I took the collab fee. Subscribers had passed a thousand, and the Sokcho episode got the most views. For the first time, the envelope felt like an envelope."] }),
          opt('lesson', '유하랑 씨는 사람 찍을 때 어디를 봐요?', 'Where do you look when you film people, Harang?', {
            end: endTalk({ complete: 'lesson',
              lineKo: '손이요. 얼굴 말고. 얼굴은 카메라를 보면 꾸며요. 손은 못 꾸며요. 할머니 손 봤죠? 그 손이 다 말해요.',
              lineEn: "The hands. Not the face. Faces put on a show for the camera. Hands can't. Did you see her hands? They say everything." }),
            note: ['사람 찍을 때 어디를 보느냐고 물었다. 얼굴이 아니라 손이라고 했다. 얼굴은 꾸며도 손은 못 꾸민다고. 사람 손을 보는 눈이 생겼다.', "I asked where she looks when filming people. The hands, Harang said, not the face — faces perform, hands can't. I began to notice people's hands."] }),
          opt('shop_name', '출연료는 됐어요. 만복상회 이름만 영상에 남겨 주세요.', "No fee. Just put Manbok Store's name in the video.", {
            end: endTalk({ complete: 'shop_name',
              lineKo: '만복상회! 당연하죠. 영상 끝에 크게 넣을게요. 찾아오는 사람 생기면 할머니한테 혼나는 거 아니에요? …혼나도 넣을래요. 좋은 데는 알려야죠.',
              lineEn: "Manbok Store! Of course. I'll put it big at the end. Won't I get told off by her if people start showing up? ...I'll put it in anyway. Good places should be known." }),
            note: ['출연료 대신 만복상회 이름을 영상에 남겨 달라고 했다. 유하랑 씨는 수첩에 받아 적으며, 혼나도 영상 끝에 크게 넣겠다고 했다.', "Instead of a fee, I asked her to put Manbok Store's name in the video. Harang wrote it down — she'd put it big at the end, even if she got told off."] }),
        ],
        note: ['편집본을 같이 봤다. 유하랑 씨는 둘이 낚은 장면보다 그 뒤에 정옥선 씨가 얼음 상자를 들고 지나가는 컷이 제일 좋았다며 남기겠다고 했다. 카메라를 한 번도 안 봐서 좋았다고.',
          "We watched the edit together. Harang said the best part wasn't our catch but the shot after, where Okseon walks by with an ice box — she never looked at the camera. She'd keep it."],
      }),
    },
  },
];
