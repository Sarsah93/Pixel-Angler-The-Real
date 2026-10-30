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
];
