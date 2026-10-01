/**
 * @file en_tour_panels2.ts
 * @description 영어 사전 — 188차 기능창별 체험 가이드 2묶음
 *   (상점 · 유저 거래 · 채비/요리(U) · 쿨러 · 불요리 · 손질 · 도감 · 전국 지도)과
 *   그 창들에서 조작 안내 문구를 지우며 바꾼 짧은 상태 문구.
 *
 * ⚠ 키 = 코드에 적힌 한국어 원문 그대로. 원문을 고치면 여기 키도 같이 고친다.
 */

export const EN_TOUR_PANELS2: Record<string, string> = {
  // ── 상점 (tour 'shop') ──
  '가게에 들어오면 이 창이 열린다. 진열된 물건을 사고, 내 물건을 팔 수 있다. 오른쪽에는 내 가방이 함께 열린다.':
    'This window opens when you walk into a shop. You can buy what is on display and sell your own things. Your bag opens alongside it on the right.',
  '진열대에서 물건 하나를 눌러 골라 보자.': 'Click an item on the shelf to pick it.',
  '고른 칸은 초록 테두리가 된다. 칸 아래 숫자가 값이다. 커서를 올리면 설명이, 우클릭하면 자세한 정보가 뜬다.':
    'The picked slot gets a green border. The number under it is the price. Hover for a description, right-click for full details.',
  '아래 「구매」를 누르고 수량을 정해 값을 치르면 가방에 들어온다. 하나 사 보자.':
    'Press "Buy" below, choose how many and pay, and it goes into your bag. Try buying one.',
  '「구매」를 누르면 수량을 정하고 값을 치른다. 지금은 가진 돈이 모자라다.':
    'Pressing "Buy" lets you choose how many and pay. Right now you do not have enough money.',
  '가진 돈은 여기 나온다. 사고팔 때마다 바로 바뀐다.': 'Your money is shown here. It changes the moment you buy or sell.',
  '이번에는 팔아 보자. 「판매하기」를 누르자.': 'Now let us sell something. Click "Sell".',
  '「판매하기」에는 이 가게가 사들이는 내 물건이 뜬다. 가게마다 사들이는 물건이 다르다.':
    'The "Sell" tab lists the things of yours this shop will buy. Every shop buys different things.',
  '팔 물건을 하나 골라 보자.': 'Pick one thing to sell.',
  '「판매」를 누르면 값을 받고 넘긴다. 팔아 보자.': 'Press "Sell" to hand it over and get paid. Try selling it.',
  '「수리하기」에서는 고장 난 장비를 돈을 내고 고친다.': 'The "Repair" tab fixes broken gear for a fee.',
  '「위판하기」에서는 잡은 고기를 새벽 경매에 올린다.': 'The "Consign" tab puts your catch up for the dawn auction.',

  // ── 유저 거래 (tour 'trade') ──
  // 구 거래 창 버튼 (146차) — 영문 누락분
  '재화 넣기': 'Add money', '잠금': 'Lock', '확정': 'Confirm',
  '내 가방': 'My bag',
  '다른 낚시꾼과 물건을 주고받는 창이다. 왼쪽이 내가 내놓는 것, 오른쪽이 상대가 내놓는 것이다.':
    'This window is for swapping things with another angler. The left side is what you offer, the right side is what they offer.',
  '아래 내 가방에서 줄을 누르면 그 물건이 내 제안에 올라간다. 돈은 「재화 넣기」로 올린다.':
    'Click a row in your bag below to add that item to your offer. Add money with "Add money".',
  '둘 다 「잠금」을 누르면 「확정」이 열린다. 제안을 고치면 양쪽 잠금이 다시 풀린다. 둘 다 확정하면 되돌릴 수 없다.':
    'Once you both press "Lock", "Confirm" opens. Changing an offer unlocks both sides again. Once you both confirm, it cannot be undone.',

  // ── 쿨러 (tour 'cooler') ──
  '잡은 고기를 싱싱하게 담아 두는 쿨러다. 한 칸에 한 마리씩, 아홉 마리까지 들어간다.':
    'This cooler keeps your catch fresh. One fish per slot, up to nine fish.',
  '맨 위 줄과 제목에 지금 쿨러에 무엇을 채웠는지, 얼마나 더 버티는지가 나온다.':
    'The top line and the title show what the cooler is filled with and how much longer it will last.',
  '바닷가에서는 두레박으로 해수를 떠 넣어 고기를 산 채로 둔다. 얼음을 넣으면 오래 차갑게 둔다. 다 쓴 물과 얼음은 「비우기」로 버린다.':
    'By the sea, scoop seawater in with a bucket to keep fish alive. Ice keeps them cold for a long time. Throw out used water and ice with "Empty".',
  '지금 넣을 수 있는 것이 있다. 해수나 얼음을 한 번 넣어 보자.': 'You have something you can add right now. Try putting in seawater or ice.',
  '고기를 누르면 자세히 보기 · 가방으로 옮기기 · 놓아주기를 고를 수 있다.':
    'Click a fish to choose Details · Move to bag · Release.',
  '고기를 쿨러 밖으로 끌어다 놓으면 바로 가방으로 옮겨진다. 한 마리를 옮겨 보자.':
    'Drag a fish out of the cooler and drop it to move it straight into your bag. Try moving one.',
  '해수 효과 종료 — 새 해수가 필요하다': 'Seawater has run out — fresh seawater needed',
  '얼음이 녹음 — 새 얼음이 필요하다': 'The ice has melted — fresh ice needed',

  // ── 불요리 (tour 'cooking') ──
  '화구 앞에서 여는 요리 창이다. 맨 위 줄에 지금 쓰는 화구와 용기, 남은 연료가 나온다.':
    'This is the cooking window you open at a stove. The top line shows the stove, the cookware and the fuel left.',
  '요리는 먼저 화구에 용기를 올리는 데서 시작한다. 냄비 · 팬 · 석쇠에 따라 만들 수 있는 요리가 다르다. 왼쪽에서 용기 하나를 올려 보자.':
    'Cooking starts by putting cookware on the stove. What you can make depends on the pot · pan · grill. Put one piece of cookware on from the left.',
  '요리는 먼저 화구에 용기를 올리는 데서 시작한다. 냄비 · 팬 · 석쇠에 따라 만들 수 있는 요리가 다르다. 용기는 식자재마트에서 판다.':
    'Cooking starts by putting cookware on the stove. What you can make depends on the pot · pan · grill. Cookware is sold at the grocery mart.',
  '가운데에 이 용기로 만들 수 있는 요리가 뜬다. 하나를 골라 보자.': 'The middle lists the dishes this cookware can make. Pick one.',
  '오른쪽에 그 요리의 순서와 더 넣으면 좋은 재료가 나온다. 「이 요리 시작」을 누르면 조리가 시작된다.':
    'The right side shows the steps and the extras worth adding. Press "Start this recipe" to begin cooking.',
  '조리가 시작되면 왼쪽에서 재료를 양만큼 넣는다. 순서에 맞춰 넣을수록 맛이 산다.':
    'Once cooking starts, add ingredients on the left in the right amounts. Following the order makes it taste better.',
  '가운데에서 불 세기를 고른다. 온도 막대의 초록 칸이 이 요리에 알맞은 온도다.':
    'Choose the heat in the middle. The green band on the temperature bar is the right temperature for this dish.',
  '오른쪽 별 다섯 개는 지금 내렸을 때의 맛이다. 다 익으면 「불 끄고 내리기」로 요리를 꺼낸다.':
    'The five stars on the right are how it would taste if you took it off now. When it is done, take it out with "Turn off and take out".',
  '용기: 없음': 'Cookware: none',
  '만들 수 있는 요리': 'Dishes you can make',

  // ── 채비 · 요리 (U — tour 'utilization') ──
  '이 창에서는 낚시 채비를 꾸리고, 잡은 고기를 손질하고, 밑밥을 섞고, 필요한 물건을 만든다. 위 탭으로 할 일을 고른다.':
    'In this window you put together your rig, dress your catch, mix chum and make things you need. Choose a job with the tabs at the top.',
  '먼저 채비부터 꾸려 보자. 「채비하기」를 누르자.': 'Let us start with the rig. Click "Tackles".',
  '채비는 미끼를 다는 채비와 루어 채비 두 가지다. 「미끼 채비」를 눌러 보자.':
    'There are two kinds of rig: a bait rig and a lure rig. Click "Bait Rig".',
  '채비는 미끼를 다는 채비와 루어 채비 두 가지다. 여기서 바꾼다.':
    'There are two kinds of rig: a bait rig and a lure rig. You switch between them here.',
  '미끼 채비는 원줄에서 미끼까지 왼쪽부터 차례로 이어진다. 칸 하나에 부품 하나를 단다.':
    'A bait rig runs left to right from the main line to the bait. Each slot takes one part.',
  '첫 칸 「원줄」을 눌러 보자. 가방 속에서 그 칸에 달 수 있는 것만 골라 보여 준다.':
    'Click the first slot, "Main line". It shows only the things in your bag that fit that slot.',
  '목록에서 원줄 하나를 골라 달아 보자.': 'Pick a main line from the list to attach it.',
  '아직 달 부품이 없다. 가게에서 원줄 · 바늘 · 봉돌 · 찌 · 미끼를 사 오면 여기서 골라 단다.':
    'You have no parts to attach yet. Buy main line · hooks · sinkers · floats · bait at a shop and you can attach them here.',
  '부품을 달 때마다 아래 상자에서 채비 무게와 가라앉는 속도, 닿는 수심이 다시 계산된다.':
    'Every time you attach a part, the box below recalculates the rig weight, sink speed and the depth it reaches.',
  '채비를 다 꾸몄으면 「채비 고정」으로 잠근다. 고정한 채비는 던질 때 미끼 같은 소모품만 줄어들고, 실수로 바뀌지 않는다.':
    'When the rig is ready, lock it with "Lock rig". A locked rig only uses up consumables like bait when you cast, and cannot be changed by accident.',
  '「요리하기」에서는 오른쪽 가방의 고기를 도마로 끌어다 올려 손질하고, 「밑밥 품질」에서는 재료를 통에 넣어 밑밥을 섞는다.':
    'In "Cooking" you drag fish from the bag on the right onto the board to dress them, and in "Chum" you put ingredients in the bucket to mix chum.',
  '원투 채비 — 찌 없이 도래 직결, 초릿대 끝으로 입질을 본다': 'Surf rig — no float, tied straight to the swivel, bites show on the rod tip',
  '찌 채비': 'Float rig',
  '비어 있음': 'Empty',
  '채비 고정됨': 'Rig locked',
  '채비 고정 안 됨': 'Rig not locked',
  '루어 채비 — 원줄·목줄은 미끼 채비와 따로 단다. 소프트 베이트는 지그헤드에 끼워 쓰고, 봉돌은 쓰지 않는다.':
    'Lure rig — main line and leader are attached separately from the bait rig. Soft baits go on a jig head, and no sinker is used.',
  '고른 루어 없음': 'No lure chosen',
  '사시미 접시 자리': 'Sashimi plate spot',
  '사시미 접시': 'Sashimi plate',
  '밑밥 통': 'Chum bucket',
  '밑밥 재료': 'Chum ingredients',
  '오징어 회뜨기 — 가운데 1컷 + 세로 10컷 = 22점': 'Squid sashimi — 1 centre cut + 10 lengthwise cuts = 22 pieces',
  '날개살 회뜨기 — 날개당 1컷 = 4점': 'Fin sashimi — 1 cut per fin = 4 pieces',
  '촉완 분리 — 촉완 ×2 + 다리부 (회가 아닌 요리 재료)': 'Tentacle separation — 2 tentacles + arms (a cooking ingredient, not sashimi)',
  '다리 분리 — 3컷, 삶은 문어 머리 1 + 다리 8': 'Arm separation — 3 cuts, boiled octopus head 1 + arms 8',
  '숙회 썰기 — 사선 7컷 = 8점': 'Blanched slicing — 7 diagonal cuts = 8 pieces',
  '생 문어는 도마에 올릴 수 없다 — 먼저 삶아야 한다': 'Raw octopus cannot go on the board — it has to be boiled first',
  '엔가와 회썰기 — 총 2컷': 'Engawa slicing — 2 cuts in total',
  '회썰기(사시미) — 야나기바를 들면 고급 사시미': 'Sashimi slicing — premium sashimi with a yanagiba in hand',
  '담던 접시 — 담던 자리에서 이어 담는다': 'Plate in progress — carries on from where you left off',
  '회 조각 — 접시의 활성 방위에 한 점씩 담는다': 'Sashimi piece — placed one at a time in the plate\'s active quarter',
  '갈빗대 제거부터 이어서 손질': 'Continue dressing from rib removal',
  '지아이뼈 분리부터 이어서 손질': 'Continue dressing from pin-bone removal',
  '엔가와 분리부터 이어서 손질': 'Continue dressing from engawa separation',
  '박피부터 이어서 손질': 'Continue dressing from skinning',
  '도마에 올려 손질할 수 있다': 'Can be dressed on the board',

  // ── 손질 (tour 'butchery') ──
  '도마 위 고기를 직접 손질하는 창이다. 고기 위에 빛나는 선이 칼이 지나갈 길이다.':
    'This is where you dress the fish on the board yourself. The glowing line on the fish is the path your knife will take.',
  '오른쪽 위에 지금 할 작업과, 고기가 어느 쪽을 보고 있어야 하는지가 나온다.':
    'The top right shows the current job and which way the fish needs to face.',
  '지금은 고기 방향이 이 작업과 맞지 않는다. 버튼을 누르거나 F · V · R 키로 뒤집고 돌려 맞춰 보자.':
    'Right now the fish is not facing the right way for this job. Use the buttons or the F · V · R keys to flip and turn it into place.',
  '고기 방향은 이 버튼으로 뒤집고 돌린다. 키보드 F는 좌우, V는 위아래, R은 회전이다.':
    'These buttons flip and turn the fish. On the keyboard, F flips left-right, V flips top-bottom and R rotates.',
  '마우스를 누른 채 빛나는 선을 따라 끝까지 끌면 칼질이 된다. 씻거나 얼음물에 담그는 작업은 오른쪽 버튼이나 Enter로 한다.':
    'Hold the mouse button and drag along the glowing line to the end to make the cut. Washing or ice-water steps use the button on the right or Enter.',

  // ── 도감 (tour 'codex') ──
  '잡거나 만난 것은 모두 이 도감에 남는다. 위 탭으로 어종 · 해양생물 · 아이템 · 요리 · 내 조과 기록을 넘겨 본다.':
    'Everything you catch or come across is recorded in this codex. Use the tabs at the top to browse fish · sea life · items · dishes · your catch log.',
  '처음 잡거나 만난 것부터 카드가 채워진다. 오른쪽 위에 지금까지 몇 종을 만났는지 나온다.':
    'Cards fill in as you catch or meet things for the first time. The top right shows how many species you have found so far.',
  '「나의 조과 기록」을 눌러 보자.': 'Click "My Catch Log".',
  '낚은 고기가 한 마리씩 여기에 남는다. 장소별로 거르고, 최근 · 길이 · 무게 순으로 줄 세울 수 있다.':
    'Every fish you land is recorded here one by one. You can filter by place and sort by latest · length · weight.',
  '다 보면 오른쪽 위 ✕로 닫는다.': 'When you are done, close it with the ✕ at the top right.',

  // ── 전국 지도 (tour 'worldmap') ──
  '갈 수 있는 지역이 왼쪽 목록과 지도 위 핀으로 나온다. 아직 닫힌 곳은 이야기를 따라가다 보면 열린다.':
    'The regions you can visit appear in the list on the left and as pins on the map. Places still closed open up as the story goes on.',
  '지역을 고르면 지도가 그 지역으로 다가간다. 그 안에서 낚시할 구역을 골라 떠난다. 떠날 때 교통비가 든다.':
    'Pick a region and the map zooms in on it. Choose an area to fish there and set off. Travelling costs a fare.',
  '왼쪽 위 「집으로 돌아가기」를 누르면 언제든 홈타운으로 돌아간다. 집으로 가는 길은 돈이 들지 않는다.':
    'Press "Return Home" at the top left to return to your hometown at any time. Going home is free.',
  '이 지역의 세부 낚시 포인트는\n준비중입니다 (타일맵 에셋 제작 예정).':
    'Detailed fishing spots for this region\nare still in progress (tile map assets coming).',
};
