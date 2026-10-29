/**
 * @file StoryProgressAsk2.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) — 하늬 · 남궁현 · 석독구 · 오세라 편.
 *
 * 말투:
 *  - 하늬 — 해요체 · 짧고 다정하다(「거친 게 정상이에요」). 주인공도 해요체.
 *  - 남궁현 — 짧은 반말(「~나?」 · 「규정대로」). 주인공은 합니다체.
 *  - 석독구 — 열두 살 반말 · 으스댄다. 주인공은 다른 자리처럼 해라체(「알았다」 · 「올렸다」)로 받는다.
 *  - 오세라 — 해요체 · 말수가 적다. 주인공은 합니다체.
 */
import { pa } from './StoryProgressAskKit.js';
import type { ProgressAskDef } from '../types/Story.js';

export const PROGRESS_ASKS_2: Record<string, ProgressAskDef[]> = {
  // ── 하늬 ──
  'N22-1': [
    pa(['도면 보고 하나 만들어 봤어요?', 'Have you made something from a plan yet?'],
      ['…아직 뭘 만들지 고르는 중이에요.', "...I'm still choosing what to make."],
      ['처음엔 쉬운 걸로 골라요. 망쳐도 안 아까운 걸로요. 망치는 것도 배우는 거예요.',
        "Start with something easy — something you won't mind ruining. Ruining things is part of learning too."]),   // 0 — 도면으로 하나 만든다
    pa(['만든 거, 가져왔어요?', 'Did you bring what you made?'],
      ['…조금만 더 다듬어서 가져올게요.', "...I'll bring it once I've smoothed it a little more."],
      ['다듬지 말고 그대로 가져와요. 거친 게 정상이에요. 어디서 거칠어졌는지 같이 봐요.',
        "Don't smooth it — bring it as it is. Rough is normal. We'll look together at where it went rough."]),   // 1 — 만든 걸 보여 준다
  ],
  'N22-2': [
    pa(['방에 둘 거, 하나 만들었어요?', 'Have you made something for your room?'],
      ['…아직요. 뭘 둘지부터 고민이에요.', "...Not yet. I'm still deciding what it should be."],
      ['방에서 제일 오래 있는 자리를 떠올려 봐요. 거기 둘 걸 만들면 돼요. 앉는 거든 올려 두는 거든요.',
        'Think of the spot where you spend the most time, and make something for there. Something to sit on, or to set things on.']),   // 0 — 방에 둘 것을 만든다
    pa(['방에 가구는 하나 놓아 봤어요?', 'Have you put a piece of furniture in your room?'],
      ['…아직 어디에 놓을지 보고 있어요.', "...I'm still working out where it goes."],
      ['하나면 돼요. 많이 놓으면 창고예요. 빛이 닿는 데에 앉을 걸 두면 방이 덜 답답해요.',
        "One is enough — put in many and it's a storeroom. Put something to sit on where the light reaches, and the room feels less cramped."]),   // 1 — 가구를 하나 배치한다
    pa(['방, 이제 보여 줄 수 있어요?', 'Can you show me the room now?'],
      ['…방이 아직 어수선해요. 다음에 보여 드릴게요.', "...It's still a bit of a mess. I'll show you next time."],
      ['치우지 말고 사는 그대로 보여 줘요. 그래야 그 방에 뭐가 필요한지 보여요.',
        "Don't tidy up — show me how you really live in it. That's how I can see what the room needs."]),   // 2 — 방을 보여 준다
  ],
  'N22-3': [
    pa(['봉돌로 쓸 돌, 갯가에서 골라 왔어요?', 'Have you picked sinker stones off the shore?'],
      ['…아직 다 고르지 못했어요.', "...I haven't picked them all yet."],
      ['손에 쏙 들어오고 한쪽으로 안 쏠리는 걸로 골라요. 바닷가 돌은 파도가 몇 년을 굴린 거니까 필요한 만큼만이요.',
        "Pick ones that sit snug in your hand and don't lean to one side. The waves took years to roll those stones, so only take what you need."]),   // 0 — 갯가에서 봉돌 돌 줍기
    pa(['채석 자리에서는 캐 봤어요?', 'Have you dug any at the quarry seam?'],
      ['…아직 채석 자리까지 못 갔어요.', "...I haven't made it to the quarry yet."],
      ['많이 캘 필요 없어요. 무게가 맞는 게 중요해요. 눈으로 보지 말고 손에 들어서 달아 봐요.',
        "You don't need much. What matters is the weight. Don't go by eye — weigh them in your hand."]),   // 1 — 채석 자리에서 캔다
    pa(['고른 돌, 지금 한번 볼까요?', 'Shall I take a look at the stones you picked?'],
      ['…조금 더 골라 보고 가져올게요.', "...I'll sort through a few more and bring them."],
      ['다 좋은 돌일 필요는 없어요. 되는 거랑 안 되는 거, 손에 들어 보면 알아요. 그건 같이 가려요.',
        "They don't all have to be good. Which ones work and which don't, you can tell by holding them. We'll sort them together."]),   // 2 — 고른 돌을 본다
  ],
  'N22-4': [
    pa(['밑밥 재료는 직접 모아 봤어요?', 'Have you gathered your own chum ingredients?'],
      ['…아직 다 모으지 못했어요.', "...I haven't gathered enough yet."],
      ['사 오는 것만큼 많을 필요 없어요. 조금씩 여러 번 모아요. 한 번에 다 걷으면 다음엔 없어요.',
        "You don't need as much as you'd buy. Gather a little at a time, over several goes. Strip it all at once and there's none next time."]),   // 0 — 밑밥 재료 모으기
    pa(['텃밭에 한 이랑, 심었어요?', 'Have you planted your furrow?'],
      ['…아직 이랑을 다 채우지 못했어요.', "...I haven't filled the furrow yet."],
      ['심을 때 간격만 지켜요. 붙여 심으면 서로 먹어요. 물은 아침에 주고요.',
        'Just keep the spacing when you plant — crowd them and they starve each other. And water in the morning.']),   // 1 — 한 이랑(4칸) 심기
    pa(['심은 거, 지금 같이 확인해 볼까요?', 'Shall we check what you planted now?'],
      ['…밭을 한 번 더 둘러보고 말씀드릴게요.', "...I'll walk the plot once more, then tell you."],
      ['흙 겉이 마르면 물을 주고, 젖어 있으면 하루 쉬어요. 바다에 나가기 전에 한 번 보는 버릇을 들여요.',
        "If the topsoil's dry, water it; if it's damp, give it a day. Make a habit of checking before you head out to sea."]),   // 2 — 심은 것을 확인한다
  ],
  'N22-5': [
    pa(['수조 받침은 만들었어요?', 'Have you made the stand for the tank?'],
      ['…아직 받침을 못 짰어요.', "...I haven't built the stand yet."],
      ['물이 든 수조는 생각보다 무거워요. 받침이 기울면 물이 먼저 알아요. 다리 길이부터 잘 맞춰요.',
        "A tank full of water is heavier than you'd think. If the stand leans, the water knows first. Get the legs even before anything else."]),   // 0 — 수조 받침
    pa(['수조에 넣어 둘 한 마리는 구했어요?', 'Have you found one to keep in the tank?'],
      ['…아직 마음에 드는 녀석을 못 만났어요.', "...I haven't met the right one yet."],
      ['큰 놈은 수조가 좁아서 금방 지쳐요. 작고 오래 사는 놈이 좋아요. 서두를 거 없어요.',
        "A big one tires quickly in a small tank. Small and long-lived is better. There's no hurry."]),   // 1 — 넣어 둘 한 마리
    pa(['수조는 창가에 놓았어요?', 'Have you set the tank by the window?'],
      ['…아직 창가 어디에 둘지 못 정했어요.', "...I haven't decided where by the window yet."],
      ['해가 바로 들면 이끼가 끼고 물이 더워져요. 창가 중에서도 해가 비껴 드는 데에 놓아요.',
        'Direct sun brings algae and warms the water. Pick a spot by the window where the light comes in at a slant.']),   // 2 — 집에 수조를 놓는다
    pa(['뭘 넣을지는 정했어요?', 'Have you decided what goes in it?'],
      ['…아직요. 조금 더 비워 두고 볼게요.', "...Not yet. I'd like to leave it empty a little longer."],
      ['그래도 돼요. 뭘 넣을지는 천천히요. 정해지면 그때 넣어요.',
        "That's fine. Take your time deciding. Put something in once you know."]),   // 3 — 무엇을 넣을지 정한다
  ],
  'N22-6': [
    pa(['폐채석장 주변은 훑어봤어요?', 'Have you combed around the old quarry?'],
      ['…아직 다 둘러보지 못했어요.', "...I haven't covered it all yet."],
      ['캐기 전에 주변부터 훑어요. 폐채석장은 바닥이 고르지 않으니까 발밑 보고 다니고요.',
        'Comb the area before you dig. The ground at the old quarry is uneven, so watch your feet.']),   // 0 — 폐채석장 주변 채집
    pa(['폐채석장에서 뭐 좀 캤어요?', 'Did you dig anything up at the old quarry?'],
      ['…아직 손도 못 댔어요.', "...I haven't even started."],
      ['깎인 벽 밑으로는 가지 마요. 위에서 돌이 떨어져요. 캐는 건 평평한 데서만 하고, 무거우면 반만 들고 와요.',
        "Stay out from under the cut faces — stones fall from above. Only dig where it's flat, and if it's heavy, just bring half."]),   // 1 — 광물을 캔다
    pa(['캔 거, 지금 반반 나눌까요?', 'Shall we split what you dug up now?'],
      ['…조금 더 캐 보고 나눌게요.', "...I'll dig a bit more first, then we'll split it."],
      ['캔 건 골라내지 말고 다 들고 와요. 캐는 건 당신 손이고, 쓸 데를 아는 건 제 눈이니까요.',
        "Don't sort it yourself — bring everything. Your hands do the digging; my eyes know what it's good for."]),   // 2 — 캔 것을 나눈다
  ],
  'N22-7': [
    pa(['씨앗 심을 자리는 찾아봤어요?', 'Have you looked for somewhere to plant the seeds?'],
      ['…아직 마땅한 데를 못 찾았어요.', "...I haven't found a good spot yet."],
      ['손이 자주 가는 땅이면 좋아요. 매일 지나다니는 데라야 물 주는 것도 안 잊거든요.',
        "Ground you're often near is best. If you pass it every day, you won't forget to water it."]),   // 0 — 심을 자리 훑기
    pa(['씨앗은 텃밭에 심었어요?', 'Have you planted the seeds in the plot?'],
      ['…아직 흙에 넣지 못했어요.', "...I haven't got them in the ground yet."],
      ['흙이 마르지 않게만 해요. 대신 물이 고이면 썩어요. 싹이 안 보여도 파 보지는 마요.',
        "Just keep the soil from drying out — but don't let water pool, or they'll rot. Even if nothing shows, don't dig them up to look."]),   // 1 — 씨앗 두 칸 심기
    pa(['뭐가 나오든 가져온다고, 약속할 수 있어요?', 'Can you promise to bring me whatever comes up?'],
      ['…씨앗을 다 심고 나서 약속드릴게요.', "...I'll promise once the seeds are all in."],
      ['안 나와도 와요. 그것도 약속이에요. 빈손이어도 괜찮아요.',
        "Come even if nothing comes up — that's part of the promise. Empty-handed is fine."]),   // 2 — 수확을 약속한다
  ],
  'N22-8': [
    pa(['집에 둘 세간은 다 만들었어요?', 'Have you made all the furnishings for the house?'],
      ['…아직 다 갖추지 못했어요.', "...I haven't got them all together yet."],
      ['뭘 만들지는 당신이 정해요. 대신 조행록 놓을 선반은 꼭이요. 앉을 데도 넉넉하게 만들어 두고요.',
        'What you make is up to you. But a shelf for your log, without fail. And make plenty of places to sit.']),   // 0 — 세간 다섯 점
    pa(['집 마무리는 다 했어요?', 'Have you finished the house?'],
      ['…아직 자리를 다 잡지 못했어요.', "...I haven't got everything in place yet."],
      ['놓을 자리에 먼저 두고 마지막 손질을 해요. 방바닥은 생각보다 기울어 있거든요.',
        "Set each piece where it goes first, then do the final trimming there. Floors are more crooked than you'd think."]),   // 1 — 집을 마무리한다
    pa(['집들이는 언제 해요?', "So when's the housewarming?"],
      ['…다들 부르고 나서 하려고요.', "...Once I've invited everyone."],
      ['고마운 사람부터 세어 봐요. 다 못 와도 돼요. 불렀다는 걸 사람들은 오래 기억해요.',
        "Start counting from the people you're grateful to. It's fine if not everyone can come. People remember being invited for a long time."]),   // 2 — 집들이
  ],

  // ── 남궁현 ──
  'M5-06': [
    pa(['세 마리, 계측대에 다 올렸나?', 'All three on the board yet?'],
      ['…아직 기준에 맞는 고기를 다 못 채웠습니다.', "...I haven't got enough that make the standard yet."],
      ['올리기 전에 네 자로 먼저 재. 모자라면 놔. 계측대는 확인하는 데지 재 보는 데가 아니야.',
        "Measure with your own rule before you bring it. If it's short, let it go. The board's for confirming, not for trying."]),   // 0 — 예선 세 마리
  ],
  'M5-08': [
    pa(['80 넘는 방어, 올렸나?', 'Landed a yellowtail over eighty?'],
      ['…아직 그만한 놈은 못 걸었습니다.', "...I haven't hooked one that size yet."],
      ['80짜리는 바닥으로 박지 않고 옆으로 짼다. 드랙은 처음에 믿고 끝에 의심해. 뜰채에 들어오기 전까진 네 고기가 아니야.',
        "An eighty doesn't dive — it tears off sideways. Trust the drag early, doubt it late. It isn't your fish till it's in the net."]),   // 0 — 방어 80cm 이상
  ],
  'N10-1': [
    pa(['새벽 부두에서 한 마리라도 했나?', 'Get anything off the pier at dawn?'],
      ['…아직 새벽 부두에선 못 올렸습니다.', "...I haven't landed anything there at dawn yet."],
      ['새벽 물 들어올 때가 제일 낫다. 그 시간 부두엔 사람이 없어. 조용히 던지고 조용히 와.',
        "Best when the dawn tide comes in. Nobody's on the pier at that hour. Cast quietly, come back quietly."]),   // 0 — 새벽에 그를 따라 1마리
    pa(['오늘 밤 근무, 들어올 건가?', "You coming in for tonight's shift?"],
      ['…오늘 밤은 어렵습니다. 다음에 들어오겠습니다.', "...Tonight's difficult. I'll come in another night."],
      ['들어오면 문 쪽 상자부터다. 릴은 릴끼리, 줄은 호수끼리. 장갑은 챙겨 와.',
        'When you do, we start with the boxes by the door. Reels with reels, line by gauge. Bring gloves.']),   // 1 — 창고 야간 근무
  ],
  'N10-2': [
    pa(['규정대로 재고 놓아 봤나?', 'Measured any by the rules and let them go?'],
      ['…아직 손에 익을 만큼 해 보지 못했습니다.', '...Not enough times for it to feel natural yet.'],
      ['눈금은 옆에서 보지 말고 바로 위에서 내려다봐. 옆에서 보면 몇 밀리가 달라져. 재고 나면 오래 붙잡지 말고 놔.',
        "Read the marks from straight above, not from the side — from the side you're off by millimetres. Once it's measured, don't hang on to it. Let it go."]),   // 0 — 규정대로 계측 · 방생
    pa(['증언대에 설 준비는 됐나?', 'Ready to take the stand?'],
      ['…생각을 조금만 더 정리하고 서겠습니다.', '...Let me gather my thoughts a little more first.'],
      ['정리할 거 없어. 네가 본 길이, 네가 본 자. 그 둘만 말하고 나머지는 대답하지 마.',
        'Nothing to gather. The length you saw, the rule you saw. Say those two and answer nothing else.']),   // 1 — 규정대로 증언
  ],
  'N10-3': [
    pa(['시범 세 마리, 다 채웠나?', 'Got your three for the demonstration?'],
      ['…아직 다 채우지 못했습니다.', "...I haven't filled them yet."],
      ['시범은 참가자들이 보는 거야. 크기보다 규정대로 올리는 걸 보여 줘. 그게 네 대회 얼굴이다.',
        'The entrants are watching the demonstration. Show them it done by the rules — size comes second. That is the face of your tournament.']),   // 0 — 대회 시범 3마리
    pa(['규정은 다 정했나?', 'Rules all set?'],
      ['…아직 몇 줄 더 다듬고 있습니다.', "...I'm still polishing a few lines."],
      ['한 장이면 돼. 무엇을 재는지, 어떻게 재는지, 이의는 누구한테 하는지. 그 셋이면 대회가 선다.',
        'One page is enough. What you measure, how you measure, who hears appeals. With those three, a tournament stands.']),   // 1 — 심판을 부탁한다
  ],
  'N10-4': [
    pa(['포항 부두는 다시 둘러봤나?', 'Taken another walk round the Pohang pier?'],
      ['…아직 다시 둘러보지 못했습니다.', "...I haven't been back round it yet."],
      ['마지막 근무 전에 한 번 걸어 봐. 새벽 물 들어올 때 설 자리를 미리 봐 둬.',
        "Walk it once before the last shift. Pick out where you'll stand when the dawn tide comes in."]),   // 0 — 포항으로 돌아간다
    pa(['옆에서 한 마리, 올렸나?', 'Landed one alongside me yet?'],
      ['…아직 못 올렸습니다. 제 캐스팅은 자꾸 소리가 납니다.', '...Not yet. My cast keeps making noise.'],
      ['소리 나도 돼. 고기는 소리보다 그림자를 더 무서워해. 불을 앞에 두고 서서 던져.',
        'Noise is fine. Fish fear shadows more than sound. Stand with the light in front of you and cast.']),   // 1 — 전설과 나란히 1마리
  ],

  // ── 석독구 ──
  'M7-03': [
    pa(['사진 찍을 준비 다 됐어. 돌돔은 아직이야?', "I'm all set for the photo. Still no beakperch?"],
      ['…아직 못 올렸다. 돌돔은 역시 쉽지 않다.', "...Not yet. Beakperch really don't come easy."],
      ['돌돔은 여름이랑 가을에 독도 갯바위 밑에 있어. 이빨이 세서 미끼를 다 갉아 먹으니까 빨리 챔질해야 해.',
        "In summer and autumn they're under the rocks at Dokdo. Their teeth are strong and they strip your bait, so strike fast."]),   // 0 — 독도 돌돔 계측 · 방류
  ],
  'N16-1': [
    pa(['나는 벌써 셋 다 채웠는데, 아직이야?', "I've already got my three. You're still going?"],
      ['…아직이다. 미끼부터 다시 찾아봐야겠다.', "...Still going. I'd better find bait again first."],
      ['사 온 미끼 쓰면 반칙이야. 힌트는 하나만 줄게. 갯바위에 다 있어. 더 알려 주면 내가 지잖아.',
        "Shop bait is cheating. One hint, that's all: it's all on the rocks. Any more and I'd lose."]),   // 0 — 청볼락 3마리
  ],
  'N16-2': [
    pa(['등대 밑에서 한 마리 해 봤어?', 'Caught one below the lighthouse yet?'],
      ['…아직 등대 밑에선 못 던져 봤다.', "...I haven't cast down there yet."],
      ['등대 밑은 물이 돌아. 채비가 무거우면 바닥에 박히니까 가볍게 해.',
        'The water swirls under the lighthouse. A heavy rig digs into the bottom, so go light.']),   // 0 — 등대 밑에서 1마리
    pa(['편지, 할아버지한테 갖다 줬어?', 'Did you give Grandpa the letter?'],
      ['…아직 할아버지는 못 뵈었다.', "...I haven't seen your grandfather yet."],
      ['등대까지 걸어서 가야 돼. 배 없어. 오르막이 기니까 물 챙기고, 접은 데는 펴지 마.',
        "You have to walk up to the lighthouse — there's no boat. The climb's long, so take water. And don't unfold it."]),   // 1 — 편지를 전한다(석대양)
  ],
  'N16-3': [
    pa(['내 자 들고 기다리는데, 돌돔 언제 올라와?', "I'm standing here with my rule. When's the beakperch coming up?"],
      ['…아직 입질이 없다.', '...No bites yet.'],
      ['자 대기 전에 손부터 적셔. 마른 손으로 만지면 돌돔이 아파. 재고 나면 바로 놔.',
        "Wet your hands before the rule goes on — dry hands hurt the fish. Once it's measured, let it go straight away."]),   // 0 — 돌돔 계측 후 방류
  ],
  'N16-4': [
    pa(['내 제자랑 같이 재고 놓는 거, 아직이야?', 'Measuring and releasing with my apprentice — not done yet?'],
      ['…아직이다. 선생님 수업이 꽤 길다.', "...Not yet. Teacher's lessons run long."],
      ['길어도 돼. 고기보다 미끄러운 데가 먼저야. 젖은 데는 안 딛고, 물 들어오면 먼저 나오는 거야. 옆에서 보기만 해.',
        "Long's fine. Slippery spots come before fish. Don't step on the wet bits, and get out first when the water comes in. You just watch."]),   // 0 — 독구와 2마리 계측 · 방류
  ],

  // ── 오세라 ──
  'M6-01': [
    pa(['섬은 좀 둘러봤어요?', 'Have you had a look around the island?'],
      ['…아직 제대로 둘러보지 못했습니다.', "...I haven't really looked around yet."],
      ['바람 부는 날은 배가 다 묶여요. 오늘은 어차피 못 나가니까 천천히 돌아봐요. 불 켜진 데는 여기뿐이에요.',
        "On windy days every boat's tied up. You can't leave today anyway, so take your time. This is the only place with the lights on."]),   // 0 — 울릉도에 도착한다
    pa(['난로 켜 둘게요. 오늘 밤, 여기서 버틸 거죠?', "I'll keep the stove on. You're riding out the night here, right?"],
      ['…짐을 좀 챙기고 다시 오겠습니다.', "...Let me get my things and I'll come back."],
      ['난로 옆자리는 비워 둘게요. 컵라면은 셀프고요. 배는 아침에도 없을지 모르니까 그렇게 알고 와요.',
        "I'll keep the seat by the stove free. Cup noodles are self-serve. There may be no boat in the morning either, so come ready for that."]),   // 1 — 결항 하룻밤
  ],
  'N15-1': [
    pa(['부시리, 아직이에요?', 'No amberjack yet?'],
      ['…아직 못 걸었습니다. 거리는 지키고 있습니다.', "...Haven't hooked one. I'm keeping my distance, though."],
      ['멈추는 시간을 길게 가져가요. 부시리는 그 조용한 틈에 물어요. 거리는 지금처럼 지키고요.',
        'Make the pauses longer. Amberjack strike in that quiet gap. And keep the distance just as you are.']),   // 0 — 부시리 1마리
  ],
};
