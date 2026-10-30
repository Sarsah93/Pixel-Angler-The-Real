/**
 * @file StoryTalkM6.ts
 * @description 290차 — 제5부 「먼 항로」(Ch6 울릉 · 인천 · 속초 · 울산 — M6-01 ~ M6-09) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *  규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 시범 `StoryTalkN01.ts`.
 *  옛 받는 답 · 보상 답은 끝(`end.offer` · `end.complete`)에 묶어 결과 · 표시를 그대로 쓴다. 새 표시는 만들지 않는다.
 *
 * 인물 말투
 *  - 오세라(34 · 울릉 야간 편의점): 건조한 해요체 · 「그쪽」 · 섬 사람다운 체념과 배려 · 밤에 몰래 대를 닦는다.
 *  - 연태오(27 · 숨긴 제자): 짧은 해요체 · 말을 아낀다 · 스승의 이름은 끝내는 자리에서야 흘린다.
 *  - 석대양(등대지기 · 노인): 「자네」 · 「-게」 「-세」 「-지」 · 느리고 정확하다 · 기상을 손으로 적는다.
 *  - 단철호(52 · 회사 부장): 넉살 좋은 해요체 · 「그쪽」 · 퇴근길 짬낚시 · 「잠깐」이 늘 길어진다.
 *  - 정옥선(71 · 만복상회 · 입원 중): 무뚝뚝한 반말 · 「너」 · 걱정을 꾸지람으로 한다.
 *  - 고만석(58 · 고래마루 선장): 험상궂은 반말 · 「자네」 · 「-다」 「-냐」 · 말끝을 툭 자른다.
 *  - 동명항 어촌계(계장): 짧게, 규칙으로 · 「너」. 주인공은 부르는 말 없이 합니다체.
 * 남기는 표시: 없음(옛 답의 표시가 그대로 붙는다).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const SERA = 'oh_sera';
const TA = 'yeon_taeo';
const D = 'seok_daeyang';
const DAN = 'dan_cheolho';
const OK = 'okseon';
const GM = 'go_manseok';
const C = 'coop';
const P = 'player';

export const TALKS_M6: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // M6-01 「막배」 — 받는 자리(오세라) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_01_offer', questId: 'M6-01', at: 'offer', npcId: SERA, start: 'start',
    nodes: {
      start: scene([
        line(SERA, '어서 오세요.', 'Welcome.', { act: 'look_up' }),
        line(P, '저기, 여객선 터미널이 문을 닫았던데요.', 'Excuse me — the ferry terminal was closed.'),
        line(SERA, '결항이에요. 오늘은 못 나가요.', "Cancelled. Nobody's leaving today."),
        line(P, '…그럼 오늘 밤은 섬에서 보내야 하는 거군요.', "...So I'm spending the night on the island."),
        line(SERA, '이 시간에 문 연 데는 여기 하나예요.', "This is the only place open at this hour.", { act: 'look_sea' }),
        line(SERA, '여기 앉아요. 난로 켜 둘게요.', "Sit here. I'll keep the heater on."),
        line(P, '감사합니다. 뭐라도 사 먹어야겠네요.', "Thank you. I should buy something to eat."),
        line(SERA, '컵라면은 셀프예요. 물은 저기.', "Cup noodles are self-serve. Hot water's over there."),
      ], {
        choices: [
          opt('stay_pay', '신세 지겠습니다. 라면값은 제가 낼게요', "I'll impose on you. I'll pay for the noodles", {
            say: ['신세 좀 지겠습니다. 라면값은 제가 낼게요.', "I'll impose on you a little. I'll pay for the noodles."],
            next: 'pay' }),
          opt('ask_ferry', '결항이 자주 있어요? 아침엔 배가 뜹니까?', 'Are cancellations common? Will the boat run in the morning?', {
            next: 'ferry' }),
          opt('ask_night_shop', '밤에 혼자 가게를 보세요? 손님도 없을 텐데요', "You keep the shop alone at night? There can't be many customers", {
            next: 'night' }),
        ],
        note: ['울릉도에 닿았는데 여객선이 결항됐다. 불이 켜진 곳은 오세라 씨의 야간 편의점뿐이었고, 오세라 씨는 난로를 켜 둘 테니 앉으라며 컵라면은 셀프라고 했다.',
          "I reached Ulleungdo and the ferry was cancelled. The only light on was Oh Sera's night convenience store; she told me to sit, she'd keep the heater on, and the cup noodles were self-serve."],
      }),
      pay: scene([
        line(SERA, '당연하죠. 셀프라니까요, 계산도.', "Of course. Self-serve — paying too."),
        line(SERA, '난로 옆자리는 비워 둬요. 밤에 결항 손님이 더 올 수도 있어요.', "Leave the seat by the heater free. More stranded people may come in tonight."),
        line(P, '섬에선 다 그런가요?', 'Is that how it is on the island?'),
        line(SERA, '하룻밤 버티는 사람끼리 자리를 나눠요. 섬은 다 그래요.', "People getting through the night share their seats. The whole island's like that."),
      ], {
        end: endTalk({ accept: true, offer: 'stay_pay' }),
        note: ['신세 지겠다며 라면값은 내가 내겠다고 했다. 오세라 씨는 난로 옆자리는 결항 손님을 위해 비워 두라고 했다.',
          "I said I'd impose on her and pay for my noodles. Sera told me to leave the seat by the heater free for other stranded people."],
      }),
      ferry: scene([
        line(SERA, '바람 부는 날은 다 결항이에요. 아침 배는 아침에 알아요.', "Any windy day, everything's cancelled. You find out about the morning boat in the morning."),
        line(SERA, '섬에선 내일 일을 오늘 몰라요.', "On the island, you don't know tomorrow today."),
        line(SERA, '그러니까 오늘 밤만 생각해요. 난로, 라면, 잠. 그 셋이면 살아요.', "So just think about tonight. Heater, noodles, sleep. With those three, you'll live."),
      ], {
        choices: [
          opt('three', '난로, 라면, 잠. 알겠습니다', 'Heater, noodles, sleep. Got it', {
            end: endTalk({ accept: true, offer: 'ask_ferry' }),
            note: ['아침엔 배가 뜨느냐고 물었다. 섬에선 내일 일을 오늘 모른다며, 난로와 라면과 잠, 그 셋이면 산다고 했다.',
              "I asked whether the boat would run in the morning. On the island you don't know tomorrow today, Sera said — heater, noodles, sleep, and you'll live."] }),
          opt('grumble', '하필 오늘 결항이라니, 일정이 다 꼬였어요', "Cancelled today of all days. My whole schedule's ruined", {
            next: 'grumble' }),
        ],
      }),
      grumble: scene([
        line(SERA, '섬에 온 사람은 다 그 말을 해요. 그러다 하룻밤 지나면 안 해요.', "Everyone who comes to the island says that. After one night, they stop."),
        line(SERA, '바다가 정한 일정이 진짜 일정이에요. 꼬인 건 그쪽 수첩이고요.', "The schedule the sea sets is the real one. It's your notebook that's tangled."),
        line(P, '…맞는 말이네요.', "...Fair point."),
        line(SERA, '화나면 라면 먹어요. 결항인 밤에 먹는 라면은 맛있어요.', "If you're angry, eat noodles. Noodles taste good on a cancelled night."),
      ], {
        end: endTalk({ accept: true, offer: 'grumble' }),
        note: ['일정이 다 꼬였다고 투덜댔다. 오세라 씨는 바다가 정한 일정이 진짜이고 꼬인 건 내 수첩이라며, 화나면 라면을 먹으라고 했다.',
          "I grumbled that my schedule was ruined. The sea's schedule is the real one, Sera said — it's my notebook that's tangled — and if I was angry, eat noodles."],
      }),
      night: scene([
        line(SERA, '없죠. 그래서 밤이 좋아요. 혼자 할 일이 많거든요.', "There aren't. That's why I like nights. I've got a lot to do on my own."),
        line(P, '(방금 계산대 밑으로 뭔가 길쭉한 걸 밀어 넣었는데…)', '(She just slid something long under the counter...)'),
        line(SERA, '결항인 밤엔 그쪽 같은 손님이 와요. 그것도 나쁘지 않아요.', "On cancelled nights, people like you come in. That's not bad either."),
        line(SERA, '조용히만 있어 주면요. 난로 켜 둘게요.', "As long as you keep quiet. I'll keep the heater on."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_night_shop' }),
        note: ['밤에 혼자 가게를 보느냐고 물었다. 오세라 씨는 그래서 밤이 좋다며 계산대 밑으로 뭔가 길쭉한 것을 슬쩍 밀어 넣고는, 조용히만 있어 달라고 했다.',
          "I asked if she kept the shop alone at night. That's why she likes nights, Sera said, sliding something long under the counter — just keep quiet, she said."],
      }),
    },
  },
  // M6-01 — 끝내는 자리
  {
    id: 'm6_01_done', questId: 'M6-01', at: 'complete', npcId: SERA, start: 'start',
    nodes: {
      start: scene([
        line(SERA, '살았네요.', 'You made it.', { act: 'look_up' }),
        line(P, '네. 생각보다 긴 밤이었어요.', 'Yes. It was a longer night than I expected.'),
        line(SERA, '결항 하룻밤. 섬은 원래 이래요.', "One cancelled night. That's the island for you."),
        line(P, '난로 덕분에 버텼어요.', 'The heater got me through.'),
        line(SERA, '이제 울릉 사람 반은 됐어요.', "You're half an Ulleung person now."),
      ], {
        choices: [
          opt('rod', '오세라 씨가 낚싯대 닦는 걸 보고 저도 닦았어요', 'I saw you cleaning your rod, so I cleaned mine', {
            say: ['밤에 오세라 씨가 낚싯대 닦는 걸 보고, 저도 닦았어요.', 'I saw you cleaning your rod last night, Sera, so I cleaned mine too.'],
            next: 'rod' }),
          opt('ramen', '컵라면이 이렇게 맛있는 줄 몰랐어요', "I didn't know cup noodles could taste this good", {
            end: endTalk({ complete: 'ramen',
              lineKo: '결항 라면이에요. 맛있죠. 같은 라면인데 결항인 밤엔 맛이 달라요. 갈 데가 없으니까 천천히 먹거든요. 다음 결항 땐 라면값 안 받을게요.',
              lineEn: "Cancelled-night noodles. Good, aren't they? Same noodles, but they taste different on a cancelled night — nowhere to go, so you eat slowly. Next time you're stranded, they're on me." }),
            note: ['컵라면이 이렇게 맛있는 줄 몰랐다고 했다. 오세라 씨는 결항 라면이라며, 다음 결항 때는 라면값을 안 받겠다고 했다.',
              "I said I'd never known cup noodles could taste so good. Cancelled-night noodles, Sera said — and next time I'm stranded, they're on her."] }),
          opt('tidy_up', '자리 정리하고 갈게요. 의자랑 난로 주변이요', "I'll tidy up before I go. The chairs and around the heater", {
            next: 'tidy' }),
        ],
        note: ['결항 하룻밤을 편의점에서 버텼다. 오세라 씨는 섬은 원래 이렇다며, 이제 울릉 사람 반은 됐다고 했다.',
          "I got through the cancelled night in the convenience store. That's the island, Sera said — I was half an Ulleung person now."],
      }),
      rod: scene([
        line(SERA, '…봤어요?', '...You saw?', { act: 'look_away' }),
        line(SERA, '밤에 닦아요, 늘. 손님 없는 시간에 대를 닦으면 내일 던질 생각이 나요.', "I clean it at night, always. Cleaning a rod when there's no one in makes me think of tomorrow's cast."),
        line(SERA, '편의점 뒤로 돌아가면 제 자리가 하나 있어요. 아무한테도 말 안 한 데예요.', "Go round behind the shop and there's a spot of mine. I've never told anyone about it."),
      ], {
        end: endTalk({ complete: 'rod', lineKo: '거리만 지켜 줘요. 바로 옆에서 던지면 안 돼요.', lineEn: "Just keep your distance. Don't cast right beside it." }),
        note: ['오세라 씨가 낚싯대 닦는 걸 보고 나도 닦았다고 했다. 오세라 씨는 아무한테도 말하지 않은 편의점 뒤 자기 자리를 알려 주며, 거리만 지켜 달라고 했다.',
          "I said I'd cleaned my rod after seeing Sera clean hers. She told me about her spot behind the shop that she'd never told anyone — just keep my distance, she said."],
      }),
      tidy: scene([
        line(SERA, '…안 해도 되는데.', "...You don't have to."),
        line(SERA, '대걸레는 저기 있어요.', "The mop's over there."),
        line(P, '금방 하고 갈게요.', "I'll be quick."),
      ], {
        end: endTalk({ complete: 'tidy_up',
          lineKo: '결항 손님이 자리 치우고 가는 거, 섬에선 다 봐요. 다음에 배가 묶이면 이 섬 사람들이 먼저 자리를 내줄 거예요. 그쪽 얼굴 기억하니까요.',
          lineEn: "The island sees when a stranded guest cleans up before leaving. Next time the boats are tied up, people here will make room for you first. They'll remember your face." }),
        note: ['떠나기 전에 의자와 난로 주변을 정리하겠다고 했다. 오세라 씨는 말리지 않고 대걸레를 가리키며, 다음엔 섬 사람들이 먼저 자리를 내줄 거라고 했다.',
          "I said I'd tidy the chairs and the heater area before leaving. Sera didn't stop me; she pointed to the mop and said next time the islanders would make room for me first."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M6-02 「부시리」 — 받는 자리(연태오) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_02_offer', questId: 'M6-02', at: 'offer', npcId: TA, start: 'start',
    nodes: {
      start: scene([
        line(TA, '…부시리 잡으러 왔어요?', '...Here for amberjack?', { act: 'look_up' }),
        line(P, '네. 울릉도 부시리가 크다고 해서요.', 'Yes. I heard the amberjack around Ulleungdo are big.'),
        line(TA, '파핑이에요. 수면에서 잡아요.', "It's popping. You take them on the surface."),
        line(P, '파퍼로요? 여름 가을이면 올라온다던데요.', 'With a popper? I heard they come up in summer and autumn.'),
        line(TA, '올라와요. 수면을 가르면서 덮쳐요.', 'They come up. They tear through the surface and hit it.', { act: 'look_sea' }),
        line(P, '옆에서 좀 가르쳐 주실 수 있어요?', 'Could you teach me, from beside me?'),
        line(TA, '같이는 가요. 근데 저는 말 안 해요.', "I'll come along. But I don't talk."),
        line(P, '말을 안 하신다고요?', "You don't talk?"),
        line(TA, '스승이 그렇게 가르쳤어요.', 'My teacher taught me that way.'),
      ], {
        choices: [
          opt('learn_watching', '말씀 안 하셔도 돼요. 보고 배울게요', "You don't have to talk. I'll learn by watching", {
            next: 'watch' }),
          opt('ask_teacher', '스승이 누구신데요? 말 안 하는 걸 가르친 분이요', 'Who is your teacher? The one who taught you not to talk', {
            next: 'teacher' }),
          opt('gear_doubt', '대형 청물은 처음이에요. 장비가 버틸지 모르겠어요', "It's my first big pelagic. I don't know if my gear will hold", {
            next: 'gear' }),
        ],
        note: ['울릉도에서 연태오 씨를 만났다. 여름이나 가을 바다에서 파퍼로 부시리를 잡자며, 같이는 가되 스승이 그렇게 가르쳐서 자기는 말을 안 한다고 했다.',
          "On Ulleungdo I met Yeon Taeo. We'd take amberjack on poppers in the summer or autumn sea — he'd come along, but he doesn't talk, because that's how his teacher taught him."],
      }),
      watch: scene([
        line(TA, '…좋아요. 그럼 지금 하는 말이 마지막이에요.', "...Good. Then what I say now is the last of it."),
        line(TA, '파퍼가 서 있을 때 와요. 움직일 때 말고요.', "They come when the popper is still. Not while it's moving."),
        line(P, '서 있을 때요?', 'When it\'s still?'),
        line(TA, '멈추는 시간을 참는 게 다예요. 나머지는 부시리가 가르쳐 줄 거예요.', "Holding out through the pause is everything. The amberjack will teach you the rest."),
      ], {
        end: endTalk({ accept: true, offer: 'learn_watching' }),
        note: ['말 안 해도 보고 배우겠다고 했다. 연태오 씨는 지금 하는 말이 마지막이라며, 파퍼가 멈춘 시간을 참는 게 다라고 했다.',
          "I said I'd learn by watching. Taeo said these were his last words: holding out through the popper's pause is everything."],
      }),
      teacher: scene([
        line(TA, '…그건 다음에요.', '...Another time.', { act: 'look_away' }),
        line(TA, '말 안 하는 걸 배웠으니까, 누구한테 배웠는지도 말 안 하는 거예요.', "I learned not to talk, so I don't say who I learned it from, either."),
        line(P, '그래서 숨긴 제자라고들 하는군요.', "So that's why people call you the hidden apprentice."),
        line(TA, '그런 뜻이에요. 오늘은 부시리만 생각해요.', "That's what it means. Today, just think about amberjack."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_teacher' }),
        note: ['스승이 누구냐고 물었다. 연태오 씨는 말 안 하는 걸 배웠으니 누구에게 배웠는지도 말 안 한다며, 오늘은 부시리만 생각하라고 했다.',
          "I asked who his teacher was. He'd learned not to talk, Taeo said, so he wouldn't say who taught him; today, just think about amberjack."],
      }),
      gear: scene([
        line(TA, '버티게 해요. 드랙을 믿고, 손은 대를 세우는 데만 써요.', "Make it hold. Trust the drag, and use your hands only to keep the rod up."),
        line(TA, '이 정도면 돼요.', 'This is fine.', { act: 'peer' }),
        line(TA, '줄은 장비보다 마음이 먼저 끊겨서 끊겨요. 처음 달릴 때 놀라서 줄을 손으로 잡는 사람이 끊어요.', "Lines break because the nerve breaks before the gear. People who panic on the first run and grab the line — they're the ones who snap it."),
      ], {
        choices: [
          opt('no_grab', '줄은 손으로 안 잡을게요', "I won't grab the line", {
            end: endTalk({ accept: true, offer: 'gear_doubt' }),
            note: ['장비가 버틸지 모르겠다고 했다. 연태오 씨는 내 릴의 드랙을 당겨 보고 이 정도면 된다며, 줄은 마음이 먼저 끊겨서 끊긴다고 했다.',
              "I worried my gear wouldn't hold. Taeo tugged my reel's drag and said it'd do — lines break because the nerve goes first."] }),
          opt('talk_alone', '말씀 안 하시면, 제가 혼잣말을 해도 될까요?', "If you won't talk, may I talk to myself?", {
            next: 'alone' }),
        ],
      }),
      alone: scene([
        line(TA, '…해도 돼요. 부시리는 사람 말 안 들어요.', "...Go ahead. Amberjack don't listen to people."),
        line(TA, '대신 파퍼가 멈출 때는 숨도 참아요. 그때 물어요.', "But when the popper stops, hold your breath too. That's when they hit."),
        line(P, '혼잣말은 언제 해요?', 'Then when do I talk to myself?'),
        line(TA, '랜딩하고 해요. 그때는 저도 대답할지 몰라요.', "After you land it. I might even answer then."),
      ], {
        end: endTalk({ accept: true, offer: 'talk_alone' }),
        note: ['혼잣말을 해도 되느냐고 물었다. 연태오 씨는 어깨를 아주 조금 들썩이며, 혼잣말은 랜딩하고 하면 그때는 자기도 대답할지 모른다고 했다.',
          "I asked if I could talk to myself. Taeo's shoulders twitched slightly: do it after landing, he said — he might even answer then."],
      }),
    },
  },
  // M6-02 — 끝내는 자리
  {
    id: 'm6_02_done', questId: 'M6-02', at: 'complete', npcId: TA, start: 'start',
    nodes: {
      start: scene([
        line(P, '연태오 씨, 올렸어요.', "Taeo, I landed it."),
        line(TA, '…랜딩했네요.', "...You landed it.", { act: 'nod' }),
        line(P, '정말 한마디도 안 하시더라고요.', "You really didn't say a word."),
        line(TA, '말 안 해도 됐죠.', "Didn't need to, did I."),
        line(P, '드랙 소리가 대신 말해 주더라고요.', 'The drag did the talking for you.'),
        line(TA, '스승이 그렇게 가르쳤어요. 말 안 하는 걸로.', "That's how my teacher taught. By not talking."),
      ], {
        choices: [
          opt('who', '스승이 누구예요?', 'Who is your teacher?', {
            say: ['이제 랜딩했으니까요. 스승이 누구예요?', "I've landed it now. So — who is your teacher?"],
            next: 'who' }),
          opt('silence', '말 안 하는 가르침이 더 오래 남았어요', 'Teaching without words stayed with me longer', {
            say: ['말 안 하는 가르침, 그게 더 오래 남았어요.', 'Teaching without words — that stayed with me longer.'],
            next: 'silence' }),
          opt('one_word', '이제 랜딩했으니, 한마디만 해 주세요', "Now that I've landed it, just say one word", {
            next: 'one_word' }),
        ],
        note: ['파퍼로 부시리를 랜딩했다. 옆에서 한마디도 안 하던 연태오 씨는, 스승이 말 안 하는 걸로 그렇게 가르쳤다고 했다.',
          "I landed an amberjack on a popper. Taeo hadn't said a word beside me; then he said that was how his teacher taught — by not talking."],
      }),
      who: scene([
        act(TA, 'silence'),
        line(TA, '…등대예요. 등대지기.', '...The lighthouse. The keeper.', { act: 'look_sea' }),
        line(TA, '그 얘긴 그분한테 들어요. 등대에 올라가면 기상 적는 분이 있어요.', "Hear that story from him. Go up the lighthouse and there's a man who writes down the weather."),
      ], {
        end: endTalk({ complete: 'who',
          lineKo: '제 이름은 대지 마요. 그분이 먼저 알아볼 거예요. 그분은 사람을 오래 봐요.',
          lineEn: "Don't mention my name. He'll know you first. He looks at people a long time." }),
        note: ['스승이 누구냐고 물었다. 연태오 씨는 등대 쪽을 한 번 보고 등대지기라고 하더니, 자기 이름은 대지 말라고, 그분이 먼저 알아볼 거라고 했다.',
          "I asked who his teacher was. Taeo glanced once toward the lighthouse — the keeper — and told me not to mention his name; the keeper would know me first."],
      }),
      silence: scene([
        line(TA, '…그렇죠.', '...Right.'),
        line(TA, '말로 배운 건 잊어버려요. 손으로 배운 건 안 잊어요.', "What you learn from words, you forget. What you learn with your hands, you don't."),
      ], {
        end: endTalk({ complete: 'silence', lineKo: '오늘 손이 배운 거, 다음에 던질 때 알 거예요.', lineEn: "What your hands learned today — you'll know it next time you cast." }),
        note: ['말 안 하는 가르침이 더 오래 남았다고 했다. 연태오 씨는 말로 배운 건 잊어도 손으로 배운 건 안 잊는다고 했다.',
          "I said the wordless teaching stayed with me longer. Taeo said what you learn from words you forget; what your hands learn, you don't."],
      }),
      one_word: scene([
        line(TA, '…잘했어요.', '...Well done.'),
        line(TA, '그거면 돼요?', 'Is that enough?'),
        line(P, '네. 그거면 돼요.', "Yes. That's enough."),
      ], {
        end: endTalk({ complete: 'one_word',
          lineKo: '스승은 그 한마디도 안 해요. 저는 아직 덜 배워서 해요. 그쪽이 들은 건 덜 배운 제자의 말이에요. 그래도 진짜예요.',
          lineEn: "My teacher wouldn't even say that much. I still haven't learned enough, so I do. What you heard is a half-taught apprentice talking. But it's real." }),
        note: ['랜딩했으니 한마디만 해 달라고 했다. 연태오 씨는 잘했다고 하고는, 스승은 그 한마디도 안 한다며 덜 배운 제자의 말이지만 진짜라고 했다.',
          "I asked for just one word now that I'd landed it. Well done, Taeo said — his teacher wouldn't even say that much; it was a half-taught apprentice talking, but it was real."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M6-03 「등대」 — 받는 자리(석대양) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_03_offer', questId: 'M6-03', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '올라왔나. 바람 센 날엔 계단이 길지.', "Made it up, did you? The stairs are long on a windy day.", { act: 'look_up' }),
        line(P, '네. 등대에 사람이 계실 줄은 몰랐어요.', "Yes. I didn't expect anyone to be up here."),
        line(D, '기상 적는 사람은 있어야지. 풍속, 파고, 시정. 하루 몇 번씩 손으로 적네.', "Someone has to write down the weather. Wind speed, wave height, visibility. By hand, several times a day."),
        line(P, '저는 등대 아래에서 부시리를 좀 노려 보려고요.', "I'm hoping to try for amberjack below the lighthouse."),
        line(D, '부시리면 아래 바위가 좋지. 그 전에 방명록에 이름이나 하나 적고 가게.', "For amberjack, the rocks below are good. Before that, write your name in the visitors' book."),
        line('', '(방명록에 이름을 적자, 노인이 그 이름을 한참 들여다본다.)', '(When I write my name in the book, the old man studies it for a long time.)'),
        line(D, '…{player} 씨라.', '...{player}, is it.', { act: 'peer' }),
        line(D, '그 눈매를 어디서 봤나 했더니.', "I was wondering where I'd seen those eyes."),
        line(P, '네?', 'Sorry?'),
        line(D, '혹시, 고진태 선장 자식인가?', "Are you, by any chance, Captain Go Jintae's child?"),
      ], {
        choices: [
          opt('yes_father', '네. 고진태 선장이 제 아버지입니다', 'Yes. Captain Go Jintae is my father', {
            next: 'yes' }),
          opt('ask_how', '제 아버지를 어떻게 아세요?', 'How do you know my father?', {
            next: 'how' }),
          opt('not_ready', '…아버지 이야기는 아직 들을 준비가 안 됐어요', "...I'm not ready to hear about my father yet", {
            next: 'not_ready' }),
        ],
        note: ['울릉도 등대에서 기상을 손으로 적는 등대지기 석대양 씨를 만났다. 방명록에 적은 내 이름을 한참 들여다보더니, 아버지 이름을 대며 고진태 선장의 자식이냐고 물었다.',
          "At the Ulleungdo lighthouse I met Seok Daeyang, the keeper who writes the weather by hand. He studied the name I wrote in the visitors' book, then asked if I was Captain Go Jintae's child — my father's name."],
      }),
      yes: scene([
        line(D, '…그렇군.', "...I see."),
        act(D, 'silence'),
        line(D, '앉게. 얘기는 길어질 거야. 기상 적는 거 좀 도와주고, 얘기 좀 하세.', "Sit. This will be a long story. Help me with the weather, and we'll talk."),
        line(D, '먼저 풍속부터 적지. 바람이 어디서 오는지 알아야, 그 배 얘기도 할 수 있어.', "Wind speed first. You need to know where the wind comes from before I can tell you about that boat."),
      ], {
        choices: [
          opt('sit', '네. 기상부터 같이 적을게요', "All right. Let's do the weather together first", {
            end: endTalk({ accept: true, offer: 'yes_father' }),
            note: ['고진태 선장이 내 아버지라고 했다. 석대양 씨는 한참 나를 보다가, 얘기는 길어질 테니 기상부터 같이 적자고 했다.',
              "I said Captain Go Jintae was my father. Daeyang looked at me for a long time, then said it would be a long story — we'd write the weather together first."] }),
          opt('fish_first', '그 전에 등대 아래서 부시리부터 올리고 올게요', "Before that, I'll go land an amberjack below", {
            next: 'fish' }),
        ],
      }),
      how: scene([
        line(D, '알았다기보다 봤지. 등대지기는 배를 보는 사람이야.', "I didn't so much know him as see him. A lighthouse keeper is someone who watches boats.", { act: 'look_sea' }),
        line(D, '이 앞을 지나는 배는 다 봐. 그중에 오래 남는 배가 있어.', "I see every boat that passes. Some of them stay with you."),
        line(P, '…아버지 배가요?', "...My father's boat?"),
        line(D, '기상 적는 거 좀 도와주게. 다 적고 얘기하지. 서두르면 틀리게 말해.', "Help me with the weather. We'll talk once it's written. Rush it and I'll tell it wrong."),
      ], {
        choices: [
          opt('help', '그럼 기상부터 돕겠습니다', "Then I'll help with the weather first", {
            end: endTalk({ accept: true, offer: 'ask_how' }),
            note: ['아버지를 어떻게 아느냐고 물었다. 등대지기는 배를 보는 사람이고 그중에 오래 남는 배가 있다며, 기상을 다 적고 얘기하자고 했다.',
              "I asked how he knew my father. A keeper watches boats, Daeyang said, and some boats stay with you; we'd talk once the weather was written."] }),
          opt('fish_first', '부시리부터 올리고 올게요', "I'll land an amberjack first and come back", {
            next: 'fish' }),
        ],
      }),
      fish: scene([
        line(D, '…그것도 좋지. 고기 잡는 손이 기상도 잘 적어.', "...That's good too. Hands that catch fish write the weather well."),
        line(D, '등대 아래 바위, 물이 돌아 나가는 쪽에 서게. 부시리는 거기 붙어.', "On the rocks below, stand where the water turns and runs out. That's where amberjack hold."),
        line(P, '한 마리 올리고 올라오겠습니다.', "I'll land one and come back up."),
        line(D, '그때 기상 좀 도와주게. 얘기가 더 잘 들릴 거야.', "Then help me with the weather. You'll hear the story better then."),
      ], {
        end: endTalk({ accept: true, offer: 'fish_first' }),
        note: ['등대 아래에서 부시리부터 올리고 오겠다고 했다. 석대양 씨는 물이 돌아 나가는 쪽 바위에 서라며, 한 마리 올리고 오면 얘기가 더 잘 들릴 거라고 했다.',
          "I said I'd land an amberjack below the lighthouse first. Stand on the rocks where the water turns out, Daeyang said — I'd hear the story better after one."],
      }),
      not_ready: scene([
        line(D, '그럼 기상부터 적세. 준비는 손이 먼저 하는 거야.', "Then let's write the weather. Your hands get ready before you do."),
        line(P, '…연필이요?', '...A pencil?', { act: 'receive' }),
        line(D, '풍속, 파고, 시정. 세 칸이야. 다 적고 나서도 듣기 싫으면 안 해도 돼.', "Wind speed, wave height, visibility. Three boxes. If you still don't want to hear it after, you needn't."),
        line(D, '이 얘기는 도망가지 않네. 이십 년 넘게 기다린 얘기야.', "This story won't run away. It's waited over twenty years."),
      ], {
        end: endTalk({ accept: true, offer: 'not_ready' }),
        note: ['아버지 이야기는 아직 들을 준비가 안 됐다고 했다. 석대양 씨는 연필을 쥐여 주며 기상부터 적자고, 이십 년 넘게 기다린 얘기라 도망가지 않는다고 했다.',
          "I said I wasn't ready to hear about my father. Daeyang put a pencil in my hand and said we'd write the weather first — the story had waited over twenty years and wouldn't run away."],
      }),
    },
  },
  // M6-03 — 끝내는 자리
  {
    id: 'm6_03_done', questId: 'M6-03', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '다 적었군. 풍속, 파고, 시정.', "All written. Wind speed, wave height, visibility.", { act: 'peer' }),
        line(P, '부시리도 한 마리 올렸어요.', 'I landed an amberjack too.'),
        line(D, '봤네. 위에서.', 'I saw. From up here.'),
        act(D, 'silence'),
        line(D, '…22년 전 그 배, 여기 앞을 지났어. 내가 봤지.', "...Twenty-two years ago, that boat passed right in front of here. I saw it.", { act: 'look_sea' }),
        line(P, '…', '...'),
        act(D, 'give', { to: P, item: 'qr_headlamp_keeper' }),
        line(D, '이 랜턴은 등대 것이야. 자네 아버지도 이 빛을 봤을 거야.', "This lantern belongs to the lighthouse. Your father would have seen this light."),
        line(D, '봉투는 등대 일 도와준 몫이고. 받아 두게.', "And the envelope is for helping with the lighthouse work. Take it."),
      ], {
        choices: [
          opt('father', '아버지를 기억하시는 분을 처음 만났어요', "You're the first person I've met who remembers my father", {
            say: ['아버지를 기억하시는 분은… 처음 만났어요.', "You're the first person... I've met who remembers my father."],
            end: endTalk({ complete: 'father', lineKo: '…기억하지. 좋은 선장이었어.', lineEn: "...I remember. He was a good captain." }),
            note: ['아버지를 기억하는 사람을 처음 만났다고 했다. 석대양 씨는 기억한다고, 좋은 선장이었다고 했다.',
              "I said he was the first person I'd met who remembered my father. Daeyang said he remembered — a good captain."] }),
          opt('weather', '기상 적는 법을 배웠어요. 손으로 적는 이유도요', "I learned how to log the weather. And why by hand", {
            next: 'weather' }),
          opt('come_again', '다음에도 올라와서 기상 적는 걸 도울게요', "I'll come up again and help with the weather", {
            next: 'again' }),
        ],
        note: ['기상을 다 적고 부시리도 올렸다. 석대양 씨는 22년 전 그 배가 등대 앞을 지나는 걸 봤다며, 아버지도 봤을 등대 랜턴과 봉투를 건넸다.',
          "The weather was written and the amberjack landed. Daeyang said he'd seen that boat pass the lighthouse twenty-two years ago, and handed me the lighthouse lantern my father would have seen — and an envelope."],
      }),
      weather: scene([
        line(D, '기계는 고장 나. 손은 안 고장 나지.', "Machines break down. Hands don't."),
        line(D, '그리고 손으로 적으면 기억에 남아. 숫자를 적는 동안 그날 바다가 어땠는지가 같이 적히거든.', "And writing by hand, it stays with you. While you write the numbers, how the sea was that day gets written down too."),
      ], {
        end: endTalk({ complete: 'weather', lineKo: '자네 아버지 배가 지나간 날도 그렇게 남았어.', lineEn: "The day your father's boat passed stayed that way, too." }),
        note: ['기상 적는 법과 손으로 적는 이유를 배웠다고 했다. 손으로 적으면 그날 바다가 같이 적힌다며, 아버지 배가 지나간 날도 그렇게 남았다고 했다.',
          "I said I'd learned to log the weather, and why by hand. Writing by hand, the day's sea gets written too, Daeyang said — that's how the day my father's boat passed stayed with him."],
      }),
      again: scene([
        line(D, '…그래 주겠나.', "...Would you?"),
        line(D, '이 일은 혼자 하면 숫자만 남아. 둘이 하면 얘기가 남지.', "Done alone, this work leaves only numbers. Done by two, it leaves stories."),
        line(P, '네. 또 올게요.', "Yes. I'll come again."),
      ], {
        end: endTalk({ complete: 'come_again',
          lineKo: '올 때는 바람부터 보고 오게. 이 섬 날씨는 육지 예보를 안 따라. 자네가 본 바람이 맞으면, 그때 하나 더 얘기해 주지.',
          lineEn: "Check the wind before you come. This island's weather doesn't follow the mainland forecast. If the wind you read is right, I'll tell you one more story then." }),
        note: ['다음에도 올라와 기상 적는 걸 돕겠다고 했다. 석대양 씨는 혼자 하면 숫자만 남고 둘이 하면 얘기가 남는다며, 일지 맨 뒷장에 내 이름 칸을 하나 그렸다.',
          "I said I'd come up again to help with the weather. Alone it leaves numbers, together it leaves stories, Daeyang said — and drew a box for my name on the logbook's last page."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M6-04 「연안부두」 — 받는 자리(단철호) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_04_offer', questId: 'M6-04', at: 'offer', npcId: DAN, start: 'start',
    nodes: {
      start: scene([
        line(DAN, '인천 처음이죠? 낚싯대 메고 두리번거리는 거 보니까.', "First time in Incheon? I can tell from the rod on your back and the looking around.", { act: 'look_up' }),
        line(P, '티가 나요?', 'Is it that obvious?'),
        line(DAN, '나죠. 저는 단철호예요. 이 앞 회사 다녀요.', "It is. I'm Dan Cheol-ho. I work at an office just over there."),
        line(DAN, '여기 연안부두는요, 유통이 다예요.', "Here at Yeonan Pier, it's all about distribution."),
        line(P, '낚시는 어때요?', 'And the fishing?'),
        line(DAN, '가을 밤이면 우럭이요. 30 넘는 놈도 나와요.', "On autumn nights, black rockfish. Ones over thirty turn up too."),
        line(P, '30센티요?', 'Thirty centimetres?'),
        act(DAN, 'laugh'),
        line(DAN, '30 이상. 그 밑은 그냥 우럭이고, 그 위부터 인천 우럭이죠.', "Thirty and up. Below that it's just rockfish. Above it, it's Incheon rockfish."),
        line(DAN, '저는 퇴근길에 잠깐만 볼게요. 집에 가야 해서.', "I'll just watch for a bit on my way home. I've got to get back."),
        line(P, '(그러면서 넥타이부터 푸시네…)', "(And yet he's loosening his tie...)"),
      ], {
        choices: [
          opt('over_thirty', '야간 우럭, 30 넘는 걸로 올려 볼게요', "I'll try for a night rockfish over thirty", {
            say: ['그럼 야간 우럭, 30 넘는 걸로 한번 올려 볼게요.', "Then I'll try to bring up a night rockfish over thirty."],
            next: 'over' }),
          opt('ask_trade', '유통이 다라는 건 무슨 말씀이에요?', "What do you mean, it's all about distribution?", {
            next: 'trade' }),
          opt('tie_joke', '잠깐만 보신다면서 넥타이부터 푸시네요', "Just a bit, you say — but the tie's coming off", {
            next: 'tie' }),
        ],
        note: ['인천 연안부두에서 퇴근길의 단철호 씨를 만났다. 여기는 유통이 다라고 했고, 가을 밤에 우럭 30cm 이상을 올려 보라며 잠깐만 보겠다고 했다.',
          "At Incheon's Yeonan Pier I met Dan Cheol-ho on his way home from work. It's all about distribution here, he said — and told me to bring up a rockfish over thirty centimetres on an autumn night; he'd just watch for a bit."],
      }),
      over: scene([
        line(DAN, '좋아요. 우럭은 부두 안쪽 그늘에 붙어요. 밤엔 불빛 경계까지 나오고요.', "Good. Rockfish hold in the shade inside the pier. At night they come out to the edge of the lights."),
        line(P, '불빛 경계요.', 'The edge of the lights.'),
        line(DAN, '30 넘는 건 아무 데나 안 있어요. 오래 산 놈은 오래 산 자리에 있어요.', "The ones over thirty aren't just anywhere. The old ones stay in their old spots."),
        line(DAN, '저도 퇴근길엔 늘 같은 자리에 서요.', 'Same as me. On my way home, I always stand in the same spot.'),
      ], {
        end: endTalk({ accept: true, offer: 'over_thirty' }),
        note: ['30 넘는 우럭을 올려 보겠다고 했다. 단철호 씨는 넥타이를 느슨하게 풀며, 오래 산 놈은 오래 산 자리에 있다고 했다.',
          "I said I'd try for a rockfish over thirty. Loosening his tie, Cheol-ho said the old ones stay in their old spots."],
      }),
      trade: scene([
        line(DAN, '여기선 잡는 사람보다 옮기는 사람이 많아요.', "Here, there are more people moving fish than catching them."),
        line(DAN, '동해에서 잡은 게 서해 시장에서 팔리는 길이, 다 여길 지나요.', "Everything caught in the East Sea that gets sold in West Sea markets passes through here."),
        line(P, '그 길에서 제일 중요한 게 뭔데요?', "What matters most along that road?"),
        line(DAN, '원산지 표기요. 어디서 왔는지 틀리면, 아무리 좋은 고기도 거짓말이 돼요.', "Origin labelling. Get where it came from wrong and even the finest fish becomes a lie."),
      ], {
        choices: [
          opt('watch', '우럭 잡으면서 그것도 봐 둘게요', "I'll keep an eye on that while I fish", {
            end: endTalk({ accept: true, offer: 'ask_trade' }),
            note: ['유통이 다라는 게 무슨 말이냐고 물었다. 동해에서 잡은 게 서해 시장으로 가는 길이 다 여기를 지나고, 그 길에서 제일 중요한 게 원산지 표기라고 했다.',
              "I asked what he meant by distribution. Everything from the East Sea headed to West Sea markets passes through here, Cheol-ho said, and on that road origin labelling matters most."] }),
          opt('tide_doubt', '서해 밤바다는 처음이라 물때를 잘 몰라요', "I've never fished the West Sea at night. I don't know the tides", {
            next: 'tide' }),
        ],
      }),
      tide: scene([
        line(DAN, '서해는 물이 크게 들고 나요. 부두 안쪽은 그나마 덜하고요.', "The West Sea's tides come and go big. Inside the pier it's a bit gentler."),
        line(DAN, '들물 시작할 때 우럭이 움직여요. 그 전에 자리 잡고 기다려요.', "Rockfish start moving when the flood begins. Get set up before that and wait."),
        line(P, '모르는 게 많네요.', "There's a lot I don't know."),
        line(DAN, '물때 모르는 건 부끄러운 게 아니에요. 모르면서 아는 척하는 게 위험하죠.', "Not knowing the tides is nothing to be ashamed of. Pretending you do is what's dangerous."),
      ], {
        end: endTalk({ accept: true, offer: 'tide_doubt' }),
        note: ['서해 물때를 잘 모른다고 했다. 단철호 씨는 휴대폰으로 물때표를 띄워 보여 주며, 모르면서 아는 척하는 게 위험하다고 했다.',
          "I said I didn't know the West Sea tides. Cheol-ho pulled up a tide table on his phone and said pretending to know is the dangerous part."],
      }),
      tie: scene([
        act(DAN, 'laugh'),
        line(DAN, '…들켰네요. 원래 잠깐이 제일 길어요.', "...Caught me. 'Just a bit' is always the longest."),
        line(DAN, '집에 가면 할 일이 있고, 여기 오면 할 일이 없어요.', "At home there's always something to do. Here, there's nothing to do."),
        line(P, '그 차이가 좋으신 거군요.', "And you like that difference."),
        line(DAN, '그래서 잠깐이 길어져요. 그쪽도 곧 알게 될 거예요.', "So 'just a bit' gets longer. You'll see soon enough."),
      ], {
        end: endTalk({ accept: true, offer: 'tie_joke' }),
        note: ['잠깐만 본다면서 넥타이부터 푸느냐고 했다. 단철호 씨는 들켰다며 넥타이를 아예 빼서 주머니에 넣고는, 원래 잠깐이 제일 길다고 했다.',
          "I teased him for loosening his tie while saying 'just a bit'. Caught, Cheol-ho said, pulling it off and pocketing it — 'just a bit' is always the longest."],
      }),
    },
  },
  // M6-04 — 끝내는 자리
  {
    id: 'm6_04_done', questId: 'M6-04', at: 'complete', npcId: DAN, start: 'start',
    nodes: {
      start: scene([
        line(P, '단철호 씨, 30 넘었어요.', "Cheol-ho, this one's over thirty."),
        line(DAN, '어디… 30 넘었네.', "Let's see... Over thirty, all right.", { act: 'peer' }),
        line(DAN, '인천 열렸어요. 이제 이 부두는 그쪽 부두이기도 해요.', "Incheon's open to you now. This pier is yours too."),
        line(P, '벌써 시간이 이렇게 됐네요.', 'Look how late it is already.'),
        act(DAN, 'laugh'),
        line(DAN, '잠깐이 두 시간 됐네. 늘 그래요.', "'Just a bit' turned into two hours. Always does."),
      ], {
        choices: [
          opt('trade', '원산지 표기가 왜 중요한지 알겠어요', 'I see why origin labelling matters', {
            say: ['부두에서 상자 오가는 걸 보니까, 원산지 표기가 왜 중요한지 알겠어요.', 'Watching the crates come and go on the pier, I see why origin labelling matters.'],
            end: endTalk({ complete: 'trade',
              lineKo: '그걸 알면 인천 반은 안 거예요. 나머지 반은 사람이에요. 누가 얼음을 얼마나 넣고 옮겼는지는 표기에 안 나와요. 눈으로 배워야 해요.',
              lineEn: "Know that and you know half of Incheon. The other half is people. How much ice someone packed and how they moved it isn't on any label. You learn that by watching." }),
            note: ['원산지 표기가 왜 중요한지 알겠다고 했다. 단철호 씨는 그걸 알면 인천 반은 안 거라며, 나머지 반은 사람이라고 했다.',
              "I said I understood why origin labelling matters. Then I knew half of Incheon, Cheol-ho said — the other half is people."] }),
          opt('two_hours', '잠깐이 두 시간이었어요', "'Just a bit' was two hours", {
            next: 'hours' }),
          opt('follow_crate', '제가 위판에 낸 상자가 어디까지 가는지 보고 싶어요', 'I want to see where the crates I consign end up', {
            end: endTalk({ complete: 'follow_crate',
              lineKo: '보러 와요. 새벽 도매시장은 퇴근길이 아니라 출근길이지만요. 자기 이름 붙은 상자를 따라가 보는 사람은 드물어요. 한 번 보고 나면 원산지 표기를 대충 못 해요.',
              lineEn: "Come and see. Though the dawn wholesale market is on my way to work, not home. Few people follow a crate with their name on it. See it once and you'll never be careless with labels again." }),
            note: ['내가 위판에 낸 상자가 어디까지 가는지 보고 싶다고 했다. 단철호 씨는 명함 뒤에 시장 이름을 적어 주며, 한 번 보고 나면 원산지 표기를 대충 못 한다고 했다.',
              "I said I wanted to see where my consigned crates go. Cheol-ho wrote a market's name on the back of his card — see it once, he said, and you'll never be careless with labels."] }),
        ],
        note: ['연안부두에서 30cm 넘는 우럭을 올렸다. 인천이 열렸고, 단철호 씨는 잠깐이 두 시간이 됐다며 늘 그렇다고 웃었다.',
          "I landed a rockfish over thirty centimetres at Yeonan Pier. Incheon was open, and Cheol-ho laughed that 'just a bit' had become two hours, as always."],
      }),
      hours: scene([
        line(DAN, '짬낚시가 그래요. 짧게 하려고 시작해서 길게 끝나요.', "That's quick-session fishing. You start meaning to keep it short and it ends up long."),
        line(DAN, '그래도 내일 출근은 해야 하니까, 두 시간에서 딱 끊는 거예요.', "But I've got work tomorrow, so I cut it off at exactly two hours."),
      ], {
        end: endTalk({ complete: 'two_hours',
          lineKo: '끊을 줄 아는 게 짬낚시 실력이에요. 다음 퇴근길에도 와요.',
          lineEn: "Knowing when to stop is the real skill in quick sessions. Come again on my way home next time." }),
        note: ['잠깐이 두 시간이었다고 했다. 단철호 씨는 두 시간에서 딱 끊을 줄 아는 게 짬낚시 실력이라며, 다음 퇴근길에도 오라고 했다.',
          "I said 'just a bit' had been two hours. Knowing to stop at two is the real skill, Cheol-ho said, and invited me along on his way home next time."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M6-05 「병실」 — 받는 자리(정옥선) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_05_offer', questId: 'M6-05', at: 'offer', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(OK, '…왔구나.', "...You came.", { act: 'look_up' }),
        line(P, '정옥선 씨. 좀 어떠세요?', 'Okseon. How are you feeling?'),
        line(OK, '앉아. 서 있으면 내가 더 피곤하다.', 'Sit. Watching you stand tires me out more.'),
        line(P, '(손등에 꽂힌 바늘이 먼저 눈에 들어왔다.)', '(The needle in the back of her hand is the first thing I see.)'),
        line(OK, '병원비가 하루하루 붙는다. 보호자 서명이니 약 시간이니, 귀찮은 것도 많고.', "The bills pile up day by day. Guardian signatures, medicine times — a lot of nuisance."),
        line(P, '제가 뭘 하면 될까요?', 'What can I do?'),
        line(OK, '좌판 얼음. 세 번만 날라 줘. 그거면 오늘 병원비는 된다.', "The stall's ice. Haul it three times for me. That covers today's bill."),
        line(OK, '그리고… 베개 밑에 있다.', 'And... it\'s under the pillow.'),
        line(P, '네?', 'Sorry?'),
        line(OK, '조행록. 마지막 권. 네 아버지 거야.', "The fishing log. The last volume. Your father's."),
        act(OK, 'silence'),
        line(OK, '나머지는 네가 써.', 'You write the rest.'),
      ], {
        choices: [
          opt('body_first', '먼저 몸부터 챙기세요. 조행록은 그다음에 받을게요', 'Look after yourself first. The log can wait', {
            say: ['먼저 몸부터 챙기세요. 조행록은 그다음에 받을게요.', "Look after yourself first. I'll take the log after that."],
            next: 'body' }),
          opt('ask_journal', '이게 왜 정옥선 씨한테 있었어요?', 'Why did you have it, Okseon?', {
            next: 'why' }),
          opt('hesitant', '…제가 써도 될까요. 아버지 글씨 뒤에요', "...Should I be the one writing? After my father's hand", {
            next: 'hesitant' }),
        ],
        note: ['병실에 누운 정옥선 씨를 찾아가자, 병원비가 날마다 붙으니 만복상회 얼음을 세 번 날라 달라고 했다. 그리고 베개 밑에 아버지의 조행록 마지막 권이 있으니, 나머지는 내가 쓰라고 했다.',
          "When I visited Okseon in her hospital bed, she asked me to haul ice for Manbok Store three times, since the bills grow daily. And under her pillow was the last volume of my father's fishing log — I was to write the rest."],
      }),
      body: scene([
        line(OK, '…몸은 의사가 챙긴다. 나는 이거 챙긴다.', "...The doctors look after the body. I look after this."),
        line(OK, '누워 있으니까 손이 할 일이 없어. 이거라도 넘겨야 손이 편하다.', "Lying here, my hands have nothing to do. Handing this over at least settles them."),
        line(P, '그래도 지금은…', 'Even so, right now...'),
        line(OK, '꺼낼 땐 네 손으로 꺼내라. 내 손은 지금 떨려서 못 꺼낸다.', "When you take it, take it out with your own hands. Mine shake too much right now."),
      ], {
        choices: [
          opt('later', '얼음부터 나르고 와서 꺼낼게요', "I'll haul the ice first, then come take it", {
            end: endTalk({ accept: true, offer: 'body_first', lineKo: '그래라. 베개 밑은 아무도 안 뒤진다.', lineEn: "Do that. Nobody goes digging under a pillow." }),
            note: ['몸부터 챙기라고 했다. 정옥선 씨는 몸은 의사가 챙긴다며 꺼낼 때는 내 손으로 꺼내라고 했고, 나는 얼음부터 나르고 와서 받기로 했다.',
              "I told her to look after herself first. The doctors handle that, Okseon said — and I was to take it out with my own hands; I'd haul the ice first, then come for it."] }),
          opt('cut_trips', '병원비랑 간병은 제가 맡을게요. 출조는 줄이고요', "I'll handle the bills and the caring. I'll cut back on trips", {
            say: ['병원비랑 간병은 제가 맡을게요. 출조는 줄이고요.', "I'll take care of the bills and the caring. I'll cut back on fishing trips."],
            next: 'cut' }),
        ],
      }),
      cut: scene([
        line(OK, '줄이지 마. 출조 줄이는 놈이 병원비를 어떻게 대.', "Don't cut back. How would someone who cuts back on trips pay hospital bills?"),
        act(OK, 'silence'),
        line(OK, '약 시간만 지켜 주면 된다. 나머지는 간호사가 한다.', "Just keep to the medicine times. The nurses do the rest."),
        line(P, '…알겠어요.', '...All right.'),
        line(OK, '얼음이나 날라. 그게 네 간병이다.', "Just haul the ice. That's your caring."),
      ], {
        end: endTalk({ accept: true, offer: 'cut_trips' }),
        note: ['병원비와 간병은 내가 맡고 출조는 줄이겠다고 했다. 정옥선 씨는 그 말에 눈을 한 번 감고는, 줄이지 말고 약 시간만 지키고 얼음이나 나르라고 했다.',
          "I said I'd handle the bills and the caring and cut back on trips. Okseon closed her eyes once at that, then said not to — just keep to the medicine times and haul the ice."],
      }),
      why: scene([
        line(OK, '…그 얘긴 길다. 지금 하면 숨이 차.', "...That's a long story. Telling it now would leave me breathless."),
        act(OK, 'silence'),
        line(OK, '네가 이걸 거의 다 채울 때쯤 말해 주마. 그 전에는 묻지 마라.', "I'll tell you when you've nearly filled it. Don't ask before then."),
        line(P, '…네.', '...All right.'),
        line(OK, '네 아버지 거니까 네가 갖는 게 맞다. 그것만 알면 된다.', "It was your father's, so it's right that you have it. That's all you need to know."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_journal' }),
        note: ['조행록이 왜 정옥선 씨에게 있었느냐고 물었다. 그 얘기는 길다며, 내가 거의 다 채울 때쯤 말해 줄 테니 그 전에는 묻지 말라고 했다.',
          "I asked why Okseon had the log. That was a long story, she said — she'd tell me when I'd nearly filled it, and until then I wasn't to ask."],
      }),
      hesitant: scene([
        line(OK, '되니까 주는 거다. 글씨는 달라도 된다. 바다를 보는 눈만 같으면 돼.', "I'm giving it because you should. The handwriting can be different. As long as the eye for the sea is the same."),
        line(OK, '잘 쓰려고 하지 마라. 본 대로 적어.', "Don't try to write it well. Write what you see."),
        line(P, '본 대로요.', 'What I see.'),
        line(OK, '명태 얘기 받아 적던 때처럼. 그때 네 글씨, 나는 봤다.', "Like when you took down the pollock stories. I saw your handwriting then."),
      ], {
        end: endTalk({ accept: true, offer: 'hesitant' }),
        note: ['아버지 글씨 뒤에 내가 써도 되느냐고 물었다. 정옥선 씨는 글씨는 달라도 바다를 보는 눈만 같으면 된다며, 잘 쓰려 하지 말고 본 대로 적으라고 했다.',
          "I asked whether I should be writing after my father's hand. The handwriting can differ, Okseon said, as long as the eye for the sea is the same — don't write it well, write what I see."],
      }),
    },
  },
  // M6-05 — 끝내는 자리
  {
    id: 'm6_05_done', questId: 'M6-05', at: 'complete', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(P, '얼음 세 번 다 날랐어요. 조행록도… 받았어요.', "I've hauled the ice three times. And the log... I have it."),
        line(OK, '받았지.', 'You have it.'),
        line(OK, '이제 네 거다.', "It's yours now."),
        line(P, '…', '...'),
        line(OK, '나는 좀 자야겠다.', 'I need to sleep a while.'),
        line(OK, '얼음은… 앞으로도 네가 날라.', 'The ice... keep hauling it for me.'),
      ], {
        choices: [
          opt('promise', '나머지는 제가 쓸게요. 마지막 장까지', "I'll write the rest. To the last page", {
            say: ['나머지는 제가 쓸게요. 마지막 장까지요.', "I'll write the rest. All the way to the last page."],
            next: 'promise' }),
          opt('cry', '(아무 말도 하지 못한다)', '(Unable to say anything)', {
            next: 'cry' }),
          opt('stay_till_sleep', '주무실 때까지 옆에 있을게요', "I'll stay beside you until you fall asleep", {
            say: ['주무실 때까지 옆에 있을게요. 얼음은 그다음에 나를게요.', "I'll stay beside you until you fall asleep. I'll haul the ice after that."],
            next: 'stay' }),
        ],
        note: ['얼음을 세 번 나르고 아버지의 조행록 마지막 권을 받았다. 정옥선 씨는 이제 네 거라고 하고는, 좀 자야겠다고 했다.',
          "I hauled the ice three times and took the last volume of my father's log. It's yours now, Okseon said, and that she needed to sleep."],
      }),
      promise: scene([
        line(OK, '…그래.', '...Good.'),
        act(OK, 'silence'),
        line('', '(잠든 줄 알았는데, 입술이 조금 움직인다.)', "(I think she's asleep, but her lips move a little.)"),
      ], {
        end: endTalk({ complete: 'promise',
          lineKo: '마지막 장까지면 오래 걸린다. 서두르지 마라. 대신 하루도 비우지 말고.',
          lineEn: "To the last page will take a long time. Don't rush. But don't leave a single day blank." }),
        note: ['마지막 장까지 내가 쓰겠다고 했다. 정옥선 씨는 편한 얼굴로 눈을 감았다가, 서두르지 말되 하루도 비우지 말라고 했다.',
          "I promised to write it to the last page. Okseon closed her eyes, her face at ease, then said not to rush — but not to leave a single day blank."],
      }),
      cry: scene([
        line(OK, '울 거면… 얼음부터 나르고 울어.', "If you're going to cry... haul the ice first, then cry."),
        act(OK, 'laugh'),
        line(OK, '가 봐. 나 좀 자게.', 'Go on. Let me sleep.'),
      ], {
        end: endTalk({ complete: 'cry',
          lineKo: '얼음 다 나르고 와서, 울든 웃든 해라.',
          lineEn: "Haul all the ice, then come back and cry or laugh, whichever." }),
        note: ['아무 말도 하지 못했다. 정옥선 씨는 울 거면 얼음부터 나르고 울라며 병실에서 웃었는데, 웃음은 금방 기침이 됐다.',
          "I couldn't say anything. If I was going to cry, Okseon said, haul the ice first — and she laughed, there in the ward, until the laugh turned to coughing."],
      }),
      stay: scene([
        line(OK, '…애도 아니고.', "...I'm not a child.", { act: 'look_away' }),
        line('', '(그래도 정옥선 씨는 손을 이불 밖으로 내놓는다.)', '(Even so, Okseon slips her hand out from under the blanket.)'),
      ], {
        end: endTalk({ complete: 'stay_till_sleep',
          lineKo: '잠들면 바로 가. 얼음은 아침이 제일 바쁘다. 좌판 비우면 손님들이 내 걱정부터 해. 그게 싫다.',
          lineEn: "Go as soon as I'm asleep. Mornings are busiest for ice. If the stall's empty, the customers start worrying about me. I hate that." }),
        note: ['잠들 때까지 옆에 있겠다고 했다. 정옥선 씨는 애도 아니라면서도 잡으라는 듯 손을 이불 밖으로 내놓았다.',
          "I said I'd stay until she fell asleep. I'm not a child, Okseon said — yet she slipped her hand out from under the blanket for me to hold."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M6-06 「좌판을 맡다」 — 받는 자리(정옥선) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_06_offer', questId: 'M6-06', at: 'offer', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(OK, '왔냐. 좌판은 어떻게 됐는지 아냐.', "You're here. Do you know what's become of the stall?"),
        line(P, '셔터가 내려져 있었어요. 지나가는 분들이 다 쳐다보시더라고요.', 'The shutter was down. Everyone walking past was looking at it.'),
        line(OK, '그래서 부른 거다. 좌판, 네가 봐.', "That's why I called you. You mind the stall."),
        line(P, '제가요?', 'Me?'),
        line(OK, '사흘만. 재고랑 손님이랑 가격.', 'Just three days. The stock, the customers, the prices.'),
        line(P, '팔 물건은요?', 'What do I sell?'),
        line(OK, '빈 좌판엔 손님이 안 선다. 위판에서 세 건은 받아 놔.', "Nobody stops at an empty stall. Get three lots from the auction."),
        line(P, '값은… 틀리면 어떡하죠.', "And the prices... what if I get them wrong?"),
        line(OK, '틀리면 손님이 고쳐 준다. 그 동네 손님들이 그렇다.', "If you're wrong, the customers will correct you. That's what they're like around there."),
      ], {
        choices: [
          opt('keep_place', '사흘 동안 정옥선 씨 자리, 지킬게요', "I'll keep your place for three days, Okseon", {
            say: ['사흘 동안 정옥선 씨 자리, 제가 지킬게요.', "For three days, I'll keep your place, Okseon."],
            next: 'place' }),
          opt('ask_price', '값은 어떻게 매겨요? 정옥선 씨처럼 눈으로요?', 'How do I set prices? By eye, like you?', {
            next: 'price' }),
          opt('ask_customers', '손님들이 어디 가셨냐고 물으면 뭐라고 해요?', 'If customers ask where you went, what do I say?', {
            say: ['손님들이 정옥선 씨 어디 가셨냐고 물으면, 뭐라고 해요?', 'If the customers ask where you went, Okseon, what do I tell them?'],
            next: 'customers' }),
        ],
        note: ['정옥선 씨가 병상에서 만복상회 좌판을 사흘만 봐 달라고 했다. 위판에서 세 건을 받아 놓고 재고와 손님과 가격을 보라며, 값이 틀리면 손님이 고쳐 줄 거라고 했다.',
          "From her hospital bed, Okseon asked me to mind Manbok Store's stall for three days. Get three lots from the auction, watch the stock, customers and prices — and if I got a price wrong, the customers would correct me."],
      }),
      place: scene([
        line(OK, '내 자리 말고 좌판 자리야.', "Not my place. The stall's place."),
        line(OK, '사람은 바뀌어도 좌판은 그 자리에 있어야 손님이 온다. 열쇠는 머리맡 서랍에 있다.', "People change, but the stall has to stay where it is for customers to come. The keys are in the bedside drawer."),
        line(P, '네.', 'Right.'),
        line(OK, '얼음은 아침에 먼저 깔고, 물건은 그다음. 순서 바꾸면 하루 장사 끝이다.', "Ice goes down first thing in the morning, goods after. Switch the order and the day's trade is done."),
      ], {
        end: endTalk({ accept: true, offer: 'keep_place', lineKo: '그건 네가 제일 잘 알지.', lineEn: "You know that better than anyone." }),
        note: ['사흘 동안 정옥선 씨 자리를 지키겠다고 했다. 내 자리 말고 좌판 자리라며, 얼음을 먼저 깔고 물건은 그다음이라고 했다.',
          "I said I'd keep Okseon's place for three days. Not hers — the stall's place, she said: ice down first, goods after."],
      }),
      price: scene([
        line(OK, '눈이 아니라 아침 경매가 기준이다.', "Not by eye. The morning auction is the standard."),
        line(OK, '위판장 시세 보고, 얼음값 더하고, 손님 얼굴 봐.', "Check the auction price, add the ice, look at the customer's face."),
        line(P, '손님 얼굴이요?', "The customer's face?"),
        line(OK, '그게 제일 어렵다. 단골한테는 덤을 주고, 처음 온 손님한테는 설명을 줘라. 값은 같게.', "That's the hardest part. Give regulars a little extra, give first-timers an explanation. Same price for both."),
      ], {
        choices: [
          opt('same', '값은 같게. 명심할게요', "Same price. I'll remember", {
            end: endTalk({ accept: true, offer: 'ask_price', lineKo: '그게 내 좌판 값이다.', lineEn: "That's my stall's price." }),
            note: ['값은 어떻게 매기느냐고 물었다. 아침 경매가 기준이고, 단골에게는 덤을, 처음 온 손님에게는 설명을 주되 값은 같게 하라고 했다.',
              "I asked how to set prices. The morning auction is the standard, Okseon said — extra for regulars, explanations for newcomers, but the same price."] }),
          opt('sell_better', '사흘이면 정옥선 씨보다 장사 잘할지도 몰라요', 'In three days I might outsell you', {
            next: 'better' }),
        ],
      }),
      better: scene([
        line(OK, '…말은.', '...Big talk.'),
        act(OK, 'laugh'),
        line(OK, '해 봐라. 나보다 잘하면 좌판 넘겨주고 나는 놀러 간다.', "Go on, then. If you do better than me, I'll hand over the stall and go off on holiday."),
        line(P, '그럼 열심히 해야겠네요.', "Then I'd better work hard."),
        line(OK, '하나만 알아 둬. 많이 판 날보다 덜 남긴 날이 좌판한테 좋은 날일 때가 있다.', "Know one thing. Sometimes the day you made less is a better day for the stall than the day you sold the most."),
      ], {
        end: endTalk({ accept: true, offer: 'sell_better', lineKo: '무슨 말인지는 사흘 지나면 알 거다.', lineEn: "You'll know what I mean after three days." }),
        note: ['사흘이면 정옥선 씨보다 장사를 잘할지도 모른다고 했다. 코웃음을 치면서도 눈은 웃던 정옥선 씨는, 많이 판 날보다 덜 남긴 날이 좋은 날일 때가 있다고 했다.',
          "I said I might outsell her in three days. Okseon snorted, eyes smiling, and said sometimes the day you make less is the better day."],
      }),
      customers: scene([
        line(OK, '좀 쉰다고 해. 병원 얘기는 하지 마.', "Say I'm taking a rest. Don't mention the hospital."),
        line(OK, '그 소리 들으면 다들 물건 대신 걱정을 사 간다.', "If they hear that, they'll all buy worry instead of fish."),
        line(P, '끝까지 물으시면요?', 'And if they keep asking?'),
        act(OK, 'silence'),
        line(OK, '…곧 나온다고 해라. 거짓말 아니다. 나는 나갈 거니까.', "...Tell them I'll be out soon. It isn't a lie. I am getting out."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_customers' }),
        note: ['손님들이 정옥선 씨를 찾으면 뭐라고 하느냐고 물었다. 좀 쉰다고만 하고 병원 얘기는 하지 말라며, 끝까지 물으면 곧 나온다고 하라고, 그건 거짓말이 아니라고 했다.',
          "I asked what to tell customers who asked after her. Say she's resting, no hospital talk — and if they kept asking, say she'd be out soon, which wasn't a lie."],
      }),
    },
  },
  // M6-06 — 끝내는 자리
  {
    id: 'm6_06_done', questId: 'M6-06', at: 'complete', npcId: OK, start: 'start',
    nodes: {
      start: scene([
        line(P, '사흘, 다 봤어요.', "I've done the three days."),
        line(OK, '사흘. 봤지. 좌판이 뭔지.', "Three days. Now you've seen. What a stall is."),
        line(P, '생각보다 앉아 있을 틈이 없었어요.', "I hardly had a moment to sit down."),
        line(OK, '그렇지.', "That's right."),
        line(OK, '이제 얼음 나르는 게 왜 먼저였는지 알겠지.', "Now you know why hauling ice came first."),
      ], {
        choices: [
          opt('understood', '얼음이 왜 먼저였는지 이제 알아요', 'Now I know why the ice came first', {
            next: 'understood' }),
          opt('wrong_price', '둘째 날 값을 잘못 불렀어요. 손님이 가르쳐 줬고요', 'I got a price wrong on day two. A customer put me right', {
            say: ['둘째 날 값을 잘못 불렀어요. 손님이 가르쳐 주셨고요.', 'On the second day I quoted the wrong price. A customer set me straight.'],
            next: 'wrong' }),
          opt('regulars', '손님들이 정옥선 씨 안부부터 물었어요. 다들 기다려요', 'The customers asked after you first. They\'re all waiting', {
            say: ['손님들이 다들 정옥선 씨 안부부터 물었어요. 다들 기다려요.', "Every customer asked after you first, Okseon. They're all waiting for you."],
            next: 'regulars' }),
        ],
        note: ['만복상회 좌판을 사흘 동안 보고 정옥선 씨에게 갔다. 이제 얼음 나르는 게 왜 먼저였는지 알겠느냐고 물었다.',
          "After minding Manbok Store's stall for three days, I went to see Okseon. Did I know now, she asked, why hauling ice came first?"],
      }),
      understood: scene([
        line(OK, '…늦게 알았네.', '...Took you long enough.'),
        act(OK, 'laugh'),
        line(OK, '얼음이 없으면 좌판은 하루도 못 간다. 사람도 그렇다.', "Without ice, a stall doesn't last a day. People are the same."),
      ], {
        end: endTalk({ complete: 'understood',
          lineKo: '남이 안 보는 일을 먼저 하는 놈이 자리를 지키지.',
          lineEn: "The one who does the work nobody sees, first — that's who keeps their place." }),
        note: ['얼음이 왜 먼저였는지 이제 안다고 했다. 정옥선 씨는 늦게 알았다며 웃고는, 남이 안 보는 일을 먼저 하는 사람이 자리를 지킨다고 했다.',
          "I said I knew now why the ice came first. Took me long enough, Okseon laughed — the one who does the unseen work first keeps their place."],
      }),
      wrong: scene([
        line(OK, '그 손님이 누군지 알지. 삼십 년 단골이다.', "I know who that was. A regular of thirty years."),
        line(OK, '그 양반은 틀린 값을 그냥 넘어가는 법이 없다. 나한테도 그랬어.', "That one never lets a wrong price slide. Did the same to me."),
      ], {
        end: endTalk({ complete: 'wrong_price',
          lineKo: '고쳐 주는 손님이 남은 좌판이 오래간다. 다음엔 네가 먼저 인사해라.',
          lineEn: "A stall that keeps customers who correct you lasts a long time. Next time, you greet them first." }),
        note: ['둘째 날 값을 잘못 불렀다가 손님이 가르쳐 줬다고 했다. 정옥선 씨는 삼십 년 단골이라며, 고쳐 주는 손님이 남은 좌판이 오래간다고 했다.',
          "I admitted quoting a wrong price on day two and being corrected. A regular of thirty years, Okseon said — a stall with customers who correct you lasts."],
      }),
      regulars: scene([
        line(OK, '…그 사람들 다 시끄럽지.', "...They're a noisy lot.", { act: 'look_away' }),
        line(OK, '물건 사러 와서 남의 늙은이 걱정이나 하고. 그래서 그 좌판을 못 접는 거다.', "Coming to buy fish and fussing over some old woman instead. That's why I can't close that stall."),
      ], {
        end: endTalk({ complete: 'regulars',
          lineKo: '다음에 또 물으면 고맙다고 전해라. 내 대신 네가.',
          lineEn: "If they ask again, tell them thank you. For me." }),
        note: ['손님들이 정옥선 씨 안부부터 물었다고 전했다. 시끄러운 사람들이라며 이불 끝을 만지작거리다가, 다음에 또 물으면 자기 대신 고맙다고 전해 달라고 했다.',
          "I told Okseon the customers had asked after her first. A noisy lot, she said, fiddling with the edge of the blanket — then asked me to thank them for her next time."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M6-09 「고래마루의 마지막 손님」 — 받는 자리(고만석) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_09_offer', questId: 'M6-09', at: 'offer', npcId: GM, start: 'start',
    nodes: {
      start: scene([
        line(GM, '자네. 시간 좀 있나.', 'You. Got a minute?'),
        line(P, '네. 무슨 일 있으세요?', "Yes. Is something wrong?"),
        line(GM, '배 내놓는다.', "I'm selling the boat."),
        line(P, '…고래마루를요?', '...The Goraemaru?'),
        line(GM, '그래. 마지막 출항이야. 방어진으로 와.', "That's right. Her last trip. Come to Bangeojin."),
        line(P, '마지막이라니…', 'The last...'),
        line(GM, '손님으로 와. 일손 말고.', 'Come as a fare. Not as a deckhand.'),
        act(GM, 'silence'),
        line(GM, '처음 탔을 때, 어디 앉았는지 기억하냐.', 'The first time you came aboard — do you remember where you sat?'),
      ], {
        choices: [
          opt('remember_bow', '기억해요. 뱃머리였어요. 그날 멀미가 심했죠', 'I remember. The bow. I was badly seasick that day', {
            say: ['기억합니다. 뱃머리였어요. 그날 멀미가 심했죠.', 'I remember. It was the bow. I was terribly seasick that day.'],
            next: 'bow' }),
          opt('ask_why', '배를 왜 내놓으세요? 고래마루는 고만석 씨 배잖아요', "Why sell her? The Goraemaru is your boat, Manseok", {
            say: ['배를 왜 내놓으세요? 고래마루는 고만석 씨 배잖아요.', "Why sell her? The Goraemaru is your own boat, Manseok."],
            next: 'why' }),
          opt('just_fish', '손님으로 타면, 저는 낚시만 하면 돼요?', 'As a fare, do I just fish?', {
            say: ['손님으로 타면 저는 낚시만 하면 됩니까? 일손은 안 거들고요?', "If I ride as a fare, do I just fish? Not lend a hand?"],
            next: 'fish' }),
        ],
        note: ['고만석 씨가 고래마루를 내놓는다고 했다. 마지막 출항에 일손이 아니라 손님으로 방어진에 오라며, 처음 탔을 때 어디 앉았는지 기억하느냐고 물었다.',
          "Go Manseok told me he was selling the Goraemaru. He asked me to come to Bangeojin for her last trip — as a fare, not a deckhand — and asked if I remembered where I sat the first time."],
      }),
      bow: scene([
        line(GM, '…잊었을 줄 알았다.', "...I figured you'd forgotten."),
        line(GM, '토하면서도 수평선은 보더군.', 'Even throwing up, you kept your eyes on the horizon.', { act: 'look_away' }),
        line(P, '그것까지 기억하세요?', 'You remember that too?'),
        line(GM, '그 자리 비워 두마. 마지막 항차는 손님 자리부터 정하는 거다.', "I'll keep that seat free. On a last trip, you settle the fares' seats first."),
        line(GM, '키는 내가 안 잡는다. 해나가 잡는다.', "I won't be at the wheel. Haena will."),
      ], {
        end: endTalk({ accept: true, offer: 'remember_bow' }),
        note: ['처음 탔을 때 뱃머리였다고, 멀미가 심했다고 했다. 고만석 씨는 모자챙을 내려 쓰며 그 자리를 비워 두겠다고, 키는 고해나 씨가 잡는다고 했다.',
          "I said it had been the bow, and that I'd been badly seasick. Pulling his cap brim down, Manseok said he'd keep that seat free, and Haena would take the wheel."],
      }),
      why: scene([
        line(GM, '내 배니까 내가 내놓는 거다. 남의 배면 못 내놓지.', "It's my boat, so I'm the one selling her. If she were someone else's, I couldn't."),
        line(GM, '이유는 묻지 마라. 바다에 오래 있으면, 그만둘 날도 바다가 알려 준다.', "Don't ask why. Stay at sea long enough and the sea tells you when to stop, too."),
        line(P, '…그날이 온 거군요.', '...And that day has come.'),
        line(GM, '그래. 손님으로 와. 그거면 된다.', "Yes. Come as a fare. That's all."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_why' }),
        note: ['배를 왜 내놓느냐고 물었다. 고만석 씨는 갑판 난간을 손바닥으로 한 번 치고는, 이유는 묻지 말라며 그만둘 날도 바다가 알려 준다고 했다.',
          "I asked why he was selling. Manseok slapped the rail once and said not to ask why — the sea tells you when to stop, too."],
      }),
      fish: scene([
        act(GM, 'laugh'),
        line(GM, '손님이 왜 일을 해. 앉아서 낚고, 먹고, 바다나 봐.', "Why would a fare work? Sit, fish, eat, look at the sea."),
        line(GM, '듣자 하니 자네도 이제 손님 태운다더군.', "I hear you take fares yourself now."),
        line(P, '네. 제주에서 해양관광업 등록했어요.', 'Yes. I registered for marine tourism in Jeju.'),
        line(GM, '그러니까 더 손님으로 와. 남의 배에서 손님 노릇 하는 법을 잊으면, 제 손님도 못 본다.', "All the more reason to come as a fare. Forget how to be a fare on someone else's boat and you can't look after your own."),
      ], {
        choices: [
          opt('as_fare', '그럼 손님으로만 갈게요', "Then I'll come purely as a fare", {
            end: endTalk({ accept: true, offer: 'just_fish' }),
            note: ['손님이면 낚시만 하면 되느냐고 물었다. 고만석 씨는 손님이 왜 일을 하냐며, 남의 배에서 손님 노릇 하는 법을 잊으면 제 손님도 못 본다고 했다.',
              "I asked if, as a fare, I'd just fish. Why would a fare work, Manseok said — forget how to be a fare on another's boat and you can't look after your own."] }),
          opt('no_seasick', '마지막이니까 멀미는 안 할게요. 약속은 못 하지만요', "It's the last trip, so no seasickness. I can't promise, though", {
            say: ['마지막이니까 이번엔 멀미 안 하겠습니다. 약속은 못 하지만요.', "It's the last trip, so I won't get seasick this time. Can't promise, though."],
            next: 'seasick' }),
        ],
      }),
      seasick: scene([
        act(GM, 'laugh'),
        line(GM, '약은 배에 있다. 마지막이라고 바다가 봐주진 않아.', "There are pills on board. The sea won't go easy just because it's the last trip."),
        line(GM, '토해도 뱃머리에서 토해. 그 자리는 그러라고 있는 거다.', "If you throw up, do it at the bow. That's what that seat is for."),
        line(P, '…네.', '...Right.'),
        line(GM, '처음 탄 날처럼 오면 돼. 그래야 끝이 처음하고 맞는다.', "Just come like you did the first day. That way the end matches the beginning."),
      ], {
        end: endTalk({ accept: true, offer: 'no_seasick' }),
        note: ['마지막이니 멀미는 안 하겠다고, 약속은 못 한다고 했다. 고만석 씨는 코로 짧게 웃으며, 처음 탄 날처럼 오면 끝이 처음하고 맞는다고 했다.',
          "I said I wouldn't get seasick on the last trip, though I couldn't promise. Manseok snorted a laugh: come like the first day, and the end will match the beginning."],
      }),
    },
  },
  // M6-09 — 끝내는 자리
  {
    id: 'm6_09_done', questId: 'M6-09', at: 'complete', npcId: GM, start: 'start',
    nodes: {
      start: scene([
        line(GM, '…끝났다.', "...That's it, then."),
        line(P, '…', '...'),
        line(GM, '고래마루. 해나가 몰았지.', 'The Goraemaru. Haena took her out.', { act: 'look_sea' }),
        line(GM, '나는 손님이었고. 자네도.', 'And I was a fare. So were you.'),
        line(P, '갑판에 앉아 계시는 거, 처음 봤어요.', "It was the first time I've seen you sitting on deck."),
        line(GM, '나도 처음이다.', 'First time for me too.'),
      ], {
        choices: [
          opt('bow', '뱃머리에 앉았어요. 처음처럼요', 'I sat at the bow. Like the first time', {
            say: ['뱃머리에 앉았어요. 처음 탔을 때처럼요.', 'I sat at the bow. Just like the first time.'],
            next: 'bow' }),
          opt('haena', '고해나 씨 키가 고만석 씨보다 부드러웠어요', "Haena's steering was smoother than yours, Manseok", {
            say: ['고해나 씨 키가 고만석 씨보다 부드러웠어요.', "Haena's steering was smoother than yours, Manseok."],
            next: 'haena' }),
          opt('no_record', '조황은 적지 않았어요. 오늘은 그게 맞는 것 같았어요', "I didn't log the catch. It felt right today", {
            say: ['조황은 적지 않았습니다. 오늘은 그게 맞는 것 같았어요.', "I didn't log the catch. Today, that felt right."],
            next: 'no_record' }),
        ],
        note: ['고래마루의 마지막 항차가 끝났다. 고해나 씨가 키를 잡는 동안 고만석 씨는 갑판에 앉아 손님처럼 바다를 봤는데, 자기도 처음이라고 했다.',
          "The Goraemaru's last trip was over. Haena had the wheel, and Manseok sat on deck watching the sea like a fare — a first for him too, he said."],
      }),
      bow: scene([
        line(GM, '…기억하네.', '...You remembered.'),
        line(GM, '뱃머리는 바다를 제일 먼저 맞는 자리다. 처음 탄 놈을 거기 앉히는 건 그래서야.', "The bow is the seat that meets the sea first. That's why first-timers get put there."),
      ], {
        end: endTalk({ complete: 'bow', lineKo: '마지막 항차에도 거기 앉는 놈은 처음 봤다.', lineEn: "Never seen anyone sit there on the last trip too." }),
        note: ['처음처럼 뱃머리에 앉았다고 했다. 고만석 씨는 뱃머리는 바다를 제일 먼저 맞는 자리라며, 마지막 항차에도 거기 앉는 사람은 처음 봤다고 했다.',
          "I said I'd sat at the bow, like the first time. The bow meets the sea first, Manseok said — he'd never seen anyone sit there on a last trip too."],
      }),
      haena: scene([
        line(GM, '…그건 인정 못 하지.', "...I can't admit that."),
        act(GM, 'silence'),
        line(GM, '아니, 인정한다.', 'No — I admit it.'),
        line(GM, '그 애는 파도를 이기려고 안 해. 나는 평생 이기려고 했지.', "She doesn't try to beat the waves. I tried to beat them all my life."),
      ], {
        end: endTalk({ complete: 'haena',
          lineKo: '그래서 그 애 키가 부드러운 거다. 마지막 키를 그 애한테 맡기길 잘했어.',
          lineEn: "That's why her steering is smoother. I did right giving her the wheel for the last trip." }),
        note: ['고해나 씨 키가 더 부드러웠다고 했다. 고만석 씨는 인정 못 한다고 했다가 곧 인정했고, 조타실에서 고해나 씨가 그 말을 들었다.',
          "I said Haena's steering had been smoother. Manseok said he couldn't admit it — then admitted it, and Haena heard him from the wheelhouse."],
      }),
      no_record: scene([
        line(GM, '…잘했다.', '...Good.'),
        line(GM, '마지막 항차 조황은 적는 게 아니야. 적으면 숫자가 남고, 안 적으면 그날이 남지.', "You don't log the catch on a last trip. Log it and numbers stay. Don't, and the day stays."),
      ], {
        end: endTalk({ complete: 'no_record',
          lineKo: '이 배는 숫자로 기억되면 안 되는 배다. 자네는 그걸 알았네. 손님으로 와 줘서 고맙다.',
          lineEn: "This boat shouldn't be remembered in numbers. You understood that. Thanks for coming as a fare." }),
        note: ['조황은 적지 않았다고 했다. 고만석 씨는 조타실 쪽을 한 번 돌아보고, 적으면 숫자가 남고 안 적으면 그날이 남는다며 손님으로 와 줘서 고맙다고 했다.',
          "I said I hadn't logged the catch. Manseok glanced back at the wheelhouse: log it and numbers stay, don't and the day stays — and thanked me for coming as a fare."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M6-07 「항해 계획 승인」 — 받는 자리(어촌계) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_07_offer', questId: 'M6-07', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '독도 갈 생각이냐.', 'Thinking of going to Dokdo?'),
        line(P, '네. 언젠가는요.', 'Yes. Someday.'),
        line(C, '언젠가로는 못 간다. 원거리 항해 계획부터 내라.', "You can't get there on someday. Submit a long-range voyage plan first."),
        line(P, '계획서요?', 'A plan?'),
        line(C, '기상, 정비, 비상. 세 가지를 서류로.', "Weather, maintenance, contingency. All three, on paper."),
        line(P, '…서류가 꽤 많겠네요.', "...That's going to be a lot of paperwork."),
        line(C, '독도는 서류로 가는 바다다.', 'Dokdo is a sea you reach by paperwork.'),
        line(C, '비상 보급도 세 점 갖춰 놔. 뭘 넣을지는 네가 정해.', "And put together three items of emergency stores. What goes in is your call."),
      ], {
        choices: [
          opt('careful_paper', '서류부터 꼼꼼히 쓰겠습니다. 한 장도 대충 안 하겠습니다', "I'll do the paperwork carefully. Not one page half-done", {
            next: 'careful' }),
          opt('ask_paper_sea', '서류로 가는 바다라니요? 배로 가는 거 아닙니까?', "Reached by paperwork? Don't we go by boat?", {
            next: 'paper' }),
          opt('not_confident', '독도까지는 아직 자신이 없습니다. 그래서 더 꼼꼼히 쓰겠습니다', "I'm not confident about Dokdo yet. So I'll be extra careful", {
            next: 'not_sure' }),
        ],
        note: ['독도까지 가려면 원거리 항해 계획을 내라는 말을 들었다. 기상, 정비, 비상 세 가지를 서류로 쓰고 비상 보급 세 점도 갖추라며, 독도는 서류로 가는 바다라고 했다.',
          "To reach Dokdo, I was told, I'd need to submit a long-range voyage plan — weather, maintenance and contingency, on paper — and put together three items of emergency stores. Dokdo is a sea you reach by paperwork."],
      }),
      careful: scene([
        line(C, '그래야지. 바다에서는 대충 쓴 한 줄이 목숨을 가져간다.', "You'd better. At sea, one careless line can take a life."),
        line(C, '기상은 사흘 치를 봐라. 정비는 엔진만 보지 말고 펌프까지.', "Look at three days of weather. For maintenance, don't stop at the engine — check the pumps."),
        line(P, '비상계획은요?', 'And the contingency plan?'),
        line(C, '제일 나쁜 날을 생각하고 써. 좋은 날은 계획이 필요 없다.', "Write it thinking of the worst day. Good days don't need a plan."),
      ], {
        end: endTalk({ accept: true, offer: 'careful_paper' }),
        note: ['한 장도 대충 안 하겠다고 했다. 기상은 사흘 치, 정비는 펌프까지, 비상계획은 제일 나쁜 날을 생각하고 쓰라는 말을 들었다.',
          "I said I wouldn't leave a page half-done. Three days of weather, check the pumps, and write the contingency for the worst day, I was told."],
      }),
      paper: scene([
        line(C, '배로 가지. 서류가 통과해야 배가 뜬다.', "By boat, yes. The boat sails once the papers pass."),
        line(C, '독도는 멀다. 기름이 떨어져도, 날씨가 바뀌어도 쉽게 돌아올 데가 없어.', "Dokdo is far. Run low on fuel or have the weather turn, and there's nowhere easy to come back to."),
        line(P, '그래서 종이 위에서 먼저…', 'So on paper first...'),
        line(C, '한 번 다녀와야 한다. 종이에서 못 돌아오면 바다에서도 못 돌아와.', "You make the trip once. If you can't come back on paper, you won't come back at sea."),
      ], {
        choices: [
          opt('on_paper', '종이 위에서 먼저 다녀와 보겠습니다', "I'll make the trip on paper first", {
            end: endTalk({ accept: true, offer: 'ask_paper_sea' }),
            note: ['서류로 가는 바다가 무슨 뜻이냐고 물었다. 독도는 멀어서 가기 전에 종이 위에서 한 번 다녀와야 한다고, 종이에서 못 돌아오면 바다에서도 못 돌아온다고 했다.',
              "I asked what a sea reached by paperwork meant. Dokdo is far, so you make the trip once on paper first — if you can't come back on paper, you won't at sea."] }),
          opt('more_paper', '면허도 있고 배도 있는데, 서류가 또 필요합니까?', "I have a licence and a boat. Do I really need more papers?", {
            next: 'more' }),
        ],
      }),
      more: scene([
        line(C, '면허는 배를 몰 줄 안다는 거고, 계획서는 이번 바다를 안다는 거다. 둘은 다르다.', "A licence says you can handle a boat. A plan says you know this particular sea. They're different."),
        line(C, '멀리 갈수록 종이가 는다. 귀찮다는 놈들이 제일 먼저 구조 요청을 한다.', "The farther you go, the more paper. The ones who call it a nuisance are first to radio for rescue."),
        line(P, '…알겠습니다.', '...Understood.'),
        line(C, '써. 다 쓰면 내가 한 장씩 넘긴다.', "Write it. When it's done, I'll go through it page by page."),
      ], {
        end: endTalk({ accept: true, offer: 'more_paper' }),
        note: ['면허도 배도 있는데 서류가 또 필요하냐고 했다. 면허는 배를 몰 줄 안다는 거고 계획서는 이번 바다를 안다는 거라며, 귀찮다는 사람이 제일 먼저 구조 요청을 한다고 했다.',
          "I asked why I needed more papers with a licence and a boat. A licence means you can handle a boat; a plan means you know this sea — and the ones who call it a nuisance radio for rescue first."],
      }),
      not_sure: scene([
        line(C, '그 말이면 반은 됐다. 자신 있는 놈 계획서는 얇다.', "Saying that gets you halfway. The confident ones hand in thin plans.", { act: 'nod' }),
        line(P, '두껍게 쓰겠습니다.', "Mine will be thick."),
        line(C, '보급은 쓸 일이 없으면 좋은 거고, 있으면 그게 목숨이다.', "If you never use the stores, good. If you do, they're your life."),
      ], {
        end: endTalk({ accept: true, offer: 'not_confident' }),
        note: ['독도까지는 아직 자신이 없어 더 꼼꼼히 쓰겠다고 했다. 처음으로 고개를 끄덕이며, 자신 있는 사람의 계획서는 얇다고 했다.',
          "I said I wasn't confident about Dokdo yet, so I'd be extra careful. For the first time I got a nod: the confident ones hand in thin plans."],
      }),
    },
  },
  // M6-07 — 끝내는 자리
  {
    id: 'm6_07_done', questId: 'M6-07', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(P, '계획서입니다. 비상 보급 세 점도 배에 실어 뒀습니다.', "Here's the plan. And the three emergency items are aboard."),
        line(C, '기상. 정비.', 'Weather. Maintenance.', { act: 'peer' }),
        line(C, '비상계획. 연료 예비량. 여기 한 번 고쳤군.', "Contingency. Fuel reserve. You've corrected this once."),
        line(P, '…네.', '...Yes.'),
        act(C, 'silence'),
        line(C, '승인.', 'Approved.'),
        line(C, '마지막 자격이다. 남은 건 조사 동행 허가뿐이야.', "That's the last qualification. All that's left is the survey escort permit."),
      ], {
        choices: [
          opt('fuel', '연료 예비량, 다시 계산했습니다. 부족했습니다', 'I recalculated the fuel reserve. It was short', {
            say: ['연료 예비량은 다시 계산했습니다. 처음엔 부족했습니다.', 'I recalculated the fuel reserve. The first time, it came up short.'],
            end: endTalk({ complete: 'fuel',
              lineKo: '그 부족이 바다에서는 목숨이다. 예비량은 갈 때가 아니라 돌아올 때를 보고 잡는 거다. 맞바람 맞으면 기름이 훨씬 더 든다.',
              lineEn: "That shortfall is a life, out at sea. You set the reserve looking at the trip back, not the trip out. A headwind burns far more fuel." }),
            note: ['연료 예비량을 다시 계산했는데 처음엔 부족했다고 했다. 예비량은 돌아올 때를 보고 잡는 거라는 말을 들었다.',
              "I admitted the fuel reserve had come up short the first time. You set the reserve for the trip back, I was told."] }),
          opt('paper_sea', '서류로 가는 바다라는 말, 이해했습니다', 'I understand now — a sea reached by paperwork', {
            end: endTalk({ complete: 'paper_sea',
              lineKo: '그걸 이해하면 독도에 갈 수 있다. 서류를 우습게 보는 놈은 바다도 우습게 본다. 너는 한 장씩 다시 셌지. 그 손이면 됐다.',
              lineEn: "Understand that and you can go to Dokdo. Whoever scoffs at paperwork scoffs at the sea. You recounted every page. Those hands will do." }),
            note: ['서류로 가는 바다라는 말을 이해했다고 했다. 도장을 찍는 손이 느렸는데, 확인하는 손이었다.',
              "I said I understood what a sea reached by paperwork meant. The hand that stamped the plan moved slowly — a hand that checks."] }),
          opt('shore_copy', '계획서 사본 하나는 뭍에 두고 가겠습니다', "I'll leave a copy of the plan ashore", {
            next: 'copy' }),
        ],
        note: ['항해 계획서를 한 장씩 넘겨 보더니, 연료 예비량을 고친 자리에서 멈췄다가 승인 도장을 찍었다. 마지막 자격이고, 남은 건 조사 동행 허가뿐이라고 했다.',
          "The plan was gone through page by page, pausing where I'd corrected the fuel reserve, then stamped approved. The last qualification — only the survey escort permit was left."],
      }),
      copy: scene([
        line(C, '…그게 진짜 비상계획이다.', "...That's a real contingency plan."),
        line(C, '바다에 나간 놈 계획서는, 뭍에 남은 사람이 갖고 있어야 쓸모가 있어.', "A plan is only any use if someone ashore is holding it while you're out."),
      ], {
        end: endTalk({ complete: 'shore_copy',
          lineKo: '한 부는 계 사무실 벽에 붙여 둔다. 돌아올 날이 지나도 안 오면, 그 종이가 너를 찾으러 간다.',
          lineEn: "I'll pin one copy on the co-op office wall. If the return date passes and you're not back, that paper goes looking for you." }),
        note: ['계획서 사본 하나를 뭍에 두고 가겠다고 했다. 그게 진짜 비상계획이라며, 한 부는 계 사무실 벽에 붙여 두겠다고 했다.',
          "I said I'd leave a copy of the plan ashore. That's a real contingency plan, I was told — one copy would go on the co-op office wall."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M6-08 「조사 동행 허가」 — 받는 자리(어촌계) · 메인
  // ═══════════════════════════════════════════
  {
    id: 'm6_08_offer', questId: 'M6-08', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '항해 계획은 통과했다. 이제 조사 동행 허가다.', "The voyage plan passed. Now it's the survey escort permit."),
        line(P, '조사 동행이요?', 'Survey escort?'),
        line(C, '독도 학술조사단이 배를 띄운다. 거기 따라붙는 허가다.', "The Dokdo research survey is sending out boats. This permit lets you go with them."),
        line(P, '허가는 어떻게 받습니까?', 'How do I get it?'),
        line(C, '세 문이야. 레벨, 해양관광업, 그리고 조행록 여섯째 장.', "Three gates. Your level, marine tourism, and the sixth chapter of your fishing log."),
        line(P, '해양관광업은 제주에서 받았습니다.', 'I got marine tourism in Jeju.'),
        line(C, '그건 열렸다. 조행록은 지금 하는 일 마치면 찬다.', "That one's open. The log will fill once you finish what you're doing now."),
        line(C, '남은 건 레벨이다. 160. 그건 바다에서 보낸 날로만 찬다.', "What's left is your level. One sixty. That only fills with days spent at sea."),
        line(P, '셋 다 채우면요?', 'And once all three are filled?'),
        line(C, '독도다.', 'Dokdo.'),
      ], {
        choices: [
          opt('fill_gates', '세 문 다 채워서 오겠습니다. 바다에 더 나가겠습니다', "I'll fill all three gates. I'll get out on the sea more", {
            next: 'fill' }),
          opt('ask_survey', '조사단 일을 돕는 겁니까? 낚시는요?', "So I help the survey team? What about fishing?", {
            say: ['조사 동행이면 조사단 일을 돕는 겁니까? 낚시는 못 합니까?', "If it's a survey escort, do I help the survey team? Can't I fish?"],
            next: 'survey' }),
          opt('will_you_wait', '한참 걸릴 텐데요. 기다려 주십니까?', "It'll take a while. Will you wait?", {
            say: ['세 문을 다 채우려면 한참 걸릴 텐데요. 기다려 주십니까?', "Filling all three gates will take a good while. Will you wait for me?"],
            next: 'wait' }),
        ],
        note: ['독도 학술조사단 동행 허가를 받으려면 세 문을 채워야 한다고 했다. 해양관광업은 이미 열렸고 조행록 여섯째 장은 지금 일을 마치면 차니, 남은 건 레벨 160이라고 했다.',
          "To join the Dokdo research survey, I was told, I'd need to fill three gates. Marine tourism was already open and the log's sixth chapter would fill when I finished my current work — what remained was level 160."],
      }),
      fill: scene([
        line(C, '그래. 그 문은 서류로 열리는 게 아니라, 네가 바다에서 보낸 날로 열린다.', "Good. That gate doesn't open with paperwork. It opens with the days you spend at sea."),
        line(C, '손님 태우고, 물때 보고, 다치지 말고.', "Take fares, read the tides, don't get hurt."),
        line(P, '그러다 보면 오겠죠.', "And it'll come in time."),
        line(C, '온다.', 'It comes.', { act: 'nod' }),
      ], {
        end: endTalk({ accept: true, offer: 'fill_gates' }),
        note: ['세 문을 다 채워 오겠다고 했다. 명부의 내 이름 옆에 칸 셋을 그리며, 그 문은 바다에서 보낸 날로 열린다고 했다.',
          "I said I'd fill all three gates. Three boxes were drawn beside my name in the register — that gate opens with days at sea, I was told."],
      }),
      survey: scene([
        line(C, '낚시는 한다. 다만 잡으려고 하는 낚시가 아니다.', "You fish. But it isn't fishing to catch."),
        line(C, '조사단이 뭘 재는지 보고, 시키는 대로 잰다.', "You watch what the survey measures and measure as they tell you."),
        line(P, '고기 대신 기록을 가져오는 거군요.', "So I bring back records instead of fish."),
        line(C, '그래. 독도는 아무나 못 들어가는 바다다. 거기선 기록을 가져온다. 그게 동행이야.', "Right. Dokdo is a sea not just anyone can enter. There, you bring back records. That's what escorting means."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_survey' }),
        note: ['조사 동행이면 낚시는 못 하느냐고 물었다. 낚시는 하지만 잡으려는 낚시가 아니라며, 독도에서는 고기가 아니라 기록을 가져온다고 했다.',
          "I asked if a survey escort meant no fishing. You fish, I was told, but not to catch — at Dokdo you bring back records, not fish."],
      }),
      wait: scene([
        line(C, '독도는 안 도망간다. 기다리는 건 나보다 그 바다가 더 잘해.', "Dokdo isn't going anywhere. That sea is better at waiting than I am."),
        line(C, '서둘러 채운 문은 바다에서 다시 닫힌다. 천천히 와.', "A gate filled in a hurry shuts again at sea. Take your time."),
        line(C, '대신 그동안 손 놓고 있지는 마라. 계원들은 네가 뭘 하는지 다 본다.', "But don't sit idle meanwhile. The members see everything you do."),
      ], {
        choices: [
          opt('steady', '천천히, 대신 쉬지 않고 가겠습니다', "Slowly, then — but without stopping", {
            end: endTalk({ accept: true, offer: 'will_you_wait' }),
            note: ['한참 걸릴 텐데 기다려 주느냐고 물었다. 독도는 안 도망간다며, 서둘러 채운 문은 바다에서 다시 닫히니 천천히 오되 손 놓고 있지는 말라고 했다.',
              "I asked if they'd wait, since it would take a while. Dokdo isn't going anywhere, I was told; a gate filled in a hurry shuts again at sea — take my time, but don't sit idle."] }),
          opt('castle_joke', '문이 세 개라니, 꼭 성문 같습니다', 'Three gates — it sounds like a castle', {
            say: ['독도 가는 길에 문이 세 개라니, 꼭 성문 같습니다.', 'Three gates on the way to Dokdo — it sounds like a castle.'],
            next: 'castle' }),
        ],
      }),
      castle: scene([
        line(C, '성이지. 지키는 사람이 있는 바다니까.', "It is a castle. It's a sea with people guarding it."),
        line(P, '두드리면 열립니까?', 'Does it open if I knock?'),
        line(C, '성문은 두드린다고 안 열려. 문지기가 얼굴을 알아봐야 열리지.', "A castle gate doesn't open for knocking. It opens when the gatekeeper knows your face."),
        line(C, '그 얼굴을 바다에서 만들어 와라.', 'Go and make that face at sea.'),
      ], {
        end: endTalk({ accept: true, offer: 'castle_joke' }),
        note: ['문이 세 개라니 성문 같다고 했다. 웃지는 않았지만 조금 풀린 목소리로, 성문은 문지기가 얼굴을 알아봐야 열리니 그 얼굴을 바다에서 만들어 오라고 했다.',
          "I said three gates made it sound like a castle. No smile, but the voice softened a little: a castle gate opens when the gatekeeper knows your face — go make that face at sea."],
      }),
    },
  },
  // M6-08 — 끝내는 자리
  {
    id: 'm6_08_done', questId: 'M6-08', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '허가 났다.', "The permit's through."),
        line(P, '…독도요?', '...Dokdo?'),
        line(C, '독도.', 'Dokdo.', { act: 'nod' }),
        act(C, 'give', { to: P, item: 'qr_bag_voyage' }),
        line(C, '항해 가방이다. 이건 계에서 주는 마지막 물건이다.', "A voyage bag. This is the last thing the co-op gives you."),
        line(P, '마지막이요?', 'The last?', { act: 'receive' }),
        line(C, '다음부턴 네가 주는 쪽이야.', "From now on, you're the one who gives."),
      ], {
        choices: [
          opt('last_gift', '마지막 물건, 잘 쓰겠습니다', "I'll make good use of the last gift", {
            next: 'gift' }),
          opt('give_back', '다음부터 제가 주는 쪽이라는 말, 기억하겠습니다', "I'll remember — from now on, I'm the one who gives", {
            next: 'give_back' }),
          opt('first_lantern', '실습생 때 계에서 받은 랜턴, 아직 씁니다', "I still use the lantern the co-op gave me as a trainee", {
            next: 'lantern' }),
        ],
        note: ['독도 학술조사단 동행 허가가 났다. 계에서 주는 마지막 물건이라며 항해 가방을 받았고, 다음부터는 내가 주는 쪽이라고 했다.',
          "The permit to join the Dokdo research survey came through. I was given a voyage bag — the last thing the co-op would give me; from now on, I'd be the one giving."],
      }),
      gift: scene([
        line(C, '써라. 독도까지.', 'Use it. All the way to Dokdo.'),
        line(C, '가방 안에 명부 사본 넣어 뒀다. 왜 넣었는지는 묻지 마라.', "There's a copy of the members' register in the bag. Don't ask why."),
        line(P, '(첫 장에 내 이름이 있다…)', '(My name is on the first page...)'),
      ], {
        end: endTalk({ complete: 'last_gift',
          lineKo: '멀리 나가는 놈은 제가 어디 사람인지 들고 가야 한다. 독도에서 그걸 꺼내 볼 일 없게 다녀와.',
          lineEn: "Anyone going far needs to carry where they belong. Come back without ever needing to take it out at Dokdo." }),
        note: ['마지막 물건을 잘 쓰겠다고 했다. 항해 가방 안에는 계원 명부 사본이 들어 있었고, 첫 장에 내 이름이 있었다.',
          "I said I'd make good use of the last gift. Inside the voyage bag was a copy of the members' register, with my name on the first page."],
      }),
      give_back: scene([
        line(C, '기억해. 2층이 기다린다.', "Remember it. The second floor is waiting."),
        line(P, '2층이요?', 'The second floor?'),
        line(C, '작업장 2층이 무너진 지 오래다. 계원들 다 알면서 손을 못 댔지.', "The workshop's second floor collapsed a long time ago. Every member knows, and nobody's touched it."),
      ], {
        end: endTalk({ complete: 'give_back',
          lineKo: '독도 다녀오면 그 얘기부터 하자. 주는 쪽이 할 일이다.',
          lineEn: "When you're back from Dokdo, we'll start with that. It's work for the one who gives." }),
        note: ['다음부터 내가 주는 쪽이라는 말을 기억하겠다고 하자, 처음으로 작업장 2층 이야기가 나왔다. 무너진 지 오래라며, 독도 다녀오면 그 얘기부터 하자고 했다.',
          "When I said I'd remember that I'm the one who gives now, the workshop's second floor came up for the first time — long collapsed. We'd start with that when I'm back from Dokdo."],
      }),
      lantern: scene([
        line(C, '…그걸 아직 쓰냐.', '...You still use that?', { act: 'look_sea' }),
        line(C, '그 랜턴 들고 새벽 갯바위 내려가던 놈이 독도에 간다.', "The one who went down to the rocks at dawn with that lantern is going to Dokdo."),
      ], {
        end: endTalk({ complete: 'first_lantern',
          lineKo: '계는 물건을 주는 데가 아니라 사람을 남기는 데다. 너 같은 놈 하나 남기려고 다들 얼음 나르고 그물 친 거다.',
          lineEn: "A co-op isn't a place that gives things. It's a place that leaves people behind. Everyone hauled ice and set nets to leave one like you." }),
        note: ['실습생 때 받은 랜턴을 아직 쓴다고 했다. 창밖 항구를 잠깐 보더니, 계는 물건을 주는 데가 아니라 사람을 남기는 데라고 했다.',
          "I said I still used the lantern I'd been given as a trainee. After a glance out at the harbour, I was told a co-op isn't a place that gives things — it's a place that leaves people."],
      }),
    },
  },
];
