/**
 * @file StoryTalkM3.ts
 * @description 290차 — 제3부 M3(「겨울 배」 · 울산 · 포항) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 * 규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = 286차 시범 `StoryTalkN01.ts`.
 *
 * 인물 말투
 *  - 고만석(58 · 고래마루 선장) — 짧게 끊는 반말 · 「~다」 「~해」 「놈」 · 너 · 말 대신 턱짓 · 코웃음.
 *  - 동명항 어촌계(사무실 사람) — 고만석보다 덜 거칠지만 같은 반말 · 짧은 명령 · 이유는 한 줄로. 주인공은 이름을 부르지 않는다.
 *  - 바람(떠돌이 조사) — 자네 · 「~지」 「~게」 · 담배(이 묶음에서 담배는 바람만).
 *  - 정옥선(71 · 만복상회) — 무뚝뚝한 반말 · 너 · 「~라」 · 혀를 찬다.
 *  - 탁만수(78 · 죽간 공방) — 말수 적은 반말 · 너 · 「~마」 · 대나무에 빗댄다.
 * 주인공 — 22세 · 늘 존댓말(해요체 · 합니다체) · 부를 때는 「이름 씨」.
 *
 * 표시: 새 표시를 만들지 않는다 — 옛 받는 답 · 보상 답(`end.offer` · `end.complete`)의 표시가 그대로 남는다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const G = 'go_manseok';
const C = 'coop';
const B = 'baram';
const O = 'okseon';
const T = 'tak_mansu';
const P = 'player';

export const TALKS_M3: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // M3-01 「방어진 입항」 — 고만석
  // ═══════════════════════════════════════════
  {
    id: 'm3_01_offer', questId: 'M3-01', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '…누구냐.', '...Who are you?', { act: 'look_up' }),
        line(P, '속초 동명항 어촌계에서 보내서 왔습니다. 배를 배우라고요.', 'The Dongmyeong co-op in Sokcho sent me. To learn on a boat.'),
        line(G, '들었다. 남의 배 얻어 타는 것도 이번이 마지막이라더군.', "I heard. They said this is your last time riding on someone else's boat."),
        line(P, '…네. 이 배가 고래마루죠?', '...Yes. This is the Goraemaru?'),
        line(G, '그래. 탈 거면 명부에 이름 써. 조끼 입고.', "It is. If you're getting on, write your name in the register. Put on a vest."),
        line(P, '그게 다인가요?', 'Is that all?'),
        line(G, '배에서 뛰면 내린다. 그게 다야.', "Run on my deck and you're off. That's all."),
        line(P, '타고 나면 제가 뭘 하면 될까요?', 'And once I am aboard, what do I do?'),
        line(G, '내가 배 세운 자리에서 방어 한 마리. 그리고 한 항차 버텨.', 'One yellowtail, from the spot where I stop the boat. And last out one whole trip.'),
        line(G, '처음 타는 놈한텐 그게 제일 어렵다.', "For a first-timer, that's the hard part.", { act: 'look_sea' }),
      ], {
        choices: [
          opt('sign', '이름 쓰고 조끼 입겠습니다', "I'll sign and put on a vest", {
            say: ['어촌계 소개로 왔으니 잘 부탁드립니다. 이름 쓰고 조끼 입겠습니다.', "The co-op introduced me, so I hope you'll have me. I'll sign and put on a vest."],
            next: 'sign' }),
          opt('why_list', '명부엔 왜 꼭 이름을 써야 하나요?', 'Why must I write my name in the register?', {
            say: ['그런데 명부에는 왜 꼭 이름을 써야 하나요?', 'But why do I have to write my name in the register?'],
            next: 'list' }),
          opt('rod', '아버지 대로 해도 될까요?', "May I use my father's rod?", {
            say: ['제 대로 해도 될까요? 아버지가 쓰시던 대를 가져왔어요.', "May I use my own rod? I brought the one my father used."],
            next: 'rod' }),
        ],
        note: ['방어진 부두에서 고래마루 선장 고만석 씨를 만났다. 명부에 이름 쓰고 조끼 입고, 배가 세운 자리에서 방어 한 마리를 올리며 한 항차를 버티라는 게 할 말의 전부였다.',
          "On the Bangeojin dock I met Go Manseok, captain of the Goraemaru. Sign the register, wear a vest, land one yellowtail where the boat stops and last out one trip — that was all he had to say."],
      }),
      sign: scene([
        line(G, '소개는 부두에서 끝이다. 배에 오르면 누가 보냈든 다 같은 짐이야.', "Introductions end on the dock. Once you're aboard, whoever sent you, you're cargo like everyone else."),
        line(P, '…짐이요.', '...Cargo.'),
        line(G, '처음 타는 놈은 배 가운데 앉아. 거기가 제일 덜 흔들린다.', 'First-timers sit mid-ship. It rocks least there.'),
        line(G, '방어 한 마리 올리고 한 항차 버티면, 그때부터 짐 말고 사람으로 쳐 주지.', "Land one yellowtail and last a trip, and from then on I'll count you as a person, not cargo."),
        line(P, '알겠습니다.', 'Understood.'),
      ], {
        end: endTalk({ accept: true, offer: 'sign_on' }),
        note: ['고만석 씨는 소개는 부두에서 끝이라며, 배에 오르면 누구든 같은 짐이라고 했다. 방어 한 마리에 한 항차를 버티면 그때 사람으로 쳐 주겠다고.',
          'Go Manseok said introductions end on the dock — aboard, everyone is cargo. One yellowtail and one trip survived, and he would count me as a person.'],
      }),
      list: scene([
        line(G, '바다에서 사람이 없어지면 제일 먼저 꺼내 보는 게 그 종이다.', 'When someone goes missing at sea, that sheet is the first thing anyone pulls out.'),
        line(P, '…', '...'),
        line(G, '누가 탔는지 모르면 누굴 찾아야 하는지도 몰라. 이름 없는 놈은 빠져도 아무도 안 찾는다.', "If nobody knows who was aboard, nobody knows who to look for. Go over the side with no name down and nobody searches."),
        line(P, '그럼 또박또박 써야겠네요.', "Then I'd better write it clearly."),
        line(G, '그래. 다 썼으면 조끼.', "Right. When you're done, the vest."),
      ], {
        choices: [
          opt('write', '또박또박 쓰겠습니다', "I'll write it clearly", {
            end: endTalk({ accept: true, offer: 'ask_list' }),
            note: ['명부는 사람이 없어졌을 때 제일 먼저 꺼내 보는 종이라고 했다. 이름을 또박또박 썼다.',
              'The register is the first thing they pull out when someone goes missing, he said. I wrote my name clearly.'] }),
          opt('seasick', '그런데 멀미하면 내리나요?', 'But do I get put off if I get seasick?', {
            say: ['그런데 멀미하면 내리는 건 아니죠? 그건 자신이 없어서요.', "But you don't put people off for seasickness, do you? I'm not confident about that part."],
            next: 'seasick' }),
        ],
        note: ['명부에 왜 꼭 이름을 써야 하느냐고 물었다. 고만석 씨는 바다에서 사람이 없어지면 제일 먼저 꺼내 보는 게 그 종이라고 했다.',
          'I asked why the register mattered. Go Manseok said it is the first thing anyone pulls out when someone goes missing at sea.'],
      }),
      seasick: scene([
        line(G, '멀미로 내리면 이 배엔 나 혼자 남는다.', "If seasickness got people thrown off, I'd be the only one left on this boat."),
        act(G, 'laugh'),
        line(G, '토할 거면 바람 불어 가는 쪽으로 해. 거꾸로 하면 네 얼굴로 돌아온다.', 'If you have to be sick, do it downwind. The other way and it comes back in your face.'),
        line(P, '…명심하겠습니다.', "...I'll keep that in mind."),
        line(G, '뛰는 놈은 내리고, 토하는 놈은 탄다. 그게 이 배 규칙이야. 명부부터 써.', "Those who run get off; those who throw up stay on. That's the rule on this boat. Register first."),
      ], {
        end: endTalk({ accept: true, offer: 'seasick_joke' }),
        note: ['멀미가 걱정이라고 하자 고만석 씨는 코웃음을 쳤다. 뛰는 사람은 내리고 토하는 사람은 탄다고, 토할 거면 바람 불어 가는 쪽으로 하라고 했다.',
          'When I said I was worried about seasickness, he snorted. Runners get off, the sick stay on — and if I had to throw up, do it downwind.'],
      }),
      rod: scene([
        line(G, '…좋은 대네.', "...That's a good rod.", { act: 'peer' }),
        line(G, '그러니까 조심해.', 'So be careful with it.', { act: 'look_away' }),
        line(P, '조심하라는 건…', 'Careful how...?'),
        line(G, '방어는 대를 꺾으러 무는 놈이다. 드랙 풀어 두고, 버티지 말고 줘.', "Yellowtail bite like they mean to snap the rod. Loosen the drag. Don't fight it — give it line."),
        line(G, '대가 버티면 대가 진다. 아끼는 대면 더 그렇게 써. 이름 쓰고 타.', 'If the rod takes the strain, the rod loses. All the more if you treasure it. Sign and get on.'),
      ], {
        end: endTalk({ accept: true, offer: 'father_rod' }),
        note: ['아버지의 대를 보여 주자 고만석 씨는 좋은 대라고 한 번 보고 눈을 뗐다. 방어는 대를 꺾으러 무니, 아끼는 대일수록 드랙을 풀고 버티지 말라고 했다.',
          "When I showed him my father's rod, he called it a good one and looked away. Yellowtail bite to break rods, he said — the more I treasure it, the looser the drag."],
      }),
    },
  },
  {
    id: 'm3_01_done', questId: 'M3-01', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '…살아 돌아왔네.', '...You made it back alive.', { act: 'look_up' }),
        line(P, '네. 어떻게든요.', 'Yes. Somehow.'),
        line(G, '토한 건 봤다.', 'I saw you throw up.'),
        line(P, '…보셨어요?', '...You saw that?'),
        line(G, '다들 그래. 방어는 올렸고.', 'Everyone does. And you got your yellowtail.'),
        line(G, '다음엔 지깅이다. 대 챙겨 와.', 'Next is jigging. Bring your rods.'),
      ], {
        choices: [
          opt('seasick', '멀미가 심했어요. 그래도 다시 탈게요', "The seasickness was bad. But I'll ride again", {
            say: ['멀미가 심했어요. 그래도 다시 탈게요.', "The seasickness was bad. But I'll ride again."], next: 'seasick' }),
          opt('horizon', '수평선이 움직이는 걸 처음 봤어요', 'I saw the horizon move for the first time', {
            say: ['수평선이 움직이는 걸 처음 봤어요.', 'I saw the horizon move for the first time.'], next: 'horizon' }),
          opt('not_again', '솔직히 다시 타고 싶진 않아요', "Honestly, I don't want to ride again", {
            say: ['솔직히… 다시 타고 싶진 않아요.', "Honestly... I don't want to ride again."], next: 'not_again' }),
          opt('ask_jig', '지깅은 처음인데, 대는 뭘 챙겨요?', "I've never jigged. What rods do I bring?", {
            say: ['지깅은 처음인데요. 대는 뭘 챙겨야 하나요?', "I've never jigged before. What rods should I bring?"], next: 'ask_jig' }),
        ],
        note: ['고래마루에서 내리자 고만석 씨가 살아 돌아왔다며, 토한 것도 봤다고 했다. 다들 그렇다고, 다음엔 지깅이니 대를 챙겨 오라고 했다.',
          "When I stepped off the Goraemaru, Go Manseok said I'd made it back alive — and that he saw me throw up. Everyone does, he said; next is jigging, so bring rods."],
      }),
      seasick: scene([
        line(G, '다시 탄다는 놈은 괜찮아진다. 멀미약은 배에 있다.', "Anyone who says they'll ride again gets better. There's seasick medicine on board."),
        line(P, '다음엔 먹고 탈게요.', "I'll take some before next time."),
        line(G, '멀미는 속이 아니라 눈이 하는 거다. 다음엔 발밑 말고 수평선을 봐.', "Seasickness is in your eyes, not your gut. Next time, look at the horizon, not your feet."),
      ], {
        end: endTalk({ complete: 'seasick', lineKo: '그리고 빈속으로 타지 마라. 빈속이 먼저 뒤집힌다.', lineEn: "And don't board on an empty stomach. An empty stomach turns first." }),
        note: ['멀미가 심했어도 다시 타겠다고 했다. 고만석 씨는 다음 항차 명부에 내 이름을 먼저 적으며, 멀미는 눈이 하는 거니 수평선을 보라고 했다.',
          "I said I'd ride again despite the seasickness. Go Manseok wrote my name first on the next trip's register and told me to watch the horizon — seasickness is in the eyes."],
      }),
      horizon: scene([
        act(G, 'silence'),
        line(G, '…그걸 봤으면 됐다. 배는 그거 보려고 타는 거야.', "...If you saw that, it's enough. That's what you ride a boat for.", { act: 'look_up' }),
        line(P, '육지에선 한 번도 그렇게 보인 적이 없었어요.', 'It never looked like that from land.'),
        line(G, '육지에선 수평선이 가만히 있지. 배에선 수평선이 아니라 네가 움직이는 거다.', "On land the horizon holds still. On a boat it isn't the horizon moving — it's you."),
      ], {
        end: endTalk({ complete: 'horizon', lineKo: '그걸 몸이 알면 멀미도 반은 간다.', lineEn: 'Once your body knows that, half the seasickness goes.' }),
        note: ['수평선이 움직이는 걸 처음 봤다고 하자, 고만석 씨가 처음으로 내 눈을 봤다. 배에선 수평선이 아니라 내가 움직이는 거라고 했다.',
          "When I said I'd seen the horizon move, Go Manseok looked me in the eye for the first time. On a boat, he said, it isn't the horizon moving — it's me."],
      }),
      not_again: scene([
        line(G, '…첫날은 다들 그렇게 말한다. 말한 놈 반은 다음 주에 또 와.', "...Everyone says that on the first day. Half of them are back the next week."),
        line(P, '저는 나머지 반일지도 몰라요.', 'I might be the other half.'),
        line(G, '안 오면 안 오는 거다.', "If you don't come, you don't.", { act: 'look_away' }),
      ], {
        end: endTalk({ complete: 'not_again', lineKo: '그래도 네 이름 아래 칸은 비워 둔다. 지깅은 기다려 주지 않지만, 빈칸은 기다려 준다.', lineEn: "Still, I'll leave the line under your name blank. Jigging won't wait for you, but a blank line will." }),
        note: ['다시 타고 싶지 않다고 솔직하게 말했다. 고만석 씨는 명부를 덮지 않고 펴 둔 채, 내 이름 아래 칸은 비워 두겠다고 했다.',
          "I said honestly that I didn't want to ride again. Go Manseok left the register open and said he'd keep the line under my name blank."],
      }),
      ask_jig: scene([
        line(G, '가진 거 다 가져와. 보고 정한다.', "Bring everything you've got. I'll look and decide."),
        line(P, '새로 사 가야 하는 건 없을까요?', 'Is there anything I should buy new?'),
        line(G, '처음부터 비싼 거 사 오는 놈은 비싼 걸 바다에 빠뜨려.', 'People who buy expensive gear right off drop expensive gear in the sea.', { act: 'shake_head' }),
      ], {
        end: endTalk({ complete: 'ask_jig', lineKo: '그리고 팔 운동이나 해 둬. 지깅은 대보다 팔이 먼저 나간다.', lineEn: 'And work on your arms. In jigging, your arms give out before the rod does.' }),
        note: ['지깅 대를 물었더니 고만석 씨는 가진 걸 다 가져오라고 했다. 지깅은 대보다 팔이 먼저 나간다며 어깨를 한 번 돌려 보였다.',
          'When I asked about jigging rods, Go Manseok told me to bring everything I had. In jigging the arms go before the rod, he said, rolling his shoulder once.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M3-02 「지깅」 — 고만석
  // ═══════════════════════════════════════════
  {
    id: 'm3_02_offer', questId: 'M3-02', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '대 가져왔나.', 'Brought your rods?', { act: 'peer' }),
        line(P, '네. 가진 건 다 가져왔어요.', 'Yes. Everything I have.'),
        line(G, '…됐다. 오늘은 지깅이다.', "...Good enough. Today it's jigging."),
        line(P, '지깅은 어떻게 하는 건데요?', 'How does jigging work?'),
        line(G, '메탈지그를 바닥까지 떨어뜨려. 그다음에 저킹으로 끌어올리는 거다.', 'You drop a metal jig all the way to the bottom. Then you jerk it back up.'),
        line(P, '그럼 끌어올릴 때 무는 건가요?', 'So they bite while it comes up?'),
        line(G, '아니. 폴링에서 문다.', 'No. They bite on the fall.', { act: 'shake_head' }),
        line(G, '겨울 방어다. 40 넘겨 봐.', 'Winter yellowtail. Get me one over forty.'),
        line(P, '40센티요?', 'Forty centimeters?'),
        line(G, '그래. 그 밑은 안 친다.', "Right. Anything under doesn't count."),
      ], {
        choices: [
          opt('keep', '한 마리 올릴 때까지 해 볼게요', "I'll keep at it until I land one", {
            say: ['지깅은 처음이지만, 한 마리 올릴 때까지 해 볼게요.', "It's my first time jigging, but I'll keep at it until I land one."], next: 'keep' }),
          opt('fall', '폴링에서 문다는 게 무슨 뜻이에요?', 'What does it mean, they bite on the fall?', { next: 'fall' }),
          opt('forty', '왜 하필 40이에요?', 'Why forty, of all numbers?', {
            say: ['왜 하필 40이에요? 작은 건 안 되나요?', "Why forty, of all numbers? Small ones don't count?"], next: 'forty' }),
        ],
        note: ['고만석 씨가 오늘은 지깅이라고 했다. 메탈지그를 바닥까지 내렸다가 저킹으로 끌어올리고, 방어는 떨어질 때 문다고 — 겨울 방어 40센티를 넘겨 보라고 했다.',
          'Go Manseok said today was jigging. Drop a metal jig to the bottom, jerk it up, and the yellowtail bite on the fall — he wanted a winter yellowtail over forty centimeters.'],
      }),
      keep: scene([
        line(G, '끝까지 하겠다는 놈이 세 번 올리고 팔이 끝난다.', 'The ones who say they will keep at it are done after three lifts. Their arms give out.'),
        line(P, '세 번이요?', 'Three?'),
        line(G, '힘으로 치니까.', 'Because they jerk with muscle.'),
      ], {
        choices: [
          opt('how', '그럼 어떻게 쳐야 하나요?', 'Then how should I jerk it?', { next: 'wrist' }),
          opt('power', '팔 힘이라면 자신 있는데요', "I'm confident in my arm strength", {
            say: ['팔 힘이라면 자신 있어요. 세게 치면 되는 거죠?', "I'm confident in my arm strength. I just jerk it hard, right?"], next: 'power' }),
        ],
      }),
      wrist: scene([
        line(G, '이렇게.', 'Like this.'),
        line('', '(손목을 두 번, 짧게 튕겨 보인다.)', '(He flicks his wrist twice, short and sharp.)'),
        line(G, '짧게 치고 줄을 감아. 떨어질 때 줄이 멈추거나 옆으로 흐르면 그게 입질이다.', 'Short jerk, then reel. If the line stops or drifts sideways on the fall, that is a bite.'),
        line(P, '그때 감으면 되는 거죠.', "And that's when I reel."),
        line(G, '그래. 40 넘는 놈은 거기서 온다.', 'Right. The ones over forty come right there.'),
      ], {
        end: endTalk({ accept: true, offer: 'keep_at_it' }),
        note: ['고만석 씨는 힘으로 치면 세 번 만에 팔이 끝난다며 손목을 두 번 짧게 튕겨 보였다. 떨어질 때 줄이 멈추거나 옆으로 흐르면 그게 입질이라고.',
          'Jerk with muscle and your arms are done in three, Go Manseok said, and showed me two short flicks of the wrist. If the line stops or drifts on the fall, that is the bite.'],
      }),
      power: scene([
        act(G, 'silence'),
        line(G, '…세게 치는 놈 지그는 춤을 안 춘다. 바닥만 긁고 끝나.', "...A hard jerker's jig doesn't dance. It just scrapes the bottom."),
        line(G, '힘 자랑은 부두에서 해라.', 'Save the muscle for the dock.'),
        line(P, '…그래도 해 볼게요.', "...I'll give it a try anyway."),
        line(G, '해 봐. 세 번 올리면 알 거다. 팔이 먼저 우는지, 방어가 먼저 무는지. 울면 그때 다시 와.', "Try it. After three lifts you'll know — whether your arms cry first or the yellowtail bites first. If they cry, come back."),
      ], {
        end: endTalk({ accept: true, offer: 'power' }),
        note: ['팔 힘이라면 자신 있다고 했다가 핀잔을 들었다. 세게 치는 지그는 춤을 안 추고 바닥만 긁는다고, 팔이 울면 그때 다시 오라고 했다.',
          'I bragged about my arm strength and got scolded. A jig jerked hard does not dance, only scrapes bottom — come back when my arms start crying, he said.'],
      }),
      fall: scene([
        line(G, '지그가 가라앉는 동안이다.', 'While the jig is sinking.'),
        line(G, '저킹으로 튀어 오른 지그가 힘 빠진 고기처럼 떨어질 때, 방어가 덮친다.', 'The jig jumps on the jerk, then flutters down like a tired fish — that is when the yellowtail hit.'),
        line(P, '그럼 떨어질 때도 손을 놓으면 안 되겠네요.', "Then I can't let go while it falls, either."),
        line(G, '그래. 줄이 늘어지면 입질을 못 느낀다. 살짝 잡고 따라 내려가. 그게 반이야.', "Right. Slack line and you won't feel the bite. Hold it lightly and follow it down. That's half of it."),
        line(G, '내려 봐.', 'Drop it.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_fall' }),
        note: ['폴링이 뭐냐고 물었다. 튀어 오른 지그가 힘 빠진 고기처럼 떨어질 때 방어가 덮친다고, 그래서 떨어질 때 줄을 살짝 잡고 따라 내려가라고 했다.',
          'I asked what the fall meant. The jig flutters down like a tired fish and the yellowtail strike, he said — so hold the line lightly and follow it down.'],
      }),
      forty: scene([
        line(G, '숫자는 핑계다.', "The number's an excuse."),
        line(P, '핑계요?', 'An excuse?'),
        line(G, '작은 놈은 아무렇게나 해도 문다. 운으로도 올라와.', 'Small ones bite however you do it. Luck alone brings them up.'),
        line(G, '40 넘는 놈은 리듬이 맞아야 온다. 네 리듬을 보려는 거다.', 'The ones over forty only come when the rhythm is right. I want to see your rhythm.', { act: 'look_sea' }),
        line(G, '운 말고 손으로 올려 봐.', 'Bring one up with your hands, not your luck.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_forty' }),
        note: ['왜 하필 40이냐고 물었다. 작은 놈은 운으로도 올라오지만 40 넘는 놈은 리듬이 맞아야 온다고, 내 리듬을 보려는 거라고 했다.',
          'I asked why forty. Small ones come up on luck, he said, but the ones over forty only come to the right rhythm — he wanted to see mine.'],
      }),
    },
  },
  {
    id: 'm3_02_done', questId: 'M3-02', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(P, '43센티예요.', 'Forty-three centimeters.'),
        line(G, '43.', 'Forty-three.', { act: 'peer' }),
        line(G, '됐다.', "That'll do."),
        line(P, '…그게 다예요?', "...That's it?"),
        line(G, '이 대 가져가. 지깅용이다.', "Take this rod. It's for jigging."),
        line(G, '네 대로 저킹하면 초릿대 나간다. 지깅은 이걸로 해.', "Jerk with your own rod and you'll snap the tip. Jig with this."),
        line(G, '이제부턴 네 손으로 익혀 가면 된다.', "From here on, it's yours to learn by hand."),
      ], {
        choices: [
          opt('rhythm', '잡아 준 리듬, 팔이 기억했어요', 'My arms remembered the rhythm you showed me', {
            say: ['고만석 씨가 잡아 준 리듬, 팔이 기억했어요.', 'The rhythm you set for me, Manseok — my arms remembered it.'], next: 'rhythm' }),
          opt('arms', '팔이 아직 남았어요. 한 번 더 던질게요', "I've still got arms left. One more cast", {
            say: ['팔이 아직 남았어요. 한 번 더 던질게요.', "My arms have some left. I'll cast once more."], next: 'arms' }),
          opt('father_hand', '손을 잡아 주셨을 때, 아버지 생각이 났어요', 'When you took my hand, I thought of my father', {
            say: ['아까 손을 잡아 주셨을 때… 아버지 생각이 났어요.', 'Back there, when you took my hand... I thought of my father.'], next: 'father_hand' }),
        ],
        note: ['43센티 방어를 보여 주자 고만석 씨는 됐다고만 했다. 내 대로 저킹하면 초릿대가 나간다며 손잡이가 닳은 지깅 대를 내줬다.',
          'When I showed him the forty-three-centimeter yellowtail, Go Manseok only said it would do. My own rod would snap at the tip, he said, and handed me a jigging rod with a worn grip.'],
      }),
      rhythm: scene([
        line(G, '기억했으면 됐다. 다음엔 안 잡아 준다.', "If you remember, that's enough. Next time I won't hold it for you."),
        line(P, '고만석 씨 리듬이랑 똑같이 하려고 했어요.', 'I tried to copy your rhythm exactly.'),
        line(G, '리듬은 사람마다 다르다. 내 걸 가르친 게 아니라 네 거에서 군더더기를 뺀 거다.', "Rhythm differs for everyone. I didn't teach you mine — I trimmed the fat off yours.", { act: 'shake_head' }),
      ], {
        end: endTalk({ complete: 'rhythm', lineKo: '다음 항차에 팔이 덜 아프면 그게 증거야.', lineEn: "If your arms hurt less on the next trip, that's the proof." }),
        note: ['잡아 준 리듬을 팔이 기억했다고 했다. 고만석 씨는 자기 리듬을 가르친 게 아니라 내 것에서 군더더기를 뺀 거라고 했다.',
          "I said my arms remembered the rhythm. Go Manseok said he hadn't taught me his — he'd only trimmed the fat off mine."],
      }),
      arms: scene([
        act(G, 'silence'),
        line(G, '…젊네. 던져.', "...Young, aren't you. Go on, cast."),
        line(G, '대는 이걸로.', 'With this rod.'),
        line(P, '네.', 'Right.'),
      ], {
        end: endTalk({ complete: 'arms', lineKo: '그래도 마지막 한 번은 남겨 둬라. 팔 다 쓴 놈은 대물 걸리면 못 버틴다. 바다는 꼭 지쳤을 때 큰 걸 보낸다.', lineEn: "But keep one last cast in reserve. Spend your arms and you can't hold a big one. The sea always sends the big one when you're tired." }),
        note: ['팔이 남았다며 한 번 더 던졌다. 그날 조황이 배에서 두 번째로 좋았고, 고만석 씨는 마지막 한 번은 남겨 두라고 했다.',
          'With arms to spare, I cast again. My catch that day was the second best on the boat, and Go Manseok told me to always keep one last cast in reserve.'],
      }),
      father_hand: scene([
        act(G, 'silence'),
        line(G, '…배 위에서 그런 소리 하지 마라. 눈에 소금물 들어간다.', "...Don't say things like that on a boat. You'll get salt water in your eyes.", { act: 'look_away' }),
        act(G, 'silence'),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'father_hand', lineKo: '손이 기억하는 건 오래 간다. 그 리듬 잊지 마. 누가 잡아 줬는지도.', lineEn: "What the hands remember lasts. Don't forget that rhythm. Or who held your hand for it." }),
        note: ['손을 잡아 줬을 때 아버지 생각이 났다고 했다. 고만석 씨는 돌아서서 엔진 쪽으로 갔고, 한참 엔진 소리만 났다.',
          'I said I thought of my father when he took my hand. Go Manseok turned and walked toward the engine, and for a long time there was only its sound.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M3-03 「실기 시험」 — 동명항 어촌계
  // ═══════════════════════════════════════════
  {
    id: 'm3_03_offer', questId: 'M3-03', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '필기 붙었다며. 이제 실기다.', 'Heard you passed the written. Now the practical.'),
        line(P, '실기는 뭘 보나요?', "What's on the practical?"),
        line(C, '계류, 변침, 인명구조. 세 가지.', 'Mooring, course change, rescue. Three things.'),
        line(P, '계류는 부두에 배를 대는 거고… 변침은 방향을 바꾸는 거죠?', "Mooring is bringing her alongside the dock... and a course change is turning, right?"),
        line(C, '그래. 말로는 쉽다.', 'Right. Easy to say.', { act: 'nod' }),
        line(C, '소형선박조종사 실기다. 붙으면 배를 몰 자격이 생긴다.', "It's the small-vessel operator practical. Pass it and you're qualified to handle a boat."),
        line(P, '…떨어지면요?', '...And if I fail?'),
        line(C, '한 번 떨어져도 돼.', 'You can fail once.'),
        line(C, '두 번은 안 봐 준다.', 'Twice, no mercy.'),
      ], {
        choices: [
          opt('trust', '한 번은 떨어져도 된다는 말, 믿을게요', "I'll trust that one failure is allowed", {
            say: ['한 번은 떨어져도 된다는 말, 믿고 해 볼게요.', "I'll trust what you said — that one failure is allowed — and give it a go."], next: 'trust' }),
          opt('rescue', '인명구조는 어떻게 보나요?', 'How do they test the rescue?', {
            say: ['인명구조는 어떻게 보나요? 사람이 진짜 물에 빠지나요?', 'How do they test the rescue? Does a real person go in the water?'], next: 'rescue' }),
          opt('twice', '두 번째도 떨어지면 어떻게 돼요?', 'What happens if I fail twice?', { next: 'twice' }),
        ],
        note: ['어촌계에서 이제 실기라고 했다. 계류, 변침, 인명구조를 보는 소형선박조종사 실기로, 한 번은 떨어져도 되지만 두 번은 안 봐준다고 했다.',
          'The co-op said it was time for the practical — the small-vessel operator test of mooring, course change and rescue. Failing once is allowed; twice, no mercy.'],
      }),
      trust: scene([
        line(C, '믿으라고 한 말 아니다. 떨어져 보라고 한 말이다.', "I didn't say it so you'd trust it. I said it so you'd try failing."),
        line(P, '떨어져 보라고요?', 'Try failing?'),
        line(C, '떨어져 봐야 어디서 손이 떠는지 안다. 두 번째부터는 핑계가 없어.', 'Only by failing do you learn where your hands shake. After that, no excuses.'),
        line(C, '첫 번째 떨어진 자리를 기억해 두는 게 두 번째 시험이다. 가서 부두부터 봐 둬.', 'Remembering where you failed the first time is the second test. Go take a look at the dock.'),
      ], {
        end: endTalk({ accept: true, offer: 'trust_once' }),
        note: ['한 번은 떨어져도 된다는 말을 믿겠다고 했더니, 믿으라는 게 아니라 떨어져 보라는 말이었다고 했다. 첫 번째 떨어진 자리를 기억하는 게 두 번째 시험이라고.',
          'I said I would trust that one failure was allowed. It was not meant to be trusted, I was told, but to make me try failing — remembering where I fell is the second test.'],
      }),
      rescue: scene([
        line(C, '사람 대신 부이 하나를 던진다. 그걸 사람이라고 생각하고 건져.', 'They throw a buoy in place of a person. Treat it as a person and pull it out.'),
        line(P, '부이라면 좀 마음이 놓이네요.', "A buoy — that's a relief."),
        line(C, '마음 놓지 마. 바람을 안고 다가가고, 가까워지면 기어를 빼.', "Don't relax. Come at it into the wind, and when you're close, take it out of gear."),
        line(P, '기어는 왜요?', 'Why out of gear?'),
        line(C, '프로펠러가 사람을 다치게 한다. 그거 하나 틀리면 나머지를 다 잘해도 떨어진다. 잊지 말고 가.', "The propeller hurts people. Get that one wrong and you fail, however well you do the rest. Don't forget it."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_rescue' }),
        note: ['인명구조는 사람 대신 부이를 건진다고 했다. 바람을 안고 다가가 가까워지면 기어를 빼야 한다고, 프로펠러가 사람을 다치게 한다고.',
          'For the rescue they throw a buoy instead of a person. Approach into the wind and take it out of gear when close, I was told — the propeller hurts people.'],
      }),
      twice: scene([
        line(C, '그럼 한 철 늦는 거지. 면허는 안 도망간다.', "Then you're a season late. The license won't run away."),
        line(C, '대신 네 배가 한 철 늦게 온다.', 'But your own boat comes a season later.'),
        line(P, '…그건 좀 무섭네요.', "...That's a little scary."),
        line(C, '겁주려는 말 아니다. 두 번째엔 손이 덜 떤다. 다들 그랬어.', "I'm not trying to scare you. Your hands shake less the second time. Everyone's did."),
      ], {
        choices: [
          opt('practice', '계류부터 연습해 둘게요', "I'll practice mooring first", {
            end: endTalk({ accept: true, offer: 'ask_twice' }),
            note: ['두 번째에도 떨어지면 한 철 늦는 거라고, 두 번째엔 손이 덜 떤다고 했다. 떨어질 걱정은 접고 계류부터 연습하기로 했다.',
              'Fail twice and I lose a season, I was told — but hands shake less the second time. I put the worry aside and decided to practice mooring first.'] }),
          opt('scrape', '부두를 긁으면 수리비는요?', 'And if I scrape the dock, who pays?', {
            say: ['그럼 연습하다 부두를 긁으면, 수리비는 어촌계에서 내 주시나요?', 'So if I scrape the dock while practicing, does the co-op pay for repairs?'], next: 'scrape' }),
        ],
        note: ['두 번째도 떨어지면 어떻게 되느냐고 물었다. 면허는 안 도망가지만 내 배가 한 철 늦게 온다고 했다.',
          "I asked what happens if I fail twice. The license won't run away, I was told, but my own boat will come a season later."],
      }),
      scrape: scene([
        line(C, '시험장 부두는 긁히라고 있는 거다.', 'The test-site dock is there to be scraped.', { act: 'look_away' }),
        line(C, '네 배 생기면 그땐 다 네 돈이다. 그러니까 남의 부두 긁을 때 많이 배워 둬.', "Once you've a boat of your own, it's all your money. So learn plenty while it's someone else's dock."),
        line(C, '긁어도 되는 날은 오늘뿐이야. 가 봐.', "Today's the only day scraping is allowed. Go on."),
      ], {
        end: endTalk({ accept: true, offer: 'scrape_joke' }),
        note: ['부두를 긁으면 수리비는 어촌계가 내 주느냐고 농담을 했다. 시험장 부두는 긁히라고 있는 거라며, 긁어도 되는 날은 오늘뿐이라고 했다.',
          'I joked about whether the co-op would pay if I scraped the dock. The test dock is there to be scraped, I was told — today is the only day it is allowed.'],
      }),
    },
  },
  {
    id: 'm3_03_done', questId: 'M3-03', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(P, '합격했어요.', 'I passed.'),
        line(C, '봤다. 소형선박조종사.', 'I saw. Small-vessel operator.', { act: 'peer' }),
        line(C, '이제 배를 몰 자격이 있다.', "You're qualified to handle a boat now."),
        line(P, '…아직 실감이 안 나요.', "...It hasn't sunk in yet."),
        line(C, '계에서 축하금이다. 배값엔 한참 모자라지만.', "Here's a gift from the co-op. Nowhere near the price of a boat, mind."),
      ], {
        choices: [
          opt('failed_once', '한 번 떨어지고, 두 번째에 됐어요', 'I failed once and passed the second time', {
            say: ['한 번 떨어졌어요. 두 번째에 됐고요.', 'I failed once. Passed on the second try.'], next: 'failed_once' }),
          opt('boat_dream', '이제 제 배를 갖고 싶어요', 'Now I want a boat of my own', {
            say: ['이제… 제 배를 갖고 싶어요.', 'Now... I want a boat of my own.'], next: 'boat_dream' }),
          opt('show_okseon', '합격증은 정옥선 씨께 먼저 보여 드릴게요', "I'll show the certificate to Okseon first", {
            say: ['합격증은 정옥선 씨께 먼저 보여 드리려고요.', "I'm going to show the certificate to Okseon first."], next: 'show_okseon' }),
        ],
        note: ['실기에 붙었다. 어촌계에서 축하금 봉투를 내주며, 배값엔 한참 모자란다고 했다.',
          'I passed the practical. The co-op handed me an envelope of congratulation money — nowhere near the price of a boat, they said.'],
      }),
      failed_once: scene([
        line(C, '그게 정상이다. 한 번에 붙은 놈이 배를 더 잘 긁는다.', 'That is normal. The ones who pass first try scrape more boats later.'),
        line(P, '계류에서 부두를 그었어요.', 'I scraped the dock mooring.'),
        line(C, '떨어진 날 뭘 틀렸는지 적어 둬라.', 'Write down what you got wrong the day you failed.'),
      ], {
        end: endTalk({ complete: 'failed_once', lineKo: '계류에서 한 번 긁은 놈은 평생 계류 앞에서 숨을 한 번 더 고른다. 그 숨이 배를 살린다.', lineEn: 'Anyone who scraped once mooring takes one more breath before every mooring for life. That breath saves boats.' }),
        note: ['한 번 떨어지고 두 번째에 붙었다고 했다. 떨어진 날 뭘 틀렸는지 적어 두라고, 그 한 번 더 고르는 숨이 배를 살린다고 했다.',
          'I said I failed once and passed the second time. Write down what I got wrong, I was told — that extra breath before mooring saves boats.'],
      }),
      boat_dream: scene([
        line(C, '돈부터 모아. 배는 사는 게 아니라 버티는 거다.', "Save money first. A boat isn't something you buy — it's something you keep going."),
        line(P, '버티는 거요?', 'Keep going?'),
        line(C, '봉투에 중고 선박 시세표 끼워 뒀다. 보고 놀라지 마라.', "I tucked a used-boat price list in the envelope. Don't faint when you see it."),
      ], {
        end: endTalk({ complete: 'boat_dream', lineKo: '배값보다 무서운 게 유지비다. 기름, 검사, 수리. 그래도 갖고 싶으면 그때 다시 말해.', lineEn: "Scarier than the price is the upkeep. Fuel, inspections, repairs. If you still want one after that, tell me again." }),
        note: ['내 배를 갖고 싶다고 했다. 배는 사는 게 아니라 버티는 거라며, 축하금 봉투에 중고 선박 시세표가 끼워져 있었다.',
          'I said I wanted a boat of my own. A boat is not bought but kept going, I was told — and a used-boat price list was tucked in the envelope.'],
      }),
      show_okseon: scene([
        line(C, '그래라. 네 보증 선 사람이 그 사람이다.', "Do that. She's the one who vouched for you.", { act: 'nod' }),
        act(C, 'silence'),
        line(P, '좋아하실까요?', 'Do you think she will be pleased?'),
      ], {
        end: endTalk({ complete: 'show_okseon', lineKo: '가거든 합격증보다 얼음부터 날라. 그 사람은 축하는 손으로 하는 거라고 생각하는 사람이니까.', lineEn: "When you go, carry her ice before you show the certificate. She thinks congratulations are done with your hands." }),
        note: ['합격증을 정옥선 씨께 먼저 보여 드리겠다고 했다. 어촌계 사람은 내 보증을 선 사람이 그분이라며, 가거든 얼음부터 나르라고 했다.',
          "I said I'd show the certificate to Jeong Okseon first. She was the one who vouched for me, I was told — carry her ice before anything else."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M3-04 「덕장」 — 바람
  // ═══════════════════════════════════════════
  {
    id: 'm3_04_offer', questId: 'M3-04', at: 'offer', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '자네 왔나. 저기 좀 보게.', "You're here. Take a look over there."),
        line(P, '…장대만 잔뜩 서 있네요.', '...Just rows of bare poles.'),
        line(B, '덕장이야. 비었어.', 'Drying racks. Empty.'),
        line(P, '원래는 뭘 거는 데예요?', 'What goes on them, normally?'),
        line(B, '과메기. 청어를 걸어 말리던 데지. 그런데 청어가 안 들어.', "Gwamegi. This is where they hung herring to dry. But the herring aren't coming."),
        act(B, 'cig_light'),
        act(B, 'cig_puff'),
        line(B, '바다가 바뀌면 사람이 바뀌어야지.', 'When the sea changes, people have to change.'),
        line(P, '…무슨 말씀이세요?', '...What do you mean?'),
        line(B, '건조랑 숙성, 배워 둘 텐가? 덕장에 걸 놈을 자네가 세 마리 낚아 오고, 말리는 걸 처음부터 끝까지 한 번 해 보는 거야.',
          'Want to learn drying and curing? You catch three fish for the racks, and see one drying through from start to finish.'),
      ], {
        choices: [
          opt('learn', '배울게요. 빈 덕장이 아깝네요', "I'll learn. Empty racks are a waste", {
            say: ['배울게요. 빈 덕장이 아깝네요.', "I'll learn. It's a waste, leaving racks empty."], next: 'learn' }),
          opt('herring', '청어가 왜 안 드는 거예요?', "Why aren't the herring coming?", {
            say: ['청어가 왜 안 드는 거예요? 원래는 많았어요?', "Why aren't the herring coming? Were there lots, once?"], next: 'herring' }),
          opt('cart', '리어카로 여기까지 오신 거예요?', 'You came all the way here by cart?', {
            say: ['리어카로 여기까지 오신 거예요? 덕장 일도 하세요?', 'You came all the way here by cart? Do you work the racks too?'], next: 'cart' }),
        ],
        note: ['포항 덕장은 청어가 안 들어 비어 있었다. 바람 씨는 담배를 피우며 바다가 바뀌면 사람이 바뀌어야 한다고, 덕장에 걸 물고기 세 마리를 낚고 말리는 일을 끝까지 해 보라고 했다.',
          'The Pohang drying racks stood empty — the herring had stopped coming. Smoking, Baram said that when the sea changes people must change, and told me to catch three fish for the racks and see one drying through to the end.'],
      }),
      learn: scene([
        line(B, '아깝지. 덕장은 비어 있으면 그냥 장대야. 먼저 걸 놈을 세 마리 낚아 오게. 말리는 건 그다음이야.', 'It is a waste. Empty, a rack is just a pole. First, catch three fish to hang. Drying comes after.'),
        line(P, '말리는 건 금방 되나요?', 'Does the drying go quickly?'),
        line(B, '서두르면 안 마르고 상해. 바람한테 맡기는 일이거든.', "Rush it and it spoils before it dries. It's work you leave to the wind."),
        line(P, '…바람한테요? 바람 씨 말씀이에요?', '...To the wind? Or to you, Baram?'),
        act(B, 'laugh'),
        line(B, '둘 다지.', 'Both.'),
      ], {
        end: endTalk({ accept: true, offer: 'learn_dry' }),
        note: ['배우겠다고 했다. 바람 씨는 먼저 걸 물고기 세 마리를 낚아 오라고, 말리는 건 바람에 맡기는 일이라 서두르면 상한다고 했다.',
          'I said I would learn. Baram told me to catch the three fish first — drying is left to the wind, and rushing it spoils the fish.'],
      }),
      herring: scene([
        line(B, '많았지. 과메기는 원래 청어로 말리던 거야.', 'There used to be plenty. Gwamegi was always made from herring.'),
        line(B, '청어가 안 들면서 꽁치로 넘어갔고, 이제 그것도 들쭉날쭉해.', 'When the herring stopped coming, it moved to saury, and now even that comes and goes.'),
        line(P, '왜 그렇게 된 건데요?', 'Why did that happen?'),
        line(B, '물이 데워지면 고기 길이 바뀌어. 사람이 바다를 못 바꾸니까 사람이 바뀌는 거지.', "When the water warms, the fish change their roads. People can't change the sea, so people change.", { act: 'look_sea' }),
        line(B, '그러니까 배워 두게. 뭐든 말릴 줄 알게.', 'So learn it. Learn to dry whatever comes.'),
      ], {
        choices: [
          opt('now', '지금 바다에서 나는 걸로 해 볼게요', "I'll try with what the sea gives now", {
            say: ['그럼 지금 바다에서 올라오는 걸로 해 볼게요.', "Then I'll try with whatever the sea is giving now."],
            end: endTalk({ accept: true, offer: 'ask_herring' }),
            note: ['청어 대신 지금 바다에서 올라오는 것으로 말려 보기로 했다.', 'Instead of herring, I decided to dry whatever the sea is giving now.'] }),
          opt('doubt', '저는 낚는 사람인데, 말리는 것까지요?', "I catch fish — do I have to dry them too?", {
            say: ['그런데 저는 낚는 사람인데, 말리는 것까지 해야 하나요?', "But I'm someone who catches fish. Do I have to dry them too?"], next: 'doubt' }),
        ],
        note: ['청어가 왜 안 드느냐고 물었다. 바람 씨는 물이 데워지면 고기 길이 바뀌고, 사람이 바다를 못 바꾸니 사람이 바뀌는 거라고 했다.',
          "I asked why the herring weren't coming. When the water warms the fish change their roads, Baram said — people can't change the sea, so people change."],
      }),
      doubt: scene([
        line(B, '낚는 사람이니까 해야지.', "You have to, because you're the one who catches them."),
        line(B, '잡아 놓고 못 다루면 바다한테 빌린 걸 버리는 거야.', "Catch something and not know how to handle it, and you're throwing away what you borrowed from the sea."),
        line(P, '…빌린 거요.', '...Borrowed.'),
        line(B, '그리고 말리는 걸 알면 낚시도 달라져. 어떤 놈이 잘 마르는지 알게 되거든. 손해 보는 장사 아니야.', "And once you know drying, your fishing changes too. You learn which fish dry well. It's not a losing deal."),
      ], {
        end: endTalk({ accept: true, offer: 'doubt_dry' }),
        note: ['낚는 사람이 말리는 것까지 해야 하느냐고 했더니, 바람 씨는 잡아 놓고 못 다루면 바다에게 빌린 걸 버리는 거라고 했다.',
          "When I asked whether someone who catches fish has to dry them too, Baram said that catching what you can't handle is throwing away what you borrowed from the sea."],
      }),
      cart: scene([
        line(B, '바람이 어디 정해 놓고 부나. 리어카 세운 데가 오늘 내 자리야.', 'Does the wind decide in advance where it will blow? Wherever I park the cart is my spot for the day.'),
        act(B, 'cig_puff'),
        line(B, '덕장 일은 안 해. 덕장 앞에 서 있는 거지.', "I don't work the racks. I just stand in front of them."),
        line(P, '그럼 저는요?', 'And me?'),
        line(B, '내 얘기는 됐고, 자네는 말리는 거나 배우게. 그게 오늘 일이야.', "Enough about me. You learn the drying. That's today's work."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_baram' }),
        note: ['리어카로 여기까지 왔느냐고 묻자, 바람 씨는 리어카 세운 데가 오늘 자기 자리라고 연기를 길게 뺐다. 자기 얘기는 됐으니 말리는 거나 배우라고 했다.',
          'When I asked if he had come all this way by cart, Baram let out a long stream of smoke — wherever the cart stops is his spot for the day. Enough about him, he said; learn the drying.'],
      }),
    },
  },
  {
    id: 'm3_04_done', questId: 'M3-04', at: 'complete', npcId: B, start: 'start',
    nodes: {
      start: scene([
        line(B, '말렸네.', 'You dried them.', { act: 'peer' }),
        line(P, '네. 생각보다 훨씬 오래 걸렸어요.', 'Yes. It took far longer than I thought.'),
        act(B, 'cig_light'),
        line(B, '그게 과메기야, 이제. 청어가 아니어도.', "That's gwamegi now. Even if it isn't herring."),
        line(P, '청어가 아닌데도 과메기라고 해도 돼요?', "It's still gwamegi, even though it's not herring?"),
        line(B, '걸고 기다려서 말린 거면 과메기지. 기다릴 줄 아는 사람이 됐어.', "If you hung it, waited, and it dried, it's gwamegi. You've become someone who can wait."),
      ], {
        choices: [
          opt('wait', '기다리는 게 제일 어려웠어요', 'The waiting was the hardest part', { next: 'wait' }),
          opt('change', '바다가 바뀌면… 그 말, 오래 남을 것 같아요', 'When the sea changes... that will stay with me', {
            say: ['바다가 바뀌면 사람이 바뀌어야 한다는 말, 오래 남을 것 같아요.', 'What you said — that when the sea changes, people must change — I think it will stay with me.'], next: 'change' }),
          opt('herring_back', '청어가 다시 들면 그때도 불러 주세요', 'If the herring come back, call me then too', {
            say: ['청어가 다시 들면, 그때도 불러 주세요.', 'If the herring ever come back, call me then too.'], next: 'herring_back' }),
        ],
        note: ['말린 것을 보여 주자 바람 씨는 청어가 아니어도 이제 그게 과메기라고 했다. 기다릴 줄 아는 사람이 됐다고.',
          "When I showed him what I'd dried, Baram said it was gwamegi now, herring or not. I'd become someone who can wait."],
      }),
      wait: scene([
        line(B, '그래서 다들 못 해. 자네는 했잖아.', "That's why most people can't. You did."),
        act(B, 'cig_puff'),
        line(B, '잡는 건 하루고 말리는 건 한참이야. 그 한참을 버틴 사람한테만 과메기가 남아.', 'Catching takes a day; drying takes ages. Gwamegi is left only for those who hold out through all of it.'),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'wait', lineKo: '한 점 먹어 봐. 왜 기다렸는지 혀가 알 거야.', lineEn: 'Have a bite. Your tongue will know why you waited.' }),
        note: ['기다리는 게 제일 어려웠다고 했다. 바람 씨는 그 한참을 버틴 사람한테만 과메기가 남는다며 한 점 먹어 보라고 했다.',
          'I said the waiting was hardest. Gwamegi is left only for those who hold out, Baram said, and told me to have a bite.'],
      }),
      change: scene([
        line(B, '남겨. 나도 누구한테 들은 말이야.', 'Keep it. I heard it from someone too.'),
        act(B, 'cig_out'),
        line(P, '누구한테 들으셨는데요?', 'Who did you hear it from?'),
        line(B, '좋은 말은 주인이 없어. 들은 사람이 쓰면 그 사람 거야.', 'Good words have no owner. Whoever hears them and uses them, they belong to them.'),
      ], {
        end: endTalk({ complete: 'change', lineKo: '다음 항구에서 누가 막혀 있으면, 그땐 자네가 해 줘.', lineEn: "If someone's stuck at the next port, then you be the one to say it." }),
        note: ['그 말이 오래 남을 것 같다고 했다. 바람 씨는 담배를 끄고 리어카를 끌며, 좋은 말은 주인이 없으니 다음엔 내가 해 주라고 했다.',
          'I said his words would stay with me. Baram put out his cigarette and took up his cart — good words have no owner, he said, so next time I should be the one to say them.'],
      }),
      herring_back: scene([
        line(B, '청어가 다시 들지는 바다가 정하지. 나는 몰라.', "Whether the herring come back is the sea's call. I don't know.", { act: 'look_sea' }),
        line(P, '그래도요.', 'Still.'),
        line(B, '그래도 그때 내가 여기 있으면 부를게. 없으면 덕장 주인이 부르겠지.', "Still, if I'm here then, I'll call you. If not, the rack owner will."),
      ], {
        end: endTalk({ complete: 'herring_back', lineKo: '기다릴 줄 아는 사람은 다시 불려. 그게 덕장 법이야.', lineEn: "People who can wait get called back. That's the law of the racks." }),
        note: ['청어가 다시 들면 불러 달라고 했다. 바람 씨는 빈 담뱃갑을 흔들어 보며, 기다릴 줄 아는 사람은 다시 불린다고 했다.',
          'I asked him to call me if the herring came back. Shaking an empty cigarette packet, Baram said people who can wait get called back.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M3-05 「해무」 — 고만석
  // ═══════════════════════════════════════════
  {
    id: 'm3_05_offer', questId: 'M3-05', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '오늘 나간다.', "We're going out today."),
        line(P, '날씨가 좀 이상한데요. 바다 위가 뿌예요.', "The weather's a bit strange. It's hazy over the water."),
        line(G, '해무다.', 'Sea fog.', { act: 'look_sea' }),
        line(G, '저게 들어오면 앞이 안 보여. 십 미터 앞도.', "When that rolls in, you can't see ahead. Not ten meters."),
        line(P, '그래도 나가요?', 'And we still go out?'),
        line(G, '나간다. 덮기 전에 두 마리는 올려야지.', 'We go. Two fish up before it closes in.'),
        line(G, '그다음은 네가 정해. 더 갈래, 돌아갈래.', 'After that, you decide. Push on, or turn back.'),
        line(P, '…제가요?', '...Me?'),
        line(G, '그래. 너.', 'Yes. You.'),
      ], {
        choices: [
          opt('back', '돌아갈게요. 고기는 다음에 낚으면 돼요', "I'll turn back. Fish can wait", {
            say: ['안개가 보이면 돌아가겠습니다. 고기는 다음에 낚으면 돼요.', "When I see the fog, I'll turn back. The fish can wait for another day."], next: 'back' }),
          opt('fog', '해무는 얼마나 빨리 덮쳐요?', 'How fast does sea fog close in?', { next: 'fog' }),
          opt('push', '조금만 더 가 보면 안 될까요?', "Couldn't we push on a little?", {
            say: ['조금만 더 가 보면 안 될까요? 아직 빈손이잖아요.', "Couldn't we go a little further? We'd still be empty-handed."], next: 'push' }),
        ],
        note: ['해무가 낀 날, 고만석 씨가 그래도 나간다고 했다. 해무가 덮기 전에 두 마리를 올리고, 그다음 더 갈지 돌아갈지는 나더러 정하라고 했다.',
          'On a day of sea fog, Go Manseok said we were going out anyway. Two fish before the fog closed in — and after that, push on or turn back would be my call.'],
      }),
      back: scene([
        line(G, '…빨리도 정하네.', '...Quick to decide.', { act: 'peer' }),
        line(G, '맞는 답이다. 다만 덮기 전에 두 마리는 올리고 돌린다. 빈손으로 들어가면 손님들 입이 나와.', "It's the right answer. But we land two before it closes, then turn. Go in empty-handed and the passengers sulk."),
        line(P, '두 마리 올리고, 안개가 오면 바로 돌리는 거죠.', 'Two fish, and when the fog comes, we turn straight back.'),
        line(G, '안개가 뱃전까지 오면 그땐 고기고 뭐고 없다. 그 전에 키 돌린다.', "Once fog reaches the gunwale, fish don't matter. We turn the wheel before that."),
        line(G, '네가 정한 거다. 끝까지 지켜.', 'You decided it. Stick to it.'),
      ], {
        end: endTalk({ accept: true, offer: 'turn_back' }),
        note: ['안개가 보이면 돌아가겠다고 했다. 고만석 씨는 빨리도 정한다며 맞는 답이라고, 다만 두 마리는 올리고 돌린다고 했다.',
          'I said I would turn back once I saw the fog. Quick to decide, Go Manseok said — the right answer, though we would land two before turning.'],
      }),
      fog: scene([
        line(G, '모른다. 그게 해무다.', 'Nobody knows. That is sea fog.'),
        line(P, '모른다고요?', 'Nobody knows?'),
        line(G, '바다가 차고 공기가 따뜻하면 바다가 김을 뿜어. 십 분 만에 부두가 지워진 날도 있다.', "When the sea's cold and the air's warm, the sea breathes out steam. Some days the dock's wiped out in ten minutes."),
        line(G, '그래서 정하는 건 빨라야 해. 안개 안에서 정하면 늦어.', "So the call has to be quick. Decide inside the fog and you're too late."),
        line(G, '안개가 보일 때 정하는 거다. 지금처럼.', 'You decide when you can see the fog. Like now.'),
      ], {
        choices: [
          opt('decide', '안개가 보이면 바로 정할게요', "I'll decide the moment I see it", {
            end: endTalk({ accept: true, offer: 'ask_fog' }),
            note: ['안개 안에서 정하면 늦다고 했다. 안개가 보이는 순간 정하기로 했다.', 'Decide inside the fog and it is too late, he said. I would decide the moment I saw it.'] }),
          opt('you', '고만석 씨라면 어떻게 하시겠어요?', 'What would you do, Manseok?', { next: 'skipper' }),
        ],
        note: ['해무가 얼마나 빨리 덮치느냐고 물었다. 아무도 모른다고, 십 분 만에 부두가 지워진 날도 있으니 안개가 보일 때 정하라고 했다.',
          'I asked how fast the fog closes in. Nobody knows, Go Manseok said — some days the dock vanishes in ten minutes — so decide when you can see it.'],
      }),
      skipper: scene([
        line(G, '내 배니까 나는 안다. 근데 오늘 묻는 건 너다.', "It's my boat, so I know. But today I'm asking you."),
        line(P, '…', '...'),
        line(G, '언젠가 네 배에서 안개를 만나면 물어볼 사람이 없어. 그날을 위해 지금 정해 보는 거다.', "Someday you'll meet fog on your own boat with no one to ask. You're deciding now for that day."),
        line(G, '틀려도 오늘은 내가 있다. 정해.', "Even if you're wrong, I'm here today. Decide."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_skipper' }),
        note: ['고만석 씨라면 어떻게 하겠느냐고 물었다. 팔짱을 낀 채, 언젠가 내 배에서 안개를 만나면 물어볼 사람이 없다며 오늘은 내가 정하라고 했다.',
          'I asked what he would do. Arms folded, he said that someday on my own boat there would be no one to ask — so today I decide.'],
      }),
      push: scene([
        act(G, 'silence'),
        line(G, '…빈손이 무서우면 바다에 나오지 마라.', "...If empty hands scare you, don't come out to sea."),
        line(G, '그 말 하는 놈들이 제일 많이 안 돌아온다.', "The ones who say that are the ones who don't come back."),
        line(P, '…', '...'),
        line(G, '정 그러면 이 자리에서, 덮기 전에 두 마리. 거기까지다.', "If you must, then here — two before it closes. That's the limit."),
        line(G, '그다음엔 네가 키를 돌리는 거다. 내가 아니라.', 'After that, you turn the wheel. Not me.'),
      ], {
        end: endTalk({ accept: true, offer: 'push_on' }),
        note: ['빈손이니 조금 더 가 보자고 했다가 혼이 났다. 그 말 하는 사람들이 제일 많이 안 돌아온다고, 두 마리까지고 그다음엔 내가 키를 돌리라고 했다.',
          'I said we should push on since we were empty-handed, and got scolded. The ones who say that are the ones who do not come back — two fish, then I turn the wheel myself.'],
      }),
    },
  },
  {
    id: 'm3_05_done', questId: 'M3-05', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '돌아왔지.', 'We made it back.'),
        line(P, '두 마리만 올리고 들어왔어요.', 'Only the two fish, and we came in.'),
        line(G, '조황이 시원찮아도 돌아온 게 실력이야.', "A poor catch, but coming back is the skill."),
        line(G, '다른 배 소식 들었지.', "You've heard about the other boats."),
        line(P, '…조금요.', '...A little.'),
        line(G, '그게 답이다.', "That's your answer.", { act: 'look_sea' }),
      ], {
        choices: [
          opt('return', '조황보다 배가 먼저였어요', 'The boat came before the catch', {
            say: ['돌아가는 걸 택했어요. 조황보다 배가 먼저였어요.', 'I chose to turn back. The boat came before the catch.'], next: 'return' }),
          opt('regret', '조금 더 갔어도 됐을 것 같아요', 'I think we could have gone a bit further', { next: 'regret' }),
          opt('other_boat', '다른 배 사람들은 무사한가요?', 'Are the people on the other boats safe?', { next: 'other_boat' }),
        ],
        note: ['해무 속에서 키를 돌려 부두로 돌아왔다. 고만석 씨는 조황이 시원찮아도 돌아온 게 실력이라고, 다른 배 소식이 그 답이라고 했다.',
          'I turned the wheel in the fog and brought us back to the dock. A poor catch, Go Manseok said, but coming back is the skill — and the news about the other boats was the answer.'],
      }),
      return: scene([
        line(G, '그게 선장이다. 아직 배는 없어도.', "That's what a captain is. Even without a boat yet."),
        line(P, '선장이요…', 'A captain...'),
        line(G, '배는 다시 사도 사람은 못 산다. 그걸 아는 놈이 키를 잡는 거야.', "You can buy another boat, but not another person. The one who knows that takes the wheel."),
      ], {
        end: endTalk({ complete: 'return', lineKo: '오늘 빈손은 손님들한테 내가 말한다. 너는 그 판단만 기억해.', lineEn: "I'll explain today's empty hands to the passengers. You just remember that call." }),
        note: ['조황보다 배가 먼저였다고 했다. 고만석 씨는 그게 선장이라고 했고, 그날부터 나를 부르는 목소리가 달라졌다.',
          "I said the boat came before the catch. That's what a captain is, Go Manseok said — and from that day his voice changed when he called me."],
      }),
      regret: scene([
        act(G, 'silence'),
        line(G, '…그렇게 생각한 놈이 안개 속에서 안 돌아왔다. 다시 생각해.', '...People who thought that never came back out of the fog. Think again.', { act: 'shake_head' }),
        line(P, '두 마리쯤은 더 올릴 수 있었을 것 같아서요.', 'I just think we could have landed a couple more.'),
        line(G, '그럴 수도 있지. 그 두 마리랑 배 한 척을 바꿀 거냐.', 'Maybe. Would you trade a whole boat for those two fish?'),
      ], {
        end: endTalk({ complete: 'regret', lineKo: '다음에 안개 보이면 오늘 그 생각부터 해 봐.', lineEn: 'Next time you see fog, think of today first.' }),
        note: ['조금 더 갔어도 됐을 것 같다고 했다가 고만석 씨의 표정이 굳었다. 그 두 마리와 배 한 척을 바꿀 거냐고 물었다.',
          "When I said we could have gone further, Go Manseok's face hardened. Would I trade a boat for those two fish, he asked."],
      }),
      other_boat: scene([
        line(G, '…소식은 들었지. 더 묻지 마라.', "...I heard the news. Don't ask more.", { act: 'look_away' }),
        line(G, '돌아온 배가 못 돌아온 배 얘기를 함부로 하는 거 아니다.', "A boat that came back doesn't talk lightly about one that didn't."),
        act(G, 'silence'),
        line(P, '…네.', '...Right.'),
      ], {
        end: endTalk({ complete: 'other_boat', lineKo: '오늘 밤엔 항구가 다 늦게 잔다. 너도 그럴 거다. 그게 맞는 거야.', lineEn: "Tonight the whole harbor will go to bed late. So will you. That's as it should be." }),
        note: ['다른 배 사람들은 무사하냐고 물었다. 고만석 씨는 더 묻지 말라며 부두 끝에 서서 한참 바다를 봤다.',
          'I asked if the people on the other boats were safe. Go Manseok told me not to ask more, and stood at the end of the dock looking at the sea for a long time.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M3-06 「명태를 본 적 있어요?」 — 정옥선
  // ═══════════════════════════════════════════
  {
    id: 'm3_06_offer', questId: 'M3-06', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '왔냐.', 'You came.'),
        line(P, '정옥선 씨가 포항까지 오실 줄은 몰랐어요.', "I never thought you'd come all the way to Pohang."),
        line(O, '볼일이 있어서 왔다. 너한테 시킬 일도 있고.', 'I had business here. And something for you to do.'),
        line(P, '무슨 일인데요?', 'What is it?'),
        line(O, '명태 본 적 있냐?', 'Ever seen a pollock?'),
        line(P, '…도감에서만요. 포획 금지라고 떠 있던데요.', '...Only in the field guide. It says no take.'),
        line(O, '그래. 이제는 그렇다.', "That's right. These days, it does.", { act: 'look_sea' }),
        line(O, '여기 노인들한테 물어라. 명태를 본 적 있냐고. 받아 적어.', "Ask the old folks here. Whether they've ever seen a pollock. Write it down."),
        line(P, '몇 분한테요?', 'How many people?'),
        line(O, '세 사람. 그게 조행록이 하는 일이다.', "Three. That's what a fishing log is for."),
        line(O, '그리고 혹시 그놈을 만나거든 놔줘라.', 'And if you ever meet one, let it go.'),
      ], {
        choices: [
          opt('write', '세 분 말씀, 빼놓지 않고 받아 적을게요', "I'll write down all three, leaving nothing out", {
            say: ['받아 적을게요. 세 분 말씀, 빼놓지 않을게요.', "I'll write it down. I won't leave out a word from any of the three."], next: 'write' }),
          opt('why', '명태가 왜 포획 금지예요?', 'Why is pollock no-take?', {
            say: ['명태가 왜 포획 금지예요? 예전엔 흔했다면서요.', "Why is pollock no-take? I heard it used to be common."], next: 'why' }),
          opt('shy', '처음 보는 분들이 저한테 얘기해 주실까요?', 'Will strangers really talk to me?', {
            say: ['처음 보는 분들이 저한테 그런 얘기를 해 주실까요?', 'Will people who have never met me really tell me things like that?'], next: 'shy' }),
        ],
        note: ['정옥선 씨가 포항까지 와서, 이곳 노인 세 사람에게 명태를 본 적 있느냐고 묻고 받아 적으라고 했다. 그게 조행록이 하는 일이라고, 혹시 명태를 만나면 놔주라고 했다.',
          "Jeong Okseon came all the way to Pohang and told me to ask three of the old people here whether they had ever seen a pollock, and write it down. That's what a fishing log is for, she said — and if I ever met one, I should let it go."],
      }),
      write: scene([
        line(O, '빼놓지 않겠다는 놈이 제일 많이 뺀다.', "The ones who say they won't miss anything miss the most."),
        line(P, '…그럼 어떻게 해야 해요?', '...Then what should I do?'),
        line(O, '받아 적는 건 귀로 하는 거다. 손은 나중이야.', 'Writing it down is done with your ears. Hands come later.'),
        line(O, '말 끊지 말고 고개만 끄덕여. 노인들은 듣는 얼굴을 보고 입을 연다.', "Don't interrupt; just nod. Old folks open up when they see a listening face."),
        line(O, '수첩은 무릎에 둬. 눈에 띄면 입을 닫아. 가 봐.', 'Keep the notebook on your knee. If they see it, they clam up. Go on.'),
      ], {
        end: endTalk({ accept: true, offer: 'write_all' }),
        note: ['빼놓지 않겠다고 했다가, 받아 적는 건 귀로 하는 거라는 말을 들었다. 말을 끊지 말고 고개만 끄덕이고, 수첩은 무릎에 두라고 했다.',
          'I promised to leave nothing out and was told that writing it down is done with the ears. Do not interrupt, just nod, and keep the notebook on my knee.'],
      }),
      why: scene([
        line(O, '흔했지. 너무 흔해서 새끼까지 긁어 갔다.', 'They were common. So common that people scraped up the young ones too.'),
        line(O, '노가리라고, 명태 새끼를 안주로 먹던 시절이 있었어.', 'There was a time people ate baby pollock — nogari — as a side with drinks.'),
        line(P, '노가리가 명태 새끼였어요?', 'Nogari was baby pollock?'),
        line(O, '새끼를 먹은 바다는 다음 해가 없다. 작은 놈 돌려보내라던 내 말이 그 얘기다.', 'A sea whose young get eaten has no next year. That is what I meant when I told you to put the small ones back.'),
      ], {
        choices: [
          opt('go', '만나면 놔줄게요. 가서 들어 볼게요', "If I meet one, I'll let it go. I'll go and listen", {
            end: endTalk({ accept: true, offer: 'ask_pollock' }),
            note: ['명태를 만나면 놔주겠다고 했다. 그 얘기를 들은 사람이면 그래야 한다고 했다.', 'I said I would let a pollock go if I met one. Anyone who has heard that story should, she said.'] }),
          opt('log', '그런 것도 조행록에 적나요?', 'Does that sort of thing go in the log too?', {
            say: ['그런데 그런 것도 조행록에 적나요? 잡은 것만 적는 줄 알았어요.', 'But does that sort of thing go in a fishing log? I thought you only wrote what you caught.'], next: 'log' }),
        ],
        note: ['명태가 왜 포획 금지냐고 물었다. 너무 흔해서 노가리라며 새끼까지 먹었고, 새끼를 먹은 바다는 다음 해가 없다고 했다.',
          'I asked why pollock is no-take. They were so common that people ate even the young as nogari, Jeong Okseon said — and a sea whose young are eaten has no next year.'],
      }),
      log: scene([
        line(O, '잡은 것만 적으면 그건 장부다. 장부는 돈 세는 사람이 쓰는 거고.', 'If you only write what you caught, that is a ledger. Ledgers are for people counting money.'),
        line(P, '그럼 조행록은요?', 'Then what is a fishing log?'),
        line(O, '바다가 어땠는지 남기는 거다. 뭐가 들었고 뭐가 안 들었는지.', "A record of what the sea was like. What came in, and what didn't."),
        line(O, '안 든 걸 적는 사람이 있어야 나중에 왜 사라졌는지 안다. 셋이다. 잘 들어.', "Someone has to write down what didn't come, or later nobody knows why it vanished. Three of them. Listen well."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_log' }),
        note: ['조행록에 그런 것도 적느냐고 물었다. 잡은 것만 적으면 장부라고, 안 든 걸 적는 사람이 있어야 나중에 왜 사라졌는지 안다고 했다.',
          'I asked whether things like that go in a log. Only writing your catch makes it a ledger, Jeong Okseon said — someone has to record what did not come, or no one will know why it vanished.'],
      }),
      shy: scene([
        line(O, '안 해 주지. 처음엔.', "They won't. Not at first."),
        line(P, '…역시 그렇겠죠.', '...I figured.'),
        line(O, '그러니까 먼저 얼음을 날라 주든 그물 정리를 거들든 해. 손이 먼저 가면 입은 따라 열린다.', 'So haul their ice first, or help sort their nets. When your hands go first, their mouths follow.'),
        line(O, '나도 얼음 상자 보고 너한테 열렸다.', 'I opened up to you because of an ice box, too.', { act: 'look_away' }),
        line(O, '셋 채우고 와.', 'Come back with three.'),
      ], {
        end: endTalk({ accept: true, offer: 'shy' }),
        note: ['처음 보는 사람들이 얘기를 해 줄지 걱정했다. 정옥선 씨는 혀를 차며, 손이 먼저 가면 입은 따라 열린다고 — 자기도 얼음 상자를 보고 나한테 열렸다고 했다.',
          'I worried that strangers would not talk to me. Jeong Okseon clicked her tongue — when your hands go first, mouths follow, she said; she had opened up to me over an ice box too.'],
      }),
    },
  },
  {
    id: 'm3_06_done', questId: 'M3-06', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '세 분 이야기, 다 받아 적었어요.', 'I wrote down all three of their stories.'),
        line(O, '어디 보자.', 'Let me see.', { act: 'peer' }),
        act(O, 'silence'),
        line(O, '…적었네.', '...You wrote it down.'),
        line(O, '이게 조행록이다. 잡는 게 아니라 남기는 거.', 'This is a fishing log. Not catching — keeping.'),
        line(O, '네 아버지도 이걸 알았을까.', 'I wonder if your father knew this.', { act: 'look_away' }),
      ], {
        choices: [
          opt('father', '아버지도 알았을 거라고 생각해요', 'I think my father knew', { next: 'father' }),
          opt('record', '세 분 이야기가 다 달랐어요', 'All three stories were different', {
            say: ['세 분 이야기가 다 달랐어요. 그래서 더 남겨야 할 것 같아요.', 'All three stories were different. That makes me think they need keeping all the more.'], next: 'record' }),
          opt('her_story', '다음엔 정옥선 씨 이야기도 받아 적고 싶어요', 'Next, I would like to write down your story, Okseon', {
            say: ['다음엔 정옥선 씨 이야기도 받아 적고 싶어요.', "Next time, I'd like to write down your story too, Okseon."], next: 'her_story' }),
        ],
        note: ['받아 적은 세 사람의 이야기를 보여 주자, 정옥선 씨는 이게 조행록이라고 했다. 잡는 게 아니라 남기는 거라고, 아버지도 이걸 알았을까 하고 중얼거렸다.',
          "When I showed her the three stories I'd written down, Jeong Okseon said this is what a fishing log is — not catching but keeping. She murmured, wondering if my father knew."],
      }),
      father: scene([
        act(O, 'silence'),
        line(O, '…그랬을 거다.', '...He would have.'),
        line(O, '아버지가 뭘 알았는지는 아무도 모른다.', 'No one knows what your father knew.'),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'father', lineKo: '다만 네가 이렇게 적고 있으면, 알았든 몰랐든 이어지는 거다.', lineEn: 'But as long as you keep writing like this, whether he knew or not, it carries on.' }),
        note: ['아버지도 알았을 거라고 했다. 정옥선 씨는 오래 말이 없다가 내 손을 한 번 잡고는, 내가 이렇게 적고 있으면 알았든 몰랐든 이어지는 거라고 했다.',
          'I said my father must have known. Jeong Okseon was silent a long while, then took my hand once and said that as long as I keep writing, whether he knew or not, it carries on.'],
      }),
      record: scene([
        line(O, '다르니까 남기는 거야. 같으면 한 사람이면 되지.', "That's why you keep them — because they differ. If they were the same, one person would do."),
        line(P, '누구 말이 맞는 건지 모르겠어요.', "I can't tell whose story is right."),
        line(O, '셋이 다 다르면 셋 다 맞는 거다. 바다는 한 사람 눈에 다 안 들어와.', "If all three differ, all three are right. The sea doesn't fit in one pair of eyes."),
      ], {
        end: endTalk({ complete: 'record', lineKo: '그러니까 고치지 말고 들은 대로 둬.', lineEn: "So don't correct them. Leave them as you heard them." }),
        note: ['세 사람 이야기가 다 달랐다고 했다. 정옥선 씨는 셋이 다 다르면 셋 다 맞는 거라며, 고치지 말고 들은 대로 두라고 했다.',
          'I said all three stories were different. If all three differ, all three are right, Jeong Okseon said — do not correct them, leave them as heard.'],
      }),
      her_story: scene([
        line(O, '…내 얘기는 적을 게 없다. 좌판이랑 얼음이 다야.', "...There's nothing in my story worth writing. A stall and ice, that's all.", { act: 'look_away' }),
        line(P, '그래도요.', 'Still.'),
        line(O, '적을 거면 네 얘기나 적어. 오늘 들은 걸 네 말로. 그것도 조행록이다.', 'If you want to write, write your own. What you heard today, in your words. That is a log too.'),
      ], {
        end: endTalk({ complete: 'her_story', lineKo: '늙은이 얘기는 늙은이들이 알아서 남긴다.', lineEn: 'Old folks will see to keeping their own stories.' }),
        note: ['다음엔 정옥선 씨 이야기도 받아 적고 싶다고 했다. 수첩을 내 쪽으로 밀어 버리며, 적을 거면 오늘 들은 걸 내 말로 적으라고 했다.',
          'I said I would like to write down her story next. She pushed the notebook back toward me — if I want to write, write what I heard today in my own words.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M3-07 「종묘방류」 — 동명항 어촌계
  // ═══════════════════════════════════════════
  {
    id: 'm3_07_offer', questId: 'M3-07', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '종묘방류다. 오늘 어촌계가 다 나온다.', "It's restocking day. The whole co-op's out today."),
        line(P, '방류면… 물고기를 바다에 놓아주는 거죠?', 'Restocking... that means releasing fish into the sea?'),
        line(C, '치어다. 저 수조에 있는 거 전부.', 'Fry. Everything in those tanks.', { act: 'look_away' }),
        line(P, '저걸 다요? 몇 마리나 되는데요?', 'All of them? How many are there?'),
        line(C, '수만 마리.', 'Tens of thousands.'),
        line(C, '양동이 들어. 다섯 양동이가 네 몫이다.', 'Pick up a bucket. Five buckets are your share.'),
        line(P, '…다섯 번이요.', '...Five times.'),
        line(C, '그리고 세지 마. 세는 순간 못 놓는다.', "And don't count. The moment you count, you can't let go."),
      ], {
        choices: [
          opt('own', '제 손으로 바다에 넣는다니, 설레네요', "Putting them in the sea with my own hands — I'm excited", {
            say: ['제 손으로 바다에 넣는다니, 이상하게 설레네요.', "Putting them into the sea with my own hands — oddly, I'm excited."], next: 'own' }),
          opt('seed', '종묘가 뭐예요? 어디서 온 거예요?', 'What is seed stock? Where did they come from?', {
            say: ['종묘가 뭐예요? 이 많은 치어는 다 어디서 온 거예요?', 'What is seed stock? Where did all these fry come from?'], next: 'seed' }),
          opt('doubt', '놔줘도 금방 잡아먹히지 않나요?', "Won't they just get eaten?", {
            say: ['놔줘도 금방 다 잡아먹히지 않나요?', "Even if we let them go, won't they all just get eaten?"], next: 'doubt' }),
        ],
        note: ['종묘방류 날이었다. 어촌계에서 수만 마리 치어 가운데 다섯 양동이를 내 몫으로 맡기며, 세지 말라고 — 세는 순간 못 놓는다고 했다.',
          "It was restocking day. Of the tens of thousands of fry, the co-op gave me five buckets as my share — and told me not to count, because the moment you count you can't let go."],
      }),
      own: scene([
        line(C, '설레는 건 좋다. 대신 쏟지 마라.', "Excitement's fine. Just don't dump them."),
        line(P, '쏟으면 안 돼요?', "I shouldn't pour them out?"),
        line(C, '높은 데서 부으면 치어가 기절한다. 양동이를 물에 대고 기울여.', 'Pour from high up and the fry get stunned. Put the bucket to the water and tip it.'),
        line(C, '한 양동이에 한 숨. 급하게 부으면 갈매기만 배부르다. 들어.', 'One breath per bucket. Rush it and only the gulls eat well. Pick it up.'),
      ], {
        end: endTalk({ accept: true, offer: 'own_hands' }),
        note: ['설렌다고 했더니, 높은 데서 부으면 치어가 기절하니 양동이를 물에 대고 기울이라고 했다. 한 양동이에 한 숨씩.',
          'When I said I was excited, I was told the fry are stunned if poured from high up — put the bucket to the water and tip it, one breath per bucket.'],
      }),
      seed: scene([
        line(C, '종묘는 사람 손으로 받은 새끼다.', 'Seed stock is young raised by human hands.'),
        line(C, '어미한테 알을 받아 수조에서 키운 거지. 손가락만 해지면 바다에 낸다.', 'Eggs taken from the parents, raised in tanks. Once they are finger-sized, they go out to sea.'),
        line(P, '그럼 바다를 사람이 채우는 거네요.', 'So people refill the sea.'),
        line(C, '바다가 혼자 못 채우는 걸 사람이 조금 거드는 거다. 다 살진 않아.', "People lend a little help with what the sea can't fill alone. Not all of them live.", { act: 'shake_head' }),
        line(C, '그래도 안 놓으면 하나도 없어. 양동이 들어.', "But if we don't release them, there are none at all. Pick up a bucket."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_seed' }),
        note: ['종묘가 뭐냐고 물었다. 어미에게 알을 받아 수조에서 손가락만 하게 키운 새끼라고, 다 살진 않아도 안 놓으면 하나도 없다고 했다.',
          'I asked what seed stock was. Young raised in tanks from eggs until finger-sized, I was told — not all survive, but if none are released there are none at all.'],
      }),
      doubt: scene([
        line(C, '많이 먹힌다.', 'Lots get eaten.'),
        line(P, '…그럼.', '...Then—'),
        line(C, '그래도 다 먹히진 않아. 그 남는 놈들이 바다를 채운다.', 'But not all. The ones left over fill the sea.'),
        line(C, '세지 말라는 게 그 얘기다. 먹히는 걸 세면 못 놓고, 남는 걸 세면 욕심이 나.', "That's why I said don't count. Count the eaten and you can't let go; count the survivors and you get greedy."),
        line(C, '그냥 놓는 거다. 다섯 양동이.', 'You just let them go. Five buckets.'),
      ], {
        end: endTalk({ accept: true, offer: 'doubt_eaten' }),
        note: ['놔줘도 다 먹히지 않느냐고 물었다. 많이 먹혀도 다 먹히진 않고 남는 놈들이 바다를 채운다고, 그래서 세지 말고 그냥 놓으라고 했다.',
          'I asked whether they would all just be eaten. Many are, but not all, I was told — the survivors fill the sea, so do not count, just let them go.'],
      }),
    },
  },
  {
    id: 'm3_07_done', questId: 'M3-07', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '수고했다.', 'Good work.'),
        line(P, '…다 들어갔어요. 손바닥보다 작은 것들이요.', '...They are all in. Little things, smaller than my palm.'),
        line(C, '몇 마리 돌아올지는 아무도 몰라. 그래도 놨잖아.', 'No one knows how many will come back. But you let them go.'),
        line(C, '이 가방은 원정용이다. 멀리 갈 때 써.', "This bag's for expeditions. Use it when you go far."),
      ], {
        choices: [
          opt('count', '사실… 세어 봤어요. 사백 마리쯤', 'Actually... I counted. About four hundred', {
            say: ['세지 말라고 하셨는데… 세어 봤어요. 사백 마리쯤이요.', 'You told me not to count, but... I counted. About four hundred.'], next: 'count' }),
          opt('hope', '몇 마리라도 돌아오면, 그때 낚을게요', "If even a few come back, I'll catch them then", {
            say: ['몇 마리라도 돌아오면 그때 낚을게요. 큰 놈으로요.', "If even a few come back, I'll catch them then. Big ones."], next: 'hope' }),
          opt('empty', '다 넣고 나니 손이 좀 허전하네요', 'With them all in, my hands feel a bit empty', {
            say: ['바다에 다 넣고 나니, 손이 좀 허전해요.', 'Now that they are all in the sea, my hands feel a bit empty.'], next: 'empty' }),
        ],
        note: ['다섯 양동이를 다 바다에 내렸다. 어촌계 사람은 몇 마리가 돌아올지 아무도 모르지만 놨으니 됐다며, 멀리 갈 때 쓰라고 원정용 가방을 내줬다.',
          'I emptied all five buckets into the sea. No one knows how many will come back, the co-op said, but we let them go — and gave me an expedition bag for going far.'],
      }),
      count: scene([
        act(C, 'silence'),
        line(C, '…그러니까 세지 말라는 거야.', "...That's exactly why I said don't count.", { act: 'shake_head' }),
        line(C, '그래도 사백이면 많이 놨네.', "Still, four hundred — that's a lot released."),
        line(P, '세는 게 버릇이 돼서요.', 'Counting has become a habit.'),
        line(C, '세는 버릇은 낚시꾼 버릇이다. 나쁜 건 아니야.', "Counting is an angler's habit. It isn't a bad one."),
      ], {
        end: endTalk({ complete: 'count', lineKo: '다만 놓는 날엔 숫자를 집에 두고 와. 다음엔 세지 말고 물만 봐라.', lineEn: 'But on release days, leave the numbers at home. Next time, no counting — just watch the water.' }),
        note: ['세지 말라 했는데 세어 봤다고 털어놨다. 세는 건 낚시꾼 버릇이라 나쁘진 않지만, 놓는 날엔 숫자를 집에 두고 오라고 했다.',
          'I confessed I had counted after all. Counting is an angler\'s habit and not a bad one, I was told — but on release days, leave the numbers at home.'],
      }),
      hope: scene([
        line(C, '그렇게 말하는 놈 때문에 방류하는 거다.', 'People who say that are why we restock.'),
        line(P, '그때까지 커 있으면 좋겠어요.', 'I hope they have grown by then.'),
        line(C, '그때 잡은 놈은 체장 재고 가져가라. 오늘 네가 놓은 놈일 수도 있어.', 'When you catch them, measure before you keep them. It could be one you released today.'),
      ], {
        end: endTalk({ complete: 'hope', lineKo: '그런 생각 하면서 낚는 사람이 바다를 오래 쓴다.', lineEn: 'Anglers who fish with that in mind get to use the sea for a long time.' }),
        note: ['돌아오면 그때 큰 놈으로 낚겠다고 했다. 가방 안에는 치어 방류 기록장이 들어 있었고, 그때 잡은 놈은 체장을 재고 가져가라고 했다.',
          'I said I would catch them when they came back, big ones. There was a fry-release log inside the bag, and I was told to measure what I catch before keeping it.'],
      }),
      empty: scene([
        line(C, '허전한 게 맞다. 손에 있던 걸 놨으니까.', 'Empty is right. You let go of what was in your hands.'),
        line(C, '그 허전함이 방류다.', 'That emptiness is what restocking is.'),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'empty_hands', lineKo: '잡는 날만 있으면 바다가 남아나질 않아. 놓는 날도 있어야 그다음 잡는 날이 온다.', lineEn: "If there were only catching days, nothing would be left in the sea. There have to be letting-go days for the next catching day to come." }),
        note: ['손이 허전하다고 하자, 그 허전함이 방류라고 했다. 빈 양동이를 포개 들며, 놓는 날이 있어야 그다음 잡는 날이 온다고 했다.',
          'When I said my hands felt empty, I was told that emptiness is what restocking is. Stacking the empty buckets, the co-op man said there must be letting-go days for the next catching day to come.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M3-08 「겨울 참돔」 — 고만석
  // ═══════════════════════════════════════════
  {
    id: 'm3_08_offer', questId: 'M3-08', at: 'offer', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(G, '참돔 잡으러 간다.', "We're going after red seabream."),
        line(P, '이번엔 뭘로 해요? 지그요?', 'With what this time? Jigs?'),
        line(G, '타이라바다.', 'Tai-rubber.'),
        line(G, '바닥 찍고 천천히 감아. 참돔은 새벽이나 저녁에 문다.', 'Touch bottom and reel slowly. Red seabream bite at dawn or at dusk.'),
        line(P, '대물도 나오나요?', 'Do big ones come up?'),
        line(G, '나온다. 걸리면 드랙 믿어.', 'They do. If one hooks, trust the drag.'),
        line(G, '대는…', 'The rod...', { act: 'peer' }),
        act(G, 'silence'),
        line(G, '대는 한계가 있다.', 'A rod has its limits.'),
      ], {
        choices: [
          opt('father', '아버지 대로 해 볼게요', "I'll try with my father's rod", {
            say: ['아버지 대로 해 볼게요. 천천히 감을게요.', "I'll try with my father's rod. I'll reel slowly."], next: 'father' }),
          opt('tai', '타이라바는 지그랑 뭐가 달라요?', 'How is a tai-rubber different from a jig?', { next: 'tai' }),
          opt('limit', '한계가 있다니요? 제 대 말씀이세요?', 'Limits? You mean my rod?', {
            say: ['대는 한계가 있다니요? 제 대 말씀이세요?', 'A rod has its limits? Do you mean my rod?'], next: 'limit' }),
        ],
        note: ['고만석 씨가 새벽이나 저녁에 타이라바로 참돔을 노린다며, 바닥 찍고 천천히 감고 대물이 걸리면 드랙을 믿으라고 했다. 내 대를 보더니 대는 한계가 있다고 덧붙였다.',
          'Go Manseok said we would go after red seabream with tai-rubbers at dawn or dusk — touch bottom, reel slowly, trust the drag on a big one. Looking at my rod, he added that a rod has its limits.'],
      }),
      father: scene([
        line(G, '…그 대로 하겠다면 말리진 않는다.', "...If you want to use that rod, I won't stop you."),
        line(G, '드랙을 반 바퀴 더 풀어. 참돔은 처음 차고 나갈 때가 제일 세다.', 'Loosen the drag another half-turn. A red seabream is strongest on its first run.'),
        line(P, '반 바퀴요. 알겠어요.', 'Half a turn. Got it.'),
        line(G, '그때 손으로 줄 잡지 마. 줄 잡는 순간 대가 혼자 다 받는다.', "Don't grab the line then. The moment you do, the rod takes all of it alone."),
        line(G, '대를 아끼려면 드랙을 믿어. 감아 봐.', 'If you care about the rod, trust the drag. Reel.'),
      ], {
        end: endTalk({ accept: true, offer: 'father_rod' }),
        note: ['아버지 대로 해 보겠다고 했다. 고만석 씨는 말리진 않겠다며 드랙을 반 바퀴 더 풀라고, 대를 아끼려면 줄을 손으로 잡지 말고 드랙을 믿으라고 했다.',
          "I said I'd use my father's rod. Go Manseok wouldn't stop me — loosen the drag half a turn more, he said, and to spare the rod, never grab the line; trust the drag."],
      }),
      tai: scene([
        line(G, '지그는 쳐서 꾀고, 타이라바는 감아서 꾄다.', 'A jig tempts by jerking. A tai-rubber tempts by reeling.'),
        line(G, '바닥 찍고 일정하게 감아. 속도 바꾸지 말고.', "Touch bottom and reel steady. Don't change speed."),
        line(P, '툭툭 오면 바로 챔질해요?', 'When it taps, do I strike right away?'),
        line(G, '하지 마. 참돔은 따라오면서 쪼아. 묵직해질 때까지 그냥 감아.', 'Don\'t. Red seabream follow and peck. Keep reeling until it gets heavy.', { act: 'shake_head' }),
        line(G, '성급한 놈이 제일 많이 놓친다.', 'The impatient lose the most.'),
      ], {
        choices: [
          opt('reel', '묵직해질 때까지 감을게요', "I'll reel until it gets heavy", {
            end: endTalk({ accept: true, offer: 'ask_tairaba' }),
            note: ['툭툭 건드려도 챔질하지 말고, 묵직해질 때까지 일정하게 감기로 했다.', 'No striking at the taps — I would reel steadily until it got heavy.'] }),
          opt('big', '대물이면 좋겠어요. 사진 찍어서 자랑하게요', "I hope it's a big one. I want a photo to show off", { next: 'big' }),
        ],
        note: ['타이라바가 지그와 뭐가 다르냐고 물었다. 지그는 쳐서 꾀고 타이라바는 감아서 꾄다고, 참돔은 따라오며 쪼니 묵직해질 때까지 그냥 감으라고 했다.',
          'I asked how a tai-rubber differs from a jig. A jig tempts by jerking and a tai-rubber by reeling, Go Manseok said — red seabream follow and peck, so keep reeling until it gets heavy.'],
      }),
      big: scene([
        line(G, '자랑은 뜰채에 들어간 다음에 해. 물 밖에 나오기 전엔 다 바다 거다.', "Brag once it's in the net. Until it's out of the water, it all belongs to the sea."),
        line(G, '대물은 반갑기만 한 게 아니다.', "A big one isn't only good news.", { act: 'peer' }),
        line(P, '…무슨 말씀이세요?', '...What do you mean?'),
        line(G, '장비 값을 매기러 오는 놈이야. 각오하고 내려.', 'It comes to put a price on your gear. Be ready when you drop.'),
      ], {
        end: endTalk({ accept: true, offer: 'big_one' }),
        note: ['대물이면 사진 찍어 자랑하겠다고 했다. 고만석 씨는 잠깐 내 대를 보더니, 대물은 장비 값을 매기러 오는 놈이니 각오하고 내리라고 했다.',
          'I said I would photograph a big one and show it off. Go Manseok glanced at my rod and said a big fish comes to put a price on your gear — be ready.'],
      }),
      limit: scene([
        act(G, 'silence'),
        line(G, '…대마다 견디는 무게가 있다는 거다. 네 대가 나쁘단 게 아니야.', "...Every rod has a weight it can bear. I'm not saying yours is bad."),
        line(G, '오래된 대는 마디가 먼저 늙는다.', 'On an old rod, the joints age first.'),
        line(P, '그럼 대물이 걸리면 어떻게 해요?', 'Then what do I do if a big one takes it?'),
        line(G, '대로 버티지 말고 드랙으로 버텨. 그래도 안 되면 그땐 정해야 한다. 고기냐 대냐.', "Don't hold it with the rod; hold it with the drag. If that's not enough, you'll have to choose. The fish or the rod."),
        line(G, '미리 생각해 두고 내려.', 'Think it over before you drop.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_limit' }),
        note: ['내 대 얘기냐고 물었다. 대마다 견디는 무게가 있고 오래된 대는 마디가 먼저 늙는다고, 안 되면 고기냐 대냐 정해야 하니 미리 생각해 두라고 했다.',
          'I asked if he meant my rod. Every rod has a weight it can bear and old rods age at the joints, Go Manseok said — if it comes to it, I must choose the fish or the rod, so think it over first.'],
      }),
    },
  },
  {
    id: 'm3_08_done', questId: 'M3-08', at: 'complete', npcId: G, start: 'start',
    nodes: {
      start: scene([
        line(P, '…', '...'),
        line(G, '…부러졌네. 그 대.', '...It broke. That rod.', { act: 'peer' }),
        line(G, '참돔은 잡았고.', 'And you got the seabream.'),
        line(P, '마디가… 두 동강이 났어요.', 'The joint... it snapped in two.'),
        line(G, '그게 장비 한계다.', "That's the limit of the gear."),
        line(G, '탁 노인한테 가 봐. 대 만드는 사람은 그 사람이야.', "Go see old Tak. He's the one who makes rods."),
      ], {
        choices: [
          opt('broken', '참돔이 문제가 아니에요', "The seabream isn't what matters", {
            say: ['아버지 대가 부러졌어요. 참돔이 문제가 아니에요.', "My father's rod broke. The seabream isn't what matters."], next: 'broken' }),
          opt('caught', '그래도 참돔은 뜰채에 들어왔어요', 'Still, the seabream made it into the net', { next: 'caught' }),
          opt('knew', '부러질 줄 아셨어요?', 'Did you know it would break?', {
            say: ['고만석 씨는… 부러질 줄 아셨어요?', 'Manseok... did you know it would break?'], next: 'knew' }),
        ],
        note: ['참돔은 뜰채에 들어왔지만 아버지의 대가 마디에서 부러졌다. 고만석 씨는 그게 장비 한계라며, 대 만드는 탁만수 씨를 찾아가 보라고 했다.',
          "The red seabream made it into the net, but my father's rod snapped at the joint. That is the limit of the gear, Go Manseok said, and told me to go see Tak Mansu, who makes rods."],
      }),
      broken: scene([
        line(G, '…알아. 배에 있던 사람은 다 봤다.', '...I know. Everyone on the boat saw.'),
        line('', '(부러진 마디를 천으로 싸 준다.)', '(He wraps the broken joint in a cloth.)'),
        line(P, '…다시 쓸 수 있을까요?', '...Can it be used again?'),
      ], {
        end: endTalk({ complete: 'broken', lineKo: '부러진 건 다시 붙일 수 있어. 탁 노인이면.', lineEn: 'What breaks can be joined again. If it is old Tak.' }),
        note: ['참돔이 문제가 아니라고 했다. 고만석 씨는 부러진 마디를 천으로 싸 주며, 탁만수 씨라면 다시 붙일 수 있을 거라고 했다.',
          'I said the seabream was not what mattered. Go Manseok wrapped the broken joint in a cloth and said that Tak Mansu could join it again.'],
      }),
      caught: scene([
        line(G, '그게 낚시꾼이지. 대보다 고기를 먼저 세는.', "That's an angler for you. Counting the fish before the rod."),
        line(G, '…그래도 대는 챙겨 가.', '...Still, take the rod with you.'),
        line(P, '네.', 'Yes.'),
        line(G, '고기 먼저 센 건 잘한 거다. 대는 다시 깎으면 되지만 오늘 그 참돔은 다시 안 와.', "Counting the fish first was right. A rod can be carved again, but today's seabream won't come twice."),
      ], {
        end: endTalk({ complete: 'caught', lineKo: '그래도 오늘 밤엔 대 옆에 앉아 있어라. 그 대도 수고했다.', lineEn: 'But tonight, sit beside the rod. It did its work too.' }),
        note: ['그래도 참돔은 들어왔다고 했다. 고만석 씨는 부러진 마디를 차근차근 주워 주며, 오늘 밤엔 대 옆에 앉아 있으라고 했다.',
          'I said the seabream still made it in. Go Manseok gathered the broken pieces one by one for me and told me to sit beside the rod tonight.'],
      }),
      knew: scene([
        act(G, 'silence'),
        line(G, '…알았으면 말렸겠지. 몰랐다.', "...If I'd known, I'd have stopped you. I didn't."),
        line(G, '다만 오래된 대는 언젠가 그런다는 건 알았다.', 'I only knew that old rods do that someday.'),
        line(P, '…', '...'),
        line(G, '대는 부러지라고 있는 거다. 부러질 때까지 고기를 안 놓은 대가 좋은 대야.', "Rods are made to break. A rod that didn't let go of the fish until it broke is a good rod."),
      ], {
        end: endTalk({ complete: 'did_you_know', lineKo: '네 아버지 대는 끝까지 안 놨다. 그건 기억해 둬.', lineEn: "Your father's rod didn't let go to the end. Remember that." }),
        note: ['부러질 줄 알았느냐고 물었다. 고만석 씨는 몰랐다고, 다만 부러질 때까지 고기를 안 놓은 대가 좋은 대라며 아버지 대는 끝까지 안 놨다고 했다.',
          "I asked if he knew it would break. He didn't, Go Manseok said — but a rod that holds the fish until it breaks is a good rod, and my father's held on to the end."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M3-09 「배를 보러 가자」 — 탁만수
  // ═══════════════════════════════════════════
  {
    id: 'm3_09_offer', questId: 'M3-09', at: 'offer', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(P, '…대가 부러졌어요. 아버지가 쓰시던 대예요.', '...The rod broke. It was the one my father used.'),
        line(T, '가져와 봐.', 'Bring it here.'),
        line(T, '…부러졌구나.', '...So it broke.', { act: 'peer' }),
        act(T, 'silence'),
        line(P, '고칠 수 있을까요?', 'Can it be fixed?'),
        line(T, '이건 여기 둬.', 'Leave this here.'),
        line(T, '네가 쓸 새 죽간이 하나 있다. 손잡이 마무리만 남았어. 다 되면 와서 받아 가.', "There's a new bamboo rod for you. Only the grip is left to finish. Come and get it when it's done."),
        line(P, '새 대를요…?', 'A new rod...?'),
        line(T, '그 대 들고 배를 보러 가라. 거제다.', 'Take that rod and go see a boat. In Geoje.'),
        line(T, '그 전에 위판에 여덟 번 올려. 뱃값 밑천부터 쌓아.', 'Before that, put eight lots through the auction. Build up seed money for a boat first.'),
      ], {
        choices: [
          opt('save', '아버지 대, 꼭 다시 살려 주세요', "Please bring my father's rod back to life", {
            say: ['아버지 대, 꼭 다시 살려 주세요.', "Please, bring my father's rod back to life."], next: 'save' }),
          opt('geoje', '왜 하필 거제예요?', 'Why Geoje, of all places?', {
            say: ['왜 하필 거제예요? 배를 보러 거기까지요?', 'Why Geoje, of all places? All that way to look at a boat?'], next: 'geoje' }),
          opt('seen', '이 대, 혹시 전에 보신 적 있으세요?', 'Have you seen this rod before, by any chance?', { next: 'seen' }),
        ],
        note: ['부러진 아버지의 대를 들고 탁만수 씨의 공방에 갔다. 대는 두고 가라며, 마무리 중인 새 죽간을 받아 거제로 배를 보러 가고 그 전에 위판 여덟 건으로 뱃값 밑천을 쌓으라고 했다.',
          "I took my father's broken rod to Tak Mansu's workshop. Leave it here, he said — take the new bamboo rod he is finishing, go to Geoje to see a boat, and first build seed money with eight auction lots."],
      }),
      save: scene([
        line(T, '살린다는 말은 못 한다. 마디가 갈라졌어.', "I can't promise to save it. The joint's split."),
        line(T, '볼 수 있는 건 다 본다는 말만 하지.', "All I'll say is I'll look at everything that can be looked at."),
        line('', '(부러진 마디를 작업대에 눕힌다.)', '(He lays the broken joint on the workbench.)'),
        line(P, '…고맙습니다.', '...Thank you.'),
        line(T, '그동안 새 죽간을 써라. 대가 없으면 손이 굳는다.', 'Use the new rod meanwhile. Without a rod, your hands stiffen.'),
        line(T, '손 굳은 놈한테는 고친 대도 소용없어. 배 보러 가.', 'A mended rod is no use to stiff hands. Go see the boat.'),
      ], {
        end: endTalk({ accept: true, offer: 'save_it' }),
        note: ['아버지 대를 꼭 살려 달라고 했다. 탁만수 씨는 마디가 갈라져 장담은 못 하지만 볼 수 있는 건 다 보겠다며, 그동안 손이 굳지 않게 새 죽간을 쓰라고 했다.',
          "I begged him to save my father's rod. The joint is split, so Tak Mansu could promise nothing but to look at all there is — and meanwhile I should use the new rod so my hands do not stiffen."],
      }),
      geoje: scene([
        line(T, '거제엔 조선소가 많다. 큰 배 만드는 데 옆엔 작은 배 고치는 데도 많아.', 'Geoje has a lot of shipyards. Next to the places that build big ships there are plenty that fix small ones.'),
        line(T, '쓸 만한 중고 배는 거기서 나온다.', 'Usable second-hand boats come from there.'),
        line(P, '배를 사라는 말씀이에요?', 'You mean I should buy a boat?'),
        line(T, '보기만 해. 사라는 말 아니다.', "Just look. I'm not telling you to buy.", { act: 'shake_head' }),
        line(T, '배는 보고 또 봐야 고른다. 대나무 고르듯이.', 'You choose a boat by looking, then looking again. Like choosing bamboo.'),
      ], {
        choices: [
          opt('go', '보러만 다녀올게요', "I'll just go and look", {
            end: endTalk({ accept: true, offer: 'ask_geoje' }),
            note: ['거제에는 조선소가 많아 쓸 만한 중고 배가 나온다고 했다. 사지 말고 보기만 하라고, 대나무 고르듯이.', 'Geoje has many shipyards, so good second-hand boats turn up there. Only look, not buy — like choosing bamboo.'] }),
          opt('money', '아직 돈이 한참 모자란데요', "I'm still a long way short of the money", {
            say: ['배라니요. 아직 돈이 한참 모자라요.', "A boat? I'm still a long way short of the money."], next: 'money' }),
        ],
        note: ['왜 하필 거제냐고 물었다. 큰 배 만드는 조선소 옆에 작은 배 고치는 데가 많아 쓸 만한 중고 배는 거기서 나온다고 했다.',
          'I asked why Geoje. Next to the big shipyards there are many small repair yards, Tak Mansu said, so usable second-hand boats come from there.'],
      }),
      money: scene([
        line(T, '안다. 그러니까 보러 가라는 거다. 사러 가라는 게 아니고.', "I know. That's why I'm telling you to go look. Not to buy."),
        line(T, '얼마가 모자란지 알아야 모을 수 있어.', "You have to know how much you're short before you can save it."),
        line(P, '…그렇네요.', "...That's true."),
        line(T, '위판장 가서 상자부터 쌓아. 배는 돈보다 눈으로 먼저 사는 거다.', 'Go to the auction hall and stack up crates first. You buy a boat with your eyes before your money.'),
      ], {
        end: endTalk({ accept: true, offer: 'no_money' }),
        note: ['돈이 한참 모자란다고 했더니, 그러니까 사러 가지 말고 보러 가라고 했다. 얼마가 모자란지 알아야 모을 수 있다고, 위판장에서 상자부터 쌓으라고.',
          "When I said I was well short of the money, Tak Mansu said that's exactly why I should go and look rather than buy — you have to know how short you are to save. Stack crates at the auction first."],
      }),
      seen: scene([
        line(T, '…대는 다 비슷하게 늙는다.', '...All rods age much the same way.', { act: 'look_away' }),
        line(T, '지금은 그 얘기 할 때가 아니야.', "Now isn't the time for that."),
        line(P, '…네.', '...All right.'),
        line(T, '배 보고 와라. 대는 내가 보고 있으마. 그 얘긴 나중에 하자.', "Go see the boat. I'll keep an eye on the rod. We'll talk about that later."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_seen' }),
        note: ['이 대를 전에 본 적 있느냐고 물었다. 탁만수 씨는 갈라진 마디를 오래 만지더니, 지금은 그 얘기 할 때가 아니라며 나중에 하자고 했다.',
          'I asked whether he had seen this rod before. Tak Mansu ran his fingers over the split joint for a long time, then said now was not the time — we would talk about it later.'],
      }),
    },
  },
  {
    id: 'm3_09_done', questId: 'M3-09', at: 'complete', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(T, '위판은 쌓았다며.', "I hear you've built up your auction lots."),
        line(P, '네, 여덟 건이요. 배는 아직 멀었지만요.', "Yes, eight lots. Though a boat's still a long way off."),
        line(T, '이 대로 한동안 낚아.', 'Fish with this rod for a while.', { act: 'nod' }),
        line(T, '네 대는 새벽이랑 내가 본다.', 'Saebyeok and I will look after yours.'),
        line(P, '…', '...'),
        line(T, '대 만드는 거, 이제 네가 배울 차례다. 공방 도구도 살 수 있게 말해 뒀다.', "Making rods — it's your turn to learn now. I've arranged for you to buy workshop tools too."),
      ], {
        choices: [
          opt('trust', '아버지 대를 맡길게요', "I'll leave my father's rod with you", {
            say: ['아버지 대를 맡길게요. 탁만수 씨 손이면 돼요.', "I'll leave my father's rod with you. Your hands are enough, Mansu."], next: 'trust' }),
          opt('learn', '대 만드는 걸 배우고 싶어요', 'I want to learn to make rods', {
            say: ['대 만드는 걸 배우고 싶어요. 제 손으로 붙이고 싶어요.', 'I want to learn to make rods. I want to join it with my own hands.'], next: 'learn' }),
          opt('prefer', '솔직히 새 대보다 아버지 대가 좋아요', "Honestly, I prefer my father's rod to the new one", {
            say: ['솔직히… 새 대보다 아버지 대가 더 좋아요.', "Honestly... I like my father's rod better than the new one."], next: 'prefer' }),
        ],
        note: ['위판 여덟 건을 채우고 공방에 들렀다. 탁만수 씨는 새 죽간으로 한동안 낚으라며 아버지의 대는 손자와 함께 보겠다고, 이제 대 만드는 걸 배울 차례라고 했다.',
          "With eight auction lots done, I stopped by the workshop. Tak Mansu told me to fish with the new bamboo rod for a while — he and his grandson would look after my father's — and said it was my turn to learn rod-making."],
      }),
      trust: scene([
        line(T, '…맡긴다는 말 쉽게 하지 마라.', "...Don't say 'I'll leave it with you' so lightly."),
        line(T, '그래도 받겠다.', "But I'll take it.", { act: 'nod' }),
        line(P, '언제쯤 될까요?', 'When might it be ready?'),
        line(T, '맡긴다는 건 기다린다는 말이다. 언제 되냐고 묻지 마라.', "Leaving it with someone means waiting. Don't ask when.", { act: 'shake_head' }),
      ], {
        end: endTalk({ complete: 'trust', lineKo: '대가 다 말하면 그때 부른다.', lineEn: "When the rod has said all it has to say, I'll call you." }),
        note: ['아버지 대를 맡기겠다고 했다. 탁만수 씨는 쉽게 할 말이 아니라면서도 받겠다고 했고, 죽간을 건네는 손이 흔들리지 않았다.',
          "I said I'd leave my father's rod with him. It's not something to say lightly, Tak Mansu said, but he would take it — and his hand did not waver as he handed over the bamboo rod."],
      }),
      learn: scene([
        act(T, 'silence'),
        line(T, '…그 말을 기다렸다.', '...I was waiting for you to say that.'),
        line(T, '배워. 배우면 다음 대는 네가 깎는다.', 'Learn. Once you learn, you carve the next rod.'),
        line(P, '뭐부터 하면 될까요?', 'Where do I start?'),
        line(T, '칼 잡는 법부터다. 대나무는 결대로 쪼개지, 힘으로는 안 쪼개진다.', 'With how to hold the knife. Bamboo splits along the grain, not by force.'),
      ], {
        end: endTalk({ complete: 'learn', lineKo: '손 다치면 대보다 손이 먼저 운다.', lineEn: 'Hurt your hand, and your hand cries before the rod does.' }),
        note: ['대 만드는 걸 배우고 싶다고 했다. 탁만수 씨는 그 말을 기다렸다며, 칼 잡는 법부터 가르치겠다고 했다.',
          'I said I wanted to learn to make rods. Tak Mansu said he had been waiting for that, and that he would start by teaching me how to hold the knife.'],
      }),
      prefer: scene([
        line(T, '당연하지. 손이 기억하는 대는 못 이긴다.', "Of course. You can't beat a rod your hands remember."),
        line(T, '이 대는 아직 네 손을 모르니까.', "This one doesn't know your hands yet."),
        line(P, '…그래도 써 볼게요.', "...I'll use it anyway."),
      ], {
        end: endTalk({ complete: 'prefer_father', lineKo: '그래도 써. 대는 쓰는 사람 손을 닮아 간다. 한 철 쓰면 이 대도 네 대가 된다.', lineEn: 'Use it all the same. A rod grows to resemble the hands that use it. One season, and this rod will be yours too.' }),
        note: ['솔직히 아버지 대가 더 좋다고 했다. 탁만수 씨는 당연하다며 새 대의 손잡이를 엄지로 한 번 문지르고, 한 철 쓰면 이 대도 내 대가 된다고 했다.',
          "I admitted I liked my father's rod better. Of course, Tak Mansu said, rubbing the new rod's grip once with his thumb — use it for a season and it will become mine too."],
      }),
    },
  },
];
