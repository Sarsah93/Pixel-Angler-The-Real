/**
 * @file StoryTalkN15.ts
 * @description 290차 — N15 「오세라 · 연태오 — 울릉」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = `StoryTalkN01.ts`(286 시범).
 *
 * 인물
 *  - 오세라(34 · 울릉 야간 편의점 점주) — 아주 짧은 해요체 · 말끝을 뚝 자른다 · 혼자가 좋다 · 거리를 재는 게 인사 · 나를 「그쪽」.
 *  - 연태오(27 · 편의점 알바 · 세라 몰래 배운 숨긴 제자) — 속삭이는 해요체 · 「쉿」 · 「아마요」 · 소리 없이 웃는다 · 세라를 「세라 씨」, 나를 「그쪽」.
 * 호칭(290): 나는 「오세라 씨」 · 「연태오 씨」.
 * 정책: N15-1은 한 번뿐(once) — 옛 미루는 답 `decline`으로 물러서는 끝이 있다. N15-2는 끝까지 듣고 「몰래는 못 한다」면 거절(실패).
 * 표시: 새로 만든 것 없음 — 옛 답의 표시(choice.n15_*)는 묶인 답이 남긴다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const SR = 'oh_sera';
const T = 'yeon_taeo';
const P = 'player';

export const TALKS_N15: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N15-1 「혼자가 좋아요」 — 받는 자리(오세라)
  // ═══════════════════════════════════════════
  {
    id: 'n15_1_offer', questId: 'N15-1', at: 'offer', npcId: SR, start: 'start',
    nodes: {
      start: scene([
        line(SR, '…낚시 가요? 이 시간에.', "...Going fishing? At this hour?", { act: 'look_up' }),
        line(P, '네. 오세라 씨도 가시는 것 같던데요. 계산대 뒤에 대가 세워져 있어서요.', "Yes. Looks like you're going too — there's a rod standing behind the counter."),
        line(SR, '가요. 가게 닫고 나면요.', "I am. After I close up."),
        line(P, '그럼 같이 가실래요? 이 섬은 아직 잘 몰라서요.', "Then want to go together? I don't know this island well yet."),
        line(SR, '혼자가 좋아요. 동행은 안 해요.', "I like being alone. I don't go with anyone."),
        line(P, '…아, 네.', "...Ah. Okay."),
        act(SR, 'silence'),
        line(SR, '대신 겨뤄요. 부시리 한 마리. 먼저 올리는 쪽이요.', "We can compete instead. One yellowtail amberjack. Whoever lands one first."),
        line(P, '겨루는 건 좋은데, 어디서요?', "Competing sounds good. But where?"),
        line(SR, '각자 자리에서요. 제 포인트는 침범하지 말고요. 매너 거리.', "Each from our own spot. Don't trespass on my point. Manner distance."),
      ], {
        choices: [
          opt('agree', '좋아요. 거리 지키고 겨뤄요', "All right. I'll keep my distance and compete", {
            say: ['좋아요. 거리 지킬게요. 겨뤄요.', "All right. I'll keep my distance. Let's compete."], next: 'agree' }),
          opt('distance', '매너 거리요? 얼마나 떨어지면 돼요?', "Manner distance? How far apart?", {
            say: ['매너 거리라는 건, 얼마나 떨어지라는 거예요?', "Manner distance — how far apart do you mean?"], next: 'distance' }),
          opt('lose', '지면 저는 뭘 하면 돼요?', "And if I lose, what do I do?", {
            say: ['겨루면 제가 질 것 같은데, 진 사람은 뭘 해요?', "I'll probably lose if we compete. What does the loser do?"], next: 'lose' }),
          opt('alone', '혼자가 좋으시면 저도 혼자 할게요', "If you like being alone, I'll fish alone too", {
            say: ['혼자가 좋으시다면, 저도 혼자 할게요.', "If you'd rather be alone, I'll fish on my own too."], next: 'alone' }),
        ],
        note: ['편의점 계산대 뒤에 세워 둔 대를 보고 같이 가자고 했다. 오세라 씨는 혼자가 좋다며 동행을 거절하고, 대신 각자 자리에서 부시리 한 마리를 겨루자고 했다. 자기 포인트는 침범하지 말라고, 매너 거리라고.',
          "Seeing the rod behind her counter, I asked Oh Sera to go fishing together. She said she likes being alone and turned me down — but offered to compete for one yellowtail amberjack from our own spots instead. Don't trespass on her point, she said. Manner distance."],
      }),
      agree: scene([
        line(SR, '좋아요. 백 미터.', "Good. A hundred meters."),
        line(SR, '제가 손을 들면 잡았다는 뜻이에요. 그쪽도 잡으면 들어요.', "If I raise my hand, it means I've caught one. You raise yours when you do."),
        line(P, '소리쳐서 알리면 안 돼요?', "Can't I just shout?"),
        line(SR, '소리는 지르지 마요. 바다가 놀라요.', "Don't shout. It startles the sea."),
      ], {
        end: endTalk({ accept: true, offer: 'agree' }),
        note: ['거리를 지키고 겨루겠다고 했다. 오세라 씨는 백 미터라고, 잡으면 손을 들자고 했다. 소리는 지르지 말라고, 바다가 놀란다고.',
          "I agreed to keep my distance and compete. A hundred meters, Sera said — raise a hand when you catch one. No shouting; it startles the sea."],
      }),
      distance: scene([
        line(SR, '정해진 건 없어요. 제 캐스팅이 닿는 데 두 배쯤이요.', "There's no fixed rule. About twice as far as my cast reaches."),
        line(SR, '그러면 줄이 엉킬 일도, 말을 섞을 일도 없어요.', "That way our lines don't tangle, and we don't have to talk."),
        line(P, '두 배면… 백 미터쯤이겠네요.', "Twice — so about a hundred meters."),
        line(SR, '섬은 좁아요. 좁은 데서 혼자 있으려면 거리를 재야 해요. 그게 제 인사예요.', "The island is small. To be alone somewhere small, you have to measure distance. That's my way of saying hello.", { act: 'look_sea' }),
      ], {
        end: endTalk({ accept: true, offer: 'ask_distance' }),
        note: ['매너 거리가 얼마냐고 물었다. 오세라 씨는 자기 캐스팅이 닿는 데의 두 배쯤이라며, 좁은 섬에서 혼자 있으려면 거리를 재야 하고 그게 자기 인사라고 했다.',
          "I asked how far manner distance was. About twice her cast, Sera said — on a small island, being alone means measuring distance, and that's her way of saying hello."],
      }),
      lose: scene([
        line(SR, '진 사람이요? …정해 둔 건 없어요.', "The loser? ...I hadn't decided."),
        act(SR, 'silence'),
        line(SR, '그럼 라면이요. 편의점 컵라면. 진 사람이 물을 붓는 거예요.', "Then ramen. Cup ramen from the store. The loser pours the water."),
        line(P, '이긴 사람은요?', "And the winner?"),
        line(SR, '먹기만 하고요. 그 정도면 공평하죠.', "Just eats. That's fair enough."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_lose' }),
        note: ['진 사람은 뭘 하느냐고 물었다. 오세라 씨는 진지하게 고민하더니, 진 사람이 컵라면에 물을 붓고 이긴 사람은 먹기만 하자고 했다.',
          "I asked what the loser does. Sera thought about it seriously, then decided: the loser pours water into the cup ramen and the winner just eats."],
      }),
      alone: scene([
        line(SR, '…네.', "...Okay."),
        act(SR, 'silence'),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['혼자가 좋다는 말을 그대로 받아, 나도 혼자 하겠다고 했다. 오세라 씨는 짧게 대답하고 더는 말하지 않았다.',
          "Taking her at her word that she likes being alone, I said I'd fish alone too. Sera answered briefly and said nothing more."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N15-1 — 끝내는 자리(오세라)
  // ═══════════════════════════════════════════
  {
    id: 'n15_1_done', questId: 'N15-1', at: 'complete', npcId: SR, start: 'start',
    nodes: {
      start: scene([
        line(SR, '…손 들었어요, 제가. 봤죠.', "...I raised my hand. You saw."),
        line(P, '봤어요. 먼저 올리셨더라고요. 저도 나중에 들었는데요.', "I saw. You landed yours first. I raised mine later."),
        line(SR, '봤어요. 늦게.', "I saw. Late."),
        line(SR, '거리는 지켰고요. 그게 매너예요.', "And you kept your distance. That's manners."),
        line(P, '백 미터나 떨어져 있었는데, 손 드는 건 잘 보이던데요.', "We were a hundred meters apart, but I could see your hand clearly."),
        line(SR, '바다를 보고 있었으니까요. 둘 다.', "Because we were both looking at the sea.", { act: 'look_sea' }),
      ], {
        choices: [
          opt('near', '매너 거리, 그게 더 가까웠어요', "Manner distance — it felt closer", {
            say: ['매너 거리. 그게 오히려 더 가까웠어요.', "Manner distance. Somehow it felt closer."], next: 'near' }),
          opt('lesson', '오세라 씨 파핑, 멀리서 봐도 달랐어요', "Your popping looked different, even from afar", {
            say: ['오세라 씨 파핑, 멀리서 봐도 달랐어요. 뭐가 다른지 알고 싶어요.', "Your popping looked different even from far away. I want to know what's different."],
            end: endTalk({ complete: 'lesson',
              lineKo: '멈춤이에요. 멈추는 시간이 길어요.\n\n물보라가 다 가라앉을 때까지 손을 놔요. 다들 셋 세고 당기는데, 저는 다섯까지 세요. 급한 사람은 그걸 못 기다리고 또 당겨요.',
              lineEn: "It's the pause. I pause longer.\n\nI leave it until the spray has completely settled. Most people count three and pull — I count to five. Someone in a hurry can't wait for it and pulls again." }),
            note: ['오세라 씨 파핑이 뭐가 다르냐고 물었다. 멈춤이 길다고, 남들은 셋을 세는데 자기는 다섯까지 센다고 했다.', "I asked what was different about Sera's popping. The pause is longer, she said — others count three, she counts five."] }),
          opt('pay', '내기였잖아요. 라면은 어떻게 해요?', "It was a bet. What about the ramen?", {
            say: ['그런데 내기였잖아요. 라면은 어떻게 해요?', "But it was a bet. What about the ramen?"],
            end: endTalk({ complete: 'pay',
              lineKo: '…라면. 편의점 라면이요. 봉투는 점주 몫이에요, 받아 둬요.\n\n물은 제가 부을게요. 삼 분이요. 그 삼 분 동안은 말 안 해도 돼요. 라면 앞에선 다들 조용하거든요.',
              lineEn: "...Ramen. Convenience-store ramen. The envelope's the owner's share — take it.\n\nI'll pour the water. Three minutes. You don't have to talk for those three minutes. Everyone goes quiet in front of ramen." }),
            note: ['내기였으니 라면은 어떻게 하느냐고 물었다. 오세라 씨는 라면과 함께 점주 몫이라며 봉투를 내밀고, 물은 자기가 붓겠다고 했다.', "I asked about the ramen bet. Sera handed over ramen with an envelope she called the owner's share, and said she'd pour the water herself."] }),
          opt('ramen', '제가 졌으니 라면은 제가 살게요', "I lost, so the ramen's on me", { next: 'ramen' }),
        ],
        note: ['오세라 씨가 먼저 부시리를 올리고 손을 들었고, 나는 늦게 손을 들었다. 백 미터 떨어져 있었지만 둘 다 바다를 보고 있어서 서로 손 드는 게 잘 보였다.',
          "Sera landed her yellowtail amberjack first and raised her hand; I raised mine later. A hundred meters apart, we could see each other's hands because we were both looking at the sea."],
      }),
      near: scene([
        line(SR, '…그렇게 말하는 사람 처음이에요.', "...You're the first person who's ever said that."),
        act(SR, 'silence'),
        line(SR, '가까이 있으면 서로 신경 쓰느라 바다를 못 봐요. 떨어져 있으니까 둘 다 바다를 봤잖아요.', "Up close, you're too busy minding each other to see the sea. Apart, we both watched it."),
        line(P, '다음에도 백 미터예요?', "A hundred meters next time too?"),
      ], {
        end: endTalk({ complete: 'distance',
          lineKo: '…다음엔 오십 미터요. 오십 미터면, 그래도 바다는 보일 거예요.',
          lineEn: "...Next time, fifty. At fifty meters, we'd still be able to see the sea." }),
        note: ['매너 거리가 오히려 더 가까웠다고 했다. 오세라 씨는 그런 말을 처음 듣는다며, 다음엔 오십 미터로 하자고 했다. 조금 가까워졌다.',
          "I said manner distance had felt closer. Sera said no one had ever told her that, and set next time at fifty meters. We'd come a little closer."],
      }),
      ramen: scene([
        line(SR, '…진 사람이 사는 거 맞아요. 근데 제 가게예요.', "...The loser pays, that's right. But it's my store."),
        line(SR, '손님 돈은 받고, 진 사람 돈은 안 받아요.', "I take customers' money. Not losers' money."),
        line(P, '그런 규칙이 있었어요?', "There's a rule like that?"),
      ], {
        end: endTalk({ complete: 'ramen_mine',
          lineKo: '방금 정했어요. 그게 제 가게 규칙이에요.',
          lineEn: "I just made it. That's my store's rule." }),
        note: ['졌으니 라면은 내가 사겠다고 했다. 오세라 씨는 계산대 뒤에서 컵라면 두 개를 꺼내며, 진 사람 돈은 안 받는다고 방금 정했다고 했다.',
          "I said I'd buy the ramen since I lost. Sera took two cups from behind the counter and said she'd just made a rule: no money from losers."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N15-2 「들킬 뻔한 밤」 — 받는 자리(연태오)
  // ═══════════════════════════════════════════
  {
    id: 'n15_2_offer', questId: 'N15-2', at: 'offer', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(T, '쉿. 쉿, 쉿.', "Shh. Shh, shh."),
        line(P, '(…누구지?) 저요?', "(...Who's that?) Me?"),
        line(T, '네, 그쪽이요. 헤드랜턴 꺼요. 편의점에서 다 보여요.', "Yes, you. Turn off your headlamp. They can see everything from the store."),
        line(P, '편의점이요? 오세라 씨 가게요?', "The store? Oh Sera's store?"),
        line(T, '네. 저 거기 알바예요. 연태오요. 지금은 몰래 나온 거고요.', "Yes. I work there part-time. Yeon Taeo. Right now I've snuck out."),
        line(P, '몰래요? 낚시하러요?', "Snuck out? To fish?"),
        line(T, '네. 그러니까 세라 씨한테 말하지 마요.', "Yes. So don't tell Sera."),
        line(P, '…', '...'),
        line(T, '같이 해요. 오늘 밤에. 부시리 두 마리만요.', "Fish with me. Tonight. Just two yellowtail amberjack."),
      ], {
        choices: [
          opt('shh', '쉿. 오늘 밤 일은 둘만 알아요', "Shh. Tonight stays between us", {
            say: ['쉿. 알겠어요. 오늘 밤 일은 둘만 아는 걸로 해요.', "Shh. Got it. Tonight stays between the two of us."], next: 'shh' }),
          opt('hiding', '오세라 씨한테 왜 숨기는 거예요?', "Why are you hiding it from Sera?", {
            say: ['몰래라니, 오세라 씨한테 왜 숨기는 거예요?', "Snuck out? Why are you hiding it from Sera?"], next: 'hiding' }),
          opt('uneasy', '오세라 씨 모르게 하는 건 좀 걸려요', "Doing it behind Sera's back bothers me", {
            say: ['오세라 씨 모르게 하는 건 좀 마음에 걸려요.', "Doing this without Sera knowing sits a little wrong with me."], next: 'uneasy' }),
        ],
        note: ['밤 갯바위에서 누가 쉿, 하고 불렀다. 오세라 씨 편의점 알바 연태오 씨였다. 몰래 나왔으니 세라 씨한테는 말하지 말라며, 오늘 밤 부시리 두 마리만 같이 하자고 했다.',
          "Someone hissed at me on the night rocks. It was Yeon Taeo, who works part-time at Sera's store. He'd snuck out, so don't tell Sera — and he asked me to fish two yellowtail amberjack with him tonight."],
      }),
      shh: scene([
        line(T, '고마워요. 진짜로요.', "Thank you. Really.", { act: 'nod' }),
        line(T, '불은 켜지 마요. 부시리는 소리로 찾아요.', "Don't turn on any light. You find yellowtail amberjack by sound."),
        line(P, '던지는 소리요?', "The sound of casting?"),
        line(T, '아니요, 무는 소리요. 던지는 소리는 우리가 내는 거고요.', "No, the sound of a strike. The casting sound is the one we make."),
      ], {
        end: endTalk({ accept: true, offer: 'shh_ok' }),
        note: ['둘만 아는 걸로 하자고 했다. 연태오 씨는 어둠 속에서 크게 고개를 끄덕이고, 불은 켜지 말고 무는 소리로 부시리를 찾으라고 했다.',
          "I agreed it would stay between us. Taeo nodded hard in the dark — no lights, he said; find the yellowtail amberjack by the sound of the strike."],
      }),
      hiding: scene([
        line(T, '…세라 씨는 혼자가 좋다잖아요. 밤바다는 세라 씨 시간이에요.', "...Sera says she likes being alone. The night sea is her time."),
        line(T, '거기 제가 끼면 매너가 아니죠. 그래서 몰래 나와요.', "If I barged in, that'd be bad manners. So I sneak out."),
        line(P, '들키면요?', "And if she catches you?"),
        line(T, '들키면 매너 거리 위반이에요.', "Then it's a violation of manner distance."),
        act(T, 'laugh'),
        line(T, '근데 그쪽도 아까 편의점 쪽 보면서 고개 숙이던데요.', "But you were ducking your head toward the store earlier too."),
      ], {
        choices: [
          opt('quiet', '알겠어요. 조용히 두 마리만요', "All right. Quietly, just two", {
            end: endTalk({ accept: true, offer: 'ask_hiding' }),
            note: ['조용히 두 마리만 하자고 했다.', "I agreed to two, quietly."] }),
          opt('passing', '들키면 저는 지나가던 손님인 걸로 할게요', "If we're caught, I'm just a passing customer", { next: 'passing' }),
        ],
        note: ['왜 숨기느냐고 물었다. 연태오 씨는 밤바다는 세라 씨 시간이라 끼면 매너가 아니라고 했다. 그러고는 나도 아까 편의점 쪽을 보며 고개를 숙이더라고 했다.',
          "I asked why he was hiding it. The night sea is Sera's time, Taeo said — butting in would be bad manners. Then he pointed out I'd been ducking toward the store too."],
      }),
      passing: scene([
        line(T, '그럼 저는요? 저는 그냥 지나가던 알바예요.', "Then what about me? I'm just a passing part-timer."),
        act(T, 'laugh'),
        line(T, '둘 다 지나가던 사람이면… 아무도 안 믿겠네요.', "If we're both just passing by... nobody's going to believe it."),
        line(T, '그러니까 안 들키면 돼요. 두 마리만 조용히요.', "So we just don't get caught. Two fish, quietly."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_caught' }),
        note: ['들키면 지나가던 손님인 척하겠다고 했다. 연태오 씨는 자기는 지나가던 알바라며 소리 없이 어깨를 들썩였다. 둘 다 지나가던 사람이면 아무도 안 믿을 거라고.',
          "I said if we got caught I'd play a passing customer. Taeo said he'd be a passing part-timer, shoulders shaking with silent laughter — nobody would believe two passers-by."],
      }),
      uneasy: scene([
        line(T, '…저도요. 조금.', "...Me too. A little.", { act: 'look_away' }),
        line(T, '그래도 오늘만이에요. 부시리 두 마리만 하고 들어가요.', "But just tonight. Two yellowtail amberjack, then we go in."),
        line(T, '들키면 그땐 제가 먼저 말할게요. 그쪽 이름은 안 대고요. 아마요.', "If we're caught, I'll speak up first. I won't name you. Probably."),
      ], {
        choices: [
          opt('tonight', '그럼 오늘만이에요', "Then just tonight", {
            end: endTalk({ accept: true, offer: 'uneasy' }),
            note: ['오늘만이라는 말에 같이 하기로 했다.', "On the promise of just tonight, I agreed."] }),
          opt('cant', '그래도 오세라 씨 몰래는 못 하겠어요', "I still can't do it behind Sera's back", {
            say: ['미안해요. 그래도 오세라 씨 몰래는 못 하겠어요.', "Sorry. I still can't do it behind Sera's back."], next: 'refuse' }),
        ],
        note: ['세라 씨 모르게 하는 게 걸린다고 했다. 연태오 씨도 조금 그렇다며 헤드랜턴을 만지작거렸다. 오늘만, 두 마리만 하자고, 들키면 자기가 먼저 말하겠다고 했다.',
          "I said doing it behind Sera's back bothered me. Taeo admitted it bothered him a little too, fiddling with his headlamp. Just tonight, just two — and if caught, he'd speak up first."],
      }),
      refuse: scene([
        line(T, '…그렇죠. 그쪽은 그게 맞아요.', "...Right. For you, that's the right call."),
        line(T, '저 본 건 비밀로 해 줘요. 그거면 돼요.', "Just keep it secret that you saw me. That's all I ask."),
        line(P, '그건 약속할게요.', "That, I promise."),
      ], {
        end: endTalk({ fail: true }),
        note: ['결국 오세라 씨 몰래는 못 하겠다고 했다. 연태오 씨는 자기를 본 것만 비밀로 해 달라고 하고 어둠 속으로 돌아갔다. 그날 밤 일은 거기서 내 손을 떠났다.',
          "In the end I told him I couldn't do it behind Sera's back. Taeo only asked me to keep quiet about seeing him and slipped back into the dark. That night's business left my hands there."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N15-2 — 끝내는 자리(연태오)
  // ═══════════════════════════════════════════
  {
    id: 'n15_2_done', questId: 'N15-2', at: 'complete', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(T, '들켰나…', "Did she catch us..."),
        line(P, '아까 편의점에 갔는데, 오세라 씨가 아무 말도 안 하던데요.', "I went by the store just now, and Sera didn't say a word."),
        line(T, '아니, 안 들켰어요. 아마.', "No, she didn't. Probably."),
        line(T, '…세라 씨가 아무 말도 안 하는 게 더 무서워요.', "...Sera saying nothing is scarier.", { act: 'look_away' }),
        line(P, '다 아는 얼굴이긴 했어요.', "She did have a face that knew everything."),
        act(T, 'sigh'),
        line(T, '사실 제 파핑, 세라 씨 거예요. 어깨 너머로 본 거요. 그것도 비밀이고요.', "The truth is, my popping is Sera's. I learned it over her shoulder. That's a secret too."),
      ], {
        choices: [
          opt('lesson', '그 멈춤, 저도 배우고 싶어요', "I want to learn that pause too", {
            say: ['연태오 씨 야간 파핑, 스승한테서 왔다는 그 멈춤을 배우고 싶어요.', "Your night popping — I want to learn that pause you got from your teacher."],
            end: endTalk({ complete: 'lesson',
              lineKo: '…스승은 말 안 해요. 저는 조금 해요. 여기서 멈춰요.\n\n밤엔 물보라가 안 보이니까 소리로 세요. 퍽, 하고 하나, 둘, 셋. 셋까지 참는 게 어려워요. 저도 아직 둘에서 당겨요.',
              lineEn: "...The teacher doesn't talk. I talk a little. Stop here.\n\nAt night you can't see the spray, so count by sound. Pop — one, two, three. Holding out to three is the hard part. I still pull at two." }),
            note: ['연태오 씨에게 그 멈춤을 배우고 싶다고 했다. 밤엔 물보라가 안 보이니 소리로 셋까지 세라고, 자기도 아직 둘에서 당긴다고 했다.', "I asked Taeo to teach me that pause. At night you count to three by sound, he said — he still pulls at two."] }),
          opt('tell', '오세라 씨한테 말할게요. 같이 하면 되죠', "I'll tell Sera. We can just fish together", { next: 'tell' }),
          opt('pay', '공범 값은 받아야죠', "I'll take my cut as your accomplice", {
            end: endTalk({ complete: 'pay',
              lineKo: '공범… 네. 알바비 나눌게요.\n\n알바비는 세라 씨가 주는 돈이에요. 그 돈으로 세라 씨 몰래 낚시한 값을 내다니, 좀 이상하네요. 그래도 공범은 공범이니까요.',
              lineEn: "Accomplice... okay. I'll split my wages.\n\nMy wages come from Sera. Paying for fishing behind her back with her money — that's a little strange. Still, an accomplice is an accomplice." }),
            note: ['공범 값을 받겠다고 했다. 연태오 씨는 세라 씨가 주는 알바비를 나누며, 좀 이상하다고 했다.', "I asked for an accomplice's cut. Taeo split his wages — money from Sera — and admitted it was a little strange."] }),
          opt('steps', '다음엔 안 들키는 걸음부터 가르쳐 줘요', "Next time, teach me how to walk without being heard", {
            end: endTalk({ complete: 'quiet_steps',
              lineKo: '…안 들키는 걸음이요? 저도 들킬 뻔했는데요.\n\n발이에요. 갯바위는 앞꿈치부터 디뎌요. 뒤꿈치부터 디디면 돌이 울려요. 고기도 사람도 그 소리를 들어요.',
              lineEn: "...Walking without being heard? I nearly got caught myself.\n\nIt's the feet. On the rocks, step toe first. Heel first and the stone rings. Fish and people both hear it." }),
            note: ['안 들키는 걸음을 가르쳐 달라고 했다. 연태오 씨는 웃음을 참으며, 갯바위는 앞꿈치부터 디디라고 했다.', "I asked him to teach me how to walk without being heard. Holding back a laugh, Taeo said to step toe-first on the rocks."] }),
        ],
        note: ['부시리 두 마리를 채웠다. 다음 날 오세라 씨는 다 아는 얼굴로 아무 말도 안 했다. 연태오 씨는 그게 더 무섭다며, 자기 파핑이 실은 세라 씨 어깨 너머로 배운 거라고 털어놨다.',
          "We landed two yellowtail amberjack. The next day Sera said nothing, with a face that knew everything. Taeo said that was scarier, and confessed his popping was learned over Sera's shoulder."],
      }),
      tell: scene([
        line(T, '…그럼 그쪽이 말해요. 저는 못 해요.', "...Then you tell her. I can't."),
        line(T, '말하면… 세라 씨가 뭐라고 할까요.', "If you do... what will she say?"),
        line(P, '아마, 이미 알고 있을 것 같은데요.', "I think she probably already knows."),
        act(T, 'silence'),
      ], {
        end: endTalk({ complete: 'tell_sera',
          lineKo: '…처음부터요? 그럼 모른 척해 준 거네요.\n\n그게 세라 씨식 매너 거리였나 봐요. 저만 몰랐어요.',
          lineEn: "...From the start? Then she was pretending not to know.\n\nThat must have been Sera's kind of manner distance. I was the only one who didn't know." }),
        note: ['오세라 씨한테 말하고 같이 하자고 했다. 연태오 씨는 내가 말하라고 하다가, 세라 씨가 이미 알고 있을 거라는 말에 한참 말이 없었다. 모른 척해 준 게 세라 씨식 매너 거리였나 보다고 했다.',
          "I said I'd tell Sera so we could all fish together. Taeo said I should be the one to tell her — then, when I said she probably already knew, he went quiet. Pretending not to know must have been Sera's kind of manner distance, he said."],
      }),
    },
  },
];
