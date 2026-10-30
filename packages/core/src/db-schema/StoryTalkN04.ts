/**
 * @file StoryTalkN04.ts
 * @description 290차 — N04 「청초고 방파제부」 받는 자리 · 끝내는 자리 대본(주고받는 장면). 규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`.
 *
 * 인물: 배누리(17 · 청초고 방파제부 부장 — 밝은 해요체 · 느낌표 · 「낚으면 먹는다!」 · 주인공을 「어른 부원(님)」이라 부른다 ·
 *   진로 이야기 때만 목소리가 낮아지고, 들어 준 뒤에야 주인공 이름을 편하게 부른다)
 *   · 모진주(17 · 외톨이 실력자 — 말이 거의 없다 · 「…네.」) · 하수아(16 · 부원 — 계획부터 세우는 아이 · 대사는 없다).
 * 호칭(290): 주인공은 「배누리 씨」 · 「모진주 씨」 · 「하수아 씨」. 배누리는 주인공을 「어른 부원님」 · `{player} 씨`로 부른다(형 · 언니 없이).
 * 표시: 옛 받는 답 · 보상 답의 표시를 그대로 쓴다(choice.n04_1_asked_club · choice.club_joined · choice.n04_2_asked_jinju ·
 *   choice.n04_3_asked_members · choice.n04_4_asked_jinju · choice.n04_5_asked_school · choice.n04_listened · choice.n04_advised ·
 *   choice.n04_5_own_story · choice.n04_6_asked_boat · choice.n04_forever). 새 표시는 만들지 않았다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const N = 'bae_nuri';
const J = 'mo_jinju';
const P = 'player';

export const TALKS_N04: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N04-1 「입부 권유」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n04_1_offer', questId: 'N04-1', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '어, 혼자세요?', 'Oh — are you here on your own?', { act: 'look_up' }),
        line(P, '네, 혼자예요. 무슨 일 있어요?', "Yes, just me. Is something up?"),
        line(N, '저희 방파제부인데요, 지금 학꽁치 좀 낚아서 구워 먹으려고요.', "We're the breakwater club. We're about to catch some halfbeak and grill them."),
        line(P, '여기 방파제에서 바로요?', 'Right here on the breakwater?'),
        line(N, '네! 낚으면 먹는다! 그게 저희 모토예요.', "Yep! Catch it and eat it! That's our motto."),
        line(P, '(말하면서도 사비키 채비를 계속 흔드네…)', '(She keeps waving a sabiki rig even while she talks...)'),
        line(N, '학꽁치 두 마리만 올리면 돼요. 소금은 제가 챙겨 왔고요.', "We only need two halfbeak. I brought the salt."),
        line(P, '그런데 왜 저한테…?', 'But why ask me...?'),
        line(N, '혼자 계시길래요. 혼자 먹으면 맛없잖아요.', "You were on your own. Food doesn't taste as good alone."),
        line(N, '그리고… 입부하실래요?', 'And... want to join?'),
      ], {
        choices: [
          opt('count', '좋아요, 학꽁치 구이라면 끼고 싶네요', "Sure — for grilled halfbeak, count me in", {
            say: ['좋아요. 학꽁치 구이라면 저도 끼고 싶네요.', "Sure. If it's grilled halfbeak, I'd like to be in on it."], next: 'count' }),
          opt('club', '방파제부요? 그런 동아리도 있어요?', 'A breakwater club? Is that a real thing?', { next: 'club' }),
          opt('novice', '학꽁치는 한 번도 안 잡아 봤는데요', "I've never caught a halfbeak", {
            say: ['학꽁치는 한 번도 안 잡아 봤는데, 괜찮을까요?', "I've never caught a halfbeak before. Is that all right?"], next: 'novice' }),
        ],
        note: ['청초고 방파제부 부장이라는 배누리 씨가 사비키 채비를 흔들며 다가왔다. 학꽁치 두 마리를 낚아 방파제에서 바로 구워 먹자며, 다짜고짜 입부하겠느냐고 물었다.',
          'Nuri, captain of the Cheongcho High breakwater club, came over waving a sabiki rig. She wanted to catch two halfbeak and grill them right on the breakwater, and asked out of nowhere whether I wanted to join.'],
      }),
      count: scene([
        line(N, '와, 진짜요? 오늘 손님 첫 번째예요!', "Whoa, really? You're my first catch today!", { act: 'look_up' }),
        line(N, '사비키는 살살 흔들어야 돼요. 세게 흔들면 학꽁치가 놀라서 도망가요.', "You have to wiggle the sabiki gently. Shake it hard and the halfbeak get scared off."),
        line(P, '살살이요. 알겠어요.', 'Gently. Got it.'),
        line(N, '두 마리만 잡으면 바로 구워요!', "Two fish and we grill them straight away!"),
      ], {
        end: endTalk({ accept: true, offer: 'count_me_in' }),
        note: ['같이 낚겠다고 하자 배누리 씨는 오늘 첫 손님이라며 좋아했다. 사비키는 살살 흔들어야 학꽁치가 도망가지 않는다고 했다.',
          "When I said I'd join in, Nuri lit up — I was her first catch of the day. She said to wiggle the sabiki gently or the halfbeak would bolt."],
      }),
      club: scene([
        line(N, '있죠! 청초고 방파제부. 제가 부장이에요.', "There is! The Cheongcho High breakwater club. I'm the captain."),
        line(P, '부장이요?', 'The captain?'),
        line(N, '네. 학교 끝나면 방파제로 와서 낚고, 낚은 건 그 자리에서 먹어요.', "Yep. After school we come to the breakwater and fish, and whatever we catch we eat on the spot."),
        line(N, '부원은… 많지는 않아요. 그래서 이렇게 영업 중이에요.', "There aren't... many of us. So I'm out recruiting.", { act: 'look_away' }),
        line(P, '(영업이라니…)', '(Recruiting, she says...)'),
        line(N, '낚으면 먹는다! 이 모토에 끌리시면 반은 부원이에요. 일단 두 마리만 같이 낚아요!', "Catch it and eat it! If that motto pulls you in, you're halfway a member. Let's just catch two together first!"),
      ], {
        end: endTalk({ accept: true, offer: 'ask_club' }),
        note: ['청초고 방파제부는 학교가 끝나면 방파제에서 낚고, 낚은 건 그 자리에서 먹는 동아리라고 했다. 부원이 적어서 영업 중이라고.',
          "The Cheongcho High breakwater club fishes off the breakwater after school and eats what it catches on the spot. There aren't many members, so she's out recruiting."],
      }),
      novice: scene([
        line(N, '괜찮아요! 처음엔 다 그래요.', "That's fine! Everyone starts somewhere."),
        line(N, '학꽁치는 물 위쪽에 떠다니니까 채비를 깊이 안 내려도 돼요.', "Halfbeak swim near the top, so you don't need to drop the rig deep."),
        line(P, '그래도 못 잡으면요?', 'And if I still catch nothing?'),
        line(N, '그럼 굽는 담당 하시면 돼요. 그것도 중요한 일이에요, 진짜로. 탄 거 먹고 싶은 사람은 없거든요.', "Then you're on grilling duty. That's important too, honestly. Nobody wants to eat burnt fish."),
      ], {
        choices: [
          opt('grill', '그럼 굽는 것부터 맡을게요', "Then I'll take the grill first", {
            say: ['그럼 굽는 것부터 맡을게요. 낚는 건 옆에서 배우고요.', "Then I'll take the grill first, and learn the fishing from beside you."],
            end: endTalk({ accept: true, offer: 'never_caught' }),
            note: ['학꽁치는 처음이라고 했더니, 배누리 씨는 못 잡으면 굽는 담당을 하면 된다고 했다. 탄 생선은 아무도 안 먹는다고.',
              "When I admitted I'd never caught a halfbeak, Nuri said I could be on grilling duty if I caught nothing. Nobody eats burnt fish, she said."] }),
          opt('dues', '그런데 입부하면 부비 내야 해요?', 'Do members have to pay dues, though?', {
            say: ['그런데 입부하면 부비 내야 해요? 저 지금 빈털터리인데요.', "Do members have to pay dues, though? I'm flat broke right now."], next: 'dues' }),
        ],
        note: ['학꽁치는 물 위쪽에 떠다녀서 채비를 깊이 내리지 않아도 된다고 했다.', "She said halfbeak stay near the surface, so the rig doesn't need to go deep."],
      }),
      dues: scene([
        line(N, '부비요? 하하, 저희도 거의 없어요.', "Dues? Ha, we barely have any ourselves.", { act: 'shake_head' }),
        line(N, '부비 대신 소금이랑 호일만 가져오면 돼요.', "Instead of dues, just bring salt and foil."),
        line(P, '소금이랑 호일이요.', 'Salt and foil.'),
        line(N, '입부는 나중에 정하셔도 돼요. 일단 오늘은 같이 낚고 같이 먹어요. 먹고 나면 마음이 바뀔걸요?', "You can decide about joining later. Today, let's just fish and eat together. You'll change your mind once you've eaten."),
      ], {
        choices: [
          opt('eat', '좋아요. 오늘은 같이 먹어요', "All right. Let's eat together today", {
            end: endTalk({ accept: true, offer: 'dues' }),
            note: ['부비 대신 소금과 호일만 가져오면 된다고 했다. 입부는 나중에 정하기로 하고, 오늘은 같이 낚고 같이 먹기로 했다.',
              "Instead of dues, all I'd need is salt and foil. We left joining for later — today we'd just fish and eat together."] }),
          opt('later', '오늘은 구경만 할게요', "I'll just watch today", {
            say: ['오늘은 구경만 할게요. 다음에 같이 낚아요.', "I'll just watch today. Let's fish together another time."],
            end: endTalk({ decline: true }),
            note: ['오늘은 구경만 하겠다고 했다. 배누리 씨는 아쉬워하면서도 다음에 꼭 같이 낚자고 했다.',
              "I said I'd only watch today. Nuri looked disappointed, but made me promise to fish with them next time."] }),
        ],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-1 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n04_1_done', questId: 'N04-1', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '어때요, 맛있죠?', 'Well? Good, right?', { act: 'peer' }),
        line(P, '네. 껍질이 바삭해요. 방파제에서 먹으니까 더 맛있네요.', "Yes. The skin's crisp. It tastes even better out on the breakwater."),
        line(N, '낚아서 먹는 게 최고예요. 그게 낚으면 먹는다의 진짜 뜻이에요.', "Eating what you've caught is the best. That's what Catch it and eat it really means."),
        line(P, '(고등학생들 사이에 앉아 있으니, 내 나이를 잠깐 잊었다.)', '(Sitting among high schoolers, I forgot my own age for a moment.)'),
        line(N, '그래서, 입부는요?', 'So — are you joining?', { act: 'look_up' }),
      ], {
        choices: [
          opt('join', '입부할게요', "I'll join", {
            say: ['입부할게요. 낚으면 먹는다, 저도 끼워 주세요.', "I'll join. Catch it and eat it — count me in."], next: 'join' }),
          opt('decline_join', '동아리는 좀… 저 스물둘이에요', "A school club is a bit... I'm twenty-two", {
            end: endTalk({ complete: 'decline_join',
              lineKo: '그럼 밥만 같이 먹어요! 나이는 상관없어요. 낚으면 먹는다, 이 모토엔 나이 제한이 없거든요. 마음 바뀌면 언제든 방파제로 오세요. 자리는 늘 하나 비워 둘게요.',
              lineEn: "Then just eat with us! Age doesn't matter. Catch it and eat it — that motto has no age limit. If you change your mind, come to the breakwater any time. I'll always keep a spot free." }),
            note: ['스물둘에 고등학생 동아리는 좀 그렇다고 했다. 배누리 씨는 그럼 밥만 같이 먹자며, 자리는 늘 하나 비워 두겠다고 했다.',
              "I said a high school club at twenty-two was a bit much. Nuri said then we'd just eat together, and she'd always keep a spot free."] }),
          opt('later', '생각해 볼게요', "Let me think about it", {
            end: endTalk({ complete: 'later',
              lineKo: '천천히요! 방파제는 안 도망가요. 학꽁치는 도망가지만요. 봄가을에 제일 많이 붙으니까, 그때 오시면 사비키 하나 더 챙겨 둘게요.',
              lineEn: "Take your time! The breakwater isn't going anywhere. The halfbeak are, though. They bite best in spring and autumn — come then and I'll have a spare sabiki ready." }),
            note: ['생각해 보겠다고 했다. 배누리 씨는 방파제는 안 도망간다며, 봄가을에 오면 사비키를 하나 더 챙겨 두겠다고 했다.',
              "I said I'd think about it. Nuri said the breakwater wasn't going anywhere, and she'd keep a spare sabiki for me in spring or autumn."] }),
          opt('grill_tip', '굽는 요령 좀 알려 주세요', 'Teach me your grilling trick', {
            say: ['굽는 솜씨가 좋던데요. 그 요령 좀 알려 주세요.', "You're good at grilling. Teach me the trick."], next: 'tip' }),
        ],
        note: ['학꽁치 두 마리를 방파제에서 바로 구워 먹었다. 열일곱 살들 사이에 앉아 있으니 마음이 이상하게 편했다. 배누리 씨가 입부할 거냐고 다시 물었다.',
          'We grilled the two halfbeak right on the breakwater. Sitting among seventeen-year-olds felt strangely easy. Nuri asked again whether I would join.'],
      }),
      join: scene([
        line(N, '진짜요? 환영해요! 낚으면 먹는다!', "Really? Welcome! Catch it and eat it!", { act: 'look_up' }),
        line(N, '근데 뭐라고 불러야 하지… 선배? {player} 씨?', "But what do I call you... Senior? {player}?"),
        line(P, '편하게 불러요.', 'Whatever feels natural.'),
        line(N, '그럼 어른 부원님! 다음 모임은 방파제 끝이에요. 소금은 제가 챙길게요.', "Then — Adult Member! Next meeting's at the end of the breakwater. I'll bring the salt."),
      ], {
        end: endTalk({ complete: 'join' }),
        note: ['방파제부에 입부했다. 배누리 씨는 뭐라고 부를지 한참 고민하더니, 나를 어른 부원님이라고 부르기로 했다.',
          'I joined the breakwater club. Nuri agonised over what to call me, then settled on Adult Member.'],
      }),
      tip: scene([
        line(N, '요령이요? 학꽁치는 배 안쪽 까만 막만 긁어 내면 돼요. 그거 안 긁으면 써요.', "The trick? With halfbeak you just scrape out the black lining in the belly. Leave it in and it's bitter."),
        line(P, '아, 그래서 하나도 안 썼구나.', "Ah, so that's why none of it was bitter."),
        line(N, '불은 세게 말고 오래. 껍질이 바삭해지면 그때 뒤집어요.', "Not too hot, but long. Flip it once the skin goes crisp."),
        line(N, '이건 부장 비법인데, 특별히 알려 드리는 거예요.', "That's the captain's secret. I'm only telling you as a special favour."),
      ], {
        end: endTalk({ complete: 'grill_tip' }),
        note: ['배누리 씨에게 학꽁치 굽는 요령을 배웠다. 배 안쪽 까만 막을 긁어 내고, 불은 약하게 오래, 껍질이 바삭해지면 뒤집는다.',
          'Nuri taught me how to grill halfbeak: scrape out the black belly lining, cook low and long, and flip once the skin crisps.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-2 「부원을 낚아라」 — 받는 자리(겨울에만 · 미룰 수 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n04_2_offer', questId: 'N04-2', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '어른 부원님! 저희 부스 보셨어요?', 'Adult Member! Have you seen our booth?', { act: 'look_up' }),
        line(P, '부스요? 저 간판… 사람 낚기요?', "The booth? That sign... 'Reel In People'?"),
        line(N, '네! 축제 부스예요. 근데 진짜 목표는 따로 있어요.', "Yep! It's our festival booth. But the real target is someone else."),
        line(P, '따로요?', 'Someone else?'),
        line(N, '모진주요. 새벽마다 방파제 끝에서 혼자 도루묵을 낚는 애예요.', "Mo Jinju. She fishes for sandfish alone at the end of the breakwater every dawn.", { act: 'look_sea' }),
        line(P, '그 친구를 입부시키고 싶은 거예요?', 'You want her in the club?'),
        line(N, '네. 근데 말로는 안 돼요. 제가 몇 번이나 해 봤거든요.', "Yes. But talking doesn't work. I've tried a bunch of times."),
        act(N, 'sigh'),
        line(N, '그래서 같이 가 주셨으면 해요. 겨울 새벽 방파제로요.', "So I was hoping you'd come with me. To the breakwater, at dawn, in winter."),
        line(P, '겨울 새벽이요?', 'Winter, at dawn?'),
        line(N, '도루묵은 겨울에 알 배서 연안으로 붙는대요. 진주가 혼잣말하는 걸 들었어요.', "Sandfish come inshore in winter, full of roe. I heard Jinju muttering it to herself."),
      ], {
        choices: [
          opt('go', '겨울 새벽이라면 지금이죠. 가요', "If it's winter dawns, it's now. Let's go", { next: 'go' }),
          opt('jinju', '모진주 씨는 어떤 친구예요?', 'What is Jinju like?', {
            say: ['모진주 씨는 어떤 친구예요? 그렇게까지 데려오고 싶은 이유가 있어요?', "What is Jinju like? Is there a reason you want her so badly?"], next: 'jinju' }),
          opt('booth', '사람 낚기 부스는 뭐 하는 데예요?', "What does a 'Reel In People' booth do?", { next: 'booth' }),
          opt('decline', '겨울 새벽은 저도 무리예요', "Winter dawns are too much for me", {
            say: ['겨울 새벽은 저도 무리예요. 이번은 넘길게요.', "Winter dawns are too much for me. I'll sit this one out."], next: 'decline' }),
        ],
        note: ['배누리 씨의 축제 부스 이름은 사람 낚기였다. 진짜 목표는 새벽마다 방파제 끝에서 혼자 도루묵을 낚는 모진주 씨를 입부시키는 것이라며, 겨울 새벽 방파제에 같이 가 달라고 했다.',
          "Nuri's festival booth was called Reel In People. Her real target was Mo Jinju, who fishes for sandfish alone at the end of the breakwater every dawn — and she asked me to come to the breakwater with her on a winter dawn."],
      }),
      go: scene([
        line(N, '역시! 모자 챙기세요, 새벽은 진짜 추워요.', "I knew it! Bring a hat — dawns are freezing."),
        line(N, '그리고 작전이 있어요. 방파제 끝에서는 진주한테 말 걸지 말고, 옆에서 낚기만 하세요.', "And there's a plan. At the end of the breakwater, don't talk to Jinju — just fish beside her."),
        line(P, '낚기만요?', 'Just fish?'),
        line(N, '네. 그게 작전이에요.', "Yep. That's the plan.", { act: 'nod' }),
      ], {
        end: endTalk({ accept: true, offer: 'go' }),
        note: ['가겠다고 했다. 배누리 씨의 작전은 하나였다. 방파제 끝에서 모진주 씨에게 말을 걸지 말고, 옆에서 낚기만 할 것.',
          "I said I'd go. Nuri's plan was simple: at the end of the breakwater, don't talk to Jinju — just fish beside her."],
      }),
      jinju: scene([
        line(N, '말을 거의 안 하는 애예요. 근데 낚시는… 진짜 잘해요.', "She hardly ever talks. But her fishing... she's really good."),
        line(N, '새벽에 원투 던지는 걸 봤는데, 채비가 물에 떨어지는 소리도 안 났어요.', "I watched her cast long at dawn once, and the rig didn't even make a sound when it hit the water."),
        line(P, '소리가 안 났어요?', 'No sound at all?'),
        line(N, '혼자가 좋아서 혼자인 건지, 같이 할 사람이 없어서 혼자인 건지 모르겠어요. 그래서 알고 싶어요.', "I can't tell if she's alone because she likes it, or because there's no one to fish with. That's what I want to find out."),
      ], {
        choices: [
          opt('respect', '혼자가 좋은 걸 수도 있어요', 'Maybe she likes being alone', {
            say: ['혼자가 좋은 걸 수도 있어요. 그럼 그것도 지켜 줘야 하고요.', "Maybe she likes being alone. Then we'd have to respect that too."],
            aff: { [J]: 0.03 }, next: 'respect' }),
          opt('together', '그럼 같이 가서 알아봐요', "Then let's go and find out", {
            end: endTalk({ accept: true, offer: 'ask_jinju' }),
            note: ['모진주 씨가 혼자가 좋아서 혼자인지, 같이 할 사람이 없어서인지 알고 싶다는 배누리 씨와 함께 가 보기로 했다.',
              "Nuri wanted to know whether Jinju was alone by choice or for lack of company. I agreed to go and find out with her."] }),
        ],
        note: ['모진주 씨는 말이 거의 없지만, 원투를 던지면 채비가 물에 떨어지는 소리도 안 날 만큼 잘한다고 했다.',
          "Nuri said Jinju barely talks, but she casts so well the rig doesn't make a sound when it lands."],
      }),
      respect: scene([
        line(N, '…그럴 수도 있죠.', '...That could be it.', { act: 'look_away' }),
        line(N, '그럼 그것도 알고 싶어요. 싫으면 싫다고 하는 걸 들으면, 저도 그만둘게요. 같이 가 주세요.', "Then I want to know that too. If I hear her say no, I'll stop. Please come with me."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_jinju' }),
        note: ['혼자가 좋은 걸 수도 있다고 했더니, 배누리 씨는 그렇다면 그것도 알고 싶다고, 싫다고 하면 그만두겠다고 했다.',
          "When I said Jinju might just like being alone, Nuri said she wanted to know that too — if Jinju said no, she'd stop."],
      }),
      booth: scene([
        line(N, '지나가는 사람 붙잡아서 입부 신청서 쓰게 하는 거요. 이름은 제가 지었어요.', "You grab passers-by and get them to fill in a sign-up form. I came up with the name."),
        line(P, '(간판 글씨가 삐뚤다…)', '(The lettering on the sign is crooked...)'),
        line(N, '근데 아무도 안 낚여요. 그래서 진짜 낚시로 가는 거예요.', "But nobody's biting. So we're going with real fishing."),
        line(N, '진주한테는 신청서가 안 통하거든요.', "Forms don't work on Jinju."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_booth' }),
        note: ['사람 낚기 부스는 지나가는 사람에게 입부 신청서를 쓰게 하는 부스였다. 아무도 안 낚여서, 진짜 낚시로 모진주 씨를 설득하러 가기로 했다.',
          "The Reel In People booth was for getting passers-by to fill in sign-up forms. Nobody was biting, so we'd try real fishing on Jinju instead."],
      }),
      decline: scene([
        line(N, '…아, 그럼 다음 겨울에요. 진주는 안 도망가요. 아마.', "...Ah, next winter then. Jinju isn't going anywhere. Probably."),
        line(N, '사실 저도 새벽 추위는 무서워요. 다음 겨울엔 핫팩 넉넉히 챙겨 둘게요. 그때는 꼭 같이 가요.', "Honestly, I'm scared of the dawn cold too. Next winter I'll stock up on hand warmers. Come with me then, for sure."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['겨울 새벽은 무리라고 미뤘다. 배누리 씨는 다음 겨울엔 핫팩을 넉넉히 챙겨 두겠다며, 그때는 꼭 같이 가자고 했다.',
          "I put it off — winter dawns were too much. Nuri said she'd stock up on hand warmers next winter and made me promise to come then."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-2 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n04_2_done', questId: 'N04-2', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '진주가 입부한대요!', "Jinju's joining!", { act: 'look_up' }),
        line(P, '정말요?', 'Really?'),
        line(N, '아까 신청서를 말없이 내밀더라고요. 어떻게 하셨어요?', "She just held out the form without a word. What did you do?", { act: 'peer' }),
        line(P, '그냥… 옆에서 도루묵만 낚았어요.', 'Nothing much... I just fished for sandfish beside her.'),
        line(N, '낚기만 했는데? 그게 되네…', "Just fishing? And that worked..."),
        line(N, '저는 맨날 말로 하려다 실패했거든요. 말을 많이 하면 진주가 한 발씩 물러나요.', "I always failed trying to talk her round. The more I talk, the more Jinju backs away."),
      ], {
        choices: [
          opt('silent', '말없이 옆에 있었던 게 통했나 봐요', 'Staying quiet beside her must have worked', {
            say: ['말없이 옆에서 낚기만 했어요. 그게 통했나 봐요.', "I didn't say a word, just fished beside her. That must have done it."],
            end: endTalk({ complete: 'silent',
              lineKo: '역시. 진주는 말보다 낚시로 통하는 애예요. 이건 부 활동비예요. 어른 부원님은 한 발도 안 다가갔는데 진주가 다가왔어요. 신기해요.',
              lineEn: "I knew it. Jinju talks through fishing, not words. This is from the club fund. You didn't take a single step towards her, and she came to you. Amazing." }),
            note: ['말없이 옆에서 낚기만 했다고 했다. 배누리 씨는 진주는 말보다 낚시로 통한다며, 부 활동비라고 봉투를 건넸다.',
              "I said I'd only fished beside her in silence. Nuri said Jinju speaks through fishing, not words, and handed me an envelope from the club fund."] }),
          opt('lesson', '모진주 씨 원투에 배운 게 더 많아요', "I learned more from Jinju's casting", {
            say: ['모진주 씨 원투에서 제가 배운 게 더 많아요. 더 배우고 싶어요.', "Honestly, I learned more from Jinju's casting than she did from me. I'd like to learn more."],
            aff: { [J]: 0.03 }, next: 'lesson' }),
          opt('decline', '여러분 일인데 품삯은 됐어요', "It's your club's thing — no pay needed", {
            say: ['학생들 일인데 품삯은 됐어요.', "It's a student thing. I don't need paying."],
            end: endTalk({ complete: 'decline',
              lineKo: '어른 부원 최고… 진주도 그렇게 말했어요. 진주가 누구 칭찬하는 거 진짜 드물어요. 부 일지에 적어 둘 거예요. 오늘 날짜, 진주가 칭찬함, 대상은 어른 부원.',
              lineEn: "Best adult member ever... Jinju said so too. She almost never praises anyone. I'm writing it in the club log. Today's date, Jinju gave praise, recipient: Adult Member." }),
            note: ['품삯은 사양했다. 배누리 씨는 모진주 씨도 나를 칭찬했다며, 부 일지에 적어 두겠다고 했다.',
              "I turned down the pay. Nuri said Jinju had praised me too, and she'd write it in the club log."] }),
          opt('asked_again', '다음에도 같이 낚자고 했어요', 'I asked her to fish with me again', {
            say: ['모진주 씨한테 다음에도 같이 낚자고 했어요. 대답은 없었지만요.', "I asked Jinju to fish with me again next time. She didn't answer, though."], next: 'again' }),
        ],
        note: ['배누리 씨가 모진주 씨가 입부한다고 알려 왔다. 어떻게 했느냐고 묻길래, 옆에서 도루묵만 낚았다고 했다.',
          "Nuri told me Jinju was joining. When she asked how I'd done it, I said I'd just fished for sandfish beside her."],
      }),
      lesson: scene([
        line(N, '진주가 가르쳐 준다고요? 그 애가?', "Jinju, teaching? Her?"),
        line(P, '추가 물에 들어갈 때 소리가 하나도 안 나더라고요.', "When her sinker went in, there wasn't a sound."),
        line(N, '떨어지기 직전에 손가락으로 줄을 살짝 잡아 준대요. 그럼 퐁 소리도 안 나요.', "She says she catches the line lightly with a finger just before it lands. Then there's not even a plop."),
        line(N, '그럼 부에서 배우세요. 원투 담당 진주! 대답은 아마 손으로 할 거예요.', "Then learn it in the club. Jinju, long-cast coach! She'll probably answer with her hands."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['모진주 씨의 원투를 더 배우고 싶다고 했다. 떨어지기 직전에 손가락으로 줄을 살짝 잡아 주면 소리가 나지 않는다고 했다.',
          "I said I wanted to learn more of Jinju's long cast. The trick is to catch the line lightly with a finger just before it lands, so it makes no sound."],
      }),
      again: scene([
        act(N, 'laugh'),
        line(N, '대답이 없으면 된 거예요! 진주는 싫으면 고개부터 저어요. 그건 확실해요.', "No answer means yes! If Jinju doesn't like something, she shakes her head first. That I know for sure."),
        line(N, '다음 새벽 모임에 진주 자리 하나 더 만들어 둘게요. 어른 부원님 옆으로요. 진주는 아는 사람 옆에만 앉거든요.', "I'll set out a seat for Jinju at the next dawn meet. Next to you. She only sits beside people she knows."),
      ], {
        end: endTalk({ complete: 'asked_again' }),
        note: ['모진주 씨에게 다음에도 같이 낚자고 했다고 전했다. 배누리 씨는 대답이 없으면 된 거라며, 다음 모임엔 내 옆에 진주 자리를 만들겠다고 했다.',
          "I told Nuri I'd asked Jinju to fish with me again. She said no answer meant yes, and she'd put Jinju's seat next to mine at the next meet."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-3 「부원 모집 전단」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n04_3_offer', questId: 'N04-3', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        act(N, 'sigh'),
        line(N, '어른 부원님, 큰일 났어요.', "Adult Member, we're in trouble."),
        line(P, '무슨 일이에요?', "What's wrong?"),
        line(N, '부가 없어질지도 몰라요.', 'The club might get shut down.'),
        line(P, '없어진다고요? 왜요?', 'Shut down? Why?'),
        line(N, '부원이 모자라서요. 수아가 전단을 만들어 왔는데요…', "We don't have enough members. Sua made some flyers, but...", { act: 'look_away' }),
        line(P, '전단이면 좋은 방법 아니에요?', "Aren't flyers a good idea?"),
        line(N, '아뇨. 종이는 바람에 날아가잖아요. 낚는 걸 보여 주면 돼요.', "Nope. Paper blows away in the wind. We just have to show them us catching fish."),
        line(N, '방파제에서 두 마리만 올려 주세요. 한 마리는 운이라고 하니까요.', "Land two fish off the breakwater. One, people call luck."),
        line(P, '그다음엔요?', 'And then?'),
        line(N, '구경 오는 애한테 대를 쥐여 주세요. 손에 쥐어 봐야 알아요.', "Put a rod in the hands of whoever comes to watch. You only know once you've held one."),
      ], {
        choices: [
          opt('show', '좋아요. 낚는 모습을 보여 줘요', "All right. Let's show them", {
            say: ['좋아요. 전단보다 낚는 모습이 낫다는 거, 보여 줘요.', "All right. Let's show them that catching fish beats flyers."],
            end: endTalk({ accept: true, offer: 'show_catch',
              lineKo: '역시 어른 부원! 두 마리요. 구경 오는 애 있으면 바로 대 쥐여 주세요.',
              lineEn: "That's my adult member! Two fish. If anyone comes to watch, put a rod in their hands right away." }),
            note: ['전단 대신 낚는 모습을 보여 주기로 했다. 방파제에서 두 마리를 올리고, 구경 오는 학생에게 대를 쥐여 줄 것.',
              "We'd show them fishing instead of flyers: land two off the breakwater, then put a rod in the hands of whoever came to watch."] }),
          opt('members', '몇 명이 돼야 안 없어져요?', 'How many members do you need?', { next: 'members' }),
          opt('sua', '하수아 씨는 서운하지 않을까요?', "Won't Sua be hurt?", {
            say: ['전단 만든 하수아 씨는 서운하지 않을까요?', "Won't Sua be hurt? She made those flyers."], next: 'sua' }),
        ],
        note: ['방파제부가 부원이 모자라 없어질지도 모른다고 했다. 하수아 씨가 전단을 만들어 왔지만, 배누리 씨는 낚는 걸 보여 주면 된다고 우겼다.',
          "The breakwater club might be shut down for lack of members. Sua had made flyers, but Nuri insisted that showing people us catching fish would do it."],
      }),
      members: scene([
        line(N, '넷이요. 지금 셋이거든요. 저랑 수아랑 진주.', "Four. Right now we're three. Me, Sua and Jinju."),
        line(P, '한 명만 더 있으면 되는 거네요.', 'So you only need one more.'),
        line(N, '부실이래 봐야 창고지만, 거기 대가 다 있어요. 부가 없어지면 그 대들도 갈 데가 없어요. 한 명만 더요.', "Our clubroom's just a storeroom, but all the rods are in there. If the club goes, those rods have nowhere to go. Just one more."),
      ], {
        choices: [
          opt('one_more', '한 명, 같이 데려와 봐요', "Let's bring in that one", {
            end: endTalk({ accept: true, offer: 'ask_members' }),
            note: ['넷이 안 되면 부가 없어진다고 했다. 지금은 배누리 씨, 하수아 씨, 모진주 씨 셋. 창고 부실의 대들을 위해서라도 한 명만 더 데려오기로 했다.',
              "Below four members, the club goes. Right now it's Nuri, Sua and Jinju. For the sake of the rods in the storeroom, if nothing else, we'd bring in one more."] }),
          opt('if_blank', '애들 앞에서 못 잡으면 망신인데요', "If I blank in front of them, that's embarrassing", {
            say: ['그런데 애들 앞에서 못 잡으면 오히려 망신인데요.', "But if I catch nothing in front of them, it'll be embarrassing."], next: 'blank' }),
        ],
        note: ['부가 남으려면 넷이 있어야 하는데, 지금은 셋이라고 했다.', "The club needs four to survive, and right now it has three."],
      }),
      blank: scene([
        act(N, 'laugh'),
        line(N, '그럼 같이 망신당해요! 저도 옆에서 던질게요.', "Then we'll be embarrassed together! I'll be casting right beside you."),
        line(N, '사실 못 잡아도 괜찮아요. 기다리는 것도 낚시잖아요.', "Honestly, it's fine if we catch nothing. Waiting is part of fishing too."),
        line(N, '진짜 중요한 건 구경 온 애가 대를 잡아 보는 거예요. 손에 쥐어 본 애는 다시 와요. 그건 진짜예요.', "What really matters is the kid who comes to watch getting to hold a rod. Anyone who's held one comes back. That's for real."),
      ], {
        end: endTalk({ accept: true, offer: 'if_blank' }),
        note: ['못 잡으면 망신이라고 했더니, 배누리 씨는 같이 망신당하면 된다고 했다. 중요한 건 구경 온 아이가 대를 잡아 보는 거라고.',
          "When I worried about blanking, Nuri said we'd be embarrassed together. What mattered was the kid who came to watch getting to hold a rod."],
      }),
      sua: scene([
        line(N, '수아요? 조금 삐졌어요.', "Sua? She's sulking a bit."),
        act(N, 'laugh'),
        line(N, '수아는 뭐든 계획부터 세우는 애라, 전단도 진짜 열심히 만들었거든요.', "Sua plans everything first, so she put real work into those flyers."),
        line(P, '그럼 더 미안하겠네요.', 'Then you must feel bad.'),
        line(N, '그래서 오늘 두 마리 올리면 수아한테 제일 먼저 보여 줄 거예요. 전단이 못 한 걸 해냈다고 하면 수아도 웃을 거예요. …아마요.', "That's why, once we land two, Sua's the first person I'll show. If I tell her we did what the flyers couldn't, she'll smile. ...Probably."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_sua' }),
        note: ['하수아 씨는 조금 삐졌다고 했다. 배누리 씨는 두 마리를 올리면 하수아 씨에게 제일 먼저 보여 주겠다고 했다.',
          "Nuri admitted Sua was sulking a little. Once we landed two, Sua would be the first to see them."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-3 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n04_3_done', questId: 'N04-3', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        act(N, 'laugh'),
        line(N, '한 명 들어왔어요!', "We got one!"),
        line(P, '정말요?', 'Really?'),
        line(N, '대 쥐여 준 그 애요. 내일 신청서 들고 온대요.', "The kid you gave the rod to. They're bringing the form tomorrow."),
        line(P, '손이 엄청 떨리던 그 친구 말이죠.', 'The one whose hands were shaking so much.'),
        line(N, '네! 넷이 됐어요. 부가 남았어요. 부장으로서 감사합니다!', "Yes! We're four now. The club survives. As captain — thank you!", { act: 'nod' }),
      ], {
        choices: [
          opt('teach', '그 친구, 제가 조금 더 봐 줘도 될까요?', 'Could I keep teaching that kid a bit?', { next: 'teach' }),
          opt('pay', '부 예산에서 품삯이 나오나요?', 'Is there pay in the club budget?', {
            end: endTalk({ complete: 'pay',
              lineKo: '예산… 라면값 정도요. 봉투는 수아가 접었어요. 각이 칼 같죠? 부 장부에도 적었어요. 어른 부원 지도비, 라면 한 봉지 값.',
              lineEn: "Budget... about the price of ramyeon. Sua folded the envelope. Look how sharp the corners are. I wrote it in the club ledger too: Adult Member coaching fee, one pack of ramyeon." }),
            note: ['품삯을 물었더니 배누리 씨는 라면값 정도라며 하수아 씨가 접은 봉투를 건넸다. 부 장부에도 적었다고 했다.',
              "When I asked about pay, Nuri handed me an envelope Sua had folded — about the price of ramyeon. She'd entered it in the club ledger."] }),
          opt('decline', '부가 남았으면 그걸로 됐어요', 'The club surviving is enough', { next: 'decline' }),
          opt('sua_flyers', '하수아 씨 전단은 다음 학기에 붙여요', "Let's put up Sua's flyers next term", {
            say: ['하수아 씨가 만든 전단, 버리지 말고 다음 학기에 붙여요.', "Don't throw away Sua's flyers. Let's put them up next term."],
            end: endTalk({ complete: 'sua_flyers',
              lineKo: '수아가 들으면 울어요. 감동해서요. 사실 전단도 좋았어요. 그림이 진짜 귀여웠거든요. 이번엔 낚는 걸로 한 명, 다음엔 전단으로 한 명. 그럼 다섯이에요!',
              lineEn: "Sua will cry when she hears. Happy tears. Honestly, the flyers were good. The drawings were really cute. This time one member from fishing, next time one from flyers. That makes five!" }),
            note: ['하수아 씨의 전단을 다음 학기에 붙이자고 했다. 배누리 씨는 하수아 씨가 감동해서 울 거라며, 다음엔 전단으로 한 명 더 데려오자고 했다.',
              "I suggested putting up Sua's flyers next term. Nuri said Sua would cry happy tears, and next time the flyers would bring in one more."] }),
        ],
        note: ['구경 온 아이가 입부하겠다고 했다. 대를 쥐여 주자 손이 떨리던 아이였다. 방파제부는 넷이 되어 남았다.',
          "The kid who came to watch said they'd join — the one whose hands shook when I gave them the rod. The breakwater club made four and survived."],
      }),
      teach: scene([
        line(N, '부원 지도 어른! 그럼 저희도 배우는 거잖아요.', "A grown-up coach for the club! Then we get to learn too."),
        line(N, '그 애 이름은 물어봤어요?', 'Did you ask the kid their name?'),
        line(P, '…아직요.', '...Not yet.'),
        line(N, '다음엔 꼭 물어봐 주세요. 이름 불러 가면서 가르치면 금방 늘어요. 신입은 첫 달이 제일 중요하대요.', "Ask next time, okay? If you use their name while teaching, they pick it up fast. They say a newbie's first month matters most."),
      ], {
        end: endTalk({ complete: 'teach' }),
        note: ['그 아이를 조금 더 봐 주겠다고 했다. 배누리 씨는 다음엔 꼭 이름부터 물어보라고 했다. 이름을 불러 가며 가르치면 금방 는다고.',
          "I offered to keep coaching the kid. Nuri told me to ask their name first next time — teach someone by name and they improve fast."],
      }),
      decline: scene([
        line(N, '…부장 울어요.', "...The captain's going to cry.", { act: 'look_away' }),
        line(N, '진짜 우는 거 아니에요. 바닷바람 때문이에요.', "I'm not really crying. It's the sea wind."),
        line(N, '그 애 손 떨리던 거, 저도 봤어요. 다음엔 그 애가 다른 애 손에 대를 쥐여 줄 거예요.', "I saw that kid's hands shaking too. Next time, they'll be the one putting a rod in someone else's hands."),
      ], {
        end: endTalk({ complete: 'decline' }),
        note: ['부가 남았으면 됐다고 했다. 배누리 씨는 바닷바람 탓이라며 눈가를 훔쳤다. 다음엔 그 아이가 다른 아이 손에 대를 쥐여 줄 거라고.',
          "I said the club surviving was enough. Nuri wiped her eyes and blamed the sea wind. Next time, she said, that kid would put a rod in someone else's hands."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-4 「원정 도시락」 — 받는 자리(부산)
  // ═══════════════════════════════════════════
  {
    id: 'n04_4_offer', questId: 'N04-4', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '어른 부원님! 부산이에요, 부산!', "Adult Member! It's Busan! Busan!", { act: 'look_sea' }),
        line(P, '첫 원정이라더니, 진짜 왔네요.', 'You said first away trip — and here you are.'),
        line(N, '네! 근데 수아는 벌써 도시락 뚜껑 열었어요.', "Yep! Though Sua's already opened her lunchbox."),
        line(P, '낚기도 전에요?', 'Before we even fish?'),
        line(N, '원정의 기본은 도시락이래요. 수아 말로는요.', "Apparently the lunchbox is the foundation of any away trip. According to Sua."),
        act(N, 'laugh'),
        line(N, '그래서 말인데요, 어른 부원이 학생들보다 먼저 낚아야죠.', "So here's the thing — the adult member has to catch one before the students."),
        line(P, '제가요?', 'Me?'),
        line(N, '네. 어른 체면이 있잖아요. 아, 진주는 빼고요. 진주는 반칙이에요.', "Yep. Grown-up pride and all. Oh — not counting Jinju. Jinju's cheating."),
      ], {
        choices: [
          opt('serious', '체면이 걸렸으니 진지하게 갈게요', "My pride's on the line — I'll take it seriously", {
            say: ['좋아요. 어른 체면이 걸렸으니 진지하게 갈게요.', "All right. My grown-up pride's on the line, so I'm taking this seriously."], next: 'serious' }),
          opt('cheating', '모진주 씨가 왜 반칙이에요?', 'Why is Jinju cheating?', {
            say: ['모진주 씨가 왜 반칙이에요? 그렇게 잘 낚아요?', "Why is Jinju cheating? Is she that good?"], next: 'cheating' }),
          opt('funds', '원정 경비는 어떻게 했어요?', 'How did you pay for the trip?', {
            say: ['원정 경비는 어떻게 했어요? 부산까지 차비가 꽤 들었을 텐데요.', "How did you pay for the trip? Getting to Busan can't have been cheap."], next: 'funds' }),
        ],
        note: ['방파제부의 첫 원정으로 부산에 왔다. 하수아 씨는 벌써 도시락을 열었고, 배누리 씨는 어른 부원이 학생들보다 먼저 한 마리를 낚아야 한다고 했다. 모진주 씨는 반칙이라 빼고.',
          "The breakwater club's first away trip brought us to Busan. Sua had already opened her lunchbox, and Nuri declared the adult member had to land one before the students — not counting Jinju, who was cheating."],
      }),
      serious: scene([
        line(N, '오, 진지 모드! 그럼 도시락은 낚고 나서 드세요.', "Ooh, serious mode! Then save your lunch for after you catch something."),
        line(N, '여기 낚시하시는 분들이 그러는데 부산은 물살이 세대요. 채비 무겁게 하세요.', "The people fishing here say the current in Busan is strong. Rig heavy."),
        line(P, '무겁게요.', 'Heavy. Okay.'),
        line(N, '진주는 벌써 바꿨어요.', "Jinju's already switched."),
      ], {
        end: endTalk({ accept: true, offer: 'serious_mode' }),
        note: ['진지하게 하겠다고 했다. 부산은 물살이 세니 채비를 무겁게 하라고 했다. 모진주 씨는 벌써 바꿨다고.',
          "I said I'd take it seriously. Busan's current is strong, so rig heavy, Nuri said. Jinju had already switched."],
      }),
      cheating: scene([
        line(N, '진주는 던지기 전에 물부터 봐요. 한참 보다가 딱 한 번 던져서 바로 낚아요.', "Jinju watches the water before she casts. She looks for ages, casts exactly once, and catches."),
        line(P, '한 번에요?', 'In one?'),
        line(N, '저는 열 번 던져서 한 번 낚는데, 진주는 한 번 던져서 한 번이에요. 그러니까 반칙이죠.', "I cast ten times to catch one. Jinju casts once and catches one. That's cheating."),
        line(P, '(모진주 씨는 벌써 채비를 물에 넣었다.)', '(Jinju already has her rig in the water.)'),
        line(N, '어른 부원님은 저랑 수아만 이기면 돼요.', "You only have to beat me and Sua."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_cheating' }),
        note: ['모진주 씨는 던지기 전에 한참 물을 보다가, 딱 한 번 던져서 바로 낚는다고 했다. 그래서 반칙이라고.',
          "Jinju studies the water for ages before casting, then casts exactly once and catches. Hence, cheating."],
      }),
      funds: scene([
        line(N, '부비 탈탈 털었어요. 김밥도 부비로 샀고요. 나머지는 각자 용돈이요.', "We emptied the club fund. The gimbap came out of it too. Everything else is our own pocket money."),
        line(N, '그래서 꼭 낚아야 돼요. 빈손으로 가면 부 장부에 원정비만 남잖아요. 그건 너무 슬퍼요.', "So we have to catch something. If we go home empty-handed, all the ledger shows is the trip cost. That's too sad."),
      ], {
        choices: [
          opt('no_empty', '그럼 빈손으로는 안 가요', "Then we won't go home empty-handed", {
            end: endTalk({ accept: true, offer: 'ask_funds' }),
            note: ['원정 경비는 부비를 탈탈 털고 각자 용돈을 보탰다고 했다. 빈손으로 돌아가지 않기로 했다.',
              "They'd emptied the club fund and chipped in their own pocket money for the trip. We'd make sure not to go home empty-handed."] }),
          opt('bet', '그럼 내기해요. 진 사람이 짐 들기', "Let's bet. Loser carries the bags", {
            say: ['그럼 내기해요. 학생들보다 먼저 못 낚으면, 진 사람이 돌아갈 때 짐 들기예요.', "Then let's make a bet. If I don't catch one before the students, the loser carries the bags home."], next: 'bet' }),
        ],
        note: ['원정비는 부비와 각자 용돈으로 마련했다고 했다. 빈손으로 가면 장부에 원정비만 남는다고.', "The trip was paid from the club fund and their own pocket money. Go home empty-handed and the ledger shows only the cost."],
      }),
      bet: scene([
        line(N, '콜! 제 가방엔 대가 세 개 들었어요. 각오하세요.', "Deal! My bag's got three rods in it. Brace yourself."),
        line(N, '아, 진주는 내기에 안 쳐요. 진주가 이기는 건 당연한 거니까요. 어른 부원님 상대는 저랑 수아예요.', "Oh, Jinju doesn't count. Her winning is a given. Your opponents are me and Sua."),
      ], {
        end: endTalk({ accept: true, offer: 'loser_carries' }),
        note: ['진 사람이 짐을 들기로 내기를 걸었다. 배누리 씨 가방엔 대가 세 개 들었다고. 모진주 씨는 내기에서 빠졌다.',
          "We bet that the loser carries the bags. Nuri's had three rods in it. Jinju was left out of the bet."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-4 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n04_4_done', questId: 'N04-4', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '먼저 낚으셨네요! 진주 다음이지만요.', "You caught one first! After Jinju, but still.", { act: 'look_up' }),
        line(P, '모진주 씨는 정말 제일 먼저 올리더라고요.', 'Jinju really did land hers first of all.'),
        line(N, '그러니까 반칙이라니까요.', "Told you she's cheating."),
        line(N, '그래도 원정 성공이에요! 도시락도 다 먹었고요.', "Still, the trip's a success! And we finished the lunchboxes."),
        line(P, '김밥은 하수아 씨가 끝까지 세던데요.', 'Sua was counting the gimbap right to the end.'),
        line(N, '수아는 하나라도 모자라면 큰일 나는 줄 알아요.', "Sua thinks the world ends if even one piece goes missing."),
      ], {
        choices: [
          opt('lesson', '모진주 씨 자세를 부 교본으로 만들어 봐요', "Turn Jinju's form into a club manual", {
            say: ['모진주 씨 캐스팅을 뒤에서 봤어요. 그 자세, 부 교본으로 만들어 봐요.', "I watched Jinju cast from behind. Make her form into a club manual."],
            aff: { [J]: 0.03 }, next: 'lesson' }),
          opt('pay', '원정 인솔비는 받을게요', "I'll take a trip-leader's fee", {
            end: endTalk({ complete: 'pay',
              lineKo: '있어요! 부비 남은 거… 김밥값 빼고요. 인솔비는 원래 지도 선생님 몫인데, 이번 원정은 어른 부원님이 인솔했으니까요. 영수증도 써 드릴까요? 수아가 쓰면 글씨가 예뻐요.',
              lineEn: "We've got some! What's left of the club fund... minus the gimbap. A leader's fee usually goes to the club teacher, but you led this trip. Want a receipt? Sua's handwriting is really pretty." }),
            note: ['인솔비를 받겠다고 했다. 배누리 씨는 김밥값을 뺀 부비를 털어 주며 영수증까지 써 주겠다고 했다.',
              "I said I'd take a leader's fee. Nuri handed over what was left of the club fund after the gimbap, and even offered a receipt."] }),
          opt('decline', '다들 재밌었으면 그걸로 됐어요', 'If everyone had fun, that is enough', {
            end: endTalk({ complete: 'decline',
              lineKo: '어른 부원 최고! 원정 사진, 학교 게시판에 걸 거예요. 다른 반 애들이 누구냐고 물어보면 우리 부 어른 부원이라고 할 거예요. 다음 원정도 꼭 같이 가요. 그땐 진주보다 먼저 낚기!',
              lineEn: "Best adult member! The trip photo's going on the school noticeboard. If kids from other classes ask who you are, I'll say our club's adult member. Come on the next trip too. Next time, beat Jinju!" }),
            note: ['다들 재밌었으면 됐다고 했다. 배누리 씨는 원정 사진을 학교 게시판에 걸겠다며, 다음 원정엔 모진주 씨보다 먼저 낚으라고 했다.',
              "I said everyone having fun was enough. Nuri said the trip photo was going on the school noticeboard — and next trip, I'd better beat Jinju."] }),
          opt('tell_jinju', '오늘은 제가 졌다고 전해 줘요', 'Tell Jinju I lost today', {
            say: ['모진주 씨한테 전해 줘요. 오늘은 제가 졌다고요.', "Pass it on to Jinju for me. Tell her I lost today."], next: 'tell' }),
        ],
        note: ['학생들보다 먼저 한 마리를 올렸다. 모진주 씨 다음이었지만. 원정은 성공이었고 도시락도 다 먹었다.',
          'I landed one before the students — after Jinju, but still. The trip was a success, and the lunchboxes were empty.'],
      }),
      lesson: scene([
        line(N, '교본! 좋아요! 진주가 싫어할 텐데…', "A manual! Love it! Jinju's going to hate it, though..."),
        line(N, '제목은 진주 몰래 정할게요. 말없이 던지는 법. 표지는 진주 뒷모습이에요.', "I'll pick the title behind her back. How to Cast Without a Word. The cover's a photo of her from behind."),
        line(P, '앞모습은요?', 'Why not the front?'),
        line(N, '찍으면 화내거든요. 첫 장엔 어른 부원님 이름도 넣을게요. 아이디어 낸 사람.', "She gets mad if you photograph her face. I'll put your name on the first page too. The one with the idea."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['모진주 씨 캐스팅 자세를 부 교본으로 만들자고 했다. 배누리 씨는 제목을 말없이 던지는 법으로 하고, 첫 장에 내 이름을 넣겠다고 했다.',
          "I suggested making Jinju's casting form into a club manual. Nuri would title it How to Cast Without a Word and put my name on the first page."],
      }),
      tell: scene([
        line(N, '직접 하세요! …아, 진주는 직접 하면 도망가지. 알았어요, 전할게요.', "Tell her yourself! ...Ah, she'd run off if you did. Okay, I'll tell her."),
        line(P, '(배누리 씨가 달려가 귓속말을 하자, 모진주 씨가 이쪽을 한 번 봤다.)', '(Nuri runs over and whispers to her, and Jinju glances my way once.)'),
        line(N, '봤어요? 진주가 봤어요. 그게 진주식 대답이에요. 다음엔 안 봐준다는 뜻일 거예요, 아마.', "Did you see? Jinju looked. That's her way of answering. Probably means she won't go easy next time."),
      ], {
        end: endTalk({ complete: 'tell_jinju' }),
        note: ['오늘은 내가 졌다고 모진주 씨에게 전해 달라고 했다. 귓속말을 들은 모진주 씨가 이쪽을 한 번 봤다. 그게 대답이라고 했다.',
          "I asked Nuri to tell Jinju I'd lost today. After the whisper, Jinju glanced my way once — that was her answer, Nuri said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-5 「진로 상담」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n04_5_offer', questId: 'N04-5', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '어른 부원님. 잠깐 시간 있어요?', 'Adult Member. Do you have a minute?', { act: 'look_away' }),
        line(P, '네. 무슨 일 있어요? 목소리가 평소랑 다르네요.', "Sure. Is something wrong? You don't sound like yourself."),
        line(N, '…수산고요.', '...Fisheries high school.'),
        line(P, '수산고?', 'Fisheries high school?'),
        line(N, '갈까 말까 고민 중이에요.', "I'm trying to decide whether to go."),
        act(N, 'silence'),
        line(N, '이런 얘기를 할 어른이 한 명 필요한데… 주변에 없어요.', "I need one grown-up to talk this through with... and there isn't one around me."),
        line(P, '…', '...'),
        line(N, '그래서 어른 부원님이요. 청초고 앞 벤치로 와 줄래요? 거기서 다 말할게요.', "So — you. Will you come to the bench in front of Cheongcho High? I'll tell you everything there."),
        line(P, '(부장이 아니라, 열일곱 살 얼굴이다.)', "(That isn't the captain's face. It's a seventeen-year-old's.)"),
      ], {
        choices: [
          opt('hear_out', '끝까지 들을게요. 천천히 말해요', "I'll hear you out. Take your time", { next: 'hear_out' }),
          opt('school', '수산고에 가면 뭘 배워요?', 'What do you learn at fisheries school?', { next: 'school' }),
          opt('home', '집에는 얘기해 봤어요?', 'Have you talked to your family?', {
            say: ['주변에 어른이 없다니요. 집에는 얘기해 봤어요?', "No grown-ups around? Have you talked to your family?"], next: 'home' }),
        ],
        note: ['배누리 씨가 평소와 다른 목소리로 수산고 진학을 고민 중이라고 했다. 이야기를 들어 줄 어른이 한 명 필요하다며, 청초고 앞 벤치로 와 달라고 했다.',
          "In a voice unlike her usual one, Nuri said she was torn about going to fisheries high school. She needed one grown-up to listen, and asked me to meet her at the bench in front of Cheongcho High."],
      }),
      hear_out: scene([
        line(N, '…네.', '...Okay.', { act: 'nod' }),
        line(N, '부장일 때는 말이 잘 나오는데, 제 얘기는 이상하게 안 나와요.', "When I'm being captain the words come easy. But my own stuff just won't come out."),
        line(N, '말하다가 멈춰도 그냥 기다려 주세요. 끝까지 하면… 뭔가 정해질 것 같아서요.', "If I stop halfway, just wait. I feel like if I get to the end... something will settle."),
      ], {
        end: endTalk({ accept: true, offer: 'hear_out' }),
        note: ['끝까지 듣겠다고 했다. 배누리 씨는 제 얘기는 이상하게 말이 안 나온다며, 멈춰도 기다려 달라고 했다.',
          "I promised to hear her out. Nuri said her own story never comes out easily — if she stopped, I should just wait."],
      }),
      school: scene([
        line(N, '배 타는 거, 고기 다루는 거, 바다 날씨 보는 거요. 졸업하면 바로 배를 탈 수도 있대요.', "Working on boats, handling fish, reading sea weather. They say you can go straight onto a boat after you graduate."),
        line(P, '방파제부 부장한테 딱 맞는 곳 같은데요.', 'Sounds made for the breakwater club captain.'),
        line(N, '근데 그게 제가 하고 싶은 건지, 그냥 방파제가 좋아서 그런 건지 모르겠어요.', "But I don't know if it's what I actually want, or if I just like the breakwater.", { act: 'look_sea' }),
        line(N, '그 얘기가 하고 싶었어요. 벤치에서요.', "That's what I wanted to talk about. At the bench."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_school' }),
        note: ['수산고에서는 배 타는 법, 고기 다루는 법, 바다 날씨 보는 법을 배운다고 했다. 그게 하고 싶은 건지, 방파제가 좋아서인지 모르겠다고.',
          "At fisheries school you learn boats, fish handling and sea weather. She didn't know if she wanted that, or just loved the breakwater."],
      }),
      home: scene([
        line(N, '…있죠, 집에. 근데 이 얘기를 할 수 있는 어른은 없어요.', "...There's family, sure. But there's no grown-up I can say this to."),
        line(N, '집에서 하면 결정이 돼 버려요. 어른 부원님한테 하면 그냥 얘기가 되고요.', "If I say it at home, it turns into a decision. If I say it to you, it stays a conversation."),
        line(P, '결정 말고 얘기가 필요한 거군요.', 'So you need a conversation, not a decision.'),
        line(N, '네. 그거예요.', "Yes. That's it.", { act: 'nod' }),
      ], {
        choices: [
          opt('just_talk', '그럼 얘기로 들을게요', "Then I'll listen to it as a conversation", {
            end: endTalk({ accept: true, offer: 'no_adults' }),
            note: ['집에서 말하면 결정이 돼 버린다고 했다. 결정이 아니라 얘기가 필요하다는 배누리 씨의 말을, 얘기로 듣기로 했다.',
              "Telling her family would turn it into a decision, she said. She needed a conversation, not a decision — so that's how I'd listen."] }),
          opt('first_time', '저도 어른 노릇은 처음인데 괜찮을까요?', "I've never played the grown-up before — is that okay?", { next: 'first_time' }),
        ],
        note: ['집에서 이 얘기를 하면 결정이 돼 버린다고 했다.', "If she raised it at home, it would turn into a decision."],
      }),
      first_time: scene([
        line(N, '괜찮아요. 처음이면 더 좋아요. 처음인 사람은 정답을 안 주거든요.', "It's fine. Better, even. People doing it for the first time don't hand you the right answer."),
        act(N, 'laugh'),
        line(N, '정답 주는 어른은 학교에도 학원에도 많아요. 저는 그냥 들어 주는 어른이 한 명 필요해요.', "There are plenty of grown-ups with answers, at school and at cram school. I just need one who'll listen."),
        line(N, '방파제에서도 그랬잖아요. 진주한테요.', "You did that on the breakwater. With Jinju."),
      ], {
        end: endTalk({ accept: true, offer: 'first_time_adult' }),
        note: ['나도 어른 노릇은 처음이라고 했다. 배누리 씨는 처음인 사람은 정답을 안 줘서 더 좋다며, 모진주 씨에게 했던 것처럼 들어만 달라고 했다.',
          "I admitted I'd never played the grown-up. Nuri said that was better — first-timers don't hand out answers. She wanted me to just listen, like I had with Jinju."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-5 — 끝내는 자리(진로 이야기를 끝까지 들은 뒤)
  // ═══════════════════════════════════════════
  {
    id: 'n04_5_done', questId: 'N04-5', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        act(N, 'sigh'),
        line(N, '…다 말했어요.', "...That's everything."),
        line(P, '끝까지 들었어요.', 'I heard all of it.'),
        line(N, '들어 줘서 됐어요. 진짜로요.', "You listening — that's enough. Really."),
        line(N, '결정은 제가 할게요. 그래도… 들어 준 사람은 어른 부원님이에요.', "I'll make the decision myself. But... you're the one who listened."),
        line(P, '(조언은 하지 않았다. 지금이라도 해야 할까.)', "(I didn't give any advice. Should I, now?)"),
      ], {
        choices: [
          opt('listen', '결정은 배누리 씨 몫이에요', "The decision's yours, Nuri", {
            say: ['결정은 배누리 씨 몫이에요. 어느 쪽이든, 부장은 부장이고요.', "The decision's yours, Nuri. Either way, a captain is a captain."], next: 'listen' }),
          opt('advise', '제 생각엔 수산고가 맞아요', 'I think fisheries school is right', {
            say: ['제 생각엔 수산고가 맞아요. 배누리 씨 눈은 바다를 보니까요.', "I think fisheries school is right. Your eyes are always on the sea."], next: 'advise' }),
          opt('pay', '상담비는 받아야겠어요. 농담이에요', "I'll be charging for the session. Kidding", { next: 'pay' }),
          opt('own_story', '저도 아무것도 모르고 속초에 왔어요', 'I came to Sokcho knowing nothing too', {
            say: ['저도 아무것도 모르고 속초에 왔어요. 와 보니까 길이 생기더라고요.', "I came to Sokcho knowing nothing too. Once I got here, a path opened up."], next: 'own_story' }),
        ],
        note: ['청초고 앞 벤치에서 배누리 씨의 진로 이야기를 끝까지 들었다. 조언은 하지 않았다. 다 듣고 나서 배누리 씨는 들어 줘서 됐다고, 결정은 자기가 하겠다고 했다.',
          "On the bench in front of Cheongcho High, I heard Nuri's whole story about her future. I gave no advice. When she finished, she said my listening was enough — she'd make the decision herself."],
      }),
      listen: scene([
        line(N, '…네.', '...Okay.', { act: 'nod' }),
        line(N, '{player} 씨, 고마워요. 진짜로요.', "{player}, thank you. I mean it."),
        line(N, '결정은 제가 했는데, 혼자 한 것 같지는 않아요. 그게 좋아요.', "I made the decision, but it doesn't feel like I made it alone. I like that."),
        line(N, '수산고 가서도 방파제부는 안 잊을게요. 낚으면 먹는다.', "Even at fisheries school, I won't forget the breakwater club. Catch it and eat it."),
      ], {
        end: endTalk({ complete: 'listen' }),
        note: ['결정은 배누리 씨 몫이라고 했다. 배누리 씨는 처음으로 내 이름을 편하게 불렀다. 결정은 자기가 했지만 혼자 한 것 같지는 않다고 했다.',
          "I told Nuri the decision was hers. For the first time, she called me by my name without hesitating. She'd decided herself, she said, but it didn't feel like she'd done it alone."],
      }),
      advise: scene([
        line(N, '…그렇게 말해 주는 어른이 처음이에요.', "...You're the first grown-up to say that to me.", { act: 'look_up' }),
        line(N, '바다를 본다, 그 말 적어 둘게요. 나중에 힘들 때 꺼내 보려고요.', "Your eyes are on the sea — I'm writing that down. To take out when things get hard."),
        line(N, '어른 부원님 탓 안 할게요. 고른 건 저예요. 어른 부원님은 등을 조금 밀어 준 거고요.', "I won't blame you. I'm the one who chose. You just gave me a little push."),
        line(P, '(내가 대신 정해 준 것 같아, 마음 한쪽이 조금 무겁다.)', "(Part of me feels heavy, as if I decided it for her.)"),
      ], {
        end: endTalk({ complete: 'advise' }),
        note: ['수산고가 맞다고 말해 줬다. 배누리 씨는 그 말을 적어 두겠다고, 고른 건 자기라고 했다. 그래도 내가 정해 준 것 같아 조금 무거웠다.',
          "I told her fisheries school was right. Nuri said she'd write it down, and that the choice was hers. Still, it felt a little heavy, as if I'd made it for her."],
      }),
      pay: scene([
        act(N, 'laugh'),
        line(N, '…어른들 농담 진짜 재미없어요.', "...Grown-up jokes are really not funny."),
        line(N, '근데 웃었으니까 드릴게요. 웃게 해 준 값이요. 오늘 처음 웃었거든요.', "But I laughed, so here. Payment for making me laugh. It's the first time I've laughed today."),
        line(N, '그러니까 이건 농담 값이 아니라 진짜 상담비예요.', "So this isn't joke money. It's a real counselling fee."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['상담비를 받아야겠다고 농담했다. 배누리 씨는 재미없다면서도 웃었고, 오늘 처음 웃게 해 준 값이라며 진짜 상담비를 건넸다.',
          "I joked about charging for the session. Nuri said it wasn't funny but laughed anyway, and handed me a real fee — for making her laugh for the first time that day."],
      }),
      own_story: scene([
        line(N, '…어른 부원님도요?', '...You too?', { act: 'look_up' }),
        line(N, '몰랐어요. 원래 바다 사람인 줄 알았어요.', "I didn't know. I thought you were born to the sea."),
        line(P, '저도 처음엔 아무것도 몰랐어요.', "I didn't know a thing at first either."),
        line(N, '아무것도 모르고 와도 길이 생기는 거면… 조금 덜 무섭네요.', "If a path opens up even when you come knowing nothing... that's a bit less scary."),
        line(N, '고마워요. 그 얘기, 진로 상담보다 더 상담 같았어요.', "Thank you. That felt more like counselling than the counselling did."),
      ], {
        end: endTalk({ complete: 'own_story' }),
        note: ['나도 아무것도 모르고 속초에 왔다고 털어놓았다. 배누리 씨는 처음으로 고개를 들고 나를 보며, 그렇다면 조금 덜 무섭다고 했다.',
          "I admitted I'd come to Sokcho knowing nothing. Nuri looked up at me for the first time and said that made it a little less scary."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-6 「졸업한 부원들」 — 받는 자리(재개관식 · 셋이 깃발을 들고 왔다)
  // ═══════════════════════════════════════════
  {
    id: 'n04_6_offer', questId: 'N04-6', at: 'offer', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '어른 부원님! 저희 왔어요!', "Adult Member! We're here!", { act: 'look_up' }),
        line(P, '배누리 씨! 다들 왔네요.', "Nuri! You all came."),
        line(N, '깃발 들고요! 청초고 방파제부.', "With the flag! Cheongcho High breakwater club."),
        line(P, '글씨가 많이 바랬네요. 낚으면 먹는다…', "The lettering's really faded. Catch it and eat it..."),
        line(N, '그래도 우리 깃발이에요. 재개관식이잖아요. 2층에 걸어 주세요.', "It's still our flag. It's the reopening, right? Hang it on the second floor."),
        line(P, '2층 창가요?', 'By the second-floor window?'),
        line(N, '네, 바다 보이는 데요. 근데 걸기 전에 하나 해요. 옛날처럼 나란히 서서 낚기.', "Yep, where you can see the sea. But before we hang it, let's do one thing. Stand in a row and fish, like old times."),
        line(N, '다 같이 한 마리씩이요. 그래야 깃발이 진짜 우리 거 같잖아요.', "One fish each, all of us. That's what'll make the flag feel like ours."),
        line(N, '아, 그리고 진주가 배 탄대요. 어른 부원님 배는 아니래요.', "Oh, and Jinju's going to work on a boat. Not your boat, she says."),
      ], {
        choices: [
          opt('best_spot', '좋아요. 제일 잘 보이는 데 걸어요', "Great. Let's hang it where it shows best", {
            end: endTalk({ accept: true, offer: 'best_spot',
              lineKo: '네! 그 전에 나란히 한 마리씩이요. 어른 부원님도 같이요.',
              lineEn: "Yes! But first, one fish each, side by side. You too." }),
            note: ['깃발은 제일 잘 보이는 데 걸기로 했다. 그 전에 옛날처럼 나란히 서서 한 마리씩 낚기로 했다.',
              "We'd hang the flag where it showed best — but first, stand in a row and catch one each, like old times."] }),
          opt('boat', '모진주 씨가 배를 타요? 무슨 배요?', "Jinju's working on a boat? Which one?", { next: 'boat' }),
          opt('catch_up', '하수아 씨는 요즘 어때요?', 'How is Sua these days?', { next: 'catch_up' }),
        ],
        note: ['재개관식에 졸업한 방파제부 셋이 바랜 부 깃발을 들고 왔다. 2층 창가에 깃발을 걸어 달라며, 그 전에 옛날처럼 나란히 서서 한 마리씩 낚자고 했다. 모진주 씨가 배를 탄다는 말도 들었다.',
          "The three graduated members of the breakwater club came to the reopening with their faded club flag. They asked me to hang it by the second-floor window — but first, to stand in a row and catch one each, like old times. I also heard Jinju was going to work on a boat."],
      }),
      boat: scene([
        line(N, '…그건 진주한테 직접 물어보세요. 제가 말하면 진주가 삐져요.', "...Ask Jinju yourself. If I tell you, she'll sulk.", { act: 'look_away' }),
        line(P, '모진주 씨, 정말이에요?', 'Jinju, is it true?'),
        line(J, '…네.', '...Yes.', { act: 'nod' }),
        line(N, '봤죠? 하나만 말하자면, 어른 부원님 배는 아니래요. 그 말은 꼭 전해 달래요. 무슨 뜻인지는 저도 몰라요.', "See? I'll tell you one thing: it's not your boat. She made me promise to pass that on. No idea what it means."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_boat' }),
        note: ['모진주 씨에게 배를 타느냐고 물었더니 짧게 네, 하고 끄덕였다. 내 배는 아니라는 말을 꼭 전해 달랬다고 배누리 씨가 덧붙였다.',
          "When I asked Jinju about the boat, she just nodded and said yes. Nuri added that Jinju had insisted she pass on one thing: it isn't my boat."],
      }),
      catch_up: scene([
        line(N, '수아는 대학 가서도 계획 세우고 있어요. 오늘 깃발 거는 순서도 수아가 짰어요.', "Sua's still making plans, even at university. She drew up today's flag-hanging schedule too."),
        line(P, '(멀리서 하수아 씨가 수첩을 흔든다.)', '(In the distance, Sua waves her notebook.)'),
        line(N, '저는 수산고 3학년이요. 배 매듭은 이제 어른 부원님보다 잘 묶을걸요?', "I'm a third-year at fisheries school. I bet I tie boat knots better than you now."),
      ], {
        choices: [
          opt('knots', '나중에 매듭 시합해요', "Let's have a knot contest sometime", {
            say: ['그럼 나중에 매듭 시합해요.', "Then let's have a knot contest sometime."],
            end: endTalk({ accept: true, offer: 'ask_sua_nuri',
              lineKo: '좋아요! 진 사람이 라면 사기. 오늘은 일단 나란히 한 마리씩이요.',
              lineEn: "You're on! Loser buys ramyeon. For today, though — one fish each, side by side." }),
            note: ['하수아 씨는 대학에서도 계획을 세우고, 배누리 씨는 수산고 3학년이 됐다. 나중에 매듭 시합을 하기로 했다. 진 사람이 라면을 산다.',
              "Sua is still planning things at university, and Nuri is a third-year at fisheries school. We agreed to a knot contest someday — loser buys ramyeon."] }),
          opt('old_member', '어른 부원이 이제 늙은 부원이 됐네요', 'The adult member has become an old member', { next: 'old_member' }),
        ],
        note: ['하수아 씨는 대학에 갔고, 배누리 씨는 수산고 3학년이 됐다고 했다.', 'Sua had gone to university, and Nuri was now a third-year at fisheries school.'],
      }),
      old_member: scene([
        act(N, 'laugh'),
        line(N, '하하, 늙은 부원이라니요! 우리 부엔 그런 거 없어요. 어른 부원은 어른 부원이에요.', "Ha, old member! There's no such thing in our club. An adult member is an adult member."),
        line(N, '저희도 이제 거의 어른이에요. 근데 여기 오니까 다시 열일곱 같아요. 방파제 냄새 때문인가 봐요.', "We're almost grown-ups ourselves now. But coming here, I feel seventeen again. Must be the smell of the breakwater."),
      ], {
        end: endTalk({ accept: true, offer: 'old_member' }),
        note: ['이제 늙은 부원이 됐다고 했더니, 배누리 씨는 깃발 봉으로 내 어깨를 톡 치며 어른 부원은 어른 부원이라고 했다.',
          "When I called myself an old member now, Nuri tapped my shoulder with the flagpole and said an adult member is an adult member."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N04-6 — 끝내는 자리(깃발을 2층에 건 뒤)
  // ═══════════════════════════════════════════
  {
    id: 'n04_6_done', questId: 'N04-6', at: 'complete', npcId: N, start: 'start',
    nodes: {
      start: scene([
        line(N, '걸렸다! 낚으면 먹는다!', "It's up! Catch it and eat it!", { act: 'look_up' }),
        line(P, '2층 창가에서 바다 쪽으로 펄럭이네요.', "It's flying from the second-floor window, out towards the sea."),
        line(N, '밖에서도 글자가 보여요. 수아가 내려가서 확인하고 왔어요.', "You can read it from outside. Sua went down to check."),
        line(J, '…{player} 씨.', '...{player}.', { act: 'look_up' }),
        line(J, '저 배 타요. 어른 부원님 배는 아니지만요.', "I'm going to work on a boat. Not yours, though."),
        line(P, '(모진주 씨가 먼저 말을 걸었다. 처음이다.)', '(Jinju spoke to me first. That has never happened.)'),
        line(N, '들었죠? 진주가 먼저 말했어요! 어른 부원님은 우리 부 어른 부원이에요. 영원히요.', "Did you hear? Jinju spoke first! You're our club's adult member. Forever."),
      ], {
        choices: [
          opt('forever', '영원히 어른 부원. 알겠어요', 'Adult member forever. Understood', { next: 'forever' }),
          opt('jinju', '모진주 씨 배에서 언젠가 같이 낚아요', "Someday, let's fish from Jinju's boat", {
            say: ['모진주 씨. 그 배에서, 언젠가 같이 낚아요.', "Jinju. Someday, let's fish together from that boat."], next: 'jinju' }),
          opt('pay', '깃발 거는 값은 부비에서 나오죠?', 'The club fund pays for flag-hanging, right?', {
            say: ['깃발 거는 값은 부비에서 나오는 거죠?', "Flag-hanging fees come out of the club fund, right?"],
            end: endTalk({ complete: 'pay',
              lineKo: '부비… 이제 없어요, 졸업해서. 그래도 셋이 주머니 털면 라면값은 나와요. 부 장부 마지막 줄에 적을게요. 깃발 거는 값, 라면 한 그릇. 이걸로 장부 끝이에요.',
              lineEn: "The club fund... it's gone, now we've graduated. But if the three of us empty our pockets, there's ramyeon money. I'll write it on the last line of the ledger. Flag-hanging fee, one bowl of ramyeon. That's the end of the ledger." }),
            note: ['깃발 거는 값을 청했더니 셋이 주머니를 털어 라면값을 건넸다. 배누리 씨는 그게 부 장부의 마지막 지출이라고 했다.',
              "When I asked for a flag-hanging fee, the three of them emptied their pockets for ramyeon money. Nuri said it was the last entry the club ledger would ever have."] }),
          opt('teach_me', '수산고에서 배운 거 하나만 알려 줘요', 'Teach me one thing from fisheries school', {
            say: ['수산고에서 배운 거 하나만 알려 줘요. 이번엔 배누리 씨가 선배예요.', "Teach me one thing you learned at fisheries school. This time you're the senior."], next: 'teach_me' }),
        ],
        note: ['부 깃발을 2층 창가에 걸었다. 모진주 씨가 처음으로 먼저 말을 걸어, 배를 탄다고, 내 배는 아니라고 했다. 배누리 씨는 내가 영원히 어른 부원이라고 했다.',
          "We hung the club flag by the second-floor window. Jinju spoke to me first for the first time — she's going to work on a boat, not mine. Nuri said I'd be their adult member forever."],
      }),
      forever: scene([
        line(N, '네! 그럼 이거 달아 주세요. 어른 부원 전용 배지예요. 금색이에요.', "Yes! Then wear this. An adult-member-only badge. It's gold."),
        line(N, '금색은 수아가 칠했고, 진주가 모양을 잡았어요. 저는 이름을 붙였어요. 영원 배지.', "Sua painted the gold, Jinju shaped it, and I named it. The Forever Badge."),
        line(P, '영원 배지요.', 'The Forever Badge.'),
        line(N, '유치하죠? 그래도 달아 주세요. 깃발 밑에서 사진 찍을 때요.', "Cheesy, right? Wear it anyway. For the photo under the flag."),
      ], {
        end: endTalk({ complete: 'forever' }),
        note: ['영원히 어른 부원이 되기로 했다. 셋이 함께 만든 금색 영원 배지를 받아, 깃발 밑에서 사진을 찍을 때 달기로 했다.',
          "I agreed to be their adult member forever. The three of them had made a gold Forever Badge together, and I'd wear it for the photo under the flag."],
      }),
      jinju: scene([
        line(J, '…네. 제 배로요.', '...Yes. On my boat.', { act: 'nod' }),
        line(P, '(모진주 씨가 웃었다. 처음 보는 웃음이다.)', "(Jinju smiled. I'd never seen her smile before.)"),
        line(N, '찍었다! 진주 웃는 거 찍었어요! 이거 부 일지 마지막 장에 붙일 거예요.', "Got it! I got a photo of Jinju smiling! That's going on the last page of the club log."),
        line(N, '진주야, 약속했다? 네 배에서. 우리도 끼워 줘.', "Jinju, you promised, right? On your boat. Let us come too."),
      ], {
        end: endTalk({ complete: 'jinju' }),
        note: ['모진주 씨에게 언젠가 그 배에서 같이 낚자고 했다. 모진주 씨가 제 배로요, 하며 처음으로 웃었고, 배누리 씨가 그 얼굴을 사진으로 남겼다.',
          "I asked Jinju to fish with me from her boat someday. She said, on my boat, and smiled for the first time — and Nuri caught it on camera."],
      }),
      teach_me: scene([
        line(N, '제가 선배요? 와… 그럼 하나만요.', "Me, the senior? Wow... okay, just one thing."),
        line(N, '배에서 쓰는 매듭이요. 고리가 안 조여서 사람 몸에 감아도 돼요.', "A knot we use on boats. The loop doesn't tighten, so you can tie it around a person."),
        line(P, '(깃발 끈으로 천천히 묶어 보인다. 따라 묶어 봤다.)', '(She ties it slowly with the flag cord to show me. I tie one after her.)'),
        line(N, '한 손으로도 묶을 수 있어야 한대요. 다른 손은 배를 잡고 있어야 하니까요.', "You're meant to be able to tie it one-handed. The other hand has to hold on to the boat."),
        line(N, '어른 부원님을 가르치는 날이 오다니. 수아한테 자랑할 거예요.', "The day I get to teach the adult member. I'm bragging to Sua."),
      ], {
        end: endTalk({ complete: 'teach_me' }),
        note: ['이번엔 배누리 씨가 선배가 되어, 고리가 조이지 않아 사람 몸에 감아도 되는 배 매듭을 가르쳐 줬다. 한 손으로도 묶을 수 있어야 한다고.',
          "This time Nuri was the senior. She taught me a boat knot whose loop doesn't tighten, so you can tie it around a person — and you have to be able to tie it one-handed."],
      }),
    },
  },
];
