/**
 * @file StoryProgressAsk7.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) — 바람 · 오세찬 · 짐 강 · 채파도 · 문필구 편.
 */
import { pa } from './StoryProgressAskKit.js';
import type { ProgressAskDef } from '../types/Story.js';

export const PROGRESS_ASKS_7: Record<string, ProgressAskDef[]> = {
  // ── 바람 ──
  'M3-04': [
    pa(['덕장에 걸 물고기는 낚아 왔나?', 'Have you caught the fish for the racks?'],
      ['…아직 다 채우지 못했습니다.', "...I haven't got enough yet."],
      ['청어만 기다리지 말고, 지금 바다에서 올라오는 놈을 낚게. 바다가 바뀌면 사람이 바뀌어야지.',
        "Don't sit waiting for herring — catch whatever the sea is giving now. When the sea changes, people have to change."]), // 0 — 덕장에 걸 물고기 3
    pa(['말리는 일은 끝까지 해 봤나?', 'Have you seen a drying through to the end?'],
      ['…아직 끝까지 해 보지 못했습니다.', "...I haven't seen one through yet."],
      ['말리는 건 낚시와 다른 시계로 가네. 중간에 걷지 말고 다 마를 때까지 두게. 기다리는 것도 일이야.',
        "Drying runs on a different clock from fishing. Don't take it down halfway — leave it till it's done. Waiting is work too."]), // 1 — 건조·숙성 제작
  ],
  'M5-02': [
    pa(['표지 밖에서 캘 건 다 캤나?', 'Got everything you need from outside the markers?'],
      ['…아직 다 캐지 못했습니다.', '...Not all of it yet.'],
      ['표지석부터 눈으로 확인하고, 그 밖에서만 캐게. 안쪽이면 손 떼고, 해녀가 보고 있거든 먼저 인사하게.',
        "Check the marker stones with your own eyes first and only gather outside them. If you're inside, hands off — and if a haenyeo is watching, greet her first."]), // 0 — 표지 밖에서 세 개체
  ],
  'N01-1': [
    pa(['손주 생일상에 올릴 도다리는 낚았나?', "Caught the flounder for the grandchild's birthday table?"],
      ['…아직 못 낚았습니다.', '...Not yet.'],
      ['도다리는 바닥에 붙어 사네. 채비를 멀리 던져 바닥에 앉혀 두고, 느긋하게 기다리게.',
        'Flounder live flat on the bottom. Cast the rig out far, let it settle on the bottom, and wait it out.']), // 0 — 도다리 1
    pa(['리어카 도면, 지금 받아 가겠나?', 'Want to take the cart blueprint now?'],
      ['…조금 이따가 받으러 오겠습니다.', "...I'll come back for it a bit later."],
      ['그렇게 하게. 도면은 내가 잘 챙겨 두지. 어디 안 가니 서두를 것 없네.',
        "Do that. I'll keep it safe. It's not going anywhere, so there's no rush."]), // 1 — 리어카 도면 받기
  ],
  'N01-2': [
    pa(['애한테 보여 줄 전갱이는 올렸나?', 'Landed a horse mackerel to show the kid?'],
      ['…아직 못 올렸습니다.', "...Not yet."],
      ['전갱이는 떼로 다니니 한번 붙으면 금방이야. 애가 옆에서 보고 있으니 조급해하지 말게. 한 마리면 되네.',
        "Horse mackerel move in schools — once they're around, it goes quick. The kid's watching, so don't get antsy. One is all it takes."]), // 0 — 전갱이 1
    pa(['다리 밑에, 지금 같이 가 보겠나?', 'Shall we head under the bridge now?'],
      ['…조금만 있다가 가겠습니다.', '...Give me a little while.'],
      ['그러세. 가서도 애한테 억지로 말 걸 것 없어. 옆에 앉아 낚시만 해도 마음은 전해지네.',
        "All right. Once we're there, don't force talk on the kid. Just sit beside him and fish — it gets across."]), // 1 — 다리 밑 소년
  ],
  'N01-3': [
    pa(['덕장에 걸 건 만들어 봤나?', 'Made anything to hang on the racks?'],
      ['…아직 만들어 보지 못했습니다.', "...I haven't made anything yet."],
      ['청어가 아니어도 말릴 건 있네. 지금 드는 걸로 하나 말려 대에 걸어 보게. 빈 대보다는 낫지.',
        "Herring or no, there's always something to dry. Dry something that's running now and hang it up. Better than an empty rack."]), // 0 — 건조품 1점
    pa(['덕장 주인 얘기, 지금 들어 줄 수 있겠나?', 'Can you sit and hear the rack owner out now?'],
      ['…조금 뒤에 들으러 가겠습니다.', "...I'll go and listen a bit later."],
      ['알겠네. 들을 땐 끝까지 듣고, 중간에 말 끊지 말게. 답은 없어도 듣는 사람이 있으면 다르니까.',
        "Fine. When you do, hear him all the way through and don't cut in. Even without answers, having someone listen makes a difference."]), // 1 — 덕장 주인과 대화
  ],
  'N01-4': [
    pa(['벵에돔은 좀 붙던가?', 'Any blackfish coming around?'],
      ['…아직 소식이 없습니다.', '...Nothing yet.'],
      ['초여름 갯바위가 벵에돔 철이야. 발 디딜 자리부터 단단히 보고 서게. 그 사람이 뒤에서 다 보고 있으니.',
        'Early-summer rocks are blackfish season. Check your footing before anything else. He is watching every step from behind.']), // 0 — 벵에돔 1
  ],
  'N01-5': [
    pa(['딸은 만나 봤나?', 'Have you met the daughter yet?'],
      ['…아직 만나 보지 않았습니다.', "...Not yet, I haven't met her."],
      ['시간 잘 확인해서 너무 늦은 시간에 방문하지 않도록 하는 게 좋을 것 같네. 아 그리고, 저녁에 물속에 들어가는 건 위험하니까 조심하고.',
        'Mind the time. Best not to call on them too late. Oh, and going into the water in the evening is dangerous, so be careful.']), // 0 — 해솔에게 말 걸기(감독 원문)
    pa(['해솔이하고 물가 일은 잘돼 가나?', "How's the shore work with Haesol coming along?"],
      ['…아직 캘 만큼 캐지는 못했습니다.', "...We haven't gathered enough yet."],
      ['물때 잘 보고 물이 빠질 때 나가게. 물이 들기 시작하면 미련 두지 말고 나오고, 해솔이가 깊은 데로 가려 하거든 자네가 붙잡아 주게.',
        "Watch the tide and go out when it's ebbing. Once it starts coming in, don't linger — get out. And if Haesol tries to head for deeper water, you hold her back."]), // 1 — 물 빠질 때 해솔과 갯것 셋
    pa(['누님께 캔 걸 보여 드렸나?', 'Have you shown noonim what you gathered?'],
      ['…아직 찾아뵙지 못했습니다.', "...I haven't been to see her yet."],
      ['누님은 말수가 적은 사람이야. 대꾸가 없어도 서운해 말고, 캔 걸 보여 드리면서 있는 그대로 말씀드리게. 허리 다친 사람이니 오래 세워 두지는 말고.',
        "Noonim doesn't say much. Don't take it badly if she doesn't answer — show her what you gathered and tell her plainly how it went. And with her back the way it is, don't keep her standing long."]), // 2 — 해솔의 어머니께 보여 드리기
  ],
  'N01-6': [
    pa(['섬에서 낚시는 좀 되던가?', 'Fishing any good out on the island?'],
      ['…아직 시원찮습니다.', '...Not much so far.'],
      ['배 뜰 때까지 시간은 많네. 조급해하지 말고, 그 사람 얘기나 들어 주면서 느긋하게 던지게.',
        "There's plenty of time till the boat sails. No hurry — listen to him talk and cast at an easy pace."]), // 0 — 섬에서 2마리
    pa(['그 사람하고 하룻밤 같이 있어 주겠나?', 'Will you stay the night with him?'],
      ['…볼일 좀 보고 오겠습니다.', '...Let me take care of something first.'],
      ['다녀오게. 짐 많은 사람은 마음도 무거운 법이야. 와서는 말을 보태기보다 들어 주기만 하게.',
        "Go on, then. A man with that much baggage carries a heavy heart too. When you come, don't add words — just listen."]), // 1 — 섬에서의 하룻밤
  ],
  'N01-7': [
    pa(['내가 서 있던 그 자리에서 낚아 봤나?', 'Have you fished the spot where I used to stand?'],
      ['…아직 그 자리에서는 못 낚았습니다.', '...Not from that spot, not yet.'],
      ['서른 해 전 내가 서 있던 자리야. 바다는 그때나 지금이나 같으니, 서두르지 말고 한 마리만 올려 주게.',
        "That's where I stood thirty years ago. The sea there is the same as it ever was. Take your time and bring up just one."]), // 0 — 서른 해 전 그 자리에서 1마리
    pa(['…내 이름, 이제 들어 주겠나?', '...Will you hear my name now?'],
      ['…조금 있다가 다시 찾아뵙겠습니다.', "...I'll come back to you a little later."],
      ['괜찮네. 서른 해 묵힌 이름이야. 하루 더 기다린다고 달라질 건 없지.',
        "That's fine. It's a name I've kept for thirty years. One more day won't change anything."]), // 1 — 바람의 이름을 듣는다
  ],

  // ── 오세찬 ──
  'N21-1': [
    pa(['방파제 밑 불가사리는 주워 오셨어요?', 'Did you pick up the starfish under the breakwater?'],
      ['…아직 다 줍지 못했습니다.', "...I haven't picked them all up yet."],
      ['방파제 밑에 많이 밀려와 있어요. 주울 때 손바닥에 올려 보세요. 팔 짧고 넓으면 별, 길고 끝이 젖혀졌으면 아무르예요.',
        "Plenty have washed up under the breakwater. Put each one on your palm as you pick it up. Short, wide arms is a bat star; long arms with curled-up tips is an Amur."]), // 0 — 불가사리 3
    pa(['두 종 가리는 거, 지금 같이 해 볼까요?', 'Shall we sort the two kinds together now?'],
      ['…조금 뒤에 보여 드리겠습니다.', "...I'll show you a bit later."],
      ['그래요. 주운 건 섞이지 않게 두세요. 기록에는 어디서 주웠는지도 적어야 하거든요.',
        'All right. Keep what you picked up from getting mixed. The record needs where you found them, too.']), // 1 — 두 종의 차이
  ],
  'N21-2': [
    pa(['만 안쪽 해파리는 다 걷으셨어요?', 'Have you cleared the jellyfish from the inner bay?'],
      ['…아직 다 걷지 못했습니다.', "...I haven't cleared them all yet."],
      ['훌치기 바늘로 걸어서 천천히 끌어오면 돼요. 생각보다 무거우니까 허리 조심하시고, 맨손으로는 만지지 마세요.',
        "Hook them with a snagging hook and drag them in slowly. They're heavier than they look, so mind your back — and don't touch them bare-handed."]), // 0 — 보름달물해파리 5
  ],
  'N21-3': [
    pa(['아무르불가사리는 다 모으셨어요?', 'Got all the Amur seastars?'],
      ['…아직 모자랍니다.', '...Still short.'],
      ['팔 끝이 젖혀진 것만 담으세요. 별불가사리가 하나라도 섞이면 창구에서 그대로 돌려보내요.',
        'Only take the ones with curled-up arm tips. Mix in even one bat star and the window sends the lot back.']), // 0 — 아무르불가사리 8
    pa(['창구에 넘기는 거, 지금 하실래요?', 'Want to hand them in at the window now?'],
      ['…한 번 더 살펴보고 넘기겠습니다.', "...I'll check them over once more first."],
      ['잘 생각하셨어요. 하나씩 뒤집어서 팔 끝을 보세요. 창구 직원도 그렇게 봐요.',
        "Good thinking. Turn each one over and check the arm tips. That's exactly how the clerk looks."]), // 1 — 수매 창구에 넘긴다
  ],
  'N21-4': [
    pa(['가두리 앞은 좀 뚫렸어요?', 'Is the front of the pens clearing up?'],
      ['…아직 다 걷어 내지 못했습니다.', '...Not all of them, not yet.'],
      ['취수구 쪽부터 걷어 주세요. 거기까지 밀려가면 양식장이 숨을 못 쉬어요. 팔이 저리면 잠깐 쉬었다 해도 돼요.',
        "Start near the water intake. If they drift in there, the farm can't breathe. If your arms go numb, it's fine to rest a moment."]), // 0 — 보름달물해파리 10
  ],
  'N21-5': [
    pa(['노무라는 끌어올리셨어요?', 'Did you haul in the Nomura?'],
      ['…아직 못 끌어올렸습니다.', '...Not yet.'],
      ['한 마리에 이십 분은 걸려요. 천천히 당기세요. 장갑은 두 겹 끼시고, 촉수 가까이엔 팔을 대지 마세요.',
        'One takes a good twenty minutes. Pull slowly. Wear two pairs of gloves, and keep your arms away from the tentacles.']), // 0 — 노무라입깃해파리 1
    pa(['팔 좀 볼게요, 괜찮으세요?', "Let me see your arms — are you okay?"],
      ['…괜찮은 것 같습니다. 이따가 보여 드리겠습니다.', "...I think I'm fine. I'll show you later."],
      ['괜찮다고 넘기지 마세요. 노무라 촉수는 나중에 부어오르기도 해요. 따끔하거나 붉어지면 바로 오세요.',
        "Don't brush it off. Nomura stings can swell up later. If it stings or turns red, come straight to me."]), // 1 — 쏘이지 않았는지 확인
  ],
  'N21-6': [
    pa(['울릉 노무라는 좀 걷으셨어요?', 'Made any headway on the Ulleung Nomura?'],
      ['…아직 다 끌어올리지 못했습니다.', "...I haven't hauled them all in yet."],
      ['한 마리에 이십 분, 셋이면 한 시간이에요. 한 마리 올리면 숨 한번 돌리고, 장갑부터 다시 보세요.',
        'Twenty minutes each — three is an hour. After each one, catch your breath and check your gloves again.']), // 0 — 노무라입깃해파리 3
  ],
  'N21-7': [
    pa(['독도 노무라는 끌어올리셨어요?', 'Hauled in the Nomura at Dokdo?'],
      ['…아직 다 올리지 못했습니다.', '...Not all of them yet.'],
      ['무거우니까 한 마리씩, 천천히요. 올릴 때마다 세면서 하세요. 숫자로 남겨야 다음 사람이 손을 써요.',
        "They're heavy, so one at a time, slowly. Count each one as you bring it up. Unless it's left as numbers, the next person can't act on it."]), // 0 — 노무라입깃해파리 2
    pa(['보름달물해파리는 다 걷으셨어요?', 'Cleared all the moon jellyfish?'],
      ['…아직 덜 걷었습니다.', '...Not quite yet.'],
      ['노무라보다 가벼워도 수가 많아요. 걷은 건 걷은 대로, 남은 건 남은 대로 세어 두세요. 그게 기록이에요.',
        "Lighter than Nomura, but there are lots of them. Count what you've cleared and what's left, both. That's what a record is."]), // 1 — 보름달물해파리 10
    pa(['기록, 이제 넘겨 드려도 될까요?', 'Can I hand the log over to you now?'],
      ['…조금만 더 있다가 받겠습니다.', "...I'll take it a little later."],
      ['그래요, 서두를 거 없어요. 십오 년 치라 가볍지 않아요. 받을 마음이 들면 그때 오세요.',
        "Sure, no rush. Fifteen years of it isn't light. Come when you're ready to take it."]), // 2 — 관측 기록을 넘긴다
  ],

  // ── 짐 강 ──
  'M2-08': [
    pa(['볼락은 다 올렸어?', 'Got all your rockfish?'],
      ['…아직 셋을 못 채웠습니다.', "...I haven't made three yet."],
      ['빛 한가운데는 비어. 볼락은 빛 가장자리, 어둠과 만나는 데 붙어 있어. 루어를 거기로 천천히 지나가게 해.',
        'The middle of the light is empty. Rockfish hold at the edge, where the light meets the dark. Run your lure slowly through there.']), // 0 — 집어등 아래 볼락 3
  ],
  'N07-1': [
    pa(['대결 몫은 다 올렸어?', 'Landed your share for the match?'],
      ['…아직 채우지 못했습니다.', '...Not yet.'],
      ['대결은 한 번뿐이야. 같은 루어, 같은 자리에서 서두르지 말고 던져. 말은 다 던지고 나서 해.',
        "There's only one match. Same lure, same spot — don't rush your casts. Talk after you've thrown."]), // 0 — 대결 3마리
    pa(['대결, 지금 붙어 볼래?', 'Want to have the match now?'],
      ['…채비를 다시 보고 오겠습니다.', '...Let me check my rig again first.'],
      ['그래. 같은 루어로 붙는 거니 핑계는 없어. 매듭부터 다시 봐.',
        'Fine. Same lure on both sides, so no excuses. Start with your knots.']), // 1 — 첫 대결
  ],
  'N07-2': [
    pa(['포항 방어, 올렸어?', 'Landed the Pohang yellowtail?'],
      ['…아직입니다. 저킹이 덜 익었습니다.', "...Not yet. My jerking isn't there yet."],
      ['방어는 지그가 떨어질 때 물어. 저킹은 그 전 준비야. 쳐 올린 다음, 떨어지는 동안 줄을 지켜봐.',
        'Yellowtail hit the jig on the fall. The jerk just sets it up. After you rip it up, watch your line while it drops.']), // 0 — 방어 1(지깅)
  ],
  'N07-3': [
    pa(['만리포 농어, 올렸어?', 'Landed the Manripo sea bass?'],
      ['…아직 서프에서는 못 올렸습니다.', '...Not from the surf, not yet.'],
      ['포말대를 봐. 농어는 파도가 부서지는 안쪽에 있어. 미노우를 그 거품 밑으로 천천히 지나가게 해.',
        'Watch the foam line. Sea bass sit just inside where the waves break. Swim the minnow slowly under that foam.']), // 0 — 농어 1(서프)
  ],
  'N07-4': [
    pa(['제주 무늬오징어, 올렸어?', 'Landed the Jeju reef squid?'],
      ['…아직 에기만 오르내리고 있습니다.', "...So far my egi's just been going up and down."],
      ['에기는 떨어질 때가 전부야. 동생이 그렇게 만들었어. 쳐 올리고, 가라앉는 동안 기다려.',
        'With egi, the fall is everything. My brother made them that way. Snap it up, then wait while it sinks.']), // 0 — 무늬오징어 1(에기)
    pa(['유작 넷, 받을 준비 됐어?', 'Ready to take the four lures?'],
      ['…조금 더 생각해 보고 받겠습니다.', "...I'd like to think a little more before I take them."],
      ['그래. 박제할 생각이면 받지 마. 던질 마음이 들면 그때 와.',
        'Fine. If you mean to mount them on a wall, leave them. Come when you mean to throw them.']), // 1 — 유작 넷을 받는다
  ],

  // ── 채파도 ──
  'M4-03': [
    pa(['광어, 올라왔어요?', 'Got a flounder up yet?'],
      ['…아직 못 올렸어요.', '...Not yet.'],
      ['바닥에 붙여요! 봉돌로 바닥을 톡톡 치면서 기다리면 광어가 와요. 뜰채는 제가 댈게요. 아마요!',
        "Keep it on the bottom! Tap the sinker on the seabed and wait, and the flounder will come. I'll handle the net. Probably!"]), // 0 — 다운샷 광어
  ],
  'N11-2': [
    pa(['통발은 다 걷었어요?', 'Did you pull up the traps?'],
      ['…아직 다 못 걷었어요.', '...Not all of them yet.'],
      ['통발은 넣고 좀 기다려야 차요. 넣자마자 걷으면 빈 통이에요. …진짜 미안해요, 저 때문에.',
        "Traps need a bit of time in the water to fill. Pull them right away and they come up empty. ...I'm really sorry. It's my fault."]), // 0 — 통발 2회 수거
  ],
  'N11-4': [
    pa(['손님 몫, 다 채웠어요?', "Got enough for the customers' share?"],
      ['…아직이에요. 조금만 더요.', '...Not yet. Just a bit more.'],
      ['손님 채비는 제가 나눠 드릴게요. 손님 줄이랑 엉키지 않게 조금 떨어져서 던져 주세요.',
        "I'll hand out the customers' rigs. Just cast a little apart so you don't tangle with their lines."]), // 0 — 손님 몫 2마리
    pa(['저 이제 나가요, 같이 타 줄래요?', "I'm heading out now — will you ride along?"],
      ['…조금만 기다려 줘요. 금방 올게요.', "...Give me a minute. I'll be right back."],
      ['네! 키 잡고 기다릴게요. 손님 앞에서는 덜렁이 아닌 척할 거니까 웃으면 안 돼요.',
        "Okay! I'll wait at the wheel. I'm going to act like I'm not a klutz in front of the customers, so no laughing."]), // 1 — 첫 단독 출조 동승
  ],

  // ── 문필구 ──
  'N24-1': [
    pa(['내 찌로 한 마리 올려 봤냐?', 'Caught one on my float yet?'],
      ['…아직 못 낚았습니다.', '...Not yet.'],
      ['찌는 물에 세워 봐야 안다. 바로 서는지, 입질에 깔끔하게 잠기는지 눈 떼지 말고 봐라.',
        'You only know a float once it stands in the water. Keep your eyes on it — does it stand straight, does it go under cleanly on a bite.']), // 0 — 문필구의 찌로 1마리
    pa(['…건너편엔 들러 봤냐?', '...Been across the street yet?'],
      ['…아직 들르지 못했습니다.', "...I haven't dropped in yet."],
      ['길 하나만 건너면 된다. 뭘 사 오라는 소리는 아니다. 그 집 찌가 어떻게 생겼는지 눈으로만 보고 와.',
        "It's just across the road. I'm not telling you to buy anything. Just go and have a look at his floats."]), // 1 — 「영배 낚시」에 들르기
  ],
  'N24-2': [
    pa(['그놈 찌로 한 마리 낚아 봤냐?', 'Caught one on his float yet?'],
      ['…아직 못 낚아 봤습니다.', "...I haven't caught one on it yet."],
      ['파도 칠 때 그 찌가 서는지 눕는지 봐라. 그걸 봐야 그놈 앞에서 할 말이 생긴다.',
        "Watch whether his float stands or lies down when the waves hit. You need to see that before you've got anything to say to his face."]), // 0 — 건너편 찌로 1마리
    pa(['차영배, 그놈은 만나 봤냐?', 'Have you seen him yet — Cha Yeongbae?'],
      ['…아직 찾아가지 못했습니다.', "...I haven't gone to see him yet."],
      ['길만 건너면 그놈 가게다. 언성 높일 것 없이, 네가 물에서 본 대로만 말해라.',
        'His shop is just across the road. No need to raise your voice — just tell him what you saw on the water.']), // 1 — 차영배를 찾아간다
  ],
};
