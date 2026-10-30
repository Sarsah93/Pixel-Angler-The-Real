/**
 * @file StoryProgressAsk6.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) — 도현수 · 서하린 · 송기백 · 고해나 · 모태조 편.
 *
 * 도현수에게 하는 내 답은 해요체다(290 — 주인공은 늘 존댓말 · 「도현수 씨」 · 옛 「-다」 맺음을 옮겼다).
 * N13-3은 송기백의 일을 마감기가 대신 말한 편이지만, 진행 중 물음은 의뢰인 송기백의 말이다(부탁하지 않는 노인).
 */
import { pa } from './StoryProgressAskKit.js';
import type { ProgressAskDef } from '../types/Story.js';

export const PROGRESS_ASKS_6: Record<string, ProgressAskDef[]> = {
  // ── 도현수 ──
  'M1-04': [
    pa(['사이소에서 대는 샀어?', 'Did you get a rod at Saiso?'],
      ['…아직 못 샀어요. 이제 가 보려던 참이에요.', '...Not yet. I was just about to go.'],
      ['만 원 남짓한 릴대면 충분해. 구멍치기는 부러져도 안 아까운 대로 하는 거야.', "A reel rod for about ten thousand won is plenty. Hole fishing is for a rod you won't miss if it snaps."]),   // 0 — 사이소 저가 릴대
    pa(['틈에서 한 마리라도 올렸어?', 'Pulled even one out of the gaps?'],
      ['…아직 빈손이에요.', '...Still empty-handed.'],
      ['멀리 던질 필요 없어. 틈 바로 아래로 내리고, 물면 버티지 말고 바로 들어. 구멍으로 파고들면 끝이야.', "No need to cast far. Drop it straight down the gap, and when it bites, lift right away. Once it digs into the hole, it's over."]),   // 1 — 테트라포드 틈 한 마리
  ],
  'M1-05': [
    pa(['아버지 대로 두 마리, 채웠어?', "Two on your father's rod yet?"],
      ['…아직 거기까지는 못 갔어요.', "...I'm not there yet."],
      ['초릿대가 크게 휘는 걸 보고 세 번째에 채. 한 마리는 운이어도, 두 마리는 실력이야.', 'Watch for the tip to bend hard, and strike on the third. One fish can be luck. Two is skill.']),   // 0 — 아버지 릴대로 두 마리
  ],
  'M2-03': [
    pa(['감성돔 40 넘는 거, 올렸어?', 'Landed a seabream over forty yet?'],
      ['…아직이에요. 그 크기는 쉽게 안 나오네요.', "...Not yet. They don't come that size easily."],
      ['겨울 감성돔은 바닥에 붙어서 잘 안 움직여. 찌 수심 더 주고, 밑걸림 나면 당기지 말고 줄을 풀어 줘.', "Winter seabream hug the bottom and barely move. Give the float more depth, and when you snag, don't yank. Give it line."]),   // 0 — 겨울 감천 감성돔 40cm
  ],
  'M4-10': [
    pa(['긴 뱃길에 쓸 보급, 다 만들어 놨어?', 'Got the stores made for the long run?'],
      ['…아직 다 못 만들었어요.', '...Not all of them yet.'],
      ['제주 가는 길엔 중간에 들를 데가 마땅치 않아. 넉넉하게 만들어 둬. 남는 건 아까운 게 아니라 보험이야.', "There's nowhere decent to stop on the way to Jeju. Make plenty. What's left over isn't waste, it's insurance."]),   // 0 — 장거리 보급 세 점
    pa(['연료 계산은 끝났어. 기상은 봤어?', "The fuel's worked out. Have you read the weather?"],
      ['…하늘은 조금 더 보고 말할게요.', "...I'll watch the sky a bit longer, then tell you."],
      ['그래. 둘 다 숫자만 보면 하늘은 아무도 안 봐. 바람이랑 너울, 둘 다 보고 와.', 'Fine. If we both stare at numbers, nobody watches the sky. Check the wind and the swell, both of them.']),   // 1 — 출항 준비(이 자리 대화)
  ],
  'N18-1': [
    pa(['내 옆자리에서 한 마리, 걸었어?', 'Hooked one from the spot next to me?'],
      ['…아직요. 옆자리가 생각보다 어렵네요.', "...Not yet. The spot next to you is harder than it looks."],
      ['다른 자리에서 낚은 건 안 쳐. 여기 내 옆에서 던져. 어깨 힘 빼고, 손목으로.', "Fish from other spots don't count. Cast from right here beside me. Loosen your shoulder. Use the wrist."]),   // 0 — 도현수 옆자리 한 마리
    pa(['누가 어떻게 걸었는지, 지금 맞춰 볼래?', 'Want to go over who hooked what, and how, right now?'],
      ['…그건 조금 있다가 할게요.', "...I'll do that a bit later."],
      ['그래. 크기도 순서도 안 쳐. 던지는 거랑 거는 거, 그것만 본다.', "Fine. Size and order don't count. I'm only looking at the cast and the hook-set."]),   // 1 — 결과 확인(이 자리 대화)
  ],
  'N18-2': [
    pa(['네 물건 두 건, 위판에 올렸어?', 'Put two of your lots up at the auction?'],
      ['…아직 다 올리지 못했어요.', '...Not both yet.'],
      ['네 물건 값 매겨지는 걸 뒷줄에서 봐. 앞줄에 서면 숫자만 보이고 숨부터 막혀.', 'Watch your own catch get priced from the back row. Stand at the front and all you see are numbers, and you stop breathing.']),   // 0 — 위판 2건
    pa(['낙찰가 읽을 준비는 됐어?', 'Ready to read the hammer prices?'],
      ['…아직 낙찰 목록도 제대로 못 봤어요.', "...I haven't even had a proper look at the results yet."],
      ['숫자만 보지 말고 손을 봐. 누가 먼저 드는지, 몇 번 망설이는지 보면 값이 어디서 멈출지 보여.', 'Don\'t just watch the numbers, watch the hands. Who raises first, how often they hesitate. Then you can see where the price will stop.']),   // 1 — 낙찰가 함께 읽기(방식 고르기)
  ],
  'N18-3': [
    pa(['노인들이 말한 그 고기, 만나 봤어?', 'Met the fish the old folks talked about?'],
      ['…그 고기는 아직 못 만났어요.', "...Haven't come across it yet."],
      ['걸리면 바로 놔줘. 듣기만 하고 잡아 가면 거짓말이야. 놓아주는 데까지가 채록이야.', 'If you hook one, let it go right away. Listening and then keeping it would be a lie. Letting it go is part of the record.']),   // 0 — 그 종을 만나 놓아주기
    pa(['노인들 얘기, 받아 적을 준비는 됐어?', "Ready to write down what the old folks say?"],
      ['…아직 준비가 덜 됐어요.', "...I'm not quite ready yet."],
      ['노인들 앞에선 말 끊지 말고 고개만 끄덕여. 둘이 다르게 들은 데가 제일 중요한 데야.', "In front of the old folks, don't cut in. Just nod. The places where we heard it differently are what matter most."]),   // 1 — 구술 채록 1건(방식 고르기)
  ],
  'N18-4': [
    pa(['배값 보탤 위판, 네 건 다 올렸어?', 'Put up all four lots toward the boat?'],
      ['…아직 다 채우지 못했어요.', '...Not all four yet.'],
      ['배값은 한 번에 안 모여. 물건 들어오는 대로 꾸준히 올려. 숫자는 내가 맞춰 볼게.', "Boat money doesn't come in one go. Keep putting lots up as the catch comes in. I'll do the sums."]),   // 0 — 위판 4건
    pa(['선체 검수는 다 했어?', 'Done with the hull inspection?'],
      ['…아직 선체를 제대로 못 봤어요.', "...I haven't had a proper look at the hull yet."],
      ['칠을 새로 바른 데부터 의심해. 두드려서 소리가 낮은 데가 있으면 거기야. 기관실 안도 들여다보고.', 'Suspect the fresh paint first. Tap it, and if one spot sounds lower, that\'s the place. Look inside the engine room too.']),   // 1 — 선체 검수(방식 고르기)
  ],
  'N18-5': [
    pa(['조간대 표본 세 점, 다 모았어?', 'Got all three tideline samples?'],
      ['…아직 다 못 모았어요.', '...Not all of them yet.'],
      ['물 빠질 때 갯바위로 가. 거기 뭐가 사는지 손에 쥐여 줘야 다들 고개를 들어.', "Go out on the rocks when the tide's out. You have to put what lives there in their hands before anyone looks up."]),   // 0 — 조간대 표본 3점
    pa(['자료는 어떻게 나눠서 정리할지 정했어?', 'Decided how we split up the papers?'],
      ['…그건 아직 못 정했어요.', "...I haven't decided that yet."],
      ['찬성은 네가, 반대는 내가 맡자. 어느 쪽이든 상대 말을 끝까지 읽고 나서 손 드는 거야.', 'You take the case for, I\'ll take against. Whichever side, you read the other one to the end before you raise your hand.']),   // 1 — 찬반 자료 정리(방식 고르기)
  ],
  'N18-6': [
    pa(['원산지 적어서 세 건, 올렸어?', 'Put up three lots with the origin written on?'],
      ['…아직이에요. 올릴 물건부터 마련하는 중이에요.', "...Not yet. I'm still getting together what to put up."],
      ['네가 직접 마련한 걸로만 올려. 남을 잡으려면 내 것부터 깨끗해야지.', "Only put up what you got yourself. If you're going to catch others out, your own has to be clean first."]),   // 0 — 원산지 위판 3건
    pa(['위반 한 건, 증거는 잡았어?', 'Got evidence on that violation?'],
      ['…아직 증거를 못 찾았어요.', "...I haven't found the evidence yet."],
      ['라벨은 위에서부터 읽지 마. 원산지 칸부터 봐. 그 칸만 종이 결이 다르면 덧붙인 거야.', "Don't read a label from the top. Look at the origin box first. If only that box has a different paper grain, it's been stuck over."]),   // 1 — 표기 위반 확인(방식 고르기)
  ],
  'N18-7': [
    pa(['재개관식 비품 세 개, 다 만들었어?', 'Made all three fittings for the reopening?'],
      ['…만드는 중이에요. 조금만 더 걸려요.', "...Working on them. It'll take a little longer."],
      ['비품은 네 몫이야. 할 수 있는 만큼 만들어 와. 모자라면 내가 남아서 채울게.', "The fittings are yours. Make what you can. If we're short, I'll stay behind and make up the rest."]),   // 0 — 비품 3점
    pa(['재개관식 준비는 다 끝냈어?', 'All done setting up for the reopening?'],
      ['…아직 다 끝내지 못했어요.', '...Not finished yet.'],
      ['문에 붙은 준비 목록부터 봐. 그다음에 하나씩 놔. 의자는 세지 마, 세면 더 무거워.', "Start with the checklist taped to the door. Then set things out one by one. Don't count the chairs. Counting makes them heavier."]),   // 1 — 재개관식 준비(방식 고르기)
  ],

  // ── 서하린 ──
  'M2-06': [
    pa(['전갱이는 올리셨어요?', 'Any horse mackerel yet?'],
      ['…아직 못 올렸습니다.', '...Not yet.'],
      ['전갱이는 불빛 아래 모인대요. 천천히 감다가 툭 쳐 보세요. 리트리브 속도를 바꾸는 게 요령이래요.', 'They say horse mackerel gather under the lights. Wind slowly, then give it a flick. Changing the retrieve speed is the trick, apparently.']),   // 0 — 겨울 밤 루어 전갱이
    pa(['통발은 만들어 보셨어요?', 'Have you made the trap yet?'],
      ['…아직 손도 못 댔습니다.', "...I haven't even started on it."],
      ['낮에 밝을 때 만들어 주세요. 손으로 만드는 장면은 꼭 찍고 싶거든요.', 'Make it in the daytime while it\'s light, please. I really want to film the hands putting it together.']),   // 1 — 통발 하나
  ],
  'N05-1': [
    pa(['제가 먹을 한 마리, 낚으셨어요?', 'Caught the one I get to eat?'],
      ['…아직 못 낚았습니다.', "...Not yet."],
      ['크기는 상관없어요! 선장님이 던지라고 할 때 던지면 된대요. 다 기범 오빠한테 들은 거예요.', "Size doesn't matter! You just cast when the skipper says to, apparently. I got all that from Gibeom."]),   // 0 — 하린이 먹을 한 마리
    pa(['저는 칼만 잡으면 손이 떨려요. 손질은 해 주셨어요?', 'My hands shake the second I hold a knife. Have you cleaned it for me yet?'],
      ['…아직 손질은 못 했습니다.', "...I haven't cleaned it yet."],
      ['낚으면 그 자리에서 바로 해 주세요. 바다에서 낚은 걸 바로 먹는 게 제 채널이거든요.', "Do it right there as soon as it's caught. Eating it fresh off the sea is what my channel's about."]),   // 1 — 그 자리 손질
    pa(['기범 오빠한테 선상 매너는 들어 보셨어요?', 'Did you hear the boat manners from Gibeom?'],
      ['…아직 나기범 씨와 이야기를 못 나눴습니다.', "...I haven't talked with Gibeom yet."],
      ['기범 오빠는 조용한 사람이라 먼저 물어봐야 말해 줘요. 그 대신 한 번 말하면 다 맞아요.', "He's quiet, so you have to ask before he'll tell you. But once he does, it's all right."]),   // 2 — 나기범에게 선상 매너
  ],
  'N05-2': [
    pa(['전갱이 두 마리, 다 올리셨어요?', 'Got both horse mackerel?'],
      ['…아직 다 채우지 못했습니다.', '...Not both yet.'],
      ['카메라는 꺼 뒀으니까 편하게 하세요. 밤에 불빛 아래서 천천히 감다가 툭 치면 된대요.', "The camera's off, so relax. At night, under the lights, wind slowly and give it a flick. That's what they say."]),   // 0 — 야간 루어 전갱이 2
    pa(['찍는 규칙 얘기, 지금 해도 될까요?', 'Can we talk about the filming rules now?'],
      ['…조금 더 생각해 보고 말씀드리겠습니다.', '...Let me think it over a little more first.'],
      ['네, 천천히요. 수첩 첫 장은 비워 둘게요. 정해 주시는 대로 다 적을 거예요.', "Sure, take your time. I'll keep the first page of my notebook blank. I'll write down whatever you decide."]),   // 1 — 촬영 동의 이야기(이 자리 대화)
  ],
  'N05-4': [
    pa(['우럭은 올리셨어요?', 'Got the rockfish?'],
      ['…아직 소식이 없습니다.', '...No luck yet.'],
      ['겨울 우럭은 바닥에 붙어 있대요. 밤에 천천히 끌어 보세요. 추우니까 단단히 입고 나오시고요.', "In winter rockfish hug the bottom, apparently. Drag it slowly at night. And wrap up warm, it's cold out."]),   // 0 — 우럭 한 마리
    pa(['할 얘기가 있었는데, 지금 들어 줄래요?', "There's something I wanted to tell you. Will you hear it now?"],
      ['…조금 이따가 다시 오겠습니다.', "...I'll come back in a little while."],
      ['네, 기다릴게요. 요즘 밤엔 거의 부두에 나와 있어요. 카메라 없이요.', "Okay, I'll wait. I'm out on the pier most nights these days. No camera."]),   // 1 — 연안부두 재회(이 자리 대화)
  ],
  'N05-6': [
    pa(['칼 잡으시면 바로 켤게요. 손질은 아직이에요?', "I'll go live the moment you pick up the knife. Not started yet?"],
      ['…아직 칼을 잡지 못했습니다.', "...I haven't picked up the knife yet."],
      ['카메라는 신경 쓰지 마세요. 손이랑 도마만 나와요. 떨려도 괜찮아요, 생선은 도망 안 가니까요.', "Don't mind the camera. Only your hands and the board will show. It's fine if you shake. The fish isn't going anywhere."]),   // 0 — 방송 중 손질
  ],

  // ── 송기백 ──
  'M4-07': [
    pa(['서해 땅은 좀 밟아 봤나?', 'Had a proper walk on West Sea ground yet?'],
      ['…아직 제대로 둘러보지 못했습니다.', "...I haven't had a proper look around yet."],
      ['바닷가부터 한 바퀴 걸어 봐. 서해는 물 빠졌을 때랑 찼을 때가 딴 바다야.', 'Walk the shore once round first. The West Sea at low water and at high water are two different seas.']),   // 0 — 태안 도착
    pa(['갯벌에서 세 개는 캤나?', 'Dug your three on the flats?'],
      ['…아직 다 캐지 못했습니다.', '...Not all three yet.'],
      ['나올 때부터 정하고 들어가. 발은 눕혀서 넓게 딛고, 물 들어오면 세 개 못 채워도 나와.', "Decide when you're coming out before you go in. Lay your feet flat and wide, and when the water comes in, get out, three or not."]),   // 1 — 물때 맞춰 갯벌 세 개체
  ],
  'N13-2': [
    pa(['배 주변은 좀 뒤져 봤나?', 'Had a dig around the boat?'],
      ['…아직 다 뒤져 보지 못했습니다.', "...I haven't been through it all yet."],
      ['배 둘레 갯가를 천천히 훑어. 바람 센 날 문이 열려서 뭐가 날아갔을지도 몰라.', 'Go over the shore around the boat slowly. On a windy day the door might have blown open and sent something out.']),   // 0 — 폐어선 주변 채집 3회
    pa(['사진은 좀 보이던가?', 'Any sign of the photo?'],
      ['…아직 찾지 못했습니다.', "...I haven't found it yet."],
      ['젖었어도 괜찮아. 얼굴만 보이면 돼. 갯가 돌 틈이랑 물 빠진 자리를 잘 봐.', "Wet's fine. As long as the faces show. Look carefully between the rocks on the shore and where the water's gone out."]),   // 1 — 갯가의 젖은 단체사진
    pa(['사진 얘기, 들어 줄 텐가?', 'Will you hear about the photograph?'],
      ['…조금 이따가 와서 듣겠습니다.', "...I'll come back and hear it in a little while."],
      ['그래. 늙은이 얘기는 길어. 시간 넉넉할 때 와.', "All right. An old man's story is long. Come when you've time to spare."]),   // 2 — 사진 이야기(이 자리 대화)
  ],
  'N13-3': [
    pa(['먼 길 또 왔구먼. 짐은 풀었나?', 'Come all this way again. Unpacked yet?'],
      ['…아직 짐도 다 못 풀었습니다.', "...I haven't even finished unpacking."],
      ['…그 친구가 또 무슨 말을 한 모양이구먼. 난 괜찮아. 짐부터 풀고 몸 좀 녹여. 바닷바람이 차.', "...Sounds like that writer's been talking again. I'm fine. Unpack first and warm yourself up. The sea wind's cold."]),   // 0 — 신진도로 돌아가기
    pa(['…그 난로, 손은 대 봤나?', 'That stove... have you had a go at it?'],
      ['…아직 손대지 못했습니다.', "...I haven't touched it yet."],
      ['…괜한 일이야. 그래도 볼 거면 연통부터 봐. 불이 붙었다 금방 죽는 건 대개 거기가 막혀서야.', "...There's no need. But if you're going to look, start with the flue. When a fire catches and dies straight off, it's usually blocked there."]),   // 1 — 난로 손보기(방식 고르기)
  ],

  // ── 고해나 ──
  'N08-2': [
    pa(['겨울 방어는 올리셨어요?', 'Brought up a winter yellowtail yet?'],
      ['…아직 걸지 못했습니다.', "...Haven't hooked one yet."],
      ['꼭 겨울 방어여야 해요. 기름이 올라서 차이가 칼에서만 나거든요. 크기는 상관없으니까 싱싱한 걸로요.', "It has to be a winter one. They're so rich the only difference is the knife. Size doesn't matter, just make it fresh."]),   // 0 — 겨울 방어 한 마리
    pa(['그쪽 칼솜씨도 보고 싶어요. 회는 떠 보셨어요?', "I'd like to see your knife work too. Have you sliced any sashimi yet?"],
      ['…아직 칼을 대 보지 못했습니다.', "...I haven't put a knife to it yet."],
      ['직접 잡은 걸로 떠 보세요. 칼은 누르지 말고 길게 한 번에 당기는 거예요. 아빠 상은 제가 차릴게요.', "Slice one you caught yourself. Don't press the knife. Draw it long, in one stroke. I'll set Dad's table."]),   // 1 — 회뜨기 1회
  ],
  'N08-3': [
    pa(['제가 세운 자리에서 방어 나왔어요?', 'Any yellowtail from where I put us?'],
      ['…아직 입질도 받지 못했습니다.', "...Not even a bite yet."],
      ['다른 데 말고 꼭 제가 세운 자리에서요. 배가 자리 잡고 멈추면 그때 던져 주세요.', "Not anywhere else, it has to be where I put us. Cast once the boat settles and stops."]),   // 0 — 해나가 세운 자리 방어
    pa(['아빠가 뱃머리에 계실 때, 한 항차 나가 볼래요?', "While Dad's up at the bow, shall we take her out for a run?"],
      ['…조금 이따가 함께 나가겠습니다.', "...I'll go out with you in a little while."],
      ['네, 기다릴게요. 구명조끼는 꼭 입어 주세요. 속도는 안 내고, 물 잔잔한 데서만 돌릴게요.', "Okay, I'll wait. Please wear a life jacket. I won't push the speed, and I'll only turn in calm water."]),   // 1 — 해나의 조타로 한 항차(이 자리)
  ],

  // ── 모태조 ──
  'N06-2': [
    pa(['루어로 세 마리, 다 채웠어?', 'Three on lures yet?'],
      ['…아직 모자랍니다.', '...Still short.'],
      ['물이 바뀌면 루어도 바꿔. 빠르면 무거운 거, 깊으면 가라앉는 거, 탁하면 눈에 띄는 거. 하늘이 보는 앞에서.', 'When the water changes, change the lure. Fast water, something heavy. Deep, something that sinks. Murky, something loud. Where Haneul can see.']),   // 0 — 루어로 세 마리
  ],
  'N06-4': [
    pa(['대결 전에 부산 물부터 다시 읽어 봤어?', 'Read the Busan water again before the match?'],
      ['…아직 제대로 보지 못했습니다.', "...I haven't had a proper look yet."],
      ['조류랑 탁도는 미리 봐 둬. 물은 그날그날 다르지만, 실측해 본 손은 안 잊어.', "Check the current and the murk ahead of time. The water changes day to day, but hands that have measured don't forget."]),   // 0 — 부산으로 돌아가기
    pa(['졸업 대결, 두 마리 다 올렸어?', 'The graduation match. Landed both?'],
      ['…아직 다 올리지 못했습니다.', '...Not both yet.'],
      ['봐주지 마. 먼저 올리는 쪽이 아니라 물을 읽고 올리는 쪽이 이기는 거야. 호수 공 굴러가면 네가 주워.', "No holding back. It's not whoever lands first, it's whoever reads the water and lands. If Hosu's ball rolls off, you fetch it."]),   // 1 — 대결 두 마리
  ],
};
