/**
 * @file StoryTalkN08.ts
 * @description 290차 — 이야기 「고만석·고해나 — 방어진 「고래마루」」(N08-1~4) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 끝은 옛 받는 답(`end.offer`) · 보상 답(`end.complete`)에 묶는다.
 *
 * 인물: 고만석(58 · 고래마루 선장 · 험상궂은 반말 · 말이 짧다 · 「~다」 · 「~해」 · 주인공을 「너」) ·
 *   고해나(24 · 선장의 딸 · 존댓말 · 웃으며 진지하다 · 아버지를 「아빠」 · 주인공을 「{player} 씨」 · 「그쪽」).
 * 주인공은 「고만석 씨」 · 「해나 씨」로 부른다(선장님 · 아버님 없이).
 * 표시(옛 답에서 그대로): choice.n08_1_asked_bow · choice.n08_1_asked_rig · choice.n08_1_noticed_listening ·
 *   choice.n08_2_asked_why · choice.n08_2_asked_winter · choice.n08_support_haena · choice.n08_3_asked_why · choice.n08_3_asked_secret ·
 *   choice.n08_photo · choice.n08_4_asked_why · choice.n08_4_asked_haena · choice.n08_4_opposed · choice.n08_told_haena.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const G = 'go_manseok';
const H = 'go_haena';
const P = 'player';

export const TALKS_N08: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N08-1 「첫 승선」 — 받는 자리(고만석)
  // ═══════════════════════════════════════════
  {
    id: 'n08_1_offer', questId: 'N08-1', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '네가 사관 자리 보고 왔다는 녀석이냐.', "You the one who came about the deckhand spot?", { act: 'look_up' }),
        line(P, '네. 고래마루에 한번 타 보고 싶었습니다.', "Yes. I've wanted to ride the Goraemaru."),
        line(G, '타는 건 승객도 탄다. 사관은 일하러 타는 거다.', "Passengers ride too. A deckhand rides to work."),
        line(P, '사관은 무슨 일을 하는데요?', "What does a deckhand do?"),
        line(G, '승객 채비 봐 주고, 엉킨 줄 풀고, 고기 오르면 뜰채 댄다. 그러면서 네 고기도 올리고.',
          "Check the passengers' rigs, untangle lines, get the net under fish as they come up. And land your own while you're at it."),
        line(P, '제 고기도요? 몇 마리나요?', "My own too? How many?"),
        line(G, '오전에 두 마리. 선상 채비로.', "Two in the morning. On a boat rig."),
        line(G, '자리는 뱃머리다. 가서 서.', "Your spot is the bow. Go and stand there."),
        line(P, '(처음 타는 사람을 뱃머리에…?)', "(The bow, for someone on their first trip...?)"),
        line(G, '점심은 배에서 물회다. 거기까지가 오늘 일이야.', "Lunch is mulhoe on board. That's the day's work, start to finish."),
      ], {
        choices: [
          opt('bow', '처음 탄 사람을 왜 뱃머리에 세우세요?', 'Why put a first-timer at the bow?', {
            say: ['처음 타는 사람을 왜 하필 뱃머리에 세우세요? 제일 흔들리는 데 아닌가요?', "Why put someone on their first trip at the bow, of all places? Isn't that where it rocks the most?"],
            next: 'bow' }),
          opt('rig', '육지 채비랑 뭐가 그렇게 다른가요?', 'How is a boat rig so different from a shore rig?', {
            say: ['선상 채비요? 육지 채비랑 뭐가 그렇게 다른가요?', "A boat rig? How is it so different from what I use on shore?"],
            next: 'rig' }),
          opt('lunch', '물회라니, 그거 하나 보고 타겠습니다', "Mulhoe? I'd come aboard for that alone", {
            say: ['점심이 물회라니, 그거 하나 보고라도 타겠습니다.', "Mulhoe for lunch? I'd come aboard for that alone."],
            next: 'lunch' }),
        ],
        note: ['방어진의 고만석 씨가 나를 고래마루 사관으로 태우겠다고 했다. 뱃머리에 서서 승객 채비를 봐 주고, 오전에 선상 채비로 두 마리를 올리라고 했다. 점심은 배에서 먹는 물회라고 했다.',
          "Manseok of Bangeojin said he would take me on the Goraemaru as a deckhand. I was to stand at the bow, look after the passengers' rigs and land two fish on a boat rig in the morning. Lunch would be mulhoe on board."],
      }),
      bow: scene([
        line(G, '그래서 세우는 거다. 뱃머리에서 버티면 어디서든 버틴다.', "That's exactly why. Hold on at the bow and you can hold on anywhere."),
        line(P, '버티는 것만 보시는 건가요?', "Is holding on all you're looking for?"),
        line(G, '아니. 거기선 승객이 다 보여. 누가 멀미하는지, 누가 채비 엉켰는지.', "No. From there you see every passenger. Who's seasick, whose rig is tangled.", { act: 'look_sea' }),
        line(G, '사관은 낚시보다 그걸 먼저 본다. 가서 서.', "A deckhand sees that before the fishing. Go and stand there."),
        line(P, '…알겠습니다. 뱃머리에 서겠습니다.', "...Understood. I'll take the bow."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_bow' }),
        note: ['처음 타는 사람을 왜 뱃머리에 세우느냐고 물었다. 고만석 씨는 거기서 버티면 어디서든 버티고, 승객이 다 보이는 자리라 사관은 낚시보다 그걸 먼저 본다고 했다.',
          "I asked why he'd put a first-timer at the bow. Manseok said whoever holds on there can hold on anywhere, and that from there you see every passenger — a deckhand looks at that before the fishing."],
      }),
      rig: scene([
        line(G, '타 보면 알아. 말로 하면 안 믿는다.', "You'll know once you're aboard. Say it in words and nobody believes it."),
        line(G, '이거 써. 짧고, 굵고, 무겁다.', "Use this. Short, thick and heavy."),
        line(P, '생각보다 짧네요. 추도 무겁고요.', "Shorter than I expected. And the sinker's heavy.", { act: 'peer' }),
        line(G, '육지 채비 들고 온 녀석들은 첫 파도에 다 엉켜. 엉키면 옆 사람 것까지 엉킨다.', "People who bring shore rigs tangle on the first wave. And when they tangle, the next person's line goes with them."),
        line(P, '그럼 그날은…', "Then that day..."),
        line(G, '장사 끝이다. 그러니까 이거 써.', "Business is over. So use this."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_rig' }),
        note: ['선상 채비가 육지 채비와 뭐가 다르냐고 물었다. 고만석 씨는 짧고 굵고 무거운 대를 내밀며, 육지 채비는 첫 파도에 엉키고 옆 사람 줄까지 엉켜 그날 장사를 망친다고 했다.',
          "I asked how a boat rig differs from a shore one. Manseok held out a short, thick, heavy rod and said shore rigs tangle on the first wave, take the next person's line with them and ruin the day's business."],
      }),
      lunch: scene([
        line(G, '물회 보고 타는 녀석은 물회 먹기 전에 멀미한다.', "Anyone who boards for the mulhoe gets seasick before they eat it."),
        line(P, '…그 정도예요?', "...Is it that bad?"),
        line(G, '먹으려면 일부터 해. 오전에 두 마리 올려야 물회에 네 것도 들어간다.', "If you want to eat, work first. Land two in the morning and some of yours goes into the mulhoe."),
        line(G, '손 놀면 국물만 준다.', "Idle hands get broth only."),
        line(P, '(험상궂은 얼굴인데, 입꼬리가 조금 움직였다.)', "(A fierce face — but the corner of his mouth moved a little.)"),
      ], {
        choices: [
          opt('earn', '두 마리 올리고 물회 제대로 먹겠습니다', "I'll land two and earn a proper bowl", {
            say: ['그럼 두 마리 올리고, 물회는 제대로 먹겠습니다.', "Then I'll land my two and eat a proper bowl of mulhoe."],
            end: endTalk({ accept: true, offer: 'mulhoe' }),
            note: ['물회 하나 보고 타겠다고 했다가, 일부터 하라는 말을 들었다. 두 마리를 올려야 물회에 내 몫도 들어간다고 했다.', "I said I'd board for the mulhoe alone and was told to work first. Only if I landed two would any of mine go into it."] }),
          opt('obey', '처음이니 시키는 대로 하겠습니다', "It's my first time — I'll do as I'm told", {
            say: ['처음이니까, 시키는 대로 하겠습니다.', "It's my first time, so I'll do as I'm told."],
            next: 'obey' }),
        ],
        note: ['점심이 물회라는 말에 그거 하나 보고 타겠다고 했다. 고만석 씨는 손 놀면 국물만 준다면서도 입꼬리가 조금 움직였다.',
          "When he said lunch was mulhoe, I said I'd come aboard for that alone. Manseok said idle hands get broth only, but the corner of his mouth moved a little."],
      }),
      obey: scene([
        line(G, '시키는 대로만 하면 사관 못 된다. 시키기 전에 보는 녀석이 사관이야.', "Do only what you're told and you'll never be a deckhand. A deckhand sees it before being told."),
        line(P, '…', '...'),
        line(G, '오늘은 시키는 대로 해라. 첫날이니까.', "Today, do as you're told. It's your first day."),
        line(G, '대신 귀는 열어 둬. 배 위에선 들리는 게 다 일이다.', "But keep your ears open. On a boat, everything you hear is work."),
        line(P, '네. 귀 열어 두겠습니다.', "Yes. I'll keep them open."),
      ], {
        end: endTalk({ accept: true, offer: 'obey' }),
        note: ['시키는 대로 하겠다고 했더니, 시키기 전에 보는 사람이 사관이라는 말이 돌아왔다. 첫날이니 오늘은 시키는 대로 하되, 배 위에서 들리는 건 다 일이니 귀를 열어 두라고 했다.',
          "When I said I'd do as I was told, he said a deckhand is the one who sees before being told. For a first day, doing as told would do — but everything you hear on a boat is work, so keep your ears open."],
      }),
    },
  },
  // N08-1 — 끝내는 자리(고만석)
  {
    id: 'n08_1_done', questId: 'N08-1', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '수고했다.', "Good work."),
        line(P, '두 마리 올렸습니다. 물회에도 제 것이 들어갔고요.', "I landed my two. Some of mine went into the mulhoe, too."),
        line(G, '봤다. 줄 곧게 세우더라.', "I saw. You kept your line straight.", { act: 'nod' }),
        line(P, '점심때 승객 한 분이 자기 이야기를 길게 하시던데요.', "At lunch one of the passengers told a long story about themselves."),
        line(G, '승객 사연 들었지.', "You heard the passenger's story."),
        line(P, '네. 안 들으려 해도 들리더라고요.', "Yes. I couldn't help hearing it."),
        line(G, '그것도 배 일이다. 다음 항차부터 승객 사연 거드는 일은 네 몫으로 열어 두지.', "That's boat work too. From the next trip, helping with passengers' stories is yours."),
      ], {
        choices: [
          opt('lesson', '선상 채비가 왜 짧고 굵은지 알았습니다', 'Now I see why a boat rig is short and thick', {
            say: ['선상 채비가 왜 이렇게 짧고 굵은지, 오늘 이해했습니다.', "Today I understood why a boat rig is so short and thick."],
            end: endTalk({ complete: 'lesson',
              lineKo: '배는 흔들리니까. 긴 대는 흔들림을 배로 받아.\n\n추도 무겁게 써. 배는 흘러가니까 가벼운 건 바닥에 못 닿아. 줄은 곧게 세워. 그게 배 위 예의다.',
              lineEn: "Because the boat rocks. A long rod takes that rocking and doubles it.\n\nUse a heavy sinker, too. The boat drifts, so a light one never reaches the bottom. Keep the line straight. That's manners on a boat." }),
            note: ['선상 채비가 왜 짧고 굵은지 알았다고 했다. 고만석 씨는 긴 대는 흔들림을 배로 받고, 배는 흘러가니 추를 무겁게 써서 줄을 곧게 세우는 게 배 위 예의라고 했다.',
              "I said I understood why a boat rig is short and thick. Manseok said a long rod doubles the rocking, and since the boat drifts you use a heavy sinker and keep the line straight — that's manners on a boat."] }),
          opt('pay', '뱃머리에 선 값은 있나요?', 'Is there pay for standing at the bow?', {
            say: ['뱃머리에 하루 선 값은 있습니까?', "Is there pay for a day at the bow?"],
            next: 'pay' }),
          opt('decline', '태워 주신 것만으로 됐습니다', 'Letting me aboard was enough', {
            say: ['태워 주신 것만으로 됐습니다.', "Letting me aboard was enough."],
            end: endTalk({ complete: 'decline',
              lineKo: '…그렇게 말하는 녀석은 다음 항차 공짜다.\n\n공짜라고 놀러 타는 거 아니다. 남보다 먼저 와서 갑판부터 닦아. 그게 이 배에서 자리 받는 법이다.',
              lineEn: "...Anyone who says that rides free next trip.\n\nFree doesn't mean you come to play. You come before everyone else and scrub the deck first. That's how you earn a place on this boat." }),
            note: ['태워 준 것만으로 됐다고 했다. 고만석 씨는 그런 사람은 다음 항차가 공짜라며, 대신 남보다 먼저 와서 갑판부터 닦으라고 했다. 고래마루에 내 자리가 생겼다.',
              "I said being let aboard was enough. Manseok said that earns a free ride next trip — but I'd have to come before everyone and scrub the deck first. I had a place on the Goraemaru."] }),
          opt('noticed', '고만석 씨도 사연 다 듣고 계셨죠?', "You were listening to that story too, weren't you?", {
            say: ['그 승객 사연, 고만석 씨도 다 듣고 계셨죠?', "That passenger's story — you were listening to all of it too, weren't you?"],
            next: 'noticed' }),
        ],
        note: ['고만석 씨에게 두 마리를 올리고 물회에 내 몫도 들어갔다고 알렸다. 점심때 승객 하나가 제 사연을 길게 했는데, 고만석 씨는 그것도 배 일이라며 다음 항차부터 내게 맡기겠다고 했다.',
          "I told Manseok I'd landed my two and that some of mine went into the mulhoe. A passenger told a long story at lunch; Manseok said that was boat work too and that he'd leave it to me from the next trip."],
      }),
      pay: scene([
        line(G, '있지. 사관은 사관이다.', "There is. A deckhand is a deckhand."),
        act(G, 'give', { to: P }),
        line(G, '승선비는 돌려주고 일당 얹었다. 뱃머리에서 하루 버틴 값이다.', "Your fare back, with a day's wage on top. That's for holding out at the bow all day."),
        line(P, '감사합니다.', "Thank you.", { act: 'receive' }),
        line(G, '승객은 돈 내고 타고, 사관은 돈 받고 탄다. 그 차이를 알면 다음 항차에도 태운다.', "Passengers pay to ride; a deckhand gets paid to ride. Know the difference and I'll take you next trip too."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['뱃머리에 선 값을 물었더니, 고만석 씨는 승선비를 돌려주고 일당을 얹어 주었다. 승객은 돈 내고 타고 사관은 돈 받고 탄다며, 그 차이를 알면 다음에도 태운다고 했다.',
          "When I asked about pay for the bow, Manseok gave my fare back with a day's wage on top. Passengers pay to ride and deckhands get paid, he said — know the difference and he'd take me again."],
      }),
      noticed: scene([
        line(G, '…안 들었다.', "...I didn't hear a thing.", { act: 'look_away' }),
        line(P, '(안 들었다는 얼굴이 아니다.)', "(That isn't the face of someone who heard nothing.)"),
        line(G, '배 위에서 한 말은 바다에 두고 내리는 거다. 들었어도 못 들은 거야.', "What's said on a boat stays with the sea when you get off. Even if you heard it, you didn't."),
        line(G, '너도 그렇게 해. 그게 이 배 규칙이다. 지키면 승객이 또 탄다.', "You do the same. That's this boat's rule. Keep it and the passengers come back."),
      ], {
        end: endTalk({ complete: 'noticed' }),
        note: ['고만석 씨도 사연을 다 듣고 있지 않았느냐고 물었다. 안 들었다고 했지만 그런 얼굴이 아니었다. 배 위에서 한 말은 바다에 두고 내리는 것, 그게 이 배의 규칙이라고 했다.',
          "I asked if Manseok had been listening the whole time. He said he hadn't, but his face said otherwise. What's said on a boat stays with the sea — that, he said, was this boat's rule."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N08-2 「해나의 칼」 — 받는 자리(고해나)
  // ═══════════════════════════════════════════
  {
    id: 'n08_2_offer', questId: 'N08-2', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '아빠 배 탔던 분 맞죠? 뱃머리에 서 있던.', "You rode Dad's boat, right? The one standing at the bow.", { act: 'look_up' }),
        line(P, '네. 고해나 씨 맞으시죠? 고만석 씨 따님.', "Yes. You're Haena, right? Manseok's daughter."),
        line(H, '네, 해나예요. 부탁이 하나 있어서요.', "Yes, I'm Haena. I have a favour to ask."),
        line(P, '어떤 부탁인데요?', "What kind of favour?"),
        line(H, '방어 한 마리만 낚아 주세요. 겨울 방어요.', "Just catch me one yellowtail. A winter yellowtail."),
        line(P, '방어 한 마리요? 그걸로 뭘 하시게요?', "One yellowtail? What for?"),
        line(H, '아빠 밥상 차릴 거예요. 회는 제가 뜰 거고요.', "I'm going to set Dad's table with it. I'll cut the sashimi myself."),
        line(P, '…직접요?', "...Yourself?"),
        line(H, '네. 처음부터 끝까지 제 칼로요.', "Yes. With my own knife, start to finish.", { act: 'nod' }),
        line(H, '아, 그리고 그쪽도 직접 낚은 걸로 회 한 번 떠 보세요. 옆에서 같이 칼 잡는 사람이 있으면 덜 떨릴 것 같아서요.',
          "Oh, and you should cut sashimi once too, from something you caught yourself. I think I'll shake less with someone else holding a knife beside me."),
      ], {
        choices: [
          opt('why', '왜 아버지 밥상이에요? 무슨 날인가요?', "Why your dad's table? Is it a special day?", {
            say: ['왜 하필 아버지 밥상이에요? 무슨 날이라도 돼요?', "Why your father's table, of all things? Is it some special day?"],
            next: 'why' }),
          opt('winter', '꼭 겨울 방어여야 하나요?', 'Does it have to be a winter one?', {
            say: ['꼭 겨울 방어여야 하나요?', 'Does it really have to be a winter yellowtail?'],
            next: 'winter' }),
          opt('accept', '좋아요. 제일 좋은 놈으로 올릴게요', "All right. I'll land the best one I can", {
            say: ['좋아요. 제일 좋은 놈으로 올려 볼게요.', "All right. I'll land the best one I can."],
            next: 'accept' }),
        ],
        note: ['고해나 씨가 겨울 방어 한 마리를 낚아 달라고 했다. 그걸로 아버지 밥상을 차리고, 회는 처음부터 끝까지 자기 칼로 뜨겠다고 했다. 나도 직접 낚은 걸로 회를 한 번 떠 보라고 했다.',
          "Haena asked me to catch her one winter yellowtail. She'd set her father's table with it and cut the sashimi herself, start to finish. She asked me to cut sashimi once too, from my own catch."],
      }),
      why: scene([
        line(H, '무슨 날은 아니에요. 아빠가 제 요리학교를 반대하거든요.', "It's not a special day. Dad's against me going to cooking school."),
        line(P, '아…', "Ah..."),
        line(H, '말로는 못 이겨요. 아빠는 말을 안 하니까.', "I can't win with words. Dad doesn't talk."),
        act(H, 'laugh'),
        line(H, '그래서 칼로 말해 보려고요. 제가 뜬 회를 아빠가 어떻게 먹는지 보면, 대답이 나올 거예요.', "So I'll try saying it with a knife. When I see how Dad eats the sashimi I cut, I'll have my answer."),
        line(P, '(웃고 있는데, 눈은 진지했다.)', "(She was smiling, but her eyes were serious.)"),
      ], {
        choices: [
          opt('knife', '칼로 하는 말이라면, 방어부터 올릴게요', "If it's said with a knife, I'll bring the fish", {
            say: ['칼로 하는 말이라면, 그 말에 쓸 방어부터 올려 올게요.', "If it's going to be said with a knife, I'll bring the yellowtail to say it with."],
            end: endTalk({ accept: true, offer: 'ask_why' }),
            note: ['왜 아버지 밥상이냐고 물었다. 해나 씨는 아버지가 요리학교를 반대하는데 말로는 못 이기니, 칼로 말해 보겠다고 했다. 그 말에 쓸 방어를 올리기로 했다.',
              "I asked why her father's table. Haena said he opposes cooking school and she can't win with words, so she'll say it with a knife. I agreed to bring the fish for it."] }),
          opt('hesitate', '부녀 사이 일에 제가 끼어도 될까요?', "Should I really get between father and daughter?", {
            say: ['그런데… 부녀 사이 일에 제가 끼어도 되는지 모르겠어요.', "But... I'm not sure I should get between a father and his daughter."],
            next: 'hesitate' }),
        ],
        note: ['해나 씨는 웃으면서 말했지만 눈은 진지했다. 아버지는 말을 안 하는 사람이라 칼로 대답을 받아 내겠다고 했다.',
          "Haena smiled as she spoke, but her eyes were serious. Her father doesn't talk, so she means to draw an answer out of him with a knife."],
      }),
      hesitate: scene([
        line(H, '끼는 거 아니에요. 낚시만 해 주세요. 나머지는 제가 해요.', "You're not getting between anyone. Just do the fishing. I'll do the rest."),
        line(H, '아빠 배 타 봤잖아요. 아빠가 어떤 사람인지 조금은 알죠?', "You've been on Dad's boat. You know a little about what he's like, right?"),
        line(P, '말보다… 손을 보는 분 같았어요.', "He seemed like someone who... watches hands more than words."),
        line(H, '맞아요. 그러니까 방어 한 마리만요.', "Exactly. So just the one yellowtail."),
      ], {
        end: endTalk({ accept: true, offer: 'hesitate' }),
        note: ['부녀 사이 일에 끼어도 되겠느냐고 했더니, 해나 씨는 낚시만 해 주면 나머지는 자기가 한다고 했다. 아버지는 말보다 손을 보는 사람이라고.',
          "When I asked whether I should get between them, Haena said I only had to fish — she'd do the rest. Her father watches hands more than words."],
      }),
      winter: scene([
        line(H, '꼭이요. 겨울 방어는 기름이 올라서 누가 떠도 맛있어요.', "It has to be. Winter yellowtail is so fatty it's delicious whoever cuts it."),
        line(P, '그럼 오히려 쉬운 거 아니에요?', "Then isn't that easier?"),
        line(H, '그래서 더 어려워요. 맛있는 게 당연한 생선이면, 차이는 칼에서만 나요.', "That's what makes it harder. When a fish is delicious by default, the only difference is the knife."),
        line(H, '핑계 댈 데가 없죠. 그러니까 겨울 방어요. 꼭이요.', "There's nothing to hide behind. So — winter yellowtail. It has to be."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_winter' }),
        note: ['꼭 겨울 방어여야 하느냐고 물었다. 해나 씨는 기름이 올라 누가 떠도 맛있는 생선이라 차이가 칼에서만 나고, 핑계 댈 데가 없어서 겨울 방어여야 한다고 했다.',
          "I asked whether it had to be winter yellowtail. Haena said it's so rich that anyone's cut tastes good — the only difference is the knife, with nothing to hide behind. So it had to be winter."],
      }),
      accept: scene([
        line(H, '고마워요. 크기는 상관없어요. 싱싱한 게 먼저예요.', "Thank you. Size doesn't matter. Fresh comes first."),
        line(P, '잡으면 바로 가져올게요.', "I'll bring it straight over once I've got it."),
        line(H, '방어는 손질하지 말고 그대로 가져와 주세요. 아빠 앞에 놓을 거니까, 처음부터 끝까지 제 칼로 하고 싶어요.', "Bring the yellowtail as it is, without dressing it. It's going in front of Dad, so I want it to be my knife from start to finish."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['제일 좋은 놈으로 올리겠다고 했다. 해나 씨는 크기보다 싱싱한 게 먼저라며, 방어는 손대지 말고 그대로 가져와 달라고 했다.',
          "I said I'd land the best one I could. Haena said fresh mattered more than size, and asked me to bring the yellowtail untouched."],
      }),
    },
  },
  // N08-2 — 끝내는 자리(고해나)
  {
    id: 'n08_2_done', questId: 'N08-2', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '{player} 씨, 봤어요?', "{player}, did you see?"),
        line(P, '네? 뭘요?', "Sorry? See what?"),
        line(H, '아빠가 두 그릇 먹었어요.', "Dad had two bowls."),
        act(H, 'laugh'),
        line(P, '아무 말씀도 없으셨는데요.', "He didn't say a word, though."),
        line(H, '아무 말도 안 했죠. 그래도… 두 그릇이에요.', "Not a word. But... two bowls."),
        line(P, '회 뜨는 칼이 정말 정확하던데요.', "Your knife was really precise."),
        line(H, '아빠 배에서 혼자 익힌 거예요. 맞게 하는 건지는 모르겠지만요.', "I taught myself on Dad's boat. Whether I'm doing it right, I don't know."),
      ], {
        choices: [
          opt('lesson', '해나 씨 칼, 제가 배워야겠어요', "I should be learning from your knife", {
            say: ['해나 씨 칼, 제가 배워야 할 것 같아요.', "I think I should be learning from your knife."],
            next: 'lesson' }),
          opt('support', '학교 가세요. 고만석 씨도 두 그릇 드셨잖아요', "Go to school. Manseok had two bowls", {
            say: ['학교 가세요. 고만석 씨도 두 그릇 드셨잖아요.', "Go to that school. Manseok had two bowls, didn't he?"],
            next: 'support' }),
          opt('pay', '방어값은 받을게요', "I'll take the price of the fish", {
            say: ['방어값은 받겠습니다.', "I'll take the price of the yellowtail."],
            next: 'pay' }),
          opt('bowls', '값은 됐어요. 두 그릇이면 충분해요', "Keep it. Two bowls is plenty", {
            say: ['방어값은 됐어요. 두 그릇이면 충분합니다.', "Never mind the price. Two bowls is plenty."],
            end: endTalk({ complete: 'enough_bowls',
              lineKo: '…두 그릇이면 충분하다니, 그 말 좋네요.\n\n그럼 값 대신 고맙다는 말만 할게요. 오늘 방어가 제 첫 손님 상이었어요. 손님이 아빠였지만요.',
              lineEn: "...Two bowls is plenty — I like that.\n\nThen instead of money, just my thanks. Today's yellowtail was my first table for a guest. Even if the guest was Dad." }),
            note: ['방어값은 됐다고, 두 그릇이면 충분하다고 했다. 해나 씨는 그 말이 좋다며, 오늘 방어가 손님이 아버지였던 자기 첫 손님 상이었다고 했다.',
              "I said never mind the price — two bowls was plenty. Haena liked that, and said today's yellowtail was her first table for a guest, even if the guest was her father."] }),
        ],
        note: ['해나 씨가 아버지가 두 그릇을 먹었다고 알려 주었다. 아무 말도 없었지만 두 그릇이라고, 몇 번이나 되뇌었다.',
          "Haena told me her father had eaten two bowls. He hadn't said a word, but two bowls, she kept repeating."],
      }),
      lesson: scene([
        line(H, '제가요? 그럼 요리학교 안 가도 되는 건가요?', "Me? Does that mean I don't need cooking school?", { act: 'look_up' }),
        act(H, 'laugh'),
        line(H, '농담이에요. 방어는 뱃살부터 떠요. 기름이 칼에 붙으면 결이 뭉개지니까, 한 번 뜨고 한 번 닦아요.', "I'm kidding. With yellowtail you cut the belly first. Fat on the blade crushes the grain, so cut once, wipe once."),
        line(P, '한 번 뜨고, 한 번 닦고.', "Cut once, wipe once."),
        line(H, '아빠 배에서 혼자 익힌 거예요. 학교 가면 이게 맞는지 물어볼래요.', "I picked it up alone on Dad's boat. When I get to school, I'll ask if it's right."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['해나 씨 칼을 배우고 싶다고 했다. 방어는 뱃살부터, 한 번 뜨고 한 번 닦는다고 알려 주었다. 학교에 가면 그게 맞는지 물어보겠다고 했다.',
          "I said I wanted to learn her knife. She told me to cut yellowtail from the belly, cutting once and wiping once. She'd ask at school whether it was right."],
      }),
      support: scene([
        line(H, '…고마워요.', "...Thank you."),
        line(H, '그 말, 아빠 앞에서 해 줄래요? 아니, 제가 할게요.', "Would you say that in front of Dad? No — I'll say it."),
        line(G, '흠, 흠.', "Ahem.", { act: 'look_away' }),
        line(P, '(고만석 씨가 먼 데를 보며 헛기침을 했다. 듣고 계셨다.)', "(Manseok cleared his throat, looking off into the distance. He'd been listening.)"),
        line(H, '아빠 앞에서 그 말 하면, 아빠는 아무 말도 안 할 거예요. 그래도 두 그릇은 먹었잖아요.', "If I say it in front of him, Dad won't say anything. But he did eat two bowls."),
        line(H, '그게 아빠 대답이었으면 좋겠어요.', "I hope that was his answer."),
      ], {
        end: endTalk({ complete: 'support' }),
        note: ['학교에 가라고, 고만석 씨도 두 그릇을 먹지 않았느냐고 했다. 뒤에서 고만석 씨가 헛기침을 했다. 해나 씨는 그 두 그릇이 아버지의 대답이었으면 좋겠다고 했다.',
          "I told her to go to school — Manseok had eaten two bowls, after all. Behind us, Manseok cleared his throat. Haena said she hoped those two bowls were his answer."],
      }),
      pay: scene([
        line(H, '아, 네. 맞아요.', "Oh — yes. That's fair."),
        act(H, 'give', { to: P }),
        line(H, '미안한 건 금액 때문이에요. 겨울 방어 값이면 더 드려야 하는데, 지금은 용돈이 이게 다예요.', "I'm only sorry about the amount. A winter yellowtail's worth more, but this is all my allowance right now."),
        line(P, '…', '...', { act: 'receive' }),
        line(H, '그래도 받아 줘요. 제 첫 상에 올라간 재료값이니까요.', "Please take it anyway. It's the cost of what went on my first table."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['방어값을 받겠다고 했다. 해나 씨는 미안한 얼굴로 용돈을 꺼내며, 자기 첫 상에 올라간 재료값이니 받아 달라고 했다.',
          "I said I'd take the price of the fish. Haena took out her allowance with an apologetic face and asked me to accept it as the cost of her first table."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N08-3 「조타실의 딸」 — 받는 자리(고해나)
  // ═══════════════════════════════════════════
  {
    id: 'n08_3_offer', questId: 'N08-3', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '쉿, 잠깐만요. 아빠 없을 때 얘기하려고요.', "Shh, wait a moment. I wanted to talk while Dad's not around.", { act: 'look_away' }),
        line(P, '무슨 일인데요?', "What's going on?"),
        line(H, '저 조타 연습하려고요. 아빠 몰래요.', "I want to practise steering. Without Dad knowing."),
        line(P, '조타요? 고래마루 키를요?', "Steering? The Goraemaru's wheel?"),
        line(H, '네. 한 항차만 옆에 있어 줘요. 혼자는 좀 무서워서요.', "Yes. Just stay beside me for one trip. Alone, it's a bit scary."),
        line(P, '고만석 씨는 정말 모르세요?', "Does Manseok really not know?"),
        line(H, '아빠는… 알 거예요. 그래도요.', "Dad... probably knows. Still."),
        line(H, '방어 있는 자리에 제가 배를 세워 볼게요. 그쪽은 거기서 한 마리만 올려 주면 돼요.', "I'll try to stop the boat over the yellowtail. You just land one from there."),
      ], {
        choices: [
          opt('why', '요리학교 얘기하던 분이 조타 연습은 왜요?', "You wanted cooking school — why steering?", {
            say: ['요리학교 가겠다던 분이, 조타 연습은 왜 하세요?', "You were the one talking about cooking school. Why practise steering?"],
            next: 'why' }),
          opt('secret', '아실 거라면서, 왜 몰래 하세요?', "If he knows, why do it in secret?", {
            say: ['고만석 씨가 아실 거라면서, 왜 몰래 하세요?', "If you say Manseok knows anyway, why do it in secret?"],
            next: 'secret' }),
          opt('worry', '승객도 타는데, 연습해도 괜찮을까요?', "With passengers aboard — is practice safe?", {
            say: ['승객도 타는 배인데, 연습해도 괜찮을까요?', "Passengers ride that boat too. Is it all right to practise?"],
            next: 'worry' }),
        ],
        note: ['고해나 씨가 아버지 몰래 조타 연습을 하겠다며 한 항차만 옆에 있어 달라고 했다. 방어 있는 자리에 배를 세울 테니, 거기서 한 마리를 올려 달라고 했다.',
          "Haena said she wanted to practise steering behind her father's back, and asked me to stay beside her for one trip. She'd stop the boat over the yellowtail; I was to land one from there."],
      }),
      why: scene([
        line(H, '둘 다 하면 안 돼요?', "Can't I do both?"),
        act(H, 'laugh'),
        line(H, '칼도 키도 다 아빠 배에서 본 거예요.', "The knife and the wheel — I learned both by watching on Dad's boat."),
        line(P, '그건 그렇네요.', "That's true."),
        line(H, '그리고… 아빠가 키를 못 잡는 날이 언젠가 오잖아요. 그날 누가 잡아요.', "And... someday Dad won't be able to take the wheel. Who takes it then?", { act: 'look_sea' }),
        line(H, '요즘 그 생각이 자꾸 나요. 그러니까 한 항차만요.', "I keep thinking about that lately. So — just one trip."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_why' }),
        note: ['요리학교 얘기를 하던 사람이 왜 조타 연습을 하느냐고 물었다. 해나 씨는 칼도 키도 아버지 배에서 본 것이고, 아버지가 키를 못 잡는 날이 언젠가 온다는 생각이 자꾸 난다고 했다.',
          "I asked why someone set on cooking school was practising steering. Haena said she'd learned both knife and wheel on her father's boat, and she keeps thinking that one day he won't be able to take the wheel."],
      }),
      secret: scene([
        line(H, '알아도 모른 척하는 게 아빠 방식이에요.', "Knowing and pretending not to — that's Dad's way."),
        line(H, '대놓고 하면 아빠는 말려야 하잖아요. 선장이니까.', "If I did it openly, he'd have to stop me. He's the captain.", { act: 'look_away' }),
        line(P, '아…', "Ah..."),
        line(H, '몰래 하면 아빠는 안 본 걸로 할 수 있어요. 그게 아빠가 허락하는 방법이에요.', "If I do it in secret, he can pretend he didn't see. That's how Dad gives permission."),
        line(H, '이상하죠. 그래서 한 항차만 옆에 있어 줘요.', "Strange, isn't it. So stay beside me, just for one trip."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_secret' }),
        note: ['아실 거라면서 왜 몰래 하느냐고 물었다. 해나 씨는 대놓고 하면 선장인 아버지가 말려야 하니, 몰래 하면 안 본 걸로 할 수 있다고 했다. 그게 아버지가 허락하는 방법이라고.',
          "I asked why do it secretly if he knows. Haena said that if she did it openly, her father as captain would have to stop her; done in secret, he can act as if he never saw. That's how he says yes."],
      }),
      worry: scene([
        line(H, '그래서 옆에 있어 달라는 거예요. 혼자면 안 하죠.', "That's why I'm asking you to be there. I wouldn't do it alone."),
        line(H, '속도는 안 낼게요. 물 잔잔한 데서만 돌려요.', "I won't go fast. I'll only turn her in calm water."),
        line(P, '위험하면요?', "And if it gets dangerous?"),
        line(H, '바로 아빠 불러요. 아빠는 뱃머리에 있을 거예요. 등 돌리고요.', "I call Dad right away. He'll be at the bow. With his back turned."),
      ], {
        choices: [
          opt('vest', '조끼 입고, 옆에 붙어 있을게요', "I'll wear a life vest and stick by you", {
            say: ['알겠어요. 구명조끼 입고, 옆에 붙어 있을게요.', "All right. I'll wear a life vest and stay right by you."],
            end: endTalk({ accept: true, offer: 'worry' }),
            note: ['승객도 타는데 괜찮겠느냐고 물었다. 해나 씨는 혼자서는 안 할 거라며, 속도는 안 내고 잔잔한 데서만 돌리고 위험하면 바로 아버지를 부르겠다고 했다. 구명조끼를 입고 옆에 있기로 했다.',
              "I asked if it was safe with passengers aboard. Haena said she wouldn't do it alone, wouldn't go fast, would only turn in calm water and would call her father at once if needed. I agreed to wear a vest and stay by her."] }),
          opt('helm', '키는 해나 씨가 잡으세요. 저는 옆에 있을게요', "You take the wheel. I'll be beside you", {
            say: ['옆에 있겠습니다. 키는 해나 씨가 잡으세요.', "I'll be beside you. You take the wheel."],
            next: 'helm' }),
          opt('later', '오늘은 좀 더 생각해 볼게요', "Let me think it over a bit more", {
            say: ['오늘은… 좀 더 생각해 보고 올게요.', "Today... let me think it over and come back."],
            end: endTalk({ decline: true, lineKo: '네, 괜찮아요. 저도 아직 손이 좀 떨리거든요. 마음 정해지면 말해 줘요.', lineEn: "Sure, that's fine. My hands are still shaking a little anyway. Tell me when you've decided." }),
            note: ['조금 더 생각해 보겠다고 했다. 해나 씨는 자기도 아직 손이 떨린다며, 마음이 정해지면 말해 달라고 했다.', "I said I'd think it over. Haena said her hands were still shaking too, and to tell her when I'd decided."] }),
        ],
        note: ['해나 씨는 혼자서는 하지 않을 거라며, 위험하면 바로 뱃머리의 아버지를 부르겠다고 했다. 아버지는 등을 돌리고 있을 거라고.',
          "Haena said she wouldn't do it alone, and would call her father at the bow at once if anything went wrong. He'd be standing with his back to them, she said."],
      }),
      helm: scene([
        line(H, '…고마워요. 그 말 듣고 싶었어요.', "...Thank you. I wanted to hear that."),
        line(H, '키는 제가, 낚시는 그쪽이요. 제가 세운 자리에서 그쪽이 올리면, 그게 오늘 제 시험이에요.', "The wheel is mine, the fishing is yours. If you land one where I stop us, that's my test for today."),
        line(P, '그럼 저도 실수하면 안 되겠네요.', "Then I'd better not mess up either."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['키는 해나 씨가 잡으라고 했다. 해나 씨는 그 말을 듣고 싶었다며, 자기가 세운 자리에서 내가 방어를 올리면 그게 오늘 자기 시험이라고 했다.',
          "I told Haena the wheel was hers. She said she'd wanted to hear that — if I landed a yellowtail where she stopped the boat, that would be her test for the day."],
      }),
    },
  },
  // N08-3 — 끝내는 자리(고해나)
  {
    id: 'n08_3_done', questId: 'N08-3', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '곧게 갔죠?', "We went straight, didn't we?"),
        line(P, '네. 처음엔 좀 비틀거렸는데, 금방 곧아졌어요.', "Yes. She wobbled a bit at first, but straightened out fast."),
        line(H, '아빠가 봤을까요.', "Do you think Dad saw?", { act: 'look_sea' }),
        line(P, '뱃머리에서 등 돌리고 계셨어요.', "He had his back to us at the bow."),
        line(H, '…봤겠죠. 등이 웃었어요.', "...He saw. His back was smiling."),
        line(P, '그러고 보니 승객 한 분이 그 모습을 사진으로 찍던데요.', "Come to think of it, one of the passengers took a photo of it."),
        line(H, '진짜요? 저 키 잡은 거요?', "Really? Me at the wheel?", { act: 'look_up' }),
      ], {
        choices: [
          opt('lesson', '변침은 해나 씨가 저보다 나아요. 배우고 싶어요', "You turn her better than I do. Teach me", {
            say: ['해나 씨 변침, 저보다 낫던데요. 배우고 싶어요.', "Your turns were better than mine. I'd like to learn."],
            end: endTalk({ complete: 'lesson',
              lineKo: '진짜요? 그럼 저 선장 해도 되겠다.\n\n변침은 키보다 눈이 먼저예요. 뱃머리 앞에 점 하나 정해 두고, 그걸 보면서 돌려요. 키만 보면 배가 뱀처럼 가요. 아빠 등 보고 배운 거예요.',
              lineEn: "Really? Then maybe I could be a captain.\n\nWith a turn, your eyes go before the wheel. Pick a point ahead of the bow and turn while watching it. Watch only the wheel and the boat snakes along. I learned that watching Dad's back." }),
            note: ['해나 씨에게 변침을 배우고 싶다고 했다. 키보다 눈이 먼저라고, 뱃머리 앞에 점 하나를 정해 두고 돌리라고 했다. 아버지 등을 보며 배운 거라고 했다.',
              "I asked Haena to teach me her turns. Eyes before the wheel, she said — fix a point ahead of the bow and turn toward it. She learned it watching her father's back."] }),
          opt('photo', '그 사진, 고만석 씨께 보여 드릴게요', "I'll show Manseok that photo", {
            say: ['승객이 찍은 그 사진, 고만석 씨께 보여 드릴게요.', "That photo the passenger took — I'll show it to Manseok."],
            next: 'photo' }),
          opt('pay', '동승비는 받을게요', "I'll take a fee for riding along", {
            say: ['동승비는 받겠습니다.', "I'll take a fee for riding along."],
            end: endTalk({ complete: 'pay',
              lineKo: '아… 네. 옆에 있어 달라고 한 건 저니까 맞아요.\n\n부탁하면 값을 내는 거래요. 아빠가 늘 그렇게 말해요. 용돈이라 좀 가볍지만, 이게 제 첫 값이네요.',
              lineEn: "Ah... yes. I'm the one who asked you to be there, so that's fair.\n\nIf you ask a favour, you pay for it. Dad always says so. It's my allowance, so it's a bit light — but this is the first time I've paid for anything." }),
            note: ['동승비를 받겠다고 했다. 해나 씨는 부탁하면 값을 내는 거라는 아버지 말을 떠올리며, 용돈을 꺼내 첫 값을 치렀다.', "I said I'd take a fee for riding along. Remembering her father's saying that favours are paid for, Haena paid her first fee from her allowance."] }),
          opt('straight', '값은 됐어요. 곧게 간 배에 탔으면 됐죠', "No fee. I rode a boat that went straight", {
            say: ['동승비는 됐어요. 곧게 간 배에 탔으면 됐죠.', "Forget the fee. I rode a boat that went straight — that's enough."],
            end: endTalk({ complete: 'straight',
              lineKo: '…곧게 갔죠? 그 말 한 번 더 해 줘요.\n\n처음엔 배가 제 말을 안 들었어요. 힘을 빼니까 그제야 듣더라고요. 옆에 누가 있어서 힘을 뺄 수 있었어요.',
              lineEn: "...We did go straight, didn't we? Say it once more.\n\nAt first the boat wouldn't listen to me. Only when I loosened up did she listen. I could loosen up because someone was beside me." }),
            note: ['값은 됐다고, 곧게 간 배에 탔으면 됐다고 했다. 해나 씨는 아직 조금 떨리는 손을 펴 보며, 옆에 누가 있어서 힘을 뺄 수 있었다고 했다.', "I said no fee — riding a boat that went straight was enough. Haena opened her still-trembling hand and said she could loosen up because someone was beside her."] }),
        ],
        note: ['해나 씨의 조타로 한 항차를 돌았다. 배는 처음에 비틀거리다 곧아졌고, 해나 씨는 뱃머리에서 등을 돌린 아버지의 등이 웃었다고 했다.',
          "I rode one trip with Haena at the wheel. The boat wobbled, then ran straight; Haena said her father's back, turned to us at the bow, had been smiling."],
      }),
      photo: scene([
        line(H, '…안 돼요.', "...No."),
        act(H, 'silence'),
        line(H, '아니, 돼요. 보여 줘요.', "No — yes. Show him."),
        line(P, '아무 말씀 안 하시면요?', "What if he doesn't say anything?"),
        line(H, '싫으면 아빠는 바로 말해요. 말 안 하는 건… 좋다는 거예요.', "If Dad hates something he says so right away. Saying nothing means... he likes it."),
        line(H, '저 그거 스물네 해 걸려서 배웠어요.', "It took me twenty-four years to learn that."),
      ], {
        end: endTalk({ complete: 'photo' }),
        note: ['승객이 찍은 사진을 고만석 씨에게 보여 주겠다고 했다. 해나 씨는 싫다고 했다가 곧 보여 달라고 했다. 아버지가 아무 말도 하지 않으면 그게 좋다는 뜻이라고, 스물네 해 걸려 배웠다고 했다.',
          "I said I'd show Manseok the passenger's photo. Haena said no, then yes. If her father says nothing, it means he likes it — it took her twenty-four years to learn that."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N08-4 「배를 내놓을까 한다」 — 받는 자리(고만석)
  // ═══════════════════════════════════════════
  {
    id: 'n08_4_offer', questId: 'N08-4', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '…왔냐.', "...You're here.", { act: 'look_sea' }),
        line(P, '고만석 씨, 무슨 일 있으세요? 표정이 안 좋으신데요.', "Manseok, is something wrong? You don't look well."),
        act(G, 'silence'),
        line(G, '…배를 내놓을까 한다.', "...I'm thinking of selling the boat."),
        line(P, '네? 고래마루를요?', "What? The Goraemaru?"),
        line(G, '처음 하는 말이야. 아무한테도 안 했다.', "First time I've said it. I haven't told anyone."),
        line(P, '해나 씨는요?', "What about Haena?"),
        line(G, '해나는 몰라. …아니, 알 거야.', "Haena doesn't know. ...No. She knows.", { act: 'look_away' }),
        line(G, '와서 얘기 좀 들어. 울산 방어진 부두, 고래마루 앞으로.', "Come and hear me out. Bangeojin pier in Ulsan, in front of the Goraemaru."),
      ], {
        choices: [
          opt('listen', '가겠습니다. 끝까지 들을게요', "I'll come. I'll hear you out to the end", {
            say: ['가겠습니다. 끝까지 듣겠습니다.', "I'll come. I'll hear it all, to the end."],
            next: 'listen' }),
          opt('why', '왜 갑자기 그런 생각을 하셨어요?', "Why this, all of a sudden?", {
            say: ['왜 갑자기 그런 생각을 하셨어요?', "Why are you thinking that, all of a sudden?"],
            next: 'why' }),
          opt('haena', '해나 씨가 정말 모를까요?', "Does Haena really not know?", {
            say: ['해나 씨가… 정말 모를까요?', "Does Haena... really not know?"],
            next: 'haena' }),
        ],
        note: ['고만석 씨가 고래마루를 내놓을까 한다고 했다. 처음 하는 말이라고, 해나 씨는 모른다고 했다가 곧 알 거라고 고쳐 말했다. 방어진 부두로 와서 이야기를 들어 달라고 했다.',
          "Manseok said he was thinking of selling the Goraemaru. It was the first time he'd said it; Haena didn't know, he said, then corrected himself — she did. He asked me to come to Bangeojin pier and hear him out."],
      }),
      listen: scene([
        line(G, '…끝까지 들을 만큼 긴 얘기는 아니다. 배를 내놓을까 한다. 그게 다야.', "...It's not long enough to need hearing out. I'm thinking of selling the boat. That's all."),
        line(P, '(말해 놓고 주머니만 뒤지신다. 찾는 게 없는 것 같다.)', "(Having said it, he just rummages in his pockets. There's nothing there he's looking for.)"),
        line(G, '그래도 와. 혼자 하면 혼잣말이고, 들은 사람이 있으면 말이 된다.', "Come anyway. Said alone, it's muttering. With someone hearing it, it becomes words."),
        line(G, '바다 나가서 하자. 물이 좋을 것 같다.', "We'll talk out at sea. The water looks good."),
      ], {
        end: endTalk({ accept: true, offer: 'listen' }),
        note: ['끝까지 듣겠다고 했다. 고만석 씨는 긴 얘기도 아니라면서 주머니만 뒤졌다. 혼자 하면 혼잣말이고 들은 사람이 있어야 말이 된다며, 바다에 나가서 하자고 했다.',
          "I said I'd hear him out. Manseok said it wasn't a long story and rummaged in his pockets. Said alone it's muttering; with a listener it becomes words. We'd talk out at sea."],
      }),
      why: scene([
        line(G, '갑자기 아니다. 오래 했다. 말을 안 했을 뿐이지.', "It isn't sudden. I've done this a long time. I just never said anything."),
        line(P, '…', '...'),
        line(G, '이유는 와서 들어. 여기서 말하면 반만 말하게 된다. 배 위에서 말해야 다 나와.', "Hear the reasons when you come. Say it here and I'll only say half. On the boat it all comes out."),
      ], {
        choices: [
          opt('come', '배 위에서 듣겠습니다', "I'll hear it on the boat", {
            say: ['알겠습니다. 배 위에서 듣겠습니다.', "All right. I'll hear it on the boat."],
            end: endTalk({ accept: true, offer: 'ask_why' }),
            note: ['왜 갑자기 그런 생각을 했느냐고 물었다. 고만석 씨는 갑자기가 아니라 오래 해 온 생각이라며, 여기서는 반만 말하게 되니 배 위에서 듣자고 했다.',
              "I asked why so suddenly. Manseok said it wasn't sudden — he'd thought about it a long time — and that here he'd only say half; I'd hear it on the boat."] }),
          opt('oppose', '고래마루를 파신다니, 저는 반대예요', "Selling the Goraemaru? I'm against it", {
            say: ['그래도… 고래마루를 파신다니, 저는 반대예요.', "Even so... selling the Goraemaru? I'm against it."],
            next: 'oppose' }),
        ],
        note: ['고만석 씨는 갑자기 한 생각이 아니라고 했다. 손바닥을 펴 보는데, 굳은살이 두꺼웠다.',
          "Manseok said it wasn't a sudden thought. He opened his palm; the calluses were thick."],
      }),
      oppose: scene([
        line(G, '반대?', "Against it?", { act: 'look_up' }),
        line(G, '반대하는 녀석이 하나 있으니 좋네. 아직 정한 거 없다.', "Good to have one person against it. Nothing's decided yet."),
        line(P, '그럼…', "Then..."),
        line(G, '반대든 찬성이든 다 듣고 나서 해. 그게 순서다. 오늘 와서 들어. 반대는 그다음에 해.', "For or against, say it after you've heard it all. That's the order of things. Come and listen today. Be against it after."),
      ], {
        end: endTalk({ accept: true, offer: 'oppose' }),
        note: ['고래마루를 판다니 반대라고 했다. 고만석 씨의 험상궂은 눈이 조금 풀렸다. 아직 정한 건 없으니, 반대는 다 듣고 나서 하라고 했다.',
          "I said I was against selling the Goraemaru. Manseok's fierce eyes softened a little. Nothing was decided, he said; I could be against it after I'd heard everything."],
      }),
      haena: scene([
        line(G, '…알 거다. 그 애는 내 등만 봐도 안다.', "...She knows. That girl can tell just from my back.", { act: 'look_away' }),
        line(P, '그런데 왜 아직 말씀을…', "Then why haven't you told..."),
        line(G, '아는 사람한테 하는 말이 제일 어렵다.', "The hardest thing is saying it to someone who already knows."),
        line(G, '일단 너한테 먼저 해 보는 거다. 와.', "So I'm trying it on you first. Come."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_haena' }),
        note: ['해나 씨가 정말 모르겠느냐고 물었다. 고만석 씨는 그 애는 자기 등만 봐도 안다며, 아는 사람한테 하는 말이 제일 어려워서 나한테 먼저 해 보는 거라고 했다.',
          "I asked if Haena really didn't know. Manseok said she could tell from his back alone — the hardest thing is telling someone who already knows, so he was trying it on me first."],
      }),
    },
  },
  // N08-4 — 끝내는 자리(고만석)
  {
    id: 'n08_4_done', questId: 'N08-4', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '…들었지.', "...You heard it."),
        line(P, '네. 끝까지 들었어요.', "Yes. All of it."),
        line(G, '결정은 아직이야. 그래도 말했으니 반은 한 거다.', "Nothing's decided. But I said it, so that's half done."),
        line(P, '오늘 조황은 올해 최고였는데요.', "And today's catch was the best of the year."),
        line(G, '그래서 우습지. 이런 날 그 말을 했으니.', "That's what's funny. Saying it on a day like this.", { act: 'look_sea' }),
        line(P, '(고만석 씨는 고기보다 배를 오래 보고 있었다.)', "(Manseok was looking at the boat far longer than at the fish.)"),
      ], {
        choices: [
          opt('haena', '해나 씨한테 먼저 말씀하셔야 해요', "You need to tell Haena first", {
            say: ['해나 씨한테 먼저 말씀하셔야 합니다.', "You need to tell Haena first."],
            next: 'haena' }),
          opt('lesson', '팔기 전에, 배를 보는 눈을 배우고 싶어요', "Before you sell, teach me to read a boat", {
            say: ['고만석 씨가 배를 보는 눈, 그걸 배우고 싶습니다. 팔기 전에요.', "The way you read a boat — I'd like to learn that. Before you sell."],
            end: endTalk({ complete: 'lesson',
              lineKo: '…배는 눈으로 보는 게 아니야. 발로 봐.\n\n갑판에 서서 무릎을 풀어. 배가 어디로 기우는지 발바닥이 먼저 안다. 눈은 늦어. 이 배는 왼쪽으로 조금 기운다. 그것까지 알면 다 본 거다.',
              lineEn: "...You don't read a boat with your eyes. You read it with your feet.\n\nStand on the deck and loosen your knees. The soles of your feet know where she leans before anything else. Eyes are too slow. This boat leans a little to port. Know that and you've seen it all." }),
            note: ['팔기 전에 배를 보는 눈을 배우고 싶다고 했다. 고만석 씨는 배는 발로 보는 거라며, 무릎을 풀면 발바닥이 먼저 안다고 했다. 고래마루는 왼쪽으로 조금 기운다고.',
              "I said I wanted to learn how he reads a boat before he sells it. Manseok said you read a boat with your feet — loosen your knees and your soles know first. The Goraemaru leans a little to port."] }),
          opt('pay', '오늘 조황 몫은 받을게요', "I'll take my share of today's catch", {
            say: ['오늘 조황 몫은 받겠습니다.', "I'll take my share of today's catch."],
            next: 'pay' }),
          opt('boat', '오늘 몫은 배에 둘게요. 이 배를 위해 쓰세요', "Leave my share with the boat. Spend it on her", {
            say: ['오늘 몫은 배에 두겠습니다. 이 배를 위해 쓰세요.', "Leave my share with the boat. Use it for her."],
            next: 'boat' }),
        ],
        note: ['방어진 바다에서 고만석 씨의 이야기를 들었다. 결정은 아직이지만 말했으니 반은 한 거라고 했다. 그날 조황은 그해 최고였는데, 고만석 씨는 고기보다 배를 오래 보았다.',
          "Out on the water at Bangeojin, I heard Manseok out. Nothing was decided, but saying it was half the work, he said. The catch was the best of the year, yet he looked at the boat far longer than at the fish."],
      }),
      haena: scene([
        line(G, '…알아.', "...I know."),
        line(G, '네가 있으면 말이 나올 것 같아서 불렀다. 오늘 저녁, 조타실에 셋이 앉자.', "I called you because I thought the words might come with you there. This evening, the three of us sit in the wheelhouse."),
        line(P, '해나 씨는 뭐라고 할까요?', "What do you think Haena will say?"),
        line(G, '아무 말도 안 하겠지. 대신 내 컵에 물이나 채우겠지.', "Nothing, probably. She'll just keep filling my cup with water."),
        line(G, '그 애 대답은 늘 그런 식이다. 나를 닮아서.', "That's always how she answers. She takes after me."),
      ], {
        end: endTalk({ complete: 'haena' }),
        note: ['해나 씨한테 먼저 말해야 한다고 했다. 고만석 씨는 알고 있다며, 내가 있으면 말이 나올 것 같아 불렀다고 했다. 그날 저녁 셋이 조타실에 앉기로 했다.',
          "I said he had to tell Haena first. Manseok said he knew, and that he'd called me because the words might come with me there. The three of us would sit in the wheelhouse that evening."],
      }),
      pay: scene([
        line(G, '그래. 그 해 최고 조황이니 몫도 크다.', "Right. Best catch of the year, so the share is big too."),
        act(G, 'give', { to: P }),
        line(P, '(봉투가 두껍다.)', "(The envelope is thick.)", { act: 'receive' }),
        line(G, '…이런 날 배를 내놓는다는 말을 했으니 우습지. 바다가 붙잡는 건지 놓아주는 건지 모르겠다.', "...Funny, saying I'd sell the boat on a day like this. I can't tell if the sea is holding on to me or letting me go."),
        line(G, '받아. 좋은 날 몫은 좋은 날 받는 거다.', "Take it. A good day's share is taken on a good day."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['오늘 조황 몫을 받겠다고 했다. 봉투가 두꺼웠다. 고만석 씨는 바다가 자기를 붙잡는 건지 놓아주는 건지 모르겠다며, 좋은 날 몫은 좋은 날 받는 거라고 했다.',
          "I said I'd take my share of the catch. The envelope was thick. Manseok said he couldn't tell whether the sea was holding on to him or letting go — a good day's share is taken on a good day."],
      }),
      boat: scene([
        line(G, '…배에 둔다라.', "...Leave it with the boat, huh."),
        act(G, 'silence'),
        line(G, '이 배한테 뭘 두고 가는 녀석은 오랜만이다.', "It's been a long time since anyone left something for this boat."),
        line(G, '기름값으로는 안 쓴다. 갑판 판자 하나 갈 때 쓰지. 그럼 네가 밟고 간 자리가 남는다.', "I won't spend it on fuel. I'll use it when I replace a deck plank. Then the spot you stood on stays."),
      ], {
        end: endTalk({ complete: 'leave_for_boat' }),
        note: ['오늘 몫은 배를 위해 쓰라고 두고 왔다. 고만석 씨는 한참 말이 없다가, 그 돈은 갑판 판자 하나를 갈 때 쓰겠다고 했다. 내가 밟고 간 자리가 남도록.',
          "I left my share for the boat. Manseok was silent a long while, then said he'd use it to replace a deck plank — so the place I stood would remain."],
      }),
    },
  },
];
