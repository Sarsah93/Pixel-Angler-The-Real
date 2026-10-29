/**
 * @file StoryProgressAsk4.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) — 유하랑 · 고만석 · 채금자 · 오가윤 · 연태오 · 여강산 편.
 */
import { pa } from './StoryProgressAskKit.js';
import type { ProgressAskDef } from '../types/Story.js';

export const PROGRESS_ASKS_4: Record<string, ProgressAskDef[]> = {
  // ── 유하랑 ──
  'N20-1': [
    pa(['화면에 나올 한 마리, 올라왔어요?', 'Landed the one fish for the camera yet?'],
      ['…아직입니다. 카메라 앞이라 그런지 손이 굳습니다.', '...Not yet. My hands freeze up in front of the camera.'],
      ['저도 그래요, 렌즈만 보면 손이 굳어요. 카메라는 잊고 평소처럼 던지세요. 그림은 제가 알아서 잡을게요.', "Me too. My hands lock up the second I see the lens. Forget the camera and cast like you always do. I'll take care of the shot."]), // 0 — 카메라 앞에서 1마리
    pa(['방송 끄고 나서, 잠깐 얘기할 수 있어요?', 'Once I end the stream, can we talk for a bit?'],
      ['…조금 이따가 이야기하겠습니다.', "...Let's talk a little later."],
      ['그럼 천천히 와요. 저는 삼각대 세워 둔 데서 기다리고 있을게요.', "Then take your time. I'll be waiting by the tripod."]), // 1 — 방송 끝나고 이야기
  ],
  'N20-2': [
    pa(['노을 질 때 두 마리, 올라왔어요?', 'Two fish while the sun goes down — got them yet?'],
      ['…아직 다 채우지 못했습니다.', '...Not quite there yet.'],
      ['해 넘어가기 직전에 입질이 잦아요. 노을 쪽을 보고 던지면 그림도 같이 나오니까 일석이조예요.', 'Bites pick up right before the sun dips. Cast toward the sunset and I get the shot too. Two birds, one stone.']), // 0 — 해질 무렵 2마리
    pa(['해 떨어질 때까지, 여기 자리 지켜 줄 수 있어요?', 'Can you hold this spot until the sun goes down?'],
      ['…조금 이따가 와서 앉겠습니다.', "...I'll come and sit a bit later."],
      ['네, 해 지기 전에만 와 줘요. 카메라는 등 뒤에서 돌릴 거니까 뒤돌아보지 말고 바다만 봐요.', "Sure, just come before the sun sets. I'll be filming from behind you, so don't turn around. Just watch the sea."]), // 1 — 일몰까지 자리 지키기
    pa(['찍힌 거, 같이 한번 볼래요?', 'Want to look at the footage together?'],
      ['…나중에 같이 보겠습니다.', "...Let's watch it together later."],
      ['그래요, 섬네일은 같이 보고 정할게요. 볼 때는 그늘로 와요, 햇빛 아래선 화면이 하나도 안 보여요.', "Okay, we'll pick the thumbnail together. Come into the shade when we do. You can't see a thing on the screen in the sun."]), // 2 — 찍힌 걸 같이 보기
  ],
  'N20-3': [
    pa(['속초 합방 자리, 잡아 두셨어요?', 'Did you find us a spot in Sokcho for the collab?'],
      ['…아직 자리를 못 잡았습니다.', "...I haven't found one yet."],
      ['만복상회 앞이면 좋겠어요, 좌판도 같이 나오니까요. 대신 찍기 전에 좌판 할머니들께 꼭 허락부터 받아요.', 'Out front of Manbok Store would be great, with the stalls in the frame. But ask the grannies at the stalls before we film anything.']), // 0 — 속초 합방 자리
    pa(['둘이 나란히 두 마리, 올라왔어요?', 'Two fish side by side — got them yet?'],
      ['…아직 다 못 올렸습니다.', '...Not both yet.'],
      ['한 화면에 둘 다 들어와야 하니까 너무 떨어져 앉지 마요. 줄 안 엉킬 만큼만 띄우면 돼요.', "We both need to fit in one frame, so don't sit too far apart. Just enough room that our lines don't tangle."]), // 1 — 둘이 나란히 2마리
    pa(['편집본, 같이 볼 시간 있어요?', 'Got time to look at the cut with me?'],
      ['…나중에 천천히 보겠습니다.', "...I'll take a proper look later."],
      ['네, 올리기 전에만 같이 봐요. 그쪽 동네니까 남길 장면은 그쪽이 골라 줘요.', "Sure, as long as we see it before it goes up. It's your town, so you pick what stays."]), // 2 — 편집본 확인
  ],
  'N20-4': [
    pa(['금어기 걸린 거, 재 보고 놓아줬어요?', 'The closed-season one — did you measure it and let it go?'],
      ['…아직 놓아주지 못했습니다.', "...I haven't let it go yet."],
      ['각 잡자고 한 건 잊어 주세요. 자로 길이만 재고 바로 물에 돌려보내요. 오래 들고 있으면 안 되잖아요.', "Forget what I said about the shot. Just measure it and put it straight back. We both know you can't hold it long."]), // 0 — 계측 후 방생
    pa(['왜 그래야 하는지, 카메라 앞에서 말해 줄래요?', 'Will you say on camera why it has to be that way?'],
      ['…생각을 정리해서 나중에 말씀드리겠습니다.', '...Let me gather my thoughts and tell you later.'],
      ['네, 천천히 해요. 길게 안 해도 돼요, 왜 놓아줘야 하는지 그쪽 말로 한두 마디면 충분해요.', "Sure, take your time. It doesn't have to be long. A line or two in your own words about why it goes back is plenty."]), // 1 — 왜 그랬는지 말하기
  ],
  'N20-5': [
    pa(['카메라 끄고 하니까, 좀 잡혀요?', 'With the camera off, are they biting?'],
      ['…아직 세 마리는 못 채웠습니다.', "...I haven't made three yet."],
      ['서두르지 마요, 오늘은 찍을 것도 없잖아요. 구독자분들 대 잡는 것도 봐 주면서 천천히 채워요.', "No rush, there's nothing to film today. Help the subscribers with their rods and get your three at your own pace."]), // 0 — 카메라 없이 3마리
    pa(['끝나면 다 같이 먹을 건데, 같이 갈래요?', "We're all eating together after. Coming along?"],
      ['…조금 이따가 합류하겠습니다.', "...I'll join you a bit later."],
      ['네, 편의점 앞에 자리 잡아 둘게요. 구독자분들도 같이 기다릴 거예요.', "Okay, I'll save a spot in front of the convenience store. The subscribers will be waiting too."]), // 1 — 끝나고 같이 먹기
  ],
  'N20-6': [
    pa(['독도 가는 배, 같이 타 줄 거예요?', 'Will you ride out to Dokdo with me?'],
      ['…조금 더 준비하고 오겠습니다.', '...Let me get a bit more ready first.'],
      ['네, 먼 바다라 바람이 세요. 따뜻하게 입고 와요. 거기선 신호도 끊기니까 연락할 데 있으면 배 타기 전에 해 둬요.', "Sure. It's open sea out there and the wind is strong, so dress warm. There's no signal either, so make any calls before we board."]), // 0 — 독도 출조 동행
    pa(['라이브 켜져 있는 동안 한 마리, 걸렸어요?', 'Hooked one while we were live?'],
      ['…아직 방송 중에는 못 올렸습니다.', '...Not while we were live, no.'],
      ['아무도 안 봐도 끝까지 켜 둘 거예요. 시청자 숫자는 신경 쓰지 말고 평소처럼 던져요.', "I'm keeping it on to the end even if nobody's watching. Don't worry about the viewer count. Just cast like always."]), // 1 — 방송 중 1마리
  ],
  'N20-7': [
    pa(['마지막 영상에 넣을 돌돔, 올라왔어요?', 'Got the striped beakperch for the last video?'],
      ['…아직 돌돔은 못 만났습니다.', "...I haven't met a beakperch yet."],
      ['돌돔은 바위 많은 데 붙어 산대요. 이빨이 세니까 채비는 튼튼한 걸로 가요. 편집 없이 있는 그대로 찍을게요.', "They say beakperch stick close to rocky ground. Their teeth are strong, so go with sturdy tackle. I'll film it just as it is, no edits."]), // 0 — 돌돔 1마리
    pa(['다음 항구 얘기, 지금 잠깐 들어 줄래요?', 'Will you hear me out about the next port for a minute?'],
      ['…다음에 천천히 듣겠습니다.', "...I'll hear it properly another time."],
      ['그래요, 아직 어딘지 정한 것도 아니니까요. 떠나기 전에 한 번만 꼭 들러 줘요.', "Okay. I haven't even decided where yet. Just make sure you stop by once before I leave."]), // 1 — 다음 항구 이야기
    pa(['마지막에 넣을 한 컷, 정했어요?', 'Decided on the one frame for the ending?'],
      ['…아직 고르지 못했습니다.', "...I haven't picked one yet."],
      ['제일 잘 나온 거 말고 제일 오래 남는 걸로 골라 줘요. 자막 없이 올릴 거라 그림만 봐도 알 수 있어야 해요.', "Not the best-looking one. The one that stays with you. It's going up without subtitles, so the picture has to speak for itself."]), // 2 — 한 컷 고르기
  ],

  // ── 고만석 ──
  'M3-01': [
    pa(['내가 세워 준 자리에서 방어, 올렸나?', 'Land a yellowtail where I put you?'],
      ['…아직 방어는 못 올렸습니다.', '...No yellowtail yet.'],
      ['배 세운 자리에서 바로 내려라. 방어는 떼로 다니니까 놓쳐도 또 온다. 속이 뒤집혀도 대는 놓지 말고.', "Drop right where I stop the boat. Yellowtail run in schools, so miss one and more come. Stomach turning or not, don't let go of the rod."]), // 0 — 고래마루 자리에서 방어
    pa(['배 곧 뜬다. 탈 거냐?', "Boat's leaving soon. You getting on?"],
      ['…다음 항차에 타겠습니다.', "...I'll take the next trip."],
      ['그래. 부두에서 구경만 하는 건 승선이 아니다. 탈 땐 명부에 이름 쓰고 조끼부터 입어.', "Fine. Watching from the pier isn't boarding. When you come, sign the log and get your vest on first."]), // 1 — 고래마루 한 항차
  ],
  'M3-02': [
    pa(['지깅으로 방어 40 넘겨 봤나?', 'Jigged a yellowtail over forty yet?'],
      ['…아직 팔만 아프고 40은 못 넘겼습니다.', '...Just sore arms so far. Nothing over forty.'],
      ['힘으로 하니까 팔이 먼저 나가는 거다. 바닥 찍고 일정한 리듬으로 저킹해. 방어는 지그 떨어질 때 무니까 그때 줄을 봐라.', "Your arms give out because you're using muscle. Touch bottom and jerk to a steady rhythm. Yellowtail take it on the fall, so watch your line then."]), // 0 — 지깅 방어 40cm+
  ],
  'M3-05': [
    pa(['해무 덮치기 전에 두 마리, 올렸나?', 'Got your two before the fog hits?'],
      ['…아직 두 마리를 채우지 못했습니다.', "...I haven't got two yet."],
      ['안개 밀려오기 시작하면 오래 볼 거 없다. 잡히는 대로 빨리 올리고, 앞이 안 보이면 그땐 대 접어.', "Once the fog starts rolling in, there's no time to linger. Bring up whatever bites, fast, and when you can't see ahead, put the rod away."]), // 0 — 해무 전 2마리
    pa(['해무가 들어오면 더 갈 거냐, 돌아갈 거냐?', 'When the fog comes in, do you push on or turn back?'],
      ['…아직 정하지 못했습니다.', "...I haven't decided yet."],
      ['오래 생각할 시간은 없다. 안개는 기다려 주지 않아. 무리하지 않고 돌아오는 것도 실력이다.', "You won't get long to think. Fog doesn't wait. Turning back without pushing it is a skill too."]), // 1 — 해무 속 귀항 판단
  ],
  'M3-08': [
    pa(['타이라바로 참돔, 걸어 봤나?', 'Hooked a red seabream on the tairaba yet?'],
      ['…아직 참돔은 못 걸었습니다.', '...No seabream yet.'],
      ['참돔은 새벽이나 저녁에 문다. 한낮엔 잘 안 물어. 바닥 찍고 천천히 감고, 큰 놈 걸리면 버티지 말고 드랙 믿어.', "Seabream bite at dawn or dusk, hardly at midday. Touch bottom and reel slow, and if a big one takes it, don't fight it. Trust the drag."]), // 0 — 새벽·저녁 타이라바 참돔
  ],
  'M6-09': [
    pa(['방어진으로 돌아올 날은 정했나?', 'Decided when you are coming back to Bangeojin?'],
      ['…아직 날을 못 정했습니다.', "...I haven't set a day yet."],
      ['급할 건 없다. 오거든 곧장 부두로 와라. 고래마루는 늘 묶던 자리에 있다.', "No rush. When you come, head straight to the pier. The Goraemaru is tied up where she always is."]), // 0 — 울산 방어진으로
    pa(['마지막 출항이다. 손님으로 탈 거냐?', "It's her last trip out. Coming aboard as a passenger?"],
      ['…조금만 기다려 주십시오. 곧 오르겠습니다.', "...Give me a moment. I'll be aboard soon."],
      ['그래. 이번엔 해나가 키를 잡는다. 너는 손님이니까 처음 탔을 때 앉았던 자리에 앉아 있으면 된다.', "Right. Haena has the wheel this time. You're a passenger, so just sit where you sat the first time."]), // 1 — 마지막 출항 손님
  ],
  'N08-1': [
    pa(['선상 채비로 두 마리, 올렸나?', 'Got two up on the boat rig?'],
      ['…아직입니다. 배 위라 손이 느립니다.', "...Not yet. I'm slow on a rocking deck."],
      ['육지 채비는 넣어 둬라. 배에선 짧고 굵고 무거운 걸로 바닥까지 곧장 내린다. 뱃머리에선 옆 사람 줄이랑 엉키지 않게 하고.', "Put the shore rig away. On a boat it's short, thick and heavy, straight down to the bottom. And up at the bow, don't tangle with the line next to you."]), // 0 — 선상 채비 2마리
    pa(['뱃머리 비워 놨다. 지금 탈 거냐?', 'I kept the bow open for you. Getting on now?'],
      ['…오늘은 어렵고, 다음 항차에 오르겠습니다.', "...Not today. I'll board the next trip."],
      ['그래, 다음 항차 때 와라. 채비는 내가 주는 거 쓰고, 점심은 배에서 물회다.', 'Fine, come on the next one. Use the rig I give you, and lunch is mulhoe on board.']), // 1 — 고래마루 승선
  ],
  'N08-4': [
    pa(['울산 올 짬은 좀 나겠나?', 'Think you can find time to come to Ulsan?'],
      ['…아직 짬을 내지 못했습니다.', "...I haven't managed to get away yet."],
      ['바쁘면 나중이라도 된다. 오면 부두로 와라. 얘기는 배 앞에서 하는 게 낫다.', "If you're busy, later is fine. When you come, come to the pier. Some talks are better had in front of the boat."]), // 0 — 울산으로
    pa(['시간 되면 앉아라. 얘기 좀 들어 주겠나?', "Sit, if you've got the time. Will you hear me out?"],
      ['…조금 이따가 와서 듣겠습니다.', "...I'll come back and listen a little later."],
      ['그래, 급한 얘긴 아니다. 배는 아직 어디 안 가니까 천천히 와라.', "All right, it's not urgent. The boat isn't going anywhere yet, so take your time."]), // 1 — 선장의 이야기
  ],

  // ── 채금자 ──
  'M4-01': [
    pa(['첫 견적 낼 오백, 다 모았어요?', 'Got the five million together for the first estimate?'],
      ['…아직 다 모으지 못했습니다.', "...I haven't saved it all yet."],
      ['배는 어디 안 가요. 한 번에 크게 벌려고 무리하지 말고, 잡은 거 꾸준히 팔아서 채우세요.', "The boat isn't going anywhere. Don't push for one big score. Sell what you catch, steadily, and fill it up."]), // 0 — 오백만 원
  ],
  'M4-02': [
    pa(['그쪽 배로 나가서 세 마리, 올렸어요?', 'Taken your own boat out and landed three yet?'],
      ['…아직 다 올리지 못했습니다.', '...Not all three yet.'],
      ['처음엔 멀리 나가지 마요. 부두 가까이서 배 세우는 것부터 익히고, 던지는 건 그다음이에요.', "Don't go far at first. Learn to hold the boat steady near the pier, and worry about casting after that."]), // 0 — 내 배로 첫 3마리
    pa(['선수에 이름 썼으면, 첫 운항 나가 볼래요?', "If the name's on the bow, want to take her out for the first run?"],
      ['…조금 더 마음을 다잡고 나가겠습니다.', '...Let me steady my nerves a bit first.'],
      ['떨리는 거 정상이에요. 첫 운항은 부두 한 바퀴면 돼요. 이름 쓴 배는 떠야 배예요.', 'Nerves are normal. One lap of the pier is enough for a first run. A named boat has to float to be a boat.']), // 1 — 첫 운항
  ],
  'N11-1': [
    pa(['선상식 할 광어, 잡았어요?', 'Caught the flatfish for the boat meal?'],
      ['…아직 광어는 못 잡았습니다.', '...No flatfish yet.'],
      ['광어는 바닥에 붙어 산대요. 채비를 바닥까지 내리고 천천히 끌어 보세요. 저는 잘 못하지만 다들 그렇게 하더라고요.', "Flatfish hug the bottom, I hear. Take your rig all the way down and drag it slow. I'm no good at it, but that's how everyone does it."]), // 0 — 광어 1마리
    pa(['키 앞으로 와요. 항로 수업, 지금 할래요?', 'Come up to the wheel. Want the navigation lesson now?'],
      ['…다음에 꼭 배우겠습니다.', "...I'll be sure to learn it next time."],
      ['좋아요. 오기 전에 물때 한번 보고 와요. 조류가 먼저고, 바람은 그다음이에요.', 'All right. Check the tides before you come. Current first, wind second.']), // 1 — 항로 판단 수업
  ],
  'N11-3': [
    pa(['배 묶을 결속 자재 두 개, 다 만들었어요?', 'Made both lashings for tying the boat down?'],
      ['…아직 다 만들지 못했습니다.', '...Not both yet.'],
      ['태풍은 안 기다려요. 대충 만들지 말고 튼튼하게 만드세요. 결속이 풀리면 배가 부두를 때려요.', "Typhoons don't wait. Don't rush the job, make them strong. If the lashings come loose, the boat slams into the pier."]), // 0 — 결속 자재 2점
    pa(['거절하는 법, 지금 배워 둘래요?', 'Want to learn how to say no, right now?'],
      ['…조금 이따가 배우겠습니다.', "...I'll learn it a little later."],
      ['그래요. 하나만 기억해요, 돈 얘기가 나오면 더 빨리 거절하는 거예요. 두 배를 준다고 해도요.', 'Fine. Just remember one thing: the moment money comes up, you say no faster. Even if they offer double.']), // 1 — 거절하는 법
  ],

  // ── 오가윤 ──
  'M4-05': [
    pa(['집어등 아래서 갈치, 올라왔어요?', 'Get a hairtail up under the lights?'],
      ['…아직 올리지 못했습니다.', '...Not yet.'],
      ['갈치는 이빨이 날카로워서 목줄을 잘 끊어요. 와이어 목줄을 쓰고, 불빛이 끝나는 가장자리를 노려 봐요.', 'Hairtail have sharp teeth and cut leaders easily. Use a wire leader, and aim for the edge where the light fades.']), // 0 — 집어등 아래 갈치
  ],
  'N12-1': [
    pa(['해 넘어갈 때까지 발밑 갯가, 좀 훑어 봤어요?', 'Have you worked the shore at your feet while the sun goes down?'],
      ['…아직 다 훑지 못했습니다.', "...I haven't covered it all yet."],
      ['멀리 가지 말고 제 옆에서 해요. 해 지면 발밑이 금방 어두워지니까 미끄러운 돌은 조심하고요.', "Don't go far, stay by me. It gets dark underfoot fast once the sun's down, so watch the slippery rocks."]), // 0 — 발밑 갯가 2회
    pa(['해 질 때까지만, 옆에 있어 줄래요?', 'Just until the sun sets, will you stay with me?'],
      ['…금방 다시 와서 옆에 앉겠습니다.', "...I'll be right back to sit with you."],
      ['네, 기다릴게요. 아무 말 안 해도 돼요. 해 지기 전에만 와 줘요.', "Okay, I'll wait. You don't have to say anything. Just come before the sun goes down."]), // 1 — 일몰까지 자리 지키기
  ],
  'N12-3': [
    pa(['여수엔 다시 언제 와요?', 'When are you coming back to Yeosu?'],
      ['…아직 정하지 못했습니다. 곧 가겠습니다.', "...I haven't decided yet. I'll be there soon."],
      ['오면 호텔 주차장으로 와요. 저는 퇴근하고 나면 캠핑카 앞에 있어요.', "When you come, come to the hotel parking lot. After work, I'm by the camper van."]), // 0 — 여수로
    pa(['우미 씨는 만나 봤어요?', 'Have you met Umi yet?'],
      ['…아직 만나 보지 못했습니다.', "...I haven't met Umi yet."],
      ['우미 씨는 호텔 주차장 캠핑카에 있어요. 밤 낚시 같이 가자고 하면 나올 거예요. 갈치 안 물어도 괜찮아요.', "Umi's in the camper van in the hotel lot. Ask her to come night fishing and she'll come out. It's fine if the hairtail don't bite."]), // 1 — 정우미와 밤 낚시
  ],

  // ── 연태오 ──
  'M6-02': [
    pa(['파퍼로 부시리, 올렸어요?', 'Landed an amberjack on the popper?'],
      ['…아직입니다. 파퍼만 열심히 끌고 있습니다.', '...Not yet. Just dragging the popper around.'],
      ['말 안 하기로 했는데 하나만요. 파퍼는 끌 때가 아니라 멈출 때 물어요. 여름이나 가을 바다에서 잠깐씩 쉬어 줘요.', "I said I wouldn't talk, but just one thing. A popper gets hit on the pause, not the pull. Out on the summer or autumn sea, give it little rests."]), // 0 — 파핑 부시리
  ],
  'N15-2': [
    pa(['쉿. 부시리 두 마리, 채웠어요?', 'Shh. Got your two amberjack?'],
      ['…아직입니다. 소리 안 내느라 애먹고 있습니다.', '...Not yet. Keeping quiet is harder than it looks.'],
      ['편의점 불빛 닿는 데는 피해요, 들키니까요. 밤에도 파퍼는 똑같이 멈출 때 물어요.', "Stay out of the convenience store's light, or we'll get caught. At night too, the popper gets hit on the pause."]), // 0 — 야간 부시리 2마리
  ],

  // ── 여강산 ──
  'N06-3': [
    pa(['괴물 농어, 60 넘는 놈 걸었어?', 'That monster sea bass — hooked one over sixty yet?'],
      ['…아직 60 넘는 놈은 못 만났습니다.', "...I haven't met one over sixty yet."],
      ['60 아래는 그냥 농어야. 태풍 뒤 물 탁할 때가 기회니까 맑아지기 전에 붙어. 걸리면 혼자 띄우지 말고 뜰채부터 불러.', "Under sixty, it's just a sea bass. The murky water after a typhoon is your chance, so get on it before it clears. Hook one, and don't lift it alone. Call for the net."]), // 0 — 농어 60cm+
  ],
};
