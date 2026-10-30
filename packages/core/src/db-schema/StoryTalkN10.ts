/**
 * @file StoryTalkN10.ts
 * @description 290차 — 이야기 「남궁현 — 물류창고 야간 관리인, 전직 전설」(N10-1~4) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 끝은 옛 받는 답(`end.offer`) · 보상 답(`end.complete`)에 묶는다.
 *   편 차례는 N10-1(3장) → N10-2(5장 · 제주) → N10-4(6장 · 포항) → N10-3(7장 · 속초) — 뒤 편 일을 앞당기지 않는다.
 *
 * 인물: 남궁현(61 · 낚시용품 물류창고 야간 관리인 · 말이 아주 짧은 반말 · 명사로 끊는다 · 「질문은 안 받아」라면서 하나씩은 답한다 ·
 *   주인공을 「너」). 주인공은 「남궁현 씨」로 부른다.
 * 표시(옛 답에서 그대로): choice.n10_1_asked_stock · choice.n10_pretend · choice.n10_2_asked_dispute · choice.n10_2_knew_him · choice.n10_story ·
 *   choice.n10_3_asked_measure · choice.n10_badge · choice.n10_4_asked_next · choice.n10_4_dawn_rod · choice.n10_sound.
 * N10-2는 끝까지 듣고 아는 사람에게 불리한 말은 못 하겠다고 하면 거절(실패)로 닫힌다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const N = 'namgung_hyeon';
const P = 'player';

export const TALKS_N10: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N10-1 「야간 근무」 — 받는 자리(남궁현)
  // ═══════════════════════════════════════════
  {
    id: 'n10_1_offer', questId: 'N10-1', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '야간 재고 정리. 시급이야.', "Night stocktaking. Paid by the hour.", { act: 'look_up' }),
        line(P, '밤새 하는 일인가요?', "Is it an all-night job?"),
        line(N, '밤새. 새벽에 끝나.', "All night. Done at dawn."),
        line(P, '어디서요?', "Where?"),
        line(N, '여기. 낚시용품 물류창고. 셔터 반쯤 올라간 데.', "Here. The tackle warehouse. The one with the shutter half up."),
        line(P, '저 말고도 일하는 분이 있어요?', "Is anyone else working besides me?"),
        line(N, '나. 질문은 안 받아.', "Me. And no questions."),
        line(P, '(방금 대답은 해 주셨는데…)', "(He did just answer one, though...)"),
        line(N, '끝나는 새벽엔 부두가 비어. 낚시꾼이면 한 마리 하고 가.', "When it ends at dawn, the pier's empty. If you fish, catch one before you go."),
      ], {
        choices: [
          opt('night_ok', '밤새는 건 자신 있어요. 어디부터 옮겨요?', "I can handle all-nighters. Where do I start?", {
            say: ['밤새는 건 자신 있습니다. 어디부터 옮기면 됩니까?', "I'm good at staying up all night. Where should I start moving things?"],
            next: 'night_ok' }),
          opt('stock', '재고 정리면 뭘 세는 거예요?', "What exactly do I count?", {
            say: ['재고 정리면 뭘 세는 거예요? 낚시 물건은 종류가 많을 텐데요.', "Stocktaking — what am I counting? Fishing gear comes in so many kinds."],
            next: 'stock' }),
          opt('joke', '질문 안 받는다는 것도, 물어보면 안 돼요?', "Can I ask about the no-questions rule?", {
            say: ['질문은 안 받는다는 것도, 질문하면 안 됩니까?', "The no-questions rule — am I not allowed to ask about that either?"],
            next: 'joke' }),
        ],
        note: ['포항의 낚시용품 물류창고 야간 관리인 남궁현 씨가 밤새 재고 정리 일을 주겠다고 했다. 시급이고 새벽에 끝난다고, 질문은 안 받는다고 했다. 끝나는 새벽엔 부두가 비니 한 마리 하고 가라고 했다.',
          "Namgung Hyeon, night keeper at a tackle warehouse in Pohang, offered me an all-night stocktaking job — hourly, finishing at dawn, no questions. The pier would be empty at dawn, he said, so I could catch one before leaving."],
      }),
      night_ok: scene([
        line(N, '…자신은 새벽에 보자.', "...We'll see about that at dawn."),
        line(P, '(셔터를 반쯤 올리신다. 안쪽에 불이 하나만 켜져 있다.)', "(He raises the shutter halfway. Only one light is on inside.)"),
        line(N, '입구 쪽부터 비워. 릴은 릴 칸, 줄은 굵기대로.', "Clear the entrance side first. Reels go with reels, line by thickness."),
        line(N, '다 옮기면 가. 그 전엔 못 가.', "When it's all moved, you go. Not before."),
      ], {
        end: endTalk({ accept: true, offer: 'night_ok' }),
        note: ['밤새는 건 자신 있다고 했더니, 남궁현 씨는 자신은 새벽에 보자며 셔터를 반쯤 올렸다. 안쪽엔 불이 하나뿐이었다. 다 옮기기 전엔 못 간다고 했다.',
          "When I said I could handle an all-nighter, Hyeon said we'd see at dawn and raised the shutter halfway. Only one light was on inside. I couldn't leave until it was all moved."],
      }),
      stock: scene([
        line(N, '바늘, 봉돌, 줄, 찌, 릴.', "Hooks, sinkers, line, floats, reels."),
        line(P, '바늘만 해도 종류가 많을 텐데요.', "Hooks alone must come in a lot of kinds."),
        line(N, '호수별로 이백 가지가 넘어.', "Over two hundred, by size."),
        line(P, '(선반 한 칸을 손가락으로 훑으신다. 먼지 하나 묻어나지 않는다.)', "(He runs a finger along a shelf. Not a speck of dust comes off.)"),
        line(N, '장부랑 선반이 맞으면 끝이야. 안 맞으면 맞을 때까지 센다. 밤새라는 게 그 뜻이야.', "When the ledger and the shelves match, you're done. If they don't, you count till they do. That's what all night means."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_stock' }),
        note: ['뭘 세는 거냐고 물었다. 바늘만 호수별로 이백 가지가 넘는다고, 장부와 선반이 맞을 때까지 세는 게 밤새라는 뜻이라고 했다. 선반에는 먼지 하나 없었다.',
          "I asked what I'd be counting. Over two hundred kinds of hook by size alone — you count until ledger and shelf match; that's what all night means. There wasn't a speck of dust on the shelves."],
      }),
      joke: scene([
        line(N, '…방금 했잖아. 하나는 봐준다.', "...You just did. I'll let one slide."),
        line(P, '(입꼬리가 아주 조금 움직였다가 제자리로 돌아갔다.)', "(The corner of his mouth moved ever so slightly, then went back.)"),
        line(N, '두 번째부터는 시급에서 깐다. 농담 아니야.', "From the second one, it comes out of your wage. Not a joke."),
      ], {
        choices: [
          opt('follow', '장갑 끼고 따라갈게요', "I'll put on gloves and follow", {
            say: ['네. 장갑 끼고 따라가겠습니다.', "Right. I'll put on gloves and follow you."],
            end: endTalk({ accept: true, offer: 'joke_question' }),
            note: ['질문 안 받는다는 것도 질문하면 안 되느냐고 물었다. 남궁현 씨는 하나는 봐준다며, 두 번째부터는 시급에서 깐다고 했다. 입꼬리가 아주 조금 움직였다.', "I asked whether I could ask about the no-questions rule. Hyeon let that one slide — from the second, it would come out of my wage. The corner of his mouth moved ever so slightly."] }),
          opt('first', '사실 밤새는 일은 처음이에요. 졸면요?', "Honestly, it's my first all-nighter. If I doze off?", {
            say: ['그런데… 사실 밤새는 일은 처음입니다. 졸면 어떻게 합니까?', "But... honestly, it's my first all-night job. What if I doze off?"],
            next: 'first' }),
        ],
        note: ['남궁현 씨는 질문 하나는 봐준다고 했다. 두 번째부터는 시급에서 깐다고, 농담이 아니라고.',
          "Hyeon said he'd let one question slide. From the second on, it came out of my pay — and he wasn't joking."],
      }),
      first: scene([
        line(N, '졸면 그 시간은 시급에서 뺀다. 그게 다야.', "If you doze, that time comes out of your wage. That's all."),
        line(N, '잠은 한밤중에 한 번, 새벽 들기 전에 또 한 번 온다.', "Sleep comes once around midnight, and again just before dawn."),
        line(P, '그럼 어떻게 쫓아요?', "Then how do I chase it off?"),
        line(N, '처음 건 찬물로, 두 번째 건 무거운 상자로.', "The first with cold water. The second with a heavy box."),
        line(N, '…이건 질문으로 안 친다.', "...I won't count that one as a question."),
      ], {
        end: endTalk({ accept: true, offer: 'first_night' }),
        note: ['밤새는 일은 처음이라 졸면 어떡하느냐고 했다. 남궁현 씨는 잠은 한밤중과 새벽 전에 두 번 온다며, 처음은 찬물로, 두 번째는 무거운 상자로 쫓으라고 했다. 그건 질문으로 안 치겠다고.',
          "I said it was my first all-nighter and asked what to do if I dozed. Hyeon said sleep comes twice — midnight and before dawn: chase the first with cold water, the second with a heavy box. He wouldn't count that as a question."],
      }),
    },
  },
  // N10-1 — 끝내는 자리(남궁현)
  {
    id: 'n10_1_done', questId: 'N10-1', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '수고. 일당.', "Good work. Your pay."),
        line(P, '장부랑 선반, 맞춰 놨어요.', "The ledger and the shelves match now."),
        line(N, '봤어.', "I saw.", { act: 'nod' }),
        act(N, 'silence'),
        line(N, '…새벽에 부두에 있었나.', "...Were you at the pier at dawn?"),
        line(P, '네. 한 마리 하고 왔어요.', "Yes. I caught one before coming back."),
        line(N, '…못 본 걸로 해.', "...Forget what you saw.", { act: 'look_away' }),
        line(P, '(소리도 없이, 라인이 어디로 갔는지 안 보일 만큼 멀리 날아가던 그 캐스팅 말이다.)', "(He means that cast — no sound at all, the line gone farther than I could see.)"),
      ], {
        choices: [
          opt('pretend', '아무것도 못 봤어요', "I didn't see a thing", {
            say: ['아무것도 못 봤습니다.', "I didn't see anything."],
            next: 'pretend' }),
          opt('ask', '그 캐스팅, 어떻게 하신 거예요?', "That cast — how did you do it?", {
            say: ['그 캐스팅, 어떻게 하신 겁니까?', "That cast of yours — how did you do it?"],
            next: 'ask' }),
          opt('pay', '일당만 받을게요', "Just my day's pay, thanks", {
            say: ['일당만 받겠습니다.', "I'll just take my pay."],
            end: endTalk({ complete: 'pay',
              lineKo: '그래. 그게 일이야.\n\n일한 만큼 받는 게 제일 깨끗해. 밤일이 또 생각나면 와. 셔터는 늘 반쯤 올라가 있어.',
              lineEn: "Right. That's the job.\n\nGetting paid for what you worked is the cleanest thing there is. If night work comes to mind again, come by. The shutter's always half up." }),
            note: ['일당만 받겠다고 했다. 남궁현 씨는 일한 만큼 받는 게 제일 깨끗하다며 돈을 세어 주었다. 돈을 세는 손이 창고 관리인의 손 같지 않았다.', "I said I'd just take my pay. Hyeon counted it out, saying that being paid for what you worked is cleanest. The hands counting it didn't look like a warehouse keeper's."] }),
          opt('order', '상자 쌓는 순서에도 법이 있더군요', "There's a rule even to how boxes are stacked", {
            say: ['상자 쌓는 순서에도 법이 있더군요. 그걸 배우고 싶습니다.', "There's a method even to stacking the boxes. I'd like to learn it."],
            end: endTalk({ complete: 'stock_order',
              lineKo: '…눈은 있네. 많이 나가는 건 문 쪽, 무거운 건 아래, 먼저 들어온 건 앞.\n\n창고는 외우는 데가 아니야. 순서를 아는 데지. 다음 근무엔 장부부터 봐.',
              lineEn: "...You've got eyes. What sells most goes by the door, heavy goes low, what came in first goes in front.\n\nA warehouse isn't somewhere you memorise. It's somewhere you know the order. Next shift, look at the ledger first." }),
            note: ['상자 쌓는 순서에도 법이 있더라고 했다. 남궁현 씨는 장부를 펼쳐 출고 순서를 짚어 주었다. 많이 나가는 건 문 쪽, 무거운 건 아래, 먼저 들어온 건 앞.', "I said there seemed to be a method to stacking the boxes. Hyeon opened the ledger and traced the order out: what sells most by the door, heavy below, first in at the front."] }),
        ],
        note: ['밤새 창고 재고를 맞추고 새벽 부두에서 한 마리를 했다. 거기서 남궁현 씨가 소리 없이 던지는 걸 보았다. 남궁현 씨는 일당을 내밀며 못 본 걸로 하라고 했다.',
          "I matched the warehouse stock overnight and caught one at the pier at dawn. There I saw Hyeon cast without a sound. Handing me my pay, he told me to forget what I'd seen."],
      }),
      pretend: scene([
        line(N, '…좋아.', "...Good."),
        act(N, 'give', { to: P }),
        line(P, '(일당에 무언가가 더 얹혀 있다. 말씀은 없으시다.)', "(Something extra has been added to the pay. He says nothing about it.)", { act: 'receive' }),
        line(N, '본 걸 안 본 걸로 하는 것도 일이야. 그걸 할 줄 아는 사람이 드물어.', "Treating what you saw as unseen is work too. Few people can do it."),
        line(N, '다음 달에도 야간 사람이 모자라. 생각 있으면 와.', "We'll be short on night staff next month as well. Come if you're interested."),
      ], {
        end: endTalk({ complete: 'pretend' }),
        note: ['아무것도 못 봤다고 했다. 남궁현 씨는 말없이 일당에 무언가를 더 얹었다. 본 걸 안 본 걸로 하는 것도 일이라고, 그걸 할 줄 아는 사람은 드물다고 했다.',
          "I said I hadn't seen anything. Without a word, Hyeon added something to my pay. Treating what you saw as unseen is work too, he said — few people can do it."],
      }),
      ask: scene([
        line(N, '…봤구나.', "...So you saw."),
        line(N, '안 가르쳐. 아직은.', "I won't teach you. Not yet."),
        line(P, '(그래도 내 손목을 잡아, 각도 하나를 고쳐 주셨다.)', "(Even so, he took my wrist and corrected one angle.)"),
        line(N, '보는 거랑 배우는 건 달라. 아직이라는 건 언젠가라는 뜻이야. 그때까지는 상자나 날라.', "Seeing and learning are different. Not yet means someday. Till then, carry boxes."),
      ], {
        end: endTalk({ complete: 'ask' }),
        note: ['그 캐스팅을 어떻게 했느냐고 물었다. 남궁현 씨는 아직은 안 가르친다면서도 내 손목 각도 하나를 고쳐 주었다. 아직이라는 건 언젠가라는 뜻이라고 했다.',
          "I asked how he'd made that cast. Hyeon said he wouldn't teach me yet — but he corrected the angle of my wrist. Not yet means someday, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N10-2 「계측 이의신청」 — 받는 자리(남궁현)
  // ═══════════════════════════════════════════
  {
    id: 'n10_2_offer', questId: 'N10-2', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '왔나. 계측 분쟁이야.', "You're here. There's a measurement dispute."),
        line(P, '분쟁이요? 대회에서요?', "A dispute? At the tournament?"),
        line(N, '그래. 증인이 필요해.', "Right. We need a witness."),
        line(P, '제가요?', "Me?"),
        line(N, '그 자리에 너 있었잖아.', "You were there."),
        line(N, '규정대로만 말해. …아는 사람이라도.', "Say only what the rules say. ...Even if you know the person.", { act: 'look_away' }),
        line(P, '(아는 사람…? 그 선수 말인가.)', "(Someone I know...? That competitor?)"),
        line(N, '서기 전에 너도 규정대로 재고 놓아 봐. 두 번. 자가 손에 붙어야 말이 안 흔들려.', "Before you stand up there, measure and release by the rules yourself. Twice. The ruler has to feel natural in your hand, or your words will wobble."),
      ], {
        choices: [
          opt('dispute', '어느 쪽이 뭘 문제 삼은 거예요?', "Who's disputing what?", {
            say: ['이의신청이라면, 어느 쪽이 뭘 문제 삼은 겁니까?', "If it's an appeal — who's objecting to what?"],
            next: 'dispute' }),
          opt('know', '그 선수, 제가 아는 사람이에요', "I know that competitor", {
            say: ['그 선수, 제가 아는 사람입니다. 그래도 제가 서야 합니까?', "That competitor is someone I know. Do I still have to be the one?"],
            next: 'know' }),
          opt('by_rules', '본 대로, 규정대로만 말할게요', "I'll say what I saw, by the rules", {
            say: ['본 대로, 규정대로만 말하겠습니다.', "I'll say only what I saw, by the rules."],
            next: 'by_rules' }),
        ],
        note: ['남궁현 씨가 대회 계측 분쟁에 증인이 필요하다며 나를 불렀다. 아는 사람이라도 규정대로만 말하라고 했다. 증언대에 서기 전에 나도 규정대로 두 번 재고 놓아 보라고 했다.',
          "Hyeon called me in as a witness in a tournament measurement dispute. Even if I knew the person, I was to speak only by the rules. Before taking the stand, I should measure and release twice by the rules myself."],
      }),
      dispute: scene([
        line(N, '선수는 자기 고기가 규정보다 크다 하고, 계측대는 작다고 했어.', "The competitor says the fish is over the limit; the measuring table said it was under."),
        line(P, '얼마나 차이 나는데요?', "By how much?"),
        line(N, '몇 밀리.', "A few millimetres."),
        line(P, '(손가락 두 개를 아주 조금 벌려 보이신다.)', "(He holds two fingers barely apart.)"),
        line(N, '그 몇 밀리로 순위가 바뀌어. 그 자리에 있던 사람 중에 규정을 읽을 줄 아는 게 너야.', "Those few millimetres change the rankings. Of everyone who was there, you're the one who can read the rules."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_dispute' }),
        note: ['무엇이 문제인지 물었다. 선수는 자기 고기가 규정보다 크다 하고 계측대는 작다고 했는데, 그 몇 밀리로 순위가 바뀐다고 했다. 그 자리에서 규정을 읽을 줄 아는 사람이 나라고 했다.',
          "I asked what the dispute was. The competitor claimed the fish was over the limit; the table said under — a few millimetres that change the rankings. I was the one there who could read the rules."],
      }),
      know: scene([
        line(N, '그래서 너야.', "That's why it's you."),
        line(N, '아는 사람 앞에서도 규정대로 말하는 증언이라야 무게가 있어.', "Testimony carries weight when it follows the rules even in front of someone you know."),
        act(N, 'silence'),
        line(P, '…', '...'),
        line(N, '어렵지. 어려운 거 알아. 그래도 편을 들면 그 사람도 너도 같이 잃어.', "It's hard. I know it's hard. But take sides and you lose both — them and yourself."),
        line(N, '그건 내가 알아.', "I know that much.", { act: 'look_away' }),
      ], {
        choices: [
          opt('stand', '…알겠어요. 서겠습니다', "...All right. I'll stand", {
            say: ['…알겠습니다. 제가 서겠습니다.', "...All right. I'll be the one."],
            end: endTalk({ accept: true, offer: 'know_him' }),
            note: ['그 선수가 아는 사람이라고 했다. 남궁현 씨는 그래서 나여야 한다고, 편을 들면 그 사람도 나도 같이 잃는다고 했다. 그건 자기가 안다고 했다. 증언대에 서기로 했다.', "I said I knew the competitor. Hyeon said that was exactly why it had to be me — take sides and you lose both of you. He knew that, he said. I agreed to take the stand."] }),
          opt('cannot', '아는 사람한테 불리한 말은 못 하겠어요', "I can't say something against someone I know", {
            say: ['죄송합니다. 아는 사람한테 불리한 말은… 못 하겠습니다.', "I'm sorry. I can't say something that goes against someone I know."],
            next: 'refuse' }),
        ],
        note: ['남궁현 씨는 아는 사람 앞에서도 규정대로 말해야 증언에 무게가 있다고 했다. 어렵다는 걸 안다고, 계측대 쪽은 보지 않은 채 말했다.',
          "Hyeon said testimony only has weight if it follows the rules even before someone you know. He knew it was hard, he said, without once looking toward the measuring table."],
      }),
      refuse: scene([
        line(N, '…그래.', "...I see."),
        act(N, 'silence'),
        line(N, '억지로 세운 증인은 증인이 아니야. 다른 사람 찾지.', "A witness forced onto the stand is no witness. I'll find someone else."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ fail: true }),
        note: ['끝내 아는 사람에게 불리한 말은 못 하겠다고 했다. 남궁현 씨는 한참 말이 없다가, 억지로 세운 증인은 증인이 아니라며 다른 사람을 찾겠다고 했다. 그 증언대에는 서지 않았다.',
          "In the end I said I couldn't speak against someone I knew. Hyeon was silent a long while, then said a forced witness is no witness — he'd find someone else. I never took that stand."],
      }),
      by_rules: scene([
        line(N, '그거면 돼. 증인은 그거 하나만 하면 돼.', "That's enough. That's the only thing a witness has to do."),
        line(P, '(계측 기록지 사본을 보여 주신다. 숫자 옆에 서명이 있다.)', "(He shows me a copy of the measurement sheet. His signature sits beside the figures.)", { act: 'peer' }),
        line(N, '누가 뭘 묻든, 네가 본 숫자만 대답해.', "Whoever asks whatever, answer only with the number you saw."),
      ], {
        choices: [
          opt('ok', '알겠습니다', "Understood", {
            say: ['알겠습니다. 본 숫자만 말하겠습니다.', "Understood. Only the number I saw."],
            end: endTalk({ accept: true, offer: 'by_rules' }),
            note: ['본 대로 규정대로만 말하겠다고 했다. 남궁현 씨는 서명이 있는 계측 기록지를 보여 주며, 누가 뭘 묻든 내가 본 숫자만 대답하라고 했다.', "I said I'd speak only to what I saw, by the rules. Hyeon showed me the signed measurement sheet and told me to answer only with the number I saw, whoever asked."] }),
          opt('wrong', '그런데 규정이 틀렸으면요?', "But what if the rule is wrong?", {
            say: ['그런데 규정이 틀렸으면요? 그때도 규정대로만 말합니까?', "But what if the rule itself is wrong? Do I still go only by the rule?"],
            next: 'wrong' }),
        ],
        note: ['남궁현 씨는 증인은 본 대로 말하는 것 하나만 하면 된다고 했다.', "Hyeon said a witness need only do one thing: say what they saw."],
      }),
      wrong: scene([
        line(N, '규정이 틀렸으면 규정을 고쳐. 대회 끝나고, 서류로.', "If a rule is wrong, you fix the rule. After the tournament, on paper."),
        line(P, '증언대에서는요?', "And on the stand?"),
        line(N, '증언대에서 고치는 게 아니야. 오늘은 오늘 규정으로 잰다. 그게 다른 선수들한테도 공평한 거야.', "You don't fix it on the stand. Today we measure by today's rules. That's what's fair to the other competitors too."),
        line(N, '할 말 있으면 끝나고 해. 들어는 줄게.', "If you have something to say, say it after. I'll at least listen."),
      ], {
        end: endTalk({ accept: true, offer: 'rule_wrong' }),
        note: ['규정이 틀렸으면 어떡하느냐고 물었다. 남궁현 씨는 규정은 대회가 끝난 뒤 서류로 고치는 것이지 증언대에서 고치는 게 아니라고 했다. 할 말이 있으면 끝나고 하라고, 들어는 주겠다고 했다.',
          "I asked what if the rule was wrong. Hyeon said you fix rules on paper after the tournament, not on the stand. If I had something to say, I could say it afterwards — he'd listen."],
      }),
    },
  },
  // N10-2 — 끝내는 자리(남궁현)
  {
    id: 'n10_2_done', questId: 'N10-2', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '규정대로 했군.', "You went by the rules."),
        line(P, '본 대로만 말했어요. 그 선수가… 저를 계속 쳐다보더라고요.', "I only said what I saw. That competitor... kept staring at me."),
        line(N, '보라고 해. 그게 심판이 원하는 전부야.', "Let them stare. That's all a judge wants.", { act: 'nod' }),
        act(N, 'silence'),
        line(N, '20년 전에 나는 그걸 못 했어.', "Twenty years ago, I couldn't do that.", { act: 'look_away' }),
        line(P, '(대회를 떠난 이유가… 거기 있었던 걸까.)', "(Was that... why he left the tournaments?)"),
      ], {
        choices: [
          opt('ask_20', '20년 전 이야기, 들려주세요', "Tell me about twenty years ago", {
            say: ['20년 전 이야기, 들려주십시오.', "Please — tell me about twenty years ago."],
            next: 'past' }),
          opt('lesson', '규정 읽는 법, 심판 눈으로 배우고 싶어요', "Teach me to read rules like a judge", {
            say: ['규정을 읽는 법, 심판 눈으로 배우고 싶습니다.', "I'd like to learn to read the rules with a judge's eye."],
            end: endTalk({ complete: 'lesson',
              lineKo: '규정은 사람을 위해 있어. 그걸 잊으면 규정이 사람을 잡아.\n\n자는 주둥이 끝부터 꼬리 끝까지, 꼬리는 펴서 대. 고기가 휘었으면 펴고 다시 재. 서두르지 마. 몇 밀리가 사람을 가른다.',
              lineEn: "Rules exist for people. Forget that, and the rules trap people.\n\nThe ruler goes from the tip of the snout to the tip of the tail, tail spread flat. If the fish is curved, straighten it and measure again. Don't rush. A few millimetres divide people." }),
            note: ['규정 읽는 법을 배우고 싶다고 했다. 남궁현 씨는 규정은 사람을 위해 있다고, 그걸 잊으면 규정이 사람을 잡는다고 했다. 자 대는 법을 하나하나 짚어 주었다.', "I asked to learn to read rules with a judge's eye. Hyeon said rules are there for people — forget that and they trap people. He went through how to lay the ruler, step by step."] }),
          opt('pay', '증인 수당은 있나요?', "Is there a witness fee?", {
            say: ['증인 수당은 있습니까?', "Is there a fee for the witness?"],
            next: 'pay' }),
          opt('no_fee', '수당은 사양할게요. 아는 사람한테 불리한 말을 했으니까요', "I'll pass on the fee. I spoke against someone I know", {
            say: ['수당은 사양하겠습니다. 아는 사람한테 불리한 말을 했으니까요.', "I'll pass on the fee. I said something against someone I know."],
            end: endTalk({ complete: 'no_fee',
              lineKo: '…규정대로 말한 건 불리한 말이 아니야. 있었던 일이지.\n\n안 받겠다면 안 받은 것도 적어 둔다. 그것도 규정이야.',
              lineEn: "...Speaking by the rules isn't speaking against anyone. It's what happened.\n\nIf you won't take it, I'll write down that you didn't. That's a rule too." }),
            note: ['아는 사람에게 불리한 말을 했으니 수당은 사양하겠다고 했다. 남궁현 씨는 규정대로 말한 건 불리한 말이 아니라 있었던 일이라며, 증인 명부 수당 칸에 사양이라고 적었다.', "I turned down the fee, since I'd spoken against someone I knew. Hyeon said speaking by the rules isn't speaking against anyone — it's what happened — and wrote declined in the fee column of the witness register."] }),
        ],
        note: ['계측 분쟁에서 규정대로 증언했다. 편들지 않았다. 남궁현 씨는 그게 심판이 원하는 전부라고, 20년 전에 자기는 그걸 못 했다고 했다.',
          "I testified by the rules in the measurement dispute. I took no side. Hyeon said that's all a judge wants — and that twenty years ago, he couldn't do it."],
      }),
      past: scene([
        line(N, '…편을 들었어. 친구를.', "...I took a side. A friend's."),
        line(N, '그래서 떠났지.', "So I left."),
        line(P, '(오래된 심판 배지를 꺼내 보여 주셨다.)', "(He took out an old judge's badge and showed it to me.)", { act: 'peer' }),
        line(N, '그 친구 얘기는 거기까지야. 남은 건 이 배지하고, 규정대로 못 한 심판이라는 이름이지.', "That's as far as the story of that friend goes. What's left is this badge, and the name of a judge who didn't go by the rules."),
        line(N, '오늘 네가 한 걸, 그때 내가 했으면 좋았을 거다.', "I wish I'd done then what you did today."),
      ], {
        end: endTalk({ complete: 'ask_20' }),
        note: ['20년 전 이야기를 청했다. 남궁현 씨는 친구 편을 들었고 그래서 떠났다고 했다. 오래된 심판 배지를 보여 주며, 오늘 내가 한 걸 그때 자기가 했으면 좋았을 거라고 했다.',
          "I asked about twenty years ago. Hyeon said he'd taken a friend's side, and that was why he left. Showing me an old judge's badge, he said he wished he'd done back then what I did today."],
      }),
      pay: scene([
        line(N, '있어. 대회 규정에.', "There is. It's in the tournament rules."),
        act(N, 'give', { to: P }),
        line(N, '증인 수당도 규정, 증인 서명도 규정이야. 받았으면 여기 이름 써.', "The witness fee is a rule; the witness signature is a rule. If you took it, sign here."),
        line(P, '네.', "Right.", { act: 'receive' }),
        line(N, '누가 뭘 받았는지 남아 있어야, 나중에 아무도 말을 못 해.', "When there's a record of who got what, nobody can say anything later."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['증인 수당을 물었다. 남궁현 씨는 규정대로 수당을 주고, 받았으면 이름을 쓰라고 했다. 누가 뭘 받았는지 남아 있어야 나중에 아무도 말을 못 한다고.',
          "I asked about the witness fee. Hyeon paid it by the rules and had me sign for it. When there's a record of who got what, nobody can say anything later."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N10-3 「심판석」 — 받는 자리(남궁현) · 이야기 마지막 편(7장 · 속초)
  // ═══════════════════════════════════════════
  {
    id: 'n10_3_offer', questId: 'N10-3', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '들었다. 대회 연다며.', "I heard. You're holding a tournament.", { act: 'look_up' }),
        line(P, '네. 재개관 기념으로요. 그래서 찾아왔어요.', "Yes. For the reopening. That's why I came to see you."),
        line(N, '심판. 맡지.', "The judging. I'll take it."),
        line(P, '…아직 부탁도 안 드렸는데요.', "...I haven't even asked yet."),
        line(N, '할 거였잖아. 20년 만이야.', "You were about to. Twenty years.", { act: 'look_sea' }),
        line(P, '20년 만에 대회장에 서시는 거네요.', "So it's your first tournament in twenty years."),
        line(N, '규정은 네가 정해. 네 대회니까. 나는 재기만 한다.', "You set the rules. It's your tournament. I just measure."),
        line(N, '시범도 네가 보여. 세 마리. 참가자들은 그걸 보고 던진다.', "And you give the demonstration. Three fish. The entrants cast after watching you."),
      ], {
        choices: [
          opt('write', '고맙습니다. 규정은 오늘 밤 안에 써 올게요', "Thank you. I'll write the rules tonight", {
            say: ['맡아 주셔서 고맙습니다. 규정은 오늘 밤 안에 써 오겠습니다.', "Thank you for taking it on. I'll have the rules written by tonight."],
            next: 'write' }),
          opt('measure', '재기만 하신다는 건, 판정은 안 하신다는 거예요?', "Only measure — you won't make rulings?", {
            say: ['재기만 하신다는 건, 판정은 안 하신다는 뜻입니까?', "When you say you'll only measure — do you mean you won't make the rulings?"],
            next: 'measure' }),
          opt('not_ready', '규정을 제가 정해도 될까요?', "Should I really be setting the rules?", {
            say: ['규정을 제가 정해도 되겠습니까? 아직 그럴 자격이 있는지…', "Should I really be the one setting the rules? I'm not sure I've earned that..."],
            next: 'not_ready' }),
        ],
        note: ['재개관 기념 대회를 연다고 알리자, 남궁현 씨는 내가 부탁하기도 전에 심판을 맡겠다고 했다. 20년 만이라고. 규정은 내가 정하고 자기는 재기만 한다며, 시범 세 마리는 내가 보이라고 했다.',
          "When I told him I was holding a tournament for the reopening, Hyeon said he'd judge before I could even ask. Twenty years, he said. I'd set the rules and he'd only measure — and I was to give the demonstration with three fish."],
      }),
      write: scene([
        line(N, '밤새 쓰지 마. 밤새 쓴 규정은 길어. 긴 규정은 사람을 잡고.', "Don't write all night. Rules written overnight run long. And long rules trap people."),
        line(P, '(빈 공책 한 권을 내미신다. 표지에 아무것도 적혀 있지 않다.)', "(He holds out a blank notebook. Nothing is written on the cover.)"),
        line(N, '한 장이면 충분해. 뭘 재고, 어떻게 재는지부터 써.', "One page is plenty. Start with what you measure and how."),
      ], {
        end: endTalk({ accept: true, offer: 'write_rules' }),
        note: ['규정을 오늘 밤 안에 써 오겠다고 했다. 남궁현 씨는 밤새 쓴 규정은 길고 긴 규정은 사람을 잡는다며 빈 공책을 내밀었다. 한 장이면 충분하다고 했다.',
          "I said I'd write the rules tonight. Hyeon said rules written overnight run long and long rules trap people, and handed me a blank notebook. One page would do."],
      }),
      measure: scene([
        line(N, '판정은 자가 해.', "The ruler makes the rulings."),
        line(N, '나는 자를 대고, 숫자를 읽고, 적는다.', "I lay the ruler down, read the number and write it."),
        line(P, '그 숫자를 어떻게 쓸지는요?', "And what's done with that number?"),
        line(N, '네 규정이 정하지. 심판이 규정까지 쥐면 대회가 심판 거가 돼.', "Your rules decide. If the judge holds the rules too, the tournament becomes the judge's."),
        line(N, '이건 네 대회야.', "This is your tournament."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_measure' }),
        note: ['판정은 안 하느냐고 물었다. 남궁현 씨는 판정은 자가 하고 자기는 자를 대고 숫자를 적을 뿐이라고 했다. 심판이 규정까지 쥐면 대회가 심판 것이 된다고.',
          "I asked if he wouldn't make rulings. Hyeon said the ruler rules; he only lays it down and writes the number. If the judge also holds the rules, the tournament becomes the judge's."],
      }),
      not_ready: scene([
        line(N, '자격은 대회를 연 사람한테 있어. 열었잖아.', "The right belongs to whoever opens the tournament. You opened it."),
        line(P, '(한쪽 눈썹이 올라갔다.)', "(One of his eyebrows went up.)"),
        line(N, '모르는 건 물어. 대답은 해 준다. 대신 정하는 건 네가 해.', "Ask what you don't know. I'll answer. But you do the deciding."),
        line(N, '내가 정하면 내가 편을 드는 거야. 그건 이제 안 해.', "If I decide, I'm taking a side. I don't do that anymore."),
      ], {
        choices: [
          opt('decide', '알겠어요. 제가 정할게요', "All right. I'll decide", {
            say: ['알겠습니다. 모르는 건 여쭤보고, 정하는 건 제가 하겠습니다.', "Understood. I'll ask what I don't know, and I'll do the deciding."],
            end: endTalk({ accept: true, offer: 'not_ready' }),
            note: ['규정을 내가 정해도 되겠느냐고 했다. 남궁현 씨는 자격은 대회를 연 사람에게 있다며, 모르는 건 물으면 대답해 주겠지만 정하는 건 내가 하라고 했다. 자기가 정하면 편을 드는 거라고.', "I asked if I really had the right to set the rules. Hyeon said the right belongs to whoever opened the tournament — he'd answer my questions, but I would decide. If he decided, he'd be taking sides."] }),
          opt('strict', '심판이 깐깐하시면 참가자가 줄 텐데요', "A strict judge might scare entrants off", {
            say: ['그런데 심판이 깐깐하시면 참가자가 줄 텐데요.', "Then again, with a strict judge, fewer people might enter."],
            next: 'strict' }),
        ],
        note: ['남궁현 씨는 대회를 연 사람에게 규정을 정할 자격이 있다고 했다. 자기가 정하면 편을 드는 거라며, 그건 이제 안 한다고.',
          "Hyeon said whoever opens the tournament has the right to set its rules. If he set them, he'd be taking sides — and he doesn't do that anymore."],
      }),
      strict: scene([
        line(N, '줄면 줄어. 깐깐해서 안 오는 사람은 원래 안 올 사람이야.', "Then fewer enter. Anyone who stays away because the judge is strict was never coming."),
        line(P, '(대답이 너무 빨라서, 농담인지 아닌지 모르겠다.)', "(He answered so fast I can't tell whether he's joking.)"),
        line(N, '대신 온 사람은 끝까지 믿고 던져. 결과가 어떻게 나와도 자가 잰 거니까.', "But the ones who come cast with full trust, to the end. However it turns out, the ruler measured it."),
        line(N, '그게 깐깐한 심판이 주는 거야.', "That's what a strict judge gives them."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_strict' }),
        note: ['심판이 깐깐하면 참가자가 줄겠다고 했다. 남궁현 씨는 너무 빨리 대답해서 농담인지 모르겠지만, 온 사람은 결과를 끝까지 믿고 던진다고, 그게 깐깐한 심판이 주는 거라고 했다.',
          "I said a strict judge might cost us entrants. Hyeon answered too fast for me to tell if he was joking — but those who come can cast with full trust in the result. That's what a strict judge gives."],
      }),
    },
  },
  // N10-3 — 끝내는 자리(남궁현)
  {
    id: 'n10_3_done', questId: 'N10-3', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '…대회 끝.', "...Tournament's over."),
        line(P, '수고하셨어요. 시범 세 마리도 다 채웠어요.', "Thank you for everything. I landed all three for the demonstration."),
        line(N, '봤어. 규정대로 올리더라.', "I saw. You landed them by the rules.", { act: 'nod' }),
        line(N, '20년 만에 심판석이었다.', "Twenty years, and I sat in the judge's seat again."),
        line(P, '어떠셨어요?', "How did it feel?"),
        line(N, '편 안 들었어. 이번엔.', "I didn't take sides. This time.", { act: 'look_away' }),
        line(P, '(가슴에 단 심판 배지가 오래된 것이었다.)', "(The judge's badge on his chest was an old one.)"),
      ], {
        choices: [
          opt('badge', '배지가 오래된 것이더군요', "That badge looks old", {
            say: ['배지가 오래된 것이더군요.', "That badge looks like an old one."],
            next: 'badge' }),
          opt('lesson', '규정, 심판 눈으로 검토해 주세요', "Look over my rules with a judge's eye", {
            say: ['제가 정한 규정, 심판 눈으로 검토해 주십시오.', "Please look over the rules I set, with a judge's eye."],
            end: endTalk({ complete: 'lesson',
              lineKo: '세 줄 빼. 사람을 잡는 줄이야.\n\n어기면 실격, 어기면 실격, 어기면 실격. 그렇게 쓰면 규정이 아니라 덫이야. 하지 말라는 줄보다 어떻게 하라는 줄이 많아야 해.',
              lineEn: "Cut three lines. They're the kind that trap people.\n\nBreak it and you're out, break it and you're out, break it and you're out. Write it like that and it's not a rulebook, it's a snare. You want more lines saying how to do it than lines saying don't." }),
            note: ['내가 정한 규정을 검토해 달라고 했다. 남궁현 씨는 사람을 잡는 줄 세 줄을 빼라고 했다. 하지 말라는 줄보다 어떻게 하라는 줄이 많아야 한다고.', "I asked him to look over my rules. Hyeon told me to cut three lines that trap people — there should be more lines saying how than saying don't."] }),
          opt('pay', '심판 수당은 대회 예산에서 드릴게요', "Your fee will come from the tournament budget", {
            say: ['심판 수당은 대회 예산에서 드리겠습니다.', "Your judging fee will come out of the tournament budget."],
            end: endTalk({ complete: 'pay',
              lineKo: '규정대로.\n\n수당을 받는 건 규정이고, 기금에 내는 건 내 마음이야. 장부에는 따로 적어. 둘이 섞이면 다음 심판이 헷갈려.',
              lineEn: "By the rules.\n\nTaking the fee is the rule; putting it back into the fund is my choice. Record them separately in the books. If the two get mixed, the next judge will be confused." }),
            note: ['심판 수당을 대회 예산에서 드리겠다고 했다. 남궁현 씨는 규정대로 받고는 그 자리에서 대회 기금에 다시 냈다. 받는 건 규정이고 내는 건 자기 마음이니 장부에 따로 적으라고 했다.', "I said his fee would come from the tournament budget. Hyeon took it by the rules and put it straight back into the fund — taking it was the rule, giving it back was his choice, so record them separately."] }),
          opt('thanks', '심판석에 앉아 주셔서, 대회가 대회가 됐어요', "With you in the seat, it became a real tournament", {
            say: ['심판석에 앉아 주셔서, 이 대회가 대회가 됐습니다.', "Because you sat in the judge's seat, this tournament became a real one."],
            next: 'thanks' }),
        ],
        note: ['재개관 기념 대회가 끝났다. 시범 세 마리를 규정대로 올렸다. 남궁현 씨는 20년 만에 심판석에 앉았고, 이번에는 편을 들지 않았다고 했다.',
          "The reopening tournament was over. I'd landed the three demonstration fish by the rules. Hyeon had sat in the judge's seat for the first time in twenty years — and this time, he said, he took no side."],
      }),
      badge: scene([
        line(N, '20년 전 거야. 버리지 않았지.', "It's from twenty years ago. I never threw it away."),
        line(N, '다음 대회는 네가 심판이야.', "At the next tournament, you're the judge."),
        line(P, '제가요?', "Me?", { act: 'look_up' }),
        line(N, '핀이 헐거워. 달 때 두 번 눌러.', "The pin's loose. Press it twice when you put it on."),
        line(N, '이걸 달면 아는 사람이 줄에 서도 숫자만 보여. 그게 무거우면 떼고, 견딜 만하면 달아.', "Wear this, and even when someone you know is in line, you see only the number. If that's too heavy, take it off. If you can bear it, wear it."),
      ], {
        end: endTalk({ complete: 'badge' }),
        note: ['배지가 오래된 것이라고 했다. 남궁현 씨는 20년 전 것이라며, 다음 대회는 내가 심판이라고 했다. 이걸 달면 아는 사람이 줄에 서도 숫자만 보인다고, 무거우면 떼고 견딜 만하면 달라고 했다.',
          "I said the badge looked old. Hyeon said it was twenty years old, and that the next tournament's judge would be me. Wearing it, you see only the number even when someone you know is in line — take it off if it's too heavy, wear it if you can bear it."],
      }),
      thanks: scene([
        line(N, '…고맙다는 말은 규정에 없어.', "...There's nothing in the rules about thank-yous."),
        line(N, '그래도 받지. 이번 한 번은.', "But I'll take it. Just this once."),
        line(P, '(규정집을 덮어 돌려주셨다. 표지에 손때가 묻어 있다.)', "(He closed the rulebook and handed it back. The cover bore the marks of his hands.)", { act: 'receive' }),
        line(N, '대회는 네가 열었고, 나는 재기만 했어. 사람들이 기억할 건 네 이름이야.', "You opened the tournament; I only measured. It's your name people will remember."),
      ], {
        end: endTalk({ complete: 'thanks_seat' }),
        note: ['심판석에 앉아 주어서 대회가 대회가 됐다고 했다. 남궁현 씨는 고맙다는 말은 규정에 없지만 이번 한 번은 받겠다며, 손때 묻은 규정집을 돌려주었다. 사람들이 기억할 건 내 이름이라고 했다.',
          "I said the tournament became real because he sat in the judge's seat. Hyeon said thank-yous aren't in the rules but he'd take it this once, and handed back the rulebook, worn by his hands. People would remember my name, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N10-4 「야간 창고의 불빛」 — 받는 자리(남궁현) · 6장 · 포항
  // ═══════════════════════════════════════════
  {
    id: 'n10_4_offer', questId: 'N10-4', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '마지막 근무야.', "It's my last shift."),
        line(P, '네? 창고를요?', "What? At the warehouse?"),
        line(N, '그만둔다. 오늘 밤까지만.', "I'm quitting. Tonight's the last."),
        line(P, '…', '...'),
        line(N, '불 끄기 전에… 대를 꺼내지.', "Before I turn off the lights... I'll take out a rod.", { act: 'look_sea' }),
        line(P, '대를요? 남궁현 씨가요?', "A rod? You, Hyeon?"),
        line(N, '옆에서 던져. 한 마리.', "Cast beside me. One fish."),
        line(N, '포항 부두. 새벽 물 들어올 때.', "Pohang pier. When the dawn tide comes in."),
      ], {
        choices: [
          opt('beside', '옆에서 던질게요. 마지막 근무, 끝까지 같이해요', "I'll cast beside you. Let's see the last shift through", {
            say: ['옆에서 던지겠습니다. 마지막 근무, 끝까지 같이 하겠습니다.', "I'll cast beside you. And I'll see your last shift through to the end."],
            next: 'beside' }),
          opt('next', '그만두시면, 그다음엔 어디로 가세요?', "After you quit — where will you go?", {
            say: ['창고를 그만두신다고요? 그다음엔 어디로 가십니까?', "You're leaving the warehouse? Where will you go after that?"],
            next: 'next' }),
          opt('dawn', '새벽 부두에서 던지시던, 그 대 말이에요?', "The rod you cast at dawn on the pier?", {
            say: ['새벽 부두에서 던지시던, 그 대 말입니까?', "You mean the rod you were casting at dawn on the pier?"],
            next: 'dawn' }),
        ],
        note: ['남궁현 씨가 창고를 그만둔다고, 오늘 밤이 마지막 근무라고 했다. 불을 끄기 전에 처음으로 자기 대를 꺼내겠다며, 새벽 물 들어올 때 포항 부두에서 옆에서 한 마리 하자고 했다.',
          "Hyeon told me he was quitting the warehouse — tonight was his last shift. Before turning off the lights he'd take out his own rod for the first time, and he asked me to catch one beside him on Pohang pier when the dawn tide came in."],
      }),
      beside: scene([
        line(N, '끝까지는 됐어. 한 마리면 돼.', "No need for the end. One fish is enough."),
        line(P, '(창고 열쇠 꾸러미를 손에서 한 번 굴리신다.)', "(He rolls the bunch of warehouse keys once in his hand.)"),
        line(N, '불은 내가 끈다. 넌 부두에 먼저 가 있어.', "I'll turn off the lights. You go to the pier first."),
        line(N, '그 전에 줄 꼬인 데 없나 봐 둬.', "Before that, check your line for twists."),
      ], {
        end: endTalk({ accept: true, offer: 'beside' }),
        note: ['마지막 근무를 끝까지 같이 하겠다고 했다. 남궁현 씨는 한 마리면 된다며 열쇠 꾸러미를 굴렸다. 불은 자기가 끌 테니 부두에 먼저 가서 줄을 봐 두라고 했다.',
          "I said I'd see his last shift through. Hyeon said one fish was enough and rolled his keys in his hand. He'd turn off the lights; I was to go to the pier first and check my line."],
      }),
      next: scene([
        line(N, '…창고는 됐어. 상자는 충분히 날랐다.', "...I'm done with the warehouse. I've carried enough boxes."),
        line(P, '(대답 대신 대 가방 지퍼를 여신다.)', "(Instead of answering, he unzips his rod bag.)"),
        line(N, '그다음은 나중에. 오늘은 마지막 근무 하고, 한 마리 하고. 그거면 돼.', "What comes after can wait. Today, the last shift, and one fish. That's enough."),
        line(N, '질문은 여기까지.', "That's enough questions."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_next' }),
        note: ['그만두면 어디로 가느냐고 물었다. 남궁현 씨는 상자는 충분히 날랐다며 대답 대신 대 가방 지퍼를 열었다. 그다음은 나중이고, 오늘은 마지막 근무와 한 마리뿐이라고 했다.',
          "I asked where he'd go after quitting. Hyeon said he'd carried enough boxes and, instead of answering, unzipped his rod bag. The rest could wait — today was the last shift and one fish."],
      }),
      dawn: scene([
        line(N, '…못 본 걸로 하랬지.', "...I told you to forget you saw that."),
        act(N, 'laugh'),
        line(N, '그건 몰래 던진 거고, 오늘은 꺼내는 거야.', "That was casting in secret. Today I'm taking it out."),
        line(P, '남 옆에서요?', "Next to someone?"),
        line(N, '그래. 소리가 나든 말든. 그 차이는 던져 보면 알아.', "Right. Sound or no sound. You'll know the difference once you cast."),
      ], {
        choices: [
          opt('cast', '던져 볼게요', "I'll give it a cast", {
            say: ['알겠습니다. 옆에서 던져 보겠습니다.', "All right. I'll cast beside you."],
            end: endTalk({ accept: true, offer: 'dawn_rod' }),
            note: ['새벽 부두에서 던지던 그 대냐고 물었다. 남궁현 씨는 못 본 걸로 하랬지 하고 코웃음을 쳤다. 그땐 몰래 던진 거고, 오늘은 남 옆에서 꺼내는 거라고 했다.', "I asked if it was the rod he'd cast at dawn on the pier. Hyeon snorted — hadn't he told me to forget it? That was casting in secret; today he'd take it out beside someone."] }),
          opt('noise', '제 캐스팅은 소리가 나는데, 괜찮을까요?', "My cast makes noise. Is that all right?", {
            say: ['제 캐스팅은 소리가 납니다. 옆에서 던져도 되겠습니까?', "My cast makes a noise. Is it all right for me to cast beside you?"],
            next: 'noise' }),
        ],
        note: ['남궁현 씨는 그때는 몰래 던졌고 오늘은 꺼내는 거라며 짧게 코웃음을 쳤다.', "Hyeon gave a short snort: back then he'd cast in secret, today he was taking it out."],
      }),
      noise: scene([
        line(N, '소리가 뭐 어때서. 고기가 겁내는 건 소리보다 물에 비친 그림자야.', "So what if it makes noise. Fish fear a shadow on the water more than any sound."),
        line(P, '그림자요?', "A shadow?"),
        line(N, '부두 등불을 앞에 두고 서. 그래야 그림자가 물이 아니라 등 뒤로 떨어져.', "Stand with the pier lamp in front of you. Then your shadow falls behind you, not on the water."),
        line(N, '소리는 그다음 문제야.', "Sound is a problem for later."),
      ], {
        end: endTalk({ accept: true, offer: 'my_noise' }),
        note: ['내 캐스팅은 소리가 나는데 괜찮겠느냐고 했다. 남궁현 씨는 고기가 겁내는 건 소리보다 그림자라며, 부두 등불을 앞에 두고 서라고 나를 한 걸음 옮겨 세웠다.',
          "I asked whether it was all right that my cast makes noise. Hyeon said fish fear shadows more than sound, and moved me a step so the pier lamp was in front of me."],
      }),
    },
  },
  // N10-4 — 끝내는 자리(남궁현)
  {
    id: 'n10_4_done', questId: 'N10-4', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '…나란히 한 마리. 됐다.', "...One fish, side by side. That'll do."),
        line(P, '남궁현 씨 캐스팅은 정말 소리가 없더라고요. 제 건 났는데.', "Your cast really makes no sound. Mine did."),
        line(N, '들었어.', "I heard."),
        line(N, '소리 나도 돼. 20년 전 나도 났어.', "It's fine if it makes a sound. Twenty years ago, mine did too."),
        line(P, '…', '...'),
        line(N, '창고 불 끈다.', "I'm turning off the warehouse lights.", { act: 'look_away' }),
      ], {
        choices: [
          opt('lesson', '소리 없는 캐스팅, 어깨가 아니라 손목이더군요', "A silent cast — it's the wrist, not the shoulder", {
            say: ['소리 없는 캐스팅. 어깨가 아니라 손목이더군요.', "The silent cast. It's the wrist, not the shoulder, isn't it."],
            end: endTalk({ complete: 'lesson',
              lineKo: '봤네. 손목이야. 그리고 놓는 순간.\n\n어깨로 던지면 대가 운다. 그게 소리야. 손목으로 던지고, 대가 펴질 때 놔. 일찍 놓으면 하늘로 가고, 늦게 놓으면 발밑에 꽂혀.',
              lineEn: "So you saw. It's the wrist. And the moment you let go.\n\nThrow from the shoulder and the rod cries. That's the sound. Throw from the wrist and release as the rod straightens. Too early and it flies at the sky; too late and it stabs at your feet." }),
            note: ['소리 없는 캐스팅은 손목이더라고 했다. 남궁현 씨는 봤다며, 어깨로 던지면 대가 우는 게 소리라고, 손목으로 던지고 대가 펴질 때 놓으라고 했다.', "I said the silent cast was in the wrist. Hyeon said I'd seen right — throw from the shoulder and the rod cries, that's the sound; throw from the wrist and let go as the rod straightens."] }),
          opt('sound', '소리 나도 된다는 말이 제일 남았어요', "It's fine if it makes a sound — that stayed with me", {
            say: ['소리 나도 된다는 말이 제일 남았습니다.', "What stayed with me most was that it's fine if it makes a sound."],
            next: 'sound' }),
          opt('pay', '마지막 근무 일당은 주시는 거죠?', "You're paying for the last shift, right?", {
            say: ['마지막 근무 일당은 주시는 거죠.', "You're paying me for the last shift, right?"],
            next: 'pay' }),
          opt('not_work', '오늘은 일이 아니었으니, 일당은 사양할게요', "Today wasn't work. I'll pass on the pay", {
            say: ['마지막 일당은 사양하겠습니다. 오늘은 일이 아니었으니까요.', "I'll pass on the last day's pay. Today wasn't work."],
            next: 'not_work' }),
        ],
        note: ['마지막 근무를 마치고 포항 부두에서 남궁현 씨와 나란히 한 마리를 했다. 그의 캐스팅에는 소리가 없었고 내 것은 소리가 났다. 소리 나도 된다고, 20년 전 자기도 났다고 했다.',
          "After his last shift I caught one beside Hyeon on Pohang pier. His cast made no sound; mine did. It's fine if it makes a sound, he said — twenty years ago, his did too."],
      }),
      sound: scene([
        line(N, '20년 전 나도 났어.', "Twenty years ago, mine did too."),
        line(N, '그 말을 나한테 해 준 사람이 없었지.', "Nobody ever said that to me."),
        line(P, '(자기 대를 들어 보이신다. 손잡이에 이름이 새겨져 있다.)', "(He holds up his rod. A name is carved into the grip.)", { act: 'peer' }),
      ], {
        end: endTalk({ complete: 'sound' }),
        note: ['소리 나도 된다는 말이 제일 남았다고 했다. 남궁현 씨는 그 말을 자기한테 해 준 사람은 없었다며, 이름이 새겨진 자기 대를 들어 보였다.',
          "I told him that it's fine if it makes a sound was what stayed with me. Hyeon said nobody had ever told him that, and held up his rod with a name carved in the grip."],
      }),
      pay: scene([
        line(N, '창고에서. 마지막 일당.', "From the warehouse. The last pay."),
        act(N, 'give', { to: P }),
        line(N, '열쇠도 하나 넣었다. 기념이야.', "There's a key in there too. A keepsake."),
        line(P, '열쇠요?', "A key?", { act: 'receive' }),
        line(N, '이제 아무 문도 안 열어. 내일 자물쇠를 바꾼대. 그래도 가져. 그 창고에서 밤을 같이 새운 사람은 몇 없어.', "It doesn't open any door now. They're changing the locks tomorrow. Keep it anyway. Not many people spent a night with me in that warehouse."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['마지막 일당을 받았다. 봉투에는 창고 열쇠가 하나 들어 있었다. 내일 자물쇠를 바꿔서 이제 아무 문도 안 열지만, 그 창고에서 밤을 같이 새운 사람은 몇 없다며 가지라고 했다.',
          "I took my last day's pay. A warehouse key was in the envelope. The locks were being changed tomorrow so it opened nothing now — but few people had spent a night with him in that warehouse, so I should keep it."],
      }),
      not_work: scene([
        line(N, '…일이 아니었다?', "...It wasn't work?", { act: 'look_away' }),
        line(P, '(불 꺼진 창고 쪽을 돌아보신다.)', "(He turns to look back at the darkened warehouse.)"),
        line(N, '그래. 오늘은 일이 아니었지. 대를 꺼낸 날이 일일 리 없어.', "Right. Today wasn't work. A day I took out my rod can't be work."),
        line(N, '그럼 장부에 안 적는다. 이 밤은 장부 밖이야.', "Then it doesn't go in the ledger. This night stays off the books."),
      ], {
        end: endTalk({ complete: 'not_work' }),
        note: ['오늘은 일이 아니었으니 일당은 사양하겠다고 했다. 남궁현 씨는 불 꺼진 창고를 돌아보더니, 대를 꺼낸 날이 일일 리 없다며 이 밤은 장부 밖이라고 했다.',
          "I said today wasn't work and turned down the pay. Hyeon looked back at the darkened warehouse and agreed — a day he took out his rod couldn't be work. This night would stay off the books."],
      }),
    },
  },
];
