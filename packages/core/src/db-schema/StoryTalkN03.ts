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

  // ═══════════════════════════════════════════
  // 290차 — N03-2 「조합장님」 받는 자리(강두철 · 부산 교육장). 들켰다 — 「계속 가르쳐 줄 건가」(대답은 전갱이 뒤에)
  // ═══════════════════════════════════════════
  {
    id: 'n03_2_offer', questId: 'N03-2', at: 'offer', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line('', '(부산 품질관리 교육장. 강사가 맨 앞줄 노인을 「조합장님」이라고 부른다. 방파제의 그 노인이다.)', '(The quality-control course in Busan. The instructor addresses the old man in the front row as Chairman. It is the old man from the breakwater.)'),
        line(P, '(…조합장? 방파제에서 채비 못 묶던 그분이?)', "(...Chairman? The man who couldn't tie a rig on the breakwater?)"),
        line('', '(교육이 끝나자 노인이 먼저 다가온다.)', '(When the session ends, the old man comes over first.)'),
        line(K, '…들켰네.', "...Found out, then."),
        line(P, '강두철 씨…', 'Ducheol...'),
        line(K, '조합장이야. 미안하네.', "I'm the chairman. I'm sorry."),
        line(P, '…', '...'),
        line(K, '그래도 자네가 앉아 준 방파제는 진짜였어.', 'Still, that breakwater where you sat with me was real.'),
        line(K, '계속 가르쳐 줄 건가.', 'Will you keep teaching me?'),
      ], {
        choices: [
          opt('answer_fishing', '대답은 낚시하면서 드릴게요', "I'll give you my answer while we fish", {
            say: ['대답은 낚시하면서 드릴게요. 전갱이부터 잡으시죠.', "I'll answer while we fish. Let's catch some horse mackerel first."], next: 'fishing' }),
          opt('ask_coop', '수협 조합장 말씀이세요?', 'You mean chairman of the fisheries co-op?', {
            say: ['조합장이시면… 수협 조합장 말씀이세요?', 'Chairman... you mean of the fisheries co-op?'], next: 'coop' }),
          opt('why_pretend', '왜 초보인 척하셨어요?', 'Why did you pretend to be a beginner?', {
            say: ['왜 초보인 척하셨어요? 저를 시험하신 겁니까?', 'Why did you pretend to be a beginner? Were you testing me?'], next: 'pretend' }),
          opt('hurt', '솔직히 좀 서운합니다', "Honestly, I'm a little hurt", {
            say: ['솔직히 좀 서운합니다. 저만 모르고 있었네요.', "Honestly, I'm a little hurt. I was the only one who didn't know."], next: 'hurt' }),
        ],
        note: ['부산 교육장 맨 앞줄에 방파제의 그 노인이 앉아 있었다. 강사가 그를 조합장님이라고 불렀다. 강두철 씨는 먼저 다가와 들켰다며 미안하다고, 그래도 내가 앉아 준 방파제는 진짜였다고 했다. 계속 가르쳐 줄 거냐고 물었다.',
          "In the front row of the Busan course sat the old man from the breakwater, and the instructor called him Chairman. Kang Ducheol came over first: found out, he said, and sorry — but the breakwater where I sat with him was real. Would I keep teaching him?"],
      }),
      fishing: scene([
        act(K, 'laugh'),
        line(K, '허허, 그게 좋겠네. 교육장 앞바다에 전갱이가 붙는다더군.', 'Ha, that would be best. They say horse mackerel come in off the course.'),
        line(K, '…아니, 붙어. 이제 아는 척해도 되겠지.', "...No — they do. I suppose I can stop pretending not to know."),
        line(P, '두 마리쯤 올리면 대답이 나오겠죠.', "Two or so, and I'll have an answer."),
        line(K, '천천히 생각하게. 대답 재촉하는 조합장은 표결도 재촉하는 법이야.', "Take your time. A chairman who rushes answers rushes votes too."),
      ], {
        end: endTalk({ accept: true, offer: 'answer_fishing', lineKo: '나는 그런 사람은 되기 싫어.', lineEn: "I don't want to be that kind of man." }),
        note: ['대답은 낚시하면서 하겠다고 했다. 강두철 씨는 교육장 앞바다에 전갱이가 붙는다더니, 이제 아는 척해도 되겠다며 멋쩍게 웃었다. 천천히 생각하라고.', "I said I'd answer while we fished. Kang Ducheol said the horse mackerel come in off the course — then, sheepishly, that he could stop pretending not to know. Take your time, he said."],
      }),
      coop: scene([
        line(K, '그래. 이 바닷가 어촌계들이 모인 수협의 조합장이야. 위판장도 수협이 열지.', 'Yes. Chairman of the fisheries co-op that the village co-ops along this coast belong to. The auction floor is run by the co-op too.'),
        line('', '(명함을 꺼냈다가 도로 넣는다.)', '(He takes out a business card, then puts it back.)'),
        line(P, '그런 분이 방파제에서…', 'And someone like that, on the breakwater...'),
        line(K, '매듭 못 묶는 척을 했으니 할 말이 없네. 그래도 그날 자네가 풀어 준 십 분은 진짜였어. 그건 믿어 주게.', "Pretended he couldn't tie a knot. I've nothing to say for myself. But the ten minutes you spent untangling it that day were real. Believe that much."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_coop', lineKo: '대답은 전갱이 낚으면서 천천히 하고.', lineEn: 'Give me your answer slowly, while you catch the horse mackerel.' }),
        note: ['수협 조합장이냐고 물었다. 이 바닷가 어촌계들이 모인 수협의 조합장이고 위판장도 수협이 연다고 했다. 명함을 꺼냈다가 도로 넣었다. 그날 내가 풀어 준 십 분은 진짜였다고.', "I asked if he meant the fisheries co-op. Yes — chairman of the co-op the coast's village co-ops belong to; the auction floor is theirs too. He took out a card and put it back. The ten minutes I spent untangling that day were real, he said."],
      }),
      pretend: scene([
        line(K, '시험은 무슨.', 'Testing? Hardly.', { act: 'shake_head' }),
        line(K, '조합장이라고 하면 다들 허리부터 굽혀. 채비를 물어도 정답 대신 듣기 좋은 말을 하지.', "Say chairman and everyone bows first. Ask about a rig and you get what you'd like to hear instead of the right answer."),
        line(P, '…그날 지나가던 분이 인사하던 게 그래서였군요.', '...So that was why the man passing by bowed that day.'),
        line(K, '그날 자네는 내가 누군지 몰랐고, 그래서 진짜로 가르쳐 줬어. 그게 듣고 싶었어. 미안하네.', "That day you didn't know who I was, so you taught me for real. That's what I wanted to hear. I'm sorry."),
      ], {
        end: endTalk({ accept: true, offer: 'why_pretend', lineKo: '대답은 전갱이 두 마리 올린 다음에 들려주게.', lineEn: 'Let me hear your answer once you have landed two horse mackerel.' }),
        note: ['왜 초보인 척했느냐고, 시험이었느냐고 물었다. 조합장이라고 하면 다들 허리부터 굽히고 듣기 좋은 말만 한다고 했다. 그날 나는 그가 누군지 몰랐기에 진짜로 가르쳐 주었고, 그게 듣고 싶었다고.', "I asked why he'd pretended — was it a test? Say chairman and everyone bows and tells you what you want to hear, he said. That day I hadn't known who he was, so I taught him for real. That was what he'd wanted."],
      }),
      hurt: scene([
        line(K, '서운할 만하지. 화를 내도 할 말이 없네.', "You've every right. If you got angry I'd have nothing to say."),
        line('', '(모자를 벗어 손에 쥔다.)', '(He takes off his cap and holds it in his hands.)'),
        line(P, '…', '...'),
        line(K, '대답은 천천히 하게. 전갱이 두 마리 낚는 동안 생각해 보고.', 'Take your time answering. Think it over while you catch two horse mackerel.'),
        line(K, '거리를 두겠다 해도 그건 자네 몫이야.', 'If you decide to keep your distance, that is yours to decide.'),
      ], {
        end: endTalk({ accept: true, offer: 'hurt', lineKo: '나는 그 대답을 받을 자격밖에 없네.', lineEn: 'All I have the right to do is receive that answer.' }),
        note: ['솔직히 서운하다고 했다. 강두철 씨는 모자를 벗어 손에 쥐고, 화를 내도 할 말이 없다고 했다. 거리를 두겠다 해도 그건 내 몫이라고.', "I said honestly I was hurt. Kang Ducheol took off his cap and held it — if I got angry, he'd have nothing to say. Keeping my distance would be my call."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N03-2 「조합장님」 — 진행 중: 교육장에서 재회(목표 1). 계속 가르친다 · 거리를 둔다 · 속인 것을 따진다
  //   문간에 동명항 어촌계 사람들과 도현수가 있다 — 여기서 한 말은 항구로 그대로 간다
  // ═══════════════════════════════════════════
  {
    id: 'n03_2_reveal', questId: 'N03-2', at: 'objective', objectiveIndex: 1, npcId: K, start: 'start',
    nodes: {
      start: scene([
        line('', '(교육이 끝난 교육장. 맨 앞줄 책상에 「조합장」 명패가 놓여 있다. 노인이 그 명패를 손바닥으로 덮고 앉아 있다.)', '(The course is over and the room has emptied. On the front-row desk sits a name plate that reads Chairman. The old man sits with his palm laid over it.)'),
        line('', '(문간에서는 동명항 어촌계 사람 몇이 이쪽을 힐끔거린다. 도현수도 그 사이에 있다.)', '(In the doorway a few people from the Dongmyeong fishing co-op keep glancing this way. Do Hyeonsu is among them.)'),
        line(K, '전갱이는 올렸나.', 'Did you land the horse mackerel?'),
        line(P, '네. 두 마리요.', 'Yes. Two.'),
        line(K, '…그래, 자네는 늘 할 일부터 하지.', '...Of course. You always do the job first.'),
        line(K, '이제 아까 그 대답을 듣고 싶네. 계속 가르쳐 줄 건가, 아니면 이제 거리를 둘 건가.', "Now I'd like that answer. Will you keep teaching me, or keep your distance from now on?"),
      ], {
        choices: [
          opt('keep_teaching', '방파제에선 강두철 씨가 제 학생입니다. 명패는 여기 두고 오세요.', "On the breakwater you're my student. Leave the name plate here when you come.",
            { stance: 'giver', aff: { [K]: 0.06, coop: 0.02, hyeonsu: -0.02 }, flags: ['choice.n03_kept_teaching'], next: 'teach_on',
              note: ['방파제에선 그가 내 학생이라고 했다. 명패는 두고 오라고.', 'I told him that on the breakwater he was my student — leave the name plate behind.'] }),
          opt('keep_distance', '속이신 건 속이신 겁니다. 당분간은 거리를 두겠습니다.', "A deception is a deception. I'll keep my distance for a while.",
            { stance: 'self', aff: { [K]: -0.06, hyeonsu: 0.01 }, flags: ['choice.n03_kept_distance'], next: 'distance',
              note: ['속인 건 속인 거라고, 당분간 거리를 두겠다고 했다.', 'I said a deception is a deception, and that I would keep my distance for a while.'] }),
          opt('call_out', '그날 엉킨 실도, 첫 입질에 놀라시던 것도 다 연기였습니까?', 'The tangled line that day, the surprise at your first bite. Was all of it an act?',
            { stance: 'other', aff: { [K]: -0.08, coop: -0.03, hyeonsu: 0.03 }, flags: ['choice.n03_called_out'], next: 'called',
              note: ['그날 엉킨 실도, 첫 입질에 놀라던 것도 다 연기였느냐고 따졌다.', 'I demanded to know whether the tangled line and his surprise at the first bite had all been an act.'] }),
          opt('knew_doubts', '사실 짐작은 하고 있었습니다. 보통 초보가 아니셨으니까요.', 'To be honest, I already had my suspicions. You were no ordinary beginner.',
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_had_doubts' }, next: 'knew' }),
        ],
        note: ['교육이 끝난 교육장에서 강두철 씨가 「조합장」 명패를 손바닥으로 덮고 앉아 있었다. 문간에서 어촌계 사람들과 도현수 씨가 지켜보았다. 그는 계속 가르쳐 줄 건지, 거리를 둘 건지 물었다.',
          "In the emptied classroom Kang Ducheol sat with his palm over the Chairman name plate, while co-op people and Do Hyeonsu watched from the doorway. Would I keep teaching him, he asked, or keep my distance?"],
      }),
      teach_on: scene([
        line('', '(명패에서 손을 뗀다.)', '(He lifts his hand from the name plate.)'),
        act(K, 'silence'),
        line(K, '…허. 그 말 듣고 싶었네.', '...Ha. I wanted to hear that.'),
        line(K, '조합장 자리에 앉으면 다들 내게 답을 가져와. 질문을 가져오는 사람은 없지.', "Sit in the chairman's seat and everyone brings you answers. Nobody brings questions."),
        line('', '(문간에서 누군가 휘파람을 분다. 도현수가 고개를 돌린다.)', '(Someone in the doorway whistles. Do Hyeonsu turns his head away.)'),
        line(K, '그래, 선생님. 다음 숙제는 뭔가.', "All right, teacher. What's the next assignment?"),
      ], {
        choices: [
          opt('homework', '다음엔 매듭을 일부러 엉키게 하지 마시고 그냥 오세요.', "Next time, don't tangle your knot on purpose. Just come as you are.",
            { stance: 'giver', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '허허! 숙제가 어렵구먼. 엉키게 하는 게 더 쉬운데. (명패를 가방에 넣는다.) 알겠네. 다음엔 이름 달고 가지. 방파제에서 보세.',
              lineEn: "Ha! That's a hard assignment. Tangling is the easy part. (He puts the name plate in his bag.) Very well. Next time I'll come under my own name. See you on the breakwater." }) }),
          opt('patient_again', '그날처럼 천천히 하겠습니다. 강두철 씨도 급할 게 없으시잖아요.', "I'll take it slowly, like that day. You've nothing to hurry for either, have you?",
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_patient' }, end: endTalk({
              lineKo: '(웃음이 번진다.) 그날 내가 그랬지. 급할 게 없는 사람이라고. …사실 평생 급했어. 방파제에서만 안 급했지.',
              lineEn: "(A smile spreads across his face.) I did say that, that day. A man with nothing to hurry for. ...The truth is I've been in a hurry all my life. Only on the breakwater was I not." }) }),
          opt('let_him_again', '이번엔 숨기지 말고 직접 묶으세요. 제가 보겠습니다.', "This time, don't hide it. Tie it yourself. I'll watch.",
            { stance: 'mid', aff: { [K]: 0.03 }, requires: { flag: 'choice.n03_let_him' }, end: endTalk({
              lineKo: '(손을 내려다본다.) 그날 손이 먼저 나가서 혼났지. 허허. 이제 숨길 것도 없으니 내가 묶고 자네가 보게. 틀리면 혼내고.',
              lineEn: "(He looks down at his hands.) That day my hands ran ahead of me and I got a fright. Ha. Nothing left to hide now, so I'll tie and you watch. Scold me if I get it wrong." }) }),
        ],
        note: ['강두철 씨는 명패에서 손을 떼고 한참 나를 봤다. 그 말이 듣고 싶었다고, 조합장 자리엔 답만 오고 질문은 안 온다고 했다. 다음 숙제는 뭐냐고 물었다.', "Kang Ducheol lifted his hand from the name plate and looked at me a long time. He'd wanted to hear that — the chairman's seat gets answers, never questions. What was the next assignment, he asked."],
      }),
      distance: scene([
        line(K, '…그럴 만하지.', '...Fair enough.', { act: 'nod' }),
        line(K, '속인 건 나니까 거리는 자네가 정하게.', "I'm the one who deceived you, so you set the distance."),
        line(P, '…', '...'),
        line(K, '그래도 방파제에서 인사는 하세.', "But let's still say hello on the breakwater."),
        line('', '(문간의 어촌계 사람들이 슬그머니 흩어진다.)', '(The co-op people in the doorway quietly drift away.)'),
        line(K, '늙은이가 그것까지 잃으면 너무 많이 잃는 거라.', "If an old man loses that too, he's lost too much."),
      ], {
        choices: [
          opt('hello_ok', '인사는 드리겠습니다. 그 이상은 아직입니다.', "I'll say hello. Anything more, not yet.",
            { stance: 'mid', aff: { [K]: 0.02 }, end: endTalk({
              lineKo: '그거면 됐네. 아직이라는 말이 있잖나. (명패를 가방에 넣는다.) 아직이 끝나는 날엔, 처음부터 내 이름으로 앉겠네. 초보 행세 없이.',
              lineEn: "That's enough. There's a not yet in it, after all. (He puts the name plate in his bag.) On the day not yet ends, I'll sit down under my own name from the start. No beginner act." }) }),
          opt('chairman_only', '조합장 자리에 인사드릴 일이 있으면 드리겠습니다.', "If there's ever reason to greet the chairman's seat, I'll greet it.",
            { stance: 'self', aff: { [K]: -0.03 }, end: endTalk({
              lineKo: '(조합장 자리, 하는 말에 어깨가 조금 내려간다.) …그래. 조합장으로 인사받는 건 익숙하네. 그게 늘 문제였지.',
              lineEn: "(At the words chairman's seat his shoulders sink a little.) ...Right. Being greeted as chairman, I'm used to that. That was always the trouble." }) }),
          opt('both_hurried', '저도 그날 실을 칼로 끊었지요. 둘 다 서둘렀나 봅니다.', "I cut your line with a knife that day, remember. Maybe we both rushed.",
            { stance: 'mid', aff: { [K]: 0.02 }, requires: { flag: 'choice.n03_impatient' }, end: endTalk({
              lineKo: '(쓴웃음을 짓는다.) 자네는 실을 끊었고 나는 사람을 속였지. 무게가 다르네. 그래도 그 말은 고맙게 듣겠네.',
              lineEn: "(He smiles wryly.) You cut a line and I deceived a person. They don't weigh the same. Still, I'm grateful to hear it." }) }),
        ],
        note: ['강두철 씨는 서운한 기색을 숨기지 않고 고개를 끄덕였다. 거리는 내가 정하라고, 그래도 방파제에서 인사는 하자고 했다. 문간의 어촌계 사람들이 슬그머니 흩어졌다.', "Kang Ducheol nodded, not hiding that it stung. I should set the distance, he said — but let's still say hello on the breakwater. The co-op people in the doorway quietly drifted off."],
      }),
      called: scene([
        act(K, 'silence'),
        line(K, '…실은 일부러 엉켰지. 그건 연기야. 미안하네.', '...The line, I tangled on purpose. That was an act. I\'m sorry.'),
        line(P, '…역시 그랬군요.', '...I thought so.'),
        line(K, '그런데 자네가 풀어 주던 십 분, 그건 연기가 아니었어.', 'But the ten minutes you spent working it loose, that was no act.'),
        line(K, '늙은이가 그 십 분을 사려고 연기를 한 거야.', 'The old man put on the act to buy those ten minutes.'),
        line('', '(문간의 어촌계 사람들이 웅성거린다. 도현수만 웃지 않고 이쪽을 본다.)', "(The co-op people in the doorway start murmuring. Only Do Hyeonsu doesn't laugh, and keeps watching.)"),
      ], {
        choices: [
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
        ],
        note: ['강두철 씨는 실을 일부러 엉켰다고, 그건 연기였다고 털어놓았다. 하지만 내가 풀어 주던 십 분은 연기가 아니었다고, 그 십 분을 사려고 연기를 한 거라고 했다.', "Kang Ducheol admitted he had tangled the line on purpose — that part was an act. But the ten minutes I spent untangling it were not; he had put on the act to buy them."],
      }),
      knew: scene([
        act(K, 'laugh'),
        line(K, '들켰던 거로군. 그런데도 끝까지 가르쳐 줬어? 모르는 척하고?', "So I'd been found out. And you kept teaching me anyway? Pretending not to know?"),
        line(P, '…네.', '...Yes.'),
        line(K, '그게 더 고맙네. 늙은이 연기를 연기로 받아 준 거니까.', "That makes me more grateful still. You played along with an old man's act."),
        line(K, '이제 어쩔 텐가. 계속 받아 줄 텐가.', 'So what now? Will you keep playing along?'),
      ], {
        choices: [
          opt('both_stop', '이제 둘 다 연기는 그만하죠. 방파제에서 진짜로 가르쳐 드리겠습니다.', "Let's both drop the act now. On the breakwater I'll teach you for real.",
            { stance: 'giver', aff: { [K]: 0.03, coop: 0.01 }, flags: ['choice.n03_kept_teaching'], end: endTalk({
              lineKo: '허허, 진짜로라. 그럼 나도 진짜 초보부터 다시 하지. (명패를 가방 깊숙이 넣는다.) 방파제에서 보세, 선생님.',
              lineEn: "Ha, for real. Then I'll start again as a real beginner. (He pushes the name plate deep into his bag.) See you on the breakwater, teacher." }) }),
          opt('distance_anyway', '알면서 가르친 건 저고, 속이신 건 강두철 씨입니다. 당분간 거리를 두겠습니다.', "I taught knowing, but you're the one who deceived. I'll keep my distance for a while.",
            { stance: 'self', aff: { [K]: -0.04 }, flags: ['choice.n03_kept_distance'], end: endTalk({
              lineKo: '(웃음을 거둔다.) …그렇지. 알고 받아 준 것과 속인 것은 다르지. 거리는 자네가 정하게. 인사만은 받아 주고.',
              lineEn: "(His laugh fades.) ...True. Playing along knowingly and deceiving aren't the same. You set the distance. Just keep answering my hello." }) }),
        ],
        note: ['짐작은 하고 있었다고 했더니, 강두철 씨가 처음으로 시원하게 웃었다. 알면서도 끝까지 가르쳐 준 게 더 고맙다고, 이제 어쩔 거냐고 물었다.', "When I said I'd had my suspicions, Kang Ducheol laughed freely for the first time. That I'd kept teaching him knowing made him more grateful still. So what now, he asked."],
      }),
    },
  },

  // 290차 — N03-2 끝내는 자리(강두철). 「선생은 선생이야. 조합장이 아니라」 — 교육장에서 한 대답이 고를 말을 가린다
  {
    id: 'n03_2_done', questId: 'N03-2', at: 'complete', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '아까 한 대답, 잘 들었네.', 'I heard your answer earlier. Clearly.'),
        line(P, '…', '...'),
        line(K, '선생은 선생이야. 조합장이 아니라.', 'A teacher is a teacher. Not a chairman.'),
        line(P, '그럼 이제 조합장이라고 불러야 하나요?', 'So should I be calling you chairman now?'),
        line(K, '이름이면 되지. 지금까지처럼.', 'My name will do. Same as before.', { act: 'shake_head' }),
        line(P, '…강두철 씨.', '...Ducheol.'),
        line(K, '허허, 그거면 됐네.', "Ha. That's all I need."),
      ], {
        choices: [
          opt('teach_on', '조합장이든 뭐든, 방파제에선 제 학생입니다', 'Chairman or not, on the breakwater you are my student', {
            say: ['조합장이든 뭐든, 방파제에선 강두철 씨가 제 학생입니다.', "Chairman or not, on the breakwater you're my student."],
            requires: { notFlag: 'choice.n03_kept_distance' },
            end: endTalk({ complete: 'teach_on', lineKo: '…허. 그럼 숙제는 계속 받겠네. 조합장이 채비를 배운다고 소문이 좀 돌겠지만, 늙은이는 상관없어.',
              lineEn: "...Ha. Then I'll keep taking assignments. Word will get round that the chairman is learning to rig, but this old man doesn't mind." }),
            note: ['방파제에선 여전히 그가 내 학생이라고 했다. 수협 조합장이 내 채비를 배운다는 소문이 항구에 돌기 시작했다.', 'I said that on the breakwater he was still my student. Word began going round the harbour that the co-op chairman was learning rigs from me.'] }),
          opt('distance', '속이신 건 속이신 겁니다. 거리를 두겠습니다', 'A deception is a deception. I will keep my distance', {
            requires: { notFlag: 'choice.n03_kept_teaching' },
            end: endTalk({ complete: 'distance', lineKo: '…알겠네. 그 거리, 늙은이가 천천히 걸어서 좁혀 보지. 서두르진 않겠네.',
              lineEn: "...Understood. That distance — the old man will try to close it on foot, slowly. I won't rush." }),
            note: ['속인 건 속인 거라며 거리를 두겠다고 했다. 인사는 한다. 그 이상은 아직.', 'I said a deception was a deception and kept my distance. We would say hello. Nothing more, yet.'] }),
          opt('joke', '초보 연기가 너무 완벽하셨어요', 'Your beginner act was far too perfect', {
            say: ['초보 연기가 너무 완벽하셨어요. 배우 하셔도 되겠습니다.', 'Your beginner act was far too perfect. You could have been an actor.'], next: 'joke' }),
          opt('market_eye', '이번엔 강두철 씨가 가르쳐 주세요', 'This time, you teach me', {
            say: ['이번엔 강두철 씨가 가르쳐 주세요. 위판장 보는 눈부터요.', 'This time, you teach me. Starting with how to read an auction floor.'],
            end: endTalk({ complete: 'market_eye', lineKo: '허허, 선생이 학생한테 배우겠다? 좋네. 경매 전에 상자부터 보게. 얼음이 어떻게 덮였는지, 고기가 어느 쪽으로 누웠는지. 중매인들은 그걸로 값을 매겨. 말은 그다음이야.',
              lineEn: "Ha, the teacher wants to learn from the student? Good. Before the auction, look at the crates. How the ice is laid, which way the fish are lying. That's how the brokers set prices. Talk comes after." }),
            note: ['이번엔 그가 가르쳐 달라고 했다. 위판장 보는 눈부터. 강두철 씨는 교육장 창밖의 위판장을 가리키며, 경매 전에 상자부터 보라고 했다.', 'I asked him to teach me this time — how to read an auction floor. Pointing out the window at the auction hall, Kang Ducheol said to look at the crates before the bidding.'] }),
        ],
        note: ['강두철 씨는 내 대답을 잘 들었다며, 선생은 선생이지 조합장이 아니라고 했다. 이제 조합장이라고 불러야 하느냐고 묻자, 지금까지처럼 이름이면 된다고 했다.', "Kang Ducheol said he'd heard my answer: a teacher is a teacher, not a chairman. When I asked if I should call him chairman now, he said his name would do, as before."],
      }),
      joke: scene([
        act(K, 'laugh'),
        line(K, '허허. 매듭 푸는 연기가 제일 어려웠어. 손이 저절로 풀려고 해서 혼났네.', 'Ha. Acting out the knot was the hardest part. My hands kept trying to untie it on their own.'),
        line(P, '…역시요.', '...I knew it.'),
        line('', '(웃음이 터진다. 그러고는 수첩을 찢어 소개장을 하나 써 준다.)', '(He bursts out laughing. Then he tears a page from his notebook and writes me a letter of introduction.)'),
      ], {
        end: endTalk({ complete: 'joke', lineKo: '그 소개장은 연기 값이 아니라 웃어 준 값이야. 화낼 자리에서 웃어 주는 사람은 귀하거든.',
          lineEn: "That letter isn't payment for the act. It's for laughing. People who laugh where they could get angry are rare." }),
        note: ['초보 연기가 너무 완벽했다고 했다. 강두철 씨는 매듭 푸는 연기가 제일 어려웠다며 웃음을 터뜨리고 소개장을 하나 써 주었다. 화낼 자리에서 웃어 준 값이라고.', "I said his beginner act had been too perfect. The knot was the hardest to fake, Kang Ducheol laughed, and wrote me a letter of introduction — payment for laughing where I could have been angry."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N03-6 「조합장과 선장」 받는 자리(강두철). 고만석과 서른 해 전 같은 배 — 가운데 앉아 달라
  // ═══════════════════════════════════════════
  {
    id: 'n03_6_offer', questId: 'N03-6', at: 'offer', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '방어진 간다고 들었네.', "I hear you're going to Bangeojin."),
        line(P, '네. 울산 쪽에 가 보려고요.', 'Yes. I thought I would head out Ulsan way.'),
        line(K, '나도 가지.', "I'll come too."),
        line(P, '강두철 씨도요?', 'You too?'),
        line(K, '고만석이라고, 거기서 낚싯배 하는 친구가 있어.', "There's a friend of mine there who runs a fishing boat. Go Manseok."),
        line(K, '서른 해 전에 같은 배를 탔지.', 'Thirty years ago we sailed on the same boat.', { act: 'look_sea' }),
        line(P, '서른 해 전에요…', 'Thirty years ago...'),
        line(K, '옛 얘기 들어 줄 텐가.', 'Will you listen to some old stories?'),
      ], {
        choices: [
          opt('sit_between', '들을게요. 두 분 이야기라면 끝까지요', "I'll listen. If it's the two of you, all the way through", {
            next: 'between' }),
          opt('ask_boat', '어떤 배를 같이 타셨는데요?', 'What boat did you sail on together?', {
            say: ['고만석 씨요? 어떤 배를 같이 타셨는데요?', 'Go Manseok? What boat did you sail on together?'], next: 'boat' }),
          opt('long_time', '오랜만에 만나시는 거예요?', 'Has it been a long time since you met?', {
            say: ['오랜만에 만나시는 거예요? 그동안 연락은 하셨고요?', 'Has it been long since you saw each other? Have you kept in touch?'], next: 'long' }),
          opt('uproar', '직접 가시면 방어진이 발칵 뒤집히겠는데요', 'Bangeojin will be in uproar if you turn up in person', {
            next: 'uproar' }),
        ],
        note: ['강두철 씨가 방어진에 같이 가겠다고 했다. 거기서 낚싯배를 하는 고만석이라는 친구와 서른 해 전 같은 배를 탔다고. 옛 이야기를 들어 달라고 했다.',
          "Kang Ducheol said he'd come to Bangeojin too. A friend of his there, Go Manseok, runs a fishing boat — they'd sailed on the same boat thirty years ago. Would I listen to their old stories?"],
      }),
      between: scene([
        line(K, '고맙네. 그 친구는 말이 없어. 나는 말이 많고.', "Thank you. He's a man of few words. I talk a lot."),
        act(K, 'laugh'),
        line(K, '둘이 앉으면 하나도 안 맞지.', "Sit the two of us down and nothing matches."),
        line(P, '그럼 저는요?', 'And me?'),
        line(K, '자네가 가운데 앉아 줘야 해. 둘이 마주 보면 옛날 생각에 말이 막혀.', "You'll have to sit between us. Face to face, we'd get choked up thinking of the old days."),
      ], {
        end: endTalk({ accept: true, offer: 'sit_between', lineKo: '사이에 누가 있으면 말이 좀 돌아가지.', lineEn: 'With someone in between, the words flow a bit.' }),
        note: ['두 사람 이야기를 끝까지 듣겠다고 했다. 강두철 씨는 그 친구는 말이 없고 자기는 말이 많다며, 둘이 마주 보면 말이 막히니 가운데 앉아 달라고 했다.', "I said I'd listen to them both, all the way through. His friend says little and he says a lot, Kang Ducheol said — face to face they'd choke up, so would I sit between them."],
      }),
      boat: scene([
        line(K, '…배 얘기는 그 친구랑 같이 있을 때 하지.', "...The boat — we'll talk about it when he's there.", { act: 'look_sea' }),
        line(K, '혼자 하면 내 쪽 얘기만 되거든.', "If I tell it alone, it's only my side."),
        line(P, '…', '...'),
        line(K, '서른 해야. 손에는 남았는데 입에는 잘 안 붙어.', "Thirty years. It stayed in the hands, but it doesn't come easily to the mouth."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_boat', lineKo: '가 보면 알게 될 거야. 둘 다 말보다 손을 먼저 볼 테니.', lineEn: "You'll see when we get there. We'll both look at each other's hands before we speak." }),
        note: ['어떤 배를 같이 탔느냐고 물었다. 강두철 씨는 바다 쪽을 보며, 배 얘기는 그 친구와 같이 있을 때 하겠다고 했다. 서른 해가 손에는 남았는데 입에는 잘 안 붙는다고.', "I asked what boat they'd shared. Looking out to sea, Kang Ducheol said he'd talk about it when his friend was there. Thirty years had stayed in his hands but didn't come easily to his mouth."],
      }),
      long: scene([
        line(K, '오랜만이지. 얼마나 됐는지는… 세다가 그만뒀네.', "It's been a while. How long... I gave up counting.", { act: 'look_away' }),
        line(P, '연락도 안 하셨어요?', "You didn't keep in touch?"),
        line(K, '바다 사람은 헤어질 때 인사를 잘 안 해. 또 볼 줄 알고.', "Sea people don't say goodbye when they part. They think they'll meet again."),
        line(K, '그러다 세월이 가.', 'And then the years go by.'),
      ], {
        end: endTalk({ accept: true, offer: 'long_time', lineKo: '그러니 이번엔 자네가 가운데서 인사 좀 시켜 주게.', lineEn: 'So this time, you stand between us and get us to say hello.' }),
        note: ['오랜만에 만나는 거냐고 물었다. 얼마나 됐는지 세다가 그만뒀다고 했다. 바다 사람은 또 볼 줄 알고 헤어질 때 인사를 잘 안 한다고, 그러다 세월이 간다고.', "I asked if it had been long. He'd given up counting, he said. Sea people don't say goodbye, thinking they'll meet again — and then the years go by."],
      }),
      uproar: scene([
        act(K, 'laugh'),
        line(K, '허허, 그래서 조합장으로 안 가. 그냥 강두철이로 가지.', "Ha, that's why I won't go as chairman. Just as Kang Ducheol."),
        line('', '(모자를 깊이 눌러써 보인다.)', '(He pulls his cap down low to show me.)'),
        line(P, '…그걸로 될까요?', '...Will that work?'),
        line(K, '그 친구 앞에서는 직함이 소용없어. 서른 해 전에 한 배에 탄 사이야.', "In front of him a title is useless. We were on one boat thirty years ago."),
      ], {
        end: endTalk({ accept: true, offer: 'uproar', lineKo: '거기선 나도 그냥 두철이지. 가세, 방어진으로.', lineEn: "There, I'm just Ducheol. Let's go — to Bangeojin." }),
        note: ['직접 가면 방어진이 뒤집히겠다고 했더니, 강두철 씨는 조합장 말고 그냥 강두철로 간다며 모자를 깊이 눌러썼다. 그 친구 앞에서는 직함이 소용없다고.', "When I said Bangeojin would be in uproar, Kang Ducheol pulled his cap down low — he'd go as plain Kang Ducheol, not the chairman. A title meant nothing in front of that friend."],
      }),
    },
  },

  // N03-6 — 끝내는 자리(강두철). 배 이름은 둘 다 말하지 않았다
  {
    id: 'n03_6_done', questId: 'N03-6', at: 'complete', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '…배 이름은 안 말했지. 둘 다.', "...Neither of us said the boat's name."),
        line(P, '네. 끝까지요.', 'No. Not once.'),
        line(K, '그건 그 배에 탄 사람들 거니까.', 'That belongs to the people who sailed on her.', { act: 'look_sea' }),
        line(P, '두 분, 인사 대신 서로 손을 보시더라고요.', "Instead of greeting, you two looked at each other's hands."),
        line(K, '손에 남은 게 말보다 많은 사람들이라.', "We're people with more left in our hands than in our words."),
      ], {
        choices: [
          opt('listen', '배 이름은 묻지 않겠습니다', "I won't ask the boat's name", {
            end: endTalk({ complete: 'listen', lineKo: '…자네가 그렇게 말할 줄 알았네. 묻지 않는 것도 듣는 거야. 그 친구가 오늘 자네를 오래 봤어. 말 없는 사람이 오래 보면 그건 마음에 들었다는 뜻이네.',
              lineEn: "...I knew you'd say that. Not asking is listening too. He looked at you a long time today. When a quiet man looks at you long, it means he likes you." }),
            note: ['배 이름은 묻지 않겠다고 했다. 두 노인이 방어진과 속초 양쪽에서 나를 자기들 자리에 앉혔다.', "I said I wouldn't ask the boat's name. From then on the two old men, in Bangeojin and in Sokcho both, made room for me at their tables."] }),
          opt('lesson', '손으로 말하는 거, 저는 아직 못 읽어요', "I can't yet read what you two say with your hands", {
            say: ['두 분이 손으로 말하는 거, 저는 아직 못 읽습니다. 가르쳐 주십시오.', "I still can't read what you two say with your hands. Please teach me."],
            end: endTalk({ complete: 'lesson', lineKo: '손이 말하려면 서른 해가 걸려. 그래도 보는 법은 있지. 굳은살을 봐. 어디가 두꺼운지 보면 그 사람이 뭘 오래 쥐었는지 나와. 내 손은 요즘 펜 자리가 제일 두껍지. 허허.',
              lineEn: "It takes thirty years for hands to talk. But there's a way to look. Check the calluses. Where they're thickest shows what a man has held longest. Mine are thickest where the pen goes, these days. Ha." }),
            note: ['손으로 말하는 걸 가르쳐 달라고 했다. 굳은살을 보라고, 어디가 두꺼운지 보면 그 사람이 뭘 오래 쥐었는지 나온다고 했다.', 'I asked him to teach me to read hands. Look at the calluses, he said — where they are thickest shows what a man has held longest.'] }),
          opt('pay', '울산까지 온 여비는 주십시오', "I'll take my fare to Ulsan", {
            end: endTalk({ complete: 'pay', lineKo: '그러세. 조합장 출장비에서. 오늘은 출장 맞아. 옛 동료 만나는 것도 조합 일이지. 바다 사람끼리 이어 주는 게 조합이 하는 일이니까. 떳떳한 돈이야.',
              lineEn: "Very well. From the chairman's travel budget. Today was a business trip, sure enough. Meeting an old shipmate is co-op work too. Connecting sea people is what a co-op does. It's honest money." }),
            note: ['여비를 받았다. 조합 도장이 찍힌 봉투였다.', 'I took my fare, in an envelope stamped with the co-op seal.'] }),
          opt('write_down', '배 이름은 빼고 조행록에 적어도 될까요?', 'May I write it in my log, leaving out the boat\'s name?', {
            say: ['두 분 이야기, 배 이름은 빼고 조행록에 적어도 될까요?', "May I write your story in my log — leaving out the boat's name?"], aff: { go_manseok: 0.02 }, next: 'write' }),
        ],
        note: ['방어진에서 두 노인은 끝내 배 이름을 말하지 않았다. 인사 대신 서로의 손을 봤다. 강두철 씨는 그 이름은 그 배에 탄 사람들 거라고 했다.', "In Bangeojin the two old men never said the boat's name. They looked at each other's hands instead of greeting. That name belonged to the people who sailed on her, Kang Ducheol said."],
      }),
      write: scene([
        act(K, 'silence'),
        line(K, '…적게. 배 이름만 빼고.', "...Write it. Just leave out the boat's name.", { act: 'nod' }),
        line(P, '네.', 'I will.'),
        line(K, '그 친구 이름을 앞에 적어. 나는 뒤면 돼.', 'Put his name first. Mine can go after.'),
      ], {
        end: endTalk({ complete: 'write_down', lineKo: '직함 붙은 이름이 앞에 서면 이야기가 무거워져.', lineEn: 'Put a name with a title in front and the story gets heavy.' }),
        note: ['두 사람 이야기를 배 이름만 빼고 조행록에 적어도 되느냐고 물었다. 강두철 씨는 한참 말이 없다가 고개를 끄덕였다. 고만석 씨 이름을 앞에 적으라고.', "I asked whether I could write their story in my log, leaving out the boat's name. After a long silence Kang Ducheol nodded — and told me to put Go Manseok's name first."],
      }),
    },
  },
];
