/**
 * @file StoryTalkN14.ts
 * @description 290차 — N14 「오세린 · 마라 · 유리아 — 제주 3인」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = `StoryTalkN01.ts`(286 시범).
 *
 * 인물
 *  - 유리아(33 · 한물간 케이블 MC) — 해요체 · 짧게 끊는 말 · 「진짜로요」 · 방송 말버릇(구도 · 프레임 · 시청자) · 나를 「{player} 씨」.
 *  - 오세린(19 · 대회 지망생 → 운영진) — 들뜬 해요체 · 느낌표 · 「제 계산으로는요」 · 유리아를 「유리아 언니」, 마라를 「걔」 · 나를 「{player} 씨」.
 *  - 마라(19 · 꿈을 버린 친구)는 이 대본에서 말하지 않는다 — 세린의 말과 내가 본 것으로만 나온다.
 * 호칭(290): 나는 「유리아 씨」 · 「오세린 씨」 · 「마라 씨」. 옛 답의 「아저씨」는 「{player} 씨」로 바꿨다.
 * 표시: 새로 만든 것 없음 — 옛 받는 답 · 보상 답의 표시(choice.n14_*)는 묶인 답이 그대로 남긴다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const R = 'yu_ria';
const S = 'oh_serin';
const P = 'player';

export const TALKS_N14: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N14-1 「첫 로케」 — 받는 자리(유리아)
  // ═══════════════════════════════════════════
  {
    id: 'n14_1_offer', questId: 'N14-1', at: 'offer', npcId: R, start: 'start',
    nodes: {
      start: scene([
        line(R, '저기요, 잠깐만요. 낚시하시는 분 맞죠? 대 가방 보고 알았어요.', "Excuse me, just a moment. You fish, right? I could tell from the rod bag.", { act: 'look_up' }),
        line(P, '네, 맞아요. 무슨 일이세요?', "Yes, I do. What is it?"),
        line(R, '유리아예요. 케이블에서 낚시 프로그램 진행해요. …했었어요, 가 맞겠네요. 다들 한물갔다고 하니까.',
          "I'm Yu Ria. I host a fishing show on cable. ...Hosted, I should say. Everyone says I'm washed up."),
        line(P, '방송하시는 분이구나. 그런데 저한테는…?', "Oh, you're on TV. But what do you need from me...?"),
        line(R, '오늘 첫 로케가 있어요. 촬영 보조가 필요해요.', "I've got my first location shoot today. I need someone to assist."),
        line(P, '보조라면, 제가 뭘 하면 돼요?', "Assist how? What would I do?"),
        line(R, '방어 한 마리요. 낚는 건 {player} 씨가 하고, 구도는 제가 잡을게요.', "One yellowtail. You catch it, {player}, and I'll handle the framing."),
        line(P, '(대본을 말아 쥔 손이 하얗게 질려 있다…)', '(The hand gripping her rolled-up script has gone white...)'),
        line(R, '오랜만이라 떨리네요. 티 나죠?', "It's been a while, so I'm shaking. It shows, doesn't it?", { act: 'look_away' }),
      ], {
        choices: [
          opt('steady', '떨리셔도 괜찮아요. 방어는 제가 넣을게요', "It's fine to shake. I'll get the yellowtail in", {
            say: ['떨리셔도 괜찮아요. 방어는 제가 프레임 안으로 넣을게요.', "It's fine to be nervous. I'll get the yellowtail into the frame."], next: 'steady' }),
          opt('location', '로케라는 게, 밖에서 찍는 거죠?', "A location shoot means filming outside, right?", {
            say: ['로케라는 게, 방송국 밖에서 찍는 걸 말하는 거죠?', "A location shoot — that means filming outside the studio, right?"], next: 'location' }),
          opt('shy', '저는 카메라 앞은 자신이 없어요', "I'm not confident in front of a camera", {
            say: ['그런데 저는 카메라 앞에 서는 건 자신이 없어요.', "The thing is, I'm not confident standing in front of a camera."], next: 'shy' }),
        ],
        note: ['유리아 씨는 케이블 낚시 프로그램 진행자였다며, 첫 로케에서 촬영 보조를 해 달라고 했다. 내가 방어 한 마리를 낚고 구도는 그녀가 잡는다. 대본을 쥔 손이 떨리고 있었다.',
          "Yu Ria said she used to host a cable fishing show and asked me to assist on her first location shoot. I catch one yellowtail; she handles the framing. The hand holding her script was shaking."],
      }),
      steady: scene([
        line(R, '그 말 든든하네요. 진짜로요.', "That's reassuring. Really."),
        line(R, '저는 카메라 앞에서 웃기만 할게요. 방어는 뒤에서 낚아서, 신호하면 건네줘요.', "I'll just smile for the camera. You catch the yellowtail behind me and pass it over when I signal."),
        line(P, '신호는 어떻게 하실 건데요?', "What will the signal be?"),
        line(R, '손을 이렇게 들게요. 너무 빨리는 말고요. 시청자는 잡히기 직전을 제일 좋아하거든요.', "I'll raise my hand like this. Not too fast, though. Viewers love the moment just before the catch."),
      ], {
        end: endTalk({ accept: true, offer: 'steady_her' }),
        note: ['떨려도 괜찮다고, 방어는 내가 프레임 안에 넣겠다고 했다. 유리아 씨는 웃기만 할 테니 신호하면 건네 달라고, 너무 빨리는 말라고 했다.',
          "I told her it was fine to be nervous and that I'd get the yellowtail into the frame. She said she'd just smile and I should hand it over on her signal — not too fast."],
      }),
      location: scene([
        line(R, '네, 스튜디오 밖이요. 조명도 대본도 바다 마음대로인 데서 찍는 거예요.', "Yes, outside the studio. Somewhere the lighting and the script are up to the sea."),
        line(R, '오랫동안 스튜디오 의자에만 앉아 있었어요. 아니, 그 의자도 없어진 지 좀 됐네요.', "I sat in a studio chair for a long time. No — that chair's been gone a while now, too.", { act: 'look_away' }),
        line(P, '…그럼 이번이.', "...So this is—"),
        line(R, '네. 첫 로케예요. 다시 시작하는 첫 번째요.', "Yes. My first location shoot. The first one of starting over."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_location' }),
        note: ['로케가 뭐냐고 물었다. 유리아 씨는 오래 앉아 있던 스튜디오 의자마저 없어졌다며, 이번이 다시 시작하는 첫 번째라고 했다.',
          "I asked what a location shoot was. She said even the studio chair she'd sat in for years was gone, and this was the first shoot of starting over."],
      }),
      shy: scene([
        line(R, '안 서도 돼요. 손만 나와요. 방어 건네주는 손.', "You don't have to. Only your hands will show. The hands passing the yellowtail."),
        line(R, '좋은 손이네요. 굳은살이 있어요. 그런 손은 화면에서 거짓말을 안 해요.', "Those are good hands. Calloused. Hands like that don't lie on screen.", { act: 'peer' }),
        line(P, '얼굴은요?', "And faces?"),
        line(R, '얼굴은 제가 맡을게요. 그건 제 일이니까.', "Leave the face to me. That's my job."),
      ], {
        choices: [
          opt('hands', '손이라면 맡겨 주세요', "If it's just hands, leave it to me", {
            say: ['손만이라면 맡겨 주세요.', "If it's just my hands, leave it to me."],
            end: endTalk({ accept: true, offer: 'camera_shy' }),
            note: ['손만 나오면 된다기에 맡겠다고 했다.', "She said only my hands would show, so I agreed."] }),
          opt('joke', '한물갔다는 말, 오늘 방어로 뒤집어 봐요', "Let's flip that washed-up talk with a yellowtail", {
            say: ['한물갔다는 말, 오늘 방어로 뒤집어 보죠.', "That washed-up talk — let's flip it today with a yellowtail."], next: 'washed' }),
        ],
        note: ['카메라 앞은 자신이 없다고 했더니, 유리아 씨는 손만 나온다며 내 손을 들여다봤다. 굳은살 있는 손은 화면에서 거짓말을 안 한다고 했다.',
          "When I said I wasn't confident on camera, she said only my hands would show and studied them. Calloused hands don't lie on screen, she said."],
      }),
      washed: scene([
        line(R, '…대놓고 하네요. 다들 뒤에서 하는 말인데.', "...You just come right out and say it. Everyone else says it behind my back."),
        act(R, 'laugh'),
        line(R, '좋아요, 뒤집어 보죠. 방어는 뒤집으면 배가 하얗잖아요. 그 하얀 배가 화면에 제일 잘 받아요.', "All right, let's flip it. Flip a yellowtail over and its belly is white. That white belly looks best on screen."),
        line(P, '그럼 오늘은 그걸로 가요.', "Then that's what we'll go with today."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_washed' }),
        note: ['한물갔다는 말을 방어로 뒤집어 보자고 했다. 유리아 씨는 잠깐 굳었다가 웃음을 터뜨리고, 방어의 하얀 배가 화면에 제일 잘 받는다고 했다.',
          "I said we should flip the washed-up talk with a yellowtail. She froze, then burst out laughing — a yellowtail's white belly looks best on screen, she said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-1 — 끝내는 자리(유리아)
  // ═══════════════════════════════════════════
  {
    id: 'n14_1_done', questId: 'N14-1', at: 'complete', npcId: R, start: 'start',
    nodes: {
      start: scene([
        line(P, '신호 맞춰서 건넸는데, 괜찮았어요?', "I passed it over on your signal. Was that all right?"),
        line(R, '됐어요. 완벽했어요. 잡히기 직전에 딱.', "It worked. Perfect. Right at the edge of the catch."),
        line(R, '오랜만에 카메라 앞에서 웃었어요.', "I smiled in front of a camera for the first time in ages.", { act: 'look_sea' }),
        line(P, '모니터로 봐도 웃는 게 보였어요.', "I could see you smiling even on the monitor."),
        line(R, '그래요? …어떤 웃음이었는데요?', "Yeah? ...What kind of smile was it?"),
      ], {
        choices: [
          opt('real', '진짜 웃음이었어요. 방송 웃음 말고요', "A real smile. Not a TV smile", {
            say: ['진짜 웃음이었어요. 방송 웃음 말고요.', "A real one. Not a TV smile."], next: 'real' }),
          opt('lesson', '구도 잡는 법, 가르쳐 주세요', "Teach me how you frame a shot", {
            say: ['구도 잡는 법, 방송 하시던 눈으로 가르쳐 주세요.', "Teach me how to frame a shot — with the eye you used on TV."],
            end: endTalk({ complete: 'lesson',
              lineKo: '삼분할이에요. 화면을 가로세로 세 칸씩 나눠서, 선이 만나는 데 얼굴을 둬요. 사람은 왼쪽이요.\n\n한가운데는 심심해요. 바다는 아래 삼분의 일, 하늘은 위 삼분의 이. 그것만 지켜도 그림이 돼요.',
              lineEn: "Rule of thirds. Split the screen into three by three and put the face where the lines cross. People on the left.\n\nDead center is boring. Sea in the bottom third, sky in the top two. Keep just that and you've got a picture." }),
            note: ['구도 잡는 법을 물었다. 유리아 씨는 화면을 세 칸씩 나눠 선이 만나는 데 얼굴을 두라고 가르쳐 줬다.', "I asked how to frame a shot. She taught me to split the screen into thirds and put the face where the lines cross."] }),
          opt('why', '다시 카메라 앞에 서신 이유, 여쭤봐도 돼요?', "May I ask why you stepped back in front of the camera?", {
            next: 'why' }),
          opt('enough', '오랜만에 웃으셨으면 됐어요', "If you smiled for once, that's enough", {
            say: ['오랜만에 웃으셨으면, 그걸로 됐어요.', "If you smiled for once in a long while, that's enough for me."],
            end: endTalk({ complete: 'decline',
              lineKo: '…그 말 방송에 넣어도 돼요? 아니요, 안 넣을게요. 제가 가질래요.\n\n방송에 넣으면 다들 갖게 되잖아요. 대신 오늘 촬영 보조 이름은 크게 넣을게요. 그건 방송이니까요.',
              lineEn: "...Can I put that line on air? No, I won't. I'm keeping it.\n\nPut it on air and everyone gets to have it. But I'll put your name as assistant in big letters. That part's the show." }),
            note: ['웃으셨으면 됐다고, 따로 바라는 건 없다고 했다. 유리아 씨는 그 말을 방송에 넣지 않고 자기가 갖겠다고 했다.', "I said her smile was enough and I wanted nothing else. She said she'd keep that line for herself instead of putting it on air."] }),
        ],
        note: ['방어를 신호에 맞춰 건넸다. 유리아 씨는 오랜만에 카메라 앞에서 웃었다며, 어떤 웃음이었느냐고 내게 물었다.',
          "I handed over the yellowtail on her signal. She said she'd smiled in front of a camera for the first time in ages, and asked me what kind of smile it was."],
      }),
      real: scene([
        line(R, '…어떻게 알았어요.', "...How did you know?", { act: 'look_away' }),
        line(R, '방송 웃음은 입이 먼저 웃어요. 진짜는 눈이 먼저고요.', "A TV smile starts at the mouth. A real one starts at the eyes."),
        act(R, 'give', { to: P }),
        line(R, '출연료예요. 제 몫에서 뗐어요. 받아 둬요.', "Your appearance fee. I took it out of my share. Keep it."),
        line(P, '…감사해요.', "...Thank you.", { act: 'receive' }),
      ], {
        end: endTalk({ complete: 'real_smile',
          lineKo: '오래 입으로만 웃었는데, 오늘은 저도 모르게 눈이 먼저 갔네요. 비밀로 해 줘요.',
          lineEn: "I smiled with only my mouth for a long time. Today my eyes got there first without my noticing. Keep it a secret." }),
        note: ['진짜 웃음이었다고 했다. 유리아 씨는 방송 웃음은 입이, 진짜는 눈이 먼저 웃는다며 자기 몫에서 뗀 출연료를 건넸다.',
          "I told her it was a real smile. She said a TV smile starts at the mouth and a real one at the eyes, and handed me an appearance fee from her own share."],
      }),
      why: scene([
        line(R, '…한물갔다는 말, 들었죠? 맞아요. 그래서요.', "...You've heard the washed-up talk, right? It's true. That's why."),
        line(R, '한물간 사람도 한 번은 더 서 봐야, 어디까지 갔는지 알잖아요.', "Even a washed-up person has to stand there one more time to find out how far gone she is."),
        line(P, '그래서, 어디까지 가셨던데요?', "So how far gone were you?"),
        line(R, '오늘 보니까 아직 덜 갔네요. 조금 남았어요.', "Looking at today, not all the way. There's a little left.", { act: 'look_sea' }),
      ], {
        end: endTalk({ complete: 'why_camera',
          lineKo: '그거면 돼요. 오늘 날짜는 대본 뒷면에 적어 둘게요. 동그라미 쳐서요.',
          lineEn: "That's enough. I'll write today's date on the back of the script. With a circle around it." }),
        note: ['다시 카메라 앞에 선 이유를 물었다. 유리아 씨는 한물간 사람도 한 번은 더 서 봐야 어디까지 갔는지 안다며, 오늘 보니 아직 조금 남았다고 했다.',
          "I asked why she'd stepped back in front of the camera. She said even a washed-up person has to stand there once more to know how far gone she is — and today showed there was a little left."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-2 「버린 꿈」 — 받는 자리(오세린)
  // ═══════════════════════════════════════════
  {
    id: 'n14_2_offer', questId: 'N14-2', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '저기요! 유리아 언니 로케 때 방어 건네준 분 맞죠? 손 보고 알았어요!', "Hey! You're the one who handed over the yellowtail on Ria's shoot, right? I knew from your hands!", { act: 'look_up' }),
        line(P, '맞아요. …손으로 알아보셨어요?', "That's me. ...You recognized my hands?"),
        line(S, '화면에 손만 나왔잖아요. 저 오세린이에요. 대회 나가는 게 꿈이고요.', "Only your hands were on screen! I'm Oh Serin. My dream is to compete in tournaments."),
        line(P, '반가워요. 그런데 무슨 일로…?', "Nice to meet you. But what brings you...?"),
        line(S, '사람 하나만 찾아 줘요. 마라라고, 서귀포 갯바위에 있을 거예요.', "Find someone for me. Her name's Mara. She'll be out on the rocks at Seogwipo."),
        line(P, '직접 가 보면 안 돼요?', "Can't you go yourself?"),
        line(S, '저는 못 가요. 안 만나 줘요.', "I can't. She won't see me.", { act: 'look_away' }),
        line(P, '…', '...'),
        line(S, '그래서 부탁하는 거예요. 무늬오징어 낚으면서, 그냥… 옆에 있어 줘요.', "That's why I'm asking. Just fish for bigfin reef squid and... be there beside her."),
      ], {
        choices: [
          opt('who', '마라 씨가 누군데요? 왜 안 만나 줘요?', "Who's Mara? Why won't she see you?", {
            say: ['마라 씨가 누군데요? 왜 안 만나 준대요?', "Who is Mara? Why won't she see you?"], next: 'who' }),
          opt('yougo', '그래도 직접 가는 게 낫지 않을까요?', "Wouldn't it be better to go yourself?", { next: 'yougo' }),
          opt('find', '찾아볼게요. 말은 안 걸고요', "I'll look for her. Without talking to her", {
            say: ['찾아볼게요. 말은 안 걸고, 옆에서 낚시만 할게요.', "I'll look for her. I won't talk to her — I'll just fish beside her."],
            aff: { mara: 0.03 }, next: 'find' }),
        ],
        note: ['유리아 씨 로케에서 내 손을 봤다는 오세린 씨가 친구 마라 씨를 찾아 달라고 했다. 서귀포 갯바위에 있을 텐데 자기는 만나 주지 않는다며, 무늬오징어를 낚으면서 그냥 옆에 있어 달라고 했다.',
          "Oh Serin, who'd recognized my hands from Ria's shoot, asked me to find her friend Mara on the Seogwipo rocks. Mara won't see her, so she asked me to just fish for bigfin reef squid and stay near her."],
      }),
      who: scene([
        line(S, '친구요. 저처럼 대회가 꿈이었던 애. 걔가 먼저 그만뒀어요.', "A friend. She dreamed of tournaments, like me. She quit first."),
        line(P, '왜 그만뒀는데요?', "Why did she quit?"),
        line(S, '저도 몰라요. 물어보면 더 멀리 가요. 그래서 이제 안 물어요.', "I don't know either. Ask her and she goes further away. So I don't ask anymore."),
        line(S, '그냥 가서 봐 줘요. 걔가 아직 바다를 보는지.', "Just go and see. Whether she still looks at the sea."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_mara' }),
        note: ['마라 씨는 오세린 씨처럼 대회가 꿈이었는데 먼저 그만둔 친구라고 했다. 이유를 물으면 더 멀어진다며, 아직 바다를 보는지만 봐 달라고 했다.',
          "Mara was a friend who'd shared Serin's dream of tournaments and quit first. Asking why only pushes her away, so Serin just wanted to know whether Mara still looks at the sea."],
      }),
      yougo: scene([
        line(S, '제가 가면 걔가 일어나서 가요. 그건 알아요.', "If I go, she'll get up and leave. I know that much."),
        line(S, '{player} 씨는 모르는 사람이잖아요. 모르는 사람이 옆에서 오징어 낚는 건 괜찮을 거예요.', "You're a stranger to her, {player}. A stranger fishing for squid nearby — that'd be fine."),
        line(P, '마라 씨는 혼자 있고 싶은 걸까요?', "Does Mara want to be alone?"),
        line(S, '혼자 있고 싶은 건 아닐 거예요. 저랑만 있기 싫은 거지.', "I don't think she wants to be alone. She just doesn't want to be with me.", { act: 'look_away' }),
      ], {
        choices: [
          opt('stranger', '알겠어요. 모르는 사람으로 가 볼게요', "All right. I'll go as a stranger", {
            end: endTalk({ accept: true, offer: 'you_go' }),
            note: ['모르는 사람으로 옆에 있어 보겠다고 했다.', "I said I'd go and stay near her as a stranger."] }),
          opt('hook', '오징어 낚는 김에 사람도 낚아 오라는 거네요', "So I'm to reel in a person along with the squid", {
            say: ['오징어 낚는 김에 사람도 낚아 오라는 거네요.', "So while I'm catching squid, I'm to reel in a person too."], next: 'hook' }),
        ],
        note: ['직접 가 보라고 했더니, 오세린 씨는 자기가 가면 마라 씨가 일어나 가 버린다고 했다. 혼자 있고 싶은 게 아니라 자기랑만 있기 싫은 거라고.',
          "When I suggested she go herself, Serin said Mara would just get up and leave. It's not that Mara wants to be alone — she just doesn't want to be with Serin."],
      }),
      hook: scene([
        line(S, '낚는 거 아니에요! 그냥 있어 주는 거예요. 마라는 미끼 안 물어요, 절대.', "It's not reeling in! It's just being there. Mara never takes the bait. Never."),
        act(S, 'laugh'),
        line(S, '…근데 맞아요, 조금은 그거예요. 에기 떨어지는 소리 들으면 걔 고개가 돌아갈 거예요.', "...But you're right, it's a little bit that. When she hears an egi hit the water, her head will turn."),
        line(S, '거기까지만요. 그다음은 걔 마음이에요.', "That far and no further. After that, it's up to her."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_hook' }),
        note: ['사람도 낚아 오라는 거냐고 농담했다. 오세린 씨는 뾰로통했다가 금방 풀려, 에기 떨어지는 소리에 마라 씨 고개가 돌아가는 데까지만이라고 했다.',
          "I joked that I was meant to reel in a person too. Serin pouted, then softened — just as far as Mara turning her head at the sound of an egi, she said."],
      }),
      find: scene([
        line(S, '네, 말 걸면 가 버려요. 걔는 그래요.', "Right — talk to her and she'll leave. That's how she is."),
        act(S, 'sigh'),
        line(S, '무늬오징어는 가을 밤에 얕은 데 붙어요.', "Bigfin reef squid come into the shallows on autumn nights."),
        line(P, '서귀포 갯바위, 얕은 데요.', "The Seogwipo rocks, in the shallows."),
        line(S, '네. 거기서 에기 던지고 있으면, 마라도 그냥은 못 지나칠 거예요. 걔 손이 근질근질할 테니까요.', "Yes. If you're casting an egi there, Mara won't be able to just walk past. Her hands will be itching."),
      ], {
        end: endTalk({ accept: true, offer: 'find_her' }),
        note: ['말은 걸지 않고 옆에서 낚시만 하겠다고 했다. 오세린 씨는 안도의 숨을 내쉬고, 에기를 던지고 있으면 마라 씨 손이 근질근질할 거라고 했다.',
          "I said I wouldn't talk to her, just fish beside her. Serin let out a relieved breath — if I'm casting an egi, she said, Mara's hands will itch."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-2 — 끝내는 자리(오세린)
  // ═══════════════════════════════════════════
  {
    id: 'n14_2_done', questId: 'N14-2', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '다녀왔어요? 마라… 있었어요?', "You're back? Was Mara... there?", { act: 'look_up' }),
        line(P, '있었어요. 멀찍이 앉아 있었고, 말은 안 걸었어요.', "She was. She sat a little way off, and I didn't talk to her."),
        line(S, '잘했어요. 걸었으면 가 버렸을 거예요.', "Good. If you had, she'd have left."),
        line(P, '그런데 제가 자리를 뜰 때, 발밑에 이걸 놓고 갔어요.', "But when I was leaving, she left this at my feet."),
        line(S, '…에기 놓고 갔어요?', "...She left an egi?", { act: 'peer' }),
        line(S, '제 거예요, 그거. 예전에 걔한테 준 거. …아직 안 버렸네요.', "That's mine. I gave it to her a long time ago. ...She still hasn't thrown it away."),
      ], {
        choices: [
          opt('egi', '에기, 여기 있어요. 받으세요', "Here's the egi. Take it", {
            say: ['에기, 여기 있어요. 마라 씨가 놓고 간 거예요.', "Here's the egi. Mara left it."], next: 'egi' }),
          opt('lesson', '마라 씨 에깅, 폴링이 다르던데요', "Mara's egi fall was different", {
            say: ['마라 씨 에깅을 멀리서 봤어요. 폴링이 다르더라고요.', "I watched Mara's egi fishing from a distance. Her fall was different."],
            aff: { mara: 0.02 },
            end: endTalk({ complete: 'lesson',
              lineKo: '마라는 천재예요. 저는 노력이고요.\n\n걔 폴링은 에기가 내려가는 동안 줄을 안 잡아요. 손가락에 얹어만 둬요. 저는 그게 무서워서 자꾸 잡고요. 천재는 안 무서워하는 사람이에요.',
              lineEn: "Mara's a genius. I'm just effort.\n\nWhen her egi sinks, she doesn't grip the line. She just rests it on her finger. I'm scared to do that, so I keep gripping. A genius is someone who isn't scared." }),
            note: ['마라 씨 폴링이 다르더라고 했다. 오세린 씨는 마라 씨는 줄을 손가락에 얹어만 두는데 자기는 무서워서 잡는다며, 천재는 안 무서워하는 사람이라고 했다.',
              "I said Mara's fall was different. Serin said Mara only rests the line on her finger while she grips it out of fear — a genius is someone who isn't scared."] }),
          opt('pay', '찾아 준 값은 받을게요', "I'll take a fee for finding her", { next: 'pay' }),
          opt('along', '값은 됐어요. 다음엔 같이 가요', "Forget the fee. Next time, come with me", {
            say: ['찾아 준 값은 됐어요. 다음엔 오세린 씨도 같이 가요.', "Never mind a fee. Next time, you come too."], next: 'along' }),
        ],
        note: ['마라 씨는 멀찍이 앉아 있었고 나는 말을 걸지 않았다고 전했다. 자리를 뜰 때 마라 씨가 발밑에 놓고 간 에기를 보이자, 오세린 씨는 예전에 자기가 준 것이라고 했다.',
          "I told Serin that Mara had sat a way off and I hadn't spoken to her. When I showed her the egi Mara left at my feet, Serin said it was one she'd given Mara long ago."],
      }),
      egi: scene([
        act(S, 'silence'),
        line(S, '…제가 주면 안 받을 거예요. {player} 씨가 주면 받을지도 몰라요.', "...If I give it to her, she won't take it. If you do, {player}, she might."),
        line(S, '그러니까 이건 갖고 있다가, 다음에 마라한테 돌려줘요.', "So hold on to it, and give it back to Mara next time."),
        line(P, '알겠어요. 제가 갖고 있을게요.', "All right. I'll keep it for now."),
      ], {
        end: endTalk({ complete: 'give_egi',
          lineKo: '색이 다 바랬네요. 그동안 계속 갖고 있었나 봐요.',
          lineEn: "The color's all faded. She must have kept it with her all this time." }),
        note: ['에기를 건넸지만 오세린 씨는 오래 보다가 다시 내게 줬다. 자기가 주면 안 받을 테니 다음에 내가 마라 씨에게 돌려주라고 했다.',
          "I handed her the egi, but after a long look Serin gave it back. Mara wouldn't take it from her, she said — I should return it to Mara next time."],
      }),
      pay: scene([
        line(S, '…네. 대회 상금에서요.', "...Okay. From my prize money."),
        line(P, '상금이 벌써 있어요?', "You already have prize money?"),
        line(S, '…아니요. 에기 사려고 모은 용돈이에요.', "...No. It's pocket money I saved up for egi.", { act: 'look_away' }),
        act(S, 'give', { to: P }),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '괜찮아요. 또 모으면 돼요. 찾아 준 사람한테는 줘야죠.',
          lineEn: "It's fine. I'll just save up again. You have to pay the person who found her." }),
        note: ['찾아 준 값을 받겠다고 했다. 오세린 씨가 내민 건 상금이 아니라 에기 사려고 모은 용돈이었다.', "I said I'd take a fee for finding her. What Serin handed over wasn't prize money but pocket money she'd saved for egi."],
      }),
      along: scene([
        line(S, '…같이요? 걔가 안 만나 준다니까요.', "...Together? I told you, she won't see me."),
        line(P, '그래도 에기는 안 버렸잖아요.', "But she didn't throw the egi away."),
        act(S, 'silence'),
      ], {
        end: endTalk({ complete: 'come_along',
          lineKo: '…그러네요. 안 버렸네요.\n\n그럼 저도 한 번은 더 가 볼래요. 멀리서라도요.',
          lineEn: "...That's true. She didn't.\n\nThen I'll go one more time myself. Even if it's from a distance." }),
        note: ['값은 됐으니 다음엔 같이 가자고 했다. 에기를 안 버렸다는 말에 오세린 씨는 한참 말이 없다가, 멀리서라도 한 번은 더 가 보겠다고 했다.',
          "I said to forget the fee and come with me next time. At the reminder that Mara kept the egi, Serin fell silent, then said she'd go once more, even if only from a distance."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-3 「팀」 — 받는 자리(오세린)
  // ═══════════════════════════════════════════
  {
    id: 'n14_3_offer', questId: 'N14-3', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '{player} 씨! 이거 봐요! 팀 등록했어요! 청년부요!', "{player}! Look at this! I registered a team! Youth division!", { act: 'look_up' }),
        line(P, '팀이요? 무슨 팀이요?', "A team? What team?"),
        line(S, '대회 팀이요. 이름 칸이 셋인데, 하나는 저, 하나는 지금 제 앞에 서 있는 사람이요.', "A tournament team. There are three name slots. One's me, and one's the person standing in front of me right now."),
        line(P, '저요? 저도 들어가는 거예요?', "Me? I'm on it too?"),
        line(S, '네. 그리고 마지막 칸은… 마라요. 마라도 올 거예요. 아마.', "Yes. And the last slot is... Mara. Mara's coming too. Probably."),
        line(P, '아마요?', "Probably?"),
        line(S, '아마요. 그건 이따 말할게요. 일단 훈련부터요. 합동 지깅 훈련, 세 마리요.', "Probably. I'll explain later. Training first. Joint jigging practice — three fish.", { act: 'look_away' }),
        line(P, '지깅이면 메탈지그로요?', "Jigging, so with metal jigs?"),
        line(S, '네! 지그 내리고 저킹, 저킹. 셋이 같은 박자로 해야 해요.', "Yes! Drop the jig and jerk, jerk. All three of us have to keep the same beat."),
      ], {
        choices: [
          opt('youth', '저도 청년부에 들어가도 돼요?', "Am I even allowed in the youth division?", {
            say: ['그런데 저도 청년부에 들어가도 되는 거예요?', "But am I actually allowed in the youth division?"], next: 'youth' }),
          opt('mara', '마라 씨가 아마 온다는 건 무슨 뜻이에요?', "What do you mean, Mara's probably coming?", { next: 'mara' }),
          opt('beat', '저 때문에 박자가 틀리면 어떡해요', "What if I throw off the beat?", {
            say: ['셋이 박자를 맞춘다니, 저 때문에 틀리면 어떡해요.', "Three of us on one beat — what if I'm the one who throws it off?"], next: 'beat' }),
        ],
        note: ['오세린 씨가 청년부 팀을 등록했다며 이름 칸 셋을 보여 줬다. 자기, 나, 그리고 아마 올 마라 씨. 첫 일은 셋이 같은 박자로 저킹하는 합동 지깅 훈련 세 마리였다.',
          "Serin showed me she'd registered a youth-division team with three name slots: her, me, and Mara, who's probably coming. First up was joint jigging practice — three fish, all of us jerking to one beat."],
      }),
      youth: scene([
        line(S, '돼요! 규정 다 읽었어요. 나이 칸에 들어가요. 형광펜까지 그어 놨어요.', "You are! I read every rule. You fit the age bracket. I even highlighted it."),
        line(S, '감독은 유리아 언니가 해 주기로 했어요. 이름만요.', "Ria agreed to be our coach. In name only."),
        line(P, '이름만 빌려줘도 감독이에요?', "You can be coach just by lending your name?"),
        line(S, '언니 말로는 그렇대요. 이름만 빌려줘도 감독이래요.', "That's what she says. Lend your name and you're the coach."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_youth' }),
        note: ['나도 청년부에 들어가도 되느냐고 물었다. 오세린 씨는 규정에 형광펜까지 그어 두고 나이 칸에 들어간다고 했다. 감독은 유리아 씨가 이름만 빌려주기로 했단다.',
          "I asked if I was even allowed in the youth division. Serin had highlighted the rule — I fit the age bracket. Ria had agreed to lend her name as coach."],
      }),
      mara: scene([
        line(S, '말은 안 했어요. 근데 등록 서류를 문자로 보냈더니… 읽음 표시가 떴어요.', "She didn't say anything. But I texted her the registration form and... it showed as read."),
        line(P, '답장은요?', "Did she reply?"),
        line(S, '없어요. 걔는 싫으면 안 읽어요. 읽었다는 건 반은 온다는 거예요. 제 계산으로는요.', "No. If she doesn't want something, she doesn't read it. Reading it means she's half coming. By my math."),
        line(S, '반올림하면 와요.', "Round it up and she's coming."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_mara_come' }),
        note: ['마라 씨가 아마 온다는 건, 문자로 보낸 등록 서류에 읽음 표시가 떴다는 뜻이었다. 답장은 없었다. 오세린 씨 계산으로는 반올림하면 온다고.',
          "Probably meant Mara had opened the registration form Serin texted her. No reply. By Serin's math, rounded up, she was coming."],
      }),
      beat: scene([
        line(S, '틀려도 돼요. 처음엔 다 달라요. 원래 그래요.', "It's fine if you're off. Everyone's different at first. That's normal."),
        line(S, '박자는 맞추는 게 아니라 맞아지는 거예요. 세 번째쯤 되면 손이 알아서 해요.', "You don't match a beat — it matches itself. Around the third fish, your hands just do it."),
        line(P, '맞아진다…', "It matches itself..."),
        line(S, '그러니까 일단 와요. 마라 자리는 비워 둘게요. 오든 안 오든요.', "So just come. I'll leave Mara's spot open. Whether she comes or not."),
      ], {
        choices: [
          opt('join', '좋아요. 팀원으로 끝까지 할게요', "All right. I'm on the team to the end", { next: 'join' }),
          opt('try', '일단 가 볼게요. 틀려도 웃지 마요', "I'll come. Don't laugh if I'm off", {
            end: endTalk({ accept: true, offer: 'off_beat' }),
            note: ['틀려도 웃지 말라는 조건으로 가 보겠다고 했다.', "I said I'd come, as long as she didn't laugh if I was off."] }),
        ],
        note: ['박자가 틀릴까 걱정했더니, 오세린 씨는 박자는 맞추는 게 아니라 맞아지는 거라고 했다. 마라 씨 자리는 오든 안 오든 비워 두겠다고.',
          "When I worried about being off the beat, Serin said you don't match a beat, it matches itself. She'd leave Mara's spot open either way."],
      }),
      join: scene([
        line(S, '팀원! 그 말 듣고 싶었어요!', "Teammate! I've been wanting to hear that!"),
        line(S, '이거 봐요. 이름 칸 셋 중에 하나는 아직 연필 글씨예요. 그건 마라가 와서 펜으로 쓸 거예요.', "Look. One of the three names is still in pencil. Mara's going to come and write over it in pen."),
      ], {
        end: endTalk({ accept: true, offer: 'join_team' }),
        note: ['팀원으로 끝까지 하겠다고 했다. 오세린 씨는 서류를 흔들며, 아직 연필 글씨인 칸은 마라 씨가 와서 펜으로 쓸 거라고 했다.',
          "I said I'd be on the team to the end. Serin waved the form — the one name still in pencil, Mara would come and write in pen."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-3 — 끝내는 자리(오세린)
  // ═══════════════════════════════════════════
  {
    id: 'n14_3_done', questId: 'N14-3', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '리듬 맞았죠? 셋이요!', "We hit the rhythm, right? All three of us!"),
        line(P, '세 번째 마리 올릴 때쯤 맞았어요.', "Around the third fish, yes."),
        line(S, '…마라 왔어요. 아무 말도 안 했지만요.', "...Mara came. Even though she didn't say a word."),
        line(P, '오세린 씨도 아무 말 안 하던데요. 자리만 비워 두고.', "You didn't say a word either. You just left her spot open."),
        act(S, 'laugh'),
        line(S, '말하면 걔 가요. 그건 이제 알아요.', "If I'd said anything, she'd have left. I know that now."),
      ], {
        choices: [
          opt('rhythm', '세 번째에 맞았어요. 그거면 돼요', "We matched on the third. That's enough", {
            say: ['세 번째에 리듬이 맞았어요. 그거면 됐어요.', "The rhythm matched on the third. That's enough for me."], next: 'rhythm' }),
          opt('lesson', '오세린 씨 저킹, 대회용이던데요. 가르쳐 줘요', "Your jerking is tournament-grade. Teach me", {
            say: ['오세린 씨 저킹 리듬, 대회용이더라고요. 가르쳐 줘요.', "Your jerking rhythm is tournament-grade. Teach me."],
            end: endTalk({ complete: 'lesson',
              lineKo: '저요? 저한테 배운다고요? …좋아요. 이 박자로요.\n\n하나에 들고, 둘에 감고, 셋에 떨어뜨려요. 지그는 떨어질 때 물려요. 다들 들 때만 신경 쓰는데, 진짜는 떨어질 때예요.',
              lineEn: "Me? You want to learn from me? ...Okay. On this beat.\n\nLift on one, reel on two, drop on three. Jigs get hit on the fall. Everyone only cares about the lift, but the real thing is the fall." }),
            note: ['오세린 씨 저킹을 배우고 싶다고 했다. 하나에 들고 둘에 감고 셋에 떨어뜨리라고, 지그는 떨어질 때 물린다고 가르쳐 줬다.', "I asked Serin to teach me her jerking. Lift on one, reel on two, drop on three — jigs get hit on the fall, she said."] }),
          opt('pay', '훈련 코치비는 받아야겠어요', "I'll be taking a coaching fee", { next: 'pay' }),
          opt('member', '저는 팀원이지 코치가 아니에요. 돈은 됐어요', "I'm a teammate, not a coach. Keep the money", {
            end: endTalk({ complete: 'team_member',
              lineKo: '팀원! 그 말 좋아요.\n\n마라한테도 말해 줄래요? 아니, 제가 할게요. 팀원은 팀원끼리 말하는 거니까요.',
              lineEn: "Teammate! I love that.\n\nWill you tell Mara too? No, I'll do it. Teammates talk to teammates." }),
            note: ['코치가 아니라 팀원이니 돈은 됐다고 했다. 오세린 씨는 등록 서류의 내 이름 옆에 동그라미를 쳤다.', "I said I was a teammate, not a coach, so no money. Serin drew a circle next to my name on the form."] }),
        ],
        note: ['합동 지깅 훈련 세 마리를 채웠다. 마라 씨는 아무 말 없이 왔고, 오세린 씨도 아무 말 없이 자리만 비워 뒀다. 세 번째 마리쯤 셋의 리듬이 맞았다.',
          "We finished three fish of joint jigging practice. Mara came without a word, and Serin had silently left her spot open. Around the third fish, our three rhythms matched."],
      }),
      rhythm: scene([
        line(S, '맞았죠! 그래서 {player} 씨는 3번이에요.', "We did! So you're number three, {player}."),
        line(P, '3번이요?', "Number three?"),
        line(S, '세 번째에 맞아서 3번이요. 1번은 저, 2번은 마라.', "Three because we matched on the third. I'm one, Mara's two."),
        line(S, '마라는 아직 유니폼을 안 입었지만, 가방에 넣는 건 봤어요.', "Mara hasn't put her uniform on yet, but I saw her pack it."),
      ], {
        end: endTalk({ complete: 'rhythm',
          lineKo: '그럼 입은 거예요. 제 계산으로는요.',
          lineEn: "So she's wearing it. By my math." }),
        note: ['세 번째에 리듬이 맞았으니 됐다고 했다. 오세린 씨는 그래서 내가 3번이라며, 마라 씨가 유니폼을 가방에 넣는 걸 봤으니 입은 거나 마찬가지라고 했다.',
          "I said matching on the third was enough. Serin said that made me number three — and since she'd seen Mara pack her uniform, it was as good as worn."],
      }),
      pay: scene([
        line(S, '코치… 유리아 언니가 감독인데.', "Coach... Ria's our coach, though."),
        line(S, '아, 언니가 맡겨 놓고 갔어요. 방송국 돈이래요. 취재비요.', "Oh — she left this with me. Station money, she said. A reporting fee."),
        act(S, 'give', { to: P }),
        line(P, '취재비요?', "A reporting fee?"),
      ], {
        end: endTalk({ complete: 'pay',
          lineKo: '우리 훈련을 찍어서 방송에 낼지도 모른대요. 그럼 {player} 씨도 나와요. 코치로요.',
          lineEn: "She says she might film our training and put it on air. Then you'd be on too, {player}. As the coach." }),
        note: ['코치비를 받겠다고 했다. 오세린 씨는 유리아 씨가 맡겨 둔 방송국 돈을 취재비라며 건넸다.', "I asked for a coaching fee. Serin handed over station money Ria had left with her, calling it a reporting fee."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-4 「결선」 — 받는 자리(오세린)
  // ═══════════════════════════════════════════
  {
    id: 'n14_4_offer', questId: 'N14-4', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '결선이에요. 저희 올라갔어요.', "It's the final. We made it.", { act: 'look_up' }),
        line(P, '결선이요? 축하해요!', "The final? Congratulations!"),
        line(S, '순위는 상관없어요. 오늘은 완주가 목표예요.', "Rankings don't matter. Today the goal is to finish."),
        line(P, '완주요? 결선인데요?', "Finish? It's the final, though."),
        line(S, '네. 한치 세 마리요. 밤에 집어등 켜고요. 세 마리만 올리면 완주예요.', "Yes. Three swordtip squid. At night, with the lure lights on. Bring up three and we've finished."),
        line(P, '셋 다요?', "All three of us?"),
        line(S, '셋 다요. 그리고… 마라가 등록했어요. 자기 이름으로.', "All three. And... Mara registered. Under her own name."),
        line(P, '(오세린 씨 목소리가 조금 떨린다…)', "(Serin's voice is trembling a little...)"),
      ], {
        choices: [
          opt('name', '자기 이름으로 등록했다는 게 무슨 뜻이에요?', "What do you mean, under her own name?", { next: 'name' }),
          opt('win', '순위가 상관없다고요? 이기고 싶지 않아요?', "Rankings don't matter? Don't you want to win?", {
            say: ['순위가 상관없다고요? 결선인데 이기고 싶지 않아요?', "Rankings don't matter? It's the final — don't you want to win?"], next: 'win' }),
          opt('nervous', '결선이라니, 저까지 떨리네요', "A final — now I'm nervous too", { next: 'nervous' }),
        ],
        note: ['결선에 올라갔다. 오세린 씨는 순위와 상관없이 셋 다 완주하는 게 목표라며, 밤에 집어등을 켜고 한치 세 마리를 올리자고 했다. 마라 씨가 자기 이름으로 등록했다고 말할 때 목소리가 떨렸다.',
          "We made the final. Serin said the goal was for all three of us to finish regardless of ranking — three swordtip squid at night under the lure lights. Her voice shook when she said Mara had registered under her own name."],
      }),
      name: scene([
        line(S, '팀 훈련 때는 제가 다 써 줬거든요, 걔 이름. 결선은 본인이 직접 써야 해요.', "For team practice I wrote her name for her. For the final you have to write it yourself."),
        line(S, '이거 봐요. 삐뚤빼뚤한 거. 걔가 직접 썼어요. 자기 손으로.', "Look. The wobbly one. She wrote it herself. With her own hand.", { act: 'peer' }),
        line(P, '그 칸이 채워졌네요.', "So that slot got filled."),
        line(S, '비어 있을까 봐 며칠 동안 잠을 못 잤어요. 이제 잘 수 있어요. 결선 끝나고요.', "I couldn't sleep for days, scared it'd stay empty. Now I can sleep. After the final."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_own_name' }),
        note: ['마라 씨가 결선 명단에 자기 손으로 이름을 썼다고 했다. 그 칸이 비어 있을까 봐 오세린 씨는 며칠 동안 잠을 못 잤단다.',
          "Mara had written her name on the finals list with her own hand. Serin hadn't slept for days, afraid that slot would stay empty."],
      }),
      win: scene([
        line(S, '이기고 싶죠! 엄청요!', "Of course I want to win! So much!"),
        act(S, 'laugh'),
        line(S, '근데 오늘은 셋이 다 끝까지 던지는 게 이기는 거예요. 한 명이라도 그만두면, 일등을 해도 진 거고요.', "But today, winning means all three of us casting to the end. If even one quits, we lose — even if we come first."),
        line(P, '그건 누가 정했어요?', "Who decided that?"),
        line(S, '제가요. 대회 규정 말고, 우리 규정으로요.', "I did. Not the tournament rules — our rules."),
      ], {
        choices: [
          opt('all', '좋아요. 셋 다 끝까지 가요', "Good. All three, to the end", {
            say: ['좋아요. 완주해요. 셋 다, 끝까지.', "All right. We finish. All three of us, to the end."], next: 'all' }),
          opt('ours', '우리 규정, 따를게요', "I'll follow our rules", {
            end: endTalk({ accept: true, offer: 'want_win' }),
            note: ['대회 규정 말고 우리 규정을 따르겠다고 했다.', "I said I'd follow our rules, not the tournament's."] }),
        ],
        note: ['이기고 싶지 않느냐고 물었더니, 오세린 씨는 엄청 이기고 싶다고 너무 빨리 대답하고는 웃었다. 오늘은 셋 다 끝까지 던지는 게 이기는 거라고, 그게 우리 규정이라고 했다.',
          "When I asked if she didn't want to win, Serin answered too fast — of course she did — and laughed at herself. Today, all three casting to the end was winning. That was our rule."],
      }),
      all: scene([
        line(S, '네! 셋 다요!', "Yes! All three!"),
        line(S, '순위표는 쳐다보지도 마요. 보면 손이 빨라지고, 빨라지면 꼬여요.', "Don't even glance at the leaderboard. Look and your hands speed up, and fast hands tangle."),
        line(P, '순위표는 안 보고, 한치 세 마리.', "No leaderboard. Three swordtip squid."),
        line(S, '그게 오늘 우리 규칙이에요.', "That's our rule for today."),
      ], {
        end: endTalk({ accept: true, offer: 'finish_all' }),
        note: ['셋 다 끝까지 완주하자고 했다. 오세린 씨는 주먹을 쥐었다 펴며, 순위표를 보면 손이 빨라져 꼬인다고 했다.',
          "I said we'd all three finish to the end. Serin clenched and opened her fist — look at the leaderboard, she said, and your hands speed up and tangle."],
      }),
      nervous: scene([
        line(S, '{player} 씨도요? 다행이다, 저만 떨리는 줄 알았어요.', "You too, {player}? What a relief — I thought it was just me."),
        line(S, '유리아 언니가 그랬어요. 떨리는 건 아직 진심이라는 뜻이래요.', "Ria told me shaking means you still mean it."),
        line(P, '그럼 떨면서 해도 되겠네요.', "Then it's fine to shake while we do it."),
        line(S, '네. 한치 세 마리만 올려요, 떨면서.', "Yes. Just bring up three squid. Shaking."),
      ], {
        end: endTalk({ accept: true, offer: 'nervous' }),
        note: ['나까지 떨린다고 했더니 오세린 씨 어깨에서 힘이 조금 빠졌다. 유리아 씨 말로는 떨리는 건 아직 진심이라는 뜻이라고 했다.',
          "When I said I was nervous too, some of the tension left Serin's shoulders. Ria had told her shaking means you still mean it."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-4 — 끝내는 자리(오세린)
  // ═══════════════════════════════════════════
  {
    id: 'n14_4_done', questId: 'N14-4', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '완주! 셋 다요!', "We finished! All three of us!"),
        line(P, '한치 세 마리, 올렸어요. 오세린 씨도, 마라 씨도.', "I brought up three squid. So did you, and so did Mara."),
        line(S, '…마라가 던졌어요. 자기 이름으로.', "...Mara cast. Under her own name."),
        line(S, '그게 결말이에요. 순위는 몰라요. 안 봤어요.', "That's the ending. I don't know the rankings. I didn't look.", { act: 'look_sea' }),
        line(P, '저도 안 봤어요.', "I didn't look either."),
        act(S, 'laugh'),
      ], {
        choices: [
          opt('finish', '완주가 목표였잖아요. 셋 다 해냈어요', "Finishing was the goal. All three of us did it", {
            say: ['완주가 목표였잖아요. 셋 다 완주했어요.', "Finishing was the goal. All three of us finished."], next: 'photo' }),
          opt('lesson', '한치 집어, 오세린 씨가 제일 빨랐어요', "You drew the squid in fastest", {
            say: ['한치 모으는 거, 오세린 씨가 제일 빨랐어요. 배우고 싶어요.', "You drew the squid in faster than anyone. I want to learn how."],
            end: endTalk({ complete: 'lesson',
              lineKo: '집어등 각도예요. 아래로 15도.\n\n불을 바로 아래로 쏘면 한치가 너무 깊이 숨어요. 살짝 기울이면 그늘이 생기는데, 한치는 그 그늘 끝에 모여요. 밝은 데가 아니라 밝은 데 옆이에요.',
              lineEn: "It's the lamp angle. Fifteen degrees down.\n\nShine it straight down and the squid hide too deep. Tilt it a little and you get a shadow — the squid gather at its edge. Not in the light, beside it." }),
            note: ['한치 모으는 법을 물었다. 오세린 씨는 집어등을 아래로 15도 기울이면 생기는 그늘 끝에 한치가 모인다고 했다.', "I asked how she drew the squid in. Tilt the lamp fifteen degrees down, Serin said, and they gather at the edge of the shadow."] }),
          opt('pay', '팀 상금은 나누는 거죠?', "Team prize money gets split, right?", {
            end: endTalk({ complete: 'pay',
              lineKo: '나눠요! 삼분의 일씩이요!\n\n마라 몫은 마라가 직접 받아야 해요. 자기 이름으로 나갔으니까요. 저는 그거 보려고 봉투를 일부러 천천히 뜯을 거예요.',
              lineEn: "We split it! A third each!\n\nMara has to take her share herself. She entered under her own name. I'm going to open the envelope really slowly just to watch." }),
            note: ['팀 상금을 나누자고 했다. 얼마 안 되지만 셋이 나눈 돈이었다.', "I said we'd split the team prize. It wasn't much, but it was money the three of us shared."] }),
          opt('split', '상금은 두 사람이 나눠요. 저는 완주로 됐어요', "You two split it. Finishing is enough for me", { next: 'split' }),
        ],
        note: ['한치 세 마리를 올려 셋 다 완주했다. 마라 씨는 자기 이름으로 던졌고, 오세린 씨는 그게 결말이라고 했다. 우리 둘 다 순위표는 보지 않았다.',
          "I brought up three squid and all three of us finished. Mara cast under her own name, and Serin said that was the ending. Neither of us looked at the rankings."],
      }),
      photo: scene([
        line(S, '네! 유리아 언니가 찍어 준 사진 있어요. 봐요.', "Yes! Ria took a photo of us. Look."),
        line(S, '마라 웃고 있죠? 대회에서 웃는 거 처음 봐요.', "Mara's smiling, see? First time I've seen her smile at a tournament."),
        line(P, '저는… 눈을 감았네요.', "And I... have my eyes closed."),
      ], {
        end: endTalk({ complete: 'finish',
          lineKo: '그래도 그게 제일 잘 나온 거예요. 셋 다 같이 나온 거니까요.',
          lineEn: "It's still the best one. Because all three of us are in it." }),
        note: ['셋 다 완주했다고 했다. 오세린 씨가 유리아 씨가 찍은 사진을 보여 줬다. 마라 씨는 웃고 있었고 나는 눈을 감고 있었다.',
          "I said all three of us had finished. Serin showed me the photo Ria took. Mara was smiling; I had my eyes shut."],
      }),
      split: scene([
        line(S, '에이, 셋이 완주했는데 셋이 나눠야죠!', "Come on, three of us finished, so three of us split it!"),
        line(P, '정말 괜찮아요.', "Really, it's fine."),
        act(S, 'silence'),
      ], {
        end: endTalk({ complete: 'split_two',
          lineKo: '…알았어요. 그럼 그 돈으로 다음 대회 참가비 낼게요. 마라 것까지요.',
          lineEn: "...Okay. Then I'll use it for the entry fee at the next tournament. Mara's too." }),
        note: ['상금은 두 사람이 나누라고 했다. 오세린 씨는 봉투를 내밀었다가 내 얼굴을 보고 도로 넣고, 그 돈으로 다음 대회 참가비를 마라 씨 것까지 내겠다고 했다.',
          "I told them to split the prize between the two of them. Serin held out the envelope, saw my face and put it back — she'd use it for the next entry fees, Mara's included."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-5 「다시 제주」 — 받는 자리(오세린)
  // ═══════════════════════════════════════════
  {
    id: 'n14_5_offer', questId: 'N14-5', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '{player} 씨! 여기요, 여기!', "{player}! Over here, over here!", { act: 'look_up' }),
        line(P, '오세린 씨? 목에 건 그건 뭐예요?', "Serin? What's that around your neck?"),
        line(S, '운영진 명찰이요! 저 운영진이에요!', "A staff badge! I'm on the organizing staff!"),
        line(P, '운영진이요? 대회에 나가는 게 아니라요?', "Staff? Not competing?"),
        line(S, '네. 이번엔 여는 쪽이에요. 개회 선언도 제가 해요.', "Right. This time I'm on the side that opens it. I'm giving the opening declaration too."),
        line(P, '개회 선언을요? 그럼 제주로 다시 오라는 거죠?', "The opening declaration? So you want me back in Jeju?"),
        line(S, '네! 들으러 와요! 마라는 카메라, 유리아 언니는 해설석이에요.', "Yes! Come and hear it! Mara's on camera, and Ria's in the commentary booth."),
        line(S, '셋 다 남았어요. 다른 자리로요.', "All three of us stayed. Just in different places."),
      ], {
        choices: [
          opt('committee', '운영진이면, 대회를 직접 짜는 거예요?', "As staff, you're planning the whole thing?", {
            say: ['운영진이면, 대회를 오세린 씨가 직접 짜는 거예요?', "As staff — so you're the one planning the tournament?"], next: 'committee' }),
          opt('camera', '마라 씨가 카메라를요? 낚싯대 말고요?', "Mara on camera? Not with a rod?", { next: 'camera' }),
          opt('front', '갈게요. 맨 앞에서 들을게요', "I'll come. I'll listen from the front row", {
            say: ['갈게요. 운영진 첫 개회 선언, 맨 앞에서 들을게요.', "I'll come. Your first opening declaration — I'll hear it from the front row."], next: 'front' }),
        ],
        note: ['운영진 명찰을 건 오세린 씨가 제주로 와서 자기 개회 선언을 들어 달라고 했다. 마라 씨는 카메라를, 유리아 씨는 해설석을 맡아 셋 다 다른 자리로 남았다고 했다.',
          "Serin, wearing a staff badge, asked me to come to Jeju to hear her opening declaration. With Mara on camera and Ria in the commentary booth, all three had stayed, in different places."],
      }),
      committee: scene([
        line(S, '네! 계측대 자리, 순서표, 참가자 명단, 다 제가 짰어요.', "Yes! The measuring stations, the schedule, the entrant list — I planned all of it."),
        line(S, '대회 하나에 의자가 몇 개 필요한지 아세요? 선수일 때는 몰랐어요.', "Do you know how many chairs one tournament needs? I had no idea when I was competing."),
        line(P, '몇 개인데요?', "How many?"),
        act(S, 'laugh'),
        line(S, '많아요. 선수로는 순위만 봤는데, 운영진으로는 다 보여요. 혼자 오는 사람한테는 제가 먼저 인사해요.', "A lot. As a competitor I only saw rankings — as staff I see everything. Anyone who comes alone, I greet first."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_committee' }),
        note: ['대회를 직접 짜느냐고 물었다. 오세린 씨는 계측대 자리부터 명단까지 다 짰다며 빼곡한 수첩을 펼쳤다. 혼자 오는 사람한테는 자기가 먼저 인사한다고 했다.',
          "I asked if she was planning the whole tournament. Serin opened a crammed notebook — measuring stations to entrant list, all hers. Anyone who comes alone, she greets first."],
      }),
      camera: scene([
        line(S, '네. 언제 배웠는지는 몰라요. 근데 던지는 사람 손을 제일 잘 찍는 게 마라예요.', "Yes. No idea when she learned. But nobody films a caster's hands better than Mara."),
        line(S, '자기가 던져 봤으니까요.', "Because she's cast herself."),
        line(P, '낚싯대는 아예 놓은 거예요?', "Has she put the rod down for good?"),
        line(S, '물어봤는데 웃기만 했어요. 그래도 그 웃음이면 됐어요.', "I asked, and she just smiled. But that smile was enough.", { act: 'look_sea' }),
      ], {
        end: endTalk({ accept: true, offer: 'ask_camera' }),
        note: ['마라 씨가 카메라를 들었다고 했다. 던져 본 사람이라 던지는 손을 제일 잘 찍는다고. 낚싯대는 놓았느냐고 물었더니 웃기만 했단다.',
          "Mara had taken up a camera — having cast herself, she films a caster's hands best. When Serin asked about the rod, Mara only smiled."],
      }),
      front: scene([
        line(S, '맨 앞이요? 그럼 저 더 떨리는데요!', "The front row? Then I'll be even more nervous!"),
        line(S, '선언문은 세 줄이에요. 유리아 언니가 세 줄 넘으면 방송 사고래요.', "The declaration's three lines. Ria says anything over three lines is a broadcast disaster."),
        line(P, '세 줄이면 금방이네요.', "Three lines goes by fast."),
      ], {
        choices: [
          opt('go', '세 줄, 맨 앞에서 들을게요', "Three lines. I'll hear them from the front", {
            end: endTalk({ accept: true, offer: 'front_row' }),
            note: ['세 줄짜리 선언문을 맨 앞에서 듣겠다고 했다.', "I said I'd hear the three-line declaration from the front row."] }),
          opt('cry', '운영진이 마이크 잡고 울면 안 돼요', "Staff can't cry holding the mic", {
            say: ['운영진이 마이크 잡고 울면 안 돼요.', "Staff aren't allowed to cry with the mic in hand."], next: 'cry' }),
        ],
        note: ['맨 앞에서 듣겠다고 했더니 오세린 씨는 더 떨린다며 마이크 쥔 시늉을 하다 손을 털었다. 선언문은 유리아 씨 말대로 세 줄이라고 했다.',
          "When I said I'd listen from the front, Serin said that made her even more nervous, mimed holding a mic and shook out her hands. The declaration was three lines, on Ria's advice."],
      }),
      cry: scene([
        line(S, '안 울어요! …아마요. 울면 마라가 그거 찍을 거예요. 평생 놀림감이에요.', "I won't cry! ...Probably. If I do, Mara will film it. I'll be teased for life."),
        line(S, '그러니까 맨 앞에 있어 줘요. 거기 서 있는 얼굴 보면 웃음이 나서 안 울 거예요.', "So be in the front row. If I see your face there, I'll laugh instead of cry."),
        line(S, '그거 칭찬이에요.', "That's a compliment."),
      ], {
        end: endTalk({ accept: true, offer: 'no_crying' }),
        note: ['마이크 잡고 울면 안 된다고 놀렸다. 오세린 씨는 벌써 눈가가 빨개진 채로, 맨 앞에 서 있는 내 얼굴을 보면 웃음이 나서 안 울 거라고 했다.',
          "I teased her that staff can't cry on the mic. Eyes already a little red, Serin said seeing my face in the front row would make her laugh instead."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N14-5 — 끝내는 자리(오세린)
  // ═══════════════════════════════════════════
  {
    id: 'n14_5_done', questId: 'N14-5', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '들었죠?', "You heard it?"),
        line(S, '순위는 상관없습니다. 완주하십시오. 제가 했어요, 그 말.', "Rankings don't matter. Finish the course. I said that. Me."),
        line(P, '맨 앞에서 들었어요. 안 울던데요.', "I heard it from the front row. You didn't cry."),
        act(S, 'laugh'),
        line(S, '아슬아슬했어요. 마라가 다 찍었을 거예요. 유리아 언니는 해설에서, 저 말 자기가 가르친 거라고 했대요.', "It was close. Mara must have filmed all of it. And Ria said on commentary that she taught me that line."),
        line(P, '그 말, 원래는 누구 말이었어요?', "Whose words were they, originally?"),
        line(S, '결선 날 우리 규정이요. 이제 대회 규정이 됐어요.', "Our rule from the day of the final. Now it's the tournament's rule.", { act: 'look_sea' }),
      ], {
        choices: [
          opt('stayed', '셋 다 다른 방식으로 남았네요', "All three of you stayed, each in your own way", {
            say: ['셋 다 다른 방식으로 남았네요. 그게 결말이네요.', "All three of you stayed, each in a different way. That's the ending."], next: 'stayed' }),
          opt('lesson', '대회 짜는 법, 저도 배우고 싶어요', "I want to learn how you plan a tournament", {
            say: ['운영진이 대회 짜는 법, 재개관 대회에 쓰고 싶어요.', "How staff plan a tournament — I'd like to use it for the reopening tournament."],
            end: endTalk({ complete: 'lesson',
              lineKo: '계측대 위치부터요! 그늘에요!\n\n햇볕에 두면 고기가 금방 상하고, 기다리는 사람도 지쳐요. 그다음이 화장실, 그다음이 물. 순위표는 맨 나중이에요. 다들 그걸 제일 먼저 하더라고요.',
              lineEn: "Start with where the measuring station goes! In the shade!\n\nLeave it in the sun and the fish spoil fast, and the people waiting wilt. Then toilets, then water. The leaderboard goes last. Everyone does it first." }),
            note: ['대회 짜는 법을 물었다. 오세린 씨는 계측대는 그늘에, 그다음이 화장실과 물이고 순위표는 맨 나중이라고 했다.', "I asked how to plan a tournament. Measuring station in the shade, Serin said, then toilets and water — the leaderboard last."] }),
          opt('pay', '초청 손님 여비는 운영진이 주는 거죠?', "Staff cover travel for invited guests, right?", {
            end: endTalk({ complete: 'pay',
              lineKo: '네! 운영비에서요! 처음 써 봐요, 운영비.\n\n영수증도 드릴게요. 운영비는 한 푼까지 적어야 해요. 그래야 다음 운영진이 믿고 받아요.',
              lineEn: "Yes! From the operating budget! My first time spending it.\n\nI'll give you a receipt too. Every won of the budget gets written down. That's how the next staff can trust it." }),
            note: ['초청 손님 여비를 물었다. 오세린 씨는 처음 써 보는 운영비라며 정확히 맞춰 영수증까지 챙겨 줬다.', "I asked about travel for invited guests. Serin paid it from the budget — her first time — down to the won, receipt included."] }),
          opt('wish', '여비는 됐어요. 온 건 제 마음이에요', "No travel money. I came because I wanted to", {
            say: ['여비는 됐어요. 개회 선언 들으러 온 건 제 마음이에요.', "No need for travel money. Coming to hear your declaration was my own choice."],
            end: endTalk({ complete: 'my_wish',
              lineKo: '…그 말 유리아 언니가 들었으면 해설에 넣었을 거예요.\n\n그럼 운영비는 아껴서 내년 참가자 간식에 쓸게요. 운영진은 그런 것도 정할 수 있거든요.',
              lineEn: "...If Ria had heard that, she'd have put it in the commentary.\n\nThen I'll save the budget for next year's entrants' snacks. Staff get to decide things like that." }),
            note: ['여비는 됐다고, 온 건 내 마음이라고 했다. 오세린 씨는 운영 수첩 귀퉁이에 무언가 적고, 그 돈은 내년 참가자 간식에 쓰겠다고 했다.', "I said I didn't need travel money — I came because I wanted to. Serin jotted something in her notebook's margin and said she'd spend it on next year's snacks."] }),
        ],
        note: ['오세린 씨의 개회 선언을 맨 앞에서 들었다. 순위는 상관없습니다, 완주하십시오. 결선 날 우리 규정이 대회 규정이 됐다고 했다.',
          "I heard Serin's opening declaration from the front row: rankings don't matter, finish the course. Our rule from the final had become the tournament's rule."],
      }),
      stayed: scene([
        line(S, '결말 아니에요! 시작이에요!', "It's not an ending! It's a beginning!"),
        line(S, '이번엔 사진에 {player} 씨도 들어가요. 넷이요.', "This time you're in the photo too, {player}. Four of us."),
        line(P, '저도요?', "Me too?"),
        line(S, '해마다 찍을 거예요. 대회 마지막 날, 같은 자리에서요.', "We'll take one every year. On the last day of the tournament, in the same spot."),
      ], {
        end: endTalk({ complete: 'stayed',
          lineKo: '그러니까 내년에도 와요. 그 자리는 비워 둘게요.',
          lineEn: "So come next year too. I'll keep that spot open." }),
        note: ['셋 다 다른 방식으로 남은 게 결말이라고 했더니, 오세린 씨는 결말이 아니라 시작이라고 했다. 이번 사진에는 나도 들어갔다. 해마다 같은 자리에서 찍겠다고 했다.',
          "When I called it an ending that the three of them stayed in different ways, Serin said it was a beginning. This time I was in the photo too. They'll take one every year in the same spot."],
      }),
    },
  },
];
