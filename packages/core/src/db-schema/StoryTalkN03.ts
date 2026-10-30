/**
 * @file StoryTalkN03.ts
 * @description 254차 — N03 「강두철 — 채비 못 묶는 초보, 실은 수협 조합장」 이어지는 대화. 규칙은 `StoryTalks.ts` 머리 주석.
 *   290차 — 전부 대본 장면(주고받기)으로 고쳐 썼다(`.agents/inputs/290_talk_brief.md`). 단계 id · 고를 말 id · 입장 · 우호도 · 표시 ·
 *   조건 · 끝 · 결말은 254차 그대로이고, 받는 끝 몇 곳을 옛 받는 답(`offer`)에 묶었다. 없던 받는 · 끝내는 자리를 새로 썼다.
 *
 * 인물: 강두철(63 · 하게체 — 「허허」 · 「자네」 · 「~네」 · 「~게」 · 스스로를 「늙은이」로 낮춘다. 첫 고기 뒤로는 주인공을 「선생님」.
 *   들킨 뒤(교육장)에는 말이 담백해진다 — 「미안하네」 · 「선생은 선생이야, 조합장이 아니라」).
 * 호칭(290): 처음 만난 날 이름을 밝힌다(「강두철이라고 하네」) — 주인공은 「강두철 씨」라고 부른다(「어르신」 · 「조합장님」 없이).
 *   노인은 주인공을 「젊은이」로 부르지 않는다 — 「자네」 · 「선생님」.
 * 스포일러 선(R2): 받는 자리 · 채비 풀기 · 첫 고기 · 스무 번째 채비에서는 초보 노인이다 — 손 · 눈 · 인사받는 모습 같은 단서만.
 *   직함(조합장 · 수협)은 교육장 편부터. 다른 사람 = 동명항 어촌계(`coop` — 교육장 문간 · 총회장 안) · 도현수(문간) · 고만석(방어진).
 * 결말은 정본 하나(`n03_roll`) — 명부 1번 칸은 늘 비어서 기다린다. 대화는 마지막 인사가 앞의 말을 기억하게 할 뿐이다.
 *
 * 표시 — 남기는 곳 → 읽는 곳
 *  choice.n03_had_doubts      받기 · 채비 풀기 · 스무 번째 — 초보가 아니라는 낌새를 입 밖에 냈다 → 교육장
 *  choice.n03_patient         채비 풀기 — 천천히 다 풀어 줬다 → 교육장 · 은퇴 인사
 *  choice.n03_impatient       채비 풀기 — 칼로 끊었다 → 스무 번째 · 교육장 · 은퇴 인사
 *  choice.n03_let_him         채비 풀기 — 직접 풀게 했다 → 스무 번째 · 교육장 · 은퇴 인사
 *  choice.n03_kept_teaching   교육장 — 계속 가르친다 → 교육장 끝내기 · 표결 전 · 은퇴 인사
 *  choice.n03_kept_distance   교육장 — 거리를 둔다 → 교육장 끝내기 · 표결 전 · 은퇴 인사
 *  choice.n03_called_out      교육장 — 속인 것을 따졌다 → 표결 전 · 은퇴 인사
 *  choice.n03_asked_favor     표결 전 — 한마디 거들어 달라고 했다 → 은퇴 인사
 *  (읽기만) choice.n03_seal   표결 편 끝내는 자리 「찍지 않은 도장」 답 → 은퇴 인사
 *  (옛 받는 답의 표시) choice.n03_1_asked_knot · n03_2_asked_coop · n03_3_asked_seal · n03_4_asked_number_one · n03_5_asked_twenty ·
 *   n03_6_asked_boat · n03_7_asked_route — 받는 끝을 그 답에 묶어 남긴다(`offer`).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const K = 'kang_ducheol';
const P = 'player';

export const TALKS_N03: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N03-1 「선생님」 — 받는 자리(강두철 · 아직 초보 노인). 지나가던 어민이 그에게 허리를 굽힌다(단서만)
  // ═══════════════════════════════════════════
  {
    id: 'n03_1_offer', questId: 'N03-1', at: 'offer', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line('', '(방파제 끝, 엉킨 실뭉치를 무릎에 올려놓고 쩔쩔매는 노인이 있다. 지나가던 어민 하나가 노인에게 허리를 꾸벅 굽히고 지나간다.)', '(At the end of the breakwater an old man is fumbling with a tangled ball of line on his knee. A passing fisherman bows deeply to him as he goes by.)'),
        line(K, '이 매듭이 자꾸 풀리는데 말이지. 풀려고 당기면 더 감기고.', 'This knot keeps coming undone, you see. And when I pull to undo it, it winds tighter.'),
        line(P, '많이 엉켰네요.', "That's quite a tangle."),
        line(K, '허허, 늙은이가 낚시는 처음이라.', "Ha, this old man's new to fishing.", { act: 'look_up' }),
        line(K, '자네, 혹시 채비 볼 줄 아나. 옆에 좀 앉아 주면 고맙고.', "Do you know rigs, by any chance? I'd be grateful if you sat with me a while."),
        line(P, '조금은요. 저는…', 'A little. I\'m...'),
        line(K, '아, 내 소개가 늦었네. 강두철이라고 하네.', "Ah, I haven't introduced myself. The name's Kang Ducheol."),
        line(P, '(…아까 지나간 사람, 인사가 꽤 깍듯하던데.)', '(...That man who passed bowed rather properly.)'),
      ], {
        choices: [
          opt('sit_down', '그럼요. 옆에 앉겠습니다. 천천히 같이 풀어 보죠.', "Of course. I'll sit with you. Let's work it loose together, slowly.",
            { stance: 'giver', aff: { [K]: 0.04 }, next: 'sit' }),
          opt('who_bowed', '방금 지나간 분, 강두철 씨께 인사가 아주 깍듯하던데요.', 'That man who just went by bowed to you very properly.',
            { stance: 'mid', next: 'bowed' }),
          opt('nest', '이 정도면 매듭이 아니라 갈매기 둥지인데요.', "At this point that's not a knot, it's a seagull's nest.",
            { stance: 'self', aff: { [K]: 0.01 }, end: endTalk({ accept: true, offer: 'knitting',
              lineKo: '허허! 갈매기 둥지라, 그 말 맞네. 한 시간을 감고 돌렸더니 이 모양이야. (실뭉치를 내 무릎에 얹는다.) 둥지 허무는 재주는 자네한테 있어 보이니 맡기겠네.',
              lineEn: "Ha! A seagull's nest. You're right. I wound and twisted for an hour and this is what came of it. (He sets the ball on my knee.) The knack for taking nests apart looks like yours, so I'll leave it to you." }),
              note: ['매듭이 아니라 갈매기 둥지라고 했더니 강두철 씨가 크게 웃었다. 한 시간을 감고 돌렸더니 이 모양이라며 실뭉치를 내 무릎에 얹었다.', "When I said it was less a knot than a seagull's nest, Kang Ducheol laughed out loud. An hour of winding had done that, he said, and set the ball on my knee."] }),
          opt('busy', '죄송합니다. 지금은 제 채비 챙기기도 바빠서요.', "Sorry. Right now I've got my hands full with my own rig.",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({ decline: true,
              lineKo: '(허허 웃으며 손을 내젓는다.) 아니야, 자네 시간 뺏을 일은 아니지. 늙은이는 여기 계속 앉아 있을 테니, 지나가다 생각나면 들르게.',
              lineEn: "(He laughs and waves a hand.) No, no, it's not worth your time. The old man will be sitting right here, so drop by if you think of it on your way past." }),
              note: ['지금은 내 채비도 바쁘다고 미뤘다. 강두철 씨는 여기 계속 앉아 있을 테니 생각나면 들르라고 했다.', "I put him off — my own rig was keeping me busy. Kang Ducheol said he'd be sitting right there; drop by if I thought of it."] }),
        ],
        note: ['방파제 끝에서 채비가 실뭉치가 된 노인을 만났다. 강두철이라고 했다. 낚시는 처음이라며 옆에 앉아 달라고 했다. 지나가던 어민이 그에게 유난히 깍듯하게 인사했다.',
          "At the end of the breakwater I met an old man whose rig had become a ball of string. He said his name was Kang Ducheol, that he was new to fishing, and asked me to sit with him. A passing fisherman bowed to him unusually properly."],
      }),
      sit: scene([
        line('', '(노인이 엉덩이를 들썩여 자리를 내준다.)', '(The old man shifts over to make room.)'),
        line(K, '고맙네, 고마워.', 'Thank you, thank you.'),
        line(K, '이게 원줄이고 이게 목줄이라는 것까진 알겠는데, 그다음부터는 영 모르겠어.', "I know this is the main line and this is the leader, but past that I'm lost."),
        line(P, '어디 봐요.', 'Let me see.'),
        line('', '(실뭉치를 두 손으로 받쳐 내민다. 손바닥 굳은살이 유난히 두껍다.)', '(He holds out the tangled ball in both hands. The calluses on his palms are unusually thick.)'),
        line(K, '천천히 하게. 늙은이는 급할 게 없는 사람이야.', 'Take your time. An old man has nothing to hurry for.'),
      ], {
        choices: [
          opt('take_it', '(실뭉치를 받아 무릎에 올린다.)', '(I take the ball of line and set it on my knee.)',
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({ accept: true, offer: 'sit_untangle',
              lineKo: '(옆에 바짝 붙어 앉아 내 손을 들여다본다.) 허허, 남의 손 보는 게 늙은이 낙이야. 어디 한번 보세.',
              lineEn: "(He sits right up close and watches my hands.) Ha, watching other people's hands is an old man's pleasure. Let's have a look." }),
              note: ['실뭉치를 받아 무릎에 올렸다. 강두철 씨는 바짝 붙어 앉아 내 손을 들여다보았다.', 'I took the ball of line onto my knee. Kang Ducheol sat right up close and watched my hands.'] }),
          opt('your_palm', '손바닥 굳은살이 낚시 처음 하시는 손 같지 않은데요.', "Those calluses don't look like the hands of someone new to fishing.",
            { stance: 'other', flags: ['choice.n03_had_doubts'], end: endTalk({ accept: true,
              lineKo: '(손을 슬쩍 소매 안으로 넣는다.) 허허, 늙은이 손은 이것저것 쥐어 본 손이라 그래. 그물도 쥐어 보고, 노도 쥐어 보고. …자, 줄이나 보세.',
              lineEn: "(He slips his hands into his sleeves.) Ha, an old man's hands have gripped all sorts of things, that's all. Nets, oars. ...Now, let's look at this line." }),
              note: ['굳은살이 낚시 처음인 손 같지 않다고 했다. 강두철 씨는 손을 슬쩍 소매 안으로 넣었다.', "I said his calluses didn't look like a beginner's. Kang Ducheol quietly slipped his hands into his sleeves."] }),
          opt('ask_knot', '어떤 매듭으로 묶으셨어요? 다시 묶는 게 낫겠는데요.', "What knot did you tie? Starting over might be better.",
            { stance: 'mid', next: 'knot' }),
        ],
        note: ['강두철 씨는 원줄과 목줄까지는 알겠는데 그다음은 모르겠다며 실뭉치를 내밀었다. 손바닥 굳은살이 유난히 두꺼웠다. 늙은이는 급할 게 없다고 했다.', "Kang Ducheol said he knew main line from leader but nothing past that, and held out the tangle. The calluses on his palms were unusually thick. An old man has nothing to hurry for, he said."],
      }),
      knot: scene([
        line(K, '매듭 이름 같은 걸 내가 아나. 책에 나온 대로 돌리고 감았지.', "Would I know the names of knots? I just twisted and wound it the way the book showed."),
        act(K, 'laugh'),
        line(P, '그럼 처음부터 다시 묶어 보죠. 천천히요.', "Then let's tie it again from the start. Slowly."),
        line(K, '그러세. 대신 천천히 보여 주게. 늙은이 눈이 따라갈 수 있게.', "Let's. But show me slowly. So an old man's eyes can keep up."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_knot', lineKo: '한 번 보면 잊어도 두 번 보면 남겠지.', lineEn: "See it once and I'll forget, but twice and it might stay." }),
        note: ['어떤 매듭으로 묶었느냐고 물었다. 강두철 씨는 책에 나온 대로 돌리고 감았을 뿐이라며, 다시 묶되 늙은이 눈이 따라가게 천천히 보여 달라고 했다.', "I asked what knot he'd tied. He'd only twisted and wound it as the book showed, he said — tie it again, but slowly, so an old man's eyes could follow."],
      }),
      bowed: scene([
        line(K, '허허, 이 동네에 오래 살면 다들 인사는 하지. 늙은이 대접이야.', "Ha, live in this town long enough and everyone says hello. It's how they treat the old."),
        line(P, '그런가요…', 'Is that so...'),
        line(K, '대접받는 늙은이가 매듭 하나를 못 묶네.', "And here's an old man so well treated he can't tie one knot."),
        line('', '(실뭉치를 슬쩍 들어 보인다.)', '(He holds up the ball of line a little.)'),
        line(K, '이거 좀 봐 주겠나.', 'Would you take a look at this?'),
      ], {
        choices: [
          opt('fair_enough', '오래 사신 분 대접이군요. 자, 줄 좀 보죠.', "That's respect for a long life, then. Here, let me see the line.",
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '그렇지, 그렇지. (자리를 내주며 웃는다. 웃음이 조금 빠르다.) 늙은이 대접은 이걸로 충분하네. 앉게.',
              lineEn: "That's it, that's it. (He laughs as he makes room. The laugh comes a little too quickly.) That's all the respect an old man needs. Sit." }) }),
          opt('not_usual', '그 정도 인사면 보통 분은 아니신 것 같은데요.', "A bow like that, you must be no ordinary man.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({ accept: true,
              lineKo: '(눈을 끔벅이다 허허 웃는다.) 보통 늙은이야. 매듭 하나 못 묶는. …보통이 아니면 이러고 있겠나. 자, 앉게.',
              lineEn: "(He blinks, then laughs.) An ordinary old man. Who can't tie one knot. ...Would I be sitting here like this if I weren't? Come, sit." }),
              note: ['그 정도 인사면 보통 분이 아닌 것 같다고 했다. 강두철 씨는 눈을 끔벅이다 보통 늙은이라고 웃었다.', "I said a bow like that meant he was no ordinary man. Kang Ducheol blinked, then laughed: just an ordinary old man."] }),
          opt('ask_first_time', '낚시는 처음이시라고요? 어쩌다 시작하셨어요?', 'You said you\'re new to fishing? What got you started?',
            { stance: 'mid', next: 'first' }),
        ],
        note: ['지나간 사람의 인사가 깍듯하더라고 하자, 강두철 씨는 이 동네에 오래 살면 다들 인사는 한다며 손을 내저었다.', "When I mentioned how properly that man had bowed, Kang Ducheol waved it off: live here long enough and everyone says hello."],
      }),
      first: scene([
        line(K, '허허, 그게… 평생 바다 일 언저리에서 살았는데, 이렇게 혼자 방파제에 앉아 보는 건 처음이야.', "Ha, well... I've lived around sea work all my life, but this is my first time sitting alone on a breakwater like this.", { act: 'look_sea' }),
        line(P, '바다 일이요?', 'Sea work?'),
        line(K, '이 나이 되니 앉아 보고 싶어지더군. 그래서 배우는 중이야.', "At my age, I found I wanted to sit. So I'm learning."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_first_time', lineKo: '자, 이 실부터 좀 봐 주게.', lineEn: 'Now, take a look at this line first.' }),
        note: ['어쩌다 낚시를 시작했느냐고 물었다. 평생 바다 일 언저리에서 살았는데 혼자 방파제에 앉아 보는 건 처음이라고, 이 나이 되니 앉아 보고 싶어졌다고 했다.', "I asked what had got him started. He'd lived around sea work all his life, he said, but never sat alone on a breakwater — at his age, he'd wanted to."],
      }),
    },
  },

  // N03-1 — 진행 중: 채비를 풀어 준다(목표 0). 가르치는 태도 — 천천히 다 풀어 준다 · 끊고 새로 · 직접 풀게 한다
  {
    id: 'n03_1_untangle', questId: 'N03-1', at: 'objective', objectiveIndex: 0, npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '자, 어디서부터 풀면 되나. 끝을 찾으면 된다고 책에 있던데, 끝이 안 보여.', "Now, where do we start? The book said find the end, but I can't see an end."),
        line(P, '끝이요… 잠깐만요.', 'The end... just a moment.'),
        line('', '(노인이 손가락으로 실을 이리저리 들춘다. 들출수록 더 감긴다.)', '(The old man picks at the line here and there. The more he picks, the tighter it winds.)'),
        line(K, '허허, 이것 봐. 또 감겼네.', 'Ha, look at that. Wound up again.'),
        line(K, '늙은이 손은 놔두고 자네가 좀 해 보게.', "Never mind an old man's hands. You have a go."),
      ], {
        choices: [
          opt('patient', '손 놓고 보고 계세요. 끝부터 하나씩 천천히 풀겠습니다.', "Just let go and watch. I'll work it loose from the end, one bit at a time.",
            { stance: 'giver', aff: { [K]: 0.04 }, flags: ['choice.n03_patient'], next: 'slow',
              note: ['손 놓고 보시라고 하고, 끝부터 하나씩 천천히 풀기로 했다.', 'I told him to let go and watch, and began working it loose from the end, slowly.'] }),
          opt('cut_it', '이건 끊고 새로 묶는 게 빠르겠습니다.', "It'd be quicker to cut this and tie a new one.",
            { stance: 'self', aff: { [K]: -0.03 }, flags: ['choice.n03_impatient'], next: 'cut',
              note: ['끊고 새로 묶는 게 빠르겠다며 칼로 잘랐다.', 'Saying it would be quicker to start fresh, I cut it with a knife.'] }),
          opt('your_hands', '제가 말로 할 테니 직접 풀어 보세요. 그래야 다음에 안 엉키십니다.', "I'll talk you through it, you do the untangling. That way it won't tangle next time.",
            { stance: 'mid', aff: { [K]: 0.02 }, flags: ['choice.n03_let_him'], next: 'self_tie',
              note: ['말로 일러 줄 테니 직접 풀어 보시라고 했다. 그래야 다음에 안 엉킨다고.', "I said I'd talk him through it and he should untangle it himself — that way it wouldn't tangle next time."] }),
        ],
        note: ['강두철 씨가 실뭉치를 내 무릎에 얹고 바짝 붙어 앉았다. 끝을 찾으라는데 끝이 안 보인다며 실을 들출수록 더 감았다.', 'Kang Ducheol set the tangle on my knee and sat right up close. The book said find the end, but he couldn\'t see one — and the more he picked, the tighter it wound.'],
      }),
      slow: scene([
        line('', '(노인이 손을 무릎에 얹고 내 손끝만 본다. 눈이 한 번도 엉뚱한 데로 가지 않는다.)', '(The old man rests his hands on his knees and watches only my fingertips. His eyes never once wander.)'),
        line(K, '…그렇게 고리를 먼저 넓혀 주는 거로군. 당기는 게 아니라.', '...So you widen the loop first. Instead of pulling.'),
        line(P, '네. 당기면 더 조여요.', 'Right. Pull and it only tightens.'),
        line('', '(엉킨 데가 하나씩 풀려 나간다.)', '(The tangle comes loose one piece at a time.)'),
        line(K, '허허, 십 분이 금방 가네. 남의 손 구경이 이렇게 재미있는 줄 몰랐어.', "Ha, ten minutes gone in no time. I never knew watching someone else's hands could be such fun."),
      ], {
        choices: [
          opt('next_you', '다음엔 강두철 씨가 해 보세요. 제가 옆에서 볼게요.', "Next time you try it. I'll watch from beside you.",
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '허허, 자네가 시키면 해야지. (눈을 가늘게 뜨고 풀린 줄을 노려본다.) 자, 이제 고기 얼굴이나 보세. 옆에 있어 주게.',
              lineEn: "Ha, if you say so, I'd better. (He narrows his eyes and glares at the loosened line.) Now, let's go and see a fish's face. Stay beside me." }) }),
          opt('you_watched', '보시는 눈이 처음 배우시는 눈이 아니던데요.', "The way you watch isn't the way a first-timer watches.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({
              lineKo: '(눈을 끔벅인다.) 허허, 늙은이가 할 일이 없어 눈만 바빴지. …자, 다 풀렸으면 넣어 보세. 고기 얼굴 좀 보자고.',
              lineEn: "(He blinks.) Ha, an old man with nothing to do keeps his eyes busy, that's all. ...Now, if it's loose, let's put it in. I want to see a fish's face." }) }),
          opt('done_now', '다 풀렸습니다. 이제 고기만 기다리면 됩니다.', "It's all loose. Now we just wait for a fish.",
            { stance: 'self', end: endTalk({
              lineKo: '고맙네, 고마워. (풀린 줄을 손바닥에 받쳐 든다.) 이제 물에 넣으면 되는 거지? 옆에 좀 더 앉아 있어 주게. 첫 입질은 같이 보고 싶어서.',
              lineEn: "Thank you, thank you. (He holds the freed line on his palm.) Now it just goes in the water, yes? Sit with me a little longer. I'd like to see the first bite together." }) }),
        ],
        note: ['강두철 씨는 내 손끝만 보았다. 눈이 한 번도 엉뚱한 데로 가지 않았다. 당기지 않고 고리를 먼저 넓히는 거라고 혼잣말을 했다. 십 분이 금방 갔다.', "Kang Ducheol watched only my fingertips; his eyes never wandered. You widen the loop first instead of pulling, he murmured. Ten minutes went by in no time."],
      }),
      cut: scene([
        act(K, 'silence'),
        line(K, '…허, 빠르긴 빠르군. 한 시간 감은 걸 칼 한 번에.', "...Ha, quick, I'll give you that. An hour's winding, gone in one stroke of the knife."),
        line(P, '새로 묶는 게 더 빠를 것 같아서요.', 'Tying a new one seemed faster.'),
        act(K, 'laugh'),
        line(K, '그래, 새로 묶으면 되지. 다만 늙은이는 이게 왜 엉켰는지가 궁금했는데.', 'Right, we just tie a new one. Only, this old man wanted to know why it tangled.'),
        line(K, '끊으면 그건 영영 모르지.', "Cut it and you'll never know."),
      ], {
        choices: [
          opt('sorry_why', '죄송합니다. 다음엔 왜 엉켰는지부터 같이 보죠.', "Sorry. Next time let's look at why it tangled first.",
            { stance: 'mid', aff: { [K]: 0.03 }, end: endTalk({
              lineKo: '허허, 그럼 다음 엉킴이 기다려지는군. (새 목줄을 내민다.) 이번 건 처음부터 같이 묶세. 천천히.',
              lineEn: "Ha, then I'll look forward to the next tangle. (He holds out a fresh leader.) Let's tie this one together from the start. Slowly." }) }),
          opt('water_first', '낚시는 물에 빨리 넣는 사람이 남는 겁니다.', "In fishing, the one who gets in the water fastest comes out ahead.",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({
              lineKo: '(새 목줄을 받아 든다. 묶는 손이 이상하게 내 손보다 빠르다.) …그것도 맞는 말이지. 자, 넣어 보세. 빨리.',
              lineEn: "(He takes the fresh leader. Oddly, his hands tie it faster than mine.) ...That's true enough too. Come, let's put it in. Quickly." }) }),
        ],
        note: ['강두철 씨는 잘린 실 끝을 한참 내려다봤다. 한 시간 감은 걸 칼 한 번에 끊었다며, 왜 엉켰는지 궁금했는데 끊으면 영영 모른다고 했다. 웃음이 조금 늦게 왔다.', "Kang Ducheol stared at the cut ends a long while. An hour's winding gone in one stroke — he'd wanted to know why it tangled, and now he never would. His laugh came a little late."],
      }),
      self_tie: scene([
        line(P, '고리를 먼저 넓히세요. 당기지 말고요.', "Widen the loop first. Don't pull."),
        line('', '(노인이 머뭇거리다 실을 쥔다. 고리를 넓히는가 싶더니, 손가락이 갑자기 빨라진다. 엉킨 데가 스르르 풀린다.)', '(The old man hesitates, then takes hold. He seems to widen the loop — then his fingers suddenly speed up, and the tangle slides loose.)'),
        line(K, '…어, 어. 이게 풀렸네?', "...Oh, oh. It's come undone?"),
        line('', '(멈칫하고 손을 거둔다.)', '(He stops short and pulls his hands back.)'),
        line(K, '허허, 초보 운이 좋구먼. 자네가 말로 잘 일러 준 덕이야.', 'Ha, beginner\'s luck. Thanks to you talking me through it so well.'),
      ], {
        choices: [
          opt('too_fast', '방금 손, 처음 하시는 손이 아니던데요.', "Those hands just now weren't a first-timer's hands.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({
              lineKo: '(손을 소매 안으로 넣는다.) 허허, 자네가 잘 가르치니 손이 먼저 알아들은 게지. …자, 고기나 보세.',
              lineEn: "(He tucks his hands into his sleeves.) Ha, you teach so well my hands understood before I did. ...Now, let's look for a fish." }) }),
          opt('well_done', '잘하셨어요. 그 손이면 금방 느시겠습니다.', "Well done. With hands like that, you'll improve in no time.",
            { stance: 'giver', aff: { [K]: 0.03 }, end: endTalk({
              lineKo: '허허, 칭찬받으니 늙은이 어깨가 다 들썩이네. (풀린 줄을 소중하게 감는다.) 자네 덕이야. 이제 고기 얼굴이나 보세.',
              lineEn: "Ha, a bit of praise and the old man's shoulders are dancing. (He winds the freed line carefully.) It's thanks to you. Now let's go and see a fish's face." }) }),
        ],
        note: ['말로 일러 주자 강두철 씨가 머뭇거리다 실을 쥐었다. 그러더니 손가락이 갑자기 빨라져 엉킨 데가 스르르 풀렸다. 그는 멈칫하고 손을 거두며 초보 운이라고 했다.', 'As I talked him through it, Kang Ducheol hesitantly took the line — then his fingers suddenly sped up and the tangle slid loose. He stopped short, pulled back, and called it beginner\'s luck.'],
      }),
    },
  },

  // 290차 — N03-1 끝내는 자리(강두철). 첫 고기 — 「선생님이라 부르겠네」
  {
    id: 'n03_1_done', questId: 'N03-1', at: 'complete', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '올라왔어, 올라왔어!', "It's up, it's up!", { act: 'look_up' }),
        line(P, '첫 고기네요. 축하드려요.', 'Your first fish. Congratulations.'),
        line(K, '허허, 이게 고기 얼굴이구먼.', 'Ha, so this is what a fish looks like.', { act: 'peer' }),
        line(P, '(챔질하는 손이 초보 같지 않았는데… 기분 탓인가.)', "(His strike didn't look like a beginner's... or did I imagine it?)"),
        line(K, '선생님이라 부르겠네. 늙은이가 오늘 하나 배웠어.', "I'll call you teacher. This old man learned something today."),
        line(P, '저를요? 저는 실만 풀어 드렸는데요.', "Me? All I did was untangle your line."),
        line(K, '그게 가르친 거지.', "That was the teaching."),
      ], {
        choices: [
          opt('knot_lesson', '그 매듭, 제가 배워야 할 것 같은데요', 'I think I should be learning that knot', {
            say: ['그 매듭, 제가 배워야 할 것 같은데요. 다시 보여 주세요.', 'I think I should be learning that knot. Show me again.'], next: 'knot' }),
          opt('pay', '품삯으로 주시면 됩니다', 'Wages will do', {
            end: endTalk({ complete: 'pay', lineKo: '그러세. 늙은이 가르쳐 준 값. 받게, 받아. 값을 치른 가르침이 오래 남는 법이야. 오늘 선생님 덕에 고기 얼굴을 봤으니 그 값까지.',
              lineEn: "Very well. The price of teaching an old man. Take it, take it. Teaching that's paid for lasts. And a little more, for the fish's face I saw today thanks to my teacher." }),
            note: ['품삯을 받았다. 지갑이 두꺼웠다. 강두철 씨는 지폐 한 장을 더 얹어 주었다.', 'I took wages. His wallet was thick. Kang Ducheol added one more note.'] }),
          opt('point', '배운 걸 정리해 두셨죠? 저도 좀 보여 주세요', "You've been writing down what you learned, haven't you? May I see?", {
            end: endTalk({ complete: 'point', lineKo: '…허, 눈치도 배웠구나. 가져가. 초보가 뭘 적었겠나. 선생님이 한 말 받아 적은 거지. 그러니 그거 원래 선생님 거야. 돌려주는 것뿐이네. 허허.',
              lineEn: "...Ha, you've learned to read people too. Take it. What would a beginner write? Just what my teacher said. So it was yours to begin with. I'm only giving it back. Ha." }),
            note: ['배운 걸 정리해 뒀느냐고 물었다. 강두철 씨는 수첩 뒷장 한 페이지를 찢어 주었다. 그 장만 유난히 정갈했다.', "I asked if he'd been writing down what he learned. Kang Ducheol tore a page from the back of his notebook for me. That page alone was strikingly neat."] }),
          opt('no_fee', '가르친 값은 됐습니다', 'No fee for the teaching', {
            say: ['가르친 값은 됐습니다. 첫 고기 보신 걸로 충분합니다.', 'No fee for the teaching. Seeing your first fish is enough.'],
            end: endTalk({ complete: 'no_fee', lineKo: '허허, 이거 참. 선생님이 욕심이 없으시구먼. 그럼 다음에 또 옆에 앉아 주게. 늙은이 낚시는 아직 갈 길이 멀어. 이 방파제 끝, 내 옆자리는 비워 두지.',
              lineEn: "Ha, well now. My teacher has no greed. Then sit beside me again another time. This old man's fishing has a long way to go. At the end of this breakwater, I'll keep the seat beside me free." }),
            note: ['가르친 값은 사양했다. 강두철 씨는 꺼내던 지갑을 도로 넣었다. 그 손이 잠깐 머뭇거렸다. 방파제 끝 자기 옆자리는 비워 두겠다고 했다.', 'I declined a fee. Kang Ducheol put his wallet back; his hand hesitated a moment. He would keep the seat beside him at the end of the breakwater free, he said.'] }),
        ],
        note: ['강두철 씨의 첫 고기가 올라왔다. 그는 나를 선생님이라 부르겠다고 했다. 챔질하는 손이 초보 같지 않다는 생각이 잠깐 들었지만 그냥 넘겼다.', "Kang Ducheol's first fish came up. He said he'd call me teacher. For a moment I thought his strike didn't look like a beginner's, but I let it go."],
      }),
      knot: scene([
        line(K, '선생님이 학생한테 배우는 날도 있는 거지. 자, 이렇게.', 'There are days the teacher learns from the student. Here — like this.'),
        line('', '(손놀림이 지나치게 빠르다.)', '(His hands move far too fast.)'),
        line(K, '어, 어… 이게 아닌가?', 'Oh, oh... isn\'t that it?'),
        line(P, '…방금 엄청 빠르셨는데요.', '...That was awfully quick just now.'),
        act(K, 'laugh'),
        line(K, '허허, 늙은이가 흉내만 낸 거야. 선생님 손을 보고 따라 했더니 손이 먼저 가는구먼.', "Ha, the old man was just imitating. I copied my teacher's hands and they ran ahead of me."),
        line('', '(줄을 다시 헝클어 놓는다. 일부러인 것 같기도 하다.)', '(He tangles the line up again. It might be on purpose.)'),
      ], {
        end: endTalk({ complete: 'knot_lesson' }),
        note: ['그 매듭을 다시 보여 달라고 했다. 강두철 씨의 손놀림이 지나치게 빨랐다. 그는 흉내만 낸 거라며 줄을 다시 헝클어 놓았다. 일부러인 것 같기도 했다.', 'I asked him to show me the knot again. His hands moved far too fast. Only imitating, he said, and tangled the line up again — perhaps on purpose.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N03-5 「도래 스무 개」 받는 자리(강두철 · 아직 초보 행세). 「손이 기억할 때까지」
  // ═══════════════════════════════════════════
  {
    id: 'n03_5_offer', questId: 'N03-5', at: 'offer', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '선생님, 왔나.', "Teacher, you're here."),
        line(P, '네. 또 엉키셨어요?', 'Yes. Tangled again?'),
        line(K, '허허, 오늘은 아니야.', 'Ha, not today.'),
        line('', '(도래 봉지를 흔들어 보인다.)', '(He shakes a bag of swivels at me.)'),
        line(K, '도래 스무 개 사 왔네.', "I've bought twenty swivels."),
        line(P, '스무 개나요?', 'Twenty?'),
        line(K, '손이 기억할 때까지 묶어 봐. 내가 세어 줄게.', "Tie them until your hands remember. I'll count for you."),
        line(P, '제가 묶고요?', 'I do the tying?'),
        line(K, '그래. 그 채비로 고기 셋만 낚아 보이면 끝이야.', 'Yes. Then show me three fish caught on those rigs and we\'re done.'),
      ], {
        choices: [
          opt('tie_twenty', '스무 번이요. 손이 기억할 때까지 해 볼게요', "Twenty times. I'll go until my hands remember", {
            next: 'tie' }),
          opt('why_twenty', '왜 하필 스무 번입니까?', 'Why twenty, of all numbers?', {
            say: ['왜 하필 스무 번입니까? 열 번이면 안 됩니까?', "Why twenty, of all numbers? Wouldn't ten do?"], next: 'why' }),
          opt('you_too', '강두철 씨는 안 묶으세요?', "Won't you tie some too?", {
            say: ['강두철 씨는 안 묶으세요? 같이 하시면 좋을 텐데요.', "Won't you tie some too? It'd be nice to do it together."], next: 'you_too' }),
          opt('beginners', '초보가 초보를 가르치는 건데, 괜찮으시겠어요?', "It's one beginner teaching another. Are you sure?", {
            next: 'beginners' }),
        ],
        note: ['강두철 씨가 도래를 스무 개 사 왔다. 손이 기억할 때까지 묶어 보라고, 자기가 세어 주겠다고 했다. 그 채비로 고기 셋을 낚아 보이면 끝이라고.',
          "Kang Ducheol had bought twenty swivels. Tie them until my hands remembered, he said, and he would count. Then show him three fish caught on those rigs."],
      }),
      tie: scene([
        line(K, '그래, 그래. 하나부터 천천히.', 'Good, good. From one, slowly.'),
        line(K, '빨리 묶은 스무 개보다 바로 묶은 스무 개가 낫다더군.', "They say twenty tied right beats twenty tied fast."),
        line('', '(자리를 깔고 앉아 도래 봉지를 흔든다.)', '(He spreads a mat, sits down and shakes the swivel bag.)'),
        line(K, '나는 세기만 하겠네. 늙은이가 할 줄 아는 게 셈뿐이라.', "I'll just count. Counting is all an old man is good for."),
      ], {
        end: endTalk({ accept: true, offer: 'tie_twenty', lineKo: '틀리면 하나부터 다시 셀 테니 각오하게.', lineEn: 'Get one wrong and I start again from one, so be ready.' }),
        note: ['스무 번, 손이 기억할 때까지 해 보겠다고 했다. 강두철 씨는 빨리 묶은 스무 개보다 바로 묶은 스무 개가 낫다며 자리를 깔고 앉았다.', "I said I'd do all twenty, until my hands remembered. Twenty tied right beats twenty tied fast, Kang Ducheol said, and spread a mat to sit on."],
      }),
      why: scene([
        line(K, '열 번이면 머리가 기억하고, 스무 번이면 손이 기억한다더군. 어디서 들은 말이야.', "They say ten times and your head remembers; twenty and your hands do. Something I heard somewhere."),
        line('', '(허허 웃는데 눈은 웃지 않는다.)', "(He laughs, but his eyes don't.)"),
        line(P, '머리랑 손이 다른가요?', 'Are the head and hands different?'),
        line(K, '머리는 급하면 잊어. 손은 안 잊지. 매듭은 꼭 급할 때 묶게 되거든.', "The head forgets when you're in a hurry. The hands don't. And you always end up tying knots in a hurry."),
      ], {
        end: endTalk({ accept: true, offer: 'why_twenty', lineKo: '그러니 스물.', lineEn: 'So, twenty.' }),
        note: ['왜 스무 번이냐고 물었다. 열 번이면 머리가, 스무 번이면 손이 기억한다고 했다. 머리는 급하면 잊지만 손은 안 잊는다고. 웃는데 눈은 웃지 않았다.', "I asked why twenty. Ten for the head, twenty for the hands, he said — the head forgets in a hurry, the hands don't. He laughed, but his eyes didn't."],
      }),
      you_too: scene([
        line(K, '나? 나는… 세는 게 공부야. 선생님 손을 보면서.', "Me? I... counting is my lesson. Watching my teacher's hands."),
        line('', '(도래 하나를 집어 만지작거리다 내려놓는다.)', '(He picks up a swivel, fiddles with it, then puts it down.)'),
        line(P, '(…방금 손에 익은 것 같았는데.)', '(...His hands looked used to that.)'),
        line(K, '늙은이가 같이 묶다가 엉키면 선생님 일만 늘어. 오늘은 자네 손 차례야.', "If the old man ties too and tangles it, it only makes more work for my teacher. Today it's your hands' turn."),
      ], {
        end: endTalk({ accept: true, offer: 'you_too', lineKo: '나는 옆에서 하나, 둘.', lineEn: "I'll be beside you. One, two." }),
        note: ['같이 묶자고 했더니 강두철 씨는 세는 게 자기 공부라고 했다. 도래 하나를 만지작거리던 손이 어딘지 익숙해 보였다.', "When I suggested he tie some too, Kang Ducheol said counting was his lesson. The hand fiddling with a swivel looked somehow practised."],
      }),
      beginners: scene([
        act(K, 'laugh'),
        line(K, '허허, 초보끼리가 제일 잘 통하는 법이야. 고수는 설명을 안 해 주거든. 다 안다고 생각해서.', "Ha, beginners understand each other best. Experts don't explain. They think everyone already knows."),
        line('', '(도래 봉지를 내 앞에 쏟는다.)', '(He tips the bag of swivels out in front of me.)'),
        line(P, '그럼… 해 볼게요.', "Then... I'll give it a go."),
      ], {
        end: endTalk({ accept: true, offer: 'beginners', lineKo: '자, 하나. 셀 테니 묶게. 둘은 내가 셀 때까지 기다리고.', lineEn: "Right — one. I count, you tie. Wait for me to say two." }),
        note: ['초보가 초보를 가르쳐도 되겠느냐고 하자, 강두철 씨는 초보끼리가 제일 잘 통한다고 웃으며 도래 봉지를 내 앞에 쏟았다.', 'When I asked whether one beginner should teach another, Kang Ducheol laughed — beginners understand each other best — and tipped the swivels out before me.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N03-5 「도래 스무 개」 — 행동 단계: 스무 번째 채비를 보여 준다(목표 1 · 셋째 단계). 아직 초보 행세 — 셈이 지나치게 정확하다
  // ═══════════════════════════════════════════
  {
    id: 'n03_5_twentieth', questId: 'N03-5', at: 'action', objectiveIndex: 1, step: 2, npcId: K, start: 'start',
    nodes: {
      start: scene([
        line('', '(노인이 도래 봉지를 거꾸로 털어 빈 것을 확인한다.)', "(The old man shakes the swivel bag upside down to check it's empty.)"),
        line(K, '…열여덟, 열아홉. 자, 마지막 하나.', '...Eighteen, nineteen. Right, the last one.'),
        line(P, '…됐습니다.', '...Done.'),
        line(K, '스물이야.', 'Twenty.'),
        line('', '(내가 묶은 스무 번째 채비를 받아 매듭을 눈높이로 든다. 당겨 보는 손목이 짧고 정확하다.)', '(He takes the twentieth rig I tied and holds the knot up at eye level. The flick of his wrist as he tests it is short and exact.)'),
        line(K, '허허, 이제 손이 기억하나 보네. 자네가 보기엔 어떤가, 이 매듭.', 'Ha, looks like your hands remember now. What do you make of this knot yourself?'),
      ], {
        choices: [
          opt('proud', '스무 번째가 제일 잘 묶였습니다. 손이 저절로 움직이더라고요.', 'The twentieth came out best. My hands moved on their own.',
            { stance: 'giver', aff: { [K]: 0.03 }, next: 'good' }),
          opt('check_it', '강두철 씨가 한번 당겨 봐 주세요. 제 눈엔 아직 모르겠습니다.', "Would you give it a pull? I still can't tell by eye.",
            { stance: 'mid', next: 'tug' }),
          opt('just_twenty', '스무 개 다 묶었으니 이제 됐죠? 손목이 저립니다.', "That's all twenty tied, so we're done, right? My wrist is numb.",
            { stance: 'self', aff: { [K]: -0.02 }, next: 'tired' }),
          opt('no_knife', '이번엔 칼 한 번 안 대고 스무 번을 다 묶었습니다.', "This time I tied all twenty without touching the knife once.",
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_impatient' }, end: endTalk({
              lineKo: '(허허 크게 웃는다.) 그날 칼로 툭 끊던 사람이 스물을 다 채웠어. (매듭을 엄지로 쓸어 본다.) 가르치는 쪽이 더 배운다는 게 이거야. 아니, 배우는 쪽이 더 가르치는 건가.',
              lineEn: "(He laughs out loud.) The one who snipped through with a knife that day has tied all twenty. (He runs his thumb over the knot.) This is what they mean, the one teaching learns more. Or is it the one learning who teaches more?" }),
              note: ['그날 칼로 끊었던 내가 이번엔 칼 한 번 안 대고 스무 번을 다 묶었다. 강두철 씨가 크게 웃었다.', 'The one who had cut the line that day had now tied all twenty without touching a knife. Kang Ducheol laughed out loud.'] }),
        ],
        note: ['강두철 씨가 하나도 틀리지 않고 스물까지 셌다. 내 스무 번째 매듭을 눈높이로 들고 당겨 보는 손목이 짧고 정확했다.', 'Kang Ducheol counted to twenty without a single slip. Holding my twentieth knot at eye level, he tested it with a short, exact flick of the wrist.'],
      }),
      good: scene([
        line(K, '그렇지. 열 번째부터 자네 손가락이 저 혼자 가더군.', 'That\'s right. From the tenth on, your fingers went by themselves.'),
        line(P, '(그러고 보니 중간부터는 손이 먼저 갔다.)', '(Come to think of it, from halfway on, my hands went first.)'),
        line(K, '그때부터 세는 게 즐거웠어.', 'Counting was a pleasure from then.'),
        line('', '(매듭을 한 번 더 당겨 본다. 꿈쩍도 안 한다.)', "(He tugs the knot once more. It doesn't budge.)"),
        line(K, '이 매듭이 자네 채비를 몇 번은 살릴 거야. 급할 때 머리는 잊어도 손은 안 잊거든.', "This knot will save your rig a few times. In a hurry the head forgets, but the hands don't."),
      ], {
        choices: [
          opt('thanks_count', '세어 주셔서 끝까지 했습니다. 고맙습니다.', 'I made it to the end because you counted. Thank you.',
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '허허, 늙은이가 할 줄 아는 게 셈뿐이라. (빈 도래 봉지를 접는다.) 다음엔 다른 매듭을 들고 오지. 선생님한테 배울 게 아직 많아.',
              lineEn: "Ha, counting is all an old man's good for. (He folds up the empty swivel bag.) Next time I'll bring a different knot. I've plenty more to learn from my teacher." }) }),
          opt('how_know', '열 번째부터인 걸 어떻게 아셨어요? 저도 몰랐는데요.', "How did you know it was from the tenth? I didn't even know myself.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({
              lineKo: '(잠깐 말이 없다가 허허 웃는다.) 늙은이 눈이 심심해서 손만 봤지. 손은 거짓말을 안 하거든. …자, 이걸로 고기나 셋 낚아 보세.',
              lineEn: "(He's quiet a moment, then laughs.) An old man's eyes get bored, so I watched your hands. Hands don't lie. ...Now, let's catch three fish with these." }) }),
          opt('you_tie', '이번엔 강두철 씨도 하나 묶어 보세요. 그날처럼요.', 'This time you tie one too. Like that first day.',
            { stance: 'mid', aff: { [K]: 0.01 }, flags: ['choice.n03_had_doubts'], requires: { flag: 'choice.n03_let_him' }, end: endTalk({
              lineKo: '(도래 하나를 집더니 눈 깜짝할 새 묶어 낸다. 그러고는 얼른 내 채비 뒤에 숨긴다.) 허허, 이건 못 본 걸로 하게. 늙은이 손이 또 먼저 나갔어.',
              lineEn: "(He picks up a swivel and ties it in the blink of an eye. Then he quickly hides it behind my rig.) Ha, pretend you didn't see that. The old man's hands ran ahead again." }) }),
        ],
        note: ['스무 번째가 제일 잘 묶였다고 했다. 강두철 씨는 열 번째부터 내 손가락이 저 혼자 가더라고, 이 매듭이 내 채비를 몇 번은 살릴 거라고 했다.', 'I said the twentieth came out best. From the tenth on my fingers went by themselves, Kang Ducheol said — this knot would save my rig a few times.'],
      }),
      tug: scene([
        line('', '(노인이 매듭을 당겨 보고, 끝을 손톱으로 짚는다.)', '(The old man tugs the knot, then points at its end with a fingernail.)'),
        line(K, '끝을 너무 바짝 잘랐어. 손톱만큼은 남겨야 해. 당기다 보면 조금씩 빨려 들어가거든.', "You trimmed the end too close. Leave a fingernail's worth. It creeps in a little as you pull."),
        line(P, '…', '...'),
        line('', '(말해 놓고 아차 하는 얼굴이다.)', '(He looks as if he wishes he hadn\'t said it.)'),
        line(K, '…허허, 어디서 들은 말이야. 책에서 봤나. 늙은이가 아는 척을 했네.', "...Ha, something I heard somewhere. Read it in a book, maybe. An old man showing off."),
      ], {
        choices: [
          opt('noted', '손톱만큼이요. 기억해 두겠습니다.', "A fingernail's worth. I'll remember that.",
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '그래, 그거면 돼. (빈 도래 봉지를 접어 주머니에 넣는다.) 스물. 이제 눈 감고도 묶겠네. 이걸로 셋만 낚아 보이면 끝이야.',
              lineEn: "Right, that's all it takes. (He folds the empty swivel bag into his pocket.) Twenty. You could tie it with your eyes shut now. Land three on these and you're done." }) }),
          opt('book_doubt', '책에서 보신 것치고는 너무 정확하신데요.', "That's awfully precise for something out of a book.",
            { stance: 'other', aff: { [K]: -0.01 }, flags: ['choice.n03_had_doubts'], end: endTalk({
              lineKo: '(손을 소매 안으로 넣는다.) 허허, 늙은이가 책을 많이 읽었나 보지. …스물. 잘했네, 선생님. 진짜로.',
              lineEn: "(He tucks his hands into his sleeves.) Ha, I suppose the old man reads a lot of books. ...Twenty. Well done, teacher. Truly." }) }),
        ],
        note: ['한번 당겨 봐 달라고 했다. 강두철 씨는 끝을 너무 바짝 잘랐다며 손톱만큼은 남기라고 했다. 말해 놓고 아차 하는 얼굴로, 책에서 본 말이라고 얼버무렸다.', "I asked him to give it a pull. I'd trimmed the end too close, Kang Ducheol said — leave a fingernail's worth. Then, looking as if he wished he hadn't, he passed it off as something from a book."],
      }),
      tired: scene([
        act(K, 'laugh'),
        line(K, '저리지. 스무 번이면 저려야 해. 저린 데까지 가야 손이 기억하는 거야.', "Of course it's numb. Twenty times, it ought to be. Your hands only remember once you've gone as far as numb."),
        line(P, '…그런가요.', '...Is that so.'),
        line('', '(그래도 눈빛이 조금 서운하다.)', '(Still, his eyes look a little let down.)'),
        line(K, '열 번에서 멈추는 사람이 대부분이야. 자네는 스물을 채웠어. 저린 건 금방 가.', 'Most people stop at ten. You made it to twenty. The numbness passes quickly.'),
      ], {
        choices: [
          opt('fair_point', '말씀 듣고 보니 저린 게 남는 거네요.', "Put like that, the numbness is what stays with you.",
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '그렇지. 저린 손이 기억하는 손이야. (내 손목을 툭 친다.) 이제 그 손으로 고기 셋만 낚아 보이게.',
              lineEn: "That's it. A numb hand is a hand that remembers. (He taps my wrist.) Now show me three fish caught with that hand." }) }),
          opt('pay_up', '그래도 연습 상대 해 드린 값은 쳐 주셔야죠.', "Still, you owe me something for being your practice partner.",
            { stance: 'self', aff: { [K]: -0.02 }, end: endTalk({
              lineKo: '(지갑을 꺼내려다 멈춘다.) 허허, 그건 일 다 끝나고. 이 채비로 고기 셋 낚아 보이는 것까지가 일이야.',
              lineEn: "(He starts to take out his wallet, then stops.) Ha, that comes when the job's done. Catching three fish on these rigs is part of the job." }) }),
        ],
        note: ['손목이 저리다고 했더니, 강두철 씨는 저린 데까지 가야 손이 기억한다고 웃었다. 그래도 눈빛이 조금 서운해 보였다.', "When I said my wrist was numb, Kang Ducheol laughed — you have to go as far as numb for the hands to remember. Still, his eyes looked a little let down."],
      }),
    },
  },

  // 290차 — N03-5 끝내는 자리(강두철). 묶은 채비로 셋을 올렸다
  {
    id: 'n03_5_done', questId: 'N03-5', at: 'complete', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(P, '제가 묶은 채비로 세 마리 올렸어요.', 'I landed three on the rigs I tied.'),
        line(K, '허허, 봤네. 하나도 안 풀렸지?', "Ha, I saw. Not one came undone, did it?"),
        line(P, '네. 당겨도 꿈쩍도 안 하더라고요.', "No. They didn't budge, however hard it pulled."),
        line(K, '이제 눈 감고도 묶겠네.', 'Now you could tie it with your eyes shut.', { act: 'nod' }),
        line(K, '손이 기억하면, 그다음부턴 손이 알아서 해.', 'Once your hands remember, from then on your hands take care of it.'),
      ], {
        choices: [
          opt('lesson', '강두철 씨도 같이 묶으셨죠. 손이 저보다 빠르시던데요', 'You were tying too. Your hands were faster than mine', {
            end: endTalk({ complete: 'lesson', lineKo: '…늙은이가 심심해서 그런 거지. 다음엔 다른 매듭 가르쳐 주지.', lineEn: "...Just an old man who got bored. Next time I'll teach you a different knot." }),
            note: ['강두철 씨도 같이 묶지 않았느냐고, 손이 나보다 빠르더라고 했다. 그는 심심해서 그랬다며 남은 도래를 내 채비통에 쏟아 넣었다. 다음엔 다른 매듭을 가르쳐 주겠다고 했다.', "I said he'd been tying too, and faster than me. Just bored, he said, and tipped the leftover swivels into my tackle box — next time he'd teach me a different knot."] }),
          opt('pay', '연습 상대 해 드렸으니 품삯 받겠습니다', "I was your practice partner. I'll take wages", {
            end: endTalk({ complete: 'pay', lineKo: '그러세. 값은 값이지. 연습 상대도 일이야. 일한 사람한테 값을 안 치르면 다음엔 아무도 옆에 안 앉아 주거든. 늙은이가 그 정도 셈은 하네.',
              lineEn: "Very well. A price is a price. Being a practice partner is work too. Don't pay those who work and next time nobody sits beside you. An old man can count that much." }),
            note: ['품삯을 받았다. 돈 세는 손은 또 빨랐다.', 'I took wages. His money-counting hands were quick again.'] }),
          opt('decline', '이웃 일인데 무슨 품삯입니까', "We're neighbours. What wages?", {
            end: endTalk({ complete: 'decline', lineKo: '…그 말, 오래 기억하겠네. 이웃이라. 이 항구에서 그 말 듣기가 쉽지 않은데. 다음엔 이웃끼리 커피나 하세. 늙은이가 사지.',
              lineEn: "...I'll remember that a long time. Neighbours. You don't often hear that in this harbour. Next time, let's have a coffee as neighbours. The old man's buying." }),
            note: ['이웃 일에 품삯은 무슨, 하고 사양했다. 강두철 씨는 그 말을 오래 기억하겠다고 했다. 다음엔 이웃끼리 커피나 하자고.', 'I turned down wages — what are neighbours for? Kang Ducheol said he would remember that a long time. Next time, coffee, as neighbours.'] }),
          opt('suspect', '정말 낚시 처음 하시는 거 맞으세요?', 'Are you really new to fishing?', {
            next: 'suspect' }),
        ],
        note: ['내가 묶은 채비로 세 마리를 올렸다. 하나도 풀리지 않았다. 강두철 씨는 이제 눈 감고도 묶겠다고, 손이 기억하면 그다음부턴 손이 알아서 한다고 했다.', "I landed three on rigs I'd tied, and not one came undone. Kang Ducheol said I could tie it with my eyes shut now — once the hands remember, they take care of it."],
      }),
      suspect: scene([
        act(K, 'laugh'),
        line(K, '허허, 이 늙은이를 의심하는 겐가.', 'Ha, you suspect this old man, do you?'),
        line('', '(도래 봉지를 접으며 웃는다. 대답은 하지 않는다.)', "(He folds up the swivel bag, smiling. He doesn't answer.)"),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'suspect', lineKo: '처음이든 아니든 오늘 스무 번 묶은 건 선생님 손이야. 그건 의심할 거 없지. 다음 매듭 배울 날이나 받아 두게.',
          lineEn: "First time or not, the hands that tied twenty today were my teacher's. No need to doubt that. Just set a day to learn the next knot." }),
        note: ['정말 낚시가 처음이냐고 물었다. 강두철 씨는 웃으며 도래 봉지를 접을 뿐, 대답하지 않았다.', 'I asked whether he was really new to fishing. Kang Ducheol only smiled and folded the swivel bag. He did not answer.'],
      }),
    },
  },
];
