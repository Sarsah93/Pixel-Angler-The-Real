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
};
