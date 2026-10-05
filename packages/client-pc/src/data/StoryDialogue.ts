/**
 * @file StoryDialogue.ts
 * @description 스토리 NPC 대사 (134차 — Ch1 16퀘 전용 + 공용 폴백). 원칙 §1-5: 원작 대사·장면 비복제.
 *
 * 형식 = `[ko, en]` 쌍 — `I18n.buildRuntimeDict`가 같은 쌍을 사전에 합류시켜 영어 로케일에서도
 * 본문이 번역된다(합성 문자열 함정 회피 — 붙이기 전에 번역되는 원문 단위로 둔다).
 * 3톤 선택지(무뚝뚝/솔직/너스레)는 결과가 같고 호감도만 미세 차이(§5-1) — 지금은 표기만.
 */

export type Line = readonly [ko: string, en: string];

export interface QuestDialogue {
  /** 발주 시 (수락 전) */
  offer: Line[];
  /** 진행 중 재방문 */
  progress: Line;
  /** 완료 시 */
  done: Line[];
}

export const TONE_CHOICES: Line[] = [
  ['…알겠습니다.', '…Understood.'],
  ['솔직히 자신은 없지만, 해 보겠습니다.', 'Honestly, I\'m not sure I can — but I\'ll try.'],
  ['제가 또 그런 건 잘하죠.', 'That happens to be my speciality.'],
];

export const NPC_IDLE: Record<string, Line> = {
  okseon: ['할 일 없으면 얼음이나 날라. 울 시간에.', 'If you\'ve nothing to do, haul ice. Instead of crying.'],
  hyeonsu: ['굴러들어온 애가 아직도 있네.', 'The stray is still here.'],
  coop: ['실습생은 공동작업 시간에 맞춰 오도록.', 'Trainees come on time for community work.'],
  tak_mansu: ['대는 손에 맞아야 대다. 손을 보자.', 'A rod must fit the hand. Show me yours.'],
  kang_ducheol: ['이 매듭이… 자꾸 풀리는데 말이지.', 'This knot… it keeps coming undone.'],
  bae_nuri: ['낚으면 먹는다! 그게 우리 부 모토예요.', 'Catch it, eat it! That\'s our club motto.'],
  baram: ['바람 부는 쪽으로 가면 돼.', 'Just go where the wind blows.'],
};

/**
 * 214차 — 집에 있는 사람의 문을 두드렸을 때. [까닭] → 첫마디. 까닭: sleep(22~05시) · rest(일 끝나고) · dayoff(쉬는 날).
 * 없는 칸은 `DOOR_GENERIC`. 문 앞 나레이션은 `DOOR_NARR`.
 * ⚠ R12 — 이 대사 다음은 평소와 똑같은 대화 메뉴다. 시각 때문에 이야기가 막히지 않는다.
 */
export type DoorReason = 'sleep' | 'rest' | 'dayoff';

export const DOOR_NARR: Record<DoorReason, Line> = {
  sleep: ['(문을 두드리자 한참 뒤에야 안쪽에 불이 켜진다. 문이 반쯤 열린다.)', '(I knock. After a long pause a light comes on inside, and the door opens halfway.)'],
  rest: ['(문을 두드리자 안에서 발소리가 나고 문이 열린다.)', '(I knock. Footsteps inside, and the door opens.)'],
  dayoff: ['(문을 두드리자 느긋한 발소리와 함께 문이 열린다.)', '(I knock. Unhurried footsteps, and the door opens.)'],
};

export const DOOR_GENERIC: Record<DoorReason, Line> = {
  sleep: ['…이 시간에 무슨 일이에요?', '…What is it, at this hour?'],
  rest: ['아, 무슨 일이에요?', 'Oh — what is it?'],
  dayoff: ['오늘은 쉬는 날인데. 그래, 무슨 일이에요?', 'It\'s my day off. Well — what is it?'],
};

export const NPC_DOOR: Record<string, Partial<Record<DoorReason, Line>>> = {
  okseon: {
    sleep: ['아이고, 이 밤에 누구여… 너구나. 들어오진 말고 거기서 말해.', 'Goodness, who is it this late… oh, you. Don\'t come in. Say it from there.'],
    rest: ['좌판 접고 막 씻었다. 무슨 일이여?', 'I just packed up the stall and washed. What is it?'],
  },
  coop: {
    sleep: ['(당직 계원이 졸린 눈으로 문을 연다) 계장님은 퇴근하셨어요. 급한 거면 제가 받아 둘게요.', '(The night clerk opens the door, half asleep.) The chief has gone home. If it\'s urgent, I\'ll take it down.'],
    rest: ['(당직 계원이 문을 연다) 사무실은 닫았는데요, 말씀하세요. 전해 드릴게요.', '(The night clerk opens the door.) The office is closed, but go ahead. I\'ll pass it on.'],
    dayoff: ['(당직 계원) 일요일이라 문 닫았어요. 그래도 들은 건 전해 드릴게요.', '(The duty clerk.) We\'re closed on Sundays. I\'ll still pass on whatever you tell me.'],
  },
  hyeonsu: {
    sleep: ['…뭐야, 지금 몇 시인 줄 알아? 새벽 물때 보려면 자야 한다고.', '…What? Do you know what time it is? I need sleep if I\'m catching the dawn tide.'],
    rest: ['왜. 오늘 조과 자랑하러 왔냐?', 'What. Here to brag about today\'s catch?'],
  },
  kang_ducheol: {
    sleep: ['허허, 이 시간에. 늙은이 잠 다 깨웠네. 그래, 무슨 일인가?', 'Heh, at this hour. You\'ve woken an old man. Well, what is it?'],
    rest: ['어서 오게. 저녁 먹고 채비 정리하던 참이야.', 'Come in. I was just sorting my tackle after dinner.'],
  },
  tak_mansu: {
    sleep: ['(헛기침) 대나무는 밤에 안 깎네. 무슨 일인가.', '(A dry cough.) I don\'t carve bamboo at night. What is it.'],
    rest: ['공방 문은 닫았네. 그래도 들어 줄 말은 있지.', 'The workshop is closed. I can still listen.'],
  },
  tak_saebyeok: {
    sleep: ['(할아버지 뒤에서 눈을 비비며) …자고 있었는데. 무슨 일이에요?', '(Rubbing her eyes behind her grandfather.) …I was asleep. What is it?'],
    rest: ['아, 왔어요? 할아버지는 대나무 말리는 중이에요.', 'Oh, it\'s you. Grandpa\'s drying bamboo.'],
  },
  bae_nuri: {
    sleep: ['(민박 창문이 열린다) 헉, 이 시간에요? …쉿, 사장님 깨세요.', '(The guesthouse window slides open.) Whoa, now? …Shh, you\'ll wake the owner.'],
    rest: ['아, 저 민박에서 쉬고 있었어요! 무슨 일이세요?', 'Oh, I was resting at the guesthouse! What\'s up?'],
  },
};

/** 문 앞 첫마디 — 인물 전용이 없으면 공용 */
export function doorLineOf(npcId: string, reason: DoorReason): Line {
  return NPC_DOOR[npcId]?.[reason] ?? NPC_DOOR[npcId]?.rest ?? DOOR_GENERIC[reason];
}

export const STORY_DIALOGUE: Record<string, QuestDialogue> = {
  'M1-02': {
    offer: [
      ['울 거면 얼음부터 나르고 울어.', 'If you\'re going to cry, haul the ice first.'],
      ['좌판 뒤에서 네 몫의 얼음 상자를 받아. 인벤토리에서 확인하고, 경매장 옆 지정 자리에 내려놓은 뒤 다시 와.', 'Take your ice crate from behind the stall. Check it in your inventory, place it at the marked spot by the auction hall, then come back.'],
    ],
    progress: ['상자를 인벤토리에서 확인했으면 경매장 옆 파란 표시까지 옮겨. 내려놓고 나서 다시 와.', 'Once you have checked the crate in your inventory, carry it to the blue mark by the auction hall. Come back after placing it.'],
    done: [
      ['품삯이다. 적어도 이건 네 돈이야.', 'Your wages. At least this is your money.'],
      ['시장 안쪽 상점은 얼음이랑 미끼를 판다. 값은 매일 바뀐다.', 'The shop inside sells ice and bait. Prices change daily.'],
    ],
  },
  'M1-03': {
    offer: [
      ['좌판 뒤에 옛날 어촌계 숙소가 있어. 먼지는 네가 털어.', 'There\'s the old co-op lodging behind the stall. Dust it yourself.'],
      ['이건 실습생 증이다. 여긴 처음 온 사람이 바로 계원 되는 곳이 아니야. 우리 계는 육 개월이야. 딴 데는 삼 년도 받아. 일부터 배워.',
        'This is your trainee card. Nobody becomes a member the day they arrive here. Our co-op takes six months. Some take three years. Learn the work first.'],
    ],
    progress: ['숙소 침대는 봐 뒀어? 저장은 그 침대에서 한다. 피곤하면 거기서 자고.', 'Have you seen the bed at the lodging? That bed is where you save. Sleep there when you\'re tired.'],
    done: [
      ['오늘부터 백팔십 일이다. 달력에 적어 둬.', 'One hundred and eighty days from today. Mark the calendar.'],
      ['※ 본 게임의 \'6개월 실습기간\'은 게임 진행을 위한 설정입니다. 실제 어촌계의 가입 자격·거주기간·가입 절차는 각 어촌계의 정관 및 관련 법령에 따라 다를 수 있습니다.',
        '※ The six-month training period is a game device. Real co-op membership rules, residency and procedures vary by co-op and by law.'],
    ],
  },
  'M1-04': {
    offer: [
      ['거기 테트라포드 구멍에 우럭 있어. 근데 그 대로 하면 부러져.', 'There\'s rockfish in that tetrapod hole. But that rod will snap.'],
      ['그 대는 아까우니까 여기다 쓰지 마. 생활용품점 가서 싸구려로 맞춰 와. 이만 원이면 돼.', 'Don\'t waste that rod here. Get a cheap set from the daily-goods store. Twenty thousand won will do.'],
    ],
    progress: ['구멍에 수직으로 넣고, 바닥 닿으면 살짝. 입질 오면 바로 짧게 챔질. 그리고 감아 올려 — 쓸리면 끊긴다.',
      'Drop it straight into the hole, tap when it hits bottom. Short hookset the moment it bites. Then reel up — rubbing cuts the line.'],
    done: [['…한 마리 잡았네. 운이지.', '…You got one. Luck.']],
  },
  'M1-05': {
    offer: [
      ['이제 그 대를 펴 봐. 아버지 대라며.', 'Now open that rod. Your father\'s, you said.'],
      ['왼쪽 클릭 누르고 있으면 힘이 차고, 놓으면 날아간다. 바람 봐라.', 'Hold left-click to charge, release to cast. Watch the wind.'],
    ],
    progress: ['초릿대 끝을 봐. 세 번째로 크게 휠 때 우클릭이다.', 'Watch the rod tip. On the third big bend, right-click.'],
    done: [['그 대, 잘 휘네. 좋은 대야. 부러뜨리지 마.', 'That rod bends well. A good one. Don\'t break it.']],
  },
  'M1-06': {
    offer: [
      ['네가 잡은 건 네가 먹어라. 그게 법이다.', 'What you catch, you eat. That is the law.'],
      ['계원이 돼도 낚싯대로 잡은 건 못 판다. 팔 수 있는 건 통발이랑 맨손으로 잡은 것뿐이야. 그것도 신고를 해야.',
        'Even as a member you can\'t sell rod-caught fish. Only trap and hand-gathered catch — and only once you\'re registered.'],
      ['작은 건 재고 놔줘. 금어기도 있어. 그건 벌금이 아니라 예의다.', 'Measure the small ones and let them go. There are closed seasons too. That\'s manners, not fines.'],
    ],
    progress: ['작은 놈 잡히면 자로 재고 놔주는 거 잊지 마.', 'When a small one bites, measure it and let it go.'],
    done: [['됐다. 이제 팔 수 없는 물고기가 뭔지는 알겠지.', 'Good. Now you know which fish you cannot sell.']],
  },
  'M1-07': {
    offer: [
      ['이 년 만에 제대로 된 밥 먹어 보자. 비늘부터.', 'Let\'s have a proper meal for the first time in two years. Scales first.'],
      ['도마에 올려. 순서가 있어. 시메, 방혈, 비늘, 머리, 내장. 그다음이 회다.', 'Put it on the board. There\'s an order. Ikejime, bleed, scale, head, guts. Then sashimi.'],
    ],
    progress: ['손질은 했어? 회는 떴고?', 'Have you butchered it? Sliced it?'],
    done: [['…먹을 만하네. 냉장고에 넣어. 상하면 못 먹어.', '…It\'s edible. Put it in the fridge. Spoiled means wasted.']],
  },
  'M1-08': {
    offer: [
      ['짐부터 어떻게 좀 해라. 그 주머니로 뭘 하겠다고.', 'Sort your baggage out first. What can you do with those pockets?'],
      ['방수천 조각, 폐로프, 버클. 바늘하고 실. 제작 탭에서 엮어 봐.', 'Scraps of tarp, old rope, a buckle. Needle and thread. Put it together on the crafting tab.'],
    ],
    progress: ['만들었으면 등에 메 봐야 아는 거다.', 'Once it\'s made, wear it. Then you\'ll know.'],
    done: [['매듭이 엉성해. 그래도 짐은 들어가겠네.', 'Sloppy knots. Still, it\'ll hold your things.']],
  },
  'M1-09': {
    offer: [
      ['오늘 밤 물이 많이 빠져. 랜턴 챙겨.', 'The tide goes far out tonight. Take a lantern.'],
      ['물때표는 네가 읽어. 간조 두 시간 전후만. 그리고 어촌계 어장 안 전복은 건드리지 마. 그건 우리 거야.',
        'You read the tide table. Two hours either side of low water. And don\'t touch abalone inside the co-op grounds. Those are ours.'],
    ],
    progress: ['젖은 채로 오래 있지 마. 오한 들면 감기 된다.', 'Don\'t stay wet too long. A chill becomes a cold.'],
    done: [['살아 돌아왔네. 다음엔 장화도 사.', 'You came back alive. Buy boots next time.']],
  },
  'M1-10': {
    offer: [
      ['실습생. 내일 새벽 양망이다. 미역도 정리해야 한다.', 'Trainee. Net hauling at dawn tomorrow. Seaweed to sort as well.'],
      ['창고에 펑크 난 자전거가 있다. 고쳐서 타. 항구가 넓다.', 'There\'s a bike with a flat in the shed. Fix it and ride. The harbour is wide.'],
    ],
    progress: ['공동작업은 빠지면 신뢰가 깎인다.', 'Miss community work and trust goes down.'],
    done: [['오늘은 이름 대신 실습생이라 불렀지만, 잘했다.', 'We called you "trainee" today, not your name — but well done.']],
  },
  'M1-11': {
    offer: [
      ['서류 넷. 주민등록, 실습 확인서, 신고어업 신청서, 추천서. 총회는 열하루 뒤다.', 'Four papers. Residence, training certificate, fishery report, recommendation. The meeting is in eleven days.'],
    ],
    progress: ['레벨이 모자라면 총회에 설 자격이 없다. 더 배워 와.', 'Not enough level, no standing at the meeting. Learn more.'],
    done: [
      ['찬성 다수. …한여름. 어촌계원이다.', 'Majority in favour. …Han Yeoreum. Co-op member.'],
      ['이제 통발로 잡은 건 위판할 수 있다. 낚싯대로 잡은 건 여전히 안 된다. 잊지 마라.', 'Now your trap catch can go to auction. Rod-caught still cannot. Don\'t forget.'],
    ],
  },
  'N01-1': {
    offer: [['저 좌판 할머니, 손주 생일상에 도다리를 못 구했대. 네가 잡아 줘. 리어카 도면은 덤이야.', 'That stall grandmother can\'t find a flounder for her grandchild\'s birthday. Catch one. The cart blueprint is a bonus.']],
    progress: ['도다리는 바닥이야. 원투로 멀리.', 'Flounder are on the bottom. Surf cast, far out.'],
    done: [['됐지? 한 마리가 사람 사이를 잇는 거야.', 'See? One fish connects people.']],
  },
  'N02-1': {
    offer: [['그 대, 손잡이가 삭았어. 손 볼 동안 우리 새벽이랑 학꽁치 내기나 해.', 'The grip on that rod has rotted. While I fix it, have a halfbeak bet with my Sae-byeok.']],
    progress: ['새벽이가 이겼대? 학꽁치는 표층이야.', 'Sae-byeok won? Halfbeak are on the surface.'],
    done: [['대는 고쳤다. 오래 못 갈 거다. 그래도 네 대야.', 'The rod\'s fixed. It won\'t last long. Still yours.']],
  },
  'N03-1': {
    offer: [['저기… 이 채비 좀 봐 주시겠소? 자꾸 엉키는데.', 'Excuse me… could you look at this rig? It keeps tangling.']],
    progress: ['풀어 주신 대로 해 보고 있소.', 'I\'m doing it the way you showed me.'],
    done: [['왔다! 입질이오! …고맙소, 선생.', 'A bite! …Thank you, teacher.']],
  },
  'N04-1': {
    offer: [['언니(형)! 방파제부 들어오세요! 학꽁치 잡아서 바로 구워 먹어요!', 'Join the breakwater club! We catch halfbeak and grill them right here!']],
    progress: ['사비키 채비로 두 마리요. 쉬워요!', 'Two on the sabiki rig. Easy!'],
    done: [['입부 완료! 우리 이제 어른 부원 있는 거예요.', 'You\'re in! Now we have an adult member.']],
  },
  'N04-2': {
    offer: [['축제 부스에서 \'사람 낚기\' 할 거예요. 진짜 목표는 진주. 걔 원투 포인트 따라가 봐요.', 'We\'re "fishing for people" at the festival booth. The real target is Jin-ju. Follow her surf-casting spot.']],
    progress: ['진주는 새벽 방파제에 있어요. 겨울 도루묵 자리요.', 'Jin-ju is on the breakwater at dawn. The winter sandfish spot.'],
    done: [['진주가 들어왔어요! 조행록 첫 장, 언니(형) 거예요.', 'Jin-ju joined! The first page of the log is yours.']],
  },
};

/** 발주 NPC가 대사를 갖지 않은 퀘 (Ch2+) — 공용 폴백 */
export const GENERIC_DIALOGUE: QuestDialogue = {
  offer: [['부탁할 게 있어. 일지를 봐.', 'I have a request. Check your journal.']],
  progress: ['아직이야. 일지의 목표를 확인해.', 'Not yet. Check the objectives in your journal.'],
  done: [['고마워. 이걸로 됐어.', 'Thank you. That\'s enough.']],
};

export function dialogueOf(questId: string): QuestDialogue {
  return STORY_DIALOGUE[questId] ?? GENERIC_DIALOGUE;
}

/** 사전 합류용 — 모든 [ko,en] 쌍 */
export function allDialogueLines(): Line[] {
  const out: Line[] = [...TONE_CHOICES, ...Object.values(NPC_IDLE), ...Object.values(DOOR_NARR), ...Object.values(DOOR_GENERIC)];
  for (const m of Object.values(NPC_DOOR)) out.push(...Object.values(m).filter((x): x is Line => !!x));
  for (const d of [...Object.values(STORY_DIALOGUE), GENERIC_DIALOGUE]) out.push(...d.offer, d.progress, ...d.done);
  return out;
}
