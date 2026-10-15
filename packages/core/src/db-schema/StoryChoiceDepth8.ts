/**
 * @file StoryChoiceDepth8.ts
 * @description 253차 — 받는 자리 · 끝내는 자리 답 깊이 8묶음: 서브 아크 N21 ~ N23(N21 오세찬 · N23 채수림 · N22 하늬).
 *              집필 기준 · 합치는 순서는 `StoryChoiceDepth.ts` 머리 주석.
 */

import type { ChoiceDepthEntry } from '../types/Story.js';
import { d, dNo } from './StoryChoiceDepthKit.js';

export const CHOICE_DEPTH_8: Record<string, ChoiceDepthEntry> = {
  // ── N21-1 「해안에 밀려온 별」 · 오세찬 ──
  'N21-1': {
    offer: [
      d('hands_on', '줍는 일이라면 자신 있습니다. 가리는 법만 알려 주세요.', "Picking things up I can do. Just show me how to tell them apart.",
        '좋아요. 만져 보면 금방 알아요. 팔이 짧고 넓적하면 별, 길고 끝이 위로 들렸으면 아무르. (방파제 밑 바위틈을 손가락으로 짚는다.)\n\n하나 주울 때마다 어디서 주웠는지 말해 줘요. 숫자는 제가 적어요. 세 개면 돼요.',
        "Good. You'll feel the difference right away. Short and broad, that's a bat star. Long with the tips turned up, that's a northern one. (He points into the gaps between the rocks under the breakwater.)\n\nEach time you pick one up, tell me where. I'll write the numbers down. Three will do.",
        { affinity: 0.04 }),
      d('ask_batstar', '별불가사리는 왜 따로 가려요? 다 같은 불가사리 아니에요?', "Why sort out the bat stars? Aren't they all just starfish?",
        '달라요. 아무르는 전복, 바지락, 굴을 먹어요. 양식장이 통째로 당해요. 별은 죽은 걸 먹어요. 바닥 청소부예요.\n\n그래서 별은 줄일 게 아니라 두는 거예요. 섞어서 다 걷으면 바다가 오히려 지저분해져요. 그러니까 가려서 주워 와요.',
        "They're not. Northern seastars eat abalone, clams, oysters. Whole farms get wiped out. Bat stars eat what's already dead. They keep the bottom clean.\n\nSo bat stars aren't something to cut down. They stay. Sweep up both and the sea ends up dirtier. So sort them as you pick them up.",
        { affinity: 0.05, flag: 'choice.n21_1_asked_batstar' }),
      d('wish_joke', '별을 줍는 거면, 소원 하나쯤 빌어도 되겠네요.', "If I'm picking up stars, I suppose I get to make a wish.",
        '빌어도 돼요. 대신 숫자도 적어요. (웃지는 않는데, 수첩 위 펜 끝이 잠깐 멈춘다.)\n\n소원은 별불가사리한테만 빌어요. 아무르한테 빌면 양식장 사람들이 싫어해요. 그 둘만 안 헷갈리면 돼요.',
        "Go ahead. Just write the number down too. (He doesn't smile, but his pen pauses on the notebook for a moment.)\n\nOnly wish on the bat stars, though. Wish on a northern one and the shellfish farmers won't thank you. Just don't mix the two up.",
        { affinity: 0.02, flag: 'choice.n21_1_wish_joke' }),
      d('ask_pay', '불가사리 주우면 돈이 나와요? 그냥 궁금해서요.', "Does picking up starfish pay anything? Just curious.",
        '아무르는 나와요. 지자체가 kg으로 사요. 별은 안 나와요. 구제 대상이 아니라서요.\n\n그러니까 돈 보고 다 쓸어 오면 반은 헛일이에요. 오늘은 가리는 것부터 배워요. 돈은 가린 다음이에요.',
        "Northern ones do. The local government buys them by the kilo. Bat stars don't. They're not on the cull list.\n\nSo sweep up everything for the money and half of it's wasted effort. Today you learn to sort. Money comes after the sorting.",
        { affinity: 0, flag: 'choice.n21_1_asked_pay' }),
    ],
    completeAdd: [
      d('keep_batstars', '별불가사리는 앞으로 보는 대로 바다에 돌려놓겠습니다.', "From now on, any bat stars I find go back in the sea.",
        '…그거면 돼요. 별은 바다 청소부예요. 돌려놓는 사람이 있어야 해요. (수첩 귀퉁이에 무언가를 짧게 적는다.)\n\n줍는 사람은 많아요. 돌려놓는 사람은 드물어요. 기록에는 안 남는 일인데, 바다는 알아요.',
        "…That'll do. Bat stars keep the sea clean. Someone has to put them back. (He jots something short in the corner of his notebook.)\n\nPlenty of people pick things up. Hardly anyone puts them back. It never makes the record, but the sea knows.",
        { affinity: 0.05, seaRep: 1, flag: 'choice.n21_1_return_batstars' }),
    ],
    completeReply: {
      bounty: [
        '규정대로. 자. (kg 단위로 적힌 영수증과 함께 돈을 준다.)\n\n별불가사리 무게는 뺐어요. 그건 값이 없어요. 아무르만 달았어요. 영수증은 버리지 마요. 다음에 또 주우면 그게 첫 장이에요.',
        "By the rules. Here. (He pays, with a receipt written out per kilo.)\n\nThe bat stars stayed off the scale. They carry no rate. Only the northern ones got weighed. Keep the receipt. Next time you pick some up, it's page one.",
      ],
      volunteer: [
        '…그런 사람이 필요했어요. (감시원 명단에 내 연락처가 적힌다.)\n\n세는 사람은 늘 모자라요. 줍는 사람은 많은데 적는 사람이 없어요. 바다에 또 뭐가 밀려오면 제일 먼저 부를게요.',
        "…That's the kind of person we needed. (My number goes on the monitor list.)\n\nThere are never enough people who count. Plenty pick things up; nobody writes it down. When something washes in again, you're the first I'll call.",
      ],
    },
  },

  // ── N21-2 「여름이 오면 떠오른다」 · 오세찬 ──
  'N21-2': {
    offerAdd: [
      d('ask_bay', '왜 하필 만 안쪽에만 이렇게 몰려 있어요?', "Why are they all bunched up in the inner bay?",
        '물이 갇혀서요. 만이나 항구 안쪽은 물이 잘 안 빠져요. 거기 바닥에 붙어 사는 어린 것들이 여름이면 한꺼번에 떠올라요. (만 입구를 손으로 그어 보인다.)\n\n헤엄을 거의 못 쳐요. 물 흐르는 대로 가요. 그래서 갇힌 데에 쌓여요. 입구 쪽부터 걷어 줘요.',
        "The water's trapped. Inside a bay or a harbour it doesn't flush out. The young ones that live stuck to the bottom there all rise at once in summer. (He traces the mouth of the bay in the air.)\n\nThey can barely swim. They go wherever the water goes. So they pile up where it's trapped. Start clearing from the mouth.",
        { affinity: 0.04, flag: 'choice.n21_2_asked_bay' }),
      d('salad_joke', '이거 냉채로 무쳐 먹는 해파리 아니에요?', "Isn't this the jellyfish people make cold salad with?",
        '아니에요. 보름달물은 못 먹어요. 냉채로 먹는 건 따로 있어요. 소금에 절이는 큰 놈이요. (입꼬리가 잠깐 움직였다가 돌아온다.)\n\n이건 먹을 데가 없어요. 그물만 막고 고기만 상하게 해요. 그러니까 걷는 수밖에 없어요. 다섯이요.',
        "No. Moon jellies aren't for eating. The salad kind is a different one. A big one they salt. (The corner of his mouth twitches, then settles.)\n\nThere's nothing to eat on these. All they do is clog nets and spoil the catch. So clearing them is the only option. Five.",
        { affinity: 0.02, flag: 'choice.n21_2_salad_joke' }),
    ],
    offerReply: {
      go: [
        '고마워요. 장갑 끼세요.\n\n보름달물은 독이 약해요. 스치면 따끔한 정도예요. 그래도 맨손은 안 돼요. 훌치기로 걸어서 천천히 끌어와요. 물을 잔뜩 먹고 있어서 생각보다 무거워요.',
        "Thank you. Wear gloves.\n\nMoon jellies have a weak sting. Brush one and it prickles, that's all. Still, no bare hands. Snag it and bring it in slowly. They're full of water, heavier than you'd think.",
      ],
      decline: [
        '네, 여름은 또 오니까요. (다음 계절에 다시 연락이 온다.)\n\n해파리도 해마다 와요. 그건 걱정 안 해요. 대신 다음에 오면 만 안쪽부터 봐 줘요. 물이 갇힌 데서 제일 먼저 불어나요.',
        "Right — summer comes round again. (He calls again the next season.)\n\nThe jellyfish come every year too. That's not the worry. When you do come, look at the inner bay first. They build up first wherever the water's trapped.",
      ],
    },
    completeAdd: [
      d('snag_tip', '끌어올 때 자꾸 밀려납니다. 훌치기 요령이 있습니까?', "They keep slipping back while I reel. Is there a knack to snagging?",
        '줄을 늦추면 안 돼요. 잠깐이라도 느슨해지면 도로 밀려가요. 감을 때는 천천히, 대신 쉬지 말고요. (빈 릴을 쥐고 감는 손을 직접 보여 준다.)\n\n그리고 너무 멀리서 걸지 마요. 줄이 길면 못 버티고 터져요. 가까운 놈부터요.',
        "Don't let the line go slack. Loose for even a moment and it drifts back out. Reel slowly, but don't stop. (He picks up an empty reel and shows me the motion himself.)\n\nAnd don't hook them too far out. Too much line and it can't take the strain — it snaps. Nearest ones first.",
        { proficiency: { category: 'fishing', xp: 20 }, affinity: 0.03 }),
    ],
    completeReply: {
      bounty: [
        '규정대로. kg당이에요. (영수증을 꼼꼼하게 적는다.)\n\n보름달물은 가벼워요. kg으로 치면 얼마 안 돼요. 그래도 그물 하나 덜 막힌 값은 영수증에 안 적혀요. 그건 어민들이 알아요.',
        "By the rules. Per kilo. (He writes the receipt out carefully.)\n\nMoon jellies are light. By the kilo it doesn't come to much. But what a net's worth when it doesn't clog — that's not on the receipt. The fishermen know it, though.",
      ],
      data: [
        '수온이에요. 표를 봐요. (해파리 표류 방향을 읽는 법을 배운다.)\n\n물이 따뜻한 해일수록 일찍 떠서 늦게까지 있어요. 처음 뜬 날짜만 해마다 이어 봐요. 조금씩 앞당겨지고 있어요.',
        "It's water temperature. Look at the table. (I learn to read the drift direction of jellyfish.)\n\nThe warmer the year, the earlier they rise and the later they stay. Just line up the first sighting date, year by year. It keeps creeping earlier.",
      ],
      volunteer: [
        '…그렇게 말하는 사람 처음이에요. (감시원 여름 명단 첫 줄에 내가 있다.)\n\n여름마다 사람 구하는 게 일이에요. 해파리는 매년 오는데 사람은 매년 바뀌어요. 첫 줄이 차 있으면 그 여름은 시작이 된 거예요.',
        "…Nobody's said that before. (I'm first on the summer monitor list.)\n\nFinding people every summer is half the job. The jellyfish come back every year, but the people change every year. With the first line filled, that summer's off to a start.",
      ],
    },
  },

  // ── N21-3 「수매 창구」 · 오세찬 ──
  'N21-3': {
    offer: [
      d('no_mix', '팔 끝 젖혀진 것만 여덟. 하나도 안 섞겠습니다.', "Upturned tips only, eight of them. Not a single one mixed in.",
        '그거면 돼요. 창구는 하나씩 뒤집어 봐요. 하나라도 별이면 통째로 돌아와요. (창구 쪽을 턱으로 가리킨다.)\n\n담을 때 한 번, 넘기기 전에 한 번. 두 번 봐요. 창구에서 돌아오면 하루가 날아가요. 여덟이요.',
        "That'll do. The counter turns them over one by one. One bat star and the whole lot comes back. (He nods toward the counter.)\n\nCheck once when you bag them, once before you hand them in. Twice. Get sent back from that counter and there goes your day. Eight.",
        { affinity: 0.04 }),
      d('ask_counter', '창구는 별불가사리를 왜 돌려보내요? 같이 받으면 편할 텐데요.', "Why does the counter send bat stars back? Taking everything would be easier.",
        '편하죠. 근데 별은 구제 대상이 아니에요. 수매하는 돈은 줄이자고 쓰는 돈이에요. 줄일 것만 사요.\n\n섞인 걸 받아 주면 다음 사람이 또 섞어 와요. 그럼 별도 줄고, 숫자도 틀려요. 그러니까 팔 끝 젖혀진 것만 담아요.',
        "Easier, sure. But bat stars aren't a cull target. Buy-back money is money spent on cutting numbers down. It only buys what needs cutting.\n\nTake one mixed bag and the next person mixes theirs too. Then the bat stars drop and the numbers go wrong. So only bag the ones with upturned tips.",
        { affinity: 0.04, flag: 'choice.n21_3_asked_counter' }),
      d('ask_why_buy', '지자체가 불가사리를 왜 돈 주고 사요?', "Why would the local government pay money for starfish?",
        '양식장이 당하는 것보다 싸서요. 아무르는 전복이고 굴이고 다 먹어 치워요. 그 값을 생각하면 kg으로 사들이는 게 남는 장사예요.\n\n봄이면 알 낳으러 떼로 몰려요. 그때 걷어야 해요. 지금 여덟이 나중의 수백이에요.',
        "Because it's cheaper than losing the farms. A northern seastar eats its way through abalone, oysters, the lot. Weigh that up and buying them by the kilo comes out ahead.\n\nIn spring they swarm in to spawn. That's when you have to clear them. Eight now is hundreds later.",
        { affinity: 0.03, flag: 'choice.n21_3_asked_why_buy' }),
      d('big_only', 'kg으로 쳐 준다니, 큰 놈만 골라 와도 되죠?', "If it's by the kilo, I can just bring the big ones, right?",
        '돼요. 규정엔 크기가 없어요. 무게만 있어요. (잠깐 생각하더니 덧붙인다.)\n\n근데 작은 놈도 아무르예요. 내년엔 큰 놈이 돼요. 보이면 같이 담아요. 값은 덜 나와도 숫자는 똑같이 하나예요.',
        "You can. The rules say nothing about size. Only weight. (He thinks for a moment, then adds something.)\n\nBut a small one's still a northern seastar. Next year it's a big one. If you see it, bag it too. It pays less, but it counts as one all the same.",
        { affinity: 0, flag: 'choice.n21_3_big_only' }),
    ],
    completeAdd: [
      d('weigh_tip', '창구에서 무게 다는 걸 봤는데, 물은 빼고 답니까?', "I watched them weigh at the counter. Do they drain the water off first?",
        '빼요. 물값은 안 쳐 줘요. 통째로 올리면 반이 바닷물이에요. (손바닥을 기울여 물 빠지는 시늉을 한다.)\n\n그래서 담을 때부터 물을 따라 버려요. 그래야 영수증이랑 내 셈이 맞아요. 숫자는 무게부터 정직해야 해요.',
        "They do. Nobody pays for water. Put the lot up wet and half of it's seawater. (He tilts his palm, miming the water running off.)\n\nSo pour the water off when you bag them. Then the receipt matches your own count. Numbers have to be honest right from the weighing.",
        { proficiency: { category: 'economy', xp: 20 }, affinity: 0.03 }),
    ],
    completeReply: {
      bounty: [
        '규정대로. kg당. (창구 영수증이 정갈하다.)\n\n창구 영수증엔 무게 옆에 종 이름이 적혀요. 아무르, 그 한 줄이 통과했다는 뜻이에요. 섞였으면 그 줄이 없었을 거예요.',
        "By the rules. Per kilo. (The counter receipt is immaculate.)\n\nThe counter receipt puts the species next to the weight. Northern seastar — that one line means you passed. If anything had been mixed in, the line wouldn't be there.",
      ],
      data: [
        '이 표를 봐요. 3년 치예요. (해저 생물 밀도를 읽는 법을 배운다.)\n\n봄마다 위로 튀어요. 알 낳는 철이에요. 그 튀는 높이가 해마다 커지면 그해엔 창구가 바빠져요. 표는 미리 알려 줘요.',
        "Look at this table. Three years of it. (I learn to read seabed population density.)\n\nIt jumps every spring. Spawning season. When that jump gets taller year on year, the counter has a busy year. The table tells you ahead of time.",
      ],
      volunteer: [
        '…또 그렇게 말하네요. 고마워요. (울산 창구에서 내 이름을 안다.)\n\n창구 사람들이 물어요. 그 사람 또 오냐고요. 섞어 온 적이 한 번도 없어서요. 다음에도 팔 끝부터 봐요.',
        "…There you go again. Thank you. (They know my name at the Ulsan counter.)\n\nThe counter staff ask whether you'll be back. You've never once brought them a mixed bag. Next time too — check the tips first.",
      ],
    },
  },

  // ── N21-4 「가두리 앞바다」 · 오세찬 ──
  'N21-4': {
    offerAdd: [
      d('ask_intake', '취수구가 막히면 양식장이 왜 죽어요?', "Why does the farm die if the intake gets blocked?",
        '취수구는 바닷물을 끌어들이는 입구예요. 해파리가 그 망에 붙으면 새 물이 안 들어와요. 가두리 그물코도 막히고요. (가두리 쪽을 가리킨다.)\n\n물이 안 돌면 안에 있는 고기가 숨을 못 쉬어요. 한여름엔 오래 못 버텨요. 그래서 지금이에요.',
        "The intake's the mouth that draws seawater in. Jellyfish stick to its screen and no fresh water gets through. The cage mesh clogs as well. (He points at the pens.)\n\nIf the water stops moving, the fish inside can't breathe. In high summer they don't last long. That's why it's now.",
        { affinity: 0.04, flag: 'choice.n21_4_asked_intake' }),
      d('split_up', '열 마리를 혼자요? 감시원님은 어디를 맡으세요?', "Ten, on my own? Which part are you taking?",
        '저는 취수구 바로 앞이요. 망 상태를 봐야 해서요. 당신은 가두리 앞. 열 마리. (손으로 바다를 두 쪽으로 가른다.)\n\n둘이 한데 몰려 있으면 반만 걷혀요. 갈라서 걸어요. 다 걷으면 소리쳐요. 들려요.',
        "I'll be right at the intake. Someone has to watch the screen. You take the front of the pens. Ten. (He splits the water in two with his hand.)\n\nBunch up together and only half gets cleared. We split up. Shout when you're done. I'll hear you.",
        { affinity: 0.03, flag: 'choice.n21_4_split_up' }),
    ],
    offerReply: {
      go: [
        '고마워요. 장갑!\n\n열 마리면 팔이 저려요. 다섯 걷고 한 번 쉬어요. 쉬는 동안 제가 셀게요. 취수구 쪽에 붙은 것부터요.',
        "Thank you. Gloves!\n\nTen of them and your arms will go numb. Clear five, then rest once. I'll count while you rest. Start with the ones stuck near the intake.",
      ],
      decline: [
        '…네. 다른 사람 부를게요. (다음 여름에 다시 연락이 온다.)\n\n열 마리가 적은 수는 아니에요. 무리라고 말해 주는 게 나아요. 하다가 팔이 풀리면 그게 더 위험해요.',
        "…Right. I'll ask someone else. (He calls again next summer.)\n\nTen's no small number. Better you tell me it's too much. Arms giving out halfway is the dangerous part.",
      ],
    },
    completeAdd: [
      d('rules_only', '관리인 봉투는 돌려 드리세요. 규정 값만 받겠습니다.', "Give the keeper's envelope back. I'll take the standard rate only.",
        '…규정대로만. 당신답네요. (봉투 하나를 관리인에게 돌려준다. 관리인이 고개를 깊이 숙인다.)\n\n이 동네는 그런 거 오래 기억해요. 받은 사람보다 안 받은 사람을 더 오래요.',
        "…The rules and nothing more. That's like you. (He hands one envelope back to the keeper, who bows deeply.)\n\nThis place remembers that sort of thing for a long time. The ones who didn't take it, longer than the ones who did.",
        { payMult: 1, affinity: 0.04, harborRep: 1 }),
    ],
    completeReply: {
      bounty: [
        '규정대로. 그리고 가두리 관리인이 따로 준대요. (봉투 두 개.)\n\n하나는 해파리 값, 하나는 물값이에요. 관리인 봉투에 뭐가 들었는지는 저도 몰라요. 그건 그 사람 마음이에요.',
        "By the rules. And the pen keeper pays separately. (Two envelopes.)\n\nOne's for the jellyfish, one's for the water. What's in the keeper's envelope, I don't know either. That one's from the heart.",
      ],
      data: [
        '수온이랑 바람. 이 둘로 예측해요. (해파리 표류를 읽는 눈이 생긴다.)\n\n헤엄을 못 치니까 바람 부는 쪽으로 밀려요. 물이 따뜻해지고 바람이 가두리 쪽으로 며칠 불면, 그때 미리 걷어요. 막히고 나서 걷는 건 늦어요.',
        "Water temperature and wind. You predict from those two. (I get an eye for jellyfish drift.)\n\nThey can't swim, so they get pushed downwind. Once the water's warm and the wind's been blowing toward the pens for a few days, clear them early. Clearing after the blockage is too late.",
      ],
      volunteer: [
        '…그렇게 말할 줄 알았어요. (거제 양식장 사람들이 나를 안다.)\n\n관리인이 이름을 물어봤어요. 알려 줬어요. 이제 가두리 앞에 서 있어도 아무도 쫓아내지 않을 거예요.',
        "…I knew you'd say that. (The Geoje farm people know me.)\n\nThe keeper asked your name. I told them. Stand in front of those pens now and nobody'll chase you off.",
      ],
    },
  },

  // ── N21-5 「실이 늘어진 그림자」 · 오세찬 ──
  'N21-5': {
    offerAdd: [
      d('ask_threads', '우산 밑에 늘어진 실 같은 건 뭐예요? 그게 쏘는 거예요?', "What are those threads hanging under the bell? Is that what stings?",
        '그게 부속지예요. 실처럼 보이는데 다발이에요. 거기 닿으면 붓고 오래 아파요. (장갑 낀 손을 두 겹으로 포개 쥐어 보인다.)\n\n그래서 끌어올 때는 우산 쪽을 잡아요. 실 쪽은 절대 손으로 걷지 마요. 장갑 두 겹이어도요.',
        "Those are the appendages. They look like thread, but they're bundles. Touch them and you swell up and it hurts for a long time. (He clasps one gloved hand over the other.)\n\nSo when you haul it in, take hold at the bell. Never gather the threads by hand. Not even in two pairs of gloves.",
        { affinity: 0.04, flag: 'choice.n21_5_asked_threads' }),
      d('dragged', '100kg이면 제가 끌려 들어가는 거 아닙니까?', "A hundred kilos? Isn't it going to drag me in?",
        '그래서 천천히 해요. 줄을 늦추지만 않으면 안 끌려가요. 끌려가는 건 사람이 아니라 줄이에요. (웃지 않는다. 진지하다.)\n\n못 버티겠으면 놔요. 줄은 또 사면 돼요. 사람은 못 사요. 천천히, 한 마리만요.',
        "That's why you go slow. Keep the line from going slack and it won't pull you in. What gets dragged is the line, not you. (He doesn't smile. He means it.)\n\nIf you can't hold on, let go. Line you can buy again. People you can't. Slowly — just the one.",
        { affinity: 0.02, flag: 'choice.n21_5_worried' }),
    ],
    offerReply: {
      go: [
        '장갑 두 겹. 부탁해요.\n\n촉수는 우산보다 훨씬 길어요. 끌어올 때 줄 따라 손이 미끄러지지 않게 해요. 이십 분은 걸려요. 서두르면 쏘여요.',
        "Two pairs of gloves. Please.\n\nThe tentacles run far longer than the bell. Don't let your hands slide down the line as you haul. It takes twenty minutes. Rush it and you'll get stung.",
      ],
      decline: [
        '…솔직해서 고마워요. 다음 철에 배로 걷어요.\n\n노무라는 혼자 걷는 게 아니에요. 무리라고 말하는 사람이 오래가요. 다음 철에 배가 뜨면 그때 말 걸게요.',
        "…Thank you for being honest. We'll take it by boat next season.\n\nA Nomura isn't a one-person job. The ones who say when it's too much are the ones who last. When the boat goes out next season, I'll come and find you.",
      ],
    },
    completeAdd: [
      d('sting_aid', '혹시 쏘이면 어떻게 해야 합니까? 제대로 알아 두고 싶습니다.', "If I ever do get stung, what should I do? I want to know properly.",
        '물 밖으로 먼저 나와요. 바닷물로 씻어요. 민물은 안 돼요, 더 쏴요. 붙은 촉수는 맨손 말고 카드 같은 걸로 긁어 내요. (순서를 천천히 한 번 더 짚어 준다.)\n\n붓고 숨이 차면 바로 병원이에요. 참지 마요. 그게 제일 중요해요.',
        "Get out of the water first. Rinse with seawater. Not fresh water — it makes them fire more. Scrape off any tentacles with something like a card, not your bare hand. (He goes through the order once more, slowly.)\n\nIf it swells or you're short of breath, straight to hospital. Don't tough it out. That's the most important part.",
        { proficiency: { category: 'life', xp: 25 }, affinity: 0.04 }),
    ],
    completeReply: {
      bounty: [
        'kg당이니까… 큰돈이네요. 규정대로. (영수증 숫자가 길다.)\n\n노무라는 수매가가 제일 높아요. 그만큼 피해가 커서요. 한 마리가 그물 한 틀을 찢어요. 이 돈은 그물값이에요.',
        "Per kilo, so… that's real money. By the rules. (The figure on the receipt is long.)\n\nNomura carry the highest rate there is, because the damage is that big. One of them tears a whole net. This money is what a net is worth.",
      ],
      data: [
        '남쪽. 해류 따라. 이 표를 봐요. (대형 해파리 표류를 읽는 눈이 생긴다.)\n\n동중국해에서 생겨서 대마난류를 타고 올라와요. 제주가 첫 관문이에요. 여기서 많이 보이면 얼마 뒤엔 남해, 동해에서도 보여요.',
        "The south. Along the current. Look at this table. (I get an eye for large jellyfish drift.)\n\nThey're born in the East China Sea and ride the Tsushima Current north. Jeju is the first gate. If there are lots here, before long they show up in the South Sea and the East Sea too.",
      ],
      volunteer: [
        '…당신 같은 사람이 필요해요. 진짜로. (제주 감시원 명단 첫 줄.)\n\n돈보다 쏘이지 않은 걸 먼저 세는 사람. 그게 감시원이에요. 명단 첫 줄은 아무나 안 올려요.',
        "…We need people like you. Genuinely. (First on the Jeju monitor list.)\n\nSomeone who counts no stings before counting money. That's a monitor. The first line of that list doesn't go to just anyone.",
      ],
    },
  },

  // ── N21-6 「그물을 찢는 것」 · 오세찬 ──
  'N21-6': {
    offerAdd: [
      d('ask_nets', '해파리가 어떻게 그물을 찢어요? 물렁하잖아요.', "How does a jellyfish tear a net? They're soft.",
        '무게예요. 한 마리가 100kg을 넘어요. 그게 그물에 몇 마리만 들어도 그물이 못 버텨요. 끌어올리다 터져요. (먼바다 쪽 그물 부표들을 가리킨다.)\n\n그날 조업은 거기서 끝이에요. 고기도 못 건지고 그물도 잃어요. 울릉 어민들이 지금 그래요. 세 마리만 걷어 줘요.',
        "It's the weight. One of them goes over a hundred kilos. Get a few of those in a net and it can't hold. It bursts on the way up. (He points to the net buoys further out.)\n\nThat's the end of the day's fishing right there. No catch, and the net's gone too. That's what the Ulleung fishermen are living with right now. Just clear three for me.",
        { affinity: 0.04, flag: 'choice.n21_6_asked_nets' }),
      d('doubt', '세 마리 걷는다고 떼가 줄긴 합니까?', "Will clearing three really make a dent in a swarm?",
        '안 줄어요. 남는 게 더 많을 거예요. 알아요. (잠깐 바다를 본다.)\n\n그래도 걷은 만큼은 그물이 살아요. 그리고 숫자가 남아요. 안 걷으면 아무것도 안 남아요. 한 마리씩이요.',
        "It won't. There'll be more left than cleared. I know. (He looks at the sea for a moment.)\n\nBut every one cleared is a net that survives. And the number goes on record. Clear nothing and nothing's left. One at a time.",
        { affinity: 0, flag: 'choice.n21_6_doubted' }),
    ],
    offerReply: {
      go: [
        '고마워요. 장갑 두 겹.\n\n한 마리에 이십 분이에요. 세 마리면 한 시간이고요. 중간에 손이 떨리면 쉬어요. 노무라는 기다려 줘요. 빨리 못 움직이니까요.',
        "Thank you. Two pairs of gloves.\n\nTwenty minutes a head. Three is an hour. If your hands start shaking, rest. A Nomura will wait for you. It can't move fast.",
      ],
      decline: [
        '…맞는 말이에요. 배 준비되면 부를게요.\n\n떼는 혼자 걷는 게 아니에요. 맞아요. 그래도 배가 오기 전까지 세는 건 해 둘게요. 배 뜨는 날 다시 말 걸게요.',
        "…You're right. I'll call when a boat's ready.\n\nYou don't clear a swarm alone. That's true. Until the boat comes, I'll at least keep counting. The day it sails, I'll ask again.",
      ],
    },
    completeAdd: [
      d('boat_tip', '배로 떼 옆에 댈 때는 어떻게 해야 합니까?', "How do you bring a boat up alongside a swarm?",
        '떼가 흘러오는 길목에 대지 마요. 길목 옆에 대요. 길목에 서 있으면 떼가 배로 밀려와요. 스크루에 감기면 그날은 끝이에요. (손바닥으로 물 흐르는 방향을 긋고, 그 옆에 배를 놓는 시늉을 한다.)\n\n엔진은 낮게, 천천히요. 해파리는 피하지 않아요. 피하는 건 배가 해야 해요.',
        "Don't sit in the path the swarm's drifting along. Come in beside it. Park in its path and it drifts onto the boat. Get one wrapped round the prop and your day's over. (He traces the drift with his palm and sets an imaginary boat beside it.)\n\nKeep the engine low and slow. Jellyfish don't get out of the way. The boat has to do the dodging.",
        { proficiency: { category: 'driving', xp: 25 }, affinity: 0.03 }),
    ],
    completeReply: {
      bounty: [
        'kg으로. 세 마리면… 큰돈이네요. (영수증 숫자가 길다.)\n\n이 돈은 걷은 것 값이에요. 남은 것들 값은 아무도 안 줘요. 그래서 세는 거예요. 남은 것도 숫자로는 남게요.',
        "By the kilo. Three of them is… real money. (The figure on the receipt is long.)\n\nThis pays for the ones we cleared. Nobody pays for the ones left behind. That's why I count them. So they're at least left as a number.",
      ],
      data: [
        '배 위에서 보이는 것만요. 이 방법으로. (해상 개체 수 추정법을 배운다.)\n\n한 구역에서 보이는 걸 세고, 구역 수를 곱해요. 정확하진 않아요. 그래도 매번 같은 방법으로 세면, 늘었는지 줄었는지는 정확해요.',
        "Only what's visible from the boat. This way. (I learn how to estimate numbers at sea.)\n\nCount what you can see in one patch, then multiply by the number of patches. It isn't exact. But count the same way every time and whether it's up or down — that part's exact.",
      ],
      volunteer: [
        '…그 말이 제 보고서 첫 줄이에요. (울릉 어민들이 나를 안다.)\n\n보고서는 늘 남은 숫자로 시작했어요. 이번엔 걷은 숫자로 시작해요. 셋. 처음이에요.',
        "…That sentence is the first line of my report. (The Ulleung fishermen know me.)\n\nMy reports have always opened with what was left. This one opens with what got cleared. Three. That's a first.",
      ],
    },
  },

  // ── N21-7 「넘치는 바다」 · 오세찬 ──
  'N21-7': {
    offer: [
      d('last_record', '마지막 기록이면, 숫자 하나 안 틀리게 세겠습니다.', "If it's your last record, I'll count so not a single number's wrong.",
        '고마워요. 둘이랑 열이에요. 노무라 둘, 보름달 열. 걷으면서 세요. 다 걷고 세면 틀려요. (수첩의 마지막 빈 장을 펼쳐 둔다.)\n\n독도는 물이 맑아서 잘 보여요. 그래도 세 번 세요. 마지막 기록은 고쳐 줄 사람이 없으니까요.',
        "Thank you. Two and ten. Two Nomura, ten moon jellies. Count as you clear. Count afterwards and you'll get it wrong. (He opens his notebook to its last blank page.)\n\nThe water at Dokdo is clear, so you can see well. Count three times anyway. There's no one to correct a last record.",
        { affinity: 0.05 }),
      d('ask_retire', '은퇴라니요. 왜 그만두시는지 여쭤봐도 됩니까?', "Retiring? May I ask why you're stopping?",
        '…오래 했어요. 그걸로 해 둬요. (수첩을 덮었다가 다시 편다.)\n\n지금은 마지막 줄이 중요해요. 노무라 둘, 보름달 열. 그게 제 마지막 숫자예요. 그 숫자부터 같이 세요.',
        "…I've done it a long time. Let's leave it at that. (He closes the notebook, then opens it again.)\n\nRight now the last line is what matters. Two Nomura, ten moon jellies. Those are my last numbers. Let's count those first, together.",
        { affinity: 0.03, flag: 'choice.n21_7_asked_retire' }),
      d('ask_next', '다음 사람이라뇨. 누가 이 숫자를 받습니까?', "The next person? Who's going to take these numbers?",
        '그건 기록을 다 넘길 때 말할게요. (말끝을 흐리고 바다 쪽을 본다.)\n\n누가 받든 읽을 수 있게 남기는 거예요. 제 글씨 말고 숫자로요. 숫자는 사람이 바뀌어도 뜻이 안 바뀌어요. 그러니까 정확하게 세요.',
        "I'll tell you when I hand the records over. (He lets it trail off and looks out to sea.)\n\nWhoever takes them has to be able to read them. Not my handwriting — numbers. Numbers keep their meaning when the person changes. So count them exactly.",
        { affinity: 0.04, flag: 'choice.n21_7_asked_next' }),
      d('hesitate', '마지막이라니, 그런 자리에 제가 있어도 될까요?', "Your last one… is it right for me to be there for that?",
        '그래서 부른 거예요. 첫 불가사리를 같이 셌잖아요. (그 방파제를 떠올리는 듯 잠깐 말이 없다.)\n\n마지막도 같이 세요. 처음이랑 끝을 같은 사람이랑 세는 거, 감시원한테는 흔한 일이 아니에요.',
        "That's exactly why I called you. We counted the first starfish together. (He goes quiet a moment, as if remembering that breakwater.)\n\nCount the last ones with me too. Counting the first and the last with the same person — that doesn't happen much to a monitor.",
        { affinity: 0.06, flag: 'choice.n21_7_hesitated' }),
    ],
    completeAdd: [
      d('gloves_fund', '수매가 반은 다음 사람 장갑값으로 남겨 두십시오.', "Set half the rate aside for the next person's gloves.",
        '다음 사람이요? …당신이라니까요. (그래도 영수증 반을 접어 장갑 상자에 넣는다.)\n\n좋아요. 그럼 그 장갑은 당신 다음 사람 거예요. 기록이랑 같이 넘겨요. 두 겹으로요.',
        "The next person? …I just told you, that's you. (Still, he folds half the receipt and puts it in the glove box.)\n\nFine. Then those gloves belong to whoever comes after you. Pass them on with the records. Two pairs.",
        { payMult: 0.5, affinity: 0.06, flag: 'choice.n21_7_gloves_fund' }),
    ],
    completeReply: {
      next: [
        '…고마워요. (관측 기록 십오 년 치와 감시원 장갑을 준다. 두 겹.)\n\n무거울 거예요. 그래도 들고 다닐 만해요. 숫자는 가벼우니까요. 장갑은 꼭 두 겹으로 껴요. 그건 숫자보다 중요해요.',
        "…Thank you. (He gives me fifteen years of records and a monitor's gloves. Two pairs.)\n\nIt'll feel heavy. Still, it's light enough to carry. Numbers don't weigh much. And always wear the gloves doubled. That matters more than the numbers.",
      ],
      data: [
        '해마다 첫 줄만 봐요. 첫 줄이 그 해예요. (장기 데이터 읽기가 몸에 붙는다.)\n\n첫 줄엔 그해 처음 본 날짜가 있어요. 십오 년을 세로로 놓고 보면 그 날짜가 조금씩 앞으로 와요. 바다가 넘친다는 게 그거예요.',
        "Read only the first line of each year. The first line is that year. (Reading long-run data settles into my body.)\n\nThe first line has the date they were first seen that year. Lay fifteen years out in a column and that date creeps forward, bit by bit. That's what it means when the sea overflows.",
      ],
      bounty: [
        '규정대로. 마지막 영수증. (영수증 뒷면에 감시원 서명이 있다.)\n\n뒷면 서명은 규정에 없어요. 그건 제 거예요. 마지막 영수증이니까 한 번은 규정 밖으로 해 봤어요.',
        "By the rules. The last receipt. (There's a monitor's signature on the back.)\n\nThe signature on the back isn't in the rules. That one's mine. It's the last receipt, so for once I stepped outside them.",
      ],
    },
  },

  // ── N23-1 「탈출한 광어」 · 채수림 ──
  'N23-1': {
    offerAdd: [
      d('ask_condition', '비만도요? 물고기한테도 살찐 게 있어요?', "Condition factor? Fish can be fat too?",
        '있어요. 같은 길이인데 더 무거우면 비만도가 높은 거예요. 양식은 사료를 배불리 먹고 자라서 몸이 두꺼워요. (두 손바닥을 벌려 두께를 보여 준다.)\n\n자연산은 먹이를 찾아 헤엄쳐야 하니까 날씬해요. 상세보기에 나와요. 이상하게 높으면 양식이에요. 세 마리요.',
        "They can. Same length but heavier means a higher condition factor. Farmed fish grow up on all the feed they want, so they're thick-bodied. (She holds her palms apart to show the thickness.)\n\nWild ones have to swim around for food, so they're lean. It shows in the details. If it's oddly high, it's farmed. Three fish.",
        { affinity: 0.04, flag: 'choice.n23_1_asked_condition' }),
      d('price_joke', '양식이면 오히려 비싸게 쳐 주는 거 아니에요?', "Wouldn't a farmed one actually fetch more?",
        '반대예요. 자연산이 더 비싸요. 그래서 섞이면 곤란해요. 양식을 자연산이라고 내놓는 일이 생기거든요. (표의 원산지 칸을 손가락으로 짚는다.)\n\n그러니까 가려야 해요. 비만도, 지느러미. 느낌 말고 숫자로요.',
        "Other way round. Wild costs more. That's why mixing is trouble. Farmed fish end up sold as wild. (She taps the origin column on the sheet.)\n\nSo they have to be sorted. Condition factor, fins. Numbers, not a feeling.",
        { affinity: 0.01, flag: 'choice.n23_1_asked_price' }),
    ],
    offerReply: {
      go: [
        '맞아요. 지금이에요.\n\n며칠 지나면 흩어져요. 양식이든 자연산이든 다 섞이면 셀 수가 없어요. 잡으면 상세보기부터 열어요. 비만도 칸이요.',
        "Exactly. Now's the time.\n\nGive it a few days and they scatter. Once farmed and wild are all mixed in, there's no counting them. When you catch one, open the details first. The condition factor line.",
      ],
      decline: [
        '…네. 태풍은 또 오니까요.\n\n이번에 나간 건 이번에 세야 하는데, 괜찮아요. 다른 사람을 찾아볼게요. 다음 태풍 뒤엔 먼저 연락할게요.',
        "…Right. Typhoons come round again.\n\nThe ones that got out this time need counting this time, but it's fine. I'll look for someone else. After the next typhoon, I'll be in touch first.",
      ],
    },
    completeAdd: [
      d('measure_tip', '잴 때마다 길이가 들쭉날쭉합니다. 재는 법이 따로 있습니까?', "My measurements keep coming out different. Is there a right way to measure?",
        '있어요. 판에 눕히고, 입은 다물리고, 꼬리는 모아서 끝까지. 그게 전장이에요. (자 위에 광어를 눕히고 꼬리지느러미를 손으로 모아 보인다.)\n\n펄떡일 때 재면 매번 달라요. 숫자가 흔들리면 표가 흔들려요.',
        "There is. Lay it on the board, close the mouth, gather the tail and measure to the very tip. That's total length. (She lays a flounder on the rule and pinches the tail fin together.)\n\nMeasure while it's flapping and you get a different number every time. If the numbers wobble, the table wobbles.",
        { proficiency: { category: 'fishing', xp: 20 }, affinity: 0.03 }),
    ],
    completeReply: {
      data: [
        '지느러미, 비만도, 그리고 눈. (상세보기 읽는 눈이 달라진다.)\n\n지느러미는 가두리 그물에 쓸려서 끝이 닳아요. 비만도는 사료 때문이고요. 눈은 설명보다 많이 보는 게 빨라요. 열 마리쯤 재 보면 손이 먼저 알아요.',
        "Fins, condition, and the eye. (How I read the detail view changes.)\n\nFins wear down at the tips from rubbing against the cage net. The condition factor comes from the feed. As for the eye — seeing lots of them is faster than any explanation. Measure about ten and your hands will know before you do.",
      ],
      pay: [
        '있어요. 규정대로요. (영수증에 조사 협력이라고 적힌다.)\n\n조사비에서 나가는 거라 많지는 않아요. 그래도 영수증에 이름이 남아요. 누가 조사를 도왔는지 적히는 거예요.',
        "There is. By the rules. (The receipt says 'survey cooperation'.)\n\nIt comes out of the survey budget, so it isn't much. But your name stays on the receipt. It records who helped with the survey.",
      ],
      volunteer: [
        '…부를게요. 진짜로요. (조사표 협력자 칸에 내 이름이 첫 줄로 올라간다.)\n\n협력자 칸은 늘 비어 있었어요. 돈 받고 돕는 사람도 드문데, 안 받는 사람은 더 드물어요. 첫 줄은 그냥 안 올려요.',
        "…I will. Genuinely. (My name goes first in the cooperator column.)\n\nThe cooperator column was always empty. People who help for money are rare enough. People who won't take it are rarer. The first line isn't handed out lightly.",
      ],
    },
  },

  // ── N23-2 「흰 그림자」 · 채수림 ──
  'N23-2': {
    offer: [
      d('follow', '소문이라도 따라가 보겠습니다. 자리랑 물때부터요.', "Rumour or not, I'll follow it. Starting with the spot and the tide.",
        '좋아요. 소문은 말이 부풀어요. 그래도 자리랑 물때는 안 부풀어요. 거기만 건지면 돼요. (지도 위 포항 앞바다에 연필로 점 하나를 찍는다.)\n\n흰 게 나오면 좋고, 안 나와도 그 조건에서 건진 한 마리는 기록이 돼요.',
        "Good. Rumours swell as they travel. But a spot and a tide don't swell. That's all you need to fish out of it. (She pencils a single dot on the map, off Pohang.)\n\nIf a white one shows, great. If not, one fish landed under those conditions still makes a record.",
        { affinity: 0.04 }),
      d('ask_white', '흰 개체가 뭐예요? 하얀 물고기가 따로 있어요?', "A white specimen? Is there a fish that's just white?",
        '색소 없이 태어나는 개체예요. 어느 종이든 아주 드물게 나와요. 눈에 확 띄니까 오래 못 살고요. (조사 수첩에 흰 동그라미를 하나 그린다.)\n\n그래서 봤다는 말이 돌면 기록할 값어치가 있어요. 정말이든 아니든요. 일단 그 자리에 서 봐요.',
        "One born without pigment. It turns up in any species, very rarely. They stand out, so they don't live long. (She draws an empty circle in her survey notebook.)\n\nSo when word goes round that someone saw one, it's worth recording. True or not. First, go and stand on that spot.",
        { affinity: 0.05, flag: 'choice.n23_2_asked_white' }),
      d('ask_witness', '누가 봤다는 거예요? 그 사람한테 직접 물어보면 안 돼요?', "Who saw it? Can't we just ask them?",
        '물어봤어요. 다들 다른 사람이 봤대요. 소문은 원래 그래요. (어깨를 한 번 으쓱한다.)\n\n그래도 이야기마다 겹치는 게 있었어요. 자리 하나, 물때 하나. 거기서부터예요.',
        "I did. Everyone says it was someone else who saw it. That's how rumours are. (She gives a single shrug.)\n\nBut every version had something in common. One spot, one tide. That's where we start.",
        { affinity: 0.03, flag: 'choice.n23_2_asked_witness' }),
      d('sell_white', '흰 걸 잡으면 꽤 값이 나가겠는데요?', "Catch a white one and it'd be worth a fair bit, wouldn't it?",
        '낚싯대로 잡은 건 못 팔아요. 알잖아요. 흰 거면 더더욱이요. 그건 돈이 아니라 기록이에요. (펜 끝으로 표를 톡톡 친다.)\n\n잡으면 재고, 사진 찍고, 적고. 그다음은 그때 정해요. 일단 그 자리에 서 봐요.',
        "Rod catches can't be sold. You know that. A white one even less. That's not money, that's a record. (She taps the sheet with the tip of her pen.)\n\nIf you catch it — measure it, photograph it, write it down. What comes after, we decide then. First go and stand on that spot.",
        { affinity: -0.02, flag: 'choice.n23_2_asked_price' }),
    ],
    completeAdd: [
      d('would_release', '흰 게 정말 나오면… 저는 재고 놓아주고 싶습니다.', "If a white one really turns up… I'd want to measure it and let it go.",
        '…그것도 방법이에요. 재고, 사진 찍고, 놓아주고. 숫자는 남고 물고기는 바다로 가요. (표 귀퉁이에 방생이라고 작게 적어 둔다.)\n\n그 말, 기억해 둘게요. 흰 게 나오는 날 제일 먼저 꺼낼 말이에요.',
        "…That's one way. Measure it, photograph it, let it go. The numbers stay and the fish goes back to the sea. (She writes the word release small in the corner of the sheet.)\n\nI'll remember you said that. It's the first thing I'll bring up the day a white one appears.",
        { affinity: 0.06, seaRep: 1, flag: 'choice.n23_2_would_release' }),
    ],
    completeReply: {
      data: [
        '표에 적는 순서가 있어요. 자리, 물때, 개체, 그리고 날짜. (기록하는 낚시가 시작된다.)\n\n날짜가 마지막이라 이상하죠. 날짜는 안 틀려요. 자리랑 물때가 제일 잘 틀려요. 그래서 기억이 생생할 때 그것부터 적어요.',
        "There's an order on the sheet. Spot, tide, specimen, then date. (Fishing that keeps records begins.)\n\nOdd that the date comes last, isn't it? Dates don't go wrong. The spot and the tide go wrong the most. So you write those first, while it's fresh.",
      ],
      pay: [
        '규정대로요. (영수증이 정확하다.)\n\n소문 쫓은 값이라고 적을 수는 없어서 조사 협력으로 적었어요. 틀린 말은 아니에요. 소문을 확인하는 것도 조사예요.',
        "By the rules. (The receipt is exact.)\n\nI couldn't exactly write it up as a fee for chasing rumours, so it says survey cooperation. Which isn't wrong. Checking a rumour is a survey too.",
      ],
      volunteer: [
        '…나오면 제일 먼저 연락할게요. (조사 협력자 명단 첫 줄.)\n\n흰 게 안 나와도 남는 게 있어요. 그 자리, 그 물때에 누가 서 있었다는 기록이요. 다음 소문을 거를 때 그게 기준이 돼요.',
        "…You'll be the first I call. (First in the cooperator list.)\n\nEven if a white one never shows, something's left. A record that someone stood on that spot at that tide. When the next rumour comes, that's what we check it against.",
      ],
    },
  },

  // ── N23-3 「접시 위의 증명」 · 채수림 ──
  'N23-3': {
    offer: [
      d('prove_it', '말 대신 접시로 보여 드리겠습니다. 특으로요.', "I'll show you with a plate, not words. Top grade.",
        '좋아요. 그 말도 접시 다음에 해요. (도마 끝을 손가락으로 톡 친다.)\n\n시메, 방혈, 칼질, 신선도. 넷이 다 맞아야 특이 나와요. 하나라도 빠지면 특은 어려워요. 상은 안 받아요.',
        "Good. Save that line for after the plate as well. (She taps the end of the board with a finger.)\n\nIkejime, bleeding, knife work, freshness. All four have to be right for top grade. Miss one and top grade gets hard. High grade won't do.",
        { affinity: 0.04 }),
      d('ask_ikejime', '시메가 정확히 뭐예요? 그냥 빨리 잡는 거 아니에요?', "What exactly is ikejime? Isn't it just killing it quickly?",
        '빨리가 아니라 바르게예요. 뇌를 먼저 찔러 몸부림을 멈추는 거예요. 버둥대면 살이 지쳐서 맛이 떨어져요. (손가락으로 눈 뒤 한 점을 짚어 보인다.)\n\n그다음이 방혈이에요. 피를 빼야 살이 맑아요. 순서가 바뀌면 접시에 다 보여요.',
        "Not quickly — properly. You spike the brain first so the thrashing stops. If it thrashes, the flesh wears itself out and the taste drops. (She touches a point just behind the eye with a fingertip.)\n\nThen comes the bleeding. Drain the blood and the flesh comes out clear. Get the order wrong and the plate shows all of it.",
        { affinity: 0.05, flag: 'choice.n23_3_asked_ikejime' }),
      d('ask_knife', '막칼밖에 없는데, 그걸로도 특이 나옵니까?', "All I've got is a cleaver. Can that make top grade?",
        '안 나와요. 막칼은 상이 끝이에요. 칼이 살을 눌러서 결이 뭉개져요. (자기 회칼을 칼집째 보여 준다. 빌려주지는 않는다.)\n\n회칼부터 마련해요. 증명은 손이 하는데, 그 손도 칼을 잘 만나야 해요.',
        "It can't. With a cleaver, high is as far as it goes. The blade presses down and crushes the grain. (She shows me her own sashimi knife, still in its sheath. She doesn't lend it.)\n\nGet a sashimi knife first. The hands do the proving, but even hands need the right blade.",
        { affinity: 0.02, flag: 'choice.n23_3_asked_knife' }),
      d('just_trust', '좋은 개체였다고 제가 말하면 안 믿으실 거예요?', "If I tell you it was a good one, you won't believe me?",
        '믿어요. 그런데 표에는 못 적어요. 말은 칸이 없어요. (조사표를 펼쳐 빈칸을 보여 준다.)\n\n등급은 칸이 있어요. 특, 상, 중, 하. 거기 적히면 저 말고 다른 사람도 믿어요. 특으로 떠 와요.',
        "I'd believe you. But I can't put it on the sheet. Words don't get a column. (She opens the survey sheet and shows me the empty boxes.)\n\nGrades do. Prime, high, middle, low. Once it's written there, people other than me believe it too. Bring it back prime.",
        { affinity: 0 }),
    ],
    completeAdd: [
      d('from_water', '등급이 물가에서부터 갈린다면, 잡는 법부터 다시 배워야겠네요.', "If the grade starts at the water, I should relearn how I land them.",
        '맞아요. 등급은 도마가 아니라 물가에서 시작해요. 오래 끌면 살이 지쳐요. 걸면 빨리 올리고, 살려 두었다가 바로 시메요. (바늘 빼는 손놀림을 짧게 보여 준다.)\n\n잡는 사람이 접시의 반을 떠요. 나머지 반만 칼이 해요.',
        "Right. A grade starts at the water, not on the board. Drag out the fight and the flesh tires. Once it's hooked, land it fast, keep it alive, then ikejime straight away. (She shows a quick unhooking motion.)\n\nWhoever catches the fish slices half the plate. The knife only does the other half.",
        { proficiency: { category: 'fishing', xp: 22 }, affinity: 0.04 }),
    ],
    completeReply: {
      data: [
        '혈합육 색. 그리고 시메 시각. (회 등급이 안정된다.)\n\n혈합육은 살 가운데 붉은 줄이에요. 그게 검붉으면 피가 덜 빠진 거예요. 시메가 늦었거나요. 접시에서 제일 먼저 보는 데가 거기예요.',
        "The colour of the blood line. And the time of the ikejime. (My sashimi grade steadies.)\n\nThe blood line is the red streak through the middle of the flesh. If it's dark red, the blood didn't drain properly. Or the ikejime came late. It's the first place I look on a plate.",
      ],
      pay: [
        '규정대로. 조사 협력. (영수증에 특급 회 1접시라고 적힌다.)\n\n회 한 접시를 조사로 적은 건 저도 처음이에요. 그래도 틀린 말은 아니에요. 이 접시가 그 개체의 마지막 기록이니까요.',
        "By the rules. Survey cooperation. (The receipt reads: top-grade sashimi, one plate.)\n\nIt's my first time logging a plate of sashimi as survey work. But it isn't wrong. This plate is that fish's last record.",
      ],
      volunteer: [
        '…그 말도 접시가 한 것 같네요. (여수 조사 협력자 명단 첫 줄.)\n\n말을 아끼는 사람은 칼도 아껴서 써요. 결이 하나도 안 뭉개졌어요. 그게 제일 큰 증명이에요.',
        "…I think the plate said that too. (First in the Yeosu cooperator list.)\n\nPeople who spare their words spare the knife too. Not one slice crushed. That's the biggest proof there is.",
      ],
    },
  },

  // ── N23-4 「금어기의 자」 · 채수림 ──
  'N23-4': {
    offer: [
      d('five_five', '다섯 번 재고, 다섯 번 놓아주겠습니다.', "Five measured, five let go. I'll do it.",
        '좋아요. 대신 재는 데 오래 걸리면 안 돼요. 물 밖에 있는 시간이 길수록 살아날 확률이 줄어요. (자에 바닷물을 한 번 끼얹어 보인다.)\n\n젖은 손, 젖은 자. 재고 바로 놓아요. 마른 손은 비늘을 상하게 해요.',
        "Good. But don't take long over the measuring. The longer it's out of the water, the worse its odds. (She splashes some seawater over the rule to show me.)\n\nWet hands, wet rule. Measure and let go straight away. Dry hands damage the scales.",
        { affinity: 0.04 }),
      d('ask_season', '금어기 개체는 어떻게 알아봐요? 철마다 다르잖아요.', "How do I know what's closed-season? It changes through the year.",
        '종마다, 달마다 달라요. 알 낳는 철에 맞춰서 정해요. 알 낳으러 온 놈을 잡으면 내년이 없으니까요. (수첩 맨 앞장의 달력을 펼쳐 보인다.)\n\n외우기 어려우면 잡을 때마다 확인해요. 모르겠으면 재고 놓아요. 놓아줘서 문제 되는 일은 없어요.',
        "It varies by species and by month. It's set around spawning. Take the ones that came in to spawn and there's no next year. (She opens the calendar at the front of her notebook.)\n\nIf it's hard to memorise, check every time you catch one. If you're not sure, measure and let go. Nobody ever got in trouble for letting one go.",
        { affinity: 0.05, flag: 'choice.n23_4_asked_season' }),
      d('waste', '애써 잡은 걸 다섯 번이나 놓아주려니 좀 아깝네요.', "Letting five go after working to catch them… feels a bit of a waste.",
        '아까운 게 정상이에요. 다들 그래요. (자를 접었다가 다시 편다.)\n\n그런데 놓아준 다섯은 내년에 알을 낳아요. 그 알이 몇 마리가 되는지 생각해 봐요. 그러면 아까운 쪽이 바뀌어요. 다섯 번이요.',
        "Feeling it's a waste is normal. Everyone does. (She folds the rule, then opens it again.)\n\nBut those five will spawn next year. Think how many fish those eggs become. Then the waste is on the other side. Five times.",
        { affinity: 0.01 }),
      d('hold_still', '재는 동안 물고기가 가만히 있어 줄까요?', "Will the fish keep still while I measure it?",
        '안 있어요. 그래서 눈을 가려요. 젖은 수건으로 머리를 덮으면 조용해져요. (농담으로 받지 않고, 수건 덮는 시늉을 진지하게 한다.)\n\n버둥대는 걸 억지로 누르면 비늘이 상해요. 놓아줬는데 죽으면 그건 놓아준 게 아니에요.',
        "It won't. So you cover its eyes. Lay a wet cloth over the head and it calms down. (She doesn't take it as a joke, and mimes draping the cloth quite seriously.)\n\nPin down a thrashing fish by force and the scales get damaged. If it dies after you let it go, you didn't really let it go.",
        { affinity: 0.03, flag: 'choice.n23_4_asked_calm' }),
    ],
    completeAdd: [
      d('shore_size', '갯것에도 금지체장이 있습니까? 해루질할 때도요?', "Do shore creatures have minimum sizes too? When I'm out foraging?",
        '있어요. 전복, 소라, 꽃게도요. 갯것도 자로 재요. (수첩 뒷장의 표를 넘겨 보여 준다.)\n\n그런데 여기선 그 전에 볼 게 있어요. 전복, 소라는 마을 바다 거예요. 크기보다 손대도 되는 사람인지가 먼저예요.',
        "They do. Abalone, turban shells, swimming crabs too. Shore catch gets measured with a rule as well. (She flips to a table at the back of her notebook.)\n\nBut around here there's something to check first. Abalone and turban shells belong to the village fishery. Before size comes whether you're allowed to touch them at all.",
        { proficiency: { category: 'gathering', xp: 22 }, affinity: 0.04 }),
    ],
    completeReply: {
      data: [
        '자원량 추정이요. 당신 다섯 줄이 내년 금어기를 정해요. (계측 기록이 몸에 붙는다.)\n\n한 사람 다섯 줄은 작아요. 그런데 다섯 줄씩 적는 사람이 백 명이면 바다가 보여요. 그래서 한 줄도 대충 적으면 안 돼요.',
        "Stock estimates. Your five lines set next year's closed season. (Measurement records settle into my body.)\n\nFive lines from one person is small. But a hundred people writing five lines each, and you can see the sea. So not one line gets written carelessly.",
      ],
      pay: [
        '규정대로. 다섯 건. (영수증 다섯 줄.)\n\n놓아준 물고기에 값을 매기는 건 이상하죠. 그래도 잰 시간에는 값이 있어요. 방생도 조사예요.',
        "By the rules. Five entries. (Five lines on the receipt.)\n\nPutting a price on fish you let go is odd, I know. But the time you spent measuring is worth something. Releasing is survey work too.",
      ],
      volunteer: [
        '…그 말, 표에 적을 수는 없지만 기억할게요. (바다 평판이 조용히 오른다.)\n\n개체가 살았으면 됐다는 사람은 다음에도 놓아줘요. 조사표는 결국 그런 사람들이 채워요. 조용히요.',
        "…I can't put that on the sheet, but I'll remember it. (My standing at sea rises quietly.)\n\nPeople who say it's enough that the fish lived let the next one go too. In the end, it's people like that who fill the survey sheets. Quietly.",
      ],
    },
  },

  // ── N23-5 「종을 세는 일」 · 채수림 ──
  'N23-5': {
    offer: [
      d('open_guide', '몇 마리 말고 몇 종. 도감부터 열어 보겠습니다.', "Species, not numbers. I'll start by opening my codex.",
        '좋아요. 열어 보면 생각보다 빈칸이 많을 거예요. 그게 정상이에요. (자기 조사표의 빈칸을 손끝으로 훑는다.)\n\n잡은 걸 또 잡으면 숫자만 늘어요. 못 본 걸 찾아야 종이 늘어요. 인천은 종이 많아요.',
        "Good. You'll find more blanks than you expect. That's normal. (She runs a fingertip down the empty boxes on her own sheet.)\n\nCatch the same thing again and only the number grows. Find what you haven't seen and the species grow. Incheon has plenty of species.",
        { affinity: 0.04 }),
      d('ask_species', '마릿수 말고 종을 세는 이유가 있어요?', "Why count species instead of fish?",
        '마릿수는 그날 운이에요. 떼를 만나면 백 마리고, 못 만나면 영이에요. 종은 운을 덜 타요. (조사표 맨 위 칸을 가리킨다.)\n\n한 바다에 몇 종이 사는지가 그 바다 건강이에요. 종이 줄면 숫자가 많아도 아픈 바다예요. 40종이요.',
        "Numbers are that day's luck. Hit a school and it's a hundred; miss it and it's zero. Species don't ride on luck as much. (She points to the top box of the sheet.)\n\nHow many species live in a sea — that's how healthy it is. If the species drop, it's a sick sea however big the numbers. Forty species.",
        { affinity: 0.05, flag: 'choice.n23_5_asked_species' }),
      d('forty_doubt', '40종이요? 그건 며칠로는 안 될 것 같은데요.', "Forty species? That's not happening in a few days.",
        '안 되죠. 며칠로는요. (조금도 미안한 기색이 없다.)\n\n그러니까 서두르지 마요. 대신 같은 자리만 가지 마요. 갯바위, 모래, 밤, 낮. 자리를 바꾸면 종이 바뀌어요.',
        "It's not. Not in a few days. (She doesn't look the least bit sorry.)\n\nSo don't rush. Just don't keep going back to the same spot. Rocks, sand, night, day. Change where you stand and the species change.",
        { affinity: 0.01 }),
      d('ask_rules', '도감에 이미 있는 종도 세는 거예요? 새로 잡은 것만요?', "Do species already in my codex count, or only new catches?",
        '이미 있는 것도 다 세요. 지금까지 본 게 다 조사예요. (도감을 넘기며 고개를 끄덕인다.)\n\n다만 조사표에 올릴 다섯 건은 새로 잡아야 해요. 날짜가 있어야 하거든요. 옛날 기억은 날짜가 흐려요.',
        "Everything already in there counts. All you've seen so far is survey. (She nods as she leafs through the codex.)\n\nBut the five catches for the sheet have to be new. They need dates. Old memories have blurry dates.",
        { affinity: 0.03, flag: 'choice.n23_5_asked_rules' }),
    ],
    completeAdd: [
      d('shore_species', '갯것도 종으로 세는 법이 있습니까? 게나 고둥 같은 거요.', "Is there a way to tell shore creatures apart by species? Crabs, whelks?",
        '있어요. 게는 집게랑 등딱지 무늬, 고둥은 껍데기 입구 모양. 물고기처럼 한 군데씩 정해서 봐요. (수첩에 고둥 하나를 빠르게 그려 보인다.)\n\n조사표엔 물고기만 올라가요. 그래도 세는 눈은 같아요. 한 군데만 정확히 보면 나머지가 따라와요.',
        "There is. Crabs by the claws and the shell pattern, whelks by the shape of the opening. Like with fish, you pick one feature and look at that. (She quickly sketches a whelk in her notebook.)\n\nOnly fish go on the survey sheet. But the counting eye is the same. Look at one thing precisely and the rest follows.",
        { proficiency: { category: 'gathering', xp: 20 }, affinity: 0.04 }),
    ],
    completeReply: {
      data: [
        '지느러미 수. 그리고 입 모양. (어종 판별이 빨라진다.)\n\n비슷한 종은 몸 색보다 지느러미 가시 수가 정확해요. 색은 죽으면 변해요. 가시는 안 변해요.',
        "Fin counts. And the shape of the mouth. (Identifying species gets faster.)\n\nWith look-alike species, the fin spine count beats body colour. Colour changes after death. Spines don't.",
      ],
      pay: [
        '규정대로. 40종이면 등급이 높아요. (영수증 숫자가 길다.)\n\n마릿수 많은 표보다 종 많은 표가 값이 나가요. 이상하죠. 그게 맞는 거예요. 바다를 더 많이 보여 주니까요.',
        "By the rules. Forty species rates highly. (The figure on the receipt is long.)\n\nA sheet with many species is worth more than one with many fish. Strange, isn't it? But that's how it should be. It shows more of the sea.",
      ],
      volunteer: [
        '…당신 도감이 조사표예요. 진짜로요. (인천 조사 협력자 명단 첫 줄.)\n\n다음 사람이 이 도감을 보면 어디부터 찾아야 할지 알 거예요. 빈칸이 어디인지가 제일 쓸모 있는 기록이에요.',
        "…Your codex is the survey sheet. Genuinely. (First in the Incheon cooperator list.)\n\nWhoever comes next will look at this codex and know where to start searching. Where the blanks are is the most useful record of all.",
      ],
    },
  },

  // ── N23-6 「남길 것」 · 채수림 ──
  'N23-6': {
    offer: [
      d('own_plate', '기록에 남길 접시, 제 손으로 만들어 오겠습니다.', "A plate for the record. I'll make it with my own hands.",
        '그래요. 조사가 아니라 먹을 접시요. 재고 놓아준 것 말고, 먹은 것도 기록이에요. (조사표 마지막 장을 손바닥으로 눌러 둔다.)\n\n회 한 접시, 익힌 거 한 접시. 직접 잡고 직접 만든 걸로요. 사 온 건 안 돼요.',
        "Good. A plate to eat, not to survey. Not what was measured and released — what was eaten is a record too. (She presses her palm flat on the last page of the sheet.)\n\nOne plate raw, one plate cooked. Caught by you, made by you. Nothing bought.",
        { affinity: 0.05 }),
      d('ask_next', '조사표를 받을 다음 사람은 누구예요? 정해졌어요?', "Who's the next person to get the sheet? Has that been decided?",
        '누가 될지는… 접시 보고요. (말끝을 흐리며 표지를 한 번 쓰다듬는다.)\n\n조사표는 누가 받을지 모르고 넘기는 거예요. 그래서 깨끗하게 남겨야 해요. 누가 받아도 읽을 수 있게요. 접시부터요.',
        "Who it'll be… depends on the plate. (She trails off and smooths the cover once.)\n\nYou hand a survey sheet on without knowing who'll get it. That's why it has to be left clean. So anyone can read it. The plate comes first.",
        { affinity: 0.04, flag: 'choice.n23_6_asked_next' }),
      d('ask_page', '마지막 장을 왜 비워 둬요? 제가 뭘 적어야 하는데요?', "Why leave the last page blank? What am I meant to write?",
        '당신이 본 거요. 숫자 말고요. 몇 종, 몇 마리, 몇 센티는 앞에 다 있어요. (표를 넘겨 빽빽한 앞장들을 보여 준다.)\n\n마지막 장엔 칸이 없어요. 칸이 없어야 적을 수 있는 게 있어요. 지금 정하지 않아도 돼요. 접시부터 만들어 와요.',
        "What you saw. Not numbers. How many species, how many fish, how many centimetres — that's all at the front. (She flips through the crowded front pages.)\n\nThe last page has no boxes. Some things can only be written where there are no boxes. You don't have to decide now. Make the plate first.",
        { affinity: 0.05, flag: 'choice.n23_6_asked_page' }),
      d('strange', '먹는 접시가 기록이 된다니, 좀 낯설어요.', "A plate I eat becoming a record… it feels strange.",
        '낯설죠. 조사표에 접시 사진을 붙이는 조사원은 없을 거예요. (작게 웃는다.)\n\n그래도 바다에서 건진 것 중에 사람 입에 들어간 것도 있어야 기록이 끝나요. 세기만 하고 먹지 않는 바다는 반쪽이에요. 한 접시 만들어 와요.',
        "It is strange. I doubt any surveyor has ever pasted a photo of a plate into a survey sheet. (She laughs softly.)\n\nStill, a record isn't finished until something from the sea has gone into someone's mouth. A sea you only count and never eat from is half a sea. Go and make that plate.",
        { affinity: 0.02 }),
    ],
    completeAdd: [
      d('surveyor_eye', '조사원 눈으로 낚시를 다시 배우고 싶습니다. 무엇부터입니까?', "I want to relearn fishing with a surveyor's eye. Where do I start?",
        '같은 자리, 같은 방법, 오래요. 그게 조사원 낚시예요. 잘 잡는 것보다 똑같이 잡는 게 어려워요. (조사표 앞장들을 넘겨 보인다. 칸마다 같은 순서다.)\n\n쓴 미끼, 물때, 몇 번 던졌는지. 매번 같은 칸에 적어요. 그러면 바다가 바뀐 게 보여요.',
        "Same spot, same method, for a long time. That's fishing like a surveyor. Catching the same way every time is harder than catching well. (She flips through the front pages. Every box comes in the same order.)\n\nThe bait you used, the tide, how many casts. Write them in the same boxes every time. Then you can see when the sea changes.",
        { proficiency: { category: 'fishing', xp: 30 }, affinity: 0.05 }),
    ],
    completeReply: {
      empty_page: [
        '…그래서 당신한테 준 거예요. (조사표와 함께 관리사 도장을 준다. 협력자가 아니라 조사원이라고.)\n\n비워 둘 줄 아는 사람한테 맡겨야 다음 사람한테도 빈 장이 가요. 언젠가 당신도 넘길 거예요. 그때까지 들고 다녀요.',
        "…That's why I gave it to you. (With the sheet she gives me a manager's stamp. Not cooperator — surveyor.)\n\nOnly someone who knows how to leave it blank will pass a blank page on. Someday you'll hand it over too. Until then, keep it with you.",
      ],
      lesson: [
        '먹고 싶은 접시요. 그게 기록이에요. (요리와 기록이 이어진다.)\n\n조사표의 숫자는 남들이 읽어요. 접시는 먹은 사람만 기억해요. 둘 다 있어야 그 바다를 알았다고 할 수 있어요.',
        "One you want to eat. That's the record. (Cooking and record-keeping join up.)\n\nThe numbers on a sheet are for others to read. A plate lives only in the memory of whoever ate it. You need both before you can say you knew that sea.",
      ],
      pay: [
        '규정대로. 마지막이니까 등급 최고. (영수증 숫자가 제일 길다.)\n\n마지막 영수증도 정확하게 적었어요. 마지막이라고 대충 하면 앞에 적은 것까지 의심받아요.',
        "By the rules. Top grade, since it's the last. (The longest figure on any receipt.)\n\nThe last receipt's written out exactly as well. Get sloppy because it's the last, and everything before it gets doubted too.",
      ],
    },
  },

  // ── N22-1 「작업대를 세우다」 · 하늬 ──
  'N22-1': {
    offer: [
      d('make_first', '사기 전에 하나 만들어 보는 거, 해 보고 싶어요.', "Making one before I buy anything — I'd like to try that.",
        '그쵸? 만들어 보면 파는 물건이 다르게 보여요. 어디에 손이 갔는지 보이거든요. (작업대 위 대팻밥을 손바닥으로 쓸어 낸다.)\n\n처음엔 쉬운 걸로 골라요. 망쳐도 안 아까운 걸로요. 망치는 것도 배우는 거예요.',
        "Right? Once you've made one, things in the shops look different. You can see where the work went. (She sweeps the wood shavings off the bench with her palm.)\n\nPick an easy one to start. Something you won't mind ruining. Ruining things is part of learning too.",
        { affinity: 0.05 }),
      d('ask_plans', '도면은 어디서 구해요? 그냥 보고 따라 하면 돼요?', "Where do the plans come from? Do I just follow them?",
        '처음부터 아는 것도 있고, 가게에서 사는 것도 있어요. 다 만든 물건을 뜯어 보다가 짜임새를 깨치기도 하고요. (벽에 압정으로 꽂힌 도면들을 가리킨다.)\n\n근데 도면은 순서만 알려 줘요. 손은 안 알려 줘요. 그건 해 봐야 알아요.',
        "Some you know from the start, some you buy at shops. Sometimes you take a finished thing apart and work out how it goes together. (She points at the plans pinned to the wall.)\n\nBut a plan only tells you the order. It doesn't tell your hands. That you only learn by doing.",
        { affinity: 0.04, flag: 'choice.n22_1_asked_plans' }),
      d('clumsy', '제가 손재주가 없어서요. 재료만 버리는 거 아닐까요?', "I'm not good with my hands. Won't I just waste the materials?",
        '버려요. 처음엔 다 버려요. (아무렇지 않게 웃는다.)\n\n그래도 버린 재료가 제일 많이 가르쳐 줘요. 어디서 틀렸는지 손에 남거든요. 재료값은 수업료라고 생각하고, 하나 골라 봐요.',
        "You will. Everyone wastes some at first. (She laughs as if it's nothing.)\n\nBut wasted material teaches you the most. Your hands remember where it went wrong. Think of the material as tuition, and pick one.",
        { affinity: 0.03 }),
      d('just_buy', '그냥 사서 쓰면 안 돼요? 그게 더 빠를 텐데요.', "Can't I just buy one? That'd be quicker.",
        '돼요. 사서 쓰는 것도 방법이라니까요. (손을 털며 어깨를 으쓱한다.)\n\n근데 한 번 만들어 본 사람은 살 때 안 속아요. 이음새를 보거든요. 하나만 만들어 봐요. 그다음엔 사도 돼요.',
        "You can. I did say buying's one way. (She dusts off her hands and shrugs.)\n\nBut someone who's made one never gets fooled when buying. They check the joins. Just make one. After that, buy all you like.",
        { affinity: 0 }),
    ],
    completeAdd: [
      d('shop_eye', '만들어 보니까 가게 물건 값이 왜 그런지 알겠어요.', "Now I've made one, I see why things in the shop cost what they do.",
        '맞아요. 이제 살 때 이음새부터 볼 거예요. 비싼 데는 이유가 있고, 싼 데도 이유가 있어요. (진열대의 물건 하나를 들어 뒤집어 보인다.)\n\n그 이유를 아는 사람은 덜 내고 더 좋은 걸 사요. 공방 손님한테 제일 먼저 가르치고 싶은 게 그거예요.',
        "Exactly. From now on you'll check the joins first when you buy. Expensive has its reasons, and so does cheap. (She picks something up off the display and turns it over.)\n\nPeople who know those reasons pay less and get better things. That's the first thing I want to teach anyone who walks into the workshop.",
        { proficiency: { category: 'economy', xp: 18 }, affinity: 0.04 }),
    ],
    completeReply: {
      lesson: [
        '사포 방향이에요. 결을 따라서. (손이 결을 읽기 시작한다.)\n\n결을 거스르면 나무가 일어나요. 털처럼요. 손바닥으로 쓸어 보면 알아요. 걸리는 쪽이 거스르는 쪽이에요.',
        "It's the sanding direction. With the grain. (My hands begin to read grain.)\n\nGo against the grain and the wood lifts. Like fur. Run your palm over it and you'll feel it. Whichever way it catches is the wrong way.",
      ],
      pay: [
        '맞아요. 노동은 노동이죠. (공방 장부에 첫 줄로 적힌다.)\n\n거칠어도 손이 간 건 값이 있어요. 장부 첫 줄은 오래 남아요. 두 번째 건 덜 거칠 거예요.',
        "Right. Labour is labour. (It goes on the first line of the workshop ledger.)\n\nRough or not, anything that took your hands is worth something. The first line in a ledger stays a long time. The second piece will be less rough.",
      ],
      decline: [
        '…그 말, 공방 손님 중에 처음이에요. (공방 작업대 한 칸이 내 자리가 됐다.)\n\n배운 게 있으면 됐다는 사람은 오래 만들어요. 거친 첫 작품도 버리지 마요. 두 번째 걸 만들 때 옆에 두고 봐요.',
        "…No workshop customer has said that before. (A space on the bench becomes mine.)\n\nPeople who say learning something is enough keep making things for a long time. Don't throw out that rough first piece. Keep it beside you when you make the second.",
      ],
    },
  },

  // ── N22-2 「빈 방」 · 하늬 ──
  'N22-2': {
    offer: [
      d('one_thing', '잠만 자던 방이라… 하나부터 놓아 볼게요.', "It's only ever been a room for sleeping… I'll start with one thing.",
        '하나면 돼요. 처음부터 채우면 방이 숨을 못 쉬어요. (손가락 하나를 펴 보인다.)\n\n뭘 놓을지는 방에 서서 정해요. 아침에 어디서 눈을 뜨는지, 저녁에 어디에 앉고 싶은지. 그게 답이에요.',
        "One's enough. Fill it all at once and the room can't breathe. (She holds up a single finger.)\n\nDecide what goes in by standing in the room. Where you open your eyes in the morning, where you'd like to sit in the evening. That's your answer.",
        { affinity: 0.05 }),
      d('ask_living', '자는 데랑 사는 데가 어떻게 다른데요?', "How is sleeping somewhere different from living there?",
        '자는 데는 눈 감으면 끝이에요. 사는 데는 눈 뜨고 있는 시간이 있어요. 앉아 있고, 뭘 보고, 뭘 만지고. (공방 구석의 낡은 의자를 턱으로 가리킨다.)\n\n그 시간이 생기면 방이 사람을 닮아 가요. 하나부터요.',
        "A place for sleeping is done the moment you close your eyes. A place for living has hours with your eyes open. Sitting, looking at things, handling things. (She nods toward an old chair in the corner of the workshop.)\n\nOnce those hours exist, the room starts to look like a person. Start with one thing.",
        { affinity: 0.05, flag: 'choice.n22_2_asked_living' }),
      d('bed_enough', '침대 하나면 충분하지 않아요? 어차피 자러 들어가는데.', "Isn't a bed enough? I only go in there to sleep anyway.",
        '그 말 하는 사람들 방은 다 똑같아요. 침대, 가방, 벗어 둔 옷. (웃는다.)\n\n딱 하나만 놓아 봐요. 그래도 침대만 있는 게 좋으면 그때 빼요. 빼는 건 금방이에요.',
        "People who say that all have the same room. A bed, a bag, yesterday's clothes. (She laughs.)\n\nPut in just one thing. If you still prefer only the bed, take it out then. Taking it out is quick.",
        { affinity: 0.01 }),
      d('ask_first', '뭘 놓을지 모르겠어요. 하늬 씨라면 뭘 먼저 놓으세요?', "I've no idea what to put in. What would you put in first?",
        '제 방 얘기는 반칙이에요. (손사래를 친다.) 대신 하나만 물을게요. 방에서 제일 오래 있는 데가 어디예요?\n\n거기 놓을 걸 만들어요. 앉는 거든 올려 두는 거든. 쓰는 데에 놓아야 물건이 살아요.',
        "Talking about my room would be cheating. (She waves the question off.) Let me ask you one thing instead. Where in the room do you spend the most time?\n\nMake something for that spot. Something to sit on, something to set things on. Things only come alive where they get used.",
        { affinity: 0.03, flag: 'choice.n22_2_asked_first' }),
    ],
    completeAdd: [
      d('sleep_well', '잠도 좀 더 잘 자고 싶은데, 침대 자리도 봐 주실래요?', "I'd like to sleep better too. Would you look at where my bed goes?",
        '어디 봐요. (내 설명을 듣더니 손가락으로 허공에 방을 그린다.)\n\n머리를 문 쪽에 두면 문이 열릴 때마다 깨요. 벽 쪽으로 돌려요. 창 바로 밑도 피하고요. 바람이 머리로 와요. 잠은 자리가 반이에요.',
        "Let's see. (She listens to me describe it and sketches the room in the air with a finger.)\n\nIf your head's toward the door, you'll wake every time it opens. Turn it toward the wall. And not right under the window — the draught comes straight at your head. Half of sleeping well is where you lie.",
        { proficiency: { category: 'life', xp: 20 }, affinity: 0.05 }),
    ],
    completeReply: {
      lesson: [
        '빛이에요. 창에서 들어오는. (방을 보는 눈이 생긴다.)\n\n빛이 닿는 데에 앉을 걸 두고, 안 닿는 데에 넣어 둘 걸 둬요. 그것만 지켜도 방이 덜 답답해요. 해가 어디로 옮겨 가는지도 한번 봐 두고요.',
        "It's the light. What comes through the window. (I get an eye for rooms.)\n\nPut the things you sit on where the light reaches, and the things you store where it doesn't. Just that, and a room feels less cramped. And watch once where the sun moves through the day.",
      ],
      pay: [
        '아니요, 제가 배웠어요. 사람 방 보는 건 늘 배워요. (오히려 나무 조각을 하나 준다.)\n\n의자 하나로 방이 달라지는 걸 보는 게 이 일의 재미예요. 오늘은 제가 덤을 받은 셈이에요.',
        "No — I learned something. I always learn from other people's rooms. (She gives me a piece of wood instead.)\n\nWatching one chair change a room is the fun of this work. If anything, I'm the one who got a bonus today.",
      ],
      decline: [
        '…그 말이 제가 듣고 싶은 말이었어요. (공방 손님 명부에 내 방 스케치가 붙는다.)\n\n방이 달라 보였다는 건 방보다 사람이 달라졌다는 뜻이에요. 의자 하나로요. 그래서 이 일이 좋아요.',
        "…That's exactly what I wanted to hear. (A sketch of my room goes up in the workshop guest book.)\n\nIf the room looked different, it means the person changed more than the room. With one chair. That's why I love this work.",
      ],
    },
  },

  // ── N22-3 「돌을 고르다」 · 하늬 ──
  'N22-3': {
    offer: [
      d('pick_own', '봉돌값 아끼는 거라면 대찬성이에요. 골라 볼게요.', "Saving on sinkers? I'm all for it. I'll go and pick some.",
        '그쵸? 봉돌값 무시 못 해요. 바닥에 걸리면 하루에도 몇 개씩 날아가잖아요. (주머니에서 매끈한 갯돌 하나를 꺼내 손바닥에 올려 보인다.)\n\n이런 거요. 손에 쏙 들어오고, 한쪽으로 안 쏠리는 거. 갯가에서 세 개만 골라 와요.',
        "Right? Sinker money adds up. Snag the bottom and you lose a few a day. (She takes a smooth beach stone from her pocket and sets it on her palm.)\n\nLike this. Fits in your hand, doesn't lean to one side. Just pick three off the shore.",
        { affinity: 0.05 }),
      d('ask_break', '어디를 깨야 나오는지는 왜 따로 배워요?', "Why is where to break it a separate lesson?",
        '그건 손이 먼저 알아야 해서요. 말로 하면 반도 안 전해져요. (손날로 허공을 한 번 내리쳐 보인다.)\n\n오늘은 고르는 것부터요. 갯가에서 세 개 줍고, 채석 자리에서도 캐 보고요. 깨는 건 고른 걸 보고 나서 얘기해요.',
        "Because your hands have to learn it first. Put it into words and not half of it gets across. (She chops the air once with the edge of her hand.)\n\nToday, start with picking. Three from the shore, and try digging at the quarry too. We'll talk about breaking once I've seen what you chose.",
        { affinity: 0.04, flag: 'choice.n22_3_asked_break' }),
      d('ask_allowed', '갯가 돌은 아무나 막 주워 가도 돼요?', "Can just anyone take stones off the shore?",
        '막은 안 돼요. 필요한 만큼만이요. 바닷가 돌은 파도가 몇 년을 굴려서 만든 거예요. (손가락 세 개를 펴 보인다.)\n\n그래서 세 개예요. 한 자루 퍼 가는 사람은 봉돌값이 아니라 바닷가를 가져가는 거예요.',
        "Not just like that. Only what you need. Shore stones are what the waves spent years rolling smooth. (She holds up three fingers.)\n\nThat's why it's three. Someone who shovels away a sackful isn't saving on sinkers. They're taking the beach.",
        { affinity: 0.04, flag: 'choice.n22_3_asked_allowed' }),
      d('pretty_rocks', '돌 주워서 돈을 아낀다니, 어릴 때 이후로 처음이네요.', "Saving money by picking up rocks — first time since I was a kid.",
        '어릴 때 주운 돌은 예뻐서 주웠죠? 이번엔 무게 보고 주워요. (손바닥 위 돌을 위아래로 까딱여 본다.)\n\n예쁜 돌이랑 쓸 돌은 달라요. 예쁜 돌은 눈으로 고르고, 쓸 돌은 손으로 골라요. 눈 감고 골라도 돼요.',
        "Back then you picked them because they were pretty, right? This time it's for the weight. (She bobs the stone up and down on her palm.)\n\nPretty stones and useful stones are different. Pretty ones you choose with your eyes, useful ones with your hands. You could choose them with your eyes shut.",
        { affinity: 0.03 }),
    ],
    completeAdd: [
      d('cast_sinker', '고른 돌을 보니, 봉돌도 직접 부어 보고 싶어졌어요.', "Looking at these stones, now I want to cast my own sinkers too.",
        '좋아요. 붓는 건 주석이에요. 녹여서 틀에 부어요. 그런데 돌 고를 때랑 같아요. 무게보다 중심이 먼저예요. (돌 하나를 손끝에 올려 균형을 잡아 보인다.)\n\n한쪽으로 쏠린 봉돌은 물속에서 돌아요. 줄이 꼬여요. 틀에 부을 때 기포 없이, 고르게요.',
        "Good. What you pour is tin. Melt it and pour it into a mould. But it's the same as picking stones. Balance before weight. (She balances a stone on her fingertip to show me.)\n\nA lopsided sinker spins in the water. Your line twists. When you pour, keep it even, no bubbles.",
        { proficiency: { category: 'crafting', xp: 22 }, affinity: 0.04 }),
    ],
    completeReply: {
      lesson: [
        '결이에요. 돌도 결이 있어요. (채석 자리를 보는 눈이 생긴다.)\n\n결 따라 치면 한 번에 떨어지고, 거슬러 치면 손만 울려요. 겉에 난 가는 줄무늬를 먼저 봐요. 그게 돌이 갈라지고 싶은 방향이에요.',
        "The grain. Stone has grain too. (I get an eye for where to quarry.)\n\nStrike with the grain and it comes away in one go. Against it and all you get is stinging hands. Look for the fine lines on the surface first. That's the way the stone wants to split.",
      ],
      pay: [
        '살게요. 재료값으로. (공방 장부에 첫 매입.)\n\n무게가 고른 돌은 찾는 사람이 꼭 있어요. 봉돌값 아까운 사람이 저 말고도 많거든요.',
        "I'll buy it. As materials. (The workshop ledger's first purchase.)\n\nThere's always someone after evenly weighted stones. Plenty of people besides me begrudge the price of sinkers.",
      ],
      decline: [
        '아꼇죠. 그게 시작이에요. (공방 재료 선반 한 칸을 내준다.)\n\n아낀 돈보다 고르는 눈이 더 오래가요. 다음에 갯가에 가면 발밑부터 보게 될 거예요. 그게 시작이라는 뜻이에요.',
        "It did. That's where it starts. (A slot on the materials shelf becomes mine.)\n\nThe eye for picking outlasts the money you saved. Next time you're on a beach, you'll look at your feet first. That's what I mean by a start.",
      ],
    },
  },

  // ── N22-4 「한 이랑」 · 하늬 ──
  'N22-4': {
    offer: [
      d('grow_own', '밑밥 재료를 직접 기른다니… 낚시꾼이 농사라, 해 볼게요.', "Growing my own chum… An angler farming. All right, I'll try.",
        '낚시꾼이 흙 만지는 거, 이상할 거 없어요. 바다 일도 철 따라 하잖아요. (호미 끝으로 땅에 줄을 하나 긋는다.)\n\n한 이랑이면 네 칸이에요. 옥수수 한 이랑이면 한 철 밑밥은 가요. 심을 때 간격만 지켜요. 붙여 심으면 서로 먹어요.',
        "Nothing strange about an angler handling soil. Sea work follows the seasons too, doesn't it? (She scratches a line in the ground with the tip of a hoe.)\n\nOne row is four plots. A row of corn keeps you in chum for a season. Just keep the spacing when you plant. Crowd them and they starve each other.",
        { affinity: 0.05 }),
      d('ask_corn', '옥수수가 밑밥이 돼요? 크릴만 쓰는 줄 알았어요.', "Corn makes chum? I thought it was all krill.",
        '섞어요. 크릴만 뿌리면 금방 흩어지고 잔챙이만 몰려요. 옥수수 알갱이는 무거워서 바닥까지 가라앉아요. (손바닥에 옥수수 알 몇 개를 굴려 보인다.)\n\n감성돔 같은 놈은 바닥에서 먹어요. 거기까지 내려가는 게 있어야 해요. 그걸 매번 사면 돈이 꽤 나가요. 한 이랑 심어 봐요.',
        "You mix it in. Krill on its own scatters fast and only pulls in the small fry. Corn kernels are heavy, they sink right to the bottom. (She rolls a few kernels around on her palm.)\n\nFish like black seabream feed on the bottom. Something has to get all the way down there. Buy that every time and it adds up. Plant a row.",
        { affinity: 0.04, flag: 'choice.n22_4_asked_corn' }),
      d('dirty_hands', '흙 만지는 건 영 자신이 없는데요. 손톱에 다 낄 텐데.', "I'm really not confident with soil. It'll get under my nails.",
        '껴요. 비늘도 끼는데 흙이라고 안 끼겠어요? (웃으며 자기 손톱을 보여 준다. 나무 가루가 끼어 있다.)\n\n손은 씻으면 돼요. 흙도 한 번 만져 보면 바다랑 비슷해요. 물이 들고 나는 때가 있어요. 한 이랑만 해 봐요.',
        "It will. Scales get under there too, don't they? Why not soil? (Laughing, she shows me her own nails. There's sawdust under them.)\n\nHands wash. And once you've handled soil, it's a lot like the sea. There's a time the water comes in and goes out. Just try one row.",
        { affinity: 0.02 }),
      dNo('흙은 다음에 만질게요. 지금은 바다 일이 밀려서요.', "I'll get my hands dirty another time. The sea's keeping me busy right now.",
        '그래요. 씨앗은 기다려 줘요. 철만 안 놓치면요. (호미를 벽에 기대 세워 둔다.)\n\n밑밥 사러 갈 때마다 한 번씩 생각나면, 그때 와요. 이랑은 그대로 있어요.',
        "All right. Seeds will wait. As long as you don't miss the season. (She leans the hoe against the wall.)\n\nIf it crosses your mind each time you go out to buy chum, come back then. The row will still be here.",
        -0.01),
    ],
    completeAdd: [
      d('farm_tip', '옥수수가 잘 크려면 뭘 조심해야 해요? 하나만 알려 주세요.', "What should I watch for so the corn grows well? Just one thing.",
        '하나만요? 그럼 이웃이요. 옥수수는 혼자 서 있으면 알이 덜 차요. 꽃가루가 옆 포기로 날아가야 하거든요. (손가락 네 개를 나란히 세워 보인다.)\n\n그래서 한 포기 말고 한 이랑이에요. 키가 크면 바람도 타요. 쓰러진 건 바로 세우고 흙을 북돋아 줘요.',
        "Just one? Then neighbours. Corn standing on its own doesn't fill its ears. The pollen has to blow across to the next plant. (She holds up four fingers side by side.)\n\nThat's why it's a row, not one plant. And once they're tall, the wind gets at them. If one falls over, stand it straight back up and heap the soil around it.",
        { proficiency: { category: 'farming', xp: 25 }, affinity: 0.04 }),
    ],
    completeReply: {
      lesson: [
        '해랑 물이에요. 바다랑 같아요. (농사 감각이 처음 생긴다.)\n\n해는 내가 못 바꾸니까 물로 맞춰요. 흙 겉이 마르면 주고, 젖어 있으면 하루 쉬어요. 바다에 나가기 전에 한 번 보는 버릇을 들여요.',
        "Sun and water. Same as the sea. (A feel for farming appears for the first time.)\n\nYou can't change the sun, so you adjust with water. If the topsoil's dry, water it. If it's damp, give it a day. Get into the habit of checking once before you head out to sea.",
      ],
      pay: [
        '맞아요. 노동은 노동. (공방 장부에 텃밭 노동이라고 적힌다.)\n\n많지는 않아요. 그래도 장부에 텃밭이라는 칸이 생긴 건 처음이에요. 칸이 생기면 계속 적게 돼요.',
        "Right. Labour is labour. (The ledger records 'garden labour'.)\n\nIt isn't much. But it's the first time the ledger's had a garden column. Once a column's there, you keep filling it.",
      ],
      decline: [
        '…그렇게 계산하는 사람 좋아요. (공방 뒤 텃밭 한 이랑이 내 것이 됐다.)\n\n돈 말고 철로 세는 사람이요. 한 철 밑밥이면 한 철 낚시죠. 그렇게 세는 사람이 흙도 오래 만져요.',
        "…I like people who count it that way. (One row of the back garden becomes mine.)\n\nSomeone who counts in seasons, not money. A season of chum is a season of fishing. People who count like that stick with the soil.",
      ],
    },
  },

  // ── N22-5 「창가의 수조」 · 하늬 ──
  'N22-5': {
    offer: [
      d('just_look', '팔지도 먹지도 않는 물고기라… 하나쯤 있으면 좋겠네요.', "A fish I won't sell or eat… It'd be nice to have one of those.",
        '그쵸. 매일 잡고, 재고, 손질하는 사람한테 하나쯤은 그냥 보는 게 있어야 해요. (창틀을 손바닥으로 한 번 쓸어 본다.)\n\n받침부터 만들어요. 물이 든 수조는 생각보다 무거워요. 받침이 기울면 물이 먼저 알아요.',
        "Right? Someone who catches, measures and guts fish every day needs at least one thing that's just for looking at. (She runs her palm along the window frame.)\n\nMake the stand first. A tank full of water is heavier than you'd think. If the stand leans, the water's the first to tell you.",
        { affinity: 0.05 }),
      d('ask_window', '왜 하필 창가예요? 수조는 그늘에 두는 거 아니에요?', "Why the window? Don't tanks belong in the shade?",
        '맞아요, 해가 바로 들면 이끼가 끼고 물이 더워져요. 그래서 창가 중에서도 해가 비껴 드는 데요. (손을 비스듬히 기울여 빛이 드는 각도를 보여 준다.)\n\n창가에 두는 건 물고기 때문이 아니라 사람 때문이에요. 지나가다 한 번씩 보게요. 보려고 두는 거니까요.',
        "You're right — direct sun brings algae and warms the water. So by the window, but where the light comes in at a slant. (She tilts her hand to show the angle of the light.)\n\nThe window isn't for the fish. It's for you. So you glance at it now and then as you pass. Looking is what it's for.",
        { affinity: 0.05, flag: 'choice.n22_5_asked_window' }),
      d('eat_joke', '넣어 두다가 배고프면… 아, 농담이에요.', "And if I get hungry one day… Kidding. Just kidding.",
        '그 농담 하는 사람 수조는 오래 못 가요. (눈을 가늘게 뜨더니 이내 웃는다.)\n\n이름을 붙여 줘요. 이름 있는 건 못 먹어요. 그게 제일 쉬운 방법이에요. 받침부터 만들고요.',
        "Tanks belonging to people who make that joke don't last long. (She narrows her eyes, then breaks into a laugh.)\n\nGive it a name. You can't eat something with a name. That's the easiest trick there is. Make the stand first.",
        { affinity: 0.01, flag: 'choice.n22_5_hungry_joke' }),
      d('ask_what', '뭘 넣어야 해요? 큰 놈을 넣어야 보기 좋을까요?', "What should go in? Would a big one look best?",
        '큰 놈은 수조가 좁아서 금방 지쳐요. 작고 오래 사는 놈이 좋아요. (엄지와 검지로 손가락 한 마디만 한 크기를 만들어 보인다.)\n\n근데 서두를 거 없어요. 뭘 넣을지는 천천히요. 정해지면 그때 넣으면 돼요.',
        "A big one tires fast in a small tank. Something small that lives long is better. (She shows a size about one finger-joint long between thumb and forefinger.)\n\nNo need to rush, though. Take your time deciding what goes in. Once you've decided, put it in then.",
        { affinity: 0.03, flag: 'choice.n22_5_asked_what' }),
    ],
    completeAdd: [
      d('level_tip', '받침이 조금 흔들려요. 수평 맞추는 요령이 있어요?', "The stand wobbles a little. Is there a knack to getting it level?",
        '물을 조금만 부어 봐요. 바닥에 얇게 깔리면 어느 쪽이 깊은지 보여요. 낮은 쪽 다리 밑은 얇게 깎은 쐐기로 받쳐요. (나무 쐐기 하나를 깎아 보이며 각도를 잡는다.)\n\n다 채우고 맞추면 늦어요. 그때는 무거워서 손을 못 대요. 물이 얕을 때 맞춰요.',
        "Pour in just a little water. Once it's a thin layer across the bottom, you can see which side is deeper. Shim the low leg with a thin wedge. (She whittles a wooden wedge to show me, getting the angle right.)\n\nFill it first and level it after, and it's too late — too heavy to touch. Level it while the water's shallow.",
        { proficiency: { category: 'crafting', xp: 22 }, affinity: 0.04 }),
    ],
    completeReply: {
      empty: [
        '…그 말 오래 기다렸어요. (수조용 여과기를 하나 준다. 조용한 것이다.)\n\n다들 채우려고만 해요. 빈 걸 보고 좋다고 하는 사람은 드물어요. 나중에 뭘 넣어도, 오늘 본 빈 수조는 잊지 마요.',
        "…I've waited a long time to hear that. (She gives me a filter. A quiet one.)\n\nEveryone only ever wants to fill things. Hardly anyone looks at something empty and calls it good. Whatever you put in later, don't forget the empty tank you saw today.",
      ],
      lesson: [
        '달라요. 팔 게 아니니까 천천히요. (수조 관리가 손에 붙는다.)\n\n물은 한 번에 다 갈지 말고 조금씩 바꿔요. 한꺼번에 바꾸면 물고기가 놀라요. 활어 수조는 며칠 버티면 되지만, 이건 몇 년을 봐야 하니까요.',
        "It is. You aren't selling them, so take it slow. (Tank keeping settles into my hands.)\n\nDon't change all the water at once. Swap a little at a time. Change it all in one go and the fish get a shock. A live tank only has to last a few days. This one you'll be looking at for years.",
      ],
      pay: [
        '아니요. 제가 봤잖아요, 빈 수조를. 그게 값이에요. (오히려 수초 한 줌을 준다.)\n\n수초는 급할 거 없어요. 넣고 싶을 때 넣어요. 빈 수조도 좋고, 풀만 있는 수조도 좋아요.',
        "No. I got to see an empty tank. That's the payment. (She gives me a handful of plants instead.)\n\nNo hurry with the plants. Put them in when you feel like it. An empty tank is good. A tank with only plants is good too.",
      ],
    },
  },

  // ── N22-6 「광맥」 · 하늬 ──
  'N22-6': {
    offer: [
      d('half_half', '반반이면 공평하네요. 뭐가 나오든 들고 올게요.', "Half and half sounds fair. Whatever turns up, I'll bring it back.",
        '공평하죠. 캐는 건 당신 손이고, 쓸 데를 아는 건 제 눈이니까요. (빈 자루 두 개를 나란히 접어 놓는다.)\n\n폐채석장은 바닥이 고르지 않아요. 발밑 보고 다녀요. 다치면 반반이 아니라 전부 손해예요.',
        "It's fair. The digging's your hands; knowing what it's good for is my eye. (She folds two empty sacks and lays them side by side.)\n\nThe ground in an old quarry is uneven. Watch your footing. Get hurt and it isn't half and half anymore — it's all loss.",
        { affinity: 0.05 }),
      d('ask_rumor', '뭐가 남았다는 거예요? 누가 그래요?', "Something's left there? Says who?",
        '공방 손님들이요. 거기서 봉돌감을 캐 왔다는 사람도 있고, 아무것도 없었다는 사람도 있어요. (턱을 괴고 고개를 갸웃한다.)\n\n그러니까 가 봐야 알아요. 소문은 반만 믿어요. 나머지 반은 손으로 확인하고요.',
        "Workshop customers. One says they dug sinker stone there, another says there was nothing. (She props her chin on her hand and tilts her head.)\n\nSo you won't know till you go. Believe half of any rumour. Check the other half with your hands.",
        { affinity: 0.03, flag: 'choice.n22_6_asked_rumor' }),
      d('vein_joke', '광맥이면 금이라도 나오는 거 아니에요?', "A seam? Could there be gold in there?",
        '금이 나오면 반반 말고 칠 대 삼으로 해요. 제가 칠이요. (태연하게 말하고는 웃음을 참는다.)\n\n폐채석장이에요. 쓸 만한 건 다 캐 가고 남은 데요. 그래도 남은 데에 남은 게 있어요. 그거 찾으러 가는 거예요.',
        "If there's gold, it's seventy-thirty, not half and half. Seventy to me. (She says it with a straight face, then fights back a grin.)\n\nIt's an abandoned quarry. Everything worth taking's been taken. But leftover places still have something left. That's what you're going for.",
        { affinity: 0.02, flag: 'choice.n22_6_gold_joke' }),
      d('ask_safety', '폐채석장이면 무너질 데도 있지 않아요?', "An abandoned quarry — won't parts of it be ready to collapse?",
        '있어요. 그래서 깎인 벽 밑으로는 가지 마요. 위에서 돌이 떨어져요. (손바닥을 세웠다가 툭 떨어뜨려 보인다.)\n\n캐는 건 평평한 데서만요. 주변부터 세 번 훑어보고, 그다음에 캐요. 순서가 거꾸로면 위험해요.',
        "There will. So don't go under the cut faces. Stones come down from above. (She holds her palm upright, then lets it drop.)\n\nOnly dig where it's flat. Look around the area three times first, then dig. Do it the other way round and it gets dangerous.",
        { affinity: 0.04, flag: 'choice.n22_6_asked_safety' }),
    ],
    completeAdd: [
      d('split_value', '반반은 무게로 나눠요, 값으로 나눠요?', "Half and half — by weight, or by value?",
        '좋은 질문이에요. 값으로요. 무게로 나누면 쓸모없는 돌을 많이 든 쪽이 이겨요. (캔 것을 두 무더기로 갈라 놓고, 한쪽에서 하나를 옮긴다.)\n\n그래서 먼저 쓸 것과 못 쓸 것을 가르고, 쓸 것만 반으로 나눠요. 나누기 전에 고르는 게 진짜 셈이에요.',
        "Good question. By value. Split by weight and whoever's holding the most useless rock wins. (She divides the haul into two piles, then moves one piece across.)\n\nSo first you sort usable from useless, then halve only the usable. Sorting before splitting — that's real arithmetic.",
        { proficiency: { category: 'economy', xp: 22 }, affinity: 0.04 }),
    ],
    completeReply: {
      lesson: [
        '색이에요. 회색 말고 검은 회색. (광질 감각이 생긴다.)\n\n검은 회색은 무거워요. 같은 크기면 손에서 먼저 티가 나요. 눈으로 고르고, 손으로 한 번 더 달아 봐요.',
        "It's the colour. Not grey — black-grey. (A feel for mining appears.)\n\nBlack-grey is heavy. Same size, and your hand notices first. Pick with your eyes, then weigh it once more in your hand.",
      ],
      pay: [
        '살게요. 재료값. (공방 장부에 두 번째 매입.)\n\n캔 걸 파는 사람은 많아요. 반반 약속을 지키고 나서 파는 사람은 드물고요. 장부에 그렇게 적어 둘게요.',
        "I'll buy it. Materials. (The ledger's second purchase.)\n\nLots of people sell what they dig. Few keep a half-and-half promise first and then sell. I'll note that in the ledger.",
      ],
      decline: [
        '…그렇게 말하니까 광맥 같네요. (공방 재료 선반 두 칸이 내 것이 됐다.)\n\n광맥은 돌 속에만 있는 게 아니에요. 같이 캐러 갈 사람이 있으면 그게 광맥이에요. 다음에 또 소문이 들리면 먼저 말할게요.',
        "…Said like that, it sounds like a seam. (Two slots on the materials shelf become mine.)\n\nA seam isn't only something inside rock. Having someone to go digging with — that's a seam too. Next time I hear a rumour, you'll hear it first.",
      ],
    },
  },

  // ── N22-7 「씨앗」 · 하늬 ──
  'N22-7': {
    offer: [
      d('take_seeds', '뭐가 나올지 모르는 씨앗이라니, 오히려 좋네요. 받을게요.', "Seeds that could turn into anything — I like that. I'll take them.",
        '좋죠? 봉투에 이름이 없으면 기다리는 게 재밌어져요. (씨앗 봉투를 내 손바닥에 올려 준다.)\n\n심을 데는 알아서요. 손이 자주 가는 땅이면 더 좋고요. 싹이 나면 제일 먼저 보여 줘요.',
        "Nice, isn't it? When the packet has no name, the waiting gets fun. (She sets the seed packet on my palm.)\n\nWhere to plant is up to you. Somewhere you tend often is better. When something sprouts, show me first.",
        { affinity: 0.05 }),
      d('ask_where', '이 씨앗, 어디서 난 거예요? 정말 뭔지 모르세요?', "Where are these seeds from? You really don't know what they are?",
        '몰라요. 정말로요. 봉투에 아무것도 안 적혀 있어요. (봉투를 뒤집어 빈 뒷면을 보여 준다.)\n\n모르는 걸 심어 보는 것도 배우는 거예요. 아는 걸 심으면 맞히는 거고, 모르는 걸 심으면 기다리는 거예요. 두 칸만 심어 봐요.',
        "I don't. Honestly. There's nothing written on the packet. (She turns it over to show the blank back.)\n\nPlanting something you don't know is learning too. Plant what you know and you're guessing right. Plant what you don't and you're waiting. Just plant two plots.",
        { affinity: 0.04, flag: 'choice.n22_7_asked_seeds' }),
      d('worry', '제가 키우다 말려 죽이면 어떡해요? 귀한 씨앗 같은데요.', "What if I let them die? They seem precious.",
        '그럼 말라 죽은 걸 들고 와요. 그것도 배운 거예요. (대수롭지 않다는 듯 웃는다.)\n\n두 칸 심을 만큼은 들어 있어요. 하나가 안 되면 하나는 돼요. 씨앗은 사람보다 덜 겁내요.',
        "Then bring me the dried-up ones. That's learning too. (She laughs as if it's no big deal.)\n\nThere's enough in there for two plots. If one fails, the other won't. Seeds are less scared than people.",
        { affinity: 0.03 }),
      d('weed_joke', '이름 없는 씨앗이라… 혹시 잡초 씨 아니에요?', "Seeds with no name… They're not weed seeds, are they?",
        '잡초는 봉투에 안 넣어요. 알아서 나니까요. (봉투를 흔들어 사락사락 소리를 들려준다.)\n\n잡초면 잡초 수확이죠. 그래도 가져와요. 뭐가 나왔는지 보는 게 약속이니까요.',
        "Nobody puts weeds in a packet. They come up on their own. (She shakes the packet so I can hear it rustle.)\n\nIf it's weeds, it's a weed harvest. Bring it anyway. Seeing what came up is the promise.",
        { affinity: 0.02, flag: 'choice.n22_7_weed_joke' }),
    ],
    completeAdd: [
      d('sprout_tip', '싹이 날 때까지 제가 할 수 있는 게 있어요?', "Until they sprout, is there anything I can actually do?",
        '흙을 마르지 않게만 해요. 씨앗은 물이 있어야 껍질을 깨요. 대신 고이면 썩어요. (손을 오므려 물을 살짝 뿌리는 시늉을 한다.)\n\n그리고 매일 들여다보지 마요. 흙을 파 보고 싶어지거든요. 파 보면 끝이에요.',
        "Just keep the soil from drying out. A seed needs water to crack its coat. But let the water pool and it rots. (She cups her hand and mimes a light sprinkle.)\n\nAnd don't check on them every day. You'll want to dig one up to look. Dig one up and that's the end of it.",
        { proficiency: { category: 'farming', xp: 28 }, affinity: 0.05 }),
    ],
    completeReply: {
      promise: [
        '…그 말이 수확이에요. (공방 열쇠를 하나 준다. 언제든 오라고.)\n\n씨앗은 안 나올 수도 있어요. 그래도 오겠다는 사람은 나와요. 문 앞에요. 열쇠는 그래서 드린 거예요.',
        "…That sentence is the harvest. (She gives me a workshop key. Come any time.)\n\nThe seeds might not come up. But someone who says they'll come does turn up. Right at the door. That's why I gave you the key.",
      ],
      lesson: [
        '그게 농사예요. 바다랑 같아요. 뭐가 물지 모르고 던지죠. (농사 감각이 한 단계 오른다.)\n\n던지고 나서 할 수 있는 건 기다리는 거랑 물 주는 거예요. 싹이 나면 그때 이름을 알아 가요. 이름은 나중이에요.',
        "That's farming. Same as the sea. You cast without knowing what will take it. (My feel for farming rises a step.)\n\nOnce you've cast, all you can do is wait and water. When it sprouts, you get to know its name. Names come later.",
      ],
      pay: [
        '아니요. 수확으로요. 안 나오면 안 받고요. (돈을 안 받는다. 대신 화분을 하나 준다.)\n\n돈으로 받으면 씨앗이 물건이 돼요. 수확으로 받으면 약속이 되고요. 저는 약속이 더 좋아요.',
        "No. Pay me in harvest. And nothing if nothing comes. (She won't take money. She gives me a pot instead.)\n\nTake money for them and the seeds become goods. Take a harvest and they become a promise. I like promises better.",
      ],
    },
  },

  // ── N22-8 「집」 · 하늬 ──
  'N22-8': {
    offer: [
      d('housewarming', '집들이라니, 생각만 해도 좋네요. 마무리부터 할게요.', "A housewarming — I like the sound of that. I'll finish the place first.",
        '좋아요. 세간 다섯 점, 전부 손으로 만들어요. 자기가 만든 게 있어야 집이 자기 거 같아요. (손가락을 하나씩 접으며 센다.)\n\n뭘 만들지는 당신이 정해요. 대신 조행록 놓을 데는 꼭이요. 저는 그날 빈손으로 안 갈게요.',
        "Good. Five furnishings, all made by hand. A house only feels like yours once there's something in it you made. (She counts them off on her fingers.)\n\nWhat you make is up to you. But somewhere to keep your fishing log is a must. And I won't turn up empty-handed.",
        { affinity: 0.05 }),
      d('ask_everyone', '다들 부르라니, 누구까지 불러야 해요?', "Call everyone? How far does everyone go?",
        '고마운 사람이요. 처음 왔을 때부터 세어 봐요. 밥 한 끼 얻어먹은 사람, 일 하나 맡겨 준 사람. (손가락이 모자라다는 듯 웃는다.)\n\n다 못 와도 돼요. 부르는 게 중요해요. 불렀다는 걸 사람들은 오래 기억해요. 그러니까 집부터 마무리해요.',
        "The people you're grateful to. Count from the day you arrived. Anyone who fed you a meal, anyone who trusted you with a job. (She laughs as if she's run out of fingers.)\n\nThey won't all make it. The asking is what matters. People remember for a long time that they were asked. So finish the house first.",
        { affinity: 0.05, flag: 'choice.n22_8_asked_guests' }),
      d('nervous_host', '손님을 불러 본 적이 없어서요. 뭘 대접해야 할지…', "I've never had guests over. I don't know what to serve…",
        '잡은 거 구우면 돼요. 바닷가 집들이에 그만한 게 어디 있어요. (작업대에 기대 팔짱을 낀다.)\n\n집들이는 손님이 집을 보러 오는 거예요. 상을 보러 오는 게 아니라요. 앉을 데만 넉넉하게 만들어 둬요.',
        "Grill what you caught. What could beat that at a seaside housewarming? (She leans on the bench and folds her arms.)\n\nGuests come to see the house, not the table. Just make sure there are plenty of places to sit.",
        { affinity: 0.03 }),
      d('room_only', '집이라기엔 아직 방 한 칸뿐인데요?', "Calling it a house is generous. It's still one room.",
        '방 한 칸이어도 돌아오고 싶으면 집이에요. 큰 데 살아도 돌아가기 싫으면 숙소고요. (내 쪽을 보며 고개를 갸웃한다.)\n\n지금 그 방, 돌아가고 싶어요? 그럼 집이에요. 마무리만 하면 돼요.',
        "One room's a house if you want to come back to it. Live somewhere huge and dread going back, and it's just lodgings. (She tilts her head at me.)\n\nThat room of yours — do you want to go back to it? Then it's a house. It just needs finishing.",
        { affinity: 0.02, flag: 'choice.n22_8_one_room' }),
    ],
    completeAdd: [
      d('chair_legs', '의자 다리 네 개 길이 맞추는 게 제일 어려웠어요.', "Getting four chair legs the same length was the hardest part.",
        '다들 거기서 막혀요. 하나씩 맞추면 끝이 없어요. 네 개를 한데 묶어서 같이 깎아요. (손으로 다리 네 개를 한 다발로 쥐는 시늉을 한다.)\n\n그리고 바닥을 믿지 마요. 방바닥은 생각보다 기울어 있어요. 마지막 손질은 그 방 바닥에 맞춰서 해요.',
        "Everyone gets stuck there. Fit them one at a time and you'll never finish. Bind all four together and cut them as one. (She mimes gripping four legs in a single bundle.)\n\nAnd don't trust the floor. A floor slopes more than you'd think. Do the final trim to fit the floor of that room.",
        { proficiency: { category: 'crafting', xp: 30 }, affinity: 0.04 }),
    ],
    completeReply: {
      lesson: [
        '의자부터요. 앉을 데가 있어야 집이에요. (생활 감각이 마지막으로 오른다.)\n\n그다음이 불이고, 그다음이 물건 둘 데예요. 순서는 사람마다 달라도 의자는 늘 처음이에요. 다음 사람한테도 그렇게 말해 줘요.',
        "Chairs first. It isn't a home until there's somewhere to sit. (My feel for living rises, last of all.)\n\nAfter that comes a fire, then somewhere to put things. The order varies from person to person, but the chair always comes first. Tell the next person the same.",
      ],
      pay: [
        '받으세요. 예의는 다음에. (선물이 쌓인다. 대부분 먹을 것이다.)\n\n집들이 선물은 갚으라고 주는 게 아니에요. 다음에 그 사람 집에 갈 이유를 주는 거예요. 그러니까 다 받아요.',
        "Accept them. Manners next time. (The gifts pile up. Mostly food.)\n\nHousewarming gifts aren't meant to be repaid. They give you a reason to visit that person's place next time. So take them all.",
      ],
    },
  },
};
