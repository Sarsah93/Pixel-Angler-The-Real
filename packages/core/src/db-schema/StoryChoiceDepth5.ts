/**
 * @file StoryChoiceDepth5.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 5묶음: 서브 아크 N05 ~ N09
 *              (서하린·나기범 · 씨바스터즈 · 짐 강 · 고만석·고해나 · 이수연·한봄).
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 *
 *  - 편 순서는 문맥(`tools/story_choice_context.mjs --batch 5`) 순서다.
 *  - N08-2 `support` · N09-2 `decline`은 원래 응답에 「우호도」(R1 개발 용어)가 있었다 — 원문 지문을 장면으로 고친 뒤(253차) 단락을 이었다.
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { d, dNo } from './StoryChoiceDepthKit.js';

export const CHOICE_DEPTH_5: Record<string, ChoiceDepthEntry> = {
  // ── N05-1 「낚아서 먹고 싶어요」 · 서하린 (once — 미루기 답은 나레이션에 있다) ──
  'N05-1': {
    offerAdd: [
      d('ask_manners', '배 위에서 지키는 매너가 따로 있습니까?', "There are manners you keep on a boat? Like what?",
        '있대요! 저도 어제 처음 들었어요. 근데 제가 설명하면 반은 틀릴 거예요. (휴대폰 메모를 뒤지다가 포기한다.)\n\n기범 오빠한테 직접 물어봐요. 조용한 사람이라 먼저 물어봐야 말해 줘요. 그 대신 한 번 말하면 다 맞아요. 배 시간 늦지 마요!',
        "Apparently! I only heard about it yesterday myself. But if I explain it, I'll get half of it wrong. (She scrolls through her phone notes, then gives up.)\n\nAsk Gibeom yourself. He's quiet, so you have to ask before he'll tell you. But once he does, it's all right. Don't be late for the boat!",
        { affinity: 0.03, flag: 'choice.n05_1_asked_manners' }),
      d('lipstick', '립스틱까지 바르셨네요. 배 위에서 바로 드시게요?', "Lipstick and all. Planning to eat it right there on deck?",
        '티 나요? 첫 선상이잖아요! 낚은 걸 그 자리에서 먹는 게 제 채널이에요. 화면에 예쁘게 나와야죠. (손거울을 꺼내 한 번 더 바른다.)\n\n근데 저 손질은 못 해요. 칼만 잡으면 손이 떨려요. 그러니까 한 마리만 낚아서 그 자리에서 손질해 주세요. 그게 오늘 부탁이에요.',
        "Does it show? It's my first boat trip! Eating what I catch right where I catch it, that's my channel. I have to look nice on screen. (She takes out a compact and puts on another coat.)\n\nBut I can't dress a fish. My hands shake the moment I hold a knife. So catch me just one and clean it right there. That's today's favour.",
        { affinity: 0.02 }),
    ],
    offerReply: {
      go: [
        '좋아요! 멀미약 챙기세요!\n\n배 타기 전에 먹어야 듣는대요. 기범 오빠가 그랬어요. 저는 벌써 먹었어요. (가방 속 약 상자를 흔들어 보인다.) 오늘 목표는 하나예요. 바다에서 낚은 걸 그 자리에서 먹어 보는 거. 같이 가 주니까 든든해요!',
        "Great! Bring seasickness tablets!\n\nThey only work if you take them before you board, Gibeom says. I've already had mine. (She rattles a pill box in her bag.) Today there's just one goal. Eat something caught at sea, right where it's caught. Feels safer with you coming!",
      ],
      decline: [
        '…아. 네. 알겠어요. (카메라를 내리고 다른 사람을 찾는다. 그 배는 그날 떠났다.)\n\n(멀어지는 배 난간에서 서하린이 손을 한 번 흔든다.) 괜찮아요! 싫은 건 싫은 거니까요! 첫 선상은 한 번뿐이라 같이 가고 싶었는데… 다른 분이랑 잘 다녀올게요!',
        "…Oh. Right. Understood. (She lowers the camera and looks for someone else. That boat sailed that day.)\n\n(From the rail of the departing boat, Seo Harin waves once.) It's fine! If you'd rather not, that's that! A first boat trip only happens once, so I wanted you there… I'll go with someone else. Take care!",
      ],
    },
    completeAdd: [
      d('counted_jumps', '세 번이 아니라 네 번 뛰셨습니다. 제가 셌습니다.', "Not three times. Four. I counted.",
        '…네 번이요? 아니에요, 세 번… (손가락을 꼽다가 멈춘다.) 아, 고기 올라올 때 한 번 더 뛰었구나. 맞네요, 네 번.\n\n기범 오빠한테는 비밀이에요. 오빠는 세 번까지만 봤을 거예요. 다음 선상에선 한 번도 안 뛸게요. 진짜로요. 그때도 세어 줘요.',
        "…Four? No, it was three… (She counts on her fingers and stops.) Oh, I jumped again when the fish came up. You're right. Four.\n\nDon't tell Gibeom. He'll only have seen three. Next boat trip I won't jump once. Really. Count for me then too.",
        { affinity: 0.06, flag: 'choice.n05_1_counted_jumps' }),
      d('thank_gibeom', '기범 씨한테 직접 고맙다고 하고 오겠습니다.', "I'll go and thank Gibeom myself.",
        '직접요? 좋아요! 근데 오빠는 고맙다는 말 들으면 숨어요. (선실 쪽을 가리킨다. 나기범이 벌써 등을 돌리고 있다. 귀 끝이 조금 붉다.)\n\n그래도 들었을 거예요. 귀는 밝거든요. 오빠는 말 대신 채비로 갚아요. 다음에 그쪽 채비가 엉키면, 오빠가 제일 먼저 와 있을 거예요.',
        "Yourself? Good! But when someone thanks him, he hides. (She points at the cabin. Na Gibeom has already turned his back. The tips of his ears are a little red.)\n\nHe'll have heard, though. His ears are sharp. He pays people back with rigs, not words. Next time yours tangles, he'll be the first one there.",
        { affinity: 0.02, affinityOther: [{ npcId: 'na_gibeom', delta: 0.08 }], flag: 'choice.n05_1_thanked_gibeom' }),
    ],
    completeReply: {
      lesson: [
        '오빠! 이분 제자 하래요! (나기범이 말없이 고개를 끄덕인다. 채비 정리가 손에 익는다.)\n\n봤죠? 끄덕였어요. 오빠는 좋으면 말 대신 고개를 끄덕여요. 오늘 저한테는 한 번도 안 했는데! (조금 억울한 얼굴이다.) 엉킨 채비는 배 위에서 풀지 말고 통째로 바꾸래요. 배 시간은 아깝대요.',
        "Oppa! He wants to be your apprentice! (Na Gibeom nods without a word. Rig-keeping settles into my hands.)\n\nSee? He nodded. When he likes something he nods instead of talking. He didn't nod at me once today! (She looks a little wronged.) If a rig tangles on the boat, don't untangle it, swap the whole thing, he says. Boat time is too precious.",
      ],
      pay: [
        '있어요! 조회수 100당 100원… 아, 지금은 제가 낼게요. (지갑을 꺼낸다.)\n\n사실 채널로는 아직 한 푼도 못 벌어요. 구독자가 모자라서요. 그래도 같이 고생했으면 나눠야죠. 그게 맞는 것 같아요.',
        "There is! A hundred won per hundred views… ah, I'll cover it myself for now. (She takes out her purse.)\n\nHonestly, the channel hasn't earned a single won yet. Not enough subscribers. But if we went through it together, we should share. That seems right.",
      ],
      decline: [
        '진짜요? 다음에도 태워 드릴게요! (구독자 셋 중 하나가 나다.)\n\n아, 제가 태워 드리는 건 아니구나. 배는 선장님 거죠. 그럼 다음에도 같이 타요! 그때는 저도 안 뛸게요. 아마도요.',
        "Really? I'll take you out again! (One in three of her subscribers is me.)\n\nAh, it's not mine to take you out on, is it. The boat's the skipper's. Then let's ride together again! I won't run next time. Probably.",
      ],
    },
  },

  // ── N05-2 「조회수」 · 서하린 ──
  'N05-2': {
    offer: [
      d('rules_first', '사과는 됐습니다. 대신 찍는 규칙부터 정합시다.', "Skip the apology. Let's set some rules for filming instead.",
        '규칙이요? …네. 그게 맞는 것 같아요. 사과는 제 마음 편하자고 하는 거고, 규칙은 다음 사람을 위한 거니까요. (수첩을 꺼낸다. 첫 장이 비어 있다.)\n\n뭐부터 정할지는 낚으면서 생각해요. 카메라는 꺼 두고요. 전갱이 두 마리 올릴 동안 저도 생각해 올게요.',
        "Rules? …Yes. I think that's right. An apology is for my own peace of mind, and rules are for the next person. (She takes out a notebook. The first page is blank.)\n\nWe can work out what goes first while we fish. Camera off. I'll think it over while we bring up two horse mackerel.",
        { affinity: 0.06, flag: 'choice.n05_2_rules_first' }),
      d('ask_comments', '논란이라니, 사람들이 뭐라고 했는데요?', "An argument? What were people saying?",
        '댓글이요. 이 사람한테 동의는 받았냐고. 얼굴이 다 나왔다고. 저는 그냥… 재밌는 장면이라 넣었어요. 생각을 못 했어요. (휴대폰을 뒤집어 놓는다.)\n\n제가 잘못한 거 맞아요. 댓글이 다 맞는 말이라 더 아팠어요. 오늘은 카메라 없이 가요. 전갱이 두 마리 낚는 동안, 제가 뭘 해야 하는지 알려 주세요.',
        "The comments. Asking if I'd got your permission. Saying your whole face was in it. I just… put it in because it was a fun moment. I didn't think. (She lays her phone face down.)\n\nI was in the wrong. It hurt more because every comment was right. No camera today. While we catch two horse mackerel, tell me what I should do.",
        { affinity: 0.03, flag: 'choice.n05_2_asked_comments' }),
      d('upset', '솔직히 말하면, 동의 없이 찍힌 건 불쾌했습니다.', "To be honest, being filmed without my say-so didn't sit well.",
        '…네. 그러실 거예요. 변명 안 할게요. (고개를 숙인다. 이번엔 화면에 어떻게 나올지 생각하지 않는 숙임이다.)\n\n오늘 하루로 다 풀리진 않겠죠. 그래도 나와 주셨잖아요. 카메라는 끄고, 전갱이 두 마리. 그거라도 같이 해요.',
        "…Yes. You would be. I won't make excuses. (She bows her head. This time it isn't a bow made for the camera.)\n\nOne day won't fix it all. But you came anyway. Camera off, two horse mackerel. Let's at least do that together.",
        { affinity: -0.02, flag: 'choice.n05_2_said_upset' }),
      dNo('오늘은 낚시할 기분이 아닙니다. 다음에 얘기합시다.', "I'm not in the mood to fish today. Let's talk another time.",
        '…네. 그럴 수 있죠. 마음 내킬 때 말해 주세요. (카메라 가방 지퍼를 끝까지 잠근다.)\n\n그때도 카메라는 꺼 둘게요. 그건 약속해요. 사과는 오늘 한 걸로 하고, 낚시는 그쪽이 괜찮을 때 해요.',
        "…Yes. That's fair. Tell me when you feel up to it. (She zips the camera bag all the way shut.)\n\nThe camera stays off then too. I promise that much. Let today's apology stand, and we'll fish when you're ready.",
        -0.02),
    ],
    completeAdd: [
      d('half_fee', '사용료는 반만 받겠습니다. 나머지는 동의서 만드는 데 쓰십시오.', "I'll take half the fee. Put the rest toward the consent forms.",
        '반이요? …그럼 반은 동의서 종이값으로 쓸게요. 진짜로요. (봉투에서 반을 덜어 내 건넨다.)\n\n첫 서명이 그쪽인데, 종이값까지 그쪽 돈이네요. 이 동의서는 오래 쓸게요. 찢어질 때까지요. 그다음 건 제 돈으로 만들고요.',
        "Half? …Then half goes on paper for the forms. Really. (She takes half out of the envelope and hands it over.)\n\nYours is the first signature, and now the paper's on you too. I'll use this form a long time. Until it tears. The next one I'll pay for myself.",
        { payMult: 0.5, affinity: 0.04, flag: 'choice.n05_2_half_fee' }),
    ],
    completeReply: {
      rule: [
        '네. 약속. (동의서 첫 줄에 내 이름을 쓴다. 그 뒤로 하린의 영상에서 사람들이 편해졌다.)\n\n동의서는 세 줄이에요. 찍어도 되는지, 얼굴이 나와도 되는지, 내려 달라고 하면 내리는지. 마지막 줄은 그쪽 덕분에 넣었어요. 싫다고 하면 언제든 내릴게요.',
        "Yes. Promise. (She writes my name on the first line of the consent form. After that, people are easier in Harin's videos.)\n\nThe form has three lines. Can I film you, can your face be shown, and will I take it down if you ask. The last line is there because of you. Say the word and it comes down, any time.",
      ],
      pay: [
        '아… 네. 맞아요. 그게 규칙이죠. (통장에서 이체한다. 표정이 조금 굳는다.)\n\n…아니에요, 굳은 거 아니에요. 맞는 말이니까요. 얼굴은 그 사람 거잖아요. 쓰려면 값을 내야죠. 다음부터는 찍기 전에 그 얘기부터 할게요.',
        "Ah… right. Yes. That's the rule. (She transfers it from her account. Her face stiffens a little.)\n\n…No, I'm not upset. You're right. A face belongs to the person. If I use it, I pay for it. From now on I'll bring that up before I film.",
      ],
      lesson: [
        '…진짜요? 그럼 저도 가르쳐요, 처음이지만! (액션이 손에 붙는다.)\n\n밤 루어는 천천히 감는 게 다예요. 전갱이는 불빛 아래 떠 있다가 느린 걸 물어요. 카메라를 켜면 저도 모르게 빨리 감아요. 보여 주고 싶어서요. 그게 문제였나 봐요.',
        "…Really? Then I'll teach it. First time, though! (The action settles into my hands.)\n\nNight lures are all about winding slowly. Horse mackerel hang under the lights and take what moves slow. With the camera on I wind fast without meaning to. Because I want to show off. Maybe that was the problem.",
      ],
    },
  },

  // ── N05-3 「퇴사합니다」 · 나기범 ──
  'N05-3': {
    offer: [
      d('listen_first', '뭐라고 할지는 다 듣고 나서 하자. 오징어 하면서.', "I'll say my piece after I've heard all of it. Over some squid.",
        '…네. 그게 좋아요. 말은 제가 잘 못하니까, 던지면서 할게요. (에기 두 개를 꺼내 하나를 내민다.)\n\n무늬오징어 두 마리만 나란히 올려요. 그동안 다 말할게요. 다 듣고 나서, 형 생각 말해 줘요.',
        "…Okay. That's better. I'm not good with words, so I'll talk while we cast. (He takes out two egi and holds one out.)\n\nLet's bring up two bigfin squid side by side. I'll tell you all of it while we do. When you've heard it, tell me what you think.",
        { affinity: 0.06, flag: 'choice.n05_3_listened_first' }),
      d('ask_harin', '하린이는 왜 아무 말도 안 하는 건데?', "Why isn't Harin saying anything?",
        '…모르겠어요. 말리면 제가 안 들을 걸 알고, 도우면 제가 미안해할 걸 알아서요. 아마. (에기를 만지작거린다.)\n\n하린이는 원래 말이 많아요. 근데 이번엔 조용해요. 그게 더 무서워요. 그래서 형한테 묻는 거예요. 오징어 낚으면서 들어 줘요.',
        "…I don't know. She knows I won't listen if she stops me, and that I'll feel bad if she helps. Probably. (He fiddles with the egi.)\n\nShe usually talks a lot. This time she's quiet. That's scarier. So I'm asking you. Hear me out while we catch some squid.",
        { affinity: 0.03, flag: 'choice.n05_3_asked_harin' }),
      d('ask_plan', '회사는 정리했고? 가게는 어떻게 하려고.', "Have you sorted things at work? What about the shop?",
        '회사엔 벌써 말했어요. 가게는 계속해요. 손님은 없어도 칼은 안 놔요. (말이 평소보다 빠르다. 여러 번 연습한 말이다.)\n\n계산도 해 봤어요. 모자라요. 그래도 해요. 자세한 건 낚으면서 말할게요. 무늬오징어 두 마리, 나란히요.',
        "I've already told them at work. The shop stays open. No customers, but I'm not putting the knife down. (He talks faster than usual. He's practised this.)\n\nI've done the sums. It doesn't add up. I'm doing it anyway. I'll tell you the rest while we fish. Two bigfin squid, side by side.",
        { affinity: 0.02, flag: 'choice.n05_3_asked_plan' }),
      d('celebrate', '퇴사 기념 낚시냐? 그럼 오징어는 내가 먼저 잡는다.', "A resignation fishing trip, is it? Then I'm landing the first squid.",
        '…기념이요? (입꼬리가 조금 올라간다.) 그렇게 말해 준 사람은 형이 처음이에요.\n\n먼저 잡아요. 저는 오늘 손이 좀 무거워요. 두 마리 나란히 올리면서 얘기해요. 축하는 그다음에 해 줘요.',
        "…A celebration? (The corner of his mouth lifts a little.) You're the first person who's put it that way.\n\nGo ahead and catch first. My hands are a bit heavy today. We'll talk while we bring up two side by side. Celebrate after that.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('sell_squid', '오징어 두 마리 값은 받을게. 가게 물건으로 써.', "I'll take the price of those two squid. Use them as stock for the shop.",
        '…네. 가게 첫 물건이에요. 형이 낚은 거. (봉투를 내민다. 회사 이름이 찍힌 봉투다.)\n\n값은 제대로 쳐 줄게요. 이제 저도 장사하는 사람이니까요. 손님 오면 이 오징어부터 낼게요. 형이 낚은 거라고 말하면서요.',
        "…Okay. My shop's first stock. Squid you caught. (He holds out an envelope. It has his company's name printed on it.)\n\nI'll pay a proper price. I'm a shopkeeper now. When a customer comes, this squid goes out first. And I'll tell them you caught it.",
        { payMult: 0.9, affinity: 0.02, flag: 'choice.n05_3_sold_squid' }),
    ],
    completeReply: {
      support: [
        '…형. (하린이 그 말을 듣고 카메라를 다시 들었다. 이번엔 기범을 찍기 위해.)\n\n…하린이 카메라가 이쪽을 보네요. 저는 늘 등 돌리고 있었는데. (이번엔 돌아앉지 않는다.) 형이 그렇게 말해 줘서요. 낚시로 살 수 있다고. 그 말 오래 갖고 있을게요. 칼 쥘 때마다요.',
        "…Hyeong. (Harin heard it and picked the camera up again. To film Gibeom this time.)\n\n…Her camera's pointing this way. I always kept my back to it. (This time he doesn't turn away.) Because you said it. That I can live off fishing. I'll keep those words a long time. Every time I pick up the knife.",
      ],
      caution: [
        '…생각했어요. 천 번. (그래도 웃는다. 말려 준 사람이 있어서.)\n\n말려 주는 사람이 있으니까 오히려 알겠어요. 제가 이걸 얼마나 하고 싶은지. 천한 번째로 생각해도 답은 같아요. …그래도 고마워요. 말려 줘서.',
        "…I have thought. A thousand times. (He smiles anyway. Because somebody tried to stop him.)\n\nWith someone trying to stop me, I can tell how much I want this. Think it a thousand and one times, the answer's the same. …Thanks, though. For trying.",
      ],
      lesson: [
        '…네. 이건 퇴사 기념. (회 뜨는 각도가 한 번 더 달라진다.)\n\n무늬오징어는 껍질부터 벗겨요. 지느러미 쪽을 잡고 한 번에요. 끊기면 처음부터 다시 해야 돼요. 회사에서는 이런 거 아무도 안 물어봤어요. 형은 물어보네요.',
        "…Sure. Call it a resignation special. (The angle of my slicing changes once more.)\n\nWith bigfin squid you peel the skin first. Grip it at the fin end and do it in one pull. If it tears, you start over. Nobody at the company ever asked me about this. You do.",
      ],
    },
  },

  // ── N05-4 「두 번째 겨울」 · 서하린 ──
  'N05-4': {
    offer: [
      d('night_pier', '연안부두라면 가야죠. 우럭은 밤에 잘 무니까요.', "The coastal pier? I'm there. Rockfish bite best at night.",
        '역시! 밤이에요. 연안부두는 밤 불빛이 예뻐요. 찍고 싶은데… 오늘은 참을게요. (휴대폰을 주머니 깊이 넣는다.)\n\n카메라 없이 만나자고 한 건 저니까, 제가 지켜야죠. 우럭 한 마리, 천천히 올려요. 할 얘기도 있어요.',
        "Knew it! Night it is. The lights at the coastal pier are pretty at night. I'd love to film them… but I'll hold off today. (She pushes her phone deep into her pocket.)\n\nI'm the one who said no camera, so I'd better keep to it. One rockfish, nice and slow. I've got something to tell you, too.",
        { affinity: 0.05 }),
      d('ask_transfer', '발령이라니요. 회사 일로 인천까지 오신 겁니까?', "Transferred? You came all the way to Incheon for work?",
        '네, 회사 일이요. 재미없는 일이에요. 유튜브만 하는 줄 알았죠? (웃는다.) 영상은 퇴근하고 찍었어요.\n\n인천엔 아는 사람이 없어요. 그래서 부른 거예요. 카메라 없이, 그냥 아는 얼굴이 보고 싶어서요. 우럭 한 마리만 같이 올려요.',
        "Yes, for work. Boring work. You thought all I did was YouTube, didn't you? (She laughs.) I filmed after I clocked off.\n\nI don't know anyone in Incheon. That's why I called you. No camera, I just wanted to see a face I know. Let's bring up one rockfish together.",
        { affinity: 0.03, flag: 'choice.n05_4_asked_transfer' }),
      d('ask_camera', '카메라 없이요? 하린 씨가요?', "No camera? You, of all people?",
        '저도 신기해요. (어깨를 으쓱한다.) 근데 전갱이 잡던 밤 기억나요? 카메라 꺼 두니까 이상하게 잘 됐잖아요. 그날부터 생각했어요.\n\n오늘은 진짜 그냥 낚시예요. 채널은 내일도 있으니까요. 우럭 한 마리. 밤이에요. 늦지 마요.',
        "Surprises me too. (She shrugs.) But remember the night we caught horse mackerel? With the camera off it went weirdly well. I've been thinking about it since.\n\nToday really is just fishing. The channel will still be there tomorrow. One rockfish. It's at night. Don't be late.",
        { affinity: 0.03, flag: 'choice.n05_4_asked_camera' }),
      d('cold_night', '겨울밤 부두라니, 우럭이 정말 물기는 합니까?', "A pier on a winter night? Will a rockfish really bite?",
        '물어요! 겨울 우럭은 바닥에 붙어 있대요. 천천히 끌면 와요. (패딩 지퍼를 턱까지 올린다.)\n\n춥긴 해요. 그러니까 오래 안 있을 거예요. 우럭 한 마리 올리면 바로 따뜻한 데 가요. 그 대신 한 마리는 꼭이에요.',
        "They do! In winter rockfish hug the bottom, apparently. Drag it slowly and they come. (She zips her padded jacket up to her chin.)\n\nIt is cold. So we won't stay long. One rockfish and we go somewhere warm. But that one's a must.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('ask_her', '하린 씨는요? 인천 생활은 괜찮습니까?', "And you? Are you getting on all right in Incheon?",
        '…괜찮아요. 아니, 아직 잘 모르겠어요. 아는 사람이 없어서 밤에 부두에 자주 나와요. (멀리 배 불빛을 본다.)\n\n오늘은 덜 외로웠어요. 그쪽이 와서요. 그거면 된 거죠. 두 번째 겨울은요.',
        "…I'm fine. No, I don't really know yet. I don't know anyone, so I come out to the pier a lot at night. (She looks at the lights of a far-off boat.)\n\nToday was less lonely. Because you came. That's enough, isn't it. For a second winter.",
        { affinity: 0.08, flag: 'choice.n05_4_asked_her' }),
    ],
    completeReply: {
      glad: [
        '…그 말 오빠한테 전할게요. (가게 사진 한 장을 보여 준다. 카운터에 손님 셋.)\n\n진짜라서. 그 말 좋네요. 저 그 영상 올릴 때 엄청 고민했어요. 너무 재미없어서요. 오빠가 생선만 다듬다 끝나요. 근데 그걸 보고 왔대요. 손님이.',
        "…I'll pass that on to him. (She shows me a photo of the shop. Three customers at the counter.)\n\nBecause it was real. I like that. I agonised over posting that video. It was so dull. It's just him dressing fish until it ends. And that's what brought them in. Customers.",
      ],
      lesson: [
        '저도 두 번째 겨울이니까요. (야간 채비가 정돈된다.)\n\n처음엔 화면에 예쁜 색만 골랐어요. 이제는 어두운 색이요. 밤 우럭은 윤곽을 보고 문대요. 바닥을 천천히 긁어요. 그게 다예요.',
        "It's my second winter, after all. (My night rig gets tidied up.)\n\nAt first I only picked colours that looked pretty on screen. Now it's dark ones. At night rockfish bite at the outline, they say. Scrape the bottom slowly. That's all there is.",
      ],
      pay: [
        '없었죠! 그래도 드릴게요. 인천 발령 축하금! (자기 축하금을 나눈다.)\n\n받은 축하금을 나누는 거라 좀 이상하죠. 그래도 인천 와서 처음 본 아는 얼굴이 그쪽이에요. 아는 얼굴한테 쓰는 돈이 제일 안 아까워요.',
        "There wasn't! I'll pay you anyway. Congratulations on the Incheon posting! (She splits her own congratulation money.)\n\nSplitting money people gave me to celebrate is a bit odd, I know. But you're the first familiar face I've seen since coming to Incheon. Money spent on a familiar face never feels wasted.",
      ],
    },
  },

  // ── N05-5 「손님 두 명」 · 나기범 (받는 말은 하린 목소리 — 응답은 기범 · 하린은 지문으로) ──
  'N05-5': {
    offer: [
      d('sign_up', '첫 예약 손님이 너희라니. 명부에 이름부터 써.', "My first booking is you two. Names on the passenger list first.",
        '…네. 쓸게요. 하린이가 먼저 쓴대요. (하린이 펜을 뺏어 들고 크게 쓴다. 나기범은 그 아래에 작게 쓴다.)\n\n신분증도 챙겨 왔어요. 배 타려면 필요하잖아요. 형 배니까 더 제대로 하고 싶었어요. 이제 나가요, 바다.',
        "…Okay. We'll sign. Harin wants to go first. (Harin snatches the pen and writes big. Na Gibeom writes small underneath.)\n\nWe brought ID too. You need it to board. It's your boat, so we wanted to do it properly. Let's go out. To sea.",
        { affinity: 0.06 }),
      d('offer_free', '친구한테 돈 받기는 좀 그렇다. 이번엔 그냥 타.', "Taking money from friends feels wrong. Ride free this time.",
        '…안 돼요. 그럼 저희가 손님이 아니잖아요. (하린이 옆에서 고개를 세게 젓는다.)\n\n공짜로 태우면 형 배가 그냥 친구 배가 돼요. 저희는 선장님 배를 타고 싶어요. 정가 받아요. 그래야 다음에도 예약하죠.',
        "…No. Then we're not customers. (Beside him, Harin shakes her head hard.)\n\nIf you take us for free, your boat's just a friend's boat. We want to ride a skipper's boat. Charge the list price. That's how we get to book again.",
        { affinity: 0.02, flag: 'choice.n05_5_offered_free' }),
      d('ask_camera', '카메라는 물어본다고? 뭘 물어볼 건데?', "You'll ask about the camera? Ask what?",
        '…하린이가 질문을 적어 왔어요. 찍어도 되는지, 얼굴이 나와도 되는지, 다른 손님이 있으면 그분들한테도요. (하린이 수첩을 펼쳐 보인다. 동의서 묶음이다.)\n\n그 동의서, 첫 서명이 형이었잖아요. 이번엔 형 배에서 저희가 받아요. 출항 전에 다 받을게요.',
        "…Harin wrote her questions down. Whether she can film, whether faces can show, and the same for any other guests. (Harin opens a notebook. It's a stack of consent forms.)\n\nYours was the first signature on that form, remember. This time we collect them on your boat. We'll have them all before we cast off.",
        { affinity: 0.04, flag: 'choice.n05_5_asked_camera' }),
      d('no_jumping', '하린이 이번엔 배 위에서 안 뛰겠지?', "Harin's not going to run on deck this time, right?",
        '…세 번 뛴 거 기억하시네요. (하린이 얼굴을 가린다.) 이번엔 제가 옆에 붙어 있을게요.\n\n선상 매너는 그때 다 배웠어요. 형도요. 오늘은 형이 선장이니까 형 말 들을게요. 그게 셋째 매너였잖아요. 출항해요.',
        "…You remember her running three times. (Harin hides her face.) I'll stick right beside her this time.\n\nWe all learned boat manners that day. You too. Today you're the skipper, so we listen to you. That was the third rule, remember. Let's cast off.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('rate_me', '손님으로 타 보니 어땠어? 배 모는 거, 거친 데 말해 줘.', "How was it as a guest? Tell me where my handling was rough.",
        '…거친 데는 없었어요. 하나만요. 회 뜰 때 뱃머리를 바람 쪽으로 세워 주면 더 좋아요. 흔들림이 앞뒤로만 와요. (손으로 뱃머리 방향을 그려 보인다. 배를 세우는 감이 잡힌다.)\n\n손님이 칼 쓸 때 배가 옆으로 구르면 무서워요. 형은 손님한테 그걸 물어보는 선장이네요. 좋은 선장이에요.',
        "…Nothing was rough. Just one thing. When someone's slicing, put the bow into the wind. Then she only pitches fore and aft. (He traces the line of the bow with his hand. I get a feel for holding the boat.)\n\nIf the boat rolls sideways while a guest has a knife out, it's frightening. You're a skipper who asks guests about that. A good one.",
        { proficiency: { category: 'driving', xp: 30 }, affinity: 0.04 }),
    ],
    completeReply: {
      full: [
        '그게 맞아요. (두 사람이 후기 첫 줄을 쓴다. 별 다섯.)\n\n…처음 배 탔던 날 기억나요. 하린이랑 형이랑 저. 그때는 다른 분이 선장이었죠. 이제는 형이에요. 그래서 정가 내고 싶었어요. 선장한테는 정가를 내는 거니까요.',
        "That's right. (The two of them write the first review. Five stars.)\n\n…I remember the first time we went out. Harin, you and me. Someone else was the skipper back then. Now it's you. That's why we wanted to pay full price. You pay a skipper full price.",
      ],
      lesson: [
        '배 위 회는 각도가 달라요. 파도에 맞춰요. (선상 손질이 몸에 붙는다.)\n\n배가 내려앉을 때 칼을 당기고, 올라올 때는 쉬어요. 거꾸로 하면 손을 베요. 그리고 형 배는 흔들림이 순해요. 칼 쓰기 좋은 배예요. 선장이 그렇게 몰아서요.',
        "Cutting afloat takes a different angle. You match the swell. (Shipboard butchery settles into my body.)\n\nPull the knife as the boat settles, rest as she rises. Do it the other way round and you cut your hand. And your boat rolls gently. She's a good boat for a knife. Because of how her skipper handles her.",
      ],
      pay: [
        '팁! 당연하죠! (하린이 봉투에 팁을 더 넣는다. 첫 손님이니까.)\n\n(나기범이 봉투를 한 번 더 확인하고 고개를 끄덕인다.) 정가에 팁. 맞아요. 회가 맛있으면 팁을 주는 거래요, 하린이 말로는. 오늘 회는 제가 떴지만요. …그래도 배가 좋았으니까요.',
        "A tip! Of course! (Harin adds a tip to the envelope. First customers, after all.)\n\n(Na Gibeom checks the envelope once more and nods.) Full rate and a tip. Right. You tip when the sashimi's good, Harin says. I cut today's sashimi myself, but… the boat was good, so.",
      ],
    },
  },

  // ── N06-1 「농구부인 줄 알았는데」 · 고호수 ──
  'N06-1': {
    offer: [
      d('why_stay', '농구부가 아닌 걸 알았는데 왜 안 나왔어?', "You found out it wasn't basketball. Why didn't you quit?",
        '그게… 선배들이 이상하게 좋아요. 그리고 미노우라는 거 봤는데, 물고기처럼 헤엄쳐요. 진짜로요. (농구공을 옆구리에 낀 채 미노우를 꺼내 보인다.)\n\n그래서 한 마리만 잡아 보고 정하려고요. 농어요. 형이 같이 잡아 주면, 계속할지 말지 알 것 같아요.',
        "Well… the seniors are weirdly great. And I saw this thing called a minnow, and it swims like a real fish. Honestly. (With the basketball tucked under his arm, he pulls out a minnow to show me.)\n\nSo I want to catch just one and then decide. A sea bass. If you catch one with me, I think I'll know whether to keep going.",
        { affinity: 0.04, flag: 'choice.n06_1_asked_why_stay' }),
      d('bigger_than_ball', '농어는 말이야, 그 농구공보다 클 수도 있어.', "A sea bass, you know, can be bigger than that basketball.",
        '진짜요? 이 공보다요? (공을 두 손으로 들어 크기를 가늠해 본다.)\n\n그럼 이 공 계속 들고 다녀야겠네요. 잡으면 대 보게요. 선배가 미노우를 수면에서 긋는 거래요. 형, 긋는 게 뭔지도 가르쳐 주세요.',
        "Really? Bigger than this? (He holds the ball up in both hands, sizing it.)\n\nThen I'd better keep carrying it. So I can hold it up against one. A senior said you cut the minnow across the surface. Show me what cutting means too, hyeong.",
        { affinity: 0.03 }),
      d('first_bass', '좋아, 같이 잡자. 첫 농어는 오래 기억에 남는다.', "All right, let's catch one. You remember your first sea bass a long time.",
        '오래요? 형도 기억나요? 형 첫 농어요. (눈이 반짝인다.)\n\n…아, 지금 말 안 해 줘도 돼요. 제가 잡고 나서 들을래요. 그래야 비교하죠. 가요, 방파제로!',
        "A long time? Do you remember yours? Your first sea bass? (His eyes light up.)\n\n…Ah, you don't have to tell me now. I'll hear it after I've caught mine. So I can compare. Let's go, to the breakwater!",
        { affinity: 0.05 }),
      d('leave_ball', '농구공은 두고 가자. 방파제에서 굴러가면 못 찾아.', "Leave the basketball. If it rolls off the breakwater, it's gone.",
        '안 돼요! 이거 있어야 마음이 편해요. (공을 꼭 껴안는다.)\n\n안 굴리게 조심할게요. 가방 끈으로 묶어 둘게요. 그럼 됐죠? 농어 잡으러 가요, 형. 공은 구경만 할 거예요.',
        "No way! I feel better with it. (He hugs the ball tight.)\n\nI'll be careful it doesn't roll. I'll tie it down with my bag strap. Okay? Let's go catch a sea bass, hyeong. The ball's just watching.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('ball_record', '그 농구공에 오늘 잡은 농어 길이를 적어 둬.', "Write today's sea bass length on that basketball.",
        '길이요? …좋아요! 매직 있어요? (공에 날짜와 길이를 꾹꾹 눌러 적는다.)\n\n이제 이 공 못 버리겠네요. 계속 들고 다닐래요. 농구부인 줄 알고 왔다가 농어 잡은 날이 여기 적혀 있으니까요. 다음 농어는 그 밑에 적을래요.',
        "The length? …Yes! Got a marker? (He presses the date and the length onto the ball, hard.)\n\nNow I can never throw this ball away. I'll keep carrying it. The day I came for basketball and caught a sea bass is written right here. The next one goes underneath.",
        { affinity: 0.06, flag: 'choice.n06_1_ball_record' }),
    ],
    completeReply: {
      lesson: [
        '형이 저한테요? 네! (초보의 눈으로 다시 본 루어 액션이 새롭다.)\n\n저는 그냥 신기해서 보는 거예요. 선배들 손목이 다 달라요. 누구는 짧게 툭툭, 누구는 길게 쭉. 근데 다 물어요. 그게 제일 신기해요.',
        "You? From me? Yes! (Lure action looks new again through a beginner's eyes.)\n\nI only watch because it's all so strange. Every senior's wrist is different. One goes short, tap tap. Another goes long and smooth. And they all get bites. That's the strangest part.",
      ],
      pay: [
        '있어요! 회비… 라면 살 돈이지만요. (동전을 모아 준다.)\n\n원래 이거 오늘 저녁 동아리방 라면 값이에요. 근데 형이 농어 잡게 해 줬으니까요. 오늘은 라면 대신 농어 먹으면 돼요. 선배들이 회 뜰 줄 안대요.',
        "There is! Dues… enough for ramyeon, anyway. (He gathers up coins for me.)\n\nThis was supposed to be tonight's ramyeon money in the club room. But you got me a sea bass. So tonight we eat sea bass instead. The seniors say they can slice it.",
      ],
      decline: [
        '형… 형은 이제 우리 동아리 명예 회원이에요! (해양대 앞에서 인사받는 어른이 됐다.)\n\n명예 회원이 뭔지는 저도 몰라요. 방금 제가 만들었어요. 선배들한테 말하면 아마 된다고 할 거예요. 다들 형 좋아해요. 농어 잡게 해 준 사람이니까요.',
        "Hyeong… you're an honorary member of our club now! (I've become an adult people greet outside the maritime college.)\n\nI don't actually know what an honorary member is. I just made it up. If I tell the seniors they'll probably say yes. Everyone likes you. You're the one who got me a sea bass.",
      ],
    },
  },

  // ── N06-2 「불순한 동기」 · 모태조 ──
  'N06-2': {
    offer: [
      d('ask_haneul', '하늘 씨가 누구고, 왜 진지하지 않다는 겁니까?', "Who's Haneul, and why isn't he serious?",
        '백하늘. 신입. 알바생한테 반해서 들어왔어. 어디 알바생인지는 묻지 마. 나도 들었다가 후회했어. (어이없다는 듯 웃는다.)\n\n동기는 상관없어. 불순해도 동기야. 근데 던질 때까지 딴생각하면 안 되지. 그래서 실측이야. 같이 던져.',
        "Baek Haneul. New guy. Joined because he fell for someone working a part-time job. Don't ask where. I asked and regretted it. (He laughs like he can't believe it.)\n\nThe reason doesn't matter. An impure motive's still a motive. But you can't be off in your head while you cast. Hence measurement. Cast with us.",
        { affinity: 0.03, flag: 'choice.n06_2_asked_haneul' }),
      d('ask_measure', '실측이라니, 뭘 어떻게 잰다는 겁니까?', "Measurement? Measure what, and how?",
        '조류, 수심, 탁도. 세 개. 물이 빠르면 무거운 거, 깊으면 가라앉는 거, 탁하면 눈에 띄는 거. (손가락 세 개를 편다.)\n\n말로 하면 안 믿어. 직접 바꿔서 잡아 봐야 믿지. 그래서 세 마리야. 세 가지 물에서. 가자.',
        "Current, depth, turbidity. Three things. Fast water, something heavy. Deep water, something that sinks. Dirty water, something loud. (He holds up three fingers.)\n\nTell people and they don't believe it. They believe it once they switch and catch. That's why it's three fish. In three kinds of water. Let's go.",
        { affinity: 0.04, flag: 'choice.n06_2_asked_measure' }),
      d('uneasy', '남의 연애사에 끼는 것 같아서 좀 그렇습니다.', "Feels like I'm sticking my nose in someone's love life.",
        '연애? 그건 하늘이 사정이고. 나는 낚시만 봐. (눈빛이 진지하다. 진지해서 좀 무섭다.)\n\n동기가 뭐든 물가에 나왔으면 앵글러야. 앵글러면 제대로 해야지. 네가 옆에서 던지면 하늘이도 따라 해. 세 마리. 실측.',
        "Love life? That's Haneul's business. I only look at the fishing. (His eyes are serious. Serious enough to be a bit scary.)\n\nWhatever brought you, if you're at the water you're an angler. And an angler does it properly. If you cast beside him, he'll copy you. Three fish. Measured.",
        { affinity: 0, flag: 'choice.n06_2_uneasy' }),
      d('eager', '상황마다 루어를 바꾸는 법이라면 저도 배우고 싶습니다.', "If it's about switching lures for the conditions, I want to learn too.",
        '좋아. 그 말 하늘이 앞에서 한 번 더 해. 선배 말보다 남 말이 더 먹혀. (만족스럽게 고개를 끄덕인다.)\n\n루어 상자 통째로 가져와. 하나로 끝내려는 놈은 안 데려가. 세 마리, 세 가지 물. 오늘은 물이 계속 바뀔 거야.',
        "Good. Say that again in front of Haneul. Someone else's words land better than a senior's. (He nods, satisfied.)\n\nBring your whole lure box. I don't take anyone who plans to get by on one. Three fish, three kinds of water. The water's going to keep changing today.",
        { affinity: 0.05 }),
    ],
    completeAdd: [
      d('praise_haneul', '하늘 씨한테도 잘했다고 전해 주십시오. 두 번째부터 눈이 달랐습니다.', "Tell Haneul he did well. His eyes were different from the second fish.",
        '…네가 직접 해. 내가 하면 잔소리고, 네가 하면 칭찬이야. (하늘 쪽으로 턱짓한다. 백하늘이 귀를 쫑긋 세운다.)\n\n봐, 벌써 듣고 있잖아. 칭찬은 그 자리에서 해야 먹혀. 늦으면 그냥 인사야.',
        "…Tell him yourself. From me it's nagging, from you it's praise. (He jerks his chin toward Haneul. Baek Haneul's ears prick up.)\n\nSee, he's already listening. Praise only works on the spot. Leave it late and it's just small talk.",
        { affinity: 0.03, affinityOther: [{ npcId: 'baek_haneul', delta: 0.08 }], flag: 'choice.n06_2_praised_haneul' }),
    ],
    completeReply: {
      lesson: [
        '…표? 머리에 있는데. 적어 줄게. (탁도별 컬러 선택이 손에 익는다.)\n\n물이 맑으면 자연색, 탁하면 눈에 띄는 색. 그 사이는 네가 정해. 표는 거기까지만 맞아. 나머지는 물가에서 네 눈으로 재. 그게 실측이야.',
        "…Chart? It's in my head. I'll write it out. (Choosing colour by turbidity settles into my hands.)\n\nClear water, natural colours. Dirty water, loud ones. Everything in between, you decide. The chart's only right up to there. The rest you measure with your own eyes at the water. That's measurement.",
      ],
      pay: [
        '있지. 선배가 후배한테 사는 거. (술이 아니라 돈이다.)\n\n술은 안 사. 술 먹고 던지면 실측이 안 돼. 손이 흔들리거든. 그 돈으로 루어 하나 더 사. 탁수용으로.',
        "There is. A senior buying for a junior. (In money, not drink.)\n\nI don't buy drinks. Drink and cast and you can't measure a thing. Your hands shake. Buy one more lure with that. One for dirty water.",
      ],
      decline: [
        '…너도 광기가 있네. 좋아. (씨바스터즈 명예 회원증이 하나 더 생겼다.)\n\n광기는 칭찬이야. 남의 눈 바뀌는 걸 보려고 하루를 쓰는 놈은 드물어. 하늘이도 언젠가 신입 눈 바뀌는 게 보고 싶어질 거야. 그게 동아리야.',
        "…You've got the madness too. Good. (One more honorary Seabusters card.)\n\nMadness is a compliment. Not many people spend a whole day just to watch someone else's eyes change. Someday Haneul will want to watch a new kid's eyes change too. That's what a club is.",
      ],
    },
  },

  // ── N06-3 「먹보」 · 여강산 (event — 미루기 답은 나레이션에 있다) ──
  'N06-3': {
    offerAdd: [
      d('ask_team', '셋이 협공이라면, 나머지 한 사람은 누굽니까?', "Three of us together — who's the third?",
        '나, 너, 그리고 동아리 애 하나. 누가 올지는 가 봐야 알아. 태풍 지나가면 다들 수업 빼고 나오거든. (말리지 않는 사람의 웃음을 웃는다.)\n\n셋이면 돼. 하나는 라인, 하나는 뜰채, 하나는 캐스팅. 괴물은 혼자 못 올려. 혼자 하다 놓치면 평생 그 얘기만 해. 가자.',
        "Me, you, and one of the club kids. Who turns up, we'll see when we get there. After a typhoon they all skip class and come out. (He laughs like someone who won't stop them.)\n\nThree's enough. One on the line, one on the net, one casting. You can't land a monster alone. Lose it on your own and that's all you'll talk about for life. Let's go.",
        { affinity: 0.03, flag: 'choice.n06_3_asked_team' }),
      d('net_joke', '괴물이라니, 뜰채보다 크면 어떡합니까?', "A monster? What if it's bigger than the net?",
        '그럼 셋이 끌어안고 올려야지. (진지하다.) 농담 아니야. 60 넘는 놈은 뜰채 테두리에 걸려서 튕겨 나가.\n\n머리부터 넣어. 꼬리부터 넣으면 백이면 백 놓친다. 이거 하나만 기억하고 와. 태풍 뒤 물은 기다려 주지 않아.',
        "Then the three of us hug it out of the water. (He's serious.) Not joking. Anything over sixty catches on the rim of the net and bounces out.\n\nHead first. Tail first and you lose it every time. Remember that one thing and come. Water after a typhoon doesn't wait.",
        { affinity: 0.02 }),
    ],
    offerReply: {
      go: [
        '그 눈이야. 뜰채 챙겨.\n\n태풍 지나간 물은 흙빛이야. 작은 놈들은 숨고 큰 놈만 먹으러 나와. 그래서 지금이야. 뜰채는 네가 챙겨 오고, 대는 건 내가 해. 던지는 건 너희 몫이고.',
        "That's the look. Bring the net.\n\nWater after a typhoon goes the colour of mud. The small ones hide and only the big ones come out to feed. That's why it's now. You bring the net, I'll do the netting. The casting's on you lot.",
      ],
      decline: [
        '…맞는 말이야. 다음 태풍에 봐. 먹보는 또 온다.\n\n태풍 뒤 방파제는 원래 조심해야 돼. 너울이 남아 있거든. 무서운 줄 아는 놈이 오래 낚시해. (그 말을 하고 휴대폰을 닫는다. 연락처는 지우지 않는다.)',
        "…Fair point. See you at the next typhoon. The big feeders come back.\n\nAfter a typhoon you've got to watch the breakwater. The swell hangs around. The ones who know fear fish the longest. (He says it and closes his phone. He doesn't delete my number.)",
      ],
    },
    completeAdd: [
      d('no_name', '먹보는 셋이 올린 겁니다. 제 이름은 안 남겨도 됩니다.', "Meokbo was landed by three of us. No need to put my name down.",
        '…이름 빼 달라는 놈은 처음이네. (한참 보다가 웃는다.) 그래, 기록에는 셋이라고 쓸게. 씨바스터즈 셋.\n\n근데 부산 방파제에선 다 알 거야. 먹보 올린 날 누가 있었는지. 소문은 기록보다 빨라. (그 뒤로 방파제에서 모르는 사람이 먼저 인사를 한다.)',
        "…First time anyone's asked to be left off. (He looks at me a long while, then laughs.) All right. The record says three. Three Seabusters.\n\nBut every breakwater in Busan will know who was there the day Meokbo came up. Talk travels faster than records. (After that, strangers on the breakwater greet me first.)",
        { affinity: 0.08, harborRep: 3 }),
    ],
    completeReply: {
      vest: [
        '태풍은 부르는 게 아니라 오는 거야. 그때 봐. (베스트 주머니에 루어 하나가 들어 있다.)\n\n그 베스트, 오래 입었어. 주머니마다 이유가 있어. 왼쪽은 루어, 오른쪽은 바늘. 섞으면 급할 때 손이 엉켜.',
        "You don't call a typhoon. It comes. See you then. (There's a lure in the vest pocket.)\n\nI wore that vest a long time. Every pocket's got a reason. Left for lures, right for hooks. Mix them up and your hands tangle when you're in a hurry.",
      ],
      lesson: [
        '농어 눈을 봐. 돌아서는 순간이 있어. (대물 랜딩이 손에 붙는다.)\n\n힘 빠져서 옆으로 눕는 순간. 그때 머리 쪽으로 뜰채를 대. 쫓아가면 안 돼. 기다리면 와. 큰 놈은 다 그래. 서두르는 놈이 놓쳐.',
        "Watch the bass's eye. There's a moment it turns. (Landing big fish settles into my hands.)\n\nThe moment it tires and rolls onto its side. That's when you bring the net to its head. Don't chase it. Wait and it comes. All the big ones are like that. The one who hurries loses it.",
      ],
      pay: [
        '있지. 주간 의뢰 열어 줄게. 이번 건 내가 쏜다. (봉투가 두껍다.)\n\n이번 건 대결도 아니었지만 먹보를 올렸으니 대결 이상이야. OB가 쏘는 건 이럴 때야. 후배들 앞에서는 비밀이고.',
        "There is. I'll open the weekly job board for you. This one's on me. (The envelope is thick.)\n\nThis wasn't even a match, but you landed Meokbo, so it counts for more. This is when an alumnus pays. Keep it quiet in front of the juniors.",
      ],
    },
  },

  // ── N07-1 「공방 터」 · 짐 강 (장인이 동생이라는 것은 N07-3에서 — 여기서는 「그 사람」) ──
  'N07-1': {
    offer: [
      d('ask_plan', '누구 도면입니까? 그렇게 찾던 거였습니까?', "Whose plan is it? Is this what you've been looking for?",
        '루어 만들던 사람. 일찍 갔어. 공방은 비었고, 도면만 남아 있었어. (접힌 종이를 꺼냈다가 다시 넣는다. 펼쳐 보이지는 않는다.)\n\n누군지는 나중에 말해. 지금은 이게 진짜 물에서 도는지가 먼저야. 속초. 같은 루어, 같은 자리.',
        "A man who made lures. He went early. The workshop was empty. Only the plan was left. (He takes out a folded sheet and puts it back. He doesn't unfold it.)\n\nWho he was, I'll tell you later. First I need to see if this thing really swims in real water. Sokcho. Same lure, same spot.",
        { affinity: 0.04, flag: 'choice.n07_1_asked_plan' }),
      d('ask_sokcho', '왜 속초입니까? 부산에도 바다는 많은데요.', "Why Sokcho? Busan has plenty of sea.",
        '도면에 그렇게 적혀 있어. 시험 장소 속초. 그 사람이 거기서 돌려 봤다는 거지. (도면이 든 주머니를 손가락으로 두드린다.)\n\n만든 사람이 시험한 물에서 던져야 제대로 보여. 다른 물에선 다른 루어야. 가자. 너 속초 물 알잖아.',
        "That's what's written on the plan. Testing ground, Sokcho. Means he tried it out there. (He taps the pocket that holds the plan.)\n\nYou have to throw it in the water its maker tested it in to see it right. In other water it's a different lure. Let's go. You know Sokcho water.",
        { affinity: 0.03, flag: 'choice.n07_1_asked_sokcho' }),
      d('doubt', '대결이라니요. 제가 상대가 되겠습니까?', "A match? Am I even a match for you?",
        '상대가 되든 말든 상관없어. 나는 네 손을 봐야 돼. (내 손을 한참 본다. 무엇을 보는지는 말하지 않는다.)\n\n이기고 지는 건 내가 정해. 넌 던지기만 해. 세 마리. 그거면 돼.',
        "Whether you're a match doesn't matter. I need to watch your hands. (He looks at my hands a long time. He doesn't say what he's looking for.)\n\nI decide who wins. You just cast. Three fish. That's all.",
        { affinity: 0.01 }),
      d('accept', '같은 루어, 같은 자리라면 해 볼 만합니다. 가시죠.', "Same lure, same spot. That's worth a try. Let's go.",
        '그래. 루어는 준비해 놨어. 두 개. 똑같은 걸로. (나무 루어 두 개를 꺼낸다. 아직 칠도 하지 않은 것이다.)\n\n같은 루어면 손만 남아. 그걸 보고 싶은 거야. 속초 물에서.',
        "Good. I've got the lures ready. Two of them. Identical. (He takes out two wooden lures. They haven't even been painted yet.)\n\nSame lure, and all that's left is the hands. That's what I want to see. In Sokcho water.",
        { affinity: 0.05 }),
    ],
    completeAdd: [
      d('throw_more', '여비는 됐습니다. 그 루어, 해 질 때까지 더 던져 보겠습니다.', "Keep the travel money. I'd rather throw that lure until sundown.",
        '…돈보다 루어라. (입가가 조금 움직인다. 웃었다고 해야 할지 모르겠다.)\n\n던져. 해 질 때까지. 그 사람도 그랬을 거야. 루어는 던질수록 제 길을 찾아. (그날 해 질 녘까지 던졌다. 방파제 사람들이 그 나무 루어를 기억한다.)',
        "…The lure over the money. (The corner of his mouth moves. I'm not sure it counts as a smile.)\n\nThrow it. Till sundown. He'd have done the same. The more a lure gets thrown, the more it finds its own way. (I threw it until dusk. The people on the breakwater remember that wooden lure.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      ask_who: [
        '…나중에. 네 번째 자리에서 말해 준다. (도면 사본 한 장을 접어 준다.)\n\n지금 말하면 네가 그 사람처럼 던지려고 할 거야. 그럼 안 돼. 네 손 그대로 던져야 내가 볼 수 있어. 그때까지 그 사본은 갖고 있어.',
        "…Later. I'll tell you at the fourth place. (He folds a copy of the plan and gives it to me.)\n\nTell you now and you'll try to throw like him. That won't do. You have to throw with your own hands for me to see anything. Hang on to that copy till then.",
      ],
      lesson: [
        '눈이 있네. 폴링이 맞아. (유작 루어의 폴 각도를 보여 준다.)\n\n가라앉을 때 몸을 흔들면서 떨어져. 그때 물어. 감을 때가 아니라. 이걸 아는 사람은 많지 않아. 그 사람은 알고 깎았어.',
        "You've got an eye. It is the fall. (He shows me the fall angle of the last lure.)\n\nIt shimmies as it sinks. That's when they take it. Not on the retrieve. Not many people know that. He knew it when he carved it.",
      ],
      pay: [
        '그래야지. 내가 끌고 온 거니까. (여비가 넉넉하다.)\n\n속초까지 먼 길이었지. 그 사람도 도면 하나 들고 그 길을 다녔을 거야. …넉넉히 넣었어. 다음 길도 멀거든.',
        "I should. I'm the one who dragged you here. (The travel money is generous.)\n\nLong road to Sokcho. He'd have travelled it too, with a plan in his hand. …I put in plenty. The next road's long as well.",
      ],
    },
  },

  // ── N07-2 「두 번째」 · 짐 강 (무엇을 재는지는 끝내는 자리에서 — 받는 자리에서는 말하지 않는다) ──
  'N07-2': {
    offer: [
      d('ask_piece', '두 번째 조각이라니, 그게 뭡니까?', "The second piece? What is it?",
        '그 사람 루어는 한데 안 남았어. 흩어졌지. 도면 하나, 지그 하나. 하나씩 찾는 거야. (도면이 든 주머니 위를 손바닥으로 누른다.)\n\n두 번째는 지그야. 그 사람이 포항 물에 맞춰 만들었다고 나는 믿어. 믿는 거지, 아직 본 건 아니야. 그래서 네 손이 필요해. 방어 한 마리.',
        "His lures didn't stay in one place. They scattered. A plan here, a jig there. I'm finding them one by one. (He presses his palm over the pocket with the plan.)\n\nThe second is a jig. I believe he made it for Pohang water. Believe, not seen. That's why I need your hands. One yellowtail.",
        { affinity: 0.04, flag: 'choice.n07_2_asked_piece' }),
      d('ask_measure', '제 저킹을 보신다고요? 뭘 보시는 겁니까?', "You'll watch my jerking? Watch for what?",
        '끝나고 말해. 지금 말하면 네 손이 그걸 의식해. (팔짱을 낀다. 더 묻지 말라는 자세다.)\n\n의식한 저킹은 저킹이 아니야. 평소대로 해. 방어는 빠른 걸 좋아한다더라. 그것도 신경 쓰지 마. 네 박자로.',
        "I'll tell you after. Tell you now and your hands will think about it. (He folds his arms. It means don't ask more.)\n\nA jerk you think about isn't a jerk. Do it like always. They say yellowtail like it fast. Don't worry about that either. Your own beat.",
        { affinity: 0.02, flag: 'choice.n07_2_asked_measure' }),
      d('unsure', '지깅은 아직 손에 덜 익었습니다. 괜찮겠습니까?', "Jigging isn't in my hands yet. Is that all right?",
        '덜 익은 게 좋아. 다 익은 손은 버릇이 박혀서 안 보여. (고개를 한 번 끄덕인다.)\n\n속초에서 네 손 봤어. 그걸로 충분해. 포항 물은 깊어. 바닥 찍고 올리는 것만 잊지 마. 방어 한 마리.',
        "Better that it isn't. Hands set in their ways hide what I want to see. (He nods once.)\n\nI saw your hands in Sokcho. That's enough. Pohang water is deep. Just don't forget to touch bottom before you work it up. One yellowtail.",
        { affinity: 0.03 }),
      d('accept', '지켜봐 주십시오. 방어 한 마리, 올리겠습니다.', "Watch, then. I'll bring up a yellowtail.",
        '그래. 나는 보기만 해. 손은 안 대. (배 난간에 등을 기댄다.)\n\n포항 앞바다 방어는 힘이 세. 한 번 차고 나가면 버텨. 버티는 것도 저킹만큼 볼 거야. 가자.',
        "Right. I only watch. I won't lay a hand on it. (He leans back against the rail.)\n\nYellowtail off Pohang are strong. When one bolts, you hold on. I'll be watching how you hold on as much as how you jerk. Let's go.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('follow', '여비는 됐습니다. 다음 자리도 따라가겠습니다.', "Keep the money. I'll follow you to the next place too.",
        '…따라온다고. (오래 본다.) 그 말 들으려고 포항까지 온 건 아닌데. 듣고 나니 됐다.\n\n다음은 태안. 서프야. 네가 온다면 나는 또 안 던질 거다. (포항 항구 사람들이 그날 내 저킹을 기억한다.)',
        "…You'll follow. (He looks at me a long time.) I didn't come all the way to Pohang to hear that. But now I've heard it, that's enough.\n\nNext is Taean. Surf. If you come, I won't cast again. (The people of Pohang harbour remember my jerking that day.)",
        { affinity: 0.08, harborRep: 2, flag: 'choice.n07_2_will_follow' }),
    ],
    completeReply: {
      lesson: [
        '리듬. 그 사람 리듬과 네 리듬의 차이. (유작 지그의 무게 배분을 보여 준다.)\n\n그 사람은 쉬는 박자에 맞춰 이 지그를 깎았어. 무게가 뒤로 몰려 있지. 쉬면 눕고, 누우면 물어. 너는 거의 안 쉬더라. 그래도 물었어. 그 차이를 재고 있었던 거야.',
        "Rhythm. The gap between his rhythm and yours. (He shows me the weight distribution of the last jig.)\n\nHe carved this jig for the pause. The weight sits toward the back. Pause and it lies flat, and when it lies flat they take it. You hardly paused. They still took it. That gap is what I was measuring.",
      ],
      pay: [
        '있지. 서른 해를 찾은 사람이 인색하면 안 되지. (여비가 넉넉하다.)\n\n…서른 해. 말하고 나니 길다. 찾는 동안은 몰랐어. 너한테 주는 여비가 그 서른 해 동안 제일 잘 쓴 돈일 거야. 받아.',
        "There is. A man who searched thirty years shouldn't be stingy. (The travel money is generous.)\n\n…Thirty years. Sounds long once I say it. I didn't notice while I was searching. Your travel money might be the best I've spent in all thirty. Take it.",
      ],
      ask: [
        '…내 손은 그 사람 손이 아니야. 네 손이 더 가까워. (그 말을 하고 오래 바다를 본다.)\n\n내가 던지면 그 루어가 내 루어가 돼. 그건 싫어. 그 사람 루어로 남아야 해. 그래서 네가 던지는 거야. 너는 그 사람을 모르니까.',
        "…My hands aren't his hands. Yours are closer. (He says it, then looks out at the sea for a long time.)\n\nIf I throw it, it becomes my lure. I don't want that. It has to stay his. That's why you throw it. You never knew him.",
      ],
    },
  },

  // ── N07-3 「세 번째」 · 짐 강 (동생이라는 말은 끝낼 때 처음 나온다 — 받는 자리에서는 숨긴다) ──
  'N07-3': {
    offer: [
      d('ask_surf', '서프라니요. 파도치는 데서 미노우를 던집니까?', "Surf? You throw a minnow into the breaking waves?",
        '파도 안쪽. 포말대. 파도가 부서진 자리에 먹이가 뒤집혀. 농어는 거기로 들어와. (모래사장 쪽으로 턱짓한다. 흰 거품 줄이 길다.)\n\n거스르지 마. 파도랑 싸우면 진다. 네 손이 그걸 알아내는지 볼 거야. 한 마리.',
        "Inside the waves. The foam line. Where a wave breaks, the bait gets tumbled. Sea bass come in there. (He jerks his chin at the beach. The white line of foam runs long.)\n\nDon't fight it. Fight the waves and you lose. I'll watch whether your hands work that out. One fish.",
        { affinity: 0.03, flag: 'choice.n07_3_asked_surf' }),
      d('ask_piece', '세 번째 조각은 이미 찾으셨습니까?', "Have you already found the third piece?",
        '…찾았어. 주머니에 있어. (주머니 위를 손으로 누른다. 꺼내지는 않는다.)\n\n네가 올리면 꺼낼게. 물에서 도는 걸 봐야 진짜인지 알아. 만리포 물에서. 그게 순서야.',
        "…I found it. It's in my pocket. (He presses a hand over the pocket. He doesn't take it out.)\n\nWhen you land one, I'll take it out. I have to see it swim to know it's real. In Manripo water. That's the order of things.",
        { affinity: 0.04, flag: 'choice.n07_3_asked_piece' }),
      d('cast_together', '이번엔 같이 던지시죠. 세 번째인데요.', "Cast with me this time. It's the third one.",
        '안 던져. 내 손은 그 물에 안 맞아. (말끝을 흐린다. 이유는 거기서 멈춘다.)\n\n대신 끝까지 볼게. 네가 파도에 밀리면 소리쳐 줄게. 그 정도는 해. 미노우 챙겨.',
        "I won't. My hands don't suit that water. (His voice trails off. The reason stops there.)\n\nBut I'll watch till the end. If the waves push you, I'll shout. That much I'll do. Bring the minnow.",
        { affinity: 0, flag: 'choice.n07_3_asked_to_cast' }),
      d('accept', '만리포까지 왔으니, 한 마리는 꼭 올리겠습니다.', "We've come all the way to Manripo. I'll land one, no matter what.",
        '꼭은 없어. 바다는 같은 걸 두 번 안 줘. (그래도 미노우를 건네는 손이 오래 머문다.)\n\n발밑 조심해. 서프는 한 번씩 큰 파도가 와. …오늘은 할 말이 있을지도 몰라. 네가 올리면.',
        "There's no no-matter-what. The sea never gives the same thing twice. (Still, his hand lingers as he passes me the minnow.)\n\nWatch your feet. In the surf a big one comes every so often. …I might have something to say today. If you land one.",
        { affinity: 0.05 }),
    ],
    completeAdd: [
      d('watch_sea', '여비는 됐습니다. 오늘은 이 바다를 같이 보겠습니다.', "No money today. I'll just stand here and look at this sea with you.",
        '…그래. (둘이 나란히 서서 만리포 물을 본다. 한참 아무 말도 하지 않는다.)\n\n고맙다. 이런 건 돈으로 못 갚아. 그러니 돈은 안 줄게. 제주에선 다 말할게. 그건 약속하지. (그날 만리포 사람들이 해변에 선 두 사람을 오래 기억했다.)',
        "…All right. (We stand side by side looking at the Manripo water. Neither of us says anything for a long while.)\n\nThanks. Something like this can't be paid back in money. So I won't pay you. On Jeju I'll tell you all of it. That I promise. (The people of Manripo remembered the two figures on the beach a long time.)",
        { affinity: 0.1, harborRep: 2 }),
    ],
    completeReply: {
      brother: [
        '…제주에서. 넷 다 모이면. (미노우 하나를 준다. 유작 세 번째 사본이다.)\n\n오늘은 이만큼만 하자. 동생이라는 말이 아직 입에 설어. 한 번에 다 하면 이 바다에 다 쏟을 것 같아.',
        "…On Jeju. When all four are together. (He gives me a minnow. The third copy of the last works.)\n\nThat's enough for today. The word brother still sits strange in my mouth. If I say it all at once, I'll pour it all into this sea.",
      ],
      lesson: [
        '파도 타이밍이야. 밀려올 때 감아. (서프 리트리브가 몸에 붙는다.)\n\n빠질 때는 멈춰. 미노우가 파도에 끌려가면서 저절로 흔들려. 그게 제일 좋은 액션이야. 손이 아니라 바다가 하는 거지. 동생도 그렇게 깎았어.',
        "It's wave timing. Wind as it rolls in. (The surf retrieve settles into my body.)\n\nWhen it drains back, stop. The wave drags the minnow and it swims by itself. That's the best action there is. Not your hand. The sea does it. My brother carved it that way.",
      ],
      pay: [
        '그래. (여비를 준다. 서른 해를 찾은 사람의 돈이다.)\n\n태안은 멀었지. 다음은 제주야. 더 멀어. 그래도 거기가 마지막이야. 끝까지 와 줘.',
        "I will. (He gives me the money. The money of a man who searched thirty years.)\n\nTaean was far. Jeju's next. Farther still. But that's the last one. Come all the way.",
      ],
    },
  },

  // ── N07-4 「네 번째」 · 짐 강 ──
  'N07-4': {
    offer: [
      d('ask_after', '넷이 다 모이면, 그다음엔 어떻게 하실 겁니까?', "Once all four are together, what will you do then?",
        '…모르겠어. 서른 해 동안 모으는 것만 생각했어. 모은 다음은 생각해 본 적이 없다. (에기를 손바닥에 올려놓고 오래 본다.)\n\n오늘 올리면 생각날지도 몰라. 그러니까 올려. 무늬오징어 한 마리. 동생 에기로.',
        "…I don't know. For thirty years all I thought about was gathering them. I never once thought about after. (He sets the egi on his palm and looks at it a long time.)\n\nMaybe it'll come to me if you land one today. So land one. One bigfin reef squid. On my brother's egi.",
        { affinity: 0.04, flag: 'choice.n07_4_asked_after' }),
      d('ask_egi', '동생분 에기는 다른 에기와 뭐가 다릅니까?', "What makes your brother's egi different from the rest?",
        '가라앉는 게 달라. 천천히, 수평으로. 오징어가 올려다볼 시간을 줘. (에기를 기울여 보인다. 꼬리 쪽이 조금 무겁다.)\n\n동생은 폴링에 다 걸었어. 감는 건 덤이고. 오늘은 네가 그 폴링을 줘 봐.',
        "The way it sinks. Slow and level. It gives the squid time to look up at it. (He tilts the egi to show me. The tail end is a little heavy.)\n\nMy brother bet everything on the fall. The retrieve was an extra. Today you give it that fall.",
        { affinity: 0.03, flag: 'choice.n07_4_asked_egi' }),
      d('unsure', '마지막 자리를 제가 던져도 되는 겁니까?', "Am I really the one who should throw at the last place?",
        '너라서 되는 거야. 속초에서부터 네 손만 봤어. 이제 와서 다른 손은 안 돼. (말이 평소보다 길다.)\n\n마지막이라고 무겁게 던지지 마. 동생 에기는 가볍게 던져야 가볍게 가라앉아. 한 마리면 돼.',
        "It's because it's you. From Sokcho on, yours are the only hands I've watched. No other hands now. (He says more than usual.)\n\nDon't throw it heavy just because it's the last. My brother's egi sinks light when it's thrown light. One squid is all.",
        { affinity: 0.03 }),
      d('accept', '넷을 모으는 자리, 끝까지 함께하겠습니다.', "I'll be there to the end, to see all four together.",
        '…그래. 그 말 들으니 이제 실감이 난다. 넷이라는 게. (짐을 내려놓듯 숨을 내쉰다.)\n\n제주 물은 맑아. 오징어가 다 봐. 사람 그림자까지. 발소리 줄이고 던져. 한 마리.',
        "…All right. Hearing that, it finally feels real. That it's four. (He breathes out like a man setting down a load.)\n\nJeju water is clear. The squid see everything. Even your shadow. Step softly and cast. One squid.",
        { affinity: 0.05 }),
    ],
    completeAdd: [
      d('name_lures', '넷에 하나씩, 던졌던 바다 이름을 붙이겠습니다.', "I'll name each of the four after the sea it was thrown in.",
        '…속초, 포항, 만리포, 제주. (손가락으로 하나씩 짚는다. 목소리가 조금 흔들린다.)\n\n좋다. 그 물에서 다 돌았으니 그 이름이 맞아. 이제 네 거야. 부르면서 던져. 동생도 그 이름들이 마음에 들 거야.',
        "…Sokcho, Pohang, Manripo, Jeju. (He touches them one by one. His voice wavers a little.)\n\nGood. Each one swam in that water, so those are the right names. They're yours now. Call them by name when you cast. My brother would like those names.",
        { affinity: 0.1, flag: 'choice.n07_4_named_lures' }),
    ],
    completeReply: {
      throw: [
        '그래. 그게 답이야. (유작 넷을 건넨다. 동생 이름이 각인돼 있다.)\n\n박제된 루어는 아무것도 못 잡아. 동생은 그걸 제일 싫어했을 거야. 물에 들어가면 닳겠지. 그래도 돼. 닳으라고 만든 거니까.',
        "Right. That's the answer. (He hands over all four. His brother's name is engraved on them.)\n\nA lure behind glass catches nothing. He'd have hated that most. They'll wear down in the water. That's fine. They were made to wear down.",
      ],
      one_back: [
        '…아니. 넷이어야 해. 그 사람은 넷을 만들었어. (그래도 그 말에 오래 서 있었다.)\n\n하나라도 내 서랍에 들어가면, 나는 그걸 꺼내 보면서 또 서른 해를 살 거야. 그러니 넷 다 가져가. …마음은 받을게. 그건 여기 둔다. (가슴께를 두드린다.)',
        "…No. It has to be four. He made four. (Still, he stood there a long time after I said it.)\n\nIf even one goes in my drawer, I'll spend another thirty years taking it out to look at. So take all four. …I'll keep the thought, though. That stays here. (He taps his chest.)",
      ],
      pay: [
        '그래. 마지막 여비. (여비와 함께 유작 넷이 온다. 돈은 돈이고 유작은 유작이라며.)\n\n속초, 포항, 태안, 제주. 네가 다 따라왔어. 그 길값이야. 유작은 값을 매기면 안 되니까 따로 주는 거고. 섞지 마. 동생이 들으면 화낼 거야.',
        "I will. The last one. (With the money come the four lures. Money is money and his brother's work is his brother's work, he says.)\n\nSokcho, Pohang, Taean, Jeju. You followed every road. This is for the roads. You can't put a price on his work, so it comes separately. Don't mix them up. He'd be angry if he heard.",
      ],
    },
  },

  // ── N08-1 「첫 승선」 · 고만석 (해나는 아직 나오지 않는다) ──
  'N08-1': {
    offer: [
      d('ask_bow', '처음 탄 사람을 왜 뱃머리에 세우십니까?', "Why put a first-timer at the bow?",
        '뱃머리가 제일 흔들려. 거기서 버티면 어디서든 버틴다. (갑판을 발로 한 번 구른다.)\n\n그리고 거기선 승객이 다 보여. 누가 멀미하는지, 누가 채비 엉켰는지. 사관은 낚시보다 그걸 먼저 본다. 가서 서.',
        "The bow pitches the most. Keep your feet there and you'll keep them anywhere. (He stamps the deck once.)\n\nAnd from there you can see every passenger. Who's seasick, whose rig is tangled. An officer sees that before the fishing. Go and stand.",
        { affinity: 0.04, flag: 'choice.n08_1_asked_bow' }),
      d('ask_rig', '육지 채비랑 뭐가 그렇게 다릅니까?', "What's so different from a land rig?",
        '타 보면 알아. 말로 하면 안 믿는다. (짧고 굵은 대를 던지듯 건넨다.)\n\n육지 채비 들고 온 놈들은 첫 파도에 다 엉켜. 엉키면 옆 사람 것까지 엉켜. 그럼 그날 장사 끝이다. 이거 써.',
        "Ride and you'll see. Tell you and you won't believe it. (He all but throws a short, thick rod at me.)\n\nPeople who bring land rigs all tangle on the first wave. And when they tangle, they tangle the next man's too. Then the day's business is done. Use this.",
        { affinity: 0.03, flag: 'choice.n08_1_asked_rig' }),
      d('mulhoe', '점심이 물회라니, 그거 하나 보고 타겠습니다.', "Mulhoe for lunch? I'm boarding for that alone.",
        '물회 보고 타는 놈은 물회 먹기 전에 멀미한다. (험상궂은 얼굴인데 입꼬리가 조금 움직인다.)\n\n먹으려면 일부터 해. 오전에 두 마리. 그래야 물회에 네 것도 들어간다. 손 놀면 국물만 준다.',
        "Anyone who boards for the mulhoe gets seasick before he eats it. (A fierce face, but the corner of his mouth moves a little.)\n\nYou want to eat, work first. Two fish by midday. Then some of yours goes in the mulhoe. Idle hands get broth.",
        { affinity: 0.02 }),
      d('obey', '처음이지만, 시키는 대로 하겠습니다.', "It's my first time, but I'll do as I'm told.",
        '시키는 대로만 하면 사관 못 된다. 시키기 전에 보는 놈이 사관이야. (구명조끼 끈을 직접 조여 준다.)\n\n오늘은 시키는 대로 해라. 첫날이니까. 대신 귀는 열어 둬. 배 위에선 들리는 게 다 일이다.',
        "Only doing as you're told never made anyone an officer. An officer sees it before he's told. (He tightens my life-jacket straps himself.)\n\nToday, do as you're told. It's your first day. But keep your ears open. On a boat, everything you hear is work.",
        { affinity: 0.04 }),
    ],
    completeAdd: [
      d('noticed', '승객 사연, 선장님도 다 듣고 계셨지요?', "You heard every word of that passenger's story too, didn't you?",
        '…안 들었다. (안 들었다는 얼굴이 아니다.)\n\n배 위에서 한 말은 바다에 두고 내리는 거다. 들었어도 못 들은 거야. 너도 그렇게 해. 그게 이 배 규칙이다. 지키면 승객이 또 탄다.',
        "…Didn't hear a thing. (It isn't the face of a man who didn't hear.)\n\nWhat's said on a boat gets left at sea when you step off. Even if you heard it, you didn't. You do the same. That's this boat's rule. Keep it and the passengers come back.",
        { affinity: 0.06, flag: 'choice.n08_1_noticed_listening' }),
    ],
    completeReply: {
      lesson: [
        '배는 흔들리니까. 긴 대는 흔들림을 배로 받아. (선상 채비 묶는 법이 손에 익는다.)\n\n추도 무겁게 써. 배는 흘러가니까 가벼운 건 바닥에 못 닿아. 줄이 비스듬해지면 옆 사람이랑 엉킨다. 곧게 세워. 그게 배 위 예의다.',
        "Because the boat rolls. A long rod takes the roll twice over. (Tying shipboard rigs settles into my hands.)\n\nUse a heavy sinker too. The boat drifts, so a light one never reaches bottom. Let your line slant and it tangles with the next man's. Keep it straight down. That's manners on a boat.",
      ],
      pay: [
        '있지. 사관은 사관이다. (승선비를 돌려주고 일당을 얹는다.)\n\n뱃머리에서 하루 버틴 값이다. 승객은 돈 내고 타고, 사관은 돈 받고 탄다. 그 차이를 알면 다음 항차에도 태운다.',
        "There is. An officer is an officer. (He refunds my fare and adds a day's wage.)\n\nThat's for holding the bow a whole day. Passengers pay to ride, officers get paid to ride. Know the difference and I'll take you out next trip too.",
      ],
      decline: [
        '…그렇게 말하는 놈은 다음 항차 공짜다. (고래마루에 내 자리가 생겼다.)\n\n공짜라고 놀러 타는 거 아니다. 공짜로 타는 놈은 남보다 먼저 와서 갑판부터 닦는다. 그게 이 배에서 자리 받는 법이다.',
        "…Say that and the next trip is free. (I've got a place aboard the Goraemaru.)\n\nFree doesn't mean you ride for fun. Whoever rides free comes early and swabs the deck first. That's how you earn a place on this boat.",
      ],
    },
  },

  // ── N08-2 「해나의 칼」 · 고해나 ──
  'N08-2': {
    offer: [
      d('ask_why', '왜 아버님 밥상입니까? 무슨 날입니까?', "Why your father's table? Is it a special day?",
        '무슨 날은 아니에요. 아빠가 제 요리학교를 반대하거든요. 말로는 못 이겨요. 아빠는 말을 안 하니까. (웃는데 눈은 진지하다.)\n\n그래서 칼로 말해 보려고요. 겨울 방어 한 마리. 제가 뜬 회를 아빠가 어떻게 먹는지 보면 대답이 나올 거예요.',
        "It's not a special day. Dad's against me going to cooking school. I can't win with words. He doesn't use any. (She smiles, but her eyes are serious.)\n\nSo I'm going to try saying it with a knife. One winter yellowtail. When I see how he eats the sashimi I cut, I'll have my answer.",
        { affinity: 0.04, flag: 'choice.n08_2_asked_why' }),
      d('ask_winter', '꼭 겨울 방어여야 합니까?', "Does it have to be a winter yellowtail?",
        '꼭이요. 겨울 방어는 기름이 올라서 누가 떠도 맛있어요. 그래서 더 어려워요. (손가락으로 방어 뱃살 자리를 그려 보인다.)\n\n맛있는 게 당연한 생선이면 차이는 칼에서만 나요. 핑계 댈 데가 없죠. 그러니까 겨울 방어요. 꼭이요.',
        "It does. Winter yellowtail is so fatty it tastes good whoever cuts it. That makes it harder. (She traces where the belly would be with her finger.)\n\nWhen a fish is supposed to taste good, the only difference is the knife. Nowhere to hide. So, winter yellowtail. It has to be.",
        { affinity: 0.03, flag: 'choice.n08_2_asked_winter' }),
      d('hesitate', '부녀 사이 일에 제가 끼어도 되는지 모르겠습니다.', "I'm not sure I should get between a father and daughter.",
        '끼는 거 아니에요. 낚시만 해 주세요. 나머지는 제가 해요. (앞치마 끈을 고쳐 맨다.)\n\n아빠 배 타 봤잖아요. 아빠가 어떤 사람인지 조금은 알죠? 말보다 손을 보는 사람이에요. 그러니까 방어 한 마리만요.',
        "You won't be getting between us. Just fish. I'll do the rest. (She reties her apron strings.)\n\nYou've been out on Dad's boat. You know a little of what he's like, right? He watches hands, not words. So just one yellowtail.",
        { affinity: 0.01 }),
      d('accept', '좋습니다. 제일 좋은 놈으로 올리겠습니다.', "All right. I'll bring up the best one there is.",
        '고마워요. 크기는 상관없어요. 싱싱한 게 먼저예요. (도마를 미리 닦아 둔다.)\n\n잡으면 손질은 하지 말고 그대로 가져와 주세요. 처음부터 끝까지 제 칼로 하고 싶어요. 아빠 앞에 놓을 거니까요.',
        "Thank you. Size doesn't matter. Fresh comes first. (She wipes down the board in advance.)\n\nWhen you catch it, don't dress it. Bring it as it is. I want it to be my knife from start to finish. It's going in front of Dad.",
        { affinity: 0.05 }),
    ],
    completeAdd: [
      d('enough_bowls', '방어값은 됐습니다. 두 그릇이면 충분합니다.', "No need to pay for the fish. Two bowls says enough.",
        '…두 그릇이면 충분하다니, 그 말 좋네요. (방어 머리를 따로 챙겨 둔다. 아빠 몫이다.)\n\n그럼 값 대신 고맙다는 말만 할게요. 오늘 방어가 제 첫 손님 상이었어요. 손님이 아빠였지만요. (방어진 부두에 그날 상 이야기가 돈다.)',
        "…Two bowls says enough. I like that. (She sets the yellowtail head aside. It's Dad's share.)\n\nThen instead of paying, I'll just say thank you. Today's yellowtail was my first table for a customer. Even if the customer was Dad. (Word of that table goes around the Bangeojin docks.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      support: [
        '…고마워요. 그 말 아빠 앞에서 해 줄래요? 아니, 제가 할게요. (선장이 먼 데를 보며 헛기침을 한다. 듣고 있었다.)\n\n아빠 앞에서 그 말 하면, 아빠는 아무 말도 안 할 거예요. 그래도 두 그릇은 먹었잖아요. 그게 아빠 대답이었으면 좋겠어요.',
        "…Thank you. Would you say that in front of him? No — I'll say it. (The skipper clears his throat, looking out to sea. He was listening.)\n\nIf you say that in front of him, he won't say a thing. But he did have two bowls. I hope that was his answer.",
      ],
      lesson: [
        '제가요? 그럼 요리학교 안 가도 되는 건가요? 농담이에요. (회 뜨는 각도가 달라진다.)\n\n방어는 뱃살부터 떠요. 기름이 칼에 붙으면 결이 뭉개지니까 한 번 뜨고 한 번 닦아요. 아빠 배에서 혼자 익힌 거예요. 학교 가면 이게 맞는지 물어볼래요.',
        "From me? Then I don't need cooking school after all? Joking. (The angle of my slicing changes.)\n\nWith yellowtail you cut the belly first. Fat sticks to the blade and smears the grain, so cut once, wipe once. I taught myself on Dad's boat. At school I want to ask whether I've got it right.",
      ],
      pay: [
        '아, 네. 맞아요. (용돈에서 꺼낸다. 미안한 얼굴이다.)\n\n미안한 건 금액 때문이에요. 겨울 방어 값이면 더 드려야 하는데, 지금은 이게 다예요. …그래도 받아 줘요. 제 첫 상에 올라간 재료값이니까요.',
        "Ah, right. Of course. (She takes it out of her pocket money, looking sorry about it.)\n\nThe sorry face is about the amount. A winter yellowtail's worth more, but this is all I have right now. …Take it anyway. It's the price of what went on my first table.",
      ],
    },
  },

  // ── N09-1 「호미곶의 털바늘」 · 한봄 (수연의 사연은 봄이 진행 중에 직접 꺼낸다 — 받는 자리에서는 미룬다) ──
  'N09-1': {
    offer: [
      d('worry', '다친 데는 없습니까? 갯바위는 젖은 데가 제일 미끄럽습니다.', "Are you hurt? Wet rock is the slipperiest.",
        '없어요! 손목이 좀 놀란 것 같은데 괜찮아요. (손목을 돌려 보인다. 멀쩡하다.)\n\n젖은 데가 미끄러운 건 알았는데, 초록색 낀 데가 더 미끄러운 건 몰랐어요. 이제 아저씨 발 디딘 데만 따라 밟을게요. 같이 한 마리만 낚아요!',
        "Nope! My wrist got a fright, but it's fine. (She rolls her wrist to show me. Not a scratch on it.)\n\nI knew wet rock was slippery, but I didn't know the green slimy bits were worse. From now on I'll only step where you step. Let's catch just one together!",
        { affinity: 0.05 }),
      d('ask_fly', '언니 아버님 털바늘을, 왜 봄 씨가 들고 있습니까?', "Why are you the one carrying your sister's father's fly?",
        '…그게, 얘기가 좀 길어요. (털바늘을 손바닥에 꼭 쥔다.)\n\n언니 얘기는 낚시하면서 할게요. 한 번에 하면 제가 울 것 같아서요. 일단 한 마리만 같이 낚아요. 이 바늘로는 말고요. 이건 아까워서 못 던져요.',
        "…It's, um, a long story. (She closes her hand tight around the fly.)\n\nI'll tell you about my sister while we fish. If I tell it all at once I think I'll cry. Let's just catch one together first. Not with this hook, though. It's too precious to throw.",
        { affinity: 0.03, flag: 'choice.n09_1_asked_fly' }),
      d('ask_cooking', '요리에 미쳤다는 건, 어느 정도로 미친 겁니까?', "Mad about cooking — how mad, exactly?",
        '아침에 눈 뜨면 오늘 뭐 해 먹지부터 생각해요. 자기 전에도요. 꿈에서도 칼질해요. (가방에서 작은 도마와 칼집을 꺼내 보인다. 갯바위까지 들고 온 것이다.)\n\n그래서 여기 왔어요. 바다에서 막 잡은 걸 바로 해 먹고 싶어서요. 한 마리만 같이 잡아요. 잡으면 그 자리에서 뭐라도 해 볼래요.',
        "When I wake up, the first thing I think is what am I going to cook today. Before bed too. I chop things in my dreams. (She pulls a small board and a knife sheath out of her bag. She brought them all the way onto the rocks.)\n\nThat's why I'm here. I want to cook something straight out of the sea. Let's catch just one together. When we do, I'll make something right there.",
        { affinity: 0.04, flag: 'choice.n09_1_asked_cooking' }),
      d('passing_by', '저는 그냥 지나가던 길이었는데요.', "I was only passing by, you know.",
        '지나가던 길이 제일 좋아요! 저도 지나가다 미끄러졌어요. (아무렇지 않게 웃는다.)\n\n그러니까 지나가는 김에 한 마리만요. 붙잡아 줬으니까 이제 아저씨는 제 생명의 은인이에요. 은인이랑 낚시하는 건 처음이에요.',
        "Passing by is the best! I was passing by when I slipped, too. (She laughs like it's nothing.)\n\nSo while you're passing, just one fish. You caught me, so now you're the saviour of my life. I've never fished with a saviour before.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('held_fly', '그 털바늘, 잠깐 봐도 되겠습니까?', "May I take a look at that fly for a moment?",
        '…네. 조심해서요. (털바늘을 손바닥에 올려 준다. 깃털이 조금 빠져 있다.)\n\n언니가 버리지도 못하고 쓰지도 못해서 제가 들고 다녀요. 그 중간이 저예요. 깃털 빠진 건 제 탓이에요. 언니한테는 비밀이에요.',
        "…Okay. Carefully. (She sets the fly on my palm. A few feathers have come loose.)\n\nMy sister can't throw it away and can't use it, so I carry it. I'm the in-between. The missing feathers are my fault. Don't tell her.",
        { affinity: 0.05, flag: 'choice.n09_1_held_fly' }),
    ],
    completeReply: {
      lesson: [
        '네! 같이 배워요! (미끄러운 바위를 읽는 눈이 생긴다.)\n\n마른 데는 하얗고, 초록색 낀 데는 미끄럽고, 제일 무서운 건 까만 데래요. 젖어서 반짝이는 데요. 아까 저 거기 밟았어요. 이제 안 밟아요. 아저씨도요.',
        "Yes! Let's learn together! (I get an eye for reading slick rock.)\n\nDry rock is white, green slimy rock is slippery, and the scariest is the black. The bits that shine wet. That's what I stepped on earlier. Not anymore. You too.",
      ],
      pay: [
        '…떡! 제가 만든 거예요! (떡이 맛있다. 돈은 아니다.)\n\n돈은 지금 없어요. 대신 떡은 있어요! 쑥 넣은 거예요. 갯바위 위에서 먹으면 더 맛있어요. 진짜로요. 하나 더 드세요.',
        "…Tteok! I made it! (The tteok is good. It isn't money.)\n\nI don't have any money right now. But I do have tteok! It's got mugwort in it. It tastes better on the rocks. Honestly. Have another.",
      ],
      decline: [
        '…언니가 그런 사람 좋아해요. (구룡포 자매 식탁에 내 자리가 생겼다.)\n\n언니는 말을 안 해서 좋아해도 티가 안 나요. 근데 저는 알아요. 좋은 사람이 오면 수저를 하나 더 놓거든요. 오늘 하나 더 놓을 거예요.',
        "…My sister likes people like that. (I have a seat at the Guryongpo sisters' table.)\n\nShe doesn't talk, so you can't tell when she likes someone. But I can. When someone good comes, she sets out one more spoon. Tonight she'll set one more.",
      ],
    },
  },

  // ── N09-2 「칼을 쥐면」 · 한봄 ──
  'N09-2': {
    offer: [
      d('accept', '손질이라면 맡겨 주십시오. 두 마리, 깨끗하게 하겠습니다.', "Leave the dressing to me. Two fish, done clean.",
        '깨끗하게요! 그 말 좋아요. 언니도 들었을 거예요. (물가에 선 이수연 쪽을 본다. 대답은 없다. 대신 낚싯대가 한 번 휜다.)\n\n봐요, 벌써 하나 걸었어요. 언니는 대답을 손으로 해요. 도마는 두 개예요. 하나는 아저씨 거, 하나는 제 거.',
        "Clean! I like that. My sister will have heard. (She looks over at Lee Suyeon standing at the water's edge. No answer. Instead, her rod bends once.)\n\nSee, she's already hooked one. She answers with her hands. There are two boards. One's yours, one's mine.",
        { affinity: 0.05 }),
      d('ask_suyeon', '수연 씨가 직접 낚습니까? 말이 없다던 분이요.', "Suyeon fishes herself? The one you said doesn't talk?",
        '말은 없어도 낚시는 저보다 훨씬 잘해요. 손이 정확해요. (조금 부러운 얼굴이다.)\n\n언니는 잡는 거, 저는 해 먹는 거. 그 사이가 손질이에요. 아저씨가 그 사이를 맡아 주면 돼요. 두 마리요.',
        "She doesn't talk, but she fishes way better than me. Her hands are precise. (She looks a little envious.)\n\nShe catches, I cook. Dressing is the bit in between. You take the in-between. Two fish.",
        { affinity: 0.04, flag: 'choice.n09_2_asked_suyeon' }),
      d('ask_dressing', '손질이 요리를 그렇게나 바꿉니까?', "Does dressing really change the cooking that much?",
        '완전요! 비늘 하나 남으면 식감이 망가지고, 피를 덜 빼면 비려요. 뼈에 살을 남기면 그만큼 버리는 거고요. (손가락을 하나씩 접는다.)\n\n좋은 손질은 요리사 일을 반으로 줄여 줘요. 그래서 아저씨가 필요해요. 오늘 증명할게요. 접시로요.',
        "Totally! Leave one scale and the texture's ruined. Don't bleed it enough and it smells fishy. Leave meat on the bone and that's that much thrown away. (She counts on her fingers.)\n\nGood dressing halves the cook's work. That's why I need you. I'll prove it today. With a plate.",
        { affinity: 0.03, flag: 'choice.n09_2_asked_dressing' }),
      d('unsure', '제 손질이 요리에 쓸 만큼 되는지 모르겠습니다.', "I'm not sure my dressing is good enough for cooking.",
        '해 보면 알아요! 못하면 제가 말해 줄게요. 저 그런 건 솔직해요. (진지하게 고개를 끄덕인다.)\n\n근데 갯바위에서 저 붙잡던 손이면 괜찮을 거예요. 급할 때도 정확한 손이었어요. 생선은 사람보다 덜 급해요. 천천히 하면 돼요.',
        "Try it and see! If it's bad, I'll tell you. I'm honest about that sort of thing. (She nods seriously.)\n\nBut if it's the hand that caught me on the rocks, it'll be fine. It was precise even in a hurry. Fish are less of a hurry than people. Just go slow.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('bone_soup', '손질 값 대신, 남은 뼈로 국이나 끓여 주십시오.', "Instead of paying for the dressing, make a soup from the bones.",
        '국이요? 맑은 탕이요! (뼈를 들어 불빛에 비춰 본다.) 뼈에 살 남은 게 하나도 없네요. 그래도 국물은 나와요. 뼈만으로도요.\n\n셋이 나눠 먹어요. 아저씨 손질 값은 국 한 그릇이에요. (그날 저녁 구룡포 골목에 맑은 탕 냄새가 퍼졌다. 사람들이 손질한 사람이 누구냐고 묻는다.)',
        "Soup? A clear broth! (She holds the bones up to the light.) There's not a scrap of meat left on these. But they'll still make stock. Bones alone will.\n\nWe'll share it, the three of us. Your fee for the dressing is one bowl of soup. (That evening the smell of clear broth drifts down the Guryongpo alleys. People ask who did the dressing.)",
        { affinity: 0.06, harborRep: 2 }),
    ],
    completeReply: {
      decline: [
        '…언니가 웃었어요. 방금. 봤어요? (수연이 처음으로 이쪽을 똑바로 본다.)\n\n언니가 웃는 거, 저도 자주 못 봐요. 소리 없이 입꼬리만요. 밥값이라고 해 줘서 그런 것 같아요. 일 말고 밥으로 쳐 준 거니까요.',
        "…My sister smiled. Just now. Did you see? (For the first time, Suyeon looks straight at me.)\n\nI don't get to see her smile often either. No sound, just the corners of her mouth. I think it's because you called it the price of a meal. You counted it as a meal, not a job.",
      ],
      lesson: [
        '맞아요! 배 쪽 살을 남겨야 해요! (손질 등급이 오른다.)\n\n뱃살은 기름이 제일 많아서, 굽든 조리든 맛이 거기서 나와요. 근데 손질할 때 제일 많이 버려지는 데도 거기예요. 아깝잖아요. 이제 아저씨는 안 버리겠네요.',
        "Yes! You have to leave the belly meat! (My butchery grade rises.)\n\nThe belly has the most fat, so grilled or braised, that's where the flavour comes from. And it's the part that gets thrown out most when people dress fish. Such a waste. You won't be throwing it out now.",
      ],
      pay: [
        '식당도 아닌데… 그래도 맞아요. (수연이 말없이 지갑을 꺼낸다.)\n\n(봄이 놀라서 수연을 본다.) 언니가 먼저 꺼냈어요. 저도 몰랐어요. 언니는 일한 사람한테 고맙다는 말 대신 저렇게 해요. 말보다 손이 먼저예요, 언니는.',
        "It isn't even a restaurant… but you're right. (Suyeon takes out her purse without a word.)\n\n(Bom stares at Suyeon in surprise.) She got it out first. I didn't know she would. Instead of saying thank you to someone who worked, she does that. With her it's hands before words.",
      ],
    },
  },

  // ── N09-3 「아빠의 패턴」 · 이수연 (말이 적은 사람 — 짧은 말과 지문으로) ──
  'N09-3': {
    offer: [
      d('accept', '감아 보겠습니다. 사진 그대로, 한 올도 빼지 않고요.', "I'll tie it. Exactly like the photo, not a thread left out.",
        '…네. (사진을 내민다. 모서리가 닳아 있다.) 이거요. 아빠가 감던 거.\n\n(옆에서 봄이 눈을 크게 뜬다. 언니가 이만큼 말하는 건 드문 일인 모양이다.) …참돔 한 마리면 돼요. 그 바늘로요.',
        "…Okay. (She holds out the photo. Its corners are worn.) This. The one Dad used to tie.\n\n(Beside her, Bom's eyes go wide. Her sister saying this much seems to be rare.) …One red seabream is enough. On that hook.",
        { affinity: 0.05 }),
      d('ask_pattern', '사진 속 바늘, 무슨 깃털로 감은 겁니까?', "The fly in the photo — what feathers is it tied with?",
        '…몰라요. 사진에는 색만 있어요. (사진을 가까이 들여다본다. 오래.)\n\n봄이가 그러는데, 비슷한 걸 찾으면 된대요. …그래도 사진이랑 똑같았으면 좋겠어요. 참돔 한 마리. 그 바늘로요.',
        "…I don't know. The photo only shows the colours. (She looks closely at the photo. For a long time.)\n\nBom says we just need to find something close. …I'd still like it to be exactly like the photo. One red seabream. On that hook.",
        { affinity: 0.03, flag: 'choice.n09_3_asked_pattern' }),
      d('ask_seat', '셋이요? 저까지 그 식탁에 앉아도 됩니까?', "The three of us? I get a seat at that table too?",
        '…네. (고개를 한 번 끄덕인다. 짧은 대답인데 그 대답까지 오래 걸렸다.)\n\n봄이가 상 차릴 거예요. 저는 수저 놓을게요. 셋이요. 그러니까 참돔 한 마리, 꼭요.',
        "…Yes. (She nods once. A short answer, but it took her a long time to give it.)\n\nBom will cook. I'll set the spoons. Three. So one red seabream. Please.",
        { affinity: 0.06, flag: 'choice.n09_3_asked_seat' }),
      d('unsure', '아버님 바늘을 제 손으로 감아도 될지 모르겠습니다.', "I'm not sure my hands should be the ones tying your father's fly.",
        '…괜찮아요. 누군가는 감아야 해요. (짧게 말하고 입을 다문다.)\n\n봄이가 그러는데, 손이 정확한 사람이래요. 저도 봤어요. 도마 위에서. 그러니까 감아 줘요. 참돔 한 마리.',
        "…It's okay. Somebody has to tie it. (She says it briefly and closes her mouth.)\n\nBom says your hands are precise. I saw it too. On the board. So please tie it. One red seabream.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('enough_word', '바늘 값은 됐습니다. 아버님 바늘이 맞다는 그 말이면 충분합니다.', "No charge for the flies. Hearing it's your father's hook is enough.",
        '…네. (한참 있다가 한 번 더 말한다.) 아빠 바늘 맞아요. 두 번 말해도 맞아요.\n\n(봄이 웃다가 운다. 수연은 털바늘 상자를 내 쪽으로 조금 민다. 열어 봐도 된다는 뜻이다. 그 뒤로 구룡포 부두 사람들이 나를 알아본다.)',
        "…Yes. (After a long while she says it once more.) It's Dad's hook. Twice over, it is.\n\n(Bom laughs, then cries. Suyeon pushes the fly box a little toward me. It means I may open it. After that, the people on the Guryongpo docks know my face.)",
        { affinity: 0.1, harborRep: 2 }),
    ],
    completeReply: {
      share: [
        '…들었어요. 고마워요. (수연이 털바늘 하나를 내게 준다. 아버지 것이다.)\n\n…그 얘기, 쉽지 않은 거 알아요. 저는 아직 못 해요. (봄이 휴지를 내민다. 수연은 받지 않는다. 대신 털바늘 상자를 오래 쥐고 있다.)',
        "…I heard. Thank you. (Suyeon gives me a fly. Her father's.)\n\n…I know that isn't easy to say. I still can't. (Bom holds out a tissue. Suyeon doesn't take it. She just holds the fly box for a long time.)",
      ],
      lesson: [
        '아빠 방식이에요. 가르쳐 드릴게요. (털바늘 패턴이 손에 익는다.)\n\n실은 세 번 감고 한 번 묶어요. 깃털은 맨 마지막에요. 먼저 넣으면 눌려요. …손이 기억할 때까지 같이 감아요.',
        "It's my father's way. I'll teach you. (The fly patterns settle into my hands.)\n\nThree wraps of thread, then one tie. The feather goes on last. Put it on first and it gets crushed. …We'll tie them together until your hands remember.",
      ],
      pay: [
        '…네. 맞아요. (수연이 봉투를 내민다. 얼굴이 조금 굳는다.)\n\n…아빠 바늘 값이에요. 정해진 값이 없어서 제가 정했어요. 모자라면 말해요. (봄이 수연의 소매를 잡아당긴다. 수연은 봉투를 거두지 않는다.)',
        "…Yes. Of course. (She holds out an envelope. Her face stiffens a little.)\n\n…It's for Dad's flies. There's no set price, so I set one. Tell me if it's short. (Bom tugs at Suyeon's sleeve. Suyeon doesn't take the envelope back.)",
      ],
    },
  },

  // ── N05-6 「구독자 없는 방송」 · 서하린 (「재미없어도 진짜면 돼」는 끝낼 때 하린이 전한다 — 받는 자리에서는 아끼다) ──
  'N05-6': {
    offer: [
      d('for_three', '보여 드리죠. 시청자가 셋이면, 셋한테 제대로요.', "I'll show them. If there are three viewers, I'll do it properly for three.",
        '…그 말 좋네요. 셋한테 제대로. (화면 구석에 그 말을 자막으로 띄운다.)\n\n칼 잡으시면 바로 켤게요. 오늘 방송 제목도 정했어요. 셋을 위한 손질. 시작해요.',
        "…I love that. Properly, for three. (She puts the line up as a caption in the corner of the screen.)\n\nI'll go live the moment you pick up the knife. I've even got today's title. Dressing for Three. Let's start.",
        { affinity: 0.05 }),
      d('ask_back', '기범 씨는 왜 카메라를 등지고 앉습니까?', "Why does Gibeom sit with his back to the camera?",
        '몰라요. 물어보면 그냥 이게 편하대요. (등 돌린 나기범 쪽을 턱으로 가리킨다. 칼 소리도 거의 안 난다.)\n\n오빠는 원래 말로 설명 안 해요. 대신 손이 해요. 그쪽 손질도 그렇게 보여 주면 돼요. 말 안 해도 돼요, 진짜로.',
        "No idea. When I ask, he just says it's comfier. (She nods toward Na Gibeom's turned back. His knife barely makes a sound.)\n\nHe never explains with words. His hands do it. Just show your dressing the same way. You don't have to talk, honestly.",
        { affinity: 0.03, flag: 'choice.n05_6_asked_back' }),
      d('nervous', '카메라 앞에서는 손이 떨릴 것 같습니다.', "I think my hands will shake in front of the camera.",
        '떨려도 돼요! 보는 사람 셋이에요. 그중 둘은 여기 있고요. (휴대폰 화면을 보여 준다. 시청자 수 3.)\n\n떨리는 것도 진짜잖아요. 저는 그게 더 좋아요. 천천히 해요. 생선은 이미 잡혔으니까 도망 안 가요.',
        "Shaking is fine! There are three viewers. Two of them are right here. (She shows me her phone. Viewers: 3.)\n\nShaking is real too. I like that better. Take it slow. The fish is already caught, it isn't going anywhere.",
        { affinity: 0.02 }),
      d('hands_only', '얼굴은 빼고 손만 나오게 해 주십시오.', "Keep my face out of it. Hands only.",
        '당연하죠! 이번엔 먼저 물어보려고 했어요. 진짜예요. (카메라 각도를 도마 쪽으로 낮춘다.)\n\n손이랑 도마만 나와요. 원하면 끝나고 다시 보기도 먼저 보여 드릴게요. 그럼 시작할까요? 셋이 기다려요.',
        "Of course! I was going to ask first this time. Really. (She lowers the camera angle toward the board.)\n\nJust hands and the board. If you want, I'll show you the replay before anyone else. Shall we start? Three people are waiting.",
        { affinity: 0.03, flag: 'choice.n05_6_hands_only' }),
    ],
    completeAdd: [
      d('quiet_knife', '솔직히 방송보다 기범 씨 조용한 칼이 더 볼 만했습니다.', "Honestly, Gibeom's quiet knife was better viewing than the stream.",
        '오빠! 들었어요? …못 들은 척하네. (나기범의 칼이 잠깐 멈췄다가 다시 움직인다. 아까보다 조금 느리게.)\n\n저도 알아요. 오빠 칼은 소리가 작아서 마이크에 안 잡혀요. 다음엔 마이크를 도마 옆에 둘까 봐요. 시청자 다섯이 그 소리 들으러 올지도 몰라요.',
        "Oppa! Did you hear that? …He's pretending he didn't. (Na Gibeom's knife stops for a moment, then moves again. A little slower than before.)\n\nI know. His knife is so quiet the mic doesn't pick it up. Maybe next time I'll put the mic by the board. The five viewers might come back just to hear it.",
        { affinity: 0.02, affinityOther: [{ npcId: 'na_gibeom', delta: 0.08 }], flag: 'choice.n05_6_quiet_knife' }),
    ],
    completeReply: {
      lesson: [
        '오빠, 이분이 봤대요! (나기범이 처음으로 돌아앉아 칼을 잡는 법을 보여 준다.)\n\n방금 돌아앉은 거 봤어요? 방송 중에요! (화면을 확인한다. 다행히 손만 찍혔다.) 오빠는 칼을 짧게 잡아요. 뼈를 따라갈 땐 손목 말고 팔꿈치로 민대요. 저는 아직 무슨 말인지 모르겠어요.',
        "Oppa, he was watching! (For the first time Na Gibeom turns round and shows me how to hold the knife.)\n\nDid you see him turn round? On air! (She checks the screen. Luckily only his hands made it in.) He holds the knife short. Along the bone he pushes from the elbow, not the wrist, he says. I still don't get what that means.",
      ],
      pay: [
        '네… 시청자 다섯 명분… (진지하게 계산한다.)\n\n…계산대로 드리면 그쪽이 손해예요. 다섯 명이 한 시간 본 값이면 커피 한 잔도 안 돼요. 그러니까 계산 말고 제 지갑 사정대로 드릴게요. 손질 값은 손질 값이니까요.',
        "Yes… five viewers' worth… (She works it out, seriously.)\n\n…If I pay by the numbers, you lose out. Five people watching for an hour won't buy a coffee. So forget the numbers, I'll pay what my wallet can. Dressing is dressing.",
      ],
      decline: [
        '다섯이에요! 두 명 늘었어요! (다음 방송 제목에 내 손질이 올라간다.)\n\n두 명이 누군지는 몰라요. 근데 손질하는 동안 한 명도 안 나갔어요. 끝까지 봤어요. 그게 제일 신기해요. 재미없는데도요.',
        "Five! Up by two! (My butchery makes the next video's title.)\n\nI don't know who the two are. But not one person left while you were dressing it. They watched to the end. That's the strangest part. Even though it's dull.",
      ],
    },
  },

  // ── N05-7 「겨울 가게」 · 나기범 ──
  'N05-7': {
    offer: [
      d('congrats', '개업 축하합니다. 첫 회는 제가 뜨겠습니다.', "Congratulations on opening. I'll cut the first sashimi.",
        '…고마워요. 축하는 하린이 말고는 처음 들어요. (수조 뚜껑을 연다. 물소리가 난다.)\n\n수조에 있는 걸로 떠 주세요. 칼은 제 거 써요. 손에 맞을 거예요. 손님 없어도, 오늘은 가게예요.',
        "…Thank you. You're the first besides Harin to say congratulations. (He lifts the lid of the tank. Water sloshes.)\n\nCut from what's in the tank. Use my knife. It'll fit your hand. No customers, but today it's a shop.",
        { affinity: 0.05 }),
      d('ask_shop', '수조만 돌아가는데, 어떤 가게입니까?', "Only the tank's running. What kind of shop is this?",
        '횟집이요. 카운터 하나 있는 작은 데요. (손님 없는 의자를 하나씩 바로 놓는다.)\n\n수조 물은 매일 갈아요. 손님이 없어도요. 그거라도 해야 가게 같아서요. 회 떠 주면 그거 저희가 먹어요. 첫 장사예요.',
        "A sashimi place. A small one with just a counter. (He straightens the empty stools one by one.)\n\nI change the tank water every day. Even with no customers. Doing that much makes it feel like a shop. If you cut some sashimi, we'll eat it ourselves. First day of trade.",
        { affinity: 0.03, flag: 'choice.n05_7_asked_shop' }),
      d('hesitate', '남의 가게에서 제가 칼을 잡아도 되겠습니까?', "Is it all right for me to take up a knife in someone else's shop?",
        '…남의 가게 아니에요. 오늘은요. (새 앞치마 하나를 내민다.)\n\n손님이 없어서 제 칼도 요즘 쉬었어요. 형이 잡아 주면 칼도 반가워할 거예요. 수조에 있는 걸로 떠 줘요.',
        "…It's not someone else's shop. Not today. (He holds out a new apron.)\n\nWith no customers, my knife's been resting lately. If you take it up, the knife will be glad. Cut from what's in the tank.",
        { affinity: 0.02 }),
      d('ask_harin', '하린 씨는 왜 카메라 대신 설거지를 합니까?', "Why is Harin washing dishes instead of filming?",
        '…모르겠어요. 아침부터 저래요. 찍을 게 없대요. (주방 쪽에서 물소리가 난다. 그릇은 이미 다 깨끗하다.)\n\n저는 그게 더 고마워요. 말은 안 했어요. 형이 회 뜨면 하린이도 와서 앉을 거예요. 그때 같이 먹어요.',
        "…No idea. She's been like that since morning. Says there's nothing to film. (Water runs in the kitchen. The dishes are already all clean.)\n\nI'm more grateful for that. I haven't told her. When you cut the sashimi, she'll come and sit too. We'll eat together then.",
        { affinity: 0.04, flag: 'choice.n05_7_asked_harin' }),
    ],
    completeAdd: [
      d('soup_advice', '남는 뼈로 매운탕도 내 보십시오. 버리기 아깝습니다.', "Serve a spicy stew from the leftover bones too. Shame to waste them.",
        '…매운탕. (오래 생각하다가 수조 옆에서 냄비를 꺼낸다.) 뼈는 매일 버렸어요. 아까웠는데 방법을 몰랐어요.\n\n내일부터 끓여 볼게요. 하린이가 맛을 볼 거예요. 손님 없으면 저희가 먹으면 돼요. 오늘처럼요.',
        "…Maeuntang. (He thinks for a long time, then takes a pot out from beside the tank.) I've been throwing the bones out every day. It felt like a waste, but I didn't know what else to do.\n\nI'll start boiling them tomorrow. Harin can taste it. If there are no customers, we'll eat it ourselves. Like today.",
        { affinity: 0.06, flag: 'choice.n05_7_soup_advice' }),
    ],
    completeReply: {
      lesson: [
        '…수조? 그건 저도 배우는 중이에요. 같이 봐요. (활어 신선도를 읽는 눈이 생긴다.)\n\n아가미 색부터 봐요. 빨가면 괜찮아요. 그다음은 지느러미. 힘없이 접혀 있으면 오래 못 가요. 손님 없을 때 하루 종일 이것만 봤어요. 그래서 이건 좀 알아요.',
        "…The tank? I'm still learning that myself. Let's look together. (I get an eye for reading live fish.)\n\nStart with the gill colour. Red is good. Then the fins. If they're folded down with no strength, it won't last. With no customers I spent whole days just watching this. So this much I know.",
      ],
      pay: [
        '…네. 첫 매출이에요. (장부 첫 줄에 내 이름이 적힌다.)\n\n이상하네요. 돈이 나가는데 첫 매출이래요. 하린이가 그렇게 적으래요. 회가 떠졌으니까 가게가 일한 거래요. …저는 아직 잘 모르겠어요.',
        "…Yes. It's my first sale. (My name goes on the first line of the ledger.)\n\nStrange. Money's going out, and she calls it my first sale. Harin told me to write it that way. Sashimi got cut, so the shop did some work, she says. …I still don't really get it.",
      ],
      decline: [
        '…첫 손님. (하린이 결국 사진 한 장을 찍었다. 카운터 셋.)\n\n하린이가 안 찍는다더니 찍었네요. 괜찮아요. 올리는 사진은 아니래요. 가게 벽에 붙인대요. 첫 손님 자리에요. …형 자리예요.',
        "…First customer. (Harin took a photo in the end. Three at the counter.)\n\nShe said she wouldn't film, and then she took one. That's fine. It's not for posting, she says. It goes on the shop wall. Where the first customer sits. …That's your seat, hyeong.",
      ],
    },
  },

  // ── N08-3 「조타실의 딸」 · 고해나 (배를 내놓는 이야기는 N08-4 — 여기서는 해나의 걱정까지만) ──
  'N08-3': {
    offer: [
      d('ask_why', '요리학교 얘기하던 분이 조타 연습은 왜 합니까?', "You were talking about cooking school. Why helm practice?",
        '둘 다 하면 안 돼요? (웃는다.) 칼도 키도 다 아빠 배에서 본 거예요.\n\n그리고… 아빠가 키를 못 잡는 날이 언젠가 오잖아요. 그날 누가 잡아요. 요즘 그 생각이 자꾸 나요. 그러니까 한 항차만요.',
        "Can't I do both? (She laughs.) The knife and the wheel, I saw both on Dad's boat.\n\nAnd… someday there'll be a day Dad can't take the wheel. Who takes it then? I keep thinking about that lately. So just one trip.",
        { affinity: 0.03, flag: 'choice.n08_3_asked_why' }),
      d('ask_secret', '선장님이 아실 거라면서, 왜 몰래 하십니까?', "If your father will know anyway, why do it behind his back?",
        '알아도 모른 척하는 게 아빠 방식이에요. 대놓고 하면 아빠는 말려야 하잖아요. 선장이니까. (조타실 쪽을 힐끔 본다.)\n\n몰래 하면 아빠는 안 본 걸로 할 수 있어요. 그게 아빠가 허락하는 방법이에요. 이상하죠. 그래서 한 항차만 옆에 있어 줘요.',
        "Knowing and pretending not to is Dad's way. If I did it openly, he'd have to stop me. He's the skipper. (She glances toward the wheelhouse.)\n\nIf I do it behind his back, he can act like he never saw. That's how he says yes. Strange, right? So stay beside me for one trip.",
        { affinity: 0.04, flag: 'choice.n08_3_asked_secret' }),
      d('worry', '승객도 타는데, 연습해도 괜찮겠습니까?', "There'll be passengers aboard. Is it safe to practise?",
        '그래서 옆에 있어 달라는 거예요. 혼자면 안 하죠. (구명조끼를 두 개 꺼내 하나를 내민다.)\n\n속도는 안 낼게요. 물 잔잔한 데서만 돌려요. 위험하면 바로 아빠 불러요. 아빠는 뱃머리에 있을 거예요. 등 돌리고요.',
        "That's exactly why I'm asking you to stay beside me. I wouldn't do it alone. (She takes out two life jackets and hands me one.)\n\nI won't push the speed. Only turns in calm water. If it gets dangerous, we call Dad straight away. He'll be at the bow. With his back turned.",
        { affinity: 0.02 }),
      d('accept', '옆에 있겠습니다. 키는 해나 씨가 잡으십시오.', "I'll be right beside you. The wheel's yours, Haena.",
        '…고마워요. 그 말 듣고 싶었어요. 키는 제가, 낚시는 그쪽이요. (키 손잡이를 한 번 쓰다듬는다.)\n\n방어 있는 자리에 세워 볼게요. 제가 세운 자리에서 그쪽이 올리면, 그게 오늘 제 시험이에요.',
        "…Thank you. I wanted to hear that. I take the wheel, you take the fishing. (She runs a hand over the wheel once.)\n\nI'll try to hold us over the yellowtail. If you bring one up where I put us, that's my test passed for today.",
        { affinity: 0.05 }),
    ],
    completeAdd: [
      d('straight', '동승비는 됐습니다. 곧게 간 배에 탔으면 됐습니다.', "No fare needed. I rode a boat that ran straight. That's enough.",
        '…곧게 갔죠? 그 말 한 번 더 해 줘요. (키를 잡았던 손을 펴 본다. 아직 조금 떨린다.)\n\n처음엔 배가 제 말을 안 들었어요. 힘을 빼니까 그제야 듣더라고요. 옆에 누가 있어서 힘을 뺄 수 있었어요. (그날 사진이 방어진 부두에 돈다. 사진 구석에 내가 있다.)',
        "…It ran straight, didn't it? Say that one more time. (She opens the hand that held the wheel. It still trembles a little.)\n\nAt first the boat wouldn't listen to me. Only when I loosened my grip did it listen. I could loosen it because someone was beside me. (The photo from that day goes round the Bangeojin docks. I'm in the corner of it.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      lesson: [
        '진짜요? 그럼 저 선장 해도 되겠다. (배를 읽는 감각이 다르다.)\n\n변침은 키보다 눈이 먼저예요. 뱃머리 앞에 점 하나를 정해 두고 그걸 보면서 돌려요. 키만 보면 배가 뱀처럼 가요. 아빠 등 보고 배운 거예요.',
        "Really? Then maybe I could skipper after all. (My feel for reading the boat changes.)\n\nWith a course change, your eyes go before the wheel. Pick a point ahead of the bow and turn while you watch it. Watch only the wheel and the boat snakes. I learned it from watching Dad's back.",
      ],
      photo: [
        '…안 돼요. 아니, 돼요. 보여 줘요. (선장이 사진을 오래 봤다. 아무 말도 안 했다.)\n\n아무 말도 안 했죠? 그게 아빠예요. 싫으면 바로 말해요. 말 안 하는 건… 좋다는 거예요. 저 그거 스물네 해 걸려서 배웠어요.',
        "…No. No — yes. Show him. (The skipper looked at it a long time. He said nothing.)\n\nHe didn't say anything, right? That's Dad. If he hates something he says so straight away. Saying nothing means… he likes it. It took me twenty-four years to learn that.",
      ],
      pay: [
        '아… 네. (자기 용돈으로 준다.)\n\n…옆에 있어 달라고 한 건 저니까 맞아요. 부탁하면 값을 내는 거래요. 아빠가 늘 그렇게 말해요. 이게 제 첫 값이네요. 용돈이라 좀 가볍지만요.',
        "Ah… right. (She pays out of her pocket money.)\n\n…I'm the one who asked you to stay beside me, so you're right. Ask a favour, pay for it. Dad always says so. This is the first time I've paid for one. It's pocket money, so it's a bit light.",
      ],
    },
  },

  // ── N09-4 「구룡포의 봄」 · 이수연 (식당 이름은 끝낼 때 처음 나온다 — 받는 자리에서는 말하지 않는다) ──
  'N09-4': {
    offer: [
      d('ask_boat', '아버님 배를 파셨다니… 괜찮으십니까?', "You sold your father's boat… are you all right?",
        '…모르겠어요. (대답하기 전에 오래 바다를 본다.) 묶어 두기만 하는 것보다는 나아요.\n\n그 돈으로 부엌을 해요. 봄이 말대로요. 첫 상은 아빠 칼로 차리고 싶어요. 손질해 줘요.',
        "…I don't know. (She looks at the sea a long time before answering.) It's better than leaving it tied up.\n\nWe're making a kitchen with the money. Like Bom said. I want the first table set with Dad's knife. Please dress the fish.",
        { affinity: 0.03, flag: 'choice.n09_4_asked_boat' }),
      d('ask_restaurant', '식당이요? 두 분이서 하시는 겁니까?', "A restaurant? The two of you will run it?",
        '…네. 봄이는 요리, 저는… 아직 몰라요. 봄이가 그러는데, 저는 생선 고르는 거래요. (고개를 조금 끄덕인다. 마음에 드는 모양이다.)\n\n개업 상에는 원물 한 마리가 올라가야 한대요. 그건 부탁해요. 아빠 칼로요.',
        "…Yes. Bom cooks, and me… I don't know yet. Bom says my job is picking the fish. (She nods slightly. She seems to like that.)\n\nShe says the opening table needs a whole fish on it. That part I'm asking you for. With Dad's knife.",
        { affinity: 0.04, flag: 'choice.n09_4_asked_restaurant' }),
      d('unsure', '아버님 칼을 제가 써도 되겠습니까?', "Is it all right for me to use your father's knife?",
        '…써야 해요. 서랍에만 있으면 칼이 아니에요. (천에 싼 칼을 내민다. 손잡이가 닳아 반들거린다.)\n\n저는 아직 손이 떨려요. 그래서 부탁해요. 첫 상은 그 칼로요.',
        "…It has to be used. Kept in a drawer, it isn't a knife. (She holds out a knife wrapped in cloth. The handle is worn smooth.)\n\nMy hands still shake. That's why I'm asking. The first table, with that knife.",
        { affinity: 0.03 }),
      d('accept', '개업 상이라면 제가 맡겠습니다. 제일 좋은 놈으로요.', "If it's for the opening table, leave it to me. The best one there is.",
        '…고마워요. (짧게 말하고, 이번에는 조금 웃는다.)\n\n봄이가 벌써 상 차릴 자리를 닦고 있어요. 세 번째 닦는 거예요. 원물만 오면 돼요. 아빠 칼은 여기 있어요.',
        "…Thank you. (She says it briefly, and this time smiles a little.)\n\nBom's already wiping down the spot for the table. That's the third time. All we need is the fish. Dad's knife is right here.",
        { affinity: 0.05 }),
    ],
    completeAdd: [
      d('ask_name', '구룡포의 봄. 봄 씨 이름에서 딴 겁니까?', "Spring in Guryongpo. Is that from Bom's name?",
        '…봄이는 아니래요. 계절 봄이래요. (봄 쪽을 본다. 봄은 딴청을 피운다.)\n\n저는 둘 다라고 생각해요. 그래서 반대 안 했어요. 이름 하나에 뜻이 둘이면, 안 잊어버리잖아요.',
        "…Bom says no. She says it's spring, the season. (She looks at Bom. Bom pretends to be busy.)\n\nI think it's both. That's why I didn't object. When one name means two things, you don't forget it.",
        { affinity: 0.06, flag: 'choice.n09_4_asked_name' }),
    ],
    completeReply: {
      lesson: [
        '무거운 칼이에요. 힘을 빼야 해요. (손질 등급이 오른다. 그 칼로.)\n\n칼 무게로 자르는 거예요. 손은 방향만 잡아요. 힘을 주면 칼이 아니라 손이 무거워져요. …오늘 손은 가벼워 보였어요.',
        "It's a heavy knife. You have to take the strength out. (My butchery grade rises. With that knife.)\n\nThe weight of the knife does the cutting. Your hand only sets the direction. Push hard and it's your hand that gets heavy, not the knife. …Your hand looked light today.",
      ],
      pay: [
        '…네. 첫 지출이네요. (장부 첫 줄에 손질비라고 적는다.)\n\n장부는 제가 써요. 첫 줄이 손질비라서 좋아요. 이 식당은 손질부터 시작한 거니까요. 잊어버리지 않게요.',
        "…Yes. Our first outgoing. (She writes 'butchery' on the ledger's first line.)\n\nI keep the books. I'm glad the first line says butchery. This restaurant started with the dressing. So we won't forget.",
      ],
      decline: [
        '…봄이 울어요. 저도요, 조금. (식당 벽에 내 이름이 걸린다. 첫 손님.)\n\n울면서 웃는 건 처음이에요. 이상하네요. …첫 손님 이름은 벽에서 안 내려요. 식당이 있는 동안은요.',
        "…Bom's crying. So am I, a little. (My name goes on the restaurant wall. First customer.)\n\nThis is the first time I've cried and laughed at once. Strange. …The first customer's name never comes down off that wall. Not while the restaurant stands.",
      ],
    },
  },

  // ── N06-4 「졸업 대결」 · 모태조 ──
  'N06-4': {
    offer: [
      d('no_mercy', '마지막이라면 제대로 붙겠습니다. 봐 드리지 않습니다.', "If it's the last, I'll give it everything. No going easy.",
        '그래야지. 봐주면 내가 화낸다. 졸업 대결은 봐주는 게 아니야. (손가락 두 개를 편다.)\n\n두 마리. 먼저 올리는 쪽이 아니라 물을 읽고 올리는 쪽이 이기는 거야. 실측 기억나지? 그거 마지막으로 보자.',
        "Good. Go easy and I'll be angry. A graduation match isn't for going easy. (He holds up two fingers.)\n\nTwo fish. It's not whoever lands first, it's whoever reads the water and lands. Remember measuring? Let's see it one last time.",
        { affinity: 0.05 }),
      d('ask_disband', '해산이라니요. 동아리가 아예 없어지는 겁니까?', "Disbanding? The club's really going away?",
        '말 그대로야. 졸업하면 다 흩어져. 이름만 남겨 두는 건 우리 식이 아니야. (어깨를 으쓱한다.)\n\n그래서 마지막 대결이야. 흩어지기 전에 다 같이 한 번 던지는 거. 그 상대가 너고. 부산으로 와.',
        "Just what it sounds like. Once we graduate, everyone scatters. Keeping only the name alive isn't our style. (He shrugs.)\n\nSo it's the last match. One cast together before we scatter. And you're the opponent. Come to Busan.",
        { affinity: 0.03, flag: 'choice.n06_4_asked_disband' }),
      d('ask_why_me', '왜 하필 제가 상대입니까? 동아리 사람도 아닌데요.', "Why me, of all people? I'm not even in the club.",
        '명예 회원이잖아. 그리고 동아리 사람이 아니라서야. 우리끼리 붙으면 다 아는 수라 재미없어. (웃는다. 광기가 조금 보인다.)\n\n밖에서 온 사람한테 지면 그게 진짜 졸업이야. 이기면 더 좋고. 봐주지 마. 두 마리.',
        "You're an honorary member. And it's because you're not in the club. Against each other we know every trick, it's boring. (He grins. A little of the madness shows.)\n\nLose to someone from outside and that's a real graduation. Win, even better. Don't go easy. Two fish.",
        { affinity: 0.04, flag: 'choice.n06_4_asked_why_me' }),
      d('hosu_ball', '호수는 아직도 농구공을 들고 다닙니까?', "Hosu still carries that basketball around?",
        '다녀. 이제 아무도 안 말려. 해산하는 날에도 들고 올 거야. (한숨인지 웃음인지 모를 소리를 낸다.)\n\n호수 말로는 그 공을 옆에 두면 잘 잡힌대. 미신이지. 근데 실측해 보니 틀린 말도 아니더라. 대결 날 공 굴러가면 네가 주워.',
        "He does. Nobody stops him anymore. He'll bring it on the day we disband too. (He makes a noise that could be a sigh or a laugh.)\n\nHosu says fish bite better with the ball beside you. Superstition. But I measured it, and it's not entirely wrong. If the ball rolls off on match day, you fetch it.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('give_hosu', '제 몫은 호수한테 주십시오. 그 녀석은 계속 던질 겁니다.', "Give my share to Hosu. He'll keep on casting.",
        '…호수한테? (농구공을 든 고호수를 본다.) 그래. 저 녀석은 계속 던지겠지. 공은 안 내려놓고.\n\n네 몫이었으니 네 손으로 줘. 내가 주면 졸업 선물이고, 네가 주면 형이 주는 거야. (고호수가 농구공을 떨어뜨릴 뻔한다. 부산 방파제에 그 얘기가 돈다.)',
        "…To Hosu? (He looks at Go Hosu, basketball in hand.) Right. That kid will keep casting. Without ever putting the ball down.\n\nIt was your share, so give it with your own hands. From me it's a graduation present. From you it's from a big brother. (Go Hosu nearly drops the basketball. The story goes round the Busan breakwaters.)",
        { affinity: 0.06, harborRep: 2, affinityOther: [{ npcId: 'go_hosu', delta: 0.1 }], flag: 'choice.n06_4_gave_hosu' }),
    ],
    completeReply: {
      honor: [
        '써. 던지라고 주는 거야. (루어 상자 안에 씨바스터즈 스티커가 붙어 있다.)\n\n상자에서 하나씩 꺼내 쓸 때마다 이 동아리 생각해. 그거면 돼. 해산해도 루어는 물에 들어가잖아. 그게 우리 식 졸업이야.',
        "Use it. It's given to be cast. (There's a Seabusters sticker inside the lure box.)\n\nEvery time you take one out, think of this club. That's all. We disband, but the lures still go in the water. That's our kind of graduation.",
      ],
      lesson: [
        '광기? …이거야. 탁수에서 컬러 고르는 법. (루어 컬러 선택이 몸에 붙는다.)\n\n표에 없는 거 하나 줄게. 흙탕물까지 가면 밝은 색도 안 보여. 그땐 검은색이야. 윤곽만 남거든. 이건 아무한테도 안 알려 줬어. 마지막이니까.',
        "Madness? …This. Picking colour in dirty water. (Lure colour choice settles into my body.)\n\nHere's one that's not on the chart. Once it turns to proper mud, even bright colours vanish. Then it's black. Only the outline's left. I never told anyone that. It's the last time, so.",
      ],
      pay: [
        '있지. 회비 남은 거 전부. (동전이 많다. 그래도 전부다.)\n\n해산하면 남은 회비는 쓸 데가 없어. 다들 라면값 아껴서 넣은 동전이야. 함부로 쓰지 마. 그 동전들 다 농어 냄새 나.',
        "There is. Everything left in the dues. (Mostly coins. But all of it.)\n\nOnce we disband, leftover dues are no use to anyone. These are coins everyone saved off ramyeon money. Don't spend them carelessly. Every one of them smells of sea bass.",
      ],
    },
  },

  // ── N08-4 「배를 내놓을까 한다」 · 고만석 (결정은 아직 — 끝까지 열어 둔다) ──
  'N08-4': {
    offer: [
      d('listen', '가겠습니다. 끝까지 듣겠습니다.', "I'll come. I'll hear you out to the end.",
        '…끝까지 들을 만큼 긴 얘기는 아니다. 배를 내놓을까 한다. 그게 다야. (말해 놓고 주머니만 뒤진다. 찾는 게 없다.)\n\n그래도 와. 혼자 하면 혼잣말이고, 들은 놈이 있으면 말이 된다. 바다 나가서 하자. 오늘 물이 좋을 것 같다.',
        "…It's not long enough to need hearing out. I'm thinking of putting the boat up. That's all. (Having said it, he only rummages through his pockets. He isn't looking for anything.)\n\nCome anyway. Said alone it's talking to yourself. With someone who heard, it's been said. We'll talk out at sea. The water looks good today.",
        { affinity: 0.05 }),
      d('ask_why', '왜 갑자기 그런 생각을 하셨습니까?', "What made you think of that all of a sudden?",
        '갑자기 아니다. 오래 했다. 말을 안 했을 뿐이지. (손바닥을 펴 본다. 굳은살이 두껍다.)\n\n이유는 와서 들어. 여기서 말하면 반만 말하게 된다. 배 위에서 말해야 다 나와. 그래서 부르는 거다.',
        "It's not sudden. I've thought it a long time. I just never said it. (He opens his palm and looks at it. The calluses are thick.)\n\nCome and hear the reasons. Say it here and I'll only say half. On the boat it all comes out. That's why I'm calling you.",
        { affinity: 0.04, flag: 'choice.n08_4_asked_why' }),
      d('ask_haena', '해나 씨가 정말 모를까요?', "Does Haena really not know?",
        '…알 거다. 그 애는 내 등만 봐도 안다. (조타실 쪽을 한 번 본다.)\n\n그래서 아직 말을 못 했다. 아는 사람한테 하는 말이 제일 어렵다. 일단 너한테 먼저 해 보는 거다. 와.',
        "…She'll know. She can read me from my back alone. (He glances once toward the wheelhouse.)\n\nThat's why I haven't told her yet. The hardest thing is telling someone who already knows. So I'm trying it on you first. Come.",
        { affinity: 0.03, flag: 'choice.n08_4_asked_haena' }),
      d('oppose', '고래마루를 파신다니, 저는 반대입니다.', "Sell the Goraemaru? I'm against it.",
        '반대? (험상궂은 눈이 조금 풀린다.) 반대하는 놈이 하나 있으니 좋네. 아직 정한 거 없다.\n\n반대든 찬성이든 다 듣고 나서 해. 그게 순서다. 오늘 와서 들어. 반대는 그다음에 해.',
        "Against it? (His fierce eyes ease a little.) Good to have one person against it. Nothing's decided yet.\n\nFor or against, do it after you've heard everything. That's the order. Come and listen today. Be against it after.",
        { affinity: 0.03, flag: 'choice.n08_4_opposed' }),
    ],
    completeAdd: [
      d('leave_for_boat', '오늘 몫은 배에 두겠습니다. 이 배를 위해 쓰십시오.', "Leave my share with the boat. Spend it on her.",
        '…배에 둔다라. (한참 말이 없다.) 이 배한테 뭘 두고 가는 놈은 오랜만이다.\n\n기름값으로는 안 쓴다. 갑판 판자 하나 갈 때 쓰지. 그럼 네가 밟고 간 자리가 남는다. (그 뒤로 방어진 부두 사람들이 나를 고래마루 사람이라고 부른다.)',
        "…With the boat. (He says nothing for a long while.) Been a long time since anyone left something for her.\n\nIt won't go on fuel. It'll go on a new deck plank. Then the spot where you stood stays. (After that, the people on the Bangeojin docks call me one of the Goraemaru's.)",
        { affinity: 0.1, harborRep: 3 }),
    ],
    completeReply: {
      haena: [
        '…알아. 네가 있으면 말이 나올 것 같아서 불렀다. (그날 저녁 세 사람이 조타실에 앉았다.)\n\n해나는 끝까지 아무 말도 안 했다. 대신 내 컵에 물을 채웠다. 두 번. …그 애 대답은 늘 그런 식이다. 나를 닮아서.',
        "…I know. I called you because I thought I could say it with you here. (That evening the three of us sat in the wheelhouse.)\n\nHaena didn't say a word, start to finish. She filled my cup instead. Twice. …That's how she always answers. She takes after me.",
      ],
      lesson: [
        '…배는 눈으로 보는 게 아니야. 발로 봐. (배를 읽는 감각이 생긴다.)\n\n갑판에 서서 무릎을 풀어. 배가 어디로 기우는지 발바닥이 먼저 안다. 눈은 늦어. 이 배는 왼쪽으로 조금 기운다. 그것까지 알면 다 본 거다.',
        "…You don't look at a boat with your eyes. You look with your feet. (A feel for reading boats settles in.)\n\nStand on the deck and loosen your knees. The soles of your feet know which way she leans before anything else. Eyes are slow. This one lists a little to port. Know that too and you've seen her whole.",
      ],
      pay: [
        '그래. 그 해 최고 조황이니 몫도 크다. (봉투가 두껍다.)\n\n…이런 날 배를 내놓는다는 말을 했으니 우습지. 바다가 붙잡는 건지 놓아주는 건지 모르겠다. 받아. 좋은 날 몫은 좋은 날 받는 거다.',
        "You will. Best haul of the year, so it's a big share. (The envelope is thick.)\n\n…Funny, saying I'll put her up on a day like this. Can't tell if the sea's holding on to me or letting me go. Take it. A good day's share gets taken on the good day.",
      ],
    },
  },
};
