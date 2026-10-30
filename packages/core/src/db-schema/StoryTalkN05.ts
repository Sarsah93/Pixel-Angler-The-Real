/**
 * @file StoryTalkN05.ts
 * @description 290차 — N05 「서하린 · 나기범 — 캐치&이트 콤비」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 이야기 순서 = 1 → 2 → 6 → 7 → 3 → 4 → 5.
 *
 * 인물: 서하린(26 · 화려한 초보 유튜버 — 들뜬 해요체 · 「기범 오빠」 · 주인공을 「그쪽」 · `{player} 씨`로 ·
 *   동의 없이 찍은 일(조회수) 뒤로는 찍기 전에 먼저 묻는다) · 나기범(28 · 내향 달인 — 짧은 해요체 · 말줄임 「…」 ·
 *   「하린이」 · 말 대신 고개를 끄덕이고 칼로 갚는다 · 주인공을 `{player} 씨`로).
 * 호칭(290): 주인공은 「서하린 씨」 · 「나기범 씨」. 서하린이 나기범을 「오빠」라 부르는 것은 두 사람 사이라 그대로 둔다.
 * 표시: 옛 받는 답 · 보상 답의 표시를 그대로 쓴다(choice.n05_1_* · n05_2_* · n05_3_* · n05_supported · n05_cautioned ·
 *   n05_4_* · n05_5_* · n05_6_* · n05_7_*). 새 표시는 만들지 않았다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const H = 'seo_harin';
const G = 'na_gibeom';
const P = 'player';

export const TALKS_N05: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N05-1 「낚아서 먹고 싶어요」 — 받는 자리(한 번뿐 — 그 배는 그날 떠난다)
  // ═══════════════════════════════════════════
  {
    id: 'n05_1_offer', questId: 'N05-1', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '저기요! 혹시 오늘 배 타세요?', "Excuse me! Are you going out on a boat today?", { act: 'look_up' }),
        line(P, '네, 그럴까 하고 있었어요.', 'I was thinking about it, yes.'),
        line(H, '잘됐다! 저 오늘 첫 선상이거든요. 촬영도 해요.', "Perfect! It's my first time fishing from a boat. I'm filming it too."),
        line(P, '촬영이요?', 'Filming?'),
        line(H, '네. 낚은 걸 그 자리에서 먹는 채널이에요. 구독자는… 아직 얼마 안 돼요.', "Yep. My channel's about eating what I catch, right where I catch it. Subscribers... not many yet."),
        act(H, 'laugh'),
        line(H, '근데 저 손질을 못 해요. 칼만 잡으면 손이 떨려요.', "But I can't clean a fish. My hands shake the moment I pick up a knife."),
        line(P, '그럼 낚아도 못 드시잖아요.', "Then even if you catch one, you can't eat it."),
        line(H, '그러니까요! 한 마리만 낚아서 그 자리에서 손질해 주실 수 있어요?', "Exactly! Could you catch just one and clean it for me on the spot?"),
        line(H, '배 위 매너는 나기범 오빠가 알려 줄 거예요. 낚시 진짜 잘하는 사람이에요. 말은 별로 없지만요.', "Na Gibeom will teach us boat manners. He's really good at fishing. Doesn't talk much, though."),
        line(H, '저도 같이 들을게요. 사실 저도 처음이거든요.', "I'll be listening too. Honestly, it's my first time as well."),
      ], {
        choices: [
          opt('go', '선상은 처음이에요. 같이 갈게요', "First time on a boat for me too. I'll come", { next: 'go' }),
          opt('lipstick', '립스틱까지 바르셨네요', "You've even got lipstick on", {
            say: ['립스틱까지 바르셨네요. 배 위에서 바로 드시게요?', "You've even put lipstick on. Planning to eat right there on the boat?"], next: 'lipstick' }),
          opt('decline', '촬영은 사양할게요', "I'll pass on being filmed", {
            say: ['촬영은 사양할게요. 다른 분이랑 가세요.', "I'll pass on being filmed. Go with someone else."], next: 'decline' }),
        ],
        note: ['서하린 씨가 첫 선상 촬영을 한다며 말을 걸어 왔다. 칼만 잡으면 손이 떨린다고, 한 마리만 낚아 그 자리에서 손질해 달라고 했다. 배 위 매너는 나기범 씨가 알려 준다고 했다.',
          "Seo Harin came up to me — her first boat trip, and she was filming it. Her hands shake whenever she holds a knife, so she asked me to catch one fish and clean it for her on the spot. Na Gibeom would teach us boat manners."],
      }),
      go: scene([
        line(H, '좋아요! 멀미약 챙기세요!', "Great! Bring seasickness pills!"),
        line(H, '배 타기 전에 먹어야 듣는대요. 기범 오빠가 그랬어요. 저는 벌써 먹었어요.', "You have to take them before you board or they don't work. Gibeom told me. I've already taken mine."),
        line(H, '오늘 목표는 하나예요. 바다에서 낚은 걸 그 자리에서 먹어 보는 거.', "Today there's just one goal. Eat something I caught at sea, right there."),
      ], {
        choices: [
          opt('pills', '멀미약 챙길게요', "I'll bring the pills", {
            end: endTalk({ accept: true, offer: 'go' }),
            note: ['같이 가기로 했다. 멀미약은 배 타기 전에 먹어야 듣는다고 했다. 오늘 서하린 씨의 목표는 바다에서 낚은 걸 그 자리에서 먹어 보는 것.',
              "I agreed to go. Seasickness pills only work if you take them before boarding. Harin's goal for the day: eat what she caught at sea, right there."] }),
          opt('manners', '배 위 매너는 뭘 지키면 돼요?', 'What manners do I need on board?', {
            say: ['배 위에서 지키는 매너가 따로 있어요?', "Are there special manners on a boat?"], aff: { [G]: 0.03 }, next: 'manners' }),
        ],
        note: ['서하린 씨는 멀미약부터 챙기라고 했다. 배 타기 전에 먹어야 듣는다고.', 'Harin told me to bring seasickness pills first — they only work if taken before boarding.'],
      }),
      manners: scene([
        line(H, '있대요! 저도 어제 처음 들었어요. 근데 제가 설명하면 반은 틀릴 거예요.', "There are! I only heard about them yesterday. But if I explain, I'll get half of it wrong."),
        line(P, '(휴대폰 메모를 뒤지다가 포기하네…)', '(She scrolls through the notes on her phone, then gives up...)'),
        line(H, '오빠는 말을 아끼는 사람이라, 궁금한 건 이쪽에서 꺼내야 돼요. 배 시간 늦지 마요!', "Gibeom saves his words, so you have to bring your questions to him. Don't be late for the boat!"),
      ], {
        end: endTalk({ accept: true, offer: 'ask_manners' }),
        note: ['배 위 매너를 물었더니 서하린 씨는 메모를 뒤지다 포기하고, 나기범 씨에게 직접 물어보라고 했다. 말을 아끼는 사람이라 이쪽에서 꺼내야 한다고.',
          "When I asked about boat manners, Harin gave up scrolling her notes and told me to ask Gibeom myself. He saves his words, so I'd have to bring the questions to him."],
      }),
      lipstick: scene([
        line(H, '티 나요? 첫 선상이잖아요!', "Can you tell? It's my first boat trip!", { act: 'look_away' }),
        line(H, '낚은 걸 그 자리에서 먹는 게 제 채널이에요. 화면에 예쁘게 나와야죠.', "Eating what I catch on the spot is my whole channel. I have to look good on screen."),
        line(H, '그러니까 꼭 한 마리, 그 자리에서요. 칼은 제가 못 잡으니까. 그게 오늘 부탁이에요.', "So — one fish, right there, please. I can't hold the knife. That's my favour for today."),
      ], {
        end: endTalk({ accept: true, offer: 'lipstick' }),
        note: ['립스틱 얘기를 했더니 서하린 씨는 화면에 예쁘게 나와야 한다며 웃었다. 칼은 못 잡으니 한 마리만 그 자리에서 손질해 달라고 다시 부탁했다.',
          "When I mentioned the lipstick, Harin laughed — she had to look good on camera. She asked again: one fish, cleaned on the spot, since she couldn't hold the knife."],
      }),
      decline: scene([
        line(H, '…아. 네. 알겠어요.', '...Oh. Right. Okay.', { act: 'look_away' }),
        line(H, '괜찮아요! 싫은 건 싫은 거니까요!', "It's fine! No means no!"),
        line(H, '첫 선상은 한 번뿐이라 같이 가고 싶었는데… 다른 분이랑 잘 다녀올게요!', "A first boat trip only happens once, so I wanted to go with you... but I'll go with someone else and have fun!"),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['촬영은 사양했다. 서하린 씨는 싫은 건 싫은 거라며 카메라를 내리고 다른 사람을 찾았다. 그 배는 그날 떠났다.',
          "I turned down being filmed. Harin said no means no, lowered her camera and went to find someone else. That boat left that day."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-1 — 끝내는 자리(배 위 · 나기범도 곁에 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n05_1_done', questId: 'N05-1', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '매너 배웠죠? 저도요!', "You learned the manners? Me too!", { act: 'look_up' }),
        line(P, '옆 사람 채비 넘지 않기, 배 위에서 뛰지 않기, 선장이 말하면 듣기.', "Don't cross your neighbour's line, don't jump around on deck, and listen when the skipper speaks."),
        line(H, '와, 다 외우셨네요. 회도 최고였어요. 바다에서 낚은 걸 바로 먹으니까요.', "Wow, you memorised them all. And the sashimi was the best. Eating it straight from the sea like that."),
        line(H, '근데 저… 배 위에서 뛰지 말라는데 세 번 뛰었어요.', "But, um... they said don't jump on deck, and I jumped three times.", { act: 'look_away' }),
        line(H, '오늘 같이 해 주신 거, 뭘로 갚아야 하지?', "How do I pay you back for today?"),
      ], {
        choices: [
          opt('lesson', '나기범 씨한테 더 배우고 싶어요', "I'd like to learn more from Gibeom", {
            say: ['나기범 씨한테 채비 정리하는 법도 더 배우고 싶어요.', "I'd like to learn more from Gibeom — how he keeps his rigs tidy."],
            aff: { [G]: 0.03 }, next: 'lesson' }),
          opt('pay', '출연료라는 게 있어요?', 'Is there such a thing as an appearance fee?', {
            end: endTalk({ complete: 'pay',
              lineKo: '있어요! 조회수 100당 100원… 아, 지금은 제가 낼게요. 사실 채널로는 아직 한 푼도 못 벌어요. 그래도 같이 고생했으면 나눠야죠. 그게 맞는 것 같아요.',
              lineEn: "There is! A hundred won per hundred views... ah, I'll just pay you myself for now. Honestly the channel hasn't made a single won yet. But if we worked hard together, we should share. That feels right." }),
            note: ['출연료를 물었다. 서하린 씨는 채널로는 아직 한 푼도 못 번다면서도, 같이 고생했으면 나눠야 한다며 자기 지갑을 열었다.',
              "I asked about an appearance fee. Harin admitted the channel hadn't earned a won yet, but said we'd worked together so we should share, and opened her own purse."] }),
          opt('decline', '배 태워 준 것만으로 됐어요', 'Getting the boat ride is enough', {
            end: endTalk({ complete: 'decline',
              lineKo: '진짜요? 다음에도 같이 타요! 아, 제가 태워 드리는 건 아니구나. 배는 선장님 거죠. 그래도 다음에도 같이요! 그때는 저도 안 뛸게요. 아마도요.',
              lineEn: "Really? Let's go out again! Oh — I'm not the one giving you a ride, am I. The boat's the skipper's. Still, next time, together! And I won't jump. Probably." }),
            note: ['배 태워 준 것만으로 됐다고 했다. 서하린 씨는 다음에도 같이 타자며, 그때는 안 뛰겠다고 했다. 그날 서하린 씨 채널 구독자가 하나 늘었다. 나다.',
              "I said the boat ride was enough. Harin said we'd go out together again, and she wouldn't jump next time. Her channel gained a subscriber that day. Me."] }),
          opt('more', '그보다 하나 말씀드릴 게 있어요', "There's something I should tell you, actually", { next: 'more' }),
        ],
        note: ['배 위에서 낚은 한 마리를 그 자리에서 손질해 서하린 씨에게 먹였다. 나기범 씨에게서 선상 매너도 들었다. 서하린 씨는 뛰지 말라는데 세 번 뛰었다고 털어놓았다.',
          "I cleaned the fish I caught on the boat and Harin ate it right there. Gibeom taught us boat manners, too. Harin confessed she'd jumped three times despite being told not to."],
      }),
      lesson: scene([
        line(H, '오빠! 이분 제자 하신대요!', "Gibeom! This one wants to be your apprentice!"),
        line(G, '…', '...', { act: 'nod' }),
        line(H, '봤죠? 끄덕였어요. 오빠는 좋으면 말 대신 고개를 끄덕여요. 오늘 저한테는 한 번도 안 했는데!', "See? He nodded. When Gibeom likes something he nods instead of talking. He didn't nod at me once today!"),
        line(H, '엉킨 채비는 배 위에서 풀지 말고 통째로 바꾸래요. 배 시간은 아깝대요.', "He says don't untangle a rig on the boat — swap the whole thing. Boat time is too precious."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['나기범 씨에게 더 배우고 싶다고 했더니, 나기범 씨가 말없이 고개를 끄덕였다. 엉킨 채비는 배 위에서 풀지 말고 통째로 바꾸라고 했다.',
          "When I said I wanted to learn more from Gibeom, he nodded without a word. A tangled rig, he said through Harin, you swap whole rather than untangle on board."],
      }),
      more: scene([
        line(H, '뭔데요? 혹시 회가 별로였어요?', "What is it? Was the sashimi not good?", { act: 'peer' }),
        line(P, '아뇨, 그건 아니고요.', "No, it's not that."),
      ], {
        choices: [
          opt('counted', '세 번이 아니라 네 번 뛰셨어요', 'You jumped four times, not three', {
            say: ['세 번이 아니라 네 번 뛰셨어요. 제가 셌어요.', "It wasn't three times, it was four. I counted."], next: 'counted' }),
          opt('thank', '나기범 씨한테 직접 고맙다고 할게요', "I'll go and thank Gibeom myself", {
            say: ['나기범 씨한테 직접 고맙다고 하고 올게요.', "I'll go and thank Gibeom in person."], next: 'thank' }),
        ],
      }),
      counted: scene([
        line(H, '…네 번이요? 아니에요, 세 번…', "...Four? No, three...", { act: 'look_up' }),
        line(H, '아, 고기 올라올 때 한 번 더 뛰었구나. 맞네요, 네 번.', "Oh — I jumped again when the fish came up. You're right. Four."),
        act(H, 'laugh'),
        line(H, '기범 오빠한테는 비밀이에요. 다음 선상에선 한 번도 안 뛸게요. 진짜로요. 그때도 세어 줘요.', "Keep it secret from Gibeom. Next time I won't jump even once. Really. Count for me then too."),
      ], {
        end: endTalk({ complete: 'counted_jumps' }),
        note: ['세 번이 아니라 네 번 뛰었다고 알려 줬다. 서하린 씨는 손가락을 꼽다가 웃으며, 다음 선상에서도 세어 달라고 했다.',
          "I told Harin she'd jumped four times, not three. She counted on her fingers, laughed, and asked me to count again next trip."],
      }),
      thank: scene([
        line(H, '직접요? 좋아요! 근데 오빠는 고맙다는 말 들으면 숨어요.', "In person? Great! But Gibeom hides when people thank him."),
        line(P, '(나기범 씨는 벌써 등을 돌리고 있다. 귀 끝이 조금 붉다.)', "(Gibeom has already turned his back. The tips of his ears are a little red.)"),
        line(H, '그래도 들었을 거예요. 귀는 밝거든요. 오빠는 말 대신 채비로 갚아요. 다음에 그쪽 채비가 엉키면, 오빠가 제일 먼저 와 있을 거예요.', "He'll have heard, though. He's got sharp ears. Gibeom pays people back with rigs, not words. Next time your rig tangles, he'll be the first one there."),
      ], {
        end: endTalk({ complete: 'thank_gibeom' }),
        note: ['나기범 씨에게 직접 고맙다고 했다. 나기범 씨는 등을 돌렸지만 귀 끝이 붉었다. 서하린 씨는 오빠는 말 대신 채비로 갚는 사람이라고 했다.',
          "I thanked Gibeom in person. He turned his back, but the tips of his ears were red. Harin said he's the kind who pays you back with rigs, not words."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-2 「조회수」 — 받는 자리(영상에 얼굴이 나왔다)
  // ═══════════════════════════════════════════
  {
    id: 'n05_2_offer', questId: 'N05-2', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…저기요.', '...Um, excuse me.', { act: 'look_away' }),
        line(P, '서하린 씨? 무슨 일 있어요?', "Harin? Is something wrong?"),
        line(H, '죄송해요. 지난번 영상에… 얼굴 나온 거요.', "I'm sorry. In my last video... your face was in it."),
        line(P, '제 얼굴이요?', 'My face?'),
        line(H, '네. 재밌는 장면이라 그냥 넣었어요. 동의도 안 받고요.', "Yes. It was a fun moment, so I just put it in. Without asking you."),
        act(H, 'sigh'),
        line(H, '그게… 논란이 됐어요.', "And... it blew up."),
        line(P, '…', '...'),
        line(H, '오늘은 카메라 끌게요. 그냥 낚시해요. 밤에 루어로 전갱이 두 마리만요.', "Today I'll keep the camera off. Let's just fish. Two horse mackerel on lures, at night."),
        line(P, '(사과하러 온 거구나.)', "(She came to apologise.)"),
      ], {
        choices: [
          opt('rules', '사과는 됐어요. 찍는 규칙부터 정해요', "No need to apologise. Let's set filming rules first", {
            say: ['사과는 됐어요. 대신 찍는 규칙부터 정해요.', "You don't need to apologise. Let's set some rules for filming instead."], next: 'rules' }),
          opt('comments', '사람들이 뭐라고 했는데요?', 'What did people say?', {
            say: ['논란이라니, 사람들이 뭐라고 했는데요?', "Blew up how? What did people say?"], next: 'comments' }),
          opt('decline', '오늘은 낚시할 기분이 아니에요', "I'm not in the mood to fish today", {
            say: ['오늘은 낚시할 기분이 아니에요. 다음에 얘기해요.', "I'm not in the mood to fish today. Let's talk another time."], next: 'decline' }),
        ],
        note: ['서하린 씨가 사과하러 왔다. 지난번 영상에 동의 없이 내 얼굴을 넣었다가 논란이 됐다고 했다. 오늘은 카메라를 끄고, 밤에 루어로 전갱이 두 마리를 같이 낚자고 했다.',
          "Harin came to apologise. She'd put my face in her last video without asking and it had blown up. Today, camera off, she asked me to catch two horse mackerel on lures with her at night."],
      }),
      rules: scene([
        line(H, '규칙이요?', 'Rules?', { act: 'look_up' }),
        line(H, '…네. 그게 맞는 것 같아요. 사과는 제 마음 편하자고 하는 거고, 규칙은 다음 사람을 위한 거니까요.', "...Yes. That feels right. An apology is for my own peace of mind, but rules are for the next person."),
        line(P, '(가방에서 수첩을 꺼냈다.)', '(She takes a notebook out of her bag.)'),
        line(H, '뭐부터 정할지는 낚으면서 생각해요. 카메라는 꺼 두고요. 전갱이 두 마리 올릴 동안 저도 생각해 올게요.', "Let's work out where to start while we fish. Camera off. While we land those two, I'll think too."),
      ], {
        end: endTalk({ accept: true, offer: 'rules_first' }),
        note: ['사과보다 찍는 규칙을 정하자고 했다. 서하린 씨는 사과는 자기 마음 편하자는 것이고 규칙은 다음 사람을 위한 거라며 수첩을 꺼냈다.',
          "I said we should set filming rules rather than dwell on the apology. Harin said an apology is for her own peace of mind, rules are for the next person — and took out a notebook."],
      }),
      comments: scene([
        line(H, '댓글이요. 이 사람한테 동의는 받았냐고. 얼굴이 다 나왔다고.', "Comments. Asking if I'd got your consent. Saying your whole face was showing."),
        line(H, '저는 생각을 못 했어요. 댓글이 다 맞는 말이라 더 아팠어요.', "I just didn't think. And every comment was right, which made it hurt more.", { act: 'look_away' }),
      ], {
        choices: [
          opt('no_camera', '그럼 오늘은 카메라 없이 가요', "Then today, no camera", {
            end: endTalk({ accept: true, offer: 'ask_comments' }),
            note: ['댓글이 동의를 받았느냐고 물었다고 했다. 서하린 씨는 다 맞는 말이라 더 아팠다고 했다. 오늘은 카메라 없이 가기로 했다.',
              "The comments had asked whether she'd got my consent. Harin said they were all right, which hurt more. We'd go without a camera today."] }),
          opt('upset', '솔직히 저도 불쾌했어요', 'Honestly, it bothered me too', {
            say: ['솔직히 말하면, 동의 없이 찍힌 건 불쾌했어요.', "To be honest, being filmed without my consent bothered me."], next: 'upset' }),
        ],
        note: ['댓글에는 동의는 받았느냐, 얼굴이 다 나왔다는 말이 달렸다고 했다.', "The comments asked whether she'd had consent, and pointed out that my face was fully visible."],
      }),
      upset: scene([
        line(H, '…네. 그러실 거예요. 변명 안 할게요.', "...Yes. Of course it did. I won't make excuses."),
        act(H, 'silence'),
        line(H, '오늘 하루로 다 풀리진 않겠죠. 그래도 나와 주셨잖아요. 카메라는 끄고, 전갱이 두 마리. 그거라도 같이 해요.', "One day won't fix it all. But you came out anyway. Camera off, two horse mackerel. Let's at least do that together."),
      ], {
        end: endTalk({ accept: true, offer: 'upset' }),
        note: ['솔직히 불쾌했다고 말했다. 서하린 씨는 변명하지 않고 고개를 숙였다. 화면에 어떻게 나올지 생각하지 않는 숙임이었다.',
          "I told her honestly that it had bothered me. Harin bowed her head without making excuses — not a bow for the camera."],
      }),
      decline: scene([
        line(H, '…네. 그럴 수 있죠. 마음 내킬 때 말해 주세요.', "...Okay. That's fair. Tell me when you feel like it."),
        line(H, '그때도 카메라는 꺼 둘게요. 그건 약속해요. 사과는 오늘 한 걸로 하고, 낚시는 그쪽이 괜찮을 때 해요.', "The camera will stay off then too. I promise. Let today's apology stand, and we'll fish when you're ready."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['오늘은 낚시할 기분이 아니라고 미뤘다. 서하린 씨는 카메라 가방 지퍼를 끝까지 잠그며, 그때도 카메라는 꺼 두겠다고 약속했다.',
          "I put it off — I wasn't in the mood. Harin zipped her camera bag all the way shut and promised the camera would stay off then too."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-2 — 끝내는 자리(촬영 동의서)
  // ═══════════════════════════════════════════
  {
    id: 'n05_2_done', questId: 'N05-2', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '두 마리 다 올렸네요.', 'We landed both.', { act: 'nod' }),
        line(P, '서하린 씨도 잘 낚던데요. 카메라 꺼져 있을 때가 더요.', "You fished well too, Harin. Better with the camera off."),
        line(H, '그래요? …저도 몰랐어요.', "Really? ...I didn't know that."),
        line(H, '그리고 이거요. 촬영 동의서, 만들어 봤어요.', "And — this. I made a filming consent form."),
        line(P, '동의서요?', 'A consent form?'),
        line(H, '세 줄이에요. 찍어도 되는지, 얼굴이 나와도 되는지, 내려 달라고 하면 내리는지.', "Three lines. Whether I can film you, whether your face can show, and whether I'll take it down if you ask."),
        line(H, '첫 서명을 그쪽한테 받고 싶어요.', "I'd like your signature to be the first.", { act: 'look_up' }),
      ], {
        choices: [
          opt('rule', '앞으로는 물어보고 찍어요. 그럼 돼요', "From now on, ask before you film. That's all", {
            end: endTalk({ complete: 'rule',
              lineKo: '네. 약속해요. 마지막 줄은 그쪽 덕분에 넣었어요. 싫다고 하면 언제든 내릴게요.',
              lineEn: "Yes. I promise. That last line is there because of you. If anyone says no, I'll take it down, any time." }),
            note: ['앞으로는 물어보고 찍으면 된다고 했다. 동의서 첫 줄에 내 이름을 썼다. 서하린 씨는 내려 달라는 마지막 줄은 내 덕분에 넣었다고 했다.',
              "I told her: from now on, just ask first. I signed the first line of the form. Harin said the last line — taking it down on request — was there because of me."] }),
          opt('lesson', '그 리트리브, 가르쳐 주세요', 'Teach me that retrieve', {
            say: ['카메라 꺼진 서하린 씨 낚시가 더 좋았어요. 그 리트리브, 가르쳐 주세요.', "Your fishing was better with the camera off. Teach me that retrieve."], next: 'lesson' }),
          opt('pay', '초상권 사용료로 받을게요', "I'll take it as a fee for using my likeness", {
            say: ['초상권 사용료라는 걸로 받을게요.', "I'll take what's owed for using my likeness."], next: 'pay' }),
          opt('half_fee', '사용료는 반만 받을게요', "I'll take half the fee", {
            say: ['사용료는 반만 받을게요. 나머지는 동의서 만드는 데 쓰세요.', "I'll take half the fee. Use the rest for making consent forms."],
            end: endTalk({ complete: 'half_fee',
              lineKo: '반이요? …그럼 반은 동의서 종이값으로 쓸게요. 진짜로요. 첫 서명이 그쪽인데, 종이값까지 그쪽 돈이네요. 이 동의서는 찢어질 때까지 오래 쓸게요.',
              lineEn: "Half? ...Then the other half goes on paper for the forms. Really. Your signature's the first, and the paper's on you too. I'll use this form until it falls apart." }),
            note: ['사용료는 반만 받고, 나머지는 동의서 만드는 데 쓰라고 했다. 서하린 씨는 첫 서명도 종이값도 내 것이 됐다며, 찢어질 때까지 쓰겠다고 했다.',
              "I took half the fee and told her to spend the rest on consent forms. Harin said now both the first signature and the paper were mine, and she'd use the form until it fell apart."] }),
        ],
        note: ['카메라를 끄고 밤에 전갱이 두 마리를 올렸다. 꺼진 카메라 앞에서 서하린 씨가 낚시를 더 잘했다. 서하린 씨는 세 줄짜리 촬영 동의서를 만들어 와, 첫 서명을 내게 받고 싶다고 했다.',
          "With the camera off, we landed two horse mackerel at night. Harin fished better with it off. She'd made a three-line filming consent form and wanted my signature to be the first."],
      }),
      lesson: scene([
        line(H, '…진짜요? 그럼 저도 가르쳐요, 처음이지만!', "...Really? Then I get to teach, for the first time ever!"),
        act(H, 'laugh'),
        line(H, '밤 루어는 천천히 감는 게 다예요. 전갱이는 불빛 아래 떠 있다가 느린 걸 물어요.', "Night lures are all about reeling slow. Horse mackerel hang under the lights and take the slow ones."),
        line(H, '카메라를 켜면 저도 모르게 빨리 감아요. 보여 주고 싶어서요. 그게 문제였나 봐요.', "When the camera's on, I reel faster without meaning to. Because I want to show off. Maybe that was the problem."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['서하린 씨에게 밤 루어 리트리브를 배웠다. 전갱이는 불빛 아래 떠 있다가 느린 걸 문다고. 카메라를 켜면 자기도 모르게 빨리 감는다고 했다.',
          "Harin taught me her night-lure retrieve: horse mackerel wait under the lights and take the slow ones. With the camera on, she said, she reels too fast without noticing."],
      }),
      pay: scene([
        line(H, '아… 네. 맞아요. 그게 규칙이죠.', "Ah... yes. That's right. Those are the rules.", { act: 'look_away' }),
        line(H, '…아니에요, 표정 굳은 거 아니에요. 맞는 말이니까요.', "...No, my face didn't fall. You're right, after all."),
        line(H, '얼굴은 그 사람 거잖아요. 쓰려면 값을 내야죠. 다음부터는 찍기 전에 그 얘기부터 할게요.', "A face belongs to its owner. If I use it, I should pay. From now on I'll bring that up before I film."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['초상권 사용료를 받았다. 서하린 씨는 표정이 잠깐 굳었지만, 얼굴은 그 사람 것이니 값을 내는 게 맞다고 했다.',
          "I took a fee for the use of my likeness. Harin's face stiffened for a moment, but she said a face belongs to its owner, so paying was right."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-3 「퇴사합니다」 — 받는 자리(제주 · 나기범)
  // ═══════════════════════════════════════════
  {
    id: 'n05_3_offer', questId: 'N05-3', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '…잠깐 얘기해도 돼요?', '...Can we talk for a minute?', { act: 'look_sea' }),
        line(P, '네, 나기범 씨. 무슨 일이에요?', "Sure, Gibeom. What's up?"),
        line(G, '…퇴사해요.', "...I'm quitting."),
        line(P, '퇴사요? 회사를요?', 'Quitting? Your job?'),
        line(G, '네. 낚시로 살 거예요.', "Yes. I'm going to live by fishing.", { act: 'nod' }),
        line(P, '…', '...'),
        line(G, '하린이는 아무 말도 안 해요.', "Harin isn't saying anything."),
        line(G, '{player} 씨는 뭐라고 할 거예요.', "What will you say, {player}?"),
        line(P, '제 생각이요?', 'What I think?'),
        line(G, '무늬오징어, 나란히 두 마리 올리면서요. 그동안 다 말할게요.', "While we land two bigfin squid side by side. I'll tell you everything in the meantime."),
      ], {
        choices: [
          opt('listen_first', '다 듣고 나서 말할게요. 오징어 하면서요', "I'll say once I've heard it all. Over squid", {
            say: ['뭐라고 할지는 다 듣고 나서 할게요. 오징어 하면서요.', "I'll tell you what I think once I've heard it all. While we fish for squid."], next: 'listen_first' }),
          opt('harin', '서하린 씨는 왜 아무 말도 안 해요?', "Why isn't Harin saying anything?", { next: 'harin' }),
          opt('plan', '가게는 어떻게 하려고요?', 'What about the shop?', {
            say: ['회사는 정리했어요? 가게는 어떻게 하려고요?', "Have you sorted things at work? And what about the shop?"], next: 'plan' }),
        ],
        note: ['나기범 씨가 먼저 말을 걸어 왔다. 회사를 그만두고 낚시로 살겠다고, 서하린 씨는 아무 말도 안 한다고 했다. 무늬오징어 두 마리를 나란히 올리면서 다 말하겠으니, 내 생각을 말해 달라고 했다.',
          "Gibeom spoke to me first. He was quitting his job to live by fishing, and Harin wasn't saying anything. While we landed two bigfin squid side by side he'd tell me everything — and then he wanted to hear what I thought."],
      }),
      listen_first: scene([
        line(G, '…네. 그게 좋아요.', "...Okay. That's good."),
        line(G, '말은 제가 잘 못하니까, 던지면서 할게요.', "I'm not good with words, so I'll talk while we cast."),
        line(G, '다 듣고 나서, {player} 씨 생각 말해 줘요.', "Once you've heard it all, tell me what you think, {player}."),
      ], {
        end: endTalk({ accept: true, offer: 'listen_first' }),
        note: ['뭐라고 할지는 다 듣고 나서 하겠다고 했다. 나기범 씨는 에기를 하나 내밀며, 던지면서 말하겠다고 했다.',
          "I said I'd give my view once I'd heard everything. Gibeom held out an egi and said he'd talk while we cast."],
      }),
      harin: scene([
        line(G, '…모르겠어요. 말리면 제가 안 들을 걸 알고, 도우면 제가 미안해할 걸 알아서요. 아마.', "...I don't know. She knows I won't listen if she tries to stop me, and that I'll feel bad if she helps. Probably."),
        line(G, '하린이는 원래 말이 많아요. 근데 이번엔 조용해요. 그게 더 무서워요.', "Harin usually talks a lot. But this time she's quiet. That scares me more.", { act: 'look_away' }),
        line(P, '그래서 저한테 묻는 거군요.', "So that's why you're asking me."),
        line(G, '…네. 오징어 낚으면서 들어 줘요.', "...Yes. Listen while we fish for squid."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_harin' }),
        note: ['서하린 씨가 왜 조용한지 물었다. 말리면 안 들을 걸 알고, 도우면 미안해할 걸 알아서일 거라고 했다. 원래 말 많은 사람이 조용하니 더 무섭다고.',
          "I asked why Harin was so quiet. She knows he won't listen if she objects and he'll feel bad if she helps, he said. A talker gone silent was what scared him most."],
      }),
      plan: scene([
        line(G, '회사엔 벌써 말했어요. 가게는 계속해요. 손님은 없어도 칼은 안 놔요.', "I've already told work. The shop stays open. No customers, but I'm not putting the knife down."),
        line(P, '(말이 평소보다 빠르다. 여러 번 연습한 말 같다.)', "(He's talking faster than usual. It sounds rehearsed.)"),
        line(G, '계산도 해 봤어요. 모자라요. 그래도 해요.', "I've done the maths. It doesn't add up. I'm doing it anyway."),
      ], {
        choices: [
          opt('details', '자세한 건 낚으면서 들을게요', "Tell me the details while we fish", {
            end: endTalk({ accept: true, offer: 'ask_plan',
              lineKo: '…네. 무늬오징어 두 마리, 나란히요. 그동안 다 말할게요.',
              lineEn: "...Okay. Two bigfin squid, side by side. I'll tell you all of it." }),
            note: ['회사엔 이미 말했고, 가게는 손님이 없어도 계속한다고 했다. 계산해 보니 모자라지만 그래도 한다고. 자세한 건 낚으면서 듣기로 했다.',
              "He'd already told work, and he'd keep the shop going with no customers. The numbers didn't add up, but he was doing it anyway. I'd hear the details while we fished."] }),
          opt('celebrate', '퇴사 기념 낚시네요. 오징어는 제가 먼저요', "A quitting-day trip, then. I'll catch the first squid", {
            say: ['퇴사 기념 낚시네요? 그럼 오징어는 제가 먼저 잡을게요.', "So it's a quitting-day trip? Then I'm catching the first squid."], next: 'celebrate' }),
        ],
        note: ['나기범 씨는 회사엔 벌써 말했고, 가게는 손님이 없어도 계속한다고 했다.', "Gibeom had already told work, and the shop would carry on, customers or not."],
      }),
      celebrate: scene([
        line(G, '…기념이요?', '...Celebrating?', { act: 'look_up' }),
        line(G, '그렇게 말해 준 사람은 {player} 씨가 처음이에요.', "You're the first person to put it that way, {player}."),
        line(G, '먼저 잡아요. 저는 오늘 손이 좀 무거워요. 두 마리 나란히 올리면서 얘기해요. 축하는 그다음에 해 줘요.', "Go ahead and catch first. My hands are a bit heavy today. Let's talk while we land two side by side. Save the congratulations for after."),
      ], {
        end: endTalk({ accept: true, offer: 'celebrate' }),
        note: ['퇴사 기념 낚시냐고 했더니, 나기범 씨는 입꼬리가 조금 올라가며 그렇게 말해 준 사람은 처음이라고 했다.',
          "When I called it a quitting-day trip, the corner of Gibeom's mouth lifted. I was the first to put it that way, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-3 — 끝내는 자리(결심을 다 들은 뒤 · 서하린도 곁에 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n05_3_done', questId: 'N05-3', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        act(G, 'sigh'),
        line(G, '…다 말했어요.', "...That's all of it."),
        line(P, '끝까지 들었어요.', 'I heard every word.'),
        line(G, '들어 줬네요. …고마워요.', "You listened. ...Thank you."),
        line(G, '이제 생각 말해 줘요. 하린이한테는… 들은 대로 전해 줘요.', "Now tell me what you think. And Harin... tell her what you heard."),
        line(P, '(서하린 씨가 조금 떨어진 바위에서 이쪽을 보고 있다.)', "(Harin is watching us from a rock a little way off.)"),
      ], {
        choices: [
          opt('support', '낚시로 살 수 있어요. 나기범 씨 칼이면요', "You can live by fishing. With your knife, you can", {
            say: ['낚시로 살 수 있어요. 나기범 씨 칼이면요.', "You can live by fishing, Gibeom. With that knife of yours, you can."], next: 'support' }),
          opt('caution', '한 번 더 생각해 봐요', 'Think it over once more', {
            say: ['손님 없는 가게로 살 수 있을까요. 한 번 더 생각해 봐요.', "Can you really live on a shop with no customers? Think it over once more."], next: 'caution' }),
          opt('lesson', '그 칼로 회 뜨는 거, 한 번 더 보여 줘요', 'Show me your knife work once more', {
            say: ['결심한 사람 눈은 다르더라고요. 그 칼로 회 뜨는 거, 한 번 더 보여 줘요.', "Someone who's made up their mind looks different. Show me your knife work once more."], next: 'lesson' }),
          opt('sell_squid', '오징어 두 마리 값은 받을게요', "I'll take payment for the two squid", {
            say: ['오징어 두 마리 값은 받을게요. 가게 물건으로 써요.', "I'll take payment for the two squid. Use them as stock for the shop."],
            end: endTalk({ complete: 'sell_squid',
              lineKo: '…네. 퇴사하고 처음 들이는 물건이에요. {player} 씨가 낚은 거. 값은 제대로 쳐 줄게요. 이제 저도 장사하는 사람이니까요. 손님 오면 이 오징어부터 낼게요.',
              lineEn: "...Okay. The first stock I've bought since quitting. Squid you caught, {player}. I'll pay a proper price. I'm a shopkeeper now. When a customer comes, I'll serve these first." }),
            note: ['오징어 두 마리 값을 받고 가게 물건으로 넘겼다. 나기범 씨는 회사 이름이 찍힌 봉투를 내밀며, 이제 장사하는 사람이니 값은 제대로 치겠다고 했다.',
              "I sold him the two squid as stock for the shop. Gibeom handed over an envelope with his old company's name on it, saying he was a shopkeeper now and would pay a proper price."] }),
        ],
        note: ['제주에서 무늬오징어 두 마리를 나란히 올리며 나기범 씨의 결심을 끝까지 들었다. 다 듣고 나서, 나기범 씨는 내 생각을 말해 달라고 했다.',
          "In Jeju, landing two bigfin squid side by side, I heard Gibeom's decision through to the end. Then he asked me what I thought."],
      }),
      support: scene([
        act(G, 'silence'),
        line(P, '(서하린 씨가 카메라를 다시 들었다. 이번엔 나기범 씨를 찍으려고.)', '(Harin lifts her camera again. This time, to film Gibeom.)'),
        line(G, '…하린이 카메라가 이쪽을 보네요. 저는 늘 등 돌리고 있었는데.', "...Harin's camera is pointing this way. I always used to turn my back."),
        line(G, '그 말 오래 갖고 있을게요. 낚시로 살 수 있다는 거. 칼 쥘 때마다요.', "I'll hold on to that for a long time. That I can live by fishing. Every time I pick up the knife."),
      ], {
        end: endTalk({ complete: 'support' }),
        note: ['낚시로 살 수 있다고, 그 칼이면 된다고 말했다. 그 말을 들은 서하린 씨가 카메라를 다시 들었고, 나기범 씨는 이번엔 돌아앉지 않았다.',
          "I told him he could live by fishing — that knife was enough. Hearing it, Harin raised her camera again, and this time Gibeom didn't turn away."],
      }),
      caution: scene([
        line(G, '…생각했어요. 천 번.', "...I've thought about it. A thousand times."),
        act(G, 'laugh'),
        line(G, '말려 주는 사람이 있으니까 오히려 알겠어요. 제가 이걸 얼마나 하고 싶은지.', "Having someone try to stop me — it makes it clearer, actually. How much I want this."),
        line(G, '천한 번째로 생각해도 답은 같아요. …그래도 고마워요. 말려 줘서.', "Even the thousand-and-first time, the answer's the same. ...Still, thank you. For trying to stop me."),
      ], {
        end: endTalk({ complete: 'caution' }),
        note: ['한 번 더 생각해 보라고 말렸다. 나기범 씨는 천 번 생각했다며 웃었다. 말려 주는 사람이 있어서 오히려 얼마나 하고 싶은지 알겠다고 했다.',
          "I urged him to think it over once more. Gibeom laughed — he'd thought it over a thousand times. Being held back, he said, only showed him how much he wanted it."],
      }),
      lesson: scene([
        line(G, '…네. 이건 퇴사 기념.', "...Okay. Call it a quitting present."),
        line(G, '무늬오징어는 껍질부터 벗겨요. 지느러미 쪽을 잡고 한 번에요. 끊기면 처음부터 다시 해야 돼요.', "With bigfin squid you peel the skin first. Grab it at the fin end and do it in one go. If it tears, you start over."),
        line(P, '(회 뜨는 각도가 아까와 또 다르다.)', '(His slicing angle has changed again from earlier.)'),
        line(G, '회사에서는 이런 거 아무도 안 물어봤어요. {player} 씨는 물어보네요.', "Nobody at work ever asked me about this. You do, {player}."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['결심한 사람의 칼을 한 번 더 보여 달라고 했다. 나기범 씨는 퇴사 기념이라며, 무늬오징어 껍질은 지느러미 쪽을 잡고 한 번에 벗긴다고 가르쳐 줬다.',
          "I asked to see the knife of a man who'd made up his mind. Gibeom called it a quitting present and showed me: peel a bigfin squid from the fin end, in a single pull."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-4 「두 번째 겨울」 — 받는 자리(인천 · 카메라 없이)
  // ═══════════════════════════════════════════
  {
    id: 'n05_4_offer', questId: 'N05-4', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '오랜만이에요!', "It's been ages!", { act: 'look_up' }),
        line(P, '서하린 씨? 인천에는 어쩐 일이에요?', "Harin? What brings you to Incheon?"),
        line(H, '저 인천 발령이에요. 연안부두 근처로요.', "I've been transferred to Incheon. Near Yeonan Pier."),
        line(P, '발령이요?', 'Transferred?'),
        line(H, '네. 그래서… 만나고 싶었어요. 카메라 없이요.', "Yes. So... I wanted to see you. Without the camera."),
        line(P, '카메라 없이요?', 'Without the camera?'),
        line(H, '네. 우럭 한 마리만 같이 올려요. 밤에, 연안부두에서.', "Yes. Let's land one rockfish together. At night, at Yeonan Pier."),
        line(H, '할 얘기도 있어요.', "There's something I want to tell you, too.", { act: 'look_away' }),
      ], {
        choices: [
          opt('night_pier', '연안부두라면 가야죠. 우럭은 밤에 잘 무니까요', "Yeonan Pier — I'm there. Rockfish bite at night", {
            end: endTalk({ accept: true, offer: 'night_pier',
              lineKo: '역시! 연안부두는 밤 불빛이 예뻐요. 찍고 싶은데… 오늘은 참을게요. 카메라 없이 만나자고 한 건 저니까, 제가 지켜야죠. 우럭 한 마리, 천천히 올려요.',
              lineEn: "I knew it! The lights at Yeonan Pier are so pretty at night. I want to film them... but I'll hold off today. I'm the one who said no camera, so I'll keep to it. One rockfish, nice and slow." }),
            note: ['밤에 연안부두에서 우럭 한 마리를 같이 올리기로 했다. 서하린 씨는 부두 불빛을 찍고 싶다면서도, 카메라 없이 만나자고 한 건 자기라며 휴대폰을 주머니 깊이 넣었다.',
              "We'd land one rockfish together at Yeonan Pier at night. Harin wanted to film the pier lights, but said the no-camera rule was hers, and pushed her phone deep into her pocket."] }),
          opt('transfer', '회사 일로 인천까지 오신 거예요?', 'Did work bring you all the way to Incheon?', { next: 'transfer' }),
          opt('camera', '카메라 없이요? 서하린 씨가요?', 'No camera? You?', { next: 'camera' }),
        ],
        note: ['서하린 씨가 인천으로 발령이 났다며 찾아왔다. 카메라 없이, 밤에 연안부두에서 우럭 한 마리를 같이 올리자고 했다. 할 얘기도 있다고.',
          "Harin came to find me — she'd been transferred to Incheon. Without the camera, she wanted to land one rockfish together at Yeonan Pier at night. She had something to tell me, too."],
      }),
      transfer: scene([
        line(H, '네, 회사 일이요. 재미없는 일이에요. 유튜브만 하는 줄 알았죠?', "Yep, for work. Boring work. You thought I only did videos, didn't you?"),
        act(H, 'laugh'),
        line(H, '영상은 퇴근하고 찍었어요.', "I filmed after hours."),
        line(H, '인천엔 아는 사람이 없어요. 그래서 부른 거예요. 그냥 아는 얼굴이 보고 싶어서요.', "I don't know anyone in Incheon. That's why I called you. I just wanted to see a familiar face."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_transfer' }),
        note: ['서하린 씨는 회사 일로 인천에 왔다고 했다. 영상은 늘 퇴근하고 찍었다고. 인천엔 아는 사람이 없어서, 아는 얼굴이 보고 싶어 불렀다고 했다.',
          "Harin was in Incheon for work — she'd always filmed after hours. She knew no one here and just wanted to see a familiar face."],
      }),
      camera: scene([
        line(H, '저도 신기해요.', "Surprises me too."),
        line(H, '전갱이 잡던 밤 기억나요? 카메라 꺼 두니까 이상하게 잘 됐잖아요. 그날부터 생각했어요.', "Remember the night we caught horse mackerel? With the camera off, it went strangely well. I've been thinking about it ever since."),
      ], {
        choices: [
          opt('just_fish', '그럼 오늘은 그냥 낚시해요', "Then today we just fish", {
            end: endTalk({ accept: true, offer: 'ask_camera',
              lineKo: '네. 오늘은 진짜 그냥 낚시예요. 채널은 내일도 있으니까요. 우럭 한 마리. 밤이에요. 늦지 마요.',
              lineEn: "Yes. Today it's really just fishing. The channel will still be there tomorrow. One rockfish. At night. Don't be late." }),
            note: ['카메라 없이 만나자는 게 의외라고 했더니, 서하린 씨는 전갱이 잡던 밤 카메라를 꺼 두니 잘 됐던 걸 떠올렸다. 오늘은 그냥 낚시하기로 했다.',
              "When I said a camera-free Harin surprised me, she brought up the night of the horse mackerel, when everything went well with the camera off. Today we'd just fish."] }),
          opt('cold', '겨울밤 부두에서 우럭이 물기는 해요?', 'Do rockfish even bite on a winter night?', {
            say: ['겨울밤 부두라니, 우럭이 정말 물기는 해요?', "A pier on a winter night — will rockfish really bite?"], next: 'cold' }),
        ],
        note: ['서하린 씨는 카메라를 꺼 둔 전갱이 밤 이후로 생각이 바뀌었다고 했다.', "Harin said she'd been rethinking things since the camera-off night of the horse mackerel."],
      }),
      cold: scene([
        line(H, '물어요! 겨울엔 바위 틈 바닥에 숨어 있대요. 그래서 끌 때는 아주 느리게요.', "They bite! In winter they hide down on the bottom between the rocks. So you drag really slowly."),
        line(H, '춥긴 해요. 그러니까 오래 안 있을 거예요. 한 마리 올리면 바로 따뜻한 데 가요. 그 대신 한 마리는 꼭이에요.', "It's cold, though. So we won't stay long. Land one and we go somewhere warm. But that one fish is a must."),
      ], {
        end: endTalk({ accept: true, offer: 'cold_night' }),
        note: ['겨울밤에도 우럭이 무느냐고 물었다. 서하린 씨는 패딩 지퍼를 턱까지 올리며, 한 마리만 올리면 바로 따뜻한 데로 가자고 했다.',
          "I asked if rockfish really bite on winter nights. Harin zipped her padded jacket to her chin and said we'd head somewhere warm as soon as we landed one."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-4 — 끝내는 자리(연안부두 · 밤)
  // ═══════════════════════════════════════════
  {
    id: 'n05_4_done', questId: 'N05-4', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '올렸다! 우럭이에요.', "Got it! A rockfish.", { act: 'look_up' }),
        line(P, '두 번째 겨울이네요.', 'Our second winter.'),
        line(H, '맞아요. 그리고… 할 얘기요.', "That's right. And... the thing I wanted to tell you."),
        line(H, '기범 오빠 가게에 손님 생겼어요.', "Gibeom's shop has customers now."),
        line(P, '정말요?', 'Really?'),
        line(H, '제 영상 보고 왔대요. 오빠가 생선만 다듬다 끝나는, 재미없는 영상이요.', "They came because of my video. The boring one where Gibeom just cleans fish from start to finish."),
        act(H, 'laugh'),
        line(P, '(웃음이 났다. 서하린 씨도 웃었다.)', '(I laughed. So did Harin.)'),
      ], {
        choices: [
          opt('glad', '재미없는 영상이 손님을 만들었네요. 진짜라서요', "The boring video brought customers. Because it was real", {
            say: ['재미없는 영상이 손님을 만들었네요. 진짜라서요.', "The boring video brought in customers. Because it was real."], next: 'glad' }),
          opt('lesson', '야간 우럭 채비, 처음이랑 다르던데요', 'Your night rockfish rig has changed', {
            say: ['서하린 씨 야간 우럭 채비, 처음 볼 때랑 다르던데요. 배우고 싶어요.', "Your night rockfish rig isn't what it was when we met. I'd like to learn it."], next: 'lesson' }),
          opt('pay', '재회 기념 출연료… 카메라 없었죠', "A reunion appearance fee... there was no camera", {
            end: endTalk({ complete: 'pay',
              lineKo: '없었죠! 그래도 드릴게요. 인천 발령 축하금, 나눠요. 받은 축하금을 나누는 거라 좀 이상하죠. 그래도 인천 와서 처음 본 아는 얼굴이 그쪽이에요. 아는 얼굴한테 쓰는 돈이 제일 안 아까워요.',
              lineEn: "There wasn't! I'll give you something anyway. Let's split my transfer bonus. Sharing out congratulation money is a bit weird, I know. But you're the first familiar face I've seen since coming to Incheon. Money spent on a familiar face is never wasted." }),
            note: ['카메라도 없었는데 출연료 얘기를 꺼냈다. 서하린 씨는 웃으며 인천 발령 축하금을 나눴다. 인천에서 처음 본 아는 얼굴이 나라서 아깝지 않다고.',
              "I joked about an appearance fee with no camera. Harin laughed and split her transfer bonus with me — I was the first familiar face she'd seen in Incheon, so it wasn't wasted."] }),
          opt('ask_her', '서하린 씨는요? 인천 생활은 괜찮아요?', "And you, Harin? Is Incheon treating you well?", { next: 'ask_her' }),
        ],
        note: ['연안부두에서 밤에 우럭 한 마리를 올렸다. 카메라는 없었다. 서하린 씨가 말했다. 나기범 씨 가게에 손님이 생겼다고, 생선만 다듬는 재미없는 영상을 보고 왔다고. 나는 웃었다. 서하린 씨도.',
          "We landed one rockfish at Yeonan Pier at night. No camera. Harin told me Gibeom's shop had customers now — they'd come after watching her boring video of him cleaning fish. I laughed. So did she."],
      }),
      glad: scene([
        line(H, '…그 말 오빠한테 전할게요.', "...I'll pass that on to Gibeom."),
        line(H, '이거 보세요. 가게 사진이에요. 카운터에 손님 셋.', "Look at this. A photo of the shop. Three customers at the counter."),
        line(P, '(휴대폰 속 카운터에 손님 셋이 앉아 있다.)', '(On her phone, three customers sit at the counter.)', { act: 'peer' }),
        line(H, '진짜라서. 그 말 좋네요. 올릴 때 엄청 고민했거든요. 너무 재미없어서요. 근데 그걸 보고 왔대요. 손님이.', "Because it was real. I like that. I agonised over posting it — it was so boring. But that's what brought them. Customers."),
      ], {
        end: endTalk({ complete: 'glad' }),
        note: ['재미없는 영상이 진짜라서 손님을 만들었다고 했다. 서하린 씨는 그 말을 나기범 씨에게 전하겠다며, 카운터에 손님 셋이 앉은 가게 사진을 보여 줬다.',
          "I said the boring video brought customers because it was real. Harin promised to pass that on to Gibeom and showed me a photo of the shop — three customers at the counter."],
      }),
      lesson: scene([
        line(H, '저도 두 번째 겨울이니까요.', "It's my second winter too, you know."),
        line(H, '처음엔 화면에 예쁜 색만 골랐어요. 이제는 어두운 색이요. 밤 우럭은 윤곽을 보고 문대요.', "At first I only picked colours that looked pretty on screen. Now I go dark. At night, rockfish bite at the silhouette."),
        line(P, '윤곽이요.', 'The silhouette.'),
        line(H, '바닥을 천천히 긁어요. 그게 다예요.', "Scrape the bottom slowly. That's all there is."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['서하린 씨에게 야간 우럭 채비를 배웠다. 처음엔 화면에 예쁜 색만 골랐지만, 밤 우럭은 윤곽을 보고 무니 이제는 어두운 색을 쓴다고.',
          "Harin showed me her night rockfish rig. She used to pick colours that looked good on camera; now she uses dark ones, because at night rockfish bite at the silhouette."],
      }),
      ask_her: scene([
        line(H, '…괜찮아요.', "...I'm okay.", { act: 'look_sea' }),
        line(H, '아니, 아직 잘 모르겠어요. 아는 사람이 없어서 밤에 부두에 자주 나와요.', "No — I don't really know yet. I don't know anyone, so I come out to the pier a lot at night."),
        line(H, '오늘은 덜 외로웠어요. 그쪽이 와서요. 그거면 된 거죠. 두 번째 겨울은요.', "Tonight was less lonely. Because you came. That's enough, isn't it? For a second winter."),
      ], {
        end: endTalk({ complete: 'ask_her' }),
        note: ['서하린 씨에게 인천 생활은 괜찮으냐고 물었다. 아는 사람이 없어 밤마다 부두에 나온다고, 오늘은 내가 와서 덜 외로웠다고 했다.',
          "I asked Harin how life in Incheon was. She knew no one and came to the pier most nights, she said — but tonight was less lonely, because I came."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-5 「손님 두 명」 — 받는 자리(속초 재개관 · 첫 예약 · 나기범과 서하린이 함께 왔다)
  // ═══════════════════════════════════════════
  {
    id: 'n05_5_offer', questId: 'N05-5', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '…{player} 씨. 첫 예약이에요.', '...{player}. Your first booking.', { act: 'look_up' }),
        line(H, '저희 둘이요!', "It's us two!"),
        line(P, '두 분이 첫 손님이에요?', "You two are my first guests?"),
        line(G, '네. 돈 내고 타요.', "Yes. We're paying."),
        line(P, '친구끼리 무슨 돈을…', 'Between friends? You don\'t need to pay...'),
        line(G, '친구니까 더 정가로요.', "Because we're friends — full price."),
        line(H, '촬영은요, 출항 전에 정식으로 여쭤볼 거예요.', "And about filming — I'll ask you properly before we set out."),
        line(P, '(처음으로 돈을 받고 친구를 태운다. 이상한 기분이다.)', '(For the first time, I take friends out for money. It feels strange.)'),
        line(G, '두 사람 몫 낚아 주세요. 회도요. 그게 이 배 첫 장사예요.', "Catch enough for the two of us. Sashimi too. That's this boat's first business."),
      ], {
        choices: [
          opt('sign_up', '명부에 이름부터 써 주세요', 'Sign the passenger list first', {
            say: ['첫 예약 손님이 두 분이라니. 명부에 이름부터 써 주세요.', "My first booking is you two. Sign the passenger list first, then."], next: 'sign_up' }),
          opt('free', '이번엔 그냥 타세요', 'Ride free this time', {
            say: ['친구한테 돈 받기는 좀 그래요. 이번엔 그냥 타세요.', "Taking money from friends feels wrong. Ride free this time."], next: 'free' }),
          opt('camera', '카메라는 뭘 물어볼 건데요?', 'What will you ask about the camera?', {
            say: ['카메라는 물어본다고요? 뭘 물어볼 건데요?', "You'll ask about the camera? Ask what?"], next: 'camera' }),
        ],
        note: ['재개관식에 들어온 내 배의 첫 예약 손님은 나기범 씨와 서하린 씨였다. 친구니까 더 정가로 내겠다며, 두 사람 몫을 낚아 회를 떠 달라고 했다.',
          "The first booking on my boat after the reopening was Gibeom and Harin. Because we were friends, they'd pay full price — and asked me to catch enough for two and serve it as sashimi."],
      }),
      sign_up: scene([
        line(G, '…네. 쓸게요. 하린이가 먼저 쓴대요.', "...Okay. We'll sign. Harin wants to go first."),
        line(P, '(서하린 씨가 펜을 뺏어 들고 크게 썼다. 나기범 씨는 그 아래에 작게.)', '(Harin snatches the pen and writes big. Gibeom writes small underneath.)'),
        line(G, '신분증도 챙겨 왔어요. 배 타려면 필요하잖아요. 제대로 하고 싶었어요. 이제 나가요, 바다.', "We brought ID too. You need it to board. We wanted to do it properly. Let's go — out to sea."),
      ], {
        end: endTalk({ accept: true, offer: 'sign_up' }),
        note: ['명부에 이름부터 쓰라고 했다. 서하린 씨는 크게, 나기범 씨는 그 아래 작게 썼다. 배를 타려면 필요하다며 신분증까지 챙겨 왔다.',
          "I had them sign the passenger list first. Harin wrote big; Gibeom wrote small underneath. They'd even brought ID, since you need it to board."],
      }),
      free: scene([
        line(G, '…안 돼요. 그럼 저희가 손님이 아니잖아요.', "...No. Then we wouldn't be guests."),
        line(H, '맞아요!', "Exactly!", { act: 'shake_head' }),
        line(G, '공짜로 태우면 이 배가 그냥 친구 배가 돼요. 저희는 선장 배를 타고 싶어요. 정가 받아요. 그래야 다음에도 예약하죠.', "If you take us free, this becomes just a friend's boat. We want to ride a skipper's boat. Take full price. That's how we book again."),
      ], {
        end: endTalk({ accept: true, offer: 'offer_free' }),
        note: ['친구니까 그냥 타라고 했다가 둘 다에게 거절당했다. 공짜로 태우면 선장 배가 아니라 친구 배가 된다고, 정가를 받아야 다음에도 예약한다고 했다.',
          "I offered them a free ride and both refused. Free, it would be a friend's boat, not a skipper's — take full price, they said, so they could book again."],
      }),
      camera: scene([
        line(G, '…하린이가 질문을 적어 왔어요.', "...Harin wrote her questions down."),
        line(H, '찍어도 되는지, 얼굴이 나와도 되는지, 다른 손님이 있으면 그분들한테도요.', "Whether I can film, whether faces can show, and the same for any other passengers."),
        line(P, '(수첩을 펼치자 동의서 묶음이 나왔다.)', '(She opens her notebook — it\'s a bundle of consent forms.)'),
        line(G, '그 동의서, 첫 서명이 {player} 씨였잖아요. 이번엔 이 배에서 저희가 받아요.', "That consent form — your signature was the first one, {player}. This time, on this boat, we'll be the ones collecting them."),
      ], {
        choices: [
          opt('forms', '좋아요. 출항 전에 다 받아요', 'Good. Collect them all before we leave', {
            aff: { [H]: 0.03 },
            end: endTalk({ accept: true, offer: 'ask_camera',
              lineKo: '…네. 출항 전에 다 받을게요.',
              lineEn: "...Okay. We'll have them all before we set out." }),
            note: ['서하린 씨는 내가 첫 서명을 했던 동의서 묶음을 가져왔다. 이번엔 내 배에서 출항 전에 동의서를 받기로 했다.',
              "Harin had brought a bundle of the consent forms I'd been the first to sign. This time they'd collect them on my boat before we set out."] }),
          opt('no_jumping', '서하린 씨, 이번엔 안 뛰겠죠?', "Harin — no jumping this time, right?", {
            say: ['서하린 씨, 이번엔 배 위에서 안 뛰겠죠?', "Harin — you won't jump around on deck this time, right?"], next: 'no_jumping' }),
        ],
        note: ['서하린 씨는 찍어도 되는지, 얼굴이 나와도 되는지, 다른 손님에게도 물을 질문을 적어 왔다.', "Harin had written out her questions: can she film, can faces show, and the same for other passengers."],
      }),
      no_jumping: scene([
        line(H, '…뛴 거 기억하시네요.', "...You remember the jumping.", { act: 'look_away' }),
        line(G, '이번엔 제가 옆에 붙어 있을게요.', "This time I'll stick right beside her."),
        line(G, '선상 매너는 그때 다 배웠어요. 오늘은 선장 말 들을게요. 그게 셋째 매너였잖아요. 출항해요.', "We learned all the boat manners back then. Today we'll listen to the skipper. That was the third rule. Let's cast off."),
      ], {
        end: endTalk({ accept: true, offer: 'no_jumping' }),
        note: ['이번엔 배 위에서 안 뛰겠느냐고 했더니 서하린 씨가 얼굴을 가렸다. 나기범 씨는 옆에 붙어 있겠다며, 선장 말을 듣는 게 셋째 매너였다고 했다.',
          "When I asked if Harin would stay off her feet this time, she covered her face. Gibeom promised to stick by her — listening to the skipper was the third rule, after all."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-5 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n05_5_done', questId: 'N05-5', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(H, '회 진짜 맛있었어요! 별 다섯이에요.', "The sashimi was amazing! Five stars."),
        line(G, '정가 냈어요. 친구니까요.', "We paid full price. Because we're friends."),
        line(H, '오빠도 한 접시 떴어요. 선장 몫이래요.', "Gibeom made a plate too. He says it's the skipper's share."),
        line(P, '(명부 첫 줄에 두 사람 이름이 나란히 있다.)', "(The first line of the passenger list holds their two names, side by side.)"),
        line(G, '…이제 진짜 선장이네요.', "...You're a real skipper now.", { act: 'nod' }),
      ], {
        choices: [
          opt('full', '정가로 받았어요. 친구니까요', 'I took full price. Because we are friends', { next: 'full' }),
          opt('lesson', '배 위에서 회 뜨는 각도, 봤어요', 'I watched your angle cutting sashimi on board', {
            say: ['나기범 씨가 배 위에서 회 뜨는 걸 봤어요. 흔들리는 데서 그 각도요.', "I watched you make sashimi on the boat, Gibeom. That angle, with the deck moving."], next: 'lesson' }),
          opt('pay', '정가에 팁까지 받을게요', "Full price, plus a tip", {
            say: ['정가에 팁까지 받을게요.', "I'll take full price — and a tip."], aff: { [H]: 0.02 }, next: 'pay' }),
          opt('rate_me', '배 모는 거, 거친 데 말해 줘요', 'Tell me where my boat-handling was rough', {
            say: ['손님으로 타 보니 어땠어요? 배 모는 거, 거친 데 있으면 말해 줘요.', "How was it as a passenger? If anything about my handling was rough, tell me."], next: 'rate_me' }),
        ],
        note: ['첫 예약 손님 두 사람 몫을 낚아 배 위에서 회를 떴다. 서하린 씨는 이번엔 물어보고 카메라를 켰다. 나기범 씨도 선장 몫이라며 한 접시를 떠 줬다. 두 사람은 정가를 냈다.',
          "I caught enough for my first two guests and made sashimi on board. This time Harin asked before turning on her camera. Gibeom cut a plate for the skipper in return. They paid full price."],
      }),
      full: scene([
        line(G, '그게 맞아요.', "That's right."),
        line(G, '…처음 배 탔던 날 기억나요. 하린이랑 {player} 씨랑 저. 그때는 다른 분이 선장이었죠.', "...I remember the first day we went out. Harin, {player} and me. Someone else was skipper then."),
        line(G, '이제는 아니에요. 그래서 정가 내고 싶었어요. 선장한테는 정가를 내는 거니까요.', "Not anymore. That's why we wanted to pay full price. You pay a skipper full price."),
      ], {
        end: endTalk({ complete: 'full' }),
        note: ['정가로 받았다고, 친구니까라고 했다. 나기범 씨는 셋이 처음 배를 탔던 날을 떠올리며, 이제는 내가 선장이라 정가를 내고 싶었다고 했다. 두 사람이 후기 첫 줄에 별 다섯을 적었다.',
          "I said I'd taken full price, because we were friends. Gibeom recalled the first day the three of us went out — someone else was skipper then; now it was me, so they wanted to pay in full. They gave the first review five stars."],
      }),
      lesson: scene([
        line(G, '배 위 회는 각도가 달라요. 파도에 맞춰요.', "Sashimi on a boat takes a different angle. You match it to the waves."),
        line(G, '배가 내려앉을 때 칼을 당기고, 올라올 때는 쉬어요. 거꾸로 하면 손을 베요.', "Pull the knife as the boat drops, rest as it rises. Do it the other way round and you cut your hand."),
        line(G, '그리고 이 배는 흔들림이 순해요. 칼 쓰기 좋은 배예요. 선장이 그렇게 몰아서요.', "And this boat rocks gently. It's a good boat for knife work. Because of how the skipper drives it."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['나기범 씨에게 배 위에서 회 뜨는 법을 배웠다. 배가 내려앉을 때 칼을 당기고, 올라올 때는 쉰다. 내 배는 흔들림이 순해서 칼 쓰기 좋다고 했다.',
          "Gibeom taught me sashimi at sea: pull the knife as the boat drops, rest as it rises. He said my boat rocks gently — good for knife work."],
      }),
      pay: scene([
        line(H, '팁! 당연하죠! 첫 손님이니까요.', "A tip! Of course! We're the first guests."),
        line(G, '…정가에 팁. 맞아요.', "...Full price and a tip. Fair.", { act: 'nod' }),
        line(H, '회가 맛있으면 팁을 주는 거래요. 제 말로는요! 오늘 회는 오빠도 떴지만요.', "If the sashimi's good, you tip. That's my rule! Even if Gibeom cut some of it today."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['정가에 팁까지 받겠다고 했다. 서하린 씨는 첫 손님이니 당연하다며 봉투에 팁을 더 넣었고, 나기범 씨는 봉투를 한 번 더 확인하고 고개를 끄덕였다.',
          "I asked for full price plus a tip. Harin said of course, first guests, and slipped more into the envelope; Gibeom checked it once more and nodded."],
      }),
      rate_me: scene([
        line(G, '…거친 데는 없었어요. 하나만요.', "...Nothing rough. Just one thing."),
        line(G, '회 뜰 때 뱃머리를 바람 쪽으로 세워 주면 더 좋아요. 흔들림이 앞뒤로만 와요.', "When someone's cutting sashimi, point the bow into the wind. Then the rocking only comes front to back."),
        line(P, '(손으로 뱃머리 방향을 그려 보인다. 배를 세우는 감이 잡힌다.)', '(He sketches the bow angle with his hand. I start to get a feel for holding the boat.)'),
        line(G, '손님이 칼 쓸 때 배가 옆으로 구르면 무서워요. 그걸 손님한테 물어보는 선장이네요. 좋은 선장이에요.', "When a passenger's using a knife, rolling side to side is scary. And you're a skipper who asks passengers about it. A good skipper."),
      ], {
        end: endTalk({ complete: 'rate_me' }),
        note: ['배 모는 데 거친 곳이 있었는지 물었다. 나기범 씨는 회 뜰 때 뱃머리를 바람 쪽으로 세우면 흔들림이 앞뒤로만 온다고 알려 주고, 그걸 묻는 선장이라 좋다고 했다.',
          "I asked if my boat-handling had been rough anywhere. Gibeom said to point the bow into the wind when someone's cutting sashimi, so the rocking only comes front to back — and that a skipper who asks is a good one."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-6 「구독자 없는 방송」 — 받는 자리(시청자 셋 · 나기범은 카메라를 등지고 앉았다)
  // ═══════════════════════════════════════════
  {
    id: 'n05_6_offer', questId: 'N05-6', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '오늘 라이브 해요!', "I'm doing a live stream today!", { act: 'look_up' }),
        line(P, '라이브요?', 'Live?'),
        line(H, '네. 근데… 시청자가 셋이에요.', "Yep. Only... there are three viewers."),
        line(P, '셋이요?', 'Three?'),
        line(H, '셋이요. 그래도 방송은 해요.', "Three. But the show goes on."),
        line(H, '손질 좀 보여 주세요. 원물 한 마리요. 도마 앞에 서시면 켤게요.', "Show them some fish cleaning. One whole fish. I'll go live when you're at the board."),
        line(P, '나기범 씨는요?', 'What about Gibeom?'),
        line(H, '오빠는 등 돌리고 있을 거예요. 늘 그래요.', "Gibeom will have his back to the camera. He always does.", { act: 'look_away' }),
        line(P, '(나기범 씨는 벌써 카메라를 등지고 앉아, 말없이 칼을 놀리고 있다.)', '(Gibeom is already sitting with his back to the camera, working his knife in silence.)'),
      ], {
        choices: [
          opt('for_three', '시청자가 셋이면, 셋한테 제대로요', "If there are three viewers, we do it right for three", {
            say: ['보여 드릴게요. 시청자가 셋이면, 셋한테 제대로요.', "I'll show them. If there are three viewers, we do it properly for those three."],
            end: endTalk({ accept: true, offer: 'for_three',
              lineKo: '…그 말 좋네요. 셋한테 제대로. 오늘 방송 제목도 정했어요. 셋을 위한 손질. 시작해요.',
              lineEn: "...I like that. Properly, for three. I've got today's stream title, too. Fish cleaning for three. Let's start." }),
            note: ['시청자가 셋이면 셋한테 제대로 보여 주겠다고 했다. 서하린 씨는 그 말을 화면 구석에 자막으로 띄우고, 방송 제목을 셋을 위한 손질로 정했다.',
              "I said if there were three viewers, we'd do it properly for those three. Harin put the words up as a caption in the corner and titled the stream Fish Cleaning for Three."] }),
          opt('back', '나기범 씨는 왜 등을 지고 앉아요?', "Why does Gibeom sit with his back to the camera?", { next: 'back' }),
          opt('nerve', '카메라 앞에서는 손이 떨릴 것 같아요', "I think my hands will shake on camera", { next: 'nerve' }),
        ],
        note: ['서하린 씨가 라이브 방송을 하는데 시청자가 셋이라고 했다. 그래도 방송은 한다며, 원물 한 마리를 손질해 보여 달라고 했다. 나기범 씨는 늘 그렇듯 카메라를 등지고 앉았다.',
          "Harin was going live, with three viewers. The show would go on anyway, and she asked me to clean one whole fish for them. As always, Gibeom sat with his back to the camera."],
      }),
      back: scene([
        line(H, '몰라요. 물어보면 그냥 이게 편하대요.', "No idea. When I ask, he just says it's more comfortable."),
        line(P, '(칼 소리도 거의 나지 않는다.)', '(His knife barely makes a sound.)'),
        line(H, '오빠는 원래 말로 설명 안 해요. 대신 손이 해요. 그쪽 손질도 그렇게 보여 주면 돼요. 말 안 해도 돼요, 진짜로.', "Gibeom never explains things in words. His hands do it. You can show your cleaning the same way. You don't have to talk, honestly."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_back' }),
        note: ['나기범 씨가 왜 카메라를 등지는지 물었다. 그냥 편하다고 한다고. 말 대신 손이 설명하는 사람이니, 나도 말없이 손으로 보여 주면 된다고 했다.',
          "I asked why Gibeom sits with his back to the camera. He just says it's comfortable. He explains with his hands, not words — and I could show mine the same way."],
      }),
      nerve: scene([
        line(H, '떨려도 돼요! 보는 사람 셋이에요. 그중 둘은 여기 있고요.', "Shaking's fine! Three people are watching. And two of them are right here."),
        act(H, 'laugh'),
        line(H, '떨리는 것도 진짜잖아요. 저는 그게 더 좋아요.', "Shaky hands are real too. I like that better, honestly."),
      ], {
        choices: [
          opt('slowly', '그럼 천천히 해 볼게요', "Then I'll take it slowly", {
            end: endTalk({ accept: true, offer: 'nervous',
              lineKo: '네, 천천히요. 생선은 이미 잡혔으니까 도망 안 가요.',
              lineEn: "Yes, slowly. The fish has already been caught — it isn't going anywhere." }),
            note: ['카메라 앞에서 손이 떨릴 것 같다고 했다. 서하린 씨는 보는 사람 셋 중 둘이 여기 있다며, 떨리는 것도 진짜라 더 좋다고 했다.',
              "I said my hands would shake on camera. Harin pointed out two of the three viewers were right here — and shaking was real, which she liked better."] }),
          opt('hands_only', '얼굴은 빼고 손만 나오게 해 주세요', 'Leave my face out — just my hands', {
            say: ['얼굴은 빼고 손만 나오게 해 주세요.', "Please keep my face out of it. Just my hands."], next: 'hands_only' }),
          opt('refuse', '아무래도 카메라 앞은 못 하겠어요', "I don't think I can do it on camera", {
            say: ['죄송해요. 아무래도 카메라 앞은 못 하겠어요.', "I'm sorry. I really don't think I can do this on camera."], next: 'refuse' }),
        ],
        note: ['서하린 씨는 떨려도 된다고, 보는 사람 셋 중 둘이 여기 있다고 했다.', 'Harin said shaking was fine — two of the three viewers were right here.'],
      }),
      hands_only: scene([
        line(H, '당연하죠! 이번엔 먼저 물어보려고 했어요. 진짜예요.', "Of course! I was going to ask first this time. Really."),
        line(H, '카메라를 도마 쪽으로 낮출게요. 칼 쥔 손이랑 생선만 나오게요.', "I'll lower the camera to the board. Just the hand holding the knife, and the fish."),
        line(H, '원하면 끝나고 다시 보기도 먼저 보여 드릴게요. 그럼 시작할까요? 셋이 기다려요.', "If you want, I'll show you the replay before anyone else. Shall we start? Three people are waiting."),
      ], {
        end: endTalk({ accept: true, offer: 'hands_only' }),
        note: ['얼굴은 빼 달라고 했다. 서하린 씨는 이번엔 먼저 물어보려 했다며 카메라를 도마 쪽으로 낮추고, 끝나면 다시 보기도 먼저 보여 주겠다고 했다.',
          "I asked to keep my face out. Harin said she'd meant to ask first this time, lowered the camera to the board, and promised to show me the replay first."],
      }),
      refuse: scene([
        line(H, '…괜찮아요. 싫은 건 싫은 거니까요. 그건 이제 저도 알아요.', "...That's okay. No means no. I've learned that much.", { act: 'nod' }),
        line(H, '오늘 방송은 오빠 손만 비출게요. 등 돌린 채로요.', "I'll just show Gibeom's hands today. Back turned and all."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ fail: true }),
        note: ['결국 카메라 앞은 못 하겠다고 거절했다. 서하린 씨는 싫은 건 싫은 거라며, 오늘 방송은 나기범 씨 손만 비추겠다고 했다. 미안했지만, 그게 맞다고 생각했다.',
          "In the end I said I couldn't do it on camera. Harin said no means no, and she'd only show Gibeom's hands on today's stream. I felt bad, but I thought it was right."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-6 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n05_6_done', questId: 'N05-6', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '끝났어요!', "That's a wrap!", { act: 'look_up' }),
        line(H, '시청자 다섯으로 늘었어요! 두 명이요, 두 명!', "We went up to five viewers! Two more! Two!"),
        line(P, '손질하는 동안 나간 사람은요?', 'Did anyone leave while I was cleaning?'),
        line(H, '한 명도 없어요. 끝까지 봤어요. 재미없는데도요.', "Not one. They watched to the end. Even though it was boring."),
        act(H, 'laugh'),
        line(H, '그리고 오빠가 말했어요.', "And Gibeom said something."),
        line(G, '…재미없어도, 진짜면 돼요.', "...Boring's fine, as long as it's real."),
        line(P, '(나기범 씨는 여전히 등을 돌린 채였다.)', '(Gibeom still has his back turned.)'),
      ], {
        choices: [
          opt('lesson', '뼈를 따는 각도가 저와 달랐어요', 'Your angle along the bone was different from mine', {
            say: ['나기범 씨 손질을 뒤에서 봤어요. 뼈를 따는 각도가 저와 달랐어요.', "I watched you clean from behind, Gibeom. Your angle along the bone wasn't like mine."], next: 'lesson' }),
          opt('pay', '출연료로 받을게요', "I'll take an appearance fee", {
            end: endTalk({ complete: 'pay',
              lineKo: '네… 시청자 다섯 명분이면… 계산대로 드리면 그쪽이 손해예요. 다섯 명이 한 시간 본 값이면 커피 한 잔도 안 돼요. 그러니까 계산 말고 제 지갑 사정대로 드릴게요. 손질 값은 손질 값이니까요.',
              lineEn: "Okay... five viewers' worth would be... if I go by the numbers, you lose out. Five people watching for an hour doesn't even buy a coffee. So forget the maths — I'll pay what my purse can manage. Cleaning is cleaning." }),
            note: ['출연료를 받겠다고 했다. 서하린 씨는 진지하게 계산하다가, 계산대로면 커피 한 잔도 안 된다며 자기 지갑 사정대로 손질 값을 줬다.',
              "I asked for an appearance fee. Harin did the maths seriously, decided it wouldn't even buy a coffee, and paid me what her purse could manage for the cleaning."] }),
          opt('decline', '방송이 조금이라도 늘었으면 됐어요', 'If the stream grew a little, that is enough', {
            end: endTalk({ complete: 'decline',
              lineKo: '다섯이에요! 두 명 늘었어요! 두 명이 누군지는 몰라요. 근데 손질하는 동안 한 명도 안 나갔어요. 그게 제일 신기해요. 다음 방송 제목에 그쪽 손질 넣을게요.',
              lineEn: "Five! Two more! I don't know who the two are. But nobody left while you were cleaning. That's the most amazing part. Your cleaning's going in the next stream's title." }),
            note: ['시청자가 조금이라도 늘었으면 됐다고 했다. 서하린 씨는 손질하는 동안 한 명도 안 나간 게 제일 신기하다며, 다음 방송 제목에 내 손질을 넣겠다고 했다.',
              "I said a few more viewers was enough. Harin said the amazing thing was that nobody left during the cleaning, and put my cleaning in the next stream's title."] }),
          opt('quiet_knife', '방송보다 나기범 씨 칼이 더 볼 만했어요', "Gibeom's knife was better viewing than the stream", {
            say: ['솔직히 방송보다 나기범 씨 조용한 칼이 더 볼 만했어요.', "Honestly, Gibeom's quiet knife was better to watch than the stream."], next: 'quiet_knife' }),
        ],
        note: ['방송 중에 원물 한 마리를 손질했다. 손이 떨렸다. 카메라 때문이 아니라 등 돌린 나기범 씨의 칼이 너무 조용해서. 시청자는 셋에서 다섯으로 늘었고, 나기범 씨는 재미없어도 진짜면 된다고 했다.',
          "I cleaned a whole fish on the stream. My hands shook — not because of the camera, but because Gibeom's knife behind me was so quiet. Viewers went from three to five, and Gibeom said boring is fine as long as it's real."],
      }),
      lesson: scene([
        line(H, '오빠, 이분이 봤대요!', "Gibeom! This one noticed!"),
        line(G, '…칼은 짧게 잡아요.', "...Hold the knife short."),
        line(G, '뼈를 따라갈 땐 손목 말고, 팔꿈치로 밀어요.', "When you follow the bone, push from the elbow, not the wrist."),
        line(H, '방금 돌아앉은 거 봤어요? 방송 중에요! 다행히 손만 찍혔어요. 저는 아직 무슨 말인지 모르겠지만요.', "Did you see him turn round? Mid-stream! Luckily only his hands got filmed. I still don't get what he means, though."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['뼈를 따는 각도가 나와 달랐다고 했더니, 나기범 씨가 처음으로 돌아앉아 보여 줬다. 칼은 짧게 잡고, 뼈를 따라갈 땐 손목 말고 팔꿈치로 민다.',
          "When I said his angle along the bone wasn't like mine, Gibeom turned round for the first time to show me: hold the knife short, and push from the elbow, not the wrist, along the bone."],
      }),
      quiet_knife: scene([
        line(H, '오빠! 들었어요? …못 들은 척하네.', "Gibeom! Did you hear? ...He's pretending not to."),
        line(P, '(나기범 씨의 칼이 잠깐 멈췄다가 다시 움직였다. 아까보다 조금 느리게.)', "(Gibeom's knife stops for a moment, then moves again — a little slower than before.)"),
        line(H, '오빠 칼은 소리가 작아서 마이크에 안 잡혀요. 다음엔 마이크를 도마 옆에 둘까 봐요. 시청자 다섯이 그 소리 들으러 올지도 몰라요.', "His knife is so quiet the mic doesn't catch it. Next time maybe I'll put the mic by the board. Our five viewers might come back just for that sound."),
      ], {
        end: endTalk({ complete: 'quiet_knife' }),
        note: ['방송보다 나기범 씨의 조용한 칼이 더 볼 만했다고 했다. 나기범 씨의 칼이 잠깐 멈췄다가, 아까보다 조금 느리게 다시 움직였다.',
          "I said Gibeom's quiet knife was better viewing than the stream. His knife paused, then moved again, a little slower than before."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-7 「겨울 가게」 — 받는 자리(나기범)
  // ═══════════════════════════════════════════
  {
    id: 'n05_7_offer', questId: 'N05-7', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '…저기.', '...Um.', { act: 'look_away' }),
        line(P, '나기범 씨? 먼저 말을 거시다니, 별일이네요.', "Gibeom? You talking to me first — that's a first."),
        line(G, '…가게 냈어요. 부산에.', "...I opened a shop. In Busan."),
        line(P, '가게요? 축하해요!', 'A shop? Congratulations!'),
        line(G, '손님은… 없어요.', "Customers... there aren't any."),
        act(G, 'silence'),
        line(G, '수조만 돌아가요.', "Just the tanks running."),
        line(P, '…', '...'),
        line(G, '회 좀 떠 줄래요. 손님 없어도, 회는 떠야 가게죠.', "Would you make some sashimi? No customers, but a shop has to cut sashimi to be a shop."),
        line(P, '서하린 씨도 거기 있어요?', 'Is Harin there too?'),
        line(G, '…있어요. 카메라 대신 설거지해요.', "...She is. Washing dishes instead of filming."),
      ], {
        choices: [
          opt('congrats', '개업 축하해요. 첫 회는 제가 뜰게요', "Congratulations. I'll cut your first sashimi", {
            say: ['개업 축하해요. 첫 회는 제가 뜰게요.', "Congratulations on opening. I'll make your first sashimi."],
            end: endTalk({ accept: true, offer: 'congrats',
              lineKo: '…고마워요. 축하는 하린이 말고는 처음 들어요. 수조에 있는 걸로 떠 주세요. 칼은 제 거 써요. 손에 맞을 거예요. 손님 없어도, 오늘은 가게예요.',
              lineEn: "...Thanks. You're the first apart from Harin to say congratulations. Use what's in the tanks. Use my knife. It'll fit your hand. No customers — but today, it's a shop." }),
            note: ['개업을 축하하고, 첫 회는 내가 뜨겠다고 했다. 나기범 씨는 하린이 말고는 축하를 처음 듣는다며, 수조에 있는 걸로 자기 칼을 써서 떠 달라고 했다.',
              "I congratulated him and offered to cut the first sashimi. Gibeom said I was the first besides Harin to congratulate him, and asked me to use what was in the tanks, with his knife."] }),
          opt('shop', '어떤 가게예요?', 'What kind of shop is it?', {
            say: ['수조만 돌아간다니, 어떤 가게예요?', "Just the tanks running — what kind of shop is it?"], next: 'shop' }),
          opt('harin', '서하린 씨는 왜 설거지를 해요?', 'Why is Harin washing dishes?', {
            say: ['서하린 씨는 왜 카메라 대신 설거지를 해요?', "Why is Harin washing dishes instead of filming?"], next: 'harin' }),
        ],
        note: ['나기범 씨가 부산에 작은 가게를 냈다고 했다. 손님은 없고 수조만 돌아간다고. 손님이 없어도 회는 떠야 가게라며, 회를 좀 떠 달라고 했다. 서하린 씨는 카메라 대신 설거지를 하고 있다고.',
          "Gibeom told me he'd opened a little shop in Busan. No customers, just the tanks running. A shop has to cut sashimi to be a shop, he said, and asked me to make some. Harin was washing dishes instead of filming."],
      }),
      shop: scene([
        line(G, '횟집이요. 카운터 하나 있는 작은 데요.', "A sashimi bar. A little place with one counter."),
        line(G, '수조 물은 매일 갈아요. 손님이 없어도요. 그거라도 해야 가게 같아서요.', "I change the tank water every day. Even with no customers. Doing that much makes it feel like a shop."),
        line(P, '(말이 평소보다 길다.)', '(He\'s talking more than usual.)'),
      ], {
        choices: [
          opt('visit', '그 수조, 보러 갈게요', "I'll come and see those tanks", {
            end: endTalk({ accept: true, offer: 'ask_shop',
              lineKo: '…네. 회 떠 주면 그거 저희가 먹어요. 첫 장사예요.',
              lineEn: "...Okay. If you make sashimi, we'll eat it ourselves. Our first trade." }),
            note: ['카운터 하나 있는 작은 횟집이라고 했다. 손님이 없어도 수조 물은 매일 간다고. 그 수조를 보러 가기로 했다.',
              "It's a small sashimi bar with one counter. He changes the tank water daily, customers or not. I said I'd come and see those tanks."] }),
          opt('hesitate', '남의 가게에서 제가 칼을 잡아도 될까요?', "Is it all right for me to hold the knife in your shop?", { next: 'hesitate' }),
        ],
        note: ['카운터 하나 있는 작은 횟집이라고 했다.', "It's a small sashimi bar with a single counter."],
      }),
      hesitate: scene([
        line(G, '…남의 가게 아니에요. 오늘은요.', "...It's not someone else's shop. Not today."),
        line(G, '손님이 없어서 제 칼도 요즘 쉬었어요. {player} 씨가 잡아 주면 칼도 반가워할 거예요. 수조에 있는 걸로 떠 줘요.', "With no customers, my knife's been resting lately. If you pick it up, {player}, it'll be glad. Use what's in the tanks."),
      ], {
        end: endTalk({ accept: true, offer: 'hesitate' }),
        note: ['남의 가게에서 칼을 잡아도 되겠느냐고 했더니, 나기범 씨는 새 앞치마를 내밀며 오늘은 남의 가게가 아니라고 했다.',
          "When I asked whether I could take up the knife in his shop, Gibeom held out a new apron and said it wasn't someone else's shop today."],
      }),
      harin: scene([
        line(G, '…모르겠어요. 아침부터 저래요. 찍을 게 없대요.', "...I don't know. She's been like that since morning. Says there's nothing to film."),
        line(G, '그릇은 이미 다 깨끗해요.', "The dishes are already clean.", { act: 'look_away' }),
        line(G, '저는 그게 더 고마워요. 말은 안 했어요. 회 뜨면 하린이도 와서 앉을 거예요. 그때 같이 먹어요.', "I'm more grateful for that than anything. I haven't told her. When you cut the sashimi, she'll come and sit. Let's eat together then."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_harin' }),
        note: ['서하린 씨는 아침부터 찍을 게 없다며 이미 깨끗한 그릇을 씻고 있다고 했다. 나기범 씨는 그게 더 고맙지만 말은 안 했다고 했다.',
          "Harin had been washing already-clean dishes since morning, saying there was nothing to film. Gibeom said he was more grateful for that than anything, though he hadn't told her."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N05-7 — 끝내는 자리(가게 카운터 · 셋이 회를 먹는다)
  // ═══════════════════════════════════════════
  {
    id: 'n05_7_done', questId: 'N05-7', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '…맛있네요.', "...It's good.", { act: 'nod' }),
        line(P, '나기범 씨 칼이 좋아서 그래요.', "That's your knife's doing, Gibeom."),
        line(H, '오늘은 안 찍을래요. 이게 더 좋아요.', "I'm not filming today. This is better."),
        line(G, '하린이 안 찍는대요, 오늘은. …그게 더 좋아요.', "Harin says she's not filming today. ...That's better."),
        line(P, '(나기범 씨가 웃었다. 처음 보는 얼굴이다.)', "(Gibeom smiled. I'd never seen that face before.)"),
      ], {
        choices: [
          opt('lesson', '수조 관리, 배우고 싶어요', "I'd like to learn how you keep the tanks", {
            say: ['나기범 씨 가게 수조 관리, 배우고 싶어요.', "I'd like to learn how you look after the tanks here, Gibeom."], next: 'lesson' }),
          opt('pay', '회 뜬 값은 받을게요', "I'll take payment for the sashimi", { next: 'pay' }),
          opt('decline', '첫 손님으로 쳐 주세요. 값은 됐어요', "Count me as your first customer. No charge", {
            say: ['가게 첫 손님으로 쳐 주세요. 값은 됐어요.', "Count me as the shop's first customer. No charge."], next: 'decline' }),
          opt('soup_advice', '남는 뼈로 매운탕도 내 보세요', 'Try serving spicy fish stew with the bones', {
            say: ['남는 뼈로 매운탕도 내 보세요. 버리기 아까워요.', "Try making spicy fish stew from the leftover bones. It's a shame to throw them out."], next: 'soup_advice' }),
        ],
        note: ['부산으로 돌아가 나기범 씨 가게에서 회를 떴다. 손님은 여전히 없었다. 그래도 셋이 카운터에 앉아 회를 먹었다. 서하린 씨는 오늘은 안 찍겠다고 했고, 나기범 씨가 처음으로 웃었다.',
          "Back in Busan, I made sashimi in Gibeom's shop. Still no customers. But the three of us sat at the counter and ate. Harin said she wouldn't film today, and Gibeom smiled for the first time."],
      }),
      lesson: scene([
        line(G, '…수조? 그건 저도 배우는 중이에요. 같이 봐요.', "...The tanks? I'm still learning that myself. Let's look together."),
        line(G, '아가미 색부터 봐요. 빨가면 괜찮아요. 그다음은 지느러미. 힘없이 접혀 있으면 오래 못 가요.', "Check the gill colour first. Red means healthy. Then the fins. If they hang folded and limp, the fish won't last."),
        line(G, '손님 없을 때 하루 종일 이것만 봤어요. 그래서 이건 좀 알아요.', "With no customers I spent whole days just watching this. So this much I know."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['나기범 씨에게 수조 관리를 배웠다. 아가미가 빨가면 괜찮고, 지느러미가 힘없이 접혀 있으면 오래 못 간다. 손님 없는 동안 하루 종일 그것만 봤다고 했다.',
          "Gibeom taught me to read his tanks: red gills are good, limp folded fins mean the fish won't last. He'd spent whole customerless days watching them."],
      }),
      pay: scene([
        line(G, '…네. 첫 매출이에요.', "...Okay. Our first sale."),
        line(H, '장부 첫 줄에 적었어요! 회가 떠졌으니까 가게가 일한 거예요.', "I wrote it on the first line of the ledger! Sashimi got made, so the shop did business."),
        line(G, '돈이 나가는데 첫 매출이래요. …저는 아직 잘 모르겠어요.', "Money's going out, and she calls it our first sale. ...I'm still not sure I follow."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['회 뜬 값을 받았다. 서하린 씨는 회가 떠졌으니 가게가 일한 거라며 장부 첫 줄에 내 이름을 적었다. 나기범 씨는 돈이 나가는데 첫 매출이라며 고개를 갸웃했다.',
          "I took payment for the sashimi. Harin wrote my name on the first line of the ledger — sashimi was made, so the shop had done business. Gibeom puzzled over money going out being called a first sale."],
      }),
      decline: scene([
        line(G, '…첫 손님.', "...First customer."),
        line(P, '(서하린 씨가 결국 사진 한 장을 찍었다. 카운터에 셋.)', '(Harin ends up taking one photo after all. Three at the counter.)'),
        line(G, '하린이가 안 찍는다더니 찍었네요. 괜찮아요. 올리는 사진은 아니래요. 가게 벽에 붙인대요. 첫 손님 자리에요. …{player} 씨 자리예요.', "Harin said she wouldn't film, and she took one anyway. That's fine. It's not for posting, she says. It's going on the shop wall. By the first customer's seat. ...Your seat, {player}."),
      ], {
        end: endTalk({ complete: 'decline' }),
        note: ['가게 첫 손님으로 쳐 달라고 했다. 서하린 씨가 결국 카운터에 앉은 셋을 사진으로 찍었고, 나기범 씨는 그 사진을 첫 손님 자리, 내 자리 벽에 붙이겠다고 했다.',
          "I asked to be counted as the shop's first customer. Harin ended up photographing the three of us at the counter, and Gibeom said it would go on the wall by the first customer's seat — mine."],
      }),
      soup_advice: scene([
        act(G, 'silence'),
        line(G, '…매운탕.', "...Spicy fish stew."),
        line(G, '뼈는 매일 버렸어요. 아까웠는데 방법을 몰랐어요.', "I've been throwing the bones out every day. It felt like a waste, but I didn't know what else to do."),
        line(G, '내일부터 끓여 볼게요. 하린이가 맛을 볼 거예요. 손님 없으면 저희가 먹으면 돼요. 오늘처럼요.', "I'll start making it tomorrow. Harin can taste it. If there are no customers, we'll eat it ourselves. Like today."),
      ], {
        end: endTalk({ complete: 'soup_advice' }),
        note: ['남는 뼈로 매운탕을 내 보라고 했다. 나기범 씨는 오래 생각하다 냄비를 꺼내며, 매일 버리던 뼈로 내일부터 끓여 보겠다고 했다.',
          "I suggested making spicy stew from the leftover bones. After a long think, Gibeom took out a pot and said he'd start tomorrow with the bones he'd been throwing away every day."],
      }),
    },
  },
];
