/**
 * @file StoryTalkN02.ts
 * @description 254차 — N02 「탁만수 · 탁새벽 — 죽간 공방 조손」 이어지는 대화. 규칙은 `StoryTalks.ts` 머리 주석.
 *
 * 인물: 탁만수(78 · 속초 죽간 공방의 마지막 대 — 말이 짧다 · 칭찬을 안 한다 「칭찬받은 손은 깎다 말고 멈춘다」)
 *   · 탁새벽(12 · 손자 — 「아저씨」 · 들뜬 반말 · 마디를 소리로 고른다 · 얇고 예민한 끝을 좋아한다).
 * 갈래의 축: 할아버지의 방식(마디 · 버티는 대 · 말 없는 칭찬) ↔ 손자의 방식(소리 · 듣는 대 · 봐 달라는 마음).
 *   가운데 = 「얇은 대는 휜다」 · 「몸통은 마디로, 끝은 소리로」.
 * 순서: 받기(부러진 대) → 내기(학꽁치 길이) → 대를 고르는 눈 → 새벽의 첫 대(끝내는 자리) → 태안(받기 · 찾기) → 마지막 죽간.
 * 결말은 정본 하나(`n02_rod`) — 말 · 마음 · 기억만 갈리고 대는 늘 살아난다(뒤 이야기가 그 대를 던진다).
 *
 * 표시 — 남기는 곳 → 읽는 곳
 *  choice.n02_boasted          받기 「열두 살한테 질 리가」 → 내기 첫 단계
 *  choice.n02_fair_bet         내기를 자대로 끝냈다 → 첫 대
 *  choice.n02_lied_bet         꼬리를 접고 끝까지 숨겼다 → 첫 대 · 마지막 죽간
 *  choice.n02_bet_confessed    첫 대에서 털어놓았다 → 마지막 죽간(두 번 털어놓지 않게)
 *  choice.n02_backed_kid_pick  대를 고를 때 새벽이의 고운 대 편 → 첫 대
 *  choice.n02_two_poles        「몸통은 마디, 끝은 소리」 → 첫 대
 *  choice.n02_sided_kid · sided_grandpa · thin_bends   첫 대(얇다)에서 선 자리 → 태안 받기 · 마지막 죽간
 *  choice.n02_grandpa_reason   태안 받기 — 안 본 까닭을 들었다 → 태안 찾기
 *  choice.n02_text_scold       태안 받기 — 꾸짖는 문자 → 태안 찾기
 *  choice.n02_told_reason      태안에서 그 까닭을 전했다 → 마지막 죽간
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, say, endTalk } from './StoryTalkKit.js';

const M = 'tak_mansu';
const S = 'tak_saebyeok';

export const TALKS_N02: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N02-1 「부러진 대」 — 받는 자리(탁만수). 문간에서 새벽이가 듣고 있다
  // ═══════════════════════════════════════════
  {
    id: 'n02_1_offer', questId: 'N02-1', at: 'offer', npcId: M, start: 'start',
    nodes: {
      start: say(
        '(대를 받아 들고 마디마다 엄지를 굴려 본다. 한 마디에서 손이 잠깐 멈춘다.) …두고 가라. 하루는 걸린다.\n\n(문간에서 아이 하나가 고개를 내밀고 있다.) 저건 새벽이. 내 손자다. 그동안 저 애랑 학꽁치나 낚아. 내기를 걸 거다. 애가 내기를 좋아해.',
        "(He takes the rod and rolls his thumb along each section. At one of them his hand stops for a moment.) ...Leave it. It'll take a day.\n\n(A boy is poking his head round the doorway.) That's Saebyeok. My grandson. Go catch halfbeak with him meanwhile. He'll want a bet. The boy likes a wager.",
        [
          opt('entrust', '아버지가 오래 쓰시던 대입니다. 맡기고 가겠습니다.', "It was my father's rod for a long time. I'll leave it with you.",
            { stance: 'giver', aff: { [M]: 0.04 }, next: 'entrust' }),
          opt('kid_bet', '새벽아, 내기하자고? 좋아, 받아 줄게.', "Saebyeok, you want a bet? Sure, you're on.",
            { stance: 'other', aff: { [S]: 0.04 }, next: 'bet' }),
          opt('rod_only', '대만 봐 주시면 됩니다. 애하고 놀 시간은 없어서요.', "Just the rod, please. I don't really have time to play with a kid.",
            { stance: 'self', aff: { [M]: -0.03, [S]: -0.03 }, next: 'rod_only' }),
          opt('not_yet', '아직은 아버지 대를 남의 손에 맡길 마음이 안 섭니다.', "I'm not ready to put my father's rod in someone else's hands yet.",
            { stance: 'self', aff: { [M]: -0.02 }, end: endTalk({ decline: true,
              lineKo: '(대를 두 손으로 돌려준다.) …그것도 대를 아끼는 거다. 마음 서면 와라.',
              lineEn: "(He hands the rod back with both hands.) ...That's caring for a rod too. Come when you're ready." }) }),
        ]),
      entrust: say(
        '(손잡이의 닳은 자리를 엄지로 오래 쓸어 본다.) 오래 쥔 손이 쓰던 대다. 거칠게 다룬 대는 아니야.\n\n(대를 벽에 세운다. 다른 대들 틈이 아니라 따로.) 맡긴 건 맡긴 거다. 이제 내 일이야. 너는 저 애 상대나 해 줘. 문간에서 아까부터 기다린다.',
        "(He runs his thumb over the worn spot on the grip for a long while.) A rod used by a hand that held it a long time. Not one that was treated roughly.\n\n(He stands it against the wall. Apart from the others, not among them.) What's left with me is mine to look after now. You keep that boy company. He's been waiting in the doorway all this time.",
        [
          opt('to_kid', '새벽아, 내기하자고? 무슨 내기인지 들어 볼게.', "Saebyeok, you want a bet? Let's hear what kind.",
            { stance: 'mid', aff: { [S]: 0.02 }, next: 'bet' }),
          opt('watch', '옆에서 대 보시는 걸 지켜봐도 되겠습니까?', 'May I stay and watch you look at the rod?',
            { stance: 'giver', end: endTalk({ accept: true,
              lineKo: '기웃거리면 더 걸린다. 대는 사람 눈치를 본다. (문간 쪽으로 턱짓을 한다.) 나가 봐라. 저 애가 기다린다.',
              lineEn: "Hover and it takes longer. A rod feels eyes on it. (He jerks his chin at the doorway.) Go on out. The boy's waiting." }) }),
        ]),
      bet: say(
        '(아이가 낚싯대 두 대를 들고 뛰어든다.) 아저씨! 내기하자. 방파제에서 학꽁치 먼저 올리는 사람이 이기는 거야.\n\n내가 이기면, 아까 아저씨 대에서 들은 소리는 안 알려 줄 거야. 할아버지보다 내가 먼저 들었거든. (뒤에서 할아버지가 헛기침을 한다.)',
        "(The boy bursts in carrying two rods.) Mister! Let's bet. Whoever lands a halfbeak first off the breakwater wins.\n\nIf I win, I won't tell you the sound I heard in your rod just now. I heard it before Grandpa did. (Behind him, his grandfather clears his throat.)",
        [
          opt('deal', '좋아. 대신 봐주는 거 없다.', 'Deal. But no going easy on each other.',
            { stance: 'other', aff: { [S]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '(아이가 앞장서 뛰어나간다. 노인이 그 뒷모습을 잠깐 본다.) 늦게 가면 진 거다. 그 애 규칙이야.',
              lineEn: "(The boy runs out ahead. The old man watches his back for a moment.) Whoever's late has lost. His rule." }) }),
          opt('what_sound', '내 대에서 무슨 소리가 났는데?', 'What sound did you hear in my rod?',
            { stance: 'mid', next: 'secret' }),
          opt('easy_win', '열두 살한테 질 리가 있나. 금방 끝내 줄게.', "Lose to a twelve-year-old? I'll have this wrapped up in no time.",
            { stance: 'self', aff: { [S]: -0.03 }, flags: ['choice.n02_boasted'], end: endTalk({ accept: true,
              lineKo: '(코로 짧게 웃는다.) 그 말, 방파제에서 한 번 더 해 봐라. 그 애는 방파제에서 컸다.',
              lineEn: '(He laughs once, shortly, through his nose.) Say that again on the breakwater. That boy grew up on it.' }) }),
        ], S),
      secret: say(
        '비밀! 이기면 알려 줄게. (할아버지 쪽을 힐끔 본다.) 할아버지도 아직 말 안 한 거야.\n\n그러니까 궁금하면 나한테 이겨. 학꽁치는 물 위에 떠서 다녀. 그것도 모르면 아저씨가 져.',
        "Secret! I'll tell you if you win. (He glances at his grandfather.) Grandpa hasn't said it yet either.\n\nSo if you want to know, beat me. Halfbeak swim right up near the surface. If you don't even know that, you'll lose.",
        [
          opt('fine_go', '좋아. 물 위에 떠서 다닌다, 기억해 둘게.', "All right. Up near the surface. I'll remember.",
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '(대답 대신 대를 손톱으로 톡 쳐 본다. 탁한 소리가 한 번 난다.) …가 봐라. 저 애한테 지지 말고.',
              lineEn: "(Instead of answering he taps the rod with a fingernail. It gives one dull sound.) ...Off you go. Don't lose to him." }) }),
          opt('ask_grandpa', '어르신, 무슨 소리인지 먼저 알려 주시면 안 됩니까?', "Sir, couldn't you tell me what the sound is first?",
            { stance: 'giver', aff: { [S]: -0.02 }, end: endTalk({ accept: true,
              lineKo: '내기는 그 애 거다. 내가 끼면 그 애가 진다. (아이가 혀를 쏙 내밀고 뛰어나간다.) 가서 이겨 봐라.',
              lineEn: "The bet's his. If I butt in, he loses it. (The boy sticks his tongue out and runs off.) Go and win it." }) }),
        ], S),
      rod_only: say(
        '(문간의 아이가 고개를 쑥 집어넣는다.) …대 보는 데 하루 걸린다. 그 하루를 어디서 보낼지는 네 마음이다.\n\n다만 그 애는 대를 나보다 먼저 듣는다. 네 대에서 나는 소리도 벌써 들었을 거다. 궁금하면 방파제로 가.',
        "(The boy in the doorway ducks out of sight.) ...Looking at a rod takes a day. Where you spend that day is up to you.\n\nBut that boy hears a rod before I do. He'll have heard the sound in yours already. If you want to know, go to the breakwater.",
        [
          opt('one_round', '…그럼 한 판만 하고 오겠습니다.', "...Then I'll go for one round.",
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '(밖에서 양동이 흔드는 소리가 난다.) 저 소리면 벌써 채비 들고 섰다. 가 봐라.',
              lineEn: "(From outside comes the sound of a bucket being shaken.) That means he's already standing there with his rig. Go." }) }),
          opt('tomorrow', '대만 맡기고 내일 다시 오겠습니다.', "I'll just leave the rod and come back tomorrow.",
            { stance: 'self', end: endTalk({ accept: true,
              lineKo: '그래라. 대는 두고. (아이 쪽은 보지도 않는다.) 그 애는 방파제 끝에 있을 거다. 내일도 모레도.',
              lineEn: "Do that. Leave the rod. (He doesn't even look toward the boy.) He'll be at the end of the breakwater. Tomorrow, and the day after." }) }),
          opt('take_back', '그럼 다른 데를 알아보겠습니다.', "Then I'll look for somewhere else.",
            { stance: 'self', aff: { [M]: -0.03 }, end: endTalk({ decline: true,
              lineKo: '(대를 돌려준다. 받는 손보다 주는 손이 느리다.) 이 항구에 대 깎는 사람은 나 하나다. 마음 바뀌면 와.',
              lineEn: "(He hands the rod back. The hand giving is slower than the hand taking.) I'm the only one in this harbour who carves rods. Come back if you change your mind." }) }),
        ]),
    },
  },

  // N02-1 — 진행 중: 새벽과 내기(목표 1). 첫 마리는 새벽이 먼저 — 진짜 승부는 길이. 공방 창가에서 할아버지가 본다
  {
    id: 'n02_1_bet', questId: 'N02-1', at: 'objective', objectiveIndex: 1, npcId: S, start: 'start',
    nodes: {
      start: say(
        '(방파제 끝에서 양동이를 흔든다.) 아저씨, 늦었어! 첫 마리는 내가 먼저 올렸어. 근데 할아버지가 한 판 더 하래. 먼저 올린 건 운일 수도 있대.\n\n그러니까 진짜 승부는 길이야. 둘 다 이 자에 대 보자. 더 긴 쪽이 이기는 거야. (방파제 바닥에 자를 쫙 편다.)',
        "(He shakes his bucket at the end of the breakwater.) You're late, Mister! I landed the first one. But Grandpa says go another round. Landing first might just be luck, he says.\n\nSo the real contest is length. Let's both lay ours on this ruler. Longest one wins. (He spreads a ruler flat on the breakwater.)",
        [
          opt('measure', '좋아. 자에 나란히 대 보자.', "Fine. Let's lay them side by side.",
            { stance: 'mid', next: 'ruler' }),
          opt('ate_words', '질 리 없다고 큰소리친 건 취소할게. 첫 마리는 네가 이겼어.', 'I take back the big talk about not losing. You won the first one.',
            { stance: 'self', aff: { [S]: 0.03, [M]: 0.01 }, requires: { flag: 'choice.n02_boasted' }, next: 'ate_words' }),
        ]),
      ate_words: say(
        '(씩 웃는다.) 아까 공방에서 질 리 없다고 했지? 할아버지가 그런 말은 꼭 기억해 둔대. 방파제에서 다시 해 보라고.\n\n그래도 길이는 재야지. 첫 마리는 첫 마리고, 길이는 길이야. 자, 대 봐.',
        "(He grins.) Back at the workshop you said you couldn't lose, right? Grandpa says he always remembers talk like that. He said to try it again out here.\n\nWe still have to measure, though. The first one's the first one, and length is length. Come on, lay it down.",
        [
          opt('measure_too', '그래, 재 보자. 이번엔 큰소리 안 칠게.', "All right, let's measure. No big talk this time.",
            { stance: 'mid', next: 'ruler' }),
        ]),
      ruler: say(
        '(두 마리를 자 위에 나란히 눕힌다. 내 것이 손가락 한 마디쯤 길다. 새벽이가 숨을 참고 눈금을 들여다본다.)\n\n(공방 창가에 할아버지가 서 있다. 대를 손에 든 채 이쪽을 보고 있다.)',
        '(I lay the two fish side by side on the ruler. Mine is longer by about a finger joint. Saebyeok holds his breath and peers at the markings.)\n\n(His grandfather is standing at the workshop window, a rod in his hand, watching us.)',
        [
          opt('fair', '자는 거짓말 안 하지. 내 게 한 마디 길다.', "A ruler doesn't lie. Mine's a joint longer.",
            { stance: 'mid', aff: { [S]: 0.02, [M]: 0.03 }, flags: ['choice.n02_fair_bet'], next: 'fair_win' }),
          opt('fold_tail', '(내 학꽁치 꼬리를 슬쩍 접어 다시 잰다.)', "(I quietly fold my halfbeak's tail and measure again.)",
            { stance: 'other', aff: { [S]: 0.03, [M]: -0.03 }, next: 'folded' }),
          opt('tease', '봤지? 열두 살이 어른 이기기엔 아직 이르다.', 'See that? Twelve is a bit young to beat a grown-up.',
            { stance: 'self', aff: { [S]: -0.04, [M]: 0.02 }, next: 'teased' }),
        ], ''),
      fair_win: say(
        '…한 마디. (입술을 깨문다. 울지는 않는다.) 알았어. 졌어. 진 건 진 거야.\n\n약속이니까 알려 줄게. 아저씨 대, 셋째 마디가 탁하게 울어. 다른 마디는 맑은데 거기만. 할아버지도 들었을 거야. 말을 안 할 뿐이지.',
        "...One joint. (He bites his lip. He doesn't cry.) Okay. I lost. A loss is a loss.\n\nA promise is a promise, so I'll tell you. In your rod, Mister, the third section rings dull. The others ring clear, just not that one. Grandpa will have heard it too. He just doesn't say.",
        [
          opt('good_ears', '그걸 소리로 알아? 할아버지보다 귀가 좋은데?', "You can tell that by sound? Your ears are better than your grandpa's!",
            { stance: 'other', aff: { [S]: 0.03, [M]: -0.01 }, end: endTalk({
              lineKo: '(어깨를 으쓱하다가 공방 창을 힐끔 본다.) 쉿! 할아버지 귀도 좋단 말이야. 다 들려.',
              lineEn: "(He shrugs, then glances at the workshop window.) Shh! Grandpa's ears are good too. He hears everything." }) }),
          opt('what_dull', '탁하게 운다는 게 무슨 뜻이야?', 'What does it mean, ringing dull?',
            { stance: 'mid', end: endTalk({
              lineKo: '속에 금이 갔거나, 오래 휘어 있던 데래. 할아버지가 가르쳐 줬어. (자를 둘둘 만다.) 나머지는 할아버지한테 들어. 그건 할아버지 일이야.',
              lineEn: "It means there's a crack inside, or it stayed bent a long time. Grandpa taught me. (He rolls up the ruler.) Hear the rest from Grandpa. That part's his job." }) }),
          opt('grandpa_first', '할아버지한테 먼저 여쭤볼게. 대 보시는 분이 말씀하셔야지.', "I'll ask your grandpa first. It should come from the one checking the rod.",
            { stance: 'giver', aff: { [S]: -0.02, [M]: 0.02 }, end: endTalk({
              lineKo: '(입을 삐죽인다.) 치. 할아버지는 말 안 해 줄걸. 대한테만 말하니까. …그래도 셋째 마디야. 잊지 마.',
              lineEn: "(He pouts.) Huh. Grandpa won't tell you. He only talks to rods. ...But it's the third section. Don't forget." }) }),
        ]),
      folded: say(
        '(펄쩍 뛴다.) 내가 이겼다! 봤지? 내 게 더…\n\n(공방 창가에서 헛기침 소리가 크게 난다. 새벽이가 멈칫하더니 내 학꽁치 꼬리를 내려다본다.) …아저씨. 방금 꼬리 접었어?',
        "(He leaps up.) I won! See? Mine's longer...\n\n(A loud cough comes from the workshop window. Saebyeok stops short and looks down at my halfbeak's tail.) ...Mister. Did you just fold the tail?",
        [
          opt('confess', '…응. 미안. 봐줬어.', '...Yeah. Sorry. I let you win.',
            { stance: 'mid', aff: { [S]: -0.03, [M]: 0.03 }, next: 'confessed' }),
          opt('deny', '아니야. 네 게 더 길어. 네가 이긴 거야.', 'No. Yours is longer. You won.',
            { stance: 'other', aff: { [S]: 0.02, [M]: -0.04 }, flags: ['choice.n02_lied_bet'], end: endTalk({
              lineKo: '(공방 창이 탁 닫힌다. 새벽이는 그 소리를 못 들은 척한다.) …그치? 내가 이긴 거지? 할아버지한테도 꼭 그렇게 말해.',
              lineEn: '(The workshop window bangs shut. Saebyeok pretends not to hear it.) ...Right? I won, didn\'t I? Tell Grandpa that too, okay?' }) }),
        ]),
      confessed: say(
        '(자를 바닥에 탁 내려놓는다.) 봐주는 거 제일 싫어! 할아버지가 그랬어. 봐주는 건 대한테도 사람한테도 거짓말이래.\n\n(꼬리를 손가락으로 펴서 다시 댄다. 내 것이 한 마디 길다.) …졌네. 이제야 진짜로 졌어. 약속이니까 알려 줄게. 아저씨 대, 셋째 마디가 탁하게 울어.',
        "(He slaps the ruler down.) I hate being let off! Grandpa says so too. Letting someone win is lying, to a rod or to a person.\n\n(He straightens the tail with a finger and measures again. Mine is a joint longer.) ...I lost. Now I've really lost. A promise is a promise, so I'll tell you. In your rod, Mister, the third section rings dull.",
        [
          opt('no_more', '다시는 안 봐줄게. 약속해.', "I'll never let you win again. Promise.",
            { stance: 'mid', aff: { [S]: 0.03 }, flags: ['choice.n02_fair_bet'], end: endTalk({
              lineKo: '(새끼손가락을 내민다.) 약속! 다음엔 내가 진짜로 이길 거야. 할아버지가 대 다 보면 또 하자.',
              lineEn: "(He holds out his little finger.) Promise! Next time I'll win for real. Once Grandpa's done with the rod, let's go again." }) }),
        ]),
      teased: say(
        '(얼굴이 빨개진다.) 한 마디 가지고! 첫 마리는 내가 먼저였거든!\n\n(양동이를 들고 벌떡 일어선다.) 두고 봐. 아저씨는 못 올리는 거 내가 올릴 거야. 훨씬 큰 거. (공방 창가에서 할아버지가 웃는 것 같다.)',
        "(He goes red.) Over one joint! I landed the first one, you know!\n\n(He snatches up his bucket and stands.) Just watch. I'll land something you can't. Something way bigger. (At the workshop window his grandfather seems to be smiling.)",
        [
          opt('take_back', '농담이야. 첫 마리는 네가 이긴 거 맞아.', "I'm joking. You did win the first one.",
            { stance: 'mid', aff: { [S]: 0.03 }, end: endTalk({
              lineKo: '(입을 삐죽거리다 결국 웃는다.) …그럼 일 대 일이야. 비겼으니까 반만 알려 줄게. 아저씨 대, 마디 하나가 이상해. 어느 마디인지는 다음 판에.',
              lineEn: "(He pouts, then laughs in the end.) ...Then it's one each. A draw, so I'll only tell you half. One section in your rod sounds wrong, Mister. Which one, you'll find out next round." }) }),
          opt('prove_it', '그래, 기대할게. 올리면 그때 인정해 주지.', "Sure, I'll look forward to it. Land it, and then I'll admit it.",
            { stance: 'self', aff: { [S]: -0.02, [M]: 0.02 }, end: endTalk({
              lineKo: '올릴 거야! 아저씨 키만 한 거! (발을 쾅 구르고 뛰어간다. 창가의 할아버지가 고개를 한 번 끄덕인다.) 할아버지, 봤지? 봤지!',
              lineEn: 'I will! One as tall as you! (He stamps his foot and runs off. At the window his grandfather nods once.) Grandpa, did you see? Did you!' }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N02-5 「대를 고르는 눈」 — 진행 중: 왜 그것인지 듣는다(목표 2). 새벽이는 아침에 고운 대(맑게 우는 대)를 골랐다
  // ═══════════════════════════════════════════
  {
    id: 'n02_5_why', questId: 'N02-5', at: 'objective', objectiveIndex: 2, npcId: M, start: 'start',
    nodes: {
      start: say(
        '(내가 고른 볼품없는 대를 손바닥으로 훑어 내린다. 마디마다 손이 잠깐씩 멈춘다.) 이걸 골랐다. 굵은 것도 고운 것도 두고.\n\n새벽이는 아침에 저 고운 놈을 집었다. 두드리면 제일 맑게 운다고. (마루 쪽으로 턱짓을 한다. 아이가 자는 척 누워 있다.) 너는 왜 이거냐.',
        "(He runs his palm down the plain culm I chose. At every node his hand pauses briefly.) You picked this one. Passed over the thick one and the pretty one.\n\nThis morning Saebyeok took that pretty one. Says it rings clearest when you tap it. (He nods toward the porch. The boy is lying there pretending to sleep.) Why this one, for you?",
        [
          opt('nodes_even', '마디 간격이 고릅니다. 힘이 한쪽으로 몰리지 않을 것 같았습니다.', "The nodes are evenly spaced. I thought the force wouldn't bunch up on one side.",
            { stance: 'giver', aff: { [M]: 0.05, [S]: -0.02 }, next: 'nodes' }),
          opt('kid_sound', '새벽이가 고른 것도 쓸 데가 있지 않을까요? 맑게 우는 대인데요.', "Couldn't Saebyeok's pick be good for something too? It rings so clear.",
            { stance: 'other', aff: { [M]: -0.03, [S]: 0.05 }, flags: ['choice.n02_backed_kid_pick'], next: 'thin_wall' }),
          opt('ask_kid', '새벽이한테도 왜 그걸 골랐는지 물어보셨습니까?', 'Did you ask Saebyeok why he chose that one?',
            { stance: 'mid', next: 'ask_kid' }),
          opt('just_luck', '솔직히 손에 잡히는 대로 골랐습니다.', 'Honestly, I just took whatever came to hand.',
            { stance: 'self', aff: { [M]: -0.03 }, next: 'luck' }),
        ]),
      nodes: say(
        '(처음으로 고개를 끄덕인다.) 그렇지. 대는 마디로 산다. 굵은 건 무겁고, 고운 건 겉만 곱다.\n\n(마루 쪽으로 목소리를 조금 높인다.) 맑게 우는 건 벽이 얇아서다. 얇은 대는 소리는 좋아도, 큰 놈이 오면 거기서 꺾인다.',
        "(For the first time, he nods.) That's it. A rod lives by its nodes. The thick one's heavy, the pretty one's pretty only on the outside.\n\n(He raises his voice a little toward the porch.) It rings clear because the wall is thin. A thin culm sounds good, but when something big comes on, that's where it snaps.",
        [
          opt('tell_him', '새벽이한테도 그렇게 말씀해 주시지요.', 'You should tell Saebyeok that too.',
            { stance: 'giver', aff: { [M]: 0.02, [S]: -0.04 }, end: endTalk({
              lineKo: '(대답 대신 마루를 본다. 아이가 이불을 머리끝까지 끌어 올린다.) …내가 말 안 해도 저 애 귀가 다 들었다.',
              lineEn: "(Instead of answering he looks at the porch. The boy pulls the blanket up over his head.) ...I don't need to say it. Those ears of his heard everything." }) }),
          opt('kid_ear', '그래도 소리 듣는 귀는 새벽이가 대단하던데요.', "Still, Saebyeok's ear for sound is something else.",
            { stance: 'other', aff: { [S]: 0.03, [M]: -0.01 }, end: endTalk({
              lineKo: '…귀는 좋다. 그 귀로 마디도 들어야지. 소리만 들으면 반만 듣는 거다. (이불 속에서 아이가 꼼지락거린다.)',
              lineEn: '...His ears are good. He has to hear the nodes with them too. Hearing only the ring is hearing half. (Under the blanket, the boy wriggles.)' }) }),
        ]),
      thin_wall: say(
        '(코웃음을 친다.) 쓸 데야 있지. 얇은 대는 끝에나 쓴다. 몸통으로 쓰면 첫 놈에 꺾여.\n\n(마루에서 아이가 벌떡 일어나 앉는다.) …봐라. 편 들어 주니 자던 놈이 일어난다.',
        "(He snorts.) It's good for something, sure. A thin culm's only fit for the tip. Use it for the body and it snaps on the first fish.\n\n(On the porch, the boy sits bolt upright.) ...Look at that. Take his side and the sleeper wakes up.",
        [
          opt('tip_then', '그럼 끝은 새벽이 것으로, 몸통은 이걸로 하면 되겠네요.', "Then use Saebyeok's for the tip and this one for the body.",
            { stance: 'mid', aff: { [S]: 0.02, [M]: 0.01 }, flags: ['choice.n02_two_poles'], end: endTalk({
              lineKo: '(한참 두 대를 번갈아 본다.) …대를 하나로 안 보고 둘로 보는구나. 그건 내가 새벽이 나이에 몰랐던 거다.',
              lineEn: "(He looks from one culm to the other for a long while.) ...You don't see a rod as one piece, you see it as two. That's something I didn't know at Saebyeok's age." }) }),
          opt('stand_firm', '얇아도 쓸 만하면 대 아닙니까.', "If it's usable, it's a rod, thin or not. Isn't it?",
            { stance: 'other', aff: { [S]: 0.03, [M]: -0.03 }, end: endTalk({
              lineKo: '(대를 벽에 도로 세운다.) 너도 저 애도 아직 대가 부러지는 걸 못 봤지. 보면 안다.',
              lineEn: "(He stands the culm back against the wall.) Neither you nor he has seen a rod break yet. Once you have, you'll know." }) }),
          opt('yield', '말씀 듣고 보니 몸통으로는 무리겠습니다.', "Now that you put it that way, it wouldn't do for the body.",
            { stance: 'giver', aff: { [M]: 0.03, [S]: -0.03 }, end: endTalk({
              lineKo: '(고개를 끄덕인다.) 그래. 마루에 앉은 놈도 들었을 거다. 들었으면 됐다.',
              lineEn: '(He nods.) Right. The one sitting on the porch will have heard that too. If he heard, that\'s enough.' }) }),
        ]),
      ask_kid: say(
        '(마루에서 아이가 벌떡 일어난다.) 안 물어봤어! 할아버지는 안 물어봤어! 그 대가 제일 맑게 울었단 말이야. 맑으면 끝이 살아.\n\n(할아버지는 대꾸 없이 고운 대를 손톱으로 톡 친다. 맑고 가벼운 소리가 난다.)',
        "(The boy shoots up on the porch.) He didn't ask! Grandpa never asked! That one rang the clearest. If it's clear, the tip's alive.\n\n(Without a word his grandfather taps the pretty culm with a fingernail. It gives a clear, light sound.)",
        [
          opt('both_right', '둘 다 맞는 것 같은데요. 몸통은 마디로, 끝은 소리로.', "I think you're both right. The body by its nodes, the tip by its sound.",
            { stance: 'mid', aff: { [M]: 0.01, [S]: 0.02 }, flags: ['choice.n02_two_poles'], end: endTalk({
              lineKo: '(두 사람을 번갈아 보다가 뒷짐을 진다.) …둘로 나눠 보는 눈이라. 그 눈은 나한테도 저 애한테도 없던 거다.',
              lineEn: '(He looks from one of us to the other, then clasps his hands behind his back.) ...An eye that sees it in two parts. Neither I nor the boy had that one.' }) }),
          opt('grandpa_right', '끝도 몸통에 붙어 있어야 살지. 할아버지 말씀이 맞아.', "A tip only lives if it's on a body. Your grandpa's right.",
            { stance: 'giver', aff: { [M]: 0.03, [S]: -0.03 }, end: endTalk({
              lineKo: '…들었냐. (아이는 대답 대신 마루에 도로 눕는다. 노인이 볼품없는 대를 내 손에 쥐여 준다.) 이건 네 거다.',
              lineEn: "...Hear that? (Instead of answering, the boy lies back down on the porch. The old man puts the plain culm in my hands.) This one's yours." }) }),
          opt('kid_right', '새벽이 귀가 맞을 수도 있지 않겠습니까.', "Couldn't Saebyeok's ear be the right one?",
            { stance: 'other', aff: { [S]: 0.04, [M]: -0.03 }, flags: ['choice.n02_backed_kid_pick'], end: endTalk({
              lineKo: '(대답 없이 고운 대를 벽에서 내려 마루 쪽에 세워 준다.) …저 애 대는 저 애가 정하겠지.',
              lineEn: '(Without answering, he takes the pretty culm down from the wall and stands it by the porch.) ...His rod is his to decide, I suppose.' }) }),
        ], S),
      luck: say(
        '(대를 내려놓는다.) 손에 잡히는 대로라. 그럼 손이 고른 거다. 손이 왜 그걸 잡았는지 다시 만져 봐.\n\n(볼품없는 대를 내 손에 쥐여 준다.) 눈 감고. 마디를 세어 봐.',
        '(He sets the culm down.) Whatever came to hand. Then your hand chose it. Feel it again and find out why your hand took it.\n\n(He puts the plain culm into my hands.) Eyes shut. Count the nodes.',
        [
          opt('feel_nodes', '(눈을 감고 마디를 하나씩 짚어 본다.)', '(I close my eyes and feel the nodes one by one.)',
            { stance: 'mid', aff: { [M]: 0.03 }, end: endTalk({
              lineKo: '…고르지. 간격이. 네 손은 벌써 알았던 거다. 머리만 몰랐지.',
              lineEn: "...Even, aren't they. The spacing. Your hand already knew. Only your head didn't." }) }),
          opt('kid_better', '새벽이라면 소리로 바로 알았을 텐데요.', 'Saebyeok would have known straight away, by the sound.',
            { stance: 'other', aff: { [S]: 0.02, [M]: -0.02 }, end: endTalk({
              lineKo: '(마루 쪽을 본다.) 저 애는 소리만 듣고, 너는 손으로만 만졌다. 둘 다 반쪽이다. 반쪽 둘이면 대 하나는 되겠지.',
              lineEn: '(He looks toward the porch.) He only hears the ring, and you only felt it with your hand. Both of you are half. Two halves might make one rod.' }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N02-6 「새벽의 첫 대」 — 끝내는 자리(탁새벽). 할아버지는 보지도 않고 얇다고 했다 · 공방 벽은 얇다(할아버지가 듣는다)
  // ═══════════════════════════════════════════
  {
    id: 'n02_6_done', questId: 'N02-6', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: say(
        '(마루에서 자는 척하다가 벌떡 일어난다.) 낚았어?! 진짜? 내 대로?\n\n(대 끝을 손가락으로 쓸어 본다. 안 부러졌다.) …할아버지는 아직 안 봤어. 얇다는 말만 하고 공방 문 닫았어. 아저씨, 솔직히 말해 봐. 얇아?',
        "(He's been pretending to sleep on the porch and shoots upright.) You caught one?! Really? On my rod?\n\n(He runs a finger along the tip. It isn't broken.) ...Grandpa still hasn't looked at it. He just said thin and shut the workshop door. Mister, tell me honestly. Is it thin?",
        [
          opt('too_much', '보지도 않고 얇다고 하신 건 할아버지가 너무하셨어.', 'Your grandpa went too far, calling it thin without even looking.',
            { stance: 'giver', aff: { [S]: 0.05, [M]: -0.05 }, flags: ['choice.n02_sided_kid'], next: 'shout' }),
          opt('is_thin', '솔직히 얇긴 해. 할아버지 말씀이 틀린 건 아니야.', "Honestly, it is thin. Your grandpa isn't wrong.",
            { stance: 'other', aff: { [S]: -0.05, [M]: 0.04 }, flags: ['choice.n02_sided_grandpa'], next: 'hurt' }),
          opt('bends', '얇아. 근데 얇은 대는 휘더라. 부러지지 않고.', "It's thin. But a thin rod bends, I found. It doesn't break.",
            { stance: 'mid', aff: { [S]: 0.03, [M]: 0.02 }, flags: ['choice.n02_thin_bends'], next: 'bends' }),
          opt('honest_first', '솔직하게 말하기 전에, 학꽁치 내기 때 나 봐줬었어.', 'Before I answer honestly: back at the halfbeak bet, I let you win.',
            { stance: 'self', aff: { [S]: -0.02, [M]: 0.02 }, flags: ['choice.n02_bet_confessed'], requires: { flag: 'choice.n02_lied_bet' }, next: 'confess_bet' }),
        ]),
      shout: say(
        '(눈이 반짝인다.) 그치? 그치? 보지도 않고! (공방 쪽으로 목소리를 높인다.) 할아버지! 아저씨도 너무했대!\n\n(공방 문은 열리지 않는다. 안에서 대 깎는 소리가 뚝 멈춘다.)',
        "(His eyes light up.) Right? Right? Without even looking! (He raises his voice toward the workshop.) Grandpa! Mister says you went too far too!\n\n(The workshop door doesn't open. Inside, the sound of carving stops dead.)",
        [
          opt('go_tell', '내가 들어가서 직접 말씀드릴게. 한 번은 보셔야지.', "I'll go in and tell him myself. He has to look at it once.",
            { stance: 'giver', aff: { [S]: 0.02, [M]: -0.03 }, end: endTalk({ complete: 'praise',
              lineKo: '(내 소매를 붙잡는다.) …아니, 하지 마. 내가 할래. 아저씨가 본 대로, 이건 낚는 대라고. 할아버지가 뭐라고 하든 이제 나는 알아.',
              lineEn: "(He grabs my sleeve.) ...No, don't. I'll do it. Just like you saw, Mister, this is a rod that catches fish. Whatever Grandpa says, I know that now." }) }),
          opt('hush', '그만. 할아버지도 다 들으셔. 소리 지른다고 대가 굵어지진 않아.', "Enough. He can hear all of it. Shouting won't make the rod any thicker.",
            { stance: 'mid', aff: { [S]: -0.01, [M]: 0.02 }, next: 'hush' }),
        ]),
      hush: say(
        '(입을 꾹 다문다. 한참 있다가 작게 말한다.) …할아버지는 원래 그래. 대한테만 말해. 나한테는 한마디로 끝내.\n\n(마루 밑에서 깎다 만 대나무를 슬쩍 꺼낸다.) 그래서 하나 더 깎는 중이야. 이번엔 안 얇게. …아니, 얇게. 내 식으로.',
        "(He presses his lips shut. After a long moment he speaks quietly.) ...Grandpa's always like that. He only talks to rods. With me it's one word and done.\n\n(From under the porch he sneaks out a half-carved piece of bamboo.) So I'm carving another one. Not thin this time. ...No. Thin. My way.",
        [
          opt('show_first', '그 대, 다 되면 나한테 제일 먼저 보여 줘.', "When that one's done, show it to me first.",
            { stance: 'giver', aff: { [S]: 0.02 }, end: endTalk({ complete: 'next_rod',
              lineKo: '(새끼손가락을 내민다.) 약속! 할아버지한테는 비밀이야. 다 되면 아저씨한테 제일 먼저 보여 줄게.',
              lineEn: "(He holds out his little finger.) Promise! It's a secret from Grandpa. When it's done, you'll see it first." }) }),
          opt('how_choose', '그 마디는 어떻게 골랐는데? 나도 좀 알려 줘.', 'How did you choose those sections? Teach me a bit.',
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ complete: 'lesson',
              lineKo: '아저씨가 나한테? …좋아. 손가락으로 톡 쳐 봐. 짧고 맑으면 살아 있는 마디야. 할아버지는 귀로 듣는데, 나는 손끝으로도 들어. 그건 내가 찾은 거야.',
              lineEn: "You, learning from me? ...Okay. Tap it with a finger. Short and clear means it's a live section. Grandpa listens with his ears, but I listen with my fingertips too. I found that out myself." }) }),
        ]),
      hurt: say(
        '(대를 쥔 손에 힘이 들어간다. 울지는 않는다.) …아저씨도 그렇게 생각해? 그래도 낚았잖아. 아저씨가 낚았잖아.\n\n얇은 대로 낚았으면 얇아도 대인 거 아니야? 할아버지랑 똑같이 말하지 마.',
        "(His grip on the rod tightens. He doesn't cry.) ...You think so too, Mister? But you caught one. You caught one on it.\n\nIf it caught a fish, isn't it a rod even if it's thin? Don't talk exactly like Grandpa.",
        [
          opt('still_rod', '맞아. 얇아도 대는 대야. 낚았으니까.', "You're right. Thin or not, a rod's a rod. It caught a fish.",
            { stance: 'mid', aff: { [S]: 0.03 }, flags: ['choice.n02_thin_bends'], end: endTalk({ complete: 'praise',
              lineKo: '(코를 훌쩍이고 고개를 든다.) …그치. 낚았으면 대야. 그 말은 할아버지한테 안 해도 돼. 내가 할 거야.',
              lineEn: "(He sniffs and lifts his head.) ...Right. If it catches, it's a rod. You don't have to tell Grandpa. I will." }) }),
          opt('thicker_next', '낚은 건 낚은 거고, 얇은 건 얇은 거야. 다음엔 조금 더 굵게 깎아 봐.', 'Catching is catching, and thin is thin. Try carving it a bit thicker next time.',
            { stance: 'other', aff: { [S]: -0.03, [M]: 0.03 }, end: endTalk({ complete: 'pay',
              lineKo: '(대를 품에 안는다.) …알았어. 다음엔 굵게. (주머니에서 천 원짜리를 꺼내 내민다.) 시험 낚시 값이야. 일 시켰으면 값은 치르는 거래. 할아버지가 그랬어.',
              lineEn: '(He hugs the rod to his chest.) ...Okay. Thicker next time. (He takes a thousand-won note from his pocket and holds it out.) For the test fishing. If you make someone work, you pay. Grandpa says so.' }) }),
          opt('body_and_tip', '몸통은 할아버지 식, 끝은 네 식. 이 끝은 네 식이 맞았어.', "The body your grandpa's way, the tip your way. On this tip, your way was right.",
            { stance: 'mid', aff: { [S]: 0.04, [M]: 0.01 }, requires: { flag: 'choice.n02_two_poles' }, end: endTalk({ complete: 'praise',
              lineKo: '(눈이 동그래진다.) …대 고를 때 아저씨가 한 말이지? 둘로 나눠 보는 거. (대 끝을 다시 쓸어 본다.) 그럼 다음 대 몸통은 할아버지한테 물어볼래. 끝은 내가 하고.',
              lineEn: "(His eyes go round.) ...That's what you said when we were choosing bamboo, right? Seeing it in two parts. (He runs a finger along the tip again.) Then for my next rod I'll ask Grandpa about the body. I'll do the tip." }) }),
        ]),
      bends: say(
        '(고개를 갸웃한다.) 휘는데 안 부러져? …맞아. 고기 걸렸을 때 활처럼 휘었지? 그게 끝이 살아서 그래.\n\n할아버지 대는 안 휘어. 굵어서. 근데 굵은 대로는 그렇게 작은 입질 못 봐. (말을 멈추고 공방 쪽을 본다.) 이 말, 할아버지한테 해도 될까?',
        "(He tilts his head.) It bends but doesn't break? ...Right. When the fish was on, it bent like a bow, didn't it? That's because the tip's alive.\n\nGrandpa's rods don't bend. They're thick. But with a thick rod you can't see a bite that small. (He stops and looks toward the workshop.) Can I say that to Grandpa?",
        [
          opt('say_it', '해. 네 대니까 네가 말해야지.', "Say it. It's your rod, so it should come from you.",
            { stance: 'giver', aff: { [S]: 0.03, [M]: -0.01 }, end: endTalk({ complete: 'praise',
              lineKo: '(대를 꼭 쥐고 공방 쪽으로 몇 걸음 가다 멈춘다.) …내일 할게. 오늘은 고기 냄새 나서 혼나. (돌아보며 웃는다.) 아저씨, 고마워.',
              lineEn: "(He grips the rod and takes a few steps toward the workshop, then stops.) ...I'll say it tomorrow. Tonight I smell of fish and I'll get told off. (He turns back, smiling.) Thanks, Mister." }) }),
          opt('both_ways', '할아버지 대는 버티는 대, 네 대는 듣는 대. 둘 다 있어야지.', "Your grandpa's rods hold on, yours listen. You need both kinds.",
            { stance: 'mid', aff: { [S]: 0.01, [M]: 0.02 }, end: endTalk({ complete: 'next_rod',
              lineKo: '듣는 대… (그 말을 몇 번 따라 한다.) 다음 대는 둘 다 넣어 볼래. 버티고 듣는 대. 다 되면 아저씨한테 제일 먼저 보여 줄게.',
              lineEn: "A rod that listens... (He repeats it to himself a few times.) My next one, I'll try to put both in. A rod that holds on and listens. When it's done, you'll see it first." }) }),
          opt('never_lie', '학꽁치 잴 때 봤지? 나 빈말 안 해. 좋은 대야.', "Remember measuring the halfbeak? I don't say things I don't mean. It's a good rod.",
            { stance: 'giver', aff: { [S]: 0.03 }, requires: { flag: 'choice.n02_fair_bet' }, end: endTalk({ complete: 'praise',
              lineKo: '(이를 드러내고 웃는다.) 응. 아저씨는 결국 자대로 말하잖아. 그러니까 믿어. 할아버지가 뭐라고 하든.',
              lineEn: '(He grins, teeth and all.) Yeah. In the end you always say what the ruler says, Mister. So I believe you. Whatever Grandpa says.' }) }),
          opt('clear_ring', '그때 네가 고른 고운 대, 그 맑은 소리가 이 끝에 들어갔구나.', 'That pretty culm you chose back then. Its clear ring went into this tip.',
            { stance: 'giver', aff: { [S]: 0.04, [M]: -0.01 }, requires: { flag: 'choice.n02_backed_kid_pick' }, end: endTalk({ complete: 'praise',
              lineKo: '(고개를 세게 끄덕인다.) 응! 맑게 울던 그 대야. 끝에 딱 맞았어. (킥킥 웃는다.) 할아버지는 아직 몰라. 그 대가 여기 들어간 거.',
              lineEn: "(He nods hard.) Yeah! The one that rang so clear. It was perfect for the tip. (He giggles.) Grandpa still doesn't know. That it went in here." }) }),
        ]),
      confess_bet: say(
        '(눈을 동그랗게 뜬다.) …그때 할아버지가 창가에서 기침한 거, 그거였구나. (입을 삐죽인다.) 봐주는 거 제일 싫다고 했잖아.\n\n…근데 지금 말해 줬으니까 됐어. 그럼 이번 말은 진짜지? 얇아, 안 얇아?',
        "(His eyes go round.) ...So that's what Grandpa's cough at the window was about. (He pouts.) I told you I hate being let off.\n\n...But you told me now, so it's okay. Then this time it's for real, right? Is it thin or not?",
        [
          opt('real_praise', '진짜로 말할게. 끝이 나보다 입질을 먼저 알았어.', 'For real, then. The tip knew about the bite before I did.',
            { stance: 'giver', aff: { [S]: 0.04, [M]: 0.01 }, end: endTalk({ complete: 'praise',
              lineKo: '(대를 두 손으로 받쳐 들고 한참 본다.) …진짜구나. 아저씨가 진짜로 말할 때 얼굴, 이제 알아. 할아버지가 뭐라고 해도 괜찮아.',
              lineEn: "(He holds the rod up in both hands and looks at it a long while.) ...It's real. I know your for-real face now, Mister. It's okay, whatever Grandpa says." }) }),
          opt('real_thin', '진짜로 말하면, 얇아. 근데 휘기만 하고 안 부러지더라.', "For real? It's thin. But it only bent, it didn't break.",
            { stance: 'mid', aff: { [S]: 0.02, [M]: 0.01 }, flags: ['choice.n02_thin_bends'], next: 'bends' }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N02-2 「왕대를 찾아서」 — 받는 자리(탁만수). 누구 탓인가(첫 대에서 선 자리가 열린다) · 새벽에게 무슨 문자를 보내나
  // ═══════════════════════════════════════════
  {
    id: 'n02_2_offer', questId: 'N02-2', at: 'offer', npcId: M, start: 'start',
    nodes: {
      start: say(
        '(공방 문간에 서 있다. 손에 든 대패가 한참 움직이지 않는다.) 새벽이 태안 갔다. 왕대 찾으러. 쪽지 한 장 남기고.\n\n(쪽지를 내민다. 삐뚤빼뚤한 글씨로 「안 얇은 거 찾아올게.」) 전화는 안 받는다. 내 전화는. …데려와라. 내가 가면 안 온다.',
        "(He's standing in the workshop doorway. The plane in his hand hasn't moved in a long while.) Saebyeok went to Taean. For a giant culm. Left one note.\n\n(He holds out the note. In wobbly letters: I'll find one that isn't thin.) He won't answer the phone. Not mine. ...Bring him back. If I go, he won't come.",
        [
          opt('go_now', '지금 바로 태안으로 가겠습니다.', "I'll head to Taean right now.",
            { stance: 'mid', aff: { [M]: 0.03 }, next: 'text' }),
          opt('why_gone', '왜 갔는지 짐작 가는 데가 있으십니까?', 'Do you have any idea why he went?',
            { stance: 'mid', next: 'why' }),
          opt('go_yourself', '직접 가셔야 오지 않겠습니까? 할아버지신데요.', "Shouldn't you go yourself? You're his grandfather.",
            { stance: 'self', aff: { [M]: -0.03 }, next: 'not_me' }),
        ]),
      why: say(
        '(쪽지를 접었다 편다.) 얇다고 했다. 그 애가 처음 제 손으로 깎은 대를. 보지도 않고.\n\n그다음 날 아침에 이 쪽지다. 안 얇은 걸 찾아오겠다고. (대패를 작업대에 내려놓는다.) 누구 탓인지 말해 봐라. 남의 눈이 더 잘 본다.',
        "(He folds the note and unfolds it.) I said thin. About the first rod he ever carved with his own hands. Without even looking.\n\nThe next morning, this note. He'll find one that isn't thin. (He puts the plane down on the workbench.) Tell me whose fault it is. An outsider's eye sees better.",
        [
          opt('your_fault', '보지도 않고 하신 그 말이 아이를 보낸 겁니다.', 'That word you said without looking is what sent him off.',
            { stance: 'other', aff: { [M]: -0.05 }, next: 'blame' }),
          opt('kid_fault', '그래도 말없이 나간 건 새벽이 잘못입니다.', "Still, running off without a word is Saebyeok's fault.",
            { stance: 'giver', aff: { [M]: -0.01 }, next: 'kid_fault' }),
          opt('my_part_kid', '그날 저까지 너무하셨다고 거들었습니다. 제 탓도 있습니다.', 'That day I chimed in too, saying you went too far. Some of it is on me.',
            { stance: 'self', aff: { [M]: 0.02 }, requires: { flag: 'choice.n02_sided_kid' }, end: endTalk({ accept: true,
              lineKo: '…들었다. 공방 벽은 대보다 얇다. (쪽지를 내 손에 쥐여 준다.) 탓은 데려온 다음에 나눠 지자. 가라.',
              lineEn: "...I heard. The workshop wall is thinner than any rod. (He presses the note into my hand.) We'll share out the blame once he's back. Go." }) }),
          opt('my_part_grandpa', '제가 얇다고 거들었습니다. 아이 등을 민 건 저일지도 모릅니다.', 'I agreed it was thin. Maybe I was the one who pushed him out the door.',
            { stance: 'self', aff: { [M]: 0.01 }, requires: { flag: 'choice.n02_sided_grandpa' }, end: endTalk({ accept: true,
              lineKo: '(고개를 젓는다.) 얇다고 처음 말한 건 나다. 너는 보고 말했고, 나는 안 보고 말했다. 다르지. …가서 데려와.',
              lineEn: "(He shakes his head.) I'm the one who said thin first. You looked and said it, I said it without looking. Not the same. ...Go and bring him back." }) }),
        ]),
      blame: say(
        '(한참 말이 없다.) …그래. 내가 보냈다.\n\n보면 칭찬이 나올까 봐 안 봤다. 칭찬받은 손은 깎다 말고 멈춘다. 나는 그렇게 배웠다. (대패 날을 손톱으로 쓸어 본다.) …틀렸을 수도 있지.',
        "(He's silent a long while.) ...Right. I sent him.\n\nI didn't look because I was afraid praise would come out. A hand that's been praised stops halfway through the cut. That's how I was taught. (He runs a fingernail along the plane's blade.) ...Maybe I was wrong.",
        [
          opt('may_i_tell', '그 말씀, 새벽이한테 전해도 되겠습니까?', 'May I tell Saebyeok what you just said?',
            { stance: 'mid', aff: { [M]: 0.03 }, flags: ['choice.n02_grandpa_reason'], end: endTalk({ accept: true,
              lineKo: '(고개를 젓다가 멈춘다.) …네 입으로 하든 말든. 내 입으로는 못 한다. 가라.',
              lineEn: "(He starts to shake his head, then stops.) ...Whether your mouth says it is up to you. Mine can't. Go." }) }),
          opt('still_wrong', '그래도 한 번은 보셨어야 했습니다.', 'Even so, you should have looked at it once.',
            { stance: 'other', aff: { [M]: -0.04 }, end: endTalk({ accept: true,
              lineKo: '(대답 대신 쪽지를 내 손에 쥐여 준다.) …그 말은 데려온 다음에 다시 해라.',
              lineEn: "(Instead of answering he presses the note into my hand.) ...Say that again once he's back." }) }),
          opt('send_word', '가기 전에 새벽이한테 문자라도 보내 보겠습니다.', "Before I go, I'll try sending Saebyeok a message.",
            { stance: 'mid', next: 'text' }),
        ]),
      kid_fault: say(
        '(눈썹이 꿈틀한다.) 그 애 고집은 내 고집이다. 그 애 탓이면 내 탓이야.\n\n…말 한마디 없이 나간 건 혼날 일이지. 혼은 내가 낸다. 너는 데려만 와.',
        "(His eyebrows twitch.) His stubbornness is my stubbornness. If it's his fault, it's mine.\n\n...Leaving without a word does deserve a scolding. I'll do the scolding. You just bring him back.",
        [
          opt('just_fetch', '알겠습니다. 데려오기만 하겠습니다.', "Understood. I'll just bring him back.",
            { stance: 'giver', aff: { [M]: 0.02 }, end: endTalk({ accept: true,
              lineKo: '그래. 억지로 끌고 오지는 마라. 그러면 또 간다. (쪽지를 내 손에 쥐여 준다.)',
              lineEn: "Right. Don't drag him back by force. He'll only go again. (He presses the note into my hand.)" }) }),
          opt('send_word', '가기 전에 새벽이한테 문자라도 보내 보겠습니다.', "Before I go, I'll try sending Saebyeok a message.",
            { stance: 'mid', next: 'text' }),
        ]),
      not_me: say(
        '내가 가면 안 온다. 그 애 고집은 내 고집이야. 둘이 마주 서면 둘 다 안 굽혀.\n\n(쪽지를 내려다본다.) 너는 그 애 내기 상대다. 너한테는 지고도 웃는 놈이야. 그러니까 네가 가.',
        "If I go, he won't come. His stubbornness is my stubbornness. Face to face, neither of us bends.\n\n(He looks down at the note.) You're his betting partner. With you he can lose and still laugh. So you go.",
        [
          opt('then_me', '알겠습니다. 제가 다녀오겠습니다.', "All right. I'll go.",
            { stance: 'giver', aff: { [M]: 0.02 }, next: 'text' }),
          opt('bend_both', '얇은 대는 휘지, 부러지진 않습니다. 두 분 다 조금만 휘시면 됩니다.', "A thin rod bends, it doesn't break. You both just need to bend a little.",
            { stance: 'mid', aff: { [M]: 0.02 }, requires: { flag: 'choice.n02_thin_bends' }, end: endTalk({ accept: true,
              lineKo: '(쪽지를 오래 본다.) …휘는 놈이라 태안까지 휘어 갔구나. 데려와라. 부러지기 전에.',
              lineEn: '(He looks at the note a long while.) ...A boy who bends, so he bent all the way to Taean. Bring him back. Before he snaps.' }) }),
          opt('still_you', '그래도 할아버지가 가셔야 합니다.', 'Even so, it should be you who goes.',
            { stance: 'other', aff: { [M]: -0.03 }, end: endTalk({ accept: true,
              lineKo: '(대패를 다시 든다. 손이 움직이지 않는다.) …나는 여기서 기다린다. 그게 내 몫이다. 가라.',
              lineEn: "(He picks the plane up again. His hand doesn't move.) ...I'll wait here. That's my part. Go." }) }),
        ]),
      text: say(
        '(고개를 끄덕이다가 내 주머니를 가리킨다.) 가기 전에 네 전화로 해 봐라. 내 번호는 안 받아도 네 번호는 볼 거다.\n\n뭐라고 보낼지는 네가 정해. 그 애는 글자 하나도 오래 본다.',
        "(He nods, then points at my pocket.) Before you go, try it from your phone. He won't answer my number, but he'll look at yours.\n\nWhat you send is up to you. That boy stares at every single letter.",
        [
          opt('text_coming', '(문자를 보낸다. 「아저씨가 갈게. 왕대 같이 찾자.」)', "(I send a message: I'm coming. Let's find the culm together.)",
            { stance: 'other', aff: { [S]: 0.03 }, end: endTalk({ accept: true,
              lineKo: '(곧 읽음 표시가 뜬다. 답은 없다.) …읽었으면 됐다. 그 애는 읽고 기다리는 놈이다.',
              lineEn: "(Soon the message shows as read. No reply.) ...If he read it, that's enough. He's the kind who reads and waits." }) }),
          opt('text_scold', '(문자를 보낸다. 「할아버지 걱정하신다. 당장 돌아와.」)', "(I send a message: Your grandpa's worried. Come back right now.)",
            { stance: 'giver', aff: { [S]: -0.03, [M]: 0.01 }, flags: ['choice.n02_text_scold'], end: endTalk({ accept: true,
              lineKo: '(읽음 표시가 뜨자마자 그쪽 전화가 꺼진다.) …내가 언제 걱정한다고 했냐. 됐다. 가 봐라.',
              lineEn: '(The moment it shows as read, his phone goes off.) ...When did I say I was worried? Never mind. Go.' }) }),
          opt('face_to_face', '문자보다는 얼굴 보고 말하겠습니다.', "I'd rather tell him face to face than by message.",
            { stance: 'self', end: endTalk({ accept: true,
              lineKo: '(고개를 끄덕인다.) 그것도 방법이다. 그 애는 얼굴을 보면 못 도망간다. 나를 닮아서.',
              lineEn: "(He nods.) That's a way too. Once he sees your face he can't run. He takes after me." }) }),
        ]),
    },
  },

  // N02-2 — 진행 중: 태안 대나무 숲에서 새벽을 찾는다(목표 0). 아이 편 · 할아버지 편 · 같이 고르기(아이가 집에 가서 옮긴다)
  {
    id: 'n02_2_find', questId: 'N02-2', at: 'objective', objectiveIndex: 0, npcId: S, start: 'start',
    nodes: {
      start: say(
        '(대나무 숲 안쪽에서 톡, 톡 소리가 난다. 아이가 마디에 귀를 대고 있다가 나를 보고 굳는다.) …아저씨. 어떻게 알았어?\n\n안 가. 할아버지가 보낸 거면 안 가. 안 얇은 거 찾을 때까지 안 가.',
        "(From deep in the bamboo grove comes a tap, tap. The boy has his ear to a node. He sees me and freezes.) ...Mister. How did you know?\n\nI'm not going. If Grandpa sent you, I'm not going. Not until I find one that isn't thin.",
        [
          opt('help_find', '데리러 온 거 아니야. 왕대 찾는 거 도우러 왔어.', "I didn't come to fetch you. I came to help you find the culm.",
            { stance: 'other', aff: { [S]: 0.04 }, next: 'why_here' }),
          opt('grandpa_sent', '할아버지가 보내셨어. 거짓말은 안 할게.', "Your grandpa sent me. I won't lie to you.",
            { stance: 'mid', aff: { [S]: -0.02, [M]: 0.02 }, next: 'sent' }),
          opt('scold', '말도 없이 이렇게 멀리 오면 어떡해!', 'How could you come all this way without a word!',
            { stance: 'giver', aff: { [S]: -0.05, [M]: 0.02 }, next: 'scolded' }),
          opt('text_sorry', '문자는 미안. 화나서 보낸 건 아니었어.', "Sorry about the message. I didn't send it because I was angry.",
            { stance: 'mid', aff: { [S]: 0.03 }, requires: { flag: 'choice.n02_text_scold' }, next: 'why_here' }),
        ]),
      sent: say(
        '(대나무를 두드리던 손이 멈춘다.) …거봐. 할아버지는 자기가 안 오고 아저씨를 보내. 맨날 그래. 말도 남한테 시키고.\n\n(그래도 도망가지는 않는다. 대나무에 등을 기대고 주저앉는다.) 할아버지가 뭐래. 화났어?',
        "(The hand tapping the bamboo stops.) ...See? Grandpa doesn't come himself, he sends you. Always. Even his words, he makes someone else say them.\n\n(Still, he doesn't run. He leans his back against a culm and slumps down.) What did Grandpa say? Is he angry?",
        [
          opt('not_angry', '화 안 나셨어. 대패를 들고 한참 가만히 계시더라.', "He's not angry. He just stood there a long time holding his plane.",
            { stance: 'mid', aff: { [S]: 0.03 }, next: 'why_here' }),
          opt('of_course', '화나셨지. 당연하잖아.', "Of course he's angry. What did you expect?",
            { stance: 'giver', aff: { [S]: -0.03 }, next: 'why_here' }),
        ]),
      scolded: say(
        '(얼굴이 빨개진다.) 아저씨도 할아버지랑 똑같아! 잘못했다는 말만 듣고 싶은 거지?\n\n(대나무 숲 안쪽으로 몇 걸음 물러난다.) 안 가. 왕대 찾기 전엔 절대 안 가.',
        "(He goes red in the face.) You're just like Grandpa! All you want is to hear me say sorry, right?\n\n(He backs a few steps deeper into the grove.) I'm not going. Not until I've found a culm. Never.",
        [
          opt('calm_down', '미안. 놀라서 그랬어. 왜 왔는지 얘기해 줄래?', 'Sorry. I was just scared for you. Will you tell me why you came?',
            { stance: 'mid', aff: { [S]: 0.03 }, next: 'why_here' }),
          opt('before_dark', '안 돼. 해 지기 전에 같이 간다.', "No. We're leaving together before dark.",
            { stance: 'giver', aff: { [S]: -0.03, [M]: 0.02 }, end: endTalk({
              lineKo: '(입술을 깨문다.) …왕대 하나만. 하나만 고르고 갈게. 그건 아저씨도 못 말려. 그리고 농어 한 마리. 빈손으로 가면 할아버지가 내가 진 줄 알아.',
              lineEn: "(He bites his lip.) ...Just one culm. I'll pick just one and then go. Even you can't stop me doing that. And one sea bass. If I go back empty-handed, Grandpa will think I lost." }) }),
        ]),
      why_here: say(
        '(대나무 하나를 손가락으로 톡 친다. 짧고 맑은 소리.) 할아버지가 내 대 얇대. 보지도 않고. 그래서 안 얇은 거 찾으러 왔어. 진짜 왕대.\n\n이걸로 대를 깎아서 할아버지 앞에 세워 놓을 거야. 그럼 봐야 되잖아. 안 볼 수가 없잖아.',
        "(He taps a culm with his finger. A short, clear sound.) Grandpa says my rod's thin. Without even looking. So I came to find one that isn't. A real giant culm.\n\nI'll carve a rod from it and stand it right in front of Grandpa. Then he'll have to look. He won't be able not to.",
        [
          opt('grandpa_wrong', '할아버지가 너무하셨어. 보기는 하셨어야지.', 'Your grandpa went too far. He should at least have looked.',
            { stance: 'other', aff: { [S]: 0.04, [M]: -0.03 }, end: endTalk({
              lineKo: '(고개를 세게 끄덕인다.) 그치! 집에 가서 할아버지한테 말할 거야. 아저씨도 그랬다고. (왕대 하나를 골라 어깨에 멘다.) 가자. 농어 한 마리 낚고.',
              lineEn: "(He nods hard.) Right! I'm telling Grandpa when we get home. That you said so too. (He picks out a giant culm and shoulders it.) Let's go. After we catch a sea bass." }) }),
          opt('his_reason', '할아버지가 왜 안 보셨는지 들었어. 보면 칭찬하실까 봐 그러셨대.', "I heard why he didn't look. He was afraid he'd end up praising it.",
            { stance: 'mid', aff: { [S]: 0.05, [M]: 0.03 }, flags: ['choice.n02_told_reason'], requires: { flag: 'choice.n02_grandpa_reason' }, next: 'reason' }),
          opt('grandpa_too', '할아버지도 이유가 있으셨을 거야. 말없이 나온 건 너도 잘못이고.', 'Your grandpa must have had his reasons. And leaving without a word was wrong of you too.',
            { stance: 'giver', aff: { [S]: -0.03, [M]: 0.03 }, end: endTalk({
              lineKo: '(입을 삐죽인다.) …알아. 나도 알아. 그래도 왕대는 가져갈 거야. (대나무 하나를 두드려 본다. 짧고 맑다.) 이거. 농어 한 마리 낚고 가자.',
              lineEn: "(He pouts.) ...I know. I know that. I'm still taking a culm home, though. (He taps one. Short and clear.) This one. Let's catch a sea bass and go." }) }),
          opt('show_him', '좋아. 같이 고르자. 대신 할아버지 앞에는 네가 직접 세워.', "Okay. Let's choose one together. But you're the one who stands it in front of him.",
            { stance: 'mid', aff: { [S]: 0.03, [M]: 0.01 }, end: endTalk({
              lineKo: '(눈이 동그래진다.) 같이? …좋아! 아저씨는 귀 대고 들어. 짧고 맑으면 좋은 거야. (둘이 반나절을 두드린 끝에 한 대를 고른다.) 됐다. 농어 한 마리 낚고 가자.',
              lineEn: "(His eyes go round.) Together? ...Okay! Put your ear to it and listen, Mister. Short and clear is good. (After half a day of tapping, the two of us choose one.) Done. Let's catch a sea bass and go." }) }),
        ]),
      reason: say(
        '(손이 멈춘다.) …칭찬할까 봐? 칭찬받은 손은 깎다 말고 멈춘다고? 그거 할아버지가 맨날 하는 말이야.\n\n(한참 대나무만 본다.) 그럼… 봤으면 칭찬할 뻔했다는 거잖아. 그치? 그런 거잖아.',
        "(His hand stops.) ...Afraid he'd praise it? A praised hand stops halfway through the cut? Grandpa says that all the time.\n\n(He stares at the bamboo for a long time.) Then... that means if he'd looked, he'd almost have praised it. Right? That's what it means.",
        [
          opt('yes_that', '그런 거지. 그러니까 이번엔 보시게 하자.', "That's what it means. So this time, let's make him look.",
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({
              lineKo: '(코를 훌쩍이고 웃는다.) …바보 할아버지. (왕대 하나를 골라 어깨에 멘다.) 가자. 농어 한 마리는 낚고. 빈손으로 가면 할아버지가 내가 진 줄 알아.',
              lineEn: '(He sniffs and laughs.) ...Silly Grandpa. (He picks out a giant culm and shoulders it.) Let\'s go. After one sea bass. If I go back empty-handed, Grandpa will think I lost.' }) }),
          opt('keep_secret', '대신 내가 말했다고는 하지 마. 할아버지 비밀이야.', "Just don't say I told you. It's your grandpa's secret.",
            { stance: 'giver', aff: { [S]: 0.01, [M]: 0.02 }, end: endTalk({
              lineKo: '(새끼손가락을 건다.) 비밀. 할아버지는 대한테만 말하니까, 나도 대한테만 말할게. (왕대를 어깨에 멘다.) 농어 한 마리 낚고 가자.',
              lineEn: "(He hooks his little finger round mine.) Secret. Grandpa only talks to rods, so I'll only tell the rod. (He shoulders the culm.) Let's catch a sea bass and go." }) }),
        ]),
    },
  },

  // ═══════════════════════════════════════════
  // N02-4 「마지막 죽간」 — 끝내는 자리(탁새벽) · 결말은 정본 하나(`n02_rod`). 앞에서 한 말을 기억한다
  // ═══════════════════════════════════════════
  {
    id: 'n02_4_done', questId: 'N02-4', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: say(
        '(두 손으로 대를 받쳐 들고 서 있다. 손이 조금 떨린다.) 받아, 아저씨. 이음새 찾아봐. 못 찾을걸.\n\n(공방 구석에서 할아버지가 대패질을 멈추고 이쪽을 본다. 아무 말도 하지 않는다.) …할아버지 봤어. 봤지? 근데 아무 말도 안 해.',
        "(He stands holding the rod up in both hands. They shake a little.) Take it, Mister. Look for the joint. Bet you can't find it.\n\n(In the corner of the workshop his grandfather stops planing and looks over. He says nothing.) ...Grandpa saw. You saw him look, right? But he isn't saying anything.",
        [
          opt('both_hands', '할아버지 손이랑 네 손이 다 들어간 대네.', "This rod has your grandpa's hands and yours in it.",
            { stance: 'mid', aff: { [S]: 0.03, [M]: 0.03 }, next: 'both' }),
          opt('your_rod', '이건 네 대야. 네가 마무리했잖아.', "This is your rod. You're the one who finished it.",
            { stance: 'giver', aff: { [S]: 0.05, [M]: -0.02 }, next: 'yours' }),
          opt('grandpa_rod', '오십 년 가르치신 할아버지 손이 만든 대지.', 'This rod was made by the hands your grandpa trained for fifty years.',
            { stance: 'other', aff: { [S]: -0.03, [M]: 0.04 }, next: 'grandpa_side' }),
          opt('silence_praise', '아무 말 안 하시는 거, 이제 무슨 뜻인지 알지?', 'You know what it means now, when he says nothing, right?',
            { stance: 'mid', aff: { [S]: 0.04, [M]: 0.02 }, requires: { flag: 'choice.n02_told_reason' }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '(고개를 끄덕인다.) 알아. 태안에서 아저씨가 알려 줬잖아. 칭찬하면 손이 멈출까 봐. …근데 이제 다 깎았으니까 멈춰도 돼. 할아버지, 이제 칭찬해도 돼!',
              lineEn: "(He nods.) I know. You told me in Taean. He's afraid a praised hand will stop. ...But it's all carved now, so it can stop. Grandpa, you're allowed to praise it now!" }) }),
        ]),
      both: say(
        '(대를 내려다본다.) …응. 할아버지 손이랑 내 손이랑, 아저씨 아버지 손.\n\n(구석을 힐끔 본다. 할아버지가 대패를 내려놓았다.) 그리고 아저씨 손. 마지막 손질은 같이 했잖아. 그러니까 넷이야.',
        "(He looks down at the rod.) ...Yeah. Grandpa's hands and mine, and your father's.\n\n(He glances at the corner. His grandfather has set the plane down.) And yours, Mister. We did the last finishing together. So that's four.",
        [
          opt('four_hands', '넷이 든 대니까 함부로 못 부러뜨리겠다.', "With four pairs of hands in it, I'd never dare break it.",
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '부러뜨리면 넷이 다 슬퍼해야 돼. 그러니까 부러뜨리지 마. (구석에서 할아버지가 처음으로 웃는다.) …봤어? 지금 웃었어.',
              lineEn: "If it breaks, all four of us have to be sad. So don't break it. (In the corner, his grandfather smiles for the first time.) ...Did you see? He just smiled." }) }),
          opt('teach_grain', '이음새 없애는 법, 마지막으로 가르쳐 줘.', 'Teach me one last thing. How to make a joint disappear.',
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ complete: 'lesson', ending: 'n02_rod',
              lineKo: '결을 맞춰. 마디는 마디끼리, 결은 결끼리. 백 번 맞춰 보고 한 번 붙여. (구석에서 할아버지가 고개를 한 번 끄덕인다.) 할아버지는 이걸 오십 년 했대.',
              lineEn: "Match the grain. Node to node, grain to grain. Fit it a hundred times and glue it once. (In the corner, his grandfather nods once.) Grandpa says he's done this for fifty years." }) }),
          opt('bet_truth', '고백할 게 있어. 처음 학꽁치 내기, 그때 내가 봐줬어.', "I've got a confession. That first halfbeak bet, I let you win.",
            { stance: 'self', aff: { [S]: -0.02 }, requires: { flag: 'choice.n02_lied_bet', notFlag: 'choice.n02_bet_confessed' }, next: 'knew' }),
        ]),
      knew: say(
        '(키득 웃는다.) 알아. 할아버지가 말해 줬어. 이 대 마무리하던 날 밤에. 그날 꼬리 접는 거, 창으로 다 봤대.\n\n할아버지가 그랬어. 봐준 마음은 나쁜 마음이 아니래. 거짓말은 거짓말이지만. 그러니까 아저씨가 언젠가 말할 거라고. …진짜 말했네.',
        "(He giggles.) I know. Grandpa told me. The night we finished this rod. He saw you fold the tail that day, from the window.\n\nGrandpa said a heart that lets someone win isn't a bad heart. A lie's still a lie, though. So he said you'd tell me someday. ...And you really did.",
        [
          opt('sorry_late', '늦어서 미안. 이제라도 말해서 다행이다.', "Sorry it took so long. I'm glad I finally said it.",
            { stance: 'mid', aff: { [S]: 0.03, [M]: 0.03 }, end: endTalk({ complete: 'first_fish', ending: 'n02_rod',
              lineKo: '(대 손잡이를 쓰다듬는다.) 그럼 벌칙이야. 이 대로 올린 첫 마리, 나한테 제일 먼저 보여 줘. 독도까지 따라갈 거야. 안 된다고 해도.',
              lineEn: "(He strokes the grip.) Then here's your penalty. The first fish you land on this rod, show me before anyone. I'm following you all the way to Dokdo. Even if you say no." }) }),
        ]),
      yours: say(
        '(귀까지 빨개진다.) …내 대? 아니야. 아저씨 아버지 대야. 나는 마무리만 했어.\n\n(그래도 가슴을 쭉 편다.) 근데 마무리가 제일 어려워. 할아버지가 그랬어. 손 놓는 것도 일이래. 할아버지는 이번에 그 일을 했대.',
        "(He turns red to the ears.) ...My rod? No. It's your father's rod. I only finished it.\n\n(Still, he puffs out his chest.) But finishing's the hardest part. Grandpa says so. Letting go is work too, he says. This time, that was the work he did.",
        [
          opt('pay_maker', '그럼 마무리한 장인한테 제값은 치러야지.', "Then I'd better pay the craftsman who finished it a fair price.",
            { stance: 'giver', aff: { [S]: 0.02 }, end: endTalk({ complete: 'pay', ending: 'n02_rod',
              lineKo: '…장인. 나? (진지하게 값을 부르려다 구석을 본다. 할아버지가 고개를 젓는다.) 반값이래. 나머지 반은 장인이라고 불러 준 걸로 받을게.',
              lineEn: "...Craftsman. Me? (He's about to name a price in earnest when he glances at the corner. His grandfather shakes his head.) Half, he says. I'll take the other half as you calling me a craftsman." }) }),
          opt('letting_go', '손 놓는 일, 할아버지한테는 제일 어려우셨겠다.', 'Letting go must have been the hardest thing of all for your grandpa.',
            { stance: 'other', aff: { [S]: 0.01, [M]: 0.04 }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '(구석을 본다. 할아버지가 대패를 쥔 채 고개를 돌린다.) …응. 그래서 이 대엔 할아버지 손도 들어 있어. 안 만진 손.',
              lineEn: "(He looks at the corner. His grandfather turns his head away, still gripping the plane.) ...Yeah. So Grandpa's hands are in this rod too. The hands that didn't touch it." }) }),
          opt('not_thin_now', '얇다고 하셨던 할아버지도 이번엔 아무 말 못 하시네.', "Your grandpa, who called it thin, can't say a word this time.",
            { stance: 'giver', aff: { [S]: 0.03, [M]: -0.02 }, requires: { flag: 'choice.n02_sided_kid' }, end: endTalk({ complete: 'first_fish', ending: 'n02_rod',
              lineKo: '(키득거리다 입을 막는다.) 쉿! 다 들려. …근데 맞아. 이제 얇다고 안 해. 아저씨, 이 대로 첫 마리 올리면 나한테 제일 먼저 보여 줘.',
              lineEn: "(He giggles, then claps a hand over his mouth.) Shh! He can hear. ...But it's true. He doesn't say thin any more. Mister, when you land your first fish on this rod, show me first." }) }),
        ]),
      grandpa_side: say(
        '(대를 쥔 손에 힘이 들어간다.) …할아버지가 가르친 건 맞아. 근데 이번엔 할아버지가 손 하나도 안 댔어. 진짜로.\n\n(구석에서 할아버지가 헛기침을 한다. 새벽이가 그쪽을 쳐다본다.) 할아버지도 말해 봐. 안 댔잖아.',
        "(His grip on the rod tightens.) ...Grandpa taught me, sure. But this time he didn't lay a single finger on it. Honestly.\n\n(In the corner his grandfather clears his throat. Saebyeok looks over at him.) Tell him, Grandpa. You didn't touch it.",
        [
          opt('my_bad', '미안. 네 손으로 마무리한 대 맞아.', "Sorry. It's a rod your own hands finished.",
            { stance: 'giver', aff: { [S]: 0.04 }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '(그제야 웃는다.) 그치. 할아버지 손은 마음으로만 들어갔어. 그것도 손이래. 할아버지가 그랬어.',
              lineEn: "(Only now does he smile.) Right. Grandpa's hands only went in through his heart. That counts as hands too, he says." }) }),
          opt('ask_grandpa', '어르신, 한 말씀 해 주시지요.', "Sir, won't you say something?",
            { stance: 'other', aff: { [M]: 0.02 }, next: 'nod' }),
          opt('not_thin_any', '얇다고 거들었던 거 취소할게. 이 대는 하나도 안 얇아.', "I take back agreeing it was thin. This rod isn't thin at all.",
            { stance: 'giver', aff: { [S]: 0.04, [M]: 0.01 }, requires: { flag: 'choice.n02_sided_grandpa' }, end: endTalk({ complete: 'first_fish', ending: 'n02_rod',
              lineKo: '(눈을 깜박이다 크게 웃는다.) 그거 아직 기억해? …좋아, 취소 받아 줄게. 대신 이 대로 올린 첫 마리, 나한테 제일 먼저 보여 줘.',
              lineEn: "(He blinks, then laughs out loud.) You still remember that? ...Okay, I'll accept. But the first fish you land on this rod, show me before anyone." }) }),
        ]),
      nod: say(
        '(할아버지는 대답하지 않는다. 대패를 내려놓고, 대를 한 번 오래 바라본다. 그러고는 고개를 한 번 끄덕인다.)\n\n(새벽이가 숨을 멈춘다. 그 끄덕임 하나에 어깨가 천천히 내려간다.)',
        "(His grandfather doesn't answer. He puts the plane down and looks at the rod for one long moment. Then he nods, once.)\n\n(Saebyeok holds his breath. At that single nod, his shoulders slowly come down.)",
        [
          opt('that_was_it', '새벽아, 방금 그거 칭찬이다.', 'Saebyeok, that just now was praise.',
            { stance: 'mid', aff: { [S]: 0.04, [M]: 0.02 }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '(입을 막고 웃는다.) 알아. 할아버지 최고 칭찬이야. 아무 말 안 하는 거. …아저씨, 받아. 이제 진짜 아저씨 대야.',
              lineEn: "(He covers his mouth and laughs.) I know. It's Grandpa's highest praise. Saying nothing. ...Take it, Mister. Now it's really your rod." }) }),
        ], ''),
    },
  },
];
