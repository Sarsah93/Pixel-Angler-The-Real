/**
 * @file en_cure.ts
 * @description 285차 — 갈무리(건조 걸대 · 장독) · 씨 받기 · 받은 씨앗 · 런너 · 씨앗으로 덜기 · 나물 볶음 도감 영문.
 *
 * 이름(할 일 · 드는 것 · 나온 것 · 설비 · 받은 씨앗)은 데이터 Ko/En 쌍이 정본이다(`I18n.buildRuntimeDict` —
 * `CURE_RECIPES` · `CURE_ITEMS` · `CURE_STATION_LABEL` · `savedSeedTemplate`). 여기는 화면 문구와 수치가 섞인 문장 규칙만 둔다.
 */

type Tr = (s: string) => string;
type CureRule = [RegExp, (m: RegExpMatchArray, tr: Tr) => string];

const G = '([\\d.,]+k?g)';
const days = (n: string): string => `${n} day${n === '1' ? '' : 's'}`;
const hours = (n: string): string => `${n} hour${n === '1' ? '' : 's'}`;

export const EN_CURE: Record<string, string> = {
  // ── 갈무리 창 ──
  '갈무리': 'Preserving',
  '놓인 설비가 없다': 'No equipment placed',
  '건조 걸대나 장독을 놓으면 여기서 건다': 'Place a drying rack or a crock to use this',
  '드는 것': 'Takes',
  '걸리는 날': 'Time',
  '걸기': 'Hang',
  '담그기': 'Pickle',
  '걸어 둔 것': 'In progress',
  '도로 걷기': 'Take back',
  '다 되기 전에 걷어 버린다. 되돌릴 수 없다.': 'Throws it away before it is done. This cannot be undone.',
  // 체험 가이드
  '갈무리다. 건조 걸대에는 무청을 엮어 걸어 시래기로 말리고, 옥수수수염을 말려 덖는다. 장독에는 깻잎 · 콩잎을 담가 장아찌로 삭힌다.':
    'This is where the harvest is put by. Radish greens are braided and hung on the drying rack to become siraegi, and corn silk is dried and toasted. Perilla and soybean leaves go into the crock to cure into pickles.',
  '왼쪽에서 할 일을 고른다. 이 텃밭에 놓인 설비에서 할 수 있는 것만 나온다 — 재료가 다 있으면 초록 글씨다.':
    'Pick a job on the left. Only jobs for the equipment placed in this plot appear — green text means you have everything.',
  '드는 것 · 걸리는 날 · 나오는 것을 미리 본다. 날은 실제 날짜로 센다 — 게임을 꺼 둔 사이에도 마른다.':
    'Check what it takes, how long it takes and what you get. Days are real days — it keeps drying while the game is closed.',
  '걸어 둔 것은 여기에 남는다. 다 되면 거둔다. 방금 건 것은 도로 걷을 수 있다.':
    'What you hang stays here. Collect it when it is done. Something you just hung can be taken back.',
  // ── 갈무리 결과 ──
  '건조 걸대를 놓아야 건다': 'Place a drying rack first',
  '장독을 놓아야 담근다': 'Place a crock first',
  '걸대가 다 찼다 — 마른 것을 먼저 거둔다': 'The rack is full — collect what has dried first',
  '장독이 다 찼다 — 삭은 것을 먼저 꺼낸다': 'The crock is full — take out what has cured first',
  '할 수 없는 일이다': 'That can’t be done',
  '걸어 둔 것이 없다': 'Nothing is hanging',
  '아직 덜 됐다': 'Not done yet',
  '거둘 수 없다': 'Cannot collect',
  '가방에 자리가 없다 — 한 칸 비우고 거둔다': 'No room in the bag — free a slot, then collect',
  '가방에 자리가 없다 — 한 칸 비우고 걷는다': 'No room in the bag — free a slot, then take it back',
  '도로 걷어 가방에 넣었다': 'Took it back into the bag',
  '걷어 버렸다': 'Threw it away',
  '이미 다 됐다 — 거둔다': 'Already done — collect it',
  // ── 텃밭 · 설비 ──
  '걸어 둔 것을 먼저 거둔다 — 갈무리 창에서': 'Collect what is hanging first — in the preserving window',
  '걸대 · 장독에 걸어 둔 것을 먼저 거둔다': 'Collect what is on the rack or in the crock first',
  '런너 모종 떼기': 'Take runner plants',
  '뿌리내린 런너 모종을 떼어 냈다': 'took off the rooted runner plants',
  '씨 받기': 'Save seed',
  '이번에는 거두지 않고 씨를 받는다. 칸은 비워진다.': 'Save seed instead of harvesting this time. The cell will be cleared.',
  '씨를 받을 포기가 없다': 'No plant to save seed from',
  '가방에 자리가 없다 — 한 칸 비우고 씨를 받는다': 'No room in the bag — free a slot, then save seed',
  '씨를 받을 수 없다': 'Cannot save seed',
  '털어 낸 낱알에서 씨앗을 던다 — 가방에서 「씨앗으로 덜기」': 'Set aside seed from the threshed grain — 「Set aside as seed」 in the bag',
  '씨를 받아 심는 작물이 아니다': 'Not a crop you save seed from',
  '지금은 씨를 받을 수 없다': 'You cannot save seed now',
  '다 익어야 씨가 여문다': 'The seed only sets once it is fully ripe',
  '사 온 씨가 교잡종이면 받은 씨는 고르지 않다': 'if the bought seed was a hybrid, saved seed comes up uneven',
  '씨앗으로 덜 수 있는 낱알이 아니다': 'This grain cannot be set aside as seed',
  // ── 도움말(F1) ──
  '갈무리 · 씨 받기': 'Preserving · saving seed',
  '생기름 · 압맥 · 다 됐을 때': 'Raw oil · rolled barley · when it is ready',
  '깨를 볶지 않고 짜는 생참기름 · 생들기름도 맡길 수 있습니다 — 향이 순하고 빛이 맑지만 볶은 것보다 덜 나와 깨가 더 듭니다(350ml 한 병에 참깨 약 1kg · 들깨 약 1.1kg). 공임은 1kg에 5,000원이고 한 시간 반 뒤에 찾습니다.':
    'You can also have raw sesame or perilla oil pressed from unroasted seed — milder and clearer, but less comes out, so it takes more seed (about 1kg of sesame or 1.1kg of perilla per 350ml bottle). The fee is 5,000 won per kg and it is ready in an hour and a half.',
  '털어 둔 보리는 1kg 단위로 눌러 압맥으로 만들어 줍니다(공임 1kg에 1,500원 · 30분). 압맥은 밥에 섞고, 밑밥에도 갭니다.':
    'Threshed barley is rolled flat into apmaek in 1kg lots (1,500 won per kg · 30 minutes). Rolled barley goes into rice and into groundbait.',
  '맡긴 일이 다 되면 채널에 한 줄로 알립니다. 손목시계를 차고 있으면 「삐빅 · 삐빅 · 삐빅」 알람과 함께 작은 알림 창이 뜹니다. 방앗간 문 위와 지도에는 초록 느낌표가 찾아갈 때까지 떠 있습니다.':
    'When an order is ready, a line appears in the channel. If you wear a wristwatch, it beeps three times and a small alert pops up. A green exclamation mark stays over the mill door and on the map until you collect it.',
  '건조 걸대 · 장독': 'Drying rack · crock',
  '생활용품점에서 파는 건조 걸대와 장독을 텃밭에 놓으면 텃밭 창 위 설비 칩(또는 [설비] → [갈무리])에서 갈무리 창이 열립니다.':
    'Place a drying rack or a crock (sold at the general store) in a plot, then open the preserving window from the equipment chip at the top of the farm window (or [Equipment] → [Preserving]).',
  '걸대에는 무청을 엮어 걸어 시래기로 말립니다(엿새 · 소금을 넣어 데쳐 말리면 사흘). 옥수수수염 50g을 이틀 말려 덖으면 옥수수수염차 한 봉이 됩니다.':
    'On the rack, braided radish greens dry into siraegi (six days, or three if blanched in salted water first). 50g of corn silk dried for two days and toasted makes one pack of corn silk tea.',
  '장독에는 깻잎 다섯 묶음과 진간장 4큰술로 깻잎 장아찌(일주일 · 10장씩 열 통), 단풍콩잎 두 묶음과 소금 3큰술로 콩잎 장아찌(두 주 · 10장씩 네 통)를 담급니다. 걸대는 여섯 줄, 장독은 네 칸까지 겁니다.':
    'In the crock, five bundles of perilla leaves and 4 tbsp of soy sauce make pickled perilla leaves (a week · ten tubs of 10 leaves), and two bundles of yellowed soybean leaves with 3 tbsp of salt make pickled bean leaves (two weeks · four tubs of 10). A rack holds six lines and a crock four batches.',
  '날은 실제 날짜로 셉니다 — 게임을 꺼 둔 사이에도 마릅니다. 다 되면 채널(시계를 차면 알람)로 알리고, 설비 칩에 초록 점이 찍힙니다. 방금 건 것(한 시간 안)은 도로 걷을 수 있고, 그 뒤에 걷으면 버리게 됩니다.':
    'Days are real days — it keeps drying while the game is closed. When it is done you get a channel line (an alarm if you wear a watch) and a green dot on the equipment chip. Something hung within the last hour can be taken back; after that, taking it down throws it away.',
  '말린 시래기는 요리에서 시래기로 쓰고, 장아찌는 그냥 먹습니다. 식자재마트 · 식당이 삽니다.':
    'Dried siraegi cooks as siraegi, and the pickles are eaten as they are. Grocery marts and restaurants buy them.',
  '씨 받기 · 받은 씨앗': 'Saving seed · saved seed',
  '상추 · 깻잎 · 쑥갓 · 비름 · 고추 · 토마토 · 오이처럼 집에서 흔히 씨를 받는 작물은 다 익은 칸에 [씨 받기] 단추가 뜹니다 — 그 작기는 거두지 않고 「받은 ○○ 씨앗」 2~4봉을 얻습니다(칸은 빕니다).':
    'Crops people commonly save seed from at home — lettuce, perilla, crown daisy, amaranth, chili, tomato, cucumber — show a [Save seed] button on a ripe cell. You skip that harvest and get 2–4 packs of “Saved … seeds” (the cell is cleared).',
  '콩 · 들깨 · 참깨 · 보리는 털어 낸 낱알에서 덥니다 — 가방에서 우클릭 [씨앗으로 덜기](한 칸 분 = 콩 6g · 깨 1g · 보리 16g).':
    'Beans, perilla, sesame and barley are set aside from the threshed grain — right-click it in the bag and choose [Set aside as seed] (one cell = 6g of beans · 1g of sesame or perilla · 16g of barley).',
  '받은 씨앗은 산 씨앗과 똑같이 심지만 조금 덜 고르게 납니다. 고추 · 토마토 · 오이처럼 산 씨가 대개 교잡종인 작물은 받은 씨로 심으면 수확이 조금 줍니다.':
    'Saved seed is sown just like bought seed but comes up a little less evenly. For crops whose bought seed is usually a hybrid — chili, tomato, cucumber — saved seed gives a slightly smaller harvest.',
  '딸기 런너': 'Strawberry runners',
  '한 해를 넘겨 자리 잡은 딸기는 여름(6~8월)에 기는줄기(런너) 끝에 뿌리내린 새끼 포기를 떼어 모종으로 씁니다 — 텃밭 창 칸 자세히의 [런너 모종 떼기](호미 · 한 해 한 번).':
    'Strawberries that have settled in for over a year send out runners in summer (June–August); the rooted plantlets at the tips are taken off and used as new plants — [Take runner plants] in the cell details of the farm window (needs a homi · once a year).',
  // ── 도감 ──
  '나물 종류별 변형': 'Varies by greens',
  '다른 나물이나 들깨가루를 넣어 보세요': 'Try other greens, or add perilla powder',
};

export const EN_CURE_RULES: CureRule[] = [
  [/^\[갈무리\] 텃밭 (.+)의 「(.+)」(?:이|가) 다 됐습니다 — 거두러 가세요\.$/, (m, tr) => `[Preserving] ${tr(m[2])} on the ${tr(m[1]).toLowerCase()} is done — go and collect it.`],
  [/^텃밭 (.+)의 「(.+)」(?:이|가) 다 됐습니다 — 거두러 가세요\.$/, (m, tr) => `${tr(m[2])} on the ${tr(m[1]).toLowerCase()} is done — go and collect it.`],
  [/^(건조 걸대|장독) (\d+)\/(\d+)$/, (m, tr) => `${tr(m[1])} ${m[2]}/${m[3]}`],
  [/^(건조 걸대|장독) · 가방 (\d+)$/, (m, tr) => `${tr(m[1])} · in bag ${m[2]}`],
  [/^(.+) {2}— {2}가방 (\d+)\/(\d+)$/, (m, tr) => `${tr(m[1])}  —  in bag ${m[2]}/${m[3]}`],
  [/^(\d+)일 (\d+)시간 남음$/, (m) => `${days(m[1])} ${hours(m[2])} left`],
  [/^(\d+)일 남음$/, (m) => `${days(m[1])} left`],
  [/^(\d+)시간 남음$/, (m) => `${hours(m[1])} left`],
  [/^(.+) — (\d+)일 뒤에 거둔다$/, (m, tr) => `${tr(m[1])} — collect in ${days(m[2])}`],
  [/^거뒀다 — (.+) (\d+)개$/, (m, tr) => `Collected — ${tr(m[1])} ×${m[2]}`],
  [/^(.+)(?:이|가) 모자란다 \((\d+)\/(\d+)\)$/, (m, tr) => `Not enough ${tr(m[1]).toLowerCase()} (${m[2]}/${m[3]})`],
  // 씨 받기 · 런너
  [/^(.+) 뿌리내린 런너 모종을 떼어 냈다$/, (m, tr) => `Took rooted runner plants off the ${tr(m[1])}`],
  [/^(.+) 씨를 받았다 — (.+) (\d+)봉( — 사 온 씨가 교잡종이면 받은 씨는 고르지 않다)?$/, (m, tr) =>
    `Saved ${tr(m[1])} seed — ${tr(m[2])} ×${m[3]}${m[4] ? ' — if the bought seed was a hybrid, saved seed comes up uneven' : ''}`],
  [/^씨앗으로 덜기 \((\d+)칸 분\)$/, (m) => `Set aside as seed (${m[1]} cell${m[1] === '1' ? '' : 's'})`],
  [new RegExp(`^${G}이 있어야 한 칸 분을 던다$`), (m) => `You need ${m[1]} for one cell’s worth`],
  [new RegExp(`^${G}을 덜어 (.+) (\\d+)봉으로 나눠 담았다$`), (m, tr) => `Set aside ${m[1]} as ${tr(m[2])} ×${m[3]}`],
];
