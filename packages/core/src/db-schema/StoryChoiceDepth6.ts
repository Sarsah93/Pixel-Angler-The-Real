/**
 * @file StoryChoiceDepth6.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 6묶음: 서브 아크 N10 ~ N17.
 *              (N10 남궁현 · N11 채금자·채파도 · N12 오가윤·정우미 · N13 송기백·마감기 · N14 제주 3인 · N15 울릉 · N16 석독구 · N17 인천)
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { d } from './StoryChoiceDepthKit.js';

export const CHOICE_DEPTH_6: Record<string, ChoiceDepthEntry> = {
  // ── N10-1 「야간 근무」 · 남궁현 ──
  'N10-1': {
    offer: [
      d('night_ok', '밤새는 건 자신 있습니다. 어디부터 옮기면 됩니까?', "I can stay up all night. Where do I start?",
        '…자신은 새벽에 보자. (창고 셔터를 반쯤 올린다. 안쪽에 불이 하나만 켜져 있다.)\n\n문 쪽 상자부터. 릴은 릴끼리, 줄은 호수끼리. 다 옮기면 가. 그 전엔 못 가.',
        "…We'll see about that at dawn. (He rolls the shutter halfway up. Only one light is on inside.)\n\nThe boxes by the door first. Reels with reels, line with line of the same weight. Go when they're all moved. Not before.",
        { affinity: 0.04 }),
      d('ask_stock', '재고 정리면 뭘 세는 겁니까? 낚시 물건은 종류가 많을 텐데요.', "What am I counting? Tackle comes in a lot of kinds.",
        '바늘, 봉돌, 줄, 찌, 릴. 바늘만 호수별로 이백 가지가 넘어. (선반 한 칸을 손가락으로 훑는다. 먼지 하나 묻어나지 않는다.)\n\n장부랑 선반이 맞으면 끝이야. 안 맞으면 맞을 때까지 센다. 밤새라는 게 그 뜻이야.',
        "Hooks, sinkers, line, floats, reels. Hooks alone run to over two hundred sizes. (He runs a finger along a shelf. Not a speck of dust comes off.)\n\nWhen the ledger matches the shelves, you're done. If it doesn't, you count till it does. That's what all night means.",
        { affinity: 0.03, flag: 'choice.n10_1_asked_stock' }),
      d('joke_question', '질문은 안 받는다는 것도, 질문하면 안 됩니까?', "Am I allowed to ask about the no-questions rule?",
        '…방금 했잖아. 하나는 봐준다. (입꼬리가 아주 조금 움직였다가 제자리로 돌아간다.)\n\n두 번째부터는 시급에서 깐다. 농담 아니야. 장갑 끼고 따라와.',
        "…You just did. I'll let one slide. (The corner of his mouth moves, barely, then settles back.)\n\nFrom the second one, it comes off your hourly rate. I'm not joking. Gloves on. Follow me.",
        { affinity: 0.01 }),
      d('first_night', '밤새는 일은 처음입니다. 졸면 어떻게 합니까?', "I've never worked through a night. What if I nod off?",
        '졸면 그 시간은 시급에서 뺀다. 그게 다야. (목장갑 한 켤레를 던져 준다.)\n\n잠은 한밤중에 한 번, 새벽 들기 전에 또 한 번 온다. 처음 건 찬물로 쫓고, 두 번째 건 무거운 상자로 쫓아.',
        "Nod off and that time comes off your pay. That's all. (He tosses me a pair of cotton work gloves.)\n\nSleep comes once in the dead of night and again just before dawn. Chase the first off with cold water. The second, with a heavy box.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('stock_order', '상자 쌓는 순서에도 법이 있더군요. 그걸 배우고 싶습니다.', "There's a system to how the boxes stack. I'd like to learn it.",
        '…눈은 있네. 많이 나가는 건 문 쪽, 무거운 건 아래, 먼저 들어온 건 앞. (장부를 펼쳐 출고 순서를 손가락으로 짚어 준다.)\n\n창고는 외우는 데가 아니야. 순서를 아는 데지. 다음 근무엔 장부부터 봐. (창고 정리 요령이 손에 익는다.)',
        "…You've got eyes. Fast movers by the door, heavy at the bottom, first in at the front. (He opens the ledger and runs a finger down the dispatch order.)\n\nA warehouse isn't for memorising. It's for knowing the order. Next shift, look at the ledger first. (The knack of keeping a store settles into my hands.)",
        { proficiency: { category: 'economy', xp: 22 }, affinity: 0.04 }),
    ],
    completeReply: {
      pretend: [
        '…좋아. (일당에 무언가를 더 얹는다. 말은 없다.)\n\n본 걸 안 본 걸로 하는 것도 일이야. 그걸 할 줄 아는 사람이 드물어. 다음 달에도 야간 사람이 모자라. 생각 있으면 와.',
        "…Good. (He adds something to the day's wage. He says nothing.)\n\nUnseeing what you saw is work too. Not many people can do it. I'm short of night hands next month as well. Come if you want.",
      ],
      ask: [
        '…봤구나. 안 가르쳐. 아직은. (그래도 손목 각도 하나를 고쳐 준다.)\n\n보는 거랑 배우는 건 달라. 나는 보여 준 적도 없고. 아직이라는 건 언젠가라는 뜻이야. 그때까지는 상자나 날라.',
        "…So you saw. I'm not teaching it. Not yet. (He fixes one wrist angle for me anyway.)\n\nSeeing isn't learning. And I never showed you anything. Not yet means someday. Until then, carry boxes.",
      ],
      pay: [
        '그래. 그게 일이야. (돈을 세는 손이 창고 관리인의 손이 아니다.)\n\n일한 만큼 받는 게 제일 깨끗해. 밤일이 또 생각나면 와. 셔터는 늘 반쯤 올라가 있어.',
        "Right. That's the job. (The hand counting the money isn't a storeman's hand.)\n\nTaking what the work was worth is the cleanest way. If you want night work again, come by. The shutter's always half up.",
      ],
    },
  },

  // ── N10-2 「계측 이의신청」 · 남궁현 ──
  'N10-2': {
    offer: [
      d('by_rules', '본 대로, 규정대로만 말하겠습니다.', "I'll say what I saw, by the rules. Nothing more.",
        '그거면 돼. 증인은 그거 하나만 하면 돼. (계측 기록지 사본을 건넨다. 숫자 옆에 그의 서명이 있다.)\n\n네가 본 길이, 네가 본 자. 그 둘만 말해. 누가 뭐라고 하든 그 둘 말고는 대답하지 마.',
        "That's enough. A witness only has to do that one thing. (He hands me a copy of the measuring sheet. His signature sits beside the number.)\n\nThe length you saw, the rule you saw it on. Say those two. Whatever anyone says, answer nothing else.",
        { affinity: 0.05 }),
      d('ask_dispute', '이의신청이라면, 어느 쪽이 뭘 문제 삼은 겁니까?', "An appeal — who's disputing what?",
        '선수는 자기 고기가 규정보다 크다 하고, 계측대는 작다고 했어. 몇 밀리 차이야. (손가락 두 개를 아주 조금 벌려 보인다.)\n\n그 몇 밀리로 순위가 바뀌어. 그래서 증인이 필요해. 그 자리에 있던 사람 중에 규정을 읽을 줄 아는 게 너야.',
        "The angler says his fish is over the mark. The measuring table said under. A few millimetres. (He holds two fingers barely apart.)\n\nA few millimetres moves the placings. That's why I need a witness. Of the people who were there, you're the one who can read the rules.",
        { affinity: 0.03, flag: 'choice.n10_2_asked_dispute' }),
      d('know_him', '그 선수, 제가 아는 사람입니다. 그래도 제가 서야 합니까?', "I know that angler. Does it really have to be me?",
        '그래서 너야. 아는 사람 앞에서도 규정대로 말하는 증언이라야 무게가 있어. (잠깐 말을 멈춘다. 계측대 쪽은 보지 않는다.)\n\n어렵지. 어려운 거 알아. 그래도 편을 들면 그 사람도 너도 같이 잃어. 그건 내가 알아.',
        "That's why it's you. Testimony only carries weight if it's by the rules even in front of someone you know. (He pauses. He doesn't look toward the measuring table.)\n\nIt's hard. I know it's hard. But take a side and you both lose. That much I know.",
        { affinity: 0.04, flag: 'choice.n10_2_knew_him' }),
      d('rule_wrong', '규정이 틀렸으면요? 그때도 규정대로만 말합니까?', "And if the rule's wrong? Do I still say only what it says?",
        '규정이 틀렸으면 규정을 고쳐. 대회 끝나고, 서류로. 증언대에서 고치는 게 아니야. (규정집 모서리를 손가락으로 두드린다.)\n\n오늘은 오늘 규정으로 잰다. 그게 다른 선수들한테도 공평한 거야. 할 말 있으면 끝나고 해. 들어는 줄게.',
        "If the rule's wrong, you change the rule. After the tournament, on paper. Not from the witness stand. (He taps the corner of the rulebook.)\n\nToday we measure by today's rules. That's what's fair to every other angler. If you've something to say, say it after. I'll listen.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('no_fee', '수당은 사양하겠습니다. 아는 사람한테 불리한 말을 했으니까요.', "I'll pass on the fee. I testified against someone I know.",
        '…규정대로 말한 건 불리한 말이 아니야. 있었던 일이지. (수당 봉투를 잠깐 들고 있다가 도로 내려놓는다.)\n\n안 받겠다면 안 받은 것도 적어 둔다. 그것도 규정이야. (증인 명부 수당 칸에 사양이라고 적힌다. 대회 운영 쪽 사람들이 내 이름을 기억해 둔다.)',
        "…Saying it by the rules isn't testifying against him. It's what happened. (He holds the fee envelope a moment, then sets it back down.)\n\nIf you won't take it, I'll write down that you didn't. That's in the rules too. (The fee column in the witness book reads: declined. The tournament staff remember my name.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      ask_20: [
        '…편을 들었어. 친구를. 그래서 떠났지. (그가 자기 심판 배지를 보여 준다. 오래된 것이다.)\n\n그 친구 얘기는 거기까지야. 남은 건 이 배지하고, 규정대로 못 한 심판이라는 이름이지. 오늘 네가 한 걸 그때 내가 했으면 좋았을 거다.',
        "…I took a side. A friend's. So I left. (He shows me his judge's badge. An old one.)\n\nThat's as far as the friend goes. What's left is this badge, and a name: the judge who couldn't keep to the rules. I wish I'd done then what you did today.",
      ],
      lesson: [
        '규정은 사람을 위해 있어. 그걸 잊으면 규정이 사람을 잡아. (계측 규정이 몸에 붙는다.)\n\n자는 주둥이 끝부터 꼬리 끝까지, 꼬리는 펴서 대. 고기가 휘었으면 펴고 다시 재. 눈금은 바로 위에서 내려다봐. 옆에서 보면 몇 밀리가 달라져.',
        "Rules exist for people. Forget that and the rules start catching people. (Measurement regulations settle into my body.)\n\nLay the rule from the tip of the snout to the tip of the tail, tail spread. If the fish is bent, straighten it and measure again. Read the mark from straight above. From the side, you're off by millimetres.",
      ],
      pay: [
        '있어. 대회 규정에. (규정대로 준다.)\n\n증인 수당도 규정, 증인 서명도 규정이야. 받았으면 여기 이름 써. 누가 뭘 받았는지 남아 있어야 나중에 아무도 말을 못 해.',
        "There is. It's in the tournament rules. (He pays it by the rules.)\n\nThe witness fee's in the rules, and so is the witness signature. Now you've taken it, sign here. When it's on record who took what, nobody can say anything later.",
      ],
    },
  },

  // ── N10-3 「심판석」 · 남궁현 ──
  'N10-3': {
    offer: [
      d('write_rules', '맡아 주셔서 고맙습니다. 규정은 오늘 밤 안에 써 오겠습니다.', "Thank you for taking it. I'll have the rules written by tonight.",
        '밤새 쓰지 마. 밤새 쓴 규정은 길어. 긴 규정은 사람을 잡고. (빈 공책 한 권을 건넨다. 표지에 아무것도 적혀 있지 않다.)\n\n한 장이면 돼. 무엇을 재는지, 어떻게 재는지, 이의는 누구한테 하는지. 그 셋이면 대회가 선다.',
        "Don't write all night. Rules written all night run long, and long rules catch people. (He hands me a blank notebook. Nothing on the cover.)\n\nOne page will do. What gets measured, how it gets measured, and who hears appeals. With those three, a tournament stands.",
        { affinity: 0.05 }),
      d('ask_measure', '재기만 하신다는 건, 판정은 안 하신다는 뜻입니까?', "You only measure — so you won't be making the calls?",
        '판정은 자가 해. 나는 자를 대고, 숫자를 읽고, 적는다. 그 숫자를 어떻게 쓸지는 네 규정이 정하고. (자를 꺼내 계측대 위에 반듯이 놓는다.)\n\n심판이 규정까지 쥐면 대회가 심판 거가 돼. 이건 네 대회야. 나는 재기만 한다.',
        "The rule makes the call. I lay it down, read the number, write it. What that number means is up to your rules. (He takes out a measuring rule and sets it square on the table.)\n\nWhen the judge holds the rulebook too, the tournament becomes the judge's. This one's yours. I only measure.",
        { affinity: 0.04, flag: 'choice.n10_3_asked_measure' }),
      d('not_ready', '규정을 제가 정해도 되겠습니까? 아직 그럴 자격이 있는지…', "Is it really for me to set the rules? I'm not sure I've earned it…",
        '자격은 대회를 연 사람한테 있어. 열었잖아. (한쪽 눈썹이 올라간다.)\n\n모르는 건 물어. 대답은 해 준다. 대신 정하는 건 네가 해. 내가 정하면 내가 편을 드는 거야. 그건 이제 안 해.',
        "Whoever opens the tournament has earned it. You opened it. (One eyebrow goes up.)\n\nAsk what you don't know. I'll answer. But you do the deciding. If I decide, I'm taking a side. I don't do that any more.",
        { affinity: 0.03 }),
      d('joke_strict', '심판이 깐깐하시면 참가자가 줄 텐데요.', "With a judge this strict, entries might drop.",
        '줄면 줄어. 깐깐해서 안 오는 사람은 원래 안 올 사람이야. (대답이 너무 빨라서 농담인지 아닌지 모르겠다.)\n\n대신 온 사람은 끝까지 믿고 던져. 결과가 어떻게 나와도 자가 잰 거니까. 그게 깐깐한 심판이 주는 거야.',
        "Then they drop. Anyone a strict judge keeps away wasn't coming anyway. (He answers so fast I can't tell if he's joking.)\n\nBut the ones who come can cast and trust it to the end. Whatever the result, the rule measured it. That's what a strict judge gives you.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('thanks_seat', '심판석에 앉아 주셔서, 이 대회가 대회가 됐습니다.', "Because you sat at that table, this became a real tournament.",
        '…고맙다는 말은 규정에 없어. 그래도 받지. 이번 한 번은. (규정집을 덮어 내게 돌려준다. 표지에 손때가 묻었다.)\n\n대회는 네가 열었고 나는 재기만 했어. 사람들이 기억할 건 네 이름이야. (속초 항구에 재개관 대회를 연 사람으로 내 이름이 돈다.)',
        "…Thanks isn't in the rules. I'll take it anyway. Just this once. (He closes the rulebook and hands it back. The cover carries the marks of his hands.)\n\nYou opened the tournament. I only measured. The name people will remember is yours. (My name goes round Sokcho harbour as the one who held the reopening tournament.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      badge: [
        '20년 전 거야. 버리지 않았지. (배지를 떼어 내게 준다. 다음 대회는 네가 심판이라며.)\n\n핀이 헐거워. 달 때 두 번 눌러. 이걸 달면 아는 사람이 줄에 서도 숫자만 보여. 그게 무거우면 떼고, 견딜 만하면 달아.',
        "Twenty years old. I never threw it away. (He unpins it and gives it to me. Next tournament you judge, he says.)\n\nThe pin's loose. Press it twice when you put it on. Wear this and even with someone you know in the queue, all you see is the number. If that's too heavy, take it off. If you can bear it, wear it.",
      ],
      lesson: [
        '세 줄 빼. 사람을 잡는 줄이야. (대회 규정이 정리된다.)\n\n어기면 실격, 어기면 실격, 어기면 실격. 그렇게 쓰면 규정이 아니라 덫이야. 하지 말라는 줄보다 어떻게 하라는 줄이 많아야 해.',
        "Cut three lines. Those are the ones that catch people. (The tournament rules get tidied.)\n\nBreak this, disqualified. Break that, disqualified. Write it like that and it isn't a rulebook, it's a trap. You want more lines saying how than lines saying don't.",
      ],
      pay: [
        '규정대로. (수당을 받고 그 자리에서 대회 기금에 다시 낸다.)\n\n수당을 받는 건 규정이고, 기금에 내는 건 내 마음이야. 장부에는 따로 적어. 둘이 섞이면 다음 심판이 헷갈려.',
        "By the rules. (He takes the fee and puts it straight back into the prize fund.)\n\nTaking the fee is the rules. Putting it in the fund is me. Write them separately in the books. Mix them and the next judge gets confused.",
      ],
    },
  },

  // ── N11-1 「요리 못 하는 선장」 · 채금자 ──
  'N11-1': {
    offer: [
      d('deal', '좋습니다. 밥은 제가, 항로는 채금자 씨가. 거래죠.', "Done. I cook, you teach me the course. That's a deal.",
        '거래 좋아요. 깔끔하네요. (키 옆 계기판을 손바닥으로 한 번 쓸어낸다.)\n\n광어 한 마리면 배 위 사람 다 먹어요. 수업은 밥 먹고 나서, 키 앞에서 해요. 배가 부르면 조류가 잘 보이거든요. 그건 진짜예요.',
        "I like a deal. Clean. (She sweeps her palm once across the gauges by the wheel.)\n\nOne flatfish feeds everyone aboard. The lesson comes after we eat, at the wheel. You read the current better on a full stomach. That's true, by the way.",
        { affinity: 0.05 }),
      d('ask_cooking', '요리를 아예 못 하신다는 게, 라면도요?', "Can't cook at all — not even ramyeon?",
        '라면은… 물 맞추는 게 어려워요. 바다에선 물때를 맞추는데 냄비에선 못 맞춰요. (진지한 얼굴이라 더 웃기다.)\n\n배 위에서 불 쓰는 것도 좀 겁나요. 흔들리잖아요. 그래서 잘하는 사람한테 맡겨요. 잘하는 사람이 하면 돼요. 그게 배 위 규칙이에요.',
        "Ramyeon… getting the water right is hard. At sea I can time the tides, but not a pot. (Her face is dead serious, which makes it funnier.)\n\nFire on a boat scares me a bit, too. Everything rocks. So I hand it to someone good at it. Whoever's good at it does it. That's the rule on a boat.",
        { affinity: 0.04, flag: 'choice.n11_1_asked_cooking' }),
      d('modest_cook', '제 요리도 그렇게 대단하진 않습니다만…', "My cooking's nothing special, mind you…",
        '제 요리보다 나으면 대단한 거예요. 여긴 기준이 낮아요. (웃지도 않고 말한다.)\n\n회 떠서 초장만 있어도 돼요. 뜨끈한 국 하나 있으면 더 좋고요. 배 위에서는 맛보다 따뜻한 게 먼저예요. 사람이 버텨야 배가 버텨요.',
        "If it beats mine, it's special. The bar's low around here. (She says it without a smile.)\n\nSliced raw with chilli sauce is plenty. A hot soup on the side is better. On a boat, warm comes before tasty. The crew has to hold out for the boat to hold out.",
        { affinity: 0.03 }),
      d('joke_lesson', '수업이 별로면, 밥도 별로가 되는 겁니다?', "So if the lesson's poor, the food gets poor too?",
        '협박이네요. 좋아요, 그 정도 배짱은 있어야 선원이죠. (키를 한 바퀴 돌렸다가 제자리로 놓는다.)\n\n걱정 마요. 수업은 안 별로예요. 낚시는 서툴러도 배는 안 서툴러요. 밥이나 맛있게 해요. 그럼 수업이 두 배로 길어질 거예요.',
        "That's a threat. Good — a deckhand ought to have that much nerve. (She spins the wheel a full turn and sets it back.)\n\nDon't worry, the lesson won't be poor. I may be clumsy with a rod, never with a boat. Just make the food good. Then the lesson runs twice as long.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('deck_knife', '흔들리는 배에서 칼 쓰는 게 제일 어려웠습니다.', "Using a knife on a rocking boat was the hardest part.",
        '그건 제가 알아요. 요리는 몰라도 배는 알거든요. (조리대 쪽으로 와서 내 발 위치를 고쳐 준다.)\n\n파도 오는 쪽에 등을 대고, 무릎은 조금 굽혀요. 도마 밑엔 젖은 행주를 깔고요. 칼은 배가 내려갈 때 넣어요. (흔들리는 데서 칼 쓰는 요령이 몸에 붙는다.)',
        "That one I know. I don't know cooking, but I know boats. (She comes over to the galley and fixes where I'm standing.)\n\nBack to the swell, knees a little bent. A wet cloth under the board. Put the knife in as the boat drops. (The knack of using a knife on a moving deck settles into my body.)",
        { proficiency: { category: 'life', xp: 22 }, affinity: 0.04 }),
    ],
    completeReply: {
      lesson: [
        '거래 성립. (조타 감각이 달라진다. 배가 조류를 읽기 시작한다.)\n\n다음엔 연료예요. 갈 때 삼분의 일, 올 때 삼분의 일, 나머지는 바다 몫. 바다 몫은 절대 안 써요. 그걸 쓰는 날이 사고 나는 날이에요.',
        "Deal. (My feel at the helm changes. The boat begins to read the current.)\n\nFuel next. A third to go out, a third to come back, and the rest is the sea's. Never touch the sea's share. The day you do is the day something goes wrong.",
      ],
      pay: [
        '맞아요. 선상식은 유료죠. (선장 지갑은 두껍다.)\n\n공짜 밥은 다음에 대충 하게 돼요. 돈 받은 밥은 다음에도 맛있어야 하고요. 그러니까 받아요. 저도 또 시킬 거니까.',
        "Right. Meals afloat are chargeable. (The skipper's wallet is thick.)\n\nA free meal gets sloppy the next time. A paid one has to be good the next time too. So take it. I'll be asking again.",
      ],
      decline: [
        '…그렇게 말하면 다음에도 시켜야겠네요. (지세포 선장들 사이에 내 이름이 돈다.)\n\n농담 아니에요. 지세포에 밥 하는 선원 귀해요. 다들 낚시하러 왔지 밥하러 온 건 아니라서. 그쪽 이름, 선장들한테 벌써 말해 놨어요.',
        "…Say that and I'll have you cooking again. (My name goes round the Jisepo skippers.)\n\nI'm not joking. Crew who can cook are rare in Jisepo. Everyone came to fish, not to cook. I've already mentioned your name to the other skippers.",
      ],
    },
  },

  // ── N11-2 「파도의 첫 월급」 · 채파도 ──
  'N11-2': {
    offer: [
      d('dawn_go', '울지 말고 통발 위치부터 말해. 새벽에 가자.', "Don't cry. Tell me where the traps are. We go at dawn.",
        '안 울어요! …조금 울었어요. (소매로 코를 훔치고 해도를 펼친다.)\n\n방파제 끝에서 두 줄이요. 두 번만 걷으면 물량 맞아요. 진짜 고마워요. 이번엔 안 잊을게요. 알람 세 개 맞춰 놨어요.',
        "I'm not crying! …I cried a bit. (He wipes his nose on his sleeve and spreads out the chart.)\n\nTwo lines off the end of the breakwater. Two lifts and the numbers match. Thank you, really. I won't forget this time. I've set three alarms.",
        { affinity: 0.06 }),
      d('ask_lot', '물량을 날렸다는 게 무슨 소리야? 고기를 놓친 거야?', "Lost the lot? What do you mean — you lost the catch?",
        '고기는 있었어요. 배송을 잊었어요. 경매에 낼 상자를 냉장고에 넣어 두고는… 그냥 잊었어요. (머리를 감싸 쥔다.)\n\n경매는 시간이 정해져 있잖아요. 그 시간 지나면 그 물량은 없는 거예요. 중매인 아저씨들이 기다렸대요. 그래서 새벽에 새로 걷어서 채워야 해요.',
        "The fish were there. I forgot the delivery. I put the auction boxes in the cold store and then… just forgot. (He clutches his head.)\n\nAuctions run to a fixed time, right? Miss it and that lot doesn't exist. The buyers waited, apparently. So we have to lift fresh traps at dawn and fill it.",
        { affinity: 0.03, flag: 'choice.n11_2_asked_lot' }),
      d('ask_skipper', '채금자 씨가 알 거라는 건 또 무슨 소리야?', "And what do you mean, she'll know?",
        '선장님은 다 알아요. 말을 안 할 뿐이에요. 아침에 제 얼굴만 봐도 알아요. (부두 쪽을 흘끔 본다. 조타실 불이 켜져 있다.)\n\n그래서 더 무서워요. 혼나면 차라리 나은데, 선장님은 안 혼내요. 그냥 봐요. 그러니까 날 밝기 전에 끝내야 해요.',
        "The skipper knows everything. She just doesn't say. She can tell from my face in the morning. (He glances at the quay. The wheelhouse light is on.)\n\nThat's what's scary. A telling-off would be better. She doesn't tell you off. She just looks. So we have to finish before it's light.",
        { affinity: 0.04, flag: 'choice.n11_2_asked_skipper' }),
      d('scold', '또 덜렁댔구나. 이번이 마지막이다.', "Scatterbrained again. This is the last time.",
        '네… 마지막이에요. 진짜로요. (고개를 푹 숙였다가 금방 든다.)\n\n혼나도 싸요. 근데 혼내면서도 같이 가 주는 거죠? (대답을 기다리는 눈이 동그랗다.) 새벽에 봬요. 제가 먼저 나와 있을게요. 진짜 먼저요.',
        "Yes… the last time. Really. (He hangs his head, then lifts it straight back up.)\n\nI deserve it. But you're still coming even while you tell me off, right? (His eyes go round, waiting for an answer.) See you at dawn. I'll be out first. Really first.",
        { affinity: 0 }),
    ],
    completeAdd: [
      d('tell_first', '품삯은 됐다. 대신 채금자 씨께는 네가 먼저 말씀드려.', "Forget the wage. But you tell Geum-ja first, yourself.",
        '…제가요? 먼저요? (드라이백 끈을 만지작거린다.)\n\n…네. 그게 맞아요. 숨기면 또 잊을 거예요. 지금 갈게요. 여기 있어요. 아니, 있어 줘요. (선장은 파도의 말을 끝까지 듣고 고개를 한 번 끄덕였다. 그날 일은 내 이름과 함께 지세포 부두에 돈다.)',
        "…Me? First? (He fiddles with the strap of the dry bag.)\n\n…Yes. That's right. If I hide it, I'll forget again. I'm going now. You stay here. No — stay with me. (The skipper hears Pado out and nods once. The story goes round Jisepo pier with my name in it.)",
        { affinity: 0.06, harborRep: 2 }),
    ],
    completeReply: {
      take: [
        '네! (드라이백에 파도 이름이 매직으로 적혀 있다.)\n\n이름은… 지우지 마요. 그쪽 거지만 제가 처음 산 거니까요. 물 안 들어가요. 휴대폰이랑 지갑, 거기 넣어요. 맨날 젖잖아요.',
        "Yes! (Pado's name is written on the dry bag in marker.)\n\nDon't… rub the name off. It's yours, but it's the first thing I ever bought. Water won't get in. Put your phone and wallet in it. You're always soaked.",
      ],
      lesson: [
        '저요? 제가 가르쳐요? 손목이에요, 손목! (통발 회수가 빨라진다.)\n\n팔로 당기면 금방 지쳐요. 줄은 뱃전에 걸고 손목으로 감아 올려요. 선장님이 그랬어요. 통발은 힘이 아니라 박자래요. 하나, 둘, 하나, 둘.',
        "Me? Teach you? It's the wrist — the wrist! (My trap hauling gets faster.)\n\nPull with your arms and you're done in no time. Hook the line over the gunwale and roll it up with your wrists. The skipper said so. Traps aren't strength, they're rhythm. One, two, one, two.",
      ],
      pay: [
        '아… 네. 맞아요. (첫 월급 나머지를 준다. 미안한 얼굴이다.)\n\n그쪽 시간도 돈이죠. 새벽에 자다 나온 거잖아요. 괜찮아요. 다음 달에 또 받아요, 월급. 그땐 안 날릴 거예요.',
        "Ah… right. Of course. (He gives me what's left of his first pay packet, looking sorry about it.)\n\nYour time's worth money too. You got out of bed before dawn for this. It's fine. I get paid again next month. I won't lose a lot then.",
      ],
    },
  },

  // ── N11-3 「태풍 전야」 · 채금자 ──
  'N11-3': {
    offer: [
      d('will_learn', '배우겠습니다. 바다 앞에서 돈 얘기는 안 듣겠습니다.', "I'll learn it. Money doesn't get a say against the sea.",
        '말은 쉬워요. 손님이 지폐를 세기 시작하면 어려워져요. (창밖 하늘을 본다. 구름이 낮고 빠르다.)\n\n거절은 짧게 해요. 이유를 길게 대면 손님이 이유랑 싸워요. 그리고 배는 지금 묶어요. 거절하고 나서 묶으면 늦어요.',
        "Easy to say. It gets hard when the customer starts counting notes. (She looks out at the sky. The clouds are low and fast.)\n\nKeep the refusal short. Give a long reason and the customer argues with the reason. And lash the boat now. Lash it after you refuse and it's too late.",
        { affinity: 0.05 }),
      d('ask_how', '거절에도 법이 있습니까? 그냥 안 된다고 하면 되지 않습니까.', "Is there really a way to refuse? Can't I just say no?",
        '안 된다고만 하면 손님은 왜냐고 물어요. 왜에 대답하기 시작하면 그때부터 흥정이에요. (손가락 하나를 세운다.)\n\n그래서 법이 있어요. 한 번만, 짧게, 같은 말로. 그다음엔 대답 안 해요. 그게 다예요. 쉬운데 다들 못 해요.',
        "Just say no and the customer asks why. Start answering why and it turns into haggling. (She holds up one finger.)\n\nSo there's a way. Once, short, the same words. After that you don't answer. That's all. Simple, and hardly anyone can do it.",
        { affinity: 0.04, flag: 'choice.n11_3_asked_how' }),
      d('tempted', '두 배면… 솔직히 흔들립니다. 배 수리비도 있고요.', "Double… honestly, it's tempting. I've repairs to pay for.",
        '흔들리는 게 정상이에요. 안 흔들리는 사람은 거절을 배울 필요도 없어요. (그 말을 하는 얼굴이 단단하다.)\n\n수리비는 다음 달에도 벌 수 있어요. 배랑 사람은 다음 달에 못 벌어요. 그 계산이 한 번에 나오면 그때부터 선장이에요.',
        "Being tempted is normal. Anyone who isn't has no need to learn refusing. (Her face is set hard as she says it.)\n\nYou can earn repair money next month. You can't earn back a boat or a person next month. When that sum comes out in one go, that's when you're a skipper.",
        { affinity: 0.03 }),
      d('sky_fine', '태풍이 정말 옵니까? 하늘은 아직 멀쩡한데요.', "Is the typhoon really coming? The sky still looks fine.",
        '하늘은 마지막에 바뀌어요. 바다가 먼저고요. 너울 봐요. 바람도 없는데 길게 밀려오잖아요. (방파제 너머를 턱으로 가리킨다.)\n\n멀쩡해 보일 때가 제일 위험해요. 손님도 그걸 보고 조르는 거예요. 그러니까 지금 묶어요. 결속 자재 두 개부터 만들어요.',
        "The sky changes last. The sea changes first. Look at the swell — long rollers with no wind behind them. (She points her chin past the breakwater.)\n\nWhen it looks fine is when it's most dangerous. That's exactly why the customer's pushing. So lash it now. Make two lashings first.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('storm_knot', '결속 매듭, 채금자 씨 식으로 다시 묶어 보고 싶습니다.', "I'd like to retie the lashings your way.",
        '좋아요. 태풍 매듭은 묶는 것보다 푸는 걸 먼저 생각해요. 바람 지나간 뒤에 칼 없이 풀려야 하니까요. (밧줄 끝을 한 번 더 감아 보여 준다.)\n\n당기면 조이고, 끝을 빼면 풀려요. 거절도 그래요. 단단하게, 그래도 나중에 다시 나갈 수 있게. (결속 매듭이 손에 붙는다.)',
        "Good. With a storm knot you think about untying before tying. Once the wind's passed it has to come loose without a knife. (She takes the rope end round once more to show me.)\n\nPull and it tightens, draw the end and it lets go. Refusing's the same. Firm, but so you can sail again later. (Storm lashings settle into my hands.)",
        { proficiency: { category: 'crafting', xp: 25 }, affinity: 0.05 }),
    ],
    completeReply: {
      lesson: [
        '바다가 안 된다고 했다. 그렇게만 말해요. (이후 사고 확률이 눈에 띄게 준다.)\n\n내가 안 된다고 하면 손님은 나랑 싸워요. 바다가 안 된다고 하면 싸울 데가 없어요. 그 말 뒤에 숨는 게 아니라, 그 말 앞에 서는 거예요.',
        "The sea said no. Say only that. (After this, my accident rate visibly drops.)\n\nIf I say no, the customer fights me. If the sea says no, there's nothing to fight. You're not hiding behind those words. You're standing in front of them.",
      ],
      pay: [
        '…그것도 맞아요. 배는 서 있어도 돈이 나가죠. (조금 준다. 표정이 복잡하다.)\n\n거절한 날 돈 얘기 하는 거, 저는 아직 어색해요. 그래도 맞는 말이에요. 서 있는 배도 밥은 먹어야 하니까. 다음엔 제가 먼저 챙길게요.',
        "…That's fair too. A boat costs money standing still. (She gives me a little. Her face is complicated.)\n\nTalking money on the day you refused still feels odd to me. But you're right. A boat standing idle still has to eat. Next time I'll think of it first.",
      ],
      decline: [
        '…그렇게 말하는 선장이 오래 가요. (지세포 선장 모임에 내 자리가 생긴다.)\n\n모임은 말이 없어요. 다들 바다 얘기만 해요. 그래도 거기 앉아 있으면 누가 언제 거절했는지 다 들려요. 그렇게 배워요.',
        "…Skippers who say that last a long time. (I have a seat among the Jisepo skippers.)\n\nThe meetings are quiet. Everyone only talks about the sea. But sit there and you hear who refused when. That's how it gets learned.",
      ],
    },
  },

  // ── N12-1 「다툰 날의 방파제」 · 오가윤 (once — 미루기 답은 나레이션에 있다) ──
  'N12-1': {
    offerAdd: [
      d('ask_today', '오늘만이라는 건, 내일은 괜찮아진다는 뜻입니까?', "Only today — does that mean tomorrow will be all right?",
        '…모르겠어요. 그래도 오늘만이라고 해야 부탁할 수 있잖아요. 내일도라고 하면 너무 무거우니까. (무릎을 끌어안는다.)\n\n내일은 출근해요. 호텔은 다툰 날에도 문을 열어요. 웃으면서 체크인 받아야 하고요. 그러니까 오늘만이에요.',
        "…I don't know. But I have to say only today to be able to ask. Say tomorrow too and it's too heavy. (She hugs her knees.)\n\nTomorrow I'm at work. The hotel opens even on days you've had a fight. I have to smile and check people in. So it's only today.",
        { affinity: 0.04, flag: 'choice.n12_1_asked_today' }),
      d('line_out', '옆에 앉되, 채비는 던져 두겠습니다. 손이 심심해서요.', "I'll sit with you — but I'll put a line out. My hands get bored.",
        '던져요. 안 물어도 돼요. 물면… 그건 그때 생각해요. (처음으로 내 채비 쪽을 본다.)\n\n낚시는 말 안 해도 돼서 좋네요. 둘이 같은 데를 보고 있어도 이상하지 않잖아요. 발밑 갯가도 좀 봐 줘요. 해 넘어갈 때까지요.',
        "Cast. It doesn't have to bite. If it does… we'll think about it then. (For the first time she looks over at my rig.)\n\nThat's the nice thing about fishing — nobody has to talk. Two people staring at the same spot isn't strange. Have a look along the shore at our feet too. Until the sun goes down.",
        { affinity: 0.03 }),
    ],
    offerReply: {
      stay: [
        '…고마워요.\n\n자리 좀 닦을게요. 방파제는 해 질 무렵이면 금방 차가워져요. 아무 말 안 해도 돼요. 저도 안 할 거예요.',
        "…Thank you.\n\nLet me wipe the spot. The breakwater goes cold fast once the sun's going down. You don't have to say anything. I won't either.",
      ],
      decline: [
        '…네. 그럴 수 있죠. (그녀는 혼자 해가 지는 걸 봤다. 그날은 다시 오지 않는다.)\n\n(돌아서는 내 등 뒤에서 그녀가 작게 말했다. 해는 내일도 져요. 오늘 해는 하나뿐이지만요.)',
        "…Right. That happens. (She watched the sun go down alone. That day doesn't come back.)\n\n(As I turned away, I heard her say softly: the sun goes down tomorrow too. It's just that there's only one today.)",
      ],
    },
    completeAdd: [
      d('coffee', '오늘 앉은 값은 커피 한 잔이면 됩니다.', "A cup of coffee covers today's sitting.",
        '커피요? …호텔 커피 비싼 거 알아요? (입꼬리가 조금 올라간다.)\n\n그럼 커피값이에요. 남으면 내일 아침도 사 드세요. 오늘 옆에 있어 준 건 커피로는 못 갚지만요. (커피값이라며 봉투를 내민다. 커피 몇 잔 값은 넉넉히 넘는다.)',
        "Coffee? …You know what hotel coffee costs? (The corner of her mouth lifts a little.)\n\nThen it's coffee money. Buy breakfast tomorrow with what's left. Not that coffee pays for sitting beside me today. (She holds out an envelope — coffee money, she says. It's well over a few cups' worth.)",
        { payMult: 0.5, affinity: 0.04 }),
    ],
    completeReply: {
      stay: [
        '…또 다투면요? 농담이에요. (호텔 직원 할인권 한 장이 조용히 온다.)\n\n…반은 농담이고요. 다투는 날은 또 와요. 그날 방파제에 누가 앉아 있으면 혼자 해 지는 걸 안 봐도 되잖아요. 그거면 돼요.',
        "…Even if we argue again? Joking. (A staff discount voucher arrives quietly.)\n\n…Half joking. Days with fights come round again. If someone's sitting on the breakwater one of those days, I won't have to watch the sun go down alone. That's all I need.",
      ],
      ask: [
        '…캠핑카 때문에요. 정우미라고. 다음에 소개할게요. (그 이름을 말할 때 목소리가 조금 낮아진다.)\n\n오늘은 거기까지만요. 말하기 시작하면 또 다툰 얘기가 되니까. 그래도 물어봐 줘서… 조금 가벼워졌어요.',
        "…The camper van. Jeong Umi. I'll introduce you sometime. (Her voice drops a little on the name.)\n\nThat's as far as I'll go today. If I start, it turns into the fight all over again. But you asked, and… it feels a little lighter.",
      ],
      nothing: [
        '그렇죠. 오늘이 그런 날. (웃는다. 처음이다.)\n\n호텔에선 매일 뭔가를 채워야 해요. 방도, 웃음도, 숫자도. 아무것도 안 잡혀도 되는 날이 있다는 게… 오늘은 그게 좋았어요.',
        "It is. Today was one. (She laughs. First time.)\n\nAt the hotel something always has to be filled. Rooms, smiles, numbers. A day where nothing has to be caught… today, that was nice.",
      ],
    },
  },

  // ── N12-2 「잔잔함」 · 정우미 ──
  'N12-2': {
    offer: [
      d('warm_guide', '따뜻하게 하겠습니다. 갈치는 제가 책임지겠습니다.', "Warm it is. I'll take care of the hairtail.",
        '갈치만 책임져요. 사람은 책임지지 마요. 그건 그 사람들 몫이에요. (캠핑카 문을 열고 보온병 두 개를 꺼낸다.)\n\n하나는 그 사람들 거, 하나는 우리 거. 밤바다 추워요. 추우면 말이 날카로워지거든요. 그래서 따뜻하게 하라는 거예요.',
        "Just take care of the hairtail. Don't take charge of the people. That's their part. (She opens the camper door and takes out two flasks.)\n\nOne's for them, one's for us. The night sea's cold. When people get cold, their words get sharp. That's why I said keep it warm.",
        { affinity: 0.05 }),
      d('ask_couple', '화해든 이별이든이라니, 어떤 커플입니까?', "Making up or breaking up — what kind of couple is this?",
        '본인들도 모른대요. 그래서 밤바다를 신청했대요. 낮에는 서로 얼굴이 너무 잘 보인다고. (웃음인지 한숨인지 모를 숨을 쉰다.)\n\n밤바다엔 그런 사람들이 와요. 갈치 보러 왔다가 서로를 보고 가요. 우리는 결론에 손대지 않아요. 불만 켜 주는 거예요.',
        "They don't know themselves. That's why they asked for the night sea. In daylight they can see each other's faces too clearly, they said. (She breathes out — a laugh or a sigh, I can't tell.)\n\nPeople like that come to the night sea. They come to see hairtail and end up seeing each other. We don't touch the conclusion. We just turn the lights on.",
        { affinity: 0.04, flag: 'choice.n12_2_asked_couple' }),
      d('awkward', '남의 연애에 끼는 건 좀… 어색할 것 같습니다.', "Getting in the middle of someone's relationship feels… awkward.",
        '끼지 마요. 옆에만 있어요. 갈치 올라오면 우와, 하고 웃기만 하면 돼요. (손가락으로 집어등 스위치를 톡 친다.)\n\n어색한 건 그 사람들이 더해요. 우리가 편하면 그 사람들도 조금 편해져요. 좁은 데서는 그게 다 옮아요. 캠핑카 살아 보면 알아요.',
        "Don't get in the middle. Just be beside them. When a hairtail comes up, go wow and smile. (She taps the switch of the fish lamp with a finger.)\n\nThey're more awkward than you. If we're at ease, they ease up a little too. In small spaces, that spreads. Live in a camper and you'll know.",
        { affinity: 0.03 }),
      d('joke_double', '갈치 두 마리면, 한 사람에 한 마리씩입니까?', "Two hairtail — one each, then?",
        '오, 그거 좋네요. 헤어져도 한 마리씩, 화해해도 한 마리씩. 어느 쪽이든 공평하잖아요. (진심으로 감탄한 얼굴이다.)\n\n그 말, 그 사람들 앞에서는 하지 마요. 저만 들을게요. 갈치는 해 지고 나서예요. 그 전엔 커피나 마셔요.',
        "Oh, I like that. Split up, one each. Make up, one each. Fair either way. (She looks genuinely impressed.)\n\nDon't say it in front of them, though. That one's just for me. Hairtail come after sunset. Until then, have some coffee.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('hairtail_depth', '갈치 수심이 밤새 바뀌더군요. 맞추는 요령이 있습니까?', "The hairtail's depth kept changing all night. Is there a trick to keeping up?",
        '있어요. 밤이 깊어질수록 위로 올라와요. 입질이 끊기면 찌 밑 수심을 한 뼘씩 줄여요. (캠핑카에서 찌 하나를 꺼내 멈춤 매듭을 옮겨 보인다.)\n\n갈치는 쫓는 게 아니라 기다리는 거예요. 층만 맞으면 와요. 사람도 그렇고요. (밤 갈치 채비가 손에 익는다.)',
        "There is. The deeper the night, the higher they come. When the bites stop, take the float's depth up a hand's width at a time. (From the camper she brings out a float and slides the stop knot to show me.)\n\nYou don't chase hairtail. You wait for them. Get the depth right and they come. People are the same. (Night hairtail rigs settle into my hands.)",
        { proficiency: { category: 'fishing', xp: 24 }, affinity: 0.05 }),
    ],
    completeReply: {
      lesson: [
        '그렇죠? 좁은 데 사는 법은 다 같아요. (배 위 수납이 달라진다.)\n\n자주 쓰는 건 손 닿는 데, 젖으면 안 되는 건 높은 데, 무거운 건 바닥에. 그리고 하나 들이면 하나 내보내요. 안 그러면 좁은 데가 금방 숨 막혀요.',
        "Right? Living small is the same everywhere. (Stowage aboard changes.)\n\nWhat you use often within reach, what mustn't get wet up high, heavy things on the floor. And one thing in, one thing out. Otherwise a small space chokes you fast.",
      ],
      pay: [
        '당연하죠. 커플이 냈어요. (봉투가 두툼하다. 팁이 들어 있다.)\n\n팁은 그 사람들이 넣은 거예요. 갈치값이 아니라 밤값이래요. 어떻게 끝났는지는 저도 몰라요. 그래도 팁을 주고 간 사람들은 대개 괜찮아요.',
        "Of course. The couple paid. (The envelope is thick. There's a tip in it.)\n\nThe tip's from them. Not for the hairtail, for the night, they said. I don't know how it ended either. But people who leave a tip are usually all right.",
      ],
      decline: [
        '…그 말 좋네요. 캠핑카 문 늘 열려 있어요. (여수 밤바다에 내 자리가 생긴다.)\n\n잔잔한 밤이면 됐다는 사람, 드물어요. 다들 뭔가 남기고 싶어 하거든요. 사진이든 고기든. 아무것도 안 남겨도 되는 밤이 제일 오래 남아요.',
        "…I like that. The camper door is always open. (I have a place on the Yeosu night water.)\n\nPeople who say a calm night was enough are rare. Everyone wants to take something home. Photos, fish. The nights you don't need to keep anything from stay with you longest.",
      ],
    },
  },

  // ── N13-1 「마감 도주」 · 마감기 (once — 미루기 답은 나레이션에 있다) ──
  'N13-1': {
    offerAdd: [
      d('ask_deadline', 'PD가 쫓아온다니, 마감이 얼마나 남았습니까?', "The producer's after you — how long till the deadline?",
        '어제요. 마감은 어제였어요. 오늘은 연장이고, 내일은 사과문이에요. (휴대폰이 울린다. 마감기가 화면도 안 보고 뒤집어 놓는다.)\n\n그래서 배가 필요해요. 배 위까지는 PD가 못 와요. 전화는 와도 못 들은 척할 수 있고요. 거기선 그리는 것밖에 할 게 없어요. 그게 제 유일한 마감 비법이에요.',
        "Yesterday. The deadline was yesterday. Today's the extension, tomorrow's the apology. (The phone buzzes. The writer turns it face down without looking.)\n\nThat's why I need a boat. The producer can't follow me out to sea. Calls still come, but I can pretend I didn't hear. Out there all I can do is draw. That's my only deadline secret.",
        { affinity: 0.04, flag: 'choice.n13_1_asked_deadline' }),
      d('joke_accomplice', '도주는 돕겠습니다. 대신 공범으로 제 이름은 빼 주십시오.', "I'll help you run. Just leave my name out as an accomplice.",
        '공범이요? 아니죠, 선장님이죠. 저는 손님이고요. 손님이 배에서 뭘 하든 그건 손님 사정이잖아요. (확신에 찬 얼굴인데 근거는 없어 보인다.)\n\n이름은 안 넣을게요. 대신 콘티 구석에 선장 하나 그려 넣을지도 몰라요. 그 정도는 봐줘요.',
        "Accomplice? No — skipper. I'm a passenger. Whatever a passenger gets up to aboard is the passenger's business, right? (The writer looks very sure, with no visible grounds.)\n\nI'll leave your name out. I might draw a skipper in the corner of a board, though. Let me have that much.",
        { affinity: 0.02 }),
    ],
    offerReply: {
      go: [
        '살았다! 고마워요!\n\n구명조끼는 어디 있어요? 아, 입을게요. 마감보다 목숨이 먼저라고 PD가 그랬어요. 마감 지키라는 말 다음으로 제일 많이 한 말이에요.',
        "Saved! Thank you!\n\nWhere's the life jacket? Ah — I'll wear it. My producer says life comes before deadlines. Right after keep your deadline, it's what I hear most.",
      ],
      decline: [
        '…네. PD한테 잡혔어요. 마감은 지켰지만요. (그 배는 그날 뜨지 않았다.)\n\n(작업실로 끌려가는 뒷모습이 이상하게 홀가분해 보였다. 그날은 콘티 한 장에도 먹물이 튀지 않았다.)',
        "…Right. My editor caught me. I made the deadline, though. (That boat didn't sail that day.)\n\n(Walking off toward the studio, the writer looked oddly relieved from behind. That day no ink splashed on a single board.)",
      ],
    },
    completeAdd: [
      d('in_boards', '이번 콘티에 제가 나옵니까?', "Am I in these boards?",
        '나오죠! 갑오징어가 먹물 쏘는 컷, 맞는 사람 역이에요. 독자들이 그런 컷 좋아해요. (먹물 튄 장을 넘겨 보여 준다. 구석에 내 얼굴이 작게 있다.)\n\n이름은 안 넣었어요. 넣어도 돼요? 아니, 물어보고 넣을게요. 마감 지킨 사람은 그런 거 물어보거든요.',
        "You are! The cuttlefish-squirts-ink panel — you're the one who gets hit. Readers love that kind of panel. (The writer flips to the inked page. My face is small in one corner.)\n\nI didn't put your name in. Can I? No — I'll ask first. People who've made a deadline ask about that sort of thing.",
        { affinity: 0.06, flag: 'choice.n13_1_in_boards' }),
    ],
    completeReply: {
      pay: [
        '당연하죠! 원고료에서! (아직 안 받은 원고료라 지금은 반이다.)\n\n원고료는 늘 늦게 와요. 마감은 빨리 오는데. 세상이 공평하지 않아요. 그래도 반이라도 드려야 공범이 입을 다물죠.',
        "Of course! Out of the manuscript fee! (He hasn't been paid yet, so it's half for now.)\n\nManuscript fees always come late. Deadlines always come early. The world isn't fair. Still, pay the accomplice at least half and the accomplice keeps quiet.",
      ],
      lesson: [
        '흔들리는 데서 그리면 손이 덜 떨려요. 이상하죠. (파이팅 중 손이 덜 떨린다.)\n\n땅에선 손이 떨리면 내 탓이에요. 배에선 배 탓을 할 수 있으니까 힘이 빠져요. 힘 빠진 손이 제일 정확해요. 낚싯대도 그럴 거예요.',
        "Drawing on a moving deck makes my hand shake less. Strange, isn't it. (My hands shake less during a fight.)\n\nOn land, if my hand shakes it's my fault. On a boat I can blame the boat, so I relax. A relaxed hand is the most accurate. I bet a rod works the same way.",
      ],
      decline: [
        '…그 말, 편집자한테 들은 적 없어요. (책 첫 장에 내 이름이 들어간다.)\n\n편집자는 마감이 끝나면 다음 마감 얘기부터 해요. 끝났으면 됐다는 말은 처음이에요. 그 말, 책 첫 장에 넣을게요. 이번엔 물어보고요.',
        "…No editor has ever said that to me. (My name goes on the first page of the book.)\n\nEditors start on the next deadline the moment one's done. Nobody's ever told me done is enough. That goes on the first page. I'm asking this time.",
      ],
    },
  },

  // ── N13-2 「두고 온 것」 · 송기백 ──
  'N13-2': {
    offer: [
      d('help_search', '같이 찾겠습니다. 어디부터 뒤지면 되겠습니까?', "I'll help you look. Where should I start?",
        '조타실부터. 아니, 기관실. 아니… 다 뒤져. 나도 어디 뒀는지 몰라. 그래서 평생 찾은 거야. (노인이 손전등을 건넨다. 불빛이 약하다.)\n\n갯가도 봐. 바람 센 날 문이 열려서 날아갔을지도 몰라. 젖었어도 괜찮아. 얼굴만 보이면 돼.',
        "The wheelhouse first. No, the engine room. No… search all of it. I don't know where I put it either. That's why it took a lifetime. (The old man hands me a torch. The beam is weak.)\n\nCheck the shore too. On a windy day the door might have blown open and sent it out. Wet is fine. As long as the faces show.",
        { affinity: 0.05 }),
      d('ask_cleanup', '방제 봉사라면, 그때 이 바다에 무슨 일이 있었습니까?', "A cleanup drive — what happened to this sea back then?",
        '기름이 왔어. 시커멓게. 갯벌도 바위도 다. (노인이 손바닥을 펴 본다. 오래 문지른 손이다.)\n\n전국에서 사람들이 왔지. 걸레랑 양동이 들고. 바위를 하나씩 닦았어. 그때 다 같이 찍은 사진이야. 그 얼굴들이 보고 싶어서 찾는 거야.',
        "Oil came. Black. Over the flats, over the rocks, everything. (The old man opens his palm and looks at it. A hand that has scrubbed a long time.)\n\nPeople came from all over the country. With rags and buckets. We wiped the rocks one by one. That's when we all had our picture taken. I'm looking for it because I want to see those faces.",
        { affinity: 0.05, flag: 'choice.n13_2_asked_cleanup' }),
      d('doubt_find', '평생 못 찾으신 걸, 제가 찾을 수 있을까요?', "If you couldn't find it in a lifetime, can I?",
        '내가 못 찾은 건 눈이 늙어서야. 자네 눈은 젊지. (헛웃음을 한 번 짓는다.)\n\n그리고 혼자 찾는 거랑 둘이 찾는 건 달라. 혼자면 찾다가 그만두는데, 둘이면 그만두자는 말을 서로 못 해. 그러니까 찾아질 거야.',
        "I couldn't find it because my eyes are old. Yours are young. (He gives one dry laugh.)\n\nAnd looking alone isn't looking with two. Alone, you give up partway. With two, neither can bring himself to say let's stop. So it'll turn up.",
        { affinity: 0.03 }),
      d('joke_house', '배가 집이면, 집 안에서 물건을 잃어버리신 거네요.', "If the boat's your house, you've lost something in your own house.",
        '…그렇지. 늙으면 집이 제일 넓어. (어깨를 들썩이며 웃는다.)\n\n이 배는 칸이 많아. 그물 넣던 칸, 얼음 넣던 칸. 버린 배에도 자리는 그대로 남아 있지. 그 어느 칸에 있을 거야. 천천히 찾아.',
        "…That's right. When you're old, home's the biggest place there is. (His shoulders shake as he laughs.)\n\nThis boat has a lot of holds. One for nets, one for ice. A scrapped boat keeps all its places. It's in one of them. Take your time.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('no_charge', '찾아 드린 값은 됐습니다. 사진이 주인한테 돌아갔으니까요.', "No charge for finding it. The photo's back with its owner.",
        '…값을 안 받으면 늙은이가 빚을 지는 거야. (사진을 가슴께에 대고 오래 서 있다.)\n\n그럼 빚으로 두지. 갚을 날이 오겠지. 신진도 사람들은 빚진 걸 안 잊어. (신진도 부두 노인들 사이에 내 이름이 오르내린다.)',
        "…If you won't take payment, the old man's left in debt. (He stands a long time with the photo held to his chest.)\n\nThen let it stand as a debt. The day will come to repay it. Sinjindo people don't forget what they owe. (My name starts coming up among the old men on the Sinjindo quay.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      share: [
        '…보여 줘. (노인이 오래 본다. 그러고는 자기 사진 옆에 놓는다.)\n\n천막 앞에 선 꼬마가 자네구먼. 사진은 남는 사람 거야. 자네 사진도 언젠가 누가 오래 볼 거야. 그러니까 버리지 마.',
        "…Show me. (The old man looks a long time. Then he sets it beside his own.)\n\nSo the little one by the awning is you. A photo belongs to whoever's left. Someday someone will look at yours a long while too. So don't ever throw it away.",
      ],
      lesson: [
        '배는 버려도 집이 돼. (선박 살림이 손에 붙는다.)\n\n물 새는 데부터 막고, 바람 드는 데는 그다음. 배는 원래 물을 막으려고 만든 거라 조금만 손보면 집보다 따뜻해. 사람이 살면 배도 덜 늙어.',
        "A boat can be abandoned and still be a house. (Living aboard settles into my hands.)\n\nStop the leaks first, then the draughts. A boat's made to keep water out, so with a little work it's warmer than a house. When someone lives in her, a boat ages slower too.",
      ],
      pay: [
        '…그러세. 늙은이 돈. (동전까지 세서 준다.)\n\n받을 건 받아야지. 자네도 먹고살아야 하니까. 동전은 세다 보면 손이 따뜻해져. 늙은이가 셀 게 그것밖에 없어서 그래.',
        "…Do. An old man's money. (He counts it out down to the coins.)\n\nWhat's owed should be taken. You've a living to make too. Counting coins warms the hands. It's about all an old man has left to count.",
      ],
    },
  },

  // ── N14-1 「첫 로케」 · 유리아 ──
  'N14-1': {
    offer: [
      d('steady_her', '떨리셔도 괜찮습니다. 방어는 제가 프레임 안으로 넣겠습니다.', "Nerves are fine. I'll get the yellowtail into frame.",
        '그 말 든든하네요. 진짜로요. (대본을 말아 쥔 손에 힘이 들어간다.)\n\n저는 카메라 앞에서 웃기만 할게요. 방어는 뒤에서 낚아서, 신호하면 건네줘요. 너무 빨리는 말고요. 시청자는 기다리는 걸 좋아해요. 잡히기 직전이 제일 재밌거든요.',
        "That's reassuring. Really. (Her grip tightens on the rolled-up script.)\n\nI'll just smile for the camera. You land the yellowtail behind me and pass it over when I signal. Not too quickly. Viewers like to wait. The moment before the catch is the best part.",
        { affinity: 0.05 }),
      d('ask_location', '로케라는 게, 방송국 밖에서 찍는 걸 말하는 겁니까?', "A location shoot — that means filming outside the studio?",
        '네, 스튜디오 밖이요. 조명도 대본도 바다 마음대로인 데서 찍는 거예요. (휴대폰으로 날씨를 한 번 더 확인한다.)\n\n오랫동안 스튜디오 의자에만 앉아 있었어요. 아니, 그 의자도 없어진 지 좀 됐네요. 그러니까 이번이 첫 로케예요. 다시 시작하는 첫 번째요.',
        "Yes, outside the studio. Filming where the light and the script both belong to the sea. (She checks the weather on her phone one more time.)\n\nFor a long time I only sat in a studio chair. Well — that chair's been gone a while now too. So this is my first location shoot. The first one of starting over.",
        { affinity: 0.04, flag: 'choice.n14_1_asked_location' }),
      d('camera_shy', '저는 카메라 앞에 서는 건 자신이 없습니다.', "I'm not much good in front of a camera.",
        '안 서도 돼요. 손만 나와요. 방어 건네주는 손. 시청자는 그 손을 낚시꾼이라고 생각할 거예요. (내 손을 보더니 고개를 끄덕인다.)\n\n좋은 손이네요. 굳은살이 있어요. 그런 손은 화면에서 거짓말을 안 해요. 얼굴은 제가 맡을게요. 그건 제 일이니까.',
        "You don't have to. Only your hands will show. The hands passing the yellowtail. Viewers will take those hands for the angler. (She looks at my hands and nods.)\n\nGood hands. Calluses. Hands like that don't lie on screen. I'll handle the face. That's my job.",
        { affinity: 0.03 }),
      d('joke_washed', '한물갔다는 말, 오늘 방어로 뒤집어 보시죠.', "Washed up, they say — let's flip that with a yellowtail today.",
        '…대놓고 하네요. 다들 뒤에서 하는 말인데. (잠깐 굳었다가 웃음이 터진다.)\n\n좋아요, 뒤집어 보죠. 방어는 뒤집으면 배가 하얗잖아요. 그 하얀 배가 화면에 제일 잘 받아요. 오늘은 그걸로 가요.',
        "…You say it to my face. Everyone else says it behind my back. (She freezes for a beat, then bursts out laughing.)\n\nFine, let's flip it. Flip a yellowtail and its belly's white, right? That white belly looks best on screen. That's our shot today.",
        { affinity: 0.01 }),
    ],
    completeAdd: [
      d('why_camera', '다시 카메라 앞에 서기로 하신 이유, 여쭤봐도 됩니까?', "May I ask why you decided to stand in front of a camera again?",
        '…한물갔다는 말, 들었죠? 맞아요. 그래서요. 한물간 사람도 한 번은 더 서 봐야, 어디까지 갔는지 알잖아요. (방어를 들었던 손을 내려다본다.)\n\n오늘 보니까 아직 덜 갔네요. 조금 남았어요. 그거면 돼요. (대본 뒷면에 오늘 날짜를 적고 동그라미를 친다.)',
        "…You've heard them call me washed up? They're right. That's why. Even someone washed up has to stand there one more time to find out how far gone they are. (She looks down at the hands that held the yellowtail.)\n\nToday says not that far yet. A little left. That's enough. (On the back of the script she writes today's date and circles it.)",
        { affinity: 0.06, flag: 'choice.n14_1_why_camera' }),
    ],
    completeReply: {
      real_smile: [
        '…어떻게 알았어요. (방송 출연료를 준다. 자기 몫에서.)\n\n방송 웃음은 입이 먼저 웃어요. 진짜는 눈이 먼저고요. 오래 입으로만 웃었는데, 오늘은 저도 모르게 눈이 먼저 갔네요. 비밀로 해 줘요.',
        "…How did you know. (She pays me an appearance fee. Out of her own share.)\n\nA broadcast smile starts at the mouth. A real one starts at the eyes. I smiled with my mouth for a long time, and today my eyes went first without my noticing. Keep it a secret.",
      ],
      lesson: [
        '삼분할이에요. 사람은 왼쪽. (사진과 방송에 대한 감각이 생긴다.)\n\n화면을 가로세로 세 칸씩 나눠서, 선이 만나는 데 얼굴을 둬요. 한가운데는 심심해요. 바다는 아래 삼분의 일, 하늘은 위 삼분의 이. 그것만 지켜도 그림이 돼요.',
        "Rule of thirds. People on the left. (I get a feel for photographs and broadcasting.)\n\nSplit the screen into three both ways and put the face where the lines cross. Dead centre is dull. Sea in the bottom third, sky in the top two. Keep just that and you've got a picture.",
      ],
      decline: [
        '…그 말 방송에 넣어도 돼요? 아니요, 안 넣을게요. 제가 가질래요. (제주 방송국 사람들이 나를 안다.)\n\n방송에 넣으면 다들 갖게 되잖아요. 이건 저 혼자 갖고 싶어요. 대신 오늘 촬영 보조 이름은 크게 넣을게요. 그건 방송이니까요.',
        "…Can I put that on air? No — I won't. I'll keep it. (The Jeju broadcast people know me.)\n\nPut it on air and everyone gets to keep it. This one I want for myself. I'll put your name in the credits big, though, as shoot assistant. That part's broadcasting.",
      ],
    },
  },

  // ── N14-2 「버린 꿈」 · 오세린 ──
  'N14-2': {
    offer: [
      d('find_her', '찾아보마. 말은 안 걸고, 옆에서 낚시만 하겠다.', "I'll find her. I won't talk to her. I'll just fish nearby.",
        '네, 말 걸면 가 버려요. 걔는 그래요. (안도한 얼굴로 숨을 내쉰다.)\n\n무늬오징어는 가을 밤에 얕은 데 붙어요. 거기서 에기 던지고 있으면 마라도 그냥은 못 지나칠 거예요. 걔 손이 근질근질할 테니까요.',
        "Right — talk to her and she'll leave. That's her. (She lets out a breath, relieved.)\n\nBigfin reef squid hang in the shallows on autumn nights. If you're there casting an egi, Mara won't be able to just walk past. Her hands will be itching.",
        { affinity: 0.05 }),
      d('ask_mara', '마라가 누군데? 왜 너를 안 만나 주는데?', "Who's Mara? Why won't she see you?",
        '친구요. 저처럼 대회가 꿈이었던 애. 걔가 먼저 그만뒀어요. 서귀포 갯바위에 자주 앉아 있다는 얘기만 들었어요. (발끝으로 돌멩이를 굴린다.)\n\n왜 그만뒀는지는 저도 몰라요. 물어보면 더 멀리 가요. 그래서 이제 안 물어요. 가서 그냥 봐 줘요. 걔가 아직 바다를 보는지.',
        "My friend. A tournament was her dream too, like mine. She quit first. All I've heard is she sits out on the Seogwipo rocks a lot. (She rolls a pebble with the toe of her shoe.)\n\nI don't know why she quit either. Ask and she goes further away. So I don't ask any more. You go and just look, please. Whether she still looks at the sea.",
        { affinity: 0.04, flag: 'choice.n14_2_asked_mara' }),
      d('you_go', '네가 직접 가는 게 낫지 않겠어?', "Wouldn't it be better if you went yourself?",
        '제가 가면 걔가 일어나서 가요. 그건 알아요. (입술을 깨문다.)\n\n그쪽은 모르는 사람이잖아요. 모르는 사람이 옆에서 오징어 낚는 건 괜찮을 거예요. 걔도 혼자 있고 싶은 건 아닐 거예요. 저랑만 있기 싫은 거지.',
        "If I go, she gets up and leaves. That much I know. (She bites her lip.)\n\nYou're a stranger to her. A stranger fishing for squid nearby should be all right. I don't think she wants to be alone. She just doesn't want to be with me.",
        { affinity: 0.02 }),
      d('joke_hook', '오징어 낚는 김에 사람도 낚아 오라는 거구나.', "So I'm to hook a person while I'm at it with the squid.",
        '낚는 거 아니에요! 그냥 있어 주는 거예요. 마라는 미끼 안 물어요, 절대. (뾰로통했다가 금방 풀린다.)\n\n…근데 맞아요, 조금은 그거예요. 에기 떨어지는 소리 들으면 걔 고개가 돌아갈 거예요. 거기까지만요. 그다음은 걔 마음이에요.',
        "It's not hooking! It's just being there. Mara never takes bait. Never. (She pouts, then softens right away.)\n\n…Okay, it's a little bit that. When she hears an egi land, her head will turn. That's all I want. After that, it's up to her.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('come_along', '찾아 준 값은 됐다. 다음엔 네가 같이 가.', "No fee. Next time, you come with me.",
        '…같이요? 걔가 안 만나 준다니까요. (에기 끝을 손톱으로 긁는다.)\n\n…그래도 에기를 안 버렸잖아요. 그럼 저도 한 번은 더 가 볼래요. 멀리서라도요. (서귀포 갯바위 꾼들 사이에 세린의 친구를 찾아 준 사람으로 내 이름이 돈다.)',
        "…With you? I told you, she won't see me. (She scratches at the tip of the egi with a fingernail.)\n\n…But she didn't throw the egi away. So I'll try once more too. Even from a distance. (Among the Seogwipo rock anglers, my name goes round as the one who found Serin's friend.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      give_egi: [
        '…(세린이 에기를 오래 본다. 그러고는 다시 내게 준다. 다음에 마라한테 돌려주라고.)\n\n제가 주면 안 받을 거예요. 그쪽이 주면 받을지도 몰라요. 색이 다 바랬네요. 그동안 계속 갖고 있었나 봐요.',
        "…(Serin looks at it a long time. Then she gives it back to me. To return to Mara next time.)\n\nShe won't take it from me. She might from you. The colour's all faded. She must have kept it all this time.",
      ],
      lesson: [
        '마라는 천재예요. 저는 노력이고. (에깅 폴링을 흉내 내다 조금 나아진다.)\n\n걔 폴링은 에기가 내려가는 동안 줄을 안 잡아요. 손가락에 얹어만 둬요. 저는 그게 무서워서 자꾸 잡고요. 천재는 안 무서워하는 사람이에요.',
        "Mara's a genius. I'm effort. (Imitating her fall makes me a little better.)\n\nWhile the egi sinks, she doesn't grip the line. She just rests it on a finger. That scares me, so I keep gripping. A genius is someone who isn't scared.",
      ],
      pay: [
        '…네. 대회 상금에서요. (아직 상금이 없다. 용돈이다.)\n\n에기 사려고 모은 용돈이에요. …괜찮아요. 또 모으면 돼요. 찾아 준 사람한테는 줘야죠.',
        "…Yes. Out of the prize money. (There's no prize money yet. It's pocket money.)\n\nI was saving it for egi. …It's fine. I can save again. The person who found her should get paid.",
      ],
    },
  },

  // ── N14-3 「팀」 · 오세린 ──
  'N14-3': {
    offer: [
      d('join_team', '좋다. 팀원으로 끝까지 같이 하마.', "Good. I'm with the team, start to finish.",
        '팀원! 그 말 듣고 싶었어요! (등록 서류를 흔든다. 이름 칸 셋 중에 하나가 아직 연필 글씨다.)\n\n훈련은 지깅이에요. 메탈지그 내리고 저킹, 저킹. 셋이 같은 박자로 해야 해요. 마라 자리는 비워 둘게요. 오든 안 오든요.',
        "Team member! I wanted to hear that! (She waves the registration form. Of the three name boxes, one is still in pencil.)\n\nThe drill is jigging. Drop the metal jig and jerk, jerk. All three of us on the same beat. I'll keep Mara's spot open. Whether she comes or not.",
        { affinity: 0.05 }),
      d('ask_youth', '청년부? 나도 청년부에 들어가도 되는 거야?', "Youth division? Am I even allowed in the youth division?",
        '돼요! 규정 다 읽었어요. 나이 칸에 들어가요. 서류로도 청년이에요. (규정집 한 줄에 형광펜이 그어져 있다.)\n\n감독은 유리아 언니가 해 주기로 했어요. 이름만요. 언니 말로는 이름만 빌려줘도 감독이래요.',
        "You are! I read all the rules. Your age fits. On paper you're youth too. (One line of the rulebook is highlighted.)\n\nRia agreed to be our manager. In name only. She says lending your name still makes you the manager.",
        { affinity: 0.04, flag: 'choice.n14_3_asked_youth' }),
      d('ask_mara_come', '마라가 온다고 했어? 아마라는 건 무슨 뜻이야?', "Did Mara say she'd come? What does probably mean?",
        '말은 안 했어요. 근데 등록 서류를 문자로 보냈더니… 읽음 표시가 떴어요. (휴대폰 화면을 보여 준다. 답장은 없다.)\n\n걔는 싫으면 안 읽어요. 읽었다는 건 반은 온다는 거예요. 제 계산으로는요. 그래서 아마예요. 반올림하면 와요.',
        "She didn't say. But I texted her the registration form and… it shows as read. (She shows me her phone. No reply.)\n\nIf she doesn't want something, she doesn't open it. Read means half coming. By my maths. So, probably. Round it up and she's coming.",
        { affinity: 0.03, flag: 'choice.n14_3_asked_mara' }),
      d('off_beat', '셋이 박자를 맞춘다니, 나 때문에 틀리면 어쩌지.', "All three on one beat — what if I'm the one who throws it off?",
        '틀려도 돼요. 처음엔 다 달라요. 원래 그래요. (손목을 털며 저킹 시늉을 해 보인다.)\n\n박자는 맞추는 게 아니라 맞아지는 거예요. 세 번째쯤 되면 손이 알아서 해요. 그러니까 일단 와요.',
        "It's fine to be off. Everyone's different at first. That's normal. (She shakes out her wrist and mimes a jerk.)\n\nYou don't match a rhythm, it matches itself. Around the third fish your hands just do it. So just come.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('team_member', '나는 팀원이지 코치가 아니다. 돈은 됐다.', "I'm a team member, not a coach. Keep the money.",
        '팀원! 그 말 좋아요. (등록 서류를 다시 펴서 내 이름 옆에 동그라미를 친다.)\n\n마라한테도 말해 줄래요? 아니, 제가 할게요. 팀원은 팀원끼리 말하는 거니까요. (제주 청년부 대회 쪽 사람들 사이에 내 이름이 알려진다.)',
        "Team member! I like that. (She unfolds the registration form again and circles my name.)\n\nWill you tell Mara too? No — I'll do it. Team members talk to team members. (My name gets known among the Jeju youth-division crowd.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      rhythm: [
        '맞았죠! (팀 유니폼을 하나 준다. 등번호 3.)\n\n3번은 세 번째에 맞아서 3번이에요. 1번은 저, 2번은 마라. 마라는 아직 안 입었지만 가방에 넣는 건 봤어요. 그럼 입은 거예요.',
        "It did! (She gives me a team shirt. Number 3.)\n\nNumber 3 because it came together on the third. I'm 1, Mara's 2. Mara hasn't put hers on yet, but I saw it go in her bag. That counts as wearing it.",
      ],
      lesson: [
        '저요? 제가 가르쳐요? …좋아요. 이 박자로. (지깅 리듬이 몸에 붙는다.)\n\n하나에 들고, 둘에 감고, 셋에 떨어뜨려요. 지그는 떨어질 때 물려요. 다들 들 때만 신경 쓰는데, 진짜는 떨어질 때예요.',
        "Me? Teach you? …All right. On this beat. (The jigging rhythm settles into my body.)\n\nLift on one, wind on two, drop on three. The jig gets hit on the drop. Everyone only thinks about the lift, but the real thing is the fall.",
      ],
      pay: [
        '코치… 유리아 언니가 감독인데. (유리아가 대신 준다. 방송국 돈으로.)\n\n언니 말로는 이건 취재비래요. 우리 훈련을 찍어서 방송에 낼지도 모른대요. 그럼 그쪽도 나와요. 코치로요.',
        "Coach… Yuria is the manager, though. (Yuria pays instead. With broadcaster money.)\n\nRia says it's an interview fee. She might film our training for broadcast. Then you'd be on too. As coach.",
      ],
    },
  },

  // ── N14-4 「결선」 · 오세린 ──
  'N14-4': {
    offer: [
      d('finish_all', '완주하자. 셋 다, 끝까지.', "Let's finish. All three of us, to the end.",
        '네! 셋 다요! (주먹을 쥐었다 편다. 손바닥에 땀이 배어 있다.)\n\n한치는 밤에 집어등 켜고요. 순위표는 보지 마요. 보면 손이 빨라지고, 빨라지면 꼬여요. 세 마리만 올리면 완주예요. 그게 오늘 우리 규칙이에요.',
        "Yes! All three! (She makes a fist and opens it. Her palm is damp.)\n\nSwordtip squid at night, lamps on. Don't look at the leaderboard. Look and your hands speed up, and fast hands tangle. Three squid and we've finished. That's our rule tonight.",
        { affinity: 0.05 }),
      d('ask_own_name', '마라가 자기 이름으로 등록했다는 게, 무슨 뜻이야?', "Mara registered under her own name — what does that mean?",
        '팀 훈련 때는 제가 다 써 줬거든요, 걔 이름. 결선은 본인이 직접 써야 해요. (등록 명단을 손가락으로 짚는다. 삐뚤빼뚤한 글씨가 하나 있다.)\n\n걔가 직접 썼어요. 자기 손으로. 그 칸이 비어 있을까 봐 며칠 동안 잠을 못 잤어요. 이제 잘 수 있어요. 결선 끝나고요.',
        "For the team drills I always wrote her name for her. For the final you have to sign it yourself. (She points at the entry list. One line is in shaky handwriting.)\n\nShe wrote it. With her own hand. I couldn't sleep for days, scared that box would stay empty. Now I can sleep. After the final.",
        { affinity: 0.04, flag: 'choice.n14_4_asked_name' }),
      d('want_win', '순위가 상관없다니. 결선인데 이기고 싶지 않아?', "Placing doesn't matter? It's the final — don't you want to win?",
        '이기고 싶죠! 엄청요! (너무 빨리 대답해서 스스로도 웃는다.)\n\n근데 오늘은 셋이 다 끝까지 던지는 게 이기는 거예요. 한 명이라도 중간에 그만두면 일등을 해도 진 거고요. 그건 제가 정했어요. 대회 규정 말고 우리 규정으로요.',
        "Of course I do! Badly! (She answers so fast she laughs at herself.)\n\nBut today, all three of us casting to the end is the win. If even one quits halfway, first place is still a loss. I decided that. Not the tournament's rules — ours.",
        { affinity: 0.03 }),
      d('nervous', '결선이라니 나까지 떨린다.', "A final — even I'm nervous.",
        '그쪽도요? 다행이다, 저만 떨리는 줄 알았어요. (어깨에서 힘이 조금 빠진다.)\n\n유리아 언니가 그랬어요. 떨리는 건 아직 진심이라는 뜻이래요. 그러니까 떨어도 돼요. 한치 세 마리만 올려요, 떨면서.',
        "You too? Phew — I thought it was just me. (Some of the tension goes out of her shoulders.)\n\nRia told me: being nervous means you still mean it. So it's fine to shake. Just land three squid, shaking.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('split_two', '상금은 너희 둘이 나눠라. 나는 완주로 됐다.', "Split the prize between you two. Finishing was enough for me.",
        '에이, 셋이 완주했는데 셋이 나눠야죠! (봉투를 내밀었다가 내 얼굴을 보고 도로 넣는다.)\n\n…알았어요. 그럼 그 돈으로 다음 대회 참가비 낼게요. 마라 것까지요. (제주 대회 사람들 사이에 내 이름이 남는다.)',
        "Come on, three of us finished, three of us split it! (She holds out the envelope, sees my face and puts it back.)\n\n…Fine. Then I'll pay the next tournament's entry fees with it. Mara's too. (My name stays with the Jeju tournament crowd.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      finish: [
        '네! (셋이 찍은 사진 한 장을 준다. 유리아가 찍었다.)\n\n사진 속에 마라 웃고 있죠? 대회에서 웃는 거 처음 봐요. 그쪽은 눈 감았어요. 그래도 그게 제일 잘 나온 거예요.',
        "Yes! (She gives me a photo of the three of us. Yuria took it.)\n\nMara's smiling in it, see? First time I've seen her smile at a tournament. Your eyes are shut. Still, it's the best one we got.",
      ],
      lesson: [
        '집어등 각도예요. 아래로 15도. (한치 집어가 빨라진다.)\n\n불을 바로 아래로 쏘면 한치가 너무 깊이 숨어요. 살짝 기울이면 그늘이 생기는데, 한치는 그 그늘 끝에 모여요. 밝은 데가 아니라 밝은 데 옆이에요.',
        "It's the lamp angle. Fifteen degrees down. (Drawing squid gets faster.)\n\nShine it straight down and the squid hide too deep. Tilt it a little and you get a shadow, and they gather at its edge. Not in the light — beside it.",
      ],
      pay: [
        '나눠요! 삼분의 일! (얼마 안 되지만 셋이 나눈 돈이다.)\n\n마라 몫은 마라가 직접 받아야 해요. 자기 이름으로 나갔으니까요. 저는 그거 보려고 봉투를 일부러 천천히 뜯을 거예요.',
        "Split it! A third each! (It isn't much, but it's money split three ways.)\n\nMara has to collect her share herself. She entered under her own name. I'm going to open the envelope slowly on purpose so I get to see that.",
      ],
    },
  },

  // ── N15-1 「혼자가 좋아요」 · 오세라 (once — 미루기 답은 나레이션에 있다) ──
  'N15-1': {
    offerAdd: [
      d('ask_distance', '매너 거리라는 건, 얼마나 떨어지라는 겁니까?', "Manner distance — how far apart do you mean?",
        '정해진 건 없어요. 제 캐스팅이 닿는 데 두 배쯤이요. 그러면 줄이 엉킬 일도, 말을 섞을 일도 없어요. (손가락으로 갯바위 끝과 끝을 재 보인다.)\n\n섬은 좁아요. 좁은 데서 혼자 있으려면 거리를 재야 해요. 그게 제 인사예요.',
        "There's no set number. About twice as far as my cast reaches. That way no lines tangle and nobody has to make conversation. (She measures from one end of the rocks to the other with her fingers.)\n\nThe island's small. To be alone somewhere small, you have to measure distance. That's my way of saying hello.",
        { affinity: 0.04, flag: 'choice.n15_1_asked_distance' }),
      d('joke_lose', '겨루면 제가 질 것 같은데, 진 사람은 뭘 합니까?', "If we compete I'll probably lose. What does the loser do?",
        '진 사람이요? …정해 둔 건 없어요. (진지하게 고민하는 얼굴이다.)\n\n그럼 라면이요. 편의점 컵라면. 진 사람이 물을 붓는 거예요. 이긴 사람은 먹기만 하고요. 그 정도면 공평하죠.',
        "The loser? …I hadn't decided. (She looks like she's seriously thinking about it.)\n\nRamyeon, then. Cup ramyeon from the shop. The loser pours the water. The winner just eats. That's fair enough.",
        { affinity: 0.03 }),
    ],
    offerReply: {
      agree: [
        '좋아요. 백 미터.\n\n제가 손을 들면 잡았다는 뜻이에요. 그쪽도 잡으면 들어요. 소리는 지르지 마요. 바다가 놀라요.',
        "Good. A hundred metres.\n\nIf I raise my hand, it means I've caught one. You raise yours when you do. Don't shout. It startles the sea.",
      ],
      decline: [
        '…네. (그녀는 그 뒤로 겨루자는 말을 다시 하지 않았다.)\n\n(편의점 불빛은 그 뒤로도 밤마다 켜져 있었다. 계산대 너머의 인사는 늘 짧았다.)',
        "…Right. (She never offered to compete again.)\n\n(The shop light stayed on every night after that. The greetings across the counter were always short.)",
      ],
    },
    completeAdd: [
      d('ramen_mine', '제가 졌으니 라면은 제가 사겠습니다.', "I lost, so the ramyeon's on me.",
        '…진 사람이 사는 거 맞아요. 근데 제 가게예요. (계산대 뒤에서 컵라면 두 개를 꺼낸다.)\n\n손님 돈은 받고, 진 사람 돈은 안 받아요. 그게 제 가게 규칙이에요. 방금 정했어요. (울릉 밤 편의점 단골 명부 끝에 내 이름이 생긴다.)',
        "…The loser pays, that's right. But it's my shop. (She takes two cup ramyeon from behind the counter.)\n\nCustomers pay. Losers don't. That's my shop rule. I just made it. (My name appears at the end of the Ulleung night shop's list of regulars.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      distance: [
        '…그렇게 말하는 사람 처음이에요. (다음엔 오십 미터라고 한다. 조금 가까워졌다.)\n\n가까이 있으면 서로 신경 쓰느라 바다를 못 봐요. 떨어져 있으니까 둘 다 바다를 봤잖아요. 그래서 손 든 게 보였고요. 오십 미터면… 그래도 바다는 보일 거예요.',
        "…Nobody's put it that way before. (Fifty metres next time, she says. A little closer.)\n\nUp close, people mind each other and can't see the sea. Apart, we both watched the sea. That's why the raised hand showed. At fifty metres… we'll still see the sea, I think.",
      ],
      lesson: [
        '멈춤이에요. 멈추는 시간이 길어요. (파핑 리듬이 달라진다.)\n\n파퍼가 물을 튀기고 나서, 물보라가 다 가라앉을 때까지 기다려요. 부시리는 그 조용한 틈을 노려요. 급한 사람은 그걸 못 기다리고 또 당겨요.',
        "The pause. I pause longer. (My popping rhythm changes.)\n\nAfter the popper splashes, wait until the spray has fully settled. Amberjack go for that quiet gap. People in a hurry can't wait and pull again.",
      ],
      pay: [
        '…라면. 편의점 라면. (라면과 함께 봉투가 온다. 편의점 점주 몫이라며.)\n\n물은 제가 부을게요. 삼 분이요. 그 삼 분 동안은 말 안 해도 돼요. 라면 앞에선 다들 조용하거든요.',
        "…Ramyeon. Shop ramyeon. (With the ramyeon comes an envelope. The shop owner's share, she says.)\n\nI'll pour the water. Three minutes. Nobody has to talk for those three minutes. Everyone goes quiet in front of ramyeon.",
      ],
    },
  },

  // ── N15-2 「들킬 뻔한 밤」 · 연태오 ──
  'N15-2': {
    offer: [
      d('shh_ok', '쉿. 알겠어요. 오늘 밤 일은 둘만 아는 걸로 해요.', "Shh. Got it. Tonight stays between the two of us.",
        '고마워요. 진짜로요. (어둠 속에서 고개를 크게 끄덕인다. 헤드랜턴은 꺼져 있다.)\n\n불은 켜지 마요. 편의점에서 다 보여요. 부시리는 소리로 찾아요. 던지는 소리 말고, 무는 소리요.',
        "Thanks. Really. (In the dark he nods hard. His headlamp is off.)\n\nKeep your light off. The shop can see everything. Find the amberjack by sound. Not the sound of casting — the sound of the strike.",
        { affinity: 0.05 }),
      d('ask_hiding', '몰래라니, 세라 씨한테 왜 숨기는 거예요?', "Sneaking out? Why are you hiding it from Sera?",
        '…세라 씨는 혼자가 좋다잖아요. 밤바다는 세라 씨 시간이에요. 거기 제가 끼면 매너가 아니죠. (작게 웃는다.)\n\n그래서 몰래 나와요. 들키면 매너 거리 위반이에요. 근데 그쪽도 몰래 나온 거 아니에요? 아까 편의점 쪽 보면서 고개 숙이던데.',
        "…Sera likes being alone, right? The night sea is Sera's time. If I barge in, that's bad manners. (He laughs quietly.)\n\nSo I sneak out. Get caught and it's a manner-distance violation. But didn't you sneak out too? You ducked your head looking toward the shop just now.",
        { affinity: 0.04, flag: 'choice.n15_2_asked_hiding' }),
      d('joke_caught', '들키면 저는 그냥 지나가던 손님인 걸로 할게요.', "If we're caught, I was just a passing customer.",
        '그럼 저는요? 저는 그냥 지나가던 알바예요. 둘 다 지나가던 사람이면… 아무도 안 믿겠네요. (어깨가 들썩인다. 소리 없이 웃는 중이다.)\n\n그러니까 안 들키면 돼요. 두 마리만 조용히요. 날 밝기 전에 끝내요.',
        "Then what about me? I'm just a passing part-timer. Two passers-by… nobody would buy that. (His shoulders shake. He's laughing without a sound.)\n\nSo we just don't get caught. Two fish, quietly. Done before it gets light.",
        { affinity: 0.03 }),
      d('uneasy', '세라 씨 모르게 하는 건 좀 마음에 걸려요.', "Doing this behind Sera's back bothers me a bit.",
        '…저도요. 조금. (헤드랜턴을 만지작거리다 그냥 내려놓는다.)\n\n그래도 오늘만이에요. 부시리 두 마리만 하고 들어가요. 들키면 그땐 제가 먼저 말할게요. 그쪽 이름은 안 대고요. 아마요.',
        "…Me too. A little. (He fiddles with his headlamp, then just puts it down.)\n\nBut it's only tonight. Two amberjack, then we go in. If we're caught, I'll speak up first. Without naming you. Probably.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('quiet_steps', '다음엔 들키지 않는 걸음부터 가르쳐 줘요.', "Next time, teach me how to walk without getting caught.",
        '…들키지 않는 걸음이요? 저도 들킬 뻔했는데요. (웃음을 참느라 어깨가 떨린다.)\n\n발이에요. 갯바위는 앞꿈치부터 디뎌요. 뒤꿈치부터 디디면 돌이 울려요. 고기도 사람도 그 소리를 들어요. (밤 갯바위를 걷는 발이 조용해진다.)',
        "…Walking without getting caught? I nearly got caught myself. (His shoulders shake as he holds back a laugh.)\n\nIt's the feet. On the rocks, step down toe first. Heel first and the stone rings. Fish hear it, and so do people. (My feet go quiet on the night rocks.)",
        { proficiency: { category: 'driving', xp: 20 }, affinity: 0.05 }),
    ],
    completeReply: {
      lesson: [
        '…스승은 말 안 해요. 저는 조금 해요. 여기서 멈춰요. (야간 파핑이 손에 붙는다.)\n\n밤엔 물보라가 안 보이니까 소리로 세요. 퍽, 하고 하나, 둘, 셋. 셋까지 참는 게 어려워요. 저도 아직 둘에서 당겨요.',
        "…My teacher doesn't talk. I talk a little. You pause here. (Night popping settles into my hands.)\n\nAt night you can't see the splash, so count by sound. Pop — one, two, three. Holding out to three is the hard part. I still pull on two.",
      ],
      tell_sera: [
        '…그럼 그쪽이 말해요. (세라가 다음 날 셋이 가자고 했다. 매너 거리 없이.)\n\n…다 알고 있었대요. 처음부터요. 모른 척해 준 거래요. 그게 세라 씨식 매너 거리였나 봐요. 저만 몰랐어요.',
        "…Then you tell her. (The next day Sera suggested all three of us go. No courtesy distance.)\n\n…She knew all along, apparently. From the start. She was pretending not to. I guess that was Sera's kind of manner distance. I was the only one who didn't know.",
      ],
      pay: [
        '공범… 네. (편의점 알바비를 나눈다.)\n\n알바비는 세라 씨가 주는 돈이에요. 그 돈으로 세라 씨 몰래 낚시한 값을 내다니. 이건 좀 이상하네요. 그래도 공범은 공범이니까요.',
        "Accomplice… right. (He splits his shop wages.)\n\nMy wages come from Sera. Paying for fishing behind Sera's back with Sera's money. That's a bit odd. Still, an accomplice is an accomplice.",
      ],
    },
  },

  // ── N16-1 「도전장」 · 석독구 (event — 미루기 답은 나레이션에 있다) ──
  'N16-1': {
    offerAdd: [
      d('ask_bait', '사 온 미끼가 반칙이면, 여기서 뭘 구하라는 거야?', "If shop bait's cheating, what am I supposed to use?",
        '그걸 왜 나한테 물어. 대결 상대한테. (턱을 치켜든다.)\n\n…힌트 하나만. 갯바위에 다 있어. 섬 사람은 미끼를 안 사. 바다가 주니까. 더는 안 알려 줘. 알려 주면 내가 지잖아.',
        "Why ask me? I'm your opponent. (He sticks his chin out.)\n\n…One hint. It's all on the rocks. Island people don't buy bait. The sea hands it out. That's all you get. Tell you more and I lose.",
        { affinity: 0.04, flag: 'choice.n16_1_asked_bait' }),
      d('handicap', '열두 살이면 나한테 핸디캡 하나는 줘야 하는 거 아니냐?', "You're twelve — shouldn't you give me a handicap?",
        '핸디캡? 그거 육지 말이야? (뜻을 모르는 척하다가 씩 웃는다.)\n\n좋아, 하나 줄게. 나는 손으로 캔 미끼만 쓸게. 원래 그렇지만. 그러니까 핸디캡 없는 거랑 똑같아. 시작해.',
        "Handicap? Is that a mainland word? (He pretends not to know it, then grins.)\n\nFine, I'll give you one. I'll only use bait I dig by hand. I always do anyway. So it's the same as none. Go.",
        { affinity: 0.02 }),
    ],
    offerReply: {
      accept: [
        '말은 잘하네!\n\n말로 잡는 거 아니야. 세 마리 먼저 채우는 사람이 이기는 거야. 미끼는 여기서 구해. 사 온 거 쓰면 바로 반칙패.',
        "Big talk!\n\nYou don't catch them with talk. First to three wins. Bait comes from here. Use shop stuff and you lose on the spot.",
      ],
      decline: [
        '…겁쟁이. (아이가 다시 걸어오지 않았다. 등대 이야기도.)\n\n(갯바위 끝에서 아이 혼자 볼락을 올리는 게 보였다. 세 마리를 채우고도 한참을 더 앉아 있었다.)',
        "…Coward. (He never came up to me again. Nor did the lighthouse story.)\n\n(Out at the end of the rocks I could see the boy landing rockfish alone. Even after his three, he stayed sitting there a long time.)",
      ],
    },
    completeAdd: [
      d('reel_care', '이 릴, 낡았는데 잘 돈다. 어떻게 관리한 거야?', "This reel's old but it spins sweetly. How did you look after it?",
        '바닷물 묻으면 민물로 헹궈. 그다음 말리고, 기름 한 방울. 두 방울 아니고 한 방울. (릴 손잡이를 한 바퀴 돌려 보인다. 소리가 곱다.)\n\n많이 바르면 모래가 붙어. 그건 하나 망가뜨려 보고 안 거야. (낡은 릴을 손보는 요령이 손에 붙는다.)',
        "Salt water on it, rinse it in fresh. Then dry it and one drop of oil. One, not two. (He turns the handle once to show me. It sounds sweet.)\n\nToo much and sand sticks to it. I learned that by wrecking one. (The knack of keeping an old reel going settles into my hands.)",
        { proficiency: { category: 'crafting', xp: 20 }, affinity: 0.05 }),
    ],
    completeReply: {
      lesson: [
        '갯바위 밑에. 손으로 캐. (현지 조달 채집이 손에 붙는다.)\n\n물 빠질 때 돌을 들면 밑에 붙어 있어. 돌은 들었던 대로 다시 놔. 안 그러면 다음에 없어. 섬은 다 그래.',
        "Under the rocks. You dig it by hand. (Gathering local bait settles into my hands.)\n\nWhen the tide's out, lift a stone and they're stuck underneath. Put the stone back the way it was. Otherwise there's none next time. The whole island's like that.",
      ],
      rematch: [
        '해 봐, 육지 사람. (아이가 웃는다. 할아버지 등대 이야기를 꺼낸다.)\n\n우리 할아버지는 등대에 있어. 거기서 바다를 다 봐. 네가 지는 것도 봤을걸. …다음엔 할아버지 보는 데서 해. 그럼 내가 더 크게 이기니까.',
        "Try it, mainlander. (The boy grins. He brings up his grandfather's lighthouse.)\n\nMy grandpa's up at the lighthouse. He sees the whole sea from there. He probably saw you lose. …Next time, do it where Grandpa can see. Then I win bigger.",
      ],
      pay: [
        '상금! 아이스크림! (아이스크림값을 준다. 아이가 세 개를 산다.)\n\n하나는 내 거, 하나는 네 거. 하나는… 몰라, 그냥 하나 더. 이긴 사람은 원래 하나 더 먹는 거야.',
        "Prize money! Ice cream! (I hand over ice cream money. He buys three.)\n\nOne's mine, one's yours. And one's… dunno, just one more. The winner always gets an extra.",
      ],
    },
  },

  // ── N16-2 「등대까지」 · 석독구 ──
  'N16-2': {
    offer: [
      d('deliver_ok', '알았다. 안 묻고 갖다 주마.', "All right. I won't ask. I'll take it.",
        '…진짜 안 물어? (편지를 내밀다가 한 번 더 확인한다.)\n\n접은 데 펴지 마. 등대까지 걸어서 가. 배 없어. 오르막이 기니까 물 챙겨. 할아버지한테 주고 바로 와.',
        "…You really won't ask? (He holds out the letter, then checks once more.)\n\nDon't unfold it. Walk up to the lighthouse. There's no boat. The climb's long, so bring water. Give it to Grandpa and come straight back.",
        { affinity: 0.06 }),
      d('ask_lighthouse', '너희 할아버지가 등대에 계셔? 등대에서 뭘 하시는데?', "Your grandpa's at the lighthouse? What does he do up there?",
        '등대지기야. 불 켜고, 바람 적고, 파도 적어. 종이에 손으로. (손가락으로 허공에 줄을 긋는다. 할아버지 흉내 같다.)\n\n하루에도 몇 번씩 적어. 기계가 있는데도. 왜 그러는지는 몰라. 아무튼 할아버지는 바다를 적는 사람이야. 나는 바다를 낚는 사람이고.',
        "He's the lighthouse keeper. Lights the lamp, writes down the wind, writes down the waves. On paper, by hand. (He draws lines in the air with a finger — an impression of his grandfather, it looks like.)\n\nSeveral times a day. Even though there's a machine. Don't know why. Anyway, Grandpa's the one who writes the sea down. I'm the one who catches it.",
        { affinity: 0.04, flag: 'choice.n16_2_asked_lighthouse' }),
      d('press_why', '그래도 왜 네가 못 가는지는 말해 줘야지.', "You could at least tell me why you can't go.",
        '묻지 말랬지. (입을 꾹 다문다. 귀가 빨개진다.)\n\n…그냥 못 가. 갔다가 할아버지가 뭐라고 하면, 나 또 대답 못 해. 그러니까 네가 가. 편지는 대답 안 해도 되잖아.',
        "I said don't ask. (He presses his lips shut. His ears go red.)\n\n…I just can't. If I go and Grandpa says something, I won't have an answer again. So you go. A letter doesn't have to answer back.",
        { affinity: 0, flag: 'choice.n16_2_pressed' }),
      d('postman_fee', '우체부 값은 볼락 한 마리면 되겠다.', "A rockfish should cover the postman's fee.",
        '볼락? 내 볼락 비싼데. (진지하게 고민한다.)\n\n…좋아, 한 마리. 대신 편지 갖다 주고 나서. 그리고 할아버지가 뭐라고 했는지 말하지 마. 아니, 말해. 아니… 그건 그때 생각할게.',
        "A rockfish? My rockfish are pricey. (He actually thinks it over.)\n\n…Fine, one. But after you deliver it. And don't tell me what Grandpa said. No, tell me. No… I'll decide then.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('lighthouse_spot', '등대 밑에서 하나 올렸다. 물이 도는 자리더라.', "Landed one below the lighthouse. The water turns there.",
        '알아, 바위 꺾이는 데지? 거기 물이 돌아서 볼락이 서. 육지 사람치고 잘 찾았네. (아이가 처음으로 순순히 인정한다.)\n\n물 돌 때는 채비를 가볍게 해. 무거우면 바닥에 박혀. 가벼우면 물 따라 볼락 앞까지 가. (물 도는 자리를 읽는 눈이 생긴다.)',
        "I know — where the rock bends, right? The water turns there, so the rockfish hold. Not bad for a mainlander. (For once he admits something without a fight.)\n\nWhen the water turns, go light on the rig. Too heavy and it digs into the bottom. Light, and it rides the water right up to the rockfish. (I get an eye for where the water turns.)",
        { proficiency: { category: 'fishing', xp: 20 }, affinity: 0.05 }),
    ],
    completeReply: {
      deliver: [
        '…오래? (아이가 등대 쪽을 본다. 그날 저녁 아이가 등대로 올라갔다.)\n\n(등대에 불이 켜질 무렵에야 아이가 내려왔다. 무슨 이야기를 했는지는 묻지 않았다. 내려오는 걸음이 올라갈 때보다 가벼웠다.)',
        "…A long while? (The boy looks toward the lighthouse. That evening he climbed up to it.)\n\n(He only came down around the time the lighthouse lamp came on. I didn't ask what they talked about. His steps coming down were lighter than going up.)",
      ],
      ask: [
        '…할아버지가 내 낚시 싫어해. 공부하래. (편지에는 볼락 세 마리라고만 적혀 있었다고 한다.)\n\n공부는 꽝이야. 그건 나도 알아. 근데 볼락은 세 마리 잡았어. 그거 말고는 쓸 게 없었어. 할아버지가 그걸 읽고 뭐라고 했을지… 모르겠다, 화냈을지도.',
        "…Grandad hates my fishing. Says study. (The letter, they say, only read: three rockfish.)\n\nI'm hopeless at school. I know that. But I caught three rockfish. There was nothing else to write. What Grandpa made of it… dunno. He might be angry.",
      ],
      pay: [
        '용돈… 없어. 볼락 줄게. (볼락 한 마리. 받는다.)\n\n제일 큰 거야. 아니, 두 번째로 큰 거. 제일 큰 건 할아버지 갖다 줄 거야. …아무한테도 말하지 마.',
        "Pocket money… I haven't got any. Have a rockfish. (One rockfish. I take it.)\n\nIt's the biggest. No, the second biggest. The biggest one's for Grandpa. …Don't tell anyone.",
      ],
    },
  },

  // ── N16-3 「독구의 첫 바다」 · 석독구 ──
  'N16-3': {
    offer: [
      d('own_rule', '축하한다. 첫 바다에선 네 자는 네가 대라.', "Congratulations. On your first sea, you lay your own rule.",
        '응! 내 자로 할 거야! (가방에서 자를 꺼내 흔든다. 눈금 옆에 이름이 매직으로 적혀 있다.)\n\n돌돔은 줄무늬가 예뻐서 사진도 찍을 거야. 재고, 찍고, 놔. 쿨러는 안 열어. 조사선은 잡는 배가 아니래. 조사단 형들이 그랬어.',
        "Yeah! I'm using my own rule! (He pulls a rule from his bag and waves it. His name is written in marker beside the marks.)\n\nBeakperch have pretty stripes, so I'm taking a photo too. Measure, photo, let go. We don't open the cooler. The survey boat isn't a catching boat, the survey guys said.",
        { affinity: 0.05 }),
      d('ask_last_shift', '너희 할아버지 마지막 근무라니? 등대를 그만두시는 거야?', "Your grandpa's last shift? Is he leaving the lighthouse?",
        '교대래. 등대는 이제 다른 사람이 지킨대. 할아버지는 오늘 무전으로 교대 신호만 하면 끝이야. (잠깐 말이 없다. 자를 손바닥에 톡톡 친다.)\n\n그래서 오늘 타는 거야. 할아버지가 등대에서 보는 마지막 배에 내가 타 있으려고. 이건 할아버지한테 말하지 마.',
        "It's a changeover. Someone else keeps the lighthouse now. Grandpa just gives the changeover call on the radio today and he's done. (He goes quiet a moment, tapping the rule against his palm.)\n\nThat's why I'm going today. So I'm on the last boat Grandpa watches from the lighthouse. Don't tell him that.",
        { affinity: 0.05, flag: 'choice.n16_3_asked_shift' }),
      d('ask_consent', '너희 할아버지가 동의하셨다고? 어떻게 허락을 받았어?', "Your grandpa agreed? How did you get him to say yes?",
        '몰라. 그냥 서류 내밀었더니 이름 써 줬어. 아무 말도 없이. (자기도 아직 믿기지 않는 얼굴이다.)\n\n보호자 칸에 할아버지 이름 있어. 진짜야. 봐. …편지 때문인가. 아니야, 그건 모르겠어. 아무튼 썼어.',
        "Dunno. I just held out the form and he signed it. Without a word. (He still looks like he can't believe it.)\n\nGrandpa's name is in the guardian box. For real. Look. …Was it the letter? Nah, I dunno. Anyway, he signed.",
        { affinity: 0.04, flag: 'choice.n16_3_asked_consent' }),
      d('survey_rules', '조사선은 장난 아니다. 거기선 내 말 잘 들어야 한다.', "A survey boat's no game. Out there, you listen to me.",
        '알아! 구명조끼 먼저, 갑판에서 안 뛰고, 자 대기 전에 손 적시고. 다 외웠어. (손가락을 하나씩 접으며 줄줄 왼다.)\n\n손 적시는 건 돌돔 비늘 다치지 말라고야. 마른 손으로 만지면 고기가 아파. 이건 네가 가르쳐 준 거잖아.',
        "I know! Life jacket first, no running on deck, wet your hands before the rule goes on. I've got it all. (He counts them off on his fingers.)\n\nWet hands so you don't hurt the scales. Touch it dry and it hurts the fish. You taught me that one, remember.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('your_sea', '수당은 됐다. 오늘은 네 바다였으니까.', "Keep the pay. Today was your sea.",
        '내 바다? …내 바다. (아이가 그 말을 입속으로 한 번 더 굴린다.)\n\n그럼 너는 손님이야. 손님은 돈 안 받아도 돼, 오늘만. 조사단 형들한테 네 이름 말해 둘게. (독도 조사단 사람들 사이에 내 이름이 오르내린다.)',
        "My sea? …My sea. (He rolls the words round his mouth once more.)\n\nThen you're the guest. Guests don't get paid, just today. I'll tell the survey guys your name. (My name gets passed around among the Dokdo survey team.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      first: [
        '안 잊어. (아이가 계측자를 내게 준다. 할아버지 것이라고. 이제 자기 것을 쓴다고.)\n\n할아버지 자는 오래 쓴 거야. 눈금이 다 닳았어. 이제 네가 써. 나는 내 걸로 잴 거야. 할아버지처럼 오래오래.',
        "I won't. (He gives me his measuring rule. His grandfather's, he says. He uses his own now.)\n\nGrandpa's rule is old. The marks are worn down. You use it now. I'll measure with mine. For a long, long time, like Grandpa.",
      ],
      lesson: [
        '할아버지가. 기상 적을 때. 눈금 읽는 법. (계측이 정확해진다.)\n\n눈금은 똑바로 마주 보고 읽어. 비스듬히 보면 길이가 달라져. 할아버지는 바람 적을 때도 그렇게 했어. 한 번 읽고, 한 번 더 읽고.',
        "From grandad. Logging the weather. Reading the marks. (My measuring gets accurate.)\n\nRead the marks looking straight at them. Look at a slant and the length changes. Grandpa did that logging the wind, too. Read it once, then read it again.",
      ],
      pay: [
        '어른? 네가? …그럼 아이스크림. (조사단이 아이스크림값을 준다. 아이가 다섯 개를 산다.)\n\n다섯 개야. 나, 너, 조사단 형 둘, 그리고 할아버지. 할아버지 건 녹겠지만 그래도 사 갈 거야. 마지막 근무 끝났으니까.',
        "Grown-up? You? …Ice cream, then. (The survey team pays for ice cream. He buys five.)\n\nFive. Me, you, two survey guys, and Grandpa. Grandpa's will melt, but I'm taking it anyway. His last shift's done.",
      ],
    },
  },

  // ── N17-1 「퇴근길 20분」 · 단철호 (event — 미루기 답은 나레이션에 있다) ──
  'N17-1': {
    offerAdd: [
      d('ask_restaurant', '식당에 그냥 드린다고요? 어떤 식당입니까?', "You just give it to a restaurant? Which one?",
        '부두 근처 단골 밥집이요. 십 년째 제 자리가 있어요. 퇴근길에 한 마리 들고 가면 사장님이 그걸로 찌개를 끓여 줘요. (넥타이를 반쯤 풀며 웃는다.)\n\n낚싯대로 잡은 건 팔면 안 되잖아요. 그래서 드리는 거예요. 대신 밥값은 제 돈으로 내고요. 그게 십 년 동안 지켜 온 계산이에요.',
        "My regular place near the pier. I've had a seat there for ten years. I bring one fish on my way home and the owner puts it in a stew for me. (He loosens his tie halfway, smiling.)\n\nYou can't sell what you catch on a rod, right? So I give it. And I pay for my own meal. That's the arithmetic I've kept for ten years.",
        { affinity: 0.04, flag: 'choice.n17_1_asked_restaurant' }),
      d('doubt_twenty', '20분 안에 한 마리요? 그게 정말 됩니까?', "One fish in twenty minutes? Is that really doable?",
        '안 될 때가 더 많아요. 그럼 그냥 퇴근해요. 내일 또 오면 되니까. (손목시계를 톡톡 친다.)\n\n20분은 잡으려고 정한 게 아니라 그만두려고 정한 시간이에요. 그보다 오래 있으면 퇴근길이 아니라 출조가 돼요. 출조는 주말에 하는 거고요.',
        "More often it doesn't. Then I just go home. I can come back tomorrow. (He taps his wristwatch.)\n\nTwenty minutes isn't the time for catching. It's the time for stopping. Stay longer and it's not the way home any more, it's a fishing trip. Fishing trips are for weekends.",
        { affinity: 0.03 }),
    ],
    offerReply: {
      go: [
        '그 마음이에요. 가요.\n\n채비는 하나만 들고 와요. 바꿀 시간 없어요. 부두 끝 계단 밑, 거기가 제 자리예요. 20분 재는 건 제가 할게요.',
        "That's the spirit. Come on.\n\nBring one rig only. There's no time to change. Under the steps at the end of the pier — that's my spot. I'll keep the time.",
      ],
      decline: [
        '…그럼 다음 퇴근길에요. 퇴근은 매일 있어요.\n\n퇴근길은 내일도 있고, 모레도 있어요. 짬낚시는 그게 좋아요. 놓쳐도 아깝지 않거든요. 생각나면 부두 끝 계단으로 와요.',
        "…Next time you're heading home, then. Everyone heads home eventually.\n\nThere's a way home tomorrow, and the day after. That's the nice thing about a quick session. Miss one and it's no loss. When you feel like it, come to the steps at the end of the pier.",
      ],
    },
    completeAdd: [
      d('regular_trade', '단골 식당이 자리를 비워 두는 것도 장사의 한 수더군요.', "A regular restaurant keeping your seat — that's business sense too.",
        '장사죠. 근데 돈이 안 오가는 장사예요. 생선이 가고 자리가 와요. (식당 쪽을 턱으로 가리킨다. 창가 자리에 수저가 미리 놓여 있다.)\n\n십 년이면 그게 단골이에요. 값을 깎는 게 아니라 자리를 남기는 거. 그쪽도 언젠가 그런 가게 하나 생길 거예요. (단골을 만드는 요령이 손에 익는다.)',
        "It's business. But no money changes hands. Fish goes one way, a seat comes back. (He points his chin at the restaurant. Cutlery is already set at the window seat.)\n\nTen years of that and you're a regular. Not haggling the price — keeping a place. You'll have a shop like that someday too. (The knack of becoming a regular settles into my hands.)",
        { proficiency: { category: 'economy', xp: 20 }, affinity: 0.05 }),
    ],
    completeReply: {
      habit: [
        '만들어요. 십 년 가요. (식당 주인이 내 자리도 하나 비워 뒀다.)\n\n습관은 작아야 오래 가요. 크게 잡으면 사흘이에요. 20분이면 피곤한 날도 할 수 있어요. 그런 날 하는 게 진짜 습관이에요.',
        "Make one. It'll last ten years. (The restaurant owner keeps a seat for me too.)\n\nA habit has to be small to last. Make it big and it lasts three days. Twenty minutes you can manage even on a tired day. The ones you keep on tired days are the real habits.",
      ],
      lesson: [
        '단순해야 해요. 채비 하나. 포인트 하나. (짧은 시간 낚시가 몸에 붙는다.)\n\n포인트 고르는 데 10분 쓰면 낚시는 10분이에요. 그래서 자리는 정해 두고 가요. 바뀌는 건 물때뿐이에요. 물때만 보고 던져요.',
        "It has to be simple. One rig. One spot. (Short-session fishing settles into my body.)\n\nSpend ten minutes picking a spot and you've got ten minutes of fishing. So the spot's fixed before you go. The only thing that changes is the tide. Check the tide and cast.",
      ],
      pay: [
        '당연하죠. 회사 카드… 아니, 제 카드. (밥값과 함께 봉투가 온다. 팀 회식비 남은 거라며.)\n\n회사 카드로 긁으면 회식이 되고, 제 카드로 긁어야 밥이 돼요. 오늘은 밥이에요. 봉투는 비밀이고요. 총무가 알면 혼나요.',
        "Of course. Company card… no, mine. (With the meal comes an envelope. What's left of the team dinner fund, he says.)\n\nPut it on the company card and it's a staff dinner. Put it on mine and it's a meal. Today's a meal. The envelope's a secret. The treasurer would have my head.",
      ],
    },
  },

  // ── N17-2 「첼로 케이스」 · 하민지 ──
  'N17-2': {
    offer: [
      d('party_on', '좋습니다. 우럭 두 마리, 연주회 전에 올리죠.', "Sounds good. Two rockfish before the recital.",
        '좋아요! 첼로는 여기 둘게요. 케이스가 튼튼하거든요. (방파제 계단에 첼로 케이스를 조심스럽게 눕힌다.)\n\n우럭 올라오면 바로 조과 파티예요. 회는 못 떠도 사진은 찍을 수 있어요. 무대 전에 웃고 들어가면 첫 음이 달라요.',
        "Great! I'll leave the cello here. The case is sturdy. (She lays the cello case carefully on the breakwater steps.)\n\nThe moment the rockfish come up, it's a catch party. We can't slice sashimi, but we can take photos. Go on stage after a laugh and the first note comes out different.",
        { affinity: 0.05 }),
      d('ask_hands', '낚시가 손을 풀어 준다는 게, 어떤 느낌입니까?', "Fishing loosens your hands — what does that feel like?",
        '무대 전에는 손가락이 차갑고 딱딱해요. 그런데 줄을 잡고 입질을 기다리면, 손끝이 바다 쪽으로 열리는 느낌이 들어요. (손가락을 하나씩 접었다 편다.)\n\n활도 그래요. 꽉 쥐면 소리가 죽어요. 우럭이 툭 칠 때 손에 힘이 빠지거든요. 그 느낌 그대로 무대에 가져가요.',
        "Before a performance my fingers go cold and stiff. But when I hold the line and wait for a bite, my fingertips feel like they're opening toward the sea. (She curls and uncurls her fingers one at a time.)\n\nThe bow's the same. Grip it tight and the sound dies. When a rockfish taps, the strength just leaves your hand. I take that feeling straight on stage.",
        { affinity: 0.04, flag: 'choice.n17_2_asked_hands' }),
      d('worry_time', '연주회 당일인데, 늦으시면 어떡하려고 그러십니까?', "It's recital day — what if you end up late?",
        '세 시간 남았어요. 우럭 두 마리면 한 시간이면 돼요. 아마요. (휴대폰 알람을 맞추는 손이 능숙하다.)\n\n알람 두 개 맞췄어요. 하나는 낚시 끝, 하나는 진짜 끝. 두 번째가 울리면 고기가 물어도 놓고 가요. 그건 약속할게요. 첼로가 먼저예요.',
        "Three hours to go. Two rockfish should take an hour. Probably. (She sets alarms on her phone with practised hands.)\n\nTwo alarms. One for fishing over, one for really over. When the second goes, I leave even if something's biting. I promise that. The cello comes first.",
        { affinity: 0.03 }),
      d('joke_party', '우럭 두 마리로 파티가 됩니까?', "Can two rockfish make a party?",
        '되죠! 사람 둘, 우럭 둘. 넷이면 파티예요. (진지하게 손가락 네 개를 펴 보인다.)\n\n음악은 제가 할게요. 연주회 전이라 제대로는 안 되지만, 콧노래 정도는요. 우럭이 박자 맞춰 올라오면 좋겠네요.',
        "Of course! Two people, two rockfish. Four's a party. (She seriously holds up four fingers.)\n\nI'll do the music. Not properly, with the recital tonight, but humming, sure. Hope the rockfish come up on the beat.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('no_dues', '회비는 됐습니다. 오늘 연주 잘하시면 그걸로 됐습니다.', "No dues. Play well tonight and we're square.",
        '그럼 오늘 첫 음은 드릴게요. 객석에선 아무도 모르겠지만 저는 알아요. (첼로 케이스를 고쳐 멘다. 발걸음이 가볍다.)\n\n틀리면 우럭 탓, 안 틀리면 오늘 낚시 덕이에요. 단원들한테 자랑할게요. (인천 짬낚시 사람들 사이에 내 이름이 돈다.)',
        "Then tonight's first note is yours. Nobody in the audience will know, but I will. (She settles the cello case on her shoulder. Her steps are light.)\n\nIf I slip, blame the rockfish. If I don't, thank today's fishing. I'll brag to the orchestra. (My name goes round the Incheon after-work anglers.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      accept: [
        '네! (첼로 케이스에서 악보 한 장을 꺼내 준다. 곡명이 바다다.)\n\n아직 미완성이에요. 부장님 하모니카 자리가 비어 있거든요. 재개관식 전까지 채울게요. 그날 바다가 조용하면 좋겠어요.',
        "Yes! (From the cello case she takes out a sheet of music. The piece is called 'Sea'.)\n\nIt isn't finished. The manager's harmonica part is still blank. I'll fill it in before the reopening. I hope the sea's calm that day.",
      ],
      lesson: [
        '있어요. 릴 핸들을 천천히 돌려요. 세 바퀴. (파이팅 초반이 안정된다.)\n\n연주 전에 활을 세 번 그어 보는 거랑 같아요. 소리가 아니라 손을 확인하는 거예요. 세 바퀴 돌리고 나면 손이 지금 어디 있는지 알아요.',
        "There is. Turn the reel handle slowly. Three turns. (The early part of a fight steadies.)\n\nIt's like drawing the bow three times before playing. You're checking your hand, not the sound. After three turns you know where your hand is right now.",
      ],
      pay: [
        '있어요! 첼로 단원 월급으로! (얼마 안 되지만 단원 월급이다.)\n\n단원 월급이 원래 얼마 안 돼요. 그래도 조과 파티는 회비를 걷어야 파티 같아요. 다음엔 우럭 한 마리당 얼마로 할까요?',
        "There are! Out of an orchestra salary! (It isn't much, but it's an orchestra salary.)\n\nOrchestra pay is never much. But a catch party only feels like a party if you collect dues. Next time, shall we charge per rockfish?",
      ],
    },
  },

  // ── N11-4 「덜렁이의 첫 손님」 · 채파도 ──
  'N11-4': {
    offer: [
      d('ride_along', '탄다. 아무것도 안 하고 있기만 하마.', "I'll ride. I won't do a thing — I'll just be there.",
        '네! 뒤에 앉아 있어요. 손님들이 그쪽 보고 안심할 거예요. (손님 명부를 두 번, 세 번 넘겨 본다.)\n\n근데 진짜 아무것도 하지 마요. 제가 틀려도요. 틀리면 제가 고칠게요. 선장님 말로는 혼자 고쳐 봐야 선장이 된대요.',
        "Yes! Sit at the back. The customers will see you and relax. (He flips through the passenger list twice, three times.)\n\nBut really don't do anything. Even if I get it wrong. If I get it wrong, I'll fix it. The skipper says you only become a skipper by fixing it yourself.",
        { affinity: 0.05 }),
      d('ask_skipper_back', '채금자 씨는 왜 같이 안 타시고?', "Why isn't Geum-ja coming along?",
        '선장님이 그랬어요. 첫 손님은 혼자 태우는 거래요. 선장님이 타면 손님들이 선장님만 본대요. (부두 쪽을 흘끔 본다.)\n\n근데 보세요, 저기 서 계시잖아요. 등 돌리고요. 안 보는 척하면서 다 들으실 거예요. 그게 더 떨려요.',
        "The skipper said a first party you take out alone. If she's aboard, the customers only look at her. (He glances at the quay.)\n\nBut look — she's standing right there. Back turned. Pretending not to look, she'll hear everything. That's even more nerve-racking.",
        { affinity: 0.04, flag: 'choice.n11_4_asked_skipper' }),
      d('tease_rigs', '덜렁이가 손님을? 채비는 안 잊고 챙겼냐?', "The scatterbrain, taking customers? Remembered the rigs, did you?",
        '챙겼어요! 세 번 셌어요! (발끈했다가 아이스박스 뚜껑을 슬쩍 열어 본다.)\n\n…네, 있어요. 미끼도 얼음도 멀미약도. 오늘은 덜렁이라고 부르지 마요. 손님 앞에서는요. 배에서 내리면 불러도 돼요.',
        "I did! Counted three times! (He bristles, then sneaks a look inside the cool box.)\n\n…Yes, it's there. Bait, ice, seasickness pills. Don't call me scatterbrain today. Not in front of the customers. Once we're off the boat you can.",
        { affinity: 0.02 }),
      d('ask_seasick', '손님이 멀미라도 하면 어떡할 건데?', "What'll you do if a customer gets seasick?",
        '가운데 앉혀요! 배는 가운데가 덜 흔들려요. 그리고 먼 데를 보게 해요. 선장님한테 배웠어요. (손가락으로 배 그림을 그려 가며 설명한다.)\n\n그래도 안 되면… 그쪽이 있잖아요. 아, 아무것도 안 하기로 했죠. 그럼 제가 할게요. 할 수 있어요.',
        "Seat them amidships! The middle of a boat rocks least. And have them look far off. The skipper taught me. (He sketches a boat in the air with his finger as he explains.)\n\nIf that doesn't work… you're there. Ah, right, you're not doing anything. Then I'll do it. I can.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('knot_hands', '손님들 채비, 엉킨 데 하나 없이 나눠 주더라. 매듭 좀 보자.', "You handed out the rigs without a single tangle. Show me your knot.",
        '이거요? 선장님이 매듭은 하나만 제대로 하래요. 여러 개 어설프게 말고요. (손님 채비 하나를 풀었다가 눈 감고 다시 묶는다.)\n\n저는 덜렁대니까 하나만 백 번 했어요. 그럼 덜렁대도 손이 알아서 해요. 그쪽도 해 봐요. (채비 매듭이 손에 붙는다.)',
        "This? The skipper says learn one knot properly. Not a bunch of them badly. (He undoes one of the customer rigs and reties it with his eyes shut.)\n\nI'm a scatterbrain, so I did that one a hundred times. Then even when I'm scatterbrained, my hands do it. You try. (Tying rigs settles into my hands.)",
        { proficiency: { category: 'crafting', xp: 20 }, affinity: 0.04 }),
      d('back_turned', '채금자 씨가 등 돌리고 다 듣고 계셨던 거 알았냐?', "Did you know Geum-ja was listening the whole time, back turned?",
        '알았어요! 선장님은 등으로도 다 들어요. (부두 쪽을 본다. 채금자가 아직 등을 돌린 채 서 있다. 어깨가 조금 내려가 있다.)\n\n팁 보여 드렸을 때 고개를 한 번 끄덕이셨어요. 저 그거 봤어요. 그거면 돼요.',
        "I knew! The skipper hears everything, even with her back turned. (He looks toward the quay. Geumja is still standing with her back turned. Her shoulders have dropped a little.)\n\nWhen I showed her the tip, she nodded once. I saw it. That's enough.",
        { affinity: 0.05, affinityOther: [{ npcId: 'chae_geumja', delta: 0.04 }], flag: 'choice.n11_4_back_turned' }),
    ],
    completeReply: {
      praise: [
        '…여기요. (파도가 팁 봉투를 반으로 접어 내민다. 받지 않으면 안 될 얼굴이다.)\n\n반은 그쪽 거예요. 있어 준 값이에요. 그쪽이 뒤에 있어서 손님 앞에서 안 떨었어요. 선장님한테는… 제가 선장이었다고 말해 줘요.',
        "…Here. (Pado folds the tip envelope in half and holds it out. His face won't let me refuse.)\n\nHalf is yours. For being there. With you at the back, I didn't shake in front of the customers. And to the skipper… you tell her I was a skipper.",
      ],
      lesson: [
        '저요? 선장님이 가르쳐 준 거예요. 뱃멀미 심한 사람 가운데! (손님 응대가 손에 붙는다.)\n\n그다음은 낚싯대 방향이요. 바람을 등지게 앉혀야 줄이 안 엉켜요. 그것도 선장님이 가르쳐 준 거예요.',
        "Me? The skipper taught me. Put the bad sailors amidships! (Handling passengers settles into my hands.)\n\nNext is which way the rods point. Seat them with the wind at their backs so the lines don't tangle. The skipper taught me that too.",
      ],
      decline: [
        '있기만 해도 돼요. 진짜로. (지세포에서 파도가 나를 따르는 걸 다들 안다.)\n\n그쪽이 있으면 제가 덜 덜렁대요. 이상하죠. 다음에도 있어만 줘요. 아무것도 안 해도 되니까요.',
        "You're allowed to just stand there. Really. (Everyone in Jisepo knows Pado looks up to me.)\n\nWhen you're around I'm less of a scatterbrain. Weird, right? Next time too, just be there. You don't have to do anything.",
      ],
    },
  },

  // ── N13-3 「폐어선의 겨울」 · 송기백 발주 — 말은 마감기가 대신 한다 ──
  'N13-3': {
    offer: [
      d('fix_it', '고치겠습니다. 어디가 고장인지부터 보죠.', "I'll fix it. Let's see what's broken first.",
        '고마워요! 할아버지는 아무 말도 안 하겠지만, 그게 고맙다는 뜻이에요. (마감기가 폐어선 쪽을 흘끔 본다. 연통에서 연기가 안 난다.)\n\n불은 붙는데 금방 꺼져요. 부품 하나가 나간 것 같아요. 아마요. 둘이 보면 금방일 거예요.',
        "Thank you! Grandpa won't say a word, but that's his way of saying thanks. (The writer glances toward the hulk. No smoke from the flue.)\n\nIt lights and then goes straight out. One part's gone, I think. Probably. With two of us looking, it'll be quick.",
        { affinity: 0.05 }),
      d('ask_silence', '송기백 씨는 왜 고쳐 달라는 말을 안 하십니까?', "Why won't Gibaek ask anyone to fix it?",
        '할아버지는 부탁을 빚으로 생각해요. 빚지는 걸 제일 싫어하고요. 춥다는 말도 안 해요. (마감기가 언 손을 비빈다.)\n\n그래서 제가 대신 말해요. 저는 부탁하는 데 익숙하거든요. 마감 연장 부탁만 백 번은 했어요.',
        "Grandpa thinks of asking a favour as a debt. And he hates owing anything most of all. He won't even say he's cold. (The writer rubs frozen hands together.)\n\nSo I say it for him. I'm used to asking favours. I must have begged a hundred deadline extensions.",
        { affinity: 0.04, flag: 'choice.n13_3_asked_silence' }),
      d('never_fixed', '난로는 고쳐 본 적이 없습니다만, 해 보겠습니다.', "I've never fixed a stove, but I'll give it a try.",
        '저도 난로는 처음이에요. 그래도 배 엔진보다는 쉽겠죠. 난로는 바다에 안 떠 있으니까요. (마감기가 공구 가방을 내민다. 볼펜이 섞여 있다.)\n\n하나씩 풀어 보면 돼요. 푼 순서대로 늘어놓고요. 콘티 그리듯이요. 거꾸로 조립하면 원래대로 돌아와요. 아마요.',
        "Stoves are new to me too. Still, it must be easier than a boat engine. A stove doesn't float. (The writer holds out a tool bag. There are ballpoint pens mixed in.)\n\nJust take it apart one piece at a time. Lay the pieces out in order. Like storyboarding. Put it back in reverse and it's as it was. Probably.",
        { affinity: 0.03 }),
      d('joke_escape', '이번엔 마감 도주가 아니라 난로 도주입니까?', "So this time it's not a deadline escape, it's a stove escape?",
        '하하, 아니에요. 이번엔 진짜 마감이 있어요. 겨울이요. 겨울은 연장이 안 돼요. (웃다가 금세 진지해진다.)\n\n여든한 번째 겨울이래요. 할아버지 말로는요. 그 숫자는 저도 콘티에 못 그리겠어요. 그러니까 오늘 고쳐요.',
        "Ha, no. This time there's a real deadline. Winter. Winter doesn't do extensions. (The laugh fades quickly into seriousness.)\n\nHis eighty-first winter, Grandpa says. Even I couldn't fit that number into a storyboard. So we fix it today.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('cold_tip', '폐어선에서 겨울 나는 법, 송기백 씨께 여쭤봐 주시겠습니까?', "Could you ask Gibaek how he gets through winter on the hulk?",
        '(마감기가 노인 쪽으로 몸을 숙여 귓속말을 하고 돌아온다.) 바닥부터 막으래요. 바람은 위가 아니라 아래로 들어온대요. 그리고 잘 때 양말 두 겹. 그건 제가 덧붙인 거예요.\n\n할아버지가 고개를 끄덕였어요. 맞대요. 할아버지한테는 그게 고맙다는 말이에요. (추위를 견디는 요령이 몸에 붙는다.)',
        "(The writer leans down to whisper to the old man and comes back.) Seal it from the floor up, he says. The wind comes in from below, not above. And two pairs of socks at night. That bit's mine.\n\nGrandpa nodded. Says that's right. For him, that counts as thank you. (The knack of bearing the cold settles into my body.)",
        { proficiency: { category: 'life', xp: 22 }, affinity: 0.05 }),
    ],
    completeReply: {
      lesson: [
        '배 위에서 뭐든 고쳐요, 저는. 원고 빼고. (기계 수리가 손에 붙는다.)\n\n기계는 거짓말을 안 해요. 안 되는 데가 꼭 소리를 내요. 원고는 안 되는 데가 조용해서 못 고치는 거예요. 소리부터 들어요.',
        "I fix anything on a boat. Except manuscripts. (Machine repair settles into my hands.)\n\nMachines don't lie. The broken part always makes a noise. Manuscripts go quiet where they're broken — that's why I can't fix them. Listen for the sound first.",
      ],
      pay: [
        '네. 원고료 들어왔어요, 드디어. (이번엔 봉투가 봉투답다.)\n\n부품값은 영수증대로, 품삯은 넉넉히요. 할아버지가 그러래요. 빚지기 싫다고요. 저는 빚져도 되는데, 할아버지는 안 된대요.',
        "Yes. The manuscript fee came through, finally. (This time the envelope is a proper envelope.)\n\nParts by the receipt, labour generously. Grandpa's orders. He doesn't want to owe. I'm allowed to owe, apparently, but he isn't.",
      ],
      decline: [
        '…그 자리, 저도 있어요. 옆에. (노인의 사진 앞에 셋의 자리가 있다.)\n\n할아버지는 자리를 만들어 주는 걸로 고맙다고 해요. 말 대신요. 이제 세 자리네요. 겨울에 셋이면 난로가 하나여도 따뜻할 거예요.',
        "…I've got a place there too. Beside him. (In front of the old man's photo there are three places.)\n\nGrandpa says thank you by making a place. Instead of words. Three places now. With three of us, one stove will keep the winter warm.",
      ],
    },
  },

  // ── N12-3 「호텔 로비의 캠핑카」 · 오가윤 ──
  'N12-3': {
    offer: [
      d('go_three', '셋이 가죠. 갈치는 안 물어도 됩니다.', "The three of us, then. The hairtail don't have to bite.",
        '…그 말 우미 씨도 했어요. 갈치는 핑계래요. (처음으로 편하게 웃는다.)\n\n방파제 끝, 다툰 날 앉았던 데요. 거기로 가요. 이번엔 셋이니까 자리가 좁을 거예요. 그래도 오늘은 좁은 게 좋아요.',
        "…Umi said that too. The hairtail's just an excuse, she says. (For the first time she smiles easily.)\n\nThe end of the breakwater. Where we sat on that bad day. Let's go there. There are three of us this time, so it'll be cramped. Tonight, cramped is good.",
        { affinity: 0.05 }),
      d('ask_half_year', '반년째라는 건, 우미 씨가 여기 머무신다는 겁니까?', "Half a year — so Umi's staying here?",
        '…머무는 건지, 못 떠나는 건지 저도 몰라요. 캠핑카는 원래 움직이는 집이잖아요. 그런데 반년째 시동을 안 걸어요. (호텔 주차장 쪽을 본다. 캠핑카 창에 불이 켜져 있다.)\n\n저는 그게 묻고 싶은데 못 물어요. 물으면 떠날까 봐요. 그래서 그 앞에 앉아만 있어요.',
        "…Whether she's staying or can't leave, I don't know. A camper's meant to be a house that moves. But she hasn't started the engine in half a year. (She looks toward the hotel car park. A light is on in the camper's window.)\n\nI want to ask, but I can't. In case asking makes her go. So I just sit in front of it.",
        { affinity: 0.04, flag: 'choice.n12_3_asked_camper' }),
      d('third_wheel', '두 분 사이에 제가 끼어도 되겠습니까?', "Are you sure you want me tagging along with you two?",
        '끼어 줘야 해요. 둘이면 또 말이 없어요. 셋이면 누구 하나는 말을 하잖아요. (부탁하는 눈이 진지하다.)\n\n다툰 날 옆에 앉아 준 사람이잖아요. 그 사람이 있으면 저도 우미 씨도 편해요. 갈치가 안 물어도 할 말이 생겨요.',
        "You have to. With just two of us, nobody talks again. With three, someone always says something. (Her eyes are serious as she asks.)\n\nYou sat beside me on that bad day. With you there, Umi and I both relax. Even if no hairtail bite, there'll be something to say.",
        { affinity: 0.03 }),
      d('long_stay', '반년이면 캠핑카가 호텔 손님보다 오래 묵었네요.', "Half a year — the camper's outstayed every hotel guest.",
        '…장기 투숙객이죠. 제일 조용한 손님이에요. 룸서비스도 안 시키고요. (웃음이 터진다. 금방 손으로 입을 가린다.)\n\n그래도 그 손님 덕에 주차장이 덜 쓸쓸해요. 밤에 불 켜진 창이 하나 있으니까요. 오늘은 그 창 주인이랑 셋이 나가요.',
        "…A long-stay guest. The quietest one we've got. Never orders room service. (She bursts out laughing, then covers her mouth.)\n\nStill, thanks to that guest the car park feels less lonely. There's one lit window at night. Tonight the three of us go out with the owner of that window.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('moon_bite', '갈치가 안 문 건 물때 탓이었을 겁니다. 다음엔 맞춰 오겠습니다.', "The hairtail not biting was probably the tide. I'll time it better next time.",
        '물때요? 저는 그런 거 몰라요. 우미 씨가 알아요. (캠핑카 쪽으로 고개를 돌려 묻고는 돌아온다.)\n\n우미 씨 말로는 갈치는 달 밝은 밤엔 불빛에 덜 모인대요. 물때보다 달이래요. 그러니까 다음엔 어두운 밤에 오래요. (밤 갈치가 붙는 날을 읽는 눈이 생긴다.)',
        "The tide? I don't know about that. Umi does. (She turns toward the camper, asks, and comes back.)\n\nUmi says hairtail gather less under the lamps on bright moonlit nights. More the moon than the tide. So come on a dark night next time, she says. (I get an eye for which nights the hairtail come.)",
        { proficiency: { category: 'fishing', xp: 20 }, affinity: 0.04 }),
    ],
    completeReply: {
      stay: [
        '…그 말, 우미 씨한테 해 줘요. 아니, 제가 할게요. (호텔 주차장에 캠핑카 전용 자리가 생겼다.)\n\n지배인님한테 말했더니 자리를 하나 그어 줬어요. 흰 선으로요. 캠핑카 자리. 이제 반년째가 아니라 그냥 여기예요.',
        "…Say that to Umi. No — I'll say it. (A camper bay appears in the hotel car park.)\n\nI asked the manager and got a space painted. White lines. A camper bay. It isn't half a year any more. It's just here.",
      ],
      lesson: [
        '가스 하나로 세 가지. 순서가 있어요. (선상 조리가 빨라진다.)\n\n물 끓이는 게 먼저, 그 물로 데치고, 마지막에 굽는 거래요. 우미 씨가 가르쳐 준 거예요. 저는 그 순서를 반년 동안 봤어요.',
        "Three dishes on one burner. There's an order to it. (Cooking afloat gets faster.)\n\nBoil water first, blanch in that water, grill last. Umi taught me. I've watched her do it in that order for half a year.",
      ],
      pay: [
        '…네. 호텔 직원 할인가로요. (웃으면서 준다.)\n\n직원 할인은 원래 손님한테는 안 돼요. 근데 오늘은 손님이 아니니까요. 친구죠. 친구한테는 할인이 맞아요. 규정에는 없지만요.',
        "…Yes. At the staff rate. (She pays, smiling.)\n\nThe staff rate isn't meant for guests. But tonight you're not a guest. You're a friend. Friends get the discount. It's not in the rules, mind.",
      ],
    },
  },

  // ── N10-4 「야간 창고의 불빛」 · 남궁현 ──
  'N10-4': {
    offer: [
      d('beside', '옆에서 던지겠습니다. 마지막 근무, 끝까지 같이 하겠습니다.', "I'll cast beside you. I'll see the last shift through with you.",
        '끝까지는 됐어. 한 마리면 돼. (창고 열쇠 꾸러미를 손에서 한 번 굴린다.)\n\n불은 내가 끈다. 넌 부두에 먼저 가 있어. 새벽 물 들어올 때 던진다. 그 전에 줄 꼬인 데 없나 봐 둬.',
        "Never mind to the end. One fish will do. (He rolls the bunch of warehouse keys once in his hand.)\n\nI'll turn the lights off. You go down to the pier first. We cast when the dawn tide comes in. Check your line for twists before then.",
        { affinity: 0.05 }),
      d('ask_next', '창고를 그만두신다고요? 그다음엔 어디로 가십니까?', "You're leaving the warehouse? Where to after that?",
        '…창고는 됐어. 상자는 충분히 날랐다. (대답 대신 대 가방 지퍼를 연다.)\n\n그다음은 나중에. 오늘은 마지막 근무 하고, 한 마리 하고. 그거면 돼. 질문은 여기까지.',
        "…I'm done with the warehouse. I've carried enough boxes. (Instead of answering, he unzips the rod bag.)\n\nWhat's next can wait. Tonight is the last shift and one fish. That's enough. Questions end there.",
        { affinity: 0.03, flag: 'choice.n10_4_asked_next' }),
      d('dawn_rod', '새벽 부두에서 던지시던, 그 대 말입니까?', "The rod you were casting off the pier at dawn?",
        '…못 본 걸로 하랬지. (짧게 코웃음을 친다.)\n\n그건 몰래 던진 거고, 오늘은 꺼내는 거야. 남 옆에서. 소리가 나든 말든. 그 차이는 던져 보면 알아.',
        "…I told you you didn't see that. (He gives a short snort.)\n\nThat was casting in secret. Today I'm taking it out. Next to someone. Sound or no sound. You'll know the difference when you cast.",
        { affinity: 0.04, flag: 'choice.n10_4_dawn_rod' }),
      d('my_noise', '제 캐스팅은 소리가 납니다. 옆에서 던져도 되겠습니까?', "My cast makes a sound. Is it all right if I'm beside you?",
        '소리 나는 게 뭐. 고기는 소리보다 그림자를 더 무서워해. (부두 등불 쪽으로 나를 한 걸음 옮겨 세운다.)\n\n불을 앞에 두고 서. 그래야 그림자가 물이 아니라 등 뒤로 떨어져. 소리는 그다음 문제야. 던져 봐.',
        "So it makes a sound. Fish fear shadows more than sound. (He moves me a step toward the pier lamp.)\n\nStand with the light in front of you. Then your shadow falls behind you, not on the water. Sound comes second. Cast.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('not_work', '마지막 일당은 사양하겠습니다. 오늘은 일이 아니었으니까요.', "I'll pass on the last day's wage. Tonight wasn't work.",
        '…일이 아니었다? (불 꺼진 창고 쪽을 돌아본다.)\n\n그래. 오늘은 일이 아니었지. 대를 꺼낸 날이 일일 리 없어. 그럼 장부에 안 적는다. 이 밤은 장부 밖이야. (그 새벽 둘이 나란히 던진 이야기가 포항 부두에 돈다.)',
        "…Wasn't work? (He looks back at the darkened warehouse.)\n\nNo. Tonight wasn't work. The night the rod came out can't be work. Then it doesn't go in the ledger. This night stays off the books. (Word goes round the Pohang pier of the two of us casting side by side that dawn.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      lesson: [
        '봤네. 손목이야. 그리고 놓는 순간. (캐스팅 비거리가 한 단계 는다.)\n\n어깨로 던지면 대가 운다. 그게 소리야. 손목으로 던지고, 대가 펴질 때 놔. 일찍 놓으면 하늘로 가고, 늦게 놓으면 발밑에 꽂혀.',
        "You saw. It's the wrist. And the moment you let go. (My casting distance rises a step.)\n\nThrow from the shoulder and the rod groans. That's the sound. Throw from the wrist and let go as the rod straightens. Too early and it goes skyward. Too late and it plants at your feet.",
      ],
      pay: [
        '창고에서. 마지막 일당. (봉투에 창고 열쇠가 하나 들어 있다. 기념이라고.)\n\n열쇠는 이제 아무 문도 안 열어. 내일 자물쇠를 바꾼대. 그래도 가져. 그 창고에서 밤을 같이 새운 사람은 몇 없어.',
        "Out of the store. Last day's wage. (There's a storeroom key in the envelope. A keepsake, he says.)\n\nThe key won't open anything now. They're changing the locks tomorrow. Take it anyway. Not many people sat up nights in that warehouse with me.",
      ],
    },
  },

  // ── N17-3 「퇴근 후 30분」 · 단철호 ──
  'N17-3': {
    offer: [
      d('rigs_first', '열두 명이면 채비부터 나눠야겠군요. 맡겨 주십시오.', "Twelve people — rigs first, then. Leave it to me.",
        '역시. 그 말 들으려고 데려온 거예요. (넥타이 열두 개가 한꺼번에 방파제로 내려온다.)\n\n반은 대를 처음 잡아요. 나머지 반은 잡아 봤다고 우기는 사람들이고요. 그쪽이 더 위험해요. 30분 안에 세 마리. 채비 나눠 주는 시간도 그 안이에요.',
        "There it is. That's what I brought them to hear. (Twelve neckties come down onto the breakwater at once.)\n\nHalf of them have never held a rod. The other half insist they have. That half's more dangerous. Three fish in thirty minutes. Handing out rigs counts inside that.",
        { affinity: 0.05 }),
      d('ask_dinner', '회식이라는 건, 낚시 끝나고 다 같이 드시러 가는 겁니까?', "A staff dinner — so you all go and eat afterwards?",
        '그 식당이요, 제 자리 비워 둔 데. 오늘은 열두 자리 비워 달라고 했어요. 사장님이 웃었어요. (휴대폰으로 예약 문자를 보여 준다.)\n\n잡은 건 식당에 드리고, 밥은 우리가 사 먹어요. 팔면 안 되니까요. 팀원들한테 그걸 보여 주고 싶었어요. 낚시도 규칙 지키면서 하는 거라고.',
        "That restaurant — the one that keeps my seat. I asked them to keep twelve tonight. The owner laughed. (He shows me the booking message on his phone.)\n\nThe catch goes to the restaurant, and we pay for our own food. Because we can't sell it. I wanted to show the team that. Fishing's something you do by the rules too.",
        { affinity: 0.04, flag: 'choice.n17_3_asked_dinner' }),
      d('tight_time', '30분에 열두 명이 세 마리라… 솔직히 빠듯합니다.', "Three fish in thirty minutes with twelve people… honestly, it's tight.",
        '빠듯하죠. 그래서 회식이에요. 다 잡으면 낚시고, 못 잡아도 웃으면 회식이에요. (시계를 보는 척하다가 웃는다.)\n\n세 마리는 그쪽 몫이에요. 팀원들은 한 마리도 못 잡아도 돼요. 대신 한 번씩은 던지게 해 줘요. 그게 오늘 제 부탁이에요.',
        "It's tight. That's why it's a staff dinner. Catch them all and it's fishing. Catch none but laugh and it's a staff dinner. (He pretends to check his watch, then laughs.)\n\nThe three fish are on you. The team can catch nothing. Just make sure everyone casts once. That's my one request today.",
        { affinity: 0.03 }),
      d('joke_overtime', '퇴근 후 30분이면, 이건 야근 수당이 나옵니까?', "Thirty minutes after work — does this count as overtime?",
        '야근이요? 쉿. 팀원들 들어요. 누가 수당 얘기 꺼내면 다음 회식이 노래방이 돼요. (진심으로 겁먹은 얼굴이다.)\n\n이건 자율 참가예요. 서류상으로는요. 근데 다들 자율적으로 다 왔어요. 그게 부장 십 년이에요.',
        "Overtime? Shh. The team will hear. If anyone mentions overtime pay, the next staff dinner turns into karaoke. (He looks genuinely frightened.)\n\nThis is voluntary. On paper. But every single one of them volunteered. That's ten years as a manager.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('first_cast', '처음 잡는 분들한테 던지는 법을 가르치는 데도 요령이 있더군요.', "There's a knack to teaching first-timers how to cast, too.",
        '길게 설명하면 아무도 안 들어요. 회의랑 같아요. 딱 하나만. 줄 잡은 손가락을 언제 놓는지. (손가락 하나를 들었다가 툭 놓는 시늉을 한다.)\n\n나머지는 던지면서 배워요. 가르치다 보면 내 캐스팅도 정리되고요. 부장이 신입한테 배우는 게 그거예요. (남에게 가르치며 내 캐스팅이 다듬어진다.)',
        "Explain it at length and nobody listens. Same as a meeting. Just one thing. When to let go with the finger holding the line. (He raises one finger, then mimes letting it drop.)\n\nThe rest they learn by casting. And teaching tidies up your own cast too. That's what a manager learns from new hires. (Teaching others tidies up my own casting.)",
        { proficiency: { category: 'fishing', xp: 22 }, affinity: 0.05 }),
    ],
    completeReply: {
      lesson: [
        '미리 묶어 와요. 그게 부장 십 년. (단체 출조 준비가 몸에 붙는다.)\n\n전날 밤에 열두 벌. 봉지마다 이름 써서요. 그러면 현장에선 나눠 주기만 하면 돼요. 준비는 전날, 현장은 웃는 거. 회식이랑 똑같아요.',
        "Tie them beforehand. That's ten years as a section chief. (Preparing group outings settles into my body.)\n\nTwelve sets the night before. A name on every bag. Then on site all you do is hand them out. Prep the night before, smile on the day. Just like a staff dinner.",
      ],
      pay: [
        '당연하죠. 법인카드! (가이드비가 법인카드로 결제된다. 영수증이 정갈하다.)\n\n영수증엔 팀 단합 행사라고 적혀요. 틀린 말은 아니죠. 열두 명이 한 방파제에서 한 번씩 웃었으니까. 그게 단합이에요.',
        "Of course. Corporate card! (The guide fee goes on the corporate card. The receipt is immaculate.)\n\nThe receipt says team-building event. Not wrong, either. Twelve people on one breakwater, each of them laughing at least once. That's team-building.",
      ],
      decline: [
        '…그 말 팀원들한테 했더니 다들 다음 회식도 낚시로 하재요. (인천 짬낚시 모임에 내 이름이 있다.)\n\n노래방보다 낫대요. 막내가 제일 크게 말했어요. 첫 마리를 놓친 게 막내거든요. 놓친 사람이 제일 다시 오고 싶어 해요.',
        "…I told them that and now they want the next dinner to be fishing too. (My name is on the Incheon after-work list.)\n\nBetter than karaoke, they say. The youngest said it loudest. The youngest lost the first fish. The ones who lose one always want to come back most.",
      ],
    },
  },

  // ── N16-4 「독구의 첫 제자」 · 석독구 ──
  'N16-4': {
    offer: [
      d('watch_only', '알았다. 오늘은 네가 선생이다. 나는 보기만 하마.', "All right. Today you're the teacher. I'll just watch.",
        '응! 너는 보기만 해. 틀려도 말하지 마. 내가 고칠게. (어깨를 펴고 조사단 형 쪽으로 손짓한다.)\n\n형한테는 미끄러운 데부터 가르칠 거야. 고기보다 그게 먼저래. 누가 그랬더라. …네가 그랬나.',
        "Yeah! You just watch. Don't say anything even if I'm wrong. I'll fix it. (He squares his shoulders and waves the survey student over.)\n\nI'm teaching him the slippery spots first. That comes before fish, somebody said. Who was it… was it you?",
        { affinity: 0.05 }),
      d('ask_student', '조사단 사람이 제자라고? 대학생이 열두 살한테 배운다고?', "Your apprentice is a university student? Learning from a twelve-year-old?",
        '응. 형이 책은 많이 읽었는데 갯바위는 처음이래. 첫날 미끄러질 뻔했어. 그래서 내가 가르쳐 준다고 했지. (자랑스러운 걸 숨기지 못한다.)\n\n책에는 돌돔 줄무늬가 몇 개인지는 나오는데, 어디를 디디면 미끄러운지는 안 나온대. 그건 내가 알아. 그러니까 내가 선생이야.',
        "Yep. He's read loads of books, but it's his first time on the rocks. Nearly slipped on day one. So I said I'd teach him. (He can't hide how proud he is.)\n\nBooks tell you how many stripes a beakperch has, but not where it's slippery underfoot, he says. I know that. So I'm the teacher.",
        { affinity: 0.04, flag: 'choice.n16_4_asked_student' }),
      d('tease_teacher', '선생 소리 들으니까 기분 좋냐?', "Feels good being called teacher, eh?",
        '…좋아. 엄청. (얼굴이 빨개지는데 아니라고는 안 한다.)\n\n근데 형이 나보다 키가 두 배야. 선생이 올려다보면서 가르쳐. 그건 좀 이상해. 그래도 형이 내 말을 다 들어. 할아버지보다 잘 들어.',
        "…Yeah. Loads. (His face goes red, but he doesn't deny it.)\n\nBut he's twice as tall as me. The teacher teaches looking up. That's kind of weird. Still, he listens to everything I say. Better than Grandpa does.",
        { affinity: 0.03 }),
      d('safety_first', '갯바위는 위험하다. 제자 안전까지 네가 책임질 수 있겠냐?', "The rocks are dangerous. Can you take responsibility for his safety too?",
        '할 수 있어. 아니, 해야 돼. 선생이니까. (진지하게 고개를 끄덕인다.)\n\n구명조끼 확인하고, 물 들어오면 먼저 나오고, 젖은 데는 안 딛고. 다 외웠어. 네가 나한테 한 거 그대로 할 거야. 그럼 아무도 안 다쳐.',
        "I can. No — I have to. I'm the teacher. (He nods seriously.)\n\nCheck the life jacket, come off first when the tide comes in, don't step on the wet bits. I've got it all memorised. I'll do exactly what you did with me. Then nobody gets hurt.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('your_teaching', '수업료는 됐다. 가르친 건 너니까.', "No tuition for me. You did the teaching.",
        '…가르친 건 나지. 맞아. (아이가 어깨를 편다.)\n\n그래도 네가 먼저 나한테 가르쳤잖아. 그러니까 반은 네 거야. 형한테 말해 둘게, 내 선생의 선생이라고. (독도 조사단 사람들 사이에 독구 선생의 선생으로 내 이름이 돈다.)',
        "…I did the teaching. That's right. (He squares his shoulders.)\n\nBut you taught me first. So half of it's yours. I'll tell him you're my teacher's teacher. (Among the Dokdo survey team, my name goes round as Teacher Dokgu's teacher.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      same: [
        '…너도 누구한테 배웠지? (정옥선 씨 이야기를 한다. 아이가 오래 듣는다.)\n\n그럼 할머니가 맨 처음이야? 아니면 할머니도 누구한테 배웠어? …그럼 끝이 없네. 그거 좋다. 나도 끝 안 낼 거야.',
        "…You learned it from somebody too, right? (I tell him about Okseon. He listens a long time.)\n\nSo was she the very first? Or did she learn from somebody too? …Then it never ends. I like that. I won't end it either.",
      ],
      lesson: [
        '가르치는 법? 그냥 옆에 서. (사람 옆에 서는 법을 한 번 더 배운다.)\n\n앞에 서면 형이 내 등만 봐. 뒤에 서면 내가 형을 못 봐. 옆에 서야 둘 다 바다를 봐. 너도 맨날 내 옆에 섰잖아.',
        "How to teach? You just stand beside them. (I learn again how to stand beside someone.)\n\nStand in front and he only sees my back. Stand behind and I can't see him. Stand beside and we both see the sea. You always stood beside me, remember.",
      ],
      pay: [
        '수업료! 네가 줘? …아이스크림. (조사단이 대신 낸다. 아이가 제자한테 사 준다.)\n\n선생이 사 주는 거야. 원래 그래. 너도 나한테 사 줬잖아. 아니, 그건 내가 산 건가. 아무튼 이번엔 내가 사.',
        "Tuition! From you? …Ice cream. (The survey team pays instead. He buys for his student.)\n\nThe teacher buys. That's how it goes. You bought me some too. Or did I buy those? Anyway, this time I'm buying.",
      ],
    },
  },

  // ── N14-5 「다시 제주」 · 오세린 ──
  'N14-5': {
    offer: [
      d('front_row', '간다. 운영진 첫 개회 선언, 맨 앞에서 듣겠다.', "I'm coming. I'll hear your first opening speech from the front row.",
        '맨 앞이요? 그럼 저 더 떨리는데요! (마이크를 쥔 시늉을 하다가 손을 털어 낸다.)\n\n선언문은 세 줄이에요. 길게 쓰면 다들 안 들어서요. 유리아 언니가 그랬어요. 세 줄 넘으면 방송 사고래요.',
        "The front? Then I'll be even more nervous! (She mimes gripping a microphone, then shakes her hands out.)\n\nThe speech is three lines. Write it long and nobody listens. Ria told me. Anything over three lines is a broadcast accident, she says.",
        { affinity: 0.05 }),
      d('ask_committee', '운영진이라니, 대회를 네가 직접 짜는 거야?', "On the committee — so you're actually running the tournament?",
        '네! 계측대 자리, 순서표, 참가자 명단, 다 제가 짰어요. 선수일 때는 몰랐는데, 대회 하나에 의자가 몇 개 필요한지 아세요? (수첩을 펼친다. 빼곡하다.)\n\n선수로는 순위만 봤는데, 운영진으로는 다 보여요. 누가 늦게 오는지, 누가 혼자 오는지. 혼자 오는 사람한테는 제가 먼저 인사해요.',
        "Yes! Where the measuring table goes, the running order, the entry list — I planned it all. As a competitor I never knew. Do you know how many chairs one tournament needs? (She opens her notebook. It's crammed.)\n\nAs a competitor I only saw placings. On the committee I see everything. Who's late, who comes alone. Anyone who comes alone, I say hello to first.",
        { affinity: 0.04, flag: 'choice.n14_5_asked_committee' }),
      d('ask_camera', '마라가 카메라를 들었다고? 낚싯대 말고?', "Mara's holding a camera? Not a rod?",
        '네. 언제 배웠는지는 몰라요. 근데 던지는 사람 손을 제일 잘 찍는 게 마라예요. 자기가 던져 봤으니까요. (먼 쪽 갯바위를 가리킨다. 삼각대 옆에 낯익은 뒷모습이 있다.)\n\n낚싯대는요? 하고 물어봤는데 웃기만 했어요. 그래도 그 웃음이면 됐어요.',
        "Yes. I don't know when she learned. But nobody films casting hands better than Mara. Because she's cast herself. (She points to the far rocks. A familiar back stands beside a tripod.)\n\nI asked, what about your rod? She just smiled. That smile was enough.",
        { affinity: 0.04, flag: 'choice.n14_5_asked_mara' }),
      d('no_crying', '운영진이 마이크 잡고 울면 안 된다.', "Committee members aren't allowed to cry at the mic.",
        '안 울어요! …아마요. 울면 마라가 그거 찍을 거예요. 평생 놀림감이에요. (벌써 눈가가 조금 빨갛다.)\n\n그러니까 맨 앞에 있어 줘요. 그쪽 보면 웃음이 나서 안 울 거예요. 그거 칭찬이에요.',
        "I won't cry! …Probably. If I cry, Mara will film it. I'd never live it down. (The rims of her eyes are already a little red.)\n\nSo be in the front row. If I see you I'll laugh and won't cry. That's a compliment.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('my_wish', '여비는 됐다. 개회 선언 들으러 온 건 내 마음이다.', "Forget the travel money. Coming to hear the opening was my own choice.",
        '그쪽 마음이요? …그 말 유리아 언니가 들었으면 해설에 넣었을 거예요. (운영 수첩 귀퉁이에 무언가 적는다.)\n\n그럼 운영비는 아껴서 내년 참가자 간식에 쓸게요. 운영진은 그런 것도 정할 수 있거든요. (제주 대회 운영진 명부에 초청 손님으로 내 이름이 남는다.)',
        "Your own choice? …If Ria had heard that, it'd be in her commentary. (She writes something in the corner of her committee notebook.)\n\nThen I'll save the budget for next year's competitors' snacks. The committee gets to decide things like that. (My name stays in the Jeju committee's book as an invited guest.)",
        { affinity: 0.08, harborRep: 2 }),
    ],
    completeReply: {
      stayed: [
        '결말 아니에요! 시작이에요! (셋이 찍은 두 번째 사진. 이번엔 내가 안에 있다.)\n\n이 사진은 해마다 찍을 거예요. 대회 마지막 날, 같은 자리에서요. 그러니까 내년에도 와요. 그쪽 자리는 비워 둘게요.',
        "It isn't an ending! It's the start! (A second photo of the three of them. This time I'm in it.)\n\nWe're taking this photo every year. The last day of the tournament, same spot. So come next year too. I'll keep your place.",
      ],
      lesson: [
        '계측대 위치부터요! 그늘에! (대회 운영이 손에 붙는다.)\n\n햇볕에 두면 고기가 금방 상하고, 기다리는 사람도 지쳐요. 그다음이 화장실, 그다음이 물. 순위표는 맨 나중이에요. 다들 그걸 제일 먼저 하더라고요.',
        "Start with where the measuring table goes! In the shade! (Running events settles into my hands.)\n\nIn the sun the fish spoil fast and the people waiting wilt. Then toilets, then water. The leaderboard comes last. Everyone does that first, I've noticed.",
      ],
      pay: [
        '네! 운영비에서! 처음 써 봐요, 운영비! (여비가 정확하다. 운영진답다.)\n\n영수증도 드릴게요. 운영비는 한 푼까지 적어야 해요. 그래야 다음 운영진이 믿고 받아요. 선수일 때 그게 제일 궁금했거든요, 참가비가 어디로 가는지.',
        "Yes! Out of the operating budget! First time I've used it! (The amount is exact. Very organiser.)\n\nHere's the receipt too. Every won of the budget has to be written down. That way the next committee can trust it. When I was competing, that's what I always wondered — where the entry fees went.",
      ],
    },
  },
};
