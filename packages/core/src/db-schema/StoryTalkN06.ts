/**
 * @file StoryTalkN06.ts
 * @description 290차 — N06 「씨바스터즈 — 해양대 루어 동아리」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`.
 *
 * 인물: 고호수(신입 — 농구부인 줄 알고 들어왔다 · 들뜬 해요체 · 농구공을 늘 끼고 다닌다 · 「선배들」)
 *   · 모태조(광기의 선배 — 짧게 끊는 반말 · 「실측」 · 「너」 · 진지해서 좀 무섭다 · 칭찬도 짧다)
 *   · 여강산(OB — 짧은 반말 · 「지금이야」 · 태풍 뒤 탁수를 기다린다 · 후배 앞에서 티 내지 않는다)
 *   · 백하늘(신입 — 알바생에게 반해 들어왔다 · 대사는 없다).
 * 호칭(290): 주인공은 「고호수 씨」 · 「모태조 씨」 · 「여강산 씨」 · 「백하늘 씨」. 인물은 주인공을 `{player} 씨` · 「너」로(형 없이).
 * 표시: 옛 받는 답 · 보상 답의 표시를 그대로 쓴다(choice.n06_1_* · n06_2_* · n06_3_asked_team · n06_4_*). 새 표시는 만들지 않았다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const HO = 'go_hosu';
const T = 'mo_taejo';
const K = 'yeo_gangsan';
const P = 'player';

export const TALKS_N06: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N06-1 「농구부인 줄 알았는데」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n06_1_offer', questId: 'N06-1', at: 'offer', npcId: HO, start: 'start',
    nodes: {
      start: scene([
        line(HO, '저기요! 혹시 낚시 잘하세요?', 'Excuse me! Are you any good at fishing?', { act: 'look_up' }),
        line(P, '잘하는지는 모르겠지만… 무슨 일이에요?', "I don't know about good... What's up?"),
        line(HO, '저 해양대 씨바스터즈 신입인데요. 농구부인 줄 알고 들었어요.', "I'm a new member of the Seabusters at the maritime university. I joined thinking it was the basketball club."),
        line(P, '(그래서 농구공을 끼고 방파제에 서 있는 건가…)', "(So that's why he's standing on the breakwater with a basketball under his arm...)"),
        line(HO, '근데 루어 동아리래요. 선배들이 농어 잡으러 간대서 따라 나왔어요.', "Turns out it's a lure-fishing club. The seniors said they were going after sea bass, so I tagged along."),
        line(P, '농어 잡으러요?', 'After sea bass?'),
        line(HO, '네. 근데… 농어가 뭐예요?', "Yeah. But... what's a sea bass?"),
        line(P, '바다에 사는 큰 물고기예요. 루어로 잡아요.', "A big sea fish. You catch them on lures."),
        line(HO, '그거 같이 잡아 주세요. 제 첫 농어요.', "Help me catch one. My first sea bass."),
      ], {
        choices: [
          opt('why_stay', '농구부가 아닌 걸 알았는데 왜 있어요?', "You knew it wasn't basketball — why stay?", {
            say: ['농구부가 아닌 걸 알았는데, 왜 계속 있어요?', "You found out it wasn't basketball. Why are you still here?"], next: 'why_stay' }),
          opt('ball', '농어는 그 농구공보다 클 수도 있어요', 'A sea bass can be bigger than that basketball', { next: 'ball' }),
          opt('first_bass', '같이 잡아요. 첫 농어는 오래 기억나요', "Let's catch one. You remember your first sea bass", {
            say: ['좋아요, 같이 잡아요. 첫 농어는 오래 기억에 남아요.', "All right, let's catch one together. Your first sea bass stays with you a long time."], next: 'first_bass' }),
        ],
        note: ['해양대 루어 동아리 씨바스터즈 신입 고호수 씨가 농구공을 낀 채 말을 걸어 왔다. 농구부인 줄 알고 들어왔다며, 농어가 뭔지도 모르면서 첫 농어를 같이 잡아 달라고 했다.',
          "Go Hosu, a new member of the maritime university's lure club, the Seabusters, came up to me with a basketball under his arm. He'd joined thinking it was the basketball club, and asked me to help him catch his first sea bass — without knowing what one was."],
      }),
      why_stay: scene([
        line(HO, '그게… 선배들이 이상하게 좋아요.', "Well... I just weirdly like the seniors."),
        line(HO, '그리고 미노우라는 거 봤는데, 물고기처럼 헤엄쳐요. 진짜로요.', "And I saw this thing called a minnow — it swims like a real fish. Seriously."),
        line(HO, '그래서 한 마리만 잡아 보고 정하려고요. 같이 잡아 주면, 계속할지 말지 알 것 같아요.', "So I'm going to catch one and then decide. If you help me, I think I'll know whether to keep going."),
      ], {
        end: endTalk({ accept: true, offer: 'why_stay' }),
        note: ['고호수 씨는 선배들이 좋고, 물고기처럼 헤엄치는 미노우가 신기해서 남았다고 했다. 농어 한 마리를 잡아 보고 계속할지 정하겠다고.',
          "Hosu said he'd stayed because he liked the seniors and the minnow lure that swims like a real fish amazed him. He'd catch one sea bass, then decide whether to stay."],
      }),
      ball: scene([
        line(HO, '진짜요? 이 공보다요?', 'Really? Bigger than this ball?', { act: 'peer' }),
        line(HO, '그럼 이 공 계속 들고 다녀야겠네요. 잡으면 대 보게요.', "Then I'd better keep carrying it. So I can hold it up against the fish."),
      ], {
        choices: [
          opt('measure', '잡으면 꼭 대 봐요', "Hold it up against the fish when you catch one", {
            end: endTalk({ accept: true, offer: 'bigger_than_ball',
              lineKo: '네! 선배들이 뭘 긋는다고 하던데, 그게 뭔지도 가르쳐 주세요!',
              lineEn: "Yes! The seniors keep saying something about drawing a line — teach me what that means too!" }),
            note: ['농어는 농구공보다 클 수도 있다고 했더니, 고호수 씨는 잡으면 대 보겠다며 공을 계속 들고 다니겠다고 했다.',
              "When I said a sea bass could be bigger than his basketball, Hosu decided to keep carrying it so he could hold it up against his catch."] }),
          opt('leave_ball', '공은 두고 가요. 굴러가면 못 찾아요', "Leave the ball. If it rolls off, it's gone", {
            say: ['그래도 농구공은 두고 가요. 방파제에서 굴러가면 못 찾아요.', "Still, leave the basketball behind. If it rolls off the breakwater, you won't get it back."], next: 'leave_ball' }),
        ],
        note: ['농어는 농구공보다 클 수도 있다고 했다.', 'I told him a sea bass could be bigger than his basketball.'],
      }),
      leave_ball: scene([
        line(HO, '안 돼요! 이거 있어야 마음이 편해요.', "No way! I feel better with it."),
        line(HO, '안 굴리게 조심할게요. 가방 끈으로 묶어 둘게요. 그럼 됐죠? 공은 구경만 할 거예요.', "I'll be careful it doesn't roll. I'll tie it to my bag strap. That works, right? The ball's just going to watch."),
      ], {
        end: endTalk({ accept: true, offer: 'leave_ball' }),
        note: ['공은 두고 가자고 했지만, 고호수 씨는 공을 꼭 껴안으며 가방 끈에 묶어 두겠다고 했다. 공은 구경만 한다고.',
          "I suggested leaving the ball, but Hosu hugged it tight and said he'd tie it to his bag strap. The ball would only watch."],
      }),
      first_bass: scene([
        line(HO, '오래요? 기억나요? 첫 농어요.', "A long time? Do you remember yours? Your first sea bass?", { act: 'look_up' }),
        line(HO, '…아, 지금 말 안 해 줘도 돼요. 제가 잡고 나서 들을래요. 그래야 비교하죠.', "...Oh, don't tell me now. I'll hear it after I catch mine. So I can compare."),
        line(HO, '가요, 방파제로!', "Let's go — to the breakwater!"),
      ], {
        end: endTalk({ accept: true, offer: 'first_bass' }),
        note: ['첫 농어는 오래 기억난다고 했더니, 고호수 씨는 눈을 반짝이며 내 첫 농어 얘기는 자기가 잡고 나서 듣겠다고 했다. 비교해야 한다고.',
          "When I said you remember your first sea bass for a long time, Hosu's eyes lit up — he'd hear about mine after he caught his, so he could compare."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N06-1 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n06_1_done', questId: 'N06-1', at: 'complete', npcId: HO, start: 'start',
    nodes: {
      start: scene([
        line(HO, '잡았어요! 농어!', "I got it! A sea bass!", { act: 'look_up' }),
        line(HO, '농구공보다 큰데요!', "It's bigger than the basketball!"),
        line(P, '정말 공보다 크네요.', "It really is bigger than the ball."),
        line(HO, '미노우 뒤로 뭐가 따라오는데, 멈추면 안 될 것 같아서 그냥 계속 감았어요.', "Something was following the minnow, and I felt like I shouldn't stop, so I just kept reeling."),
        line(HO, '…저 계속 할래요, 이거.', "...I'm going to keep doing this.", { act: 'nod' }),
        line(P, '(농구공은 아직 옆에 있다.)', '(The basketball is still beside him.)'),
      ], {
        choices: [
          opt('lesson', '선배들 액션, 저도 옆에서 같이 봐도 될까요?', "Mind if I watch the seniors' action with you?", {
            say: ['고호수 씨, 선배들 액션 보는 눈이 좋던데요. 저도 옆에서 같이 봐도 될까요?', "Hosu, you've got a good eye for the seniors' lure action. Mind if I watch alongside you?"], next: 'lesson' }),
          opt('pay', '동아리 활동비 같은 게 있어요?', 'Is there such a thing as club expenses?', {
            end: endTalk({ complete: 'pay',
              lineKo: '있어요! 회비… 라면 살 돈이지만요. 원래 오늘 저녁 동아리방 라면 값이에요. 근데 농어 잡게 해 줬으니까요. 오늘은 라면 대신 농어 먹으면 돼요. 선배들이 회 뜰 줄 안대요.',
              lineEn: "There is! Club dues... which are ramyeon money, really. It was meant for tonight's ramyeon in the clubroom. But you helped me catch a sea bass. Tonight we can eat sea bass instead. The seniors say they can make sashimi." }),
            note: ['동아리 활동비를 물었다. 고호수 씨는 오늘 저녁 동아리방 라면 값을 동전으로 모아 줬다. 오늘은 라면 대신 농어를 먹으면 된다고.',
              "I asked about club expenses. Hosu gathered up tonight's clubroom ramyeon money in coins for me — tonight they'd eat sea bass instead."] }),
          opt('decline', '농어 잡은 얼굴 봤으면 됐어요', "Seeing your face when you landed it is enough", {
            end: endTalk({ complete: 'decline',
              lineKo: '{player} 씨는 이제 우리 동아리 명예 회원이에요! 명예 회원이 뭔지는 저도 몰라요. 방금 제가 만들었어요. 선배들한테 말하면 아마 된다고 할 거예요. 다들 좋아할 거예요. 농어 잡게 해 준 사람이니까요.',
              lineEn: "{player}, you're an honorary member of our club now! I don't know what that means either. I just made it up. If I tell the seniors, they'll probably say yes. Everyone will like you. You're the one who helped me catch a sea bass." }),
            note: ['농어 잡은 얼굴을 봤으면 됐다고 했다. 고호수 씨는 그 자리에서 나를 동아리 명예 회원으로 만들었다. 명예 회원이 뭔지는 자기도 모른다면서.',
              "I said seeing his face when he landed it was enough. Hosu made me an honorary member of the club on the spot — though he admitted he didn't know what that meant either."] }),
          opt('ball_record', '그 농구공에 오늘 농어 길이를 적어 둬요', "Write today's sea bass length on that ball", { next: 'ball_record' }),
        ],
        note: ['고호수 씨가 루어로 첫 농어를 걸었다. 미노우가 수면을 긋고 무언가 뒤따라왔다. 농구공보다 컸다. 고호수 씨는 계속 하겠다고 했다. 농구공은 아직 옆에 있었다.',
          "Hosu hooked his first sea bass on a lure. The minnow drew a line across the surface and something followed. It was bigger than the basketball. He said he'd keep at it. The ball was still beside him."],
      }),
      lesson: scene([
        line(HO, '저한테요? 네!', "From me? Sure!", { act: 'look_up' }),
        line(HO, '저는 그냥 신기해서 보는 거예요. 선배들 손목이 다 달라요. 누구는 짧게 툭툭, 누구는 길게 쭉.', "I only watch because it's cool. Every senior's wrist is different. Some go short, tap-tap. Some go long and smooth."),
        line(HO, '근데 다 물어요. 그게 제일 신기해요.', "But they all get bites. That's the coolest part."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['고호수 씨와 나란히 서서 선배들의 루어 액션을 봤다. 손목이 다 다른데 다 문다고. 초보의 눈으로 다시 본 액션이 새로웠다.',
          "I stood beside Hosu and watched the seniors work their lures. Every wrist was different, and they all got bites. Seeing it through a beginner's eyes made it new again."],
      }),
      ball_record: scene([
        line(HO, '길이요? …좋아요! 매직 있어요?', "The length? ...Great idea! Got a marker?"),
        line(P, '(공에 날짜와 길이를 꾹꾹 눌러 적는다.)', '(He presses hard, writing the date and length on the ball.)'),
        line(HO, '이제 이 공 못 버리겠네요. 계속 들고 다닐래요.', "Now I can never throw this ball away. I'm carrying it everywhere."),
        line(HO, '농구부인 줄 알고 왔다가 농어 잡은 날이 여기 적혀 있으니까요. 다음 농어는 그 밑에 적을래요.', "The day I came for basketball and caught a sea bass is written right here. My next one goes underneath."),
      ], {
        end: endTalk({ complete: 'ball_record' }),
        note: ['농구공에 오늘 농어 길이를 적어 두라고 했다. 고호수 씨는 날짜와 길이를 꾹꾹 눌러 적고, 다음 농어는 그 밑에 적겠다고 했다.',
          "I suggested writing today's sea bass length on the basketball. Hosu pressed the date and length into it, and said the next one would go underneath."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N06-2 「불순한 동기」 — 받는 자리(모태조)
  // ═══════════════════════════════════════════
  {
    id: 'n06_2_offer', questId: 'N06-2', at: 'offer', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(T, '너. 시간 있지.', 'You. You have time.', { act: 'look_up' }),
        line(P, '네? 저요?', 'Huh? Me?'),
        line(T, '하늘이 좀 진지하게 만들어야 해.', "I need to make Haneul take this seriously."),
        line(P, '하늘이요?', 'Haneul?'),
        line(T, '신입. 낚시를 딴생각하면서 해.', "New member. Fishes with his head somewhere else.", { act: 'shake_head' }),
        line(P, '그래서 제가 뭘 하면 돼요?', 'So what do you need from me?'),
        line(T, '실측. 상황별 루어. 같이 던져.', "Field measurement. Lures by situation. Cast with us."),
        line(T, '세 마리. 네가 옆에서 바꿔 가며 잡으면 하늘이도 따라 해.', "Three fish. If you switch lures and catch beside him, Haneul will copy you."),
        line(P, '(눈빛이 진지하다. 진지해서 좀 무섭다.)', "(His eyes are dead serious. Serious enough to be a little scary.)"),
      ], {
        choices: [
          opt('haneul', '백하늘 씨가 누구고, 왜 진지하지 않다는 거예요?', "Who's Haneul, and why isn't he serious?", { next: 'haneul' }),
          opt('measure', '실측이라니, 뭘 어떻게 재요?', 'Field measurement? Measuring what, how?', { next: 'measure' }),
          opt('eager', '상황마다 루어 바꾸는 법, 저도 배우고 싶어요', 'I want to learn to switch lures by situation too', {
            say: ['상황마다 루어를 바꾸는 법이라면 저도 배우고 싶어요.', "If it's about switching lures to suit the situation, I want to learn that too."], next: 'eager' }),
        ],
        note: ['씨바스터즈의 모태조 씨가 신입 백하늘 씨를 진지한 앵글러로 만들어야 한다고 했다. 방법은 실측, 상황별 루어 선택. 루어로 세 마리를 옆에서 바꿔 가며 잡아 달라고 했다.',
          "Mo Taejo of the Seabusters said he had to turn new member Baek Haneul into a serious angler. The method: field measurement — choosing lures by situation. He wanted me to catch three on lures beside Haneul, switching as I went."],
      }),
      haneul: scene([
        line(T, '백하늘. 신입. 알바생한테 반해서 들어왔어.', "Baek Haneul. New member. Joined because he fell for some part-timer."),
        act(T, 'laugh'),
        line(T, '어디 알바생인지는 묻지 마. 나도 들었다가 후회했어.', "Don't ask where she works. I asked, and I regretted it."),
        line(T, '동기는 상관없어. 불순해도 동기야. 근데 던질 때까지 딴생각하면 안 되지.', "Motive doesn't matter. An impure motive is still a motive. But you can't be thinking about something else while you cast."),
      ], {
        choices: [
          opt('cast_with', '알겠어요. 같이 던질게요', "Got it. I'll cast with you", {
            end: endTalk({ accept: true, offer: 'ask_haneul',
              lineKo: '그래서 실측이야. 같이 던져.',
              lineEn: "That's why we measure. Cast with us." }),
            note: ['백하늘 씨는 알바생에게 반해 들어온 신입이라고 했다. 모태조 씨는 불순해도 동기는 동기지만, 던질 때 딴생각하면 안 된다고 했다. 같이 던지기로 했다.',
              "Baek Haneul had joined because he'd fallen for a part-timer. Taejo said an impure motive is still a motive, but you can't let your mind wander while you cast. I agreed to fish with them."] }),
          opt('uneasy', '남의 연애사에 끼는 것 같아서 좀 그래요', "It feels like meddling in someone's love life", {
            say: ['남의 연애사에 끼는 것 같아서 좀 그래요.', "I'm a bit uneasy. It feels like butting into someone's love life."], next: 'uneasy' }),
        ],
        note: ['백하늘 씨는 알바생에게 반해 동아리에 들어왔다고 했다.', "Haneul had joined the club because he fell for a part-timer."],
      }),
      uneasy: scene([
        line(T, '연애? 그건 하늘이 사정이고. 나는 낚시만 봐.', "Love life? That's Haneul's business. I only look at the fishing."),
        line(T, '동기가 뭐든 물가에 나왔으면 앵글러야. 앵글러면 제대로 해야지.', "Whatever the motive, if you're at the water's edge you're an angler. And an angler does it properly."),
      ], {
        choices: [
          opt('fishing_only', '…그럼 낚시만 볼게요', "...Then I'll only look at the fishing", {
            end: endTalk({ accept: true, offer: 'uneasy',
              lineKo: '그래. 네가 옆에서 던지면 하늘이도 따라 해. 세 마리. 실측.',
              lineEn: "Right. If you cast beside him, Haneul will follow. Three fish. Measured." }),
            note: ['남의 연애사에 끼는 것 같아 마음이 걸렸다. 모태조 씨는 자기는 낚시만 본다고 했다. 나도 낚시만 보기로 했다.',
              "Butting into someone's love life bothered me. Taejo said he only looked at the fishing. I decided to do the same."] }),
          opt('refuse', '그래도 저는 빠질게요', "Even so, I'll sit this one out", {
            say: ['그래도 저는 빠질게요. 아무래도 마음이 안 내켜요.', "Even so, I'll sit this one out. My heart just isn't in it."], next: 'refuse' }),
        ],
        note: ['모태조 씨는 연애는 백하늘 씨 사정이고, 자기는 낚시만 본다고 했다.', "Taejo said love was Haneul's business; he only cared about the fishing."],
      }),
      refuse: scene([
        act(T, 'silence'),
        line(T, '…그래. 억지로 끌고 가면 실측이 안 돼. 손이 딴 데 가 있거든.', "...Fine. Drag someone along and the measuring's worthless. Their hands are somewhere else."),
        line(T, '가 봐.', "Off you go."),
      ], {
        end: endTalk({ fail: true }),
        note: ['결국 빠지겠다고 했다. 모태조 씨는 억지로 끌고 가면 실측이 안 된다며 더 붙잡지 않았다. 백하늘 씨의 눈이 바뀌는 날은 내가 볼 수 없게 됐다.',
          "In the end I bowed out. Taejo said dragging someone along ruins the measuring, and didn't press me. I wouldn't be there to see Haneul's eyes change."],
      }),
      measure: scene([
        line(T, '조류, 수심, 탁도. 세 개.', "Current, depth, clarity. Three things.", { act: 'nod' }),
        line(T, '물살 세면 무게, 깊으면 가라앉는 속도, 흐리면 색. 그걸 바꿔 가며 재.', "Strong current, change the weight. Deep water, change the sink rate. Murky water, change the colour. Switch and measure."),
        line(P, '말로 들으면 간단한데요.', 'Sounds simple when you say it.'),
        line(T, '말로 하면 안 믿어. 직접 바꿔서 잡아 봐야 믿지. 그래서 세 마리야. 세 가지 물에서.', "Nobody believes it from words. You believe it once you've switched and caught. That's why it's three. In three kinds of water."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_measure' }),
        note: ['실측은 조류, 수심, 탁도 세 가지를 보고 루어의 무게, 가라앉는 속도, 색을 바꿔 가며 재는 거라고 했다. 말로는 안 믿으니 세 가지 물에서 세 마리를 잡아 보라고.',
          "Field measurement meant reading current, depth and clarity, and switching lure weight, sink rate and colour to match. Nobody believes it from words, so: three fish, in three kinds of water."],
      }),
      eager: scene([
        line(T, '좋아. 그 말 하늘이 앞에서 한 번 더 해. 선배 말보다 남 말이 더 먹혀.', "Good. Say that again in front of Haneul. A stranger's words land better than a senior's.", { act: 'nod' }),
        line(T, '루어 상자 통째로 가져와. 하나로 끝내려는 놈은 안 데려가.', "Bring your whole lure box. I don't take anyone who plans to get by on one lure."),
        line(T, '세 마리, 세 가지 물. 오늘은 물이 계속 바뀔 거야.', "Three fish, three kinds of water. The water's going to keep changing today."),
      ], {
        end: endTalk({ accept: true, offer: 'eager' }),
        note: ['상황마다 루어 바꾸는 법을 배우고 싶다고 했다. 모태조 씨는 만족스럽게 고개를 끄덕이며, 그 말을 백하늘 씨 앞에서 한 번 더 하라고, 루어 상자를 통째로 가져오라고 했다.',
          "I said I wanted to learn to switch lures by situation. Taejo nodded, satisfied, and told me to say it again in front of Haneul — and to bring my whole lure box."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N06-2 — 끝내는 자리(백하늘도 곁에 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n06_2_done', questId: 'N06-2', at: 'complete', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(T, '봤어?', 'You see that?', { act: 'look_up' }),
        line(P, '백하늘 씨요?', 'Haneul?'),
        line(T, '눈. 바뀌었지. 두 번째부터.', "His eyes. They changed. From the second fish on."),
        line(P, '처음엔 딴 데를 보더니, 두 번째부터는 물을 보더라고요.', "At first he was looking elsewhere, but from the second one, he was watching the water."),
        line(T, '그게 내가 원하던 거야.', "That's what I wanted.", { act: 'nod' }),
        line(T, '…고맙다.', "...Thanks."),
      ], {
        choices: [
          opt('lesson', '모태조 씨 루어 선택표, 저도 받고 싶어요', "I'd like a copy of your lure chart, Taejo", {
            say: ['모태조 씨의 루어 선택표, 저도 받고 싶어요.', "I'd like a copy of your lure-choice chart, Taejo."], next: 'lesson' }),
          opt('pay', '실측 도우미 값은 있어요?', 'Is there a fee for the measuring help?', {
            end: endTalk({ complete: 'pay',
              lineKo: '있지. 선배가 후배한테 사는 거. 술은 안 사. 술 먹고 던지면 손이 흔들려서 실측이 안 돼. 그 돈으로 루어 하나 더 사. 탁수용으로.',
              lineEn: "There is. A senior treating a junior. Not drinks, though. Cast after drinking and your hand shakes, and the measuring's worthless. Buy another lure with it. One for murky water." }),
            note: ['실측 도우미 값을 물었다. 모태조 씨는 술이 아니라 돈을 줬다. 술 먹고 던지면 실측이 안 된다며, 그 돈으로 탁수용 루어를 하나 더 사라고 했다.',
              "I asked about a fee for the measuring help. Taejo gave me money, not drinks — drink and your cast goes, he said. Buy another lure for murky water with it."] }),
          opt('decline', '백하늘 씨 눈 바뀐 거 봤으면 됐어요', "Seeing Haneul's eyes change is enough", {
            end: endTalk({ complete: 'decline',
              lineKo: '…너도 광기가 있네. 좋아. 광기는 칭찬이야. 남의 눈 바뀌는 걸 보려고 하루를 쓰는 놈은 드물어. 하늘이도 언젠가 신입 눈 바뀌는 게 보고 싶어질 거야. 그게 동아리야.',
              lineEn: "...You've got a bit of madness too. Good. Madness is a compliment. Not many would spend a whole day just to watch someone's eyes change. Someday Haneul will want to watch a newbie's eyes change too. That's what a club is." }),
            note: ['백하늘 씨 눈이 바뀐 걸 봤으면 됐다고 했다. 모태조 씨는 너도 광기가 있다며, 광기는 칭찬이라고 했다.',
              "I said seeing Haneul's eyes change was enough. Taejo said I had a bit of madness too — and madness was a compliment."] }),
          opt('praise', '백하늘 씨한테도 잘했다고 전해 주세요', 'Tell Haneul he did well, too', {
            say: ['백하늘 씨한테도 잘했다고 전해 주세요. 두 번째부터 눈이 달랐어요.', "Tell Haneul he did well, too. From the second fish, his eyes were different."], next: 'praise' }),
        ],
        note: ['조류, 수심, 탁도에 따라 루어를 바꿔 세 마리를 올렸다. 백하늘 씨는 처음엔 딴생각을 하다가 두 번째부터 눈이 바뀌었다. 모태조 씨는 그게 원하던 거라며 짧게 고맙다고 했다.',
          "I switched lures by current, depth and clarity and landed three. Haneul's mind wandered at first, but from the second fish his eyes changed. Taejo said that was what he wanted, and thanked me in a word."],
      }),
      lesson: scene([
        line(T, '…표? 머리에 있는데. 적어 줄게.', "...A chart? It's in my head. I'll write it down."),
        line(T, '물이 맑으면 자연색, 탁하면 눈에 띄는 색. 그 사이는 네가 정해.', "Clear water, natural colours. Murky water, loud colours. In between, you decide."),
        line(T, '표는 거기까지만 맞아. 나머지는 물가에서 네 눈으로 재. 그게 실측이야.', "The chart's only right up to there. The rest you measure with your own eyes at the water. That's field measurement."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['모태조 씨에게 루어 선택표를 받았다. 맑으면 자연색, 탁하면 눈에 띄는 색. 그 사이는 물가에서 내 눈으로 재라고 했다.',
          "Taejo wrote out his lure chart for me: natural colours in clear water, loud ones in murky. Everything in between, I'd have to measure with my own eyes."],
      }),
      praise: scene([
        line(T, '…네가 직접 해. 내가 하면 잔소리고, 네가 하면 칭찬이야.', "...Tell him yourself. From me it's nagging. From you it's praise."),
        line(P, '(모태조 씨가 턱짓한 쪽에서, 백하늘 씨가 귀를 쫑긋 세우고 있다.)', '(Where Taejo jerks his chin, Haneul is already pricking up his ears.)'),
        line(T, '봐, 벌써 듣고 있잖아. 칭찬은 그 자리에서 해야 먹혀. 늦으면 그냥 인사야.', "See, he's already listening. Praise only works on the spot. Late, it's just small talk."),
      ], {
        end: endTalk({ complete: 'praise_haneul' }),
        note: ['백하늘 씨에게 잘했다고 전해 달라고 했더니, 모태조 씨는 직접 하라고 했다. 칭찬은 그 자리에서 해야 먹힌다고. 백하늘 씨가 벌써 귀를 쫑긋 세우고 있었다.',
          "When I asked Taejo to tell Haneul he'd done well, he told me to do it myself — praise only works on the spot. Haneul was already pricking up his ears."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N06-3 「먹보」 — 받는 자리(태풍 뒤에만 · 미룰 수 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n06_3_offer', questId: 'N06-3', at: 'offer', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '태풍 지나갔지.', "The typhoon's passed.", { act: 'look_sea' }),
        line(P, '네. 물이 아직 흙빛이에요.', "Yes. The water's still the colour of mud."),
        line(K, '그게 지금이야. 탁수.', "That's why it's now. Murky water."),
        line(P, '탁수가 좋아요?', 'Murky water is good?'),
        line(K, '작은 놈들은 숨고, 큰 놈만 먹으러 나와.', "The small ones hide. Only the big ones come out to feed."),
        line(K, '괴물 농어 들어. 60 넘는 놈.', "A monster sea bass is in. Over sixty."),
        line(P, '60이요?', 'Over sixty?'),
        line(K, '혼자는 못 올려. 셋이 협공. 올 거지?', "One person can't land it. Three of us, together. You're in, right?"),
      ], {
        choices: [
          opt('go', '탁수 농어라면 지금이죠. 갈게요', "Murky-water sea bass — it's now. I'm in", {
            say: ['탁수 농어라면 지금이죠. 갈게요.', "If it's sea bass in murky water, it's now. I'm in."],
            end: endTalk({ accept: true, offer: 'go',
              lineKo: '그 눈이야. 뜰채 챙겨. 대는 건 내가 해. 던지는 건 너희 몫이고.',
              lineEn: "That's the look. Bring the landing net. I'll handle the netting. The casting's up to you lot." }),
            note: ['태풍 뒤 탁수에 괴물 농어를 노리러 가기로 했다. 여강산 씨는 뜰채를 챙기라며, 대는 건 자기가 하고 던지는 건 우리 몫이라고 했다.',
              "I agreed to go after the monster sea bass in the post-typhoon murk. Gangsan told me to bring a landing net — he'd do the netting; the casting was ours."] }),
          opt('team', '셋이면, 나머지 한 사람은 누구예요?', "Three of us — who's the third?", {
            say: ['셋이 협공이라면, 나머지 한 사람은 누구예요?', "If it's three of us, who's the third?"], next: 'team' }),
          opt('decline', '태풍 직후는 위험해요. 이번엔 빠질게요', "Right after a typhoon is dangerous. I'll pass", { next: 'decline' }),
        ],
        note: ['씨바스터즈 OB 여강산 씨가 연락해 왔다. 태풍이 지나가 물이 탁한 지금, 60cm가 넘는 괴물 농어가 든다고. 혼자는 못 올리니 셋이 협공하자고 했다.',
          "Yeo Gangsan, a Seabusters old boy, got in touch. Now, with the water murky after the typhoon, a monster sea bass over sixty centimetres was in. One person couldn't land it — three of us would go at it together."],
      }),
      team: scene([
        line(K, '나, 너, 그리고 동아리 애 하나. 누가 올지는 가 봐야 알아.', "Me, you, and one of the club kids. We'll see who turns up."),
        act(K, 'laugh'),
        line(K, '태풍 지나가면 다들 수업 빼고 나오거든.', "After a typhoon, they all skip class and come out."),
        line(K, '하나는 라인, 하나는 뜰채, 하나는 캐스팅. 혼자 하다 놓치면 평생 그 얘기만 해.', "One on the line, one on the net, one casting. Lose it on your own and you'll talk about nothing else for the rest of your life."),
      ], {
        choices: [
          opt('three', '알겠어요. 셋이 올려요', "Got it. The three of us land it", {
            end: endTalk({ accept: true, offer: 'ask_team' }),
            note: ['셋은 여강산 씨와 나, 그리고 동아리 학생 하나라고 했다. 한 사람은 라인, 한 사람은 뜰채, 한 사람은 캐스팅. 괴물은 혼자 못 올린다고.',
              "The three would be Gangsan, me and one club student. One on the line, one on the net, one casting. A monster can't be landed alone."] }),
          opt('net_joke', '뜰채보다 크면 어떡해요?', "What if it's bigger than the net?", {
            say: ['괴물이라니, 뜰채보다 크면 어떡해요?', "A monster? What if it's bigger than the net?"], next: 'net_joke' }),
        ],
        note: ['한 사람은 라인, 한 사람은 뜰채, 한 사람은 캐스팅을 맡는다고 했다.', 'One on the line, one on the net, one casting.'],
      }),
      net_joke: scene([
        line(K, '그럼 셋이 끌어안고 올려야지.', "Then the three of us hug it and haul it up."),
        line(K, '농담 아니야. 60 넘는 놈은 뜰채 테두리에 걸려서 튕겨 나가.', "I'm not joking. Anything over sixty catches on the rim and bounces right out."),
        line(K, '머리부터 넣어. 꼬리부터 넣으면 백이면 백 놓친다. 이거 하나만 기억하고 와.', "Head first. Tail first and you lose it a hundred times out of a hundred. Remember that one thing and come."),
      ], {
        end: endTalk({ accept: true, offer: 'net_joke' }),
        note: ['뜰채보다 크면 어떡하느냐고 농담했더니, 여강산 씨는 진지하게 60 넘는 놈은 머리부터 넣으라고 했다. 꼬리부터 넣으면 백이면 백 놓친다고.',
          "When I joked about it being bigger than the net, Gangsan answered seriously: anything over sixty goes in head first. Tail first and you lose it every time."],
      }),
      decline: scene([
        line(K, '…맞는 말이야.', "...Fair point.", { act: 'nod' }),
        line(K, '태풍 뒤 방파제는 원래 조심해야 돼. 너울이 남아 있거든. 무서운 줄 아는 놈이 오래 낚시해.', "You should always be careful on a breakwater after a typhoon. The swell lingers. People who know fear fish the longest."),
        line(K, '다음 태풍에 봐. 그놈은 또 온다.', "See you next typhoon. That one will be back."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['태풍 직후는 위험하다며 미뤘다. 여강산 씨는 맞는 말이라며, 무서운 줄 아는 놈이 오래 낚시한다고 했다. 연락처는 지우지 않았다.',
          "I passed — right after a typhoon was too dangerous. Gangsan agreed: those who know fear fish the longest. He didn't delete my number."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N06-3 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n06_3_done', questId: 'N06-3', at: 'complete', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '먹보! 봤어?', "The Glutton! You see that?", { act: 'look_up' }),
        line(P, '수면을 가르는 거, 똑똑히 봤어요.', "I saw it split the surface. Clear as day."),
        line(K, '60 훌쩍 넘어. 셋이니까 올렸어.', "Well over sixty. We landed it because there were three of us."),
        line(K, '이 베스트, 네가 입어.', "This vest. You wear it now."),
        line(P, '이거 여강산 씨 태클 베스트잖아요.', "This is your tackle vest, Gangsan."),
        line(K, '나는 OB야. 던지는 건 너희 몫이야.', "I'm an old boy. The casting's up to you lot now."),
      ], {
        choices: [
          opt('vest', '베스트 잘 입을게요. 다음 태풍에도 불러 주세요', "I'll wear it well. Call me next typhoon too", {
            end: endTalk({ complete: 'vest',
              lineKo: '태풍은 부르는 게 아니라 오는 거야. 그때 봐. 그 베스트, 오래 입었어. 주머니마다 이유가 있어. 왼쪽은 루어, 오른쪽은 바늘. 섞으면 급할 때 손이 엉켜.',
              lineEn: "You don't call a typhoon. It comes. See you then. I wore that vest a long time. Every pocket has a reason. Left for lures, right for hooks. Mix them and your hands tangle when you're in a hurry." }),
            note: ['여강산 씨의 태클 베스트를 물려받았다. 왼쪽 주머니는 루어, 오른쪽은 바늘. 섞으면 급할 때 손이 엉킨다고 했다.',
              "I inherited Gangsan's tackle vest. Left pocket for lures, right for hooks — mix them and your hands tangle when you're in a hurry."] }),
          opt('lesson', '뜰채 대는 타이밍, 어떻게 아셨어요?', 'How did you know when to bring in the net?', {
            say: ['협공할 때 뜰채 대는 타이밍, 어떻게 아셨어요?', "When we worked together — how did you know the moment to bring in the net?"], next: 'lesson' }),
          opt('pay', '동아리 대결 상금이 있다고 들었어요', 'I heard there is prize money for club matches', {
            end: endTalk({ complete: 'pay',
              lineKo: '있지. 이번 건 내가 쏜다. 대결도 아니었지만 먹보를 올렸으니 대결 이상이야. OB가 쏘는 건 이럴 때야. 후배들 앞에서는 비밀이고.',
              lineEn: "There is. This one's on me. It wasn't even a match, but we landed the Glutton, so it's better than a match. This is what an old boy pays out for. Keep it from the juniors." }),
            note: ['동아리 대결 상금을 물었다. 여강산 씨는 먹보를 올렸으니 대결 이상이라며 두꺼운 봉투를 건넸다. 후배들 앞에서는 비밀이라고.',
              "I asked about club-match prize money. Gangsan said landing the Glutton beat any match, and handed me a thick envelope — not a word to the juniors."] }),
          opt('no_name', '먹보는 셋이 올린 거예요. 제 이름은 빼 주세요', "The three of us landed it. Leave my name out", {
            say: ['먹보는 셋이 올린 거예요. 제 이름은 안 남겨도 돼요.', "The three of us landed the Glutton. You don't need to put my name down."], next: 'no_name' }),
        ],
        note: ['태풍 뒤 탁수에서 셋이 협공해 60cm가 넘는 농어를 올렸다. 한 사람은 라인, 한 사람은 뜰채, 한 사람은 캐스팅. 먹보라고 이름 붙였다. 여강산 씨는 자기 태클 베스트를 벗어 내게 입으라고 했다.',
          "In the murk after the typhoon, the three of us worked together and landed a sea bass over sixty centimetres — one on the line, one on the net, one casting. We named it the Glutton. Gangsan took off his tackle vest and told me to wear it."],
      }),
      lesson: scene([
        line(K, '농어 눈을 봐. 돌아서는 순간이 있어.', "Watch the sea bass's eye. There's a moment it turns."),
        line(K, '힘 빠져서 옆으로 눕는 순간. 그때 머리 쪽으로 뜰채를 대.', "The moment it tires and rolls onto its side. That's when you bring the net in, head end."),
        line(K, '쫓아가면 안 돼. 기다리면 와. 큰 놈은 다 그래. 서두르는 놈이 놓쳐.', "Don't chase it. Wait, and it comes to you. All the big ones do. The one who hurries loses it."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['뜰채 대는 타이밍을 물었다. 농어가 힘이 빠져 옆으로 눕는 순간, 머리 쪽으로 뜰채를 댄다고 했다. 쫓아가지 말고 기다리라고.',
          "I asked how he timed the net. When the sea bass tires and rolls onto its side, he said, bring the net in at the head. Don't chase. Wait."],
      }),
      no_name: scene([
        act(K, 'silence'),
        line(K, '…이름 빼 달라는 놈은 처음이네.', "...First time anyone's asked to have their name left off."),
        act(K, 'laugh'),
        line(K, '그래, 기록에는 셋이라고 쓸게. 씨바스터즈 셋.', "All right. I'll write three in the record. Three Seabusters."),
        line(K, '근데 부산 방파제에선 다 알 거야. 먹보 올린 날 누가 있었는지. 소문은 기록보다 빨라.', "But everyone on the Busan breakwaters will know who was there the day the Glutton came up. Rumour's faster than records."),
      ], {
        end: endTalk({ complete: 'no_name' }),
        note: ['먹보는 셋이 올린 거라며 내 이름은 빼 달라고 했다. 여강산 씨는 한참 보다 웃으며 기록에는 씨바스터즈 셋이라고 쓰겠다고 했다. 소문은 기록보다 빠르다면서.',
          "I asked to have my name left off — the three of us landed the Glutton. Gangsan stared, then laughed, and said the record would read three Seabusters. Rumour, he said, is faster than records."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N06-4 「졸업 대결」 — 받는 자리(모태조)
  // ═══════════════════════════════════════════
  {
    id: 'n06_4_offer', questId: 'N06-4', at: 'offer', npcId: T, start: 'start',
    nodes: {
      start: scene([
        line(T, '해산이야.', "We're disbanding.", { act: 'look_away' }),
        line(P, '네?', 'What?'),
        line(T, '씨바스터즈. 졸업이야.', "The Seabusters. We're graduating."),
        line(P, '…벌써요?', '...Already?'),
        line(T, '마지막 대결을 할 거야. 상대는 너.', "We're having one last match. Against you."),
        line(P, '제가요?', 'Me?'),
        line(T, '부산으로 와. 두 마리.', "Come to Busan. Two fish."),
        line(T, '호수는 농구공 들고 올 거야.', "Hosu will bring his basketball."),
      ], {
        choices: [
          opt('no_mercy', '마지막이라면 제대로 붙을게요. 안 봐 드려요', "If it's the last, I'll go all out. No mercy", {
            say: ['마지막이라면 제대로 붙을게요. 봐 드리지 않아요.', "If it's the last one, I'll go all out. I won't go easy on you."], next: 'no_mercy' }),
          opt('disband', '동아리가 아예 없어지는 거예요?', 'Is the club really going away for good?', {
            say: ['해산이라니요. 동아리가 아예 없어지는 거예요?', "Disbanding? Is the club really going away for good?"], next: 'disband' }),
          opt('hosu_ball', '고호수 씨는 아직도 농구공을 들고 다녀요?', 'Does Hosu still carry that basketball?', { next: 'hosu_ball' }),
        ],
        note: ['모태조 씨가 씨바스터즈가 졸업과 함께 해산한다고 했다. 마지막 대결 상대로 나를 지명하며, 부산으로 와서 두 마리를 올리라고 했다. 고호수 씨는 농구공을 들고 올 거라고.',
          "Taejo told me the Seabusters were disbanding with graduation. He named me as the opponent for their last match: come to Busan, land two fish. Hosu would bring his basketball."],
      }),
      no_mercy: scene([
        line(T, '그래야지. 봐주면 내가 화낸다. 졸업 대결은 봐주는 게 아니야.', "Good. Go easy and I'll be angry. A graduation match isn't for going easy."),
        line(T, '두 마리. 빨리가 아니라, 제대로 읽고 올리는 쪽이 이겨.', "Two fish. Not the fastest — whoever reads the water right and lands them wins."),
        line(T, '실측 기억나지? 그거 마지막으로 보자.', "Remember field measurement? Let's see it one last time."),
      ], {
        end: endTalk({ accept: true, offer: 'no_mercy' }),
        note: ['마지막이라면 봐주지 않겠다고 했다. 모태조 씨는 봐주면 화낸다며, 빨리가 아니라 물을 제대로 읽고 올리는 쪽이 이긴다고 했다.',
          "I said that if it was the last match, I wouldn't go easy. Taejo said he'd be angry if I did — the winner wouldn't be the fastest, but whoever read the water right."],
      }),
      disband: scene([
        line(T, '말 그대로야. 졸업하면 다 흩어져. 이름만 남겨 두는 건 우리 식이 아니야.', "Just like it sounds. We graduate, we scatter. Keeping just the name alive isn't our style."),
        line(T, '그래서 마지막 대결이야. 흩어지기 전에 다 같이 한 번 던지는 거.', "That's why there's a last match. One more cast all together before we scatter."),
      ], {
        choices: [
          opt('come', '알겠어요. 부산으로 갈게요', "Understood. I'll come to Busan", {
            end: endTalk({ accept: true, offer: 'ask_disband' }),
            note: ['졸업하면 다 흩어지고, 이름만 남겨 두는 건 씨바스터즈 식이 아니라고 했다. 흩어지기 전 마지막 대결을 위해 부산으로 가기로 했다.',
              "When they graduate they scatter, and keeping only the name isn't the Seabusters' way. I'd go to Busan for the last match before they scattered."] }),
          opt('why_me', '그런데 왜 하필 제가 상대예요?', 'But why me, of all people?', {
            say: ['그런데 왜 하필 제가 상대예요? 동아리 사람도 아닌데요.', "But why me? I'm not even in the club."], next: 'why_me' }),
        ],
        note: ['씨바스터즈는 졸업하면 흩어진다고 했다. 이름만 남겨 두지 않는다고.', 'The Seabusters scatter at graduation. They don\'t keep the name alive.'],
      }),
      why_me: scene([
        line(T, '몇 번 같이 던졌잖아. 그리고 동아리 사람이 아니라서야.', "You've cast with us a few times. And because you're not in the club."),
        line(T, '우리끼리 붙으면 다 아는 수라 재미없어.', "If we fight among ourselves, we know every move. Boring."),
        act(T, 'laugh'),
        line(T, '밖에서 온 사람한테 지면 그게 진짜 졸업이야. 이기면 더 좋고. 봐주지 마. 두 마리.', "Losing to an outsider — that's a real graduation. Winning's even better. No going easy. Two fish."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_why_me' }),
        note: ['왜 하필 나냐고 물었다. 모태조 씨는 동아리 사람이 아니라서라며, 밖에서 온 사람한테 지면 그게 진짜 졸업이라고 웃었다. 웃음에 광기가 조금 보였다.',
          "I asked why me. Taejo said it was because I wasn't in the club — losing to an outsider was a real graduation. There was a little madness in his laugh."],
      }),
      hosu_ball: scene([
        line(T, '다녀. 이제 아무도 안 말려.', "He does. Nobody bothers stopping him now."),
        act(T, 'sigh'),
        line(T, '호수 말로는 그 공을 옆에 두면 잘 잡힌대. 미신이지.', "Hosu says he catches more with the ball beside him. Superstition."),
        line(T, '근데 실측해 보니 틀린 말도 아니더라.', "But I measured it, and he's not wrong."),
      ], {
        end: endTalk({ accept: true, offer: 'hosu_ball' }),
        note: ['고호수 씨는 아직도 농구공을 들고 다닌다고 했다. 옆에 두면 잘 잡힌다는 미신인데, 실측해 보니 틀린 말도 아니었다고.',
          "Hosu still carries the basketball. He claims he catches more with it beside him — superstition, but Taejo said he'd measured it and it wasn't wrong."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N06-4 — 끝내는 자리(대결 뒤 · 고호수도 곁에 있다)
  // ═══════════════════════════════════════════
  {
    id: 'n06_4_done', questId: 'N06-4', at: 'complete', npcId: T, start: 'start',
    nodes: {
      start: scene([
        act(T, 'silence'),
        line(T, '…졌다.', '...I lost.'),
        line(T, '아니, 이겼나.', "No — did I win?"),
        line(P, '두 마리씩이었죠.', 'We each got two.'),
        line(T, '상관없어. 물 읽는 건 봤어.', "Doesn't matter. I saw you read the water.", { act: 'nod' }),
        line(T, '내 루어 상자, 후배들한테 다 나눠 줬어. 이건 명예 회원 몫.', "I gave my whole lure box out to the juniors. This is the honorary member's share."),
        line(P, '(고호수 씨가 농구공을 옆구리에 끼고 이쪽을 보고 있다.)', '(Hosu is watching us, basketball under his arm.)'),
      ], {
        choices: [
          opt('honor', '명예 회원 몫, 잘 쓸게요', "I'll put the honorary member's share to good use", { next: 'honor' }),
          opt('lesson', '그 광기, 마지막으로 한 번 더 보여 주세요', 'Show me that madness one last time', {
            say: ['모태조 씨의 광기, 마지막으로 한 번 더 보여 주세요.', "Show me that madness of yours one last time, Taejo."], next: 'lesson' }),
          opt('pay', '졸업 대결 상금은 있어요?', 'Is there prize money for the graduation match?', {
            end: endTalk({ complete: 'pay',
              lineKo: '있지. 회비 남은 거 전부. 해산하면 남은 회비는 쓸 데가 없어. 다들 라면값 아껴서 넣은 동전이야. 함부로 쓰지 마. 그 동전들 다 농어 냄새 나.',
              lineEn: "There is. Everything left in the dues. Once we disband there's nothing to spend it on. It's coins everyone saved from their ramyeon money. Don't waste it. Every one of those coins smells of sea bass." }),
            note: ['졸업 대결 상금을 물었다. 모태조 씨는 남은 회비를 전부 줬다. 다들 라면값을 아껴 넣은 동전이니 함부로 쓰지 말라고, 그 동전들 다 농어 냄새가 난다고.',
              "I asked about prize money. Taejo handed over everything left in the club dues — coins everyone had saved from ramyeon money. Don't waste them, he said; every one smells of sea bass."] }),
          opt('give_hosu', '제 몫은 고호수 씨한테 주세요', "Give my share to Hosu", {
            say: ['제 몫은 고호수 씨한테 주세요. 고호수 씨는 계속 던질 거예요.', "Give my share to Hosu. He's going to keep casting."], next: 'give_hosu' }),
        ],
        note: ['부산으로 돌아가 씨바스터즈의 졸업 대결에서 두 마리를 올렸다. 모태조 씨는 졌는지 이겼는지 상관없다며, 루어 상자를 후배들에게 다 나눠 주고 명예 회원 몫을 내게 내밀었다.',
          "Back in Busan, I landed two in the Seabusters' graduation match. Taejo said it didn't matter who'd won; he'd given his whole lure box out to the juniors, and held out the honorary member's share to me."],
      }),
      honor: scene([
        act(T, 'give', { to: P, item: 'inv_line_nylon3' }),
        line(T, '써. 던지라고 주는 거야. 줄도 두 타래 넣었어.', "Use it. It's for casting. I put in two spools of line, too."),
        line(P, '감사합니다. 잘 쓸게요.', "Thank you. I'll make good use of it.", { act: 'receive' }),
        line(T, '하나씩 꺼내 쓸 때마다 이 동아리 생각해. 그거면 돼.', "Every time you take one out, think of this club. That's all."),
        line(T, '해산해도 루어는 물에 들어가잖아. 그게 우리 식 졸업이야.', "Even if we disband, the lures still go in the water. That's how we graduate."),
      ], {
        end: endTalk({ complete: 'honor' }),
        note: ['명예 회원 몫을 받았다. 씨바스터즈 스티커가 붙은 상자에 줄 두 타래가 들어 있었다. 해산해도 루어는 물에 들어가니, 그게 씨바스터즈 식 졸업이라고 했다.',
          "I accepted the honorary member's share — two spools of line, in a box with a Seabusters sticker on it. Even disbanded, the lures still go in the water, Taejo said. That's how they graduate."],
      }),
      lesson: scene([
        line(T, '광기? …이거야. 탁수에서 컬러 고르는 법.', "Madness? ...This. How to pick colours in murky water."),
        line(T, '표에 없는 거 하나 줄게. 흙탕물까지 가면 밝은 색도 안 보여. 그땐 검은색이야. 윤곽만 남거든.', "Here's one that's not on the chart. When it gets to proper mud, even bright colours vanish. Then it's black. Only the silhouette's left."),
        line(T, '이건 아무한테도 안 알려 줬어. 마지막이니까.', "I've never told anyone this. Because it's the last time."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['모태조 씨에게 마지막 광기를 청했다. 흙탕물까지 가면 밝은 색도 안 보이니 그땐 검은색이라고, 윤곽만 남는다고. 아무한테도 안 알려 준 거라고 했다.',
          "I asked Taejo for one last bit of madness. In real mud even bright colours vanish, so go black — only the silhouette remains. He'd never told anyone, he said."],
      }),
      give_hosu: scene([
        line(T, '…호수한테?', '...To Hosu?', { act: 'look_away' }),
        line(T, '그래. 저 녀석은 계속 던지겠지. 공은 안 내려놓고.', "Yeah. That kid will keep casting. Without ever putting the ball down."),
        line(T, '네 몫이었으니 네 손으로 줘. 내가 주면 졸업 선물이고, 네가 주면 같이 던진 사람이 주는 거야.', "It was your share, so give it with your own hands. From me it's a graduation present. From you, it's from someone who fished beside him."),
        line(HO, '저, 저한테요?', "M-me?"),
        line(P, '(고호수 씨가 농구공을 떨어뜨릴 뻔했다.)', '(Hosu nearly drops his basketball.)'),
      ], {
        end: endTalk({ complete: 'give_hosu' }),
        note: ['내 몫은 고호수 씨에게 주라고 했다. 모태조 씨는 네 손으로 직접 주라고 했다. 받아 든 고호수 씨는 농구공을 떨어뜨릴 뻔했다.',
          "I asked for my share to go to Hosu. Taejo said to hand it over myself. Taking it, Hosu nearly dropped his basketball."],
      }),
    },
  },
];
