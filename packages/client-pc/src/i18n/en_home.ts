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

  // ── 190차 집 살림 ──
  '라디오': 'Radio', '관상 수조': 'Aquarium', '책': 'Books', '달력': 'Calendar', '어탁': 'Fish print', '고양이': 'Cat',
  '[F] 스탠드 켜기': '[F] Turn on lamp', '[F] 스탠드 끄기': '[F] Turn off lamp', '[F] 라디오 켜기': '[F] Turn on radio',
  '[F] 수조 보기': '[F] Aquarium', '[F] 책 보기': '[F] Books', '[F] 달력 보기': '[F] Calendar', '[F] 어탁 보기': '[F] Fish print',
  '[F] 고양이': '[F] Cat',
  '라디오 듣기': 'Listen to the radio', '식사하기': 'Have a meal', '쓰다듬기': 'Pet', '밥 주기': 'Feed', '어류 도감': 'Fish guide', '물때표': 'Tide table',
  '야옹': 'Meow',
  '아버지가 늘 틀어 놓던 그 목소리다. 물때 이름을 따라 외우던 게 생각난다.':
    'The same voice Dad always had on. I remember reciting the tide names along with it.',
  '고양이를 쓰다듬었다. 골골거리는 소리에 마음이 조금 풀린다.': 'I pet the cat. Its purring loosens something in me.',
  '고양이가 눈을 가늘게 뜨고 골골거린다.': 'The cat narrows its eyes and purrs.',
  '배가 부른 모양이다. 냄새만 맡고 돌아앉는다.': "Looks like it's full. It sniffs, then turns away.",
  '벽 장식 앞으로 갈 길이 막힌다': 'It blocks the way to the wall decorations',
  '수조가 가득 찼다': 'The aquarium is full',
  '수조에 넣기에는 너무 크다': 'Too big for the aquarium',
  '수조가 비어 있다': 'The aquarium is empty',
  '살아 있는 고기': 'Live fish',
  '가방과 쿨러에 살아 있는 고기가 없다': 'No live fish in the bag or the cooler',
  '관상 수조다. 살아 있는 고기를 넣어 두면 상하지 않고 여기서 헤엄친다. 너무 큰 고기는 들어가지 않는다.':
    "This is the aquarium. Live fish kept here don't spoil — they swim around. Fish that are too big won't fit.",
  '오른쪽은 가방과 쿨러에 있는 살아 있는 고기다. 갓 낚았거나 해수 쿨러로 살려 온 고기만 뜬다. 하나를 눌러 넣어 보자.':
    'On the right are the live fish in your bag and cooler — only fresh catches or fish kept alive in a seawater cooler. Click one to put it in.',
  '아래 칸의 고기를 누르면 살아 있는 채로 가방에 꺼낸다.': 'Click a fish in the slots below to take it out, still alive, into your bag.',
  '날짜': 'Date', '음력': 'Lunar', '물때': 'Tide', '만조': 'High', '간조': 'Low',
  '아버지가 책 사이에 끼워 둔 물때표다. 오늘부터 이레 치 물때와 만조 · 간조 시각이 적혀 있다. 붉은 띠는 물살이 센 사리 무렵이다.':
    "The tide table Dad kept between his books. A week of tides from today, with high and low water times. Red bars mark spring tides, when the current runs hard.",
  '다가오는 납부': 'Upcoming payments',
  '적어 둔 납부일이 없다': 'No payment dates written down',
  '달력 옆에 다가오는 납부일을 적어 두었다. 붉은 것은 이미 밀린 것이다. 납부는 면허 · 허가 창(L)에서 한다.':
    'Upcoming payment dates are noted beside the calendar. Red ones are already overdue. Pay them in the Licenses & Permits window (L).',
  '아직 어탁을 뜰 만한 고기를 낚지 못했다': "I haven't caught anything worth a print yet",
  '어종별 최대어': 'Biggest by species',
  '어탁 액자다. 지금까지 낚은 가장 큰 고기를 먹으로 떠 두었다. 더 큰 고기를 낚으면 그림이 바뀐다.':
    'The fish-print frame. The biggest fish caught so far, printed in ink. Catch a bigger one and the print changes.',
  // 상점 가구
  '가구': 'Furniture', '나무 의자': 'Wooden chair', '2인용 식탁': 'Table for two', '2인용 소파': 'Two-seater sofa',
  '협탁 스탠드': 'Nightstand lamp',
  '식탁 앞에 두고 앉으면 밥이 더 든든하다. 집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.':
    'Sit at the table and meals fill you up more. Delivered home to your Stored furniture.',
  '둘이 앉으면 딱 맞는 원목 식탁. 집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.':
    'A solid wood table, just right for two. Delivered home to your Stored furniture.',
  '앉아서 잠깐 쉬어 갈 수 있다. 집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.':
    'Sit and rest a while. Delivered home to your Stored furniture.',
  '볕 드는 자리에 깔면 고양이가 좋아한다. 집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.':
    'Lay it in a sunny spot and the cat will love it. Delivered home to your Stored furniture.',
  '물뿌리개로 물을 주며 키운다. 집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.':
    'Keep it alive with a watering can. Delivered home to your Stored furniture.',
  '밤에 켜 두면 방이 환해진다. 집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.':
    'Turn it on at night to light up the room. Delivered home to your Stored furniture.',
  '바다 날씨와 물때 방송이 나온다. 집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.':
    'Plays the sea weather and tide report. Delivered home to your Stored furniture.',
  '살아 있는 고기를 넣어 두고 본다. 집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.':
    'Keep live fish and watch them swim. Delivered home to your Stored furniture.',
  // 첫 입장 혼잣말 (190차 개정분)
  '러그. 볕이 드는 자리라 고양이가 여기서 자주 잔다.': 'The rug. It gets the sun, so the cat often sleeps here.',
  '고양이 한 마리가 집을 지키고 있었다. 누가 밥을 챙겨 줬던 걸까. 이제는 내 몫이겠지.\n앞에서 [F]를 누르면 쓰다듬는다. 손질하고 남은 부산물을 가방에 넣어 오면 밥도 줄 수 있다.':
    "A cat has been keeping the house. Who was feeding it, I wonder. That's my job now.\nPress [F] in front of it to pet it. Bring trimmings from butchering in my bag and I can feed it, too.",
  '아버지 라디오. 소파에 앉아 물때 방송을 듣곤 했다.\n[F]로 켜면 오늘과 내일 물때, 바다 날씨를 알려 준다. 소파에 앉아서도 켤 수 있다.':
    "Dad's radio. He'd sit on the sofa and listen to the tide report.\nTurn it on with [F] for today's and tomorrow's tides and the sea weather. It works from the sofa, too.",
  '벽에 걸린 달력. 아버지 글씨로 납부일이 적혀 있다.\n[F]로 보면 다가오는 납부일을 알 수 있다.':
    "The calendar on the wall, with payment dates in Dad's handwriting.\nCheck it with [F] to see what's due soon.",
  '어탁 액자. 언젠가 내가 낚은 큰 고기로 바꿔 걸고 싶다.\n[F]로 보면 지금까지 낚은 가장 큰 고기의 기록이 나온다.':
    "A fish-print frame. Someday I want to hang one of my own catches there.\nCheck it with [F] for the record of the biggest fish I've caught.",
  '머리맡 협탁. 스탠드가 아직 켜진다. 안경을 늘 두던 자리에 먼지만 앉았다.\n밤에는 방이 어둡다. 협탁 앞에서 [F]로 스탠드를 켜고 끈다.':
    'The bedside table. The lamp still turns on. Only dust where he always kept his glasses.\nThe room gets dark at night. Turn the lamp on and off with [F] at the nightstand.',
  '벽 선반의 책. 물때표, 어류 도감, 손때 묻은 매듭 책.\n책 아래에서 [F]를 누르면 도감이나 물때표를 펼쳐 본다.':
    'Books on the wall shelf: a tide table, a fish guide, a well-thumbed book of knots.\nPress [F] below them to open the guide or the tide table.',
  '창 너머로 바다가 보인다. 해가 지면 노을이, 비가 오면 빗줄기가 보인다.':
    'The sea is out past the window. At sunset it glows; when it rains, you see the streaks.',

  // 물때 꼬리말 (190차 — 물때표 · 라디오)
  '사리 진입': 'spring tide rising', '사리': 'spring tide', '사리 최강': 'peak spring tide',
  '조금 진입': 'neap tide coming', '조금': 'neap tide', '무시': 'slack tide',
  '클릭 또는 Enter — 계속': 'Click or Enter — continue', '클릭 또는 Enter — 닫기': 'Click or Enter — close',
  // ── 물뿌리개 ──
  '물뿌리개': 'Watering can',
  '양철 물뿌리개. 손에 들고 화분 앞에 서면 물을 줄 수 있다.': 'A tin watering can. Hold it and stand by a plant to water it.',
  // ── 191차 프롤로그 말풍선 코치 · 첫 걸음 개정 ──
  '앉아 있을 때, 실시간으로 고를 수 있는 다른 행동을 취할 수 있다. 계속 쉬려면 그대로 두면 된다. [일어나기]를 선택해서, 다시 일어나자.':
    'While seated, you can pick other things to do right then. To keep resting, just leave it be. Choose [Stand up] to get back on your feet.',
  '상자째로 어깨에 멨다. 오늘부터 이게 내 낚시 가방이다.': 'I slung the whole box over my shoulder. From today, this is my fishing bag.',
  '단축키 [I] 키를 눌러, 인벤토리를 열어 보자. 가방에서 얻은 아버지의 장비를 확인해 보자.':
    "Press [I] to open your inventory. Take a look at Dad's gear from the bag.",
  '아버지의 대를 우클릭해 「오른손 착용」으로 손에 들어 보자.': 'Right-click Dad\'s rod and pick "Equip (right hand)" to hold it.',
  '대를 손에 들었다. 나머지 릴도 장착해 보자. 단축키 [E]로 장비창을 열자.': 'The rod is in hand. Now fit the reel too. Press [E] to open the equipment window.',
  '릴은 가방에 있다. [I]로 가방도 함께 열자.': 'The reel is in the bag. Open the bag as well with [I].',
  '가방의 릴을 끌어다 장비창 「릴」 칸에 놓아 보자.': 'Drag the reel from the bag onto the "Reel" slot of the equipment window.',
  '상자 속 사진도 가방에 넣어 두었다. [I]로 가방을 열어 사진을 찾아보자.': 'The photo from the box is in the bag too. Open the bag with [I] and find it.',
  '사진을 우클릭해 「상세보기」로 뒷면을 살펴보자.': 'Right-click the photo and pick "Details" to look at the back.',
  '오늘 할 일을 일지에 적어 두었다. 단축키 [J]로 일지를 펼쳐 보자.': "Today's plan is written in the journal. Press [J] to open it.",
  '냉동고 칸의 오징어를 눌러 가방으로 옮기자. 속초 직판장에 팔아 노잣돈을 보탤 것이다.':
    "Click the squid in the freezer to move it to the bag. I'll sell it at the Sokcho fish market for travel money.",
  '창을 닫고 부엌 냉장고로 가자. 얼려 둔 오징어를 챙겨야 한다.': 'Close the windows and head to the kitchen fridge. I need to grab the frozen squid.',
  '부엌 냉장고 앞에서 [F]로 냉동고를 열자. 얼려 둔 오징어를 챙겨야 한다.': 'Press [F] at the kitchen fridge to open the freezer. I need to grab the frozen squid.',
  '「저장하고 쉬기」를 골라 오늘을 저장하자.': 'Pick "Save & rest" to save today.',
  '창을 닫고 침대로 가자. 떠나기 전에 저장해 두어야 한다.': 'Close the windows and go to the bed. I should save before I leave.',
  '떠나기 전에 침대 앞에서 [F]를 눌러 저장해 두자.': 'Before leaving, press [F] at the bed to save.',
  '이제 집을 나서자. 현관 매트를 밟고 아래로 걸어 나가면 된다.': 'Time to head out. Step on the doormat and walk out downward.',
  '아직 집에서 챙길 것이 남았다.': 'There is still something to take care of at home.',
  '마당의 우물 앞에서 [F]를 눌러 물을 한 모금 마시자.': 'Press [F] at the well in the yard to take a drink.',
  '물을 마시니 정신이 든다. 단축키 [S]로 상태 창을 열어 몸 상태를 살펴보자.': 'The water wakes me up. Press [S] to open the status window and check how I am doing.',
  '이제 버스 정류장을 찾자. 단축키 [M]으로 지도를 펼쳐 보자.': 'Now to find the bus stop. Press [M] to open the map.',
  '버스 정류장 앞에서 [F]를 눌러 막차에 오르자. 전국 지도에서 속초를 고르면 된다.': 'Press [F] at the bus stop to board the last bus. Pick Sokcho on the national map.',
  '「판매하기」로 바꿔 얼린 오징어를 팔아 보자. 노잣돈에 보탬이 된다.': 'Switch to "Sell" and sell the frozen squid. It will help with travel money.',
  '직판장 앞에서 [F]를 눌러, 얼려 온 오징어를 팔아 보자.': 'Press [F] at the fish market and sell the squid you brought.',
};

/** 이름·수치가 끼어 있는 문장 */
export const EN_HOME_RULES: [RegExp, (m: RegExpMatchArray, tr: (s: string) => string) => string][] = [
  [/^소파에서 잠깐 눈을 붙였다 — 피로 (\d+)% → (\d+)%$/, (m) => `Dozed off on the sofa for a moment — fatigue ${m[1]}% → ${m[2]}%`],
  [/^(\d+)물$/, (m) => `Tide day ${m[1]}`],
  // 191차 — 직판장 코치(남은 채비 목록)
  [/^기본 채비를 하나씩 사 보자\. 아직 사지 않은 것: (.+)$/, (m, tr) => `Buy one of each basic item. Still to buy: ${m[1].split(' · ').map((x) => tr(x)).join(' · ')}`],
  [/^속초에 왔다\. 수산물 직판장 앞에서 \[F\]를 눌러 기본 채비를 하나씩 사자\. \((.+)\)$/, (m, tr) => `Here in Sokcho. Press [F] at the fish market and buy one of each basic item. (${m[1].split(' · ').map((x) => tr(x)).join(' · ')})`],
  [/^(\d+)물 \((.+)\)$/, (m, tr) => `Tide day ${m[1]} (${tr(m[2])})`],
  [/^식탁에서 먹었다 \+(\d+)$/, (m) => `ate at the table +${m[1]}`],
  [/^고양이가 (.+)을\(를\) 맛있게 먹는다\.$/, (m, tr) => `The cat happily eats the ${tr(m[1])}.`],
  [/^(.+) — 수조에 넣었다$/, (m, tr) => `${tr(m[1])} — into the aquarium`],
  [/^오늘은 (\d+)일째$/, (m) => `Today is day ${m[1]}`],
  [/^(.+) x(\d+) — 집 「넣어 둔 가구」로 보냈습니다 \(-(.+)원\)$/, (m, tr) => `${tr(m[1])} x${m[2]} — delivered to your Stored furniture at home (-${m[3]} won)`],
  [/^(.+) (\d+)cm$/, (m, tr) => `${tr(m[1])} ${m[2]}cm`],
  [/^(.+) — 넣어 두었다$/, (m, tr) => `${tr(m[1])} — put away`],
  [/^(.+) — 가방에 넣었다$/, (m, tr) => `${tr(m[1])} — back in the bag`],
  [/^(옷장|수납 선반)  (\d+)\/(\d+)$/, (m, tr) => `${tr(m[1])}  ${m[2]}/${m[3]}`],
];
