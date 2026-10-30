/**
 * @file StoryTalkM4.ts
 * @description 290차 — 제3부 M4(「내 배」 · 거제 · 여수 · 태안 · 속초) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 * 규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = 286차 시범 `StoryTalkN01.ts`.
 *
 * 인물 말투
 *  - 채금자(29 · 지세포 여선장) — 짧고 단단한 해요체 · 숫자로 말한다 · 팔짱 · 「~요」 「~해요」 · 주인공을 「그쪽」.
 *  - 채파도(23 · 덜렁이 신입 · 남) — 들뜬 해요체 · 느낌표 · 「아마」 「진짜예요」 · 채금자를 「선장님」.
 *  - 동명항 어촌계(사무실 사람) — 짧은 반말 · 이유는 한 줄로. 주인공은 이름을 부르지 않는다.
 *  - 오가윤(29 · 여수 호텔 직원) — 조용한 해요체 · 말끝을 흐린다 · 묻지 않기를 바란다.
 *  - 송기백(81 · 폐어선 거처) — 자네 · 「~지」 「~야」 · 껄껄 웃는다.
 *  - 탁새벽(12 · 천재 손자) — 아이 반말 · 「~거든?」 「그치?」 · 자기가 만든 대에 자부심.
 *  - 마감기(34 · 도망친 작가 · 남) — 수다스러운 해요체 · 「메모할게요」 「아마요」.
 *  - 강두철(63) — 자네 · 「허허」 「~구먼」 「~일세」 「~게」. 신분(조합장)은 대사에 올리지 않는다(앞 이야기를 안 본 사람에게 스포일러).
 *  - 도현수(24 · 라이벌) — 무뚝뚝한 반말 · 너 · 「묻지 마」 · 계산은 자기가.
 * 주인공 — 22세 · 늘 존댓말(해요체 · 합니다체) · 부를 때는 「이름 씨」(아이 · 라이벌에게도).
 *
 * 표시: 새 표시를 만들지 않는다 — 옛 받는 답 · 보상 답(`end.offer` · `end.complete`)의 표시가 그대로 남는다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const J = 'chae_geumja';
const D = 'chae_pado';
const C = 'coop';
const Y = 'oh_gayun';
const S = 'song_gibaek';
const K = 'tak_saebyeok';
const A = 'ma_gamgi';
const U = 'kang_ducheol';
const H = 'hyeonsu';
const P = 'player';

export const TALKS_M4: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // M4-01 「지세포 조선소」 — 채금자
  // ═══════════════════════════════════════════
  {
    id: 'm4_01_offer', questId: 'M4-01', at: 'offer', npcId: J, start: 'start',
    nodes: {
      start: scene([
        line(J, '이 배예요.', 'This is the boat.'),
        line(P, '…생각보다 크네요.', '...Bigger than I expected.'),
        line(J, '크진 않아요. 손이 많이 갈 뿐이지.', "It isn't big. It just needs a lot of work.", { act: 'peer' }),
        line(P, '많이 고쳐야 하나요?', 'Does it need a lot of fixing?'),
        line(J, '반만 고쳐도 떠요.', 'Fix half of it and it floats.'),
        line(J, '견적은 이만큼이에요.', "Here's the estimate."),
        line(P, '…', '...'),
        line(J, '첫 견적 내려면 오백은 있어야 시작해요. 오백만 원.', 'To start on the first estimate, you need five hundred. Five million won.'),
        line(P, '오백만 원이요…', 'Five million...'),
        line(J, '모으고 오세요.', 'Save it up and come back.'),
      ], {
        choices: [
          opt('this_boat', '모아 올게요. 이 배로 하고 싶어요', "I'll save it. I want this boat", {
            say: ['모아 올게요. 이 배로 하고 싶어요.', "I'll save it up. This is the boat I want."], next: 'this_boat' }),
          opt('half', '반만 고친다면, 나머지 반은 뭐예요?', 'If you fix half, what is the other half?', {
            say: ['반만 고쳐도 뜬다면, 나머지 반은 뭔데요?', 'If it floats with half fixed, what is the other half?'], next: 'half' }),
          opt('unsure', '제가 오백을 모을 수 있을지 모르겠어요', "I don't know if I can save five hundred", { next: 'unsure' }),
        ],
        note: ['지세포 조선소에서 채금자 씨가 중고 배 한 척을 보여 줬다. 반만 고쳐도 뜨지만, 첫 견적을 내려면 오백만 원은 있어야 한다고 했다.',
          'At the Jisepo shipyard, Chae Geum-ja showed me a second-hand boat. Fix half and it floats, she said — but I need five million won to start on the first estimate.'],
      }),
      this_boat: scene([
        line(J, '이 배로 하고 싶다는 말은 오백 모아 와서 해요.', 'Tell me you want this boat once you have brought the five hundred.'),
        line(J, '그때도 같은 마음이면 진짜예요.', "If you feel the same then, it's real."),
        line(P, '그때도 같을 거예요.', 'I will feel the same.'),
        line(J, '바닥은 괜찮아요. 엔진이 반이고 나머지가 반. 엔진부터 고칠 거예요.', "The hull bottom's fine. The engine is half, the rest is the other half. The engine gets fixed first."),
        line(J, '위판 몇 번이면 될지 세어 보고 오세요.', 'Work out how many auction lots it will take, then come back.'),
      ], {
        end: endTalk({ accept: true, offer: 'this_boat' }),
        note: ['이 배로 하고 싶다고 했다. 채금자 씨는 선체를 손바닥으로 두드리며, 그 말은 오백을 모아 와서 하라고 — 엔진부터 고칠 거라고 했다.',
          'I said this was the boat I wanted. Chae Geum-ja patted the hull and told me to say that once I had the five hundred — the engine would be fixed first.'],
      }),
      half: scene([
        line(J, '안 고쳐도 당장 안 가라앉는 것들이요. 도장, 의자, 낡은 전선 몇 가닥.', "Things that won't sink it if left alone. Paint, seats, a few old wires."),
        line(P, '뜨는 데 필요한 건요?', 'And what it needs to float?'),
        line(J, '그건 다 고쳐요. 그건 제가 봐요.', 'Those all get fixed. I see to that.'),
        line(J, '나머지는 타면서 돈 생길 때마다. 첫 배는 다 그렇게 해요.', "The rest, as you go, whenever there's money. Everyone does it that way with a first boat."),
      ], {
        choices: [
          opt('ok', '그럼 일단 오백이네요', 'So, five hundred first', {
            end: endTalk({ accept: true, offer: 'ask_half' }),
            note: ['뜨는 데 필요한 건 다 고치고, 나머지는 타면서 고친다고 했다. 일단 오백부터 모으기로 했다.', 'Everything needed to float gets fixed; the rest is fixed along the way. First, I would save the five hundred.'] }),
          opt('haggle', '오백이면… 조금 깎아 주실 순 없을까요?', 'Five hundred... could you knock a little off?', { next: 'haggle' }),
        ],
        note: ['나머지 반이 뭐냐고 물었다. 도장이나 의자처럼 안 고쳐도 당장 안 가라앉는 것들이고, 뜨는 데 필요한 건 채금자 씨가 다 본다고 했다.',
          'I asked what the other half was. Things like paint and seats that will not sink the boat if left, Chae Geum-ja said — everything needed to float, she sees to herself.'],
      }),
      haggle: scene([
        line(J, '깎으면 어디 한 군데를 덜 고쳐야 해요. 어디요. 엔진? 펌프?', 'If I cut the price, something gets fixed less. Which? The engine? The pump?'),
        line(P, '…', '...'),
        line(J, '그래서 못 깎아요.', "That's why I can't.", { act: 'shake_head' }),
        line(J, '대신 이 배는 다른 사람한테 안 넘길게요. 조선소는 못 기다려도 배는 기다려요.', "But I won't let anyone else have this boat. The yard can't wait, but the boat can."),
      ], {
        end: endTalk({ accept: true, offer: 'haggle' }),
        note: ['깎아 줄 수 없느냐고 했다가, 그럼 엔진이냐 펌프냐 어디를 덜 고치겠냐는 물음을 들었다. 대신 이 배는 다른 사람에게 넘기지 않겠다고 했다.',
          'When I asked for a discount, she asked which to fix less — the engine or the pump. She would not cut the price, but she promised not to let anyone else have the boat.'],
      }),
      unsure: scene([
        line(J, '모를 땐 숫자를 쪼개요. 오백을 한 번에 보면 막막해요.', "When you don't know, break the number down. Look at five hundred all at once and it's overwhelming."),
        line(J, '위판 한 번에 얼마, 그걸 몇 번. 그렇게 보면 날짜가 나와요.', 'So much per auction lot, so many lots. Look at it like that and you get a date.'),
        line(P, '날짜요.', 'A date.'),
        line(J, '날짜가 나오면 그다음은 바다 일이에요. 그건 할 줄 알잖아요. 시작해요.', "Once you have a date, the rest is sea work. You know how to do that. Get started."),
      ], {
        end: endTalk({ accept: true, offer: 'unsure' }),
        note: ['오백을 모을 수 있을지 모르겠다고 했다. 채금자 씨는 숫자를 쪼개 보라고, 위판 한 번에 얼마씩 몇 번이면 날짜가 나온다고 했다.',
          'I said I did not know if I could save five hundred. Chae Geum-ja told me to break the number down — so much per lot, so many lots, and a date appears.'],
      }),
    },
  },
  {
    id: 'm4_01_done', questId: 'M4-01', at: 'complete', npcId: J, start: 'start',
    nodes: {
      start: scene([
        line(P, '오백, 모았어요.', 'I have the five hundred.'),
        line(J, '오백. 됐어요.', "Five hundred. That'll do.", { act: 'nod' }),
        line(J, '반은 고쳤고, 반은 타면서 고치는 거예요.', 'Half is fixed. The other half you fix as you go.'),
        line(P, '정말 반만 고친 채로 나가는 거네요.', 'So I really do go out with only half fixed.'),
        line(J, '첫 배는 다 그래요.', 'Every first boat is like that.'),
      ], {
        choices: [
          opt('half', '반만 고치고 나머지는 타면서 고칠게요', "Half now, and I'll fix the rest as I go", { next: 'half' }),
          opt('worry', '반만 고친 배가 바다에 나가도 될까요?', 'Is a half-fixed boat all right at sea?', {
            say: ['반만 고친 배가 바다에 나가도 괜찮을까요?', 'Is it really all right to take a half-fixed boat to sea?'], next: 'worry' }),
          opt('name_ask', '이 배 이름은 제가 정해도 될까요?', 'May I name this boat myself?', { next: 'name_ask' }),
        ],
        note: ['오백만 원을 채워 조선소에 갔다. 채금자 씨는 반은 고쳤고 반은 타면서 고치는 거라고, 첫 배는 다 그렇다고 했다.',
          'With the five million won saved, I went to the shipyard. Half is fixed and half gets fixed along the way, Chae Geum-ja said — every first boat is like that.'],
      }),
      half: scene([
        line(J, '그게 답이에요. 전부 고치고 타는 배는 없어요.', "That's the answer. No boat gets everything fixed before it sails."),
        line(J, '고친 반은 제가 장담해요. 안 고친 반은 견적서 뒤에 적어 뒀어요.', 'I vouch for the half that is fixed. The unfixed half is listed on the back of the estimate.'),
        line(P, '하나씩 지워 나갈게요.', "I'll cross them off one by one."),
      ], {
        end: endTalk({ complete: 'half', lineKo: '다 지우는 날 진짜 내 배가 되는 거예요.', lineEn: 'The day you cross them all off, she becomes truly yours.' }),
        note: ['나머지는 타면서 고치겠다고 했다. 채금자 씨는 견적서에 자기 이름으로 보증을 써 주며, 안 고친 반은 뒤에 적어 뒀다고 했다.',
          'I said I would fix the rest as I go. Chae Geum-ja wrote a guarantee on the estimate in her own name and said the unfixed half was listed on the back.'],
      }),
      worry: scene([
        line(J, '안 되는 반은 제가 골라 뒀어요. 되는 반이에요.', "I picked out the half that can't wait. This is the half that can."),
        line(J, '이거 봐요. 검수표.', 'Look. The inspection sheet.', { act: 'peer' }),
        line(P, '…이걸 다 보신 거예요?', '...You checked all of this?'),
        line(J, '걱정하는 건 좋아요. 걱정 안 하는 선주가 제일 무서워요.', 'Worrying is good. An owner who never worries is the scariest kind.'),
      ], {
        end: endTalk({ complete: 'worry', lineKo: '대신 그 걱정은 검수표로 해요. 감으로 하지 말고요.', lineEn: 'Just do your worrying with the inspection sheet. Not with your gut.' }),
        note: ['반만 고친 배가 괜찮냐고 물었다. 채금자 씨는 검수표를 보여 주며, 걱정은 좋지만 감 말고 검수표로 하라고 했다.',
          'I asked if a half-fixed boat was safe. Chae Geum-ja showed me the inspection sheet — worrying is good, she said, but do it with the sheet, not my gut.'],
      }),
      name_ask: scene([
        line(J, '당연하죠. 이름은 주인이 정해요.', 'Of course. The owner names her.'),
        line(J, '수리 끝나면 선수에 쓰는 거예요. 아직은 쓰지 마요.', "You paint it on the bow once repairs are done. Don't yet."),
        line(P, '좋은 이름을 생각해 둘게요.', "I'll think of a good name."),
      ], {
        end: endTalk({ complete: 'name_ask', lineKo: '배 이름은 한 번 쓰면 잘 안 바꿔요. 바꾸면 운이 샌다는 사람도 있고요.', lineEn: "Once a boat's name is painted on, you rarely change it. Some say changing it lets the luck leak out." }),
        note: ['배 이름을 내가 정해도 되느냐고 물었다. 당연하다고, 수리가 끝나면 선수에 쓰는 거니 좋은 이름을 생각해 오라고 했다.',
          'I asked whether I could name the boat. Of course, she said — it goes on the bow when the repairs are done, so think of a good one.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-02 「첫 배」 — 채금자
  // ═══════════════════════════════════════════
  {
    id: 'm4_02_offer', questId: 'M4-02', at: 'offer', npcId: J, start: 'start',
    nodes: {
      start: scene([
        line(J, '수리 끝났어요.', 'The repairs are done.'),
        line(P, '…정말요?', '...Really?'),
        line(J, '이름 정했어요?', 'Have you picked a name?'),
        line(P, '이름이요…', 'A name...'),
        line(J, '정했으면 선수에 쓰세요. 페인트는 저기 있어요.', "If you have, paint it on the bow. The paint's over there."),
        line(P, '쓰고 나면요?', 'And after I paint it?'),
        line(J, '첫 운항이요. 부두 한 바퀴. 멀리 가지 마요.', "Her first run. One lap of the harbor. Don't go far."),
        line(J, '나간 김에 세 마리는 올려 봐요. 첫 배 첫 고기요.', 'While you are out, land three. First fish from your first boat.'),
      ], {
        choices: [
          opt('own_hand', '정했어요. 손이 떨려도 제 손으로 쓸게요', "I've picked one. I'll paint it myself, shaky hands or not", {
            say: ['정했어요. 손이 떨려도 제 손으로 쓸게요.', "I've picked one. Even if my hands shake, I'll paint it myself."], next: 'own_hand' }),
          opt('lap', '부두 한 바퀴만 도는 이유가 있나요?', 'Is there a reason for just one harbor lap?', { next: 'lap' }),
          opt('no_name', '아직 이름을 못 정했어요', "I haven't picked a name yet", {
            say: ['아직 이름을 못 정했어요. 좋은 게 안 떠올라서요.', "I haven't picked a name yet. Nothing good comes to mind."], next: 'no_name' }),
        ],
        note: ['수리가 끝났다. 채금자 씨는 이름을 정했으면 선수에 쓰고, 첫 운항은 부두 한 바퀴만, 나간 김에 세 마리를 올려 보라고 했다.',
          'The repairs were done. Chae Geum-ja told me to paint the name on the bow, keep the first run to one lap of the harbor, and land three fish while out.'],
      }),
      own_hand: scene([
        line(J, '떨리는 손으로 쓴 글씨가 오래 가요. 반듯하게 쓴 건 다들 잊어버리거든요.', 'Letters painted with a shaky hand last. The neat ones, everybody forgets.'),
        line(P, '…그럼 마음 놓고 떨게요.', '...Then I will shake without worrying.'),
        line(J, '페인트는 두 번 칠해요. 바닷바람은 한 번 칠한 걸 한 철이면 벗겨 내요.', 'Two coats of paint. Sea wind strips a single coat in one season.'),
        line(J, '다 마르면 시동 걸어요. 한 바퀴만.', "Start her up once it's dry. Just one lap."),
      ], {
        end: endTalk({ accept: true, offer: 'own_hand' }),
        note: ['떨려도 내 손으로 쓰겠다고 했다. 채금자 씨는 떨리는 손으로 쓴 글씨가 오래 간다며, 페인트는 두 번 칠하라고 했다.',
          'I said I would paint it myself, shaking or not. Letters painted by a shaky hand last, Chae Geum-ja said — and give it two coats.'],
      }),
      lap: scene([
        line(J, '첫 운항은 배를 아는 시간이에요.', 'The first run is for getting to know the boat.'),
        line(J, '키를 얼마나 돌려야 도는지, 서는 데 얼마나 걸리는지.', 'How far to turn the wheel to come about. How long she takes to stop.'),
        line(P, '그걸 부두 안에서 익히라는 거죠.', 'And you want me to learn that inside the harbor.'),
        line(J, '모르고 나가면 바다 한가운데서 배워야 해요. 거기선 배울 시간이 없어요.', "Go out without knowing and you learn in the middle of the sea. There's no time to learn out there."),
        line(J, '부두 안에서 다 틀려 보세요. 고기는 그다음이에요.', 'Make every mistake inside the harbor. The fish come after.'),
      ], {
        choices: [
          opt('ok', '부두 안에서 다 틀려 볼게요', "I'll make my mistakes inside the harbor", {
            end: endTalk({ accept: true, offer: 'ask_lap' }),
            note: ['첫 운항은 배를 아는 시간이라고 했다. 부두 안에서 다 틀려 보기로 했다.', 'The first run is for getting to know the boat, she said. I would make every mistake inside the harbor.'] }),
          opt('further', '한 바퀴로는 좀 아쉬운데요', 'One lap feels a bit short', {
            say: ['그래도 한 바퀴로는 아쉬워요. 조금만 더 나가 보면 안 될까요?', "Still, one lap feels short. Couldn't I go out just a little further?"], next: 'further' }),
        ],
        note: ['왜 한 바퀴만이냐고 물었다. 키를 얼마나 돌려야 도는지, 서는 데 얼마나 걸리는지 아는 시간이라고, 바다 한가운데선 배울 시간이 없다고 했다.',
          'I asked why only one lap. It is time to learn how far to turn the wheel and how long she takes to stop, Chae Geum-ja said — out at sea there is no time to learn.'],
      }),
      further: scene([
        line(J, '안 돼요.', 'No.', { act: 'shake_head' }),
        line(J, '첫날 멀리 나간 사람은 둘 중 하나예요. 잘하는 사람이거나 운 좋은 사람.', 'People who go far on day one are one of two things. Skilled, or lucky.'),
        line(P, '…어느 쪽인지는요?', '...And how do you tell which?'),
        line(J, '돌아와 봐야 알아요. 오늘은 한 바퀴. 세 마리는 부두 앞에서도 나와요.', 'Only when they come back. Today, one lap. Three fish come up right off the dock, too.'),
      ], {
        end: endTalk({ accept: true, offer: 'further' }),
        note: ['조금만 더 나가 보고 싶다고 했다가 팔짱 낀 채로 안 된다는 말을 들었다. 첫날 멀리 나간 사람이 잘하는 건지 운이 좋은 건지는 돌아와 봐야 안다고 했다.',
          'I asked to go a little further and got a flat no, arms folded. Whether someone who goes far on day one is skilled or lucky, she said, you only learn when they come back.'],
      }),
      no_name: scene([
        line(J, '어렵게 생각하지 마요. 부르기 쉬운 이름이요.', "Don't overthink it. Something easy to call."),
        line(J, '무전으로 불렀을 때 바람 소리에 안 묻히는 거.', "Something that won't get lost in the wind over the radio."),
        line(P, '바람 소리에 안 묻히는 이름…', "A name that won't get lost in the wind..."),
        line(J, '그리고 부르면 마음이 놓이는 이름. 생각나는 사람이 있으면 거기서 따 와도 돼요.', 'And a name that settles you when you say it. If someone comes to mind, you can take it from them.'),
        line(J, '정하면 선수에 쓰고 나가요.', 'Once you decide, paint it on the bow and go.'),
      ], {
        end: endTalk({ accept: true, offer: 'no_name' }),
        note: ['아직 이름을 못 정했다고 했다. 채금자 씨는 무전에서 바람 소리에 안 묻히고 부르면 마음이 놓이는 이름이면 된다고, 생각나는 사람에게서 따 와도 된다고 했다.',
          'I said I had not picked a name. Something that carries over the wind on the radio and settles you when you say it, Chae Geum-ja said — I could even take it from someone who comes to mind.'],
      }),
    },
  },
  {
    id: 'm4_02_done', questId: 'M4-02', at: 'complete', npcId: J, start: 'start',
    nodes: {
      start: scene([
        line(J, '돌아왔네요.', "You're back."),
        line(P, '…돌아왔어요. 제 배로요.', '...I am back. On my own boat.'),
        line(J, '첫 운항. 세 마리도 봤어요.', 'Her first run. I saw the three fish too.'),
        line(J, '배 모는 건 이제 몸으로 익혀요. 그리고 이건 첫 배 축하금이에요. 연료값이요.', 'Handling a boat is yours to learn by doing now. And this is a gift for your first boat. Fuel money.'),
        line(P, '…고맙습니다.', '...Thank you.'),
      ], {
        choices: [
          opt('name_why', '이름은 아버지 배 이름에서 한 글자 땄어요', "I took one letter from my father's boat for the name", {
            say: ['배 이름은 아버지 배 이름에서 한 글자를 땄어요.', "For the boat's name, I took one letter from my father's boat."], next: 'name_why' }),
          opt('scared', '솔직히 무서웠어요', 'Honestly, I was scared', {
            say: ['솔직히 무서웠어요. 남의 배랑은 다르더라고요.', "Honestly, I was scared. It's different from someone else's boat."], next: 'scared' }),
          opt('arms', '팔짱 끼고 보시던데, 걱정되셨어요?', 'You watched with your arms folded — were you worried?', {
            say: ['부두에서 팔짱 끼고 보시던데, 걱정되셨어요?', 'You watched from the dock with your arms folded. Were you worried?'], next: 'arms' }),
        ],
        note: ['내 배로 부두를 한 바퀴 돌고 세 마리를 올려 돌아왔다. 채금자 씨는 첫 배 축하금으로 연료값을 내줬다.',
          'I took my own boat once around the harbor, landed three fish and came back. Chae Geum-ja gave me fuel money as a first-boat gift.'],
      }),
      name_why: scene([
        act(J, 'silence'),
        line(J, '…좋은 이름이에요.', '...That is a good name.'),
        line(J, '아버지 배에서 한 글자 따 온 이름이면 함부로 못 타요. 그게 좋은 거예요.', "With a letter from your father's boat in her name, you can't take her out carelessly. That's a good thing."),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'name_why', lineKo: '무리하고 싶은 날, 선수의 그 글자가 한 번 붙잡아 줄 거예요.', lineEn: 'On days you want to push too hard, that letter on the bow will hold you back once.' }),
        note: ['배 이름에 아버지 배 이름의 한 글자를 땄다고 했다. 채금자 씨는 팔짱을 풀고 처음으로 웃으며, 무리하고 싶은 날 그 글자가 붙잡아 줄 거라고 했다.',
          "I told her I took a letter from my father's boat for the name. Chae Geum-ja unfolded her arms and smiled for the first time — on days I want to push too hard, she said, that letter will hold me back."],
      }),
      scared: scene([
        line(J, '무서운 게 맞아요. 안 무서우면 그 사람이 위험해요.', 'Being scared is right. People who are not are the dangerous ones.'),
        line(J, '연료값 봉투에 조타 메모 끼워 뒀어요.', 'I tucked some helm notes into the fuel-money envelope.'),
        line(P, '메모요?', 'Notes?'),
        line(J, '무서운 사람은 줄을 두 번 보고 기름을 한 번 더 봐요. 그게 다 사고를 막아요.', 'Scared people check the lines twice and the fuel once more. That is what prevents accidents.'),
      ], {
        end: endTalk({ complete: 'scared', lineKo: '그 메모, 키 옆에 붙여 둬요.', lineEn: 'Stick those notes up next to the wheel.' }),
        note: ['솔직히 무서웠다고 했다. 채금자 씨는 무서운 게 맞다며, 연료값 봉투에 끼운 조타 메모를 키 옆에 붙여 두라고 했다.',
          'I admitted I had been scared. That is right, Chae Geum-ja said, and told me to stick the helm notes from the fuel-money envelope next to the wheel.'],
      }),
      arms: scene([
        line(J, '걱정은요. 계산하고 있었어요. 어디서 키를 늦게 돌리는지.', 'Worried? I was calculating. Where you were late on the wheel.'),
        line(P, '…늦었나요?', '...Was I late?'),
        line(J, '세 번째 모퉁이에서 늦었어요.', 'At the third corner, yes.'),
      ], {
        end: endTalk({ complete: 'arms_folded', lineKo: '다음엔 거기서 반 박자 먼저 돌려요. 그것만 고치면 돼요.', lineEn: 'Next time, turn half a beat earlier there. Fix that and you are fine.' }),
        note: ['팔짱 끼고 보던 게 걱정이었냐고 물었다. 채금자 씨는 팔짱을 끝까지 풀지 않은 채, 세 번째 모퉁이에서 반 박자 먼저 키를 돌리라고 했다.',
          'I asked if she had been worried, watching with her arms folded. Never unfolding them, Chae Geum-ja told me to turn the wheel half a beat earlier at the third corner.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-03 「지세포의 밤」 — 채파도
  // ═══════════════════════════════════════════
  {
    id: 'm4_03_offer', questId: 'M4-03', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '{player} 씨! 밤에 나가요!', "{player}! Let's go out tonight!"),
        line(P, '밤에요? 어디로요?', 'Tonight? Where to?'),
        line(D, '지세포 앞바다요! 등선 몰게요! 제가요!', "Off Jisepo! I'll drive the light boat! Me!"),
        line(P, '등선이면… 불 켜고 나가는 작은 배죠?', 'A light boat... the little one that goes out with lamps?'),
        line(D, '네! 광어 잡으러 가요. 광어는 다운샷이에요.', "Yes! We're going for flatfish. Flatfish means a downshot."),
        line(D, '바닥 톡톡. 그리고 기다리기.', 'Tap-tap on the bottom. Then wait.'),
        line(P, '뜰채는 누가 대요?', 'Who handles the landing net?'),
        line(D, '제가 댈게요!', 'I will!'),
        line(D, '…아마.', '...Probably.', { act: 'look_away' }),
      ], {
        choices: [
          opt('go', '좋아요, 나가요. 뜰채는 믿을게요', "All right, let's go. I'm trusting you with the net", {
            say: ['좋아요, 나가요. 뜰채는 채파도 씨만 믿을게요.', "All right, let's go. I'm trusting the net to you, Pa-do."], next: 'go' }),
          opt('maybe', '아마요? 왜 아마가 붙어요?', 'Probably? Why probably?', {
            say: ['아마요? 뜰채 대는 데 왜 아마가 붙어요?', 'Probably? Why is there a probably on handling the net?'], next: 'maybe' }),
          opt('permission', '채금자 씨 허락은 받았어요?', 'Did you get permission from Geum-ja?', {
            say: ['밤에 등선이라니, 채금자 씨 허락은 받았어요?', 'A light boat at night — did you get permission from Geum-ja?'], next: 'permission' }),
        ],
        note: ['채파도 씨가 밤에 지세포 앞바다로 등선을 몰고 나가자고 했다. 광어는 다운샷으로 바닥을 톡톡 치며 기다리면 되고, 뜰채는 자기가 대겠다고 — 아마.',
          'Chae Pa-do wanted to take the light boat out off Jisepo at night. Flatfish on a downshot — tap the bottom and wait — and he would handle the net. Probably.'],
      }),
      go: scene([
        line(D, '진짜요? 믿는다는 말 들은 거 처음이에요!', "Really? That's the first time anyone's said they trust me!"),
        line('', '(등선 시동을 한 번에 건다. 본인이 더 놀란다.)', '(He starts the light boat on the first try. He looks more surprised than anyone.)'),
        line(D, '광어는 바닥에 딱 붙어 있어요. 봉돌이 바닥에 닿으면 톡톡, 그리고 기다려요.', 'Flatfish lie flat on the bottom. When the sinker touches down, tap-tap, then wait.'),
        line(P, '기다리는 게 중요하군요.', 'So the waiting matters.'),
        line(D, '광어는 급한 사람 싫어해요. 저 같은 사람이요. 가요!', 'Flatfish hate people in a hurry. People like me. Let\'s go!'),
      ], {
        end: endTalk({ accept: true, offer: 'go_trust' }),
        note: ['뜰채는 믿겠다고 하자 채파도 씨는 믿는다는 말을 처음 들었다며, 등선 시동을 한 번에 걸고 자기가 더 놀랐다.',
          'When I said I trusted him with the net, Chae Pa-do said it was the first time anyone had said that — and started the light boat on the first try, more surprised than anyone.'],
      }),
      maybe: scene([
        line(D, '아, 그게… 뜰채가 좀 어려워요.', "Ah, well... the net's a bit hard.", { act: 'look_away' }),
        line(D, '고기가 마지막에 꼭 한 번 더 뛰거든요. 그때 손이 먼저 나가요.', 'Fish always jump one more time right at the end. That is when my hands move too soon.'),
        line(P, '그럼 어떻게 해야 하는데요?', 'So what are you supposed to do?'),
        line(D, '머리부터 넣으면 된다고 선장님이 그랬어요. 머리부터. 외웠어요!', 'The captain says head first. Head first. I have it memorized!'),
        line(D, '…아마. 아, 아마는 빼 주세요.', '...Probably. Ah — forget the probably.'),
      ], {
        choices: [
          opt('head', '머리부터요. 저도 외워 둘게요', "Head first. I'll memorize it too", {
            end: endTalk({ accept: true, offer: 'ask_maybe' }),
            note: ['뜰채는 머리부터 넣는 거라고 둘이 같이 외웠다.', 'Head first into the net — the two of us memorized it together.'] }),
          opt('downshot', '다운샷은 어떻게 하는 거예요?', 'How does a downshot work?', {
            say: ['다운샷은 처음인데, 그건 어떻게 하는 거예요?', "It's my first downshot. How does it work?"], next: 'downshot' }),
        ],
        note: ['왜 아마가 붙냐고 물었다. 고기가 마지막에 한 번 더 뛸 때 손이 먼저 나간다고, 선장님이 머리부터 넣으라 했다며 외웠다고 했다 — 아마.',
          'I asked why he said probably. Fish jump once more at the end and his hands move too soon, Chae Pa-do said — the captain told him head first, and he had it memorized. Probably.'],
      }),
      downshot: scene([
        line(D, '봉돌을 맨 밑에 달고, 바늘은 그 위에 달아요.', 'The sinker goes at the very bottom, and the hook above it.'),
        line(D, '봉돌이 바닥에 닿아 있으면 미끼가 바닥 조금 위에서 놀아요.', 'With the sinker on the bottom, the bait plays just above it.'),
        line(P, '미끼를 살짝 띄우는 거네요.', 'So the bait floats a little.'),
        line(D, '광어는 바닥에서 위를 보고 있다가 먹어요. 그래서 띄우는 거예요.', 'Flatfish lie on the bottom looking up, then strike. That is why you lift it.', { act: 'nod' }),
        line(D, '이건 제가 진짜 잘 알아요. 진짜로요. 가요!', "This I really do know. Really. Let's go!"),
      ], {
        end: endTalk({ accept: true, offer: 'ask_downshot' }),
        note: ['다운샷을 물었다. 봉돌을 맨 밑에, 바늘은 그 위에 달아 미끼를 바닥 조금 위에 띄운다고 — 광어는 바닥에서 위를 보고 있다가 먹는다고 했다.',
          'I asked about the downshot. Sinker at the very bottom, hook above, so the bait hovers just off the bottom — flatfish lie there looking up and strike, Chae Pa-do said.'],
      }),
      permission: scene([
        line(D, '받았죠! 선장님이 키 줬어요. 사고만 안 치면 된대요.', 'Of course! The captain gave me the key. As long as I cause no trouble, she said.'),
        line(P, '…사고만 안 치면요.', '...As long as you cause no trouble.'),
        line(D, '걱정 마요. 배 위에서는 저 안 덜렁대요. 덜렁대는 건 땅에서만이에요.', "Don't worry. I'm not clumsy on a boat. Only on land."),
        line(D, '진짜예요. 타요!', 'Really. Get in!'),
      ], {
        end: endTalk({ accept: true, offer: 'permission' }),
        note: ['채금자 씨 허락은 받았느냐고 물었다. 채파도 씨는 열쇠를 자랑스럽게 흔들며, 배 위에서는 안 덜렁댄다고 했다.',
          "I asked if he had Geum-ja's permission. Chae Pa-do jingled the key proudly and swore he is never clumsy on a boat."],
      }),
    },
  },
  {
    id: 'm4_03_done', questId: 'M4-03', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '잡았다! 잡았어요!', 'Got it! We got it!'),
        line(P, '광어 흰 배가 뒤집히는 거, 봤어요?', 'Did you see its white belly flip over?'),
        line(D, '봤죠! 그리고 제가 뜰채를…', 'I did! And I, um, with the net...', { act: 'look_away' }),
        line(P, '…놓칠 뻔했죠.', '...Nearly dropped it.'),
        act(D, 'laugh'),
        line(D, '그건 비밀이에요. 선장님한테는요.', "That's a secret. From the captain, anyway."),
      ], {
        choices: [
          opt('secret', '비밀은 지킬게요. 뜰채는 잘 댔어요', "I'll keep the secret. You did fine with the net", { next: 'secret' }),
          opt('tell', '채금자 씨한테 뜰채 연습 부탁할게요', "I'll ask Geum-ja to give you net practice", {
            say: ['채금자 씨한테 말해야겠어요. 뜰채 연습 시켜 달라고요.', "I think I should tell Geum-ja. Ask her to give you some net practice."], next: 'tell' }),
          opt('swap', '뜰채는 다음부터 제가 댈게요', "I'll handle the net from now on", {
            say: ['뜰채는 다음부터 제가 댈게요. 채파도 씨는 배만 몰아요.', "I'll handle the net from now on. You just drive the boat, Pa-do."], next: 'swap' }),
        ],
        note: ['어둠 속에서 광어를 올렸다. 채파도 씨가 뜰채를 대다 놓칠 뻔했고, 둘이 한참 웃었다.',
          'We landed a flatfish in the dark. Chae Pa-do nearly dropped the net, and the two of us laughed for a long time.'],
      }),
      secret: scene([
        line(D, '역시!', 'I knew it!'),
        line(D, '선장님은 어차피 다 알 거예요. 원래 다 알아요.', 'The captain will know anyway. She always knows everything.'),
        line(P, '그럼 비밀이 소용없잖아요.', "Then what's the point of a secret?"),
      ], {
        end: endTalk({ complete: 'secret', lineKo: '그래도 {player} 씨가 말 안 하면 저는 모른 척할 수 있잖아요. 그게 중요해요.', lineEn: "But if you don't say anything, {player}, I can pretend I don't know. That's what matters." }),
        note: ['비밀을 지켜 주겠다고 했다. 채파도 씨는 다음 등선 출조 명단에 내 이름을 먼저 썼다.',
          "I promised to keep the secret. Chae Pa-do wrote my name first on the list for the next light-boat trip."],
      }),
      tell: scene([
        line(D, '아…', 'Ah...'),
        act(D, 'silence'),
        line(D, '그건 그래요. 맞아요.', "That's... fair. You're right."),
      ], {
        end: endTalk({ complete: 'tell', lineKo: '대신 연습하는 날 제가 노려봐도, 웃으면서 노려보는 거예요. 알죠?', lineEn: "But if I glare at you on practice day, I'll be glaring with a smile. You know that, right?" }),
        note: ['채금자 씨에게 뜰채 연습을 부탁하겠다고 했다. 채파도 씨는 맞는 말이라면서도, 연습하는 날 나를 노려볼 거라고 — 웃으면서 — 했다.',
          'I said I would ask Chae Geum-ja to give him net practice. Chae Pa-do agreed it was fair, but said he would glare at me on practice day — with a smile.'],
      }),
      swap: scene([
        line(D, '아… 그것도 좋네요. 사실 저는 배가 더 좋아요.', 'Ah... that works too. Honestly, I like driving better.'),
        line(D, '근데 언젠가는 제가 댈 거예요. 한 마리도 안 놓치고.', 'But someday I will handle the net. Without losing a single fish.'),
        line(P, '그날 기다릴게요.', "I'll look forward to that day."),
      ], {
        end: endTalk({ complete: 'net_swap', lineKo: '그날은 꼭 보러 와요. 선장님이랑 같이요.', lineEn: 'Come and watch that day, for sure. With the captain.' }),
        note: ['뜰채는 내가 대고 채파도 씨는 배만 몰기로 했다. 그는 등선 키를 만지작거리며, 언젠가는 한 마리도 안 놓치고 자기가 대겠다고 했다.',
          "We agreed I would handle the net and Chae Pa-do would drive. Fiddling with the light boat's key, he said that someday he would net them himself without losing one."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-04 「안전 검사」 — 동명항 어촌계
  // ═══════════════════════════════════════════
  {
    id: 'm4_04_offer', questId: 'M4-04', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '안전 검사다.', 'Safety inspection.'),
        line(P, '제 배요?', 'For my boat?'),
        line(C, '그래. 서른 항목. 하나라도 미달이면 재검이다.', "Yes. Thirty items. Fail even one and it's a re-inspection."),
        line(P, '서른 개나요? 뭘 보는데요?', 'Thirty? What do they check?'),
        line(C, '구명장비, 소화기, 신호탄. 체크리스트대로 다.', 'Life-saving gear, extinguishers, flares. Everything on the checklist.'),
        line(C, '조끼 유효기간부터 봐.', "Check the life vests' expiry dates first."),
        line(P, '…모자란 게 있으면요?', "...And if something's missing?"),
        line(C, '두 점쯤은 모자랄 거다. 처음 배는 다 그래. 검사 전에 만들어 놔.', "You'll be short about two items. Every first boat is. Make them before the inspection."),
      ], {
        choices: [
          opt('check', '서른 항목, 하나씩 다 볼게요', "I'll go through all thirty, one by one", { next: 'check' }),
          opt('vest', '조끼에도 유효기간이 있어요?', 'Life vests have expiry dates?', { next: 'vest' }),
          opt('retest', '하나 떨어지면 재검까지 얼마나 걸려요?', 'If one fails, how long until re-inspection?', { next: 'retest' }),
        ],
        note: ['어촌계에서 내 배 안전 검사를 받으라고 했다. 서른 항목 중 하나라도 미달이면 재검이고, 모자란 장비 두 점쯤은 검사 전에 만들어 두라고, 조끼 유효기간부터 보라고 했다.',
          "The co-op told me my boat needed a safety inspection. Fail any of the thirty items and it is a re-inspection — make the two or so missing items beforehand, and check the vests' expiry dates first."],
      }),
      check: scene([
        line(C, '하나씩은 기본이다. 두 번씩 봐라.', 'One by one is the minimum. Look twice.'),
        line(P, '두 번이요?', 'Twice?'),
        line(C, '한 번은 네 눈으로, 한 번은 검사관 눈으로.', "Once with your own eyes, once with an inspector's."),
        line(C, '제일 많이 걸리는 게 조끼, 소화기, 신호탄 날짜다. 물건은 멀쩡해 보여도 날짜가 지나면 없는 거다.', 'Vest, extinguisher and flare dates fail most. However fine it looks, past its date it might as well not exist.'),
        line(C, '모자라면 오늘 갖춰.', "If you're short, sort it out today."),
      ], {
        end: endTalk({ accept: true, offer: 'check_twice' }),
        note: ['하나씩 다 보겠다고 하자, 두 번씩 보라고 했다. 한 번은 내 눈으로, 한 번은 검사관 눈으로 — 날짜 지난 물건은 없는 거라고.',
          "When I said I'd check every item, I was told to check each twice — once with my eyes, once with an inspector's. Anything past its date might as well not exist."],
      }),
      vest: scene([
        line(C, '있다. 특히 부풀리는 조끼는 가스통이랑 터지는 장치에 날짜가 있어.', 'They do. Inflatable ones especially — the gas canister and the trigger both have dates.'),
        line(P, '날짜가 지나면요?', 'And past the date?'),
        line(C, '물에 빠져도 안 부푼다.', "It won't inflate when you go in."),
        line(C, '멀쩡해 보이는 조끼가 제일 위험하다. 사람이 그걸 믿고 빠지거든.', 'A vest that looks fine is the most dangerous. People trust it and go in.'),
        line(C, '그래서 조끼부터 보라는 거다.', "That's why I said check the vests first."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_vest' }),
        note: ['조끼에도 유효기간이 있느냐고 물었다. 부풀리는 조끼는 가스통과 터지는 장치에 날짜가 있어서, 지나면 물에 빠져도 안 부푼다고 했다.',
          'I asked whether vests had expiry dates. Inflatable ones do, on the gas canister and trigger — past the date, they will not inflate when you go in.'],
      }),
      retest: scene([
        line(C, '하루. 운 나쁘면 이틀.', 'A day. Two if you are unlucky.'),
        line(C, '그동안 배는 묶여 있고 돈은 안 들어온다.', "Meanwhile the boat's tied up and no money comes in."),
        line(P, '…', '...'),
        line(C, '그러니까 미리 봐. 모자란 건 오늘 만들어 놔. 검사 날 아침에 알면 늦어.', 'So check ahead. Make what is missing today. Find out the morning of the inspection and it is too late.'),
      ], {
        choices: [
          opt('ok', '모자란 건 오늘 만들어 둘게요', "I'll make what's missing today", {
            end: endTalk({ accept: true, offer: 'ask_retest' }),
            note: ['재검이면 하루, 운 나쁘면 이틀 배가 묶인다고 했다. 모자란 건 오늘 만들어 두기로 했다.', 'A re-inspection ties the boat up a day, two if unlucky. I would make the missing items today.'] }),
          opt('complain', '배는 멀쩡한데, 서른 개를 다 봐야 해요?', 'The boat is fine — do we really need all thirty?', { next: 'complain' }),
        ],
        note: ['하나 떨어지면 재검까지 얼마나 걸리느냐고 물었다. 하루, 운 나쁘면 이틀이고 그동안 배는 묶이고 돈은 안 들어온다고 했다.',
          'I asked how long a re-inspection takes. A day, two if unlucky, I was told — the boat sits tied up and no money comes in.'],
      }),
      complain: scene([
        line(C, '배가 멀쩡한지는 검사관이 정한다. 네가 아니라.', 'Whether the boat is fine is for the inspector to decide. Not you.'),
        line(C, '서른 항목은 다 누가 다치고 나서 생긴 거다. 하나하나가 사람 하나야.', 'Every one of those thirty items exists because somebody got hurt. Each one is a person.'),
        line(P, '…', '...'),
        line(C, '귀찮으면 귀찮은 대로 해. 빼먹지만 마. 빼먹은 하나가 네 손님일 수도 있다.', "If it's a bother, be bothered. Just don't skip any. The one you skip might be your passenger."),
      ], {
        end: endTalk({ accept: true, offer: 'complain' }),
        note: ['배가 멀쩡한데 서른 개를 다 봐야 하느냐고 투덜거렸다. 서른 항목은 다 누가 다치고 나서 생긴 거라고, 빼먹은 하나가 내 손님일 수도 있다고 했다.',
          'I grumbled that the boat was fine. Every one of the thirty items exists because someone got hurt, I was told — the one I skip could be my passenger.'],
      }),
    },
  },
  {
    id: 'm4_04_done', questId: 'M4-04', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '통과.', 'Passed.'),
        line(P, '…한 번 떨어지고 나서요. 조끼 하나가 유효기간이 지났더라고요.', '...After failing once. One vest was past its date.'),
        line(C, '조끼 하나에 하루.', 'One vest, one day.'),
        line(C, '그게 바다 값이다. 잊지 마라.', "That's the price of the sea. Don't forget it."),
      ], {
        choices: [
          opt('learned', '조끼 하나에 하루. 잊지 않을게요', "One vest, one day. I won't forget", { next: 'learned' }),
          opt('annoyed', '조끼 하나로 하루를 잃은 게 억울해요', 'Losing a whole day over one vest feels unfair', { next: 'annoyed' }),
          opt('guest', '다음부터는 손님 조끼도 출항 전에 볼게요', "From now on, I'll check passengers' vests before sailing", { next: 'guest' }),
        ],
        note: ['조끼 하나가 유효기간이 지나 한 번 재검을 받고서야 통과했다. 어촌계 사람은 조끼 하나에 하루, 그게 바다 값이라고 했다.',
          'One vest was past its date, so I passed only after a re-inspection. One vest, one day, the co-op man said — that is the price of the sea.'],
      }),
      learned: scene([
        line(C, '그렇게 말하는 선장 배엔 사고가 없다.', 'A captain who says that has no accidents on board.', { act: 'nod' }),
        line(P, '…', '...'),
        line(C, '명부에 곱게 적힌 이름은 지우기 아깝다. 그 이름 깨끗하게 지키는 게 선장 일이야.', 'A name written neatly in the register is a shame to erase. Keeping it clean is the job of a captain.'),
      ], {
        end: endTalk({ complete: 'learned', lineKo: '다음 검사 때도 조끼부터 봐라.', lineEn: 'At the next inspection, too, check the vests first.' }),
        note: ['잊지 않겠다고 했다. 검사관이 내 배 이름을 명부에 곱게 적었고, 그 이름을 깨끗하게 지키는 게 선장 일이라고 했다.',
          "I said I would not forget. The inspector wrote my boat's name neatly in the register, and I was told that keeping that name clean is a captain's job."],
      }),
      annoyed: scene([
        line(C, '억울해야 다음엔 안 잃는다. 억울한 게 맞아.', 'Feel it was unfair, and you will not lose a day next time. That feeling is right.'),
        line(C, '하루 잃은 건 아깝지.', 'Losing a day hurts.'),
        line(P, '네, 많이요.', 'It does. A lot.'),
        line(C, '근데 그 하루가 바다에서 조끼 하나 모자란 날이었으면 어땠을지 생각해 봐.', 'But think what it would have been if that day had been a day at sea, one vest short.'),
      ], {
        end: endTalk({ complete: 'annoyed', lineKo: '그럼 덜 억울할 거다. 수수료는 반만 받지.', lineEn: "Then it'll feel less unfair. I'll only take half the fee." }),
        note: ['하루를 잃은 게 억울하다고 했다. 억울해야 다음엔 안 잃는다며, 그래도 검사 수수료는 반만 받았다.',
          'I said losing the day felt unfair. Feeling that way means I will not lose one next time, I was told — and only half the inspection fee was taken.'],
      }),
      guest: scene([
        line(C, '그래. 손님 조끼가 제일 먼저 낡는다.', "Right. Passengers' vests wear out first."),
        line(P, '왜요?', 'Why is that?'),
        line(C, '자기 조끼가 아니니까 아무렇게나 던져 두거든.', 'They are not their own, so people toss them anywhere.'),
        line(C, '출항 전에 한 번, 돌아와서 한 번. 그게 선장 일이다.', "Once before sailing, once after coming back. That's a captain's job."),
      ], {
        end: endTalk({ complete: 'guest_vests', lineKo: '낚싯배는 고기보다 사람을 먼저 싣는 배야.', lineEn: 'An angling boat carries people before it carries fish.' }),
        note: ['손님 조끼도 출항 전에 보겠다고 했다. 손님 조끼가 제일 먼저 낡으니 출항 전에 한 번, 돌아와서 한 번 보라고 했다.',
          "I said I would check passengers' vests before sailing. Theirs wear out first, I was told — check once before sailing and once after coming back."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-05 「밤바다 갈치」 — 오가윤
  // ═══════════════════════════════════════════
  {
    id: 'm4_05_offer', questId: 'M4-05', at: 'offer', npcId: Y, start: 'start',
    nodes: {
      start: scene([
        line(Y, '오셨네요.', 'You came.', { act: 'look_up' }),
        line(P, '늦었나요?', 'Am I late?'),
        line(Y, '아니요. 저도 방금 왔어요. 유니폼도 못 갈아입었네요.', "No. I just got here too. I didn't even change out of my uniform."),
        line(P, '오늘은 뭘 낚아요?', 'What are we fishing for tonight?'),
        line(Y, '갈치요. 밤낚시예요. 배에 집어등 켤게요.', "Hairtail. Night fishing. I'll switch on the fish lamps on the boat."),
        line(Y, '불을 켜면 갈치가 그 아래로 올라와요.', 'When the lamps are on, hairtail rise up under them.'),
        line(Y, '이빨 조심해요. 목줄 끊겨요.', 'Mind the teeth. They cut leaders.'),
        line(P, '…목줄을요?', '...The leader?'),
        line(Y, '칼 같아요.', 'Like knives.'),
      ], {
        choices: [
          opt('first', '좋아요. 여수 밤바다는 처음이에요', "All right. It's my first night on the Yeosu sea", {
            say: ['좋아요. 여수 밤바다는 처음이에요.', "All right. It's my first time on the Yeosu sea at night."], next: 'first' }),
          opt('leader', '그럼 목줄은 뭘 써야 해요?', 'Then what leader should I use?', {
            say: ['목줄이 끊긴다면, 그럼 뭘 써야 해요?', 'If they cut the leader, what should I use?'], next: 'leader' }),
          opt('tired', '근무 끝나고 바로 오셨는데, 피곤하지 않으세요?', "Straight from work — aren't you tired?", { next: 'tired' }),
        ],
        note: ['오가윤 씨가 호텔 근무를 마치고 유니폼 차림으로 부두에 왔다. 배에 집어등을 켜고 여수 밤바다에서 갈치를 낚자며, 이빨이 목줄을 끊으니 조심하라고 했다.',
          'Oh Gayun came to the dock straight from her hotel shift, still in uniform. We would switch on the fish lamps and catch hairtail on the Yeosu sea at night — and mind the teeth, she said, they cut leaders.'],
      }),
      first: scene([
        line(Y, '처음이면 다행이에요.', "Good that it's your first."),
        line(P, '다행이요?', 'Good?'),
        line(Y, '처음 보는 사람은 다 조용해지거든요. 저도 오늘은 좀 조용하고 싶어서요.', "First-timers always go quiet. And tonight, I'd like a little quiet myself.", { act: 'look_away' }),
        line(Y, '불을 켜면 갈치가 서서 올라와요. 머리를 위로 하고요. 그래서 이빨이 먼저 보여요.', 'When the lights go on, hairtail rise standing up, head first. So you see the teeth first.'),
        line(Y, '가요.', "Let's go."),
      ], {
        end: endTalk({ accept: true, offer: 'first_night' }),
        note: ['여수 밤바다는 처음이라고 했다. 오가윤 씨는 처음 보는 사람은 다 조용해진다며, 자기도 오늘은 좀 조용하고 싶다고 했다.',
          'I said it was my first night on the Yeosu sea. First-timers always go quiet, Oh Gayun said — and tonight she wanted some quiet herself.'],
      }),
      leader: scene([
        line(Y, '와이어요. 가는 쇠줄.', 'Wire. Thin steel line.'),
        line(Y, '갈치 이빨은 나일론 줄을 칼처럼 잘라요.', 'Hairtail teeth cut nylon like a knife.'),
        line(P, '그럼 처음부터 와이어로 할게요.', "Then I'll start with wire."),
        line(Y, '처음엔 그냥 해 보세요. 한두 번 끊겨 봐야 와이어가 왜 필요한지 알아요.', 'Try it plain at first. You have to get cut off once or twice to know why you need wire.', { act: 'shake_head' }),
        line(Y, '그다음에 바꿔요. 그게 더 오래 기억나요.', "Then switch. You'll remember it longer that way."),
      ], {
        choices: [
          opt('ok', '한두 번 끊겨 볼게요', "I'll let it get cut once or twice", {
            end: endTalk({ accept: true, offer: 'ask_leader' }),
            note: ['와이어 목줄을 쓰되, 한두 번 끊겨 보고 바꾸기로 했다.', 'Wire leader, then — but only after getting cut off once or twice first.'] }),
          opt('teeth', '그 이빨, 손가락은 지키고 싶은데요', "About those teeth — I'd like to keep my fingers", {
            say: ['갈치 이빨이 그렇게 무서워요? 손가락은 지키고 싶은데요.', "Are hairtail teeth really that scary? I'd like to keep my fingers."], next: 'teeth' }),
        ],
        note: ['목줄을 물었다. 갈치 이빨은 나일론 줄을 칼처럼 자르니 와이어를 쓰라고, 그래도 처음엔 한두 번 끊겨 봐야 오래 기억한다고 했다.',
          'I asked about the leader. Hairtail cut nylon like a knife, so use wire, Oh Gayun said — though getting cut off once or twice first makes it stick.'],
      }),
      teeth: scene([
        line(Y, '무서워요. 올리고 나서가 더 무서워요.', 'They are. More so after you have landed it.'),
        line(Y, '바늘 뺄 때 손 넣으면 물려요. 집게 하나 챙겨요.', 'Put your hand in to take the hook out and you will get bitten. Bring pliers.'),
        line(Y, '그리고 머리 말고 몸통을 잡아요. 미끄러우니까 수건으로요.', 'And hold the body, not the head. With a towel — they are slippery.'),
        act(Y, 'laugh'),
        line(Y, '손가락은 지켜 줄게요. 가요.', "I'll keep your fingers safe. Let's go."),
      ], {
        end: endTalk({ accept: true, offer: 'teeth_joke' }),
        note: ['손가락은 지키고 싶다고 했더니 오가윤 씨가 처음으로 조금 웃었다. 바늘은 집게로 빼고, 몸통을 수건으로 잡으라고 했다.',
          'When I said I wanted to keep my fingers, Oh Gayun smiled a little for the first time. Use pliers on the hook, she said, and grip the body with a towel.'],
      }),
      tired: scene([
        line(Y, '피곤해요. 그래서 왔어요.', "I am tired. That's why I came."),
        line(P, '…', '...'),
        line(Y, '방에 들어가면 생각이 많아지거든요.', 'When I go back to my room, my head fills up.'),
        line(Y, '바다에 불 켜 놓고 있으면 생각이 불 쪽으로 가요. 그게 좋아요.', 'With the lamps lit over the sea, my thoughts drift toward the light. I like that.', { act: 'look_sea' }),
        line(Y, '…갈치 얘기나 해요, 우리. 오늘은 그게 좋겠어요.', "...Let's just talk about hairtail. That would be best tonight."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_tired' }),
        note: ['피곤하지 않으냐고 물었다. 오가윤 씨는 피곤해서 왔다고, 방에 들어가면 생각이 많아진다며 오늘은 갈치 얘기나 하자고 했다.',
          "I asked if she wasn't tired. She was — that's why she came, Oh Gayun said; in her room her head fills up, so tonight let's just talk about hairtail."],
      }),
    },
  },
  {
    id: 'm4_05_done', questId: 'M4-05', at: 'complete', npcId: Y, start: 'start',
    nodes: {
      start: scene([
        line(Y, '잡았네요.', 'You caught one.'),
        line(P, '세 번째에 와이어로 바꿨어요. 두 번은 끊겼고요.', 'I switched to wire on the third try. Got cut off twice.'),
        line(Y, '은빛…', 'That silver...', { act: 'peer' }),
        line(Y, '예쁘죠.', "It's pretty, isn't it."),
        act(Y, 'silence'),
        line(Y, '저 오늘 좀 울었어요.', 'I cried a little today.', { act: 'look_away' }),
        line(Y, '묻지 마세요.', "Please don't ask."),
      ], {
        choices: [
          opt('silent', '묻지 않을게요. 갈치가 예뻤어요', "I won't ask. The hairtail was beautiful", { next: 'silent' }),
          opt('ask', '…무슨 일이 있었어요?', '...What happened?', { next: 'ask' }),
          opt('again', '울고 싶은 날엔 또 불러 주세요', 'On days you feel like crying, call me again', {
            say: ['울고 싶은 날엔 또 불러 주세요. 갈치는 핑계면 돼요.', 'On days you feel like crying, call me again. The hairtail can be the excuse.'], next: 'again' }),
        ],
        note: ['집어등 아래로 올라온 갈치를 보여 주자, 오가윤 씨는 은빛이 예쁘다고 했다. 그러고는 오늘 좀 울었다며 묻지 말아 달라고 했다.',
          'When I showed her the hairtail that came up under the lamps, Oh Gayun said the silver was pretty. Then she said she had cried a little today, and asked me not to ask.'],
      }),
      silent: scene([
        line(Y, '…고마워요.', '...Thank you.'),
        line(Y, '묻지 않아 주는 사람이 제일 고마워요.', "People who don't ask are the ones I'm most grateful for."),
        line(Y, '다들 괜찮냐고 물어서, 괜찮다고 대답하느라 더 힘들거든요.', 'Everyone asks if I am all right, and answering that I am makes it harder.'),
      ], {
        end: endTalk({ complete: 'silent', lineKo: '갈치가 예뻤다는 말, 그거면 충분해요.', lineEn: 'Saying the hairtail was beautiful — that is enough.' }),
        note: ['묻지 않겠다고, 갈치가 예뻤다고만 했다. 오가윤 씨는 묻지 않아 주는 사람이 제일 고맙다고 했다.',
          'I said I would not ask — only that the hairtail was beautiful. Oh Gayun said the people who do not ask are the ones she is most grateful for.'],
      }),
      ask: scene([
        act(Y, 'silence'),
        line(Y, '…다툰 날이었어요. 그 사람이랑.', '...It was a day we fought. That person and me.'),
        line(P, '…', '...'),
        line(Y, '그 얘긴 다음에요. 지금 말하면 또 울 것 같아서요.', 'Another time. If I talk about it now, I think I will cry again.'),
      ], {
        end: endTalk({ complete: 'ask', lineKo: '오늘은 갈치만 봐요. 은빛 나는 거, 그거만요.', lineEn: "Tonight, let's just look at the hairtail. The silver. Only that." }),
        note: ['결국 무슨 일이 있었느냐고 물었다. 오가윤 씨는 그 사람과 다툰 날이었다고만 하고 나머지는 다음에 하자고 했지만, 그래도 말을 시작했다.',
          'In the end I asked what had happened. Oh Gayun said only that it was a day she fought with that person and the rest could wait — but she had begun to talk.'],
      }),
      again: scene([
        line(Y, '…갈치가 핑계라니. 갈치가 들으면 서운하겠어요.', '...Hairtail as an excuse. The hairtail would be hurt to hear that.'),
        line(Y, '그래도 그 말은 받아 둘게요.', 'Still, I will hold on to those words.'),
        line(P, '언제든요.', 'Any time.'),
      ], {
        end: endTalk({ complete: 'call_again', lineKo: '다음에 불 켤 일 있으면 연락할게요. 그땐 안 울게요. 노력해 볼게요.', lineEn: "Next time there's a reason to light the lamps, I'll call you. I won't cry then. I'll try." }),
        note: ['울고 싶은 날엔 또 부르라고, 갈치는 핑계면 된다고 했다. 오가윤 씨는 손등으로 눈가를 한 번 닦고, 그 말은 받아 두겠다고 했다.',
          'I told her to call me on days she feels like crying — the hairtail can be the excuse. Oh Gayun wiped her eye once with the back of her hand and said she would hold on to that.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-06 「첫 손님」 — 동명항 어촌계
  // ═══════════════════════════════════════════
  {
    id: 'm4_06_offer', questId: 'M4-06', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '낚시어선업 신고 끝났지.', "Your angling-boat registration's through."),
        line(P, '네. 서류는 다 냈어요.', 'Yes. All the paperwork is in.'),
        line(C, '첫 손님이다. 중년 둘.', 'Here are your first passengers. Two middle-aged men.'),
        line(P, '…벌써요?', '...Already?'),
        line(C, '명부, 교육, 멀미약. 그 셋은 출항 전에 끝내.', 'Register, safety briefing, seasick pills. Finish those three before you sail.'),
        line(C, '손님 앞에서 두 마리는 올려라. 배 위에서 회 한 접시 떠 드리고.', 'Land two in front of them. And slice them a plate of sashimi on deck.'),
        line(P, '회까지요?', 'Sashimi too?'),
        line(C, '갓 잡은 걸 배 위에서 먹는 맛에 타는 손님도 있다.', 'Some passengers ride just for the taste of fresh fish eaten on deck.'),
        line(C, '손님이 드러누워도 배는 돌아와야 한다.', 'Even if a passenger keels over, the boat has to come back.'),
      ], {
        choices: [
          opt('welcome', '첫 손님, 제 배에 모실게요', "I'll welcome my first passengers aboard", {
            say: ['첫 손님, 제 배에 모실게요. 명부부터 챙기겠습니다.', "I'll welcome my first passengers aboard. I'll see to the register first."], next: 'welcome' }),
          opt('briefing', '안전교육은 뭘 알려 드려야 해요?', 'What do I cover in the safety briefing?', { next: 'briefing' }),
          opt('discount', '첫 손님이면 값을 좀 깎아 드려야 할까요?', 'Should I give first passengers a discount?', { next: 'discount' }),
        ],
        note: ['낚시어선업 신고를 마치자 어촌계에서 첫 손님을 붙여 줬다. 명부와 안전교육, 멀미약을 챙기고, 손님 앞에서 두 마리를 올려 배 위에서 회 한 접시를 떠 드리라고 했다.',
          'With my angling-boat registration done, the co-op found me my first passengers. See to the register, the safety briefing and seasick pills, land two in front of them, and slice them a plate of sashimi on deck.'],
      }),
      welcome: scene([
        line(C, '모신다는 말 좋다.', 'Welcoming them aboard — I like that.'),
        line(C, '손님은 돈 내는 사람이기 전에 목숨 맡기는 사람이다.', 'Before they are people who pay you, passengers are people who trust you with their lives.'),
        line(P, '명심할게요.', 'I will remember that.'),
        line(C, '출항 전에 조끼 입었는지 네 눈으로 봐. 입었다는 말은 믿지 말고. 그다음이 고기다.', "Before you sail, see with your own eyes that they're wearing vests. Don't take their word for it. Fish come after."),
      ], {
        end: endTalk({ accept: true, offer: 'welcome' }),
        note: ['첫 손님을 모시겠다고 했다. 손님은 돈 내기 전에 목숨을 맡기는 사람이라고, 조끼는 입었다는 말 말고 내 눈으로 확인하라고 했다.',
          'I said I would welcome my first passengers aboard. Before they pay, passengers entrust you with their lives, I was told — check their vests with my own eyes, not their word.'],
      }),
      briefing: scene([
        line(C, '조끼 입는 법, 구명부환 있는 데, 빠지면 어떻게 하는지. 그리고 배에서 뛰지 말 것.', 'How to wear the vest, where the life ring is, what to do if they fall in. And no running on board.'),
        line(P, '그걸 다 길게 설명해야 하나요?', 'Do I have to explain all that at length?'),
        line(C, '짧게 해. 길면 안 듣는다. 대신 눈 보고 해.', "Keep it short. Long, and they won't listen. But look them in the eye."),
        line(C, '안 듣는 손님은 눈이 딴 데 가 있다. 그 손님을 한 번 더 봐.', "A passenger who isn't listening has their eyes elsewhere. Look at that one twice."),
      ], {
        choices: [
          opt('ok', '짧게, 눈 보고 할게요', "Short, and looking them in the eye", {
            end: endTalk({ accept: true, offer: 'ask_briefing' }),
            note: ['안전교육은 짧게, 눈을 보고 하기로 했다. 안 듣는 손님은 한 번 더 보라고 했다.', 'The briefing would be short and eye to eye — and any passenger not listening gets a second look.'] }),
          opt('seasick', '손님이 드러누우면 돌아가야 해요?', 'If a passenger keels over, do I turn back?', {
            say: ['그런데 손님이 드러누우면, 돌아가야 해요?', 'But if a passenger keels over, do I have to turn back?'], next: 'seasick' }),
        ],
        note: ['안전교육은 뭘 알려 드려야 하느냐고 물었다. 조끼 입는 법, 구명부환 있는 데, 빠지면 어떻게 하는지, 배에서 뛰지 말 것 — 짧게, 눈을 보고 하라고 했다.',
          'I asked what the briefing should cover. How to wear the vest, where the life ring is, what to do if they fall in, no running on board — short, and looking them in the eye.'],
      }),
      seasick: scene([
        line(C, '한 사람 때문에 다 돌리면 나머지 손님 하루가 날아간다.', 'Turn back for one person and the rest of them lose their day.'),
        line(C, '그렇다고 버려 두면 그 사람 하루가 날아가.', 'Leave that one be and they lose theirs.'),
        line(P, '…그럼 어떻게 해요?', '...So what do I do?'),
        line(C, '멀미약 먹이고 바람 통하는 데 앉혀. 먼 데를 보게 해.', 'Give them a pill and sit them where the wind blows through. Have them look far off.'),
        line(C, '그래도 안 되면 그땐 돌아가. 판단은 선장이 하는 거다. 나가 봐.', "If that doesn't work, then turn back. That call is the captain's. Go on out."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_seasick' }),
        note: ['손님이 드러누우면 돌아가야 하느냐고 물었다. 멀미약을 먹이고 바람 통하는 데 앉혀 먼 데를 보게 하고, 그래도 안 되면 그때 돌아가라고 — 판단은 선장이 한다고 했다.',
          'I asked whether to turn back if a passenger keeled over. Pills, a seat in the breeze, eyes on the horizon — and only if that fails, turn back. The call is the captain\'s, I was told.'],
      }),
      discount: scene([
        line(C, '깎지 마.', "Don't.", { act: 'shake_head' }),
        line(C, '첫 손님 값을 깎으면 네 배 값이 깎인 거다. 다음 손님도 그 값을 안다.', "Cut your first passengers' fare and you've cut your boat's worth. The next ones will know that price too."),
        line(P, '그럼 뭘로 대신하죠?', 'Then what do I do instead?'),
        line(C, '고기를 아끼지 마. 손님이 한 마리라도 더 올리게 자리를 봐 줘. 그게 깎아 주는 거다. 나가.', "Don't be stingy with the fish. Find them a spot so they land one more. That's your discount. Go."),
      ], {
        end: endTalk({ accept: true, offer: 'discount' }),
        note: ['첫 손님이면 값을 깎아 드려야 하느냐고 물었다. 깎지 말라고, 대신 손님이 한 마리라도 더 올리게 자리를 봐 주는 게 깎아 주는 거라고 했다.',
          'I asked if I should give my first passengers a discount. No, I was told — finding them a spot to land one more fish is the discount.'],
      }),
    },
  },
  {
    id: 'm4_06_done', questId: 'M4-06', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '돌아왔군.', "You're back."),
        line(P, '한 분이 출항 삼십 분 만에 드러누우셨어요.', 'One of them went down thirty minutes out.'),
        line(C, '그래서.', 'And?'),
        line(P, '그래도 조황은 좋았어요. 그분이 다음 주에 또 오겠다고 하셨고요.', 'The fishing was good, though. And he said he would come again next week.'),
        line(C, '손님이 또 온대? 그게 영업이다.', "He's coming back? That's business.", { act: 'nod' }),
        line(C, '이 릴은 선장용이야. 손님 것보다 먼저 감겨야 하니까.', "This reel is a captain's. It has to wind in before the passengers' do."),
      ], {
        choices: [
          opt('seasick', '누운 손님을 뱃머리에 앉혔더니 살아났어요', 'I sat the sick one in the bow and he came round', { next: 'seasick' }),
          opt('money', '처음으로 돈을 받고 태웠어요', 'It was my first time taking money for passengers', {
            say: ['처음으로 돈을 받고 태웠어요. 이상한 기분이에요.', 'It was my first time taking money to carry people. It feels strange.'], next: 'money' }),
          opt('remember', '다음 주에 오신다는 분, 이름을 외워 둘게요', "I'll remember the name of the one coming next week", { next: 'remember' }),
        ],
        note: ['첫 손님을 태우고 돌아왔다. 어촌계 사람은 누웠던 손님이 또 오겠다는 말에 그게 영업이라며 선장용 릴을 내줬다.',
          "I came back from my first passenger trip. When he heard the sick passenger wanted to come again, the co-op man said that is business — and gave me a captain's reel."],
      }),
      seasick: scene([
        line(C, '그게 선장이다. 조황보다 사람.', "That's a captain. People before the catch."),
        line(C, '누웠던 손님이 또 온다며. 고기 때문이 아니야.', "The one who lay down is coming back, you say. It isn't for the fish."),
        line(P, '…그럼요?', '...Then why?'),
      ], {
        end: endTalk({ complete: 'seasick_guest', lineKo: '누웠을 때 챙겨 준 사람이 있어서지. 그게 영업이다.', lineEn: 'Because someone looked after him when he was down. That is business.' }),
        note: ['누운 손님을 뱃머리에 앉혔더니 살아났다고 했다. 어촌계 사람은 명부에 도장을 찍으며, 손님이 또 오는 건 누웠을 때 챙겨 준 사람이 있어서라고 했다.',
          'I said the sick passenger came round once I sat him in the bow. Stamping the register, the co-op man said he is coming back because someone looked after him when he was down.'],
      }),
      money: scene([
        line(C, '이상해야 한다. 익숙해지면 손님이 짐이 돼.', 'It should feel strange. Get used to it, and passengers turn into cargo.'),
        line(C, '…이상해야 한다.', '...It should feel strange.'),
        line(P, '무게가 느껴져요.', 'I can feel the weight of it.'),
        line(C, '돈 받은 날부터 손님 목숨도 같이 받은 거다. 그 무게가 이상한 거야.', 'From the day you take their money, you take their lives as well. That weight is the strangeness.'),
      ], {
        end: endTalk({ complete: 'money', lineKo: '그 기분이 사라지는 날엔 배를 하루 쉬어라.', lineEn: 'The day that feeling is gone, rest the boat for a day.' }),
        note: ['처음으로 돈을 받고 태웠더니 이상한 기분이라고 했다. 어촌계 사람은 그 말을 두 번 하며, 돈 받은 날부터 손님 목숨도 같이 받은 거라고 했다.',
          'I said taking money for passengers felt strange. The co-op man said it twice — it should — and that from that day, you take their lives along with their money.'],
      }),
      remember: scene([
        line(C, '그래. 이름 불러 주는 배에 손님이 다시 온다.', 'Right. Passengers come back to a boat that calls them by name.'),
        line(C, '두 번째 오는 손님이 진짜 손님이다.', 'The ones who come a second time are the real customers.'),
        line(P, '명부에 적힌 이름부터 외울게요.', "I'll start with the names in the register."),
      ], {
        end: endTalk({ complete: 'remember_guest', lineKo: '명부는 버리지 말고 모아 둬. 그게 네 배 장부다. 돈 장부보다 그게 먼저야.', lineEn: "Don't throw the registers away; keep them. Those are your boat's books. They come before the money books." }),
        note: ['다음 주에 온다는 손님의 이름을 외워 두겠다고 했다. 이름 불러 주는 배에 손님이 다시 온다며, 명부는 버리지 말고 모아 두라고 했다.',
          'I said I would remember the name of the passenger coming next week. Passengers return to boats that call them by name, I was told — keep every register.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-07 「서해로」 — 송기백
  // ═══════════════════════════════════════════
  {
    id: 'm4_07_offer', questId: 'M4-07', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '자네, 서해는 처음이지.', 'This your first time on the West Sea?'),
        line(P, '네. 태안은 처음 와 봐요. 어떻게 아셨어요?', 'Yes. My first time in Taean. How could you tell?'),
        line(S, '갯벌을 바다처럼 보고 서 있으니까.', "You're standing there looking at the mudflat as if it were the sea."),
        act(S, 'laugh'),
        line(P, '…바다 아닌가요?', "...Isn't it the sea?"),
        line(S, '물이 빠지면 땅이고, 들면 바다야. 하루에 두 번씩 바뀌지.', "When the water's out it's land, and when it's in it's sea. It changes twice a day."),
        line(S, '갯벌은 걷는 게 아니라 빠지는 거야.', "You don't walk on a mudflat. You sink into it."),
        line(P, '그럼 저는 뭘 하면 될까요?', 'Then what should I do?'),
        line(S, '물때 보고 들어가서, 세 개만 캐고 나와.', 'Check the tide, go in, dig up three, and come out.'),
        line(S, '딱 세 개.', 'Just three.'),
      ], {
        choices: [
          opt('three', '물때 맞춰 들어가서, 세 개만 캐고 나올게요', "I'll go in with the tide, dig three, and come out", { next: 'three' }),
          opt('sink', '빠지는 거라니요? 걷는 법이 따로 있어요?', 'Sink into it? Is there a special way to walk?', { next: 'sink' }),
          opt('tide', '동해랑 그렇게 달라요?', 'Is it that different from the East Sea?', {
            say: ['동해랑 그렇게 달라요? 물이 얼마나 빠지는데요?', 'Is it really that different from the East Sea? How far does the water go out?'], next: 'tide' }),
        ],
        note: ['태안에서 폐어선에 사는 송기백 씨를 만났다. 갯벌은 걷는 게 아니라 빠지는 거라며, 물때를 보고 들어가 세 개만 캐고 나오라고 했다.',
          'In Taean I met Song Gibaek, who lives in a derelict boat. You do not walk on a mudflat, you sink into it, he said — check the tide, go in, dig up three and come out.'],
      }),
      three: scene([
        line(S, '세 개만이라는 말, 지켜.', "Hold to that 'only three.'"),
        line(S, '갯벌에선 네 번째 욕심이 사람을 잡아.', 'Out on the flats, wanting a fourth is what gets people.'),
        line(P, '…네 번째요.', '...A fourth.'),
        line(S, '물 빠지는 것만 보고 들어가지 말고, 물 들어오는 때부터 알아 둬.', "Don't go in just watching the water go out. Learn first when it comes back in."),
        line(S, '나올 때를 먼저 정하고 들어가는 거야. 가.', 'You decide when to come out before you go in. Go on.'),
      ], {
        end: endTalk({ accept: true, offer: 'three_only' }),
        note: ['세 개만 캐고 나오겠다고 했다. 송기백 씨는 갯벌에선 네 번째 욕심이 사람을 잡는다며, 나올 때를 먼저 정하고 들어가라고 했다.',
          'I said I would dig three and come out. Out on the flats, wanting a fourth is what gets people, Song Gibaek said — decide when to come out before going in.'],
      }),
      sink: scene([
        line(S, '있지. 발을 세우지 말고 눕혀.', "There is. Don't stand your feet up — lay them flat."),
        line(S, '뒤꿈치부터 꽂으면 박혀서 안 빠져. 발바닥을 넓게 디뎌.', 'Plant your heel first and it sticks fast. Step down with the whole sole.'),
        line(P, '그래도 빠지면요?', 'And if I still sink?'),
        line(S, '발을 들지 말고 비틀어 빼. 들면 진흙이 신발부터 가져가.', "Don't lift — twist it out. Lift, and the mud takes your shoe first."),
      ], {
        choices: [
          opt('ok', '비틀어 빼는 거, 기억할게요', "Twist it out — I'll remember", {
            end: endTalk({ accept: true, offer: 'ask_sink' }),
            note: ['발은 눕혀 넓게 딛고, 빠지면 들지 말고 비틀어 빼기로 했다.', 'Feet flat and wide, and if I sink, twist rather than lift.'] }),
          opt('rescue', '깊이 빠지면 누가 꺼내 주세요?', 'If I sink deep, who pulls me out?', {
            say: ['그래도 깊이 빠지면 누가 꺼내 주세요? 송기백 씨가 오세요?', 'But if I sink deep, who pulls me out? Will you come, Gibaek?'], next: 'rescue' }),
        ],
        note: ['걷는 법이 따로 있느냐고 물었다. 발을 세우지 말고 눕혀 넓게 디디고, 빠지면 들지 말고 비틀어 빼라고 — 들면 진흙이 신발부터 가져간다고 했다.',
          'I asked if there was a way to walk. Lay the feet flat and step wide, Song Gibaek said, and if you sink, twist instead of lifting — lift, and the mud takes your shoe first.'],
      }),
      rescue: scene([
        line(S, '여든 넘은 늙은이가 자네를 꺼내?', 'An old man past eighty pulling you out?'),
        act(S, 'laugh'),
        line(S, '빠지면 자네가 나와야지.', 'If you sink, you get yourself out.'),
        line(S, '그래서 혼자 깊이 들어가지 말라는 거야. 내가 보이는 데까지만. 그 안에서 세 개.', "That's why you don't go in deep alone. Only as far as I can see you. Three, within that."),
      ], {
        end: endTalk({ accept: true, offer: 'rescue_joke' }),
        note: ['깊이 빠지면 송기백 씨가 꺼내 주느냐고 물었다가 껄껄 웃음을 샀다. 그러니 자기가 보이는 데까지만 들어가 그 안에서 세 개를 캐라고 했다.',
          'I asked if he would pull me out if I sank deep, and he roared with laughter. So go only as far as he can see me, Song Gibaek said, and dig three within that.'],
      }),
      tide: scene([
        line(S, '동해는 물이 한 뼘 오르내리지. 여긴 사람 키를 몇 번 넘게 오르내려.', "In the East Sea the water rises and falls a hand's width. Here it goes up and down several times a person's height."),
        line(P, '…그렇게나요?', '...That much?'),
        line(S, '하루 두 번, 수백 걸음씩 물이 왔다 갔다 해.', 'Twice a day, the water comes and goes hundreds of paces.'),
        line(S, '동해 버릇으로 들어오면 물이 등 뒤에서 와. 소리도 없이.', 'Come in with East Sea habits and the water comes up behind you. Without a sound.', { act: 'look_sea' }),
        line(S, '그래서 서해 사람은 바다를 등지고 안 서. 물때 보고 들어가.', 'That is why West Sea folk never stand with their backs to the sea. Check the tide before you go in.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_tide' }),
        note: ['동해와 그렇게 다르냐고 물었다. 동해는 물이 한 뼘 오르내리지만 서해는 사람 키를 몇 번 넘게 오르내린다고, 동해 버릇으로 들어오면 물이 소리도 없이 등 뒤에서 온다고 했다.',
          "I asked how different it was from the East Sea. There the water moves a hand's width, Song Gibaek said, but here several times a person's height — come in with East Sea habits and it creeps up behind you without a sound."],
      }),
    },
  },
  {
    id: 'm4_07_done', questId: 'M4-07', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '신발 잃었지.', "Lost a shoe, didn't you.", { act: 'peer' }),
        line(P, '…티 나요?', '...Is it that obvious?'),
        line(S, '다들 그래.', 'Everyone does.'),
        act(S, 'laugh'),
        line(S, '세 개 캤으면 됐어. 서해는 이제 시작이야.', 'If you dug up three, that is enough. The West Sea is only just beginning for you.'),
      ], {
        choices: [
          opt('shoe', '신발 한 짝을 갯벌에 두고 왔어요', 'I left one shoe behind in the mud', { next: 'shoe' }),
          opt('tide', '물이 돌아오는 속도가 무서웠어요', 'How fast the water came back scared me', { next: 'tide' }),
          opt('home', '폐어선에서 지내시는 건 불편하지 않으세요?', "Isn't it uncomfortable living in a derelict boat?", { next: 'home' }),
        ],
        note: ['갯벌에서 세 개체를 캐고 나오다 신발 한 짝을 잃었다. 송기백 씨는 다들 그렇다며 웃고, 서해는 이제 시작이라고 했다.',
          'Coming off the flats with three creatures, I lost a shoe. Everyone does, Song Gibaek laughed — the West Sea was only just beginning.'],
      }),
      shoe: scene([
        line(S, '갯벌이 받은 거야. 통행세.', 'The mudflat took it. A toll.'),
        line(P, '비싼 통행세네요.', 'A pricey toll.'),
        line(S, '신발 잃고 우는 사람도 있고 웃는 사람도 있어. 웃는 사람이 다시 와.', 'Some cry when they lose a shoe, and some laugh. The ones who laugh come back.'),
      ], {
        end: endTalk({ complete: 'shoe', lineKo: '다음엔 장화 끈을 발목에 한 번 감고 들어가.', lineEn: 'Next time, wrap your boot strap once around your ankle before you go in.' }),
        note: ['신발 한 짝을 갯벌에 두고 왔다고 했다. 송기백 씨는 갯벌이 받은 통행세라며, 다음엔 장화 끈을 발목에 한 번 감고 들어가라고 했다.',
          'I said I had left a shoe in the mud. A toll the mudflat took, Song Gibaek said — next time, wrap the boot strap once around my ankle.'],
      }),
      tide: scene([
        line(S, '무서워야 살아. 서해는 물이 사람보다 빨라.', 'Being afraid keeps you alive. On the West Sea, the water is faster than people.'),
        line(P, '보였을 땐 이미 발목까지 와 있었어요.', 'By the time I saw it, it was already at my ankles.'),
        line(S, '그래. 물은 보이기 전에 이미 와 있거든.', 'Right. The water is already there before you see it.', { act: 'nod' }),
      ], {
        end: endTalk({ complete: 'tide', lineKo: '무서운 걸 알았으면 이제 물때표를 믿어. 눈으로 보고 판단하면 늦어.', lineEn: 'Now that you know the fear, trust the tide table. Judge by your eyes and you are too late.' }),
        note: ['물이 돌아오는 속도가 무서웠다고 했다. 송기백 씨는 물때표 한 장을 손으로 그려 주며, 눈으로 보고 판단하면 늦으니 이제 물때표를 믿으라고 했다.',
          'I said the speed of the returning water scared me. Song Gibaek drew me a tide table by hand — judge by eye and you are too late, so trust the table now.'],
      }),
      home: scene([
        line(S, '안 뜨는 배라도 배는 배야.', "A boat that doesn't float is still a boat."),
        line(S, '물이 들어오면 밑에서 소리가 나. 그 소리 들으면서 자는 게 편해.', 'When the tide comes in, it makes a sound underneath. Sleeping to that sound is comfortable.'),
        line(P, '그런데 왜 여기서…', 'But why here...'),
        line(S, '왜 여기 사냐고는 묻지 마.', "Don't ask why I live here.", { act: 'look_away' }),
      ], {
        end: endTalk({ complete: 'ask_home', lineKo: '늙은이 사연은 길어. 그건 다음에 하지.', lineEn: "An old man's story is a long one. That's for another time." }),
        note: ['폐어선에서 지내는 게 불편하지 않으냐고 물었다. 송기백 씨는 물이 들면 밑에서 나는 소리를 들으며 자는 게 편하다며, 왜 여기 사는지는 다음에 하자고 했다.',
          'I asked whether living in a derelict boat was uncomfortable. Song Gibaek said sleeping to the sound of the tide underneath is comfortable — why he lives there would wait for another time.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-08 「만리포 서프」 — 탁새벽
  // ═══════════════════════════════════════════
  {
    id: 'm4_08_offer', questId: 'M4-08', at: 'offer', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '왔다! 여기, 여기!', 'You came! Over here, over here!'),
        line(P, '…태안까지 어떻게 왔어요?', '...How did you get all the way to Taean?'),
        line(K, '그건 비밀. 그보다 이거 봐.', "That's a secret. More importantly — look at this."),
        line(K, '서프용 대야. 내가 깎았어.', 'A surf rod. I carved it.'),
        line(P, '서프요?', 'Surf?'),
        line(K, '파도 치는 해변에서 루어를 멀리 던지는 거. 서프는 포말대에 던져.', 'Casting a lure far out from a beach with waves. In surf fishing, you throw into the foam line.'),
        line(K, '밤에. 농어가 파도 안에 있거든.', 'At night. The sea bass are in the waves.'),
        line(K, '내가 만든 대로 던져 봐.', 'Cast with the rod I made.'),
      ], {
        choices: [
          opt('trust', '직접 만든 대라면 믿고 던져 볼게요', "If you made it, I'll trust it and cast", { next: 'trust' }),
          opt('foam', '포말대가 뭐예요? 파도 거품 있는 데요?', 'What is the foam line? Where the waves froth?', { next: 'foam' }),
          opt('pride', '열두 살한테 배우려니 자존심이 좀…', 'Learning from a twelve-year-old stings a bit...', {
            say: ['열두 살한테 배우려니, 자존심이 좀 상하는데요.', 'Learning from a twelve-year-old — my pride stings a little.'], next: 'pride' }),
        ],
        note: ['만리포에 가니 탁새벽 씨가 먼저 와 있었다. 직접 깎은 서프용 대를 보여 주며, 밤에 파도가 부서지는 포말대에 던지면 농어가 있다고 했다.',
          'At Mallipo, Tak Saebyeok was already waiting. He showed me a surf rod he had carved himself and said the sea bass are in the foam line where the waves break at night.'],
      }),
      trust: scene([
        line(K, '당연하지. 할아버지 거 아니고 내 거야.', "Of course. Not Grandpa's — mine."),
        line('', '(대를 내밀다가 다시 당긴다.)', '(He holds out the rod, then pulls it back.)'),
        line(K, '근데 허리로 던져. 팔로 던지면 대가 아파해.', 'But throw from your hips. Throw with your arms and the rod gets hurt.'),
        line(P, '대가 아파한다고요?', 'The rod gets hurt?'),
        line(K, '대 아픈 거 나 다 알아. 자, 이제 던져 봐.', 'I can always tell when a rod is hurting. Here — now cast.'),
      ], {
        end: endTalk({ accept: true, offer: 'trust_rod' }),
        note: ['직접 만든 대라면 믿겠다고 했다. 탁새벽 씨는 할아버지 것 아니고 자기 거라며 대를 내밀다 다시 당기더니, 허리로 던지라고 — 팔로 던지면 대가 아파한다고 했다.',
          "I said I would trust a rod he made. Not Grandpa's, his own, Tak Saebyeok said — he held it out, pulled it back, and told me to throw from the hips, because arms hurt the rod."],
      }),
      foam: scene([
        line(K, '응. 파도가 부서져서 하얗게 되는 데.', 'Yeah. Where the waves break and turn white.'),
        line(K, '거기서 작은 고기들이 정신을 못 차려. 농어는 그걸 노려.', 'Little fish get all confused there. Sea bass go after them.'),
        line(P, '그럼 그 하얀 데에 던지면 되는 거죠?', 'So I just throw into the white part?'),
        line(K, '너무 멀리 던지면 지나가고, 너무 가까우면 발밑이야. 부서지는 그 줄에 넣어.', "Too far and you overshoot; too close and it's at your feet. Put it right on the line where they break."),
        line(K, '밤엔 안 보이니까 소리로 찾아.', "You can't see at night, so find it by the sound."),
      ], {
        choices: [
          opt('ok', '소리로 찾아볼게요', "I'll find it by the sound", {
            end: endTalk({ accept: true, offer: 'ask_foam' }),
            note: ['밤에는 파도가 부서지는 줄을 소리로 찾아 넣기로 했다.', 'At night, I would find the line of breaking waves by sound and cast into it.'] }),
          opt('night', '근데 왜 꼭 밤이에요?', 'But why does it have to be night?', {
            say: ['근데 왜 꼭 밤이에요? 낮엔 농어가 없어요?', "But why does it have to be night? Aren't there sea bass in the day?"], next: 'night' }),
        ],
        note: ['포말대가 뭐냐고 물었다. 파도가 부서져 하얗게 되는 데라고, 작은 고기들이 정신을 못 차리는 그 줄에 넣으라고 — 밤엔 안 보이니 소리로 찾으라고 했다.',
          'I asked what the foam line was. Where waves break white and little fish lose their bearings, Tak Saebyeok said — put it right on that line, and at night, find it by sound.'],
      }),
      night: scene([
        line(K, '낮에도 있어. 근데 낮엔 겁이 많아.', "They're there in the day too. But they're jumpy in daylight."),
        line(K, '밤엔 파도 가까이 붙어서 대담해져.', 'At night they come in close to the waves and get bold.'),
        line(P, '그렇구나…', 'I see...'),
        line(K, '그리고 밤엔 사람이 없잖아. 시끄러운 사람들 없을 때가 좋아.', 'And there is nobody around at night. It is better without noisy people.'),
        line(K, '{player} 씨는 조용하니까 괜찮아. 가자.', "You're quiet, {player}, so you're fine. Let's go."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_night' }),
        note: ['왜 꼭 밤이냐고 물었다. 낮엔 겁이 많던 농어가 밤엔 파도 가까이 붙어 대담해진다고, 시끄러운 사람이 없는 밤이 좋은데 나는 조용해서 괜찮다고 했다.',
          'I asked why it had to be night. Sea bass that are jumpy by day come in close and bold at night, he said — and night is better without noisy people, though I was quiet enough.'],
      }),
      pride: scene([
        line(K, '나 이제 열두 살 아니거든?', "I'm not twelve anymore, you know?"),
        line('', '(발끝으로 모래를 찬다.)', '(He kicks at the sand with his toes.)'),
        line(P, '…그럼 몇 살인데요?', '...Then how old are you?'),
        line(K, '그건 안 중요해. 대는 나이로 만드는 거 아니야. 마디 보는 눈이 있으면 돼. 나 그거 있어.', "That isn't important. Rods aren't made with age. You just need an eye for the joints. I have that."),
        line(K, '자존심은 농어 잡고 나서 세워.', 'Put your pride back up after you catch a sea bass.'),
      ], {
        end: endTalk({ accept: true, offer: 'pride_joke' }),
        note: ['열두 살한테 배우려니 자존심이 상한다고 했더니, 이제 열두 살 아니라며 모래를 찼다. 대는 나이로 만드는 게 아니라 마디 보는 눈으로 만든다고 했다.',
          'When I said learning from a twelve-year-old stung my pride, he kicked the sand — he was not twelve anymore. Rods are made with an eye for the joints, he said, not with age.'],
      }),
    },
  },
  {
    id: 'm4_08_done', questId: 'M4-08', at: 'complete', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '잡았어!', 'You got one!'),
        line(P, '파도 속에서 올라왔어요. 농어가.', 'It came up out of the waves. A sea bass.'),
        line(K, '그 대, 서프용으로 깎은 거야.', 'That rod — I carved it for surf.'),
        line(K, '이제 {player} 씨 거야.', "It's yours now, {player}."),
        line(P, '…제 거요?', '...Mine?'),
        line(K, '응. 멀리 던지는 것도 이제 제대로 익힐 수 있을 거야.', 'Yeah. Now you can properly learn long casting, too.'),
      ], {
        choices: [
          opt('praise', '직접 만든 대가 파도를 이겼네요', 'The rod you made beat the waves', { next: 'praise' }),
          opt('teach', '던지는 것도 더 잘하던데, 가르쳐 줄래요?', 'You throw better too — will you teach me?', {
            say: ['던지는 것도 저보다 잘하던데요. 가르쳐 줄래요?', 'You cast better than me, too. Will you teach me?'], next: 'teach' }),
          opt('grandpa', '이 대, 탁만수 씨께도 보여 드려요', 'Show this rod to Mansu too', {
            say: ['이 대, 탁만수 씨께도 보여 드려요. 자랑해도 돼요.', "Show this rod to Mansu too. You've earned the right to brag."], next: 'grandpa' }),
        ],
        note: ['포말대에서 농어를 올렸다. 탁새벽 씨는 그 대가 서프용으로 깎은 거라며 이제 내 것이라고 했다.',
          'I landed a sea bass from the foam line. Tak Saebyeok said he had carved that rod for surf, and that it was mine now.'],
      }),
      praise: scene([
        act(K, 'silence'),
        line(K, '…내가 만든 거 맞지? 할아버지가 아니라?', "...I made it, right? Not Grandpa?"),
        line(P, '맞아요. 직접 만든 거요.', 'That is right. You made it yourself.'),
        line(K, '파도 이긴 대면 진짜 대 맞지?', 'If it beat the waves, that makes it a real rod, right?'),
      ], {
        end: endTalk({ complete: 'praise', lineKo: '그럼 이제 내 이름 새겨도 되겠다. 손잡이 밑에, 아주 작게. {player} 씨만 알게.', lineEn: 'Then I can carve my name on it now. Under the grip, really small. So only you know, {player}.' }),
        note: ['직접 만든 대가 파도를 이겼다고 했다. 탁새벽 씨는 대를 한 번 더 쓰다듬더니, 손잡이 밑에 아주 작게 자기 이름을 새기겠다고 했다.',
          'I told him the rod he made beat the waves. Tak Saebyeok stroked it once more and said he would carve his name under the grip, very small.'],
      }),
      teach: scene([
        line(K, '나는 만드는 사람인데…', "I'm a maker, though..."),
        line(K, '그래도 한 번만.', 'Still — just once.'),
        line(K, '허리부터 돌려. 팔은 마지막에 따라오는 거야. 대가 휘었다가 펴질 때 놔.', 'Turn your hips first. Your arms just follow at the end. Let go when the rod bends and springs back.'),
        line(P, '휘었다가 펴질 때…', 'When it bends and springs back...'),
      ], {
        end: endTalk({ complete: 'teach_me', lineKo: '할아버지한테는 비밀. 만드는 사람이 던지는 걸 가르쳤다고 웃을 거야.', lineEn: "Keep it secret from Grandpa. He'd laugh that a maker taught casting." }),
        note: ['던지는 것도 가르쳐 달라고 했다. 탁새벽 씨가 한 번만이라며 허리부터 돌리고 대가 휘었다 펴질 때 놓으라고 하자, 내 서프 캐스팅 자세가 달라졌다.',
          'I asked him to teach me to cast. Just once, Tak Saebyeok said — turn the hips first, release as the rod springs back — and my surf casting changed.'],
      }),
      grandpa: scene([
        line(K, '…할아버지는 자랑하면 싫어해. 대는 말로 하는 거 아니래.', "...Grandpa hates bragging. He says rods aren't for talking about."),
        line(P, '그래도요.', 'Still.'),
        line(K, '그래도 오늘 잡은 농어 얘기는 할 거야.', "Still, I'll tell him about the sea bass you caught today."),
        line(K, '그건 자랑이 아니라 증거니까.', "That isn't bragging. It's evidence."),
      ], {
        end: endTalk({ complete: 'show_grandpa', lineKo: '증거는 괜찮잖아. 그치?', lineEn: "Evidence is all right, isn't it? Right?" }),
        note: ['탁만수 씨께도 대를 보여 드리라고 했다. 탁새벽 씨는 할아버지가 자랑을 싫어한다면서도, 오늘 잡은 농어 얘기는 증거니까 하겠다고 했다.',
          'I told him to show the rod to Tak Mansu too. His grandfather hates bragging, Tak Saebyeok said — but the sea bass caught today was evidence, so he would tell him.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-09 「갑오징어」 — 마감기
  // ═══════════════════════════════════════════
  {
    id: 'm4_09_offer', questId: 'M4-09', at: 'offer', npcId: A, start: 'start',
    nodes: {
      start: scene([
        line(A, '왔어요? 다행이다. 갑오징어 배 예약해 뒀어요.', "You're here? Thank goodness. I've booked a cuttlefish boat."),
        line(P, '갑오징어요?', 'Cuttlefish?'),
        line(A, '가을 낮 갑오징어요. 그리고 무엇보다, PD가 못 찾는 데예요.', "Autumn daytime cuttlefish. And best of all, it's somewhere my producer can't find me."),
        line(P, '…PD요?', '...Your producer?'),
        line(A, '에기 두 번 튕기고 기다리면 돼요. 저는 콘티 그릴게요.', "You flick the egi twice and wait, that's all. I'll draw storyboards."),
        line(P, '마감기 씨는 안 낚으시고요?', "You won't be fishing, Gamgi?"),
        line(A, '저는 그리러 가는 거예요. 낚는 건 {player} 씨 몫이고요.', "I'm going to draw. The fishing is your share, {player}."),
      ], {
        choices: [
          opt('split', '좋아요. 그리시고, 저는 낚을게요', "All right. You draw, and I'll fish", {
            say: ['좋아요. 마감기 씨는 그리시고, 저는 낚을게요.', "All right. You draw, Gamgi, and I'll fish."], next: 'split' }),
          opt('pd', 'PD가 쫓아오는 거예요?', 'Is your producer chasing you?', {
            say: ['PD가 쫓아오는 거예요? 무슨 일이 있으신데요?', 'Is your producer after you? What happened?'], next: 'pd' }),
          opt('conti', '콘티가 뭐예요?', 'What is a storyboard?', {
            say: ['콘티가 뭐예요? 배 위에서 그림을 그리세요?', 'What is a storyboard? You draw on a boat?'], next: 'conti' }),
        ],
        note: ['마감기 씨가 가을 낮 갑오징어 배를 예약해 뒀다. PD가 못 찾는 데라며, 에기를 두 번 튕기고 기다리라고 — 자기는 그동안 콘티를 그리겠다고 했다.',
          'Ma Gamgi had booked an autumn daytime cuttlefish boat — somewhere his producer could not find him. Flick the egi twice and wait, he said, while he drew storyboards.'],
      }),
      split: scene([
        line(A, '역할 분담 완벽해요! 오늘 이 배에서 일하는 사람은 우리 둘뿐이에요. 선장님 빼고요.', 'Perfect division of labor! The only two people working on this boat today are us. Not counting the captain.'),
        line(A, '에기는 바닥까지 내려요. 두 번 튕기고 멈춰요.', 'Drop the egi to the bottom. Flick it twice, then stop.'),
        line(P, '세 번 튕기면요?', 'And if I flick three times?'),
        line(A, '도망가요. 갑오징어는 멈췄을 때 안아요. 이건 제가 취재해서 알아요.', 'It runs off. Cuttlefish hug the egi when it stops. I know — I researched it.'),
        line(A, '출항해요!', "Let's set sail!"),
      ], {
        end: endTalk({ accept: true, offer: 'split_work' }),
        note: ['마감기 씨는 그리고 나는 낚기로 했다. 에기는 바닥까지 내려 두 번 튕기고 멈추라고 — 세 번 튕기면 도망가고, 갑오징어는 멈췄을 때 안는다고 했다.',
          'We agreed Ma Gamgi would draw and I would fish. Drop the egi to the bottom, flick twice and stop, he said — three flicks scare it off; cuttlefish hug it when it stops.'],
      }),
      pd: scene([
        line(A, '마감이요. 원고가 좀… 많이 늦었어요.', 'A deadline. My manuscript is a bit... very late.', { act: 'look_away' }),
        line(A, '전화가 열몇 통 와 있어요.', 'There are a dozen-odd missed calls.'),
        line(P, '…안 받으셔도 돼요?', '...Is it all right not to answer?'),
        line(A, '배 위에선 안 받아도 핑계가 되잖아요. 파도 소리 때문에 못 들었다고. 그래서 갑오징어 배예요.', "On a boat, not answering comes with an excuse. Couldn't hear over the waves. Hence the cuttlefish boat."),
        line(A, '낚시도 진심이에요. 진짜로.', 'I am serious about the fishing too. Really.'),
      ], {
        choices: [
          opt('ok', '알겠어요. 일단 타요', 'All right. Let\'s get aboard', {
            end: endTalk({ accept: true, offer: 'ask_pd' }),
            note: ['마감이 많이 늦어 PD를 피해 왔다고 했다. 더 묻지 않고 일단 배에 타기로 했다.', 'He had fled his producer over a very late deadline. I did not ask more, and we got aboard.'] }),
          opt('accomplice', '그럼 저는 공범이 되는 건가요?', 'So that makes me an accomplice?', {
            say: ['도망 오신 거면, 저는 공범이 되는 건가요?', "If you've run away, does that make me your accomplice?"], next: 'accomplice' }),
        ],
        note: ['PD가 쫓아오느냐고 물었다. 원고가 많이 늦어 전화가 열몇 통 와 있다고, 배 위에선 파도 소리 핑계를 댈 수 있어 갑오징어 배라고 했다.',
          'I asked if his producer was chasing him. The manuscript is very late and a dozen calls have piled up, Ma Gamgi said — on a boat he can blame the waves, hence the cuttlefish boat.'],
      }),
      accomplice: scene([
        line(A, '공범… 좋은 단어네요. 메모할게요.', 'Accomplice... good word. Let me note that down.'),
        line('', '(정말로 수첩에 적는다.)', '(He actually writes it in his notebook.)'),
        line(A, '걱정 마요. 갑오징어 잡으면 공범이 아니라 취재 협조자예요.', "Don't worry. Catch a cuttlefish and you're not an accomplice — you're a research collaborator."),
        line(P, '협조자는 괜찮아요?', 'And collaborators are fine?'),
        line(A, '협조자는 처벌 안 받아요. 아마요. 에기 챙겨요.', "Collaborators don't get punished. Probably. Grab your egi."),
      ], {
        end: endTalk({ accept: true, offer: 'accomplice' }),
        note: ['그럼 나는 공범이냐고 했더니, 마감기 씨는 좋은 단어라며 정말로 수첩에 적었다. 갑오징어를 잡으면 공범이 아니라 취재 협조자라고 — 아마.',
          'When I asked if that made me an accomplice, Ma Gamgi called it a good word and actually wrote it down. Catch a cuttlefish and I would be a research collaborator instead. Probably.'],
      }),
      conti: scene([
        line(A, '장면을 순서대로 그린 그림이요. 이 컷 다음에 이 컷.', 'Drawings of the scenes in order. This shot, then this one.'),
        line(A, '찍기 전에 그리는 설계도예요.', 'A blueprint you draw before shooting.'),
        line(P, '흔들리는 배 위에서 그게 되나요?', 'Can you even do that on a rocking boat?'),
        line(A, '책상에선 한 장도 안 나오는데 흔들리는 데선 이상하게 손이 움직여요.', "At my desk I can't get a single page out, but somewhere that rocks, my hand moves for some reason."),
        line(A, '오늘 장면은 바다예요. 바다는 바다에서 그려야죠. 가요.', "Today's scene is the sea. You have to draw the sea at sea. Let's go."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_conti' }),
        note: ['콘티가 뭐냐고 물었다. 장면을 순서대로 그린 설계도라고, 책상에선 한 장도 안 나오는데 흔들리는 데선 손이 움직인다며 바다는 바다에서 그려야 한다고 했다.',
          'I asked what a storyboard was. A blueprint of scenes in order, Ma Gamgi said — nothing comes at his desk, but his hand moves where things rock, and the sea must be drawn at sea.'],
      }),
    },
  },
  {
    id: 'm4_09_done', questId: 'M4-09', at: 'complete', npcId: A, start: 'start',
    nodes: {
      start: scene([
        line(A, '먹물!', 'Ink!'),
        line(P, '갑오징어가 올라오자마자 뿜었어요.', 'It sprayed the moment it came up.'),
        act(A, 'laugh'),
        line(A, '봤어요, 봤어요. 콘티도 끝났어요.', 'I saw, I saw. And the storyboards are done.'),
        line(P, '배 위에서 정말 다 그리셨어요?', 'You really finished them all on the boat?'),
        line(A, '이제 에깅은 감 잡았죠? 직판장에 고급 에기도 들어온대요.', 'You have the knack of egging now, right? I hear the market is getting high-end egi in, too.'),
      ], {
        choices: [
          opt('ink', '먹물을 뒤집어썼어요', "I'm covered in ink", {
            say: ['얼굴까지 먹물을 뒤집어썼어요.', "I'm covered in ink, right up to my face."], next: 'ink' }),
          opt('deadline', '마감은 어떻게 하실 거예요?', 'What will you do about the deadline?', { next: 'deadline' }),
          opt('egi', '에기를 또 잃었어요. 마감기 씨 책임도 있어요', "I lost another egi. You're partly to blame, Gamgi", {
            say: ['에기를 또 잃었어요. 마감기 씨 책임도 있어요.', "I lost another egi. You're partly to blame, Gamgi."], next: 'egi' }),
        ],
        note: ['갑오징어가 올라오자마자 먹물을 뿜었다. 마감기 씨는 배 위에서 콘티를 다 그렸다며, 직판장에 고급 에기도 들어온다고 했다.',
          'The cuttlefish sprayed ink the moment it came up. Ma Gamgi said he had finished all his storyboards on the boat, and that the market was getting high-end egi in.'],
      }),
      ink: scene([
        line(A, '그게 갑오징어예요.', "That's cuttlefish for you."),
        line(A, '콘티에 그렸어요, 그 장면.', 'I drew that scene in the storyboard.'),
        line(P, '…제 얼굴을요?', '...My face?'),
        line(A, '먹물 맞는 순간이 오늘 제일 좋은 컷이에요. 사람이 진짜 놀라는 얼굴은 연기로 안 나오거든요.', "The moment you got inked is the best shot of the day. A truly startled face can't be acted."),
      ], {
        end: endTalk({ complete: 'ink', lineKo: '고마워요. 진심으로요.', lineEn: 'Thank you. I mean it.' }),
        note: ['먹물을 뒤집어썼다고 했다. 마감기 씨는 그 장면을 콘티에 그렸다며, 먹물 맞는 순간이 오늘 제일 좋은 컷이라고 했다.',
          'I said I was covered in ink. Ma Gamgi had drawn that scene into his storyboard — the moment I got inked, he said, was the best shot of the day.'],
      }),
      deadline: scene([
        act(A, 'silence'),
        line(A, '…배에서 다 그렸어요. 바다가 마감을 끝내 줬어요.', '...I drew it all on the boat. The sea finished my deadline for me.'),
        line(P, 'PD한테는요?', 'And your producer?'),
        line(A, '내일 보낼 거예요. 오늘은 바다 냄새 빠질 때까지 들고 있을래요.', 'I will send it tomorrow. Tonight I want to hold on to it until the sea smell fades.'),
      ], {
        end: endTalk({ complete: 'deadline', lineKo: '이렇게 보내기 아까운 원고는 처음이에요.', lineEn: "It's the first manuscript I've ever been sorry to send off." }),
        note: ['마감은 어떻게 하느냐고 물었다. 마감기 씨는 바다가 마감을 끝내 줬다며, 원고 한 장을 찢어 사인해 줬다.',
          'I asked about the deadline. The sea had finished it for him, Ma Gamgi said — and he tore out one page of the manuscript and signed it for me.'],
      }),
      egi: scene([
        line(A, '제 책임 맞아요. 바닥에 걸리는 거 보고도 그림만 그렸어요.', 'It is my fault. I saw it snag on the bottom and just kept drawing.'),
        line('', '(에기 값을 계산하는 척하다 펜을 내려놓는다.)', '(He pretends to work out the price of the egi, then puts down his pen.)'),
        line(P, '…', '...'),
        line(A, '대신 장면은 건졌어요. 에기 잃고 허탈한 얼굴.', 'But I got the scene. The deflated face after losing an egi.'),
      ], {
        end: endTalk({ complete: 'lost_egi', lineKo: '그게 오늘 제일 진짜 같은 컷이에요. 고마워요.', lineEn: "That's the most real-looking shot of the day. Thank you." }),
        note: ['에기를 또 잃었다며 마감기 씨 탓을 했다. 그는 자기 책임이 맞다면서, 에기 잃고 허탈한 내 얼굴이 오늘 제일 진짜 같은 컷이라고 했다.',
          'I lost another egi and blamed Ma Gamgi. He admitted it was his fault — and said my deflated face after losing it was the most real-looking shot of the day.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-11 「속초의 손님」 — 강두철
  // ═══════════════════════════════════════════
  {
    id: 'm4_11_offer', questId: 'M4-11', at: 'offer', npcId: U, start: 'start',
    nodes: {
      start: scene([
        line(U, '허허, 자네. 낚시어선업 신고 마쳤다며.', 'Ha ha, there you are. I hear you finished registering your angling boat.'),
        line(P, '네. 이제 손님을 태울 수 있어요.', 'Yes. I can take passengers now.'),
        line(U, '그럼 배를 속초까지 몰고 오게.', 'Then bring that boat up to Sokcho.'),
        line(P, '속초까지요? 거제에서요?', 'To Sokcho? All the way from Geoje?'),
        line(U, '첫 손님은 나하고 탁 씨야.', 'Your first passengers will be me and Tak.'),
        line(P, '…두 분이요?', '...The two of you?'),
        line(U, '속초 앞바다에 한번 나가 보세. 값은 정가로 받아. 봐주지 말고.', "We'll head out off Sokcho once. Charge the full fare. No favors.", { act: 'nod' }),
      ], {
        choices: [
          opt('full', '정가로 받고, 고기는 넉넉히 올려 드릴게요', "Full fare, and I'll make sure you land plenty", {
            say: ['모실게요. 정가로 받고, 고기는 넉넉히 올려 드릴게요.', "I'll take you out. Full fare, and plenty of fish for you both."], next: 'full' }),
          opt('tak', '탁만수 씨도 배를 타세요?', 'Mansu rides boats too?', {
            say: ['탁만수 씨도 배를 타세요? 공방만 지키시는 줄 알았어요.', 'Mansu rides boats too? I thought he never left the workshop.'], next: 'tak' }),
          opt('long', '혼자 몰고 갈 수 있을까요?', 'Can I really sail it up alone?', {
            say: ['속초까지 하루 반이에요. 혼자 몰고 갈 수 있을까요?', "Sokcho is a day and a half away. Can I really sail it up alone?"], next: 'long' }),
        ],
        note: ['강두철 씨가 낚시어선업 신고를 마쳤으면 배를 속초까지 몰고 오라고 했다. 첫 손님은 자기와 탁만수 씨이고, 값은 봐주지 말고 정가로 받으라고 했다.',
          'Kang Ducheol said that with my angling-boat registration done, I should bring my boat up to Sokcho. My first passengers would be him and Tak Mansu — and I was to charge full fare, no favors.'],
      }),
      full: scene([
        line(U, '허허, 정가에 넉넉히라. 장사 배웠구먼.', "Ha ha, full fare and plenty of fish. You've learned business."),
        line(U, '그 말이면 됐네.', "That's all I needed to hear."),
        line(P, '언제쯤 가면 될까요?', 'When should I come?'),
        line(U, '동해안 따라 천천히 올라오게. 서두르면 기름을 먹고, 기름 먹으면 정가로 받아도 남는 게 없어.', 'Come up along the east coast, slowly. Rush and you burn fuel, and then nothing is left even at full fare.'),
        line(U, '우리는 부두에서 기다리지.', 'We will be waiting on the dock.'),
      ], {
        end: endTalk({ accept: true, offer: 'full_and_fish' }),
        note: ['정가로 받고 고기는 넉넉히 올려 드리겠다고 했다. 강두철 씨는 장사를 배웠다며 웃고, 기름 먹지 않게 동해안을 따라 천천히 올라오라고 했다.',
          'I promised full fare and plenty of fish. Kang Ducheol laughed that I had learned business, and told me to come up the east coast slowly so as not to burn fuel.'],
      }),
      tak: scene([
        line(U, '대 깎는 사람이 자기 대가 바다에서 어떻게 휘는지 안 보고 싶겠나.', 'Would a man who carves rods not want to see how his rod bends at sea?'),
        line(U, '자네 손에서 고기를 건 대라니 더 그렇지.', 'All the more when it is the rod that hooked fish in your hands.'),
        line(P, '…', '...'),
        line(U, '탁 씨는 말 안 하겠지만, 자네 배라서 타는 거야. 그건 알고 모시게.', "Tak won't say it, but he's coming because it's your boat. Know that when you take him aboard."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_tak' }),
        note: ['탁만수 씨도 배를 타느냐고 물었다. 강두철 씨는 대 깎는 사람이 자기 대가 바다에서 휘는 걸 보고 싶지 않겠느냐며, 내 배라서 타는 거라고 알고 모시라고 했다.',
          'I asked whether Tak Mansu rides boats. Would a rod carver not want to see his rod bend at sea, Kang Ducheol said — he is coming because it is my boat, and I should know that.'],
      }),
      long: scene([
        line(U, '동해안은 육지를 옆에 끼고 오는 길이야.', 'The east coast route keeps land beside you the whole way.'),
        line(U, '해 지면 가까운 항구에 들어가 자고, 날 밝으면 또 오게.', 'When the sun goes down, put in at the nearest port and sleep. When it is light, come on again.'),
        line(P, '쉬어 가도 되는 거네요.', 'So it is fine to stop and rest.'),
        line(U, '밤바다를 혼자 건너는 게 실력이 아니네. 쉬어 가는 것도 실력이지.', "Crossing the night sea alone isn't skill. Knowing when to rest is skill too."),
        line(U, '늙은이들은 기다리는 거 하나는 잘해.', 'If old men are good at one thing, it is waiting.'),
      ], {
        choices: [
          opt('ok', '쉬어 가면서 올라갈게요', "I'll rest along the way and come up", {
            end: endTalk({ accept: true, offer: 'long_way' }),
            note: ['해 지면 가까운 항구에서 자고, 쉬어 가며 올라가기로 했다.', 'I would sleep at the nearest port each night and come up in stages.'] }),
          opt('rig', '그런데 강두철 씨 채비는요?', 'But what about your rig, Ducheol?', {
            say: ['그런데 강두철 씨 채비는 이번에도 제가 묶어 드려야 해요?', 'But will I have to tie your rig for you again this time, Ducheol?'], next: 'rig' }),
        ],
        note: ['혼자 몰고 갈 수 있을지 걱정했다. 강두철 씨는 동해안은 육지를 옆에 끼고 오는 길이니, 해 지면 가까운 항구에서 자고 오라고 — 쉬어 가는 것도 실력이라고 했다.',
          'I worried about sailing alone. The east coast keeps land beside you, Kang Ducheol said — sleep at the nearest port when the sun sets; knowing when to rest is a skill too.'],
      }),
      rig: scene([
        line(U, '허허, 그래 주면 고맙지.', 'Ha ha, I would be grateful if you did.'),
        line('', '(손가락을 꼼지락거려 보인다.)', '(He wiggles his fingers at me.)'),
        act(U, 'laugh'),
        line(U, '농담일세. 이번엔 내가 묶어 옴세. 자네는 키만 잡게.', 'Only joking. This time I will tie my own. You just take the wheel.'),
        line(U, '손님이 채비까지 선장한테 맡기면 그건 손님이 아니라 짐이야.', "A passenger who leaves even their rig to the captain isn't a passenger. They're cargo."),
      ], {
        end: endTalk({ accept: true, offer: 'rig_joke' }),
        note: ['이번에도 채비를 묶어 드려야 하느냐고 농담을 했다. 강두철 씨는 손가락을 꼼지락거려 보이다 웃으며, 이번엔 자기가 묶어 오겠다고 — 나는 키만 잡으라고 했다.',
          'I joked about tying his rig again. Kang Ducheol wiggled his fingers, laughed, and said this time he would tie his own — I should just take the wheel.'],
      }),
    },
  },
  {
    id: 'm4_11_done', questId: 'M4-11', at: 'complete', npcId: U, start: 'start',
    nodes: {
      start: scene([
        line(U, '…좋은 배야.', "...It's a good boat.", { act: 'look_sea' }),
        line(P, '…그래요?', '...You think so?'),
        line(U, '탁 씨도 그러네. 말은 안 해도 얼굴에 다 쓰여 있어.', "Tak thinks so too. He won't say it, but it's written all over his face."),
        line(U, '값은 여기. 정가.', 'Here is the fare. Full price.'),
        line(P, '…', '...'),
        line(U, '첫 손님 값은 깎는 게 아니야.', "You don't discount your first passengers."),
      ], {
        choices: [
          opt('full', '정가로 받을게요. 손님이니까요', "I'll take full fare. You're passengers", {
            say: ['정가로 받을게요. 손님이니까요.', "I'll take the full fare. You are my passengers."], next: 'full' }),
          opt('free', '두 분한테는 받을 수 없어요', "I can't take money from you two", { next: 'free' }),
          opt('lucky', '두 분 다 한 마리씩… 제 배가 운이 좋은가 봐요', 'One fish each... my boat must be lucky', {
            say: ['두 분 다 한 마리씩 올리셨어요. 제 배가 운이 좋은가 봐요.', 'You each landed one. My boat must be lucky.'], next: 'lucky' }),
        ],
        note: ['두 노인을 태우고 속초 앞바다에 나갔다 돌아왔다. 강두철 씨는 좋은 배라며, 정가를 내밀고 첫 손님 값은 깎는 게 아니라고 했다.',
          'I took the two old men out off Sokcho and back. Kang Ducheol called it a good boat, held out the full fare, and said you do not discount your first passengers.'],
      }),
      full: scene([
        line(U, '그게 맞아.', "That's right.", { act: 'nod' }),
        line(U, '탁 씨 봉투도 받아 두게. 그 사람 마음이 들었어.', "Take Tak's envelope too. His heart is in it."),
        line(P, '…고맙습니다.', '...Thank you.'),
      ], {
        end: endTalk({ complete: 'full_price', lineKo: '정가로 받는 선장한테는 손님이 값을 깎자고 안 해. 그게 자네 배 값이야.', lineEn: 'Nobody haggles with a captain who charges full fare. That is what your boat is worth.' }),
        note: ['손님이니까 정가로 받겠다고 했다. 두 노인이 봉투를 하나씩 내밀었고, 탁만수 씨 봉투에는 대나무 조각이 들어 있었다.',
          "I said I would take full fare, since they were passengers. The two old men each held out an envelope, and Tak Mansu's had a sliver of bamboo inside."],
      }),
      free: scene([
        act(U, 'silence'),
        line(U, '…자네.', '...Now, you.'),
        line(U, '손님 값을 안 받는 선장은 오래 못 가.', "A captain who won't take fares doesn't last long.", { act: 'shake_head' }),
        line(P, '오늘만요. 두 분이니까요.', 'Just today. Because it is you two.'),
      ], {
        end: endTalk({ complete: 'free', lineKo: '그래도 오늘은 받아 두지, 그 마음을.', lineEn: 'Still, today I will accept it — that heart of yours.' }),
        note: ['두 분에게는 받을 수 없다고 했다. 강두철 씨는 손님 값을 안 받는 선장은 오래 못 간다면서도, 오늘은 그 마음을 받아 두겠다며 봉투 대신 소개장을 건넸다.',
          "I said I couldn't take their money. A captain who won't take fares doesn't last, Kang Ducheol said — but today he would accept the gesture, and handed me a letter of introduction instead of the envelope."],
      }),
      lucky: scene([
        line(U, '운은 무슨.', 'Luck, nothing.'),
        line(U, '자네가 물 보고 자리 잡은 거 다 봤네. 탁 씨도 봤고.', 'I saw you read the water and pick the spot. So did Tak.'),
        line(P, '…들켰네요.', '...You caught me.'),
      ], {
        end: endTalk({ complete: 'lucky_boat', lineKo: '손님은 운 보고 한 번 오고, 선장 보고 두 번 오는 거야. 우리는 두 번 올 걸세.', lineEn: 'Passengers come once for luck and twice for the captain. We will be coming twice.' }),
        note: ['내 배가 운이 좋은가 보다고 했다. 강두철 씨는 운은 무슨, 내가 물을 보고 자리 잡은 걸 다 봤다며 모자를 고쳐 쓰고 두 번 오겠다고 했다.',
          'I said my boat must be lucky. Luck nothing, Kang Ducheol said — he had watched me read the water and pick the spot. Straightening his cap, he said they would come twice.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M4-10 「제주 항로」 — 도현수
  // ═══════════════════════════════════════════
  {
    id: 'm4_10_offer', questId: 'M4-10', at: 'offer', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '제주까지 간다며.', "I hear you're going all the way to Jeju."),
        line(P, '…누구한테 들었어요?', '...Who told you?'),
        line(H, '다 들려. 항구는 좁아.', 'Everyone hears everything. Harbors are small.', { act: 'look_away' }),
        line(H, '나도 탄다.', "I'm coming aboard."),
        line(P, '네? 도현수 씨가요?', 'What? You, Hyeonsu?'),
        line(H, '장거리면 보급부터 챙겨. 중간에 들를 데가 마땅치 않으니까, 세 가지는 만들어 둬.', "For a long haul, sort out the stores first. There's nowhere decent to stop on the way, so make three kinds."),
        line(H, '연료 계산은 내가 해. 기상은 네가 봐.', "I'll do the fuel numbers. You watch the weather."),
        line(H, '그게 낫겠지.', 'That would be better.'),
      ], {
        choices: [
          opt('deal', '좋아요. 연료는 도현수 씨가, 기상은 제가', 'Deal. Fuel is yours, weather is mine', {
            say: ['좋아요. 연료는 도현수 씨가, 기상은 제가. 그게 낫겠네요.', "All right. Fuel for you, Hyeonsu, and weather for me. That's better."], next: 'deal' }),
          opt('why', '왜 제 배에 타요? 누가 시켰어요?', 'Why ride my boat? Did someone tell you to?', {
            say: ['그런데 왜 제 배에 타요? 누가 시켰어요?', 'But why would you ride my boat? Did someone tell you to?'], next: 'why' }),
          opt('weather', '기상은 왜 저예요?', 'Why am I on weather?', {
            say: ['기상은 왜 저예요? 도현수 씨도 볼 줄 알잖아요.', 'Why am I on weather? You can read it too, Hyeonsu.'], next: 'weather' }),
        ],
        note: ['도현수 씨가 제주까지 간다는 얘기를 듣고 자기도 타겠다고 했다. 긴 뱃길에 쓸 보급 세 가지를 만들어 두고, 연료 계산은 자기가, 기상은 내가 보자고 했다.',
          'Do Hyeonsu heard I was sailing to Jeju and said he was coming. Make three kinds of stores for the long voyage, he said — he would do the fuel numbers and I would watch the weather.'],
      }),
      deal: scene([
        line(H, '…바로 받네. 따질 줄 알았는데.', '...You agreed fast. I thought you would argue.'),
        line('', '(계산기를 꺼낸다.)', '(He takes out a calculator.)'),
        line(H, '제주 가는 길은 중간에 기름 넣을 데가 마땅치 않아. 계산은 넉넉하게 한다.', "There's nowhere good to refuel on the way to Jeju. I'll be generous with the numbers."),
        line(P, '남으면 아깝지 않아요?', "Isn't leftover fuel a waste?"),
        line(H, '기름은 모자란 것보다 남는 게 백 배 나아. 너는 하늘이나 봐.', 'Fuel left over beats fuel run short a hundred times. You just watch the sky.'),
      ], {
        end: endTalk({ accept: true, offer: 'deal' }),
        note: ['연료는 도현수 씨가, 기상은 내가 보기로 바로 받았다. 그는 따질 줄 알았다며 계산기를 꺼내더니, 기름은 넉넉하게 잡겠다고 했다.',
          'I agreed at once — fuel for Do Hyeonsu, weather for me. He said he had expected an argument, took out a calculator, and said he would be generous with the fuel.'],
      }),
      why: scene([
        line(H, '할아버지는 아무 말 안 했어. 내가 타겠다고 한 거야.', "Grandpa didn't say a word. I'm the one who said I'd ride.", { act: 'look_away' }),
        line(P, '…왜요?', '...Why?'),
        line(H, '장거리는 혼자 보는 눈보다 둘이 보는 눈이 낫잖아.', 'On a long haul, two pairs of eyes beat one.'),
        line(H, '그 이상은 묻지 마. 연료 계산이나 하게 둬.', "Don't ask more than that. Just let me do the fuel numbers."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_why' }),
        note: ['왜 내 배에 타느냐고 물었다. 도현수 씨는 시선을 피하며 누가 시킨 게 아니라 자기가 타겠다고 한 거라고, 그 이상은 묻지 말라고 했다.',
          'I asked why he would ride my boat. Looking away, Do Hyeonsu said no one told him to — he chose it himself — and not to ask more than that.'],
      }),
      weather: scene([
        line(H, '볼 줄은 알지. 근데 둘이 같은 걸 보면 다른 건 아무도 안 봐.', 'I can. But if we both look at the same thing, nobody looks at anything else.'),
        line(H, '한 사람은 계산하고, 한 사람은 밖을 봐야 해.', 'One person calculates; the other has to look outside.'),
        line(P, '그게 왜 저예요?', 'And why me?'),
        line(H, '나는 계산이 편하고, 너는 밖을 오래 보는 사람이잖아. 방파제에서부터 그랬어.', "Numbers suit me, and you're someone who looks out for a long time. You've been like that since the breakwater."),
      ], {
        choices: [
          opt('ok', '그럼 하늘은 제가 볼게요', "Then I'll watch the sky", {
            end: endTalk({ accept: true, offer: 'ask_weather' }),
            note: ['도현수 씨는 내가 밖을 오래 보는 사람이라고 했다. 하늘은 내가 보기로 했다.', 'Do Hyeonsu said I am someone who looks out for a long time. The sky would be mine to watch.'] }),
          opt('tease', '제 배에 타면 도현수 씨는 선원이에요', "On my boat, you're crew, Hyeonsu", {
            say: ['대신 제 배에 타면 도현수 씨는 선원이에요. 선장 말 들어요.', "But on my boat you're crew, Hyeonsu. You listen to the captain."], next: 'tease' }),
        ],
        note: ['기상은 왜 나냐고 물었다. 한 사람은 계산하고 한 사람은 밖을 봐야 한다고, 나는 방파제에서부터 밖을 오래 보는 사람이었다고 했다.',
          'I asked why I was on weather. One person calculates and the other watches outside, Do Hyeonsu said — and I have been someone who looks out a long time, ever since the breakwater.'],
      }),
      tease: scene([
        line(H, '…선원은 무슨.', '...Crew, my foot.'),
        line(H, '손님도 아니고 선원도 아니야. 그냥 같이 가는 거지.', 'Not a passenger, not crew. Just going along together.'),
        line('', '(그래도 짐을 내려놓고 밧줄부터 정리한다.)', '(Still, he puts down his bag and starts coiling the ropes.)'),
        line(H, '네 배니까 네가 정하는 건 따를게. 기상만큼은. 연료는 내 말 들어.', "It's your boat, so I'll follow your call. On the weather. On fuel, you listen to me."),
      ], {
        end: endTalk({ accept: true, offer: 'captain_tease' }),
        note: ['내 배에 타면 선원이라고 놀렸다. 도현수 씨는 선원은 무슨, 그냥 같이 가는 거라면서도 짐을 내려놓고 밧줄부터 정리했다.',
          'I teased him that on my boat he would be crew. Crew, my foot — just going along together, Do Hyeonsu said — but he put his bag down and started coiling the ropes.'],
      }),
    },
  },
  {
    id: 'm4_10_done', questId: 'M4-10', at: 'complete', npcId: H, start: 'start',
    nodes: {
      start: scene([
        line(H, '…됐다.', "...That's it."),
        line(P, '연료도, 하늘도요?', 'Fuel and sky both?'),
        line(H, '연료는 넉넉해. 하늘은 네가 괜찮다고 했고.', 'Fuel is plenty. And you said the sky is fine.'),
        line(H, '출항이야.', 'We sail.', { act: 'look_sea' }),
        line(H, '제주에서 보자.', 'See you in Jeju.'),
        act(H, 'silence'),
        line(H, '…아니, 같이 가는 거지.', "...No. We're going together."),
      ], {
        choices: [
          opt('together', '같이 간다는 말, 이상하게 편하네요', 'Going together — it feels oddly easy', { next: 'together' }),
          opt('rival', '제주에선 대회에서 봐요. 그땐 라이벌이에요', "In Jeju, I'll see you at the tournament. Rivals then", {
            say: ['제주 가면 대회에서 봐요. 그땐 라이벌이에요.', "In Jeju, I'll see you at the tournament. We're rivals then."], next: 'rival' }),
          opt('thanks', '고마워요. 혼자였으면 기름이 모자랐을 거예요', 'Thanks. Alone, I would have run short of fuel', {
            say: ['고마워요. 혼자였으면 기름을 모자라게 잡았을 거예요.', 'Thank you. On my own, I would have figured the fuel too short.'], next: 'thanks' }),
        ],
        note: ['보급을 다 만들고 도현수 씨와 출항 준비를 마쳤다. 그가 연료를, 내가 하늘을 봤는데, 제주에서 보자던 그는 곧 같이 가는 거라고 고쳐 말했다.',
          'With the stores made, Do Hyeonsu and I finished preparing to sail, he on fuel and I on the sky. He said see you in Jeju — then corrected himself: we were going together.'],
      }),
      together: scene([
        line(H, '…나도.', '...Me too.'),
        line(H, '말하지 마.', "Don't say it.", { act: 'look_away' }),
        line(P, '…', '...'),
      ], {
        end: endTalk({ complete: 'together', lineKo: '배 위에서만이야. 내리면 원래대로. …그래도 다음 장거리 때 연료 계산은 또 내가 한다.', lineEn: "Only on the boat. Once we're ashore, back to normal. ...Still, next long haul, I'm doing the fuel again." }),
        note: ['같이 간다는 말이 이상하게 편하다고 했다. 도현수 씨는 자기도 그렇다며 말하지 말라고 하고는, 글씨가 고운 연료 계산표를 내게 줬다.',
          'I said going together felt oddly easy. Do Hyeonsu said he felt the same — then told me not to say it, and handed me his neatly written fuel sheet.'],
      }),
      rival: scene([
        line(H, '당연하지. 배 위에서만 같은 편이야.', "Obviously. We're only on the same side on the boat."),
        act(H, 'laugh'),
        line(P, '오랜만에 웃는 거 봐요.', "First time I've seen you laugh in ages."),
      ], {
        end: endTalk({ complete: 'rival', lineKo: '대회에서 봐주면 그땐 진짜 안 본다. 전력으로 와. 나도 그렇게 할 거니까.', lineEn: "Go easy on me at the tournament and I'm done with you for real. Come at full strength. I will too." }),
        note: ['제주에선 대회에서 라이벌로 보자고 했다. 도현수 씨는 당연하다며 웃었는데, 오래 못 본 웃음이었다.',
          'I said that in Jeju we would meet at the tournament as rivals. Obviously, Do Hyeonsu said, and laughed — a laugh I had not seen in a long time.'],
      }),
      thanks: scene([
        line(H, '…알아. 너 계산 대충 하잖아.', "...I know. You're sloppy with numbers."),
        line(P, '…그렇게까진 아닌데요.', "...I'm not that bad."),
        line(H, '고맙다는 말은 제주 도착하면 해.', 'Say thanks when we reach Jeju.'),
      ], {
        end: endTalk({ complete: 'thanks', lineKo: '바다 한가운데서 하면 재수 없어. 그때까지 아껴 둬.', lineEn: 'Saying it in the middle of the sea is bad luck. Save it till then.' }),
        note: ['혼자였으면 기름을 모자라게 잡았을 거라며 고맙다고 했다. 도현수 씨는 계산표를 손가락으로 툭 치며, 고맙다는 말은 제주에 도착하면 하라고 했다.',
          'I thanked him — alone I would have run short on fuel. Do Hyeonsu tapped the fuel sheet with a finger and told me to save my thanks for when we reached Jeju.'],
      }),
    },
  },
];
