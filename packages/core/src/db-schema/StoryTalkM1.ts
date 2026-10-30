/**
 * @file StoryTalkM1.ts
 * @description 290차 — 제1부 「실습」(M1-02 ~ M1-11) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 시범(문체 기준) = `StoryTalkN01.ts`.
 *   M1-01 「막차」는 의뢰인이 없는 혼잣말 편이라 쓰지 않는다.
 *
 * 왜(사용자 지시 원문 요지): 「너가 지금 해놓은 문맥은 혼자서 대답을 다해버리고 … 정보를 한번에 전달하는 형태야.
 *  그건 잘못된 대화 방법이야」 — 의뢰인이 한 덩어리로 쏟던 사정 · 할 일 · 이유를, 주인공이 묻고 되묻는 사이에 조금씩 나오게 했다.
 *  「호칭은 'OOO씨'로 통일」 — 주인공은 인물을 「정옥선 씨」 · 「도현수 씨」로 부르고(영어는 이름만), 인물은 주인공을 너 · {player} 씨로 부른다.
 *
 * 인물 말투
 *  - 정옥선(71 · 만복상회 좌판) — 무뚝뚝한 반말 · 짧게 끊는다(「들어.」 「가.」) · 꾸짖는 듯 챙긴다 · 나를 「너」.
 *  - 도현수(24 · 어촌계장 손자 · 라이벌) — 퉁명스러운 반말 · 「~야」 「~해」 · 인정은 늦게 한마디만. 주인공은 해요체로 맞받는다.
 *  - 탁만수(78 · 죽간 공방) — 노인의 짧은 반말 · 「~다」 「~해라」 · 손으로 배우라는 말을 되풀이한다.
 *  - 동명항 어촌계(사무실 · 계장) — 규칙으로 말한다 · 이름 대신 「실습생」 · 총회에서 처음 이름을 부른다. 주인공은 부르는 말 없이 합니다체.
 *
 * 남기는 표시: 새로 만든 표시는 없다 — 끝마다 옛 받는 답(`end.offer`) · 보상 답(`end.complete`)에 묶여 그 답의 표시 · 결과가 그대로 붙는다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const O = 'okseon';
const HS = 'hyeonsu';
const T = 'tak_mansu';
const C = 'coop';
const P = 'player';

export const TALKS_M1: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // M1-02 「얼음 나르기」 — 받는 자리(정옥선)
  // ═══════════════════════════════════════════
  {
    id: 'm1_02_offer', questId: 'M1-02', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '아까부터 거기 서 있더라. 내 좌판 앞에서 한참.', "You've been standing there a while. In front of my stall.", { act: 'look_up' }),
        line(P, '아… 죄송해요. 장사하시는 데 방해가 됐나요?', 'Oh... sorry. Am I getting in the way of your trade?'),
        line(O, '방해는 무슨. 사람 하나 서 있다고 안 될 장사면 진작 접었다.', "In the way? If one person standing there could ruin my trade, I'd have shut up shop long ago."),
        line(O, '사진 속 기억을 찾으러 왔구나.', "You've come looking for a memory from a photograph."),
        line(P, '…예전에 부모님이랑 이 시장에 온 적이 있어요. 많이 바뀌었네요.', "...I came to this market once with my parents. It's changed a lot."),
        line(O, '항구는 바뀐다. 사람도 바뀌고.', 'Harbours change. So do people.', { act: 'look_sea' }),
        line(P, '(…눈물이 날 것만 같다.)', '(...I feel like I might cry.)'),
        line(O, '울고 싶으면 울어도 된다. 여기선 아무도 안 쳐다본다.', "If you want to cry, cry. Nobody here will stare."),
        line(O, '다만 그 전에 하나만 해 주겠니? 좌판 뒤에 얼음 상자가 하나 있다. 그걸 경매장까지 옮겨야 해.', "But before that, will you do one thing for me? There's an ice box behind the stall. It needs to go to the auction house."),
        line(P, '제가요?', 'Me?'),
        line(O, '네가 할 수 있는 일부터 같이 해 보자.', "Let's start with what you can do."),
      ], {
        choices: [
          opt('carry', '…네. 손이라도 움직여 볼게요', "...All right. I'll keep my hands busy", {
            say: ['…네. 손이라도 움직이면 좀 나을 것 같아요.', "...All right. I think I'd feel better with something to do."],
            next: 'carry' }),
          opt('photo', '사진 얘기는 안 했는데, 어떻게 아셨어요?', "I never mentioned a photo. How did you know?", {
            say: ['사진 얘기는 안 했는데… 어떻게 아셨어요?', "I never said anything about a photo... how did you know?"],
            next: 'photo' }),
          opt('stranger', '처음 보는 사람한테 맡기셔도 돼요?', "You'd trust a stranger with it?", {
            say: ['처음 보는 사람한테 일을 맡기셔도 돼요?', "Are you sure you want to hand a job to someone you've never met?"],
            next: 'stranger' }),
        ],
        note: ['동명항 좌판 앞에서 한참 서 있었더니, 정옥선 씨가 사진 속 기억을 찾으러 왔느냐고 먼저 물었다. 울고 싶으면 울어도 된다면서, 그 전에 좌판 뒤 얼음 상자를 경매장까지 옮겨 달라고 했다.',
          "I'd been standing in front of a stall at Dongmyeong Harbour for a while when Jeong Okseon asked if I'd come looking for a memory from a photograph. She said I could cry if I wanted, but first she asked me to carry the ice box behind her stall to the auction house."],
      }),
      carry: scene([
        line(O, '그래. 손이 바쁘면 눈물이 덜 난다.', 'Good. Busy hands shed fewer tears.'),
        line(O, '경매장 하역대 옆에 표시해 둔 자리가 있다. 거기 내려놓고 와.', "There's a marked spot beside the unloading dock at the auction house. Set it down there and come back."),
        line(P, '하역대 옆, 표시해 둔 자리요. 알겠어요.', 'Beside the dock, on the mark. Got it.'),
        line(O, '바닥 젖었으니 뛰지 말고. 울 거면 얼음부터 나르고 울어.', "The ground's wet, so don't run. If you're going to cry, carry the ice first and cry after."),
      ], {
        choices: [
          opt('go', '얼음부터 나르고 올게요', "I'll carry the ice first", {
            end: endTalk({ accept: true, offer: 'carry_now' }),
            note: ['얼음부터 나르고 오겠다고 했다. 상자를 들자 손이 시려서, 정말로 눈물 생각이 조금 덜 났다.', "I said I'd carry the ice first. The box was so cold in my hands that I really did think less about crying."] }),
          opt('joke', '울면서 나르면 얼음이 더 빨리 녹지 않을까요?', "Wouldn't crying while I carry it melt it faster?", {
            next: 'joke' }),
        ],
        note: ['정옥선 씨는 상자를 경매장 하역대 옆 표시해 둔 자리에 내려놓고 오라고 했다. 바닥이 젖었으니 뛰지 말라고, 울 거면 얼음부터 나르고 울라고 했다.',
          "Okseon told me to set the box down on the marked spot beside the auction house's unloading dock. The ground was wet, so no running — and if I was going to cry, I was to carry the ice first."],
      }),
      joke: scene([
        act(O, 'laugh'),
        line(O, '농담할 기운이 있으면 다리도 성하겠다.', "If you've the strength for jokes, your legs must be fine too."),
        line(O, '얼음은 울어도 녹고 꾸물대도 녹는다. 그러니까 빨리 갔다 와.', 'Ice melts whether you cry or dawdle. So be quick about it.'),
        line(O, '울 거면 갔다 와서 울어. 그땐 내가 못 본 척해 주마.', "Cry when you get back. I'll pretend not to see."),
        line(P, '…네. 금방 다녀올게요.', "...Right. I'll be back soon."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_melt' }),
        note: ['울면서 나르면 얼음이 더 빨리 녹지 않겠느냐고 농담을 했다. 정옥선 씨는 코웃음을 치고는, 갔다 와서 울면 못 본 척해 주겠다고 했다.',
          "I joked that crying would only melt the ice faster. Okseon snorted, then said if I cried after I got back, she would pretend not to see."],
      }),
      photo: scene([
        act(O, 'silence'),
        line(P, '(…주머니 밖으로 사진 모서리가 삐져나와 있었다.)', '(...The corner of the photo was sticking out of my pocket.)'),
        line(O, '주머니를 그렇게 자꾸 만지면서 두리번거리면 누구라도 안다.', "Keep fiddling with your pocket and looking around like that, and anyone would know."),
        line(O, '이 항구에 옛날 찾으러 오는 사람이 너 하나인 줄 아냐.', "You think you're the only one who comes to this harbour looking for the old days?"),
        line(P, '…그렇겠네요.', "...I suppose not."),
        line(O, '얼음 녹는다. 경매장 하역대 옆, 표시해 둔 자리다. 가.', "The ice is melting. Beside the dock at the auction house, on the mark. Go."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_photo' }),
        note: ['사진 얘기는 꺼내지도 않았는데 어떻게 알았느냐고 물었다. 주머니 밖으로 사진 모서리가 보였고, 이 항구엔 옛날을 찾으러 오는 사람이 나 말고도 많다고 했다.',
          "I asked how she knew about the photo when I'd never mentioned it. Its corner was poking out of my pocket — and I wasn't the only one who came to this harbour looking for the past."],
      }),
      stranger: scene([
        line(O, '처음 보니까 맡기는 거다. 아는 놈들은 핑계부터 대.', "I'm asking because I've never seen you. The ones I know start with excuses."),
        line(P, '그래도 제가 상자를 들고 가 버리면요?', 'But what if I just walked off with the box?'),
        line(O, '상자 하나다. 들고 달아나 봐야 남는 건 얼음물이야.', "It's one box. Run off with it and all you'll have is meltwater."),
        line(O, '그리고 달아날 사람이었으면 그 얼굴로 여기까지 안 왔다.', "Besides, someone who runs off wouldn't have come all this way with that face."),
        line(O, '경매장 하역대 옆에 표시해 둔 자리가 있다. 들어.', "There's a marked spot beside the dock at the auction house. Lift it."),
      ], {
        end: endTalk({ accept: true, offer: 'stranger' }),
        note: ['처음 보는 사람에게 맡겨도 되느냐고 물었더니, 처음 보니까 맡기는 거라고 했다. 달아날 사람이었으면 그 얼굴로 여기까지 오지 않았을 거라고.',
          "When I asked if she'd really trust a stranger, she said that was exactly why. Someone who meant to run off wouldn't have come all this way with a face like mine."],
      }),
    },
  },

  // M1-02 — 끝내는 자리(정옥선)
  {
    id: 'm1_02_done', questId: 'M1-02', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '다녀왔어요. 경매장 하역대 옆, 표시해 둔 자리에 내려놓았어요.', "I'm back. I set it down beside the auction house dock, right on the mark."),
        line(O, '봤다. 여기서 다 보여.', 'I saw. You can see everything from here.', { act: 'look_up' }),
        line(P, '바닥이 미끄러워서 천천히 걸었어요.', 'The ground was slippery, so I walked slowly.'),
        line(O, '그래야지. 상자 든 놈이 제일 많이 넘어지는 데가 거기다.', "That's right. That's the spot where people carrying boxes fall the most."),
        act(O, 'give', { to: P }),
        line(O, '품삯이다. 적어도 이건 네 돈이야.', "Your pay. This much, at least, is your own money."),
        line(P, '…제 돈이요.', '...My money.', { act: 'receive' }),
        line(O, '시장 안쪽 상점은 얼음이랑 미끼를 판다. 값은 매일 바뀌니까 눈으로 익혀 둬.', "The shop further inside the market sells ice and bait. The prices change every day, so learn them by eye."),
      ], {
        choices: [
          opt('keep', '받을게요. 이걸로 시작할게요', "I'll take it. This is where I start", {
            say: ['받겠습니다. 이걸로 시작하겠습니다.', "I'll take it. This is where I start."],
            end: endTalk({ complete: 'keep',
              lineKo: '그래야지. 네 돈이다, 아껴 써. 첫 돈은 얼음값, 미끼값, 밥값으로 금방 나간다. 그래도 한 장은 접어서 따로 둬라. 바다 일은 공치는 날이 더 많다.',
              lineEn: "Good. It's your money, so spend it carefully. First money goes fast — ice, bait, food. Still, fold one note away by itself. In sea work, empty days outnumber the good ones." }),
            note: ['품삯을 받았다. 정옥선 씨는 첫 돈은 금방 나가니 한 장은 접어서 따로 두라고 했다. 바다 일은 공치는 날이 더 많다고.', "I took the pay. Okseon said first money goes fast, so I should fold one note away by itself. Empty days outnumber the good ones at sea."] }),
          opt('give_back', '얼음값은 빼 주세요. 반은 두고 갈게요', "Take out for the ice. I'll leave half here", {
            say: ['얼음값은 빼 주세요. 반은 좌판에 두고 가겠습니다.', "Take out for the ice, please. I'll leave half of it here at the stall."],
            next: 'give_back' }),
          opt('ask_more', '내일도 써 주실 수 있어요?', 'Would you use me again tomorrow?', {
            say: ['내일도 저를 써 주실 수 있어요?', 'Would you give me work again tomorrow?'],
            end: endTalk({ complete: 'ask_more',
              lineKo: '쓸 만하면. 손이 얼어서 상자 떨어뜨리는 놈은 안 쓴다. (동전 몇 개를 더 얹어 준다.) 내일 몫 얼음값이다. 배 들어오는 새벽에 얼음이 제일 많이 나가니 그때 와. 장갑은 네 걸로 챙기고.',
              lineEn: "If you're any use. I don't hire anyone whose hands freeze and drop the box. (She adds a few coins.) That's for tomorrow's ice. Most of it goes out at dawn when the boats come in, so come then. And bring your own gloves." }),
            note: ['내일도 써 줄 수 있느냐고 물었다. 정옥선 씨는 쓸 만하면 쓴다며, 배 들어오는 새벽에 장갑을 챙겨 오라고 했다.', "I asked if she would use me again tomorrow. Okseon said she would if I was any use — come at dawn when the boats come in, and bring my own gloves."] }),
          opt('held_tears', '나르는 동안은 안 울었어요', "I didn't cry while I carried it", {
            say: ['나르는 동안은 안 울었어요.', "I didn't cry while I was carrying it."],
            next: 'tears' }),
        ],
        note: ['얼음 상자를 내려놓고 왔다고 하자, 정옥선 씨는 여기서 다 보였다며 품삯 봉투를 건넸다. 시장 안쪽 상점이 얼음과 미끼를 파니 값을 눈으로 익혀 두라고 했다.',
          "When I told her I'd set the ice box down, Okseon said she'd seen it all from the stall and handed me an envelope of pay. She told me the shop inside the market sells ice and bait, and to learn the prices by eye."],
      }),
      give_back: scene([
        act(O, 'silence'),
        line(O, '…쓸데없는 소리.', '...Nonsense.'),
        line(P, '그래도요. 처음 받은 돈이라서, 처음 일 주신 데 두고 가고 싶어요.', "Still. It's the first money I've earned, so I'd like to leave some with the person who gave me the work."),
      ], {
        end: endTalk({ complete: 'give_back',
          lineKo: '(봉투에서 지폐를 빼 좌판 서랍에 넣는다.) …그래, 놓고 가라. 그 마음은 기억하겠다.',
          lineEn: "(She takes some notes out of the envelope and puts them in the stall drawer.) ...All right, leave it. I'll remember the thought." }),
        note: ['얼음값을 빼고 반은 좌판에 두고 가겠다고 했다. 정옥선 씨는 쓸데없는 소리라면서도 지폐를 서랍에 넣고, 그 마음은 기억하겠다고 했다.', "I said she should take out for the ice and keep half at the stall. Okseon called it nonsense, but she put the notes in her drawer and said she'd remember the thought."],
      }),
      tears: scene([
        line(O, '…그래. 잘 참았다.', '...I see. You held it in well.', { act: 'nod' }),
        line(O, '(좌판 의자를 하나 끌어다 놓는다.) 이제 일 끝났으니 울어도 된다. 아무도 안 본다.', "(She drags a stall stool over.) The work's done, so you can cry now. Nobody's looking."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'held_tears',
          lineKo: '울고 나면 밥부터 먹어. 빈속에 울면 몸만 축난다.',
          lineEn: "When you're done crying, eat something first. Crying on an empty stomach only wears you down." }),
        note: ['나르는 동안은 울지 않았다고 했다. 정옥선 씨는 잘 참았다며 의자를 끌어다 주고, 이제 울어도 된다고 했다. 울고 나면 밥부터 먹으라고.', "I told her I hadn't cried while carrying it. Okseon said I'd held it in well, pulled over a stool and said I could cry now. And to eat something afterwards."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-03 「열쇠 두 개」 — 받는 자리(정옥선)
  // ═══════════════════════════════════════════
  {
    id: 'm1_03_offer', questId: 'M1-03', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '잘 데는 있냐.', 'Got somewhere to sleep?', { act: 'look_up' }),
        line(P, '…아직 못 정했어요. 막차 타고 와서, 오늘 밤은 어디든 찾아보려고요.', "...Not yet. I came in on the last bus. I was going to find somewhere for tonight."),
        line(O, '그럴 줄 알았다.', 'I thought as much.'),
        line(O, '이거 받아라. 좌판 뒤 숙소 열쇠다. 옛날 어촌계 숙소인데 몇 해 비워 둬서 먼지가 많아.', "Take this. It's the key to the lodging behind the stall. It's the old co-op dormitory, but it's been empty for years, so it's dusty."),
        line(P, '제가 써도 돼요?', 'I can use it?'),
        line(O, '쓰라고 주는 거다. 먼지는 네가 털어.', "That's why I'm giving it to you. You do the dusting."),
        line(O, '그리고 이건 실습생 증이다.', 'And this is a trainee card.'),
        line(P, '실습생이요?', 'Trainee?'),
        line(O, '이 항구에서 바다 일 하려면 계원이 돼야 한다. 우리 계는 육 개월 실습이야. 딴 데는 삼 년도 받아.', "To work the sea from this harbour, you have to become a member of the co-op. Ours takes six months of training. Other places make you wait three years."),
        line(P, '육 개월이면… 백팔십 일이네요.', 'Six months... that makes a hundred and eighty days.'),
        line(O, '그래. 일부터 배워.', 'That it does. Start by learning the work.'),
      ], {
        choices: [
          opt('grateful', '잘 곳이 생긴 것만으로 충분해요', 'Having somewhere to sleep is enough', {
            say: ['잘 곳이 생긴 것만으로 충분해요. 먼지는 제가 털게요.', "Having somewhere to sleep is more than enough. I'll do the dusting."],
            next: 'grateful' }),
          opt('term', '딴 데는 삼 년이라니요? 여긴 왜 육 개월이에요?', "Three years elsewhere? Why only six months here?", {
            next: 'term' }),
          opt('fail', '백팔십 일 안에 못 하면 어떻게 돼요?', "What happens if I can't make it in time?", {
            say: ['백팔십 일 안에 못 하면 어떻게 돼요?', "What happens if I can't do it within a hundred and eighty days?"],
            next: 'fail' }),
        ],
        note: ['잘 데가 없다고 하자, 정옥선 씨가 좌판 뒤 옛 어촌계 숙소 열쇠와 실습생 증을 내밀었다. 이 계는 육 개월, 백팔십 일 실습을 보고 계원으로 받는다고 했다.',
          "When I admitted I had nowhere to sleep, Jeong Okseon held out the key to the old co-op lodging behind her stall, and a trainee card. This co-op watches you train for six months — a hundred and eighty days — before taking you on as a member."],
      }),
      grateful: scene([
        line(O, '충분하다는 말은 아껴 둬. 아직 아무것도 안 했다.', "Save the word enough. You haven't done anything yet."),
        line(O, '(열쇠를 내 손바닥에 놓고 꾹 쥐여 준다.) 오늘은 창 열고 털고, 일찍 누워. 첫날 밤은 원래 길다.', "(She presses the key into my palm and closes my fingers over it.) Tonight, open the window, dust, and lie down early. The first night is always long."),
        line(P, '네. 내일 아침엔요?', 'All right. And tomorrow morning?'),
        line(O, '내일 아침엔 얼음이 기다린다.', 'Tomorrow morning, the ice is waiting.'),
      ], {
        choices: [
          opt('go', '알겠어요. 들어가 볼게요', "All right. I'll go in", {
            end: endTalk({ accept: true, offer: 'grateful' }),
            note: ['열쇠를 받아 쥐었다. 오늘은 먼지를 털고 일찍 눕기로 했다. 내일 아침엔 얼음이 기다린다.', "I took the key. Tonight I'd dust and lie down early. The ice would be waiting in the morning."] }),
          opt('dust', '먼지 털다가 백팔십 일 다 가는 거 아니에요?', "Won't the dusting take all hundred and eighty days?", {
            next: 'dust' }),
        ],
        note: ['잘 곳이 생긴 것만으로 충분하다고 했더니, 정옥선 씨는 그 말은 아껴 두라며 열쇠를 손에 꾹 쥐여 주었다. 첫날 밤은 원래 길다고 했다.',
          "When I said a place to sleep was enough, Okseon told me to save that word and pressed the key into my hand. The first night is always long, she said."],
      }),
      dust: scene([
        line(O, '…그 정도면 네가 먼지보다 게으른 거다.', "...If it does, you're lazier than the dust.", { act: 'look_away' }),
        line(O, '창 열고 털어. 곰팡내는 사흘이면 빠진다. 안 빠지면 그땐 네 냄새다.', "Open the window and beat it out. The mould smell goes in three days. If it doesn't, it's your smell."),
        line(P, '…창부터 열게요.', "...I'll start with the window."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_dust' }),
        note: ['먼지 털다 백팔십 일이 다 가겠다고 농담했더니, 정옥선 씨 입꼬리가 잠깐 올라갔다. 곰팡내가 사흘 넘게 가면 그땐 내 냄새라고 했다.', "I joked the dusting would eat up all hundred and eighty days, and the corner of Okseon's mouth lifted for a moment. If the mould smell lasted more than three days, she said, it was mine."],
      }),
      term: scene([
        line(O, '계마다 받는 법이 다르다. 딴 데는 몇 해를 살아야 겨우 계원 소리를 듣는다.', "Every co-op has its own way. Elsewhere you live there for years before anyone calls you a member."),
        line(P, '그럼 여긴 쉬운 편이네요.', "So it's easier here."),
        line(O, '짧다고 쉬운 거 아니다. 남들 몇 해에 배울 걸 그 안에 다 배워야 하니까.', "Short doesn't mean easy. You have to learn in that time what others learn over years.", { act: 'shake_head' }),
        line(O, '우리 계는 육 개월 실습을 시켜 보고 정한다. 열쇠 받아.', "We train you for six months and then decide. Take the key."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_term' }),
        note: ['다른 계는 삼 년인데 왜 여긴 육 개월이냐고 물었다. 짧다고 쉬운 게 아니라, 남들 몇 해에 배울 것을 그 안에 다 배워야 한다고 했다.', "I asked why it was six months here when it was three years elsewhere. Short didn't mean easy, she said — I'd have to learn in that time what others learn over years."],
      }),
      fail: scene([
        line(O, '쫓아내진 않는다.', "No one throws you out."),
        line(P, '그럼요?', 'Then what?'),
        line(O, '날이 넘어가면 항구 사람들 눈이 하루하루 식는다. 그게 더 무섭다.', "Once the days run over, the harbour people's eyes cool a little more each day. That's worse.", { act: 'look_sea' }),
        line(O, '못 할 걱정은 첫날 하는 게 아니다. 오늘은 먼지나 털어.', "You don't worry about failing on the first day. Today, just do the dusting."),
      ], {
        end: endTalk({ accept: true, offer: 'if_fail' }),
        note: ['백팔십 일 안에 못 하면 어떻게 되느냐고 물었다. 쫓아내진 않지만 항구 사람들 눈이 하루하루 식는다고, 그게 더 무섭다고 했다.', "I asked what would happen if I didn't make it within a hundred and eighty days. No one would throw me out, she said, but the harbour people's eyes would cool a little more each day — and that was worse."],
      }),
    },
  },

  // M1-03 — 끝내는 자리(정옥선) · 첫 밤을 넘긴 아침
  {
    id: 'm1_03_done', questId: 'M1-03', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '잘 잤냐.', 'Sleep all right?', { act: 'look_up' }),
        line(P, '…네. 생각보다 푹 잤어요. 곰팡내는 아직 좀 나지만요.', "...Yes. Better than I expected. It still smells a bit musty, though."),
        line(O, '첫 밤 넘겼으면 됐다.', "You got through the first night. That's what counts."),
        line(O, '오늘부터 백팔십 일이다. 달력에 적어 둬.', 'From today, it is a hundred and eighty days. Mark it on a calendar.'),
        line(P, '오늘부터…', 'From today...'),
        line(O, '아, 그리고 이거.', 'Oh, and this.'),
        act(O, 'give', { to: P, item: 'qr_tackle_pouch' }),
        line(O, '옛 계원이 두고 간 채비 주머니다. 버리기 아까워서 두었다. 네가 써.', "A tackle pouch a former member left behind. It seemed a shame to throw out, so I kept it. You use it."),
        line(P, '이걸 저한테요?', 'For me?', { act: 'receive' }),
      ], {
        choices: [
          opt('promise', '백팔십 일 안에 해낼게요', "I'll do it within the hundred and eighty days", {
            say: ['백팔십 일 안에 해내겠습니다.', "I'll make it within a hundred and eighty days."],
            end: endTalk({ complete: 'promise',
              lineKo: '말은 쉽지. 날짜는 네가 세는 게 아니라 바다가 세는 거다. 바다에 못 나가는 날도 날이다. 그런 날은 칼을 갈든 그물을 깁든 해. 그런 날을 그냥 버리는 사람이 백팔십 일을 못 채운다.',
              lineEn: "Easy to say. You don't count the days — the sea does. Days you can't go out are days too. On those, sharpen a knife or mend a net. People who throw those days away are the ones who never fill a hundred and eighty." }),
            note: ['백팔십 일 안에 해내겠다고 했다. 정옥선 씨는 날짜는 바다가 센다며, 바다에 못 나가는 날도 버리지 말라고 했다.', "I promised to make it within a hundred and eighty days. Okseon said the sea does the counting, and not to throw away the days I couldn't go out."] }),
          opt('why', '왜 저한테 이걸 주세요?', 'Why give this to me?', {
            say: ['왜 저한테 이걸 주시는 거예요?', 'Why are you giving this to me?'],
            next: 'why' }),
          opt('tally', '달력이 없어서… 벽에 줄을 그을게요', "No calendar... I'll mark the wall", {
            say: ['달력이 없어서… 벽에 하루씩 줄을 긋겠습니다.', "I don't have a calendar... so I'll draw a line on the wall for each day."],
            end: endTalk({ complete: 'tally_marks',
              lineKo: '(웃지도 않고 고개를 끄덕인다.) 그것도 좋다. 손으로 그은 줄은 쉽게 안 지워진다. 다만 줄만 긋고 일은 안 하면 그건 버티는 거다. 줄 하나에 일 하나. 그렇게 채워.',
              lineEn: "(She nods without smiling.) That works too. Lines drawn by hand don't rub off easily. But drawing lines without doing the work is just holding on. One line, one job. Fill them that way." }),
            note: ['달력이 없으니 벽에 하루씩 줄을 긋겠다고 했다. 정옥선 씨는 줄 하나에 일 하나씩 채우라고 했다.', "I said I'd draw a line on the wall for each day, since I had no calendar. Okseon told me to fill each line with a job."] }),
        ],
        note: ['첫 밤을 넘기고 나오자 정옥선 씨가 오늘부터 백팔십 일이라며 달력에 적어 두라고 했다. 옛 계원이 두고 간 채비 주머니도 건넸다.',
          "When I came out after the first night, Okseon told me the hundred and eighty days started today and to mark it on a calendar. She also handed me a tackle pouch a former member had left behind."],
      }),
      why: scene([
        act(O, 'silence'),
        line(O, '…얼음 상자를 안 떨어뜨렸으니까. 이유는 그거면 됐다.', "...Because you didn't drop the ice box. That's reason enough."),
        line(P, '그게 다예요?', "That's all?"),
      ], {
        end: endTalk({ complete: 'why',
          lineKo: '(좌판 얼음을 고쳐 깔며 혼잣말처럼 덧붙인다.) 사람은 작은 일 하는 걸 보면 안다. 큰일은 누구나 잘하는 척한다.',
          lineEn: "(Re-laying the ice on the stall, she adds, half to herself.) You can tell a person by how they do small jobs. Anyone can pretend to be good at big ones." }),
        note: ['왜 나한테 주느냐고 물었다. 얼음 상자를 떨어뜨리지 않았으니까, 사람은 작은 일 하는 걸 보면 안다고 했다. 더 묻지 말라는 눈이었다.', "I asked why she was giving it to me. Because I hadn't dropped the ice box — you can tell a person by how they do small jobs. Her eyes told me not to ask more."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-04 「사이소 영수증」 — 받는 자리(도현수) · 방파제에서 처음 만난다
  // ═══════════════════════════════════════════
  {
    id: 'm1_04_offer', questId: 'M1-04', at: 'offer', npcId: HS, start: 'start',
    nodes: {
      start: scene([
        line(HS, '쯧.', 'Tch.'),
        line(P, '…저요? 뭐가 잘못됐어요?', '...Me? Is something wrong?', { act: 'look_up' }),
        line(HS, '그 대. 여기다 펼 거야?', "That rod. You're setting it up here?", { act: 'peer' }),
        line(P, '그럴 건데요. 왜요?', 'I was going to. Why?'),
        line(HS, '그 대는 아까우니까 여기다 쓰지 마.', "That rod's too good for this spot. Don't use it here."),
        line(P, '…누구신데요?', '...And who are you?'),
        line(HS, '도현수. 이 방파제엔 매일 나와.', "Do Hyeonsu. I'm out on this breakwater every day."),
        line(HS, '여긴 테트라포드 틈에 채비 내리는 자리야. 구멍치기. 부러져도 안 아까운 대로 하는 거야.', "Here you drop your rig into the gaps in the tetrapods. Hole fishing. You do it with a rod you won't mind breaking."),
        line(HS, '사이소 가서 싼 거 하나 사.', 'Go to Saiso and buy a cheap one.'),
        line(P, '(…처음 보는 사람이 남의 대를 두고 이래라저래라 한다.)', "(...A total stranger, telling me what to do with my own rod.)"),
      ], {
        choices: [
          opt('take', '…싼 대로 해 볼게요', "...I'll try it with a cheap one", {
            say: ['…싼 대로 해 볼게요. 구멍치기는 처음이지만요.', "...I'll try it with a cheap one. Though I've never done hole fishing."],
            next: 'take' }),
          opt('hole', '구멍치기가 정확히 뭔데요?', 'What exactly is hole fishing?', { next: 'hole' }),
          opt('mine', '제 대를 어디다 쓸지는 제가 정해요', "I'll decide where my rod gets used", {
            say: ['제 대를 어디다 쓸지는 제가 정해요.', "Where I use my rod is my call."],
            next: 'mine' }),
        ],
        note: ['방파제에서 아버지의 대를 펴려는데 뒤에서 누가 혀를 찼다. 내 또래, 도현수 씨였다. 그 대는 여기 쓰기 아까우니 사이소에서 싼 대를 사서 테트라포드 틈에 구멍치기를 하라고 했다.',
          "I was about to set up my father's rod on the breakwater when someone clicked his tongue behind me. Someone about my age — Do Hyeonsu. He said the rod was too good for this spot; I should buy a cheap one at Saiso and fish the gaps in the tetrapods."],
      }),
      take: scene([
        line(HS, '처음인 거 티 나.', 'It shows.'),
        line(HS, '(테트라포드 쪽을 턱으로 가리킨다.) 멀리 보내는 데가 아니야. 발밑 틈에 그대로 떨궈.', "(He juts his chin at the tetrapods.) This isn't a place for casting far. Just let it fall into the gap at your feet."),
        line(P, '물면요?', 'And when something bites?'),
        line(HS, '버티지 마. 고기가 구멍 안으로 들어가면 못 꺼내. 안 나오면 줄 끊고 새로 묶어. 그래서 싼 대로 하는 거고.', "Don't hang on. Once a fish gets inside the hole, you won't get it out. If it won't come, cut the line and tie on again. That's why you use a cheap rod."),
      ], {
        end: endTalk({ accept: true, offer: 'take_advice' }),
        note: ['싼 대로 해 보겠다고 했다. 도현수 씨는 처음인 게 티가 난다며, 발밑 틈에 그대로 떨구고 입질이 오면 버티지 말라고 했다. 그래서 싼 대로 하는 거라고.', "I said I'd try it with a cheap rod. Hyeonsu said my inexperience showed — drop it straight into the gap at my feet and don't hang on when it bites. That's why it's done with a cheap rod."],
      }),
      hole: scene([
        line(HS, '테트라포드 틈새 있잖아. 그 구멍에 채비를 바로 내리는 거야. 고기들이 다 거기 숨어 있어.', "You see the gaps between the tetrapods? You drop your rig straight down those holes. That's where the fish hide."),
        line(P, '그럼 거기 대만 넣으면 되는 거예요?', 'So I just put the rod in there?'),
        line(HS, '물자마자 구멍으로 파고들어. 그때 대가 꺾여.', 'The moment they bite, they dive for the hole. That snaps the rod.'),
        line(HS, '그러니까 비싼 대 들고 오지 말라는 거야.', "That's why I'm telling you not to bring an expensive one."),
      ], {
        choices: [
          opt('go', '알겠어요. 사이소부터 갈게요', "Got it. I'll head to Saiso first", {
            end: endTalk({ accept: true, offer: 'ask_hole' }),
            note: ['알아들었으니 사이소부터 가겠다고 했다.', 'I said I understood and would go to Saiso first.'] }),
          opt('cheap', '만 원짜리 대에도 고기가 물긴 해요?', 'Will fish even bite on a ten-thousand-won rod?', { next: 'cheap' }),
        ],
        note: ['구멍치기가 뭐냐고 물었다. 테트라포드 틈새 구멍에 채비를 바로 내리는 낚시인데, 고기가 물자마자 구멍으로 파고들어 대가 꺾인다고 했다.', "I asked what hole fishing was. You drop your rig straight into the gaps between the tetrapods — but the fish dive into the hole the moment they bite, and that snaps the rod."],
      }),
      cheap: scene([
        line(HS, '고기는 대 값 안 봐. 미끼랑 자리를 보지.', "Fish don't look at the price of the rod. They look at the bait and the spot."),
        line(HS, '만 원짜리로 못 낚으면 십만 원짜리로도 못 낚아.', "If you can't catch one on a ten-thousand-won rod, you won't on a hundred-thousand one either."),
        line(P, '…', '...'),
        line(HS, '대 탓 하는 사람치고 잘 낚는 거 못 봤어. 가서 사.', "I've never seen anyone who blames the rod catch much. Go buy one."),
      ], {
        end: endTalk({ accept: true, offer: 'cheap_bite' }),
        note: ['만 원짜리 대에도 고기가 무느냐고 물었다. 고기는 대 값이 아니라 미끼와 자리를 본다고, 대 탓 하는 사람치고 잘 낚는 걸 못 봤다고 했다.', "I asked whether fish would even bite on a ten-thousand-won rod. Fish look at the bait and the spot, not the rod's price, he said — and he'd never seen anyone who blamed the rod catch much."],
      }),
      mine: scene([
        line(HS, '정해. 부러지면 우는 건 너지 내가 아니니까.', "Decide, then. If it breaks, you're the one crying, not me."),
        line(P, '…', '...'),
        line(HS, '그 대가 아무 데서나 휘두를 물건이 아닌 건 보면 알아.', "Anyone can see that rod isn't something you swing around just anywhere.", { act: 'look_away' }),
        line(HS, '오늘은 사이소 가서 싼 걸로 해. 그 대는 제대로 던질 날 펴.', "Today, go to Saiso and use a cheap one. Save that rod for a day you're really casting."),
        line(P, '(…말은 얄밉지만, 틀린 말은 아니다.)', "(...Annoying, but he isn't wrong.)"),
      ], {
        end: endTalk({ accept: true, offer: 'my_rod' }),
        note: ['내 대를 어디 쓸지는 내가 정한다고 맞받았다. 도현수 씨는 부러지면 우는 건 나라면서도, 그 대는 제대로 던질 날 펴라고 했다. 얄밉지만 틀린 말은 아니었다.', "I shot back that where I used my rod was my call. Hyeonsu said I'd be the one crying if it broke — and told me to save it for a day I was really casting. Annoying, but not wrong."],
      }),
    },
  },

  // M1-04 — 끝내는 자리(도현수)
  {
    id: 'm1_04_done', questId: 'M1-04', at: 'complete', npcId: HS, start: 'start',
    nodes: {
      start: scene([
        line(P, '올렸어요. 테트라포드 틈에서, 사이소 대로요.', 'I got one. From the tetrapod gaps, with the Saiso rod.'),
        line(HS, '…낚긴 낚았네.', '...So you actually caught something.', { act: 'peer' }),
        line(HS, '대는? 안 부러졌어?', 'And the rod? Still in one piece?'),
        line(P, '한 번 크게 휘었는데, 버티더라고요.', 'It bent hard once, but it held.'),
        line(HS, '만 원짜리치곤 잘 버텼네.', 'Not bad for a ten-thousand-won rod.'),
        line(HS, '사이소 영수증은 버리지 마. 낚시는 장비값부터 세는 거니까.', "Don't throw away the Saiso receipt. Fishing starts with counting what the gear cost."),
        line(P, '영수증까지요?', 'Even the receipt?'),
        line(HS, '얼마 쓰고 뭘 건졌는지 알아야, 다음에 뭘 살지 알지.', "You need to know what you spent and what you got, so you know what to buy next."),
      ], {
        choices: [
          opt('retort', '아깝다는 건 도현수 씨 손 얘기겠죠', "Too good, you said — for your hands, maybe", {
            say: ['아깝다는 건 도현수 씨 손 얘기겠죠. 제 손은 아니에요.', "When you said too good, you meant for your hands, Hyeonsu. Not mine."],
            end: endTalk({ complete: 'retort',
              lineKo: '…말은 잘한다. 그럼 다음엔 그 대로 낚아 봐. 내가 볼게. (팔짱을 풀지 않는다.) 말로 이기는 건 쉬워. 방파제에선 고기 든 사람 말만 들어. 그 대가 진짜면, 그거 쥔 손도 진짜인지 보자고.',
              lineEn: "...You've got a mouth on you. Then next time, catch one with that rod. I'll watch. (He keeps his arms folded.) Winning with words is easy. On the breakwater, people only listen to the one holding a fish. If that rod's the real thing, let's see if the hand holding it is too." }),
            note: ['아깝다는 건 도현수 씨 손 얘기겠지, 내 손은 아니라고 맞받았다. 다음엔 그 대로 낚아 보라고, 지켜보겠다고 했다.', "I fired back that 'too good' was about his hands, not mine. He told me to catch one with that rod next time — he'd be watching."] }),
          opt('swallow', '충고로 들을게요. 사이소 대, 나쁘지 않았어요', "I'll take it as advice. The Saiso rod wasn't bad", {
            end: endTalk({ complete: 'swallow',
              lineKo: '충고 아니다. 사실이야. (그래도 잠깐 입꼬리가 올라간다.) 싼 대로 손 감각 익혀 두면 좋은 대 들었을 때 바로 알아. 대가 뭘 해 주는지. 그거 모르고 비싼 것만 쥐는 사람들이 제일 빨리 부러뜨려.',
              lineEn: "It wasn't advice. It's a fact. (Still, the corner of his mouth lifts for a moment.) Learn the feel with a cheap rod and you'll know right away when you pick up a good one. What the rod does for you. People who only ever hold expensive ones without knowing that break them fastest." }),
            note: ['충고로 듣겠다고, 사이소 대도 나쁘지 않았다고 했다. 도현수 씨는 충고가 아니라 사실이라면서도 잠깐 입꼬리가 올라갔다.', "I said I'd take it as advice; the Saiso rod hadn't been bad. Hyeonsu said it wasn't advice but fact — though the corner of his mouth lifted for a moment."] }),
          opt('ask', '도현수 씨는 왜 여기서 낚시해요?', 'Why do you fish here, Hyeonsu?', { next: 'ask' }),
          opt('cost', '만 원 쓰고 한 마리. 남는 장사예요?', 'Ten thousand won for one fish. Is that a profit?', {
            say: ['만 원 쓰고 한 마리. 이거 남는 장사예요?', 'Ten thousand won spent, one fish caught. Is that even a profit?'],
            end: endTalk({ complete: 'counted_cost',
              lineKo: '…남는 장사 하려고 낚시했으면 다들 벌써 그만뒀지. (어이없다는 듯 웃는다.) 오늘 배운 거 값이 만 원이야. 그렇게 치면 싸게 산 거다. 영수증, 버리지 마.',
              lineEn: "...If people fished to turn a profit, they'd all have quit long ago. (He laughs in disbelief.) What you learned today cost ten thousand won. Put that way, it was cheap. Don't throw the receipt away." }),
            note: ['만 원 쓰고 한 마리면 남는 장사냐고 물었다. 도현수 씨는 어이없다는 듯 웃고, 오늘 배운 것 값이 만 원이면 싸게 산 거라고 했다.', "I asked whether ten thousand won for one fish was a profit. Hyeonsu laughed in disbelief and said that if today's lesson cost ten thousand won, it was a bargain."] }),
        ],
        note: ['사이소 대로 테트라포드 틈에서 한 마리를 올렸다. 도현수 씨는 낚긴 낚았다며, 낚시는 장비값부터 세는 거니 사이소 영수증을 버리지 말라고 했다.',
          "I pulled one out of the tetrapod gaps with the Saiso rod. Hyeonsu admitted I'd actually caught something, and told me not to throw away the Saiso receipt — fishing starts with counting the cost of the gear."],
      }),
      ask: scene([
        line(HS, '…할아버지가 계장이라서.', '...Because my grandfather is the co-op chief.', { act: 'look_away' }),
        line(HS, '그 이상은 네가 알 바 아냐.', "Beyond that, it's none of your business."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'ask',
          lineKo: '(돌아서서 몇 걸음 가다가 멈춘다. 그러면서도 한 번 더 내 대를 본다.) 그 대 얘기는 다음에 해. 오늘은 아니야. 그 전에 네가 그 대를 쓸 줄이나 아는지부터 보자.',
          lineEn: "(He turns, takes a few steps, then stops — and glances at my rod once more.) We'll talk about that rod another time. Not today. First let's see whether you even know how to use it." }),
        note: ['왜 여기서 낚시를 하느냐고 물었다. 할아버지가 어촌계장이라서, 그 이상은 알 바 아니라고 했다. 돌아서 가다가도 한 번 더 내 대를 보았다.', "I asked why he fished here. Because his grandfather was the co-op chief — beyond that, none of my business. Even as he walked away, he glanced back at my rod once more."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-05 「첫 캐스팅」 — 받는 자리(도현수) · 아버지의 대를 처음 편다
  // ═══════════════════════════════════════════
  {
    id: 'm1_05_offer', questId: 'M1-05', at: 'offer', npcId: HS, start: 'start',
    nodes: {
      start: scene([
        line(HS, '또 왔네.', 'You again.', { act: 'look_up' }),
        line(P, '오늘은 아버지 대로 해 보려고요.', "Today I want to try with my father's rod."),
        line(HS, '…그 대.', '...That rod.', { act: 'peer' }),
        line(HS, '펴 봐. 오늘은 구멍 말고 멀리 던질 거야.', "Set it up. Today we're not doing holes. We're casting far."),
        line(P, '멀리요? 저번엔 멀리 보내지 말라면서요.', 'Far? Last time you told me not to cast far.'),
        line(HS, '그건 구멍치기고. 이건 원투야. 봉돌을 멀리 보내서 바닥에 앉히는 거.', "That was hole fishing. This is long casting. You send the sinker out far and settle it on the bottom."),
        line(HS, '그 대는 원래 그러라고 있는 대야.', "That rod was made for exactly that."),
        line(P, '바닥에 앉히고 나서는요?', 'And once it settles?'),
        line(HS, '줄 팽팽하게 세우고 초릿대를 봐. 초릿대가 크게 휘는 걸 보고, 세 번째에 채.', "Keep the line taut and watch the rod tip. Watch it bend hard, and strike on the third."),
        line(HS, '두 마리. 그 대로 두 마리 올려 봐.', 'Two fish. Land two with that rod.'),
        line(P, '세 번째요?', 'On the third?'),
      ], {
        choices: [
          opt('unfold', '아버지 대, 오늘 처음 제대로 펴 봐요', "This is the first time I've properly set it up", {
            say: ['네. 아버지 대, 오늘 처음 제대로 펴 봐요.', "Yes. This is the first time I've properly set up my father's rod."],
            next: 'unfold' }),
          opt('third', '왜 세 번째예요? 첫 번째에 채면 안 돼요?', "Why the third? Can't I strike on the first?", { next: 'third' }),
          opt('cast', '캐스팅은 저도 할 줄 알아요', 'I already know how to cast', {
            say: ['캐스팅부터 다시요? 던질 줄은 알아요.', 'Start again from casting? I know how to throw a line.'],
            next: 'cast' }),
        ],
        note: ['아버지의 대를 들고 다시 방파제에 나갔다. 도현수 씨는 오늘은 구멍치기가 아니라 원투라며, 봉돌을 바닥에 앉히고 초릿대가 크게 휘는 걸 보다가 세 번째에 채라고 했다. 그 대로 두 마리를 올려 보라고.',
          "I went back to the breakwater with my father's rod. Hyeonsu said today wasn't hole fishing but long casting — settle the sinker on the bottom, watch the rod tip bend hard, and strike on the third. Land two with that rod, he said."],
      }),
      unfold: scene([
        line(HS, '…처음?', '...First time?'),
        act(HS, 'silence'),
        line(HS, '그럼 가이드부터 봐. 링이 하나라도 휘었으면 줄이 거기서 쓸려.', "Then check the guides first. If even one ring is bent, the line wears through there."),
        line(P, '(링을 하나씩 세어 본다. 열두 개. 그중 하나가 살짝 휘었다.) …하나가 조금 휘었네요.', "(I count the rings one by one. Twelve. One of them is slightly bent.) ...One's a little bent."),
        line(HS, '조금은 괜찮아. 다 폈으면 내 옆에 서. 던지는 건 내가 볼게.', "A little is fine. When you're set up, stand next to me. I'll watch you cast."),
      ], {
        choices: [
          opt('ok', '알았어요. 옆에 설게요', "All right. I'll stand next to you", {
            end: endTalk({ accept: true, offer: 'unfold' }),
            note: ['도현수 씨 옆에 서서 던져 보기로 했다.', "I agreed to stand beside Hyeonsu and cast."] }),
          opt('afraid', '부러뜨릴까 봐 겁나요. 아버지 대라서', "I'm scared I'll break it. It's my father's", {
            say: ['부러뜨릴까 봐 겁나요. 아버지 대라서요.', "I'm scared I'll break it. Because it's my father's."],
            next: 'afraid' }),
        ],
        note: ['아버지 대를 오늘 처음 제대로 편다고 했더니, 도현수 씨는 잠깐 말이 없다가 가이드부터 보라고 했다. 링 열두 개 중 하나가 살짝 휘어 있었다.', "When I said this was the first time I'd properly set up my father's rod, Hyeonsu went quiet for a moment, then told me to check the guides. One of the twelve rings was slightly bent."],
      }),
      afraid: scene([
        line(HS, '겁나면 제대로 해. 대는 겁먹은 손에서 더 잘 부러져.', "If you're scared, do it properly. Rods break more easily in scared hands."),
        line(HS, '고기 걸리면 대를 세우고 버텨. 대가 꺾이는 건 고기가 세서가 아니라 사람이 무리할 때야.', "When a fish is on, keep the rod up and hold. Rods don't snap because the fish is strong. They snap when people force it."),
        line(P, '무리하지 않기. 그거면 돼요?', "Don't force it. That's all?"),
        line(HS, '그것만 지켜.', 'Just stick to that.'),
      ], {
        end: endTalk({ accept: true, offer: 'afraid_break' }),
        note: ['아버지 대라 부러뜨릴까 봐 겁난다고 털어놓았다. 대는 겁먹은 손에서 더 잘 부러진다고, 무리하지만 말라고 했다.', "I admitted I was scared of breaking my father's rod. Rods break more easily in scared hands, he said — just don't force it."],
      }),
      third: scene([
        line(HS, '첫 번째는 고기가 미끼를 건드려 보는 거야. 그때 채면 입 밖으로 빠져.', "The first one is the fish testing the bait. Strike then and it slips out of its mouth."),
        line(P, '두 번째는요?', 'And the second?'),
        line(HS, '두 번째에 물고, 세 번째에 끌고 가. 초릿대가 크게 휘면 그때가 바늘이 박힐 때야.', "On the second it bites, on the third it runs with it. When the tip bends hard, that's when the hook sets."),
        line(HS, '세는 거 잊지 마.', "Don't forget to count."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_third' }),
        note: ['왜 세 번째냐고 물었다. 첫 번째는 건드려 보는 것, 두 번째에 물고 세 번째에 끌고 간다고 했다. 초릿대가 크게 휠 때가 바늘이 박힐 때라고.', "I asked why the third. The first is the fish testing, he said; it bites on the second and runs on the third. When the tip bends hard, the hook sets."],
      }),
      cast: scene([
        line(HS, '던질 줄 아는 거랑 제대로 던지는 거랑 달라.', "Knowing how to throw and throwing properly aren't the same."),
        line(HS, '(내 손목을 툭 친다.) 어깨로 던지니까 봉돌이 엉뚱한 데 떨어지잖아.', "(He taps my wrist.) You throw from the shoulder, so the sinker lands all over the place."),
        line(P, '…손목으로요?', '...From the wrist?'),
        line(HS, '손목으로 끊어. 한 번 보여 줄 테니까 따라 해.', "Snap it off the wrist. I'll show you once, so copy me."),
      ], {
        end: endTalk({ accept: true, offer: 'can_cast' }),
        note: ['던질 줄은 안다고 했더니, 도현수 씨가 내 손목을 툭 쳤다. 어깨로 던지니 봉돌이 엉뚱한 데 떨어진다고, 손목으로 끊으라고 했다.', "When I said I knew how to cast, Hyeonsu tapped my wrist. Throwing from the shoulder sent the sinker everywhere, he said — snap it off the wrist."],
      }),
    },
  },

  // M1-05 — 끝내는 자리(도현수)
  {
    id: 'm1_05_done', questId: 'M1-05', at: 'complete', npcId: HS, start: 'start',
    nodes: {
      start: scene([
        line(P, '두 마리 올렸어요. 아버지 대로요.', "I landed two. With my father's rod."),
        line(HS, '봤어.', 'I saw.'),
        act(HS, 'silence'),
        line(HS, '…대가 손에 맞네. 그건 인정.', "...The rod suits your hands. I'll give you that.", { act: 'look_away' }),
        line(P, '인정이요? 도현수 씨가요?', "You'll give me that? You, Hyeonsu?"),
        line(HS, '한 번만 말한다. 그리고 릴 드랙 좀 풀어.', "I'm only saying it once. And loosen the drag on that reel."),
        line(P, '드랙이요?', 'The drag?'),
        line(HS, '아버지 대라며. 그렇게 조여 두면 부러진다.', "It's your father's rod, isn't it? Keep it cranked that tight and it'll break."),
      ], {
        choices: [
          opt('thanks', '고쳐 준 자세, 도움이 됐어요', 'The way you fixed my stance helped', {
            end: endTalk({ complete: 'thanks',
              lineKo: '…도움이라니까 이상하네. 그냥 보기 답답해서 그랬어. (릴 드랙을 반 바퀴 풀어 준다.) 드랙은 고기가 당길 때 줄이 조금씩 풀리게 두는 거야. 다 조여 두면 그 힘이 전부 대로 가. 아버지 대면 더 아껴.',
              lineEn: "...Helped. Sounds weird. It was just painful to watch. (He backs the drag off half a turn.) The drag lets line slip out a little when a fish pulls. Crank it all the way and all that force goes into the rod. If it's your father's, take even more care of it." }),
            note: ['고쳐 준 자세가 도움이 됐다고 했다. 도현수 씨는 보기 답답해서 그랬다면서 드랙을 반 바퀴 풀어 주었다. 아버지 대면 더 아끼라고.', "I told him fixing my stance had helped. Hyeonsu said it had just been painful to watch, and backed the drag off half a turn for me. If it was my father's, I should take even more care of it."] }),
          opt('proud', '두 마리요. 두 번째는 실력이었어요', 'Two. The second was skill', {
            say: ['두 마리요. 도현수 씨 말대로, 두 번째는 실력이었어요.', 'Two. Like you said, Hyeonsu — the second one was skill.'],
            end: endTalk({ complete: 'proud',
              lineKo: '자만은 대를 부러뜨린다. 그래도… 오늘은 맞는 말이다. 근데 내일도 두 마리 올려야 실력이야. 오늘 두 마리는 오늘 거고. (말은 그렇게 해도 눈은 내 손목에 가 있다.)',
              lineEn: "Pride breaks rods. But... today, you're right. Still, it's only skill if you land two again tomorrow. Today's two belong to today. (For all he says, his eyes are on my wrist.)" }),
            note: ['두 번째는 실력이었다고 했다. 도현수 씨는 자만은 대를 부러뜨린다면서도 오늘은 맞는 말이라고 했다. 눈은 내 손목에 가 있었다.', "I said the second one was skill. Hyeonsu said pride breaks rods — but that today I was right. His eyes were on my wrist."] }),
          opt('memory', '손잡이 흠집이 제 손에 딱 맞더라고요', 'The marks on the grip fit my hand exactly', {
            say: ['손잡이 흠집이 제 손에 딱 맞더라고요. 이상하죠.', 'The worn marks on the grip fit my hand exactly. Strange, right?'],
            end: endTalk({ complete: 'rod_memory',
              lineKo: '…안 이상해. 오래 쓴 대는 쓴 사람 손 모양이 남아. (잠깐 내 손을 본다.) 네 손이 그 손이랑 비슷한가 보지. 그럼 그 대는 네 거 맞아. 드랙만 풀어 둬.',
              lineEn: "...It's not strange. A rod used for years keeps the shape of the hand that used it. (He glances at my hand.) Yours must be like that one. Then that rod is yours, all right. Just loosen the drag." }),
            note: ['손잡이 흠집이 내 손에 딱 맞더라고 했다. 오래 쓴 대는 쓴 사람 손 모양이 남는다고, 그럼 그 대는 내 것이 맞다고 했다.', "I said the marks on the grip fit my hand exactly. A rod used for years keeps the shape of its owner's hand, he said — so it really was mine."] }),
        ],
        note: ['아버지의 대로 두 마리를 올렸다. 도현수 씨는 대가 내 손에 맞는다고, 그건 인정한다고 한 번만 말했다. 그렇게 조여 두면 부러진다며 드랙을 풀라고 했다.',
          "I landed two with my father's rod. Hyeonsu said, just once, that the rod suited my hands. Then he told me to loosen the drag — cranked that tight, it would break."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-06 「팔 수 없는 물고기」 — 받는 자리(정옥선) · 새끼 감성돔을 쿨러에 넣으려다 들켰다
  // ═══════════════════════════════════════════
  {
    id: 'm1_06_offer', questId: 'M1-06', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '그거 놔라.', 'Put that down.', { act: 'look_up' }),
        line(P, '네? 이거요? 방금 올린 건데요.', "Huh? This? I just landed it."),
        line(O, '손가락 두 마디도 안 되는 걸 쿨러에 넣으려고?', "You're putting something not even two finger-joints long in your cooler?"),
        line(P, '작긴 한데… 그래도 감성돔이잖아요. 팔면 얼마라도 받지 않을까 해서요.', "It's small, but... it's still a black porgy. I thought I might get something for it if I sold it."),
        line(O, '못 판다. 네가 잡은 건 네가 먹어. 그게 법이다.', "You can't sell it. What you catch, you eat. That's the law."),
        line(O, '계원이 돼도 낚싯대로 잡은 건 못 판다.', "Even once you're a co-op member, you can't sell what you catch with a rod."),
        line(P, '계원이 돼도요?', 'Even as a member?'),
        line(O, '그래. 그리고 그만한 건 먹지도 마. 자로 재 보고 모자라면 바다에 돌려보내.', "That's right. And one that size, you don't even eat. Measure it, and if it's short, send it back to the sea."),
        line(P, '자로요…', 'Measure it...'),
        line(O, '돌려보내고 와서 앉아. 다섯 가지를 다 듣고 가.', "Send it back, then come and sit. You'll hear all five before you go."),
      ], {
        choices: [
          opt('sit', '…앉을게요. 다섯 가지, 끝까지 들을게요', "...I'll sit. I'll hear all five", {
            say: ['…앉겠습니다. 다섯 가지, 끝까지 듣겠습니다.', "...I'll sit down. I'll hear all five, to the end."],
            next: 'sit' }),
          opt('everyone', '이 정도면 괜찮지 않아요? 다들 가져가던데요', "Isn't this one fine? Everyone else keeps them", { next: 'everyone' }),
          opt('coop', '계원이 뭔데요?', "What's a co-op member?", {
            say: ['계원이 뭔데요? 계원이 돼도 못 판다는 건요?', "What's a co-op member? And what do you mean, even members can't sell?"],
            next: 'coop' }),
        ],
        note: ['새끼 감성돔을 쿨러에 넣으려다 정옥선 씨 눈에 걸렸다. 내가 잡은 건 내가 먹는 게 법이고, 계원이 돼도 낚싯대로 잡은 건 못 판다고 했다. 자로 재서 모자라면 돌려보내고, 와서 다섯 가지 법을 다 듣고 가라고 했다.',
          "Jeong Okseon caught me putting a baby black porgy in my cooler. The law is that you eat what you catch, she said, and even co-op members can't sell what they catch with a rod. Measure it, send it back if it's short, then come and hear all five of the laws."],
      }),
      sit: scene([
        line(O, '그래. 엉덩이부터 붙여라.', 'Good. Get yourself seated first.'),
        line(O, '(좌판 의자를 발로 밀어 준다.) 그 전에 그놈부터 물에 내려놔. 살살.', "(She nudges a stall stool towards me with her foot.) But put that little one in the water first. Gently."),
        line(P, '네. 놓아주고 올게요.', "Right. I'll let it go and come back."),
        line(O, '첫째는 방금 말한 거다. 네가 잡은 건 네가 먹는다. 제일 쉬운데 제일 많이 어기는 법이야.', "The first is what I just told you. What you catch, you eat. It's the easiest one and the one broken most."),
        line(O, '나머지 넷은 그거 지키는 놈한테만 들린다.', 'The other four only reach the ears of those who keep it.'),
      ], {
        end: endTalk({ accept: true, offer: 'sit_listen' }),
        note: ['앉아서 다섯 가지를 끝까지 듣겠다고 했다. 정옥선 씨는 의자를 밀어 주며, 첫째는 내가 잡은 건 내가 먹는다는 것이고 나머지 넷은 그걸 지키는 사람에게만 들린다고 했다.', "I said I'd sit and hear all five. Okseon pushed a stool over and said the first was that you eat what you catch — and the other four only reach those who keep it."],
      }),
      everyone: scene([
        line(O, '다들? 그 다들이 이 앞바다를 이렇게 만들었다.', "Everyone? It's that everyone who left the sea out front like this.", { act: 'shake_head' }),
        line(O, '손가락 두 마디짜리는 내년이면 손바닥만 해진다. 오늘 그걸 먹으면 내년엔 네 손이 빈다.', "A two-finger-joint fish is the size of your palm by next year. Eat it today and your hands are empty next year."),
        line(P, '…', '...'),
        line(O, '재 보고 돌려보내. 그리고 앉아. 길게 말 안 한다.', "Measure it and send it back. Then sit. I won't go on long."),
      ], {
        end: endTalk({ accept: true, offer: 'everyone_keeps' }),
        note: ['다들 가져가던데 이 정도면 괜찮지 않느냐고 했다가 한 소리 들었다. 그 다들이 이 앞바다를 이렇게 만들었다고, 오늘 먹으면 내년엔 내 손이 빈다고 했다.', "I said everyone else kept them, so surely this one was fine — and got told off. It was that everyone who'd left the sea like this, she said. Eat it today and my hands would be empty next year."],
      }),
      coop: scene([
        line(O, '어촌계. 이 항구에서 바다를 나눠 쓰는 사람들 모임이다. 그물 칠 자리, 미역 따는 날, 다 거기서 정해.', "The fishing co-op. The people who share the sea off this harbour. Where nets go, which days we cut seaweed — it's all decided there."),
        line(P, '그럼 계원이 되면 팔 수 있는 거 아니에요?', "So once I'm a member, can't I sell?"),
        line(O, '통발이나 그물로 잡은 건 위판에 낼 수 있다. 낚싯대로 잡은 건 계원이어도 안 돼. 그게 둘째다.', "What you take with traps or nets, you can put up at auction. What you take with a rod — not even as a member. That's the second."),
        line(O, '나머지도 들어. 그놈 돌려보내고 와서.', "Hear the rest too. After you've sent that one back."),
      ], {
        choices: [
          opt('ok', '알겠어요. 놓아주고 와서 들을게요', "All right. I'll let it go and come back to listen", {
            end: endTalk({ accept: true, offer: 'ask_coop' }),
            note: ['놓아주고 와서 나머지를 듣기로 했다.', 'I said I would let it go and come back for the rest.'] }),
          opt('enforce', '법이라면서요. 정옥선 씨가 단속하세요?', "It's the law, you said. Do you enforce it?", {
            say: ['법이라면서요. 정옥선 씨가 단속하시는 건 아니죠?', "It's the law, you said. But you're not the one enforcing it, are you?"],
            next: 'enforce' }),
        ],
        note: ['계원이 뭐냐고 물었다. 어촌계는 이 항구의 바다를 나눠 쓰는 사람들 모임이고, 계원은 통발이나 그물로 잡은 것을 위판에 낼 수 있지만 낚싯대로 잡은 건 계원이어도 안 된다고 했다. 그게 둘째라고.', "I asked what a co-op member was. The fishing co-op is the people who share this harbour's sea; members can put what they trap or net up at auction, but not what they catch with a rod. That was the second law."],
      }),
      enforce: scene([
        line(O, '단속은 해경이 하고, 나는 말만 한다. 말로 끝날 때 듣는 게 제일 싸게 먹힌다.', "The coast guard enforces it. I just talk. Listening while it's still only talk is the cheapest way out."),
        line(O, '벌금 나오면 네 품삯 몇 달 치야.', "A fine would be months of your wages."),
        line(P, '몇 달 치요?', 'Months?'),
        line(O, '그거 내고 배우든가, 지금 공짜로 배우든가. 골라. (대답을 기다리지 않고 의자를 내민다.)', "Pay that and learn, or learn now for free. Your pick. (She pushes a stool at me without waiting for an answer.)"),
      ], {
        end: endTalk({ accept: true, offer: 'who_enforces' }),
        note: ['정옥선 씨가 단속하는 건 아니지 않느냐고 했다. 단속은 해경이 하고 자기는 말만 한다고, 벌금은 품삯 몇 달 치이니 지금 공짜로 배우라고 했다.', "I said she wasn't the one enforcing it, was she? The coast guard did that, she said; she only talked — and since a fine would cost months of wages, I'd better learn now, for free."],
      }),
    },
  },

  // M1-06 — 끝내는 자리(정옥선) · 다섯 가지를 다 들은 뒤
  {
    id: 'm1_06_done', questId: 'M1-06', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '다섯 가지, 다 들었어요.', "I've heard all five."),
        line(O, '들은 걸로 끝나면 안 된다. 손이 기억해야지.', "Hearing them isn't the end of it. Your hands have to remember."),
        line(P, '손이요?', 'My hands?'),
        line(O, '자 대 보는 손, 놓아주는 손. 아까 그놈 내려놓던 손처럼.', "The hand that holds the ruler, the hand that lets go. Like the one that put that little fish back."),
        line(O, '그게 시작이다. 잡는 법보다 먼저 배울 게 그거야.', "That's the beginning. It comes before learning how to catch."),
        line(O, '도감에 적어 둬라. 금지체장, 금어기. 모르면 물어. 아는 척이 제일 위험하다.', "Write it in your field guide. Minimum sizes, closed seasons. If you don't know, ask. Pretending to know is the most dangerous thing."),
        line(P, '(…아는 척. 오늘 하루에만 몇 번이나 했을까.)', '(...Pretending to know. How many times have I done that today alone?)'),
      ], {
        choices: [
          opt('law', '낚싯대로 잡은 건 팔지 않을게요', "I won't sell what I catch with a rod", {
            say: ['낚싯대로 잡은 건 팔지 않겠습니다. 먹거나 놓겠습니다.', "I won't sell what I catch with a rod. I'll eat it or let it go."],
            end: endTalk({ complete: 'accept_law',
              lineKo: '(바다 쪽을 한 번 보고 고개를 끄덕인다.) 먹을 만큼만 가져가고, 작은 놈은 다시 넣어. 그렇게 해 온 사람들이 있어서 이 앞에 아직 감성돔이 든다. 너도 그 사람들 중 하나가 되면 된다.',
              lineEn: "(She glances at the sea and nods.) Take only what you'll eat, and put the small ones back. There are still black porgy out front because people did just that. You only have to become one of them." }),
            note: ['낚싯대로 잡은 건 팔지 않고 먹거나 놓겠다고 했다. 정옥선 씨는 그렇게 해 온 사람들이 있어서 이 앞에 아직 감성돔이 든다고, 나도 그중 하나가 되면 된다고 했다.', "I said I wouldn't sell what I caught with a rod — I'd eat it or let it go. Okseon said there were still black porgy out front because people had done just that, and I only had to become one of them."] }),
          opt('grumble', '너무 빡빡한 거 아니에요? 먹고살아야 하는데요', "Isn't that too strict? I have to make a living", {
            say: ['규칙이 너무 빡빡한 거 아니에요? 먹고살아야 하는데요.', "Aren't the rules a bit too strict? I have to make a living."],
            next: 'grumble' }),
          opt('why', '정옥선 씨는 왜 이 규칙을 지키세요?', 'Why do you keep these rules, Okseon?', { next: 'why' }),
          opt('speak', '다른 사람이 작은 걸 가져가면 저도 말할게요', "If someone takes a small one, I'll say something", {
            say: ['다른 사람이 작은 걸 가져가면, 저도 말하겠습니다.', "If someone else takes a small one, I'll speak up too."],
            end: endTalk({ complete: 'speak_up',
              lineKo: '말은 해. 싸우지는 말고. 법 얘기는 목소리 큰 쪽이 지는 거다. 재 보자고 해. 자 앞에서는 다들 조용해진다. 그래도 안 들으면 그건 해경 몫이야. 너는 네 쿨러만 깨끗하면 된다.',
              lineEn: "Say something, yes. Just don't fight. In arguments about the law, the louder one loses. Suggest measuring it. Everyone goes quiet in front of a ruler. If they still won't listen, that's for the coast guard. You only need to keep your own cooler clean." }),
            note: ['다른 사람이 작은 걸 가져가면 나도 말하겠다고 했다. 정옥선 씨는 싸우지 말고 재 보자고 하라고, 자 앞에서는 다들 조용해진다고 했다.', "I said I'd speak up if someone else took a small one. Okseon told me not to fight — just suggest measuring it. Everyone goes quiet in front of a ruler."] }),
        ],
        note: ['다섯 가지 법을 다 들었다고 하자, 정옥선 씨는 들은 걸로 끝나지 말고 손이 기억해야 한다고 했다. 잡는 법보다 먼저 배울 것이 그거라며, 금지체장과 금어기를 도감에 적어 두라고 했다.',
          "When I said I'd heard all five laws, Okseon said hearing wasn't enough — my hands had to remember. That came before learning how to catch, she said, and told me to write the minimum sizes and closed seasons in my field guide."],
      }),
      grumble: scene([
        line(O, '빡빡해서 바다가 남은 거다.', "It's because they're strict that there's still a sea."),
        line(O, '먹고사는 건 다른 길이 있어. 통발, 맨손, 품삯. 배워.', 'There are other ways to make a living. Traps, bare hands, day wages. Learn them.'),
        line(P, '…낚싯대 하나로는 안 된다는 거네요.', "...So a rod alone won't do it."),
      ], {
        end: endTalk({ complete: 'grumble',
          lineKo: '(손바닥으로 좌판을 두 번 친다.) 낚싯대 하나로 먹고살겠다는 건 욕심이다. 욕심은 바다가 제일 먼저 알아챈다. 내일 아침 얼음 나를 손이 모자라니까 그거부터 해.',
          lineEn: "(She slaps the stall twice with her palm.) Living off a rod alone is greed. The sea notices greed before anyone. I'm short of hands to carry ice tomorrow morning, so start with that." }),
        note: ['규칙이 너무 빡빡하다고 투덜댔다. 정옥선 씨는 빡빡해서 바다가 남은 거라며, 낚싯대 하나로 먹고살겠다는 건 욕심이라고 했다. 내일 아침 얼음부터 나르라고.', "I grumbled that the rules were too strict. Okseon said that was why there was still a sea, and that living off a rod alone was greed. Carry ice tomorrow morning, she said."],
      }),
      why: scene([
        line(O, '…내 남편이 안 지켜서.', "...Because my husband didn't.", { act: 'look_away' }),
        act(O, 'silence'),
        line(O, '그 얘긴 그만하자.', "Let's leave that there."),
        line(P, '…네.', '...All right.'),
      ], {
        end: endTalk({ complete: 'ask_why',
          lineKo: '(좌판 서랍에서 낡은 계측자를 꺼내 쓰다듬는다.) 눈금 몇 개는 지워졌는데 금지체장 칸은 멀쩡하다. 쓸 일이 제일 많아서 그래. 너도 재 보고 모자라면 놔. 그거면 된다.',
          lineEn: "(She takes an old measuring board out of the stall drawer and runs her hand over it.) Some of the marks have worn away, but the minimum-size marks are fine. They're the ones used most. You too — measure, and if it's short, let it go. That's all it takes." }),
        note: ['정옥선 씨에게 왜 이 규칙을 지키느냐고 물었다. 남편이 안 지켜서라고만 하고 그 얘기는 그만하자고 했다. 낡은 계측자의 금지체장 칸만 멀쩡했다.', "I asked Okseon why she kept these rules. Only because her husband hadn't, she said — and she didn't want to talk about it. On her old measuring board, only the minimum-size marks were still clear."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-07 「부엌의 순서」 — 받는 자리(정옥선) · 처음 칼을 잡는다
  // ═══════════════════════════════════════════
  {
    id: 'm1_07_offer', questId: 'M1-07', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '그거 오늘 낚은 거냐.', 'Did you catch that today?', { act: 'peer' }),
        line(P, '네. 이번엔 자로 쟀어요. 먹어도 되는 크기예요.', "Yes. I measured it this time. It's big enough to eat."),
        line(O, '잰 건 잘했다. 그래서, 어떻게 먹을 거냐.', 'Good that you measured. So how are you going to eat it?'),
        line(P, '…그냥 통째로 구워 먹을까 했어요.', '...I was just going to grill it whole.'),
        line(O, '낚았으면 손질까지 해야 네 생선이다.', "If you caught it, it's only your fish once you've prepared it too."),
        line(P, '손질이요? 제가요?', 'Prepare it? Me?'),
        line(O, '도마 내줄 테니 앉아. 손질하고, 회로 떠 봐.', "I'll give you a board. Sit. Clean it, then slice it for sashimi."),
        line(O, '시메부터 순서대로 한다.', 'Start with shime, and go in order.'),
        line(P, '(…제대로 된 밥을 먹어 본 게 언제였더라. 이 년은 된 것 같다.)', '(...When did I last eat a proper meal? It must be two years.)'),
      ], {
        choices: [
          opt('own', '제가 잡은 걸 제 손으로 다뤄 볼게요', "I'll handle what I caught with my own hands", {
            say: ['네. 제가 잡은 걸 제 손으로 다뤄 보고 싶어요.', "Yes. I want to handle what I caught with my own hands."],
            next: 'own' }),
          opt('shime', '시메요? 그게 뭐예요?', "Shime? What's that?", { next: 'shime' }),
          opt('hungry', '솔직히 손질보다 먹는 게 더 급해요', "Honestly, eating feels more urgent than cleaning", {
            say: ['솔직히 손질보다 먹는 게 더 급해요.', "Honestly, eating feels a lot more urgent than cleaning it."],
            next: 'hungry' }),
        ],
        note: ['자로 잰 생선을 통째로 구워 먹으려 했더니, 정옥선 씨가 낚았으면 손질까지 해야 내 생선이라며 도마를 내주었다. 손질하고 회로 떠 보라고, 시메부터 순서대로 하라고 했다.',
          "I was going to grill my measured fish whole, but Jeong Okseon said it was only mine once I'd prepared it, and set out a chopping board. Clean it and slice it for sashimi, she said — starting with shime, in order."],
      }),
      own: scene([
        line(O, '그래. 그게 순서다. (도마를 물로 한 번 씻어 낸다.)', "Good. That's the order of things. (She rinses the board once with water.)"),
        line(O, '칼은 누르는 게 아니라 당기는 거다. 시메, 피 빼기, 비늘, 머리.', "A knife isn't pushed, it's drawn. Shime, bleeding, scales, head."),
        line(O, '하나 끝나기 전에 다음 거 생각하지 마.', "Don't think about the next step before one's finished."),
      ], {
        choices: [
          opt('go', '하나씩 할게요', "I'll take it one step at a time", {
            end: endTalk({ accept: true, offer: 'my_own' }),
            note: ['하나씩 해 보겠다고 했다. 칼은 누르지 말고 당기는 것.', "I said I'd take it one step at a time. Draw the knife, don't push it."] }),
          opt('fear', '이런 칼은 처음이에요. 손 베면 어떡해요?', "I've never used a knife like this. What if I cut myself?", { next: 'fear' }),
        ],
        note: ['내 손으로 다뤄 보겠다고 했다. 정옥선 씨는 칼은 누르는 게 아니라 당기는 거라며, 시메, 피 빼기, 비늘, 머리 순서로 하나 끝나기 전에 다음 걸 생각하지 말라고 했다.', "I said I'd handle it myself. Okseon said a knife is drawn, not pushed — shime, bleeding, scales, head, and don't think about the next step before one is done."],
      }),
      fear: scene([
        line(O, '베이면 피 닦고 다시 잡아. 다들 그렇게 배웠다.', "If you cut yourself, wipe off the blood and pick it up again. That's how everyone learned."),
        line(O, '칼 쥔 손보다 생선 누르는 손을 봐. 손가락은 말아 넣고, 칼등 쪽으로.', "Watch the hand holding the fish, not the one holding the knife. Curl your fingers in, towards the back of the blade."),
        line(P, '(손가락을 말아 넣어 본다.) 이렇게요?', '(I curl my fingers in.) Like this?'),
        line(O, '그래. 그것만 지키면 크게는 안 벤다.', "That's it. Keep to that and you won't cut yourself badly."),
      ], {
        end: endTalk({ accept: true, offer: 'knife_fear' }),
        note: ['손 베면 어떡하냐고 물었다. 베이면 피 닦고 다시 잡으라고, 생선 누르는 손가락을 말아 넣으면 크게는 안 벤다고 했다.', "I asked what to do if I cut myself. Wipe the blood off and pick it up again, she said — and curl in the fingers holding the fish, and I wouldn't cut myself badly."],
      }),
      shime: scene([
        line(O, '숨을 끊는 거다. 아가미 뒤를 찔러서 단번에. 오래 퍼덕이면 살이 상한다.', "It's ending its life. One stab behind the gills, all at once. If it thrashes for long, the flesh spoils."),
        line(P, '그다음은요?', 'And after that?'),
        line(O, '피 빼기. 피가 남으면 비리고 빨리 상해.', 'Bleeding it. If the blood stays in, it smells fishy and goes off fast.'),
        line(O, '순서가 곧 맛이다. 앉아서 봐.', 'The order is the flavour. Sit and watch.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_shime' }),
        note: ['시메가 뭐냐고 물었다. 아가미 뒤를 찔러 단번에 숨을 끊는 것이고, 그다음 피를 빼야 비리지 않다고 했다. 순서가 곧 맛이라고.', "I asked what shime was. A single stab behind the gills to end its life at once, then bleeding it so it wouldn't smell fishy. The order is the flavour, she said."],
      }),
      hungry: scene([
        act(O, 'laugh'),
        line(O, '배고픈 놈이 칼 잡으면 손부터 벤다.', "A hungry person who picks up a knife cuts his hand first."),
        line(O, '밥은 회 뜨고 나서다. 네가 뜬 걸로 먹는 거야.', "You eat after the sashimi's sliced. You eat what you slice."),
        line(P, '제가 뜬 걸로요?', 'What I slice?'),
        line(O, '그러니까 빨리 말고 제대로 해. 서두르면 두 번 하게 된다.', "So do it properly, not fast. Rush it and you'll do it twice."),
      ], {
        end: endTalk({ accept: true, offer: 'hungry' }),
        note: ['솔직히 먹는 게 더 급하다고 했다. 정옥선 씨는 코로 웃고, 밥은 내가 뜬 회로 먹는 거니 서두르지 말고 제대로 하라고 했다.', "I admitted eating felt more urgent. Okseon laughed through her nose — I'd be eating the sashimi I sliced, so I should do it properly, not fast."],
      }),
    },
  },

  // M1-07 — 끝내는 자리(정옥선) · 첫 회 한 접시
  {
    id: 'm1_07_done', questId: 'M1-07', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '다 떴어요. 두께가 좀… 제각각이지만요.', "It's sliced. The thickness is a bit... all over the place, though."),
        line(O, '어디 보자.', "Let's see.", { act: 'peer' }),
        line(O, '…먹을 만하네.', "...It's good enough to eat."),
        line(P, '정말요?', 'Really?'),
        act(O, 'give', { to: P, item: 'qr_knife_okseon' }),
        line(O, '이 칼은 내가 쓰던 거다. 손에 맞는지 봐라.', "This is the knife I used to use. See if it fits your hand."),
        line(P, '…무겁네요.', "...It's heavy.", { act: 'receive' }),
        line(O, '신선도는 시계다. 쿨러 얼음 아끼면 회가 아니라 사료가 된다.', "Freshness is a clock. Skimp on the ice in your cooler and it's not sashimi, it's animal feed."),
      ], {
        choices: [
          opt('taste', '한 점 드셔 보실래요?', 'Would you try a piece?', {
            say: ['한 점 드셔 보시겠어요?', 'Would you like to try a piece?'],
            next: 'taste' }),
          opt('humble', '아직 두께가 제멋대로예요. 더 연습할게요', "The thickness is still all over. I'll practise more", {
            say: ['아직 두께가 제멋대로예요. 더 연습하겠습니다.', "The thickness is still all over the place. I'll practise more."],
            end: endTalk({ complete: 'humble',
              lineKo: '연습은 손이 하는 거지 입이 하는 게 아니다. 그 칼로 해라. 내 손엔 이제 무겁다. 무겁다는 건 칼이 일을 한다는 뜻이다. 네 손은 거들기만 하면 돼. 두께는 백 장 뜨면 저절로 맞는다.',
              lineEn: "Practice is done with hands, not with your mouth. Use that knife. It's too heavy for my hands now. Heavy means the knife does the work. Your hand only has to help. Slice a hundred and the thickness sorts itself out." }),
            note: ['두께가 제멋대로라 더 연습하겠다고 했다. 정옥선 씨는 그 칼로 하라고, 자기 손엔 이제 무겁다고 했다. 두께는 백 장 뜨면 저절로 맞는다고.', "I said the thickness was all over the place and I'd practise more. Okseon told me to use that knife — it was too heavy for her hands now. Slice a hundred, she said, and the thickness sorts itself out."] }),
          opt('clock', '신선도가 시계라는 건 무슨 뜻이에요?', 'What do you mean, freshness is a clock?', {
            say: ['신선도가 시계라는 건, 얼마나 버틴다는 뜻이에요?', 'When you say freshness is a clock — how long does it last?'],
            end: endTalk({ complete: 'ask_clock',
              lineKo: '잡은 순간부터 간다. 얼음이 그 시계를 늦추고, 얼음 아끼면 시계가 빨리 간다. 쿨러 뚜껑 자주 열지 마라. 열 때마다 시계가 한 칸씩 간다. 회로 먹을 건 빨리, 아니면 익혀. 그것만 알면 된다.',
              lineEn: "It starts ticking the moment you catch it. Ice slows the clock; skimp on ice and it runs fast. Don't keep opening the cooler lid. Every time you do, the clock moves on a notch. What you'll eat raw, eat soon — otherwise cook it. That's all you need to know." }),
            note: ['신선도가 시계라는 게 무슨 뜻이냐고 물었다. 잡은 순간부터 가는 시계를 얼음이 늦춘다고, 쿨러 뚜껑을 열 때마다 한 칸씩 간다고 했다.', "I asked what she meant by freshness being a clock. It starts ticking the moment you catch the fish and ice slows it down, she said — and every time you open the cooler lid it moves on a notch."] }),
        ],
        note: ['두께가 제각각인 회를 내밀었다. 정옥선 씨는 먹을 만하다며 자기가 쓰던 칼을 건넸다. 신선도는 시계라서 얼음을 아끼면 회가 아니라 사료가 된다고 했다.',
          "I held out my sashimi, the slices all different thicknesses. Okseon said it was good enough to eat and handed me the knife she used to use. Freshness is a clock, she said — skimp on ice and it's feed, not sashimi."],
      }),
      taste: scene([
        line(O, '(한 점 집어 먹는다.) …두껍다.', '(She picks up a piece and eats it.) ...Thick.'),
        line(O, '그래도 결은 맞았어.', 'But you followed the grain.'),
        line(P, '결이요?', 'The grain?'),
      ], {
        end: endTalk({ complete: 'taste',
          lineKo: '(한 점을 더 집는다.) 두께는 손이 알아서 맞춰 간다. 결은 처음부터 보는 사람만 본다. 그 칼은 쓰고 나면 바로 씻어서 말려. 젖은 채 두면 녹슨다.',
          lineEn: "(She picks up another piece.) Your hand will find the thickness on its own. The grain — only people who see it from the start ever see it. Wash that knife and dry it straight after you use it. Leave it wet and it rusts." }),
        note: ['한 점 드셔 보라고 내밀었다. 정옥선 씨는 두껍다면서도 결은 맞았다고 하고, 한 점을 더 집었다.', "I offered her a piece. Okseon said it was thick but that I'd followed the grain — and picked up another."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-08 「간이 백팩」 — 받는 자리(탁만수) · 죽간 공방 문을 두드렸다
  // ═══════════════════════════════════════════
  {
    id: 'm1_08_offer', questId: 'M1-08', at: 'offer', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(T, '누구냐.', 'Who is it?', { act: 'look_up' }),
        line(P, '아, 지나가다가 문이 열려 있어서요. 대나무 냄새가 나길래…', 'Oh, I was passing and the door was open. I smelled bamboo, so...'),
        line(T, '문 열려 있으면 다 들어오냐.', 'Do you walk into every open door?'),
        line(P, '…죄송해요.', "...Sorry."),
        line(T, '…짐부터 어떻게 좀 해라.', '...Do something about that load first.', { act: 'peer' }),
        line(P, '짐이요?', 'My load?'),
        line(T, '쿨러에, 미끼통에, 대까지 배낭 하나에 다 매달았잖아. 그 꼴로는 방파제에서 다 떨어뜨린다.', "Cooler, bait tub, rod — you've hung the lot off one backpack. Go out on a breakwater like that and you'll drop the lot."),
        line(P, '가방이 이거 하나뿐이라서요. 새로 하나 사야 하나…', "It's the only bag I have. Maybe I should buy a new one..."),
        line(T, '사기 전에 만들어 봐. 도면 하나 줄 테니까.', "Make one before you buy one. I'll give you a pattern."),
        line(T, '간이 백팩이다. 만들어서 등에 메 봐. 손으로 만들어 봐야 뭘 사야 할지 안다.', "A simple backpack. Make it and put it on. Only once you've made one with your hands will you know what to buy."),
      ], {
        choices: [
          opt('make', '만들어 볼게요. 뭘 만들어 본 적은 없지만요', "I'll make it. Though I've never made anything", {
            say: ['만들어 보겠습니다. 뭘 만들어 본 적은 없지만요.', "I'll try making it. Though I've never made anything before."],
            next: 'make' }),
          opt('why', '만들어 보면 뭘 사야 할지 안다는 건요?', 'How does making one tell me what to buy?', {
            say: ['만들어 보면 뭘 사야 할지 안다는 건 무슨 뜻이에요?', 'What do you mean, making one tells me what to buy?'],
            next: 'why' }),
          opt('joke', '이 꼴이 그렇게 심해요? 나름 다 챙긴 건데요', "Is it that bad? I thought I'd packed everything", { next: 'joke' }),
        ],
        note: ['문이 열려 있던 죽간 공방에 들어갔다가, 탁만수 씨가 내 짐부터 보았다. 배낭 하나에 쿨러와 미끼통과 대를 다 매단 꼴로는 방파제에서 다 떨어뜨린다며, 사기 전에 간이 백팩 도면으로 직접 만들어 메 보라고 했다.',
          "I wandered into the bamboo-rod workshop through its open door, and Tak Mansu looked at my load before anything else. Hanging a cooler, a bait tub and a rod off one backpack, I'd drop the lot on a breakwater, he said — before buying anything, I should make a simple backpack from his pattern and wear it."],
      }),
      make: scene([
        line(T, '없으니까 해 보는 거다. (도면을 작업대 위에 펴고 모서리를 돌로 누른다.)', "That's why you try. (He spreads the pattern on the workbench and weighs the corners down with stones.)"),
        line(T, '선대로 자르고 선대로 꿰매. 삐뚤어도 괜찮다.', 'Cut along the lines, sew along the lines. Crooked is fine.'),
        line(P, '삐뚤어도요?', 'Crooked is fine?'),
        line(T, '삐뚤어진 걸 메 봐야 어디가 틀렸는지 안다.', "Only by wearing the crooked one do you learn where you went wrong."),
      ], {
        end: endTalk({ accept: true, offer: 'make_it' }),
        note: ['만들어 본 적은 없지만 해 보겠다고 했다. 탁만수 씨는 도면을 작업대에 펴고, 선대로 자르고 꿰매되 삐뚤어도 괜찮다고 했다. 삐뚤어진 걸 메 봐야 어디가 틀렸는지 안다고.', "I said I'd never made anything but would try. Mansu spread the pattern on the bench: cut and sew along the lines, and crooked was fine. Only by wearing the crooked one do you learn where you went wrong."],
      }),
      why: scene([
        line(T, '가방 하나 만들어 보면 어깨끈이 왜 넓어야 하는지, 바닥은 왜 두꺼워야 하는지 손이 안다.', "Make one bag and your hands learn why the straps should be wide and why the bottom should be thick."),
        line(P, '손이 안다고요?', 'My hands learn?'),
        line(T, '그걸 알고 사면 안 속는다. 모르고 사면 비싼 것만 산다. 그 차이다.', "Buy knowing that and you won't be cheated. Buy without knowing and you only buy the expensive ones. That's the difference."),
        line(T, '도면 받아.', 'Take the pattern.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_why_make' }),
        note: ['만들어 보면 뭘 사야 할지 안다는 게 무슨 뜻이냐고 물었다. 가방 하나 만들어 보면 어깨끈이 왜 넓어야 하는지 손이 안다고, 알고 사면 안 속는다고 했다.', "I asked what he meant by making one telling me what to buy. Make one bag, he said, and your hands learn why the straps have to be wide — buy knowing that, and you won't be cheated."],
      }),
      joke: scene([
        line(T, '챙긴 게 아니라 매단 거다. 걸을 때마다 미끼통이 쿨러를 친다.', "You didn't pack it, you hung it. Every step, the bait tub bangs against the cooler."),
        line(T, '그 소리에 고기보다 사람이 먼저 달아나.', 'That racket sends people running before the fish.'),
        line(P, '…', '...'),
        line(T, '앉아. 오래 안 걸린다.', "Sit. It won't take long."),
      ], {
        choices: [
          opt('sit', '…앉을게요', "...I'll sit", {
            end: endTalk({ accept: true, offer: 'joke_load' }),
            note: ['더 할 말이 없어서 앉았다.', 'I had nothing to say to that, so I sat down.'] }),
          opt('notime', '지금은 바다 나갈 시간인데요. 오래 걸려요?', "It's time to go out to sea. Will this take long?", { next: 'notime' }),
        ],
        note: ['나름 다 챙긴 거라고 했더니, 탁만수 씨는 챙긴 게 아니라 매단 거라고 했다. 걸을 때마다 미끼통이 쿨러를 쳐서 그 소리에 사람이 먼저 달아난다고.', "When I said I'd packed everything, Mansu said I hadn't packed it, I'd hung it. The bait tub banged on the cooler every step, loud enough to send people running."],
      }),
      notime: scene([
        line(T, '바다는 내일도 있다. 가방은 오늘 안 만들면 내일도 없어.', "The sea will be there tomorrow. The bag won't, if you don't make it today."),
        line(T, '손이 빠르면 금방이고, 느리면 느린 대로 배우는 거다.', "Quick hands, it's done in no time. Slow hands, you learn at that pace."),
        line(P, '…', '...'),
        line(T, '짐 덜렁거리는 채로 방파제 나가 봐라. 반은 바다에 주고 온다.', "Go out on the breakwater with that load dangling. You'll give half of it to the sea."),
      ], {
        end: endTalk({ accept: true, offer: 'no_time' }),
        note: ['지금은 바다 나갈 시간이라고 했다. 바다는 내일도 있지만 가방은 오늘 안 만들면 내일도 없다고, 이대로 나가면 짐 반은 바다에 주고 온다고 했다.', "I said it was time to go out to sea. The sea would be there tomorrow, he said, but the bag wouldn't unless I made it today — go out like this and I'd give half my things to the sea."],
      }),
    },
  },

  // M1-08 — 끝내는 자리(탁만수)
  {
    id: 'm1_08_done', questId: 'M1-08', at: 'complete', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(P, '만들었어요. 메 봤고요.', "I made it. And I've put it on."),
        line(T, '돌아서 봐.', 'Turn around.'),
        line(P, '(등을 돌려 보인다.)', '(I turn my back to him.)'),
        line(T, '…삐뚤다.', '...Crooked.', { act: 'peer' }),
        line(P, '박음질이 좀… 네.', 'The stitching is a bit... yes.'),
        line(T, '그래도 멘 꼴은 봐 줄 만하다.', "Still, it doesn't look bad on you."),
        line(T, '다음엔 네가 깎아. 손은 손으로 배우는 거다.', 'Next time, you do the carving. Hands learn from hands.'),
      ], {
        choices: [
          opt('thanks', '손에 맞아요. 고맙습니다', 'It fits my hand. Thank you', {
            say: ['손에 맞습니다. 고맙습니다.', 'It fits my hand. Thank you.'],
            end: endTalk({ complete: 'thanks',
              lineKo: '대는 그래야 대다. 가방도 그렇고. 손에 맞는다는 말, 쉽게 나오는 말 아니다. 맞는 걸 알아보는 손이 있어야 나와. (깎던 대나무를 다시 집어 든다.)',
              lineEn: "That's what makes a rod a rod. A bag too. It fits my hand — that isn't something people say lightly. It takes a hand that knows what fits. (He picks up the bamboo he was carving again.)" }),
            note: ['손에 맞는다고, 고맙다고 했다. 탁만수 씨는 그 말은 쉽게 나오는 말이 아니라고, 맞는 걸 알아보는 손이 있어야 나온다고 했다.', "I told Mansu it fit my hand and thanked him. He said that wasn't something people said lightly — it took a hand that knew what fit."] }),
          opt('critic', '어깨끈이 좀 짧은데요. 도면이 그런 거예요?', 'The straps are a bit short. Is that the pattern?', {
            end: endTalk({ complete: 'critic',
              lineKo: '…길게 해 주지. 다음엔 네가 깎아. 눈은 있구나. (도면 귀퉁이에 무언가를 적는다.) 도면은 처음부터 맞는 게 아니다. 쓰는 사람이 고쳐 적어서 맞아지는 거다. 너도 메 보고 틀린 데 있으면 거기 적어. 그게 네 도면이 된다.',
              lineEn: "...I'll lengthen them. Next time you carve. You've got an eye. (He writes something in the corner of the pattern.) A pattern isn't right from the start. It becomes right as the people using it write in corrections. If you find something wrong when you wear it, write it there. Then it becomes your pattern." }),
            note: ['어깨끈이 짧은데 도면이 그런 거냐고 물었다. 탁만수 씨는 눈은 있다며 도면 귀퉁이에 무언가를 적었다. 도면은 쓰는 사람이 고쳐 적어서 맞아지는 거라고.', "I asked whether the short straps were the pattern's fault. Mansu said I had an eye and wrote something in the pattern's corner. A pattern becomes right as the people who use it write in corrections, he said."] }),
          opt('rod', '대나무로 낚싯대도 만드세요?', 'Do you make fishing rods from bamboo too?', { next: 'rod' }),
          opt('hands', '메고 걸으니 두 손이 비네요. 어색해요', "Walking with it on, my hands are empty. It feels odd", {
            say: ['메고 걸어 보니 두 손이 비네요. 어색해요.', "Walking around with it on, both my hands are free. It feels odd."],
            end: endTalk({ complete: 'hands_free',
              lineKo: '어색한 게 아니라 원래 그래야 하는 거다. 손은 짐 들라고 있는 게 아니야. (내 걸음을 한 번 보고 고개를 끄덕인다.) 방파제에선 두 손이 비어 있어야 산다. 미끄러질 때 짚을 손은 늘 남겨 둬.',
              lineEn: "It's not odd. That's how it should be. Hands aren't for carrying loads. (He watches me walk once and nods.) On a breakwater, empty hands keep you alive. Always keep a hand free to catch yourself when you slip." }),
            note: ['메고 걸으니 두 손이 비어 어색하다고 했다. 탁만수 씨는 원래 그래야 한다고, 방파제에선 미끄러질 때 짚을 손을 늘 남겨 두라고 했다.', "I said it felt odd having both hands free. Mansu said that was how it should be — on a breakwater, always keep a hand free to catch yourself if you slip."] }),
        ],
        note: ['간이 백팩을 만들어 메고 갔다. 탁만수 씨는 삐뚤다면서도 멘 꼴은 봐 줄 만하다고 했다. 다음엔 내가 깎으라고, 손은 손으로 배우는 거라고.',
          "I made the simple backpack and wore it over. Tak Mansu said it was crooked but didn't look bad on me. Next time I'd do the carving, he said — hands learn from hands."],
      }),
      rod: scene([
        line(T, '만들지. 오십 년을.', 'I do. For fifty years.'),
        line(T, '네 아버지 대도 여기서 봤을지 모른다.', "I may even have seen your father's rod in here.", { act: 'look_away' }),
        act(T, 'silence'),
        line(T, '…아니다, 그건 나중에.', "...No. Another time."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'ask_rod',
          lineKo: '(깎던 대나무를 내려놓지 않는다.) 오늘은 가방이다. 대 얘기는 짐부터 제대로 질 줄 아는 사람한테나 하는 거다. 그 대, 함부로 굴리지나 마라.',
          lineEn: "(He doesn't put down the bamboo he's carving.) Today is about the bag. Talk of rods is for people who can carry a load properly first. Just don't knock that rod about." }),
        note: ['대나무로 낚싯대도 만드느냐고 물었다. 오십 년을 만들었다고, 내 아버지 대도 여기서 봤을지 모른다고 하다가 그건 나중에 하자며 말을 끊었다.', "I asked if he made bamboo rods too. For fifty years, he said — he might even have seen my father's rod in here. Then he cut himself off: another time."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-09 「밤바다」 — 받는 자리(정옥선) · 물때표를 처음 읽는다
  // ═══════════════════════════════════════════
  {
    id: 'm1_09_offer', questId: 'M1-09', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '물때표 읽을 줄 알아?', 'Can you read a tide table?', { act: 'look_up' }),
        line(P, '물때표요? …숫자 빽빽하게 적힌 그거요?', "A tide table? ...The one crammed with numbers?"),
        line(O, '그거. 오늘 새벽에 물이 많이 빠진다. 간조다.', "That one. The water goes out a long way before dawn today. Low tide."),
        line(P, '물이 빠지면 뭘 할 수 있는데요?', 'What can you do when the water goes out?'),
        line(O, '갯바위로 내려가서 손으로 줍는 거다. 바위틈에 붙은 것들. 두 마리만 건져 와.', "You go down onto the rocks and pick things up by hand. The things clinging in the cracks. Bring back two."),
        line(P, '새벽에요? 깜깜할 텐데요.', "Before dawn? It'll be pitch dark."),
        line(O, '물은 해 뜨는 거 안 기다린다. 랜턴 챙겨.', "The tide doesn't wait for sunrise. Take a lantern."),
        line(O, '그리고 어장 표지 안쪽은 넘지 마.', "And don't cross inside the fishery markers."),
        line(O, '넘으면 내가 아니라 법이 잡는다.', "Cross them and it won't be me who catches you. It'll be the law."),
      ], {
        choices: [
          opt('learn', '읽을 줄은 모르지만, 오늘 배울게요', "I can't read it, but I'll learn today", {
            say: ['읽을 줄은 모르지만, 오늘 배우겠습니다.', "I don't know how to read it, but I'll learn today."],
            next: 'learn' }),
          opt('markers', '어장 표지요? 그 안쪽은 왜 안 돼요?', 'Fishery markers? Why not inside them?', { next: 'markers' }),
          opt('scared', '밤바다는 처음이라… 솔직히 좀 무서워요', "I've never been out at night... honestly, I'm a bit scared", { next: 'scared' }),
        ],
        note: ['정옥선 씨가 물때표를 읽을 줄 아느냐고 물었다. 오늘 새벽 물이 많이 빠지니 랜턴을 챙겨 갯바위로 내려가 두 마리를 건져 오라고, 어장 표지 안쪽은 넘지 말라고 했다.',
          "Jeong Okseon asked if I could read a tide table. The water would go out a long way before dawn, she said — take a lantern, go down onto the rocks, bring back two, and don't cross inside the fishery markers."],
      }),
      learn: scene([
        line(O, '(물때표를 좌판 위에 편다.) 여기 숫자가 물 높이다. 제일 낮은 데가 간조. 내려가는 건 그 앞뒤로만이다.', "(She spreads the tide table on the stall.) These numbers are the water height. The lowest is low tide. You only go down around then."),
        line(P, '그 앞뒤로만이요.', 'Only around then.'),
        line(O, '물은 빠질 땐 천천히 빠지고, 들어올 땐 소리 없이 들어온다. 발목이 젖기 시작하면 그때 바로 올라와.', "The water goes out slowly and comes back in without a sound. The moment your ankles start getting wet, come straight up."),
      ], {
        choices: [
          opt('ok', '발목이 젖으면 바로 올라올게요', "The moment my ankles get wet, I'll come up", {
            end: endTalk({ accept: true, offer: 'learn_tide' }),
            note: ['발목이 젖기 시작하면 바로 올라오기로 했다.', 'I promised to come straight up the moment my ankles started getting wet.'] }),
          opt('joke', '법한테 잡히는 게 정옥선 씨한테 잡히는 것보단 낫겠어요', "Getting caught by the law beats getting caught by you", { next: 'joke' }),
        ],
        note: ['물때표 읽는 법을 처음 배웠다. 숫자가 물 높이고 제일 낮은 데가 간조라고, 물은 들어올 땐 소리 없이 들어오니 발목이 젖으면 바로 올라오라고 했다.', "I learned to read a tide table for the first time. The numbers are the water height and the lowest is low tide — and since the water comes back in without a sound, I was to come up the moment my ankles got wet."],
      }),
      joke: scene([
        line(O, '(눈을 가늘게 뜬다.) 내가 잡으면 꿀밤이고 법이 잡으면 벌금이다.', "(She narrows her eyes.) If I catch you, it's a knock on the head. If the law does, it's a fine."),
        line(O, '어느 쪽이 나은지 계산해 봐.', 'Work out which is better.'),
        line(P, '…꿀밤이 낫겠네요.', '...The knock on the head, I suppose.'),
        line(O, '어장 표지 안쪽에선 손도 넣지 마. 몰랐다는 말은 안 통한다.', "Don't even put your hand in past the markers. Saying you didn't know won't wash."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_law' }),
        note: ['법한테 잡히는 게 낫겠다고 농담했더니, 정옥선 씨는 자기가 잡으면 꿀밤이고 법이 잡으면 벌금이라며 어느 쪽이 나은지 계산해 보라고 했다. 몰랐다는 말은 안 통한다고.', "I joked that the law would be kinder than her. Okseon said she'd give me a knock on the head while the law would give me a fine — work out which was better. Saying I didn't know wouldn't wash."],
      }),
      markers: scene([
        line(O, '마을어업권이다. 그 안쪽 전복, 해삼, 소라는 마을 사람들이 같이 키워서 나누는 거야.', "It's the village fishery right. The abalone, sea cucumbers and turban shells in there are raised together by the village and shared."),
        line(P, '바다인데도 주인이 있는 거네요.', 'So even the sea has owners.'),
        line(O, '남의 밭에서 무 뽑으면 도둑이지? 바다도 같다.', "Pull a radish out of someone else's field and you're a thief, aren't you? The sea is the same."),
        line(O, '표지 바깥에서, 허락된 걸로만 해.', 'Stay outside the markers, and take only what you are allowed.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_markers' }),
        note: ['어장 표지 안쪽은 왜 안 되느냐고 물었다. 마을어업권이라, 그 안의 전복이며 소라는 마을 사람들이 같이 키워 나누는 것이라고 했다. 남의 밭에서 무를 뽑는 것과 같다고.', "I asked why I couldn't go inside the markers. It was the village fishery right, she said — the abalone and turban shells in there were raised together by the village and shared. Like pulling radishes from someone else's field."],
      }),
      scared: scene([
        line(O, '무서운 게 맞다. 안 무서운 놈이 물에 빠진다.', "Being scared is right. The ones who aren't are the ones who fall in."),
        line(O, '랜턴은 발밑만 비추지 말고 가끔 멀리도 비춰. 물이 어디까지 왔는지 봐야 하니까.', "Don't just shine the lantern at your feet. Shine it out further now and then. You need to see how far the water has come."),
        line(P, '멀리도요. 알겠어요.', 'Further out too. Got it.'),
        line(O, '손 시리면 미련 없이 올라와.', 'When your hands go numb, come up without a second thought.'),
      ], {
        end: endTalk({ accept: true, offer: 'scared_night' }),
        note: ['밤바다는 처음이라 무섭다고 털어놓았다. 무서운 게 맞다고, 안 무서운 사람이 물에 빠진다고 했다. 랜턴은 가끔 멀리도 비춰 물이 어디까지 왔는지 보라고.', "I admitted I was scared of the sea at night. Being scared was right, she said — it's the ones who aren't who fall in. Shine the lantern further out now and then, to see how far the water has come."],
      }),
    },
  },

  // M1-09 — 끝내는 자리(정옥선)
  {
    id: 'm1_09_done', questId: 'M1-09', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '살아 돌아왔으면 반은 성공이다.', "If you came back alive, that's half the job done."),
        line(P, '두 마리 건졌어요. 물 들어오기 전에 올라왔고요.', 'I got two. And I came up before the tide came in.'),
        line(O, '어디.', "Let's see.", { act: 'peer' }),
        line(O, '됐다. 손 시리지.', "That'll do. Your hands are frozen, aren't they."),
        line(P, '손가락이 아직 잘 안 펴져요.', "My fingers still won't straighten properly."),
        act(O, 'give', { to: P, item: 'qr_headlamp_trainee' }),
        line(O, '이건 계에서 실습생한테 주는 랜턴이다. 네 것보다 밝아.', "This is the lamp the co-op gives trainees. It's brighter than yours."),
        line(P, '…밝네요.', "...It's bright.", { act: 'receive' }),
      ], {
        choices: [
          opt('cold', '손이 얼어서 그물도 못 잡겠어요', "My hands are too frozen to even grip a net", {
            end: endTalk({ complete: 'cold',
              lineKo: '그게 바다다. 오한 들기 전에 들어가. 병원비가 조과보다 비싸. (따뜻한 물 한 잔을 밀어 준다.) 젖은 옷부터 벗어. 바람 맞은 몸은 물보다 빨리 식는다. 다음엔 장갑을 두 켤레 챙겨. 하나는 젖으라고 끼는 거다.',
              lineEn: "That's the sea. Get inside before the chills set in. A hospital bill costs more than the catch. (She pushes a cup of warm water towards me.) Get out of those wet clothes first. A body in the wind cools faster than water. Next time, bring two pairs of gloves. One pair is for getting wet." }),
            note: ['손이 얼어서 그물도 못 잡겠다고 했다. 정옥선 씨는 따뜻한 물 한 잔을 밀어 주며, 다음엔 장갑을 두 켤레 챙기라고 했다. 하나는 젖으라고 끼는 거라고.', "I said my hands were too frozen to grip a net. Okseon pushed a cup of warm water at me and told me to bring two pairs of gloves next time — one pair is for getting wet."] }),
          opt('excited', '밤바다가 이렇게 다른 줄 몰랐어요', "I never knew the sea at night was so different", {
            say: ['밤바다가 이렇게 다른 줄 몰랐어요. 다시 나가고 싶어요.', "I never knew the sea at night was so different. I want to go out again."],
            end: endTalk({ complete: 'excited',
              lineKo: '…그 눈, 조심해. 밤에 홀린 사람이 제일 먼저 미끄러진다. 그래도 나가려면 랜턴은 그걸로 해. 나갈 땐 물때표부터 보고, 나간다고 누구한테든 말하고 가. 아무도 모르게 나가면 무슨 일이 나도 아무도 모른다.',
              lineEn: "...Watch that look in your eye. The ones the night bewitches are the first to slip. If you're going out anyway, use that lamp. Check the tide table before you go, and tell someone you're going. Go out without anyone knowing, and if something happens, no one will know." }),
            note: ['밤바다가 이렇게 다른 줄 몰랐다고, 다시 나가고 싶다고 했다. 정옥선 씨는 밤에 홀린 사람이 제일 먼저 미끄러진다며, 나갈 땐 누구한테든 말하고 가라고 했다.', "I said I'd never known the sea at night was so different, and that I wanted to go again. Okseon said the ones the night bewitches slip first — whenever I went, I was to tell someone."] }),
          opt('kept', '표지 안쪽에 소라가 잔뜩 보였는데, 안 건드렸어요', "I saw lots of turban shells inside the markers. I left them alone", { next: 'kept' }),
        ],
        note: ['갯바위에서 두 마리를 건져 물 들어오기 전에 올라왔다. 정옥선 씨는 살아 돌아왔으면 반은 성공이라며, 계에서 실습생에게 주는 랜턴을 건넸다. 내 것보다 밝았다.',
          "I brought back two from the rocks and came up before the tide turned. Okseon said coming back alive was half the job, and gave me the lamp the co-op gives its trainees. It was brighter than mine."],
      }),
      kept: scene([
        line(O, '…잘했다.', '...Well done.', { act: 'nod' }),
        line(O, '거기서 손 넣는 사람 많다. 아무도 안 보는 밤이라고.', "Plenty of people reach in there. Because it's night and nobody's watching."),
        line(P, '보는 사람은 없었어요. 그래서 더 안 건드렸어요.', "There was no one watching. That's why I left them all the more."),
      ], {
        end: endTalk({ complete: 'kept_out',
          lineKo: '밤에 지키는 법이 진짜다. 낮엔 다들 지켜. (랜턴 끈을 내 손목에 감아 준다.)',
          lineEn: "The law you keep at night is the real one. Everyone keeps it by day. (She winds the lamp strap around my wrist.)" }),
        note: ['표지 안쪽에 소라가 잔뜩 보였지만 건드리지 않았다고 했다. 정옥선 씨는 잘했다고, 밤에 지키는 법이 진짜라고 하며 랜턴 끈을 내 손목에 감아 주었다.', "I told her I'd seen lots of turban shells inside the markers but left them. Okseon said well done — the law you keep at night is the real one — and wound the lamp strap around my wrist."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-10 「공동작업」 — 받는 자리(어촌계 사무실) · 이름 대신 「실습생」
  // ═══════════════════════════════════════════
  {
    id: 'm1_10_offer', questId: 'M1-10', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '실습생.', 'Trainee.'),
        line(P, '…저요?', '...Me?', { act: 'look_up' }),
        line(C, '여기 실습생이 너 말고 또 있냐. 공동작업 시간이다.', "Is there another trainee here besides you? It's time for community work."),
        line(P, '공동작업이요?', 'Community work?'),
        line(C, '계 일이다. 오늘은 다 같이 나와서 그물 걷고, 미역 정리하는 날이야.', "Co-op work. Today everyone turns out to haul the nets and sort the seaweed."),
        line(C, '너는 양망 보조부터 해.', 'You start by helping with the net hauling.'),
        line(P, '(실습생. 여기선 아무도 내 이름을 부르지 않는다.)', "(Trainee. Here, nobody calls me by my name.)"),
        line(C, '끝나면 창고 뒤에 자전거 하나 있다. 고쳐서 타.', "When you're done, there's a bicycle behind the warehouse. Fix it and ride it."),
        line(C, '걸어서는 항구가 너무 넓어.', 'The harbour is too big to cover on foot.'),
      ], {
        choices: [
          opt('work', '실습생이라도 좋습니다. 일 주십시오', 'Trainee is fine. Give me work', { next: 'work' }),
          opt('net', '양망 보조요? 그물 걷는 일입니까?', 'Helping with the hauling? Pulling in nets?', { next: 'net' }),
          opt('bike', '창고 뒤 자전거요? 제가 고쳐 타도 됩니까?', 'The bicycle behind the warehouse? I can fix it and ride it?', { next: 'bike' }),
        ],
        note: ['어촌계 공동작업 날이다. 아무도 내 이름을 부르지 않고, 다들 실습생이라고만 했다. 양망 보조부터 하고, 끝나면 창고 뒤 자전거를 고쳐 타라고 했다. 걸어서는 항구가 너무 넓다고.',
          "It was the co-op's community work day. Nobody called me by name — only trainee. I was to start by helping haul the nets, then fix the bicycle behind the warehouse and ride it. The harbour was too big to cover on foot."],
      }),
      work: scene([
        line(C, '좋다 나쁘다는 네가 정하는 게 아니다. 일하는 걸 보고 우리가 정한다.', "Whether it's fine isn't for you to decide. We'll decide after we've watched you work."),
        line(C, '양망은 앞사람 손 박자에 맞춰 당겨. 혼자 세게 당기면 그물 찢어진다.', "When hauling, pull in time with the hands in front of you. Pull hard on your own and the net tears."),
        line(P, '앞사람 박자에 맞춰서요.', 'In time with the person in front.'),
        line(C, '장갑은 저기 있다.', 'Gloves are over there.'),
      ], {
        choices: [
          opt('go', '장갑 끼고 나가겠습니다', "I'll put on gloves and go", {
            end: endTalk({ accept: true, offer: 'give_work' }),
            note: ['장갑을 끼고 양망에 나갔다.', 'I put on gloves and went out to help haul.'] }),
          opt('pay', '공동작업이면, 품삯은 나옵니까?', 'For community work — is there pay?', { next: 'pay' }),
        ],
        note: ['실습생이라도 좋으니 일을 달라고 했다. 좋고 나쁨은 일하는 걸 보고 계에서 정한다고 했다. 양망은 앞사람 손 박자에 맞춰 당기라고.', "I said trainee was fine and asked for work. Whether it was fine, they'd decide after watching me work. Haul in time with the hands in front, I was told."],
      }),
      pay: scene([
        line(C, '나온다. 일한 만큼. 계 일은 계에서 준다.', 'There is. As much as you work. The co-op pays for co-op work.'),
        line(C, '대신 일 덜 하고 품삯 같이 받으려는 사람은 바로 티 난다. 여기선 다 같이 보니까.', "But anyone who works less and wants the same pay shows it straight away. Here, everyone watches everyone."),
        line(P, '…알겠습니다.', '...Understood.'),
        line(C, '양망부터 가.', 'Off to the nets.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_pay' }),
        note: ['품삯은 나오느냐고 물었다. 일한 만큼 계에서 준다고, 다만 덜 하고 같이 받으려는 사람은 다 같이 보니까 바로 티가 난다고 했다.', "I asked if there was pay. The co-op paid for as much as you worked, I was told — but anyone who worked less and wanted the same would show it at once, since everyone watched."],
      }),
      net: scene([
        line(C, '그래. 바다에 놓은 그물을 끌어올리는 거다.', "That's right. Pulling up the nets laid in the sea."),
        line(C, '너는 보조니까 올라온 그물 받아서 개고, 걸린 거 떼어 내.', "You're helping, so take the net as it comes up, fold it, and pick out whatever's caught."),
        line(P, '조심할 건 없습니까?', 'Anything I should watch out for?'),
        line(C, '손 다치는 건 그물코에 손가락 끼울 때다. 장갑 끼고, 서두르지 마.', "Hands get hurt when fingers catch in the mesh. Wear gloves and don't rush."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_net' }),
        note: ['양망 보조가 무슨 일인지 물었다. 끌어올린 그물을 받아 개고 걸린 것을 떼어 내는 일이고, 그물코에 손가락이 끼면 다치니 장갑을 끼고 서두르지 말라고 했다.', "I asked what helping with the hauling meant. Taking the net as it came up, folding it and picking out what was caught — and wearing gloves and not rushing, since fingers get hurt in the mesh."],
      }),
      bike: scene([
        line(C, '주인 없는 거다. 몇 해째 거기 서 있어. 고치면 네가 타는 거고.', "Nobody owns it. It's been standing there for years. Fix it and it's yours to ride."),
        line(P, '어디가 고장 났습니까?', "What's wrong with it?"),
        line(C, '그건 네가 봐. 양망 끝나고 해라. 일 먼저.', 'You find out. Do it after the hauling. Work first.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_bike' }),
        note: ['창고 뒤 자전거를 고쳐 타도 되느냐고 물었다. 몇 해째 주인 없이 서 있던 것이라 고치면 내가 타는 거라고 했다. 다만 양망이 먼저라고.', "I asked if I could fix and ride the bicycle behind the warehouse. It had stood there ownerless for years, so if I fixed it, it was mine to ride — but hauling came first."],
      }),
    },
  },

  // M1-10 — 끝내는 자리(어촌계 사무실)
  {
    id: 'm1_10_done', questId: 'M1-10', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(P, '양망이랑 미역 정리, 끝냈습니다. 자전거도 고쳐서 타 봤습니다.', "The nets and the seaweed are done. I fixed the bicycle and rode it, too."),
        line(C, '봤다. 삐걱대는 소리가 여기까지 들리더라.', 'I saw. I could hear it creaking from here.'),
        line(C, '수고했다, 실습생.', 'Good work, trainee.'),
        act(C, 'give', { to: P }),
        line(C, '품삯이다.', 'Your pay.'),
        line(P, '감사합니다.', 'Thank you.', { act: 'receive' }),
        line(C, '오늘 해 보니 어느 쪽 일이 손에 붙던?', 'Having done it today — which work came easiest to your hands?'),
        line(P, '글쎄요…', 'Well...'),
        line(C, '처음 하나는 뭐든 좋다. 네가 바다에서 뭘 하고 싶은지, 손이 먼저 말해 줄 거다.', "Any first choice is fine. Your hands will tell you what you want to do at sea before you know it."),
      ], {
        choices: [
          opt('name', '저한테도 이름이 있습니다', 'I have a name too', { next: 'name' }),
          opt('work', '내일도 나오겠습니다', "I'll come again tomorrow", {
            end: endTalk({ complete: 'work',
              lineKo: '그래. 내일은 그물이다. 손 아플 거야. 아픈 손은 사흘이면 굳는다. 굳으면 그때부터 일이 손에 붙어. 늦지 마라. 그물은 사람 기다려 주지 않는다.',
              lineEn: "Good. Tomorrow it's nets. Your hands will hurt. Sore hands harden in three days. Once they harden, the work starts to stick. Don't be late. Nets don't wait for people." }),
            note: ['내일도 나오겠다고 했다. 내일은 그물이고 손이 아플 거라고, 늦지 말라고 했다. 그물은 사람을 기다려 주지 않는다고.', "I said I'd come again tomorrow. Tomorrow was nets and my hands would hurt, I was told — don't be late. Nets don't wait for people."] }),
          opt('unsure', '뭘 하고 싶은지는… 아직 모르겠습니다', "What I want to do... I don't know yet", {
            say: ['바다에서 뭘 하고 싶은지는… 아직 모르겠습니다.', "What I want to do at sea... I don't know yet."],
            end: endTalk({ complete: 'unsure_path',
              lineKo: '모르는 게 정상이다. 지금 다 알면 그게 더 이상한 거지. 그러니까 처음 하나는 아무 데나 해 봐. 해 보면 맞는지 안다. 아끼느라 아무것도 안 하는 사람이 제일 늦다.',
              lineEn: "Not knowing is normal. It'd be stranger if you knew it all now. So pick any first one and try it. You'll know if it fits once you do. The ones who hold back and do nothing are always the slowest." }),
            note: ['바다에서 뭘 하고 싶은지 아직 모르겠다고 했다. 모르는 게 정상이니 처음 하나는 아무거나 해 보라고, 아끼느라 아무것도 안 하는 사람이 제일 늦다고 했다.', "I said I didn't know yet what I wanted to do at sea. Not knowing was normal, I was told — try any first thing. The ones who hold back and do nothing are slowest."] }),
        ],
        note: ['양망과 미역 정리를 마치고 자전거도 고쳐 탔다. 수고했다, 실습생, 하며 품삯을 주었다. 처음 하나는 뭐든 좋다고, 바다에서 뭘 하고 싶은지 손이 먼저 말해 줄 거라고 했다.',
          "I finished the hauling and the seaweed, and fixed and rode the bicycle. Good work, trainee, they said, and handed me my pay. Any first choice was fine — my hands would tell me what I wanted to do at sea."],
      }),
      name: scene([
        line(C, '알지.', 'I know.'),
        line(C, '총회 지나면 부른다. 그때까지는 실습생이야. 규칙이다.', "After the general meeting, we'll use it. Until then you're trainee. That's the rule."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'name',
          lineKo: '(그래도 명부를 펴서, 내 이름을 한 번 적어 본다.) …총회 날까지 그 이름 잘 들고 있어라.',
          lineEn: "(Even so, the register is opened and my name is written in it, just once.) ...Hold on to that name until the meeting." }),
        note: ['나에게도 이름이 있다고 했다. 총회 지나면 부른다고, 그때까지는 실습생이 규칙이라고 했다. 그래도 명부를 펴서 내 이름을 한 번 적어 주었다.', "I said I had a name too. They'd use it after the general meeting, I was told — until then, trainee was the rule. Still, the register was opened and my name written in it once."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M1-11 「총회」 — 받는 자리(어촌계장)
  // ═══════════════════════════════════════════
  {
    id: 'm1_11_offer', questId: 'M1-11', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '총회 날이 잡혔다.', 'The date for the general meeting is set.'),
        line(P, '총회요? …제가 계원이 되는지 정하는 자리 말입니까?', 'The general meeting? ...You mean where they decide whether I become a member?'),
        line(C, '그래. 백팔십 일, 거의 다 됐지.', "That's right. The hundred and eighty days are nearly up."),
        line(P, '…벌써 그렇게 됐네요.', '...Already.'),
        line(C, '서류 네 장 챙겨라. 그리고 몸.', 'Get your four documents together. And your body.'),
        line(P, '몸이요?', 'My body?'),
        line(C, '바다 일 버틸 몸이 돼 있어야 한다. 서류만 들고 서는 사람한테는 계원들이 손을 안 든다.', "You need a body that can take sea work. Members don't raise their hands for someone who stands there with nothing but papers."),
        line(C, '그리고 네가 백팔십 일 동안 한 일. 그걸 다 들고 서라.', 'And everything you did in those hundred and eighty days. Stand there with all of it.'),
        line(C, '이름은 그날 부른다.', "Your name will be called that day."),
        line(P, '(…그날, 처음으로.)', '(...That day. For the first time.)'),
      ], {
        choices: [
          opt('ready', '서류는 다 챙기겠습니다. 그날 서겠습니다', "I'll have the documents. I'll stand that day", { next: 'ready' }),
          opt('docs', '서류 네 장이요? 뭐가 필요합니까?', 'Four documents? Which ones?', { next: 'docs' }),
          opt('nervous', '사람들이 손을 안 들어 주면 어떡합니까?', "What if nobody raises their hand for me?", { next: 'nervous' }),
        ],
        note: ['총회 날이 잡혔다. 서류 네 장과 바다 일을 버틸 몸, 그리고 백팔십 일 동안 한 일을 다 들고 서라고 했다. 이름은 그날 부른다고.',
          "The date for the general meeting was set. I was to stand there with four documents, a body that could take sea work, and everything I'd done in a hundred and eighty days. My name would be called that day."],
      }),
      ready: scene([
        line(C, '서류는 종이다. 사람들이 보는 건 네가 백팔십 일 동안 얼굴 보인 횟수야.', "Documents are paper. What people look at is how many times you showed your face in a hundred and eighty days."),
        line(P, '얼굴 보인 횟수요.', 'How many times I showed my face.'),
        line(C, '그날은 깨끗한 옷 입고 와. 말은 짧게 하고.', 'Wear clean clothes that day. Keep what you say short.'),
        line(C, '길게 말하는 사람치고 일 잘하는 사람 못 봤다.', "I've never met anyone who talks long and works well."),
      ], {
        end: endTalk({ accept: true, offer: 'ready' }),
        note: ['서류를 다 챙겨 그날 서겠다고 했다. 서류는 종이고, 사람들이 보는 건 백팔십 일 동안 얼굴 보인 횟수라고 했다. 깨끗한 옷을 입고 말은 짧게 하라고.', "I said I'd have the documents and stand on the day. Documents were paper, I was told — people looked at how often I'd shown my face. Clean clothes, and keep it short."],
      }),
      docs: scene([
        line(C, '신고어업 등록증, 예비계원 추천서, 실습 일지. 그리고 보증서.', 'A registered-fishing certificate, a letter recommending you as a provisional member, your training log. And a guarantee.'),
        line(P, '보증서는 누가 써 줍니까?', 'Who writes the guarantee?'),
        line(C, '이 항구 사람이 서 줘야 한다. 누가 서 줄지는 네가 알 거다.', "Someone from this harbour has to vouch for you. You'll know who."),
        line(C, '백팔십 일 동안 누구 일을 했는지 생각해 봐.', 'Think about whose work you did for a hundred and eighty days.'),
        line(P, '(…좌판의 얼음 상자가 먼저 떠올랐다.)', "(...The ice box at the stall came to mind first.)"),
      ], {
        end: endTalk({ accept: true, offer: 'ask_docs' }),
        note: ['서류 네 장이 뭐냐고 물었다. 신고어업 등록증, 예비계원 추천서, 실습 일지, 그리고 이 항구 사람이 서 주는 보증서라고 했다. 누구 일을 했는지 생각해 보라는 말에 좌판 얼음 상자가 먼저 떠올랐다.', "I asked which four documents. A registered-fishing certificate, a provisional-member recommendation, my training log, and a guarantee from someone in the harbour. Told to think about whose work I'd done, I thought first of the ice box at the stall."],
      }),
      nervous: scene([
        line(C, '그럼 네가 한 일이 그 정도였던 거다.', "Then what you did only amounted to that."),
        act(C, 'silence'),
        line(C, '…그렇게 겁먹을 거 없다. 백팔십 일 동안 얼음 나르고 그물 걷은 사람을 다들 봤다.', "...No need to look so scared. Everyone has seen the one who carried ice and hauled nets for a hundred and eighty days."),
        line(C, '본 걸로 손 드는 거야. 그날까지 하던 일이나 계속해.', "People raise their hands for what they've seen. Keep doing what you've been doing until then."),
      ], {
        end: endTalk({ accept: true, offer: 'nervous_vote' }),
        note: ['사람들이 손을 안 들어 주면 어떡하느냐고 물었다. 그럼 내가 한 일이 그 정도였던 거라고 하더니, 잠시 뒤 겁먹을 것 없다고 했다. 다들 본 걸로 손을 든다고.', "I asked what if nobody raised their hand. Then that was all my work had amounted to — and then, after a pause, there was no need to be scared. People raise their hands for what they've seen."],
      }),
    },
  },

  // M1-11 — 끝내는 자리(어촌계장) · 처음으로 이름이 불린 뒤
  {
    id: 'm1_11_done', questId: 'M1-11', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '어촌계원 승낙이다.', 'Accepted as a member of the co-op.'),
        line(P, '…방금, 제 이름 부르신 거 맞습니까?', '...Just now — that was my name you called?'),
        line(C, '맞다. {player} 씨. 한 번 더 불러 줄까.', "It was. {player}. Want me to say it again?"),
        line(P, '…아니요. 한 번이면 됩니다.', "...No. Once is enough."),
        line(C, '오늘부터 부산 위판장도 네 자리다.', 'From today, the Busan auction floor is yours too.'),
        line(P, '부산이요?', 'Busan?'),
        line(C, '계원은 위판에 상자를 낸다. 부산이 제일 크다.', 'Members put their crates up at auction. Busan is the biggest.'),
        line(C, '잊지 마라. 그 이름으로 하는 일은 다 계의 일이다.', "Don't forget. Everything you do under that name is the co-op's business."),
      ], {
        choices: [
          opt('humble', '아직 배울 게 많습니다. 계원이라는 말이 무겁습니다', "I've a lot to learn. The word member feels heavy", {
            end: endTalk({ complete: 'humble',
              lineKo: '그 말 하는 놈이 오래 간다. (명부 첫 장을 펴 보인다. 어촌계원, 그 아래 내 이름.) 무거우면 무거운 대로 들고 다녀. 가벼워지는 날이 오면 그때 조심해. 계원 이름 달고 사고 치는 사람들은 다 그 말을 가볍게 한 사람들이다.',
              lineEn: "The ones who say that last. (The first page of the register is held open for me. Co-op member, and beneath it, my name.) If it's heavy, carry it heavy. When the day comes that it feels light, be careful. Everyone who causes trouble under a member's name took that word lightly." }),
            note: ['아직 배울 게 많고 계원이라는 말이 무겁다고 했다. 명부 첫 장에 어촌계원, 그 아래 내 이름이 있었다. 가벼워지는 날이 오면 그때 조심하라고 했다.', "I said I had a lot to learn and the word member felt heavy. On the first page of the register: co-op member, and under it, my name. When it starts to feel light, I was told, be careful."] }),
          opt('proud', '백팔십 일, 다 채웠습니다', "I made it through all hundred and eighty days", {
            end: endTalk({ complete: 'proud',
              lineKo: '채운 건 날짜지. 계원은 이제부터다. 부산 위판장에서 보자. 부산은 여기랑 다르다. 상자 하나하나에 네 이름이 붙는다. 날짜 채운 걸로 뽐내는 건 오늘까지만 해라. 내일부턴 상자로 말해.',
              lineEn: "What you filled was days. Being a member starts now. See you on the Busan auction floor. Busan isn't like here. Every single crate carries your name. Boast about the days until tonight. From tomorrow, let your crates do the talking." }),
            note: ['백팔십 일을 다 채웠다고 했다. 채운 건 날짜고 계원은 이제부터라고, 부산에선 상자 하나하나에 내 이름이 붙으니 내일부턴 상자로 말하라고 했다.', "I said I'd made it through all hundred and eighty days. What I'd filled was days, I was told; being a member started now. In Busan every crate would carry my name, so from tomorrow, let the crates talk."] }),
          opt('hyeonsu', '도현수 씨가 반대하지 않은 게 뜻밖입니다', "I'm surprised Hyeonsu didn't vote against me", { next: 'hyeonsu' }),
          opt('thanks', '정옥선 씨께 먼저 인사드리고 오겠습니다', "I'll go and thank Okseon first", {
            say: ['보증서 써 주신 정옥선 씨께 먼저 인사드리고 오겠습니다.', "I'll go and thank Okseon first, for writing my guarantee."],
            end: endTalk({ complete: 'thank_guarantor',
              lineKo: '그래야지. 그 도장은 아무한테나 안 찍어 준다. (명부를 덮는다.) 계원이 돼도 좌판 얼음은 계속 날라라. 이름 불렸다고 하던 일 놓는 사람은 다음 총회에서 표를 잃는다.',
              lineEn: "As you should. That seal isn't stamped for just anyone. (The register is closed.) Even as a member, keep carrying ice for the stall. People who drop their old work once their name's been called lose votes at the next meeting." }),
            note: ['보증서를 써 준 정옥선 씨께 먼저 인사드리고 오겠다고 했다. 그 도장은 아무한테나 안 찍어 준다고, 계원이 돼도 좌판 얼음은 계속 나르라고 했다.', "I said I'd go and thank Okseon first, for my guarantee. That seal wasn't stamped for just anyone, I was told — and member or not, I should keep carrying ice for her stall."] }),
        ],
        note: ['총회장에서 처음으로 내 이름이 불렸다. 어촌계원 승낙이었다. 오늘부터 부산 위판장도 내 자리라고, 그 이름으로 하는 일은 다 계의 일이라는 걸 잊지 말라고 했다.',
          "At the general meeting, my name was called for the first time. I was accepted as a co-op member. From today the Busan auction floor was mine too — and I was not to forget that everything I did under that name was the co-op's business."],
      }),
      hyeonsu: scene([
        line(C, '…그 애는 반대표를 안 던진 게 아니라 못 던진 거다.', "...It isn't that he didn't vote against you. He couldn't.", { act: 'look_away' }),
        line(C, '네가 뭘 했는지 다 봤으니까.', 'He saw everything you did.'),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'hyeonsu',
          lineKo: '그 얘긴 본인한테 들어.',
          lineEn: 'Hear the rest from him.' }),
        note: ['도현수 씨가 반대하지 않은 게 뜻밖이라고 했다. 그 애는 반대표를 안 던진 게 아니라 못 던진 거라고, 내가 한 일을 다 봤으니까라는 대답이 돌아왔다. 그 얘긴 본인한테 들으라고.', "I said I was surprised Hyeonsu hadn't voted against me. It wasn't that he hadn't, came the answer — he couldn't, because he'd seen everything I did. Hear the rest from him, I was told."],
      }),
    },
  },
];
