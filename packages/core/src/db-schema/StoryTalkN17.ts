/**
 * @file StoryTalkN17.ts
 * @description 290차 — N17 「단철호 · 하민지 — 인천 짬낚시」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = `StoryTalkN01.ts`(286 시범).
 *
 * 인물
 *  - 단철호(52 · 부장님) — 넉살 좋은 해요체 · 넥타이 · 손목시계 · 회사 농담(회식 · 법인카드 · 총무) · 「십 년」 · 나를 「그쪽」.
 *  - 하민지(26 · 첼로 단원) — 밝은 해요체 · 음악에 빗대는 말(활 · 첫 음 · 무대) · 단철호를 「부장님」 · 나를 「{player} 씨」.
 * 호칭(290): 나는 「단철호 씨」 · 「하민지 씨」. 옛 답의 「부장님」(주인공 말)은 「단철호 씨」로 바꿨다.
 * 정책: N17-1은 때가 있는(event) 곁가지 — 옛 미루는 답 `decline`으로 물러서는 끝이 있다.
 * 표시: 새로 만든 것 없음 — 옛 답의 표시(choice.n17_*)는 묶인 답이 남긴다.
 * 옛 끝내는 말의 「§3」(파는 것 금지 규칙의 내부 번호)은 화면 말로 풀었다 — 「낚싯대로 잡은 건 팔지 않는다」.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const C = 'dan_cheolho';
const M = 'ha_minji';
const P = 'player';

export const TALKS_N17: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N17-1 「퇴근길 20분」 — 받는 자리(단철호)
  // ═══════════════════════════════════════════
  {
    id: 'n17_1_offer', questId: 'N17-1', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '어, 낚시하시는 분이죠? 대 가방 보고 알았어요.', "Oh, you fish, don't you? I could tell from the rod bag.", { act: 'look_up' }),
        line(P, '네. 퇴근하시는 길이세요? 넥타이가…', "I do. Are you on your way home from work? Your tie..."),
        line(C, '퇴근길이에요. 단철호라고 합니다. 회사에선 부장이고, 여기선 그냥 짬낚시꾼이요.', "On my way home, yes. Dan Cheol-ho. At the office I'm a department head — here, just someone squeezing in a quick cast."),
        line(P, '짬낚시요?', "A quick cast?"),
        line(C, '퇴근길 20분이요. 딱 20분만 던지고 가요. 한 마리.', "Twenty minutes on the way home. I cast for exactly twenty minutes, then go. One fish."),
        line(P, '20분에 한 마리요?', "One fish in twenty minutes?"),
        line(C, '네. 그리고 그 한 마리는 식당에 줘요. 팔면 안 되니까.', "Yes. And that one fish goes to a restaurant. Because you can't sell it."),
        line(P, '그냥 주신다고요?', "You just give it away?"),
        line(C, '그게 십 년 습관이에요. 오늘은 같이 해 볼래요?', "That's a ten-year habit. Want to join me today?"),
      ], {
        choices: [
          opt('go', '20분이면 저도 돼요. 갈게요', "Twenty minutes, I can do. I'm in", {
            say: ['20분이면 저도 돼요. 가요.', "Twenty minutes works for me too. Let's go."], next: 'go' }),
          opt('restaurant', '식당에 그냥 드려요? 어떤 식당인데요?', "You just give it to a restaurant? Which one?", { next: 'restaurant' }),
          opt('doubt', '20분 안에 한 마리, 정말 돼요?', "One fish in twenty minutes — does that really work?", { next: 'doubt' }),
          opt('later', '오늘은 시간이 안 돼요', "I don't have time today", { next: 'later' }),
        ],
        note: ['넥타이를 반쯤 푼 단철호 씨가 퇴근길 20분 짬낚시를 같이 하자고 했다. 딱 20분, 한 마리. 잡은 건 팔지 않고 식당에 준다고, 그게 십 년 습관이라고 했다.',
          "Dan Cheol-ho, tie half loosened, invited me along on his twenty-minute after-work cast. Exactly twenty minutes, one fish — not sold but given to a restaurant. A ten-year habit, he said."],
      }),
      go: scene([
        line(C, '그 마음이에요. 가요.', "That's the spirit. Let's go."),
        line(C, '채비는 하나만 들고 와요. 바꿀 시간 없어요.', "Bring just one rig. There's no time to change."),
        line(P, '자리는요?', "And the spot?"),
        line(C, '부두 끝 계단 밑, 거기가 제 자리예요. 20분 재는 건 제가 할게요.', "Under the steps at the end of the pier — that's my spot. I'll keep the twenty minutes.", { act: 'nod' }),
      ], {
        end: endTalk({ accept: true, offer: 'go' }),
        note: ['20분이면 나도 된다고 했다. 단철호 씨는 채비는 하나만, 자리는 부두 끝 계단 밑이라며 20분은 자기가 재겠다고 했다.',
          "I said twenty minutes worked for me. One rig only, Cheol-ho said, and the spot is under the steps at the end of the pier — he'd keep time."],
      }),
      restaurant: scene([
        line(C, '부두 근처 단골 밥집이요. 십 년째 제 자리가 있어요.', "My regular place near the pier. I've had my own seat there for ten years."),
        line(C, '퇴근길에 한 마리 들고 가면 사장님이 그걸로 찌개를 끓여 줘요.', "When I bring a fish by after work, the owner makes a stew out of it."),
        line(P, '그럼 밥값은요?', "And the bill?"),
        line(C, '밥값은 제 돈으로 내요. 낚싯대로 잡은 건 팔면 안 되잖아요. 그게 십 년 동안 지켜 온 계산이에요.', "I pay for the meal with my own money. You can't sell what you catch on a rod. That's the math I've kept for ten years."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_restaurant' }),
        note: ['어떤 식당이냐고 물었다. 부두 근처 단골 밥집인데 십 년째 단철호 씨 자리가 있다고 했다. 잡은 건 주고 밥값은 자기 돈으로 낸다고, 낚싯대로 잡은 건 팔면 안 되니까.',
          "I asked which restaurant. His regular place near the pier, where he's had a seat for ten years. He gives the fish and pays for his meal himself — you can't sell what you catch on a rod."],
      }),
      doubt: scene([
        line(C, '안 될 때가 더 많아요. 그럼 그냥 퇴근해요.', "More often it doesn't. Then I just go home."),
        line(C, '20분은 잡으려고 정한 게 아니라 그만두려고 정한 시간이에요.', "Twenty minutes isn't the time I set to catch something. It's the time I set to stop.", { act: 'look_away' }),
        line(P, '그만두려고요?', "To stop?"),
        line(C, '그보다 오래 있으면 퇴근길이 아니라 출조가 돼요. 출조는 주말에 하는 거고요.', "Stay longer than that and it's not a commute anymore, it's a fishing trip. Fishing trips are for weekends."),
      ], {
        end: endTalk({ accept: true, offer: 'doubt_twenty' }),
        note: ['20분 안에 정말 되느냐고 물었다. 단철호 씨는 손목시계를 톡톡 치며, 안 될 때가 더 많고 20분은 잡으려는 게 아니라 그만두려고 정한 시간이라고 했다.',
          "I asked if twenty minutes ever really worked. Tapping his watch, Cheol-ho said it usually doesn't — twenty minutes isn't for catching, it's for knowing when to stop."],
      }),
      later: scene([
        line(C, '그럼 다음 퇴근길에요. 퇴근은 매일 있어요.', "Then on another commute. There's one every day."),
        line(C, '짬낚시는 그게 좋아요. 놓쳐도 아깝지 않거든요. 생각나면 부두 끝 계단으로 와요.', "That's the good thing about a quick cast — missing one is no loss. Come to the pier steps whenever you think of it."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['오늘은 시간이 안 된다고 했다. 단철호 씨는 퇴근은 매일 있다며, 생각나면 부두 끝 계단으로 오라고 했다.',
          "I said I didn't have time today. There's a commute every day, Cheol-ho said — come to the pier steps whenever I think of it."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N17-1 — 끝내는 자리(단철호)
  // ═══════════════════════════════════════════
  {
    id: 'n17_1_done', questId: 'N17-1', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(P, '식당에 드리고 왔어요. 팔지 않고요.', "I dropped it off at the restaurant. Didn't sell it."),
        line(C, '봤어요. 사장님이 받으면서 웃더라고요.', "I saw. The owner was smiling when she took it."),
        line(C, '창가 자리 보여요? 제 자리. 늘 비어 있어요.', "See the window seat? That's mine. Always kept open.", { act: 'look_away' }),
        line(P, '오늘은 수저가 두 벌 놓여 있던데요.', "There were two sets of spoons and chopsticks today."),
        line(C, '하나는 그쪽 거예요.', "One of them is yours."),
      ], {
        choices: [
          opt('habit', '20분 습관, 저도 하나 만들어 볼게요', "I'll make a twenty-minute habit of my own", {
            end: endTalk({ complete: 'habit',
              lineKo: '만들어요. 십 년 가요.\n\n습관은 작아야 오래 가요. 크게 잡으면 사흘이에요. 20분이면 피곤한 날도 할 수 있어요. 그런 날 하는 게 진짜 습관이에요.',
              lineEn: "Make one. It'll last ten years.\n\nHabits last when they're small. Go big and it's three days. Twenty minutes you can do even on tired days. Doing it on those days is what makes it a habit." }),
            note: ['나도 20분 습관을 하나 만들어 보겠다고 했다. 단철호 씨는 습관은 작아야 오래 간다고, 피곤한 날 하는 게 진짜 습관이라고 했다.', "I said I'd make a twenty-minute habit of my own. Habits last when they're small, Cheol-ho said — doing it on tired days is what makes it real."] }),
          opt('lesson', '20분에 한 마리 올리는 채비가 궁금해요', "I'm curious about a rig that lands one in twenty minutes", {
            end: endTalk({ complete: 'lesson',
              lineKo: '단순해야 해요. 채비 하나, 포인트 하나.\n\n포인트 고르는 데 10분 쓰면 낚시는 10분이에요. 그래서 자리는 정해 두고 가요. 바뀌는 건 물때뿐이에요. 물때만 보고 던져요.',
              lineEn: "It has to be simple. One rig, one spot.\n\nSpend ten minutes picking a spot and you only fish ten. So the spot's decided before I go. The only thing that changes is the tide. I just read the tide and cast." }),
            note: ['20분 채비가 궁금하다고 했다. 단철호 씨는 채비 하나, 포인트 하나라며, 자리는 미리 정해 두고 물때만 보고 던진다고 했다.', "I asked about his twenty-minute rig. One rig, one spot, Cheol-ho said — decide the spot beforehand and just read the tide."] }),
          opt('pay', '식당 밥값은 단철호 씨가 내시는 거죠?', "You're paying for the meal, right?", {
            say: ['식당 밥값은 단철호 씨가 내시는 거죠?', "The restaurant bill is on you, right?"], next: 'pay' }),
          opt('trade', '자리를 비워 두는 것도 장사의 한 수네요', "Keeping a seat open is a kind of business savvy", {
            say: ['단골 식당이 자리를 비워 두는 것도 장사의 한 수네요.', "A regular place keeping a seat open — that's a business move too."],
            end: endTalk({ complete: 'regular_trade',
              lineKo: '장사죠. 근데 돈이 안 오가는 장사예요. 생선이 가고 자리가 와요.\n\n십 년이면 그게 단골이에요. 값을 깎는 게 아니라 자리를 남기는 거. 그쪽도 언젠가 그런 가게 하나 생길 거예요.',
              lineEn: "It's business. But business where no money changes hands. The fish goes, the seat comes back.\n\nTen years of that makes you a regular. Not haggling the price down — keeping a seat. You'll have a place like that someday too." }),
            note: ['자리를 비워 두는 것도 장사의 한 수라고 했다. 단철호 씨는 돈이 안 오가는 장사라며, 생선이 가고 자리가 온다고 했다.', "I said keeping a seat open was a business move. Business with no money changing hands, Cheol-ho said — the fish goes, the seat comes back."] }),
        ],
        note: ['20분 안에 한 마리를 올려 단골 식당에 팔지 않고 건넸다. 단철호 씨는 늘 비어 있는 창가 자리를 가리켰다. 오늘은 수저가 두 벌이었고, 하나는 내 거라고 했다.',
          "I landed one within twenty minutes and gave it to the restaurant without selling it. Cheol-ho pointed out the window seat that's always kept for him. Today there were two place settings — one was mine."],
      }),
      pay: scene([
        line(C, '당연하죠. 회사 카드… 아니, 제 카드.', "Of course. Company card... no, my card."),
        act(C, 'laugh'),
        line(C, '회사 카드로 긁으면 회식이 되고, 제 카드로 긁어야 밥이 돼요.', "Swipe the company card and it's a work dinner. Swipe mine and it's a meal."),
        act(C, 'give', { to: P }),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '이건 팀 회식비 남은 거예요. 비밀이고요. 총무가 알면 혼나요.',
          lineEn: "This is what's left of the team dinner fund. It's a secret. If our treasurer finds out, I'm in trouble." }),
        note: ['밥값은 단철호 씨가 내는 거냐고 물었다. 회사 카드가 아니라 자기 카드로 긁어야 밥이 된다며, 팀 회식비 남은 거라는 봉투를 슬쩍 건넸다.',
          "I asked if the meal was on him. Swipe his own card, not the company's, and it's a meal, Cheol-ho said — and slipped me an envelope of leftover team-dinner money."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N17-2 「첼로 케이스」 — 받는 자리(하민지)
  // ═══════════════════════════════════════════
  {
    id: 'n17_2_offer', questId: 'N17-2', at: 'offer', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '저기요! 혹시 부장님이랑 퇴근길 낚시 하신 분이에요?', "Excuse me! Are you the one who did the after-work fishing with the department head?", { act: 'look_up' }),
        line(P, '단철호 씨요? 네, 맞아요.', "Dan Cheol-ho? Yes, that's me."),
        line(M, '역시! 하민지예요. 첼로 해요. 같은 동네 짬낚시 모임이에요.', "I knew it! I'm Ha Minji. I play cello. We're in the same neighborhood quick-cast crowd."),
        line(P, '첼로 케이스를 메고 방파제에 오신 거예요?', "You came out to the breakwater carrying a cello case?"),
        line(M, '네. 연주회가 오늘이거든요.', "Yes. My concert's today."),
        line(P, '오늘이요? 그런데 여기 계셔도 돼요?', "Today? Should you even be here?"),
        line(M, '그 전에 낚시요. 손이 풀려요. 우럭 두 마리만요.', "Fishing first. It loosens up my hands. Just two rockfish."),
        line(M, '두 마리 올라오면 조과 파티 해요. 같이 할래요?', "When two come up, we have a catch party. Want to join?"),
      ], {
        choices: [
          opt('party', '좋아요. 연주회 전에 두 마리 올려요', "Sure. Let's land two before your concert", {
            say: ['좋아요. 우럭 두 마리, 연주회 전에 올려요.', "Sounds good. Two rockfish, before the concert."], next: 'party' }),
          opt('hands', '낚시가 손을 풀어 준다니, 어떤 느낌이에요?', "Fishing loosens your hands? What does that feel like?", { next: 'hands' }),
          opt('time', '연주회 당일인데, 늦으면 어떡해요?', "It's concert day — what if you're late?", {
            say: ['연주회 당일인데, 늦으시면 어떡하려고요?', "It's the day of your concert — what if you end up late?"], next: 'time' }),
          opt('joke', '우럭 두 마리로 파티가 돼요?', "Two rockfish make a party?", { next: 'joke' }),
        ],
        note: ['첼로 케이스를 멘 하민지 씨가 단철호 씨에게 내 얘기를 들었다며 말을 걸었다. 연주회가 오늘인데 그 전에 손을 풀려고 우럭 두 마리를 낚겠다고, 올라오면 조과 파티를 하자고 했다.',
          "Ha Minji, carrying a cello case, said she'd heard about me from Dan Cheol-ho. Her concert was today, and she wanted to loosen her hands first with two rockfish — then a catch party."],
      }),
      party: scene([
        line(M, '좋아요! 첼로는 여기 둘게요. 케이스가 튼튼하거든요.', "Great! I'll leave the cello here. The case is sturdy."),
        line(M, '우럭 올라오면 바로 조과 파티예요. 회는 못 떠도 사진은 찍을 수 있어요.', "When the rockfish come up, it's straight to the catch party. Can't do sashimi, but we can take photos."),
        line(P, '무대 전에 사진이요?', "Photos, before going on stage?"),
        line(M, '웃고 들어가면 첫 음이 달라요.', "Go on smiling and your first note sounds different."),
      ], {
        end: endTalk({ accept: true, offer: 'party_on' }),
        note: ['연주회 전에 두 마리 올리자고 했다. 하민지 씨는 첼로 케이스를 방파제 계단에 조심스럽게 눕히고, 웃고 들어가면 첫 음이 달라진다고 했다.',
          "I said we'd land two before the concert. Minji laid her cello case carefully on the breakwater steps — go on stage smiling, she said, and your first note changes."],
      }),
      hands: scene([
        line(M, '무대 전에는 손가락이 차갑고 딱딱해요.', "Before a performance, my fingers get cold and stiff."),
        line(M, '그런데 줄을 잡고 입질을 기다리면, 손끝이 바다 쪽으로 열리는 느낌이 들어요.', "But holding the line and waiting for a bite, my fingertips feel like they open toward the sea."),
        line(P, '활 잡을 때도 그래요?', "Is it like that with the bow too?"),
        line(M, '네. 꽉 쥐면 소리가 죽어요. 우럭이 툭 칠 때 손에 힘이 빠지거든요. 그 느낌 그대로 무대에 가져가요.', "Yes. Grip too hard and the sound dies. When a rockfish taps, the strength drains from my hand. I carry that feeling onto the stage."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_hands' }),
        note: ['손이 풀린다는 게 어떤 느낌이냐고 물었다. 하민지 씨는 입질을 기다리면 손끝이 바다 쪽으로 열린다고, 우럭이 툭 칠 때 빠지는 힘을 그대로 무대에 가져간다고 했다.',
          "I asked what loosening her hands felt like. Waiting for a bite, Minji said, her fingertips open toward the sea — and she takes the slack that comes when a rockfish taps onto the stage."],
      }),
      time: scene([
        line(M, '세 시간 남았어요. 우럭 두 마리면 한 시간이면 돼요. 아마요.', "I've got three hours. Two rockfish should take an hour. Probably."),
        line(M, '알람 두 개 맞췄어요. 하나는 낚시 끝, 하나는 진짜 끝.', "I set two alarms. One for the end of fishing, one for the real end."),
        line(P, '두 번째가 울리면요?', "And when the second one goes off?"),
        line(M, '고기가 물어도 놓고 가요. 그건 약속할게요. 첼로가 먼저예요.', "I leave even if a fish is on. I promise. The cello comes first."),
      ], {
        end: endTalk({ accept: true, offer: 'worry_time' }),
        note: ['연주회에 늦으면 어떡하느냐고 물었다. 하민지 씨는 알람을 두 개 맞춰 뒀다며, 두 번째가 울리면 고기가 물어도 놓고 가겠다고, 첼로가 먼저라고 했다.',
          "I asked what she'd do if she ran late. Minji had set two alarms — when the second rang, she'd leave even with a fish on. The cello comes first."],
      }),
      joke: scene([
        line(M, '되죠! 사람 둘, 우럭 둘. 넷이면 파티예요.', "Of course! Two people, two rockfish. Four makes a party."),
        line(P, '(진지하게 손가락 네 개를 펴 보인다…)', "(She holds up four fingers, completely serious...)"),
        line(M, '음악은 제가 할게요. 연주회 전이라 콧노래 정도지만요.', "I'll handle the music. Just humming, since it's before the concert."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_party' }),
        note: ['우럭 두 마리로 파티가 되느냐고 했다. 하민지 씨는 사람 둘, 우럭 둘이면 넷이라 파티라며 진지하게 손가락 넷을 폈다. 음악은 콧노래로 자기가 맡겠다고 했다.',
          "I asked if two rockfish made a party. Two people plus two fish makes four, Minji said, holding up four fingers in earnest — and she'd supply the music by humming."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N17-2 — 끝내는 자리(하민지)
  // ═══════════════════════════════════════════
  {
    id: 'n17_2_done', questId: 'N17-2', at: 'complete', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '손 풀렸어요! 완전히요.', "My hands are loose! Completely."),
        line(P, '우럭 두 마리, 조과 파티 사진도 찍었고요.', "Two rockfish, and the catch-party photo too."),
        line(M, '이제 무대 가면 돼요. 아, 그리고 하나만요.', "Now I just head to the stage. Oh, and one more thing."),
        line(M, '재개관식 한다면서요? 부장님한테 들었어요.', "I hear there's a reopening ceremony? The department head told me."),
        line(P, '네, 준비하고 있어요.', "Yes, we're getting ready for it."),
        line(M, '저희가 연주할게요. 부장님 하모니카랑 제 첼로요.', "We'll play. His harmonica and my cello."),
      ], {
        choices: [
          opt('accept', '재개관식 연주, 부탁드려요', "Please play at the reopening", { next: 'score' }),
          opt('lesson', '파이팅 전에 손 푸는 법도 있을까요?', "Is there a way to loosen up before a fight, too?", {
            say: ['연주 전에 손 푸는 낚시라니. 파이팅 전에 손 푸는 법도 있을까요?', "Fishing to loosen up before playing. Is there a way to loosen up before fighting a fish, too?"],
            end: endTalk({ complete: 'lesson',
              lineKo: '있어요. 릴 핸들을 천천히 돌려요. 세 바퀴.\n\n연주 전에 활을 세 번 그어 보는 거랑 같아요. 소리가 아니라 손을 확인하는 거예요. 세 바퀴 돌리고 나면 손이 지금 어디 있는지 알아요.',
              lineEn: "There is. Turn the reel handle slowly. Three turns.\n\nIt's like drawing the bow three times before playing. You're not checking the sound — you're checking your hand. After three turns, you know where your hand is." }),
            note: ['파이팅 전에 손 푸는 법을 물었다. 하민지 씨는 릴 핸들을 천천히 세 바퀴 돌리라고, 활을 세 번 그어 보는 것과 같다고 했다.', "I asked how to loosen up before fighting a fish. Turn the reel handle slowly three times, Minji said — like drawing the bow three times before playing."] }),
          opt('pay', '조과 파티 회비는 있어요?', "Are there dues for the catch party?", {
            end: endTalk({ complete: 'pay',
              lineKo: '있어요! 첼로 단원 월급으로요!\n\n단원 월급이 원래 얼마 안 돼요. 그래도 조과 파티는 회비를 걷어야 파티 같아요. 다음엔 우럭 한 마리당 얼마로 할까요?',
              lineEn: "There are! From my orchestra salary!\n\nAn orchestra salary isn't much. But a catch party needs dues to feel like a party. Next time, shall we set a price per rockfish?" }),
            note: ['조과 파티 회비를 물었다. 하민지 씨는 얼마 안 되는 단원 월급에서 회비를 냈다.', "I asked about dues for the catch party. Minji paid them from her modest orchestra salary."] }),
          opt('nodues', '회비는 됐어요. 오늘 연주 잘하시면 돼요', "No dues. Just play well today", {
            say: ['회비는 됐어요. 오늘 연주 잘하시면, 그걸로 됐어요.', "Forget the dues. If you play well today, that's enough."],
            end: endTalk({ complete: 'no_dues',
              lineKo: '그럼 오늘 첫 음은 {player} 씨한테 드릴게요. 객석에선 아무도 모르겠지만 저는 알아요.\n\n틀리면 우럭 탓, 안 틀리면 오늘 낚시 덕이에요. 단원들한테 자랑할게요.',
              lineEn: "Then today's first note is yours, {player}. Nobody in the audience will know, but I will.\n\nIf I mess up, blame the rockfish. If I don't, it's thanks to today's fishing. I'll brag to the orchestra." }),
            note: ['회비는 됐으니 연주만 잘하라고 했다. 하민지 씨는 오늘 첫 음을 나한테 주겠다며 첼로 케이스를 고쳐 멨다.', "I said no dues — just play well. Minji said she'd give me today's first note and shouldered her cello case."] }),
        ],
        note: ['우럭 두 마리를 올리고 조과 파티 사진을 찍었다. 손이 다 풀렸다는 하민지 씨가, 재개관식 이야기를 들었다며 단철호 씨 하모니카와 자기 첼로로 연주하겠다고 했다.',
          "We landed two rockfish and took the catch-party photo. Her hands fully loose, Minji said she'd heard about the reopening ceremony and offered to play — Cheol-ho on harmonica, her on cello."],
      }),
      score: scene([
        line(M, '네! 곡은 벌써 있어요. 제목이 바다예요.', "Yes! I already have a piece. It's called The Sea."),
        line(M, '아직 미완성이에요. 부장님 하모니카 자리가 비어 있거든요.', "It's not finished yet. The harmonica part is still empty."),
        line(P, '그날까지 채워지겠죠?', "It'll be filled in by then, right?"),
      ], {
        end: endTalk({ complete: 'accept',
          lineKo: '채울게요. 그날 바다가 조용하면 좋겠어요.',
          lineEn: "I'll fill it in. I hope the sea is calm that day." }),
        note: ['재개관식 연주를 부탁했다. 하민지 씨는 제목이 바다인 곡이 있다며, 아직 하모니카 자리가 비어 있지만 그날까지 채우겠다고 했다.',
          "I asked them to play at the reopening. Minji had a piece called The Sea — the harmonica part was still empty, but she'd fill it in by then."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N17-3 「퇴근 후 30분」 — 받는 자리(단철호)
  // ═══════════════════════════════════════════
  {
    id: 'n17_3_offer', questId: 'N17-3', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '왔어요? 뒤 좀 봐요.', "You're here? Take a look behind me."),
        line(P, '…넥타이가 몇 개예요, 저게?', "...How many ties is that?"),
        line(C, '열두 개요. 팀 전부 데려왔어요.', "Twelve. I brought the whole team."),
        line(P, '팀 전부요? 짬낚시에요?', "The whole team? For a quick cast?"),
        line(C, '오늘은 30분이요. 퇴근 후 30분. 세 마리.', "Today it's thirty minutes. Thirty minutes after work. Three fish."),
        line(P, '열두 명이 30분에 세 마리요?', "Twelve people, three fish, thirty minutes?"),
        line(C, '이건 회식이에요, 낚시 아니고.', "This is a team dinner, not fishing."),
        line(C, '반은 대를 처음 잡아요. 나머지 반은 잡아 봤다고 우기는 사람들이고요.', "Half of them have never held a rod. The other half insist they have."),
        line(P, '(뒤에서 누군가 대를 거꾸로 들고 있다…)', "(Someone in the back is holding a rod upside down...)"),
      ], {
        choices: [
          opt('rigs', '그럼 채비부터 나눠야겠네요. 맡겨 주세요', "Then rigs come first. Leave it to me", {
            say: ['열두 명이면 채비부터 나눠야겠네요. 맡겨 주세요.', "With twelve people, rigs have to come first. Leave that to me."], next: 'rigs' }),
          opt('dinner', '회식이면, 끝나고 다 같이 드시러 가요?', "A team dinner — so you all go eat afterward?", { next: 'dinner' }),
          opt('tight', '솔직히 30분에 세 마리는 빠듯해요', "Honestly, three in thirty minutes is tight", {
            say: ['30분에 열두 명이 세 마리라… 솔직히 빠듯해요.', "Twelve people, three fish, thirty minutes... honestly, that's tight."], next: 'tight' }),
          opt('overtime', '퇴근 후 30분이면 야근 수당 나와요?', "Thirty minutes after work — does that count as overtime?", { next: 'overtime' }),
        ],
        note: ['단철호 씨가 팀원 열두 명을 전부 데리고 나왔다. 퇴근 후 30분에 세 마리. 반은 대를 처음 잡는 사람들이라며, 이건 낚시가 아니라 회식이라고 했다.',
          "Dan Cheol-ho brought out his entire twelve-person team. Three fish in thirty minutes after work. Half had never held a rod — this was a team dinner, he said, not fishing."],
      }),
      rigs: scene([
        line(C, '역시. 그 말 들으려고 데려온 거예요.', "Knew it. That's what I brought you here to hear."),
        line(C, '30분 안에 세 마리예요. 채비 나눠 주는 시간도 그 30분에 들어가요.', "Three fish within thirty minutes. Handing out rigs counts against those thirty minutes too."),
        line(P, '잡아 봤다고 우기는 쪽부터 볼게요.', "I'll start with the ones who insist they've done it before."),
        line(C, '잘 봤어요. 그쪽이 더 위험해요.', "Good eye. They're the dangerous ones.", { act: 'nod' }),
      ], {
        end: endTalk({ accept: true, offer: 'rigs_first' }),
        note: ['열두 명 채비부터 나누겠다고 했다. 단철호 씨는 그 말 들으려고 데려왔다며, 채비 나눠 주는 시간도 30분 안이라고 했다. 잡아 봤다고 우기는 쪽이 더 위험하다고.',
          "I said I'd start by handing out rigs to all twelve. That's what he'd brought me for, Cheol-ho said — and the handout counts against the thirty minutes. The ones who claim experience are the dangerous ones."],
      }),
      dinner: scene([
        line(C, '그 식당이요, 제 자리 비워 둔 데. 오늘은 열두 자리 비워 달라고 했어요.', "That restaurant — the one that keeps my seat. I asked them to keep twelve today."),
        line(C, '사장님이 웃었어요.', "The owner laughed."),
        line(P, '잡은 건요?', "And whatever we catch?"),
        line(C, '잡은 건 식당에 드리고, 밥은 우리가 사 먹어요. 팀원들한테 그걸 보여 주고 싶었어요. 낚시도 규칙 지키면서 하는 거라고.', "The catch goes to the restaurant, and we pay for our own food. I wanted the team to see that. Even fishing has rules you keep."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_dinner' }),
        note: ['끝나고 다 같이 먹으러 가느냐고 물었다. 단철호 씨 자리를 비워 두는 그 식당에 오늘은 열두 자리를 부탁했다고 했다. 잡은 건 드리고 밥은 사 먹는다고, 팀원들에게 그 규칙을 보여 주고 싶다고 했다.',
          "I asked if they'd all go eat afterward. He'd asked his usual restaurant to keep twelve seats. The catch goes to them and the team pays for dinner — he wanted the team to see that rule kept."],
      }),
      tight: scene([
        line(C, '빠듯하죠. 그래서 회식이에요.', "It is tight. That's why it's a team dinner."),
        line(C, '다 잡으면 낚시고, 못 잡아도 웃으면 회식이에요.', "Catch them all and it's fishing. Catch none but laugh, and it's a team dinner."),
        line(P, '세 마리는 누가 잡아요?', "So who catches the three?"),
        line(C, '그쪽 몫이에요. 팀원들은 한 마리도 못 잡아도 돼요. 대신 한 번씩은 던지게 해 줘요. 그게 오늘 제 부탁이에요.', "That's on you. The team doesn't have to catch a single one. But let each of them cast at least once. That's my request today."),
      ], {
        end: endTalk({ accept: true, offer: 'tight_time' }),
        note: ['30분에 세 마리는 빠듯하다고 했다. 단철호 씨는 세 마리는 내 몫이라며, 팀원들은 못 잡아도 되니 한 번씩은 던지게 해 달라고 했다.',
          "I said three in thirty minutes was tight. The three fish are on me, Cheol-ho said — the team doesn't need to catch anything, but let each of them cast at least once."],
      }),
      overtime: scene([
        line(C, '쉿. 팀원들 들어요.', "Shh. The team will hear you."),
        line(C, '누가 수당 얘기 꺼내면 다음 회식이 노래방이 돼요.', "If someone brings up overtime pay, the next team dinner turns into karaoke."),
        line(P, '(진심으로 겁먹은 얼굴이다…)', "(He looks genuinely scared...)"),
        line(C, '이건 자율 참가예요. 서류상으로는요. 근데 다들 자율적으로 다 왔어요. 그게 부장 십 년이에요.', "Attendance is voluntary. On paper. But everyone came, voluntarily. That's ten years of being the boss."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_overtime' }),
        note: ['야근 수당이 나오느냐고 농담했다. 단철호 씨는 진심으로 겁먹은 얼굴로 쉿 하더니, 서류상 자율 참가인데 다들 자율적으로 다 왔다고, 그게 부장 십 년이라고 했다.',
          "I joked about overtime pay. Genuinely alarmed, Cheol-ho shushed me — attendance is voluntary on paper, and everyone came voluntarily. That's ten years as the boss, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N17-3 — 끝내는 자리(단철호)
  // ═══════════════════════════════════════════
  {
    id: 'n17_3_done', questId: 'N17-3', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '세 마리! 15분에!', "Three fish! In fifteen minutes!"),
        line(P, '채비 나누는 데 15분, 남은 15분에 세 마리요.', "Fifteen minutes handing out rigs, three fish in the last fifteen."),
        line(C, '회식 성공이에요.', "The team dinner's a success."),
        line(C, '하모니카 들었죠? 그거 제가 분 거예요.', "You heard the harmonica, right? That was me."),
        line(P, '방파제에서 하모니카 부는 분은 처음 봤어요.', "I've never seen anyone play harmonica on a breakwater."),
        act(C, 'laugh'),
        line(C, '팀원들도 처음 봤대요.', "The team says they hadn't either."),
      ], {
        choices: [
          opt('lesson', '열두 명 채비를 15분에 나누는 법, 배웠어요', "I learned how to rig twelve people in fifteen minutes", {
            end: endTalk({ complete: 'lesson',
              lineKo: '미리 묶어 와요. 그게 부장 십 년이에요.\n\n전날 밤에 열두 벌. 봉지마다 이름 써서요. 그러면 현장에선 나눠 주기만 하면 돼요. 준비는 전날, 현장은 웃는 거. 회식이랑 똑같아요.',
              lineEn: "Tie them beforehand. That's ten years of being the boss.\n\nTwelve sets the night before. A name on every bag. Then on site you just hand them out. Prep the night before, laugh on the day. Same as a team dinner." }),
            note: ['열두 명 채비 나누는 법을 배웠다고 했다. 단철호 씨는 전날 밤에 봉지마다 이름을 써서 미리 묶어 온다고, 준비는 전날이고 현장은 웃는 거라고 했다.', "I said I'd learned how to rig twelve people. Tie them the night before with a name on every bag, Cheol-ho said — prep the night before, laugh on the day."] }),
          opt('pay', '회식비는 회사에서 나오죠?', "The company pays for the team dinner, right?", { next: 'card' }),
          opt('enough', '팀원들이 대를 잡았으면 됐어요', "If the team held rods, that's enough", {
            say: ['팀원분들이 대를 한 번씩 잡았으면, 그걸로 됐어요.', "If everyone on the team held a rod once, that's enough for me."],
            end: endTalk({ complete: 'decline',
              lineKo: '…그 말 팀원들한테 했더니 다들 다음 회식도 낚시로 하재요.\n\n노래방보다 낫대요. 막내가 제일 크게 말했어요. 첫 마리를 놓친 게 막내거든요. 놓친 사람이 제일 다시 오고 싶어 해요.',
              lineEn: "...I told the team you said that, and now they all want the next team dinner to be fishing too.\n\nBetter than karaoke, they said. The youngest said it loudest. The youngest is the one who lost the first fish. The ones who lose one want to come back the most." }),
            note: ['팀원들이 대를 잡았으면 됐다고 했다. 단철호 씨가 그 말을 전하자 팀원들이 다음 회식도 낚시로 하자고 했단다. 첫 마리를 놓친 막내가 제일 크게.', "I said it was enough that the team held rods. When Cheol-ho passed that on, they all wanted the next dinner to be fishing too — the youngest, who lost the first fish, loudest of all."] }),
          opt('cast', '처음 잡는 분들 가르치는 데도 요령이 있더라고요', "There's a knack to teaching first-timers", {
            say: ['처음 잡는 분들한테 던지는 법을 가르치는 데도 요령이 있더라고요.', "There's a real knack to teaching first-timers how to cast."],
            end: endTalk({ complete: 'first_cast',
              lineKo: '길게 설명하면 아무도 안 들어요. 회의랑 같아요. 딱 하나만. 줄 잡은 손가락을 언제 놓는지.\n\n나머지는 던지면서 배워요. 가르치다 보면 내 캐스팅도 정리되고요. 부장이 신입한테 배우는 게 그거예요.',
              lineEn: "Explain too long and nobody listens. Same as a meeting. Just one thing: when to let go of the line with your finger.\n\nThe rest they learn by casting. And teaching tidies up your own cast. That's what a boss learns from the new hires." }),
            note: ['처음 잡는 사람 가르치는 데도 요령이 있더라고 했다. 단철호 씨는 회의처럼 딱 하나만, 줄 잡은 손가락을 언제 놓는지만 알려 주라고 했다.', "I said there was a knack to teaching first-timers. Like a meeting, Cheol-ho said — just one thing: when to let the line go from your finger."] }),
        ],
        note: ['채비를 나눠 주느라 15분을 쓰고 남은 15분에 세 마리를 올렸다. 회식 성공. 방파제에서 하모니카를 분 건 단철호 씨였다.',
          "I spent fifteen minutes handing out rigs and landed three fish in the remaining fifteen. The team dinner was a success. The harmonica on the breakwater was Dan Cheol-ho."],
      }),
      card: scene([
        line(C, '당연하죠. 법인카드!', "Of course. Corporate card!"),
        line(C, '영수증엔 팀 단합 행사라고 적혀요.', "The receipt will say team-building event."),
        line(P, '틀린 말은 아니네요.', "That's not wrong."),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '열두 명이 한 방파제에서 한 번씩 웃었으니까요. 그게 단합이에요.',
          lineEn: "Twelve people each laughed once on the same breakwater. That's team-building." }),
        note: ['회식비는 회사에서 나오느냐고 물었다. 단철호 씨는 법인카드로 가이드비를 결제하며, 영수증엔 팀 단합 행사라고 적힌다고 했다.', "I asked if the company was paying. Cheol-ho put my guide fee on the corporate card — the receipt would say team-building event."],
      }),
    },
  },
];
