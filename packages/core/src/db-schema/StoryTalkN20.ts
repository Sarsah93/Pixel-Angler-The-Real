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

  // ═══════════════════════════════════════════
  // N20-4 「조회수와 금어기」 — 받는 자리(유하랑 · 제주). 금어기 개체가 걸렸다 — 어느 답이든 재고 바로 놓아준다
  // ═══════════════════════════════════════════
  {
    id: 'n20_4_offer', questId: 'N20-4', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '어, 걸렸다! 잠깐만요, 카메라!', 'Oh, a bite! Hang on — the camera!', { act: 'look_up' }),
        line(P, '올라와요. 크기가 꽤 되네요.', 'Here it comes. Decent size.'),
        line(H, '…어? 이거.', '...Huh? This one.', { act: 'peer' }),
        line(H, '아, 금어기네요… 지금 잡으면 안 되는 애죠?', "Oh, it's closed season for these... We're not supposed to keep them now, are we?"),
        line(P, '네. 지금은 금어기예요.', "Right. It's closed season."),
        line(H, '그거 잠깐만 들고 계세요.', 'Just hold it up for a moment.'),
        line(P, '네?', 'Sorry?'),
        line(H, '각만 잡고요. 잠깐이면 돼요. 빛이 지금 딱 좋거든요.', "Just for the angle. It'll only take a second. The light's perfect right now."),
        line(P, '(물 밖에 오래 두면 안 되는데…)', "(It shouldn't be out of the water long...)"),
      ], {
        choices: [
          opt('no_holding', '금어기 고기는 들고 찍는 게 아니에요. 재고 바로 놓을게요.', "You don't pose with a closed-season fish. I'll measure it and let it go.", { next: 'refuse' }),
          opt('how_long', '각 잡는 데 얼마나 걸리는데요?', 'How long does getting the angle take?', { next: 'howlong' }),
          opt('in_water', '물에 담근 채로 자만 대고 찍으세요. 들어 올리진 않을게요.', "Film it in the water with the ruler on it. I won't lift it out.", { next: 'water' }),
          opt('film_release', '조회수 걱정은 알아요. 놓아주는 장면을 찍죠.', "I know you're worried about views. Film the release instead.", {
            end: endTalk({ accept: true, offer: 'film_release',
              lineKo: '…들켰다. 요즘 숫자가 좀 그래서요. 놓아주는 거요? 그걸 누가 봐요… 아니, 모르죠. 봐 줄 수도 있죠. 찍을게요. 재는 것부터 놓는 데까지 한 번에.',
              lineEn: "...Caught me. The numbers have been bad lately. The release? Who'd watch that... no, who knows. Maybe they would. I'll film it. From measuring to letting go, in one take." }),
            note: ['조회수 걱정은 알지만 놓아주는 장면을 찍자고 했다. 유하랑 씨는 들켰다며 웃으려다 말고, 재는 것부터 놓는 데까지 한 번에 찍겠다고 했다.',
              "I said I knew she was worried about views, but to film the release instead. Caught me, Harang said, almost laughing — she'd film from measuring to release in one take."] }),
        ],
        note: ['제주에서 유하랑 씨 카메라 앞에 금어기 개체가 걸렸다. 유하랑 씨는 각만 잡게 잠깐 들고 있어 달라고 했다. 물 밖에 오래 두면 안 되는 고기였다.',
          "In Jeju, a closed-season fish came up in front of Harang's camera. She asked me to hold it up for a moment, just for the angle. It was a fish that shouldn't stay out of the water long."],
      }),
      refuse: scene([
        line(H, '…아. 다들 들고 찍길래요. 저도 모르게.', "...Oh. Everyone poses with them, so I just... without thinking.", { act: 'look_away' }),
        line(N, '(카메라가 잠깐 바닥을 향한다.)', '(The camera dips towards the ground for a moment.)'),
        line(H, '그럼 재는 것까지만 찍을게요. 놓아주는 것도요.', "Then I'll just film the measuring. And the release."),
        line(H, '그건… 괜찮죠? 빨리요. 제가 말하는 동안에도 숨 못 쉬잖아요.', "That's... all right, isn't it? Quick. It can't breathe while I'm talking."),
      ], {
        end: endTalk({ accept: true, offer: 'no_holding' }),
        note: ['금어기 고기는 들고 찍는 게 아니라고, 재고 바로 놓겠다고 했다. 유하랑 씨는 다들 들고 찍길래 저도 모르게 그랬다며, 재는 것과 놓아주는 것만 찍겠다고 했다.',
          "I said you don't pose with closed-season fish — I'd measure it and release it. Harang said everyone poses, so she'd asked without thinking; she'd film only the measuring and the release."],
      }),
      howlong: scene([
        line(H, '삼십 초요. 아니, 일 분? 빛 들어오는 방향 맞추고, 비늘 반짝이는 각도 찾고…', 'Thirty seconds. No, a minute? Line up the light, find the angle where the scales shine...'),
        act(H, 'silence'),
        line(H, '…물 밖에서 일 분이면 길죠.', "...A minute out of the water is long, isn't it."),
        line(P, '길어요.', 'It is.'),
        line(H, '그쵸. 재고 바로 놔 주세요. 제가 그 장면을 찍을게요.', "Right. Measure it and let it go straight away. I'll film that."),
      ], {
        end: endTalk({ accept: true, offer: 'how_long' }),
        note: ['각 잡는 데 얼마나 걸리느냐고 물었다. 유하랑 씨는 삼십 초, 아니 일 분이라고 하다가 스스로 멈췄다. 물 밖에서 일 분이면 길다고, 재고 바로 놔 달라고 했다.',
          "I asked how long the angle would take. Thirty seconds, no, a minute, Harang began — then stopped herself. A minute out of the water is long. Measure it and let it go, she said."],
      }),
      water: scene([
        line(H, '물속에서요? 그림이 더 좋을 수도 있겠다!', 'In the water? That might even look better!'),
        line(N, '(카메라를 수면 가까이 낮춘다.)', '(She lowers the camera close to the surface.)'),
        line(H, '…아니, 그림 얘기 할 때가 아니죠.', "...No, this isn't the time to talk about shots."),
        line(H, '빨리 재요. 제가 숫자 읽을게요.', "Measure it, quick. I'll read out the number."),
        line(P, '다 읽으시면 바로 놓을게요.', "As soon as you've read it, I'll let it go."),
      ], {
        end: endTalk({ accept: true, offer: 'in_water' }),
        note: ['물에 담근 채로 자만 대고 찍자고 했다. 유하랑 씨는 그림이 더 좋겠다고 했다가 지금 그럴 때가 아니라며, 숫자를 읽으면 바로 놔 달라고 했다.',
          "I suggested filming it in the water with the ruler on it. Harang said that might look better — then said this wasn't the time. Once she read the number, let it go."],
      }),
    },
  },

  // N20-4 — 끝내는 자리(유하랑). 카메라 앞에서 이유를 말한 뒤
  {
    id: 'n20_4_done', questId: 'N20-4', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '올렸어요. 그 영상.', 'I put it up. That video.'),
        line(P, '재고 놓아주는 거요?', 'The measuring and the release?'),
        line(H, '네. 그리고 그 부분, 안 잘랐어요.', "Yes. And that part — I didn't cut it."),
        line(P, '어느 부분이요?', 'Which part?'),
        line(H, '왜 그랬는지 그쪽이 카메라 앞에서 말한 거요.', 'The part where you told the camera why you did it.'),
        line(P, '(길게 말하지도 못했는데.)', "(I didn't even say much.)"),
        line(H, '조회수보다 그게 남았어요.', 'That stuck more than the view count.', { act: 'look_sea' }),
      ], {
        choices: [
          opt('explain', '이유를 말하는 것, 그게 방송 아닐까요?', "Saying why — isn't that what a broadcast is?", {
            say: ['카메라 앞에서 이유를 말한 거요. 그게 방송 아닐까요?', "Saying why, in front of the camera. Isn't that what broadcasting is?"],
            end: endTalk({ complete: 'explain',
              lineKo: '…그게 방송이에요. 배웠어요. 저는 그림만 생각했어요. 그쪽은 그 고기가 내년에 어디 있을지를 생각했고요. 그게 차이예요.',
              lineEn: "...That is broadcasting. I learned that. I only thought about the shot. You thought about where that fish would be next year. That's the difference." }),
            note: ['이유를 말하는 게 방송 아니냐고 했다. 유하랑 씨는 배웠다고, 자기는 그림만 생각했는데 나는 그 고기가 내년에 어디 있을지를 생각했다고 했다. 그 영상이 채널에서 제일 오래 남았다.',
              "I said saying why is what broadcasting is. Harang said she'd learned — she'd thought only of the shot, while I thought of where that fish would be next year. That video lasted longest on her channel."] }),
          opt('lesson', '금어기 고기를 어떻게 보여 줄지, 같이 생각해 보고 싶어요.', "I'd like to think together about how to show closed-season fish.", {
            end: endTalk({ complete: 'lesson',
              lineKo: '자를 같이 찍어요. 숫자를요. 숫자가 나오면 다들 왜 놓아주는지 알아요. 설명이 필요 없어요. 자가 대신 말해 주니까요.',
              lineEn: "Film the ruler with it. The number. When the number shows, everyone knows why you let it go. No explanation needed. The ruler says it for you." }),
            note: ['금어기 고기를 어떻게 보여 줄지 같이 생각해 보자고 했다. 자를 같이 찍으면 숫자가 대신 말해 준다고 했다. 계측 방송이라는 게 생겼다.', "I suggested we think about how to show closed-season fish. Film the ruler, Harang said — the number speaks for you. A new kind of measuring segment was born."] }),
          opt('pay', '출연료로 받을게요.', "I'll take it as an appearance fee.", {
            end: endTalk({ complete: 'pay',
              lineKo: '네… 이번 영상 수익. 방생 영상이 제일 많이 벌었어요, 이상하게. 이상한 게 아닌가 봐요. 사람들은 놓아주는 걸 보고 싶었던 거예요. 저만 몰랐어요.',
              lineEn: "Right... this video's earnings. The release video made the most, strangely. Maybe it isn't strange. People wanted to see the letting go. I'm the only one who didn't know." }),
            note: ['출연료를 받았다. 방생 영상이 제일 많이 벌었다고, 사람들은 놓아주는 걸 보고 싶었던 거라고 했다. 봉투가 두꺼웠다.', "I took a fee. The release video earned the most, Harang said — people wanted to see the letting go. The envelope was thick."] }),
          opt('waive_fee', '출연료는 됐어요. 그 부분을 안 자른 걸로 충분해요.', "No fee. Not cutting that part is enough.", {
            end: endTalk({ complete: 'waive_fee',
              lineKo: '…그런 말 하시면 저 울어요. 그 부분에 댓글이 제일 많아요. 다 금어기가 뭐냐는 질문이에요. 대답은 그쪽이 영상에서 다 해 놨고요.',
              lineEn: "...Say that and I'll cry. That part has the most comments. They're all asking what closed season is. And you already answered them all in the video." }),
            note: ['출연료는 됐다고, 그 부분을 안 자른 걸로 충분하다고 했다. 유하랑 씨는 웃으면서 눈가를 손등으로 닦았다. 그 부분에 금어기가 뭐냐는 댓글이 제일 많다고.', "I said no fee — not cutting that part was enough. Harang laughed and wiped her eyes with the back of her hand. That part had the most comments, all asking what closed season is."] }),
        ],
        note: ['유하랑 씨가 재고 놓아주는 영상을 올렸다. 내가 카메라 앞에서 이유를 말한 부분을 자르지 않았다고, 조회수보다 그게 남았다고 했다.', "Harang uploaded the measuring-and-release video. She hadn't cut the part where I explained why on camera — that stuck more than the views, she said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N20-5 「오프라인」 — 받는 자리(유하랑 · 울릉). 구독자 몇이 찾아왔다 — 카메라를 끈다
  // ═══════════════════════════════════════════
  {
    id: 'n20_5_offer', questId: 'N20-5', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '저기요, 저쪽 봐요.', 'Hey, look over there.'),
        line(P, '저분들은…?', 'Those people...?'),
        line(H, '구독자분들이에요. 울릉까지 왔어요.', "They're subscribers. They came all the way to Ulleung."),
        line(P, '여기까지요?', 'All the way out here?'),
        line(H, '배 타고요. 저도 몰랐어요.', "By boat. I didn't know either.", { act: 'look_away' }),
        act(H, 'silence'),
        line(H, '카메라 끌게요.', "I'm turning the camera off."),
        line(P, '네? 유하랑 씨가요?', 'What? You are?'),
        line(H, '오늘은 그냥 낚시해요. 카메라 없이 세 마리.', 'Today we just fish. Three fish, no camera.'),
        line(H, '끝나면 다 같이 먹어요.', "And when we're done, we all eat together."),
        line(P, '(카메라를 내려놓는 유하랑 씨라니.)', '(Harang, putting her camera down.)'),
      ], {
        choices: [
          opt('no_camera', '카메라 없는 유하랑 씨는 처음 봐요. 좋네요.', "I've never seen you without a camera. I like it.", {
            end: endTalk({ accept: true, offer: 'no_camera',
              lineKo: '저도 저 처음 봐요. 손이 허전해요. 뭘 들고 있어야 할 것 같고. 그러니까 대를 들게요. 오늘은 저도 그냥 낚시하는 사람이에요.',
              lineEn: "I've never seen me like this either. My hands feel empty. Like I should be holding something. So I'll hold a rod. Today I'm just someone who fishes." }),
            note: ['카메라 없는 유하랑 씨는 처음 본다고, 좋다고 했다. 유하랑 씨는 자기도 처음 본다며 웃었다. 손이 허전하니 대를 들겠다고, 오늘은 그냥 낚시하는 사람이라고.',
              "I said I'd never seen her without a camera, and that I liked it. Harang laughed that she hadn't either — her hands felt empty, so she'd hold a rod. Today she was just someone fishing."] }),
          opt('ask_subs', '구독자분들이 몇 분이나 오셨어요?', 'How many subscribers came?', { next: 'subs' }),
          opt('ask_stream', '카메라를 끄면 오늘 방송은 어떻게 해요?', 'If you turn the camera off, what about today\'s stream?', { next: 'stream' }),
          opt('catch_for_all', '세 마리면, 구독자분들 몫까지 제가 낚아야겠네요.', "Three fish — I'd better catch the subscribers' share too.", { next: 'joke' }),
        ],
        note: ['구독자 몇이 배를 타고 울릉까지 찾아왔다. 유하랑 씨는 카메라를 끄겠다고 했다. 오늘은 카메라 없이 그냥 세 마리 낚고, 끝나면 다 같이 먹자고.',
          "A few subscribers had come all the way to Ulleung by boat. Harang said she'd turn the camera off. Today we'd just fish — three, no camera — and all eat together afterwards."],
      }),
      subs: scene([
        line(H, '몇 분이요. 손가락으로 셀 만큼.', 'A few. You could count them on your fingers.'),
        line(N, '(손가락을 하나씩 접어 보인다.)', '(She folds down her fingers one by one.)'),
        line(H, '그래도 배 타고 여기까지요.', 'But they took a boat all the way out here.'),
        line(P, '대단하네요.', "That's something."),
        line(H, '댓글로만 보던 이름이 얼굴이 됐어요.', 'Names I only knew from the comments have faces now.'),
        line(H, '그래서 카메라 끈 거예요. 얼굴 보는데 화면 보면 안 되잖아요.', "That's why I'm turning the camera off. You can't look at a screen when you're looking at faces."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_subs' }),
        note: ['몇 분이나 왔느냐고 물었다. 손가락으로 셀 만큼이지만 배 타고 여기까지 왔다고 했다. 댓글로만 보던 이름이 얼굴이 됐으니, 얼굴 보는데 화면 보면 안 된다고.',
          "I asked how many came. You could count them on your fingers, Harang said, but they'd taken a boat out here. Names from the comments had faces now — and you can't watch a screen while looking at faces."],
      }),
      stream: scene([
        line(H, '안 해요. 오늘은.', "I won't. Not today."),
        line(N, '(카메라 가방 지퍼를 끝까지 잠근다.)', '(She zips the camera bag all the way shut.)'),
        line(P, '아예요?', 'Not at all?'),
        line(H, '찍으면 다들 카메라 보고 웃어요. 안 찍으면 서로 보고 웃고요.', "When I film, everyone smiles at the camera. When I don't, they smile at each other."),
        line(H, '오늘은 그걸 보고 싶어요. 그쪽이랑 그분들이랑.', 'Today I want to see that. You and them.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_stream' }),
        note: ['오늘 방송은 어떻게 하느냐고 물었다. 유하랑 씨는 카메라 가방 지퍼를 끝까지 잠그며 안 한다고 했다. 찍으면 카메라 보고 웃고, 안 찍으면 서로 보고 웃는다고.',
          "I asked about today's stream. Harang zipped the camera bag all the way shut — not today. Film, and everyone smiles at the camera; don't, and they smile at each other."],
      }),
      joke: scene([
        line(H, '아뇨! 그분들도 대 잡을 거예요. 제가 가르쳐 드리기로 했어요.', "No! They'll hold rods too. I promised to teach them."),
        line(N, '(자신 있게 말하다가 나를 본다.)', '(She says it confidently, then looks at me.)'),
        line(H, '…도와주실 거죠?', "...You'll help, won't you?"),
        line(P, '뭘요?', 'With what?'),
        line(H, '저 설명은 잘하는데 엉킨 줄은 못 풀어요. 그건 그쪽 몫이에요.', "I'm good at explaining, but I can't untangle lines. That part's yours."),
      ], {
        end: endTalk({ accept: true, offer: 'catch_for_all' }),
        note: ['구독자 몫까지 내가 낚아야겠다고 농을 했다. 유하랑 씨는 그분들도 대를 잡을 거라며, 자기는 설명은 잘하지만 엉킨 줄은 못 푸니 그건 내 몫이라고 했다.',
          "I joked I'd have to catch the subscribers' share too. Harang said they'd fish themselves — she'd explain, but untangling lines was my job."],
      }),
    },
  },

  // N20-5 — 끝내는 자리(유하랑). 다 같이 먹으러 편의점 앞으로
  {
    id: 'n20_5_done', questId: 'N20-5', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(N, '(편의점 앞. 구독자들이 저마다 잡은 이야기를 하며 컵라면을 고른다.)', '(Outside the convenience store. The subscribers pick out cup noodles, each telling the story of their catch.)'),
        line(H, '세 마리 다 채웠어요?', 'Did you get all three?'),
        line(P, '네. 구독자분들도 한 마리씩 올리셨고요.', 'Yes. And the subscribers each landed one too.'),
        line(H, '봤어요. 다들 소리 지르는 거.', 'I saw. Everyone shouting.'),
        act(H, 'laugh'),
        line(H, '찍었으면 좋은 그림이었을 텐데.', "It would've made a great shot."),
        line(P, '아쉬워요?', 'Do you regret it?'),
        line(H, '아뇨. 오프라인이에요, 이게.', "No. This is offline. This right here.", { act: 'shake_head' }),
        line(H, '올릴 건 없고, 남은 건 있어요.', 'Nothing to upload, and something left.'),
      ], {
        choices: [
          opt('offline', '올릴 건 없고 남은 건 있다. 그 말이 맞네요.', "Nothing to upload, something left. You're right.", {
            end: endTalk({ complete: 'offline',
              lineKo: '…그 말 다음 영상 제목이에요. 아니, 안 올릴래요. 올리면 그분들이 화면 속 사람이 돼요. 안 올리면 그냥 같이 낚시한 사람이고요. 저는 그게 더 좋아요.',
              lineEn: "...That's the title of my next video. No, I won't post it. If I post it, they become people on a screen. If I don't, they're just people I fished with. I like that better." }),
            note: ['올릴 건 없고 남은 건 있다는 말이 맞다고 했다. 유하랑 씨는 그 말을 다음 영상 제목으로 하려다 말고, 안 올리겠다고 했다. 구독자 하나가 내 이름을 알았다.',
              "I agreed: nothing to upload, something left. Harang almost made it her next video title — then decided not to post at all. One of the subscribers knew my name."] }),
          opt('lesson', '구독자분들 가르치는 거, 유하랑 씨가 저보다 낫던데요.', "You're better than me at teaching your subscribers.", {
            end: endTalk({ complete: 'lesson',
              lineKo: '저 방송하는 사람이잖아요, 설명이 직업이에요. 비결은 한 번에 하나만 말하는 거예요. 줄 잡고, 그다음에 던지고. 두 개 말하면 둘 다 까먹어요.',
              lineEn: "I'm a streamer — explaining is my job. The trick is to say one thing at a time. Hold the line, then cast. Say two things and they forget both." }),
            note: ['구독자들 가르치는 건 유하랑 씨가 나보다 낫더라고 했다. 비결은 한 번에 하나만 말하는 거라고 했다. 사람 가르치는 법이 조금 늘었다.', "I said she was better than me at teaching her subscribers. The trick, she said, is one thing at a time. I got a little better at teaching people."] }),
          opt('pay', '오프라인 모임 가이드비는 받을게요.', "I'll take a guide fee for the meet-up.", { next: 'gfee' }),
          opt('my_treat', '라면값은 제가 낼게요. 오늘은 제가 대접할게요.', "I'll pay for the noodles. My treat today.", {
            end: endTalk({ complete: 'my_treat',
              lineKo: '안 돼요! 오늘은 제가 쏘기로 했어요. …그럼 컵라면 물만 부어 주세요. 그게 제일 맛있는 일이에요. 물 붓는 사람이 제일 고맙거든요.',
              lineEn: "No way! I said I'd treat today. ...Then just pour the hot water for the cup noodles. That's the tastiest job. The person pouring the water is the one everyone's grateful to." }),
            note: ['라면값은 내가 내겠다고 했다. 유하랑 씨는 계산대 앞에서 지갑을 먼저 꺼내며, 대신 컵라면 물만 부어 달라고 했다. 물 붓는 사람이 제일 고맙다고.', "I offered to pay for the noodles. Harang got her wallet out first at the counter — just pour the hot water instead, she said. The one pouring is the one everyone thanks."] }),
        ],
        note: ['카메라 없이 세 마리를 채웠다. 구독자들도 한 마리씩 올렸다. 편의점 앞에서 유하랑 씨가 이게 오프라인이라고 했다. 올릴 건 없고 남은 건 있다고.', "We got our three without a camera, and the subscribers each landed one. Outside the convenience store, Harang said this was offline: nothing to upload, and something left."],
      }),
      gfee: scene([
        line(H, '네! 구독자분들이 모아 줬어요!', 'Yes! The subscribers chipped in!'),
        act(H, 'give', { to: P }),
        line(P, '봉투에 뭐가 잔뜩 적혀 있네요.', "There's a lot written on the envelope."),
        line(H, '다들 닉네임을 적었어요. 화면에서만 보던 이름들이에요.', "Everyone wrote their usernames. Names I'd only ever seen on screen."),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '오늘은 그 이름들이 대를 잡았어요.',
          lineEn: 'Today, those names held fishing rods.' }),
        note: ['가이드비를 받았다. 구독자들이 여럿이 모은 봉투였다. 봉투에 다들 닉네임을 적어 놓았다. 화면에서만 보던 이름들이 오늘은 대를 잡았다고 했다.', "I took a guide fee — an envelope the subscribers had put together, each writing their username on it. Names from the screen held rods today, Harang said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N20-6 「마지막 라이브」 — 받는 자리(유하랑 · 독도). 다음 항구 이야기는 꺼내지 않는다(다음 편)
  // ═══════════════════════════════════════════
  {
    id: 'n20_6_offer', questId: 'N20-6', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '저 독도 가요.', "I'm going to Dokdo."),
        line(P, '독도요? 낚시하러요?', 'Dokdo? To fish?'),
        line(H, '라이브 하러요. 거기서 할래요.', 'To stream live. I want to do it there.'),
        line(P, '독도에서 방송을요?', 'A live stream, from Dokdo?'),
        line(H, '신호 끊겨요. 아무도 안 봐요.', "The signal cuts out. Nobody will be watching."),
        line(H, '알아요.', 'I know.', { act: 'look_sea' }),
        act(H, 'silence'),
        line(H, '그래도요.', 'Still.'),
        line(P, '…', '...'),
        line(H, '동행해 줘요. 방송 켜 놓고 한 마리만 같이 올려요.', "Come with me. Let's land just one fish with the stream on."),
        line(P, '(아무도 안 볼 방송을, 그래도 켜겠다는 거구나.)', "(A stream nobody will see — and she still wants to turn it on.)"),
      ], {
        choices: [
          opt('go_along', '같이 갈게요. 끊기면 끊긴 대로 하면 돼요.', "I'll come. If it cuts out, it cuts out.", {
            end: endTalk({ accept: true, offer: 'go_along',
              lineKo: '…네. 끊긴 대로요. 신호 잡히는 데까지는 켜 둘게요. 끊기면 끊긴 채로 할게요. 그래도 끝까지 말할 거예요. 한 마리 올라올 때까지.',
              lineEn: "...Right. As it cuts out. I'll keep it on as far as the signal reaches. If it cuts, I'll carry on cut off. I'll still talk to the end. Until one fish comes up." }),
            note: ['같이 가겠다고, 끊기면 끊긴 대로 하면 된다고 했다. 유하랑 씨는 카메라 배터리를 하나 더 챙기며, 끊겨도 한 마리 올라올 때까지 끝까지 말하겠다고 했다.',
              "I said I'd come — if it cut out, it cut out. Harang packed a spare camera battery and said she'd keep talking to the end, until one fish came up, signal or not."] }),
          opt('why_live', '아무도 안 볼 걸 알면서 왜 켜요?', 'Why turn it on when you know nobody will watch?', { next: 'why' }),
          opt('ask_signal', '독도는 신호가 그렇게 안 잡혀요?', 'Is the signal really that bad at Dokdo?', { next: 'signal' }),
          opt('zero_fee', '시청자가 영 명이면, 출연료도 영 원이에요?', 'If there are zero viewers, is my fee zero too?', { next: 'zero' }),
        ],
        note: ['유하랑 씨가 독도에서 라이브를 하겠다고 했다. 신호가 끊겨 아무도 안 볼 걸 알면서도, 그래도요, 하고. 독도 출조에 동행해서 방송 중에 한 마리 같이 올려 달라고 했다.',
          "Harang said she'd stream live from Dokdo. She knew the signal would drop and no one would watch — still, she said. She asked me to come on the Dokdo trip and land one fish with her during the stream."],
      }),
      why: scene([
        line(H, '보라고 켜는 게 아니라… 하려고 켜는 거예요.', "I don't turn it on so people watch... I turn it on so I do it."),
        line(H, '설명이 잘 안 되네.', "I can't explain it well.", { act: 'look_away' }),
        line(P, '…', '...'),
        line(H, '그쪽 처음 만난 날엔 열두 명이었어요. 오늘은 영 명일 거고요.', "The day I first met you, it was twelve. Today it'll be zero."),
        line(H, '그래도 그날이랑 같은 마음으로 해 보고 싶어요.', 'Still, I want to do it with the same heart as that day.'),
      ], {
        end: endTalk({ accept: true, offer: 'why_live' }),
        note: ['아무도 안 볼 걸 알면서 왜 켜느냐고 물었다. 유하랑 씨는 보라고 켜는 게 아니라 하려고 켜는 거라고 했다. 처음 만난 날은 열두 명, 오늘은 영 명이겠지만 같은 마음으로 하고 싶다고.',
          "I asked why turn it on if no one would watch. Not so people watch, Harang said — so she does it. The day we met it was twelve; today it'd be zero. She wanted to do it with the same heart."],
      }),
      signal: scene([
        line(H, '잡히다 말다 해요. 배 위에선 거의 안 잡힌대요.', 'It comes and goes. On the boat they say you hardly get any.'),
        line(H, '봐요. 한 칸.', 'Look. One bar.'),
        line(P, '정말 한 칸이네요.', 'It really is one bar.', { act: 'peer' }),
        line(H, '그러니까 영 명이에요, 아마. 그래도 녹화는 돼요.', "So it'll be zero, probably. But it still records."),
        line(H, '그건 남아요. 남는 게 있으면 된 거예요.', "That stays. If something stays, that's enough."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_signal' }),
        note: ['독도는 신호가 그렇게 안 잡히느냐고 물었다. 유하랑 씨는 휴대폰 안테나 한 칸을 보여 주었다. 영 명이겠지만 녹화는 남는다고, 남는 게 있으면 된 거라고.',
          "I asked if the signal was really that bad. Harang showed me the single bar on her phone. Zero viewers, probably — but the recording would stay, and if something stays, that's enough."],
      }),
      zero: scene([
        line(H, '…계산 빠르시네요.', '...Quick with the numbers, aren\'t you.'),
        act(H, 'laugh'),
        line(H, '영 원은 아니에요. 그동안 모아 둔 거 있어요.', "It's not zero. I've saved some up."),
        line(H, '그래도 오늘은 돈 얘기 말고요.', "But let's not talk money today."),
        line(H, '같이 가 줘요. 혼자 가면 진짜로 아무도 없잖아요. 한 명은 있어야죠.', "Just come with me. If I go alone, there really is no one. There should be at least one."),
      ], {
        end: endTalk({ accept: true, offer: 'zero_fee' }),
        note: ['시청자가 영 명이면 출연료도 영 원이냐고 농을 했다. 유하랑 씨는 계산이 빠르다며 웃더니, 오늘은 돈 얘기 말고 같이 가 달라고 했다. 혼자 가면 진짜로 아무도 없다고.',
          "I joked that zero viewers meant a zero fee. Quick with numbers, Harang laughed — but today, no money talk. Just come; alone, there'd truly be no one."],
      }),
    },
  },

  // N20-6 — 끝내는 자리(유하랑). 시청자 0 — 그래도 방송 중에 한 마리
  {
    id: 'n20_6_done', questId: 'N20-6', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…영 명.', '...Zero.', { act: 'look_sea' }),
        line(H, '봤죠.', 'You saw.'),
        line(P, '봤어요. 끝까지 영이었어요.', 'I saw. Zero, all the way through.'),
        line(H, '그래도 했어요.', 'I still did it.'),
        line(P, '한 마리도 올렸고요.', 'And we landed one.'),
        line(H, '네. 아무도 안 보는데, 그쪽이 챔질할 때 제가 소리 질렀어요.', 'Yes. Nobody watching, and I still shouted when you set the hook.'),
        act(H, 'laugh'),
        line(H, '안 보여도 하는 거. 그게 제 방송이었어요.', 'Doing it even when no one can see. That was my stream.'),
      ], {
        choices: [
          opt('zero', '시청자 영 명. 그래도 방송이었어요.', 'Zero viewers. It was still a broadcast.', {
            end: endTalk({ complete: 'zero',
              lineKo: '…맞아요. 이거, 녹화본이에요. 하나뿐인 사본. 잃어버리면 이 방송은 없었던 게 돼요. 그러니까 잘 둬요. 아니, 없어져도 돼요. 우리가 봤으니까.',
              lineEn: "...That's right. This is the recording. The only copy. Lose it and this broadcast never happened. So keep it safe. No — it's fine if it's lost. We saw it." }),
            note: ['시청자 영 명이라도 방송이었다고 했다. 유하랑 씨는 하나뿐인 녹화본을 건네며 잘 두라고 했다가, 없어져도 된다고, 우리가 봤으니까라고 했다.',
              "I said zero viewers or not, it was a broadcast. Harang handed me the only copy of the recording — keep it safe, she said, then: no, it's fine if it's lost. We saw it."] }),
          opt('lesson', '아무도 안 보는데 말하는 법, 어떻게 하는 거예요?', 'How do you keep talking when nobody is watching?', {
            say: ['아무도 안 보는데 말하는 거, 저는 못 하겠어요. 어떻게 하는 거예요?', "Talking when nobody's watching — I couldn't do it. How do you?"],
            end: endTalk({ complete: 'lesson',
              lineKo: '렌즈 너머에 한 사람 있다고 생각해요. 늘 한 사람. 그 한 사람한테만 말하면 목소리가 작아져요. 작은 목소리가 오래 남아요. 큰 소리는 금방 지나가고요.',
              lineEn: "Imagine one person behind the lens. Always just one. Talk only to that one and your voice gets smaller. A small voice lasts long. A loud one passes quickly." }),
            note: ['아무도 안 보는데 말하는 법을 물었다. 렌즈 너머에 늘 한 사람이 있다고 생각하라고 했다. 작은 목소리가 오래 남는다고. 혼자 하는 낚시가 덜 외로워졌다.', "I asked how she talks when no one is watching. Imagine one person behind the lens, Harang said — a small voice lasts long. Fishing alone felt less lonely after that."] }),
          opt('pay', '독도 출조 가이드비는 정가로 받을게요.', "I'll take the full guide fee for the Dokdo trip.", {
            end: endTalk({ complete: 'pay',
              lineKo: '정가! 마지막 광고 수익 전부요! 마지막이라고 깎으면 안 되죠. 끝까지 제값 드리는 게 제 방송 예의예요. 받아 줘요.',
              lineEn: "Full price! The last of my ad revenue, all of it! You don't discount something because it's the last. Paying full price to the end is my broadcast's manners. Please take it." }),
            note: ['독도 출조 가이드비를 정가로 받겠다고 했다. 유하랑 씨는 마지막 광고 수익 전부라며, 끝까지 제값 드리는 게 예의라고 했다. 봉투가 마지막다웠다.', "I asked for the full guide fee. Harang said it was the last of her ad revenue, all of it — paying full price to the end was her manners. The envelope felt like a last one."] }),
          opt('one_viewer', '영 명이 아니었어요. 제가 보고 있었으니까요.', "It wasn't zero. I was watching.", { next: 'one' }),
        ],
        note: ['독도 라이브는 시청자 영 명이었다. 그래도 방송 중에 한 마리를 올렸다. 유하랑 씨는 안 보여도 하는 거, 그게 자기 방송이었다고 했다.', "The Dokdo live had zero viewers. Still, we landed one fish during the stream. Doing it even unseen, Harang said, was what her broadcast had been."],
      }),
      one: scene([
        line(H, '…그 말은 반칙이에요.', "...That's cheating."),
        line(N, '(유하랑 씨가 카메라를 내리고 한참 바다를 본다.)', '(Harang lowers the camera and looks out to sea for a long time.)'),
        line(H, '그럼 1이네요. 숫자 고칠래요.', "Then it's one. I'll fix the number."),
      ], {
        end: endTalk({ complete: 'one_viewer',
          lineKo: '오늘 시청자 한 명. 녹화본 맨 끝에 적어 둘게요. 시청자 한 명, 끝까지.',
          lineEn: "Today's viewers: one. I'll write it at the very end of the recording. One viewer, to the end." }),
        note: ['영 명이 아니었다고, 내가 보고 있었다고 했다. 유하랑 씨는 반칙이라며 카메라를 내리고 한참 바다를 보았다. 녹화본 끝에 시청자 한 명이라고 적겠다고 했다.', "I said it wasn't zero — I'd been watching. That's cheating, Harang said, lowering her camera to look at the sea a long while. She'd write one viewer at the end of the recording."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N20-7 「자막 없는 영상」 — 받는 자리(유하랑 · 독도). 다음 항구로 간다 — 돌돔 한 마리 · 한 컷
  // ═══════════════════════════════════════════
  {
    id: 'n20_7_offer', questId: 'N20-7', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '저 다음 항구로 가요.', "I'm moving on to the next harbour."),
        line(P, '네? 언제요?', 'What? When?'),
        line(H, '이번 영상 올리고요. 어딘지는 아직 안 정했어요.', "After I post this video. I haven't decided where yet."),
        line(P, '…', '...'),
        line(H, '그래서 부탁이 두 개 있어요.', "So I've got two favours to ask."),
        line(P, '두 개요?', 'Two?'),
        line(H, '하나. 마지막 영상에 쓸 컷 하나만 골라 줘요.', 'One. Pick one shot for my last video.'),
        line(H, '둘. 돌돔 한 마리요. 그 영상에 남길 장면이 하나 모자라요.', "Two. One rock bream. I'm one scene short for that video."),
        line(P, '돌돔이요. 그건 제 손이 해야겠네요.', "A rock bream. That'll be down to my hands, then."),
        line(H, '그리고 자막 없이 올릴 거예요.', "And I'm posting it without subtitles."),
        line(P, '(편집도, 자막도 없이…)', '(No editing, no subtitles...)'),
      ], {
        choices: [
          opt('pick_carefully', '컷 하나, 정성껏 고를게요.', "I'll pick that one shot with care.", {
            end: endTalk({ accept: true, offer: 'pick_carefully',
              lineKo: '정성 들이지 마요. 처음 눈에 걸리는 거요. 그리고 돌돔은 진짜 부탁해요. 그건 그쪽 손이 해 줘야 해요.',
              lineEn: "Don't take care over it. The first one that catches your eye. And the rock bream — I'm really counting on you. That has to come from your hands." }),
            note: ['컷 하나 정성껏 고르겠다고 했다. 유하랑 씨는 노트북을 내 쪽으로 돌리며, 정성 들이지 말고 처음 눈에 걸리는 걸 고르라고 했다. 돌돔은 내 손이 해 줘야 한다고.',
              "I said I'd choose the shot with care. Harang turned her laptop towards me — don't take care, pick the first that catches your eye. The rock bream had to come from my hands."] }),
          opt('why_no_subs', '자막 없이 올리는 이유가 있어요?', 'Is there a reason for no subtitles?', { next: 'nosubs' }),
          opt('ask_where', '다음 항구는 정말 안 정했어요?', "You really haven't decided the next harbour?", { next: 'where' }),
          opt('sad', '떠난다니 서운하네요.', "I'm sad you're leaving.", { next: 'sad' }),
        ],
        note: ['유하랑 씨가 이번 영상을 올리고 다음 항구로 간다고 했다. 어딘지는 아직 안 정했다고. 마지막 영상에 쓸 컷 하나를 골라 주고, 자막 없이 남길 장면으로 돌돔 한 마리를 올려 달라고 했다.',
          "Harang said she'd move on to the next harbour after posting this video — where, she hadn't decided. She asked me to pick one shot for her last video, and to land one rock bream for the scene she'd leave without subtitles."],
      }),
      nosubs: scene([
        line(H, '자막은 제가 하고 싶은 말이잖아요.', 'Subtitles are what I want to say.'),
        line(H, '이번엔 제 말 빼고 싶어요.', 'This time I want to leave my words out.'),
        line(P, '그럼 보는 사람은요?', 'What about the people watching?'),
        line(N, '(화면 속 바다를 손가락으로 가리킨다.)', '(She points at the sea on the screen.)'),
        line(H, '알아서 들으면 돼요. 바다 소리, 릴 소리, 그쪽 숨소리.', 'They can listen for themselves. The sea, the reel, your breathing.'),
        line(H, '그거면 자막보다 많이 말해요.', 'That says more than subtitles.'),
      ], {
        end: endTalk({ accept: true, offer: 'why_no_subs' }),
        note: ['자막 없이 올리는 이유를 물었다. 자막은 자기가 하고 싶은 말이라, 이번엔 자기 말을 빼고 싶다고 했다. 바다 소리, 릴 소리, 내 숨소리가 자막보다 많이 말한다고.',
          "I asked why no subtitles. Subtitles are what she wants to say, Harang said, and this time she wanted her words out. The sea, the reel, my breathing — they'd say more."],
      }),
      where: scene([
        line(H, '진짜 안 정했어요. 지도 펴 놓고 손가락으로 찍을까 봐요.', "I really haven't. Maybe I'll spread out a map and point."),
        act(H, 'laugh'),
        line(P, '정말요?', 'Really?'),
        line(H, '정하면… 아니, 그건 끝나고 말할게요.', "Once I decide... no, I'll tell you after."),
        line(H, '지금 말하면 마지막 영상이 마지막이 아니게 돼요.', "If I say it now, the last video won't be the last."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_where' }),
        note: ['다음 항구는 정말 안 정했느냐고 물었다. 지도 펴 놓고 손가락으로 찍을까 보다고 웃더니, 정하면 끝나고 말하겠다고 했다. 지금 말하면 마지막 영상이 마지막이 아니게 된다고.',
          "I asked if she really hadn't chosen the next port. Maybe she'd point at a map, Harang laughed — she'd tell me after. Say it now and the last video wouldn't be the last."],
      }),
      sad: scene([
        line(H, '서운하라고 말한 거예요.', 'I said it so you would be.'),
        act(H, 'laugh'),
        line(H, '…거짓말이에요.', "...That's a lie.", { act: 'look_away' }),
        line(H, '서운한 거 맞아요. 저도요.', "It is sad. For me too."),
        line(H, '그러니까 마지막 컷은 그쪽이 골라 줘요. 그래야 덜 서운해요.', "So you pick the last shot. Then it'll be a little less sad."),
      ], {
        end: endTalk({ accept: true, offer: 'sad' }),
        note: ['떠난다니 서운하다고 했다. 유하랑 씨는 서운하라고 한 말이라고 웃다가, 거짓말이라고, 자기도 서운하다고 했다. 눈가가 빨갰다. 그러니 마지막 컷은 내가 골라 달라고.',
          "I said I was sad she was leaving. Harang laughed that she'd said it so I would be — then admitted that was a lie; she was sad too. Her eyes were red. So I should pick the last shot."],
      }),
    },
  },

  // N20-7 — 끝내는 자리(유하랑). 한 컷을 고르고 다음 항구 이야기를 들은 뒤 · 처음으로 내 이름을 부른다
  {
    id: 'n20_7_done', questId: 'N20-7', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '그 컷, 마지막에 넣었어요.', 'That shot — I put it at the very end.'),
        line(P, '제가 고른 거요?', 'The one I picked?'),
        line(H, '네. 자막 없이. 소리만.', 'Yes. No subtitles. Just the sound.'),
        line(H, '돌돔 올라오는 장면 바로 뒤에요.', 'Right after the rock bream comes up.'),
        line(P, '(그 돌돔, 끌어올리느라 팔이 다 떨렸는데.)', '(My arms were shaking, hauling that rock bream up.)'),
        line(H, '이제 진짜 가요, {player} 씨.', "I'm really going now, {player}."),
        line(H, '다음 항구에서… 아니, 말 안 할래요.', "At the next harbour... no, I won't say.", { act: 'shake_head' }),
      ], {
        choices: [
          opt('cut', '시청자 영 명의 순간. 그 컷이었어요.', 'The moment of zero viewers. That was the shot.', { next: 'tripod' }),
          opt('next_port', '다음 항구, 정해지면 말해 주세요. 배로 갈게요.', "Tell me once you've chosen the next harbour. I'll come by boat.", {
            end: endTalk({ complete: 'next_port',
              lineKo: '…진짜요? 그럼 말할게요. 정해지면. 배로 온다는 사람은 처음이에요. 그럼 배 댈 데가 있는 데로 골라야겠네요. 방파제 끝에서 기다릴게요.',
              lineEn: "...Really? Then I'll tell you. When I decide. No one's ever said they'd come by boat. Then I'd better pick somewhere a boat can dock. I'll wait at the end of the breakwater." }),
            note: ['다음 항구가 정해지면 말해 달라고, 배로 가겠다고 했다. 유하랑 씨는 배로 온다는 사람은 처음이라며, 배 댈 데가 있는 데로 고르겠다고 했다. 그 뒤로 항구마다 엽서가 왔다.',
              "I asked her to tell me the next port once she'd chosen — I'd come by boat. No one had ever said that, Harang said; she'd pick somewhere a boat could dock. After that, postcards came from every port."] }),
          opt('pay', '컷 고른 값은… 농담이에요.', "My fee for picking the shot... just kidding.", {
            end: endTalk({ complete: 'pay',
              lineKo: '드릴게요! 마지막 영상 수익! 자막 없는 게 제일 벌었어요! 농담인 거 알아요. 그래서 드리는 거예요. 농담으로 받아 주세요. 그래야 저도 웃으면서 떠나요.',
              lineEn: "I'll pay! The last video's earnings! The one with no subtitles made the most! I know you're joking. That's exactly why I'm giving it. Take it as a joke. Then I can leave smiling too." }),
            note: ['컷 고른 값은, 하다가 농담이라고 했다. 유하랑 씨는 농담인 거 안다며, 그래서 드리는 거라고 마지막 영상 수익을 건넸다. 그래야 웃으면서 떠난다고.', "I started to ask a fee for picking the shot, then said I was joking. Harang knew — that's why she gave me the last video's earnings. That way she could leave smiling."] }),
          opt('learn_cut', '자막 없이도 읽히는 장면 고르는 법, 마지막으로 배우고 싶어요.', "One last thing — teach me how to pick a scene that reads without subtitles.", {
            end: endTalk({ complete: 'learn_cut',
              lineKo: '소리 끄고 봐요. 소리 없이도 뭔지 알면 그게 컷이에요. 그다음에 소리를 켜요. 그럼 두 번 좋아요. 이게 제가 삼백 명일 때부터 하던 거예요.',
              lineEn: "Watch with the sound off. If you can tell what it is without sound, that's the shot. Then turn the sound on. Then it's good twice. I've been doing this since I had three hundred." }),
            note: ['자막 없이도 읽히는 장면 고르는 법을 마지막으로 물었다. 유하랑 씨는 노트북 음량을 끄고 같이 화면을 보며, 소리 없이도 뭔지 알면 그게 컷이라고 했다.', "One last time, I asked how to pick a scene that reads without subtitles. Harang muted the laptop and watched with me — if you can tell what it is without sound, that's the shot."] }),
        ],
        note: ['유하랑 씨가 내가 고른 컷을 자막 없이, 돌돔 올라오는 장면 바로 뒤 마지막에 넣었다고 했다. 처음으로 내 이름을 부르며 이제 진짜 간다고 했다. 다음 항구 얘기는 하려다 말았다.',
          "Harang said she put the shot I picked at the very end, without subtitles, right after the rock bream came up. Calling me by name for the first time, she said she was really going now. She started to mention the next port, then didn't."],
      }),
      tripod: scene([
        line(H, '…저도 그 컷이었어요.', '...It was that shot for me too.'),
        line(H, '이거 가져요. 삼각대요. 첫 방송 때 그거.', "Take this. The tripod. The one from my first stream."),
        line(P, '이걸요?', 'This?'),
        line(H, '처음 거 들고 다음 항구 가면, 처음으로 돌아가는 것 같아서요.', 'If I take the first one to the next harbour, it feels like going back to the beginning.'),
      ], {
        end: endTalk({ complete: 'cut',
          lineKo: '새 데서는 새 거로 시작할래요. 이건 그쪽이 써요.',
          lineEn: "In a new place, I'll start with a new one. You use this." }),
        note: ['시청자 영 명의 그 순간이 그 컷이었다고 했다. 유하랑 씨도 그 컷이었다며, 첫 방송 때 쓰던 삼각대를 내게 주었다. 새 항구에서는 새 걸로 시작하겠다고.', "I said the moment of zero viewers was the shot. It was for her too, Harang said, and gave me the tripod from her first stream. In a new port, she'd start with a new one."],
      }),
    },
  },
];
