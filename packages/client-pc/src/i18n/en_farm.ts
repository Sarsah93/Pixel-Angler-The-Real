/**
 * @file en_farm.ts
 * @description 235차 텃밭 — 텃밭 창 · 심기/거두기 안내 · 상세 보기 · 가게 설명 · 체험 가이드 · 도움말 영문.
 *
 * 작물 · 수확물 · 씨앗/모종 이름과 작물 메모 · 농자재는 데이터(`CROP_DATABASE` · `FARM_SUPPLIES`)의
 * Ko/En 쌍이 정본이다(`I18n.buildRuntimeDict`). 여기는 화면 문구만 둔다.
 */

const MONTH_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 「3~4월 · 8~9월」 → 「Mar–Apr, Aug–Sep」 (`monthRangeKo` 출력) */
export function monthRangeEn(ko: string): string {
  if (ko === '언제나') return 'year-round';
  return ko.split(' · ').map((run) => {
    const m = /^(\d+)(?:~(\d+))?월$/.exec(run);
    if (!m) return run;
    return m[2] ? `${MONTH_EN[Number(m[1])]}–${MONTH_EN[Number(m[2])]}` : MONTH_EN[Number(m[1])];
  }).join(', ');
}

export const EN_FARM: Record<string, string> = {
  // ── 창 제목 · 위 단추 ──
  '텃밭': 'Vegetable patch', '집 안 선반': 'Indoor shelf',
  '칸 보기': 'Cells', '설비': 'Equipment', '물 주기': 'Water',
  '절기 달력': 'Planting calendar',

  // ── 칸 자세히 ──
  '빈 칸': 'Empty cell', '일구지 않은 땅': 'Untilled ground',
  '심은 것': 'Planted', '지금': 'Now',
  '거둔 뒤 쉬는 중 — 철이 바뀌면 다시 올라온다': 'Resting after harvest — comes back up when the season turns',
  '다시 자람': 'Regrowth', '자람': 'Growth', '거둘 때': 'Harvest',
  '지금 거둘 수 있다': 'Ready to harvest now',
  '철이 아니다 — 철이 오면 다시 자란다': 'Out of season — grows again when its season comes',
  '품질': 'Quality', '싹 튼 비율': 'Sprouted', '뿌리 내림': 'Took root', '딴 횟수': 'Pickings',
  '흙': 'Soil', '바싹 마름': 'Bone-dry', '마름': 'Dry', '알맞음': 'Just right', '촉촉': 'Moist',
  '퇴비': 'Compost', '이번 작기에 넣었다': 'Added this season',

  // ── 할 일 단추 ──
  '일구기': 'Till', '퇴비 넣기': 'Add compost', '심기': 'Plant', '거두기': 'Harvest',
  '솎아 내기': 'Thin out', '따기': 'Pick', '걷어 내기': 'Clear', '설비 걷기': 'Take down', '놓기': 'Set up',
  '자라던 것을 걷어 낸다. 되돌릴 수 없다.': 'Pull up what is growing. This cannot be undone.',

  // ── 심을 것 · 설비 목록 ──
  '무엇을 심을까': 'What to plant',
  '가방에 심을 것이 없다 — 씨앗은 생활용품점, 모종은 식자재마트에서 판다':
    'Nothing to plant in your bag — seeds are sold at the general store, seedlings at the grocery mart',
  '누르면 이 칸에 심는다': 'Click to plant in this cell',
  '다룰 줄 알아야 놓을 수 있다': 'You need the skill to set this up',
  '놓을 설비가 없다 — 빗물통 · 차광막 · 비닐 터널은 생활용품점에서 판다':
    'No equipment to set up — rain barrels, shade nets and plastic tunnels are sold at the general store',

  // ── 심기 거부 사유(core `canPlant`) ──
  '이미 자라는 것이 있다': 'Something is already growing here',
  '먼저 땅을 갈아야 한다': 'Till the ground first',
  '실내에서 키우려면 수경 재배기가 있어야 한다': 'Growing it indoors needs a hydroponic rack',
  '마당 텃밭에 심는 작물이다': 'This crop goes in the yard patch',
  '콩나물 시루가 있어야 한다': 'Needs a sprouting jar',
  '집 안 선반에서 키운다(시루 · 배지)': 'Grown on the indoor shelf (jar or block)',
  '지금은 심을 철이 아니다': 'Not planting season now',
  '산채 재배를 배워야 기를 수 있다': 'Learn Mountain Greens to grow this',
  '수경 재배를 배워야 기를 수 있다': 'Learn Hydroponics to grow this',
  '이 작물을 기를 줄 모른다': 'You do not know how to grow this yet',
  '차광막 아래에서만 자란다': 'Grows only under a shade net',
  '찬물이 흐르는 수조가 있어야 한다': 'Needs a tank with cold running water',
  '설비가 모자라다': 'Missing equipment',
  '비닐 터널 안에서만 자란다': 'Grows only under a plastic tunnel',

  // ── 텃밭 결과 문구(FarmStore) ──
  '심어 둔 것을 다 거둔 뒤에 걷을 수 있다': 'You can take it up once everything planted is harvested',
  '설비를 돌려받을 가방 자리가 없다': 'No room in your bag to take the equipment back',
  '호미가 있어야 땅을 일굴 수 있다': 'You need a homi to till the ground',
  '이미 일군 땅이다': 'This ground is already tilled',
  '흙을 일궜다': 'Tilled the soil',
  '퇴비가 없다': 'No compost',
  '먼저 땅을 일궈야 한다': 'Till the ground first',
  '이번 작기에는 이미 퇴비를 넣었다': 'Compost is already in for this season',
  '퇴비를 넣을 수 없다': 'Cannot add compost',
  '퇴비를 넣었다': 'Added compost',
  '물뿌리개가 있어야 물을 줄 수 있다': 'You need a watering can to water',
  '물을 줄 칸이 없다 — 먼저 땅을 일군다': 'No cells to water — till the ground first',
  '흙이 촉촉해졌다': 'The soil is moist now',
  '심을 수 있는 것이 아니다': 'That cannot be planted',
  '칸이 없다': 'No such cell',
  '심을 수 없다': 'Cannot plant',
  '아직 거둘 때가 아니다': 'Not ready to harvest yet',
  '거둘 것이 없다': 'Nothing to harvest',
  '가방에 자리가 없다 — 한 칸 비우고 거둔다': 'No room in your bag — free a slot, then harvest',
  '지금은 솎거나 딸 것이 없다': 'Nothing to thin or pick right now',
  '거둔 것을 담을 수 없다': 'Cannot hold what you harvested',
  '걷어 낼 것이 없다': 'Nothing to clear',
  '여기에 놓는 설비가 아니다': 'That equipment does not go here',
  '이미 놓았다': 'Already set up',
  '놓인 설비가 아니다': 'That equipment is not set up here',
  '돌려받을 수 없다': 'Cannot take it back',
  '아직 걷을 수 없다': 'Cannot take it up yet',

  // ── 필드 · 집 안 [F] ──
  '[F] 텃밭 · [Shift+F] 회수': '[F] Vegetable patch · [Shift+F] Pack up',
  '[F] 텃밭': '[F] Vegetable patch',
  '[F] 기르는 것 보기': '[F] Check what is growing',

  // ── 아이템 · 가게 ──
  '농산물': 'Produce', '씨앗 · 모종': 'Seeds & seedlings', '농사 도구': 'Farm tools',
  '마당 풀밭에 4×3칸 텃밭 한 구획을 낸다. 칸마다 호미로 일궈야 심을 수 있다.':
    'Lays out a 4×3-cell vegetable patch on the yard lawn. Till each cell with a homi before planting.',
  '집으로 배달되어 「넣어 둔 가구」 칸에 들어간다.': 'Delivered to your home, into Stored furniture.',

  // ── 상세 보기(씨앗 · 모종 / 수확물) ──
  '채소': 'Vegetables', '직접 기른 채소': 'Homegrown', '가게에서 산 채소': 'Store-bought',
  '흔하다': 'Common', '드물다': 'Uncommon', '귀하다': 'Rare', '아주 귀하다': 'Very rare',
  '배워야 기른다': 'Must be learned first',
  '심는 방법': 'How to plant', '심는 곳': 'Where', '마당 텃밭': 'Yard vegetable patch',
  '심는 철': 'Planting months', '언제나': 'Year-round', '거두기까지': 'Days to harvest',
  '한 칸에': 'Per cell', '싹 트는 비율': 'Germination rate', '뿌리 내리는 비율': 'Take rate',
  '거두는 것': 'Yields', '자라는 동안': 'While growing', '갖출 것': 'Needs', '구하기': 'Availability', '마트': 'Mart',
  '씨앗을 뿌린다': 'Sow the seeds',
  '모종을 옮겨 심는다 — 기르는 기간이 짧다': 'Transplant the seedling — shorter to harvest',
  '덩이 · 줄기 · 배지를 묻는다': 'Bury the tuber, cutting or block',
  '팔지 않는 작물 — 직접 길러야 손에 넣는다': 'Not sold in shops — grow it yourself to get it',
  '팔지 않는 작물': 'Not sold in shops',
  '집 안 선반은 콩나물 시루나 수경 재배기를 들여놓으면 생긴다.':
    'You get an indoor shelf by bringing a sprouting jar or a hydroponic rack into the house.',
  '등급': 'Grade', '작물': 'Crop', '파는 값 (오늘)': 'Sells for (today)', '이번 달 시세': "This month's market",
  '귀한 철 — 값이 오른다': 'Scarce season — prices up', '흔한 철 — 값이 내린다': 'Glut season — prices down',
  '사 주는 곳': 'Buyers', '식자재 마트 · 식당': 'Grocery mart · restaurant',
  '직접 기른 채소 — 요리 별 다섯 개를 막지 않는다': 'Homegrown — never holds a dish back from five stars',
  '시루': 'Sprouting jar', '콩나물로 앉힐 수 있다': 'Can go into the sprouting jar',

  // ── 퀘스트 방법 한 줄(core QuestGuide) ──
  '집 마당 텃밭 [F] → 칸을 호미로 일구고 씨앗 · 모종을 심는다':
    'Yard vegetable patch [F] → till cells with the homi and plant seeds or seedlings',

  // ── 체험 가이드(텃밭 · 집 안 선반) ──
  '집 안 선반이다. 시루에는 콩나물 · 숙주 · 새싹을, 수경 재배기에는 잎채소를 기른다. 철을 타지 않는다.':
    'The indoor shelf. The jar grows bean sprouts, mung sprouts and microgreens; the hydroponic rack grows leafy greens. No seasons indoors.',
  '칸을 누르면 오른쪽에 자라는 정도와 거둘 때가 보인다.': 'Click a cell to see on the right how far it has grown and when it is ready.',
  '시루는 자주 물을 줘야 곧게 자란다. 물을 한 번 줘 보자.': 'The jar needs frequent watering to grow straight. Try watering once.',
  '텃밭 한 구획이다. 한 칸이 한 평 남짓 — 실제 시간대로, 실제 계절대로 자란다. 꺼 둔 동안에도 자란다.':
    'One vegetable patch. Each cell is about a square metre — it grows on real time and real seasons, even while the game is off.',
  '먼저 호미로 흙을 일군다. 칸을 고르고 「일구기」를 눌러 보자.': 'First, till the soil with the homi. Pick a cell and press "Till".',
  '일군 칸에 씨앗이나 모종을 심는다. 모종은 비싸지만 싹 틔우는 몇 주를 건너뛴다.':
    'Plant seeds or seedlings in a tilled cell. Seedlings cost more but skip the weeks of raising them from seed.',
  '비가 오면 저절로 물이 든다. 흙이 마르면 자람이 멈추고 품질이 조금씩 떨어질 뿐 — 시들어도 죽지는 않는다.':
    'Rain waters it for you. Dry soil only pauses growth and slowly lowers quality — plants wilt, but they never die.',
  '거둔 채소는 식자재마트 · 식당이 산다. 값은 철과 그 주 날씨를 따라 오르내린다. 직접 기른 채소라야 요리가 별 다섯이 된다.':
    'The grocery mart and restaurants buy your produce. Prices follow the season and that week\'s weather. Only homegrown vegetables let a dish reach five stars.',

  // ── 도움말(F1) 「텃밭」 ──
  '가꾸기': 'Growing', '텃밭 내기와 심기': 'Laying out and planting', '실제 시간 · 실제 계절': 'Real time, real seasons',
  '거두기 · 등급 · 시세': 'Harvest, grades and prices', '농사 스킬': 'Farming skills',
  '키트 · 호미 · 씨앗': 'Kit, homi and seeds', '꺼 둔 동안에도 자란다': 'It grows while the game is off',
  '특 · 상 · 보통': 'Prime, High, Normal', '요리와 별 다섯': 'Cooking and the fifth star', '시루 · 수경 재배기': 'Sprouting jar and hydroponic rack',
  '스킬 트리 「농사」': 'Skill tree: Farming',
  '생활용품점에서 텃밭 개간 키트를 사서 홈타운 마당의 풀밭에 놓으면 4×3칸 텃밭 한 구획이 생깁니다. 한 칸은 한 평 남짓입니다. 텃밭 앞에서 [F]를 누르면 텃밭 창이 열리고, [Shift+F]는 심어 둔 것이 없을 때만 텃밭을 거둡니다.':
    'Buy a Garden Plot Kit at the general store and place it on the grass of your hometown yard to lay out a 4×3-cell vegetable patch. Each cell is about a square metre. Press [F] in front of it to open the patch window; [Shift+F] packs the patch up, but only when nothing is planted.',
  '칸마다 먼저 호미로 흙을 일궈야 심을 수 있습니다. 호미 · 퇴비 · 씨앗 봉투는 생활용품점, 모종과 씨감자 · 마늘 종구 같은 덩이는 식자재마트가 팝니다. 모종과 덩이는 심을 철에만 진열됩니다.':
    'Each cell must be tilled with a homi before you can plant it. The general store sells the homi, compost and seed packets; the grocery mart sells seedlings and sets such as seed potatoes and garlic bulbs. Seedlings and sets are only on the shelf in their planting months.',
  '씨앗은 싸지만 싹이 트는 비율만큼만 서고 오래 걸립니다. 모종은 비싸지만 싹 틔우는 몇 주를 건너뛰고 거의 다 뿌리를 내립니다. 씨앗 · 모종을 우클릭 [상세보기]하면 심는 철 · 거두기까지 · 한 칸에 드는 양 · 칸당 거두는 양이 나옵니다.':
    'Seeds are cheap, but only as many come up as germinate, and they take longer. Seedlings cost more, skip the weeks of raising them, and nearly all take root. Right-click a seed or seedling → [Details] for its planting months, days to harvest, how much one cell takes and how much one cell yields.',
  '작물은 실제 시간대로 자라고, 게임을 꺼 둔 동안에도 자랍니다. 철도 실제 달을 따릅니다 — 자라는 달 밖에서는 멈추고, 겨울을 나는 작물(마늘 · 양파 · 보리 · 시금치)은 겨울에 쉬었다가 봄에 이어 자랍니다.':
    'Crops grow on real time, even while the game is off. Seasons follow the real month too — outside their growing months crops stop, and crops that winter over (garlic, onion, barley, spinach) rest through winter and carry on in spring.',
  '비가 오면 저절로 물이 듭니다(화면에 보이는 그 비입니다). 흙이 마르면 자람이 멈추고 품질이 조금씩 떨어질 뿐, 시들어도 죽지는 않습니다. 물은 물뿌리개를 가방에 두고 텃밭 창의 [물 주기]로 줍니다. 퇴비는 심기 전에 넣으면 이번 작기에 더 빨리 자라고 품질이 오릅니다.':
    'Rain waters the patch for you (the same rain you see on screen). Dry soil only pauses growth and slowly lowers quality — plants wilt, but they never die. To water, keep a watering can in your bag and press [Water] in the patch window. Compost worked in before planting speeds up this season and raises quality.',
  '여름에는 병충해로 품질이 가끔 떨어지고, 다 익은 뒤 오래 두면 꽃대가 서거나 쇠어 품질이 내려갑니다. 겨울을 나지 못하는 작물을 서리 내리는 달에 밭에 두면 조금씩 상합니다.':
    'In summer, pests now and then knock quality down, and crops left long after they ripen bolt or turn tough and lose quality. Crops that cannot winter over slowly suffer if left out in the frost months.',
  '빗물통은 자리를 비운 동안에도 흙이 바짝 마르지 않게 합니다. 차광막 아래에서는 그늘을 좋아하는 산나물을 기릅니다. 비닐 터널(온실 스킬)은 철 앞뒤로 한 달씩 더 기르고 추운 달에 빨리 자라게 하지만 비를 막습니다. 냉수 순환 수조(수경 재배 스킬)가 있어야 고추냉이를 기릅니다.':
    'A rain barrel keeps the soil from going bone-dry while you are away. Shade-loving mountain greens grow under a shade net. A plastic tunnel (Greenhouse skill) adds a month on each side of the season and speeds up cold months, but it keeps the rain off. Wasabi needs a cold-water circulation tank (Hydroponics skill).',
  '설비는 텃밭 창 위쪽 [설비]에서 놓고 걷습니다. 퇴비 · 설비로 빨라지는 데에는 상한이 있습니다 — 잎채소는 두 배, 열매 · 뿌리 · 곡식은 1.4배까지입니다.':
    'Set up and take down equipment from [Equipment] at the top of the patch window. Compost and equipment speed growth only so far — up to 2× for leafy greens and 1.4× for fruit, roots and grain.',
  '다 자란 칸은 작물 그림 위에 수확물이 보입니다. [거두기]를 누르면 품질에 따라 특 · 상 · 보통 등급으로 가방에 들어갑니다(등급마다 따로 쌓입니다). 상추 · 깻잎 · 고추처럼 따고 나서 다시 자라는 작물은 몇 번 더 거둡니다.':
    'A ripe cell shows the produce on top of the plant. Press [Harvest] and it goes into your bag as Prime, High or Normal depending on quality (each grade stacks separately). Crops that grow back after picking, like lettuce, perilla and chili, give several more harvests.',
  '긴 작물은 자라는 동안 중간 수확이 있습니다 — 솎은 어린 무 · 마늘종 · 고구마순 · 고춧잎 · 호박잎. 씨앗으로 뿌린 칸은 솎아 내면 남은 포기가 굵어집니다.':
    'Long crops give an in-between harvest while growing — thinned young radish, garlic scapes, sweet-potato stems, pepper leaves and pumpkin leaves. In cells sown from seed, thinning makes the remaining plants grow bigger.',
  '거둔 채소는 식자재마트와 식당이 삽니다(수산물 직판장은 사지 않습니다). 값은 달마다의 철과 그 주의 날씨 · 작황을 따라 오르내리고, 상세보기의 「이번 달 시세」가 귀한 철인지 흔한 철인지 알려 줍니다.':
    'The grocery mart and restaurants buy your produce (the fish market does not). Prices move with the month\'s season and that week\'s weather and harvests; "This month\'s market" in Details tells you whether it is a scarce or a glut season.',
  '직접 기른 채소는 갓 거둔 신선함 그대로 요리에 들어갑니다. 가게에서 산 채소가 하나라도 들어간 요리는 다섯째 별이 켜지지 않습니다 — 요리 스킬 「요리 손」을 끝까지 올리면 반 개를 더해 4.5개까지 받습니다.':
    'Homegrown vegetables go into a dish as fresh as the day you picked them. A dish with even one store-bought vegetable never lights its fifth star — max out the Cook\'s Hands skill and it gets half a star more, up to 4.5.',
  '마트에서 팔지 않는 작물(아욱 · 근대 · 차조기 · 방아 · 양하 · 박 · 딜 · 산나물 · 고추냉이 · 노루궁뎅이 같은 것)은 직접 길러야만 손에 넣습니다. 귀한 씨앗일수록 가게에 들어오는 수가 적습니다.':
    'Crops the mart never sells (mallow, chard, shiso, Korean mint, myoga, bottle gourd, dill, mountain greens, wasabi, lion\'s mane and the like) can only be had by growing them. The rarer the seed, the fewer the shop gets in.',
  '생활용품점의 콩나물 시루 · 수경 재배기는 집으로 배달되어 「넣어 둔 가구」 칸에 들어갑니다. 방에 놓고 앞에서 [F](기르는 것 보기)를 누르면 집 안 선반 네 칸이 열립니다.':
    'The sprouting jar and hydroponic rack from the general store are delivered home into Stored furniture. Place one in a room and press [F] (Check what is growing) in front of it to open the four-slot indoor shelf.',
  '시루에서는 콩나물 · 숙주 · 새싹을, 수경 재배기에서는 잎채소를 철과 상관없이 기릅니다. 느타리 배지도 선반에서 돋습니다. 시루는 흙이 빨리 마르니 자주 물을 줍니다(집 안에서는 물뿌리개가 없어도 됩니다).':
    'The jar grows bean sprouts, mung sprouts and microgreens, and the hydroponic rack grows leafy greens, whatever the season. Oyster mushroom blocks fruit on the shelf too. Jars dry out fast, so water often (indoors you do not need a watering can).',
  '텃밭에서 거둔 콩은 시루에 앉혀 콩나물로 기를 수 있습니다.': 'Soybeans from your patch can go into the jar to become bean sprouts.',
  '개간(한 번에 한 줄을 간다) · 물주기(흙이 덜 마른다) · 수확량 · 씨앗 회수(거둘 때 씨앗 한 봉) · 파종 감각(싹 트는 비율) · 비료 효율 · 해충 방제 · 절기 독해(텃밭 창에 심는 달 달력) · 온실 · 산채 재배 · 수경 재배.':
    'Tilling (a whole row at once), Watering (soil dries slower), Harvest Yield, Seed Saver (a packet of seed at harvest), Sowing Sense (germination), Fertilizer, Pest Control, Almanac Reading (a planting calendar in the patch window), Greenhouse, Mountain Greens and Hydroponics.',
  '산채 재배를 배우면 곰취 · 산마늘 · 눈개승마 · 두릅 같은 산나물 모종이 식자재마트에 들어오고, 수경 재배를 배우면 냉수 순환 수조와 고추냉이 모종을 다룰 수 있습니다.':
    'Learn Mountain Greens and the grocery mart starts stocking mountain-green seedlings such as gomchwi, alpine leek, goat\'s beard and fatsia shoots; learn Hydroponics and you can run a cold-water tank and grow wasabi seedlings.',
  '광질 · 벌목': 'Mining & logging', '광질 · 벌목 (계획)': 'Mining & logging (planned)',
  '초지 · 암반에서 광물을 캐 요리와 제작 · 건축 재료로 씁니다. 홈타운의 나무 · 바위(벌목 · 채굴)도 이때 열립니다.':
    'Dig minerals from grassland and bedrock for cooking, crafting and building. Hometown trees and rocks (logging, quarrying) open up then too.',
  '텃밭은 열렸습니다 — 「텃밭」 카테고리를 보세요. 바다 채집(해루질)은 「채집 · 통발」에 있습니다.':
    'The vegetable patch is open — see the Vegetable patch category. Sea foraging is under Gathering · Traps.',
};

export const EN_FARM_RULES: [RegExp, (m: RegExpMatchArray, tr: (s: string) => string) => string][] = [
  // 칸 자세히 · 상세 보기 — 날 수 · 비율
  [/^(\d+)일 전$/, (m) => `${m[1]} day${m[1] === '1' ? '' : 's'} ago`],
  [/^약 (\d+)일 뒤$/, (m) => `In about ${m[1]} day${m[1] === '1' ? '' : 's'}`],
  [/^(\d+)일 안팎$/, (m) => `About ${m[1]} days`],
  [/^(\d+)% 안팎$/, (m) => `About ${m[1]}%`],
  [/^(\d+)봉$/, (m) => `${m[1]} packet${m[1] === '1' ? '' : 's'}`],
  [/^(\d+)포기$/, (m) => `${m[1]} plant${m[1] === '1' ? '' : 's'}`],
  [/^(\d+)몫$/, (m) => `${m[1]} portion${m[1] === '1' ? '' : 's'}`],
  [/^칸당 (\d+)(?:~(\d+))?개$/, (m) => `${m[1]}${m[2] ? `–${m[2]}` : ''} per cell`],
  [/^(\d+)일마다 (\d+)번 더$/, (m) => `${m[2]} more, every ${m[1]} days`],
  [/^한 칸에 (\d+)포기를 심는다\.$/, (m) => `Plant ${m[1]} per cell.`],
  // 달 묶음(「3~4월 · 8~9월」) · 심기 거부
  [/^(\d+(?:~\d+)?월(?: · \d+(?:~\d+)?월)*)$/, (m) => monthRangeEn(m[1])],
  [/^(.+)에 심는다$/, (m) => `plant in ${monthRangeEn(m[1])}`],
  // 텃밭 결과
  [/^(\d+)칸을 일궜다$/, (m) => `Tilled ${m[1]} cells`],
  [/^(\d+)개가 있어야 한 칸을 채운다 \((\d+)개\)$/, (m) => `Need ${m[1]} to fill one cell (you have ${m[2]})`],
  [/^(.+)을\(를\) 심었다$/, (m, tr) => `Planted ${tr(m[1])}`],
  [/^(.+) (\d+)개를 거뒀다$/, (m, tr) => `Harvested ${tr(m[1])} ×${m[2]}`],
  [/^(.+)을\(를\) 걷어 냈다$/, (m, tr) => `Cleared the ${tr(m[1])}`],
  [/^(.+)이\(가\) 없다$/, (m, tr) => `You have no ${tr(m[1])}`],
  [/^(.+)을\(를\) 놓았다$/, (m, tr) => `Set up the ${tr(m[1])}`],
  [/^(.+)을\(를\) 걷었다$/, (m, tr) => `Took down the ${tr(m[1])}`],
  // 채널 로그 「[텃밭] 상추 한 줌 (100g) · 특 ×3」 — 등급 꼬리 뒤 수량
  [/^(.+ · (?:특|상|보통)) ×(\d+)$/, (m, tr) => `${tr(m[1])} ×${m[2]}`],
];
