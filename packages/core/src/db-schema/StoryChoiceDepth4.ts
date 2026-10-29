/**
 * @file StoryChoiceDepth4.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 4묶음: 서브 N01 바람 · N02 탁만수·탁새벽 · N03 강두철 · N04 청초고 방파제부.
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 *
 * 이 묶음의 스포일러 선(R2)
 *  - N01 바람: 본명 · 과거(배와 사람을 잃은 선장)는 N01-7에서만. 그 전에는 떠도는 사람 「바람」 — 물으면 말을 돌린다.
 *  - N03 강두철: N03-1 · N03-5에서는 채비 못 묶는 초보 노인(손 · 수첩 같은 단서만). 조합장 직함은 N03-2부터.
 *  - N03-6 두 노인이 탔던 배는 이름도 사연도 말하지 않는다.
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
        '안 물어봤어. 물으면 도망가. 그 나이엔 대답 대신 발이 먼저 나가.\n\n(다리 쪽을 턱으로 가리킨다.) 전화기를 계속 만지작거리더라. 누르지는 못하고. 거기까지만 알아. 나머지는 그 애가 말하고 싶을 때 하겠지. 가자.',
        "Didn't ask. Ask and he bolts. At that age the feet answer before the mouth does.\n\n(He points his chin at the bridge.) He keeps fiddling with his phone. Can't press it, though. That's all I know. The rest he'll tell when he wants to. Let's go.",
        { affinity: 0.04, flag: 'choice.n01_2_asked_why' }),
      d('why_mackerel', '왜 하필 전갱이예요? 한 마리면 된다는 건요?', "Why horse mackerel? And why would one be enough?",
        '이 다리 밑엔 밤이면 불빛 따라 전갱이가 떼로 붙어. 옆에서 보기도 좋고, 잘 물고.\n\n한 마리면 돼. 눈앞에서 뭐가 펄떡이면 사람은 웃게 돼 있어. 웃고 나면 무거운 버튼도 좀 가벼워지고. 가자, 어두워지기 전에 자리 잡게.',
        "At night the horse mackerel crowd under this bridge after the lights. Easy to watch, and they bite well.\n\nOne's enough. When something's flapping right in front of you, you can't help smiling. And once you've smiled, a heavy button gets a little lighter. Come on, let's get a spot before dark.",
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
        '갯바위에서 일이 있었다는 것만 알아. 그 이상은 그 사람 거야. 묻지 마. (리어카 손잡이를 꽉 쥐었다 놓는다.)\n\n사고 난 사람한테 사고 얘기 시키는 게 제일 잔인한 거야. 바다 얘기를 해. 바람이 어느 쪽인지, 물이 어떤지. 그런 건 대답할 수 있으니까. 가자, 해금강으로.',
        "All I know is something happened on the rocks. Anything more is his. Don't ask. (He grips the cart handle hard, then lets go.)\n\nMaking someone talk about their accident is the cruellest thing you can do. Talk about the sea. Which way the wind is, how the water looks. Those he can answer. Come on, to Haegeumgang.",
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
        '해녀 숨은 못 배워. 그래도 들은 건 남지. (물가에서 숨 고르는 법이 조금 몸에 붙는다.)\n\n물 밖으로 나올 때 휘파람 같은 소리 들었지. 숨비소리라고 해. 참았던 숨을 한 번에 내보내는 거야. 그 소리 들으면 얼마나 깊이 갔다 왔는지 알아.',
        "You can't learn a haenyeo's breath. But what you hear stays with you. (A little of how to steady my breath at the edge stays with me.)\n\nYou heard that whistle when she came up. It's called sumbisori. All the held breath let out at once. Hear it and you know how deep she went.",
      ],
      pay: [
        '그렇지. 리어카 손잡이 밑에 넣어 둔 봉투야. 많진 않아.\n\n뱃삯도 들었으니 받아. 바다 건너는 데는 다리가 소용없거든. (서랍을 연다. 섬 바람에 지폐 귀퉁이가 눅눅하다.)',
        "Fair enough. There's an envelope under the cart handle. It isn't much.\n\nThe ferry cost too, so take it. Legs are no use crossing the sea. (He opens the drawer. The corners of the notes are damp from the island wind.)",
      ],
      decline: [
        '…자네는 바람이 좋은 쪽으로 부는군. (서귀포 해녀들이 나를 안다. 물가 사람으로.)\n\n물가 사람이라는 말, 여기선 칭찬이야. 경계를 지키는 사람이라는 뜻이니까. 그 이름 잃지 마. 여기선 한번 잃으면 다시 얻기 어려워.',
        "…The wind blows the right way with you. (The haenyeo of Seogwipo know me now. As one of the shore people.)\n\nOut here, being called that is praise. It means someone who keeps to the edge. Don't lose it. Here, once it's lost, it's hard to get back.",
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
        '쓰던 거니까 주는 거야. 새 거는 아무나 줄 수 있어. (가방 끈을 한 번 털어 내 어깨에 걸어 준다.)\n\n왜냐고는 묻지 마. 아직은. 무게나 재 봐. 리어카보다 가볍지? 그거면 돼. 오늘 밤은 그 사람 옆에 있어 줘.',
        "I'm giving it because it's been used. Anyone can give a new one. (He shakes out the strap and hangs it on my shoulder.)\n\nDon't ask why. Not yet. Feel the weight. Lighter than a cart, isn't it? That's enough. Tonight, just stay beside him.",
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
        '자리는 끝자리면 돼. 문 가까운 데. (리어카 손잡이에서 손을 뗐다가 다시 잡는다.)\n\n서른 해 동안 그런 자리엔 안 앉았어. 이번엔 앉아 볼게. 그 전에 하나만 같이 하자. 서른 해 전 그 자리에서, 한 마리.',
        "An end seat will do. Near the door. (He lets go of the cart handle, then takes hold of it again.)\n\nThirty years and I've never sat down at a gathering like that. This time I'll try. Before that, do one thing with me. In that spot from thirty years ago, one fish.",
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
        '들어도 돼. 들을 사람이 필요했어. 처음 만난 날 네가 이름을 물었지. 바람이라고만 했고. 그 뒤로 너는 다시 안 물었어. (작게 웃는다.)\n\n그래서 너한테 말하는 거야. 이름은 무거워도 둘이 들면 좀 낫겠지. 가자. 그 자리부터.',
        "You may. I needed someone to hear it. The day we met you asked my name. I only said Baram. After that you never asked again. (A small smile.)\n\nThat's why I'm telling you. A name can be heavy, but it's a little easier with two carrying it. Come on. That spot first.",
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
        '봐야 안다. 대는 겉이 멀쩡해도 속에서 운다. (마디 하나에 손톱을 대고 톡 쳐 본다. 표정이 잠깐 굳는다.)\n\n버릴 대는 아니다. 그건 지금도 안다. 나머지는 시간을 줘. 대가 오래 산 만큼 보는 데도 시간이 걸린다. 그동안 방파제에 가 있어.',
        "Can't say till I've looked. A rod can be sound outside and crying inside. (He taps one section with a fingernail. His face sets for a moment.)\n\nIt's not one to throw away. That much I know already. Give me time for the rest. The longer a rod has lived, the longer it takes to read. Go to the breakwater meanwhile.",
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
        '…한마디. (오래 말이 없다.) 말로 하는 건 내 쪽이 서툴다.\n\n대신 그 왕대, 내가 직접 말려 주마. 그늘에서 천천히. 그 애는 그걸 보고 알 거다. 그 애도 말보다 대를 먼저 보는 놈이니까.',
        "…One word. (He's silent a long time.) Saying things is where I'm clumsy.\n\nInstead I'll dry that culm myself. In the shade, slowly. He'll see that and understand. That boy reads bamboo before he reads words.",
        { affinity: 0.07, flag: 'choice.n02_2_asked_word' }),
    ],
    completeReply: {
      decline: [
        '…고맙다. 그 말 처음 하네. (자는 줄 알았던 새벽이가 돌아누우며 웃는다.)\n\n그 애는 다 듣고 있었을 거다. 저 녀석은 자는 척을 잘해. …내일 아침엔 밥을 두 공기 퍼 줘야겠다.',
        "…Thank you. First time I've said that. (Saebyeok, who I thought was asleep, rolls over and smiles.)\n\nHe'll have heard every word. That boy is good at pretending to sleep. …Tomorrow morning I'd better give him two bowls of rice.",
      ],
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
        '이번 대는 처음부터 끝까지 내가 하래. 할아버지는 구석에서 보기만 했어. 진짜로 한마디도 안 했어.\n\n…처음엔 화났나 했는데 아니래. 손 놓는 것도 일이래. 무슨 말인지 아직 잘 모르겠어. 아저씨는 알아? …몰라도 돼. 마지막 손질은 같이 하자.',
        "He said this rod was mine to do, start to finish. Grandpa just watched from the corner. Honestly, not a single word.\n\n…At first I thought he was angry, but he says no. Letting go is work too, he says. I still don't really get it. Do you? …Doesn't matter. Let's do the last finishing together.",
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
        "There are days a teacher learns from a student. Here — like this. (His hands move far too fast.)\n\nOh — oh… is that not it? Ha, the old man was only copying. I watched your hands and mine just ran ahead. (He tangles the line up again. It almost looks deliberate.)",
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
        '그래. 이 바닷가 어촌계들이 모인 수협의 조합장이야. 위판장도 수협이 열지. (명함을 꺼냈다가 도로 넣는다.)\n\n그런 사람이 방파제에서 매듭 못 묶는 척을 했으니 할 말이 없네. 그래도 그날 엉킨 실은 진짜였어. 그건 믿어 주게. 대답은 전갱이 낚으면서 천천히 하고.',
        "Yes. Chairman of the fisheries co-op the village guilds along this coast belong to. The auctions run under the co-op too. (He takes out a business card, then puts it back.)\n\nAnd a man like that pretended he couldn't tie a knot on the breakwater, so I've nothing to say for myself. But the tangle that day was real. Believe that much. Answer me slowly, while we fish for horse mackerel.",
        { affinity: 0.03, flag: 'choice.n03_2_asked_coop' }),
      d('why_pretend', '왜 초보인 척하셨어요? 저를 시험하신 겁니까?', "Why pretend to be a beginner? Were you testing me?",
        '시험은 무슨. (손을 내젓는다.) 조합장이라고 하면 다들 허리부터 굽혀. 채비를 물어도 정답 대신 듣기 좋은 말을 하지.\n\n그날 자네는 내가 누군지 몰랐고, 그래서 진짜로 가르쳐 줬어. 그게 듣고 싶었어. 미안하네. 대답은 전갱이 두 마리 올린 다음에 들려주게.',
        "Testing? Hardly. (He waves a hand.) Say you're the chairman and everyone bows first. Ask about rigs and they tell you what you'd like to hear, not what's right.\n\nThat day you didn't know who I was, so you taught me for real. That's what I wanted to hear. I'm sorry. Give me your answer after we've landed two horse mackerel.",
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
        '…허. 그 말 듣고 싶었네. (수협 조합장이 내 채비를 배운다는 소문이 항구에 돈다.)\n\n조합장 자리에 앉으면 다들 내게 답을 가져와. 질문을 가져오는 사람은 없지. 자네는 내게 숙제를 줘. 그게 좋아. 다음 숙제는 뭔가, 선생님.',
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
        '조합 일 마무리는 다 이걸로 하지. 서류 맨 끝에 이게 찍혀야 일이 끝나. (인주가 마른 도장을 손바닥에 굴린다.)\n\n그래서 무서운 거야. 이게 찍히면 반대한 사람 말도 다 덮여. 이번 표결엔 안 찍어. 찍지 않는 도장도 있는 법이야. 자네는 표결 전까지 위판이나 쌓아 두게.',
        "Every piece of co-op business ends with this. Until it's stamped at the bottom of the paper, nothing's finished. (He rolls the seal, its red ink long dry, in his palm.)\n\nThat's what makes it frightening. Once it's stamped, even the people who objected get buried under it. I won't stamp this vote. Some seals stay unstamped. You just build up your auction record before the vote.",
        { affinity: 0.04, flag: 'choice.n03_3_asked_seal' }),
      d('why_not', '조합장님이 표결에 끼면 왜 안 되는 겁니까?', "Why mustn't a chairman get involved in the vote?",
        '어촌계는 마을이 바다를 나눠 쓰는 자리야. 수협은 그 위에서 돈과 위판을 맡고. 위에 있는 사람이 손을 얹으면 아래 사람들 손은 못 올라가.\n\n찬성이든 반대든 자기 손으로 들어야 표야. 내가 한마디 하면 그건 내 표가 돼. 그러니 입 다무는 게 내 일이지. 자네 일은 표결 전까지 실적 쌓는 거고.',
        "The fishing guild is where a village shares out its sea. The co-op sits above it, handling money and auctions. When someone above lays a hand on it, the hands below can't go up.\n\nFor or against, it's only a vote if you raise your own hand. If I say one word, it becomes my vote. So keeping my mouth shut is my job. Yours is building your record before the vote.",
        { affinity: 0.04 }),
      d('just_tell', '솔직히 한마디 해 주시면 편할 텐데요. 어느 쪽이 맞습니까?', "Honestly, it'd be easier if you just said. Which side is right?",
        '(고개를 젓는다.) 그 질문에 대답하는 순간 나는 조합장이 되고 자네는 학생이 돼. 우리 사이가 거꾸로 가는 거지.\n\n편한 길은 늘 남한테 묻는 길이야. 자네는 선생이잖나. 선생은 어려운 길로 가는 사람이야. 우선 위판장부터 다녀오게.',
        "(He shakes his head.) The moment I answer that, I become the chairman and you become the student. We'd be running backwards.\n\nThe easy road is always asking someone else. You're the teacher, aren't you? A teacher takes the hard road. Start with the auction floor.",
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
        '조합원 명부 맨 첫 줄이야. 조합장 자리가 아니라 그냥 1번 조합원. (명부를 펴려다 덮는다.)\n\n그 줄에 누가 서는지 보면 조합이 어디로 가는지 보여. 그래서 비워 뒀어. 자네가 서 주면 좋겠다는 건… 늙은이 욕심이지. 자, 그 얘긴 됐고 이 채비부터 봐 주게.',
        "The very first line of the members' roll. Not the chairman's seat — just member number one. (He starts to open the roll, then shuts it.)\n\nWho stands on that line shows where the co-op is heading. That's why I left it empty. Wanting you to stand there is… an old man's greed. Now, enough of that. Take a look at this rig first.",
        { affinity: 0.04, flag: 'choice.n03_4_asked_number_one' }),
      d('really_retire', '정말 은퇴하십니까? 아직 정정하신데요.', "Are you really retiring? You're still going strong.",
        '정정할 때 내려와야 해. 힘 빠져서 내려오면 다들 붙잡고 싶어 하지 않거든. (허허 웃는다. 눈가 주름이 깊다.)\n\n이제 바다에 앉아 볼 생각이야. 조합장 말고 그냥 낚시꾼으로. 선생님한테 배운 거 써먹어야지. 아직 매듭은 엉키지만. (엉킨 실뭉치를 들어 보인다.)',
        "You step down while you're strong. Step down when you've gone weak and nobody wants to keep you. (He chuckles. The lines round his eyes are deep.)\n\nNow I mean to sit by the sea. Not as chairman, just as an angler. I ought to use what my teacher taught me. Though my knots still tangle. (He holds up the tangled ball.)",
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

  // ── N04-1 「입부 권유」 · 배누리(첫 만남 — 주인공은 존댓말) ──
  'N04-1': {
    offer: [
      d('count_me_in', '좋아요. 학꽁치 구이라면 저도 끼고 싶네요.', "Sounds good. If there's grilled halfbeak, count me in.",
        '와, 진짜요? 오늘 손님 첫 번째예요! (사비키 채비를 하나 내 손에 쥐여 준다.)\n\n사비키는 살살 흔들어야 돼요. 세게 흔들면 학꽁치가 놀라서 도망가요. 두 마리만 잡으면 바로 구워요. 소금은 제가 챙겨 왔어요.',
        "Wow, really? You're our first guest today! (She puts a sabiki rig into my hand.)\n\nYou have to shake a sabiki gently. Shake it hard and the halfbeak get scared off. Two of them and we grill straight away. I brought the salt.",
        { affinity: 0.05 }),
      d('ask_club', '방파제부요? 그런 동아리도 있어요?', "A breakwater club? Is that even a thing?",
        '있죠! 청초고 방파제부. 제가 부장이에요. 학교 끝나면 방파제로 와서 낚고, 낚은 건 그 자리에서 먹어요. (가슴을 펴고 부 이름을 또박또박 말한다.)\n\n부원은… 많지는 않아요. 그래서 이렇게 영업 중이에요. 낚으면 먹는다! 이 모토에 끌리시면 반은 부원이에요. 일단 두 마리만 같이 낚아요!',
        "Sure is! The Cheongcho High breakwater club. I'm the captain. After school we come to the breakwater, fish, and eat what we catch right there. (She puffs out her chest and says the club name word by word.)\n\nThere aren't… a lot of us. That's why I'm out recruiting. Catch it and eat it! If that motto pulls you in, you're half a member already. For now, let's catch two together!",
        { affinity: 0.04, flag: 'choice.n04_1_asked_club' }),
      d('never_caught', '학꽁치는 한 번도 안 잡아 봤는데, 괜찮을까요?', "I've never caught a halfbeak. Is that okay?",
        '괜찮아요! 처음엔 다 그래요. 학꽁치는 물 위쪽에 떠다니니까 채비를 깊이 안 내려도 돼요. (손가락으로 수면 바로 아래를 가리킨다.)\n\n못 잡으면 굽는 거 담당 하시면 돼요. 그것도 중요한 일이에요, 진짜로. 탄 거 먹고 싶은 사람은 없거든요.',
        "It's fine! Everyone starts somewhere. Halfbeak swim up near the surface, so you don't have to drop the rig deep. (She points just below the water.)\n\nIf you don't catch any, you can be in charge of grilling. That's an important job too, really. Nobody wants to eat burnt fish.",
        { affinity: 0.03 }),
      d('dues', '입부하면 부비 내야 해요? 저 지금 빈털터리인데요.', "Do I have to pay dues if I join? I'm broke right now.",
        '부비요? 하하, 저희도 거의 없어요. 부비 대신 소금이랑 호일만 가져오면 돼요. (주머니에서 꼬깃꼬깃한 호일을 꺼내 보인다.)\n\n입부는 나중에 정하셔도 돼요. 일단 오늘은 같이 낚고 같이 먹어요. 먹고 나면 마음이 바뀔걸요?',
        "Dues? Ha, we barely have any ourselves. Instead of dues, just bring salt and foil. (She pulls a crumpled sheet of foil out of her pocket.)\n\nYou can decide about joining later. Today let's just fish together and eat together. Once you've eaten, you'll change your mind.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('grill_tip', '굽는 솜씨가 좋던데요. 그 요령 좀 알려 주세요.', "You're good at grilling. Teach me the trick?",
        '요령이요? 학꽁치는 배 안쪽 까만 막만 긁어 내면 돼요. 그거 안 긁으면 써요. (호일 위에 소금을 톡톡 뿌리는 손이 빠르다.)\n\n불은 세게 말고 오래. 껍질이 바삭해지면 그때 뒤집어요. 이건 부장 비법인데 특별히 알려 드리는 거예요.',
        "The trick? With halfbeak you just scrape out the black lining inside the belly. Leave it and it's bitter. (Her hands are quick, sprinkling salt over the foil.)\n\nNot a fierce fire, a long one. Flip it once the skin's crisp. That's the captain's secret, and you're getting it as a special favour.",
        { proficiency: { category: 'life', xp: 18 }, affinity: 0.05 }),
    ],
    completeReply: {
      join: [
        '낚으면 먹는다! 환영! (부원 명단에 이름을 적고 부 배지를 준다. 앞으로 함께 낚으면 경험이 두 배다.)\n\n어른 부원은 처음이에요! 선배라고 불러야 하나, 형이라고 불러야 하나… 일단 어른 부원님! 다음 모임은 방파제 끝이에요. 소금은 제가 챙길게요.',
        "Catch it, eat it! Welcome! (She writes my name on the roll and gives me a club badge. From now on fishing together is worth double experience.)\n\nOur first ever adult member! Should I call you senior, or… never mind, adult member it is! Next meet's at the end of the breakwater. I'll bring the salt.",
      ],
      decline_join: [
        '그럼 밥만 같이 먹어요. 어른 부원! (고등어 통조림 두 개를 쥐여 준다.)\n\n나이는 상관없어요. 낚으면 먹는다, 이 모토엔 나이 제한이 없거든요. 마음 바뀌면 언제든 방파제로 오세요. 자리는 늘 하나 비워 둘게요.',
        "Then just eat with us. Adult member! (She presses two tins of mackerel into my hands.)\n\nAge doesn't matter. Catch it and eat it has no age limit. If you change your mind, come to the breakwater any time. I'll always keep a spot free.",
      ],
      later: [
        '천천히요! 방파제는 안 도망가요.\n\n학꽁치는 도망가지만요. 하하. 봄가을에 제일 많이 붙어요. 그때 오시면 사비키 하나 더 챙겨 둘게요. 생각 끝나면 말해 주세요. 기다릴게요!',
        "Take your time! The breakwater isn't going anywhere.\n\nThe halfbeak do, though. Ha. They gather most in spring and autumn. Come then and I'll have a spare sabiki ready. Tell me once you've decided. I'll be waiting!",
      ],
    },
  },

  // ── N04-2 「부원을 낚아라」 · 배누리(event — 나레이션 미루기 답 유지) ──
  'N04-2': {
    offerAdd: [
      d('ask_jinju', '모진주? 어떤 애길래 그렇게 데려오고 싶어?', "Mo Jinju? What's she like, that you want her so badly?",
        '말을 거의 안 하는 애예요. 근데 낚시는… 진짜 잘해요. 새벽 방파제 끝에서 혼자 원투 던지는 걸 봤는데, 채비가 물에 떨어지는 소리도 안 났어요. (목소리를 낮춘다.)\n\n혼자가 좋아서 혼자인 건지, 같이 할 사람이 없어서 혼자인 건지 모르겠어요. 그래서 알고 싶어요. 같이 가 주세요.',
        "She hardly ever talks. But her fishing… she's seriously good. I saw her surf casting alone at the end of the breakwater at dawn, and the rig didn't even make a sound hitting the water. (She lowers her voice.)\n\nI can't tell if she's alone because she likes it, or because there's no one to fish with. So I want to find out. Come with me.",
        { affinity: 0.04, flag: 'choice.n04_2_asked_jinju' }),
      d('ask_booth', '사람 낚기 부스? 그게 무슨 부스야?', "A catching-people booth? What sort of booth is that?",
        '축제 부스요! 지나가는 사람 붙잡아서 입부 신청서 쓰게 하는 거요. 이름은 제가 지었어요. (간판을 자랑스럽게 가리킨다. 글씨가 삐뚤다.)\n\n근데 아무도 안 낚여요. 그래서 진짜 낚시로 가는 거예요. 진주한테는 신청서가 안 통하거든요.',
        "A festival booth! We grab people walking past and get them to fill in a membership form. I came up with the name. (She points proudly at the sign. The lettering's crooked.)\n\nBut nobody's biting. So we're going with real fishing. Forms don't work on Jinju.",
        { affinity: 0.03 }),
    ],
    offerReply: {
      go: [
        '역시! 모자 챙기세요, 새벽은 진짜 추워요.\n\n도루묵은 겨울에 알 배서 연안으로 붙는대요. 진주가 혼잣말하는 걸 들었어요. 방파제 끝에서는 말 걸지 말고 옆에서 낚기만 하세요. 그게 작전이에요.',
        "Knew it! Bring a hat — dawn is properly cold.\n\nSandfish come in close in winter when they're full of roe, apparently. I heard Jinju muttering it to herself. At the end of the breakwater, don't talk to her, just fish beside her. That's the plan.",
      ],
      decline: [
        '…아, 그럼 다음 겨울에요. 진주는 안 도망가요. 아마.\n\n사실 저도 새벽 추위는 무서워요. 핫팩 다섯 개 붙이고 가요. 다음 겨울엔 핫팩 넉넉히 챙겨 둘게요. 그때는 꼭 같이 가요.',
        "…Ah. Next winter, then. Jinju isn't going anywhere. Probably.\n\nHonestly, the dawn cold scares me too. I go with five heat packs stuck on. Next winter I'll have plenty ready. Come with me then, for sure.",
      ],
    },
    completeAdd: [
      d('asked_again', '진주한테 다음에도 같이 낚자고 했습니다. 대답은 없었지만요.', "I asked Jinju to fish with me again sometime. She didn't answer.",
        '대답이 없으면 된 거예요! 진주는 싫으면 고개부터 저어요. 그건 확실해요. (손뼉을 친다.)\n\n다음 새벽 모임에 진주 자리 하나 더 만들어 둘게요. 어른 부원 옆으로요. 진주는 아는 사람 옆에만 앉거든요.',
        "No answer means yes! If Jinju doesn't want something, she shakes her head straight away. That much I'm sure of. (She claps her hands.)\n\nAt the next dawn meet I'll set out a spot for Jinju. Right beside our adult member. Jinju only sits next to people she knows.",
        { affinity: 0.06, affinityOther: [{ npcId: 'mo_jinju', delta: 0.08 }] }),
    ],
    completeReply: {
      silent: [
        '역시. 진주는 말보다 낚시로 통하는 애예요. (부 활동비라며 봉투를 준다.)\n\n저는 맨날 말로 하려다 실패했거든요. 말을 많이 하면 진주가 한 발씩 물러나요. 어른 부원님은 한 발도 안 다가갔는데 진주가 다가왔어요. 신기해요.',
        "Knew it. Jinju connects through fishing, not words. (She gives me an envelope — club funds, she says.)\n\nI always tried with words and failed. The more I talk, the further Jinju steps back. You didn't take a single step toward her, and she came to you. It's amazing.",
      ],
      lesson: [
        '진주가 가르쳐 준다고요? 그 애가? …그럼 부에서 배우세요. 원투 담당 진주!\n\n진주 원투는 소리가 없어요. 추가 물에 들어갈 때 퐁 소리도 안 나요. 떨어지기 직전에 손가락으로 줄을 살짝 잡아 준대요. 진주한테 직접 물어보세요. 대답은 아마 손으로 할 거예요.',
        "Jinju's going to teach you? Her? …Then learn it in the club. Jinju, surfcasting officer!\n\nJinju's casts are silent. Not even a plop when the sinker goes in. She feathers the line with a finger just before it lands, apparently. Ask her yourself. She'll probably answer with her hands.",
      ],
      decline: [
        '어른 부원 최고… 진주도 그렇게 말했어요. (방파제부 사이에서 내 이름이 돈다.)\n\n진주가 누구 칭찬하는 거 진짜 드물어요. 부 일지에 적어 둘 거예요. 오늘 날짜, 진주가 칭찬함, 대상은 어른 부원.',
        "Best adult member ever… Jinju said the same thing. (My name goes round the breakwater club.)\n\nJinju almost never praises anyone. I'm writing it in the club log. Today's date. Jinju gave praise. Recipient: adult member.",
      ],
    },
  },

  // ── N04-3 「부원 모집 전단」 · 배누리 ──
  'N04-3': {
    offer: [
      d('show_catch', '좋아. 전단보다 낚는 모습이 낫다는 거, 보여 주자.', "Okay. Let's show them a catch beats a flyer.",
        '역시 어른 부원! 수아는 전단을 만들어 왔는데 그건 제가 말렸어요. 종이는 바람에 날아가잖아요. (방파제 난간을 손바닥으로 탁 친다.)\n\n두 마리요. 한 마리는 운이라고 하니까 두 마리. 구경 오는 애 있으면 바로 대 쥐여 주세요. 손에 쥐어 봐야 알아요.',
        "That's our adult member! Sua made flyers, but I talked her out of them. Paper just blows away in the wind. (She slaps the breakwater railing with her palm.)\n\nTwo fish. One's luck, people say, so two. If a kid comes to watch, put the rod in their hands straight away. You only know once you've held it.",
        { affinity: 0.05 }),
      d('ask_members', '부가 없어진다고? 몇 명이 돼야 안 없어지는데?', "The club might be shut down? How many members do you need?",
        '넷이요. 지금 셋이거든요. 저랑 수아랑 진주. 넷이 안 되면 부를 없앤대요. (손가락 세 개를 펴 보이다가 하나를 더 펴려고 애쓴다.)\n\n부실이래 봐야 창고지만, 거기 대가 다 있어요. 부가 없어지면 그 대들도 갈 데가 없어요. 한 명만 더요.',
        "Four. We're three right now. Me, Sua and Jinju. If we don't make four, they'll shut us down. (She holds up three fingers and strains to raise a fourth.)\n\nOur clubroom's basically a storeroom, but all our rods are in there. If the club goes, those rods have nowhere to go. Just one more.",
        { affinity: 0.04, flag: 'choice.n04_3_asked_members' }),
      d('ask_sua', '전단 만든 애는 서운하지 않을까? 수아라고 했지?', "Won't the one who made the flyers be hurt? Sua, was it?",
        '수아요? 조금 삐졌어요. (머쓱하게 웃는다.) 수아는 뭐든 계획부터 세우는 애거든요. 전단도 열심히 만들었고요.\n\n그래서 오늘 두 마리 올리면 수아한테 제일 먼저 보여 줄 거예요. 전단이 못 한 걸 해냈다고 하면 수아도 웃을 거예요. …아마요.',
        "Sua? She's sulking a bit. (She smiles sheepishly.) Sua's the type who plans everything first. She worked really hard on those flyers.\n\nSo if we land two today, she's the first one I'll show. If I tell her we did what the flyers couldn't, she'll laugh. …Probably.",
        { affinity: 0.05 }),
      d('if_blank', '애들 앞에서 못 잡으면 오히려 망신인데.', "If I don't catch anything in front of them, that's worse than flyers.",
        '그럼 같이 망신당해요! 저도 옆에서 던질게요. (씩 웃는다.)\n\n사실 못 잡아도 괜찮아요. 기다리는 것도 낚시잖아요. 진짜 중요한 건 구경 온 애가 대를 잡아 보는 거예요. 손에 쥐어 본 애는 다시 와요. 그건 진짜예요.',
        "Then we'll be embarrassed together! I'll be casting right beside you. (She grins.)\n\nHonestly, it's fine if we don't catch anything. Waiting is fishing too. What really matters is the kid who came to watch getting to hold a rod. Kids who've held one come back. That's true.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('sua_flyers', '수아 학생이 만든 전단, 버리지 말고 다음 학기에 붙입시다.', "Don't throw out Sua's flyers. Let's put them up next term.",
        '수아가 들으면 울어요. 감동해서요. (휴대폰을 꺼내 바로 수아에게 문자를 보낸다.)\n\n사실 전단도 좋았어요. 그림이 진짜 귀여웠거든요. 이번엔 낚는 걸로 한 명, 다음엔 전단으로 한 명. 그럼 다섯이에요!',
        "Sua will cry when she hears that. Happy tears. (She whips out her phone and texts Sua right away.)\n\nThe flyers were good, actually. The drawings were really cute. One member from fishing this time, one from flyers next time. That makes five!",
        { affinity: 0.05, affinityOther: [{ npcId: 'ha_sua', delta: 0.08 }] }),
    ],
    completeReply: {
      teach: [
        '부원 지도 어른! 그럼 저희도 배우는 거잖아요. (가르치면서 내 캐스팅도 정리된다.)\n\n그 애 이름 물어봤어요? 아직이요? 다음엔 꼭 물어봐 주세요. 이름 불러 가면서 가르치면 금방 늘어요. 신입은 첫 달이 제일 중요하대요.',
        "Club-coaching adult member! Then we learn too. (Teaching tidies up my own casting.)\n\nDid you ask the kid's name? Not yet? Make sure you ask next time. Teach them by name and they pick it up fast. They say a newcomer's first month matters most.",
      ],
      pay: [
        '예산… 라면값 정도요. (진지하게 봉투를 만든다.)\n\n봉투는 수아가 접었어요. 각이 칼 같죠? 부 장부에도 적었어요. 어른 부원 지도비, 라면 한 봉지 값. 적어도 장부에는 남아요.',
        "Budget… about the price of ramyeon. (She makes up an envelope, seriously.)\n\nSua folded the envelope. Look how sharp the corners are. I wrote it in the club books too. Adult member coaching fee, one packet of ramyeon. At least it's on the record.",
      ],
      decline: [
        '…부장 울어요. 어른 부원 만세. (학교 앞을 지날 때 학생들이 인사를 한다.)\n\n진짜 우는 거 아니에요. 바닷바람 때문이에요. …부가 남았어요. 넷이 됐어요. 그 애 손 떨리던 거, 저도 봤어요. 다음엔 그 애가 다른 애 손에 대를 쥐여 줄 거예요.',
        "…The captain's crying. Long live the adult member. (Students greet me when I pass the school.)\n\nI'm not really crying. It's the sea wind. …The club survived. We're four now. I saw that kid's hand shaking too. One day they'll be putting a rod in someone else's hand.",
      ],
    },
  },

  // ── N03-5 「도래 스무 개」 · 강두철(아직 초보 행세) ──
  'N03-5': {
    offer: [
      d('tie_twenty', '스무 번이요. 손이 기억할 때까지 해 보겠습니다.', "Twenty, then. I'll tie until my hands remember.",
        '그래, 그래. 하나부터 천천히. 빨리 묶은 스무 개보다 바로 묶은 스무 개가 낫다더군. (자리를 깔고 앉아 도래 봉지를 흔든다.)\n\n나는 세기만 하겠네. 늙은이가 할 줄 아는 게 셈뿐이라. 틀리면 하나부터 다시 셀 테니 각오하게.',
        "Good, good. From one, slowly. Twenty tied right beats twenty tied fast, so they say. (He spreads a mat, sits, and shakes the bag of swivels.)\n\nI'll just count. Counting is all an old man's good for. Get one wrong and I start again from one, so brace yourself.",
        { affinity: 0.05 }),
      d('why_twenty', '왜 하필 스무 번입니까? 열 번이면 안 됩니까?', "Why twenty? Wouldn't ten do?",
        '열 번이면 머리가 기억하고, 스무 번이면 손이 기억한다더군. 어디서 들은 말이야. (허허 웃는데 눈은 웃지 않는다.)\n\n머리는 급하면 잊어. 손은 안 잊지. 매듭은 꼭 급할 때 묶게 되거든. 그러니 스물.',
        "Ten and your head remembers, twenty and your hands remember, so I hear. Something I picked up somewhere. (He laughs, but his eyes don't.)\n\nIn a hurry, the head forgets. The hands don't. And you always end up tying knots in a hurry. So, twenty.",
        { affinity: 0.04, flag: 'choice.n03_5_asked_twenty' }),
      d('you_too', '어르신은 안 묶으세요? 같이 하시면 좋을 텐데요.', "Won't you tie some too? It'd be good to do it together.",
        '나? 나는… 세는 게 공부야. 선생님 손을 보면서. (도래 하나를 집어 만지작거리다 내려놓는다.)\n\n늙은이가 같이 묶다가 엉키면 선생님 일만 늘어. 오늘은 자네 손 차례야. 나는 옆에서 하나, 둘.',
        "Me? For me… counting is the lesson. Watching my teacher's hands. (He picks up a swivel, turns it over, and puts it down.)\n\nIf the old man ties along and tangles, it only makes more work for you. Today it's your hands' turn. I'll be beside you. One, two.",
        { affinity: 0.03 }),
      d('beginners', '초보가 초보를 가르치는 건데, 괜찮으시겠어요?', "A beginner teaching a beginner — are you sure about this?",
        '허허, 초보끼리가 제일 잘 통하는 법이야. 고수는 설명을 안 해 주거든. 다 안다고 생각해서. (도래 봉지를 내 앞에 쏟는다.)\n\n자, 하나. 셀 테니 묶게. 둘은 내가 셀 때까지 기다리고.',
        "Ha, beginners understand each other best. Experts never explain. They think everyone already knows. (He tips the bag of swivels out in front of me.)\n\nRight, one. I'll count, you tie. Wait for two till I say it.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('suspect', '어르신, 정말 낚시 처음 하시는 거 맞으세요?', "Sir, is this really your first time fishing?",
        '허허, 이 늙은이를 의심하는 겐가. (도래 봉지를 접으며 웃는다. 대답은 하지 않는다.)\n\n처음이든 아니든 오늘 스무 번 묶은 건 선생님 손이야. 그건 의심할 거 없지. 다음 매듭 배울 날이나 받아 두게.',
        "Ha, suspecting this old man, are we? (He laughs as he folds up the swivel bag. He doesn't answer.)\n\nFirst time or not, the hands that tied twenty today were yours. No doubting that. Just pencil in a day for the next knot.",
        { affinity: 0.04, flag: 'choice.n03_5_suspected' }),
    ],
    completeReply: {
      pay: [
        '그러세. 값은 값이지. (돈 세는 손은 또 빠르다.)\n\n연습 상대도 일이야. 일한 사람한테 값을 안 치르면 다음엔 아무도 옆에 안 앉아 주거든. 늙은이가 그 정도 셈은 하네.',
        "Do. A price is a price. (The hand counting money is quick again.)\n\nBeing a practice partner is work too. Don't pay the one who worked and next time nobody sits beside you. This old man can count that far.",
      ],
      decline: [
        '…그 말, 오래 기억하겠네. (항구 사람들이 나를 조합장 선생이라 부르기 시작했다.)\n\n이웃이라. 이 항구에서 그 말 듣기가 쉽지 않은데. (남은 도래를 손바닥에 굴리다 내 채비통 옆에 둔다.) 다음엔 이웃끼리 커피나 하세. 늙은이가 사지.',
        "…I'll remember that a long time. (The harbour people start calling me the chairman's teacher.)\n\nNeighbour, is it. Not a word you hear easily round this harbour. (He rolls the spare swivels in his palm, then sets them by my tackle box.) Next time, coffee between neighbours. On the old man.",
      ],
    },
  },

  // ── N02-5 「대를 고르는 눈」 · 탁만수 ──
  'N02-5': {
    offer: [
      d('with_reason', '골라 보겠습니다. 이유까지 말씀드릴 수 있게요.', "I'll choose — and make sure I can tell you why.",
        '이유 없이 고른 건 고른 게 아니다. 찍은 거지. (뒷짐을 진다.)\n\n급할 거 없다. 갯가에 떠밀려 온 대나무 토막도 두어 개 주워 와. 비교할 게 있어야 눈이 생긴다. 다 보고 와서 말해.',
        "A pick with no reason isn't a pick. It's a guess. (He clasps his hands behind his back.)\n\nNo hurry. Go and gather a couple of bamboo pieces washed up on the shore too. You need something to compare before you get an eye. See it all, then come and tell me.",
        { affinity: 0.05 }),
      d('ask_hint', '뭘 보고 고르면 됩니까? 두께요, 색이요?', "What should I look at? Thickness? Colour?",
        '그걸 알려 주면 내가 고르는 거지. (코웃음을 친다.)\n\n하나만 말해 주마. 눈으로 고르는 게 아니다. 만져 봐. 손바닥이 먼저 안다. 그다음은 네가 찾아.',
        "If I told you that, I'd be the one choosing. (He snorts.)\n\nI'll tell you one thing. You don't choose with your eyes. Handle them. Your palm knows first. The rest is yours to find.",
        { affinity: 0.04, flag: 'choice.n02_5_asked_hint' }),
      d('all_same', '솔직히 대나무는 다 똑같아 보이는데요.', "Honestly, bamboo all looks the same to me.",
        '그래서 시키는 거다. 다 똑같아 보이는 놈이 하나를 골라내면 그게 눈이야. (벽에 세운 세 대를 손바닥으로 한 번씩 쓸어 본다.)\n\n오십 년 전엔 나도 그랬다. 다 똑같아 보였어. 다른 게 보일 때까지 만져. 그게 공부다.',
        "That's why I'm making you do it. When someone who sees them all the same picks one out, that's an eye. (He runs his palm once down each of the three on the wall.)\n\nFifty years ago I was the same. They all looked alike. Handle them till something's different. That's the lesson.",
        { affinity: 0.03 }),
      d('pricey_one', '제일 비싸 보이는 걸 고르면 되는 거 아닙니까?', "Can't I just pick the one that looks most expensive?",
        '(대답 대신 굵은 대를 손가락으로 툭 친다. 둔한 소리가 난다.) 비싸 보이는 거랑 쓸 만한 거는 다르다.\n\n그렇게 고를 거면 직판장 가서 새 대를 사. 여기선 손으로 고른다. 다시 만져 봐.',
        "(Instead of answering he flicks the thick culm with a finger. It gives a dull sound.) Looking expensive and being usable aren't the same.\n\nIf that's how you choose, go buy a new rod at the market. Here we choose by hand. Handle them again.",
        { affinity: 0 }),
    ],
    completeAdd: [
      d('just_eye', '고르는 눈 하나 얻었으면 됐습니다. 따로 안 주셔도 됩니다.', "Getting an eye for it is enough. You don't need to give me anything.",
        '…눈은 하루 만에 안 생긴다. 오늘 건 첫 마디다. (말은 그렇게 하면서 공방 의자를 하나 내 쪽으로 밀어 준다.)\n\n앉아라. 차는 없다. 대나무 얘기는 있다. 들을 만큼만 들어.',
        "…An eye doesn't grow in a day. Today was the first section. (He says so, but pushes a workshop stool toward me.)\n\nSit. There's no tea. There's bamboo talk. Listen as much as you like.",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      why: [
        '그렇지. 대는 마디로 산다. 사람도 그렇고. (그 대를 내게 건네준다. 아직 대는 아니지만 재료는 된다.)\n\n굵은 건 무겁고, 고운 건 겉만 곱다. 마디가 고르면 휘어도 힘이 한쪽으로 몰리지 않아. 그거 말려서 다시 가져와. 다음엔 깎는 걸 보여 주마.',
        "That's it. A rod lives by its sections. So does a man. (He hands me that culm. Not a rod yet, but it will do as material.)\n\nThe thick one's heavy, the pretty one's pretty only on the outside. With even nodes it bends without the force bunching to one side. Dry it and bring it back. Next time I'll show you the carving.",
      ],
      luck: [
        '운도 손으로 만지고 나서 오는 거다. 다음엔 알고 골라. (품삯 대신 대나무 한 마디를 잘라 준다.)\n\n운이라고 말하는 놈은 그래도 정직한 놈이다. 아는 척하는 놈보다 낫지. 그 마디 가지고 다니면서 심심할 때 두드려 봐. 소리가 들리면 운이 아니게 된다.',
        "Luck comes after your hands have touched it. Next time choose knowing why. (Instead of a wage he cuts me a length of bamboo.)\n\nA man who says luck is at least honest. Better than one who pretends to know. Carry that piece around and tap it when you're bored. Once you can hear it, it stops being luck.",
      ],
      point: [
        '…메모지 같은 건 없다. 여기 있지. (자기 머리를 두드린다. 그러고는 한 장을 찢어 적어 준다.)\n\n적은 걸 외우지는 마라. 종이는 대를 못 만진다. 읽고, 만지고, 틀려 봐. 종이가 필요 없어지면 그때 버려.',
        "…There's no note. It's here. (He taps his head. Then he tears off a sheet and writes it out.)\n\nDon't memorise it. Paper can't touch bamboo. Read it, handle the culms, get it wrong. When you don't need the paper any more, throw it away.",
      ],
    },
  },

  // ── N04-4 「원정 도시락」 · 배누리 ──
  'N04-4': {
    offer: [
      d('serious_mode', '좋아. 어른 체면이 걸렸으니 진지하게 간다.', "Fine. My grown-up pride is on the line, so I'm taking this seriously.",
        '오, 진지 모드! 그럼 도시락은 낚고 나서 드세요. 아, 이미 늦었다. 수아가 벌써 뚜껑 열었어요. (뒤에서 김밥 세는 소리가 들린다.)\n\n여기 아저씨들이 그러는데 부산은 물살이 세대요. 채비 무겁게 하세요. 진주는 벌써 바꿨어요.',
        "Ooh, serious mode! Then eat your lunch after you've caught one. Ah, too late. Sua's already opened the lid. (From behind comes the sound of gimbap being counted.)\n\nThe men round here say the current's strong in Busan. Go with a heavier rig. Jinju's already switched.",
        { affinity: 0.05 }),
      d('ask_cheating', '진주가 왜 반칙인데? 그렇게 잘 낚아?', "Why is Jinju cheating? Is she that good?",
        '반칙이에요. 진주는 던지기 전에 물부터 봐요. 한참 보다가 딱 한 번 던져서 바로 낚아요. (진주 쪽을 가리킨다. 진주는 벌써 채비를 물에 넣었다.)\n\n저는 열 번 던져서 한 번 낚는데 진주는 한 번 던져서 한 번이에요. 그러니까 반칙이죠. 어른 부원님은 저랑 수아만 이기면 돼요.',
        "It's cheating. Jinju looks at the water before she casts. She watches for ages, casts exactly once, and catches straight away. (She points at Jinju. Jinju's rig is already in the water.)\n\nI cast ten times to catch one, and Jinju casts once to catch one. So it's cheating. You only have to beat me and Sua.",
        { affinity: 0.04, flag: 'choice.n04_4_asked_jinju' }),
      d('ask_funds', '원정 경비는 어떻게 했어? 부산까지 차비가 꽤 들 텐데.', "How did you pay for the trip? The fare to Busan can't be cheap.",
        '부비 탈탈 털었어요. 김밥도 부비로 샀고요. 나머지는 각자 용돈. (도시락 가방을 자랑스럽게 들어 보인다.)\n\n그래서 꼭 낚아야 돼요. 빈손으로 가면 부 장부에 원정비만 남잖아요. 그건 너무 슬퍼요.',
        "We shook out every last bit of club funds. The gimbap came out of them too. The rest is everyone's pocket money. (She holds up the lunch bag proudly.)\n\nSo we really have to catch something. If we go home empty-handed, all the club books will show is the trip cost. That'd be too sad.",
        { affinity: 0.04 }),
      d('loser_carries', '학생들보다 먼저라… 진 사람이 돌아갈 때 짐 들기다.', "Before the students… loser carries the bags home.",
        '콜! 제 가방엔 대가 세 개 들었어요. 각오하세요. (손가락으로 V를 그린다.)\n\n아, 진주는 빼고요. 진주가 이기는 건 당연한 거니까 내기에 안 쳐요. 어른 부원님 상대는 저랑 수아예요.',
        "Deal! My bag has three rods in it. Brace yourself. (She flashes a V sign.)\n\nOh, except Jinju. Jinju winning is a given, so she doesn't count in the bet. Your opponents are me and Sua.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('tell_jinju', '진주한테 전해 줘. 오늘은 내가 졌다고.', "Tell Jinju for me. Today, I lost.",
        '직접 하세요! …아, 진주는 직접 하면 도망가지. 알았어요, 전할게요. (진주 쪽으로 달려가 귓속말을 한다. 진주가 이쪽을 한 번 본다.)\n\n봤어요? 진주가 봤어요. 그게 진주식 대답이에요. 다음엔 안 봐준다는 뜻일 거예요, 아마.',
        "Tell her yourself! …Ah, right, she'd run off. Okay, I'll pass it on. (She runs over to Jinju and whispers. Jinju glances this way once.)\n\nSee? Jinju looked. That's a Jinju answer. It probably means she won't go easy on you next time.",
        { affinity: 0.04, affinityOther: [{ npcId: 'mo_jinju', delta: 0.06 }] }),
    ],
    completeReply: {
      lesson: [
        '교본! 좋아요! 진주가 싫어할 텐데… (진주 자세를 따라 하다 내 것도 정돈된다.)\n\n제목은 진주 몰래 정할게요. 말없이 던지는 법. 표지는 진주 뒷모습이에요. 앞모습은 찍으면 화내거든요. 첫 장엔 어른 부원님 이름도 넣을게요. 아이디어 낸 사람.',
        "A manual! Yes! Jinju will hate it, though… (Copying her stance tidies mine as well.)\n\nI'll pick the title behind her back. How to Cast Without a Word. Jinju from behind on the cover. She gets cross if you photograph her face. Your name goes on the first page too. The ideas person.",
      ],
      pay: [
        '있어요! 부비 남은 거… 김밥값 빼고요. (얼마 안 된다.)\n\n인솔비는 원래 지도 선생님 몫인데, 이번 원정은 어른 부원님이 인솔했으니까요. 영수증도 써 드릴까요? 수아가 쓰면 글씨가 예뻐요.',
        "There is one! What's left of club funds… minus the gimbap. (It isn't much.)\n\nA chaperone fee normally goes to the faculty adviser, but this trip you were the one leading us. Want a receipt? Sua's handwriting is really neat.",
      ],
      decline: [
        '어른 부원 최고! (학교 게시판에 원정 사진이 걸렸다. 내가 뒤에 서 있다.)\n\n사진 보고 다른 반 애들이 누구냐고 물어봤어요. 우리 부 어른 부원이라고 했죠. 다들 부러워해요. 다음 원정도 꼭 같이 가요. 그땐 진주보다 먼저 낚기!',
        "Best adult member! (The trip photo goes up on the school board. I'm standing at the back.)\n\nKids from other classes saw the photo and asked who you were. I said, our adult member. Everyone's jealous. Come on the next trip too. And next time, land one before Jinju!",
      ],
    },
  },

  // ── N02-6 「새벽의 첫 대」 · 탁새벽 ──
  'N02-6': {
    offer: [
      d('promise', '좋아. 네 대로 꼭 한 마리 올려 볼게.', "All right. I'll land one on your rod, I promise.",
        '진짜지? 약속이야. (대를 두 손으로 내민다. 손잡이에 감은 실에서 아직 새 냄새가 난다.)\n\n초릿대는 함부로 만지지 마. 거기가 제일 예민해. 입질 오면 대가 먼저 알려 줄 거야. 할아버지가 얇다고 한 거, 틀렸다는 거 보여 줘.',
        "Really? Promise. (He holds the rod out in both hands. The thread on the grip still smells new.)\n\nDon't fiddle with the tip. That's the most sensitive part. When there's a bite, the rod will tell you first. Show Grandpa he was wrong to call it thin.",
        { affinity: 0.05 }),
      d('ask_grandpa', '할아버지가 얇다고만 하셨어? 보시긴 했고?', "Your grandpa just said thin? Did he even look at it?",
        '안 봤어. 보지도 않고 얇대. 그게 다야. (입술을 깨문다. 울지는 않는다.)\n\n할아버지는 원래 말이 짧아. 한마디로 끝내. 그러니까 더 분해. …그래도 이건 잘 만든 거야. 아저씨가 증명해 줘.',
        "He didn't look. Didn't even look and said thin. That's it. (He bites his lip. He doesn't cry.)\n\nGrandpa never says much. One word and done. That makes it worse. …But I made this one well. Prove it for me, Mister.",
        { affinity: 0.04, flag: 'choice.n02_6_asked_grandpa' }),
      d('ask_tip', '초릿대가 뭐가 달라? 네가 어떻게 깎았는데?', "What's different about the tip? How did you carve it?",
        '끝을 더 가늘게 깎았어. 할아버지 대보다 훨씬. 그래서 휘청해. (대 끝을 손가락으로 살짝 튕긴다. 대가 오래 떤다.)\n\n봐, 오래 떨지. 이게 살아 있는 거야. 물고기가 살짝만 건드려도 이게 먼저 알아. 밤에 해 봐. 바람 없는 밤이 제일 좋아.',
        "I carved the end finer. Much finer than Grandpa's. That's why it's whippy. (He flicks the tip lightly with a finger. The rod trembles a long time.)\n\nSee how long it shakes? That's what alive means. Even a fish brushing it, this feels it first. Try it at night. A night without wind is best.",
        { affinity: 0.04 }),
      d('if_snaps', '부러지면 어떡해? 그땐 네가 책임지는 거다.', "What if it snaps? Then it's on you.",
        '안 부러져! (발끈한다.) …부러지면 내가 다시 깎아. 열 번이라도.\n\n그러니까 겁먹고 살살 들면 안 돼. 고기 걸리면 그냥 들어. 대가 휘는 건 부러지는 게 아니야. 휘어야 대지.',
        "It won't snap! (He bristles.) …If it does, I'll carve another. Ten times if I have to.\n\nSo don't go lifting it all scared. When a fish is on, just lift. A rod bending isn't a rod breaking. A rod's meant to bend.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('next_rod', '돈은 됐어. 대신 다음 대도 나한테 제일 먼저 보여 줘.', "Forget the money. Just show me your next rod first.",
        '…다음 대? 벌써? (마루 밑에서 깎다 만 대나무를 슬쩍 꺼내 보인다.)\n\n이건 아직 비밀이야. 할아버지한테 말하지 마. 다 되면 아저씨한테 제일 먼저 보여 줄게. 진짜로. 새끼손가락 걸어.',
        "…My next rod? Already? (From under the porch he sneaks out a half-carved piece of bamboo.)\n\nThis one's still a secret. Don't tell Grandpa. When it's done I'll show you first. For real. Pinky promise.",
        { affinity: 0.09, flag: 'choice.n02_6_next_rod' }),
    ],
    completeReply: {
      praise: [
        '…예민한 거. 그 말 할아버지한테 해 줄래? (다음 날 아이가 대를 하나 더 깎기 시작했다.)\n\n아니다, 하지 마. 내가 할래. 아저씨 말 그대로. 얇은 게 아니라 예민한 거라고. …할아버지가 뭐라고 하든, 나는 이제 알아.',
        "…Sensitive. Will you say that to grandad? (The next day he started cutting another blank.)\n\nNo, don't. I'll say it. Your words exactly. It isn't thin, it's sensitive. …Whatever Grandpa says, I know now.",
      ],
      lesson: [
        '아저씨가 나한테? …좋아. 마디는 소리로 골라. (열두 살한테 배우는 게 부끄럽지 않다.)\n\n손가락으로 톡 쳐서 맑게 울리면 살아 있는 마디야. 둔하면 속이 비었거나 갈라진 거고. 할아버지는 귀로 듣는데, 나는 손끝으로도 들어. 그건 내가 찾은 거야.',
        "Me? Teach you? …All right. You choose sections by sound. (There's no shame in learning from a twelve-year-old.)\n\nTap it with a finger and if it rings clear, it's a live section. If it's dull, it's hollow or split inside. Grandpa listens with his ears, but I listen with my fingertips too. I found that out myself.",
      ],
      pay: [
        '…돈? 용돈밖에 없는데. (진지하게 천 원 지폐를 꺼낸다. 받지 않을 수 없다.)\n\n아껴 둔 거야. 그래도 줘야 돼. 일을 시켰으면 값은 치르는 거래. 할아버지가 그랬어. …나중에 대 팔면 더 줄게.',
        "…Money? I've only got pocket money. (He takes out a thousand-won note, seriously. I can't refuse it.)\n\nI was saving it. I still have to pay. If you make someone work, you pay the price. Grandpa says so. …When I sell rods one day, I'll give you more.",
      ],
    },
  },

  // ── N03-6 「조합장과 선장」 · 강두철(배 이름 · 사연은 끝까지 말하지 않는다) ──
  'N03-6': {
    offer: [
      d('sit_between', '들을게요. 두 분 이야기라면 끝까지 듣겠습니다.', "I'll listen. If it's the two of you talking, I'll hear it all the way through.",
        '고맙네. 그 친구는 말이 없어. 나는 말이 많고. 둘이 앉으면 하나도 안 맞지. (허허 웃는다.)\n\n그래서 자네가 가운데 앉아 줘야 해. 둘이 마주 보면 옛날 생각에 말이 막혀. 사이에 누가 있으면 말이 좀 돌아가지.',
        "Thank you. He doesn't talk. I talk too much. Sit us together and nothing matches. (He chuckles.)\n\nThat's why you need to sit in the middle. Face to face, the old days block our throats. With someone between us, the talk gets moving.",
        { affinity: 0.05 }),
      d('ask_boat', '고 선장님이요? 어떤 배를 같이 타셨는데요?', "Captain Ko? What kind of boat were you on together?",
        '…배 얘기는 그 친구랑 같이 있을 때 하지. 혼자 하면 내 쪽 얘기만 되거든. (말끝을 흐리며 바다 쪽을 본다.)\n\n서른 해야. 손에는 남았는데 입에는 잘 안 붙어. 가 보면 알게 될 거야. 둘 다 말보다 손을 먼저 볼 테니.',
        "…The boat can wait till he's with us. Told by me alone, it's only my side. (He trails off and looks out to sea.)\n\nThirty years. It stayed in the hands, but it doesn't come easily to the mouth. You'll see when we get there. We'll both look at hands before saying a word.",
        { affinity: 0.04, flag: 'choice.n03_6_asked_boat' }),
      d('long_time', '오랜만에 만나시는 거예요? 그동안 연락은 하셨고요?', "Has it been a long time? Did you keep in touch?",
        '오랜만이지. 얼마나 됐는지는… 세다가 그만뒀네. (웃음기가 빠진다.)\n\n바다 사람은 헤어질 때 인사를 잘 안 해. 또 볼 줄 알고. 그러다 세월이 가. 그러니 이번엔 자네가 가운데서 인사 좀 시켜 주게.',
        "It has. How long… I stopped counting. (The laughter drains out of his face.)\n\nSea people don't say much when they part. They think they'll meet again. Then the years go by. So this time, sit between us and get us to say hello.",
        { affinity: 0.04 }),
      d('uproar', '조합장님이 직접 가시면 방어진이 발칵 뒤집히겠는데요.', "If the chairman himself turns up, Bangeojin will be in an uproar.",
        '허허, 그래서 조합장으로 안 가. 그냥 강두철이로 가지. 모자 하나 눌러쓰면 아무도 몰라. (모자를 깊이 눌러써 보인다.)\n\n그 친구 앞에서는 직함이 소용없어. 서른 해 전에 한 배에 탄 사이야. 거기선 나도 그냥 두철이지. 가세, 방어진으로.',
        "Ha, that's why I won't go as chairman. Just as Kang Ducheol. Pull a cap down and nobody knows. (He tugs his cap low to show me.)\n\nIn front of him a title's no use. We were on one boat thirty years ago. There I'm just Ducheol. Come on, to Bangeojin.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('write_down', '두 분 이야기, 배 이름은 빼고 조행록에 적어도 될까요?', "May I write your story in my logbook — leaving out the boat's name?",
        '…적게. 배 이름만 빼고. (한참 말이 없다가 고개를 끄덕인다.)\n\n그 친구 이름을 앞에 적어. 나는 뒤면 돼. 직함 붙은 이름이 앞에 서면 이야기가 무거워져.',
        "…Write it. Just leave out the boat's name. (He's silent a long while, then nods.)\n\nPut his name first. I'll go after. When a name with a title stands in front, the story gets heavy.",
        { affinity: 0.06, flag: 'choice.n03_6_wrote_down' }),
    ],
    completeReply: {
      listen: [
        '…자네가 그렇게 말할 줄 알았네. (두 노인이 나를 자기들 자리에 앉힌다. 방어진과 속초 양쪽에서.)\n\n묻지 않는 것도 듣는 거야. 그 친구가 오늘 자네를 오래 봤어. 말 없는 사람이 오래 보면 그건 마음에 들었다는 뜻이네.',
        "…I knew you'd say that. (The two old men sit me in their own places. In Bangeojin and Sokcho both.)\n\nNot asking is a kind of listening too. He looked at you a long while today. When a quiet man looks at you that long, it means he likes what he sees.",
      ],
      lesson: [
        '손이 말하려면 서른 해가 걸려. 그래도 보는 법은 있지. (선상에서 사람 손을 보는 눈이 생긴다.)\n\n굳은살을 봐. 어디가 두꺼운지 보면 그 사람이 뭘 오래 쥐었는지 나와. 줄인지 키인지 펜인지. 내 손은 요즘 펜 자리가 제일 두껍지. 허허.',
        "It takes thirty years for hands to talk. There's a way to watch, though. (I get an eye for people's hands aboard.)\n\nLook at the calluses. Where they're thickest tells you what someone has gripped longest. A line, a wheel, a pen. These days mine are thickest where the pen goes. Ha.",
      ],
      pay: [
        '그러세. 조합장 출장비에서. (조합 도장이 찍힌 봉투다.)\n\n오늘은 출장 맞아. 옛 동료 만나는 것도 조합 일이지. 바다 사람끼리 이어 주는 게 조합이 하는 일이니까. 받게. 떳떳한 돈이야.',
        "I will. Out of the chairman's travel budget. (The envelope carries the co-op stamp.)\n\nToday really is a work trip. Seeing an old shipmate is co-op business too. Joining sea people together is what a co-op is for. Take it. It's honest money.",
      ],
    },
  },

  // ── N04-5 「진로 상담」 · 배누리 ──
  'N04-5': {
    offer: [
      d('hear_out', '그래. 끝까지 들을게. 천천히 말해.', "Okay. I'll hear you out. Take your time.",
        '…네. (벤치 끝에 앉아 무릎을 끌어안는다. 평소 목소리가 아니다.)\n\n부장일 때는 말이 잘 나오는데, 제 얘기는 이상하게 안 나와요. 중간에 끊지만 말아 주세요. 끝까지 하면… 뭔가 정해질 것 같아서요.',
        "…Okay. (She sits at the end of the bench and hugs her knees. It isn't her usual voice.)\n\nAs captain, the words come easily, but about myself, they just don't. Please don't cut in, that's all. If I get to the end… I feel like something will settle.",
        { affinity: 0.06 }),
      d('ask_school', '수산고? 거기 가면 뭘 배우는데?', "Fisheries high school? What would you learn there?",
        '배 타는 거, 고기 다루는 거, 바다 날씨 보는 거요. 졸업하면 바로 배를 탈 수도 있대요. (운동화 끈을 만지작거린다.)\n\n근데 그게 제가 하고 싶은 건지, 그냥 방파제가 좋아서 그런 건지 모르겠어요. 그 얘기가 하고 싶었어요. 끝까지 들어 주세요.',
        "Working on boats, handling fish, reading the sea's weather. You can go straight onto a boat after you graduate, apparently. (She fiddles with her shoelace.)\n\nBut I don't know if that's what I want, or if I just like the breakwater. That's what I wanted to talk about. Hear me out to the end.",
        { affinity: 0.05, flag: 'choice.n04_5_asked_school' }),
      d('no_adults', '주변에 어른이 없다니. 집에는 얘기 안 해 봤어?', "No adults around you? Haven't you talked about it at home?",
        '…있죠. 근데 이 얘기를 할 수 있는 어른은 없어요. 그런 거 있잖아요. (웃으려다 만다.)\n\n집에서 하면 결정이 돼 버려요. 형한테 하면 그냥 얘기가 되고요. 저는 아직 결정 말고 얘기가 필요해요.',
        "…There are. But there's no adult I can talk about this with. You know how it is. (She starts to smile, then doesn't.)\n\nIf I say it at home, it turns into a decision. If I say it to you, it stays a conversation. Right now I need a conversation, not a decision.",
        { affinity: 0.05 }),
      d('first_time_adult', '나도 어른 노릇은 처음인데. 괜찮겠어?', "I've never done the grown-up thing before. You sure?",
        '괜찮아요. 처음이면 더 좋아요. 처음인 사람은 정답을 안 주거든요. (작게 웃는다.)\n\n정답 주는 어른은 많아요. 학교에도, 학원에도. 저는 그냥 들어 주는 어른이 한 명 필요해요. 형은 방파제에서도 그랬잖아요. 진주한테요.',
        "That's fine. Better if it's your first time. First-timers don't hand out answers. (A small smile.)\n\nThere are plenty of adults with answers. At school, at cram school. I just need one adult who listens. You did that on the breakwater too. With Jinju.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('own_story', '나도 아무것도 모르고 속초에 왔어. 와 보니 길이 생기더라.', "I came to Sokcho knowing nothing either. Once I was here, a path showed up.",
        '…형도요? 몰랐어요. 형은 원래 바다 사람인 줄 알았어요. (처음으로 고개를 들고 나를 본다.)\n\n아무것도 모르고 와도 길이 생기는 거면… 조금 덜 무섭네요. 고마워요. 그 얘기, 진로 상담보다 더 상담 같았어요.',
        "…You too? I didn't know. I thought you'd always been a sea person. (For the first time, she lifts her head and looks at me.)\n\nIf a path shows up even when you arrive knowing nothing… it's a bit less scary. Thanks. That felt more like counselling than the counselling.",
        { affinity: 0.08, flag: 'choice.n04_5_own_story' }),
    ],
    completeReply: {
      listen: [
        '…네. (수산고 원서를 낸다. 그 애가 처음으로 형이라는 말을 편하게 한다.)\n\n형, 고마워요. 진짜로요. 결정은 제가 했는데, 혼자 한 것 같지는 않아요. 그게 좋아요. 수산고 가서도 방파제부는 안 잊을게요. 낚으면 먹는다.',
        "…Yes. (She applies to the fisheries school. For the first time she says 'hyeong' easily.)\n\nThank you. Really. I made the decision myself, but it doesn't feel like I made it alone. I like that. Even at the fisheries school I won't forget the breakwater club. Catch it and eat it.",
      ],
      advise: [
        '…그렇게 말해 주는 어른이 처음이에요. (원서를 낸다. 그러나 결정을 내가 한 것 같아 조금 무겁다.)\n\n네 눈이 바다를 본다, 그 말 적어 둘게요. 나중에 힘들 때 꺼내 보려고요. 형 탓 안 할게요. 고른 건 저예요. 형은 등을 조금 밀어 준 거고요.',
        "…You're the first adult to say that. (She applies. But it sits a little heavy, as if I decided it.)\n\nYour eyes look at the sea. I'm writing that down, to take out when things get hard. I won't blame you. I'm the one who chose. You just gave my back a little push.",
      ],
      pay: [
        '…어른들 농담 진짜 재미없어요. (그래도 웃는다. 라면값을 준다.)\n\n근데 웃었으니까 드릴게요. 웃게 해 준 값이요. 오늘 처음 웃었거든요. 그러니까 이건 농담 값이 아니라 진짜 상담비예요.',
        "…Adults' jokes are really not funny. (She laughs anyway. She pays for ramyeon.)\n\nBut I laughed, so here. For making me laugh. It's the first time today. So this isn't for the joke. It's a real counselling fee.",
      ],
    },
  },

  // ── N03-7 「조합장의 출장」 · 강두철 ──
  'N03-7': {
    offer: [
      d('try_explain', '해 보겠습니다. 틀리면 그때 말씀해 주세요.', "I'll give it a go. Tell me when I get it wrong.",
        '말 안 하네. 오늘은 듣기만 한다고 했잖나. (팔짱을 끼고 한 걸음 뒤로 물러선다.)\n\n틀렸는지는 자네가 알게 될 거야. 설명하다 보면 막히는 데가 있어. 거기가 틀린 데야. 막히면 처음부터 다시 하게. 어디서 잡혔는지부터.',
        "I won't. I said today I'd only listen. (He folds his arms and steps back a pace.)\n\nYou'll find out yourself where you're wrong. As you explain, you'll get stuck somewhere. That's the wrong part. When you're stuck, start over. From where it was caught.",
        { affinity: 0.05 }),
      d('ask_route', '유통 경로라면 어디서부터 어디까지를 말씀하시는 겁니까?', "When you say distribution route, from where to where?",
        '바다에서 밥상까지. 배에서 내린 상자가 위판장을 지나고, 중매인 손을 거쳐 도매로, 소매로 가서 누군가의 접시에 오르기까지.\n\n그 사이에 얼음이 몇 번 갈리고 값이 몇 번 붙는지 말해 보게. 인천은 사람이 많아서 경로도 길어. 그래서 여기서 하자는 거야.',
        "From the sea to the dinner table. A box off the boat goes through the auction, through a broker's hands, to wholesale, to retail, until it's on somebody's plate.\n\nTell me how many times the ice is changed and how many times a price is added on the way. Incheon has a lot of people, so the routes are long. That's why we're doing it here.",
        { affinity: 0.04, flag: 'choice.n03_7_asked_route' }),
      d('no_act', '이번엔 왜 초보 행세를 안 하십니까?', "Why aren't you playing the beginner this time?",
        '허허, 들킨 지가 언젠데. 그리고 오늘은 배우러 온 게 아니야. 보러 온 거지. (뒷짐을 진다.)\n\n선생이 얼마나 컸는지 보는 건 학생의 특권이야. 그 특권 좀 쓰겠네. 뒤에서 조용히.',
        "Ha, you caught me out long ago. And today I didn't come to learn. I came to watch. (He clasps his hands behind his back.)\n\nSeeing how far your teacher has come is a student's privilege. I'll use it a little. Quietly, from behind.",
        { affinity: 0.04 }),
      d('nervous', '조합장님 앞에서 설명이라니, 긴장되는데요.', "Explaining in front of the chairman — that makes me nervous.",
        '그러니 뒤에 서 있겠다는 거야. 얼굴 보면 더 떨려. (등을 돌려 보인다.) 됐나? 이제 안 보이지.\n\n긴장하는 건 좋은 거야. 아무렇지 않으면 대충 하거든. 처음 방파제에서 내 실 풀어 줄 때도 십 분 걸렸지. 그래도 다 풀었잖나.',
        "That's why I'll stand behind you. Seeing a face makes it worse. (He turns his back to show me.) Better? You can't see me now.\n\nNerves are good. When you don't care, you get sloppy. That first day on the breakwater, untangling my line took you ten minutes. But you got it all undone.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('asked_origin', '어르신은 이 길을 처음에 누구한테 배우셨습니까?', "Who taught you all this in the first place?",
        '허허, 그건 서른 해 묵은 얘기라 꺼내면 해가 지네. (손을 젓는다.)\n\n하나만 말하지. 누구한테 배웠는지보다 몇 번 틀렸는지가 중요해. 나는 많이 틀렸어. 자네는 오늘 한 번도 안 틀렸고. 그게 서운할 정도야.',
        "Ha, that's a thirty-year-old story. Start on it and the sun'll set. (He waves it off.)\n\nI'll say one thing. How often you got it wrong matters more than who taught you. I got it wrong plenty. You didn't once today. I'm almost put out.",
        { affinity: 0.06, flag: 'choice.n03_7_asked_origin' }),
    ],
    completeReply: {
      grown: [
        '…자네. (조합장이 은퇴 이야기를 처음 꺼낸다.)\n\n선생이 다 크면 학생은 물러날 때를 알아야 하는 법이야. …아직 정한 건 없네. 속초에 가서 마저 하지. 오늘은 인천 바람이나 쐬고.',
        "…My friend. (The chairman raises retirement for the first time.)\n\nWhen the teacher's grown, the student ought to know when to step back. …Nothing's decided yet. We'll finish this talk in Sokcho. Today, let's just take the Incheon air.",
      ],
      lesson: [
        '틀린 데 없어. 순서만. 소비자부터 거꾸로 가면 더 잘 보여. (유통 이해가 한 단계 오른다.)\n\n접시 위 값에서 하나씩 빼 보게. 소매 몫, 도매 몫, 얼음과 기름값. 끝에 남는 게 어부 몫이야. 그게 얼마나 작은지 알면 위판장에서 함부로 값을 깎지 못해.',
        "Nothing wrong. Only the order. Work backwards from the consumer and it's clearer. (My grasp of distribution rises a step.)\n\nTake the price on the plate and subtract, piece by piece. The retailer's share, the wholesaler's, ice and fuel. What's left at the end is the fisherman's share. Once you see how small it is, you won't haggle carelessly at an auction.",
      ],
      pay: [
        '강의료! 허허. 조합장 사비로. (봉투가 두껍다.)\n\n오늘 강의는 그 값을 하고도 남았어. 인천 바닥 중매인들도 저렇게는 설명 못 해. 받게. 학생이 내는 수업료야.',
        "A lecture fee! Ha. Out of the chairman's own pocket. (The envelope is thick.)\n\nToday's lecture was worth that and more. Even the brokers on the Incheon floor couldn't explain it like that. Take it. Tuition, from the student.",
      ],
    },
  },

  // ── N04-6 「졸업한 부원들」 · 배누리 ──
  'N04-6': {
    offer: [
      d('best_spot', '다들 왔구나! 깃발은 제일 잘 보이는 데 걸자.', "You all came! Let's hang the flag where it shows best.",
        '네! 2층 창가요. 바다 보이는 데. (깃발을 펼친다. 낚으면 먹는다, 글씨가 바래 있다.)\n\n걸기 전에 하나 해요. 옛날처럼 나란히 서서 낚기. 다 같이 한 마리씩. 그래야 깃발이 진짜 우리 거 같잖아요. 형도 같이요.',
        "Yes! By the window upstairs. Where you can see the sea. (She unfurls the flag. Catch it and eat it — the letters have faded.)\n\nLet's do one thing before we hang it. Stand in a row and fish, like the old days. One each. Then the flag really feels like ours. You too.",
        { affinity: 0.06 }),
      d('ask_boat', '진주가 배를 탄다고? 무슨 배?', "Jinju's working a boat? What kind of boat?",
        '…그건 진주한테 직접 물어보세요. 제가 말하면 진주가 삐져요. (진주 쪽을 슬쩍 본다. 진주는 바다만 보고 있다.)\n\n하나만 말하자면, 형 배는 아니래요. 그 말은 꼭 전해 달래요. 무슨 뜻인지는 저도 몰라요. 자, 나란히 한 마리씩 낚고 깃발 걸어요!',
        "…Ask Jinju that yourself. If I say it, she'll sulk. (She glances at Jinju. Jinju is looking only at the sea.)\n\nI'll tell you one thing. It's not your boat, she says. She made me promise to pass that on. What it means, I don't know either. Come on, one fish each side by side, then the flag!",
        { affinity: 0.04, flag: 'choice.n04_6_asked_boat' }),
      d('ask_sua_nuri', '수아는 대학 생활 어때? 넌 수산고 3학년이고?', "How's Sua finding university? And you're in your final year?",
        '수아는 대학 가서도 계획 세우고 있어요. 오늘 깃발 거는 순서도 수아가 짰어요. (수아가 멀리서 수첩을 흔든다.)\n\n저는 수산고 3학년이요. 배 매듭은 이제 형보다 잘 묶을걸요? 나중에 시합해요. 진 사람이 라면 사기. 오늘은 일단 나란히 한 마리씩이요.',
        "Sua's still making plans at university. She even planned the order for hanging the flag today. (Far off, Sua waves a notebook.)\n\nAnd me, final year at the fisheries school. I bet I tie boat knots better than you now. Let's have a match sometime. Loser buys ramyeon. Today, though, one fish each, side by side.",
        { affinity: 0.05 }),
      d('old_member', '어른 부원이 이제 진짜 늙은 부원이 됐네.', "The adult member's turned into the old member now.",
        '하하, 늙은 부원이라니요! 우리 부엔 그런 거 없어요. 어른 부원은 어른 부원이에요. (깃발 봉으로 내 어깨를 톡 친다.)\n\n저희도 이제 거의 어른이에요. 근데 여기 오니까 다시 열일곱 같아요. 방파제 냄새 때문인가 봐요. 자, 깃발 걸기 전에 한 마리씩이요!',
        "Ha, old member? No such thing in our club. An adult member's an adult member. (She taps my shoulder with the flagpole.)\n\nWe're nearly adults ourselves now. But coming here, I feel seventeen again. Must be the smell of the breakwater. Right, before the flag goes up, one fish each!",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('teach_me', '수산고에서 배운 거 하나만 알려 줘. 이번엔 네가 선배다.', "Teach me one thing from the fisheries school. This time you're the senior.",
        '제가 선배요? 와… 그럼 하나만요. 배에서 쓰는 매듭이요. 고리가 안 조여서 사람 몸에 감아도 돼요. (깃발 끈으로 천천히 묶어 보인다.)\n\n이건 한 손으로도 묶을 수 있어야 한대요. 다른 손은 배를 잡고 있어야 하니까요. 어른 부원님을 가르치는 날이 오다니. 수아한테 자랑할 거예요.',
        "Me, the senior? Wow… just one, then. A knot they use on boats. The loop doesn't tighten, so you can even put it round a person. (She ties it slowly with the flag cord.)\n\nYou're supposed to be able to tie it one-handed. Your other hand has to hold on to the boat. I can't believe the day's come when I'm teaching our adult member. I'm telling Sua.",
        { proficiency: { category: 'driving', xp: 28 }, affinity: 0.06 }),
    ],
    completeReply: {
      forever: [
        '네! (셋이 부 배지를 하나 더 준다. 어른 부원 전용이라며 금색이다.)\n\n금색은 수아가 칠했어요. 진주가 모양을 잡고요. 저는… 이름을 붙였어요. 영원 배지. 유치하죠? 그래도 달아 주세요. 2층 깃발 밑에서 사진 찍을 때요.',
        "Yes! (The three of them give me another badge. Adult members only, in gold.)\n\nSua painted the gold. Jinju did the shape. Me… I named it. The forever badge. Childish, right? Wear it anyway. When we take the photo under the flag upstairs.",
      ],
      jinju: [
        '…네. 제 배로요. (진주가 처음으로 웃는다. 배누리가 사진을 찍는다.)\n\n찍었다! 진주 웃는 거 찍었어요! 이거 부 일지 마지막 장에 붙일 거예요. 진주야, 약속했다? 형이랑 네 배에서. 우리도 끼워 줘.',
        "…Yes. My boat. (Jinju smiles for the first time. Bae Nuri takes a photo.)\n\nGot it! I got Jinju smiling! This is going on the last page of the club log. Jinju, you promised, okay? On your boat, with our adult member. Squeeze us in too.",
      ],
      pay: [
        '부비… 이제 없어요, 졸업해서. (셋이 주머니를 턴다. 라면값. 받는다.)\n\n그래도 부 장부는 아직 있어요. 마지막 줄에 적을게요. 깃발 거는 값, 라면 한 그릇. 이걸로 장부 끝이에요. 형한테 준 게 마지막 지출이에요.',
        "Funds… we haven't any. We graduated. (The three of them empty their pockets. Ramyeon money. I take it.)\n\nThe club account book's still around, though. I'll put it on the last line. Flag hanging fee, one bowl of ramyeon. That closes the books. You're our very last expense.",
      ],
    },
  },
};
