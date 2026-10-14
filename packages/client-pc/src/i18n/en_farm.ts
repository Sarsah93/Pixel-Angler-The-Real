/**
 * @file en_farm.ts
 * @description 235차 텃밭 — 텃밭 창 · 심기/거두기 안내 · 상세 보기 · 가게 설명 · 체험 가이드 · 도움말 영문.
 *
 * 작물 · 수확물 · 씨앗/모종 이름과 작물 메모 · 농자재는 데이터(`CROP_DATABASE` · `FARM_SUPPLIES`)의
 * Ko/En 쌍이 정본이다(`I18n.buildRuntimeDict`). 여기는 화면 문구만 둔다.
 */

import {
  CROP_CARE_KO, CROP_CARE_EN, CARE_TASK_KO, CARE_TASK_EN, CARE_WORK_KO, CARE_WORK_EN, DISEASE_KO, DISEASE_EN, DISEASE_SYMPTOM_KO, DISEASE_SYMPTOM_EN,
  DISEASE_CONTROL_KO, DISEASE_CONTROL_EN, RIPE_STAGE_KO, RIPE_STAGE_EN, CROP_CARE_PLANS, NURSERY_PLAN, CROP_DATABASE, carePlanOf,
  // 247차 — 재배 요소(표의 Ko/En 쌍 · 작물별 한 줄)
  PROCESS_WORK_DEFS, WATER_AMOUNT_EN, OVERWATER_KO, OVERWATER_EN, HARVEST_BY_KO, HARVEST_BY_EN,
  OFF_TIMING_KO, OFF_TIMING_EN, PROCESS_FIRST_KO, PROCESS_FIRST_EN, PROCESS_LAST_KO, PROCESS_LAST_EN,
  MOISTURE_STATE_KO, MOISTURE_STATE_EN, TOOL_NAME_KO, TOOL_NAME_EN, cultivationOf,
  waterLineKo, waterLineEn, toolLineKo, toolLineEn, processLineKo, processLineEn, timingLineKo, timingLineEn, laborLineKo, laborLineEn,
  propagateLineKo, propagateLineEn,
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

/** 247차 — Ko/En 표 두 벌을 짝으로 */
function pairsOf<K extends string>(ko: Record<K, string>, en: Record<K, string>): [string, string][] {
  return (Object.keys(ko) as K[]).filter((k) => !!ko[k] && !!en[k]).map((k) => [ko[k], en[k]]);
}

/** 238차 — 작업 · 병 · 익는 단계 이름(ko → en) · 작업 방법 한 줄(표에서 그대로) */
const CARE_TASK_PAIRS: Record<string, string> = Object.fromEntries([
  ...(Object.keys(CARE_TASK_KO) as CareTaskId[]).map((k) => [CARE_TASK_KO[k], CARE_TASK_EN[k]]),
  ...(Object.keys(CARE_WORK_KO) as CareWorkKind[]).map((k) => [CARE_WORK_KO[k], CARE_WORK_EN[k]]),
  ...(Object.keys(DISEASE_KO) as CropDisease[]).flatMap((k) => [[DISEASE_KO[k], DISEASE_EN[k]], [DISEASE_SYMPTOM_KO[k], DISEASE_SYMPTOM_EN[k]], [DISEASE_CONTROL_KO[k], DISEASE_CONTROL_EN[k]]]),
  ...(Object.keys(RIPE_STAGE_KO) as RipeStage[]).map((k) => [RIPE_STAGE_KO[k], RIPE_STAGE_EN[k]]),
  ...[...Object.values(CROP_CARE_PLANS), NURSERY_PLAN].flatMap((p) => p.tasks.map((t) => [t.howKo, t.howEn])),
  // 245차 — 작물 84종의 일(표가 작물마다 말을 따로 둔다)
  ...CROP_DATABASE.flatMap((c) => carePlanOf(c).tasks.map((t) => [t.howKo, t.howEn])),
  // 247차 — 거둔 뒤 손질 장면 · 재배 요소 표 · 작물별 한 줄(물 · 도구 · 거둔 뒤 · 철 · 품 · 늘리기)
  ...Object.values(PROCESS_WORK_DEFS).map((t) => [t.howKo, t.howEn]),
  //  짧은 낱말 표(물 양 「조금 · 보통 · 흠뻑」 · 거름 · 품 · 도구 이름)는 사전에 넣지 않는다 — 「조금」(조금 물때) · 「보통」(등급) ·
  //  「호미」 · 「키」(가방 아이템 이름)를 덮는다. 그 낱말이 든 문장은 아래 규칙이 통째로 옮긴다.
  ...pairsOf(OVERWATER_KO, OVERWATER_EN), ...pairsOf(HARVEST_BY_KO, HARVEST_BY_EN), ...pairsOf(OFF_TIMING_KO, OFF_TIMING_EN),
  ...pairsOf(PROCESS_FIRST_KO, PROCESS_FIRST_EN), ...pairsOf(PROCESS_LAST_KO, PROCESS_LAST_EN), ...pairsOf(MOISTURE_STATE_KO, MOISTURE_STATE_EN),
  // 작물별 「기르는 법」 메모(표의 noteKo/noteEn)
  ...CROP_DATABASE.map((c) => { const cv = cultivationOf(c); return [cv.noteKo, cv.noteEn]; }).filter(([k, e]) => !!k && !!e),
  ...CROP_DATABASE.flatMap((c) => [
    [waterLineKo(c), waterLineEn(c)], [toolLineKo(c), toolLineEn(c)], [processLineKo(c), processLineEn(c)],
    [timingLineKo(c), timingLineEn(c)], [laborLineKo(c), laborLineEn(c)], [propagateLineKo(c), propagateLineEn(c)],
  ].filter(([k]) => !!k)),
]);
/** 245차 — 텃밭 알림의 앞 꼬리표 · 뒤 칸 꼴(로그 줄에만 붙는다) */
const PATCH_TAG = '(\\[텃밭\\] )?';
const WHERE_TAIL = '(?: \\(((?:텃밭|집 안 선반) \\d+번 칸(?: 외 \\d+칸)?)\\))?';
const patchTag = (p?: string): string => (p ? '[Vegetable patch] ' : '');
const whereEn = (w: string | undefined, tr: (s: string) => string): string => (w ? ` (${tr(w)})` : '');
const TASK_ALT = Object.values(CARE_TASK_KO).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const TASK_EN = (ko: string): string => CARE_TASK_EN[(Object.keys(CARE_TASK_KO) as CareTaskId[]).find((k) => CARE_TASK_KO[k] === ko) ?? 'stake'] ?? ko;
const DZ_ALT = Object.values(DISEASE_KO).join('|');
/** 247차 — 물의 양 · 밭 손질 · 도구(문장 규칙 전용 — 사전에 두면 「조금」 물때 · 등급 「보통」 · 아이템 이름을 덮는다) */
const AMT_EN: Record<string, string> = { 조금: WATER_AMOUNT_EN.light, 보통: WATER_AMOUNT_EN.normal, 흠뻑: WATER_AMOUNT_EN.deep };
const AMT_EACH_EN: Record<string, string> = { 조금: 'give it a little at a time', 보통: 'give it a normal amount', 흠뻑: 'give it a good soak each time' };
const WATERED_EN: Record<string, (what: string) => string> = {
  조금: (w) => `Gave ${w} a little water`, 보통: (w) => `Watered ${w}`, 흠뻑: (w) => `Gave ${w} a good soak`,
};
const FIRST_EN: Record<string, string> = { 베어: 'Cut', 캐어: 'Dug up', 뽑아: 'Pulled' };
const LAST_EN: Record<string, string> = { 털기: 'thresh', '꼬투리 따기': 'pick the pods', '묶어 거두기': 'bundle and gather it' };
const DRY_WHEN_EN: Record<string, string> = { '털 때다': 'time to thresh', '꼬투리를 딸 때다': 'time to pick the pods', '거둘 때다': 'time to gather it' };
const TOOL_EN_BY_KO: Record<string, string> = Object.fromEntries(Object.keys(TOOL_NAME_KO).map((id) => [TOOL_NAME_KO[id], TOOL_NAME_EN[id] ?? TOOL_NAME_KO[id]]));
const toolEn = (ko: string): string => TOOL_EN_BY_KO[ko] ?? ko;
const lc1 = (x: string): string => x.charAt(0).toLowerCase() + x.slice(1);
/** 거둔 문장 꼬리 한 조각 */
function harvestTailEn(seg: string, tr: (s: string) => string): string {
  if (seg === '검붉게 덜 익은 것이라 품질이 떨어진다') return 'picked while turning, so lower quality';
  if (seg === '서리 맞은 끝물, 이 칸은 끝났다') return 'frost-hit last picking, this cell is done';
  let q = /^병으로 (\d+)% 줄었다$/.exec(seg);
  if (q) return `disease cut it by ${q[1]}%`;
  q = /^송이가 굵어 (\d+)개 더$/.exec(seg);
  if (q) return `thick clusters, ${q[1]} extra`;
  q = /^종묘사에 (.+)이 들어온다$/.exec(seg);
  if (q) return `${q[1].split(' · ').map((y) => tr(y)).join(', ')} now at the seed shop`;
  return tr(seg);
}
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
  // ── 245차 — 작물별 일 · 묶음 작업 · 끌어 올리기 · 짝 맞추기 ──
  '함께 하는 칸': 'Cells together', '북준 포기': 'Hilled', '맺어 준 꽃': 'Pollinated', '다 했다': 'All done',
  '꽃을 눌러야 한다': 'Click a flower', '먼저 수꽃을 딴다': 'Pick a male flower first',
  '수꽃을 땄다 — 암꽃 암술에 묻힌다': 'Male flower picked — now dab it on a female flower',
  '밑동까지 끌어 올린다': 'Drag it all the way up to the base of the plant',
  '아직 때가 아니다 — 거둔 뒤에 한다': 'Not yet — do it after the next harvest',
  '수확기 — 다 자란 것부터 거둔다': 'Harvest season — pick whatever is grown',
  '거둔 뒤': 'after the next harvest',
  '새 피해': 'Bird damage',
  '초기 생장 — 줄기와 잎을 키운다': 'Early growth — building stems and leaves',
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
  '손이 가는 일 · 작업 장면': 'Work it takes · work scenes', '고추 · 토마토 병해 · 약': 'Pepper and tomato diseases · sprays',
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
  '마당 풀밭에 4×3칸 텃밭 한 구획을 낸다(한 칸 = 2×2 타일). 칸마다 호미로 일궈야 심을 수 있다.':
    'Lays out a 4×3-cell vegetable patch on the yard lawn (each cell is 2×2 tiles). Till each cell with a homi before planting.',
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
  '칸마다 먼저 호미로 흙을 일궈야 심을 수 있습니다. 호미 · 퇴비 · 씨앗 봉투는 생활용품점, 모종과 씨감자 · 마늘 종구 같은 덩이, 지주대 · 비료 · 농약 같은 농자재는 종묘사가 팝니다. 모종과 덩이는 심을 철에만 진열됩니다.':
    'Each cell must be tilled with a homi before you can plant it. The general store sells the homi, compost and seed packets; the seed shop sells seedlings, tubers such as seed potatoes and seed garlic, and supplies such as stakes, fertilizer and sprays. Seedlings and tubers are only on the shelves in planting season.',
  '씨앗은 싸지만 싹이 트는 비율만큼만 서고 오래 걸립니다. 모종은 비싸지만 싹 틔우는 몇 주를 건너뛰고 거의 다 뿌리를 내립니다. 씨앗 · 모종을 우클릭 [상세보기]하면 심는 철 · 거두기까지 · 한 칸에 드는 양 · 칸당 거두는 양이 나옵니다.':
    'Seeds are cheap, but only as many come up as germinate, and they take longer. Seedlings cost more, skip the weeks of raising them, and nearly all take root. Right-click a seed or seedling → [Details] for its planting months, days to harvest, how much one cell takes and how much one cell yields.',
  '작물은 실제 시간대로 자라고, 게임을 꺼 둔 동안에도 자랍니다. 철도 실제 달을 따릅니다 — 자라는 달 밖에서는 멈추고, 겨울을 나는 작물(마늘 · 양파 · 보리 · 시금치)은 겨울에 쉬었다가 봄에 이어 자랍니다.':
    'Crops grow on real time, even while the game is off. Seasons follow the real month too — outside their growing months crops stop, and crops that winter over (garlic, onion, barley, spinach) rest through winter and carry on in spring.',
  '비가 오면 저절로 물이 듭니다(화면에 보이는 그 비입니다). 흙이 마르면 자람이 멈추고 품질이 조금씩 떨어질 뿐, 시들어도 죽지는 않습니다. 물은 물뿌리개를 가방에 두고 텃밭 창의 [물 주기]로 줍니다. 퇴비는 심기 전에 넣으면 이번 작기에 더 빨리 자라고 품질이 오릅니다.':
    'Rain waters the patch for you (the same rain you see on screen). Dry soil only pauses growth and slowly lowers quality — plants wilt, but they never die. To water, keep a watering can in your bag and press [Water] in the patch window. Compost worked in before planting speeds up this season and raises quality.',
  '여름에는 병충해로 품질이 가끔 떨어지고, 다 익은 뒤 오래 두면 꽃대가 서거나 쇠어 품질이 내려갑니다. 겨울을 나지 못하는 작물을 서리 내리는 달에 밭에 두면 조금씩 상합니다. 작물마다 드는 병 · 벌레 · 새는 「병 · 벌레 · 새」 항목에 있습니다.':
    'In summer, pests now and then knock quality down, and crops left long after they ripen bolt or turn tough and lose quality. Crops that cannot winter over slowly spoil if left in the bed in the frost months. The diseases, pests and birds each crop gets are in the "Diseases, pests and birds" topic.',
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
  '산채 재배를 배우면 곰취 · 산마늘 · 눈개승마 · 두릅 같은 산나물 모종이 종묘사에 들어오고, 수경 재배를 배우면 냉수 순환 수조와 고추냉이 모종을 다룰 수 있습니다.':
    'Learn Mountain Greens and the seed shop starts stocking mountain-green seedlings such as gomchwi, alpine leek, goat\'s beard and fatsia shoots; learn Hydroponics and you can run a cold-water tank and grow wasabi seedlings.',
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
  // 245차 — 도움말 「작물마다 다른 일」 · 「병 · 벌레 · 새」
  // 238차 도움말(고추 기르기 · 고추 · 토마토 병해 · 육묘) — 245차에 영어가 빠진 것을 메움
  '고추 · 토마토 · 가지 · 오이처럼 손이 가는 작물은 심어 놓고 기다리기만 해서는 안 됩니다. 실제 재배 순서를 따라 할 일이 열립니다 — 두둑을 높이고 검은 비닐을 씌우는 멀칭, 심은 즉시 세우는 1.5m 지주, 자라는 대로 두 번 묶는 유인줄, 방아다리(줄기가 처음 Y자로 갈라지는 곳)의 첫 꽃 따기와 그 아래 곁순 따기, 정식 15일 뒤부터 15~20일 간격의 웃거름 다섯 번, 그리고 장마철 방제입니다.':
    'Fussy crops like chili peppers, tomatoes, eggplants and cucumbers cannot just be planted and left. Jobs open in the real growing order — raising the ridge and laying black mulch film, a 1.5 m stake set right after planting, two rounds of tying to the training line as it grows, picking the first flower at the first fork (where the stem first splits into a Y) and the suckers below it, five top-dressings every 15–20 days from 15 days after transplanting, and spraying in the rainy season.',
  '할 일은 텃밭 창의 칸 자세히 아래 「할 일」 단추로 뜨고, 열리기 전에는 「다음: 무엇 — 며칠 뒤」로 보입니다. 할 일이 열리면 지역 채널에도 알립니다. 때를 놓치면 그 차례는 넘어가고 수확이 조금 줍니다(첫 꽃 · 곁순 · 유인 · 웃거름). 지주를 안 세우면 비바람에 쓰러져 수확이 크게 줍니다. 비료 · 약을 하나도 안 써도 거두기는 됩니다 — 다만 웃거름을 다 거르면 0.7배입니다.':
    'Jobs appear as buttons under "To do" in the cell details of the patch window; before they open you see "Next: job — in N days". When a job opens you are also told in the Local Channel. Miss the window and that round is skipped and the harvest shrinks a little (first flower, suckers, tying, top-dressing). Skip the stake and the plants blow over in wind and rain, and the harvest drops sharply. You can still harvest without using any fertilizer or sprays — but skipping every top-dressing leaves you with 0.7×.',
  '모종을 심은 뒤 2주는 활착기입니다. 흙이 마르면 뿌리를 못 내려 포기가 줍니다 — 비가 오지 않으면 물뿌리개로 자주 줍니다. 씨앗 · 모종을 우클릭 [상세보기]하면 「손이 가는 일」 줄에 그 작물의 일이 다 나옵니다.':
    'For two weeks after a seedling goes in, it is taking root. If the soil dries out the roots cannot take and plants are lost — water often with the watering can when it does not rain. Right-click a seed or seedling and choose [Details]: the "Work it takes" line lists every job for that crop.',
  '할 일 단추를 누르면 그 일을 흉내 내는 짧은 작업 장면이 열립니다. 곁순 · 첫 꽃 · 병든 열매는 포기 그림에서 표시된 것을 하나씩 누르고(줄기를 누르면 실수), 지주 · 멀칭은 표시된 자리에 차례로 박고, 유인줄은 흔들리는 표시가 띠 안에 들어올 때 누르고, 약 치기는 누르고 있다가 게이지가 띠 안에 있을 때 떼고, 웃거름은 포기 사이 표시된 자리에 뿌리고, 가식은 작은 트레이의 싹을 눌러 넓은 트레이로 옮깁니다.':
    'Pressing a job button opens a short work scene that mimics the job. For suckers, first flowers and diseased fruit, tap each marked one on the plant (touching the stem is a mistake); stakes and mulch go into the marked spots in order; for tying, press when the swaying marker is inside the band; for spraying, hold and release while the gauge is inside the band; top-dressing is scattered on the marked spots between plants; pricking out moves each sprout from the small tray to the wide tray.',
  '손이 끝나도 「걸리는 시간」이 다 차야 끝납니다 — 일에는 시간이 듭니다(지주 세우기 10초쯤). 허기 · 수분 · 피로도 조금 듭니다. 실수가 많거나 타이밍을 자주 놓치면 서툴러서 효과가 절반이 됩니다(자재는 그대로 듭니다). 자재가 모자라면 단추가 흐리고, 올려 보면 무엇이 몇 개 모자란지 나옵니다.':
    'Even when your hands are done, the job only ends once "Time it takes" fills up — work takes time (about 10 seconds to stake). It also costs a little hunger, thirst and fatigue. Too many mistakes or missed timings make you clumsy and halve the effect (the materials are used up all the same). If you are short of materials the button is dimmed; hover over it to see what you are missing and how many.',
  '고추 · 토마토에는 세 가지 병이 듭니다(수박도 탄저병, 오이 · 애호박 · 가지 · 참외도 바이러스병). 역병은 장마철처럼 다습할 때 줄기 밑이 물에 데인 듯 썩고 포기가 시들어 죽습니다 — 포기가 줄어 수확이 줍니다. 탄저병은 6~9월 고온다습한 때 열매에 둥근 반점이 생겨 썩고, 빗물로 거의 다 번집니다 — 심하면 수확의 60%까지 잃습니다. 바이러스병은 잎에 모자이크 무늬 · 위축이 생기고 총채벌레 · 진딧물이 옮깁니다 — 수확의 절반까지 잃습니다.':
    'Chili peppers and tomatoes get three diseases (watermelon gets anthracnose too, and cucumber, zucchini, eggplant and Korean melon get the virus as well). Phytophthora blight strikes in muggy weather like the rainy season — the base of the stem rots as if scalded and the plant wilts and dies, so fewer plants means a smaller harvest. Anthracnose comes in the hot, humid months of June–September — round spots appear on the fruit and it rots, spreading almost everywhere with rain splash; at worst you lose 60% of the harvest. The virus causes mosaic patterns and stunting on the leaves and is carried by thrips and aphids — up to half the harvest is lost.',
  '병은 하루 한 번 듭니다. 비 온 뒤 하루는 두 배로 잘 들고, 두둑 · 멀칭을 했으면 덜 들고, 비닐 터널 안이면 빗물을 안 맞아 탄저병이 훨씬 덜 듭니다. 곁순을 안 따면 바람이 안 통해 탄저병이 더 듭니다. 스킬 「해충 방제」가 전체를 낮춥니다.':
    'Disease strikes once a day. The day after rain it is twice as likely; a ridge with mulch lowers it, and inside a plastic tunnel the plants stay out of the rain, so anthracnose is much rarer. Leaving the suckers on blocks the air and invites more anthracnose. The Pest Control skill lowers all of it.',
  '든 병은 날마다 번집니다. 텃밭 창의 칸에 병 표식이 뜨고, 칸 자세히에 이름 · 심한 정도 · 막는 법이 나옵니다. 「병든 것 걷어 내기」로 병든 열매 · 포기를 걷으면 심한 정도가 줄고(사흘에 한 번), 약을 치면 번짐이 느려집니다. 세 병이 다 번지면 한 번에 한 개 날까 말까로 떨어지지만 0은 아닙니다.':
    'Disease spreads every day. A disease mark appears on the cell in the patch window, and the cell details show its name, severity and how to stop it. "Cull diseased" takes off diseased fruit and plants and lowers the severity (once every three days), and spraying slows the spread. If all three diseases spread fully you may get barely one fruit per picking — but never zero.',
  '방제는 병이 드는 철보다 한 달 앞서 「할 일」로 뜹니다(고추는 살균제 5~9월 · 살충제 4~9월 — 병이 들기 전에 미리 치는 것입니다). 살균제는 탄저병 · 역병을 열흘 동안 막아 줍니다 — 장마철에 비 전후로 7~10일 간격. 아인산은 역병을 두 주 동안 거의 막습니다 — 7~14일 간격. 칼슘액비는 열매 껍질을 단단하게 해 탄저병을 덜 들게 하고 품질을 올립니다. 살충제는 바이러스를 옮기는 총채벌레 · 진딧물을 열이틀 동안 막습니다.':
    'Spraying shows up as a job one month before the disease season (for chili: fungicide May–September, insecticide April–September — it prevents rather than cures). Fungicide holds off anthracnose and blight for ten days — every 7–10 days around the rains in the rainy season. Phosphite keeps blight almost entirely away for two weeks — every 7–14 days. Calcium foliar feed hardens the fruit skin, so there is less anthracnose and better quality. Insecticide keeps off the thrips and aphids that carry the virus for twelve days.',
  '약 · 비료 · 지주대 · 유인끈 · 멀칭 비닐 · 육묘 트레이는 종묘사에서 팝니다. 값은 한 칸 한 번 분입니다. 약을 안 치면 벌은 없습니다 — 벌은 병 그 자체입니다.':
    'Sprays, fertilizer, stakes, twine, mulch film and seedling trays are sold at the seed shop. Prices are for one cell, one application. Skipping sprays carries no penalty in itself — the penalty is the disease.',
  '고추 씨앗은 밭에 바로 뿌리지 않습니다. 2~3월 따뜻한 실내(25~30℃)에서 싹을 틔워야 하니 집 안 선반의 육묘 트레이(종묘사)에 뿌립니다. 파종 2주쯤 본잎이 나오면 「가식」 — 넓은 트레이로 한 포기씩 옮겨 심습니다(거르면 모종이 0.6배). 70~90일 기르면 「거두기」가 모종 20~30포기를 줍니다.':
    'Chili seeds are not sown straight into the bed. They have to sprout indoors in the warmth (25–30℃) in February–March, so sow them in a seedling tray (seed shop) on the indoor shelf. About two weeks after sowing, when the true leaves appear, "Prick out" — move each one into the wide tray (skip it and you get 0.6× the seedlings). After 70–90 days, "Harvest" gives you 20–30 seedlings.',
  '모종은 늦서리가 끝나고 최저 기온이 10℃ 넘게 안정될 때(속초는 4월 하순~5월 상순) 밭에 옮겨 심습니다 — 그 전에는 심기가 막힙니다. 초보라면 육묘를 건너뛰고 종묘사에서 모종을 사는 게 훨씬 수월합니다. 종묘사는 아침 8시에 열고 저녁 7시에 닫습니다.':
    'Seedlings go into the bed once the late frosts are over and the lows stay above 10℃ (late April to early May in Sokcho) — planting is blocked before then. If you are new to this, skipping the nursery and buying seedlings at the seed shop is much easier. The seed shop opens at 8 a.m. and closes at 7 p.m.',
  '고추는 익은 뒤 나흘까지 풋고추, 그 뒤 열흘까지는 검붉게 익는 중, 열흘이 지나면 홍고추입니다. 칸 자세히의 「익음」 줄이 알려 줍니다. 검붉은 채로 거두면 홍고추로 치지만 품질이 깎입니다 — 꼭지 끝까지 완전히 빨갛게 익었을 때 거둬야 말렸을 때 빛깔이 좋습니다.':
    'Chili peppers are green peppers for four days after ripening, turn dark red until day ten, and are red peppers after that. The "Ripeness" line in the cell details tells you. Picked while dark red they count as red peppers but lose quality — pick them when they are fully red right up to the stem for the best colour when dried.',
  '한 포기에서 한 번에 6~9개가 나오고(칸당 3포기 · 일주일마다 열 번), 병 · 관리에 따라 줄거나 늡니다. 가을 첫서리(속초는 10월 하순, 해마다 조금 다릅니다)가 내리면 고추는 더 자라지 못합니다 — 사흘 안에 남은 것을 다 거두면 그 칸은 끝나고, 안 거두면 칸이 빕니다. 비닐 터널 안이면 서리를 맞지 않습니다.':
    'One plant gives 6–9 peppers per picking (3 plants per cell, ten pickings a week apart), more or fewer depending on disease and care. When the first autumn frost falls (late October in Sokcho, a little different each year) the peppers stop growing — pick what is left within three days and the cell is done; leave it and the cell empties. Inside a plastic tunnel there is no frost.',
  '작물마다 다른 일': 'Every crop has its own jobs', '난이도만큼 손이 간다': 'The harder the crop, the more work',
  '때를 세는 네 가지': 'Four ways jobs come due', '도구 · 새 자재 · 새 손놀림': 'Tools, new supplies, new hand motions',
  '병 · 벌레 · 새': 'Diseases, pests and birds', '작물마다 드는 병 · 벌레': 'Each crop’s diseases and pests', '막는 법': 'How to keep them off',
  '이제 84종 작물 모두 그 작물의 일이 있습니다. 쉬운 작물은 한두 가지(상추 = 솎아 주기 · 웃거름 · 벌레 잡기, 콩나물 = 검은 천 덮기)이고, 까다로운 작물일수록 일이 늘고 병 · 벌레가 붙습니다(오이 = 유인망 · 곁순 · 순지르기 · 웃거름 · 약 · 흰가루병 · 노균병). 씨앗 · 모종을 우클릭 [상세보기]하면 「손이 가는 일」 줄에 다 나옵니다.':
    'Now every one of the 84 crops has its own jobs. Easy crops have one or two (lettuce: thinning, top-dressing and picking off pests; bean sprouts: covering from light), and the more demanding a crop, the more jobs it has and the more diseases and pests it attracts (cucumber: trellis net, side shoots, pinching out, top-dressing, sprays, powdery and downy mildew). Right-click a seed or seedling → [Details] and the Work it takes line lists them all.',
  '쉬운 작물은 일을 놓쳐도 덜 잃습니다 — 놓친 벌이 절반이고 병 · 벌레도 덜 듭니다. 보통 이상은 놓친 만큼 그대로 잃습니다. 아무것도 안 해도 거두기는 됩니다.':
    'Easy crops lose less when you miss a job — missed jobs cost half as much and diseases and pests strike less often. From Normal up, you lose the full amount. You can still harvest if you do nothing at all.',
  '같은 텃밭에 같은 작물을 여러 칸 심었으면 단추에 「(n칸)」이 붙고 한 번에 합니다. 자재는 칸마다 들고, 걸리는 시간과 품은 칸이 늘수록 덜 늘어납니다.':
    'If you planted the same crop in several cells of one patch, the button shows "(n cells)" and does them all at once. Supplies are used per cell; the time and effort grow more slowly than the number of cells.',
  '심은 날로 세는 일(솎아 주기 · 웃거름 · 북주기)은 심은 뒤 며칠째에 열립니다. 여러해살이(부추 · 산나물 · 블루베리)는 겨울을 나고 다시 올라온 날부터 다시 셉니다.':
    'Jobs counted from planting (thinning, top-dressing, hilling up) open a set number of days after planting. Perennials (garlic chives, mountain greens, blueberries) start counting again from the day they come back up after winter.',
  '달력으로 세는 일은 해마다 그 달에 한 번입니다 — 마늘 · 양파 짚 덮기(11~12월), 이른 봄 웃거름(2~3월), 보리밟기(2~3월), 블루베리 · 두릅 가지치기(2~3월), 딸기 부직포 덮기(12~1월). 그 달이 다 가도록 안 하면 놓칩니다.':
    'Calendar jobs come once a year in their months — straw over garlic and onions (Nov–Dec), early-spring top-dressing (Feb–Mar), treading the barley (Feb–Mar), pruning blueberry and fatsia (Feb–Mar), fleece over strawberries (Dec–Jan). Let the months run out and you miss it.',
  '자람으로 세는 일은 다 자라 갈 무렵 한 번입니다 — 배추 묶기, 수박 · 참외 열매 솎기, 옥수수 이삭 솎기와 이삭 망. 거둘 때마다 하는 일(부추 · 미나리 · 공심채를 벤 뒤 웃거름)은 다시 자람이 60%를 넘기 전에 합니다.':
    'Growth jobs come once as the crop nears maturity — tying the cabbage heads, thinning watermelons and melons, thinning the corn ears and bagging them. Jobs done after every picking (top-dressing garlic chives, water dropwort and water spinach after a cut) must be done before regrowth passes 60%.',
  '솎아 주기는 씨앗으로 뿌린 칸에만 뜹니다(모종은 이미 한 포기씩입니다). 고구마 두둑에 검은 비닐을 덮었으면 김매기가 없습니다.':
    'Thinning only shows on cells sown from seed (seedlings are already one per spot). If you covered a sweet potato ridge with black plastic, there is no weeding.',
  '김매기 · 북주기는 호미, 가지치기는 전정가위(종묘사)가 가방에 있어야 합니다 — 닳지 않습니다. 방충망(한랭사) · 새 그물 · 부직포 · 볏짚 · 오이망 · 피트모스는 종묘사가 한 칸 한 번 분씩 팝니다.':
    'Weeding and hilling up need a homi in your bag, pruning needs pruning shears (seed shop) — they never wear out. The seed shop sells insect mesh, bird netting, frost fleece, rice straw, trellis net and peat moss, each enough for one cell once.',
  '새 손놀림이 둘 있습니다. 북주기는 고랑의 흙 표시를 눌러 포기 밑동 띠까지 끌어 올립니다. 인공수분은 수꽃을 누른 뒤 암꽃을 누릅니다 — 암꽃부터 누르면 실수입니다.':
    'There are two new hand motions. Hilling up: press the soil mark in the furrow and drag it up to the band at the base of the plant. Hand-pollinating: click a male flower, then a female one — clicking the female first is a mistake.',
  '열매 작물의 역병 · 탄저병 · 바이러스병 말고도 작물마다 실제로 문제 되는 것이 듭니다. 흰가루병(오이 · 호박 · 참외 · 수박 · 박 · 여주 · 딸기), 노균병(오이 · 참외 · 양파 · 시금치), 녹병(마늘 · 대파), 잿빛곰팡이병(딸기), 뿌리썩음병(생강 · 울금), 무름병(고추냉이), 푸른곰팡이병(버섯 배지 — 집 안에서도 듭니다)입니다.':
    'Beyond blight, anthracnose and virus on fruiting crops, each crop gets the troubles it really has: powdery mildew (cucumber, zucchini, melon, watermelon, gourd, bitter melon, strawberry), downy mildew (cucumber, melon, onion, spinach), rust (garlic, leek), gray mold (strawberry), root rot (ginger, turmeric), soft rot (wasabi) and green mold (mushroom blocks — it strikes indoors too).',
  '벌레는 애벌레(배추 · 무 · 열무 · 얼갈이 · 순무 · 초피), 벼룩잎벌레(배추 무리 · 루꼴라), 진딧물(상추 · 쑥갓 · 가지 · 오크라 · 동부 · 초피), 노린재(콩), 조명나방(옥수수)이 있습니다. 새는 익어 가는 블루베리와 옥수수 이삭을 쪼아 먹습니다.':
    'The pests are caterpillars (cabbage, radish, young radish, ugeolgari, turnip, Korean pepper), flea beetles (the cabbage family and rocket), aphids (lettuce, crown daisy, eggplant, okra, cowpea, Korean pepper), stink bugs (soybeans) and corn borers (corn). Birds peck at ripening blueberries and corn ears.',
  '병은 「병든 것 걷어 내기」와 살균제, 벌레는 「벌레 잡기」 · 방충망 · 살충제, 새는 새 그물로 막습니다. 배추 무리는 씨 뿌린 날 방충망을 씌우면 작기 내내 애벌레 · 벼룩잎벌레가 거의 들지 않습니다.':
    'Diseases are fought with Cull diseased and fungicide, pests with Pick off pests, insect mesh and insecticide, birds with a bird net. Mesh the cabbage family on sowing day and caterpillars and flea beetles hardly get in all season.',
  '약 치기는 그 작물에 드는 병 · 벌레의 철보다 한 달 앞서 「할 일」로 뜹니다(미리 막는 약입니다). 안 쳐도 벌은 없습니다 — 벌은 병 · 벌레 그 자체입니다.':
    'Spraying shows up as a job one month before the season of the diseases and pests that crop gets (it is preventive). Skipping it costs nothing in itself — the cost is the disease or pest.',
  '작물마다 드는 병 · 벌레 · 새는 「병 · 벌레 · 새」 항목에 있습니다.': 'Each crop’s diseases, pests and birds are under Diseases, pests and birds.',
  // ── 247차 — 재배 요소 · 밭에서 직접 · 거둔 뒤 손질 · 귀한 작물 · 모종 꺼내기 ──
  '기르는 법': 'How to grow', '물 조금': 'Water a little', '물 보통': 'Water normally', '물 흠뻑': 'Soak',
  '이 칸 물': 'Water this cell', '물 끊기': 'Stop watering', '거두기 전이다 — 물을 끊어야 맛이 들고 오래 간다': 'Harvest is near — stop watering so it sweetens and keeps',
  '철': 'Season', '알맞은 철': 'Best season', '도구': 'Tools', '늘리기': 'Propagation', '품 · 거름': 'Work · feed', '물': 'Water',
  '거둔 뒤 손질': 'After harvest', '무엇인가': 'What is it', '이름 모를 싹': 'Unknown sprout', '조금 더 자라면 잎 모양으로 알아본다': 'Once it grows a little you will know it by its leaves',
  '말리는 중': 'Drying', '밭에 눕혀 말린다 — 비 오는 동안은 마르지 않는다': 'Laid in the field to dry — it does not dry while it rains',
  '다 말랐는데 너무 오래 뒀다 — 꼬투리가 터져 알이 쏟아진다': 'Dry, but left too long — the pods are splitting and spilling seed',
  '말리는 동안 비를 맞았다 — 품질이 조금 떨어졌다': 'It got rained on while drying — quality dropped a little',
  '다 말랐다 — 털 때': 'Dry — time to thresh', '다 말랐다 — 꼬투리를 딸 때': 'Dry — time to pick the pods', '다 말랐다 — 거둘 때': 'Dry — time to gather',
  '포기 나누기': 'Divide', '뿌리 꺾꽂이': 'Root cuttings', '모종 꺼내기': 'Take out seedlings', '텃밭 창 열기': 'Open the patch window',
  '호미로 일구기': 'Till with the homi', '호미로 캐기': 'Dig with the homi', '먼저 땅을 일군다': 'Till the ground first',
  '거름을 많이 먹는다 — 퇴비를 넣으면 더 난다': 'A heavy feeder — compost gives a bigger crop',
  '퇴비를 넣은 칸 — 이 작물은 거름이 많으면 잎만 무성하다': 'Composted cell — too much feed gives this crop only leaves',
  '퇴비를 넣은 칸 — 거름이 많으면 잎만 무성해진다': 'Composted cell — too much feed gives only leaves',
  '말리는 칸이 아니다': 'This cell is not drying anything', '지금은 벨 수 없다': 'You cannot cut it now', '지금은 털 수 없다': 'You cannot thresh it now',
  '아직 모종이 덜 자랐다': 'The seedlings are not ready yet', '꺼낼 모종이 없다': 'No seedlings to take out',
  '가방에 자리가 없다 — 한 칸 비우고 꺼낸다': 'Your bag is full — free a slot, then take them out',
  '가방에 자리가 없다 — 한 칸 비우고 나눈다': 'Your bag is full — free a slot, then divide',
  '나누어 늘리는 작물이 아니다': 'This crop is not propagated by dividing', '지금은 나눌 수 없다': 'You cannot divide it now', '나눌 포기가 없다': 'Nothing to divide',
  '나눌 수 없다': 'Cannot divide', '한 해를 넘겨 뿌리가 자리 잡은 포기라야 나눈다': 'Only a plant that has rooted in over a year can be divided',
  '올해는 이미 나눴다 — 포기가 힘을 되찾게 둔다': 'Already divided this year — let the plant recover',
  '호미가 있어야 포기를 나눈다': 'You need a homi to divide plants', '할 일이 없다': 'Nothing to do',
  '포기를 나눴다': 'divided the plant', '뿌리를 잘라 꺾꽂이 감을 얻었다': 'cut root pieces for cuttings',
  '지난해 흙에 떨어져 있던 씨가 올라왔다': 'Seed that fell into the soil last year came up',
  '새가 열매를 먹고 떨군 씨가 났다': 'A bird ate the fruit and dropped the seed here',
  '숲에서 바람에 날아든 씨앗이 그늘 아래 텄다': 'A seed blown in from the woods sprouted in the shade',
  '바람에 날아든 씨앗이 텄다': 'A wind-blown seed sprouted',
  '가시에 손을 찔렸다(장갑을 끼면 안 다친다)': 'Pricked your hand on the thorns (gloves prevent it)',
  '도리깨로 털었다': 'threshed with a flail', '키로 까불러 검불을 날렸다': 'winnowed the chaff away',
  '키가 없어 검불이 섞였다': 'no winnowing basket — chaff stayed in', '키질이 서툴러 검불이 섞였다': 'clumsy winnowing — chaff stayed in',
  '말리는 동안 비를 맞았다': 'got rained on while drying',
  '귀한 모종 · 씨앗은 열흘에 한 번꼴로 들어온다': 'Rare seedlings and seeds come in about once every ten days',
  '설악종묘사': 'Seorak Seed Shop', '알맞은 철 밖': 'Out of season', '수량 −15%': 'yield −15%', '알맞은 철을 벗어났다': 'Out of its season', '수량이 준다': 'the yield drops',
  '묵힌 흙에서 저절로 싹이 텄다': 'Came up by itself in fallow soil', '저절로 난 싹': 'Volunteer sprout',
  '거두기 전에는 물을 끊는다': 'stop watering before harvest', '거둘 때 곁눈': 'Offsets at harvest',
  // 도구 한 줄 조각(작물별 한 줄은 표에서 통째로 — 조각은 남는 조합 대비)
  '벨 때 낫이 있어야 한다': 'needs a sickle to cut', '낫이나 수확 가위로 베면 품이 준다': 'a sickle or snips makes cutting easier',
  '호미나 쇠스랑으로 캔다 — 쇠스랑은 빠르지만 몇 개 찍힌다': 'dug with a homi or a digging fork — the fork is faster but spears a few',
  '호미나 쇠스랑으로 캔다 — 쇠스랑이 빠르다': 'dug with a homi or a digging fork — the fork is faster',
  '캐기 전 덩굴은 낫으로 걷는다': 'clear the vines with a sickle first', '수확 가위가 있으면 빠르고 조금 더 좋다': 'harvest snips are quicker and a touch better',
  '털 때 도리깨가 도움': 'a flail helps with threshing', '키로 까부르면 값을 더 받는다': 'winnowing fetches a better price',
  '가시 — 장갑을 낀다': 'thorny — wear gloves', '모종삽이 있으면 심는 품이 준다': 'a trowel eases planting',
  // 작업 장면
  '마른 단을 서너 번씩 내리친다': 'Beat each dry sheaf three or four times', '여문 꼬투리만 딴다': 'Pick only the filled pods',
  '마른 알뿌리를 주워 묶는다': 'Gather the dried bulbs and tie them', '표시가 띠 높이일 때 까부른다': 'Toss when the marker is at the band',
  '그늘 → 반그늘 → 볕 차례로 내놓는다': 'Set it out in shade → part shade → sun, in order',
  '남은 단': 'Sheaves left', '남은 꼬투리': 'Pods left', '까부른 번': 'Tosses', '다 털었다': 'All threshed', '여문 것은 다 땄다': 'All the filled pods are picked',
  '다 묶어 매달았다': 'All tied and hung', '검불이 다 날아갔다': 'The chaff has all blown away', '덜 여문 꼬투리는 남긴다': 'Leave the unfilled pods',
  '너무 높이 까불렀다 — 알이 넘쳐 쏟아졌다': 'Tossed too high — grain spilled over', '너무 낮다 — 검불이 날지 않는다': 'Too low — the chaff will not fly',
  '깔개를 쳤다 — 마른 단을 친다': 'You hit the tarp — strike the dry sheaves', '꼬투리를 눌러야 한다': 'Click the pods', '마른 알뿌리를 줍는다': 'Pick up the dried bulbs',
  // 모종 꺼내기 창
  '가방에': 'In bag', '다 꺼내기': 'Take all', '트레이에 남은 모종': 'Seedlings left in the tray', '트레이가 비었다': 'The tray is empty',
  '이 줄은 비었다': 'This row is empty',
  '다 자란 모종을 트레이에서 꺼낸다. 모종 하나를 누르면 그 포기만 뿌리 흙째 뽑혀 가방에 들어간다 — 하나 꺼내 보자.':
    'Take grown seedlings out of the tray. Click one and just that plant comes out with its root ball and goes into your bag — take one out.',
  '줄 머리를 누르면 트레이를 잘라 그 줄을 통째로 떼어 낸다. 꺼내지 않은 모종은 트레이에서 그대로 자란다.':
    'Click a row handle to cut the tray and take that whole row. Seedlings you leave keep growing in the tray.',
  '꺼낸 모종은 텃밭 칸에 옮겨 심는다 — 늦서리가 지난 뒤에.': 'Plant the seedlings out in the patch — after the last frost.',
  // 필드 가이드
  '텃밭 한 칸(2×2)을 밟고 서면 그 칸 테두리가 약하게 빛난다. [F]는 그 칸에 한다.':
    'Stand on a patch cell (2×2) and its border glows softly. [F] works on that cell.',
  '퀵슬롯에 든 것에 따라 [F]로 하는 일이 바뀐다 — 호미는 일구기, 물뿌리개는 물(누르고 있을수록 많이), 씨앗 · 모종은 심기, 지주대 · 끈 · 약은 그 일. 손 닿는 이웃 칸은 눌러서 해도 된다.':
    'What [F] does depends on your quickslot item — the homi tills, the watering can waters (hold longer for more), seeds and seedlings plant, stakes, twine and sprays do their job. You can also click a neighbouring cell within reach.',
  '칸 오른쪽 위 그림은 지금 할 것이다 — 거둘 것 · 털 때 · 할 일의 자재 · 목마름. 손에 맞는 것이 없으면 [F]로 그 칸의 일을 고르거나 텃밭 창을 연다.':
    'The picture at a cell’s top right is what it needs now — something to harvest, threshing, a job’s material, or water. With nothing suitable in hand, [F] lets you pick the cell’s job or open the patch window.',
  // 도움말 — 247차
  '밭에서 직접 — 칸 밟고 일하기': 'In the field — working the cells', '칸을 밟고 손에 든 것으로': 'Stand on a cell, use what you hold',
  '마당 텃밭 한 구획은 4×3칸이고, 한 칸은 2×2 타일입니다. 칸마다 그려집니다 — 일군 이랑 · 젖은 흙 · 자라는 포기 · 익은 열매 · 세운 지주와 묶은 끈 · 덮은 방충망 · 검은 비닐 · 짚 · 북준 흙 · 베어 말리는 단이 그 칸에 그대로 보입니다.':
    'A yard patch is 4×3 cells, and each cell is 2×2 tiles. Every cell is drawn as it is — tilled ridges, wet soil, growing plants, ripe fruit, stakes and ties, insect mesh, black film, straw, hilled-up soil and sheaves drying where they were cut.',
  '칸을 밟고 서면 그 칸 테두리가 약하게 빛나고, 머리 위에 [F]로 할 것이 뜹니다. 손 닿는 이웃 칸은 왼쪽 클릭으로 해도 됩니다.':
    'Stand on a cell and its border glows softly, with what [F] will do shown above your head. Neighbouring cells within reach can be worked with a left click.',
  '[F]나 그 칸 왼쪽 클릭은 퀵슬롯에 든 것을 씁니다 — 호미는 일구기(김매기 · 북주기 · 캐기), 물뿌리개는 물 주기, 씨앗 · 모종 · 종구는 심기, 낫 · 수확 가위 · 쇠스랑은 거두기, 지주대 · 끈 · 비료 · 약 · 망은 그 칸의 할 일입니다. 할 일은 작업 장면이 그 칸에서 바로 열리고, 끝나면 칸 그림이 바뀝니다(지주를 세우면 지주가, 망을 씌우면 망이 섭니다).':
    '[F] or a left click on the cell uses your quickslot item — the homi tills (and weeds, hills up and digs), the watering can waters, seeds, seedlings and sets plant, the sickle, snips and fork harvest, and stakes, twine, fertiliser, sprays and nets do that cell’s job. Jobs open their work scene right there, and when you finish the cell changes (stakes stand up, nets go on).',
  '손에 맞는 것이 없으면 [F]로 그 칸에서 할 수 있는 일(털기 · 거두기 · 할 일 · 텃밭 창 열기)을 고릅니다. 칸 오른쪽 위 그림은 지금 할 것입니다 — 거둘 수확물 · 털 때(도리깨) · 할 일의 자재 · 목마름(물방울).':
    'With nothing suitable in hand, [F] lets you choose what the cell allows (thresh, harvest, a job, open the patch window). The picture at a cell’s top right is what it needs — the crop to harvest, threshing (flail), a job’s material, or thirst (water drop).',
  '물의 양 · 알맞은 흙': 'How much water · the right soil', '조금 · 보통 · 흠뻑': 'A little · normal · soak',
  '작물마다 좋아하는 흙의 젖은 정도가 다릅니다. 고구마 · 땅콩 · 참깨처럼 메마른 땅을 좋아하는 것은 조금씩, 오이 · 토란 · 미나리처럼 물을 많이 먹는 것은 흠뻑 줍니다. 텃밭 창의 흙 막대와 칸 정보에 그 작물의 알맞은 띠(초록 테)가 그려집니다.':
    'Each crop likes its soil a different degree of wet. Dry-ground lovers like sweet potato, peanut and sesame get a little at a time; thirsty ones like cucumber, taro and water dropwort get a soaking. The soil bar in the patch window shows each crop’s right band (green outline).',
  '물뿌리개로 밭에서 줄 때는 누르고 있는 시간이 양입니다 — 짧게 누르면 조금, 조금 더 누르면 보통, 오래 누르면 흠뻑입니다. 텃밭 창에서는 위 줄 [물 조금 · 보통 · 흠뻑]이 구획 전체, 칸 자세히의 [이 칸 물]이 그 칸만 줍니다.':
    'In the field, how long you hold the watering can is how much you pour — a tap gives a little, a bit longer is normal, a long hold soaks. In the patch window, the top row [Water a little · normally · Soak] waters the whole plot and [Water this cell] just that cell.',
  '띠 아래(조금 마름)면 더디게 자라고, 바짝 마르면 멈춥니다. 띠 위로 며칠씩 잇달아 젖어 있으면 탈이 납니다 — 덩이 · 뿌리가 썩고(고구마 · 감자 · 생강), 익은 열매가 터지고(토마토 · 수박), 맛이 묽어지고(참외 · 딸기), 웃자랍니다. 하루 한 번 주는 물이나 비 한 번은 견딥니다.':
    'Below the band (a little dry) it grows slowly; bone dry, it stops. Days on end above the band cause trouble — roots and tubers rot (sweet potato, potato, ginger), ripe fruit splits (tomato, watermelon), flavour goes watery (melon, strawberry) or plants grow leggy. One watering a day or a single shower does no harm.',
  '고구마 · 양파 · 마늘 · 수박 · 참외는 거두기 전 며칠 동안 물을 끊어야 맛이 들고 오래 갑니다 — 그때가 되면 흙 줄에 「물 끊기」가 뜹니다.':
    'Sweet potato, onion, garlic, watermelon and Korean melon need water stopped for some days before harvest to sweeten and keep — the soil row shows "Stop watering" when it is time.',
  '품 · 도구 · 철': 'Labour · tools · timing', '일에는 품이 든다': 'Work takes effort',
  '일구기 · 퇴비 · 물 주기 · 심기 · 거두기 · 털기에는 품이 듭니다 — 피로가 쌓이고 배가 고프고 목이 마릅니다. 씨 뿌리기 · 잎 따기는 가볍고, 덩이 캐기 · 베기 · 털기는 무겁습니다. 피로가 88을 넘으면 쉬어야 일할 수 있습니다.':
    'Tilling, composting, watering, planting, harvesting and threshing take effort — fatigue builds and you get hungry and thirsty. Sowing and picking leaves are light; digging tubers, cutting and threshing are heavy. Above 88 fatigue you must rest before working.',
  '거두는 손이 작물마다 다릅니다 — 따기 · 꼭지 자르기 · 베기 · 캐기 · 뽑기. 깨 · 콩 · 보리를 베려면 낫이 있어야 하고, 덩이를 캐려면 호미나 쇠스랑이 있어야 합니다. 수확 가위(고추 가위) · 쇠스랑 · 모종삽 · 도리깨 · 키는 있으면 품이 줄고 조금 더 좋게 거둡니다 — 쇠스랑은 빠르지만 고구마 · 감자를 몇 개 찍습니다.':
    'Each crop is harvested its own way — picked, clipped, cut, dug or pulled. Cutting sesame, beans or barley needs a sickle; digging tubers needs a homi or a digging fork. Harvest snips, a fork, a trowel, a flail and a winnowing basket save effort and give a slightly better crop — the fork is fast but spears a few sweet potatoes and potatoes.',
  '두릅 · 엄나무 · 초피는 가시가 있어 장갑(코팅 장갑 · 목장갑) 없이 거두면 손을 찔립니다. 잎채소 · 열매 · 향채 · 산나물은 아침(5~10시)에 거두면 조금 더 좋습니다.':
    'Fatsia shoots, kalopanax and Korean pepper are thorny — harvest them without gloves (coated or cotton) and you get pricked. Leaves, fruit, herbs and wild greens are a little better picked in the morning (5–10 am).',
  '알맞은 철 · 거름': 'Timing · feeding',
  '심을 수 있는 달 가운데 알맞은 달이 따로 있습니다. 그 밖에 심으면 수량이 15% 줄고 까닭이 붙습니다 — 꽃대가 일찍 선다 · 냉해로 몸살을 앓는다 · 더위에 지친다 · 자랄 철이 짧다. 심기 목록에 미리 주황 글씨로 알려 줍니다.':
    'Among the months you can plant, some are best. Planting outside them cuts the yield by 15%, with a reason — it bolts early, suffers cold injury, wilts in the heat, or runs out of season. The planting list warns you in orange beforehand.',
  '거름도 작물마다 다릅니다. 콩 · 땅콩 · 고구마는 거름이 많으면 잎 · 덩굴만 무성해져 퇴비 칸에서 8% 덜 나고, 배추 · 고추 · 오이 · 수박처럼 많이 먹는 작물은 퇴비 칸에서 8% 더 납니다.':
    'Feeding differs too. Beans, peanuts and sweet potatoes run to leaves and vines when overfed and yield 8% less in a composted cell; heavy feeders like napa cabbage, peppers, cucumber and watermelon yield 8% more there.',
  '베고 · 말리고 · 털기': 'Cut · dry · thresh', '깨 · 콩 · 보리 · 땅콩 · 마늘 · 양파': 'Sesame · beans · barley · peanuts · garlic · onions',
  '깻잎을 따는 들깨와 참깨 · 콩 · 보리는 다 익으면 [베기]로 베어 그 칸에 눕혀 말립니다(낫이 있어야 합니다). 땅콩 · 마늘은 캐어, 양파는 뽑아 밭에서 말립니다. 말리는 동안 칸에 단이 누워 있고, 비 오는 동안은 마르지 않으며 비를 맞으면 품질이 조금 떨어집니다.':
    'Perilla (the same plant you pick leaves from), sesame, beans and barley are cut with [Cut] when ripe and laid in the cell to dry (you need a sickle). Peanuts and garlic are dug and onions pulled, then dried in the field. The sheaves lie in the cell while they dry; they do not dry while it rains, and rain lowers the quality a little.',
  '다 마르면 칸이 누렇게 바뀌고 [털기](땅콩은 꼬투리 따기, 마늘 · 양파는 묶어 거두기)를 합니다. 털기는 깔개 위 마른 단을 단마다 서너 번씩 내리치는 작업 장면이고, 도리깨가 있으면 빨리 끝납니다.':
    'When dry the cell turns golden and you [Thresh] (peanuts: pick the pods; garlic and onions: bundle and gather). Threshing is a work scene where you beat each dry sheaf on a tarp three or four times; a flail makes it quicker.',
  '깨 · 콩 · 보리는 털고 나서 키질을 합니다 — 키가 있으면 표시가 띠 높이일 때 까불러 검불을 날려 보내고, 잘 까부르면 값이 오릅니다. 키가 없거나 서툴면 검불이 섞여 품질이 조금 떨어집니다.':
    'Sesame, beans and barley are winnowed after threshing — with a winnowing basket, toss when the marker is at the band to blow the chaff away; good winnowing raises the price. Without a basket, or done clumsily, chaff stays in and quality drops a little.',
  '다 마른 뒤 너무 오래 두면 꼬투리가 터져 알이 쏟아집니다(참깨 · 들깨는 사흘 · 나흘, 콩은 일주일) — 하루에 2%씩 줄어 바닥은 60%입니다.':
    'Left too long after drying, pods split and spill their seed (sesame and perilla after three or four days, beans after a week) — 2% is lost a day, down to 60%.',
  '귀한 작물 구하기 · 저절로 나는 싹': 'Finding rare crops · volunteer sprouts', '종묘사에 늘 있지 않다': 'Not always at the nursery',
  '아주 까다로운 작물(산나물 · 고추냉이 · 두릅 · 엄나무 · 초피)의 모종은 종묘사에 늘 있지 않고 열흘에 한 번꼴로 들어옵니다 — 작물마다 들어오는 날이 다릅니다. 가게에 들어가면 주인이 다음에 들어오는 것과 남은 날을 귀띔합니다(기를 자격을 갖춘 뒤에만).':
    'Seedlings of very demanding crops (wild greens, wasabi, fatsia, kalopanax, Korean pepper) are not always stocked — they come in about once every ten days, each on its own day. The keeper tells you what comes next and in how many days (once you are qualified to grow them).',
  '한 해를 넘겨 자리 잡은 산채는 늘려서 씁니다 — 곰취 · 삼나물 · 어수리 · 명이 · 부지갱이는 포기 나누기, 두릅 · 엄나무는 뿌리 꺾꽂이(그 달에 한 해 한 번), 고추냉이는 거둘 때 곁눈을 떼어 냅니다. 텃밭 창 칸 자세히에 단추가 뜹니다(호미가 있어야 합니다).':
    'Wild greens that have settled in for a year can be multiplied — gomchwi, goat’s beard, eosuri, myeongi and bujigaengi by division, fatsia and kalopanax by root cuttings (once a year, in their month), and wasabi by splitting off offsets at harvest. The button appears in the patch window’s cell view (you need a homi).',
  '묵힌 칸에 저절로': 'Sprouting in fallow cells',
  '일군 채 두 주 넘게 비워 둔 칸에는 가끔 저절로 싹이 납니다. 차광막 아래 축축한 칸에는 숲에서 바람에 날아든 산나물 씨가, 볕 드는 칸에는 새가 열매를 먹고 떨군 초피 · 두릅 · 엄나무 씨나 여름 비름이 납니다. 한 구획에 한 번에 하나만, 드물게 납니다.':
    'A tilled cell left empty for over two weeks sometimes sprouts on its own. Under a shade net in damp soil, wild-green seed blown from the woods comes up; in sunny cells, Korean pepper, fatsia or kalopanax dropped by birds, or summer amaranth. Only one per plot at a time, and rarely.',
  '처음에는 「이름 모를 싹」입니다 — 조금 자라 잎 모양이 드러나면 무엇인지 알게 되고 채널에 알립니다. 기른 깨 · 들깨 · 비름 · 상추 같은 작물을 거두지 않고 씨가 여물도록 두면 씨가 흙에 떨어져, 이듬해 그 텃밭에 저절로 다시 날 수 있습니다.':
    'At first it is an "Unknown sprout" — once its leaves show you learn what it is, and the channel tells you. Leave crops like sesame, perilla, amaranth or lettuce unharvested until they set seed and the seed drops into the soil, so they may come up again by themselves next year.',
  '트레이에서 모종 꺼내기': 'Taking seedlings out of the tray',
  '집 안 육묘 트레이에서 다 자란 모종은 [모종 꺼내기]로 꺼냅니다. 모종 하나를 누르면 그 포기만 뿌리 흙째 뽑혀 가방에 「모종」으로 들어가고, 줄 머리를 누르면 트레이를 잘라 그 줄을 통째로 떼어 냅니다. 꺼내지 않은 모종은 트레이에서 그대로 자랍니다.':
    'Grown seedlings in the indoor tray come out with [Take out seedlings]. Click one and just that plant comes out with its root ball as a seedling item; click a row handle to cut the tray and take the whole row. Seedlings you leave keep growing in the tray.',
  '모종을 밭에 옮겨 심기 한 주 전부터는 「모종 굳히기」 — 트레이를 낮에 바깥 그늘 → 반그늘 → 볕으로 차례로 내놓아 바깥 공기에 길들입니다. 거르면 밭에 나가 몸살로 몇 포기가 죽습니다.':
    'From a week before planting out comes "Harden off seedlings" — set the tray out by day in shade → part shade → sun to get them used to outdoor air. Skip it and a few plants die of transplant shock in the field.',
  '칸마다 먼저 호미로 흙을 일궈야 심을 수 있습니다(밭에서 호미를 들고 칸을 밟고 [F] — 「밭에서 직접 — 칸 밟고 일하기」). 호미 · 퇴비 · 씨앗 봉투는 생활용품점, 모종과 씨감자 · 마늘 종구 같은 덩이, 지주대 · 비료 · 농약 같은 농자재는 종묘사가 팝니다. 모종과 덩이는 심을 철에만 진열됩니다.':
    'Each cell must be tilled with a homi before planting (hold the homi, stand on the cell and press [F] — see In the field — working the cells). The homi, compost and seed packets are sold at the household goods store; seedlings, seed potatoes, garlic sets and supplies like stakes, fertiliser and sprays at the nursery. Seedlings and sets are only stocked in planting season.',
  '비가 오면 저절로 물이 듭니다(화면에 보이는 그 비입니다). 흙이 마르면 자람이 멈추고 품질이 조금씩 떨어질 뿐, 시들어도 죽지는 않습니다. 물은 물뿌리개로 줍니다 — 밭에서 칸을 밟고 [F]를 누르고 있거나, 텃밭 창의 [물 조금 · 보통 · 흠뻑]으로 줍니다(「물의 양 · 알맞은 흙」). 퇴비는 심기 전에 넣으면 이번 작기에 더 빨리 자라고 품질이 오릅니다.':
    'Rain waters the patch by itself (the rain you see on screen). When the soil dries, growth stops and quality slips a little — plants wilt but never die. Water with the watering can — stand on a cell and hold [F], or use [Water a little · normally · Soak] in the patch window (see How much water · the right soil). Compost worked in before planting speeds growth and raises quality for that crop.',
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
  // 245차 — 묶음 단추 「웃거름 2/5 (3칸)」 · 결과 「웃거름 3칸 — 했다」 · 거둔 뒤 일
  [new RegExp(`^(${TASK_ALT})(?: (\\d+)/(\\d+))? \\((\\d+)칸\\)$`), (m) => `${TASK_EN(m[1])}${m[2] ? ` ${m[2]}/${m[3]}` : ''} (${m[4]} cells)`],
  [new RegExp(`^(${TASK_ALT}) (\\d+)칸 — (했다|서툴러서 효과가 절반이다)$`), (m) => `${TASK_EN(m[1])} on ${m[2]} cells — ${m[3] === '했다' ? 'done' : 'clumsy, half the effect'}`],
  [new RegExp(`^(${TASK_ALT}) — 거둔 뒤$`), (m) => `${TASK_EN(m[1])} — after the next harvest`],
  [new RegExp(`^다음: (${TASK_ALT}) — 거둔 뒤$`), (m) => `Next: ${TASK_EN(m[1])} — after the next harvest`],
  // 245차 — 요약 조각 「짚 덮기(11~12월)」 · 「웃거름(벨 때마다)」 · 「솎아 주기(씨앗)」 · 「벌레 — 애벌레 · 벼룩잎벌레」
  [new RegExp(`^(${TASK_ALT})\\((\\d+(?:~\\d+)?월(?: · \\d+(?:~\\d+)?월)*)\\)$`), (m) => `${TASK_EN(m[1])} (${monthRangeEn(m[2])})`],
  [new RegExp(`^(${TASK_ALT})\\(벨 때마다\\)$`), (m) => `${TASK_EN(m[1])} (after each cut)`],
  [new RegExp(`^(${TASK_ALT})\\(씨앗\\)$`), (m) => `${TASK_EN(m[1])} (from seed)`],
  [new RegExp(`^벌레 — ((?:${DZ_ALT})(?: · (?:${DZ_ALT}))*)$`), (m) => `Pests — ${m[1].split(' · ').map((x) => DZ_EN(x)).join(', ')}`],
  // 상세 「손이 가는 일」 요약 조각 — 「웃거름 5회」 · 「살균제 치기(철마다)」 · 「병해 — 역병 · 탄저병」
  [new RegExp(`^(${TASK_ALT}) (\\d+)회$`), (m) => `${TASK_EN(m[1])} ×${m[2]}`],
  [new RegExp(`^(${TASK_ALT})\\(철마다\\)$`), (m) => `${TASK_EN(m[1])} (in season)`],
  [new RegExp(`^병해 — ((?:${DZ_ALT})(?: · (?:${DZ_ALT}))*)$`), (m) => `Diseases — ${m[1].split(' · ').map((x) => DZ_EN(x)).join(', ')}`],
  [new RegExp(`^(${TASK_ALT})( \\(\\d+/\\d+\\))? — (했다|서툴러서 효과가 절반이다)$`),
    (m) => `${TASK_EN(m[1])}${m[2] ?? ''} — ${m[3] === '했다' ? 'done' : 'clumsy, half the effect'}`],
  [/^아직 때가 아니다 — (\d+)일 뒤$/, (m) => `Not yet — in ${m[1]} day${m[1] === '1' ? '' : 's'}`],
  // 245차 — 자재 · 도구가 모자라다(「복합비료 2개(1개) · 호미가 있어야 한다 — 종묘사 · 생활용품점에서 판다」)
  [/^(.+)(?:이|가) 있어야 한다 — ((?:종묘사|생활용품점)(?: · (?:종묘사|생활용품점))*)에서 판다$/, (m, tr) => `You need ${m[1].split(' · ').map((x) => {
    const q = /^(.+) (\d+)개\((\d+)개\)$/.exec(x);
    return q ? `${tr(q[1])} ×${q[2]} (have ${q[3]})` : `a ${tr(x).toLowerCase()}`;
  }).join(', ')} — ${m[2].split(' · ').map((x) => (x === '종묘사' ? 'the seed shop' : 'the general store')).join(' or ')} sells ${m[1].includes(' · ') ? 'them' : 'it'}`],
  [/^(.+) — 종묘사에서 판다$/, (m, tr) => `${m[1].split(' · ').map((x) => {
    const q = /^(.+) (\d+)개\((\d+)개\)$/.exec(x);
    return q ? `${tr(q[1])} ×${q[2]} (have ${q[3]})` : tr(x);
  }).join(', ')} — the seed shop sells them`],
  [/^한 번에 (\d+)~(\d+)개 × (\d+)포기$/, (m) => `${m[1]}–${m[2]} each per picking × ${m[3]} plant${m[3] === '1' ? '' : 's'}`],
  [/^(\d+)일 더 흙을 촉촉하게 — 마르면 뿌리를 못 내린다$/, (m) => `${m[1]} more day${m[1] === '1' ? '' : 's'} of moist soil — dry soil keeps the roots from taking`],
  [/^(.+) 모종 (\d+)~(\d+)포기 — 가식을 거르면 준다$/, (m, tr) => `${tr(m[1])} seedlings, ${m[2]}–${m[3]} plants — fewer if you skip pricking out`],
  [/^(.+) (\d+)포기를 길러 냈다 — 늦서리 뒤 밭에 옮겨 심는다$/, (m, tr) => `Raised ${m[2]} ${tr(m[1])} — transplant to the bed after the last frost`],
  [/^(\d+)~(\d+)월에 뿌려 모종을 키운다 — 늦으면 옮겨 심을 철을 놓친다$/, (m) => `Sow in ${MONTH_EN[Number(m[1])]}–${MONTH_EN[Number(m[2])]} to raise seedlings — later and you miss the transplanting window`],
  // 텃밭 알림 — 로그 줄(「[텃밭] … (텃밭 1번 칸 외 2칸)」)과 떠오르는 줄(꼬리표 · 칸을 뗀 것)을 같은 규칙으로.
  // 꼬리표는 맨 앞에 두고(「[Vegetable patch] Aphids on your …」) 칸은 정해진 꼴만 칸으로 읽는다(막는 법 글 안의 괄호와 섞이지 않게)
  [new RegExp(`^${PATCH_TAG}(.+) — (${TASK_ALT}) 할 때${WHERE_TAIL}$`), (m, tr) => `${patchTag(m[1])}${tr(m[2])} — time to ${TASK_EN(m[3]).toLowerCase()}${whereEn(m[4], tr)}`],
  [new RegExp(`^${PATCH_TAG}(.+)에 (${DZ_ALT})(?:이|가) (생겼다|붙었다) — (.+?)${WHERE_TAIL}$`), (m, tr) => `${patchTag(m[1])}${DZ_EN(m[3])} on your ${tr(m[2])} — ${tr(m[5])}${whereEn(m[6], tr)}`],
  [new RegExp(`^${PATCH_TAG}(.+)(?:을|를) 새가 쪼아 먹기 시작했다 — (.+?)${WHERE_TAIL}$`), (m, tr) => `${patchTag(m[1])}Birds are pecking at your ${tr(m[2])} — ${tr(m[3])}${whereEn(m[4], tr)}`],
  [new RegExp(`^${PATCH_TAG}(.+)(?:이|가) 비바람에 쓰러졌다 — 지주를 세웠어야 했다${WHERE_TAIL}$`), (m, tr) => `${patchTag(m[1])}Your ${tr(m[2])} blew over — it needed staking${whereEn(m[3], tr)}`],
  [/^(텃밭|집 안 선반) (\d+)번 칸 외 (\d+)칸$/, (m) => `${m[1] === '텃밭' ? 'patch' : 'indoor shelf'} cell ${m[2]} and ${m[3]} more`],
  [new RegExp(`^${PATCH_TAG}서리가 내렸다 — (.+) 남은 것을 사흘 안에 거둔다${WHERE_TAIL}$`), (m, tr) => `${patchTag(m[1])}Frost — harvest the last ${tr(m[2])} within three days${whereEn(m[3], tr)}`],
  // 245차 — 「심은 것」 줄: 이름 안에 「·」가 든 것(씨감자 (1칸 분 · 200g))도 통째로
  [/^(.+) · (\d+)일 전$/, (m, tr) => `${tr(m[1])} · ${m[2]} day${m[2] === '1' ? '' : 's'} ago`],
  [/^(.+) · 오늘$/, (m, tr) => `${tr(m[1])} · today`],
  [/^(텃밭|집 안 선반) (\d+)번 칸$/, (m) => `${m[1] === '텃밭' ? 'patch' : 'indoor shelf'} cell ${m[2]}`],
  //  꼬리(「 — 」로 이은 메모)는 조각마다 옮긴다 — 247차부터 도구 · 가시 · 곁눈 · 털기 · 키질 메모가 붙는다
  [/^(.+?) (\d+)개를 거뒀다((?: — .+)?)$/, (m, tr) => `Harvested ${m[2]} ${tr(m[1])}${m[3] ? m[3].slice(3).split(' — ').map((seg) => ` — ${harvestTailEn(seg, tr)}`).join('') : ''}`],
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
  // 247차 — 심기 거부 「지금은 심을 철이 아니다 — 3~5월 · 8~9월에 심는다」(달 묶음 안의 「·」 때문에 통째로) · 달 묶음만 받는 꼴로 좁혔다
  [/^지금은 심을 철이 아니다 — (\d+(?:~\d+)?월(?: · \d+(?:~\d+)?월)*)에 심는다$/, (m) => `Not planting season now — plant in ${monthRangeEn(m[1])}`],
  [/^(\d+(?:~\d+)?월(?: · \d+(?:~\d+)?월)*)에 심는다$/, (m) => `plant in ${monthRangeEn(m[1])}`],
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
  // ── 247차 — 물의 양 · 심기 · 밭 말리기 · 털기 · 모종 꺼내기 · 저절로 난 싹 · 포기 나누기 · 도구 · 지침 ──
  //  「조금 · 보통 · 흠뻑」 · 도구 이름은 사전에 두지 않는다(조금 물때 · 등급 「보통」 · 가방 아이템 이름을 덮는다) — 문장째 옮긴다.
  [/^물을 (조금|보통|흠뻑) 줬다$/, (m) => WATERED_EN[m[1]]('it')],
  [/^(\d+)칸에 물을 (조금|보통|흠뻑) 줬다$/, (m) => WATERED_EN[m[2]](`${m[1]} cells`)],
  [/^((?:\d+칸에 )?물을 (?:조금|보통|흠뻑) 줬다) — (.+)$/, (m, tr) => `${tr(m[1])} — ${tr(m[2])}`],
  [/^(.+) — 거두기 전에는 물을 끊는다$/, (m, tr) => `${tr(m[1])} — stop watering before harvest`],
  [/^(.+)에는 많다 — (조금|보통|흠뻑)씩 준다$/, (m, tr) => `Too much for ${tr(m[1])} — ${AMT_EACH_EN[m[2]]}`],
  [/^(조금|보통|흠뻑)씩 · 알맞은 흙 (\d+)~(\d+)%(?: · 넘치면 (.+))?$/,
    (m, tr) => `${AMT_EN[m[1]]} each time · soil ${m[2]}–${m[3]}% moist${m[4] ? ` · too much: ${lc1(tr(m[4]))}` : ''}`],
  [/^(.+) (조금|보통|흠뻑)씩$/, (m, tr) => `${tr(m[1])}: ${AMT_EN[m[2]].toLowerCase()} each time`],
  [/^(\d+)일 남음$/, (m) => `${m[1]} day${m[1] === '1' ? '' : 's'} left`],
  [/^(\d+)일 뒤$/, (m) => `in ${m[1]} day${m[1] === '1' ? '' : 's'}`],
  [/^(.+?)(?:을|를) 심었다(?: — (.+))?$/, (m, tr) => `Planted ${tr(m[1])}${m[2] ? ` — ${tr(m[2])}` : ''}`],
  [/^지금 심으면 (.+)$/, (m, tr) => `Plant now and it ${tr(m[1])}`],
  [/^(.+?)(?:을|를) (베어|캐어|뽑아) 밭에 눕혔다 — (\d+)일 말린 뒤 (털기|꼬투리 따기|묶어 거두기)$/,
    (m, tr) => `${FIRST_EN[m[2]]} the ${tr(m[1])} and laid it in the field — dry it ${m[3]} day${m[3] === '1' ? '' : 's'}, then ${LAST_EN[m[4]]}`],
  [/^아직 마르는 중이다 — (\d+)일 남짓 \(비 오는 동안은 마르지 않는다\)$/,
    (m) => `Still drying — about ${m[1]} more day${m[1] === '1' ? '' : 's'} (it does not dry while it rains)`],
  [/^너무 오래 두어 (\d+)%가 쏟아졌다$/, (m) => `left too long — ${m[1]}% spilled`],
  [new RegExp(`^${PATCH_TAG}(.+?)(?:이|가) 다 말랐다 — (털 때다|꼬투리를 딸 때다|거둘 때다)${WHERE_TAIL}$`),
    (m, tr) => `${patchTag(m[1])}Your ${tr(m[2])} is dry — ${DRY_WHEN_EN[m[3]]}${whereEn(m[4], tr)}`],
  [new RegExp(`^${PATCH_TAG}묵힌 칸에 이름 모를 싹이 올라왔다${WHERE_TAIL}$`), (m, tr) => `${patchTag(m[1])}An unknown sprout came up in a fallow cell${whereEn(m[2], tr)}`],
  [new RegExp(`^${PATCH_TAG}이름 모를 싹은 (.+?)(?:이었다|였다) — (.+?)${WHERE_TAIL}$`),
    (m, tr) => `${patchTag(m[1])}The unknown sprout was ${tr(m[2])} — ${tr(m[3])}${whereEn(m[4], tr)}`],
  [new RegExp(`^${PATCH_TAG}텃밭 (\\d+)구획의 칸을 넓혔다 — 이제 한 칸이 2×2다$`),
    (m) => `${patchTag(m[1])}Widened the cells of ${m[2]} patch${m[2] === '1' ? '' : 'es'} — one cell is now 2×2 tiles`],
  [new RegExp(`^${PATCH_TAG}텃밭 (\\d+)구획은 둘레에 자리가 없어 예전 크기 그대로다 — 걷고 넓은 풀밭에 다시 내면 넓어진다$`),
    (m) => `${patchTag(m[1])}${m[2]} patch${m[2] === '1' ? ' has' : 'es have'} no room around ${m[2] === '1' ? 'it' : 'them'} and kept the old size — take it up and lay it again on open grass to widen it`],
  [/^(.+) 모종 (\d+)포기를 트레이에서 꺼냈다(?: — (.+))?$/,
    (m, tr) => `Took ${m[2]} ${tr(m[1])} seedling${m[2] === '1' ? '' : 's'} out of the tray${m[3] ? ` — ${tr(m[3])}` : ''}`],
  [/^(\d+)포기가 트레이에 남았다$/, (m) => `${m[1]} left in the tray`],
  [/^곁눈 (\d+)개를 떼어 냈다$/, (m) => `took off ${m[1]} offset${m[1] === '1' ? '' : 's'}`],
  [/^(.+?)(?:으로|로) 빨리 캤지만 몇 개 찍혔다$/, (m) => `quick digging with the ${toolEn(m[1])}, but a few got speared`],
  [/^(.+?)(?:으로|로) 빨리 거뒀다$/, (m) => `quick work with the ${toolEn(m[1])}`],
  [/^(.+?)(?:이|가) 있어야 (벤다|캔다) — (.+)에서 판다$/, (m) => {
    const names = m[1].split(/(?:이나|나) /).map((x) => toolEn(x));
    const shops = m[3].split(' · ').map((x) => (x === '종묘사' ? 'the seed shop' : 'the general store'));
    return `You need ${names.map((x) => (/s$/.test(x) ? x : `a ${x}`)).join(' or ')} to ${m[2] === '벤다' ? 'cut' : 'dig'} — ${shops.join(' or ')} sells ${names.length > 1 ? 'them' : 'one'}`;
  }],
  [/^(.+) 포기를 나눴다$/, (m, tr) => `Divided the ${tr(m[1])}`],
  [/^(.+) 뿌리를 잘라 꺾꽂이 감을 얻었다$/, (m, tr) => `Cut root pieces from the ${tr(m[1])} for cuttings`],
  [/^(\d+(?:~\d+)?월(?: · \d+(?:~\d+)?월)*)에 나눈다$/, (m) => `Divide in ${monthRangeEn(m[1])}`],
  [/^너무 지쳤다 \(피로 (\d+)\) — 쉬고 나서 한다$/, (m) => `Too tired (fatigue ${m[1]}) — rest first`],
  [/^귀한 모종 · 씨앗은 열흘에 한 번꼴로 들어온다 — 다음은 (.+) — (\d+)일 뒤$/,
    (m, tr) => `Rare seedlings and seeds come in about once every ten days — next: ${tr(m[1])} in ${m[2]} day${m[2] === '1' ? '' : 's'}`],
  // 채널 로그 「[텃밭] 들깨 (100g) ×2」 · 거두는 것 「고추냉이 근경 (1뿌리 · 약 80g) · 칸당 6~9개」(이름 안의 「·」 때문에 통째로)
  [/^\[텃밭\] (.+) ×(\d+)$/, (m, tr) => `[Vegetable patch] ${tr(m[1])} ×${m[2]}`],
  [/^(.+) · 칸당 (\d+)(?:~(\d+))?개$/, (m, tr) => `${tr(m[1])} · ${m[2]}${m[3] ? `–${m[3]}` : ''} per cell`],
];
