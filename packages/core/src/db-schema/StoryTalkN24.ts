/**
 * @file StoryTalkN24.ts
 * @description 254차 — N24 「건너편 가게」 이어지는 대화. 규칙은 `StoryTalks.ts` 머리 주석.
 *
 * 인물: 문필구(A · 64 · 「필구 찌방」 — 손으로 깎는 찌 「문찌」) · 차영배(B · 52 · 길 건너 「영배 낚시」 — 필구 밑에서 아홉 해를 배운 옛 제자).
 * 숨은 사정(마지막 편에서 드러난다): 문찌의 물방울 몸통은 영배가 깎았다. 필구는 그걸 수첩에 적고 밑에 한 줄을 남겼다 —
 *   「찌톱은 내가 올린다. 몸통은 영배 것이 낫다.」 그러고도 손님에게는 「문찌」라고만 팔았다. 영배는 그 장만 찢어 들고 나갔다.
 *
 * 사용자 예시(254차)와의 대응 — 받는 자리 `N24-2`:
 *   A의 설명 → 「차영배 사장님이 딱히 나쁜 사람 같지는 않던데요」(A ↓) → 「뭐라고? 너는 지금 누구 편을 드는 거냐?」
 *   → 「둘 다 같은 사람인 것 같습니다」 → 「너는 나를 도울 생각이 없는 거지?」
 *   → 「그건 아닙니다만…」 → 「그럼 내가 말하는 대로 우선 영배를 자극해.」
 *   → 「차영배 사장님에게도 의견을 물어봐야 하지 않을까요?」 → 「영배한테 가서, 다 내가 시킨 일이니 그렇다고 해라! 못난 놈!」
 *   진행 중(차영배 앞): 사실대로 말하기 / 감추고 자극하기 → 어느 쪽이든 B ↓ 「뭐라고? 형님이 그랬다고 한들, 너도 매한가지로구나!」
 *   양 끝 사이의 중도(두 사람 얘기를 다 듣기)는 마음이 덜 식고, 마지막 편에서 화해 결말로 가는 단서를 연다.
 *
 * 결말(마지막 편 끝내는 자리 · 어촌계 회의): 단서(찢긴 장을 본 것)가 있으면 화해(정본) · 필구 편 증언이면 영배가 영영 무너진다 ·
 *   못 가리거나 영배 편 말만 하면 아무도 가리지 못한다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, say, endTalk } from './StoryTalkKit.js';

const A = 'mun_pilgu';
const B = 'cha_yeongbae';

export const TALKS_N24: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N24-1 「건너편 찌」 — 받는 자리(문필구)
  // ═══════════════════════════════════════════
  {
    id: 'n24_1_offer', questId: 'N24-1', at: 'offer', npcId: A, start: 'start',
    nodes: {
      start: say(
        '(내 채비 통을 들여다보더니 찌 하나를 집어 든다.) 이거, 건너편에서 샀지? 모양만 내 거다. 속은 아니야.\n\n(진열장에서 똑같이 생긴 찌를 꺼내 나란히 놓는다.) 봐라. 똑같지? 바다에 세워 보면 하나는 서고 하나는 눕는다. 내 거 하나 줄 테니 세워 봐.',
        "(He looks into my tackle box and picks out a float.) You bought this across the street, didn't you? Only the shape is mine. Not what's inside.\n\n(He takes an identical float from the case and sets the two side by side.) Look. Same, aren't they? Stand them in the sea and one stands while the other lies down. I'll give you one of mine. Stand it.",
        [
          opt('stand', '세워 보겠습니다. 어떻게 서는지 보고 오죠.', "I'll stand it in the water and come back and tell you.",
            { stance: 'giver', aff: { [A]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '그래. 서는 걸 보면 너도 안다. (찌를 손바닥에 쥐여 준다.) 파도 칠 때 봐라. 잔잔할 땐 아무 찌나 선다.',
              lineEn: "Good. Once you see it stand, you'll know. (He presses the float into my palm.) Watch it when the waves come. Any float stands in flat water." }) }),
          opt('who_first', '두 개가 정말 똑같네요. 어느 쪽이 먼저입니까?', 'They really are identical. Which one came first?',
            { stance: 'mid', next: 'who_first' }),
          opt('same_same', '싸서 샀을 뿐입니다. 찌가 다 거기서 거기 아닙니까?', "I only bought it because it was cheap. Aren't floats all much the same?",
            { stance: 'self', aff: { [A]: -0.04 }, next: 'same_same' }),
          opt('no_feud', '가게 싸움에 끼고 싶진 않은데요.', "I'd rather not get caught up in a shop feud.",
            { stance: 'self', aff: { [A]: -0.03 }, end: endTalk({ decline: true,
              lineKo: '…누가 싸운대. 찌 얘기 하는 거다. 됐다, 가 봐라.',
              lineEn: "...Who said anything about a feud? We're talking about floats. Fine, off you go." }) }),
        ]),
      who_first: say(
        '먼저? (코웃음을 친다.) 이 골목에서 찌 깎은 지 사십 년이다. 건너편 간판은 십 년도 안 됐어.\n\n누가 먼저인지는 간판 날짜가 말해 준다. 서는 건 물이 말해 주고. 세워 봐.',
        "First? (He snorts.) I've been carving floats in this alley for forty years. That sign across the street isn't ten years old.\n\nThe date on the sign tells you who came first. The water tells you which one stands. Stand it.",
        [
          opt('water_says', '간판 날짜보다 물이 정확하겠지요. 세워 보겠습니다.', "The water's more honest than a sign. I'll stand it.",
            { stance: 'mid', aff: { [A]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '말 한번 맞게 하네. 물은 거짓말을 안 해. (찌를 손바닥에 쥐여 준다.)',
              lineEn: "Now that's a sensible thing to say. Water doesn't lie. (He presses the float into my palm.)" }) }),
          opt('ask_b', '건너편 사장님께도 여쭤봐도 되겠습니까?', 'Would it be all right if I asked the owner across the street too?',
            { stance: 'other', aff: { [A]: -0.03 }, end: endTalk({ accept: true,
              lineKo: '(입을 꾹 다문다.) …물어보든가. 그놈이 뭐라 하든 찌는 물에 세워 봐야 안다.',
              lineEn: "(He presses his lips together.) ...Ask, then. Whatever he says, you only know a float once it's in the water." }) }),
        ]),
      same_same: say(
        '거기서 거기? (찌를 도로 빼앗듯 집어 든다.) 너 같은 손님 때문에 건너편이 장사가 되는 거다.\n\n찌는 물속 고기가 보는 게 아니라 물 위 사람이 보는 거야. 기울면 입질을 못 본다. 한 번만 세워 보고 다시 말해.',
        "Much the same? (He all but snatches the float back.) It's customers like you that keep that place across the street in business.\n\nA float isn't for the fish to see. It's for the person above the water. If it leans, you miss the bite. Stand it once, then say that again.",
        [
          opt('try_once', '알겠습니다. 한 번 세워 보고 말씀드리죠.', "All right. I'll stand it once and tell you.",
            { stance: 'mid', aff: { [A]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '그래. 그거면 된다. (찌를 다시 내민다.)',
              lineEn: "Right. That's all I ask. (He holds the float out again.)" }) }),
          opt('my_money', '제 돈으로 산 찌는 제가 판단하겠습니다.', "I'll judge the floats I buy with my own money.",
            { stance: 'self', aff: { [A]: -0.05 }, end: endTalk({ decline: true,
              lineKo: '…그래, 네 돈이지. 가라. (진열장 문이 탁 닫힌다.)',
              lineEn: "...Right, it's your money. Go. (The display case snaps shut.)" }) }),
        ]),
    },
  },

  // N24-1 — 진행 중: 길 건너 차영배와의 첫 만남(목표 1)
  {
    id: 'n24_1_meet_b', questId: 'N24-1', at: 'objective', objectiveIndex: 1, npcId: B, start: 'start',
    nodes: {
      start: say(
        '(진열장을 닦다가 고개를 든다.) 어서 와요. 아까 저 건너에서 한참 붙잡혀 있던데. 우리 집 찌 얘기 들었죠?\n\n(웃는다.) 괜찮아요. 그 양반 말은 반은 맞아. 근데 반은 그 양반이 모르는 얘기고.',
        "(He looks up from wiping the display case.) Come on in. You were stuck over there a good while just now. You heard about my floats, I suppose?\n\n(He laughs.) It's fine. Half of what he says is right. The other half is a story he doesn't know.",
        [
          opt('half', '모르는 얘기라니요?', "A story he doesn't know?", { stance: 'mid', next: 'half' }),
          opt('his_stands', '필구 사장님 찌가 물에서 더 잘 서던데요.', "Mr. Mun's float stood better in the water.",
            { stance: 'giver', aff: { [B]: -0.04 }, next: 'stands' }),
          opt('cheap_good', '찌가 싸서 좋습니다. 계속 여기서 살게요.', "Your floats are cheap, I like that. I'll keep buying here.",
            { stance: 'other', aff: { [B]: 0.04, [A]: -0.02 }, next: 'cheap' }),
        ]),
      half: say(
        '(진열장 유리를 손가락으로 톡톡 친다.) 그 찌 몸통, 누가 깎았는지 그 양반이 말 안 하죠? …됐어요. 오래된 얘기예요.\n\n궁금하면 나중에 다시 와요. 오늘은 찌나 하나 더 사 가든가.',
        "(He taps the glass of the case with a finger.) The body of that float — he doesn't tell you who carved it, does he? ...Never mind. It's an old story.\n\nIf you're curious, come back another time. Today, maybe just buy another float.",
        [
          opt('later', '다음에 다시 듣겠습니다.', "I'll come back and hear it another time.",
            { stance: 'mid', aff: { [B]: 0.02 }, flags: ['choice.n24_b_hint'], end: endTalk({
              lineKo: '(손을 흔든다.) 그 양반한테는 내가 웃더라고만 전해요.',
              lineEn: '(He waves.) Just tell him I was laughing.' }) }),
          opt('dont_tease', '말씀 안 하실 거면 처음부터 꺼내지 마시지요.', "If you won't tell me, you shouldn't have brought it up.",
            { stance: 'self', aff: { [B]: -0.03 }, end: endTalk({
              lineKo: '(웃음이 조금 식는다.) …맞는 말이네. 미안해요.',
              lineEn: "(His smile cools a little.) ...Fair enough. Sorry." }) }),
        ]),
      stands: say(
        '(잠깐 말이 없다가 웃는다.) 그렇지. 그 양반 찌는 서. 오동나무를 삼 년 말리니까.\n\n우리 집 건 공장 몸통이야. 내가 깎을 시간이 없어서. 그래도 그 모양은 내가 그 양반보다 먼저 냈어요. 그건 알아 둬요.',
        "(He's quiet for a moment, then laughs.) Right. His floats stand. He dries the paulownia for three years.\n\nMine have factory bodies. I don't have the time to carve them. But I came up with that shape before he did. Know that much.",
        [
          opt('first', '먼저 내셨다고요?', 'You came up with it first?',
            { stance: 'mid', flags: ['choice.n24_b_hint'], end: endTalk({
              lineKo: '(손사래를 친다.) 오래된 얘기예요. 그 양반 앞에선 꺼내지 마요. 또 한 시간 붙잡혀요.',
              lineEn: "(He waves it away.) It's an old story. Don't bring it up in front of him. You'll be stuck there another hour." }) }),
          opt('must_stand', '모양만 같으면 뭐 합니까. 서야 찌지요.', "What good is the shape? A float has to stand.",
            { stance: 'giver', aff: { [B]: -0.04, [A]: 0.02 }, end: endTalk({
              lineKo: '(웃음기가 가신다.) …그 양반 말투가 벌써 옮았네. 잘 가요.',
              lineEn: "(The smile leaves his face.) ...You've caught his way of talking already. Goodbye." }) }),
        ]),
      cheap: say(
        '(활짝 웃는다.) 고마워요. 우리 집은 손님 주머니를 생각해요. 찌는 잃어버리는 물건이거든.\n\n(길 건너를 슬쩍 본다.) 근데 저 양반, 지금 저쪽 유리문 뒤에서 다 보고 있어요. 나 때문에 욕먹겠네.',
        "(He beams.) Thank you. This shop thinks about its customers' pockets. Floats are things you lose.\n\n(He glances across the street.) But he's watching all this from behind his glass door right now. You'll get an earful because of me.",
        [
          opt('my_choice', '보든 말든 제가 살 물건은 제가 고르죠.', "Let him watch. I choose what I buy.",
            { stance: 'other', aff: { [B]: 0.03, [A]: -0.03 }, end: endTalk({
              lineKo: '(웃는다.) 시원하네. 다음에 또 와요.',
              lineEn: "(He laughs.) That's refreshing. Come again." }) }),
          opt('bow_across', '(길 건너에 꾸벅 고개를 숙인다.)', '(I give a little bow across the street.)',
            { stance: 'mid', aff: { [A]: 0.02 }, end: endTalk({
              lineKo: '(덩달아 웃는다.) 그 양반, 저거 보고 더 화낼걸요.',
              lineEn: "(He laughs along.) He'll be even angrier for that, you know." }) }),
        ]),
    },
  },

  // N24-1 — 끝내는 자리(문필구)
  {
    id: 'n24_1_done', questId: 'N24-1', at: 'complete', npcId: A, start: 'start',
    nodes: {
      start: say(
        '(내가 들어서자마자 묻는다.) 섰지? 바로 섰지? 내 찌는 파도가 쳐도 고개를 안 숙여.\n\n…건너편엔 들렀고? 그놈이 뭐라더냐.',
        "(He asks the moment I walk in.) It stood, didn't it? Straight up? My floats don't bow their heads even in the waves.\n\n...And you stopped in across the street? What did he say?",
        [
          opt('stood', '똑바로 서더군요. 건너편 찌와는 확실히 달랐습니다.', 'It stood straight. Nothing like the one from across the street.',
            { stance: 'giver', aff: { [A]: 0.05 }, next: 'pleased' }),
          opt('body', '차영배 사장님이 그 모양은 자기가 먼저 냈다던데요.', 'Mr. Cha says he came up with that shape first.',
            { stance: 'other', aff: { [A]: -0.06 }, requires: { flag: 'choice.n24_b_hint' }, next: 'body' }),
          opt('both', '두 분 다 상대 얘기를 하시더군요.', 'You both talk about each other, you know.',
            { stance: 'mid', next: 'both' }),
        ]),
      pleased: say(
        '(처음으로 웃는다.) 그렇지. 오동을 삼 년 말려 깎은 거다. 공장 몸통하고 같을 리가 있냐.\n\n그놈한테 다음에 가거든 전해라. 모양 베낀다고 찌가 서는 거 아니라고.',
        "(He smiles for the first time.) Of course. That's paulownia dried three years before carving. How could it be the same as a factory body?\n\nNext time you go over there, tell him. Copying the shape doesn't make a float stand.",
        [
          opt('will_tell', '전해 드리지요.', "I'll pass it on.",
            { stance: 'giver', end: endTalk({ complete: 'float',
              lineKo: '(찌 두 개를 봉투에 넣어 준다.) 이건 파는 거 아니다. 바다에서 써.',
              lineEn: "(He puts two floats in a bag for me.) These aren't for sale. Use them at sea." }) }),
          opt('say_yourself', '직접 하시는 게 낫지 않겠습니까.', "Wouldn't it be better to tell him yourself?",
            { stance: 'self', aff: { [A]: -0.02 }, end: endTalk({ complete: 'pay',
              lineKo: '…길 하나 건너는 데 이십 년 걸린다. 너는 몰라. (봉투를 건넨다.)',
              lineEn: "...Crossing one street can take twenty years. You wouldn't know. (He hands me an envelope.)" }) }),
        ]),
      body: say(
        '(찌를 쥔 손이 멈춘다.) …그놈이 그러더냐. (한참 말이 없다.)\n\n모양 낸 손은 그놈 손이어도, 그 모양을 찌로 만든 건 내 수첩이다. 그만 가 봐라. 오늘은 장사 접어야겠다.',
        "(The hand holding the float stops.) ...He said that? (He's silent for a long while.)\n\nThe hand that shaped it may have been his, but what made that shape a float was my notebook. Go on now. I think I'll close up for today.",
        [
          opt('sorry', '괜한 말을 전했나 봅니다. 죄송합니다.', "Maybe I shouldn't have passed that on. I'm sorry.",
            { stance: 'giver', aff: { [A]: 0.03 }, end: endTalk({ complete: 'pay',
              lineKo: '(고개를 젓는다.) 네가 죄송할 일은 아니다. 수고비다, 받아라.',
              lineEn: "(He shakes his head.) It's not you who should be sorry. Here's your fee. Take it." }) }),
          opt('notebook', '수첩이라니요?', 'Your notebook?',
            { stance: 'mid', flags: ['choice.n24_heard_notebook'], end: endTalk({ complete: 'learn',
              lineKo: '(말해 놓고 아차 하는 얼굴이다.) …아무것도 아니다. 찌 보는 법이나 알려 주마. (찌를 손가락에 세워 기울기를 보여 준다.)',
              lineEn: "(He looks as if he wishes he hadn't said it.) ...It's nothing. I'll show you how to read a float instead. (He balances a float on his finger to show the lean.)" }) }),
        ]),
      both: say(
        '(코웃음.) 그놈이 내 얘기를 해? 뭐라고. 아니, 듣기 싫다.\n\n(진열장을 닦던 걸레를 내려놓는다.) 찌는 섰지? 그거면 됐다.',
        "(He snorts.) He talks about me? Saying what? No. I don't want to hear it.\n\n(He puts down the rag he was wiping the case with.) The float stood, didn't it? That's enough.",
        [
          opt('it_stood', '섰습니다. 확실히요.', 'It stood. No doubt about it.',
            { stance: 'giver', aff: { [A]: 0.02 }, end: endTalk({ complete: 'pay',
              lineKo: '그래. 그거면 됐다. (봉투를 건넨다.)',
              lineEn: "Right. That's enough, then. (He hands me an envelope.)" }) }),
          opt('sit_down', '두 분이 한번 마주 앉으시면 좋겠습니다.', 'I wish the two of you would sit down together sometime.',
            { stance: 'mid', aff: { [A]: -0.02 }, end: endTalk({ complete: 'pay',
              lineKo: '(대답 대신 봉투를 내민다. 문에 달린 종이 오래 흔들린다.)',
              lineEn: '(Instead of answering he holds out an envelope. The bell on the door sways for a long time.)' }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N24-2 「원조」 — 받는 자리(문필구) · 사용자 예시 그대로
  // ═══════════════════════════════════════════
  {
    id: 'n24_2_offer', questId: 'N24-2', at: 'offer', npcId: A, start: 'start',
    nodes: {
      start: say(
        '(유리문의 종이를 손가락으로 두드린다.) 봤냐. 「원조는 여기 하나뿐」. 내가 붙였다. 건너편 놈이 먼저 「원조 문찌」를 써 붙였거든.\n\n그놈, 내 밑에서 아홉 해를 배웠다. 밥 먹여 가며 칼 쥐는 법부터 가르쳤어. 그러다 하루아침에 나가서 길 건너에 똑같은 간판을 달았다. 내 찌 모양 그대로, 반값에.',
        "(He taps the notice on the glass door.) See that? There is only one original, and it is here. I put that up. Because the one across the street put up The original Mun float first.\n\nNine years he learned under me. I fed him and taught him from how to hold a knife. Then one morning he walked out and hung the same sign across the street. My float's shape exactly, at half the price.",
        [
          opt('too_far', '그건 너무했네요. 배운 집 앞에 같은 간판이라니요.', 'That was going too far. The same sign right in front of the shop that taught him.',
            { stance: 'giver', aff: { [A]: 0.05 }, next: 'plan' }),
          opt('not_bad', '그래도 차영배 사장님이 딱히 나쁜 사람 같지는 않던데요.', "Still, Mr. Cha didn't strike me as a bad man.",
            { stance: 'other', aff: { [A]: -0.08 }, next: 'whose_side' }),
          opt('listen', '두 분 사이에 무슨 일이 있었는지 더 듣고 싶습니다.', "I'd like to hear more about what happened between you two.",
            { stance: 'mid', aff: { [A]: -0.01 }, flags: ['choice.n24_heard_notebook'], next: 'listen' }),
          opt('stay_out', '남의 가게 싸움에 끼고 싶지 않습니다.', "I don't want to get caught up in someone else's shop feud.",
            { stance: 'self', aff: { [A]: -0.04 }, end: endTalk({ decline: true,
              lineKo: '…싸움이라. 그래, 너한텐 싸움으로 보이겠지. 가 봐라.',
              lineEn: "...A feud. Right, I suppose that's how it looks to you. Off you go." }) }),
        ]),
      whose_side: say(
        '뭐라고? (의자를 밀고 일어선다.) 너는 지금 누구 편을 드는 거냐? 영배 그놈이 잘한 게 뭐가 있다고!\n\n남의 찌 모양 가져다 반값에 판 놈이야. 그게 나쁜 사람이 아니면 누가 나쁜 사람이냐.',
        "What? (He pushes back his chair and stands.) Whose side are you on? What has Yeongbae ever done right?\n\nHe took another man's float and sold it at half price. If that's not a bad man, who is?",
        [
          opt('apologize', '제가 말이 짧았습니다. 사장님 얘기를 더 듣겠습니다.', 'I spoke too quickly. I\'ll hear you out.',
            { stance: 'giver', aff: { [A]: 0.03 }, next: 'plan' }),
          opt('both_same', '둘 다 같은 사람인 것 같습니다.', 'You two seem like the same kind of man to me.',
            { stance: 'mid', aff: { [A]: -0.06 }, next: 'no_help' }),
          opt('silent', '(아무 말 없이 고개를 숙인다.)', '(I lower my head and say nothing.)',
            { stance: 'self', next: 'plan' }),
        ]),
      no_help: say(
        '(한참 나를 노려본다.) …너는 나를 도울 생각이 없는 거지?',
        "(He glares at me for a long while.) ...You've got no intention of helping me, have you?",
        [
          opt('not_that', '그건 아닙니다만…', "That's not it, but...",
            { stance: 'mid', end: endTalk({ accept: true,
              lineKo: '그럼 내가 말하는 대로 우선 영배를 자극해. (찌 하나를 탁자에 탁 내려놓는다.)\n\n그놈 찌로 한 마리 낚아서 눕는 걸 봐 두고, 그놈 가게에 가서 물어. 원조라면서 왜 눕느냐고. 얼굴이 시뻘게질 거다.',
              lineEn: "Then do as I say. Get under Yeongbae's skin first. (He slaps a float down on the table.)\n\nCatch one on his float and watch it lie down, then go to his shop and ask him. If it's the original, why does it lie down? His face will go red." }) }),
          opt('ask_him', '차영배 사장님에게도 의견을 물어봐야 하지 않을까요?', 'Shouldn\'t we ask Mr. Cha what he thinks too?',
            { stance: 'other', aff: { [A]: -0.08 }, flags: ['choice.n24_mission_tell'], end: endTalk({ accept: true,
              lineKo: '(탁자를 내리친다.) 영배한테 가서, 다 내가 시킨 일이니 그렇다고 해라! 못난 놈!\n\n(문 쪽으로 턱짓을 한다.) 가. 그놈 찌로 한 마리 낚아 보고, 가서 그놈 얼굴이나 보고 와.',
              lineEn: "(He slams the table.) Then go to Yeongbae and tell him this was all my doing! Useless boy!\n\n(He jerks his chin at the door.) Go. Catch one on his float, then go and look him in the face." }) }),
          opt('leave', '(대답하지 않고 일어선다.)', '(I stand up without answering.)',
            { stance: 'self', aff: { [A]: -0.04 }, end: endTalk({ decline: true,
              lineKo: '(등 뒤로 혀 차는 소리가 들린다.) …다들 그렇지. 가라.',
              lineEn: "(I hear him click his tongue behind me.) ...They're all the same. Go." }) }),
        ]),
      listen: say(
        '(한숨을 쉰다.) 들어서 뭐 하게. …아홉 해다. 손이 빨랐어. 내가 깎은 걸 한 번 보면 그대로 깎았지.\n\n그런 놈이 어느 날 내 작업 수첩에서 한 장을 찢어 들고 나갔다. 그 수첩에 문찌가 다 들어 있었어. 그러니 원조를 써 붙이지.',
        "(He sighs.) What good will hearing it do? ...Nine years. Quick hands. Show him something I'd carved once and he'd carve it the same.\n\nThen one day he tore a page out of my workshop notebook and walked out with it. Everything about the Mun float was in that notebook. No wonder he puts up 'the original.'",
        [
          opt('theft', '수첩을 찢어 갔다고요? 그건 도둑질 아닙니까.', "He tore it out of your notebook? Isn't that theft?",
            { stance: 'giver', aff: { [A]: 0.04 }, next: 'plan' }),
          opt('his_hand', '그 수첩에 차영배 사장님 손이 간 건 없습니까?', "Is there nothing in that notebook from Mr. Cha's own hand?",
            { stance: 'other', aff: { [A]: -0.07 }, next: 'whose_side' }),
          opt('what_want', '그래서 저한테 바라시는 게 뭡니까?', 'So what is it you want from me?',
            { stance: 'mid', next: 'plan' }),
        ]),
      plan: say(
        '(목소리를 낮춘다.) 그놈 찌로 한 마리 낚아 봐라. 파도에 어떻게 눕는지 네 눈으로 보는 거다.\n\n그다음에 그놈 가게에 가서 물어. 원조라면서 왜 눕느냐고. 그 얼굴만 보고 와. 그거면 된다.',
        "(He lowers his voice.) Catch one on his float. See with your own eyes how it lies down in the waves.\n\nThen go to his shop and ask him. If it's the original, why does it lie down? Just see his face. That's all.",
        [
          opt('will_go', '알겠습니다. 다녀오겠습니다.', "Understood. I'll go.",
            { stance: 'giver', aff: { [A]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '(처음으로 어깨를 두드린다.) 그래. 너는 말이 통하는구나.',
              lineEn: "(For the first time he pats my shoulder.) Good. You and I understand each other." }) }),
          opt('own_words', '가 보겠습니다. 다만 무슨 말을 할지는 제가 정하겠습니다.', "I'll go. But I'll decide what to say myself.",
            { stance: 'mid', aff: { [A]: -0.02 }, end: endTalk({ accept: true,
              lineKo: '(눈을 가늘게 뜬다.) …네 입이니 네가 정하겠지. 대신 빈손으로는 오지 마라.',
              lineEn: "(His eyes narrow.) ...It's your mouth, so I suppose you'll decide. Just don't come back empty-handed." }) }),
          opt('wont', '그런 일이라면 못 하겠습니다.', "If that's the job, I can't do it.",
            { stance: 'self', aff: { [A]: -0.05 }, end: endTalk({ decline: true,
              lineKo: '그래, 깨끗한 손으로 살아라. 나는 이십 년을 더럽혔다.',
              lineEn: "Fine. Keep your hands clean. I've spent twenty years getting mine dirty." }) }),
        ]),
    },
  },

  // N24-2 — 진행 중: 차영배 앞(목표 1). 사실대로 / 감추고 자극 / 중도
  {
    id: 'n24_2_face_b', questId: 'N24-2', at: 'objective', objectiveIndex: 1, npcId: B, start: 'start',
    nodes: {
      start: say(
        '(진열장 너머로 나를 보더니 웃음이 반쯤 걷힌다.) 또 왔네요. 오늘은 얼굴이 심부름 온 얼굴인데.\n\n(유리문에 붙은 「원조 문찌」 종이를 턱으로 가리킨다.) 저거 때문에 왔죠?',
        "(He sees me over the display case and his smile half fades.) You again. Today you've got an errand-boy look about you.\n\n(He nods at the notice on his glass door: The original Mun float.) You're here about that, aren't you?",
        [
          opt('tell_truth', '필구 사장님이 보내셨습니다. 다 자기가 시킨 일이니 그렇게 전하라더군요.', 'Mr. Mun sent me. He said to tell you this is all his doing.',
            { stance: 'giver', aff: { [B]: -0.1 }, flags: ['choice.n24_told_truth'], requires: { flag: 'choice.n24_mission_tell' }, next: 'angry_truth' }),
          opt('provoke', '그 찌, 원조라면서 왜 파도에 눕습니까?', "If that float is the original, why does it lie down in the waves?",
            { stance: 'giver', aff: { [B]: -0.12, [A]: 0.03 }, flags: ['choice.n24_provoked'], next: 'angry_provoke' }),
          opt('honest_mid', '사실은 필구 사장님이 보내셨습니다. 그런데 저는 사장님 얘기도 듣고 싶습니다.', "The truth is Mr. Mun sent me. But I'd like to hear your side too.",
            { stance: 'mid', aff: { [B]: -0.03 }, flags: ['choice.n24_told_truth', 'choice.n24_heard_b'], next: 'confide' }),
          opt('pretend', '그냥 찌 사러 왔습니다.', "I just came to buy a float.",
            { stance: 'self', next: 'pretend' }),
        ]),
      angry_truth: say(
        '뭐라고? (찌를 닦던 손이 멈춘다.) 형님이 그랬다고 한들, 너도 매한가지로구나!\n\n시킨 사람이나 시킨다고 오는 사람이나. 이십 년을 길 건너에서 쳐다보기만 하더니, 이제는 남의 입을 빌려 말하네.',
        "What? (His hand stops on the float he was wiping.) Even if it was Pilgu's doing, you're no better!\n\nThe one who sends and the one who comes when he's sent. Twenty years of staring from across the street, and now he talks through someone else's mouth.",
        [
          opt('just_passed', '전하라는 말만 전했습니다. 판단은 사장님 몫입니다.', "I only passed on what I was told. What you make of it is up to you.",
            { stance: 'mid', aff: { [B]: -0.02 }, end: endTalk({
              lineKo: '(등을 돌린다.) …그래, 전했으면 가요. 오늘은 장사 안 해요.',
              lineEn: "(He turns his back.) ...Fine. If you've passed it on, go. I'm not open today." }) }),
          opt('rude_sorry', '제가 무례했습니다. 사장님 얘기도 듣고 싶습니다.', 'That was rude of me. I want to hear your side too.',
            { stance: 'other', aff: { [B]: 0.04 }, flags: ['choice.n24_heard_b', 'choice.n24_heard_notebook'], next: 'confide_late' }),
        ]),
      angry_provoke: say(
        '(얼굴이 붉어진다.) …누가 시켰는지 안 봐도 알겠네.\n\n뭐라고? 형님이 그랬다고 한들, 너도 매한가지로구나! 남의 가게에 와서 손님들 앞에서 그 말을 해?',
        "(His face reddens.) ...I don't need to ask who put you up to it.\n\nWhat? Even if it was Pilgu's doing, you're no better! Coming into another man's shop and saying that in front of his customers?",
        [
          opt('it_lies', '눕는 건 사실 아닙니까.', "Well, it does lie down, doesn't it?",
            { stance: 'giver', aff: { [B]: -0.05, [A]: 0.03 }, end: endTalk({
              lineKo: '(진열장 유리를 쾅 닫는다.) 나가요. 다신 오지 마요.',
              lineEn: '(He slams the glass case shut.) Get out. Don\'t come back.' }) }),
          opt('too_far_sorry', '말이 지나쳤습니다. 죄송합니다.', 'That went too far. I\'m sorry.',
            { stance: 'mid', aff: { [B]: 0.03 }, next: 'sorry' }),
        ]),
      sorry: say(
        '(숨을 고른다.) …됐어요. 그 양반 말버릇 옮은 거 알아요. 나도 저 집에서 아홉 해 그 말 듣고 살았으니까.\n\n(작게) 눕는 건 맞아요. 공장 몸통이라. 근데 그 몸통 모양을 처음 낸 게 누군지는, 그 양반 수첩이 알아요.',
        "(He catches his breath.) ...Never mind. I know you caught his way of talking. I lived nine years in that shop hearing it too.\n\n(Quietly) It does lie down, that's true. Factory bodies. But who first came up with that body shape, his notebook knows.",
        [
          opt('notebook', '수첩이요?', 'His notebook?',
            { stance: 'mid', flags: ['choice.n24_heard_b', 'choice.n24_heard_notebook'], end: endTalk({
              lineKo: '(고개를 젓는다.) 오늘은 여기까지. 그 양반한테는 내가 화냈다고 전해요. 그래야 좋아하지.',
              lineEn: "(He shakes his head.) That's enough for today. Tell him I got angry. That'll please him." }) }),
        ]),
      confide: say(
        '(한참 나를 본다.) …솔직하네요. 그 양반이 보낸 사람치고.\n\n(걸레를 내려놓는다.) 문찌 몸통, 그 물방울 모양. 그거 내가 깎았어요. 형님 밑에 있을 때. 형님은 그걸 수첩에 적고 「문찌」라고 팔았죠. 나는 그게 싫어서 나왔고.',
        "(He looks at me for a long time.) ...You're honest. For someone he sent.\n\n(He puts down his rag.) The body of the Mun float, that teardrop shape. I carved that. Back when I worked for him. He wrote it in his notebook and sold it as the Mun float. I couldn't stand that, so I left.",
        [
          opt('both_origin', '그럼 원조는 두 분 다인 셈이네요.', 'Then you could say you\'re both the original.',
            { stance: 'mid', aff: { [B]: 0.04 }, flags: ['choice.n24_both_origin'], end: endTalk({
              lineKo: '(쓴웃음.) 그 말을 그 양반 앞에서도 할 수 있으면, 그때 다시 얘기해요.',
              lineEn: "(A bitter smile.) If you can say that in front of him too, then we'll talk again." }) }),
          opt('still_wrong', '그래도 남의 수첩을 찢어 간 건 잘못 아닙니까.', 'Still, tearing a page from another man\'s notebook was wrong, wasn\'t it?',
            { stance: 'giver', aff: { [B]: -0.05 }, end: endTalk({
              lineKo: '(입술을 깨문다.) 찢어 간 게 아니라 내 장을 가져온 거예요. …그만해요.',
              lineEn: "(He bites his lip.) I didn't tear it out. I took back my own page. ...That's enough." }) }),
        ]),
      confide_late: say(
        '(숨을 길게 내쉰다.) …문찌 몸통, 그 물방울 모양 말이에요. 그거 내가 깎았어요. 형님은 그걸 수첩에 적고 「문찌」라고 팔았죠.\n\n원조라고 써 붙인 건, 그 수첩 앞에 내 이름이 한 줄도 없어서예요. 그게 다예요.',
        "(He lets out a long breath.) ...The body of the Mun float, that teardrop shape. I carved it. He wrote it in his notebook and sold it as the Mun float.\n\nI put up 'the original' because my name isn't on a single line of that notebook's front pages. That's all.",
        [
          opt('ever_told', '그 얘기, 필구 사장님께 직접 하신 적은 있습니까?', 'Have you ever said that to Mr. Mun yourself?',
            { stance: 'mid', aff: { [B]: 0.02 }, end: endTalk({
              lineKo: '(고개를 젓는다.) 이십 년 동안 길 하나를 못 건넜어요. 형님도, 나도.',
              lineEn: "(He shakes his head.) In twenty years neither of us has managed to cross one street. Not him, not me." }) }),
        ]),
      pretend: say(
        '(웃는다.) 찌 사러 온 얼굴이 아닌데. 뭐, 좋아요. 어떤 걸로?\n\n(진열장을 열며 길 건너를 힐끔 본다.) 저 양반이 유리문 뒤에서 또 보고 있네.',
        "(He laughs.) That's not the face of someone here to buy a float. Well, fine. Which one?\n\n(He opens the case and glances across the street.) He's watching from behind his glass door again.",
        [
          opt('which_original', '원조 문찌로 하나 주세요. 원조가 맞긴 합니까?', "I'll take an original Mun float. Is it really the original?",
            { stance: 'giver', aff: { [B]: -0.08, [A]: 0.02 }, flags: ['choice.n24_provoked'], next: 'angry_provoke' }),
          opt('confess', '사장님 찌로 하나 주세요. 그리고 사실은 필구 사장님이 보내셨습니다.', "One of your floats, please. And the truth is, Mr. Mun sent me.",
            { stance: 'mid', aff: { [B]: -0.03 }, flags: ['choice.n24_told_truth', 'choice.n24_heard_b'], next: 'confide' }),
          opt('just_buy', '(찌만 하나 사서 나온다.)', '(I just buy a float and leave.)',
            { stance: 'self', end: endTalk({
              lineKo: '(봉투에 찌를 넣어 준다.) 또 와요. 다음엔 심부름 말고.',
              lineEn: '(He puts a float in a bag for me.) Come again. Next time, not on an errand.' }) }),
        ]),
    },
  },

  // N24-2 — 끝내는 자리(문필구)
  {
    id: 'n24_2_done', questId: 'N24-2', at: 'complete', npcId: A, start: 'start',
    nodes: {
      start: say(
        '(유리문 앞에서 기다리고 있었다.) 봤다. 다 봤어. 그래서, 그놈 얼굴이 어떻더냐.',
        "(He was waiting by the glass door.) I saw. I saw it all. So — what did his face look like?",
        [
          opt('red_face', '말씀대로 물었습니다. 얼굴이 시뻘개지더군요.', 'I asked him, as you said. His face went bright red.',
            { stance: 'giver', aff: { [A]: 0.06 }, requires: { flag: 'choice.n24_provoked' }, next: 'gloat' }),
          opt('told', '사장님이 시킨 일이라고 그대로 전했습니다.', 'I told him plainly that it was your doing.',
            { stance: 'mid', aff: { [A]: -0.03 }, requires: { flag: 'choice.n24_told_truth' }, next: 'told' }),
          opt('body', '차영배 사장님은 그 몸통을 자기가 깎았다고 하더군요.', 'Mr. Cha says he carved that body himself.',
            { stance: 'other', aff: { [A]: -0.06 }, requires: { flag: 'choice.n24_heard_b' }, next: 'body' }),
          opt('bought', '그냥 찌만 하나 사 왔습니다.', 'I just bought a float and came back.',
            { stance: 'self', next: 'bought' }),
        ]),
      gloat: say(
        '(손뼉을 친다.) 그렇지! 그놈은 그 말에 약해. 원조 소리에.\n\n(그러다 웃음이 금방 꺼진다.) …그래. 시뻘개졌단 말이지.',
        "(He claps his hands.) That's it! That's his weak spot. The word original.\n\n(Then the laugh dies quickly.) ...Right. Bright red, you say.",
        [
          opt('relieved', '속이 시원하십니까?', 'Do you feel better now?',
            { stance: 'mid', end: endTalk({ complete: 'pay',
              lineKo: '(대답 대신 찌 깎던 칼을 내려놓는다.) …수고했다. 이건 수고비다.',
              lineEn: '(Instead of answering he puts down his carving knife.) ...Good work. Here, your fee.' }) }),
          opt('whats_next', '다음엔 뭘 할까요?', 'What should I do next?',
            { stance: 'giver', aff: { [A]: 0.03 }, flags: ['choice.n24_revenge_more'], end: endTalk({ complete: 'pay',
              lineKo: '(눈이 번쩍인다.) 다음? 다음은 어촌계다. 원조가 누군지 공식으로 가리자고 할 거다. 그때 네가 본 걸 말해 줘야 한다.',
              lineEn: "(His eyes light up.) Next? Next is the co-op. I'll have them decide officially who the original is. When that happens, you'll tell them what you saw." }) }),
        ]),
      told: say(
        '(입꼬리가 내려간다.) 그대로 전했다고. …내가 시킨 일이라고.\n\n(한참 있다가) 그놈이 뭐라더냐. 아니, 됐다. 화냈겠지. 그놈은 화낼 때 귀가 빨개져.',
        "(The corners of his mouth drop.) You told him straight. ...That it was my doing.\n\n(After a long pause) What did he say? No, never mind. He got angry. His ears go red when he's angry.",
        [
          opt('his_side', '귀가 빨개지셨습니다. 그리고 사장님 얘기도 조금 하셨습니다.', 'His ears went red. And he said a little about you too.',
            { stance: 'mid', end: endTalk({ complete: 'nopay',
              lineKo: '(창밖 건너편을 본다.) …그놈이 내 얘기를 했다고. 다음에 마저 듣자. 오늘은 가라. (봉투를 내밀다가 도로 거둔다.)',
              lineEn: "(He looks out across the street.) ...He talked about me. Tell me the rest another time. Go for today. (He starts to hold out an envelope, then takes it back.)" }) }),
          opt('as_told', '말씀대로 했을 뿐입니다.', 'I only did as you told me.',
            { stance: 'giver', end: endTalk({ complete: 'pay',
              lineKo: '(고개를 끄덕인다.) 그래. 내가 시켰다. 그건 내가 지고 가마. (봉투를 건넨다.)',
              lineEn: "(He nods.) Right. I sent you. I'll carry that myself. (He hands me an envelope.)" }) }),
        ]),
      body: say(
        '(얼굴이 굳는다.) …그놈이 그러더냐. 몸통은 자기가 깎았다고.\n\n(서랍을 열었다가 도로 닫는다.) 깎은 손은 그놈 손이 맞다. 그런데 그걸 찌로 만든 건 내 수첩이야. 손 하나로 찌가 되는 줄 아냐.',
        "(His face hardens.) ...He said that? That he carved the body.\n\n(He opens a drawer, then shuts it again.) The hand that carved it was his, true. But what made it a float was my notebook. You think one pair of hands makes a float?",
        [
          opt('show_notebook', '수첩을 한번 보여 주실 수 있습니까?', 'Could you show me the notebook?',
            { stance: 'mid', aff: { [A]: -0.02 }, end: endTalk({ complete: 'float',
              lineKo: '(서랍 손잡이를 쥔 채 한참 있다.) …다음에. 다음에 와라. (서랍 대신 진열장을 열어 찌 하나를 꺼내 준다.)',
              lineEn: '(He stands a long time with his hand on the drawer handle.) ...Another time. Come another time. (Instead of the drawer he opens the case and hands me a float.)' }) }),
          opt('also_right', '그 말씀도 맞습니다.', "You're right about that too.",
            { stance: 'giver', aff: { [A]: 0.03 }, end: endTalk({ complete: 'pay',
              lineKo: '(어깨가 조금 내려간다.) 그래. 오늘은 그만하자. (봉투를 건넨다.)',
              lineEn: "(His shoulders drop a little.) Right. Let's leave it there for today. (He hands me an envelope.)" }) }),
        ]),
      bought: say(
        '(봉투를 흘끗 본다.) 그놈 찌를 샀어? 내가 보낸 놈이?\n\n(혀를 찬다.) 너도 결국 싼 게 좋은 거지.',
        "(He glances at the bag.) You bought his float? Someone I sent?\n\n(He clicks his tongue.) In the end you just like cheap things too.",
        [
          opt('to_test', '물에 세워 보려고 산 겁니다.', 'I bought it to stand it in the water.',
            { stance: 'mid', end: endTalk({ complete: 'pay',
              lineKo: '…그래, 세워 봐라. 누워 있을 거다. (마지못해 봉투를 건넨다.)',
              lineEn: "...Fine, stand it. It'll be lying down. (He reluctantly hands me an envelope.)" }) }),
          opt('cheap_fine', '싼 찌도 잃어버리기엔 좋더군요.', 'A cheap float is easier to lose, at least.',
            { stance: 'other', aff: { [A]: -0.04 }, end: endTalk({ complete: 'nopay',
              lineKo: '(봉투를 서랍에 도로 넣는다.) 잃어버려도 되는 찌로 무슨 고기를 낚겠냐. 가라.',
              lineEn: '(He puts the envelope back in the drawer.) What fish will you catch with a float you don\'t mind losing? Go.' }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N24-3 「작업 수첩」 — 받는 자리(어촌계)
  // ═══════════════════════════════════════════
  {
    id: 'n24_3_offer', questId: 'N24-3', at: 'offer', npcId: 'coop', start: 'start',
    nodes: {
      start: say(
        '(안건 종이를 내민다.) 동명항 찌 가게 두 집이 서로 원조라고 어촌계에 올렸네. 간판 문구를 내리라고 서로.\n\n둘 사이를 오간 사람이 자네밖에 없다더군. 회의에 나와서 본 대로만 말해 주게. 그 전에 두 사람 얘기를 다시 들어 보고.',
        "(He holds out the agenda sheet.) The two float shops at Dongmyeong have each filed with the co-op, both claiming to be the original. Each wants the other's sign taken down.\n\nThey tell me you're the only one who went between the two. Come to the meeting and just say what you saw. Hear them both out again before then.",
        [
          opt('as_seen', '본 대로 말씀드리겠습니다.', "I'll tell it as I saw it.",
            { stance: 'mid', aff: { coop: 0.03 }, end: endTalk({ accept: true,
              lineKo: '그래. 본 대로. 그게 제일 어렵지. 문 사장은 수첩 얘기를 할 거고, 차 사장은 찢긴 장 얘기를 할 걸세.',
              lineEn: "Right. As you saw it. That's the hardest thing of all. Mr. Mun will talk about his notebook, and Mr. Cha about a torn-out page." }) }),
          opt('side_a', '저는 필구 사장님 편입니다. 그건 미리 말씀드리지요.', "I'm on Mr. Mun's side. I'll say that up front.",
            { stance: 'giver', aff: { coop: -0.03, mun_pilgu: 0.02 }, end: endTalk({ accept: true,
              lineKo: '(안경을 고쳐 쓴다.) 편이 있는 증인이라. 회의에서는 그 편을 잠깐 내려놓고 말해 주게.',
              lineEn: '(He adjusts his glasses.) A witness with a side. At the meeting, set that side down for a moment when you speak.' }) }),
          opt('side_b', '차영배 사장님 쪽 얘기가 더 맞는 것 같습니다.', "I think Mr. Cha's side of the story is closer to the truth.",
            { stance: 'other', aff: { coop: -0.03, cha_yeongbae: 0.02 }, end: endTalk({ accept: true,
              lineKo: '(고개를 끄덕인다.) 그렇게 생각한다면 회의에서 그 까닭을 말하게. 마음 말고 까닭을.',
              lineEn: '(He nods.) If that\'s what you think, give your reasons at the meeting. Reasons, not feelings.' }) }),
          opt('their_business', '두 분 일은 두 분이 푸셔야지요.', 'The two of them should settle it between themselves.',
            { stance: 'self', end: endTalk({ decline: true,
              lineKo: '(종이를 접는다.) 그 말이 맞지. 그런데 이십 년을 못 풀었다네. 마음 바뀌면 오게.',
              lineEn: "(He folds the sheet.) You're right. But they haven't managed it in twenty years. Come back if you change your mind." }) }),
        ]),
    },
  },

  // N24-3 — 진행 중: 문필구의 작업 수첩(목표 0)
  {
    id: 'n24_3_notebook', questId: 'N24-3', at: 'objective', objectiveIndex: 0, npcId: A, start: 'start',
    nodes: {
      start: say(
        '(안건 얘기를 꺼내기도 전에 서랍을 연다.) 회의에 나간다며. 계장한테 들었다.\n\n(낡은 수첩을 꺼내 탁자에 올려놓는다. 가운데 한 장이 찢겨 나가 있다.) 이게 내 작업 수첩이다. 찢긴 데가 보이지. 그놈이 나갈 때 찢어 간 장이다.',
        "(Before I can bring up the meeting, he opens a drawer.) You're going to the meeting, I hear. The chief told me.\n\n(He takes out a worn notebook and lays it on the table. One page in the middle has been torn out.) This is my workshop notebook. See where it's torn? That's the page he tore out when he left.",
        [
          opt('look_pages', '찢긴 장 앞뒤를 봐도 되겠습니까?', 'May I look at the pages either side of the tear?',
            { stance: 'mid', next: 'pages' }),
          opt('evidence', '이걸 회의에 가져가면 끝나겠네요.', "Take this to the meeting and that'll settle it.",
            { stance: 'giver', aff: { [A]: 0.04 }, next: 'evidence' }),
          opt('his_page', '찢어 간 게 아니라 자기 장을 가져간 거라던데요.', "He says he didn't tear it out. He took back his own page.",
            { stance: 'other', aff: { [A]: -0.06 }, requires: { flag: 'choice.n24_heard_b' }, next: 'his_page' }),
          opt('as_planned', '어촌계에서 가리자고 하셨지요. 그 자리에 나가겠습니다.', "You wanted the co-op to decide. I'll be there.",
            { stance: 'giver', aff: { [A]: 0.03 }, requires: { flag: 'choice.n24_revenge_more' }, next: 'evidence' }),
        ]),
      pages: say(
        '(문필구가 머뭇거리다 수첩을 내 쪽으로 민다. 찢긴 장 바로 앞장에 물방울 모양 몸통 그림이 반쯤 남아 있다.)\n\n(글씨가 두 가지다. 위쪽 찌톱 치수는 굵고 모난 글씨, 아래쪽 몸통 치수는 작고 둥근 글씨. 여백에 작게 「영」 자가 적혀 있다.)',
        "(Mun Pilgu hesitates, then pushes the notebook towards me. On the page just before the tear, half of a teardrop-shaped body drawing remains.)\n\n(There are two kinds of handwriting. The measurements for the top are in thick, angular strokes; the ones for the body below are small and round. In the margin, small, the syllable Yeong.)",
        [
          opt('two_hands', '이 둥근 글씨, 사장님 글씨가 아니지요?', "This round handwriting isn't yours, is it?",
            { stance: 'mid', aff: { [A]: -0.03 }, next: 'two_hands' }),
          opt('give_back', '(아무 말 없이 수첩을 돌려드린다.)', '(I hand the notebook back without a word.)',
            { stance: 'self', aff: { [A]: 0.02 }, end: endTalk({
              lineKo: '(수첩을 도로 서랍에 넣는다.) 회의에서 봐라. 원조가 누군지.',
              lineEn: "(He puts the notebook back in the drawer.) See at the meeting who the original is." }) }),
        ], ''),
      two_hands: say(
        '(오래 말이 없다.) …그놈 글씨다. 몸통은 그놈이 깎았어. 내가 찌톱을 올리고 수첩에 적었지.\n\n(수첩을 덮는다.) 그런데 내 수첩이다. 내 가게고. 제자 놈 이름을 어떻게 찌에 새기냐. 그게 이 골목 법이었다.',
        "(He's silent a long time.) ...It's his writing. He carved the body. I put the top on it and wrote it in my notebook.\n\n(He closes the notebook.) But it's my notebook. My shop. How do you carve an apprentice's name into a float? That was the rule in this alley.",
        [
          opt('twenty_years', '그 법 때문에 이십 년을 길 건너에서 사셨네요.', "And because of that rule you've lived twenty years across the street from him.",
            { stance: 'other', aff: { [A]: -0.05 }, end: endTalk({
              lineKo: '(수첩을 쥔 손등이 하얘진다.) …가라. 회의에서 보자.',
              lineEn: '(The back of his hand goes white around the notebook.) ...Go. I\'ll see you at the meeting.' }) }),
          opt('bring_it', '회의에 이 수첩을 가져와 주실 수 있겠습니까?', 'Would you bring this notebook to the meeting?',
            { stance: 'mid', aff: { [A]: -0.02, coop: 0.02 }, end: endTalk({
              lineKo: '(한참 수첩을 내려다본다.) …가져가마. 대신 네 눈으로 본 걸 말해. 네 입으로.',
              lineEn: '(He looks down at the notebook for a long time.) ...I\'ll bring it. But you say what you saw with your own eyes. In your own words.' }) }),
          opt('still_yours', '사장님 수첩이 맞습니다. 그건 변하지 않지요.', "It's your notebook. That doesn't change.",
            { stance: 'giver', aff: { [A]: 0.04 }, end: endTalk({
              lineKo: '(고개를 끄덕인다.) 그래. 그거면 됐다.',
              lineEn: "(He nods.) Right. That's enough." }) }),
        ]),
      evidence: say(
        '그래. 찢긴 장이 증거다. 그놈이 가져간 증거.\n\n회의에서 이걸 들고 말해라. 아홉 해 가르친 스승의 수첩을 찢어 간 놈이라고.',
        "Right. The torn page is the evidence. Proof he took it.\n\nTake this to the meeting and say it. That he tore a page from the notebook of the master who taught him nine years.",
        [
          opt('look_first', '찢긴 장 앞뒤를 먼저 보겠습니다.', "I'll look at the pages either side of the tear first.",
            { stance: 'mid', next: 'pages' }),
          opt('promise', '그렇게 말씀드리겠습니다.', "I'll say exactly that.",
            { stance: 'giver', aff: { [A]: 0.04, [B]: -0.03 }, end: endTalk({
              lineKo: '(수첩을 서랍에 넣고 잠근다.) 회의 날 가져가마. 너는 말만 해. (유리문 밖으로 들리게 목소리를 높인다. 길 건너 셔터가 반쯤 내려간다.)',
              lineEn: '(He puts the notebook in the drawer and locks it.) I\'ll bring it on the day. You just talk. (He raises his voice so it carries past the glass door. Across the street a shutter comes halfway down.)' }) }),
        ]),
      his_page: say(
        '(눈을 치켜뜬다.) 자기 장? 그놈이 그러더냐.\n\n…그래, 봐라. (수첩을 펼쳐 찢긴 자리를 내민다.) 자기 장인지 내 장인지 네 눈으로 봐.',
        "(His eyes go wide.) His own page? He said that?\n\n...Fine. Look. (He opens the notebook to the torn place and holds it out.) See for yourself whether it was his page or mine.",
        [
          opt('examine', '(찢긴 장 앞뒤를 살핀다.)', '(I examine the pages either side of the tear.)',
            { stance: 'mid', next: 'pages' }),
        ]),
    },
  },

  // N24-3 — 진행 중: 차영배의 찢긴 장(목표 1). 앞에서 차영배를 몰아세웠으면 장을 보여 주지 않는다
  {
    id: 'n24_3_torn', questId: 'N24-3', at: 'objective', objectiveIndex: 1, npcId: B, start: 'start',
    nodes: {
      start: say(
        '(진열장 너머에서 나를 보고 표정이 굳는다.) …회의 얘기 들었어요. 증인으로 나간다면서요.\n\n누구 쪽 증인인지는 안 물을게요. 물으러 온 거 있으면 물어요.',
        "(He sees me over the display case and his face stiffens.) ...I heard about the meeting. You're going as a witness, they say.\n\nI won't ask whose witness. If you came to ask something, ask.",
        [
          opt('witness', '누구 쪽 증인도 아닙니다. 본 대로 말할 겁니다.', "I'm nobody's witness. I'll say what I saw.",
            { stance: 'mid', aff: { [B]: 0.02 }, requires: { affinityMin: [B, -0.25] }, next: 'witness' }),
          opt('the_page', '필구 사장님 수첩에서 가져오신 장, 아직 갖고 계십니까?', 'The page you took from Mr. Mun\'s notebook — do you still have it?',
            { stance: 'mid', requires: { flag: 'choice.n24_heard_notebook', affinityMin: [B, -0.25] }, next: 'witness' }),
          opt('apology', '지난번 일은 사과드립니다. 사장님 얘기를 듣고 싶습니다.', "I apologize for last time. I'd like to hear your side.",
            { stance: 'other', aff: { [B]: 0.06 }, requires: { affinityMax: [B, -0.25] }, next: 'apology' }),
          opt('it_lies', '사장님 찌가 눕는다는 건 다들 압니다.', 'Everyone knows your floats lie down.',
            { stance: 'giver', aff: { [B]: -0.06 }, next: 'out' }),
        ]),
      witness: say(
        '(조금 풀린다.) 본 대로라. 그럼 봐야 할 게 있어요.\n\n(카운터 밑에서 접힌 종이 한 장을 꺼낸다.) 이거예요. 형님 수첩에서 가져온 장.',
        "(He relaxes a little.) As you saw it. Then there's something you should see.\n\n(He takes a folded sheet of paper from under the counter.) This. The page I took from his notebook.",
        [
          opt('unfold', '(종이를 받아 펼친다.)', '(I take the sheet and unfold it.)', { stance: 'mid', next: 'torn' }),
        ]),
      torn: say(
        '(물방울 모양 몸통 그림의 나머지 반쪽이다. 필구 사장 수첩에 남은 반쪽과 꼭 맞을 것이다. 작고 둥근 글씨로 몸통 치수가 빼곡하다.)\n\n(맨 아래에 굵고 모난 글씨로 한 줄. 「찌톱은 내가 올린다. 몸통은 영배 것이 낫다.」)',
        "(It is the other half of the teardrop-shaped body drawing. It will fit the half left in Mr. Mun's notebook exactly. The body's measurements crowd the page in small, round handwriting.)\n\n(At the very bottom, one line in thick, angular strokes: I'll put the top on. Yeongbae's body is better.)",
        [
          opt('his_hand', '필구 사장님이 직접 쓰신 글씨네요.', "That's Mr. Mun's own handwriting.",
            { stance: 'mid', flags: ['choice.n24_saw_torn'], next: 'torn2' }),
          opt('return_quiet', '(조용히 종이를 돌려드린다.)', '(I quietly hand the sheet back.)',
            { stance: 'self', flags: ['choice.n24_saw_torn'], end: endTalk({
              lineKo: '(종이를 다시 접는다.) 회의에서 봐요.',
              lineEn: '(He folds the sheet again.) See you at the meeting.' }) }),
        ], ''),
      torn2: say(
        '(고개를 끄덕인다.) 형님이 그날 밤에 쓴 거예요. 내가 몸통을 처음 깎아 온 날. 나는 그 한 줄이면 됐어요.\n\n근데 그다음 날부터 형님은 손님들한테 그 찌를 「문찌」라고만 팔았어요. 그래서 이 장만 들고 나왔어요. 내 거라서가 아니라, 형님 글씨라서.',
        "(He nods.) He wrote that the night I brought in the first body I carved. That one line was all I needed.\n\nBut from the next day he sold that float to his customers as the Mun float, nothing else. So I took only this page and left. Not because it was mine. Because it was in his handwriting.",
        [
          opt('bring_page', '회의에 이 장을 가져와 주실 수 있겠습니까?', 'Would you bring this page to the meeting?',
            { stance: 'mid', aff: { [B]: -0.02, coop: 0.02 }, end: endTalk({
              lineKo: '(오래 망설이다 고개를 끄덕인다.) 가져갈게요. 이십 년 동안 이거 하나 들고 버텼어요.',
              lineEn: "(He hesitates a long time, then nods.) I'll bring it. For twenty years this is the one thing I've held on to." }) }),
          opt('both_origin', '두 장을 맞추면 원조가 둘이라는 게 드러나겠네요.', 'Put the two pages together and it\'ll show there are two originals.',
            { stance: 'mid', aff: { [B]: 0.04 }, flags: ['choice.n24_both_origin'], end: endTalk({
              lineKo: '(쓴웃음.) 형님이 그걸 받아들일까요. …회의에서 봐요.',
              lineEn: '(A bitter smile.) Will he accept that, I wonder. ...See you at the meeting.' }) }),
          opt('beat_him', '이걸로 필구 사장님을 이길 수 있겠습니다.', 'With this, you can beat Mr. Mun.',
            { stance: 'other', aff: { [B]: 0.02 }, end: endTalk({
              lineKo: '(종이를 품에 넣는다.) 이기려고 가져온 게 아닌데. …그래도 회의엔 가져갈게요.',
              lineEn: "(He tucks the sheet inside his jacket.) I didn't take it to win. ...Still, I'll bring it to the meeting." }) }),
        ]),
      apology: say(
        '(한참 나를 본다.) …사과는 받아요. 그날 나도 심했고 당신도 심했으니까.\n\n근데 그 얘기는 안 해요. 내 얘기 들으러 왔으면 그날 들었어야지. 회의에서 봐요.',
        "(He looks at me a long while.) ...I accept the apology. I went too far that day, and so did you.\n\nBut I won't talk about that. If you wanted my side, you should have listened that day. See you at the meeting.",
        [
          opt('understood', '알겠습니다. 회의에서 뵙겠습니다.', 'I understand. I\'ll see you at the meeting.',
            { stance: 'mid', end: endTalk({
              lineKo: '(고개만 까딱한다.)',
              lineEn: '(He just gives a small nod.)' }) }),
        ]),
      out: say(
        '(진열장 덮개를 쾅 내린다.) 그래요. 눕죠. 회의에서 그 말 해요. 나도 할 말 할 테니까.',
        "(He slams the case cover down.) Right. They lie down. Say that at the meeting. I'll have my say too.",
        [
          opt('leave', '(가게를 나선다.)', '(I leave the shop.)', { stance: 'self', end: endTalk({}) }),
        ]),
    },
  },

  // N24-3 — 끝내는 자리(어촌계 회의) · 결말을 고른다
  {
    id: 'n24_3_hearing', questId: 'N24-3', at: 'complete', npcId: 'coop', start: 'start',
    nodes: {
      start: say(
        '(어촌계 회의실. 긴 탁자 한쪽에 문필구, 맞은편에 차영배가 앉아 있다. 둘 다 서로를 보지 않는다.)\n\n자, 증인. 두 집을 다 오갔지. 본 대로 말해 주게. 원조 문찌는 누구 것인가.',
        "(The co-op meeting room. Mun Pilgu sits on one side of the long table, Cha Yeongbae across from him. Neither looks at the other.)\n\nNow, witness. You went between both shops. Tell us what you saw. Whose is the original Mun float?",
        [
          opt('both', '두 분 다입니다. 수첩과 찢긴 장을 맞춰 보시면 압니다.', "Both of theirs. Put the notebook and the torn page together and you'll see.",
            { stance: 'mid', requires: { flag: 'choice.n24_saw_torn' }, next: 'match' }),
          opt('for_a', '필구 사장님 것입니다. 건너편 찌는 모양만 베꼈습니다.', "It's Mr. Mun's. The float across the street only copies the shape.",
            { stance: 'giver', aff: { [A]: 0.05, [B]: -0.15 }, next: 'verdict_a' }),
          opt('for_b', '영배 사장님 것입니다. 필구 사장님이 제자의 일을 가로챘습니다.', "It's Mr. Cha's. Mr. Mun took credit for his apprentice's work.",
            { stance: 'other', aff: { [A]: -0.15, [B]: 0.05 }, requires: { flag: 'choice.n24_heard_b' }, next: 'verdict_b' }),
          opt('cant_say', '제가 가릴 수 있는 일이 아닙니다.', "It's not something I can decide.",
            { stance: 'self', next: 'shelve' }),
        ]),
      match: say(
        '(문필구에게 손을 내민다.) 수첩을 주시지요.\n\n(문필구가 한참 버티다 수첩을 내놓는다. 차영배가 품에서 접힌 장을 꺼낸다. 계장이 찢긴 자리에 그 장을 댄다. 반쪽 그림이 맞아 들어간다.)',
        "(He holds out his hand to Mun Pilgu.) The notebook, please.\n\n(Mun Pilgu holds out a long time, then hands it over. Cha Yeongbae takes the folded page from his jacket. The chief lays it against the torn edge. The two halves of the drawing fit together.)",
        [
          opt('read_line', '찌톱은 필구 사장님, 몸통은 영배 사장님. 그렇게 적혀 있습니다.', "The top is Mr. Mun's, the body is Mr. Cha's. That's what it says.",
            { stance: 'mid', aff: { [A]: 0.04, [B]: 0.04 }, next: 'reconcile' }),
          opt('said_before', '영배 사장님께 드린 말 그대로입니다. 원조는 두 분 다입니다.', "It's what I told Mr. Cha before. You are both the original.",
            { stance: 'mid', aff: { [A]: 0.02, [B]: 0.06 }, requires: { flag: 'choice.n24_both_origin' }, next: 'reconcile' }),
        ]),
      reconcile: say(
        '(맞춰진 장을 오래 내려다본다. 자기 글씨, 「몸통은 영배 것이 낫다」.)\n\n…내가 쓴 거다. 잊은 게 아니다. 못 본 척한 거지. (처음으로 맞은편을 본다.) 영배야. 간판 하나 더 달자. 우리 집 유리문에.',
        "(He looks down at the matched pages for a long time. His own handwriting: Yeongbae's body is better.)\n\n...I wrote that. I didn't forget it. I pretended not to see it. (For the first time he looks across the table.) Yeongbae. Let's hang another sign. On my glass door.",
        [
          opt('watch_both', '(두 사람을 번갈아 본다.)', '(I look from one man to the other.)', { stance: 'mid', next: 'fee_together' }),
        ], A),
      fee_together: say(
        '(차영배가 고개를 숙인다. 어깨가 떨린다. 계장이 안건 종이에 한 줄을 적는다. 「원조 표기 — 두 집 공동」.)\n\n이걸로 됐지요? 증인 수고비는 어떻게 하겠나.',
        "(Cha Yeongbae bows his head. His shoulders shake. The chief writes one line on the agenda sheet: Original — jointly, both shops.)\n\nThat settles it, then? Now, what shall we do about the witness fee?",
        [
          opt('take_fee', '수고비는 받겠습니다.', "I'll take the fee, thank you.",
            { stance: 'self', end: endTalk({ complete: 'witness', ending: 'n24_together',
              lineKo: '그래야지. (봉투를 건넨다.) 오늘 같은 날은 어촌계도 처음일세.',
              lineEn: "As you should. (He hands me an envelope.) A day like this is a first for the co-op too." }) }),
          opt('buy_floats', '두 가게 찌 값으로 써 주십시오.', 'Please spend it on floats from both shops.',
            { stance: 'mid', aff: { [A]: 0.03, [B]: 0.03 }, end: endTalk({ complete: 'nofee', ending: 'n24_together',
              lineKo: '(계장이 웃는다.) 그럼 첫 공동 찌는 어촌계가 사지.',
              lineEn: '(The chief laughs.) Then the co-op buys the first joint float.' }) }),
        ]),
      verdict_a: say(
        '(차영배를 본다.) 차 사장, 할 말 있나.\n\n(차영배가 접힌 종이를 꺼내려다 손을 멈춘다. 증인이 이미 말을 마쳤다. 그는 종이를 도로 품에 넣는다.)',
        "(He looks at Cha Yeongbae.) Mr. Cha, anything to say?\n\n(Cha Yeongbae starts to take out a folded sheet, then stops. The witness has already spoken. He tucks the sheet back inside his jacket.)",
        [
          opt('copied', '모양을 베낀 건 사실입니다.', 'He did copy the shape. That\'s a fact.',
            { stance: 'giver', aff: { [B]: -0.15 }, next: 'ruling_a' }),
          opt('wait_page', '잠깐만요. 차 사장님 품에 넣으신 그 종이를 봐 주십시오.', "Wait. Please look at the paper Mr. Cha just put away.",
            { stance: 'mid', requires: { flag: 'choice.n24_saw_torn' }, next: 'match' }),
          opt('say_nothing', '(더 말하지 않는다.)', '(I say nothing more.)', { stance: 'self', next: 'ruling_a' }),
        ]),
      ruling_a: say(
        '(안건 종이에 적는다.) 「영배 낚시 — 원조 표기 내림. 문찌 모양 판매 자제」. 차 사장, 이의 있나.\n\n(차영배가 일어선다. 대답 대신 나를 오래 본다. 문이 닫힌다.)',
        "(He writes on the agenda sheet.) Yeongbae Tackle: remove the word original; refrain from selling the Mun shape. Mr. Cha, any objection?\n\n(Cha Yeongbae stands. Instead of answering, he looks at me for a long time. The door closes.)",
        [
          opt('look_a', '(필구 사장님을 본다.)', '(I look at Mr. Mun.)', { stance: 'giver', next: 'fee_dark' }),
        ]),
      fee_dark: say(
        '(문필구는 이긴 얼굴이 아니다. 닫힌 문만 본다.)\n\n수고했네, 증인. 이걸로 끝이야. 수고비는 어떻게 하겠나.',
        "(Mun Pilgu does not look like a man who has won. He only stares at the closed door.)\n\nThank you, witness. That's the end of it. What shall we do about your fee?",
        [
          opt('take_fee', '수고비는 받겠습니다.', "I'll take the fee, thank you.",
            { stance: 'self', end: endTalk({ complete: 'witness', ending: 'n24_dark',
              lineKo: '(봉투를 건넨다.) 길 건너 불이 오늘은 일찍 꺼지겠군.',
              lineEn: '(He hands me an envelope.) The lights across the street will go out early tonight.' }) }),
          opt('learn_minutes', '이런 회의는 어떻게 적는지 배우고 싶습니다.', "I'd like to learn how a meeting like this is written up.",
            { stance: 'mid', end: endTalk({ complete: 'learn', ending: 'n24_dark',
              lineKo: '(회의록을 내 앞으로 돌려 놓는다.) 본 것 · 들은 것 · 적힌 것을 따로 놓게. 오늘은 들은 것만 적혔지.',
              lineEn: '(He turns the minutes towards me.) Keep what was seen, what was heard and what was written apart. Today, only what was heard got written down.' }) }),
        ]),
      verdict_b: say(
        '(문필구를 본다.) 문 사장, 사실인가.\n\n(문필구가 탁자를 짚고 일어선다.) 이 골목에서 사십 년이다. 증인이라는 게 남의 가게 얘기를 듣고 와서 이 꼴을 만들어?',
        "(He looks at Mun Pilgu.) Mr. Mun, is that true?\n\n(Mun Pilgu leans on the table and stands.) Forty years in this alley. And a so-called witness listens to one shop's story and brings it to this?",
        [
          opt('as_heard', '들은 대로 말씀드린 겁니다.', 'I said what I heard.',
            { stance: 'other', aff: { [A]: -0.08 }, next: 'ruling_none' }),
          opt('too_far', '제가 말이 지나쳤습니다.', 'I went too far.',
            { stance: 'mid', aff: { [A]: 0.04 }, next: 'ruling_none' }),
        ]),
      ruling_none: say(
        '(손을 든다.) 그만. 들은 말로는 어촌계가 가릴 수 없네. 간판은 두 집 다 그대로 두게.\n\n(문필구가 먼저 나간다. 문이 세게 닫힌다. 차영배는 한참 앉아 있다가 나간다.)',
        "(He raises a hand.) Enough. The co-op can't decide on hearsay. Both shops keep their signs.\n\n(Mun Pilgu leaves first. The door slams. Cha Yeongbae sits a long while, then leaves too.)",
        [
          opt('empty_chairs', '(빈 의자를 본다.)', '(I look at the empty chairs.)', { stance: 'self', next: 'fee_apart' }),
        ]),
      shelve: say(
        '(한숨.) 증인이 가릴 수 없다면 어촌계도 못 가리지. 간판은 두 집 다 그대로 두게.\n\n(문필구와 차영배가 동시에 일어선다. 문 앞에서 잠깐 어깨가 부딪친다. 둘 다 아무 말도 하지 않는다.)',
        "(A sigh.) If the witness can't decide, neither can the co-op. Both shops keep their signs.\n\n(Mun Pilgu and Cha Yeongbae stand at the same moment. Their shoulders bump briefly at the door. Neither says a word.)",
        [
          opt('watch_go', '(두 사람이 나가는 걸 본다.)', '(I watch the two of them leave.)', { stance: 'self', next: 'fee_apart' }),
        ]),
      fee_apart: say(
        '(계장이 안건 종이를 접어 서랍에 넣는다.) 또 올라오겠지. 내년에도.\n\n수고비는 어떻게 하겠나, 증인.',
        "(The chief folds the agenda sheet and puts it in a drawer.) It'll come up again. Next year too.\n\nWhat shall we do about your fee, witness?",
        [
          opt('take_fee', '수고비는 받겠습니다.', "I'll take the fee, thank you.",
            { stance: 'self', end: endTalk({ complete: 'witness', ending: 'n24_apart',
              lineKo: '(봉투를 건넨다.) 자네 탓은 아닐세. 이십 년 묵은 일이야.',
              lineEn: "(He hands me an envelope.) It's not your fault. This is twenty years old." }) }),
          opt('buy_floats', '두 가게 찌 값으로 써 주십시오.', 'Please spend it on floats from both shops.',
            { stance: 'mid', aff: { [A]: 0.02, [B]: 0.02 }, end: endTalk({ complete: 'nofee', ending: 'n24_apart',
              lineKo: '(안경 너머로 나를 본다.) 그러지. 두 집에서 똑같이 사 두겠네.',
              lineEn: '(He looks at me over his glasses.) Very well. We\'ll buy the same from both shops.' }) }),
        ]),
    },
  },
];
