/**
 * @file StoryChoiceDepth4.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 4묶음: 서브 N01 바람 · N02 탁만수·탁새벽 · N03 강두철 · N04 청초고 방파제부.
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 *
 * 이 묶음의 스포일러 선(R2)
 *  - N01 바람: 본명 · 과거(배와 사람을 잃은 선장)는 N01-7에서만. 그 전에는 떠도는 사람 「바람」 — 물으면 말을 돌린다.
 *  - N03 강두철: N03-1 · N03-5에서는 채비 못 묶는 초보 노인(손 · 수첩 같은 단서만). 조합장 직함은 N03-2부터.
 *  - N03-6 두 노인이 탔던 배는 이름도 사연도 말하지 않는다.
 *  - N02-2 `decline` 응답은 늘리지 않았다 — 나레이션 원문에 「우호도」(R1 개발 용어)가 있어 원문을 앞에 두면 검사기 오류가 된다.
 *    원문(`StoryNarrative.ts`)을 고치면 그때 늘린다.
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { d } from './StoryChoiceDepthKit.js';

export const CHOICE_DEPTH_4: Record<string, ChoiceDepthEntry> = {
  // ── N01-1 「리어카」 · 바람 ──
  'N01-1': {
    offer: [
      d('for_table', '생일상이라면 해 봐야죠. 던지는 법부터 알려 주세요.', "A birthday table — then I have to try. Show me how to throw it first.",
        '그래. 팔로 던지지 말고 허리로 던져. 추가 먼저 날아가고 줄이 따라가게. (리어카에서 긴 원투대를 꺼내 내 손에 쥐여 준다.)\n\n도다리는 바닥에 붙어 사는 놈이야. 멀리 던지고, 줄 세우고, 기다려. 할머니 한숨이 길어지기 전에.',
        "Right. Don't throw with your arm, throw with your hips. Let the sinker fly first and the line follow. (He pulls a long surf rod off the cart and puts it in my hands.)\n\nFlounder live stuck to the bottom. Throw far, keep the line taut, and wait. Before the old lady's sighs get any longer.",
        { affinity: 0.05 }),
      d('ask_grandma', '저 할머니랑 아는 사이세요? 어떻게 아셨어요?', "Do you know her? How did you find out?",
        '몰라. 처음 봐. 좌판 앞에 서 있는데 도다리, 도다리 하시더라. 한숨 섞어서.\n\n(담배를 꺼냈다가 좌판 쪽을 보고 도로 넣는다.) 한숨 소리는 어느 항구나 같아. 듣는 사람이 없을 뿐이지. 들었으면 하나는 해 줘야지.',
        "No. First time I've seen her. I was standing by the stall and she kept saying flounder, flounder. With a sigh in it.\n\n(He takes out a cigarette, glances at the stall and puts it back.) A sigh sounds the same in every harbour. There's just nobody listening. If you heard it, you do one thing about it.",
        { affinity: 0.04, flag: 'choice.n01_1_asked_grandma' }),
      d('ask_size', '아무 도다리나 되나요? 크기도 봐야 하죠?', "Will any flounder do? I should check the size too, right?",
        '봐야지. 자를 대 보고 모자라면 다시 넣어. 손주 생일상에 어린 놈 올리고 좋아할 할머니는 없어.\n\n(손바닥을 펴 한 뼘을 재 보인다.) 바늘은 작은 걸로. 도다리는 입이 작아서 큰 바늘은 건드리기만 하고 가. 그것만 알면 반은 낚은 거야.',
        "You should. Lay a rule on it, and if it's short, put it back. No grandmother wants a baby fish on her grandson's birthday table.\n\n(He spreads his hand and measures out a span.) Small hook. A flounder's mouth is small, so with a big hook it just nibbles and leaves. Know that much and you're halfway there.",
        { affinity: 0.06, flag: 'choice.n01_1_asked_size' }),
      d('no_bike', '리어카 도면이요? 저는 자전거도 없는데요.', "A cart plan? I don't even have a bicycle.",
        '(웃지 않는다. 대신 자기 리어카 바퀴를 발로 툭 찬다.) 자전거가 없으면 손으로 끌면 돼. 리어카는 원래 사람이 끄는 거야.\n\n도면은 낚아 오면 줘. 무슨 뜻인지는 그때 알게 되고. 지금은 도다리부터.',
        "(He doesn't laugh. Instead he taps the cart's wheel with his foot.) No bicycle, then pull it by hand. Carts were made for people to pull.\n\nThe plan comes when you bring the fish. What it's for, you'll see then. Flounder first.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('your_share', '그럼 바람 씨 몫은요? 아무것도 안 받으세요?', "And what's your share, Baram? You're not taking anything?",
        '내 몫? 할머니 얼굴 봤잖아. 그게 내 몫이야. 다른 건 리어카에 실을 데도 없고. (담배에 불을 붙이고 오래 좌판 쪽을 본다.)\n\n받는 게 적어야 멀리 가. 그 말은 아직 몰라도 돼.',
        "My share? You saw her face. That's my share. Anything else, there's no room for it in the cart. (He lights a cigarette and looks at the stall for a long time.)\n\nThe less you take, the further you go. You don't need to understand that yet.",
        { affinity: 0.06, flag: 'choice.n01_1_asked_share' }),
    ],
    completeReply: {
      blueprint: [
        '손재주는 손으로 배우는 거야. 못 만들면 다시 와. (도면을 펴 접는 법까지 보여 준다.)\n\n바퀴 축부터 맞춰. 축이 비뚤면 짐이 한쪽으로 쏠리고, 쏠리면 끄는 사람이 먼저 지쳐. 다 만들면 한 바퀴 끌어 보고 와. 소리만 들어도 알아.',
        "Handiness is learned with hands. Come back if you can't manage it. (He shows me how to fold the plan as well as unfold it.)\n\nLine up the axle first. If the axle's crooked the load leans, and when it leans the one pulling tires first. When it's done, pull it round once and come back. I'll know just from the sound.",
      ],
      cash: [
        '…그래, 그것도 답이지. 돈이 급한 나이야. (주머니에서 지폐를 꺼내 세지도 않고 준다.)\n\n부끄러워할 거 없어. 배고픈 놈한테 도면은 종이야. 배부르면 그때 다시 와. 도면은 리어카에 늘 있으니까.',
        "…Right, that's an answer too. It's an age when money's urgent. (He pulls notes from his pocket and hands them over without counting.)\n\nNothing to be ashamed of. To a hungry man a plan is just paper. Come back when you're fed. The plan's always in the cart.",
      ],
    },
  },

  // ── N01-2 「다리 밑」 · 바람 ──
  'N01-2': {
    offer: [
      d('go_sit', '가요. 애 혼자 다리 밑에 두면 안 되죠.', "Let's go. We can't leave a kid alone under a bridge.",
        '그래. 근데 데리고 오려고 가는 거 아니야. 옆에 있으려고 가는 거지. (리어카를 다리 기둥 옆에 댄다.)\n\n애들은 붙잡으면 더 멀리 가. 우리는 낚시하러 온 사람이야. 그것만 기억해. 나머지는 전갱이가 해.',
        "Right. But we're not going to bring him back. We're going to be beside him. (He parks the cart by a bridge pillar.)\n\nGrab a kid and he runs further. We're just people who came to fish. Remember that. The horse mackerel do the rest.",
        { affinity: 0.05 }),
      d('ask_why', '가출이요? 왜 집을 나왔대요?', "Ran away? Why did he leave home?",
        '안 물어봤어. 물으면 도망가. 그 나이엔 대답 대신 발이 먼저 나가.\n\n(다리 쪽을 턱으로 가리킨다.) 전화기를 계속 만지작거리더라. 누르지는 못하고. 거기까지만 알아. 나머지는 그 애가 말하고 싶을 때 하겠지.',
        "Didn't ask. Ask and he bolts. At that age the feet answer before the mouth does.\n\n(He points his chin at the bridge.) He keeps fiddling with his phone. Can't press it, though. That's all I know. The rest he'll tell when he wants to.",
        { affinity: 0.04, flag: 'choice.n01_2_asked_why' }),
      d('why_mackerel', '왜 하필 전갱이예요? 한 마리면 된다는 건요?', "Why horse mackerel? And why would one be enough?",
        '이 다리 밑엔 밤이면 불빛 따라 전갱이가 떼로 붙어. 옆에서 보기도 좋고, 잘 물고.\n\n한 마리면 돼. 눈앞에서 뭐가 펄떡이면 사람은 웃게 돼 있어. 웃고 나면 무거운 버튼도 좀 가벼워지고.',
        "At night the horse mackerel crowd under this bridge after the lights. Easy to watch, and they bite well.\n\nOne's enough. When something's flapping right in front of you, you can't help smiling. And once you've smiled, a heavy button gets a little lighter.",
        { affinity: 0.03 }),
      d('not_good_kids', '애들 상대는 자신이 없는데요. 괜히 말 실수할까 봐요.', "I'm no good with kids. I'm scared I'll say the wrong thing.",
        '그럼 말하지 마. 잘됐네. (입꼬리가 아주 조금 올라간다.)\n\n말 잘하는 어른은 그 애 주변에도 많았을 거야. 말 없는 어른이 하나쯤 있어도 돼. 낚싯대만 들고 가. 그게 네 할 말이야.',
        "Then don't say anything. Perfect. (The corner of his mouth lifts, just barely.)\n\nHe's probably had plenty of grown-ups who talk well. One who doesn't talk won't hurt. Just bring a rod. That's all you need to say.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('asked_how', '형님은 그 애를 어떻게 먼저 알아보셨어요?', "How did you spot him before anyone else?",
        '바람은 낮은 데로 먼저 불어. 다리 밑은 낮잖아. 그게 다야. (담배를 물고 불은 붙이지 않는다.)\n\n사람들은 위만 보고 다녀. 다리 위로 차는 그렇게 지나가는데 밑은 아무도 안 봐. 이제 너도 밑을 보겠지. 그럼 됐어.',
        "Wind blows into the low places first. Under a bridge is low. That's all. (He puts a cigarette in his mouth and doesn't light it.)\n\nPeople only look up. All those cars go over the bridge and nobody looks underneath. You'll look underneath now. That's enough.",
        { affinity: 0.07, flag: 'choice.n01_2_asked_how' }),
    ],
    completeReply: {
      pay: [
        '그러지. 리어카에 돈이 있어. (리어카 서랍에서 지폐를 꺼낸다.)\n\n돈 얘기는 짧게 하는 거야. 받을 건 받고. 오늘 한 건 일이었어. 애 하나 옆에 말없이 앉아 있는 게 쉬운 일은 아니거든.',
        "I will. The money's in the cart. (He takes notes from the cart drawer.)\n\nMoney talk should be short. Take what's yours. What you did today was work. Sitting quietly beside a kid isn't easy.",
      ],
      decline: [
        '…바람이 좋은 쪽으로 불었네. (부산 항구 사람들이 나를 알아보기 시작한다.)\n\n그 애가 웃을 때 너도 웃더라. 그거면 품삯은 받은 거야. 바람은 그렇게 불어. 누가 시키지 않아도.',
        "…The wind blew the right way. (People around Busan harbour start recognising me.)\n\nWhen the boy smiled, so did you. That's your wage paid. That's how the wind blows. Nobody has to tell it to.",
      ],
    },
  },

  // ── N01-3 「덕장」 · 바람 ──
  'N01-3': {
    offer: [
      d('listen_through', '들을게요. 끝까지요. 중간에 끊지 않겠습니다.', "I'll listen. All the way through. I won't cut in.",
        '그래. 안 끊는 게 제일 어려워. 사람은 듣다가 자꾸 답을 주려고 하거든. (덕장 쪽으로 턱짓을 한다. 빈 대가 바람에 흔들린다.)\n\n답 주지 마. 그 사람이 제일 잘 알아. 너는 옆에서 하나 말려. 손을 놀리면 말이 덜 무거워.',
        "Right. Not cutting in is the hardest part. People listen and then keep trying to hand over answers. (He nods toward the racks. The empty rails sway in the wind.)\n\nDon't give answers. He knows best. You just dry something beside him. When your hands are busy, the talk weighs less.",
        { affinity: 0.05 }),
      d('ask_gwamegi', '과메기 명맥이 끊긴다는 게 무슨 말이에요?', "What does it mean, the gwamegi line ending?",
        '과메기는 원래 청어로 말렸어. 겨울 바닷바람에 얼었다 녹았다 하면서. 그 청어가 이 앞에 안 들어. 대만 남고 걸 게 없는 거지.\n\n대를 비워 두면 그다음 해엔 대도 없어져. 사람 일이 그래. 그래서 힘들어하는 거야. 들어 보면 알아.',
        "Gwamegi used to be dried from herring. Freezing and thawing in the winter sea wind. Now the herring don't come in here. The rails are left with nothing to hang.\n\nLeave the rails empty and the next year the rails are gone too. That's how people's work goes. That's why he's struggling. Listen and you'll see.",
        { affinity: 0.04, flag: 'choice.n01_3_asked_gwamegi' }),
      d('no_answer', '답도 없는데 듣기만 하면 그분이 더 답답하지 않을까요?', "If there's no answer, won't just listening make him feel worse?",
        '답답하겠지. 그래도 혼자 답답한 거랑 둘이 답답한 건 달라. (담배 연기를 길게 내뱉는다.)\n\n바다가 바뀌면 사람이 바뀌어야지. 근데 바뀌는 건 혼자 못 해. 옆에 누가 있어야 돼. 오늘은 네가 옆이야.',
        "He will. But being stuck alone and being stuck with someone aren't the same. (He lets out a long stream of smoke.)\n\nIf the sea changes, people have to change. But nobody changes alone. Someone has to be beside you. Today that's you.",
        { affinity: 0.03 }),
      d('why_not_you', '형님이 들어 드리면 되잖아요. 왜 저한테 맡기세요?', "You could listen to him yourself. Why hand it to me?",
        '나는 지나가는 사람이야. 지나가는 사람한테 하는 얘기랑 남아 있는 사람한테 하는 얘기는 달라. (꽁초를 발로 비벼 끈다.)\n\n너는 돌아갈 항구가 있잖아. 그런 사람한테 해야 그 사람도 대를 다시 세울 마음이 생겨. 나는 옆에서 담배나 피울게.',
        "I'm someone passing through. What people tell a passer-by and what they tell someone who stays aren't the same. (He grinds the butt out with his foot.)\n\nYou've got a harbour to go back to. Telling someone like that is what makes him want to put the rails back up. I'll just smoke over here.",
        { affinity: 0.02, flag: 'choice.n01_3_why_not_you' }),
    ],
    completeAdd: [
      d('asked_saying', '바다가 바뀌면 사람이 바뀐다는 말, 누구한테 들으셨어요?', "That saying, the sea changes so people change — who did you hear it from?",
        '…오래전에 누가 했어. 이름은 몰라도 돼. 말은 이름 없이도 잘 다녀. (리어카 손잡이에 기대 먼 바다를 본다.)\n\n좋은 말은 주인이 없어. 들은 사람이 쓰면 그 사람 거야. 오늘부터는 네 거기도 하고.',
        "…Someone said it, long ago. You don't need the name. Words travel fine without names. (He leans on the cart handle and looks out to sea.)\n\nA good saying has no owner. Whoever heard it and uses it, it's theirs. From today it's yours too.",
        { affinity: 0.06, flag: 'choice.n01_3_asked_saying' }),
    ],
    completeReply: {
      lesson: [
        '그렇지. 그게 바뀌는 거야. (덕장 주인이 숙성 온도를 적어 준다.)\n\n청어만 고집했으면 대는 벌써 비었어. 걸 수 있는 걸 거는 거야. 바다가 주는 대로. 적어 준 거 잃어버리지 마. 그 사람한테는 그게 수십 년이야.',
        "That's it. That's what changing is. (The yard owner writes down the curing temperature for me.)\n\nIf he'd held out for herring, the rails would be empty already. You hang what you can hang. Whatever the sea gives. Don't lose what he wrote. For him that's decades.",
      ],
      pay: [
        '그래. 리어카에. (바람은 돈에 대해 아무 말도 안 한다.)\n\n(서랍을 열어 둔 채 덕장 쪽만 본다.) 빈 대에 하나라도 걸리면 바람이 다르게 지나가. 들리지? 나는 그 소리 들으러 다니는 거야.',
        "Right. In the cart. (Baram says nothing at all about money.)\n\n(He leaves the drawer open and only looks at the racks.) Hang even one thing on an empty rail and the wind goes through differently. Hear it? That's the sound I travel for.",
      ],
      decline: [
        '…바람이 좋은 쪽으로 불었네. (포항 덕장 사람들이 나를 안다.)\n\n듣는 값 받는 사람은 없어. 그래서 다들 안 들어. 너는 들었고. (덕장 주인이 멀리서 손을 든다. 나도 든다.)',
        "…The wind blew the right way. (The people at the Pohang drying yards know me now.)\n\nNobody gets paid to listen. That's why nobody does. You did. (Far off, the rack owner raises a hand. I raise mine.)",
      ],
    },
  },

  // ── N01-4 「절벽」 · 바람 ──
  'N01-4': {
    offer: [
      d('i_cast', '제가 던질게요. 그분은 보기만 하셔도 돼요.', "I'll do the casting. He only has to watch.",
        '그래. 보기만 하는 것도 일이야. 그 사람한테는 제일 큰 일이고. (리어카에 구명조끼를 하나 더 싣는다.)\n\n벵에돔은 예민해. 그림자만 비쳐도 안 물어. 발소리 줄이고, 그 사람 앞에서 서두르지 마. 서두르는 거 보면 그 사람은 그날이 생각나.',
        "Right. Watching is work too. For him it's the biggest work there is. (He loads one more life jacket onto the cart.)\n\nBlackfish are touchy. Even a shadow puts them off. Keep your footsteps quiet and don't rush in front of him. If he sees you rushing, he'll remember that day.",
        { affinity: 0.05 }),
      d('ask_accident', '사고요? 무슨 일이 있었는데요?', "An accident? What happened?",
        '갯바위에서 일이 있었다는 것만 알아. 그 이상은 그 사람 거야. 묻지 마. (리어카 손잡이를 꽉 쥐었다 놓는다.)\n\n사고 난 사람한테 사고 얘기 시키는 게 제일 잔인한 거야. 바다 얘기를 해. 바람이 어느 쪽인지, 물이 어떤지. 그런 건 대답할 수 있으니까.',
        "All I know is something happened on the rocks. Anything more is his. Don't ask. (He grips the cart handle hard, then lets go.)\n\nMaking someone talk about their accident is the cruellest thing you can do. Talk about the sea. Which way the wind is, how the water looks. Those he can answer.",
        { affinity: 0.04, flag: 'choice.n01_4_asked_accident' }),
      d('dangerous_rocks', '해금강 갯바위면 위험한 데 아니에요? 그분을 거기로요?', "Aren't the Haegeumgang rocks dangerous? You want to take him there?",
        '위험하지. 그래서 거기야. 무서운 데를 피해 다니면 평생 피해 다녀. (해금강 쪽을 손가락으로 짚는다.)\n\n대신 발 디딜 데는 내가 먼저 봐 둘게. 물때 보고, 너울 보고. 초여름이라 바위에 이끼가 미끄러워. 그 사람은 그걸 누구보다 잘 알 거야.',
        "It is. That's why there. Avoid the place that scares you and you'll avoid it all your life. (He points toward Haegeumgang.)\n\nI'll check the footing first, though. The tide, the swell. Early summer, the moss on the rocks is slippery. He'll know that better than anyone.",
        { affinity: 0.03 }),
      d('feels_mean', '안 던지는 분 옆에서 혼자 잡으면 좀 얄밉지 않을까요?', "Won't it be a bit mean, me catching fish beside a man who won't cast?",
        '얄밉지. 그래서 네가 던지는 거야. 얄미워야 사람이 바다를 다시 봐. (짧게 웃는다.)\n\n잘 낚는 사람 옆에 앉아 있으면 손이 근질거려. 그게 시작이야. 대는 안 들어도 돼. 손만 근질거리면 돼.',
        "It will. That's why you're the one casting. A bit of envy is what makes a man look at the sea again. (A short laugh.)\n\nSit beside someone landing fish and your hands start to itch. That's how it starts. He doesn't have to pick up a rod. His hands only have to itch.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('bite_eye', '벵에돔 입질, 다음엔 더 빨리 알아보고 싶습니다.', "Next time I want to read a blackfish bite faster.",
        '찌가 들어가는 걸 보지 말고 멈추는 걸 봐. 벵에돔은 물었다 뱉는 놈이야. 찌가 멈칫할 때가 문 때야. (내 찌를 더 가벼운 것으로 바꿔 준다.)\n\n예민한 놈은 예민하게 상대해. 그 사람이 뜰채 잡을 때처럼. 천천히, 근데 놓치지 않게.',
        "Don't watch for the float going under, watch for it stopping. A blackfish takes it and spits it. When the float hesitates, that's the bite. (He swaps my float for a lighter one.)\n\nMeet a touchy fish with a light touch. Like the way he took the net. Slowly, but without letting go.",
        { proficiency: { category: 'fishing', xp: 24 }, affinity: 0.04 }),
    ],
    completeReply: {
      lesson: [
        '그렇지. 잃어 본 사람이 제일 잘 알아. (갯바위 안전이 몸에 붙는다.)\n\n그 사람 발 디디는 거 봤지. 젖은 데는 안 밟고, 바다 쪽으로 등 안 돌리고. 그게 다 그날 배운 거야. 비싸게 배운 걸 너한테 공짜로 보여 준 거고.',
        "That's it. The one who's lost something knows best. (Rock safety settles into my body.)\n\nYou saw where he put his feet. Never on the wet patches, never his back to the sea. He learned all of it that day. He paid dearly for it, and he showed it to you for nothing.",
      ],
      pay: [
        '리어카에. (돈은 늘 리어카에 있다.)\n\n여비는 여비야. 거제까지 온 다리가 공짜일 순 없지. (서랍을 열다 말고 해금강 쪽을 한 번 돌아본다.) 그 사람 뜰채 잡은 거, 너도 봤지. 그건 내가 못 주는 거야.',
        "In the cart. (The money is always in the cart.)\n\nFare is fare. Legs that came all the way to Geoje can't come free. (Halfway through opening the drawer he looks back toward Haegeumgang.) You saw him take the net too. That's something I can't give.",
      ],
      decline: [
        '…바람이 좋은 쪽으로. (거제 갯바위 사람들이 나를 안다.)\n\n그 말, 그 사람한테도 해 줘. 뜰채 잡은 손 봤으면 됐다고. 자기가 오늘 뭘 했는지 모를 거야. 잃어 본 사람은 자기가 다시 잡은 걸 잘 못 봐.',
        "…The wind, the right way. (The rock anglers of Geoje know me now.)\n\nTell him that too. That seeing his hand on the net was enough. He won't know what he did today. People who've lost something can't see it when they take hold again.",
      ],
    },
  },

  // ── N01-5 「해녀의 딸」 · 바람 ──
  'N01-5': {
    offer: [
      d('edge_only', '물가에서 캘게요. 물속엔 안 들어가겠습니다.', "I'll gather at the edge. I won't go into the water.",
        '그래. 물속은 어머니 자리야. 거기는 평생을 들인 사람만 들어가. (테왁을 멘 해녀 쪽을 오래 본다.)\n\n너는 물가에서 네 일을 해. 딸이 둘 다 보게. 물속에서 하는 것도, 물가에서 하는 것도 다 바다 일이라는 걸.',
        "Right. Under the water is her mother's place. Only people who've given it their whole lives go in there. (He looks for a long time at the diver with the float on her back.)\n\nYou do your work at the edge. So the daughter sees both. That what's done under the water and what's done at the edge are both the sea's work.",
        { affinity: 0.05 }),
      d('ask_border', '물질이랑 해루질은 뭐가 다른데요?', "What's the difference between diving and shore gathering?",
        '물질은 숨 하나로 바다 밑까지 들어가는 거야. 해녀들 일이고, 마을이 지키는 바다지. 해루질은 물 빠진 가장자리에서 손 닿는 데까지만.\n\n경계를 아는 게 제일 중요해. 남의 바다엔 안 들어가는 거. 저 딸은 그 경계 양쪽을 다 보게 될 거야. 그래서 네가 필요해.',
        "Diving is going down to the seabed on one breath. It's the haenyeo's work, and that sea belongs to the village. Shore gathering is only at the edge when the water's out, as far as your hand reaches.\n\nKnowing the border is what matters most. You don't go into someone else's sea. That girl will see both sides of the border. That's why you're needed.",
        { affinity: 0.04, flag: 'choice.n01_5_asked_border' }),
      d('their_business', '그 집 일인데, 저희가 끼어들어도 될까요?', "It's their family's business. Should we really get involved?",
        '안 끼어들어. 말 한마디도 안 해. 우리는 캐기만 하는 거야. (리어카를 길가에 세우고 담배를 꺼낸다.)\n\n끼어드는 건 말로 하는 거야. 옆에서 일하는 건 끼어드는 게 아니고. 보여 주기만 해. 고르는 건 그 애 몫이야.',
        "We don't get involved. Not one word. We only gather. (He parks the cart by the road and takes out a cigarette.)\n\nGetting involved is done with words. Working beside someone isn't getting involved. Just let her see. The choosing is hers.",
        { affinity: 0.05 }),
      d('when_to_go', '언제 나가면 돼요? 물 빠질 때요?', "When should I go out? When the tide's out?",
        '물 빠질 때. 사리 무렵이면 더 많이 드러나. 물 들어오기 시작하면 바로 나와. 물가 일은 물이 정해.\n\n그리고 표지 밖에서만. 마을 바다 안쪽은 손대지 마. 세 개면 돼. 욕심내면 경계가 흐려져.',
        "When the tide's out. Around the spring tides more of it shows. The moment it starts coming back in, get out. At the edge, the water decides.\n\nAnd only outside the markers. Don't touch anything inside the village's sea. Three is enough. Get greedy and the border blurs.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('asked_daughter', '그 딸, 결국 어떻게 하기로 했을까요?', "What do you think the daughter decided in the end?",
        '몰라. 안 물어봤어. 우리가 알 일은 아니야. (리어카 손잡이에 걸어 둔 수건으로 손을 닦는다.)\n\n다음에 이 앞을 지나다 테왁이 하나 더 떠 있으면 그때 알겠지. 안 떠 있어도 괜찮고. 어느 쪽이든 그 애가 고른 거니까.',
        "Don't know. Didn't ask. It's not ours to know. (He wipes his hands on the towel hanging from the cart handle.)\n\nIf I pass by here one day and there's one more float on the water, I'll know then. If there isn't, that's fine too. Either way, she chose it.",
        { affinity: 0.06, flag: 'choice.n01_5_asked_daughter' }),
    ],
    completeReply: {
      lesson: [
        '해녀 숨이야. 못 배워. 그래도 보는 건 돼. (물속에서 버티는 시간이 조금 는다.)\n\n물 밖으로 나올 때 휘파람 같은 소리 들었지. 숨비소리라고 해. 참았던 숨을 한 번에 내보내는 거야. 그 소리 들으면 얼마나 깊이 갔다 왔는지 알아.',
        "That's a haenyeo's breath. You can't learn it. You can watch it, though. (My time underwater lengthens a little.)\n\nYou heard that whistle when she came up. It's called sumbisori. All the held breath let out at once. Hear it and you know how deep she went.",
      ],
      pay: [
        '리어카. (제주 리어카는 배를 타고 왔다.)\n\n뱃삯도 들었으니 받아. 바다 건너는 데는 다리가 소용없거든. (서랍을 연다. 섬 바람에 지폐 귀퉁이가 눅눅하다.)',
        "The cart. (The Jeju cart came over by ferry.)\n\nThe ferry cost too, so take it. Legs are no use crossing the sea. (He opens the drawer. The corners of the notes are damp from the island wind.)",
      ],
      decline: [
        '…바람이 좋은 쪽으로. (제주 해녀들이 나를 안다. 물가 사람으로.)\n\n물가 사람이라는 말, 여기선 칭찬이야. 경계를 지키는 사람이라는 뜻이니까. 그 이름 잃지 마. 여기선 한번 잃으면 다시 얻기 어려워.',
        "…The wind, the right way. (The haenyeo of Jeju know me. As one of the water people.)\n\nOut here, being called that is praise. It means someone who keeps to the edge. Don't lose it. Here, once it's lost, it's hard to get back.",
      ],
    },
  },

  // ── N01-6 「막배를 놓친 남자」 · 바람 ──
  'N01-6': {
    offer: [
      d('stay_night', '같이 있을게요. 밤새 말동무 해 드리죠.', "I'll stay with him. I'll keep him company all night.",
        '그래. 결항 난 밤은 길어. 배가 안 뜨는 섬에선 시간도 안 가. (편의점 앞 플라스틱 의자를 하나 더 끌어다 놓는다.)\n\n아침에 배 뜨면 그 사람은 가. 그 전까지만 옆에 있어. 낚싯대 하나 들려 주고. 손이 바쁘면 걱정이 좀 덜어지거든.',
        "Right. A night of cancellations is long. On an island with no boats, time doesn't move either. (He drags one more plastic chair in front of the convenience store.)\n\nWhen the boat runs in the morning, he goes. Until then, just be beside him. Put a rod in his hands. Busy hands lighten worry a little.",
        { affinity: 0.05 }),
      d('ask_bag', '가방을요? 형님 쓰시던 거잖아요. 왜 저한테요?', "Your bag? You've been using it. Why give it to me?",
        '쓰던 거니까 주는 거야. 새 거는 아무나 줄 수 있어. (가방 끈을 한 번 털어 내 어깨에 걸어 준다.)\n\n왜냐고는 묻지 마. 아직은. 무게나 재 봐. 리어카보다 가볍지? 그거면 돼.',
        "I'm giving it because it's been used. Anyone can give a new one. (He shakes out the strap and hangs it on my shoulder.)\n\nDon't ask why. Not yet. Feel the weight. Lighter than a cart, isn't it? That's enough.",
        { affinity: 0.04, flag: 'choice.n01_6_asked_bag' }),
      d('ask_traveller', '그 출장객분은 어떤 사람인데요?', "What's this traveller like?",
        '짐이 많은 사람이야. 가방에 서류 봉투에. 육지에 급한 일이 있대. (편의점 안쪽을 턱으로 가리킨다. 창가에 넥타이를 푼 남자가 앉아 있다.)\n\n못 가. 오늘은 바다가 안 보내 줘. 그걸 받아들이는 데 하룻밤이 걸려. 그 밤을 같이 있어 주는 거야.',
        "A man with a lot of luggage. Bags, envelopes of papers. Something urgent on the mainland, he says. (He points his chin inside the store. A man with his tie loosened sits by the window.)\n\nHe can't go. The sea won't let him tonight. It takes a night to accept that. We keep him company through it.",
        { affinity: 0.03 }),
      d('me_too', '결항이면 저도 묶인 건데요. 저는 누가 같이 있어 줘요?', "If the ferry's cancelled, I'm stuck too. Who keeps me company?",
        '(담배를 꺼내다 멈추고 나를 본다.) 나. 오늘 밤은 나도 여기 있어.\n\n섬에 묶이는 게 나쁜 것만은 아니야. 갈 데가 없으면 있는 데를 보게 돼. 그 사람도, 너도. 의자 하나 더 가져와.',
        "(He stops halfway to taking out a cigarette and looks at me.) Me. I'm here tonight too.\n\nBeing stuck on an island isn't all bad. When there's nowhere to go, you start looking at where you are. Him, and you. Bring another chair.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('pay', '하룻밤 품삯은 받겠습니다. 가방은 감사히 쓰고요.', "I'll take the wage for the night. And I'll use the bag gratefully.",
        '그래. 리어카에. (서랍을 연다. 안에 든 게 전보다 적다.)\n\n밤새 남의 걱정 들어 준 값이야. 받아도 돼. 나는 이제 짐도 돈도 적어도 되니까. …그 얘긴 다음 항구에서.',
        "Right. In the cart. (He opens the drawer. There's less in it than before.)\n\nIt's the price of listening to someone's worries all night. You can take it. I can travel light now, on luggage and on money. …That talk can wait for the next harbour.",
        { payMult: 1, affinity: -0.02 }),
    ],
    completeReply: {
      why_less: [
        '…다음 항구에서 말해 줄게. 속초야. (가방 안주머니에 이름 없는 명찰이 하나 있다.)\n\n궁금하면 속초에서 다시 물어. 그때는 대답할게. 지금은 그 사람 배 떠나는 거나 보자. (명찰 이야기는 꺼내지 않는다.)',
        "…I'll tell you at the next harbour. Sokcho. (In the bag's inner pocket there's a name tag with no name on it.)\n\nIf you still want to know, ask me again in Sokcho. I'll answer then. For now let's just watch his boat go. (He doesn't mention the name tag.)",
      ],
      lesson: [
        '무거운 건 아래. 자주 쓰는 건 위. 그게 다야. (짐 관리가 손에 붙는다.)\n\n그리고 하나 더. 한 철 동안 안 쓴 건 빼. 아까워도. 짐은 사는 걸로 가벼워지지 않아. 내려놓는 걸로 가벼워져. 리어카 끌면서 그거 하나 배웠어.',
        "Heavy at the bottom. What you use often at the top. That's all of it. (Load management settles into my hands.)\n\nAnd one more thing. Anything you haven't used in a season, take it out. Even if it hurts. A load doesn't get lighter by buying. It gets lighter by setting things down. Pulling the cart taught me that much.",
      ],
      decline: [
        '…바람이 좋은 쪽으로. (울릉 사람들이 나를 안다.)\n\n그 사람이 배에 타면서 너를 한 번 돌아봤어. 봤지? 그게 하룻밤 값이야. 가방은 그냥 가져. 내 등보다 네 등에 더 오래 있을 거야.',
        "…The wind, the right way. (The people of Ulleung know me.)\n\nHe looked back at you once as he boarded. Did you see? That's the price of the night. Just keep the bag. It'll stay on your back longer than it did on mine.",
      ],
    },
  },

  // ── N01-7 「이름」 · 바람(여기서 처음 이름과 과거를 말한다) ──
  'N01-7': {
    offer: [
      d('keep_seat', '말씀해 주셔서 고맙습니다. 재개관식에 자리 꼭 마련할게요.', "Thank you for telling me. I'll make sure there's a seat for you at the reopening.",
        '자리는 끝자리면 돼. 문 가까운 데. (리어카 손잡이에서 손을 뗐다가 다시 잡는다.)\n\n서른 해 동안 어디에도 안 앉았어. 이번엔 앉아 볼게. 그 전에 하나만 같이 하자. 서른 해 전 그 자리에서, 한 마리.',
        "An end seat will do. Near the door. (He lets go of the cart handle, then takes hold of it again.)\n\nThirty years and I haven't sat down anywhere. This time I'll try. Before that, do one thing with me. In that spot from thirty years ago, one fish.",
        { affinity: 0.06 }),
      d('ask_families', '그 가족들은… 다 찾으셨어요?', "Those families… did you find them all?",
        '…그 얘긴 오늘 다 못 해. 서른 해 치야. (오래 말이 없다. 바람이 리어카 덮개를 들썩인다.)\n\n찾은 것보다 찾으러 다닌 게 길었다는 것만 알아 둬. 오늘은 그 자리에 가 보는 걸로 충분해.',
        "…I can't tell all that today. It's thirty years' worth. (He's quiet a long time. The wind lifts the cart's cover.)\n\nJust know the looking took longer than the finding. Today, going to that spot is enough.",
        { affinity: 0.05, flag: 'choice.n01_7_asked_families' }),
      d('ask_place', '서른 해 전 서 계셨던 자리요? 거기가 어딘데요?', "The spot where you stood thirty years ago? Where is it?",
        '따라와. 말로 하면 멀어. (리어카는 두고 걷는다. 그가 리어카 없이 걷는 걸 처음 본다.)\n\n서른 해 전에 거기 서 있었어. 오늘은 네가 던져. 나는 옆에 서 있을게. 그거면 돼.',
        "Follow me. It's further if I explain. (He leaves the cart and walks. It's the first time I've seen him walk without it.)\n\nThirty years ago I stood there. Today you cast. I'll stand beside you. That's all.",
        { affinity: 0.04, flag: 'choice.n01_7_asked_place' }),
      d('heavy_name', '그렇게 무거운 이름을 제가 들어도 되는 건가요?', "A name that heavy — is it all right for me to hear it?",
        '들어도 돼. 들을 사람이 필요했어. 처음 만난 날 네가 이름을 물었지. 바람이라고만 했고. 그 뒤로 너는 다시 안 물었어. (작게 웃는다.)\n\n그래서 너한테 말하는 거야. 이름은 무거워도 둘이 들면 좀 낫겠지.',
        "You may. I needed someone to hear it. The day we met you asked my name. I only said Baram. After that you never asked again. (A small smile.)\n\nThat's why I'm telling you. A name can be heavy, but it's a little easier with two carrying it.",
        { affinity: 0.06 }),
    ],
    completeAdd: [
      d('sashimi_table', '품삯은 받아서 재개관식 상에 회 한 접시 더 올리겠습니다.', "I'll take the wage and put one more plate of sashimi on the reopening table.",
        '…그래. 서랍에 남은 거 다 꺼내 가. 이제 리어카에 돈 넣어 둘 일도 없어. (서랍이 처음으로 빈다.)\n\n회 한 접시라. 좋네. 그 상에 앉을 사람들한테는 그게 제일 좋은 인사야.',
        "…All right. Take everything left in the drawer. There's no need to keep money in the cart any more. (For the first time, the drawer is empty.)\n\nA plate of sashimi. Good. For the people sitting at that table, that's the best greeting there is.",
        { payMult: 0.8, affinity: 0.04 }),
    ],
    completeReply: {
      name: [
        '…적어. 30년 만에 어딘가에 적히는 이름이야. (그가 리어카 열쇠를 준다. 이제 안 끈다고.)\n\n맨 끝에 적지 말고 중간쯤 적어. 아직 살아 있는 이름이니까. 리어카는 네가 알아서 해. 끌든 세워 두든. 다리는 이제 너한테 있어.',
        "…Write it. First time it's been written anywhere in thirty years. (He gives me the cart key. He won't be pulling it any more.)\n\nDon't write it at the very end. Somewhere in the middle. It's a name that's still alive. The cart's yours to decide. Pull it or park it. The legs are with you now.",
      ],
      lesson: [
        '한 항구에 하루. 사람 얼굴부터. (전국 항구 지도가 머릿속에 생긴다.)\n\n그리고 떠날 때는 인사하고 떠나. 바람처럼 왔다 가면 사람들이 얼굴을 못 외워. 너는 이름 있는 사람으로 다녀.',
        "One day per harbour. Faces first. (A map of every harbour in the country forms in my head.)\n\nAnd when you leave, say goodbye first. Come and go like the wind and people never learn your face. You go as someone with a name.",
      ],
      decline: [
        '…바람이 좋은 쪽으로. 마지막이야, 이 말. (전국 항구에서 바람이라는 이름 대신 내 이름이 돈다.)\n\n이제 그 말은 네가 해. 누가 한 마리로 매듭을 풀면 옆에서 한마디만. 바람이 좋은 쪽으로 불었다고. 그 말 하나면 사람이 하루를 버텨.',
        "…The wind, the right way. That's the last time I say it. (Around the country, my name goes round instead of Baram's.)\n\nFrom now on, you say it. When someone undoes a knot with one fish, just one word beside them. The wind blew the right way. One line like that gets a person through a day.",
      ],
    },
  },

  // ── N02-1 「부러진 대」 · 탁만수 ──
  'N02-1': {
    offer: [
      d('fathers_rod', '아버지 대입니다. 잘 부탁드립니다.', "It was my father's rod. Please look after it.",
        '부탁은 대한테 해라. 대가 말을 해야 나도 안다. (대를 받아 마디마다 엄지를 굴려 본다.)\n\n오래 걸린다. 옆에서 기웃거리면 더 걸리고. 나가서 새벽이나 상대해 줘. 그 애 내기는 장난이 아니다.',
        "Ask the rod, not me. The rod has to speak before I know anything. (He takes it and rolls his thumb along each section.)\n\nThis takes a while. Longer if you hover. Go out and keep Saebyeok busy. That boy doesn't joke about his bets.",
        { affinity: 0.05 }),
      d('ask_saebyeok', '새벽이요? 손주분이세요?', "Saebyeok? Is that your grandson?",
        '손주다. 열두 살. 대를 나보다 잘 본다고 우기는 놈이지. …틀린 말도 아니고. (공방 밖 방파제 쪽으로 턱짓을 한다.)\n\n지금쯤 방파제 끝에서 학꽁치 떼 기다리고 있을 거다. 내기 걸면 받아 줘. 안 받으면 하루 종일 쫓아다닌다.',
        "Grandson. Twelve. Insists he reads a rod better than I do. …Not that he's wrong. (He jerks his chin toward the breakwater outside.)\n\nBy now he'll be at the end of the breakwater waiting for the halfbeak. If he offers a bet, take it. Refuse and he'll follow you around all day.",
        { affinity: 0.04, flag: 'choice.n02_1_asked_saebyeok' }),
      d('ask_damage', '많이 상했습니까? 다시 쓸 수는 있겠습니까?', "Is it badly damaged? Will I be able to use it again?",
        '봐야 안다. 대는 겉이 멀쩡해도 속에서 운다. (마디 하나에 손톱을 대고 톡 쳐 본다. 표정이 잠깐 굳는다.)\n\n버릴 대는 아니다. 그건 지금도 안다. 나머지는 시간을 줘. 대가 오래 산 만큼 보는 데도 시간이 걸린다.',
        "Can't say till I've looked. A rod can be sound outside and crying inside. (He taps one section with a fingernail. His face sets for a moment.)\n\nIt's not one to throw away. That much I know already. Give me time for the rest. The longer a rod has lived, the longer it takes to read.",
        { affinity: 0.03 }),
      d('bet_kid', '열두 살하고 내기요? 제가 이기면 좀 미안할 텐데요.', "A bet with a twelve-year-old? I'd feel bad beating him.",
        '(코로 짧게 웃는다.) 미안할 일은 없을 거다. 그 애는 방파제에서 컸어. 학꽁치 떼 들어오는 걸 나보다 먼저 본다.\n\n지기 싫으면 채비는 얕게, 목줄은 가늘게. 학꽁치는 물 위에 떠서 다니고 입이 작아. 그거 모르고 덤비면 그 애가 웃는다.',
        "(A short laugh through his nose.) You won't need to feel bad. That boy grew up on the breakwater. He sees the halfbeak coming in before I do.\n\nIf you don't want to lose, fish shallow and use a fine leader. Halfbeak ride near the surface and their mouths are small. Charge in without knowing that and he'll laugh at you.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('no_fee', '대를 봐 주신 걸로 됐습니다. 심부름값은 넣어 두세요.', "Looking at the rod was enough. Keep the errand money.",
        '…그런 말은 대가 다 나은 다음에 해라. 아직 하나 울고 있다. (그래도 꺼내던 돈을 도로 넣는다.)\n\n지나가다 들러. 그 대 소리 한 번 더 들어 보자. 새벽이도 네가 또 오면 좋아할 거다.',
        "…Say that once the rod's fully mended. One section's still crying. (Even so, he puts back the money he was taking out.)\n\nDrop in when you're passing. Let's hear that rod again. Saebyeok will be glad to see you back too.",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      take_rod: [
        '싼 거다. 그래도 대는 대야. 부러지면 가져와. (구석에서 짧은 대 하나를 꺼내 준다.)\n\n구멍치기는 짧은 대가 낫다. 테트라포드 틈에 넣고 줄만 내리면 돼. 고기 무게는 손목으로 느껴라. 비싼 대보다 그게 먼저다.',
        "It's cheap. A rod's a rod, though. Bring it back if it breaks. (From a corner he pulls out a short rod.)\n\nShort is better for hole fishing. Poke it into the gaps in the tetrapods and just drop the line. Feel the fish's weight through your wrist. That comes before any expensive rod.",
      ],
      pay: [
        '그러지. 노인 심부름값이다. (돈을 세는 손이 대를 만지던 손과 다르다.)\n\n돈은 돈이고 대는 대다. 섞으면 둘 다 흐려진다. 그 대, 바다에서 많이 써라. 쓰는 대가 오래 산다.',
        "I will. An old man's errand money. (The hand that counts the notes is not the hand that touched the rod.)\n\nMoney is money and a rod is a rod. Mix them and both go cloudy. Use that rod a lot at sea. A rod that's used lives long.",
      ],
    },
  },

  // ── N02-2 「왕대를 찾아서」 · 탁만수 ──
  'N02-2': {
    offer: [
      d('bring_him', '제가 다녀오겠습니다. 꼭 데리고 오겠습니다.', "I'll go. I'll bring him back, I promise.",
        '억지로 끌고 오지는 마라. 그러면 또 간다. (공방 문간에 서서 바다 쪽을 한참 본다.)\n\n그 애가 오고 싶을 때 같이 와. 왕대를 찾았으면 메고 오게 두고. 못 찾았으면… 같이 찾아 줘라. 빈손으로 오면 그 애는 자기가 진 줄 안다.',
        "Don't drag him back. He'll only go again. (He stands in the workshop doorway looking toward the sea a long while.)\n\nCome back when he wants to come. If he's found his culm, let him carry it home. If he hasn't… help him look. If he comes back empty-handed, he'll think he lost.",
        { affinity: 0.06 }),
      d('ask_wangdae', '왕대가 뭔데 거기까지 갔습니까?', "What's a wangdae, that he went all that way?",
        '굵고 마디 긴 대나무다. 좋은 왕대 하나면 대가 여러 대 나와. 대 깎는 놈들은 한 번은 그걸 찾아 나선다.\n\n그 애도 그때가 온 거지. 내 허락 없이. (말끝을 흐린다.) 대나무 숲에서 마디 두드리는 소리가 나면 거기 있다.',
        "Thick bamboo with long sections. One good culm gives you several rods. Everyone who carves rods goes looking for one, once.\n\nHis time's come, that's all. Without my say-so. (His voice trails off.) If you hear someone tapping nodes in a bamboo grove, that's him.",
        { affinity: 0.04, flag: 'choice.n02_2_asked_wangdae' }),
      d('why_not_you', '직접 가시면 안 됩니까? 할아버지가 가시면 올 텐데요.', "Couldn't you go yourself? He'd come back for his grandpa.",
        '내가 가면 안 온다. 그 애 고집은 내 고집이야. 둘이 마주 서면 둘 다 안 굽혀. (목소리가 낮아진다.)\n\n너는 그 애 내기 상대잖아. 너한테는 지고도 웃는 놈이다. 그러니까 네가 가. 나는 여기서 대 손질하면서 기다리마.',
        "If I go, he won't come. His stubbornness is my stubbornness. Face to face, neither of us bends. (His voice drops.)\n\nYou're his betting partner. He can lose to you and still laugh. So you go. I'll wait here, working on rods.",
        { affinity: 0.04 }),
      d('where_taean', '태안 어디쯤입니까? 대나무 숲이 한두 곳이 아닐 텐데요.', "Where in Taean? There must be more than one bamboo grove.",
        '갯벌 가까운 숲부터 가 봐. 낚시하는 놈이 대 찾으러 가면 바다를 등지고는 못 간다.\n\n가서 귀를 열어. 대나무 숲에서 톡톡 소리 나면 그 애다. 아무 대나 안 베는 놈이야. 다 두드려 보고 고른다.',
        "Start with the groves near the mudflats. A boy who fishes can't turn his back on the sea, even hunting bamboo.\n\nGo and open your ears. Tapping in a bamboo grove, that's him. He doesn't cut just any culm. He taps every one before he chooses.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('say_word', '새벽이 깨면 왕대 잘 골랐다고 한마디만 해 주십시오.', "When Saebyeok wakes, just tell him he chose a good culm.",
        '…한마디. (오래 말이 없다.) 말로 하는 건 내 쪽이 서툴다.\n\n대신 그 왕대, 내가 직접 말려 주마. 그늘에서 천천히. 그 애는 그걸 보고 알 거다. 그 애도 말보다 손을 먼저 보니까.',
        "…One word. (He's silent a long time.) Saying things is where I'm clumsy.\n\nInstead I'll dry that culm myself. In the shade, slowly. He'll see that and understand. He looks at hands before words too.",
        { affinity: 0.07, flag: 'choice.n02_2_asked_word' }),
    ],
    // `decline`은 원문에 개발 용어(「우호도」)가 있어 늘리지 않는다 — 머리 주석.
    completeReply: {
      lesson: [
        '그건 내가 가르친 거야. …그래, 그 애가 더 잘 들어. (왕대 고르는 귀가 생긴다.)\n\n귀는 나이 먹으면 먼저 닳는다. 그래서 그 애한테 넘겨 준 거야. 너도 들었으면 이제 둘이다. 내 귀가 없어도 공방은 돌아가겠구나.',
        "I taught him that. …All right, he hears it better than I do. (I get an ear for choosing culms.)\n\nEars are the first thing age wears down. That's why I passed it to him. If you heard it too, that makes two. The workshop will run even without my ears, then.",
      ],
      pay: [
        '그러지. 노인 심부름값. (지폐를 세는 손이 떨린다. 안도다.)\n\n그 애 데려온 건 돈으로 못 치른다. 그건 나도 안다. 받을 건 받아. 그래야 내가 덜 미안하다.',
        "You will. An old man's errand money. (His hand shakes counting the notes. Relief.)\n\nBringing the boy back can't be paid for in money. I know that much. Take what's yours. Then I'll feel a little less in your debt.",
      ],
    },
  },

  // ── N02-3 「돌무덤의 주인」 · 탁새벽 ──
  'N02-3': {
    offer: [
      d('hold_on', '좋아. 네 대 믿고 끝까지 버텨 볼게.', "All right. I'll trust your rod and hold on to the end.",
        '끝까지야. 중간에 드랙 다 풀어 버리면 안 돼. (대를 내밀다가 손잡이를 한 번 더 닦는다.)\n\n바닥으로 박힐 때 조이고, 떠오를 때 풀어. 그거 반복이야. 팔 아파도 참아. 대는 안 부러져. 내가 그렇게 깎았어.',
        "To the end. Don't go letting the drag right off halfway. (He holds out the rod, then wipes the grip once more.)\n\nTighten when it dives for the bottom, ease off when it comes up. Over and over. Even if your arms hurt, hang on. The rod won't break. I carved it that way.",
        { affinity: 0.05 }),
      d('ask_mound', '돌무덤의 주인? 그게 무슨 소리야?', "The owner of the stone mound? What's that supposed to mean?",
        '바닥에 돌이 무덤처럼 쌓인 데가 있어. 거기 사는 제일 큰 놈. 걸리면 돌 사이로 파고들어서 다들 줄만 끊기고 와. 그래서 주인이야.\n\n그러니까 내 대로 꺼내면… (말을 멈추고 씩 웃는다.) 그다음은 아저씨가 상상해.',
        "There's a spot on the bottom where rocks are piled up like a burial mound. The biggest one living there. Once it's hooked it bores in among the rocks and everyone comes back with a cut line. That's why it's the owner.\n\nSo if my rod brings it up… (He stops and grins.) You can imagine the rest, Mister.",
        { affinity: 0.04, flag: 'choice.n02_3_asked_mound' }),
      d('grandpa_knows', '할아버지는 이 시험 알고 계셔?', "Does your grandpa know about this test?",
        '…몰라. 말 안 했어. 말하면 또 얇다고 할 거야. (발끝으로 바닥을 찬다.)\n\n80 넘는 거 올리고 나서 말할 거야. 숫자로. 숫자는 할아버지도 못 깎아. 그러니까 아저씨가 꼭 올려 줘.',
        "…He doesn't. I didn't tell him. If I did he'd just say thin again. (He scuffs the ground with his toe.)\n\nI'll tell him after we land one over eighty. In numbers. Not even Grandpa can whittle down a number. So you have to land it.",
        { affinity: 0.04 }),
      d('my_arm', '80센티 넘는 놈이면 대보다 내 팔이 먼저 부러지겠다.', "Anything over eighty and my arm'll snap before your rod does.",
        '(웃는다.) 팔은 안 부러져. 아프기만 해. 아픈 건 지나가는데 놓친 건 안 지나가. 할아버지가 그랬어.\n\n대구는 처음에 세게 박고 나면 힘이 빠져. 첫 번째만 버텨. 그다음은 대가 해. 내 대를 믿어.',
        "(He laughs.) Your arm won't snap. It'll just hurt. Pain passes, but the one that got away doesn't. Grandpa says so.\n\nA cod dives hard at first and then it tires. Just hold out through the first run. After that the rod does the work. Trust my rod.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('eat_together', '용돈은 넣어 둬. 이 대구는 할아버지랑 같이 먹자.', "Keep your pocket money. Let's eat this cod with your grandpa.",
        '…같이? 할아버지랑? (대구를 내려다보다가 고개를 끄덕인다.)\n\n좋아. 밥 먹으면서 아저씨가 말해. 이거 내 대로 올렸다고. 나는 옆에서 먹기만 할게. 내가 말하면 자랑 같잖아.',
        "…Together? With Grandpa? (He looks down at the cod, then nods.)\n\nOkay. Over dinner, you tell him. That it came up on my rod. I'll just sit there eating. If I say it, it sounds like bragging.",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      praise: [
        '아저씨가? …응. 그래 줘. (대나무 한 마디를 준다. 첫 대 마디라고.)\n\n얇다는 소리 들은 그 대에서 자른 거야. 이제 그 소리 안 들어도 돼. 아저씨가 증인이니까. 잃어버리면 안 돼.',
        "You will? …Yeah. Please. (He gives me a length of bamboo. From his first rod, he says.)\n\nCut from the rod they called thin. I don't have to hear that any more. You're my witness. Don't lose it.",
      ],
      lesson: [
        '그건 할아버지가… 아니, 나도 알아. 바닥 소리 들릴 때. (드랙 제어가 손에 붙는다.)\n\n줄이 돌에 닿으면 대 끝이 드르륵 떨어. 그게 바닥 소리야. 그때 조여야 돼. 늦으면 돌에 감기고. 할아버지한테 말로만 들었는데, 오늘 아저씨 대 끝 보고 진짜로 알았어.',
        "That's grandfather's— no. I know it too. When you can hear the bottom. (Drag control settles into my hands.)\n\nWhen the line touches rock, the rod tip judders. That's the bottom talking. That's when you tighten. Too late and it wraps the rock. I'd only heard Grandpa say it, but watching your rod tip today, I really got it.",
      ],
      pay: [
        '…용돈 다 줄게. (진지하다. 받아야 한다.)\n\n약속은 약속이야. 시험 낚시 시켰으면 값은 줘야 돼. …대신 할아버지한테는 아저씨가 공짜로 해 줬다고 해. 용돈 다 쓴 거 알면 혼나.',
        "…I'll give you all my pocket money. (He's serious. I have to take it.)\n\nA promise is a promise. If I asked for test fishing, I have to pay. …But tell Grandpa you did it for free. If he finds out I spent all my pocket money, I'm in trouble.",
      ],
    },
  },

  // ── N02-4 「마지막 죽간」 · 탁새벽 ──
  'N02-4': {
    offer: [
      d('alive_again', '…고맙다. 아버지 대가 다시 살았네.', "…Thank you. Dad's rod is alive again.",
        '응. 살았어. 마디 하나 새로 들어갔지만 그래도 아저씨 아버지 대야. (대를 두 손으로 받쳐 든다. 손이 조금 떨린다.)\n\n근데 아직 다 끝난 거 아니야. 마지막 손질은 같이 하자. 아저씨 손도 들어가야 돼. 그래야 진짜 아저씨 대지.',
        "Yeah. It's alive. There's a new section in it, but it's still your father's rod. (He holds it up in both hands. They shake a little.)\n\nBut it's not completely done yet. Let's do the last finishing together. Your hands have to go into it too. Then it's really yours.",
        { affinity: 0.06 }),
      d('ask_letgo', '할아버지가 손을 놓으셨다고? 그게 무슨 뜻이야?', "Your grandpa let go? What do you mean?",
        '이번 대는 처음부터 끝까지 내가 하래. 할아버지는 구석에서 보기만 했어. 진짜로 한마디도 안 했어.\n\n…처음엔 화났나 했는데 아니래. 손 놓는 것도 일이래. 무슨 말인지 아직 잘 모르겠어. 아저씨는 알아?',
        "He said this rod was mine to do, start to finish. Grandpa just watched from the corner. Honestly, not a single word.\n\n…At first I thought he was angry, but he says no. Letting go is work too, he says. I still don't really get it. Do you?",
        { affinity: 0.05, flag: 'choice.n02_4_asked_letgo' }),
      d('ask_joint', '이음새가 정말 안 보이네. 어떻게 한 거야?', "You really can't see the joint. How did you do it?",
        '열 번 넘게 깎다 버렸어. 마디 소리가 안 맞으면 다시. (손바닥에 굳은살이 박여 있다.)\n\n안 보이게 하고 싶었어. 아저씨가 들 때마다 부러졌던 데가 생각나면 안 되잖아. 어떻게 했는지는… 다 받고 나서 가르쳐 줄게.',
        "I carved and threw away more than ten. If the sections didn't sound right, start again. (His palms are thick with calluses.)\n\nI wanted it invisible. You shouldn't think of where it broke every time you pick it up. How I did it… I'll teach you once you've taken it.",
        { affinity: 0.05 }),
      d('scared_to_cast', '독도에서? 너무 귀한 대라 던지기가 겁나는데.', "At Dokdo? It's so precious I'm scared to cast it.",
        '겁내면 안 돼! 대는 던지라고 만드는 거야. 벽에 걸면 죽어. (대를 내 손에 억지로 쥐여 준다.)\n\n부러지면 또 고치면 돼. 이제 고칠 줄 아는 사람이 둘이야. 아니, 아저씨까지 셋.',
        "You can't be scared! Rods are made to be cast. Hang one on a wall and it dies. (He pushes the rod into my hands.)\n\nIf it breaks we fix it again. There are two people who know how now. No, three, counting you.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('first_fish', '값은 안 받을게. 이 대로 올린 첫 마리, 너한테 먼저 보여 줄게.', "I won't take money. The first fish on this rod — you'll see it before anyone.",
        '…진짜? 제일 먼저? (대 손잡이를 한 번 더 쓰다듬는다.)\n\n그럼 나 독도까지 따라갈 거야. 안 된다고 해도. 할아버지한테는 내가 말해 줄게. 할아버지는 또 아무 말 안 하겠지만.',
        "…Really? Before anyone? (He strokes the grip one more time.)\n\nThen I'm coming all the way to Dokdo. Even if you say no. I'll tell Grandpa myself. He won't say anything again, though.",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      both: [
        '…응. 할아버지 손이랑 내 손이랑 아저씨 아버지 손. (노인이 구석에서 처음으로 웃는다.)\n\n그리고 아저씨 손. 아저씨도 같이 손봤잖아. 그러니까 네 사람이야. 이 대 부러지면 네 사람이 다 슬퍼해야 돼. 그러니까 부러뜨리지 마.',
        "…Yeah. Grandfather's and mine. And your father's. (In the corner the old man smiles for the first time.)\n\nAnd yours. You worked on it with me. So that's four people. If this rod breaks, four people have to be sad. So don't break it.",
      ],
      lesson: [
        '결을 맞춰. 마디랑 마디. (로드 빌딩 최종 요령이 손에 붙는다.)\n\n결이 엇갈리면 휠 때 거기서 꺾여. 겉에 칠을 아무리 해도 속은 못 속여. 그래서 백 번 맞춰 보고 한 번 붙이는 거야. 할아버지는 이걸 오십 년 했대.',
        "Match the grain. Section to section. (The last of the rod-building know-how settles into my hands.)\n\nIf the grain crosses, it snaps right there when it bends. No amount of varnish fools the inside. So you fit it a hundred times and glue it once. Grandpa says he's done this for fifty years.",
      ],
      pay: [
        '…장인. 나? (진지하게 값을 부른다. 노인이 구석에서 고개를 젓는다. 반값이라며.)\n\n반값? 할아버지! …알았어, 반값. 대신 장인이라고 불러 준 거, 그게 나머지 반이야. 그 말은 처음 들었거든.',
        "…Craftsman. Me? (He names a price, seriously. The old man shakes his head in the corner. Half, he says.)\n\nHalf? Grandpa! …Fine, half. But you calling me a craftsman, that's the other half. Nobody's ever called me that before.",
      ],
    },
  },

  // ── N03-1 「선생님」 · 강두철(아직 채비 못 묶는 초보 노인) ──
  'N03-1': {
    offer: [
      d('sit_untangle', '제가 풀어 드릴게요. 옆에 앉겠습니다.', "Let me undo it for you. I'll sit with you.",
        '고맙네, 고마워. 이게 원줄이고 이게 목줄이라는 것까진 알겠는데 그다음부터는 영 모르겠어. (엉킨 실뭉치를 두 손으로 받쳐 내민다.)\n\n천천히 하게. 나는 급할 게 없는 사람이야. 젊은이 손 구경이나 하지. 늙으면 남의 손 보는 게 낙이거든.',
        "Thank you, thank you. I know this is the main line and this is the leader, but past that I'm lost. (He holds out the tangled ball in both hands.)\n\nTake your time. I'm in no hurry. I'll just watch your hands, young man. When you're old, watching other people's hands is a pleasure.",
        { affinity: 0.05 }),
      d('ask_knot', '어떤 매듭으로 묶으셨어요? 처음부터 다시 묶는 게 낫겠는데요.', "What knot did you use? It might be better to tie it again from scratch.",
        '매듭 이름 같은 걸 내가 아나. 책에 나온 대로 돌리고 감았지. (허허 웃으며 머리를 긁는다. 손바닥 굳은살이 두껍다.)\n\n다시 묶는 게 낫다면 그렇게 하세. 대신 천천히 보여 주게. 늙은이 눈이 따라갈 수 있게. 한 번 보면 잊어도 두 번 보면 남겠지.',
        "What would I know about knot names? I twisted and wrapped it the way the book said. (He laughs and scratches his head. The calluses on his palm are thick.)\n\nIf retying's better, let's do that. Only show me slowly. So an old man's eyes can keep up. If I forget it after once, maybe it'll stick after twice.",
        { affinity: 0.04, flag: 'choice.n03_1_asked_knot' }),
      d('ask_first_time', '낚시는 처음이시라고요? 어쩌다 시작하셨어요?', "This is your first time fishing? What got you started?",
        '허허, 그게… 평생 바다 일 언저리에서 살았는데, 이렇게 혼자 방파제에 앉아 보는 건 처음이야. (먼 바다를 보며 말끝을 흐린다.)\n\n이 나이 되니 앉아 보고 싶어지더군. 그래서 배우는 중이야. 자, 이 실부터 좀 봐 주게.',
        "Ha, well… I've lived on the fringes of sea work all my life, but sitting alone on a breakwater like this is a first. (He trails off, looking out to sea.)\n\nAt my age you start wanting to sit for once. So I'm learning. Now, take a look at this line for me.",
        { affinity: 0.04 }),
      d('knitting', '이건 엉킨 게 아니라 거의 뜨개질인데요.', "This isn't a tangle, it's practically knitting.",
        '허허! 뜨개질이라. 그 말 맞네. 한 시간을 감고 돌렸더니 이 모양이야. (껄껄 웃으며 실뭉치를 내 무릎에 얹는다.)\n\n이것도 재주라면 재주지. 엉키게 하는 재주. 풀어 주는 재주는 젊은이한테 있는 것 같으니 맡기겠네.',
        "Ha! Knitting. You're right. I wound and twisted for an hour and this is what came of it. (He laughs heartily and sets the ball on my knee.)\n\nIt's a talent of sorts. A talent for tangling. The talent for untangling seems to be yours, young man, so I'll leave it to you.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('no_fee', '가르친 값은 됐습니다. 첫 고기 보신 걸로 충분합니다.', "No need to pay for the lesson. Seeing your first fish is enough.",
        '허허, 이거 참. 선생님이 욕심이 없으시구먼. (꺼내던 지갑을 도로 넣는다. 그 손이 잠깐 머뭇거린다.)\n\n그럼 다음에 또 옆에 앉아 주게. 늙은이 낚시는 아직 갈 길이 멀어. 이 방파제 끝, 내 옆자리는 비워 두지.',
        "Ha, well now. My teacher isn't a greedy sort. (He puts away the wallet he'd taken out. His hand hesitates a moment.)\n\nThen sit with me again sometime. This old man has a long way to go at fishing. The spot beside me at the end of this breakwater, I'll keep it free.",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      knot_lesson: [
        '선생님이 학생한테 배우는 날도 있는 거지. 자, 이렇게. (손놀림이 지나치게 빠르다.)\n\n어, 어… 이게 아닌가? 허허, 늙은이가 흉내만 낸 거야. 선생님 손을 보고 따라 했더니 손이 먼저 가는구먼. (줄을 다시 헝클어 놓는다. 일부러인 것 같기도 하다.)',
        "There are days a teacher learns from a student. Here — like this. (Her hands move far too fast.)\n\nOh — oh… is that not it? Ha, the old man was only copying. I watched your hands and mine just ran ahead. (He tangles the line up again. It almost looks deliberate.)",
      ],
      pay: [
        '그러세. 늙은이 가르쳐 준 값. (지갑이 두껍다.)\n\n받게, 받아. 값을 치른 가르침이 오래 남는 법이야. (지폐 한 장을 더 얹는다.) 오늘 선생님 덕에 고기 얼굴을 봤으니 그 값까지.',
        "Right you are. Payment for teaching an old man. (His wallet is thick.)\n\nTake it, take it. A lesson you've paid for stays with you longer. (He lays one more note on top.) And that's for showing me a fish's face today.",
      ],
      point: [
        '…허, 눈치도 배웠구나. 가져가. (수첩 뒷장 한 페이지가 유난히 정갈하다.)\n\n초보가 뭘 적었겠나. 선생님이 한 말 받아 적은 거지. 그러니 그거 원래 선생님 거야. 돌려주는 것뿐이네. 허허.',
        "…Ha. You've picked up an eye as well. Take it. (One page at the back of the notebook is unusually neat.)\n\nWhat would a beginner write? Only what you told me. So it was yours to begin with. I'm just giving it back. Ha.",
      ],
    },
  },

  // ── N03-2 「조합장님」 · 강두철(정체가 드러난 편) ──
  'N03-2': {
    offer: [
      d('answer_fishing', '대답은 낚시하면서 드리겠습니다. 전갱이부터 잡으시죠.', "I'll give you my answer while we fish. Let's catch some horse mackerel first.",
        '허허, 그게 좋겠네. 교육장 앞바다에 전갱이가 붙는다더군. 아니, 붙어. 이제 아는 척해도 되겠지. (멋쩍게 웃는다.)\n\n천천히 생각하게. 대답 재촉하는 조합장은 표결도 재촉하는 법이야. 나는 그런 사람은 되기 싫어.',
        "Ha, that'd be best. I hear horse mackerel gather off the course. No — they do. I suppose I can stop pretending now. (He laughs awkwardly.)\n\nThink it over slowly. A chairman who rushes an answer rushes votes too. I don't want to be that sort.",
        { affinity: 0.04 }),
      d('ask_coop', '조합장이시면… 수협 조합장 말씀이세요?', "Chairman… you mean of the fisheries co-op?",
        '그래. 이 바닷가 어촌계들이 모인 수협의 조합장이야. 위판장도 수협이 열지. (명함을 꺼냈다가 도로 넣는다.)\n\n그런 사람이 방파제에서 매듭 못 묶는 척을 했으니 할 말이 없네. 그래도 그날 엉킨 실은 진짜였어. 그건 믿어 주게.',
        "Yes. Chairman of the fisheries co-op the village guilds along this coast belong to. The auctions run under the co-op too. (He takes out a business card, then puts it back.)\n\nAnd a man like that pretended he couldn't tie a knot on the breakwater, so I've nothing to say for myself. But the tangle that day was real. Believe that much.",
        { affinity: 0.03, flag: 'choice.n03_2_asked_coop' }),
      d('why_pretend', '왜 초보인 척하셨어요? 저를 시험하신 겁니까?', "Why pretend to be a beginner? Were you testing me?",
        '시험은 무슨. (손을 내젓는다.) 조합장이라고 하면 다들 허리부터 굽혀. 채비를 물어도 정답 대신 듣기 좋은 말을 하지.\n\n그날 자네는 내가 누군지 몰랐고, 그래서 진짜로 가르쳐 줬어. 그게 듣고 싶었어. 미안하네. 그게 다야.',
        "Testing? Hardly. (He waves a hand.) Say you're the chairman and everyone bows first. Ask about rigs and they tell you what you'd like to hear, not what's right.\n\nThat day you didn't know who I was, so you taught me for real. That's what I wanted to hear. I'm sorry. That's all.",
        { affinity: 0.05 }),
      d('hurt', '솔직히 좀 서운합니다. 저만 모르고 있었네요.', "Honestly, I'm a little hurt. I was the only one who didn't know.",
        '서운할 만하지. 화를 내도 할 말이 없네. (모자를 벗어 손에 쥔다.)\n\n대답은 천천히 하게. 전갱이 두 마리 낚는 동안 생각해 보고. 거리를 두겠다 해도 그건 자네 몫이야. 나는 그 대답을 받을 자격밖에 없네.',
        "You've every right to be. Even if you got angry I'd have no answer. (He takes off his cap and holds it.)\n\nTake your time answering. Think it over while you catch two horse mackerel. If you want to keep your distance, that's yours to decide. All I'm entitled to is the answer.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('market_eye', '이번엔 어르신이 가르쳐 주십시오. 위판장 보는 눈부터요.', "This time you teach me. Starting with how to read an auction floor.",
        '허허, 선생이 학생한테 배우겠다? 좋네. 하나만 알려 주지. (교육장 창밖으로 보이는 위판장을 가리킨다.)\n\n경매 전에 상자부터 보게. 얼음이 어떻게 덮였는지, 고기가 어느 쪽으로 누웠는지. 중매인들은 그걸로 값을 매겨. 말은 그다음이야.',
        "Ha, the teacher wants lessons from the student? Good. Just one thing, then. (He points through the classroom window at the auction floor.)\n\nBefore the bidding, look at the boxes. How the ice is laid over them, which way the fish are lying. That's what the brokers price on. Talk comes after.",
        { proficiency: { category: 'economy', xp: 25 }, affinity: 0.05 }),
    ],
    completeReply: {
      teach_on: [
        '…허. 그 말 듣고 싿었네. (수협 조합장이 내 채비를 배운다는 소문이 항구에 돈다.)\n\n조합장 자리에 앉으면 다들 내게 답을 가져와. 질문을 가져오는 사람은 없지. 자네는 내게 숙제를 줘. 그게 좋아. 다음 숙제는 뭔가, 선생님.',
        "…Ha. I've been wanting to hear that. (Word goes round the harbour that the co-op chairman is learning rigs from me.)\n\nIn the chairman's seat, everyone brings me answers. Nobody brings questions. You give me homework. I like that. What's the next assignment, teacher?",
      ],
      distance: [
        '…그럴 만하지. 그래도 방파제에선 인사는 하세. (인사는 한다. 그 이상은 아직.)\n\n속인 건 나니까 거리는 자네가 정하게. 다만 언젠가 그 거리가 좁혀지면, 그때는 처음부터 내 이름으로 앉겠네. 초보 행세 없이.',
        "…Fair enough. We'll still say hello on the breakwater. (We say hello. Nothing more yet.)\n\nI'm the one who lied, so you set the distance. But if it ever closes, I'll sit down under my own name from the start. No beginner act.",
      ],
      joke: [
        '허허. 매듭 푸는 연기가 제일 어려웠어. (웃음이 터진다. 소개장을 하나 써 준다.)\n\n손이 저절로 풀려고 해서 혼났네. 그 소개장은 연기 값이 아니라 웃어 준 값이야. 화낼 자리에서 웃어 주는 사람은 귀하거든.',
        "Ha. Pretending I couldn't undo a knot was the hardest part. (He bursts out laughing, then writes me a letter of introduction.)\n\nMy hands kept trying to undo it on their own. That letter isn't for the act, it's for the laugh. Someone who laughs where they could be angry is rare.",
      ],
    },
  },

  // ── N03-3 「도장」 · 강두철 ──
  'N03-3': {
    offer: [
      d('my_vote', '알겠습니다. 어느 쪽에 손을 들지는 제가 정하겠습니다.', "Understood. Which way I raise my hand is mine to decide.",
        '그거면 돼. 내가 바라는 건 그것뿐이야. (도장 주머니를 꺼냈다가 다시 넣는다.)\n\n표결 전까지 위판 실적이나 쌓아 두게. 총회는 말 잘하는 사람보다 바다에 자주 나간 사람 말을 더 들어. 그건 내가 도와줄 수 없는 일이야.',
        "That's all I need. That's all I want. (He takes out the pouch with his seal, then puts it back.)\n\nBuild up your auction record before the vote. A general meeting listens to the one who's out at sea most, not the one who talks best. That's something I can't help you with.",
        { affinity: 0.05 }),
      d('ask_seal', '그 도장으로 뭘 하시는데요?', "What do you use that seal for?",
        '조합 일 마무리는 다 이걸로 하지. 서류 맨 끝에 이게 찍혀야 일이 끝나. (인주가 마른 도장을 손바닥에 굴린다.)\n\n그래서 무서운 거야. 이게 찍히면 반대한 사람 말도 다 덮여. 이번 표결엔 안 찍어. 찍지 않는 도장도 있는 법이야.',
        "Every piece of co-op business ends with this. Until it's stamped at the bottom of the paper, nothing's finished. (He rolls the seal, its red ink long dry, in his palm.)\n\nThat's what makes it frightening. Once it's stamped, even the people who objected get buried under it. I won't stamp this vote. Some seals stay unstamped.",
        { affinity: 0.04, flag: 'choice.n03_3_asked_seal' }),
      d('why_not', '조합장님이 표결에 끼면 왜 안 되는 겁니까?', "Why mustn't a chairman get involved in the vote?",
        '어촌계는 마을이 바다를 나눠 쓰는 자리야. 수협은 그 위에서 돈과 위판을 맡고. 위에 있는 사람이 손을 얹으면 아래 사람들 손은 못 올라가.\n\n찬성이든 반대든 자기 손으로 들어야 표야. 내가 한마디 하면 그건 내 표가 돼. 그러니 입 다무는 게 내 일이지.',
        "The fishing guild is where a village shares out its sea. The co-op sits above it, handling money and auctions. When someone above lays a hand on it, the hands below can't go up.\n\nFor or against, it's only a vote if you raise your own hand. If I say one word, it becomes my vote. So keeping my mouth shut is my job.",
        { affinity: 0.04 }),
      d('just_tell', '솔직히 한마디 해 주시면 편할 텐데요. 어느 쪽이 맞습니까?', "Honestly, it'd be easier if you just said. Which side is right?",
        '(고개를 젓는다.) 그 질문에 대답하는 순간 나는 조합장이 되고 자네는 학생이 돼. 우리 사이가 거꾸로 가는 거지.\n\n편한 길은 늘 남한테 묻는 길이야. 자네는 선생이잖나. 선생은 어려운 길로 가는 사람이야. 허허, 내가 할 말은 아니지만.',
        "(He shakes his head.) The moment I answer that, I become the chairman and you become the student. We'd be running backwards.\n\nThe easy road is always asking someone else. You're the teacher, aren't you? A teacher takes the hard road. Ha, not that I'm one to talk.",
        { affinity: 0 }),
    ],
    completeAdd: [
      d('asked_side', '어르신은 어느 쪽에 손을 드셨을지, 그래도 궁금합니다.', "I still wonder which way you'd have raised your hand.",
        '허허, 그건 도장이랑 같이 넣어 두게. (끝내 대답하지 않는다.)\n\n내가 말하면 자네가 든 손이 맞았는지 재게 되잖나. 재지 마. 자네 손은 자네 거였어. 그거면 표결은 제 할 일을 한 거야.',
        "Ha, put that away with the seal. (He never does answer.)\n\nIf I told you, you'd start measuring whether your hand was right. Don't. Your hand was your own. That means the vote did its job.",
        { affinity: 0.05, flag: 'choice.n03_3_asked_side' }),
    ],
    completeReply: {
      respect: [
        '무거워야지. (도장을 건넨다. 찍지 않은 채. 기념이라며.)\n\n찍는 건 쉬워. 손목 한 번이면 돼. 안 찍고 기다리는 게 어렵지. 그 도장 볼 때마다 기억하게. 힘이 있을 때 안 쓰는 것도 힘이라는 걸.',
        "It ought to. (He hands me the stamp. Unused. A keepsake, he says.)\n\nStamping is easy. One turn of the wrist. Not stamping and waiting is the hard part. Remember it whenever you look at that seal. Not using power when you have it is power too.",
      ],
      lesson: [
        '멀리서 보는 거야. 가까이 가면 개입이 돼. (경제 눈이 한 단계 넓어진다.)\n\n위판 숫자를 봐. 어느 어종이 줄고 어느 배가 쉬는지. 사람 말보다 숫자가 먼저 바다 사정을 말해 줘. 숫자를 읽고 나서 사람을 만나게. 순서가 바뀌면 휘둘려.',
        "From a distance. Go close and it becomes interference. (My eye for the economy widens a step.)\n\nWatch the auction numbers. Which species are thinning, which boats are idle. Numbers tell you how the sea is doing before people do. Read the numbers, then meet the people. Do it the other way round and you get pushed around.",
      ],
      pay: [
        '그러세. 조합장 사비. (봉투가 두껍다. 조합 돈이 아니다.)\n\n이건 조합 돈이면 안 돼. 표결 앞두고 조합 봉투가 오가면 말이 나. 내 주머니에서 나간 거니 걱정 말고 받게. 선생 대접은 원래 사비로 하는 거야.',
        "Do. Out of the chairman's own pocket. (The envelope is thick. It isn't co-op money.)\n\nIt can't be co-op money. If co-op envelopes change hands before a vote, people talk. This came out of my own pocket, so take it without worrying. You treat a teacher out of your own pocket.",
      ],
    },
  },

  // ── N03-4 「스승의 날」 · 강두철 ──
  'N03-4': {
    offer: [
      d('like_first_day', '그 채비부터 풀어 드리겠습니다. 처음 그날처럼요.', "Let me undo that rig first. Like that first day.",
        '허허, 그날처럼. 십 분이면 되겠지? (엉킨 실뭉치를 내민다. 이번엔 그 손이 조금 떨린다.)\n\n천천히 하게. 마지막 수업은 길게 하는 게 좋아. 자재는 조합 창고에 다 들여놨으니 실 풀고 나서 보게. 2층에 쓸 거, 자네 손으로 만들어.',
        "Ha, like that day. Ten minutes should do it? (He holds out the tangled ball. This time his hand trembles a little.)\n\nTake your time. A last lesson is better long. The materials are all in the co-op storehouse, so look at them once the line's free. What goes upstairs, make it with your own hands.",
        { affinity: 0.05 }),
      d('ask_number_one', '명부 1번이요? 그게 무슨 자리입니까?', "Number one on the roll? What sort of seat is that?",
        '조합원 명부 맨 첫 줄이야. 조합장 자리가 아니라 그냥 1번 조합원. (명부를 펴려다 덮는다.)\n\n그 줄에 누가 서는지 보면 조합이 어디로 가는지 보여. 그래서 비워 뒀어. 자네가 서 주면 좋겠다는 건… 늙은이 욕심이지.',
        "The very first line of the members' roll. Not the chairman's seat — just member number one. (He starts to open the roll, then shuts it.)\n\nWho stands on that line shows where the co-op is heading. That's why I left it empty. Wanting you to stand there is… an old man's greed.",
        { affinity: 0.04, flag: 'choice.n03_4_asked_number_one' }),
      d('really_retire', '정말 은퇴하십니까? 아직 정정하신데요.', "Are you really retiring? You're still going strong.",
        '정정할 때 내려와야 해. 힘 빠져서 내려오면 다들 붙잡고 싶어 하지 않거든. (허허 웃는다. 눈가 주름이 깊다.)\n\n이제 바다에 앉아 볼 생각이야. 조합장 말고 그냥 낚시꾼으로. 선생님한테 배운 거 써먹어야지. 아직 매듭은 엉키지만.',
        "You step down while you're strong. Step down when you've gone weak and nobody wants to keep you. (He chuckles. The lines round his eyes are deep.)\n\nNow I mean to sit by the sea. Not as chairman, just as an angler. I ought to use what my teacher taught me. Though my knots still tangle.",
        { affinity: 0.05 }),
      d('act_again', '또 엉키셨어요? 이번에도 연기 아니시죠?', "Tangled again? This isn't another act, is it?",
        '허허! 들켰나. (실뭉치를 들어 보인다. 엉킨 모양이 너무 반듯하다.)\n\n반은 연기고 반은 진짜야. 마지막 수업은 처음처럼 하고 싶었어. 늙은이 고집이니 한 번만 봐주게. 십 분이면 되지?',
        "Ha! Caught me? (He holds up the ball. It's tangled far too neatly.)\n\nHalf act, half real. I wanted the last lesson to be like the first. An old man's stubbornness, so humour me once. Ten minutes?",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('passenger', '은퇴하시면 제 배 손님으로 모시겠습니다. 값은 정가로요.', "When you retire, I'll take you out on my boat as a passenger. Full fare.",
        '허허, 정가. 그 말은 내가 가르쳤지. (웃다가 눈가를 손등으로 훔친다.)\n\n좋아. 은퇴한 늙은이도 손님은 손님이야. 깎아 주면 안 되네. 대신 그날은 채비를 내가 묶겠어. 초보 행세 없이.',
        "Ha, full fare. I taught you that one. (He laughs, then wipes his eyes with the back of his hand.)\n\nGood. A retired old man is still a passenger. No discounts. But that day I'll tie my own rig. No beginner act.",
        { affinity: 0.08, flag: 'choice.n03_4_passenger' }),
    ],
    completeReply: {
      number_one: [
        '무거워야지. 나도 무거웠어. (조합원 명부 1번에 내 이름이 적힌다. 조합장은 아니고 1번 조합원.)\n\n무거우면 천천히 들게. 혼자 들지 말고. 1번은 맨 앞에 서는 자리가 아니라 맨 먼저 손을 보태는 자리야. 그걸 잊지 않으면 이름이 자네를 지켜 줄 거네.',
        "It ought to be. It was heavy for me too. (My name goes down as member number one. Not chairman — member number one.)\n\nIf it's heavy, lift it slowly. Not alone. Number one isn't the seat at the front, it's the first hand to help. Remember that and the name will look after you.",
      ],
      lesson: [
        '가르치는 쪽이 더 배우지. 늘 그래. (매듭 하나를 더 가르쳐 준다. 조합장 매듭이라며.)\n\n이 매듭은 당겨도 안 풀리고, 풀려고 마음먹으면 한 번에 풀려. 붙잡을 때와 놓을 때를 아는 매듭이지. 조합장 노릇이 딱 그래. 이제 나는 놓는 쪽만 하면 돼.',
        "The one teaching learns more. Always does. (He teaches me one more knot. The chairman's knot, he calls it.)\n\nPull on it and it won't give, but when you mean to undo it, it comes loose in one go. A knot that knows when to hold and when to let go. That's being chairman exactly. Now I only have the letting go left.",
      ],
      pay: [
        '허허. 그러세. 은퇴금에서. (봉투가 두껍다. 웃으면서 준다.)\n\n선생님 수업료는 늘 제값을 쳤지. 마지막이라고 깎으면 안 되지. 그걸로 2층에 의자나 하나 더 놓게. 늙은이가 가끔 앉으러 갈 테니.',
        "Ha. Do. Out of the retirement money. (The envelope is thick. He hands it over smiling.)\n\nI always paid your lessons in full. Can't cut it just because it's the last. Put another chair upstairs with it. The old man will drop in to sit now and then.",
      ],
    },
  },
};
