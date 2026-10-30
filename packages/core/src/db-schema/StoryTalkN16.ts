/**
 * @file StoryTalkN16.ts
 * @description 290차 — N16 「석독구 — 등대지기 손자」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = `StoryTalkN01.ts`(286 시범).
 *
 * 인물
 *  - 석독구(12 · 공부는 꽝, 낚시는 천재) — 짧고 건방진 반말 · 턱을 치켜든다 · 「우리 섬은」 · 지는 걸 못 참는다 ·
 *    나를 「육지 사람」(놀리는 별명 — 성별 · 나이 없는 부름) · 가까워지면 「너」. 할아버지(석대양)는 「할아버지」.
 *  - 석대양(등대지기)은 이 대본에서 말하지 않는다 — 독구의 말로만 나온다.
 * 호칭(290): 나는 독구를 「석독구 씨」(드물게), 할아버지는 「등대에 계신 분」 · 「그분」 · 「석대양 씨」 — 「할아버지」라 부르지 않는다.
 *   나는 열두 살에게도 해요체로 말한다(290 지침 — 주인공은 늘 존댓말). 옛 답의 「아저씨」는 「육지 사람」 · 「너」로 바꿨다.
 * 정책: N16-1은 때가 있는(event) 곁가지 — 옛 미루는 답 `decline`으로 물러서는 끝이 있다.
 * 표시: 새로 만든 것 없음 — 옛 답의 표시(choice.n16_*)는 묶인 답이 남긴다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const D = 'seok_dokgu';
const P = 'player';

export const TALKS_N16: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N16-1 「도전장」 — 받는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'n16_1_offer', questId: 'N16-1', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '야, 육지 사람.', "Hey. Mainlander."),
        line(P, '…저요?', "...Me?"),
        line(D, '그래. 그 대 들고 섬에 왔으면 낚시하러 온 거지?', "Yeah. You came to the island with that rod, so you're here to fish, right?"),
        line(P, '네, 그런데요?', "Yes. Why?"),
        line(D, '육지 사람은 여기서 못 잡아. 내가 장담해.', "Mainlanders can't catch anything here. I guarantee it.", { act: 'look_up' }),
        line(P, '그건 해 봐야 알죠.', "You won't know until we try."),
        line(D, '그러니까 해 보자고. 볼락 대결. 세 마리 먼저 채우는 쪽이 이기는 거야.', "So let's try. A rockfish duel. First to three wins."),
        line(P, '대결이요? …몇 살이에요?', "A duel? ...How old are you?"),
        line(D, '열두 살. 석독구. 섬에서 볼락은 내가 제일 잘 잡아.', "Twelve. Seok Dokgu. Nobody on this island catches rockfish better than me."),
        line(D, '아, 하나 더. 미끼는 여기서 구해. 사 온 거 쓰면 반칙.', "Oh, one more thing. Get your bait here. Using store-bought is cheating."),
      ], {
        choices: [
          opt('accept', '좋아요. 육지 사람이 잡는 걸 보여 줄게요', "Fine. I'll show you a mainlander can catch", {
            say: ['좋아요. 육지 사람이 잡는 걸 보여 줄게요.', "All right. I'll show you what a mainlander can catch."], next: 'accept' }),
          opt('bait', '사 온 게 반칙이면, 미끼는 어디서 구해요?', "If store bait is cheating, where do I get bait?", { next: 'bait' }),
          opt('handicap', '그렇게 자신 있으면 핸디캡 하나는 줘야죠', "If you're that confident, give me a handicap", {
            say: ['그렇게 자신 있으면, 저한테 핸디캡 하나는 줘야 하는 거 아니에요?', "If you're that sure of yourself, shouldn't you give me a handicap?"], next: 'handicap' }),
          opt('no', '아이랑 대결은 안 할래요', "I'm not dueling a kid", {
            say: ['미안하지만, 아이랑 대결은 안 할래요.', "Sorry, but I'm not going to duel a kid."], next: 'coward' }),
        ],
        note: ['열두 살 석독구라는 아이가 육지 사람은 여기서 못 잡는다며 볼락 대결을 걸어왔다. 세 마리 먼저 채우는 쪽이 이기고, 미끼는 섬에서 구해야 한다고. 사 온 미끼는 반칙이라고 했다.',
          "A twelve-year-old named Seok Dokgu said mainlanders can't catch anything here and challenged me to a rockfish duel. First to three wins, and the bait has to come from the island — store-bought is cheating."],
      }),
      accept: scene([
        line(D, '말은 잘하네!', "You talk big!"),
        line(D, '말로 잡는 거 아니야. 세 마리 먼저 채우는 사람이 이기는 거야.', "You don't catch fish with talk. First one to fill three wins."),
        line(D, '사 온 미끼 쓰면 바로 반칙패야. 알았지?', "Use store bait and you lose on the spot. Got it?"),
        line(P, '알았어요.', "Got it."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['육지 사람이 잡는 걸 보여 주겠다고 했다. 석독구 씨는 말은 잘한다며, 사 온 미끼를 쓰면 바로 반칙패라고 못 박았다.',
          "I said I'd show him what a mainlander can catch. Dokgu said I talked big, and made it clear: store bait means an instant loss."],
      }),
      bait: scene([
        line(D, '그걸 왜 나한테 물어. 대결 상대한테.', "Why are you asking me? I'm your opponent.", { act: 'look_up' }),
        line(P, '그럼 누구한테 물어요.', "Who else am I supposed to ask?"),
        line(D, '…섬 사람은 미끼 안 사. 바다가 주니까.', "...Island people don't buy bait. The sea gives it to us."),
        line(D, '여기까지. 더 말하면 내가 져.', "That's all. Any more and I'll lose."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_bait' }),
        note: ['미끼를 어디서 구하느냐고 물었다. 석독구 씨는 대결 상대한테 왜 묻느냐며 턱을 치켜들고는, 섬 사람은 미끼를 안 산다고, 바다가 준다고만 했다.',
          "I asked where to find bait. Chin up, Dokgu asked why I'd ask my opponent — then said only that island people don't buy bait; the sea gives it."],
      }),
      handicap: scene([
        line(D, '핸디캡? 그거 육지 말이야?', "Handicap? Is that a mainland word?"),
        act(D, 'laugh'),
        line(D, '좋아, 하나 줄게. 나는 손으로 캔 미끼만 쓸게.', "Fine, I'll give you one. I'll only use bait I dig up by hand."),
        line(P, '그건 원래 그런 거 아니에요?', "Isn't that how it is anyway?"),
        line(D, '그러니까 핸디캡 없는 거랑 똑같아. 시작해.', "So it's the same as no handicap. Let's start."),
      ], {
        end: endTalk({ accept: true, offer: 'handicap' }),
        note: ['핸디캡을 달라고 했다. 석독구 씨는 뜻을 모르는 척하다가 씩 웃고, 손으로 캔 미끼만 쓰겠다고 했다. 원래 그렇다니 핸디캡이 없는 거나 같았다.',
          "I asked for a handicap. Dokgu pretended not to know the word, then grinned and said he'd only use hand-dug bait — which is what he does anyway, so no handicap at all."],
      }),
      coward: scene([
        line(D, '…겁쟁이.', "...Coward.", { act: 'look_away' }),
        line(D, '됐어. 혼자 잡을 거야.', "Forget it. I'll fish by myself."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['아이와 대결은 안 하겠다고 했다. 석독구 씨는 겁쟁이라고 쏘아붙이고는 혼자 갯바위 끝으로 갔다.',
          "I said I wouldn't duel a kid. Dokgu snapped that I was a coward and went off alone to the end of the rocks."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N16-1 — 끝내는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'n16_1_done', questId: 'N16-1', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '세 마리. 내가 먼저야.', "Three. I got there first."),
        line(P, '…졌어요. 저는 이제 막 세 마리째였는데.', "...I lost. I'd only just landed my third."),
        line(D, '내가 이겼지. 육지 사람치고는 나쁘지 않았어.', "I won. Not bad for a mainlander, though."),
        line(D, '이 릴, 줄게. 낡았지만 돼.', "Here, take this reel. It's old, but it works."),
        line(P, '이걸 저한테요? 이긴 쪽이 왜 줘요?', "To me? Why is the winner giving something?"),
        line(D, '이긴 사람이 주는 거야, 우리 섬은. 진 사람이 받아야 다음에 또 오니까.', "On our island, the winner gives. The loser has to take something so they come back."),
      ], {
        choices: [
          opt('lesson', '현지 미끼, 뭘 쓴 거예요? 가르쳐 줘요', "What local bait did you use? Teach me", {
            end: endTalk({ complete: 'lesson',
              lineKo: '갯바위 밑에. 손으로 캐.\n\n물 빠질 때 돌을 들면 밑에 붙어 있어. 돌은 들었던 대로 다시 놔. 안 그러면 다음에 없어. 섬은 다 그래.',
              lineEn: "Under the rocks. Dig it up by hand.\n\nLift a stone when the tide's out and it's stuck underneath. Put the stone back the way it was. Otherwise next time there's nothing. The whole island works like that." }),
            note: ['무슨 미끼를 썼느냐고 물었다. 석독구 씨는 물 빠질 때 돌을 들면 밑에 붙어 있다며, 돌은 들었던 대로 다시 놓으라고 했다.', "I asked what bait he'd used. Lift a stone at low tide and it's stuck underneath, Dokgu said — and put the stone back the way it was."] }),
          opt('rematch', '다음엔 제가 이길 거예요', "Next time, I'll win", { next: 'rematch' }),
          opt('pay', '대결이었잖아요. 상금은 없어요?', "It was a duel. Isn't there prize money?", {
            say: ['릴은 감사히 받을게요. 그런데 대결이면 상금도 있어야죠.', "I'll gladly take the reel. But a duel should have prize money too."], next: 'pay' }),
          opt('reel', '이 릴, 낡았는데 잘 돌아요. 어떻게 관리했어요?', "This reel's old but spins well. How do you look after it?", {
            end: endTalk({ complete: 'reel_care',
              lineKo: '바닷물 묻으면 민물로 헹궈. 그다음 말리고, 기름 한 방울. 두 방울 아니고 한 방울.\n\n많이 바르면 모래가 붙어. 그건 하나 망가뜨려 보고 안 거야.',
              lineEn: "When it gets seawater on it, rinse it in fresh water. Then dry it, and one drop of oil. One, not two.\n\nPut on too much and sand sticks. I learned that by ruining one." }),
            note: ['낡은 릴을 어떻게 관리했느냐고 물었다. 석독구 씨는 민물로 헹구고 말린 뒤 기름은 꼭 한 방울이라며, 하나 망가뜨려 보고 알았다고 했다.', "I asked how he kept the old reel running. Rinse in fresh water, dry it, exactly one drop of oil, Dokgu said — he learned by ruining one."] }),
        ],
        note: ['볼락 대결은 석독구 씨가 먼저 세 마리를 채워 내가 졌다. 아이는 낡은 릴을 내밀며, 섬에서는 이긴 사람이 주는 거라고, 진 사람이 받아야 다음에 또 온다고 했다.',
          "Dokgu filled three rockfish first, so I lost the duel. He held out an old reel — on his island the winner gives, he said, so the loser comes back."],
      }),
      rematch: scene([
        line(D, '해 봐, 육지 사람.', "Go ahead and try, mainlander."),
        act(D, 'laugh'),
        line(D, '우리 할아버지는 등대에 있어. 거기서 바다를 다 봐.', "My grandpa's at the lighthouse. He sees the whole sea from there."),
        line(P, '등대에요?', "At the lighthouse?"),
        line(D, '응. 네가 지는 것도 봤을걸.', "Yeah. He probably saw you lose."),
      ], {
        end: endTalk({ complete: 'rematch',
          lineKo: '다음엔 할아버지 보는 데서 해. 그럼 내가 더 크게 이기니까.',
          lineEn: "Next time, do it where Grandpa can watch. Then I win even bigger." }),
        note: ['다음엔 내가 이기겠다고 했다. 석독구 씨는 웃으며 할아버지가 등대에서 바다를 다 본다고, 다음엔 할아버지 보는 데서 하자고 했다.',
          "I said I'd win next time. Dokgu laughed and told me his grandfather watches the whole sea from the lighthouse — next time, he said, we'd do it where his grandpa could see."],
      }),
      pay: scene([
        line(D, '상금? …아이스크림!', "Prize money? ...Ice cream!"),
        act(D, 'give', { to: P }),
        line(D, '이긴 사람이 내는 거야. 이걸로 세 개 사 와.', "The winner pays. Go buy three with this."),
        line(P, '세 개요? 둘인데요.', "Three? There are only two of us."),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '하나는 내 거, 하나는 네 거. 하나는… 몰라, 그냥 하나 더. 이긴 사람은 원래 하나 더 먹는 거야.',
          lineEn: "One's mine, one's yours. And one's... I dunno, just one more. The winner always gets an extra." }),
        note: ['대결이면 상금이 있어야 한다고 했다. 석독구 씨는 이긴 사람이 내는 거라며 아이스크림값을 쥐여 주고, 세 개를 사 오라고 했다. 이긴 사람은 하나 더 먹는다고.',
          "I said a duel should have prize money. Dokgu pressed ice-cream money into my hand — the winner pays — and told me to buy three. The winner gets an extra, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N16-2 「등대까지」 — 받는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'n16_2_offer', questId: 'N16-2', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '육지 사람. …이거 좀 갖다 줘.', "Mainlander. ...Take this somewhere for me.", { act: 'look_away' }),
        line(P, '편지요? 누구한테요?', "A letter? To who?"),
        line(D, '할아버지. 등대에 있어.', "My grandpa. He's at the lighthouse."),
        line(P, '등대까지요? 직접 가면 되잖아요.', "All the way to the lighthouse? You could go yourself."),
        line(D, '내가 가면 안 돼. 왜냐고 묻지 마.', "I can't go. Don't ask why."),
        line(P, '…', '...'),
        line(D, '갖다 줘. 가는 김에 등대 밑에서 한 마리 해 봐. 거기 볼락 서.', "Just take it. While you're there, try for one under the lighthouse. Rockfish hold there."),
      ], {
        choices: [
          opt('ok', '알았어요. 안 묻고 갖다 줄게요', "All right. I'll take it and not ask", { next: 'ok' }),
          opt('keeper', '등대에서 뭘 하시는 분이에요?', "What does he do at the lighthouse?", {
            say: ['등대에 계신 분은 거기서 뭘 하시는데요?', "So what does he do up at the lighthouse?"], next: 'keeper' }),
          opt('why', '그래도 왜 못 가는지는 말해 줘요', "At least tell me why you can't go", { next: 'why' }),
          opt('fee', '우체부 값은 볼락 한 마리면 돼요', "My postage is one rockfish", {
            say: ['우체부 값은 볼락 한 마리면 되겠네요.', "One rockfish should cover my postage."], next: 'fee' }),
        ],
        note: ['석독구 씨가 등대에 있는 할아버지에게 편지를 갖다 달라고 했다. 자기는 가면 안 된다며 이유는 묻지 말라고 했다. 가는 김에 등대 밑에서 한 마리 해 보라고도 했다.',
          "Dokgu asked me to take a letter to his grandfather at the lighthouse. He can't go himself, he said, and I wasn't to ask why. While I was there, I should try for a fish under the lighthouse."],
      }),
      ok: scene([
        line(D, '…진짜 안 물어?', "...You really won't ask?", { act: 'peer' }),
        line(P, '안 물어요.', "I won't."),
        line(D, '접힌 거 펴 보면 안 돼.', "Don't unfold it."),
        line(D, '주고 나서 바로 와. 거기서 오래 있지 말고.', "Hand it over and come straight back. Don't hang around up there."),
      ], {
        end: endTalk({ accept: true, offer: 'deliver_ok' }),
        note: ['안 묻고 갖다 주겠다고 했다. 석독구 씨는 편지를 내밀다가 진짜 안 묻느냐고 한 번 더 확인하고, 펴 보지 말고 주고 나서 바로 오라고 했다.',
          "I said I'd deliver it without asking. Holding out the letter, Dokgu checked once more that I really wouldn't ask — don't unfold it, hand it over and come straight back."],
      }),
      keeper: scene([
        line(D, '등대지기야. 불 켜고, 바람 적고, 파도 적어. 종이에 손으로.', "He's the lighthouse keeper. Lights the lamp, writes down the wind, writes down the waves. By hand, on paper."),
        line(P, '기계가 있지 않아요?', "Isn't there a machine for that?"),
        line(D, '있는데도 적어. 하루에도 몇 번씩. 왜 그러는지는 몰라.', "There is, and he still writes it. Several times a day. I don't know why."),
        line(D, '아무튼 할아버지는 바다를 적는 사람이야. 나는 바다를 낚는 사람이고.', "Anyway, Grandpa's someone who writes down the sea. I'm someone who fishes it."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_lighthouse' }),
        note: ['등대에서 뭘 하시느냐고 물었다. 석독구 씨는 할아버지가 등대지기라며, 기계가 있는데도 바람과 파도를 손으로 적는다고 했다. 할아버지는 바다를 적고 자기는 바다를 낚는다고.',
          "I asked what his grandfather does there. He's the keeper, Dokgu said — still writes down wind and waves by hand though there's a machine. Grandpa writes the sea; Dokgu fishes it."],
      }),
      why: scene([
        line(D, '묻지 말랬지.', "I said don't ask.", { act: 'look_away' }),
        act(D, 'silence'),
        line(D, '…그냥 못 가. 갔다가 할아버지가 뭐라고 하면, 나 또 대답 못 해.', "...I just can't. If I go and Grandpa says something, I won't be able to answer again."),
        line(D, '편지는 대답 안 해도 되잖아. 그러니까 네가 가.', "A letter doesn't have to answer. So you go."),
      ], {
        end: endTalk({ accept: true, offer: 'press_why' }),
        note: ['그래도 이유는 말해 달라고 했다. 석독구 씨는 입을 꾹 다물었다가 귀가 빨개진 채로, 할아버지가 뭐라고 하면 또 대답을 못 할 거라고 했다. 편지는 대답 안 해도 된다고.',
          "I pressed him for a reason. Dokgu clamped his mouth shut, ears going red, then said if his grandpa said something he wouldn't be able to answer again. A letter doesn't have to answer."],
      }),
      fee: scene([
        line(D, '볼락? 내 볼락 비싼데.', "A rockfish? My rockfish are expensive."),
        act(D, 'silence'),
        line(D, '…좋아, 한 마리. 대신 편지 갖다 주고 나서.', "...Fine, one. But after you deliver the letter."),
        line(D, '그리고 할아버지가 뭐라고 했는지 말하지 마. 아니, 말해. 아니… 그건 그때 생각할게.', "And don't tell me what Grandpa said. No, tell me. No... I'll think about that then."),
      ], {
        end: endTalk({ accept: true, offer: 'postman_fee' }),
        note: ['우체부 값으로 볼락 한 마리를 달라고 했다. 석독구 씨는 진지하게 고민하더니 편지를 갖다 준 뒤에 주겠다고 했다. 할아버지 말을 전해 들을지는 그때 생각하겠다고.',
          "I asked for one rockfish as postage. Dokgu weighed it seriously and agreed — after delivery. Whether to hear what his grandpa said, he'd decide then."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N16-2 — 끝내는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'n16_2_done', questId: 'N16-2', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '…갖다 줬어?', "...Did you give it to him?"),
        line(P, '전했어요. 등대에 계신 분께 직접요.', "I did. Straight into his hands at the lighthouse."),
        line(D, '…읽었대?', "...Did he read it?"),
        line(P, '읽으셨어요. 그리고—', "He did. And then—"),
        line(D, '아니, 말하지 마.', "No. Don't tell me.", { act: 'shake_head' }),
        act(D, 'silence'),
        line(D, '…됐어.', "...Never mind."),
      ], {
        choices: [
          opt('long', '오래 서 계셨어요. 편지를 들고요', "He stood there a long time, holding the letter", { next: 'long' }),
          opt('ask', '왜 직접 안 갔는지, 이제 말해 줄래요?', "Will you tell me now why you didn't go?", {
            say: ['왜 직접 안 갔는지, 이제는 말해 줄래요?', "Will you tell me now why you didn't go yourself?"], next: 'ask' }),
          opt('pay', '심부름값은 받아야죠', "I'll take my errand fee", {
            end: endTalk({ complete: 'pay',
              lineKo: '용돈… 없어. 볼락 줄게.\n\n제일 큰 거야. 아니, 두 번째로 큰 거. 제일 큰 건 할아버지 갖다 줄 거야. …아무한테도 말하지 마.',
              lineEn: "Pocket money... I don't have any. I'll give you a rockfish.\n\nIt's the biggest one. No, the second biggest. The biggest is for Grandpa. ...Don't tell anyone." }),
            note: ['심부름값을 달라고 했다. 석독구 씨는 용돈이 없다며 볼락을 줬다. 두 번째로 큰 거라고, 제일 큰 건 할아버지 몫이라고 했다.', "I asked for my errand fee. Dokgu had no pocket money, so he gave me a rockfish — the second biggest. The biggest was for his grandpa."] }),
          opt('spot', '등대 밑에서 하나 올렸어요. 물이 도는 자리던데요', "I landed one under the lighthouse. The water swirls there", {
            end: endTalk({ complete: 'lighthouse_spot',
              lineKo: '알아, 바위 꺾이는 데지? 거기 물이 돌아서 볼락이 서. 육지 사람치고 잘 찾았네.\n\n거기선 미끼를 물 따라 흘려야 돼. 그걸 알았으면 됐어.',
              lineEn: "I know — where the rock bends, right? The water swirls there, so the rockfish hold. Good find, for a mainlander.\n\nThere you have to let the bait drift with the current. If you figured that out, you're fine." }),
            note: ['등대 밑 물이 도는 자리에서 하나 올렸다고 했다. 석독구 씨는 처음으로 순순히 인정하며, 거기선 미끼를 물 따라 흘려야 한다고 했다.', "I told him I'd landed one where the water swirls under the lighthouse. For the first time Dokgu admitted it plainly — there, you let the bait drift with the current."] }),
        ],
        note: ['편지를 등대에 있는 할아버지께 직접 전했다고 했다. 읽으셨느냐고 묻던 석독구 씨는, 내가 뒷말을 하려 하자 고개를 저으며 말하지 말라고 했다.',
          "I told Dokgu I'd delivered the letter to his grandfather in person. He asked if it had been read — then, when I started to say more, shook his head and told me not to."],
      }),
      long: scene([
        line(D, '…오래?', "...A long time?"),
        line(D, '얼마나 오래.', "How long?", { act: 'look_sea' }),
        line(P, '해가 한참 기울 때까지요.', "Until the sun had sunk a good way."),
        act(D, 'silence'),
      ], {
        end: endTalk({ complete: 'deliver',
          lineKo: '…그래. 그럼 됐어.\n\n나 잠깐 어디 좀 갔다 올게.',
          lineEn: "...Okay. Then that's enough.\n\nI'm going somewhere for a bit." }),
        note: ['할아버지가 편지를 들고 오래 서 계셨다고 했다. 석독구 씨는 등대 쪽을 한참 보더니, 잠깐 어디 좀 갔다 오겠다고 했다. 등대로 올라가는 길이었다.',
          "I said his grandfather had stood holding the letter for a long time. Dokgu looked toward the lighthouse for a while, then said he was going somewhere for a bit. He headed up the lighthouse path."],
      }),
      ask: scene([
        line(D, '…할아버지가 내 낚시 싫어해. 공부하래.', "...Grandpa hates my fishing. He wants me to study."),
        line(P, '그럼 편지에는 뭐라고 썼어요?', "Then what did you write in the letter?"),
        line(D, '볼락 세 마리. 그것만.', "Three rockfish. That's all."),
        line(D, '공부는 꽝이야. 그건 나도 알아. 근데 볼락은 세 마리 잡았어. 그거 말고는 쓸 게 없었어.', "I'm hopeless at school. I know that. But I caught three rockfish. There was nothing else to write."),
      ], {
        end: endTalk({ complete: 'ask',
          lineKo: '할아버지가 그걸 읽고 뭐라고 했을지… 모르겠다. 화냈을지도.',
          lineEn: "What Grandpa said when he read it... I don't know. Maybe he got angry." }),
        note: ['이제 이유를 말해 달라고 했다. 석독구 씨는 할아버지가 자기 낚시를 싫어하고 공부하라고 한다며, 편지에는 볼락 세 마리라고만 썼다고 했다. 그거 말고는 쓸 게 없었다고.',
          "I asked him to tell me why now. Dokgu said his grandpa hates his fishing and wants him to study — and the letter said only three rockfish. There was nothing else to write."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N16-3 「독구의 첫 바다」 — 받는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'n16_3_offer', questId: 'N16-3', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '육지 사람! 육지 사람!', "Mainlander! Mainlander!", { act: 'look_up' }),
        line(P, '무슨 일인데 그렇게 뛰어와요?', "What's got you running like that?"),
        line(D, '나 조사선 탄대! 독도 가는 거!', "I'm getting on the survey boat! The one going to Dokdo!"),
        line(P, '조사선이요? 열두 살이 탈 수 있어요?', "The survey boat? Can a twelve-year-old ride it?"),
        line(D, '보호자 동의 있으면 돼. 할아버지가 동의했어!', "You can with a guardian's consent. Grandpa consented!"),
        line(P, '(…그분이?)', "(...He did?)"),
        line(D, '돌돔 재고 놓는 거야. 내가 잰다. 너는 같이 타서 보조해.', "We measure barred knifejaw and let them go. I'm doing the measuring. You come along and assist."),
        line(P, '돌돔을 재고, 놓아주고.', "Measure the knifejaw, then release it."),
        line(D, '응. 그리고… 오늘이 할아버지 마지막 근무래.', "Yeah. And... today's Grandpa's last shift."),
      ], {
        choices: [
          opt('consent', '정말 동의해 주셨어요? 어떻게요?', "He really consented? How?", { next: 'consent' }),
          opt('shift', '마지막 근무요? 등대를 그만두시는 거예요?', "Last shift? He's leaving the lighthouse?", { next: 'shift' }),
          opt('rule', '축하해요. 첫 바다에선 자는 직접 대요', "Congratulations. On your first sea, you hold the ruler", {
            say: ['축하해요. 첫 바다에선 자는 직접 대요.', "Congratulations. On your first sea, you hold the ruler yourself."], next: 'rule' }),
        ],
        note: ['석독구 씨가 뛰어와서 독도 가는 조사선을 탄다고 했다. 할아버지가 보호자 동의를 해 줬다며, 돌돔을 재고 놓아주는 일에 나더러 같이 타서 보조하라고 했다. 오늘이 할아버지 마지막 근무라고 했다.',
          "Dokgu came running to say he'd ride the survey boat to Dokdo — his grandfather had signed as guardian. He wanted me aboard to assist while he measured and released barred knifejaw. Today was his grandpa's last shift."],
      }),
      consent: scene([
        line(D, '몰라. 그냥 서류 내밀었더니 이름 써 줬어. 아무 말도 없이.', "Dunno. I just held out the form and he signed it. Without a word."),
        line(P, '아무 말도 없이요?', "Without a word?"),
        line(D, '보호자 칸에 할아버지 이름 있어. 진짜야. 봐.', "Grandpa's name is in the guardian box. For real. Look."),
        line(D, '…편지 때문인가. 아니야, 그건 모르겠어. 아무튼 썼어.', "...Was it because of the letter? No, I don't know. Anyway, he signed."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_consent' }),
        note: ['어떻게 동의를 받았느냐고 물었다. 석독구 씨는 서류를 내밀었더니 아무 말 없이 이름을 써 줬다며 보호자 칸을 보여 줬다. 편지 때문인지는 모르겠다고 했다.',
          "I asked how he got consent. Dokgu said he held out the form and his grandpa signed it without a word — and showed me the guardian box. Whether it was the letter, he didn't know."],
      }),
      shift: scene([
        line(D, '교대래. 등대는 이제 다른 사람이 지킨대.', "It's a handover. Someone else is keeping the lighthouse now."),
        line(D, '할아버지는 오늘 무전으로 교대 신호만 하면 끝이야.', "Grandpa just has to give the handover signal over the radio today, and that's it."),
        act(D, 'silence'),
        line(P, '…그래서 오늘 타는 거군요.', "...So that's why you're going today."),
        line(D, '응. 할아버지가 등대에서 보는 마지막 배에 내가 타 있으려고. 이건 할아버지한테 말하지 마.', "Yeah. So I'll be on the last boat Grandpa sees from the lighthouse. Don't tell him that."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_last_shift' }),
        note: ['마지막 근무가 무슨 뜻이냐고 물었다. 오늘 무전으로 교대 신호를 하면 할아버지는 등대를 떠난단다. 석독구 씨는 할아버지가 등대에서 보는 마지막 배에 자기가 타 있으려는 거라고, 그건 비밀이라고 했다.',
          "I asked what last shift meant. After today's radio handover, his grandfather leaves the lighthouse. Dokgu wanted to be on the last boat his grandpa would see from there — and that was a secret."],
      }),
      rule: scene([
        line(D, '응! 내 자로 할 거야! 눈금 옆에 내 이름도 써 놨어.', "Yeah! I'm using my own ruler! I even wrote my name next to the markings."),
        line(P, '사진도 찍어요? 돌돔 줄무늬 예쁘잖아요.', "Taking photos too? Knifejaw stripes are pretty."),
        line(D, '찍을 거야. 재고, 찍고, 놔. 쿨러는 안 열어. 조사선은 잡는 배가 아니래.', "I will. Measure, photo, release. The cooler stays shut. The survey boat isn't a catching boat, they said."),
      ], {
        choices: [
          opt('yours', '좋아요. 오늘은 그 자로 재요', "Good. Today you measure with that ruler", {
            end: endTalk({ accept: true, offer: 'own_rule' }),
            note: ['오늘은 석독구 씨 자로 재자고 했다.', "I said today we'd measure with Dokgu's own ruler."] }),
          opt('rules', '그래도 조사선에선 제 말 잘 들어야 해요', "But on the survey boat, you have to listen to me", {
            say: ['조사선은 장난 아니에요. 거기선 제 말 잘 들어야 해요.', "The survey boat is no game. Out there, you need to listen to me."], next: 'rules' }),
        ],
        note: ['첫 바다에선 자기 자를 대라고 했더니, 석독구 씨는 이름까지 적어 둔 자를 흔들었다. 재고, 찍고, 놓는다고. 조사선은 잡는 배가 아니라고 했다.',
          "When I said to use his own ruler on his first sea, Dokgu waved one with his name written on it. Measure, photo, release — the survey boat isn't for catching, he said."],
      }),
      rules: scene([
        line(D, '알아! 구명조끼 먼저, 갑판에서 안 뛰고, 자 대기 전에 손 적시고.', "I know! Life jacket first, no running on deck, wet your hands before the ruler."),
        line(P, '손은 왜 적셔요?', "Why wet your hands?"),
        line(D, '돌돔 비늘 때문이야. 마른 손은 고기한테 뜨거워.', "For the knifejaw's scales. Dry hands burn the fish."),
        line(D, '이건 육지 사람이 가르쳐 준 거잖아.', "You're the one who taught me that, mainlander."),
      ], {
        end: endTalk({ accept: true, offer: 'survey_rules' }),
        note: ['조사선에선 내 말을 잘 들으라고 했다. 석독구 씨는 손가락을 접어 가며 규칙을 줄줄 외고, 손을 적시는 건 내가 가르쳐 준 거라고 했다.',
          "I told him to listen to me on the survey boat. Counting on his fingers, Dokgu reeled off the rules — and said wetting your hands was something I'd taught him."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N16-3 — 끝내는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'n16_3_done', questId: 'N16-3', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '할아버지가… 답을 안 해. 무전.', "Grandpa... isn't answering. On the radio.", { act: 'look_away' }),
        line(P, '무전기에 대고 뭐라고 했는데요?', "What did you say into the radio?"),
        line(D, '할아버지, 나 돌돔 쟀어. 그렇게.', "Grandpa, I measured a knifejaw. That's what."),
        act(D, 'silence'),
        line(D, '…아니, 했어. 한참 있다가. 잘했다고.', "...No, he did answer. After a long while. He said good job."),
        line(D, '처음이야, 그 말.', "First time I've ever heard that."),
      ], {
        choices: [
          opt('first', '처음 들은 잘했다는 말, 잊지 마요', "Don't forget the first good job you heard", {
            say: ['처음 들은 잘했다는 말, 잊지 마요.', "That first good job — don't forget it."], next: 'first' }),
          opt('lesson', '자 대는 법이 조사단보다 정확했어요', "You measured more precisely than the survey team", {
            say: ['자 대는 법이 조사단보다 정확하더라고요. 어디서 배웠어요?', "You read the ruler more precisely than the survey team. Where did you learn that?"],
            end: endTalk({ complete: 'lesson',
              lineKo: '할아버지가. 기상 적을 때. 눈금 읽는 법.\n\n눈금은 똑바로 마주 보고 읽어. 비스듬히 보면 길이가 달라져. 할아버지는 바람 적을 때도 그렇게 했어. 한 번 읽고, 한 번 더 읽고.',
              lineEn: "From Grandpa. When he wrote the weather. How to read the marks.\n\nRead the marks looking straight at them. Look at an angle and the length changes. Grandpa did that when he wrote the wind, too. Read once, read again." }),
            note: ['자를 정확히 대는 법을 어디서 배웠느냐고 물었다. 할아버지가 기상을 적을 때 눈금 읽는 법을 배웠다고, 눈금은 똑바로 마주 보고 읽는다고 했다.', "I asked where he'd learned to read a ruler so precisely. From his grandpa writing the weather, Dokgu said — read the marks looking straight at them."] }),
          opt('pay', '조사 보조 수당은 어른한테 주는 거죠', "Survey assistant pay goes to the grown-up, right?", { next: 'pay' }),
          opt('sea', '수당은 됐어요. 오늘은 석독구 씨 바다였으니까요', "Keep the pay. Today was your sea, Dokgu", {
            end: endTalk({ complete: 'your_sea',
              lineKo: '내 바다? …내 바다.\n\n그럼 너는 손님이야. 손님은 돈 안 받아도 돼, 오늘만. 조사단 형들한테 네 이름 말해 둘게.',
              lineEn: "My sea? ...My sea.\n\nThen you're a guest. Guests don't have to get paid — just today. I'll tell the survey guys your name." }),
            note: ['수당은 됐다고, 오늘은 석독구 씨 바다였다고 했다. 아이는 내 바다, 하고 입속으로 한 번 더 굴리더니 그럼 나는 손님이라고 했다.', "I said to keep the pay — today was Dokgu's sea. He rolled the words around once more, my sea, and said that made me a guest."] }),
        ],
        note: ['석독구 씨가 돌돔을 재고 무전기에 대고 할아버지를 불렀다. 답이 없다가 한참 뒤에 잘했다는 말이 돌아왔다. 아이는 처음 듣는 말이라고 했다.',
          "Dokgu measured a knifejaw and called his grandfather on the radio. No answer — then, after a long while, good job. He said it was the first time he'd ever heard it."],
      }),
      first: scene([
        line(D, '안 잊어.', "I won't."),
        line(D, '할아버지 자는 오래 쓴 거야. 눈금이 다 닳았어.', "Grandpa's ruler is ancient. The marks are all worn off."),
        line(P, '그 자는 이제 어떻게 해요?', "What happens to that ruler now?"),
      ], {
        end: endTalk({ complete: 'first',
          lineKo: '이제 나는 내 걸로 잴 거야. 할아버지처럼 오래오래.',
          lineEn: "From now on I'll measure with mine. For a long, long time, like Grandpa." }),
        note: ['처음 들은 잘했다는 말을 잊지 말라고 했다. 석독구 씨는 안 잊는다고, 이제 할아버지처럼 자기 자로 오래오래 재겠다고 했다.',
          "I told him not to forget that first good job. Dokgu said he wouldn't — from now on he'd measure with his own ruler, for a long time, like his grandpa."],
      }),
      pay: scene([
        line(D, '어른? 육지 사람이? …그럼 아이스크림.', "Grown-up? You? ...Then ice cream."),
        act(D, 'give', { to: P }),
        line(D, '조사단 형들이 준 거야. 이걸로 다섯 개 사.', "The survey guys gave me this. Buy five with it."),
        line(P, '다섯 개요?', "Five?"),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '나, 너, 조사단 형 둘, 그리고 할아버지. 할아버지 건 녹겠지만 그래도 사 갈 거야. 마지막 근무 끝났으니까.',
          lineEn: "Me, you, the two survey guys, and Grandpa. Grandpa's will melt, but I'm taking it anyway. His last shift's over." }),
        note: ['조사 보조 수당을 달라고 했다. 석독구 씨는 조사단이 준 돈을 건네며 아이스크림 다섯 개를 사라고 했다. 하나는 마지막 근무를 마친 할아버지 몫이라고.',
          "I asked for the survey assistant's pay. Dokgu handed over money from the survey team and told me to buy five ice creams — one for his grandfather, whose last shift was over."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N16-4 「독구의 첫 제자」 — 받는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'n16_4_offer', questId: 'N16-4', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '육지 사람, 나 제자 생겼어.', "Mainlander, I've got a student."),
        line(P, '제자요? 낚시 제자요?', "A student? A fishing student?"),
        line(D, '응. 조사단 형. 갯바위 가르쳐.', "Yeah. One of the survey guys. I'm teaching him the rocks."),
        line(P, '조사단이면 대학생 아니에요?', "The survey team — isn't he a university student?"),
        line(D, '맞아. 그래도 갯바위는 내가 더 잘 알아.', "Yeah. But I know the rocks better."),
        line(D, '같이 두 마리 재고 놔. 내가 가르칠게. 너는… 옆에 있어.', "We'll measure two and let them go together. I'll teach. You... stay beside us.", { act: 'look_away' }),
        line(P, '저는 뭘 하면 되는데요?', "So what do I do?"),
        line(D, '보기만 해. 틀려도 말하지 마. 내가 고칠 거야.', "Just watch. Even if I get something wrong, don't say anything. I'll fix it."),
      ], {
        choices: [
          opt('student', '대학생이 열두 살한테 배운다고요?', "A university student is learning from a twelve-year-old?", { next: 'student' }),
          opt('tease', '선생 소리 들으니까 좋아요?', "Do you like being called teacher?", {
            say: ['선생 소리 들으니까 기분 좋아요?', "Does it feel good, being called teacher?"], next: 'tease' }),
          opt('safety', '그 사람 안전까지 책임질 수 있어요?', "Can you take responsibility for his safety too?", {
            say: ['갯바위는 위험해요. 그 사람 안전까지 책임질 수 있어요?', "The rocks are dangerous. Can you be responsible for his safety too?"], next: 'safety' }),
        ],
        note: ['석독구 씨가 제자가 생겼다고 했다. 조사단 대학생에게 갯바위를 가르친다며, 같이 두 마리를 재고 놓아주자고 했다. 나는 옆에서 보기만 하고, 틀려도 말하지 말라고 했다.',
          "Dokgu told me he had a student — a university student from the survey team he was teaching on the rocks. We'd measure and release two together. I was only to watch, and say nothing even if he got it wrong."],
      }),
      student: scene([
        line(D, '응. 형이 책은 많이 읽었는데 갯바위는 처음이래. 첫날 미끄러질 뻔했어.', "Yeah. He's read tons of books, but it's his first time on the rocks. He nearly slipped on day one."),
        line(D, '책에는 돌돔 줄무늬가 몇 개인지는 나오는데, 어디를 디디면 미끄러운지는 안 나온대.', "Books tell you how many stripes a knifejaw has, but not where it's slippery to step."),
        line(P, '그건 석독구 씨가 알고요.', "And that, you know."),
        line(D, '그러니까 내가 선생이야.', "That's why I'm the teacher."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_student' }),
        note: ['대학생이 열두 살한테 배우느냐고 물었다. 석독구 씨는 책에는 돌돔 줄무늬가 몇 개인지는 나와도 어디가 미끄러운지는 안 나온다며, 그러니 자기가 선생이라고 했다. 자랑스러운 걸 숨기지 못했다.',
          "I asked if a university student was really learning from a twelve-year-old. Books tell you a knifejaw's stripes but not where the rocks are slippery, Dokgu said — so he's the teacher. He couldn't hide how proud he was."],
      }),
      tease: scene([
        line(D, '…좋아. 엄청.', "...Yeah. A lot.", { act: 'look_away' }),
        line(D, '근데 형이 나보다 키가 두 배야. 선생이 올려다보면서 가르쳐.', "But he's twice my height. The teacher has to look up while he teaches."),
        line(P, '(웃음을 꾹 참는다…)', "(I hold back a laugh...)"),
        line(D, '그래도 형이 내 말을 다 들어. 할아버지보다 잘 들어.', "Still, he listens to everything I say. Better than Grandpa does."),
      ], {
        end: endTalk({ accept: true, offer: 'tease_teacher' }),
        note: ['선생 소리가 좋으냐고 놀렸다. 석독구 씨는 얼굴이 빨개지면서도 엄청 좋다고 했다. 제자가 키가 두 배라 올려다보며 가르친다고.',
          "I teased him about being called teacher. Face going red, Dokgu admitted he loved it. His student is twice his height, so he teaches looking up."],
      }),
      safety: scene([
        line(D, '할 수 있어. 아니, 해야 돼. 선생이니까.', "I can. No — I have to. I'm the teacher.", { act: 'nod' }),
        line(D, '조끼 끈부터 보고, 물 올라오면 형부터 내보내고.', "Check his vest straps first, and when the water comes up, send him off first."),
        line(D, '네가 나한테 한 거 그대로 할 거야. 그럼 아무도 안 다쳐.', "I'll do exactly what you did with me. Then nobody gets hurt."),
      ], {
        choices: [
          opt('watch', '알았어요. 오늘은 보기만 할게요', "All right. Today I'll only watch", {
            say: ['알았어요. 오늘은 석독구 씨가 선생이에요. 저는 보기만 할게요.', "All right. Today you're the teacher. I'll just watch."],
            end: endTalk({ accept: true, offer: 'watch_only' }),
            note: ['오늘은 석독구 씨가 선생이고 나는 보기만 하겠다고 했다. 아이는 어깨를 펴고 제자 쪽으로 손짓했다.', "I said that today Dokgu was the teacher and I'd only watch. He squared his shoulders and waved his student over."] }),
          opt('trust', '그럼 믿을게요', "Then I'll trust you", {
            end: endTalk({ accept: true, offer: 'safety_first' }),
            note: ['그렇다면 믿겠다고 했다.', "I said that in that case, I'd trust him."] }),
        ],
        note: ['제자의 안전까지 책임질 수 있느냐고 물었다. 석독구 씨는 진지하게 고개를 끄덕이며 선생이니까 해야 한다고, 내가 자기한테 한 그대로 하겠다고 했다.',
          "I asked if he could be responsible for his student's safety. Nodding seriously, Dokgu said he had to — he's the teacher — and he'd do exactly what I had done with him."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N16-4 — 끝내는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'n16_4_done', questId: 'N16-4', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '놨어! 두 마리 다!', "Released! Both of them!"),
        line(P, '봤어요. 재는 것도, 놓는 것도.', "I saw. The measuring and the releasing."),
        line(D, '제자가 잘해. 내가 가르쳤으니까.', "My student's good. Because I taught him."),
        line(D, '…근데, 하다 보니까 내 말이 네 말이랑 똑같더라.', "...But while I was doing it, my words came out exactly like yours.", { act: 'look_up' }),
        line(P, '저도 듣다가 깜짝 놀랐어요.', "I was startled listening to it too."),
      ], {
        choices: [
          opt('same', '똑같이 가르치더라고요. 제가 배운 대로', "You taught exactly the way I learned", {
            say: ['똑같이 가르치더라고요. 제가 배운 그대로요.', "You taught it exactly the same. Just the way I learned it."], next: 'same' }),
          opt('lesson', '가르치는 걸 보고 저도 배웠어요', "Watching you teach, I learned too", {
            say: ['석독구 씨가 가르치는 걸 보고, 저도 가르치는 법을 배웠어요.', "Watching you teach, I learned how to teach, too."],
            end: endTalk({ complete: 'lesson',
              lineKo: '가르치는 법? 그냥 옆에 서.\n\n앞에 서면 형이 내 등만 봐. 뒤에 서면 내가 형을 못 봐. 옆에 서야 둘 다 바다를 봐. 너도 맨날 내 옆에 섰잖아.',
              lineEn: "How to teach? You just stand beside them.\n\nStand in front and he only sees my back. Stand behind and I can't see him. Beside him, we both see the sea. You always stood beside me too." }),
            note: ['가르치는 걸 보고 나도 배웠다고 했다. 석독구 씨는 그냥 옆에 서는 거라고, 옆에 서야 둘 다 바다를 본다고 했다.', "I said watching him teach had taught me something too. You just stand beside them, Dokgu said — beside, you both see the sea."] }),
          opt('pay', '수업료는 스승 몫이에요', "The lesson fee belongs to the teacher", {
            say: ['조사단에서 수업료 나왔다던데요. 그건 스승 몫이에요.', "I heard the survey team paid a lesson fee. That belongs to the teacher."], next: 'pay' }),
          opt('yours', '수업료는 됐어요. 가르친 건 석독구 씨니까요', "No fee for me. You're the one who taught", {
            end: endTalk({ complete: 'your_teaching',
              lineKo: '…가르친 건 나지. 맞아.\n\n그래도 네가 먼저 나한테 가르쳤잖아. 그러니까 반은 네 거야. 형한테 말해 둘게, 내 선생의 선생이라고.',
              lineEn: "...I'm the one who taught. That's right.\n\nBut you taught me first. So half of it's yours. I'll tell him — you're my teacher's teacher." }),
            note: ['수업료는 됐다고, 가르친 건 석독구 씨라고 했다. 아이는 어깨를 펴고, 그래도 반은 내 몫이라며 나를 선생의 선생이라고 하겠다고 했다.', "I said no fee — he was the one who taught. Dokgu squared his shoulders and said half was still mine; he'd call me his teacher's teacher."] }),
        ],
        note: ['석독구 씨와 제자가 두 마리를 재고 놓아줬다. 가르치다 보니 자기 말이 내 말이랑 똑같더라는 아이의 말에, 내가 받은 것이 그대로 건너가고 있다는 걸 알았다.',
          "Dokgu and his student measured and released two fish. When he said his words came out exactly like mine, I realized what I'd been given was passing straight on."],
      }),
      same: scene([
        line(D, '…너도 누구한테 배웠지?', "...You learned from someone too, right?"),
        line(P, '속초에서 좌판 하시는 정옥선 씨한테요. 처음부터 다요.', "From Jeong Okseon, who runs a stall in Sokcho. Everything, from the start."),
        line(D, '그럼 그 할머니가 맨 처음이야? 아니면 그 할머니도 누구한테 배웠어?', "So she's the very first? Or did that grandma learn from someone too?"),
        line(P, '아마 그분도 누군가한테 배웠겠죠.', "She probably learned from someone too."),
      ], {
        end: endTalk({ complete: 'same',
          lineKo: '…그럼 끝이 없네. 그거 좋다. 나도 끝 안 낼 거야.',
          lineEn: "...Then it never ends. I like that. I'm not going to end it either." }),
        note: ['똑같이 가르치더라고 했다. 누구한테 배웠느냐는 물음에 정옥선 씨 이야기를 했다. 석독구 씨는 그분도 누군가한테 배웠다면 끝이 없다며, 자기도 끝내지 않겠다고 했다.',
          "I said he'd taught it the same way. When he asked who taught me, I told him about Jeong Okseon. If she learned from someone too, Dokgu said, then it never ends — and he wouldn't end it either."],
      }),
      pay: scene([
        line(D, '수업료! 그럼 이건 네 몫이야.', "Lesson fee! Then this is your share."),
        act(D, 'give', { to: P }),
        line(D, '나는 내 몫으로 제자한테 아이스크림 사 줄 거야.', "I'm buying my student ice cream with mine."),
        line(P, '제자한테 사 주는 거예요?', "You're buying it for him?"),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '선생이 사 주는 거야. 원래 그래. 너도 나한테 사 줬잖아. 아니, 그건 내가 산 건가. 아무튼 이번엔 내가 사.',
          lineEn: "The teacher buys. That's how it goes. You bought me some too. No, wait, did I buy that? Anyway, this time I'm buying." }),
        note: ['수업료는 스승 몫이라고 했다. 석독구 씨는 조사단이 낸 수업료를 나눠 내 몫을 건네고, 자기 몫으로는 제자한테 아이스크림을 사 주겠다고 했다.',
          "I said the lesson fee belonged to the teacher. Dokgu split what the survey team paid, handed me my share, and said he'd buy his student ice cream with his."],
      }),
    },
  },
];
