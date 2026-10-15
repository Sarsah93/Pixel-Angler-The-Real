/**
 * @file StoryTalkN03.ts
 * @description 254차 — N03 「강두철 — 채비 못 묶는 초보, 실은 수협 조합장」 이어지는 대화. 규칙은 `StoryTalks.ts` 머리 주석.
 *
 * 인물: 강두철(63 · 들키기 전에는 방파제의 초보 노인 — 「허허」 · 「자네」 · 「젊은이」 · 스스로를 낮춘다.
 *   들킨 뒤(교육장)에는 말이 담백해진다 — 「미안하네」 · 「선생은 선생이야, 조합장이 아니라」).
 * 스포일러 선(R2): 받는 자리 · 채비 풀기 · 스무 번째 채비에서는 초보 노인이다 — 손 · 눈 · 인사받는 모습 같은 단서만.
 *   직함(조합장 · 수협)은 교육장 대화부터. 다른 사람 = 동명항 어촌계(`coop` — 교육장 문간 · 총회장 안) · 도현수(문간).
 * 결말은 정본 하나(`n03_roll`) — 명부 1번 칸은 늘 비어서 기다린다. 대화는 마지막 인사가 앞의 말을 기억하게 할 뿐이다.
 *
 * 표시 — 남기는 곳 → 읽는 곳
 *  choice.n03_had_doubts      받기 · 채비 풀기 · 스무 번째 — 초보가 아니라는 낌새를 입 밖에 냈다 → 교육장
 *  choice.n03_patient         채비 풀기 — 천천히 다 풀어 줬다 → 교육장 · 은퇴 인사
 *  choice.n03_impatient       채비 풀기 — 칼로 끊었다 → 스무 번째 · 교육장 · 은퇴 인사
 *  choice.n03_let_him         채비 풀기 — 직접 풀게 했다 → 스무 번째 · 교육장 · 은퇴 인사
 *  choice.n03_kept_teaching   교육장 — 계속 가르친다 → 표결 전 · 은퇴 인사
 *  choice.n03_kept_distance   교육장 — 거리를 둔다 → 표결 전 · 은퇴 인사
 *  choice.n03_called_out      교육장 — 속인 것을 따졌다 → 표결 전 · 은퇴 인사
 *  choice.n03_asked_favor     표결 전 — 한마디 거들어 달라고 했다 → 은퇴 인사
 *  (읽기만) choice.n03_seal   표결 편 끝내는 자리 「찍지 않은 도장」 답 → 은퇴 인사
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, say, endTalk } from './StoryTalkKit.js';

const K = 'kang_ducheol';

export const TALKS_N03: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N03-1 「선생님」 — 받는 자리(강두철 · 아직 초보 노인). 지나가던 어민이 그에게 허리를 굽힌다(단서만)
  // ═══════════════════════════════════════════
  {
    id: 'n03_1_offer', questId: 'N03-1', at: 'offer', npcId: K, start: 'start',
    nodes: {
      start: say(
        '(방파제 끝, 엉킨 실뭉치를 무릎에 올려놓고 쩔쩔매고 있다. 지나가던 어민 하나가 노인에게 허리를 꾸벅 굽히고 지나간다.)\n\n이 매듭이 자꾸 풀리는데 말이지. 풀려고 당기면 더 감기고. (멋쩍게 웃는다.) 젊은이, 혹시 채비 볼 줄 아나. 옆에 좀 앉아 주면 고맙고.',
        "(At the end of the breakwater he's fumbling with a tangled ball of line on his knee. A passing fisherman bows deeply to the old man as he goes by.)\n\nThis knot keeps coming undone, you see. And when I pull to undo it, it winds tighter. (He laughs sheepishly.) Young man, do you know rigs, by any chance? I'd be grateful if you sat with me a while.",
        [
          opt('sit_down', '그럼요. 옆에 앉겠습니다. 천천히 같이 풀어 보죠.', "Of course. I'll sit with you. Let's work it loose together, slowly.",
            { stance: 'giver', aff: { [K]: 0.04 }, next: 'sit' }),
          opt('who_bowed', '방금 지나간 분, 어르신께 인사가 아주 깍듯하던데요.', 'That man who just went by bowed to you very properly.',
            { stance: 'mid', next: 'bowed' }),
          opt('nest', '이 정도면 매듭이 아니라 갈매기 둥지인데요.', "At this point that's not a knot, it's a seagull's nest.",
            { stance: 'self', aff: { [K]: 0.01 }, end: endTalk({ accept: true,
              lineKo: '허허! 갈매기 둥지라, 그 말 맞네. 한 시간을 감고 돌렸더니 이 모양이야. (실뭉치를 내 무릎에 얹는다.) 둥지 허무는 재주는 젊은이한테 있어 보이니 맡기겠네.',
              lineEn: "Ha! A seagull's nest. You're right. I wound and twisted for an hour and this is what came of it. (He sets the ball on my knee.) The knack for taking nests apart looks like yours, young man, so I'll leave it to you." }) }),
          opt('busy', '죄송합니다. 지금은 제 채비 챙기기도 바빠서요.', "Sorry. Right now I've got my hands full with my own rig.",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({ decline: true,
              lineKo: '(허허 웃으며 손을 내젓는다.) 아니야, 젊은이 시간 뺏을 일은 아니지. 늙은이는 여기 계속 앉아 있을 테니, 지나가다 생각나면 들르게.',
              lineEn: "(He laughs and waves a hand.) No, no, it's not worth your time, young man. The old man will be sitting right here, so drop by if you think of it on your way past." }) }),
        ]),
      sit: say(
        '(엉덩이를 들썩여 자리를 내준다.) 고맙네, 고마워. 이게 원줄이고 이게 목줄이라는 것까진 알겠는데, 그다음부터는 영 모르겠어.\n\n(실뭉치를 두 손으로 받쳐 내민다. 손바닥 굳은살이 유난히 두껍다.) 천천히 하게. 늙은이는 급할 게 없는 사람이야.',
        "(He shifts over to make room.) Thank you, thank you. I know this is the main line and this is the leader, but past that I'm lost.\n\n(He holds out the tangled ball in both hands. The calluses on his palms are unusually thick.) Take your time. An old man has nothing to hurry for.",
        [
          opt('take_it', '(실뭉치를 받아 무릎에 올린다.)', '(I take the ball of line and set it on my knee.)',
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '(옆에 바짝 붙어 앉아 내 손을 들여다본다.) 허허, 남의 손 보는 게 늙은이 낙이야. 어디 한번 보세.',
              lineEn: "(He sits right up close and watches my hands.) Ha, watching other people's hands is an old man's pleasure. Let's have a look." }) }),
          opt('your_palm', '손바닥 굳은살이 낚시 처음 하시는 손 같지 않은데요.', "Those calluses don't look like the hands of someone new to fishing.",
            { stance: 'other', flags: ['choice.n03_had_doubts'], end: endTalk({ accept: true,
              lineKo: '(손을 슬쩍 소매 안으로 넣는다.) 허허, 늙은이 손은 이것저것 쥐어 본 손이라 그래. 그물도 쥐어 보고, 노도 쥐어 보고. …자, 줄이나 보세.',
              lineEn: "(He slips his hands into his sleeves.) Ha, an old man's hands have gripped all sorts of things, that's all. Nets, oars. ...Now, let's look at this line." }) }),
        ]),
      bowed: say(
        '(손을 내젓는다.) 허허, 이 동네에 오래 살면 다들 인사는 하지. 늙은이 대접이야.\n\n(실뭉치를 슬쩍 들어 보인다.) 대접받는 늙은이가 매듭 하나를 못 묶네. 이거 좀 봐 주겠나.',
        "(He waves a hand.) Ha, live in this town long enough and everyone says hello. It's how they treat the old.\n\n(He holds up the ball of line a little.) And here's an old man so well treated he can't tie one knot. Would you take a look at this?",
        [
          opt('fair_enough', '오래 사신 분 대접이군요. 자, 줄 좀 보죠.', "That's respect for a long life, then. Here, let me see the line.",
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '그렇지, 그렇지. (자리를 내주며 웃는다. 웃음이 조금 빠르다.) 늙은이 대접은 이걸로 충분하네. 앉게.',
              lineEn: "That's it, that's it. (He laughs as he makes room. The laugh comes a little too quickly.) That's all the respect an old man needs. Sit." }) }),
          opt('not_usual', '그 정도 인사면 보통 분은 아니신 것 같은데요.', "A bow like that, you must be no ordinary man.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({ accept: true,
              lineKo: '(눈을 끔벅이다 허허 웃는다.) 보통 늙은이야. 매듭 하나 못 묶는. …보통이 아니면 이러고 있겠나. 자, 앉게.',
              lineEn: "(He blinks, then laughs.) An ordinary old man. Who can't tie one knot. ...Would I be sitting here like this if I weren't? Come, sit." }) }),
        ]),
    },
  },

  // N03-1 — 진행 중: 채비를 풀어 준다(목표 0). 가르치는 태도 — 천천히 다 풀어 준다 · 끊고 새로 · 직접 풀게 한다
  {
    id: 'n03_1_untangle', questId: 'N03-1', at: 'objective', objectiveIndex: 0, npcId: K, start: 'start',
    nodes: {
      start: say(
        '(실뭉치를 내 무릎에 얹고 바짝 붙어 앉는다.) 자, 어디서부터 풀면 되나. 끝을 찾으면 된다고 책에 있던데, 끝이 안 보여.\n\n(손가락으로 실을 이리저리 들춘다. 들출수록 더 감긴다.) 허허, 이것 봐. 또 감겼네. 젊은이, 늙은이 손은 놔두고 자네가 좀 해 보게.',
        "(He sets the ball on my knee and sits right up close.) Now, where do we start? The book said find the end, but I can't see an end.\n\n(He picks at the line here and there with his fingers. The more he picks, the tighter it winds.) Ha, look at that. Wound up again. Young man, never mind an old man's hands. You have a go.",
        [
          opt('patient', '손 놓고 보고 계세요. 끝부터 하나씩 천천히 풀겠습니다.', "Just let go and watch. I'll work it loose from the end, one bit at a time.",
            { stance: 'giver', aff: { [K]: 0.04 }, flags: ['choice.n03_patient'], next: 'slow' }),
          opt('cut_it', '이건 끊고 새로 묶는 게 빠르겠습니다.', "It'd be quicker to cut this and tie a new one.",
            { stance: 'self', aff: { [K]: -0.03 }, flags: ['choice.n03_impatient'], next: 'cut' }),
          opt('your_hands', '제가 말로 할 테니 직접 풀어 보세요. 그래야 다음에 안 엉키십니다.', "I'll talk you through it, you do the untangling. That way it won't tangle next time.",
            { stance: 'mid', aff: { [K]: 0.02 }, flags: ['choice.n03_let_him'], next: 'self_tie' }),
        ]),
      slow: say(
        '(손을 무릎에 얹고 내 손끝만 본다. 눈이 한 번도 엉뚱한 데로 가지 않는다.) …그렇게 고리를 먼저 넓혀 주는 거로군. 당기는 게 아니라.\n\n(엉킨 데가 하나씩 풀려 나간다.) 허허, 십 분이 금방 가네. 남의 손 구경이 이렇게 재미있는 줄 몰랐어.',
        "(He rests his hands on his knees and watches only my fingertips. His eyes never once wander.) ...So you widen the loop first. Instead of pulling.\n\n(The tangle comes loose one piece at a time.) Ha, ten minutes gone in no time. I never knew watching someone else's hands could be such fun.",
        [
          opt('next_you', '다음엔 어르신이 해 보세요. 제가 옆에서 볼게요.', "Next time you try it. I'll watch from beside you.",
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '허허, 젊은이가 시키면 해야지. (눈을 가늘게 뜨고 풀린 줄을 노려본다.) 자, 이제 고기 얼굴이나 보세. 옆에 있어 주게.',
              lineEn: "Ha, if the young man says so, I'd better. (He narrows his eyes and glares at the loosened line.) Now, let's go and see a fish's face. Stay beside me." }) }),
          opt('you_watched', '보시는 눈이 처음 배우시는 눈이 아니던데요.', "The way you watch isn't the way a first-timer watches.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({
              lineKo: '(눈을 끔벅인다.) 허허, 늙은이가 할 일이 없어 눈만 바빴지. …자, 다 풀렸으면 넣어 보세. 고기 얼굴 좀 보자고.',
              lineEn: "(He blinks.) Ha, an old man with nothing to do keeps his eyes busy, that's all. ...Now, if it's loose, let's put it in. I want to see a fish's face." }) }),
          opt('done_now', '다 풀렸습니다. 이제 고기만 기다리면 됩니다.', "It's all loose. Now we just wait for a fish.",
            { stance: 'self', end: endTalk({
              lineKo: '고맙네, 고마워. (풀린 줄을 손바닥에 받쳐 든다.) 이제 물에 넣으면 되는 거지? 옆에 좀 더 앉아 있어 주게. 첫 입질은 같이 보고 싶어서.',
              lineEn: "Thank you, thank you. (He holds the freed line on his palm.) Now it just goes in the water, yes? Sit with me a little longer. I'd like to see the first bite together." }) }),
        ]),
      cut: say(
        '(잘린 실 끝을 한참 내려다본다.) …허, 빠르긴 빠르군. 한 시간 감은 걸 칼 한 번에.\n\n(웃음이 조금 늦게 온다.) 그래, 새로 묶으면 되지. 다만 늙은이는 이게 왜 엉켰는지가 궁금했는데. 끊으면 그건 영영 모르지.',
        "(He stares down at the cut ends for a long while.) ...Ha, quick, I'll give you that. An hour's winding, gone in one stroke of the knife.\n\n(His laugh comes a little late.) Right, we just tie a new one. Only, this old man wanted to know why it tangled. Cut it and you'll never know.",
        [
          opt('sorry_why', '죄송합니다. 다음엔 왜 엉켰는지부터 같이 보죠.', "Sorry. Next time let's look at why it tangled first.",
            { stance: 'mid', aff: { [K]: 0.03 }, end: endTalk({
              lineKo: '허허, 그럼 다음 엉킴이 기다려지는군. (새 목줄을 내민다.) 이번 건 처음부터 같이 묶세. 천천히.',
              lineEn: "Ha, then I'll look forward to the next tangle. (He holds out a fresh leader.) Let's tie this one together from the start. Slowly." }) }),
          opt('water_first', '낚시는 물에 빨리 넣는 사람이 남는 겁니다.', "In fishing, the one who gets in the water fastest comes out ahead.",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({
              lineKo: '(새 목줄을 받아 든다. 묶는 손이 이상하게 내 손보다 빠르다.) …그것도 맞는 말이지. 자, 넣어 보세. 빨리.',
              lineEn: "(He takes the fresh leader. Oddly, his hands tie it faster than mine.) ...That's true enough too. Come, let's put it in. Quickly." }) }),
        ]),
      self_tie: say(
        '(머뭇거리다 실을 쥔다. 내 말을 따라 고리를 넓히는가 싶더니, 손가락이 갑자기 빨라진다. 엉킨 데가 스르르 풀린다.) …어, 어. 이게 풀렸네?\n\n(멈칫하고 손을 거둔다.) 허허, 초보 운이 좋구먼. 젊은이가 말로 잘 일러 준 덕이야.',
        "(He hesitates, then takes hold of the line. He seems to be widening the loop as I tell him, then his fingers suddenly speed up. The tangle slides loose.) ...Oh, oh. It's come undone?\n\n(He stops short and pulls his hands back.) Ha, beginner's luck. Thanks to the young man talking me through it so well.",
        [
          opt('too_fast', '방금 손, 처음 하시는 손이 아니던데요.', "Those hands just now weren't a first-timer's hands.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({
              lineKo: '(손을 소매 안으로 넣는다.) 허허, 젊은이가 잘 가르치니 손이 먼저 알아들은 게지. …자, 고기나 보세.',
              lineEn: "(He tucks his hands into his sleeves.) Ha, you teach so well my hands understood before I did. ...Now, let's look for a fish." }) }),
          opt('well_done', '잘하셨어요. 그 손이면 금방 느시겠습니다.', "Well done. With hands like that, you'll improve in no time.",
            { stance: 'giver', aff: { [K]: 0.03 }, end: endTalk({
              lineKo: '허허, 칭찬받으니 늙은이 어깨가 다 들썩이네. (풀린 줄을 소중하게 감는다.) 젊은이 덕이야. 이제 고기 얼굴이나 보세.',
              lineEn: "Ha, a bit of praise and the old man's shoulders are dancing. (He winds the freed line carefully.) It's thanks to you. Now let's go and see a fish's face." }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N03-5 「도래 스무 개」 — 행동 단계: 스무 번째 채비를 보여 준다(목표 1 · 셋째 단계). 아직 초보 행세 — 셈이 지나치게 정확하다
  // ═══════════════════════════════════════════
  {
    id: 'n03_5_twentieth', questId: 'N03-5', at: 'action', objectiveIndex: 1, step: 2, npcId: K, start: 'start',
    nodes: {
      start: say(
        '(도래 봉지를 거꾸로 털어 빈 것을 확인한다.) …열여덟, 열아홉. 자, 마지막 하나. 스물이야.\n\n(내가 묶은 스무 번째 채비를 받아 매듭을 눈높이로 든다. 당겨 보는 손목이 짧고 정확하다.) 허허, 이제 손이 기억하나 보네. 자네가 보기엔 어떤가, 이 매듭.',
        "(He shakes the swivel bag upside down to check it's empty.) ...Eighteen, nineteen. Right, the last one. Twenty.\n\n(He takes the twentieth rig I tied and holds the knot up at eye level. The flick of his wrist as he tests it is short and exact.) Ha, looks like your hands remember now. What do you make of this knot yourself?",
        [
          opt('proud', '스무 번째가 제일 잘 묶였습니다. 손이 저절로 움직이더라고요.', 'The twentieth came out best. My hands moved on their own.',
            { stance: 'giver', aff: { [K]: 0.03 }, next: 'good' }),
          opt('check_it', '어르신이 한번 당겨 봐 주세요. 제 눈엔 아직 모르겠습니다.', "Would you give it a pull, sir? I still can't tell by eye.",
            { stance: 'mid', next: 'tug' }),
          opt('just_twenty', '스무 개 다 묶었으니 이제 됐죠? 손목이 저립니다.', "That's all twenty tied, so we're done, right? My wrist is numb.",
            { stance: 'self', aff: { [K]: -0.02 }, next: 'tired' }),
          opt('no_knife', '이번엔 칼 한 번 안 대고 스무 번을 다 묶었습니다.', "This time I tied all twenty without touching the knife once.",
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_impatient' }, end: endTalk({
              lineKo: '(허허 크게 웃는다.) 그날 칼로 툭 끊던 젊은이가 스물을 다 채웠어. (매듭을 엄지로 쓸어 본다.) 가르치는 쪽이 더 배운다는 게 이거야. 아니, 배우는 쪽이 더 가르치는 건가.',
              lineEn: "(He laughs out loud.) The young man who snipped through with a knife that day has tied all twenty. (He runs his thumb over the knot.) This is what they mean, the one teaching learns more. Or is it the one learning who teaches more?" }) }),
        ]),
      good: say(
        '그렇지. 열 번째부터 자네 손가락이 저 혼자 가더군. 그때부터 세는 게 즐거웠어.\n\n(매듭을 한 번 더 당겨 본다. 꿈쩍도 안 한다.) 이 매듭이 자네 채비를 몇 번은 살릴 거야. 급할 때 머리는 잊어도 손은 안 잊거든.',
        "That's right. From the tenth on, your fingers went by themselves. Counting was a pleasure from then.\n\n(He tugs the knot once more. It doesn't budge.) This knot will save your rig a few times. In a hurry the head forgets, but the hands don't.",
        [
          opt('thanks_count', '세어 주셔서 끝까지 했습니다. 고맙습니다.', 'I made it to the end because you counted. Thank you.',
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '허허, 늙은이가 할 줄 아는 게 셈뿐이라. (빈 도래 봉지를 접는다.) 다음엔 다른 매듭을 들고 오지. 선생님한테 배울 게 아직 많아.',
              lineEn: "Ha, counting is all an old man's good for. (He folds up the empty swivel bag.) Next time I'll bring a different knot. I've plenty more to learn from my teacher." }) }),
          opt('how_know', '열 번째부터인 걸 어떻게 아셨어요? 저도 몰랐는데요.', "How did you know it was from the tenth? I didn't even know myself.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({
              lineKo: '(잠깐 말이 없다가 허허 웃는다.) 늙은이 눈이 심심해서 손만 봤지. 손은 거짓말을 안 하거든. …자, 이걸로 고기나 셋 낚아 보세.',
              lineEn: "(He's quiet a moment, then laughs.) An old man's eyes get bored, so I watched your hands. Hands don't lie. ...Now, let's catch three fish with these." }) }),
          opt('you_tie', '이번엔 어르신도 하나 묶어 보세요. 그날처럼요.', 'This time you tie one too, sir. Like that first day.',
            { stance: 'mid', aff: { [K]: 0.01 }, flags: ['choice.n03_had_doubts'], requires: { flag: 'choice.n03_let_him' }, end: endTalk({
              lineKo: '(도래 하나를 집더니 눈 깜짝할 새 묶어 낸다. 그러고는 얼른 내 채비 뒤에 숨긴다.) 허허, 이건 못 본 걸로 하게. 늙은이 손이 또 먼저 나갔어.',
              lineEn: "(He picks up a swivel and ties it in the blink of an eye. Then he quickly hides it behind my rig.) Ha, pretend you didn't see that. The old man's hands ran ahead again." }) }),
        ]),
      tug: say(
        '(매듭 끝을 손톱으로 짚는다.) 끝을 너무 바짝 잘랐어. 손톱만큼은 남겨야 해. 당기다 보면 조금씩 빨려 들어가거든.\n\n(말해 놓고 아차 하는 얼굴이다.) …허허, 어디서 들은 말이야. 책에서 봤나. 늙은이가 아는 척을 했네.',
        "(He points at the end of the knot with a fingernail.) You trimmed the end too close. Leave a fingernail's worth. It creeps in a little as you pull.\n\n(He looks as if he wishes he hadn't said it.) ...Ha, something I heard somewhere. Read it in a book, maybe. An old man showing off.",
        [
          opt('noted', '손톱만큼이요. 기억해 두겠습니다.', "A fingernail's worth. I'll remember that.",
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '그래, 그거면 돼. (빈 도래 봉지를 접어 주머니에 넣는다.) 스물. 이제 눈 감고도 묶겠네. 이걸로 셋만 낚아 보이면 끝이야.',
              lineEn: "Right, that's all it takes. (He folds the empty swivel bag into his pocket.) Twenty. You could tie it with your eyes shut now. Land three on these and you're done." }) }),
          opt('book_doubt', '책에서 보신 것치고는 너무 정확하신데요.', "That's awfully precise for something out of a book.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({
              lineKo: '(손을 소매 안으로 넣는다.) 허허, 늙은이가 책을 많이 읽었나 보지. …스물. 잘했네, 선생님. 진짜로.',
              lineEn: "(He tucks his hands into his sleeves.) Ha, I suppose the old man reads a lot of books. ...Twenty. Well done, teacher. Truly." }) }),
        ]),
      tired: say(
        '(허허 웃는다.) 저리지. 스무 번이면 저려야 해. 저린 데까지 가야 손이 기억하는 거야.\n\n(그래도 눈빛이 조금 서운하다.) 열 번에서 멈추는 사람이 대부분이야. 자네는 스물을 채웠어. 저린 건 금방 가.',
        "(He laughs.) Of course it's numb. Twenty times, it ought to be. Your hands only remember once you've gone as far as numb.\n\n(Still, his eyes look a little let down.) Most people stop at ten. You made it to twenty. The numbness passes quickly.",
        [
          opt('fair_point', '말씀 듣고 보니 저린 게 남는 거네요.', "Put like that, the numbness is what stays with you.",
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '그렇지. 저린 손이 기억하는 손이야. (내 손목을 툭 친다.) 이제 그 손으로 고기 셋만 낚아 보이게.',
              lineEn: "That's it. A numb hand is a hand that remembers. (He taps my wrist.) Now show me three fish caught with that hand." }) }),
          opt('pay_up', '그래도 연습 상대 해 드린 값은 쳐 주셔야죠.', "Still, you owe me something for being your practice partner.",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({
              lineKo: '(지갑을 꺼내려다 멈춘다.) 허허, 그건 일 다 끝나고. 이 채비로 고기 셋 낚아 보이는 것까지가 일이야.',
              lineEn: "(He starts to take out his wallet, then stops.) Ha, that comes when the job's done. Catching three fish on these rigs is part of the job." }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N03-2 「조합장님」 — 진행 중: 교육장에서 재회(목표 1). 계속 가르친다 · 거리를 둔다 · 속인 것을 따진다
  //   문간에 동명항 어촌계 사람들과 도현수가 있다 — 여기서 한 말은 항구로 그대로 간다
  // ═══════════════════════════════════════════
  {
    id: 'n03_2_reveal', questId: 'N03-2', at: 'objective', objectiveIndex: 1, npcId: K, start: 'start',
    nodes: {
      start: say(
        '(교육이 끝난 교육장. 맨 앞줄 책상에 「조합장」 명패가 놓여 있다. 노인이 그 명패를 손바닥으로 덮고 앉아 있다. 문간에서는 동명항 어촌계 사람 몇이 이쪽을 힐끔거린다. 도현수도 그 사이에 있다.)\n\n전갱이는 올렸나. …그래, 자네는 늘 할 일부터 하지. 이제 아까 그 대답을 듣고 싶네. 계속 가르쳐 줄 건가, 아니면 이제 거리를 둘 건가.',
        "(The course is over and the room has emptied. On the front-row desk sits a name plate that reads Chairman. The old man sits with his palm laid over it. In the doorway a few people from the Dongmyeong fishing co-op keep glancing this way. Do Hyeonsu is among them.)\n\nDid you land the horse mackerel? ...Of course. You always do the job first. Now I'd like that answer. Will you keep teaching me, or keep your distance from now on?",
        [
          opt('keep_teaching', '방파제에선 어르신이 제 학생입니다. 명패는 여기 두고 오세요.', "On the breakwater you're my student. Leave the name plate here when you come.",
            { stance: 'giver', aff: { [K]: 0.06, coop: 0.02, hyeonsu: -0.02 }, flags: ['choice.n03_kept_teaching'], next: 'teach_on' }),
          opt('keep_distance', '속이신 건 속이신 겁니다. 당분간은 거리를 두겠습니다.', "A deception is a deception. I'll keep my distance for a while.",
            { stance: 'self', aff: { [K]: -0.06, hyeonsu: 0.01 }, flags: ['choice.n03_kept_distance'], next: 'distance' }),
          opt('call_out', '그날 엉킨 실도, 첫 입질에 놀라시던 것도 다 연기였습니까?', 'The tangled line that day, the surprise at your first bite. Was all of it an act?',
            { stance: 'other', aff: { [K]: -0.08, coop: -0.03, hyeonsu: 0.03 }, flags: ['choice.n03_called_out'], next: 'called' }),
          opt('knew_doubts', '사실 짐작은 하고 있었습니다. 보통 초보가 아니셨으니까요.', 'To be honest, I already had my suspicions. You were no ordinary beginner.',
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_had_doubts' }, next: 'knew' }),
        ]),
      teach_on: say(
        '(명패에서 손을 뗀다. 한참 나를 본다.) …허. 그 말 듣고 싶었네.\n\n조합장 자리에 앉으면 다들 내게 답을 가져와. 질문을 가져오는 사람은 없지. (문간에서 누군가 휘파람을 분다. 도현수가 고개를 돌린다.) 그래, 선생님. 다음 숙제는 뭔가.',
        "(He lifts his hand from the name plate and looks at me for a long while.) ...Ha. I wanted to hear that.\n\nSit in the chairman's seat and everyone brings you answers. Nobody brings questions. (Someone in the doorway whistles. Do Hyeonsu turns his head away.) All right, teacher. What's the next assignment?",
        [
          opt('homework', '다음엔 매듭을 일부러 엉키게 하지 마시고 그냥 오세요.', "Next time, don't tangle your knot on purpose. Just come as you are.",
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '허허! 숙제가 어렵구먼. 엉키게 하는 게 더 쉬운데. (명패를 가방에 넣는다.) 알겠네. 다음엔 이름 달고 가지. 방파제에서 보세.',
              lineEn: "Ha! That's a hard assignment. Tangling is the easy part. (He puts the name plate in his bag.) Very well. Next time I'll come under my own name. See you on the breakwater." }) }),
          opt('patient_again', '그날처럼 천천히 하겠습니다. 어르신도 급할 게 없으시잖아요.', "I'll take it slowly, like that day. You've nothing to hurry for either, have you?",
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_patient' }, end: endTalk({
              lineKo: '(웃음이 번진다.) 그날 내가 그랬지. 급할 게 없는 사람이라고. …사실 평생 급했어. 방파제에서만 안 급했지.',
              lineEn: "(A smile spreads across his face.) I did say that, that day. A man with nothing to hurry for. ...The truth is I've been in a hurry all my life. Only on the breakwater was I not." }) }),
          opt('let_him_again', '이번엔 숨기지 말고 직접 묶으세요. 제가 보겠습니다.', "This time, don't hide it. Tie it yourself. I'll watch.",
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_let_him' }, end: endTalk({
              lineKo: '(손을 내려다본다.) 그날 손이 먼저 나가서 혼났지. 허허. 이제 숨길 것도 없으니 내가 묶고 자네가 보게. 틀리면 혼내고.',
              lineEn: "(He looks down at his hands.) That day my hands ran ahead of me and I got a fright. Ha. Nothing left to hide now, so I'll tie and you watch. Scold me if I get it wrong." }) }),
        ]),
      distance: say(
        '(고개를 끄덕인다. 서운한 기색을 숨기지 않는다.) …그럴 만하지. 속인 건 나니까 거리는 자네가 정하게.\n\n그래도 방파제에서 인사는 하세. (문간의 어촌계 사람들이 슬그머니 흩어진다.) 늙은이가 그것까지 잃으면 너무 많이 잃는 거라.',
        "(He nods. He doesn't hide that it stings.) ...Fair enough. I'm the one who deceived you, so you set the distance.\n\nBut let's still say hello on the breakwater. (The co-op people in the doorway quietly drift away.) If an old man loses that too, he's lost too much.",
        [
          opt('hello_ok', '인사는 드리겠습니다. 그 이상은 아직입니다.', "I'll say hello. Anything more, not yet.",
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '그거면 됐네. 아직이라는 말이 있잖나. (명패를 가방에 넣는다.) 아직이 끝나는 날엔, 처음부터 내 이름으로 앉겠네. 초보 행세 없이.',
              lineEn: "That's enough. There's a not yet in it, after all. (He puts the name plate in his bag.) On the day not yet ends, I'll sit down under my own name from the start. No beginner act." }) }),
          opt('chairman_only', '조합장님께 인사드릴 일이 있으면 드리겠습니다.', "If there's ever reason to greet the chairman, I'll greet the chairman.",
            { stance: 'self', aff: { [K]: -0.03 }, end: endTalk({
              lineKo: '(조합장님, 하는 말에 어깨가 조금 내려간다.) …그래. 조합장으로 인사받는 건 익숙하네. 그게 늘 문제였지.',
              lineEn: "(At the word chairman his shoulders sink a little.) ...Right. Being greeted as chairman, I'm used to that. That was always the trouble." }) }),
          opt('both_hurried', '저도 그날 실을 칼로 끊었지요. 둘 다 서둘렀나 봅니다.', "I cut your line with a knife that day, remember. Maybe we both rushed.",
            { stance: 'mid', aff: { [K]: 0.02 }, requires: { flag: 'choice.n03_impatient' }, end: endTalk({
              lineKo: '(쓴웃음을 짓는다.) 자네는 실을 끊었고 나는 사람을 속였지. 무게가 다르네. 그래도 그 말은 고맙게 듣겠네.',
              lineEn: "(He smiles wryly.) You cut a line and I deceived a person. They don't weigh the same. Still, I'm grateful to hear it." }) }),
        ]),
      called: say(
        '(명패를 덮은 손이 멈춘다.) …실은 일부러 엉켰지. 그건 연기야. 미안하네.\n\n그런데 자네가 풀어 주던 십 분, 그건 연기가 아니었어. 늙은이가 그 십 분을 사려고 연기를 한 거야. (문간의 어촌계 사람들이 웅성거린다. 도현수만 웃지 않고 이쪽을 본다.)',
        "(The hand covering the name plate goes still.) ...The line, I tangled on purpose. That was an act. I'm sorry.\n\nBut the ten minutes you spent working it loose, that was no act. The old man put on the act to buy those ten minutes. (The co-op people in the doorway start murmuring. Only Do Hyeonsu doesn't laugh, and keeps watching.)",
        [
          opt('that_ten', '그 십 분이 진짜였다면, 그걸로 됐습니다.', 'If those ten minutes were real, that will do.',
            { stance: 'mid', aff: { [K]: 0.03 }, end: endTalk({
              lineKo: '(오래 나를 본다.) …따질 건 따지고 받을 건 받는군. 조합장 앞에서 그러는 사람은 드물어. 고맙네, 선생님.',
              lineEn: "(He looks at me a long time.) ...You call out what needs calling out and accept what can be accepted. Few people do that in front of a chairman. Thank you, teacher." }) }),
          opt('buying_time', '사람 시간을 사신다니, 그게 더 무섭습니다.', "Buying people's time. That frightens me more.",
            { stance: 'other', aff: { [K]: -0.04, coop: -0.02 }, end: endTalk({
              lineKo: '(고개를 끄덕인다.) …그 말이 맞아. 조합장 자리가 그래. 사람 시간을 사는 자리지. 자네 대답은 들었네. 무겁게 듣겠네.',
              lineEn: "(He nods.) ...You're right. That's what the chairman's seat is. A seat that buys people's time. I've heard your answer. I'll take it to heart." }) }),
          opt('why_me', '왜 하필 저였습니까?', 'Why me, of all people?',
            { stance: 'mid', end: endTalk({
              lineKo: '엉킨 줄 든 늙은이 옆에 앉은 게 자네 하나였으니까. (명패를 뒤집어 놓는다.) 나머지는 다 지나갔어. 지나간 사람을 탓하진 않네. 앉아 준 게 고마운 거지.',
              lineEn: "Because you were the only one who sat down beside an old man holding a tangled line. (He turns the name plate face down.) Everyone else walked past. I don't blame them for walking past. I'm grateful someone sat." }) }),
        ]),
      knew: say(
        '(허허 웃는다. 처음으로 시원하게.) 들켰던 거로군. 그런데도 끝까지 가르쳐 줬어? 모르는 척하고?\n\n…그게 더 고맙네. 늙은이 연기를 연기로 받아 준 거니까. 이제 어쩔 텐가. 계속 받아 줄 텐가.',
        "(He laughs, freely for the first time.) So I'd been found out. And you kept teaching me anyway? Pretending not to know?\n\n...That makes me more grateful still. You played along with an old man's act. So what now? Will you keep playing along?",
        [
          opt('both_stop', '이제 둘 다 연기는 그만하죠. 방파제에서 진짜로 가르쳐 드리겠습니다.', "Let's both drop the act now. On the breakwater I'll teach you for real.",
            { stance: 'giver', aff: { [K]: 0.03, coop: 0.01 }, flags: ['choice.n03_kept_teaching'], end: endTalk({
              lineKo: '허허, 진짜로라. 그럼 나도 진짜 초보부터 다시 하지. (명패를 가방 깊숙이 넣는다.) 방파제에서 보세, 선생님.',
              lineEn: "Ha, for real. Then I'll start again as a real beginner. (He pushes the name plate deep into his bag.) See you on the breakwater, teacher." }) }),
          opt('distance_anyway', '알면서 가르친 건 저고, 속이신 건 어르신입니다. 당분간 거리를 두겠습니다.', "I taught knowing, but you're the one who deceived. I'll keep my distance for a while.",
            { stance: 'self', aff: { [K]: -0.04 }, flags: ['choice.n03_kept_distance'], end: endTalk({
              lineKo: '(웃음을 거둔다.) …그렇지. 알고 받아 준 것과 속인 것은 다르지. 거리는 자네가 정하게. 인사만은 받아 주고.',
              lineEn: "(His laugh fades.) ...True. Playing along knowingly and deceiving aren't the same. You set the distance. Just keep answering my hello." }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N03-3 「도장」 — 진행 중: 표결 전 대화(목표 1). 총회장 안에서 계장이 의자를 놓으며 다 듣는다
  //   표를 부탁한다 · 개입하지 말라고 한다 · 남의 손을 묻는다 — 교육장에서 남긴 말이 열린다
  // ═══════════════════════════════════════════
  {
    id: 'n03_3_vote', questId: 'N03-3', at: 'objective', objectiveIndex: 1, npcId: K, start: 'start',
    nodes: {
      start: say(
        '(총회 전날 밤, 총회장 앞 계단. 안에서 계장이 의자를 놓는 소리가 들린다. 노인이 도장 주머니를 손바닥에 올려놓고 앉아 있다.) 내일이 표결이지. 말해 두려고 왔네. 나는 개입 안 해.\n\n조합장이 어촌계 표결에 손대면 그건 표결이 아니야. (도장을 꺼내 보이고는 찍지 않고 다시 넣는다.) 내 선생이 알아서 하겠지.',
        "(The night before the general meeting, on the steps outside the hall. From inside comes the sound of the chief setting out chairs. The old man sits with the pouch that holds his seal on his palm.) Tomorrow's the vote. I came to say this beforehand. I won't interfere.\n\nIf a chairman lays a hand on a co-op vote, it isn't a vote any more. (He takes out the seal to show me, then puts it back without stamping anything.) My teacher will handle it.",
        [
          opt('ask_vote', '마을 사람들 생각해서라도 한마디만 거들어 주시면 안 됩니까?', "For the village's sake, couldn't you put in just one word?",
            { stance: 'other', aff: { [K]: -0.05, coop: -0.04 }, flags: ['choice.n03_asked_favor'], next: 'refuse' }),
          opt('dont_interfere', '그 말씀이 맞습니다. 도장은 넣어 두세요. 손은 제가 듭니다.', "You're right. Keep the seal put away. I'll raise my own hand.",
            { stance: 'giver', aff: { [K]: 0.05, coop: 0.03 }, next: 'trust' }),
          opt('ask_someone', '현수는 어느 쪽에 손을 들까요?', 'Which way do you think Hyeonsu will raise his hand?',
            { stance: 'mid', next: 'someone' }),
          opt('as_student', '선생 표결에 학생이 끼면 반칙이지요. 가만히 계세요.', "A student meddling in his teacher's vote would be cheating. Sit tight.",
            { stance: 'giver', aff: { [K]: 0.03, coop: 0.01 }, requires: { flag: 'choice.n03_kept_teaching' }, end: endTalk({
              lineKo: '허허! 그래, 학생은 가만히 있겠네. (도장 주머니를 가슴 주머니 깊숙이 넣는다.) 내일은 맨 뒷줄에 앉아서 선생님 손만 보고 있겠어.',
              lineEn: "Ha! Right, the student will sit tight. (He pushes the seal pouch deep into his breast pocket.) Tomorrow I'll sit in the back row and watch nothing but my teacher's hand." }) }),
        ]),
      refuse: say(
        '(고개를 젓는다. 처음 보는 단호한 얼굴이다.) 그 말은 못 들은 걸로 하겠네. 내가 한마디 하면 그건 마을 표가 아니라 내 표가 돼.\n\n(총회장 안에서 의자 놓는 소리가 멈춘다.) …마을을 생각한다면 더 그러면 안 되지. 마을 손은 마을이 드는 거야.',
        "(He shakes his head. It's a firmness I've never seen on him.) I'll pretend I didn't hear that. If I say one word, it stops being the village's vote and becomes mine.\n\n(Inside the hall, the sound of chairs being set out stops.) ...If you're thinking of the village, that's all the more reason not to. The village raises its own hands.",
        [
          opt('withdraw', '제가 잘못 말씀드렸습니다. 제 손으로 하겠습니다.', "I shouldn't have said that. I'll do it with my own hand.",
            { stance: 'mid', aff: { [K]: 0.03, coop: 0.02 }, end: endTalk({
              lineKo: '(어깨를 툭 친다.) 그래. 그 말이면 됐네. 내일 자네 손이 어느 쪽으로 가든, 자네 손이면 된 거야.',
              lineEn: "(He claps me on the shoulder.) Right. That's all I needed to hear. Whichever way your hand goes tomorrow, as long as it's your own hand, it's right." }) }),
          opt('but_why', '아는 사람을 돕는 게 왜 잘못입니까?', "What's wrong with helping someone you know?",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({
              lineKo: '조합장이 아는 사람을 도우면 그게 제일 위험한 일이야. 모르는 사람들 손이 다 내려가거든. (일어선다.) 내일 보세. 나는 맨 뒷줄에 있겠네.',
              lineEn: "When a chairman helps people he knows, that's the most dangerous thing there is. Every hand belonging to people he doesn't know goes down. (He stands.) See you tomorrow. I'll be in the back row." }) }),
        ]),
      trust: say(
        '(허허 웃는다. 도장 주머니 끈을 꽉 묶는다.) 그 말 들으려고 왔네. …사실은 반쯤은 시험이었어. 늙은이가 아직도 시험을 하네.\n\n(총회장 안에서 계장이 헛기침을 한다. 다 들은 모양이다.)',
        "(He laughs and pulls the cord of the seal pouch tight.) That's what I came to hear. ...Truth is, it was half a test. This old man is still setting tests.\n\n(Inside the hall the chief clears his throat. He seems to have heard every word.)",
        [
          opt('passed', '시험이면, 붙은 겁니까?', 'If it was a test, did I pass?',
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '붙고 말고가 어딨나. 내일 자네 손이 어느 쪽으로 가든, 자네 손으로 들면 붙은 거야.',
              lineEn: "There's no pass or fail. Whichever way your hand goes tomorrow, if you raise it yourself, you've passed." }) }),
          opt('no_tests', '이제 시험은 그만하시죠. 교육장에서 충분했습니다.', "Enough tests now. The training course was plenty.",
            { stance: 'other', aff: { [K]: 0.02, coop: 0.01 }, requires: { flag: 'choice.n03_called_out' }, end: endTalk({
              lineKo: '(웃음을 거둔다.) …맞아. 자네한테는 그만해야지. 미안하네. 이게 마지막이야. (도장 주머니를 내 쪽으로 내밀려다 도로 넣는다.) 이건 표결 끝나고.',
              lineEn: "(His laugh fades.) ...You're right. With you, I ought to stop. I'm sorry. This is the last one. (He starts to hold the seal pouch out to me, then puts it away again.) This can wait till after the vote." }) }),
          opt('distance_right', '거리를 두길 잘했다 싶습니다. 오늘 같은 날 떳떳하니까요.', "I'm glad I kept my distance. On a day like this, my hands are clean.",
            { stance: 'self', aff: { [K]: 0.02 }, requires: { flag: 'choice.n03_kept_distance' }, end: endTalk({
              lineKo: '(쓴웃음을 짓는다.) 그래. 자네 거리가 오늘은 자네를 지키는군. 늙은이도 그 거리 덕을 보네. 내일 떳떳하게 들게.',
              lineEn: "(He smiles wryly.) True. Today your distance is what protects you. The old man benefits from it too. Raise your hand with a clear conscience tomorrow." }) }),
        ]),
      someone: say(
        '(고개를 젓는다.) 그 친구 손은 그 친구 거야. 계장 손자라고 계장 손을 드는 것도 아니고.\n\n남의 손이 궁금하면 자네 손이 아직 안 정해진 거지. (빙그레 웃는다.) 내 말 틀렸나.',
        "(He shakes his head.) That young man's hand is his own. Being the chief's grandson doesn't mean he raises the chief's hand.\n\nIf you're curious about other people's hands, it means yours isn't settled yet. (He smiles.) Am I wrong?",
        [
          opt('not_decided', '맞습니다. 아직 못 정했습니다.', "You're right. I haven't decided yet.",
            { stance: 'self', end: endTalk({
              lineKo: '그럼 오늘 밤은 바다를 보게. 사람 얼굴은 내일 보고. (일어선다.) 표결은 결국 바다 때문에 하는 거니까.',
              lineEn: "Then tonight, look at the sea. Look at people's faces tomorrow. (He stands.) In the end, the vote is for the sea's sake." }) }),
          opt('hope_same', '현수가 같은 쪽이면 좋겠다 싶어서요.', "I just hope Hyeonsu ends up on the same side.",
            { stance: 'other', aff: { [K]: 0.01 }, end: endTalk({
              lineKo: '(빙그레 웃는다.) 그 말은 나 말고 그 친구한테 하게. 내일 말고, 오늘 밤에. 젊은 손끼리는 그게 빨라.',
              lineEn: "(He smiles.) Say that to him, not to me. Not tomorrow. Tonight. Between young hands, that's quicker." }) }),
          opt('ask_chief', '그럼 계장님 손도 계장님 거겠지요.', "Then the chief's hand is his own too, I suppose.",
            { stance: 'mid', aff: { coop: 0.02 }, end: endTalk({
              lineKo: '허허, 그렇지. 그 양반이 지금 안에서 의자를 놓는 것도 그래서야. 자기 손으로 자리를 만드는 거지. (안쪽에서 의자 소리가 잠깐 멈췄다가 다시 난다.)',
              lineEn: "Ha, that's right. That's why he's in there setting out chairs right now. He makes the seats with his own hands. (Inside, the sound of chairs stops for a moment, then starts again.)" }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N03-4 「스승의 날」 — 끝내는 자리(강두철) · 결말은 정본 하나(`n03_roll`). 비워 둔 명부 1번 앞에서 앞의 말을 기억한다
  // ═══════════════════════════════════════════
  {
    id: 'n03_4_done', questId: 'N03-4', at: 'complete', npcId: K, start: 'start',
    nodes: {
      start: say(
        '(방파제 끝, 처음 만난 그 자리. 방금 풀어 준 실을 손가락에 감았다 풀었다 한다.) 풀었네. 십 분. 그날이랑 똑같아. 마지막 수업이었어, 선생님.\n\n(가슴 주머니에서 얇은 명부를 꺼내 첫 장을 편다. 1번 칸이 비어 있다.) 오늘이 스승의 날이야. 늙은이가 선생님한테 드릴 게 이것뿐이네.',
        "(The end of the breakwater, the very spot where we first met. He winds the line I just freed around his finger, then unwinds it.) Loose. Ten minutes. Same as that day. That was the last lesson, teacher.\n\n(From his breast pocket he takes a thin member roll and opens it to the first page. Line one is empty.) Today's Teachers' Day. This is all an old man has to give his teacher.",
        [
          opt('sign_roll', '그 칸, 제가 채워도 되겠습니까?', 'May I be the one to fill that line?',
            { stance: 'giver', aff: { [K]: 0.04, coop: 0.01 }, next: 'roll' }),
          opt('elders_decide', '명부 1번은 어촌계 어른들이 정하셔야지요.', 'Line one of the roll should be for the co-op elders to decide.',
            { stance: 'other', aff: { [K]: -0.02, coop: 0.03 }, next: 'elders' }),
          opt('tangle_joke', '이번에도 일부러 엉키게 하신 거죠?', 'You tangled it on purpose again this time, didn\'t you?',
            { stance: 'mid', next: 'half_act' }),
          opt('remember', '처음 이 자리에서 뵌 날이 생각납니다.', 'I keep thinking of the day I first met you, right here.',
            { stance: 'mid', aff: { [K]: 0.02 }, next: 'memory' }),
        ]),
      roll: say(
        '되고말고. 그래서 비워 둔 거야. (펜을 내민다.) 조합장 자리가 아니야. 그냥 1번 조합원. 맨 앞에 서는 자리가 아니라 맨 먼저 손을 보태는 자리지.\n\n…쓰기 전에 하나만 묻세. 처음 이 방파제에서, 자네는 왜 내 옆에 앉았나.',
        "Of course you may. That's why I left it empty. (He holds out a pen.) It isn't the chairman's seat. Just member number one. Not the place at the front of the line, but the first hand to help.\n\n...Before you write, one question. That first day on this breakwater, why did you sit down beside me?",
        [
          opt('just_because', '엉킨 줄이 있으면 풀어야지요. 그게 다였습니다.', "If a line's tangled, you untangle it. That was all.",
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '(허허 웃는다.) 그게 다라. 그 별것 아닌 게 늙은이 남은 날을 바꿨네. (내 이름이 1번 칸에 적힌다.) 무거우면 천천히 들게. 혼자 들지 말고.',
              lineEn: "(He laughs.) That was all. That little nothing changed the rest of an old man's days. (My name goes into line one.) If it's heavy, lift it slowly. Not alone." }) }),
          opt('patient_why', '급할 게 없다고 하셔서요. 저도 그날은 급할 게 없었습니다.', 'You said you had nothing to hurry for. That day, neither did I.',
            { stance: 'giver', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_patient' }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '(웃음이 번진다.) 둘 다 급할 게 없는 척을 했지. 나는 평생 급했고, 자네는 앞날이 급했을 텐데. (내 이름이 1번 칸에 적힌다.) 그 척이 오늘까지 왔네.',
              lineEn: "(A smile spreads across his face.) We both pretended we had nothing to hurry for. I'd been in a hurry all my life, and you must have been in a hurry about your future. (My name goes into line one.) And that pretending has brought us all the way to today." }) }),
          opt('let_him_why', '어르신 손으로 풀게 해 드리고 싶었습니다. 결국 손이 다 아셨지만요.', 'I wanted you to work it loose with your own hands. Though your hands knew it all along.',
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_let_him' }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '허허! 그날 손이 먼저 나가서 혼났지. (내 이름이 1번 칸에 적힌다.) 남의 손을 믿고 기다려 주는 사람. 1번 칸은 그런 사람 자리야.',
              lineEn: "Ha! My hands ran ahead of me that day and gave me a fright. (My name goes into line one.) Someone who trusts another man's hands and waits for them. That's who line one is for." }) }),
          opt('impatient_why', '솔직히 그날은 빨리 끝내고 싶었습니다. 칼까지 댔지요.', 'Honestly, that day I wanted it over quickly. I even took a knife to it.',
            { stance: 'self', aff: { [K]: 0.02 }, requires: { flag: 'choice.n03_impatient' }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '(크게 웃는다.) 알지. 한 시간 감은 걸 칼 한 번에. 그 소리를 아직 기억해. (내 이름이 1번 칸에 적힌다.) 그런 사람이 오늘은 십 분을 다 썼어. 그래서 1번이야.',
              lineEn: "(He laughs out loud.) I know. An hour's winding, gone in one stroke. I still remember the sound. (My name goes into line one.) And today that same person spent the full ten minutes. That's why you're number one." }) }),
        ]),
      elders: say(
        '(허허 웃는다.) 그 말 할 줄 알았네. 어촌계엔 내가 벌써 물었어. 계장이 뭐라는 줄 아나. 그 친구면 됐다더군.\n\n(명부를 덮지 않고 든 채로 있다.) 그래도 싫으면 비워 두지. 비어 있는 것도 자리야.',
        "(He laughs.) I knew you'd say that. I've already asked the co-op. Do you know what the chief said? If it's that one, that's fine by us.\n\n(He keeps the roll open in his hands.) Still, if you'd rather not, I'll leave it empty. An empty line is a place too.",
        [
          opt('then_sign', '어른들 뜻이 그렇다면 쓰겠습니다.', "If that's what the elders want, I'll write it.",
            { stance: 'giver', aff: { [K]: 0.03, coop: 0.02 }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '(펜을 내민다. 내 이름이 1번 칸에 적힌다.) 1번은 맨 앞에 서는 자리가 아니야. 맨 먼저 손을 보태는 자리지. 그걸 잊지 않으면 이름이 자네를 지켜 줄 거네.',
              lineEn: "(He holds out the pen. My name goes into line one.) Number one isn't the place at the front. It's the first hand to help. Remember that and the name will look after you." }) }),
          opt('keep_empty', '비워 두시죠. 제 손으로 채울 수 있을 때 쓰겠습니다.', "Leave it empty. I'll write in it when my own hands have earned it.",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({ complete: 'lesson', ending: 'n03_roll',
              lineKo: '(명부를 접는다.) …그것도 답이야. 비워 둔 채로 들고 다니지. 대신 이건 가져가게. (줄 두 가닥으로 매듭 하나를 천천히 꼬아 보인다.) 당겨도 안 풀리고, 풀려고 마음먹으면 한 번에 풀리는 매듭이야. 그 칸을 채우는 날도 그렇게 오겠지.',
              lineEn: "(He folds the roll shut.) ...That's an answer too. I'll carry it around empty. But take this instead. (With two strands of line he slowly twists a knot to show me.) A knot that won't give when you pull, and comes loose all at once when you mean it to. The day you fill that line will come the same way." }) }),
          opt('favor_shame', '표결 전에 거들어 달라던 사람이 1번을 써도 되겠습니까?', 'The one who asked you to put in a word before the vote, writing in line one?',
            { stance: 'self', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_asked_favor' }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '(펜을 내민다.) 그걸 아직 부끄러워하니까 쓰는 거야. 부끄러운 줄 아는 손이 맨 먼저 보태는 손이 되거든.',
              lineEn: "(He holds out the pen.) It's because you're still ashamed of that, that you should write it. A hand that knows shame becomes the first hand to help." }) }),
        ]),
      half_act: say(
        '(허허 웃는다.) 들켰나. 반은 연기고 반은 진짜야. 이제는 손이 정말로 엉켜. 늙었거든.\n\n마지막 수업은 처음처럼 하고 싶었어. 다음부턴 초보 행세 안 해. 그냥 초보로 앉을 거야. 은퇴한 늙은이니까.',
        "(He laughs.) Caught me? Half act, half real. My hands really do tangle now. I've grown old.\n\nI wanted the last lesson to be like the first. From now on, no beginner act. I'll just sit down as a beginner. A retired old man, after all.",
        [
          opt('my_boat', '은퇴하시면 제 배 손님으로 모시겠습니다. 정가로요.', "When you retire, I'll take you out on my boat as a passenger. Full fare.",
            { stance: 'giver', aff: { [K]: 0.03 }, end: endTalk({ complete: 'passenger', ending: 'n03_roll',
              lineKo: '허허, 정가라. 깎아 달라고 하면 안 되겠군. (웃다가 눈가를 손등으로 훔친다.) 그날 내 채비는 내가 묶겠네. 엉키면… 그땐 선생님이 풀어 주고.',
              lineEn: "Ha, full fare. I suppose I mustn't ask for a discount. (He laughs, then wipes his eyes with the back of his hand.) That day I'll tie my own rig. If it tangles... then my teacher can work it loose." }) }),
          opt('teach_last', '그럼 마지막으로 어르신 매듭 하나 배우겠습니다.', "Then for the last lesson, I'll learn one of your knots.",
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({ complete: 'lesson', ending: 'n03_roll',
              lineKo: '(줄 두 가닥을 꺼내 천천히 꼰다. 이번엔 손을 숨기지 않는다.) 조합장 매듭이야. 붙잡을 때와 놓을 때를 아는 매듭이지. 이제 나는 놓는 쪽만 하면 돼.',
              lineEn: "(He takes out two strands and twists them slowly. This time he doesn't hide his hands.) The chairman's knot. A knot that knows when to hold and when to let go. All I have left now is the letting go." }) }),
          opt('fee', '마지막 수업이니 수업료는 받겠습니다.', "Since it's the last lesson, I'll take my fee.",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({ complete: 'pay', ending: 'n03_roll',
              lineKo: '허허, 그러세. 은퇴금에서 떼 주지. (두꺼운 봉투를 웃으며 내민다.) 선생님 수업료는 제값을 쳐야지. 마지막이라고 거르면 순서가 안 맞아.',
              lineEn: "Ha, of course. I'll take it out of my retirement money. (Smiling, he holds out a thick envelope.) A teacher's fee should be paid in full. Skipping it because it's the last would put things out of order." }) }),
          opt('student_done', '방파제에선 어르신이 제 학생이었지요. 마지막 수업까지 잘 들으셨습니다.', 'On the breakwater you were my student. You listened well, right to the last lesson.',
            { stance: 'giver', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_kept_teaching' }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '(허리를 펴고 앉는다. 학생처럼.) 고맙습니다, 선생님. (명부를 내밀며 웃는다.) 학생이 선생님 이름을 1번에 적어도 되겠나. 오늘은 스승의 날이니까.',
              lineEn: "(He straightens his back and sits up, like a student.) Thank you, teacher. (He holds out the roll, smiling.) May the student write his teacher's name in line one? It's Teachers' Day, after all." }) }),
        ]),
      memory: say(
        '(실을 감던 손이 멈춘다.) 나도 그래. 늙은이가 연기를 하다 진짜가 됐지.\n\n그동안 자네가 나한테 한 말, 하나도 안 잊었네. 좋은 말도 아픈 말도. (명부를 무릎에 올려놓는다.) 오늘은 어떤 말을 해 주겠나.',
        "(The hand winding the line stops.) So do I. An old man started out acting and ended up meaning it.\n\nI haven't forgotten a single thing you said to me all this time. The kind words and the painful ones. (He rests the roll on his knee.) What will you say to me today?",
        [
          opt('thank_you', '고마웠습니다. 가르치면서 제가 더 배웠습니다.', 'Thank you. Teaching you, I learned more than you did.',
            { stance: 'giver', aff: { [K]: 0.03 }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '가르치는 쪽이 더 배우지. 늘 그래. (명부와 펜을 내 쪽으로 민다.) 오늘부터는 이 칸이 자네한테 그걸 가르칠 거야. 써 넣게.',
              lineEn: "The one teaching learns more. Always. (He pushes the roll and the pen toward me.) From today, this line will teach you that. Write it in." }) }),
          opt('called_out_cb', '교육장에서 따졌던 날, 그 십 분은 저한테도 진짜였습니다.', 'The day I called you out at the course, those ten minutes were real for me too.',
            { stance: 'mid', aff: { [K]: 0.05 }, requires: { flag: 'choice.n03_called_out' }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '(오래 말이 없다가 웃는다.) 그날 자네가 따져 줘서 내가 살았네. 아무도 조합장한테 따지지 않거든. (펜을 내민다.) 그러니 1번은 자네야. 따질 줄 아는 사람.',
              lineEn: "(He's silent a long while, then smiles.) Your calling me out that day saved me. Nobody ever calls a chairman out. (He holds out the pen.) So number one is you. Someone who knows how to call things out." }) }),
          opt('distance_cb', '거리를 두겠다고 했던 날이 있었지요. 오늘은 옆에 앉겠습니다.', "There was a day I said I'd keep my distance. Today I'll sit beside you.",
            { stance: 'mid', aff: { [K]: 0.05 }, requires: { flag: 'choice.n03_kept_distance' }, end: endTalk({ complete: 'passenger', ending: 'n03_roll',
              lineKo: '(처음 그날처럼 엉덩이를 들썩여 자리를 내준다.) …그 거리가 끝나는 날을 기다렸네. 앉게. 은퇴하면 자네 배에 손님으로 타겠어. 정가로. 이번엔 내 이름으로.',
              lineEn: "(Just like that first day, he shifts over to make room.) ...I've been waiting for the day that distance ended. Sit. Once I retire I'll ride your boat as a passenger. Full fare. Under my own name this time." }) }),
          opt('seal_cb', '주신 도장, 아직 찍지 않은 채로 갖고 있습니다.', 'The seal you gave me. I still have it, never stamped.',
            { stance: 'giver', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_seal' }, end: endTalk({ complete: 'number_one', ending: 'n03_roll',
              lineKo: '(허허 웃는다.) 찍지 마. 평생. (명부를 내민다.) 대신 여기엔 자네 이름을 써. 이건 도장 말고 손으로 쓰는 거야.',
              lineEn: "(He laughs.) Don't stamp it. Ever. (He holds out the roll.) Write your name here instead. This one you write by hand, not with a seal." }) }),
        ]),
    },
  },
];
