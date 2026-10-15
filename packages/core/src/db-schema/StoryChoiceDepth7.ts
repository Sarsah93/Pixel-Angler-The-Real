/**
 * @file StoryChoiceDepth7.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 7묶음: 서브 아크 N18 ~ N20.
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 *
 *  - N18 도현수(또래 라이벌 — 반말) · N19 정옥선 · 탁만수(심부름 아크 — 오십 년은 다섯째 편부터) · N20 유하랑(해요체 · 영어 she).
 *  - N19 텃밭 두 편(바구니 · 첫물)의 가르침은 농사 숙련도가 아니다 — 농사 기술을 안 배운 사람에게 흘러가 버린다(나레이션 237차 주석).
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { d, dNo } from './StoryChoiceDepthKit.js';

export const CHOICE_DEPTH_7: Record<string, ChoiceDepthEntry> = {
  // ── N18-1 「같은 대를 든 놈」 · 도현수 ──
  'N18-1': {
    offer: [
      d('side_by_side', '좋아. 같은 자리에서 한 마리씩. 해 보자.', "Fine. Same spot, one fish each. Let's do it.",
        '말 길게 안 해서 좋네. (턱으로 자기 옆자리를 가리킨다.) 거기. 내 옆.\n\n크기는 안 쳐. 먼저 올리는 것도 안 쳐. 던지는 거랑 거는 거, 그것만 본다. 다른 자리에서 낚은 건 낚은 걸로 안 쳐.',
        "Good, you don't drag it out. (He jerks his chin at the spot beside him.) There. Next to me.\n\nSize doesn't count. Who's first doesn't count either. I'm watching the cast and the strike, that's all. Anything you land from another spot doesn't count.",
        { affinity: 0.04 }),
      d('ask_rod', '이 대를 알아? 왜 어디서 났냐고 묻는데.', 'You know this rod? Why ask where I got it?',
        '…아는 거 없어. (시선이 손잡이 흠집에 오래 머문다.) 그냥 눈에 걸렸어.\n\n대가 진짜인지는 던지는 걸 보면 알아. 손이 대를 쓰는지, 대가 손을 끌고 가는지. 그거 보자는 거야.',
        "…I don't know anything. (His eyes stay on the scratches on the grip for a long moment.) It just caught my eye.\n\nWhether a rod is real shows in the cast. Whether the hand uses the rod or the rod drags the hand. That's what I want to see.",
        { affinity: 0.02, flag: 'choice.n18_1_asked_rod' }),
      d('father_rod', '아버지 대야. 어디서 났는지는 네가 알 바 아니고.', "It's my father's. Where it came from is none of your business.",
        '…아버지 대. (잠깐 말이 없다.) 그래, 알 바 아니지. 나도 더 안 물어.\n\n그럼 더 봐야겠네. 그 대가 네 손에서 어떻게 휘는지. 옆자리 비워 둘게. 어깨에 힘 들어가면 대가 먼저 안다.',
        "…Your father's. (He says nothing for a moment.) Right, none of my business. I won't ask again.\n\nThen I need to watch even more. How that rod bends in your hands. I'll keep the spot beside me free. Put your shoulder into it and the rod knows first.",
        { affinity: -0.02, flag: 'choice.n18_1_father_rod' }),
      d('what_stakes', '지면 뭐 해 주는데? 내기면 걸 게 있어야지.', 'And if I lose? A bet needs stakes.',
        '내기 같은 거 안 해. (코웃음을 친다.) 지는 쪽이 말이 없어지는 거지. 그거면 충분해.\n\n…걸 게 꼭 있어야 하면 나중에 정해. 일단 한 마리부터 올려. 말은 그다음이야.',
        "I don't do bets. (He snorts.) The loser goes quiet. That's enough.\n\n…If you really need stakes, we'll settle it later. Land one first. Talk comes after.",
        { affinity: 0, flag: 'choice.n18_1_bet' }),
    ],
    completeAdd: [
      d('no_count', '누가 먼저였는지는 안 셀래. 같이 서 본 걸로 됐어.', "I'm not counting who was first. Standing there together was enough.",
        '…안 센다고? 나는 셌어. 네 챔질이 반 박자 늦었어. (그래도 등을 돌리기 전에 한 번 더 내 대를 본다.)\n\n다음엔 세. 세야 늘어. 오늘은… 오늘은 됐다. 같은 자리에 선 게 너라서 다행이라는 말은 안 할 거야.',
        "…Not counting? I counted. Your strike was half a beat late. (Still, before he turns away he looks at my rod once more.)\n\nCount next time. Counting is how you get better. Today… today's fine. I'm not going to say I'm glad it was you standing there.",
        { affinity: 0.07, harborRep: 1 }),
    ],
    completeReply: {
      compete: [
        '…그래. 그래야 재미지. (내기라는 말이 나오자 그의 눈이 바뀐다. 다음이 있다는 뜻이다.)\n\n더 큰 거면 자로 재. 눈대중은 안 쳐 준다. 다음 물때에 이 자리. 그 대 들고 와.',
        "…Right. That's what makes it interesting. (At the word 'bet' his eyes change. It means there's a next time.)\n\nIf it's bigger, measure it. I don't count eyeballing. Next tide, this spot. Bring that rod.",
      ],
      concede: [
        '술은 내가 산다. 아직 미성년자는 아니지. (편의점 봉투가 무겁다.)\n\n인정은 받아 둘게. 근데 그 대가 진 건 아니야. 대는 아직 네 손을 모르고, 네 손은 아직 대를 몰라. 그건 시간이 해.',
        "Drinks on me. I'm not underage any more. (The shop bag is heavy.)\n\nI'll take the admission. But it wasn't the rod that lost. The rod doesn't know your hands yet, and your hands don't know the rod. Time does that part.",
      ],
      ask_tip: [
        '…한 번만 보여 준다. 찌가 잠기고 나서 세는 게 아니라 잠기기 전에 손이 가 있어야 해.\n\n(손바닥을 물 위에 띄우듯 내밀어 보인다.) 찌가 흔들리는 걸 눈으로 보지 말고 손목으로 들어. 그러면 잠기기 전에 알게 돼. 오늘 너는 눈으로만 봤어.',
        "…I'll show you once. You don't count after the float goes under. Your hand has to be moving before it does.\n\n(He holds his palm out flat, as if it were floating on the water.) Don't watch the float wobble, listen to it with your wrist. Then you know before it goes under. Today you only used your eyes.",
      ],
    },
  },

  // ── N19-1 「얼음과 대나무」 · 탁만수 ──
  'N19-1': {
    offer: [
      d('carry', '지나는 길에 놓고 오겠습니다. 이름은 빼겠습니다.', "I'll drop it off on my way. Your name stays out of it.",
        '…그래. 이름은 빼고. (받침을 천으로 한 번 싸서 건넨다.)\n\n좌판 얼음 상자 밑에 받치면 된다. 어디 둘지는 그 사람이 알아서 할 거다. 너는 두고만 와. 무슨 말을 하든 그냥 듣고 와.',
        "…Right. Leave the name out. (He wraps the rest in a cloth and hands it over.)\n\nIt goes under the ice box at the stall. She'll decide where it sits. You just leave it. Whatever she says, just listen and come back.",
        { affinity: 0.04 }),
      d('ask_rest', '얼음 상자 받침이요? 이걸 받치면 뭐가 달라집니까.', 'A rest for the ice box? What difference does it make?',
        '얼음이 녹으면 물이 상자 밑에 고인다. 그 물에 얼음이 더 빨리 녹아. (받침을 뒤집어 마디 사이 틈을 보여 준다.)\n\n마디 사이를 띄워 깎았다. 물이 그 틈으로 빠지고 바람이 든다. 그러면 얼음이 한참 더 간다. 좌판 하는 사람한테는 그게 돈이야.',
        "When ice melts, water pools under the box. That water melts the ice faster. (He turns the rest over to show the gaps between the nodes.)\n\nI cut it with space between the nodes. The water drains through and air gets in. Then the ice lasts a good while longer. For someone running a stall, that's money.",
        { affinity: 0.05, flag: 'choice.n19_1_asked_rest' }),
      d('why_not_you', '직접 가져다드리시면 안 됩니까? 가까운데요.', "Couldn't you take it yourself? It's close.",
        '…가깝지. 가까워서 못 가는 데도 있다. (대를 깎던 칼을 내려놓았다가 다시 든다.)\n\n묻지 마라. 늙은이 일은 늙은이가 안다. 심부름꾼은 심부름만 하면 돼. 그게 너한테도 편하다.',
        "…It is close. Some places you can't go because they're close. (He sets down the carving knife, then picks it up again.)\n\nDon't ask. Old people's business is for old people. An errand boy just runs the errand. That's easier for you too.",
        { affinity: -0.01, flag: 'choice.n19_1_asked_why' }),
      d('if_asked', '누가 놓고 갔냐고 물으시면 뭐라고 합니까?', 'If she asks who left it, what do I say?',
        '…주웠다고 해라. (말해 놓고 고개를 젓는다.) 아니다, 그건 거짓말이지.\n\n그냥 놓고 나와. 묻기 전에. 대답 못 할 말은 처음부터 안 듣는 게 낫다. 그래야 너도 거짓말을 안 하지.',
        "…Say you found it. (He says it, then shakes his head.) No, that's a lie.\n\nJust leave it and walk out. Before she asks. Better not to hear a question you can't answer. That way you don't have to lie either.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('no_fee', '심부름값은 됐습니다. 지나는 길이었으니까요.', 'No need to pay me. I was passing anyway.',
        '…지나는 길. 그래, 그렇게 해 두자. (깎던 대를 내려놓고 나를 한 번 본다.)\n\n빚은 안 지는 성미인데, 이건 지고 가지. 공방 앞을 지날 일 있으면 들러라. 차 한 잔은 있다.',
        "…Passing anyway. Fine, let's call it that. (He puts down the rod he's carving and looks at me once.)\n\nI'm not one for owing, but I'll owe you this one. If you're ever passing the workshop, come in. There's always a cup of tea.",
        { affinity: 0.06, harborRep: 1 }),
    ],
    completeReply: {
      relay_true: [
        '……그랬어? 그랬구나. (한동안 말이 없다. 그날 저녁 할머니 좌판에 새 받침이 하나 더 놓였다.)\n\n마디를 쓸어 봤으면 결이 맞았단 얘기다. 대나무는 손에 걸리면 그 자리에서 내려놓게 돼. 안 내려놨으면 됐다.',
        "……She did? I see. (He says nothing for a time. That evening a new rest appeared on her stall.)\n\nIf she ran her hand over the nodes, the grain was right. Bamboo that snags the hand gets put down on the spot. If she didn't put it down, that's enough.",
      ],
      relay_soft: [
        '…그렇지. 그 사람이 뭘. (대를 다시 깎는다. 소리가 조금 거칠다.)\n\n괜찮다. 말 안 하는 것도 대답이다. 받침이 좌판 밑에 들어갔으면 그걸로 됐어. 얼음이 오래 가면 그만이지.',
        "…Of course not. What would she say. (He goes back to shaping. The sound is a little rougher.)\n\nIt's fine. Saying nothing is an answer too. If the rest went under the stall, that's enough. As long as the ice lasts, that's all.",
      ],
      lesson: [
        '조용히만 있으면. (톱질 소리와 마디 소리를 구분하는 법을 알게 된다.)\n\n톱이 마디에 닿으면 소리가 한 번 막힌다. 거기서 서두르면 대가 갈라져. 숨을 한 번 쉬고 넘어가. 대도 사람도 막히는 데서 갈린다.',
        "If you stay quiet. (I learn to tell the sound of the saw from the sound of the cane.)\n\nWhen the saw meets a node, the sound catches once. Hurry there and the cane splits. Take a breath and go through. Bamboo and people both split where they catch.",
      ],
    },
  },

  // ── N19-7 「귀퉁이 바구니」 · 정옥선 (텃밭 입문 — 작물 이름을 대지 않는다) ──
  'N19-7': {
    offer: [
      d('plant_two', '해 본 적은 없지만, 두 칸 심어 보겠습니다.', "I've never done it, but I'll plant two cells.",
        '해 본 놈이 어디 있냐. 처음엔 다 흙 만지는 손이 서툴러. (바구니에서 남는 걸 골라 봉지에 담아 준다.)\n\n흙만 덮어 줘도 반은 한 거다. 나머지 반은 기다리는 거고. 기다리는 건 바다에서 배웠지?',
        "Who's ever done it before they did it? Everyone's clumsy with soil at first. (She picks the spares out of the basket and bags them for me.)\n\nJust covering them with soil is half the job. The other half is waiting. You learned waiting at sea, didn't you?",
        { affinity: 0.05 }),
      d('ask_yard', '마당이 풀밭인데요. 거기에 심어도 자랍니까?', 'My yard is all weeds. Will anything grow there?',
        '풀이 자라는 땅이면 뭐든 자란다. 풀 무성한 건 흙이 살아 있다는 뜻이야. (손가락으로 흙 뒤집는 시늉을 한다.)\n\n풀부터 뽑고 두 칸만 뒤집어. 다 하려다 지친다. 마당에 밭이 없으면 사이소에서 일구는 걸 판다더라.',
        "If weeds grow there, anything will. Thick weeds mean the soil's alive. (She mimes turning soil with her fingers.)\n\nPull the weeds and turn over just two cells. Try to do it all and you'll wear out. If there's no plot in the yard, they sell the kit for digging one at Saiso.",
        { affinity: 0.04, flag: 'choice.n19_7_asked_yard' }),
      d('ask_what', '철마다 남는 거라니, 지금은 뭐가 남았습니까?', "Spares each season — what's spare right now?",
        '그건 철이 정하지. 봄이면 봄 것, 가을이면 가을 것. 지금 밭에서 남는 걸 그대로 넣었다. (봉지 입구를 접어 내 손에 쥐여 준다.)\n\n열어 보면 안다. 이름 몰라도 심으면 자라. 자라면 그때 이름 불러 주면 돼.',
        "The season decides that. Spring things in spring, autumn things in autumn. I put in exactly what's spare in the plot right now. (She folds the top of the bag and presses it into my hand.)\n\nOpen it and you'll see. You don't need the name to plant it. Once it grows, call it by its name then.",
        { affinity: 0.03 }),
      d('no_time', '바다 일 하면서 밭까지 돌볼 시간이 될까요?', 'Will I have time for a field on top of the sea work?',
        '된다. 바다는 물때가 정하고 밭은 철이 정해. 둘 다 기다리는 일이라 같이 할 수 있어. (바구니를 내 쪽으로 툭 민다.)\n\n두 칸이다. 두 칸에 하루 다 안 써. 물때 기다리는 동안 풀 한 줌 뽑으면 그게 밭일이다.',
        "You will. The tide decides the sea and the season decides the field. Both are waiting work, so you can do them together. (She nudges the basket towards me.)\n\nIt's two cells. Two cells won't take your whole day. Pull a handful of weeds while you wait for the tide, and that's field work.",
        { affinity: 0.02, flag: 'choice.n19_7_worried_time' }),
    ],
    completeAdd: [
      d('no_wage', '품삯은 됐습니다. 나눠 주신 것만으로 충분합니다.', 'No wage, please. What you shared with me is plenty.',
        '…남는 거 준 거다. 나눈 거 아니야. (그래도 봉투를 도로 서랍에 넣는다.)\n\n그 말은 첫물 맛볼 때 다시 해라. 그때도 그 소리 하면 그땐 믿어 주지. 단골들한테는 네가 밭 일군다고 말해 둔다.',
        "…I gave you spares. That's not sharing. (Still, she puts the envelope back in the drawer.)\n\nSay that again when I taste the first picking. If you still say it then, I'll believe you. I'll tell the regulars you've dug a plot.",
        { affinity: 0.06, harborRep: 1 }),
    ],
    completeReply: {
      pay: [
        '그래, 받아. 밭도 거저는 아니지. (봉투를 건넨다.)\n\n호미 하나, 씨 한 봉도 다 돈이다. 아끼는 건 좋은데 흙에는 아끼지 마. 흙에 아낀 건 꼭 열매에서 빠진다.',
        "Right, take it. A field isn't free either. (She hands me the envelope.)\n\nA hoe, a packet of seed, it all costs. Saving is good, but don't skimp on soil. Whatever you skimp on the soil always comes out of the harvest.",
      ],
    },
  },

  // ── N19-8 「첫물」 · 정옥선 ──
  'N19-8': {
    offer: [
      d('promise_first', '첫물은 할머니께 드리겠습니다. 제일 좋은 걸로요.', "The first picking is yours. I'll bring the best of it.",
        '제일 좋은 거 고르지 마. 처음 딴 거. 그게 첫물이다. (바구니 귀퉁이를 손바닥으로 비워 둔다.)\n\n좋고 나쁜 건 맛보는 사람이 정해. 너는 그냥 따서 가져와. 고르다 보면 남 주기 아까워진다.',
        "Don't pick the best. The first one you pick. That's the first picking. (She clears a corner of the basket with her palm.)\n\nThe one tasting decides good or bad. You just pick it and bring it. Start choosing and you'll begrudge giving it away.",
        { affinity: 0.05 }),
      d('ask_word', '첫물이 뭡니까? 처음 거둔 걸 말씀하시는 겁니까?', "What's the first picking? Do you mean the very first harvest?",
        '그래. 밭에서 처음 거둔 거. 바다로 치면 그해 처음 잡은 고기지. (손가락 하나를 세워 보인다.)\n\n그걸 남한테 먼저 주면 밭이 인심을 안다고 했다. 우리 어머니 말이야. 믿든 말든 나는 지금도 그렇게 해.',
        "That's right. The first thing you take from the field. At sea, it'd be the first fish of the year. (She holds up one finger.)\n\nGive that to someone else first and the field learns you're generous, she said. My mother's words. Believe it or not, I still do it.",
        { affinity: 0.04, flag: 'choice.n19_8_asked_word' }),
      d('worried_shape', '못나게 자라면 어쩌죠? 드리기 민망할 것 같습니다.', "What if it grows ugly? I'd be embarrassed to bring it.",
        '못생긴 거 먹어도 배부르다. (웃는다.) 모양 보자는 거 아니야. 네 밭 흙 맛 보자는 거지.\n\n잎이 몇 장인지는 말로 하지 말고 들고 와. 말로 들으면 다 잘 큰 것 같거든. 보는 게 제일 정직해.',
        "An ugly one fills you up just the same. (She laughs.) I'm not asking to see its looks. I want to taste your field's soil.\n\nDon't tell me how many leaves, bring it. Everything sounds well grown when you only hear about it. Seeing is the most honest.",
        { affinity: 0.03 }),
      d('sea_is_other', '바다에선 잡은 사람이 먼저 맛보는데, 밭은 다르군요.', 'At sea the one who catches it tastes it first. Fields are different.',
        '바다는 잡은 그 자리에서 먹지. 밭은 같이 기다린 게 많아. 하늘도 기다렸고 흙도 기다렸어. (바구니를 손끝으로 두드린다.)\n\n그러니 처음 건 남 줘라. 네 몫은 다음 물부터다. 다음 물은 생각보다 금방 온다.',
        "At sea you eat it right where you caught it. A field had a lot waiting with you. The sky waited, the soil waited. (She taps the basket with her fingertips.)\n\nSo give the first away. Yours starts with the next lot. The next lot comes sooner than you'd think.",
        { affinity: 0.02, flag: 'choice.n19_8_sea_vs_field' }),
    ],
    completeAdd: [
      d('back_ache', '밭일 하고 나니 허리가 뻐근합니다. 요령이 있습니까?', "My back's stiff after the field work. Is there a trick to it?",
        '쪼그려 앉지 마. 한쪽 무릎을 땅에 대고 앉아. 허리는 한번 상하면 바다 일도 끝이다. (좌판 의자에서 일어나 직접 시늉해 보인다.)\n\n오래 할 일은 몸부터 아껴. 밭이든 바다든 오래 하는 놈이 이기는 거야.',
        "Don't squat. Kneel on one knee. Hurt your back once and your sea work's done too. (She gets up from the stall chair and shows me herself.)\n\nIf it's work you'll do for years, look after your body first. Field or sea, the one who lasts is the one who wins.",
        { proficiency: { category: 'life', xp: 20 }, affinity: 0.04 }),
    ],
    completeReply: {
      pay: [
        '그래야지. (봉투를 건넨다. 안에 상추씨 한 봉이 같이 들어 있다.)\n\n씨는 덤이다. 받았으면 심어. 서랍에 넣어 두면 씨도 늙는다. 다음 철에 그걸로 또 첫물 내.',
        "Of course. (She hands me the envelope. There's a packet of lettuce seed inside too.)\n\nThe seed's extra. If you take it, plant it. Leave it in a drawer and seed gets old too. Next season, make another first picking from it.",
      ],
    },
  },

  // ── N18-2 「경매장 뒷줄」 · 도현수 ──
  'N18-2': {
    offer: [
      d('back_row', '좋아. 뒷줄이면 손이 다 보이겠네. 같이 읽자.', "Fine. From the back row you'd see every hand. Let's read them.",
        '그래서 뒷줄이야. 앞줄은 숫자만 보여. (경매사 쪽으로 턱짓한다.)\n\n네 물건 두 건 올려. 네 거 값 매겨지는 걸 뒤에서 보면 다르게 보여. 앞에 서 있으면 숨부터 막히거든.',
        "That's why it's the back row. From the front you only see numbers. (He jerks his chin towards the auctioneer.)\n\nPut two lots of yours up. Watching your own stuff get priced from the back looks different. Stand at the front and you just stop breathing.",
        { affinity: 0.04 }),
      d('ask_here', '너는 여기서 뭐 하는 건데? 부산까지 와서.', 'What are you doing here, anyway? All the way out in Busan.',
        '견습. 중개인 밑에서. (명찰도 없는 가슴께를 손가락으로 툭 친다.) 아직 이름 걸고 손 드는 사람은 아니야.\n\n속초에선 다들 날 할아버지 얼굴로 봐. 여기선 아무도 안 봐. 그게 편해. 너도 오늘은 그냥 뒷줄 사람이야.',
        "Apprentice. Under a broker. (He taps his chest where a name badge would be, if he had one.) I'm not someone who raises a hand under his own name yet.\n\nBack in Sokcho everyone sees my grandfather's face on me. Here nobody looks. It's easier. Today you're just someone in the back row too.",
        { affinity: 0.05, flag: 'choice.n18_2_asked_apprentice' }),
      d('ask_read', '낙찰가를 읽는다는 게 뭔데? 숫자 보는 거 아냐?', "Reading the prices? Isn't that just looking at numbers?",
        '숫자는 끝이야. 그 전에 손이 먼저 올라가. 누가 먼저 드는지, 몇 번 망설이는지. (손가락을 접었다 폈다 해 보인다.)\n\n그거 보면 숫자가 어디서 멈출지 대충 보여. 오늘 둘이 맞혀 보자.',
        "The number's the end of it. Before that the hands go up. Who raises first, how many times they hesitate. (He folds and unfolds his fingers to show me.)\n\nWatch that and you can roughly see where the number will stop. Let's both call them today.",
        { affinity: 0.03, flag: 'choice.n18_2_asked_reading' }),
      d('win_here', '아무도 날 모른다니 잘됐네. 여기선 내가 이길 수도 있겠다.', 'Nobody knows me here? Good. I might actually win this time.',
        '이기고 지는 데 아니야, 여기. 값 매기는 데지. (피식 웃는다.)\n\n…그래도 맞히는 수는 세자. 반 넘게 맞히면 인정해 줄게. 못 넘기면 뒷줄 자판기 커피는 네가 사.',
        "This isn't a place for winning and losing. It's a place for pricing. (He snorts a laugh.)\n\n…Still, let's count who calls more. Get more than half and I'll give you that. Fall short and you buy the back-row vending machine coffee.",
        { affinity: 0.01, flag: 'choice.n18_2_bet' }),
    ],
    completeAdd: [
      d('no_cut', '수수료는 됐어. 오늘은 뒷줄에서 배운 걸로 충분해.', 'Keep your cut. What I learned in the back row today is enough.',
        '…공짜로 배우면 버릇 된다. (그래도 꺼냈던 지갑을 도로 넣는다.)\n\n빚으로 달아 둘게. 견습이 계원한테 진 빚. 갚을 때까지 너는 뒷줄 단골이야.',
        "…Learning for free turns into a habit. (Still, he puts the wallet he'd taken out back in his pocket.)\n\nI'll put it down as a debt. An apprentice owing a co-op member. Until I pay it off, you're a back-row regular.",
        { affinity: 0.07, harborRep: 1 }),
    ],
    completeReply: {
      lesson: [
        '…가르쳐 달라고? 좋아. 한 번만. (경매장 소리를 듣는 귀가 생긴다.)\n\n경매사 손가락보다 목소리를 들어. 값이 멈출 데가 오면 말이 반 박자 늘어져. 그 늘어지는 데서 마지막 손이 올라가.',
        "…You're asking me to teach you? Fine. Once. (I get an ear for the sound of the auction hall.)\n\nListen to the auctioneer's voice, not his fingers. When the price is about to stop, the words stretch half a beat. That's where the last hand goes up.",
      ],
      compete: [
        '해 봐. (그도 웃는다. 라이벌이라는 말이 가장 잘 맞는 순간이다.)\n\n다음엔 네 물건 말고 남의 물건으로 맞혀. 제 물건 값은 다들 높게 불러. 남의 걸 맞혀야 진짜 눈이야.',
        "Try it. (He laughs too. It's the moment the word 'rival' fits best.)\n\nNext time call someone else's lots, not yours. Everyone guesses high on their own. Calling other people's is the real eye.",
      ],
      pay: [
        '…중개 수수료라 이거지. 반. (돈을 세는 그의 손이 어른 같다.)\n\n견습 몫에서 나가는 거야. 아깝다는 소리는 안 해. 네가 반 맞혔으니 반 받는 게 맞지. 셈은 정확해야 해.',
        "…A broker's cut, is it. Half. (The hand counting the money is a grown man's.)\n\nIt comes out of my apprentice share. I won't say I grudge it. You called half, so you get half. Sums have to be exact.",
      ],
    },
  },

  // ── N19-2 「부고 아닌 편지」 · 정옥선 ──
  'N19-2': {
    offer: [
      d('not_funny', '우습지 않습니다. 식기 전에 갖다 드리겠습니다.', "It's not funny. I'll get it to him before it goes cold.",
        '…식으면 데워 먹으면 되지. 그래도 빨리 가. (반찬통 뚜껑을 한 번 더 눌러 닫는다.)\n\n문 앞에 두고 와. 얼굴 볼 거 없다. 앓는 사람은 남한테 앓는 얼굴 보이는 거 싫어해.',
        "…If it goes cold he can heat it up. Still, go quickly. (She presses the lid down once more.)\n\nLeave it at the door. No need to see his face. Sick people don't like being seen sick.",
        { affinity: 0.06 }),
      d('ask_who', '탁 씨라면, 죽간 공방 노인장 말씀이십니까?', 'Tak — you mean the old man at the bamboo workshop?',
        '이 항구에 탁 씨가 둘이냐. 대 깎는 그 노인. (시선을 반찬통에 둔 채 말한다.)\n\n좌판에 도는 말이 그렇다더라. 기침을 한다고. 공방 문 앞에 두기만 하면 돼. 안에 들어갈 거 없다.',
        "How many Taks do you think this harbour has? The old man who carves rods. (She says it with her eyes on the container.)\n\nThat's the word going round the stalls. Coughing, they say. Just leave it at the workshop door. No need to go in.",
        { affinity: 0.03, flag: 'choice.n19_2_asked_who' }),
      d('ask_food', '꽤 무겁네요. 뭘 이렇게 많이 싸셨습니까?', 'This is heavy. What did you pack so much of?',
        '보지 마라. 반찬이다. 그거면 됐어. (보자기 매듭을 한 번 더 조인다.)\n\n앓는 사람 입은 짧으니까 이것저것 넣었다. 하나라도 넘어가면 됐지. 많이 싼 거 아니다. 늙은이 손이 커서 그래.',
        "Don't look. It's food. That's all you need to know. (She pulls the knot of the wrapping cloth tighter.)\n\nA sick man has no appetite, so I put in a bit of everything. If even one thing goes down, that's enough. It's not a lot. An old woman's hands are just generous.",
        { affinity: 0.01, flag: 'choice.n19_2_asked_food' }),
      d('go_yourself', '직접 가져다드리면 더 좋아하실 텐데요.', "He'd be happier if you took it yourself.",
        '누가 좋아하래. (반찬통을 내 쪽으로 밀어 버린다.) 쓸데없는 소리 말고.\n\n…내가 가면 그 사람이 일어나야 해. 앓는 사람 일으키는 거 아니다. 그러니 네가 가. 내가 보냈다고는 하지 말고.',
        "Who said anything about happy. (She shoves the container at me.) Enough nonsense.\n\n…If I go, he'll have to get up. You don't make a sick man get up. So you go. And don't tell him I sent it.",
        { affinity: -0.02, flag: 'choice.n19_2_pushed' }),
    ],
    completeAdd: [
      d('bus_fare', '부산에서 오는 버스비만 받겠습니다.', "I'll just take the bus fare from Busan.",
        '버스비? …그래, 받아. 반찬 나르는 것도 일이다. (봉투를 건넨다. 동전까지 맞춰 넣었다.)\n\n다음에 또 시키면 그때도 받아. 공짜 심부름은 오래 못 간다. 받는 사람도 시키는 사람도 불편해져.',
        "Bus fare? …All right, take it. Carrying food is work too. (She hands me an envelope, counted out down to the coins.)\n\nIf I ask again, take it then too. Free errands don't last. They get awkward for the one asking and the one going.",
        { payMult: 0.6, affinity: 0 }),
    ],
    completeReply: {
      deliver: [
        '…고맙다. 묻지 마라. (며칠 뒤 공방에서 대나무 받침이 하나 더 나왔다.)\n\n기침을 한다니 아직 숨은 쉬는 거다. 늙은이 기침은 소리가 나야 낫는 거야. …그 얘긴 그만하자.',
        "…Thank you. Don't ask. (A few days later another bamboo rest came out of the workshop.)\n\nIf he's coughing, he's still breathing. With old people, a cough has to make a sound before it gets better. …Let's leave it there.",
      ],
      // 영어 원문은 정옥선을 He로 적었다 — 늘리는 김에 She로 바로잡는다(한국어 원문은 글자 그대로)
      read_first: [
        '너. (한참 노려보다가 웃는다. 그래도 그 얘긴 두 번 안 한다.)\n\n남의 반찬통 여는 거 아니다. 남의 편지 여는 거랑 같아. 다음엔 궁금해도 참아. 참는 것도 심부름이다.',
        "You. (She glares for a while, then laughs. She never mentions it again.)\n\nYou don't open someone else's food container. It's the same as opening their letter. Next time, curious or not, hold back. Holding back is part of the errand.",
      ],
      refuse_read: [
        '…똑똑한 애구나. (좌판 앉을 때 내 자리가 하나 생겼다.)\n\n두 사람 일이라. 그래, 맞는 말이다. 그 말 할 줄 아는 애한테는 다음 심부름도 맡길 수 있어.',
        "…A clever kid. (I get a seat at the stall.)\n\nBetween the two of us, you said. Yes, that's right. Someone who knows to say that, I can trust with the next errand too.",
      ],
    },
  },

  // ── N18-3 「명태 이야기」 · 도현수 ──
  'N18-3': {
    offer: [
      d('two_hands', '좋아. 받아 적는 손이 둘이면 덜 놓치겠지.', "Good. With two of us writing, we'll miss less.",
        '…그래. 한 사람이 말해도 두 사람이 다르게 들어. (주머니에서 수첩을 꺼낸다. 표지가 닳았다.)\n\n저녁에 맞춰 보자. 네가 적은 거랑 내가 적은 거. 다른 데가 제일 중요한 데야.',
        "…Right. One person talks, two people hear it differently. (He pulls a notebook from his pocket. The cover is worn.)\n\nLet's compare in the evening. What you wrote and what I wrote. Where they differ is what matters most.",
        { affinity: 0.04 }),
      d('ask_like', '노인들이 너를 좋아한다고? 포항 분들이 너를 어떻게 알아.', 'The old folks like you? How would anyone in Pohang know you?',
        '모르지. 처음 봐. (어깨를 으쓱한다.) 노인들은 아는 사람보다 듣는 사람을 좋아해.\n\n말 끊지 않고 고개만 끄덕이면 돼. 총회 뒷줄에 오래 앉아 있으면 저절로 배워. 거기선 다들 말이 길거든.',
        "They don't. First time they've seen me. (He shrugs.) Old people like someone who listens more than someone they know.\n\nDon't cut in, just nod. Sit in the back row of the general meeting long enough and you pick it up. Everyone talks long there.",
        { affinity: 0.05, flag: 'choice.n18_3_asked_like' }),
      d('tease_follow', '그냥 따라온 사람이 수첩까지 챙겨 왔네.', 'For someone who just came along, you brought a notebook.',
        '…버릇이야. (수첩을 주머니에 도로 넣었다가 다시 꺼낸다.) 적을 거 있으면 적는 거지.\n\n따라온 김에. 그 이상은 없어. 웃지 마. 노인들 앞에서 웃으면 말이 끊겨.',
        "…Habit. (He puts the notebook back in his pocket, then takes it out again.) If there's something to write, you write it.\n\nSince I'm here anyway. That's all. Don't laugh. Laugh in front of the old folks and they stop talking.",
        { affinity: 0.02, flag: 'choice.n18_3_teased' }),
      d('ask_pollock', '명태 얘기를 들으면, 명태가 걸려도 놓아줘야 하는 거지?', "If we're hearing about pollock, we let any pollock we hook go, right?",
        '당연하지. 명태는 일 년 내내 잡으면 안 되는 고기야. 걸리면 바로 놔. (목소리가 조금 낮아진다.)\n\n노인들이 말한 그 고기를 만나면 놓아주는 데까지가 채록이야. 듣기만 하고 잡아 가면 거짓말이지.',
        "Obviously. Pollock is off limits all year round. Hook one and you let it go right away. (His voice drops a little.)\n\nIf you meet the fish the old folks talk about, letting it go is part of the record. Listening and then keeping it would be a lie.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('share_name', '채록본에 네 이름도 같이 올리자.', "Let's put your name on the record too.",
        '…내 이름은 빼. 따라온 거라니까. (그래도 수첩 맨 끝 장에 자기 이름을 작게 적는다.)\n\n두 사람이 적었다고만 써. 이름은 노인들 거면 돼. 말한 사람이 주인이지 적은 사람이 주인이 아니야.',
        "…Leave my name off. I just came along, I told you. (Still, he writes his name small on the last page of his notebook.)\n\nJust write that two people took it down. The names should be the old folks'. The one who spoke owns it, not the ones who wrote it down.",
        { affinity: 0.06, harborRep: 1 }),
    ],
    completeReply: {
      lesson: [
        '…듣는 거야. 끼어들지 않고. (사람 말 듣는 법이 다른 데서도 쓰인다.)\n\n말이 끊기면 다음 질문을 하지 말고 기다려. 노인들은 쉬었다가 진짜 얘기를 해. 그 쉬는 데를 못 참으면 반만 듣는 거야.',
        "…You listen. Without cutting in. (Listening to people turns out to be useful elsewhere too.)\n\nWhen they stop talking, don't ask the next question, wait. Old folks rest and then say the real thing. If you can't stand the pause, you only hear half.",
      ],
      compete: [
        '글씨부터 고쳐. (웃는다. 두 사람이 같은 노인을 두고 웃는 건 처음이다.)\n\n많이 적는다고 잘 적는 거 아니야. 노인 말투 그대로 적어. 고쳐 적으면 그 사람이 없어져.',
        "Fix your handwriting first. (He laughs. It's the first time we've laughed over the same old man.)\n\nWriting a lot isn't writing well. Write it the way the old man says it. Tidy it up and the man disappears.",
      ],
      thanks: [
        '…따라온 거 아니라니까. (그래도 다음 채록 일정을 먼저 묻는다.)\n\n…다음 채록은 언제야. 아니, 그냥 물어본 거야. 날짜만 알려 줘. 나도 적어 두게.',
        "…I didn't come along, I told you. (He asks about the next recording date first, all the same.)\n\n…When's the next session? No, I'm just asking. Just tell me the date. So I can write it down too.",
      ],
    },
  },

  // ── N19-3 「대를 다시 깎는 손」 · 탁만수 ──
  'N19-3': {
    offer: [
      d('beside_first', '첫 번째 옆에 놓고 오겠습니다. 말씀은 안 드리고요.', "I'll set it beside the first one. And say nothing.",
        '…옆이든 어디든. 그 사람이 정하겠지. (받침을 천에 싸서 건넨다. 매듭이 지난번보다 단단하다.)\n\n반찬통은 비워서 보냈다. 그거면 됐지. 맛있었다는 말은… 하지 마라. 그것도 내가 한 말이 되니까.',
        "…Beside it or wherever. She'll decide. (He wraps the rest in cloth and hands it over. The knot is tighter than last time.)\n\nI sent the container back empty. That's enough. Don't tell her it tasted good… that'd be me saying it too.",
        { affinity: 0.05 }),
      d('how_many', '두 번째라고 하셨는데, 몇 개까지 깎으실 생각이십니까?', 'You said the second. How many are you planning to carve?',
        '…모른다. 하나 놓이면 또 하나. 대는 깎다 보면 다음 마디가 보여. (받침 모서리를 손톱으로 고른다.)\n\n세는 건 그만두는 사람이나 하는 거다. 나는 아직 손이 논다. 손이 놀면 깎는 거고.',
        "…I don't know. One gets set down, then another. Carve bamboo long enough and you start to see the next node. (He evens out the edge of the rest with his thumbnail.)\n\nCounting is for people who are stopping. My hands still go idle. When they do, they carve.",
        { affinity: 0.04, flag: 'choice.n19_3_asked_count' }),
      d('ask_diff', '이번 건 첫 번째보다 마디가 촘촘합니다. 일부러 그러셨습니까.', "This one's nodes are closer than the first. Was that on purpose?",
        '봤구나. 이번 건 마디 간격을 좁혔다. 물은 빨리 빼고 얼음은 오래 붙든다. (받침을 손바닥에 올려 무게를 가늠해 보인다.)\n\n첫 번째를 써 본 사람은 알 거다. 어디가 모자랐는지. 모자란 데를 고치는 게 두 번째다.',
        "You noticed. I narrowed the spacing this time. It drains faster and holds the ice longer. (He weighs the rest on his palm.)\n\nWhoever's used the first one will know where it fell short. Fixing what fell short is what a second one is for.",
        { affinity: 0.06, flag: 'choice.n19_3_saw_nodes' }),
      d('on_purpose', '지나는 길이 아닌데요. 일부러 들르라는 말씀이시죠?', "It's not on my way. You mean go out of my way, don't you?",
        '…일부러라고 하면 안 간다는 거냐. (한참 있다가 칼을 내려놓는다.) 그래, 일부러다.\n\n지나는 길인 척만 해 다오. 그 사람 앞에서는 지나는 길이어야 한다. 그게 어려우면 얼음 나르는 김에라도.',
        "…If I say out of your way, you won't go? (After a long pause he sets the knife down.) Fine. Out of your way.\n\nJust act like you were passing. In front of her, it has to be on your way. If that's hard, then while you're carrying ice.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('owe_one', '값은 됐습니다. 다음 받침 깎으실 때 불러만 주십시오.', 'No need to pay. Just call me when you carve the next one.',
        '…부르긴. 공방 문은 늘 열려 있다. (대패를 내려놓고 나를 한 번 본다.)\n\n오면 마디 고르는 거나 거들어라. 공짜로 심부름 시키는 노인 소리는 듣기 싫으니까.',
        "…Call you? The workshop door's always open. (He puts down the plane and looks at me once.)\n\nWhen you come, help me pick the nodes. I don't want to be the old man who sends people on errands for nothing.",
        { affinity: 0.07, harborRep: 1 }),
    ],
    completeReply: {
      relay: [
        '…나란히. (한참 뒤에 세 번째를 깎기 시작한다.)\n\n나란히 놨으면 둘 다 쓴다는 거다. 하나는 버리고 하나만 쓰는 사람도 있는데. …그 사람은 안 버렸구나.',
        "…Beside it. (A long while later he starts cutting a third.)\n\nIf she set them side by side, she's using both. Some people throw one out and use the other. …She didn't throw it out.",
      ],
      lesson: [
        '깎아 봐. 삐뚤어도 좋다. (내가 깎은 것은 공방 구석에 남았다.)\n\n칼은 마디를 넘을 때만 힘을 줘. 나머지는 대가 알아서 갈라진다. 삐뚠 건 버리지 말고 둬라. 삐뚠 첫 번째가 두 번째를 가르친다.',
        "Cut one. Crooked is fine. (Mine stayed in the corner of the workshop.)\n\nOnly put force into the knife when you cross a node. The rest of the cane splits on its own. Don't throw out the crooked one, keep it. A crooked first one teaches the second.",
      ],
      pay: [
        '…그러지. 노인 심부름값. (돈을 준다. 손이 조금 느리다.)\n\n받는 건 잘하는 거다. 공짜로 부리면 나도 오래 못 시킨다. 다음에도 받아.',
        "…Right. An old man's errand money. (He hands it over. His hands are a little slow.)\n\nTaking it is right. If I worked you for free, I couldn't keep asking. Take it next time too.",
      ],
    },
  },

  // ── N18-4 「같은 배를 보는 눈」 · 도현수 ──
  'N18-4': {
    offer: [
      d('split_work', '좋아. 바닥은 내가 볼게. 값은 너한테 맡긴다.', "Fine. I'll check the bottom. The price is yours.",
        '맡긴다는 말 쉽게 하네. (견적서 사본을 반으로 접어 주머니에 넣는다.)\n\n나는 숫자 볼 테니까 너는 배 밑으로 들어가. 둘이 같은 데를 보면 둘 다 같은 걸 놓쳐. 다른 데를 봐야 돼.',
        "You hand that over easily. (He folds a copy of the estimate in half and pockets it.)\n\nI'll take the numbers, you get under the boat. If we both look at the same place, we both miss the same thing. We have to look at different places.",
        { affinity: 0.04 }),
      d('ask_price', '중고 배 값을 네가 어떻게 알아? 경매장이랑은 다르잖아.', "How would you know a used boat's price? It's not the auction hall.",
        '다르긴. 사람이 값을 부르는 건 똑같아. (손가락으로 허공에 줄을 긋는다.)\n\n수리 견적은 줄마다 누가 얼마 받는지가 붙어 있어. 거기서 부풀린 데가 보여. 부산에서 반은 네가 맞혔지. 이번엔 숫자는 내 쪽이야.',
        "Different how? People name the price either way. (He draws lines in the air with a finger.)\n\nA repair estimate has who gets paid what on every line. That's where you see the padding. In Busan you called half. This time the numbers are my side.",
        { affinity: 0.03, flag: 'choice.n18_4_asked_price' }),
      d('ask_bottom', '바닥은 어떻게 보는 건데? 그냥 들여다보면 돼?', 'How do you check the bottom? Just look at it?',
        '올려 둔 배면 밑으로 들어가서 보고, 물에 떠 있으면 배 안 바닥부터 봐. 물 고인 자국, 칠을 새로 바른 자리. (손바닥으로 배 바닥을 쓸어내리는 시늉을 한다.)\n\n새로 칠한 데가 제일 수상해. 감출 게 있으니까 칠하는 거거든.',
        "If it's up on blocks, get underneath. If it's in the water, start with the bilge inside. Watermarks, places with fresh paint. (He mimes running his palm down a hull.)\n\nFresh paint is the most suspicious. People paint because there's something to hide.",
        { affinity: 0.04, flag: 'choice.n18_4_asked_hull' }),
      d('haggle_mine', '따라오는 건 좋은데, 마지막 흥정은 내가 한다.', 'Come along, fine. But the final haggling is mine.',
        '…좋아. 마지막 흥정은 네가 해. 배는 네 배니까. (피식 웃는다.)\n\n대신 내가 그만하라고 하면 그만해. 깎을 데 다 깎고 나서도 더 깎으면 수리를 대충 해 줘. 그건 숫자에 안 나와.',
        "…Fine. You do the final haggling. It's your boat. (He snorts a laugh.)\n\nBut when I say stop, you stop. Squeeze them after everything's been cut and they'll skimp on the repairs. That doesn't show in the numbers.",
        { affinity: 0.02, flag: 'choice.n18_4_haggle' }),
    ],
    completeAdd: [
      d('half_saved', '네가 찾은 견적 줄 덕에 아낀 돈, 반은 네 몫이다.', 'Half of what your estimate lines saved me is yours.',
        '됐어. 그 돈으로 균열이나 메워. (손을 내젓는다.)\n\n배 값 아낀 건 네 배가 가져가는 거야. 대신 네가 바닥 본 거, 할아버지한테 말해 둘게. 계원 중에 바닥 보는 눈 있는 사람 드물어.',
        "Forget it. Use it to fix the crack. (He waves a hand.)\n\nWhat you saved on the boat belongs to the boat. But I'll tell my grandfather how you checked the hull. Not many members have an eye for a hull.",
        { affinity: 0.07, harborRep: 1 }),
    ],
    completeReply: {
      team: [
        '…그래. (다음 배 볼 때도 먼저 연락하겠다고 한다.)\n\n혼자 보면 반은 놓치고, 둘이 보면 덜 놓쳐. 그게 다야. 그 이상 말 시키지 마.',
        "…Right. (He says he'll call me first the next time he looks at a boat too.)\n\nOne alone misses half; two miss less. That's all. Don't make me say more.",
      ],
      lesson: [
        '…한 번만. 인건비 항목부터 봐. (선박 견적 읽는 눈이 생긴다.)\n\n부품값은 어디나 비슷해. 부풀리는 건 사람 손 값이야. 하루 걸릴 일을 사흘로 적으면 그게 다 남는 돈이지.',
        "…Once only. Start with the labour line. (I get an eye for reading boat estimates.)\n\nParts cost about the same anywhere. The padding goes into the labour. Write a one-day job up as three days and that's all profit.",
      ],
      compete: [
        '해 봐. 바닥이나 잘 보고. (웃는다.)\n\n값 보는 눈은 하루에 안 생겨. 나도 부산 뒷줄에 한참 서 있었어. 그래도 한다면… 해 봐. 틀리면 내가 고쳐 줄게.',
        "Try it. Check the hull properly first. (He laughs.)\n\nAn eye for prices doesn't grow in a day. I stood in that Busan back row a long while too. But if you're set on it… go on. If you get it wrong, I'll put you right.",
      ],
    },
  },

  // ── N19-4 「같이 늙는 일」 · 정옥선 (입원 · 오십 년은 아직 — 뒤 편 일) ──
  'N19-4': {
    offer: [
      d('two_chairs', '좌판 앞에 의자 두 개 놓겠습니다. 두 분 다 앉으시게요.', "I'll put two chairs out front. One for each of you.",
        '…의자는 있어. 앉을 사람이 없지. (좌판 밑에서 접이 의자를 꺼냈다가 도로 넣는다.)\n\n네가 얼음 나를 때 불러. 나 혼자 부르면 안 와. 너도 같이 있으면… 올지도 모르지.',
        "…There are chairs. It's the sitting that's missing. (She pulls a folding chair from under the stall, then puts it back.)\n\nCall him while you're carrying ice. If I call him alone he won't come. If you're there too… he might.",
        { affinity: 0.05 }),
      d('ask_when', '매일 지나가신다고요? 언제쯤 지나가십니까?', 'He passes every day? Around when?',
        '늘 같은 때. 얼음 들어오고 좌판 정리할 무렵. (말해 놓고 얼음 상자만 괜히 툭툭 친다.)\n\n…내가 그걸 어떻게 아냐고는 묻지 마라. 좌판에 앉아 있으면 다 보인다. 보이는 걸 어떡해.',
        "Always the same time. When the ice comes in and I'm tidying the stall. (Having said it, she taps the ice box for no reason.)\n\n…Don't ask how I know. Sit at a stall and you see everything. What can I do if I see it.",
        { affinity: 0.04, flag: 'choice.n19_4_asked_when' }),
      d('you_ask', '할머니가 먼저 앉으시라고 하시면 되지 않습니까?', "Couldn't you just ask him to sit, yourself?",
        '그게 되면 너한테 말하겠냐. (얼음 상자 모서리를 손바닥으로 문지른다.)\n\n…못 하니까 그렇지. 말이 목에서 안 나와. 그러니 네가 좀 해. 아니다. 네가 좀 해.',
        "If I could, would I be telling you? (She rubs the corner of the ice box with her palm.)\n\n…I can't, that's why. The words won't come out of my throat. So you do it. No, never mind. You do it.",
        { affinity: -0.01, flag: 'choice.n19_4_pushed' }),
      d('ask_past', '두 분, 예전에 무슨 일이 있으셨습니까?', 'Did something happen between you two, once?',
        '…그건 묻지 마라. (한참 말이 없다가 얼음 한 덩이를 집어 상자에 넣는다.)\n\n지난 얘기는 꺼내면 덧난다. 너는 의자나 놓아. 앉혀만 주면 그다음은 우리가 어떻게든 한다.',
        "…Don't ask that. (She's quiet a long while, then picks up a lump of ice and drops it in the box.)\n\nOld wounds go bad when you pick at them. You just put the chairs out. Get us sitting and we'll manage the rest somehow.",
        { affinity: 0, flag: 'choice.n19_4_asked_past' }),
    ],
    completeAdd: [
      d('ice_stack', '얼음 오래 가게 쌓는 법, 이번엔 제대로 배우고 싶습니다.', "This time I'd like to learn properly how to stack ice so it lasts.",
        '큰 덩이는 밑에, 부순 얼음은 위에. 생선은 그 사이에 눕혀. 받침이 있으니 물은 알아서 빠진다. (얼음 상자를 열고 손으로 칸을 나눠 보인다.)\n\n뚜껑은 자주 열지 마. 열 때마다 찬 기운이 빠진다. 이건 내가 가르친 거 맞다.',
        "Big blocks at the bottom, crushed ice on top. Lay the fish in between. With the rests underneath, the water drains on its own. (She opens the ice box and divides it into sections with her hand.)\n\nDon't open the lid too often. Every time you do, the cold gets out. This one I did teach you.",
        { proficiency: { category: 'economy', xp: 24 }, affinity: 0.05 }),
    ],
    completeReply: {
      quiet: [
        '…너는 눈치가 너무 좋아. (그날 저녁 좌판에 얼음 상자가 하나 더 놓였다. 탁 노인 몫이다.)\n\n말 안 하는 십 분이 말하는 한 시간보다 낫더라. 나도 오늘 처음 알았다. …내일도 의자는 그대로 둬.',
        "…You notice far too much. (That evening there was one more ice crate on the stall. Old Tak's.)\n\nTen minutes of not talking beat an hour of talking. I only found that out today myself. …Leave the chairs where they are tomorrow too.",
      ],
      lesson: [
        '나한테? 나는 그런 거 안 가르쳤다. (웃는다. 품삯 봉투가 조금 두껍다.)\n\n눈으로 배운 건 가르친 게 아니야, 훔친 거지. 훔친 거면 잘 써먹어라. 그것도 장사 밑천이다.',
        "From me? I never taught you that. (She laughs. The wage envelope is a little thicker.)\n\nWhat you learn by watching isn't taught, it's stolen. If you stole it, put it to good use. That's working capital too.",
      ],
      pay: [
        '중매라니. …받아. (돈을 주면서 노려본다. 그래도 준다.)\n\n그 말 한 번만 더 하면 다음 얼음은 네가 다 날라. 중매는 무슨. 의자 두 개 놓은 거다.',
        "Matchmaker, indeed. …Take it. (She glares while handing it over. She hands it over.)\n\nSay that once more and you're carrying all the ice next time. Matchmaker, my foot. You put out two chairs.",
      ],
    },
  },

  // ── N18-5 「표결 전야」 · 도현수 (찬성 = 일자리 · 반대 = 바다 — 5장 설명회) ──
  'N18-5': {
    offer: [
      d('sort_both', '좋아. 찬성은 내가, 반대는 네가. 밤새 해 보자.', "Fine. I take the case for, you take against. Let's go all night.",
        '…그래. 반대쪽 말은 내가 써. 바다 얘기는 채록하면서 노인들한테 많이 들었어. (자료 뭉치를 반으로 가른다.)\n\n밤새 걸려. 커피는 네가 타. 나는 졸면 반대 논리가 물러지거든.',
        "…Fine. I'll write the case against. I heard plenty about the sea from the old folks during the interviews. (He splits the pile of papers in two.)\n\nIt'll take all night. You make the coffee. If I doze off, the case against goes soft.",
        { affinity: 0.04 }),
      d('ask_side', '네 말이 맞으면 내가 진 거라니. 너는 어느 쪽인데?', "If I'm right you've lost? So which side are you on?",
        '…말 안 해. 표결에서 봐. (자료 뭉치를 책상에 내려놓는다.)\n\n어느 쪽이든 상대 말을 모르고 손 드는 건 반칙이야. 그래서 들고 온 거고. 너도 내 쪽 걸 읽어. 끝까지.',
        "…Not telling. See you at the vote. (He sets the pile down on the desk.)\n\nWhichever side, raising your hand without knowing the other side's case is cheating. That's why I brought it. You read mine too. To the end.",
        { affinity: 0.03, flag: 'choice.n18_5_asked_side' }),
      d('ask_samples', '조간대 표본은 왜 붙여? 서류만으로는 안 돼?', "Why attach intertidal samples? Aren't papers enough?",
        '숫자만 보면 다들 졸아. 갯바위에 뭐가 사는지 손에 쥐여 줘야 고개를 들어. (빈 표본 봉투를 내민다.)\n\n찬성은 일자리 얘기고 반대는 바다 얘기야. 바다 얘기를 하려면 바다를 보여 줘야지. 세 점. 물 빠질 때.',
        "Show them just numbers and everyone dozes. Put what lives on the rocks in their hands and they look up. (He holds out an empty sample bag.)\n\nThe case for is about jobs, the case against is about the sea. If you're talking about the sea, you have to show it. Three samples. When the tide's out.",
        { affinity: 0.04, flag: 'choice.n18_5_asked_samples' }),
      d('like_this', '밤새 같이 하자고? 너 이런 거 좋아하는구나.', 'All night together? You actually like this sort of thing.',
        '좋아하긴. (자료를 손등으로 탁 친다.) …틀린 걸로 지는 게 싫은 거야.\n\n네가 이기든 내가 이기든 맞는 걸로 이기자. 그러니까 앉아. 반대 논리부터 읽어 줄게.',
        "Like it? (He slaps the papers with the back of his hand.) …I hate losing over something wrong.\n\nWhether you win or I do, let's win with what's right. So sit. I'll read you the case against first.",
        { affinity: 0.02, flag: 'choice.n18_5_teased' }),
    ],
    completeAdd: [
      d('keep_copy', '정리한 자료, 계에도 한 부 남기자. 다음 사람을 위해.', "Let's leave a copy with the co-op too. For whoever comes next.",
        '…계에? 표결 끝나면 아무도 안 볼걸. (그래도 복사본 한 부를 따로 챙겨 봉투에 넣는다.)\n\n남겨 두면 다음에 누가 또 밤새는 일은 줄겠지. 이름은 둘 다 적어. 찬성 하나, 반대 하나. 그래야 한쪽 자료라고 안 해.',
        "…To the co-op? Nobody'll read it once the vote's done. (Still, he sets aside a copy and slips it into an envelope.)\n\nIf we leave it, someone else won't have to stay up all night next time. Put both names on it. One for, one against. Then nobody calls it one-sided.",
        { affinity: 0.05, harborRep: 2 }),
    ],
    completeReply: {
      thanks: [
        '…들고 온 거 아니라니까. (그래도 표결에서 같은 쪽에 손을 들었다.)\n\n(표결이 끝나고 복도에서 그가 말했다.) 고맙다는 소리 듣자고 한 거 아니야. 맞는 걸로 이기고 싶었을 뿐이야. 이제 그 얘긴 그만.',
        "…I didn't bring them, I told you. (He raised his hand on the same side in the vote all the same.)\n\n(After the vote, in the corridor, he said:) I didn't do it to hear thanks. I just wanted to win with what was right. Let's drop it now.",
      ],
      lesson: [
        '결론부터 읽어. 근거는 나중에. (자료 읽는 법이 달라진다.)\n\n결론을 먼저 알면 근거가 빈 데가 보여. 처음부터 읽으면 쓴 사람 말에 끌려가. 반대 자료일수록 거꾸로 읽어.',
        "Read the conclusion first. Grounds afterwards. (How I read documents changes.)\n\nKnow the conclusion first and you see where the grounds are thin. Read from the start and the writer drags you along. The more it's against you, the more you read it backwards.",
      ],
      compete: [
        '…해 봐. (표결에서 그가 내 쪽을 봤다. 이긴 건지 진 건지 모르겠다.)\n\n(표결이 끝나고 복도에서 그가 말했다.) 이번엔 이기고 지는 게 아니었어. …그래도 다음엔 내가 이겨.',
        "…Try it. (In the vote he looked my way. I can't tell if I won or lost.)\n\n(After the vote, in the corridor, he said:) This time it wasn't about winning or losing. …I'll still win next time.",
      ],
    },
  },

  // ── N18-6 「원산지 표기」 · 도현수 (미표시 = 과태료 · 거짓 표시 = 형사 처벌) ──
  'N18-6': {
    offer: [
      d('check_together', '좋아, 같이 확인하자. 어디부터 보면 돼?', "All right, let's check it together. Where do I start?",
        '…라벨은 위에서부터 읽지 마. 원산지 칸부터. (라벨 귀퉁이를 손톱으로 짚는다.)\n\n여기 봐. 이 칸만 종이 결이 달라. 덧붙인 거야. 이거 확인하고, 네 물건은 네가 원산지 적어서 올려. 세 건.',
        "…Don't read a label from the top. Origin box first. (He points at a corner of the label with his fingernail.)\n\nLook here. Just this box has a different paper grain. It's been stuck over. We verify this one, then you put up your own lots with the origin written on. Three of them.",
        { affinity: 0.04 }),
      d('ask_exam', '검사원 시험? 부산 중개 일은 어쩌고.', 'The inspector exam? What about the broker work in Busan?',
        '중개는 접었어. 이유는… 붙으면 말할게. (라벨 쪽으로 눈을 돌린다.)\n\n아직 붙은 거 아니니까 떠들지 마. 붙기 전에 소문나면 떨어졌을 때 두 번 떨어지는 거야.',
        "I've packed in the brokering. Why… I'll tell you if I pass. (He turns his eyes back to the label.)\n\nI haven't passed yet, so don't go blabbing. If word gets out before I pass, failing means failing twice.",
        { affinity: 0.04, flag: 'choice.n18_6_asked_exam' }),
      d('ask_penalty', '원산지 위반이면 어떻게 되는데? 라벨만 고치면 끝이야?', "What happens with an origin violation? Just fix the label and that's it?",
        '아니. 안 적은 건 과태료지만, 거짓으로 적은 건 형사 처벌까지 가. 수입산을 국산으로 붙이면 값이 확 뛰거든. (라벨을 사진으로 찍어 둔다.)\n\n그래서 우리가 위판할 때 원산지를 제대로 적어야 해. 남을 잡으려면 내 것부터 깨끗해야지.',
        "No. Leaving it off gets you a fine, but writing it false can go as far as criminal charges. Put a domestic label on imports and the price jumps. (He takes a photo of the label.)\n\nThat's why we have to write the origin properly when we sell at auction. If you're going to catch others, your own has to be clean first.",
        { affinity: 0.04, flag: 'choice.n18_6_asked_law' }),
      d('chief_grandson', '계장 손자가 검사원 되면 계원들이 다 떨겠다.', "If the chief's grandson becomes an inspector, every member will shake.",
        '…그 소리 들을 줄 알았어. (얼굴이 굳었다가 천천히 풀린다.)\n\n계원 물건이라고 봐주면 검사원이 아니지. 떨 사람은 떨어야 하고. 너는 안 떨어도 돼. 적을 거 제대로 적으면.',
        "…Knew I'd hear that. (His face goes stiff, then slowly eases.)\n\nGo easy on a member's goods and you're not an inspector. Those who should shake, should. You don't have to. As long as you write down what you should.",
        { affinity: -0.01, flag: 'choice.n18_6_teased' }),
    ],
    completeAdd: [
      d('your_report', '오늘 잡은 건 네 이름으로 신고해. 네 눈이 잡은 거니까.', "Report today's case under your name. Your eyes caught it.",
        '…내 이름? 아직 검사원 아니야. 신고는 누구나 하는 거고. (그래도 신고서 맨 위 칸에 둘 이름을 나란히 적는다.)\n\n붙으면 이 건이 첫 줄이야. 네가 같이 봤다고 적을게. 그건 빼면 거짓말이니까.',
        "…My name? I'm not an inspector yet. Anyone can file a report. (Still, he writes both our names side by side in the top box of the form.)\n\nIf I pass, this case is my first line. I'll write that you checked it with me. Leaving that out would be a lie.",
        { affinity: 0.07, harborRep: 2 }),
    ],
    completeReply: {
      lesson: [
        '…네가 시험 보게? 아니지. 그래도 가르쳐 줄게. (유통 눈이 생긴다.)\n\n원산지, 품명, 날짜, 그다음이 값. 값부터 보면 싼 맛에 다른 게 안 보여. 이 순서만 지켜도 반은 걸러.',
        "…You're sitting it? No you're not. I'll teach you anyway. (I get an eye for distribution.)\n\nOrigin, name, date, then price. Look at the price first and the bargain blinds you to the rest. Stick to that order and you'll catch half of them.",
      ],
      proud: [
        '…그 말 처음 들어. 할아버지한테도. (그가 시험 원서를 보여 준다.)\n\n(원서 사진 칸 속 얼굴이 조금 굳어 있다.) 붙으면 제일 먼저 너한테 말할게. 떨어지면… 그때도 너한테 말할게.',
        "…First time anyone's said that. Even grandfather. (He shows me the application form.)\n\n(The face in the photo box on the form looks a little stiff.) If I pass, you're the first I'll tell. If I fail… I'll tell you then too.",
      ],
      compete: [
        '…생각해 볼게. 있을 거야. (웃는다. 라이벌이 오래 간다.)\n\n누가 더 깨끗한 물건을 올리나, 그거면 되겠네. 선장은 잡은 걸로, 검사원은 잡아낸 걸로. 지면 커피.',
        "…I'll think about it. There'll be something. (He laughs. A rivalry that lasts.)\n\nWho puts up the cleaner catch, that'd do. The skipper goes by what's caught, the inspector by what's caught out. Loser buys coffee.",
      ],
    },
  },

  // ── N19-5 「병실 앞 복도」 · 탁만수 (오십 년은 이 편 나레이션에서 처음 나온다) ──
  'N19-5': {
    offer: [
      d('open_for_you', '문은 제가 열겠습니다. 들어가시기만 하십시오.', "I'll open the door. You just walk in.",
        '…문이 무거운 게 아니다. (받침을 쥔 손등에 힘줄이 선다.)\n\n그래. 열어 다오. 내가 들어가는지 안 들어가는지는 그때 보자. 못 들어가도 자네 탓은 아니다.',
        "…It's not the door that's heavy. (The tendons stand out on the back of the hand gripping the rest.)\n\nAll right. Open it for me. Whether I go in or not, we'll see then. If I can't, it won't be your fault.",
        { affinity: 0.06 }),
      d('ask_third', '세 번째 받침이요? 병실에도 얼음 상자가 있습니까?', 'The third rest? Is there an ice box in a hospital room?',
        '병실에 얼음이 어디 있냐. 그냥 깎았다. 손이 할 줄 아는 게 이것뿐이라. (받침을 뒤집어 마디를 쓸어 본다.)\n\n빈손으로 들어가는 건 더 못 하겠더라. 뭐라도 들고 있어야 손이 덜 떨려.',
        "Where would there be ice in a hospital room? I just carved it. It's the only thing these hands know how to do. (He turns the rest over and runs a thumb along the nodes.)\n\nGoing in empty-handed is even harder. Holding something keeps the hands from shaking.",
        { affinity: 0.05, flag: 'choice.n19_5_asked_third' }),
      d('deliver_for_you', '들어가시기 어려우시면, 제가 대신 전해 드릴까요?', "If it's hard to go in, shall I take it to her for you?",
        '…그럼 또 심부름이지. 이번엔 안 된다. (고개를 천천히 젓는다.)\n\n두 번은 자네 손으로 보냈다. 세 번째까지 남의 손으로 보내면 나는 영영 이 복도에 서 있을 거다. 문만 열어 다오.',
        "…Then it's another errand. Not this time. (He slowly shakes his head.)\n\nTwice I sent it with your hands. If the third goes by someone else's hands too, I'll be standing in this corridor forever. Just open the door.",
        { affinity: 0.07, flag: 'choice.n19_5_offered_carry' }),
      d('does_she_know', '할머니는 노인장이 오신 걸 아십니까?', "Does she know you're here?",
        '모른다. 알면… 모르겠다. 들어오라고 할지 나가라고 할지. (복도 끝 창 쪽을 본다.)\n\n그래서 여태 서 있는 거다. 모르는 채로 서 있는 게 들어가서 아는 것보다 쉬우니까. …쉬운 쪽만 골랐지, 늘.',
        "She doesn't. If she did… I don't know. Whether she'd say come in or get out. (He looks towards the window at the end of the corridor.)\n\nThat's why I'm still standing here. Standing here not knowing is easier than going in and finding out. …I always picked the easy way.",
        { affinity: 0.03, flag: 'choice.n19_5_asked_know' }),
    ],
    completeAdd: [
      d('help_carve', '다음 받침 깎으실 때, 이번엔 옆에서 거들겠습니다.', "When you carve the next rest, I'll lend a hand this time.",
        '거들어라. 병실에 둘 건 작게 깎는다. 머리맡에 놓을 거니까. (대나무를 결 따라 가르는 법을 손으로 천천히 보여 준다.)\n\n크게 깎는 건 힘으로 하고 작게 깎는 건 숨으로 한다. 숨 참고 해 봐.',
        "Lend a hand, then. One for a hospital room is carved small. It goes by the pillow. (He slowly shows me with his hands how to split bamboo along the grain.)\n\nCarving big takes strength; carving small takes breath. Hold your breath and try.",
        { proficiency: { category: 'crafting', xp: 28 }, affinity: 0.06 }),
    ],
    completeReply: {
      open_door: [
        '…그래도 문은 자네가 열었어. (받침 넷째를 깎기 시작한다. 이번엔 병실용이라고.)\n\n열린 문으로 들어가는 건 쉽더라. 그걸 오십 년 몰랐다. 자네는 젊을 때 알았으니 다행이다.',
        "…You still opened it. (He starts on a fourth rest. For the hospital room, he says.)\n\nWalking through an open door turned out to be easy. It took me fifty years to learn that. Lucky you learned it young.",
      ],
      wait: [
        '오십 년보다 길었을 거야. (품삯 대신 대나무 한 마디를 준다. 첫 받침 남은 것이라고.)\n\n그 마디는 버리지 말고 둬라. 첫 번째를 깎고 남은 거다. 처음이 남아 있어야 끝을 안다.',
        "Longer than fifty years, I'd think. (Instead of a wage he gives me a length of bamboo. Left over from the first rest.)\n\nDon't throw that piece away. It's what was left after cutting the first. You need what's left of the beginning to know the end.",
      ],
      pay: [
        '…그러지. (돈을 주는 손이 떨린다. 안도다.)\n\n여비는 줘야지. 여기까지 끌고 온 건 나니까. 자네 아니었으면 나는 아직 복도 벽에 붙어 있었을 거다.',
        "…I will. (His hand shakes handing it over. Relief.)\n\nYour fare's owed. I'm the one who dragged you here. If not for you, I'd still be stuck to that corridor wall.",
      ],
    },
  },

  // ── N18-7 「나란히 서서」 · 도현수 (공동작업장 복구 — 다들 조금씩 냈다) ──
  'N18-7': {
    offer: [
      d('half_each', '백 개. 반씩 나르자. 우리 이름이니까.', "A hundred. Half each. It's our name, after all.",
        '…반씩. 그래. (의자 두 개를 한 번에 들어 올린다.)\n\n세지 마. 세면 더 무거워. 마지막 의자 놓을 때 그때 세. 그 전엔 그냥 날라.',
        "…Half each. Right. (He lifts two chairs at once.)\n\nDon't count. Counting makes them heavier. Count when you set down the last one. Until then just carry.",
        { affinity: 0.05 }),
      d('whose_name', '우리 이름? 무슨 이름으로 여는 건데.', 'Our name? What name is it opening under?',
        '…계 이름이지. 공동작업장이잖아. 다들 조금씩 냈어. (팔짱을 낀다.)\n\n네 이름만 걸리면 다들 구경꾼 돼. 같이 낸 사람이 같이 여는 거야. 그게 우리야. …다른 뜻 없어.',
        "…The co-op's name. It's the communal workshop. Everyone chipped in a bit. (He folds his arms.)\n\nHang only your name on it and everyone else becomes a spectator. The ones who chipped in open it together. That's what 'we' means. …Nothing else.",
        { affinity: 0.05, flag: 'choice.n18_7_asked_name' }),
      d('said_we', '네 입에서 우리라는 말이 다 나오네.', "Never thought I'd hear 'we' from you.",
        '…말꼬리 잡지 마. (의자 하나를 내 쪽으로 떠민다. 귀가 빨갛다.)\n\n백 개야. 그 말 할 힘 있으면 하나 더 들어. 재개관식 전에 다 놔야 해.',
        "…Don't twist my words. (He shoves a chair at me. His ears are red.)\n\nIt's a hundred. If you've got the breath for that, carry one more. They all have to be out before the reopening.",
        { affinity: 0.02, flag: 'choice.n18_7_teased' }),
      d('enough_time', '비품도 만들어야 하는데, 의자까지 오늘 다 될까?', "We've still got fittings to make. Can we do the chairs too today?",
        '되게 해야지. 비품은 네가 만들고 의자는 같이. (목록을 내민다. 세 줄이 적혀 있다.)\n\n손 빠른 사람이 둘이면 돼. 할 수 있는 만큼 하고, 모자라면 내가 남아. 문 여는 날 빈 의자는 있어도 모자란 의자는 없어야 해.',
        "We'll make it happen. You make the fittings, the chairs we do together. (He holds out a list. Three lines are written on it.)\n\nTwo quick pairs of hands is enough. Do what you can, and if it's short I'll stay behind. On opening day there can be empty chairs, but never too few.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('daily_wage', '의자 나른 품삯은 계에서 나오는 거지?', "The co-op's paying for the chair carrying, right?",
        '…이 와중에 품삯? (어이없다는 듯 웃는다.) 나와. 계에서. 일당 기준으로.\n\n받아. 받을 건 받아야 다음에도 사람이 모여. 공짜로 모인 사람은 한 번 오고 말아.',
        "…Wages, now of all times? (He laughs in disbelief.) It's paid. By the co-op. Day rate.\n\nTake it. Pay what's owed and people come again next time. People who turn up for free come once and that's it.",
        { payMult: 1, affinity: -0.02 }),
    ],
    completeReply: {
      we: [
        '…시끄러워. (앉는다. 둘이 나란히. 라이벌이라는 말은 이제 안 쓴다.)\n\n(한참 앉아 있다가 그가 말했다.) 방파제에서 혀 찼던 거, 사과는 안 해. 그땐 그게 맞았어. 지금은 아니지만.',
        "…Shut up. (He sits. The two of us side by side. Neither of us says 'rival' any more.)\n\n(After sitting a long while, he said:) Clicking my tongue at you on the breakwater — I'm not apologising. It was right back then. Not now, though.",
      ],
      lesson: [
        '두 개씩. 허리 말고 다리. 할머니가 가르쳐 준 거야. (짐 나르는 요령이 몸에 붙는다.)\n\n무거운 건 몸에 붙여서 들어. 팔 뻗고 들면 반도 못 가. 짐은 드는 게 아니라 껴안는 거야.',
        "Two at a time. Legs, not back. My grandmother taught me. (Carrying loads settles into my body.)\n\nHold heavy things close to your body. Arms out, you won't get halfway. You don't lift a load, you hug it.",
      ],
      compete: [
        '…좋아. 마지막 대결. (웃는다. 처음 만난 날처럼. 그러나 다르게.)\n\n심판이 누구든 상관없어. 이번엔 핑계 없이 하자. 지면 깨끗하게 지고.',
        "…Good. The last one. (He laughs. Like the day we met. But differently.)\n\nDoesn't matter who judges. No excuses this time. If we lose, we lose clean.",
      ],
    },
  },

  // ── N19-6 「손을 잡는 데 오십 년」 · 정옥선 (요양 뒤 휠체어 — 사진 속 천막 이야기는 꺼내지 않는다) ──
  'N19-6': {
    offer: [
      d('make_seats', '의자 둘, 얼음 상자 사이에 놓겠습니다.', "Two chairs, between the ice boxes. I'll set them out.",
        '…그래, 거기. 바람이 덜 드는 데다. (휠체어 바퀴를 손으로 밀어 자리를 가늠한다.)\n\n받침 셋도 보이게 해 둬. 그 사람이 앉아서 그걸 봐야지. 자기가 깎은 건 자기가 봐야 해.',
        "…Yes, there. It's out of the wind. (She pushes the wheelchair's wheel with her hand, judging the spot.)\n\nAnd put the three rests where they can be seen. He should sit and look at them. A man ought to see what he carved.",
        { affinity: 0.05 }),
      d('ask_health', '휠체어로 좌판까지 나오셔도 괜찮으십니까?', 'Is it all right for you to come out to the stall in a wheelchair?',
        '요양 끝났다. 앉아 있는 건 된다더라. 병실에 앉으나 좌판에 앉으나 앉는 건 같아. (좌판 냄새를 깊이 들이마신다.)\n\n그런데 냄새가 다르다. 여기가 낫지. 얼음 냄새, 바다 냄새. 사람은 냄새 나는 데서 살아야 한다.',
        "My recovery's done. They say sitting is fine. Sitting in a ward or at the stall, it's still sitting. (She breathes in the smell of the stall deeply.)\n\nBut the smell's different. Here's better. Ice, the sea. People ought to live where things smell of something.",
        { affinity: 0.04, flag: 'choice.n19_6_asked_health' }),
      d('who_said', '탁 노인께서 오신다고 하셨습니까? 직접요?', "Old Tak said he's coming? Himself?",
        '…온다더라. 누가 전했는지는 묻지 마라. 이 좌판엔 말이 바람보다 빨리 돈다. (팔걸이를 손끝으로 두드린다.)\n\n온다고 했으면 오는 사람이다. 오십 년을 안 오다가도 온다고 하면 와. 그러니 자리부터 만들어.',
        "…He's coming, they say. Don't ask who passed it on. Word goes round this stall faster than the wind. (She drums her fingertips on the armrest.)\n\nIf he says he'll come, he comes. Even after fifty years of not coming, once he says it, he comes. So make the place first.",
        { affinity: 0.03, flag: 'choice.n19_6_asked_who' }),
      d('chair_job', '의자 놓는 것도 이제 제 일이 다 됐습니다.', 'Setting out chairs has become my job by now.',
        '…일이라니. 늙은이 둘 의자 놓는 게 무슨 일이냐. (노려보다가 만다.)\n\n그래도 네가 놓아라. 내가 놓으면 티 난다. 네가 놓으면 그냥 좌판 정리한 거지.',
        "…Job, is it? What job is putting out chairs for two old people? (She glares, then gives up.)\n\nStill, you put them out. If I do it, it shows. If you do it, it's just tidying the stall.",
        { affinity: 0.02, flag: 'choice.n19_6_joked' }),
    ],
    completeAdd: [
      d('stall_words', '좌판 일, 할머니 말로 한 번 더 배우고 싶습니다.', "I'd like to learn the stall work from you once more, in your words.",
        '말로? 그래, 손은 이제 네 거니까. (휠체어 등받이에 기댄다.)\n\n얼음 먼저, 그다음 진열, 값은 마지막. 처음에 가르친 그대로다. 그 순서만 안 잊으면 이 좌판은 안 망해. (손가락을 하나씩 접으며 다시 일러 준다.)',
        "In words? All right, the hands are yours now. (She leans back in the wheelchair.)\n\nIce first, then the display, price last. Exactly what I taught you at the start. Don't forget that order and this stall won't go under. (She counts each one off on her fingers again.)",
        { proficiency: { category: 'economy', xp: 30 }, affinity: 0.06 }),
    ],
    completeReply: {
      saw: [
        '…봤어? 그래, 봐라. 오십 년이다. (할머니가 웃는다. 노인도.)\n\n숨길 나이도 지났다. 오십 년 숨겼으면 됐지. …그래도 동네방네 떠들지는 마라. 그 사람 얼굴 빨개지는 거 못 본다.',
        "…You saw? Fine, look. It's fifty years. (She laughs. So does he.)\n\nWe're past the age for hiding. Fifty years of hiding is plenty. …Still, don't go telling the whole harbour. I can't bear watching his face go red.",
      ],
      pay: [
        '중매… 그래, 받아. 오십 년 치. (봉투가 아니라 좌판 서랍 열쇠다.)\n\n서랍 열쇠는 아무한테나 안 준다. 돈은 쓰면 없어지지만 서랍은 남아. 오십 년 치 값으로는 그게 맞지.',
        "Matchmaker… all right, take it. Fifty years' worth. (Not an envelope — the key to the stall drawer.)\n\nI don't give the drawer key to just anyone. Money's gone once you spend it, but the drawer stays. For fifty years' worth, that's the right price.",
      ],
    },
  },

  // ── N20-1 「구독자 삼백」 · 유하랑 (once — 나레이션 미루기 답은 그대로 둔다) ──
  'N20-1': {
    offerAdd: [
      d('ask_twelve', '열두 명이 지금 보고 있다고요? 이 화면을요?', 'Twelve people are watching right now? On this screen?',
        '네! 지금요! 여기 숫자 보이죠, 열둘. (화면을 내 쪽으로 돌린다. 댓글 창이 조용하다.)\n\n삼백 명 중에 열두 명이면 나쁜 거 아니에요. …아니, 나쁜 거 맞아요. 그러니까 한 마리만요. 한 마리면 열세 명 될지도 몰라요.',
        "Yes! Right now! See the number here, twelve. (She turns the screen towards me. The comment box is quiet.)\n\nTwelve out of three hundred isn't bad. …No, it is bad. So, just one fish. One fish and it might be thirteen.",
        { affinity: 0.03, flag: 'choice.n20_1_asked_viewers' }),
      d('stiff_hands', '카메라 앞이면 손이 굳을 것 같습니다만.', 'I think my hands would stiffen up in front of a camera.',
        '저도 그래요! 맨날 굳어요. (웃는다.) 그래서 혼자 떠드는 거예요, 안 굳으려고.\n\n얼굴은 안 나오게 할게요. 물고기만 나오면 돼요. 손이 굳어도 물고기는 안 굳으니까요. 한 마리만요, 진짜로.',
        "Me too! They stiffen every time. (She laughs.) That's why I talk to myself, so they won't.\n\nI'll keep your face out of it. Only the fish needs to be in shot. Your hands might stiffen, but the fish won't. Just one, really.",
        { affinity: 0.04, flag: 'choice.n20_1_stiff_hands' }),
    ],
    offerReply: {
      go: [
        '네! 손만! 고마워요!\n\n(삼각대를 낮춰 렌즈를 내 손 쪽으로 돌린다.) 여러분, 지나가던 분이 한 마리 도와주신대요. 얼굴은 비밀이에요! …아직 열두 명 그대로 있어요. 다행이다.',
        "Yes! Hands only! Thank you!\n\n(She lowers the tripod and turns the lens towards my hands.) Everyone, someone passing by is going to help me catch one. The face is a secret! …Still twelve of you. Phew.",
      ],
      // 원래 응답이 이미 다음 날로 건너뛴다 — 덧붙이는 단락은 떠나며 하던 인사를 떠올리는 지문으로 잇는다
      decline: [
        '…아, 네. 죄송해요. (삼각대를 접는다. 그 사람은 다음 날 다른 항구로 갔다.)\n\n(접은 삼각대를 메고 가면서 화면에 대고 하던 인사가 귀에 남았다. 오늘은 그림이 안 나왔네요, 여러분. 다음 항구에서는 꼭 보여 드릴게요.)',
        "…Ah. Right. Sorry. (She folds the tripod. She went to another harbour the next day.)\n\n(What stayed with me was her farewell to the screen as she walked off with the tripod on her shoulder. No shot today, everyone. At the next harbour I'll show you for sure.)",
      ],
    },
    completeAdd: [
      d('subscribe', '구독은 어떻게 합니까? 제가 하나 보태겠습니다.', 'How do I subscribe? Let me add one to your count.',
        '구독이요? (화면을 보다가 소리를 지른다.) 삼백 하나! 방송 끝난 게 아깝다, 이거 찍었어야 했는데!\n\n…버튼은 여기요. 종 모양도 눌러 주시면 알림이 가요. 안 눌러도 돼요! 눌러 주시면 좋고요.',
        "Subscribe? (She looks at the screen and shrieks.) Three hundred and one! Shame the stream's over, I should've filmed this!\n\n…The button's here. Tap the bell too and you'll get notified. You don't have to! But it'd be nice.",
        { affinity: 0.06, flag: 'choice.n20_1_subscribed' }),
    ],
    completeReply: {
      encourage: [
        '…그 말 방송에서 해 주시면 안 돼요? 아니, 됐어요. 제가 기억할게요. (편집본 첫 컷이 내 챔질이다.)\n\n열두 명이면 열두 번 인사할 수 있잖아요. 삼백 명이면 못 해요. …그렇게 생각하니까 좀 낫네요. (삼각대를 다시 편다.)',
        "…Could you say that on the stream? No — never mind. I'll remember it. (The first cut of the edit is my strike.)\n\nWith twelve I can say hello twelve times. With three hundred I couldn't. …Thinking of it that way helps a bit. (She sets the tripod up again.)",
      ],
      pay: [
        '있어요… 광고 수익… 이번 달 사천 원. (진지하게 반을 나눈다.)\n\n다음 달엔 두 배 될 거예요. 아마요. 두 배 되면 또 반 드릴게요. 방금 정한 출연료 계약이에요.',
        "There is… ad revenue… four thousand won this month. (She splits it in half, seriously.)\n\nNext month it'll double. Probably. When it does, you get half again. That's the appearance contract, as of just now.",
      ],
      lesson: [
        '저도 굳어요. 그냥 렌즈를 물고기라고 생각해요. (묘하게 캐스팅이 편해진다.)\n\n물고기는 사람 얼굴 안 보잖아요. 렌즈도 그래요. 그쪽 손만 봐요. 손은 그쪽이 제일 잘 아는 거고요.',
        "Mine freeze too. I just think of the lens as a fish. (Oddly, my casting gets easier.)\n\nFish don't look at people's faces, right? Neither does the lens. It only looks at your hands. And your hands are what you know best.",
      ],
    },
  },

  // ── N20-2 「섬네일 각」 · 유하랑 ──
  'N20-2': {
    offer: [
      d('sit_till_dusk', '앉아 있는 건 자신 있습니다. 해 질 때까지 있겠습니다.', "Sitting still I can do. I'll stay till the sun goes down.",
        '다행이다! 사람들이 앉아 있는 걸 제일 못해요. 다들 뭘 하려고 해서. (삼각대를 내 등 뒤쪽으로 옮긴다.)\n\n얼굴 말고 등이 나와요. 해랑 등. 그거면 돼요. 움직이고 싶으면 바다만 보세요.',
        "Thank goodness! Sitting still is what people are worst at. Everyone tries to do something. (She moves the tripod behind me.)\n\nIt's your back in shot, not your face. The sun and your back. That's all I need. If you feel like moving, just look at the sea.",
        { affinity: 0.05 }),
      d('why_person', '해 떨어지는 그림이면 노을만 찍어도 되지 않습니까?', "If it's a sunset shot, isn't the sunset alone enough?",
        '노을만 찍으면 그냥 노을이에요. 사람이 하나 있어야 이야기가 돼요. (손가락으로 네모를 만들어 그 안에 나를 넣는다.)\n\n바다 보는 사람 하나. 그게 제일 많이 눌려요. 아, 이건 비밀이에요. 영업 비밀.',
        "Shoot just a sunset and it's just a sunset. You need one person in it for there to be a story. (She makes a frame with her fingers and puts me in it.)\n\nOne person looking at the sea. That gets the most clicks. Oh, that's a secret. Trade secret.",
        { affinity: 0.04, flag: 'choice.n20_2_asked_shot' }),
      d('itchy_hands', '낚시를 안 하고 앉아만 있으면 손이 근질거릴 것 같습니다.', 'Sitting there without fishing — my hands will get itchy.',
        '던져도 돼요! 해 질 무렵엔 입질이 온대요. 두 마리면 덤이고요. (엄지를 들어 보인다.)\n\n대신 일어나지만 마요. 일어나면 그림이 바뀌어요. 앉아서 던지는 건 괜찮아요. 그것도 그림이에요.',
        "You can cast! They say the bites come around dusk. Two fish would be a bonus. (She gives me a thumbs-up.)\n\nJust don't stand up. If you stand, the shot changes. Casting sitting down is fine. That's a shot too.",
        { affinity: 0.03, flag: 'choice.n20_2_itchy_hands' }),
      dNo('오늘은 해 질 때까지 있을 수가 없습니다. 다음에 하겠습니다.', "I can't stay until sunset today. Next time.",
        '아… 해는 내일도 떨어지니까요. 괜찮아요! (삼각대 다리를 하나씩 접는다.)\n\n다음에 와 주세요. 노을은 매일 다르대요. 내일 건 오늘보다 나을지도 몰라요.',
        "Ah… the sun goes down tomorrow too. It's fine! (She folds the tripod legs one by one.)\n\nCome next time. They say every sunset's different. Tomorrow's might be better than today's.",
        -0.02),
    ],
    completeAdd: [
      d('small_back', '제 등이 그렇게 작은 줄 몰랐습니다. 좀 서운합니다.', "I didn't know my back looked that small. I'm a little hurt.",
        '작아서 좋은 거예요! 바다가 커 보이잖아요. (화면을 키워서 보여 준다.)\n\n사람이 작게 나와야 바다가 주인공이 돼요. 그쪽 등이 그걸 해 줬어요. 큰 등은 바다를 가려요.',
        "Small is good! It makes the sea look big. (She zooms in on the screen to show me.)\n\nWhen the person's small, the sea becomes the star. Your back did that. A big back hides the sea.",
        { affinity: 0.05, flag: 'choice.n20_2_small_back' }),
    ],
    completeReply: {
      watch: [
        '그렇죠? 저는 그게 좋아서 찍어요. (영상 제목이 낚시가 아니라 사람이 됐다.)\n\n잡는 영상은 많아요. 기다리는 영상은 없어요. 그래서 제 채널이 작은가 봐요. 그래도 저는 이게 좋아요.',
        "Right? That's why I film. (The video's title stops being about fishing and becomes about people.)\n\nThere are lots of catching videos. There are no waiting videos. Maybe that's why my channel is small. I like this, though.",
      ],
      pay: [
        '이번 달 광고 수익… 팔천 원! 두 배 됐어요! (진지하게 반을 준다.)\n\n반은 그쪽 등 값이에요. 섬네일이 등이니까요. 나머지 반은 노을 값이고요. 노을은 돈을 안 받아서 제가 가져요.',
        "This month's ad revenue… eight thousand won! Doubled! (She gives me half, seriously.)\n\nHalf is for your back. The thumbnail is your back, after all. The other half is for the sunset. The sunset doesn't take money, so I keep it.",
      ],
      lesson: [
        '해를 왼쪽에 두고 사람을 오른쪽에. (사람을 보는 눈이 조금 달라진다.)\n\n가운데 두면 그림이 멈춰요. 한쪽으로 비켜 두면 사람이 어딘가로 가는 것 같아요. 그게 이야기예요.',
        "Sun on the left, the person on the right. (How I look at people shifts a little.)\n\nPut them in the middle and the picture stops. Set them off to one side and it feels like they're going somewhere. That's the story.",
      ],
    },
  },

  // ── N20-3 「합방 요청」 · 유하랑 (속초 되돌아오기) ──
  'N20-3': {
    offer: [
      d('guide_sokcho', '속초라면 안내하겠습니다. 만복상회 앞자리가 좋습니다.', "Sokcho, then. I'll show you around. The spot by Manbok Store is good.",
        '만복상회! 이름부터 그림이에요. (수첩에 받아 적는다.)\n\n둘이 나란히 두 마리. 그게 합방이에요. 한 사람이 잘하는 거 말고, 둘이 같이 하는 거요. 제가 못 낚아도 그쪽이 낚으면 돼요.',
        "Manbok Store! Even the name's a shot. (She writes it down in her notebook.)\n\nTwo side by side, two fish. That's a collab. Not one person being good, two people doing it together. If I don't land one, you can.",
        { affinity: 0.05 }),
      d('ask_collab', '합방이 정확히 뭡니까? 같이 방송한다는 겁니까?', 'What exactly is a collab? We stream together?',
        '네! 한 화면에 둘이요. 제 구독자가 그쪽을 보고, 그쪽 구독자가… 아, 그쪽은 구독자가 없죠. (웃는다.)\n\n그러니까 제 쪽에서 그쪽을 소개하는 거예요. 속초 바다랑 같이. 그 동네는 그 동네 사람이 보여 주는 게 제일 좋거든요.',
        "Yes! Two people on one screen. My subscribers see you, and your subscribers… oh, you don't have any. (She laughs.)\n\nSo I introduce you on my side. Along with the Sokcho sea. A place looks best when someone from there shows it.",
        { affinity: 0.04, flag: 'choice.n20_3_asked_collab' }),
      d('ask_permission', '좌판은 할머니께 먼저 여쭤야 합니다. 허락 없이는 안 됩니다.', 'We ask the grandmother at the stall first. Not without her say-so.',
        '당연하죠! 그래서 허락 받는다고 했잖아요. (두 손을 모은다.)\n\n같이 가서 여쭤봐 주세요. 제가 혼자 가면 삼각대 든 수상한 사람이에요. 그쪽이 옆에 있으면 덜 수상하겠죠.',
        "Of course! That's why I said with permission. (She presses her hands together.)\n\nCome and ask her with me. If I go alone, I'm a suspicious stranger with a tripod. With you beside me, I'll look less suspicious.",
        { affinity: 0.06, flag: 'choice.n20_3_permission_first' }),
      d('home_ground', '홈그라운드라니, 제가 속초 사람 다 됐나 봅니다.', 'Home ground, you say. I must be a Sokcho local by now.',
        '다 됐어요! 그쪽은 속초 얘기할 때 표정이 달라요. 그거 찍으러 가는 거예요. (카메라를 들어 내 얼굴에 대 보는 시늉을 한다.)\n\n…아, 근데 그쪽은 얼굴보다 등이 더 잘 나와요. 섬네일 때 봤잖아요. 등으로 할게요.',
        "You are! Your face changes when you talk about Sokcho. That's what I'm going there to film. (She pretends to raise the camera to my face.)\n\n…Oh, but your back comes out better than your face. We saw that with the thumbnail. I'll go with your back.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('shop_name', '출연료는 됐습니다. 만복상회 이름만 영상에 남겨 주십시오.', "No fee. Just leave Manbok Store's name in the video.",
        '만복상회! 당연하죠. 영상 끝에 크게 넣을게요. (수첩에 받아 적는다.)\n\n찾아오는 사람 생기면 할머니한테 혼나는 거 아니에요? …혼나도 넣을래요. 좋은 데는 알려야죠.',
        "Manbok Store! Of course. I'll put it big at the end of the video. (She writes it in her notebook.)\n\nWon't I get told off by the grandmother if people start showing up? …I'll put it in even if I do. Good places should be known.",
        { affinity: 0.06, harborRep: 2 }),
    ],
    completeReply: {
      keep_cut: [
        '네! 그 컷이 메인이에요! (할머니가 영상에서 자기를 보고 웃었다는 걸 나중에 들었다.)\n\n할머니가 카메라를 한 번도 안 보셨어요. 그래서 좋았어요. 카메라 안 보는 사람이 제일 잘 나오거든요.',
        "Yes! That cut is the thumbnail! (I heard later that the stall grandmother saw herself in it and laughed.)\n\nShe never once looked at the camera. That's why it was good. People who don't look at the camera come out best.",
      ],
      pay: [
        '이번엔 진짜 있어요! 구독자 천 넘었어요! (봉투가 처음으로 봉투답다.)\n\n속초 편을 제일 많이 봤대요. 그쪽 동네 덕이에요. 봉투에 동네 몫도 들어 있다고 생각해 주세요.',
        "This time there really is one! Over a thousand subscribers! (For once the envelope is a proper envelope.)\n\nThe Sokcho episode got the most views. That's thanks to your patch. Think of part of the envelope as the town's share.",
      ],
      lesson: [
        '손이요. 얼굴 말고. (사람 손을 보는 눈이 생긴다.)\n\n얼굴은 카메라를 보면 꾸며요. 손은 못 꾸며요. 할머니 손 봤죠? 그 손이 다 말해요.',
        "The hands. Not the face. (I get an eye for people's hands.)\n\nFaces put on a show when they see a camera. Hands can't. Did you see the grandmother's hands? They say everything.",
      ],
    },
  },

  // ── N20-4 「조회수와 금어기」 · 유하랑 (어느 답이든 재고 바로 놓아준다) ──
  'N20-4': {
    offer: [
      d('no_holding', '금어기 고기는 들고 찍는 게 아닙니다. 재고 바로 놓겠습니다.', "You don't pose with a closed-season fish. I'll measure it and let it go.",
        '…아. 다들 들고 찍길래요. 저도 모르게. (카메라가 잠깐 바닥을 향한다.)\n\n그럼 재는 것까지만 찍을게요. 놓아주는 것도요. 그건… 괜찮죠? 빨리요. 제가 말하는 동안에도 숨 못 쉬잖아요.',
        "…Oh. Everyone poses with them, so I did it without thinking. (The camera dips towards the ground for a moment.)\n\nThen I'll only film the measuring. And the release. That's… okay, right? Quickly. It can't breathe while I'm talking either.",
        { affinity: 0.05, flag: 'choice.n20_4_refused_pose' }),
      d('how_long', '각만 잡는다는 게 얼마나 걸리는 겁니까?', 'Getting the angle — how long does that take?',
        '삼십 초요. 아니, 일 분? 빛 들어오는 방향 맞추고, 비늘 반짝이는 각도 찾고… (말하다가 스스로 멈춘다.)\n\n…물 밖에서 일 분이면 길죠. 그쵸. 길어요. 재고 바로 놔 주세요. 제가 그 장면을 찍을게요.',
        "Thirty seconds. No, a minute? Line it up with the light, find the angle where the scales shine… (She stops herself mid-sentence.)\n\n…A minute out of the water is long, isn't it. Yeah. It's long. Measure it and let it go right away. I'll film that instead.",
        { affinity: 0.04, flag: 'choice.n20_4_asked_time' }),
      d('in_water', '물에 담근 채로 자만 대고 찍으십시오. 들어 올리지는 않습니다.', "Film it in the water with just the rule against it. I won't lift it out.",
        '물속에서요? 그림이 더 좋을 수도 있겠다! (카메라를 수면 가까이 낮춘다.)\n\n…아니, 그림 얘기 할 때가 아니죠. 빨리 재요. 제가 숫자 읽을게요. 다 읽으면 바로 놔 주세요.',
        "In the water? That might even look better! (She lowers the camera close to the surface.)\n\n…No, this isn't the time to talk shots. Measure it quickly. I'll read the number. Once I've read it, let it go straight away.",
        { affinity: 0.04, flag: 'choice.n20_4_in_water' }),
      d('film_release', '조회수 걱정은 압니다. 놓아주는 장면을 찍으시죠.', "I know you're worried about views. Film the release instead.",
        '…들켰다. 요즘 숫자가 좀 그래서요. (웃으려다 만다.)\n\n놓아주는 거요? 그걸 누가 봐요… 아니, 모르죠. 봐 줄 수도 있죠. 찍을게요. 재는 것부터 놓는 데까지 한 번에.',
        "…Caught me. The numbers have been a bit rough lately. (She starts to laugh, then doesn't.)\n\nThe release? Who'd watch that… no, who knows. Someone might. I'll film it. From the measuring to letting go, in one take.",
        { affinity: 0.06 }),
    ],
    completeAdd: [
      d('waive_fee', '출연료는 됐습니다. 그 부분을 자르지 않은 걸로 충분합니다.', "No fee. That you didn't cut that part is enough.",
        '…그런 말 하시면 저 울어요. (웃으면서 눈가를 손등으로 닦는다.)\n\n그 부분에 댓글이 제일 많아요. 다 금어기가 뭐냐는 질문이에요. 대답은 그쪽이 영상에서 다 해 놨고요.',
        "…Say things like that and I'll cry. (She laughs and wipes her eyes with the back of her hand.)\n\nThat part has the most comments. All asking what a closed season is. And you'd already answered them all in the video.",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      explain: [
        '…그게 방송이에요. 배웠어요. (그 영상이 하랑의 채널에서 제일 오래 남았다.)\n\n저는 그림만 생각했어요. 그쪽은 그 고기가 내년에 어디 있을지를 생각했고요. 그게 차이예요.',
        "…That's broadcasting. I've learned that. (That video stayed up longest on her channel.)\n\nI was only thinking about the shot. You were thinking about where that fish would be next year. That's the difference.",
      ],
      lesson: [
        '자를 같이 찍어요. 숫자를요. (계측 방송이라는 게 생겼다.)\n\n숫자가 나오면 다들 왜 놓아주는지 알아요. 설명이 필요 없어요. 자가 대신 말해 주니까요.',
        "Film the rule with it. The numbers. (Measurement broadcasts become a thing.)\n\nOnce the number's on screen, everyone gets why you let it go. No explaining needed. The rule says it for you.",
      ],
      pay: [
        '네… 이번 영상 수익. 방생 영상이 제일 많이 벌었어요, 이상하게. (봉투가 두껍다.)\n\n이상한 게 아닌가 봐요. 사람들은 놓아주는 걸 보고 싶었던 거예요. 저만 몰랐어요.',
        "Yes… this video's revenue. The release video earned the most, oddly. (The envelope is thick.)\n\nMaybe it isn't odd. People wanted to see something let go. I was the only one who didn't know.",
      ],
    },
  },

  // ── N20-5 「오프라인」 · 유하랑 ──
  'N20-5': {
    offer: [
      d('no_camera', '카메라 없는 하랑 씨는 처음 봅니다. 좋습니다.', "First time I've seen you without a camera, Harang. I like it.",
        '저도 저 처음 봐요. (웃는다.) 손이 허전해요. 뭘 들고 있어야 할 것 같고.\n\n그러니까 대를 들게요. 오늘은 저도 그냥 낚시하는 사람이에요. 세 마리 낚고 같이 먹어요.',
        "First time I've seen me like this too. (She laughs.) My hands feel empty. Like I should be holding something.\n\nSo I'll hold a rod. Today I'm just someone fishing too. Three fish, then we eat together.",
        { affinity: 0.05 }),
      d('ask_subs', '울릉까지 오셨다고요? 구독자분들이 몇 분이나 오셨습니까?', 'They came all the way to Ulleung? How many of them?',
        '몇 분이요. 손가락으로 셀 만큼. 그래도 배 타고 여기까지요. (손가락을 하나씩 접어 보인다.)\n\n댓글로만 보던 이름이 얼굴이 됐어요. 그래서 카메라 끈 거예요. 얼굴 보는데 화면 보면 안 되잖아요.',
        "A few. You could count them on your fingers. But they came all this way by boat. (She folds down her fingers one by one.)\n\nNames I only knew from comments have turned into faces. That's why I turned the camera off. You can't look at a screen when you're looking at faces.",
        { affinity: 0.04, flag: 'choice.n20_5_asked_subs' }),
      d('ask_stream', '카메라를 끄시면 오늘 방송은 어떻게 합니까?', "If the camera's off, what about today's stream?",
        '안 해요. 오늘은. (카메라 가방 지퍼를 끝까지 잠근다.)\n\n찍으면 다들 카메라 보고 웃어요. 안 찍으면 서로 보고 웃고요. 오늘은 그걸 보고 싶어요. 그쪽이랑 그분들이랑.',
        "I'm not. Not today. (She zips the camera bag all the way shut.)\n\nWhen I film, everyone smiles at the camera. When I don't, they smile at each other. Today I want to see that. You, and them.",
        { affinity: 0.04 }),
      d('catch_for_all', '세 마리면, 구독자분들 몫까지 제가 낚아야겠군요.', "Three fish — then I'd better catch the subscribers' share too.",
        '아뇨! 그분들도 대 잡을 거예요. 제가 가르쳐 드리기로 했어요. (자신 있게 말하다가 나를 본다.)\n\n…도와주실 거죠? 저 설명은 잘하는데 엉킨 줄은 못 풀어요. 그건 그쪽 몫이에요.',
        "No! They're holding rods too. I said I'd teach them. (She says it confidently, then looks at me.)\n\n…You'll help, right? I'm good at explaining, but I can't untangle a line. That part's yours.",
        { affinity: 0.03, flag: 'choice.n20_5_joked' }),
    ],
    completeAdd: [
      d('my_treat', '편의점 라면값은 제가 내겠습니다. 오늘은 제가 대접하겠습니다.', "I'll pay for the convenience store noodles. My treat today.",
        '안 돼요! 오늘은 제가 쏘기로 했어요. (계산대 앞에서 지갑을 먼저 꺼낸다.)\n\n…그럼 컵라면 물만 부어 주세요. 그게 제일 맛있는 일이에요. 물 붓는 사람이 제일 고맙거든요.',
        "No way! Today's on me, I decided. (She gets her wallet out first at the counter.)\n\n…Then just pour the hot water for the cup noodles. That's the tastiest job there is. Everyone's most grateful to the one pouring the water.",
        { affinity: 0.07, flag: 'choice.n20_5_treat' }),
    ],
    completeReply: {
      offline: [
        '…그 말 다음 영상 제목이에요. 아니, 안 올릴래요. (구독자 하나가 내 이름을 안다.)\n\n올리면 그분들이 화면 속 사람이 돼요. 안 올리면 그냥 같이 낚시한 사람이고요. 저는 그게 더 좋아요.',
        "…That's the next video's title. No — I won't upload it. (One subscriber knows my name.)\n\nUpload it and they turn into people on a screen. Don't, and they're just people I went fishing with. I like that better.",
      ],
      lesson: [
        '저 유튜버잖아요, 설명이 직업이에요. (사람 가르치는 법이 조금 는다.)\n\n비결은 한 번에 하나만 말하는 거예요. 줄 잡고, 그다음에 던지고. 두 개 말하면 둘 다 까먹어요.',
        "I'm a YouTuber. Explaining is the job. (I get a little better at teaching.)\n\nThe trick is saying one thing at a time. Hold the line, then cast. Say two things and they forget both.",
      ],
      pay: [
        '네! 구독자분들이 모아 줬어요! (봉투가 여럿이 모은 봉투다.)\n\n봉투에 다들 닉네임을 적었어요. 화면에서만 보던 이름들이에요. 오늘은 그 이름들이 대를 잡았어요.',
        "Yes! The subscribers chipped in! (It's an envelope many hands filled.)\n\nEveryone wrote their usernames on the envelope. Names I'd only ever seen on a screen. Today those names held rods.",
      ],
    },
  },

  // ── N20-6 「마지막 라이브」 · 유하랑 (다음 항구 이야기는 다음 편 — 꺼내지 않는다) ──
  'N20-6': {
    offer: [
      d('go_along', '동행하겠습니다. 끊기면 끊긴 대로 하시면 됩니다.', "I'll come. If the signal cuts, you just carry on.",
        '…네. 끊긴 대로요. (카메라 배터리를 하나 더 챙겨 넣는다.)\n\n신호 잡히는 데까지는 켜 둘게요. 끊기면 끊긴 채로 할게요. 그래도 끝까지 말할 거예요. 한 마리 올라올 때까지.',
        "…Yes. Cut off, then. (She packs one more camera battery.)\n\nI'll keep it on as long as there's signal. When it cuts, I'll keep going cut off. I'll still talk to the end. Until one comes up.",
        { affinity: 0.05 }),
      d('why_live', '아무도 안 볼 걸 아시면서 왜 켜십니까?', 'If you know nobody will watch, why go live?',
        '보라고 켜는 게 아니라… 하려고 켜는 거예요. 설명이 잘 안 되네. (카메라 렌즈를 소매로 닦는다.)\n\n그쪽 처음 만난 날엔 열두 명이었어요. 오늘은 영 명일 거고요. 그래도 그날이랑 같은 마음으로 해 보고 싶어요.',
        "I don't turn it on so people watch… I turn it on to do it. That's hard to explain. (She wipes the lens with her sleeve.)\n\nThe day I first met you, there were twelve. Today there'll be zero. I still want to do it with the same heart as that day.",
        { affinity: 0.05, flag: 'choice.n20_6_asked_why' }),
      d('ask_signal', '독도는 신호가 그렇게 안 잡힙니까?', 'Is the signal really that bad out at Dokdo?',
        '잡히다 말다 해요. 배 위에선 거의 안 잡힌대요. (휴대폰을 들어 안테나 칸을 보여 준다. 한 칸이다.)\n\n그러니까 영 명이에요, 아마. 그래도 녹화는 돼요. 그건 남아요. 남는 게 있으면 된 거예요.',
        "It comes and goes. They say there's barely any on the boat. (She holds up her phone to show me the signal bars. One bar.)\n\nSo it'll be zero, probably. But it still records. That stays. If something stays, that's enough.",
        { affinity: 0.03 }),
      d('zero_fee', '시청자가 영 명이면, 출연료도 영 원입니까?', 'Zero viewers — does that make my fee zero won too?',
        '…계산 빠르시네요. (웃는다.) 영 원은 아니에요. 그동안 모아 둔 거 있어요.\n\n그래도 오늘은 돈 얘기 말고요. 같이 가 줘요. 혼자 가면 진짜로 아무도 없잖아요. 한 명은 있어야죠.',
        "…Quick with the sums, aren't you. (She laughs.) Not zero won. I've saved some up.\n\nBut no money talk today. Come with me. If I go alone, there really is nobody. There has to be one.",
        { affinity: 0.01, flag: 'choice.n20_6_joked' }),
    ],
    completeAdd: [
      d('one_viewer', '시청자 0이 아니었습니다. 제가 보고 있었습니다.', "It wasn't zero viewers. I was watching.",
        '…그 말은 반칙이에요. (카메라를 내리고 한참 바다를 본다.)\n\n그럼 1이네요. 숫자 고칠래요. 오늘 시청자 1. 녹화본 맨 끝에 적어 둘게요. 시청자 한 명, 끝까지.',
        "…That's not fair, saying that. (She lowers the camera and looks at the sea for a long while.)\n\nThen it's one. I'm fixing the number. Today's viewers: one. I'll write it at the very end of the recording. One viewer, to the end.",
        { affinity: 0.1, flag: 'choice.n20_6_one_viewer' }),
    ],
    completeReply: {
      zero: [
        '…맞아요. (녹화본을 준다. 유일한 사본이라며.)\n\n그 사본 잃어버리면 이 방송은 없었던 게 돼요. 그러니까 잘 둬요. 아니, 없어져도 돼요. 우리가 봤으니까.',
        "…It was. (She gives me the recording. The only copy, she says.)\n\nLose that copy and this broadcast never happened. So keep it safe. No — it's fine if it's lost. We saw it.",
      ],
      lesson: [
        '렌즈 너머에 한 사람 있다고 생각해요. 늘 한 사람. (혼자 하는 낚시가 덜 외롭다.)\n\n그 한 사람한테만 말하면 목소리가 작아져요. 작은 목소리가 오래 남아요. 큰 소리는 금방 지나가고요.',
        "I picture one person past the lens. Always one. (Fishing alone feels less lonely.)\n\nTalk to just that one person and your voice gets quieter. Quiet voices last. Loud ones pass quickly.",
      ],
      pay: [
        '정가! 마지막 광고 수익 전부! (봉투가 마지막답다.)\n\n마지막이라고 깎으면 안 되죠. 끝까지 제값 드리는 게 제 마지막 방송 예의예요. 받아 줘요.',
        "Full rate! All of the last ad revenue! (The envelope feels like a last one.)\n\nYou don't knock it down just because it's the last one. Paying the proper rate to the end is my last-broadcast manners. Please take it.",
      ],
    },
  },

  // ── N20-7 「자막 없는 영상」 · 유하랑 ──
  'N20-7': {
    offer: [
      d('pick_carefully', '컷 하나, 정성껏 고르겠습니다.', "One cut. I'll choose it with care.",
        '정성 들이지 마요. 처음 눈에 걸리는 거요. (노트북을 내 쪽으로 돌린다.)\n\n그리고 하나 더 찍어요. 돌돔 한 마리. 자막 없이 남길 장면이 하나 모자라요. 그건 그쪽 손이 해 줘야 해요.',
        "Don't put care into it. The first one that catches your eye. (She turns the laptop towards me.)\n\nAnd let's film one more. A rock bream. I'm one scene short for the no-subtitle version. That one needs your hands.",
        { affinity: 0.05 }),
      d('why_no_subs', '자막 없이 올리시는 이유가 있습니까?', "Is there a reason you're uploading it without subtitles?",
        '자막은 제가 하고 싶은 말이잖아요. 이번엔 제 말 빼고 싶어요. (화면 속 바다를 손가락으로 가리킨다.)\n\n보는 사람이 알아서 들으면 돼요. 바다 소리, 릴 소리, 그쪽 숨소리. 그거면 자막보다 많이 말해요.',
        "Subtitles are what I want to say. This time I want to leave my words out. (She points at the sea on the screen.)\n\nPeople can listen for themselves. The sea, the reel, your breathing. That says more than subtitles.",
        { affinity: 0.05, flag: 'choice.n20_7_asked_subs' }),
      d('ask_where', '다음 항구는 정말 안 정하셨습니까?', "You really haven't decided on the next harbour?",
        '진짜 안 정했어요. 지도 펴 놓고 손가락으로 찍을까 봐요. (웃는다.)\n\n정하면… 아니, 그건 끝나고 말할게요. 지금 말하면 마지막 영상이 마지막이 아니게 돼요.',
        "Really, I haven't. Maybe I'll open a map and stab it with a finger. (She laughs.)\n\nWhen I decide… no, I'll tell you after we're done. If I say now, the last video won't be the last.",
        { affinity: 0.03, flag: 'choice.n20_7_asked_where' }),
      d('sad', '떠나신다니 서운합니다.', "I'm sad you're leaving.",
        '서운하라고 말한 거예요. (웃는데 눈가가 빨갛다.) 거짓말이에요.\n\n…서운한 거 맞아요. 저도요. 그러니까 마지막 컷은 그쪽이 골라 줘요. 그래야 덜 서운해요.',
        "I said it so you'd be sad. (She laughs, but her eyes are red.) That's a lie.\n\n…It is sad. For me too. So you pick the last cut. That'll make it less sad.",
        { affinity: 0.06, flag: 'choice.n20_7_sad' }),
    ],
    completeAdd: [
      d('learn_cut', '자막 없이도 읽히는 장면 고르는 법, 마지막으로 배우고 싶습니다.', 'One last thing: how do you pick a scene that reads without subtitles?',
        '소리 끄고 봐요. 소리 없이도 뭔지 알면 그게 컷이에요. (노트북 음량을 끄고 같이 화면을 본다.)\n\n그다음에 소리를 켜요. 그럼 두 번 좋아요. 이게 제가 삼백 명일 때부터 하던 거예요.',
        "Watch it with the sound off. If you know what's happening with no sound, that's the cut. (She mutes the laptop and we watch together.)\n\nThen turn the sound on. Then it's good twice. I've done it that way since I had three hundred.",
        { proficiency: { category: 'economy', xp: 28 }, affinity: 0.06 }),
    ],
    completeReply: {
      cut: [
        '…저도 그 컷이었어요. (삼각대를 준다. 첫 방송 때 그 삼각대. 새 항구에서는 새 걸 산다고.)\n\n처음 거 들고 다음 항구 가면 처음으로 돌아가는 것 같아서요. 새 데서는 새 거로 시작할래요. 이건 그쪽이 써요.',
        "…That was my cut too. (She gives me the tripod. The one from her first stream. She'll buy a new one at the new harbour.)\n\nTaking the first one to the next harbour would feel like going back to the start. In a new place I want to start with something new. You use this one.",
      ],
      next_port: [
        '…진짜요? 그럼 말할게요. 정해지면. (그 뒤로 항구마다 엽서가 온다.)\n\n배로 온다는 사람은 처음이에요. 그럼 배 댈 데가 있는 데로 골라야겠네요. 방파제 끝에서 기다릴게요.',
        "…Really? Then I'll tell you. When I've picked it. (Postcards come from every harbour after that.)\n\nNobody's ever said they'd come by boat. Then I'd better pick somewhere with a place to tie up. I'll wait at the end of the breakwater.",
      ],
      pay: [
        '드릴게요! 마지막 영상 수익! 자막 없는 게 제일 벌었어요! (봉투가 마지막답다.)\n\n농담인 거 알아요. 그래서 드리는 거예요. 농담으로 받아 주세요. 그래야 저도 웃으면서 떠나요.',
        "I'll pay it! Last video's revenue! The one with no subtitles earned most! (The envelope feels like a last one.)\n\nI know you're joking. That's why I'm giving it. Take it as a joke. Then I can leave laughing too.",
      ],
    },
  },
};
