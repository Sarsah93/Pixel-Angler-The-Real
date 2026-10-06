/**
 * @file en_ui.ts
 * @description 영어 사전 — 179차 전수조사에서 드러난 **현역 화면 미번역** 보강.
 *
 * 배경: 178차까지의 신규 UI(상호작용 선택 창·바닥의 물건·설정 토글 등)와,
 * 그 이전부터 사전을 비껴가 있던 화면(캐릭터 만들기·멀티 로비·상세보기 일부·
 * 전체 지도 범례·장비창 가방·도감·부팅 화면)을 한 번에 채운다.
 *
 * ⚠ 키 = 코드에 적힌 한국어 원문 그대로. 원문을 고치면 여기 키도 같이 고친다.
 * ⚠ dev 전용 문자열(맵 편집기·F9 좌표 편집·핀 편집)은 **일부러 넣지 않는다**(120차 정책).
 */

export const EN_UI: Record<string, string> = {
  // ── 178차 상호작용·바닥의 물건 ──
  '상호작용': 'Interact',
  '아이템 줍기': 'Pick up item',
  '놓아둔 물건 회수하기': 'Take back what you left',
  '내려놓기': 'Put down',
  '모두 닫기': 'Close all',
  '정보 보기': 'View profile',
  '거래하기': 'Trade',
  '얼음 상자 내려놓기': 'Drop the ice crate',
  '경매장 하역 표시': 'Auction house unloading mark',
  '[F]를 길게 누른다': 'Hold [F]',
  '[F]를 길게 눌러 채집합니다': 'Hold [F] to forage',
  '화구에서 요리하기': 'Cook on the burner',
  '통발 수거하기': 'Pull up the trap',
  '여기에는 내려놓을 수 없습니다.': "You can't put anything down here.",
  '여기서는 내려놓을 수 없습니다.': "You can't put anything down here.",
  '이 자리에 물건이 너무 많습니다 — 한 칸 옮겨서 놓으세요.': 'Too many things on this tile — move over one and try again.',
  '아이템이 없습니다.': 'No item.',
  '한 칸 안으로 다가가세요': 'Step within one tile',
  '인벤토리 공간이 부족합니다': 'Not enough room in your bag',
  '내 가방 — 줄을 누르면 제안에 올립니다 (휠로 넘김)': 'My bag — click a row to add it to the offer (wheel to scroll)',
  '양도할 수 있는 물건이 없습니다 (귀속·착용 중은 제외)': 'Nothing you can hand over (bound and worn items excluded)',
  '빼기': 'Remove',
  '(아이템 없음)': '(no items)',
  '해체하기': 'Take apart',

  // ── 심부름(얼음 나르기) ──
  '얼음 상자를 하역 위치에 내려놓았습니다.': 'You set the ice crate down on the unloading mark.',
  '얼음 상자를 내려놓았습니다 — 정옥선에게 돌아가세요': 'Ice crate delivered — head back to Jeong Ok-seon',

  // ── 보건소 ──
  '지금은 진료가 필요하지 않습니다': 'You have nothing that needs treating right now',
  '진료를 받았습니다 — 몸이 한결 가볍다': 'Treated — you feel a good deal lighter',

  // ── 설정 (화면 · 언어) ──
  '화면': 'Display',
  '음향': 'Sound',
  '언어': 'Language',
  '게임 언어': 'Game language',
  '장소 핀': 'Place pins',
  '미니맵에 정류장 · 여객터미널 같은 장소 핀을 가게 핀과 함께 띄웁니다. 전체 지도(M)에는 늘 보입니다. 땅 위에는 이름을 띄우지 않습니다 — 가게 앞에는 작은 간판이 서고, 이름은 다가가면 보입니다.':
    'Shows pins for places such as bus stops and ferry terminals on the minimap along with shop pins. The full map (M) always shows them. No names are drawn on the ground — shops have a small sign out front, and the name appears when you walk up.',
  '캐릭터와 NPC의 이름표는 이 설정과 상관없이 늘 보입니다.': 'Name tags over characters and NPCs always stay visible, whatever this is set to.',
  '할 일 위치 안내': 'Task direction guide',
  '지금 할 일의 목표 방향을 가리키는 화살표를 캐릭터 주변에 띄웁니다. 끄면 화살표만 사라지고, 일지(J)와 「지금 할 일」의 안내 문구는 그대로 남습니다.':
    'Shows an arrow near your character pointing toward the current task. Turn it off and only the arrow goes — the journal (J) and the Current Task panel still tell you where to go.',
  '슬라이더 조절 후 자동 저장됩니다.': 'Saved automatically when you move a slider.',

  // ── 캐릭터 만들기 ──
  '캐릭터 만들기': 'Create your character',
  '당신은 어떤 사람인가요?': 'Who are you?',
  '미리보기': 'Preview',
  '외형': 'Appearance',
  '↑↓ 항목   ←→ 변경   Enter 생성   ESC 뒤로': '↑↓ item   ←→ change   Enter create   ESC back',
  '이대로 생성하기': 'Create as shown',
  '무작위 외형': 'Randomise look',
  '처음으로': 'Back to start',
  '성별': 'Sex',
  '얼굴형': 'Face shape',
  '눈썹': 'Eyebrows',
  '볼 홍조': 'Blush',
  '머리 모양': 'Hair style',

  // ── 메인 메뉴 · 멀티 로비 ──
  '혼자 하기': 'Play alone',
  '여럿이 하기': 'Play together',
  '새로 시작': 'New game',
  '이어하기': 'Continue',
  '방을 열거나, 받은 코드로 참가하세요.': 'Open a room, or join with a code you were given.',
  '칸을 눌러 직접 입력합니다 · Enter 확정 · ESC 뒤로': 'Click a box to type · Enter to confirm · ESC to go back',
  '방을 여는 중…': 'Opening the room…',
  '준비됐습니다. 아래에서 들어가세요.': 'Ready. Go in from below.',
  '코드를 먼저 입력하세요.': 'Enter the code first.',
  '방을 찾는 중…': 'Looking for the room…',

  // ── 부팅 화면 ──
  '채비 중...': 'Rigging up...',
  '출조 준비 완료!': 'Ready to head out!',
  // 219차 — 로딩 가림막 단계 이름(ui/LoadingOverlay)
  '구성요소 불러오는 중': 'Loading components',
  '지도 불러오는 중': 'Loading maps',
  '인물 불러오는 중': 'Loading characters',
  '물고기 그림 불러오는 중': 'Loading fish art',
  '안내 그림 불러오는 중': 'Loading guide art',
  '소리 불러오는 중': 'Loading sounds',
  '게임 준비 중': 'Getting the game ready',
  '맵 불러오는 중': 'Loading the area',
  '맵 데이터 불러오는 중': 'Loading area data',
  '맵 그림 불러오는 중': 'Loading area art',
  '맵 그리는 중': 'Building the area',
  // 220차 — 상점 장바구니 · 종류 칩 · 찾기
  '장바구니': 'Cart',
  '판매 목록': 'Selling',
  '합계': 'Total',
  '사기': 'Buy',
  '팔기': 'Sell',
  '이름으로 찾기': 'Search by name',
  '찾는 물건이 없다.': 'Nothing matches.',
  '담은 물건이 없다.': 'The cart is empty.',
  '팔 물건을 고르지 않았다.': 'Nothing picked to sell.',
  '가진 돈이 모자라다 — 수량을 줄이거나 빼자.': "Not enough money — lower the counts or take something out.",
  '살 물건을 눌러 장바구니에 담으세요.': 'Click items to put them in the cart.',
  '구매하기 탭에서 상품을 담으세요.': 'Put items in the cart on the Buy tab.',
  '팔 물건을 눌러 판매 목록에 담으세요.': 'Click items to add them to the sell list.',
  '판매하기 탭에서 팔 물건을 담으세요.': 'Add items to sell on the Sell tab.',
  '진열대에서 물건 하나를 눌러 장바구니에 담아 보자.': 'Click an item on the shelf to put it in the cart.',
  '담은 칸은 초록 테두리가 된다. 칸 아래 숫자가 값이다. 여러 개를 담을 수 있고, 다시 누르면 뺀다. 우클릭하면 자세한 정보가 뜬다.':
    'Items in the cart get a green frame. The number below is the price. You can add several, and clicking again takes one out. Right-click for details.',
  '위쪽 칩을 누르면 그 종류만 보이고, 오른쪽 칸에 이름을 쳐서 찾을 수도 있다.':
    'Click a chip at the top to show only that kind, or type a name in the box on the right.',
  '위쪽 칩을 누르면 그 종류만 보이고, 오른쪽 칸에 이름을 쳐서 찾을 수 있다.':
    'Click a chip at the top to show only that kind, or type a name in the box on the right.',
  '아래 「구매」를 누르면 장바구니가 열린다. 줄마다 수량을 정하고 「사기」를 누르면 값을 치르고 가방에 들어온다. 사 보자.':
    'Press "Buy" below to open the cart. Set a count on each line and press "Buy" to pay — it goes into your bag. Try it.',
  '「구매」를 누르면 장바구니가 열리고 값을 치른다. 지금은 담은 물건 값이 가진 돈보다 많다.':
    'Pressing "Buy" opens the cart and you pay there. Right now the cart costs more than you have.',
  '팔 물건을 눌러 판매 목록에 담아 보자. 여러 개를 함께 담을 수 있다.': 'Click something to add it to the sell list. You can add several.',
  '「판매」를 누르면 판매 목록이 열린다. 수량을 확인하고 「팔기」를 누르면 값을 받는다. 팔아 보자.':
    'Press "Sell" to open the sell list. Check the counts and press "Sell" to get paid. Try it.',
  '이제 물건을 여러 개 한꺼번에 사고팔 수 있다. 칸을 누를 때마다 장바구니에 담기고, 다시 누르면 빠진다.':
    'You can now buy and sell several things at once. Each click puts an item in the cart; clicking again takes it out.',
  '「구매」 · 「판매」 옆 숫자는 담은 가짓수다. 누르면 줄마다 수량을 정하는 창이 열리고, 합계와 남는 돈을 보고 한 번에 거래한다.':
    'The number next to "Buy" / "Sell" is how many kinds you picked. Press it to set counts per line, check the total and what you will have left, and trade in one go.',
  // 219차 — 자전거 코치 · 프롤로그 안전망
  '자전거가 생겼다. [R]을 눌러 올라타 보자.': 'You have a bicycle now. Press [R] to hop on.',
  '걸을 때보다 두 배 빠르다. 가게에 들어가거나 낚시를 시작하면 저절로 내린다. 내릴 때도 [R]이다.':
    "It's twice as fast as walking. You get off on your own when you enter a shop or start fishing. [R] gets you off too.",
  '[이동] 자전거에 탔다 — 걸을 때보다 두 배 빠르다.': '[Move] On the bike — twice as fast as walking.',
  '[이동] 자전거에서 내렸다.': '[Move] Off the bike.',
  '지금 꼭 필요한 물건이다. 할 일을 마친 뒤에 정리하자.': "I still need this. I'll sort it out once I'm done.",
  '주머니 안쪽에서 어머니가 넣어 둔 비상금을 찾았다. 꼭 필요한 채비부터 사자.':
    'Found the emergency money Mom tucked into my inner pocket. Basic tackle first.',

  // ── 상세보기 (접시·과증식·어획물) ──
  '접시 크기': 'Plate size',
  '플레이팅 진행': 'Plating progress',
  '담긴 어종': 'Fish on the plate',
  '담긴 중량': 'Weight on the plate',
  '과증식': 'Overabundant',
  '독성': 'Venom',
  '구별': 'Telling it apart',
  '피해': 'Damage',
  '구제 수매': 'Cull buy-back',
  '식용': 'Edible',
  '비만도': 'Condition factor',

  // ── 장비창 · 전체 지도 · 도감 · 입질 ──
  '가방': 'Bag',
  '인벤토리 칸 확장 — 벗으려면 확장 칸을 먼저 비운다': 'Expands bag slots — empty the extra slots before taking it off',
  '생활용품점': 'General store',
  '약국': 'Pharmacy',
  '최대어': 'Biggest catch',
  '입질!': 'Bite!',
  '떠오름!': 'Rising!',

  // ── 출조 확인 모달 ──
  '요구 면허': 'Licence required',
  '주요 어종': 'Main species',
  '물때': 'Tide',
  '기온': 'Air temp',
  '수온': 'Water temp',
  '풍속': 'Wind',
  '스팟 종류': 'Spot type',
  '이동하기 ▶': 'Set out ▶',

  '장비 변경은 메인 메뉴의 장비실에서 할 수 있습니다.': 'You can change gear in the tackle room from the main menu.',


  // ── 179차 실렌더 스캔 보강 — 캐릭터 만들기 옵션값 ──
  '체형': 'Build', '피부': 'Skin', '얼굴': 'Face', '눈동자': 'Eyes', '입': 'Mouth',
  '머리': 'Hair', '머리 색': 'Hair colour', '수염': 'Beard', '복장': 'Clothes',
  '기본 상의': 'Starting top', '기본 하의': 'Starting bottoms',
  '남성': 'Male', '여성': 'Female',
  '계란형': 'Oval', '둥근형': 'Round', '사각형': 'Square',
  '미소': 'Smile', '진하게': 'Thick', '옅게': 'Thin', '있음': 'Yes', '없음': 'None',
  '단발 컷': 'Bob cut', '정면': 'Front', '정지': 'Idle', '걷기': 'Walk', '달리기': 'Run',
  '이름없는꾼': 'Nameless Angler',
  '상의·하의는 입고 시작할 옷입니다. 나중에 가방에서 갈아입을 수 있습니다.\n색은 견본을 눌러 고르세요.':
    'The top and pants are what you start out wearing — you can change them from your bag later.\nPick colours by clicking a swatch.',

  // ── 스탯 (상태 창) ──
  '근력 (Strength)': 'Strength',
  '캐스팅 초기 힘 벡터를 키워 맞바람을 극복하고, 파이팅 시 최대 장력 허용치를 높입니다.':
    'Puts more force behind the cast so you punch through a headwind, and raises the tension you can hold in a fight.',
  '민첩 (Dexterity)': 'Dexterity',
  '캐스팅 게이지의 최적 타점(Sweet Spot) 영역을 넓히고, 드랙 미세 조정 완충 시간을 늘립니다.':
    'Widens the sweet spot on the casting gauge and gives you longer to fine-tune the drag.',
  '평형감각 (Equilibrium)': 'Balance',
  '파고로 발판이 흔들릴 때 캐스팅 조준점이 흐트러지는 요동을 보정합니다.':
    'Steadies your aim when the swell has the ground moving under you.',
  '조석 해석력 (Tide Reading)': 'Tide reading',
  '물때 사이클과 조류 속도를 해석해 최적 활성 수심대(상/중/하) 힌트를 제공합니다.':
    'Reads the tide cycle and current speed to hint at the depth band the fish are working.',

  // ── 인벤토리 탭 · 필드 채팅 ──
  '퀘스트': 'Quest',
  '[ENTER] 대화 입력 (혼자 하는 중)': '[ENTER] Chat (playing alone)',
  '메인 메뉴': 'Main menu',


  // ── 할 일 난이도 (일지 우측 열) ──
  '대화': 'Talk', '수월': 'Light', '보통': 'Normal', '까다로움': 'Demanding', '고난도': 'Severe',
  // ── 숙련도 행동명 ──
  '캐스팅': 'Casting', '손질': 'Butchery', '회썰기': 'Slicing', '조리': 'Cooking', '채집': 'Foraging',
  // ── 채비 소모품 이름 ──
  '면도래 8호': 'Barrel swivel #8',   // 구세이브 이름(192차에 핀 도래 8호로 바로잡음)

  // ── 1인칭 파이팅 안내 ──
  '여 박기! 릴링을 멈추고 ↑를 꾹 눌러 버티세요!': 'It’s diving for the rocks! Stop reeling and hold ↑ to ride it out!',
  '몸을 비틀며 요동칩니다 — 텐션이 출렁이니 안전대를 지키세요':
    'It’s thrashing and twisting — the tension swings, so keep it in the safe band',
  // ── 186차 집 실내 안내 ──
  '[F] 살펴보기': '[F] Look',
  '아버지 집이다. 떠날 때 모습 그대로다. 우선 하나씩 둘러보자.': "Dad's house. Everything is just as it was when I left. Let me look around, one thing at a time.",
  '대충 다 둘러봤다. 궁금한 게 있으면 가구 앞에서 [F]로 다시 살펴보면 된다.': "That's about everything. If I want another look, I can stand by something and press [F].",
  '들어온 문. 밖으로 나가려면 문 앞에서 [F]를 누르거나 ESC를 누르면 된다.': 'The door I came in through. To go outside, press [F] in front of it, or press ESC.',
  '화분 하나가 아직 살아 있다. 누가 물을 주고 있었던 모양이다.': 'One potted plant is still alive. Someone must have been watering it.',
  '낡은 소파. 아버지는 여기서 라디오 물때 방송을 켜 놓고 졸곤 했다.': 'The old sofa. Dad used to doze off here with the tide report on the radio.',
  '수납 선반. 낚시 잡지 몇 권과 쓰다 만 채비 상자가 그대로 올려져 있다.': 'A storage shelf. A few fishing magazines and a half-used tackle box, right where he left them.',
  '냉장고는 아직 돌아간다. 위칸은 얼리고 아래칸은 차게 둔다.\n[F]로 열어 잡은 고기나 먹을 것을 넣어 두면, 넣어 둔 동안은 상하지 않는다.': "The fridge still runs. The top freezes, the bottom keeps things cold.\nOpen it with [F] — fish or food kept inside won't spoil while it's in there.",
  '개수대에서 수돗물이 나온다. 요리할 때 물 걱정은 없겠다.\n개수대나 가스레인지 앞에서 [F]를 누르면 요리를 시작한다.': "The sink has running water. No worrying about water when I cook.\nPress [F] at the sink or the stove to start cooking.",
  '가스레인지 두 구. 집 화구는 가스가 떨어질 일이 없다.\n[F]로 조리를 시작한다 — 재료는 가방에서 꺼내 넣는다.': "A two-burner gas stove. The gas here never runs out.\nPress [F] to start cooking — ingredients come out of my bag.",
  '식탁. 둘이 앉으면 딱 맞는 크기다. 밥은 늘 여기서 먹었다.': 'The table. Just the right size for two. We always ate here.',
  '러그 위에서 고양이가 자고 있다. 누가 밥을 챙겨 줬던 걸까. 이제는 내 몫이겠지.': "A cat is asleep on the rug. Who was feeding it? I suppose that's my job now.",
  '아버지 침대. 이불 끝이 반듯하게 접혀 있다.\n침대 앞에서 [F]를 누르면 쉴 수 있다. 오늘 한 일을 기록(저장)하는 것도 이 침대에서만 된다.': "Dad's bed. The edge of the blanket is folded neatly.\nPress [F] at the bed to rest. This bed is also the only place to record (save) the day.",
  '머리맡 협탁. 안경을 늘 두던 자리에 먼지만 앉았다.': 'The bedside table. Only dust where he always kept his glasses.',
  '서랍장 위 스탠드가 아직 켜진다. 서랍 안에는 아버지 옷가지가 그대로다.': "The lamp on the dresser still turns on. His clothes are still in the drawers.",
  '벽시계는 멈추지 않고 가고 있다. 누가 건전지를 갈아 두었나.': 'The wall clock is still ticking. Someone must have changed the battery.',
  '벽 선반의 책. 물때표, 어류 도감, 손때 묻은 매듭 책.': 'Books on the wall shelf. Tide tables, a fish guide, a well-thumbed book of knots.',
  '창 너머로 바다 냄새가 들어온다. 여기서도 파도 소리가 들린다.': 'The smell of the sea drifts in through the window. I can hear the waves from here, too.',
};

/** 수치·이름이 끼어 있는 문장 (캡처는 `applyTemplate`이 다시 번역한다) */
export const EN_UI_RULES: [RegExp, (m: RegExpMatchArray, tr: (s: string) => string) => string][] = [
  // 179차 — 겹침 선택 창 머리말 · 바닥의 물건 수량
  [/^\[F\] 상호작용 — (\d+)가지$/, (m) => `[F] Interact — ${m[1]} options`],
  [/^(\d+)가지$/, (m) => `${m[1]} options`],
  [/^모두 닫기 \((\d+)\)$/, (m) => `Close all (${m[1]})`],
  [/^(.+)의 심부름용 얼음 상자가 없습니다$/, (m, tr) => `You don't have ${tr(m[1])}'s errand ice crate`],
  [/^(.+)을\(를\) 발밑에 내려놓았습니다 — \[F\]로 회수$/, (m, tr) => `Put ${tr(m[1])} down at your feet — [F] to take it back`],
  [/^(.+) ×(\d+)$/, (m, tr) => `${tr(m[1])} ×${m[2]}`],
  [/^(.+) 채집하기$/, (m, tr) => `Forage ${tr(m[1])}`],
  [/^(.+) 줍기$/, (m, tr) => `Pick up ${tr(m[1])}`],
  // 이름 조각에 `·`/`›`가 있으면 합성 문장(도움말 트리 「· 사람과 대화하기」 · 경로 줄)이다 — 잡지 않고 쪼개기에 맡긴다 (187차)
  // 214차 — 집에 있는 사람(문 두드리기)
  [/^\[F\] ([^·›]+) — 문 두드리기$/, (m, tr) => `[F] ${tr(m[1])} — Knock`],
  [/^([^·›]+) — 문 두드리기$/, (m, tr) => `${tr(m[1])} — Knock`],
  [/^([^·›]+)과 대화하기$/, (m, tr) => `Talk to ${tr(m[1])}`],
  [/^([^·›]+)와 대화하기$/, (m, tr) => `Talk to ${tr(m[1])}`],
  // 1인칭 — 제압 후 남은 거리
  [/^제압 완료! 릴링으로 끌어오세요 — 남은 ([\d.]+)m$/, (m) => `Subdued! Reel it in — ${m[1]}m to go`],
  // 179차 — 원줄·목줄 스풀 이름 (브랜드 · 재질 · 호수 · 길이)
  [/^AMSTRONG (합사|카본|나일론) (원줄|목줄) (\d+(?:\.\d+)?)호 · (\d+)m$/, (m) => {
    const mat = { '합사': 'braid', '카본': 'fluorocarbon', '나일론': 'nylon' }[m[1]] ?? m[1];
    const line = m[2] === '원줄' ? 'main line' : 'leader';
    return `AMSTRONG ${mat} ${line} #${m[3]} · ${m[4]}m`;
  }],
  // 179차 — 스킬 숙련도 안내 (행동명이 끼어든다)
  [/^숙련도 필요 — 배운 뒤 (.+?)\(으\)로 채워야 효과가 납니다 \(레벨 0 = 효과 0 … 4 = 100% · 5 = 115%\)$/,
    (m, tr) => `Needs practice — once learned you fill it by ${tr(m[1])} (level 0 = no effect … 4 = 100% · 5 = 115%)`],
  // 캐스팅·장비 로그
  [/^\[요령\] (.+)$/, (m, tr) => `[Knack] ${tr(m[1])}`],
  [/^힘을 아껴 캐스팅했습니다$/, () => 'You cast without spending the effort'],
  [/^\[장비\] (.+)$/, (m, tr) => `[Gear] ${tr(m[1])}`],
  [/^찌가 깨졌습니다 — 여유분으로 교체하세요\.$/, () => 'Your float cracked — swap in a spare.'],
  // 220차 — 장바구니 거래 결과
  [/^(\d+)가지 구매 완료 \(-(.+)원\)$/, (m) => `Bought ${m[1]} kinds (-₩${m[2]})`],
  [/^(\d+)가지 판매 완료 \(\+(.+)원\)$/, (m) => `Sold ${m[1]} kinds (+₩${m[2]})`],
  [/^(.+) 구매 완료 · 가방에 자리가 없어 못 산 것: (.+)$/, (m, tr) => `${tr(m[1])} bought · no room in the bag for: ${m[2]}`],
  [/^가방에 자리가 없어 못 산 것: (.+)$/, (m) => `No room in the bag for: ${m[1]}`],
  [/^(.+) 판매 완료 · 팔지 못한 것: (.+)$/, (m, tr) => `${tr(m[1])} sold · could not sell: ${m[2]}`],
  [/^팔지 못한 것: (.+)$/, (m) => `Could not sell: ${m[1]}`],
  [/^구매 \((\d+)\)$/, (m) => `Buy (${m[1]})`],
  [/^판매 \((\d+)\)$/, (m) => `Sell (${m[1]})`],
];
