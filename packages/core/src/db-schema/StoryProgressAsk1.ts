/**
 * @file StoryProgressAsk1.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) — 정옥선 · 오세린 · 석대양 · 하민지 편.
 */
import { pa } from './StoryProgressAskKit.js';
import type { ProgressAskDef } from '../types/Story.js';

export const PROGRESS_ASKS_1: Record<string, ProgressAskDef[]> = {
  // ── 정옥선 ──
  'M1-02': [
    pa(['얼음 상자는 챙겼어?', 'Got the ice crate?'],
      ['그게… 아직 못 챙겼습니다.', "Well... I haven't picked it up yet."],
      ['좌판 뒤에 내놓은 그 상자다. 들고 나서기 전에 짐 속에 잘 들었는지 한 번 봐 둬라.', "It's the crate I set out behind the stall. Before you head off, check it's really in your pack."]),   // 0 — 얼음 상자 확인
    pa(['경매장까지는 가 봤어?', 'Made it to the auction hall?'],
      ['…아직 거기까지 못 갔습니다.', "...I haven't gotten that far yet."],
      ['경매장 앞에 자리 봐 둔 데가 있다. 얼음 녹기 전에 가되, 상자 들고 뛰지는 마라.', "There's a spot marked out in front of the hall. Get there before the ice melts, but don't run with the crate."]),   // 1 — 경매장까지 운반
    pa(['경매장 앞에 상자는 내려놨어?', 'Set the crate down in front of the hall?'],
      ['…아직 내려놓지 못했습니다.', "...I haven't set it down yet."],
      ['아무 데나 두지 말고 봐 둔 자리에 놔라. 무릎 굽혀서 천천히 내려놓는 거다.', 'Not just anywhere. Put it on the marked spot. Bend your knees and lower it slowly.']),   // 2 — 지정 위치에 내려놓기
    pa(['얼음 상자는 어떻게 됐니?', 'So, how did it go with the ice crate?'],
      ['…다 하고 나서 말씀드리겠습니다.', "...I'll tell you once it's done."],
      ['그래, 끝까지 하고 와서 말해라. 얼음은 기다려 주지 않으니 너무 늦지는 말고.', "All right, finish it and then tell me. Ice doesn't wait, so don't be too long."]),   // 3 — 정옥선에게 보고
  ],
  'M1-03': [
    pa(['숙소엔 들어가 봤어?', 'Been inside the dorm yet?'],
      ['아직입니다. 곧 들어가 보겠습니다.', 'Not yet. I will go in soon.'],
      ['좌판 바로 뒤다. 열쇠 줬으니 문 열고 들어가서 먼지부터 털어라.', "It's right behind the stall. You've got the key, so open up and shake the dust out first."]),   // 0 — 숙소 문 열고 들어가기
    pa(['숙소에서 잠은 자 봤어?', 'Have you slept there yet?'],
      ['…아직 거기서 자 보지는 못했습니다.', "...I haven't slept there yet."],
      ['침대에 누워 자야 하루가 간다. 첫날 밤은 낯설어도 눈 붙이고 아침에 일어나 봐라.', 'A day only passes once you sleep in a bed. The first night feels strange, but close your eyes and get up in the morning.']),   // 1 — 첫 밤 넘기기
  ],
  'M1-06': [
    pa(['작은 놈은 돌려보내 봤어?', 'Have you put a small one back yet?'],
      ['…아직 돌려보낸 적이 없습니다.', "...I haven't let one go yet."],
      ['올라오면 먼저 자로 재 봐라. 눈대중은 법이 아니다. 작거나 금어기에 걸린 놈은 물에 살살 내려놔.', "When one comes up, measure it first. Eyeballing isn't the law. If it's undersized or out of season, ease it back into the water."]),   // 0 — 자로 재고 돌려보내기
    pa(['다섯 가지 법, 지금 다 듣고 가겠니?', 'Will you sit and hear all five laws now?'],
      ['…다음에 와서 차분히 듣겠습니다.', "...I'll come back and listen properly another time."],
      ['그래, 시간 날 때 와서 앉아라. 그 전엔 잡은 거 팔 생각은 하지 말고.', "Fine. Come and sit when you have time. Until then, don't even think about selling what you catch."]),   // 1 — 다섯 가지 법 듣기
  ],
  'M1-07': [
    pa(['한 마리 손질은 해 봤어?', 'Have you dressed a fish yet?'],
      ['…아직 손질을 끝내지 못했습니다.', "...I haven't finished dressing one yet."],
      ['시메부터 해서 피 빼고, 비늘 치고, 머리 떼는 순서대로 가라. 급하면 손 베인다.', "Start with the spike, then bleed it, scale it, and take the head, in that order. Rush it and you'll cut yourself."]),   // 0 — 원물 손질
    pa(['회까지 떠 봤어?', 'Have you sliced it into sashimi yet?'],
      ['아직 회는 뜨지 못했습니다.', "I haven't sliced any sashimi yet."],
      ['두께는 나중이다. 결을 따라 칼을 길게 한 번에 당기는 것부터 익혀라.', 'Thickness comes later. First learn to follow the grain and draw the knife in one long pull.']),   // 1 — 회 뜨기
  ],
  'M1-09': [
    pa(['물 빠질 때 갯바위에서 뭐 좀 건졌어?', 'Picked anything off the rocks at low water?'],
      ['…아직 다 채우지 못했습니다.', "...I haven't gathered enough yet."],
      ['발밑만 보지 말고 물이 빠진 자리를 봐라. 랜턴 꼭 챙기고, 어장 표지 안쪽은 넘지 마.', "Don't just watch your feet. Look where the water pulled back. Bring your lantern, and don't cross inside the fishery markers."]),   // 0 — 간조 갯바위 채집
  ],
  'M2-11': [
    pa(['좌판엔 들러 봤어?', 'Have you been by the stall?'],
      ['…아직 좌판까지는 못 가 봤습니다.', "...I haven't made it to the stall yet."],
      ['상자가 다 제각각이다. 와서 보면 뭘 고쳐야 할지 네 눈에 먼저 들어올 거다.', "The crates are all over the place. Once you see it, you'll spot what needs fixing before I say a word."]),   // 0 — 만복상회로 돌아가기
    pa(['진열은 어떻게 고칠지 정했어?', 'Decided how you will fix the display?'],
      ['…아직 정하지 못했습니다.', "...I haven't decided yet."],
      ['부산에서 배운 규격대로 해 봐라. 나는 옆에서 보기만 하마.', "Do it to the standard they taught you in Busan. I'll just sit beside you and watch."]),   // 1 — 부산 규격으로 진열
  ],
  'M3-06': [
    pa(['명태는 만나 봤어?', 'Have you come across a pollock?'],
      ['…아직 만나지 못했습니다.', "...I haven't come across one yet."],
      ['만나거든 놓아줘라. 지금은 잡으면 안 되는 고기다. 얼굴만 보고 바다로 돌려보내.', "If you do, let it go. It's a fish no one may keep now. Just take a good look and send it back to the sea."]),   // 0 — 그 물고기를 놓아주기
    pa(['노인들 얘기는 다 받아 적었어?', "Written down all the old folks' stories?"],
      ['아직 다 받아 적지 못했습니다.', "I haven't written them all down yet."],
      ['노인들은 두 번 말 안 한다. 중간에 끊지 말고 끝까지 들은 다음에 적어라.', "Old people don't say it twice. Don't cut in. Hear them out to the end, then write."]),   // 1 — 노인 세 사람 이야기
  ],
  'M6-05': [
    pa(['얼음은… 좀 날랐니?', 'The ice... have you been hauling it?'],
      ['…아직 다 나르지 못했습니다.', "...I haven't hauled it all yet."],
      ['한 번에 몰아서 들지 말고 나눠서 날라라. 너까지 허리 다치면 안 된다.', "Don't lift it all in one go. Split the loads. I can't have you hurting your back too."]),   // 0 — 얼음 세 번 나르기
    pa(['베개 밑에 있는 거, 지금 받아 가겠니?', "What's under the pillow... will you take it now?"],
      ['…조금 더 있다가 받겠습니다.', "...I'll take it a little later."],
      ['그래. 어디 안 간다. 마음 정해지면 와서 꺼내 가라.', "All right. It's not going anywhere. When you're ready, come and take it out."]),   // 1 — 조행록 마지막 권 받기
  ],
  'M6-06': [
    pa(['위판은 좀 넣어 봤어?', 'Put any lots through the auction yet?'],
      ['…아직 위판을 다 쌓지 못했습니다.', "...I haven't built up enough lots yet."],
      ['물건이 있어야 좌판도 본다. 위판 넣을 때 값이 어떻게 붙는지 잘 봐 둬라.', 'You need goods before you can mind a stall. When you consign, watch closely how the prices come in.']),   // 0 — 위판 세 건
    pa(['좌판, 사흘 다 봤어?', 'Minded the stall the full three days?'],
      ['아직 사흘이 다 차지 않았습니다.', "It hasn't been three days yet."],
      ['값 틀려도 괜찮다. 손님이 가르쳐 줄 거다. 아침마다 재고부터 세고 앉아라.', 'Getting a price wrong is fine. The customers will teach you. Each morning, count your stock before you sit down.']),   // 1 — 좌판 사흘 운영
  ],
  'M7-04': [
    pa(['그 자리에서 도다리는 올려 봤어?', 'Landed a flounder from that spot yet?'],
      ['…아직 올리지 못했습니다.', "...I haven't landed one yet."],
      ['사진 속 네가 서 있던 그 자리다. 도다리는 바닥에 붙어 사니까 봉돌을 바닥까지 내려서 기다려라.', 'The very spot where you stood in that photo. Flounder hug the bottom, so get your sinker all the way down and wait.']),   // 0 — 같은 자리 도다리
    pa(['그 사진, 같이 좀 보겠니?', 'Shall we look at that photo together?'],
      ['…다음에 가져와서 보여 드리겠습니다.', "...I'll bring it next time and show you."],
      ['그래, 가져와라. 얘기가 기니까 앉을 시간 넉넉할 때 오고.', "All right, bring it. It's a long story, so come when you have time to sit."]),   // 1 — 병실에서 사진 보기
  ],
  'M7-06': [
    pa(['상에 올릴 회는 다 떴어?', 'Are the plates for the table all sliced?'],
      ['…아직 다 뜨지 못했습니다.', "...I haven't finished slicing them yet."],
      ['사람들 다 오는 상이다. 쿨러 얼음 아끼지 말고, 결 따라 차분히 떠라.', "Everyone's coming to this table. Don't skimp on cooler ice, and slice calmly along the grain."]),   // 0 — 회 세 접시
    pa(['이제 식 시작해도 되겠니?', 'Shall we start the ceremony now?'],
      ['…조금만 더 있다가 하겠습니다.', "...Let's wait just a little longer."],
      ['그래라. 준비되면 와서 가위 쥐여 줘. 손 떨려도 내가 자른다.', "Fine. When you're ready, come put the scissors in my hand. Shaking or not, I'll cut it."]),   // 1 — 재개관식 참석
  ],
  'N19-7': [
    pa(['준 거, 심어 봤냐?', 'Planted what I gave you?'],
      ['…아직 다 심지 못했습니다.', "...I haven't planted it all yet."],
      ['두 칸이면 된다. 흙만 덮어 줘도 반은 한 거야. 마당이 마땅찮으면 집 안 선반에 심어도 된다.', "Two patches is plenty. Just covering them with soil is half the job. If the yard's no good, the shelf indoors will do."]),   // 0 — 두 칸 심기
    pa(['심은 얘기, 좀 들려주겠니?', 'Going to tell me about the planting?'],
      ['다 심고 나서 말씀드리겠습니다.', "I'll tell you once everything's in the ground."],
      ['그래, 다 심거든 와서 말해라. 흙은 손으로 꼭꼭 눌러 덮고.', 'All right, tell me once it is all in. Press the soil down firmly with your hands.']),   // 1 — 심었다고 알리기
  ],
  'N19-8': [
    pa(['첫물은 거뒀냐?', 'Brought in your first harvest?'],
      ['…아직 거둘 만큼 자라지 않았습니다.', "...It hasn't grown enough to pick yet."],
      ['밭은 재촉한다고 빨리 안 자란다. 물 잘 주고 풀 뽑으면서 기다려라.', "Hurrying a field won't make it grow. Water it well, pull the weeds, and wait."]),   // 0 — 처음 거두기
    pa(['거둔 거, 맛 좀 보여 주겠니?', 'Going to let me taste what you picked?'],
      ['…다음에 가져와서 드리겠습니다.', "...I'll bring some next time."],
      ['그래, 봉지에 담아 와라. 첫물은 남 주는 거다.', 'All right, bring it in a bag. The first picking is for giving away.']),   // 1 — 할머니께 맛보이기
  ],
  'N19-2': [
    pa(['속초 갈 채비는 됐어?', 'Ready to head to Sokcho?'],
      ['…아직 떠나지 못했습니다.', "...I haven't set out yet."],
      ['반찬은 식기 전에 갖다 줘야 한다. 가는 길에 통을 무릎에 꼭 안고 가라.', 'Food should get there before it cools. Keep the tub hugged on your lap the whole way.']),   // 0 — 속초로 돌아가기
    pa(['반찬통은 갖다 줬어?', 'Did you take the food over?'],
      ['…아직 전하지 못했습니다.', "...I haven't delivered it yet."],
      ['공방 문 앞에 두면 된다. 얼굴은 안 봐도 되고, 내가 보냈다는 말은 하지 마라.', "Just leave it at the workshop door. You needn't see him, and don't say I sent it."]),   // 1 — 공방에 반찬통 전하기
  ],
  'N19-4': [
    pa(['직판장엔 언제 오니?', 'When are you coming by the market?'],
      ['…아직 돌아가지 못했습니다.', "...I haven't been able to get back yet."],
      ['탁 씨는 매일 같은 때 여기를 지나간다. 그 무렵에 맞춰 와라.', 'Tak passes by here at the same time every day. Come around then.']),   // 0 — 속초 직판장으로 돌아가기
    pa(['탁 씨는… 좀 앉혀 봤어?', 'Tak... did you get him to sit down?'],
      ['…아직 자리를 마련하지 못했습니다.', "...I haven't set it up yet."],
      ['십 분이면 된다. 나는 앉으라는 말을 못 하니까, 네가 좀 불러 줘.', "Ten minutes is enough. I can't bring myself to ask him to sit, so you call him over."]),   // 1 — 두 사람 한자리에
  ],
  'N19-6': [
    pa(['회 두 접시는 떴어?', 'Sliced the two plates yet?'],
      ['…아직 준비하지 못했습니다.', "...I haven't got them ready yet."],
      ['많이는 필요 없다. 두 접시, 정갈하게만 떠 와라.', "We don't need much. Just two plates, neatly done."]),   // 0 — 두 사람 몫 회
    pa(['자리 좀 만들어 주겠니?', 'Will you make a place for us?'],
      ['…조금 이따가 해 드리겠습니다.', "...I'll do it in a little while."],
      ['그래. 의자 둘이면 된다. 얼음 상자 사이에 놔 줘.', 'All right. Two chairs will do. Put them between the ice boxes.']),   // 1 — 두 사람 자리 만들기
  ],

  // ── 오세린 ──
  'M5-03': [
    pa(['한치는 올려 봤어요?', 'Landed any squid yet?'],
      ['…아직 세 마리를 못 채웠어요.', "...I haven't got three yet."],
      ['에기는 살짝만 튕겨요. 세게 하면 도망가요. 집어등 불빛 가장자리를 노려 봐요!', 'Twitch the egi just a little. Too hard and they bolt. Aim for the edge of the light!']),   // 0 — 한치 세 마리
  ],
  'N14-2': [
    pa(['무늬오징어는 낚았어요?', 'Got a bigfin reef squid yet?'],
      ['…아직 못 낚았어요.', 'Not yet.'],
      ['에기 던지고 천천히 가라앉혀요. 서두르면 안 붙어요.', "Cast the egi and let it sink slowly. Rush it and they won't grab."]),   // 0 — 무늬오징어 1마리
    pa(['마라는 찾았어요?', 'Did you find Mara?'],
      ['…아직 못 찾았어요.', "...I haven't found her yet."],
      ['서귀포 갯바위 쪽에 있을 거예요. 찾아도 말은 걸지 마요. 그냥 옆에 있어 줘요.', "She'll be out on the rocks at Seogwipo. Even if you find her, don't talk to her. Just be there."]),   // 1 — 마라 찾기
  ],
  'N14-3': [
    pa(['지깅 훈련, 세 마리 채웠어요?', 'Got your three in jigging practice?'],
      ['…아직 다 채우지 못했어요.', 'Not all three yet.'],
      ['혼자 빠르면 안 돼요. 옆 사람 저킹을 보면서 셋이 박자를 맞춰 봐요.', "Don't rush ahead on your own. Watch the others jerk and match the beat, all three of you."]),   // 0 — 지깅 훈련 3마리
  ],
  'N14-4': [
    pa(['한치 세 마리, 다 올렸어요?', 'Got all three squid up?'],
      ['…아직 다 못 올렸어요.', 'Not all of them yet.'],
      ['순위판은 보지 마요. 완주만 하면 돼요. 한치가 불빛 아래로 떠오를 때까지 기다려요.', "Don't look at the leaderboard. Just finish. Wait till the squid rise up under the light."]),   // 0 — 한치 3마리
  ],
  'N14-5': [
    pa(['제주엔 언제 와요?', 'When are you coming to Jeju?'],
      ['…아직 떠나지 못했어요.', "...I haven't left yet."],
      ['개회 선언 놓치면 안 돼요! 마라는 카메라 들고, 유리아 언니는 해설석에서 기다려요.', "You can't miss the opening! Mara's got the camera, and Ria's waiting in the commentary booth."]),   // 0 — 제주로 돌아가기
    pa(['개회 선언, 들으러 갈래요?', 'Want to go hear the opening declaration?'],
      ['…조금 이따가 갈게요.', "...I'll come a bit later."],
      ['늦지 마요! 제가 마이크 잡는 거, 딱 한 번이에요.', "Don't be late! I only get the mic once."]),   // 1 — 개회 선언 듣기
  ],

  // ── 석대양 ──
  'M6-03': [
    pa(['등대 아래서 부시리는 올려 봤나?', 'Landed an amberjack below the lighthouse?'],
      ['…아직 낚지 못했습니다.', "...I haven't caught one yet."],
      ['부시리는 힘이 좋은 놈이야. 걸리면 서두르지 말고 힘이 빠질 때까지 버티게.', "Amberjack are strong fish. When one's on, don't hurry. Hold on till it tires."]),   // 0 — 등대 아래 부시리
    pa(['기상 적는 거, 좀 도와주겠나?', 'Will you help me with the weather log?'],
      ['…조금 이따가 와서 돕겠습니다.', "...I'll come help in a little while."],
      ['알겠네. 풍속, 파고, 시정을 다 적고 나서 천천히 얘기하세.', "Very well. Once wind, waves and visibility are all written down, we'll talk at our leisure."]),   // 1 — 기상 관측 돕기
  ],
  'M7-01': [
    pa(['동도엔 닿았나?', 'Have you made the east islet?'],
      ['…아직 접안하지 못했습니다.', "...I haven't been able to berth yet."],
      ['날씨가 문이야. 닫혔으면 기다리게. 바다가 열어 줄 때 가면 내가 등대에서 신호 주지.', "The weather is the door. If it's shut, wait. Go when the sea opens it, and I'll signal you from the lighthouse."]),   // 0 — 독도 동도 접안
  ],

  // ── 하민지 ──
  'N17-2': [
    pa(['우럭은 좀 올라왔어요?', 'Any rockfish biting?'],
      ['…아직 두 마리를 못 채웠습니다.', "...I haven't got two yet."],
      ['우럭은 바닥 돌 틈에 붙어 있대요. 연주회 전에 조과 파티 해야 하니까 너무 늦지만 말아 줘요.', "They say rockfish hug the rocks on the bottom. We've got the catch party before the recital, so just don't be too late."]),   // 0 — 우럭 2마리
  ],
};
