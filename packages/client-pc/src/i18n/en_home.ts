/**
 * @file en_home.ts
 * @description 189차 집 실내 — 가구 배치 · 앉기/휴식 · 화분 · 옷장/수납 선반 · 현관 매트 영문
 */

export const EN_HOME: Record<string, string> = {
  // ── 가구 이름 ──
  '냉장고': 'Fridge', '개수대': 'Sink', '가스레인지': 'Gas stove', '침대': 'Bed', '협탁': 'Nightstand',
  '식탁': 'Table', '의자': 'Chair', '소파': 'Sofa', '러그': 'Rug', '옷장': 'Wardrobe', '수납 선반': 'Storage shelf',
  '화분': 'Potted plant', '낚시 상자': 'Tackle box',

  // ── 머리 위 [F] ──
  '[F] 앉기': '[F] Sit', '[F] 옷장 열기': '[F] Open wardrobe', '[F] 선반 열기': '[F] Open shelf', '[F] 물 주기': '[F] Water',

  // ── 확장 패널 ──
  '휴식하기': 'Rest', '일어나기': 'Stand up', '저장하고 쉬기': 'Save & rest', '그냥 쉬기': 'Just rest', '그만두기': 'Never mind',
  '지금은 그다지 피곤하지 않다.': "I'm not that tired right now.",
  '화분에 물을 줬다.': 'I watered the plant.',
  '화분에 물을 줬다. 처졌던 잎이 다시 고개를 든다.': 'I watered the plant. The drooping leaves lift their heads again.',

  // ── 첫 입장 혼잣말 (189차 개정분) ──
  '현관 매트. 매트를 밟고 아래로 걸어 나가면 바로 밖이다.': 'The doormat. Step on it and walk out downward, and I am outside.',
  '화분 하나가 아직 살아 있다. 누가 물을 주고 있었던 모양이다.\n물뿌리개를 손에 들고 화분 앞에 서면 물을 줄 수 있다.':
    'One potted plant is still alive. Someone must have been watering it.\nWith a watering can in hand, I can water it by standing in front of it.',
  '낡은 2인용 소파. 아버지는 여기서 라디오 물때 방송을 켜 놓고 졸곤 했다.\n소파 앞에서 [F]를 누르면 앉는다. 앉아서 잠깐 쉴 수도 있다.':
    'The old two-seater sofa. Dad used to doze off here with the tide report on the radio.\nPress [F] in front of it to sit. I can rest there for a bit, too.',
  '수납 선반. 낚시 잡지 몇 권과 쓰다 만 채비 상자가 그대로 올려져 있다.\n[F]로 열어 낚시용품이나 자잘한 물건을 올려 둘 수 있다.':
    'A storage shelf. A few fishing magazines and a half-used tackle box, right where he left them.\nOpen it with [F] to keep tackle and odds and ends.',
  '식탁. 둘이 앉으면 딱 맞는 크기다. 밥은 늘 여기서 먹었다.\n의자 앞에서 [F]를 누르면 앉는다.':
    'The table. Just the right size for two. We always ate here.\nPress [F] in front of a chair to sit.',
  '머리맡 협탁. 스탠드가 아직 켜진다. 안경을 늘 두던 자리에 먼지만 앉았다.':
    'The bedside table. The lamp still turns on. Only dust where he always kept his glasses.',
  '옷장. 아버지 옷가지가 아직 걸려 있다.\n[F]로 열어 장비를 걸어 둘 수 있다. 가방이 한결 가벼워진다.':
    "The wardrobe. Dad's clothes are still hanging in it.\nOpen it with [F] to hang up gear. My bag gets a lot lighter.",
  '대충 다 둘러봤다. 쓸 수 있는 가구 앞에 서면 머리 위에 [F]가 뜬다. 가구 자리는 오른쪽 위 [가구 배치]에서 바꾼다.':
    "That's about everything. Standing by something I can use shows [F] over my head. I can rearrange furniture with [Arrange] at the top right.",

  // ── 첫 걸음 가이드 (189차 개정분) ──
  '쓸 수 있는 가구 앞에 서면 머리 위에 [F]가 뜬다. 소파 앞으로 가서 [F]로 앉아 보자.':
    'Stand by something you can use and [F] appears over your head. Go to the sofa and press [F] to sit.',
  '앉아 있으면 옆에 고를 거리가 뜬다. 쉬어 갈 수도 있다. 이번에는 [일어나기]를 골라 일어서자.':
    'While seated, choices appear beside you. You can rest here. This time, pick [Stand up].',

  // ── 가구 배치 ──
  '가구 배치': 'Arrange', '넣어 둔 가구': 'Stored furniture', '완료': 'Done',
  '방 밖에는 둘 수 없다': "Can't place it outside the room",
  '현관 매트 위에는 둘 수 없다': "Can't place it on the doormat",
  '다른 가구와 겹친다': 'It overlaps other furniture',
  '내가 서 있는 자리다': "That's where I'm standing",
  '나갈 길이 막힌다': 'It blocks my way out',
  '가구 앞으로 갈 길이 막힌다': 'It blocks the way to some furniture',
  '침대는 넣어 둘 수 없다 — 잠잘 곳은 있어야 한다': "The bed can't be stored — I need somewhere to sleep",
  '가구 배치 중에는 바닥에 칸이 보인다. 옮길 가구를 눌러 들어 올려 보자.':
    'While arranging, the floor shows a grid. Click a piece of furniture to pick it up.',
  '들어 올린 가구는 손을 따라온다. 초록 칸이면 놓을 수 있고, 빨간 칸이면 그 까닭이 아래에 뜬다. 빈자리를 눌러 내려놓자.':
    "The furniture follows your cursor. Green squares mean it fits; red squares show the reason below. Click an empty spot to put it down.",
  '소파와 의자는 방향을 바꿀 수 있다. 들고 있을 때나 그 가구 위에서 우클릭하면 돈다. 한 번 돌려 보자.':
    'Sofas and chairs can face other ways. Right-click while holding one, or on one, to turn it. Try turning one.',
  '오른쪽은 넣어 둔 가구 자리다. 가구를 들어 이 칸에 내려놓으면 방에서 치워 둔다. 하나 넣어 보자.':
    'The panel on the right holds stored furniture. Pick something up and drop it here to clear it from the room. Store one.',
  '넣어 둔 가구를 누르면 다시 든다. 방에 다시 놓아 보자.':
    'Click stored furniture to pick it up again. Put it back in the room.',
  '다 옮겼으면 [완료]를 누른다. 배치는 침대에서 저장할 때 함께 기록된다.':
    'When you are done, press [Done]. The layout is saved along with the game at the bed.',

  // ── 옷장 · 수납 선반 ──
  '가방': 'Bag',
  '가방에 넣어 둘 장비가 없다': 'No gear in the bag to hang up',
  '가방에 올려 둘 물건이 없다': 'Nothing in the bag to put on the shelf',
  '가방에 빈 칸이 없다': 'No free space in the bag',
  '옷장이 가득 찼다': 'The wardrobe is full',
  '수납 선반이 가득 찼다': 'The shelf is full',
  '옷장이다. 장비는 여기 걸어 둘 수 있다. 입고 있는 것은 벗어야 들어간다.':
    "This is the wardrobe. Gear can be hung up here. Anything you're wearing has to come off first.",
  '수납 선반이다. 낚시용품 · 소모품 · 자잘한 물건을 올려 둔다. 음식은 냉장고로 간다.':
    'This is the storage shelf. Tackle, consumables and odds and ends go here. Food goes in the fridge.',
  '오른쪽은 가방이다. 넣을 수 있는 물건만 뜬다. 하나를 눌러 넣어 보자.':
    'On the right is your bag. Only things that fit here are listed. Click one to put it away.',
  '넣어 둔 것을 누르면 다시 가방으로 꺼낸다. 꺼내 보자.':
    'Click something stored to take it back into your bag. Take one out.',

  // ── 냉장고 가이드 (189차) ──
  '위는 냉동고, 아래는 냉장고다. 넣어 둔 동안은 상하지 않는다. 머리줄을 누르면 그쪽에 넣는다.':
    "The top is the freezer, the bottom the fridge. Nothing spoils while it's inside. Click a header to put things on that side.",
  '오른쪽은 가방 속 음식이다. 하나를 눌러 넣어 보자.': 'On the right is the food in your bag. Click one to put it in.',
  '넣어 둔 것을 누르면 가방으로 꺼낸다. 하나 꺼내 보자.': 'Click something stored to take it out into your bag. Take one out.',
  '가방(음식)에 빈 칸이 없습니다': 'No free food space in the bag',

  // ── 물뿌리개 ──
  '물뿌리개': 'Watering can',
  '양철 물뿌리개. 손에 들고 화분 앞에 서면 물을 줄 수 있다.': 'A tin watering can. Hold it and stand by a plant to water it.',
};

/** 이름·수치가 끼어 있는 문장 */
export const EN_HOME_RULES: [RegExp, (m: RegExpMatchArray, tr: (s: string) => string) => string][] = [
  [/^소파에서 잠깐 눈을 붙였다 — 피로 (\d+)% → (\d+)%$/, (m) => `Dozed off on the sofa for a moment — fatigue ${m[1]}% → ${m[2]}%`],
  [/^(.+) — 넣어 두었다$/, (m, tr) => `${tr(m[1])} — put away`],
  [/^(.+) — 가방에 넣었다$/, (m, tr) => `${tr(m[1])} — back in the bag`],
  [/^(옷장|수납 선반)  (\d+)\/(\d+)$/, (m, tr) => `${tr(m[1])}  ${m[2]}/${m[3]}`],
];
