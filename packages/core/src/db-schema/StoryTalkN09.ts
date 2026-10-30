/**
 * @file StoryTalkN09.ts
 * @description 290차 — 이야기 「이수연·한봄 — 구룡포 의붓자매」(N09-1~4) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 끝은 옛 받는 답(`end.offer`) · 보상 답(`end.complete`)에 묶는다.
 *
 * 인물: 한봄(17 · 요리광 · 밝고 말이 빠르다 · 「~요!」 · 의붓언니를 「언니」 · 주인공을 「{player} 씨」 — 옛 말의 「아저씨」는 쓰지 않는다) ·
 *   이수연(17 · 아버지를 잃었다 · 말이 아주 짧다 · 「…」 · 존댓말 · 동생을 「봄이」 · 아버지를 「아빠」).
 * 주인공은 「한봄 씨」 · 「봄 씨」 · 「이수연 씨」로 부른다(「언니」라고 부르지 않는다).
 * 표시(옛 답에서 그대로): choice.n09_1_asked_fly · choice.n09_1_asked_cooking · choice.n09_1_held_fly · choice.n09_2_asked_suyeon ·
 *   choice.n09_2_asked_dressing · choice.n09_3_asked_pattern · choice.n09_3_asked_seat · choice.n09_shared ·
 *   choice.n09_4_asked_boat · choice.n09_4_asked_restaurant · choice.n09_4_asked_name.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const B = 'han_bom';
const S = 'lee_suyeon';
const P = 'player';

export const TALKS_N09: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N09-1 「호미곶의 털바늘」 — 받는 자리(한봄)
  // ═══════════════════════════════════════════
  {
    id: 'n09_1_offer', questId: 'N09-1', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '아, 고마워요! 큰일 날 뻔했다…', "Ah, thank you! That was close..."),
        line(P, '괜찮아요? 갑자기 미끄러지셔서 놀랐어요.', "Are you all right? You slipped out of nowhere — you scared me."),
        line(B, '미끄러운 덴 줄 몰랐어요. 저 한봄이에요!', "I didn't know it was slippery there. I'm Han Bom!"),
        line(P, '한봄 씨요. 여기 혼자 오셨어요?', "Han Bom. Did you come out here alone?"),
        line(B, '네! 저 요리에 미쳤거든요. 바다에서 막 잡은 걸 해 먹어 보고 싶어서요.', "Yes! I'm crazy about cooking. I wanted to cook something straight out of the sea."),
        line(P, '손에 든 건… 털바늘이에요?', "What's that in your hand... a fly?", { act: 'peer' }),
        line(B, '아, 이거요. 이 털바늘, 언니 아빠 건데…', "Oh, this. This fly was my sister's dad's...", { act: 'look_away' }),
        line(P, '…', '...'),
        line(B, '아무튼요! 붙잡아 줬으니까, 같이 한 마리만 낚아요. 여기 갯바위에서요.', "Anyway! You caught me, so let's catch just one together. Right here on the rocks."),
        line(B, '대신 저 또 미끄러지면 붙잡아 줘야 해요.', "But if I slip again, you have to catch me."),
      ], {
        choices: [
          opt('worry', '다친 데는 없어요? 젖은 데가 제일 미끄러워요', "Are you hurt? Wet spots are the slipperiest", {
            say: ['다친 데는 없어요? 갯바위는 젖은 데가 제일 미끄러워요.', "Are you hurt anywhere? On the rocks, the wet spots are the slipperiest."],
            next: 'worry' }),
          opt('fly', '그 털바늘, 왜 한봄 씨가 들고 있어요?', "Why are you the one carrying that fly?", {
            say: ['그 털바늘, 왜 한봄 씨가 들고 있어요?', "That fly — why are you the one carrying it?"],
            next: 'fly' }),
          opt('cooking', '요리에 미쳤다는 건 어느 정도로요?', "Crazy about cooking — how crazy?", {
            say: ['요리에 미쳤다는 건, 어느 정도로 미친 거예요?', "Crazy about cooking — just how crazy are we talking?"],
            next: 'cooking' }),
        ],
        note: ['호미곶 갯바위에서 미끄러지는 여학생을 붙잡았다. 한봄이라고, 요리에 미쳤다고 자기를 소개했다. 손에 든 털바늘은 언니의 아버지 것이라고 했다. 같이 갯바위에서 한 마리만 낚자고, 또 미끄러지면 붙잡아 달라고 했다.',
          "On the rocks at Homigot I caught a girl as she slipped. She introduced herself as Han Bom, crazy about cooking. The fly in her hand had belonged to her sister's father. She asked me to catch one fish with her on the rocks — and to catch her if she slipped again."],
      }),
      worry: scene([
        line(B, '없어요! 손목이 좀 놀란 것 같은데, 괜찮아요.', "Nope! My wrist got a bit of a shock, but it's fine."),
        line(P, '(손목을 돌려 보인다. 멀쩡하다.)', "(She twists her wrist to show me. It's fine.)"),
        line(B, '젖은 데가 미끄러운 건 알았는데, 초록색 낀 데가 더 미끄러운 건 몰랐어요.', "I knew wet spots were slippery, but I didn't know the green ones were worse."),
        line(B, '이제 발 디딘 데만 따라 밟을게요. 같이 한 마리만 낚아요!', "From now on I'll step only where you step. Let's catch just one together!"),
      ], {
        choices: [
          opt('follow', '그럼 제 발자국 따라오세요', "Then follow my footsteps", {
            say: ['그럼 제 발자국만 따라오세요. 천천히요.', "Then step only where I step. Slowly."],
            end: endTalk({ accept: true, offer: 'worry' }),
            note: ['다친 데는 없느냐고 물었다. 한봄 씨는 초록색 낀 데가 더 미끄러운 줄 몰랐다며, 이제 내 발 디딘 데만 따라 밟겠다고 했다.', "I asked if she was hurt. Bom said she hadn't known the green patches were worse, and that she'd step only where I stepped from now on."] }),
          opt('passing', '저는 그냥 지나가던 길이었는데요', "I was just passing by, though", {
            say: ['사실 저는 그냥 지나가던 길이었는데요.', "Actually, I was just passing by."],
            next: 'passing' }),
        ],
        note: ['한봄 씨는 멀쩡하다며 손목을 돌려 보였다. 젖은 데보다 초록색 낀 데가 더 미끄럽다는 걸 오늘 알았다고 했다.',
          "Bom twisted her wrist to show it was fine. She'd learned today that the green patches are slipperier than the wet ones."],
      }),
      passing: scene([
        line(B, '지나가던 길이 제일 좋아요! 저도 지나가다 미끄러졌어요.', "Passing by is the best! I slipped while passing by too."),
        act(B, 'laugh'),
        line(B, '그러니까 지나가는 김에 한 마리만요. 붙잡아 줬으니까, 이제 생명의 은인이에요.', "So, since you're passing, just one fish. You caught me, so now you're my lifesaver."),
        line(P, '은인이요…?', "Lifesaver...?"),
        line(B, '은인이랑 낚시하는 건 처음이에요.', "I've never fished with a lifesaver before."),
      ], {
        end: endTalk({ accept: true, offer: 'passing_by' }),
        note: ['그냥 지나가던 길이었다고 했더니, 한봄 씨는 지나가던 길이 제일 좋다며 웃었다. 붙잡아 줬으니 이제 내가 생명의 은인이라고 했다.',
          "When I said I was only passing by, Bom laughed that passing by is the best. Since I'd caught her, I was now her lifesaver."],
      }),
      fly: scene([
        line(B, '…그게, 얘기가 좀 길어요.', "...That's, um, kind of a long story.", { act: 'look_away' }),
        line(P, '(털바늘을 손바닥에 꼭 쥔다.)', "(She closes her hand tight around the fly.)"),
        line(B, '언니 얘기는 낚시하면서 할게요. 한 번에 하면 제가 울 것 같아서요.', "I'll tell you about my sister while we fish. If I say it all at once, I think I'll cry."),
        line(P, '네. 천천히 하셔도 돼요.', "Sure. Take your time."),
        line(B, '일단 한 마리만 같이 낚아요. 이 바늘로는 말고요. 이건 아까워서 못 던져요.', "First let's catch one together. Not with this fly, though. It's too precious to cast."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_fly' }),
        note: ['털바늘을 왜 들고 있느냐고 물었다. 한봄 씨는 털바늘을 꼭 쥐고, 한 번에 말하면 울 것 같으니 언니 이야기는 낚시하면서 하겠다고 했다. 그 바늘은 아까워서 못 던진다고.',
          "I asked why she was carrying the fly. Bom closed her hand around it and said she'd tell me about her sister while we fished — all at once, she'd cry. The fly was too precious to cast."],
      }),
      cooking: scene([
        line(B, '아침에 눈 뜨면 오늘 뭐 해 먹지부터 생각해요. 자기 전에도요. 꿈에서도 칼질해요.', "When I wake up, the first thing I think is what to cook today. Before bed too. I chop things in my dreams."),
        line(B, '이거 봐요. 도마랑 칼도 들고 왔어요.', "Look. I even brought a cutting board and a knife."),
        line(P, '갯바위까지요?', "All the way out to the rocks?", { act: 'peer' }),
        line(B, '네! 잡으면 그 자리에서 뭐라도 해 볼래요. 그러니까 한 마리만 같이 잡아요.', "Yes! Once we catch one I'll make something right there. So let's catch just one together."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_cooking' }),
        note: ['요리에 얼마나 미쳤느냐고 물었다. 한봄 씨는 꿈에서도 칼질을 한다며, 갯바위까지 들고 온 작은 도마와 칼을 꺼내 보였다. 잡으면 그 자리에서 해 먹겠다고 했다.',
          "I asked how crazy she was about cooking. Bom said she chops in her dreams, and showed me the little board and knife she'd carried out to the rocks. Whatever we caught, she'd cook on the spot."],
      }),
    },
  },
  // N09-1 — 끝내는 자리(한봄)
  {
    id: 'n09_1_done', questId: 'N09-1', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '잡았다! 우리 한 마리 잡았어요!', "We did it! We caught one!"),
        line(P, '가는 길에 한 번 더 미끄러질 뻔했지만요.', "Though you nearly slipped again on the way."),
        line(B, '그때도 붙잡아 줬잖아요. 두 번이나요.', "And you caught me then too. Twice now."),
        act(B, 'laugh'),
        line(B, '{player} 씨, 언니 소개할게요. 이수연이에요.', "{player}, I'll introduce you to my sister. Lee Suyeon."),
        line(P, '그 털바늘 얘기의… 그분이요?', "The one... the fly is about?"),
        line(B, '네. 말 없는 애예요. 그래도 같이 밥 먹어요.', "Yes. She doesn't talk much. But we eat together."),
      ], {
        choices: [
          opt('lesson', '갯바위 발 딛는 법, 다시 배워야겠어요', 'I need to relearn how to step on rocks', {
            say: ['갯바위에서 발 딛는 법을 다시 배워야겠어요. 한봄 씨도요.', "I need to relearn how to step on these rocks. You too."],
            end: endTalk({ complete: 'lesson',
              lineKo: '네! 같이 배워요!\n\n마른 데는 하얗고, 초록색 낀 데는 미끄럽고, 제일 무서운 건 까만 데래요. 젖어서 반짝이는 데요. 아까 저 거기 밟았어요. 이제 안 밟아요. 같이 조심해요.',
              lineEn: "Yes! Let's learn together!\n\nDry rock is white, the green stuff is slippery, and the scariest is the black — the wet, shiny parts. That's where I stepped earlier. Never again. Let's both be careful." }),
            note: ['갯바위 발 딛는 법을 다시 배워야겠다고 했다. 한봄 씨는 마른 데는 하얗고 초록색 낀 데는 미끄럽고, 제일 무서운 건 젖어서 반짝이는 까만 데라고 했다.',
              "I said we both needed to relearn how to walk on the rocks. Bom said dry rock is white, green is slippery, and the scariest is the wet, shiny black."] }),
          opt('pay', '붙잡아 준 값이라긴 이상하지만, 뭐라도요', "Odd to charge for it, but — something?", {
            say: ['붙잡아 준 값이라기엔 이상하지만, 뭐라도 주세요.', "It's odd to call it a fee for catching you, but — anything?"],
            next: 'pay' }),
          opt('decline', '사람 붙잡은 건데요. 됐어요', "I caught a person. No charge", {
            say: ['사람 붙잡은 건데요. 됐습니다.', "I caught a person, that's all. No need."],
            end: endTalk({ complete: 'decline',
              lineKo: '…언니가 그런 사람 좋아해요.\n\n언니는 말을 안 해서 좋아해도 티가 안 나요. 근데 저는 알아요. 좋은 사람이 오면 수저를 하나 더 놓거든요. 오늘 하나 더 놓을 거예요.',
              lineEn: "...My sister likes people like that.\n\nShe doesn't talk, so you can't tell when she likes someone. But I can. When a good person comes, she sets out one more spoon. Tonight she'll set out one more." }),
            note: ['사람 붙잡은 건데 됐다고 했다. 한봄 씨는 언니가 그런 사람을 좋아한다며, 좋은 사람이 오면 언니가 수저를 하나 더 놓는다고 했다. 구룡포 자매의 식탁에 내 자리가 생겼다.',
              "I said I'd only caught a person — no need. Bom said her sister likes people like that, and sets out an extra spoon when a good person comes. There was a place for me at the sisters' table in Guryongpo."] }),
          opt('held_fly', '그 털바늘, 잠깐 봐도 될까요?', 'Could I look at that fly for a moment?', {
            say: ['그 털바늘, 잠깐 봐도 될까요?', "That fly — could I look at it for a moment?"],
            next: 'held_fly' }),
        ],
        note: ['한봄 씨와 갯바위에서 한 마리를 올렸다. 가는 길에 한 번 더 붙잡았다. 한봄 씨는 말 없는 언니 이수연 씨를 소개해 주겠다고, 그래도 같이 밥은 먹는다고 했다.',
          "Bom and I landed one on the rocks; I caught her once more on the way. She said she'd introduce me to her quiet sister, Lee Suyeon — they still eat together."],
      }),
      pay: scene([
        line(B, '값이요? 음…', "A fee? Um..."),
        act(B, 'give', { to: P }),
        line(B, '돈은 이것밖에 없어요. 대신 떡도 있어요! 제가 만든 거예요. 쑥 넣은 거요.', "This is all the money I've got. But there's rice cake too! I made it. With mugwort."),
        line(P, '…맛있네요.', "...It's good.", { act: 'receive' }),
        line(B, '갯바위 위에서 먹으면 더 맛있어요. 진짜로요. 하나 더 드세요.', "It tastes better on the rocks. Really. Have another."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['뭐라도 달라고 했더니, 한봄 씨는 가진 돈을 꺼내고 자기가 만든 쑥떡까지 얹어 주었다. 갯바위 위에서 먹으니 정말 더 맛있었다.',
          "When I asked for something, Bom handed over what money she had and added a mugwort rice cake she'd made. On the rocks, it really did taste better."],
      }),
      held_fly: scene([
        line(B, '…네. 조심해서요.', "...Okay. Carefully."),
        line(P, '깃털이 조금 빠져 있네요.', "A few feathers have come loose.", { act: 'peer' }),
        line(B, '언니가 버리지도 못하고 쓰지도 못해서, 제가 들고 다녀요. 그 중간이 저예요.', "My sister can't throw it away and can't use it, so I carry it around. I'm the in-between."),
        line(B, '깃털 빠진 건 제 탓이에요. 언니한테는 비밀이에요.', "The missing feathers are my fault. Keep it a secret from her."),
      ], {
        end: endTalk({ complete: 'held_fly' }),
        note: ['털바늘을 잠깐 봐도 되겠느냐고 했다. 깃털이 조금 빠져 있었다. 언니가 버리지도 쓰지도 못해 한봄 씨가 들고 다닌다고, 그 중간이 자기라고 했다.',
          "I asked to look at the fly. A few feathers were missing. Her sister can neither throw it away nor use it, so Bom carries it — she's the in-between, she said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N09-2 「칼을 쥐면」 — 받는 자리(한봄)
  // ═══════════════════════════════════════════
  {
    id: 'n09_2_offer', questId: 'N09-2', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '{player} 씨! 오늘은 셋이서 같이 해요.', "{player}! Today, let's do it together — the three of us."),
        line(P, '셋이서요? 뭘요?', "The three of us? Do what?"),
        line(B, '언니가 잡고, 제가 조리할게요. 손질은 맡아 주세요.', "My sister catches, I cook. You handle the dressing."),
        line(P, '손질을 제가요?', "Me, on the dressing?"),
        line(B, '네! 손질이 좋아야 요리가 좋아요. 두 마리요.', "Yes! Good dressing makes good cooking. Two fish."),
        line(P, '두 마리면, 저도 낚는 거예요?', "Two — do I catch them as well?"),
        line(B, '네, 직접 낚은 걸로 손질해 줘요. 남이 잡은 거 말고요.', "Yes, dress fish you caught yourself. Not someone else's."),
        line(P, '(물가에 이수연 씨가 서 있다. 이쪽은 보지 않는다.)', "(Suyeon is standing at the water's edge. She doesn't look our way.)"),
      ], {
        choices: [
          opt('accept', '손질이라면 맡겨 주세요. 깨끗하게 할게요', "Leave the dressing to me. I'll keep it clean", {
            say: ['손질이라면 맡겨 주세요. 두 마리, 깨끗하게 하겠습니다.', "Leave the dressing to me. Two fish, done clean."],
            next: 'accept' }),
          opt('suyeon', '이수연 씨가 직접 낚아요? 말이 없다던 분이요', "Suyeon fishes herself? The quiet one?", {
            say: ['이수연 씨가 직접 낚아요? 말이 없다던 분이요.', "Suyeon does the fishing herself? The one you said doesn't talk?"],
            next: 'suyeon' }),
          opt('dressing', '손질이 요리를 그렇게나 바꿔요?', "Does dressing really change cooking that much?", {
            say: ['손질이 요리를 그렇게나 바꿔요?', "Does the dressing really change the cooking that much?"],
            next: 'dressing' }),
        ],
        note: ['한봄 씨가 셋이서 하자고 했다. 이수연 씨가 낚고 한봄 씨가 조리하고, 나는 직접 두 마리를 낚아 손질을 맡는다. 손질이 좋아야 요리가 좋다고 했다.',
          "Bom wanted the three of us to work together: Suyeon would fish, Bom would cook, and I'd catch two myself and do the dressing. Good dressing makes good cooking, she said."],
      }),
      accept: scene([
        line(B, '깨끗하게요! 그 말 좋아요. 언니도 들었을 거예요.', "Clean! I like that. My sister must have heard it too."),
        line(P, '(이수연 씨는 대답이 없다. 대신 낚싯대가 한 번 휘었다.)', "(Suyeon doesn't answer. Instead, her rod bends once.)"),
        line(B, '봐요, 벌써 하나 걸었어요. 언니는 대답을 손으로 해요.', "See, she's already hooked one. My sister answers with her hands."),
        line(B, '도마는 두 개예요. 하나는 {player} 씨 거, 하나는 제 거.', "There are two cutting boards. One's yours, {player}, and one's mine."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['두 마리를 깨끗하게 손질하겠다고 했다. 이수연 씨는 대답 대신 낚싯대를 한 번 휘게 했다. 한봄 씨는 언니는 대답을 손으로 한다며, 도마를 두 개 놓았다.',
          "I said I'd dress two fish clean. Instead of answering, Suyeon's rod bent once. Bom said her sister answers with her hands, and set out two cutting boards."],
      }),
      suyeon: scene([
        line(B, '말은 없어도 낚시는 저보다 훨씬 잘해요. 손이 정확해요.', "She doesn't talk, but she fishes way better than me. Her hands are precise."),
        line(P, '조금 부러운 얼굴인데요?', "You look a little jealous?"),
        line(B, '조금요. 언니는 잡는 거, 저는 해 먹는 거. 그 사이가 손질이에요.', "A little. She catches, I cook. Dressing is the in-between."),
        line(B, '그 사이를 맡아 주면 돼요. 두 마리요.', "You take the in-between. Two fish."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_suyeon' }),
        note: ['이수연 씨가 직접 낚느냐고 물었다. 한봄 씨는 말은 없어도 언니가 자기보다 훨씬 잘 낚는다며, 잡는 것과 해 먹는 것 사이가 손질이고 그걸 내가 맡으면 된다고 했다.',
          "I asked whether Suyeon did the fishing. Bom said her sister, quiet as she is, fishes far better than she does — between catching and cooking is dressing, and that was my part."],
      }),
      dressing: scene([
        line(B, '완전요! 비늘 하나 남으면 식감이 망가지고, 피를 덜 빼면 비려요.', "Totally! One scale left and the texture's ruined. Don't drain the blood enough and it smells fishy."),
        line(P, '뼈는요?', "And the bones?"),
        line(B, '뼈에 살을 남기면 그만큼 버리는 거고요.', "Leave meat on the bones and that's just thrown away."),
        line(B, '좋은 손질은 요리사 일을 반으로 줄여 줘요. 오늘 증명할게요. 접시로요.', "Good dressing cuts a cook's work in half. I'll prove it today. With a plate."),
      ], {
        choices: [
          opt('prove', '그럼 증명해 봐요. 두 마리 해 볼게요', "Then prove it. I'll do two", {
            say: ['그럼 증명해 봐요. 두 마리, 해 보겠습니다.', "Then prove it. I'll do two."],
            end: endTalk({ accept: true, offer: 'ask_dressing' }),
            note: ['손질이 요리를 그렇게 바꾸느냐고 물었다. 한봄 씨는 비늘 하나, 덜 뺀 피, 뼈에 남긴 살을 손가락으로 꼽으며, 오늘 접시로 증명하겠다고 했다.', "I asked if dressing really changed cooking so much. Bom counted on her fingers — one stray scale, blood not drained, meat left on the bone — and said she'd prove it with a plate today."] }),
          opt('unsure', '제 손질이 거기까지 될지 모르겠어요', "I'm not sure my dressing is that good", {
            say: ['제 손질이 요리에 쓸 만큼 되는지 모르겠어요.', "I'm not sure my dressing is good enough for cooking."],
            next: 'unsure' }),
        ],
        note: ['한봄 씨는 손질 하나로 식감과 비린내, 버리는 살이 달라진다고 했다. 좋은 손질은 요리사 일을 반으로 줄인다고.',
          "Bom said dressing alone decides texture, smell and how much meat goes to waste. Good dressing cuts a cook's work in half."],
      }),
      unsure: scene([
        line(B, '해 보면 알아요! 못하면 제가 말해 줄게요. 저 그런 건 솔직해요.', "You'll know once you try! If it's bad I'll tell you. I'm honest about that stuff.", { act: 'nod' }),
        line(B, '근데 갯바위에서 저 붙잡던 손이면 괜찮을 거예요. 급할 때도 정확한 손이었어요.', "But hands that caught me on the rocks will be fine. They were precise even in a hurry."),
        line(P, '…', '...'),
        line(B, '생선은 사람보다 덜 급해요. 천천히 하면 돼요.', "Fish are less of a hurry than people. Just go slow."),
      ], {
        end: endTalk({ accept: true, offer: 'unsure' }),
        note: ['내 손질이 쓸 만할지 모르겠다고 했다. 한봄 씨는 못하면 솔직하게 말해 주겠다며, 갯바위에서 자기를 붙잡던 손이면 괜찮다고 했다. 생선은 사람보다 덜 급하다고.',
          "I said I wasn't sure my dressing was good enough. Bom said she'd tell me honestly if not — but hands that caught her on the rocks would be fine. Fish are less of a hurry than people."],
      }),
    },
  },
  // N09-2 — 끝내는 자리(한봄)
  {
    id: 'n09_2_done', questId: 'N09-2', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '봤죠? 손질 좋으니까 요리도 됐어요!', "See? Good dressing, so the cooking worked!"),
        line(P, '접시로 증명하신다더니, 정말이네요.', "You said you'd prove it with a plate. You really did."),
        line(B, '언니가 두 점 먹었어요. 언니가요.', "My sister ate two pieces. My sister did."),
        line(P, '(이수연 씨는 말없이 젓가락을 내려놓았다.)', "(Suyeon set down her chopsticks without a word.)"),
        line(B, '언니는 원래 한 점도 잘 안 먹거든요.', "She usually barely eats even one."),
      ], {
        choices: [
          opt('lesson', '조리를 보니 손질에서 뭘 남길지 알겠어요', "Watching you cook, I see what to leave on", {
            say: ['봄 씨 조리를 보니까, 제 손질에서 뭘 남겨야 하는지 알겠어요.', "Watching you cook, I can see what I should be leaving when I dress a fish."],
            end: endTalk({ complete: 'lesson',
              lineKo: '맞아요! 배 쪽 살을 남겨야 해요!\n\n뱃살은 기름이 제일 많아서, 굽든 조리든 맛이 거기서 나와요. 근데 손질할 때 제일 많이 버려지는 데도 거기예요. 아깝잖아요. 이제 안 버리겠네요.',
              lineEn: "Right! You have to keep the belly meat!\n\nThe belly has the most fat, so whether you grill or braise, that's where the flavour comes from. But it's also what gets thrown away most when people dress fish. Such a waste. Now you won't." }),
            note: ['한봄 씨 조리를 보니 손질에서 뭘 남겨야 할지 알겠다고 했다. 맛이 나는 뱃살이 손질할 때 제일 많이 버려진다며, 이제 안 버리겠다고 웃었다.', "I said watching Bom cook showed me what to keep when dressing. The belly, where the flavour is, is what gets thrown away most — now I wouldn't, she laughed."] }),
          opt('pay', '손질 값은 받을게요', "I'll take a fee for the dressing", {
            say: ['손질 값은 받겠습니다.', "I'll take a fee for the dressing."],
            next: 'pay' }),
          opt('decline', '같이 먹은 밥값으로 칠게요', "Call it payment for the meal we shared", {
            say: ['같이 먹은 밥값으로 칠게요.', "Let's call it my share of the meal we ate together."],
            next: 'decline' }),
          opt('soup', '값 대신, 남은 뼈로 국이나 끓여 주세요', "Instead of pay, make soup from the bones", {
            say: ['손질 값 대신, 남은 뼈로 국이나 끓여 주세요.', "Instead of a fee, make some soup from the leftover bones."],
            end: endTalk({ complete: 'bone_soup',
              lineKo: '국이요? 맑은 탕이요! 뼈에 살 남은 게 하나도 없네요. 그래도 국물은 나와요. 뼈만으로도요.\n\n셋이 나눠 먹어요. 손질 값은 국 한 그릇이에요.',
              lineEn: "Soup? A clear broth! There's not a scrap of meat left on these bones. But they'll still make a broth. Bones alone will do it.\n\nThe three of us will share it. Your dressing fee is one bowl of soup." }),
            note: ['손질 값 대신 남은 뼈로 국을 끓여 달라고 했다. 한봄 씨는 뼈에 살이 하나도 안 남았다며 감탄하고는 맑은 탕을 끓였다. 그날 저녁 구룡포 골목에 탕 냄새가 퍼졌다.', "Instead of a fee, I asked for soup from the bones. Bom marvelled that there wasn't a scrap of meat left on them and made a clear broth. That evening its smell drifted down the alleys of Guryongpo."] }),
        ],
        note: ['내가 낚아 손질한 두 마리로 한봄 씨가 요리를 했다. 손질이 좋으니 요리도 됐다며, 평소 한 점도 잘 안 먹는 이수연 씨가 두 점을 먹었다고 했다.',
          "Bom cooked the two fish I caught and dressed. Good dressing made good cooking, she said — and Suyeon, who barely eats even one piece, had eaten two."],
      }),
      pay: scene([
        line(B, '식당도 아닌데… 그래도 맞아요.', "It's not like we're a restaurant... but that's fair."),
        act(S, 'give', { to: P }),
        line(B, '어? 언니가 먼저 꺼냈어요. 저도 몰랐어요.', "Huh? My sister got hers out first. I didn't even know.", { act: 'look_up' }),
        line(P, '(이수연 씨가 말없이 지갑을 내밀었다.)', "(Suyeon held out her wallet without a word.)", { act: 'receive' }),
        line(B, '언니는 일한 사람한테 고맙다는 말 대신 저렇게 해요. 말보다 손이 먼저예요, 언니는.', "Instead of saying thank you to someone who worked, she does that. With her, the hands come before words."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['손질 값을 받겠다고 했더니, 한봄 씨보다 이수연 씨가 먼저 말없이 지갑을 꺼냈다. 고맙다는 말 대신 손이 먼저인 사람이라고 한봄 씨가 말했다.',
          "When I asked for a dressing fee, Suyeon took out her wallet without a word, before Bom could. Bom said that's her sister — the hands come before the thank-you."],
      }),
      decline: scene([
        line(B, '…언니가 웃었어요. 방금. 봤어요?', "...My sister smiled. Just now. Did you see?"),
        line(P, '(이수연 씨가 처음으로 이쪽을 똑바로 봤다.)', "(For the first time, Suyeon looked straight at me.)"),
        line(B, '언니가 웃는 거, 저도 자주 못 봐요. 소리 없이 입꼬리만요.', "Even I don't see her smile often. No sound, just the corners of her mouth."),
        line(B, '밥값이라고 해 줘서 그런 것 같아요. 일 말고 밥으로 쳐 준 거니까요.', "I think it's because you called it the meal. You counted it as eating together, not work."),
      ], {
        end: endTalk({ complete: 'decline' }),
        note: ['같이 먹은 밥값으로 치겠다고 했다. 이수연 씨가 처음으로 나를 똑바로 보며 소리 없이 웃었다. 일이 아니라 밥으로 쳐 줘서 그런 것 같다고 한봄 씨가 말했다.',
          "I said I'd count it as my share of the meal. Suyeon looked straight at me for the first time and smiled without a sound. Bom thought it was because I'd counted it as a meal, not work."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N09-3 「아빠의 패턴」 — 받는 자리(이수연)
  // ═══════════════════════════════════════════
  {
    id: 'n09_3_offer', questId: 'N09-3', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '…저기요.', "...Excuse me.", { act: 'look_up' }),
        line(P, '이수연 씨? 먼저 말 거신 건 처음이네요.', "Suyeon? That's the first time you've spoken to me first."),
        line(S, '…아빠 털바늘 패턴.', "...My dad's fly pattern."),
        line(P, '패턴이요?', "Pattern?"),
        line(S, '사진 찾았어요. 봄이가.', "We found a photo. Bom did."),
        line(P, '그 털바늘을, 사진대로 다시 감자는 거예요?', "So — tie that fly again, just like the photo?"),
        line(S, '…감아 줄 수 있어요?', "...Could you tie it?"),
        line(P, '제가요? 감아서 뭘 하시게요?', "Me? And what would you do with it?"),
        line(S, '그걸로 참돔 한 마리. …셋이 먹어요.', "Catch a red sea bream with it. ...The three of us eat it."),
      ], {
        choices: [
          opt('accept', '감아 볼게요. 사진 그대로요', "I'll tie it. Just like the photo", {
            say: ['감아 보겠습니다. 사진 그대로, 한 올도 빼지 않고요.', "I'll tie it. Just like the photo, not one strand left out."],
            next: 'accept' }),
          opt('pattern', '사진 속 바늘, 무슨 깃털로 감은 거예요?', "What feathers is the fly in the photo tied with?", {
            say: ['사진 속 바늘, 무슨 깃털로 감은 거예요?', "The fly in the photo — what feathers is it tied with?"],
            next: 'pattern' }),
          opt('seat', '셋이요? 저까지 그 식탁에 앉아도 돼요?', "The three of us? I get a seat at that table?", {
            say: ['셋이요? 저까지 그 식탁에 앉아도 돼요?', "The three of us? Am I really allowed a seat at that table?"],
            next: 'seat' }),
        ],
        note: ['이수연 씨가 처음으로 먼저 말을 걸었다. 한봄 씨가 찾은 사진을 보고 아버지의 털바늘을 감아 달라고, 그 바늘로 참돔 한 마리를 낚아 셋이 먹자고 했다.',
          "Suyeon spoke to me first for the first time. She asked me to tie her father's fly from the photo Bom had found, catch a red sea bream on it, and eat it together, the three of us."],
      }),
      accept: scene([
        line(S, '…네.', "...Okay."),
        line(S, '이거요. 아빠가 감던 거.', "This. The one Dad used to tie."),
        line(P, '(사진을 받았다. 모서리가 닳아 있다.)', "(I take the photo. Its corners are worn.)", { act: 'receive' }),
        line(S, '…참돔 한 마리면 돼요. 그 바늘로요.', "...One red sea bream is enough. On that fly."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['사진 그대로 한 올도 빼지 않고 감겠다고 했다. 이수연 씨가 모서리가 닳은 사진을 내밀었다. 그 바늘로 참돔 한 마리면 된다고 했다.',
          "I said I'd tie it just like the photo, not a strand left out. Suyeon handed me the photo, its corners worn. One red sea bream on that fly would be enough."],
      }),
      pattern: scene([
        line(S, '…몰라요. 사진에는 색만 있어요.', "...I don't know. The photo only shows colours.", { act: 'peer' }),
        line(P, '그럼 비슷한 걸 찾아야겠네요.', "Then we'll have to find something similar."),
        line(S, '봄이도 그렇게 말해요.', "That's what Bom says too."),
        act(S, 'silence'),
        line(S, '…그래도 사진이랑 똑같았으면 좋겠어요.', "...But I'd like it to be the same as the photo."),
      ], {
        choices: [
          opt('same', '최대한 똑같이 감아 볼게요', "I'll make it as close as I can", {
            say: ['최대한 똑같이 감아 볼게요. 색부터 맞춰서요.', "I'll make it as close as I can. Starting with the colours."],
            end: endTalk({ accept: true, offer: 'ask_pattern' }),
            note: ['사진 속 바늘이 무슨 깃털인지 물었다. 이수연 씨는 사진엔 색만 있다며 오래 들여다보았다. 그래도 사진과 똑같았으면 좋겠다고 해서, 색부터 맞춰 보기로 했다.', "I asked what feathers the fly in the photo used. Suyeon looked at it a long time and said it only showed colours — but she'd like it to match. I'd start by matching the colours."] }),
          opt('unsure', '제 손으로 감아도 될지 모르겠어요', "I'm not sure my hands should be tying it", {
            say: ['아버지 바늘을 제 손으로 감아도 될지 모르겠어요.', "I'm not sure it should be my hands that tie your father's fly."],
            next: 'unsure' }),
        ],
        note: ['이수연 씨는 사진을 아주 오래 들여다보았다. 비슷한 걸 찾으면 된다는 걸 알면서도, 똑같았으면 좋겠다고 했다.',
          "Suyeon looked at the photo for a very long time. She knew something similar would do, and still wished it could be the same."],
      }),
      unsure: scene([
        line(S, '…괜찮아요. 누군가는 감아야 해요.', "...It's fine. Someone has to tie it."),
        act(S, 'silence'),
        line(S, '봄이가 그러는데, 손이 정확한 사람이래요. 저도 봤어요. 도마 위에서.', "Bom says you're someone with precise hands. I saw it too. On the cutting board."),
        line(S, '그러니까 감아 줘요. 참돔 한 마리.', "So please tie it. One red sea bream."),
      ], {
        end: endTalk({ accept: true, offer: 'unsure' }),
        note: ['아버지 바늘을 내 손으로 감아도 되겠느냐고 했다. 이수연 씨는 누군가는 감아야 한다고, 도마 위에서 내 손을 봤다고 했다.',
          "I said I wasn't sure my hands should tie her father's fly. Suyeon said someone has to — and that she'd seen my hands on the cutting board."],
      }),
      seat: scene([
        line(S, '…네.', "...Yes.", { act: 'nod' }),
        line(P, '(짧은 대답인데, 그 대답까지 오래 걸렸다.)', "(A short answer — but it took a long time to come.)"),
        line(S, '봄이가 상 차릴 거예요. 저는 수저 놓을게요. 셋이요.', "Bom will set the table. I'll lay the spoons. Three."),
        line(S, '그러니까 참돔 한 마리, 꼭요.', "So, one red sea bream. Please."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_seat' }),
        note: ['나까지 그 식탁에 앉아도 되느냐고 물었다. 이수연 씨는 오래 걸려 짧게 네, 하고 고개를 끄덕였다. 한봄 씨가 상을 차리고 자기는 수저를 셋 놓겠다고 했다.',
          "I asked whether I really had a seat at that table. After a long pause Suyeon nodded — yes. Bom would set the table, and she would lay out three spoons."],
      }),
    },
  },
  // N09-3 — 끝내는 자리(이수연)
  {
    id: 'n09_3_done', questId: 'N09-3', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '…아빠 바늘이 맞아.', "...It's Dad's fly.", { act: 'peer' }),
        line(P, '…', '...'),
        line(B, '언니가… 말했어요.', "My sister... she spoke."),
        line(P, '사진 그대로 감았어요. 참돔이 그 바늘에 올라왔고요.', "I tied it just like the photo. The sea bream came up on that fly."),
        line(S, '…알아요. 봤어요.', "...I know. I saw."),
        line(P, '(식탁에서, 나도 모르게 우리 부모 이야기를 꺼냈다. 왜 그랬는지는 모르겠다.)', "(At the table, before I knew it, I'd started talking about my own parents. I don't know why.)"),
      ], {
        choices: [
          opt('share', '저도 부모 이야기를 했어요. 처음이었어요', "I talked about my parents. It was the first time", {
            say: ['저도 부모 이야기를 했어요. 누구한테 한 건 처음이었어요.', "I talked about my parents too. It was the first time I'd told anyone."],
            next: 'share' }),
          opt('lesson', '털바늘 감는 법, 제대로 배우고 싶어요', "I'd like to learn fly tying properly", {
            say: ['털바늘 감는 법, 정식으로 배우고 싶어요.', "I'd like to learn to tie flies properly."],
            end: endTalk({ complete: 'lesson',
              lineKo: '아빠 방식이에요. 가르쳐 드릴게요.\n\n실은 세 번 감고 한 번 묶어요. 깃털은 맨 마지막에요. 먼저 넣으면 눌려요. …손이 기억할 때까지 같이 감아요.',
              lineEn: "It's Dad's way. I'll teach you.\n\nThree wraps of thread, then one knot. Feathers go on last. Put them in first and they get crushed. ...We'll tie them together until your hands remember." }),
            note: ['털바늘 감는 법을 배우고 싶다고 했다. 이수연 씨는 아버지 방식이라며, 세 번 감고 한 번 묶고 깃털은 맨 마지막이라고 가르쳐 주었다. 손이 기억할 때까지 같이 감자고 했다.', "I asked to learn fly tying. Suyeon said it was her father's way — three wraps, one knot, feathers last — and that we'd tie together until my hands remembered."] }),
          opt('pay', '바늘 복원 값은 받을게요', "I'll take a fee for restoring the fly", {
            say: ['바늘 복원 값은 받겠습니다.', "I'll take a fee for restoring the fly."],
            next: 'pay' }),
          opt('word', '값은 됐어요. 그 바늘이 맞다는 말이면 충분해요', "No fee. Hearing it's his fly is enough", {
            say: ['바늘 값은 됐어요. 아버지 바늘이 맞다는 그 말이면 충분해요.', "Never mind the fee. Hearing you say it's your father's fly is enough."],
            next: 'word' }),
        ],
        note: ['사진대로 감은 털바늘에 참돔이 올라왔다. 셋이 처음 둘러앉은 식탁에서 이수연 씨가 아빠 바늘이 맞다고 말했다. 나는 나도 모르게 우리 부모 이야기를 꺼냈다.',
          "A red sea bream came up on the fly I tied from the photo. At the first table the three of us shared, Suyeon said it was her father's fly. Before I knew it, I was talking about my own parents."],
      }),
      share: scene([
        line(S, '…들었어요. 고마워요.', "...I heard. Thank you."),
        line(S, '그 얘기, 쉽지 않은 거 알아요. 저는 아직 못 해요.', "I know that's not easy to say. I can't yet.", { act: 'look_away' }),
        line(B, '언니, 휴지…', "Sis, here, a tissue..."),
        line(P, '(이수연 씨는 휴지를 받지 않았다. 대신 털바늘 상자를 오래 쥐고 있었다.)', "(Suyeon didn't take the tissue. Instead, she held the fly box for a long time.)"),
      ], {
        end: endTalk({ complete: 'share' }),
        note: ['나도 부모 이야기를 처음 했다고 말했다. 이수연 씨는 그게 쉽지 않은 걸 안다고, 자기는 아직 못 한다고 했다. 한봄 씨가 내민 휴지 대신 털바늘 상자를 오래 쥐고 있었다.',
          "I said it was the first time I'd talked about my parents. Suyeon said she knew it wasn't easy — she couldn't yet. Instead of the tissue Bom offered, she held the fly box a long while."],
      }),
      pay: scene([
        line(S, '…네. 맞아요.', "...Yes. That's fair."),
        act(S, 'give', { to: P }),
        line(S, '아빠 바늘 값이에요. 정해진 값이 없어서 제가 정했어요. 모자라면 말해요.', "It's for Dad's fly. There's no set price, so I set it. Tell me if it's not enough."),
        line(B, '언니…', "Sis..."),
        line(P, '(한봄 씨가 소매를 잡아당겼지만, 이수연 씨는 봉투를 거두지 않았다.)', "(Bom tugged at her sleeve, but Suyeon didn't take the envelope back.)", { act: 'receive' }),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['바늘 복원 값을 받겠다고 했다. 이수연 씨는 얼굴이 조금 굳은 채 봉투를 내밀며, 정해진 값이 없어 자기가 정했다고 했다. 한봄 씨가 소매를 당겨도 거두지 않았다.',
          "I said I'd take a fee for the fly. Her face stiffening a little, Suyeon held out an envelope — there was no set price, so she'd set one. Even when Bom tugged her sleeve, she didn't take it back."],
      }),
      word: scene([
        line(S, '…네.', "...Okay."),
        act(S, 'silence'),
        line(S, '아빠 바늘 맞아요. 두 번 말해도 맞아요.', "It's Dad's fly. Even said twice, it's true."),
        line(P, '(한봄 씨가 웃다가 울었다. 이수연 씨는 털바늘 상자를 내 쪽으로 조금 밀었다.)', "(Bom laughed and then cried. Suyeon slid the fly box a little toward me.)"),
      ], {
        end: endTalk({ complete: 'enough_word' }),
        note: ['값은 됐다고, 아버지 바늘이 맞다는 말이면 충분하다고 했다. 이수연 씨는 한참 있다가 두 번 말해도 맞다고 했다. 털바늘 상자를 내 쪽으로 조금 밀었다 — 열어 봐도 된다는 뜻이었다.',
          "I said no fee — hearing it was her father's fly was enough. After a long while Suyeon said it was true even said twice, and slid the fly box toward me: I could open it."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N09-4 「구룡포의 봄」 — 받는 자리(이수연)
  // ═══════════════════════════════════════════
  {
    id: 'n09_4_offer', questId: 'N09-4', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '…배 팔았어요.', "...I sold the boat.", { act: 'look_sea' }),
        line(P, '배요? 혹시…', "The boat? You don't mean..."),
        line(S, '아빠 배요.', "Dad's boat."),
        act(S, 'silence'),
        line(P, '…그랬군요.', "...I see."),
        line(S, '봄이가 식당 하자고 해서요. 그 돈으로.', "Bom said let's open a restaurant. With the money."),
        line(P, '식당이요? 어디서요?', "A restaurant? Where?"),
        line(S, '구룡포요. 개업 상에 올릴 원물, 손질해 줄래요?', "Guryongpo. Would you dress the fish for the opening table?"),
        line(S, '…아빠 칼로요.', "...With Dad's knife."),
      ], {
        choices: [
          opt('boat', '아버지 배를 파셨다니… 괜찮아요?', "You sold your father's boat... are you okay?", {
            say: ['아버지 배를 파셨다니… 괜찮아요?', "You sold your father's boat... are you all right?"],
            next: 'boat' }),
          opt('restaurant', '식당이요? 두 분이서 하시는 거예요?', "A restaurant? The two of you?", {
            say: ['식당이요? 두 분이서 하시는 거예요?', "A restaurant? The two of you are running it?"],
            next: 'restaurant' }),
          opt('knife', '아버지 칼을 제가 써도 될까요?', "Should I really use your father's knife?", {
            say: ['아버지 칼을… 제가 써도 될까요?', "Your father's knife... should I really be the one to use it?"],
            next: 'knife' }),
        ],
        note: ['이수연 씨가 아버지 배를 팔았다고 했다. 한봄 씨가 그 돈으로 구룡포에 식당을 하자고 했다며, 개업 상에 올릴 원물을 아버지 칼로 손질해 달라고 했다.',
          "Suyeon told me she'd sold her father's boat. Bom wanted to open a restaurant in Guryongpo with the money, and Suyeon asked me to dress the fish for the opening table with her father's knife."],
      }),
      boat: scene([
        line(S, '…모르겠어요.', "...I don't know.", { act: 'look_sea' }),
        line(S, '묶어 두기만 하는 것보다는 나아요.', "It's better than just keeping it tied up."),
        line(P, '…', '...'),
        line(S, '그 돈으로 부엌을 해요. 봄이 말대로요. 첫 상은 아빠 칼로 차리고 싶어요.', "We'll make a kitchen with the money. Like Bom said. I want the first table set with Dad's knife."),
        line(S, '손질해 줘요.', "Please dress it."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_boat' }),
        note: ['아버지 배를 팔아 괜찮으냐고 물었다. 이수연 씨는 대답하기 전에 오래 바다를 보다가, 모르겠다고, 묶어 두기만 하는 것보다는 낫다고 했다. 첫 상은 아버지 칼로 차리고 싶다고 했다.',
          "I asked if she was all right, having sold her father's boat. Suyeon looked at the sea a long time before answering: she didn't know, but it was better than leaving it tied up. She wanted the first table set with his knife."],
      }),
      restaurant: scene([
        line(S, '…네. 봄이는 요리, 저는… 아직 몰라요.', "...Yes. Bom cooks, and I... don't know yet."),
        line(P, '아직 모르신다고요?', "You don't know yet?"),
        line(S, '봄이가 그러는데, 저는 생선 고르는 거래요.', "Bom says I'm the one who picks the fish.", { act: 'nod' }),
        line(P, '(마음에 드는 모양이다.)', "(She seems to like that.)"),
        line(S, '개업 상에는 원물 한 마리가 올라가야 한대요. 그건 부탁해요. 아빠 칼로요.', "Bom says one whole fish has to go on the opening table. That's what I'm asking you. With Dad's knife."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_restaurant' }),
        note: ['두 사람이 식당을 하느냐고 물었다. 한봄 씨는 요리, 이수연 씨는 생선 고르는 일이라고 했다. 개업 상에 올라갈 원물 한 마리를 아버지 칼로 부탁한다고 했다.',
          "I asked whether the two of them would run it. Bom would cook and Suyeon would pick the fish. She asked me for the one whole fish on the opening table, dressed with her father's knife."],
      }),
      knife: scene([
        line(S, '…써야 해요. 서랍에만 있으면 칼이 아니에요.', "...You have to use it. A knife that stays in a drawer isn't a knife."),
        line(P, '(천에 싼 칼이다. 손잡이가 닳아 반들거린다.)', "(A knife wrapped in cloth. The handle is worn smooth and shiny.)", { act: 'peer' }),
        line(S, '저는 아직 손이 떨려요. 그래서 부탁해요. 첫 상은 그 칼로요.', "My hands still shake. That's why I'm asking. The first table, with that knife."),
      ], {
        choices: [
          opt('careful', '그럼 조심해서 써 볼게요', "Then I'll use it carefully", {
            say: ['그럼… 조심해서 써 볼게요.', "Then... I'll use it carefully."],
            end: endTalk({ accept: true, offer: 'unsure' }),
            note: ['아버지 칼을 내가 써도 되겠느냐고 물었다. 이수연 씨는 서랍에만 있으면 칼이 아니라며, 자기는 아직 손이 떨려서 부탁한다고 했다.', "I asked if I should be the one to use her father's knife. Suyeon said a knife in a drawer isn't a knife — her own hands still shook, so she was asking me."] }),
          opt('accept', '개업 상이라면 맡을게요. 제일 좋은 놈으로요', "For the opening table, leave it to me", {
            say: ['개업 상이라면 제가 맡겠습니다. 제일 좋은 놈으로요.', "If it's for the opening table, leave it to me. The best one I can find."],
            next: 'accept' }),
        ],
        note: ['이수연 씨가 천에 싼 아버지 칼을 보여 주었다. 손잡이가 닳아 반들거렸다.',
          "Suyeon showed me her father's knife, wrapped in cloth. The handle was worn smooth."],
      }),
      accept: scene([
        line(S, '…고마워요.', "...Thank you."),
        act(S, 'laugh'),
        line(S, '봄이가 벌써 상 차릴 자리를 닦고 있어요. 세 번째 닦는 거예요.', "Bom's already wiping the spot for the table. That's the third time."),
        line(S, '원물만 오면 돼요. 아빠 칼은 여기 있어요.', "All we need is the fish. Dad's knife is right here."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['개업 상은 내가 맡겠다고 했다. 이수연 씨가 이번엔 조금 웃었다. 한봄 씨는 벌써 상 차릴 자리를 세 번째 닦고 있다고 했다.',
          "I said I'd take care of the opening table. This time Suyeon smiled a little. Bom was already wiping the table spot for the third time, she said."],
      }),
    },
  },
  // N09-4 — 끝내는 자리(이수연)
  {
    id: 'n09_4_done', questId: 'N09-4', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(P, '손질 마쳤어요. 개업 상에 올릴 수 있을 거예요.', "Done dressing it. It should be ready for the opening table."),
        line(S, '…봤어요. 옆에서.', "...I saw. From beside you."),
        line(S, '아빠 칼, 오랜만에 소리 났어요.', "Dad's knife made a sound again. It's been a while."),
        line(P, '…', '...'),
        line(S, '…고마워요. 식당 이름은 구룡포의 봄이에요.', "...Thank you. The restaurant is called Spring in Guryongpo."),
        line(P, '구룡포의 봄이요?', "Spring in Guryongpo?"),
        line(S, '봄이가 정했어요. 저는 반대 안 했어요.', "Bom chose it. I didn't object."),
      ], {
        choices: [
          opt('lesson', '그 칼, 무게가 달랐어요. 쓰는 법을 배우고 싶어요', "That knife felt different. Teach me to use it", {
            say: ['아버지 칼이 제 칼과 무게가 달랐어요. 그 칼 쓰는 법, 배우고 싶어요.', "Your father's knife weighs differently from mine. I'd like to learn how to use it."],
            end: endTalk({ complete: 'lesson',
              lineKo: '무거운 칼이에요. 힘을 빼야 해요.\n\n칼 무게로 자르는 거예요. 손은 방향만 잡아요. 힘을 주면 칼이 아니라 손이 무거워져요. …오늘 손은 가벼워 보였어요.',
              lineEn: "It's a heavy knife. You have to relax.\n\nYou cut with the knife's weight. Your hand only sets the direction. Push, and it's your hand that gets heavy, not the knife. ...Your hand looked light today." }),
            note: ['아버지 칼 쓰는 법을 배우고 싶다고 했다. 이수연 씨는 칼 무게로 자르고 손은 방향만 잡는 거라며, 오늘 내 손은 가벼워 보였다고 했다.', "I asked how to use her father's knife. Suyeon said you cut with the knife's weight and the hand only guides it — my hand had looked light today."] }),
          opt('pay', '개업 손질 값은 받을게요', "I'll take a fee for the opening dressing", {
            say: ['개업 손질 값은 받겠습니다.', "I'll take a fee for the opening-day dressing."],
            next: 'pay' }),
          opt('gift', '개업 선물로 할게요', "Let it be my opening gift", {
            say: ['그건 개업 선물로 할게요.', "Let that be my gift for the opening."],
            next: 'gift' }),
          opt('name', '구룡포의 봄, 봄 씨 이름에서 딴 거예요?', "Spring in Guryongpo — named after Bom?", {
            say: ['구룡포의 봄. 봄 씨 이름에서 딴 거예요?', "Spring in Guryongpo. Is it named after Bom?"],
            next: 'name' }),
        ],
        note: ['구룡포 개업 상에 올릴 원물을 이수연 씨 아버지 칼로 손질했다. 이수연 씨는 옆에서 보고, 아빠 칼이 오랜만에 소리를 냈다고 했다. 식당 이름은 한봄 씨가 정한 구룡포의 봄이라고 했다.',
          "I dressed the fish for the opening table in Guryongpo with Suyeon's father's knife. Watching beside me, she said his knife had made a sound again after a long time. The restaurant would be called Spring in Guryongpo — Bom's choice."],
      }),
      pay: scene([
        line(S, '…네. 첫 지출이네요.', "...Okay. Our first expense."),
        act(S, 'give', { to: P }),
        line(S, '장부는 제가 써요. 첫 줄에 손질비라고 적을게요.', "I keep the books. I'll write dressing fee on the first line."),
        line(S, '이 식당은 손질부터 시작한 거니까요. 잊어버리지 않게요.', "This restaurant started with dressing a fish. So we don't forget."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['개업 손질 값을 받겠다고 했다. 이수연 씨는 첫 지출이라며 장부 첫 줄에 손질비라고 적었다. 이 식당이 손질부터 시작했다는 걸 잊지 않게.',
          "I said I'd take a fee for the dressing. Suyeon called it their first expense and wrote dressing fee on the first line of the books — so they'd remember the restaurant began with dressing a fish."],
      }),
      gift: scene([
        line(B, '선물이요? 진짜요…?', "A gift? Really...?"),
        line(S, '…봄이 울어요. 저도요, 조금.', "...Bom's crying. Me too, a little."),
        line(S, '울면서 웃는 건 처음이에요. 이상하네요.', "It's the first time I've laughed while crying. Strange."),
        line(S, '…첫 손님 이름은 벽에서 안 내려요. 식당이 있는 동안은요.', "...The first guest's name doesn't come down from the wall. Not as long as the restaurant stands."),
      ], {
        end: endTalk({ complete: 'decline' }),
        note: ['개업 선물로 하겠다고 했다. 한봄 씨가 울었고, 이수연 씨도 조금 울면서 웃었다. 식당 벽에 첫 손님으로 내 이름이 걸렸다. 식당이 있는 동안은 안 내린다고 했다.',
          "I said it would be my opening gift. Bom cried, and Suyeon laughed and cried a little too. My name went up on the restaurant wall as the first guest — it would stay as long as the restaurant stood."],
      }),
      name: scene([
        line(S, '…봄이는 아니래요. 계절 봄이래요.', "...Bom says no. She says it's spring, the season."),
        line(B, '계절이에요! 진짜로요!', "It's the season! Really!", { act: 'look_away' }),
        line(S, '저는 둘 다라고 생각해요. 그래서 반대 안 했어요.', "I think it's both. That's why I didn't object."),
        line(S, '이름 하나에 뜻이 둘이면, 안 잊어버리잖아요.', "If one name has two meanings, you don't forget it."),
      ], {
        end: endTalk({ complete: 'ask_name' }),
        note: ['식당 이름이 한봄 씨 이름에서 딴 거냐고 물었다. 한봄 씨는 계절 봄이라며 딴청을 피웠고, 이수연 씨는 둘 다라고 생각해서 반대하지 않았다고 했다.',
          "I asked if the restaurant was named after Bom. Bom insisted it was the season and looked away; Suyeon said she thought it was both, which was why she hadn't objected."],
      }),
    },
  },
];
