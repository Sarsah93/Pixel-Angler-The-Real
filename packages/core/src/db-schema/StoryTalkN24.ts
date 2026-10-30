/**
 * @file StoryTalkN24.ts
 * @description 254차 — N24 「건너편 가게」 이어지는 대화. 규칙은 `StoryTalks.ts` 머리 주석.
 *   290차 — 대본 장면(주고받기)으로 고쳐 썼다. 단계 id · 고를 말 id · 표시 · 우호도 · 조건 · 끝 · 결말은 254차 그대로이고,
 *   바뀐 것은 대사 꼴(`scene` · `line`) · 고를 말의 실제 말(`say`) · 일지 한 문장(`note`) · 호칭(주인공의 「사장님」 → 「문필구 씨」 · 「차영배 씨」)이다.
 *   옛 받는 답의 표시는 받는 끝을 그 답에 묶어 남긴다(N24-2 help_him · my_way · N24-3 side_a · side_b).
 *
 * 인물: 문필구(A · 64 · 「필구 찌방」 — 손으로 깎는 찌 「문찌」 · 반말 「~다」 · 「~냐」 · 「그놈」) ·
 *   차영배(B · 52 · 길 건너 「영배 낚시」 — 필구 밑에서 아홉 해를 배운 옛 제자 · 해요체 · 필구를 「형님」 · 「그 양반」) ·
 *   어촌계(N24-3 — 하게체 「자네」 · 「~게」 · 안경).
 * 숨은 사정(마지막 편에서 드러난다): 문찌의 물방울 몸통은 영배가 깎았다. 필구는 그걸 수첩에 적고 밑에 한 줄을 남겼다 —
 *   「찌톱은 내가 올린다. 몸통은 영배 것이 낫다.」 그러고도 손님에게는 「문찌」라고만 팔았다. 영배는 그 장만 찢어 들고 나갔다.
 *
 * 사용자 예시(254차)와의 대응 — 받는 자리 `N24-2`:
 *   A의 설명 → 「차영배 씨가 딱히 나쁜 사람 같지는 않던데요」(A ↓) → 「뭐라고? 너는 지금 누구 편을 드는 거냐?」
 *   → 「둘 다 같은 사람인 것 같습니다」 → 「너는 나를 도울 생각이 없는 거지?」
 *   → 「그건 아닙니다만…」 → 「그럼 내가 말하는 대로 우선 영배를 자극해.」
 *   → 「차영배 씨에게도 의견을 물어봐야 하지 않을까요?」 → 「영배한테 가서, 다 내가 시킨 일이니 그렇다고 해라! 못난 놈!」
 *   진행 중(차영배 앞): 사실대로 말하기 / 감추고 자극하기 → 어느 쪽이든 B ↓ 「뭐라고? 형님이 그랬다고 한들, 너도 매한가지로구나!」
 *   양 끝 사이의 중도(두 사람 얘기를 다 듣기)는 마음이 덜 식고, 마지막 편에서 화해 결말로 가는 단서를 연다.
 *
 * 결말(마지막 편 끝내는 자리 · 어촌계 회의): 단서(찢긴 장을 본 것)가 있으면 화해(정본) · 필구 편 증언이면 영배가 영영 무너진다 ·
 *   못 가리거나 영배 편 말만 하면 아무도 가리지 못한다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const A = 'mun_pilgu';
const B = 'cha_yeongbae';
const C = 'coop';
const P = 'player';

export const TALKS_N24: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N24-1 「건너편 찌」 — 받는 자리(문필구)
  // ═══════════════════════════════════════════
  {
    id: 'n24_1_offer', questId: 'N24-1', at: 'offer', npcId: A, start: 'start',
    nodes: {
      start: scene([
        line(A, '잠깐. 그 채비 통 좀 보자.', 'Hold on. Let me see that tackle box.', { act: 'peer' }),
        line(P, '제 채비 통이요? 왜요?', 'My tackle box? Why?'),
        line(A, '(채비 통에서 찌 하나를 집어 들고 혀를 찬다.)', '(He picks a float out of the box and clicks his tongue.)'),
        line(A, '이거, 건너편에서 샀지?', "You bought this across the street, didn't you?"),
        line(P, '네… 길 건너 가게에서요. 싸길래요.', 'Yes... at the shop across the street. It was cheap.'),
        line(A, '모양만 내 거다. 속은 아니야.', "Only the shape is mine. Not what's inside."),
        line(P, '모양이 같다는 말씀이세요?', 'You mean the shape is the same?'),
        line(A, '(진열장에서 똑같이 생긴 찌를 꺼내 나란히 놓는다.)', '(He takes an identical float from the case and sets the two side by side.)'),
        line(A, '봐라. 똑같지? 바다에 세워 보면 하나는 서고 하나는 눕는다.', "Look. Same, aren't they? Stand them in the sea and one stands while the other lies down."),
        line(A, '내 거 하나 줄 테니 세워 봐. 물에서 서는 걸 보면 너도 알 거다.', "I'll give you one of mine. Stand it. Once you see it stand in the water, you'll know."),
      ], {
        choices: [
          opt('stand', '세워 보겠습니다. 어떻게 서는지 보고 오죠.', "I'll stand it in the water and come back and tell you.", {
            stance: 'giver', aff: { [A]: 0.03 },
            say: ['알겠습니다. 세워 보겠습니다. 어떻게 서는지 보고 오죠.', "All right. I'll stand it in the water, see how it stands, and come back."],
            end: endTalk({ accept: true,
              lineKo: '그래. 서는 걸 보면 너도 안다. 자, 쥐어라. 파도 칠 때 봐라. 잔잔할 땐 아무 찌나 선다.',
              lineEn: "Good. Once you see it stand, you'll know. Here, take it. Watch it when the waves come. Any float stands in flat water." }),
            note: ['문필구 씨의 찌를 받아 바다에 세워 보기로 했다. 파도 칠 때 보라고, 잔잔할 땐 아무 찌나 선다고 했다.',
              "I took Pilgu's float and agreed to stand it in the sea. Watch it in the waves, he said — any float stands in flat water."] }),
          opt('who_first', '두 개가 정말 똑같네요. 어느 쪽이 먼저입니까?', 'They really are identical. Which one came first?', {
            stance: 'mid', next: 'who_first' }),
          opt('same_same', '싸서 샀을 뿐입니다. 찌가 다 거기서 거기 아닙니까?', "I only bought it because it was cheap. Aren't floats all much the same?", {
            stance: 'self', aff: { [A]: -0.04 }, next: 'same_same' }),
          opt('no_feud', '가게 싸움에 끼고 싶진 않은데요.', "I'd rather not get caught up in a shop feud.", {
            stance: 'self', aff: { [A]: -0.03 },
            say: ['죄송하지만, 가게 싸움에 끼고 싶진 않은데요.', "Sorry, but I'd rather not get caught up in a feud between shops."],
            end: endTalk({ decline: true,
              lineKo: '…누가 싸운대. 찌 얘기 하는 거다. 됐다, 가 봐라.',
              lineEn: "...Who said anything about a feud? We're talking about floats. Fine, off you go." }),
            note: ['가게 싸움에 끼고 싶지 않다고 했다. 문필구 씨는 찌 얘기를 하는 거라며 가 보라고 했다. 내 채비 통에서 집어 든 건너편 찌는 돌려주지 않았다.',
              "I said I didn't want to get caught up in a shop feud. Pilgu said he was only talking about floats and told me to go. He didn't give back the float he had taken from my box."] }),
        ],
        note: ['동명항 골목 「필구 찌방」 주인 문필구 씨가 내 채비 통에서 건너편 가게 찌를 집어 들더니, 모양만 자기 것이라며 혀를 찼다. 자기 찌를 하나 줄 테니 바다에 세워 보라고 했다.',
          "Mun Pilgu, who runs Pilgu Floats in the Dongmyeong alley, picked a float from across the street out of my tackle box and clicked his tongue — only the shape was his. He offered me one of his own to stand in the sea."],
      }),
      who_first: scene([
        line(A, '먼저?', 'First?'),
        act(A, 'laugh'),
        line(A, '이 골목에서 찌 깎은 지 사십 년이다. 건너편 간판은 십 년도 안 됐어.', "I've been carving floats in this alley for forty years. That sign across the street isn't ten years old."),
        line(P, '그럼 간판 날짜를 보면 되겠네요.', 'Then the date on the sign settles it.'),
        line(A, '누가 먼저인지는 간판 날짜가 말해 준다. 서는 건 물이 말해 주고. 세워 봐.', 'The date on the sign tells you who came first. The water tells you which one stands. Stand it.'),
      ], {
        choices: [
          opt('water_says', '간판 날짜보다 물이 정확하겠지요. 세워 보겠습니다.', "The water's more honest than a sign. I'll stand it.", {
            stance: 'mid', aff: { [A]: 0.02 },
            end: endTalk({ accept: true,
              lineKo: '말 한번 맞게 하네. 물은 거짓말을 안 해. 자, 쥐어라.',
              lineEn: "Now that's a sensible thing to say. Water doesn't lie. Here, take it." }),
            note: ['간판보다 물이 정확하겠다고 했다. 문필구 씨는 물은 거짓말을 안 한다며 찌를 쥐여 주었다.',
              "I said the water would be more honest than a sign. Water doesn't lie, Pilgu said, and pressed the float into my hand."] }),
          opt('ask_b', '「영배 낚시」 쪽에도 물어봐도 되겠습니까?', 'Would it be all right to ask over at Yeongbae Tackle too?', {
            stance: 'other', aff: { [A]: -0.03 },
            say: ['그럼 길 건너 「영배 낚시」 쪽에도 물어봐도 되겠습니까?', 'Then would it be all right if I asked over at Yeongbae Tackle too?'],
            end: endTalk({ accept: true,
              lineKo: '…물어보든가. 그놈이 뭐라 하든, 찌는 물에 세워 봐야 안다.',
              lineEn: "...Ask, then. Whatever he says, you only know a float once it's in the water." }),
            note: ['건너편 가게에도 물어보겠다고 했다. 문필구 씨는 입을 꾹 다물었다가, 그놈이 뭐라 하든 찌는 물에 세워 봐야 안다고 했다.',
              "I said I'd ask across the street as well. Pilgu pressed his lips together, then said that whatever the other man said, you only know a float once it's in the water."] }),
        ],
        note: ['어느 쪽이 먼저냐고 묻자, 문필구 씨는 코웃음을 치며 이 골목에서 찌를 깎은 지 사십 년이라고 했다. 누가 먼저인지는 간판이, 서는 건 물이 말해 준다고.',
          "When I asked which came first, Pilgu snorted — forty years carving floats in this alley. The sign tells you who came first, he said; the water tells you which one stands."],
      }),
      same_same: scene([
        line(A, '거기서 거기?', 'Much the same?'),
        line(A, '(찌를 도로 빼앗듯 집어 든다.)', '(He all but snatches the float back.)'),
        line(A, '너 같은 손님 때문에 건너편이 장사가 되는 거다.', "It's customers like you that keep that place across the street in business."),
        line(P, '…서든 눕든, 고기만 물면 되는 거 아닙니까?', "...Stands or lies down, as long as a fish bites, what's the difference?"),
        line(A, '찌는 물속 고기가 보는 게 아니라 물 위 사람이 보는 거야. 기울면 입질을 못 본다.', "A float isn't for the fish to see. It's for the person above the water. If it leans, you miss the bite."),
        line(A, '한 번만 세워 보고 다시 말해.', 'Stand it once, then say that again.'),
      ], {
        choices: [
          opt('try_once', '알겠습니다. 한 번 세워 보고 말씀드리죠.', "All right. I'll stand it once and tell you.", {
            stance: 'mid', aff: { [A]: 0.02 },
            end: endTalk({ accept: true, lineKo: '그래. 그거면 된다. 자, 다시 받아라.', lineEn: "Right. That's all I ask. Here, take it again." }),
            note: ['한 번 세워 보고 말하겠다고 했다. 문필구 씨는 그거면 된다며 찌를 다시 내밀었다.', "I said I'd stand it once and report back. That's all he asked, Pilgu said, and held the float out again."] }),
          opt('my_money', '제 돈으로 산 찌는 제가 판단하겠습니다.', "I'll judge the floats I buy with my own money.", {
            stance: 'self', aff: { [A]: -0.05 },
            end: endTalk({ decline: true, lineKo: '…그래, 네 돈이지. 가라.', lineEn: "...Right, it's your money. Go." }),
            note: ['내 돈으로 산 찌는 내가 판단하겠다고 했다. 문필구 씨는 가라며 진열장 문을 탁 닫았다.', "I said I'd judge the floats I bought with my own money. Pilgu told me to go and snapped the display case shut."] }),
        ],
        note: ['찌가 다 거기서 거기 아니냐고 했다가 한 소리 들었다. 찌는 고기가 아니라 물 위 사람이 보는 것이라, 기울면 입질을 못 본다고 했다.',
          "I said floats were all much the same and got an earful. A float is for the person above the water, not the fish, he said — if it leans, you miss the bite."],
      }),
    },
  },

  // N24-1 — 진행 중: 길 건너 차영배와의 첫 만남(목표 1)
  {
    id: 'n24_1_meet_b', questId: 'N24-1', at: 'objective', objectiveIndex: 1, npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '어서 와요.', 'Come on in.', { act: 'look_up' }),
        line(B, '아까 저 건너에서 한참 붙잡혀 있던데. 우리 집 찌 얘기 들었죠?', "You were stuck over there a good while just now. You heard about my floats, I suppose?"),
        line(P, '…다 보셨어요?', '...You saw all that?'),
        act(B, 'laugh'),
        line(B, '괜찮아요. 그 양반 말은 반은 맞아.', "It's fine. Half of what he says is right."),
        line(P, '나머지 반은요?', 'And the other half?'),
        line(B, '나머지 반은 그 양반이 모르는 얘기고.', "The other half is a story he doesn't know."),
      ], {
        choices: [
          opt('half', '모르는 얘기라니요?', "A story he doesn't know?", { stance: 'mid', next: 'half' }),
          opt('his_stands', '문필구 씨 찌가 물에서 더 잘 서던데요.', "Pilgu's float stood better in the water.", {
            stance: 'giver', aff: { [B]: -0.04 },
            say: ['솔직히, 문필구 씨 찌가 물에서 더 잘 서던데요.', "To be honest, Pilgu's float stood better in the water."], next: 'stands' }),
          opt('cheap_good', '찌가 싸서 좋습니다. 계속 여기서 살게요.', "Your floats are cheap, I like that. I'll keep buying here.", {
            stance: 'other', aff: { [B]: 0.04, [A]: -0.02 }, next: 'cheap' }),
        ],
        note: ['길 건너 「영배 낚시」에 들렀다. 주인 차영배 씨는 문필구 씨 말은 반은 맞고, 나머지 반은 그 양반이 모르는 얘기라며 웃었다.',
          "I dropped in at Yeongbae Tackle across the street. The owner, Cha Yeongbae, laughed that half of what Pilgu says is right — and the other half is a story he doesn't know."],
      }),
      half: scene([
        line(B, '(진열장 유리를 손가락으로 톡톡 친다.)', '(He taps the glass of the case with a finger.)'),
        line(B, '그 찌 몸통, 누가 깎았는지 그 양반이 말 안 하죠?', "The body of that float — he doesn't tell you who carved it, does he?"),
        line(P, '누가 깎았는데요?', 'Who carved it?'),
        act(B, 'silence'),
        line(B, '…됐어요. 오래된 얘기예요. 궁금하면 나중에 다시 와요. 오늘은 찌나 하나 더 사 가든가.', "...Never mind. It's an old story. If you're curious, come back another time. Today, maybe just buy another float."),
      ], {
        choices: [
          opt('later', '다음에 다시 듣겠습니다.', "I'll come back and hear it another time.", {
            stance: 'mid', aff: { [B]: 0.02 }, flags: ['choice.n24_b_hint'],
            say: ['그럼 다음에 다시 와서 듣겠습니다.', "Then I'll come back and hear it another time."],
            end: endTalk({ lineKo: '그 양반한테는 내가 웃더라고만 전해요.', lineEn: 'Just tell him I was laughing.' }),
            note: ['그 얘기는 다음에 다시 듣기로 했다. 차영배 씨는 손을 흔들며, 문필구 씨에게는 자기가 웃더라고만 전하라고 했다.',
              "I said I'd come back for that story. Yeongbae waved and told me to tell Pilgu only that he was laughing."] }),
          opt('dont_tease', '말씀 안 하실 거면 처음부터 꺼내지 마시지요.', "If you won't tell me, you shouldn't have brought it up.", {
            stance: 'self', aff: { [B]: -0.03 },
            end: endTalk({ lineKo: '…맞는 말이네. 미안해요.', lineEn: '...Fair enough. Sorry.' }),
            note: ['말하지 않을 거면 꺼내지 말라고 했다. 차영배 씨는 웃음이 조금 식은 얼굴로 미안하다고 했다.', "I said he shouldn't have brought it up if he wouldn't tell me. His smile cooled a little, and he apologized."] }),
        ],
        note: ['차영배 씨는 그 찌 몸통을 누가 깎았는지 문필구 씨가 말하지 않는다고 했다. 누가 깎았느냐고 묻자, 오래된 얘기라며 말을 접었다.',
          "Yeongbae said Pilgu never tells anyone who carved the body of that float. When I asked who did, he dropped it — an old story, he said."],
      }),
      stands: scene([
        act(B, 'silence'),
        act(B, 'laugh'),
        line(B, '그렇지. 그 양반 찌는 서. 오동나무를 삼 년 말리니까.', 'Right. His floats stand. He dries the paulownia for three years.'),
        line(P, '이 집 찌는요?', 'And yours?'),
        line(B, '우리 집 건 공장 몸통이야. 내가 깎을 시간이 없어서.', "Mine have factory bodies. I don't have the time to carve them."),
        line(B, '그래도 그 모양은 내가 그 양반보다 먼저 냈어요. 그건 알아 둬요.', 'But I came up with that shape before he did. Know that much.'),
      ], {
        choices: [
          opt('first', '먼저 내셨다고요?', 'You came up with it first?', {
            stance: 'mid', flags: ['choice.n24_b_hint'],
            end: endTalk({
              lineKo: '오래된 얘기예요. 그 양반 앞에선 꺼내지 마요. 또 한 시간 붙잡혀요.',
              lineEn: "It's an old story. Don't bring it up in front of him. You'll be stuck there another hour." }),
            note: ['그 모양을 먼저 냈다는 말을 되물었다. 차영배 씨는 손사래를 치며, 문필구 씨 앞에선 꺼내지 말라고 했다.', "I asked again about his coming up with the shape first. Yeongbae waved it off and told me not to bring it up in front of Pilgu."] }),
          opt('must_stand', '모양만 같으면 뭐 합니까. 서야 찌지요.', "What good is the shape? A float has to stand.", {
            stance: 'giver', aff: { [B]: -0.04, [A]: 0.02 },
            end: endTalk({ lineKo: '…그 양반 말투가 벌써 옮았네. 잘 가요.', lineEn: "...You've caught his way of talking already. Goodbye." }),
            note: ['모양만 같으면 뭐 하느냐, 서야 찌라고 했다. 차영배 씨의 웃음기가 가셨다. 그 양반 말투가 벌써 옮았다고 했다.', "I said the shape meant nothing; a float has to stand. The smile left Yeongbae's face — I'd already caught Pilgu's way of talking, he said."] }),
        ],
        note: ['문필구 씨 찌가 더 잘 서더라고 했다. 차영배 씨는 그 양반은 오동나무를 삼 년 말린다며 인정했다. 자기 찌는 공장 몸통이지만, 그 모양은 자기가 먼저 냈다고 했다.',
          "I said Pilgu's float stood better. Yeongbae admitted it — Pilgu dries his paulownia three years. His own floats have factory bodies, he said, but he came up with that shape first."],
      }),
      cheap: scene([
        act(B, 'laugh'),
        line(B, '고마워요. 우리 집은 손님 주머니를 생각해요. 찌는 잃어버리는 물건이거든.', "Thank you. This shop thinks about its customers' pockets. Floats are things you lose."),
        line(P, '맞아요. 하루에 두세 개는 잃어버리니까요.', "That's true. I lose two or three a day."),
        line(B, '근데 저 양반, 지금 저쪽 유리문 뒤에서 다 보고 있어요.', "But he's watching all this from behind his glass door right now.", { act: 'look_away' }),
        line(B, '나 때문에 욕먹겠네.', "You'll get an earful because of me."),
      ], {
        choices: [
          opt('my_choice', '보든 말든 제가 살 물건은 제가 고르죠.', "Let him watch. I choose what I buy.", {
            stance: 'other', aff: { [B]: 0.03, [A]: -0.03 },
            end: endTalk({ lineKo: '시원하네. 다음에 또 와요.', lineEn: "That's refreshing. Come again." }),
            note: ['보든 말든 내가 살 물건은 내가 고른다고 했다. 차영배 씨는 시원하다며 웃었다. 길 건너 유리문 뒤에서 문필구 씨가 보고 있었다.', "I said let him watch — I choose what I buy. Yeongbae laughed that it was refreshing. Pilgu was watching from behind his glass door across the street."] }),
          opt('bow_across', '(길 건너에 꾸벅 고개를 숙인다.)', '(I give a little bow across the street.)', {
            stance: 'mid', aff: { [A]: 0.02 },
            end: endTalk({ lineKo: '그 양반, 저거 보고 더 화낼걸요.', lineEn: "He'll be even angrier for that, you know." }),
            note: ['길 건너 문필구 씨에게 꾸벅 고개를 숙였다. 차영배 씨는 덩달아 웃으며, 그 양반이 그걸 보고 더 화낼 거라고 했다.', "I gave a little bow toward Pilgu across the street. Yeongbae laughed along — that would only make him angrier."] }),
        ],
        note: ['찌가 싸서 좋다고 했다. 차영배 씨는 찌는 잃어버리는 물건이라 손님 주머니를 생각한다고 했다. 그러면서 길 건너 유리문 뒤에서 문필구 씨가 보고 있다고 일러 주었다.',
          "I said I liked his floats for being cheap. Floats are things you lose, Yeongbae said, so he thinks of customers' pockets. Then he pointed out Pilgu watching from behind the glass door across the street."],
      }),
    },
  },

  // N24-1 — 끝내는 자리(문필구)
  {
    id: 'n24_1_done', questId: 'N24-1', at: 'complete', npcId: A, start: 'start',
    nodes: {
      start: scene([
        line(A, '섰지? 바로 섰지?', "It stood, didn't it? Straight up?", { act: 'look_up' }),
        line(P, '들어오자마자 그 얘기부터요?', "That's the first thing you ask, the moment I walk in?"),
        line(A, '얼굴 보면 안다. 내 찌는 파도가 쳐도 고개를 안 숙여.', "I can tell from your face. My floats don't bow their heads even in the waves."),
        line(A, '…건너편엔 들렀고? 그놈이 뭐라더냐.', '...And you stopped in across the street? What did he say?'),
      ], {
        choices: [
          opt('stood', '똑바로 서더군요. 건너편 찌와는 확실히 달랐습니다.', 'It stood straight. Nothing like the one from across the street.', {
            stance: 'giver', aff: { [A]: 0.05 }, next: 'pleased' }),
          opt('body', '차영배 씨가 그 모양은 자기가 먼저 냈다던데요.', 'Yeongbae says he came up with that shape first.', {
            stance: 'other', aff: { [A]: -0.06 }, requires: { flag: 'choice.n24_b_hint' }, next: 'body' }),
          opt('both', '두 분 다 상대 얘기를 하시더군요.', 'You both talk about each other, you know.', {
            stance: 'mid', next: 'both' }),
        ],
        note: ['문필구 씨의 찌로 한 마리를 올리고 돌아왔다. 문필구 씨는 들어서자마자 찌가 섰느냐고 묻더니, 건너편에서 그놈이 뭐라더냐고 물었다.',
          "I came back after catching one on Pilgu's float. The moment I walked in he asked whether it stood — then what the man across the street had said."],
      }),
      pleased: scene([
        act(A, 'laugh'),
        line(A, '그렇지. 오동을 삼 년 말려 깎은 거다. 공장 몸통하고 같을 리가 있냐.', "Of course. That's paulownia dried three years before carving. How could it be the same as a factory body?"),
        line(P, '물에 넣으니 바로 고개를 들더라고요.', 'The moment it hit the water, it lifted its head.'),
        line(A, '그놈한테 다음에 가거든 전해라. 모양 베낀다고 찌가 서는 거 아니라고.', "Next time you go over there, tell him. Copying the shape doesn't make a float stand."),
      ], {
        choices: [
          opt('will_tell', '전해 드리지요.', "I'll pass it on.", {
            stance: 'giver',
            say: ['다음에 가면 그대로 전해 드리지요.', "Next time I'm there, I'll pass it on word for word."],
            end: endTalk({ complete: 'float',
              lineKo: '자, 두 개 넣어 주마. 이건 파는 거 아니다. 바다에서 써.',
              lineEn: "Here, I'll put in two. These aren't for sale. Use them at sea." }),
            note: ['그 말을 전하겠다고 했다. 문필구 씨는 처음으로 웃으며, 파는 게 아니라면서 손으로 깎은 찌 두 개를 봉투에 넣어 주었다.', "I said I'd pass it on. Pilgu smiled for the first time and bagged two hand-carved floats for me — not for sale, he said."] }),
          opt('say_yourself', '직접 하시는 게 낫지 않겠습니까.', "Wouldn't it be better to tell him yourself?", {
            stance: 'self', aff: { [A]: -0.02 },
            end: endTalk({ complete: 'pay',
              lineKo: '…길 하나 건너는 데 이십 년 걸린다. 너는 몰라. 수고비나 받아라.',
              lineEn: "...Crossing one street can take twenty years. You wouldn't know. Just take your fee." }),
            note: ['직접 말하는 게 낫지 않겠느냐고 했다. 문필구 씨는 길 하나 건너는 데 이십 년 걸린다며 수고비 봉투를 건넸다.', "I asked if it wouldn't be better to tell him himself. Crossing one street can take twenty years, Pilgu said, and handed me an envelope."] }),
        ],
        note: ['찌가 똑바로 섰다고 하자, 문필구 씨가 처음으로 웃었다. 오동을 삼 년 말려 깎은 거라며, 모양 베낀다고 찌가 서는 게 아니라고 그놈에게 전하라고 했다.',
          "When I said the float stood straight, Pilgu smiled for the first time. Paulownia dried three years, he said — tell him copying the shape doesn't make a float stand."],
      }),
      body: scene([
        line(A, '(찌를 쥔 손이 멈춘다.)', '(The hand holding the float stops.)'),
        line(A, '…그놈이 그러더냐.', '...He said that?'),
        act(A, 'silence'),
        line(A, '모양 낸 손은 그놈 손이어도, 그 모양을 찌로 만든 건 내 수첩이다.', "The hand that shaped it may have been his, but what made that shape a float was my notebook."),
        line(A, '그만 가 봐라. 오늘은 장사 접어야겠다.', "Go on now. I think I'll close up for today."),
      ], {
        choices: [
          opt('sorry', '괜한 말을 전했나 봅니다. 죄송합니다.', "Maybe I shouldn't have passed that on. I'm sorry.", {
            stance: 'giver', aff: { [A]: 0.03 },
            end: endTalk({ complete: 'pay', lineKo: '네가 죄송할 일은 아니다. 수고비다, 받아라.', lineEn: "It's not you who should be sorry. Here's your fee. Take it." }),
            note: ['괜한 말을 전했다고 사과했다. 문필구 씨는 고개를 저으며 내가 죄송할 일은 아니라고, 수고비를 받으라고 했다.', "I apologized for passing that on. Pilgu shook his head — it wasn't for me to be sorry — and told me to take my fee."] }),
          opt('notebook', '수첩이라니요?', 'Your notebook?', {
            stance: 'mid', flags: ['choice.n24_heard_notebook'],
            end: endTalk({ complete: 'learn',
              lineKo: '…아무것도 아니다. 찌 보는 법이나 알려 주마. 봐라, 손가락에 세우면 기울기가 보이지.',
              lineEn: "...It's nothing. I'll show you how to read a float instead. Look — balance it on a finger and you can see the lean." }),
            note: ['수첩이라니 무슨 말이냐고 물었다. 문필구 씨는 말해 놓고 아차 하는 얼굴로, 아무것도 아니라며 찌 보는 법이나 알려 주겠다고 했다.', "I asked what he meant by his notebook. He looked as if he wished he hadn't said it — it was nothing, he said, and showed me how to read a float instead."] }),
        ],
        note: ['차영배 씨가 그 모양을 먼저 냈다더라고 전했다. 문필구 씨는 한참 말이 없다가, 모양 낸 손은 그놈 손이어도 그걸 찌로 만든 건 자기 수첩이라고 했다.',
          "I passed on that Yeongbae said he came up with the shape first. Pilgu was silent for a long time, then said the hand that shaped it may have been his — but his own notebook made it a float."],
      }),
      both: scene([
        act(A, 'laugh'),
        line(A, '그놈이 내 얘기를 해? 뭐라고.', 'He talks about me? Saying what?'),
        line(P, '그게…', 'Well...'),
        line(A, '아니, 듣기 싫다.', "No. I don't want to hear it.", { act: 'shake_head' }),
        line(A, '(진열장을 닦던 걸레를 내려놓는다.)', '(He puts down the rag he was wiping the case with.)'),
        line(A, '찌는 섰지? 그거면 됐다.', "The float stood, didn't it? That's enough."),
      ], {
        choices: [
          opt('it_stood', '섰습니다. 확실히요.', 'It stood. No doubt about it.', {
            stance: 'giver', aff: { [A]: 0.02 },
            end: endTalk({ complete: 'pay', lineKo: '그래. 그거면 됐다. 수고비다.', lineEn: "Right. That's enough, then. Here's your fee." }),
            note: ['찌는 확실히 섰다고 했다. 문필구 씨는 그거면 됐다며 수고비 봉투를 건넸다.', "I said the float definitely stood. That was enough, Pilgu said, and handed me an envelope."] }),
          opt('sit_down', '두 분이 한번 마주 앉으시면 좋겠습니다.', 'I wish the two of you would sit down together sometime.', {
            stance: 'mid', aff: { [A]: -0.02 },
            say: ['언젠가 두 분이 한번 마주 앉으시면 좋겠습니다.', 'I wish the two of you would sit down face to face sometime.'],
            end: endTalk({ complete: 'pay',
              lineKo: '(대답 대신 봉투를 내민다. 문에 달린 종이 오래 흔들린다.)',
              lineEn: '(Instead of answering he holds out an envelope. The bell on the door sways for a long time.)' }),
            note: ['두 분이 한번 마주 앉았으면 좋겠다고 했다. 문필구 씨는 대답 대신 봉투를 내밀었다. 문에 달린 종이 오래 흔들렸다.', "I said I wished the two of them would sit down together. Instead of answering, Pilgu held out an envelope. The bell on the door swayed a long time."] }),
        ],
        note: ['두 분 다 상대 얘기를 하더라고 했다. 문필구 씨는 뭐라더냐고 묻다가, 듣기 싫다며 고개를 저었다. 찌가 섰으면 됐다고 했다.',
          "I said they both talk about each other. Pilgu started to ask what was said, then shook his head — he didn't want to hear it. The float stood; that was enough."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N24-2 「원조」 — 받는 자리(문필구) · 사용자 예시 그대로
  // ═══════════════════════════════════════════
  {
    id: 'n24_2_offer', questId: 'N24-2', at: 'offer', npcId: A, start: 'start',
    nodes: {
      start: scene([
        line(A, '(유리문의 종이를 손가락으로 두드린다.)', '(He taps the notice on the glass door.)'),
        line(A, '봤냐. 「원조는 여기 하나뿐」. 내가 붙였다.', 'See that? There is only one original, and it is here. I put that up.'),
        line(P, '건너편 유리문에도 비슷한 게 붙었던데요.', "There's something like it on the glass door across the street too."),
        line(A, '그놈이 먼저 「원조 문찌」를 써 붙였거든.', 'Because the one across the street put up The original Mun float first.'),
        line(P, '차영배 씨가요?', 'Yeongbae did?'),
        line(A, '그놈, 내 밑에서 아홉 해를 배웠다. 밥 먹여 가며 칼 쥐는 법부터 가르쳤어.', 'Nine years he learned under me. I fed him and taught him from how to hold a knife.'),
        line(A, '그러다 하루아침에 나가서 길 건너에 똑같은 간판을 달았다. 내 찌 모양 그대로, 반값에.', "Then one morning he walked out and hung the same sign across the street. My float's shape exactly, at half the price."),
        line(A, '이번엔 그냥 못 넘긴다. 네가 좀 해 줘야겠다.', "This time I can't let it go. You'll have to do something for me."),
      ], {
        choices: [
          opt('too_far', '그건 너무했네요. 배운 집 앞에 같은 간판이라니요.', 'That was going too far. The same sign right in front of the shop that taught him.', {
            stance: 'giver', aff: { [A]: 0.05 }, next: 'plan' }),
          opt('not_bad', '그래도 차영배 씨가 딱히 나쁜 사람 같지는 않던데요.', "Still, Yeongbae didn't strike me as a bad man.", {
            stance: 'other', aff: { [A]: -0.08 }, next: 'whose_side' }),
          opt('listen', '두 분 사이에 무슨 일이 있었는지 더 듣고 싶습니다.', "I'd like to hear more about what happened between you two.", {
            stance: 'mid', aff: { [A]: -0.01 }, flags: ['choice.n24_heard_notebook'], next: 'listen' }),
          opt('stay_out', '남의 가게 싸움에 끼고 싶지 않습니다.', "I don't want to get caught up in someone else's shop feud.", {
            stance: 'self', aff: { [A]: -0.04 },
            end: endTalk({ decline: true,
              lineKo: '…싸움이라. 그래, 너한텐 싸움으로 보이겠지. 가 봐라.',
              lineEn: "...A feud. Right, I suppose that's how it looks to you. Off you go." }),
            note: ['남의 가게 싸움에 끼고 싶지 않다고 했다. 문필구 씨는 너한텐 싸움으로 보이겠다며, 유리문의 종이를 손바닥으로 쓸어 폈다. 내 쪽은 보지 않았다.',
              "I said I didn't want to get caught up in another shop's feud. I suppose that's how it looks to you, Pilgu said, smoothing the notice on his glass door with his palm. He didn't look my way."] }),
        ],
        note: ['두 가게 유리문에 같은 「원조」 종이가 붙었다. 문필구 씨는 차영배 씨가 자기 밑에서 아홉 해를 배우고는 하루아침에 나가 길 건너에 같은 간판을 달았다며, 이번엔 그냥 못 넘긴다고 했다.',
          "The same notice — The Original — hung on both glass doors. Pilgu said Yeongbae learned under him for nine years, then walked out one morning and hung the same sign across the street. This time he couldn't let it go."],
      }),
      whose_side: scene([
        line(A, '뭐라고?', 'What?'),
        line(A, '(의자를 밀고 일어선다.)', '(He pushes back his chair and stands.)'),
        line(A, '너는 지금 누구 편을 드는 거냐? 영배 그놈이 잘한 게 뭐가 있다고!', 'Whose side are you on? What has Yeongbae ever done right?'),
        line(P, '편을 드는 게 아니라…', "I'm not taking sides, I just—"),
        line(A, '남의 찌 모양 가져다 반값에 판 놈이야. 그게 나쁜 사람이 아니면 누가 나쁜 사람이냐.', "He took another man's float and sold it at half price. If that's not a bad man, who is?"),
      ], {
        choices: [
          opt('apologize', '제가 말이 짧았습니다. 말씀을 더 듣겠습니다.', "I spoke too quickly. I'll hear you out.", {
            stance: 'giver', aff: { [A]: 0.03 }, next: 'plan' }),
          opt('both_same', '둘 다 같은 사람인 것 같습니다.', 'You two seem like the same kind of man to me.', {
            stance: 'mid', aff: { [A]: -0.06 },
            say: ['…제가 보기엔, 둘 다 같은 사람인 것 같습니다.', '...The way I see it, you two seem like the same kind of man.'], next: 'no_help' }),
          opt('silent', '(아무 말 없이 고개를 숙인다.)', '(I lower my head and say nothing.)', { stance: 'self', next: 'plan' }),
        ],
        note: ['차영배 씨가 나쁜 사람 같지는 않더라고 했다가, 문필구 씨가 의자를 밀고 일어섰다. 누구 편을 드는 거냐고, 남의 찌 모양을 가져다 반값에 판 놈이라고 했다.',
          "When I said Yeongbae didn't seem like a bad man, Pilgu pushed back his chair and stood. Whose side was I on? The man took another's float and sold it at half price."],
      }),
      no_help: scene([
        line(A, '(한참 나를 노려본다.)', '(He glares at me for a long while.)'),
        line(A, '…너는 나를 도울 생각이 없는 거지?', "...You've got no intention of helping me, have you?"),
      ], {
        choices: [
          opt('not_that', '그건 아닙니다만…', "That's not it, but...", {
            stance: 'mid',
            end: endTalk({ accept: true, offer: 'help_him',
              lineKo: '그럼 내가 말하는 대로 우선 영배를 자극해.\n\n그놈 찌로 한 마리 낚아서 눕는 걸 봐 두고, 그놈 가게에 가서 물어. 원조라면서 왜 눕느냐고. 얼굴이 시뻘게질 거다.',
              lineEn: "Then do as I say. Get under Yeongbae's skin first.\n\nCatch one on his float and watch it lie down, then go to his shop and ask him. If it's the original, why does it lie down? His face will go red." }),
            note: ['그건 아니라고 얼버무렸다. 문필구 씨는 찌 하나를 탁자에 탁 내려놓으며, 그놈 찌로 한 마리 낚아 눕는 걸 보고 가서 원조라면서 왜 눕느냐고 물으라고 했다.',
              "I mumbled that it wasn't that. Pilgu slapped a float down on the table: catch one on his float, watch it lie down, then go ask him why the original lies down."] }),
          opt('ask_him', '차영배 씨에게도 의견을 물어봐야 하지 않을까요?', "Shouldn't we ask Yeongbae what he thinks too?", {
            stance: 'other', aff: { [A]: -0.08 }, flags: ['choice.n24_mission_tell'],
            end: endTalk({ accept: true,
              lineKo: '영배한테 가서, 다 내가 시킨 일이니 그렇다고 해라! 못난 놈!\n\n가. 그놈 찌로 한 마리 낚아 보고, 가서 그놈 얼굴이나 보고 와.',
              lineEn: "Then go to Yeongbae and tell him this was all my doing! Hopeless!\n\nGo. Catch one on his float, then go and look him in the face." }),
            note: ['차영배 씨에게도 의견을 물어야 하지 않겠느냐고 했다. 문필구 씨는 탁자를 내리치며, 다 자기가 시킨 일이니 그렇다고 하라고 소리쳤다.',
              "I said we should ask Yeongbae too. Pilgu slammed the table and shouted for me to go tell him it was all his doing."] }),
          opt('leave', '(대답하지 않고 일어선다.)', '(I stand up without answering.)', {
            stance: 'self', aff: { [A]: -0.04 },
            end: endTalk({ decline: true, lineKo: '…다들 그렇지. 가라.', lineEn: "...They're all the same. Go." }),
            note: ['대답하지 않고 일어섰다. 등 뒤로 혀 차는 소리가 들렸다.', 'I stood up without answering. Behind me, I heard him click his tongue.'] }),
        ],
        note: ['둘 다 같은 사람 같다고 했다. 문필구 씨는 한참 나를 노려보더니, 자기를 도울 생각이 없는 거냐고 물었다.',
          'I said they seemed like the same kind of man. Pilgu glared at me for a long while, then asked whether I had any intention of helping him.'],
      }),
      listen: scene([
        act(A, 'sigh'),
        line(A, '들어서 뭐 하게.', 'What good will hearing it do?'),
        line(P, '그래도 알고 싶습니다.', "I'd still like to know."),
        line(A, '…아홉 해다. 손이 빨랐어. 내가 깎은 걸 한 번 보면 그대로 깎았지.', "...Nine years. Quick hands. Show him something I'd carved once and he'd carve it the same."),
        line(A, '그런 놈이 어느 날 내 작업 수첩에서 한 장을 찢어 들고 나갔다.', 'Then one day he tore a page out of my workshop notebook and walked out with it.'),
        line(A, '그 수첩에 문찌가 다 들어 있었어. 그러니 원조를 써 붙이지.', "Everything about the Mun float was in that notebook. No wonder he puts up 'the original.'"),
      ], {
        choices: [
          opt('theft', '수첩을 찢어 갔다고요? 그건 도둑질 아닙니까.', "He tore it out of your notebook? Isn't that theft?", {
            stance: 'giver', aff: { [A]: 0.04 }, next: 'plan' }),
          opt('his_hand', '그 수첩에 차영배 씨 손이 간 건 없습니까?', "Is there nothing in that notebook from Yeongbae's own hand?", {
            stance: 'other', aff: { [A]: -0.07 }, next: 'whose_side' }),
          opt('what_want', '그래서 저한테 바라시는 게 뭡니까?', 'So what is it you want from me?', { stance: 'mid', next: 'plan' }),
        ],
        note: ['두 사람 사이에 무슨 일이 있었는지 물었다. 문필구 씨는 한숨을 쉬며, 손이 빠른 제자였는데 어느 날 자기 작업 수첩에서 한 장을 찢어 들고 나갔다고 했다.',
          "I asked what happened between them. Pilgu sighed: a quick-handed apprentice who one day tore a page out of his workshop notebook and walked out with it."],
      }),
      plan: scene([
        line(A, '(목소리를 낮춘다.)', '(He lowers his voice.)'),
        line(A, '그놈 찌로 한 마리 낚아 봐라. 파도에 어떻게 눕는지 네 눈으로 보는 거다.', 'Catch one on his float. See with your own eyes how it lies down in the waves.'),
        line(P, '그다음에는요?', 'And then?'),
        line(A, '그다음에 그놈 가게에 가서 물어. 원조라면서 왜 눕느냐고.', "Then go to his shop and ask him. If it's the original, why does it lie down?"),
        line(A, '그 얼굴만 보고 와. 그거면 된다.', "Just see his face. That's all."),
      ], {
        choices: [
          opt('will_go', '알겠습니다. 다녀오겠습니다.', "Understood. I'll go.", {
            stance: 'giver', aff: { [A]: 0.03 },
            end: endTalk({ accept: true, offer: 'help_him', lineKo: '그래. 너는 말이 통하는구나.', lineEn: 'Good. You and I understand each other.' }),
            note: ['다녀오겠다고 했다. 문필구 씨는 처음으로 내 어깨를 두드리며, 말이 통한다고 했다.', "I said I'd go. For the first time Pilgu patted my shoulder — we understood each other, he said."] }),
          opt('own_words', '가 보겠습니다. 다만 무슨 말을 할지는 제가 정하겠습니다.', "I'll go. But I'll decide what to say myself.", {
            stance: 'mid', aff: { [A]: -0.02 },
            end: endTalk({ accept: true, offer: 'my_way',
              lineKo: '…네 입이니 네가 정하겠지. 대신 빈손으로는 오지 마라.',
              lineEn: "...It's your mouth, so I suppose you'll decide. Just don't come back empty-handed." }),
            note: ['가겠지만 무슨 말을 할지는 내가 정하겠다고 했다. 문필구 씨는 눈을 가늘게 뜨더니, 대신 빈손으로는 오지 말라고 했다. 그놈 찌로 한 마리는 낚아 오라고.',
              "I said I'd go but would decide what to say myself. Pilgu narrowed his eyes — then don't come back empty-handed. At least catch one on the man's float."] }),
          opt('wont', '그런 일이라면 못 하겠습니다.', "If that's the job, I can't do it.", {
            stance: 'self', aff: { [A]: -0.05 },
            end: endTalk({ decline: true, lineKo: '그래, 깨끗한 손으로 살아라. 나는 이십 년을 더럽혔다.', lineEn: "Fine. Keep your hands clean. I've spent twenty years getting mine dirty." }),
            note: ['그런 일이라면 못 하겠다고 했다. 문필구 씨는 깨끗한 손으로 살라며, 자기는 이십 년을 더럽혔다고 했다.', "I said I couldn't do that kind of job. Keep your hands clean, Pilgu said — he had spent twenty years getting his dirty."] }),
        ],
        note: ['문필구 씨가 목소리를 낮췄다. 건너편 찌로 한 마리 낚아 파도에 어떻게 눕는지 보고, 그 가게에 가서 원조라면서 왜 눕느냐고 물어보라고 했다. 그 얼굴만 보고 오라고.',
          "Pilgu lowered his voice. Catch one on the float from across the street and watch how it lies down in the waves, then go ask why the original lies down. Just see the man's face."],
      }),
    },
  },

  // N24-2 — 진행 중: 차영배 앞(목표 1). 사실대로 / 감추고 자극 / 중도
  {
    id: 'n24_2_face_b', questId: 'N24-2', at: 'objective', objectiveIndex: 1, npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '또 왔네요.', 'You again.', { act: 'look_up' }),
        line(B, '오늘은 얼굴이 심부름 온 얼굴인데.', "Today you've got the look of someone sent on an errand."),
        line(P, '…티가 납니까?', '...Is it that obvious?'),
        line(B, '(유리문에 붙은 「원조 문찌」 종이를 턱으로 가리킨다.)', '(He nods at the notice on his glass door: The original Mun float.)'),
        line(B, '저거 때문에 왔죠?', "You're here about that, aren't you?"),
      ], {
        choices: [
          opt('tell_truth', '문필구 씨가 보내셨습니다. 다 자기가 시킨 일이라더군요.', 'Pilgu sent me. He said this is all his doing.', {
            stance: 'giver', aff: { [B]: -0.1 }, flags: ['choice.n24_told_truth'], requires: { flag: 'choice.n24_mission_tell' },
            say: ['문필구 씨가 보내셨습니다. 다 자기가 시킨 일이니 그렇게 전하라더군요.', 'Pilgu sent me. He said to tell you this is all his doing.'], next: 'angry_truth' }),
          opt('provoke', '그 찌, 원조라면서 왜 파도에 눕습니까?', 'If that float is the original, why does it lie down in the waves?', {
            stance: 'giver', aff: { [B]: -0.12, [A]: 0.03 }, flags: ['choice.n24_provoked'], next: 'angry_provoke' }),
          opt('honest_mid', '문필구 씨가 보내셨어요. 그래도 이쪽 얘기도 듣고 싶습니다.', 'Pilgu sent me. But I want to hear your side too.', {
            stance: 'mid', aff: { [B]: -0.03 }, flags: ['choice.n24_told_truth', 'choice.n24_heard_b'],
            say: ['사실은 문필구 씨가 보내셨습니다. 그런데 저는 차영배 씨 얘기도 듣고 싶습니다.', "The truth is, Pilgu sent me. But I'd like to hear your side too, Yeongbae."], next: 'confide' }),
          opt('pretend', '그냥 찌 사러 왔습니다.', 'I just came to buy a float.', { stance: 'self', next: 'pretend' }),
        ],
        note: ['건너편 찌로 한 마리를 올린 뒤 「영배 낚시」에 들렀다. 차영배 씨는 나를 보자마자 웃음이 반쯤 걷히며, 저 종이 때문에 왔느냐고 물었다.',
          "After catching one on the float from across the street, I went to Yeongbae Tackle. The moment he saw me, Yeongbae's smile half faded, and he asked if I was there about that notice."],
      }),
      angry_truth: scene([
        line(B, '뭐라고?', 'What?'),
        line(B, '(찌를 닦던 손이 멈춘다.)', '(His hand stops on the float he was wiping.)'),
        line(B, '형님이 그랬다고 한들, 너도 매한가지로구나!', "Even if it was Pilgu's doing, you're no better!"),
        line(P, '그게…', 'Well...'),
        line(B, '시킨 사람이나 시킨다고 오는 사람이나. 이십 년을 길 건너에서 쳐다보기만 하더니, 이제는 남의 입을 빌려 말하네.', "The one who sends and the one who comes when he's sent. Twenty years of staring from across the street, and now he talks through someone else's mouth."),
      ], {
        choices: [
          opt('just_passed', '전하라는 말만 전했습니다. 판단은 차영배 씨 몫입니다.', "I only passed on what I was told. What you make of it is up to you.", {
            stance: 'mid', aff: { [B]: -0.02 },
            end: endTalk({ lineKo: '…그래, 전했으면 가요. 오늘은 장사 안 해요.', lineEn: "...Fine. If you've passed it on, go. I'm not open today." }),
            note: ['전하라는 말만 전했을 뿐이라고 했다. 차영배 씨는 등을 돌리며, 전했으면 가라고 했다. 오늘은 장사 안 한다고.', "I said I'd only passed on what I was told. Yeongbae turned his back — if I'd passed it on, go. He wasn't open today."] }),
          opt('rude_sorry', '제가 무례했습니다. 차영배 씨 얘기도 듣고 싶습니다.', 'That was rude of me. I want to hear your side too.', {
            stance: 'other', aff: { [B]: 0.04 }, flags: ['choice.n24_heard_b', 'choice.n24_heard_notebook'], next: 'confide_late' }),
        ],
        note: ['문필구 씨가 시킨 일이라고 그대로 전했다. 차영배 씨는 찌를 닦던 손을 멈추고, 형님이 그랬다고 한들 너도 매한가지라고 소리쳤다.',
          "I told him plainly it was Pilgu's doing. Yeongbae's hand stopped on the float he was wiping. Even if it was Pilgu's doing, he shouted, I was no better."],
      }),
      angry_provoke: scene([
        line(B, '(얼굴이 붉어진다.)', '(His face reddens.)'),
        line(B, '…누가 시켰는지 안 봐도 알겠네.', "...I don't need to ask who put you up to it."),
        line(B, '뭐라고? 형님이 그랬다고 한들, 너도 매한가지로구나!', "What? Even if it was Pilgu's doing, you're no better!"),
        line(B, '남의 가게에 와서 손님들 앞에서 그 말을 해?', "Coming into another man's shop and saying that in front of his customers?"),
      ], {
        choices: [
          opt('it_lies', '눕는 건 사실 아닙니까.', "Well, it does lie down, doesn't it?", {
            stance: 'giver', aff: { [B]: -0.05, [A]: 0.03 },
            end: endTalk({ lineKo: '나가요. 다신 오지 마요.', lineEn: "Get out. Don't come back." }),
            note: ['눕는 건 사실이지 않느냐고 했다. 차영배 씨는 진열장 유리를 쾅 닫고, 나가라고, 다신 오지 말라고 했다.', "I said it did lie down, didn't it. Yeongbae slammed the glass case shut and told me to get out and never come back."] }),
          opt('too_far_sorry', '말이 지나쳤습니다. 죄송합니다.', "That went too far. I'm sorry.", {
            stance: 'mid', aff: { [B]: 0.03 }, next: 'sorry' }),
        ],
        note: ['원조라면서 왜 눕느냐고 물었다. 차영배 씨는 얼굴이 붉어지더니, 누가 시켰는지 안 봐도 안다며 너도 매한가지라고 했다. 손님들 앞에서였다.',
          "I asked why the original lies down. Yeongbae's face reddened — he didn't need to ask who put me up to it, and I was no better. In front of his customers."],
      }),
      sorry: scene([
        act(B, 'sigh'),
        line(B, '…됐어요. 그 양반 말버릇 옮은 거 알아요. 나도 저 집에서 아홉 해 그 말 듣고 살았으니까.', "...Never mind. I know you caught his way of talking. I lived nine years in that shop hearing it too."),
        line(P, '그래도 눕는 건…', 'Still, the way it lies down...'),
        line(B, '눕는 건 맞아요. 공장 몸통이라.', "It does lie down, that's true. Factory bodies."),
        line(B, '근데 그 몸통 모양을 처음 낸 게 누군지는, 그 양반 수첩이 알아요.', 'But who first came up with that body shape, his notebook knows.'),
      ], {
        choices: [
          opt('notebook', '수첩이요?', 'His notebook?', {
            stance: 'mid', flags: ['choice.n24_heard_b', 'choice.n24_heard_notebook'],
            end: endTalk({ lineKo: '오늘은 여기까지. 그 양반한테는 내가 화냈다고 전해요. 그래야 좋아하지.', lineEn: "That's enough for today. Tell him I got angry. That'll please him." }),
            note: ['수첩이 무슨 말이냐고 물었다. 차영배 씨는 고개를 저으며 오늘은 여기까지라고, 문필구 씨에게는 자기가 화냈다고 전하라고 했다. 그래야 좋아한다고.', "I asked what he meant by the notebook. Yeongbae shook his head — that was enough for today. Tell Pilgu he got angry; that would please him."] }),
        ],
        note: ['말이 지나쳤다고 사과했다. 차영배 씨는 숨을 고르며, 공장 몸통이라 눕는 건 맞다고 했다. 그런데 그 몸통 모양을 처음 낸 게 누군지는 문필구 씨 수첩이 안다고.',
          "I apologized for going too far. Yeongbae caught his breath and admitted his floats lie down — factory bodies. But who first came up with that body shape, Pilgu's notebook knows, he said."],
      }),
      confide: scene([
        line(B, '(한참 나를 본다.)', '(He looks at me for a long time.)'),
        line(B, '…솔직하네요. 그 양반이 보낸 사람치고.', "...You're honest. For someone he sent."),
        line(B, '(걸레를 내려놓는다.)', '(He puts down his rag.)'),
        line(B, '문찌 몸통, 그 물방울 모양. 그거 내가 깎았어요. 형님 밑에 있을 때.', 'The body of the Mun float, that teardrop shape. I carved that. Back when I worked for him.'),
        line(P, '차영배 씨가요?', 'You did?'),
        line(B, '형님은 그걸 수첩에 적고 「문찌」라고 팔았죠. 나는 그게 싫어서 나왔고.', "He wrote it in his notebook and sold it as the Mun float. I couldn't stand that, so I left."),
      ], {
        choices: [
          opt('both_origin', '그럼 원조는 두 분 다인 셈이네요.', "Then you could say you're both the original.", {
            stance: 'mid', aff: { [B]: 0.04 }, flags: ['choice.n24_both_origin'],
            end: endTalk({ lineKo: '그 말을 그 양반 앞에서도 할 수 있으면, 그때 다시 얘기해요.', lineEn: 'If you can say that in front of him too, then we\'ll talk again.' }),
            note: ['그럼 원조는 두 분 다인 셈이라고 했다. 차영배 씨는 쓴웃음을 지으며, 그 말을 문필구 씨 앞에서도 할 수 있으면 그때 다시 얘기하자고 했다.', "I said that made them both the original. Yeongbae smiled bitterly — if I could say that in front of Pilgu too, we'd talk again."] }),
          opt('still_wrong', '그래도 남의 수첩을 찢어 간 건 잘못 아닙니까.', "Still, tearing a page from another man's notebook was wrong, wasn't it?", {
            stance: 'giver', aff: { [B]: -0.05 },
            end: endTalk({ lineKo: '찢어 간 게 아니라 내 장을 가져온 거예요. …그만해요.', lineEn: "I didn't tear it out. I took back my own page. ...That's enough." }),
            note: ['그래도 남의 수첩을 찢어 간 건 잘못이지 않느냐고 했다. 차영배 씨는 입술을 깨물며, 찢어 간 게 아니라 자기 장을 가져온 거라고 했다.', "I said tearing a page from another man's notebook was still wrong. Yeongbae bit his lip — he didn't tear it out; he took back his own page."] }),
        ],
        note: ['문필구 씨가 보냈다고 솔직히 말하고, 차영배 씨 얘기도 듣고 싶다고 했다. 차영배 씨는 문찌의 물방울 몸통을 자기가 깎았다고 털어놓았다. 문필구 씨가 그걸 수첩에 적고 「문찌」라고 판 게 싫어서 나왔다고.',
          "I admitted Pilgu had sent me and said I wanted to hear Yeongbae's side. He confessed that he carved the teardrop body of the Mun float — and left because Pilgu wrote it in his notebook and sold it as the Mun float."],
      }),
      confide_late: scene([
        act(B, 'sigh'),
        line(B, '…문찌 몸통, 그 물방울 모양 말이에요. 그거 내가 깎았어요.', '...The body of the Mun float, that teardrop shape. I carved it.'),
        line(B, '형님은 그걸 수첩에 적고 「문찌」라고 팔았죠.', 'He wrote it in his notebook and sold it as the Mun float.'),
        line(P, '그래서 「원조」를 써 붙이신 거군요.', "So that's why you put up 'the original.'"),
        line(B, '그 수첩 앞에 내 이름이 한 줄도 없어서예요. 그게 다예요.', "Because my name isn't on a single line of that notebook's front pages. That's all."),
      ], {
        choices: [
          opt('ever_told', '그 얘기, 문필구 씨께 직접 하신 적은 있습니까?', 'Have you ever said that to Pilgu yourself?', {
            stance: 'mid', aff: { [B]: 0.02 },
            end: endTalk({ lineKo: '이십 년 동안 길 하나를 못 건넜어요. 형님도, 나도.', lineEn: 'In twenty years neither of us has managed to cross one street. Not him, not me.' }),
            note: ['그 얘기를 문필구 씨에게 직접 한 적이 있느냐고 물었다. 차영배 씨는 고개를 저으며, 이십 년 동안 둘 다 길 하나를 못 건넜다고 했다.', "I asked whether he had ever told Pilgu himself. Yeongbae shook his head: in twenty years, neither of them had managed to cross one street."] }),
        ],
        note: ['무례했다고 사과하자, 차영배 씨가 길게 숨을 내쉬고 털어놓았다. 문찌의 물방울 몸통은 자기가 깎았고, 「원조」를 써 붙인 건 그 수첩에 자기 이름이 한 줄도 없어서라고.',
          "When I apologized for my rudeness, Yeongbae let out a long breath and told me: he carved the teardrop body of the Mun float, and he put up 'the original' because his name isn't on a single line of that notebook."],
      }),
      pretend: scene([
        act(B, 'laugh'),
        line(B, '찌 사러 온 얼굴이 아닌데. 뭐, 좋아요. 어떤 걸로?', "That's not the face of someone here to buy a float. Well, fine. Which one?"),
        line(P, '…추천해 주시는 걸로요.', '...Whatever you recommend.'),
        line(B, '(진열장을 열며 길 건너를 힐끔 본다.)', '(He opens the case and glances across the street.)'),
        line(B, '저 양반이 유리문 뒤에서 또 보고 있네.', "He's watching from behind his glass door again."),
      ], {
        choices: [
          opt('which_original', '원조 문찌로 하나 주세요. 원조가 맞긴 합니까?', "I'll take an original Mun float. Is it really the original?", {
            stance: 'giver', aff: { [B]: -0.08, [A]: 0.02 }, flags: ['choice.n24_provoked'], next: 'angry_provoke' }),
          opt('confess', '이 집 찌로 하나 주세요. 사실은 문필구 씨가 보내셨습니다.', "One of your floats, please. And the truth is, Pilgu sent me.", {
            stance: 'mid', aff: { [B]: -0.03 }, flags: ['choice.n24_told_truth', 'choice.n24_heard_b'], next: 'confide' }),
          opt('just_buy', '(찌만 하나 사서 나온다.)', '(I just buy a float and leave.)', {
            stance: 'self',
            end: endTalk({ lineKo: '또 와요. 다음엔 심부름 말고.', lineEn: 'Come again. Next time, not on an errand.' }),
            note: ['찌만 하나 사서 나왔다. 차영배 씨는 봉투에 찌를 넣어 주며, 다음엔 심부름 말고 오라고 했다.', "I just bought a float and left. Yeongbae bagged it for me and said to come again — next time, not on an errand."] }),
        ],
        note: ['그냥 찌 사러 왔다고 했다. 차영배 씨는 찌 사러 온 얼굴이 아니라며 웃고는, 길 건너 유리문 뒤에서 문필구 씨가 또 보고 있다고 했다.',
          "I said I'd just come to buy a float. Yeongbae laughed that it wasn't the face of a buyer, then said Pilgu was watching from behind his glass door again."],
      }),
    },
  },

  // N24-2 — 끝내는 자리(문필구)
  {
    id: 'n24_2_done', questId: 'N24-2', at: 'complete', npcId: A, start: 'start',
    nodes: {
      start: scene([
        line(A, '(유리문 앞에서 기다리고 있었다.)', '(He was waiting by the glass door.)'),
        line(A, '봤다. 유리문 너머로 다 봤어.', 'I saw. I saw it all through the glass.'),
        line(P, '보셨으면 아시겠네요.', 'If you saw, then you know.'),
        line(A, '소리는 안 들려. 그래서, 그놈 얼굴이 어떻더냐.', "I can't hear through glass. So — what did his face look like?"),
      ], {
        choices: [
          opt('red_face', '말씀대로 물었습니다. 얼굴이 시뻘개지더군요.', 'I asked him, as you said. His face went bright red.', {
            stance: 'giver', aff: { [A]: 0.06 }, requires: { flag: 'choice.n24_provoked' }, next: 'gloat' }),
          opt('told', '시키신 일이라고 그대로 전했습니다.', 'I told him plainly that it was your doing.', {
            stance: 'mid', aff: { [A]: -0.03 }, requires: { flag: 'choice.n24_told_truth' }, next: 'told' }),
          opt('body', '차영배 씨는 그 몸통을 자기가 깎았다고 하더군요.', 'Yeongbae says he carved that body himself.', {
            stance: 'other', aff: { [A]: -0.06 }, requires: { flag: 'choice.n24_heard_b' }, next: 'body' }),
          opt('bought', '그냥 찌만 하나 사 왔습니다.', 'I just bought a float and came back.', { stance: 'self', next: 'bought' }),
        ],
        note: ['차영배 씨를 만나고 돌아왔다. 문필구 씨는 유리문 앞에서 기다리고 있었다. 유리문 너머로 다 봤지만 소리는 안 들린다며, 그놈 얼굴이 어떻더냐고 물었다.',
          "I came back from seeing Yeongbae. Pilgu had been waiting by his glass door. He had seen it all, he said, but couldn't hear through glass — what did the man's face look like?"],
      }),
      gloat: scene([
        act(A, 'laugh'),
        line(A, '그렇지! 그놈은 그 말에 약해. 원조 소리에.', "That's it! That's his weak spot. The word original."),
        line(P, '…', '...'),
        line(A, '(웃음이 금방 꺼진다.)', '(The laugh dies quickly.)'),
        line(A, '…그래. 시뻘개졌단 말이지.', '...Right. Bright red, you say.'),
      ], {
        choices: [
          opt('relieved', '속이 시원하십니까?', 'Do you feel better now?', {
            stance: 'mid',
            end: endTalk({ complete: 'pay', lineKo: '…수고했다. 이건 수고비다.', lineEn: '...Good work. Here, your fee.' }),
            note: ['속이 시원하냐고 물었다. 문필구 씨는 대답 대신 찌 깎던 칼을 내려놓고, 수고했다며 수고비를 건넸다.', "I asked if he felt better. Instead of answering, Pilgu put down his carving knife and handed me my fee."] }),
          opt('whats_next', '다음엔 뭘 할까요?', 'What should I do next?', {
            stance: 'giver', aff: { [A]: 0.03 }, flags: ['choice.n24_revenge_more'],
            end: endTalk({ complete: 'pay',
              lineKo: '다음? 다음은 어촌계다. 원조가 누군지 공식으로 가리자고 할 거다. 그때 네가 본 걸 말해 줘야 한다.',
              lineEn: "Next? Next is the co-op. I'll have them decide officially who the original is. When that happens, you'll tell them what you saw." }),
            note: ['다음엔 뭘 할지 물었다. 문필구 씨는 눈이 번쩍하더니, 어촌계에서 원조를 공식으로 가리자고 할 거라며 그때 내가 본 걸 말해 달라고 했다.', "I asked what to do next. Pilgu's eyes lit up — he would take it to the co-op to settle the original officially, and I would tell them what I saw."] }),
        ],
        note: ['말씀대로 물었더니 얼굴이 시뻘개지더라고 했다. 문필구 씨는 손뼉을 치며 좋아하다가, 웃음이 금방 꺼졌다.',
          "I said I'd asked as he told me and the man's face went bright red. Pilgu clapped his hands with glee — then the laugh died quickly."],
      }),
      told: scene([
        line(A, '그대로 전했다고.', 'You told him straight.', { act: 'look_away' }),
        line(A, '…내가 시킨 일이라고.', '...That it was my doing.'),
        act(A, 'silence'),
        line(A, '그놈이 뭐라더냐. 아니, 됐다. 화냈겠지. 그놈은 화낼 때 귀가 빨개져.', "What did he say? No, never mind. He got angry. His ears go red when he's angry."),
      ], {
        choices: [
          opt('his_side', '귀가 빨개지셨습니다. 그리고 문필구 씨 얘기도 조금 하셨습니다.', 'His ears went red. And he said a little about you too.', {
            stance: 'mid',
            end: endTalk({ complete: 'nopay', lineKo: '…그놈이 내 얘기를 했다고. 다음에 마저 듣자. 오늘은 가라.', lineEn: '...He talked about me. Tell me the rest another time. Go for today.' }),
            note: ['귀가 빨개졌고 문필구 씨 얘기도 조금 하더라고 했다. 문필구 씨는 창밖 건너편을 보며 다음에 마저 듣자고 했다. 봉투를 내밀다가 도로 거뒀다.', "I said his ears went red and he spoke a little about Pilgu too. Pilgu looked out across the street and said he'd hear the rest another time. He began to hold out an envelope, then took it back."] }),
          opt('as_told', '말씀대로 했을 뿐입니다.', 'I only did as you told me.', {
            stance: 'giver',
            end: endTalk({ complete: 'pay', lineKo: '그래. 내가 시켰다. 그건 내가 지고 가마. 수고비다.', lineEn: "Right. I sent you. I'll carry that myself. Here's your fee." }),
            note: ['말씀대로 했을 뿐이라고 했다. 문필구 씨는 고개를 끄덕이며, 자기가 시켰으니 그건 자기가 지고 가겠다고 했다.', "I said I'd only done as told. Pilgu nodded — he sent me, so he would carry that himself."] }),
        ],
        note: ['시킨 일이라고 그대로 전했다고 했다. 문필구 씨의 입꼬리가 내려갔다. 한참 있다가, 그놈은 화낼 때 귀가 빨개진다고 했다.',
          "I said I'd told him plainly it was Pilgu's doing. The corners of Pilgu's mouth dropped. After a long pause he said the man's ears go red when he's angry."],
      }),
      body: scene([
        line(A, '(얼굴이 굳는다.)', '(His face hardens.)'),
        line(A, '…그놈이 그러더냐. 몸통은 자기가 깎았다고.', '...He said that? That he carved the body.'),
        line(A, '(서랍을 열었다가 도로 닫는다.)', '(He opens a drawer, then shuts it again.)'),
        line(A, '깎은 손은 그놈 손이 맞다. 그런데 그걸 찌로 만든 건 내 수첩이야. 손 하나로 찌가 되는 줄 아냐.', "The hand that carved it was his, true. But what made it a float was my notebook. You think one pair of hands makes a float?"),
      ], {
        choices: [
          opt('show_notebook', '수첩을 한번 보여 주실 수 있습니까?', 'Could you show me the notebook?', {
            stance: 'mid', aff: { [A]: -0.02 },
            end: endTalk({ complete: 'float', lineKo: '…다음에. 다음에 와라. 오늘은 이거나 가져가.', lineEn: '...Another time. Come another time. Take this for today.' }),
            note: ['수첩을 보여 줄 수 있느냐고 했다. 문필구 씨는 서랍 손잡이를 쥔 채 한참 있다가, 다음에 오라며 서랍 대신 진열장에서 찌 하나를 꺼내 주었다.', "I asked if he would show me the notebook. Pilgu stood with his hand on the drawer a long time, then said another time — and gave me a float from the case instead."] }),
          opt('also_right', '그 말씀도 맞습니다.', "You're right about that too.", {
            stance: 'giver', aff: { [A]: 0.03 },
            end: endTalk({ complete: 'pay', lineKo: '그래. 오늘은 그만하자. 수고비다.', lineEn: "Right. Let's leave it there for today. Here's your fee." }),
            note: ['그 말도 맞다고 했다. 문필구 씨의 어깨가 조금 내려갔다. 오늘은 그만하자며 수고비를 건넸다.', "I said he was right about that too. Pilgu's shoulders dropped a little; let's leave it for today, he said, and handed me my fee."] }),
        ],
        note: ['차영배 씨가 그 몸통을 자기가 깎았다더라고 전했다. 문필구 씨는 얼굴이 굳어 서랍을 열었다 닫더니, 깎은 손은 그놈 손이 맞지만 찌로 만든 건 자기 수첩이라고 했다.',
          "I passed on that Yeongbae said he carved the body himself. Pilgu's face hardened; he opened a drawer and shut it again. The hands that carved it were the man's, he admitted — but his notebook made it a float."],
      }),
      bought: scene([
        line(A, '(봉투를 흘끗 본다.)', '(He glances at the bag.)'),
        line(A, '그놈 찌를 샀어? 내가 보낸 사람이?', 'You bought his float? Someone I sent?'),
        line(P, '그게…', 'Well...'),
        act(A, 'sigh'),
        line(A, '너도 결국 싼 게 좋은 거지.', 'In the end you just like cheap things too.'),
      ], {
        choices: [
          opt('to_test', '물에 세워 보려고 산 겁니다.', 'I bought it to stand it in the water.', {
            stance: 'mid',
            end: endTalk({ complete: 'pay', lineKo: '…그래, 세워 봐라. 누워 있을 거다. 옜다, 수고비.', lineEn: "...Fine, stand it. It'll be lying down. Here, your fee." }),
            note: ['물에 세워 보려고 산 거라고 했다. 문필구 씨는 누워 있을 거라며 마지못해 수고비를 건넸다.', "I said I bought it to stand it in the water. It would be lying down, Pilgu said, and reluctantly handed over my fee."] }),
          opt('cheap_fine', '싼 찌도 잃어버리기엔 좋더군요.', 'A cheap float is easier to lose, at least.', {
            stance: 'other', aff: { [A]: -0.04 },
            end: endTalk({ complete: 'nopay', lineKo: '잃어버려도 되는 찌로 무슨 고기를 낚겠냐. 가라.', lineEn: "What fish will you catch with a float you don't mind losing? Go." }),
            note: ['싼 찌도 잃어버리기엔 좋더라고 했다. 문필구 씨는 봉투를 서랍에 도로 넣으며, 잃어버려도 되는 찌로 무슨 고기를 낚겠느냐고 했다.', "I said a cheap float was at least easier to lose. Pilgu put the envelope back in his drawer — what fish would I catch with a float I didn't mind losing?"] }),
        ],
        note: ['그냥 찌만 하나 사 왔다고 했다. 문필구 씨는 봉투를 흘끗 보더니 혀를 찼다. 나도 결국 싼 게 좋은 거냐고 했다.',
          "I said I'd just bought a float and come back. Pilgu glanced at the bag and clicked his tongue — in the end I liked cheap things too, he said."],
      }),
    },
  },
];
