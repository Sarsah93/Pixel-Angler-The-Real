/**
 * @file en_farm.ts
 * @description 235차 텃밭 — 텃밭 창 · 심기/거두기 안내 · 상세 보기 · 가게 설명 · 체험 가이드 · 도움말 영문.
 *
 * 작물 · 수확물 · 씨앗/모종 이름과 작물 메모 · 농자재는 데이터(`CROP_DATABASE` · `FARM_SUPPLIES`)의
 * Ko/En 쌍이 정본이다(`I18n.buildRuntimeDict`). 여기는 화면 문구만 둔다.
 */

import {
  CROP_CARE_KO, CROP_CARE_EN, CARE_TASK_KO, CARE_TASK_EN, CARE_WORK_KO, CARE_WORK_EN, DISEASE_KO, DISEASE_EN, DISEASE_SYMPTOM_KO, DISEASE_SYMPTOM_EN,
  DISEASE_CONTROL_KO, DISEASE_CONTROL_EN, RIPE_STAGE_KO, RIPE_STAGE_EN, CROP_CARE_PLANS, NURSERY_PLAN,
  type CropCare, type CareTaskId, type CareWorkKind, type CropDisease, type RipeStage,
} from '@tra/core';

const MONTH_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 237차 — 까다로운 점 이름(ko → en) · 상세 보기의 「병해충 · 지주 세우기」 같은 목록을 통째로 옮긴다 */
const CARE_EN_BY_KO: Record<string, string> = Object.fromEntries(
  (Object.keys(CROP_CARE_KO) as CropCare[]).map((k) => [CROP_CARE_KO[k], CROP_CARE_EN[k]]),
);
const CARE_ALT = Object.keys(CARE_EN_BY_KO).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const CARE_LIST_RE = new RegExp(`^(?:${CARE_ALT})(?: · (?:${CARE_ALT}))*$`);

/** 「3~4월 · 8~9월」 → 「Mar–Apr, Aug–Sep」 (`monthRangeKo` 출력) */
export function monthRangeEn(ko: string): string {
  if (ko === '언제나') return 'year-round';
  return ko.split(' · ').map((run) => {
    const m = /^(\d+)(?:~(\d+))?월$/.exec(run);
    if (!m) return run;
    return m[2] ? `${MONTH_EN[Number(m[1])]}–${MONTH_EN[Number(m[2])]}` : MONTH_EN[Number(m[1])];
  }).join(', ');
}

/** 238차 — 작업 · 병 · 익는 단계 이름(ko → en) · 작업 방법 한 줄(표에서 그대로) */
const CARE_TASK_PAIRS: Record<string, string> = Object.fromEntries([
  ...(Object.keys(CARE_TASK_KO) as CareTaskId[]).map((k) => [CARE_TASK_KO[k], CARE_TASK_EN[k]]),
  ...(Object.keys(CARE_WORK_KO) as CareWorkKind[]).map((k) => [CARE_WORK_KO[k], CARE_WORK_EN[k]]),
  ...(Object.keys(DISEASE_KO) as CropDisease[]).flatMap((k) => [[DISEASE_KO[k], DISEASE_EN[k]], [DISEASE_SYMPTOM_KO[k], DISEASE_SYMPTOM_EN[k]], [DISEASE_CONTROL_KO[k], DISEASE_CONTROL_EN[k]]]),
  ...(Object.keys(RIPE_STAGE_KO) as RipeStage[]).map((k) => [RIPE_STAGE_KO[k], RIPE_STAGE_EN[k]]),
  ...[...Object.values(CROP_CARE_PLANS), NURSERY_PLAN].flatMap((p) => p.tasks.map((t) => [t.howKo, t.howEn])),
]);
const TASK_ALT = Object.values(CARE_TASK_KO).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const TASK_EN = (ko: string): string => CARE_TASK_EN[(Object.keys(CARE_TASK_KO) as CareTaskId[]).find((k) => CARE_TASK_KO[k] === ko) ?? 'stake'] ?? ko;
const DZ_ALT = Object.values(DISEASE_KO).join('|');
const DZ_EN = (ko: string): string => DISEASE_EN[(Object.keys(DISEASE_KO) as CropDisease[]).find((k) => DISEASE_KO[k] === ko) ?? 'blight'];

export const EN_FARM: Record<string, string> = {
  // 243차 — 포장(낱개 → 팩)
  '포장하기': 'Pack',
  '포장': 'Packing',
  '들어 있는 것': 'Contents',
  '포장하기 (낱개 → 팩)': 'Packing (loose → pack)',
  '거둘 때는 낱개, 팔 때는 팩': 'Harvest loose, sell in packs',
  '포장을 뜯어 낱개로 먹는다': 'Open the pack and eat it loose',
  '포장 용기가 없다 — 생활용품점에서 판다.': 'No produce tubs — the general store sells them.',
  '상한 것은 담지 않는다.': 'Spoiled produce can’t be packed.',
  '포장할 수 있는 수확물이 아니다.': 'This produce can’t be packed.',
  '포장할 수 없습니다': 'Can’t pack this',
  '[포장] 낱개로 팔면 가게가 다시 담아야 해서 20%를 깎는다. 포장 용기(생활용품점)에 담아 팩으로 팔면 제값이다.': '[Packing] Sold loose, shops take 20% off because they must pack it. Put it into produce tubs (general store) and packs fetch the full price.',
  '[포장] 「포장 뜯기」로 같은 등급 낱개가 된다 — 용기는 버린다.': '[Packing] [Open pack] turns it back into loose produce of the same grade — the tub is thrown away.',
  '딸기 · 방울토마토 · 블루베리 · 느타리 · 생목이 · 새싹채소는 거둘 때 한 알 · 한 송이 · 한 줌씩 나옵니다. 가방에서 우클릭 [포장하기]를 누르면 낱개 여러 개와 포장 용기 1개가 팩 하나가 됩니다 — 딸기 25개 · 방울토마토 20개 · 블루베리 50알 · 생목이 10개 · 느타리 2송이 · 새싹채소 2줌이 한 팩입니다.': 'Strawberries, cherry tomatoes, blueberries, oyster mushrooms, fresh wood ear and microgreens come off one berry, cluster or handful at a time. Right-click [Pack] in the bag to put several of them and 1 produce tub into one pack — 25 strawberries, 20 cherry tomatoes, 50 blueberries, 10 wood ears, 2 oyster clusters or 2 handfuls of microgreens make a pack.',
  '포장 용기는 생활용품점에서 하나에 100원입니다. 두 팩 이상 담을 수 있으면 몇 팩을 담을지 고르는 창이 뜹니다. 팩의 등급은 담은 낱개의 등급 그대로이고, 신선도도 낱개에서 이어집니다.': 'Produce tubs cost 100 won each at the general store. If you have enough for two or more packs, a window asks how many to make. A pack keeps the grade of the produce inside, and its freshness carries over too.',
  '낱개로 팔면 가게가 다시 담아야 해서 값의 20%를 깎습니다. 팩으로 팔면 제값입니다. 팩은 우클릭 [포장 뜯기]로 다시 낱개가 됩니다(용기는 버립니다).': 'Sold loose, shops take 20% off because they have to pack it themselves. Packs fetch the full price. Right-click [Open pack] turns a pack back into loose produce (the tub is thrown away).',
  '작은 낱개는 [사용하기] 한 번에 여러 개를 먹습니다 — 딸기 5개 · 방울토마토 8개 · 블루베리 한 줌(25알). 팩은 뜯어야 먹습니다.': 'Small produce is eaten several at a time with [Use] — 5 strawberries, 8 cherry tomatoes or a handful of blueberries (25). Packs must be opened first.',
  ...CARE_TASK_PAIRS,
  // ── 238차 — 관리 작업 · 작업 장면 · 병 · 육묘 · 종묘사 ──
  '단계': 'Stage', '익음': 'Ripeness', '포기당': 'Per plant', '쓰러짐': 'Lodged', '활착기': 'Establishing', '할 일': 'To do',
  '지금은 없다': 'Nothing right now', '쓰는 것': 'Uses', '걸리는 시간': 'Time it takes', '초': 's', '그만두기': 'Stop',
  '남은 것': 'Left', '차례': 'Next', '묶은 포기': 'Tied', '친 포기': 'Sprayed', '남은 자리': 'Spots left', '옮길 싹': 'Seedlings to move',
  '다 세웠다': 'All staked', '다 묶었다': 'All tied', '고르게 쳤다': 'Even coverage', '손은 끝났다 — 마무리하는 중': 'Hands are done — finishing up',
  '차례가 아니다 — 표시된 자리부터': 'Not that one — start with the marked spot',
  '줄기를 건드렸다 — 표시된 것만 딴다': 'You caught the stem — pick only the marked ones',
  '빗나갔다 — 표시된 자리에': 'Missed — aim for the marked spot',
  '너무 적게 쳤다 — 띠 안에서 뗀다': 'Too little — release inside the band',
  '너무 많이 쳤다 — 잎이 상한다': 'Too much — that scorches the leaves',
  '띠를 벗어났다 — 표시가 띠 안에 들어올 때': 'Outside the band — press when the marker is inside',
  '지금 할 일이 아니다': 'Not something to do right now', '이번 차례는 했다': 'This round is done', '지금 할 수 없다': 'Cannot do that now',
  '이 작물에는 없는 일이다': 'This crop has no such job',
  '육묘 중 — 집 안 트레이에서 모종을 키운다': 'In the nursery — raising seedlings in the indoor tray',
  '서리 — 끝물': 'Frost — last of the season', '수확기 — 익는 대로 거둔다': 'Harvest season — pick as they ripen',
  '활착기 — 뿌리를 내리는 2주': 'Establishing — the two weeks the roots take hold',
  '초기 생장 — 방아다리가 갈라진다': 'Early growth — the first fork is forming',
  '개화 · 착과 — 꽃이 피고 열매가 든다': 'Flowering and fruit set',
  '모종이 됐다 — 거둬서 밭에 옮겨 심는다': 'Seedlings are ready — harvest and transplant to the bed',
  '서리 맞은 끝물 — 지금 거두면 끝': 'Frost-hit — harvesting now ends this cell',
  '서리를 맞았다 — 더 자라지 않는다': 'Hit by frost — no more growth',
  '검붉게 익는 중 — 꼭지 끝까지 빨개지면 홍고추': 'Turning dark red — fully red once the shoulder colors',
  '비바람에 쓰러졌다 — 수확이 준다': 'Blown over in wind and rain — a smaller harvest',
  '초기': 'Early', '번지는 중': 'Spreading', '심하다': 'Severe',
  '가방에 심을 것이 없다 — 씨앗은 생활용품점 · 종묘사, 모종은 종묘사에서 판다':
    'Nothing to plant in your bag — seeds at the general store or the seed shop, seedlings at the seed shop',
  '일군 칸에 씨앗이나 모종을 심는다. 모종은 비싸지만 싹 틔우는 몇 주를 건너뛴다. 모종과 농자재는 종묘사가 판다.':
    'Plant seed or seedlings in a tilled cell. Seedlings cost more but skip the weeks of sprouting. The seed shop sells seedlings and supplies.',
  '텃밭 손일은 그 일을 흉내 내는 짧은 손놀림이다. 왼쪽 포기 그림에서 표시된 것을 누르거나, 누르고 있다가 띠 안에서 뗀다.':
    'Garden work is a short hands-on imitation of the real job. Click the marked spots on the plant at left, or hold and release inside the band.',
  '손이 끝나도 걸리는 시간이 다 차야 끝난다 — 일에는 시간이 든다. 서툴면(실수가 많으면) 효과가 절반이다.':
    'Even when your hands are done, the job ends only when its time is up — work takes time. Clumsy work (many mistakes) has half the effect.',
  '따뜻한 실내 육묘 트레이에 뿌려 모종을 키운다': 'Sown in a warm indoor tray to raise seedlings',
  '집 안 선반 (육묘 트레이)': 'Indoor shelf (seedling tray)', '모종까지': 'To seedlings', '손이 가는 일': 'Work it takes',
  '고추를 기르는 여섯 단계': 'The six stages of growing chili', '작업 장면 — 손놀림과 시간': 'Work scenes — hands and time',
  '손이 가는 일 · 작업 장면': 'Work it takes · work scenes', '병해 3종 · 방제': 'Three diseases and control',
  '역병 · 탄저병 · 바이러스병': 'Blight, anthracnose and virus', '약 — 살균제 · 아인산 · 칼슘액비 · 살충제': 'Sprays — fungicide, phosphite, calcium, insecticide',
  '육묘 · 종묘사 · 풋고추와 홍고추': 'Nursery, seed shop, green and red chili', '씨앗에서 모종으로': 'From seed to seedling',
  '풋고추 · 검붉은 고추 · 홍고추 · 첫서리': 'Green, turning and red chili, and the first frost',
  '늦서리가 끝나지 않았다 — 최저 기온이 10℃ 넘게 안정되면 옮겨 심는다(4월 하순~5월 상순)':
    'The last frost has not passed — transplant once lows stay above 10℃ (late April to early May)',
  '지금은 너무 춥다 — 기온이 10℃를 넘을 때 옮겨 심는다(냉해를 입는다)': 'Too cold right now — transplant when it is above 10℃ (cold injury otherwise)',
  '육묘 트레이가 있어야 씨앗을 뿌려 모종을 키운다 — 종묘사에서 판다': 'You need a seedling tray to sow seed for seedlings — the seed shop sells them',
  '밭에 바로 뿌리지 않는다 — 집 안 선반 육묘 트레이에 뿌려 모종을 키운다': 'Not sown straight in the bed — sow in the indoor seedling tray to raise seedlings',
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
  '올해 시세': "This year's market",
  '사 주는 곳': 'Buyers', '식자재 마트 · 식당': 'Grocery mart · restaurant',
  '직접 기른 채소 — 요리 별 다섯 개를 막지 않는다': 'Homegrown — never holds a dish back from five stars',
  '시루': 'Sprouting jar', '콩나물로 앉힐 수 있다': 'Can go into the sprouting jar',
  // 237차 — 작물 난이도
  '난이도': 'Difficulty', '기를 자격': 'To grow it', '까다로운 점': 'Fussy about',
  '쉬움': 'Easy', '아주 까다로움': 'Very demanding',
  // 241차 — 날로 먹기 · 개량종 · 나누기
  '날로 먹기': 'Eaten raw', '원종': 'Parent crop', '개량종': 'Variety', '나누기': 'Split', '농산물 조각': 'Produce piece', '나눈 것': 'Split from',
  '못 먹는다 — 익혀야': 'Not raw — cook it', '조각은 등급이 없고 가게가 사지 않는다 — 먹거나 요리에 쓴다.': 'Pieces have no grade and shops do not buy them — eat them or cook with them.',
  '날로 먹기 · 개량종': 'Eating raw · Varieties',
  '익히지 않고 먹을 수 있는 것': 'What you can eat uncooked',
  '거둔 채소 · 과일 가운데 날로 먹을 수 있는 것은 가방에서 우클릭 [사용하기]로 바로 먹습니다 — 상추 · 깻잎 · 오이 · 방울토마토 · 참외 · 딸기 · 당근 · 풋고추 · 산마늘 · 생땅콩 같은 것입니다. 허기와 수분은 실제 영양(열량 · 수분)에서 셉니다. 잎채소는 배가 거의 안 부르고 물기만 찹니다.': 'Harvested vegetables and fruit that can be eaten raw are eaten straight from the bag with right-click [Use] — lettuce, perilla, cucumber, cherry tomatoes, Korean melon, strawberries, carrots, green chili, alpine leek, raw peanuts and the like. Hunger and water come from the real nutrition (calories and water content). Leafy greens hardly fill you up; they mostly top up water.',
  '수박 한 통 · 무 한 개 · 배추 한 통 · 1kg 덩이(고구마 · 토마토 · 야콘 · 돼지감자) · 생땅콩 500g · 생강은 한 번에 먹기엔 큽니다 — 우클릭 [나누기]로 조각을 낸 뒤 조각을 먹습니다. 조각은 등급이 없고 가게가 사지 않습니다.': 'A whole watermelon, a whole radish, a head of napa cabbage, 1kg lots (sweet potato, tomato, yacon, Jerusalem artichoke), 500g of raw peanuts and ginger are too big for one sitting — right-click [Split] to cut them into pieces, then eat the pieces. Pieces have no grade and shops do not buy them.',
  '생감자 · 토란 · 생콩 · 버섯 · 두릅 · 눈개승마 · 머위 · 가지 · 옥수수처럼 날로는 못 먹는 것은 [사용하기]가 아예 없습니다 — 익혀서(불 요리 · 요리) 먹습니다. 상세보기의 「날로 먹기」 줄과 본문 끝 [익혀야]가 이유를 말해 줍니다.': 'Things that cannot be eaten raw — raw potatoes, taro, raw soybeans, mushrooms, aralia shoots, goat\'s beard, butterbur, eggplant, corn — have no [Use] at all; cook them (fire cooking · cooking). The "Eaten raw" line in Details and the [Cook it] note at the end explain why.',
  '매운 것(청양고추 · 홍고추 · 생마늘 · 생강 · 고추냉이)은 먹으면 수분이 조금 줄어듭니다 — 물을 찾게 됩니다. 그 밖의 상태이상은 날로 먹어도 생기지 않습니다(상한 음식은 여전히 식중독을 굴립니다).': 'Hot things (Cheongyang chili, red chili, raw garlic, ginger, wasabi) take a little water off when eaten — you reach for a drink. No other status effect comes from eating raw produce (spoiled food still rolls for food poisoning).',
  '개량종 — 원종을 세 번 거두면': 'Varieties — after three harvests of the parent',
  '토마토 · 고구마 · 고추에는 개량종이 있습니다 — 스테비아 토마토 · 호박고구마 · 청양고추. 원종을 텃밭에서 세 번 거두면 종묘사에 그 개량종의 모종 · 순 · 씨앗이 들어옵니다(채널에 「종묘사에 … 들어온다」가 뜹니다). 씨앗 · 모종 · 수확물을 우클릭 [상세보기]하면 「원종」 · 「개량종」 줄과 다른 점이 보입니다.': 'Tomatoes, sweet potatoes and chili have varieties — stevia tomato, pumpkin sweet potato and Cheongyang chili. Harvest the parent crop three times in your patch and the seed shop starts stocking that variety\'s seedlings, slips or seeds (the channel says "… now at the seed shop"). Right-click [Details] on a seed, seedling or harvest to see the "Parent crop" / "Variety" lines and what differs.',
  '호박고구마는 속이 노랗고 촉촉해 값이 1.3배지만 조금 덜 나오고 열이틀이면 상합니다. 청양고추는 훨씬 맵고 값이 1.3배이며, 손 가는 일은 고추와 같습니다. 스테비아 토마토는 토마토 모종에 스테비아 발효액(종묘사)을 정식 3주 뒤부터 2주 간격으로 네 번 주어 기르는 농법입니다 — 거르면 단맛이 오르지 않아 등급이 내려가고, 값은 토마토의 1.8배입니다.': 'Pumpkin sweet potato has yellow, moist flesh and sells for 1.3× but yields a little less and spoils in twelve days. Cheongyang chili is far hotter and sells for 1.3×; the work is the same as ordinary chili. Stevia tomato is a method: tomato plants fed stevia ferment (seed shop) four times, every two weeks from three weeks after transplanting — skip the feeds and the fruit never sweetens, so the grade drops; it sells for 1.8× a plain tomato.',
  '콩나물 시루(집으로 배달)': 'Sprouting jar (delivered home)',

  // ── 퀘스트 방법 한 줄(core QuestGuide) ──
  '집 마당 텃밭 [F] → 칸을 호미로 일구고 씨앗 · 모종을 심는다':
    'Yard vegetable patch [F] → till cells with the homi and plant seeds or seedlings',

  // ── 체험 가이드(텃밭 · 집 안 선반) ──
  '집 안 선반이다. 시루에는 콩나물 · 숙주 · 새싹을, 수경 재배기에는 잎채소를 기른다. 철을 타지 않는다.':
    'The indoor shelf. The jar grows bean sprouts, mung sprouts and microgreens; the hydroponic rack grows leafy greens. No seasons indoors.',
  '칸을 누르면 오른쪽에 자라는 정도와 거둘 때가 보인다.': 'Click a cell to see on the right how far it has grown and when it is ready.',
  '시루는 자주 물을 줘야 곧게 자란다. 물을 한 번 줘 보자.': 'The jar needs frequent watering to grow straight. Try watering once.',
  // 236차 — 텃밭 구획 상한 · 농지 이용권 · 사용료
  '빌린 텃밭': 'Rented patch',
  '농지 사용료가 밀려 빌린 텃밭에는 새로 심을 수 없다': 'The farmland rent is overdue — nothing new can be planted on a rented patch',
  '밀린 농지 사용료부터 내야 더 빌릴 수 있다': 'Pay the overdue farmland rent before renting more',
  '텃밭 한 구획이다. 한 칸이 1㎡ 남짓 — 실제 시간대로, 실제 계절대로 자란다. 꺼 둔 동안에도 자란다.':
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
  '생활용품점에서 텃밭 개간 키트를 사서 홈타운 마당의 풀밭에 놓으면 4×3칸 텃밭 한 구획이 생깁니다. 한 칸은 1㎡ 남짓이고, 한 구획(약 12㎡)은 주말농장 한 구획만 합니다. 텃밭 앞에서 [F]를 누르면 텃밭 창이 열리고, [Shift+F]는 심어 둔 것이 없을 때만 텃밭을 거둡니다.':
    'Buy a Garden Plot Kit at the general store and place it on the grass of your hometown yard to lay out a 4×3-cell vegetable patch. Each cell is about a square metre, so a whole patch (about 12㎡) is the size of one allotment plot. Press [F] in front of it to open the patch window; [Shift+F] packs the patch up, but only when nothing is planted.',
  '마당(내 땅)에는 텃밭을 두 구획까지 냅니다. 더 내려면 면허 · 허가(L)의 농지 이용권으로 마을 농지를 빌립니다 — 텃밭에서 세 번 거둬 본 뒤에 받을 수 있고, 다섯 구획까지 더 내며, 빌린 구획마다 한 달 사용료 5,000원을 냅니다. 사용료가 밀리면 빌린 밭에는 새로 심을 수 없고(거두기 · 물 주기는 됩니다), 내면 바로 풀립니다.':
    'Your own yard holds up to two patches. For more, rent village farmland with the Farmland Use Right under Licences · Permits (L) — it is issued once you have harvested from your garden three times, adds up to five more patches, and each rented patch costs 5,000 won a month. If the rent falls overdue you cannot plant anything new on rented patches (harvesting and watering still work); paying frees them at once.',
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
  '배추 · 무 · 양파 · 상추 같은 흔한 채소는 실제 소매가(전국 평균)를 하루 한 번 받아 와, 그 주의 출렁임 대신 「오늘 값이 같은 날 평년보다 얼마나 비싼지」를 그대로 따릅니다. 상세보기의 「올해 시세」에 나옵니다. 받지 못한 날은 종전대로 움직입니다.':
    'Common vegetables such as napa cabbage, radish, onion and lettuce follow real retail prices (national average), fetched once a day: instead of the weekly swing, they track how far today\'s price sits above or below the usual for the same date. Details shows it as "This year\'s market". On days the prices could not be fetched, they move as before.',
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
  // 237차 — 도움말 「작물 난이도 · 기를 자격」
  '작물 난이도 · 기를 자격': 'Crop difficulty and who can grow what',
  '쉬움 · 보통 · 까다로움 · 아주 까다로움': 'Easy, Normal, Demanding, Very demanding',
  '작물마다 기르기 까다로운 정도가 넷으로 나뉩니다. 농촌진흥청이 도시농업 작물을 쉬운 작물과 어려운 작물로 나눈 것을 바탕으로, 병해충 · 지주 세우기 · 육묘 · 겨울나기 · 재배 기간 · 흙 · 온도 · 그늘 · 물을 보고 정했습니다. 씨앗 · 모종을 우클릭 [상세보기]하면 「난이도」와 「까다로운 점」이 나옵니다.':
    'Every crop falls into one of four difficulty levels. They follow the Rural Development Administration\'s split of urban-farming crops into easy and hard ones, weighing pests, staking, raising seedlings, overwintering, season length, soil, temperature, shade and water. Right-click a seed or seedling → [Details] to see its Difficulty and what it is fussy about.',
  '쉬운 작물(상추 · 깻잎 · 열무 · 감자 · 콩나물 같은 것)은 처음부터 기릅니다. 보통 작물(고추 · 방울토마토 · 가지 · 마늘 · 양파 같은 것)은 레벨 15부터 기릅니다. 까다로운 작물(오이 · 생강 · 양하 · 울금)은 레벨 25에 유기농업기능사가, 아주 까다로운 작물(산나물 · 고추냉이)은 레벨 40에 유기농업기능사가 있어야 기릅니다. 산나물 · 고추냉이는 산채 재배 · 수경 재배 기술도 함께 있어야 합니다.':
    'Easy crops (lettuce, perilla, young radish, potato, bean sprouts and the like) can be grown from the start. Normal crops (chili, cherry tomato, eggplant, garlic, onion and the like) open at level 15. Demanding crops (cucumber, ginger, myoga, turmeric) need level 25 and the Craftsman Organic Agriculture certificate; very demanding crops (mountain greens, wasabi) need level 40 and the same certificate. Mountain greens and wasabi also need the Mountain Greens or Hydroponics skill.',
  '씨앗부터 키우면 육묘가 긴 작물(고추 · 배추 · 부추 같은 것)은 한 단계 위로 칩니다 — 같은 작물이라도 모종이면 먼저 기를 수 있습니다. 아직 못 기르는 단계의 씨앗 · 모종은 가게에 나오지 않고, 레벨이 문턱을 넘으면 지역 채널에 알림이 뜹니다.':
    'Crops with a long nursery stage (chili, napa cabbage, garlic chives and the like) count one level harder when you start them from seed — you can grow the same crop sooner from a seedling. Seeds and seedlings above your level stay off the shop shelves, and the region channel tells you when a level threshold opens new ones.',
  '유기농업기능사는 면허 · 허가(L)의 「농업」에 있습니다. 텃밭에서 열 번 거둬 본 뒤 받을 수 있고 발급비는 35,000원입니다. 실제 국가기술자격(필기 · 실기)을 본뜬 것이라 스킬 포인트는 들어오지 않습니다.':
    'Craftsman Organic Agriculture is under Farming in Licences · Permits (L). It is issued once you have harvested from your garden ten times, for a fee of 35,000 won. It is modelled on the real national technical qualification (written and practical exams), so it gives no skill point.',
  '광질 · 벌목': 'Mining & logging', '광질 · 벌목 (계획)': 'Mining & logging (planned)',
  '초지 · 암반에서 광물을 캐 요리와 제작 · 건축 재료로 씁니다. 홈타운의 나무 · 바위(벌목 · 채굴)도 이때 열립니다.':
    'Dig minerals from grassland and bedrock for cooking, crafting and building. Hometown trees and rocks (logging, quarrying) open up then too.',
  '텃밭은 열렸습니다 — 「텃밭」 카테고리를 보세요. 바다 채집(해루질)은 「채집 · 통발」에 있습니다.':
    'The vegetable patch is open — see the Vegetable patch category. Sea foraging is under Gathering · Traps.',
};

export const EN_FARM_RULES: [RegExp, (m: RegExpMatchArray, tr: (s: string) => string) => string][] = [
  // 237차 — 작물 난이도 · 기를 자격 · 까다로운 점 · 심기 거부(core `cropGateBlock`)
  [/^(쉬움|보통|까다로움|아주 까다로움) — 모종이면 (쉬움|보통|까다로움|아주 까다로움)$/, (m, tr) => `${tr(m[1])} — ${tr(m[2])} as a seedling`],
  [/^레벨 (\d+) · 유기농업기능사( — 갖췄다)?$/, (m) => `Level ${m[1]} + Craftsman Organic Agriculture${m[2] ? ' — met' : ''}`],
  [/^레벨 (\d+)부터( — 갖췄다)?$/, (m) => `From level ${m[1]}${m[2] ? ' — met' : ''}`],
  [/^레벨 (\d+)부터 기를 수 있는 작물이다$/, (m) => `You can grow this from level ${m[1]}`],
  [/^(아주 )?까다로운 작물이다 — (?:레벨 (\d+) · )?유기농업기능사가 있어야 기를 수 있다$/,
    (m) => `A ${m[1] ? 'very ' : ''}demanding crop — needs ${m[2] ? `level ${m[2]} and ` : ''}the Craftsman Organic Agriculture certificate`],
  [CARE_LIST_RE, (m) => m[0].split(' · ').map((x) => CARE_EN_BY_KO[x] ?? x).join(' · ')],
  // 237차 — N19-7 정옥선의 선물(「[할 일] 정옥선이 건넨 것 — 상추 모종 (1포기) ×18 · 호미」)
  //  떠오르는 안내는 태그를 떼고 보낸다 — 태그 없는 꼴도 받는다
  [/^(\[할 일\] )?정옥선이 건넨 것 — (.+)$/, (m, tr) => `${m[1] ? '[Task] ' : ''}Ok-seon gave you: ${m[2].split(' · ').map((x) => {
    const q = /^(.+) ×(\d+)$/.exec(x);
    return q ? `${tr(q[1])} ×${q[2]}` : tr(x);
  }).join(' · ')}`],
  // 237차 — 레벨이 올라 작물 단계가 열림(태그 「[텃밭]」은 I18n이 따로 옮긴다)
  [/^레벨 (\d+) — (이제|유기농업기능사가 있으면) (보통 난이도 작물|까다로운 작물|아주 까다로운 작물)도 기를 수 있다 \((.+)\)$/,
    (m, tr) => {
      const what = m[3] === '보통 난이도 작물' ? 'normal-difficulty crops' : m[3] === '까다로운 작물' ? 'demanding crops' : 'very demanding crops';
      const lead = m[2] === '이제' ? 'you can now grow' : 'with the Craftsman Organic Agriculture certificate you can grow';
      return `Level ${m[1]} — ${lead} ${what} too (${m[4].split(' · ').map((x) => tr(x)).join(', ')})`;
    }],
  // 238차 — 관리 작업 · 병 · 육묘 · 작업 장면(동적 문장)
  [new RegExp(`^(${TASK_ALT}) — (\\d+)일 뒤$`), (m) => `${TASK_EN(m[1])} — in ${m[2]} day${m[2] === '1' ? '' : 's'}`],
  [new RegExp(`^다음: (${TASK_ALT}) — (\\d+)일 뒤$`), (m) => `Next: ${TASK_EN(m[1])} — in ${m[2]} day${m[2] === '1' ? '' : 's'}`],
  [new RegExp(`^(${TASK_ALT}) (\\d+)/(\\d+)$`), (m) => `${TASK_EN(m[1])} ${m[2]}/${m[3]}`],
  // 상세 「손이 가는 일」 요약 조각 — 「웃거름 5회」 · 「살균제 치기(철마다)」 · 「병해 — 역병 · 탄저병」
  [new RegExp(`^(${TASK_ALT}) (\\d+)회$`), (m) => `${TASK_EN(m[1])} ×${m[2]}`],
  [new RegExp(`^(${TASK_ALT})\\(철마다\\)$`), (m) => `${TASK_EN(m[1])} (in season)`],
  [new RegExp(`^병해 — ((?:${DZ_ALT})(?: · (?:${DZ_ALT}))*)$`), (m) => `Diseases — ${m[1].split(' · ').map((x) => DZ_EN(x)).join(', ')}`],
  [new RegExp(`^(${TASK_ALT})( \\(\\d+/\\d+\\))? — (했다|서툴러서 효과가 절반이다)$`),
    (m) => `${TASK_EN(m[1])}${m[2] ?? ''} — ${m[3] === '했다' ? 'done' : 'clumsy, half the effect'}`],
  [/^아직 때가 아니다 — (\d+)일 뒤$/, (m) => `Not yet — in ${m[1]} day${m[1] === '1' ? '' : 's'}`],
  [/^(.+)가 있어야 한다 — 종묘사에서 판다$/, (m, tr) => `You need ${m[1].split(' · ').map((x) => {
    const q = /^(.+) (\d+)개\((\d+)개\)$/.exec(x);
    return q ? `${tr(q[1])} ×${q[2]} (have ${q[3]})` : tr(x);
  }).join(', ')} — the seed shop sells them`],
  [/^(.+) — 종묘사에서 판다$/, (m, tr) => `${m[1].split(' · ').map((x) => {
    const q = /^(.+) (\d+)개\((\d+)개\)$/.exec(x);
    return q ? `${tr(q[1])} ×${q[2]} (have ${q[3]})` : tr(x);
  }).join(', ')} — the seed shop sells them`],
  [/^한 번에 (\d+)~(\d+)개 × (\d+)포기$/, (m) => `${m[1]}–${m[2]} each per picking × ${m[3]} plant${m[3] === '1' ? '' : 's'}`],
  [/^(\d+)일 더 흙을 촉촉하게 — 마르면 뿌리를 못 내린다$/, (m) => `${m[1]} more day${m[1] === '1' ? '' : 's'} of moist soil — dry soil keeps the roots from taking`],
  [/^(.+) 모종 (\d+)~(\d+)포기 — 가식을 거르면 준다$/, (m, tr) => `${tr(m[1])} seedlings, ${m[2]}–${m[3]} plants — fewer if you skip pricking out`],
  [/^(.+) (\d+)포기를 길러 냈다 — 늦서리 뒤 밭에 옮겨 심는다$/, (m, tr) => `Raised ${m[2]} ${tr(m[1])} — transplant to the bed after the last frost`],
  [/^(\d+)~(\d+)월에 뿌려 모종을 키운다 — 늦으면 옮겨 심을 철을 놓친다$/, (m) => `Sow in ${MONTH_EN[Number(m[1])]}–${MONTH_EN[Number(m[2])]} to raise seedlings — later and you miss the transplanting window`],
  [new RegExp(`^(.+) — (${TASK_ALT}) 할 때 \\((.+)\\)$`), (m, tr) => `${tr(m[1])} — time to ${TASK_EN(m[2]).toLowerCase()} (${tr(m[3])})`],
  [new RegExp(`^(.+)에 (${DZ_ALT})이 생겼다 — (.+) \\((.+)\\)$`), (m, tr) => `${DZ_EN(m[2])} on your ${tr(m[1])} — ${tr(m[3])} (${tr(m[4])})`],
  [/^(.+)가 비바람에 쓰러졌다 — 지주를 세웠어야 했다 \((.+)\)$/, (m, tr) => `Your ${tr(m[1])} blew over — it needed staking (${tr(m[2])})`],
  [/^서리가 내렸다 — (.+) 남은 것을 사흘 안에 거둔다 \((.+)\)$/, (m, tr) => `Frost — harvest the last ${tr(m[1])} within three days (${tr(m[2])})`],
  [/^(텃밭|집 안 선반) (\d+)번 칸$/, (m) => `${m[1] === '텃밭' ? 'patch' : 'indoor shelf'} cell ${m[2]}`],
  [/^(.+) (\d+)개를 거뒀다(.*)$/, (m, tr) => `Harvested ${m[2]} ${tr(m[1])}${m[3]
    .replace(' — 검붉게 덜 익은 것이라 품질이 떨어진다', ' — picked while turning, so lower quality')
    .replace(' — 서리 맞은 끝물, 이 칸은 끝났다', ' — frost-hit last picking, this cell is done')
    .replace(/ — 병으로 (\d+)% 줄었다/, ' — disease cut it by $1%')
    .replace(/ — 송이가 굵어 (\d+)개 더/, ' — thick clusters, $1 extra')
    .replace(/ — 종묘사에 (.+)이 들어온다/, (_s: string, x: string) => ` — ${x.split(' · ').map((y) => tr(y)).join(', ')} now at the seed shop`)}`],
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
  // 236차 — 수확 덤
  [/^(.+) (\d+)개를 거뒀다 — 송이가 굵어 (\d+)개 더$/, (m, tr) => `Harvested ${tr(m[1])} ×${m[2]} — the caps came up thick, ${m[3]} extra`],
  [/^(.+) · 거둘 때마다 덤 0~(\d+)%$/, (m, tr) => `${tr(m[1])} · up to ${m[2]}% extra each harvest`],
  [/^거둘 때마다 덤 0~(\d+)%$/, (m) => `up to ${m[1]}% extra each harvest`],
  [/^(.+)을\(를\) 걷어 냈다$/, (m, tr) => `Cleared the ${tr(m[1])}`],
  [/^(.+)이\(가\) 없다$/, (m, tr) => `You have no ${tr(m[1])}`],
  [/^(.+)을\(를\) 놓았다$/, (m, tr) => `Set up the ${tr(m[1])}`],
  [/^(.+)을\(를\) 걷었다$/, (m, tr) => `Took down the ${tr(m[1])}`],
  // 채널 로그 「[텃밭] 상추 한 줌 (100g) · 특 ×3」 — 등급 꼬리 뒤 수량
  [/^(.+ · (?:특|상|보통)) ×(\d+)$/, (m, tr) => `${tr(m[1])} ×${m[2]}`],
  // 241차 — 날로 먹기 · 개량종 · 나누기
  [/^허기 \+(\d+) · 수분 ([+−])(\d+)$/, (m) => `Hunger +${m[1]} · Water ${m[2]}${m[3]}`],
  [/^나눠서 먹는다 \((\d+)조각\)$/, (m) => `Split it first (${m[1]} pieces)`],
  [/^(\d+)조각 중 하나$/, (m) => `One of ${m[1]} pieces`],
  [/^(.+) — 지금 (\d+)\/(\d+)번$/, (m, tr) => `${tr(m[1])} — ${m[2]}/${m[3]} harvests so far`],
  [/^(.+) — 종묘사에 있다$/, (m, tr) => `${tr(m[1])} — at the seed shop now`],
  [/^(.+)를 (\d+)번 거두면 종묘사에 들어온다(?: — 열렸다| \(지금 (\d+)번\))?$/,
    (m, tr) => `Comes to the seed shop after you harvest ${tr(m[1])} ${m[2]} times${m[0].endsWith('열렸다') ? ' — open now' : m[3] !== undefined ? ` (${m[3]} so far)` : ''}`],
  [/^(.+)를 (\d+)번 거뒀다 — 종묘사에 (.+)이 들어온다$/, (m, tr) => `Harvested ${tr(m[1])} ${m[2]} times — ${m[3].split(' · ').map((x) => tr(x)).join(', ')} now at the seed shop`],
  [/^\[날로 먹기\] 「나누기」로 (.+) (\d+)개 — (.+)$/, (m, tr) => `[Raw] "Split" gives ${m[2]} × ${tr(m[1])} — ${tr(m[3])}`],
  [/^\[날로 먹기\] (.+)$/, (m, tr) => `[Raw] ${tr(m[1])}`],
  [/^\[익혀야\] (.+)$/, (m, tr) => `[Cook it] ${tr(m[1])}`],
  [/^\[개량종\] (.+)$/, (m, tr) => {
    const whole = tr(m[1]);
    if (whole !== m[1]) return `[Variety] ${whole}`;
    const i = m[1].indexOf(' — ');
    return i > 0 ? `[Variety] ${tr(m[1].slice(0, i))} — ${tr(m[1].slice(i + 3))}` : `[Variety] ${whole}`;
  }],
  [/^나눴다 — (.+) (\d+)개$/, (m, tr) => `Split — ${tr(m[1])} ×${m[2]}`],
  // 243차 — 포장(낱개 → 팩) · 낱개 수 말(「딸기 25개」 · 「블루베리 50알」 · 「느타리 2송이」 · 「새싹채소 2줌」)
  [/^(.+) (\d+)(?:개|알|송이|줌) \+ 용기 1개 → (.+)$/, (m, tr) => `${tr(m[1])} ×${m[2]} + 1 tub → ${tr(m[3])}`],
  [/^포장했습니다 — (.+) (\d+)개 \((.+) (\d+)(?:개|알|송이|줌) · 용기 (\d+)개\)$/, (m, tr) => `Packed — ${tr(m[1])} ×${m[2]} (${tr(m[3])} ×${m[4]}, ${m[5]} tub${m[5] === '1' ? '' : 's'})`],
  [/^포장 용기가 없습니다 — 생활용품점에서 팝니다 \(한 팩에 (.+) (\d+)(?:개|알|송이|줌) \+ 용기 1개\)$/, (m, tr) => `No produce tubs — the general store sells them (a pack takes ${tr(m[1])} ×${m[2]} + 1 tub)`],
  [/^한 팩을 채우려면 (.+) (\d+)(?:개|알|송이|줌) 필요 \(지금 (.+) (\d+)(?:개|알|송이|줌)\)$/, (m, tr) => `A pack needs ${tr(m[1])} ×${m[2]} (you have ${m[4]})`],
  [/^한 팩 = (.+) (\d+)(?:개|알|송이|줌) \+ 용기 1개 · 최대 (\d+)팩$/, (m, tr) => `1 pack = ${tr(m[1])} ×${m[2]} + 1 tub · up to ${m[3]}`],
  [/^(.+) (\d+)(?:개|알|송이|줌) · 용기 (\d+)개를 씁니다$/, (m, tr) => `Uses ${tr(m[1])} ×${m[2]} and ${m[3]} tub${m[3] === '1' ? '' : 's'}`],
  [/^\[텃밭\] 가방에서 \[포장하기\] — (.+) (\d+)(?:개|알|송이|줌) \+ 포장 용기 1개 = (.+) \(팩은 제값 · 용기는 생활용품점\)$/, (m, tr) => `[Garden] In the bag, [Pack] — ${tr(m[1])} ×${m[2]} + 1 produce tub = ${tr(m[3])} (packs fetch the full price · tubs at the general store)`],
  [/^뜯어도 (.+) 날것은 먹지 않는다\.$/, (m, tr) => `Even opened, ${tr(m[1])} isn’t eaten raw.`],   // 앞의 「[익혀야] (.+)」 규칙이 꼬리를 이 규칙으로 넘긴다
];
