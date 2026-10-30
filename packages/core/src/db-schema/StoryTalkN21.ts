/**
 * @file StoryTalkN21.ts
 * @description 290차 — N21 「오세찬 — 바다가 넘칠 때」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`.
 *
 * 인물: 오세찬(41 · 해양환경 감시원 — 해파리 · 불가사리를 센다) — 짧은 해요체 · 「~요」로 끊는다 · 웃지 않는다 ·
 *   「규정대로」 · 「장갑 두 겹」 · 「숫자로 남겨야」 · 주인공을 「당신」이라 부른다. 칭찬은 짧게, 대신 수첩에 무언가를 적는다.
 * 순서: 속초 방파제 불가사리(첫 만남) → 부산 만 안쪽 보름달물 → 울산 수매 창구 → 거제 가두리 → 제주 노무라 한 마리
 *   → 울릉 노무라 떼 → 독도 마지막 기록. 때가 있는 편(2 · 4 · 5 · 6)은 옛 미루는 답에 묶인 미루기 끝이 있다.
 * 표시: 새 표시는 없다 — 옛 받는 답 · 보상 답의 표시(choice.n21_…)는 묶인 답이 남긴다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const O = 'oh_sechan';
const P = 'player';

export const TALKS_N21: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N21-1 「해안에 밀려온 별」 — 받는 자리(속초 방파제 · 첫 만남)
  // ═══════════════════════════════════════════
  {
    id: 'n21_1_offer', questId: 'N21-1', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '저기요. 그쪽 발밑, 밟지 마요.', "Excuse me. Watch your feet there. Don't step on them.", { act: 'look_up' }),
        line(P, '네? 아… 이게 다 뭐예요?', "Sorry? Oh... what are all these?"),
        line(O, '불가사리예요. 밤새 방파제 밑으로 밀려왔어요. 저는 이걸 세는 사람이고요.', "Starfish. They washed up under the breakwater overnight. I'm the one who counts them."),
        line(P, '세는 사람이요?', 'The one who counts them?'),
        line(O, '해양환경 감시원이에요. 오세찬이라고 해요. 어디에 몇 마리가 있는지 적어요.', "I'm a marine monitor. Oh Sechan. I write down how many there are, and where."),
        line(O, '좀 주워 줄래요? 세 개면 돼요.', 'Could you pick some up for me? Three will do.'),
        line(P, '줍기만 하면 되는 거예요?', 'I just pick them up?'),
        line(O, '가려서요. 두 종이 섞여 있어요.', 'Sorted. There are two kinds mixed together.'),
        line(O, '팔이 짧고 넓으면 별불가사리, 길고 끝이 위로 젖혀졌으면 아무르불가사리예요.', "Short, wide arms is a bat star. Long arms with the tips curled up is an Amur starfish."),
      ], {
        choices: [
          opt('hands_on', '가리는 법만 알려 주세요', 'Just show me how to tell them apart', {
            say: ['줍는 일이라면 자신 있습니다. 가리는 법만 알려 주세요.', "Picking up is something I can do. Just show me how to tell them apart."], next: 'hands_on' }),
          opt('batstar', '왜 따로 가려요?', 'Why sort them?', {
            say: ['별불가사리는 왜 따로 가려요? 다 같은 불가사리 아니에요?', "Why sort out the bat stars? Aren't they all just starfish?"], next: 'batstar' }),
          opt('pay', '주우면 돈이 나와요?', 'Do you get paid for them?', {
            say: ['불가사리 주우면 돈이 나와요? 그냥 궁금해서요.', 'Do you get paid for picking up starfish? Just curious.'], next: 'pay' }),
        ],
        note: ['방파제 밑에 불가사리가 널려 있었다. 해양환경 감시원 오세찬 씨가 세 개만 주워 달라며, 팔이 짧고 넓으면 별불가사리, 길고 끝이 젖혀졌으면 아무르라고 가려 오라고 했다.',
          "Starfish lay all over the foot of the breakwater. A marine monitor named Oh Sechan asked me to pick up three and sort them: short, wide arms for a bat star; long arms with curled tips for an Amur."],
      }),
      hands_on: scene([
        line(O, '좋아요. 만져 보면 금방 알아요. 넓적하면 별, 끝이 위로 들렸으면 아무르.', 'Good. Touch them and you\'ll know right away. Flat and broad is a bat star; tips turned up is an Amur.'),
        line(O, '(방파제 밑 바위틈을 손가락으로 짚는다.)', '(He points to the cracks between the rocks under the breakwater.)'),
        line(O, '하나 주울 때마다 어디서 주웠는지 말해 줘요. 숫자는 제가 적어요.', "Each time you pick one up, tell me where you found it. I'll write the numbers."),
      ], {
        choices: [
          opt('ok', '어디서 주웠는지 꼭 말씀드릴게요', "I'll tell you where each one was", {
            end: endTalk({ accept: true, offer: 'hands_on' }) }),
          opt('wish', '별을 줍는 거면, 소원 하나쯤 빌어도 되겠네요', "If I'm picking up stars, maybe I get a wish", {
            say: ['별을 줍는 거면, 소원 하나쯤 빌어도 되겠네요.', "If I'm picking up stars, I suppose I'm allowed a wish."], next: 'wish' }),
          opt('later', '지금은 어렵겠어요. 다음에 도울게요', "Not right now. I'll help another time", {
            say: ['지금은 좀 어렵겠어요. 다음에 도울게요.', "I can't right now. I'll help another time."],
            end: endTalk({ decline: true, lineKo: '그래요. 불가사리는 또 밀려와요. 그때 봐요.', lineEn: "All right. More starfish will wash up. See you then." }),
            note: ['지금은 어렵다고 미뤘다. 오세찬 씨는 불가사리는 또 밀려온다며 그때 보자고 했다.', 'I put it off for now. Sechan said more starfish would wash up, and we could do it then.'] }),
        ],
        note: ['가리는 법만 알려 달라고 했다. 만져 보면 금방 안다고, 하나 주울 때마다 어디서 주웠는지 말해 주면 숫자는 자기가 적겠다고 했다.',
          "I asked him to show me how to tell them apart. You know at a touch, he said — tell me where each one came from, and I'll write the numbers."],
      }),
      wish: scene([
        line(O, '빌어도 돼요. 대신 숫자도 적어요.', 'Go ahead and wish. But write the numbers too.'),
        line(O, '(웃지는 않는데, 수첩 위 펜 끝이 잠깐 멈춘다.)', "(He doesn't smile, but the tip of his pen pauses on the notebook for a moment.)"),
        line(O, '소원은 별불가사리한테만 빌어요. 아무르한테 빌면 양식장 사람들이 싫어해요.', 'Only wish on the bat stars. Wish on an Amur and the fish farmers won\'t like it.'),
      ], {
        end: endTalk({ accept: true, offer: 'wish_joke' }),
        note: ['별을 줍는 거면 소원을 빌어도 되겠다고 농담했다. 오세찬 씨는 웃지는 않았지만, 소원은 별불가사리한테만 빌라고 했다. 아무르한테 빌면 양식장 사람들이 싫어한다고.',
          "I joked that picking up stars ought to earn me a wish. Sechan didn't smile, but he said to wish only on the bat stars — the fish farmers wouldn't like a wish on an Amur."],
      }),
      batstar: scene([
        line(O, '달라요. 아무르는 전복, 바지락, 굴을 먹어요. 양식장이 통째로 당해요.', 'They\'re different. Amurs eat abalone, clams, oysters. Whole farms get wiped out.'),
        line(P, '별불가사리는요?', 'And the bat stars?'),
        line(O, '별은 죽은 걸 먹어요. 바닥 청소부예요. 줄일 게 아니라 두는 거예요.', "Bat stars eat dead things. They're the sea floor's cleaners. You don't cut them back — you leave them be."),
        line(O, '섞어서 다 걷으면 바다가 오히려 지저분해져요. 그러니까 가려서 주워 와요.', 'Clear them all out together and the sea actually gets dirtier. So sort them when you pick them up.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_batstar' }),
        note: ['별불가사리는 왜 따로 가르느냐고 물었다. 아무르는 전복과 굴을 먹어 양식장을 망치지만, 별불가사리는 죽은 것을 먹는 바닥 청소부라고 했다. 그래서 가려야 한다고.',
          "I asked why the bat stars had to be sorted out. Amurs eat abalone and oysters and ruin farms, he said, but bat stars eat dead things — they clean the sea floor. That's why they must be sorted."],
      }),
      pay: scene([
        line(O, '아무르는 나와요. 지자체가 kg으로 사요. 별은 안 나와요. 구제 대상이 아니라서요.', "Amurs, yes. The local government buys them by the kilo. Bat stars, no. They aren't a pest."),
        line(P, '그럼 아무르만 주우면 되겠네요.', 'Then I should just pick up Amurs.'),
        line(O, '돈 보고 다 쓸어 오면 반은 헛일이에요. 오늘은 가리는 것부터 배워요. 돈은 가린 다음이에요.', "Sweep up everything for the money and half of it's wasted. Today, learn to sort first. Money comes after sorting."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_pay' }),
        note: ['주우면 돈이 나오느냐고 물었다. 아무르는 지자체가 kg으로 사지만 별불가사리는 값이 없다고, 오늘은 가리는 것부터 배우라고 했다.',
          'I asked whether there was money in it. The local government buys Amurs by the kilo, he said, but bat stars are worth nothing — today I should learn to sort first.'],
      }),
    },
  },

  // N21-1 — 끝내는 자리(오세찬)
  {
    id: 'n21_1_done', questId: 'N21-1', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '세 개 주워 왔어요. 하나는 방파제 끝, 둘은 계단 밑에서요.', 'I picked up three. One from the end of the breakwater, two from under the steps.'),
        line(O, '봐요.', "Let's see.", { act: 'peer' }),
        line(O, '맞아요, 이건 아무르. 잘 가렸네요.', "That's right, this one's an Amur. You sorted them well."),
        line(P, '만져 보니까 확실히 다르더라고요. 별은 넓적하고, 아무르는 팔이 길고요.', 'They really do feel different. The bat star is flat, and the Amur has long arms.'),
        line(O, '기록에 적을게요. 어디서, 몇 개. 누가 주웠는지도요.', "I'll put it in the record. Where, how many. And who picked them up."),
        line(P, '제 이름도요?', 'My name too?'),
        line(O, '세는 사람 이름이 있어야 다음 사람이 물어볼 수 있어요.', 'The counter needs a name, so the next person knows who to ask.'),
      ], {
        choices: [
          opt('bounty', '구제 수매가로 받겠습니다', "I'll take the cull bounty", {
            end: endTalk({ complete: 'bounty',
              lineKo: '규정대로요. 별불가사리 무게는 뺐어요. 그건 값이 없어요. 영수증은 버리지 마요. 다음에 또 주우면 그게 첫 장이에요.',
              lineEn: "By the rules. I took out the bat star's weight. That one's worth nothing. Don't throw away the receipt. Next time you pick some up, it's your first page." }),
            note: ['구제 수매가를 받았다. 오세찬 씨는 별불가사리 무게는 뺐다며, 영수증은 버리지 말라고 했다. 다음에 또 주우면 그게 첫 장이라고.',
              "I took the cull bounty. Sechan said he'd left out the bat star's weight, and told me to keep the receipt — next time, it would be my first page."] }),
          opt('data', '개체 수 기록을 같이 보고 싶습니다', "I'd like to see the population records", {
            say: ['개체 수 기록을 같이 보고 싶습니다.', "I'd like to look at the population records with you."], next: 'data' }),
          opt('volunteer', '수매가는 됐습니다. 다음에도 부르세요', "Keep the bounty. Call me again", {
            say: ['수매가는 됐습니다. 다음에도 부르십시오.', 'No need for the bounty. Call me again next time.'],
            end: endTalk({ complete: 'volunteer',
              lineKo: '…그런 사람이 필요했어요. 세는 사람은 늘 모자라요. 줍는 사람은 많은데 적는 사람이 없어요. 바다에 또 뭐가 밀려오면 제일 먼저 부를게요.',
              lineEn: "...I needed someone like that. There are never enough counters. Plenty of people pick things up, but no one writes it down. Next time something washes up, I'll call you first." }),
            note: ['수매가는 사양하고 다음에도 불러 달라고 했다. 오세찬 씨는 줍는 사람은 많아도 적는 사람은 없다며, 감시원 명단에 내 연락처를 적었다.',
              "I turned down the bounty and asked him to call me again. Plenty pick things up but no one writes it down, Sechan said, and he put my contact on his list of monitors."] }),
          opt('keep', '별불가사리는 바다에 돌려놓겠습니다', "I'll put the bat stars back in the sea", {
            say: ['별불가사리는 앞으로 보는 대로 바다에 돌려놓겠습니다.', "From now on I'll put any bat stars I see back in the sea."],
            end: endTalk({ complete: 'keep_batstars',
              lineKo: '…그거면 돼요. 줍는 사람은 많아요. 돌려놓는 사람은 드물어요. 기록에는 안 남는 일인데, 바다는 알아요.',
              lineEn: "...That's all it takes. Plenty of people pick them up. Few put them back. It never makes the record, but the sea knows." }),
            note: ['별불가사리는 보는 대로 바다에 돌려놓겠다고 했다. 오세찬 씨는 수첩 귀퉁이에 무언가를 짧게 적고, 기록에는 안 남는 일이지만 바다는 안다고 했다.',
              "I said I'd put back any bat stars I came across. Sechan jotted something short in the corner of his notebook: it never makes the record, he said, but the sea knows."] }),
        ],
        note: ['주운 불가사리 셋을 오세찬 씨에게 보였다. 잘 가렸다며, 어디서 몇 개를 누가 주웠는지까지 기록에 적겠다고 했다. 바다에는 잡는 일만이 아니라 세는 일도 있었다.',
          "I showed Sechan the three starfish. I had sorted them well, he said, and he would record where, how many and who picked them up. The sea has counting work too, not just catching."],
      }),
      data: scene([
        line(O, '보는 눈이 있네요. 이 표를 봐요. 해마다 늘어요.', 'You\'ve got an eye for it. Look at this table. They go up every year.'),
        line(O, '숫자보다 어디를 먼저 보는지가 중요해요. 맨 왼쪽 날짜부터요.', 'Where you look first matters more than the numbers. Start with the dates on the far left.'),
      ], {
        end: endTalk({ complete: 'data' }),
        note: ['개체 수 기록을 같이 보고 싶다고 했다. 오세찬 씨는 해마다 느는 표를 보여 주며, 숫자보다 어디를 먼저 보는지가 중요하다고 했다.',
          'I asked to see the population records. Sechan showed me a table that rises every year and said where you look first matters more than the numbers.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N21-2 「여름이 오면 떠오른다」 — 받는 자리(부산 · 때가 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n21_2_offer', questId: 'N21-2', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '또 보네요. 여름이 왔어요.', 'We meet again. Summer\'s here.'),
        line(P, '오세찬 씨? 부산까지 오셨어요?', 'Sechan? You came all the way to Busan?'),
        line(O, '해파리 따라다녀요. 만 안쪽 보세요.', 'I follow the jellyfish. Look at the inner bay.', { act: 'look_sea' }),
        line(P, '물이 왜 저렇게 뿌옇죠?', 'Why is the water so cloudy?'),
        line(O, '보름달물해파리예요. 저게 다.', "Moon jellyfish. All of that."),
        line(P, '저게 전부 해파리라고요?', 'All of that is jellyfish?'),
        line(O, '그물에 딸려 들어와요. 같이 든 고기가 다 상해요.', 'They come up in the nets. They spoil every fish caught with them.'),
        line(O, '다섯 마리만 걷어 주세요. 훌치기 바늘로 걸어서 끌어오면 돼요.', 'Just clear out five for me. Snag them with a snagging hook and drag them in.'),
      ], {
        choices: [
          opt('go', '지금이 맞네요. 하겠습니다', "Now's the time. I'll do it", {
            say: ['여름 만 안쪽이면 지금이 맞습니다. 하겠습니다.', "Summer in the inner bay — this is the time. I'll do it."], next: 'go' }),
          opt('bay', '왜 만 안쪽에만 몰려 있어요?', 'Why are they all in the inner bay?', {
            say: ['왜 하필 만 안쪽에만 이렇게 몰려 있어요?', 'Why are they crowded into the inner bay like that?'], next: 'bay' }),
          opt('salad', '냉채로 먹는 해파리 아니에요?', "Isn't this the kind you eat cold?", {
            say: ['이거 냉채로 무쳐 먹는 해파리 아니에요?', "Isn't this the jellyfish you dress and eat cold?"], next: 'salad' }),
        ],
        note: ['부산 만 안쪽이 보름달물해파리로 뿌옇게 덮여 있었다. 오세찬 씨는 그물에 딸려 들어와 고기를 상하게 한다며, 훌치기 바늘로 다섯 마리만 걷어 달라고 했다.',
          'The inner bay in Busan was clouded over with moon jellyfish. They come up in the nets and spoil the catch, Sechan said, and asked me to snag and clear out just five.'],
      }),
      go: scene([
        line(O, '고마워요. 장갑 끼세요.', 'Thank you. Put on gloves.'),
        line(O, '보름달물은 독이 약해요. 스치면 따끔한 정도예요. 그래도 맨손은 안 돼요.', "Moon jellyfish have weak venom. A brush just stings a little. Still, no bare hands."),
        line(O, '물을 잔뜩 먹고 있어서, 한 마리가 양동이 하나예요.', "They're full of water — each one weighs as much as a full bucket."),
      ], {
        end: endTalk({ accept: true, offer: 'go' }),
        note: ['하겠다고 했다. 보름달물은 독이 약하지만 맨손은 안 된다며 장갑을 끼라고 했다. 한 마리가 양동이 하나 무게라고.',
          "I said I'd do it. Moon jellyfish have weak venom, he said, but no bare hands — wear gloves. Each one weighs as much as a full bucket."],
      }),
      bay: scene([
        line(O, '물이 갇혀서요. 만이나 항구 안쪽은 물이 잘 안 빠져요.', "Because the water's trapped. Inside a bay or a harbor, the water doesn't flush out well."),
        line(O, '거기 바닥에 붙어 사는 어린 것들이 여름이면 한꺼번에 떠올라요. 헤엄을 거의 못 쳐서 물 흐르는 대로 가요.', "The young ones living on the bottom there all rise at once in summer. They can barely swim, so they go wherever the water takes them."),
        line(P, '그래서 갇힌 데에 쌓이는 거군요.', 'So they pile up where the water is trapped.'),
        line(O, '네. 입구 쪽부터 걷어 줘요.', 'Yes. Start clearing from the mouth of the bay.', { act: 'nod' }),
      ], {
        choices: [
          opt('do_it', '입구 쪽부터 걷겠습니다', "I'll start at the mouth", {
            end: endTalk({ accept: true, offer: 'ask_bay' }) }),
          opt('not_now', '이번 여름은 다른 일이 있어서요', "I've got other things this summer", {
            say: ['이번 여름은 다른 일이 있습니다. 다음에요.', "I've got other things this summer. Another time."], next: 'later' }),
        ],
        note: ['왜 만 안쪽에만 몰리느냐고 물었다. 물이 갇혀 잘 안 빠지는 데에, 헤엄을 거의 못 치는 어린 것들이 여름이면 한꺼번에 떠올라 쌓인다고 했다. 입구 쪽부터 걷어 달라고.',
          "I asked why they gathered in the inner bay. Where water is trapped, he said, the young ones — barely able to swim — all rise at once in summer and pile up. Start from the mouth, he said."],
      }),
      salad: scene([
        line(O, '아니에요. 보름달물은 못 먹어요. 냉채로 먹는 건 따로 있어요. 소금에 절이는 큰 놈이요.', "No. You can't eat moon jellyfish. The kind you eat cold is a different one. A big one you cure in salt."),
        line(O, '(입꼬리가 잠깐 움직였다가 돌아온다.)', '(The corner of his mouth twitches for a moment, then settles.)'),
        line(O, '이건 먹을 데가 없어요. 그물만 막고 고기만 상하게 해요. 그러니까 걷는 수밖에 없어요. 다섯이요.', "This one has nothing to eat. It just clogs nets and spoils fish. So clearing them is the only option. Five."),
      ], {
        choices: [
          opt('ok', '알겠어요. 다섯 마리 걷을게요', "All right. I'll clear five", {
            end: endTalk({ accept: true, offer: 'salad_joke' }) }),
          opt('not_now', '이번 여름은 다른 일이 있어서요', "I've got other things this summer", {
            say: ['이번 여름은 다른 일이 있습니다. 다음에요.', "I've got other things this summer. Another time."], next: 'later' }),
        ],
        note: ['냉채로 먹는 해파리 아니냐고 했다. 오세찬 씨의 입꼬리가 잠깐 움직였다. 보름달물은 못 먹고, 그물만 막고 고기만 상하게 하니 걷는 수밖에 없다고 했다.',
          "I asked if this was the jellyfish people eat cold. The corner of Sechan's mouth twitched. Moon jellyfish can't be eaten, he said — they clog nets and spoil fish, so clearing them is the only way."],
      }),
      later: scene([
        line(O, '네, 여름은 또 오니까요.', 'Sure. Summer comes again.'),
        line(O, '해파리도 해마다 와요. 그건 걱정 안 해요. 대신 다음에 오면 만 안쪽부터 봐 줘요. 물이 갇힌 데서 제일 먼저 불어나요.', "The jellyfish come every year too. I don't worry about that. But next time, look at the inner bay first. They multiply first where the water's trapped."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['이번 여름은 다른 일이 있다며 미뤘다. 오세찬 씨는 여름은 또 온다고, 다음에 오면 만 안쪽부터 봐 달라고 했다.',
          'I put it off — I had other things this summer. Summer comes again, Sechan said; next time, look at the inner bay first.'],
      }),
    },
  },

  // N21-2 — 끝내는 자리(오세찬)
  {
    id: 'n21_2_done', questId: 'N21-2', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '다섯 마리, 걷었어요.', "Five cleared out."),
        line(O, '봤어요. 만 안쪽이 좀 낫네요.', 'I saw. The inner bay looks a bit better.'),
        line(P, '착각인지 모르겠는데, 물색이 조금 맑아진 것 같아요.', "Maybe I'm imagining it, but the water looks a little clearer."),
        line(O, '착각이에요. 그래도 그물 하나는 덜 막혀요.', "You're imagining it. But one net will clog a little less."),
        line(O, '여름마다 이래요. 다음 여름에도 부를게요.', "It's like this every summer. I'll call you next summer too."),
      ], {
        choices: [
          opt('bounty', '구제 수매가로 받겠습니다', "I'll take the cull bounty", {
            end: endTalk({ complete: 'bounty',
              lineKo: '규정대로요. kg당이에요. 보름달물은 가벼워서 얼마 안 돼요. 그래도 그물 하나 덜 막힌 값은 영수증에 안 적혀요. 그건 어민들이 알아요.',
              lineEn: "By the rules. Per kilo. Moon jellyfish are light, so it isn't much. But the worth of one less clogged net isn't on the receipt. The fishers know it, though." }),
            note: ['구제 수매가를 받았다. 보름달물은 가벼워 얼마 안 되지만, 그물 하나 덜 막힌 값은 영수증에 안 적힌다고 했다.',
              "I took the cull bounty. Moon jellyfish are light so it wasn't much, he said, but the worth of one less clogged net isn't on any receipt."] }),
          opt('data', '왜 늘어나는지 기록을 보고 싶습니다', 'I want to see why they keep increasing', {
            say: ['해파리가 왜 늘어나는지 기록을 보고 싶습니다.', 'I want to see the records on why the jellyfish keep increasing.'],
            end: endTalk({ complete: 'data',
              lineKo: '수온이에요. 물이 따뜻한 해일수록 일찍 떠서 늦게까지 있어요. 처음 뜬 날짜만 해마다 이어 봐요. 조금씩 앞당겨지고 있어요.',
              lineEn: "Water temperature. The warmer the year, the earlier they rise and the later they stay. Just line up the first sighting date year by year. It's creeping earlier." }),
            note: ['해파리가 왜 느는지 기록을 보고 싶다고 했다. 수온이라며, 처음 뜬 날짜만 해마다 이어 보면 조금씩 앞당겨지고 있다고 했다.',
              "I asked to see why the jellyfish keep increasing. Water temperature, he said — line up the first sighting dates and they creep earlier every year."] }),
          opt('volunteer', '수매가는 됐습니다. 여름마다 부르세요', 'Keep the bounty. Call me every summer', {
            say: ['수매가는 됐습니다. 여름마다 부르십시오.', 'No need for the bounty. Call me every summer.'],
            end: endTalk({ complete: 'volunteer',
              lineKo: '…그렇게 말하는 사람 처음이에요. 해파리는 매년 오는데 사람은 매년 바뀌어요. 여름 명단 첫 줄, 당신으로 적어 둘게요.',
              lineEn: "...You're the first to say that. The jellyfish come every year, but the people change every year. I'll put you on the first line of the summer list." }),
            note: ['수매가는 사양하고 여름마다 불러 달라고 했다. 오세찬 씨는 그렇게 말하는 사람은 처음이라며, 감시원 여름 명단 첫 줄에 나를 적었다.',
              "I turned down the bounty and asked him to call me every summer. Sechan said I was the first to say so, and wrote me on the first line of the summer monitor list."] }),
          opt('snag', '끌어올 때 자꾸 밀려나던데요', 'They kept slipping away as I reeled', {
            say: ['끌어올 때 자꾸 밀려납니다. 훌치기 요령이 있습니까?', 'They keep slipping away when I drag them in. Is there a knack to snagging?'], next: 'snag' }),
        ],
        note: ['보름달물해파리 다섯 마리를 걷었다. 물색이 맑아진 것 같다고 하자 오세찬 씨는 착각이라면서도, 그물 하나는 덜 막힌다고 했다. 착각이라도 좋았다.',
          'I cleared five moon jellyfish. When I said the water looked clearer, Sechan said I was imagining it — but one net would clog a little less. Imagined or not, I liked it.'],
      }),
      snag: scene([
        line(O, '줄을 늦추면 안 돼요. 잠깐이라도 느슨해지면 도로 밀려가요.', "Don't let the line go slack. Even a moment of slack and it drifts right back."),
        line(O, '(빈 릴을 쥐고 감는 손을 직접 보여 준다.)', '(He takes an empty reel and shows me how his hand winds it.)'),
        line(O, '감을 때는 천천히, 대신 쉬지 말고요.', 'Wind slowly, but never stop.'),
      ], {
        end: endTalk({ complete: 'snag_tip', lineKo: '그리고 너무 멀리서 걸지 마요. 줄이 길면 못 버티고 터져요. 가까운 놈부터요.', lineEn: "And don't snag them from too far out. A long line can't take it and snaps. The near ones first." }),
        note: ['훌치기 요령을 물었다. 줄을 늦추지 말고 천천히, 쉬지 말고 감으라고, 너무 멀리서 걸지 말고 가까운 놈부터 하라고 했다.',
          "I asked for the knack of snagging. Never let the line go slack, he said; wind slowly but don't stop — and don't hook them too far out. The near ones first."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N21-3 「수매 창구」 — 받는 자리(울산)
  // ═══════════════════════════════════════════
  {
    id: 'n21_3_offer', questId: 'N21-3', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '울산에서 보네요. 이번엔 창구 일이에요.', 'So we meet in Ulsan. This time it\'s window work.'),
        line(P, '창구요?', 'A window?'),
        line(O, '수매 창구요. 지자체가 아무르불가사리를 kg으로 사들이는 데예요.', 'The buy-back window. Where the local government buys Amur starfish by the kilo.'),
        line(P, '아, 속초에서 말씀하셨던 거요.', 'Oh — what you told me about in Sokcho.'),
        line(O, '맞아요. 아무르 여덟 개. 모아서 창구에 넘겨요.', "That's it. Eight Amurs. Collect them and hand them in at the window."),
        line(P, '여덟 개요. 어렵진 않겠네요.', "Eight. That doesn't sound hard."),
        line(O, '하나만 조심해요. 별불가사리가 섞이면 창구에서 통째로 돌려보내요.', 'Watch one thing. If a bat star gets mixed in, the window sends the whole lot back.'),
        line(O, '팔 끝 젖혀진 것만이요. 창구는 저쪽이에요.', 'Only the ones with curled arm tips. The window is over there.'),
      ], {
        choices: [
          opt('no_mix', '하나도 안 섞겠습니다', "I won't mix in a single one", {
            say: ['팔 끝 젖혀진 것만 여덟. 하나도 안 섞겠습니다.', "Eight with curled arm tips. I won't mix in a single one."], next: 'no_mix' }),
          opt('counter', '창구는 별을 왜 돌려보내요?', 'Why does the window send bat stars back?', {
            say: ['창구는 별불가사리를 왜 돌려보내요? 같이 받으면 편할 텐데요.', "Why does the window send the bat stars back? It'd be easier to take them all."], next: 'counter' }),
          opt('why_buy', '불가사리를 왜 돈 주고 사요?', 'Why pay money for starfish?', {
            say: ['지자체가 불가사리를 왜 돈 주고 사요?', 'Why does the local government pay money for starfish?'], next: 'why_buy' }),
        ],
        note: ['울산에서 오세찬 씨를 다시 만났다. 아무르불가사리 여덟 개를 모아 지자체 수매 창구에 넘기는 일이었다. 별불가사리가 하나라도 섞이면 창구가 통째로 돌려보낸다고 했다.',
          "I met Sechan again in Ulsan. The job: collect eight Amur starfish and hand them in at the local government's buy-back window. If even one bat star got mixed in, the window would send back the whole lot."],
      }),
      no_mix: scene([
        line(O, '그거면 돼요. 창구 직원이 한 마리씩 다 확인해요. 하나라도 별이면 통째로 돌아와요.', "That's all it takes. The clerk checks every single one. One bat star and the whole lot comes back."),
        line(O, '(창구 쪽을 턱으로 가리킨다.)', '(He nods his chin toward the window.)'),
        line(O, '담을 때 한 번, 넘기기 전에 한 번. 두 번 봐요. 창구에서 돌아오면 하루가 날아가요.', "Once when you bag them, once before you hand them in. Look twice. If it comes back from the window, there goes your day."),
      ], {
        end: endTalk({ accept: true, offer: 'no_mix' }),
        note: ['하나도 안 섞겠다고 했다. 담을 때 한 번, 넘기기 전에 한 번, 두 번 보라고 했다. 창구에서 돌아오면 하루가 날아간다고.',
          "I promised not to mix in a single one. Look twice, he said — once when bagging, once before handing in. If it comes back from the window, the whole day is gone."],
      }),
      counter: scene([
        line(O, '편하죠. 근데 별은 구제 대상이 아니에요. 수매하는 돈은 줄이자고 쓰는 돈이에요. 줄일 것만 사요.', "Easier, sure. But bat stars aren't a pest. The buy-back money is spent to cut numbers down. It only buys what needs cutting."),
        line(O, '섞인 걸 받아 주면 다음 사람이 또 섞어 와요. 그럼 별도 줄고, 숫자도 틀려요.', 'Accept a mixed batch and the next person mixes theirs too. Then the bat stars dwindle and the numbers go wrong.'),
      ], {
        choices: [
          opt('ok', '팔 끝 젖혀진 것만 담겠습니다', "I'll bag only the curled tips", {
            end: endTalk({ accept: true, offer: 'ask_counter' }) }),
          opt('later', '오늘은 시간이 없네요. 다음에 할게요', "No time today. Next time", {
            say: ['오늘은 시간이 안 되겠어요. 다음에 할게요.', "I don't have the time today. I'll do it next time."],
            end: endTalk({ decline: true, lineKo: '그래요. 창구는 늘 열려 있어요. 아무르도 늘 있고요.', lineEn: "All right. The window's always open. And there are always Amurs." }),
            note: ['오늘은 시간이 없다며 미뤘다. 오세찬 씨는 창구는 늘 열려 있고 아무르도 늘 있다고 했다.', "I put it off — no time today. The window is always open, Sechan said, and there are always Amurs."] }),
        ],
        note: ['창구가 별불가사리를 왜 돌려보내느냐고 물었다. 수매하는 돈은 줄일 것만 사는 돈이라고, 섞인 걸 받아 주면 다음 사람도 섞어 오고 숫자도 틀린다고 했다.',
          "I asked why the window sends back bat stars. The buy-back money only buys what needs cutting, he said; accept a mixed batch and the next person mixes theirs, and the numbers go wrong."],
      }),
      why_buy: scene([
        line(O, '양식장이 당하는 것보다 싸서요. 아무르는 전복이고 굴이고 다 먹어 치워요. 그 값을 생각하면 kg으로 사들이는 게 남는 장사예요.', "Because it's cheaper than losing the farms. Amurs eat up abalone, oysters, everything. Against that, buying them by the kilo is a bargain."),
        line(O, '봄이면 알 낳으러 떼로 몰려요. 그때 걷어야 해요. 지금 여덟이 나중의 수백이에요.', "In spring they swarm to spawn. That's when you have to clear them. Eight now is hundreds later."),
      ], {
        choices: [
          opt('ok', '여덟, 모아 오겠습니다', "Eight. I'll bring them", {
            end: endTalk({ accept: true, offer: 'ask_why_buy' }) }),
          opt('big', 'kg으로 쳐 준다니, 큰 놈만 골라 와도 되죠?', "Paid by weight — so I can just pick big ones?", {
            say: ['kg으로 쳐 준다니, 큰 놈만 골라 와도 되죠?', "If it's paid by the kilo, I can just pick out the big ones, right?"], next: 'big' }),
        ],
        note: ['지자체가 왜 불가사리를 돈 주고 사느냐고 물었다. 양식장이 당하는 것보다 싸서라고, 봄이면 알 낳으러 떼로 몰리니 지금 여덟이 나중의 수백이라고 했다.',
          "I asked why the government pays for starfish. Cheaper than losing the farms, he said — in spring they swarm to spawn, so eight now is hundreds later."],
      }),
      big: scene([
        line(O, '돼요. 규정엔 크기가 없어요. 무게만 있어요.', "You can. The rules say nothing about size. Only weight."),
        act(O, 'silence'),
        line(O, '근데 작은 놈도 아무르예요. 내년엔 큰 놈이 돼요. 보이면 같이 담아요. 값은 덜 나와도 숫자는 똑같이 하나예요.', "But a small one's an Amur too. Next year it'll be a big one. If you see one, bag it as well. It's worth less, but it still counts as one."),
      ], {
        end: endTalk({ accept: true, offer: 'big_only' }),
        note: ['큰 놈만 골라 와도 되느냐고 했다. 규정엔 무게만 있다면서도, 작은 놈도 내년엔 큰 놈이 된다고 했다. 값은 덜 나와도 숫자는 똑같이 하나라고.',
          "I asked if I could just pick the big ones. The rules only mention weight, he said — but small ones become big ones next year. Worth less, yet each still counts as one."],
      }),
    },
  },

  // N21-3 — 끝내는 자리(오세찬)
  {
    id: 'n21_3_done', questId: 'N21-3', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '창구에 넘겼어요. 여덟 개요.', 'Handed them in at the window. All eight.'),
        line(O, '통과했죠?', 'They passed, didn\'t they?'),
        line(P, '직원분이 하나씩 다 뒤집어 보더라고요. 다 통과했어요.', 'The clerk turned every one of them over. They all passed.'),
        line(O, '창구가 까다로워요. 그래야 정확하고요.', "The window's strict. That's what keeps it accurate."),
        line(O, '섞어 오는 사람이 반이에요. 그 반은 다시 돌아가요.', 'Half the people bring mixed batches. That half goes back.'),
      ], {
        choices: [
          opt('bounty', '수매가로 받겠습니다', "I'll take the buy-back price", {
            end: endTalk({ complete: 'bounty',
              lineKo: '규정대로요. kg당. 창구 영수증엔 무게 옆에 종 이름이 적혀요. 아무르, 그 한 줄이 통과했다는 뜻이에요. 섞였으면 그 줄이 없었을 거예요.',
              lineEn: "By the rules. Per kilo. The window receipt lists the species next to the weight. Amur — that one line means it passed. If it had been mixed, that line wouldn't be there." }),
            note: ['수매가를 받았다. 창구 영수증 무게 옆에 적힌 「아무르」 한 줄이 통과했다는 뜻이라고 했다.',
              "I took the buy-back price. The one word Amur beside the weight on the window receipt means it passed, he said."] }),
          opt('data', '불가사리 증가 곡선을 보고 싶습니다', "I'd like to see the starfish growth curve", {
            end: endTalk({ complete: 'data',
              lineKo: '이 표를 봐요. 3년 치예요. 봄마다 위로 튀어요. 알 낳는 철이에요. 그 튀는 높이가 해마다 커지면 그해엔 창구가 바빠져요. 표는 미리 알려 줘요.',
              lineEn: "Look at this table. Three years' worth. It jumps every spring. Spawning season. When that jump gets bigger year on year, the window gets busy that year. The table tells you ahead." }),
            note: ['불가사리 증가 곡선을 보고 싶다고 했다. 3년 치 표에서 봄마다 위로 튀는 높이가 커지면 그해엔 창구가 바빠진다고, 표가 미리 알려 준다고 했다.',
              "I asked to see the starfish growth curve. In three years of data it jumps every spring, he said; when the jump grows, the window gets busy — the table tells you ahead."] }),
          opt('volunteer', '수매가는 됐습니다. 다음 창구도 부르세요', 'Keep it. Call me for the next window', {
            say: ['수매가는 됐습니다. 다음 창구도 부르십시오.', 'No need for the money. Call me for the next window too.'],
            end: endTalk({ complete: 'volunteer',
              lineKo: '…또 그렇게 말하네요. 고마워요. 창구 사람들이 물어요. 그 사람 또 오냐고요. 섞어 온 적이 한 번도 없어서요.',
              lineEn: "...You say that again. Thank you. The people at the window ask me — is that one coming back? You've never once brought a mixed batch." }),
            note: ['또 수매가를 사양했다. 오세찬 씨는 고맙다며, 울산 창구 사람들이 섞어 온 적 없는 그 사람이 또 오느냐고 묻는다고 했다.',
              "I turned down the money again. Sechan thanked me — the people at the Ulsan window ask whether the one who never brings mixed batches is coming back."] }),
          opt('weigh', '물은 빼고 다는 겁니까?', 'Do they drain the water before weighing?', {
            say: ['창구에서 무게 다는 걸 봤는데, 물은 빼고 답니까?', 'I watched them weigh at the window. Do they drain off the water first?'], next: 'weigh' }),
        ],
        note: ['아무르불가사리 여덟 개를 창구에 넘겼다. 직원이 하나씩 뒤집어 보고 모두 통과시켰다. 세는 사람과 파는 사람과 걷는 사람이 한 줄로 이어졌다.',
          "I handed in eight Amur starfish at the window. The clerk turned each one over and passed them all. The counter, the seller and the gatherer lined up in one row."],
      }),
      weigh: scene([
        line(O, '빼요. 물값은 안 쳐 줘요. 통째로 올리면 반이 바닷물이에요.', "They do. No one pays for water. Put it on whole and half of it's seawater."),
        line(O, '(손바닥을 기울여 물 빠지는 시늉을 한다.)', '(He tilts his palm, miming water draining off.)'),
      ], {
        end: endTalk({ complete: 'weigh_tip', lineKo: '그래서 담을 때부터 물을 따라 버려요. 그래야 영수증이랑 내 셈이 맞아요. 숫자는 무게부터 정직해야 해요.', lineEn: "So you pour the water off as you bag them. That way the receipt matches your own count. Numbers have to be honest, starting with the weight." }),
        note: ['물은 빼고 다느냐고 물었다. 물값은 안 쳐 주니 담을 때부터 물을 따라 버리라고, 숫자는 무게부터 정직해야 한다고 했다.',
          "I asked whether they drain off the water before weighing. No one pays for water, he said, so pour it off as you bag — numbers have to be honest, starting with the weight."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N21-4 「가두리 앞바다」 — 받는 자리(거제 · 때가 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n21_4_offer', questId: 'N21-4', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '왔어요? 잘됐다. 가두리 앞 보세요.', "You're here? Good. Look in front of the fish pens.", { act: 'look_sea' }),
        line(P, '저게 전부 해파리예요?', 'Is all of that jellyfish?'),
        line(O, '보름달물이요. 가두리 앞이 막혔어요.', "Moon jellyfish. They've blocked the front of the pens."),
        line(P, '그냥 두면 어떻게 되는데요?', 'What happens if they\'re left?'),
        line(O, '취수구까지 밀려가요. 거기까지 가면 양식장이 죽어요.', "They drift into the water intake. If they get that far, the farm dies."),
        line(P, '…', '...'),
        line(O, '열 마리. 지금이에요.', "Ten of them. And it has to be now."),
      ], {
        choices: [
          opt('go', '지금이군요. 갑니다', "Now, then. I'm going", {
            say: ['취수구 막히기 전이면 지금이군요. 갑니다.', "Before the intake clogs — so, now. I'm going."], next: 'go' }),
          opt('intake', '취수구가 막히면 왜 죽어요?', 'Why does a clogged intake kill the farm?', {
            say: ['취수구가 막히면 양식장이 왜 죽어요?', 'Why does the farm die if the intake gets clogged?'], next: 'intake' }),
          opt('split', '오세찬 씨는 어디를 맡으세요?', 'Which part will you take, Sechan?', {
            say: ['열 마리를 혼자요? 오세찬 씨는 어디를 맡으세요?', 'Ten on my own? Which part will you take, Sechan?'], next: 'split' }),
        ],
        note: ['거제 양식 가두리 앞이 보름달물해파리로 막혀 있었다. 취수구까지 밀려가면 양식장이 죽는다며, 오세찬 씨가 지금 열 마리를 걷어 달라고 했다.',
          'The front of the fish pens in Geoje was blocked with moon jellyfish. If they drift into the water intake the farm will die, Sechan said, and he asked me to clear ten right now.'],
      }),
      go: scene([
        line(O, '고마워요. 장갑!', 'Thank you. Gloves!'),
        line(O, '열 마리면 팔이 저려요. 다섯 걷고 숨 한번 돌려요. 쉬는 동안 제가 셀게요.', "Ten will numb your arms. Clear five, then catch your breath. I'll count while you rest."),
      ], {
        end: endTalk({ accept: true, offer: 'go' }),
        note: ['바로 가겠다고 했다. 열 마리면 팔이 저리니 다섯 걷고 숨을 돌리라고, 쉬는 동안 자기가 세겠다고 했다.',
          "I said I'd go at once. Ten would numb my arms, he said — clear five, catch my breath, and he would count while I rested."],
      }),
      intake: scene([
        line(O, '취수구는 바닷물을 끌어들이는 입구예요. 해파리가 그 망에 붙으면 새 물이 안 들어와요.', "The intake is the mouth that draws in seawater. When jellyfish stick to its screen, no fresh water gets in."),
        line(P, '가두리 그물도요?', 'And the pen nets?'),
        line(O, '그물코도 막혀요. 물이 안 돌면 안에 있는 고기가 숨을 못 쉬어요. 한여름엔 오래 못 버텨요.', "The mesh clogs too. If the water doesn't move, the fish inside can't breathe. In high summer they won't last long."),
      ], {
        choices: [
          opt('now', '그럼 정말 지금이네요', "Then it really has to be now", {
            end: endTalk({ accept: true, offer: 'ask_intake' }) }),
          opt('cant', '열 마리는 지금 무리입니다', "Ten is too many for me right now", {
            say: ['열 마리는 지금 무리입니다. 다음에요.', "Ten is too much for me right now. Another time."], next: 'cant' }),
        ],
        note: ['취수구가 막히면 왜 양식장이 죽느냐고 물었다. 해파리가 취수구 망과 그물코를 막으면 물이 돌지 않아, 안의 고기가 숨을 못 쉰다고 했다.',
          "I asked why a clogged intake kills the farm. When jellyfish block the intake screen and the net mesh, the water stops moving, he said, and the fish inside can't breathe."],
      }),
      cant: scene([
        line(O, '…네. 다른 사람 부를게요.', "...All right. I'll call someone else."),
        line(O, '열 마리가 적은 수는 아니에요. 무리라고 말해 주는 게 나아요. 하다가 팔이 풀리면 그게 더 위험해요.', "Ten isn't a small number. Better to say it's too much. If your arms give out halfway, that's more dangerous."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['열 마리는 지금 무리라고 했다. 오세찬 씨는 무리라고 말해 주는 게 낫다며, 다른 사람을 부르겠다고 했다.',
          "I said ten was too many for me right now. Better to say so, Sechan said, and he would call someone else."],
      }),
      split: scene([
        line(O, '저는 취수구 바로 앞이요. 망 상태를 봐야 해서요. 당신은 가두리 앞. 열 마리.', "I'll take the spot right in front of the intake. I need to watch the screen. You take the front of the pens. Ten."),
        line(O, '(손으로 바다를 두 쪽으로 가른다.)', '(He divides the sea in two with his hand.)'),
        line(O, '둘이 한데 몰려 있으면 반만 걷혀요. 갈라서 걸어요. 다 걷으면 소리쳐요. 들려요.', "If we bunch up together, only half gets cleared. Split up and snag. When you've cleared them, shout. I'll hear."),
      ], {
        end: endTalk({ accept: true, offer: 'split_up' }),
        note: ['오세찬 씨는 어디를 맡느냐고 물었다. 자기는 취수구 앞에서 망을 보고 나는 가두리 앞을 맡기로 했다. 다 걷으면 소리치라고 했다.',
          "I asked which part Sechan would take. He would watch the intake screen and I would take the front of the pens. Shout when you're done, he said."],
      }),
    },
  },

  // N21-4 — 끝내는 자리(오세찬)
  {
    id: 'n21_4_done', questId: 'N21-4', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '열 마리, 다 걷었어요.', 'All ten cleared.'),
        line(O, '들었어요. 관리인이 소리 지르는 거.', 'I heard. The manager shouting.'),
        line(P, '취수구 열렸다고요.', 'That the intake was open.'),
        line(O, '취수구 열렸어요. 열 마리. 양식장이 살았어요.', 'The intake is open. Ten. The farm survived.', { act: 'nod' }),
        line(O, '당신이요.', 'Because of you.'),
        line(P, '저 혼자 한 건 아니잖아요.', "I didn't do it alone."),
        line(O, '열 마리는 당신이 걷었어요. 그리고 관리인이 따로 봉투를 줬어요.', "You're the one who cleared ten. And the manager gave a separate envelope."),
      ], {
        choices: [
          opt('bounty', '수매가로 받겠습니다', "I'll take the buy-back price", {
            end: endTalk({ complete: 'bounty',
              lineKo: '규정대로요. 그리고 관리인 봉투도요. 하나는 해파리 값, 하나는 물값이에요. 관리인 봉투에 뭐가 들었는지는 저도 몰라요. 그건 그 사람 마음이에요.',
              lineEn: "By the rules. And the manager's envelope too. One's for the jellyfish, one's for the water. What's in the manager's envelope, I don't know. That's up to him." }),
            note: ['수매가를 받았다. 봉투가 둘이었다. 하나는 해파리 값, 하나는 관리인이 준 물값이라고 했다.',
              "I took the buy-back price. There were two envelopes — one for the jellyfish, and one from the manager for the water, Sechan said."] }),
          opt('data', '표류 예측을 배우고 싶습니다', "I'd like to learn to predict their drift", {
            say: ['해파리 표류 예측을 배우고 싶습니다. 미리 걷으면 되니까요.', "I'd like to learn to predict how jellyfish drift. Then we could clear them in advance."],
            end: endTalk({ complete: 'data',
              lineKo: '수온이랑 바람. 이 둘로 예측해요. 헤엄을 못 치니까 바람 부는 쪽으로 밀려요. 물이 따뜻해지고 바람이 가두리 쪽으로 며칠 불면, 그때 미리 걷어요. 막히고 나서 걷는 건 늦어요.',
              lineEn: "Water temperature and wind. You predict with those two. They can't swim, so they get pushed downwind. When the water warms and the wind blows toward the pens for a few days, that's when you clear them early. Clearing after they clog is too late." }),
            note: ['해파리 표류 예측을 배우고 싶다고 했다. 수온과 바람으로 본다고, 물이 따뜻해지고 바람이 가두리 쪽으로 며칠 불면 그때 미리 걷는다고 했다.',
              "I asked to learn to predict their drift. Water temperature and wind, he said — when the water warms and the wind blows toward the pens for a few days, clear them early."] }),
          opt('volunteer', '양식장 살았으면 됐습니다', 'The farm survived. That\'s enough', {
            end: endTalk({ complete: 'volunteer',
              lineKo: '…그렇게 말할 줄 알았어요. 관리인이 이름을 물어봤어요. 알려 줬어요. 이제 가두리 앞에 서 있어도 아무도 쫓아내지 않을 거예요.',
              lineEn: "...I knew you'd say that. The manager asked your name. I told him. From now on, no one will chase you off if you stand in front of the pens." }),
            note: ['양식장이 살았으면 됐다고 했다. 오세찬 씨는 그럴 줄 알았다며, 관리인에게 내 이름을 알려 줬다고 했다.',
              "I said it was enough that the farm survived. Sechan said he knew I would say that, and that he had told the manager my name."] }),
          opt('rules', '관리인 봉투는 돌려 드리세요', "Give the manager's envelope back", {
            say: ['관리인 봉투는 돌려 드리세요. 규정 값만 받겠습니다.', "Please give the manager's envelope back. I'll take only the regulation price."], next: 'rules' }),
        ],
        note: ['보름달물해파리 열 마리를 걷었고, 관리인이 취수구가 열렸다고 소리쳤다. 오세찬 씨는 양식장이 살았다고, 내가 살렸다고 했다. 처음으로 걷는 일이 누군가를 살렸다.',
          "I cleared ten moon jellyfish, and the manager shouted that the intake was open. The farm survived, Sechan said — because of me. For the first time, clearing the sea had saved someone."],
      }),
      rules: scene([
        line(O, '…규정대로만. 당신답네요.', '...Only by the rules. That\'s like you.'),
        line('', '(오세찬 씨가 봉투 하나를 관리인에게 돌려준다. 관리인이 고개를 깊이 숙인다.)', '(Sechan hands one envelope back to the manager. The manager bows deeply.)'),
      ], {
        end: endTalk({ complete: 'rules_only', lineKo: '이 동네는 그런 거 오래 기억해요. 받은 사람보다 안 받은 사람을 더 오래요.', lineEn: "People around here remember that sort of thing a long time. The ones who refused, longer than the ones who took." }),
        note: ['관리인 봉투는 돌려주고 규정 값만 받겠다고 했다. 관리인이 고개를 깊이 숙였다. 이 동네는 안 받은 사람을 더 오래 기억한다고 했다.',
          "I asked to return the manager's envelope and take only the regulation price. The manager bowed deeply. People here remember the ones who refused longer, Sechan said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N21-5 「실이 늘어진 그림자」 — 받는 자리(제주 · 때가 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n21_5_offer', questId: 'N21-5', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '저기, 수면 아래요. 보여요?', 'There, under the surface. See it?', { act: 'look_sea' }),
        line(P, '갈색… 그림자요? 바위인 줄 알았어요.', 'A brown... shadow? I thought it was a rock.'),
        line(O, '움직이죠. 노무라예요. 노무라입깃해파리.', "It's moving, isn't it. That's a Nomura. A Nomura's jellyfish."),
        line(P, '저게 한 마리라고요?', "That's one jellyfish?"),
        line(O, '한 마리예요. 100kg 넘어요.', 'One. Over a hundred kilos.'),
        line(P, '…', '...'),
        line(O, '한 마리만 끌어올려 줘요. 장갑은 두 겹. 쏘이지 마요.', "Just haul up that one for me. Two layers of gloves. Don't get stung."),
      ], {
        choices: [
          opt('go', '한 마리면 됩니다. 하겠습니다', "One is fine. I'll do it", {
            say: ['100kg이라도 한 마리면 됩니다. 하겠습니다.', "Even at a hundred kilos, one is doable. I'll do it."], next: 'go' }),
          opt('threads', '밑에 늘어진 실은 뭐예요?', 'What are those threads hanging down?', {
            say: ['우산 밑에 늘어진 실 같은 건 뭐예요? 그게 쏘는 거예요?', "What are those thread-like things hanging under the bell? Are those what sting?"], next: 'threads' }),
          opt('dragged', '제가 끌려 들어가는 거 아닙니까?', "Won't it drag me in?", {
            say: ['100kg이면 제가 끌려 들어가는 거 아닙니까?', "At a hundred kilos, won't it drag me in?"], next: 'dragged' }),
        ],
        note: ['제주 앞바다 수면 아래로 커다란 갈색 그림자가 지나갔다. 노무라입깃해파리, 한 마리가 100kg을 넘는다고 했다. 오세찬 씨는 장갑 두 겹을 끼고 쏘이지 말라며 한 마리만 끌어올려 달라고 했다.',
          "A huge brown shadow passed under the surface off Jeju. A Nomura's jellyfish — over a hundred kilos, Sechan said. He asked me to haul up just that one, in two layers of gloves, without getting stung."],
      }),
      go: scene([
        line(O, '장갑 두 겹. 부탁해요.', 'Two layers of gloves. Please.'),
        line(O, '촉수는 우산보다 훨씬 길어요. 끌어올 때 줄 따라 손이 미끄러지지 않게 해요.', "The tentacles are much longer than the bell. When you haul it in, don't let your hand slide down the line."),
        line(O, '끌어오는 데만 한참 걸려요. 서두르면 쏘여요.', 'Just hauling it in takes a long while. Rush it and you get stung.'),
      ], {
        end: endTalk({ accept: true, offer: 'go' }),
        note: ['하겠다고 했다. 촉수는 우산보다 훨씬 길다며, 줄 따라 손이 미끄러지지 않게 하라고 했다. 서두르면 쏘인다고.',
          "I said I'd do it. The tentacles are far longer than the bell, he said — don't let your hand slide down the line. Rush it and you get stung."],
      }),
      threads: scene([
        line(O, '부속지예요. 실처럼 보이는데 다발이에요. 거기 닿으면 붓고 오래 아파요.', "Those are the oral arms. They look like threads, but they're bundles. Touch them and you swell up and it hurts for a long time."),
        line(O, '(장갑 낀 손을 두 겹으로 포개 쥐어 보인다.)', '(He clasps his gloved hands one over the other to show two layers.)'),
        line(O, '그래서 끌어올 때는 우산 쪽을 잡아요. 실 쪽은 절대 손으로 걷지 마요. 장갑 두 겹이어도요.', "So when you haul it in, take hold of the bell. Never gather the threads by hand. Not even with two pairs of gloves."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_threads' }),
        note: ['우산 밑에 늘어진 실이 무엇이냐고 물었다. 실처럼 보이는 다발인데 닿으면 붓고 오래 아프다고, 끌어올 때는 우산 쪽을 잡고 실 쪽은 절대 손으로 걷지 말라고 했다.',
          "I asked about the threads under the bell. Bundles that look like threads, he said — touch them and you swell and ache for a long time. Hold the bell, and never gather the threads by hand."],
      }),
      dragged: scene([
        line(O, '그래서 천천히 해요. 줄을 늦추지만 않으면 안 끌려가요. 끌려가는 건 사람이 아니라 줄이에요.', "That's why you go slowly. As long as you don't let the line go slack, you won't be dragged. What gets dragged is the line, not you."),
        line(O, '못 버티겠으면 놔요. 줄은 또 사면 돼요. 사람은 못 사요.', "If you can't hold it, let go. You can buy another line. You can't buy another person."),
      ], {
        choices: [
          opt('try', '천천히 해 보겠습니다', "I'll take it slowly", {
            end: endTalk({ accept: true, offer: 'dragged' }) }),
          opt('honest', '저건 제 힘으로 무리입니다', "That's beyond my strength", {
            say: ['…솔직히, 저건 제 힘으로 무리입니다.', "...Honestly, that's beyond my strength."], next: 'no' }),
        ],
        note: ['끌려 들어가는 거 아니냐고 했다. 줄을 늦추지만 않으면 안 끌려간다고, 못 버티겠으면 놓으라고 했다. 줄은 또 사면 되지만 사람은 못 산다고.',
          "I asked if it would drag me in. Not if I kept the line taut, he said — and if I couldn't hold it, let go. A line can be bought again; a person can't."],
      }),
      no: scene([
        line(O, '…솔직해서 고마워요. 다음 철에 배로 걷어요.', "...Thanks for being honest. We'll clear it by boat next season."),
        line(O, '노무라는 혼자 걷는 게 아니에요. 무리라고 말하는 사람이 오래가요. 다음 철에 배가 뜨면 그때 말 걸게요.', "A Nomura isn't something you clear alone. The ones who say it's too much last longer. When the boat goes out next season, I'll come find you."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['저건 내 힘으로 무리라고 했다. 오세찬 씨는 솔직해서 고맙다며, 다음 철에 배가 뜨면 그때 말을 걸겠다고 했다.',
          "I said it was beyond my strength. Sechan thanked me for being honest and said he would come find me when the boat went out next season."],
      }),
    },
  },

  // N21-5 — 끝내는 자리(오세찬)
  {
    id: 'n21_5_done', questId: 'N21-5', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '끌어올렸어요. 이십 분 걸렸네요.', 'Hauled it up. Took twenty minutes.'),
        line(O, '괜찮아요? 팔 봐요.', 'Are you all right? Let me see your arms.'),
        line(P, '괜찮아요. 아까도 보셨잖아요.', "I'm fine. You already checked."),
        line(O, '한 번 더요.', 'Once more.', { act: 'peer' }),
        line(O, '…괜찮네요.', "...You're fine."),
        line(O, '한 마리. 그게 전부예요. 그거면 돼요.', "One. That's all. That's enough."),
      ], {
        choices: [
          opt('bounty', '수매가로 받겠습니다. 100kg입니다', "I'll take the price. It's a hundred kilos", {
            end: endTalk({ complete: 'bounty',
              lineKo: 'kg당이니까… 큰돈이네요. 규정대로요. 노무라는 수매가가 제일 높아요. 한 마리가 그물 한 틀을 찢어요. 이 돈은 그물값이에요.',
              lineEn: "Per kilo... that's a lot of money. By the rules. Nomuras fetch the highest price. One of them tears through a whole net. This money is the price of a net." }),
            note: ['수매가를 받았다. 노무라는 수매가가 제일 높다고, 한 마리가 그물 한 틀을 찢으니 이 돈은 그물값이라고 했다.',
              "I took the bounty. Nomuras fetch the highest price, he said — one tears through a whole net, so this money is the price of a net."] }),
          opt('data', '노무라가 어디서 오는지 알고 싶습니다', 'I want to know where Nomuras come from', {
            end: endTalk({ complete: 'data',
              lineKo: '남쪽이요. 해류 따라. 동중국해에서 생겨서 대마난류를 타고 올라와요. 제주가 첫 관문이에요. 여기서 많이 보이면 얼마 뒤엔 남해, 동해에서도 보여요.',
              lineEn: "From the south. With the current. They form in the East China Sea and ride the Tsushima Current north. Jeju is the first gate. When you see a lot here, before long you see them in the South Sea and the East Sea too." }),
            note: ['노무라가 어디서 오느냐고 물었다. 동중국해에서 생겨 대마난류를 타고 올라오고, 제주가 첫 관문이라고 했다.',
              "I asked where Nomuras come from. They form in the East China Sea and ride the Tsushima Current north, he said — Jeju is the first gate."] }),
          opt('volunteer', '쏘이지 않았으면 됐죠', "Not getting stung is enough", {
            say: ['수매가는 됐습니다. 쏘이지 않았으면 된 겁니다.', "No need for the money. Not getting stung is what counts."],
            end: endTalk({ complete: 'volunteer',
              lineKo: '…당신 같은 사람이 필요해요. 진짜로. 돈보다 쏘이지 않은 걸 먼저 세는 사람. 그게 감시원이에요. 명단 첫 줄은 아무나 안 올려요.',
              lineEn: "...We need people like you. Really. Someone who counts not getting stung before the money. That's what a monitor is. I don't put just anyone on the first line." }),
            note: ['수매가는 사양하고, 쏘이지 않았으면 됐다고 했다. 오세찬 씨는 돈보다 쏘이지 않은 걸 먼저 세는 사람이 감시원이라며, 제주 명단 첫 줄에 나를 올렸다.',
              "I turned down the money — not getting stung was what counted. Someone who counts that before money is a monitor, Sechan said, and he put me on the first line of the Jeju list."] }),
          opt('aid', '쏘이면 어떻게 해야 합니까?', 'What should I do if I get stung?', {
            say: ['혹시 쏘이면 어떻게 해야 합니까? 제대로 알아 두고 싶습니다.', 'If I ever get stung, what should I do? I want to know it properly.'], next: 'aid' }),
        ],
        note: ['노무라입깃해파리 한 마리를 이십 분 걸려 끌어올렸다. 오세찬 씨는 내 장갑과 팔을 보고 또 봤다. 괜찮다고, 한 마리, 그게 전부라고 했다.',
          "It took twenty minutes to haul up one Nomura's jellyfish. Sechan checked my gloves and arms, then checked again. I was fine, he said. One — and that was all."],
      }),
      aid: scene([
        line(O, '물 밖으로 먼저 나와요. 바닷물로 씻어요. 민물은 안 돼요, 더 쏴요.', "Get out of the water first. Rinse with seawater. Not fresh water — it makes it sting more."),
        line(O, '붙은 촉수는 맨손 말고 카드 같은 걸로 긁어 내요.', "Scrape off any tentacles stuck to you with something like a card — not your bare hand."),
        line(P, '붓거나 숨이 차면요?', "And if I swell up or can't breathe?"),
      ], {
        end: endTalk({ complete: 'sting_aid', lineKo: '바로 병원이에요. 참지 마요. 그게 제일 중요해요.', lineEn: "Straight to the hospital. Don't tough it out. That's the most important thing." }),
        note: ['쏘이면 어떻게 하느냐고 물었다. 물 밖으로 나와 바닷물로 씻고, 촉수는 카드 같은 걸로 긁어 내고, 붓거나 숨이 차면 참지 말고 바로 병원이라고 했다.',
          "I asked what to do if stung. Get out of the water, rinse with seawater, scrape off tentacles with a card — and if you swell or can't breathe, go straight to the hospital."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N21-6 「그물을 찢는 것」 — 받는 자리(울릉 · 때가 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n21_6_offer', questId: 'N21-6', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '울릉 앞바다예요. 저 부표들 보여요?', "This is the sea off Ulleungdo. See those buoys?", { act: 'look_sea' }),
        line(P, '그물 부표요? 그런데 물 밑이 온통 갈색이네요.', "The net buoys? But the water underneath is brown all over."),
        line(O, '노무라 떼예요. 이번엔 한 마리가 아니에요.', "A swarm of Nomuras. It isn't just one this time."),
        line(P, '떼로요…', 'A swarm...'),
        line(O, '그물을 찢어요. 한 마리씩 걷어 내는 수밖에 없어요.', "They tear the nets. There's nothing for it but to clear them one at a time."),
        line(P, '몇 마리나요?', 'How many?'),
        line(O, '세 마리만요. 방법이 없어요, 이것 말고.', "Just three. There's no other way."),
      ], {
        choices: [
          opt('go', '한 마리씩이면 됩니다. 갑니다', "One at a time is fine. I'll go", {
            say: ['한 마리씩이면 됩니다. 갑니다.', "One at a time, I can do. I'm going."], next: 'go' }),
          opt('nets', '해파리가 어떻게 그물을 찢어요?', 'How can a jellyfish tear a net?', {
            say: ['해파리가 어떻게 그물을 찢어요? 물렁하잖아요.', "How can a jellyfish tear a net? They're soft."], next: 'nets' }),
          opt('doubt', '세 마리 걷는다고 떼가 줄긴 합니까?', 'Will clearing three even shrink the swarm?', { next: 'doubt' }),
        ],
        note: ['울릉 앞바다에 노무라입깃해파리가 떼로 들어와 그물 부표 밑이 온통 갈색이었다. 그물을 찢는다고, 한 마리씩 걷는 것 말고는 방법이 없다며 세 마리만 걷어 달라고 했다.',
          "A swarm of Nomura's jellyfish had come into the sea off Ulleungdo, turning the water under the net buoys brown. They tear the nets, Sechan said; there was no way but one at a time, and he asked for just three."],
      }),
      go: scene([
        line(O, '고마워요. 장갑 두 겹.', 'Thank you. Two layers of gloves.'),
        line(O, '노무라는 기다려 줘요. 빨리 못 움직이니까요. 중간에 손이 떨리면 쉬어요.', "A Nomura will wait for you. It can't move fast. If your hands start shaking partway, rest."),
      ], {
        end: endTalk({ accept: true, offer: 'go' }),
        note: ['한 마리씩이면 되겠다고 했다. 노무라는 빨리 못 움직이니 기다려 준다고, 손이 떨리면 쉬라고 했다.',
          "I said one at a time would do. A Nomura can't move fast, so it will wait, he said — rest if your hands start shaking."],
      }),
      nets: scene([
        line(O, '무게예요. 한 마리가 100kg을 넘어요. 그게 그물에 몇 마리만 들어도 못 버텨요. 끌어올리다 터져요.', "It's the weight. One is over a hundred kilos. Get just a few in a net and it can't hold. It bursts as they haul it up."),
        line(O, '(먼바다 쪽 그물 부표들을 가리킨다.)', '(He points to the net buoys farther out.)'),
        line(O, '그날 조업은 거기서 끝이에요. 고기도 못 건지고 그물도 잃어요. 울릉 어민들이 지금 그래요.', "That's the end of the day's fishing. No fish, and the net's gone too. That's what the Ulleungdo fishers are going through now."),
      ], {
        choices: [
          opt('go2', '세 마리, 걷겠습니다', "Three. I'll clear them", {
            end: endTalk({ accept: true, offer: 'ask_nets' }) }),
          opt('boat', '떼는 배로 걷어야 합니다', 'A swarm needs a boat', {
            say: ['떼는 배로 걷어야 합니다. 저 혼자는 무리입니다.', "A swarm has to be cleared by boat. It's too much for me alone."], next: 'boat' }),
        ],
        note: ['해파리가 어떻게 그물을 찢느냐고 물었다. 한 마리가 100kg을 넘으니 몇 마리만 들어도 그물이 끌어올리다 터진다고, 울릉 어민들이 지금 고기도 그물도 잃고 있다고 했다.',
          "I asked how a jellyfish could tear a net. One weighs over a hundred kilos, he said; a few in a net and it bursts as it's hauled. The Ulleungdo fishers were losing both fish and nets."],
      }),
      boat: scene([
        line(O, '…맞는 말이에요. 떼는 혼자 걷는 게 아니에요.', "...You're right. A swarm isn't something you clear alone."),
        line(O, '배 오기 전까지 세는 건 해 둘게요. 배 뜨는 날 다시 말 걸게요.', "Until the boat comes, I'll keep counting. On the day it goes out, I'll come find you."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['떼는 배로 걷어야 한다고, 나 혼자는 무리라고 했다. 오세찬 씨는 맞는 말이라며, 배가 뜨는 날 다시 말을 걸겠다고 했다.',
          'I said a swarm needed a boat and was too much for me alone. Sechan agreed, and said he would come find me on the day the boat went out.'],
      }),
      doubt: scene([
        line(O, '안 줄어요. 남는 게 더 많을 거예요. 알아요.', "It won't. There'll be more left than cleared. I know."),
        act(O, 'silence'),
        line(O, '그래도 걷은 만큼은 그물이 살아요. 그리고 숫자가 남아요. 안 걷으면 아무것도 안 남아요.', "But for every one cleared, a net survives. And the numbers stay. If you don't clear any, nothing stays at all."),
        line(O, '한 마리씩이요.', 'One at a time.'),
      ], {
        end: endTalk({ accept: true, offer: 'doubt' }),
        note: ['세 마리 걷는다고 떼가 줄겠느냐고 했다. 안 준다고, 남는 게 더 많을 거라고 했다. 그래도 걷은 만큼은 그물이 살고 숫자가 남는다고.',
          "I asked whether clearing three would shrink the swarm at all. It wouldn't, he said — more would be left. But for every one cleared a net survives, and the numbers stay."],
      }),
    },
  },

  // N21-6 — 끝내는 자리(오세찬)
  {
    id: 'n21_6_done', questId: 'N21-6', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '세 마리 걷었어요.', 'Three cleared.'),
        line(O, '셌어요. 배 위에서.', 'I counted. From the boat.'),
        line(P, '남은 건요?', 'And the ones left?'),
        line(O, '더 많죠. 걷은 것보다.', 'More. More than we cleared.', { act: 'look_sea' }),
        line(O, '그래도 세 마리는 세 마리예요.', 'Still, three is three.'),
      ], {
        choices: [
          opt('bounty', '수매가로 받겠습니다', "I'll take the buy-back price", {
            end: endTalk({ complete: 'bounty',
              lineKo: 'kg으로. 세 마리면… 큰돈이네요. 이 돈은 걷은 것 값이에요. 남은 것들 값은 아무도 안 줘요. 그래서 세는 거예요. 남은 것도 숫자로는 남게요.',
              lineEn: "By the kilo. Three of them... that's a lot of money. This money is for what we cleared. No one pays for the ones left. That's why we count — so the ones left at least remain as numbers." }),
            note: ['수매가를 받았다. 이 돈은 걷은 것 값이고 남은 것들 값은 아무도 안 주니, 그래서 센다고 했다.',
              "I took the bounty. This money is for what we cleared, he said; no one pays for the rest, which is why we count them."] }),
          opt('data', '남은 게 더 많다는 걸 어떻게 세세요?', 'How do you count the ones left?', {
            say: ['남은 것이 더 많다는 걸 어떻게 세십니까?', 'How do you count that more are left?'],
            end: endTalk({ complete: 'data',
              lineKo: '배 위에서 보이는 것만요. 한 구역에서 보이는 걸 세고, 구역 수를 곱해요. 정확하진 않아요. 그래도 매번 같은 방법으로 세면, 늘었는지 줄었는지는 정확해요.',
              lineEn: "Only what you can see from the boat. Count what's visible in one section and multiply by the number of sections. It isn't exact. But count the same way every time, and whether it went up or down — that's exact." }),
            note: ['남은 것을 어떻게 세느냐고 물었다. 한 구역에서 보이는 걸 세고 구역 수를 곱한다고, 정확하진 않아도 늘 같은 방법으로 세면 늘고 준 것은 정확하다고 했다.',
              "I asked how he counts what's left. Count what's visible in one section and multiply by the sections, he said — not exact, but counted the same way every time, the rise or fall is."] }),
          opt('volunteer', '세 마리는 세 마리입니다', 'Three is three', {
            say: ['세 마리는 세 마리입니다. 수매가는 됐습니다.', 'Three is three. I don\'t need the money.'],
            end: endTalk({ complete: 'volunteer',
              lineKo: '…그 말이 제 보고서 첫 줄이에요. 보고서는 늘 남은 숫자로 시작했어요. 이번엔 걷은 숫자로 시작해요. 셋. 처음이에요.',
              lineEn: "...That will be the first line of my report. My reports always started with the number left. This time it starts with the number cleared. Three. A first." }),
            note: ['세 마리는 세 마리라며 수매가는 사양했다. 오세찬 씨는 그 말이 보고서 첫 줄이 될 거라고, 처음으로 걷은 숫자로 보고서를 시작한다고 했다.',
              "I said three is three and turned down the money. That would be the first line of his report, Sechan said — for the first time, a report starting with the number cleared."] }),
          opt('boat', '떼 옆에 배를 댈 때는요?', 'How do you bring a boat alongside a swarm?', {
            say: ['배로 떼 옆에 댈 때는 어떻게 해야 합니까?', 'When you bring a boat alongside a swarm, what should you do?'], next: 'boat' }),
        ],
        note: ['노무라 세 마리를 걷었다. 오세찬 씨는 배 위에서 걷은 것과 남은 것을 셌다. 남은 것이 더 많았다. 그래도 세 마리는 세 마리라고 했다.',
          "I cleared three Nomuras. From the boat, Sechan counted what was cleared and what was left. More were left. Still, three is three, he said."],
      }),
      boat: scene([
        line(O, '떼가 흘러오는 길목에 대지 마요. 길목 옆에 대요.', "Don't park in the path the swarm drifts along. Pull up beside the path."),
        line(O, '(손바닥으로 물 흐르는 방향을 긋고, 그 옆에 배를 놓는 시늉을 한다.)', '(He traces the flow of the water with his palm, then mimes setting a boat down beside it.)'),
        line(O, '길목에 서 있으면 떼가 배로 밀려와요. 스크루에 감기면 그날은 끝이에요.', "Sit in the path and the swarm piles into the boat. If one wraps around the propeller, your day's over."),
      ], {
        end: endTalk({ complete: 'boat_tip', lineKo: '엔진은 낮게, 천천히요. 해파리는 피하지 않아요. 피하는 건 배가 해야 해요.', lineEn: "Keep the engine low and slow. Jellyfish don't get out of the way. The boat has to." }),
        note: ['떼 옆에 배를 댈 때 요령을 물었다. 길목이 아니라 길목 옆에 대고, 엔진은 낮게 천천히 하라고 했다. 해파리는 피하지 않으니 배가 피해야 한다고.',
          "I asked how to bring a boat alongside a swarm. Not in the path but beside it, he said, engine low and slow — jellyfish don't move aside, so the boat has to."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N21-7 「넘치는 바다」 — 받는 자리(독도)
  // ═══════════════════════════════════════════
  {
    id: 'n21_7_offer', questId: 'N21-7', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '독도까지 왔네요.', "You've come all the way to Dokdo."),
        line(P, '오세찬 씨야말로요. 여기서도 세세요?', 'So have you, Sechan. You count here too?'),
        line(O, '마지막이에요.', "It's the last time."),
        line(P, '마지막이요?', 'The last time?'),
        line(O, '은퇴해요. 독도에서 마지막 기록을 남기려고요.', "I'm retiring. I want to leave my last record at Dokdo."),
        line(P, '…', '...'),
        line(O, '노무라 둘, 보름달 열. 걷으면서 같이 세 줘요.', 'Two Nomuras, ten moon jellyfish. Clear them and count with me.'),
        line(O, '숫자로 남겨야 다음 사람이 손을 써요.', 'It has to be left as numbers, so the next person can act.'),
      ], {
        choices: [
          opt('last', '숫자 하나 안 틀리게 세겠습니다', "I won't get a single number wrong", {
            say: ['마지막 기록이면, 숫자 하나 안 틀리게 세겠습니다.', "If it's the last record, I won't get a single number wrong."], next: 'last' }),
          opt('retire', '왜 그만두시는지 여쭤봐도 될까요?', 'May I ask why you\'re stopping?', {
            say: ['은퇴라니요. 왜 그만두시는지 여쭤봐도 됩니까?', 'Retiring? May I ask why you\'re stopping?'], next: 'retire' }),
          opt('next', '다음 사람이라뇨?', 'The next person?', {
            say: ['다음 사람이라뇨. 누가 이 숫자를 받습니까?', 'The next person? Who receives these numbers?'], next: 'next' }),
        ],
        note: ['독도에서 오세찬 씨를 만났다. 은퇴를 앞두고 마지막 기록을 남긴다고 했다. 노무라 둘, 보름달물 열. 숫자로 남겨야 다음 사람이 손을 쓴다고.',
          "I met Sechan at Dokdo. He was about to retire and wanted to leave a last record: two Nomuras, ten moon jellyfish. It has to be left as numbers, he said, so the next person can act."],
      }),
      last: scene([
        line(O, '고마워요. 걷으면서 세요. 다 걷고 세면 틀려요.', 'Thank you. Count as you clear. Count after you\'re done and you get it wrong.'),
        line(O, '(수첩의 마지막 빈 장을 펼쳐 둔다.)', '(He opens his notebook to its last blank page.)'),
        line(O, '독도는 물이 맑아서 잘 보여요. 그래도 세 번 세요. 마지막 기록은 고쳐 줄 사람이 없으니까요.', "The water's clear at Dokdo, so you can see well. Still, count three times. No one will be around to correct the last record."),
      ], {
        end: endTalk({ accept: true, offer: 'last_record' }),
        note: ['숫자 하나 안 틀리게 세겠다고 했다. 걷으면서 세고, 세 번 세라고 했다. 마지막 기록은 고쳐 줄 사람이 없다고. 오세찬 씨가 수첩의 마지막 빈 장을 펼쳐 두었다.',
          "I promised not to get a single number wrong. Count as you clear, and count three times, he said — no one will correct the last record. He opened his notebook to its last blank page."],
      }),
      retire: scene([
        line(O, '…오래 했어요. 그걸로 해 둬요.', "...I've done it a long time. Let's leave it at that."),
        line(O, '(수첩을 덮었다가 다시 편다.)', '(He closes his notebook, then opens it again.)'),
        line(O, '지금은 마지막 줄이 중요해요. 노무라 둘, 보름달 열. 그 숫자부터 같이 세요.', "Right now the last line is what matters. Two Nomuras, ten moon jellyfish. Let's count those first."),
      ], {
        choices: [
          opt('ok', '그 숫자부터 세겠습니다', "We'll count those first", {
            end: endTalk({ accept: true, offer: 'ask_retire' }) }),
          opt('hesitate', '그런 자리에 제가 있어도 될까요?', 'Is it all right for me to be there?', {
            say: ['마지막이라니, 그런 자리에 제가 있어도 될까요?', "The very last one — is it all right for me to be there?"], next: 'hesitate' }),
        ],
        note: ['왜 그만두느냐고 물었다. 오래 했다고, 그걸로 해 두자고 했다. 지금은 마지막 줄이 중요하다고.',
          "I asked why he was stopping. He had done it a long time, he said — let's leave it at that. Right now the last line was what mattered."],
      }),
      hesitate: scene([
        line(O, '그래서 부른 거예요. 첫 불가사리를 같이 셌잖아요.', "That's why I called you. We counted the first starfish together."),
        act(O, 'silence'),
        line(O, '마지막도 같이 세요. 처음이랑 끝을 같은 사람이랑 세는 거, 감시원한테는 흔한 일이 아니에요.', "Count the last ones with me too. Counting the first and the last with the same person — that isn't common for a monitor."),
      ], {
        end: endTalk({ accept: true, offer: 'hesitate' }),
        note: ['마지막 자리에 내가 있어도 되느냐고 했다. 그래서 불렀다고, 첫 불가사리를 같이 셌으니 마지막도 같이 세자고 했다. 속초 방파제가 떠올랐다.',
          "I asked whether I belonged at his last count. That was why he called me, he said — we counted the first starfish together, so we would count the last together too. I thought of the Sokcho breakwater."],
      }),
      next: scene([
        line(O, '그건 기록을 다 넘길 때 말할게요.', "I'll tell you that when I hand over all the records.", { act: 'look_sea' }),
        line(O, '누가 받든 읽을 수 있게 남기는 거예요. 제 글씨 말고 숫자로요. 숫자는 사람이 바뀌어도 뜻이 안 바뀌어요.', "Whoever receives it, it's left so they can read it. Not in my handwriting — in numbers. People change, but numbers keep their meaning."),
        line(O, '그러니까 정확하게 세요.', 'So count accurately.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_next' }),
        note: ['다음 사람이 누구냐고 물었다. 그건 기록을 다 넘길 때 말하겠다고 했다. 누가 받든 읽을 수 있게 글씨가 아니라 숫자로 남긴다고.',
          "I asked who the next person was. He would tell me when he handed over the records, he said. Whoever receives them, he leaves numbers, not handwriting, so they can be read."],
      }),
    },
  },

  // N21-7 — 끝내는 자리(오세찬)
  {
    id: 'n21_7_done', questId: 'N21-7', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '노무라 둘, 보름달 열. 세 번 셌어요.', 'Two Nomuras, ten moon jellyfish. I counted three times.'),
        line(O, '저도 셌어요. 맞아요.', 'I counted too. It matches.'),
        line(O, '그럼 이게 마지막 줄이네요.', 'Then this is the last line.'),
        line(P, '…', '...'),
        line(O, '기록 넘길게요. 십오 년 치.', "I'll hand over the records. Fifteen years' worth."),
        line(P, '다음 사람한테요?', 'To the next person?'),
        line(O, '다음 사람은… 당신이에요.', 'The next person is... you.'),
      ], {
        choices: [
          opt('next', '다음 사람. 받겠습니다', "The next person. I'll take it", {
            say: ['다음 사람. 받겠습니다.', "The next person. I'll take it."], next: 'next' }),
          opt('data', '십오 년 치 읽는 법부터 배우겠습니다', "First I'll learn to read fifteen years", {
            say: ['십오 년 치를 읽는 법부터 배우겠습니다.', "First I'll learn how to read fifteen years of it."],
            end: endTalk({ complete: 'data',
              lineKo: '해마다 첫 줄만 봐요. 첫 줄이 그해예요. 첫 줄엔 그해 처음 본 날짜가 있어요. 십오 년을 세로로 놓고 보면 그 날짜가 조금씩 앞으로 와요. 바다가 넘친다는 게 그거예요.',
              lineEn: "Just look at the first line of each year. The first line is that year. It has the date of the first sighting. Stack fifteen years in a column and that date creeps forward. That's what it means for the sea to overflow." }),
            note: ['십오 년 치를 읽는 법부터 배우겠다고 했다. 해마다 첫 줄만 보라고, 그해 처음 본 날짜가 십오 년 동안 조금씩 앞으로 온다고 했다. 바다가 넘친다는 게 그거라고.',
              "I said I'd first learn how to read fifteen years of it. Look at each year's first line, he said — the first-sighting date creeps forward over fifteen years. That's what an overflowing sea means."] }),
          opt('bounty', '마지막 수매가는 받겠습니다', "I'll take the final bounty", {
            say: ['마지막 수매가는 받겠습니다. 규정대로요.', "I'll take the final bounty. By the rules."],
            end: endTalk({ complete: 'bounty',
              lineKo: '규정대로요. 마지막 영수증. 뒷면 서명은 규정에 없어요. 그건 제 거예요. 마지막이니까 한 번은 규정 밖으로 해 봤어요.',
              lineEn: "By the rules. The last receipt. The signature on the back isn't in the rules. That one's mine. Since it's the last, I went outside the rules just once." }),
            note: ['마지막 수매가를 받았다. 영수증 뒷면에 오세찬 씨의 서명이 있었다. 규정에 없는 것이고, 마지막이라 한 번은 규정 밖으로 해 봤다고 했다.',
              "I took the final bounty. Sechan's signature was on the back of the receipt — not in the rules, he said; since it was the last, he went outside them just once."] }),
          opt('gloves', '반은 다음 사람 장갑값으로 두세요', 'Keep half for the next person\'s gloves', {
            say: ['수매가 반은 다음 사람 장갑값으로 남겨 두십시오.', "Please keep half the bounty for the next person's gloves."],
            end: endTalk({ complete: 'gloves_fund',
              lineKo: '다음 사람이요? …당신이라니까요. 좋아요. 그럼 그 장갑은 당신 다음 사람 거예요. 기록이랑 같이 넘겨요. 두 겹으로요.',
              lineEn: "The next person? ...I told you, that's you. All right. Then those gloves are for the one after you. Pass them on with the records. Two layers." }),
            note: ['수매가 반은 다음 사람 장갑값으로 남겨 달라고 했다. 오세찬 씨는 다음 사람은 나라면서도 영수증 반을 접어 장갑 상자에 넣었다. 그 장갑은 내 다음 사람 것이라고.',
              "I asked him to keep half the bounty for the next person's gloves. The next person is you, Sechan said — but he folded half the receipt into the glove box anyway. Those gloves are for the one after me."] }),
        ],
        note: ['독도에서 노무라 둘과 보름달물 열을 걷고 셌다. 숫자가 맞았다. 오세찬 씨는 십오 년 치 기록을 넘기겠다며, 다음 사람은 나라고 했다.',
          "At Dokdo I cleared and counted two Nomuras and ten moon jellyfish. The numbers matched. Sechan said he would hand over fifteen years of records — and that the next person was me."],
      }),
      next: scene([
        line(O, '…고마워요.', '...Thank you.'),
        line(O, '무거울 거예요. 그래도 들고 다닐 만해요. 숫자는 가벼우니까요.', "It'll be heavy. But you can carry it. Numbers are light."),
      ], {
        end: endTalk({ complete: 'next', lineKo: '장갑은 꼭 두 겹으로 껴요. 그건 숫자보다 중요해요.', lineEn: "Always wear two layers of gloves. That matters more than numbers." }),
        note: ['다음 사람으로서 받겠다고 했다. 오세찬 씨는 무거워도 숫자는 가벼우니 들고 다닐 만하다고, 장갑은 꼭 두 겹으로 끼라고 했다. 다음 사람이 나였다.',
          "I said I would take it, as the next person. It would be heavy, Sechan said, but numbers are light — and always wear two layers of gloves. The next person was me."],
      }),
    },
  },
];
