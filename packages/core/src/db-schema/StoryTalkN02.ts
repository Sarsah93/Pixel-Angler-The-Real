/**
 * @file StoryTalkN02.ts
 * @description 254차 — N02 「탁만수 · 탁새벽 — 죽간 공방 조손」 이어지는 대화. 규칙은 `StoryTalks.ts` 머리 주석.
 *   290차 — 전부 대본 장면(주고받기)으로 고쳐 썼다(`.agents/inputs/290_talk_brief.md`). 단계 id · 고를 말 id · 입장 · 우호도 · 표시 ·
 *   조건 · 끝 · 결말은 254차 그대로이고, 받는 끝 몇 곳을 옛 받는 답(`offer`)에 묶었다. 없던 받는 · 끝내는 자리를 새로 썼다.
 *
 * 인물: 탁만수(78 · 속초 죽간 공방의 마지막 대 — 말이 짧은 반말 「~다」 「~라」 · 「너」 · 칭찬을 안 한다 「칭찬받은 손은 깎다 말고 멈춘다」)
 *   · 탁새벽(12 · 손자 — 들뜬 반말 · 마디를 소리로 고른다 · 얇고 예민한 끝을 좋아한다).
 * 호칭(290): 주인공은 아이 앞에서 노인을 「네 할아버지」 · 노인에게는 「탁만수 씨」. 새벽이는 주인공을 「아저씨」로 부르지 않는다 —
 *   부를 때는 `{player} 씨`(장면에 한 번 정도) · 대개 부르지 않는다. 지문은 노인을 「노인」으로 쓴다.
 * 갈래의 축: 할아버지의 방식(마디 · 버티는 대 · 말 없는 칭찬) ↔ 손자의 방식(소리 · 듣는 대 · 봐 달라는 마음).
 *   가운데 = 「얇은 대는 휜다」 · 「몸통은 마디로, 끝은 소리로」.
 * 순서: 받기(부러진 대) → 내기(학꽁치 길이) → 끝내기 → 대를 고르는 눈(받기 · 까닭 · 끝내기) → 새벽의 첫 대(받기 · 끝내기)
 *   → 태안(받기 · 찾기 · 끝내기) → 돌무덤의 주인(받기 · 끝내기) → 마지막 죽간(받기 · 끝내기).
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
 *  (옛 받는 답의 표시) choice.n02_1_asked_saebyeok · n02_2_asked_wangdae · n02_3_asked_mound · n02_4_asked_letgo ·
 *   n02_5_asked_hint · n02_6_asked_grandpa — 받는 끝을 그 답에 묶어 남긴다(`offer`).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const M = 'tak_mansu';
const S = 'tak_saebyeok';
const P = 'player';

export const TALKS_N02: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N02-1 「부러진 대」 — 받는 자리(탁만수). 문간에서 새벽이가 듣고 있다
  // ═══════════════════════════════════════════
  {
    id: 'n02_1_offer', questId: 'N02-1', at: 'offer', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(P, '실례합니다. 아버지가 쓰시던 릴대인데, 한번 봐 주실 수 있을까요?', "Excuse me. This reel rod was my father's. Could you take a look at it?"),
        line('', '(노인이 대를 받아 들고 마디마다 엄지를 굴려 본다. 한 마디에서 손이 잠깐 멈춘다.)', '(The old man takes the rod and rolls his thumb along each section. At one of them his hand stops for a moment.)'),
        line(M, '…두고 가라. 하루는 걸린다.', "...Leave it. It'll take a day."),
        line(P, '하루나요?', 'A whole day?'),
        line(M, '대가 말을 해야 나도 안다.', 'I only know once the rod tells me.'),
        line('', '(문간에서 아이 하나가 고개를 내밀고 있다.)', '(A boy is poking his head round the doorway.)'),
        line(P, '저 아이는…', 'That boy...'),
        line(M, '저건 새벽이. 내 손자다.', "That's Saebyeok. My grandson."),
        line(M, '그동안 저 애랑 학꽁치나 낚아. 내기를 걸 거다. 애가 내기를 좋아해.', "Go catch halfbeak with him meanwhile. He'll want a bet. The boy likes a wager."),
      ], {
        choices: [
          opt('entrust', '아버지가 오래 쓰시던 대입니다. 맡기고 가겠습니다.', "It was my father's rod for a long time. I'll leave it with you.",
            { stance: 'giver', aff: { [M]: 0.04 }, next: 'entrust',
              note: ['아버지가 오래 쓰시던 대라며 맡겼다.', "I told him it was my father's rod for a long time, and left it with him."] }),
          opt('kid_bet', '새벽아, 내기하자고? 좋아, 받아 줄게.', "Saebyeok, you want a bet? Sure, you're on.",
            { stance: 'other', aff: { [S]: 0.04 }, next: 'bet' }),
          opt('rod_only', '대만 봐 주시면 됩니다. 애하고 놀 시간은 없어서요.', "Just the rod, please. I don't really have time to play with a kid.",
            { stance: 'self', aff: { [M]: -0.03, [S]: -0.03 }, next: 'rod_only',
              note: ['대만 봐 달라고 했다. 아이와 놀 시간은 없다고. 문간의 아이가 고개를 집어넣었다.', "I said I only wanted the rod looked at — no time to play with a kid. The boy in the doorway ducked out of sight."] }),
          opt('not_yet', '아직은 아버지 대를 남의 손에 맡길 마음이 안 섭니다.', "I'm not ready to put my father's rod in someone else's hands yet.",
            { stance: 'self', aff: { [M]: -0.02 }, end: endTalk({ decline: true,
              lineKo: '(대를 두 손으로 돌려준다.) …그것도 대를 아끼는 거다. 마음 서면 와라.',
              lineEn: "(He hands the rod back with both hands.) ...That's caring for a rod too. Come when you're ready." }),
              note: ['아직 아버지 대를 남의 손에 맡길 마음이 서지 않았다. 탁만수 씨는 그것도 대를 아끼는 거라며 대를 돌려주었다.', "I wasn't ready to hand my father's rod to someone else. Tak Mansu said that was caring for a rod too, and gave it back."] }),
        ],
        note: ['죽간 공방에 아버지의 릴대를 들고 갔다. 탁만수 씨는 마디를 짚어 보다 한 마디에서 손을 멈추고, 하루는 걸린다고 했다. 그동안 손자 새벽이와 학꽁치나 낚으라고, 애가 내기를 좋아한다고 했다.',
          "I took my father's reel rod to the bamboo-rod workshop. Tak Mansu felt along the sections, paused at one, and said it would take a day. Meanwhile I should catch halfbeak with his grandson Saebyeok — the boy likes a wager."],
      }),
      entrust: scene([
        line(M, '오래 쥔 손이 쓰던 대다. 거칠게 다룬 대는 아니야.', 'A rod used by a hand that held it a long time. Not one that was treated roughly.', { act: 'peer' }),
        line(P, '아버지가 아끼셨어요.', 'My father took good care of it.'),
        line('', '(노인이 대를 벽에 세운다. 다른 대들 틈이 아니라 따로.)', '(The old man stands it against the wall. Apart from the others, not among them.)'),
        line(M, '맡긴 건 맡긴 거다. 이제 내 일이야.', "What's left with me is mine to look after now."),
        line(M, '너는 저 애 상대나 해 줘. 문간에서 아까부터 기다린다.', "You keep that boy company. He's been waiting in the doorway all this time."),
      ], {
        choices: [
          opt('to_kid', '새벽아, 내기하자고? 무슨 내기인지 들어 볼게.', "Saebyeok, you want a bet? Let's hear what kind.",
            { stance: 'mid', aff: { [S]: 0.02 }, next: 'bet' }),
          opt('watch', '옆에서 대 보시는 걸 지켜봐도 되겠습니까?', 'May I stay and watch you look at the rod?',
            { stance: 'giver', end: endTalk({ accept: true, offer: 'fathers_rod',
              lineKo: '기웃거리면 더 걸린다. 대는 사람 눈치를 본다. (문간 쪽으로 턱짓을 한다.) 나가 봐라. 저 애가 기다린다.',
              lineEn: "Hover and it takes longer. A rod feels eyes on it. (He jerks his chin at the doorway.) Go on out. The boy's waiting." }),
              note: ['옆에서 지켜봐도 되느냐고 물었더니, 기웃거리면 더 걸린다고 했다. 대는 사람 눈치를 본다고.', 'When I asked to stay and watch, he said hovering makes it take longer — a rod feels eyes on it.'] }),
          opt('ask_damage', '많이 상했습니까? 다시 쓸 수는 있겠습니까?', 'Is it badly damaged? Will I be able to use it again?',
            { stance: 'mid', next: 'damage' }),
        ],
        note: ['탁만수 씨는 손잡이의 닳은 자리를 오래 쓸어 보고, 오래 쥔 손이 쓰던 대라고 했다. 내 대를 다른 대들 틈이 아니라 따로 세워 두었다.', "Tak Mansu ran his thumb over the worn grip for a long while — a rod used by a hand that held it long, he said. He stood it apart from the others."],
      }),
      damage: scene([
        line(M, '봐야 안다. 대는 겉이 멀쩡해도 속에서 운다.', "Can't tell till I look. A rod can look fine outside and still cry inside."),
        line('', '(마디 하나에 손톱을 대고 톡 쳐 본다. 표정이 잠깐 굳는다.)', '(He taps one section with a fingernail. His face stiffens for a moment.)'),
        line(P, '…어디가 안 좋은가요?', '...Is something wrong with it?'),
        line(M, '버릴 대는 아니다. 그건 지금도 안다.', "It's not a rod to throw away. That much I know already."),
        line(M, '나머지는 시간을 줘. 대가 오래 산 만큼 보는 데도 시간이 걸린다.', 'Give me time for the rest. The longer a rod has lived, the longer it takes to read.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_damage', lineKo: '그동안 방파제에 가 있어. 저 애가 기다린다.', lineEn: "Go to the breakwater meanwhile. The boy's waiting." }),
        note: ['많이 상했느냐고 물었다. 탁만수 씨는 마디 하나를 톡 쳐 보고 잠깐 굳더니, 버릴 대는 아니라고 했다. 나머지는 시간을 달라고.', "I asked how bad the damage was. Tak Mansu tapped one section and his face stiffened, but he said it wasn't a rod to throw away. The rest would take time."],
      }),
      bet: scene([
        line('', '(아이가 낚싯대 두 대를 들고 뛰어든다.)', '(The boy bursts in carrying two rods.)'),
        line(S, '내기하자! 방파제에서 학꽁치 먼저 올리는 사람이 이기는 거야.', "Let's bet! Whoever lands a halfbeak first off the breakwater wins."),
        line(P, '내가 지면?', 'And if I lose?'),
        line(S, '내가 이기면, 아까 그 대에서 들은 소리는 안 알려 줄 거야. 할아버지보다 내가 먼저 들었거든.', "If I win, I won't tell you the sound I heard in that rod just now. I heard it before Grandpa did."),
        line('', '(뒤에서 노인이 헛기침을 한다.)', '(Behind him, the old man clears his throat.)'),
      ], {
        choices: [
          opt('deal', '좋아. 대신 봐주는 거 없다.', 'Deal. But no going easy on each other.',
            { stance: 'other', aff: { [S]: 0.03 }, end: endTalk({ accept: true, offer: 'ask_saebyeok',
              lineKo: '(아이가 앞장서 뛰어나간다. 노인이 그 뒷모습을 잠깐 본다.) 늦게 가면 진 거다. 그 애 규칙이야.',
              lineEn: "(The boy runs out ahead. The old man watches his back for a moment.) Whoever's late has lost. His rule." }),
              note: ['새벽이의 내기를 받았다. 봐주는 건 없기로.', "I took Saebyeok's bet. No going easy on each other."] }),
          opt('what_sound', '내 대에서 무슨 소리가 났는데?', 'What sound did you hear in my rod?',
            { stance: 'mid', next: 'secret' }),
          opt('easy_win', '열두 살한테 질 리가 있나. 금방 끝내 줄게.', "Lose to a twelve-year-old? I'll have this wrapped up in no time.",
            { stance: 'self', aff: { [S]: -0.03 }, flags: ['choice.n02_boasted'], end: endTalk({ accept: true, offer: 'bet_kid',
              lineKo: '(코로 짧게 웃는다.) 그 말, 방파제에서 한 번 더 해 봐라. 그 애는 방파제에서 컸다.',
              lineEn: '(He laughs once, shortly, through his nose.) Say that again on the breakwater. That boy grew up on it.' }),
              note: ['열두 살한테 질 리가 없다고 큰소리를 쳤다. 탁만수 씨가 코로 짧게 웃었다.', 'I boasted I could never lose to a twelve-year-old. Tak Mansu gave a short laugh through his nose.'] }),
        ],
        note: ['새벽이가 낚싯대 두 대를 들고 뛰어들어 학꽁치 내기를 걸었다. 먼저 올리는 쪽이 이기고, 자기가 이기면 내 대에서 들은 소리는 안 알려 주겠다고 했다.', "Saebyeok burst in with two rods and challenged me to a halfbeak bet. First to land one wins — and if he won, he wouldn't tell me the sound he'd heard in my rod."],
      }),
      secret: scene([
        line(S, '비밀! 이기면 알려 줄게.', "Secret! I'll tell you if you win."),
        line(S, '할아버지도 아직 말 안 한 거야.', "Grandpa hasn't said it yet either.", { act: 'look_away' }),
        line(P, '그럼 꼭 이겨야겠네.', "Then I'll have to win."),
        line(S, '궁금하면 나한테 이겨. 학꽁치는 물 위에 떠서 다녀. 그것도 모르면 질걸.', "If you want to know, beat me. Halfbeak swim right near the surface. If you don't even know that, you'll lose."),
      ], {
        choices: [
          opt('fine_go', '좋아. 물 위에 떠서 다닌다, 기억해 둘게.', "All right. Up near the surface. I'll remember.",
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ accept: true, offer: 'bet_kid',
              lineKo: '(대답 대신 대를 손톱으로 톡 쳐 본다. 탁한 소리가 한 번 난다.) …가 봐라. 저 애한테 지지 말고.',
              lineEn: "(Instead of answering he taps the rod with a fingernail. It gives one dull sound.) ...Off you go. Don't lose to him." }) }),
          opt('ask_grandpa', '탁만수 씨, 무슨 소리인지 먼저 알려 주시면 안 됩니까?', "Mansu, couldn't you tell me what the sound is first?",
            { stance: 'giver', aff: { [S]: -0.02 }, end: endTalk({ accept: true,
              lineKo: '내기는 그 애 거다. 내가 끼면 그 애가 진다. (아이가 혀를 쏙 내밀고 뛰어나간다.) 가서 이겨 봐라.',
              lineEn: "The bet's his. If I butt in, he loses it. (The boy sticks his tongue out and runs off.) Go and win it." }) }),
        ],
        note: ['무슨 소리냐고 물었더니 새벽이는 비밀이라고, 이기면 알려 주겠다고 했다. 학꽁치는 물 위에 떠서 다닌다는 것까지 일러 주었다.', "When I asked what the sound was, Saebyeok said it was a secret — win, and he'd tell me. He did let slip that halfbeak swim near the surface."],
      }),
      rod_only: scene([
        line('', '(문간의 아이가 고개를 쑥 집어넣는다.)', '(The boy in the doorway ducks out of sight.)'),
        line(M, '…대 보는 데 하루 걸린다. 그 하루를 어디서 보낼지는 네 마음이다.', '...Looking at a rod takes a day. Where you spend that day is up to you.'),
        line(P, '…', '...'),
        line(M, '다만 그 애는 대를 나보다 먼저 듣는다. 네 대에서 나는 소리도 벌써 들었을 거다.', "But that boy hears a rod before I do. He'll have heard the sound in yours already."),
        line(P, '소리요?', 'A sound?'),
        line(M, '궁금하면 방파제로 가.', 'If you want to know, go to the breakwater.'),
      ], {
        choices: [
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
        ],
        note: ['탁만수 씨는 하루를 어디서 보낼지는 내 마음이라고 했다. 다만 새벽이는 대를 자기보다 먼저 듣는다며, 내 대에서 나는 소리도 벌써 들었을 거라고.', "Tak Mansu said where I spent the day was up to me. But Saebyeok hears a rod before he does — he'd have heard the sound in mine already."],
      }),
    },
  },

  // N02-1 — 진행 중: 새벽과 내기(목표 1). 첫 마리는 새벽이 먼저 — 진짜 승부는 길이. 공방 창가에서 할아버지가 본다
  {
    id: 'n02_1_bet', questId: 'N02-1', at: 'objective', objectiveIndex: 1, npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '늦었어! 첫 마리는 내가 먼저 올렸어.', "You're late! I landed the first one.", { act: 'look_up' }),
        line(P, '벌써? 그럼 내가 진 거야?', 'Already? So I lost?'),
        line(S, '근데 할아버지가 한 판 더 하래. 먼저 올린 건 운일 수도 있대.', 'But Grandpa says go another round. Landing first might just be luck, he says.'),
        line(S, '그러니까 진짜 승부는 길이야. 둘 다 이 자에 대 보자. 더 긴 쪽이 이기는 거야.', "So the real contest is length. Let's both lay ours on this ruler. Longest one wins."),
        line('', '(새벽이가 방파제 바닥에 자를 쫙 편다.)', '(Saebyeok spreads a ruler flat on the breakwater.)'),
      ], {
        choices: [
          opt('measure', '좋아. 자에 나란히 대 보자.', "Fine. Let's lay them side by side.",
            { stance: 'mid', next: 'ruler' }),
          opt('ate_words', '질 리 없다고 큰소리친 건 취소할게. 첫 마리는 네가 이겼어.', 'I take back the big talk about not losing. You won the first one.',
            { stance: 'self', aff: { [S]: 0.03, [M]: 0.01 }, requires: { flag: 'choice.n02_boasted' }, next: 'ate_words',
              note: ['질 리 없다던 큰소리를 거두었다. 첫 마리는 새벽이가 이긴 게 맞았다.', "I took back my boast. Saebyeok had fairly won the first round."] }),
        ],
        note: ['방파제 끝에서 새벽이가 첫 마리는 자기가 먼저 올렸다고 했다. 할아버지가 한 판 더 하라고 했다며, 진짜 승부는 자에 대 보는 길이라고.', "At the end of the breakwater Saebyeok said he'd landed the first one. His grandpa wanted another round, so the real contest would be length, on the ruler."],
      }),
      ate_words: scene([
        act(S, 'laugh'),
        line(S, '아까 공방에서 질 리 없다고 했지? 할아버지가 그런 말은 꼭 기억해 둔대. 방파제에서 다시 해 보라고.', "Back at the workshop you said you couldn't lose, right? Grandpa says he always remembers talk like that. He said to try it again out here."),
        line(P, '…들으셨구나.', '...He heard that.'),
        line(S, '그래도 길이는 재야지. 첫 마리는 첫 마리고, 길이는 길이야. 자, 대 봐.', "We still have to measure, though. The first one's the first one, and length is length. Come on, lay it down."),
      ], {
        choices: [
          opt('measure_too', '그래, 재 보자. 이번엔 큰소리 안 칠게.', "All right, let's measure. No big talk this time.",
            { stance: 'mid', next: 'ruler' }),
        ],
      }),
      ruler: scene([
        line('', '(두 마리를 자 위에 나란히 눕힌다. 내 것이 손가락 한 마디쯤 길다.)', '(I lay the two fish side by side on the ruler. Mine is longer by about a finger joint.)'),
        line(S, '…', '...', { act: 'peer' }),
        line('', '(공방 창가에 노인이 서 있다. 대를 손에 든 채 이쪽을 보고 있다.)', '(The old man is standing at the workshop window, a rod in his hand, watching us.)'),
        line(P, '(…보고 계시네.)', "(...He's watching.)"),
      ], {
        choices: [
          opt('fair', '자는 거짓말 안 하지. 내 게 한 마디 길다.', "A ruler doesn't lie. Mine's a joint longer.",
            { stance: 'mid', aff: { [S]: 0.02, [M]: 0.03 }, flags: ['choice.n02_fair_bet'], next: 'fair_win',
              note: ['자대로 말했다. 내 학꽁치가 한 마디 길었다.', 'I went by the ruler. My halfbeak was a joint longer.'] }),
          opt('fold_tail', '(내 학꽁치 꼬리를 슬쩍 접어 다시 잰다.)', "(I quietly fold my halfbeak's tail and measure again.)",
            { stance: 'other', aff: { [S]: 0.03, [M]: -0.03 }, next: 'folded',
              note: ['져 주려고 내 학꽁치 꼬리를 슬쩍 접었다.', "To let him win, I quietly folded my halfbeak's tail."] }),
          opt('tease', '봤지? 열두 살이 어른 이기기엔 아직 이르다.', 'See that? Twelve is a bit young to beat a grown-up.',
            { stance: 'self', aff: { [S]: -0.04, [M]: 0.02 }, next: 'teased' }),
        ],
        note: ['두 마리를 자 위에 나란히 눕혔다. 내 것이 한 마디쯤 길었다. 공방 창가에서 노인이 지켜보고 있었다.', 'We laid the two fish on the ruler. Mine was about a joint longer. The old man was watching from the workshop window.'],
      }),
      fair_win: scene([
        line(S, '…한 마디.', '...One joint.'),
        act(S, 'silence'),
        line(S, '알았어. 졌어. 진 건 진 거야.', 'Okay. I lost. A loss is a loss.'),
        line(P, '한 마디 차이였어. 아깝게.', 'It was only one joint. Close.'),
        line(S, '약속이니까 알려 줄게. 그 대, 셋째 마디가 탁하게 울어. 다른 마디는 맑은데 거기만.', "A promise is a promise, so I'll tell you. In that rod, the third section rings dull. The others ring clear, just not that one."),
        line(S, '할아버지도 들었을 거야. 말을 안 할 뿐이지.', "Grandpa will have heard it too. He just doesn't say."),
      ], {
        choices: [
          opt('good_ears', '그걸 소리로 알아? 네 할아버지보다 귀가 좋은데?', "You can tell that by sound? Your ears are better than your grandpa's!",
            { stance: 'other', aff: { [S]: 0.03, [M]: -0.01 }, end: endTalk({
              lineKo: '(어깨를 으쓱하다가 공방 창을 힐끔 본다.) 쉿! 할아버지 귀도 좋단 말이야. 다 들려.',
              lineEn: "(He shrugs, then glances at the workshop window.) Shh! Grandpa's ears are good too. He hears everything." }) }),
          opt('what_dull', '탁하게 운다는 게 무슨 뜻이야?', 'What does it mean, ringing dull?',
            { stance: 'mid', end: endTalk({
              lineKo: '속에 금이 갔거나, 오래 휘어 있던 데래. 할아버지가 가르쳐 줬어. (자를 둘둘 만다.) 나머지는 할아버지한테 들어. 그건 할아버지 일이야.',
              lineEn: "It means there's a crack inside, or it stayed bent a long time. Grandpa taught me. (He rolls up the ruler.) Hear the rest from Grandpa. That part's his job." }) }),
          opt('grandpa_first', '네 할아버지한테 먼저 여쭤볼게. 대 보시는 분이 말씀하셔야지.', "I'll ask your grandpa first. It should come from the one checking the rod.",
            { stance: 'giver', aff: { [S]: -0.02, [M]: 0.02 }, end: endTalk({
              lineKo: '(입을 삐죽인다.) 치. 할아버지는 말 안 해 줄걸. 대한테만 말하니까. …그래도 셋째 마디야. 잊지 마.',
              lineEn: "(He pouts.) Huh. Grandpa won't tell you. He only talks to rods. ...But it's the third section. Don't forget." }) }),
        ],
        note: ['새벽이는 입술을 깨물었지만 울지 않았다. 진 건 진 거라며, 약속대로 내 대의 셋째 마디가 탁하게 운다고 알려 주었다.', "Saebyeok bit his lip but didn't cry. A loss is a loss, he said, and as promised he told me the third section of my rod rings dull."],
      }),
      folded: scene([
        line(S, '내가 이겼다! 봤지? 내 게 더…', "I won! See? Mine's longer...", { act: 'look_up' }),
        line('', '(공방 창가에서 헛기침 소리가 크게 난다.)', '(A loud cough comes from the workshop window.)'),
        line(S, '…', '...', { act: 'peer' }),
        line(S, '방금 꼬리 접었어?', 'Did you just fold the tail?'),
      ], {
        choices: [
          opt('confess', '…응. 미안. 봐줬어.', '...Yeah. Sorry. I let you win.',
            { stance: 'mid', aff: { [S]: -0.03, [M]: 0.03 }, next: 'confessed' }),
          opt('deny', '아니야. 네 게 더 길어. 네가 이긴 거야.', 'No. Yours is longer. You won.',
            { stance: 'other', aff: { [S]: 0.02, [M]: -0.04 }, flags: ['choice.n02_lied_bet'], end: endTalk({
              lineKo: '(공방 창이 탁 닫힌다. 새벽이는 그 소리를 못 들은 척한다.) …그치? 내가 이긴 거지? 할아버지한테도 꼭 그렇게 말해.',
              lineEn: '(The workshop window bangs shut. Saebyeok pretends not to hear it.) ...Right? I won, didn\'t I? Tell Grandpa that too, okay?' }),
              note: ['끝까지 아니라고 했다. 공방 창이 탁 닫혔다.', 'I kept denying it. The workshop window banged shut.'] }),
        ],
        note: ['새벽이가 이겼다고 펄쩍 뛰다가, 공방 창가의 헛기침 소리에 멈칫하고 내 학꽁치 꼬리를 내려다보았다.', "Saebyeok leapt up crying victory — then a cough from the workshop window stopped him, and he looked down at my halfbeak's tail."],
      }),
      confessed: scene([
        line(S, '봐주는 거 제일 싫어!', 'I hate being let off!'),
        line(S, '할아버지가 그랬어. 봐주는 건 대한테도 사람한테도 거짓말이래.', 'Grandpa says letting someone win is lying, to a rod or to a person.'),
        line(P, '…미안. 다시 재 보자.', "...Sorry. Let's measure again."),
        line('', '(새벽이가 꼬리를 손가락으로 펴서 다시 댄다. 내 것이 한 마디 길다.)', '(Saebyeok straightens the tail with a finger and measures again. Mine is a joint longer.)'),
        line(S, '…졌네. 이제야 진짜로 졌어.', "...I lost. Now I've really lost."),
        line(S, '약속이니까 알려 줄게. 그 대, 셋째 마디가 탁하게 울어.', "A promise is a promise, so I'll tell you. In that rod, the third section rings dull."),
      ], {
        choices: [
          opt('no_more', '다시는 안 봐줄게. 약속해.', "I'll never let you win again. Promise.",
            { stance: 'mid', aff: { [S]: 0.03 }, flags: ['choice.n02_fair_bet'], end: endTalk({
              lineKo: '(새끼손가락을 내민다.) 약속! 다음엔 내가 진짜로 이길 거야. 할아버지가 대 다 보면 또 하자.',
              lineEn: "(He holds out his little finger.) Promise! Next time I'll win for real. Once Grandpa's done with the rod, let's go again." }) }),
        ],
        note: ['봐줬다고 털어놓았다. 새벽이는 봐주는 게 제일 싫다고, 할아버지가 그건 거짓말이라고 했다며 다시 재 보았다. 진짜로 지고 나서야 셋째 마디 이야기를 해 주었다.', "I admitted I'd let him win. Saebyeok said he hated that — his grandpa calls it lying — and measured again. Only after really losing did he tell me about the third section."],
      }),
      teased: scene([
        line(S, '한 마디 가지고! 첫 마리는 내가 먼저였거든!', 'Over one joint! I landed the first one, you know!'),
        line(P, '길이는 길이라며.', 'You said length is length.'),
        line(S, '두고 봐. 못 올리는 거 내가 올릴 거야. 훨씬 큰 거.', "Just watch. I'll land something you can't. Something way bigger."),
        line('', '(공방 창가에서 노인이 웃는 것 같다.)', '(At the workshop window, the old man seems to be smiling.)'),
      ], {
        choices: [
          opt('take_back', '농담이야. 첫 마리는 네가 이긴 거 맞아.', "I'm joking. You did win the first one.",
            { stance: 'mid', aff: { [S]: 0.03 }, end: endTalk({
              lineKo: '(입을 삐죽거리다 결국 웃는다.) …그럼 일 대 일이야. 비겼으니까 반만 알려 줄게. 그 대, 마디 하나가 이상해. 어느 마디인지는 다음 판에.',
              lineEn: "(He pouts, then laughs in the end.) ...Then it's one each. A draw, so I'll only tell you half. One section in that rod sounds wrong. Which one, you'll find out next round." }) }),
          opt('prove_it', '그래, 기대할게. 올리면 그때 인정해 주지.', "Sure, I'll look forward to it. Land it, and then I'll admit it.",
            { stance: 'self', aff: { [S]: -0.02, [M]: 0.02 }, end: endTalk({
              lineKo: '올릴 거야! 사람 키만 한 거! (발을 쾅 구르고 뛰어간다. 창가의 노인이 고개를 한 번 끄덕인다.) 할아버지, 봤지? 봤지!',
              lineEn: 'I will! One as tall as a person! (He stamps his foot and runs off. At the window the old man nods once.) Grandpa, did you see? Did you!' }) }),
        ],
        note: ['열두 살이 어른을 이기기엔 이르다고 놀렸다. 새벽이는 얼굴이 빨개져서, 훨씬 큰 걸 올리겠다고 했다.', 'I teased him that twelve was too young to beat a grown-up. Saebyeok went red and swore he would land something far bigger.'],
      }),
    },
  },

  // 290차 — N02-1 끝내는 자리(탁만수). 대는 살아 있다 · 마디 하나가 운다
  {
    id: 'n02_1_done', questId: 'N02-1', at: 'complete', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '왔냐.', "You're back.", { act: 'look_up' }),
        line(P, '네. 대는 어떤가요?', 'Yes. How is the rod?'),
        line(M, '대는 살아 있다.', 'The rod is alive.'),
        line(P, '다행이다…', 'Thank goodness...'),
        line(M, '마디 하나가 울고 있지만, 아직은 던질 수 있어.', 'One section is crying, but it can still be cast.'),
        line(P, '울고 있다는 게 무슨 뜻이에요?', 'What do you mean, crying?'),
        line(M, '두드리면 소리가 탁하다. 속이 아프다는 거지.', "Tap it and the sound is dull. It's hurting inside."),
        line(M, '새벽이한테 졌으면 그 애 말 잘 들어. 나보다 눈이 좋아.', 'If you lost to Saebyeok, listen to him. His eyes are better than mine.'),
      ], {
        choices: [
          opt('lesson', '대 고치는 법을 알려 주십시오', 'Teach me how to mend a rod', {
            end: endTalk({ complete: 'lesson', lineKo: '보는 눈부터다. 이리 와. 마디를 손끝으로 두드려 봐라. 울리는 마디와 죽은 마디가 다르다.',
              lineEn: 'The eye comes first. Come here. Tap the sections with your fingertip. A ringing section and a dead one sound different.' }),
            note: ['대 고치는 법을 청했다. 탁만수 씨는 보는 눈부터라며, 마디를 두드려 울리는 마디와 죽은 마디의 소리를 듣게 했다.', 'I asked him to teach me to mend a rod. The eye comes first, Tak Mansu said, and had me tap the sections to hear a live one from a dead one.'] }),
          opt('take_rod', '남는 대가 있으면 하나 주십시오', 'If you have a spare rod, may I have one?', {
            say: ['남는 대가 있으면 하나 주십시오. 구멍치기용으로요.', 'If you have a spare rod, may I have one? For hole fishing.'], next: 'take_rod' }),
          opt('pay', '품삯으로 주십시오', "I'll take it as wages", {
            end: endTalk({ complete: 'pay', lineKo: '그러지. 노인 심부름값이다. 돈은 돈이고 대는 대다. 섞으면 둘 다 흐려진다. 그 대, 바다에서 많이 써라. 쓰는 대가 오래 산다.',
              lineEn: "Fine. An old man's errand money. Money is money and a rod is a rod. Mix them and both go cloudy. Use that rod a lot at sea. A rod that's used lives long." }),
            note: ['품삯을 받았다. 돈 세는 손이 대를 만지던 손과 달랐다.', 'I took wages. The hand counting money was not the hand that touched the rod.'] }),
          opt('no_fee', '대를 봐 주신 걸로 됐습니다', 'Looking at the rod was enough', {
            say: ['대를 봐 주신 걸로 됐습니다. 심부름값은 넣어 두세요.', "Looking at the rod is enough. Keep the errand money."], aff: { [S]: 0.02 },
            end: endTalk({ complete: 'no_fee', lineKo: '…그런 말은 대가 다 나은 다음에 해라. 아직 하나 울고 있다. 지나가다 들러. 그 대 소리 한 번 더 들어 보자. 새벽이도 네가 또 오면 좋아할 거다.',
              lineEn: "...Say that once the rod's fully mended. One section's still crying. Drop in when you pass. We'll listen to that rod once more. Saebyeok will be glad to see you again too." }),
            note: ['심부름값은 사양했다. 탁만수 씨는 꺼내던 돈을 도로 넣으며, 지나가다 들러 그 대 소리를 한 번 더 들어 보자고 했다.', 'I declined the money. Tak Mansu put it back and said to drop in again — we would listen to that rod once more.'] }),
        ],
        note: ['탁만수 씨가 대는 살아 있다고 했다. 마디 하나가 울고 있지만 아직은 던질 수 있다고. 새벽이한테 졌으면 그 애 말을 잘 들으라고, 자기보다 눈이 좋다고 했다.', "Tak Mansu said the rod was alive. One section was crying, but it could still be cast. If I'd lost to Saebyeok, I should listen to him — his eyes are better."],
      }),
      take_rod: scene([
        line(M, '싼 거다. 그래도 대는 대야.', "It's a cheap one. Still, a rod is a rod."),
        act(M, 'give', { to: P, item: 'inv_rod_budget' }),
        line(P, '감사합니다.', 'Thank you.', { act: 'receive' }),
        line(M, '구멍치기는 짧은 대가 낫다. 테트라포드 틈에 넣고 줄만 내리면 돼.', 'For hole fishing a short rod is better. Slip it into the gaps in the tetrapods and just drop the line.'),
      ], {
        end: endTalk({ complete: 'take_rod', lineKo: '고기 무게는 손목으로 느껴라. 비싼 대보다 그게 먼저다. 부러지면 가져와.',
          lineEn: "Feel the weight of the fish in your wrist. That comes before any expensive rod. If it breaks, bring it back." }),
        note: ['구멍치기용 짧은 대를 하나 얻었다. 테트라포드 틈에 넣고 줄만 내리면 된다고, 고기 무게는 손목으로 느끼라고 했다.', 'I was given a short rod for hole fishing. Slip it between the tetrapods and drop the line, he said, and feel the fish in your wrist.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N02-5 「대를 고르는 눈」 받는 자리(탁만수). 벽에 대나무 셋
  // ═══════════════════════════════════════════
  {
    id: 'n02_5_offer', questId: 'N02-5', at: 'offer', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '왔냐. 벽 봐라.', "You're here. Look at the wall."),
        line('', '(공방 벽에 대나무 세 대가 세워져 있다. 굵은 것, 색이 고운 것, 그리고 볼품없는 것.)', '(Three bamboo culms stand against the workshop wall. A thick one, a finely coloured one, and a plain one.)'),
        line(P, '대나무 세 대네요.', 'Three culms.'),
        line(M, '쓸 만한 거 하나 골라 봐. 이유도 말하고.', 'Pick the one worth using. And tell me why.'),
        line(P, '지금 바로요?', 'Right now?'),
        line(M, '급할 거 없다. 갯가에 떠밀려 온 대나무 토막도 두어 개 주워 와.', 'No hurry. Pick up two or so bamboo pieces washed up on the shore too.'),
        line(M, '비교할 게 있어야 눈이 생긴다.', "You need something to compare before you get an eye for it."),
      ], {
        choices: [
          opt('with_reason', '이유까지 말씀드릴 수 있게 골라 볼게요', "I'll choose so I can give you my reason", {
            say: ['골라 보겠습니다. 이유까지 말씀드릴 수 있게요.', "I'll choose. In a way I can explain."], next: 'reason' }),
          opt('ask_hint', '뭘 보고 고르면 됩니까?', 'What should I look at?', {
            say: ['뭘 보고 고르면 됩니까? 두께요, 색이요?', 'What should I look at? Thickness? Colour?'], next: 'hint' }),
          opt('all_same', '솔직히 다 똑같아 보이는데요', 'Honestly, they all look the same', {
            say: ['솔직히 대나무는 다 똑같아 보이는데요.', 'Honestly, bamboo all looks the same to me.'], next: 'same' }),
          opt('pricey_one', '제일 비싸 보이는 걸 고르면 되지 않습니까?', "Can't I just pick the priciest-looking one?", {
            next: 'pricey' }),
        ],
        note: ['공방 벽에 대나무 세 대가 서 있었다. 굵은 것, 고운 것, 볼품없는 것. 탁만수 씨는 쓸 만한 것을 이유와 함께 고르라고 했다. 그 전에 갯가에 밀려온 대나무 토막을 두어 개 주워 오라고.',
          "Three culms stood against the workshop wall: thick, finely coloured, and plain. Tak Mansu told me to pick the one worth using, with a reason — and first to collect two bamboo pieces washed up on the shore."],
      }),
      reason: scene([
        line(M, '이유 없이 고른 건 고른 게 아니다. 찍은 거지.', "Picking without a reason isn't picking. It's guessing."),
        line('', '(노인이 뒷짐을 진다.)', '(The old man clasps his hands behind his back.)'),
        line(P, '명심할게요.', "I'll keep that in mind."),
      ], {
        end: endTalk({ accept: true, offer: 'with_reason', lineKo: '다 보고 와서 말해.', lineEn: 'Come back and tell me once you have looked at everything.' }),
        note: ['이유를 댈 수 있게 고르겠다고 했다. 이유 없이 고른 건 찍은 거라고 했다.', "I said I'd choose so I could explain. Picking without a reason is guessing, he said."],
      }),
      hint: scene([
        act(M, 'laugh'),
        line(M, '그걸 알려 주면 내가 고르는 거지.', "Tell you that and I'd be the one choosing."),
        line(P, '하나만이라도요.', 'Just one hint, then.'),
        line(M, '…하나만 말해 주마. 눈으로 고르는 게 아니다. 만져 봐.', "...One, then. You don't choose with your eyes. Touch them."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_hint', lineKo: '손바닥이 먼저 안다. 그다음은 네가 찾아.', lineEn: 'Your palm knows first. The rest you find yourself.' }),
        note: ['뭘 보고 고르느냐고 물었더니, 탁만수 씨는 코웃음을 치고 하나만 일러 주었다. 눈으로 고르지 말고 만져 보라고. 손바닥이 먼저 안다고.', 'When I asked what to look at, Tak Mansu snorted and gave me one hint: don\'t choose with your eyes, touch them. Your palm knows first.'],
      }),
      same: scene([
        line(M, '그래서 시키는 거다.', "That's why I'm making you do it."),
        line('', '(벽에 세운 세 대를 손바닥으로 한 번씩 쓸어 본다.)', '(He runs his palm once down each of the three culms.)'),
        line(M, '다 똑같아 보이는 놈이 하나를 골라내면, 그게 눈이야.', "When someone who sees them all as the same picks one out, that's an eye."),
        line(P, '처음부터 다르게 보이셨어요?', 'Did they look different to you from the start?'),
        line(M, '오십 년 전엔 나도 다 똑같아 보였다.', 'Fifty years ago they all looked the same to me too.'),
      ], {
        end: endTalk({ accept: true, offer: 'all_same', lineKo: '다른 게 보일 때까지 만져. 그게 공부다.', lineEn: 'Touch them until you see a difference. That is the study.' }),
        note: ['다 똑같아 보인다고 털어놓았다. 탁만수 씨는 그래서 시키는 거라며, 오십 년 전엔 자기도 그랬다고 했다.', 'I admitted they all looked the same. That was the point, Tak Mansu said — fifty years ago, they did to him too.'],
      }),
      pricey: scene([
        line('', '(대답 대신 굵은 대를 손가락으로 툭 친다. 둔한 소리가 난다.)', '(Instead of answering he flicks the thick culm with a finger. It gives a dull sound.)'),
        line(M, '비싸 보이는 거랑 쓸 만한 거는 다르다.', 'Looking expensive and being worth using are different things.'),
        line(P, '…소리가 둔하네요.', '...That sounded dull.'),
        line(M, '그렇게 고를 거면 직판장 가서 새 대를 사. 여기선 손으로 고른다.', "If that's how you'll choose, go buy a new rod at the market. Here we choose by hand."),
      ], {
        end: endTalk({ accept: true, offer: 'pricey_one', lineKo: '다시 만져 봐.', lineEn: 'Touch them again.' }),
        note: ['제일 비싸 보이는 걸 고르면 되느냐고 했다가, 굵은 대가 둔하게 우는 소리를 들었다. 여기선 손으로 고른다고 했다.', 'I asked if I could just pick the priciest-looking one — and heard the thick culm ring dull. Here, he said, you choose by hand.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N02-5 「대를 고르는 눈」 — 진행 중: 왜 그것인지 듣는다(목표 2). 새벽이는 아침에 고운 대(맑게 우는 대)를 골랐다
  // ═══════════════════════════════════════════
  {
    id: 'n02_5_why', questId: 'N02-5', at: 'objective', objectiveIndex: 2, npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '이걸 골랐다. 굵은 것도 고운 것도 두고.', 'You picked this one. Passed over the thick one and the pretty one.', { act: 'peer' }),
        line(P, '…네.', '...Yes.'),
        line(M, '새벽이는 아침에 저 고운 놈을 집었다. 두드리면 제일 맑게 운다고.', 'This morning Saebyeok took that pretty one. Says it rings clearest when you tap it.'),
        line('', '(노인이 마루 쪽으로 턱짓을 한다. 아이가 자는 척 누워 있다.)', '(The old man nods toward the porch. The boy is lying there pretending to sleep.)'),
        line(P, '(자는 척하는 거 맞지…?)', "(He's only pretending to sleep, isn't he...?)"),
        line(M, '너는 왜 이거냐.', 'Why this one, for you?'),
      ], {
        choices: [
          opt('nodes_even', '마디 간격이 고릅니다. 힘이 한쪽으로 몰리지 않을 것 같았습니다.', "The nodes are evenly spaced. I thought the force wouldn't bunch up on one side.",
            { stance: 'giver', aff: { [M]: 0.05, [S]: -0.02 }, next: 'nodes',
              note: ['마디 간격이 고르다고 답했다. 힘이 한쪽으로 몰리지 않을 것 같았다고.', 'I said the nodes were evenly spaced — the force would not bunch up on one side.'] }),
          opt('kid_sound', '새벽이가 고른 것도 쓸 데가 있지 않을까요? 맑게 우는 대인데요.', "Couldn't Saebyeok's pick be good for something too? It rings so clear.",
            { stance: 'other', aff: { [M]: -0.03, [S]: 0.05 }, flags: ['choice.n02_backed_kid_pick'], next: 'thin_wall',
              note: ['새벽이가 고른 고운 대 편을 들었다. 맑게 우는 대도 쓸 데가 있지 않겠느냐고.', "I took the side of Saebyeok's pretty culm — surely a clear-ringing one had its use."] }),
          opt('ask_kid', '새벽이한테도 왜 그걸 골랐는지 물어보셨습니까?', 'Did you ask Saebyeok why he chose that one?',
            { stance: 'mid', next: 'ask_kid' }),
          opt('just_luck', '솔직히 손에 잡히는 대로 골랐습니다.', 'Honestly, I just took whatever came to hand.',
            { stance: 'self', aff: { [M]: -0.03 }, next: 'luck' }),
        ],
        note: ['탁만수 씨가 내가 고른 볼품없는 대를 마디마다 짚어 내렸다. 새벽이는 아침에 맑게 우는 고운 대를 골랐다며, 나는 왜 이것이냐고 물었다. 아이는 마루에서 자는 척하고 있었다.',
          "Tak Mansu felt down the plain culm I'd chosen, node by node. Saebyeok had picked the pretty, clear-ringing one that morning, he said — so why this one, for me? The boy lay on the porch pretending to sleep."],
      }),
      nodes: scene([
        line(M, '그렇지. 대는 마디로 산다.', "That's it. A rod lives by its nodes.", { act: 'nod' }),
        line(M, '굵은 건 무겁고, 고운 건 겉만 곱다.', "The thick one's heavy, the pretty one's pretty only on the outside."),
        line(P, '그럼 맑게 우는 대는요?', 'And the one that rings clear?'),
        line('', '(노인이 마루 쪽으로 목소리를 조금 높인다.)', '(The old man raises his voice a little toward the porch.)'),
        line(M, '맑게 우는 건 벽이 얇아서다. 얇은 대는 소리는 좋아도, 큰 놈이 오면 거기서 꺾인다.', 'It rings clear because the wall is thin. A thin culm sounds good, but when something big comes on, that is where it snaps.'),
      ], {
        choices: [
          opt('tell_him', '새벽이한테도 그렇게 말씀해 주시지요.', 'You should tell Saebyeok that too.',
            { stance: 'giver', aff: { [M]: 0.02, [S]: -0.04 }, end: endTalk({
              lineKo: '(대답 대신 마루를 본다. 아이가 이불을 머리끝까지 끌어 올린다.) …내가 말 안 해도 저 애 귀가 다 들었다.',
              lineEn: "(Instead of answering he looks at the porch. The boy pulls the blanket up over his head.) ...I don't need to say it. Those ears of his heard everything." }) }),
          opt('kid_ear', '그래도 소리 듣는 귀는 새벽이가 대단하던데요.', "Still, Saebyeok's ear for sound is something else.",
            { stance: 'other', aff: { [S]: 0.03, [M]: -0.01 }, end: endTalk({
              lineKo: '…귀는 좋다. 그 귀로 마디도 들어야지. 소리만 들으면 반만 듣는 거다. (이불 속에서 아이가 꼼지락거린다.)',
              lineEn: '...His ears are good. He has to hear the nodes with them too. Hearing only the ring is hearing half. (Under the blanket, the boy wriggles.)' }) }),
        ],
        note: ['탁만수 씨가 처음으로 고개를 끄덕였다. 대는 마디로 산다고. 맑게 우는 건 벽이 얇아서고, 얇은 대는 큰 놈이 오면 꺾인다고 마루 쪽에 들리게 말했다.', 'For the first time Tak Mansu nodded. A rod lives by its nodes. A clear ring means a thin wall, and a thin culm snaps on a big fish — he said it loud enough for the porch to hear.'],
      }),
      thin_wall: scene([
        act(M, 'laugh'),
        line(M, '쓸 데야 있지. 얇은 대는 끝에나 쓴다. 몸통으로 쓰면 첫 놈에 꺾여.', "It's good for something, sure. A thin culm's only fit for the tip. Use it for the body and it snaps on the first fish."),
        line('', '(마루에서 아이가 벌떡 일어나 앉는다.)', '(On the porch, the boy sits bolt upright.)'),
        line(P, '…깨어 있었네요.', '...He was awake.'),
        line(M, '봐라. 편 들어 주니 자던 놈이 일어난다.', 'Look at that. Take his side and the sleeper wakes up.'),
      ], {
        choices: [
          opt('tip_then', '그럼 끝은 새벽이 것으로, 몸통은 이걸로 하면 되겠네요.', "Then use Saebyeok's for the tip and this one for the body.",
            { stance: 'mid', aff: { [S]: 0.02, [M]: 0.01 }, flags: ['choice.n02_two_poles'], end: endTalk({
              lineKo: '(한참 두 대를 번갈아 본다.) …대를 하나로 안 보고 둘로 보는구나. 그건 내가 새벽이 나이에 몰랐던 거다.',
              lineEn: "(He looks from one culm to the other for a long while.) ...You don't see a rod as one piece, you see it as two. That's something I didn't know at Saebyeok's age." }),
              note: ['끝은 새벽이 것으로, 몸통은 내 것으로 하자고 했다. 탁만수 씨는 대를 둘로 보는 눈이라며 오래 두 대를 번갈아 보았다.', "I suggested Saebyeok's for the tip and mine for the body. Tak Mansu looked between the two for a long time — an eye that sees a rod as two parts."] }),
          opt('stand_firm', '얇아도 쓸 만하면 대 아닙니까.', "If it's usable, it's a rod, thin or not. Isn't it?",
            { stance: 'other', aff: { [S]: 0.03, [M]: -0.03 }, end: endTalk({
              lineKo: '(대를 벽에 도로 세운다.) 너도 저 애도 아직 대가 부러지는 걸 못 봤지. 보면 안다.',
              lineEn: "(He stands the culm back against the wall.) Neither you nor he has seen a rod break yet. Once you have, you'll know." }) }),
          opt('yield', '말씀 듣고 보니 몸통으로는 무리겠습니다.', "Now that you put it that way, it wouldn't do for the body.",
            { stance: 'giver', aff: { [M]: 0.03, [S]: -0.03 }, end: endTalk({
              lineKo: '(고개를 끄덕인다.) 그래. 마루에 앉은 놈도 들었을 거다. 들었으면 됐다.',
              lineEn: '(He nods.) Right. The one sitting on the porch will have heard that too. If he heard, that\'s enough.' }) }),
        ],
        note: ['탁만수 씨는 코웃음을 치고 얇은 대는 끝에나 쓴다고 했다. 몸통으로 쓰면 첫 놈에 꺾인다고. 마루에서 새벽이가 벌떡 일어나 앉았다.', 'Tak Mansu snorted: a thin culm is only fit for the tip; use it for the body and it snaps on the first fish. On the porch, Saebyeok sat bolt upright.'],
      }),
      ask_kid: scene([
        line('', '(마루에서 아이가 벌떡 일어난다.)', '(The boy shoots up on the porch.)'),
        line(S, '물어보긴 뭘 물어봐! 맑다고 했더니 고개만 저었어!', "Asked? He didn't ask anything! I said it was clear and he just shook his head!"),
        line(P, '…자는 거 아니었구나.', "...So you weren't asleep."),
        line(S, '그 대가 제일 맑게 울었단 말이야. 맑으면 끝이 살아.', 'That one rang the clearest. If it rings clear, the tip is alive.'),
        line('', '(노인은 대꾸 없이 고운 대를 손톱으로 톡 친다. 맑고 가벼운 소리가 난다.)', '(Without a word the old man taps the pretty culm with a fingernail. It gives a clear, light sound.)'),
      ], {
        choices: [
          opt('both_right', '둘 다 맞는 것 같은데요. 몸통은 마디로, 끝은 소리로.', "I think you're both right. The body by its nodes, the tip by its sound.",
            { stance: 'mid', aff: { [M]: 0.01, [S]: 0.02 }, flags: ['choice.n02_two_poles'], end: endTalk({
              lineKo: '(두 사람을 번갈아 보다가 뒷짐을 진다.) …둘로 나눠 보는 눈이라. 그 눈은 나한테도 저 애한테도 없던 거다.',
              lineEn: '(He looks from one of us to the other, then clasps his hands behind his back.) ...An eye that sees it in two parts. Neither I nor the boy had that one.' }),
              note: ['둘 다 맞다고 했다. 몸통은 마디로, 끝은 소리로. 탁만수 씨는 둘로 나눠 보는 눈이라며 뒷짐을 졌다.', 'I said they were both right: the body by its nodes, the tip by its sound. Tak Mansu clasped his hands behind him — an eye that sees in two parts.'] }),
          opt('grandpa_right', '끝도 몸통에 붙어 있어야 살지. 네 할아버지 말씀이 맞아.', "A tip only lives if it's on a body. Your grandpa's right.",
            { stance: 'giver', aff: { [M]: 0.03, [S]: -0.03 }, end: endTalk({
              lineKo: '…들었냐. (아이는 대답 대신 마루에 도로 눕는다. 노인이 볼품없는 대를 내 손에 쥐여 준다.) 이건 네 거다.',
              lineEn: "...Hear that? (Instead of answering, the boy lies back down on the porch. The old man puts the plain culm in my hands.) This one's yours." }) }),
          opt('kid_right', '새벽이 귀가 맞을 수도 있지 않겠습니까.', "Couldn't Saebyeok's ear be the right one?",
            { stance: 'other', aff: { [S]: 0.04, [M]: -0.03 }, flags: ['choice.n02_backed_kid_pick'], end: endTalk({
              lineKo: '(대답 없이 고운 대를 벽에서 내려 마루 쪽에 세워 준다.) …저 애 대는 저 애가 정하겠지.',
              lineEn: '(Without answering, he takes the pretty culm down from the wall and stands it by the porch.) ...His rod is his to decide, I suppose.' }) }),
        ],
        note: ['새벽이에게도 물어봤느냐고 하자, 아이가 벌떡 일어나 맑다고 했더니 고개만 저었다고 따졌다. 맑으면 끝이 산다고. 노인은 대꾸 없이 고운 대를 톡 쳐 보였다.', "When I asked whether he'd asked Saebyeok, the boy shot up: he'd said it rang clear and got only a head-shake. A clear ring means a living tip. The old man silently tapped the pretty culm."],
      }),
      luck: scene([
        line(M, '손에 잡히는 대로라. 그럼 손이 고른 거다.', 'Whatever came to hand. Then your hand chose it.'),
        line(P, '손이요?', 'My hand?'),
        line(M, '손이 왜 그걸 잡았는지 다시 만져 봐.', 'Feel it again and find out why your hand took it.'),
        line('', '(노인이 볼품없는 대를 내 손에 쥐여 준다.)', '(The old man puts the plain culm into my hands.)'),
        line(M, '눈 감고. 마디를 세어 봐.', 'Eyes shut. Count the nodes.'),
      ], {
        choices: [
          opt('feel_nodes', '(눈을 감고 마디를 하나씩 짚어 본다.)', '(I close my eyes and feel the nodes one by one.)',
            { stance: 'mid', aff: { [M]: 0.03 }, end: endTalk({
              lineKo: '…고르지. 간격이. 네 손은 벌써 알았던 거다. 머리만 몰랐지.',
              lineEn: "...Even, aren't they. The spacing. Your hand already knew. Only your head didn't." }),
              note: ['눈을 감고 마디를 짚어 보니 간격이 고르다는 게 손에 잡혔다. 손은 벌써 알았고 머리만 몰랐던 거라고 했다.', 'Eyes shut, feeling the nodes, I found the spacing was even. My hand had known already, he said — only my head had not.'] }),
          opt('kid_better', '새벽이라면 소리로 바로 알았을 텐데요.', 'Saebyeok would have known straight away, by the sound.',
            { stance: 'other', aff: { [S]: 0.02, [M]: -0.02 }, end: endTalk({
              lineKo: '(마루 쪽을 본다.) 저 애는 소리만 듣고, 너는 손으로만 만졌다. 둘 다 반쪽이다. 반쪽 둘이면 대 하나는 되겠지.',
              lineEn: '(He looks toward the porch.) He only hears the ring, and you only felt it with your hand. Both of you are half. Two halves might make one rod.' }) }),
        ],
        note: ['손에 잡히는 대로 골랐다고 했더니, 그럼 손이 고른 거라고 했다. 눈을 감고 마디를 세어 보라며 그 대를 내 손에 쥐여 주었다.', "When I said I'd taken whatever came to hand, he said then my hand had chosen. He put the culm in my hands and told me to count the nodes with my eyes shut."],
      }),
    },
  },

  // 290차 — N02-5 끝내는 자리(탁만수). 「오십 년 걸린 걸 하루에 봤네」
  {
    id: 'n02_5_done', questId: 'N02-5', at: 'complete', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '…마디를 봤구나.', '...You saw the nodes.'),
        line(P, '그 볼품없는 대 말씀이세요?', 'You mean the plain one?'),
        line(M, '그래. 두께도 색도 아니고 마디다. 마디가 고르면 힘이 고르게 간다.', 'Yes. Not thickness, not colour. Nodes. Even nodes, even strength.'),
        act(M, 'silence'),
        line(M, '오십 년 걸린 걸 하루에 봤네.', 'Fifty years it took me, and you saw it in a day.'),
        line(P, '(…칭찬이신가?)', '(...Was that praise?)'),
      ], {
        choices: [
          opt('why', '마디가 고르면 힘도 고르게 받는다고 생각했습니다', 'I thought even nodes would take the strain evenly', {
            end: endTalk({ complete: 'why', lineKo: '그렇지. 대는 마디로 산다. 사람도 그렇고. 그거 말려서 다시 가져와. 다음엔 깎는 걸 보여 주마.',
              lineEn: "That's it. A rod lives by its nodes. So do people. Dry that one and bring it back. Next time I'll show you the carving." }),
            note: ['마디가 고르면 힘도 고르게 받는다고 답했다. 탁만수 씨는 그 대를 내게 건네며, 말려서 가져오면 깎는 걸 보여 주겠다고 했다.', 'I said even nodes take the strain evenly. Tak Mansu handed me the culm — dry it and bring it back, and he would show me the carving.'] }),
          opt('luck', '솔직히 운이었습니다', 'Honestly, it was luck', {
            end: endTalk({ complete: 'luck', lineKo: '운도 손으로 만지고 나서 오는 거다. 다음엔 알고 골라. 운이라고 말하는 놈은 그래도 정직한 놈이다. 그 마디 가지고 다니면서 심심할 때 두드려 봐.',
              lineEn: "Luck comes after you've touched things too. Next time, choose knowing. Someone who calls it luck is honest, at least. Carry that piece and tap it when you're bored." }),
            note: ['운이었다고 털어놓았다. 탁만수 씨는 품삯 대신 대나무 한 마디를 잘라 주며, 심심할 때 두드려 보라고 했다.', 'I admitted it was luck. Instead of wages Tak Mansu cut me one section of bamboo — tap it when I was bored.'] }),
          opt('point', '고르는 법을 정리해 두신 게 있으면 보여 주십시오', "If you've written down how to choose, may I see it?", {
            end: endTalk({ complete: 'point', lineKo: '…메모지 같은 건 없다. 여기 있지. 적은 걸 외우지는 마라. 종이는 대를 못 만진다. 읽고, 만지고, 틀려 봐. 종이가 필요 없어지면 그때 버려.',
              lineEn: "...I don't keep notes. It's all in here. Don't memorise what's written. Paper can't touch a rod. Read it, touch, get it wrong. When you no longer need the paper, throw it away." }),
            note: ['고르는 법을 적어 둔 게 있느냐고 물었다. 탁만수 씨는 자기 머리를 두드리더니, 그래도 한 장을 찢어 적어 주었다. 외우지 말고 틀려 보라고.', "I asked if he'd written down how to choose. Tak Mansu tapped his head — then tore off a sheet and wrote it out anyway. Don't memorise it, he said; get it wrong."] }),
          opt('just_eye', '고르는 눈 하나 얻었으면 됐습니다', 'Gaining an eye for it is enough', {
            say: ['고르는 눈 하나 얻었으면 됐습니다. 따로 안 주셔도 됩니다.', "Gaining an eye for it is enough. You needn't give me anything."],
            end: endTalk({ complete: 'just_eye', lineKo: '…눈은 하루 만에 안 생긴다. 오늘 건 첫 마디다. 앉아라. 차는 없다. 대나무 얘기는 있다. 들을 만큼만 들어.',
              lineEn: "...An eye doesn't come in a day. Today was the first section. Sit. There's no tea. There's bamboo talk. Listen as much as you like." }),
            note: ['따로 받지 않겠다고 했다. 탁만수 씨는 공방 의자를 하나 내 쪽으로 밀어 주며, 차는 없고 대나무 얘기는 있다고 했다.', "I said I needed nothing. Tak Mansu pushed a workshop stool toward me — there was no tea, but there was bamboo talk."] }),
        ],
        note: ['탁만수 씨는 내가 마디를 봤다고 했다. 두께도 색도 아니고 마디라고. 오십 년 걸린 걸 하루에 봤다는 말이 칭찬인지는 알 수 없었다.', "Tak Mansu said I'd seen the nodes — not thickness, not colour, but nodes. Fifty years of his, and I'd seen it in a day. I couldn't tell whether that was praise."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N02-6 「새벽의 첫 대」 받는 자리(탁새벽). 할아버지는 보지도 않고 「얇다」고 했다
  // ═══════════════════════════════════════════
  {
    id: 'n02_6_offer', questId: 'N02-6', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '이거 봐!', 'Look at this!', { act: 'look_up' }),
        line('', '(아이가 대 하나를 두 손으로 내민다. 손잡이에 감은 실에서 아직 새 냄새가 난다.)', '(The boy holds out a rod in both hands. The thread wound round the grip still smells new.)'),
        line(P, '대네? 네가 만든 거야?', 'A rod? Did you make it?'),
        line(S, '응. 처음으로, 처음부터 끝까지 내가 했어.', 'Yeah. The first one I did all by myself, start to finish.'),
        line(P, '대단한데.', "That's amazing."),
        line(S, '…근데 할아버지는 얇대.', '...But Grandpa says it\'s thin.', { act: 'look_away' }),
        line(P, '얇다고?', 'Thin?'),
        line(S, '그러니까 밤에 이걸로 한 마리 낚아 줘. 공방 앞에서. 그러면 할아버지가 볼 거야.', "So catch one with it at night. In front of the workshop. Then Grandpa will see."),
      ], {
        choices: [
          opt('promise', '좋아. 네 대로 꼭 한 마리 올려 볼게', "Okay. I'll land one on your rod, for sure", {
            next: 'promise' }),
          opt('ask_grandpa', '얇다고만 하셨어? 보시긴 했고?', 'He only said thin? Did he even look?', {
            next: 'grandpa' }),
          opt('ask_tip', '초릿대가 뭐가 달라? 어떻게 깎았는데?', "What's different about the tip? How did you carve it?", {
            next: 'tip' }),
          opt('if_snaps', '부러지면 어떡해? 그땐 네 책임이다', "What if it snaps? Then it's on you", {
            say: ['부러지면 어떡해? 그땐 네가 책임지는 거다.', "What if it snaps? Then you'll have to take responsibility."], next: 'snaps' }),
        ],
        note: ['새벽이가 처음으로 혼자 깎은 대를 보여 주었다. 할아버지는 얇다고만 했다며, 밤에 공방 앞에서 그 대로 한 마리 낚아 달라고 했다. 그러면 할아버지가 볼 거라고.',
          "Saebyeok showed me the first rod he'd carved all on his own. His grandpa had only called it thin — so would I catch one with it at night, in front of the workshop? Then his grandpa would see."],
      }),
      promise: scene([
        line(S, '진짜지? 약속이야.', 'Really? Promise.'),
        line(S, '초릿대는 함부로 만지지 마. 거기가 제일 예민해.', "Don't fiddle with the tip. That's the most sensitive part."),
        line(P, '알았어. 조심할게.', "Got it. I'll be careful."),
        line(S, '입질 오면 대가 먼저 알려 줄 거야.', "When there's a bite, the rod will tell you first."),
      ], {
        end: endTalk({ accept: true, offer: 'promise', lineKo: '할아버지가 얇다고 한 거, 틀렸다는 거 보여 줘.', lineEn: 'Show Grandpa he was wrong to call it thin.' }),
        note: ['새벽이의 대로 꼭 한 마리 올리겠다고 약속했다. 초릿대가 제일 예민하니 함부로 만지지 말라고 했다.', "I promised to land one on Saebyeok's rod. The tip is the most sensitive part, he said — don't fiddle with it."],
      }),
      grandpa: scene([
        line(S, '안 봤어. 보지도 않고 얇대. 그게 다야.', "He didn't look. Said thin without even looking. That's all."),
        line('', '(입술을 깨문다. 울지는 않는다.)', "(He bites his lip. He doesn't cry.)"),
        line(S, '할아버지는 원래 말이 짧아. 한마디로 끝내. 그러니까 더 분해.', "Grandpa never says much. One word and done. That makes it worse."),
        line(P, '…', '...'),
        line(S, '그래도 이건 잘 만든 거야.', "But this one's well made."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_grandpa', lineKo: '…증명해 줘.', lineEn: '...Prove it for me.' }),
        note: ['할아버지가 보기는 했느냐고 물었다. 새벽이는 보지도 않고 얇다고 했다며 입술을 깨물었다. 울지는 않았다.', "I asked whether his grandpa had even looked. He hadn't — just said thin — and Saebyeok bit his lip. He didn't cry."],
      }),
      tip: scene([
        line(S, '끝을 더 가늘게 깎았어. 할아버지 대보다 훨씬. 그래서 휘청해.', "I carved the end thinner. Way thinner than Grandpa's. So it's springy."),
        line('', '(대 끝을 손가락으로 살짝 튕긴다. 대가 오래 떤다.)', '(He flicks the tip lightly with a finger. The rod quivers for a long time.)'),
        line(S, '봐, 오래 떨지. 이게 살아 있는 거야.', "See, it keeps quivering. That means it's alive."),
        line(P, '작은 입질에도 먼저 반응하겠다.', 'It would react to even a tiny bite.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_tip', lineKo: '맞아! 밤에 해 봐. 바람 없는 밤이 제일 좋아.', lineEn: "Right! Try it at night. A windless night is best." }),
        note: ['초릿대를 어떻게 깎았느냐고 물었다. 할아버지 대보다 훨씬 가늘게 깎아 오래 떤다고, 그게 살아 있는 거라고 했다. 바람 없는 밤이 제일 좋다고.', "I asked how he'd carved the tip. Far thinner than his grandpa's, so it quivers a long time — that means it's alive. A windless night is best, he said."],
      }),
      snaps: scene([
        line(S, '안 부러져!', "It won't snap!"),
        line(P, '농담이야, 농담.', 'Joking, joking.'),
        line(S, '…부러지면 내가 다시 깎아. 열 번이라도.', "...If it snaps, I'll carve it again. Ten times if I have to."),
        line(S, '그러니까 겁먹고 살살 들면 안 돼. 고기 걸리면 그냥 들어.', "So don't go timid and lift it gently. When a fish is on, just lift."),
      ], {
        end: endTalk({ accept: true, offer: 'if_snaps', lineKo: '대가 휘는 건 부러지는 게 아니야. 휘어야 대지.', lineEn: "A rod bending isn't a rod breaking. It has to bend to be a rod." }),
        note: ['부러지면 어떡하느냐고 놀렸더니 새벽이가 발끈했다. 부러지면 열 번이라도 다시 깎겠다고, 휘어야 대라고 했다.', "When I teased him about it snapping, Saebyeok flared up. He'd carve it ten times over if it broke — a rod has to bend to be a rod."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N02-6 「새벽의 첫 대」 — 끝내는 자리(탁새벽). 할아버지는 보지도 않고 얇다고 했다 · 공방 벽은 얇다(할아버지가 듣는다)
  // ═══════════════════════════════════════════
  {
    id: 'n02_6_done', questId: 'N02-6', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(P, '새벽아, 네 대로 한 마리 올렸어.', 'Saebyeok, I landed one on your rod.'),
        line(S, '낚았어?! 진짜? 내 대로?', 'You caught one?! Really? On my rod?', { act: 'look_up' }),
        line('', '(아이가 대 끝을 손가락으로 쓸어 본다. 안 부러졌다.)', "(The boy runs a finger along the tip. It isn't broken.)"),
        line(S, '…할아버지는 아직 안 봤어. 얇다는 말만 하고 공방 문 닫았어.', '...Grandpa still hasn\'t looked at it. He just said thin and shut the workshop door.'),
        line(P, '…그랬구나.', '...I see.'),
        line(S, '솔직히 말해 봐. 얇아?', 'Tell me honestly. Is it thin?'),
      ], {
        choices: [
          opt('too_much', '보지도 않고 얇다고 하신 건 네 할아버지가 너무하셨어.', 'Your grandpa went too far, calling it thin without even looking.',
            { stance: 'giver', aff: { [S]: 0.05, [M]: -0.05 }, flags: ['choice.n02_sided_kid'], next: 'shout',
              note: ['새벽이 편을 들었다. 보지도 않고 얇다고 한 건 너무했다고.', "I took Saebyeok's side: calling it thin without looking was going too far."] }),
          opt('is_thin', '솔직히 얇긴 해. 네 할아버지 말씀이 틀린 건 아니야.', "Honestly, it is thin. Your grandpa isn't wrong.",
            { stance: 'other', aff: { [S]: -0.05, [M]: 0.04 }, flags: ['choice.n02_sided_grandpa'], next: 'hurt',
              note: ['솔직히 얇긴 하다고 했다. 할아버지 말이 틀린 건 아니라고.', "I said honestly, it was thin — his grandpa wasn't wrong."] }),
          opt('bends', '얇아. 근데 얇은 대는 휘더라. 부러지지 않고.', "It's thin. But a thin rod bends, I found. It doesn't break.",
            { stance: 'mid', aff: { [S]: 0.03, [M]: 0.02 }, flags: ['choice.n02_thin_bends'], next: 'bends',
              note: ['얇지만 얇은 대는 휘지 부러지지 않더라고 했다.', "I said it was thin — but a thin rod bends, it doesn't break."] }),
          opt('honest_first', '솔직하게 말하기 전에, 학꽁치 내기 때 나 봐줬었어.', 'Before I answer honestly: back at the halfbeak bet, I let you win.',
            { stance: 'self', aff: { [S]: -0.02, [M]: 0.02 }, flags: ['choice.n02_bet_confessed'], requires: { flag: 'choice.n02_lied_bet' }, next: 'confess_bet',
              note: ['솔직히 말하기 전에, 학꽁치 내기 때 봐줬다는 것부터 털어놓았다.', 'Before answering honestly, I confessed I had let him win the halfbeak bet.'] }),
        ],
        note: ['새벽이의 대로 한 마리 올렸다고 하자 아이가 벌떡 일어났다. 할아버지는 아직 안 봤다고, 얇다는 말만 하고 공방 문을 닫았다며 솔직히 얇으냐고 물었다.', "When I said I'd landed one on his rod, Saebyeok shot up. His grandpa still hadn't looked — just said thin and shut the workshop door. Was it thin, honestly?"],
      }),
      shout: scene([
        line(S, '그치? 그치? 보지도 않고!', 'Right? Right? Without even looking!'),
        line(S, '할아버지! {player} 씨도 너무했대!', 'Grandpa! {player} says you went too far too!'),
        line('', '(공방 문은 열리지 않는다. 안에서 대 깎는 소리가 뚝 멈춘다.)', "(The workshop door doesn't open. Inside, the sound of carving stops dead.)"),
        line(P, '(…다 들으셨겠다.)', '(...He heard all of that.)'),
      ], {
        choices: [
          opt('go_tell', '내가 들어가서 직접 말씀드릴게. 한 번은 보셔야지.', "I'll go in and tell him myself. He has to look at it once.",
            { stance: 'giver', aff: { [S]: 0.02, [M]: -0.03 }, end: endTalk({ complete: 'praise',
              lineKo: '(내 소매를 붙잡는다.) …아니, 하지 마. 내가 할래. 본 대로, 이건 낚는 대라고. 할아버지가 뭐라고 하든 이제 나는 알아.',
              lineEn: "(He grabs my sleeve.) ...No, don't. I'll do it. Just like you saw, this is a rod that catches fish. Whatever Grandpa says, I know that now." }) }),
          opt('hush', '그만. 네 할아버지도 다 들으셔. 소리 지른다고 대가 굵어지진 않아.', "Enough. He can hear all of it. Shouting won't make the rod any thicker.",
            { stance: 'mid', aff: { [S]: -0.01, [M]: 0.02 }, next: 'hush' }),
        ],
        note: ['새벽이가 공방 쪽으로 할아버지가 너무했다고 소리쳤다. 문은 열리지 않았고, 안에서 대 깎는 소리가 뚝 멈췄다.', "Saebyeok shouted toward the workshop that his grandpa had gone too far. The door stayed shut, and inside, the carving stopped dead."],
      }),
      hush: scene([
        act(S, 'silence'),
        line(S, '…할아버지는 원래 그래. 대한테만 말해. 나한테는 한마디로 끝내.', "...Grandpa's always like that. He only talks to rods. With me it's one word and done."),
        line(P, '…', '...'),
        line('', '(마루 밑에서 깎다 만 대나무를 슬쩍 꺼낸다.)', '(From under the porch he sneaks out a half-carved piece of bamboo.)'),
        line(S, '그래서 하나 더 깎는 중이야. 이번엔 안 얇게. …아니, 얇게. 내 식으로.', "So I'm carving another one. Not thin this time. ...No. Thin. My way."),
      ], {
        choices: [
          opt('show_first', '그 대, 다 되면 나한테 제일 먼저 보여 줘.', "When that one's done, show it to me first.",
            { stance: 'giver', aff: { [S]: 0.02 }, end: endTalk({ complete: 'next_rod',
              lineKo: '(새끼손가락을 내민다.) 약속! 할아버지한테는 비밀이야. 다 되면 제일 먼저 보여 줄게.',
              lineEn: "(He holds out his little finger.) Promise! It's a secret from Grandpa. When it's done, you'll see it first." }) }),
          opt('how_choose', '그 마디는 어떻게 골랐는데? 나도 좀 알려 줘.', 'How did you choose those sections? Teach me a bit.',
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ complete: 'lesson',
              lineKo: '나한테 배운다고? …좋아. 손가락으로 톡 쳐 봐. 짧고 맑으면 살아 있는 마디야. 할아버지는 귀로 듣는데, 나는 손끝으로도 들어. 그건 내가 찾은 거야.',
              lineEn: "You, learning from me? ...Okay. Tap it with a finger. Short and clear means it's a live section. Grandpa listens with his ears, but I listen with my fingertips too. I found that out myself." }) }),
        ],
        note: ['소리 지른다고 대가 굵어지진 않는다고 말렸다. 새벽이는 한참 입을 다물었다가, 마루 밑에서 깎다 만 대나무를 꺼내 보였다. 이번에도 얇게, 자기 식으로 깎는다고.', "I told him shouting wouldn't make the rod thicker. Saebyeok went quiet a long time, then pulled a half-carved culm from under the porch. Thin again, he said — his way."],
      }),
      hurt: scene([
        line(S, '…그렇게 생각해? 그래도 낚았잖아. 직접 낚았잖아.', '...You think so too? But you caught one. You caught it yourself.'),
        line(P, '…응.', '...Yeah.'),
        line(S, '얇은 대로 낚았으면 얇아도 대인 거 아니야? 할아버지랑 똑같이 말하지 마.', "If it caught a fish, isn't it a rod even if it's thin? Don't talk exactly like Grandpa."),
      ], {
        choices: [
          opt('still_rod', '맞아. 얇아도 대는 대야. 낚았으니까.', "You're right. Thin or not, a rod's a rod. It caught a fish.",
            { stance: 'mid', aff: { [S]: 0.03 }, flags: ['choice.n02_thin_bends'], end: endTalk({ complete: 'praise',
              lineKo: '(코를 훌쩍이고 고개를 든다.) …그치. 낚았으면 대야. 그 말은 할아버지한테 안 해도 돼. 내가 할 거야.',
              lineEn: "(He sniffs and lifts his head.) ...Right. If it catches, it's a rod. You don't have to tell Grandpa. I will." }) }),
          opt('thicker_next', '낚은 건 낚은 거고, 얇은 건 얇은 거야. 다음엔 조금 더 굵게 깎아 봐.', 'Catching is catching, and thin is thin. Try carving it a bit thicker next time.',
            { stance: 'other', aff: { [S]: -0.03, [M]: 0.03 }, end: endTalk({ complete: 'pay',
              lineKo: '(대를 품에 안는다.) …알았어. 다음엔 굵게. (주머니에서 천 원짜리를 꺼내 내민다.) 시험 낚시 값이야. 일 시켰으면 값은 치르는 거래. 할아버지가 그랬어.',
              lineEn: '(He hugs the rod to his chest.) ...Okay. Thicker next time. (He takes a thousand-won note from his pocket and holds it out.) For the test fishing. If you make someone work, you pay. Grandpa says so.' }) }),
          opt('body_and_tip', '몸통은 네 할아버지 식, 끝은 네 식. 이 끝은 네 식이 맞았어.', "The body your grandpa's way, the tip your way. On this tip, your way was right.",
            { stance: 'mid', aff: { [S]: 0.04, [M]: 0.01 }, requires: { flag: 'choice.n02_two_poles' }, end: endTalk({ complete: 'praise',
              lineKo: '(눈이 동그래진다.) …대 고를 때 했던 말이지? 둘로 나눠 보는 거. (대 끝을 다시 쓸어 본다.) 그럼 다음 대 몸통은 할아버지한테 물어볼래. 끝은 내가 하고.',
              lineEn: "(His eyes go round.) ...That's what you said when we were choosing bamboo, right? Seeing it in two parts. (He runs a finger along the tip again.) Then for my next rod I'll ask Grandpa about the body. I'll do the tip." }) }),
        ],
        note: ['새벽이는 대를 쥔 손에 힘을 주었다. 울지는 않았다. 낚았으면 얇아도 대인 거 아니냐고, 할아버지랑 똑같이 말하지 말라고 했다.', "Saebyeok's grip on the rod tightened. He didn't cry. If it caught a fish, wasn't it a rod even if thin? Don't talk just like Grandpa, he said."],
      }),
      bends: scene([
        line(S, '휘는데 안 부러져?', "It bends but doesn't break?", { act: 'look_up' }),
        line(P, '응. 고기 걸렸을 때 활처럼 휘었어.', 'Yeah. When the fish was on, it bent like a bow.'),
        line(S, '…맞아. 그게 끝이 살아서 그래.', "...Right. That's because the tip is alive."),
        line(S, '할아버지 대는 안 휘어. 굵어서. 근데 굵은 대로는 그렇게 작은 입질 못 봐.', "Grandpa's rods don't bend. They're thick. But with a thick rod you can't see a bite that small."),
        line(S, '이 말, 할아버지한테 해도 될까?', 'Can I say that to Grandpa?', { act: 'look_away' }),
      ], {
        choices: [
          opt('say_it', '해. 네 대니까 네가 말해야지.', "Say it. It's your rod, so it should come from you.",
            { stance: 'giver', aff: { [S]: 0.03, [M]: -0.01 }, end: endTalk({ complete: 'praise',
              lineKo: '(대를 꼭 쥐고 공방 쪽으로 몇 걸음 가다 멈춘다.) …내일 할게. 오늘은 고기 냄새 나서 혼나. (돌아보며 웃는다.) 고마워.',
              lineEn: "(He grips the rod and takes a few steps toward the workshop, then stops.) ...I'll say it tomorrow. Tonight I smell of fish and I'll get told off. (He turns back, smiling.) Thanks." }) }),
          opt('both_ways', '네 할아버지 대는 버티는 대, 네 대는 듣는 대. 둘 다 있어야지.', "Your grandpa's rods hold on, yours listen. You need both kinds.",
            { stance: 'mid', aff: { [S]: 0.01, [M]: 0.02 }, end: endTalk({ complete: 'next_rod',
              lineKo: '듣는 대… (그 말을 몇 번 따라 한다.) 다음 대는 둘 다 넣어 볼래. 버티고 듣는 대. 다 되면 제일 먼저 보여 줄게.',
              lineEn: "A rod that listens... (He repeats it to himself a few times.) My next one, I'll try to put both in. A rod that holds on and listens. When it's done, you'll see it first." }) }),
          opt('never_lie', '학꽁치 잴 때 봤지? 나 빈말 안 해. 좋은 대야.', "Remember measuring the halfbeak? I don't say things I don't mean. It's a good rod.",
            { stance: 'giver', aff: { [S]: 0.03 }, requires: { flag: 'choice.n02_fair_bet' }, end: endTalk({ complete: 'praise',
              lineKo: '(이를 드러내고 웃는다.) 응. 결국 자대로 말하잖아. 그러니까 믿어. 할아버지가 뭐라고 하든.',
              lineEn: '(He grins, teeth and all.) Yeah. In the end you always say what the ruler says. So I believe you. Whatever Grandpa says.' }) }),
          opt('clear_ring', '그때 네가 고른 고운 대, 그 맑은 소리가 이 끝에 들어갔구나.', 'That pretty culm you chose back then. Its clear ring went into this tip.',
            { stance: 'giver', aff: { [S]: 0.04, [M]: -0.01 }, requires: { flag: 'choice.n02_backed_kid_pick' }, end: endTalk({ complete: 'praise',
              lineKo: '(고개를 세게 끄덕인다.) 응! 맑게 울던 그 대야. 끝에 딱 맞았어. (킥킥 웃는다.) 할아버지는 아직 몰라. 그 대가 여기 들어간 거.',
              lineEn: "(He nods hard.) Yeah! The one that rang so clear. It was perfect for the tip. (He giggles.) Grandpa still doesn't know. That it went in here." }) }),
        ],
        note: ['얇은 대는 휘지 부러지지 않는다고 하자, 새벽이는 끝이 살아서 그렇다고 했다. 할아버지 대로는 그렇게 작은 입질을 못 본다며, 이 말을 할아버지한테 해도 되느냐고 물었다.', "When I said a thin rod bends rather than breaks, Saebyeok said that's because the tip is alive — a thick rod like his grandpa's can't show a bite that small. Could he say so to his grandpa?"],
      }),
      confess_bet: scene([
        line(S, '…그때 할아버지가 창가에서 기침한 거, 그거였구나.', "...So that's what Grandpa's cough at the window was about.", { act: 'look_up' }),
        line(S, '봐주는 거 제일 싫다고 했잖아.', 'I told you I hate being let off.'),
        line(P, '알아. 그래서 지금 말하는 거야.', "I know. That's why I'm telling you now."),
        line(S, '…지금 말해 줬으니까 됐어. 그럼 이번 말은 진짜지? 얇아, 안 얇아?', "...You told me now, so it's okay. Then this time it's for real, right? Is it thin or not?"),
      ], {
        choices: [
          opt('real_praise', '진짜로 말할게. 끝이 나보다 입질을 먼저 알았어.', 'For real, then. The tip knew about the bite before I did.',
            { stance: 'giver', aff: { [S]: 0.04, [M]: 0.01 }, end: endTalk({ complete: 'praise',
              lineKo: '(대를 두 손으로 받쳐 들고 한참 본다.) …진짜구나. 진짜로 말할 때 얼굴, 이제 알아. 할아버지가 뭐라고 해도 괜찮아.',
              lineEn: "(He holds the rod up in both hands and looks at it a long while.) ...It's real. I know your for-real face now. It's okay, whatever Grandpa says." }) }),
          opt('real_thin', '진짜로 말하면, 얇아. 근데 휘기만 하고 안 부러지더라.', "For real? It's thin. But it only bent, it didn't break.",
            { stance: 'mid', aff: { [S]: 0.02, [M]: 0.01 }, flags: ['choice.n02_thin_bends'], next: 'bends' }),
        ],
        note: ['학꽁치 내기 때 봐줬다고 털어놓자, 새벽이는 그때 할아버지 기침이 그거였구나 하고 입을 삐죽였다. 지금 말해 줬으니 됐다며, 이번 말은 진짜냐고 다시 물었다.', "When I confessed to letting him win the halfbeak bet, Saebyeok pouted — so that was his grandpa's cough. Since I'd told him now, it was okay. Was this answer the real one, then?"],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N02-2 「왕대를 찾아서」 — 받는 자리(탁만수). 누구 탓인가(첫 대에서 선 자리가 열린다) · 새벽에게 무슨 문자를 보내나
  // ═══════════════════════════════════════════
  {
    id: 'n02_2_offer', questId: 'N02-2', at: 'offer', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line('', '(노인이 공방 문간에 서 있다. 손에 든 대패가 한참 움직이지 않는다.)', "(The old man is standing in the workshop doorway. The plane in his hand hasn't moved in a long while.)"),
        line(P, '무슨 일 있으세요? 새벽이가 안 보이네요.', "Is something wrong? I don't see Saebyeok."),
        line(M, '새벽이 태안 갔다. 왕대 찾으러.', 'Saebyeok went to Taean. For a giant culm.'),
        line(P, '태안이요? 혼자서요?', 'Taean? On his own?'),
        line(M, '쪽지 한 장 남기고.', 'Left one note.'),
        line('', '(쪽지를 내민다. 삐뚤빼뚤한 글씨로 「안 얇은 거 찾아올게.」)', "(He holds out the note. In wobbly letters: I'll find one that isn't thin.)"),
        line(M, '전화는 안 받는다. 내 전화는.', "He won't answer the phone. Not mine."),
        line(M, '…데려와라. 내가 가면 안 온다.', "...Bring him back. If I go, he won't come."),
      ], {
        choices: [
          opt('go_now', '지금 바로 태안으로 가겠습니다.', "I'll head to Taean right now.",
            { stance: 'mid', aff: { [M]: 0.03 }, next: 'text' }),
          opt('why_gone', '왜 갔는지 짐작 가는 데가 있으십니까?', 'Do you have any idea why he went?',
            { stance: 'mid', next: 'why' }),
          opt('go_yourself', '직접 가셔야 오지 않겠습니까? 새벽이한테는 가족이시잖아요.', "Shouldn't you go yourself? You're his family.",
            { stance: 'self', aff: { [M]: -0.03 }, next: 'not_me' }),
          opt('ask_wangdae', '왕대가 뭔데 거기까지 갔습니까?', 'What is a giant culm, that he went all that way?',
            { stance: 'mid', next: 'wangdae' }),
        ],
        note: ['새벽이가 쪽지 한 장만 남기고 태안으로 왕대를 찾으러 갔다. 「안 얇은 거 찾아올게.」 탁만수 씨는 자기 전화는 안 받는다며, 자기가 가면 안 오니 나더러 데려오라고 했다.',
          "Saebyeok had gone to Taean after a giant culm, leaving only a note: I'll find one that isn't thin. He wouldn't answer his grandfather's calls, and Tak Mansu said the boy wouldn't come if he went — so would I bring him back."],
      }),
      wangdae: scene([
        line(M, '굵고 마디 긴 대나무다. 좋은 왕대 하나면 대가 여러 대 나와.', 'Bamboo that is thick, with long sections. One good giant culm makes several rods.'),
        line(P, '그걸 찾으러 혼자 거기까지요?', 'And he went all that way alone to find one?'),
        line(M, '대 깎는 놈들은 한 번은 그걸 찾아 나선다. 그 애도 그때가 온 거지.', "Anyone who carves rods goes looking for one once. His time came, that's all."),
        line(M, '…내 허락 없이.', '...Without my permission.', { act: 'look_away' }),
      ], {
        choices: [
          opt('ok', '그럼 대나무 숲부터 찾아보겠습니다', "Then I'll start with the bamboo groves", {
            end: endTalk({ accept: true, offer: 'ask_wangdae', lineKo: '대나무 숲에서 마디 두드리는 소리가 나면 거기 있다.', lineEn: "If you hear someone tapping nodes in a bamboo grove, that's him." }),
            note: ['대나무 숲부터 찾아보기로 했다. 마디 두드리는 소리가 나면 거기 있다고 했다.', "I'd start with the bamboo groves. If I heard nodes being tapped, he'd be there."] }),
          opt('where', '태안 어디쯤입니까?', 'Whereabouts in Taean?', {
            say: ['태안 어디쯤입니까? 대나무 숲이 한두 곳이 아닐 텐데요.', "Whereabouts in Taean? There must be more than one or two bamboo groves."], next: 'where' }),
        ],
        note: ['왕대가 뭐냐고 물었다. 굵고 마디 긴 대나무로, 좋은 것 하나면 대가 여러 대 나온다고 했다. 대 깎는 사람은 한 번은 그걸 찾아 나선다고. 그 애도 그때가 온 거라고, 자기 허락 없이.', "I asked what a giant culm was. Thick bamboo with long sections — one good one makes several rods. Every carver goes looking for one once, he said. The boy's time had come. Without his permission."],
      }),
      where: scene([
        line(M, '갯벌 가까운 숲부터 가 봐.', 'Try the groves near the mudflats first.'),
        line(M, '낚시하는 놈이 대 찾으러 가면 바다를 등지고는 못 간다.', "An angler going after bamboo can't turn his back on the sea."),
        line(P, '숲에 가서는 어떻게 찾아요?', 'And how do I find him in the grove?'),
        line(M, '귀를 열어. 대나무 숲에서 톡톡 소리 나면 그 애다.', 'Open your ears. If you hear tapping in the bamboo, that is him.'),
      ], {
        end: endTalk({ accept: true, offer: 'where_taean', lineKo: '아무 대나 안 베는 놈이야. 다 두드려 보고 고른다.', lineEn: "He doesn't cut just any culm. He taps every one before he chooses." }),
        note: ['태안 어디쯤이냐고 물었다. 갯벌 가까운 숲부터 가 보라고, 톡톡 소리가 나면 그 애라고 했다.', 'I asked where in Taean. Try the groves near the mudflats, he said — if I heard tapping, that would be the boy.'],
      }),
      why: scene([
        line(M, '얇다고 했다. 그 애가 처음 제 손으로 깎은 대를.', 'I said thin. About the first rod he ever carved with his own hands.'),
        line(P, '…', '...'),
        line(M, '보지도 않고.', 'Without even looking.', { act: 'look_away' }),
        line(M, '그다음 날 아침에 이 쪽지다. 안 얇은 걸 찾아오겠다고.', "The next morning, this note. He'll find one that isn't thin."),
        line(M, '누구 탓인지 말해 봐라. 남의 눈이 더 잘 본다.', "Tell me whose fault it is. An outsider's eye sees better."),
      ], {
        choices: [
          opt('your_fault', '보지도 않고 하신 그 말이 아이를 보낸 겁니다.', 'That word you said without looking is what sent him off.',
            { stance: 'other', aff: { [M]: -0.05 }, next: 'blame',
              note: ['보지도 않고 한 그 말이 아이를 보냈다고 했다.', 'I said the word he spoke without looking was what sent the boy off.'] }),
          opt('kid_fault', '그래도 말없이 나간 건 새벽이 잘못입니다.', "Still, running off without a word is Saebyeok's fault.",
            { stance: 'giver', aff: { [M]: -0.01 }, next: 'kid_fault' }),
          opt('my_part_kid', '그날 저까지 너무하셨다고 거들었습니다. 제 탓도 있습니다.', 'That day I chimed in too, saying you went too far. Some of it is on me.',
            { stance: 'self', aff: { [M]: 0.02 }, requires: { flag: 'choice.n02_sided_kid' }, end: endTalk({ accept: true,
              lineKo: '…들었다. 공방 벽은 대보다 얇다. (쪽지를 내 손에 쥐여 준다.) 탓은 데려온 다음에 나눠 지자. 가라.',
              lineEn: "...I heard. The workshop wall is thinner than any rod. (He presses the note into my hand.) We'll share out the blame once he's back. Go." }),
              note: ['그날 나도 너무하셨다고 거들었으니 내 탓도 있다고 했다. 다 들었다고, 탓은 데려온 다음에 나눠 지자고 했다.', "I said I'd chimed in that day too, so some of it was on me. He'd heard everything, he said — we'd share the blame once the boy was back."] }),
          opt('my_part_grandpa', '제가 얇다고 거들었습니다. 아이 등을 민 건 저일지도 모릅니다.', 'I agreed it was thin. Maybe I was the one who pushed him out the door.',
            { stance: 'self', aff: { [M]: 0.01 }, requires: { flag: 'choice.n02_sided_grandpa' }, end: endTalk({ accept: true,
              lineKo: '(고개를 젓는다.) 얇다고 처음 말한 건 나다. 너는 보고 말했고, 나는 안 보고 말했다. 다르지. …가서 데려와.',
              lineEn: "(He shakes his head.) I'm the one who said thin first. You looked and said it, I said it without looking. Not the same. ...Go and bring him back." }) }),
        ],
        note: ['왜 갔는지 묻자, 탁만수 씨는 그 애가 처음 제 손으로 깎은 대를 보지도 않고 얇다고 했다고 털어놓았다. 다음 날 아침 이 쪽지였다며, 누구 탓인지 말해 보라고 했다.', "When I asked why, Tak Mansu admitted he'd called the boy's first hand-carved rod thin without even looking. The next morning, this note. Whose fault was it, he asked me."],
      }),
      blame: scene([
        act(M, 'silence'),
        line(M, '…그래. 내가 보냈다.', '...Right. I sent him.'),
        line(P, '왜 안 보셨어요?', "Why didn't you look?"),
        line(M, '보면 칭찬이 나올까 봐 안 봤다. 칭찬받은 손은 깎다 말고 멈춘다. 나는 그렇게 배웠다.', "I didn't look because I was afraid praise would come out. A hand that's been praised stops halfway through the cut. That's how I was taught."),
        line(M, '…틀렸을 수도 있지.', '...Maybe I was wrong.', { act: 'look_away' }),
      ], {
        choices: [
          opt('may_i_tell', '그 말씀, 새벽이한테 전해도 되겠습니까?', 'May I tell Saebyeok what you just said?',
            { stance: 'mid', aff: { [M]: 0.03 }, flags: ['choice.n02_grandpa_reason'], end: endTalk({ accept: true,
              lineKo: '(고개를 젓다가 멈춘다.) …네 입으로 하든 말든. 내 입으로는 못 한다. 가라.',
              lineEn: "(He starts to shake his head, then stops.) ...Whether your mouth says it is up to you. Mine can't. Go." }),
              note: ['그 까닭을 새벽이에게 전해도 되느냐고 물었다. 자기 입으로는 못 한다고, 내 입으로 하든 말든 알아서 하라고 했다.', "I asked if I could pass his reason on to Saebyeok. His own mouth couldn't say it, he said — whether mine did was up to me."] }),
          opt('still_wrong', '그래도 한 번은 보셨어야 했습니다.', 'Even so, you should have looked at it once.',
            { stance: 'other', aff: { [M]: -0.04 }, end: endTalk({ accept: true,
              lineKo: '(대답 대신 쪽지를 내 손에 쥐여 준다.) …그 말은 데려온 다음에 다시 해라.',
              lineEn: "(Instead of answering he presses the note into my hand.) ...Say that again once he's back." }) }),
          opt('send_word', '가기 전에 새벽이한테 문자라도 보내 보겠습니다.', "Before I go, I'll try sending Saebyeok a message.",
            { stance: 'mid', next: 'text' }),
        ],
        note: ['탁만수 씨는 한참 말이 없다가 자기가 보냈다고 했다. 보면 칭찬이 나올까 봐 안 봤다고, 칭찬받은 손은 깎다 말고 멈춘다고 배웠다고. 틀렸을 수도 있다고 했다.', "After a long silence Tak Mansu said he'd sent the boy away himself. He hadn't looked for fear praise would come out — a praised hand stops mid-cut, he'd been taught. Maybe he'd been wrong."],
      }),
      kid_fault: scene([
        line(M, '그 애 고집은 내 고집이다. 그 애 탓이면 내 탓이야.', "His stubbornness is my stubbornness. If it's his fault, it's mine."),
        line(P, '…그래도 혼은 나야죠.', '...Still, he should be scolded.'),
        line(M, '말 한마디 없이 나간 건 혼날 일이지. 혼은 내가 낸다. 너는 데려만 와.', "Leaving without a word does deserve a scolding. I'll do the scolding. You just bring him back."),
      ], {
        choices: [
          opt('just_fetch', '알겠습니다. 데려오기만 하겠습니다.', "Understood. I'll just bring him back.",
            { stance: 'giver', aff: { [M]: 0.02 }, end: endTalk({ accept: true, offer: 'bring_him',
              lineKo: '그래. 억지로 끌고 오지는 마라. 그러면 또 간다. (쪽지를 내 손에 쥐여 준다.)',
              lineEn: "Right. Don't drag him back by force. He'll only go again. (He presses the note into my hand.)" }) }),
          opt('send_word', '가기 전에 새벽이한테 문자라도 보내 보겠습니다.', "Before I go, I'll try sending Saebyeok a message.",
            { stance: 'mid', next: 'text' }),
        ],
        note: ['말없이 나간 건 새벽이 잘못이라고 했더니, 그 애 고집은 자기 고집이라고 했다. 혼은 자기가 낼 테니 나는 데려오기만 하라고.', "When I said running off without a word was Saebyeok's fault, he said the boy's stubbornness was his own. He'd do the scolding; I should just bring him back."],
      }),
      not_me: scene([
        line(M, '내가 가면 안 온다.', "If I go, he won't come.", { act: 'shake_head' }),
        line(M, '그 애 고집은 내 고집이야. 둘이 마주 서면 둘 다 안 굽혀.', 'His stubbornness is my stubbornness. Face to face, neither of us bends.'),
        line(P, '그럼 저는요?', 'And me?'),
        line(M, '너는 그 애 내기 상대다. 너한테는 지고도 웃는 놈이야. 그러니까 네가 가.', "You're his betting partner. With you he can lose and still laugh. So you go."),
      ], {
        choices: [
          opt('then_me', '알겠습니다. 제가 다녀오겠습니다.', "All right. I'll go.",
            { stance: 'giver', aff: { [M]: 0.02 }, next: 'text' }),
          opt('bend_both', '얇은 대는 휘지, 부러지진 않습니다. 두 분 다 조금만 휘시면 됩니다.', "A thin rod bends, it doesn't break. You both just need to bend a little.",
            { stance: 'mid', aff: { [M]: 0.02 }, requires: { flag: 'choice.n02_thin_bends' }, end: endTalk({ accept: true,
              lineKo: '(쪽지를 오래 본다.) …휘는 놈이라 태안까지 휘어 갔구나. 데려와라. 부러지기 전에.',
              lineEn: '(He looks at the note a long while.) ...A boy who bends, so he bent all the way to Taean. Bring him back. Before he snaps.' }) }),
          opt('still_you', '그래도 직접 가셔야 합니다.', 'Even so, it should be you who goes.',
            { stance: 'other', aff: { [M]: -0.03 }, end: endTalk({ accept: true, offer: 'why_not_you',
              lineKo: '(대패를 다시 든다. 손이 움직이지 않는다.) …나는 여기서 기다린다. 그게 내 몫이다. 가라.',
              lineEn: "(He picks the plane up again. His hand doesn't move.) ...I'll wait here. That's my part. Go." }) }),
        ],
        note: ['직접 가셔야 하지 않느냐고 했더니, 둘이 마주 서면 둘 다 안 굽힌다고 했다. 나는 그 애 내기 상대라 지고도 웃는 사이니 나더러 가라고.', "When I said he should go himself, he said face to face neither would bend. I was the boy's betting partner — someone he could lose to and still laugh — so I should go."],
      }),
      text: scene([
        line(M, '가기 전에 네 전화로 해 봐라. 내 번호는 안 받아도 네 번호는 볼 거다.', "Before you go, try it from your phone. He won't answer my number, but he'll look at yours.", { act: 'nod' }),
        line(P, '뭐라고 보낼까요?', 'What should I send?'),
        line(M, '그건 네가 정해. 그 애는 글자 하나도 오래 본다.', "That's up to you. That boy stares at every single letter."),
      ], {
        choices: [
          opt('text_coming', '(문자를 보낸다. 「지금 갈게. 왕대 같이 찾자.」)', "(I send a message: I'm coming. Let's find the culm together.)",
            { stance: 'other', aff: { [S]: 0.03 }, end: endTalk({ accept: true, offer: 'bring_him',
              lineKo: '(곧 읽음 표시가 뜬다. 답은 없다.) …읽었으면 됐다. 그 애는 읽고 기다리는 놈이다.',
              lineEn: "(Soon the message shows as read. No reply.) ...If he read it, that's enough. He's the kind who reads and waits." }),
              note: ['새벽이에게 지금 갈 테니 왕대 같이 찾자고 문자를 보냈다. 읽음 표시만 뜨고 답은 없었다.', "I texted Saebyeok that I was coming and we'd find the culm together. It showed as read, with no reply."] }),
          opt('text_scold', '(문자를 보낸다. 「네 할아버지 걱정하신다. 당장 돌아와.」)', "(I send a message: Your grandpa's worried. Come back right now.)",
            { stance: 'giver', aff: { [S]: -0.03, [M]: 0.01 }, flags: ['choice.n02_text_scold'], end: endTalk({ accept: true,
              lineKo: '(읽음 표시가 뜨자마자 그쪽 전화가 꺼진다.) …내가 언제 걱정한다고 했냐. 됐다. 가 봐라.',
              lineEn: '(The moment it shows as read, his phone goes off.) ...When did I say I was worried? Never mind. Go.' }),
              note: ['할아버지가 걱정하신다고, 당장 돌아오라고 문자를 보냈다. 읽자마자 새벽이의 전화가 꺼졌다.', "I texted that his grandpa was worried and he should come back right now. The moment it was read, Saebyeok's phone went off."] }),
          opt('face_to_face', '문자보다는 얼굴 보고 말하겠습니다.', "I'd rather tell him face to face than by message.",
            { stance: 'self', end: endTalk({ accept: true,
              lineKo: '(고개를 끄덕인다.) 그것도 방법이다. 그 애는 얼굴을 보면 못 도망간다. 나를 닮아서.',
              lineEn: "(He nods.) That's a way too. Once he sees your face he can't run. He takes after me." }) }),
        ],
        note: ['탁만수 씨는 가기 전에 내 전화로 문자를 보내 보라고 했다. 자기 번호는 안 받아도 내 번호는 볼 거라고, 그 애는 글자 하나도 오래 본다고.', "Tak Mansu told me to text from my phone before I left — the boy wouldn't answer his number but would look at mine. He stares at every letter, he said."],
      }),
    },
  },

  // N02-2 — 진행 중: 태안 대나무 숲에서 새벽을 찾는다(목표 0). 아이 편 · 할아버지 편 · 같이 고르기(아이가 집에 가서 옮긴다)
  {
    id: 'n02_2_find', questId: 'N02-2', at: 'objective', objectiveIndex: 0, npcId: S, start: 'start',
    nodes: {
      start: scene([
        line('', '(대나무 숲 안쪽에서 톡, 톡 소리가 난다. 아이가 마디에 귀를 대고 있다.)', '(From deep in the bamboo grove comes a tap, tap. The boy has his ear to a node.)'),
        line(P, '…새벽아?', '...Saebyeok?'),
        line(S, '…어떻게 알았어?', '...How did you know?', { act: 'look_up' }),
        line(P, '마디 두드리는 소리가 나더라.', 'I heard someone tapping nodes.'),
        line(S, '안 가. 할아버지가 보낸 거면 안 가.', "I'm not going. If Grandpa sent you, I'm not going."),
        line(S, '안 얇은 거 찾을 때까지 안 가.', "Not until I find one that isn't thin."),
      ], {
        choices: [
          opt('help_find', '데리러 온 거 아니야. 왕대 찾는 거 도우러 왔어.', "I didn't come to fetch you. I came to help you find the culm.",
            { stance: 'other', aff: { [S]: 0.04 }, next: 'why_here',
              note: ['데리러 온 게 아니라 왕대 찾는 걸 도우러 왔다고 했다.', "I said I hadn't come to fetch him — I'd come to help him find the culm."] }),
          opt('grandpa_sent', '네 할아버지가 보내셨어. 거짓말은 안 할게.', "Your grandpa sent me. I won't lie to you.",
            { stance: 'mid', aff: { [S]: -0.02, [M]: 0.02 }, next: 'sent' }),
          opt('scold', '말도 없이 이렇게 멀리 오면 어떡해!', 'How could you come all this way without a word!',
            { stance: 'giver', aff: { [S]: -0.05, [M]: 0.02 }, next: 'scolded' }),
          opt('text_sorry', '문자는 미안. 화나서 보낸 건 아니었어.', "Sorry about the message. I didn't send it because I was angry.",
            { stance: 'mid', aff: { [S]: 0.03 }, requires: { flag: 'choice.n02_text_scold' }, next: 'why_here' }),
        ],
        note: ['태안 대나무 숲 안쪽에서 톡톡 소리를 따라가 새벽이를 찾았다. 아이는 할아버지가 보낸 거면 안 간다고, 안 얇은 걸 찾을 때까지 안 간다고 했다.', "Following the tapping deep into a Taean bamboo grove, I found Saebyeok. If his grandpa had sent me, he wasn't going — not until he found one that wasn't thin."],
      }),
      sent: scene([
        line(S, '…거봐. 할아버지는 자기가 안 오고 남을 보내. 맨날 그래. 말도 남한테 시키고.', "...See? Grandpa doesn't come himself, he sends someone. Always. Even his words, he makes someone else say them."),
        line('', '(그래도 도망가지는 않는다. 대나무에 등을 기대고 주저앉는다.)', "(Still, he doesn't run. He leans his back against a culm and slumps down.)"),
        line(P, '…', '...'),
        line(S, '할아버지가 뭐래. 화났어?', 'What did Grandpa say? Is he angry?'),
      ], {
        choices: [
          opt('not_angry', '화 안 나셨어. 대패를 들고 한참 가만히 계시더라.', "He's not angry. He just stood there a long time holding his plane.",
            { stance: 'mid', aff: { [S]: 0.03 }, next: 'why_here' }),
          opt('of_course', '화나셨지. 당연하잖아.', "Of course he's angry. What did you expect?",
            { stance: 'giver', aff: { [S]: -0.03 }, next: 'why_here' }),
        ],
        note: ['할아버지가 보냈다고 숨기지 않았다. 새벽이는 할아버지는 늘 남을 보낸다고 투덜대면서도 도망가지 않고 주저앉았다.', "I didn't hide that his grandpa had sent me. Saebyeok grumbled that his grandpa always sends someone else — but he didn't run. He slumped down."],
      }),
      scolded: scene([
        line(S, '할아버지랑 똑같아! 잘못했다는 말만 듣고 싶은 거지?', "You're just like Grandpa! All you want is to hear me say sorry, right?"),
        line(P, '그런 게 아니라…', "It's not like that..."),
        line('', '(아이가 대나무 숲 안쪽으로 몇 걸음 물러난다.)', '(The boy backs a few steps deeper into the grove.)'),
        line(S, '안 가. 왕대 찾기 전엔 절대 안 가.', "I'm not going. Not until I've found a culm. Never."),
      ], {
        choices: [
          opt('calm_down', '미안. 놀라서 그랬어. 왜 왔는지 얘기해 줄래?', 'Sorry. I was just scared for you. Will you tell me why you came?',
            { stance: 'mid', aff: { [S]: 0.03 }, next: 'why_here' }),
          opt('before_dark', '안 돼. 해 지기 전에 같이 간다.', "No. We're leaving together before dark.",
            { stance: 'giver', aff: { [S]: -0.03, [M]: 0.02 }, end: endTalk({
              lineKo: '(입술을 깨문다.) …왕대 하나만. 하나만 고르고 갈게. 그건 못 말려. 그리고 농어 한 마리. 빈손으로 가면 할아버지가 내가 진 줄 알아.',
              lineEn: "(He bites his lip.) ...Just one culm. I'll pick just one and then go. You can't stop me doing that. And one sea bass. If I go back empty-handed, Grandpa will think I lost." }) }),
        ],
        note: ['말도 없이 멀리 오면 어떡하냐고 다그쳤다. 새벽이는 할아버지랑 똑같다며 숲 안쪽으로 물러섰다.', "I scolded him for coming so far without a word. Saebyeok said I was just like his grandpa and backed deeper into the grove."],
      }),
      why_here: scene([
        line('', '(아이가 대나무 하나를 손가락으로 톡 친다. 짧고 맑은 소리.)', '(The boy taps a culm with his finger. A short, clear sound.)'),
        line(S, '할아버지가 내 대 얇대. 보지도 않고.', "Grandpa says my rod's thin. Without even looking."),
        line(P, '그래서 여기까지 온 거야?', "So that's why you came all this way?"),
        line(S, '안 얇은 거 찾으러 왔어. 진짜 왕대.', "I came to find one that isn't thin. A real giant culm."),
        line(S, '이걸로 대를 깎아서 할아버지 앞에 세워 놓을 거야. 그럼 봐야 되잖아. 안 볼 수가 없잖아.', "I'll carve a rod from it and stand it right in front of Grandpa. Then he'll have to look. He won't be able not to."),
      ], {
        choices: [
          opt('grandpa_wrong', '보지도 않으신 건 너무하셨어. 보기는 하셨어야지.', 'Not even looking went too far. He should at least have looked.',
            { stance: 'other', aff: { [S]: 0.04, [M]: -0.03 }, end: endTalk({
              lineKo: '(고개를 세게 끄덕인다.) 그치! 집에 가서 할아버지한테 말할 거야. 같은 생각이라고. (왕대 하나를 골라 어깨에 멘다.) 가자. 농어 한 마리 낚고.',
              lineEn: "(He nods hard.) Right! I'm telling Grandpa when we get home. That you think so too. (He picks out a giant culm and shoulders it.) Let's go. After we catch a sea bass." }) }),
          opt('his_reason', '왜 안 보셨는지 들었어. 보면 칭찬하실까 봐 그러셨대.', "I heard why he didn't look. He was afraid he'd end up praising it.",
            { stance: 'mid', aff: { [S]: 0.05, [M]: 0.03 }, flags: ['choice.n02_told_reason'], requires: { flag: 'choice.n02_grandpa_reason' }, next: 'reason',
              note: ['할아버지가 왜 안 봤는지 들은 대로 전했다. 보면 칭찬할까 봐 그랬다고.', "I passed on what I'd heard: his grandpa hadn't looked for fear he'd praise it."] }),
          opt('grandpa_too', '네 할아버지도 이유가 있으셨을 거야. 말없이 나온 건 너도 잘못이고.', 'Your grandpa must have had his reasons. And leaving without a word was wrong of you too.',
            { stance: 'giver', aff: { [S]: -0.03, [M]: 0.03 }, end: endTalk({
              lineKo: '(입을 삐죽인다.) …알아. 나도 알아. 그래도 왕대는 가져갈 거야. (대나무 하나를 두드려 본다. 짧고 맑다.) 이거. 농어 한 마리 낚고 가자.',
              lineEn: "(He pouts.) ...I know. I know that. I'm still taking a culm home, though. (He taps one. Short and clear.) This one. Let's catch a sea bass and go." }) }),
          opt('show_him', '좋아. 같이 고르자. 대신 그 앞에는 네가 직접 세워.', "Okay. Let's choose one together. But you're the one who stands it in front of him.",
            { stance: 'mid', aff: { [S]: 0.03, [M]: 0.01 }, end: endTalk({
              lineKo: '(눈이 동그래진다.) 같이? …좋아! 귀 대고 들어. 짧고 맑으면 좋은 거야. (둘이 반나절을 두드린 끝에 한 대를 고른다.) 됐다. 농어 한 마리 낚고 가자.',
              lineEn: "(His eyes go round.) Together? ...Okay! Put your ear to it and listen. Short and clear is good. (After half a day of tapping, the two of us choose one.) Done. Let's catch a sea bass and go." }),
              note: ['같이 고르자고 했다. 대신 할아버지 앞에는 새벽이가 직접 세우기로. 반나절을 두드린 끝에 한 대를 골랐다.', "I said we'd choose one together — but he'd stand it before his grandpa himself. After half a day of tapping, we chose one."] }),
        ],
        note: ['새벽이는 할아버지가 보지도 않고 얇다고 해서 안 얇은 진짜 왕대를 찾으러 왔다고 했다. 그걸로 대를 깎아 할아버지 앞에 세워 놓으면 안 볼 수 없을 거라고.', "Saebyeok said he'd come for a real giant culm because his grandpa had called his rod thin without looking. Carve a rod from it and stand it in front of him, and he'd have to look."],
      }),
      reason: scene([
        line(S, '…칭찬할까 봐?', "...Afraid he'd praise it?"),
        line(S, '칭찬받은 손은 깎다 말고 멈춘다고? 그거 할아버지가 맨날 하는 말이야.', "A praised hand stops halfway through the cut? Grandpa says that all the time."),
        act(S, 'silence'),
        line(S, '그럼… 봤으면 칭찬할 뻔했다는 거잖아. 그치? 그런 거잖아.', "Then... that means if he'd looked, he'd almost have praised it. Right? That's what it means."),
      ], {
        choices: [
          opt('yes_that', '그런 거지. 그러니까 이번엔 보시게 하자.', "That's what it means. So this time, let's make him look.",
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({
              lineKo: '(코를 훌쩍이고 웃는다.) …바보 할아버지. (왕대 하나를 골라 어깨에 멘다.) 가자. 농어 한 마리는 낚고. 빈손으로 가면 할아버지가 내가 진 줄 알아.',
              lineEn: '(He sniffs and laughs.) ...Silly Grandpa. (He picks out a giant culm and shoulders it.) Let\'s go. After one sea bass. If I go back empty-handed, Grandpa will think I lost.' }) }),
          opt('keep_secret', '대신 내가 말했다고는 하지 마. 네 할아버지 비밀이야.', "Just don't say I told you. It's your grandpa's secret.",
            { stance: 'giver', aff: { [S]: 0.01, [M]: 0.02 }, end: endTalk({
              lineKo: '(새끼손가락을 건다.) 비밀. 할아버지는 대한테만 말하니까, 나도 대한테만 말할게. (왕대를 어깨에 멘다.) 농어 한 마리 낚고 가자.',
              lineEn: "(He hooks his little finger round mine.) Secret. Grandpa only talks to rods, so I'll only tell the rod. (He shoulders the culm.) Let's catch a sea bass and go." }) }),
        ],
        note: ['새벽이의 손이 멈췄다. 칭찬받은 손은 깎다 말고 멈춘다는 건 할아버지가 맨날 하는 말이라고. 한참 대나무만 보더니, 봤으면 칭찬할 뻔했다는 거냐고 물었다.', "Saebyeok's hand stopped. A praised hand stops mid-cut — his grandpa said that all the time. He stared at the bamboo a long while, then asked: so if he'd looked, he'd nearly have praised it?"],
      }),
    },
  },

  // 290차 — N02-2 끝내는 자리(탁만수). 아이는 버스에서 잠들었다 · 왕대를 메고 왔다
  {
    id: 'n02_2_done', questId: 'N02-2', at: 'complete', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '…왔구나.', "...You're back.", { act: 'look_up' }),
        line(P, '네. 새벽이도 같이요. 오는 버스에서 내내 잤어요.', 'Yes. Saebyeok too. He slept the whole bus ride.'),
        line(M, '왕대는?', 'The culm?'),
        line(P, '여기요. 새벽이가 직접 두드려 보고 골랐어요.', 'Here. Saebyeok tapped them himself and chose it.'),
        line(M, '…좋은 거네.', '...A good one.', { act: 'peer' }),
        line(M, '애는 자게 둬.', 'Let the boy sleep.'),
      ], {
        choices: [
          opt('lesson', '새벽이가 왕대 고르는 법, 저도 봤습니다', 'I watched how Saebyeok chose the culm', {
            say: ['새벽이가 왕대 고르는 법, 저도 봤습니다. 소리로 고르더군요.', 'I watched how Saebyeok chose the culm. He picked it by sound.'],
            end: endTalk({ complete: 'lesson', lineKo: '그건 내가 가르친 거야. …그래, 그 애가 더 잘 들어. 귀는 나이 먹으면 먼저 닳는다. 너도 들었으면 이제 둘이다. 내 귀가 없어도 공방은 돌아가겠구나.',
              lineEn: "I taught him that. ...Yes, he hears it better. Ears wear out first with age. If you heard it too, that makes two. The workshop will keep going without my ears." }),
            note: ['새벽이가 소리로 왕대를 고르는 걸 봤다고 했다. 탁만수 씨는 자기가 가르친 거지만 그 애가 더 잘 듣는다고, 이제 둘이니 공방은 돌아가겠다고 했다.', "I said I'd watched Saebyeok choose the culm by sound. Tak Mansu had taught him that, but the boy hears better now, he said — with two of us, the workshop would keep going."] }),
          opt('pay', '태안 왕복 여비는 받겠습니다', "I'll take the fare to Taean and back", {
            end: endTalk({ complete: 'pay', lineKo: '그러지. 노인 심부름값. 그 애 데려온 건 돈으로 못 치른다. 그건 나도 안다. 받을 건 받아. 그래야 내가 덜 미안하다.',
              lineEn: "Fine. An old man's errand money. Bringing that boy back can't be paid for in money. I know that much. Take what you're owed. That way I feel less sorry." }),
            note: ['여비를 받았다. 지폐를 세는 손이 떨렸다. 안도하는 손이었다.', 'I took the fare. The hand counting the notes trembled — with relief.'] }),
          opt('decline', '아이를 데려온 건데요. 됐습니다', 'I brought the boy home. No need', {
            next: 'decline' }),
          opt('say_word', '깨면 왕대 잘 골랐다고 한마디만 해 주십시오', 'When he wakes, tell him he chose well', {
            say: ['새벽이 깨면 왕대 잘 골랐다고 한마디만 해 주십시오.', 'When Saebyeok wakes, just tell him he chose the culm well.'], aff: { [S]: 0.02 }, next: 'word' }),
        ],
        note: ['새벽이와 왕대를 메고 속초로 돌아왔다. 아이는 버스에서 내내 잤다. 탁만수 씨는 왕대를 들여다보고 좋은 거라고, 애는 자게 두라고 했다.', "I came back to Sokcho with Saebyeok and the giant culm. The boy slept the whole bus ride. Tak Mansu looked at the culm — a good one, he said — and told me to let the boy sleep."],
      }),
      decline: scene([
        line(M, '…고맙다.', '...Thank you.'),
        act(M, 'silence'),
        line(M, '그 말 처음 하네.', "First time I've said that."),
        line('', '(자는 줄 알았던 새벽이가 돌아누우며 웃는다.)', '(Saebyeok, who I thought was asleep, rolls over and smiles.)'),
        line(M, '그 애는 다 듣고 있었을 거다. 저 녀석은 자는 척을 잘해.', "He'll have heard every word. That rascal's good at pretending to sleep."),
      ], {
        end: endTalk({ complete: 'decline', lineKo: '…내일 아침엔 밥을 두 공기 퍼 줘야겠다.', lineEn: "...Tomorrow morning I'd better give him two bowls of rice." }),
        note: ['값은 사양했다. 탁만수 씨가 처음으로 고맙다고 했다. 자는 줄 알았던 새벽이가 돌아누우며 웃었다.', 'I turned down the money. For the first time, Tak Mansu said thank you. Saebyeok, whom I thought asleep, rolled over and smiled.'],
      }),
      word: scene([
        line(M, '…한마디.', '...One word.'),
        act(M, 'silence'),
        line(M, '말로 하는 건 내 쪽이 서툴다.', "Saying it out loud is where I'm clumsy."),
        line(P, '…', '...'),
        line(M, '대신 그 왕대, 내가 직접 말려 주마. 그늘에서 천천히.', "Instead I'll dry that culm for him myself. Slowly, in the shade."),
      ], {
        end: endTalk({ complete: 'say_word', lineKo: '그 애는 그걸 보고 알 거다. 그 애도 말보다 대를 먼저 보는 놈이니까.', lineEn: "He'll see that and know. He's another one who looks at the rod before the words." }),
        note: ['깨면 잘 골랐다고 한마디만 해 달라고 했다. 탁만수 씨는 오래 말이 없다가, 말은 서툴다며 대신 그 왕대를 그늘에서 직접 말려 주겠다고 했다.', "I asked him to tell the boy he'd chosen well. After a long silence Tak Mansu said words were where he was clumsy — instead he'd dry the culm himself, slowly, in the shade."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N02-3 「돌무덤의 주인」 받는 자리(탁새벽 · 서귀포). 제 대로 대구 80cm 넘는 놈 — 드랙 시험
  // ═══════════════════════════════════════════
  {
    id: 'n02_3_offer', questId: 'N02-3', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '왔다! 기다렸어.', "You're here! I've been waiting.", { act: 'look_up' }),
        line(P, '제주까지 웬일이야?', 'What are you doing all the way out in Jeju?'),
        line(S, '돌무덤의 주인 잡으러.', 'Catching the Master of the Stone Mound.'),
        line(P, '돌무덤의… 뭐?', 'The Master of the... what?'),
        line(S, '대구. 80 넘는 거. 서귀포 깊은 데 살아.', 'A cod. Over 80. It lives in the deep water off Seogwipo.'),
        line('', '(새벽이가 대 하나를 내밀다가, 손잡이를 한 번 더 닦는다.)', '(Saebyeok holds out a rod, then wipes the grip once more.)'),
        line(S, '내 대로 잡아 줘. 드랙 시험이야.', "Catch it on my rod. It's a drag test."),
        line(P, '네가 깎은 대야?', 'Did you carve this?'),
        line(S, '응. 부러지면 내 잘못이야.', "Yeah. If it breaks, it's my fault."),
      ], {
        choices: [
          opt('hold_on', '좋아. 네 대 믿고 끝까지 버텨 볼게', "Okay. I'll trust your rod and hold on to the end", {
            next: 'hold' }),
          opt('ask_mound', '돌무덤의 주인? 그게 무슨 소리야?', 'Master of the Stone Mound? What does that mean?', {
            next: 'mound' }),
          opt('grandpa_knows', '네 할아버지는 이 시험 알고 계셔?', 'Does your grandpa know about this test?', {
            next: 'grandpa' }),
        ],
        note: ['서귀포에서 새벽이가 기다리고 있었다. 돌무덤의 주인, 80cm 넘는 대구를 자기가 깎은 대로 잡아 달라고 했다. 드랙 시험이라고, 부러지면 자기 잘못이라고.',
          "Saebyeok was waiting in Seogwipo. He wanted me to catch the Master of the Stone Mound — a cod over 80 cm — on the rod he'd carved. A drag test, he said; if it broke, it was his fault."],
      }),
      hold: scene([
        line(S, '끝까지야. 중간에 드랙 다 풀어 버리면 안 돼.', "To the end. You can't let the drag all the way off halfway."),
        line(S, '바닥으로 박힐 때 조이고, 떠오를 때 풀어. 그거 반복이야.', 'Tighten when it dives for the bottom, loosen when it comes up. Over and over.'),
        line(P, '팔 꽤 아프겠다.', "My arms are going to hurt."),
        line(S, '아파도 참아. 대는 안 부러져. 내가 그렇게 깎았어.', "Bear it. The rod won't break. I carved it that way."),
      ], {
        choices: [
          opt('ok', '알았어. 끝까지 해 볼게', "All right. I'll see it through", {
            end: endTalk({ accept: true, offer: 'hold_on' }),
            note: ['새벽이의 대를 믿고 끝까지 버텨 보기로 했다. 바닥으로 박힐 때 조이고, 떠오를 때 풀기.', "I'd trust Saebyeok's rod and hold on to the end: tighten as it dives, loosen as it rises."] }),
          opt('my_arm', '그런 놈이면 대보다 내 팔이 먼저 부러지겠다', "With a fish like that, my arm will break before the rod", {
            say: ['80센티 넘는 놈이면 대보다 내 팔이 먼저 부러지겠다.', "With something over 80 centimetres, my arm will break before the rod does."], next: 'arm' }),
        ],
        note: ['새벽이는 바닥으로 박힐 때 드랙을 조이고 떠오를 때 풀라고 했다. 팔이 아파도 참으라고, 대는 안 부러지게 깎았다고.', 'Saebyeok said to tighten the drag when it dives and loosen when it rises. Bear the ache, he said — he had carved the rod not to break.'],
      }),
      arm: scene([
        act(S, 'laugh'),
        line(S, '팔은 안 부러져. 아프기만 해. 아픈 건 지나가는데 놓친 건 안 지나가. 할아버지가 그랬어.', "Your arm won't break. It just hurts. Pain passes, but the one that got away doesn't. Grandpa says so."),
        line(P, '…그건 맞는 말이네.', "...That's true enough."),
        line(S, '대구는 처음에 세게 박고 나면 힘이 빠져. 첫 번째만 버텨. 그다음은 대가 해.', "A cod dives hard at first, then runs out of strength. Just hold through the first one. The rod does the rest."),
      ], {
        end: endTalk({ accept: true, offer: 'my_arm', lineKo: '내 대를 믿어.', lineEn: 'Trust my rod.' }),
        note: ['내 팔이 먼저 부러지겠다고 했더니 새벽이가 웃었다. 아픈 건 지나가는데 놓친 건 안 지나간다고, 첫 번째만 버티면 그다음은 대가 한다고.', "When I joked my arm would break first, Saebyeok laughed. Pain passes, a lost fish doesn't — just hold through the first dive and the rod does the rest."],
      }),
      mound: scene([
        line(S, '바닥에 돌이 무덤처럼 쌓인 데가 있어. 거기 사는 제일 큰 놈.', "There's a place on the bottom where rocks are heaped like a burial mound. The biggest one living there."),
        line(P, '그래서 주인이구나.', "Hence the master."),
        line(S, '걸리면 돌 사이로 파고들어서, 다들 줄만 끊기고 와.', 'Hook it and it burrows between the rocks. Everyone just comes back with a cut line.'),
        line(S, '그러니까 내 대로 꺼내면…', 'So if my rod pulls it out...'),
        act(S, 'laugh'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_mound', lineKo: '그다음은 상상해 봐.', lineEn: 'Imagine the rest.' }),
        note: ['돌무덤의 주인이 뭐냐고 물었다. 바닥에 돌이 무덤처럼 쌓인 곳의 제일 큰 놈이라고, 걸리면 돌 사이로 파고들어 다들 줄만 끊긴다고 했다.', 'I asked what the Master of the Stone Mound was. The biggest fish where rocks are heaped like a burial mound, he said — hooked, it burrows into the rocks and everyone loses their line.'],
      }),
      grandpa: scene([
        line(S, '…몰라. 말 안 했어.', "...He doesn't know. I didn't tell him.", { act: 'look_away' }),
        line(S, '말하면 또 얇다고 할 거야.', "If I tell him he'll just say thin again."),
        line(P, '그래도…', 'Still...'),
        line(S, '80 넘는 거 올리고 나서 말할 거야. 숫자로. 숫자는 할아버지도 못 깎아.', "I'll tell him after we land one over 80. With a number. Not even Grandpa can whittle down a number."),
      ], {
        end: endTalk({ accept: true, offer: 'grandpa_knows', lineKo: '그러니까 꼭 올려 줘.', lineEn: 'So make sure you land it.' }),
        note: ['할아버지가 이 시험을 아느냐고 물었다. 새벽이는 말하면 또 얇다고 할 거라며, 80 넘는 걸 올린 뒤 숫자로 말하겠다고 했다. 숫자는 할아버지도 못 깎는다고.', "I asked if his grandpa knew about the test. If he told him, he'd only say thin again, Saebyeok said — he'd tell him afterwards, with a number over 80. Not even his grandpa can whittle a number."],
      }),
    },
  },

  // N02-3 — 끝내는 자리(탁새벽). 84cm · 대는 안 부러졌다
  {
    id: 'n02_3_done', questId: 'N02-3', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(P, '올렸어. 재 봐.', 'Landed it. Measure it.'),
        line(S, '…84! 84야!', "...84! It's 84!", { act: 'peer' }),
        line('', '(새벽이가 대 끝을 만져 본다.)', '(Saebyeok feels the tip of the rod.)'),
        line(S, '대 안 부러졌어! 내 대야!', "The rod didn't break! It's my rod!"),
        line(P, '바닥으로 박힐 때 팔 빠지는 줄 알았어.', 'When it dived for the bottom I thought my arms would come off.'),
        line(S, '근데 버텼잖아. 할아버지한테 말할 거야!', "But you held on. I'm telling Grandpa!"),
      ], {
        choices: [
          opt('praise', '네 대가 대구를 이겼어. 네 할아버지한테는 내가 말할게', "Your rod beat the cod. I'll tell your grandpa myself", {
            end: endTalk({ complete: 'praise', lineKo: '직접? …응. 그래 줘. 이거 받아. 얇다는 소리 들은 그 대에서 자른 마디야. 이제 그 소리 안 들어도 돼. 증인이 생겼으니까. 잃어버리면 안 돼.',
              lineEn: "You will? ...Yeah. Please. Take this. It's a section cut from the rod he called thin. I don't have to hear that any more. Now there's a witness. Don't lose it." }),
            note: ['새벽이의 대가 대구를 이겼다고, 할아버지한테는 내가 말하겠다고 했다. 새벽이는 얇다는 소리를 들었던 첫 대에서 자른 마디 하나를 내게 주었다.', "I said his rod had beaten the cod and I'd tell his grandpa myself. Saebyeok gave me a section cut from his first rod — the one called thin."] }),
          opt('lesson', '드랙 조절, 네 말이 맞았어. 더 가르쳐 줘', 'You were right about the drag. Teach me more', {
            say: ['드랙 조절 타이밍, 네가 옆에서 말해 준 게 맞았어. 더 가르쳐 줘.', 'The drag timing you called out beside me was right. Teach me more.'],
            end: endTalk({ complete: 'lesson', lineKo: '그건 할아버지가… 아니, 나도 알아. 바닥 소리 들릴 때야. 줄이 돌에 닿으면 대 끝이 드르륵 떨어. 그때 조여야 돼. 늦으면 돌에 감기고. 오늘 대 끝 보고 진짜로 알았어.',
              lineEn: "Grandpa taught... no, I know it too. When you hear the bottom. When the line touches rock the rod tip judders. That's when you tighten. Too late and it wraps the rocks. Watching your rod tip today, I really got it." }),
            note: ['드랙 조절을 더 가르쳐 달라고 했다. 줄이 돌에 닿으면 대 끝이 드르륵 떠는데, 그 바닥 소리가 들릴 때 조여야 한다고 했다.', 'I asked him to teach me more about the drag. When the line touches rock the tip judders — when you hear that bottom, you tighten.'] }),
          opt('pay', '시험 낚시 값은 받아야지', 'I should get paid for test fishing', {
            next: 'pay' }),
          opt('eat_together', '용돈은 넣어 둬. 네 할아버지랑 같이 먹자', 'Keep your pocket money. Let\'s eat it with your grandpa', {
            say: ['용돈은 넣어 둬. 이 대구는 네 할아버지랑 같이 먹자.', "Keep your pocket money. Let's eat this cod with your grandpa."],
            end: endTalk({ complete: 'eat_together', lineKo: '…같이? 할아버지랑? 좋아. 밥 먹으면서 말해 줘. 이거 내 대로 올렸다고. 나는 옆에서 먹기만 할게. 내가 말하면 자랑 같잖아.',
              lineEn: "...Together? With Grandpa? Okay. Tell him while we eat. That this came up on my rod. I'll just eat beside you. If I say it, it sounds like bragging." }),
            note: ['용돈은 넣어 두라고, 대구는 할아버지랑 같이 먹자고 했다. 새벽이는 밥 먹으면서 내가 말해 달라고, 자기가 하면 자랑 같다고 했다.', "I told him to keep his pocket money and that we'd eat the cod with his grandpa. Saebyeok asked me to tell the story over dinner — if he did, it would sound like bragging."] }),
        ],
        note: ['돌무덤의 주인을 올렸다. 84cm. 새벽이는 대 끝을 만져 보고 안 부러졌다고 소리쳤다. 할아버지한테 말하겠다고.', "I landed the Master of the Stone Mound — 84 cm. Saebyeok felt the rod tip and shouted that it hadn't broken. He was going to tell his grandpa."],
      }),
      pay: scene([
        line(S, '…용돈 다 줄게.', "...I'll give you all my pocket money."),
        line(P, '(진지하다. 받아야 할 것 같다.)', "(He's serious. I think I have to take it.)"),
        line(S, '약속은 약속이야. 시험 낚시 시켰으면 값은 줘야 돼.', 'A promise is a promise. If I made you do test fishing, I have to pay.'),
      ], {
        end: endTalk({ complete: 'pay', lineKo: '…대신 할아버지한테는 공짜로 해 줬다고 해. 용돈 다 쓴 거 알면 혼나.', lineEn: "...But tell Grandpa you did it for free. If he finds out I spent all my pocket money, I'll get told off." }),
        note: ['시험 낚시 값을 달라고 했더니 새벽이가 진지하게 용돈을 다 내밀었다. 할아버지한테는 공짜였다고 해 달라고.', "When I asked for my test-fishing fee, Saebyeok solemnly handed over all his pocket money — and asked me to tell his grandpa I'd done it for free."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // 290차 — N02-4 「마지막 죽간」 받는 자리(탁새벽). 노인이 손을 놓았다 · 마지막 손질은 같이
  // ═══════════════════════════════════════════
  {
    id: 'n02_4_offer', questId: 'N02-4', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '왔어? 이리 와 봐.', "You're here? Come and look."),
        line('', '(공방 작업대 위에 대 하나가 누워 있다. 부러졌던 마디에 새 대나무가 이어져 있다.)', '(A rod lies on the workbench. New bamboo has been joined where a section once broke.)'),
        line(P, '이건… 우리 아버지 대잖아.', "This is... my father's rod."),
        line(S, '응. 할아버지가 손 놓고 내가 했어.', 'Yeah. Grandpa let go of it, and I did it.'),
        line(S, '이음새 안 보이지?', "You can't see the joint, can you?"),
        line(P, '…', '...', { act: 'peer' }),
        line(S, '근데 아직 다 끝난 거 아니야. 마지막 손질은 같이 해야 돼.', "But it's not quite done. We have to do the last finishing together."),
        line(P, '나도?', 'Me too?'),
        line(S, '응. 다 되면 받아. 독도에서 던질 대니까.', "Yeah. When it's done, take it. It's the rod you'll cast at Dokdo."),
      ], {
        choices: [
          opt('alive_again', '고마워. 아버지 대가 다시 살았네', "Thank you. My father's rod lives again", {
            say: ['…고마워. 아버지 대가 다시 살았네.', "...Thank you. My father's rod lives again."], next: 'alive' }),
          opt('ask_letgo', '손을 놓으셨다니, 무슨 뜻이야?', 'What do you mean, he let go?', {
            next: 'letgo' }),
          opt('ask_joint', '이음새, 어떻게 없앤 거야?', 'How did you make the joint disappear?', {
            next: 'joint' }),
        ],
        note: ['공방 작업대에 아버지의 대가 누워 있었다. 부러졌던 마디에 새 대나무가 이어졌는데 이음새가 보이지 않았다. 새벽이는 할아버지가 손을 놓고 자기가 했다며, 마지막 손질은 같이 하자고 했다. 독도에서 던질 대라고.',
          "My father's rod lay on the workbench. New bamboo had been joined where it broke, and I couldn't see the seam. Saebyeok said his grandpa had let go and he'd done it himself — the last finishing we'd do together. The rod I'd cast at Dokdo."],
      }),
      alive: scene([
        line(S, '응. 살았어. 마디 하나 새로 들어갔지만 그래도 그 대야.', "Yeah. It lives. One new section went in, but it's still the same rod."),
        line('', '(새벽이가 대를 두 손으로 받쳐 든다. 손이 조금 떨린다.)', '(Saebyeok holds the rod up in both hands. His hands shake a little.)'),
        line(S, '마지막 손질은 같이 하자. 손이 들어가야 진짜 네 대지.', "Let's do the last finishing together. It's only really yours once your hands are in it."),
      ], {
        choices: [
          opt('ok', '그래. 같이 하자', "Okay. Let's do it together", {
            end: endTalk({ accept: true, offer: 'alive_again' }),
            note: ['마지막 손질을 같이 하기로 했다. 내 손이 들어가야 진짜 내 대라고 했다.', "We'd do the last finishing together. It would only be truly mine with my hands in it."] }),
          opt('scared_to_cast', '너무 귀해서 던지기 겁나는데', "It's so precious I'm scared to cast it", {
            say: ['독도에서? 너무 귀한 대라 던지기가 겁나는데.', "At Dokdo? It's so precious, I'm scared to cast it."], next: 'scared' }),
        ],
        note: ['아버지 대가 다시 살았다고 고마워했다. 새벽이는 마디 하나 새로 들어갔지만 그래도 그 대라고, 손이 조금 떨렸다.', "I thanked him: my father's rod lived again. One new section went in, Saebyeok said, but it was still that rod. His hands shook a little."],
      }),
      scared: scene([
        line(S, '겁내면 안 돼! 대는 던지라고 만드는 거야. 벽에 걸면 죽어.', "Don't be scared! Rods are made to be cast. Hang it on a wall and it dies."),
        line('', '(대를 내 손에 억지로 쥐여 준다.)', '(He presses the rod into my hands.)'),
        line(P, '…그래도.', '...Still.'),
        line(S, '부러지면 또 고치면 돼. 이제 고칠 줄 아는 사람이 둘이야.', 'If it breaks, we fix it again. Now there are two people who know how.'),
      ], {
        end: endTalk({ accept: true, offer: 'scared_to_cast', lineKo: '…아니, 같이 손보면 셋.', lineEn: '...No — three, once you work on it too.' }),
        note: ['너무 귀해서 던지기 겁난다고 했더니, 새벽이는 대는 던지라고 만드는 거라며 대를 내 손에 쥐여 주었다. 부러지면 또 고치면 된다고.', "When I said it was too precious to cast, Saebyeok said rods are made to be cast and pushed it into my hands. If it broke, we'd fix it again."],
      }),
      letgo: scene([
        line(S, '이번 대는 처음부터 끝까지 내가 하래. 할아버지는 구석에서 보기만 했어.', 'He said I had to do this one from start to finish. Grandpa just watched from the corner.'),
        line(S, '진짜로 한마디도 안 했어.', "Honestly, he didn't say a single word."),
        line(P, '화나신 건 아니고?', "He wasn't angry?"),
        line(S, '처음엔 화났나 했는데 아니래. 손 놓는 것도 일이래.', 'At first I thought he was, but he says no. Letting go is work too, he says.'),
        line(S, '무슨 말인지 아직 잘 모르겠어. …알아?', "I still don't really get it. ...Do you?"),
        line(P, '…글쎄.', '...Hard to say.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_letgo', lineKo: '몰라도 돼. 마지막 손질은 같이 하자.', lineEn: "You don't have to know. Let's do the last finishing together." }),
        note: ['할아버지가 손을 놓았다는 게 무슨 뜻이냐고 물었다. 이번 대는 처음부터 끝까지 새벽이가 했고, 할아버지는 구석에서 한마디도 없이 보기만 했다고. 손 놓는 것도 일이라는데 무슨 말인지 아직 모르겠다고 했다.', "I asked what letting go meant. Saebyeok had done this rod from start to finish while his grandpa watched silently from the corner. Letting go is work too, his grandpa said — he didn't quite understand it yet."],
      }),
      joint: scene([
        line(S, '열 번 넘게 깎다 버렸어. 마디 소리가 안 맞으면 다시.', 'I carved and threw away more than ten. If the section didn\'t sound right, I started again.'),
        line('', '(새벽이의 손바닥에 굳은살이 박여 있다.)', "(Saebyeok's palms are callused.)"),
        line(P, '손이…', 'Your hands...'),
        line(S, '안 보이게 하고 싶었어. 들 때마다 부러졌던 데가 생각나면 안 되잖아.', "I wanted it invisible. You shouldn't think of where it broke every time you lift it."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_joint', lineKo: '어떻게 했는지는… 다 받고 나서 가르쳐 줄게.', lineEn: "How I did it... I'll teach you after you've taken it." }),
        note: ['이음새를 어떻게 없앴느냐고 물었다. 열 번 넘게 깎다 버렸다고, 들 때마다 부러졌던 데가 생각나면 안 되니까 안 보이게 하고 싶었다고 했다. 손바닥에 굳은살이 박여 있었다.', "I asked how he'd hidden the joint. He'd carved and thrown away more than ten — he wanted it invisible, so I'd never think of the break when I lifted it. His palms were callused."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N02-4 「마지막 죽간」 — 끝내는 자리(탁새벽) · 결말은 정본 하나(`n02_rod`). 앞에서 한 말을 기억한다
  // ═══════════════════════════════════════════
  {
    id: 'n02_4_done', questId: 'N02-4', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '받아. 이음새 찾아봐. 못 찾을걸.', "Take it. Look for the joint. Bet you can't find it."),
        line(P, '…정말 안 보이네.', "...I really can't see it.", { act: 'peer' }),
        line('', '(공방 구석에서 노인이 대패질을 멈추고 이쪽을 본다. 아무 말도 하지 않는다.)', '(In the corner of the workshop the old man stops planing and looks over. He says nothing.)'),
        line(S, '…할아버지 봤어. 봤지? 근데 아무 말도 안 해.', "...Grandpa saw. You saw him look, right? But he isn't saying anything."),
      ], {
        choices: [
          opt('both_hands', '네 할아버지 손이랑 네 손이 다 들어간 대네.', "This rod has your grandpa's hands and yours in it.",
            { stance: 'mid', aff: { [S]: 0.03, [M]: 0.03 }, next: 'both' }),
          opt('your_rod', '이건 네 대야. 네가 마무리했잖아.', "This is your rod. You're the one who finished it.",
            { stance: 'giver', aff: { [S]: 0.05, [M]: -0.02 }, next: 'yours' }),
          opt('grandpa_rod', '오십 년 가르치신 네 할아버지 손이 만든 대지.', 'This rod was made by the hands your grandpa trained for fifty years.',
            { stance: 'other', aff: { [S]: -0.03, [M]: 0.04 }, next: 'grandpa_side' }),
          opt('silence_praise', '아무 말 안 하시는 거, 이제 무슨 뜻인지 알지?', 'You know what it means now, when he says nothing, right?',
            { stance: 'mid', aff: { [S]: 0.04, [M]: 0.02 }, requires: { flag: 'choice.n02_told_reason' }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '(고개를 끄덕인다.) 알아. 태안에서 알려 줬잖아. 칭찬하면 손이 멈출까 봐. …근데 이제 다 깎았으니까 멈춰도 돼. 할아버지, 이제 칭찬해도 돼!',
              lineEn: "(He nods.) I know. You told me in Taean. He's afraid a praised hand will stop. ...But it's all carved now, so it can stop. Grandpa, you're allowed to praise it now!" }),
              note: ['아무 말 안 하는 게 무슨 뜻인지 이제 알지 않느냐고 물었다. 새벽이는 태안에서 들었다며, 이제 다 깎았으니 칭찬해도 된다고 할아버지에게 소리쳤다.', "I asked whether he understood his grandpa's silence now. Saebyeok remembered Taean — and called out that it was all carved, so his grandpa could praise it now."] }),
        ],
        note: ['새벽이가 되살린 아버지의 대를 두 손으로 내밀었다. 이음새를 찾아보라고, 못 찾을 거라고. 공방 구석에서 노인이 대패질을 멈추고 이쪽을 봤지만 아무 말도 하지 않았다.', "Saebyeok held out my father's revived rod in both hands — find the joint, he said, I wouldn't. In the corner the old man stopped planing and looked over, but said nothing."],
      }),
      both: scene([
        line(S, '…응. 할아버지 손이랑 내 손이랑, {player} 씨 아버지 손.', "...Yeah. Grandpa's hands and mine, and your father's, {player}."),
        line('', '(새벽이가 구석을 힐끔 본다. 노인이 대패를 내려놓았다.)', '(Saebyeok glances at the corner. The old man has set the plane down.)'),
        line(S, '그리고 하나 더. 마지막 손질은 같이 했잖아. 그러니까 넷이야.', "And one more. We did the last finishing together. So that's four."),
        line(P, '넷이라…', 'Four...'),
      ], {
        choices: [
          opt('four_hands', '넷이 든 대니까 함부로 못 부러뜨리겠다.', "With four pairs of hands in it, I'd never dare break it.",
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '부러뜨리면 넷이 다 슬퍼해야 돼. 그러니까 부러뜨리지 마. (구석에서 할아버지가 처음으로 웃는다.) …봤어? 지금 웃었어.',
              lineEn: "If it breaks, all four of us have to be sad. So don't break it. (In the corner, his grandfather smiles for the first time.) ...Did you see? He just smiled." }),
              note: ['넷의 손이 든 대니 함부로 못 부러뜨리겠다고 했다. 구석에서 노인이 처음으로 웃었다.', 'With four pairs of hands in it, I said, I would never dare break it. In the corner, the old man smiled for the first time.'] }),
          opt('teach_grain', '이음새 없애는 법, 마지막으로 가르쳐 줘.', 'Teach me one last thing. How to make a joint disappear.',
            { stance: 'mid', aff: { [S]: 0.02 }, end: endTalk({ complete: 'lesson', ending: 'n02_rod',
              lineKo: '결을 맞춰. 마디는 마디끼리, 결은 결끼리. 백 번 맞춰 보고 한 번 붙여. (구석에서 할아버지가 고개를 한 번 끄덕인다.) 할아버지는 이걸 오십 년 했대.',
              lineEn: "Match the grain. Node to node, grain to grain. Fit it a hundred times and glue it once. (In the corner, his grandfather nods once.) Grandpa says he's done this for fifty years." }) }),
          opt('bet_truth', '고백할 게 있어. 처음 학꽁치 내기, 그때 내가 봐줬어.', "I've got a confession. That first halfbeak bet, I let you win.",
            { stance: 'self', aff: { [S]: -0.02 }, requires: { flag: 'choice.n02_lied_bet', notFlag: 'choice.n02_bet_confessed' }, next: 'knew' }),
        ],
        note: ['새벽이는 이 대에 할아버지 손, 자기 손, 내 아버지 손이 들어 있다고 했다. 마지막 손질은 같이 했으니 내 손까지 넷이라고.', "Saebyeok said this rod held his grandpa's hands, his own, and my father's — and mine, since we did the last finishing together. Four."],
      }),
      knew: scene([
        act(S, 'laugh'),
        line(S, '알아. 할아버지가 말해 줬어. 이 대 마무리하던 날 밤에.', 'I know. Grandpa told me. The night we finished this rod.'),
        line(P, '…알고 있었어?', '...You knew?'),
        line(S, '그날 꼬리 접는 거, 창으로 다 봤대.', 'He saw the tail fold that day, from the window.'),
        line(S, '봐준 마음은 나쁜 마음이 아니래. 거짓말은 거짓말이지만. 그러니까 언젠가 말할 거라고 했어. …진짜 말했네.', "He said a heart that lets someone win isn't a bad heart. A lie's still a lie, though. So he said you'd tell me someday. ...And you really did."),
      ], {
        choices: [
          opt('sorry_late', '늦어서 미안. 이제라도 말해서 다행이다.', "Sorry it took so long. I'm glad I finally said it.",
            { stance: 'mid', aff: { [S]: 0.03, [M]: 0.03 }, end: endTalk({ complete: 'first_fish', ending: 'n02_rod',
              lineKo: '(대 손잡이를 쓰다듬는다.) 그럼 벌칙이야. 이 대로 올린 첫 마리, 나한테 제일 먼저 보여 줘. 독도까지 따라갈 거야. 안 된다고 해도.',
              lineEn: "(He strokes the grip.) Then here's your penalty. The first fish you land on this rod, show me before anyone. I'm following you all the way to Dokdo. Even if you say no." }) }),
        ],
        note: ['처음 학꽁치 내기 때 봐줬다고 털어놓았다. 새벽이는 키득 웃으며 이미 안다고 했다. 할아버지가 창으로 다 봤다고, 봐준 마음은 나쁜 마음이 아니라고 했다고.', "I confessed I'd let him win that first halfbeak bet. Saebyeok giggled — he already knew. His grandpa had seen it all from the window, and said a heart that lets someone win isn't a bad one."],
      }),
      yours: scene([
        line(S, '…내 대? 아니야. {player} 씨 아버지 대야. 나는 마무리만 했어.', "...My rod? No. It's your father's rod, {player}. I only finished it."),
        line(P, '그래도 마무리는 네가 했잖아.', 'But you finished it.'),
        line(S, '마무리가 제일 어려워. 할아버지가 그랬어. 손 놓는 것도 일이래.', "Finishing's the hardest part. Grandpa says so. Letting go is work too, he says."),
        line(S, '할아버지는 이번에 그 일을 했대.', 'This time, that was the work he did.'),
      ], {
        choices: [
          opt('pay_maker', '그럼 마무리한 장인한테 제값은 치러야지.', "Then I'd better pay the craftsman who finished it a fair price.",
            { stance: 'giver', aff: { [S]: 0.02 }, end: endTalk({ complete: 'pay', ending: 'n02_rod',
              lineKo: '…장인. 나? (진지하게 값을 부르려다 구석을 본다. 할아버지가 고개를 젓는다.) 반값이래. 나머지 반은 장인이라고 불러 준 걸로 받을게.',
              lineEn: "...Craftsman. Me? (He's about to name a price in earnest when he glances at the corner. His grandfather shakes his head.) Half, he says. I'll take the other half as you calling me a craftsman." }) }),
          opt('letting_go', '손 놓는 일, 네 할아버지한테는 제일 어려우셨겠다.', 'Letting go must have been the hardest thing of all for your grandpa.',
            { stance: 'other', aff: { [S]: 0.01, [M]: 0.04 }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '(구석을 본다. 할아버지가 대패를 쥔 채 고개를 돌린다.) …응. 그래서 이 대엔 할아버지 손도 들어 있어. 안 만진 손.',
              lineEn: "(He looks at the corner. His grandfather turns his head away, still gripping the plane.) ...Yeah. So Grandpa's hands are in this rod too. The hands that didn't touch it." }) }),
          opt('not_thin_now', '얇다고 하셨던 분도 이번엔 아무 말 못 하시네.', "The one who called it thin can't say a word this time.",
            { stance: 'giver', aff: { [S]: 0.03, [M]: -0.02 }, requires: { flag: 'choice.n02_sided_kid' }, end: endTalk({ complete: 'first_fish', ending: 'n02_rod',
              lineKo: '(키득거리다 입을 막는다.) 쉿! 다 들려. …근데 맞아. 이제 얇다고 안 해. 이 대로 첫 마리 올리면 나한테 제일 먼저 보여 줘.',
              lineEn: "(He giggles, then claps a hand over his mouth.) Shh! He can hear. ...But it's true. He doesn't say thin any more. When you land your first fish on this rod, show me first." }) }),
        ],
        note: ['이건 새벽이의 대라고 하자, 귀까지 빨개져서 내 아버지 대라고, 자기는 마무리만 했다고 했다. 그래도 마무리가 제일 어렵고 손 놓는 것도 일이라고, 할아버지는 이번에 그 일을 했다고.', "When I called it his rod, Saebyeok went red to the ears — it was my father's, he'd only finished it. But finishing is hardest, and letting go is work too; this time that was his grandpa's work."],
      }),
      grandpa_side: scene([
        line(S, '…할아버지가 가르친 건 맞아.', '...Grandpa taught me, sure.'),
        line(S, '근데 이번엔 할아버지가 손 하나도 안 댔어. 진짜로.', "But this time he didn't lay a single finger on it. Honestly."),
        line('', '(구석에서 노인이 헛기침을 한다. 새벽이가 그쪽을 쳐다본다.)', '(In the corner the old man clears his throat. Saebyeok looks over at him.)'),
        line(S, '할아버지도 말해 봐. 안 댔잖아.', "Tell them, Grandpa. You didn't touch it."),
      ], {
        choices: [
          opt('my_bad', '미안. 네 손으로 마무리한 대 맞아.', "Sorry. It's a rod your own hands finished.",
            { stance: 'giver', aff: { [S]: 0.04 }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '(그제야 웃는다.) 그치. 할아버지 손은 마음으로만 들어갔어. 그것도 손이래. 할아버지가 그랬어.',
              lineEn: "(Only now does he smile.) Right. Grandpa's hands only went in through his heart. That counts as hands too, he says." }) }),
          opt('ask_grandpa', '탁만수 씨, 한 말씀 해 주시지요.', "Mansu, won't you say something?",
            { stance: 'other', aff: { [M]: 0.02 }, next: 'nod' }),
          opt('not_thin_any', '얇다고 거들었던 거 취소할게. 이 대는 하나도 안 얇아.', "I take back agreeing it was thin. This rod isn't thin at all.",
            { stance: 'giver', aff: { [S]: 0.04, [M]: 0.01 }, requires: { flag: 'choice.n02_sided_grandpa' }, end: endTalk({ complete: 'first_fish', ending: 'n02_rod',
              lineKo: '(눈을 깜박이다 크게 웃는다.) 그거 아직 기억해? …좋아, 취소 받아 줄게. 대신 이 대로 올린 첫 마리, 나한테 제일 먼저 보여 줘.',
              lineEn: "(He blinks, then laughs out loud.) You still remember that? ...Okay, I'll accept. But the first fish you land on this rod, show me before anyone." }) }),
        ],
        note: ['할아버지 손이 만든 대라고 하자, 새벽이는 대를 쥔 손에 힘을 주었다. 가르친 건 할아버지지만 이번엔 손 하나 안 댔다고, 할아버지더러 말해 보라고 했다.', "When I called it his grandpa's handiwork, Saebyeok's grip tightened. His grandpa had taught him, but this time hadn't touched it — he told his grandpa to say so himself."],
      }),
      nod: scene([
        line('', '(노인은 대답하지 않는다. 대패를 내려놓고, 대를 한 번 오래 바라본다. 그러고는 고개를 한 번 끄덕인다.)', "(The old man doesn't answer. He puts the plane down and looks at the rod for one long moment. Then he nods, once.)"),
        line('', '(새벽이가 숨을 멈춘다. 그 끄덕임 하나에 어깨가 천천히 내려간다.)', '(Saebyeok holds his breath. At that single nod, his shoulders slowly come down.)'),
      ], {
        choices: [
          opt('that_was_it', '새벽아, 방금 그거 칭찬이다.', 'Saebyeok, that just now was praise.',
            { stance: 'mid', aff: { [S]: 0.04, [M]: 0.02 }, end: endTalk({ complete: 'both', ending: 'n02_rod',
              lineKo: '(입을 막고 웃는다.) 알아. 할아버지 최고 칭찬이야. 아무 말 안 하는 거. …받아. 이제 진짜 {player} 씨 대야.',
              lineEn: "(He covers his mouth and laughs.) I know. It's Grandpa's highest praise. Saying nothing. ...Take it. Now it's really your rod, {player}." }) }),
        ],
        note: ['탁만수 씨에게 한마디 해 달라고 청했다. 노인은 대답하지 않고 대를 오래 바라보다 고개를 한 번 끄덕였다. 그 끄덕임 하나에 새벽이의 어깨가 내려갔다.', "I asked Tak Mansu to say something. He didn't answer — he looked at the rod a long moment and nodded once. At that single nod, Saebyeok's shoulders came down."],
      }),
    },
  },
];
