/**
 * @file StoryTalkN18.ts
 * @description 290차 — N18 「도현수 — 라이벌에서 우리로」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = `StoryTalkN01.ts`(286 시범).
 *
 * 인물
 *  - 도현수(24 · 어촌계장 손자, 라이벌) — 짧고 퉁명한 반말 · 「…」로 말을 삼킨다 · 칭찬 · 고맙다는 말을 못 받는다
 *    (「따라온 거 아니라니까」 · 「그 이상 말 시키지 마」) · 셈은 정확하다 · 웃음은 피식 · 나를 「너」.
 *    편이 갈수록 말이 조금씩 길어지고, 마지막 편에서 처음으로 「우리」라고 한다. 할아버지(어촌계장)는 「할아버지」.
 * 호칭(290): 나는 「도현수 씨」 — 해요체(24 · 나보다 두 살 위). 옛 답의 반말(「해 보자」)은 해요체로 옮겼다.
 * 스포일러: 아버지 릴대를 왜 알아보는지(첫 편)는 밝히지 않는다 · 검사원 시험의 이유(여섯째 편)는 「붙으면 말할게」 그대로.
 * 표시: 새로 만든 것 없음 — 옛 답의 표시(choice.n18_* · choice.rival_compete)는 묶인 답이 남긴다.
 *   첫 편 끝내는 자리의 `ask_tip`은 옛 조건(choice.rival_cool)을 그대로 따른다 — 조건이 맞을 때만 보인다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const H = 'hyeonsu';
const P = 'player';

export const TALKS_N18: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N18-1 「같은 대를 든 놈」 — 받는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_1_offer', questId: 'N18-1', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '야. 그 대.', "Hey. That rod.", { act: 'peer' }),
        line(P, '도현수 씨? …또 제 대 얘기예요?', "Hyeonsu? ...My rod again?"),
        line(H, '그 대, 어디서 났어.', "Where'd you get that rod?"),
        line(P, '갑자기 그건 왜요?', "Why ask that all of a sudden?"),
        line(H, '…아니다.', "...Never mind.", { act: 'look_away' }),
        line(H, '그냥 같은 자리에서 한 마리씩 걸어 보자. 그러면 알겠지.', "Let's just each hook one from the same spot. Then I'll know."),
        line(P, '뭘 알게 되는데요?', "Know what?"),
        line(H, '대가 진짜인지. 던지는 걸 보면 알아.', "Whether the rod's the real thing. I'll know when I see you cast."),
      ], {
        choices: [
          opt('side', '좋아요. 같은 자리에서 한 마리씩 해 봐요', "All right. One each, same spot", {
            say: ['좋아요. 같은 자리에서 한 마리씩. 해 봐요.', "Fine. One each, from the same spot. Let's do it."], next: 'side' }),
          opt('rod', '이 대를 알아요? 왜 어디서 났냐고 물어요?', "You know this rod? Why ask where I got it?", { next: 'rod' }),
          opt('father', '아버지 대예요. 어디서 났는지는 상관없잖아요', "It's my father's. Where it came from is my business", {
            say: ['아버지 대예요. 어디서 났는지는 도현수 씨가 상관할 일 아니고요.', "It's my father's rod. Where it came from isn't your concern."], next: 'father' }),
          opt('stakes', '지면 뭐 해 줘요? 내기면 걸 게 있어야죠', "What do I get if you lose? A bet needs stakes", {
            say: ['지면 뭐 해 줄 건데요? 내기면 걸 게 있어야죠.', "So what happens if you lose? A bet needs something on the line."], next: 'stakes' }),
        ],
        note: ['도현수 씨가 또 내 릴대를 보고 어디서 났느냐고 물었다. 그러다 말을 삼키고, 같은 자리에서 한 마리씩 걸어 보자고 했다. 던지는 걸 보면 대가 진짜인지 안다고.',
          "Do Hyeonsu eyed my rod again and asked where I got it. Then he swallowed the question and said we should each hook one from the same spot — he'd know if the rod was real when he saw me cast."],
      }),
      side: scene([
        line(H, '말 길게 안 해서 좋네.', "Good. You don't talk long."),
        line(H, '거기. 내 옆.', "There. Next to me."),
        line(P, '크기로 겨뤄요?', "Are we competing on size?"),
        line(H, '몇 센티냐, 누가 먼저냐, 그런 건 안 봐. 어떻게 던지고 어떻게 거는지만 본다.', "Centimeters, who's first — I don't care about that. Only how you cast and how you set the hook."),
      ], {
        end: endTalk({ accept: true, offer: 'side_by_side' }),
        note: ['같은 자리에서 한 마리씩 하자고 했다. 도현수 씨는 턱으로 자기 옆자리를 가리키며, 크기나 순서는 안 보고 던지는 것과 거는 것만 본다고 했다.',
          "I agreed to one each from the same spot. Hyeonsu jerked his chin at the place beside him — he wouldn't judge size or who was first, only the cast and the hookset."],
      }),
      rod: scene([
        line(H, '…아는 거 없어.', "...I don't know anything.", { act: 'look_away' }),
        line(P, '손잡이 흠집만 계속 보던데요.', "You keep staring at the scratch on the grip."),
        line(H, '그냥 눈에 걸렸어.', "It just caught my eye."),
        line(H, '손이 대를 쓰는지, 대가 손을 끌고 가는지. 그거 보자는 거야.', "Whether the hand uses the rod, or the rod drags the hand along. That's what I want to see."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_rod' }),
        note: ['이 대를 아느냐고 물었다. 도현수 씨는 아는 거 없다면서도 손잡이 흠집에서 눈을 떼지 못했다. 손이 대를 쓰는지 대가 손을 끌고 가는지 보자고 했다.',
          "I asked if he knew this rod. He said he didn't, but couldn't take his eyes off the scratch on the grip. He wanted to see whether the hand uses the rod, or the rod drags the hand."],
      }),
      father: scene([
        line(H, '…아버지 대.', "...Your father's rod."),
        act(H, 'silence'),
        line(H, '그래, 알 바 아니지. 나도 더 안 물어.', "Right. None of my business. I won't ask again."),
        line(H, '그럼 더 봐야겠네. 그 대가 네 손에서 어떻게 휘는지.', "Then I need to see it even more. How that rod bends in your hands."),
        line(H, '어깨에 힘 들어가면 대가 먼저 안다.', "Tense your shoulders and the rod will know first."),
      ], {
        end: endTalk({ accept: true, offer: 'father_rod' }),
        note: ['아버지 대라고, 어디서 났는지는 상관할 일이 아니라고 쏘아붙였다. 도현수 씨는 잠깐 말이 없다가 더 안 묻겠다고 했다. 대신 그 대가 내 손에서 어떻게 휘는지 더 봐야겠다고.',
          "I snapped that it was my father's rod and none of his business. Hyeonsu was quiet a moment, then said he wouldn't ask again — but now he had to see even more how it bends in my hands."],
      }),
      stakes: scene([
        act(H, 'laugh'),
        line(H, '내기 같은 거 안 해. 지는 쪽이 말이 없어지는 거지. 그거면 충분해.', "I don't do bets. The loser goes quiet. That's enough."),
        line(P, '그래도 걸 게 있어야 재밌잖아요.', "But it's more fun with something at stake."),
        line(H, '…꼭 있어야 하면 나중에 정해. 일단 한 마리부터 올려. 말은 그다음이야.', "...If you really need one, decide later. Land a fish first. Talk comes after."),
      ], {
        end: endTalk({ accept: true, offer: 'what_stakes' }),
        note: ['내기면 걸 게 있어야 한다고 했다. 도현수 씨는 코웃음을 치며 지는 쪽이 말이 없어지는 거라고 했다. 걸 게 꼭 있어야 하면 한 마리 올리고 나서 정하자고.',
          "I said a bet needed stakes. Hyeonsu snorted — the loser goes quiet, that's all. If I really needed stakes, we'd decide after I landed one."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-1 — 끝내는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_1_done', questId: 'N18-1', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…봤다.', "...I saw."),
        line(P, '뭘요?', "Saw what?"),
        line(H, '대는 진짜네.', "The rod's the real thing."),
        line(H, '어깨 힘 빼. 그 대는 힘으로 던지는 대가 아니야.', "Relax your shoulders. That rod isn't one you throw with muscle."),
        line(P, '(…들켰다. 내내 어깨에 힘이 들어가 있었다.)', "(...He noticed. My shoulders had been tense the whole time.)"),
        line(H, '그래서. 넌 오늘 어땠는데.', "So. How did today go for you?"),
      ], {
        choices: [
          opt('compete', '다음엔 제가 더 큰 걸 낚을 거예요', "Next time I'll catch a bigger one", {
            end: endTalk({ complete: 'compete',
              lineKo: '…그래. 그래야 재밌지.\n\n더 큰 거면 자로 재. 눈대중은 안 쳐 준다. 다음 물때에 이 자리. 그 대 들고 와.',
              lineEn: "...Good. That's what makes it fun.\n\nIf it's bigger, measure it. I won't count eyeballing. Next tide, this spot. Bring that rod." }),
            note: ['다음엔 더 큰 걸 낚겠다고 하자 도현수 씨의 눈빛이 바뀌었다. 다음 물때에 이 자리에서 자로 재자고 했다. 다음이 있다는 뜻이었다.', "When I said I'd catch a bigger one next time, something changed in Hyeonsu's eyes. Next tide, this spot, measured with a ruler — there would be a next time."] }),
          opt('concede', '도현수 씨가 낫더라고요. 인정해요', "You're better. I admit it", { next: 'concede' }),
          opt('tip', '아까 그 챔질, 어떻게 한 거예요?', "That hookset earlier — how did you do it?", {
            end: endTalk({ complete: 'ask_tip',
              lineKo: '…한 번만 보여 준다. 찌가 잠기고 나서 세는 게 아니라, 잠기기 전에 손이 가 있어야 해.\n\n찌가 흔들리는 걸 눈으로 보지 말고 손목으로 들어. 그러면 잠기기 전에 알게 돼. 오늘 너는 눈으로만 봤어.',
              lineEn: "...I'll show you once. You don't count after the float goes under — your hand has to be there before it does.\n\nDon't watch the float wobble with your eyes. Listen with your wrist. Then you'll know before it sinks. Today you only watched with your eyes." }),
            note: ['챔질을 어떻게 했느냐고 물었다. 도현수 씨는 한 번만 보여 준다며, 찌가 흔들리는 걸 눈이 아니라 손목으로 들으라고 했다.', "I asked how he'd set the hook. He'd show me once, Hyeonsu said — listen to the float's wobble with your wrist, not your eyes."] }),
          opt('nocount', '누가 먼저였는지는 안 셀래요', "I'm not counting who was first", {
            say: ['누가 먼저였는지는 안 셀래요. 같이 서 본 걸로 됐어요.', "I'm not counting who was first. Standing there together was enough."], next: 'nocount' }),
        ],
        note: ['도현수 씨 옆자리에서 한 마리를 걸었다. 그는 대는 진짜라면서, 그 대는 힘으로 던지는 대가 아니니 어깨 힘을 빼라고 했다. 내내 힘이 들어가 있던 걸 들켰다.',
          "I hooked one beside Hyeonsu. The rod's real, he said, but it isn't thrown with muscle, so relax my shoulders — he'd caught me tensing the whole time."],
      }),
      concede: scene([
        line(H, '인정은 받아 둘게.', "I'll take the admission."),
        act(H, 'give', { to: P }),
        line(H, '술은 내가 산다. 이긴 쪽이 사는 거야.', "Drinks are on me. The winner buys."),
        line(P, '…편의점 봉투가 꽤 무겁네요.', "...This convenience-store bag is pretty heavy.", { act: 'receive' }),
      ], {
        end: endTalk({ complete: 'concede',
          lineKo: '근데 그 대가 진 건 아니야. 대는 아직 네 손을 모르고, 네 손은 아직 대를 몰라. 그건 시간이 해.',
          lineEn: "But it wasn't the rod that lost. The rod doesn't know your hands yet, and your hands don't know the rod. Time takes care of that." }),
        note: ['도현수 씨가 낫다고 인정했다. 그는 인정은 받아 두겠다며 편의점 봉투를 건넸다. 그래도 진 건 대가 아니라고, 대와 손이 아직 서로를 모를 뿐이라고 했다.',
          "I admitted he was better. Hyeonsu said he'd take that, and handed me a convenience-store bag. But it wasn't the rod that lost, he said — the rod and my hands just didn't know each other yet."],
      }),
      nocount: scene([
        line(H, '…안 센다고? 나는 셌어.', "...You're not counting? I did."),
        line(H, '네 챔질이 반 박자 늦었어.', "Your hookset was half a beat late."),
        line(P, '(그러면서도 도현수 씨는 돌아서기 전에 내 대를 한 번 더 본다…)', "(Even so, before turning away, Hyeonsu looks at my rod once more...)"),
      ], {
        end: endTalk({ complete: 'no_count',
          lineKo: '다음엔 세. 세야 늘어. 오늘은… 오늘은 됐다.',
          lineEn: "Count next time. Counting is how you improve. Today... today's fine." }),
        note: ['누가 먼저였는지는 안 세겠다고 했다. 도현수 씨는 자기는 셌다고, 내 챔질이 반 박자 늦었다고 했다. 그래도 돌아서기 전에 내 대를 한 번 더 봤다.',
          "I said I wouldn't count who was first. Hyeonsu said he had — my hookset was half a beat late. But before turning away, he looked at my rod once more."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-2 「경매장 뒷줄」 — 받는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_2_offer', questId: 'N18-2', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…왔네.', "...You're here.", { act: 'look_away' }),
        line(P, '도현수 씨? 부산 경매장에서 뵐 줄은 몰랐어요.', "Hyeonsu? I didn't expect to see you at the Busan auction."),
        line(H, '뒷줄에 서 봐. 여기.', "Stand in the back row. Here."),
        line(P, '뒷줄이요? 앞에 가야 잘 보이지 않아요?', "The back row? Wouldn't I see better up front?"),
        line(H, '앞에선 경매사 입만 보여. 뒤에선 손이 다 보이고.', "Up front you only see the auctioneer's mouth. From the back you see every hand."),
        line(H, '여기선 네 이름 아무도 몰라. 나도 그렇고.', "Nobody here knows your name. Same goes for me."),
        line(P, '그게 좋은 거예요?', "Is that a good thing?"),
        line(H, '편하지. …네 물건 두 건 올려. 그리고 낙찰가 같이 읽자.', "It's comfortable. ...Put up two lots of your own. Then we'll read the hammer prices together."),
      ], {
        choices: [
          opt('back', '좋아요. 뒷줄에서 같이 읽어요', "All right. Let's read them from the back row", {
            say: ['좋아요. 뒷줄이면 손이 다 보이겠네요. 같이 읽어요.', "All right. From the back row I'll see every hand. Let's read them together."], next: 'back' }),
          opt('here', '그런데 여기서 뭐 하시는 거예요?', "But what are you doing here?", {
            say: ['그런데 도현수 씨는 여기서 뭐 하시는 거예요? 부산까지 와서.', "But what are you doing here, Hyeonsu? All the way in Busan."], next: 'here' }),
          opt('read', '낙찰가를 읽는다는 게 뭐예요?', "What do you mean, read the hammer prices?", {
            say: ['낙찰가를 읽는다는 게 뭐예요? 숫자 보는 거 아니에요?', "What do you mean, read the hammer price? Isn't it just looking at a number?"], next: 'read' }),
          opt('win', '아무도 저를 모르면, 여기선 제가 이길 수도 있겠네요', "If nobody knows me, I might win here", {
            say: ['아무도 저를 모른다니 잘됐네요. 여기선 제가 이길 수도 있겠어요.', "Nobody knows me? Good. I might actually win here."], next: 'win' }),
        ],
        note: ['부산 경매장 뒷줄에 도현수 씨가 서 있었다. 여기선 내 이름도 자기 이름도 아무도 모른다며, 내 물건 두 건을 올리고 낙찰가를 같이 읽자고 했다. 앞에선 경매사 입만, 뒤에선 손이 다 보인다고.',
          "Do Hyeonsu was standing in the back row at the Busan auction. Nobody here knows either of our names, he said — put up two lots of mine and we'd read the hammer prices together. Up front you see the auctioneer's mouth; from the back, every hand."],
      }),
      back: scene([
        line(H, '그래서 뒷줄이야.', "That's why the back row."),
        line(H, '자기 물건 값 부르는 소리를 앞에서 들으면 다리가 굳어. 여기선 남의 일처럼 들려.', "Hear your own lot called from the front and your legs lock up. Back here it sounds like someone else's."),
        line(P, '남의 일처럼요.', "Like someone else's."),
        line(H, '그래야 제대로 읽어.', "That's how you read it properly."),
      ], {
        end: endTalk({ accept: true, offer: 'back_row' }),
        note: ['뒷줄에서 같이 읽자고 했다. 도현수 씨는 자기 물건 값 부르는 소리를 앞에서 들으면 다리가 굳는다며, 뒤에선 남의 일처럼 들려야 제대로 읽는다고 했다.',
          "I agreed to read from the back row. Hear your own lot called from the front and your legs lock up, Hyeonsu said — from the back it sounds like someone else's, and that's how you read it properly."],
      }),
      here: scene([
        line(H, '견습. 중개인 밑에서.', "Apprentice. Under a broker."),
        line(H, '명찰도 없어. 아직 이름 걸고 손 드는 사람은 아니야.', "No name tag, even. I'm not someone who raises a hand on his own name yet.", { act: 'look_away' }),
        line(P, '속초에 계시는 줄 알았어요.', "I thought you were in Sokcho."),
        line(H, '속초에선 다들 날 할아버지 얼굴로 봐. 여기선 아무도 안 봐. 그게 편해. 너도 오늘은 그냥 뒷줄 사람이야.', "In Sokcho everyone sees my grandfather's face on me. Here nobody looks. That's easier. Today you're just someone in the back row too."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_here' }),
        note: ['부산까지 와서 뭐 하느냐고 물었다. 도현수 씨는 중개인 밑에서 견습 중이라며 명찰도 없는 가슴께를 툭 쳤다. 속초에선 다들 할아버지 얼굴로 보는데 여기선 아무도 안 봐서 편하다고 했다.',
          "I asked what he was doing all the way in Busan. Apprenticing under a broker, Hyeonsu said, tapping his chest where a name tag would be. In Sokcho everyone sees his grandfather in him; here nobody looks, and that's easier."],
      }),
      read: scene([
        line(H, '숫자는 마지막에 나오는 거야. 그 전에 사람이 먼저 움직여.', "The number comes last. People move before it does."),
        line(H, '손이 올라가는 순서, 내렸다가 다시 드는 손. 그런 거.', "The order hands go up. A hand that drops and rises again. That sort of thing."),
        line(P, '그걸 보면 값이 보여요?', "Watching that shows you the price?"),
        line(H, '대충. 오늘 둘이 맞혀 보자.', "Roughly. Let's both try guessing today."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_read' }),
        note: ['낙찰가를 읽는다는 게 뭐냐고 물었다. 도현수 씨는 숫자는 마지막에 나오고 그 전에 사람이 먼저 움직인다며, 오늘 둘이 맞혀 보자고 했다.',
          "I asked what reading the hammer price meant. The number comes last, Hyeonsu said; people move first. We'd both try guessing today."],
      }),
      win: scene([
        line(H, '이기고 지는 데 아니야, 여기. 값 매기는 데지.', "This isn't a place for winning and losing. It's a place for pricing."),
        act(H, 'laugh'),
        line(H, '…그래도 맞히는 수는 세자. 반 넘게 맞히면 인정해 줄게.', "...Still, let's count our hits. Get more than half and I'll give you credit."),
        line(P, '못 넘기면요?', "And if I don't?"),
        line(H, '뒷줄 자판기 커피는 네가 사.', "Then the back-row vending-machine coffee is on you."),
      ], {
        end: endTalk({ accept: true, offer: 'win_here' }),
        note: ['여기선 내가 이길 수도 있겠다고 했다. 도현수 씨는 피식 웃으며 여긴 값 매기는 데라고 했지만, 반 넘게 맞히면 인정해 주고 못 넘기면 자판기 커피는 내가 사기로 했다.',
          "I said I might win here. Hyeonsu snorted — this is a place for pricing — but agreed: more than half right and he'd give me credit; otherwise, vending-machine coffee was on me."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-2 — 끝내는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_2_done', questId: 'N18-2', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…반은 네가 맞았고, 반은 내가 맞았네.', "...You got half right, and I got half."),
        line(P, '세 번째 건은 제가 맞혔죠.', "I called the third one."),
        line(H, '그건 운이야. 네 번째는 내가 맞혔고.', "That was luck. I got the fourth."),
        line(H, '이 정도면 나쁘지 않아.', "Not bad, for this much."),
        line(P, '처음 서 본 거치고는요?', "For a first time in the back row?"),
        line(H, '처음 선 거치고는.', "For a first time.", { act: 'look_away' }),
      ], {
        choices: [
          opt('lesson', '경매사 손 읽는 법, 가르쳐 주세요', "Teach me how you read the auctioneer", {
            say: ['도현수 씨가 경매사 손 읽는 법, 가르쳐 주세요.', "Teach me how you read the auctioneer's hands."],
            end: endTalk({ complete: 'lesson',
              lineKo: '…가르쳐 달라고? 좋아. 한 번만.\n\n경매사 손가락보다 목소리를 들어. 값이 멈출 데가 오면 말이 반 박자 늘어져. 그 늘어지는 데서 마지막 손이 올라가.',
              lineEn: "...You want me to teach you? Fine. Once.\n\nListen to the auctioneer's voice, not his fingers. When the price is about to stop, his words stretch by half a beat. That's where the last hand goes up." }),
            note: ['경매사 손 읽는 법을 가르쳐 달라고 했다. 도현수 씨는 손가락보다 목소리를 들으라고, 값이 멈출 데서 말이 반 박자 늘어진다고 했다.', "I asked him to teach me to read the auctioneer. Listen to the voice, not the fingers, Hyeonsu said — the words stretch half a beat where the price stops."] }),
          opt('compete', '다음엔 제가 더 많이 맞힐게요', "Next time I'll get more right", {
            end: endTalk({ complete: 'compete',
              lineKo: '해 봐.\n\n다음엔 네 물건 말고 남의 물건으로 맞혀. 제 물건 값은 다들 높게 불러. 남의 걸 맞혀야 진짜 눈이야.',
              lineEn: "Go ahead.\n\nNext time, guess on other people's lots, not yours. Everyone prices their own too high. Getting other people's right is the real eye." }),
            note: ['다음엔 더 많이 맞히겠다고 했다. 도현수 씨도 웃었다. 다음엔 남의 물건으로 맞혀야 진짜 눈이라고 했다.', "I said I'd get more right next time. Hyeonsu smiled too — next time, guess on other people's lots; that's the real eye."] }),
          opt('pay', '오늘 낙찰 도운 값은 나눠 줘요', "Split the fee for today's help", {
            say: ['오늘 낙찰 도운 값은 나눠 줘요.', "Give me a share for helping with today's sales."], next: 'cut' }),
          opt('nocut', '수수료는 됐어요. 배운 걸로 충분해요', "No fee. What I learned is enough", {
            say: ['수수료는 됐어요. 오늘은 뒷줄에서 배운 걸로 충분해요.', "Forget the fee. What I learned in the back row today is enough."],
            end: endTalk({ complete: 'no_cut',
              lineKo: '…공짜로 배우면 버릇 된다.\n\n빚으로 달아 둘게. 견습이 계원한테 진 빚. 갚을 때까지 너는 뒷줄 단골이야.',
              lineEn: "...Learning for free becomes a habit.\n\nI'll put it on a tab. An apprentice's debt to a co-op member. Until it's paid off, you're a back-row regular." }),
            note: ['수수료는 됐다고 했다. 도현수 씨는 공짜로 배우면 버릇 된다면서도 꺼냈던 지갑을 도로 넣고, 빚으로 달아 두겠다고 했다.', "I said no fee. Learning for free becomes a habit, Hyeonsu said — but he put his wallet back and said he'd keep it as a debt."] }),
        ],
        note: ['내 물건 두 건을 올리고 뒷줄에서 낙찰가를 같이 읽었다. 반은 내가, 반은 도현수 씨가 맞혔다. 처음 선 거치고는 나쁘지 않다고 했다.',
          "I put up two lots and read the hammer prices with Hyeonsu from the back row. I got half right, he got half. Not bad for a first time, he said."],
      }),
      cut: scene([
        line(H, '…중개 수수료라 이거지. 반.', "...A broker's commission, huh. Half."),
        act(H, 'give', { to: P }),
        line(H, '견습 몫에서 나가는 거야. 아깝다는 소리는 안 해.', "It's coming out of the apprentice's share. I won't say I'll miss it."),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '네가 반 맞혔으니 반 받는 게 맞지. 셈은 정확해야 해.',
          lineEn: "You got half right, so you get half. The math has to be exact." }),
        note: ['낙찰 도운 값을 나눠 달라고 했다. 도현수 씨는 견습 몫에서 정확히 반을 세어 건넸다. 돈을 세는 손이 어른 같았다.', "I asked for a share of the commission. Hyeonsu counted out exactly half from his apprentice's cut. The hands counting money looked grown-up."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-3 「명태 이야기」 — 받는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_3_offer', questId: 'N18-3', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(P, '도현수 씨? 포항엔 어쩐 일이에요?', "Hyeonsu? What brings you to Pohang?"),
        line(H, '채록 돕는다.', "I'm helping with the oral history."),
        line(P, '노인분들 이야기 받아 적는 거요? 그걸 어떻게 알았어요?', "Writing down the elders' stories? How did you know about that?"),
        line(H, '소문났어. …노인들이 나를 좋아하거든.', "Word got around. ...Old folks like me."),
        line(P, '포항 분들이요?', "The people in Pohang?"),
        line(H, '…그냥 따라온 거야.', "...I just tagged along.", { act: 'look_away' }),
        line(H, '명태 얘기래. 옛날 이 앞바다에 명태가 얼마나 많았는지.', "It's about pollock. How much pollock there used to be off this coast."),
        line(H, '그 얘기에 나오는 고기를 만나면, 그건 놓아줘야 하고.', "And if you meet the fish from that story, you let it go."),
      ], {
        choices: [
          opt('two', '받아 적는 손이 둘이면 덜 놓치겠죠', "Two hands writing will miss less", {
            say: ['좋아요. 받아 적는 손이 둘이면 덜 놓치겠죠.', "All right. With two of us writing, we'll miss less."], next: 'two' }),
          opt('like', '노인분들이 도현수 씨를 어떻게 알아요?', "How do the elders know you?", {
            say: ['노인분들이 좋아한다고요? 포항 분들이 도현수 씨를 어떻게 알아요?', "The elders like you? How would people in Pohang even know you?"], next: 'like' }),
          opt('tease', '그냥 따라온 사람이 수첩까지 챙겨 왔네요', "For someone tagging along, you brought a notebook", { next: 'tease' }),
          opt('pollock', '명태는 걸려도 놔줘야 하는 거죠?', "So even if a pollock bites, I let it go?", {
            say: ['명태 얘기를 들으면, 명태가 걸려도 놓아줘야 하는 거죠?', "If we hear the pollock story, then even if one bites, I let it go?"], next: 'pollock' }),
        ],
        note: ['도현수 씨가 구술 채록을 돕겠다며 포항까지 따라왔다. 노인들이 자기를 좋아한다더니 그냥 따라온 거라고 말을 바꿨다. 명태 이야기를 받아 적고, 그 이야기 속 고기를 만나면 놓아주자고 했다.',
          "Do Hyeonsu followed me to Pohang to help with the oral history. He said the old folks like him, then changed it to just tagging along. We'd write down the pollock stories — and release the fish from them if we met it."],
      }),
      two: scene([
        line(H, '…그래. 한 사람이 말해도 두 사람이 다르게 들어.', "...Right. One person talks, and two people hear it differently."),
        line(H, '저녁에 맞춰 보자. 네가 적은 거랑 내가 적은 거.', "We'll compare in the evening. What you wrote and what I wrote."),
        line(P, '어긋난 데가 있으면요?', "And if they don't match?"),
        line(H, '거기부터 다시 물어. 노인들 진짜 얘기는 대개 거기 있어.', "Ask again starting there. That's usually where the real story is."),
      ], {
        end: endTalk({ accept: true, offer: 'two_hands' }),
        note: ['받아 적는 손이 둘이면 덜 놓치겠다고 했다. 도현수 씨는 닳은 수첩을 꺼내며, 저녁에 둘이 적은 걸 맞춰 보고 어긋난 데부터 다시 묻자고 했다.',
          "I said two of us writing would miss less. Hyeonsu pulled out a worn notebook — we'd compare in the evening and ask again wherever our notes didn't match."],
      }),
      like: scene([
        line(H, '모르지. 처음 봐.', "They don't. They've never seen me."),
        line(H, '노인들은 아는 사람보다 듣는 사람을 좋아해.', "Old folks like someone who listens more than someone they know."),
        line(P, '듣는 사람이요?', "Someone who listens?"),
        line(H, '중간에 안 끊고, 맞장구만 쳐. 어촌계 총회 뒷줄에 오래 앉아 있으면 저절로 배워. 거기선 다들 말이 길거든.', "Don't cut in, just go along. Sit in the back row of co-op meetings long enough and you learn it. Everyone talks forever there."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_like' }),
        note: ['포항 노인들이 어떻게 아느냐고 물었다. 도현수 씨는 어깨를 으쓱하며 모른다고, 노인들은 아는 사람보다 듣는 사람을 좋아한다고 했다. 어촌계 총회 뒷줄에서 배웠다고.',
          "I asked how the Pohang elders could know him. With a shrug, Hyeonsu said they don't — old folks like a listener more than an acquaintance. He'd learned it in the back row of co-op meetings."],
      }),
      tease: scene([
        line(H, '…버릇이야.', "...Habit."),
        line(P, '(수첩을 주머니에 도로 넣었다가, 다시 꺼낸다…)', "(He puts the notebook back in his pocket, then takes it out again...)"),
        line(H, '적을 거 있으면 적는 거지. 따라온 김에.', "If there's something to write, I write it. Since I'm here anyway."),
        line(H, '웃지 마. 노인들 앞에서 웃으면 말이 끊겨.', "Don't laugh. Laugh in front of the elders and they stop talking."),
      ], {
        end: endTalk({ accept: true, offer: 'tease_follow' }),
        note: ['그냥 따라온 사람이 수첩까지 챙겨 왔다고 놀렸다. 도현수 씨는 버릇이라며 수첩을 넣었다 다시 꺼내고, 노인들 앞에서 웃으면 말이 끊긴다고 했다.',
          "I teased him for bringing a notebook when he was just tagging along. Habit, Hyeonsu said, putting it away and taking it out again — and don't laugh in front of the elders, or they stop talking."],
      }),
      pollock: scene([
        line(H, '당연하지. 명태는 일 년 내내 잡으면 안 되는 고기야.', "Of course. Pollock's a fish you can't take any time of year."),
        line(H, '그 고기 얘길 들었으면, 만났을 때 돌려보내는 것까지 해야 해.', "If you've heard that fish's story, you have to go as far as sending it back when you meet it."),
        line(P, '듣는 걸로 끝이 아니군요.', "So hearing isn't the end of it."),
        line(H, '들은 걸 잡아 가면, 그 얘기를 판 거나 마찬가지야.', "Take home what you heard about, and you've as good as sold the story.", { act: 'look_sea' }),
      ], {
        end: endTalk({ accept: true, offer: 'ask_pollock' }),
        note: ['명태는 걸려도 놔줘야 하느냐고 물었다. 도현수 씨는 목소리를 낮춰, 명태는 일 년 내내 잡으면 안 되는 고기라고 했다. 이야기를 들었으면 만났을 때 돌려보내는 데까지 해야 한다고.',
          "I asked if I had to release a pollock even if it bit. Lowering his voice, Hyeonsu said pollock can't be taken at any time of year — if you've heard its story, you have to go as far as sending it back."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-3 — 끝내는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_3_done', questId: 'N18-3', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…네가 놓친 거 세 줄.', "...Three lines you missed."),
        line(P, '도현수 씨가 놓친 건 두 줄이고요.', "And two that you missed."),
        line(H, '둘이 적으니까 되네.', "With two of us writing, it works.", { act: 'look_away' }),
        line(P, '그런데 글씨는 도현수 씨가 훨씬 곱던데요. 좀 억울해요.', "But your handwriting's much neater than mine. That stings a little."),
        act(H, 'laugh'),
        line(H, '억울하면 연습해.', "If it stings, practice."),
      ], {
        choices: [
          opt('lesson', '노인분들 말 끌어내는 법, 배우고 싶어요', "I want to learn how you draw the elders out", {
            say: ['도현수 씨가 노인분들 말 끌어내는 법, 배우고 싶어요.', "I want to learn how you get the elders to open up."],
            end: endTalk({ complete: 'lesson',
              lineKo: '…듣는 거야. 끼어들지 않고.\n\n말이 끊기면 다음 질문을 하지 말고 기다려. 노인들은 쉬었다가 진짜 얘기를 해. 그 쉬는 데를 못 참으면 반만 듣는 거야.',
              lineEn: "...You listen. Without cutting in.\n\nWhen they stop, don't ask the next question — wait. Old folks rest, then tell you the real story. If you can't sit through that pause, you only hear half." }),
            note: ['노인들 말을 끌어내는 법을 물었다. 도현수 씨는 말이 끊겨도 다음 질문을 하지 말고 기다리라고, 노인들은 쉬었다가 진짜 얘기를 한다고 했다.', "I asked how he drew the elders out. When they stop, don't ask the next question, Hyeonsu said — wait. They rest, then tell the real story."] }),
          opt('compete', '다음엔 제가 더 많이 적을 거예요', "Next time I'll write down more", {
            end: endTalk({ complete: 'compete',
              lineKo: '글씨부터 고쳐.\n\n많이 적는다고 잘 적는 거 아니야. 노인 말투 그대로 적어. 고쳐 적으면 그 사람이 없어져.',
              lineEn: "Fix your handwriting first.\n\nWriting more isn't writing better. Write it the way they talk. Fix it up and the person disappears." }),
            note: ['다음엔 더 많이 적겠다고 했다. 도현수 씨는 웃으며 글씨부터 고치라고, 노인 말투를 그대로 적으라고 했다. 같은 노인을 두고 둘이 웃은 건 처음이었다.', "I said I'd write down more next time. Laughing, Hyeonsu told me to fix my handwriting first and write it the way they talk. It was the first time we'd laughed together over the same old man."] }),
          opt('thanks', '따라와 줘서 고마워요', "Thanks for coming along", { next: 'thanks' }),
          opt('name', '채록본에 도현수 씨 이름도 같이 올려요', "Let's put your name on the record too", {
            end: endTalk({ complete: 'share_name',
              lineKo: '…내 이름은 빼. 따라온 거라니까.\n\n두 사람이 적었다고만 써. 이름은 노인들 거면 돼. 말한 사람이 주인이지 적은 사람이 주인이 아니야.',
              lineEn: "...Leave my name out. I said I just tagged along.\n\nJust write that two people took it down. The names should be the elders'. The one who spoke owns it, not the one who wrote it." }),
            note: ['채록본에 도현수 씨 이름도 올리자고 했다. 그는 빼라고, 말한 사람이 주인이라고 했다. 그래도 수첩 맨 끝 장에 자기 이름을 작게 적었다.', "I said we should put his name on the record. Leave it out, Hyeonsu said — the speaker owns it. Still, he wrote his name small on the last page of his notebook."] }),
        ],
        note: ['도현수 씨와 노인들 이야기를 받아 적고 저녁에 맞춰 보니, 내가 놓친 게 세 줄, 그가 놓친 게 두 줄이었다. 둘이 적으니까 됐는데, 그의 글씨가 나보다 곱다는 게 조금 억울했다.',
          "Comparing our notes on the elders' stories that evening, I'd missed three lines and Hyeonsu two. With two of us it worked — though that his handwriting was neater than mine stung a little."],
      }),
      thanks: scene([
        line(H, '…따라온 거 아니라니까.', "...I told you, I didn't tag along."),
        act(H, 'silence'),
        line(H, '…다음 채록은 언제야.', "...When's the next session?"),
        line(P, '왜요?', "Why?"),
      ], {
        end: endTalk({ complete: 'thanks',
          lineKo: '아니, 그냥 물어본 거야. 날짜만 알려 줘. 나도 적어 두게.',
          lineEn: "No reason, just asking. Tell me the date. So I can write it down too." }),
        note: ['따라와 줘서 고맙다고 했다. 도현수 씨는 따라온 거 아니라더니, 한참 있다가 다음 채록이 언제냐고 먼저 물었다.', "I thanked him for coming along. He insisted he hadn't tagged along — then, after a while, asked first when the next session was."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-4 「같은 배를 보는 눈」 — 받는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_4_offer', questId: 'N18-4', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '배 보러 간다며.', "Heard you're going to look at a boat."),
        line(P, '어떻게 알았어요? 거제에 중고 배 하나 보러 가는 길이에요.', "How did you know? I'm on my way to see a used boat in Geoje."),
        line(H, '할아버지가 그러더라. 계원 하나가 배 본다고.', "My grandfather mentioned it. That one of the co-op members was looking at a boat.", { act: 'look_away' }),
        line(H, '나도 가.', "I'm coming."),
        line(P, '도현수 씨도요? 왜요?', "You too? Why?"),
        line(H, '혼자 보면 반은 놓쳐. 값은 내가 봐. 바닥은 네가 봐.', "Look alone and you miss half. I'll look at the price. You look at the bottom."),
        line(P, '저는 바닥이요?', "I get the bottom?"),
        line(H, '그리고 배값 맞추려면 네 물건도 좀 팔아야 할 거야. 네 건쯤.', "And to get near the price, you'll need to sell some of your catch. About four lots."),
      ], {
        choices: [
          opt('split', '좋아요. 바닥은 제가, 값은 도현수 씨가요', "Fine. I'll take the bottom, you take the price", {
            say: ['좋아요. 바닥은 제가 볼게요. 값은 도현수 씨한테 맡길게요.', "All right. I'll check the bottom. I'll leave the price to you."], next: 'split' }),
          opt('price', '중고 배 값을 어떻게 알아요?', "How would you know what a used boat costs?", {
            say: ['중고 배 값을 도현수 씨가 어떻게 알아요? 경매장이랑은 다르잖아요.', "How would you know used-boat prices? It's not like the auction."], next: 'price' }),
          opt('bottom', '바닥은 어떻게 봐요? 그냥 들여다보면 돼요?', "How do I check the bottom? Just look?", { next: 'bottom' }),
          opt('haggle', '같이 가는 건 좋은데, 마지막 흥정은 제가 할게요', "Come along, but the final haggling is mine", {
            say: ['같이 가는 건 좋은데요, 마지막 흥정은 제가 할게요.', "You can come along — but the final haggling is mine."], next: 'haggle' }),
        ],
        note: ['거제로 중고 배를 보러 간다는 걸 도현수 씨가 할아버지한테 들었다며 따라나섰다. 혼자 보면 반은 놓친다고, 값은 자기가 보고 바닥은 내가 보자고 했다. 배값을 맞추려면 내 물건도 네 건쯤 팔아야 할 거라고.',
          "Do Hyeonsu had heard from his grandfather that I was going to see a used boat in Geoje, and came along. Look alone and you miss half, he said — he'd check the price, I'd check the bottom. To get near the price, I'd need to sell about four lots."],
      }),
      split: scene([
        line(H, '맡긴다는 말 쉽게 하네.', "You hand things over easily."),
        line(H, '나는 숫자 볼 테니까 너는 배 밑으로 들어가.', "I'll watch the numbers. You get under the boat."),
        line(P, '같은 데 같이 보면 안 돼요?', "Can't we look at the same things together?"),
        line(H, '둘이 같은 데를 보면 둘 다 같은 걸 놓쳐. 다른 데를 봐야 돼.', "If we both look at the same place, we both miss the same thing. We have to look at different places."),
      ], {
        end: endTalk({ accept: true, offer: 'split_work' }),
        note: ['바닥은 내가, 값은 도현수 씨가 보기로 했다. 그는 견적서 사본을 반으로 접어 넣으며, 둘이 같은 데를 보면 같은 걸 놓친다고 했다.',
          "We split it — I'd take the bottom, Hyeonsu the price. Folding a copy of the estimate into his pocket, he said if we both looked at the same place we'd miss the same thing."],
      }),
      price: scene([
        line(H, '다르긴. 사람이 값을 부르는 건 똑같아.', "Different how? People calling out prices is the same anywhere."),
        line(H, '수리 견적은 줄마다 누가 얼마 받는지가 붙어 있어. 거기서 부풀린 데가 보여.', "Every line of a repair estimate shows who gets paid how much. That's where you see the padding."),
        line(P, '부산에선 반반이었잖아요.', "We went half and half in Busan."),
        line(H, '그래서 이번엔 숫자는 내 쪽이야.', "That's why this time, the numbers are mine."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_price' }),
        note: ['중고 배 값을 어떻게 아느냐고 물었다. 도현수 씨는 사람이 값을 부르는 건 어디나 같다며, 수리 견적의 줄마다 부풀린 데가 보인다고 했다. 이번엔 숫자는 자기 쪽이라고.',
          "I asked how he'd know used-boat prices. People calling prices is the same everywhere, Hyeonsu said — the padding shows up line by line in a repair estimate. This time the numbers were his."],
      }),
      bottom: scene([
        line(H, '올려 둔 배면 밑으로 들어가서 보고, 물에 떠 있으면 배 안 바닥부터 봐.', "If it's up on blocks, get underneath. If it's in the water, start from the floor inside."),
        line(H, '물 고인 자국, 칠을 새로 바른 자리.', "Marks where water's pooled. Places with fresh paint."),
        line(P, '새로 칠한 데가 왜요?', "Why fresh paint?"),
        line(H, '제일 수상하지. 감출 게 있으니까 칠하는 거거든.', "That's the most suspicious. You paint because there's something to hide."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_bottom' }),
        note: ['바닥은 어떻게 보느냐고 물었다. 도현수 씨는 손바닥으로 배 바닥을 쓸어내리는 시늉을 하며, 물 고인 자국과 새로 칠한 자리를 보라고 했다. 감출 게 있으니까 칠한다고.',
          "I asked how to check the bottom. Miming a hand sweeping down a hull, Hyeonsu said to look for water marks and fresh paint — you paint because there's something to hide."],
      }),
      haggle: scene([
        line(H, '…좋아. 마지막 흥정은 네가 해. 배는 네 배니까.', "...Fine. You do the final haggling. It's your boat."),
        act(H, 'laugh'),
        line(H, '대신 내가 그만하라고 하면 그만해.', "But when I say stop, you stop."),
        line(P, '왜요?', "Why?"),
        line(H, '깎을 데 다 깎고 나서도 더 깎으면 수리를 대충 해 줘. 그건 숫자에 안 나와.', "Keep cutting after there's nothing left to cut, and they'll do the repairs half-heartedly. That never shows up in the numbers."),
      ], {
        end: endTalk({ accept: true, offer: 'haggle_mine' }),
        note: ['마지막 흥정은 내가 하겠다고 했다. 도현수 씨는 피식 웃으며 배는 내 배니까 좋다고 했다. 대신 그만하라고 하면 그만하라고, 너무 깎으면 수리를 대충 해 준다고.',
          "I said the final haggling was mine. Hyeonsu smirked — fine, it's my boat. But when he says stop, I stop; cut too far and they'll skimp on the repairs."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-4 — 끝내는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_4_done', questId: 'N18-4', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…균열 찾았네.', "...You found the crack."),
        line(P, '칠 밑에 있었어요. 두드리니까 소리가 달랐어요.', "It was under the paint. It sounded different when I tapped it."),
        line(H, '나는 견적 항목. 인건비 줄이 부풀어 있었어.', "I got the estimate item. The labor line was padded."),
        line(P, '저는 그건 하나도 못 봤어요.', "I didn't catch that at all."),
        line(H, '둘이 보니까 되네.', "Looking together, it works.", { act: 'look_away' }),
      ], {
        choices: [
          opt('team', '둘이 보니까 됐어요. 그 말 그대로예요', "Looking together worked. Exactly that", {
            say: ['둘이 보니까 됐어요. 그 말 그대로예요.', "Looking together, it worked. Exactly as you said."],
            end: endTalk({ complete: 'team',
              lineKo: '…그래.\n\n혼자 보면 반은 놓치고, 둘이 보면 덜 놓쳐. 그게 다야. 그 이상 말 시키지 마. 다음 배 볼 때도 연락해.',
              lineEn: "...Yeah.\n\nLook alone and you miss half; look together and you miss less. That's all. Don't make me say more. Call me next time you look at a boat, too." }),
            note: ['둘이 보니까 됐다고, 그 말 그대로라고 했다. 도현수 씨는 그 이상 말 시키지 말라면서, 다음 배 볼 때도 연락하라고 했다. 배 한 척을 사이에 두고 처음으로 팀이었다.', "I said looking together had worked, just as he said. Don't make me say more, Hyeonsu said — but call next time too. With a boat between us, we'd been a team for the first time."] }),
          opt('lesson', '견적 읽는 법, 가르쳐 주세요', "Teach me how to read an estimate", {
            end: endTalk({ complete: 'lesson',
              lineKo: '…한 번만. 인건비 항목부터 봐.\n\n부품값은 어디나 비슷해. 부풀리는 건 사람 손 값이야. 하루 걸릴 일을 사흘로 적으면 그게 다 남는 돈이지.',
              lineEn: "...Once. Start with the labor line.\n\nParts cost about the same anywhere. What gets padded is the price of people's hands. Write a one-day job as three days, and that's all profit." }),
            note: ['견적 읽는 법을 가르쳐 달라고 했다. 도현수 씨는 부품값은 어디나 비슷하니 인건비 항목부터 보라고 했다.', "I asked him to teach me how to read an estimate. Parts cost the same everywhere, Hyeonsu said — start with the labor line."] }),
          opt('compete', '다음 배는 제가 값도 볼게요', "Next boat, I'll check the price too", {
            end: endTalk({ complete: 'compete',
              lineKo: '해 봐. 바닥이나 잘 보고.\n\n값 보는 눈은 하루에 안 생겨. 나도 부산 뒷줄에 한참 서 있었어. 틀리면 내가 고쳐 줄게.',
              lineEn: "Go ahead. Just keep watching the bottom.\n\nAn eye for prices doesn't grow in a day. I stood in that back row in Busan for a long time. If you get it wrong, I'll correct you." }),
            note: ['다음 배는 값도 내가 보겠다고 했다. 도현수 씨는 웃으며, 값 보는 눈은 하루에 안 생긴다고, 틀리면 고쳐 주겠다고 했다.', "I said I'd check the price too on the next boat. Laughing, Hyeonsu said an eye for prices doesn't grow in a day — he'd correct me if I got it wrong."] }),
          opt('half', '아낀 돈, 반은 도현수 씨 몫이에요', "Half the money we saved is yours", {
            say: ['도현수 씨가 찾은 견적 줄 덕에 아낀 돈, 반은 도현수 씨 몫이에요.', "The money we saved thanks to that estimate line you found — half of it's yours."], next: 'half' }),
        ],
        note: ['도현수 씨와 중고 배를 같이 봤다. 내가 칠 밑의 균열을 찾았고, 그가 부풀린 인건비 줄을 찾았다. 둘이 보니까 됐다.',
          "Hyeonsu and I looked over the used boat together. I found the crack under the paint; he found the padded labor line. Looking together, it worked."],
      }),
      half: scene([
        line(H, '됐어. 그 돈으로 균열이나 메워.', "Forget it. Use that money to fix the crack.", { act: 'shake_head' }),
        line(H, '배 값 아낀 건 네 배가 가져가는 거야.', "Whatever was saved on the boat belongs to your boat."),
        line(P, '그래도요.', "Still."),
      ], {
        end: endTalk({ complete: 'half_saved',
          lineKo: '대신 네가 바닥 본 거, 할아버지한테 말해 둘게. 계원 중에 바닥 보는 눈 있는 사람 드물어.',
          lineEn: "Instead, I'll tell my grandfather how you checked the bottom. Not many co-op members have an eye for hulls." }),
        note: ['아낀 돈 반은 도현수 씨 몫이라고 했다. 그는 손을 내저으며 그 돈으로 균열이나 메우라고 했다. 대신 내가 바닥 본 걸 할아버지한테 말해 두겠다고.', "I said half of what we saved was his. Waving it off, Hyeonsu told me to fix the crack with it — instead, he'd tell his grandfather how I checked the hull."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-5 「표결 전야」 — 받는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_5_offer', questId: 'N18-5', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '이거.', "This."),
        line(P, '이게 뭐예요? 자료가 한 뭉치네요.', "What is it? That's quite a stack of papers."),
        line(H, '반대편 자료야. 낚시공원.', "The opposition's material. On the fishing park."),
        line(P, '표결하는 그거요? 이걸 왜 저한테…', "The one that's going to a vote? Why bring this to me..."),
        line(H, '네 말이 맞으면 내가 진 거잖아.', "If you're right, then I've lost."),
        line(P, '…그런데도 들고 오셨어요?', "...And you brought it anyway?"),
        line(H, '…그래도 같이 정리하자.', "...Let's sort it out together anyway.", { act: 'look_away' }),
        line(H, '자료에 붙일 조간대 표본도 필요해. 세 점. 물 빠질 때.', "We'll need intertidal samples to attach, too. Three. When the tide's out."),
      ], {
        choices: [
          opt('sort', '좋아요. 찬성은 제가, 반대는 도현수 씨가요', "Good. I'll take the for side, you the against", {
            say: ['좋아요. 찬성은 제가, 반대는 도현수 씨가요. 밤새 해 봐요.', "All right. I'll take the case for, you take the case against. Let's go all night."], next: 'sort' }),
          opt('side', '그럼 도현수 씨는 어느 쪽인데요?', "So which side are you on?", {
            say: ['제 말이 맞으면 진 거라니. 그럼 도현수 씨는 어느 쪽인데요?', "If I'm right, you've lost? Then which side are you actually on?"], next: 'side' }),
          opt('samples', '조간대 표본은 왜 붙여요?', "Why attach intertidal samples?", {
            say: ['조간대 표본은 왜 붙여요? 서류만으로는 안 돼요?', "Why attach intertidal samples? Isn't the paperwork enough?"], next: 'samples' }),
          opt('like', '밤새 같이 하자고요? 이런 거 좋아하시네요', "All night together? You like this kind of thing", {
            say: ['밤새 같이 하자고요? 도현수 씨, 이런 거 좋아하시는구나.', "All night together? So you like this sort of thing."], next: 'like' }),
        ],
        note: ['낚시공원 표결을 앞두고 도현수 씨가 반대편 자료 뭉치를 들고 왔다. 내 말이 맞으면 자기가 진 거라면서도, 같이 정리하자고 했다. 자료에 붙일 조간대 표본 세 점도 물 빠질 때 모아야 한다고.',
          "On the eve of the fishing-park vote, Do Hyeonsu showed up with a stack of the opposition's material. If I'm right, he's lost, he said — but let's sort it out together anyway. We'd also need three intertidal samples, gathered at low tide."],
      }),
      sort: scene([
        line(H, '…그래. 반대쪽 말은 내가 써.', "...Fine. I'll write up the opposition."),
        line(H, '바다 얘기는 채록하면서 노인들한테 많이 들었어.', "I heard plenty about the sea from the elders during the oral history."),
        line(P, '밤새 걸리겠네요.', "This'll take all night."),
        line(H, '커피는 네가 타. 나는 졸면 반대 논리가 물러지거든.', "You make the coffee. If I nod off, my case against goes soft."),
      ], {
        end: endTalk({ accept: true, offer: 'sort_both' }),
        note: ['찬성은 내가, 반대는 도현수 씨가 맡기로 했다. 그는 자료 뭉치를 반으로 가르며, 바다 얘기는 채록 때 노인들한테 많이 들었다고 했다. 커피는 내가 타기로.',
          "We split it: I'd take the case for, Hyeonsu the case against. Dividing the stack in half, he said he'd heard plenty about the sea from the elders. Coffee was on me."],
      }),
      side: scene([
        line(H, '…말 안 해. 표결에서 봐.', "...Not telling. You'll see at the vote."),
        line(H, '어느 쪽이든, 반대편 얘기를 모르고 손 들면 그건 그냥 편 드는 거야.', "Either way, raise your hand without knowing the other side's case, and you're just picking a team."),
        line(P, '그래서 저도 그쪽 자료를 읽으라는 거죠?', "So you want me to read your side's material too?"),
        line(H, '끝까지.', "To the end."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_side' }),
        note: ['도현수 씨에게 어느 쪽이냐고 물었지만, 그는 표결에서 보라고만 했다. 반대편 얘기를 모르고 손 들면 그냥 편 드는 거라며, 내게도 끝까지 읽으라고 했다.',
          "I asked which side he was on, but he'd only say I'd see at the vote. Raising your hand without knowing the other case is just picking a team, he said, and told me to read it to the end."],
      }),
      samples: scene([
        line(H, '숫자만 보면 다들 졸아.', "Look at nothing but numbers and everyone dozes off."),
        line(H, '찬성은 일자리 얘기고 반대는 바다 얘기야. 바다 얘기를 하려면 바다를 보여 줘야지.', "The case for is about jobs; the case against is about the sea. To talk about the sea, you have to show the sea."),
        line(P, '그래서 세 점이군요.', "Hence three samples."),
        line(H, '살아 있는 걸 보면, 그제야 서류도 읽어.', "Once they see something alive, then they'll read the papers."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_samples' }),
        note: ['조간대 표본은 왜 붙이느냐고 물었다. 도현수 씨는 빈 표본 봉투를 내밀며, 반대는 바다 얘기라 바다를 보여 줘야 한다고 했다. 살아 있는 걸 봐야 서류도 읽는다고.',
          "I asked why we'd attach intertidal samples. Handing me empty sample bags, Hyeonsu said the case against is about the sea, so we have to show the sea — once people see something alive, they'll read the papers."],
      }),
      like: scene([
        line(H, '좋아하긴.', "Like it? Please."),
        line(H, '…틀린 걸로 지는 게 싫은 거야.', "...I just hate losing because of something wrong."),
        line(H, '네가 이기든 내가 이기든 맞는 걸로 이기자.', "Whether you win or I win, let's win with what's right."),
        line(P, '그럼 앉을게요.', "Then I'll sit down."),
        line(H, '반대 논리부터 읽어 줄게.', "I'll read you the case against first."),
      ], {
        end: endTalk({ accept: true, offer: 'like_this' }),
        note: ['이런 거 좋아하시나 보다고 했다. 도현수 씨는 자료를 손등으로 탁 치며, 틀린 걸로 지는 게 싫은 거라고 했다. 누가 이기든 맞는 걸로 이기자고.',
          "I said he must like this sort of thing. Smacking the papers with the back of his hand, Hyeonsu said he just hates losing on something wrong. Whoever wins, let's win with what's right."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-5 — 끝내는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_5_done', questId: 'N18-5', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…됐다.', "...Done."),
        line(P, '날이 밝았네요.', "It's light out already."),
        line(H, '찬성 쪽, 빈 데 없지?', "The case for — no gaps left?"),
        line(P, '도현수 씨가 짚어 준 두 군데는 메웠어요.', "I filled the two holes you pointed out."),
        line(H, '그럼 됐어. 표결에서 보자.', "Then that's it. See you at the vote.", { act: 'look_away' }),
        line(P, '어느 쪽인지는요?', "And which side you're on?"),
        line(H, '그때.', "Then."),
      ], {
        choices: [
          opt('thanks', '자료 들고 와 줘서 고마워요', "Thanks for bringing the material", {
            end: endTalk({ complete: 'thanks',
              lineKo: '…들고 온 거 아니라니까. 고맙다는 소리 듣자고 한 거 아니야.\n\n맞는 걸로 이기고 싶었을 뿐이야. 이제 그 얘긴 그만.',
              lineEn: "...I told you, I didn't bring it for you. I didn't do it to be thanked.\n\nI just wanted to win with what's right. Enough about that now." }),
            note: ['자료를 들고 와 줘서 고맙다고 했다. 도현수 씨는 고맙다는 소리 듣자고 한 게 아니라고, 맞는 걸로 이기고 싶었을 뿐이라고 했다.', "I thanked him for bringing the material. He hadn't done it to be thanked, Hyeonsu said — he just wanted to win with what's right."] }),
          opt('lesson', '자료 읽는 순서가 저보다 빨라요. 가르쳐 주세요', "You read material faster than me. Teach me", {
            say: ['도현수 씨가 자료를 읽는 순서가 저보다 빨라요. 그거 가르쳐 주세요.', "The order you read material in is faster than mine. Teach me that."],
            end: endTalk({ complete: 'lesson',
              lineKo: '결론부터 읽어. 근거는 나중에.\n\n결론을 먼저 알면 근거가 빈 데가 보여. 처음부터 읽으면 쓴 사람 말에 끌려가. 반대 자료일수록 거꾸로 읽어.',
              lineEn: "Read the conclusion first. Evidence later.\n\nKnow the conclusion first and you see where the evidence is thin. Read from the start and you get dragged along by the writer. The more opposed the material, the more you read it backward." }),
            note: ['자료 읽는 법을 물었다. 도현수 씨는 결론부터 읽으라고, 그래야 근거가 빈 데가 보인다고 했다.', "I asked how he reads material. Conclusion first, Hyeonsu said — that's how you see where the evidence is thin."] }),
          opt('compete', '도현수 씨가 반대편이면, 제가 이긴 거예요', "If you're on the other side, I've won", {
            say: ['표결에서 도현수 씨가 반대편이면, 제가 이긴 거예요.', "If you end up on the other side at the vote, that means I've won."],
            end: endTalk({ complete: 'compete',
              lineKo: '…해 봐.\n\n이번엔 이기고 지는 게 아니야. …그래도 다음엔 내가 이겨.',
              lineEn: "...Go ahead.\n\nThis time it's not about winning or losing. ...But next time, I win." }),
            note: ['도현수 씨가 반대편이면 내가 이긴 거라고 했다. 그는 이번엔 이기고 지는 게 아니라면서도, 다음엔 자기가 이긴다고 했다.', "I said if he was on the other side, I'd won. This time isn't about winning, Hyeonsu said — but next time, he wins."] }),
          opt('copy', '정리한 자료, 계에도 한 부 남겨요', "Let's leave a copy with the co-op", {
            say: ['정리한 자료, 계에도 한 부 남겨요. 다음 사람을 위해서요.', "Let's leave a copy of what we sorted with the co-op. For whoever comes next."], next: 'copy' }),
        ],
        note: ['도현수 씨는 반대 논리를, 나는 찬성 논리를 맡아 밤새 자료를 정리했다. 새벽이 되도록 둘 다 어느 쪽인지 말하지 않았고, 그는 표결에서 보자고만 했다.',
          "Hyeonsu took the case against and I the case for, and we sorted the material all night. By dawn neither of us had said which side we were on — we'll see at the vote, was all he said."],
      }),
      copy: scene([
        line(H, '…계에? 표결 끝나면 아무도 안 볼걸.', "...The co-op? Nobody will look at it after the vote."),
        line(P, '다음에 누가 또 밤새지 않게요.', "So the next person doesn't have to stay up all night."),
        act(H, 'silence'),
      ], {
        end: endTalk({ complete: 'keep_copy',
          lineKo: '…남겨 두면 줄긴 하겠지. 이름은 둘 다 적어. 찬성 하나, 반대 하나. 그래야 한쪽 자료라고 안 해.',
          lineEn: "...Leaving it would cut that down, I guess. Put both names on it. One for, one against. Then nobody calls it one-sided." }),
        note: ['정리한 자료를 계에도 한 부 남기자고 했다. 도현수 씨는 아무도 안 볼 거라면서도 복사본 한 부를 따로 챙겼다. 이름은 찬성 하나, 반대 하나로 둘 다 적자고 했다.', "I suggested leaving a copy with the co-op. Nobody will read it, Hyeonsu said — but he set a copy aside. Put both names, one for and one against, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-6 「원산지 표기」 — 받는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_6_offer', questId: 'N18-6', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '여기.', "Here."),
        line(P, '도현수 씨? 인천 도매시장까지 어쩐 일이에요?', "Hyeonsu? What are you doing at the Incheon wholesale market?"),
        line(H, '봐. 원산지 위반이야.', "Look. A country-of-origin violation."),
        line(P, '위반이요? 저는 그냥 라벨인 줄…', "A violation? It just looks like a label to me..."),
        line(H, '라벨 원산지 칸, 좀 이상하지 않아?', "The origin box on the label — doesn't it look a bit off?", { act: 'peer' }),
        line(P, '(가까이 보니, 그 칸만 종이가 살짝 들떠 있다.)', "(Up close, that one box is lifting slightly off the paper.)"),
        line(H, '검사원 시험 준비해. 나.', "I'm studying for the inspector's exam. Me."),
        line(P, '검사원이요?', "Inspector?"),
        line(H, '…같이 확인해. 그리고 네 물건은 원산지 적어서 올려. 세 건. 직접 마련한 걸로만.', "...Check it with me. And put up your own goods with the origin written. Three lots. Only things you got yourself."),
      ], {
        choices: [
          opt('check', '좋아요, 같이 봐요. 어디부터 보면 돼요?', "Sure, let's look. Where do I start?", { next: 'check' }),
          opt('exam', '검사원 시험이요? 부산 중개 일은요?', "The inspector's exam? What about the broker work in Busan?", { next: 'exam' }),
          opt('penalty', '원산지 위반이면 어떻게 돼요?', "What happens with an origin violation?", {
            say: ['원산지 위반이면 어떻게 돼요? 라벨만 고치면 끝이에요?', "What happens with an origin violation? Do they just fix the label?"], next: 'penalty' }),
          opt('chief', '계장 손자가 검사원 되면 계원들이 다 떨겠네요', "The chief's grandson as inspector — the members will tremble", {
            say: ['어촌계장 손자가 검사원 되면, 계원들이 다 떨겠네요.', "The co-op chief's grandson becoming an inspector — the members are all going to tremble."], next: 'chief' }),
        ],
        note: ['인천 도매시장에서 검사원 시험을 준비한다는 도현수 씨가, 원산지 칸만 들뜬 라벨을 짚었다. 그 위반을 같이 확인하고, 내 물건은 직접 마련한 것만 원산지를 적어 세 건 올리라고 했다.',
          "At the Incheon wholesale market, Do Hyeonsu — studying for the inspector's exam — pointed out a label whose origin box was lifting. We'd confirm the violation together, and I'd put up three lots of my own catch, origin written."],
      }),
      check: scene([
        line(H, '이름이랑 값은 나중이야. 어디서 왔는지 적힌 칸부터 봐.', "Name and price come later. Start with the box that says where it came from."),
        line(H, '여기 귀퉁이. 손톱으로 긁으면 들려.', "This corner here. Scratch it with a fingernail and it lifts."),
        line(P, '덧붙인 거네요.', "So it was stuck on top."),
        line(H, '그래. 이거 확인하고, 네 물건 올리는 건 네가 해.', "Right. We confirm this one, and putting up your own goods is on you."),
      ], {
        end: endTalk({ accept: true, offer: 'check_together' }),
        note: ['어디부터 보면 되느냐고 묻자, 도현수 씨가 원산지 칸 귀퉁이를 손톱으로 짚었다. 덧붙인 라벨이었다.',
          "When I asked where to start, Hyeonsu pressed a fingernail into the corner of the origin box. It was a label stuck on top."],
      }),
      exam: scene([
        line(H, '중개는 접었어.', "I quit brokering."),
        line(P, '왜요?', "Why?"),
        line(H, '이유는… 붙으면 말할게.', "The reason... I'll tell you if I pass.", { act: 'look_away' }),
        line(H, '아직 붙은 거 아니니까 떠들지 마. 붙기 전에 소문나면, 떨어졌을 때 두 번 떨어지는 거야.', "I haven't passed yet, so don't go talking. If word gets out before I pass and then I fail, I fail twice."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_exam' }),
        note: ['부산 중개 일은 어떻게 하고 검사원 시험이냐고 물었다. 도현수 씨는 중개는 접었다며, 이유는 붙으면 말하겠다고 했다. 붙기 전에 소문나면 두 번 떨어지는 거라고.',
          "I asked what happened to the broker work in Busan. He'd quit brokering, Hyeonsu said — he'd tell me why if he passed. If word got out before then, failing would mean failing twice."],
      }),
      penalty: scene([
        line(H, '아니. 안 적은 건 과태료지만, 거짓으로 적은 건 형사 처벌까지 가.', "No. Not labeling gets you a fine, but labeling falsely can go as far as criminal charges."),
        line(H, '수입산을 국산으로 붙이면 값이 확 뛰거든.', "Slap a domestic label on an import and the price jumps."),
        line(P, '그래서 제 물건도 원산지를 제대로 적으라는 거군요.', "So that's why you want me to label my own goods properly."),
        line(H, '남의 라벨 들추는 사람이 제 라벨 틀리면 웃음거리야.', "Someone who peels back other people's labels and gets his own wrong is a joke."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_penalty' }),
        note: ['원산지 위반이면 어떻게 되느냐고 물었다. 도현수 씨는 안 적은 건 과태료지만 거짓으로 적으면 형사 처벌까지 간다며, 라벨을 사진으로 찍어 뒀다. 남의 라벨을 들추려면 내 라벨부터 맞아야 한다고.',
          "I asked what happens with an origin violation. Not labeling is a fine, Hyeonsu said, but false labeling can mean criminal charges — and he photographed the label. To peel back others' labels, yours have to be right first."],
      }),
      chief: scene([
        line(H, '…그 소리 들을 줄 알았어.', "...I knew I'd hear that."),
        act(H, 'silence'),
        line(H, '계원 물건이라고 봐주면 검사원이 아니지. 떨 사람은 떨어야 하고.', "If I go easy because it's a member's goods, I'm no inspector. The ones who should tremble should tremble."),
        line(P, '저는요?', "And me?"),
        line(H, '너는 안 떨어도 돼. 적을 거 제대로 적으면.', "You don't need to. As long as you write down what you should."),
      ], {
        end: endTalk({ accept: true, offer: 'chief_grandson' }),
        note: ['계장 손자가 검사원 되면 계원들이 떨겠다고 했다. 도현수 씨는 얼굴이 굳었다가 천천히 풀리며, 계원 물건이라고 봐주면 검사원이 아니라고 했다. 나는 제대로 적으면 안 떨어도 된다고.',
          "I said the members would tremble at the chief's grandson becoming an inspector. Hyeonsu's face stiffened, then slowly eased — go easy on members and you're no inspector. I needn't tremble if I label properly, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-6 — 끝내는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_6_done', questId: 'N18-6', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '한 건 확인.', "One case confirmed."),
        line(P, '덧붙인 라벨, 사진도 남겼어요. 제 물건 세 건도 원산지 적어서 올렸고요.', "I kept a photo of the stuck-on label. And I put up my three lots with the origin written."),
        line(H, '봤어. 깨끗하더라.', "I saw. Clean."),
        line(H, '검사원 눈이지. 어촌계장 손자가 아니라.', "That's an inspector's eye. Not the co-op chief's grandson's."),
        line(P, '(그 말을 할 때, 도현수 씨 목소리가 조금 높았다.)', "(When he said that, Hyeonsu's voice rose a little.)"),
      ], {
        choices: [
          opt('lesson', '라벨 보는 순서, 가르쳐 주세요', "Teach me the order for reading labels", {
            say: ['라벨 보는 순서, 검사원 시험용으로 가르쳐 주세요.', "Teach me the order for reading labels — the inspector's-exam version."],
            end: endTalk({ complete: 'lesson',
              lineKo: '…네가 시험 보게? 아니지. 그래도 가르쳐 줄게.\n\n원산지, 품명, 날짜, 그다음이 값. 값부터 보면 싼 맛에 다른 게 안 보여. 이 순서만 지켜도 반은 걸러.',
              lineEn: "...You're taking the exam? No. I'll teach you anyway.\n\nOrigin, product name, date, and then price. Look at price first and the bargain blinds you to everything else. Keep to that order and you'll catch half of them." }),
            note: ['라벨 보는 순서를 가르쳐 달라고 했다. 도현수 씨는 원산지, 품명, 날짜, 그다음이 값이라고 했다. 값부터 보면 싼 맛에 다른 게 안 보인다고.', "I asked him to teach me how to read a label. Origin, name, date, then price, Hyeonsu said — look at price first and the bargain blinds you."] }),
          opt('proud', '검사원, 도현수 씨한테 맞는 것 같아요', "Inspector suits you, I think", { next: 'proud' }),
          opt('compete', '저는 선장, 도현수 씨는 검사원이면 다음 대결은요?', "If I'm a captain and you're an inspector, what's our next contest?", {
            say: ['저는 선장이고 도현수 씨는 검사원이면, 다음 대결은 뭘로 하죠?', "If I'm a captain and you're an inspector, what's our next contest going to be?"],
            end: endTalk({ complete: 'compete',
              lineKo: '…생각해 볼게. 있을 거야.\n\n누가 더 깨끗한 물건을 올리나, 그거면 되겠네. 선장은 잡은 걸로, 검사원은 잡아낸 걸로. 지면 커피.',
              lineEn: "...I'll think about it. There'll be something.\n\nWho puts up cleaner goods — that'd work. The captain with what he catches, the inspector with what he catches out. Loser buys coffee." }),
            note: ['선장과 검사원이면 다음 대결은 뭘로 하느냐고 물었다. 도현수 씨는 웃으며, 누가 더 깨끗한 물건을 올리나로 하자고 했다. 지면 커피.', "I asked what we'd compete on as captain and inspector. Laughing, Hyeonsu said: who puts up cleaner goods. Loser buys coffee."] }),
          opt('report', '오늘 건은 도현수 씨 이름으로 신고해요', "Report today's case under your name", {
            say: ['오늘 잡은 건 도현수 씨 이름으로 신고해요. 도현수 씨 눈이 잡은 거니까요.', "Report today's case under your name. It was your eye that caught it."],
            end: endTalk({ complete: 'your_report',
              lineKo: '…내 이름? 아직 검사원 아니야. 신고는 누구나 하는 거고.\n\n붙으면 이 건이 첫 줄이야. 네가 같이 봤다고 적을게. 그건 빼면 거짓말이니까.',
              lineEn: "...My name? I'm not an inspector yet. Anyone can report.\n\nIf I pass, this case is the first line. I'll write that you saw it with me. Leaving that out would be a lie." }),
            note: ['오늘 건은 도현수 씨 이름으로 신고하자고 했다. 그는 아직 검사원이 아니라면서도, 신고서 맨 위 칸에 우리 둘 이름을 나란히 적었다.', "I said he should report today's case under his name. He's not an inspector yet, Hyeonsu said — but he wrote both our names side by side at the top of the form."] }),
        ],
        note: ['덧붙인 라벨 한 건을 같이 확인했고, 내 물건 세 건도 원산지를 적어 올렸다. 도현수 씨는 검사원 눈이라고, 어촌계장 손자가 아니라고 했다. 그 말을 할 때 목소리가 조금 높았다.',
          "We confirmed the case of the stuck-on label together, and I put up my three lots with their origin written. An inspector's eye, Hyeonsu said — not the co-op chief's grandson's. His voice rose a little when he said it."],
      }),
      proud: scene([
        line(H, '…그 말 처음 들어. 할아버지한테도.', "...First time I've heard that. Not even from my grandfather."),
        act(H, 'silence'),
        line(H, '이거. 원서. 사진이 좀 굳었지.', "This. My application. The photo's a bit stiff, huh."),
        line(P, '조금요.', "A little."),
      ], {
        end: endTalk({ complete: 'proud',
          lineKo: '붙으면 제일 먼저 너한테 말할게. 떨어지면… 그때도 너한테 말할게.',
          lineEn: "If I pass, you'll be the first to know. If I fail... I'll tell you then too." }),
        note: ['검사원이 도현수 씨한테 맞는 것 같다고 했다. 그는 그 말을 처음 듣는다며, 할아버지한테도 못 들었다고 했다. 시험 원서를 보여 주며, 붙든 떨어지든 제일 먼저 나한테 말하겠다고 했다.',
          "I told him being an inspector suited him. He said it was the first time he'd heard that — not even from his grandfather. Showing me his application, he said he'd tell me first, pass or fail."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-7 「나란히 서서」 — 받는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_7_offer', questId: 'N18-7', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '의자 날라.', "Carry chairs."),
        line(P, '도현수 씨? 공동작업장 앞에 웬 의자가 이렇게…', "Hyeonsu? Why are there so many chairs in front of the workshop..."),
        line(H, '재개관식이잖아. 백 개.', "It's the reopening ceremony. A hundred of them."),
        line(P, '백 개요?', "A hundred?"),
        line(H, '비품도 세 개 만들어야 하고. 그건 네 몫이야.', "And three pieces of equipment need making. That part's yours."),
        line(P, '제 이름으로 여는 거니까요?', "Because it's opening under my name?"),
        line(H, '네 이름으로 여는 거 아니야.', "It's not opening under your name."),
        line(H, '우리 이름으로 여는 거지.', "It's opening under ours.", { act: 'look_away' }),
        line(P, '(…방금, 우리라고 했다.)', "(...He just said ours.)"),
      ], {
        choices: [
          opt('half', '백 개, 반씩 날라요. 우리 이름이니까요', "A hundred — half each. It's our name", {
            say: ['백 개요. 반씩 날라요. 우리 이름이니까요.', "A hundred, then. Half each. It's our name, after all."], next: 'half' }),
          opt('name', '우리 이름이요? 무슨 이름으로 여는데요?', "Our name? What name is it opening under?", { next: 'name' }),
          opt('we', '도현수 씨 입에서 우리라는 말이 다 나오네요', "Never thought I'd hear you say ours", { next: 'we' }),
          opt('time', '비품까지 만들려면, 오늘 다 될까요?', "With the equipment too, can we finish today?", {
            say: ['비품도 만들어야 하는데, 의자까지 오늘 다 될까요?', "We've got the equipment to make too — can we really get the chairs done today?"], next: 'time' }),
        ],
        note: ['재개관식 준비로 도현수 씨가 의자 백 개를 나르고 비품 세 개를 만들라고 했다. 내 이름으로 여는 거냐고 하자 우리 이름으로 여는 거라고, 처음으로 우리라고 했다.',
          "Preparing for the reopening ceremony, Do Hyeonsu told me to carry a hundred chairs and make three pieces of equipment. When I asked if it opened under my name, he said ours — the first time he'd ever said it."],
      }),
      half: scene([
        line(H, '…반씩. 그래.', "...Half each. Fine."),
        line(H, '숫자 생각하면 팔부터 빠져.', "Think about the number and your arms give out first."),
        line(P, '그럼 언제 세요?', "Then when do we count?"),
        line(H, '마지막 하나 놓고 나서. 그 전엔 그냥 날라.', "After the last one's down. Until then, just carry."),
      ], {
        end: endTalk({ accept: true, offer: 'half_each' }),
        note: ['우리 이름이니 반씩 나르자고 했다. 도현수 씨는 의자 두 개를 한 번에 들어 올리며, 숫자 생각하면 팔부터 빠진다고, 마지막 하나 놓고 나서 세자고 했다.',
          "I said we'd carry half each since it was our name. Lifting two chairs at once, Hyeonsu said thinking about the number wears your arms out first — we'd count after the last one."],
      }),
      name: scene([
        line(H, '…계 이름이지. 공동작업장이잖아. 다들 조금씩 냈어.', "...The co-op's name. It's a shared workshop. Everyone chipped in a little."),
        line(H, '네 이름만 걸리면 다들 구경꾼 돼.', "Hang just your name on it and everyone else becomes a spectator.", { act: 'look_away' }),
        line(P, '같이 낸 사람이 같이 여는 거군요.', "So the people who chipped in open it together."),
        line(H, '그게 우리야. …다른 뜻 없어.', "That's what ours means. ...Nothing else."),
      ], {
        end: endTalk({ accept: true, offer: 'whose_name' }),
        note: ['무슨 이름으로 여느냐고 물었다. 도현수 씨는 팔짱을 끼고, 다들 조금씩 낸 공동작업장이니 계 이름이라고 했다. 같이 낸 사람이 같이 여는 게 우리라고, 다른 뜻은 없다고.',
          "I asked what name it opened under. Arms folded, Hyeonsu said the co-op's — everyone chipped in for the workshop. The people who chipped in opening it together: that's ours. Nothing more, he said."],
      }),
      we: scene([
        line(H, '…말꼬리 잡지 마.', "...Don't nitpick my words.", { act: 'look_away' }),
        line(H, '백 개야. 그 말 할 힘 있으면 하나 더 들어.', "It's a hundred. If you've got the energy for that, carry another one."),
        line(P, '(의자 하나가 내 쪽으로 떠밀려 온다. 귀가 빨갛다.)', "(A chair gets shoved my way. His ears are red.)"),
        line(H, '재개관식 전에 다 놔야 해.', "They all have to be set out before the ceremony."),
      ], {
        end: endTalk({ accept: true, offer: 'said_we' }),
        note: ['도현수 씨 입에서 우리라는 말이 다 나온다고 했다. 그는 말꼬리 잡지 말라며 의자 하나를 내 쪽으로 떠밀었다. 귀가 빨갰다.',
          "I said I never thought I'd hear him say ours. Don't nitpick, he said, shoving a chair my way. His ears were red."],
      }),
      time: scene([
        line(H, '되게 해야지. 비품은 네가 만들고 의자는 같이.', "We make it happen. You make the equipment, we do the chairs together."),
        line(H, '손 빠른 사람이 둘이면 돼.', "Two people with quick hands is enough."),
        line(P, '모자라면요?', "And if we fall short?"),
        line(H, '문 여는 날 빈 의자는 있어도, 모자란 의자는 없어야 해. 그러니까 모자랄 일 없게 해.', "On opening day there can be empty chairs, but never too few. So don't let us fall short."),
      ], {
        end: endTalk({ accept: true, offer: 'enough_time' }),
        note: ['비품까지 오늘 다 될지 물었다. 도현수 씨는 세 줄 적힌 목록을 내밀며, 비품은 내가 만들고 의자는 같이 나르자고 했다. 문 여는 날 빈 의자는 있어도 모자란 의자는 없어야 한다고.',
          "I asked if we could finish everything today. Handing me a three-line list, Hyeonsu said I'd make the equipment and we'd carry chairs together. On opening day there can be empty chairs, but never too few."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N18-7 — 끝내는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'n18_7_done', questId: 'N18-7', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…백 개.', "...A hundred."),
        line(P, '마지막 의자, 방금 놨어요. 비품도 세 개 다 들여놨고요.', "I just set down the last chair. And all three pieces of equipment are in."),
        line(H, '앉아 봐.', "Sit."),
        line(P, '지금요?', "Now?"),
        line(H, '우리가 날랐잖아.', "We carried them, didn't we."),
        act(H, 'silence'),
        line(P, '(나란히 앉았다. 의자가 생각보다 편했다.)', "(We sat side by side. The chair was more comfortable than I expected.)"),
      ], {
        choices: [
          opt('we', '우리. 그 말이 의자 백 개보다 무거웠어요', "Ours. That word weighed more than a hundred chairs", {
            say: ['우리. 그 말이 의자 백 개보다 무거웠어요.', "Ours. That word weighed more than a hundred chairs."], next: 'we' }),
          opt('lesson', '의자 나르는 것도 요령이 있더라고요', "There's a knack to carrying chairs, too", {
            say: ['의자 나르는 것도 요령이 있더라고요. 도현수 씨가 빨랐어요.', "Even carrying chairs takes a knack. You were faster."],
            end: endTalk({ complete: 'lesson',
              lineKo: '두 개씩. 허리 말고 다리. 할머니가 가르쳐 준 거야.\n\n무거운 건 몸에 붙여서 들어. 팔 뻗고 들면 반도 못 가. 짐은 드는 게 아니라 껴안는 거야.',
              lineEn: "Two at a time. Legs, not back. My grandmother taught me that.\n\nHold heavy things close to your body. Lift with your arms out and you won't get halfway. You don't lift a load, you hug it." }),
            note: ['의자 나르는 요령을 물었다. 도현수 씨는 두 개씩, 허리 말고 다리로 들라고, 할머니가 가르쳐 준 거라고 했다. 짐은 드는 게 아니라 껴안는 거라고.', "I asked his knack for carrying chairs. Two at a time, legs not back, Hyeonsu said — his grandmother taught him. You don't lift a load, you hug it."] }),
          opt('compete', '다음 대결은 재개관 대회예요. 심판은 남궁현 씨', "Our next contest is the reopening tournament. Namgung Hyeon judges", {
            say: ['다음 대결은 재개관 대회예요. 심판은 남궁현 씨로 하고요.', "Our next contest is the reopening tournament. With Namgung Hyeon as judge."],
            end: endTalk({ complete: 'compete',
              lineKo: '…좋아. 마지막 대결.\n\n심판이 누구든 상관없어. 이번엔 핑계 없이 하자. 지면 깨끗하게 지고.',
              lineEn: "...Fine. The last contest.\n\nI don't care who judges. No excuses this time. Whoever loses, loses clean." }),
            note: ['다음 대결은 재개관 대회라고 하자, 도현수 씨는 처음 만난 날처럼, 그러나 다르게 웃었다. 이번엔 핑계 없이 하자고 했다.', "When I said our next contest would be the reopening tournament, Hyeonsu smiled the way he had the day we met — but differently. No excuses this time, he said."] }),
          opt('wage', '의자 나른 품삯은 계에서 나오죠?', "The co-op pays wages for the chairs, right?", { next: 'wage' }),
        ],
        note: ['마지막 의자를 놓았다. 도현수 씨가 앉아 보라고, 우리가 날랐다고 했다. 둘이 나란히 앉았다.',
          "I set down the last chair. Hyeonsu told me to sit — we carried them, after all. We sat side by side."],
      }),
      we: scene([
        line(H, '…시끄러워.', "...Shut up."),
        act(H, 'silence'),
        line(H, '방파제에서 혀 찼던 거, 사과는 안 해.', "That time I clicked my tongue at you on the breakwater — I'm not apologizing.", { act: 'look_sea' }),
      ], {
        end: endTalk({ complete: 'we',
          lineKo: '그땐 그게 맞았어. 지금은 아니지만.',
          lineEn: "Back then it was right. Not anymore, though." }),
        note: ['우리라는 말이 의자 백 개보다 무거웠다고 했다. 도현수 씨는 시끄럽다고 하고는 한참 앉아 있다가, 방파제에서 혀 찼던 건 사과 안 한다고 했다. 그땐 맞았고, 지금은 아니라고.',
          "I said the word ours had weighed more than a hundred chairs. Shut up, Hyeonsu said, then sat a long while before saying he wouldn't apologize for clicking his tongue at me on the breakwater. Back then it was right. Not anymore."],
      }),
      wage: scene([
        line(H, '…이 와중에 품삯?', "...Wages, at a time like this?"),
        act(H, 'laugh'),
        line(H, '나와. 계에서. 일당 기준으로.', "It's paid. By the co-op. At the day rate."),
        act(H, 'give', { to: P }),
      ], {
        end: endTalk({ complete: 'daily_wage',
          lineKo: '받아. 받을 건 받아야 다음에도 사람이 모여. 공짜로 모인 사람은 한 번 오고 말아.',
          lineEn: "Take it. People only gather again if they get what's owed. People who come for free come once and that's it." }),
        note: ['의자 나른 품삯을 물었다. 도현수 씨는 어이없다는 듯 웃으면서도 계에서 일당으로 나온다며 건넸다. 받을 건 받아야 다음에도 사람이 모인다고.', "I asked about wages for the chairs. Hyeonsu laughed in disbelief but handed over the co-op's day rate — people only gather again if they get what's owed."],
      }),
    },
  },
];
