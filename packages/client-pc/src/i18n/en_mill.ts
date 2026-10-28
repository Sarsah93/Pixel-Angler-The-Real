/**
 * @file en_mill.ts
 * @description 284차 — 무게 수확물(g) · 봉지 담기 · 부산물 · 밭에 넣기 · 방앗간 · 나물 볶음 영문.
 *
 * 이름(봉지 · 부산물 · 밭 부산물 · 기름병 · 방앗간 일 · 요리 재료)은 데이터 Ko/En 쌍이 정본이다
 * (`I18n.buildRuntimeDict` — `CropHarvest.bags` · `CropDef.byproducts` · `FARM_RESIDUES` · `OIL_BOTTLES` · `MILL_SERVICES`).
 * 여기는 화면 문구와 수치가 섞인 문장 규칙만 둔다.
 *
 * 규칙은 두 벌이다 — `EN_MILL_RULES`(문장이 정해진 것 · 텃밭 규칙 앞) · `EN_MILL_TAIL_RULES`(「이름 480g」처럼 넓게 잡는 것 · 맨 끝).
 */

import { harvestTailEn } from './en_farm.js';

type Tr = (s: string) => string;
type MillRule = [RegExp, (m: RegExpMatchArray, tr: Tr) => string];

/** 무게 글(`ui/QtyLabel.gramsText` — 480g · 1.25kg) */
const G = '([\\d.,]+k?g)';

/** 「깻대 420g · 검불 30g」 같은 목록 — 조각마다 옮긴다 */
/** 목록 가르기 — 「· 특」 · 「· 상」 · 「· 보통」(등급 꼬리)에서는 가르지 않는다 */
const LIST_SEP = / · (?!(?:특|상|보통)(?: |$))/;
const list = (s: string, tr: Tr): string => s.split(LIST_SEP).map((x) => {
  const q = /^(.+) (\d+)개$/.exec(x);
  return q ? `${tr(q[1])} ×${q[2]}` : tr(x);
}).join(', ');

/** 관리 · 수확 문장 꼬리(「 — 」로 이은 것) — 284차 새 꼬리 + 기존 수확 꼬리 */
function tailEn(seg: string, tr: Tr): string {
  let q = /^(.+)도 나왔다$/.exec(seg);
  if (q) return `also got ${list(q[1], tr)}`;
  q = /^가방에 자리가 없어 (.+)(?:은|는) 두고 왔다$/.exec(seg);
  if (q) return `no room in the bag, so ${list(q[1], tr)} stayed behind`;
  q = /^(.+) (\d+)개를 땄다$/.exec(seg);
  if (q) return `picked ${tr(q[1])} ×${q[2]}`;
  q = /^(.+)(?:을|를) 대신 썼다$/.exec(seg);
  if (q) return `used ${list(q[1], tr)} instead`;
  return harvestTailEn(seg, tr);
}
const tails = (s: string | undefined, tr: Tr): string => (s ? s.slice(3).split(' — ').map((seg) => ` — ${tailEn(seg, tr)}`).join('') : '');

export const EN_MILL: Record<string, string> = {
  // ── 가게 · 실내 ──
  '방앗간': 'Oil mill',
  '설악기름방앗간': 'Seorak Oil Mill',   // 게임 상호(캡처 POI `nameEn`과 같다 — 다른 지역 맵에서 창 제목으로 쓸 때)
  '기름 짜기 · 들깨 갈기 · 참깨 볶기 · 곡물 봉투': 'Oil pressing · perilla grinding · sesame roasting · grain bags',
  '깨 털어 오셨어요? 볶아서 바로 짜 드려요.': 'Brought your threshed seeds? I’ll roast them and press them right away.',
  '[F] 깨 맡기기 · 찾기': '[F] Leave seeds · Collect',
  // ── 방앗간 창 ──
  '맡길 양': 'Amount',
  '전부': 'All',
  '드는 깨': 'Seeds needed',
  '나오는 것': 'You get',
  '공임': 'Fee',
  '찾는 때': 'Ready',
  '병을 고른다': 'Choose the bottles',
  '맡기기': 'Leave it',
  '맡겨 둔 것': 'Left at the mill',
  '다 됐다': 'Ready',
  '찾기': 'Collect',
  '무르기': 'Cancel',
  '몇 병을 짤지 고른다': 'Choose how many bottles to press',
  '맡긴 것이 없다': 'Nothing left here',
  '가방에 자리가 없다 — 한 칸 비우고 찾는다': 'No room in the bag — free a slot, then collect',
  '이미 다 됐다 — 찾아 간다': 'Already done — collect it',
  '가방에 자리가 없다 — 한 칸 비우고 무른다': 'No room in the bag — free a slot, then cancel',
  // 체험 가이드
  '방앗간 압착기다. 털어 둔 깨를 맡기면 볶아서 기름을 짜 병에 담아 준다. 들깨는 곱게 갈고, 참깨는 볶아 깨소금으로 만들어 준다.':
    'This is the mill’s oil press. Leave your threshed seeds and they get roasted, pressed and bottled. Perilla can be ground fine, and sesame roasted into sesame salt.',
  '왼쪽에서 할 일을 고른다. 아래 숫자는 가방에 털어 둔 깨의 무게다 — 봉지에 담은 깨는 가방에서 뜯어야 여기에 잡힌다.':
    'Pick a job on the left. The number below is the weight of threshed seed in your bag — bagged seed only counts once you open the bag.',
  '기름은 180ml · 350ml 병을 몇 병 짤지 고른다. 갈기 · 볶기는 100g 단위로 맡길 양을 고른다.':
    'For oil, choose how many 180ml and 350ml bottles to press. For grinding and roasting, choose the amount in 100g steps.',
  '여기서 드는 깨 · 나오는 것 · 공임 · 찾는 때를 미리 본다. 기름을 짜면 깻묵도 함께 돌려준다 — 밭에 넣으면 거름이다.':
    'Here you see the seed it takes, what you get, the fee and when it is ready. Pressing oil also gives back the oil cake — it feeds the soil.',
  '「맡기기」를 누르면 깨와 공임이 나간다. 시간이 지나면 이 압착기에서 찾는다.':
    'Press "Leave it" and the seeds and the fee go. Come back to this press when the time is up.',
  '맡겨 둔 것은 여기에 남는다. 다 되기 전에는 무를 수 있다 — 깨와 공임을 돌려받는다.':
    'What you left stays listed here. Until it is done you can cancel — the seeds and the fee come back.',
  // ── 진열(1큰술) ──
  '나물을 볶는다. 향이 짙다. 1큰술.': 'For stir-frying greens. Rich aroma. 1 tbsp.',
  '나물 볶음을 고소하게 감친다. 1큰술.': 'Gives stir-fried greens a nutty depth. 1 tbsp.',
  '나물 마무리에 뿌린다. 1큰술.': 'Sprinkled over greens to finish. 1 tbsp.',
  // ── 가방 · 봉지 ──
  '봉지 담기': 'Bag it',
  '봉지 뜯기': 'Open bag',
  '병 따기': 'Open bottle',
  '담기': 'Bag',
  '담을 수 없습니다': 'Can’t bag this',
  '봉지에 담을 수 있는 낱알이 아니다.': 'This can’t go into a bag.',
  '곡물 봉투가 없다 — 생활용품점 · 방앗간에서 판다.': 'No grain bags — the general store and the oil mill sell them.',
  '뜯을 수 없다': 'Can’t open it',
  '병을 땄다': 'Opened the bottle',
  '봉지를 뜯었다': 'Opened the bag',
  // ── 상세 보기 ──
  '낱알은 사지 않는다 — 봉지에 담아 판다': 'Shops don’t buy loose grain — bag it to sell',
  '밭 부산물': 'Field residue',
  '밭에 넣기': 'Into the soil',
  '없음 — 밭에 넣어 쓴다': 'None — it goes into the soil',
  '병': 'Bottle',
  '식자재 마트 · 식당 (따지 않은 병)': 'Grocery mart · restaurant (unopened bottles)',
  '식자재 마트 · 식당 (봉지만)': 'Grocery mart · restaurant (bags only)',
  '[봉지] 털어 낸 낱알은 가게가 사지 않는다. 가방에서 「봉지 담기」로 곡물 봉투(생활용품점 · 방앗간)에 담아 판다. 방앗간에 맡기면 기름 · 가루가 된다.':
    '[Bag] Shops don’t buy loose threshed grain. Use "Bag it" in the bag to fill a grain bag (general store · oil mill) and sell that. Leave it at the oil mill and it becomes oil or powder.',
  '[봉지] 「봉지 뜯기」로 같은 등급 낱알이 된다 — 봉투는 버린다.': '[Bag] "Open bag" turns it back into loose grain of the same grade — the bag is thrown away.',
  '[밭에 넣기] 텃밭 칸에서 퇴비 대신 넣는다 — 모자라면 퇴비를 넣을 때처럼 「퇴비 넣기」가 이것부터 쓴다.':
    '[Into the soil] Works into a patch cell in place of compost — "Add compost" uses this first, before a bag of compost.',
  '직접 기른 참깨를 방앗간에서 볶아 짠 참기름. 「병 따기」로 1큰술씩 요리에 쓴다 — 죽을 볶고 볶음 · 나물을 마무리한다.':
    'Sesame oil roasted and pressed at the mill from sesame you grew. "Open bottle" gives it 1 tbsp at a time for cooking — for frying rice for porridge and finishing stir-fries and greens.',
  '직접 기른 들깨를 방앗간에서 짠 들기름. 「병 따기」로 1큰술씩 요리에 쓴다 — 나물을 볶으면 향이 짙다. 따면 오래 두지 않는 편이 좋다.':
    'Perilla oil pressed at the mill from perilla you grew. "Open bottle" gives it 1 tbsp at a time for cooking — greens fried in it smell rich. Once opened, it is best used soon.',
  // ── 텃밭 ──
  '퇴비가 없다 — 털고 남은 깻대 · 콩대 같은 밭 부산물도 퇴비 대신 넣을 수 있다':
    'No compost — field residue such as sesame or bean stalks can go in instead',
  '또는': 'or',
  // ── 도움말(F1) ──
  '부산물 · 밭에 넣기': 'Byproducts · into the soil',
  '거둘 때 함께 나오는 것': 'What comes with the harvest',
  '무를 캐면 무 하나에 무청 한 묶음, 김장배추를 거두면 겉잎(우거지감), 토란을 캐면 토란대가 함께 가방에 들어옵니다. 데치면 시래기 · 우거지 · 토란대 나물이 되는 요리 재료이고 식자재마트 · 식당에 팔 수도 있습니다.':
    'Each radish you pull brings a bunch of radish greens, napa cabbage brings its outer leaves (for ugeoji), and taro brings taro stems — all into the bag with the harvest. Blanched, they become siraegi, ugeoji and taro-stem namul for cooking, and grocery marts and restaurants buy them too.',
  '깻잎 · 들깨의 [순지르기]를 하면 딴 새순이 깻순으로 들어옵니다. 고구마줄기 · 고춧잎 · 마늘종과 곰취 · 곤드레 같은 산나물도 이제 요리 재료(나물)입니다.':
    '[Pinch tips] on perilla gives you the pinched shoots as perilla shoots. Sweet potato stems, chili leaves, garlic scapes and wild greens such as gomchwi and gondre are now cooking ingredients (namul) too.',
  '털고 남은 줄기 · 짚 · 검불': 'Stalks, straw and chaff left after threshing',
  '깨를 털면 깻대, 콩을 털면 콩대, 보리를 털면 보릿짚이 남고, 키질로 날린 검불도 모입니다. 옥수수를 따면 옥수숫대, 버섯 배지를 다 거두면 폐배지가 남습니다. 모두 무게(g)로 셉니다.':
    'Threshing sesame or perilla leaves stalks, beans leave bean stalks, barley leaves straw, and winnowing collects the chaff. Picking corn leaves corn stalks, and a spent mushroom block leaves spent substrate. All of it is counted by weight (g).',
  '이것들은 퇴비 대신 밭에 넣습니다 — 텃밭 [퇴비 넣기]가 가방의 밭 부산물(한 칸 분 이상)부터 씁니다. 한 칸 분은 깻대 · 콩대 · 보릿짚 · 폐배지 1kg, 옥수숫대 1.5kg, 검불 300g, 깻묵 200g입니다. 없으면 퇴비 한 자루를 씁니다.':
    'These go into the soil in place of compost — the patch\'s [Add compost] uses field residue from your bag first (one cell\'s worth or more). One cell takes 1kg of sesame stalks, bean stalks, barley straw or spent substrate, 1.5kg of corn stalks, 300g of chaff or 200g of oil cake. Without any, it uses a bag of compost.',
  '보릿짚은 볏짚처럼 이랑을 덮는 데도 씁니다 — 짚 덮기에 볏짚이 없으면 보릿짚 500g을 대신 씁니다. 가게는 밭 부산물을 사지 않습니다.':
    'Barley straw can also cover beds like rice straw — if you have no rice straw for mulching, 500g of barley straw is used instead. Shops don\'t buy field residue.',
  '봉지 담기 · 방앗간': 'Bagging · oil mill',
  '낱알은 봉지에 담아 판다': 'Loose grain sells in bags',
  '털어 낸 깨 · 콩 · 보리 낱알은 가게가 사지 않습니다. 가방에서 우클릭 [봉지 담기]를 누르면 낱알과 곡물 봉투 1장이 봉지 하나가 됩니다 — 참깨 300g · 500g, 들깨 · 콩 500g · 1kg, 보리 1kg입니다. 봉지는 제값을 받고, [봉지 뜯기]로 다시 낱알이 됩니다.':
    'Shops don\'t buy loose threshed sesame, perilla, beans or barley. Right-click [Bag it] in the bag to turn the grain plus 1 grain bag into one bag — sesame 300g · 500g, perilla and beans 500g · 1kg, barley 1kg. Bags fetch the full price, and [Open bag] turns one back into loose grain.',
  '곡물 봉투는 생활용품점과 방앗간에서 한 장에 100원입니다.': 'Grain bags cost 100 won each at the general store and the oil mill.',
  '방앗간에 맡기기': 'Leaving seeds at the oil mill',
  '속초관광수산시장 옆 방앗간에 들어가 압착기 앞에서 [F]를 누르면 맡기는 창이 열립니다. 참기름 · 들기름은 180ml · 350ml 병으로 짜고, 들깨는 곱게 갈아 들깨가루로, 참깨는 볶아 깨소금으로 만들어 줍니다.':
    'Go into the oil mill beside Sokcho Tourist Fish Market and press [F] at the oil press to open the order window. Sesame and perilla oil are pressed into 180ml or 350ml bottles, perilla can be ground into perilla powder, and sesame roasted into sesame salt.',
  '350ml 한 병에 볶은 참깨 850g · 들깨 950g이 들고, 180ml는 그 절반 남짓입니다. 공임은 1kg에 4,000원 + 병값이고, 기름을 짜면 깻묵(밭에 넣는 거름)도 돌려줍니다. 기름은 한 시간, 갈기 · 볶기는 20분 뒤에 찾습니다 — 다 되기 전에는 무를 수 있습니다.':
    'A 350ml bottle takes about 850g of roasted sesame or 950g of perilla, and a 180ml bottle a little over half that. The fee is 4,000 won per kg plus the bottles, and pressing also gives back oil cake (a fertilizer for the soil). Oil is ready in an hour, grinding and roasting in 20 minutes — you can cancel until it is done.',
  '병은 우클릭 [병 따기]로 1큰술씩 요리 재료가 됩니다(350ml = 23큰술). 따지 않은 병은 식자재마트 · 식당이 삽니다.':
    'Right-click [Open bottle] to turn a bottle into cooking spoons, 1 tbsp each (350ml = 23 tbsp). Grocery marts and restaurants buy unopened bottles.',
  '털어 낸 깨 · 콩 · 보리 낱알은 무게(g)로 셉니다 — 가방 칸에 「480g」처럼 나옵니다. 한 칸에서 들깨 80~120g · 참깨 40~60g · 콩 180~250g · 보리 400~500g이 나옵니다.':
    'Threshed sesame, perilla, beans and barley are counted by weight (g) — a bag slot shows "480g". One cell gives 80–120g of perilla, 40–60g of sesame, 180–250g of beans or 400–500g of barley.',
  '요리는 열 가지입니다 — 서더리 매운탕 · 통생선 매운탕 · 지리 · 생선구이 · 생선조림 · 오징어볶음 · 조개탕 · 전복죽 · 장어구이 · 나물 볶음. 필수 재료를 빼면 완성되지 않습니다(예: 매운탕 = 주재료 · 물 · 고춧가루 · 다진마늘 · 무 · 대파 · 소금).':
    'There are ten dishes — Fish-frame maeuntang · Whole-fish maeuntang · Clear fish soup (Jiri) · Grilled fish · Braised fish (Jorim) · Stir-fried squid · Clam soup · Abalone porridge · Grilled eel · Stir-fried greens (Namul). Leave out a required ingredient and it will not finish (e.g. maeuntang = main ingredient · water · chili flakes · minced garlic · radish · green onion · salt).',
  '나물 볶음은 팬 요리입니다 — 시래기 · 우거지 · 고구마줄기 · 토란대 · 깻순 같은 나물 한두 묶음을 들기름(참기름 · 식용유도 된다) · 다진마늘 · 간장으로 볶고, 들깨가루 · 깨소금을 넣으면 고소해집니다. 생선조림은 무 대신(또는 무와 함께) 시래기 · 우거지 · 고구마줄기를 바닥에 깔 수 있습니다.':
    'Stir-fried greens is a pan dish — fry one or two bunches of greens such as siraegi, ugeoji, sweet potato stems, taro stems or perilla shoots in perilla oil (sesame or cooking oil works too) with minced garlic and soy sauce; perilla powder and sesame salt make it nutty. Braised fish can sit on siraegi, ugeoji or sweet potato stems instead of (or with) radish.',
};

/** 문장이 정해진 규칙 — `EN_FARM_RULES` 앞 */
export const EN_MILL_RULES: MillRule[] = [
  // 등급 꼬리 — 「무 (1개 · 약 1.2kg) · 보통」의 괄호 안 「·」에서 가르지 않게(구분자 분해보다 먼저)
  [/^(.+) · (특|상|보통)$/, (m, tr) => `${tr(m[1])} · ${tr(m[2])}`],
  // ── 방앗간 창 ──
  [new RegExp(`^가방 (.+) ${G}$`), (m, tr) => `In bag: ${tr(m[1])} ${m[2]}`],
  [/^(\d+)ml 병$/, (m) => `${m[1]}ml bottle`],
  [new RegExp(`^한 병에 ${G}$`), (m) => `${m[1]} per bottle`],
  [new RegExp(`^${G} \\(가방 ${G}\\)$`), (m) => `${m[1]} (in bag: ${m[2]})`],
  [/^([\d,]+)원 \(병값 포함\)$/, (m) => `₩${m[1]} (bottles included)`],
  [/^(\d+)분 뒤$/, (m) => `in ${m[1]} min`],
  [/^(\d+)g 단위$/, (m) => `in ${m[1]}g steps`],
  [/^외 (\d+)건$/, (m) => `+${m[1]} more`],
  [/^(\d+)분 남음$/, (m) => `${m[1]} min left`],
  [/^(\d+)g 단위로 맡긴다$/, (m) => `Leave it in ${m[1]}g steps`],
  [new RegExp(`^털어 둔 (.+)(?:이|가) 모자란다 — ${G}이 든다 \\(가방 ${G} · 봉지는 뜯어서 맡긴다\\)$`),
    (m, tr) => `Not enough threshed ${tr(m[1]).toLowerCase()} — it takes ${m[2]} (in bag: ${m[3]} · open bags before leaving them)`],
  [/^공임 ([\d,]+)원이 모자란다$/, (m) => `Not enough money for the ₩${m[1]} fee`],
  [new RegExp(`^(.+) — ${G}을 맡겼다 · (\\d+)분 뒤에 찾는다 \\(공임 ([\\d,]+)원\\)$`),
    (m, tr) => `${tr(m[1])} — left ${m[2]} · collect in ${m[3]} min (fee ₩${m[4]})`],
  [/^아직 하는 중이다 — (\d+)분 남았다$/, (m) => `Still working on it — ${m[1]} min left`],
  [/^찾았다 — (.+)$/, (m, tr) => `Collected — ${list(m[1], tr)}`],
  [/^물렀다 — 깨와 공임 ([\d,]+)원을 돌려받았다$/, (m) => `Cancelled — your seeds and the ₩${m[1]} fee came back`],
  // ── 가방 · 봉지 ──
  [new RegExp(`^봉지 담기 \\(${G}\\)$`), (m) => `Bag it (${m[1]})`],
  [new RegExp(`^(병을 땄다|봉지를 뜯었다) — (.+) (${G.slice(1, -1)}|\\d+개)$`), (m, tr) => {
    const verb = m[1] === '병을 땄다' ? 'Opened the bottle' : 'Opened the bag';
    const q = /^(\d+)개$/.exec(m[3]);
    return `${verb} — ${tr(m[2])} ${q ? `×${q[1]}` : m[3]}`;
  }],
  [new RegExp(`^봉지에 담았습니다 — (.+) (\\d+)개 \\(${G} · 봉투 (\\d+)장\\)$`),
    (m, tr) => `Bagged — ${tr(m[1])} ×${m[2]} (${m[3]} · ${m[4]} grain bag${m[4] === '1' ? '' : 's'})`],
  [new RegExp(`^곡물 봉투가 없습니다 — 생활용품점 · 방앗간에서 팝니다 \\(한 봉지에 ${G} \\+ 봉투 1장\\)$`),
    (m) => `No grain bags — the general store and the oil mill sell them (one bag takes ${m[1]} + 1 grain bag)`],
  [new RegExp(`^한 봉지를 채우려면 ${G}이 필요합니다 \\(지금 ${G}\\)$`), (m) => `A bag needs ${m[1]} (you have ${m[2]})`],
  [new RegExp(`^한 봉지 = ${G} \\+ 곡물 봉투 1장 · 최대 (\\d+)봉지$`), (m) => `1 bag = ${m[1]} + 1 grain bag · up to ${m[2]}`],
  [new RegExp(`^${G} · 봉투 (\\d+)장을 씁니다$`), (m) => `Uses ${m[1]} · ${m[2]} grain bag${m[2] === '1' ? '' : 's'}`],
  [new RegExp(`^\\(제안 (${G.slice(1, -1)}|\\d+)\\)$`), (m) => `(offered ${m[1]})`],
  // ── 상세 보기 ──
  [new RegExp(`^${G} 봉지$`), (m) => `${m[1]} bag`],
  [new RegExp(`^낱알 ${G}$`), (m) => `Loose grain ${m[1]}`],
  [new RegExp(`^${G} = 퇴비 한 칸 분$`), (m) => `${m[1]} = compost for one cell`],
  [new RegExp(`^${G} = 볏짚 한 칸 분$`), (m) => `${m[1]} = rice straw for one cell`],
  [/^(참기름|들기름) 1큰술 (\d+)개$/, (m, tr) => `${tr(m[1])} 1 tbsp ×${m[2]}`],
  [/^(\d+)병$/, (m) => `${m[1]} bottle${m[1] === '1' ? '' : 's'}`],
  [/^(.+) (\d+)병$/, (m, tr) => `${tr(m[1])} ×${m[2]}`],
  [new RegExp(`^(${G.slice(1, -1)}(?: · ${G.slice(1, -1)})*) \\(곡물 봉투 1장\\)$`), (m) => `${m[1].split(' · ').join(' · ')} (1 grain bag each)`],
  // ── 텃밭 — 무게 수확 · 부산물 · 관리 일에서 딴 것 · 밭에 넣기 ──
  [new RegExp(`^(.+?) ${G}을 거뒀다((?: — .+)?)$`), (m, tr) => `Harvested ${m[2]} of ${tr(m[1])}${tails(m[3], tr)}`],
  [/^(.+?) (\d+)개를 거뒀다((?: — .+)?)$/, (m, tr) => `Harvested ${m[2]} ${tr(m[1])}${tails(m[3], tr)}`],
  // 관리 일 결과 + 꼬리(「순지르기를 했다 — 깻순 한 줌 (100g) 3개를 땄다」 · 「짚 덮기 … — 보릿짚을 대신 썼다」)
  [/^(.+?)((?: — (?:[^—]+(?:을|를) 대신 썼다|[^—]+ \d+개를 땄다|가방에 자리가 없어 [^—]+(?:은|는) 두고 왔다))+)$/,
    (m, tr) => `${tr(m[1])}${tails(m[2], tr)}`],
  [new RegExp(`^(.+) ${G}을 잘게 썰어 흙에 넣었다 — 퇴비 한 칸 분$`), (m, tr) => `Chopped ${m[2]} of ${tr(m[1])} into the soil — compost for one cell`],
  [/^낟알이 (\d+)g은 있어야 한 줌이다$/, (m) => `You need ${m[1]}g of grain for one handful`],
  [/^(.+)도 나왔다$/, (m, tr) => `Also got ${list(m[1], tr)}`],
  [/^가방에 자리가 없어 (.+)(?:은|는) 두고 왔다$/, (m, tr) => `No room in the bag, so ${list(m[1], tr)} stayed behind`],
  [/^(.+) (\d+)개를 땄다$/, (m, tr) => `Picked ${tr(m[1])} ×${m[2]}`],
  [/^(.+)(?:을|를) 대신 썼다$/, (m, tr) => `Used ${list(m[1], tr)} instead`],
];

/** 넓게 잡는 규칙 — 「참깨 480g」 · 「깻묵 1.2kg」(목록 조각 · 채널 로그) · 맨 끝에 둔다(다른 규칙이 먼저) */
export const EN_MILL_TAIL_RULES: MillRule[] = [
  [new RegExp(`^(.+?) ${G}$`), (m, tr) => `${tr(m[1])} ${m[2]}`],
];
