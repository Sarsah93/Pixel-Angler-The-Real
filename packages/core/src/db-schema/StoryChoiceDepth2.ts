/**
 * @file StoryChoiceDepth2.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 2묶음: 메인 3 · 4장(M3-01 ~ M4-11).
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { d } from './StoryChoiceDepthKit.js';

export const CHOICE_DEPTH_2: Record<string, ChoiceDepthEntry> = {
  // ── M3-01 「방어진 입항」 · 고만석 ──
  'M3-01': {
    offer: [
      d('sign_on', '어촌계 소개로 왔습니다. 이름 쓰고 조끼 입겠습니다.', "The co-op sent me. I'll sign the list and get the vest on.",
        '소개는 부두에서 끝이다. 배에 오르면 누가 보냈든 다 같은 짐이야. (명부 볼펜을 턱으로 가리킨다.)\n\n처음 타는 놈은 배 가운데 앉아. 거기가 제일 덜 흔들린다. 방어 한 마리 올리고 한 항차 버티면, 그때부터 짐 말고 사람으로 쳐 주지.',
        "An introduction ends at the pier. Once you're aboard, it doesn't matter who sent you — you're cargo like everyone else. (He points his chin at the pen on the list.)\n\nFirst-timers sit in the middle of the boat. It moves least there. Land one yellowtail and last one trip, and I'll count you as a person instead of cargo.",
        { affinity: 0.03 }),
      d('ask_list', '명부에는 왜 꼭 이름을 써야 합니까?', 'Why does my name have to go on the list?',
        '바다에서 사람이 없어지면 제일 먼저 꺼내 보는 게 그 종이다. 누가 탔는지 모르면 누굴 찾아야 하는지도 몰라.\n\n이름 없는 놈은 빠져도 아무도 안 찾는다. 그러니까 또박또박 써. 다 썼으면 조끼.',
        "When someone goes missing at sea, that sheet is the first thing anyone pulls out. If nobody knows who was aboard, nobody knows who to look for.\n\nGo over with no name on the list and nobody searches. So write it clearly. Then the vest.",
        { affinity: 0.02, flag: 'choice.m3_01_asked_list' }),
      d('seasick_joke', '멀미하면 내리는 건 아니죠? 그건 자신이 없어서요.', "Throwing up doesn't get me put ashore, does it? I can't promise on that one.",
        '멀미로 내리면 이 배엔 나 혼자 남는다. (코웃음을 친다.)\n\n토할 거면 바람 불어 가는 쪽으로 해. 거꾸로 하면 네 얼굴로 돌아온다. 뛰는 놈은 내리고, 토하는 놈은 탄다. 그게 이 배 규칙이야. 명부부터 써.',
        "If seasickness got people off, I'd be the only one left on this boat. (He snorts.)\n\nIf you're going to be sick, do it on the downwind side. The other way, it comes back in your face. The ones who run get off; the ones who throw up stay on. That's this boat's rule. Sign the list.",
        { affinity: 0.02, flag: 'choice.m3_01_seasick_joke' }),
      d('father_rod', '제 대로 해도 되겠습니까? 아버지 대를 가져왔습니다.', "Can I use my own rod? I brought my father's.",
        '…좋은 대네. (손잡이를 한 번 보고 눈을 뗀다.) 그러니까 조심해.\n\n방어는 대를 꺾으러 무는 놈이다. 드랙 풀어 두고, 버티지 말고 줘. 대가 버티면 대가 진다. 아끼는 대면 더 그렇게 써. 이름 쓰고 타.',
        "…That's a good rod. (He glances at the grip once and looks away.) So be careful with it.\n\nA yellowtail bites like it means to break the rod. Back the drag off, don't fight it, give it line. If the rod holds out, the rod loses. All the more if it's one you treasure. Sign the list and get aboard.",
        { affinity: 0.01, flag: 'choice.m3_01_father_rod' }),
    ],
    completeAdd: [
      d('not_again', '솔직히 다시 타고 싶지 않습니다.', "Honestly, I don't want to go out again.",
        '…첫날은 다들 그렇게 말한다. 말한 놈 반은 다음 주에 또 와. (명부를 덮지 않고 펴 둔다.)\n\n안 오면 안 오는 거다. 그래도 네 이름 아래 칸은 비워 둔다. 지깅은 기다려 주지 않지만, 빈칸은 기다려 준다.',
        "…Everyone says that the first day. Half of them are back next week. (He leaves the list open instead of closing it.)\n\nIf you don't come, you don't. But I'll leave the line under your name empty. Jigging won't wait for you. An empty line will.",
        { affinity: 0.01, flag: 'choice.m3_01_reluctant' }),
      d('ask_jig', '지깅은 처음입니다. 대는 뭘 챙겨야 합니까?', "I've never done jigging. What rod should I bring?",
        '가진 거 다 가져와. 보고 정한다. 처음부터 비싼 거 사 오는 놈은 비싼 걸 바다에 빠뜨려.\n\n그리고 팔 운동이나 해 둬. 지깅은 대보다 팔이 먼저 나간다. (어깨를 한 번 돌려 보인다.)',
        "Bring whatever you've got. I'll look and decide. The ones who buy expensive kit on day one drop expensive kit in the sea.\n\nAnd work on your arms. With jigging the arms go before the rod does. (He rolls one shoulder to show me.)",
        { affinity: 0.03, flag: 'choice.m3_01_asked_jig' }),
    ],
    completeReply: {
      seasick: [
        '다시 탄다는 놈은 괜찮아진다. 멀미약은 배에 있다. (다음 항차 명부에 내 이름이 먼저 적힌다.)\n\n멀미는 속이 아니라 눈이 하는 거다. 다음엔 발밑 말고 수평선을 봐. 그리고 빈속으로 타지 마라. 빈속이 먼저 뒤집힌다.',
        "Anyone who goes out again gets over it. The tablets are on the boat. (My name goes first on the next sailing list.)\n\nSeasickness starts in the eyes, not the gut. Next time look at the horizon, not your feet. And don't come aboard on an empty stomach. An empty one turns first.",
      ],
      horizon: [
        '…그걸 봤으면 됐다. 배는 그거 보려고 타는 거야. (짧게, 처음으로 내 눈을 본다.)\n\n육지에선 수평선이 가만히 있지. 배에선 수평선이 아니라 네가 움직이는 거다. 그걸 몸이 알면 멀미도 반은 간다.',
        "…If you saw that, it was enough. That's what you get on a boat for. (Briefly, for the first time, he meets my eye.)\n\nOn land the horizon stays put. On a boat it isn't the horizon moving — it's you. Once your body knows that, half the seasickness goes.",
      ],
    },
  },

  // ── M3-02 「지깅」 · 고만석 ──
  'M3-02': {
    offer: [
      d('keep_at_it', '지깅은 처음입니다. 한 마리 올릴 때까지 해 보겠습니다.', "I've never jigged before. I'll keep at it till one comes up.",
        '끝까지 하겠다는 놈이 세 번 올리고 팔이 끝난다. 힘으로 치니까. (손목을 두 번 짧게 튕겨 보인다.)\n\n이렇게. 짧게 치고 줄을 감아. 떨어질 때 줄이 멈추거나 옆으로 흐르면 그게 입질이다. 그때 감아. 40 넘는 놈은 거기서 온다.',
        "The ones who say they'll keep at it are done after three lifts. They jerk with strength. (He flicks his wrist twice, short.)\n\nLike that. Short jerk, then wind. On the fall, if the line stops or drifts sideways, that's the bite. Wind then. The ones over forty come right there.",
        { affinity: 0.04 }),
      d('ask_fall', '폴링에서 문다는 게 무슨 뜻입니까?', 'What do you mean, they take it on the fall?',
        '지그가 가라앉는 동안이다. 저킹으로 튀어 오른 지그가 힘 빠진 고기처럼 떨어질 때, 방어가 덮친다.\n\n그래서 떨어질 때 손을 놓으면 안 돼. 줄이 늘어지면 입질을 못 느낀다. 살짝 잡고 따라 내려가. 그게 반이야. 내려 봐.',
        "While the jig is sinking. When the jerk throws it up and it falls back like a fish that's given up, that's when a yellowtail hits.\n\nSo don't let go on the fall. Slack line and you won't feel the bite. Keep a light hold and follow it down. That's half the job. Drop it.",
        { affinity: 0.03, flag: 'choice.m3_02_asked_fall' }),
      d('ask_forty', '왜 하필 40입니까? 작은 건 안 됩니까?', "Why forty, exactly? Don't the small ones count?",
        '숫자는 핑계다. 작은 놈은 아무렇게나 해도 문다. 운으로도 올라와.\n\n40 넘는 놈은 리듬이 맞아야 온다. 네 리듬을 보려는 거다. (먼 바다 쪽으로 턱을 든다.) 운 말고 손으로 올려 봐.',
        "The number's an excuse. Small ones bite whatever you do. Luck brings them up.\n\nThe ones over forty only come when the rhythm is right. I want to see your rhythm. (He lifts his chin toward open water.) Bring one up with your hands, not your luck.",
        { affinity: 0.02, flag: 'choice.m3_02_asked_forty' }),
      d('power', '팔 힘이라면 자신 있습니다. 세게 치면 되죠?', "Arm strength I've got. I just jerk it hard, right?",
        '…세게 치는 놈 지그는 춤을 안 춘다. 바닥만 긁고 끝나. 힘 자랑은 부두에서 해라.\n\n해 봐. 세 번 올리면 알 거다. 팔이 먼저 우는지, 방어가 먼저 무는지. 울면 그때 다시 와.',
        "…A jig jerked hard doesn't dance. It just scrapes the bottom. Show off your strength on the pier.\n\nGo on, try it. Three lifts and you'll know. Whether your arms cry first or a yellowtail bites first. If they cry, come back to me.",
        { affinity: -0.01, flag: 'choice.m3_02_power' }),
    ],
    completeAdd: [
      d('father_hand', '고만석 씨가 손을 잡았을 때, 아버지 생각이 났습니다.', 'When you took my hand, I thought of my father.',
        '…배 위에서 그런 소리 하지 마라. 눈에 소금물 들어간다. (돌아서서 엔진 쪽으로 간다.)\n\n(한참 엔진 소리만 난다.) 손이 기억하는 건 오래 간다. 그 리듬 잊지 마. 누가 잡아 줬는지도.',
        "…Don't say things like that on a boat. You'll get salt water in your eyes. (He turns away toward the engine.)\n\n(For a long while there's only the engine.) What the hands remember lasts. Don't forget that rhythm. Or who set it for you.",
        { affinity: 0.05, flag: 'choice.m3_02_father_hand' }),
    ],
    completeReply: {
      rhythm: [
        '기억했으면 됐다. 다음엔 안 잡아 준다. (지깅 대를 넘긴다. 손잡이가 닳아 있다.)\n\n리듬은 사람마다 다르다. 내 걸 가르친 게 아니라 네 거에서 군더더기를 뺀 거다. 다음 항차에 팔이 덜 아프면 그게 증거야.',
        "Then it's done. I won't set it for you next time. (He passes over a jigging rod. The grip is worn smooth.)\n\nEveryone's rhythm is different. I didn't teach you mine — I took the waste out of yours. If your arms hurt less next trip, that's the proof.",
      ],
      arms: [
        '…젊네. 던져. 대는 이걸로. (이날 조황이 배에서 두 번째로 좋았다.)\n\n그래도 마지막 한 번은 남겨 둬라. 팔 다 쓴 놈은 대물 걸리면 못 버틴다. 바다는 꼭 지쳤을 때 큰 걸 보낸다.',
        "…Youth. Cast, then. Use this rod. (That day's catch was second best on the boat.)\n\nBut always keep one cast in reserve. Someone who's spent his arms can't hold a big one. The sea always sends the big one when you're tired.",
      ],
    },
  },

  // ── M3-03 「실기 시험」 · 동명항 어촌계(계장) ──
  'M3-03': {
    offer: [
      d('trust_once', '한 번은 떨어져도 된다는 말, 믿고 해 보겠습니다.', "I'll take you at your word that failing once is fine, and give it a go.",
        '믿으라고 한 말 아니다. 떨어져 보라고 한 말이다. 떨어져 봐야 어디서 손이 떠는지 안다.\n\n두 번째부터는 핑계가 없어. 첫 번째 떨어진 자리를 기억해 두는 게 두 번째 시험이다. 가서 부두부터 봐 둬.',
        "I didn't say it so you'd trust it. I said it so you'd try failing. You only learn where your hands shake by failing once.\n\nAfter that, no excuses. Remembering where you failed the first time is the second exam. Go and look at the pier first.",
        { affinity: 0.04 }),
      d('ask_rescue', '인명구조는 어떻게 봅니까? 사람이 진짜 빠집니까?', 'How do they test the rescue? Does someone actually go in?',
        '사람 대신 부이 하나를 던진다. 그걸 사람이라고 생각하고 건져.\n\n바람을 안고 다가가고, 가까워지면 기어를 빼. 프로펠러가 사람을 다치게 한다. 그거 하나 틀리면 나머지를 다 잘해도 떨어진다. 잊지 말고 가.',
        "They throw a buoy in place of a person. You treat it like a person and get it out.\n\nCome at it head to wind, and take her out of gear when you're close. The propeller is what hurts people. Get that one thing wrong and you fail, however good the rest is. Don't forget it. Go.",
        { affinity: 0.03, flag: 'choice.m3_03_asked_rescue' }),
      d('ask_twice', '두 번째도 떨어지면 어떻게 됩니까?', 'And if I fail the second time too?',
        '그럼 한 철 늦는 거지. 면허는 안 도망간다. 대신 네 배가 한 철 늦게 온다. (서류철을 덮는다.)\n\n겁주려는 말 아니다. 두 번째엔 손이 덜 떤다. 다들 그랬어. 떨어질 걱정 말고 계류부터 연습해.',
        "Then you're a season late. The licence won't run off. Your boat just comes a season later. (He shuts the file.)\n\nI'm not trying to scare you. On the second try the hands shake less. Everyone's did. Stop worrying about failing and practise your mooring.",
        { affinity: 0.01, flag: 'choice.m3_03_asked_twice' }),
      d('scrape_joke', '부두를 긁으면 수리비는 계에서 내 주십니까?', 'If I scrape the pier, does the co-op pay for the repairs?',
        '시험장 부두는 긁히라고 있는 거다. (입꼬리가 아주 조금 움직인다.)\n\n네 배 생기면 그땐 다 네 돈이다. 그러니까 남의 부두 긁을 때 많이 배워 둬. 긁어도 되는 날은 오늘뿐이야. 가 봐.',
        "The exam pier is there to be scraped. (The corner of his mouth moves, just barely.)\n\nOnce you've got your own boat, it's all your money. So learn plenty while it's someone else's pier you're scraping. Today's the only day scraping is allowed. Go on.",
        { affinity: 0, flag: 'choice.m3_03_scrape_joke' }),
    ],
    completeAdd: [
      d('show_okseon', '합격증은 정옥선 씨께 먼저 보여 드리겠습니다.', "I'll show the certificate to Okseon first.",
        '그래라. 네 보증 선 사람이 그 사람이다. (잠깐 말을 고른다.)\n\n가거든 합격증보다 얼음부터 날라. 그 사람은 그걸 더 좋아한다. 축하는 손으로 하는 거라고 생각하는 사람이니까.',
        "Do that. She's the one who stood guarantee for you. (He takes a moment over his words.)\n\nWhen you get there, carry the ice before you show the certificate. She'll like that better. She thinks congratulations are something you do with your hands.",
        { affinity: 0.05, flag: 'choice.m3_03_show_okseon' }),
    ],
    completeReply: {
      failed_once: [
        '그게 정상이다. 한 번에 붙은 놈이 배를 더 잘 긁는다. (축하금 봉투가 두툼하다.)\n\n떨어진 날 뭘 틀렸는지 적어 둬라. 계류에서 한 번 긁은 놈은 평생 계류 앞에서 숨을 한 번 더 고른다. 그 숨이 배를 살린다.',
        "That's normal. The ones who pass first time scrape more hulls later. (The congratulations envelope is thick.)\n\nWrite down what you got wrong the day you failed. Someone who's scraped once takes one more breath before every mooring for the rest of his life. That breath saves boats.",
      ],
      boat_dream: [
        '돈부터 모아. 배는 사는 게 아니라 버티는 거다. (봉투에 중고 선박 시세표가 끼워져 있다.)\n\n시세표 보고 놀라지 마라. 배값보다 무서운 게 유지비다. 기름, 검사, 수리. 그래도 갖고 싶으면 그때 다시 말해.',
        "Save up first. You don't buy a boat, you endure one. (Tucked in the envelope is a price list for used hulls.)\n\nDon't faint at the price list. The upkeep is scarier than the price. Fuel, inspections, repairs. If you still want one after that, tell me again.",
      ],
    },
  },

  // ── M3-04 「덕장」 · 바람 ──
  'M3-04': {
    offer: [
      d('learn_dry', '배우겠습니다. 빈 덕장이 아깝습니다.', "I'll learn. It's a waste, the racks standing empty.",
        '아깝지. 덕장은 비어 있으면 그냥 장대야. 뭐라도 걸려야 덕장이 돼. (담뱃재를 턴다.)\n\n먼저 걸 놈을 낚아 와. 세 마리. 말리는 건 그다음이야. 서두르면 안 마르고 상해. 바람한테 맡기는 일이거든.',
        "It is. Empty racks are just poles. Something has to hang there before it's a drying yard. (He taps off his ash.)\n\nFirst go and catch something to hang. Three fish. The drying comes after. Rush it and it spoils instead of drying. It's work you leave to the wind.",
        { affinity: 0.04 }),
      d('ask_herring', '청어가 왜 안 듭니까? 원래는 많았습니까?', "Why won't the herring come? Were there lots once?",
        '많았지. 과메기는 원래 청어로 말리던 거야. 청어가 안 들면서 꽁치로 넘어갔고, 이제 그것도 들쭉날쭉해.\n\n물이 데워지면 고기 길이 바뀌어. 사람이 바다를 못 바꾸니까 사람이 바뀌는 거지. 그러니까 배워. 뭐든 말릴 줄 알게.',
        "Plenty. Gwamegi was herring, originally. When the herring stopped coming it went over to saury, and now even that comes and goes.\n\nWhen the water warms, the fish change their roads. People can't change the sea, so people change. So learn it. Learn to dry whatever comes.",
        { affinity: 0.03, flag: 'choice.m3_04_asked_herring' }),
      d('ask_baram', '리어카로 여기까지 오신 겁니까? 덕장 일도 하십니까?', 'You came all this way with the handcart? Do you work the racks too?',
        '바람이 어디 정해 놓고 부나. 리어카 세운 데가 오늘 내 자리야. (담배 연기를 길게 뺀다.)\n\n덕장 일은 안 해. 덕장 앞에 서 있는 거지. 내 얘기는 됐고, 너는 말리는 거나 배워. 그게 오늘 일이야.',
        "Does the wind decide in advance where it blows? Wherever I park the handcart is my spot for the day. (He lets out a long stream of smoke.)\n\nI don't work the racks. I stand in front of them. Never mind me — you learn the drying. That's today's job.",
        { affinity: 0.02, flag: 'choice.m3_04_asked_baram' }),
      d('doubt_dry', '저는 낚는 사람인데, 말리는 것까지 해야 합니까?', 'I catch fish. Do I have to dry them as well?',
        '낚는 사람이니까 해야지. 잡아 놓고 못 다루면 바다한테 빌린 걸 버리는 거야.\n\n그리고 말리는 걸 알면 낚시도 달라져. 어떤 놈이 잘 마르는지 알게 되거든. 손해 보는 장사 아니야. 해 봐.',
        "You catch them, so yes. Catch something and not know how to handle it, and you're throwing away what you borrowed from the sea.\n\nAnd once you know drying, your fishing changes. You learn which fish dry well. It's no losing trade. Try it.",
        { affinity: 0, flag: 'choice.m3_04_doubt' }),
    ],
    completeAdd: [
      d('herring_back', '청어가 다시 들면 그때도 불러 주십시오.', 'If the herring ever come back, call me then too.',
        '청어가 다시 들지는 바다가 정하지. 나는 몰라. (빈 담뱃갑을 흔들어 본다.)\n\n그래도 그때 내가 여기 있으면 부를게. 없으면 덕장 주인이 부르겠지. 기다릴 줄 아는 사람은 다시 불려. 그게 덕장 법이야.',
        "Whether the herring come back is the sea's call. I wouldn't know. (He shakes an empty cigarette packet.)\n\nBut if I'm here then, I'll call you. If I'm not, the rack owner will. People who know how to wait get called back. That's the law of the racks.",
        { affinity: 0.04, flag: 'choice.m3_04_herring_back' }),
    ],
    completeReply: {
      wait: [
        '그래서 다들 못 해. 너는 했잖아. (덕장 주인이 말린 것 한 줄을 싸 준다.)\n\n잡는 건 하루고 말리는 건 한참이야. 그 한참을 버틴 사람한테만 과메기가 남아. 한 점 먹어 봐. 왜 기다렸는지 혀가 알 거야.',
        "That's why nobody manages it. You did. (The drying-yard owner wraps up a string of the cured fish for me.)\n\nCatching takes a day; drying takes ages. Gwamegi is only left for whoever lasts the ages. Have a piece. Your tongue will know why you waited.",
      ],
      change: [
        '남겨. 나도 누구한테 들은 말이야. (담배를 끄고 리어카를 끈다.)\n\n좋은 말은 주인이 없어. 들은 사람이 쓰면 그 사람 거야. 다음 항구에서 누가 막혀 있으면, 그땐 네가 해 줘.',
        "Let it. Somebody said it to me once, too. (He stubs out his cigarette and takes up the handcart.)\n\nA good saying has no owner. Whoever uses it, it's theirs. Next harbour, if you find someone stuck, you say it to them.",
      ],
    },
  },

  // ── M3-05 「해무」 · 고만석 ──
  'M3-05': {
    offer: [
      d('turn_back', '돌아가겠습니다. 고기는 다음에 낚으면 됩니다.', "Let's turn back. The fish can wait for another day.",
        '…빨리도 정하네. 맞는 답이다. 다만 덮기 전에 두 마리는 올리고 돌린다. 빈손으로 들어가면 손님들 입이 나와.\n\n안개가 뱃전까지 오면 그땐 고기고 뭐고 없다. 그 전에 키 돌린다. 네가 정한 거다. 끝까지 지켜.',
        "…Quick decision. It's the right one. But we land two before it closes in, then turn. Go back empty-handed and the customers sulk.\n\nOnce the fog reaches the gunwale, there's no fish and no anything. We turn before that. That was your call. See it through.",
        { affinity: 0.05, flag: 'choice.m3_05_turn_back' }),
      d('ask_fog', '해무는 얼마나 빨리 덮칩니까?', 'How fast does sea fog close in?',
        '모른다. 그게 해무다. 바다가 차고 공기가 따뜻하면 바다가 김을 뿜어. 십 분 만에 부두가 지워진 날도 있다.\n\n그래서 정하는 건 빨라야 해. 안개 안에서 정하면 늦어. 안개가 보일 때 정하는 거다. 지금처럼. 정해.',
        "Nobody knows. That's sea fog. Cold sea, warm air, and the sea starts steaming. There've been days the pier vanished in ten minutes.\n\nSo the deciding has to be quick. Decide inside the fog and you're too late. You decide when you can see it coming. Like now. Decide.",
        { affinity: 0.03, flag: 'choice.m3_05_asked_fog' }),
      d('ask_skipper', '고만석 씨라면 어떻게 하시겠습니까?', 'What would you do, Manseok?',
        '내 배니까 나는 안다. 근데 오늘 묻는 건 너다. (팔짱을 낀다.)\n\n언젠가 네 배에서 안개를 만나면 물어볼 사람이 없어. 그날을 위해 지금 정해 보는 거다. 틀려도 오늘은 내가 있다. 정해.',
        "It's my boat, so I know. But today you're the one being asked. (He folds his arms.)\n\nSomeday you'll hit fog on your own boat with nobody to ask. You're deciding now for that day. Even if you're wrong, I'm here today. Decide.",
        { affinity: 0.02, flag: 'choice.m3_05_asked_skipper' }),
      d('push_on', '조금만 더 가 보면 안 됩니까? 아직 빈손입니다.', "Can't we push on a little? We've nothing to show yet.",
        '…빈손이 무서우면 바다에 나오지 마라. 그 말 하는 놈들이 제일 많이 안 돌아온다.\n\n정 그러면 이 자리에서, 덮기 전에 두 마리. 거기까지다. 그다음엔 네가 키를 돌리는 거다. 내가 아니라.',
        "…If an empty hold scares you, don't come to sea. The ones who say that are the ones who most often don't come back.\n\nIf you must, then right here, two fish before it closes in. That's the limit. After that you turn the wheel. Not me.",
        { affinity: -0.02, flag: 'choice.m3_05_push_on' }),
    ],
    completeAdd: [
      d('other_boat', '다른 배 사람들은 무사합니까?', 'Are the people on the other boat all right?',
        '…소식은 들었지. 더 묻지 마라. 돌아온 배가 못 돌아온 배 얘기를 함부로 하는 거 아니다.\n\n(부두 끝에 서서 한참 바다를 본다.) 오늘 밤엔 항구가 다 늦게 잔다. 너도 그럴 거다. 그게 맞는 거야.',
        "…You heard the news. Don't ask more. A boat that came back doesn't go talking loosely about one that didn't.\n\n(He stands at the end of the pier, looking at the sea for a long time.) The whole harbour sleeps late tonight. You will too. That's as it should be.",
        { affinity: 0.04, harborRep: 1, flag: 'choice.m3_05_other_boat' }),
    ],
    completeReply: {
      return: [
        '그게 선장이다. 아직 배는 없어도. (그날부터 선장이 나를 부를 때 목소리가 달라졌다.)\n\n배는 다시 사도 사람은 못 산다. 그걸 아는 놈이 키를 잡는 거야. 오늘 빈손은 손님들한테 내가 말한다. 너는 그 판단만 기억해.',
        "That's a skipper. Even without a boat yet. (From that day his voice changes when he calls my name.)\n\nYou can buy another boat. You can't buy another person. Whoever knows that is the one who takes the wheel. I'll explain the empty hold to the customers. You just remember the call you made.",
      ],
      regret: [
        '…그렇게 생각한 놈이 안개 속에서 안 돌아왔다. 다시 생각해.\n\n더 갔으면 두 마리 더 올렸을 수도 있지. 그 두 마리랑 배 한 척을 바꿀 거냐. 다음에 안개 보이면 오늘 그 생각부터 해 봐.',
        "…The ones who thought that didn't come back out of the fog. Think again.\n\nPush on and maybe you land two more. Would you trade a boat for those two? Next time you see fog, start by thinking about today.",
      ],
    },
  },

  // ── M3-06 「명태를 본 적 있어요?」 · 정옥선 ──
  'M3-06': {
    offer: [
      d('write_all', '받아 적겠습니다. 세 분 말씀, 빼놓지 않겠습니다.', "I'll write it down. I won't leave out a word from any of them.",
        '빼놓지 않겠다는 놈이 제일 많이 뺀다. 받아 적는 건 귀로 하는 거다. 손은 나중이야.\n\n말 끊지 말고 고개만 끄덕여. 노인들은 듣는 얼굴을 보고 입을 연다. 수첩은 무릎에 둬. 눈에 띄면 입을 닫아. 가 봐.',
        "The ones who swear they won't leave anything out leave out the most. Writing it down is done with your ears. The hands come later.\n\nDon't interrupt, just nod. Old people open up when they see a listening face. Keep the notebook on your knee. If they notice it, they clam up. Go.",
        { affinity: 0.04 }),
      d('ask_pollock', '명태가 왜 포획 금지입니까? 예전엔 흔했다면서요.', 'Why is pollock banned? I heard it used to be everywhere.',
        '흔했지. 너무 흔해서 새끼까지 긁어 갔다. 노가리라고, 명태 새끼를 안주로 먹던 시절이 있었어.\n\n새끼를 먹은 바다는 다음 해가 없다. 작은 놈 돌려보내라던 내 말이 그 얘기다. 혹시 만나면 놔줘라. 그 얘기 들은 사람이면 그래야지. 가서 들어 봐.',
        "It was. So common they scraped up the young ones too. Nogari, they called the young pollock — there was a time people ate them with their drinks.\n\nA sea that eats its young has no next year. That's what I meant about putting the small ones back. If you ever meet one, let it go. Anyone who's heard those stories should. Go and listen.",
        { affinity: 0.03, flag: 'choice.m3_06_asked_pollock' }),
      d('ask_log', '조행록에 그런 것도 적습니까? 잡은 것만 적는 줄 알았습니다.', 'That goes in the log too? I thought it was just for what you catch.',
        '잡은 것만 적으면 그건 장부다. 장부는 돈 세는 사람이 쓰는 거고.\n\n조행록은 바다가 어땠는지 남기는 거다. 뭐가 들었고 뭐가 안 들었는지. 안 든 걸 적는 사람이 있어야 나중에 왜 사라졌는지 안다. 셋이다. 잘 들어.',
        "Write down only what you catch and it's a ledger. Ledgers are for people counting money.\n\nThe log keeps what the sea was like. What came in and what didn't. Someone has to write down what didn't come, or later nobody knows why it vanished. Three people. Listen well.",
        { affinity: 0.03, flag: 'choice.m3_06_asked_log' }),
      d('shy', '처음 보는 분들이 제게 얘기를 해 주실까요?', "Will people I've never met really talk to me?",
        '안 해 주지. 처음엔. (혀를 찬다.)\n\n그러니까 먼저 얼음을 날라 주든 그물 정리를 거들든 해. 손이 먼저 가면 입은 따라 열린다. 나도 얼음 상자 보고 너한테 열렸다. 셋 채우고 와.',
        "They won't. Not at first. (She clicks her tongue.)\n\nSo carry their ice first, or help sort their nets. When the hands go first, the mouths follow. I opened up to you over an ice crate, didn't I. Come back with three.",
        { affinity: 0.02, flag: 'choice.m3_06_shy' }),
    ],
    completeAdd: [
      d('her_story', '다음엔 정옥선 씨 이야기도 받아 적고 싶습니다.', "Next time, I'd like to write down your story too.",
        '…내 얘기는 적을 게 없다. 좌판이랑 얼음이 다야. (수첩을 내 쪽으로 밀어 버린다.)\n\n적을 거면 네 얘기나 적어. 오늘 들은 걸 네 말로. 그것도 조행록이다. 늙은이 얘기는 늙은이들이 알아서 남긴다.',
        "…There's nothing in mine worth writing. A stall and ice, that's all. (She pushes the notebook back toward me.)\n\nIf you want to write, write your own. What you heard today, in your own words. That's the log too. Old people's stories, old people will see to.",
        { affinity: 0.04, flag: 'choice.m3_06_her_story' }),
    ],
    completeReply: {
      father: [
        '…그랬을 거다. (정옥선 씨가 오래 말이 없다. 그러고는 내 손을 한 번 잡는다.)\n\n아버지가 뭘 알았는지는 아무도 모른다. 다만 네가 이렇게 적고 있으면, 알았든 몰랐든 이어지는 거다. (손을 놓고 수첩 표지를 한 번 쓸어 준다.)',
        "…He likely did. (She says nothing for a long time. Then she takes my hand, once.)\n\nNobody knows what your father knew. But as long as you keep writing like this, it carries on — whether he knew or not. (She lets go and smooths the notebook's cover once with her palm.)",
      ],
      record: [
        '다르니까 남기는 거야. 같으면 한 사람이면 되지. (수첩을 한 권 더 준다.)\n\n셋이 다 다르면 셋 다 맞는 거다. 바다는 한 사람 눈에 다 안 들어와. 그러니까 고치지 말고 들은 대로 둬.',
        "You write it down because they differ. If they agreed, one person would do. (She gives me another notebook.)\n\nIf all three differ, all three are right. The sea doesn't fit in one person's eyes. So don't correct them. Leave it as you heard it.",
      ],
    },
  },

  // ── M3-07 「종묘방류」 · 동명항 어촌계(계장) ──
  'M3-07': {
    offer: [
      d('own_hands', '제 손으로 바다에 넣는다니, 이상하게 설렙니다.', "Putting them in the sea with my own hands — it's oddly exciting.",
        '설레는 건 좋다. 대신 쏟지 마라. 높은 데서 부으면 치어가 기절한다. 양동이를 물에 대고 기울여.\n\n한 양동이에 한 숨. 그렇게 다섯 번이면 된다. 급하게 부으면 갈매기만 배부르다. 들어.',
        "Excitement's fine. Just don't dump them. Pour from up high and the fry are stunned. Put the bucket to the water and tip it.\n\nOne breath per bucket. Five times like that and you're done. Pour in a hurry and only the gulls eat well. Pick it up.",
        { affinity: 0.04 }),
      d('ask_seed', '종묘가 뭡니까? 이 많은 치어는 어디서 왔습니까?', 'Where did all these fry come from? Who raised them?',
        '종묘는 사람 손으로 받은 새끼다. 어미한테 알을 받아 수조에서 키운 거지. 손가락만 해지면 바다에 낸다.\n\n바다가 혼자 못 채우는 걸 사람이 조금 거드는 거다. 다 살진 않아. 그래도 안 놓으면 하나도 없어. 양동이 들어.',
        "Hatchery young, raised by people's hands. Eggs taken from the parents and grown in tanks. Once they're finger-sized they go to sea.\n\nPeople helping a little where the sea can't refill itself alone. They don't all live. But release none and there'd be none. Take a bucket.",
        { affinity: 0.03, flag: 'choice.m3_07_asked_seed' }),
      d('doubt_eaten', '놔줘도 금방 다 잡아먹히지 않습니까?', "Won't they all just get eaten right away?",
        '많이 먹힌다. 그래도 다 먹히진 않아. 그 남는 놈들이 바다를 채운다.\n\n세지 말라는 게 그 얘기다. 먹히는 걸 세면 못 놓고, 남는 걸 세면 욕심이 나. 그냥 놓는 거다. 다섯 양동이.',
        "A lot get eaten. Not all of them. The ones left over are what fill the sea.\n\nThat's why I said don't count. Count the eaten and you can't let go; count the survivors and you get greedy. You just release them. Five buckets.",
        { affinity: 0.01, flag: 'choice.m3_07_doubt' }),
    ],
    completeAdd: [
      d('empty_hands', '바다에 다 넣고 나니, 손이 좀 허전합니다.', 'With them all in the sea, my hands feel a bit empty.',
        '허전한 게 맞다. 손에 있던 걸 놨으니까. 그 허전함이 방류다.\n\n잡는 날만 있으면 바다가 남아나질 않아. 놓는 날도 있어야 그다음 잡는 날이 온다. (빈 양동이를 포개 든다.)',
        "Empty is right. You let go of what was in them. That emptiness is what release is.\n\nIf there were only catching days, the sea wouldn't last. There have to be letting-go days for the next catching day to come. (He stacks the empty buckets.)",
        { affinity: 0.04, flag: 'choice.m3_07_empty_hands' }),
    ],
    completeReply: {
      count: [
        '…그러니까 세지 말라는 거야. 그래도 사백이면 많이 놨네. (가방 하나를 어깨에 걸어 준다.)\n\n세는 버릇은 낚시꾼 버릇이다. 나쁜 건 아니야. 다만 놓는 날엔 숫자를 집에 두고 와. 다음엔 세지 말고 물만 봐라.',
        "…That's exactly why I said not to. Still, four hundred is a good release. (He slings a bag over my shoulder.)\n\nCounting is an angler's habit. Not a bad one. But on release days, leave the numbers at home. Next time don't count — just watch the water.",
      ],
      hope: [
        '그렇게 말하는 놈 때문에 방류하는 거다. (가방 안에 치어 방류 기록장이 들어 있다.)\n\n그때 잡은 놈은 체장 재고 가져가라. 오늘 네가 놓은 놈일 수도 있어. 그런 생각 하면서 낚는 사람이 바다를 오래 쓴다.',
        "It's for people who talk like that that we release at all. (Inside the bag is a fry-release logbook.)\n\nWhen you catch them then, measure before you keep them. It might be one you let go today. People who fish thinking like that get to use the sea for a long time.",
      ],
    },
  },

  // ── M3-08 「겨울 참돔」 · 고만석 ──
  'M3-08': {
    offer: [
      d('father_rod', '아버지 대로 해 보겠습니다. 천천히 감겠습니다.', "I'll do it with my father's rod. I'll reel slowly.",
        '…그 대로 하겠다면 말리진 않는다. 드랙을 반 바퀴 더 풀어. 참돔은 처음 차고 나갈 때가 제일 세다.\n\n그때 손으로 줄 잡지 마. 줄 잡는 순간 대가 혼자 다 받는다. 대를 아끼려면 드랙을 믿어. 감아 봐.',
        "…If that's the rod you want, I won't stop you. Back the drag off another half turn. A seabream is strongest on its first run.\n\nDon't grab the line then. The moment you grab it, the rod takes all of it alone. If you want to spare the rod, trust the drag. Start reeling.",
        { affinity: 0.03, flag: 'choice.m3_08_father_rod' }),
      d('ask_tairaba', '타이라바는 지그랑 뭐가 다릅니까?', 'How is tairaba different from a jig?',
        '지그는 쳐서 꾀고, 타이라바는 감아서 꾄다. 바닥 찍고 일정하게 감아. 속도 바꾸지 말고.\n\n툭툭 건드려도 챔질하지 마. 참돔은 따라오면서 쪼아. 묵직해질 때까지 그냥 감아. 성급한 놈이 제일 많이 놓친다. 내려.',
        "A jig you work with jerks. Tairaba you work by reeling. Touch bottom and wind steady. Don't change speed.\n\nEven when it taps, don't strike. Seabream follow and peck. Keep winding until it goes heavy. The impatient ones lose the most. Drop it.",
        { affinity: 0.03, flag: 'choice.m3_08_asked_tairaba' }),
      d('big_one', '대물이면 좋겠습니다. 사진 찍어서 자랑하게요.', "I hope it's a big one. I want a photo to show off.",
        '자랑은 뜰채에 들어간 다음에 해. 물 밖에 나오기 전엔 다 바다 거다.\n\n(잠깐 내 대를 본다.) 대물은 반갑기만 한 게 아니다. 장비 값을 매기러 오는 놈이야. 각오하고 내려.',
        "Show off once it's in the net. Until it's out of the water, it belongs to the sea.\n\n(He glances at my rod.) A big one isn't only good news. It comes to put a price on your gear. Drop your line ready for that.",
        { affinity: 0.01, flag: 'choice.m3_08_big_one' }),
      d('ask_limit', '대는 한계가 있다니요? 제 대 말씀입니까?', 'Rods have limits? Do you mean mine?',
        '…대마다 견디는 무게가 있다는 거다. 네 대가 나쁘단 게 아니야. 오래된 대는 마디가 먼저 늙는다.\n\n대물 걸리면 대로 버티지 말고 드랙으로 버텨. 그래도 안 되면 그땐 정해야 한다. 고기냐 대냐. 미리 생각해 두고 내려.',
        "…Every rod has a weight it can bear, that's all. I'm not saying yours is bad. On an old rod, the joints age first.\n\nIf a big one takes, hold it with the drag, not the rod. If that's not enough, then you'll have to choose. The fish or the rod. Think about it before you drop.",
        { affinity: 0.02, flag: 'choice.m3_08_asked_limit' }),
    ],
    completeAdd: [
      d('did_you_know', '고만석 씨는 부러질 줄 아셨습니까?', 'Did you know it would break, Manseok?',
        '…알았으면 말렸겠지. 몰랐다. 다만 오래된 대는 언젠가 그런다는 건 알았다.\n\n대는 부러지라고 있는 거다. 부러질 때까지 고기를 안 놓은 대가 좋은 대야. 네 아버지 대는 끝까지 안 놨다. 그건 기억해 둬.',
        "…If I'd known, I'd have stopped you. I didn't. I just knew an old rod does that someday.\n\nRods are made to break. A good rod is one that won't let go of the fish till it breaks. Your father's rod held on to the end. Remember that.",
        { affinity: 0, flag: 'choice.m3_08_did_you_know' }),
    ],
    completeReply: {
      caught: [
        '그게 낚시꾼이지. 대보다 고기를 먼저 세는. …그래도 대는 챙겨 가. (마디를 차근차근 주워 준다.)\n\n고기 먼저 센 건 잘한 거다. 대는 다시 깎으면 되지만 오늘 그 참돔은 다시 안 와. 그래도 오늘 밤엔 대 옆에 앉아 있어라. 그 대도 수고했다.',
        "That's an angler for you — counting fish before rods. …Take the rod with you all the same. (He gathers the pieces up, one by one.)\n\nCounting the fish first was right. A rod can be cut again, but that seabream won't come twice. Still, sit by the rod tonight. It did its work too.",
      ],
    },
  },

  // ── M3-09 「배를 보러 가자」 · 탁만수 ──
  'M3-09': {
    offer: [
      d('save_it', '아버지 대, 꼭 다시 살려 주십시오.', "Please bring my father's rod back to life.",
        '살린다는 말은 못 한다. 마디가 갈라졌어. 볼 수 있는 건 다 본다는 말만 하지. (부러진 마디를 작업대에 눕힌다.)\n\n그동안 새 죽간을 써라. 대가 없으면 손이 굳는다. 손 굳은 놈한테는 고친 대도 소용없어. 배 보러 가.',
        "I can't promise to bring it back. The joint has split. All I'll say is I'll look at everything there is to look at. (He lays the broken section on the workbench.)\n\nUse the new blank meanwhile. Without a rod your hands stiffen, and a mended rod's no use to stiff hands. Go and see the boat.",
        { affinity: 0.04 }),
      d('ask_geoje', '왜 하필 거제입니까? 배를 보러 거기까지요?', 'Why Geoje of all places? All that way to look at a boat?',
        '거제엔 조선소가 많다. 큰 배 만드는 데 옆엔 작은 배 고치는 데도 많아. 쓸 만한 중고 배는 거기서 나온다.\n\n보기만 해. 사라는 말 아니다. 배는 보고 또 봐야 고른다. 대나무 고르듯이. 가.',
        "Geoje is full of shipyards. Where they build big ships there are plenty of places that fix small ones. That's where decent used boats turn up.\n\nJust look. I'm not telling you to buy. You choose a boat by looking, and looking again. Like choosing bamboo. Go.",
        { affinity: 0.03, flag: 'choice.m3_09_asked_geoje' }),
      d('ask_seen', '이 대, 혹시 전에 보신 적 있으십니까?', 'Have you ever seen this rod before?',
        '…(갈라진 마디를 오래 만진다.) 대는 다 비슷하게 늙는다. 지금은 그 얘기 할 때가 아니야.\n\n배 보고 와라. 대는 내가 보고 있으마. 그 얘긴 나중에 하자.',
        "…(He runs his fingers over the split joint for a long time.) Rods all age much the same. Now isn't the time for that.\n\nGo and see the boat. I'll keep an eye on this one. We'll talk about that later.",
        { affinity: 0.02, flag: 'choice.m3_09_asked_seen' }),
      d('no_money', '배라니요. 아직 돈이 한참 모자랍니다.', "A boat? I'm nowhere near having the money.",
        '안다. 그러니까 보러 가라는 거다. 사러 가라는 게 아니고.\n\n얼마가 모자란지 알아야 모을 수 있어. 위판장 가서 상자부터 쌓아. 배는 돈보다 눈으로 먼저 사는 거다.',
        "I know. That's why I said go and look. Not go and buy.\n\nYou can only save once you know how much you're short. Go to the auction and stack up crates. A boat is bought with the eyes before the money.",
        { affinity: 0.03, flag: 'choice.m3_09_no_money' }),
    ],
    completeAdd: [
      d('prefer_father', '솔직히 새 대보다 아버지 대가 더 좋습니다.', "Honestly, I like my father's rod better than the new one.",
        '당연하지. 손이 기억하는 대는 못 이긴다. 이 대는 아직 네 손을 모르니까.\n\n그래도 써. 대는 쓰는 사람 손을 닮아 간다. 한 철 쓰면 이 대도 네 대가 된다. (새 대의 손잡이를 엄지로 한 번 문지른다.)',
        "Of course. Nothing beats a rod your hands remember. This one doesn't know your hands yet.\n\nUse it all the same. A rod grows to fit the hand that uses it. One season, and this one will be yours too. (He rubs the new grip once with his thumb.)",
        { affinity: 0.05, flag: 'choice.m3_09_prefer_father' }),
    ],
    completeReply: {
      trust: [
        '…맡긴다는 말 쉽게 하지 마라. 그래도 받겠다. (죽간을 건네는 손이 흔들리지 않는다.)\n\n맡긴다는 건 기다린다는 말이다. 언제 되냐고 묻지 마라. 대가 다 말하면 그때 부른다.',
        "…Don't say 'leave it with you' so lightly. I'll take it all the same. (The hand that receives the bamboo doesn't shake.)\n\nLeaving it with me means waiting. Don't ask when it'll be done. When the rod's said all it has to say, I'll call you.",
      ],
      learn: [
        '…그 말을 기다렸다. 배워. 배우면 다음 대는 네가 깎는다. (로드 빌딩이 열린다.)\n\n칼 잡는 법부터다. 대나무는 결대로 쪼개지, 힘으로는 안 쪼개진다. 손 다치면 대보다 손이 먼저 운다.',
        "…I've been waiting for that. Learn it. Learn it, and you'll cut the next one yourself. (Rod building opens up.)\n\nYou start with holding the knife. Bamboo splits along the grain, not by force. Cut your hand and it's the hand that weeps before the rod does.",
      ],
    },
  },

  // ── M4-01 「지세포 조선소」 · 채금자 ──
  'M4-01': {
    offer: [
      d('this_boat', '모아 오겠습니다. 이 배로 하고 싶습니다.', "I'll save it up. This is the boat I want.",
        '이 배로 하고 싶다는 말은 오백 모아 와서 해요. 그때도 같은 마음이면 진짜예요. (선체를 손바닥으로 두드린다.)\n\n바닥은 괜찮아요. 엔진이 반이고 나머지가 반. 엔진부터 고칠 거예요. 위판 몇 번이면 될지 세어 보고 오세요.',
        "Tell me you want this boat when you come back with five million. If you still feel the same then, it's real. (She pats the hull with her palm.)\n\nThe bottom's sound. The engine's half the bill, the rest is the other half. Engine first. Work out how many auctions it'll take, and come back.",
        { affinity: 0.04 }),
      d('ask_half', '반만 고쳐도 뜬다면, 나머지 반은 뭡니까?', "If fixing half keeps her afloat, what's the other half?",
        '안 고쳐도 당장 안 가라앉는 것들이요. 도장, 의자, 낡은 전선 몇 가닥.\n\n뜨는 데 필요한 건 다 고쳐요. 그건 제가 봐요. 나머지는 타면서 돈 생길 때마다. 첫 배는 다 그렇게 해요. 그러니까 일단 오백이요.',
        "Things that won't sink her if they wait. Paint, seats, a few old wires.\n\nEverything she needs to float gets fixed. I see to that. The rest you fix as you run her, whenever there's money. Every first boat goes that way. So — five million first.",
        { affinity: 0.03, flag: 'choice.m4_01_asked_half' }),
      d('haggle', '오백이면… 조금 깎아 주실 순 없습니까?', "Five million… any chance you'd come down a little?",
        '깎으면 어디 한 군데를 덜 고쳐야 해요. 어디요. 엔진? 펌프? (대답을 기다리다 고개를 젓는다.)\n\n그래서 못 깎아요. 대신 이 배는 다른 사람한테 안 넘길게요. 조선소는 못 기다려도 배는 기다려요. 모아 오세요.',
        "If I come down, somewhere gets less fixing. Where? The engine? The pump? (She waits for an answer, then shakes her head.)\n\nSo I can't. But I won't let this boat go to anyone else. The yard can't wait, but the boat can. Go and save.",
        { affinity: -0.01, flag: 'choice.m4_01_haggle' }),
      d('unsure', '제가 오백을 모을 수 있을지 모르겠습니다.', "I'm not sure I can save five million.",
        '모를 땐 숫자를 쪼개요. 오백을 한 번에 보면 막막해요. 위판 한 번에 얼마, 그걸 몇 번. 그렇게 보면 날짜가 나와요.\n\n날짜가 나오면 그다음은 바다 일이에요. 그건 할 줄 알잖아요. 시작해요.',
        "When you're not sure, break the number up. Five million all at once is overwhelming. So much per auction, so many auctions. Look at it that way and you get a date.\n\nOnce there's a date, the rest is sea work. You know how to do that. Get started.",
        { affinity: 0.03, flag: 'choice.m4_01_unsure' }),
    ],
    completeAdd: [
      d('name_ask', '이 배 이름은 제가 정해도 됩니까?', 'Can I be the one to name her?',
        '당연하죠. 이름은 주인이 정해요. 수리 끝나면 선수에 쓰는 거예요. 아직은 쓰지 마요. (검수표를 접는다.)\n\n좋은 이름 생각해 와요. 배 이름은 한 번 쓰면 잘 안 바꿔요. 바꾸면 운이 샌다는 사람도 있고요.',
        "Of course. The owner names her. It goes on the bow once the repairs are done. Not yet. (She folds the inspection sheet.)\n\nThink of a good one. Once a boat's named, you don't really change it. Some say renaming lets the luck leak out.",
        { affinity: 0.04, flag: 'choice.m4_01_name_ask' }),
    ],
    completeReply: {
      half: [
        '그게 답이에요. 전부 고치고 타는 배는 없어요. (견적서에 자기 이름으로 보증을 써 준다.)\n\n고친 반은 제가 장담해요. 안 고친 반은 견적서 뒤에 적어 뒀어요. 하나씩 지워 나가요. 다 지우는 날 진짜 내 배가 되는 거예요.',
        "That's the answer. Nobody ever fixes it all before sailing. (She writes her own name on the estimate as guarantee.)\n\nThe half that's fixed, I'll vouch for. The half that isn't, I've written on the back of the estimate. Cross them off one by one. The day they're all crossed off, she's really yours.",
      ],
      worry: [
        '안 되는 반은 제가 골라 뒀어요. 되는 반이에요. (검수표를 보여 준다. 조타 일류의 눈이다.)\n\n걱정하는 건 좋아요. 걱정 안 하는 선주가 제일 무서워요. 대신 그 걱정은 검수표로 해요. 감으로 하지 말고요.',
        "I've already picked which half stays broken. This is the half that works. (She shows me the inspection sheet. The eye of a first-rate helmsman.)\n\nWorrying is good. Owners who don't worry are the scariest kind. Just do your worrying with the inspection sheet. Not with your gut.",
      ],
    },
  },

  // ── M4-02 「첫 배」 · 채금자 ──
  'M4-02': {
    offer: [
      d('own_hand', '정했습니다. 손이 떨려도 제 손으로 쓰겠습니다.', "I've decided. Even if my hand shakes, I'll paint it myself.",
        '떨리는 손으로 쓴 글씨가 오래 가요. 반듯하게 쓴 건 다들 잊어버리거든요.\n\n페인트는 두 번 칠해요. 바닷바람은 한 번 칠한 걸 한 철이면 벗겨 내요. 다 마르면 시동 걸어요. 한 바퀴만.',
        "Letters painted with a shaking hand last. The neat ones, everyone forgets.\n\nTwo coats. Sea wind strips a single coat in one season. Once it's dry, start her up. Just the one lap.",
        { affinity: 0.04 }),
      d('ask_lap', '부두 한 바퀴만 도는 데는 이유가 있습니까?', "Is there a reason it's only one lap of the harbour?",
        '첫 운항은 배를 아는 시간이에요. 키를 얼마나 돌려야 도는지, 서는 데 얼마나 걸리는지.\n\n그걸 모르고 나가면 바다 한가운데서 배워야 해요. 거기선 배울 시간이 없어요. 부두 안에서 다 틀려 보세요. 고기는 그다음이에요.',
        "The first run is for getting to know the boat. How far to turn the wheel before she turns, how long she takes to stop.\n\nGo out without knowing that and you'll be learning it in open water. There's no time to learn out there. Get it all wrong inside the harbour. The fish come after.",
        { affinity: 0.03, flag: 'choice.m4_02_asked_lap' }),
      d('further', '한 바퀴로는 아쉽습니다. 조금만 더 나가 보면 안 됩니까?', "One lap feels short. Can't I go out just a little further?",
        '안 돼요. (팔짱을 낀다.)\n\n첫날 멀리 나간 사람은 둘 중 하나예요. 잘하는 사람이거나 운 좋은 사람. 어느 쪽인지는 돌아와 봐야 알아요. 오늘은 한 바퀴. 세 마리는 부두 앞에서도 나와요.',
        "No. (She folds her arms.)\n\nAnyone who goes far on day one is one of two things. Skilled, or lucky. You only find out which when they get back. Today, one lap. You can get three fish right off the harbour.",
        { affinity: -0.01, flag: 'choice.m4_02_further' }),
      d('no_name', '아직 이름을 못 정했습니다. 좋은 게 안 떠오릅니다.', "I haven't settled on a name yet. Nothing good comes to mind.",
        '어렵게 생각하지 마요. 부르기 쉬운 이름이요. 무전으로 불렀을 때 바람 소리에 안 묻히는 거.\n\n그리고 부르면 마음이 놓이는 이름. 생각나는 사람이 있으면 거기서 따 와도 돼요. 정하면 선수에 쓰고 나가요.',
        "Don't overthink it. Something easy to say. A name that doesn't get lost in the wind over the radio.\n\nAnd a name that settles you when you say it. If someone comes to mind, you can take it from there. Once you've decided, paint it on the bow and go.",
        { affinity: 0.03, flag: 'choice.m4_02_no_name' }),
    ],
    completeAdd: [
      d('arms_folded', '부두에서 팔짱 끼고 보시던데, 걱정되셨습니까?', 'You watched from the pier with your arms folded. Were you worried?',
        '걱정은요. 계산하고 있었어요. 어디서 키를 늦게 돌리는지.\n\n세 번째 모퉁이에서 늦었어요. 다음엔 거기서 반 박자 먼저 돌려요. 그것만 고치면 돼요. (팔짱은 끝까지 풀지 않는다.)',
        "Worried? I was working things out. Where you were late on the wheel.\n\nYou were late on the third corner. Next time turn half a beat earlier there. Fix that and you're fine. (She doesn't unfold her arms the whole time.)",
        { affinity: 0.03, flag: 'choice.m4_02_arms_folded' }),
    ],
    completeReply: {
      name_why: [
        '…좋은 이름이에요. (팔짱을 풀고 처음으로 웃는다.)\n\n아버지 배에서 한 글자 따 온 이름이면 함부로 못 타요. 그게 좋은 거예요. 무리하고 싶은 날, 선수의 그 글자가 한 번 붙잡아 줄 거예요.',
        "…It's a good name. (She unfolds her arms and smiles for the first time.)\n\nWith a syllable from your father's boat on her, you won't run her carelessly. That's a good thing. On a day you want to push your luck, that syllable on the bow will hold you back once.",
      ],
      scared: [
        '무서운 게 맞아요. 안 무서우면 그 사람이 위험해요. (연료값 봉투에 조타 메모를 끼워 준다.)\n\n무서운 사람은 줄을 두 번 보고 기름을 한 번 더 봐요. 그게 다 사고를 막아요. 그 메모, 키 옆에 붙여 둬요.',
        "You should be. The ones who aren't are the dangerous ones. (She slips a helm note into the fuel envelope.)\n\nPeople who are scared check the lines twice and the fuel once more. That's what stops accidents. Stick that note beside the wheel.",
      ],
    },
  },

  // ── M4-03 「지세포의 밤」 · 채파도 ──
  'M4-03': {
    offer: [
      d('go_trust', '좋아, 나가자. 뜰채는 너만 믿는다.', "Right, let's go. I'm trusting you with the net.",
        '진짜요? 믿는다는 말 들은 거 처음이에요! (등선 시동을 한 번에 건다. 본인이 더 놀란다.)\n\n광어는 바닥에 딱 붙어 있어요. 봉돌이 바닥에 닿으면 톡톡, 그리고 기다려요. 광어는 급한 사람 싫어해요. 저 같은 사람이요. 가요!',
        "Really? First time anyone's said they trust me! (Pado starts the light boat first try, and looks more surprised than anyone.)\n\nFlounder hug the bottom. When the sinker touches, tap tap, then wait. Flounder hate people in a hurry. People like me. Let's go!",
        { affinity: 0.05 }),
      d('ask_maybe', '아마? 뜰채 대는 데 왜 아마가 붙어?', "Probably? Why is there a probably on the net?",
        '아, 그게… 뜰채가 좀 어려워요. 고기가 마지막에 꼭 한 번 더 뛰거든요. 그때 손이 먼저 나가요.\n\n그래도 머리부터 넣으면 된다고 선장님이 그랬어요. 머리부터. 외웠어요! 아마. 아, 아마는 빼 주세요. 가요!',
        "Ah, well… the net's a bit tricky. The fish always kicks one last time at the end. My hand goes too early.\n\nBut the skipper says just get the head in first. Head first. I've memorised it! Probably. Ah — forget the probably. Let's go!",
        { affinity: 0.03, flag: 'choice.m4_03_asked_maybe' }),
      d('ask_downshot', '다운샷은 처음인데, 어떻게 하는 거야?', "I've never done a down-shot. How does it work?",
        '봉돌을 맨 밑에 달고, 바늘은 그 위에 달아요. 봉돌이 바닥에 닿아 있으면 미끼가 바닥 조금 위에서 놀아요.\n\n광어는 바닥에서 위를 보고 있다가 먹어요. 그래서 살짝 띄우는 거예요. 이건 제가 진짜 잘 알아요. 진짜로요. 가요!',
        "Sinker at the very bottom, hook tied above it. With the sinker on the bottom, the bait plays just above it.\n\nFlounder lie on the bottom looking up, then strike. That's why you lift it a little. This one I really do know. Really. Let's go!",
        { affinity: 0.03, flag: 'choice.m4_03_asked_downshot' }),
      d('permission', '밤에 등선이라니, 채금자 씨 허락은 받았어?', 'The light boat at night? Did Geum-ja say yes?',
        '받았죠! 선장님이 키 줬어요. 사고만 안 치면 된대요. (열쇠를 자랑스럽게 흔든다.)\n\n걱정 마요. 배 위에서는 저 안 덜렁대요. 덜렁대는 건 땅에서만이에요. 진짜예요. 타요!',
        "Course I did! The skipper gave me the key. Just don't cause any trouble, she said. (Pado jingles the key proudly.)\n\nDon't worry. I'm not scatterbrained on a boat. Only on land. Honest. Get in!",
        { affinity: 0.02, flag: 'choice.m4_03_permission' }),
    ],
    completeAdd: [
      d('net_swap', '뜰채는 다음부터 내가 댈게. 너는 배만 몰아.', "From now on I'll handle the net. You just drive the boat.",
        '아… 그것도 좋네요. 사실 저는 배가 더 좋아요. (등선 키를 만지작거린다.)\n\n근데 언젠가는 제가 댈 거예요. 한 마리도 안 놓치고. 그날은 꼭 보러 와요. 선장님이랑 같이요.',
        "Oh… that works too. Honestly, I like the boat better. (Pado fiddles with the light boat's key.)\n\nBut someday I'll do the net myself. Without dropping a single one. Come and see that day. With the skipper.",
        { affinity: 0.04, flag: 'choice.m4_03_net_swap' }),
    ],
    completeReply: {
      secret: [
        '역시! 최고예요! (다음 등선 출조 명단에 내 이름을 먼저 쓴다.)\n\n선장님은 어차피 다 알 거예요. 원래 다 알아요. 그래도 말 안 하면 저는 모른 척할 수 있잖아요. 그게 중요해요.',
        "See! You're a mate! (He writes my name first on the next lamp-boat outing.)\n\nThe skipper will know anyway. She always does. But if you don't say anything, I get to pretend she doesn't. That's what matters.",
      ],
    },
  },

  // ── M4-04 「안전 검사」 · 동명항 어촌계(계장) ──
  'M4-04': {
    offer: [
      d('check_twice', '서른 항목, 하나씩 다 보겠습니다.', "Thirty items. I'll go through every one.",
        '하나씩은 기본이다. 두 번씩 봐라. 한 번은 네 눈으로, 한 번은 검사관 눈으로.\n\n제일 많이 걸리는 게 조끼, 소화기, 신호탄 날짜다. 물건은 멀쩡해 보여도 날짜가 지나면 없는 거다. 모자라면 오늘 갖춰.',
        "Every one is the minimum. Check each twice. Once with your eyes, once with the inspector's.\n\nWhat fails most is the dates — vests, extinguishers, flares. Gear can look fine, but past its date it may as well not exist. If you're short, sort it today.",
        { affinity: 0.04 }),
      d('ask_vest', '조끼에도 유효기간이 있습니까?', 'Life vests have an expiry date?',
        '있다. 특히 부풀리는 조끼는 가스통이랑 터지는 장치에 날짜가 있어. 날짜 지나면 물에 빠져도 안 부푼다.\n\n멀쩡해 보이는 조끼가 제일 위험하다. 사람이 그걸 믿고 빠지거든. 그래서 조끼부터 보라는 거다.',
        "They do. Especially the inflatable kind — the gas cylinder and the trigger both have dates. Past those, it won't inflate when you go in.\n\nA vest that looks fine is the most dangerous kind. People trust it and go in. That's why you start with the vests.",
        { affinity: 0.03, flag: 'choice.m4_04_asked_vest' }),
      d('complain', '배는 멀쩡한데, 서른 항목이나 다 봐야 합니까?', 'The boat is sound. Do we really need all thirty items?',
        '배가 멀쩡한지는 검사관이 정한다. 네가 아니라. 서른 항목은 다 누가 다치고 나서 생긴 거다. 하나하나가 사람 하나야.\n\n귀찮으면 귀찮은 대로 해. 빼먹지만 마. 빼먹은 하나가 네 손님일 수도 있다. 서른 개 다 봐.',
        "Whether the boat's sound is for the inspector to say, not you. Every one of those thirty items came after somebody got hurt. Each one is a person.\n\nIf it's a chore, do it as a chore. Just don't skip any. The one you skip could be your passenger. Check all thirty.",
        { affinity: -0.01, flag: 'choice.m4_04_complain' }),
      d('ask_retest', '하나 떨어지면 재검까지 얼마나 걸립니까?', 'If one item fails, how long until the re-inspection?',
        '하루. 운 나쁘면 이틀. 그동안 배는 묶여 있고 돈은 안 들어온다. (달력을 손가락으로 두드린다.)\n\n그러니까 미리 봐. 모자란 건 오늘 만들어 놔. 검사 날 아침에 알면 늦어.',
        "A day. Two if you're unlucky. Meanwhile the boat's tied up and no money comes in. (He taps the calendar.)\n\nSo check ahead. Make whatever's missing today. Find out on inspection morning and it's too late.",
        { affinity: 0.02, flag: 'choice.m4_04_asked_retest' }),
    ],
    completeAdd: [
      d('guest_vests', '다음부터는 손님 조끼도 출항 전에 보겠습니다.', "From now on I'll check the passengers' vests before we sail too.",
        '그래. 손님 조끼가 제일 먼저 낡는다. 자기 조끼가 아니니까 아무렇게나 던져 두거든.\n\n출항 전에 한 번, 돌아와서 한 번. 그게 선장 일이다. 낚싯배는 고기보다 사람을 먼저 싣는 배야.',
        "Good. Passengers' vests wear out first. They're not their own, so they get thrown about.\n\nOnce before sailing, once after you're back. That's a skipper's job. A fishing boat carries people before it carries fish.",
        { affinity: 0.04, harborRep: 1, flag: 'choice.m4_04_guest_vests' }),
    ],
    completeReply: {
      learned: [
        '그렇게 말하는 선장 배엔 사고가 없다. (검사관이 내 배 이름을 명부에 곱게 적는다.)\n\n명부에 곱게 적힌 이름은 지우기 아깝다. 그 이름 깨끗하게 지키는 게 선장 일이야. 다음 검사 때도 조끼부터 봐라.',
        "No accidents happen on the boat of a skipper who says that. (The inspector writes my boat's name neatly into the register.)\n\nA name written that neatly is a shame to strike out. Keeping it clean is a skipper's job. Next inspection, start with the vests again.",
      ],
      annoyed: [
        '억울해야 다음엔 안 잃는다. 억울한 게 맞아. (그래도 검사 수수료를 반만 받는다.)\n\n하루 잃은 건 아깝지. 근데 그 하루가 바다에서 조끼 하나 모자란 날이었으면 어땠을지 생각해 봐. 그럼 덜 억울할 거다.',
        "Feel it, and you won't lose the next one. It is unfair. (He charges me only half the inspection fee anyway.)\n\nLosing the day hurts. But think what it would've been if that day were out at sea one vest short. Then it won't feel so unfair.",
      ],
    },
  },

  // ── M4-05 「밤바다 갈치」 · 오가윤 ──
  'M4-05': {
    offer: [
      d('first_night', '좋습니다. 여수 밤바다는 처음입니다.', "Sounds good. It's my first time on the Yeosu sea at night.",
        '처음이면 다행이에요. 처음 보는 사람은 다 조용해지거든요. 저도 오늘은 좀 조용하고 싶어서요.\n\n(집어등 전선을 감는다.) 불을 켜면 갈치가 서서 올라와요. 머리를 위로 하고요. 그래서 이빨이 먼저 보여요. 가요.',
        "Good, if it's your first. First-timers all go quiet. I'd like a bit of quiet tonight myself.\n\n(She coils the fish-light cable.) When the lights come on, the hairtail rise standing up. Head first. That's why you see the teeth before anything. Let's go.",
        { affinity: 0.04 }),
      d('ask_leader', '목줄이 끊긴다니, 그럼 뭘 써야 합니까?', 'If they cut the leader, what should I use?',
        '와이어요. 가는 쇠줄. 갈치 이빨은 나일론 줄을 칼처럼 잘라요. (손가락으로 이빨 모양을 만들어 보인다.)\n\n처음엔 그냥 해 보세요. 한두 번 끊겨 봐야 와이어가 왜 필요한지 알아요. 그다음에 바꿔요. 그게 더 오래 기억나요.',
        "Wire. Thin steel line. Hairtail teeth cut nylon like a knife. (She makes a set of teeth with her fingers.)\n\nTry it plain at first. You only know why wire matters after you've been cut off once or twice. Then switch. You'll remember it longer that way.",
        { affinity: 0.03, flag: 'choice.m4_05_asked_leader' }),
      d('ask_tired', '근무 끝나고 바로 오신 겁니까? 피곤하지 않으세요?', "Did you come straight from your shift? Aren't you tired?",
        '피곤해요. 그래서 왔어요. 방에 들어가면 생각이 많아지거든요.\n\n바다에 불 켜 놓고 있으면 생각이 불 쪽으로 가요. 그게 좋아요. …갈치 얘기나 해요, 우리. 오늘은 그게 좋겠어요. 불 켤게요.',
        "I am. That's why I came. If I go back to my room, I'll think too much.\n\nWith the lights on over the sea, my thoughts drift toward the light. I like that. …Let's just talk about hairtail. That'd be best tonight. I'll put the lights on.",
        { affinity: 0.04, flag: 'choice.m4_05_asked_tired' }),
      d('teeth_joke', '갈치 이빨이 그렇게 무섭습니까? 손가락은 지키고 싶은데요.', "Are hairtail teeth that bad? I'd like to keep my fingers.",
        '무서워요. 올리고 나서가 더 무서워요. 바늘 뺄 때 손 넣으면 물려요.\n\n집게 하나 챙겨요. 그리고 머리 말고 몸통을 잡아요. 미끄러우니까 수건으로요. (처음으로 조금 웃는다.) 손가락은 지켜 줄게요. 가요.',
        "They are. Worse once it's on deck. Put your hand in to unhook it and you get bitten.\n\nBring pliers. And grab the body, not the head. With a towel, it's slippery. (For the first time she smiles a little.) I'll look after your fingers. Let's go.",
        { affinity: 0.02, flag: 'choice.m4_05_teeth_joke' }),
    ],
    completeAdd: [
      d('call_again', '울고 싶은 날엔 또 부르세요. 갈치는 핑계면 됩니다.', 'On days you feel like crying, call me again. The hairtail can be the excuse.',
        '…갈치가 핑계라니. 갈치가 들으면 서운하겠어요. (눈가를 손등으로 한 번 닦는다.)\n\n그래도 그 말은 받아 둘게요. 다음에 불 켤 일 있으면 연락할게요. 그땐 안 울게요. 노력해 볼게요.',
        "…The hairtail as an excuse. They'd be hurt to hear that. (She wipes the corner of her eye with the back of her hand.)\n\nBut I'll take you up on it. Next time there's a reason to light up, I'll call. I won't cry then. I'll try not to.",
        { affinity: 0.06, flag: 'choice.m4_05_call_again' }),
    ],
    completeReply: {
      silent: [
        '…고마워요. (다음 원정에 자기 호텔 숙박권을 한 장 준다.)\n\n묻지 않아 주는 사람이 제일 고마워요. 다들 괜찮냐고 물어서, 괜찮다고 대답하느라 더 힘들거든요. 갈치가 예뻤다는 말, 그거면 충분해요.',
        "…Thank you. (She gives me a night at her hotel for the next trip out.)\n\nPeople who don't ask are the ones I'm most grateful for. Everyone asks if I'm all right, and saying I'm fine wears me out more. That the hairtail were beautiful — that's enough.",
      ],
      ask: [
        '…다툰 날이었어요. 그 사람이랑. 그 얘긴 다음에요. (그래도 말을 시작했다는 게 중요하다.)\n\n…지금 말하면 또 울 것 같아서요. 오늘은 갈치만 봐요. 은빛 나는 거, 그거만요.',
        "…It was the day we argued. With him. Another time. (What matters is that she started talking at all.)\n\n…If I talk now, I'll just cry again. Tonight let's only look at the hairtail. The silver. Just that.",
      ],
    },
  },

  // ── M4-06 「첫 손님」 · 동명항 어촌계(계장) ──
  'M4-06': {
    offer: [
      d('welcome', '첫 손님, 제 배에 모시겠습니다. 명부부터 챙기겠습니다.', "I'll welcome my first passengers aboard. The list comes first.",
        '모신다는 말 좋다. 손님은 돈 내는 사람이기 전에 목숨 맡기는 사람이다.\n\n출항 전에 조끼 입었는지 네 눈으로 봐. 입었다는 말은 믿지 말고. 그다음이 고기다. 다녀와.',
        "Welcome is the right word. Before they're people paying you, passengers are people handing you their lives.\n\nBefore you sail, check the vests with your own eyes. Don't take their word for it. Fish come after that. Off you go.",
        { affinity: 0.04 }),
      d('ask_briefing', '안전교육은 손님한테 뭘 알려 드려야 합니까?', 'What should the safety briefing tell the passengers?',
        '조끼 입는 법, 구명부환 있는 데, 빠지면 어떻게 하는지. 그리고 배에서 뛰지 말 것.\n\n짧게 해. 길면 안 듣는다. 대신 눈 보고 해. 안 듣는 손님은 눈이 딴 데 가 있다. 그 손님을 한 번 더 봐.',
        "How to put on a vest, where the life rings are, what to do if someone goes over. And no running on board.\n\nKeep it short. Long, and they stop listening. But look them in the eye. The ones not listening have their eyes elsewhere. Look at those ones twice.",
        { affinity: 0.03, flag: 'choice.m4_06_asked_briefing' }),
      d('ask_seasick', '손님이 드러누우면 돌아가야 합니까?', 'If a passenger goes flat, do I have to turn back?',
        '한 사람 때문에 다 돌리면 나머지 손님 하루가 날아간다. 그렇다고 버려 두면 그 사람 하루가 날아가.\n\n멀미약 먹이고 바람 통하는 데 앉혀. 먼 데를 보게 해. 그래도 안 되면 그땐 돌아가. 판단은 선장이 하는 거다. 나가 봐.',
        "Turn back for one person and the others lose their day. Leave him be and he loses his.\n\nGive him a tablet and sit him where the air moves. Make him look far off. If that doesn't work, then you turn back. The call is the skipper's. Go on out.",
        { affinity: 0.03, flag: 'choice.m4_06_asked_seasick' }),
      d('discount', '첫 손님이면 값을 좀 깎아 드려야 합니까?', 'First passengers — should I give them a discount?',
        '깎지 마. 첫 손님 값을 깎으면 네 배 값이 깎인 거다. 다음 손님도 그 값을 안다.\n\n대신 고기를 아끼지 마. 손님이 한 마리라도 더 올리게 자리를 봐 줘. 그게 깎아 주는 거다. 나가.',
        "Don't. Cut the first fare and you've cut your boat's price. The next passengers will know that price too.\n\nInstead, don't stint on the fish. Find them spots so they land one more. That's your discount. Go.",
        { affinity: 0.01, flag: 'choice.m4_06_discount' }),
    ],
    completeAdd: [
      d('remember_guest', '다음 주에 또 온다는 손님, 이름을 외워 두겠습니다.', "The passenger who's coming back next week — I'll remember his name.",
        '그래. 이름 불러 주는 배에 손님이 다시 온다. 두 번째 오는 손님이 진짜 손님이다.\n\n명부는 버리지 말고 모아 둬. 그게 네 배 장부다. 돈 장부보다 그게 먼저야. (명부를 손바닥으로 두 번 두드린다.)',
        "Good. Passengers come back to a boat that calls them by name. The second visit is when they're really your passengers.\n\nDon't throw the lists away — keep them. That's your boat's ledger. It comes before the money ledger. (He taps the list twice with his palm.)",
        { affinity: 0.05, flag: 'choice.m4_06_remember_guest' }),
    ],
    completeReply: {
      seasick_guest: [
        '그게 선장이다. 조황보다 사람. (선장용 릴을 건네며 명부에 도장을 찍는다.)\n\n누웠던 손님이 또 온다며. 고기 때문이 아니야. 누웠을 때 챙겨 준 사람이 있어서지. 그게 영업이다.',
        "That's a skipper. People before catch. (He hands over a skipper's reel and stamps the register.)\n\nThe one who went flat is coming back, I hear. It's not the fish. It's because someone looked after him when he was down. That's the business.",
      ],
      money: [
        '이상해야 한다. 익숙해지면 손님이 짐이 돼. (릴을 건네며 그 말을 두 번 한다.)\n\n돈 받은 날부터 손님 목숨도 같이 받은 거다. 그 무게가 이상한 거야. 그 기분이 사라지는 날엔 배를 하루 쉬어라.',
        "It should. Once it stops, passengers become cargo. (He hands the reel over and says it twice.)\n\nThe day you take their money, you take their lives as well. That weight is what feels strange. The day that feeling goes, rest the boat for a day.",
      ],
    },
  },

  // ── M4-07 「서해로」 · 송기백 ──
  'M4-07': {
    offer: [
      d('three_only', '물때 맞춰 들어갔다가, 세 개만 캐고 나오겠습니다.', "I'll go in on the tide, dig three, and come straight out.",
        '세 개만이라는 말, 지켜. 갯벌에선 네 번째 욕심이 사람을 잡아.\n\n물 빠지는 것만 보고 들어가지 말고, 물 들어오는 때부터 알아 둬. 나올 때를 먼저 정하고 들어가는 거야. 가.',
        "Keep to that three. On the flats it's the greed for a fourth that gets people.\n\nDon't just watch the water go out and walk in. Know when it comes back first. You decide when you're coming out before you go in. Go on.",
        { affinity: 0.04 }),
      d('ask_sink', '빠지는 거라니요? 걷는 법이 따로 있습니까?', 'Sunk into? Is there a special way to walk on it?',
        '있지. 발을 세우지 말고 눕혀. 뒤꿈치부터 꽂으면 박혀서 안 빠져. 발바닥을 넓게 디뎌.\n\n빠지면 발을 들지 말고 비틀어 빼. 들면 진흙이 신발부터 가져가. 처음 오는 사람은 다 그걸로 배워. 들어가 봐.',
        "There is. Don't plant your feet upright — lay them flat. Heel first and you stick fast. Put your whole sole down.\n\nIf you sink, don't lift — twist it out. Lift, and the mud takes your shoe first. Everyone learns that the first time. In you go.",
        { affinity: 0.03, flag: 'choice.m4_07_asked_sink' }),
      d('ask_tide', '동해랑 그렇게 다릅니까? 물이 얼마나 빠집니까?', 'Is it that different from the East Sea? How far does the water go out?',
        '동해는 물이 한 뼘 오르내리지. 여긴 사람 키를 몇 번 넘게 오르내려. 하루 두 번, 수백 걸음씩 물이 왔다 갔다 해.\n\n동해 버릇으로 들어오면 물이 등 뒤에서 와. 소리도 없이. 그래서 서해 사람은 바다를 등지고 안 서. 물때 보고 들어가.',
        "In the East the water rises and falls a hand's width. Here it's several times a man's height. Twice a day the sea walks hundreds of paces in and out.\n\nCome in with East Sea habits and the water arrives behind you. Without a sound. That's why West Sea folk never turn their backs on the sea. Check the tide, then go in.",
        { affinity: 0.03, flag: 'choice.m4_07_asked_tide' }),
      d('rescue_joke', '빠지면 누가 꺼내 줍니까? 송기백 씨가 오십니까?', 'If I get stuck, who pulls me out? Will you come?',
        '여든 넘은 늙은이가 자네를 꺼내? (껄껄 웃는다.)\n\n빠지면 자네가 나와야지. 그래서 혼자 깊이 들어가지 말라는 거야. 내가 보이는 데까지만. 그 안에서 세 개.',
        "A man past eighty pulling you out? (He laughs out loud.)\n\nIf you sink, you get yourself out. That's why I'm telling you not to go deep alone. Only as far as I can see. Three, inside that.",
        { affinity: 0.02, flag: 'choice.m4_07_rescue_joke' }),
    ],
    completeAdd: [
      d('ask_home', '폐어선에서 지내시는 건 불편하지 않으십니까?', "Isn't it uncomfortable, living in an old boat?",
        '안 뜨는 배라도 배는 배야. 물이 들어오면 밑에서 소리가 나. 그 소리 들으면서 자는 게 편해.\n\n왜 여기 사냐고는 묻지 마. 늙은이 사연은 길어. 그건 다음에 하지.',
        "A boat that doesn't float is still a boat. When the tide comes in, it makes a sound underneath. I sleep easier hearing that.\n\nDon't ask why I live here. An old man's story is long. Another time.",
        { affinity: 0.04, flag: 'choice.m4_07_ask_home' }),
    ],
    completeReply: {
      shoe: [
        '갯벌이 받은 거야. 통행세. (노인이 낡은 장화 한 켤레를 준다.)\n\n신발 잃고 우는 사람도 있고 웃는 사람도 있어. 웃는 사람이 다시 와. 다음엔 장화 끈을 발목에 한 번 감고 들어가.',
        "The flats took it. Toll money. (The old man gives me a pair of worn boots.)\n\nSome people cry when they lose a shoe, some laugh. The ones who laugh come back. Next time, wrap the boot strap round your ankle once before you go in.",
      ],
      tide: [
        '무서워야 살아. 서해는 물이 사람보다 빨라. (물때표 한 장을 손으로 그려 준다.)\n\n무서운 걸 알았으면 이제 물때표를 믿어. 눈으로 보고 판단하면 늦어. 물은 보이기 전에 이미 와 있거든.',
        "Be frightened and you'll live. On the west coast the water is faster than a man. (He draws me a tide table by hand.)\n\nNow you know the fear, trust the tide table. Judge by eye and you're too late. By the time you see the water, it's already here.",
      ],
    },
  },

  // ── M4-08 「만리포 서프」 · 탁새벽 ──
  'M4-08': {
    offer: [
      d('trust_rod', '네가 만든 대면 믿고 던져 볼게.', "If you made the rod, I'll trust it and cast.",
        '당연하지. 할아버지 거 아니고 내 거야. 서프용으로 내가 깎았어. (대를 내밀다가 다시 당긴다.)\n\n근데 허리로 던져. 팔로 던지면 대가 아파해. 대 아픈 거 나 다 알아. 자, 이제 진짜 줄게.',
        "Obviously. Not grandfather's — mine. I cut it for surf. (He holds the rod out, then pulls it back.)\n\nBut throw from your hips. Throw with your arms and the rod hurts. I can always tell when a rod hurts. Okay, here, for real this time.",
        { affinity: 0.04 }),
      d('ask_foam', '포말대가 뭔데? 파도 거품 있는 데?', "What's the foam line? Where the waves go white?",
        '응. 파도가 부서져서 하얗게 되는 데. 거기서 작은 고기들이 정신을 못 차려. 농어는 그걸 노려.\n\n너무 멀리 던지면 지나가고, 너무 가까우면 발밑이야. 부서지는 그 줄에 넣어. 밤엔 안 보이니까 소리로 찾아.',
        "Yeah. Where the waves break and turn white. The little fish get all muddled in there. Sea bass hunt that.\n\nThrow too far and you're past it, too close and it's at your feet. Put it right on the line where they break. At night you can't see it, so find it by sound.",
        { affinity: 0.03, flag: 'choice.m4_08_asked_foam' }),
      d('pride_joke', '너한테 배우려니 자존심이 좀 상하는데.', 'Learning from you stings my pride a bit.',
        '나 이제 열두 살 아니거든? (발끝으로 모래를 찬다.)\n\n그리고 대는 나이로 만드는 거 아니야. 마디 보는 눈이 있으면 돼. 나 그거 있어. 자존심은 농어 잡고 나서 세워.',
        "I'm not twelve anymore, you know. (He kicks at the sand with his toe.)\n\nAnd rods aren't made by age. You just need an eye for the joints. I've got that. Stand on your pride after you've caught a sea bass.",
        { affinity: 0.01, flag: 'choice.m4_08_pride_joke' }),
      d('ask_night', '왜 꼭 밤이야? 낮엔 농어가 없어?', 'Why does it have to be night? No sea bass in the day?',
        '낮에도 있어. 근데 낮엔 겁이 많아. 밤엔 파도 가까이 붙어서 대담해져.\n\n그리고 밤엔 사람이 없잖아. 시끄러운 사람들 없을 때가 좋아. 너는 조용하니까 괜찮아. 가자.',
        "There are. But in the day they're scared. At night they come right up to the waves and get bold.\n\nAnd there's nobody around at night. It's better without noisy people. You're quiet, so you're fine. Let's go.",
        { affinity: 0.03, flag: 'choice.m4_08_asked_night' }),
    ],
    completeAdd: [
      d('show_grandpa', '이 대, 탁만수 씨께도 보여 드려. 자랑해도 돼.', "Show this rod to Mansu too. You've earned the brag.",
        '…할아버지는 자랑하면 싫어해. 대는 말로 하는 거 아니래.\n\n그래도 네가 잡은 농어 얘기는 할 거야. 그건 자랑이 아니라 증거니까. 증거는 괜찮잖아. 그치?',
        "…Grandfather hates bragging. He says a rod doesn't do its talking with words.\n\nBut I'll tell him about the sea bass you caught. That's not bragging, that's evidence. Evidence is allowed. Right?",
        { affinity: 0.05, flag: 'choice.m4_08_show_grandpa' }),
    ],
    completeReply: {
      praise: [
        '…내가 만든 거 맞지? 할아버지가 아니라? (아이가 대를 한 번 더 쓰다듬고 건넨다.)\n\n파도 이긴 대면 진짜 대 맞지? 그럼 이제 내 이름 새겨도 되겠다. 손잡이 밑에, 아주 작게. 너만 알게.',
        "…I built it, right? Not grandfather? (The boy strokes the rod once more before handing it over.)\n\nA rod that beat the waves is a real rod, right? Then I can carve my name on it now. Under the grip, really small. So only you know.",
      ],
      teach_me: [
        '나는 만드는 사람인데… 그래도 한 번만. (서프 캐스팅 자세가 달라진다.)\n\n허리부터 돌려. 팔은 마지막에 따라오는 거야. 대가 휘었다가 펴질 때 놔. 할아버지한테는 비밀. 만드는 사람이 던지는 걸 가르쳤다고 웃을 거야.',
        "I'm the one who makes them, though… all right, just once. (My surf casting stance changes.)\n\nTurn from the hips first. The arms come along last. Let go when the rod bends and springs back. Keep it secret from grandfather. He'll laugh that the maker was teaching casting.",
      ],
    },
  },

  // ── M4-09 「갑오징어」 · 마감기 ──
  'M4-09': {
    offer: [
      d('split_work', '좋습니다. 마감기 씨는 그리시고, 저는 낚겠습니다.', "Fine by me. You draw, and I'll fish.",
        '역할 분담 완벽해요! 오늘 이 배에서 일하는 사람은 우리 둘뿐이에요. 선장님 빼고요.\n\n에기는 바닥까지 내려요. 두 번 튕기고 멈춰요. 갑오징어는 멈췄을 때 안아요. 세 번 튕기면 도망가요. 이건 제가 취재해서 알아요. 출항해요!',
        "Perfect division of labour! The only two people working on this boat today are us. Not counting the skipper.\n\nDrop the egi to the bottom. Twitch twice and stop. Cuttlefish grab it on the pause. Twitch three times and they flee. I know this — I researched it. Let's head out!",
        { affinity: 0.04 }),
      d('ask_pd', 'PD가 쫓아오는 겁니까? 무슨 일이 있으신데요?', "Your producer's after you? What's going on?",
        '마감이요. 원고가 좀… 많이 늦었어요. 전화가 열몇 통 와 있어요.\n\n근데 배 위에선 전화 안 받아도 핑계가 되잖아요. 파도 소리 때문에 못 들었다고. 그래서 갑오징어 배예요. 낚시도 진심이에요. 진짜로. 타요.',
        "The deadline. The manuscript's a bit… very late. There are a dozen-odd missed calls.\n\nBut on a boat, not picking up has an excuse. Couldn't hear it over the waves. Hence the cuttlefish boat. The fishing's sincere too. Really. Get on.",
        { affinity: 0.03, flag: 'choice.m4_09_asked_pd' }),
      d('ask_conti', '콘티가 뭡니까? 배 위에서 그림을 그리십니까?', 'What are storyboards? You draw them on a boat?',
        '장면을 순서대로 그린 그림이요. 이 컷 다음에 이 컷. 찍기 전에 그리는 설계도예요.\n\n책상에선 한 장도 안 나오는데 흔들리는 데선 이상하게 손이 움직여요. 오늘 장면은 바다예요. 바다는 바다에서 그려야죠. 가요.',
        "Pictures of the scenes, in order. This shot, then this shot. A blueprint you draw before filming.\n\nAt a desk I can't get a single page out, but somewhere that rocks, my hand moves, strangely. Today's scenes are the sea. You draw the sea at sea. Let's go.",
        { affinity: 0.03, flag: 'choice.m4_09_asked_conti' }),
      d('accomplice', '도망 오신 거면, 저는 공범이 되는 겁니까?', 'If you ran away, does that make me your accomplice?',
        '공범… 좋은 단어네요. 메모할게요. (정말로 수첩에 적는다.)\n\n걱정 마요. 갑오징어 잡으면 공범이 아니라 취재 협조자예요. 협조자는 처벌 안 받아요. 아마요. 에기 챙겨요.',
        "Accomplice… nice word. I'm writing that down. (The writer really does note it in a pocketbook.)\n\nDon't worry. Catch a cuttlefish and you're not an accomplice, you're a research collaborator. Collaborators don't get punished. Probably. Grab your egi.",
        { affinity: 0.02, flag: 'choice.m4_09_accomplice' }),
    ],
    completeAdd: [
      d('lost_egi', '에기를 또 잃었습니다. 마감기 씨 책임도 있습니다.', "I lost another egi. Some of that's on you.",
        '제 책임 맞아요. 바닥에 걸리는 거 보고도 그림만 그렸어요. (에기 값을 계산하는 척하다 펜을 내려놓는다.)\n\n대신 장면은 건졌어요. 에기 잃고 허탈한 얼굴. 그게 오늘 제일 진짜 같은 컷이에요. 고마워요.',
        "It is on me. I saw it snag the bottom and just kept drawing. (The writer pretends to tally the cost of the egi, then puts the pen down.)\n\nBut I got the shot. The face of someone who's just lost an egi. That's the realest frame of the day. Thank you.",
        { affinity: 0.03, flag: 'choice.m4_09_lost_egi' }),
    ],
    completeReply: {
      ink: [
        '그게 갑오징어예요. 콘티에 그렸어요, 그 장면. (편집본에 내가 먹물을 맞는 컷이 있다.)\n\n먹물 맞는 순간이 오늘 제일 좋은 컷이에요. 사람이 진짜 놀라는 얼굴은 연기로 안 나오거든요. 고마워요. 진심으로요.',
        "That's cuttlefish for you. I storyboarded that shot. (In the final cut there's a frame of me taking the ink.)\n\nThe moment the ink hit you is the best frame of the day. A really surprised face can't be acted. Thank you. I mean it.",
      ],
      deadline: [
        '…배에서 다 그렸어요. 바다가 마감을 끝내 줬어요. (원고 한 장을 찢어 사인해 준다.)\n\nPD한테는 내일 보낼 거예요. 오늘은 바다 냄새 빠질 때까지 들고 있을래요. 이렇게 보내기 아까운 원고는 처음이에요.',
        "…I drew it all on the boat. The sea finished my deadline for me. (She tears off a page and signs it for me.)\n\nThe producer gets it tomorrow. Tonight I'm holding on to it until the sea smell fades. I've never had pages I didn't want to hand in before.",
      ],
    },
  },

  // ── M4-11 「속초의 손님」 · 강두철 ──
  'M4-11': {
    offer: [
      d('full_and_fish', '모시겠습니다. 정가로 받고, 고기는 넉넉히 올려 드리겠습니다.', "I'll take you both. Full fare, and plenty of fish to go with it.",
        '허허, 정가에 넉넉히라. 장사 배웠구먼. 그 말이면 됐네.\n\n동해안 따라 천천히 올라오게. 서두르면 기름을 먹고, 기름 먹으면 정가로 받아도 남는 게 없어. 우리는 부두에서 기다리지.',
        "Heh, full fare and plenty. You've learned the trade. That'll do.\n\nCome up the east coast nice and slow. Hurry and you burn fuel, and burn fuel and you're left with nothing even at full fare. We'll be waiting on the pier.",
        { affinity: 0.04 }),
      d('ask_tak', '탁만수 씨도 배를 타십니까? 공방만 지키시는 줄 알았습니다.', "Mansu's coming out on a boat? I thought he never left the workshop.",
        '대 깎는 사람이 자기 대가 바다에서 어떻게 휘는지 안 보고 싶겠나. 자네 손에서 고기를 건 대라니 더 그렇지.\n\n탁 씨는 말 안 하겠지만, 자네 배라서 타는 거야. 그건 알고 모시게.',
        "A man who cuts rods — wouldn't he want to see how his rods bend at sea? All the more when it's a rod that hooked fish in your hands.\n\nTak won't say it, but he's coming because it's your boat. Know that when you take him out.",
        { affinity: 0.03, flag: 'choice.m4_11_asked_tak' }),
      d('long_way', '속초까지 하루 반입니다. 혼자 몰고 갈 수 있을까요?', "It's a day and a half to Sokcho. Can I really bring her up alone?",
        '동해안은 육지를 옆에 끼고 오는 길이야. 해 지면 가까운 항구에 들어가 자고, 날 밝으면 또 오게.\n\n밤바다를 혼자 건너는 게 실력이 아니네. 쉬어 가는 것도 실력이지. 늙은이들은 기다리는 거 하나는 잘해.',
        "Along the east coast you've got land beside you the whole way. When the sun goes down, put in at the nearest harbour and sleep, then come on at first light.\n\nCrossing the night sea alone isn't skill. Knowing when to rest is. And waiting is the one thing old men are good at.",
        { affinity: 0.02, flag: 'choice.m4_11_long_way' }),
      d('rig_joke', '강두철 씨 채비는 이번에도 제가 묶어 드려야 합니까?', 'Will I be tying your rig for you again this time?',
        '허허, 그래 주면 고맙지. (손가락을 꼼지락거려 보인다.)\n\n농담일세. 이번엔 내가 묶어 옴세. 자네는 키만 잡게. 손님이 채비까지 선장한테 맡기면 그건 손님이 아니라 짐이야.',
        "Heh, I'd be grateful if you did. (He wiggles his fingers at me.)\n\nI'm joking. This time I'll come with it tied. You just take the wheel. A passenger who leaves even his rig to the skipper isn't a passenger, he's cargo.",
        { affinity: 0.03, flag: 'choice.m4_11_rig_joke' }),
    ],
    completeAdd: [
      d('lucky_boat', '두 분 다 한 마리씩 올리셨습니다. 제 배가 운이 좋은가 봅니다.', "You both landed one. Maybe my boat's just lucky.",
        '운은 무슨. 자네가 물 보고 자리 잡은 거 다 봤네. 탁 씨도 봤고.\n\n손님은 운 보고 한 번 오고, 선장 보고 두 번 오는 거야. 우리는 두 번 올 걸세. (모자를 고쳐 쓴다.)',
        "Luck, nothing. I saw you read the water and pick the spot. So did Tak.\n\nPassengers come once for luck and a second time for the skipper. We'll be coming twice. (He settles his cap.)",
        { affinity: 0.05, harborRep: 1, flag: 'choice.m4_11_lucky_boat' }),
    ],
    completeReply: {
      full_price: [
        '그게 맞아. (두 노인이 봉투를 하나씩 내민다. 탁 노인 봉투에는 대나무 조각이 들어 있다.)\n\n정가로 받는 선장한테는 손님이 값을 깎자고 안 해. 그게 자네 배 값이야. 대나무 조각은 탁 씨 마음이니 그건 따로 받아 두게.',
        "That's right. (The two old ones each hold out an envelope. In old Tak's there is a strip of bamboo.)\n\nNobody haggles with a skipper who charges full fare. That's what your boat is worth. The bamboo is Tak's own feeling — keep that apart from the fare.",
      ],
    },
  },

  // ── M4-10 「제주 항로」 · 도현수 ──
  'M4-10': {
    offer: [
      d('deal', '좋아. 연료는 네가, 기상은 내가. 그게 낫겠다.', "Fine. You take the fuel, I'll take the weather. That's better.",
        '…바로 받네. 따질 줄 알았는데. (계산기를 꺼낸다.)\n\n제주 가는 길은 중간에 기름 넣을 데가 마땅치 않아. 계산은 넉넉하게 한다. 남는 기름은 아까운 게 아니라 보험이야. 너는 하늘이나 봐.',
        "…Straight yes. I thought you'd argue. (He pulls out a calculator.)\n\nThere's nowhere decent to refuel on the way to Jeju. I'll work it out with a margin. Spare fuel isn't waste, it's insurance. You watch the sky.",
        { affinity: 0.05 }),
      d('ask_why', '네가 왜 내 배에 타? 네 할아버지가 시키셨어?', 'Why are you getting on my boat? Did your grandfather put you up to it?',
        '할아버지는 아무 말 안 했어. 내가 타겠다고 한 거야. (시선을 피한다.)\n\n…장거리는 혼자 보는 눈보다 둘이 보는 눈이 낫잖아. 그 이상은 묻지 마. 연료 계산이나 하게 둬.',
        "Grandfather didn't say a word. I'm the one who said I'd come. (He looks away.)\n\n…On a long run, two pairs of eyes beat one. Don't ask more than that. Just let me do the fuel.",
        { affinity: 0.03, flag: 'choice.m4_10_asked_why' }),
      d('ask_weather', '기상은 왜 나야? 너도 볼 줄 알잖아.', 'Why do I get the weather? You can read it too.',
        '볼 줄은 알지. 근데 둘 다 숫자만 보면 하늘은 아무도 안 봐. 한 사람은 계산하고, 한 사람은 밖을 봐야 해.\n\n나는 계산이 편하고, 너는 밖을 오래 보는 사람이잖아. 방파제에서부터 그랬어. 그러니까 네가 봐.',
        "I can. But if we both stare at numbers, nobody watches the sky. One person calculates, one person looks outside.\n\nI'm comfortable with numbers, and you're someone who looks out for a long time. You've been like that since the breakwater. So you watch it.",
        { affinity: 0.03, flag: 'choice.m4_10_asked_weather' }),
      d('captain_tease', '내 배에 타면 넌 선원이다. 선장 말 들어.', "On my boat, you're crew. You listen to the skipper.",
        '…선원은 무슨. 손님도 아니고 선원도 아니야. 그냥 같이 가는 거지.\n\n(그래도 짐을 내려놓고 밧줄부터 정리한다.) 네 배니까 네가 정하는 건 따를게. 기상만큼은. 연료는 내 말 들어.',
        "…Crew, my foot. Not a customer and not crew either. Just someone going along.\n\n(Still, he puts his bag down and starts coiling the lines.) It's your boat, so I'll go with your call. On the weather. On fuel, you listen to me.",
        { affinity: 0.02, flag: 'choice.m4_10_captain_tease' }),
    ],
    completeAdd: [
      d('thanks', '고맙다. 혼자였으면 기름을 모자라게 잡았을 거야.', "Thanks. On my own I'd have come up short on fuel.",
        '…알아. 너 계산 대충 하잖아. (계산표를 손가락으로 툭 친다.)\n\n고맙다는 말은 제주 도착하면 해. 바다 한가운데서 하면 재수 없어. 그때까지 아껴 둬.',
        "…I know. You're sloppy with numbers. (He flicks the calculation sheet with a finger.)\n\nSay thanks when we reach Jeju. Saying it in the middle of the sea is bad luck. Save it till then.",
        { affinity: 0.06, flag: 'choice.m4_10_thanks' }),
    ],
    completeReply: {
      together: [
        '…나도. 말하지 마. (그가 연료 계산표를 내게 준다. 글씨가 곱다.)\n\n배 위에서만이야. 내리면 원래대로. …그래도 다음 장거리 때 연료 계산은 또 내가 한다.',
        "…Same. Don't say it out loud. (He hands me the fuel calculations. His handwriting is neat.)\n\nOnly on the boat. Back to normal once we're ashore. …Though on the next long run, I'm doing the fuel again.",
      ],
      rival: [
        '당연하지. 배 위에서만 같은 편이야. (웃는다. 오래 못 본 웃음이다.)\n\n대회에서 봐주면 그땐 진짜 안 본다. 전력으로 와. 나도 그렇게 할 거니까.',
        "Obviously. We're only on the same side aboard. (He laughs. I haven't seen that laugh in a long time.)\n\nGo easy on me at the tournament and we're done for real. Come at full strength. I will.",
      ],
    },
  },
};
