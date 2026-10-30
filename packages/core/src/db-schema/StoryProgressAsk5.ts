/**
 * @file StoryProgressAsk5.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) — 탁만수 · 배누리 · 나기범 · 한봄 · 마라 · 고호수 편.
 *
 * 말투
 *  - 탁만수(78 · 죽간 공방) — 짧고 무뚝뚝한 반말(「-냐」 「-라」) · 정옥선은 끝내 「그 사람」 · 다섯째 편(병실 앞 복도)부터 「자네」와 하게체.
 *  - 배누리(17 · 방파제부 부장) — 들뜬 해요체 · 「낚으면 먹는다」. 주인공은 앞 세 편 합니다체, 원정 뒤로는 해요체.
 *  - 나기범(28 · 내향 달인) — 짧은 해요체 · 말보다 칼. 한봄(17) — 밝은 해요체 · 언니 이야기.
 *  - 마라(19) — 말끝을 흐리는 짧은 해요체. 고호수 — 선배 말을 옮기는 해요체(「-래요」).
 */
import { pa } from './StoryProgressAskKit.js';
import type { ProgressAskDef } from '../types/Story.js';

export const PROGRESS_ASKS_5: Record<string, ProgressAskDef[]> = {
  // ── 탁만수 ──
  'M1-08': [
    pa(['도면 준 거, 하나라도 만들어 봤냐?', 'Made anything from that plan yet?'],
      ['…아직 손도 못 댔습니다.', "...I haven't even started."],
      ['살 생각부터 하지 마라. 손으로 하나 만들어 봐야 뭐가 모자란지 안다.',
        "Don't think about buying first. Make one with your own hands and you'll see what's missing."]), // 0 — 도면 하나 만들기
    pa(['백팩은 만들어서 등에 메 봤냐?', 'Have you made the backpack and put it on?'],
      ['…아직 메 보지 못했습니다.', "...I haven't worn it yet."],
      ['삐뚤어도 된다. 만들었으면 메라. 만들어 놓고 안 쓰는 게 제일 바보다.',
        "Crooked is fine. If you made it, wear it. Making something and not using it is the stupidest thing there is."]), // 1 — 간이 백팩 메기
  ],
  'M3-09': [
    pa(['뱃값 밑천은 좀 쌓았냐?', 'Built up any money towards the boat?'],
      ['…아직 다 쌓지 못했습니다.', "...Not enough yet."],
      ['잡는 대로 위판에 올려라. 한 건씩 쌓인 게 뱃값이 된다. 배는 기다려 주지 않는다.',
        "Put whatever you catch up for auction. Lot by lot, that's what pays for a boat. A boat doesn't wait."]), // 0 — 위판 여덟 건
    pa(['새 죽간, 받아 갈 테냐?', 'Are you taking the new blank?'],
      ['…조금 이따 받으러 오겠습니다.', "...I'll come back for it a little later."],
      ['그래. 여기 둔다. 부러진 대는 두고, 새 대 들고 배 보러 가라.',
        "Fine. It stays here. Leave the broken rod, take the new one, and go look at that boat."]), // 1 — 새 죽간 받기(이 자리)
  ],
  'N02-1': [
    pa(['학꽁치는 올렸냐?', 'Landed a halfbeak yet?'],
      ['…아직 못 올렸습니다.', "...Not yet."],
      ['학꽁치는 물 위쪽에 뜬다. 깊이 내리지 마라. 새벽이가 먼저 올리면 내기는 그 애 거다.',
        "Halfbeak swim near the top. Don't drop it deep. If Saebyeok lands one first, the bet's his."]), // 0 — 학꽁치 1마리
    pa(['새벽이랑 내기는 걸었냐?', 'Have you made that bet with Saebyeok?'],
      ['…아직 새벽이를 만나지 못했습니다.', "...I haven't met Saebyeok yet."],
      ['그 애는 내기라면 먼저 달려든다. 열두 살이라고 얕보지 마라. 눈은 나보다 좋다.',
        "That boy jumps at any bet. Don't go easy on him because he's twelve. His eyes are better than mine."]), // 1 — 새벽과 내기
  ],
  'N02-2': [
    pa(['태안 가서 새벽이는 찾았냐?', 'Did you find Saebyeok in Taean?'],
      ['…아직 찾지 못했습니다.', "...Not yet."],
      ['갯벌 뒤 대나무 숲이다. 마디 두드리는 소리가 나면 그 애가 거기 있다.',
        "The bamboo grove behind the mudflat. Where you hear someone tapping on nodes, that's him."]), // 0 — 태안에서 새벽 찾기
    pa(['태안 농어는 낚아 봤냐?', 'Caught a sea bass in Taean yet?'],
      ['…농어는 아직 소식이 없습니다.', "...No sea bass so far."],
      ['그 애랑 나란히 서서 낚아라. 같이 낚은 고기는 오래 기억에 남는다.',
        "Fish side by side with the boy. A fish you catch together stays with you a long time."]), // 1 — 농어 1마리
  ],
  'N19-1': [
    pa(['얼음 나르는 일은 해 봤냐?', 'Have you done an ice run yet?'],
      ['…아직 얼음을 나르지 못했습니다.', "...I haven't hauled any ice yet."],
      ['얼음 나르는 날 그 김에 들르면 된다. 일부러 가는 티는 내지 마라.',
        "Drop by on a day you're hauling ice anyway. Don't make it look like you went on purpose."]), // 0 — 얼음 나르기 1회
    pa(['받침은 만복상회에 놓고 왔냐?', 'Did you leave the rest at Manbok Store?'],
      ['…아직 놓고 오지 못했습니다.', "...I haven't dropped it off yet."],
      ['좌판 얼음통 밑에 수평 맞춰 밀어 넣기만 하면 된다. 그 사람이 묻기 전에 나와라.',
        "Just slide it level under the ice tub at the stall. Get out before she asks anything."]), // 1 — 받침 전하기(방식은 이 자리)
    pa(['그 사람 좌판엔 들러 봤냐?', 'Have you been by her stall?'],
      ['…아직 정옥선 씨께 들르지 못했습니다.', "...I haven't been to see Okseon yet."],
      ['들러서 얼음이 오래 가는지만 보고 와라. 그 사람이 무슨 말을 하든 그냥 듣고 오고.',
        "Go by and just see whether the ice is lasting. Whatever she says, just listen and come back."]), // 2 — 정옥선의 반응
  ],
  'N02-5': [
    pa(['갯가에서 쓸 만한 토막은 주워 왔냐?', 'Found any usable lengths on the shore?'],
      ['…아직 다 줍지 못했습니다.', "...I haven't gathered enough yet."],
      ['속초 갯가를 훑다 보면 밀려온 대나무 토막이 나온다. 갈라진 건 두고 성한 것만 챙겨라.',
        "Comb the Sokcho shore and you'll turn up bamboo washed in. Leave the split ones, keep only the sound ones."]), // 0 — 대나무 토막 2개
    pa(['쓸 만한 대는 골랐냐?', 'Picked out the usable pole yet?'],
      ['…아직 고르지 못했습니다.', "...Not yet."],
      ['눈으로 고르지 말고 손으로 만져 봐라. 굵다고, 곱다고 다 좋은 대는 아니다.',
        "Don't pick by eye. Pick by feel. Thick or pretty doesn't make a good pole."]), // 1 — 대나무 고르기(방식은 이 자리)
    pa(['고른 까닭, 말해 볼 테냐?', 'Going to tell me why you chose it?'],
      ['…조금 더 생각해 보고 말씀드리겠습니다.', "...Let me think it over a little more first."],
      ['그래. 손에 남은 걸 말로 꺼내 와라. 까닭 없이 고른 대는 까닭 없이 부러진다.',
        "Fine. Put into words what your hands felt. A pole chosen for no reason breaks for no reason."]), // 2 — 왜 그것인지(이 자리)
  ],
  'N19-3': [
    pa(['먼 데 다니다 이제 속초로 들어온 거냐?', 'Back in Sokcho from your travels, then?'],
      ['…잠깐 들른 겁니다. 곧 돌아오겠습니다.', "...Just passing through. I'll be back soon."],
      ['그래. 받침은 그때 가져가라. 깎아 둔 건 어디 안 간다.',
        "Right. Take the rest when you're back, then. What's carved isn't going anywhere."]), // 0 — 속초로 돌아간다
    pa(['두 번째 받침, 좌판에 놓고 왔냐?', 'Did you leave the second rest at the stall?'],
      ['…아직 좌판에 가지 못했습니다.', "...I haven't been to the stall yet."],
      ['물 빠지는 쪽이 바다 쪽으로 가게 놔라. 이번에도 내가 줬다고는 하지 말고.',
        "Set it so the water drains towards the sea. And again, don't say it came from me."]), // 1 — 두 번째 받침(방식은 이 자리)
  ],
  'N19-5': [
    pa(['…자네, 병원에는 가 봤나?', '...Have you been to the hospital?'],
      ['…아직 병원에 가 보지 못했습니다.', "...I haven't been there yet."],
      ['나는 먼저 가 있겠네. 복도에 있을 거다. …들어가지는 못하고.',
        "I'll go on ahead. I'll be in the corridor. ...I can't go in."]), // 0 — 속초 병원으로
    pa(['…병실 문 앞까지, 자네가 같이 가 주겠나?', '...Will you walk with me as far as the ward door?'],
      ['…병실 앞부터 먼저 보고 오겠습니다.', "...Let me go and look at the ward first."],
      ['그래. 나는 이 벽에 좀 더 기대 있겠네. 가다가 내가 서거든 팔만 좀 잡아 주게.',
        "All right. I'll lean on this wall a while longer. If I stop on the way, just take my arm."]), // 1 — 병실로 들여보내기(방식은 이 자리)
  ],

  // ── 배누리 ──
  'N04-1': [
    pa(['학꽁치는 좀 올렸어요?', 'Caught any halfbeak yet?'],
      ['…사비키는 흔들고 있는데, 아직입니다.', "...I'm jigging the sabiki, but nothing yet."],
      ['사비키는 살살 흔들어야 돼요. 학꽁치는 위쪽에 떠다니니까 너무 깊이 내리지 마세요!',
        "Jig the sabiki gently. Halfbeak cruise up high, so don't drop it too deep!"]), // 0 — 학꽁치 2마리
    pa(['그래서, 입부하실 거예요?', 'So, are you joining?'],
      ['…조금만 더 생각해 보겠습니다.', "...Let me think about it a bit more."],
      ['천천히 생각하세요! 그동안 낚은 건 같이 구워 먹어요. 낚으면 먹는다니까요.',
        "Take your time! Meanwhile we'll grill whatever we catch together. Catch it, eat it, remember."]), // 1 — 입부(이 자리)
  ],
  'N04-2': [
    pa(['도루묵은 올려 보셨어요?', 'Have you landed a sandfish yet?'],
      ['…아직 도루묵 구경도 못 했습니다.', "...I haven't so much as seen one yet."],
      ['도루묵은 겨울 새벽이에요. 알 낳으러 얕은 데로 들어와서 그때 방파제로 몰려요.',
        "Sandfish are a winter-dawn thing. They come into the shallows to spawn, and that's when they crowd the breakwater."]), // 0 — 도루묵(겨울 새벽 방파제)
    pa(['진주는 만나 봤어요?', 'Have you met Jinju?'],
      ['…아직 만나 보지 못했습니다.', "...I haven't met her yet."],
      ['새벽 방파제 끝에 있을 거예요. 말 걸면 도망가니까 옆에서 같이 낚기만 하세요.',
        "She'll be at the end of the breakwater before dawn. She runs if you talk to her, so just fish beside her."]), // 1 — 진주 입부
  ],
  'N04-3': [
    pa(['방파제에서 좀 낚으셨어요?', 'Caught anything off the breakwater?'],
      ['…아직 다 채우지 못했습니다.', "...Not enough yet."],
      ['두 마리는 올려야 애들이 봐요. 한 마리는 운이래요. 누가 그랬어요.',
        "You need two before the kids will watch. One is just luck, somebody said."]), // 0 — 방파제에서 2마리
    pa(['구경 온 애한테, 대 한번 쥐여 줄래요?', 'Will you put a rod in that curious kid\'s hands?'],
      ['…조금 이따 쥐여 주겠습니다.', "...I'll do it a little later."],
      ['손 떨어도 그냥 두세요. 처음엔 다 떨어요. 옆에서 같이 잡아 주기만 하면 돼요.',
        "If their hands shake, let them. Everyone shakes the first time. Just hold it with them."]), // 1 — 대를 쥐여 준다(이 자리)
  ],
  'N04-4': [
    pa(['어른 부원 체면은 지키셨어요?', "Have you saved the adult member's dignity yet?"],
      ['…아직 못 올렸어요.', "...Haven't landed one yet."],
      ['급하면 채비만 꼬여요. 도시락 한 입 먹고 천천히 던져요. 진주는 반칙이니까 빼고요!',
        "Rush it and you'll just tangle your rig. Have a bite of lunch and cast slowly. Jinju doesn't count, she's cheating!"]), // 0 — 학생들보다 먼저 1마리
  ],
  'N04-5': [
    pa(['청초고 앞에는 와 봤어요?', 'Have you come by Cheongcho High?'],
      ['…아직 거기까지 못 갔어요.', "...I haven't made it there yet."],
      ['학교 앞 벤치에서 기다릴게요. 오늘은 부장 말고, 그냥 저로요.',
        "I'll wait on the bench outside the school. Not as club captain today. Just as me."]), // 0 — 청초고로
    pa(['제 얘기, 끝까지 들어 줄 수 있어요?', 'Will you hear me out, all the way to the end?'],
      ['…조금 이따 제대로 들을게요.', "...I'll listen properly a little later."],
      ['네. 조언은 안 해도 돼요. 중간에 끊지만 말아 주세요.',
        "Okay. You don't have to give advice. Just don't cut me off halfway."]), // 1 — 끝까지 듣는다(이 자리)
  ],
  'N04-6': [
    pa(['저희랑 나란히 서서 좀 낚았어요?', 'Caught much standing alongside us?'],
      ['…아직 다 채우지 못했어요.', "...Not enough yet."],
      ['저희 옆에 서서 같이 던지면 돼요. 낚은 건 이따 다 같이 구워 먹어요!',
        "Just stand next to us and cast. Whatever we catch, we'll grill together later!"]), // 0 — 졸업한 부원들과 3마리
    pa(['깃발은 2층에 걸어 줄 거죠?', "You'll hang the flag upstairs, right?"],
      ['…조금 이따 걸게요.', "...I'll hang it a little later."],
      ['2층에서 제일 잘 보이는 데요! 낚으면 먹는다, 그 글자가 밖에서도 보이게요.',
        "The spot upstairs that shows the most! So 'Catch it, eat it' can be read from outside."]), // 1 — 부 깃발(이 자리)
  ],

  // ── 나기범 ──
  'M2-04': [
    pa(['통발은 꾸준히 걷고 있어요?', 'Hauling the traps regularly?'],
      ['…아직 다 걷지 못했습니다.', "...I haven't hauled them all yet."],
      ['한 번에 몰아 오지 않아도 돼요. 걷는 대로 가져와요. 저는 값보다 꾸준한 걸 봐요.',
        "No need to bring it all at once. Bring it as you haul. I'm looking for steady, not price."]), // 0 — 통발 세 번
    pa(['넘기기 전에 손질은 해 봤어요?', 'Done any butchering before handing them over?'],
      ['…아직 손질까지는 못 했습니다.', "...I haven't got as far as butchering yet."],
      ['피 빼고 내장만 깔끔하게 걷어 와요. 거기까지만 하면 회는 제가 떠요.',
        "Bleed them and clear the guts cleanly. Do that much and I'll handle the slicing."]), // 1 — 세 마리 손질
  ],
  'N05-3': [
    pa(['무늬오징어, 좀 올렸어요?', 'Got any bigfin squid up?'],
      ['…에기는 던지고 있는데, 아직입니다.', "...I'm casting the egi, but nothing yet."],
      ['에기를 바닥까지 가라앉혔다가 튕겨요. 무늬는 내려갈 때 안아요. 저는 옆에서 조용히 던질게요.',
        "Let the egi sink to the bottom, then jerk it up. The squid grab it on the way down. I'll cast quietly beside you."]), // 0 — 무늬오징어 2마리
    pa(['…제 얘기, 지금 들어 줄래요?', '...Will you hear me out now?'],
      ['…조금 이따 제대로 듣겠습니다.', "...I'll hear you properly a little later."],
      ['네. 말리지는 마요. 결정은 벌써 했으니까요.',
        "Okay. Just don't try to stop me. I've already decided."]), // 1 — 기범의 결심(이 자리)
  ],
  'N05-5': [
    pa(['저희 둘 몫은 낚았어요?', 'Caught enough for the two of us?'],
      ['…아직 두 분 몫을 다 못 채웠습니다.', "...Not enough for both of you yet."],
      ['크지 않아도 돼요. 싱싱한 걸로요. 정가 낸 손님이니까 그건 지켜 줘요.',
        "It doesn't have to be big. Just fresh. We paid full price, so hold to that much."]), // 0 — 두 사람 몫 2마리
    pa(['저희 둘 회는 떠 놨어요?', 'Have you sliced sashimi for the two of us?'],
      ['…아직 회를 뜨지 못했습니다.', "...I haven't sliced any yet."],
      ['배 위에선 칼을 몸에 붙이고 짧게 끊어요. 흔들릴 때 길게 당기면 살이 찢어져요.',
        "On a boat, keep the knife close to your body and cut short. Draw long while it's rocking and the flesh tears."]), // 1 — 두 사람에게 회
    pa(['하린이는 만났어요?', 'Have you met Harin?'],
      ['…아직 서하린 씨를 못 만났습니다.', "...I haven't met Harin yet."],
      ['명부에 이름 써 놓고 기다릴 거예요. 카메라는… 이번엔 먼저 물어본대요.',
        "She'll have signed the book and be waiting. The camera... she says she'll ask first this time."]), // 2 — 첫 예약 손님 맞기
  ],
  'N05-7': [
    pa(['가게에는 와 봤어요?', 'Have you been by the shop?'],
      ['…아직 가게에 들르지 못했습니다.', "...I haven't been by yet."],
      ['부산에 낸 작은 가게예요. 손님은 없고 수조만 돌아가요. 그 소리 나는 데로 와요.',
        "It's a small place in Busan. No customers, just the tank running. Follow the hum."]), // 0 — 부산으로
    pa(['가게에서 회, 떠 봤어요?', 'Sliced any sashimi in the shop?'],
      ['…아직 칼을 잡지 못했습니다.', "...I haven't picked up the knife yet."],
      ['수조에 있는 걸로 떠요. 어차피 팔 데도 없어요. 손님 없어도 회는 떠야 가게니까요.',
        "Use what's in the tank. There's nowhere to sell it anyway. Even with no customers, a shop has to slice to be a shop."]), // 1 — 가게에서 회뜨기
  ],

  // ── 한봄 ──
  'N09-1': [
    pa(['갯바위에서 한 마리, 올렸어요?', 'Landed one off the rocks yet?'],
      ['…아직 소식이 없습니다.', "...Nothing yet."],
      ['한 마리면 돼요. 잡으면 바로 해 먹을래요! 대신 발 디딜 데부터 보고 던져요.',
        "One's enough. The moment we catch it, I'm cooking it! But check your footing before you cast."]), // 0 — 갯바위에서 1마리
    pa(['저 혼자는 또 미끄러질 것 같은데, 같이 가 줄래요?', "I think I'll slip again on my own. Will you come with me?"],
      ['…조금 이따 같이 가겠습니다.', "...I'll come with you a little later."],
      ['그럼 기다릴게요! 초록색 낀 바위는 밟지 말고 오세요. 거기가 제일 미끄러워요.',
        "Then I'll wait! Don't step on the green slimy rock on your way. That's the slipperiest."]), // 1 — 봄을 붙잡는다(이 자리)
  ],
  'N09-2': [
    pa(['도마에 올릴 거, 좀 낚았어요?', 'Caught anything for the board yet?'],
      ['…아직 도마에 올릴 만큼은 못 낚았습니다.', "...Not enough for the board yet."],
      ['언니 옆에서 던져 봐요. 언니는 말은 없어도 어디서 무는지 다 알아요.',
        "Try casting next to my sister. She doesn't talk, but she knows exactly where they bite."]), // 0 — 2마리 낚기
    pa(['손질은 해 봤어요?', 'Done any butchering yet?'],
      ['…아직 칼을 대지 못했습니다.', "...I haven't put a knife to them yet."],
      ['직접 낚은 걸로 해요. 피 먼저 빼고요. 뼈에 살 남기면 언니가 다 봐요.',
        "Use fish you caught yourself. Bleed them first. Leave meat on the bone and my sister will see it all."]), // 1 — 손질 2회
  ],

  // ── 마라 ──
  'M5-07': [
    pa(['…무늬오징어, 올렸어요?', '...Got a bigfin squid up?'],
      ['…아직이에요. 에기만 던지고 있어요.', "...Not yet. Just casting the egi."],
      ['가을 밤, 얕은 데요. 튕기고 나서 에기가 천천히 떨어지게 둬요. 무늬는 떨어질 때 안아요.',
        "Autumn nights, shallow water. After you jerk it, let the egi fall slowly. They grab it on the fall."]), // 0 — 가을 밤 에깅
  ],

  // ── 고호수 ──
  'N06-1': [
    pa(['농어, 걸어 보셨어요?', 'Hooked a sea bass yet?'],
      ['…아직 못 걸었습니다.', "...Not yet."],
      ['선배가 그러는데요, 미노우를 수면에서 쭉 긋는 거래요. 뭐가 따라와도 멈추지 말래요!',
        "A senior says you draw the minnow straight across the surface. Even if something follows, don't stop!"]), // 0 — 농어 1마리(루어)
  ],
};
