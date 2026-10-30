/**
 * @file StoryTalkN11.ts
 * @description 290차 — 이야기 「채금자·채파도 — 지세포 「동백마루」」(N11-1~4) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 끝은 옛 받는 답(`end.offer`) · 보상 답(`end.complete`)에 묶는다.
 *
 * 인물: 채금자(29 · 동백마루 선장 · 조타는 일류 · 요리는 아예 못 한다 · 무표정한 존댓말 「~요」 · 배 얘기엔 단단하다 · 주인공을 「그쪽」) ·
 *   채파도(23 · 덜렁이 신입 · 들뜨고 말이 빠르다 · 채금자를 「선장님」 · 주인공을 「{player} 씨」 — 옛 말의 「형」은 쓰지 않는다).
 * 주인공은 「채금자 씨」 · 「파도 씨」로 부르고(선장님 없이), 파도에게도 존댓말이다(옛 답의 반말을 해요체로).
 * 표시(옛 답에서 그대로): choice.n11_1_asked_cooking · choice.n11_2_asked_lot · choice.n11_2_asked_skipper · choice.n11_3_asked_how ·
 *   choice.n11_refuse_learned · choice.n11_4_asked_skipper · choice.n11_4_back_turned.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const C = 'chae_geumja';
const D = 'chae_pado';
const P = 'player';

export const TALKS_N11: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N11-1 「요리 못 하는 선장」 — 받는 자리(채금자)
  // ═══════════════════════════════════════════
  {
    id: 'n11_1_offer', questId: 'N11-1', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '그쪽, 칼 좀 쓸 줄 알아요?', "You there — can you handle a knife?", { act: 'look_up' }),
        line(P, '칼이요? 생선 손질 정도는요.', "A knife? Enough to dress fish."),
        line(C, '잘됐다. 선상식 좀 만들어 줘요.', "Perfect. Make the meal on board for me."),
        line(P, '선상식이요? 채금자 씨 배에서요?', "The meal on board? On your boat?"),
        line(C, '네, 동백마루요. 저는 못 해요.', "Yes, the Dongbaekmaru. I can't do it."),
        line(P, '…못 하신다고요?', "...You can't?"),
        line(C, '아예 못 해요. 대신 항로 판단 가르쳐 줄게요. 그건 잘해요.', "Not at all. In return I'll teach you how to judge a route. That I'm good at."),
        line(C, '재료는 광어 한 마리면 돼요. 그쪽이 낚아 와요.', "One flounder will do for the ingredients. You catch it."),
      ], {
        choices: [
          opt('deal', '좋아요. 밥은 제가, 항로는 채금자 씨가', "Deal. I cook, you teach routes", {
            say: ['좋습니다. 밥은 제가, 항로는 채금자 씨가. 거래죠.', "All right. The cooking's mine, the routes are yours. It's a deal."],
            next: 'deal' }),
          opt('cooking', '아예 못 하신다는 게, 라면도요?', "Not at all — not even instant noodles?", {
            say: ['요리를 아예 못 하신다는 게… 라면도요?', "When you say you can't cook at all... not even instant noodles?"],
            next: 'cooking' }),
          opt('modest', '제 요리도 그렇게 대단하진 않은데요', "My cooking isn't all that great either", {
            say: ['제 요리도 그렇게 대단하진 않습니다만…', "My cooking isn't anything special, though..."],
            next: 'modest' }),
        ],
        note: ['지세포 동백마루의 채금자 씨가 선상식을 대신 만들어 달라고 했다. 자기는 요리를 아예 못 한다고, 대신 항로 판단을 가르쳐 주겠다고 했다. 재료는 내가 낚아 올 광어 한 마리.',
          "Geum-ja of the Dongbaekmaru in Jisepo asked me to make the meal on board. She can't cook at all, she said, but she'd teach me to judge a route in return. The ingredient: one flounder I'd catch myself."],
      }),
      deal: scene([
        line(C, '거래 좋아요. 깔끔하네요.', "A deal. I like it. Clean."),
        line(P, '(키 옆 계기판을 손바닥으로 한 번 쓸어낸다.)', "(She sweeps her palm once across the gauges beside the wheel.)"),
        line(C, '광어 한 마리면 배 위 사람 다 먹어요. 수업은 밥 먹고 나서, 키 앞에서 해요.', "One flounder feeds everyone on board. The lesson comes after we eat, at the wheel."),
        line(C, '배가 부르면 조류가 잘 보이거든요. 그건 진짜예요.', "On a full stomach you read the current better. That's true."),
      ], {
        choices: [
          opt('ok', '그럼 광어부터 낚아 올게요', "Then I'll go catch the flounder", {
            say: ['그럼 광어부터 낚아 오겠습니다.', "Then I'll go and catch the flounder first."],
            end: endTalk({ accept: true, offer: 'deal' }),
            note: ['밥은 내가, 항로는 채금자 씨가 맡는 거래를 했다. 채금자 씨는 깔끔하다며, 수업은 밥 먹고 키 앞에서 하자고 했다. 배가 부르면 조류가 잘 보인다고.', "We made a deal: I'd cook and Geum-ja would teach routes. She called it clean — the lesson would come after the meal, at the wheel. A full stomach reads the current better."] }),
          opt('joke', '수업이 별로면, 밥도 별로가 되는 거예요?', "And if the lesson's bad, so is the food?", {
            say: ['그럼 수업이 별로면, 밥도 별로가 되는 겁니다?', "So if the lesson's no good, the food might not be either?"],
            next: 'joke' }),
        ],
        note: ['채금자 씨는 거래가 깔끔하다며, 광어 한 마리면 배 위 사람이 다 먹는다고 했다.', "Geum-ja liked the clean deal. One flounder, she said, would feed everyone aboard."],
      }),
      joke: scene([
        line(C, '협박이네요. 좋아요, 그 정도 배짱은 있어야 선원이죠.', "That's a threat. Good — a crew member needs that much nerve."),
        line(P, '(키를 한 바퀴 돌렸다가 제자리로 놓는다.)', "(She spins the wheel once and sets it back.)"),
        line(C, '걱정 마요. 수업은 안 별로예요. 낚시는 서툴러도 배는 안 서툴러요.', "Don't worry. The lesson won't be bad. I may be clumsy at fishing, but not with boats."),
        line(C, '밥이나 맛있게 해요. 그럼 수업이 두 배로 길어질 거예요.', "Just make the food good. Then the lesson will run twice as long."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_lesson' }),
        note: ['수업이 별로면 밥도 별로가 되겠다고 농담을 했다. 채금자 씨는 협박이라며, 그 정도 배짱은 있어야 선원이라고 했다. 밥이 맛있으면 수업이 두 배로 길어진다고.',
          "I joked that a bad lesson might mean bad food. Geum-ja called it a threat — a crew member needs that much nerve. Good food would make the lesson twice as long."],
      }),
      cooking: scene([
        line(C, '라면은… 물 맞추는 게 어려워요.', "Instant noodles... getting the water right is hard."),
        line(C, '바다에선 물때를 맞추는데, 냄비에선 못 맞춰요.', "At sea I can time the tides, but in a pot I can't."),
        line(P, '(진지한 얼굴이라 더 웃기다.)', "(Her face is so serious it's even funnier.)"),
        line(C, '배 위에서 불 쓰는 것도 좀 겁나요. 흔들리잖아요.', "Using fire on a boat scares me a bit too. It rocks."),
        line(C, '그래서 잘하는 사람한테 맡겨요. 그게 배 위 규칙이에요.', "So I leave it to someone who's good at it. That's the rule on a boat."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_cooking' }),
        note: ['라면도 못 하느냐고 물었다. 채금자 씨는 바다에선 물때를 맞추는데 냄비에선 물을 못 맞춘다고 진지하게 말했다. 잘하는 사람에게 맡기는 게 배 위 규칙이라고.',
          "I asked if she couldn't even make instant noodles. Geum-ja said, quite seriously, that she can time the tides at sea but not the water in a pot. Leaving things to whoever does them well is the rule on a boat."],
      }),
      modest: scene([
        line(C, '제 요리보다 나으면 대단한 거예요. 여긴 기준이 낮아요.', "If it's better than mine, it's great. The bar is low here."),
        line(P, '(웃지도 않고 말한다.)', "(She says it without the hint of a smile.)"),
        line(C, '회 떠서 초장만 있어도 돼요. 뜨끈한 국 하나 있으면 더 좋고요.', "Sashimi with some chogochujang is fine. A hot soup would be even better."),
        line(C, '배 위에서는 맛보다 따뜻한 게 먼저예요. 사람이 버텨야 배가 버텨요.', "On a boat, warm comes before tasty. The people have to hold up for the boat to hold up."),
      ], {
        end: endTalk({ accept: true, offer: 'modest_cook' }),
        note: ['내 요리도 대단하지 않다고 했다. 채금자 씨는 자기 요리보다 나으면 대단한 거라고, 배 위에서는 맛보다 따뜻한 게 먼저라고 했다. 사람이 버텨야 배가 버틴다고.',
          "I said my cooking was nothing special. Geum-ja said anything better than hers counts as great — on a boat, warm comes before tasty. People have to hold up for the boat to hold up."],
      }),
    },
  },
  // N11-1 — 끝내는 자리(채금자)
  {
    id: 'n11_1_done', questId: 'N11-1', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '맛있네요.', "This is good."),
        line(P, '광어 한 마리로 회 뜨고, 남은 걸로 국 끓였어요.', "I made sashimi from the flounder and soup from what was left."),
        line(C, '배 위에서 뜨끈한 거 먹은 거, 오랜만이에요.', "It's been ages since I had something hot on board."),
        line(C, '수업은… 들었죠?', "And the lesson... you got it?"),
        line(P, '네. 키 앞에서 말씀하실 땐 다른 분 같았어요.', "Yes. At the wheel you seemed like a different person."),
        line(C, '물부터 읽는 거예요. 바람은 나중이고요.', "You read the water first. The wind is for later."),
      ], {
        choices: [
          opt('lesson', '항로 판단, 더 배우고 싶어요. 요리는 계속 제가 할게요', "I want to learn more. I'll keep cooking", {
            say: ['항로 판단, 더 배우고 싶습니다. 요리는 계속 제가 하겠습니다.', "I'd like to learn more about judging routes. I'll keep doing the cooking."],
            end: endTalk({ complete: 'lesson',
              lineKo: '거래 성립.\n\n다음엔 연료예요. 갈 때 삼분의 일, 올 때 삼분의 일, 나머지는 바다 몫. 바다 몫은 절대 안 써요. 그걸 쓰는 날이 사고 나는 날이에요.',
              lineEn: "Deal.\n\nNext is fuel. A third to go out, a third to come back, the rest belongs to the sea. You never touch the sea's share. The day you do is the day there's an accident." }),
            note: ['항로 판단을 더 배우고 요리는 계속 내가 하겠다고 했다. 채금자 씨는 거래 성립이라며 다음은 연료라고 했다. 갈 때 삼분의 일, 올 때 삼분의 일, 나머지는 바다 몫.', "I offered to keep cooking if she kept teaching routes. Geum-ja agreed — next would be fuel: a third out, a third back, and the rest belongs to the sea."] }),
          opt('pay', '선상식 값은 받을게요', "I'll take payment for the meal", {
            say: ['선상식 값은 받겠습니다.', "I'll take payment for the meal on board."],
            next: 'pay' }),
          opt('decline', '수업 들었으니 됐어요', "The lesson was payment enough", {
            say: ['수업 들었으니 됐습니다.', "I got the lesson. That's enough."],
            end: endTalk({ complete: 'decline',
              lineKo: '…그렇게 말하면 다음에도 시켜야겠네요.\n\n농담 아니에요. 지세포에 밥 하는 선원 귀해요. 다들 낚시하러 왔지 밥하러 온 건 아니라서. 그쪽 이름, 선장들한테 벌써 말해 놨어요.',
              lineEn: "...Say that and I'll have to ask you again next time.\n\nI'm not joking. A crew member who cooks is rare in Jisepo. Everyone comes to fish, not to cook. I've already told the other captains your name." }),
            note: ['수업 들었으니 됐다고 했다. 채금자 씨는 지세포에 밥 하는 선원이 귀하다며, 내 이름을 벌써 다른 선장들에게 말해 놨다고 했다.', "I said the lesson was enough. Geum-ja said a crew member who cooks is rare in Jisepo — she'd already told the other captains my name."] }),
          opt('knife', '흔들리는 배에서 칼 쓰는 게 제일 어려웠어요', "Using a knife on a rocking boat was hardest", {
            say: ['흔들리는 배에서 칼 쓰는 게 제일 어려웠습니다.', "The hardest part was using a knife on a rocking boat."],
            next: 'knife' }),
        ],
        note: ['광어 한 마리로 선상식을 차렸다. 채금자 씨는 오랜만에 배 위에서 뜨끈한 걸 먹었다고 했다. 키 앞에서 항로를 말할 때의 채금자 씨는 요리 못 하는 선장이 아니라 그냥 선장이었다.',
          "I made the meal on board from one flounder. Geum-ja said it had been ages since she'd eaten something hot at sea. At the wheel, talking routes, she wasn't a captain who can't cook — just a captain."],
      }),
      pay: scene([
        line(C, '맞아요. 선상식은 유료죠.', "Right. Meals on board aren't free."),
        act(C, 'give', { to: P }),
        line(C, '공짜 밥은 다음에 대충 하게 돼요. 돈 받은 밥은 다음에도 맛있어야 하고요.', "A free meal gets sloppy next time. A paid one has to be good next time too."),
        line(P, '그럼 다음에도 잘해야겠네요.', "Then I'd better do well next time too.", { act: 'receive' }),
        line(C, '그러니까 받아요. 저도 또 시킬 거니까.', "So take it. I'll be asking again."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['선상식 값을 받겠다고 했다. 채금자 씨는 두꺼운 지갑에서 값을 치르며, 돈 받은 밥은 다음에도 맛있어야 한다고, 또 시킬 거라고 했다.',
          "I said I'd take payment for the meal. Geum-ja paid from a thick wallet: a paid meal has to be good next time too — and she'd be asking again."],
      }),
      knife: scene([
        line(C, '그건 제가 알아요. 요리는 몰라도 배는 알거든요.', "That I know about. I don't know cooking, but I know boats."),
        line(P, '(조리대로 와서 내 발 위치를 고쳐 준다.)', "(She comes over to the counter and corrects where my feet are.)"),
        line(C, '파도 오는 쪽에 등을 대고, 무릎은 조금 굽혀요. 도마 밑엔 젖은 행주를 깔고요.', "Put your back to where the waves come from and bend your knees a little. And lay a wet cloth under the board."),
        line(C, '칼은 배가 내려갈 때 넣어요.', "Bring the knife down when the boat goes down."),
      ], {
        end: endTalk({ complete: 'deck_knife' }),
        note: ['흔들리는 배에서 칼 쓰는 게 제일 어려웠다고 했다. 채금자 씨는 배는 안다며 내 발 위치를 고쳐 주었다. 파도 쪽에 등을 대고 무릎을 굽히고, 칼은 배가 내려갈 때 넣으라고.',
          "I said using a knife on a rocking boat was hardest. Geum-ja said boats she knew, and fixed my footing: back to the waves, knees bent, and bring the knife down as the boat drops."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N11-2 「파도의 첫 월급」 — 받는 자리(채파도)
  // ═══════════════════════════════════════════
  {
    id: 'n11_2_offer', questId: 'N11-2', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '{player} 씨… 큰일 났어요.', "{player}... I'm in big trouble.", { act: 'look_away' }),
        line(P, '파도 씨? 무슨 일이에요?', "Pa-do? What's wrong?"),
        line(D, '제가 물량 날렸어요.', "I blew the lot."),
        line(P, '물량을요?', "The lot?"),
        line(D, '경매에 낼 거요. 그래서… 새벽에 통발 두 번만 같이 걷어 줘요.', "The one for the auction. So... please help me haul the traps twice at dawn."),
        line(P, '채금자 씨는 알아요?', "Does Geum-ja know?"),
        line(D, '선장님은 아직 몰라요. …아니, 알 거예요.', "The captain doesn't know yet. ...No. She probably knows."),
        line(P, '(눈가가 벌겋다. 울었던 모양이다.)', "(Pa-do's eyes are red-rimmed. There's been crying.)"),
      ], {
        choices: [
          opt('dawn', '울지 말고, 통발 위치부터 말해 줘요', "Don't cry. Tell me where the traps are", {
            say: ['울지 말고, 통발 위치부터 말해 줘요. 새벽에 같이 가요.', "Don't cry. Tell me where the traps are first. We'll go at dawn."],
            next: 'dawn' }),
          opt('lot', '물량을 날렸다는 게 무슨 말이에요?', "What do you mean, blew the lot?", {
            say: ['물량을 날렸다는 게 무슨 말이에요? 고기를 놓쳤어요?', "What do you mean, you blew the lot? You lost the fish?"],
            next: 'lot' }),
          opt('skipper', '채금자 씨가 알 거라는 건요?', "Why would Geum-ja know?", {
            say: ['채금자 씨가 알 거라는 건 또 무슨 말이에요?', "And what do you mean, Geum-ja probably knows?"],
            next: 'skipper' }),
        ],
        note: ['채파도 씨가 경매에 낼 물량을 날렸다며, 새벽에 통발 두 번만 같이 걷어 달라고 했다. 채금자 씨는 아직 모른다고 했다가, 알 거라고 고쳐 말했다. 눈가가 벌겠다.',
          "Pa-do told me the auction lot was lost and asked me to help haul the traps twice at dawn. Geum-ja didn't know yet — no, she probably did. Pa-do's eyes were red."],
      }),
      dawn: scene([
        line(D, '안 울어요!', "I'm not crying!"),
        act(D, 'silence'),
        line(D, '…조금 울었어요.', "...I cried a little."),
        line(P, '(소매로 코를 훔치고 해도를 펼친다.)', "(Pa-do drags a sleeve across a runny nose and spreads out the chart.)"),
        line(D, '방파제 끝에서 두 줄이요. 두 번만 걷으면 물량 맞아요.', "Two lines off the end of the breakwater. Two hauls and the lot's made up."),
        line(D, '진짜 고마워요. 이번엔 안 잊을게요. 알람 세 개 맞춰 놨어요.', "Thank you, really. I won't forget this time. I've set three alarms."),
      ], {
        end: endTalk({ accept: true, offer: 'dawn_go' }),
        note: ['울지 말고 통발 위치부터 말하라고 했다. 파도 씨는 안 운다고 했다가 조금 울었다고 했다. 방파제 끝 두 줄, 두 번만 걷으면 물량이 맞는다고. 알람을 세 개 맞춰 놨다고 했다.',
          "I told Pa-do to stop crying and show me the traps. Pa-do insisted there was no crying, then admitted to a little. Two lines off the breakwater, two hauls would do it — and three alarms were set."],
      }),
      lot: scene([
        line(D, '고기는 있었어요. 배송을 잊었어요.', "The fish were there. I forgot to ship them."),
        line(D, '경매에 낼 상자를 냉장고에 넣어 두고는… 그냥 잊었어요.', "I put the auction boxes in the fridge and then... just forgot."),
        line(P, '경매 시간은…', "And the auction time..."),
        line(D, '정해져 있잖아요. 그 시간 지나면 그 물량은 없는 거예요. 중매인분들이 기다렸대요.', "It's fixed. Once it passes, that lot doesn't exist. The brokers were waiting, they said."),
        line(D, '그래서 새벽에 새로 걷어서 채워야 해요.', "So I have to haul fresh at dawn and make it up."),
      ], {
        choices: [
          opt('help', '알겠어요. 새벽에 같이 걷어요', "All right. We'll haul at dawn", {
            say: ['알겠어요. 새벽에 같이 걷어요.', "All right. We'll haul them together at dawn."],
            end: endTalk({ accept: true, offer: 'ask_lot' }),
            note: ['물량을 날렸다는 게 무슨 말이냐고 물었다. 고기는 있었는데 경매에 낼 상자를 냉장고에 넣어 두고 잊었다고 했다. 시간이 지나면 그 물량은 없는 거라, 새벽에 새로 걷어 채우기로 했다.', "I asked what losing the lot meant. The fish were there, but Pa-do left the auction boxes in the fridge and forgot. Once the time passes the lot is gone, so we'd haul fresh at dawn to make it up."] }),
          opt('scold', '또 덜렁댔네요. 이번이 마지막이에요', "Scatterbrained again. This is the last time", {
            say: ['또 덜렁댔네요. 이번이 마지막이에요.', "Scatterbrained again. This is the last time."],
            aff: { [D]: -0.02 }, next: 'scold' }),
        ],
        note: ['파도 씨는 경매에 낼 상자를 냉장고에 넣어 두고 배송을 잊었다고 했다. 머리를 감싸 쥐었다.', "Pa-do had put the auction boxes in the fridge and forgotten to ship them — head clutched in both hands."],
      }),
      scold: scene([
        line(D, '네… 마지막이에요. 진짜로요.', "Yes... it's the last time. Really."),
        line(D, '혼나도 싸요. 근데 혼내면서도 같이 가 주는 거죠?', "I deserve the scolding. But you're still coming with me, right? Even while you scold me?", { act: 'look_up' }),
        line(P, '(대답을 기다리는 눈이 동그랗다.)', "(The eyes waiting for my answer are round.)"),
        line(D, '새벽에 봬요. 제가 먼저 나와 있을게요. 진짜 먼저요.', "See you at dawn. I'll be out there first. Really first."),
      ], {
        end: endTalk({ accept: true, offer: 'scold' }),
        note: ['또 덜렁댔다고, 이번이 마지막이라고 했다. 파도 씨는 혼나도 싸다며 고개를 숙였다가, 그래도 같이 가 주는 거냐고 동그란 눈으로 물었다. 새벽에 먼저 나와 있겠다고 했다.',
          "I told Pa-do this was the last time. Pa-do hung their head — the scolding was deserved — then asked with round eyes whether I'd still come. Pa-do would be out first at dawn."],
      }),
      skipper: scene([
        line(D, '선장님은 다 알아요. 말을 안 할 뿐이에요.', "The captain knows everything. She just doesn't say it."),
        line(D, '아침에 제 얼굴만 봐도 알아요.', "She can tell from my face in the morning.", { act: 'look_away' }),
        line(P, '(부두 쪽 조타실에 불이 켜져 있다.)', "(The light is on in the wheelhouse down by the pier.)"),
        line(D, '그래서 더 무서워요. 혼나면 차라리 나은데, 선장님은 안 혼내요. 그냥 봐요.', "That's what's scarier. Being told off would be better, but the captain doesn't. She just looks."),
        line(D, '그러니까 날 밝기 전에 끝내야 해요.', "So we have to finish before daylight."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_skipper' }),
        note: ['채금자 씨가 알 거라는 게 무슨 말이냐고 물었다. 파도 씨는 선장님은 얼굴만 봐도 다 안다고, 혼내지 않고 그냥 보는 게 더 무섭다고 했다. 날 밝기 전에 끝내야 한다고.',
          "I asked why Geum-ja would know. Pa-do said the captain knows everything from one look — she doesn't scold, she just looks, which is scarier. We had to finish before daylight."],
      }),
    },
  },
  // N11-2 — 끝내는 자리(채파도)
  {
    id: 'n11_2_done', questId: 'N11-2', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '메웠어요… 물량 맞아요!', "We made it up... the lot's complete!"),
        line(P, '두 번 걷으니까 딱 맞네요.', "Two hauls and it's exactly right."),
        line(D, '배 위에서 계속 미안하다고만 해서… 미안해요.', "I kept saying sorry the whole time on the boat... sorry."),
        line(P, '(채금자 씨는 그동안 아무 말도 하지 않았다.)', "(Geum-ja hadn't said a word the whole time.)"),
        line(D, '저기, 이거요. 드라이백이요.', "Um, here. A dry bag."),
        line(D, '첫 월급으로 산 거예요. 제가 쓰려던 건데… {player} 씨가 써요.', "I bought it with my first pay. I meant to use it myself... but you use it, {player}."),
      ], {
        choices: [
          opt('take', '고마워요. 잘 쓸게요', "Thank you. I'll put it to good use", {
            say: ['고마워요. 잘 쓸게요.', "Thank you. I'll take good care of it."],
            end: endTalk({ complete: 'take',
              lineKo: '네!\n\n이름은… 지우지 마요. 제가 처음 산 거니까요. 물 안 들어가요. 휴대폰이랑 지갑, 거기 넣어요. 맨날 젖잖아요.',
              lineEn: "Yes!\n\nDon't... rub out the name. It's the first thing I ever bought. It's waterproof. Put your phone and wallet in it. You're always getting soaked." }),
            note: ['드라이백을 고맙게 받았다. 매직으로 파도 씨 이름이 적혀 있었다. 처음 산 거니 이름은 지우지 말라고, 맨날 젖으니 휴대폰이랑 지갑을 넣으라고 했다.', "I accepted the dry bag with thanks. Pa-do's name was written on it in marker — don't rub it out, it's the first thing bought with that pay, and put my phone and wallet in it since I'm always soaked."] }),
          opt('lesson', '통발 거두는 속도, 파도 씨가 저보다 빠르던데요', "You haul traps faster than I do", {
            say: ['통발 거두는 속도, 파도 씨가 저보다 빠르던데요. 요령 좀 가르쳐 줘요.', "You hauled the traps faster than me. Teach me the trick."],
            end: endTalk({ complete: 'lesson',
              lineKo: '저요? 손목이에요, 손목!\n\n팔로 당기면 금방 지쳐요. 줄은 뱃전에 걸고 손목으로 감아 올려요. 선장님이 그랬어요. 통발은 힘이 아니라 박자래요. 하나, 둘, 하나, 둘.',
              lineEn: "Me? It's the wrist, the wrist!\n\nPull with your arms and you tire fast. Hook the line over the gunwale and wind it up with your wrists. The captain told me — traps aren't about strength, they're about rhythm. One, two, one, two." }),
            note: ['통발 거두는 요령을 물었다. 파도 씨는 손목이라며, 줄은 뱃전에 걸고 손목으로 감아 올리라고 했다. 통발은 힘이 아니라 박자라고, 선장님 말이라고 했다.', "I asked Pa-do's trick for hauling traps. It's the wrist — hook the line on the gunwale and wind with the wrists. Traps are rhythm, not strength: the captain's words."] }),
          opt('pay', '새벽 조업 품삯은 받아야겠어요', "I'll need pay for the dawn haul", {
            say: ['새벽 조업 품삯은 받아야겠어요.', "I'll need to be paid for the dawn work."],
            next: 'pay' }),
          opt('tell_first', '품삯은 됐어요. 대신 채금자 씨께 먼저 말씀드려요', "Forget pay. But tell Geum-ja yourself first", {
            say: ['품삯은 됐어요. 대신 채금자 씨께는 파도 씨가 먼저 말씀드려요.', "Forget the pay. But you tell Geum-ja about it first, yourself."],
            next: 'tell_first' }),
        ],
        note: ['새벽에 통발 두 번을 걷어 물량을 메웠다. 파도 씨는 배 위에서 내내 미안하다고 했고, 채금자 씨는 아무 말도 하지 않았다. 물량이 맞자 파도 씨가 첫 월급으로 산 드라이백을 내밀었다.',
          "We hauled the traps twice at dawn and made up the lot. Pa-do apologised the whole way; Geum-ja said nothing. When the count was right, Pa-do held out a dry bag bought with that first pay."],
      }),
      pay: scene([
        line(D, '아… 네. 맞아요.', "Ah... yes. That's fair."),
        act(D, 'give', { to: P }),
        line(D, '새벽에 자다 나온 거잖아요. 시간도 돈이죠.', "You got up in the middle of the night. Time is money too."),
        line(P, '…', '...', { act: 'receive' }),
        line(D, '괜찮아요. 다음 달에 또 받아요, 월급. 그땐 안 날릴 거예요.', "It's fine. I get paid again next month. I won't blow it then."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['새벽 조업 품삯을 받겠다고 했다. 파도 씨는 미안한 얼굴로 첫 월급 나머지를 내밀었다. 다음 달에 또 받는다고, 그땐 안 날릴 거라고 했다.',
          "I said I'd take pay for the dawn work. Looking sorry, Pa-do handed over the rest of that first pay — there'd be more next month, and that one wouldn't get blown."],
      }),
      tell_first: scene([
        line(D, '…제가요? 먼저요?', "...Me? First?", { act: 'look_up' }),
        line(P, '(드라이백 끈을 만지작거린다.)', "(Pa-do fiddles with the strap of the dry bag.)"),
        line(D, '…네. 그게 맞아요. 숨기면 또 잊을 거예요.', "...Yes. That's right. If I hide it, I'll just forget again."),
        line(D, '지금 갈게요. 여기 있어요. 아니, 있어 줘요.', "I'll go now. Stay here. No — please stay."),
      ], {
        end: endTalk({ complete: 'tell_first' }),
        note: ['품삯은 됐으니 채금자 씨께 파도 씨가 먼저 말하라고 했다. 파도 씨는 숨기면 또 잊을 거라며 지금 가겠다고, 여기 있어 달라고 했다. 채금자 씨는 끝까지 듣고 고개를 한 번 끄덕였다.',
          "I waived the pay and told Pa-do to tell Geum-ja first. Hiding it would only mean forgetting again, Pa-do said — and went, asking me to stay. Geum-ja heard it all out and nodded once."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N11-3 「태풍 전야」 — 받는 자리(채금자)
  // ═══════════════════════════════════════════
  {
    id: 'n11_3_offer', questId: 'N11-3', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '저기 손님 보여요? 출항하자고 조르는 사람.', "See that customer? The one pestering us to sail.", { act: 'look_away' }),
        line(P, '오늘요? 태풍 온다고 하지 않았어요?', "Today? Isn't there a typhoon coming?"),
        line(C, '그러니까요. 태풍 전야에.', "Exactly. On the eve of a typhoon."),
        line(P, '거절하시면 되잖아요.', "Can't you just turn them down?"),
        line(C, '거절할 거예요. 두 배 준다고 해도요.', "I will. Even if they pay double."),
        line(C, '그쪽도 거절하는 법을 배워요. 언젠가 그쪽 배 앞에도 저런 손님이 와요.', "You learn how to refuse too. Someday a customer like that will come to your boat."),
        line(P, '거절하는 법이요…', "How to refuse..."),
        line(C, '그 전에 배부터 묶어요. 태풍 대비 결속 자재 두 개, 만들어 와요.', "Before that, tie the boats down. Make two typhoon lashings and bring them."),
      ], {
        choices: [
          opt('learn', '배울게요. 바다 앞에서 돈 얘기는 안 들을게요', "I'll learn. No money talk in front of the sea", {
            say: ['배우겠습니다. 바다 앞에서 돈 얘기는 안 듣겠습니다.', "I'll learn. When the sea's involved, I won't listen to talk of money."],
            next: 'learn' }),
          opt('how', '거절에도 법이 있어요? 그냥 안 된다고 하면 되잖아요', "Is there a method? Can't I just say no?", {
            say: ['거절에도 법이 있습니까? 그냥 안 된다고 하면 되지 않습니까.', "Is there really a method to refusing? Can't you just say no?"],
            next: 'how' }),
          opt('sky', '태풍이 정말 와요? 하늘은 멀쩡한데요', "Is a typhoon really coming? The sky looks fine", {
            say: ['태풍이 정말 옵니까? 하늘은 아직 멀쩡한데요.', "Is a typhoon really coming? The sky still looks fine."],
            next: 'sky' }),
        ],
        note: ['태풍 전야, 채금자 씨는 출항을 조르는 손님을 두 배를 준다 해도 거절하겠다고 했다. 나도 거절하는 법을 배우라고, 그 전에 태풍 대비 결속 자재 두 개를 만들어 배부터 묶으라고 했다.',
          "On the eve of the typhoon, Geum-ja said she'd refuse the customer pushing to sail, even at double the fare. I should learn to refuse too — but first, make two typhoon lashings and tie down the boats."],
      }),
      learn: scene([
        line(C, '말은 쉬워요. 손님이 지폐를 세기 시작하면 어려워져요.', "Saying it is easy. It gets hard once the customer starts counting out notes.", { act: 'look_up' }),
        line(P, '(창밖 구름이 낮고 빠르다.)', "(Outside, the clouds are low and fast.)"),
        line(C, '거절은 짧게 해요. 이유를 길게 대면 손님이 이유랑 싸워요.', "Keep refusals short. Give long reasons and the customer fights the reasons."),
      ], {
        choices: [
          opt('mind', '명심할게요', "I'll keep that in mind", {
            say: ['명심하겠습니다. 결속 자재부터 만들게요.', "I'll keep it in mind. I'll make the lashings first."],
            end: endTalk({ accept: true, offer: 'will_learn' }),
            note: ['거절을 배우겠다고 했다. 채금자 씨는 손님이 지폐를 세기 시작하면 어려워진다며, 거절은 짧게 하라고 했다. 이유를 길게 대면 손님이 이유랑 싸운다고.', "I said I'd learn to refuse. Geum-ja said it gets hard once the customer starts counting notes — keep it short, because long reasons just give them something to fight."] }),
          opt('tempted', '솔직히 두 배면 흔들려요. 수리비도 있고요', "Honestly, double is tempting. There are repairs", {
            say: ['두 배면… 솔직히 흔들립니다. 배 수리비도 있고요.', "Double, though... honestly, I'm tempted. There are boat repairs to pay for."],
            next: 'tempted' }),
        ],
        note: ['채금자 씨는 거절은 말로는 쉬워도, 손님이 지폐를 세기 시작하면 어려워진다고 했다. 창밖 구름이 낮고 빨랐다.', "Geum-ja said refusing is easy to say but hard once notes are being counted. Outside, the clouds were low and fast."],
      }),
      tempted: scene([
        line(C, '흔들리는 게 정상이에요. 안 흔들리는 사람은 거절을 배울 필요도 없어요.', "Being tempted is normal. Someone who isn't wouldn't need to learn to refuse."),
        line(C, '수리비는 다음 달에도 벌 수 있어요. 배랑 사람은 다음 달에 못 벌어요.', "You can earn repair money next month too. You can't earn back a boat or a person next month."),
        line(P, '…', '...'),
        line(C, '그 계산이 한 번에 나오면, 그때부터 선장이에요.', "When that sum comes out right the first time — that's when you're a captain."),
      ], {
        end: endTalk({ accept: true, offer: 'tempted' }),
        note: ['솔직히 두 배면 흔들린다고 했다. 채금자 씨는 흔들리는 게 정상이라며, 수리비는 다음 달에도 벌지만 배와 사람은 다음 달에 못 번다고 했다. 그 계산이 한 번에 나오면 선장이라고.',
          "I admitted double was tempting. Geum-ja said that's normal — repairs can be paid next month, but boats and people can't be earned back. Get that sum right at once and you're a captain."],
      }),
      how: scene([
        line(C, '안 된다고만 하면 손님은 왜냐고 물어요.', "Just say no, and the customer asks why."),
        line(C, '왜에 대답하기 시작하면, 그때부터 흥정이에요.', "Start answering why, and from then on it's haggling."),
        line(P, '그럼 어떻게 해요?', "Then what do you do?"),
        line(C, '한 번만, 짧게, 같은 말로. 그다음엔 대답 안 해요.', "Once, short, the same words. After that, you don't answer.", { act: 'nod' }),
        line(C, '쉬운데 다들 못 해요.', "It's easy, and nobody can do it."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_how' }),
        note: ['거절에도 법이 있느냐고 물었다. 채금자 씨는 왜에 대답하기 시작하면 흥정이 된다며, 한 번만, 짧게, 같은 말로 하고 그다음엔 대답하지 말라고 했다. 쉬운데 다들 못 한다고.',
          "I asked if refusing had a method. Geum-ja said answering why turns it into haggling — say it once, short, in the same words, and then don't answer. Easy, and nobody manages it."],
      }),
      sky: scene([
        line(C, '하늘은 마지막에 바뀌어요. 바다가 먼저고요.', "The sky changes last. The sea goes first."),
        line(C, '너울 봐요. 바람도 없는데 길게 밀려오잖아요.', "Look at the swell. No wind, and still it rolls in long.", { act: 'look_sea' }),
        line(P, '…정말이네요.', "...You're right."),
        line(C, '멀쩡해 보일 때가 제일 위험해요. 손님도 그걸 보고 조르는 거예요.', "When it looks fine is when it's most dangerous. That's why the customer is pushing."),
        line(C, '그러니까 지금 묶어요.', "So we tie down now."),
      ], {
        end: endTalk({ accept: true, offer: 'sky_fine' }),
        note: ['하늘이 멀쩡한데 태풍이 정말 오느냐고 물었다. 채금자 씨는 하늘은 마지막에 바뀌고 바다가 먼저라며, 바람도 없는데 길게 밀려오는 너울을 가리켰다. 멀쩡해 보일 때가 제일 위험하다고.',
          "I asked if a typhoon was really coming under a clear sky. Geum-ja said the sky changes last and the sea first, pointing to the long swell rolling in without wind. It's most dangerous when it looks fine."],
      }),
    },
  },
  // N11-3 — 끝내는 자리(채금자)
  {
    id: 'n11_3_done', questId: 'N11-3', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '거절했죠.', "We refused."),
        line(P, '네. 그 손님, 화내고 가셨어요.', "Yes. That customer left angry."),
        line(C, '다른 배 소식 들었어요?', "Did you hear about the other boat?"),
        line(P, '…돌아오지 않았다고요.', "...That it didn't come back."),
        act(C, 'silence'),
        line(C, '…그게 거절이 지키는 거예요.', "...That's what refusing protects.", { act: 'look_sea' }),
      ], {
        choices: [
          opt('lesson', '거절할 때 하는 말, 채금자 씨 말 그대로 배우고 싶어요', "I want your exact words for refusing", {
            say: ['거절할 때 뭐라고 말해야 하는지, 채금자 씨 말 그대로 배우고 싶습니다.', "What to say when you refuse — I want to learn it exactly as you say it."],
            end: endTalk({ complete: 'lesson',
              lineKo: '바다가 안 된다고 했다. 그렇게만 말해요.\n\n내가 안 된다고 하면 손님은 나랑 싸워요. 바다가 안 된다고 하면 싸울 데가 없어요. 그 말 뒤에 숨는 게 아니라, 그 말 앞에 서는 거예요.',
              lineEn: "The sea says no. That's all you say.\n\nIf I say no, the customer fights me. If the sea says no, there's nothing to fight. You don't hide behind those words — you stand in front of them." }),
            note: ['거절할 때 하는 말을 그대로 배우고 싶다고 했다. 채금자 씨는 바다가 안 된다고 했다, 그렇게만 말하라고 했다. 그 말 뒤에 숨는 게 아니라 그 말 앞에 서는 거라고.', "I asked for her exact words when refusing. The sea says no — that's all, Geum-ja said. You don't hide behind those words; you stand in front of them."] }),
          opt('pay', '거절해서 잃은 출항비를 조금 메워 주세요', "Help cover the fare we lost by refusing", {
            say: ['거절한 대신 잃은 출항비를 조금 메워 주십시오.', "Could you cover a little of the fare we lost by refusing?"],
            next: 'pay' }),
          opt('decline', '배가 돌아온 게 값이에요', "Our boat coming back is payment enough", {
            say: ['배가 돌아온 게 값입니다.', "The boat came back. That's payment enough."],
            end: endTalk({ complete: 'decline',
              lineKo: '…그렇게 말하는 선장이 오래 가요.\n\n지세포 선장 모임에 자리 하나 내 둘게요. 모임은 말이 없어요. 다들 바다 얘기만 해요. 그래도 거기 앉아 있으면 누가 언제 거절했는지 다 들려요. 그렇게 배워요.',
              lineEn: "...Captains who say that last a long time.\n\nI'll keep a seat for you at the Jisepo captains' meeting. Nobody talks much there. Everyone just talks about the sea. But sit there and you'll hear who refused, and when. That's how you learn." }),
            note: ['배가 돌아온 게 값이라고 했다. 채금자 씨는 그렇게 말하는 선장이 오래 간다며, 지세포 선장 모임에 내 자리를 내 두겠다고 했다. 거기 앉아 있으면 누가 언제 거절했는지 다 들린다고.', "I said the boat coming back was payment enough. Geum-ja said captains who say that last — she'd keep me a seat at the Jisepo captains' meeting, where you hear who refused and when."] }),
          opt('knot', '결속 매듭, 채금자 씨 식으로 다시 묶어 보고 싶어요', "I want to retie the lashings your way", {
            say: ['결속 매듭, 채금자 씨 식으로 다시 묶어 보고 싶습니다.', "I'd like to tie the lashing knots again, the way you do it."],
            end: endTalk({ complete: 'storm_knot',
              lineKo: '좋아요. 태풍 매듭은 묶는 것보다 푸는 걸 먼저 생각해요. 바람 지나간 뒤에 칼 없이 풀려야 하니까요.\n\n당기면 조이고, 끝을 빼면 풀려요. 거절도 그래요. 단단하게, 그래도 나중에 다시 나갈 수 있게.',
              lineEn: "Good. With a storm knot, you think about untying before tying. After the wind's gone it has to come loose without a knife.\n\nPull and it tightens; draw the end and it releases. Refusing is the same. Firm — but so you can head out again later." }),
            note: ['결속 매듭을 채금자 씨 식으로 다시 묶어 보고 싶다고 했다. 태풍 매듭은 칼 없이 풀려야 하니 푸는 걸 먼저 생각하라고 했다. 거절도 그렇다고, 단단하게, 그래도 다시 나갈 수 있게.', "I asked to retie the lashings her way. A storm knot has to come loose without a knife, so think about untying first, she said. Refusing is the same — firm, but so you can sail again."] }),
        ],
        note: ['태풍 전야에 출항을 조르던 손님을 거절했다. 손님은 화를 내고 갔다. 다음 날 다른 배 하나가 돌아오지 않았다는 소식을 들었다. 채금자 씨는 그게 거절이 지키는 거라고 했다.',
          "On the eve of the typhoon we refused the customer who wanted to sail. They left angry. The next day we heard another boat hadn't come back. That, Geum-ja said, is what refusing protects."],
      }),
      pay: scene([
        line(C, '…그것도 맞아요. 배는 서 있어도 돈이 나가죠.', "...That's fair too. A boat costs money even standing still."),
        act(C, 'give', { to: P }),
        line(C, '거절한 날 돈 얘기 하는 거, 저는 아직 어색해요.', "Talking money on the day I refused something — I'm still not used to it."),
        line(P, '…', '...', { act: 'receive' }),
        line(C, '그래도 서 있는 배도 밥은 먹어야 하니까. 다음엔 제가 먼저 챙길게요.', "Still, even a boat standing still has to eat. Next time I'll see to it first."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['거절해서 잃은 출항비를 조금 메워 달라고 했다. 채금자 씨는 복잡한 얼굴로 조금 건네며, 거절한 날 돈 얘기는 아직 어색하지만 맞는 말이라고 했다. 다음엔 자기가 먼저 챙기겠다고.',
          "I asked her to cover a little of the lost fare. Geum-ja handed some over with a complicated face — money talk on a refusal day still felt awkward, but I was right. Next time she'd see to it first."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N11-4 「덜렁이의 첫 손님」 — 받는 자리(채파도)
  // ═══════════════════════════════════════════
  {
    id: 'n11_4_offer', questId: 'N11-4', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '{player} 씨! 저 혼자 손님 맡아요!', "{player}! I'm taking customers out on my own!"),
        line(P, '혼자요? 파도 씨가요?', "On your own? You, Pa-do?"),
        line(D, '네! 처음이에요. 한 팀이요.', "Yes! First time. One group."),
        line(P, '축하해요. 그런데 저한테는 왜…', "Congratulations. But why tell me..."),
        line(D, '동승만 해 줘요. 아무것도 안 해도 돼요. 있기만요.', "Just ride along. You don't have to do anything. Just be there."),
        line(D, '아, 손님 몫으로 두 마리는 올려 줘야 해요. 손님들 빈손으로 내리면 안 되니까요.', "Oh — and you'll need to land two for the customers' share. They can't get off empty-handed."),
        line(P, '(있기만 하면 된다더니…)', "(So much for just being there...)"),
      ], {
        choices: [
          opt('ride', '탈게요. 아무것도 안 하고 있기만 할게요', "I'll ride. I'll just be there", {
            say: ['탈게요. 아무것도 안 하고 있기만 할게요.', "I'll ride along. I won't do a thing — I'll just be there."],
            next: 'ride' }),
          opt('skipper', '채금자 씨는 왜 같이 안 타요?', "Why isn't Geum-ja coming?", {
            say: ['채금자 씨는 왜 같이 안 타시고요?', "And why isn't Geum-ja riding with you?"],
            next: 'skipper' }),
          opt('tease', '덜렁이가 손님을? 채비는 안 잊었어요?', "The klutz, with customers? Remember the rigs?", {
            say: ['덜렁이가 손님을요? 채비는 안 잊고 챙겼어요?', "The klutz, taking customers? Did you remember to pack the rigs?"],
            next: 'tease' }),
        ],
        note: ['채파도 씨가 처음으로 손님 한 팀을 혼자 맡는다며 동승만 해 달라고 했다. 아무것도 안 해도 된다면서, 손님 몫으로 두 마리는 올려 달라고 했다.',
          "Pa-do was taking a group of customers out alone for the first time and asked me to ride along. I didn't need to do anything — except land two for the customers' share."],
      }),
      ride: scene([
        line(D, '네! 뒤에 앉아 있어요. 손님들이 보고 안심할 거예요.', "Yes! Sit at the back. The customers will feel safer seeing you."),
        line(P, '(손님 명부를 두 번, 세 번 넘겨 본다.)', "(Pa-do flips through the passenger list twice, three times.)"),
        line(D, '근데 진짜 아무것도 하지 마요. 제가 틀려도요.', "But really, don't do anything. Even if I get it wrong."),
        line(D, '틀리면 제가 고칠게요. 선장님 말로는, 혼자 고쳐 봐야 선장이 된대요.', "If I get it wrong, I'll fix it. The captain says you only become a captain by fixing things yourself."),
      ], {
        choices: [
          opt('ok', '알겠어요. 뒤에 앉아 있을게요', "Got it. I'll sit at the back", {
            say: ['알겠어요. 뒤에 조용히 앉아 있을게요.', "Got it. I'll sit quietly at the back."],
            end: endTalk({ accept: true, offer: 'ride_along' }),
            note: ['아무것도 안 하고 있기만 하겠다고 했다. 파도 씨는 손님 명부를 몇 번이고 넘겨 보며, 자기가 틀려도 아무것도 하지 말라고 했다. 혼자 고쳐 봐야 선장이 된다는 채금자 씨 말이라고.', "I promised to just be there. Flipping the passenger list over and over, Pa-do asked me not to step in even if things went wrong — Geum-ja says you only become a captain by fixing it yourself."] }),
          opt('seasick', '손님이 멀미라도 하면 어떡해요?', "What if a customer gets seasick?", {
            say: ['그런데 손님이 멀미라도 하면 어떡해요?', "But what will you do if a customer gets seasick?"],
            next: 'seasick' }),
        ],
        note: ['파도 씨는 손님들이 나를 보고 안심할 거라며 뒤에 앉아 있으라고 했다.', "Pa-do said the customers would feel safer seeing me, and told me to sit at the back."],
      }),
      seasick: scene([
        line(D, '가운데 앉혀요! 배는 가운데가 덜 흔들려요.', "Seat them in the middle! The middle of a boat rocks less."),
        line(D, '그리고 먼 데를 보게 해요. 선장님한테 배웠어요.', "And have them look far off. The captain taught me."),
        line(P, '그래도 안 되면요?', "And if that doesn't work?"),
        line(D, '그래도 안 되면… 있잖아요. 아, 아무것도 안 하기로 했죠.', "If that doesn't work... you're there. Oh — you're not doing anything, right."),
        line(D, '그럼 제가 할게요. 할 수 있어요.', "Then I'll do it. I can do it."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_seasick' }),
        note: ['손님이 멀미하면 어떡하느냐고 물었다. 파도 씨는 배 가운데에 앉히고 먼 데를 보게 하겠다고 손가락으로 배 그림을 그려 가며 설명했다. 그래도 안 되면 자기가 하겠다고.',
          "I asked what Pa-do would do about seasickness. Sketching a boat with one finger, Pa-do explained: seat them amidships and have them look far off. And if that failed, Pa-do would handle it."],
      }),
      skipper: scene([
        line(D, '선장님이 그랬어요. 첫 손님은 혼자 태우는 거래요.', "The captain said so. Your first customers you take out alone."),
        line(D, '선장님이 타면 손님들이 선장님만 본대요.', "If she's aboard, the customers only look at her."),
        line(P, '그렇구나.', "I see."),
        line(D, '근데 보세요, 저기 서 계시잖아요. 등 돌리고요.', "But look — she's standing right over there. With her back turned.", { act: 'look_away' }),
        line(D, '안 보는 척하면서 다 들으실 거예요. 그게 더 떨려요.', "She'll pretend not to look and hear everything. That's even more nerve-racking."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_skipper_back' }),
        note: ['채금자 씨는 왜 같이 안 타느냐고 물었다. 첫 손님은 혼자 태우는 거라고, 선장이 타면 손님들이 선장만 본다고 했다. 그런데 부두에서 등을 돌린 채 다 듣고 있을 거라 더 떨린다고.',
          "I asked why Geum-ja wasn't coming. First customers you take alone, Pa-do said — with the captain aboard, they only look at her. But she'd be on the pier with her back turned, hearing everything, which was worse."],
      }),
      tease: scene([
        line(D, '챙겼어요! 세 번 셌어요!', "I packed them! I counted three times!"),
        line(P, '(발끈했다가, 아이스박스 뚜껑을 슬쩍 열어 본다.)', "(Pa-do bristles — then quietly lifts the lid of the cool box to check.)"),
        line(D, '…네, 있어요. 미끼도 얼음도 멀미약도.', "...Yep, it's there. Bait, ice, seasickness pills."),
        line(D, '오늘은 덜렁이라고 부르지 마요. 손님 앞에서는요. 배에서 내리면 불러도 돼요.', "Don't call me klutz today. Not in front of customers. You can once we're off the boat."),
      ], {
        end: endTalk({ accept: true, offer: 'tease_rigs' }),
        note: ['덜렁이가 채비는 안 잊었느냐고 놀렸다. 파도 씨는 세 번 셌다고 발끈하더니 아이스박스를 슬쩍 열어 확인했다. 손님 앞에서는 덜렁이라고 부르지 말라고 했다.',
          "I teased Pa-do about forgetting the rigs. Pa-do bristled — counted three times! — then sneaked a look in the cool box. No calling me klutz in front of the customers, Pa-do said."],
      }),
    },
  },
  // N11-4 — 끝내는 자리(채파도) · 보상 답 다섯
  {
    id: 'n11_4_done', questId: 'N11-4', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '팁 받았어요! 손님이 팁 줬어요!', "I got a tip! The customers tipped me!"),
        line(P, '봤어요. 내리면서 손에 쥐여 주시던데요.', "I saw. They pressed it into your hand as they got off."),
        line(D, '선장님한테 먼저 보여 줬어요!', "I showed the captain first!"),
        line(P, '채금자 씨는 뭐라고 하셨어요?', "What did Geum-ja say?"),
        line(D, '아무 말도 안 했어요. 근데…', "Nothing. But...", { act: 'look_away' }),
        line(D, '…고마워요. 있기만 했는데.', "...Thank you. Even though you just sat there."),
      ], {
        choices: [
          opt('praise', '덜렁이가 아니었어요. 선장이었어요', "You weren't a klutz. You were a captain", {
            say: ['오늘은 덜렁이가 아니었어요. 선장이었어요.', "You weren't a klutz today. You were a captain."],
            next: 'praise' }),
          opt('lesson', '손님 앉히는 순서, 파도 씨가 저보다 낫던데요', "You seat customers better than I do", {
            say: ['손님 앉히는 순서, 파도 씨가 저보다 낫던데요. 배워야겠어요.', "The way you seated the customers was better than I'd do. I should learn it."],
            end: endTalk({ complete: 'lesson',
              lineKo: '저요? 선장님이 가르쳐 준 거예요. 뱃멀미 심한 사람은 가운데!\n\n그다음은 낚싯대 방향이요. 바람을 등지게 앉혀야 줄이 안 엉켜요. 그것도 선장님이 가르쳐 준 거예요.',
              lineEn: "Me? The captain taught me. Anyone who gets badly seasick goes in the middle!\n\nNext is which way the rods point. Seat them with the wind at their backs so the lines don't tangle. The captain taught me that too." }),
            note: ['손님 앉히는 순서를 배워야겠다고 했다. 파도 씨는 다 선장님이 가르쳐 준 거라며, 멀미 심한 사람은 가운데, 낚싯대는 바람을 등지게 앉힌다고 했다.', "I said I should learn how Pa-do seated the customers. It was all from the captain, Pa-do said — seasick ones in the middle, and seat everyone with the wind at their backs."] }),
          opt('knot', '손님 채비, 엉킨 데 하나 없던데요. 매듭 좀 봐요', "Not one tangle in their rigs. Show me your knot", {
            say: ['손님들 채비, 엉킨 데 하나 없이 나눠 주던데요. 매듭 좀 봐요.', "You handed out the customers' rigs without a single tangle. Let me see your knot."],
            next: 'knot' }),
          opt('back', '채금자 씨, 등 돌리고 다 듣고 계셨던 거 알았어요?', "Did you know Geum-ja was listening all along?", {
            say: ['채금자 씨, 등 돌리고 다 듣고 계셨던 거 알았어요?', "Did you know Geum-ja had her back turned but was listening to everything?"],
            next: 'back' }),
        ],
        note: ['파도 씨의 첫 단독 출조에 동승했다. 파도 씨는 키를 잡고 손님을 앉히고 채비를 나눠 주었다. 덜렁이가 아니었다. 돌아오는 길에 받은 팁을 파도 씨는 채금자 씨에게 먼저 보여 주었다.',
          "I rode along on Pa-do's first solo trip. Pa-do took the wheel, seated the customers and handed out rigs — no klutz at all. The tip they gave on the way back, Pa-do showed to Geum-ja first."],
      }),
      praise: scene([
        line(D, '…{player} 씨.', "...{player}."),
        act(D, 'give', { to: P }),
        line(P, '(팁 봉투를 반으로 접어 내민다. 받지 않으면 안 될 얼굴이다.)', "(Pa-do folds the tip envelope in half and holds it out, with a face that won't take no.)"),
        line(D, '반은 있어 준 값이에요. 뒤에 있어서 손님 앞에서 안 떨었어요.', "Half is for being there. With you at the back, I didn't shake in front of the customers."),
      ], {
        choices: [
          opt('take', '그럼 반은 받을게요', "Then I'll take half", {
            say: ['그럼 반은 받을게요. 오늘은 정말 선장이었어요.', "Then I'll take half. You really were a captain today."],
            end: endTalk({ complete: 'praise',
              lineKo: '…네!\n\n선장님한테는… 제가 선장이었다고, 직접 말해 줘요.',
              lineEn: "...Okay!\n\nAnd to the captain... tell her yourself that I was a captain." }),
            note: ['덜렁이가 아니라 선장이었다고 했다. 파도 씨는 팁 봉투를 반으로 접어 내밀며 있어 준 값이라고 했다. 반을 받았다. 채금자 씨에게는 내가 직접 말해 달라고 했다.', "I told Pa-do there had been no klutz today, only a captain. Folding the tip envelope in half, Pa-do held it out as my pay for being there. I took half — and was asked to tell Geum-ja myself."] }),
          opt('decline', '있기만 한 건데요. 됐어요', "I just sat there. Keep it", {
            say: ['있기만 한 건데요, 뭘. 됐어요.', "All I did was sit there. Keep it."],
            end: endTalk({ complete: 'decline',
              lineKo: '있기만 해도 돼요. 진짜로.\n\n있으면 제가 덜 덜렁대요. 이상하죠. 다음에도 있어만 줘요. 아무것도 안 해도 되니까요.',
              lineEn: "Just being there is enough. Really.\n\nWhen you're around, I'm less of a klutz. Strange, isn't it. Next time, just be there again. You don't have to do anything." }),
            note: ['있기만 한 건데 됐다고 봉투를 사양했다. 파도 씨는 있기만 해도 된다고, 내가 있으면 자기가 덜 덜렁댄다고 했다. 다음에도 있어만 달라고.', "I turned the envelope down — I'd only sat there. Pa-do said being there was enough; with me around, there was less klutziness. Next time, just be there again."] }),
        ],
        note: ['파도 씨는 팁 봉투를 반으로 접어 내밀었다. 뒤에 내가 있어서 손님 앞에서 안 떨었다고 했다.', "Pa-do folded the tip envelope in half and held it out. With me at the back, there'd been no shaking in front of the customers."],
      }),
      knot: scene([
        line(D, '이거요? 선장님이 매듭은 하나만 제대로 하래요. 여러 개 어설프게 말고요.', "This? The captain says do one knot properly. Not lots of them badly."),
        line(P, '(손님 채비 하나를 풀었다가, 눈을 감고 다시 묶는다.)', "(Pa-do undoes one of the customer rigs, closes both eyes and ties it again.)"),
        line(D, '저는 덜렁대니까 하나만 백 번 했어요. 그럼 덜렁대도 손이 알아서 해요.', "I'm a klutz, so I did just one a hundred times. Then even when I'm scatterbrained, my hands do it on their own."),
        line(D, '해 봐요.', "You try."),
      ], {
        end: endTalk({ complete: 'knot_hands' }),
        note: ['손님 채비에 엉킨 데가 없더라고 매듭을 보여 달라고 했다. 파도 씨는 매듭은 하나만 제대로 하라는 선장님 말에 하나만 백 번 했다며, 눈을 감고도 묶어 보였다.',
          "I asked to see the knot that kept the customers' rigs tangle-free. The captain said to do one knot properly, Pa-do said — so it was done a hundred times, and tied for me with eyes shut."],
      }),
      back: scene([
        line(D, '알았어요! 선장님은 등으로도 다 들어요.', "I knew! The captain hears everything, even with her back."),
        line(P, '(부두 쪽에 채금자 씨가 아직 등을 돌린 채 서 있다. 어깨가 조금 내려가 있다.)', "(Over on the pier, Geum-ja is still standing with her back to us. Her shoulders have dropped a little.)", { act: 'look_away' }),
        line(D, '팁 보여 드렸을 때 고개를 한 번 끄덕이셨어요. 저 그거 봤어요.', "When I showed her the tip, she nodded once. I saw it."),
        line(D, '그거면 돼요.', "That's enough for me."),
      ], {
        end: endTalk({ complete: 'back_turned' }),
        note: ['채금자 씨가 등을 돌린 채 다 듣고 있던 걸 알았느냐고 물었다. 파도 씨는 알았다고, 팁을 보여 줬을 때 고개를 한 번 끄덕였는데 그거면 된다고 했다. 부두의 채금자 씨는 어깨가 조금 내려가 있었다.',
          "I asked if Pa-do knew Geum-ja had been listening with her back turned. Of course — and she'd nodded once at the tip, which was enough. On the pier, Geum-ja's shoulders had dropped a little."],
      }),
    },
  },
];
