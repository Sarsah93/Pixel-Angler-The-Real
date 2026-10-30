/**
 * @file StoryTalkM5.ts
 * @description 290차 — 제4부 「손님」(Ch5 제주 · M5-01 ~ M5-09) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *  규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 시범 `StoryTalkN01.ts`.
 *  옛 받는 답 · 보상 답은 끝(`end.offer` · `end.complete`)에 묶어 결과 · 표시를 그대로 쓴다. 새 표시는 만들지 않는다.
 *
 * 인물 말투
 *  - 동명항 어촌계(계장 — 도현수의 할아버지): 짧게, 규칙으로 말한다 · 나를 「너」 · 「-다」 「-라」. 주인공은 부르는 말 없이 합니다체.
 *  - 바람: 떠돌이 조사 · 「자네」 · 「-지」 「-야」 「-군그래」 · 담배는 이 사람만(드물게).
 *  - 오세린(19): 밝고 경쟁심 많은 해요체 · 느낌표 · 나를 「초보 씨」라 놀린다(옛 「아저씨」 — 성별 부름말이라 바꿨다).
 *  - 유리아(33 · 한물간 MC): 매끄러운 해요체 · 「그쪽」 · 제 처지를 가볍게 비꼰다.
 *  - 남궁현(61 · 창고 야간 관리인 · 심판): 짧은 반말 · 「너」 · 규정 · 숫자로 말한다. 눈을 잘 들지 않는다.
 *  - 마라(19 · 꿈을 버린 친구): 말수가 적다 · 「…」 · 해요체 · 「그쪽」 · 제 얘기는 피하고 폴링 얘기로 돌린다.
 * 남기는 표시: 없음(옛 답의 표시가 그대로 붙는다).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const C = 'coop';
const B = 'baram';
const SR = 'oh_serin';
const RIA = 'yu_ria';
const NG = 'namgung_hyeon';
const MA = 'mara';
const P = 'player';

export const TALKS_M5: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // M5-01 「운진항」 — 받는 자리(어촌계) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_01_offer', questId: 'M5-01', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '제주 간다고 했지. 배는 어디 묶을 거냐.', "You said you're heading to Jeju. Where will you tie up?", { act: 'look_up' }),
        line(P, '모슬포 쪽 운진항이요. 거기 자리가 있다고 들었습니다.', "Unjin Port, over by Moseulpo. I heard there's room there."),
        line(C, '운진항이다. 거긴 남의 항구야. 들어가면 입항 절차부터 밟아라.', "Unjin, then. That's someone else's harbour. When you get in, do the entry procedure first."),
        line(P, '절차요? 빈자리에 묶으면 되는 줄 알았습니다.', 'A procedure? I thought I could just tie up at an empty berth.'),
        line(C, '타지 배는 창구에 서류 내고 항비를 내야 묶는다. 그냥 묶었다간 바로 쫓겨나.', "Outside boats file papers at the office and pay harbour dues before they tie up. Skip that and you'll be thrown out."),
        line(C, '소개장은 써 뒀다. 창구 갈 때 챙겨 가.', "I've written you a letter of introduction. Take it to the office."),
        line(P, '소개장까지요. 감사합니다.', 'A letter, even. Thank you.'),
        line(C, '하나 더. 그쪽 창구는 방언을 쓴다. 못 알아들으면 세 번 물어라.', "One more thing. They speak dialect at that office. If you don't follow, ask three times."),
        line(C, '화내지 말고.', "And don't get angry."),
      ], {
        choices: [
          opt('take_letter', '소개장 챙기겠습니다. 계 이름 걸고 가는 거니까요', "I'll take the letter. I'm going in under the co-op's name", {
            say: ['소개장, 잘 챙기겠습니다. 계 이름 걸고 들어가는 거니까요.', "I'll keep the letter safe. I'm going in under the co-op's name, after all."],
            next: 'letter' }),
          opt('ask_three', '왜 하필 세 번입니까?', 'Why three times, of all things?', {
            say: ['왜 하필 세 번입니까? 두 번 물으면 안 됩니까?', "Why three times, of all things? Wouldn't twice do?"],
            next: 'three' }),
          opt('ask_dues', '항비는 얼마나 됩니까?', 'How much are the harbour dues?', {
            say: ['항비는 얼마나 됩니까? 연료값도 빠듯한데요.', "How much are the dues? Fuel's already tight."],
            next: 'dues' }),
        ],
        note: ['제주로 떠나기 전에 어촌계에 들렀다. 운진항에 들어가면 입항 절차부터 밟고 항비를 내라며 소개장을 써 주었고, 창구에서 방언을 못 알아들으면 세 번 물으라고 했다.',
          "I stopped by the co-op before leaving for Jeju. They'd written me a letter of introduction and told me to do the entry procedure and pay the dues at Unjin first — and if I couldn't follow the dialect at the office, to ask three times."],
      }),
      letter: scene([
        line(C, '그래. 소개장은 종이 한 장이지만, 그 안에 계 이름이 들어 있다. 창구에서 그것부터 내밀어.', "Good. The letter's one sheet of paper, but the co-op's name is in it. Hand that over first."),
        line(C, '남의 항구엔 우리 항구 얼굴로 들어가는 거다. 네 얼굴이 아니라.', "You enter someone else's harbour wearing our harbour's face. Not your own."),
        line(P, '명심하겠습니다.', "I'll keep that in mind."),
        line(C, '그걸 알면 서류는 저절로 맞는다.', 'Know that, and the papers sort themselves out.', { act: 'nod' }),
      ], {
        end: endTalk({ accept: true, offer: 'take_letter' }),
        note: ['소개장을 챙기겠다고 했다. 남의 항구에는 내 얼굴이 아니라 우리 항구 얼굴로 들어가는 거라는 말이 오래 남았다.',
          "I said I'd take the letter. What stayed with me was that you enter another harbour with your own harbour's face, not yours."],
      }),
      three: scene([
        line(C, '두 번 물으면 못 알아들은 거고, 세 번 물으면 배우려는 거다. 그쪽도 그 차이를 안다.', "Ask twice and you didn't understand. Ask three times and you're trying to learn. They know the difference."),
        line(C, '네 번째부터는 웃어. 그쯤 되면 창구도 웃는다. 그 웃음이 항비보다 싸게 먹힌다.', "From the fourth time on, smile. By then the office will smile too. That smile costs less than the dues."),
      ], {
        choices: [
          opt('ok_three', '세 번 묻고, 네 번째엔 웃겠습니다', "Three times, then I'll smile on the fourth", {
            say: ['세 번 묻고, 네 번째엔 웃겠습니다.', "I'll ask three times, and smile on the fourth."],
            end: endTalk({ accept: true, offer: 'ask_three' }),
            note: ['왜 세 번이냐고 물었다. 두 번은 못 알아들은 거고 세 번은 배우려는 거라고, 네 번째부터는 웃으라고 했다.',
              "I asked why three times. Twice means you didn't understand, three times means you want to learn — and from the fourth, smile."] }),
          opt('hyeonsu_joke', '화는 안 냅니다. 도현수 씨가 웃는 것만 참으면요', "I won't get angry. As long as I can take Hyeonsu laughing", {
            say: ['화는 안 냅니다. 도현수 씨가 옆에서 웃는 것만 참으면요.', "I won't get angry. As long as I can put up with Hyeonsu laughing beside me."],
            next: 'joke' }),
        ],
      }),
      joke: scene([
        line(C, '그 애가 웃거든 그냥 둬라. 그게 그 애 나름대로 거드는 거다.', "If he laughs, let him. That's his way of helping."),
        act(C, 'silence'),
        line(C, '배는 같이 타고 가도 서류는 네 이름이다. 그 애한테 미루지 말고 네 입으로 물어.', "You may be on the same boat, but the papers are in your name. Don't hand it to him — ask with your own mouth."),
        line(P, '네. 제 입으로 묻겠습니다.', "Yes. I'll ask myself."),
        line(C, '화는 둘 다 내지 말고.', "And neither of you gets angry."),
      ], {
        end: endTalk({ accept: true, offer: 'hyeonsu_joke' }),
        note: ['도현수 씨가 옆에서 웃는 것만 참으면 된다고 했더니, 그게 그 애 나름대로 거드는 거라고 했다. 서류는 내 이름이니 내 입으로 물으라고 했다.',
          "When I joked about putting up with Hyeonsu laughing, I was told that's his way of helping. The papers are in my name, so I'm to ask myself."],
      }),
      dues: scene([
        line(C, '항구마다 다르다. 배 크기, 묶는 날수. 창구에서 묻고 영수증 받아 둬.', "Every harbour's different. Boat size, number of days. Ask at the office and keep the receipt."),
        line(P, '아끼려면 항구 바깥에 묶는 수도 있지 않습니까?', "To save money, couldn't I tie up outside the harbour?"),
        line(C, '항비 아끼려고 바깥에 묶는 놈은 바람 한 번에 배를 잃는다.', 'Anyone who ties up outside to save on dues loses the boat to the first strong wind.', { act: 'shake_head' }),
        line(C, '돈은 내고, 영수증은 들고 와라. 들어오면 계에서 그만큼은 챙겨 줄 거다.', "Pay, and bring the receipt back. Once you're in, the co-op will see you're covered for that much."),
        line(P, '알겠습니다. 영수증은 꼭 받아 두겠습니다.', "Understood. I'll be sure to keep the receipt."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_dues' }),
        note: ['항비를 아끼려고 바깥에 묶으면 바람 한 번에 배를 잃는다는 말을 들었다. 돈은 내고 영수증을 받아 오면 계에서 그만큼은 챙겨 준다고 했다.',
          "I was told that tying up outside to save on dues loses you the boat in one wind. Pay, keep the receipt, and the co-op will cover that much."],
      }),
    },
  },
  // M5-01 — 끝내는 자리
  {
    id: 'm5_01_done', questId: 'M5-01', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(P, '운진항에 들어왔습니다. 배도 묶었습니다.', "I'm in at Unjin. The boat's tied up."),
        line(C, '들어왔지. 창구는 어땠냐.', "You're in, then. How was the office?"),
        line(P, '소개장 덕에 하루는 번 것 같습니다.', 'The letter saved me a day, I think.'),
        line(C, '그럼 됐다.', "Then that's that."),
        act(C, 'give', { to: P }),
        line(C, '제주 개방 축하금이다. 항비랑 연료값 정도는 될 거다.', "Money to mark Jeju opening up. It should cover the dues and the fuel."),
        line(P, '축하금까지요?', 'A gift as well?', { act: 'receive' }),
        line(C, '여기부터는 손님을 받는 쪽이야. 그 준비 하라고 주는 거다.', "From here on, you're the one taking guests. It's so you can get ready for that."),
      ], {
        choices: [
          opt('dialect', '방언을 세 번 되물었습니다. 한 번은 웃었습니다', 'I asked three times about the dialect. I smiled once', {
            say: ['창구에서 방언을 세 번 되물었습니다. 한 번은 웃었고요.', 'At the office I asked about the dialect three times. And I smiled once.'],
            next: 'dialect' }),
          opt('wind', '제주 바람이 짭니다. 동해와 다릅니다', "The Jeju wind is salty. Not like the East Sea", {
            say: ['배를 묶고 나서 바람을 맞았는데, 짭니다. 동해 바람하고 다릅니다.', "After I tied up I stood in the wind. It's salty. Not like the East Sea wind."],
            end: endTalk({ complete: 'wind',
              lineKo: '그 바람에 익숙해져야 제주 손님을 받는다. 짠 바람은 줄도 쇠도 빨리 먹는다. 릴은 저녁마다 민물로 닦아라.',
              lineEn: "Get used to that wind before you take Jeju guests. Salt wind eats line and metal fast. Rinse your reels in fresh water every evening." }),
            note: ['제주 바람이 짜다고 했더니, 그 바람에 익숙해져야 제주 손님을 받는다고 했다. 릴은 저녁마다 민물로 닦으라고 했다.',
              "I said the Jeju wind was salty. I was told I'd have to get used to it to take guests here, and to rinse my reels in fresh water every evening."] }),
          opt('receipt', '항비 영수증입니다. 장부에 먼저 적어 두십시오', "Here's the dues receipt. Please log it first", {
            say: ['항비 영수증입니다. 축하금은 계 장부에 먼저 적어 두십시오.', "Here's the receipt for the dues. Please put the gift in the co-op ledger first."],
            end: endTalk({ complete: 'receipt',
              lineKo: '…장부까지 챙기냐. 계원 다 됐다. 이 돈은 장부에 묶어 둘 돈이 아니라 네가 쓰라고 주는 돈이다. 첫 손님 태울 때 기름 걱정 없게.',
              lineEn: "...Minding the ledger too? You're a proper member now. This isn't money to tie up in a ledger — it's for you to use. So you won't worry about fuel with your first guests." }),
            note: ['영수증을 내밀며 장부에 먼저 적어 달라고 했다. 장부까지 챙기냐며, 이 돈은 첫 손님 태울 때 쓰라는 돈이라고 다시 쥐여 주었다.',
              "I handed over the receipt and asked for it to be logged first. Minding the ledger too, they said — and pressed the money back on me, for my first guests' fuel."] }),
        ],
        note: ['운진항에 배를 묶었다고 알렸다. 제주 개방 축하금을 받았고, 여기부터는 손님을 받는 쪽이라는 말을 들었다.',
          "I reported that the boat was tied up at Unjin. I got money to mark Jeju opening up, and was told that from here I'd be the one taking guests."],
      }),
      dialect: scene([
        line(C, '웃었으면 됐다. 화내면 항비가 오른다.', 'If you smiled, you did fine. Get angry and the dues go up.'),
        line(C, '봉투 뒤에 그쪽 말 몇 마디 적어 뒀다. 맨 위에 적은 게 고맙수다다.', "I wrote a few words of theirs on the back of the envelope. The top one is gomapsuda."),
        line(P, '고맙수다… 고맙다는 말이군요.', "Gomapsuda... so that's thank you."),
      ], {
        end: endTalk({ complete: 'dialect',
          lineKo: '그 한마디는 외워 가. 세 번 되묻는 놈은 많아도, 그쪽 말로 고맙다고 하는 놈은 드물다.',
          lineEn: "Learn that one by heart. Plenty of people ask three times. Few say thank you in their words." }),
        note: ['방언을 세 번 되묻고 한 번 웃었다고 했다. 봉투 뒤 맨 위에 적힌 말은 고맙수다였는데, 그쪽 말로 고맙다고 하는 사람은 드물다고 했다.',
          "I said I'd asked three times and smiled once. The top word on the back of the envelope was gomapsuda — few people, I was told, say thank you in their words."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M5-02 「불턱」 — 받는 자리(바람) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_02_offer', questId: 'M5-02', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '제주까지 왔군그래. 불턱은 봤나?', 'So you made it to Jeju. Have you seen a bulteok yet?', { act: 'look_up' }),
        line(P, '불턱이요? 저기 돌담 둘러 놓은 자리 말씀이세요?', 'A bulteok? You mean that spot walled in with stones over there?'),
        line(B, '해녀들이 물질 나가기 전후로 불 쬐던 자리야. 이 앞바다는 그 사람들 바다지.', "It's where the haenyeo warmed themselves by a fire, before and after diving. The sea out front is theirs.", { act: 'look_sea' }),
        line(P, '그 사람들 바다라면… 저는 못 들어가는 겁니까?', "If it's theirs... does that mean I can't go in?"),
        line(B, '들어가는 건 되지. 다만 남의 바다에 들어갈 땐 예의가 있어.', "You can go in. But there's a courtesy to entering someone else's sea."),
        line(P, '어떤 예의요?', 'What kind of courtesy?'),
        line(B, '물가에 표지석 박힌 거 봤지. 그 안쪽이 마을어업권이야. 그 마을이 가꾸는 바다.', "You've seen the marker stones by the water. Inside them is the village fishery. The sea that village tends."),
        line(B, '캐는 건 그 밖에서만. 세 개면 돼. 그리고 해녀가 보고 있거든 인사해.', "Gather only outside them. Three will do. And if a haenyeo is watching, greet her."),
      ], {
        choices: [
          opt('outside_only', '표지 밖에서만 캐겠습니다. 손이 근질거려도요', "I'll gather only outside the markers. Even if my hands itch", {
            say: ['표지 밖에서만 캐겠습니다. 손이 근질거려도요.', "I'll gather only outside the markers. Even if my hands itch."],
            next: 'outside' }),
          opt('ask_greet', '인사는 어떻게 합니까? 고개만 숙이면 됩니까?', 'How do I greet her? Is a bow enough?', {
            next: 'greet' }),
          opt('owner_doubt', '바다에 주인이 어디 있습니까. 표지 하나로요?', 'Since when does the sea have an owner? Because of a marker?', {
            next: 'owner' }),
        ],
        note: ['불턱에서 바람 씨가 남의 바다에 들어가는 예의를 일러 주었다. 마을어업권 표지석 밖에서만 세 개를 캐고, 해녀가 보고 있으면 인사하라고 했다.',
          "At the bulteok, Baram told me the courtesy of entering someone else's sea. Gather three outside the village-fishery marker stones, and greet any haenyeo who is watching."],
      }),
      outside: scene([
        line(B, '근질거려야 정상이야. 표지 안쪽이 더 좋아 보이는 건, 거기가 지켜진 바다라서야.', "Itching is normal. The inside looks better because it's a sea that's been looked after."),
        line(P, '지킨 사람이 따로 있다는 거군요.', 'Meaning someone else did the looking after.'),
        line(B, '그래. 그러니 그 바다는 그 사람들 거지.', "Right. So that sea is theirs.", { act: 'nod' }),
        line(B, '밖에서 세 개. 그거면 자네도 오늘 이 바다 손님은 되는 거야.', "Three from outside. Do that and you're a guest of this sea today."),
      ], {
        end: endTalk({ accept: true, offer: 'outside_only' }),
        note: ['표지 밖에서만 캐겠다고 했다. 안쪽이 더 좋아 보이는 건 누군가 지켜 온 바다라서라는 말을 들었다.',
          "I said I'd gather only outside the markers. The inside looks better, he said, because someone has looked after it."],
      }),
      greet: scene([
        line(B, '고개 숙이고, 손에 든 걸 보여 줘. 뭘 캤는지, 어디서 캤는지.', 'Bow, and show what you have in your hands. What you gathered, and where.'),
        line(P, '보여 드리기까지 해야 합니까?', 'I have to show it, too?'),
        line(B, '감출 게 없다는 게 인사야. 말은 안 해도 돼.', "Having nothing to hide — that's the greeting. You don't need to say anything."),
        act(B, 'cig_light'),
        line(B, '그쪽은 평생 물속에서 숨 참고 일한 사람들이야. 말보다 손을 먼저 봐.', "They've spent their lives holding their breath and working underwater. They look at your hands before your words."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_greet' }),
        note: ['인사는 어떻게 하느냐고 물었다. 바람 씨는 담배에 불을 붙이며, 고개 숙이고 캔 것을 보여 주는 게 인사고 그 사람들은 말보다 손을 먼저 본다고 했다.',
          "I asked how to greet them. Lighting a cigarette, Baram said to bow and show what I'd gathered — they look at your hands before your words."],
      }),
      owner: scene([
        line(B, '있어.', 'It does.'),
        line(B, '마을어업권은 그 마을이 대대로 가꾼 바다에 붙은 권리야. 전복 씨 뿌리고, 성게 걷어 내고, 쉬는 철 지키고.', "The village fishery is a right on a sea the village has tended for generations. Seeding abalone, clearing urchins, keeping the closed seasons."),
        line(P, '…그렇게까지 하는 줄은 몰랐습니다.', "...I didn't know they went that far."),
        line(B, '주인 없다고 들어가는 놈이 제일 먼저 바다를 비워.', 'The ones who walk in saying it has no owner are the first to empty it.'),
        line(B, '따지고 싶으면 따져. 캐는 건 밖에서 하고.', 'Argue if you want. Just do your gathering outside.'),
      ], {
        end: endTalk({ accept: true, offer: 'owner_doubt' }),
        note: ['바다에 주인이 어디 있느냐고 따졌다. 바람 씨는 웃지도 않고, 마을이 대대로 씨 뿌리고 철을 지킨 바다라며 따지는 건 좋지만 캐는 건 밖에서 하라고 했다.',
          "I argued that the sea has no owner. Baram didn't smile: the village has seeded it and kept its seasons for generations, he said — argue all I like, but gather outside."],
      }),
    },
  },
  // M5-02 — 끝내는 자리
  {
    id: 'm5_02_done', questId: 'M5-02', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '왔나. 몇 개 캤어?', 'Back, are you? How many did you get?'),
        line(P, '세 개요. 표지석 세 개 확인하고, 그 밖에서만 캤습니다.', 'Three. I checked all three marker stones and gathered only outside them.'),
        line(B, '해녀는 봤고?', 'And the haenyeo?'),
        line(P, '한 분이 지나가시면서 저를 보셨어요. 아무 말씀도 안 하시고요.', "One of them looked at me as she passed. She didn't say a word."),
        act(B, 'cig_light'),
        line(B, '아무 말 안 했으면 된 거야.', "If she said nothing, you're fine."),
        line(B, '남의 바다에 들어가는 예의, 그게 다야.', "That's all there is to the courtesy of someone else's sea."),
      ], {
        choices: [
          opt('bow', '해녀분께 인사했습니다. 답은 없었습니다', 'I greeted her. There was no answer', {
            say: ['그분께 인사는 했습니다. 답은 없었고요.', 'I did greet her. There was no answer.'],
            next: 'bow' }),
          opt('unsure', '그 눈이 허락인지 감시인지 모르겠습니다', "I can't tell if that look was permission or watching", {
            say: ['그런데 그 눈이 허락인지 감시인지, 모르겠습니다.', "But I can't tell whether that look was permission or watching."],
            next: 'unsure' }),
          opt('asked_teacher', '이런 예의는 누구한테 배우셨습니까', 'Who taught you manners like these?', {
            say: ['바람 씨는 이런 예의를 누구한테 배우셨습니까?', 'Baram, who taught you manners like these?'],
            next: 'teacher' }),
        ],
        note: ['바람 씨에게 표지석 밖에서 세 개를 캤다고 전했다. 해녀 한 분이 말없이 나를 보고 지나갔다고 하자, 아무 말 안 했으면 된 거라고 했다.',
          "I told Baram I'd gathered three outside the marker stones. When I said a haenyeo had looked at me without a word, he said that meant I was fine."],
      }),
      bow: scene([
        line(B, '답이 없는 게 답이야. 다음에 또 인사해.', 'No answer is the answer. Greet her again next time.'),
        line(B, '두 번째도 답은 없을 거야. 세 번째쯤 고개를 끄덕이면, 그때부터 이 불턱 사람들이 자네를 알아.', "There'll be no answer the second time either. Around the third, if she nods, the people of this bulteok will know you from then on."),
      ], {
        end: endTalk({ complete: 'bow', lineKo: '그때까지는 표지 밖이야. 잊지 말게.', lineEn: "Until then, it's outside the markers. Don't forget." }),
        note: ['인사했는데 답이 없었다고 하자, 답이 없는 게 답이라고 했다. 세 번째쯤 고개를 끄덕여 주면 그때부터 불턱 사람들이 나를 알 거라고 했다.',
          "When I said my greeting got no answer, he said no answer is the answer. If she nods around the third time, the bulteok will know me from then on."],
      }),
      unsure: scene([
        line(B, '둘 다야. 남의 바다는 늘 둘 다지.', "Both. Someone else's sea is always both."),
        line(P, '둘 다요?', 'Both?'),
        line(B, '허락만 있는 바다도, 감시만 있는 바다도 없어. 허락받은 놈도 지켜보는 눈은 늘 등에 달고 다녀.', "There's no sea with only permission, and none with only watching. Even the one who's allowed carries those eyes on his back."),
        act(B, 'cig_out'),
      ], {
        end: endTalk({ complete: 'unsure', lineKo: '그 눈이 불편하지 않으면 된 거야.', lineEn: "As long as those eyes don't trouble you, you're fine." }),
        note: ['그 눈이 허락인지 감시인지 모르겠다고 했다. 바람 씨는 담배를 비벼 끄며, 남의 바다는 늘 둘 다라고 했다.',
          "I said I couldn't tell if that look was permission or watching. Grinding out his cigarette, Baram said someone else's sea is always both."],
      }),
      teacher: scene([
        act(B, 'silence'),
        line(B, '…항구마다 다 선생이야. 한 항구에 오래 안 있으니까, 예의라도 빨리 배워야지.', "...Every harbour's a teacher. I never stay long in one, so I have to learn the manners fast, at least.", { act: 'look_away' }),
        line(P, '…', '...'),
        line(B, '그 얘긴 나중에. 바람 부는 쪽을 보고 다니면, 언젠가 알게 될 거야.', "That story's for later. Keep an eye on which way the wind blows, and you'll find out someday."),
      ], {
        end: endTalk({ complete: 'asked_teacher', lineKo: '오늘은 자네가 캔 세 개나 챙겨.', lineEn: 'For today, just look after the three you gathered.' }),
        note: ['이런 예의를 누구한테 배웠느냐고 물었다. 바람 씨는 항구마다 다 선생이라며 말을 아끼고, 그 얘기는 나중에 하자고 했다.',
          "I asked who had taught him these manners. Every harbour is a teacher, he said, holding back the rest — that story was for later."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M5-03 「도두항 한치」 — 받는 자리(오세린) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_03_offer', questId: 'M5-03', at: 'offer', npcId: SR, start: 'start',
    nodes: {
      start: scene([
        line(SR, '한치 잡으러 왔죠? 장비 보니까 딱 그런데요!', "You're here for swordtip squid, right? Your gear says so!", { act: 'peer' }),
        line(P, '네. 도두항이 한치로 유명하다고 해서요.', 'Yes. I heard Dodu Port is famous for them.'),
        line(SR, '유명하죠! 여름 밤에 집어등 켜면, 한치가 불빛 따라 떠요.', "It is! On summer nights, when the lamps go on, the squid rise to the light."),
        line(P, '여기 자주 나오세요?', 'Do you come out here often?'),
        line(SR, '매일 밤이요! 저 오세린이에요. 대회 준비하거든요.', "Every night! I'm Oh Serin. I'm training for a tournament."),
        line(P, '대회요?', 'A tournament?'),
        line(SR, '그 얘긴 이따가요. 오늘은 한치 세 마리만 같이 잡아요. 저는 하룻밤에 열 마리 잡거든요.', "Later. Tonight, let's just catch three squid together. I catch ten a night."),
        line(P, '열 마리요?', 'Ten?'),
        act(SR, 'laugh'),
        line(SR, '네! 세 마리 갖고는 아직 멀었어요, 초보 씨는.', "Yep! Three is still a long way off for you, rookie."),
      ], {
        choices: [
          opt('catch_up', '열 마리라. 세 마리부터 따라가 볼게요', "Ten, huh. I'll start by chasing three", {
            say: ['열 마리라. 그럼 세 마리부터 따라가 볼게요.', "Ten, huh. Then I'll start by chasing three."],
            next: 'catch_up' }),
          opt('ask_tourney', '대회 지망생이라더니, 무슨 대회예요?', 'Training for a tournament — which one?', {
            say: ['아까 대회 준비한다고 했죠. 무슨 대회예요?', "You said you're training for a tournament. Which one?"],
            next: 'tourney' }),
          opt('mister', '초보는 좀 그렇네요. 낚시 좀 했어요, 저도', "Rookie's a bit much. I've done some fishing", {
            say: ['초보는 좀 그렇네요. 저도 낚시 좀 했거든요.', "Rookie is a bit much. I've done my share of fishing, you know."],
            next: 'mister' }),
        ],
        note: ['도두항에서 오세린 씨를 만났다. 대회를 준비한다는 열아홉 살인데, 여름 밤 집어등 아래서 한치 세 마리를 같이 잡자며 자기는 하룻밤에 열 마리를 잡는다고 했다.',
          "At Dodu Port I met Oh Serin, nineteen and training for a tournament. She suggested we catch three swordtip squid together under the summer-night lamps — she catches ten a night, she said."],
      }),
      catch_up: scene([
        line(SR, '세 마리면 제 기록 삼분의 일이에요. 그래도 따라오겠다는 말은 좋아요!', "Three is a third of my record. But I like that you want to keep up!"),
        line(SR, '집어등 켜면 한치가 빛 가장자리로 떠요. 가운데 말고 가장자리. 그거 하나만 기억해요.', "When the lamps go on, the squid rise at the edge of the light. Not the middle — the edge. Just remember that."),
      ], {
        choices: [
          opt('edge', '가장자리. 기억해 둘게요', "The edge. I'll remember", {
            end: endTalk({ accept: true, offer: 'catch_up' }),
            note: ['세 마리부터 따라가 보겠다고 했다. 오세린 씨는 집어등 불빛 가운데가 아니라 가장자리를 노리라고 했다.',
              "I said I'd chase three first. Serin told me to aim not at the middle of the lamplight but at its edge."] }),
          opt('first_night', '사실 밤낚시는 자신 없어요. 한치도 처음이고요', "Honestly, I'm not confident at night. It's my first squid, too", {
            say: ['사실 밤낚시는 자신 없어요. 한치도 처음이고요.', "Honestly, I'm not confident fishing at night. And it's my first time with squid."],
            next: 'first_night' }),
        ],
      }),
      first_night: scene([
        line(SR, '처음이면 더 좋아요. 이상한 버릇이 없잖아요.', "First time is even better. No bad habits."),
        line(SR, '한치는 촉완으로 먼저 감아요. 그때 챔질하면 다리만 걸려요.', "Squid wrap the jig with their long arms first. Strike then and you only hook a leg."),
        line(P, '그럼 언제 채요?', 'So when do I strike?'),
        line(SR, '무게가 실릴 때까지 한 박자 참아요. 그거 하나면 세 마리는 해요.', "Wait one beat, until you feel the weight. Do that and you'll get three."),
      ], {
        end: endTalk({ accept: true, offer: 'first_night' }),
        note: ['밤낚시도 한치도 처음이라고 털어놓았다. 오세린 씨는 처음이라 버릇이 없어 더 좋다며, 촉완이 감길 때 한 박자 참았다가 채라고 했다.',
          "I admitted it was my first night trip and my first squid. Serin said that was better — no bad habits — and told me to wait one beat after the arms wrap before striking."],
      }),
      tourney: scene([
        line(SR, '제주에서 하는 낚시 대회요. 예선 거쳐서 결선 가는 거. 저는 이번에 꼭 결선 갈 거예요.', "A fishing tournament here in Jeju. Qualifier first, then the final. This time I'm making the final for sure."),
        line(SR, '그러려면 밤마다 한치로 손을 풀어야 해요. 한치는 빨리 걷어야 다음 놈이 붙거든요.', "So I warm up on squid every night. You have to bring them in fast so the next one comes."),
        line(P, '그래서 열 마리군요.', "Hence the ten."),
        line(SR, '초보 씨도 나갈래요? 예선은 참가비만 내면 아무나 나가요.', "Want to enter too, rookie? Anyone can enter the qualifier, as long as they pay the fee."),
        line(SR, '일단 오늘은 한치부터요!', 'But tonight, squid first!'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_tourney' }),
        note: ['무슨 대회냐고 물었다. 예선을 거쳐 결선에 가는 제주 낚시 대회인데, 오세린 씨는 이번에 꼭 결선에 갈 거라며 예선은 참가비만 내면 누구나 나간다고 했다.',
          "I asked which tournament. It's a Jeju fishing tournament, qualifier then final, Serin means to make the final this time, and anyone can enter the qualifier for the fee."],
      }),
      mister: scene([
        act(SR, 'laugh'),
        line(SR, '그럼 뭐라고 불러요? 선수님? 아직 한치 세 마리도 못 잡았는데요.', "Then what should I call you? Champ? You haven't even caught three squid yet."),
        line(P, '세 마리 잡으면요?', 'And once I catch three?'),
        line(SR, '그럼 다시 생각해 볼게요. 그 전까지는 초보 씨예요. 억울하면 빨리 잡아요.', "Then I'll think about it. Until then, you're rookie. If that stings, catch them fast."),
        line(SR, '에기는 살짝요. 세게 튕기면 다 도망가요.', 'Flick the jig gently. Snap it hard and they all run.'),
      ], {
        end: endTalk({ accept: true, offer: 'mister' }),
        note: ['초보라는 말에 토를 달았더니, 오세린 씨는 웃음을 참지도 않고 세 마리를 잡으면 다시 생각해 보겠다고 했다. 에기는 살짝 튕기라고 했다.',
          "When I objected to being called a rookie, Serin laughed outright and said she'd reconsider once I'd caught three. Flick the jig gently, she said."],
      }),
    },
  },
  // M5-03 — 끝내는 자리
  {
    id: 'm5_03_done', questId: 'M5-03', at: 'complete', npcId: SR, start: 'start',
    nodes: {
      start: scene([
        line(P, '오세린 씨, 세 마리 채웠어요.', "Serin, I've got my three."),
        line(SR, '세 마리. 어디 봐요.', 'Three. Let me see.', { act: 'peer' }),
        line(SR, '음, 저보다 느리지만… 됐어요.', "Hmm, slower than me, but... that'll do."),
        line(P, '느리긴 했죠. 촉완 감길 때 참는 게 제일 어려웠어요.', 'Slow, yes. Waiting while the arms wrapped was the hardest part.'),
        line(SR, '다들 거기서 놓쳐요. 그래도 참았네요.', 'Everyone loses them there. But you waited.'),
        line(SR, '그래서, 대회 나갈 거죠? 예선이요.', "So — you're entering the tournament, right? The qualifier?"),
      ], {
        choices: [
          opt('slow', '느리다는 말, 인정할게요. 그래도 세 마리예요', "I'll admit I'm slow. Still, it's three", {
            say: ['느리다는 말은 인정할게요. 그래도 세 마리는 세 마리예요.', "I'll admit I'm slow. But three is three."],
            end: endTalk({ complete: 'slow',
              lineKo: '인정하면 빨라져요. 다음엔 한 박자만 참고, 반 박자는 줄여 봐요.',
              lineEn: "Admitting it makes you faster. Next time, wait the beat — and trim half a beat off." }),
            note: ['느리다는 말을 인정했다. 오세린 씨는 인정하면 빨라진다고 했다.', "I admitted I was slow. Serin said admitting it makes you faster."] }),
          opt('tournament', '예선에 나갈게요. 오세린 씨 기록을 넘어 보겠어요', "I'll enter the qualifier. I'll try to beat your record", {
            say: ['예선, 나갈게요. 오세린 씨 기록을 한번 넘어 보겠어요.', "I'll enter the qualifier. And I'll try to beat your record."],
            end: endTalk({ complete: 'tournament',
              lineKo: '넘어 봐요! 저는 열둘까지 갈 거니까! 예선은 계측 규정이 까다로워요. 서류 칸 비우지 말고 다 채워요.',
              lineEn: "Go on and try! I'm going up to twelve! The qualifier's measuring rules are strict. Don't leave a single box on the form blank." }),
            note: ['예선에 나가 오세린 씨 기록을 넘어 보겠다고 했다. 오세린 씨는 자기는 열둘까지 갈 거라며, 예선은 계측 규정이 까다로우니 서류를 빠짐없이 채우라고 했다.',
              "I said I'd enter the qualifier and try to beat her record. She said she'd go up to twelve, and told me the measuring rules were strict — fill in every box."] }),
          opt('credit_serin', '옆에서 한 박자 참으라고 한 거, 그게 다였어요', 'You telling me to wait one beat — that was everything', {
            say: ['오세린 씨가 옆에서 한 박자 참으라고 한 거, 그게 다였어요.', "You telling me to wait one beat, right beside me — that was everything."],
            next: 'credit' }),
        ],
        note: ['오세린 씨에게 한치 세 마리를 보여 주었다. 자기보다 느리지만 됐다며, 예선에 나갈 거냐고 물었다.',
          "I showed Serin my three squid. Slower than her, but it'd do, she said — and asked whether I'd enter the qualifier."],
      }),
      credit: scene([
        line(SR, '…제가 말한 거 맞긴 한데요.', "...I did say that, but.", { act: 'look_away' }),
        line(SR, '가르쳐 준 걸 잘 썼다는 말은 처음 들어 봐요. 늘 제가 잡기만 했지, 말해 준 적은 별로 없거든요.', "That's the first time anyone's told me they used what I taught them. I'm usually the one catching, not the one explaining."),
      ], {
        end: endTalk({ complete: 'credit_serin', lineKo: '예선 가서도 써먹어요. 제 말이라고는 하지 말고요.', lineEn: "Use it at the qualifier too. Just don't say it was me." }),
        note: ['한 박자 참으라는 말 덕분이었다고 했다. 오세린 씨는 괜히 시선을 피하며, 가르쳐 준 걸 잘 썼다는 말은 처음 들어 본다고 했다.',
          "I told her it was all thanks to her telling me to wait a beat. Serin looked away and said it was the first time anyone had told her that."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M5-04 「해양관광업 등록」 — 받는 자리(어촌계) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_04_offer', questId: 'M5-04', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '제주 손님 받을 생각은 있냐.', 'Do you mean to take guests out in Jeju?'),
        line(P, '손님이요? 제 배에 말입니까?', 'Guests? On my boat?'),
        line(C, '그래. 해양관광업 등록해라. 이제 네가 손님 받는 쪽이다.', "That's right. Register for marine tourism. From now on, you're the one taking guests."),
        line(P, '등록만 하면 되는 겁니까?', "Is registering all it takes?"),
        line(C, '안전교육이 붙는다. 여덟 시간.', 'There\'s a safety course with it. Eight hours.'),
        line(P, '여덟 시간이요…', 'Eight hours...'),
        line(C, '예약부터 후기까지, 손님 한 사람을 끝까지 책임지는 일이다. 여덟 시간도 짧아.', "From booking to review, you answer for each guest start to finish. Eight hours is short for that."),
        line(C, '그 전에 손님한테 보여 줄 자리부터 확인해 둬. 한치 두 마리면 된다.', "Before that, check the spot you'll show guests. Two swordtip squid will do."),
        line(P, '제가 먼저 거기서 낚아 보라는 거군요.', 'So I should fish it myself first.'),
        line(C, '네가 거기서 낚아 봐야 손님도 낚는다.', "If you've caught there, your guests will too."),
      ], {
        choices: [
          opt('learn_guide', '제대로 배우겠습니다. 여덟 시간 다 듣겠습니다', "I'll learn it properly. I'll sit through all eight hours", {
            say: ['손님 태우는 일, 제대로 배우겠습니다. 여덟 시간 다 듣겠습니다.', "I'll learn how to take guests properly. I'll sit through all eight hours."],
            next: 'learn' }),
          opt('ask_review', '후기요? 손님이 저를 평가한다는 겁니까?', 'A review? The guests rate me?', {
            next: 'review' }),
          opt('unsure_skill', '제 낚시도 서툰데, 남을 낚게 할 수 있을지요', "I'm still clumsy myself. Can I help others catch?", {
            say: ['제 낚시도 아직 서툰데, 남을 낚게 할 수 있을지 모르겠습니다.', "My own fishing is still clumsy. I don't know if I can get others to catch."],
            next: 'unsure' }),
        ],
        note: ['해양관광업을 등록하고 안전교육 여덟 시간을 들으라는 말을 들었다. 그 전에 손님에게 보여 줄 자리를 한치 두 마리로 먼저 확인해 두라고 했다.',
          "I was told to register for marine tourism and take the eight-hour safety course — and before that, to check the spot I'd show guests by catching two swordtip squid there myself."],
      }),
      learn: scene([
        line(C, '여덟 시간 중에 제일 지루한 게 구명조끼 입히는 시간이다. 그게 제일 중요하다.', "Of the eight hours, the dullest is putting life jackets on people. That's the most important part."),
        line(P, '조끼 입히는 게요?', 'Putting on life jackets?'),
        line(C, '손님은 낚으러 오지만, 너는 데려가서 데려오는 사람이다. 조과는 그다음이야.', "Guests come to fish. You're the one who takes them out and brings them back. The catch comes after that."),
        line(C, '교육 끝나면 등록증 들고 와.', 'When the course is done, bring me the registration.'),
      ], {
        end: endTalk({ accept: true, offer: 'learn_guide' }),
        note: ['여덟 시간 다 듣겠다고 했다. 제일 지루한 구명조끼 시간이 제일 중요하고, 나는 손님을 데려가서 데려오는 사람이라는 말을 들었다.',
          "I said I'd sit through all eight hours. The dullest part — life jackets — is the most important, I was told; I'm the one who takes guests out and brings them back."],
      }),
      review: scene([
        line(C, '그래. 예약, 승선, 포인트, 조과, 사진, 후기. 마지막 칸은 손님이 쓴다.', "That's right. Booking, boarding, spot, catch, photo, review. The last box is the guest's to fill."),
        line(P, '고기를 못 잡으면 후기도 나쁘겠네요.', "If they don't catch anything, the review will be bad, then."),
        line(C, '못 잡은 날에도 후기는 좋을 수 있다. 사람을 어떻게 대했는지가 남으니까.', "A day with no catch can still get a good review. How you treated people is what stays.", { act: 'shake_head' }),
        line(C, '그 반대도 있고. 후기는 조과표가 아니라 네 얼굴이다.', "The reverse happens too. A review isn't a catch log. It's your face."),
      ], {
        choices: [
          opt('face', '제 얼굴이라… 알겠습니다', "My face... understood", {
            end: endTalk({ accept: true, offer: 'ask_review' }),
            note: ['손님이 나를 평가하느냐고 물었다. 후기는 조과표가 아니라 내 얼굴이라는 말을 들었다.', "I asked whether guests rate me. A review isn't a catch log, I was told — it's my face."] }),
          opt('ask_fee', '등록비랑 교육비는 계에서 대 주는 겁니까?', 'Does the co-op cover the registration and course fees?', {
            next: 'fee' }),
        ],
      }),
      fee: scene([
        line(C, '등록은 네 이름으로 하는 거다. 네 돈으로 해라.', "The registration's in your name. Pay for it yourself."),
        line(P, '…네.', '...Right.'),
        line(C, '대신 끝나면 계에서 가방 하나는 챙겨 줄 거다. 손님 물건 넣는 가방.', "But when you're done, the co-op will put together a bag for you. A bag for guests' things."),
        line(C, '그건 네 것도 아니다. 손님 거다.', "And that isn't yours either. It's the guests'."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_fee' }),
        note: ['등록비를 계에서 대 주느냐고 물었다가, 내 이름으로 하는 거니 내 돈으로 하라는 말을 들었다. 대신 끝나면 손님 물건 넣을 가방을 챙겨 준다고 했다.',
          "I asked if the co-op would pay the fees and was told it's in my name, so I pay. When I'm done, though, they'll put together a bag for guests' things."],
      }),
      unsure: scene([
        line(C, '네가 잘 낚는다고 손님이 낚는 게 아니다.', "You fishing well doesn't make your guests catch."),
        line(C, '오히려 잘 낚는 놈이 손님 대를 빼앗아 제가 낚지.', "If anything, the good anglers take the rod off the guest and fish it themselves."),
        line(P, '서툰 게 오히려 낫다는 말씀입니까?', "So being clumsy is better?"),
        line(C, '서툰 걸 아는 놈이 손님 손을 본다. 그러니 한치 두 마리, 네 손으로 먼저 올려 봐.', "The one who knows he's clumsy watches the guest's hands. So bring up those two squid with your own hands first."),
      ], {
        end: endTalk({ accept: true, offer: 'unsure_skill' }),
        note: ['내 낚시도 서툰데 남을 낚게 할 수 있겠느냐고 했다. 서툰 걸 아는 사람이 손님 손을 본다는 말을 들었다.',
          "I wondered aloud whether, clumsy as I am, I could help others catch. The one who knows he's clumsy watches the guest's hands, I was told."],
      }),
    },
  },
  // M5-04 — 끝내는 자리
  {
    id: 'm5_04_done', questId: 'M5-04', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(P, '등록증입니다. 안전교육도 여덟 시간 다 들었습니다.', "Here's the registration. I sat through all eight hours of the safety course."),
        line(C, '등록 완료다.', "That's you registered.", { act: 'peer' }),
        act(C, 'give', { to: P, item: 'qr_bag_guide' }),
        line(C, '가이드 가방이다. 손님 구명조끼 여분, 멀미약, 계측자. 다 들어 있어.', "A guide bag. Spare life jackets for guests, seasickness pills, a measuring board. It's all in there."),
        line(P, '생각보다 무겁네요.', "It's heavier than I thought.", { act: 'receive' }),
        line(C, '네 것이 아니라 손님 것이니까. 손님 것은 늘 무겁다.', "Because it isn't yours — it's the guests'. Their things are always heavy."),
      ], {
        choices: [
          opt('guide', '남이 낚게 하는 일. 처음이라 낯섭니다', "Helping others catch. It's new to me", {
            say: ['제가 낚는 게 아니라 남이 낚게 하는 일이라니, 처음이라 낯섭니다.', "It's not me fishing but helping others catch. It feels strange, being new."],
            end: endTalk({ complete: 'guide',
              lineKo: '낯설어야 한다. 익숙한 가이드가 손님을 놓친다. 배에 오를 때 한 번, 내릴 때 한 번 머릿수를 세라. 그거 하나는 익숙해져도 된다.',
              lineEn: "It should feel strange. The guide who's used to it is the one who loses a guest. Count heads once boarding and once getting off. That one thing, you can get used to." }),
            note: ['남이 낚게 하는 일이 낯설다고 했다. 낯설어야 한다며, 배에 오를 때와 내릴 때 머릿수를 세라고 했다.',
              "I said helping others catch felt strange. It should, I was told — and count heads boarding and getting off."] }),
          opt('first_booking', '첫 예약이 들어왔는데, 아는 이름입니다', 'My first booking came in. A name I know', {
            say: ['첫 예약이 들어왔는데, 이름을 보니 아는 사람입니다.', 'My first booking came in, and the name is someone I know.'],
            next: 'booking' }),
          opt('rescue', '사람 건지는 법이 제일 오래 남았습니다', 'Learning to pull people out stayed with me most', {
            say: ['교육에서 사람 건지는 법이 제일 오래 남았습니다.', 'From the course, what stayed with me longest was how to pull a person out of the water.'],
            end: endTalk({ complete: 'rescue',
              lineKo: '그게 남았으면 등록증보다 낫다. 그 가방에서 제일 무거운 게 조끼다. 맨 아래 넣어 둬라. 꺼낼 일이 없을수록 좋은 거다.',
              lineEn: "If that stayed, it's worth more than the registration. The heaviest thing in that bag is the jacket. Keep it at the bottom. The less you take it out, the better." }),
            note: ['사람 건지는 법이 제일 오래 남았다고 했다. 그게 남았으면 등록증보다 낫다며, 가방 맨 아래 조끼는 꺼낼 일이 없을수록 좋다고 했다.',
              "I said rescue was what stayed with me. Better than the registration, I was told; the jacket at the bottom of the bag is best left unused."] }),
        ],
        note: ['등록증을 내밀자 가이드 가방을 받았다. 손님 구명조끼 여분, 멀미약, 계측자가 들었고, 내 것이 아니라 손님 것이라고 했다.',
          "When I handed over my registration, I got a guide bag — spare life jackets, seasickness pills, a measuring board. Not mine, I was told; the guests'."],
      }),
      booking: scene([
        line(C, '그럼 더 잘해야지. 아는 사람이 제일 무섭다.', "Then you'd better do even better. Someone you know is the scariest kind."),
        line(P, '무섭다고요?', 'Scariest?'),
        line(C, '모르는 손님은 한 번 실망하면 안 온다. 아는 손님은 실망해도 다시 와서 그 얘길 한다.', "A stranger who's let down just doesn't come back. Someone you know comes back and brings it up."),
      ], {
        end: endTalk({ complete: 'first_booking',
          lineKo: '명부에 아는 사이라고 따로 적지 마라. 손님은 다 손님이다.',
          lineEn: "Don't mark them in the register as someone you know. Every guest is a guest." }),
        note: ['첫 예약이 아는 이름이라고 하자, 아는 사람이 제일 무섭다며 명부에 따로 적지 말라고 했다. 손님은 다 손님이라고 했다.',
          "When I said my first booking was a name I knew, I was told someone you know is the scariest — and not to note it in the register. Every guest is a guest."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M5-05 「낚시공원 설명회」 — 받는 자리(유리아) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_05_offer', questId: 'M5-05', at: 'offer', npcId: RIA, start: 'start',
    nodes: {
      start: scene([
        line(RIA, '아, 마침 잘 왔어요. 낚시하는 분 찾고 있었거든요.', "Ah, good timing. I've been looking for someone who fishes."),
        line(P, '저를요? 무슨 일인데요?', 'Me? What for?'),
        line(RIA, '이번에 낚시공원 설명회가 열려요. 이 앞 갯바위에 공원을 짓는다는 거요.', "There's a briefing on a fishing park. They want to build one on the rocks out front."),
        line(P, '낚시공원이요. 좋은 일 아닌가요?', "A fishing park. Isn't that a good thing?"),
        line(RIA, '좋다는 사람도 있고, 아니라는 사람도 있죠. 그래서 취재를 부탁하려고요.', "Some say yes, some say no. That's why I want to ask you to report on it."),
        line(P, '취재요? 제가요?', 'Report on it? Me?'),
        line(RIA, '저 예전에 방송 일 했거든요. 지금은… 뭐, 한물갔지만요.', "I used to work in broadcasting. These days... well, I'm past it.", { act: 'look_away' }),
        line(RIA, '찬성, 반대 둘 다 들어 줘요. 찬성 쪽은 제가 자리를 만들고, 반대 쪽은 어촌계에 가면 들을 수 있어요.', "Hear both sides — for and against. I'll set up the 'for' side. For 'against', go to the fishing co-op."),
        line(RIA, '그리고 예정지 조간대도 직접 세 번 훑어 봐요. 어느 쪽 편도 들지 말고요. 그게 제일 어려워요.', "And walk the tideline at the proposed site three times yourself. Without taking anyone's side. That's the hardest part."),
      ], {
        choices: [
          opt('hear_out', '둘 다 끝까지 듣겠습니다. 중간에 끊지 않고요', "I'll hear both out to the end. Without cutting in", {
            next: 'hear_out' }),
          opt('ask_park', '공원이 생기면 정확히 뭐가 바뀌어요?', 'What exactly changes if the park goes ahead?', {
            say: ['낚시공원이 생기면, 정확히 뭐가 바뀌는데요?', 'If the fishing park goes ahead, what exactly changes?'],
            next: 'park' }),
          opt('ask_ria', '방송하시던 분이 왜 직접 안 하세요?', "You were in broadcasting — why not do it yourself?", {
            say: ['방송하시던 분이면, 왜 직접 안 하세요?', "If you were in broadcasting, why not do it yourself?"],
            next: 'ria' }),
        ],
        note: ['유리아 씨가 낚시공원 설명회를 취재해 달라고 했다. 찬성 쪽은 자기가 자리를 만들고 반대 쪽은 어촌계에서 들으라며, 예정지 조간대를 세 번 훑고 어느 편도 들지 말라고 했다.',
          "Yu Ria asked me to report on the fishing-park briefing. She'll set up the 'for' side; I'm to hear 'against' at the co-op, walk the proposed site's tideline three times, and take no side."],
      }),
      hear_out: scene([
        line(RIA, '좋아요. 끝까지 듣는 게 취재의 반이에요. 사람들은 처음 말보다 끝에 가서 진짜를 꺼내거든요.', "Good. Hearing people out is half of reporting. They bring out the real thing at the end, not the start."),
        line(P, '처음 말은요?', 'And what they say first?'),
        line(RIA, '찬성 쪽은 일자리 얘기부터, 반대 쪽은 바다 얘기부터 할 거예요. 둘 다 첫마디는 준비해 온 말이에요.', "The 'for' side will start with jobs, the 'against' side with the sea. Both openings are prepared lines."),
        line(RIA, '그다음을 기다려요.', 'Wait for what comes after.'),
      ], {
        end: endTalk({ accept: true, offer: 'hear_out' }),
        note: ['둘 다 끝까지 듣겠다고 했다. 유리아 씨는 첫마디는 준비해 온 말이니, 그다음을 기다리라고 했다.',
          "I said I'd hear both sides out. Ria said the first words are always prepared — wait for what comes after."],
      }),
      park: scene([
        act(RIA, 'laugh'),
        line(RIA, '그걸 저도 몰라서 부탁하는 거예요. 설명회 자료에는 좋은 것만 있겠죠. 입장료, 시설, 찾아올 사람들.', "I'm asking because I don't know either. The briefing papers will only have the good parts. Admission, facilities, visitors."),
        line(P, '자료에 없는 건요?', "And what's not in the papers?"),
        line(RIA, '조간대에 있어요. 거기서 뭐가 사는지 알아야, 무엇이 바뀌는지도 물을 수 있어요.', "It's on the tideline. You have to know what lives there before you can ask what changes."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_park' }),
        note: ['공원이 생기면 무엇이 바뀌느냐고 물었다. 설명회 자료에 없는 건 조간대에 있다며, 거기서 뭐가 사는지 먼저 알아야 물을 수 있다고 했다.',
          "I asked what the park would change. What isn't in the papers is on the tideline, Ria said — you have to know what lives there before you can ask."],
      }),
      ria: scene([
        line(RIA, '제가 가면 다들 카메라부터 찾아요. 한물간 얼굴이라도 얼굴은 얼굴이거든요.', "If I go, everyone looks for the camera first. A has-been face is still a face."),
        line(RIA, '낚시꾼한테는 낚시꾼이 물어야 해요. 그쪽은 갯바위에 앉아서 물으면 되잖아요.', "Anglers need to be asked by an angler. You can just sit on the rocks and ask."),
        line(P, '받아 적은 건요?', 'And what I write down?'),
        line(RIA, '제가 받아서 정리할게요. 그게 제 일이에요.', "I'll take it and put it in order. That's my job."),
      ], {
        choices: [
          opt('ok_ria', '그럼 제가 묻고, 정리는 맡길게요', "Then I'll ask, and leave the writing up to you", {
            end: endTalk({ accept: true, offer: 'ask_ria' }),
            note: ['왜 직접 안 하느냐고 물었다. 유리아 씨는 자기가 가면 다들 카메라부터 찾는다며, 낚시꾼에게는 낚시꾼이 물어야 한다고 했다.',
              "I asked why she didn't do it herself. If she went, Ria said, everyone would look for the camera — anglers need to be asked by an angler."] }),
          opt('no_side', '편을 안 드는 게 돼요? 저도 바다에서 먹고사는데요', "Can I really take no side? I make my living from the sea too", {
            say: ['그런데 편을 안 드는 게 되나요? 저도 바다에서 먹고사는데요.', "But can I really not take a side? I make my living from the sea too."],
            next: 'no_side' }),
        ],
      }),
      no_side: scene([
        line(RIA, '안 되죠. 그래서 제일 어렵다고 한 거예요.', "You can't. That's why I said it's the hardest part.", { act: 'peer' }),
        line(RIA, '편은 들어도 돼요. 적을 때만 빼요. 상대 말을 그쪽 사람이 읽어도 맞다고 할 만큼 적는 거.', "You can take a side. Just leave it out when you write. Write the other side so their own people would say it's right."),
        line(P, '그게 타당하게 적는 거군요.', "That's what writing it fairly means."),
        line(RIA, '네. 마음은 표결 날에 써요.', "Yes. Save your heart for the day of the vote."),
      ], {
        end: endTalk({ accept: true, offer: 'no_side' }),
        note: ['나도 바다에서 먹고사는데 편을 안 들 수 있느냐고 했다. 편은 들어도 되지만 적을 때만 빼라고, 마음은 표결 날에 쓰라고 했다.',
          "I asked how I could take no side when I live off the sea too. Take one, Ria said — just leave it out of the writing, and save my heart for the vote."],
      }),
    },
  },
  // M5-05 — 끝내는 자리
  {
    id: 'm5_05_done', questId: 'M5-05', at: 'complete', npcId: RIA, start: 'start',
    nodes: {
      start: scene([
        line(P, '찬성 쪽, 반대 쪽 다 듣고 왔어요. 조간대도 세 번 걸었고요.', "I've heard both sides. And I walked the tideline three times."),
        line(RIA, '수고했어요. 어디 봐요.', 'Good work. Let me see.', { act: 'peer' }),
        line(RIA, '…둘 다 타당하게 적었네요. 그게 취재예요.', "...You've written both fairly. That's reporting."),
        line(P, '적는 게 제일 어려웠어요. 자꾸 한쪽으로 기울어서요.', 'Writing it was the hardest. I kept leaning one way.'),
        line(RIA, '다들 그래요. 결론은 표결이 내요. 그쪽 몫은 여기까지예요.', "Everyone does. The vote decides the outcome. Your part ends here."),
        line(RIA, '그래서, 그쪽은 어느 쪽이에요?', 'So — which side are you on?'),
      ], {
        choices: [
          opt('undecided', '아직 어느 쪽인지 모르겠어요', "I still don't know which side", {
            say: ['솔직히, 아직 어느 쪽인지 모르겠어요.', "Honestly, I still don't know which side I'm on."],
            end: endTalk({ complete: 'undecided',
              lineKo: '그게 정직한 답이에요. 표결 전까지 몰라도 돼요. 오늘 들은 말 그대로 적어 두고, 정할 때 다시 펴 봐요.',
              lineEn: "That's an honest answer. You don't need to know before the vote. Write down what you heard today, and open it again when you decide." }),
            note: ['아직 어느 쪽인지 모르겠다고 했다. 유리아 씨는 그게 정직한 답이라며, 들은 말을 그대로 적어 두고 정할 때 다시 펴 보라고 했다.',
              "I said I still didn't know. Ria called that an honest answer — write down what I heard and reread it when it's time to decide."] }),
          opt('sea_side', '바다 쪽 말이 더 남았어요', 'The sea side stayed with me more', {
            say: ['바다 쪽 말이 더 오래 남았어요.', 'What the sea side said stayed with me longer.'],
            next: 'sea' }),
          opt('both_sides', '일자리 말한 분들도 바다 사람이었어요', 'The ones who talked about jobs were sea people too', {
            say: ['일자리 말한 분들 말도 오래 남았어요. 그분들도 바다 사람이더라고요.', "What the jobs side said stayed with me too. They were sea people as well."],
            next: 'both' }),
        ],
        note: ['찬반 양쪽 이야기를 적어 유리아 씨에게 보여 주었다. 둘 다 타당하게 적었다며, 결론은 표결이 낸다고 했다.',
          "I showed Ria what I'd written from both sides. Both fair, she said — the vote will decide the rest."],
      }),
      sea: scene([
        line(RIA, '…그 말 방송에서는 하지 마요. 저한테는 해도 돼요.', "...Don't say that on air. You can say it to me."),
        act(RIA, 'laugh'),
        line(RIA, '방송이 한쪽 말이 남았다고 하는 순간, 한쪽 방송이 돼요. 그래도 사람이니까 남는 쪽은 있죠.', "The moment a broadcast says one side stayed with it, it becomes one side's broadcast. But we're people, so one side does stay."),
      ], {
        end: endTalk({ complete: 'sea_side', lineKo: '그건 적어 두고, 표결 날에 손으로 말해요.', lineEn: 'Write that down, and say it with your hand on voting day.' }),
        note: ['바다 쪽 말이 더 남았다고 했다. 방송에서는 하지 말라며 웃었고, 그 마음은 표결 날에 손으로 말하라고 했다.',
          "I said the sea side stayed with me more. Ria laughed — not on air — and said to speak that with my hand on voting day."],
      }),
      both: scene([
        line(RIA, '…그 말이 제일 듣고 싶었어요.', "...That's what I most wanted to hear."),
        line(RIA, '찬성하는 사람들도 바다 걱정을 해요. 바다가 비면 일자리도 없으니까요.', "The people in favour worry about the sea too. If the sea empties, there are no jobs."),
        line(P, '걱정하는 방식이 다를 뿐이군요.', "They just worry about it differently."),
      ], {
        end: endTalk({ complete: 'both_sides',
          lineKo: '그걸 본 사람은 표결 날 손을 들어도 남을 미워하지 않아요.',
          lineEn: "Someone who's seen that can raise a hand on voting day without hating anyone." }),
        note: ['일자리를 말한 사람들도 바다 사람이었다고 했다. 유리아 씨는 그 말이 제일 듣고 싶었다며, 둘 다 바다를 걱정하는데 방식이 다를 뿐이라고 했다.',
          "I said the people talking about jobs were sea people too. Ria said that was what she most wanted to hear — both worry about the sea, just differently."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M5-06 「대회 예선」 — 받는 자리(남궁현) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_06_offer', questId: 'M5-06', at: 'offer', npcId: NG, start: 'start',
    nodes: {
      start: scene([
        line(NG, '선수 등록하러 왔나.', 'Here to register as a competitor?'),
        line(P, '네, 예선 나가려고요. 그런데… 남궁현 씨가 여기 계실 줄은 몰랐습니다.', "Yes, for the qualifier. But... I didn't expect to find you here, Hyeon."),
        line(NG, '심판은 나야.', "I'm the judge."),
        line(P, '심판이요?', 'The judge?'),
        line(NG, '참가비 내고, 계측 규정 읽어. 예선은 세 마리다.', 'Pay the entry fee and read the measuring rules. The qualifier is three fish.'),
        line(P, '세 마리만 올리면 됩니까?', 'I just need to bring up three?'),
        line(NG, '기준에 맞는 세 마리. 계측대에 올리면 내가 잰다.', "Three that meet the standard. Put them on the measuring board and I measure."),
        line(NG, '봐주는 거 없다.', 'No favours.'),
      ], {
        choices: [
          opt('no_favor', '봐주시는 거 바라지 않습니다. 규정대로 재 주십시오', "I don't want favours. Measure by the rules", {
            next: 'no_favor' }),
          opt('ask_rules', '규정에서 제일 많이 걸리는 게 뭡니까?', 'What trips people up most in the rules?', {
            say: ['계측 규정에서 제일 많이 걸리는 게 뭡니까?', 'What do people fall foul of most in the measuring rules?'],
            next: 'rules' }),
          opt('ask_warehouse', '창고 일은 어떡하시고 여기 계십니까?', "What about the warehouse, with you here?", {
            next: 'warehouse' }),
        ],
        note: ['제주 대회 예선 심판석에 남궁현 씨가 앉아 있었다. 참가비를 내고 계측 규정을 읽은 뒤 기준에 맞는 세 마리를 계측대에 올리라며, 봐주는 건 없다고 했다.',
          "Namgung Hyeon was in the judge's seat at the Jeju qualifier. Pay the fee, read the measuring rules, and put three fish that meet the standard on the board, he said — no favours."],
      }),
      no_favor: scene([
        line(NG, '그 말은 계측대에서 다시 해. 말로는 다들 규정대로 하겠다고 해.', "Say that again at the board. Everyone says 'by the rules' with their mouth."),
        line(NG, '자를 대는 건 내가 하고, 놓는 건 네가 한다.', "I put the ruler down. You put the fish down."),
        line(P, '놓는 것도 규정이 있습니까?', "There are rules for putting it down, too?"),
        line(NG, '꼬리를 접지도 말고 펴지도 마. 놓인 그대로 잰다. 그게 다야.', "Don't fold the tail and don't stretch it. I measure it as it lies. That's all."),
      ], {
        end: endTalk({ accept: true, offer: 'no_favor' }),
        note: ['봐주는 건 바라지 않는다고 했다. 남궁현 씨는 그 말은 계측대에서 다시 하라며, 꼬리를 접지도 펴지도 말고 놓인 그대로 잰다고 했다.',
          "I said I didn't want favours. Say it again at the board, Hyeon told me — don't fold or stretch the tail; he measures it as it lies."],
      }),
      rules: scene([
        line(NG, '체장 미달. 금지체장 이하는 계측대에 올리는 순간 실격이야.', "Undersize. Anything at or under the legal minimum is disqualified the moment it's on the board."),
        line(NG, '그다음이 눈대중. 제 눈으로 넉넉하다고 믿고 올리는 놈들.', "Next is eyeballing. People who trust their eye that it's big enough."),
        line(P, '그럼 미리 재 봐야겠군요.', 'So I should measure beforehand.'),
        line(NG, '네 자부터 대 봐. 모자란 놈은 그 자리에서 놔줘. 계측대는 숫자를 확인하는 데다.', "Put your own ruler on it first. If it's short, let it go right there. The board is for confirming numbers."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_rules' }),
        note: ['규정에서 제일 많이 걸리는 게 뭐냐고 물었다. 금지체장 이하와 눈대중이라며, 내 자로 먼저 대 보고 모자라면 그 자리에서 놓아주라고 했다.',
          "I asked what trips people up most. Fish at or under the legal size, and eyeballing, he said — measure with my own ruler first and release anything short on the spot."],
      }),
      warehouse: scene([
        line(NG, '낮에는 창고 문 닫혀 있어. 내 일은 밤이야.', "The warehouse is shut by day. My work is at night."),
        line(NG, '창고에선 상자를 세고, 여기선 고기를 잰다. 세든 재든 틀리면 안 되는 건 같아.', "There I count boxes, here I measure fish. Counting or measuring, you can't get it wrong either way."),
        line(NG, '남 걱정 말고 참가비나 내고 와.', "Stop worrying about others and go pay your fee."),
      ], {
        choices: [
          opt('pay', '네, 참가비 내고 오겠습니다', "Right, I'll go pay the fee", {
            end: endTalk({ accept: true, offer: 'ask_warehouse' }),
            note: ['창고 일은 어떡하고 여기 있느냐고 물었다. 낮에는 창고가 닫혀 있고, 상자를 세든 고기를 재든 틀리면 안 되는 건 같다고 했다.',
              "I asked about the warehouse. It's shut by day, he said — and counting boxes or measuring fish, you can't get it wrong either way."] }),
          opt('familiar_face', '아는 얼굴이니 한 번쯤은 봐주실 줄 알았는데요', "I thought you might go easy on a familiar face", {
            say: ['아는 얼굴이니 한 번쯤은 봐주실 줄 알았는데요.', "I thought you might go easy on a familiar face, just once."],
            next: 'familiar' }),
        ],
      }),
      familiar: scene([
        line(NG, '아는 얼굴일수록 더 안 봐줘. 그래야 다른 선수들이 네 고기를 믿어.', "The more familiar the face, the fewer the favours. That's how the others trust your fish.", { act: 'look_up' }),
        line(NG, '봐줘서 통과한 놈은 결선에서 아무도 안 쳐다봐.', "Nobody looks twice at someone who got through on a favour in the final."),
        line(P, '…농담이었습니다.', '...I was joking.'),
        line(NG, '네가 나한테 받을 건 규정대로 잰 숫자 하나야. 그게 제일 오래가.', "All you'll get from me is one number, measured by the rules. That lasts longest."),
      ], {
        end: endTalk({ accept: true, offer: 'familiar_face' }),
        note: ['아는 얼굴이니 봐줄 줄 알았다고 농담했다. 남궁현 씨는 처음으로 눈을 들어 나를 보며, 아는 얼굴일수록 더 안 봐준다고 했다.',
          "I joked that he might go easy on a familiar face. For the first time Hyeon looked up at me: the more familiar the face, the fewer the favours."],
      }),
    },
  },
  // M5-06 — 끝내는 자리
  {
    id: 'm5_06_done', questId: 'M5-06', at: 'complete', npcId: NG, start: 'start',
    nodes: {
      start: scene([
        line(P, '세 마리, 계측대에 올렸습니다.', "Three fish, on the board."),
        line(NG, '…', '...', { act: 'peer' }),
        act(NG, 'silence'),
        line(NG, '통과.', 'Pass.'),
        line(P, '…그게 다입니까?', "...That's it?"),
        line(NG, '규정대로. 결선에서 보자.', 'By the rules. See you in the final.'),
      ], {
        choices: [
          opt('rules', '규정대로. 그 말이 제일 무거웠습니다', "By the rules. Those words weighed the most", {
            say: ['규정대로. 그 말이 심판석에서 제일 무거웠습니다.', "By the rules. From the judge's seat, those words weighed the most."],
            end: endTalk({ complete: 'rules',
              lineKo: '무거워야 한다. 가벼우면 대회가 아니야. 결선 전에 규정집 한 번 더 읽고 와. 결선은 크기 하나로 가린다.',
              lineEn: "They should weigh. If they're light, it isn't a tournament. Read the rulebook once more before the final. The final is decided on size alone." }),
            note: ['규정대로라는 말이 제일 무거웠다고 했다. 남궁현 씨는 무거워야 대회라며, 결선은 크기 하나로 가린다고 했다.',
              "I said 'by the rules' had weighed the most. It should, Hyeon said — the final is decided on size alone."] }),
          opt('ask_past', '창고에서 심판석까지, 무슨 일이 있으셨습니까', "From the warehouse to the judge's seat — what happened?", {
            next: 'past' }),
          opt('released_rest', '기준에 못 미친 고기들은 다 살려 보냈습니다', 'I released every fish that fell short', {
            next: 'released' }),
        ],
        note: ['예선 세 마리를 계측대에 올렸다. 남궁현 씨는 말없이 재고 통과라고만 하더니, 규정대로, 결선에서 보자고 했다.',
          "I put my three qualifier fish on the board. Hyeon measured them in silence and said only 'pass' — by the rules, see you in the final."],
      }),
      past: scene([
        act(NG, 'silence'),
        line(NG, '…결선 끝나고.', '...After the final.', { act: 'look_away' }),
        line(NG, '지금은 선수하고 심판이야. 심판이 선수한테 제 얘기를 하는 대회는 대회가 아니지.', "Right now we're competitor and judge. A judge telling a competitor his story — that's no tournament."),
      ], {
        end: endTalk({ complete: 'ask_past', lineKo: '결선 끝나면, 그때는 둘 다 그냥 낚시꾼이다.', lineEn: "After the final, we're both just anglers." }),
        note: ['창고에서 심판석까지 무슨 일이 있었느냐고 물었다. 남궁현 씨는 표정이 잠깐 흔들리더니, 결선이 끝나면 그때는 둘 다 그냥 낚시꾼이라고 했다.',
          "I asked what had brought him from the warehouse to the judge's seat. His face wavered for a moment; after the final, he said, we'd both be just anglers."],
      }),
      released: scene([
        line(NG, '…봤다. 계측대 뒤에서.', '...I saw. From behind the board.'),
        line(NG, '실격된 고기 들고 사진 찍는 놈은 많아도, 놓아주는 놈은 드물어.', "Plenty pose with a disqualified fish. Few let it go."),
      ], {
        end: endTalk({ complete: 'released_rest',
          lineKo: '대회는 재는 데서 끝나는 게 아니야. 잰 다음에 뭘 하는지까지가 대회야. 결선에서 보자.',
          lineEn: "A tournament doesn't end at the measuring. What you do after is part of it. See you in the final." }),
        note: ['기준에 못 미친 고기를 다 살려 보냈다고 했다. 남궁현 씨는 계측대 뒤에서 봤다며, 잰 다음에 뭘 하는지까지가 대회라고 했다.',
          "I said I'd released every fish that fell short. Hyeon had seen it from behind the board — what you do after measuring, he said, is part of the tournament."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M5-07 「서귀포 에깅」 — 받는 자리(마라) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_07_offer', questId: 'M5-07', at: 'offer', npcId: MA, start: 'start',
    nodes: {
      start: scene([
        line(MA, '…그쪽이에요? 세린이가 말한 사람.', "...Is it you? The one Serin talked about.", { act: 'look_up' }),
        line(P, '오세린 씨 친구분이세요?', "Are you a friend of Serin's?"),
        line(MA, '마라예요. 에깅 가르쳐 주라고 해서요. 세린이가 부탁해서.', "I'm Mara. I was asked to teach you egging. Serin asked me to."),
        line(P, '오세린 씨가요? 저한테는 아무 말 없었는데요.', "Serin did? She didn't say anything to me."),
        line(MA, '…그런 애예요.', "...That's how she is."),
        line(MA, '무늬오징어요. 가을 밤이면 얕은 데로 들어와요. 서귀포 이 앞이요.', "Bigfin reef squid. On autumn nights they come into the shallows. Right here off Seogwipo.", { act: 'look_sea' }),
        line(P, '마라 씨도 오세린 씨처럼 대회 나가세요?', 'Do you enter tournaments too, like Serin?'),
        line(MA, '저는 안 나가요, 대회.', "I don't. Tournaments.", { act: 'look_away' }),
        act(MA, 'silence'),
        line(MA, '그래도 폴링은 봐 줄게요.', "But I'll watch your fall."),
      ], {
        choices: [
          opt('fall_only', '폴링 봐 주시는 것만으로 충분해요', 'Watching my fall is plenty', {
            say: ['폴링 봐 주시는 것만으로 충분해요. 잘 부탁해요.', 'Watching my fall is plenty. Thank you for this.'],
            next: 'fall' }),
          opt('ask_serin', '오세린 씨랑은 어떤 사이예요?', 'How do you know Serin?', {
            say: ['오세린 씨가 부탁했다니… 두 분은 어떤 사이예요?', "Serin asked you... how do you two know each other?"],
            next: 'serin' }),
          opt('ask_quit', '대회엔 왜 안 나가요? 손은 그대로 같은데', "Why not enter? Your hands look as good as ever", {
            say: ['대회엔 왜 안 나가요? 에기 다듬는 손은 그대로 같은데요.', "Why don't you enter? The way you trim that jig, your hands look as good as ever."],
            next: 'quit' }),
        ],
        note: ['서귀포에서 마라 씨를 만났다. 오세린 씨의 부탁으로 왔다며 가을 밤 얕은 곳의 무늬오징어 에깅을 봐 주겠다고 했지만, 자기는 대회에 안 나간다고 했다.',
          "In Seogwipo I met Mara. She'd come because Serin asked and offered to watch my egging for bigfin reef squid in the autumn-night shallows — though she doesn't enter tournaments herself."],
      }),
      fall: scene([
        line(MA, '…네. 폴링만 봐요. 나머지는 그쪽 손이 할 거예요.', "...Okay. Just the fall. Your hands will do the rest."),
        line(MA, '무늬오징어는 에기가 떨어질 때 안아요. 튕길 때가 아니라.', "Reef squid grab the jig while it's falling. Not when you flick it."),
        line(P, '떨어질 때요?', 'While it falls?'),
        line(MA, '가을 밤엔 얕은 데로 들어오니까, 멀리 안 던져도 돼요. 각도만 보면 돼요.', "They come shallow on autumn nights, so you don't need a long cast. Just watch the angle."),
      ], {
        choices: [
          opt('angle', '각도만요. 잘 부탁해요', 'Just the angle. Thanks', {
            end: endTalk({ accept: true, offer: 'fall_only' }),
            note: ['폴링만 봐 줘도 충분하다고 했다. 마라 씨는 무늬오징어는 에기가 떨어질 때 안는다며, 각도만 보면 된다고 했다.',
              "I said watching my fall was plenty. Mara said reef squid grab the jig as it falls — just watch the angle."] }),
          opt('call_teacher', '그럼 오늘은 스승으로 모셔야겠네요', "Then I'll treat you as my teacher tonight", {
            next: 'teacher' }),
        ],
      }),
      teacher: scene([
        line(MA, '…하지 마요. 그런 말 들으면 진짜 가르쳐야 할 것 같잖아요.', "...Don't. Hearing that makes me feel like I really have to teach.", { act: 'look_away' }),
        line(MA, '그냥 마라라고 해요. 저는 폴링 봐 주는 사람이에요.', "Just call me Mara. I'm someone who watches your fall."),
        line(P, '네, 마라 씨.', 'All right, Mara.'),
        line(MA, '스승 소리는 세린이가 듣고 싶어 할걸요.', "Serin's the one who'd like being called teacher."),
      ], {
        end: endTalk({ accept: true, offer: 'call_teacher' }),
        note: ['오늘은 스승으로 모셔야겠다고 했더니, 마라 씨는 그냥 마라라고 부르라고 했다. 그때 처음으로 입꼬리가 조금 올라갔다.',
          "When I said I'd treat her as my teacher, Mara told me to just call her Mara. For the first time, the corner of her mouth lifted a little."],
      }),
      serin: scene([
        line(MA, '…친구요. 그 이상은 세린이한테 물어요.', "...A friend. Ask Serin about the rest."),
        act(MA, 'silence'),
        line(MA, '아니, 묻지 마요.', "No — don't ask."),
        line(MA, '세린이는 부탁을 잘 안 해요. 그런 애가 부탁했으니까 온 거예요.', "Serin hardly ever asks for anything. When someone like that asks, you come."),
        line(P, '…알겠어요. 안 물을게요.', "...All right. I won't ask."),
        line(MA, '그쪽 폴링만 봐요. 그게 약속이에요.', "I'll watch your fall. That's the promise."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_serin' }),
        note: ['오세린 씨와 어떤 사이냐고 물었다. 친구라고만 하더니, 오세린 씨가 부탁을 잘 안 하는 사람이라서 왔다고 해서 더는 묻지 않기로 했다.',
          "I asked how she knew Serin. Just a friend, she said — Serin rarely asks for anything, which is why she came — so I asked no more."],
      }),
      quit: scene([
        line(MA, '…그만뒀어요. 그거면 돼요.', "...I quit. That's enough."),
        line(P, '…', '...'),
        line(MA, '봐요, 이 각도. 떨어지는 동안 줄을 너무 잡으면 앞으로 끌려와요. 너무 놓으면 뒤로 누워요.', "Look, this angle. Hold the line too tight on the fall and it drags forward. Too loose and it lies back.", { act: 'peer' }),
        line(MA, '그 사이요. 제 얘기보다 이게 더 쓸모 있어요.', "Somewhere in between. This is more use to you than my story."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_quit' }),
        note: ['대회엔 왜 안 나가느냐고 물었다. 마라 씨는 그만뒀다는 말뿐, 대답 대신 에기를 물에 떨어뜨려 폴링 각도를 보여 주었다.',
          "I asked why she didn't enter. She only said she'd quit — and instead of answering, dropped her jig in the water to show me the angle of the fall."],
      }),
    },
  },
  // M5-07 — 끝내는 자리
  {
    id: 'm5_07_done', questId: 'M5-07', at: 'complete', npcId: MA, start: 'start',
    nodes: {
      start: scene([
        line(P, '마라 씨, 무늬오징어 올렸어요.', 'Mara, I got a reef squid.'),
        line(MA, '…잡았네요.', "...You got one.", { act: 'peer' }),
        line(MA, '마지막 폴링은 괜찮았어요.', 'Your last fall was good.'),
        line(P, '아까 저쪽 바위에서도 에기 떨어지는 소리가 났어요.', 'Earlier I heard a jig drop from those rocks over there, too.'),
        act(MA, 'silence'),
        line(MA, '…저도 던졌어요, 오늘.', '...I cast too. Tonight.', { act: 'look_away' }),
        line(MA, '세린이한테는 말하지 마요.', "Don't tell Serin."),
      ], {
        choices: [
          opt('keep_secret', '오세린 씨한테는 말 안 할게요', "I won't tell Serin", {
            next: 'secret' }),
          opt('tell', '오세린 씨는 알아야 해요. 마라 씨가 던졌다는 걸', 'Serin should know. That you cast', {
            say: ['오세린 씨는 알아야 할 것 같아요. 마라 씨가 오늘 던졌다는 걸요.', "I think Serin should know. That you cast tonight."],
            next: 'tell' }),
          opt('praise_fall', '마라 씨 폴링이 제 것보다 한참 예뻤어요', 'Your fall was far prettier than mine', {
            say: ['마라 씨 폴링이 제 것보다 한참 예뻤어요. 그건 말해도 되죠?', 'Your fall was far prettier than mine. I can say that much, right?'],
            next: 'praise' }),
        ],
        note: ['마라 씨에게 무늬오징어를 보여 주었다. 저쪽 바위에서 에기 떨어지는 소리를 들었다고 하자, 마라 씨는 자기도 오늘 던졌다며 오세린 씨에게는 말하지 말라고 했다.',
          "I showed Mara my reef squid. When I said I'd heard a jig drop from the rocks, she admitted she'd cast tonight too — and asked me not to tell Serin."],
      }),
      secret: scene([
        line(MA, '…고마워요.', '...Thanks.'),
        line(MA, '이 에기는 제 거 아니에요. 돌려줄 사람이 있어요.', "This jig isn't mine. There's someone I need to give it back to."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'keep_secret', lineKo: '오늘은 말고요. 언젠가 제 손으로 돌려줄게요.', lineEn: "Not today. Someday I'll give it back with my own hands." }),
        note: ['오세린 씨에게는 말하지 않겠다고 했다. 마라 씨는 던진 에기가 자기 것이 아니라며, 버리지 않고 주머니에 넣었다.',
          "I promised not to tell Serin. Mara said the jig she'd cast wasn't hers, and put it in her pocket instead of throwing it away."],
      }),
      tell: scene([
        line(MA, '…그럴 거면 그쪽이 말해요. 저는 못 해요.', "...Then you tell her. I can't."),
        line(P, '제가요?', 'Me?'),
        line(MA, '그쪽이 말하면… 세린이는 들을 거예요.', "If you tell her... Serin will listen."),
      ], {
        end: endTalk({ complete: 'tell', lineKo: '전할 거면 전해요. 문을 열지 말지는 제가 정할게요.', lineEn: "If you're going to tell her, tell her. Whether I open the door is for me to decide." }),
        note: ['오세린 씨는 알아야 한다고 하자, 마라 씨는 자기는 못 하니 내가 말하라고 했다. 말을 전하는 건 내 몫, 문을 열지 말지는 마라 씨의 몫이다.',
          "When I said Serin should know, Mara said she couldn't tell her, so I should. Passing on the words is mine to do; whether to open the door is Mara's."],
      }),
      praise: scene([
        line(MA, '…그쪽한테만요.', '...Only to you.'),
        line(MA, '예쁜 거 소용없어요. 대회에선 마릿수예요.', "Pretty is no use. In tournaments it's the count."),
        act(MA, 'silence'),
      ], {
        end: endTalk({ complete: 'praise_fall',
          lineKo: '그래도… 오늘은 예쁘게 떨어졌어요. 오랜만에. 그 말은 고마워요.',
          lineEn: "Still... it fell beautifully tonight. First time in a while. Thanks for saying so." }),
        note: ['마라 씨 폴링이 내 것보다 한참 예뻤다고 했다. 대회에선 마릿수라며 손사래를 치다가, 오늘은 오랜만에 예쁘게 떨어졌다고 했다.',
          "I told Mara her fall was far prettier than mine. Pretty is no use in tournaments, she said — then admitted it had fallen beautifully tonight, for the first time in a while."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M5-08 「결선과 전화 한 통」 — 받는 자리(남궁현) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_08_offer', questId: 'M5-08', at: 'offer', npcId: NG, start: 'start',
    nodes: {
      start: scene([
        line(NG, '결선이다.', "It's the final."),
        line(P, '예선 때보다 사람이 훨씬 많네요.', 'Far more people than the qualifier.'),
        line(NG, '이 대회 결선은 방어로 가린다. 80 이상. 그게 기준이야.', "This tournament's final is decided on yellowtail. Eighty and up. That's the standard."),
        line(P, '80센티요. 겨울 방어로요?', 'Eighty centimetres. Winter yellowtail?'),
        line(NG, '겨울 방어. 계측대에서 80이 안 되면 없는 고기다.', "Winter yellowtail. Under eighty on the board and it doesn't exist."),
        line(NG, '그리고 전화기는 꺼 둬.', 'And switch your phone off.'),
        line(P, '네.', 'Right.'),
        act(NG, 'silence'),
        line(NG, '…아니, 켜 둬라.', "...No. Keep it on."),
        line(P, '네?', 'Sorry?'),
      ], {
        choices: [
          opt('over_eighty', '80 넘는 놈으로 올리겠습니다. 결선은 한 번이니까요', "I'll land one over eighty. There's only one final", {
            next: 'over' }),
          opt('ask_phone', '켜 두라고요? 결선 중에 전화를 받으라는 겁니까?', 'Keep it on? You want me to take calls during the final?', {
            next: 'phone' }),
          opt('never_eighty', '80 넘는 방어는 아직 올려 본 적이 없습니다', "I've never landed a yellowtail over eighty", {
            next: 'never' }),
        ],
        note: ['겨울 결선은 방어 80cm 이상으로 가린다고 했다. 남궁현 씨는 전화기를 꺼 두라고 했다가, 잠깐 말을 멈추고는 켜 두라고 했다.',
          "The winter final would be decided on yellowtail of eighty centimetres or more. Hyeon told me to switch off my phone — then paused, and told me to keep it on."],
      }),
      over: scene([
        line(NG, '한 번이지. 그래서 결선이야.', "Only one. That's why it's the final."),
        line(NG, '겨울 방어는 걸리고 나서가 길어. 팔이 먼저 지친다.', 'With winter yellowtail, it\'s long after the hook-up. Your arms tire first.'),
        line(NG, '처음 달릴 땐 드랙을 믿어. 끝에 가서는 의심하고. 뜰채 안에 들기 전엔 아직 바다 거야.', "Trust the drag on the first run. Doubt it near the end. Until it's in the net, it still belongs to the sea."),
      ], {
        choices: [
          opt('board', '80은 계측대에서 정해지는 거군요', 'So eighty is decided on the board', {
            end: endTalk({ accept: true, offer: 'over_eighty', lineKo: '그래. 80은 계측대에서 결정된다.', lineEn: 'Yes. Eighty is decided on the board.' }),
            note: ['80 넘는 놈으로 올리겠다고 했다. 겨울 방어는 걸리고 나서가 길다며, 뜰채에 들기 전까지는 아직 바다 것이라고 했다.',
              "I said I'd land one over eighty. With winter yellowtail it's long after the hook-up, Hyeon said; until it's in the net, it belongs to the sea."] }),
          opt('ask_prize', '우승하면 상금은 얼마나 됩니까?', "How much is the prize if I win?", {
            next: 'prize' }),
        ],
      }),
      prize: scene([
        line(NG, '순위표는 접수처에 붙어 있어. 상금은 순위대로, 규정대로야.', "The ranking table is posted at registration. Prizes go by rank, by the rules."),
        line(NG, '상금 세는 놈은 방어 걸리면 손이 떨린다.', "The one counting prize money gets shaky hands when a yellowtail hits."),
        line(P, '…세지 않겠습니다.', "...I won't count it."),
        line(NG, '계측대에선 숫자 하나만 봐. 80. 나머지는 끝나고 세.', "On the board, watch one number. Eighty. Count the rest afterwards."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_prize' }),
        note: ['상금을 물었다가, 상금 세는 사람은 방어가 걸리면 손이 떨린다는 말을 들었다. 계측대에선 80이라는 숫자 하나만 보라고 했다.',
          "I asked about the prize and was told that people who count prize money get shaky hands on a strike. On the board, watch one number: eighty."],
      }),
      phone: scene([
        line(NG, '받으라는 게 아니야. 켜 두라는 거지.', "I'm not saying take calls. I'm saying keep it on."),
        act(NG, 'silence'),
        line(NG, '결선은 길어. 그동안 바다 밖에서도 일은 생겨.', "The final is long. Things happen off the water in the meantime."),
        line(NG, '대회 하나 때문에 들어야 할 소리를 못 듣는 건, 낚시꾼이 할 짓이 아니야.', "Missing something you needed to hear because of one tournament — an angler doesn't do that."),
        line(P, '…울리면요?', '...And if it rings?'),
        line(NG, '그때 네가 정해.', 'Then you decide.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_phone' }),
        note: ['결선 중에 전화를 받으라는 거냐고 물었다. 남궁현 씨는 받으라는 게 아니라 켜 두라는 거라며, 울리면 그때 내가 정하라고 했다.',
          "I asked whether he wanted me taking calls during the final. Not taking — keeping it on, Hyeon said; if it rings, I decide then."],
      }),
      never: scene([
        act(NG, 'laugh'),
        line(NG, '다들 없어. 결선 오기 전까지는.', "Nobody has. Not before the final."),
        line(NG, '그만한 놈은 밑으로 안 처박고 옆으로 내달린다. 배 밑으로 파고들면 초릿대를 물에 박아서라도 돌려.', "One that size doesn't dive — it runs sideways. If it heads under the boat, stick the rod tip in the water if you have to and turn it."),
        line(P, '얼마나 버텨야 합니까?', 'How long do I have to hold on?'),
        line(NG, '걸고 나서 십오 분은 버틸 생각으로 들어가.', 'Go in expecting to hold it for fifteen minutes after the hook-up.'),
      ], {
        end: endTalk({ accept: true, offer: 'never_eighty' }),
        note: ['80 넘는 방어는 올려 본 적이 없다고 털어놓았다. 남궁현 씨는 처음으로 짧게 웃으며 다들 결선 오기 전까지는 없다고, 십오 분은 버틸 생각으로 들어가라고 했다.',
          "I admitted I'd never landed a yellowtail over eighty. Hyeon gave a short laugh for the first time — nobody has before the final, he said, so go in ready to hold it fifteen minutes."],
      }),
    },
  },
  // M5-08 — 끝내는 자리
  {
    id: 'm5_08_done', questId: 'M5-08', at: 'complete', npcId: NG, start: 'start',
    nodes: {
      start: scene([
        line(P, '계측 부탁드립니다.', 'Measure it, please.'),
        line(NG, '…', '...', { act: 'peer' }),
        line(NG, '…계측 끝났다. 네 방어야.', "...Measuring's done. It's your yellowtail."),
        line(P, '방금 속초에서 전화가 왔습니다. 정옥선 씨가 쓰러지셨답니다.', 'I just got a call from Sokcho. Okseon has collapsed.'),
        act(NG, 'silence'),
        line(NG, '결과는 나중에 들어. 가 봐.', 'Hear the results later. Go.'),
        act(NG, 'give', { to: P, item: 'qr_rod_tournament' }),
        line(NG, '장비는 내가 챙긴다. 부상은 여기 있어.', "I'll see to your gear. Your prize is here."),
      ], {
        choices: [
          opt('go_now', '결과는 됐습니다. 속초로 갑니다', 'Forget the results. I\'m going to Sokcho', {
            say: ['결과는 됐습니다. 지금 속초로 갑니다.', "Forget the results. I'm going to Sokcho now."],
            end: endTalk({ complete: 'go_now',
              lineKo: '가라. 결과는 안 도망간다. 배는 천천히 몰아. 급한 마음으로 바다 건너다 사고 나는 놈 많다. 도착하면 전화 한 통 해.',
              lineEn: "Go. The results won't run off. Take the boat slow. Plenty of people crash crossing the sea in a hurry. Call me when you get there." }),
            note: ['결과는 됐다며 바로 속초로 가겠다고 했다. 남궁현 씨는 결과는 안 도망간다며, 배는 천천히 몰고 도착하면 전화하라고 했다.',
              "I said the results didn't matter and I'd leave for Sokcho at once. The results won't run off, Hyeon said — take the boat slow and call when I arrive."] }),
          opt('wait_result', '결과만 듣고 가겠습니다. 오 분입니다', "I'll hear the result, then go. Five minutes", {
            say: ['결과만 듣고 가겠습니다. 오 분이면 됩니다.', "I'll hear the result and then go. Five minutes, that's all."],
            next: 'wait' }),
          opt('by_rules', '결과는 규정대로 정해 주십시오. 제가 없어도요', "Decide the result by the rules. Even if I'm gone", {
            say: ['결과는 규정대로 정해 주십시오. 제가 자리에 없어도요.', "Decide the result by the rules. Even if I'm not here."],
            end: endTalk({ complete: 'by_rules',
              lineKo: '…당연하지. 네가 있든 없든 순위는 숫자로 정한다. 걱정 말고 가. 숫자는 내가 지킨다. 너는 사람한테 가.',
              lineEn: "...Of course. Here or not, the ranking is decided by numbers. Don't worry, go. I'll guard the numbers. You go to your person." }),
            note: ['내가 없어도 결과는 규정대로 정해 달라고 했다. 남궁현 씨는 기록지에 서명하며, 숫자는 자기가 지킬 테니 나는 사람한테 가라고 했다.',
              "I asked him to settle the result by the rules even if I was gone. Signing the record sheet, Hyeon said he'd guard the numbers — I should go to my person."] }),
        ],
        note: ['방어를 계측대에 올리자 남궁현 씨가 네 방어라고 했다. 정옥선 씨가 쓰러졌다는 전화를 받았다고 하자, 결과는 나중에 듣고 가 보라며 장비와 부상을 챙겨 주었다.',
          "When I put the yellowtail on the board, Hyeon said it was mine. When I told him about the call — Okseon had collapsed — he told me to hear the results later and go, and saw to my gear and prize."],
      }),
      wait: scene([
        act(NG, 'silence'),
        line(NG, '…오 분.', '...Five minutes.'),
        line(NG, '우승이다. 이제 가.', "You won. Now go."),
      ], {
        end: endTalk({ complete: 'wait_result',
          lineKo: '오 분 기다린 걸 탓할 사람은 없어. 그래도 지금부터는 일 분도 아껴. 가는 길에는 우승 생각 말고 바다만 봐.',
          lineEn: "Nobody will blame you for waiting five minutes. But from now on, don't waste one. On the way, forget the win and watch the sea." }),
        note: ['결과만 듣고 가겠다고 했다. 오 분 뒤 남궁현 씨는 우승이라며, 지금부터는 일 분도 아끼라고 했다.',
          "I said I'd hear the result and go. Five minutes later Hyeon told me I'd won — and not to waste another minute from then on."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M5-09 「총회 표결」 — 받는 자리(어촌계) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm5_09_offer', questId: 'M5-09', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '왔냐. 다음 총회에서 낚시공원 안건 표결한다.', "You're here. At the next general meeting, we vote on the fishing park."),
        line(P, '설명회 때 그 안건 말씀이군요.', 'The one from the briefing.'),
        line(C, '그래. 네 평판이 표가 된다.', "That's it. Your standing becomes votes."),
        line(P, '저도 손을 들 수 있습니까?', 'Can I raise my hand too?'),
        line(C, '계원이면 든다. 그 전에 위판 다섯 건은 채워 와. 그게 네 참여 실적이다.', "Every member does. Before that, bring in five consigned lots. That's your participation record."),
        line(P, '다섯 건이요. 알겠습니다.', 'Five lots. Understood.'),
        line(C, '손은 네가 들어. 누구 눈치도 보지 말고.', "Raise your hand yourself. Without looking to anyone."),
        line(P, '(정옥선 씨 생각이 자꾸 난다…)', '(I keep thinking about Okseon...)'),
      ], {
        choices: [
          opt('own_hand', '제 손으로 들겠습니다. 누가 어느 쪽이든요', "I'll raise my own hand. Whoever's on whichever side", {
            next: 'own' }),
          opt('ask_rep', '평판이 표가 된다니요? 한 사람에 한 표 아닙니까?', "Standing becomes votes? Isn't it one person, one vote?", {
            next: 'rep' }),
          opt('worried', '정옥선 씨 일로 머리가 복잡합니다. 그래도 손은 들겠습니다', "My head's full of Okseon. But I'll raise my hand", {
            say: ['정옥선 씨 일로 머리가 복잡합니다. 그래도 손은 들겠습니다.', "My head is a mess over Okseon. But I'll still raise my hand."],
            next: 'worried' }),
        ],
        note: ['다음 총회에서 낚시공원 안건을 표결한다고 했다. 표결 전까지 위판 다섯 건으로 참여 실적을 채우고, 손은 누구 눈치도 보지 말고 내가 들라고 했다.',
          "The fishing-park motion would be voted on at the next general meeting. Before then I'm to fill my participation record with five consigned lots — and raise my hand myself, without looking to anyone."],
      }),
      own: scene([
        line(C, '그래. 표결은 손 하나 드는 거지만, 그 손까지 오는 길이 표다.', "Good. A vote is one raised hand, but the road to that hand is the vote."),
        line(C, '앞줄에 누가 앉든 뒤를 돌아보지 마라.', "Whoever sits in the front row, don't look back."),
        line(P, '돌아보면요?', 'And if I do?'),
        line(C, '돌아보는 순간 네 손이 아니라 남의 손이 된다.', "The moment you look back, it isn't your hand any more. It's someone else's."),
      ], {
        end: endTalk({ accept: true, offer: 'own_hand' }),
        note: ['누가 어느 쪽이든 내 손으로 들겠다고 했다. 뒤를 돌아보는 순간 내 손이 아니라 남의 손이 된다는 말을 들었다.',
          "I said I'd raise my own hand, whoever was on which side. The moment you look back, I was told, it becomes someone else's hand."],
      }),
      rep: scene([
        line(C, '손은 한 사람에 하나다. 다만 네 말을 듣고 손을 드는 사람이 있다. 그게 평판이다.', "One hand per person. But some people raise theirs after listening to you. That's standing."),
        line(C, '위판에 꼬박꼬박 나오고 공동작업에 안 빠진 놈 말은, 계원들이 듣는다.', "Members listen to someone who's turned up at every auction and never missed communal work."),
        line(P, '그동안 한 일이 남의 손에도 실린다는 거군요.', "So what I've done rides on other people's hands too."),
        line(C, '그래.', "That's right.", { act: 'nod' }),
      ], {
        choices: [
          opt('got_it', '그럼 위판부터 채우겠습니다', "Then I'll fill the auction lots first", {
            end: endTalk({ accept: true, offer: 'ask_rep' }),
            note: ['평판이 왜 표가 되느냐고 물었다. 손은 하나지만 내 말을 듣고 손을 드는 사람이 있다고, 그동안 한 일이 남의 손에도 실린다는 말을 들었다.',
              "I asked how standing becomes votes. One hand each — but some raise theirs after listening to you; what I've done rides on others' hands too."] }),
          opt('ask_hyeonsu', '도현수 씨는 어느 쪽에 손을 듭니까?', 'Which way will Hyeonsu raise his hand?', {
            next: 'hyeonsu' }),
        ],
      }),
      hyeonsu: scene([
        line(C, '그걸 내가 알면 표결이 아니지. 그 애 손은 그 애 거다.', "If I knew, it wouldn't be a vote. His hand is his."),
        line(C, '할애비라고 손자 손을 들어 주는 계였으면, 벌써 망했다.', "If this were a co-op where a grandfather raises his grandson's hand, it would have gone under long ago."),
        line(P, '…괜한 걸 여쭸습니다.', "...I shouldn't have asked."),
        line(C, '네 손이나 걱정해. 남의 손 세다가 제 손 드는 걸 잊는 놈도 있다.', "Worry about your own hand. Some people count other hands and forget to raise their own."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_hyeonsu' }),
        note: ['도현수 씨는 어느 쪽에 손을 드느냐고 물었다. 그걸 알면 표결이 아니라며, 남의 손 세다가 제 손 드는 걸 잊지 말라고 했다.',
          "I asked which way Hyeonsu would vote. If anyone knew, it wouldn't be a vote — and I shouldn't count others' hands and forget my own."],
      }),
      worried: scene([
        line(C, '…안다.', '...I know.', { act: 'look_away' }),
        line(C, '그래서 표결 전까지 위판 다섯 건을 하라는 거다. 손을 움직이면 머리가 덜 시끄럽다.', "That's why I'm telling you to do five lots before the vote. Keep your hands busy and your head gets quieter."),
        act(C, 'silence'),
        line(C, '그 사람이 여기 있었으면 뭐라고 했겠냐. 얼음부터 나르라고 했겠지.', "If she were here, what would she say? Haul the ice first, she'd say."),
        line(P, '…그러셨을 거예요.', '...She would have.'),
        line(C, '위판 하고, 손 들고, 그다음에 가. 순서가 있다.', "Do the auctions, raise your hand, then go. There's an order to it."),
      ], {
        end: endTalk({ accept: true, offer: 'worried' }),
        note: ['정옥선 씨 일로 머리가 복잡하다고 털어놓았다. 손을 움직이면 머리가 덜 시끄럽다며, 위판 하고 손 들고 그다음에 가라고, 순서가 있다고 했다.',
          "I admitted Okseon was weighing on my mind. Keep your hands busy and your head quiets, I was told — auctions, the vote, then go; there's an order."],
      }),
    },
  },
  // M5-09 — 끝내는 자리
  {
    id: 'm5_09_done', questId: 'M5-09', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '표결 끝났다.', "The vote's over."),
        line(P, '…', '...'),
        line(C, '도현수가 같은 쪽이었지. 그거 봤나.', "Hyeonsu was on the same side as you. Did you see?"),
        line(P, '…봤습니다.', '...I saw.'),
        line(C, '울릉, 인천 뱃길이 열렸다. 다음은 거기다.', "The routes to Ulleung and Incheon are open. That's where you go next."),
        line(C, '그리고 병원부터 가 봐.', 'But go to the hospital first.'),
      ], {
        choices: [
          opt('hyeonsu_hand', '도현수 씨가 같은 쪽에 손을 들었습니다', 'Hyeonsu raised his hand on my side', {
            say: ['도현수 씨가 저랑 같은 쪽에 손을 들었습니다. 처음입니다.', 'Hyeonsu raised his hand on the same side as me. For the first time.'],
            next: 'hand' }),
          opt('hospital', '병원 이야기부터 듣고 싶습니다', "I'd like to hear about the hospital first", {
            next: 'hospital' }),
          opt('greet_other_side', '반대쪽에 손 드신 분들께 인사부터 하고 가겠습니다', "I'll greet the ones who voted the other way first", {
            end: endTalk({ complete: 'greet_other_side',
              lineKo: '…그래, 그게 맞다. 어느 쪽이든 내일 아침엔 같은 위판장에 선다. 그 사람들도 바다 걱정하다 손을 든 거다. 인사하고 나서 병원으로 가.',
              lineEn: "...Yes, that's right. Whichever side, tomorrow morning we all stand in the same auction hall. They raised their hands worrying about the sea too. Greet them, then go to the hospital." }),
            note: ['반대쪽에 손 든 사람들에게 인사부터 하고 가겠다고 했다. 어느 쪽이든 내일 아침엔 같은 위판장에 선다며, 인사하고 나서 병원으로 가라고 했다.',
              "I said I'd greet the people who voted the other way first. Whichever side, we'll all stand in the same auction hall tomorrow, I was told — greet them, then go to the hospital."] }),
        ],
        note: ['표결이 끝났다. 도현수 씨가 나와 같은 쪽에 손을 들었고 울릉과 인천 뱃길이 열렸는데, 병원부터 가 보라는 말을 들었다.',
          "The vote was over: Hyeonsu had raised his hand on my side, and the routes to Ulleung and Incheon were open. But I was told to go to the hospital first."],
      }),
      hand: scene([
        line(C, '봤다. 그 애가 먼저 들었어. 네 쪽을 보고.', "I saw. He raised it first. Looking your way."),
        line(C, '분기 총회 때 너한테 반대표를 던진 게 그 애다. 그때도 이유는 말 안 했고, 오늘도 안 할 거다.', "He's the one who voted against you at the quarterly meeting. He didn't say why then, and he won't today."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'hyeonsu_hand',
          lineKo: '그 애는 손으로 말한다. 오늘 그 손을 봤으면 된 거다.',
          lineEn: "He speaks with his hands. If you saw that hand today, that's enough." }),
        note: ['도현수 씨가 같은 쪽에 손을 들었다고 하자, 처음으로 그 사람 이야기를 길게 들었다. 손으로 말하는 사람이니 오늘 그 손을 봤으면 된 거라고 했다.',
          "When I said Hyeonsu had raised his hand on my side, I heard about him at length for the first time. He speaks with his hands, I was told; seeing that hand today was enough."],
      }),
      hospital: scene([
        line(C, '…쓰러졌다. 의식은 있어.', '...She collapsed. She\'s conscious.'),
        line(P, '의식은 있으시군요…', "She's conscious, then..."),
        line(C, '가 봐라. 표결은 끝났으니. 배편은 잡아 뒀다.', "Go. The vote's done. I've booked you passage."),
      ], {
        end: endTalk({ complete: 'hospital',
          lineKo: '표결 소식은 네가 들고 가. 그 사람 귀에는 계 소식보다 네 목소리가 먼저 들어갈 거다. 지금은 얼굴부터 보여 줘.',
          lineEn: "You take the news of the vote. Your voice will reach her before any co-op news. For now, just let her see your face." }),
        note: ['병원 이야기부터 듣고 싶다고 했다. 정옥선 씨는 쓰러졌지만 의식은 있다며, 배편을 잡아 주고 표결 소식은 내가 들고 가라고 했다.',
          "I asked about the hospital first. Okseon had collapsed but was conscious; I was booked passage and told to carry the news of the vote to her myself."],
      }),
    },
  },
];
