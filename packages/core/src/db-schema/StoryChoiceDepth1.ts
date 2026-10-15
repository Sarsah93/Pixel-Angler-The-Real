/**
 * @file StoryChoiceDepth1.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 1묶음: 메인 1 · 2장(M1-01 ~ M2-11).
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { d } from './StoryChoiceDepthKit.js';

export const CHOICE_DEPTH_1: Record<string, ChoiceDepthEntry> = {
  // ── 기준 예시(253차 — 다른 편도 이 밀도로) ───────────────────────────
  'M1-06': {
    offer: [
      d('sit_listen', '…앉겠습니다. 다섯 가지, 끝까지 듣겠습니다.', '…I\'ll sit. I\'ll hear all five.',
        '그래. 엉덩이부터 붙여라. (좌판 의자를 발로 밀어 준다.)\n\n첫째부터 간다. 네가 잡은 건 네가 먹는다. 제일 쉬운데 제일 많이 어기는 법이야. 나머지 넷은 그거 지키는 놈한테만 들린다.',
        'Good. Sit down first. (She nudges a stool over with her foot.)\n\nFrom the first, then. What you catch, you eat. Easiest rule there is, and the one broken most. The other four only reach people who keep that one.',
        { affinity: 0.04 }),
      d('everyone_keeps', '이 정도면 괜찮지 않아요? 다들 가져가던데요.', 'Isn\'t this one fine? Everyone else takes theirs.',
        '다들? 그 다들이 이 앞바다를 이렇게 만들었다. (감성돔을 받아 물통에 넣는다.)\n\n손가락 두 마디짜리는 내년이면 손바닥만 해진다. 오늘 그걸 먹으면 내년엔 네 손이 빈다. 앉아. 길게 말 안 한다.',
        'Everyone? Everyone is how this coast got the way it is. (She takes the porgy and drops it into a water tub.)\n\nTwo knuckles long this year is a palm long next year. Eat it today and your hands are empty next year. Sit. I won\'t make it long.',
        { affinity: -0.02, flag: 'choice.m1_06_everyone' }),
      d('ask_coop', '계원이 뭔데요? 계원이 돼도 못 판다는 건요?', 'What\'s a member? And why can\'t even members sell?',
        '어촌계. 이 항구에서 바다를 나눠 쓰는 사람들 모임이다. 그물 칠 자리, 미역 따는 날, 다 거기서 정해.\n\n계원이 되면 통발이나 그물로 잡은 건 위판에 낼 수 있어. 낚싯대로 잡은 건 계원이어도 안 돼. 그게 둘째다. 앉아, 나머지도 들어.',
        'The fishing co-op. The people who share this harbour\'s sea. Where the nets go, which day the seaweed is cut, all decided there.\n\nA member can put trap or net catches up at auction. Rod catches, not even a member. That\'s the second rule. Sit and hear the rest.',
        { affinity: 0.02, flag: 'choice.m1_06_asked_coop' }),
      d('who_enforces', '법이라면서요. 할머니가 단속하시는 건 아니죠?', 'You call it law. You\'re not the one enforcing it, are you?',
        '단속은 해경이 하고, 나는 말만 한다. 말로 끝날 때 듣는 게 제일 싸게 먹힌다.\n\n벌금 나오면 네 품삯 몇 달 치야. 그거 내고 배우든가, 지금 공짜로 배우든가. 골라. (대답을 기다리지 않고 의자를 내민다.)',
        'The coast guard does the catching. I just do the talking. Listening while it\'s still only talk is the cheapest way to learn.\n\nA fine would eat months of your wages. Pay that and learn, or learn now for free. Your pick. (She pushes the stool at you without waiting.)',
        { affinity: -0.01 }),
    ],
    completeAdd: [
      d('speak_up', '다른 사람이 작은 걸 가져가면, 저도 말하겠습니다.', "If I see someone keep a small one, I'll speak up too.",
        '말은 해. 싸우지는 말고. 법 얘기는 목소리 큰 쪽이 지는 거다.\n\n재 보자고 해. 자 앞에서는 다들 조용해진다. 그래도 안 들으면 그건 해경 몫이야. 너는 네 쿨러만 깨끗하면 된다.',
        "Say it. Just don't pick a fight. When it comes to the law, whoever shouts loses.\n\nAsk them to measure it. Everyone goes quiet in front of a ruler. If they still won't listen, that's the coast guard's job. You just keep your own cooler clean.",
        { affinity: 0.03, harborRep: 1, flag: 'choice.m1_06_speak_up' }),
    ],
    completeReply: {
      accept_law: [
        '그게 시작이다. 잡는 법보다 먼저 배울 게 그거야. (바다 쪽을 한 번 보고 고개를 끄덕인다.)\n\n먹을 만큼만 가져가고, 작은 놈은 다시 넣어. 그렇게 해 온 사람들이 있어서 이 앞에 아직 감성돔이 든다. 너도 그 사람들 중 하나가 되면 된다.',
        'That\'s where it starts. That\'s the lesson that comes before catching. (She looks out at the sea once and nods.)\n\nTake what you\'ll eat and put the small ones back. There are still porgies off this shore because people did exactly that. Be one of those people.',
      ],
      grumble: [
        '빡빡해서 바다가 남은 거다. 먹고사는 건 다른 길이 있어. 통발, 맨손, 품삯. 배워.\n\n(손바닥으로 좌판을 두 번 친다.) 낚싯대 하나로 먹고살겠다는 건 욕심이다. 욕심은 바다가 제일 먼저 알아챈다. 내일 아침 얼음 나를 손이 모자라니까 그거부터 해.',
        'They\'re tight, and that\'s why there\'s still a sea. Eating is another road. Traps, bare hands, day wages. Learn them.\n\n(She slaps the stall twice.) Living off one rod is greed, and the sea notices greed before anyone. I\'m short of hands for the ice tomorrow morning. Start there.',
      ],
      ask_why: [
        '…내 남편이 안 지켜서. 그 얘긴 그만하자. (좌판 서랍에서 낡은 계측자를 꺼내 준다.)\n\n눈금 몇 개는 지워졌는데 금지체장 칸은 멀쩡하다. 쓸 일이 제일 많아서 그래. 재 보고 모자라면 놔. 그거면 된다.',
        '…Because my husband didn\'t. Let\'s leave that. (From the stall drawer she takes out a worn measuring rule and gives it to me.)\n\nA few marks have worn off, but the minimum-size line is still sharp. It gets used the most. Measure, and if it\'s short, let it go. That\'s all.',
      ],
    },
  },

  // ── M1-01 「막차」 · 혼자 하는 일(혼잣말 · 지문만 — 결과는 플래그만) ──
  'M1-01': {
    offerAdd: [
      d('wonder_rock', '영금정… 사진 속 그 바위, 아직 그대로일까.', 'Yeonggeumjeong… Is the rock in the photo still there?',
        '(주머니에서 사진을 꺼내 뒷면을 다시 본다. 눌러 쓴 두 글자는 그대로다. 앞면의 바위도, 그 앞에 선 사람들도.)\n\n(바위는 쉽게 없어지지 않는다. 바뀌는 건 사람 쪽이다. …가 보면 알겠지.)',
        "(I take the photo out of my pocket and look at the back again. The two pressed-in words haven't changed. Nor has the rock on the front, or the people standing before it.)\n\n(Rocks don't vanish easily. It's people who change. …I'll know when I get there.)",
        { flag: 'choice.m1_01_wondered_rock' }),
      d('travel_light', '배낭 하나, 대 하나. 떠나는 짐치고는 가볍네.', 'One backpack, one rod. Light, for everything I own.',
        '(혼자 피식 웃는다. 웃고 나니 조금 낫다.)\n\n(무거운 건 등에 멘 쪽이 아니라 뒤에 두고 온 쪽이다. 뒤돌아보지 않기로 한다. 아버지의 대를 한 번 고쳐 메고 걷는다.)',
        "(I laugh to myself. It helps a little.)\n\n(The heavy part isn't what's on my back. It's what I left behind. I decide not to look back. I settle my father's rod on my shoulder and walk.)",
        { flag: 'choice.m1_01_travel_light' }),
    ],
    offerReply: {
      go_now: [
        '(배낭끈을 고쳐 멘다. 바다 냄새가 나는 쪽으로 걷는다.)\n\n(주머니 속 사진 모서리가 손끝에 걸린다. 뒷면에 눌러 적힌 두 글자, 영금정. 거기까지 가면 그다음은 거기서 정하면 된다.)',
        "(I hitch my backpack straps tighter and walk toward the smell of the sea.)\n\n(The corner of the photo in my pocket catches my fingertip. Two words pressed into the back: Yeonggeumjeong. Once I get that far, I can decide the rest from there.)",
      ],
      breathe: [
        '(정류장 벤치에 앉았다 일어난다. 어차피 갈 길은 하나다.)\n\n(잠깐 앉아 있는 동안 숨이 고르게 돌아왔다. 아버지의 대는 무릎 옆에 그대로 있다. 서두를 일도, 미룰 일도 없다. 그냥 가면 된다.)',
        "(I sit down on the bench at the stop, then get up again. There's only one way to go anyway.)\n\n(While I sat, my breathing settled. My father's rod is still there beside my knee. Nothing to hurry, nothing to put off. I just have to go.)",
      ],
    },
    completeAdd: [
      d('match_photo', '사진을 들어 눈앞의 바위에 겹쳐 본다.', 'I hold the photo up against the rock in front of me.',
        '(사진 속 바위와 눈앞의 바위가 겹친다. 바위는 그대로인데, 사진 속 얼굴들만 여기 없다.)\n\n(사진을 내린다. 바람에 비린내가 섞여 있다. 어릴 적 들렀던 시장이 이 근처였다. 저 방파제 쪽이었던 것 같다.)',
        "(The rock in the photo lines up with the rock in front of me. The rock hasn't changed. Only the faces in the photo aren't here.)\n\n(I lower the photo. There's a fishy tang on the wind. The market we stopped at when I was small was near here. Over by that breakwater, I think.)",
        { flag: 'choice.m1_01_matched_photo' }),
    ],
    completeReply: {
      stand: [
        '(바람이 사진을 넘기려 든다. 나는 그것을 꼭 쥔다.)\n\n(파도가 바위 밑을 치고 빠진다. 사진 속 그날에도 이 소리가 났을 것이다. 한참을 듣다가, 방파제 쪽으로 몸을 돌린다.)',
        "(The wind tries to turn the photo over. I hold it tight.)\n\n(Waves slap the foot of the rock and draw back. This sound must have been here on the day of the photo, too. I listen for a long while, then turn toward the breakwater.)",
      ],
      look: [
        '(멀리 좌판 불빛이 하나 남아 있다. 발이 먼저 그쪽으로 간다.)\n\n(가진 건 배낭 하나와 아버지의 대 하나. 여기서 내가 할 수 있는 일이 있을지는 모르겠다. 그래도 불이 켜진 곳엔 사람이 있고, 사람이 있는 곳엔 일도 있을 것이다.)',
        "(One stall light is still burning in the distance. My feet go that way first.)\n\n(All I have is a backpack and my father's rod. I don't know if there's anything I can do here. But where a light is on there are people, and where there are people there might be work.)",
      ],
    },
  },

  // ── M1-02 「얼음 나르기」 · 정옥선 ──
  'M1-02': {
    offer: [
      d('carry_now', '…네. 손이라도 움직이면 좀 나을 것 같아요.', '…Okay. I think moving my hands might help.',
        '그래. 손이 바쁘면 눈물이 덜 난다. (좌판 뒤 얼음 상자를 턱으로 가리킨다.)\n\n경매장 하역대 옆에 표시가 있다. 거기 내려놓고 와. 바닥 젖었으니 뛰지 말고. 울 거면 얼음부터 나르고 울어.',
        "Right. Busy hands cry less. (She jerks her chin at the ice crate behind the stall.)\n\nThere's a mark by the unloading dock at the auction hall. Set it down there and come back. The floor's wet, so don't run. If you're going to cry, carry the ice first and cry after.",
        { affinity: 0.04 }),
      d('ask_photo', '사진 얘기는 안 했는데… 어떻게 아셨어요?', 'I never mentioned a photo… How did you know?',
        '(대답 대신 내 주머니를 턱으로 가리킨다. 사진 모서리가 삐져나와 있다.)\n\n주머니를 그렇게 자꾸 만지면서 두리번거리면 누구라도 안다. 이 항구에 옛날 찾으러 오는 사람이 너 하나인 줄 아냐. 얼음 녹는다. 가.',
        "(Instead of answering, she nods at my pocket. The corner of the photo is sticking out.)\n\nKeep patting your pocket like that while you look all around, and anyone could tell. You think you're the only one who comes to this harbour looking for the old days? The ice is melting. Go.",
        { affinity: 0.02, flag: 'choice.m1_02_asked_photo' }),
      d('joke_melt', '울면서 나르면 얼음이 더 빨리 녹지 않을까요?', "If I cry while I carry it, won't the ice melt faster?",
        '(코웃음을 친다.) 농담할 기운이 있으면 다리도 성하겠다.\n\n얼음은 울어도 녹고 꾸물대도 녹는다. 그러니까 빨리 갔다 와. 울 거면 갔다 와서 울어. 그땐 내가 못 본 척해 주마.',
        "(She snorts.) If you've got the energy for jokes, your legs must be fine.\n\nIce melts whether you cry or dawdle. So go and come straight back. If you're going to cry, cry when you're back. I'll pretend not to see.",
        { affinity: 0.03, flag: 'choice.m1_02_joked' }),
      d('stranger', '처음 보는 사람한테 일을 맡기셔도 됩니까?', 'Are you sure you want to trust a stranger with this?',
        '처음 보니까 맡기는 거다. 아는 놈들은 핑계부터 대.\n\n상자 하나다. 들고 달아나 봐야 남는 건 얼음물이야. 그리고 달아날 사람이었으면 그 얼굴로 여기까지 안 왔다. 들어.',
        "That's exactly why. The ones I know start with excuses.\n\nIt's one crate. Run off with it and all you'll have is meltwater. And if you were the running sort, you wouldn't have come this far with that face. Lift it.",
        { affinity: 0 }),
    ],
    completeAdd: [
      d('held_tears', '나르는 동안은 안 울었습니다.', "I didn't cry while I was carrying it.",
        '…그래. 잘 참았다. (좌판 의자를 하나 끌어다 놓는다.)\n\n이제 일 끝났으니 울어도 된다. 아무도 안 본다. 울고 나면 밥부터 먹어. 빈속에 울면 몸만 축난다.',
        "…Good. You held on. (She drags a stall stool over.)\n\nThe work's done, so you can cry now. Nobody's watching. And after, eat something first. Crying on an empty stomach only wears you down.",
        { affinity: 0.05, flag: 'choice.m1_02_held_tears' }),
    ],
    completeReply: {
      keep: [
        '그래야지. 네 돈이다, 아껴 써. 내일도 상자는 온다.\n\n첫 돈은 금방 나간다. 얼음값, 미끼값, 밥값. 그래도 한 장은 접어서 따로 둬라. 바다 일은 공치는 날이 더 많다.',
        "You should. It's your money — spend it carefully. The crates come tomorrow too.\n\nFirst money goes fast. Ice, bait, food. Still, fold one note away and keep it apart. In sea work, the empty days outnumber the good ones.",
      ],
      ask_more: [
        '쓸 만하면. 손이 얼어서 상자 떨어뜨리는 놈은 안 쓴다. (내일 몫 얼음값이라며 동전 몇 개를 더 준다.)\n\n배 들어오는 새벽에 얼음이 제일 많이 나간다. 그때 와. 늦게 오면 할 일 없다. 장갑은 네 걸로 챙기고.',
        "If you're any use. I've no work for a lad who drops crates once his hands go numb. (She hands over a few more coins — tomorrow's ice money, she calls it.)\n\nThe ice goes fastest at dawn, when the boats come in. Come then. Turn up late and there's nothing left to do. Bring your own gloves.",
      ],
    },
  },

  // ── M1-03 「열쇠 두 개」 · 정옥선 ──
  'M1-03': {
    offer: [
      d('grateful', '잘 곳이 생긴 것만으로 충분합니다. 먼지는 제가 털겠습니다.', "Just having somewhere to sleep is enough. I'll beat the dust out myself.",
        '충분하다는 말은 아껴 둬. 아직 아무것도 안 했다. (열쇠를 손바닥에 놓고 꾹 쥐여 준다.)\n\n오늘은 털고, 눕고, 자. 침대에서 자야 하루가 간다. 내일 아침엔 얼음이 기다린다.',
        "Don't call it enough yet. You haven't done anything. (She sets the key in my palm and closes my fingers over it.)\n\nToday you dust, lie down and sleep. A day only passes once you've slept in that bed. Tomorrow morning, the ice will be waiting.",
        { affinity: 0.04 }),
      d('ask_term', '딴 데는 삼 년이라니요? 여긴 왜 육 개월입니까?', 'Three years elsewhere? Why only six months here?',
        '계마다 받는 법이 다르다. 딴 데는 몇 해를 살아야 겨우 계원 소리를 듣는다.\n\n우리 계는 육 개월 실습을 시켜 보고 정한다. 짧다고 쉬운 거 아니다. 남들 몇 해에 배울 걸 그 안에 다 배워야 하니까. 열쇠 받아.',
        "Every co-op takes people in its own way. Some places, you live there for years before anyone calls you a member.\n\nOurs puts you through six months of training and then decides. Short doesn't mean easy. You have to learn in that time what others learn in years. Take the key.",
        { affinity: 0.03, flag: 'choice.m1_03_asked_term' }),
      d('if_fail', '백팔십 일 안에 못 하면 어떻게 됩니까?', "What happens if I can't make it in a hundred and eighty days?",
        '쫓아내진 않는다. 대신 날이 넘어가면 항구 사람들 눈이 하루하루 식는다. 그게 더 무섭다.\n\n못 할 걱정은 첫날 하는 게 아니다. 오늘은 먼지나 털어.',
        "Nobody throws you out. But once the days run over, the harbour's eyes cool on you a little more each day. That's worse.\n\nThe first day isn't for worrying about failing. Today, just beat the dust out.",
        { affinity: 0.01, flag: 'choice.m1_03_asked_deadline' }),
      d('joke_dust', '먼지 털다가 백팔십 일 다 가는 거 아닙니까?', "Won't the whole hundred and eighty days go on dusting?",
        '(입꼬리가 잠깐 올라간다.) 그 정도면 네가 먼지보다 게으른 거다.\n\n창 열고 털어. 곰팡내는 사흘이면 빠진다. 안 빠지면 그땐 네 냄새다.',
        "(The corner of her mouth twitches up.) If it takes that long, you're lazier than the dust.\n\nOpen the window and beat it out. The mildew smell goes in three days. If it doesn't, by then it's your smell.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('tally_marks', '달력이 없어서… 벽에 하루씩 줄을 긋겠습니다.', "I don't have a calendar… I'll scratch a line on the wall each day.",
        '(웃지도 않고 고개를 끄덕인다.) 그것도 좋다. 손으로 그은 줄은 쉽게 안 지워진다.\n\n다만 줄만 긋고 일은 안 하면 그건 날짜 세는 게 아니라 버티는 거다. 줄 하나에 일 하나. 그렇게 채워.',
        "(She nods without smiling.) That works too. A line drawn by hand doesn't rub out easily.\n\nBut if all you do is draw lines and no work, that isn't counting days, that's just holding out. One line, one job. Fill them that way.",
        { affinity: 0.03, flag: 'choice.m1_03_tally_marks' }),
    ],
    completeReply: {
      promise: [
        '말은 쉽지. 날짜는 네가 세는 게 아니라 바다가 세는 거다. (채비 주머니를 손에 쥐여 준다.)\n\n바다에 못 나가는 날도 날이다. 그런 날은 칼을 갈든 그물을 깁든 해. 그런 날을 그냥 버리는 사람이 백팔십 일을 못 채운다.',
        "Easy to say. You don't count the days — the sea does. (She presses a tackle pouch into my hand.)\n\nThe days you can't go out still count. On those, sharpen a knife or mend a net. The ones who throw those days away are the ones who never fill the hundred and eighty.",
      ],
      why: [
        '…얼음 상자를 안 떨어뜨렸으니까. 이유는 그거면 됐다. (더 묻지 말라는 눈이다.)\n\n(좌판 얼음을 고쳐 깔며 혼잣말처럼 덧붙인다.) 사람은 작은 일 하는 걸 보면 안다. 큰일은 누구나 잘하는 척한다.',
        "…Because you didn't drop the ice crate. That's reason enough. (Her eyes say: don't ask further.)\n\n(Straightening the ice on the stall, she adds, almost to herself:) You can tell a person by how they do small jobs. Anyone can put on a show for the big ones.",
      ],
    },
  },

  // ── M1-04 「사이소 영수증」 · 도현수(또래 — 반말) ──
  'M1-04': {
    offer: [
      d('take_advice', '…싼 대로 해 보지. 구멍치기는 처음이지만.', "…Fine, I'll use a cheap one. Never done hole fishing, though.",
        '처음인 거 티 나. (테트라포드 쪽을 턱으로 가리킨다.)\n\n멀리 던지지 마. 틈 바로 아래로 내려. 물면 버티지 말고 바로 들어. 구멍으로 파고들면 끝이야. 안 들리면 끊어. 그래서 싼 대로 하는 거고.',
        "It shows. (He jerks his chin at the tetrapods.)\n\nDon't cast far. Drop it straight into the gap. When it bites, don't wait, lift right away. Once it digs into the hole you're done. If it won't come up, cut it. That's why you use a cheap rod.",
        { affinity: 0.03 }),
      d('ask_hole', '구멍치기? 그게 뭔데.', "Hole fishing? What's that?",
        '테트라포드 틈새 있잖아. 그 구멍에 채비를 바로 내리는 거야. 고기들이 다 거기 숨어 있어.\n\n물자마자 구멍으로 파고들어서 대가 꺾여. 그러니까 비싼 대 들고 오지 말라는 거야. 알아들었으면 사이소나 가.',
        "The gaps between the tetrapods. You drop your rig straight down into those holes. That's where the fish hide.\n\nThe moment they bite they dive back in, and the rod bends double. That's why I'm telling you not to bring an expensive one. Got it? Then go to Saiso.",
        { affinity: 0.02, flag: 'choice.m1_04_asked_hole' }),
      d('my_rod', '내 대를 어디다 쓸지는 내가 정해.', 'Where I use my rod is my call.',
        '정해. 부러지면 우는 건 너지 내가 아니니까. (팔짱을 낀다.)\n\n그 대가 아무 데서나 휘두를 물건이 아닌 건 보면 알아. 오늘은 싼 걸로 해. 그 대는 제대로 던질 날 펴.',
        "Go ahead. If it snaps, you're the one crying, not me. (He folds his arms.)\n\nAnyone can see that rod isn't something you swing around just anywhere. Use a cheap one today. Save that rod for a day you'll cast it properly.",
        { affinity: -0.03, flag: 'choice.m1_04_my_call' }),
      d('cheap_bite', '만 원짜리 대에도 고기가 물긴 하냐?', 'Do fish even bite on a ten-thousand-won rod?',
        '고기는 대 값 안 봐. 미끼랑 자리를 보지.\n\n만 원짜리로 못 낚으면 십만 원짜리로도 못 낚아. 대 탓 하는 사람치고 잘 낚는 거 못 봤어. 가서 사.',
        "Fish don't check the price tag. They look at the bait and the spot.\n\nIf you can't catch on a ten-thousand-won rod, you can't catch on a hundred-thousand-won one either. Never met anyone good who blamed the rod. Go buy one.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('counted_cost', '만 원 쓰고 한 마리. 이거 남는 장사냐?', 'Ten thousand won for one fish. Is that even worth it?',
        '…남는 장사 하려고 낚시했으면 다들 벌써 그만뒀지. (어이없다는 듯 웃는다.)\n\n오늘 배운 거 값이 만 원이야. 그렇게 치면 싸게 산 거다. 영수증, 버리지 마.',
        "…If people fished to turn a profit, they'd all have quit already. (He laughs, half in disbelief.)\n\nTen thousand won is what today's lesson cost. Seen that way, you got it cheap. Keep the receipt.",
        { affinity: 0.03, flag: 'choice.m1_04_counted_cost' }),
    ],
    completeReply: {
      retort: [
        '…말은 잘한다. 그럼 다음엔 그 대로 낚아 봐. 내가 볼게. (팔짱을 풀지 않는다.)\n\n말로 이기는 건 쉬워. 방파제에선 고기 든 사람 말만 들어. 그 대가 진짜면, 그거 쥔 손도 진짜인지 보자고.',
        "…Quick with the mouth. Then land one on that rod next time. I'll be watching. (He doesn't unfold his arms.)\n\nWinning with words is easy. On the breakwater, people only listen to whoever's holding a fish. If that rod's the real thing, let's see if the hand holding it is too.",
      ],
      swallow: [
        '충고 아니다. 사실이야. (그래도 잠깐 입꼬리가 올라간다.)\n\n싼 대로 손 감각 익혀 두면 좋은 대 들었을 때 바로 알아. 대가 뭘 해 주는지. 그거 모르고 비싼 것만 쥐는 사람들이 제일 빨리 부러뜨려.',
        "It isn't advice. It's fact. (Still, one corner of his mouth lifts for a moment.)\n\nLearn the feel on a cheap rod and you'll know right away when you pick up a good one. What the rod's doing for you. The ones who only ever hold the expensive stuff are the first to snap them.",
      ],
      ask: [
        '…할아버지가 계장이라서. 그 이상은 네가 알 바 아냐. (돌아서면서도 한 번 더 내 대를 본다.)\n\n(몇 걸음 가다가 멈춘다.) 그 대 얘기는 다음에 해. 오늘은 아니야. 그 전에 네가 그 대를 쓸 줄이나 아는지부터 보자.',
        "…My grandfather runs the guild. Beyond that it's none of your business. (Even as he turns away, he looks at my rod one more time.)\n\n(A few steps on, he stops.) We'll talk about that rod another time. Not today. First let's see if you even know how to use it.",
      ],
    },
  },

  // ── M1-05 「첫 캐스팅」 · 도현수 ──
  'M1-05': {
    offer: [
      d('unfold', '그래. 아버지 대, 오늘 처음 제대로 펴 본다.', "All right. Today's the first time I've properly unfolded my father's rod.",
        '…처음? (잠깐 말이 없다.)\n\n그럼 가이드부터 봐. 링이 하나라도 휘었으면 줄이 거기서 쓸려. 다 폈으면 내 옆에 서. 던지는 건 내가 볼게.',
        "…The first time? (He's quiet for a moment.)\n\nThen check the guides first. If even one ring is bent, the line wears through right there. Once it's up, stand next to me. I'll watch you cast.",
        { affinity: 0.04 }),
      d('ask_third', '왜 세 번째야? 첫 번째에 채면 안 돼?', "Why the third? Can't I strike on the first?",
        '첫 번째는 고기가 미끼를 건드려 보는 거야. 그때 채면 입 밖으로 빠져.\n\n두 번째에 물고, 세 번째에 끌고 가. 초릿대가 크게 휘면 그때가 바늘이 박힐 때야. 세는 거 잊지 마.',
        "The first is the fish testing the bait. Strike then and it slips right out of its mouth.\n\nOn the second it takes it, on the third it runs with it. When the tip bends hard, that's when the hook sets. Don't forget to count.",
        { affinity: 0.02, flag: 'choice.m1_05_asked_strike' }),
      d('can_cast', '캐스팅부터 다시? 던질 줄은 안다.', 'Casting from scratch? I know how to cast.',
        '던질 줄 아는 거랑 제대로 던지는 거랑 달라. (내 손목을 툭 친다.)\n\n어깨로 던지니까 봉돌이 엉뚱한 데 떨어지잖아. 손목으로 끊어. 한 번 보여 줄 테니까 따라 해.',
        "Knowing how to cast and casting properly aren't the same. (He taps my wrist.)\n\nYou throw from the shoulder, so the sinker lands all over the place. Snap it from the wrist. I'll show you once. Copy me.",
        { affinity: -0.02, flag: 'choice.m1_05_brushed_off' }),
      d('afraid_break', '부러뜨릴까 봐 겁나. 아버지 대라서.', "I'm scared I'll break it. It's my father's.",
        '겁나면 제대로 해. 대는 겁먹은 손에서 더 잘 부러져.\n\n고기 걸리면 대를 세우고 버텨. 대가 꺾이는 건 고기가 세서가 아니라 사람이 무리할 때야. 무리하지 마. 그것만 지켜.',
        "If you're scared, do it right. Rods break more in nervous hands.\n\nWhen a fish takes it, keep the rod up and hold. Rods don't snap because the fish is strong. They snap when people force it. Don't force it. Just keep to that.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('rod_memory', '손잡이 흠집이 내 손에 딱 맞더라. 이상하지.', 'The scratches on the grip fit my hand exactly. Strange, huh.',
        '…안 이상해. 오래 쓴 대는 쓴 사람 손 모양이 남아. (잠깐 내 손을 본다.)\n\n네 손이 그 손이랑 비슷한가 보지. 그럼 그 대는 네 거 맞아. 드랙만 풀어 둬.',
        "…It's not strange. A rod that's been used a long time keeps the shape of the hand that used it. (He glances at my hand for a moment.)\n\nYour hand must be like that one. Then the rod's yours, all right. Just ease off the drag.",
        { affinity: 0.04, flag: 'choice.m1_05_rod_memory' }),
    ],
    completeReply: {
      thanks: [
        '…도움이라니까 이상하네. 그냥 보기 답답해서 그랬어. (릴 드랙을 반 바퀴 풀어 준다.)\n\n드랙은 고기가 당길 때 줄이 조금씩 풀리게 두는 거야. 다 조여 두면 그 힘이 전부 대로 가. 아버지 대면 더 아껴.',
        "…Calling it help sounds strange. You were just painful to watch. (He backs my drag off half a turn.)\n\nThe drag is there so the line gives a little when the fish pulls. Lock it down and all that force goes into the rod. If it's your father's, all the more reason to go easy on it.",
      ],
      proud: [
        '자만은 대를 부러뜨린다. 그래도… 오늘은 맞는 말이다.\n\n근데 내일도 두 마리 올려야 실력이야. 오늘 두 마리는 오늘 거고. (말은 그렇게 해도 눈은 내 손목에 가 있다.)',
        "Getting cocky snaps rods. Still… today you're right.\n\nBut it's only skill if you land two again tomorrow. Today's two belong to today. (He says so, but his eyes are on my wrist.)",
      ],
    },
  },

  // ── M1-07 「부엌의 순서」 · 정옥선 ──
  'M1-07': {
    offer: [
      d('my_own', '네. 제가 잡은 걸 제 손으로 다뤄 보고 싶습니다.', 'Yes. I want to handle what I caught with my own hands.',
        '그래. 그게 순서다. (도마를 물로 한 번 씻어 낸다.)\n\n칼은 누르는 게 아니라 당기는 거다. 시메, 피 빼기, 비늘, 머리. 하나 끝나기 전에 다음 거 생각하지 마.',
        "Good. That's the order of things. (She rinses the board once with water.)\n\nYou don't press with a knife, you draw it. Spike, bleed, scales, head. Don't think about the next step before the one in your hands is done.",
        { affinity: 0.04 }),
      d('ask_shime', '시메요? 그게 뭡니까?', "The spike? What's that?",
        '숨을 끊는 거다. 아가미 뒤를 찔러서 단번에. 오래 퍼덕이면 살이 상한다.\n\n그다음이 피 빼기. 피가 남으면 비리고 빨리 상해. 순서가 곧 맛이다. 앉아서 봐.',
        "Ending its life. One stab behind the gills, done in one go. If it thrashes a long time the flesh spoils.\n\nThen you bleed it. Leave the blood in and it smells and goes off fast. The order is the flavour. Sit and watch.",
        { affinity: 0.03, flag: 'choice.m1_07_asked_shime' }),
      d('hungry', '솔직히 손질보다 먹는 게 더 급합니다.', 'Honestly, eating feels more urgent than gutting.',
        '(코로 웃는다.) 배고픈 놈이 칼 잡으면 손부터 벤다.\n\n밥은 회 뜨고 나서다. 네가 뜬 걸로 먹는 거야. 그러니까 빨리 말고 제대로 해. 서두르면 두 번 하게 된다.',
        "(She huffs a laugh.) Hungry people pick up a knife and cut their hands first.\n\nYou eat after the sashimi's sliced. You eat what you cut. So don't do it fast, do it right. Rush it and you'll do it twice.",
        { affinity: 0.02, flag: 'choice.m1_07_hungry' }),
      d('knife_fear', '이런 칼은 처음입니다. 손 베면 어떡합니까?', "I've never used a knife like this. What if I cut myself?",
        '베이면 피 닦고 다시 잡아. 다들 그렇게 배웠다.\n\n칼 쥔 손보다 생선 누르는 손을 봐. 손가락은 말아 넣고, 칼등 쪽으로. 그것만 지키면 크게는 안 벤다.',
        "If you cut yourself, wipe the blood and pick it up again. That's how everyone learned.\n\nWatch the hand holding the fish, not the one holding the knife. Curl your fingers in, toward the back of the blade. Keep to that and you won't cut deep.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('ask_clock', '신선도가 시계라는 건, 얼마나 버틴다는 뜻입니까?', 'Freshness is a clock — so how long does it last?',
        '잡은 순간부터 간다. 얼음이 그 시계를 늦추고, 얼음 아끼면 시계가 빨리 간다.\n\n쿨러 뚜껑 자주 열지 마라. 열 때마다 시계가 한 칸씩 간다. 회로 먹을 건 빨리, 아니면 익혀. 그것만 알면 된다.',
        "It starts the moment you catch it. Ice slows the clock. Skimp on ice and the clock runs fast.\n\nDon't keep opening the cooler. Every time you do, the clock moves on a notch. What you'll eat raw, eat soon. Otherwise cook it. That's all you need to know.",
        { affinity: 0.03, flag: 'choice.m1_07_freshness' }),
    ],
    completeReply: {
      // 영어 원문의 He는 정옥선(여성)이라 She로 바로잡았다
      taste: [
        '…두껍다. 그래도 결은 맞았어. (칼집에서 손질용 칼을 꺼내 도마 옆에 놓는다.)\n\n(한 점을 더 집는다.) 두께는 손이 알아서 맞춰 간다. 결은 처음부터 보는 사람만 본다. 칼은 쓰고 나면 바로 씻어서 말려. 젖은 채 두면 녹슨다.',
        "…Too thick. But you cut with the grain. (She takes a butchery knife from its sheath and sets it beside the board.)\n\n(She picks up another slice.) Your hands will sort out the thickness on their own. The grain, only people who look from the start ever see. Wash the knife right after you use it and dry it. Leave it wet and it rusts.",
      ],
      humble: [
        '연습은 손이 하는 거지 입이 하는 게 아니다. 이 칼로 해라. 내 손엔 이제 무겁다.\n\n(칼자루를 내 쪽으로 돌려 놓는다.) 무겁다는 건 칼이 일을 한다는 뜻이다. 네 손은 거들기만 하면 돼. 두께는 백 장 뜨면 저절로 맞는다.',
        "Practice is done by hands, not mouths. Use this knife. It's gone heavy in mine.\n\n(She turns the handle toward me.) Heavy means the knife does the work. Your hand only has to help. Slice a hundred and the thickness will even out on its own.",
      ],
    },
  },

  // ── M1-08 「간이 백팩」 · 탁만수 ──
  'M1-08': {
    offer: [
      d('make_it', '만들어 보겠습니다. 뭘 만들어 본 적은 없지만요.', "I'll make one. Though I've never made anything.",
        '없으니까 해 보는 거다. (도면을 작업대 위에 펴고 모서리를 돌로 누른다.)\n\n선대로 자르고 선대로 꿰매. 삐뚤어도 괜찮다. 삐뚤어진 걸 메 봐야 어디가 틀렸는지 안다.',
        "That's exactly why you try. (He spreads the plan on the bench and pins the corners with stones.)\n\nCut along the lines, stitch along the lines. Crooked is fine. You only find out what's wrong by wearing the crooked one.",
        { affinity: 0.04 }),
      d('ask_why_make', '만들어 보면 뭘 사야 할지 안다는 건 무슨 뜻입니까?', 'What do you mean, making one tells you what to buy?',
        '가방 하나 만들어 보면 어깨끈이 왜 넓어야 하는지, 바닥은 왜 두꺼워야 하는지 손이 안다.\n\n그걸 알고 사면 안 속는다. 모르고 사면 비싼 것만 산다. 그 차이다. 도면 받아.',
        "Make one bag and your hands learn why straps need to be wide and why the bottom needs to be thick.\n\nKnow that when you buy, and nobody fools you. Don't, and you only ever buy the expensive one. That's the difference. Take the plan.",
        { affinity: 0.03, flag: 'choice.m1_08_asked_why_make' }),
      d('joke_load', '이 꼴이 그렇게 심합니까? 나름 다 챙긴 건데요.', "Is it really that bad? I thought I'd packed everything.",
        '(위아래로 훑어본다.) 챙긴 게 아니라 매단 거다. 걸을 때마다 미끼통이 쿨러를 친다.\n\n그 소리에 고기보다 사람이 먼저 달아나. 앉아. 오래 안 걸린다.',
        "(He looks me up and down.) You didn't pack it, you hung it. Every step, the bait tub bangs the cooler.\n\nThat racket scares off people before it scares off fish. Sit. It won't take long.",
        { affinity: 0.01 }),
      d('no_time', '지금은 바다 나갈 시간인데요. 오래 걸립니까?', "It's time I was out on the water. Will this take long?",
        '바다는 내일도 있다. 가방은 오늘 안 만들면 내일도 없어.\n\n손이 빠르면 금방이고, 느리면 느린 대로 배우는 거다. 짐 덜렁거리는 채로 방파제 나가 봐라. 반은 바다에 주고 온다.',
        "The sea will be there tomorrow. A bag you don't make today won't be there tomorrow either.\n\nQuick hands make it quick. Slow hands learn at their own pace. Go out on the breakwater with that load swinging and you'll give half of it to the sea.",
        { affinity: -0.01 }),
    ],
    completeAdd: [
      d('hands_free', '메고 걸어 보니 두 손이 비네요. 어색합니다.', 'Walking with it on, both my hands are empty. Feels odd.',
        '어색한 게 아니라 원래 그래야 하는 거다. 손은 짐 들라고 있는 게 아니야.\n\n(내 걸음을 한 번 보고 고개를 끄덕인다.) 방파제에선 두 손이 비어 있어야 산다. 미끄러질 때 짚을 손은 늘 남겨 둬.',
        "It isn't odd, it's how it should be. Hands aren't for hauling baggage.\n\n(He watches me walk once and nods.) On the breakwater, empty hands keep you alive. Always keep one free to catch yourself when you slip.",
        { affinity: 0.05, flag: 'choice.m1_08_hands_free' }),
    ],
    completeReply: {
      thanks: [
        '대는 그래야 대다. 가방도 그렇고. (남는 대나무 조각을 하나 던져 준다. 다음 재료다.)\n\n손에 맞는다는 말, 쉽게 나오는 말 아니다. 맞는 걸 알아보는 손이 있어야 나와. 그 조각, 버리지 말고 가끔 만져 봐. 손이 기억한다.',
        "A rod ought to. A bag too. (He tosses over a spare strip of bamboo. Material for the next one.)\n\nIt sits right in the hand — people don't say that lightly. It takes a hand that knows what fits. Don't throw that strip away. Handle it now and then. Your hands will remember.",
      ],
      critic: [
        '…길게 해 주지. 다음엔 네가 깎아. 눈은 있구나. (도면 귀퉁이에 무언가를 적어 준다.)\n\n도면은 처음부터 맞는 게 아니다. 쓰는 사람이 고쳐 적어서 맞아지는 거다. 너도 메 보고 틀린 데 있으면 거기 적어. 그게 네 도면이 된다.',
        "…I'll make it longer. Next one you cut yourself. You've got an eye. (He writes something in the corner of the plan.)\n\nA plan isn't right from the start. It gets right because the people using it correct it. Wear it, and if something's off, write it there. That's how it becomes your plan.",
      ],
      ask_rod: [
        '만들지. 오십 년을. 네 아버지 대도 여기서 봤을지 모른다. …아니다, 그건 나중에.\n\n(깎던 대나무를 내려놓지 않는다.) 오늘은 가방이다. 대 얘기는 짐부터 제대로 질 줄 아는 사람한테나 하는 거다. 그 대, 함부로 굴리지나 마라.',
        "I do. Fifty years of it. I may have seen your father's rod here. …No. That's for later.\n\n(He doesn't put down the bamboo he's shaving.) Today it's the bag. Rods are a conversation for people who can carry their own load properly. Just don't knock that rod about.",
      ],
    },
  },

  // ── M1-09 「밤바다」 · 정옥선 ──
  'M1-09': {
    offer: [
      d('learn_tide', '읽을 줄은 모르지만, 오늘 배우겠습니다.', "I can't read one yet, but I'll learn today.",
        '(물때표를 좌판 위에 편다.) 여기 숫자가 물 높이다. 제일 낮은 데가 간조. 내려가는 건 그 앞뒤로만이다.\n\n물은 빠질 땐 천천히 빠지고, 들어올 땐 소리 없이 들어온다. 발목이 젖기 시작하면 그때 바로 올라와.',
        "(She spreads a tide table on the stall.) These numbers are the water height. The lowest one is low tide. Only go down in the hours either side of it.\n\nThe water goes out slowly and comes in without a sound. The moment your ankles start getting wet, come straight up.",
        { affinity: 0.04 }),
      d('ask_markers', '어장 표지요? 그 안쪽은 왜 넘으면 안 됩니까?', "Ground markers? Why can't I go inside them?",
        '마을어업권이다. 그 안쪽 전복, 해삼, 소라는 마을 사람들이 같이 키워서 나누는 거야.\n\n남의 밭에서 무 뽑으면 도둑이지? 바다도 같다. 표지 바깥에서, 허락된 걸로만 해.',
        "Village fishing rights. The abalone, sea cucumbers and turban shells inside them are raised by the village together and shared.\n\nPull radishes out of someone else's field and you're a thief, right? The sea's the same. Stay outside the markers, and only take what's allowed.",
        { affinity: 0.03, flag: 'choice.m1_09_asked_markers' }),
      d('scared_night', '밤바다는 처음이라… 솔직히 좀 무섭습니다.', "I've never been down there at night… Honestly, I'm a bit scared.",
        '무서운 게 맞다. 안 무서운 놈이 물에 빠진다.\n\n랜턴은 발밑만 비추지 말고 가끔 멀리도 비춰. 물이 어디까지 왔는지 봐야 하니까. 손 시리면 미련 없이 올라와.',
        "You should be. The ones who aren't are the ones who end up in the water.\n\nDon't just shine the lamp at your feet. Sweep it further out now and then, so you can see how far the water's come. When your hands go numb, come up without a second thought.",
        { affinity: 0.03 }),
      d('joke_law', '법한테 잡히는 게 할머니한테 잡히는 것보단 낫겠는데요.', 'Getting caught by the law sounds better than getting caught by you.',
        '(눈을 가늘게 뜬다.) 내가 잡으면 꿀밤이고 법이 잡으면 벌금이다. 어느 쪽이 나은지 계산해 봐.\n\n어장 표지 안쪽에선 손도 넣지 마. 몰랐다는 말은 안 통한다.',
        "(She narrows her eyes.) When I catch you it's a knock on the head. When the law catches you it's a fine. Work out which is better.\n\nDon't so much as put a hand inside the markers. Saying you didn't know won't get you anywhere.",
        { affinity: 0.01, flag: 'choice.m1_09_joked' }),
    ],
    completeAdd: [
      d('kept_out', '표지 안쪽에 소라가 잔뜩 보였는데, 안 건드렸습니다.', "There were turban shells all over inside the markers. I didn't touch them.",
        '…잘했다. 거기서 손 넣는 사람 많다. 아무도 안 보는 밤이라고.\n\n밤에 지키는 법이 진짜다. 낮엔 다들 지켜. (랜턴 끈을 내 손목에 감아 준다.)',
        "…Good. Plenty of people reach in there. Nobody's watching at night, they think.\n\nThe law you keep at night is the real one. Everyone keeps it by day. (She loops the lamp strap round my wrist.)",
        { affinity: 0.04, seaRep: 1, flag: 'choice.m1_09_kept_out' }),
    ],
    completeReply: {
      cold: [
        '그게 바다다. 오한 들기 전에 들어가. 병원비가 조과보다 비싸. (따뜻한 물 한 잔을 밀어 준다.)\n\n젖은 옷부터 벗어. 바람 맞은 몸은 물보다 빨리 식는다. 다음엔 장갑을 두 켤레 챙겨. 하나는 젖으라고 끼는 거다.',
        "That's the sea for you. Go inside before the chills set in. Doctors cost more than the catch. (She pushes a cup of hot water toward me.)\n\nGet out of those wet clothes first. A body in the wind cools faster than the water does. Next time bring two pairs of gloves. One pair is there to get wet.",
      ],
      excited: [
        '…그 눈, 조심해. 밤에 홀린 사람이 제일 먼저 미끄러진다. 그래도 나가려면 랜턴은 이걸로 해.\n\n나갈 땐 물때표부터 보고, 나간다고 누구한테든 말하고 가. 아무도 모르게 나가면 무슨 일이 나도 아무도 모른다.',
        "…Careful with that look. The ones the night takes are the first to slip. But if you're going out, use this lantern.\n\nWhen you go, check the tide table first, and tell someone you're going. Go out without a word and if something happens, nobody will know.",
      ],
    },
  },

  // ── M1-10 「공동작업」 · 어촌계(계장 — 사무적 · 무뚝뚝) ──
  'M1-10': {
    offer: [
      d('give_work', '실습생이라도 좋습니다. 일 주십시오.', "Trainee's fine. Give me work.",
        '좋다 나쁘다는 네가 정하는 게 아니다. 일하는 걸 보고 우리가 정한다.\n\n양망은 앞사람 손 박자에 맞춰 당겨. 혼자 세게 당기면 그물 찢어진다. 장갑은 저기 있다.',
        "Whether it's fine isn't yours to say. We decide that by watching you work.\n\nOn the net haul, pull in time with the hands in front of you. Pull hard on your own and the net tears. Gloves are over there.",
        { affinity: 0.03 }),
      d('ask_net', '양망 보조요? 그물 걷는 일입니까?', 'Net hauling? Is that pulling the nets in?',
        '그래. 바다에 놓은 그물을 끌어올리는 거다. 너는 보조니까 올라온 그물 받아서 개고, 걸린 거 떼어 내.\n\n손 다치는 건 그물코에 손가락 끼울 때다. 장갑 끼고, 서두르지 마.',
        "Yes. Hauling up the nets we set out. You're the helper, so you take the net as it comes up, fold it, and pick out what's caught.\n\nPeople hurt their hands when they hook their fingers in the mesh. Wear gloves, and don't rush.",
        { affinity: 0.02, flag: 'choice.m1_10_asked_net' }),
      d('ask_bike', '창고 뒤 자전거요? 제가 고쳐 타도 됩니까?', 'The bicycle behind the shed? I can fix it and ride it?',
        '주인 없는 거다. 몇 해째 거기 서 있어. 고치면 네가 타는 거고.\n\n어디가 고장 났는지는 네가 봐. 양망 끝나고 해라. 일 먼저.',
        "Nobody owns it. It's been standing there for years. Fix it and it's yours to ride.\n\nWork out what's broken yourself. Do it after the net haul. Work comes first.",
        { affinity: 0.02, flag: 'choice.m1_10_asked_bike' }),
      d('ask_pay', '공동작업이면, 품삯은 나옵니까?', "If it's communal work, is there pay?",
        '나온다. 일한 만큼. 계 일은 계에서 준다.\n\n대신 일 덜 하고 품삯 같이 받으려는 사람은 바로 티 난다. 여기선 다 같이 보니까. 양망부터 가.',
        "There is. As much as you work. Co-op work gets paid by the co-op.\n\nBut anyone who works less and wants the same pay shows right away. Everyone's watching here. Net haul first — go.",
        { affinity: 0 }),
    ],
    completeAdd: [
      d('unsure_path', '바다에서 뭘 하고 싶은지는… 아직 모르겠습니다.', "What I want to do out there… I don't know yet.",
        '모르는 게 정상이다. 지금 다 알면 그게 더 이상한 거지.\n\n그러니까 처음 하나는 아무 데나 찍어. 해 보면 맞는지 안다. 아끼느라 안 찍는 사람이 제일 늦다.',
        "Not knowing is normal. Knowing it all now would be stranger.\n\nSo put the first one anywhere. You find out if it fits by doing it. The ones who hoard it and never spend it are the slowest of all.",
        { affinity: 0.03, flag: 'choice.m1_10_unsure_path' }),
    ],
    completeReply: {
      work: [
        '그래. 내일은 그물이다. 손 아플 거야.\n\n아픈 손은 사흘이면 굳는다. 굳으면 그때부터 일이 손에 붙어. 늦지 마라. 그물은 사람 기다려 주지 않는다.',
        "Good. Tomorrow it's nets. Your hands will hurt.\n\nSore hands harden in three days. Once they do, the work starts to stick to them. Don't be late. Nets don't wait for anyone.",
      ],
    },
  },

  // ── M1-11 「총회」 · 어촌계 ──
  'M1-11': {
    offer: [
      d('ready', '서류는 다 챙겼습니다. 그날 서겠습니다.', "I've got all the papers. I'll be standing there that day.",
        '서류는 종이다. 사람들이 보는 건 네가 백팔십 일 동안 얼굴 보인 횟수야.\n\n그날은 깨끗한 옷 입고 와. 말은 짧게 하고. 길게 말하는 사람치고 일 잘하는 사람 못 봤다.',
        "Papers are paper. What people look at is how many times you showed your face in those hundred and eighty days.\n\nCome in clean clothes that day. Keep it short when you speak. I've never seen a long talker who was any good at the work.",
        { affinity: 0.03 }),
      d('ask_docs', '서류 네 장이요? 뭐 뭐가 필요합니까?', 'Four documents? Which ones do I need?',
        '신고어업 등록증, 예비계원 추천서, 실습 일지. 그리고 보증서. 보증은 이 항구 사람이 서 줘야 한다.\n\n누가 서 줄지는 네가 알 거다. 백팔십 일 동안 누구 일을 했는지 생각해 봐.',
        "The reported-fishery registration, the candidate member recommendation, your trainee log. And a guarantee. Someone from this harbour has to stand guarantor.\n\nYou'll know who. Think about whose work you've been doing these hundred and eighty days.",
        { affinity: 0.02, flag: 'choice.m1_11_asked_docs' }),
      d('nervous_vote', '사람들이 손을 안 들어 주면 어떡합니까?', 'What if nobody raises their hand for me?',
        '그럼 네가 한 일이 그 정도였던 거다.\n\n…그렇게 겁먹을 거 없다. 백팔십 일 동안 얼음 나르고 그물 걷은 사람을 다들 봤다. 본 걸로 손 드는 거야. 그날까지 하던 일이나 계속해.',
        "Then what you did was worth about that much.\n\n…There's no need to be that scared. Everyone saw who carried the ice and hauled the nets for a hundred and eighty days. People raise their hands for what they saw. Until then, keep doing what you've been doing.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('thank_guarantor', '보증서 써 주신 분께 먼저 인사드리고 오겠습니다.', "I'll go and thank the person who signed my guarantee first.",
        '그래야지. 그 도장은 아무한테나 안 찍어 준다. (명부를 덮는다.)\n\n계원이 돼도 좌판 얼음은 계속 날라라. 이름 불렸다고 하던 일 놓는 사람은 다음 총회에서 표를 잃는다.',
        "You should. That seal doesn't go on just anyone's paper. (He closes the roll.)\n\nKeep carrying ice for the stall, member or not. People who drop their old work once their name's been called lose votes at the next meeting.",
        { affinity: 0.04, flag: 'choice.m1_11_thank_guarantor' }),
    ],
    completeReply: {
      humble: [
        '그 말 하는 놈이 오래 간다. (계장이 명부 첫 장을 펴 보인다. 어촌계원, 그 아래 내 이름.)\n\n무거우면 무거운 대로 들고 다녀. 가벼워지는 날이 오면 그때 조심해. 계원 이름 달고 사고 치는 사람들은 다 그 말을 가볍게 한 사람들이다.',
        "The ones who say that last longest. (The chief opens the first page of the roll. Guild members — and my name under it.)\n\nIf it's heavy, carry it heavy. When the day comes that it feels light, that's when to watch yourself. Everyone who's caused trouble under a member's name took that word lightly.",
      ],
      proud: [
        '채운 건 날짜지. 계원은 이제부터다. 부산 위판장에서 보자.\n\n부산은 여기랑 다르다. 상자 하나하나에 네 이름이 붙는다. 날짜 채운 걸로 뽐내는 건 오늘까지만 해라. 내일부턴 상자로 말해.',
        "You filled the days. Being a member starts now. I'll see you at the Busan auction hall.\n\nBusan isn't like here. Every single crate carries your name. You can show off about filling the days until tonight. From tomorrow, let the crates do the talking.",
      ],
    },
  },

  // ── M2-01 「첫 위판」 · 어촌계 ──
  'M2-01': {
    offer: [
      d('first_crate', '제 이름으로 내는 첫 상자입니다. 규격대로 하겠습니다.', "It's the first crate under my name. I'll do it by the regulations.",
        '그래. 규격은 사람들이 서로 안 속이려고 만든 거다.\n\n상자 크기, 얼음 깔기, 무게 표시. 하나라도 어긋나면 판정원이 네 상자 앞에 오래 선다. 첫 상자부터 그런 꼴 당하지 마라.',
        "Good. Regulations exist so people don't cheat each other.\n\nCrate size, the ice layer, the weight label. Get one thing wrong and the grader stands over your crate a long time. Don't let that happen to your very first one.",
        { affinity: 0.04 }),
      d('ask_crate', '상자 규격이요? 크기 말고 또 뭐가 있습니까?', 'Crate regulations? What is there besides size?',
        '크기는 기본이고. 한 상자에 한 어종, 얼음은 위아래로, 무게는 적힌 대로.\n\n섞어 담으면 제일 못한 놈 값으로 친다. 규격은 사는 사람이 상자를 안 열어 보고도 믿게 하는 약속이다. 규격대로 담아 와.',
        "Size is just the start. One species per crate, ice above and below, the weight as written.\n\nMix them and the whole crate goes at the price of the worst fish in it. A regulation is a promise that lets the buyer trust a crate without opening it. Pack yours to regulation.",
        { affinity: 0.03, flag: 'choice.m2_01_asked_crate' }),
      d('busan_big', '부산 위판장은 속초하고 많이 다릅니까?', 'Is the Busan auction floor very different from Sokcho?',
        '크다. 사람도 많고 목소리도 크다. 거기선 아무도 네 얼굴 모른다.\n\n그러니 상자가 네 얼굴이다. 소개장은 내가 써 준다. 창구에 내밀고 등록부터 해라.',
        "It's big. More people, louder voices. Nobody there knows your face.\n\nSo your crate is your face. I'll write you a letter of introduction. Hand it in at the desk and register first.",
        { affinity: 0.02 }),
      d('rod_regret', '낚싯대로 잡은 게 더 크고 좋은데, 아깝네요.', 'The ones I caught on the rod are bigger and better. Seems a waste.',
        '아까우면 먹어. 그게 법이다. (말이 짧다.)\n\n위판장엔 그런 거 슬쩍 섞는 사람들이 꼭 있다. 한 번 걸리면 그 사람 이름 붙은 상자는 다시 아무도 안 본다. 상자 하나 때문에 이름 버리지 마라.',
        "Then eat them. That's the law. (He keeps it short.)\n\nThere are always people who slip those in on the auction floor. Get caught once and nobody looks at a crate with that name on it again. Don't throw your name away for one crate.",
        { affinity: -0.02, flag: 'choice.m2_01_rod_regret' }),
    ],
    completeAdd: [
      d('grader_pass', '판정원이 한 번 보고 지나가던데, 그게 좋은 겁니까?', 'The grader took one look and walked on. Is that good?',
        '좋은 거다. 판정원이 오래 서 있으면 뭔가 걸린 거야.\n\n한 번 보고 지나가는 상자가 제값을 받는다. 다음에도 그렇게 담아. (말끝에 고개를 한 번 끄덕인다.)',
        "It's good. If a grader stops a long time, something's caught his eye.\n\nThe crates he passes with one look are the ones that fetch their full price. Pack them like that next time too. (He gives one nod as he finishes.)",
        { affinity: 0.02, harborRep: 1, flag: 'choice.m2_01_grader_pass' }),
    ],
    completeReply: {
      watch: [
        '그 눈이 배짱이다. 배짱은 스킬로 배울 수 있게 됐다는 얘기고. (상자값 봉투를 건넨다.)\n\n경매사 손만 보지 말고 중매인 얼굴도 봐. 사고 싶은 사람은 손보다 눈이 먼저 움직인다. 그걸 읽으면 언제 상자를 내야 할지 보인다.',
        "That eye is nerve. And nerve is something you can put into a skill now. (He hands over the envelope for the crates.)\n\nDon't just watch the auctioneer's hand, watch the buyers' faces. Someone who wants a crate moves his eyes before his hand. Read that and you'll see when to put your crates up.",
      ],
      nervous: [
        '어색해야 정상이다. 익숙해지면 그때부터 조심해. (봉투를 건네며 규격 상자 견본을 하나 얹어 준다.)\n\n이름 붙은 상자는 네가 없는 데서도 네 대신 말한다. 얼음 덜 깐 상자는 네가 게으르다고 말하고. 그러니 그 어색한 마음 그대로 담아.',
        "It should. Start worrying when it stops feeling strange. (Handing over the envelope, he adds a sample regulation crate on top.)\n\nA crate with your name on it speaks for you where you aren't. A crate short on ice says you're lazy. So pack them with that same strange feeling.",
      ],
    },
  },

  // ── M2-02 「유찰」 · 어촌계 ──
  'M2-02': {
    offer: [
      d('open_cooler', '…열어 보겠습니다. 뭐가 틀렸는지 제 눈으로 보겠습니다.', "…I'll open it. I want to see what went wrong with my own eyes.",
        '그래. 남한테 들은 건 잊어도 제 눈으로 본 건 안 잊는다.\n\n얼음이 물이 됐으면 그게 답이다. 녹은 물에 잠긴 고기는 살이 물러진다. 판정원은 그걸 손가락 한 번 눌러 보고 안다.',
        "Good. What you hear from others you forget. What you see yourself you don't.\n\nIf the ice has turned to water, there's your answer. Fish sitting in meltwater go soft. A grader knows that with one press of a finger.",
        { affinity: 0.04 }),
      d('ask_review', '복기요? 바둑에서 하는 그거 말입니까?', 'Going back over it? Like replaying a game of baduk?',
        '그래, 그거. 둔 수를 처음부터 다시 놓아 보는 거.\n\n상자도 같다. 언제 잡았고, 얼음은 언제 얼마나 넣었고, 뚜껑은 몇 번 열었는지. 처음부터 짚어 보면 어디서 녹았는지 나온다.',
        "Yes, that. Laying out the moves again from the first one.\n\nCrates are the same. When you caught them, when and how much ice you put in, how many times you opened the lid. Go through it from the start and you'll find where it melted.",
        { affinity: 0.03, flag: 'choice.m2_02_asked_review' }),
      d('ice_cost', '얼음값도 만만치 않습니다. 아낄 수밖에 없었습니다.', "Ice isn't cheap either. I had no choice but to save on it.",
        '얼음값 아끼고 상자값 날렸지. 그게 아낀 거냐.\n\n얼음은 비용이 아니다. 상자값에 들어 있는 거다. 상자 하나 유찰되면 얼음 열 번 살 돈이 날아가. 계산은 그렇게 하는 거다. 얼음부터 다시 챙겨.',
        "You saved on ice and lost the crate. Is that saving?\n\nIce isn't a cost. It's part of the crate's price. One unsold crate throws away enough money for ten loads of ice. That's how you do the sums. Go and get more ice.",
        { affinity: -0.02, flag: 'choice.m2_02_ice_cost' }),
      d('ashamed', '이름 붙은 상자가 유찰되니까… 창피했습니다.', "When the crate with my name on it didn't sell… I was ashamed.",
        '창피한 건 하루면 간다. 같은 짓 두 번 하면 그건 오래 간다.\n\n이름 붙은 상자는 다 한 번씩 그렇게 떨어진다. 다들 그렇게 배웠어. 쿨러 열어 봐.',
        "Shame lasts a day. Do the same thing twice and that lasts a long time.\n\nEvery crate with a name on it goes unsold like that once. That's how everyone learned. Open the cooler.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('ice_log', '다음부터 얼음 넣은 때랑 뚜껑 연 횟수를 적어 두겠습니다.', "From now on I'll write down when I put in ice and how often I open the lid.",
        '적는 사람은 안 잊는다. (내 쪽을 똑바로 본다.)\n\n바다 일은 기억으로 하면 틀린다. 적어 둔 게 다음 상자를 살린다. 그게 쌓이면 네 장부가 되는 거다.',
        "People who write things down don't forget. (He looks straight at me.)\n\nDo sea work from memory and you get it wrong. What you wrote down saves the next crate. Pile it up and it becomes your ledger.",
        { affinity: 0.04, harborRep: 1, flag: 'choice.m2_02_ice_log' }),
    ],
    completeReply: {
      own: [
        '그렇게 말하는 놈은 다음 상자를 안 잃는다. (다음 얼음값을 계에서 대 준다는 말을 덧붙인다.)\n\n남 탓 하는 사람은 같은 데서 또 넘어진다. 제 탓 하는 사람은 넘어진 자리를 기억하고. 이번 한 번은 계가 대 준다. 다음은 없다.',
        "A lad who says that doesn't lose the next crate. (He adds that the guild will cover the ice next time.)\n\nPeople who blame others trip in the same place again. People who blame themselves remember where they fell. The guild covers it this once. There won't be a next time.",
      ],
      excuse: [
        '거리는 네가 잰 거지. 얼음도 네가 넣은 거고. 다음엔 둘 다 네 몫이다.\n\n멀면 얼음을 더 넣으면 된다. 거리는 못 바꿔도 얼음은 바꿀 수 있어. 못 바꾸는 걸 핑계로 대면 배우는 게 없다.',
        "You measured that distance. You packed that ice. Next time both are still yours.\n\nIf it's far, put in more ice. You can't change the distance, but you can change the ice. Make an excuse of what you can't change and you learn nothing.",
      ],
    },
  },

  // ── M2-03 「감천항의 겨울」 · 도현수 ──
  'M2-03': {
    offer: [
      d('over_forty', '40, 넘겨 보지. 인정한다는 말 꼭 들어야겠다.', "Over forty, then. I want to hear you say you'll give it to me.",
        '말은 쉽지. 겨울 감성돔은 바닥에 붙어서 잘 안 움직여.\n\n찌 수심 깊게 주고, 밑걸림 나면 당기지 말고 줄을 풀어 줘. 억지로 당기면 채비도 잃고 자리도 잃어.',
        "Easy to say. Winter black seabream hug the bottom and barely move.\n\nSet the float deep, and when you snag, don't yank, give it line. Force it and you lose the rig and the spot both.",
        { affinity: 0.04 }),
      d('ask_lose', '채비 잃는 법? 안 잃는 법이 아니고?', 'How to lose a rig? Not how not to lose one?',
        '안 잃는 법 같은 건 없어. 감천은 바닥이 다 돌이랑 버려진 줄이야.\n\n덜 잃는 법은 있지. 목줄을 원줄보다 약하게 묶어 둬. 걸리면 목줄만 끊어지게. 그게 잃는 법이야.',
        "There's no such thing. Gamcheon's bottom is all rock and old snagged line.\n\nThere is a way to lose less, though. Tie your leader weaker than your main line. When it snags, only the leader breaks. That's how you lose a rig.",
        { affinity: 0.03, flag: 'choice.m2_03_asked_snag' }),
      d('your_record', '인정은 됐고, 네 기록부터 말해 봐.', 'Never mind giving it to me. Tell me your record first.',
        '…내 기록 알아서 뭐 하게. (눈썹이 올라간다.)\n\n40 넘기고 나서 물어. 그럼 말해 줄지도 모르지. 그 전엔 내 숫자 들어 봐야 네 손만 굳어.',
        "…What's my record to you? (His eyebrows go up.)\n\nAsk me after you've cleared forty. Maybe I'll tell you then. Before that, hearing my number will only make your hands stiff.",
        { affinity: -0.02, flag: 'choice.m2_03_taunt' }),
      d('cold_wind', '부산 겨울바람이 이렇게 매운 줄 몰랐다.', "I didn't know Busan's winter wind was this sharp.",
        '겨울 감천은 원래 그래. 바람이 항구 안까지 파고들어.\n\n장갑 낀 채로 줄 만지는 것도 익혀 둬. 손 시리다고 맨손으로 하다가는 챔질 타이밍 다 놓쳐.',
        "Gamcheon in winter is like that. The wind gets right into the harbour.\n\nLearn to handle line with your gloves on. Go bare-handed because you're cold and you'll miss every strike.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('credit_rival', '수심 더 주라고 한 거, 그게 먹혔다. 반은 네 거야.', 'You told me to set it deeper. That did it. Half of this is yours.',
        '…반은 무슨. 올린 건 네 손이야. (계측자에서 눈을 떼지 않는다.)\n\n말은 누구나 해 줄 수 있어. 그 말 듣고 버티는 건 아무나 못 하고. 그 대 써. 감천 바람엔 그게 맞아.',
        "…Half, nothing. Your hands brought it up. (He doesn't take his eyes off the measuring board.)\n\nAnyone can give advice. Not everyone can take it and hold on. Use the rod. It's right for the Gamcheon wind.",
        { affinity: 0.06, flag: 'choice.m2_03_credit_rival' }),
    ],
    completeReply: {
      rival: [
        '한 번이다. 두 번은 아직. (그러면서도 자기 예비 대를 내민다.)\n\n다음 겨울에도 40 넘기면 그때 두 번이라고 해 줄게. 그 대, 초릿대가 예민하니까 밑걸림 났을 때 확 세우지 마. 부러져.',
        "Once. Not twice yet. (And still he holds out his spare rod.)\n\nClear forty again next winter and I'll call it twice. That rod's got a sensitive tip, so don't wrench it up when you snag. It'll snap.",
      ],
      lost_rigs: [
        '잃은 채비 수만큼 바다를 아는 거야. 그 대는 여기 바람에 맞춰 튜닝했어. 써.\n\n나도 여기 바닥에 채비 꽤 묻었어. 언젠가 네 바늘에 내 채비가 같이 올라와도 놀라지 마. 감천은 그런 데야.',
        "You know the sea by the rigs you leave in it. That rod's tuned for the wind here. Take it.\n\nI've buried a fair few rigs on this bottom myself. If one of mine comes up on your hook one day, don't be surprised. That's Gamcheon.",
      ],
    },
  },

  // ── M2-04 「남의 가게」 · 나기범(해요체 · 말수 적음) ──
  'M2-04': {
    offer: [
      d('steady_vow', '값보다 꾸준함이라면, 그건 자신 있습니다.', "If it's consistency over price, that I can promise.",
        '…그 말, 다들 해요. (수조 쪽으로 눈을 돌린다.)\n\n세 번째까지 오는 사람이 드물어요. 오면 그때 얘기해요. 손질은 넘기기 전에 해 오고요. 피 뺀 거랑 안 뺀 거, 수조 앞에서 다 보여요.',
        "…Everyone says that. (He looks away toward the tank.)\n\nNot many make it to the third time. If you do, we'll talk then. Dress them before you hand them over. Bled or not bled, it all shows in front of the tank.",
        { affinity: 0.03 }),
      d('ask_steady', '꾸준함을 산다는 건 무슨 뜻입니까? 값이 아니라요?', 'What do you mean, you buy consistency? Not price?',
        '횟집은 손님이 올지 안 올지 몰라요. 그래도 수조는 늘 차 있어야 해요.\n\n싸게 한 번 주는 사람보다 제값에 매번 오는 사람이 필요해요. 그런 사람이 있으면 저는 가게만 보면 되니까요. 세 번, 기다릴게요.',
        "A restaurant never knows if customers will come. But the tank always has to be full.\n\nI need someone who comes every time at a fair price more than someone who comes once cheap. With someone like that, I can just mind the shop. Three times. I'll be waiting.",
        { affinity: 0.03, flag: 'choice.m2_04_asked_steady' }),
      d('empty_shop', '손님도 없는데… 납품이 꼭 필요하십니까?', "There aren't any customers… Do you really need deliveries?",
        '(잠깐 말이 없다.) …없으니까요. 있을 때 준비하면 늦어요.\n\n수조가 비어 있으면 손님이 문 앞에서 돌아가요. 그래서 꾸준한 사람이 필요한 거예요. 세 번, 가져와 봐요.',
        "(He's quiet for a moment.) …That's why. If you wait to prepare until they're here, it's too late.\n\nWhen the tank is empty, customers turn round at the door. That's why I need someone steady. Three times. Bring them.",
        { affinity: -0.02, flag: 'choice.m2_04_empty_shop' }),
    ],
    completeAdd: [
      d('took_chair', '의자… 앉아도 됩니까? 이런 건 처음이라서요.', "The chair… may I sit? Nobody's ever done that for me.",
        '앉으라고 내놓은 거예요. 서서 기다리는 사람은 금방 가요.\n\n…말은 잘 못해요. 그래서 의자로 말한 거예요. 다음에 와서도 거기 앉아요.',
        "That's what I put it out for. People who wait standing up leave soon.\n\n…I'm not good with words. So I said it with a chair. Sit there next time too.",
        { affinity: 0.05, flag: 'choice.m2_04_took_chair' }),
    ],
    completeReply: {
      // 영어 원문의 She는 나기범(남성)이라 He로 바로잡았다(steady · price 둘 다)
      steady: [
        '그 말이 계약이에요. (수조 옆에 내 이름을 쓴 종이를 붙인다.)\n\n종이 계약서는 서랍에 들어가면 잊어요. 수조 옆에 붙은 이름은 매일 봐요. 빠지는 날이 생기면 그 종이가 먼저 알아요.',
        "That sentence is the contract. (He tapes a slip with my name beside the tank.)\n\nA paper contract gets forgotten once it goes in a drawer. A name beside the tank, I see every day. If you ever miss a day, that slip will know first.",
      ],
      price: [
        '…급하네요. 그래도 세 번 왔으니까요. (계산기를 두드린다. 첫 단가는 낮다.)\n\n첫 단가는 원래 낮아요. 단가는 숫자로 정하는 게 아니라 횟수로 쌓는 거예요. 세 번은 이제 시작이에요.',
        "…In a hurry. Well, you've come three times. (He works the calculator. The first price is low.)\n\nFirst prices are always low. A rate isn't set with numbers, it's built up with visits. Three is only the start.",
      ],
    },
  },

  // ── M2-05 「품질관리 교육」 · 어촌계 ──
  'M2-05': {
    offer: [
      d('attend', '빠짐없이 듣겠습니다. 루어도 배우고 싶었습니다.', "I'll attend every session. I've been wanting to learn lures anyway.",
        '루어는 덤이다. 교육은 네 상자를 사는 사람을 위한 거다.\n\n위생, 이력, 냉장. 어디서 언제 잡아서 어떻게 왔는지 적을 줄 알아야 계원 상자다. 졸지 말고 들어.',
        "Lures are the extra. The course is for the people who buy your crates.\n\nHygiene, traceability, cold chain. A member's crate means you can write down where and when it was caught and how it got here. Don't doze off.",
        { affinity: 0.04 }),
      d('ask_lure', '품질관리 교육이랑 루어가 무슨 상관입니까?', 'What do quality control and lures have to do with each other?',
        '계원은 기본이 먼저다. 위생도 이력도 모르는 사람한테 루어부터 쥐여 주면 순서가 거꾸로다.\n\n그리고 루어는 잃어버리면 바다 밑에 쇳덩이로 남는다. 바다 아끼는 법을 배운 사람한테 여는 거다. 교육부터 받아.',
        "Members do the basics first. Putting a lure in the hands of someone who knows nothing about hygiene or traceability is doing it backwards.\n\nAnd a lost lure stays on the seabed as a lump of metal. We open it up to people who've learned to look after the sea. Do the course first.",
        { affinity: 0.02, flag: 'choice.m2_05_asked_lure' }),
      d('rival_gripe', '싸우지 말라니요. 걔가 먼저 시비 거는 겁니다.', "Don't fight? He's the one who always starts it.",
        '알아. 그 애가 그렇다. (한숨을 쉰다.)\n\n그래도 교실에선 둘 다 계원이다. 옆자리면 필기나 같이 해. 싸우는 것보다 그게 그 애한테 더 따끔하다.',
        "I know. That's how he is. (He sighs.)\n\nBut in that classroom you're both members. If you're sitting together, take notes together. That'll sting him more than any fight.",
        { affinity: 0.01, flag: 'choice.m2_05_rival_gripe' }),
    ],
    completeAdd: [
      d('bring_home', '배운 위생 절차, 속초 좌판에도 알려 드리고 싶습니다.', "I'd like to pass on the hygiene steps to the stalls back in Sokcho.",
        '좋은 생각이다. 배운 건 돌려줘야 계 일이다.\n\n다만 좌판 어른들한테 가르친다는 말은 하지 마라. 보여 주기만 해. 그 양반들은 보고 배우지 듣고 안 배운다.',
        "Good thinking. Giving back what you learned is co-op work.\n\nBut don't tell the stall elders you're teaching them. Just show them. That lot learn by watching, not by listening.",
        { affinity: 0.03, harborRep: 1, flag: 'choice.m2_05_bring_home' }),
    ],
    completeReply: {
      notes: [
        '알아. 그 애는 그런 애다. 너는 다른 게 있고. (루어 가게 소개장을 건넨다.)\n\n그 애는 적고, 너는 해 본다. 둘 다 있어야 한다. …필기 비교했다는 얘기, 그 애한테는 하지 마라. 우쭐해서 한 달은 간다.',
        "I know. That's the kind of lad he is. You've got something else. (He hands over a letter of introduction to the lure shop.)\n\nHe writes it down, you try it out. You need both. …Don't tell him you compared notes, mind. He'd be smug about it for a month.",
      ],
      lure: [
        '던지기 전에 액션부터 배워. 루어는 미끼가 아니라 손이 미끼다.\n\n미끼는 냄새로 부르고 루어는 움직임으로 부른다. 같은 루어도 감는 속도에 따라 다른 고기가 된다. 직판장 입문 루어로 연습부터 해.',
        "Learn the action before you cast it. With lures the bait isn't the bait — your hand is.\n\nBait calls with smell. A lure calls with movement. The same lure becomes a different fish depending on how fast you wind. Practise with the starter lures from the market first.",
      ],
    },
  },

  // ── M2-06 「암남공원의 밤」 · 서하린(해요체 · 들뜬 말투) ──
  'M2-06': {
    offer: [
      d('cast_together', '좋습니다. 루어는 배운 지 얼마 안 됐지만 같이 던지죠.', "Sure. I've only just learned lures, but let's cast together.",
        '저도요! 그럼 초보끼리네요. (카메라를 삼각대에 끼우며 웃는다.)\n\n전갱이는 불빛 아래 모인대요. 천천히 감다가 툭 쳐 주래요. …다 들은 얘기예요. 같이 확인해 봐요.',
        "Me too! Beginners together, then. (She laughs as she clips the camera onto the tripod.)\n\nThey say horse mackerel gather under the lights. Wind slow, then give it a little flick. …That's all secondhand. Let's find out together.",
        { affinity: 0.04 }),
      d('ask_channel', '찍어서 어디에 올리시는 겁니까?', 'Where do you post what you film?',
        '제 채널이요! 낚시 채널인데… 아직 작아요. 많이 작아요.\n\n그래서 진짜 낚시하는 사람 손이 필요해요. 제 손은 아직 어설퍼서 화면에서 티가 나요. 얼굴 싫으시면 손만 찍을게요.',
        "My channel! It's a fishing channel… It's still small. Really small.\n\nThat's why I need the hands of someone who actually fishes. Mine are still clumsy and it shows on screen. If you'd rather not show your face, I'll only film your hands.",
        { affinity: 0.03, flag: 'choice.m2_06_asked_channel' }),
      d('camera_shy', '카메라는 좀… 낚시만 같이 하면 안 되겠습니까?', "I'm not great with cameras… Could we just fish together?",
        '아… 네, 그럼 낚시 먼저요! (삼각대를 반쯤 접다가 멈춘다.)\n\n그래도 통발 만드는 손은 꼭 찍고 싶은데… 그건 이따 다시 여쭤볼게요. 일단 던져요!',
        "Oh… okay, fishing first, then! (She half folds the tripod, then stops.)\n\nI'd still really love to film your hands making the trap… I'll ask again later. Let's cast first!",
        { affinity: 0.01, flag: 'choice.m2_06_camera_shy' }),
      d('why_me', '낚시하는 사람 많은데, 왜 저입니까?', 'There are lots of anglers. Why me?',
        '음… 아까 던지는 거 봤어요. 손이 조용했어요. 화려한 사람은 많은데 조용한 손은 드물어요.\n\n그리고 솔직히, 다른 분들은 다 거절했어요. (웃는다.) 그러니까 같이 해요!',
        "Hmm… I saw you cast earlier. Your hands were quiet. There are plenty of flashy people, but quiet hands are rare.\n\nAnd honestly, everyone else said no. (She laughs.) So let's do it together!",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('credit_retrieve', '리트리브를 바꾸니까 바로 물더군요. 하린 씨 덕입니다.', 'I changed the retrieve like you said and it bit right away. That was you.',
        '제 덕이요? 저 그거 영상에서 본 거예요! (화면을 돌려 내 캐스팅을 다시 본다.)\n\n근데 진짜 됐네요. 그럼 오늘 영상 제목은 리트리브로 할래요. 초보가 초보한테 배운 거요.',
        "Me? I got that from a video! (She scrolls back to watch my cast again.)\n\nBut it actually worked. Then today's video is called Retrieve. A beginner learning from a beginner.",
        { affinity: 0.04, flag: 'choice.m2_06_credit_retrieve' }),
    ],
    completeReply: {
      camera_no: [
        '네! 손이랑 대만. 손이 더 멋있어요, 사실. (그래도 가방은 챙겨 준다.)\n\n손은 거짓말을 못 하거든요. 표정은 꾸밀 수 있는데 손은 못 꾸며요. 아까 전갱이 걸렸을 때 그 손, 진짜 좋았어요.',
        "Sure! Just hands and rod. Hands look better anyway, honestly. (She packs the bag for me all the same.)\n\nHands can't lie, you know. You can fake a face, but not hands. Your hands when that horse mackerel hit were really something.",
      ],
      camera_ok: [
        '고마워요! 첫 출연자예요. (편집본에 내 캐스팅이 오래 남는다.)\n\n사실 카메라 앞에서 제일 떠는 건 저예요. 같이 떨어 주는 사람이 있으니까 좀 낫네요. 다음에도 던질 때 불러도 돼요?',
        "Thank you! You're my first guest. (My cast stays in the final cut for a long while.)\n\nHonestly, I'm the one who gets most nervous in front of the camera. It's easier with someone being nervous alongside me. Can I call you next time I go casting?",
      ],
    },
  },

  // ── M2-07 「통제선」 · 어촌계 ──
  'M2-07': {
    offer: [
      d('wont_cross', '넘을 생각 없습니다. 제 이름이 계 이름이니까요.', "I've no intention of crossing. My name is the co-op's name.",
        '그래. 그걸 아는 사람은 줄 앞에서 안 망설인다.\n\n세 길 다 시간이 걸린다. 몰래 넘는 사람들이 빨라 보여도 오래 못 간다. 셋 중 하나 골라서 와.',
        "Good. People who understand that don't hesitate in front of the line.\n\nAll three ways take time. The ones who sneak over might look faster, but they don't last. Pick one of the three and come back.",
        { affinity: 0.04 }),
      d('ask_accident', '사고가 있었다던데… 무슨 일이었습니까?', 'I heard there was an accident… What happened?',
        '누가 다쳤다. 누군지는 묻지 마라.\n\n방파제 끝은 파도 한 번이면 사람을 끌고 간다. 테트라포드 틈에 빠지면 혼자서는 못 나온다. 통제선은 그래서 있는 거다. 셋 중에 골라.',
        "Someone got hurt. Don't ask who.\n\nOne wave at the end of the breakwater can drag a person off. Fall into a gap in the tetrapods and you can't climb out alone. That's what the line is for. Pick one of the three.",
        { affinity: 0.02, flag: 'choice.m2_07_asked_accident' }),
      d('others_cross', '다들 넘어가던데요. 저만 돌아가면 손해 아닙니까?', "Everyone else goes over. Isn't it my loss if I'm the only one going round?",
        '손해 맞다. 오늘은.\n\n몰래 넘어간 사람 이름은 내가 다 안다. 그 사람들이 나중에 계에 부탁할 일 생기면 어떻게 될 것 같냐. 손해는 그때 보는 거다. 돌아서 가.',
        "It is your loss. Today.\n\nI know the name of everyone who sneaks over. What do you think happens when those people need something from the co-op later? That's when the real loss comes. Go the long way.",
        { affinity: -0.02, flag: 'choice.m2_07_others_cross' }),
      d('ask_cost', '세 길 중에 돈이 덜 드는 건 어느 쪽입니까?', 'Which of the three costs the least?',
        '계 동행이 제일 싸다. 대신 날짜를 계에 맞춰야 하고. 낚시공원은 입장료, 선상은 뱃삯이 든다.\n\n돈, 시간, 사람. 셋 중에 뭘 쓸지 정하면 길은 저절로 나온다.',
        "Going with the co-op is cheapest. But you go on the co-op's dates. The fishing park costs an entry fee, a boat costs a fare.\n\nMoney, time, people. Decide which of the three you'll spend and the road picks itself.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('tempted', '솔직히 넘고 싶었습니다. 안쪽 바다가 더 좋아 보여서요.', 'Honestly, I wanted to cross. The water inside looked better.',
        '솔직해서 좋다. 다들 그렇게 보인다. 안 그렇게 보이는 사람이 이상한 거지.\n\n보이는 거랑 넘는 거 사이에 네가 서 있었다. 그거면 됐다. (명부의 내 이름 옆에 작은 표시를 한다.)',
        "Good, you're honest. It looks that way to everyone. Anyone it doesn't look that way to is the strange one.\n\nYou were standing between seeing it and crossing it. That's enough. (He makes a small mark beside my name in the roll.)",
        { affinity: 0.04, seaRep: 1, flag: 'choice.m2_07_tempted' }),
    ],
    completeReply: {
      coop: [
        '그래. 그게 계원 답이다. (다음 동행 일정에 내 이름을 올린다.)\n\n동행 날엔 내 말이 법이다. 물때 보고 들어가고, 물때 보고 나온다. 혼자 더 있겠다는 소리는 하지 마라. 같이 간 사람은 같이 나온다.',
        "Good. That's a member's answer. (He puts my name on the next outing.)\n\nOn outing days, my word is law. We go in by the tide and come out by the tide. Don't ask to stay on alone. Whoever goes in together comes out together.",
      ],
      park: [
        '편한 길도 길이다. 입장료는 네 돈이고. (입장료를 계에서 반만 대 준다.)\n\n낚시공원엔 난간이 있고 관리인이 있다. 돈 내고 사는 건 고기가 아니라 안전이다. 그거 알고 내면 아깝지 않다.',
        "The easy road is a road too. And the fee's on you. (The guild covers half of it anyway.)\n\nThe fishing park has railings and a warden. What the money buys you isn't fish, it's safety. Pay knowing that and it won't feel wasted.",
      ],
      boat: [
        '…배는 다음 챕터 얘기다. 그래도 그 마음, 적어 두지.\n\n배를 타려면 먼저 배를 알아야 한다. 멀미도, 물때도, 선장 말 듣는 법도. 서두르지 마라. 바다는 기다려 준다.',
        "…Boats are a later chapter. Still, I'll note that you asked.\n\nTo go out on a boat, you have to know boats first. Seasickness, tides, how to listen to a skipper. Don't rush it. The sea will wait.",
      ],
    },
  },

  // ── M2-08 「백운포의 볼락」 · 짐 강(짧은 반말 — 유작 · 동생 이야기는 아직) ──
  'M2-08': {
    offer: [
      d('light_edge', '빛 가장자리군요. 세 마리, 올려 보겠습니다.', "The edge of the light, then. I'll bring up three.",
        '그래. 볼락은 겁이 많아. 밝은 데는 무서워하고 어두운 데는 먹이가 없지.\n\n그 사이에 숨어서 기다려. 채비는 빛 경계에 흘려. 천천히. 볼락은 위를 보고 있어.',
        "Right. Rockfish are timid. They're scared of the bright part, and there's no food in the dark.\n\nSo they hide in between and wait. Drift your rig along the edge of the light. Slowly. Rockfish are looking up.",
        { affinity: 0.04 }),
      d('ask_legacy', '유작 루어를 찾으신다고요? 누구의 유작입니까?', "You're looking for someone's last lures? Whose?",
        '…일찍 간 사람. 루어를 깎던 사람이야. 그 이상은 아직이야.\n\n(빛 쪽으로 턱을 든다.) 볼락 올리면 얘기할지도 모르지. 안 할지도 모르고.',
        "…Someone who went too early. A man who carved lures. That's all, for now.\n\n(He lifts his chin toward the light.) Bring up the rockfish and maybe I'll tell you. Maybe not.",
        { affinity: 0.02, flag: 'choice.m2_08_asked_legacy' }),
      d('watched_nerves', '구경만 하시면, 볼락보다 제가 더 긴장되는데요.', "If you just watch, I'll be more nervous than the rockfish.",
        '긴장해도 돼. 나는 볼락 말고 네 손을 보는 거니까. 왜냐고는 묻지 마.\n\n(소리 없이 웃는다.) 손이 굳으면 볼락이 먼저 알아. 어깨 내리고, 나는 없는 사람이라고 생각해.',
        "Be nervous if you like. It's your hands I'm watching, not the rockfish. Don't ask why.\n\n(He laughs without a sound.) Stiff hands, and the rockfish know first. Drop your shoulders. Pretend I'm not here.",
        { affinity: 0.03, flag: 'choice.m2_08_watched' }),
    ],
    completeAdd: [
      d('father_rod', '아버지가 쓰시던 대입니다. 누가 만들었는지는 저도 모릅니다.', "It was my father's rod. I don't know who made it either.",
        '…아버지 거였구나. (한참 대를 본다.)\n\n그럼 그 대가 기억하는 손은 아버지 손이겠네. 잘 써. 대는 쓰는 사람 손을 따라가. 오늘은 볼락 셋이면 됐어.',
        "…So it was your father's. (He looks at the rod for a long while.)\n\nThen the hand that rod remembers is your father's. Use it well. A rod follows the hand that uses it. Three rockfish is enough for today.",
        { affinity: 0.04, flag: 'choice.m2_08_father_rod' }),
    ],
    completeReply: {
      ask_rod: [
        '…비슷한 손을 본 적이 있어서. 그건 다음에. (루어 하나를 손에 쥐여 준다. 오래된 것이다.)\n\n(집어등을 끄며 덧붙인다.) 묻는 건 잘했어. 나도 묻고 다니는 사람이니까. 대답이 늦는 건 내 사정이야. 네 탓 아니고.',
        "…I've seen hands like that before. Another time. (He presses a lure into my hand. An old one.)\n\n(Switching off the lamp, he adds:) You were right to ask. I go around asking things myself. If the answer's slow, that's my business. Not your fault.",
      ],
      just_fish: [
        '그렇게 말하는 낚시꾼이 오래 한다. (집어등 배터리값이라며 돈을 조금 준다.)\n\n욕심내는 사람은 넷째 마리 올리다 대를 부러뜨려. 셋에서 멈출 줄 아는 손이 다음 날도 던져. 그거면 됐어.',
        "The anglers who talk like that keep at it longest. (He gives me a little money — for the lamp battery, he says.)\n\nThe greedy ones break their rods going for a fourth. A hand that knows to stop at three gets to cast again the next day. That's enough.",
      ],
    },
  },

  // ── M2-09 「총회」 · 어촌계(도현수의 반대 이유는 말하지 않는다) ──
  'M2-09': {
    offer: [
      d('no_hiding', '부산에서 한 일, 숨길 것도 보탤 것도 없습니다.', 'What I did in Busan — nothing to hide, nothing to add.',
        '그럼 됐다. 숨길 게 없는 사람은 총회장에서 말이 짧다.\n\n위판 실적은 숫자로 들어간다. 다섯 건은 채워 와. 그 밑으로는 아무리 성실해도 표가 안 붙는다.',
        "Then that's that. People with nothing to hide keep it short at the meeting.\n\nYour consignment record goes in as numbers. Bring in five lots. Below that, no matter how hard you work, the votes won't come.",
        { affinity: 0.04 }),
      d('ask_silence', '아무 말 안 하신다는 건… 편을 안 드신다는 겁니까?', "When you say you'll say nothing… you mean you won't take my side?",
        '그래. 계장이 한 사람 편 들면 그날로 계가 아니다.\n\n네 편은 네가 한 일이 든다. 상자, 얼음, 위판 기록. 그게 나 대신 말할 거다. 다섯 건 채워서 서라.',
        "Right. The day the chief takes one person's side, it stops being a co-op.\n\nWhat you did will take your side. The crates, the ice, the consignment records. They'll speak for you instead of me. Fill your five lots and stand.",
        { affinity: 0.02, flag: 'choice.m2_09_asked_silence' }),
      d('can_fail', '심사라면… 이번엔 떨어질 수도 있습니까?', "If it's a review… could I fail this time?",
        '떨어질 수도 있지. 심사니까. (서류를 덮는다.)\n\n떨어진 사람은 다음 분기에 다시 선다. 그게 끝이 아니다. 떨 시간에 실적이나 채워.',
        "You could. It's a review. (He closes the file.)\n\nAnyone who fails stands again next quarter. It isn't the end. Instead of shaking, go fill your record.",
        { affinity: 0.02 }),
      d('rival_vote', '도현수도 그날 표를 던집니까?', 'Does Do Hyeonsu get a vote that day too?',
        '계원이면 다 던진다. 그 애도.\n\n누가 어디에 손 드는지는 미리 묻는 게 아니다. 그날 보면 안다. 어디에 들든 그건 그 애 표다. 너는 네 실적만 챙겨.',
        "Every member votes. Him too.\n\nYou don't ask ahead of time where people's hands will go. You'll see on the day. Wherever his goes, it's his vote. You look after your own record.",
        { affinity: 0.01, flag: 'choice.m2_09_asked_rival' }),
    ],
    completeAdd: [
      d('ask_grandfather', '손자분이 반대표를 던졌는데, 괜찮으십니까?', 'Your grandson voted against me. Are you all right with that?',
        '괜찮고 말고가 어딨냐. 총회에선 손자도 계원 하나다. (명부를 덮는다.)\n\n…그 애 표는 그 애 거다. 이유도 그 애 거고. 다만 그 애는 아무 이유 없이 손 드는 애가 아니다. 그건 알아 둬라.',
        "All right or not doesn't come into it. At the meeting my grandson is just one member. (He closes the roll.)\n\n…His vote is his. So is his reason. But he isn't one to raise his hand for no reason. Know that much.",
        { affinity: 0.03, flag: 'choice.m2_09_asked_grandfather' }),
    ],
    completeReply: {
      ask_hyeonsu: [
        '그래야지. 뒤에서 궁리하는 것보다 낫다. (봉투를 건넨다. 액수가 생각보다 크다.)\n\n물을 땐 따지지 말고 물어. 그 애는 따지고 들면 입부터 닫는다. 격려금은 얼음을 사든 상자를 사든 네 마음대로 써라.',
        "You should. Better than scheming behind his back. (He hands over an envelope. It's fatter than I expected.)\n\nWhen you ask, ask — don't accuse. Push him and the first thing he does is shut his mouth. The allowance is yours to spend, on ice or crates, however you like.",
      ],
      ignore: [
        '그것도 방법이다. 다만 그 하나가 누군지는 잊지 마.\n\n반대표는 적이 아니라 숙제다. 다음 총회 때 그 손이 어디로 가는지 보면, 네가 그동안 뭘 했는지 나온다.',
        "That's one way. Just don't forget whose vote it was.\n\nA vote against isn't an enemy, it's homework. Watch where that hand goes at the next meeting and you'll see what you did in the meantime.",
      ],
    },
  },

  // ── M2-11 「되돌아온 상자」 · 정옥선(손이 느려진 것 — 병 이야기는 7장 전에는 하지 않는다) ──
  'M2-11': {
    offer: [
      d('fix_display', '부산에서 배운 대로 바꿔 보겠습니다. 할머니는 앉아 계세요.', "I'll redo it the way I learned in Busan. You sit down, Grandma.",
        '앉아 있으라고? 내 좌판에서? (그래도 의자를 끌어다 앉는다.)\n\n해 봐. 부산 놈들 식이 뭔지 나도 좀 보자. 대신 얼음은 내 식대로다. 그건 안 바꾼다.',
        "Sit down? At my own stall? (She drags a stool over and sits anyway.)\n\nGo on. Let me see what this Busan way is. But the ice stays my way. That doesn't change.",
        { affinity: 0.05 }),
      d('busan_story', '부산 위판장은 여기 스무 배는 됩니다. 다 얘기해 드릴까요?', 'The Busan auction floor is about twenty times this. Shall I tell you all of it?',
        '스무 배? 크기만 크면 뭐 하냐. (코웃음을 친다. 그래도 귀는 이쪽으로 와 있다.)\n\n얘기는 손 움직이면서 해. 상자 규격부터. 거기선 어떻게 담더냐.',
        "Twenty times? What good is big. (She snorts. Still, her ear is turned my way.)\n\nTalk while your hands work. Start with the crate rules. How do they pack them there?",
        { affinity: 0.04 }),
      d('ask_hands', '손이 말을 안 듣는다니요? 어디 다치셨어요?', "Your hands won't listen? Did you hurt them?",
        '다치긴. 얼음 만지는 손이 다 그렇지. 별거 아니다.\n\n그 얘기 말고 좌판이나 봐. 상자가 다 제각각이잖아. 네 눈엔 그게 보이지?',
        "Hurt them, nothing. Hands that handle ice all go this way. It's nothing.\n\nNever mind that, look at the stall. The crates are all different. You can see that, can't you?",
        { affinity: 0.03, flag: 'choice.m2_11_asked_hands' }),
      d('tease', '부산 식으로 바꾸면 손님이 더 올 겁니다. 장담합니다.', "Do it the Busan way and you'll get more customers. I guarantee it.",
        '장담은 함부로 하는 거 아니다. 손님은 좌판 보고 오는 게 아니라 사람 보고 와.\n\n…그래도 보기 좋으면 한 번은 더 쳐다보겠지. 해 봐.',
        "Don't go guaranteeing things. Customers don't come for the stall, they come for the person.\n\n…Still, if it looks nice they might take a second look. Go on, then.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('learn_old_way', '다음엔 할머니 방식도 가르쳐 주세요.', 'Next time, teach me your way too.',
        '내 방식? 그건 가르치는 게 아니라 보고 훔치는 거다. (얼음 위에 생선 한 마리를 고쳐 눕힌다.)\n\n부산 규격이 상자를 살리면 내 방식은 손님을 살린다. 둘 다 알아야 좌판이다. 내일 와서 봐.',
        "My way? That isn't taught. You watch and steal it. (She lays one fish straighter on the ice.)\n\nThe Busan rules keep the crates alive. My way keeps the customers. You need both to run a stall. Come tomorrow and watch.",
        { affinity: 0.06, flag: 'choice.m2_11_learn_old_way' }),
    ],
    completeReply: {
      worry: [
        '늙어서 그렇다. 병원은 얼음값보다 비싸. …가 볼게, 네가 그러니. (그 말이 오래 걸린다.)\n\n(손을 앞치마에 문지른다.) 이 얘기 좌판에 퍼뜨리지 마라. 늙은이 손 얘기로 장사 안 된다. 너나 밥 거르지 말고.',
        "It's age, that's all. Doctors cost more than ice. …I'll go, since you're asking. (That last part takes her a long time to say.)\n\n(She rubs her hands on her apron.) Don't go spreading this round the stalls. An old woman's hands are no good for business. You just make sure you don't skip meals.",
      ],
      work: [
        '얼음은 네 일이었지, 처음부터. (웃는다. 오래 못 본 얼굴이다.)\n\n처음 왔을 때 상자 하나 들고 쩔쩔매던 게 엊그제 같은데. 이제 부산 규격까지 들고 왔네. …다 날랐으면 앉아. 밥 먹고 가.',
        "The ice was your job from the start. (She laughs. It's a face I haven't seen in a while.)\n\nIt feels like yesterday you were struggling with one crate. Now you've come back carrying the Busan rules. …Once it's all carried, sit. Eat before you go.",
      ],
    },
  },

  // ── M2-10 「면허 학원」 · 어촌계 ──
  'M2-10': {
    offer: [
      d('want_helm', '배는 늘 몰아 보고 싶었습니다. 필기부터 붙겠습니다.', "I've always wanted to take the helm. I'll pass the written first.",
        '몰아 보고 싶은 거랑 몰 줄 아는 거랑은 다르다. 그 차이가 필기다.\n\n항법, 기상, 법규. 바다에서 사람 살리는 순서가 다 거기 있다. 외우지 말고 이해해. 바다는 시험지처럼 안 나온다.',
        "Wanting to and knowing how aren't the same. The written exam is the difference.\n\nNavigation, weather, regulations. The order for keeping people alive at sea is all in there. Don't memorise it, understand it. The sea doesn't come at you like an exam paper.",
        { affinity: 0.04 }),
      d('ask_winter', '배를 몰아야 겨울 바다를 안다는 건 무슨 뜻입니까?', 'What do you mean, you only know the winter sea if you can run a boat?',
        '겨울엔 갯바위도 방파제도 파도에 묻힌다. 고기는 깊은 데로 빠지고.\n\n그때 바다에 나가 있는 건 배뿐이다. 남의 배에 얹혀서 보는 바다랑 내가 키 잡고 보는 바다는 다르다. 그걸 알라는 거다. 필기부터 해.',
        "In winter the rocks and breakwaters disappear under the waves. The fish drop off into deep water.\n\nThe only things out on the sea then are boats. The sea you see riding on someone else's boat isn't the sea you see with your own hands on the wheel. That's what you need to learn. Start with the written.",
        { affinity: 0.03, flag: 'choice.m2_10_asked_winter' }),
      d('desk_fear', '바다보다 책상이 더 무섭습니다. 떨어지면 어떡합니까?', 'A desk scares me more than the sea. What if I fail?',
        '떨어지면 다시 본다. 시험은 날짜가 또 온다. 바다는 다시 안 봐준다.\n\n그러니까 책상에서 틀리는 게 싸게 먹히는 거다. 모르는 건 지금 틀려 둬. 바다에서 틀리면 그땐 늦다.',
        "Fail and you sit it again. Exams come round again. The sea doesn't give second chances.\n\nSo getting it wrong at a desk is the cheap way. Get what you don't know wrong now. Get it wrong at sea and it's too late.",
        { affinity: 0.02 }),
      d('ask_fee', '학원비는 얼마나 듭니까? 위판으로 벌 수 있겠습니까?', 'How much is the course? Can I earn it from auctions?',
        '싸진 않다. 그래도 위판 네 건이면 된다. 얼음 아끼지 말고 제값 받아.\n\n학원비 아끼려고 상자 날리면, 그건 유찰 때 배운 걸 다시 배우는 거다.',
        "It isn't cheap. But four lots at auction will cover it. Don't skimp on ice, and get a fair price.\n\nLose a crate trying to save on the fee and you're just relearning what you learned when your crate didn't sell.",
        { affinity: 0.01, flag: 'choice.m2_10_asked_fee' }),
    ],
    completeAdd: [
      d('ask_skipper', '고만석 선장님은 어떤 분입니까?', "What's Skipper Ko Manseok like?",
        '말은 짧다. 배 위에선 그 사람 말이 법이고.\n\n가서 이름 대고, 시키는 대로 해. 그 배에서 배우는 게 필기 열 권보다 낫다. 이 릴 챙기고.',
        "Short on words. On his boat, his word is law.\n\nGo, give your name, and do as you're told. What you learn on that boat beats ten exam books. Take this reel with you.",
        { affinity: 0.03, flag: 'choice.m2_10_asked_skipper' }),
    ],
    completeReply: {
      study: [
        '기상이 어려워야 정상이다. 바다에서 제일 무서운 게 그거니까. (겨울용 릴을 내민다.)\n\n구름, 바람 방향, 기압. 외운 건 바다에서 다시 배운다. 그래도 외워 둔 사람이 먼저 알아챈다. 이상하다 싶으면 그날은 나가지 마라.',
        "Weather ought to be hard. It's the most frightening thing out there. (He holds out a winter reel.)\n\nClouds, wind direction, pressure. What you memorised, the sea teaches you again. But the one who memorised it notices first. If something feels off, don't go out that day.",
      ],
      easy: [
        '필기가 쉬웠으면 실기가 어려울 거다. 그 릴, 바다에서 떨어뜨리지 마.\n\n쉽다는 말은 바다 앞에선 하지 마라. 그 말 한 날 꼭 뭔가 일이 난다. …미신 아니다. 쉽다고 생각하는 순간 손이 느슨해져서 그렇다.',
        "If the written was easy, the practical will be hard. Don't drop that reel in the sea.\n\nDon't say easy in front of the sea. Something always goes wrong the day you say it. …It's not superstition. The moment you think it's easy, your hands go slack.",
      ],
    },
  },
};
