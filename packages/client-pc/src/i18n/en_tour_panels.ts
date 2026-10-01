/**
 * @file en_tour_panels.ts
 * @description 영어 사전 — 188차 기능창별 체험 가이드 문장.
 *
 * ⚠ 키 = 코드에 적힌 한국어 원문 그대로. 원문을 고치면 여기 키도 같이 고친다.
 */

export const EN_TOUR_PANELS: Record<string, string> = {
  // ── 장비창 (E) ──
  '몸에 걸친 옷과 손에 든 도구는 모두 이 장비창에 나타난다.':
    'Everything you wear and everything in your hands shows up in this Gear window.',
  '가운데는 지금의 내 모습이다. 무엇을 입고 드느냐에 따라 이 그림도 함께 바뀐다.':
    'The middle is how you look right now. The picture changes with what you wear and hold.',
  '둘레의 칸은 몸의 부위다. 칸에 마우스를 올리면 그 자리에 무엇을 걸치는지 보인다. 「릴」 칸에 마우스를 올려 보자.':
    'The slots around it are parts of your body. Hover a slot to see what goes there. Hover the "Reel" slot.',
  '장비를 벗을 때는 그 칸을 우클릭한다. 「릴」 칸을 우클릭해 릴을 벗어 보자. 벗은 장비는 가방으로 돌아간다.':
    'To take gear off, right-click its slot. Right-click the "Reel" slot to take the reel off. It goes back into your bag.',
  '장비를 걸칠 때는 가방에서 꺼내 칸에 끌어다 놓는다. I 키를 눌러 가방을 열어 보자.':
    'To put gear on, drag it from your bag onto a slot. Press I to open your bag.',
  '가방의 릴을 끌어다 「릴」 칸에 놓아 보자. 놓는 순간 몸에 걸친다.':
    'Drag the reel from your bag onto the "Reel" slot. It is equipped the moment you drop it.',
  '벗고 싶을 때는 그 칸을 우클릭하면 된다. 벗은 장비는 가방으로 돌아간다.':
    'When you want to take something off, right-click its slot. It goes back into your bag.',
  '낚싯대처럼 손에 드는 도구는 양옆의 「손(좌)」 · 「손(우)」 칸에 든다.':
    'Hand tools such as a rod go in the "Hand (L)" and "Hand (R)" slots on either side.',

  // ── 내 상태 (S) ──
  '내 몸이 지금 어떤 상태인지는 이 창에서 본다.':
    'This window shows how your body is doing right now.',
  '이름 옆은 레벨과 경험치다. 무언가를 해낼 때마다 경험치가 쌓이고, 가득 차면 레벨이 오른다.':
    'Next to your name are your level and experience. You gain experience whenever you get something done, and level up when the bar fills.',
  '초록 막대는 체력이다. 굶거나 다치면 줄고, 바닥나면 쓰러진다. 주황 막대는 피로다. 움직일수록 쌓이고, 앉아 쉬거나 잠을 자면 풀린다.':
    'The green bar is your health. It drops when you go hungry or get hurt, and you collapse when it runs out. The orange bar is fatigue. It builds up as you move, and eases when you sit and rest or sleep.',
  '아래 넷은 타고난 몸의 능력이다. 줄마다 그 능력이 낚시에서 어떤 힘이 되는지 적혀 있다.':
    'The four below are your natural abilities. Each line says how that ability helps your fishing.',
  '창은 제목줄을 잡고 끌면 원하는 자리로 옮길 수 있다. 이 창을 옆으로 끌어 보자.':
    'You can move a window anywhere by dragging its title bar. Drag this window to the side.',

  // ── 일지 (J) ──
  '맡은 일과 해야 할 일은 모두 이 일지에 적힌다.':
    'Every job you have taken on and everything you need to do is written in this journal.',
  '왼쪽은 지금 맡은 일과 새로 받을 수 있는 일이다. 한 줄을 눌러 보자.':
    'On the left are the jobs you have now and the new ones you can take. Click a row.',
  '오른쪽에는 그 일을 맡긴 사람의 이야기와 목표, 보상이 나온다. 이야기가 길면 그 칸만 휠로 굴려 읽는다.':
    'On the right is the story of whoever asked, plus the goals and the reward. If the story is long, scroll just that box with the wheel.',
  '맨 앞 칸에 체크하면 그 일이 화면의 「지금 할 일」에 붙고, 길 위에 갈 곳을 가리키는 화살표가 뜬다. 체크해 보자.':
    'Tick the first box and that job is pinned to "Current task" on screen, with an arrow on the road pointing where to go. Tick it.',
  '맨 앞 칸의 체크는 「고정」이다. 고정한 일은 화면의 「지금 할 일」에 붙고, 길 위에 갈 곳을 가리키는 화살표가 뜬다.':
    'The first box is "Pin". A pinned job sits in "Current task" on screen, with an arrow on the road pointing where to go.',
  '끝낸 일은 목록에서 감춰진다. 「완료한 할 일 표시」를 켜면 다시 볼 수 있다. 켜 보자.':
    'Finished jobs are hidden from the list. Turn on "Show completed" to see them again. Turn it on.',
  '「이야기」를 누르면 지금 장에서 걸어온 길을 한 줄로 따라 읽을 수 있다. 눌러 보자.':
    'Click "Story" to follow the road you have walked in this chapter, step by step. Click it.',
  '지나온 목표와 지금 할 목표가 한 줄로 이어진다. 「조행록」에는 지나온 장과 채워 가는 기록이 모인다.':
    'The goals behind you and the one in front of you form a single line. "Fishing log" collects past chapters and the pages you are filling in.',
  '고정됨': 'Pinned',

  // ── 면허 · 허가 (L) ──
  '바다에서 하는 일 가운데에는 자격이 있어야 할 수 있는 것이 있다. 가진 자격과 앞으로 딸 자격이 모두 이 창에 모인다.':
    'Some work at sea needs a licence. The licences you hold and the ones you can still earn are all gathered here.',
  '왼쪽은 자격 목록이다. 종류별로 묶여 있고, 이미 가진 것은 초록색으로 보인다. 궁금한 자격 하나를 눌러 보자.':
    'On the left is the list of licences, grouped by kind. The ones you already hold are green. Click one you are curious about.',
  '목록이 길면 휠을 굴려 아래를 더 볼 수 있다. 굴려 보자.':
    'When the list is long, scroll the wheel to see more. Give it a scroll.',
  '오른쪽에는 그 자격으로 무엇을 할 수 있게 되는지와, 받기 위한 조건이 적혀 있다.':
    'On the right is what that licence lets you do and what you need to get it.',
  '조건을 모두 채우면 이 단추로 발급받는다. 이야기 속에서 누군가 추천해 주면 수수료와 조건이 면제되기도 한다.':
    'Once you meet every condition, this button issues it. If someone in the story recommends you, the fee and conditions may be waived.',
  '기한이 있는 자격은 때가 되면 여기서 갱신해야 한다. 미루면 손해를 보니 가끔 들여다보자.':
    'Licences with a term must be renewed here when the time comes. Putting it off costs you, so check in now and then.',

  // ── 전체 지도 (M) ──
  '지금 있는 지역이 한 장의 지도로 펼쳐진다. 깜빡이는 빨간 점이 나다.':
    'The whole area you are in, laid out as one map. The blinking red dot is you.',
  '마우스 휠을 굴리면 지도가 커지고 작아진다. 한 번 굴려 보자.':
    'Scroll the mouse wheel to zoom the map in and out. Give it a scroll.',
  '지도를 잡고 끌면 다른 곳을 둘러볼 수 있다. 끌어 보자.':
    'Grab the map and drag to look around. Drag it.',
  '아이콘에 마우스를 올리면 그곳의 이름이 나온다. 이 아이콘에 올려 보자.':
    'Hover an icon to see the name of the place. Hover this icon.',
  '아래 줄은 지도 아이콘의 뜻이다. 가게 종류와 사람, 새 의뢰, 지금 할 일이 모두 여기 있다.':
    'The strip below explains the map icons: kinds of shops, people, new requests and your current task.',
  '가고 싶은 곳을 우클릭하면 핀이 꽂힌다. 길 위에도 그곳을 가리키는 화살표가 생긴다. 한 군데 꽂아 보자.':
    'Right-click where you want to go to drop a pin. An arrow on the road will point there too. Drop one.',
  '꽂은 핀은 그 자리를 다시 우클릭하거나 위의 「핀 제거」를 누르면 뽑힌다.':
    'To remove a pin, right-click it again or press "Remove pin" at the top.',
};
