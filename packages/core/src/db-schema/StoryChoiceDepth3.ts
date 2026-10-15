/**
 * @file StoryChoiceDepth3.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 3묶음: 메인 5 · 6 · 7장(M5-01 ~ M7-08).
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { d } from './StoryChoiceDepthKit.js';

export const CHOICE_DEPTH_3: Record<string, ChoiceDepthEntry> = {
  // ── M5-01 「운진항」 · 동명항 어촌계 ──
  'M5-01': {
    offer: [
      d('take_letter', '소개장 챙기겠습니다. 계 이름 걸고 들어가는 거니까요.', "I'll take the letter. I'm going in under the co-op's name, after all.",
        '그래. 소개장은 종이 한 장이지만 그 안에 계 이름이 들어 있다. 창구에서 그걸 먼저 내밀어.\n\n남의 항구에 들어갈 때는 우리 항구 얼굴로 들어가는 거다. 네 얼굴이 아니라. 그걸 알면 서류는 저절로 맞는다.',
        "Right. The letter is one sheet of paper, but the co-op's name is in it. Hand it over first at the window.\n\nGoing into another man's harbour, you go in wearing our harbour's face. Not your own. Know that and the paperwork sorts itself out.",
        { affinity: 0.04 }),
      d('ask_three', '왜 하필 세 번입니까? 두 번 물으면 안 됩니까?', "Why three times? Can't I just ask twice?",
        '두 번 물으면 못 알아들은 거고, 세 번 물으면 배우려는 거다. 그쪽도 그 차이를 안다. (서류철을 덮으며 말한다.)\n\n네 번째부터는 웃어. 그쯤 되면 창구도 웃는다. 그 웃음이 항비보다 싸게 먹힌다.',
        "Ask twice and you didn't understand. Ask three times and you're trying to learn. They know the difference. (He says it closing the file.)\n\nFrom the fourth time, smile. By then the window will be smiling too. That smile comes cheaper than the dues.",
        { affinity: 0.03, flag: 'choice.m5_01_asked_three' }),
      d('ask_dues', '항비는 얼마나 됩니까? 연료값도 빠듯한데요.', 'How much are the harbour dues? Fuel money is already tight.',
        '항구마다 다르다. 배 크기, 묶는 날수. 창구에서 물어보고 영수증 받아 둬.\n\n빠듯한 건 안다. 그래도 항비 아끼려고 바깥에 묶는 놈은 바람 한 번에 배를 잃는다. 돈은 내고 영수증은 들고 와라. 들어오면 계에서 그만큼은 챙겨 줄 거다.',
        "Every port is different. Size of boat, days tied up. Ask at the window and keep the receipt.\n\nI know it's tight. But a man who ties up outside to save on dues loses his boat to one gust. Pay it and bring the receipt. Once you're in, the co-op will see you're covered that far.",
        { affinity: 0 }),
      d('hyeonsu_joke', '화는 안 냅니다. 도현수가 옆에서 웃는 것만 참으면요.', "I won't get angry. As long as I can put up with Do Hyeonsu laughing beside me.",
        '그 애가 웃거든 그냥 둬라. 그게 그 애 나름대로 거드는 거다. (계장이 헛기침을 한다.)\n\n배는 같이 타고 왔어도 서류는 네 이름이다. 그 애한테 미루지 말고 네 입으로 물어. 화는 둘 다 내지 말고.',
        "If the lad laughs, let him. That's his way of helping. (The chief clears his throat.)\n\nYou came over on the same boat, but the papers are in your name. Don't hand it to him. Ask with your own mouth. And neither of you gets angry.",
        { affinity: 0.02, flag: 'choice.m5_01_hyeonsu_joke' }),
    ],
    completeAdd: [
      d('receipt', '항비 영수증입니다. 축하금은 계 장부에 먼저 적어 두십시오.', 'Here are the dues receipts. Please log the payment in the co-op ledger first.',
        '…장부까지 챙기냐. 계원 다 됐다. (영수증을 장부 사이에 끼우고 봉투를 다시 손에 쥐여 준다.)\n\n이 돈은 장부에 묶어 둘 돈이 아니라 네가 쓰라고 주는 돈이다. 제주에서 첫 손님 태울 때 기름 걱정 없게.',
        "...Minding the ledger too, are you. You're a proper member now. (He tucks the receipts into the ledger and presses the envelope back into my hand.)\n\nThis money isn't for sitting in a ledger. It's for you to use. So you don't worry about fuel when you take your first Jeju passengers.",
        { harborRep: 1, flag: 'choice.m5_01_receipt' }),
    ],
    completeReply: {
      dialect: [
        '웃었으면 됐다. 화내면 항비가 오른다. (축하금 봉투에 방언 몇 마디를 적어 준다.)\n\n맨 위에 적은 게 고맙수다다. 그 한마디는 외워 가. 세 번 되묻는 놈은 많아도 그쪽 말로 고맙다고 하는 놈은 드물다.',
        "If he laughed, it's fine. Get angry and the harbour fees go up. (In the congratulations envelope he's written out a few dialect phrases.)\n\nThe one at the top is gomapsuda. Learn that one by heart. Plenty of people ask three times, but few say thank you in their words.",
      ],
      wind: [
        '그 바람에 익숙해져야 제주 손님을 받는다. (봉투를 건네며 손님 명부 양식을 끼워 준다.)\n\n짠 바람은 줄도 빨리 먹고 쇠는 더 빨리 먹는다. 릴은 저녁마다 민물로 닦아라. 손님 앞에서 녹슨 릴 꺼내는 가이드는 없다.',
        "Get used to that wind and you can take Jeju passengers. (Handing over the envelope, he tucks in a passenger register form.)\n\nA salty wind eats line fast and eats metal faster. Rinse your reels in fresh water every evening. No guide pulls a rusty reel out in front of passengers.",
      ],
    },
  },

  // ── M5-02 「불턱」 · 바람 ──
  'M5-02': {
    offer: [
      d('outside_only', '표지 밖에서만 캐겠습니다. 손이 근질거려도요.', 'Only outside the markers. Even if my hands itch.',
        '근질거려야 정상이야. 표지 안쪽이 더 좋아 보이는 건 거기가 지켜진 바다라서야.\n\n지킨 사람이 따로 있으니 그 바다는 그 사람들 거지. 밖에서 세 개. 그거면 너도 오늘 이 바다 손님은 되는 거야.',
        "They should itch. Inside the markers looks better because that sea has been looked after.\n\nSomeone else did the looking after, so it's theirs. Three from outside. That's enough to make you a guest of this sea today.",
        { affinity: 0.04 }),
      d('ask_greet', '인사는 어떻게 합니까? 고개만 숙이면 됩니까?', 'How do I greet her? Do I just bow my head?',
        '고개 숙이고, 손에 든 걸 보여 줘. 뭘 캤는지, 어디서 캤는지. 감출 게 없다는 게 인사야.\n\n말은 안 해도 돼. 그쪽은 평생 물속에서 숨 참고 일한 사람들이야. 말보다 손을 먼저 봐. (담배를 문 채 표지석 쪽을 턱으로 가리킨다.)',
        "Bow, and show what's in your hand. What you took and where. Having nothing to hide is the greeting.\n\nYou needn't talk. Those women have worked holding their breath under water all their lives. They look at hands before words. (Cigarette in his mouth, he jerks his chin toward the marker stones.)",
        { affinity: 0.03, flag: 'choice.m5_02_asked_greet' }),
      d('owner_doubt', '바다에 주인이 어디 있습니까. 표지 하나로요?', 'Since when does the sea have an owner? Because of a marker?',
        '있어. 마을어업권은 그 마을이 대대로 가꾼 바다에 붙은 권리야. 전복 씨 뿌리고, 성게 걷어 내고, 쉬는 철 지키고.\n\n주인 없다고 들어가는 놈이 제일 먼저 바다를 비워. 따지고 싶으면 따져. 캐는 건 밖에서 하고. (리어카 손잡이에 기대 웃지도 않는다.)',
        "It does. Village fishery rights belong to a sea the village has tended for generations. Seeding abalone, clearing out urchins, keeping the resting seasons.\n\nThe man who walks in because nobody owns it is the first to empty it. Argue if you like. Gather outside while you do. (He leans on the cart handle, not smiling.)",
        { affinity: -0.02, flag: 'choice.m5_02_owner_doubt' }),
    ],
    completeAdd: [
      d('asked_teacher', '이런 예의는 누구한테 배우셨습니까.', 'Who taught you manners like these?',
        '…항구마다 다 선생이야. 한 항구에 오래 안 있으니까 예의라도 빨리 배워야지. (담뱃불을 붙이다 만다.)\n\n그 얘긴 나중에. 바람 부는 쪽을 보고 다니면 언젠가 알게 될 거야. 오늘은 네가 캔 세 개나 챙겨.',
        "...Every harbour's a teacher. I never stay long in one, so I have to learn the manners fast. (He goes to light a cigarette and stops.)\n\nThat's for later. Keep watching which way the wind blows and you'll know someday. Today, just mind the three you gathered.",
        { affinity: 0.03, flag: 'choice.m5_02_asked_teacher' }),
    ],
    completeReply: {
      bow: [
        '답이 없는 게 답이야. 다음에 또 인사해. (바람이 물질 도구 하나를 준다. 자기 것이다.)\n\n두 번째도 답은 없을 거야. 세 번째쯤 고개를 끄덕이면 그때부터 이 불턱 사람들이 너를 알아. 그 도구는 표지 밖에서만 써.',
        "No answer is the answer. Greet her again next time. (Baram gives me a diving tool. His own.)\n\nThe second time there won't be an answer either. Around the third she'll nod, and from then on the people of this bulteok know you. Use that tool outside the markers only.",
      ],
      unsure: [
        '둘 다야. 남의 바다는 늘 둘 다지. (담배를 끄고 리어카를 끈다.)\n\n허락만 있는 바다도 없고 감시만 있는 바다도 없어. 허락받은 놈도 지켜보는 눈은 늘 등에 달고 다녀. 그 눈이 불편하지 않으면 된 거야.',
        "It's both. Another man's sea is always both. (He stubs out his cigarette and takes up the handcart.)\n\nNo sea gives only permission, and none only watches. Even someone who's allowed in carries those eyes on his back. If they don't bother you, you're doing fine.",
      ],
    },
  },

  // ── M5-03 「도두항 한치」 · 오세린 ──
  'M5-03': {
    offer: [
      d('catch_up', '열 마리라. 세 마리부터 따라가 보지.', "Ten, huh. I'll start by catching up to three.",
        '세 마리면 제 기록 삼분의 일이에요. 그래도 따라오겠다는 말은 좋아요! (에기 상자를 열어 색을 고른다.)\n\n집어등 켜면 한치가 빛 가장자리로 떠요. 가운데 말고 가장자리. 그거 하나만 기억해요. 나머지는 옆에서 보면서 말해 줄게요.',
        "Three is a third of my record. Still, I like that you said you'll catch up! (She opens her egi box and picks a colour.)\n\nWhen the lamps go on, the squid rise to the edge of the light. Not the middle, the edge. Just remember that. I'll tell you the rest from beside you.",
        { affinity: 0.04 }),
      d('ask_tourney', '대회 지망생이라더니, 무슨 대회를 준비하는데?', "You said you're aiming for a tournament. Which one?",
        '제주에서 하는 낚시 대회요. 예선 거쳐서 결선 가는 거. 저는 이번에 꼭 결선 갈 거예요.\n\n그러려면 밤마다 한치로 손을 풀어야 해요. 한치는 빨리 걷어야 다음 놈이 붙거든요. 아저씨도 나갈래요? 예선은 참가비만 내면 아무나 나가요.',
        "The fishing tournament here in Jeju. You go through the qualifier, then the final. This time I'm making the final for sure.\n\nFor that I warm my hands up on squid every night. With squid you've got to land them fast so the next one takes. Want to enter, mister? Anyone can do the qualifier if they pay the entry fee.",
        { affinity: 0.03, flag: 'choice.m5_03_asked_tourney' }),
      d('mister', '아저씨는 좀 그렇다. 나 그렇게 나이 많지 않아.', "Mister is a bit much. I'm not that old.",
        '그럼 뭐라고 불러요? 선장님? 아직 한치 세 마리도 못 잡았는데요. (웃음을 참지 않는다.)\n\n세 마리 잡으면 다시 생각해 볼게요. 그 전까지는 아저씨예요. 억울하면 빨리 잡아요. 에기는 살짝, 세게 튕기면 다 도망가요.',
        "Then what do I call you? Captain? You haven't even caught three squid yet. (She doesn't bother hiding her laugh.)\n\nCatch three and I'll think about it. Until then, it's mister. If that stings, catch them faster. Twitch the egi gently. Hard, and they all run.",
        { affinity: 0.02, flag: 'choice.m5_03_mister' }),
      d('first_night', '밤낚시는 자신 없는데. 한치는 처음이다.', "I'm not sure about night fishing. Squid is new to me.",
        '처음이면 더 좋아요. 이상한 버릇이 없잖아요. (집어등 스위치를 툭 켠다.)\n\n한치는 촉완으로 먼저 감아요. 그때 챔질하면 다리만 걸려요. 무게가 실릴 때까지 한 박자 참아요. 그거 하나면 세 마리는 해요.',
        "First time's better. No bad habits. (She flicks the fish lamp on.)\n\nSquid wrap with the tentacles first. Strike then and you only hook the arms. Hold off a beat until you feel the weight. Do just that and you'll get three.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('credit_serin', '네가 옆에서 한 박자 참으라고 한 거, 그게 다였다.', 'You telling me to hold off a beat. That was all it took.',
        '…제가 말한 거 맞긴 한데요. (괜히 에기 상자를 닫았다 다시 연다.)\n\n가르쳐 준 걸 잘 썼다는 말은 처음 들어 봐요. 늘 제가 잡기만 했지 말해 준 적은 별로 없거든요. 예선 가서도 써먹어요. 제 말이라고는 하지 말고요.',
        "...I did say that, yeah. (For no reason she shuts her egi box and opens it again.)\n\nNobody's ever told me they used what I taught them. I'm always the one catching, I don't usually explain. Use it at the qualifier too. Just don't say it was my line.",
        { affinity: 0.08, flag: 'choice.m5_03_credit_serin' }),
    ],
    completeReply: {
      slow: [
        '인정하면 빨라져요. (자기 에기 하나를 준다. 대회용이라고.)\n\n색이 좀 바랬는데 한치가 제일 잘 안는 색이에요. 잃어버리면 저한테 말하지 마요. 똑같은 걸로 하나 더 사서 써요.',
        "Admit it and you get faster. (She gives me one of her own egi. For the tournament, she says.)\n\nThe colour's faded a bit, but it's the one the squid hug best. If you lose it, don't tell me. Just buy another, the exact same one.",
      ],
      tournament: [
        '넘어 봐요! 저는 열둘까지 갈 거니까! (대회 등록 서류를 먼저 챙겨 온다.)\n\n예선은 계측 규정이 까다로워요. 심판이 봐주는 거 없대요. 서류 칸 비우지 말고 다 채워요. 저랑 붙으려면 일단 예선은 통과해야죠.',
        "Beat it, then! I'm going all the way to twelve! (She fetches the registration papers before I can.)\n\nThe qualifier's measuring rules are strict. They say the judge gives no favours. Don't leave any boxes blank. If you want to face me, you have to get through the qualifier first.",
      ],
    },
  },

  // ── M5-04 「해양관광업 등록」 · 동명항 어촌계 ──
  'M5-04': {
    offer: [
      d('learn_guide', '손님 태우는 일, 제대로 배우겠습니다. 여덟 시간 다 듣겠습니다.', "I'll learn to take passengers properly. I'll sit through all eight hours.",
        '여덟 시간 중에 제일 지루한 게 구명조끼 입히는 시간이다. 그게 제일 중요하다.\n\n손님은 낚으러 오지만 너는 데려가서 데려오는 사람이다. 조과는 그다음이야. 교육 끝나면 등록증 들고 와.',
        "Of the eight hours, the dullest part is fitting life vests. It's also the most important.\n\nPassengers come to fish, but you're the one who takes them out and brings them back. The catch comes after that. Bring the certificate when you're done.",
        { affinity: 0.04 }),
      d('ask_review', '후기요? 손님이 저를 평가한다는 겁니까?', 'Reviews? You mean the passengers grade me?',
        '그래. 예약, 승선, 포인트, 조과, 사진, 후기. 마지막 칸은 손님이 쓴다. (손가락을 하나씩 접는다.)\n\n고기 못 잡은 날에도 후기는 좋을 수 있다. 사람을 어떻게 대했는지가 남으니까. 그 반대도 있고. 후기는 조과표가 아니라 네 얼굴이다.',
        "That's right. Booking, boarding, the spot, the catch, photos, the review. The last box is the passenger's to fill. (He counts them off on his fingers.)\n\nA day with no fish can still get a good review, because how you treated people is what stays. The other way round too. A review isn't a catch sheet. It's your face.",
        { affinity: 0.03, flag: 'choice.m5_04_asked_review' }),
      d('unsure_skill', '제 낚시도 아직 서툰데, 남을 낚게 할 수 있을지요.', "My own fishing's still rough. Can I really get others onto fish?",
        '네가 잘 낚는다고 손님이 낚는 게 아니다. 오히려 잘 낚는 놈이 손님 대를 빼앗아 제가 낚지.\n\n서툰 걸 아는 놈이 손님 손을 본다. 먼저 손님한테 보여 줄 자리부터 확인해 둬. 한치 두 마리면 된다. 네가 거기서 낚아 봐야 손님도 낚는다.',
        "Your fishing well doesn't make the passenger catch. If anything, a good angler grabs the passenger's rod and catches it himself.\n\nOne who knows he's rough watches the passenger's hands. First check the spot you'll show them. Two squid will do. If you can catch there, so can they.",
        { affinity: 0.02 }),
      d('ask_fee', '등록비랑 교육비는 계에서 대 주는 겁니까?', 'Does the co-op cover the registration and training fees?',
        '등록은 네 이름으로 하는 거다. 네 돈으로 해라. (계장이 서류를 밀어 준다.)\n\n대신 끝나면 계에서 가방 하나는 챙겨 줄 거다. 손님 물건 넣는 가방. 그건 네 것도 아니다. 손님 거다.',
        "You're registering under your own name. Pay with your own money. (The chief slides the forms across.)\n\nWhen it's done, though, the co-op will see you get a bag. A bag for passengers' things. That isn't yours either. It's theirs.",
        { affinity: 0 }),
    ],
    completeAdd: [
      d('rescue', '교육에서 사람 건지는 법이 제일 오래 남았습니다.', 'Out of the training, how to pull a person out stayed with me longest.',
        '그게 남았으면 등록증보다 낫다. 물에 빠진 손님한테는 조과도 후기도 없다. (가방 지퍼를 열어 구명조끼 여분을 보여 준다.)\n\n이 가방에서 제일 무거운 게 그 조끼다. 맨 아래 넣어 둬라. 꺼낼 일이 없을수록 좋은 거다.',
        "If that stayed with you, it's worth more than the certificate. A passenger who goes in the water has no catch and no review. (He unzips the bag and shows me the spare life vests.)\n\nThe heaviest thing in this bag is those vests. Keep them at the bottom. The less you need to take them out, the better.",
        { affinity: 0.03, seaRep: 1 }),
    ],
    completeReply: {
      guide: [
        '낯설어야 한다. 익숙한 가이드가 손님을 놓친다. (가이드 가방을 어깨에 걸어 준다.)\n\n손님이 고기를 놓치는 건 괜찮다. 가이드가 손님을 놓치면 끝이다. 배에 오를 때 한 번, 내릴 때 한 번 머릿수를 세라. 그거 하나는 익숙해져도 된다.',
        "It should be. A guide who's comfortable loses passengers. (He slings a guide bag over my shoulder.)\n\nA passenger losing a fish is fine. A guide losing a passenger is the end. Count heads once going aboard and once coming off. That one thing you can get used to.",
      ],
      first_booking: [
        '그럼 더 잘해야지. 아는 사람이 제일 무섭다. (가방 안에 손님 명부 첫 장이 미리 채워져 있다.)\n\n모르는 손님은 한 번 실망하면 안 온다. 아는 손님은 실망해도 다시 와서 그 얘길 한다. 명부에 아는 사이라고 따로 적지 마라. 손님은 다 손님이다.',
        "Then do it better. People you know are the worst. (The first page of the register in the bag is already filled in.)\n\nA stranger is disappointed once and never comes back. Someone you know comes back disappointed and brings it up. Don't mark them as a friend in the register. A passenger is a passenger.",
      ],
    },
  },

  // ── M5-05 「낚시공원 설명회」 · 유리아 ──
  'M5-05': {
    offer: [
      d('hear_out', '둘 다 끝까지 듣겠습니다. 중간에 끊지 않고요.', "I'll hear both sides out. Without cutting anyone off.",
        '좋아요. 끝까지 듣는 게 취재의 반이에요. 사람들은 처음 말보다 끝에 가서 진짜를 꺼내거든요.\n\n찬성 측은 일자리 얘기부터 할 거고 반대 측은 바다 얘기부터 할 거예요. 둘 다 첫마디는 준비해 온 말이에요. 그다음을 기다려요.',
        "Good. Listening to the end is half of reporting. People bring out the real thing at the end, not the start.\n\nThe for side will start with jobs and the against side with the sea. Both openings are rehearsed. Wait for what comes after.",
        { affinity: 0.04 }),
      d('ask_park', '낚시공원이 생기면 정확히 뭐가 바뀝니까?', 'If the fishing park goes ahead, what exactly changes?',
        '그걸 저도 몰라서 부탁하는 거예요. (웃는다.) 설명회 자료에는 좋은 것만 있겠죠. 입장료, 시설, 찾아올 사람들.\n\n자료에 없는 건 조간대에 있어요. 예정지 갯바위를 직접 세 번 훑어 봐요. 거기서 뭐가 사는지 알아야 무엇이 바뀌는지도 물을 수 있어요.',
        "That's exactly why I'm asking you. (She laughs.) The briefing handouts will only have the good parts. Admission, facilities, the visitors it'll bring.\n\nWhat's not in the handouts is on the tideline. Walk the rocks at the proposed site yourself, three times. Know what lives there and you can ask what changes.",
        { affinity: 0.03, flag: 'choice.m5_05_asked_park' }),
      d('ask_ria', '방송하시던 분이 왜 직접 안 하십니까?', "You worked in broadcasting. Why not cover it yourself?",
        '제가 가면 다들 카메라부터 찾아요. 한물간 얼굴이라도 얼굴은 얼굴이거든요. (손거울을 탁 덮는다.)\n\n낚시꾼한테는 낚시꾼이 물어야 해요. 그쪽은 갯바위에 앉아서 물으면 되잖아요. 저는 그 말을 받아서 정리할게요. 그게 제 일이에요.',
        "If I go, everyone looks for the camera first. A has-been face is still a face. (She snaps her compact shut.)\n\nAnglers need to be asked by an angler. You can sit on the rocks and ask. I'll take what they say and put it in order. That's my job.",
        { affinity: 0.02, flag: 'choice.m5_05_asked_ria' }),
      d('no_side', '편을 안 드는 게 됩니까? 저도 바다에서 먹고사는데요.', "Can anyone really not take a side? I make my living from the sea too.",
        '안 되죠. 그래서 제일 어렵다고 한 거예요. (턱을 괴고 나를 본다.)\n\n편은 들어도 돼요. 적을 때만 빼요. 상대 말을 그쪽 사람이 읽어도 맞다고 할 만큼 적는 거. 그게 타당하게예요. 마음은 표결 날에 써요.',
        "No, you can't. That's why I said it's the hardest part. (Chin in hand, she looks at me.)\n\nYou can take a side. Just leave it out when you write. Write each side so that its own people would read it and say yes, that's right. That's what sound means. Save your heart for the day of the vote.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('both_sides', '일자리 말한 분들 말도 오래 남았습니다. 그분들도 바다 사람입니다.', 'What the jobs side said stayed with me too. They are sea people as well.',
        '…그 말이 제일 듣고 싶었어요. 찬성하는 사람들도 바다 걱정을 해요. 바다가 비면 일자리도 없으니까요. (수첩을 넘겨 찬성 측 인터뷰를 펼친다.)\n\n둘 다 바다를 걱정하는데 걱정하는 방식이 다를 뿐이에요. 그걸 본 사람은 표결 날에 손을 들어도 남을 미워하지 않아요.',
        "...That's what I most wanted to hear. The for side worries about the sea too. An empty sea means no jobs either. (She flips to the for-side interviews in her notebook.)\n\nBoth sides worry about the sea, just in different ways. Someone who's seen that can raise a hand on voting day and still not hate anyone.",
        { harborRep: 1, flag: 'choice.m5_05_both_sides' }),
    ],
    completeReply: {
      undecided: [
        '그게 정직한 답이에요. 표결 전까지 몰라도 돼요. (자기 취재 수첩 한 권을 준다.)\n\n앞의 몇 장은 제가 쓴 거예요. 방송 나가던 시절 거. 뒤는 비어 있어요. 오늘 들은 말을 그대로 옮겨 적어요. 정할 때 다시 펴 보면 돼요.',
        "That's an honest answer. You don't have to know before the vote. (She gives me one of her reporter's notebooks.)\n\nThe first few pages are mine, from when I was on air. The rest is blank. Copy what you heard today word for word. Open it again when it's time to decide.",
      ],
      sea_side: [
        '…그 말 방송에서는 하지 마요. 저한테는 해도 돼요. (수첩을 주며 웃는다.)\n\n방송이 한쪽 말이 남았다고 하는 순간 한쪽 방송이 돼요. 그래도 사람이니까 남는 쪽은 있죠. 그건 수첩에 적어 두고, 표결 날에 손으로 말해요.',
        "…Don't say that on air. You can say it to me. (She hands over the notebook, smiling.)\n\nThe moment a broadcast says one side stayed with it, it becomes a one-sided broadcast. But we're human, so one side does stay. Write that in the notebook and say it with your hand on voting day.",
      ],
    },
  },

  // ── M5-06 「대회 예선」 · 남궁현 ──
  'M5-06': {
    offer: [
      d('no_favor', '봐주시는 거 바라지 않습니다. 규정대로 재 주십시오.', "I don't want favours. Measure me by the rules.",
        '그 말은 계측대에서 다시 해. 말로는 다들 규정대로 하겠다고 해. (규정집을 건넨다. 모서리가 닳았다.)\n\n자를 대는 건 내가 하고 놓는 건 네가 한다. 꼬리를 접지도 말고 펴지도 마. 놓인 그대로 잰다. 그게 다야.',
        "Say that again at the measuring board. Everyone says they'll go by the rules. (He hands me the rulebook. Its corners are worn.)\n\nI hold the rule, you lay the fish down. Don't fold the tail and don't stretch it. I measure it the way it lies. That's all.",
        { affinity: 0.04 }),
      d('ask_warehouse', '창고 일은 어떡하시고 여기 계십니까?', "What about the warehouse? Who's minding it while you're here?",
        '낮에는 창고 문 닫혀 있어. 내 일은 밤이야. (규정집에서 눈을 떼지 않는다.)\n\n창고에선 상자를 세고 여기선 고기를 잰다. 세든 재든 틀리면 안 되는 건 같아. 남 걱정 말고 참가비나 내고 와.',
        "The warehouse is shut in the daytime. My work is at night. (He doesn't take his eyes off the rulebook.)\n\nThere I count boxes, here I measure fish. Counting or measuring, you can't get it wrong either way. Stop worrying about me and go pay your entry fee.",
        { affinity: 0.02, flag: 'choice.m5_06_asked_warehouse' }),
      d('ask_rules', '계측 규정에서 제일 많이 걸리는 게 뭡니까?', 'What trips people up most in the measuring rules?',
        '체장 미달. 금지체장 밑은 계측대에 올리는 순간 실격이야. (규정집 한 줄을 손톱으로 짚는다.)\n\n그다음이 눈대중. 제 눈으로 넉넉하다고 믿고 올리는 놈들. 대회 전에 네 자로 먼저 재. 모자라면 놔. 계측대는 확인하는 데지 재 보는 데가 아니야.',
        "Undersize. Put anything below the legal minimum on the board and you're out the moment it lands. (He taps one line of the rulebook with a fingernail.)\n\nAfter that, eyeballing. People who trust their own eye that it's big enough. Measure with your own rule before you come. If it's short, let it go. The board is for confirming, not for trying.",
        { affinity: 0.03, flag: 'choice.m5_06_asked_rules' }),
      d('familiar_face', '아는 얼굴이라 한 번쯤은 봐주실 줄 알았습니다.', 'I thought you might go easy on a familiar face, just once.',
        '아는 얼굴일수록 더 안 봐줘. 그래야 다른 선수들이 네 고기를 믿어. (처음으로 눈을 들어 나를 본다.)\n\n봐줘서 통과한 놈은 결선에서 아무도 안 쳐다봐. 네가 나한테 받을 건 규정대로 잰 숫자 하나야. 그게 제일 오래가.',
        "The more familiar the face, the fewer favours. That way the other anglers trust your fish. (For the first time he looks up at me.)\n\nNobody looks twice in the final at someone who got through on a favour. What you get from me is one number measured by the rules. That lasts the longest.",
        { affinity: -0.01 }),
    ],
    completeAdd: [
      d('released_rest', '기준에 못 미친 고기들은 다 살려 보냈습니다.', 'The fish that fell short, I sent them all back alive.',
        '…봤다. 계측대 뒤에서. 실격된 고기 들고 사진 찍는 놈은 많아도 놓아주는 놈은 드물어. (기록지 귀퉁이에 무언가를 적는다.)\n\n대회는 재는 데서 끝나는 게 아니야. 잰 다음에 뭘 하는지까지가 대회야. 결선에서 보자.',
        "...I saw. From behind the board. Plenty pose for photos with a disqualified fish. Few let it go. (He writes something in the corner of the record sheet.)\n\nA tournament doesn't end at the measuring. What you do after the measuring is part of it too. See you in the final.",
        { affinity: 0.04, seaRep: 1, flag: 'choice.m5_06_released_rest' }),
    ],
    completeReply: {
      rules: [
        '무거워야 한다. 가벼우면 대회가 아니야. (결선 참가 번호표를 건넨다. 앞 번호다.)\n\n결선 전에 규정집 한 번 더 읽고 와. 결선은 기준이 달라. 크기 하나로 가린다. 그 숫자는 결선 날 알려 주지.',
        "It should be heavy. Light it isn't a tournament. (He hands over a finals number bib. A low number.)\n\nRead the rulebook once more before the final. The final's standard is different. It comes down to one size. I'll tell you the number on the day.",
      ],
      ask_past: [
        '…결선 끝나고. (그러고는 번호표를 건넨다. 표정이 잠깐 흔들린다.)\n\n지금은 선수하고 심판이야. 심판이 선수한테 제 얘기를 하는 대회는 대회가 아니지. 결선 끝나면 그때는 둘 다 그냥 낚시꾼이다.',
        "…After the finals. (Then he hands me the bib. His face wavers for a moment.)\n\nRight now we're an angler and a judge. A tournament where the judge tells an angler his story isn't a tournament. After the final we're both just anglers.",
      ],
    },
  },

  // ── M5-07 「서귀포 에깅」 · 마라 ──
  'M5-07': {
    offer: [
      d('fall_only', '폴링 봐 주는 것만으로 충분하다. 잘 부탁한다.', "Watching my fall is plenty. I'm counting on you.",
        '…네. 폴링만 봐요. 나머지는 그쪽 손이 할 거예요.\n\n무늬오징어는 에기가 떨어질 때 안아요. 튕길 때가 아니라. 가을 밤엔 얕은 데로 들어오니까 멀리 안 던져도 돼요. 각도만 보면 돼요.',
        "...Okay. I'll only watch the fall. Your hands will do the rest.\n\nBigfin squid hug the egi while it's sinking. Not while you twitch it. On autumn nights they come into the shallows, so you don't need to cast far. Just watch the angle.",
        { affinity: 0.04 }),
      d('ask_serin', '세린이 부탁했다고? 둘이 어떤 사이야?', 'Serin asked you? What are you two to each other?',
        '…친구요. 그 이상은 세린이한테 물어요. 아니, 묻지 마요. (에기 끝을 손톱으로 다듬는다.)\n\n세린이는 부탁을 잘 안 해요. 그런 애가 부탁했으니까 온 거예요. 그쪽 폴링만 봐요. 그게 약속이에요.',
        "...Friends. Ask Serin for the rest. No, don't ask her. (She trims the tip of the egi with a fingernail.)\n\nSerin doesn't ask for things much. When someone like her asks, you come. I'll just watch your fall. That's what I promised.",
        { affinity: 0.03, flag: 'choice.m5_07_asked_serin' }),
      d('ask_quit', '대회엔 왜 안 나가? 손은 아직 그대로인데.', "Why aren't you entering? Your hands are still all there.",
        '…그만뒀어요. 그거면 돼요. (대답 대신 에기를 물에 떨어뜨려 보인다.)\n\n봐요, 이 각도. 떨어지는 동안 줄을 너무 잡으면 앞으로 끌려와요. 너무 놓으면 뒤로 누워요. 그 사이. 제 얘기보다 이게 더 쓸모 있어요.',
        "...I quit. That's all. (Instead of answering, she drops the egi into the water to show me.)\n\nLook, this angle. Hold the line too tight while it sinks and it gets dragged toward you. Too loose and it lies back. In between. That's more useful to you than my story.",
        { affinity: 0.01, flag: 'choice.m5_07_asked_quit' }),
      d('call_teacher', '그럼 오늘은 선생님이라고 불러야 하나?', 'So should I call you teacher tonight?',
        '…하지 마요. 그런 말 들으면 진짜 가르쳐야 할 것 같잖아요. (처음으로 입꼬리가 조금 올라간다.)\n\n그냥 마라라고 해요. 저는 폴링 봐 주는 사람이에요. 선생님 소리는 세린이가 듣고 싶어 할걸요.',
        "...Don't. If you call me that I'll feel like I really have to teach. (For the first time the corner of her mouth lifts a little.)\n\nJust call me Mara. I'm the one watching your fall. Serin's the one who'd want to be called teacher.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('praise_fall', '네 폴링이 내 것보다 한참 예뻤다. 그건 말해도 되지?', "Your fall was far prettier than mine. I'm allowed to say that, right?",
        '…그쪽한테만요. (에기를 감아 들인다. 손이 천천히 움직인다.)\n\n예쁜 거 소용없어요. 대회에선 마릿수예요. 그래도… 오늘은 예쁘게 떨어졌어요. 오랜만에. 그 말은 고마워요.',
        "...Only to you. (She reels the egi in. Her hands move slowly.)\n\nPretty doesn't matter. In a tournament it's numbers. Still... tonight it fell pretty. For the first time in a while. Thanks for saying so.",
        { affinity: 0.06, flag: 'choice.m5_07_praised_fall' }),
    ],
    completeReply: {
      keep_secret: [
        '…고마워요. (그래도 세린이는 알았다. 마라가 던진 에기가 세린이 것이었으니까.)\n\n이 에기는 제 거 아니에요. 돌려줄 사람이 있어요. 오늘은 말고요. (에기를 주머니에 넣는다. 버리지 않는다.)',
        "…Thank you. (Serin knew anyway. The egi Mara cast was hers.)\n\nThis egi isn't mine. There's someone I have to give it back to. Not tonight. (She puts the egi in her pocket. She doesn't throw it away.)",
      ],
      tell: [
        '…그럴 거면 그쪽이 말해요. 저는 못 해요. (그날 밤 세린이 마라의 집 앞에 앉아 있었다.)\n\n(말을 전한 건 나였다. 문을 열지 말지는 마라의 몫이다. 나는 거기서 돌아섰다.)',
        "…Then you tell her. I can't. (That night Serin was sitting outside Mara's door.)\n\n(I was the one who passed it on. Whether to open the door is up to Mara. I turned back there.)",
      ],
    },
  },

  // ── M5-08 「결선과 전화 한 통」 · 남궁현 ──
  'M5-08': {
    offer: [
      d('over_eighty', '80 넘는 놈으로 올리겠습니다. 결선은 한 번이니까요.', "I'll bring up one over eighty. The final only happens once.",
        '한 번이지. 그래서 결선이야. 겨울 방어는 걸리고 나서가 길어. 팔이 먼저 지친다. (규정집을 덮는다.)\n\n드랙은 처음에 믿고 끝에 의심해. 뜰채에 들어오기 전까지는 네 고기가 아니야. 80은 계측대에서 결정된다.',
        "Once, yes. That's why it's the final. With a winter yellowtail the long part comes after the hook-up. Your arms tire first. (He closes the rulebook.)\n\nTrust the drag at the start, doubt it at the end. It isn't your fish until it's in the net. Eighty gets decided at the board.",
        { affinity: 0.04 }),
      d('ask_phone', '켜 두라고요? 결선 중에 전화를 받으라는 겁니까?', 'Leave it on? You want me taking calls during the final?',
        '받으라는 게 아니야. 켜 두라는 거지. (잠깐 말을 고른다.)\n\n결선은 길어. 그동안 바다 밖에서도 일은 생겨. 대회 하나 때문에 들어야 할 소리를 못 듣는 건 낚시꾼이 할 짓이 아니야. 울리면 그때 네가 정해.',
        "I'm not telling you to take calls. I'm telling you to leave it on. (He picks his words for a moment.)\n\nA final is long. Things happen off the water in the meantime too. Missing something you needed to hear because of one tournament is no way for an angler to be. If it rings, you decide then.",
        { affinity: 0.03, flag: 'choice.m5_08_asked_phone' }),
      d('ask_prize', '우승하면 상금은 얼마나 됩니까?', "What's the prize money if I win?",
        '순위표는 접수처에 붙어 있어. 상금은 순위대로, 규정대로야. (턱으로 접수처를 가리킨다.)\n\n상금 세는 놈은 방어 걸리면 손이 떨린다. 계측대에서는 숫자 하나만 보면 돼. 80. 나머지는 끝나고 세.',
        "The ranking table is posted at registration. Prize money goes by rank, by the rules. (He nods toward the registration desk.)\n\nA man counting prize money has shaking hands when the yellowtail hits. At the board you only need one number. Eighty. Count the rest afterwards.",
        { affinity: 0 }),
      d('never_eighty', '80이 넘는 방어는 아직 올려 본 적이 없습니다.', "I've never landed a yellowtail over eighty.",
        '다들 없어. 결선 오기 전까지는. (처음으로 짧게 웃는 것 같다.)\n\n80짜리는 바닥으로 박지 않고 옆으로 짼다. 배 밑으로 파고들면 초릿대를 물에 박아서라도 돌려. 걸고 나서 십오 분은 버틸 생각으로 들어가.',
        "No one has. Not until they reach a final. (For the first time he almost seems to smile.)\n\nAn eighty doesn't dive straight down, it tears off sideways. If it heads under the boat, turn it even if you have to plunge the rod tip into the water. Go in ready to hold on for fifteen minutes.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('by_rules', '결과는 규정대로 정해 주십시오. 제가 자리에 없어도요.', "Decide the result by the rules. Even if I'm not there.",
        '…당연하지. 네가 있든 없든 순위는 숫자로 정한다. (계측 기록지에 서명한다.)\n\n이 상황에서 그 말을 하는 놈은 처음 봤다. 걱정 말고 가. 숫자는 내가 지킨다. 너는 사람한테 가.',
        "...Of course. Whether you're here or not, the ranking goes by the numbers. (He signs the measurement sheet.)\n\nI've never seen anyone say that at a moment like this. Go and don't worry. I'll guard the numbers. You go to your people.",
        { affinity: 0.06, seaRep: 1 }),
    ],
    completeReply: {
      go_now: [
        '가라. 결과는 안 도망간다. (대회 부상 장비 상자를 배에 실어 준다. 로드와 릴. 대회 각인이 있다.)\n\n배는 천천히 몰아. 급한 마음으로 바다 건너다 사고 나는 놈 많다. 도착하면 전화 한 통 해. 결과는 그때 말해 주지.',
        "Go. The results won't run off. (He loads the prize gear crate onto my boat. A rod and a reel, with the tournament engraving.)\n\nTake the boat slow. Plenty of people have accidents crossing in a hurry. Call once when you get there. I'll tell you the result then.",
      ],
      wait_result: [
        '…오 분. 우승이다. 이제 가. (부상 상자를 건네는 손이 빠르다.)\n\n오 분 기다린 걸 탓할 사람은 없어. 그래도 지금부터는 일 분도 아껴. 가는 길에는 우승 생각 하지 말고 바다만 봐.',
        "…Five minutes. You won. Now go. (His hands are quick handing over the crate.)\n\nNobody will blame you for waiting five minutes. But from now on, save every minute. On the way, don't think about winning. Just watch the sea.",
      ],
    },
  },

  // ── M5-09 「총회 표결」 · 동명항 어촌계 ──
  'M5-09': {
    offer: [
      d('own_hand', '제 손으로 들겠습니다. 누가 어느 쪽이든요.', "I'll raise my own hand. Whichever way anyone else goes.",
        '그래. 표결은 손 하나 드는 거지만 그 손까지 오는 길이 표다. 위판 다섯 건, 그게 네 참여 실적이야.\n\n앞줄에 누가 앉든 뒤를 돌아보지 마라. 돌아보는 순간 네 손이 아니라 남의 손이 된다.',
        "Good. A vote is raising one hand, but the road to that hand is the vote. Five auction lots, that's your record of taking part.\n\nWhoever sits in the front row, don't look back. The moment you look back it stops being your hand and becomes someone else's.",
        { affinity: 0.04 }),
      d('ask_rep', '평판이 표가 된다니요? 한 사람에 한 표 아닙니까?', "Reputation becomes votes? Isn't it one person, one vote?",
        '손은 한 사람에 하나다. 다만 네 말을 듣고 손을 드는 사람이 있다. 그게 평판이다. (장부를 한 장 넘긴다.)\n\n위판에 꼬박꼬박 나오고 공동작업에 빠지지 않은 놈 말은 계원들이 듣는다. 그동안 네가 한 일이 오늘 남의 손에도 실린다는 뜻이야.',
        "One hand per person. But some people raise theirs after listening to you. That's reputation. (He turns a page of the ledger.)\n\nThe members listen to someone who turned up at every auction and never missed communal work. What you've done all this time gets carried in other people's hands today too.",
        { affinity: 0.03, flag: 'choice.m5_09_asked_rep' }),
      d('ask_hyeonsu', '도현수는 어느 쪽에 손을 듭니까?', 'Which way is Do Hyeonsu voting?',
        '그걸 내가 알면 표결이 아니지. 그 애 손은 그 애 거다. (장부를 덮는다.)\n\n할애비라고 손자 손을 들어 주는 계였으면 벌써 망했다. 네 손이나 걱정해. 남의 손 세다가 제 손 드는 걸 잊는 놈도 있다.',
        "If I knew that, it wouldn't be a vote. His hand is his. (He closes the ledger.)\n\nA co-op where a grandfather raises his grandson's hand would have gone under long ago. Worry about your own hand. Some people get so busy counting other hands they forget to raise theirs.",
        { affinity: 0.02, flag: 'choice.m5_09_asked_hyeonsu' }),
      d('worried', '할머니 일로 머리가 복잡합니다. 그래도 손은 들겠습니다.', "My head's a mess over the old lady. I'll still raise my hand.",
        '…안다. 그래서 표결 전까지 위판 다섯 건을 하라는 거다. 손을 움직이면 머리가 덜 시끄럽다.\n\n그 사람이 여기 있었으면 뭐라고 했겠냐. 얼음부터 나르라고 했겠지. 위판 하고, 손 들고, 그다음에 가. 순서가 있다.',
        "...I know. That's why I'm telling you to do five auction lots before the vote. Keeping your hands busy quiets your head.\n\nIf she were here, what would she say? Carry the ice first, I expect. Do the lots, raise your hand, then go. There's an order to things.",
        { affinity: 0.04, flag: 'choice.m5_09_worried' }),
    ],
    completeAdd: [
      d('greet_other_side', '반대쪽에 손 드신 분들께 인사부터 하고 가겠습니다.', "I'll greet the people who voted the other way before I go.",
        '…그래, 그게 맞다. 어느 쪽이든 내일 아침엔 같은 위판장에 선다. (계장이 출입문 쪽을 가리킨다. 반대쪽에 손 든 사람들이 아직 남아 있다.)\n\n그 사람들도 바다 걱정하다 손을 든 거다. 인사하고 나서 병원으로 가.',
        "...Right, that's proper. Whichever side, tomorrow morning we all stand in the same auction hall. (The chief points toward the door. People who voted the other way are still there.)\n\nThey raised their hands worrying about the sea too. Greet them, then go to the hospital.",
        { affinity: 0.05, harborRep: 2, flag: 'choice.m5_09_greeted_other_side' }),
    ],
    completeReply: {
      hyeonsu_hand: [
        '봤다. 그 애가 먼저 들었어. 네 쪽을 보고. (계장이 처음으로 그 애 이야기를 길게 한다.)\n\n분기 총회 때 너한테 반대표를 던진 게 그 애다. 그때도 이유는 말 안 했고 오늘도 안 할 거다. 그 애는 손으로 말한다. 오늘 그 손을 봤으면 된 거다.',
        "I saw. He raised it first. Looking at your side of the room. (For the first time the chief talks about the lad at length.)\n\nHe's the one who voted against you at the quarterly meeting. He didn't give a reason then and he won't today either. That lad talks with his hands. If you saw that hand today, that's enough.",
      ],
      hospital: [
        '…쓰러졌다. 의식은 있어. 가 봐라. 표결은 끝났으니. (배편을 먼저 잡아 준다.)\n\n표결 소식은 네가 들고 가. 그 사람 귀에는 계 소식보다 네 목소리가 먼저 들어갈 거다. 좌판 걱정은 그다음이다. 지금은 얼굴부터 보여 줘.',
        "…She collapsed. She's conscious. Go to her. The vote is done. (He books the crossing for me before I can ask.)\n\nTake the news of the vote with you. She'll hear your voice before any co-op news. The stall can wait. Right now, just let her see your face.",
      ],
    },
  },

  // ── M6-01 「막배」 · 오세라 ──
  'M6-01': {
    offer: [
      d('stay_pay', '신세 지겠습니다. 라면값은 제가 내겠습니다.', "I'll impose on you, then. I'll pay for my own noodles.",
        '당연하죠. 셀프라니까요, 계산도. (계산대 너머로 뜨거운 물 버튼을 가리킨다.)\n\n난로 옆자리는 비워 둬요. 밤에 결항 손님이 더 올 수도 있어요. 섬은 다 그래요. 하룻밤 버티는 사람끼리 자리를 나눠요.',
        "Of course. Self-serve, I said, paying included. (Across the counter she points at the hot water button.)\n\nKeep the seat by the stove free. More stranded people might turn up tonight. That's the island. People getting through the night share their seats.",
        { affinity: 0.04 }),
      d('ask_ferry', '결항이 자주 있습니까? 아침에는 배가 뜹니까?', 'Do cancellations happen a lot? Will a boat run in the morning?',
        '바람 부는 날은 다 결항이에요. 아침 배는 아침에 알아요. 섬에선 내일 일을 오늘 몰라요. (창밖 바다를 턱으로 가리킨다.)\n\n그러니까 오늘 밤만 생각해요. 난로, 라면, 잠. 그 셋이면 살아요. 아침에 배 없으면 그때 또 생각하고요.',
        "Any windy day, it's cancelled. You find out about the morning boat in the morning. On the island you don't know tomorrow today. (She nods at the sea outside the window.)\n\nSo just think about tonight. Stove, noodles, sleep. With those three you'll live. If there's no boat in the morning, think again then.",
        { affinity: 0.03, flag: 'choice.m6_01_asked_ferry' }),
      d('grumble', '하필 오늘 결항이라니, 일정이 다 꼬였습니다.', 'Of all days to be cancelled. My whole schedule is wrecked.',
        '섬에 온 사람은 다 그 말을 해요. 그러다 하룻밤 지나면 안 해요. (컵라면 하나를 계산대에 올려놓는다.)\n\n바다가 정한 일정이 진짜 일정이에요. 꼬인 건 그쪽 수첩이고요. 화나면 라면 먹어요. 결항인 밤에 먹는 라면은 맛있어요.',
        "Everyone who comes to the island says that. After one night, they stop. (She puts a cup of noodles on the counter.)\n\nThe schedule the sea sets is the real one. What got wrecked is your planner. If you're angry, eat noodles. Noodles on a cancelled night taste good.",
        { affinity: 0.01 }),
      d('ask_night_shop', '밤에 혼자 가게를 보십니까? 손님도 없을 텐데요.', "You mind the shop alone at night? There can't be many customers.",
        '없죠. 그래서 밤이 좋아요. 혼자 할 일이 많거든요. (카운터 밑으로 뭔가를 슬쩍 밀어 넣는다.)\n\n결항인 밤엔 그쪽 같은 손님이 와요. 그것도 나쁘지 않아요. 조용히만 있어 주면요. 난로 켜 둘게요.',
        "There aren't. That's why I like nights. Lots to do alone. (She slides something under the counter.)\n\nOn cancelled nights, customers like you show up. That's not bad either. As long as you stay quiet. I'll leave the stove on.",
        { affinity: 0.02, flag: 'choice.m6_01_asked_night_shop' }),
    ],
    completeAdd: [
      d('tidy_up', '자리 정리하고 가겠습니다. 의자랑 난로 주변이요.', "I'll tidy up before I go. The chairs and around the stove.",
        '…안 해도 되는데. (그래도 말리지 않는다. 대걸레를 건넨다.)\n\n결항 손님이 자리 치우고 가는 거, 섬에선 다 봐요. 다음에 배가 묶이면 이 섬 사람들이 먼저 자리를 내줄 거예요. 그쪽 얼굴 기억하니까요.',
        "...You don't have to. (Still, she doesn't stop me. She hands over the mop.)\n\nOn an island, everyone notices a stranded guest who tidies up before leaving. Next time the boats are held up, the islanders will make room for you first. They'll remember your face.",
        { affinity: 0.03, harborRep: 2, flag: 'choice.m6_01_tidied' }),
    ],
    completeReply: {
      rod: [
        '…봤어요? 밤에 닦아요, 늘. (편의점 뒤 자기 포인트를 하나 알려 준다.)\n\n손님 없는 시간에 대를 닦으면 내일 던질 생각이 나요. 그 포인트는 아무한테도 말 안 한 데예요. 거리만 지켜 줘요. 바로 옆에서 던지면 안 돼요.',
        "…You saw that? I do it at night, always. (She tells me about one of her own spots behind the shop.)\n\nWiping a rod when there are no customers makes me want to cast tomorrow. I haven't told anyone about that spot. Just keep your distance. Don't cast right next to me.",
      ],
      ramen: [
        '결항 라면이에요. 맛있죠. (다음 결항 때 라면값을 안 받겠다고 한다.)\n\n같은 라면인데 결항인 밤엔 맛이 달라요. 갈 데가 없으니까 천천히 먹거든요. 섬에 오래 있으면 그 맛 때문에 결항을 기다리는 사람도 생겨요.',
        "That's cancelled-sailing ramyeon. It's the best. (She says the next cancellation is on the house.)\n\nSame noodles, but on a cancelled night they taste different. You've nowhere to go, so you eat slowly. Stay on the island long enough and some people start hoping for cancellations just for that taste.",
      ],
    },
  },

  // ── M6-02 「부시리」 · 연태오 ──
  'M6-02': {
    offer: [
      d('learn_watching', '말씀 안 하셔도 됩니다. 보고 배우겠습니다.', "You don't have to say anything. I'll learn by watching.",
        '…좋아요. 그럼 지금 하는 말이 마지막이에요. (파퍼를 손바닥에 올려 보여 준다.)\n\n파퍼는 던질 때가 아니라 멈출 때 물어요. 멈추는 시간을 참는 게 다예요. 나머지는 부시리가 가르쳐 줄 거예요.',
        "...Good. Then what I'm saying now is the last of it. (He holds a popper on his palm to show me.)\n\nA popper gets taken on the pause, not on the throw. Holding out through the pause is everything. The amberjack will teach you the rest.",
        { affinity: 0.05 }),
      d('ask_teacher', '스승이 누구신데요? 말 안 하는 걸 가르친 분이요.', 'Who is your teacher? The one who taught you not to speak.',
        '…그건 다음에요. (파퍼 꼬리의 바늘을 손톱으로 확인한다.)\n\n말 안 하는 걸 배웠으니까 누구한테 배웠는지도 말 안 하는 거예요. 숨긴 제자라는 게 그 뜻이에요. 오늘은 부시리만 생각해요.',
        "...Another time. (He checks the hook on the popper's tail with a fingernail.)\n\nI learned not to talk, so I don't talk about who I learned it from either. That's what hidden apprentice means. Today, just think about amberjack.",
        { affinity: 0.03, flag: 'choice.m6_02_asked_teacher' }),
      d('talk_alone', '말씀 안 하시면 제가 혼잣말을 해도 됩니까?', "If you won't talk, can I talk to myself?",
        '…해도 돼요. 부시리는 사람 말 안 들어요. (어깨를 아주 조금 들썩인다.)\n\n대신 파퍼가 멈출 때는 숨도 참아요. 그때 물어요. 혼잣말은 랜딩하고 해요. 그때는 저도 대답할지 몰라요.',
        "...Go ahead. Amberjack don't listen to people. (His shoulders twitch, just slightly.)\n\nBut hold your breath when the popper pauses. That's when it takes. Save the talking for after the landing. I might even answer then.",
        { affinity: 0.03 }),
      d('gear_doubt', '대형 청물은 처음입니다. 장비가 버틸지 모르겠습니다.', "I've never fought big pelagics. Not sure my gear will hold.",
        '버티게 해요. 드랙을 믿고, 손은 대를 세우는 데만 써요. (내 릴의 드랙을 손으로 한 번 당겨 본다.)\n\n이 정도면 돼요. 줄이 끊기는 건 장비보다 마음이 먼저 끊겨서예요. 처음 달릴 때 놀라서 줄을 손으로 잡는 사람이 끊어요.',
        "Make it hold. Trust the drag and use your hands only to keep the rod up. (He tests my reel's drag once with his hand.)\n\nThis'll do. Lines break because the nerve goes before the gear does. The one who panics on the first run and grabs the line is the one who snaps it.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('one_word', '이제 랜딩했으니, 한마디만 해 주십시오.', "I've landed it now. Just one word from you, please.",
        '…잘했어요. 그거면 돼요? (파퍼를 닦아 상자에 넣는다.)\n\n스승은 그 한마디도 안 해요. 저는 아직 덜 배워서 해요. 그쪽이 들은 건 덜 배운 제자의 말이에요. 그래도 진짜예요.',
        "...Well done. Is that enough? (He wipes the popper and puts it in the box.)\n\nMy teacher wouldn't say even that much. I say it because I haven't learned it all yet. What you heard is from an apprentice who's still learning. It's true, though.",
        { affinity: 0.06, flag: 'choice.m6_02_one_word' }),
    ],
    completeReply: {
      who: [
        '…등대예요. 등대지기. 그 얘긴 그분한테 들어요. (그 말을 하며 등대 쪽을 한 번 본다.)\n\n등대에 올라가면 기상 적는 할아버지가 있어요. 제 이름은 대지 마요. 그분이 먼저 알아볼 거예요. 그분은 사람을 오래 봐요.',
        "…The lighthouse. The keeper. Hear that story from him. (As he says it, he glances toward the lighthouse.)\n\nUp at the lighthouse there's an old man who logs the weather. Don't mention my name. He'll know before you say anything. He looks at people a long time.",
      ],
      silence: [
        '…그렇죠. (파퍼 하나를 준다. 스승 것이라고.)\n\n말로 배운 건 잊어버려요. 손으로 배운 건 안 잊어요. 그 파퍼는 멈출 때 소리가 좋아요. 던져 보면 알아요.',
        "…It does, doesn't it. (He gives me a popper. His teacher's, he says.)\n\nWhat you learn from words, you forget. What you learn with your hands, you don't. That popper sounds good when it pauses. Cast it and you'll hear.",
      ],
    },
  },

  // ── M6-03 「등대」 · 석대양 ──
  'M6-03': {
    offer: [
      d('yes_father', '네. 고진태 선장이 제 아버지입니다.', 'Yes. Skipper Ko Jintae is my father.',
        '…그렇군. (한참 나를 보다가 기상 일지를 편다.)\n\n앉게. 얘기는 길어질 거야. 먼저 풍속부터 적지. 바람이 어디서 오는지 알아야 그 배 얘기도 할 수 있어.',
        "...I see. (He looks at me a long while, then opens the weather log.)\n\nSit. This will take a while. Wind speed first. You have to know where the wind comes from before I can tell you about that boat.",
        { affinity: 0.05 }),
      d('ask_how', '제 아버지를 어떻게 아십니까?', 'How do you know my father?',
        '알았다기보다 봤지. 등대지기는 배를 보는 사람이야. (창 너머 수평선을 가리킨다.)\n\n이 앞을 지나는 배는 다 봐. 그중에 오래 남는 배가 있어. 기상 다 적고 얘기하지. 서두르면 틀리게 말해.',
        "Not knew so much as saw. A lighthouse keeper is someone who watches boats. (He points at the horizon through the window.)\n\nI see every boat that passes out there. Some of them stay with you a long time. We'll talk when the log is done. Hurry and I'll tell it wrong.",
        { affinity: 0.04, flag: 'choice.m6_03_asked_how' }),
      d('not_ready', '…아버지 이야기는 아직 들을 준비가 안 됐습니다.', "...I'm not sure I'm ready to hear about my father yet.",
        '그럼 기상부터 적세. 준비는 손이 먼저 하는 거야. (연필을 내 손에 쥐여 준다.)\n\n풍속, 파고, 시정. 세 칸이야. 다 적고 나서도 듣기 싫으면 안 해도 돼. 이 얘기는 도망가지 않네. 이십 년 넘게 기다린 얘기야.',
        "Then let's log the weather first. Hands get ready before the heart does. (He puts a pencil in my hand.)\n\nWind speed, wave height, visibility. Three columns. If you still don't want to hear it after, you needn't. This story won't run off. It's waited over twenty years.",
        { affinity: 0.03, flag: 'choice.m6_03_not_ready' }),
      d('fish_first', '등대 아래에서 부시리부터 올리고 오겠습니다.', "I'll land an amberjack below the lighthouse first, then come up.",
        '…그것도 좋지. 고기 잡는 손이 기상도 잘 적어. (턱으로 등대 아래 바위를 가리킨다.)\n\n물이 돌아 나가는 쪽에 서게. 부시리는 거기 붙어. 한 마리 올리고 올라오게. 그때는 얘기가 더 잘 들릴 거야.',
        "...That's fine too. A hand that catches fish logs weather well too. (He nods toward the rocks below the lighthouse.)\n\nStand where the current turns out. That's where amberjack hold. Land one and come up. The story will be easier to hear then.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('come_again', '다음에도 올라와서 기상 적는 걸 돕겠습니다.', "I'll come up again and help with the weather log.",
        '…그래 주겠나. 이 일은 혼자 하면 숫자만 남아. 둘이 하면 얘기가 남지. (일지 맨 뒷장에 내 이름 적을 칸을 하나 그린다.)\n\n올 때는 바람부터 보고 오게. 이 섬 날씨는 육지 예보를 안 따라. 자네가 본 바람이 맞으면 그때 하나 더 얘기해 주지.',
        "...Would you? Done alone, this work leaves only numbers. Done by two, it leaves stories. (He draws a column for my name on the last page of the log.)\n\nCheck the wind before you come. This island's weather doesn't follow the mainland forecast. If the wind you read turns out right, I'll tell you one more thing then.",
        { affinity: 0.05, seaRep: 1, flag: 'choice.m6_03_come_again' }),
    ],
    completeReply: {
      weather: [
        '기계는 고장 나. 손은 안 고장 나지. (랜턴과 함께 기상 관측 수첩을 준다.)\n\n그리고 손으로 적으면 기억에 남아. 숫자를 적는 동안 그날 바다가 어땠는지가 같이 적히거든. 자네 아버지 배가 지나간 날도 그렇게 남았어.',
        "Machines break. Hands don't. (With the lantern he gives me a weather logbook.)\n\nAnd what you write by hand stays in your memory. While you write the numbers, what the sea was like that day gets written too. The day your father's boat went by stayed with me that way.",
      ],
    },
  },

  // ── M6-04 「연안부두」 · 단철호 ──
  'M6-04': {
    offer: [
      d('over_thirty', '야간 우럭, 30 넘는 걸로 올려 보겠습니다.', "Night rockfish. I'll go for one over thirty.",
        '좋아요. 우럭은 부두 안쪽 그늘에 붙어요. 밤엔 불빛 경계까지 나오고요. (넥타이를 느슨하게 푼다.)\n\n30 넘는 건 아무 데나 안 있어요. 오래 산 놈은 오래 산 자리에 있어요. 저도 퇴근길엔 늘 같은 자리에 서요.',
        "Good. Rockfish hug the shade inside the pier. At night they come out to the edge of the lights. (He loosens his tie.)\n\nThe thirty-plus ones aren't just anywhere. An old fish keeps to an old spot. I always stand in the same spot on my way home too.",
        { affinity: 0.04 }),
      d('ask_trade', '유통이 다라는 게 무슨 말씀입니까?', "What do you mean it's all distribution here?",
        '여기선 잡는 사람보다 옮기는 사람이 많아요. 동해에서 잡은 게 서해 시장에서 팔리는 길이 다 여길 지나요. (부두 너머 시장 불빛을 가리킨다.)\n\n그 길에서 제일 중요한 게 원산지 표기예요. 어디서 왔는지 틀리면 아무리 좋은 고기도 거짓말이 돼요. 우럭 잡으면서 그것도 봐 둬요.',
        "Here, there are more people moving fish than catching them. The road that takes East Sea fish to West Sea markets all runs through here. (He points at the market lights past the pier.)\n\nThe most important thing on that road is the origin label. Get where it came from wrong and even the best fish becomes a lie. Keep an eye on that while you fish.",
        { affinity: 0.03, flag: 'choice.m6_04_asked_trade' }),
      d('tie_joke', '잠깐만 보신다면서 넥타이부터 푸시네요.', "You said you'd only look in, but you're already loosening your tie.",
        '…들켰네요. 원래 잠깐이 제일 길어요. (넥타이를 아예 빼서 주머니에 넣는다.)\n\n집에 가면 할 일이 있고 여기 오면 할 일이 없어요. 그 차이가 좋아서 잠깐이 길어져요. 그쪽도 곧 알게 될 거예요.',
        "...Caught me. 'Just a moment' is always the longest. (He pulls the tie off entirely and stuffs it in his pocket.)\n\nAt home there are things to do, and here there's nothing to do. I like that difference, so the moment stretches. You'll see soon enough.",
        { affinity: 0.04, flag: 'choice.m6_04_tie_joke' }),
      d('tide_doubt', '서해 밤바다는 처음이라 물때를 잘 모르겠습니다.', "It's my first night on the West Sea. I don't know the tides well.",
        '서해는 물이 크게 들고 나요. 부두 안쪽은 그나마 덜하고요. (휴대폰으로 물때표를 띄워 보여 준다.)\n\n들물 시작할 때 우럭이 움직여요. 그 전에 자리 잡고 기다려요. 물때 모르는 건 부끄러운 게 아니에요. 모르면서 아는 척하는 게 위험하죠.',
        "The West Sea comes in and goes out big. Inside the pier it's a bit gentler. (He pulls up a tide table on his phone to show me.)\n\nRockfish move when the flood starts. Get in position before then and wait. Not knowing the tides is nothing to be ashamed of. Pretending to know is what's dangerous.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('follow_crate', '제가 위판에 낸 상자가 어디까지 가는지 보고 싶습니다.', "I'd like to see how far the crates I put up at auction travel.",
        '보러 와요. 새벽 도매시장은 퇴근길이 아니라 출근길이지만요. (명함 뒤에 시장 이름을 적어 준다.)\n\n자기 이름 붙은 상자가 어디로 가는지 따라가 보는 사람은 드물어요. 한 번 보고 나면 원산지 표기를 대충 못 해요. 그게 인천에서 배울 거예요.',
        "Come and see. Though the early wholesale market isn't on my way home, it's on my way to work. (He writes the market's name on the back of his business card.)\n\nFew people follow a crate with their own name on it to see where it goes. Once you've seen it, you can't be sloppy with origin labels again. That's what Incheon has to teach you.",
        { affinity: 0.04, harborRep: 1, flag: 'choice.m6_04_follow_crate' }),
    ],
    completeReply: {
      trade: [
        '그걸 알면 인천 반은 안 거예요. (부장이 도매시장 출입증을 하나 만들어 준다.)\n\n나머지 반은 사람이에요. 같은 우럭이라도 누가 얼음을 얼마나 넣고 옮겼는지에 따라 값이 달라져요. 그건 표기에 안 나와요. 눈으로 배워야 해요.',
        "Know that and you know half of Incheon. (The section chief has a wholesale market pass made up for me.)\n\nThe other half is people. Even the same rockfish fetches a different price depending on who packed it and how much ice went in. That's not on any label. You learn it with your eyes.",
      ],
      two_hours: [
        '늘 그래요. 짬낚시가 그래요. (다음 퇴근길에도 부른다.)\n\n짬낚시는 짧게 하려고 시작해서 길게 끝나요. 그래도 내일 출근은 해야 하니까 두 시간에서 딱 끊는 거예요. 끊을 줄 아는 게 짬낚시 실력이에요.',
        "It always does. That's snatched fishing for you. (He calls me again on his next way home.)\n\nSnatched fishing starts out meant to be short and ends up long. Still, there's work tomorrow, so you cut it off at two hours. Knowing when to stop is the real skill of it.",
      ],
    },
  },

  // ── M6-05 「병실」 · 정옥선 ──
  'M6-05': {
    offer: [
      d('body_first', '먼저 몸부터 챙기십시오. 조행록은 그다음에 받겠습니다.', 'Look after yourself first. I can take the log after that.',
        '…몸은 의사가 챙긴다. 나는 이거 챙긴다. (베개 밑을 손으로 더듬는다.)\n\n누워 있으니까 손이 할 일이 없어. 이거라도 넘겨야 손이 편하다. 꺼내. 네 손으로. 내 손은 지금 떨려서 못 꺼낸다.',
        "...The doctors mind the body. I mind this. (She feels under the pillow with her hand.)\n\nLying here, my hands have nothing to do. Handing this over will settle them. Take it out. With your own hands. Mine shake too much right now.",
        { affinity: 0.05 }),
      d('ask_journal', '이게 왜 할머니한테 있었습니까?', 'Why did you have this?',
        '…그 얘긴 길다. 지금 하면 숨이 차. (눈을 감았다 뜬다.)\n\n네가 이걸 거의 다 채울 때쯤 말해 주마. 그 전에는 묻지 마라. 지금은 받기만 해. 네 아버지 거니까 네가 갖는 게 맞다.',
        "...That's a long story. Telling it now would leave me out of breath. (She closes her eyes and opens them.)\n\nI'll tell you when you've nearly filled it. Don't ask before then. For now, just take it. It was your father's, so it's right that you keep it.",
        { affinity: 0.03, flag: 'choice.m6_05_asked_journal' }),
      d('hesitant', '…제가 써도 되는 겁니까. 아버지 글씨 뒤에요.', "...Is it all right for me to write in it? After my father's handwriting?",
        '되니까 주는 거다. 글씨는 달라도 된다. 바다를 보는 눈만 같으면 돼. (손가락으로 표지를 한 번 쓸어 본다.)\n\n잘 쓰려고 하지 마라. 본 대로 적어. 명태 얘기 받아 적던 때처럼. 그때 네 글씨, 나는 봤다.',
        "It's because it's all right that I'm giving it to you. The handwriting can differ. You just need the same eye for the sea. (She runs a finger once across the cover.)\n\nDon't try to write it well. Write what you see. Like when you took down the pollack stories. I saw your writing then.",
        { affinity: 0.04, flag: 'choice.m6_05_hesitant' }),
      d('cut_trips', '병원비랑 간병은 제가 맡겠습니다. 출조는 줄이겠습니다.', "I'll handle the hospital bills and the care. I'll cut back on fishing.",
        '줄이지 마. 출조 줄이는 놈이 병원비를 어떻게 대. (그래도 그 말에 눈을 한 번 감는다.)\n\n약 시간만 지켜 주면 된다. 나머지는 간호사가 한다. 얼음이나 날라. 좌판 얼음 세 번이면 오늘 병원비는 된다.',
        "Don't cut back. How would someone who cuts back pay the hospital? (Still, at that she closes her eyes once.)\n\nJust keep to the medicine times. The nurses do the rest. Go carry ice. Three runs of stall ice will cover today's bill.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('stay_till_sleep', '주무실 때까지 옆에 있겠습니다. 얼음은 그다음에 나르겠습니다.', "I'll stay until you're asleep. I'll carry the ice after that.",
        '…애도 아니고. (그래도 손을 이불 밖으로 내놓는다. 잡으라는 뜻이다.)\n\n잠들면 바로 가. 얼음은 아침이 제일 바쁘다. 좌판 비우면 손님들이 내 걱정부터 해. 그게 싫다.',
        "...I'm not a child. (Still, she puts her hand out from under the blanket. It means hold it.)\n\nGo as soon as I'm asleep. Mornings are busiest for ice. If the stall's empty the customers start worrying about me first. I hate that.",
        { affinity: 0.08, flag: 'choice.m6_05_stayed' }),
    ],
    completeReply: {
      promise: [
        '…그래. (할머니가 눈을 감는다. 편한 얼굴이다.)\n\n(잠든 줄 알았는데 입술이 조금 움직인다.) 마지막 장까지면 오래 걸린다. 서두르지 마라. 대신 하루도 비우지 말고.',
        "…Good. (She closes her eyes. Her face is easy.)\n\n(I thought she was asleep, but her lips move a little.) Down to the last page will take a long time. Don't rush. But don't leave a single day blank.",
      ],
      cry: [
        '울 거면… 얼음부터 나르고 울어. (웃는다. 병실에서.)\n\n(웃음이 금방 기침으로 바뀐다. 그래도 손을 내젓는다.) 가 봐. 나 좀 자게. 얼음 다 나르고 와서 울든 웃든 해라.',
        "If you're going to cry… carry the ice first, then cry. (She laughs. In a hospital room.)\n\n(The laugh turns into a cough, but she waves me off.) Go on. Let me sleep. Carry all the ice, then come back and cry or laugh, whichever.",
      ],
    },
  },

  // ── M6-06 「좌판을 맡다」 · 정옥선 ──
  'M6-06': {
    offer: [
      d('keep_place', '사흘 동안 할머니 자리 지키겠습니다.', "I'll keep your place for three days.",
        '내 자리 말고 좌판 자리야. 사람은 바뀌어도 좌판은 그 자리에 있어야 손님이 온다. (침대 머리맡에서 열쇠 꾸러미를 찾아 건넨다.)\n\n얼음은 아침에 먼저 깔고 물건은 그다음. 순서 바꾸면 하루 장사 끝이다. 그건 네가 제일 잘 알지.',
        "Not my place. The stall's place. People change, but the stall has to stay put for customers to come. (From the head of the bed she finds a bunch of keys and hands it over.)\n\nIce goes down first in the morning, goods after. Swap that order and the day's trade is over. You know that better than anyone.",
        { affinity: 0.05 }),
      d('ask_price', '값은 어떻게 매깁니까? 할머니처럼 눈으로요?', 'How do I set prices? By eye, like you?',
        '눈이 아니라 아침 경매가 기준이다. 위판장 시세 보고, 얼음값 더하고, 손님 얼굴 봐. (손가락 셋을 접는다.)\n\n마지막 게 제일 어렵다. 단골한테는 덤을 주고 처음 온 손님한테는 설명을 줘라. 값은 같게. 그게 내 좌판 값이다.',
        "Not by eye. The morning auction is the guide. Check the auction price, add the ice, look at the customer's face. (She folds down three fingers.)\n\nThe last one's hardest. Give regulars a little extra and give first-timers an explanation. Same price for both. That's my stall's price.",
        { affinity: 0.03, flag: 'choice.m6_06_asked_price' }),
      d('ask_customers', '손님들이 할머니 어디 가셨냐고 물으면 뭐라고 합니까?', 'If customers ask where you have gone, what do I tell them?',
        '좀 쉰다고 해. 병원 얘기는 하지 마. 그 소리 들으면 다들 물건 대신 걱정을 사 간다. (이불을 끌어 올린다.)\n\n그래도 끝까지 물으면… 곧 나온다고 해라. 거짓말 아니다. 나는 나갈 거니까.',
        "Say I'm resting. Don't mention the hospital. Hear that and everyone buys worry instead of fish. (She pulls the blanket up.)\n\nIf they keep asking... say I'll be back soon. It's not a lie. I am going back.",
        { affinity: 0.04, flag: 'choice.m6_06_asked_customers' }),
      d('sell_better', '사흘이면 할머니보다 장사 잘할 수도 있습니다.', 'In three days I might sell better than you.',
        '…말은. 해 봐라. 나보다 잘하면 좌판 넘겨주고 나는 놀러 간다. (코웃음을 친다. 그래도 눈은 웃는다.)\n\n하나만 알아 둬. 많이 판 날보다 덜 남긴 날이 좌판한테 좋은 날일 때가 있다. 무슨 말인지는 사흘 지나면 알 거다.',
        "...Listen to you. Go on, then. If you beat me I'll hand over the stall and go on holiday. (She snorts. Her eyes are smiling, though.)\n\nKnow one thing. Sometimes a day you made less is a better day for the stall than a day you sold a lot. You'll know what that means after three days.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('regulars', '손님들이 할머니 안부부터 물었습니다. 다들 기다립니다.', 'The customers asked after you first thing. Everyone is waiting for you.',
        '…그 사람들 다 시끄럽지. (이불 끝을 만지작거린다.)\n\n물건 사러 와서 남의 늙은이 걱정이나 하고. 그래서 그 좌판을 못 접는 거다. 다음에 또 물으면 고맙다고 전해라. 내 대신 네가.',
        "...They're all a noisy lot. (She fiddles with the edge of the blanket.)\n\nComing to buy fish and fussing over somebody else's old woman. That's why I can never fold up that stall. If they ask again, tell them thank you. You, on my behalf.",
        { affinity: 0.08, flag: 'choice.m6_06_regulars' }),
    ],
    completeReply: {
      understood: [
        '…늦게 알았네. (그래도 웃는다. 좌판 열쇠를 내게 하나 더 준다.)\n\n얼음이 없으면 좌판은 하루도 못 간다. 사람도 그렇다. 남이 안 보는 일을 먼저 하는 놈이 자리를 지키지. 그 열쇠는 그 일 하라고 주는 거다.',
        "…Took you long enough. (She laughs anyway, and gives me a second key to the stall.)\n\nWithout ice a stall can't last a day. People are the same. The one who does the work nobody sees is the one who keeps his place. That key is for doing that work.",
      ],
      wrong_price: [
        '그 손님이 누군지 알지. 삼십 년 단골이다. (그 손님이 다음 날 얼음 상자를 하나 들어 줬다.)\n\n그 양반은 틀린 값을 그냥 넘어가는 법이 없다. 나한테도 그랬어. 고쳐 주는 손님이 남은 좌판이 오래간다. 다음엔 네가 먼저 인사해라.',
        "I know which one. Thirty years a regular. (The next day that customer carried an ice crate for me.)\n\nThat one never lets a wrong price slide. Did the same to me. A stall that still has customers who correct it lasts a long time. Next time, you greet them first.",
      ],
    },
  },

  // ── M6-09 「고래마루의 마지막 손님」 · 고만석 ──
  'M6-09': {
    offer: [
      d('remember_bow', '기억합니다. 뱃머리였습니다. 그날 멀미가 심했죠.', 'I remember. The bow. I was badly seasick that day.',
        '…잊었을 줄 알았다. 토하면서도 수평선은 보더군. (모자챙을 내려 쓴다.)\n\n그 자리 비워 두마. 마지막 항차는 손님 자리부터 정하는 거다. 키는 내가 안 잡는다. 해나가 잡는다.',
        "...Thought you'd have forgotten. Throwing up, and still watching the horizon. (He pulls his cap brim down.)\n\nI'll keep that seat free. On a last trip you settle the passengers' seats first. I won't be at the wheel. Haena will.",
        { affinity: 0.05 }),
      d('ask_why', '배를 왜 내놓으십니까? 고래마루는 선장님 배 아닙니까.', 'Why are you selling? The Goraemaru is your boat.',
        '내 배니까 내가 내놓는 거다. 남의 배면 못 내놓지. (갑판 난간을 손바닥으로 한 번 친다.)\n\n이유는 묻지 마라. 바다에 오래 있으면 그만둘 날도 바다가 알려 준다. 그날이 왔을 뿐이야. 손님으로 와. 그거면 된다.',
        "It's mine, so I'm the one who sells it. You can't sell someone else's. (He slaps the deck rail once with his palm.)\n\nDon't ask why. Stay on the sea long enough and the sea tells you the day to stop. That day's come, that's all. Come as a customer. That's enough.",
        { affinity: 0.02, flag: 'choice.m6_09_asked_why' }),
      d('just_fish', '손님으로 타면 저는 낚시만 하면 됩니까? 일손은 안 거들고요?', 'As a customer, do I just fish? Not lend a hand?',
        '손님이 왜 일을 해. 앉아서 낚고, 먹고, 바다나 봐. (처음으로 웃음 비슷한 게 지나간다.)\n\n듣자 하니 자네도 이제 손님 태운다더군. 그러니까 더 손님으로 와. 남의 배에서 손님 노릇 하는 법을 잊으면 제 손님도 못 본다.',
        "Why would a customer work? Sit, fish, eat, look at the sea. (Something like a smile passes over him for the first time.)\n\nI hear you take customers yourself now. All the more reason to come as one. Forget how to be a customer on someone else's boat and you can't look after your own.",
        { affinity: 0.03 }),
      d('no_seasick', '마지막이니까 이번엔 멀미 안 하겠습니다. 약속은 못 합니다.', "Since it's the last one, I won't get seasick. Can't promise, though.",
        '약은 배에 있다. 마지막이라고 바다가 봐주진 않아. (코로 짧게 웃는다.)\n\n토해도 뱃머리에서 토해. 그 자리는 그러라고 있는 거다. 처음 탄 날처럼 오면 돼. 그래야 끝이 처음하고 맞는다.',
        "The pills are on board. The sea doesn't go easy just because it's the last trip. (He laughs once, short, through his nose.)\n\nIf you throw up, do it at the bow. That's what that seat's for. Come like the first day. That way the end matches the beginning.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('no_record', '조황은 적지 않았습니다. 오늘은 그게 맞는 것 같았습니다.', "I didn't log the catch. Today that felt right.",
        '…잘했다. 마지막 항차 조황은 적는 게 아니야. 적으면 숫자가 남고, 안 적으면 그날이 남지. (조타실 쪽을 한 번 돌아본다.)\n\n이 배는 숫자로 기억되면 안 되는 배다. 자네는 그걸 알았네. 손님으로 와 줘서 고맙다.',
        "...Good. You don't log the catch on a last trip. Log it and numbers stay. Don't, and the day stays. (He glances back once toward the wheelhouse.)\n\nThis boat shouldn't be remembered in numbers. You understood that. Thanks for coming as a customer.",
        { affinity: 0.07, seaRep: 1, flag: 'choice.m6_09_no_record' }),
    ],
    completeReply: {
      bow: [
        '…기억하네. (선장이 배 이름이 새겨진 나무판을 떼어 내게 준다.)\n\n뱃머리는 바다를 제일 먼저 맞는 자리다. 처음 탄 놈을 거기 앉히는 건 그래서야. 마지막 항차에도 거기 앉는 놈은 처음 봤다.',
        "…You remember. (The skipper prises the nameboard off the boat and gives it to me.)\n\nThe bow is the seat that meets the sea first. That's why first-timers get put there. I've never seen anyone sit there on the last trip too.",
      ],
      haena: [
        '…그건 인정 못 하지. 아니, 인정한다. (해나가 조타실에서 그 말을 들었다.)\n\n그 애는 파도를 이기려고 안 해. 나는 평생 이기려고 했지. 그래서 그 애 키가 부드러운 거다. 마지막 키를 그 애한테 맡기길 잘했어.',
        "…I can't admit that. No — I admit it. (Haena heard that from the wheelhouse.)\n\nShe doesn't try to beat the waves. I tried to beat them all my life. That's why her steering is smoother. I did right giving her the wheel for the last trip.",
      ],
    },
  },

  // ── M6-07 「항해 계획 승인」 · 동명항 어촌계 ──
  'M6-07': {
    offer: [
      d('careful_paper', '서류부터 꼼꼼히 쓰겠습니다. 한 장도 대충 안 하겠습니다.', "I'll start with the paperwork, carefully. Not one page rushed.",
        '그래야지. 바다에서는 대충 쓴 한 줄이 목숨을 가져간다. (빈 서식 세 묶음을 책상에 올린다.)\n\n기상은 사흘 치를 봐라. 정비는 엔진만 보지 말고 펌프까지. 비상계획은 제일 나쁜 날을 생각하고 써. 좋은 날은 계획이 필요 없다.',
        "You'd better. At sea, one sloppy line on paper can take a life. (He puts three bundles of blank forms on the desk.)\n\nFor weather, look three days ahead. For maintenance, don't stop at the engine, check the pumps too. Write the contingency plan for the worst day. Good days don't need a plan.",
        { affinity: 0.04 }),
      d('ask_paper_sea', '서류로 가는 바다라니요? 배로 가는 거 아닙니까?', "A sea you reach on paper? Don't you reach it by boat?",
        '배로 가지. 서류가 통과해야 배가 뜬다. (볼펜으로 서식 맨 윗줄을 두드린다.)\n\n독도는 멀다. 기름이 떨어져도 날씨가 바뀌어도 쉽게 돌아올 데가 없어. 그래서 가기 전에 종이 위에서 한 번 다녀와야 한다. 종이에서 못 돌아오면 바다에서도 못 돌아와.',
        "By boat, yes. But the boat only sails once the paperwork passes. (He taps the top line of the form with a pen.)\n\nDokdo is far. Run low on fuel or have the weather turn, and there's nowhere easy to put back to. So before you go, you make the trip once on paper. If you can't get back on paper, you won't get back at sea.",
        { affinity: 0.03, flag: 'choice.m6_07_asked_paper' }),
      d('more_paper', '면허도 있고 배도 있는데, 서류가 또 필요합니까?', "I've got a licence and a boat. Do I really need more paperwork?",
        '면허는 배를 몰 줄 안다는 거고, 계획서는 이번 바다를 안다는 거다. 둘은 다르다. (서식을 내 앞으로 민다.)\n\n멀리 갈수록 종이가 는다. 귀찮다는 놈들이 제일 먼저 구조 요청을 한다. 써. 다 쓰면 내가 한 장씩 넘긴다.',
        "A licence says you can handle a boat. A plan says you know this particular sea. They're different. (He pushes the forms in front of me.)\n\nThe farther you go, the more paper there is. The ones who call it a hassle are the first to call for rescue. Write. When you're done, I'll go through it page by page.",
        { affinity: -0.01 }),
      d('not_confident', '독도까지는 아직 자신이 없습니다. 그래서 더 꼼꼼히 쓰겠습니다.', "I'm not confident about Dokdo yet. That's why I'll write it all the more carefully.",
        '그 말이면 반은 됐다. 자신 있는 놈 계획서는 얇다. (처음으로 고개를 끄덕인다.)\n\n비상 보급 세 점도 챙겨라. 뭘 넣을지는 네가 정해. 쓸 일이 없으면 좋은 거고, 있으면 그게 목숨이다.',
        "Say that and you're halfway there. A confident man's plan is thin. (For the first time he nods.)\n\nPut together three items of emergency stores too. You decide what goes in. If you never use them, good. If you do, they're your life.",
        { affinity: 0.04, flag: 'choice.m6_07_not_confident' }),
    ],
    completeAdd: [
      d('shore_copy', '계획서 사본 하나는 뭍에 두고 가겠습니다.', "I'll leave a copy of the plan ashore.",
        '…그게 진짜 비상계획이다. 바다에 나간 놈 계획서는 뭍에 남은 사람이 갖고 있어야 쓸모가 있어. (서류를 한 부 더 복사해 준다.)\n\n한 부는 계 사무실 벽에 붙여 둔다. 돌아올 날이 지나도 안 오면 그 종이가 너를 찾으러 간다.',
        "...That's a real contingency plan. A plan only helps a man at sea if someone ashore is holding it. (He runs off one more copy of the papers.)\n\nOne copy goes on the co-op office wall. If the day you're due back passes and you haven't come, that paper goes looking for you.",
        { affinity: 0.05, seaRep: 1, flag: 'choice.m6_07_shore_copy' }),
    ],
    completeReply: {
      fuel: [
        '그 부족이 바다에서는 목숨이다. (승인 도장을 찍으며 예비 연료통을 하나 준다.)\n\n예비량은 갈 때가 아니라 돌아올 때를 보고 잡는 거다. 맞바람 맞으면 기름이 훨씬 더 든다. 그 통은 열 일이 없게 다녀와라.',
        "Out there that shortfall is a life. (Stamping the approval, he gives me a spare fuel can.)\n\nYou set the reserve by the trip back, not the trip out. Run into a headwind and you burn far more. Come back without ever opening that can.",
      ],
      paper_sea: [
        '그걸 이해하면 독도에 갈 수 있다. (도장을 찍는 손이 느리다. 확인하는 손이다.)\n\n서류를 우습게 보는 놈은 바다도 우습게 본다. 너는 한 장씩 다시 셌지. 그 손이면 됐다. 남은 건 허가 하나다.',
        "Understand it and you can go to Dokdo. (His stamping hand is slow. The hand of a man checking.)\n\nA man who takes paperwork lightly takes the sea lightly too. You went back over it page by page. Hands like that will do. All that's left is the permit.",
      ],
    },
  },

  // ── M6-08 「조사 동행 허가」 · 동명항 어촌계 ──
  'M6-08': {
    offer: [
      d('fill_gates', '세 문 다 채워서 오겠습니다. 바다에 더 나가겠습니다.', "I'll fill all three gates and come back. I'll get out on the water more.",
        '그래. 그 문은 서류로 열리는 게 아니라 네가 바다에서 보낸 날로 열린다. (명부를 펼쳐 내 이름 옆에 칸 셋을 그린다.)\n\n해양관광업은 이미 채웠고 나머지는 시간이 채운다. 손님 태우고, 물때 보고, 다치지 말고. 그러다 보면 온다.',
        "Good. Those gates don't open with paperwork. They open with the days you've spent at sea. (He opens the roll and draws three boxes beside my name.)\n\nMarine tourism you've already done. Time fills the rest. Take customers, watch the tides, don't get hurt. Keep at it and it comes.",
        { affinity: 0.04 }),
      d('ask_survey', '조사 동행이면 조사단 일을 돕는 겁니까? 낚시는 못 합니까?', "Joining the survey means helping the team? I can't fish?",
        '낚시는 한다. 다만 잡으려고 하는 낚시가 아니다. 조사단이 무엇을 재는지 보고, 시키는 대로 잰다. (서류 한 장을 넘긴다.)\n\n독도는 아무나 못 들어가는 바다다. 거기서 고기를 가져오는 게 아니라 기록을 가져온다. 그게 동행이야.',
        "You'll fish. Just not to keep. You watch what the team measures and measure what they tell you. (He turns over a page.)\n\nDokdo isn't a sea just anyone can enter. You don't bring fish back from there, you bring records. That's what joining means.",
        { affinity: 0.03, flag: 'choice.m6_08_asked_survey' }),
      d('will_you_wait', '세 문을 다 채우려면 한참 걸릴 텐데요. 기다려 주십니까?', 'Filling all three gates could take a good while. Will you wait?',
        '독도는 안 도망간다. 기다리는 건 나보다 그 바다가 더 잘해. (장부를 덮는다.)\n\n서둘러 채운 문은 바다에서 다시 닫힌다. 천천히 와. 대신 그동안 손 놓고 있지는 마라. 계원들은 네가 뭘 하는지 다 본다.',
        "Dokdo isn't going anywhere. That sea is better at waiting than I am. (He closes the ledger.)\n\nA gate you rush through closes again at sea. Take your time. But don't sit idle in the meantime. The members see everything you do.",
        { affinity: 0.02 }),
      d('castle_joke', '독도 가는 길에 문이 세 개라니, 꼭 성문 같습니다.', "Three gates on the way to Dokdo. It's like a castle.",
        '성이지. 지키는 사람이 있는 바다니까. (웃지 않는데 목소리가 조금 풀린다.)\n\n성문은 두드린다고 안 열려. 문지기가 얼굴을 알아봐야 열리지. 그 얼굴을 바다에서 만들어 와라.',
        "It is a castle. It's a sea with people guarding it. (He doesn't laugh, but his voice eases a little.)\n\nCastle gates don't open because you knock. They open when the gatekeeper knows your face. Go make that face out at sea.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('first_lantern', '실습생 때 계에서 받은 랜턴, 아직 씁니다.', 'The lantern the co-op gave me as a trainee, I still use it.',
        '…그걸 아직 쓰냐. 그 랜턴 들고 새벽 갯바위 내려가던 놈이 독도에 간다. (계장이 잠깐 창밖 항구를 본다.)\n\n계는 물건을 주는 데가 아니라 사람을 남기는 데다. 너 같은 놈 하나 남기려고 다들 얼음 나르고 그물 친 거다.',
        "...You still use that? The lad who went down to the dawn rocks with that lantern is going to Dokdo. (The chief looks out at the harbour for a moment.)\n\nA co-op isn't a place that hands out things. It's a place that leaves people behind it. Everyone carried ice and set nets to leave one like you.",
        { affinity: 0.05, harborRep: 2 }),
    ],
    completeReply: {
      last_gift: [
        '써라. 독도까지. (항해 가방 안에 계원 명부 사본이 들어 있다. 내 이름이 첫 장에 있다.)\n\n명부를 왜 넣었는지는 묻지 마라. 멀리 나가는 놈은 제가 어디 사람인지 들고 가야 한다. 독도에서 그걸 꺼내 볼 일 없게 다녀와.',
        "Use it. All the way to Dokdo. (Inside the voyage bag is a copy of the guild roll. My name is on the first page.)\n\nDon't ask why the roll's in there. A man going far should carry where he belongs. Come back without ever needing to take it out at Dokdo.",
      ],
      give_back: [
        '기억해. 2층이 기다린다. (작업장 2층 이야기를 처음 꺼낸다.)\n\n작업장 2층이 무너진 지 오래다. 계원들 다 알면서 손을 못 댔지. 독도 다녀오면 그 얘기부터 하자. 주는 쪽이 할 일이다.',
        "Remember it. The second floor is waiting. (He brings up the workshop's second floor for the first time.)\n\nThe second floor of the workshop has been in ruins a long while. Every member knows it and nobody's laid a hand on it. When you're back from Dokdo, that's what we'll talk about first. It's work for the one who gives.",
      ],
    },
  },

  // ── M7-01 「동도 접안」 · 석대양 ──
  'M7-01': {
    offer: [
      d('wait_signal', '신호 기다리겠습니다. 날씨가 허락할 때 가겠습니다.', "I'll wait for your signal. I'll go when the weather allows.",
        '그래. 독도 앞바다는 하루에도 몇 번씩 얼굴을 바꿔. 열렸다 싶으면 닫히고. (무전기 너머로 종이 넘기는 소리가 난다.)\n\n내가 풍속하고 파고를 보다가 됐다 싶으면 부르지. 그 전에 나가면 안 돼. 기다리는 것도 항해야.',
        "Good. The sea off Dokdo changes its face several times a day. Just when you think it's open, it shuts. (Over the radio comes the sound of pages turning.)\n\nI'll watch the wind and the waves and call when it's right. Don't go before that. Waiting is part of the passage too.",
        { affinity: 0.04 }),
      d('ask_hours', '왜 세 시간뿐입니까? 더 있으면 안 됩니까?', "Why only three hours? Can't I stay longer?",
        '날씨 때문이지. 동도에 배를 대 둘 수 있는 시간은 바다가 정해. 세 시간 넘기면 돌아가는 길이 닫힐 수 있어. (잠깐 무전이 끊겼다 이어진다.)\n\n그리고 거기는 사람이 오래 머물 데가 아니야. 지키는 사람들 자리지. 보고, 적고, 돌아오게.',
        "Because of the weather. The sea decides how long you can lie alongside Dongdo. Go past three hours and the way back may close. (The radio cuts out a moment and comes back.)\n\nAnd it isn't a place for people to linger. It belongs to the people who guard it. See it, write it down, come back.",
        { affinity: 0.03, flag: 'choice.m7_01_asked_hours' }),
      d('afraid', '…막상 와 보니 무섭습니다. 아버지가 지난 바다라서요.', "...Now that I'm here, I'm scared. It's the sea my father passed.",
        '무서운 게 맞아. 이 바다를 우습게 보는 놈한테는 내가 신호 안 줘. (한참 무전이 조용하다.)\n\n자네 아버지도 이 앞을 지날 때 등대 쪽을 한 번은 봤을 거야. 지나가는 배들은 다 그래. 그러니 자네도 한 번 보게. 내가 불을 켜 두지.',
        "Being scared is right. I don't give the signal to anyone who takes this sea lightly. (The radio stays quiet a long while.)\n\nYour father would have looked toward the lighthouse at least once as he passed. All passing boats do. So you look too. I'll keep the light on.",
        { affinity: 0.05, flag: 'choice.m7_01_afraid' }),
      d('battery', '신호를 놓치면 어떡합니까? 무전기 배터리가 간당간당합니다.', "What if I miss the signal? My radio battery's nearly dead.",
        '…예비 배터리도 안 챙기고 독도를 가나. (혀 차는 소리가 무전기로 들린다.)\n\n지금 충전해 둬. 신호는 될 때까지 몇 번이고 다시 준다. 놓쳤다고 혼자 들어가지만 마. 그게 제일 위험해.',
        "...Heading to Dokdo without a spare battery? (A tutting sound comes over the radio.)\n\nCharge it now. I'll keep giving the signal as many times as it takes. Just don't go in alone because you think you missed it. That's the most dangerous thing.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('light_seen', '신호 주셔서 고맙습니다. 등대 불빛이 여기서도 보입니다.', 'Thank you for the signal. I can see the lighthouse beam from here.',
        '…보이나. 그 불은 22년 전에도 거기 있었지. (무전기 너머 목소리가 조금 낮아진다.)\n\n자네가 거기 서 있다는 걸 이 불이 알아. 세 시간 다 쓰고, 돌아올 때 다시 부르게. 그때도 켜 두지.',
        "...You can see it? That light was there twenty-two years ago too. (The voice over the radio drops a little.)\n\nThis light knows you're standing there. Use your three hours, and call me again when you head back. It'll be on then too.",
        { affinity: 0.06, seaRep: 1 }),
    ],
    completeReply: {
      end: [
        '끝이 아니야. 여기서 돌아가는 거지. 그게 조행록이야. (무전기 너머로 노인이 오래 말이 없다.)\n\n…뱃사람은 끝까지 가는 사람이 아니라 돌아올 줄 아는 사람이야. 보고, 적고, 뱃머리 돌리게. 돌아가는 길은 내가 보고 있지.',
        "It isn't the end. It's where you turn back. That's what the logbook is. (Over the radio the old man says nothing for a long while.)\n\n...A seaman isn't someone who goes all the way. He's someone who knows how to come back. Look, write it down, and turn the bow around. I'll be watching the way back.",
      ],
      three_hours: [
        '짧아야 해. 길면 돌아갈 마음이 안 생겨. (등대 불빛이 한 번 깜박인다.)\n\n세 시간 동안 다 보려고 하지 마. 하나만 제대로 봐. 조행록에 적을 건 그 하나면 돼. 나머지는 다음에 또 오면 되지.',
        "It has to be. Any longer and you'd stop wanting to go back. (The lighthouse beam blinks once.)\n\nDon't try to see everything in three hours. See one thing properly. That one thing is all the logbook needs. The rest, you can come back for.",
      ],
    },
  },

  // ── M7-02 「조사선」 · 동명항 어촌계 ──
  'M7-02': {
    offer: [
      d('cooler_shut', '계측하고 바로 놓겠습니다. 쿨러는 안 엽니다.', "I'll measure and release right away. The cooler stays shut.",
        '그래. 오늘 쿨러는 짐이다. (조사단 대학생한테서 계측판을 받으라고 손짓한다.)\n\n물 밖에 오래 두면 놓아줘도 못 산다. 재고, 찍고, 놓는 데 숨 한 번이면 된다. 손 적셔서 만져라. 마른 손으로 잡으면 비늘이 다친다.',
        "Good. Today the cooler is dead weight. (He signals for me to take the measuring board from the survey student.)\n\nKeep it out of the water too long and it won't live even if you let it go. Measure, photograph, release, all in one breath. Wet your hands before you touch it. Dry hands hurt the scales.",
        { affinity: 0.04 }),
      d('ask_survey', '조사단은 이걸로 뭘 알아내는 겁니까?', 'What does the team learn from this?',
        '어떤 놈이 얼마만 한 게 얼마나 사는지. 해마다 재면 바다가 늘었는지 줄었는지 보인다. (기록지를 한 장 들어 보인다.)\n\n잡아서 세면 바다가 줄고, 재고 놓으면 숫자만 남는다. 오늘 네가 남기는 건 숫자다. 고기는 바다에 남기고.',
        "What kinds, what sizes, and how many live here. Measure every year and you see whether the sea is growing or shrinking. (He holds up one record sheet.)\n\nCatch and count and the sea shrinks. Measure and release and only the numbers stay. Today you leave numbers behind. The fish you leave in the sea.",
        { affinity: 0.03, flag: 'choice.m7_02_asked_survey' }),
      d('itchy_hands', '잡지 않는 낚시라니, 손이 근질거릴 것 같습니다.', 'Fishing without keeping. My hands are going to itch.',
        '근질거려도 놔라. 그 손이 오늘 배울 거다. (계장이 드물게 입꼬리를 올린다.)\n\n종묘방류 때 양동이 들던 손 기억나냐. 그때는 작은 걸 놓았고 오늘은 큰 걸 놓는다. 큰 걸 놓을 줄 알아야 바다 사람이다.',
        "Let it go even if they itch. That's what those hands will learn today. (The chief, unusually, lifts the corner of his mouth.)\n\nRemember your hands on the buckets at the fry release? Then you let small ones go. Today you let big ones go. You have to be able to let a big one go to be a sea person.",
        { affinity: 0.02 }),
      d('ask_pick', '세 마리는 아무 종이나 됩니까? 고르는 게 있습니까?', 'Does any species count for the three? Do I get to pick?',
        '고르지 마라. 올라오는 대로 잰다. 고르는 순간 조사가 아니라 네 조과가 된다. (기록지 맨 윗칸을 비워 둔다.)\n\n큰 놈만 재면 바다가 커 보이고 작은 놈만 재면 작아 보인다. 바다가 주는 대로 받아 적는 거다.',
        "Don't pick. Measure whatever comes up. The moment you pick, it stops being a survey and becomes your catch. (He leaves the top box of the record sheet blank.)\n\nMeasure only big ones and the sea looks big. Only small ones and it looks small. You write down what the sea gives you.",
        { affinity: 0.03, flag: 'choice.m7_02_asked_pick' }),
    ],
    completeAdd: [
      d('no_name', '조사 기록에는 제 이름 안 남겨도 됩니다.', "My name needn't go on the survey record.",
        '…조사 기록엔 조사단 이름만 들어간다. 그게 맞다. (그래도 기록지 귀퉁이에 작게 계 이름을 적는다.)\n\n네 이름은 조행록에 써라. 조사 기록은 바다 거고 조행록은 네 거다. 둘 다 거짓말만 안 하면 된다.',
        "...The survey record only carries the team's name. That's as it should be. (Still, in a corner of the sheet he writes the co-op's name small.)\n\nPut your name in the logbook. The survey record belongs to the sea, and the logbook belongs to you. Neither may lie, that's all.",
        { affinity: 0.06, harborRep: 1 }),
    ],
    completeReply: {
      light: [
        '그 손이 조사원 손이다. (조사단 배지를 하나 준다. 임시라고.)\n\n무겁게 놓는 놈은 아쉬워서 그런 거다. 가볍게 놓는 놈은 바다를 믿는 거고. 임시 배지라도 그 손이면 오래 달고 다녀도 된다.',
        "That hand is a surveyor's hand. (He gives me a survey team badge. Provisional, he says.)\n\nSomeone who lets go heavily does it out of regret. Someone who lets go lightly trusts the sea. Provisional or not, with hands like that you can wear that badge a long time.",
      ],
      record: [
        '그렇게 적는 사람이 열일곱 장을 채운다. (계장이 처음으로 조행록을 직접 본다.)\n\n마릿수는 그날 운이고 종은 그 바다다. 나중에 네 아버지가 적은 장들하고 비교해 봐라. 같은 식으로 적혀 있으면, 조행록은 그렇게 이어지는 거다.',
        "People who record it that way fill all seventeen pages. (For the first time the chief looks through the logbook himself.)\n\nThe count is the day's luck. The species is the sea itself. Later, compare it with the pages your father wrote. If they're written the same way, that's how a logbook carries on.",
      ],
    },
  },

  // ── M7-03 「열일곱 번째 장」 · 석독구 ──
  'M7-03': {
    offer: [
      d('you_photo', '좋아. 사진은 네가 맡아라. 계측은 내가 하지.', "Good. You handle the photo. I'll do the measuring.",
        '응! 나 사진 잘 찍어. 흔들리면 다시 찍으면 돼. 근데 돌돔은 두 번 안 올라와. (카메라 끈을 손목에 두 번 감는다.)\n\n돌돔은 갯바위 밑에 있어. 여름 가을. 이빨이 세서 미끼를 다 갉아 먹어. 그러니까 빨리 챔질해야 해. 할 수 있지?',
        "Yeah! I'm good at photos. If it's blurry I just take another. But a beakperch doesn't come up twice. (He wraps the camera strap twice round his wrist.)\n\nBeakperch live under the rocks. Summer and autumn. Their teeth are so strong they gnaw the bait clean off. So you have to strike fast. You can do it, right?",
        { affinity: 0.05 }),
      d('ask_end', '끝이라고 누가 그래? 조행록이 끝나는 거야?', 'Who says it ends? Does the logbook end?',
        '조사단 형들이 그랬어. 열일곱 장 채우면 완성이래. (고개를 갸웃한다.)\n\n근데 완성이면 끝이야? 나는 잘 모르겠어. 공책은 다 쓰면 새 공책 사잖아. 아저씨는 어떻게 생각해? …아니, 일단 돌돔부터 잡자.',
        "The survey guys said so. Fill seventeen pages and it's complete. (He tilts his head.)\n\nBut if it's complete, is it over? I dunno. When you fill a notebook you buy a new one, right? What do you think, mister? ...No, let's catch the beakperch first.",
        { affinity: 0.04, flag: 'choice.m7_03_asked_end' }),
      d('hands_shake', '마지막 장이라니까 손이 떨린다.', 'The last page. My hands are shaking.',
        '떨면 안 돼! 아니, 떨어도 돼. 사진은 내가 안 흔들리게 찍을게. (내 손을 한 번 쳐다본다.)\n\n손 떨리는 건 마지막이라서 그런 거지? 그럼 마지막 아니라고 생각해. 그냥 돌돔 한 마리야. 나는 그렇게 생각하면 안 떨려.',
        "You can't shake! No, wait, you can. I'll keep the photo steady. (He glances at my hands once.)\n\nYour hands shake because it's the last one, right? Then pretend it isn't. It's just one beakperch. When I think like that, I don't shake.",
        { affinity: 0.04 }),
      d('ice_cream', '사진 잘 나오면 아이스크림 사 줄게.', 'If the photo comes out well, ice cream is on me.',
        '진짜? 두 개! 아니, 세 개! (벌써 카메라를 들고 서 있다.)\n\n근데 돌돔부터야. 돌돔 못 잡으면 아이스크림도 없는 거지? 그럼 빨리 가. 갯바위 밑. 내가 먼저 가서 자리 봐 둘게.',
        "Really? Two! No, three! (He's already standing there holding the camera.)\n\nBut beakperch first. No beakperch, no ice cream, right? Then hurry. Under the rocks. I'll go ahead and find a spot.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('good_release', '놓아주는 손은 네가 제일 좋더라.', 'You had the best hands for letting it go.',
        '…진짜? 돌돔이 꼬리로 물 튀기고 갔어. 내 얼굴에. (젖은 손을 바지에 닦는다.)\n\n그건 사진 안 찍었어. 근데 안 찍어도 기억날 것 같아. 열일곱 번째 장은 사진이고, 그건 그냥 내 거야.',
        "...Really? The beakperch splashed with its tail as it went. Right in my face. (He wipes his wet hands on his trousers.)\n\nI didn't photograph that. But I think I'll remember it anyway. The seventeenth page is the photo. That part is just mine.",
        { affinity: 0.06, seaRep: 1, flag: 'choice.m7_03_good_release' }),
    ],
    completeReply: {
      dokgu: [
        '진짜? 내 사진이? (아이가 카메라를 꼭 쥔다. 완성 축하금은 계에서 왔다.)\n\n그럼 이 사진 흔들리면 안 되는데. 다시 볼래? 안 흔들렸지? …응, 안 흔들렸어. 나 이거 평생 자랑할 거야. 조사단 형들한테도.',
        "Really? My photo? (He clutches his camera. The completion money came from the guild.)\n\nThen it can't be blurry. Want to look again? It's not blurry, right? ...Yeah, it's not. I'm going to brag about this forever. To the survey guys too.",
      ],
    },
  },

  // ── M7-04 「사진 속 천막」 · 정옥선 ──
  'M7-04': {
    offer: [
      d('take_time', '사진 여기 있습니다. 천천히 말씀해 주십시오.', "Here's the photo. Take your time.",
        '…천천히 할 얘기가 아니라 오래 걸리는 얘기다. 앉아. (사진을 받아 들고 한참 들여다본다.)\n\n이 천막 귀퉁이 보이냐. 비 새서 내가 덧댄 자리다. 그 앞에 서 있는 꼬맹이가 너다.',
        "...It's not a story to take slowly, it's a story that takes long. Sit. (She takes the photo and stares at it a long while.)\n\nSee this corner of the awning? That's where I patched it when it leaked. The little one standing in front of it is you.",
        { affinity: 0.05 }),
      d('ask_how', '22년 전에 저를 보셨다고요? 어떻게 기억하십니까?', 'You saw me twenty-two years ago? How can you remember?',
        '좌판 하는 사람은 얼굴을 안 잊는다. 그날 너는 울 것 같은 얼굴로 내 좌판 앞에 서 있었어. (사진 속 얼굴을 손가락으로 짚는다.)\n\n얘기가 길다. 나머지는 도다리 한 마리 올리고 와서 들어. 네 살 때 서 있던 그 자리에서.',
        "People who run stalls never forget a face. That day you stood in front of my stall looking like you were about to cry. (She touches the face in the photo with a finger.)\n\nIt's a long story. Go land a flounder first, then come and hear the rest. From the same spot you stood in at four.",
        { affinity: 0.04, flag: 'choice.m7_04_asked_how' }),
      d('why_now', '…왜 이제야 말씀하십니까.', '...Why are you only telling me now?',
        '…조행록이 다 찼으니까. 열일곱 장. 그 전에 말했으면 너는 사진만 보고 살았을 거다. 바다는 안 보고. (사진을 쥔 손이 떨린다.)\n\n이제는 됐다. 네가 바다를 다 봤으니까. 그러니 이제는 사진을 봐도 된다.',
        "...Because the log is full. Seventeen pages. If I'd told you before, you'd have lived looking only at the photo. Not at the sea. (The hand holding the photo trembles.)\n\nNow it's all right. You've seen the sea, all of it. So now you can look at the photo.",
        { affinity: 0.03, flag: 'choice.m7_04_why_now' }),
      d('flounder_first', '먼저 도다리부터 올려 오겠습니다. 그 자리에서요.', "Let me land the flounder first. From that same spot.",
        '그래, 그게 순서다. 얘기는 앉아서 하는 거고 고기는 서서 하는 거지. (사진을 베개 옆에 세워 둔다.)\n\n그 자리, 방파제는 바뀌었어도 물은 그대로다. 도다리는 바닥에 붙어 있다. 천천히 끌어. 다녀오면 다 말해 주마.',
        "Right, that's the order. Stories are told sitting, fish are caught standing. (She props the photo up beside her pillow.)\n\nThe breakwater's changed since then, but the water's the same. Flounder sit on the bottom. Drag it slowly. When you're back, I'll tell you everything.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('same_spot', '그 자리에서 도다리를 올렸습니다. 네 살 때 서 있던 데서요.', 'I landed the flounder from that spot. Where I stood at four.',
        '…그 자리에서. (한참 말이 없다가 사진을 다시 본다.)\n\n22년 동안 그 자리를 몇 번이나 봤는지 모른다. 이제 거기 서 있는 게 꼬맹이가 아니라 어부구나. 잘 왔다. 정말 잘 왔다.',
        "...From that spot. (She is silent a long while, then looks at the photo again.)\n\nI don't know how many times I've looked at that spot in twenty-two years. Now the one standing there isn't a little one, he's a fisherman. You came back. You really did.",
        { affinity: 0.08, flag: 'choice.m7_04_same_spot' }),
    ],
    completeReply: {
      thanks: [
        '그게 고마울 일이냐. …그래, 고마워해라. (웃는다. 병실이 밝다.)\n\n고마운 건 나다. 그 꼬맹이가 다시 와서 얼음 상자를 끝까지 안 떨어뜨리고 날랐으니까. 처음 본 날 내가 아무 말도 안 한 건, 그 말 하면 울 것 같아서였다.',
        "Is that something to thank me for? …Fine. Be thankful. (She laughs. The room is bright.)\n\nI'm the one who's grateful. That little one came back and carried the ice crate all the way without dropping it. The reason I said nothing that first day was that I'd have cried if I had.",
      ],
    },
  },

  // ── M7-05 「2층」 · 동명항 어촌계 ──
  'M7-05': {
    offer: [
      d('raise_it', '삼천만 원, 모아 오겠습니다. 손님도 태우고 위판도 내고요.', "I'll raise the thirty million. Taking customers, putting lots up at auction.",
        '그래. 한 번에 모으려고 하지 마라. 큰돈은 작은 날이 모여서 된다. (장부 빈 쪽을 펼쳐 첫 줄에 날짜를 적는다.)\n\n네가 손님 태우는 날마다 계원들이 본다. 그걸 보고 한 사람씩 지갑을 연다. 돈보다 그게 먼저 모여야 2층이 선다.',
        "Good. Don't try to raise it all at once. Big money is small days added up. (He opens a blank page of the ledger and writes a date on the first line.)\n\nEvery day you take customers, the members are watching. Seeing that, they open their wallets one by one. That has to gather before the money does, or the second floor won't stand.",
        { affinity: 0.04 }),
      d('ask_why', '2층은 왜 무너진 겁니까? 그동안 왜 못 고쳤습니까?', "Why did the second floor fall in? Why couldn't it be fixed all this time?",
        '…오래된 얘기다. 이번엔 돈이 없고, 다음엔 사람이 없고. 하나씩 미루다 보니 이렇게 됐다. (창밖 작업장 쪽을 본다.)\n\n다들 고쳐야 한다는 건 알았지. 먼저 꺼내는 사람이 없었을 뿐이야. 이번엔 네가 꺼냈다. 그러니 네가 모아.',
        "...It's an old story. One time there was no money, the next no people. Put it off one thing at a time and this is what you get. (He looks out toward the workshop.)\n\nEveryone knew it needed fixing. Nobody would be first to bring it up, that's all. This time you did. So you gather it.",
        { affinity: 0.03, flag: 'choice.m7_05_asked_why' }),
      d('too_big', '삼천만은 너무 큽니다. 제 통장으로는 엄두가 안 납니다.', "Thirty million is too much. My account can't even think about it.",
        '혼자 내라는 게 아니다. 모으라는 거지. (장부를 탁 덮는다.)\n\n자재는 계원들이 아는 데서 싸게 구하고, 손은 다들 보탠다. 네가 할 일은 그 판을 까는 거다. 무엇을 팔고 무엇을 받을지 계산해 봐. 계산이 서면 엄두도 선다.',
        "I'm not telling you to pay it alone. I'm telling you to gather it. (He snaps the ledger shut.)\n\nThe members can get materials cheap from people they know, and everyone will lend a hand. Your job is to set the table. Work out what to sell and what to accept. Once the sums add up, the nerve will too.",
        { affinity: 0.03 }),
      d('ask_use', '2층이 서면 무엇으로 씁니까? 그걸 알아야 모으기 쉽습니다.', 'What will the second floor be used for? Knowing that would make it easier to raise.',
        '계원들이 모여 앉을 자리. 그리고 지나온 기록을 둘 자리다. 조행록 같은 거. (잠깐 생각하다 덧붙인다.)\n\n낚시하러 온 사람들이 앉았다 갈 수 있으면 더 좋고. 이름은 다 서고 나서 붙이자. 지금 붙이면 돈보다 말이 먼저 모인다.',
        "A place for the members to sit together. And a place to keep the records we've made. Logbooks and the like. (He thinks a moment, then adds.)\n\nBetter still if people who come to fish can sit there a while too. We'll name it once it's standing. Name it now and words will gather before the money does.",
        { affinity: 0.02, flag: 'choice.m7_05_asked_use' }),
    ],
    completeAdd: [
      d('leftover', '모으고 남는 돈은 계 장부에 두십시오. 다음 수리에 쓰시게요.', 'Keep whatever is left over in the co-op ledger. For the next repair.',
        '…다음 수리. 그 말을 하는 놈이 있으면 2층은 다시 안 무너진다. (장부 맨 뒤에 새 칸을 하나 만든다.)\n\n그동안 무너진 채 둔 건 돈이 없어서만이 아니라 다음을 생각하는 사람이 없어서였다. 이 칸 이름은 네가 붙여라.',
        "...The next repair. As long as someone says that, the second floor won't fall again. (He makes a new column at the very back of the ledger.)\n\nIt was left in ruins not just for lack of money, but because nobody was thinking about next time. You name this column.",
        { affinity: 0.06, flag: 'choice.m7_05_leftover' }),
    ],
    completeReply: {
      hyeonsu_first: [
        '그 애가 그렇다. 말은 안 하고. (계장이 기부자 명부 첫 줄을 보여 준다. 도현수. 둘째 줄이 나.)\n\n표결 때도 먼저 손을 들더니 이번에도 먼저다. 그 애가 먼저 하면 뒤에 하는 사람들이 쉬워진다. 할애비가 손자 칭찬하는 거 아니다. 사실이 그렇다는 거다.',
        "That's the lad. Never says a word. (The chief shows me the first line of the donor roll. Do Hyeonsu. I'm on the second.)\n\nAt the vote he raised his hand first, and he's first again now. When he goes first, it's easier for those who follow. That's not a grandfather praising his grandson. It's simply how it is.",
      ],
      giver: [
        '기억하면 됐다. 2층에 네 이름은 안 붙는다. 계 이름이 붙지. (그게 맞다고 생각했다.)\n\n주는 쪽은 이름을 안 남긴다. 받은 사람들이 기억하지. 네가 실습생일 때 계가 준 것도 이름이 없었다. 그래도 너는 기억하잖아.',
        "Then it's done. Your name won't go on the second floor. The guild's will. (I thought that was right.)\n\nThe one who gives doesn't leave a name. The ones who received remember. What the co-op gave you as a trainee had no name on it either. Yet you remember.",
      ],
    },
  },

  // ── M7-06 「재개관」 · 정옥선 ──
  'M7-06': {
    offer: [
      d('push_chair', '가위는 제가 쥐여 드리겠습니다. 휠체어도 제가 밀겠습니다.', "I'll put the scissors in your hand. I'll push the wheelchair too.",
        '휠체어는 밀어도 되는데 테이프 앞에서는 손 놔. 거기서부터는 내가 간다. (무릎 위 담요를 고쳐 덮는다.)\n\n자르는 건 손이 아니라 마음이 하는 거다. 손이 떨려도 마음이 안 떨리면 잘린다. 너는 옆에서 가위만 잘 쥐여 줘.',
        "You can push the chair, but let go in front of the ribbon. From there I go myself. (She straightens the blanket over her knees.)\n\nIt's the heart that cuts, not the hand. If the heart's steady, it cuts even when the hand shakes. You just put the scissors in my hand properly.",
        { affinity: 0.05 }),
      d('ask_health', '몸은 정말 괜찮으십니까? 식에 나오셔도 됩니까?', 'Are you really all right? Is it okay for you to come to the ceremony?',
        '요양 끝났다. 나가도 된다고 했어. 오래 서 있지만 말래. 그래서 휠체어다. (휠체어 바퀴를 손바닥으로 툭 친다.)\n\n이 식에 안 나가면 그게 더 병이 된다. 걱정은 접어 두고 회나 잘 떠 둬. 상에 올릴 거 세 접시.',
        "My convalescence is done. They said I can go out. Just not stand for long. Hence the chair. (She taps the wheel with her palm.)\n\nMissing this ceremony would make me sicker. Fold up your worrying and slice the sashimi well. Three plates for the table.",
        { affinity: 0.04, flag: 'choice.m7_06_asked_health' }),
      d('will_cry', '할머니가 자르시는 걸 보면 제가 울 것 같습니다.', "I think I'll cry watching you cut it.",
        '…울 거면 회부터 떠 놓고 울어. 세 접시. (말끝이 웃음으로 흐려진다.)\n\n개관식 상이 비면 손님들이 내 탓 한다. 다 떠 놓고, 테이프 잘리는 거 보고, 그다음에 울든 말든. 나는 안 운다. 아마.',
        "...If you're going to cry, slice the sashimi first, then cry. Three plates. (Her words trail off into a laugh.)\n\nIf the opening table's bare, the guests will blame me. Get them all sliced, watch the ribbon go, and then cry or don't. I won't cry. Probably.",
        { affinity: 0.05 }),
      d('hold_together', '손이 떨리시면 제가 같이 잡고 자를까요?', 'If your hand shakes, shall I hold it and cut with you?',
        '됐다. 그건 네가 나중에 네 테이프 자를 때 해라. 이건 내 거다. (가위를 쥐는 시늉을 해 보인다.)\n\n떨리는 손으로 자른 테이프가 더 오래 기억난다. 반듯하게 잘리면 아무도 기억 안 해. 그러니 그냥 쥐여만 줘.',
        "No need. Save that for when you cut your own ribbon someday. This one's mine. (She mimes gripping the scissors.)\n\nA ribbon cut by a shaking hand is remembered longer. Cut it neat and nobody remembers. So just put them in my hand.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('lay_ice', '좌판으로 가실 때 얼음은 제가 먼저 깔아 두겠습니다.', "When you go back to the stall, I'll have the ice laid first.",
        '…그건 원래 네 일이었지. 처음부터. (웃는다. 휠체어 바퀴를 좌판 쪽으로 돌린다.)\n\n좌판 앞은 휠체어 들어갈 만큼만 비워 둬. 앉아서라도 내 좌판은 내가 본다. 얼음은 네가 깔고.',
        "...That was always your job. From the start. (She laughs and turns the wheels toward the stall.)\n\nClear the front of the stall just wide enough for the chair. Even sitting down, I'll mind my own stall. You lay the ice.",
        { affinity: 0.08, harborRep: 1 }),
    ],
    completeReply: {
      scissors: [
        '둘 다 떨렸으면 됐다. (할머니가 휠체어에서 내 손을 잡는다. 오래.)\n\n한 사람만 떨렸으면 테이프가 비뚤게 잘렸을 거다. 둘이 같이 떨리니까 반듯하게 잘렸지. …그런 거다, 사람 일이.',
        "If you both shook, it was right. (From the wheelchair she takes my hand. For a long time.)\n\nIf only one of us had shaken, the ribbon would have been cut crooked. We both shook, so it came out straight. ...That's how it is, with people.",
      ],
      all: [
        '그렇게 말하는 놈이 오래 간다. 처음부터 그랬어. (탁 노인이 뒤에서 고개를 끄덕인다.)\n\n내 것 네 것 따지는 놈은 방을 가두고, 다들 거라는 놈은 방을 연다. 오늘 박수 소리 들었지. 그게 다들 거라는 소리다.',
        "The ones who say that last. You were like that from the start. (Behind me, old Tak nods.)\n\nThose who argue mine and yours lock a room up. Those who say it's everyone's open it. You heard the applause today. That's the sound of everyone's.",
      ],
    },
  },

  // ── M7-07 「마지막 캐스팅」 · 탁새벽 ──
  'M7-07': {
    offer: [
      d('take_rod', '받을게. 네가 이은 마디, 독도에서 꼭 던지마.', "I'll take it. I'll cast the joint you made at Dokdo, I promise.",
        '응. 던질 때 마디 쪽은 보지 마. 보면 겁나서 힘을 빼게 돼. (대를 두 손으로 건넨다.)\n\n이음새는 안 부러져. 내가 백 번은 휘어 봤어. 할아버지 손이 놓은 데부터 내가 깎은 거야. 그러니까 반은 할아버지 거고 반은 내 거야.',
        "Yeah. When you cast, don't look at the joint. If you look, you'll get scared and ease off. (He hands over the rod with both hands.)\n\nThe joint won't break. I've bent it like a hundred times. I carved from where Grandpa's hands stopped. So half of it's Grandpa's and half of it's mine.",
        { affinity: 0.05 }),
      d('ask_grandpa', '할아버지가 손을 놓으셨다고? 무슨 일 있으셨어?', 'Grandpa let go? Did something happen?',
        '그런 거 아니야. 할아버지가 그랬어. 이건 네가 끝내야 하는 대라고. (조금 으쓱한다.)\n\n마지막 마디 앞에서 칼을 나한테 줬어. 그러고는 뒤에 앉아서 보기만 했어. 손을 놓은 게 아니라 나한테 넘긴 거야. 할아버지는 그렇게 말 안 했지만.',
        "It's not like that. Grandpa said so himself. This is a rod you have to finish. (He puffs up a little.)\n\nAt the last joint he gave me the knife. Then he sat behind me and just watched. He didn't let go, he handed it over to me. He didn't say it like that, though.",
        { affinity: 0.04, flag: 'choice.m7_07_asked_grandpa' }),
      d('if_breaks', '아버지 대를 독도에서 던진다니… 부러지면 어떡하지.', "Casting my father's rod at Dokdo... What if it breaks?",
        '안 부러진다니까! …부러지면 내가 또 이으면 돼. (진지한 얼굴이다.)\n\n대는 부러지는 거야. 부러져도 다시 이을 사람이 있으면 그 대는 안 끝난 거야. 그러니까 던져. 세게.',
        "It won't break, I said! ...And if it does, I'll just join it again. (His face is serious.)\n\nRods break. If there's someone to join it again, the rod isn't finished. So cast. Hard.",
        { affinity: 0.04 }),
      d('retire_joke', '마지막이라니, 너 나 은퇴시키려는 거냐?', 'The last one? Are you trying to retire me?',
        '아니! 마지막 캐스팅이라는 거지 마지막 낚시가 아니야. (발을 구른다.)\n\n이 대로 던지는 첫 번째도 되고 독도에서 던지는 마지막도 되고. 둘 다야. 어른들은 왜 마지막 소리만 들어?',
        "No! It's the last cast, not the last fishing. (He stamps his foot.)\n\nIt's the first cast with this rod and the last one at Dokdo. Both. Why do grown-ups only hear the word last?",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('no_species', '종은 안 적을게. 이건 조사가 아니라 낚시니까.', "I won't write down the species. This is fishing, not a survey.",
        '…응. 적지 마. 적으면 숫자가 돼. (아이가 대 끝을 오래 쓰다듬는다.)\n\n나도 대 깎을 때 몇 번째인지 안 세. 세면 하나하나가 덜 소중해지거든. 오늘 올라온 건 그냥 오늘 거야.',
        "...Yeah. Don't write it. Write it and it turns into a number. (The boy strokes the rod tip for a long time.)\n\nI don't count how many rods I've carved either. If you count, each one matters less. What came up today is just today's.",
        { affinity: 0.07, seaRep: 1, flag: 'choice.m7_07_no_species' }),
    ],
    completeReply: {
      ours: [
        '…우리 대. 좋아. (아이가 대에 새벽이라고 작게 새긴다. 그 옆에 내 이름도.)\n\n아저씨 아버지 이름도 새길까? 아니다, 그건 처음부터 들어 있어. 손잡이 흠집. 그게 이름이야. 우리는 그 옆에만 쓰면 돼.',
        "…Our rod. I like that. (The boy carves Saebyeok small into the blank. And my name beside it.)\n\nShould I carve your dad's name too? No, it's been there from the start. The scratches on the grip. That's his name. We only have to write beside it.",
      ],
    },
  },

  // ── M7-08 「실습생」 · 무발주(혼자 하는 일) — 혼잣말 · 괄호 지문 · 플래그만 ──
  'M7-08': {
    offerAdd: [
      d('name_later', '…이름부터 물어볼까. 아니, 그건 나중이다.', '...Should I ask the name first? No, that comes later.',
        '(어촌계에서도 처음엔 아무도 내 이름을 부르지 않았다. 실습생, 저기 실습생. 그래도 나쁜 기억은 아니다.)\n\n(이름은 며칠 얼음을 나르고 나서 물어도 늦지 않다. 그때 물으면 저 애도 대답할 힘이 생겨 있을 것이다.)',
        "(At the co-op, no one called me by name at first either. Trainee, hey, trainee. It isn't a bad memory, though.)\n\n(Asking the name after a few days of carrying ice won't be too late. By then the kid will have the strength to answer.)",
        { flag: 'choice.m7_08_name_later' }),
      d('one_backpack', '그래, 저 배낭. 나도 하나뿐이었지.', 'Right, that backpack. I only had one too.',
        '(배낭 하나에 낚싯대와 쿨러와 미끼통이 매달려 덜렁거리던 날이 있었다. 탁 노인이 짐부터 어떻게 좀 하라고 했던 날.)\n\n(웃음이 난다. 저 애도 곧 누군가에게 그 말을 들을 것이다. 그 전에 내가 할 말은 하나다.)',
        "(There was a day when a rod, a cooler and a bait tub dangled off my one backpack. The day old Tak told me to sort out my load first.)\n\n(I can't help smiling. Soon that kid will hear those words from someone too. Before that, I have just one thing to say.)",
        { flag: 'choice.m7_08_one_backpack' }),
    ],
    offerReply: {
      take_over: [
        '(좌판 뒤 얼음 상자에 손을 얹는다. 차갑다. 22년 전과 같은 온도다.)\n\n(그 말을 처음 들은 날이 떠오른다. 그때는 상자가 무거운 줄 알았다. 이제 보니 무거운 건 그 말을 처음 꺼내는 쪽이었다.)',
        "(I rest a hand on the ice crate behind the stall. It is cold. The same cold as twenty-two years ago.)\n\n(I remember the day I first heard those words. Back then I thought the crate was the heavy part. Now I see the heavy part was being the first to say them.)",
      ],
      hesitate: [
        '(그 애가 고개를 든다. 무슨 말이든 해야 한다.)\n\n(목이 잠긴다. 그날 할머니도 이런 얼굴을 보며 말을 골랐을까. 길게 할 말은 없다. 짧은 말 하나면 된다. 나는 그 말을 안다.)',
        "(The kid looks up. I have to say something.)\n\n(My throat tightens. Did she pick her words like this that day, looking at a face like this? I don't need anything long. One short line will do. I know the line.)",
      ],
    },
    completeAdd: [
      d('carry_together', '…같이 들자. 첫 상자는.', "...Let's carry it together. The first crate, anyway.",
        '(상자 한쪽 손잡이를 잡는다. 그 애가 다른 쪽을 잡는다. 무게가 반으로 나뉜다.)\n\n(할머니는 나에게 이렇게 해 주지 않았다. 그래도 괜찮다. 조행록이 다시 시작될 때마다 조금씩 달라져도 된다고 나는 생각한다.)',
        "(I take one handle of the crate. The kid takes the other. The weight splits in half.)\n\n(She never did this for me. That's all right. Each time the logbook starts again, I think it's allowed to change a little.)",
        { flag: 'choice.m7_08_carried_together' }),
    ],
    completeReply: {
      say_it: [
        '(그 애가 상자를 든다. 허리로. 다리로 들라고 말해 줘야겠다.)\n\n(상자를 내려놓은 그 애가 숨을 고른다. 눈은 아직 젖어 있지만 울지는 않는다. 다음 상자 쪽으로 먼저 걸어간다.)',
        "(The kid lifts the crate. With his back. I'll have to tell him to lift with his legs.)\n\n(Setting the crate down, the kid catches his breath. His eyes are still wet, but he isn't crying. He walks toward the next crate on his own.)",
      ],
      sit: [
        '(그 애가 앉는다. 나는 조행록 첫 장을 편다. 22년 전 사진이 끼워져 있다.)\n\n(어디서부터 말해야 할지 모르겠다. 막차, 영금정, 얼음 상자. 결국 할머니가 나에게 했던 첫마디부터 하기로 한다. 얘기는 길고 밤은 아직 이르다.)',
        "(The kid sits. I open the first page of the logbook. A photo from twenty-two years ago is tucked inside.)\n\n(I don't know where to begin. The last bus, Yeonggeumjeong, the ice crate. In the end I decide to start with the first thing she ever said to me. It's a long story, and the night is still young.)",
      ],
    },
  },
};
