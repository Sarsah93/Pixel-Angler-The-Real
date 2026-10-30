/**
 * @file StoryTalkN12.ts
 * @description 290차 — 이야기 「오가윤·정우미 — 여수」(N12-1~3) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 끝은 옛 받는 답(`end.offer`) · 보상 답(`end.complete`)에 묶는다.
 *
 * 인물: 오가윤(29 · 여수 호텔 직원 · 조용하고 지친 존댓말 · 「…」 · 농담은 반만 · 정우미를 「우미 씨」 · 주인공을 「그쪽」) ·
 *   정우미(35 · 캠핑카 앵글러 · 느긋하고 따뜻한 존댓말 · 좁은 데 사는 법 · 결론에 손대지 않는다).
 * 주인공은 「오가윤 씨」 · 「정우미 씨」로 부른다.
 * N12-1은 한 번뿐인 곁가지 — 옛 미루는 답 `decline`(오늘은 다른 약속)으로 미루는 끝이 있다.
 * 표시(옛 답에서 그대로): choice.n12_1_asked_today · choice.n12_asked · choice.n12_2_asked_couple · choice.n12_3_asked_camper.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const Y = 'oh_gayun';
const U = 'jeong_umi';
const P = 'player';

export const TALKS_N12: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N12-1 「다툰 날의 방파제」 — 받는 자리(오가윤) · 한 번뿐
  // ═══════════════════════════════════════════
  {
    id: 'n12_1_offer', questId: 'N12-1', at: 'offer', npcId: Y, start: 'start',
    nodes: {
      start: scene([
        line(Y, '…', '...', { act: 'look_sea' }),
        line(P, '저기… 괜찮으세요? 한참 앉아 계시던데요.', "Excuse me... are you all right? You've been sitting here a long while."),
        line(Y, '…오늘 다퉜어요.', "...I had a fight today."),
        line(P, '아…', "Ah..."),
        line(Y, '저 오가윤이에요. 저기 호텔에서 일해요.', "I'm Oh Gayun. I work at the hotel over there.", { act: 'look_away' }),
        line(Y, '낚시하시는 분이죠? 낚시 안 해도 돼요.', "You fish, don't you? You don't have to fish."),
        line(P, '네?', "Sorry?"),
        line(Y, '해 질 때까지만, 옆에 있어 줄래요. 오늘만요.', "Just until the sun goes down — would you stay beside me? Just for today."),
        line(Y, '손이 심심하면 발밑 갯가라도 훑어요. 해 넘어갈 때까지요.', "If your hands get bored, comb the shore at our feet. Until the sun goes over."),
      ], {
        choices: [
          opt('sit', '앉을게요. 해 질 때까지', "I'll sit. Until sundown", {
            say: ['앉겠습니다. 해 질 때까지.', "I'll sit with you. Until the sun goes down."],
            next: 'sit' }),
          opt('today', '오늘만이라는 건, 내일은 괜찮아진다는 거예요?', "Just today — does that mean tomorrow will be better?", {
            say: ['오늘만이라는 건, 내일은 괜찮아진다는 뜻이에요?', "When you say just today — does that mean tomorrow will be all right?"],
            next: 'today' }),
          opt('decline', '오늘은 다른 약속이 있어서요', "I have somewhere to be today", {
            say: ['죄송해요. 오늘은 다른 약속이 있습니다.', "I'm sorry. I have somewhere to be today."],
            next: 'decline' }),
        ],
        note: ['방파제에 한참 앉아 있던 사람에게 말을 걸었다. 호텔에서 일하는 오가윤 씨는 오늘 다퉜다고, 낚시는 안 해도 되니 해 질 때까지만 옆에 있어 달라고 했다. 손이 심심하면 발밑 갯가를 훑으라고 했다.',
          "I spoke to someone who'd been sitting on the breakwater for a long while. Gayun, who works at the hotel, said she'd had a fight today and asked me to stay beside her until sundown — no fishing needed. If my hands got bored, I could comb the shore at our feet."],
      }),
      sit: scene([
        line(Y, '…고마워요.', "...Thank you."),
        line(Y, '자리 좀 닦을게요. 방파제는 해 질 무렵이면 금방 차가워져요.', "Let me wipe the spot. The breakwater gets cold fast around sunset."),
        line(Y, '아무 말 안 해도 돼요. 저도 안 할 거예요.', "You don't have to say anything. I won't either."),
      ], {
        choices: [
          opt('quiet', '(말없이 옆에 앉는다)', '(Sit beside her without a word)', {
            end: endTalk({ accept: true, offer: 'stay' }),
            note: ['말없이 옆에 앉았다. 오가윤 씨는 방파제가 금방 차가워진다며 자리를 닦아 주고, 아무 말 안 해도 된다고 했다.', "I sat down beside her without a word. Gayun wiped the spot for me — the breakwater gets cold fast — and said I didn't need to say anything."] }),
          opt('line_out', '채비는 던져 둘게요. 손이 심심해서요', "I'll cast a line anyway. Idle hands", {
            say: ['옆에 앉되, 채비는 던져 두겠습니다. 손이 심심해서요.', "I'll sit beside you, but I'll cast a line. My hands get restless."],
            next: 'line_out' }),
        ],
        note: ['해 질 때까지 앉겠다고 했다. 오가윤 씨는 고맙다며 차가워지는 방파제 자리를 닦았다.', "I said I'd sit until sundown. Gayun thanked me and wiped down the spot on the cooling breakwater."],
      }),
      line_out: scene([
        line(Y, '던져요. 안 물어도 돼요. 물면… 그건 그때 생각해요.', "Go ahead. It doesn't have to bite. If it does... we'll think about it then."),
        line(P, '(처음으로 내 채비 쪽을 본다.)', "(For the first time, she looks over at my line.)"),
        line(Y, '낚시는 말 안 해도 돼서 좋네요. 둘이 같은 데를 보고 있어도 이상하지 않잖아요.', "Fishing's nice because you don't have to talk. Two people looking at the same spot doesn't seem strange."),
      ], {
        end: endTalk({ accept: true, offer: 'line_out' }),
        note: ['채비는 던져 두겠다고 했다. 오가윤 씨는 처음으로 내 채비 쪽을 보며, 낚시는 말 안 해도 돼서 좋다고 했다. 둘이 같은 데를 보고 있어도 이상하지 않다고.',
          "I said I'd cast a line anyway. Gayun looked at it for the first time and said fishing is nice because you don't have to talk — two people looking at the same spot doesn't seem strange."],
      }),
      today: scene([
        line(Y, '…모르겠어요.', "...I don't know."),
        line(Y, '그래도 오늘만이라고 해야 부탁할 수 있잖아요. 내일도라고 하면 너무 무거우니까.', "But I have to say just today to be able to ask. If I said tomorrow too, it'd be too heavy."),
        line(P, '(무릎을 끌어안는다.)', "(She hugs her knees.)"),
        line(Y, '내일은 출근해요. 호텔은 다툰 날에도 문을 열어요. 웃으면서 체크인 받아야 하고요.', "Tomorrow I'm at work. The hotel opens even on days you've had a fight. I'll have to smile through check-ins."),
        line(Y, '그러니까 오늘만이에요.', "So — just today."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_today' }),
        note: ['오늘만이라는 게 내일은 괜찮아진다는 뜻이냐고 물었다. 오가윤 씨는 모르겠다고, 내일도라고 하면 너무 무거워서 오늘만이라고 해야 부탁할 수 있다고 했다. 내일은 웃으면서 체크인을 받아야 한다고.',
          "I asked if just today meant tomorrow would be better. Gayun didn't know — saying tomorrow too would be too heavy, so just today was the only way she could ask. Tomorrow she'd be smiling through check-ins."],
      }),
      decline: scene([
        line(Y, '…네. 그럴 수 있죠.', "...Okay. That's fair.", { act: 'look_away' }),
        line(P, '(돌아서는데, 등 뒤에서 작은 목소리가 들렸다.)', "(As I turned away, a small voice came from behind me.)"),
        line(Y, '해는 내일도 져요. 오늘 해는 하나뿐이지만요.', "The sun sets tomorrow too. Though there's only one today."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['다른 약속이 있다고 하고 돌아섰다. 등 뒤에서 오가윤 씨가 작게 말했다. 해는 내일도 지지만, 오늘 해는 하나뿐이라고. 그녀는 혼자 해 지는 걸 봤다.',
          "I said I had somewhere to be and turned away. Behind me, Gayun said quietly that the sun sets tomorrow too — but there's only one today. She watched it go down alone."],
      }),
    },
  },
  // N12-1 — 끝내는 자리(오가윤)
  {
    id: 'n12_1_done', questId: 'N12-1', at: 'complete', npcId: Y, start: 'start',
    nodes: {
      start: scene([
        line(Y, '해 다 넘어갔네요.', "The sun's all the way down."),
        line(P, '네. 아무것도 안 물었어요.', "Yes. Nothing bit."),
        line(Y, '알아요. 봤어요.', "I know. I was watching."),
        act(Y, 'silence'),
        line(Y, '…고마워요. 그거면 돼요. 오늘은.', "...Thank you. That's enough. For today.", { act: 'look_sea' }),
      ], {
        choices: [
          opt('stay', '언제든 또 앉을게요', "I'll sit with you again, anytime", {
            say: ['언제든 또 앉겠습니다.', "I'll sit with you again. Anytime."],
            next: 'stay' }),
          opt('ask', '무슨 일로 다퉜는지 물어봐도 돼요?', "Can I ask what the fight was about?", {
            say: ['무슨 일로 다퉜는지, 물어도 될까요?', "May I ask what the fight was about?"],
            end: endTalk({ complete: 'ask',
              lineKo: '…캠핑카 때문에요. 정우미라고. 다음에 소개할게요.\n\n오늘은 거기까지만요. 말하기 시작하면 또 다툰 얘기가 되니까. 그래도 물어봐 줘서… 조금 가벼워졌어요.',
              lineEn: "...Because of a camper van. Someone called Jeong Umi. I'll introduce you some time.\n\nThat's as far as I'll go today. If I start talking, it turns into the fight again. But you asking... made it a little lighter." }),
            note: ['무슨 일로 다퉜는지 물었다. 오가윤 씨는 캠핑카 때문이라고, 정우미라는 사람이라고 했다. 그 이름을 말할 때 목소리가 조금 낮아졌다. 물어봐 줘서 조금 가벼워졌다고 했다.', "I asked what the fight had been about. A camper van, Gayun said — someone named Jeong Umi. Her voice dropped a little at the name. Being asked had made it a little lighter."] }),
          opt('nothing', '조과 없는 날도 있는 거죠', "Some days you catch nothing", {
            say: ['조과 0인 날도 있는 겁니다.', "Some days you just catch nothing."],
            next: 'nothing' }),
          opt('coffee', '오늘 앉은 값은 커피 한 잔이면 돼요', "A cup of coffee covers today", {
            say: ['오늘 앉은 값은 커피 한 잔이면 됩니다.', "A cup of coffee is payment enough for today."],
            next: 'coffee' }),
        ],
        note: ['해가 넘어가는 동안 오가윤 씨 옆에 앉아 있었다. 아무것도 물지 않았고, 우리는 아무 말도 하지 않았다. 일어서며 그녀가 고맙다고, 그거면 된다고 했다.',
          "I sat beside Gayun while the sun went down. Nothing bit, and neither of us spoke. As she stood, she thanked me — that was enough, she said."],
      }),
      stay: scene([
        line(Y, '…또 다투면요?', "...And if I fight again?"),
        act(Y, 'laugh'),
        line(Y, '농담이에요. …반은 농담이고요.', "Just kidding. ...Half kidding."),
        line(Y, '다투는 날은 또 와요. 그날 방파제에 누가 앉아 있으면, 혼자 해 지는 걸 안 봐도 되잖아요.', "Days with fights will come again. If someone's sitting on the breakwater that day, I won't have to watch the sunset alone."),
      ], {
        end: endTalk({ complete: 'stay' }),
        note: ['언제든 또 앉겠다고 했다. 오가윤 씨는 또 다투면 어떡하느냐고 농담하더니, 반은 농담이라고 했다. 다투는 날 방파제에 누가 있으면 혼자 해 지는 걸 안 봐도 된다고.',
          "I said I'd sit with her again anytime. Gayun joked — and if she fought again? — then said it was only half a joke. With someone on the breakwater on those days, she wouldn't watch the sunset alone."],
      }),
      nothing: scene([
        line(Y, '그렇죠. 오늘이 그런 날.', "That's right. Today was one of those."),
        act(Y, 'laugh'),
        line(P, '(처음 보는 웃음이었다.)', "(It was the first time I'd seen her smile.)"),
        line(Y, '호텔에선 매일 뭔가를 채워야 해요. 방도, 웃음도, 숫자도.', "At the hotel I have to fill something every day. Rooms, smiles, numbers."),
        line(Y, '아무것도 안 잡혀도 되는 날이 있다는 게… 오늘은 그게 좋았어요.', "That there's a day when nothing has to be caught... today, I liked that."),
      ], {
        end: endTalk({ complete: 'nothing' }),
        note: ['조과가 없는 날도 있는 거라고 했다. 오가윤 씨가 처음으로 웃었다. 호텔에선 매일 방도 웃음도 숫자도 채워야 하는데, 아무것도 안 잡혀도 되는 날이 좋았다고 했다.',
          "I said some days you catch nothing. Gayun smiled for the first time. At the hotel she has to fill rooms, smiles and numbers every day — a day when nothing had to be caught was good."],
      }),
      coffee: scene([
        line(Y, '커피요? …호텔 커피 비싼 거 알아요?', "Coffee? ...Do you know how expensive hotel coffee is?"),
        act(Y, 'give', { to: P }),
        line(Y, '그럼 커피값이에요. 남으면 내일 아침도 사 드세요.', "Then it's coffee money. If there's any left over, buy yourself breakfast too."),
        line(P, '(봉투가 커피 몇 잔 값은 넉넉히 넘는다.)', "(The envelope holds far more than a few coffees.)", { act: 'receive' }),
        line(Y, '오늘 옆에 있어 준 건, 커피로는 못 갚지만요.', "Though staying beside me today isn't something coffee can repay."),
      ], {
        end: endTalk({ complete: 'coffee' }),
        note: ['오늘 앉은 값은 커피 한 잔이면 된다고 했다. 오가윤 씨는 호텔 커피가 비싸다며 봉투를 내밀었다. 커피 몇 잔 값은 넉넉히 넘었다. 옆에 있어 준 건 커피로 못 갚는다고 했다.',
          "I said a cup of coffee would cover today. Gayun reminded me hotel coffee is expensive and handed over an envelope — far more than a few cups. Staying beside her, she said, wasn't something coffee could repay."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N12-2 「잔잔함」 — 받는 자리(정우미)
  // ═══════════════════════════════════════════
  {
    id: 'n12_2_offer', questId: 'N12-2', at: 'offer', npcId: U, start: 'start',
    nodes: {
      start: scene([
        line(U, '낚시하는 분이죠? 일 하나 맡아 줄래요?', "You fish, right? Would you take a job for me?", { act: 'look_up' }),
        line(P, '어떤 일인데요?', "What kind of job?"),
        line(U, '저 정우미예요. 이 캠핑카 주인이고요.', "I'm Jeong Umi. This camper's mine."),
        line(U, '커플 가이드예요. 밤바다로요.', "Guiding a couple. Out on the night sea."),
        line(P, '커플이요?', "A couple?"),
        line(U, '화해든 이별이든, 따뜻하게.', "Whether they make up or break up — warmly."),
        line(P, '(화해든 이별이든…?)', "(Make up or break up...?)"),
        line(U, '갈치 두 마리면 될 거예요. 해 지고 나서, 밤에요.', "Two hairtail should do it. After the sun's gone — at night."),
      ], {
        choices: [
          opt('warm', '따뜻하게 할게요. 갈치는 제가 책임질게요', "Warmly it is. The hairtail are on me", {
            say: ['따뜻하게 하겠습니다. 갈치는 제가 책임지겠습니다.', "I'll keep it warm. The hairtail are my responsibility."],
            next: 'warm' }),
          opt('couple', '화해든 이별이든이라니, 어떤 커플이에요?', "Make up or break up — what kind of couple?", {
            say: ['화해든 이별이든이라니, 어떤 커플입니까?', "Make up or break up — what sort of couple is this?"],
            next: 'couple' }),
          opt('awkward', '남의 연애에 끼는 건 좀 어색할 것 같아요', "Butting into someone's romance feels awkward", {
            say: ['남의 연애에 끼는 건 좀… 어색할 것 같습니다.', "Getting in the middle of someone's romance... feels a bit awkward."],
            next: 'awkward' }),
        ],
        note: ['캠핑카 주인 정우미 씨가 커플의 밤바다 가이드를 맡아 달라고 했다. 화해든 이별이든 따뜻하게. 해 지고 나서 갈치 두 마리면 될 거라고 했다.',
          "Umi, who owns a camper van, asked me to guide a couple on the night sea — whether they make up or break up, warmly. Two hairtail after dark should do it, she said."],
      }),
      warm: scene([
        line(U, '갈치만 책임져요. 사람은 책임지지 마요. 그건 그 사람들 몫이에요.', "Just be responsible for the hairtail. Not the people. That's theirs."),
        line(P, '(캠핑카 문을 열고 보온병 두 개를 꺼낸다.)', "(She opens the camper door and takes out two thermoses.)"),
        line(U, '하나는 그 사람들 거, 하나는 우리 거. 밤바다 추워요.', "One for them, one for us. The night sea is cold."),
        line(U, '추우면 말이 날카로워지거든요. 그래서 따뜻하게 하라는 거예요.', "When it's cold, words get sharp. That's why I said warmly."),
      ], {
        end: endTalk({ accept: true, offer: 'warm_guide' }),
        note: ['따뜻하게 하고 갈치는 내가 책임지겠다고 했다. 정우미 씨는 갈치만 책임지고 사람은 책임지지 말라며 보온병 두 개를 꺼냈다. 추우면 말이 날카로워진다고.',
          "I said I'd keep it warm and take care of the hairtail. Umi said to take care of the fish only, not the people, and brought out two thermoses — cold makes words sharp."],
      }),
      couple: scene([
        line(U, '본인들도 모른대요. 그래서 밤바다를 신청했대요.', "They don't know themselves. That's why they booked the night sea."),
        line(U, '낮에는 서로 얼굴이 너무 잘 보인다고.', "In daylight, they say, they can see each other's faces too clearly."),
        act(U, 'sigh'),
        line(P, '…', '...'),
        line(U, '밤바다엔 그런 사람들이 와요. 갈치 보러 왔다가 서로를 보고 가요.', "That's who comes to the night sea. They come to see hairtail and leave having seen each other."),
        line(U, '우리는 결론에 손대지 않아요. 불만 켜 주는 거예요.', "We don't touch the ending. We just turn on the lights."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_couple' }),
        note: ['어떤 커플이냐고 물었다. 정우미 씨는 본인들도 모른다고, 낮에는 서로 얼굴이 너무 잘 보여서 밤바다를 신청했다고 했다. 우리는 결론에 손대지 않고 불만 켜 주는 거라고.',
          "I asked what sort of couple they were. Umi said they don't know themselves — in daylight they see each other's faces too clearly, so they booked the night sea. We don't touch the ending; we just turn on the lights."],
      }),
      awkward: scene([
        line(U, '끼지 마요. 옆에만 있어요. 갈치 올라오면 우와, 하고 웃기만 하면 돼요.', "Don't get in the middle. Just be nearby. When a hairtail comes up, say wow and smile, that's all."),
        line(P, '(손가락으로 집어등 스위치를 톡 친다.)', "(She taps the switch of the fish-attracting lamp.)"),
        line(U, '어색한 건 그 사람들이 더해요. 우리가 편하면 그 사람들도 조금 편해져요.', "They're the ones who'll feel more awkward. If we're at ease, they'll be a little more at ease too."),
      ], {
        choices: [
          opt('ok', '옆에만 있을게요', "I'll just stay nearby", {
            say: ['알겠어요. 옆에만 있을게요.', "Got it. I'll just be nearby."],
            end: endTalk({ accept: true, offer: 'awkward' }),
            note: ['남의 연애에 끼는 게 어색하겠다고 했다. 정우미 씨는 끼지 말고 옆에만 있으라고, 우리가 편하면 그 사람들도 조금 편해진다고 했다. 좁은 데서는 그게 다 옮는다고.', "I said it felt awkward getting involved in someone's romance. Umi said don't get involved, just be nearby — if we're at ease, they'll be a little easier too. In tight spaces, it all rubs off."] }),
          opt('joke', '갈치 두 마리면, 한 사람에 한 마리씩이에요?', "Two hairtail — one each?", {
            say: ['갈치 두 마리면, 한 사람에 한 마리씩입니까?', "Two hairtail — so that's one per person?"],
            next: 'joke' }),
        ],
        note: ['정우미 씨는 갈치가 올라오면 우와 하고 웃기만 하면 된다고 했다. 어색한 건 그 사람들이 더하다고.', "Umi said all I had to do when a hairtail came up was say wow and smile. The couple would feel more awkward than me."],
      }),
      joke: scene([
        line(U, '오, 그거 좋네요. 헤어져도 한 마리씩, 화해해도 한 마리씩.', "Oh, that's good. Break up, one each. Make up, one each."),
        line(U, '어느 쪽이든 공평하잖아요.', "Fair either way."),
        line(P, '(진심으로 감탄한 얼굴이다.)', "(She looks genuinely impressed.)"),
        line(U, '그 말, 그 사람들 앞에서는 하지 마요. 저만 들을게요. 갈치는 해 지고 나서예요. 그 전엔 커피나 마셔요.', "Don't say that in front of them. I'll be the only one who heard it. The hairtail come after dark. Until then, have some coffee."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_double' }),
        note: ['갈치 두 마리면 한 사람에 한 마리씩이냐고 했다. 정우미 씨는 헤어져도 화해해도 한 마리씩이니 공평하다며 진심으로 감탄했다. 그 말은 커플 앞에서는 하지 말라고 했다.',
          "I asked if two hairtail meant one each. Umi was genuinely impressed — one each whether they part or make up, fair either way. But not to say it in front of them."],
      }),
    },
  },
  // N12-2 — 끝내는 자리(정우미)
  {
    id: 'n12_2_done', questId: 'N12-2', at: 'complete', npcId: U, start: 'start',
    nodes: {
      start: scene([
        line(U, '잔잔했죠.', "It was calm, wasn't it."),
        line(P, '네. 갈치 두 마리 보면서 웃다가… 울다가 하시던데요.', "Yes. Looking at the two hairtail, they laughed... and then cried."),
        line(U, '그게 다예요.', "That's all there is."),
        line(P, '어떻게 끝났을까요?', "How do you think it ended?"),
        line(U, '결론은 그 사람들 거고요.', "The ending is theirs.", { act: 'look_sea' }),
      ], {
        choices: [
          opt('lesson', '캠핑카 살림, 배 살림에 그대로 쓸 수 있겠어요', "Your camper life would work on a boat too", {
            say: ['정우미 씨 캠핑카 살림, 배 살림에 그대로 쓸 수 있겠습니다.', "The way you keep house in that camper — it would work just the same on a boat."],
            end: endTalk({ complete: 'lesson',
              lineKo: '그렇죠? 좁은 데 사는 법은 다 같아요.\n\n자주 쓰는 건 손 닿는 데, 젖으면 안 되는 건 높은 데, 무거운 건 바닥에. 그리고 하나 들이면 하나 내보내요. 안 그러면 좁은 데가 금방 숨 막혀요.',
              lineEn: "Right? Living in a small space is the same everywhere.\n\nWhat you use often goes within reach, what mustn't get wet goes high, what's heavy goes on the floor. And when one thing comes in, one thing goes out. Otherwise a small space suffocates you fast." }),
            note: ['캠핑카 살림을 배 살림에 쓰겠다고 했다. 정우미 씨는 좁은 데 사는 법은 다 같다며, 자주 쓰는 건 손 닿는 데, 젖으면 안 되는 건 높은 데, 무거운 건 바닥에 두고 하나 들이면 하나 내보내라고 했다.', "I said her camper housekeeping would work on a boat. Umi said living small is the same everywhere — often-used within reach, keep-dry up high, heavy on the floor, and one in means one out."] }),
          opt('pay', '가이드비 받을게요', "I'll take the guide fee", {
            say: ['가이드비 받겠습니다.', "I'll take my guide fee."],
            next: 'pay' }),
          opt('decline', '잔잔한 밤이었으면 됐어요', "A calm night was enough", {
            say: ['잔잔한 밤이었으면 됐습니다.', "A calm night was enough for me."],
            end: endTalk({ complete: 'decline',
              lineKo: '…그 말 좋네요. 캠핑카 문 늘 열려 있어요.\n\n잔잔한 밤이면 됐다는 사람, 드물어요. 다들 뭔가 남기고 싶어 하거든요. 사진이든 고기든. 아무것도 안 남겨도 되는 밤이 제일 오래 남아요.',
              lineEn: "...I like that. The camper door is always open.\n\nPeople who say a calm night was enough are rare. Everyone wants to keep something — a photo, a fish. The nights you don't have to keep anything from stay with you longest." }),
            note: ['잔잔한 밤이었으면 됐다고 했다. 정우미 씨는 그 말이 좋다며 캠핑카 문은 늘 열려 있다고 했다. 아무것도 안 남겨도 되는 밤이 제일 오래 남는다고.', "I said a calm night was enough. Umi liked that — the camper door would always be open. The nights you keep nothing from stay with you longest."] }),
          opt('depth', '갈치 수심이 밤새 바뀌더군요. 요령이 있어요?', "The hairtail depth kept changing. Any trick?", {
            say: ['갈치 수심이 밤새 바뀌더군요. 맞추는 요령이 있습니까?', "The hairtail kept changing depth all night. Is there a trick to keeping up?"],
            end: endTalk({ complete: 'hairtail_depth',
              lineKo: '있어요. 밤이 깊으면 갈치가 떠요. 입질이 끊기면 찌 밑 수심을 한 뼘씩 줄여요.\n\n갈치는 쫓는 게 아니라 기다리는 거예요. 층만 맞으면 와요. 사람도 그렇고요.',
              lineEn: "There is. As the night deepens, hairtail rise. When the bites stop, shorten the depth under the float a hand's width at a time.\n\nYou don't chase hairtail, you wait for them. Get the layer right and they come. People are the same." }),
            note: ['갈치 수심 맞추는 요령을 물었다. 정우미 씨는 찌 하나를 꺼내 멈춤 매듭을 옮겨 보이며, 입질이 끊기면 수심을 한 뼘씩 줄이라고 했다. 갈치는 쫓는 게 아니라 기다리는 거라고.', "I asked how to follow the hairtail's depth. Umi took out a float and moved its stopper knot to show me — when bites stop, go a hand's width shallower. You don't chase hairtail; you wait."] }),
        ],
        note: ['밤바다에서 커플을 안내하며 갈치 두 마리를 올렸다. 커플은 갈치를 보며 웃다가 울다가 했다. 어떻게 끝났는지는 모른다. 정우미 씨는 그 밤을 잔잔함이라고 불렀다.',
          "I guided the couple on the night sea and landed two hairtail. They laughed and cried over the fish. I don't know how it ended. Umi called that night calm."],
      }),
      pay: scene([
        line(U, '당연하죠. 커플이 냈어요.', "Of course. The couple paid."),
        act(U, 'give', { to: P }),
        line(P, '(봉투가 두툼하다.)', "(The envelope is thick.)", { act: 'receive' }),
        line(U, '팁도 들어 있어요. 갈치값이 아니라 밤값이래요.', "There's a tip in there too. Not for the fish, they said — for the night."),
        line(U, '어떻게 끝났는지는 저도 몰라요. 그래도 팁을 주고 간 사람들은 대개 괜찮아요.', "I don't know how it ended either. But people who leave a tip are usually all right."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['가이드비를 받았다. 봉투에는 커플이 넣은 팁이 들어 있었다. 갈치값이 아니라 밤값이라고. 정우미 씨는 팁을 주고 간 사람들은 대개 괜찮다고 했다.',
          "I took the guide fee. The envelope included a tip from the couple — not for the fish but for the night. Umi said people who leave a tip are usually all right."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N12-3 「호텔 로비의 캠핑카」 — 받는 자리(오가윤)
  // ═══════════════════════════════════════════
  {
    id: 'n12_3_offer', questId: 'N12-3', at: 'offer', npcId: Y, start: 'start',
    nodes: {
      start: scene([
        line(Y, '캠핑카가 반년째예요.', "The camper's been there half a year now."),
        line(P, '캠핑카요?', "The camper?"),
        line(Y, '우미 씨 거요. 호텔 주차장에요.', "Umi's. In the hotel car park."),
        line(P, '정우미 씨가 아직 여수에 계세요?', "Umi's still in Yeosu?"),
        line(Y, '네. 저는 퇴근하면 그 앞에 앉아요.', "Yes. After work, I sit in front of it.", { act: 'look_away' }),
        line(P, '…매일요?', "...Every day?"),
        line(Y, '…셋이 밤 낚시 가요. 우미 씨랑, 저랑, 그쪽이랑.', "...Let's go night fishing, the three of us. Umi, me and you."),
      ], {
        choices: [
          opt('go', '셋이 가요. 갈치는 안 물어도 돼요', "Let's go, the three of us. The hairtail needn't bite", {
            say: ['셋이 가죠. 갈치는 안 물어도 됩니다.', "Let's go, the three of us. The hairtail don't have to bite."],
            aff: { [U]: 0.03 }, next: 'go' }),
          opt('half', '반년째라는 건, 정우미 씨가 여기 머무신다는 거예요?', "Half a year — so Umi is staying here?", {
            say: ['반년째라는 건, 정우미 씨가 여기 머무신다는 겁니까?', "Half a year — does that mean Umi is staying here?"],
            next: 'half' }),
          opt('third', '두 분 사이에 제가 끼어도 될까요?', "Is it all right for me to come between you two?", {
            say: ['두 분 사이에 제가 끼어도 되겠습니까?', "Would it really be all right for me to come along between the two of you?"],
            next: 'third' }),
        ],
        note: ['오가윤 씨가 정우미 씨의 캠핑카가 호텔 주차장에 반년째 서 있다고 했다. 자기는 퇴근하면 그 앞에 앉는다고. 셋이 밤 낚시를 가자고 했다.',
          "Gayun told me Umi's camper had been parked at the hotel car park for half a year, and that she sits in front of it after work. She asked the three of us to go night fishing."],
      }),
      go: scene([
        line(Y, '…그 말, 우미 씨도 했어요. 갈치는 핑계래요.', "...Umi said that too. The hairtail are an excuse, she says."),
        act(Y, 'laugh'),
        line(P, '(처음으로 편하게 웃는다.)', "(For the first time, she laughs easily.)"),
        line(Y, '방파제 끝, 제가 다툰 날 앉아 있던 데요. 거기로 가요.', "The end of the breakwater — where I sat the day I had that fight. Let's go there."),
        line(Y, '이번엔 셋이니까 자리가 좁을 거예요. 그래도 오늘은 좁은 게 좋아요.', "With three of us, it'll be cramped. But today, cramped is good."),
      ], {
        end: endTalk({ accept: true, offer: 'go_three' }),
        note: ['셋이 가자고, 갈치는 안 물어도 된다고 했다. 오가윤 씨는 정우미 씨도 갈치는 핑계라고 했다며 처음으로 편하게 웃었다. 다툰 날 앉아 있던 방파제 끝으로 가자고 했다.',
          "I said let's go, the three of us — the hairtail needn't bite. Gayun laughed easily for the first time: Umi had said the fish were just an excuse too. We'd go to the end of the breakwater where she'd sat the day of the fight."],
      }),
      half: scene([
        line(Y, '…머무는 건지, 못 떠나는 건지 저도 몰라요.', "...Whether she's staying or just can't leave — I don't know."),
        line(Y, '캠핑카는 원래 움직이는 집이잖아요. 그런데 반년째 시동을 안 걸어요.', "A camper's meant to be a home that moves. But she hasn't started the engine in half a year."),
        line(P, '(주차장 쪽, 캠핑카 창에 불이 켜져 있다.)', "(Over in the car park, a light is on in the camper window.)", { act: 'look_away' }),
        line(Y, '저는 그게 묻고 싶은데 못 물어요. 물으면 떠날까 봐요.', "I want to ask her about it, but I can't. I'm afraid she'll leave if I do."),
        line(Y, '그래서 그 앞에 앉아만 있어요.', "So I just sit in front of it."),
      ], {
        choices: [
          opt('ok', '그럼 셋이 나가 봐요', "Then let's head out, the three of us", {
            say: ['그럼 셋이 같이 나가 봐요.', "Then let's head out together, the three of us."],
            end: endTalk({ accept: true, offer: 'ask_half_year' }),
            note: ['정우미 씨가 여기 머무는 거냐고 물었다. 오가윤 씨는 머무는 건지 못 떠나는 건지 모르겠다고, 반년째 시동을 안 건다고 했다. 물으면 떠날까 봐 못 묻고 그 앞에 앉아만 있다고.', "I asked if Umi was staying. Gayun didn't know whether she was staying or couldn't leave — the engine hadn't started in half a year. Afraid that asking would make her go, Gayun just sits in front of it."] }),
          opt('long', '반년이면 호텔 손님보다 오래 묵었네요', "Half a year — longer than any hotel guest", {
            say: ['반년이면, 캠핑카가 호텔 손님보다 오래 묵었네요.', "Half a year — that camper's stayed longer than your hotel guests."],
            next: 'long' }),
        ],
        note: ['오가윤 씨는 캠핑카는 움직이는 집인데 반년째 시동을 안 건다고 했다. 캠핑카 창에 불이 켜져 있었다.', "Gayun said a camper is a home that moves, yet it hadn't been started in half a year. A light was on in its window."],
      }),
      long: scene([
        line(Y, '…장기 투숙객이죠. 제일 조용한 손님이에요. 룸서비스도 안 시키고요.', "...A long-stay guest. The quietest one we have. Never orders room service."),
        act(Y, 'laugh'),
        line(P, '(웃음이 터졌다가, 금방 손으로 입을 가린다.)', "(The laugh bursts out — then she quickly covers her mouth.)"),
        line(Y, '그래도 그 손님 덕에 주차장이 덜 쓸쓸해요. 밤에 불 켜진 창이 하나 있으니까요.', "Still, thanks to that guest the car park's less lonely. There's one lit window at night."),
        line(Y, '오늘은 그 창 주인이랑 셋이 나가요.', "Tonight, the three of us go out with the owner of that window."),
      ], {
        end: endTalk({ accept: true, offer: 'long_stay' }),
        note: ['반년이면 호텔 손님보다 오래 묵었다고 했다. 오가윤 씨는 제일 조용한 장기 투숙객이라며 웃음이 터졌다가 입을 가렸다. 그 손님 덕에 밤 주차장에 불 켜진 창이 하나 있다고 했다.',
          "I said the camper had outstayed any hotel guest. Gayun burst out laughing — their quietest long-stay guest — then covered her mouth. Thanks to it, the car park has one lit window at night."],
      }),
      third: scene([
        line(Y, '끼어 줘야 해요. 둘이면 또 말이 없어요.', "You have to come between us. With just two, we go quiet again."),
        line(Y, '셋이면 누구 하나는 말을 하잖아요.', "With three, someone always talks."),
        line(P, '(부탁하는 눈이 진지하다.)', "(The eyes asking me are serious.)"),
        line(Y, '그쪽이 있으면 저도 우미 씨도 편할 것 같아요. 갈치가 안 물어도 할 말이 생겨요.', "With you there, I think Umi and I would both be at ease. Even if the hairtail don't bite, there'll be something to say."),
      ], {
        end: endTalk({ accept: true, offer: 'third_wheel' }),
        note: ['두 사람 사이에 내가 끼어도 되겠느냐고 했다. 오가윤 씨는 둘이면 또 말이 없으니 끼어 줘야 한다고, 셋이면 누구 하나는 말을 한다고 진지하게 부탁했다.',
          "I asked if I'd really be welcome between the two of them. Gayun said I had to come — alone together they'd fall silent, but with three someone always talks."],
      }),
    },
  },
  // N12-3 — 끝내는 자리(오가윤)
  {
    id: 'n12_3_done', questId: 'N12-3', at: 'complete', npcId: Y, start: 'start',
    nodes: {
      start: scene([
        line(Y, '갈치는 안 물었네요.', "The hairtail didn't bite."),
        line(P, '셋이 방파제에 앉아만 있었죠.', "The three of us just sat on the breakwater."),
        line(Y, '…우미 씨가 그랬어요.', "...Umi said something."),
        line(P, '뭐라고요?', "What did she say?"),
        line(Y, '이 차, 이제 안 움직여도 될 것 같다고.', "That this van might not need to move anymore.", { act: 'look_away' }),
        line(Y, '저는 웃었어요.', "I laughed."),
      ], {
        choices: [
          opt('stay', '캠핑카는 거기 있어도 돼요. 두 분이 있으니까요', "The camper can stay. You two are here", {
            say: ['캠핑카는 거기 있어도 됩니다. 두 분이 있으니까요.', "The camper can stay right there. The two of you are here."],
            next: 'stay' }),
          opt('lesson', '캠핑카 야간 조리, 배 위에서 그대로 쓸게요', "I'll use that camper night cooking on the boat", {
            say: ['정우미 씨 캠핑카 야간 조리, 배 위에서 그대로 쓰겠습니다.', "That night-time camper cooking of Umi's — I'll use it just the same on the boat."],
            aff: { [U]: 0.03 }, end: endTalk({ complete: 'lesson',
              lineKo: '가스 하나로 세 가지. 순서가 있어요.\n\n물 끓이는 게 먼저, 그 물로 데치고, 마지막에 굽는 거래요. 우미 씨가 가르쳐 준 거예요. 저는 그 순서를 반년 동안 봤어요.',
              lineEn: "Three dishes on one burner. There's an order to it.\n\nBoil the water first, blanch in that water, and grill last, she says. Umi taught me. I watched that order for half a year." }),
            note: ['정우미 씨의 야간 조리를 배 위에서 쓰겠다고 했다. 오가윤 씨는 가스 하나로 세 가지, 물 끓이고 데치고 마지막에 굽는 순서라고 했다. 그 순서를 반년 동안 봤다고.', "I said I'd use Umi's night cooking on the boat. Gayun explained: three dishes on one burner — boil, then blanch, grill last. She'd watched that order for half a year."] }),
          opt('pay', '밤 낚시 가이드비는 받을게요', "I'll take a fee for the night fishing", {
            say: ['밤 낚시 가이드비는 받겠습니다.', "I'll take a guide fee for the night fishing."],
            end: endTalk({ complete: 'pay',
              lineKo: '…네. 호텔 직원 할인가로요.\n\n직원 할인은 원래 손님한테는 안 돼요. 근데 오늘은 손님이 아니니까요. 친구죠. 친구한테는 할인이 맞아요. 규정에는 없지만요.',
              lineEn: "...Sure. At the hotel staff rate.\n\nStaff discounts aren't supposed to go to guests. But today you're not a guest. You're a friend. A friend gets the discount. It's not in the rules, though." }),
            note: ['밤 낚시 가이드비를 받겠다고 했다. 오가윤 씨는 웃으면서 호텔 직원 할인가로 주었다. 오늘은 손님이 아니라 친구라서라고.', "I said I'd take a fee for the night fishing. Gayun paid it laughing — at the hotel staff rate, since today I wasn't a guest but a friend."] }),
          opt('moon', '갈치가 안 문 건 물때 탓이었을 거예요', "The tide must be why the hairtail didn't bite", {
            say: ['갈치가 안 문 건 물때 탓이었을 겁니다. 다음엔 맞춰 오겠습니다.', "The tide was probably why the hairtail didn't bite. Next time I'll time it right."],
            next: 'moon' }),
        ],
        note: ['여수로 돌아가 오가윤 씨, 정우미 씨와 셋이 밤 낚시를 나갔다. 갈치는 안 물었다. 정우미 씨가 이 차는 이제 안 움직여도 될 것 같다고 했고, 오가윤 씨는 아무 말 없이 웃었다.',
          "Back in Yeosu, I went night fishing with Gayun and Umi. The hairtail didn't bite. Umi said the van might not need to move anymore; Gayun said nothing and laughed."],
      }),
      stay: scene([
        line(Y, '…그 말, 우미 씨한테 해 줘요. 아니, 제가 할게요.', "...Say that to Umi. No — I'll say it."),
        line(Y, '지배인님한테 말했더니, 주차장에 자리를 하나 그어 줬어요. 흰 선으로요.', "I talked to the manager, and he painted a space for it in the car park. In white lines."),
        line(P, '캠핑카 자리요?', "A space for the camper?"),
        line(Y, '네. 이제 반년째가 아니라, 그냥 여기예요.', "Yes. It's not half a year anymore. It's just here."),
      ], {
        end: endTalk({ complete: 'stay' }),
        note: ['캠핑카는 두 사람이 있으니 거기 있어도 된다고 했다. 오가윤 씨는 그 말은 자기가 하겠다며, 지배인이 주차장에 흰 선으로 캠핑카 자리를 그어 줬다고 했다. 이제 반년째가 아니라 그냥 여기라고.',
          "I said the camper could stay, since the two of them were here. Gayun said she'd tell Umi herself — the manager had painted a camper space in white lines. It wasn't half a year anymore; it was just here."],
      }),
      moon: scene([
        line(Y, '물때요? 저는 그런 거 몰라요. 우미 씨가 알아요.', "The tide? I don't know about that. Umi does."),
        line(U, '물때보다 달이에요. 달 밝은 밤엔 갈치가 불빛에 덜 모여요.', "It's the moon more than the tide. On bright moonlit nights, hairtail gather less around the lights."),
        line(Y, '…그렇대요. 그러니까 다음엔 어두운 밤에 와요.', "...So she says. Next time, come on a dark night."),
      ], {
        end: endTalk({ complete: 'moon_bite' }),
        note: ['갈치가 안 문 건 물때 탓일 거라고 했다. 오가윤 씨가 캠핑카 쪽에 묻자 정우미 씨가 물때보다 달이라고, 달 밝은 밤엔 갈치가 불빛에 덜 모인다고 했다. 다음엔 어두운 밤에 오기로 했다.',
          "I guessed the tide was why nothing bit. Gayun called over to the camper, and Umi said it was the moon, not the tide — on bright nights hairtail gather less at the lights. Next time, a dark night."],
      }),
    },
  },
];
