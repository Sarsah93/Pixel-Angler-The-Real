/**
 * @file CropCareDatabase.ts
 * @description 238차 — 관리 작업 표 · 병해 3종 · 농약 · 자재(사용자 제안 「까다로움을 딸깍이 아니라 실제 동작 · 과정 · 시간으로」)
 *              245차 — **작물 84종 전부**에 그 작물의 일 · 병 · 벌레(사용자 「고추처럼 각 농작물에 대한 난이도를 추가해줘」)
 *
 * 고추를 본보기로 실제 재배 6단계를 작업으로 쪼갰다(사용자 조사 + 농진청 농사로).
 *  1. 파종 · 발아(2월) — 따뜻한 실내(25~30℃)의 육묘 트레이에 뿌린다 → 집 안 선반 `nursery` 칸.
 *  2. 육묘 · 가식 — 파종 2주쯤 본잎이 나오면 50구 트레이로 옮겨 심는다(`prick_out`). 70~90일 기르면 모종이 된다.
 *     텃밭 초보는 종묘사에서 모종을 사는 게 훨씬 수월하다(종묘사 = 238차 새 가게).
 *  3. 정식(4월 하순~5월 상순) — 늦서리가 끝나고 최저 기온 10℃ 이상일 때. 두둑 · 검은 비닐 멀칭(`ridge_mulch`) ·
 *     포기 사이 40~50cm · 심은 즉시 1.5m 지주(`stake`) · 자라는 대로 유인줄 2회(`tie`).
 *  4. 초기 생장(정식 후 30일) — 활착기 2주 물(`establishDays`) · 방아다리 첫 꽃 따기(`pinch_flower`) · 곁순 제거(`remove_suckers`).
 *  5. 개화 · 착과(6~7월) — 정식 15일 뒤 1차 웃거름, 이후 15~20일 간격(`topdress`) · 장마철 탄저병 · 역병 방제(비 전후 살균제 7~10일 ·
 *     아인산 7~14일 · 칼슘액비) · 총채벌레 · 진딧물(바이러스 매개충) 살충제.
 *  6. 수확 · 마감 — 풋고추(6월 말~) · 홍고추(7월 하순~ · 꼭지 끝까지 빨갛게) · 첫서리에 끝.
 *
 * 245차 — 다른 작물도 같은 뼈대로 그 작물의 실제 일을 표로 둔다(농진청 텃밭 가꾸기 · 작목별 재배 기술 요지).
 *  - 쉬운 작물은 한두 가지(솎아 주기 · 웃거름 · 김매기), 까다로운 작물일수록 일이 늘고 병 · 벌레가 붙는다 — 난이도가 손으로 느껴지게.
 *  - 날로 세는 일(심은 날 · 여러해살이는 올해 다시 올라온 날 기준) · **달력으로 세는 일**(`months` — 겨울 덮기 · 이른 봄 웃거름 ·
 *    가지치기 · 보리밟기) · **자람으로 세는 일**(`growth` — 배추 묶기 · 열매 솎기) · **거둘 때마다**(`afterPick` — 벤 뒤 웃거름).
 *  - 병 · 벌레 · 새 13종을 더했다(`DISEASE_DEFS`) — 병은 걷어 내기 · 살균제, 벌레는 벌레 잡기 · 방충망 · 살충제, 새는 새 그물.
 *  - 약 치기는 그 작물에 드는 병의 철(한 달 앞서 예방)에만 「할 일」이 된다 — 안 쳐도 벌은 없고, 벌은 병 자체다.
 *  - 놓친 일은 수확 · 품질을 조금씩 깎되 **아무것도 안 해도 거둔다**(238 원칙 「비료나 약이 아예 없어도 수확은 되게」).
 *
 * 수량 기준: 작물 DB의 칸당 수량은 **제대로 관리한 밭**(웃거름 · 지주 · 방제)의 값이다 — 안 하면 깎이고(사용자 요구 「비료나 약이 아예 없어도
 * 수확은 되게」 — 웃거름 없이 0.7배), 세 병이 다 번지면 한 번에 한 개 날까 말까로 떨어진다(`FarmSim.harvestCell`).
 */

import type {
  CareTaskDef, CareTaskId, CareWorkKind, CropCarePlan, CropDef, CropDisease, DiseaseDef,
} from '../types/Farming.js';

// ─────────────────────────────────────────────
// 이름 · 설명(ko/en — i18n 런타임 사전이 읽는다)
// ─────────────────────────────────────────────

/** 작업 이름 — 화면은 ` · `로 잇는다: 이름 안에 ` · `를 넣지 않는다(237차 규칙 — 한 항목이 둘로 읽힌다) */
export const CARE_TASK_KO: Record<CareTaskId, string> = {
  prick_out: '가식', ridge_mulch: '두둑과 멀칭', stake: '지주 세우기', tie: '유인줄 묶기', water_establish: '활착기 물 주기',
  pinch_flower: '첫 꽃 따기', remove_suckers: '곁순 따기', topdress: '웃거름', spray_fungicide: '살균제 치기',
  spray_phosphite: '아인산 치기', spray_calcium: '칼슘액비 치기', spray_insecticide: '살충제 치기', cull_diseased: '병든 것 걷어 내기',
  stevia_feed: '스테비아 발효액 주기',
  thin: '솎아 주기', weed: '김매기', hill_up: '북주기', net_cover: '방충망 씌우기', bird_net: '새 그물 치기', frost_cover: '부직포 덮기',
  straw_mulch: '짚 덮기', pinch_tip: '순지르기', remove_flower: '꽃대 따기', pollinate: '인공수분', thin_fruit: '열매 솎기',
  trellis: '유인망 치기', prune: '가지치기', acidify: '산도 맞추기', tread: '보리밟기', tie_head: '배추 묶기', remove_runner: '런너 따기',
  cover_dark: '검은 천 덮기', uncover_light: '빛 쬐기', mist: '분무', slit_bag: '배지 칼집 내기', water_flood: '물 대기',
  pick_pests: '벌레 잡기', strip_leaves: '아랫잎 따기',
  harden_off: '모종 굳히기',
  thresh: '털기', pick_pods: '꼬투리 따기', gather_bundle: '묶어 거두기', winnow: '키질',
};
export const CARE_TASK_EN: Record<CareTaskId, string> = {
  prick_out: 'Prick out', ridge_mulch: 'Ridge and mulch', stake: 'Stake', tie: 'Tie up', water_establish: 'Water in (establishment)',
  pinch_flower: 'Pinch first flower', remove_suckers: 'Remove suckers', topdress: 'Top-dress', spray_fungicide: 'Spray fungicide',
  spray_phosphite: 'Spray phosphite', spray_calcium: 'Spray calcium', spray_insecticide: 'Spray insecticide', cull_diseased: 'Cull diseased',
  stevia_feed: 'Feed stevia ferment',
  thin: 'Thin out', weed: 'Weed', hill_up: 'Hill up', net_cover: 'Lay insect mesh', bird_net: 'Put up a bird net', frost_cover: 'Lay frost fleece',
  straw_mulch: 'Mulch with straw', pinch_tip: 'Pinch out tips', remove_flower: 'Remove flower stalks', pollinate: 'Hand-pollinate', thin_fruit: 'Thin fruit',
  trellis: 'Put up trellis net', prune: 'Prune', acidify: 'Acidify the soil', tread: 'Tread the barley', tie_head: 'Tie the heads', remove_runner: 'Remove runners',
  cover_dark: 'Cover from light', uncover_light: 'Uncover to light', mist: 'Mist', slit_bag: 'Slit the bag', water_flood: 'Flood the furrows',
  pick_pests: 'Pick off pests', strip_leaves: 'Strip lower leaves',
  harden_off: 'Harden off seedlings',
  thresh: 'Thresh', pick_pods: 'Pick the pods', gather_bundle: 'Bundle and gather', winnow: 'Winnow',
};

/** 작업 장면 모양 → 사람 말(머리말) */
export const CARE_WORK_KO: Record<CareWorkKind, string> = {
  targets: '표시된 것을 하나씩 딴다', place: '표시된 자리에 차례로', tie: '띠 안에 들어올 때 묶는다',
  hold: '누르고 있다가 띠 안에서 뗀다', sprinkle: '포기 사이 표시된 자리에', tray: '싹을 넓은 트레이로 옮긴다',
  drag: '표시된 곳에서 포기 밑동까지 끌어 올린다', pair: '수꽃을 누른 뒤 암꽃을 누른다',
};
export const CARE_WORK_EN: Record<CareWorkKind, string> = {
  targets: 'Pick off each marked spot', place: 'Set each marked spot in order', tie: 'Tie when the marker is inside the band',
  hold: 'Hold, then release inside the band', sprinkle: 'Scatter on the marked spots between plants', tray: 'Move each seedling to the wide tray',
  drag: 'Drag from the marked spot up to the base of the plant', pair: 'Click a male flower, then a female flower',
};

export const DISEASE_KO: Record<CropDisease, string> = {
  blight: '역병', anthracnose: '탄저병', virus: '바이러스병',
  powdery_mildew: '흰가루병', downy_mildew: '노균병', soft_rot: '무름병', gray_mold: '잿빛곰팡이병', rust: '녹병', root_rot: '뿌리썩음병',
  green_mold: '푸른곰팡이병', caterpillar: '애벌레', flea_beetle: '벼룩잎벌레', aphid: '진딧물', stink_bug: '노린재', corn_borer: '조명나방', birds: '새',
};
export const DISEASE_EN: Record<CropDisease, string> = {
  blight: 'Phytophthora blight', anthracnose: 'Anthracnose', virus: 'Virus',
  powdery_mildew: 'Powdery mildew', downy_mildew: 'Downy mildew', soft_rot: 'Soft rot', gray_mold: 'Gray mold', rust: 'Rust', root_rot: 'Root rot',
  green_mold: 'Green mold', caterpillar: 'Caterpillars', flea_beetle: 'Flea beetles', aphid: 'Aphids', stink_bug: 'Stink bugs', corn_borer: 'Corn borer', birds: 'Birds',
};
/** 증상 한 줄(상세 · 텃밭 창) */
export const DISEASE_SYMPTOM_KO: Record<CropDisease, string> = {
  blight: '줄기 밑이 물에 데인 듯 썩고 포기가 시든다 — 장마철 다습 · 물빠짐 나쁜 밭',
  anthracnose: '열매에 둥근 반점이 생겨 썩는다 — 6~9월 고온다습 · 빗물로 번진다',
  virus: '잎에 모자이크 무늬 · 위축 · 반점 — 총채벌레 · 진딧물이 옮긴다',
  powdery_mildew: '잎에 밀가루를 뿌린 듯 흰 곰팡이가 앉고 잎이 누렇게 말라 간다 — 건조하고 일교차가 클 때',
  downy_mildew: '잎에 각진 노란 무늬가 생기고 뒷면에 잿빛 곰팡이가 핀다 — 서늘하고 비가 잦을 때',
  soft_rot: '밑동이 물러 썩고 고약한 냄새가 난다 — 물이 따뜻해지는 여름 · 상처로 든다',
  gray_mold: '꽃 · 열매에 잿빛 곰팡이가 피어 무른다 — 서늘하고 습한 봄 · 가을',
  rust: '잎에 주황빛 가루 반점이 돋고 잎끝부터 마른다 — 봄 · 가을 비 온 뒤',
  root_rot: '뿌리줄기가 물러 썩고 잎이 누렇게 시든다 — 장마철 물빠짐 나쁜 밭',
  green_mold: '배지에 푸른 곰팡이가 번져 버섯이 덜 나온다 — 덥고 공기가 고이면',
  caterpillar: '배추흰나비 · 배추좀나방 · 호랑나비 애벌레가 잎을 갉아 구멍을 낸다',
  flea_beetle: '작은 검은 벌레가 톡톡 튀며 어린잎에 바늘구멍을 숭숭 낸다 — 덥고 마른 날',
  aphid: '새순 · 잎 뒷면에 작은 벌레가 빼곡히 붙어 즙을 빨고 잎이 오그라든다',
  stink_bug: '꼬투리가 맺힐 때 노린재가 즙을 빨아 알이 쭉정이가 된다',
  corn_borer: '애벌레가 줄기 · 이삭 속을 파먹어 대가 꺾이고 알이 빈다',
  birds: '익어 가는 열매 · 이삭을 까치 · 직박구리가 쪼아 먹는다',
};
export const DISEASE_SYMPTOM_EN: Record<CropDisease, string> = {
  blight: 'Stem base rots as if scalded and the whole plant wilts — rainy-season damp, poorly drained beds',
  anthracnose: 'Round sunken spots rot the fruit — hot, humid June to September, spread by rain splash',
  virus: 'Mosaic patterns, stunting and spots on leaves — carried by thrips and aphids',
  powdery_mildew: 'A flour-like white mould coats the leaves, which yellow and dry out — dry spells with big day–night swings',
  downy_mildew: 'Angular yellow patches on top, grey fuzz underneath — cool, frequently wet weather',
  soft_rot: 'The base turns mushy and smells foul — summer, when the water warms, entering through wounds',
  gray_mold: 'Grey fuzz grows on flowers and fruit, which go soft — cool, damp spring and autumn',
  rust: 'Orange powdery pustules on the leaves, which dry back from the tips — after spring and autumn rain',
  root_rot: 'The rhizome rots soft and the leaves yellow and wilt — rainy season, poorly drained beds',
  green_mold: 'Green mould spreads over the block and fewer mushrooms come — when it is hot and the air stands still',
  caterpillar: 'Cabbage white, diamondback moth or swallowtail caterpillars chew holes in the leaves',
  flea_beetle: 'Tiny black beetles that hop when disturbed pepper young leaves with pinholes — hot, dry days',
  aphid: 'Tiny insects pack the shoots and leaf undersides, sucking sap until the leaves curl',
  stink_bug: 'Stink bugs suck the pods as they fill, leaving empty husks',
  corn_borer: 'Larvae tunnel through stalks and ears — stalks snap and kernels stay empty',
  birds: 'Magpies and bulbuls peck at ripening fruit and ears',
};
/** 어떻게 막나 · 고치나 */
export const DISEASE_CONTROL_KO: Record<CropDisease, string> = {
  blight: '두둑을 높이고 멀칭 · 비 전후 살균제 · 아인산 7~14일 간격 · 심하면 포기를 뽑는다',
  anthracnose: '병든 열매를 바로 따낸다 · 7~10일 간격 살균제 · 멀칭으로 흙이 튀지 않게 · 칼슘액비',
  virus: '총채벌레 · 진딧물을 살충제로 막는다 · 병든 포기는 뽑아 낸다',
  powdery_mildew: '병든 잎을 따낸다 · 살균제를 7~10일 간격으로 · 포기 사이에 바람이 통하게',
  downy_mildew: '병든 잎을 따낸다 · 비 오기 전후 살균제 · 물빠짐을 좋게',
  soft_rot: '물러진 포기는 바로 뽑아 낸다 · 상처를 내지 않는다 · 물을 차게 지킨다',
  gray_mold: '곰팡이 핀 꽃 · 열매를 따낸다 · 짚을 깔아 열매가 흙에 닿지 않게 · 살균제',
  rust: '병든 잎을 걷어 낸다 · 살균제 · 웃거름을 너무 많이 주지 않는다',
  root_rot: '두둑을 높여 물빠짐을 좋게 · 썩은 포기는 뽑아 낸다',
  green_mold: '곰팡이 핀 곳을 도려낸다 · 환기 · 너무 덥지 않게',
  caterpillar: '방충망을 씌운다 · 잎 뒷면의 애벌레 · 알을 손으로 잡는다 · 살충제',
  flea_beetle: '씨를 뿌린 날 방충망을 씌운다 · 살충제 — 손으로는 잡기 어렵다',
  aphid: '물을 세게 뿌려 떨어낸다 · 붙은 잎을 딴다 · 살충제',
  stink_bug: '꼬투리가 맺힐 때 보이는 대로 잡는다 · 살충제',
  corn_borer: '6~7월 수꽃 이삭이 패기 전에 살충제를 친다',
  birds: '익기 전에 새 그물을 씌운다 · 옥수수는 이삭을 망으로 감싼다',
};
export const DISEASE_CONTROL_EN: Record<CropDisease, string> = {
  blight: 'Raise the ridge and mulch, spray fungicide around rain, phosphite every 7–14 days, pull badly hit plants',
  anthracnose: 'Pick diseased fruit at once, fungicide every 7–10 days, mulch against soil splash, calcium foliar feed',
  virus: 'Keep thrips and aphids off with insecticide, pull infected plants',
  powdery_mildew: 'Pick off infected leaves, fungicide every 7–10 days, keep air moving between plants',
  downy_mildew: 'Pick off infected leaves, fungicide around rain, improve drainage',
  soft_rot: 'Pull mushy plants at once, avoid wounding them, keep the water cold',
  gray_mold: 'Pick mouldy flowers and fruit, lay straw so fruit stays off the soil, fungicide',
  rust: 'Clear infected leaves, fungicide, go easy on the top-dressing',
  root_rot: 'Raise the ridges for drainage, pull rotten plants',
  green_mold: 'Cut out the mouldy patch, ventilate, keep it from getting hot',
  caterpillar: 'Cover with insect mesh, pick caterpillars and eggs off the leaf undersides, insecticide',
  flea_beetle: 'Mesh the bed on sowing day, insecticide — they are too quick to pick off',
  aphid: 'Hose them off with a hard spray, pick infested leaves, insecticide',
  stink_bug: 'Pick them off as the pods fill, insecticide',
  corn_borer: 'Spray insecticide in June–July, before the tassels emerge',
  birds: 'Net the plants before the fruit ripens; on corn, bag the ears',
};

/**
 * 245차 — 병 · 벌레 · 새의 수치. 역병 · 탄저병 · 바이러스병은 238차 값 그대로(시험이 지킨다).
 * 피해: 역병 · 무름병 · 뿌리썩음병은 포기를 죽이고(섬), 나머지는 거둘 때 수량을 깎는다(`yieldLoss` × 심한 정도).
 */
export const DISEASE_DEFS: Readonly<Record<CropDisease, DiseaseDef>> = {
  blight: { kind: 'disease', season: [6, 7, 8, 9], daily: { on: 0.025, off: 0.002 }, spread: 0.07, wet: 2, yieldLoss: 0, standLoss: 0.03, qualityLoss: 0.003, greenhouse: 0.6, cull: 0.3, cullStand: 0.08, soggy: 1.4 },
  anthracnose: { kind: 'disease', season: [6, 7, 8, 9], daily: { on: 0.03, off: 0.003 }, spread: 0.05, wet: 2, yieldLoss: 0.6, qualityLoss: 0.003, greenhouse: 0.3, cull: 0.4, cullStand: 0 },
  virus: { kind: 'disease', season: [5, 6, 7, 8, 9], daily: { on: 0.012, off: 0.002 }, spread: 0.04, wet: 1, yieldLoss: 0.5, qualityLoss: 0.003, greenhouse: 1, cull: 0.5, cullStand: 0.12 },
  powdery_mildew: { kind: 'disease', season: [5, 6, 7, 8, 9, 10], daily: { on: 0.03, off: 0.004 }, spread: 0.05, wet: 0.8, yieldLoss: 0.4, qualityLoss: 0.004, greenhouse: 1.3, cull: 0.35, cullStand: 0 },
  downy_mildew: { kind: 'disease', season: [4, 5, 6, 7, 9, 10], daily: { on: 0.025, off: 0.003 }, spread: 0.06, wet: 2, yieldLoss: 0.45, qualityLoss: 0.004, greenhouse: 0.7, cull: 0.35, cullStand: 0 },
  soft_rot: { kind: 'disease', season: [7, 8, 9], daily: { on: 0.02, off: 0.001 }, spread: 0.08, wet: 2, yieldLoss: 0, standLoss: 0.04, qualityLoss: 0.003, greenhouse: 0.8, cull: 0.3, cullStand: 0.1, soggy: 1.3 },
  gray_mold: { kind: 'disease', season: [3, 4, 5, 10, 11], daily: { on: 0.025, off: 0.003 }, spread: 0.06, wet: 2, yieldLoss: 0.5, qualityLoss: 0.004, greenhouse: 1.4, cull: 0.4, cullStand: 0 },
  rust: { kind: 'disease', season: [4, 5, 6, 9, 10], daily: { on: 0.02, off: 0.002 }, spread: 0.04, wet: 1.5, yieldLoss: 0.35, qualityLoss: 0.004, greenhouse: 0.8, cull: 0.3, cullStand: 0 },
  root_rot: { kind: 'disease', season: [6, 7, 8, 9], daily: { on: 0.018, off: 0.001 }, spread: 0.05, wet: 1.8, yieldLoss: 0, standLoss: 0.035, qualityLoss: 0.002, greenhouse: 0.8, cull: 0.25, cullStand: 0.1, soggy: 1.6 },
  green_mold: { kind: 'disease', season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], daily: { on: 0.012, off: 0.012 }, spread: 0.06, wet: 1, yieldLoss: 0.6, qualityLoss: 0.004, greenhouse: 1, cull: 0.5, cullStand: 0.05, indoor: true },
  caterpillar: { kind: 'pest', season: [4, 5, 6, 8, 9, 10], daily: { on: 0.04, off: 0.004 }, spread: 0.06, wet: 1, yieldLoss: 0.3, qualityLoss: 0.006, greenhouse: 0.4, cull: 0.45, cullStand: 0 },
  flea_beetle: { kind: 'pest', season: [4, 5, 6, 7, 8, 9], daily: { on: 0.04, off: 0.004 }, spread: 0.05, wet: 0.8, yieldLoss: 0.15, qualityLoss: 0.006, greenhouse: 0.6, cull: 0.15, cullStand: 0 },
  aphid: { kind: 'pest', season: [4, 5, 6, 9, 10], daily: { on: 0.035, off: 0.004 }, spread: 0.06, wet: 0.7, yieldLoss: 0.25, qualityLoss: 0.005, greenhouse: 1.2, cull: 0.35, cullStand: 0 },
  stink_bug: { kind: 'pest', season: [7, 8, 9], daily: { on: 0.035, off: 0.002 }, spread: 0.05, wet: 1, yieldLoss: 0.4, qualityLoss: 0.003, greenhouse: 0.7, cull: 0.3, cullStand: 0 },
  corn_borer: { kind: 'pest', season: [6, 7, 8], daily: { on: 0.035, off: 0.003 }, spread: 0.05, wet: 1, yieldLoss: 0.4, qualityLoss: 0.004, greenhouse: 0.8, cull: 0.3, cullStand: 0 },
  birds: { kind: 'bird', season: [4, 5, 6, 7, 8, 9, 10], daily: { on: 0.06, off: 0.01 }, spread: 0.08, wet: 1, yieldLoss: 0.5, qualityLoss: 0, greenhouse: 0.2, cull: 0, cullStand: 0, ripeOnly: true },
};

/** 병해가 드는 철(달) — `DISEASE_DEFS`에서 읽는다(238차 표 이름 유지) */
export const DISEASE_SEASON: Readonly<Record<CropDisease, readonly number[]>> = Object.fromEntries(
  (Object.keys(DISEASE_DEFS) as CropDisease[]).map((d) => [d, DISEASE_DEFS[d].season]),
) as Record<CropDisease, readonly number[]>;
/** 238차 — 고추 방제 철(5~9월). 245차부터 약 치기 철은 작물마다 `riskMonthsOf`(병이 드는 철 + 한 달 앞 예방) */
export const RISK_SEASON: readonly number[] = [5, 6, 7, 8, 9];
/** 예방 살포는 병이 드는 철보다 이만큼(달) 먼저 시작한다 */
export const PREVENT_LEAD_MONTHS = 1;

// ─────────────────────────────────────────────
// 농자재 아이템 id(종묘사가 판다 — `FARM_SUPPLIES`에 같은 id로 등록)
// ─────────────────────────────────────────────

export const TRAY_ID = 'farm_tray';
export const STAKE_ID = 'farm_stake';
export const TWINE_ID = 'farm_twine';
export const MULCH_ID = 'farm_mulch';
export const FERT_ID = 'farm_fert';
export const FUNGICIDE_ID = 'farm_fungicide';
export const PHOSPHITE_ID = 'farm_phosphite';
export const CALCIUM_ID = 'farm_calcium';
export const INSECTICIDE_ID = 'farm_insecticide';
/** 241차 — 스테비아 발효액(스테비아 토마토 전용) */
export const STEVIA_ID = 'farm_stevia';
/** 245차 — 호미(생활용품점 · 땅 일구기와 같은 도구) · 방충망 · 새 그물 · 부직포 · 볏짚 · 오이망 · 피트모스 · 전정가위 */
export const FARM_HOMI_ID = 'farm_homi';
export const NET_ID = 'farm_insect_net';
export const BIRD_NET_ID = 'farm_bird_net';
export const FLEECE_ID = 'farm_fleece';
export const STRAW_ID = 'farm_straw';
/** 284차 — 보릿짚(밭 부산물 · g) — 볏짚 대신 짚 덮기 */
export const BARLEY_STRAW_ID = 'res_barley_straw';
/** 284차 — 깻순(들깨 · 깻잎 순지르기에서 나오는 새순 — 나물) */
export const PERILLA_SHOOT_ID = 'crop_perilla_shoot';
export const TRELLIS_ID = 'farm_trellis_net';
export const PEAT_ID = 'farm_peat';
export const SHEARS_ID = 'farm_shears';

// ─────────────────────────────────────────────
// 작업 정의(공용 조각)
// ─────────────────────────────────────────────

type How = [string, string];

const stake = (plants: number): CareTaskDef => ({
  id: 'stake', dayWindow: [0, 14], needs: [{ itemId: STAKE_ID, qty: plants }, { itemId: TWINE_ID, qty: 1 }],
  work: 'place', seconds: 10, fatigue: 6,
  missed: { lodging: true },
  howKo: '심은 즉시 1.5m 지주를 포기마다 세우고 줄기를 끈으로 느슨하게 묶는다. 안 세우면 비바람에 쓰러진다.',
  howEn: 'Right after planting, drive a 1.5m stake by each plant and tie the stem loosely. Unstaked plants blow over in wind and rain.',
});
const tie: CareTaskDef = {
  id: 'tie', dayWindow: [25, 45], repeat: { everyDays: 25, times: 1 }, needs: [{ itemId: TWINE_ID, qty: 1 }],
  work: 'tie', seconds: 7, fatigue: 3,
  missed: { yieldMult: 0.95 },
  howKo: '키가 크는 대로 지주에 유인줄을 한 단씩 더 묶는다 — 열매가 달리면 가지가 처진다.',
  howEn: 'As the plant grows, add a tier of string to the stake — fruit-laden branches sag otherwise.',
};
const topdress = (times: number): CareTaskDef => ({
  id: 'topdress', dayWindow: [15, 25], repeat: { everyDays: 18, times }, needs: [{ itemId: FERT_ID, qty: 1 }],
  work: 'sprinkle', seconds: 6, fatigue: 3,
  effect: { quality: 0.02 }, missed: { yieldMult: 0.93 },
  howKo: '정식 15일 뒤 1차, 이후 15~20일 간격으로 포기 사이에 복합비료를 준다. 영양분을 많이 먹는 작물이다.',
  howEn: 'First feed 15 days after transplanting, then every 15–20 days between plants. A hungry crop.',
});
/** 245차 — 작물마다 때 · 횟수 · 말이 다른 웃거름(날 · 달력 · 벨 때마다) */
const feed = (o: { window?: [number, number]; repeat?: CareTaskDef['repeat']; months?: number[]; afterPick?: boolean; missed?: number; how: How }): CareTaskDef => ({
  id: 'topdress', dayWindow: o.window ?? [0, 0], ...(o.repeat ? { repeat: o.repeat } : {}), ...(o.months ? { months: o.months } : {}),
  ...(o.afterPick ? { afterPick: true } : {}), needs: [{ itemId: FERT_ID, qty: 1 }],
  work: 'sprinkle', seconds: 6, fatigue: 3,
  effect: { quality: 0.02 }, missed: { yieldMult: o.missed ?? 0.94 },
  howKo: o.how[0], howEn: o.how[1],
});
const fungicide: CareTaskDef = {
  id: 'spray_fungicide', dayWindow: [0, 200], repeat: { everyDays: 9, times: 24 }, needs: [{ itemId: FUNGICIDE_ID, qty: 1 }],
  work: 'hold', seconds: 8, fatigue: 3, only: 'riskSeason',
  effect: {
    protect: [
      { disease: 'anthracnose', days: 10, mult: 0.25 }, { disease: 'blight', days: 10, mult: 0.35 },
      { disease: 'powdery_mildew', days: 10, mult: 0.3 }, { disease: 'downy_mildew', days: 10, mult: 0.3 },
      { disease: 'gray_mold', days: 10, mult: 0.3 }, { disease: 'rust', days: 10, mult: 0.3 },
      { disease: 'soft_rot', days: 10, mult: 0.5 }, { disease: 'root_rot', days: 10, mult: 0.5 },
    ],
  },
  howKo: '병이 드는 철에는 비 오기 전후로 7~10일 간격 살균제를 친다 — 들기 전에 막는 약이다.',
  howEn: 'In disease season, spray fungicide every 7–10 days around rain — it prevents rather than cures.',
};
const phosphite: CareTaskDef = {
  id: 'spray_phosphite', dayWindow: [0, 200], repeat: { everyDays: 12, times: 16 }, needs: [{ itemId: PHOSPHITE_ID, qty: 1 }],
  work: 'hold', seconds: 8, fatigue: 3, only: 'riskSeason',
  effect: { protect: [{ disease: 'blight', days: 14, mult: 0.15 }] },
  howKo: '아인산을 7~14일 간격으로 처리하면 역병이 거의 들지 않는다.',
  howEn: 'Phosphite every 7–14 days keeps blight almost entirely away.',
};
const calcium: CareTaskDef = {
  id: 'spray_calcium', dayWindow: [0, 200], repeat: { everyDays: 14, times: 14 }, needs: [{ itemId: CALCIUM_ID, qty: 1 }],
  work: 'hold', seconds: 7, fatigue: 2, only: 'riskSeason',
  effect: { quality: 0.03, protect: [{ disease: 'anthracnose', days: 14, mult: 0.7 }] },
  howKo: '칼슘액비를 잎에 뿌리면 열매 껍질이 단단해져 탄저병이 덜 들고 품질이 오른다.',
  howEn: 'Calcium foliar feed hardens the fruit skin — less anthracnose, better quality.',
};
const insecticide: CareTaskDef = {
  id: 'spray_insecticide', dayWindow: [0, 200], repeat: { everyDays: 12, times: 16 }, needs: [{ itemId: INSECTICIDE_ID, qty: 1 }],
  work: 'hold', seconds: 8, fatigue: 3, only: 'riskSeason',
  effect: {
    protect: [
      { disease: 'virus', days: 12, mult: 0.2 }, { disease: 'aphid', days: 12, mult: 0.2 }, { disease: 'caterpillar', days: 12, mult: 0.25 },
      { disease: 'flea_beetle', days: 12, mult: 0.3 }, { disease: 'stink_bug', days: 12, mult: 0.3 }, { disease: 'corn_borer', days: 12, mult: 0.3 },
    ],
  },
  howKo: '벌레가 꾀는 철에 열흘 남짓 간격으로 살충제를 친다 — 총채벌레 · 진딧물은 바이러스병도 옮긴다.',
  howEn: 'In pest season, spray insecticide every ten days or so — thrips and aphids carry viruses as well.',
};
const cull: CareTaskDef = {
  id: 'cull_diseased', dayWindow: [0, 400], repeat: { everyDays: 3, times: 120 },
  work: 'targets', seconds: 6, fatigue: 2, only: 'diseased',
  howKo: '병든 열매는 바로 따서 버리고, 시든 포기는 뽑아 낸다 — 두면 옆으로 번진다.',
  howEn: 'Pick and bin diseased fruit at once and pull wilted plants — left alone, it spreads.',
};
/** 245차 — 이 병들이 들었을 때만 뜨는 걷어 내기(잎채소 · 버섯 · 뿌리줄기 — 말도 그 작물에 맞게) */
const cullFor = (onlyFor: CropDisease[], how?: How): CareTaskDef => ({
  ...cull, onlyFor,
  howKo: how?.[0] ?? '병든 잎 · 열매를 바로 따서 버리고, 심하게 상한 포기는 뽑아 낸다 — 두면 옆으로 번진다.',
  howEn: how?.[1] ?? 'Pick and bin diseased leaves and fruit at once and pull badly hit plants — left alone, it spreads.',
});
/** 245차 — 벌레 잡기(애벌레 · 진딧물 · 노린재 · 벼룩잎벌레) — 들었을 때만 · 사흘 간격 */
const pickPests = (onlyFor: CropDisease[], how?: How): CareTaskDef => ({
  id: 'pick_pests', dayWindow: [0, 400], repeat: { everyDays: 3, times: 120 },
  work: 'targets', seconds: 6, fatigue: 2, only: 'diseased', onlyFor,
  howKo: how?.[0] ?? '잎 뒷면 · 새순에 붙은 벌레와 알을 손으로 잡아낸다 — 진딧물은 물을 세게 뿌려 떨어낸다.',
  howEn: how?.[1] ?? 'Pick pests and eggs off the leaf undersides and shoots by hand — knock aphids off with a hard spray of water.',
});
const mulch: CareTaskDef = {
  id: 'ridge_mulch', dayWindow: [0, 7], needs: [{ itemId: MULCH_ID, qty: 1 }],
  work: 'place', seconds: 8, fatigue: 4,
  effect: { diseaseMult: { blight: 0.6, anthracnose: 0.7 } },
  howKo: '물빠짐이 좋게 두둑을 높이고 검은 비닐로 덮는다 — 흙이 튀지 않아 탄저병 · 역병이 덜 든다.',
  howEn: 'Raise the ridge for drainage and cover with black plastic — no soil splash, less anthracnose and blight.',
};
/** 245차 — 작물마다 멀칭의 뜻이 다르다(참외 · 수박 = 땅을 데우고 열매가 흙에 안 닿게 · 고구마 = 잡초) */
const mulchFor = (effect: CareTaskDef['effect'], how: How): CareTaskDef => ({ ...mulch, effect, howKo: how[0], howEn: how[1] });
/** 241차 — 스테비아 발효액(정식 3주 뒤부터 2주 간격 4회 — 거르면 단맛이 오르지 않아 등급이 내려간다) */
const steviaFeed: CareTaskDef = {
  id: 'stevia_feed', dayWindow: [20, 34], repeat: { everyDays: 14, times: 3 }, needs: [{ itemId: STEVIA_ID, qty: 1 }],
  work: 'sprinkle', seconds: 7, fatigue: 3,
  effect: { quality: 0.03 }, missed: { quality: 0.08 },
  howKo: '정식 3주 뒤부터 2주 간격으로 스테비아 발효액을 포기 둘레 흙에 붓고 잎에도 뿌린다 — 거르면 단맛이 오르지 않는다.',
  howEn: 'From three weeks after transplanting, every two weeks pour stevia ferment round the plant and mist the leaves — skip it and the fruit never sweetens.',
};
const suckers = (window: [number, number], how?: How): CareTaskDef => ({
  id: 'remove_suckers', dayWindow: window, repeat: { everyDays: 10, times: 1 },
  work: 'targets', seconds: 8, fatigue: 3,
  missed: { yieldMult: 0.95, diseaseMult: { anthracnose: 1.3 } },
  howKo: how?.[0] ?? '방아다리 아래 잎겨드랑이에서 나오는 곁순을 모두 딴다 — 바람이 통하고 위로 자란다.',
  howEn: how?.[1] ?? 'Remove every sucker below the first fork — better airflow, growth goes upward.',
});

// ── 245차 — 새 일 ──

/** 솎아 주기 — 씨앗으로 뿌린 칸만(모종은 이미 한 포기씩이다) */
const thin = (window: [number, number], how?: How, repeat?: CareTaskDef['repeat']): CareTaskDef => ({
  id: 'thin', dayWindow: window, ...(repeat ? { repeat } : {}), startKinds: ['seed'],
  work: 'targets', seconds: 6, fatigue: 2,
  missed: { yieldMult: 0.9, quality: 0.04 },
  howKo: how?.[0] ?? '싹이 촘촘하면 약한 것을 뽑아 포기 사이를 띄운다 — 안 솎으면 서로 치여 가늘고 작게 자란다.',
  howEn: how?.[1] ?? 'Where seedlings crowd, pull the weak ones to space the rest — unthinned, they jostle and stay thin and small.',
});
/** 김매기 — 호미가 있어야 한다. 날 · 달력 어느 쪽이든 */
const weed = (o: { window?: [number, number]; months?: number[]; waivedBy?: CareTaskId; missed?: number; how?: How } = {}): CareTaskDef => ({
  id: 'weed', dayWindow: o.window ?? [0, 0], ...(o.months ? { months: o.months } : {}), ...(o.waivedBy ? { waivedBy: o.waivedBy } : {}),
  tools: [FARM_HOMI_ID], work: 'targets', seconds: 8, fatigue: 4,
  missed: { yieldMult: o.missed ?? 0.92 },
  howKo: o.how?.[0] ?? '호미로 잡초를 긁어 뽑는다 — 어릴 때 잡초에 치이면 크지 못한다.',
  howEn: o.how?.[1] ?? 'Scrape out the weeds with the homi — smothered while young, the crop never catches up.',
});
/** 북주기 — 호미로 고랑의 흙을 포기 밑동에 끌어 올린다 */
const hillUp = (window: [number, number], how: How, repeat?: CareTaskDef['repeat'], missed: { yieldMult?: number; quality?: number } = { yieldMult: 0.92, quality: 0.04 }): CareTaskDef => ({
  id: 'hill_up', dayWindow: window, ...(repeat ? { repeat } : {}), tools: [FARM_HOMI_ID],
  work: 'drag', seconds: 8, fatigue: 5, missed,
  howKo: how[0], howEn: how[1],
});
/** 방충망 — 배추과의 애벌레 · 벼룩잎벌레를 작기 내내 막는다 */
const netCover = (diseaseMult: Partial<Record<CropDisease, number>> = { caterpillar: 0.2, flea_beetle: 0.15 }): CareTaskDef => ({
  id: 'net_cover', dayWindow: [0, 7], needs: [{ itemId: NET_ID, qty: 1 }],
  work: 'place', seconds: 8, fatigue: 3,
  effect: { diseaseMult },
  howKo: '씨를 뿌리거나 심은 날 활대를 꽂고 방충망(한랭사)을 덮어 가장자리를 흙으로 묻는다 — 나비 · 벼룩잎벌레가 들어오지 못한다.',
  howEn: 'On sowing or planting day, push in hoops and drape insect mesh, burying the edges — butterflies and flea beetles cannot get in.',
});
/** 새 그물 — 익을 무렵(블루베리 · 옥수수 이삭) 또는 막 뿌린 씨앗(콩 · 땅콩) */
const birdNet = (o: { window?: [number, number]; months?: number[]; growth?: [number, number]; effect?: CareTaskDef['effect']; missed?: CareTaskDef['missed']; how: How }): CareTaskDef => ({
  id: 'bird_net', dayWindow: o.window ?? [0, 0], ...(o.months ? { months: o.months } : {}), ...(o.growth ? { growth: o.growth } : {}),
  needs: [{ itemId: BIRD_NET_ID, qty: 1 }], work: 'place', seconds: 7, fatigue: 3,
  ...(o.effect ? { effect: o.effect } : {}), ...(o.missed ? { missed: o.missed } : {}),
  howKo: o.how[0], howEn: o.how[1],
});
/** 부직포 덮기 — 겨울나기(달력) */
const frostCover = (months: number[], how?: How): CareTaskDef => ({
  id: 'frost_cover', dayWindow: [0, 0], months, needs: [{ itemId: FLEECE_ID, qty: 1 }],
  work: 'place', seconds: 7, fatigue: 3,
  missed: { yieldMult: 0.9, quality: 0.05 },
  howKo: how?.[0] ?? '된추위가 오기 전에 부직포를 덮고 가장자리를 눌러 둔다 — 안 덮으면 잎끝이 얼고 봄에 늦게 큰다.',
  howEn: how?.[1] ?? 'Before the hard cold, lay frost fleece and weigh down the edges — uncovered, the leaf tips freeze and spring growth lags.',
});
/** 짚 덮기 — 겨울 덮기(달력) · 마름 막기(날) · 열매 받침(달력) */
const strawMulch = (o: { window?: [number, number]; months?: number[]; effect?: CareTaskDef['effect']; missed?: CareTaskDef['missed']; how: How }): CareTaskDef => ({
  id: 'straw_mulch', dayWindow: o.window ?? [0, 0], ...(o.months ? { months: o.months } : {}),
  // 284차 — 보릿짚 500g이 볏짚 한 칸 분을 대신한다(보리를 털고 남은 짚)
  needs: [{ itemId: STRAW_ID, qty: 1, alt: [{ itemId: BARLEY_STRAW_ID, qty: 500 }] }], work: 'place', seconds: 7, fatigue: 3,
  ...(o.effect ? { effect: o.effect } : {}), missed: o.missed ?? { yieldMult: 0.93 },
  howKo: o.how[0], howEn: o.how[1],
});
const pinchTip = (window: [number, number], how: How, missedYield = 0.93): CareTaskDef => ({
  id: 'pinch_tip', dayWindow: window, work: 'targets', seconds: 6, fatigue: 2,
  missed: { yieldMult: missedYield },
  howKo: how[0], howEn: how[1],
});
const removeFlower = (o: { window?: [number, number]; repeat?: CareTaskDef['repeat']; months?: number[]; missed?: CareTaskDef['missed']; how: How }): CareTaskDef => ({
  id: 'remove_flower', dayWindow: o.window ?? [0, 0], ...(o.repeat ? { repeat: o.repeat } : {}), ...(o.months ? { months: o.months } : {}),
  work: 'targets', seconds: 5, fatigue: 2,
  missed: o.missed ?? { quality: 0.06 },
  howKo: o.how[0], howEn: o.how[1],
});
const pollinate = (window: [number, number], repeat: CareTaskDef['repeat'], how: How): CareTaskDef => ({
  id: 'pollinate', dayWindow: window, repeat, work: 'pair', seconds: 8, fatigue: 2,
  missed: { yieldMult: 0.88 },
  howKo: how[0], howEn: how[1],
});
const thinFruit = (growth: [number, number], how: How): CareTaskDef => ({
  id: 'thin_fruit', dayWindow: [0, 0], growth, work: 'targets', seconds: 6, fatigue: 2,
  effect: { quality: 0.05 }, missed: { quality: 0.08 },
  howKo: how[0], howEn: how[1],
});
/** 유인망 — 지주(포기 수)와 오이망 · 안 치면 덩굴이 땅을 기어 병이 잘 든다 */
const trellis = (plants: number, how: How): CareTaskDef => ({
  id: 'trellis', dayWindow: [0, 10], needs: [{ itemId: STAKE_ID, qty: Math.max(1, plants) }, { itemId: TRELLIS_ID, qty: 1 }],
  work: 'place', seconds: 10, fatigue: 6,
  missed: { yieldMult: 0.85, diseaseMult: { powdery_mildew: 1.3, downy_mildew: 1.3 } },
  howKo: how[0], howEn: how[1],
});
const prune = (months: number[], how: How): CareTaskDef => ({
  id: 'prune', dayWindow: [0, 0], months, tools: [SHEARS_ID], work: 'targets', seconds: 8, fatigue: 3,
  missed: { yieldMult: 0.9, quality: 0.04 },
  howKo: how[0], howEn: how[1],
});
const acidify: CareTaskDef = {
  id: 'acidify', dayWindow: [0, 0], months: [3, 4], needs: [{ itemId: PEAT_ID, qty: 1 }],
  work: 'sprinkle', seconds: 7, fatigue: 3,
  effect: { quality: 0.03 }, missed: { yieldMult: 0.85, quality: 0.06 },
  howKo: '봄마다 포기 둘레에 피트모스를 섞어 흙을 산성(pH 4.5~5.5)으로 맞춘다 — 산도가 오르면 잎이 누렇게 뜨고 열매가 잘다.',
  howEn: 'Each spring, work peat moss round the plant to keep the soil acid (pH 4.5–5.5) — as the pH climbs, leaves yellow and berries stay small.',
};
const tread: CareTaskDef = {
  id: 'tread', dayWindow: [0, 0], months: [2, 3], work: 'place', seconds: 8, fatigue: 4,
  missed: { yieldMult: 0.88 },
  howKo: '서릿발에 들뜬 보리 포기를 줄을 따라 꾹꾹 밟아 뿌리를 흙에 붙인다 — 안 밟으면 얼어 죽는 포기가 늘고 웃자란다.',
  howEn: 'Walk the rows pressing down barley heaved by frost so the roots meet the soil again — skip it and more plants die of cold or grow leggy.',
};
const tieHead: CareTaskDef = {
  id: 'tie_head', dayWindow: [0, 0], growth: [0.7, 0.95], needs: [{ itemId: TWINE_ID, qty: 1 }],
  work: 'tie', seconds: 6, fatigue: 2,
  effect: { quality: 0.03 }, missed: { quality: 0.06 },
  howKo: '속이 차기 시작하면 겉잎을 모아 끈으로 묶는다 — 속이 단단해지고 첫추위에 속잎이 얼지 않는다.',
  howEn: 'Once the heart starts to fill, gather the outer leaves and tie them — a firmer head, and the heart is safe from the first cold.',
};
const removeRunner: CareTaskDef = {
  id: 'remove_runner', dayWindow: [0, 0], months: [4, 5], work: 'targets', seconds: 6, fatigue: 2,
  missed: { yieldMult: 0.92 },
  howKo: '열매가 달릴 때 뻗어 나오는 런너(기는줄기)를 딴다 — 양분이 열매로 간다.',
  howEn: 'Snip off the runners that shoot out while the fruit sets — the plant’s strength goes into the berries.',
};
const coverDark: CareTaskDef = {
  id: 'cover_dark', dayWindow: [0, 1], work: 'place', seconds: 4, fatigue: 1,
  missed: { quality: 0.12 },
  howKo: '앉힌 날 시루를 검은 천으로 덮는다 — 빛을 보면 머리가 파래지고 비린 맛이 난다.',
  howEn: 'Cover the jar with black cloth on day one — in the light the heads turn green and taste grassy.',
};
const uncoverLight: CareTaskDef = {
  id: 'uncover_light', dayWindow: [2, 4], work: 'place', seconds: 4, fatigue: 1,
  missed: { quality: 0.1 },
  howKo: '싹이 트면 덮개를 걷고 밝은 창가에 둔다 — 늦으면 줄기만 웃자라 힘이 없다.',
  howEn: 'Once they sprout, lift the cover and set them by a bright window — leave it late and they stretch weak and spindly.',
};
const slitBag: CareTaskDef = {
  id: 'slit_bag', dayWindow: [0, 2], work: 'targets', seconds: 5, fatigue: 1,
  missed: { yieldMult: 0.85 },
  howKo: '배지 봉지에 X자로 칼집을 낸다 — 버섯이 그 자리로 올라온다. 안 내면 봉지 안에서 비뚤게 자란다.',
  howEn: 'Cut X-shaped slits in the grow bag — the mushrooms come out through them. Without slits they grow crooked inside the bag.',
};
const mist = (window: [number, number], every: number, times: number): CareTaskDef => ({
  id: 'mist', dayWindow: window, repeat: { everyDays: every, times }, work: 'hold', seconds: 5, fatigue: 1,
  effect: { water: true }, missed: { yieldMult: 0.98, quality: 0.02 },
  howKo: '분무기로 배지 둘레에 물을 뿜어 습도를 지킨다 — 마르면 갓이 갈라지고 덜 자란다. 너무 적셔도 곰팡이가 핀다.',
  howEn: 'Mist round the block to keep the air humid — dry air cracks the caps and stunts them, but soaking it invites mould.',
});
const waterFlood = (o: { window?: [number, number]; repeat?: CareTaskDef['repeat']; months?: number[]; how: How }): CareTaskDef => ({
  id: 'water_flood', dayWindow: o.window ?? [0, 0], ...(o.repeat ? { repeat: o.repeat } : {}), ...(o.months ? { months: o.months } : {}),
  work: 'hold', seconds: 6, fatigue: 3,
  effect: { water: true }, missed: { yieldMult: 0.95, quality: 0.04 },
  howKo: o.how[0], howEn: o.how[1],
});
const stripLeaves: CareTaskDef = {
  id: 'strip_leaves', dayWindow: [45, 55], repeat: { everyDays: 12, times: 3 }, work: 'targets', seconds: 6, fatigue: 2,
  missed: { yieldMult: 0.95 },
  howKo: '열매를 딴 마디 아래의 잎을 따 준다 — 바람이 통하고 새 꼬투리가 잘 달린다.',
  howEn: 'Strip the leaves below each node you have picked — air moves through and new pods keep setting.',
};

// ─────────────────────────────────────────────
// 247차 — 거둔 뒤 밭 손질의 작업 장면(관리 표 밖 — 말린 칸에서 연다)
// ─────────────────────────────────────────────

/** 털기 · 꼬투리 따기 · 묶어 거두기 · 키질 — 작업 장면이 쓰는 정의(품은 `FARM_LABOR`가 따로 센다 · 여기 fatigue는 0) */
export const PROCESS_WORK_DEFS: Readonly<Record<'thresh' | 'pick_pods' | 'gather_bundle' | 'winnow', CareTaskDef>> = {
  thresh: {
    id: 'thresh', dayWindow: [0, 0], work: 'targets', seconds: 8, fatigue: 0,
    howKo: '깔개 위에 마른 단을 눕히고 도리깨 · 막대로 내리친다 — 단마다 서너 번 쳐야 알이 다 떨어진다.',
    howEn: 'Lay the dry sheaves on a tarp and beat them with a flail or stick — three or four blows per sheaf shake all the grain out.',
  },
  pick_pods: {
    id: 'pick_pods', dayWindow: [0, 0], work: 'targets', seconds: 8, fatigue: 0,
    howKo: '뒤집어 말린 포기에서 여문 꼬투리를 하나씩 딴다 — 덜 여문 것은 남긴다.',
    howEn: 'Pick the filled pods one by one off the plants you dried upside down — leave the empty ones.',
  },
  gather_bundle: {
    id: 'gather_bundle', dayWindow: [0, 0], work: 'targets', seconds: 6, fatigue: 0,
    howKo: '밭에서 말린 것을 주워 흙을 털고 줄기째 묶는다 — 바람 드는 그늘에 매달아 둔다.',
    howEn: 'Gather what dried in the field, knock off the soil and tie them by the stems — hang them in an airy, shady spot.',
  },
  winnow: {
    id: 'winnow', dayWindow: [0, 0], work: 'tie', seconds: 6, fatigue: 0,
    howKo: '키에 담아 위로 까부른다 — 가벼운 검불 · 쭉정이는 바람에 날아가고 무거운 알만 남는다.',
    howEn: 'Toss the grain up from the basket — the light chaff and empty husks blow away and only the heavy seed falls back.',
  },
};

// ─────────────────────────────────────────────
// 작물별 표
// ─────────────────────────────────────────────

/** 육묘 트레이 칸(씨앗 → 모종)의 표 — 가식 한 번 · 247차 모종 굳히기(옮겨 심기 전 한 주) */
export const NURSERY_PLAN: CropCarePlan = {
  diseases: [],
  tasks: [{
    id: 'prick_out', dayWindow: [10, 24], work: 'tray', seconds: 8, fatigue: 3,
    effect: { quality: 0.05 }, missed: { yieldMult: 0.6, quality: 0.1 },
    howKo: '파종 2주쯤 본잎이 나오면 50구 트레이로 한 포기씩 옮겨 심는다. 낮 22~30℃ · 밤 15℃ 이상을 지킨다.',
    howEn: 'About two weeks after sowing, when true leaves show, move each seedling to a 50-cell tray. Keep 22–30℃ by day, above 15℃ at night.',
  }, {
    id: 'harden_off', dayWindow: [0, 0], growth: [0.85, 0.98], work: 'place', seconds: 6, fatigue: 2,
    effect: { quality: 0.03 }, missed: { yieldMult: 0.85 },
    howKo: '옮겨 심기 한 주 전부터 트레이를 낮에는 바깥 그늘에 내놓고 물을 조금 줄인다 — 실내에서만 큰 모종은 밭에 나가면 몸살로 몇 포기가 죽는다.',
    howEn: 'From a week before planting out, set the tray outside in light shade by day and water a little less — seedlings raised only indoors sulk in the field, and some die.',
  }],
};

/** 고추 — 본보기(정식 기준 일수 · 모종 3포기/칸) */
const CHILI_PLAN: CropCarePlan = {
  diseases: ['blight', 'anthracnose', 'virus'],
  establishDays: 14,
  frostEnds: true,
  tasks: [
    mulch,
    stake(3),
    {
      id: 'pinch_flower', dayWindow: [14, 30], work: 'targets', seconds: 6, fatigue: 2,
      missed: { yieldMult: 0.92 },
      howKo: '줄기가 처음 Y자로 갈라지는 방아다리에 달린 첫 꽃(고추)을 무조건 딴다 — 영양이 아래로 흩어지지 않게.',
      howEn: 'Pinch the very first flower at the Y-fork — otherwise nutrients drain into one early fruit.',
    },
    suckers([18, 40]),
    tie,
    topdress(4),
    fungicide, phosphite, calcium, insecticide, cull,
  ],
};

/** 241차 — 토마토(완숙 · 모종 2포기/칸) — 고추와 같은 뼈대에서 첫 꽃 따기만 뺀다(토마토는 첫 화방을 둔다) · 곁순은 작기 내내 */
const TOMATO_PLAN: CropCarePlan = {
  diseases: ['blight', 'anthracnose', 'virus'],
  establishDays: 14,
  frostEnds: true,
  tasks: [mulch, stake(2), suckers([14, 50]), tie, topdress(4), fungicide, phosphite, calcium, insecticide, cull],
};
/** 241차 — 스테비아 토마토 = 토마토 표 + 스테비아 발효액 4회 */
const STEVIA_TOMATO_PLAN: CropCarePlan = { ...TOMATO_PLAN, tasks: [...TOMATO_PLAN.tasks, steviaFeed] };

// ── 245차 — 나머지 작물(난이도 단계 · 까다로운 점과 맞춘다: 쉬움 1~3가지 · 보통 3~5 · 까다로움 5~8) ──

const LETTUCE_THIN: How = ['본잎 2~3장일 때 촘촘한 싹을 솎아 포기 사이를 한 뼘쯤 띄운다 — 솎은 싹은 겉절이로 먹는다.',
  'At two or three true leaves, thin the crowded seedlings to a hand’s width apart — eat the thinnings as salad.'];
const LETTUCE_FEED: How = ['잎을 따기 시작할 무렵 포기 사이에 웃거름을 준다 — 새잎이 계속 난다.',
  'Around the first picking, feed between the plants — new leaves keep coming.'];
const HEAD_FEED: How = ['포기가 오므라들기 시작할 때 한 번 웃거름을 준다 — 속이 차고 잎이 연하다.',
  'Feed once as the plants start to cup — fuller hearts, tender leaves.'];
const PICK_LEAF: CropCarePlan = { diseases: ['aphid'], tasks: [thin([12, 22], LETTUCE_THIN), feed({ window: [20, 30], repeat: { everyDays: 20, times: 1 }, how: LETTUCE_FEED }), pickPests(['aphid'])] };
const HEAD_LETTUCE: CropCarePlan = { diseases: ['aphid'], tasks: [thin([12, 22], LETTUCE_THIN), feed({ window: [20, 30], how: HEAD_FEED }), pickPests(['aphid'])] };

const BRASSICA_PESTS: CropDisease[] = ['flea_beetle', 'caterpillar'];
const WILD_MULCH: How = ['포기 둘레에 짚 · 낙엽을 덮어 숲 흙처럼 축축하게 둔다 — 마르면 잎끝이 타고 질겨진다.',
  'Mulch round the plants with straw and fallen leaves so the soil stays damp like a forest floor — dry soil scorches and toughens the leaves.'];
const WILD_WINTER: How = ['가을에 낙엽 · 짚을 두껍게 덮는다 — 겨울을 나고 봄에 순이 고르게 올라온다.',
  'In autumn, mulch thickly with leaves and straw — the roots come through winter and the spring shoots rise evenly.'];
const TREE_PRUNE: How = ['이른 봄 원줄기를 알맞은 높이에서 자르고 묵은 가지를 솎는다 — 곁가지가 늘어 새순이 많이 난다. 가시를 조심한다.',
  'In early spring, cut the main stem back to a good height and thin old wood — more side shoots, more spring buds. Mind the thorns.'];
const HERB_PINCH: How = ['키가 한 뼘 넘으면 원줄기 끝을 순지른다 — 곁가지가 나 잎이 많아진다.',
  'Once a hand-span tall, pinch out the leading tip — side shoots branch out and you get more leaves.'];
const GARLIC_STRAW: How = ['땅이 얼기 전에 짚을 덮는다 — 서릿발에 들뜨거나 얼어 죽는 포기가 줄어든다.',
  'Lay straw before the ground freezes — fewer plants heaved out by frost or killed by cold.'];
const SPRING_FEED: How = ['이른 봄 잎이 다시 자라기 시작하면 웃거름을 준다 — 통이 굵어진다.',
  'In early spring, as the leaves start growing again, top-dress — the bulbs swell.'];
const SPRING_WEED: How = ['봄에 올라온 잡초를 호미로 맨다 — 잎이 마늘 · 양파보다 빨리 커서 볕을 가린다.',
  'Hoe out the spring weeds — they outgrow the onions and garlic and shade them.'];
const RHIZOME_STRAW: How = ['싹이 트면 짚을 두껍게 덮는다 — 흙이 마르지 않고 한여름 땅 열기를 막는다.',
  'Once the shoots are up, mulch thickly with straw — the soil stays moist and midsummer heat is kept off.'];
const RHIZOME_HILL: How = ['두 번에 걸쳐 포기 밑에 흙을 북돋운다 — 새로 드는 뿌리줄기가 덮여 굵게 든다.',
  'Hill soil up round the base twice — the new rhizomes stay covered and swell.'];
const ROOT_ROT_CULL: How = ['잎이 누렇게 시든 포기는 뿌리째 뽑아 낸다 — 옆 포기로 번지지 않게.',
  'Pull yellowing, wilted plants roots and all — before it spreads to their neighbours.'];
const BEAN_BIRD: How = ['씨를 뿌린 날 새 그물이나 부직포를 덮는다 — 비둘기 · 까치가 씨앗과 갓 난 싹을 파먹는다.',
  'On sowing day, cover with bird netting or fleece — pigeons and magpies dig up the seed and the new shoots.'];
const MELON_MULCH: How = ['두둑을 높이고 검은 비닐을 덮는다 — 땅이 따뜻해지고 열매가 흙에 닿지 않아 덜 상한다.',
  'Raise the ridge and cover with black plastic — the soil warms and the fruit stays off the dirt.'];

const SWEET_POTATO_PLAN: CropCarePlan = {
  diseases: [],
  tasks: [
    mulchFor({ quality: 0.02 }, ['두둑을 세우고 검은 비닐을 덮는다 — 잡초가 덜 나고 땅이 따뜻해 순이 빨리 뻗는다.',
      'Ridge up and cover with black plastic — fewer weeds, warmer soil, and the slips run sooner.']),
    weed({ window: [15, 35], waivedBy: 'ridge_mulch', missed: 0.85, how: ['덩굴이 우거지기 전에 김을 맨다 — 흙에 바람이 통해 고구마가 굵게 든다. 비닐을 덮었으면 할 일이 없다.',
      'Weed before the vines close over — air reaches the soil and the roots swell. A mulched ridge needs none of this.'] }),
  ],
};
const GINGER_PLAN: CropCarePlan = {
  diseases: ['root_rot'],
  tasks: [
    strawMulch({ window: [20, 40], effect: { quality: 0.03 }, missed: { yieldMult: 0.9 }, how: RHIZOME_STRAW }),
    hillUp([60, 75], RHIZOME_HILL, { everyDays: 25, times: 1 }),
    topdress(3),
    cullFor(['root_rot'], ROOT_ROT_CULL),
  ],
};
const MUSHROOM_SLOW = (every: number, times: number): CropCarePlan => ({
  diseases: ['green_mold'],
  tasks: [slitBag, mist([4, 8], every, times), cullFor(['green_mold'], ['푸른곰팡이가 핀 곳을 칼로 도려내고 환기한다 — 두면 배지 전체로 번진다.',
    'Cut out the green-moulded patch and air the room — left alone, it takes over the whole block.'])],
});

export const CROP_CARE_PLANS: Readonly<Record<string, CropCarePlan>> = {
  chili: CHILI_PLAN,
  cheongyang: CHILI_PLAN,          // 241차 — 개량종은 원종과 같은 일
  tomato: TOMATO_PLAN,
  stevia_tomato: STEVIA_TOMATO_PLAN,
  // ── 시루 · 새싹 · 버섯(집 안 선반) ──
  bean_sprout: { diseases: [], tasks: [coverDark] },
  mung_sprout: { diseases: [], tasks: [coverDark] },
  microgreens: { diseases: [], tasks: [uncoverLight] },
  oyster_mushroom: { diseases: [], tasks: [slitBag, mist([3, 5], 3, 3)] },
  lions_mane: MUSHROOM_SLOW(4, 13),
  wood_ear: MUSHROOM_SLOW(5, 17),
  // ── 상추 9종 ──
  lettuce: PICK_LEAF, jeokchima: PICK_LEAF, kkot_lettuce: PICK_LEAF, cheongchukmyeon: PICK_LEAF, jeokchukmyeon: PICK_LEAF, saengchae: PICK_LEAF,
  cheongromaine: HEAD_LETTUCE, jeokromaine: HEAD_LETTUCE, butterhead: HEAD_LETTUCE,
  // ── 잎채소 ──
  perilla: { diseases: [], tasks: [
    thin([10, 20]),
    { ...pinchTip([30, 45], ['키가 30~40cm 되면 원줄기 끝을 순지른다 — 곁가지가 늘어 딸 잎이 많아진다. 딴 순은 깻순 나물이다.',
      'At 30–40cm tall, pinch out the leading tip — more side branches, more leaves to pick. The pinched tips are perilla-shoot greens.'], 0.9),
      yields: { itemId: PERILLA_SHOOT_ID, qty: [1, 2] } },   // 284차 — 순지른 새순(깻순 한 줌)
    feed({ window: [30, 45], repeat: { everyDays: 20, times: 2 }, how: ['잎을 따는 동안 스무날마다 웃거름을 준다 — 잎이 넓고 연하다.',
      'While picking, feed every twenty days — broad, tender leaves.'] }),
  ] },
  spinach: { diseases: ['downy_mildew'], tasks: [
    thin([10, 20]),
    frostCover([11, 12], ['겨울을 날 시금치는 된추위 전에 부직포를 덮는다 — 잎이 얼지 않고 봄에 달게 자란다.',
      'Spinach that will overwinter gets frost fleece before the hard cold — the leaves don’t freeze and grow sweet in spring.']),
    cullFor(['downy_mildew']),
  ] },
  crown_daisy: { diseases: ['aphid'], tasks: [thin([10, 20]), pickPests(['aphid'])] },
  young_radish: { diseases: BRASSICA_PESTS, tasks: [netCover(), thin([7, 14]), pickPests(BRASSICA_PESTS)] },
  ugeolgari: { diseases: BRASSICA_PESTS, tasks: [netCover(), thin([8, 16]), pickPests(BRASSICA_PESTS)] },
  chive: { diseases: [], tasks: [
    weed({ window: [10, 30] }),
    feed({ afterPick: true, how: ['벨 때마다 포기 사이에 웃거름을 준다 — 다음 잎이 굵게 올라온다.', 'Feed between the clumps after every cutting — the next leaves come up thick.'] }),
    removeFlower({ months: [8, 9], how: ['8~9월에 올라오는 꽃대를 딴다 — 두면 잎이 질겨지고 포기가 지친다.', 'Snap off the flower stalks that rise in August and September — left on, the leaves toughen and the clump tires.'] }),
  ] },
  scallion: { diseases: [], tasks: [
    weed({ window: [10, 25] }),
    feed({ window: [20, 30], how: ['잎이 한 뼘쯤 자라면 웃거름을 한 번 준다 — 알뿌리가 고르게 굵는다.', 'Once the leaves are a hand-span tall, feed once — the bulbs swell evenly.'] }),
  ] },
  water_parsley: { diseases: [], tasks: [
    waterFlood({ window: [5, 12], repeat: { everyDays: 15, times: 6 }, how: ['고랑에 물을 대어 늘 질척하게 둔다 — 마르면 줄기가 질기고 가늘다.', 'Flood the furrows so the bed stays boggy — dry, the stems turn thin and stringy.'] }),
    feed({ afterPick: true, how: ['벨 때마다 웃거름을 준다 — 다음 줄기가 빨리 올라온다.', 'Feed after every cutting — the next stems come up quickly.'] }),
  ] },
  mallow: { diseases: [], tasks: [thin([10, 20]), feed({ window: [25, 40], how: ['순을 따기 시작할 때 웃거름을 한 번 준다 — 잎이 넓고 부드럽다.', 'Feed once when you start cutting the tips — broad, soft leaves.'] })] },
  chard: { diseases: [], tasks: [thin([10, 20]), feed({ window: [30, 45], repeat: { everyDays: 20, times: 1 }, how: ['겉잎을 따는 동안 스무날마다 웃거름을 준다 — 잎줄기가 굵다.', 'While picking the outer leaves, feed every twenty days — thick stalks.'] })] },
  godeulppaegi: { diseases: [], tasks: [thin([15, 25]), weed({ window: [20, 40] })] },
  bangpung: { diseases: [], tasks: [
    weed({ window: [10, 30] }),
    removeFlower({ months: [6, 7], how: ['초여름 꽃대가 올라오면 꺾는다 — 잎이 억세지지 않는다.', 'Break off the flower stalks in early summer — the leaves stay tender.'] }),
  ] },
  kangkong: { diseases: [], tasks: [
    thin([8, 16]),
    feed({ afterPick: true, how: ['벨 때마다 웃거름을 준다 — 순이 금방 다시 뻗는다.', 'Feed after every cutting — the shoots race back.'] }),
  ] },
  arugula: { diseases: ['flea_beetle'], tasks: [netCover({ flea_beetle: 0.15 }), thin([7, 15])] },
  amaranth: { diseases: [], tasks: [thin([8, 16])] },
  meowi: { diseases: [], tasks: [
    weed({ window: [10, 30] }),
    strawMulch({ window: [0, 15], effect: { quality: 0.03 }, missed: { quality: 0.04 }, how: ['포기 둘레에 짚을 덮어 흙이 마르지 않게 한다 — 머위는 축축한 그늘 흙을 좋아한다.',
      'Mulch round the plants with straw so the soil never dries — butterbur likes damp, shady ground.'] }),
  ] },
  // ── 향채 ──
  basil: { diseases: [], tasks: [
    thin([10, 20]),
    pinchTip([20, 35], ['본잎 6~8장일 때 원줄기 끝을 순지른다 — 곁가지가 늘어 잎이 많아진다.', 'At six to eight true leaves, pinch out the leading tip — more branches, more leaves.']),
    removeFlower({ window: [40, 50], repeat: { everyDays: 14, times: 4 }, how: ['꽃대가 올라오면 바로 딴다 — 두면 잎이 질겨지고 향이 준다.', 'Pinch off flower spikes as soon as they appear — left on, the leaves toughen and lose their scent.'] }),
  ] },
  shiso: { diseases: [], tasks: [thin([10, 20]), pinchTip([25, 40], HERB_PINCH)] },
  banga: { diseases: [], tasks: [thin([10, 20]), pinchTip([25, 40], HERB_PINCH)] },
  dill: { diseases: [], tasks: [
    thin([10, 20]),
    removeFlower({ window: [35, 45], repeat: { everyDays: 10, times: 1 }, how: ['꽃대가 서면 잎이 금방 거칠어진다 — 보이는 대로 딴다.', 'Once it bolts the fronds coarsen fast — pinch the flower stalks as they show.'] }),
  ] },
  fennel: { diseases: [], tasks: [
    thin([12, 22]),
    hillUp([50, 65], ['구근이 굵어지기 시작하면 아랫부분에 흙을 덮어 준다 — 하얗고 연하게 자란다.', 'As the bulb starts to swell, earth up its lower half — it grows white and tender.']),
    removeFlower({ window: [60, 80], missed: { yieldMult: 0.9 }, how: ['꽃대가 서면 구근이 더 굵지 않는다 — 올라오는 대로 꺾는다.', 'Once it bolts the bulb stops swelling — break off flower stalks as they rise.'] }),
  ] },
  danggui: { diseases: [], tasks: [
    thin([12, 25]),
    weed({ window: [10, 30] }),
    removeFlower({ months: [7, 8], how: ['꽃대가 올라오면 꺾는다 — 잎을 먹으려면 꽃을 피우지 않는다.', 'Break off the flower stalks — if it is the leaves you want, never let it flower.'] }),
  ] },
  myoga: { diseases: [], tasks: [
    strawMulch({ window: [0, 20], missed: { yieldMult: 0.92 }, how: ['두껍게 짚을 덮는다 — 마르면 꽃순이 올라오지 않는다.', 'Mulch thickly with straw — dry soil and the flower buds never come up.'] }),
    weed({ window: [20, 50] }),
    feed({ window: [60, 80], how: ['꽃순이 오르기 전 여름에 웃거름을 한 번 준다.', 'Feed once in summer, before the flower buds push up.'] }),
    frostCover([11, 12], ['땅이 얼기 전에 부직포로 덮어 뿌리줄기를 지킨다 — 이듬해 다시 올라온다.', 'Cover with fleece before the ground freezes to protect the rhizomes — they come back next year.']),
  ] },
  chopi: { diseases: ['aphid', 'caterpillar'], tasks: [
    prune([2, 3], ['잎이 나기 전 웃자란 가지 · 안쪽으로 뻗은 가지를 잘라 낸다 — 볕이 들고 열매가 고르게 달린다. 가시를 조심한다.',
      'Before leaf-out, cut leggy and inward-growing branches — light gets in and the berries set evenly. Mind the thorns.']),
    weed({ window: [20, 60] }),
    pickPests(['aphid', 'caterpillar'], ['새순의 진딧물을 떨어내고 잎을 갉는 호랑나비 애벌레를 잡는다.', 'Knock aphids off the new shoots and pick off the swallowtail caterpillars chewing the leaves.']),
  ] },
  // ── 산채(반그늘 · 산채 재배) ──
  gomchwi: { diseases: [], tasks: [weed({ window: [10, 30] }), strawMulch({ window: [0, 15], effect: { quality: 0.03 }, missed: { quality: 0.05 }, how: WILD_MULCH })] },
  myeongi: { diseases: [], tasks: [weed({ window: [10, 30] }), strawMulch({ months: [10, 11], missed: { yieldMult: 0.92 }, how: WILD_WINTER })] },
  samnamul: { diseases: [], tasks: [weed({ window: [10, 30] }), strawMulch({ months: [10, 11], missed: { yieldMult: 0.92 }, how: WILD_WINTER })] },
  eosuri: { diseases: [], tasks: [
    weed({ window: [10, 30] }),
    removeFlower({ months: [6, 7], how: ['꽃대가 올라오면 꺾는다 — 잎이 억세지지 않고 뿌리가 힘을 모은다.', 'Break off the flower stalks — the leaves stay tender and the roots build strength.'] }),
  ] },
  bujigaengi: { diseases: [], tasks: [weed({ window: [10, 30] }), strawMulch({ window: [0, 15], effect: { quality: 0.03 }, missed: { quality: 0.05 }, how: WILD_MULCH })] },
  dureup: { diseases: [], tasks: [prune([2, 3], TREE_PRUNE), weed({ window: [10, 40] })] },
  eomnamu: { diseases: [], tasks: [prune([2, 3], TREE_PRUNE), weed({ window: [10, 40] })] },
  wasabi: { diseases: ['soft_rot'], tasks: [
    feed({ window: [30, 45], repeat: { everyDays: 60, times: 7 }, how: ['두 달에 한 번 묽은 웃거름을 조금 준다 — 많으면 뿌리줄기가 썩는다.', 'Every two months, give a little weak feed — too much and the rhizome rots.'] }),
    removeFlower({ months: [3, 4], missed: { yieldMult: 0.92 }, how: ['봄에 꽃대가 서면 딴다 — 뿌리줄기가 굵어진다.', 'Pick the flower stalks in spring — the rhizome thickens.'] }),
    cullFor(['soft_rot'], ['물러진 포기는 바로 뽑아 낸다 — 물을 타고 옆 포기로 번진다.', 'Pull mushy plants at once — it rides the water to the next plant.']),
  ] },
  // ── 열매채소 ──
  cherry_tomato: {
    diseases: ['blight', 'anthracnose', 'virus'],
    tasks: [stake(2), tie, suckers([14, 50], ['잎겨드랑이마다 나는 곁순을 딴다 — 원줄기 하나로 키워야 열매가 굵다.', 'Pinch out the side shoot in every leaf axil — one main stem gives bigger fruit.']),
      fungicide, insecticide, cull, topdress(3)],
  },
  eggplant: { diseases: ['aphid', 'virus'], tasks: [
    stake(2), tie,
    suckers([10, 30], ['첫 꽃 바로 아래 곁가지 둘만 남기고 그 아래 곁순은 모두 딴다 — 세 줄기로 키운다.', 'Keep the two side shoots just below the first flower and strip every sucker beneath — train it to three stems.']),
    topdress(4), insecticide, pickPests(['aphid']), cullFor(['virus']),
  ] },
  cucumber: { diseases: ['powdery_mildew', 'downy_mildew', 'virus'], tasks: [
    trellis(2, ['심은 즉시 지주를 세우고 오이망을 친다 — 덩굴손이 망을 감고 오른다.', 'Right after planting, put up stakes and a cucumber net — the tendrils climb it.']),
    suckers([10, 30], ['아래 5~6마디까지 나는 곁순과 암꽃은 모두 딴다 — 원줄기를 먼저 키운다.', 'Remove every side shoot and female flower on the lowest five or six nodes — grow the main vine first.']),
    pinchTip([35, 50], ['원줄기가 망 끝에 닿으면 순을 지른다 — 아들덩굴에서 오이가 이어 달린다.', 'When the main vine reaches the top of the net, pinch it out — cucumbers keep coming on the side vines.']),
    topdress(4), fungicide, insecticide, cull,
  ] },
  zucchini: { diseases: ['powdery_mildew', 'virus'], tasks: [
    pollinate([25, 35], { everyDays: 7, times: 3 }, ['이른 아침 수꽃을 따서 꽃잎을 떼고 암꽃 암술에 꽃가루를 묻힌다 — 벌이 적은 날은 애호박이 안 달린다.',
      'Early in the morning, pick a male flower, strip its petals and dab the pollen on a female flower — on days with few bees, no squash sets.']),
    topdress(3), fungicide, insecticide, cull,
  ] },
  bitter_melon: { diseases: ['powdery_mildew'], tasks: [
    trellis(1, ['지주를 세우고 망을 친다 — 덩굴이 3m 넘게 타고 오른다.', 'Put up stakes and a net — the vine climbs past three metres.']),
    pinchTip([20, 35], ['어미덩굴이 5~6마디 자라면 순을 지르고 아들덩굴 서너 개를 망에 고르게 올린다.', 'When the main vine has five or six nodes, pinch it and spread three or four side vines across the net.']),
    topdress(3), cull,
  ] },
  okra: { diseases: ['aphid'], tasks: [stripLeaves, topdress(3), pickPests(['aphid'])] },
  gourd: { diseases: ['powdery_mildew'], tasks: [
    trellis(1, ['덕이나 울타리를 세워 덩굴을 올린다 — 박이 땅에 닿지 않고 매달린다.', 'Build an arbour or fence for the vine — the gourds hang clear of the ground.']),
    pinchTip([20, 35], ['어미덩굴 순을 지르고 아들덩굴 두세 개를 키운다.', 'Pinch the main vine and grow on two or three side vines.']),
    pollinate([45, 55], { everyDays: 7, times: 2 }, ['박꽃은 해 질 녘에 핀다 — 저녁에 수꽃 꽃가루를 암꽃에 묻힌다.', 'Gourd flowers open at dusk — dab male pollen on the female flowers in the evening.']),
    topdress(3), cull,
  ] },
  korean_melon: { diseases: ['powdery_mildew', 'downy_mildew', 'virus'], tasks: [
    mulchFor({ diseaseMult: { downy_mildew: 0.7, powdery_mildew: 0.85 } }, MELON_MULCH),
    pinchTip([10, 20], ['어미덩굴 4~5마디에서 순을 지르고 아들덩굴 두세 개를 키운다 — 참외는 손자덩굴에 달린다.', 'Pinch the main vine at four or five nodes and grow two or three side vines — melons set on the side shoots of those.']),
    suckers([25, 40], ['아들덩굴에서 나는 손자덩굴은 열매 달린 것만 두고 두 마디에서 순을 지른다.', 'On the side vines, keep only the fruiting shoots and pinch each two nodes past the fruit.']),
    thinFruit([0.55, 0.8], ['한 덩굴에 참외 서너 개만 남기고 작은 것은 딴다 — 크고 달게 든다.', 'Leave three or four melons per vine and pick off the small ones — bigger, sweeter fruit.']),
    topdress(3), fungicide, insecticide, cull,
  ] },
  watermelon: { diseases: ['powdery_mildew', 'anthracnose', 'virus'], tasks: [
    mulchFor({ diseaseMult: { anthracnose: 0.7, powdery_mildew: 0.85 } }, MELON_MULCH),
    pinchTip([10, 20], ['어미덩굴 5~6마디에서 순을 지르고 튼튼한 아들덩굴 두세 개를 키운다.', 'Pinch the main vine at five or six nodes and grow on two or three strong side vines.']),
    pollinate([30, 40], { everyDays: 4, times: 1 }, ['아침 9시 전에 수꽃을 따서 암꽃에 꽃가루를 묻힌다 — 수박은 벌에만 맡기면 잘 안 달린다.', 'Before 9 a.m., dab a male flower on the female flowers — left to the bees, watermelons set poorly.']),
    thinFruit([0.55, 0.8], ['한 포기에 수박 한두 통만 남기고 나머지는 어릴 때 딴다.', 'Leave one or two melons per plant and pick the rest while small.']),
    topdress(2), fungicide, insecticide, cull,
  ] },
  blueberry: { diseases: ['birds'], tasks: [
    acidify,
    strawMulch({ window: [0, 15], effect: { quality: 0.03 }, missed: { yieldMult: 0.95 }, how: ['포기 둘레에 톱밥 · 솔잎 · 짚을 덮는다 — 뿌리가 얕아 금방 마른다.', 'Mulch round the bush with sawdust, pine needles or straw — the roots are shallow and dry out fast.'] }),
    birdNet({ months: [5, 6], effect: { diseaseMult: { birds: 0.1 } }, how: ['열매가 익기 전에 새 그물을 씌운다 — 직박구리가 하룻밤에 다 따 먹는다.', 'Net the bushes before the berries ripen — bulbuls can strip them overnight.'] }),
    prune([2, 3], ['겨울 끝에 늙은 가지 · 가는 가지를 솎아 낸다 — 새 가지에 굵은 열매가 달린다.', 'At winter’s end, thin out old and spindly wood — the big berries come on young canes.']),
  ] },
  strawberry: { diseases: ['gray_mold', 'powdery_mildew'], tasks: [
    frostCover([12, 1], ['한겨울에는 부직포를 덮어 포기 속(관부)이 얼지 않게 한다.', 'In midwinter, cover with frost fleece so the crowns don’t freeze.']),
    strawMulch({ months: [3], effect: { diseaseMult: { gray_mold: 0.6 } }, missed: { quality: 0.04 }, how: ['이른 봄 포기 사이에 짚을 깐다 — 열매가 흙에 닿지 않아 잿빛곰팡이가 덜 든다.', 'In early spring, lay straw between the plants — berries stay off the soil and gray mold is kept down.'] }),
    removeRunner, fungicide, cull,
  ] },
  // ── 뿌리 · 덩이 · 파 ──
  potato: { diseases: [], tasks: [
    { ...thin([20, 32], ['싹이 10cm쯤 자라면 굵은 줄기 두세 개만 남기고 뽑는다 — 알이 굵어진다.', 'When the shoots are about 10cm, keep two or three strong stems and pull the rest — bigger tubers.']), startKinds: undefined },
    hillUp([30, 40], ['두 번에 걸쳐 포기 밑에 흙을 북돋운다 — 감자가 흙 밖으로 나와 햇빛을 보면 파랗게 되어 못 먹는다.', 'Hill up twice — potatoes pushed into the light turn green and inedible.'], { everyDays: 15, times: 1 }, { yieldMult: 0.92, quality: 0.08 }),
  ] },
  sweet_potato: SWEET_POTATO_PLAN,
  pumpkin_sweet_potato: SWEET_POTATO_PLAN,
  radish: { diseases: BRASSICA_PESTS, tasks: [
    netCover(),
    feed({ window: [20, 30], repeat: { everyDays: 15, times: 1 }, how: ['솎은 뒤 포기 사이에 웃거름을 두 번 준다 — 뿌리가 굵어진다.', 'After thinning, feed between the plants twice — the roots fatten.'] }),
    pickPests(BRASSICA_PESTS),
  ] },
  napa_cabbage: { diseases: BRASSICA_PESTS, tasks: [
    netCover(),
    feed({ window: [15, 25], repeat: { everyDays: 15, times: 2 }, how: ['심고 보름 · 한 달 · 한 달 반 뒤 세 번 웃거름을 준다 — 속이 꽉 찬다.', 'Feed three times — at two, four and six weeks after planting — for a solid heart.'] }),
    tieHead,
    pickPests(BRASSICA_PESTS),
  ] },
  carrot: { diseases: [], tasks: [
    thin([15, 25], ['본잎 2~3장 · 5~6장 때 두 번 솎는다 — 마지막에 포기 사이가 손 한 뼘.', 'Thin twice, at two-three and five-six true leaves — finish a hand’s width apart.'], { everyDays: 15, times: 1 }),
    weed({ window: [15, 35], how: ['당근은 어릴 때 더디 자라 잡초에 묻히기 쉽다 — 호미로 김을 맨다.', 'Young carrots grow slowly and drown in weeds — hoe them out.'] }),
  ] },
  turnip: { diseases: BRASSICA_PESTS, tasks: [netCover(), thin([10, 20]), pickPests(BRASSICA_PESTS)] },
  garlic: { diseases: ['rust'], tasks: [
    strawMulch({ months: [11, 12], missed: { yieldMult: 0.9 }, how: GARLIC_STRAW }),
    feed({ months: [2, 3], how: SPRING_FEED }),
    weed({ months: [4, 5], how: SPRING_WEED }),
    cullFor(['rust']),
  ] },
  onion: { diseases: ['downy_mildew'], tasks: [
    strawMulch({ months: [11, 12], missed: { yieldMult: 0.9 }, how: GARLIC_STRAW }),
    feed({ months: [2, 3], how: SPRING_FEED }),
    weed({ months: [4, 5], how: SPRING_WEED }),
    removeFlower({ months: [4, 5], missed: { yieldMult: 0.92 }, how: ['꽃대(추대)가 올라오면 바로 꺾는다 — 두면 알이 굵지 않고 속이 딱딱해진다.', 'Snap off any flower stalk as soon as it bolts — left on, the bulb stops swelling and turns woody.'] }),
    cullFor(['downy_mildew']),
  ] },
  leek: { diseases: ['rust'], tasks: [
    hillUp([30, 40], ['자라는 대로 세 번 흙을 북돋운다 — 흙에 묻힌 만큼 흰 줄기(연백)가 길어진다.', 'Hill up three times as it grows — the white shank is as long as the soil is deep.'], { everyDays: 20, times: 2 }, { yieldMult: 0.95, quality: 0.08 }),
    feed({ window: [25, 35], repeat: { everyDays: 25, times: 1 }, how: ['북을 줄 때 웃거름을 함께 준다 — 줄기가 굵어진다.', 'Feed when you hill up — thicker stems.'] }),
    cullFor(['rust']),
  ] },
  taro: { diseases: [], tasks: [
    hillUp([40, 60], ['두 번에 걸쳐 북을 준다 — 새끼 토란이 흙 밖으로 나오면 푸르게 굳는다.', 'Hill up twice — cormels pushed into the light turn green and hard.'], { everyDays: 25, times: 1 }),
    waterFlood({ months: [7, 8], how: ['한여름 가물면 고랑에 물을 대 준다 — 토란은 물을 무척 먹는다.', 'In a midsummer dry spell, flood the furrows — taro drinks a great deal.'] }),
    topdress(3),
  ] },
  yacon: { diseases: [], tasks: [
    hillUp([40, 60], ['포기 밑에 흙을 북돋운다 — 덩이뿌리가 드러나지 않고 쓰러지지 않는다.', 'Hill up round the base — the tubers stay covered and the plant stays upright.']),
    topdress(3),
  ] },
  choseokjam: { diseases: [], tasks: [
    weed({ window: [20, 50] }),
    hillUp([60, 90], ['가을 덩이줄기가 들 때 흙을 북돋운다 — 흙 위로 나온 덩이줄기는 푸르게 굳는다.', 'Hill up in autumn as the tubers form — any pushed above ground turn green and hard.']),
  ] },
  jerusalem: { diseases: [], tasks: [weed({ window: [10, 30], how: ['어릴 때 한 번만 김을 매 주면 된다 — 자라면 잡초를 이긴다.', 'Weed once while it is young — after that it smothers the weeds itself.'] })] },
  ginger: GINGER_PLAN,
  turmeric: GINGER_PLAN,
  peanut: { diseases: [], tasks: [
    birdNet({ window: [0, 10], missed: { yieldMult: 0.88 }, how: BEAN_BIRD }),
    weed({ window: [15, 35] }),
    hillUp([40, 55], ['꽃이 피면 포기 둘레에 흙을 북돋운다 — 씨방자루가 땅속으로 들어가야 꼬투리가 든다.', 'When it flowers, hill soil round the plant — the pegs must bury themselves for pods to form.'], undefined, { yieldMult: 0.85 }),
  ] },
  soybean: { diseases: ['stink_bug'], tasks: [
    birdNet({ window: [0, 10], missed: { yieldMult: 0.9 }, how: BEAN_BIRD }),
    pinchTip([25, 40], ['본잎 5~6장일 때 순을 지른다 — 곁가지가 늘고 쓰러지지 않는다.', 'At five or six true leaves, pinch out the tip — more branches, and it won’t lodge.']),
    pickPests(['stink_bug'], ['꼬투리가 맺히면 노린재를 보이는 대로 잡는다 — 이른 아침에는 움직임이 느리다.', 'As the pods fill, pick off stink bugs on sight — they are sluggish in the early morning.']),
  ] },
  cowpea: { diseases: ['aphid'], tasks: [weed({ window: [10, 30] }), pickPests(['aphid'])] },
  barley: { diseases: [], tasks: [
    tread,
    feed({ months: [3], how: ['보리밟기가 끝난 이른 봄에 웃거름을 준다 — 이삭이 굵게 팬다.', 'Top-dress in early spring once the treading is done — heavy ears.'] }),
  ] },
  corn: { diseases: ['corn_borer', 'birds'], tasks: [
    thin([10, 20], ['한 구멍에 싹이 둘 셋 나면 가장 튼튼한 하나만 남긴다.', 'Where two or three come up in a hole, keep only the strongest.']),
    suckers([25, 40], ['밑동에서 나는 곁가지를 딴다 — 원줄기 이삭에 힘이 모인다.', 'Strip the suckers from the base — the main stalk’s ear gets the strength.']),
    thinFruit([0.55, 0.75], ['이삭이 두세 개 달리면 맨 위 하나(많아야 둘)만 남긴다 — 알이 꽉 찬다.', 'If two or three ears form, keep the top one (two at most) — full, plump kernels.']),
    insecticide,
    birdNet({ growth: [0.75, 0.95], effect: { diseaseMult: { birds: 0.1 } }, how: ['수염이 마르기 시작하면 이삭을 망으로 감싼다 — 까치가 익은 알을 쪼아 먹는다.', 'When the silks start to dry, bag the ears in mesh — magpies peck out the ripe kernels.'] }),
  ] },
  gondre: { diseases: [], tasks: [thin([15, 25]), weed({ window: [10, 30] })] },
  // ── 247차 — 깨(들깨 · 참깨) ──
  deulkkae: { diseases: [], tasks: [
    thin([10, 20], ['한 구멍에 두세 포기만 남기고 솎는다 — 배게 서면 웃자라 쓰러진다.', 'Thin to two or three plants a hole — crowded plants grow leggy and fall over.']),
    { ...pinchTip([30, 45], ['키가 30~40cm 되면 원줄기 끝을 순지른다 — 곁가지가 늘고 키가 낮아져 쓰러지지 않는다. 딴 순은 깻순 나물이다.',
      'At 30–40cm, pinch out the leading tip — more side branches, a shorter plant, and it will not lodge. The pinched tips are perilla-shoot greens.'], 0.9),
      yields: { itemId: PERILLA_SHOOT_ID, qty: [1, 2] } },   // 284차 — 순지른 새순(깻순 한 줌 — 수확은 줄지 않는다)
    weed({ window: [15, 35] }),
  ] },
  chamkkae: { diseases: ['blight'], tasks: [
    thin([10, 20], ['본잎 2~3장 때 솎아 한 구멍에 한두 포기만 둔다.', 'At two or three true leaves, thin to one or two plants a hole.']),
    weed({ window: [15, 35] }),
    pinchTip([60, 75], ['꽃이 위까지 피면 순 끝을 잘라 준다 — 아래 꼬투리가 고르게 여문다.', 'Once flowers reach the top, nip out the tip — the lower pods ripen evenly.'], 0.94),
    fungicide, cullFor(['blight'], ['줄기 밑이 물러 쓰러진 포기는 뽑아 낸다 — 물이 고인 곳부터 번진다.', 'Pull plants that rot at the base and fall — it spreads from wherever water pools.']),
  ] },
};

const planCache = new Map<string, CropCarePlan>();

/**
 * 이 작물의 관리 표 — 표가 있으면 그것, 없으면 까다로운 점에서 뽑는다(245차부터 84종 모두 표가 있다 — 뽑기는 새 작물 대비).
 * 245차 — 표의 약 · 멀칭 효과는 **이 작물에 드는 병만** 남긴다(살균제 하나가 여러 작물의 병을 함께 적어 둔다).
 *   그 작물에 막을 병이 하나도 없는 약 치기는 뺀다. 활착기(모종 2주) · 서리에 끝(열매 작물)은 표에 없으면 기본값.
 *  - `support`: 지주 + 유인 2회(모종 포기 수만큼 지주대) · 토마토는 곁순도.
 *  - 열매 작물 + `pests`: 역병 · 탄저병 · 바이러스병 + 살균제 · 살충제 · 걷어 내기.
 *  - 열매 작물 · 긴 작물(겨울나기 · 여러해살이는 뺀다): 웃거름(15일 뒤 · 18일 간격 · 4회).
 */
export function carePlanOf(crop: CropDef): CropCarePlan {
  const cached = planCache.get(crop.id);
  if (cached) return cached;
  const seedling = crop.starts.find((s) => s.kind === 'seedling');
  const fruit = crop.category === 'fruit';
  const hit = CROP_CARE_PLANS[crop.id];
  let plan: CropCarePlan;
  if (hit) {
    const ds = new Set(hit.diseases);
    const keepD = <T>(rec?: Partial<Record<CropDisease, T>>): Partial<Record<CropDisease, T>> | undefined => {
      if (!rec) return undefined;
      const out = Object.fromEntries(Object.entries(rec).filter(([d]) => ds.has(d as CropDisease))) as Partial<Record<CropDisease, T>>;
      return Object.keys(out).length ? out : undefined;
    };
    const tasks: CareTaskDef[] = [];
    for (const t of hit.tasks) {
      const protect = t.effect?.protect?.filter((p) => ds.has(p.disease));
      if (t.only === 'riskSeason' && !protect?.length) continue;   // 이 작물에는 막을 병이 없는 약
      const effect = t.effect ? { ...t.effect, protect: protect?.length ? protect : undefined, diseaseMult: keepD(t.effect.diseaseMult) } : undefined;
      const missed = t.missed ? { ...t.missed, diseaseMult: keepD(t.missed.diseaseMult) } : undefined;
      const onlyFor = t.onlyFor?.filter((d) => ds.has(d));
      tasks.push(clean({ ...t, effect, missed, ...(t.onlyFor ? { onlyFor } : {}) }));
    }
    plan = {
      ...hit, tasks,
      establishDays: hit.establishDays ?? (seedling ? 14 : undefined),
      frostEnds: hit.frostEnds ?? (fruit && !crop.overwinter && !crop.perennial ? true : undefined),
    };
    if (plan.establishDays === undefined) delete plan.establishDays;
    if (plan.frostEnds === undefined) delete plan.frostEnds;
  } else {
    const care = crop.care ?? [];
    const tasks: CareTaskDef[] = [];
    const diseases: CropDisease[] = [];
    if (care.includes('support')) {
      tasks.push(stake(Math.max(1, seedling?.perCell ?? 2)), tie);
    }
    if (fruit && care.includes('pests')) {
      diseases.push('blight', 'anthracnose', 'virus');
      tasks.push(fungicide, insecticide, cull);
    }
    // 웃거름 — 열매 작물 · 긴 작물. 겨울을 나는 작물(마늘 · 양파 · 보리)과 여러해살이(산채 · 두릅 · 초피)는 달력 일로 따로 둔다
    if ((fruit || care.includes('longSeason')) && !crop.overwinter && !crop.perennial) tasks.push(topdress(3));
    plan = {
      tasks, diseases,
      ...(seedling ? { establishDays: 14 } : {}),
      ...(fruit && !crop.overwinter && !crop.perennial ? { frostEnds: true } : {}),
    };
  }
  planCache.set(crop.id, plan);
  return plan;
}

/** undefined 필드를 지운다(시험 · 위키가 표를 그대로 비교한다) */
function clean(t: CareTaskDef): CareTaskDef {
  const out = { ...t } as Record<string, unknown>;
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  if (out.effect) {
    const e = { ...(out.effect as Record<string, unknown>) };
    for (const k of Object.keys(e)) if (e[k] === undefined) delete e[k];
    if (Object.keys(e).length) out.effect = e; else delete out.effect;
  }
  if (out.missed) {
    const m = { ...(out.missed as Record<string, unknown>) };
    for (const k of Object.keys(m)) if (m[k] === undefined) delete m[k];
    if (Object.keys(m).length) out.missed = m; else delete out.missed;
  }
  return out as unknown as CareTaskDef;
}

/** 관리 작업이 있는 작물인가(텃밭 창 · 상세가 「손이 가는 일」 줄을 보인다) */
export function hasCarePlan(crop: CropDef): boolean {
  return carePlanOf(crop).tasks.length > 0;
}

// ─────────────────────────────────────────────
// 때 · 철 — 화면 · 위키가 같은 말을 쓴다
// ─────────────────────────────────────────────

const MONTH_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 달 목록 → 이어진 구간들(12 → 1을 넘어가는 구간은 하나로) */
export function monthRuns(months: readonly number[]): [number, number][] {
  const set = new Set(months);
  if (set.size === 0) return [];
  if (set.size === 12) return [[1, 12]];
  const runs: [number, number][] = [];
  for (let m = 1; m <= 12; m++) {
    if (!set.has(m)) continue;
    const prev = m === 1 ? 12 : m - 1;
    if (set.has(prev)) continue;   // 구간의 시작이 아니다
    let end = m;
    while (set.has(end === 12 ? 1 : end + 1) && (end === 12 ? 1 : end + 1) !== m) end = end === 12 ? 1 : end + 1;
    runs.push([m, end]);
  }
  return runs;
}

/** 「11~12월」 · 「12~1월」 · 「3월」 · 「4~6월 · 9~10월」 */
export function monthsKo(months: readonly number[]): string {
  const runs = monthRuns(months);
  if (runs.length === 1 && runs[0][0] === 1 && runs[0][1] === 12) return '언제나';
  return runs.map(([a, b]) => (a === b ? `${a}월` : `${a}~${b}월`)).join(' · ');
}
export function monthsEn(months: readonly number[]): string {
  const runs = monthRuns(months);
  if (runs.length === 1 && runs[0][0] === 1 && runs[0][1] === 12) return 'year-round';
  return runs.map(([a, b]) => (a === b ? MONTH_EN[a] : `${MONTH_EN[a]}–${MONTH_EN[b]}`)).join(', ');
}

/**
 * 약 치기가 「할 일」이 되는 달 — 이 작물에 드는 병 중 그 약이 막는 것들의 철 + 각 구간 한 달 앞(예방).
 * 고추 살균제 = 역병 · 탄저병 6~9월 → 5~9월(238차 철과 같다).
 */
export function riskMonthsOf(plan: CropCarePlan, def: CareTaskDef): number[] {
  const ds = new Set(plan.diseases);
  const months = new Set<number>();
  for (const p of def.effect?.protect ?? []) {
    if (!ds.has(p.disease)) continue;
    for (const m of DISEASE_DEFS[p.disease].season) months.add(m);
  }
  for (const [a] of monthRuns([...months])) {
    for (let k = 1; k <= PREVENT_LEAD_MONTHS; k++) months.add(((a - 1 - k + 12) % 12) + 1);
  }
  return [...months].sort((a, b) => a - b);
}

/** 받침이 있으면 「이」, 없으면 「가」를 붙인다(알림 · 때 문장) */
function withGa(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  const batchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return `${word}${batchim ? '이' : '가'}`;
}

/** 작업의 때 한 줄(위키 · 상세) */
export function taskWhenKo(plan: CropCarePlan, t: CareTaskDef): string {
  const seed = t.startKinds?.length === 1 && t.startKinds[0] === 'seed' ? ' · 씨앗으로 뿌린 칸만' : '';
  if (t.only === 'riskSeason') return `${monthsKo(riskMonthsOf(plan, t))}(철마다)`;
  if (t.only === 'diseased') return t.onlyFor?.length ? `${withGa(t.onlyFor.map((d) => DISEASE_KO[d]).join(' · '))} 들었을 때` : '병이 들었을 때';
  if (t.months) return `해마다 ${monthsKo(t.months)}${seed}`;
  if (t.growth) return `자람 ${Math.round(t.growth[0] * 100)}~${Math.round(t.growth[1] * 100)}%${seed}`;
  if (t.afterPick) return `거둘 때마다(다시 자람 60% 전)${seed}`;
  return `${t.dayWindow[0] === 0 ? `심은 날부터 ${t.dayWindow[1]}일 안` : `심은 뒤 ${t.dayWindow[0]}~${t.dayWindow[1]}일`}${seed}`;
}
export function taskWhenEn(plan: CropCarePlan, t: CareTaskDef): string {
  const seed = t.startKinds?.length === 1 && t.startKinds[0] === 'seed' ? ', sown cells only' : '';
  if (t.only === 'riskSeason') return `${monthsEn(riskMonthsOf(plan, t))} (in season)`;
  if (t.only === 'diseased') return t.onlyFor?.length ? `when hit by ${t.onlyFor.map((d) => DISEASE_EN[d].toLowerCase()).join(' or ')}` : 'when disease strikes';
  if (t.months) return `every year, ${monthsEn(t.months)}${seed}`;
  if (t.growth) return `at ${Math.round(t.growth[0] * 100)}–${Math.round(t.growth[1] * 100)}% growth${seed}`;
  if (t.afterPick) return `after every picking (before 60% regrowth)${seed}`;
  return `${t.dayWindow[0] === 0 ? `within ${t.dayWindow[1]} days of planting` : `${t.dayWindow[0]}–${t.dayWindow[1]} days after planting`}${seed}`;
}

/** 요약 한 조각의 꼬리 — 「(철마다)」 · 「(11~12월)」 · 「(벨 때마다)」 · 「(씨앗)」 · 「5회」 */
function summaryPart(t: CareTaskDef, name: string, ko: boolean): string {
  const n = 1 + (t.repeat?.times ?? 0);
  if (t.only === 'riskSeason') return ko ? `${name}(철마다)` : `${name} (in season)`;
  if (t.months) return ko ? `${name}(${monthsKo(t.months)})` : `${name} (${monthsEn(t.months)})`;
  if (t.afterPick) return ko ? `${name}(벨 때마다)` : `${name} (after each cut)`;
  if (t.startKinds?.length === 1 && t.startKinds[0] === 'seed') return ko ? `${name}(씨앗)` : `${name} (from seed)`;
  if (n > 1) return ko ? `${name} ${n}회` : `${name} ×${n}`;
  return name;
}

/** 상세 보기용 — 「지주 세우기 · 유인줄 묶기 2회 · 웃거름 5회 · 살균제 치기(철마다) · 병해 — 역병 · 탄저병 · 벌레 — 애벌레」 */
export function carePlanSummaryKo(crop: CropDef): string {
  const plan = carePlanOf(crop);
  const parts: string[] = [];
  for (const t of plan.tasks) {
    if (t.only === 'diseased') continue;
    parts.push(summaryPart(t, CARE_TASK_KO[t.id], true));
  }
  const ds = plan.diseases.filter((d) => DISEASE_DEFS[d].kind === 'disease');
  const ps = plan.diseases.filter((d) => DISEASE_DEFS[d].kind === 'pest');
  if (ds.length) parts.push(`병해 — ${ds.map((d) => DISEASE_KO[d]).join(' · ')}`);
  if (ps.length) parts.push(`벌레 — ${ps.map((d) => DISEASE_KO[d]).join(' · ')}`);
  if (plan.diseases.some((d) => DISEASE_DEFS[d].kind === 'bird')) parts.push('새 피해');
  return parts.join(' · ');
}
export function carePlanSummaryEn(crop: CropDef): string {
  const plan = carePlanOf(crop);
  const parts: string[] = [];
  for (const t of plan.tasks) {
    if (t.only === 'diseased') continue;
    parts.push(summaryPart(t, CARE_TASK_EN[t.id], false));
  }
  const ds = plan.diseases.filter((d) => DISEASE_DEFS[d].kind === 'disease');
  const ps = plan.diseases.filter((d) => DISEASE_DEFS[d].kind === 'pest');
  if (ds.length) parts.push(`Diseases — ${ds.map((d) => DISEASE_EN[d]).join(', ')}`);
  if (ps.length) parts.push(`Pests — ${ps.map((d) => DISEASE_EN[d]).join(', ')}`);
  if (plan.diseases.some((d) => DISEASE_DEFS[d].kind === 'bird')) parts.push('Bird damage');
  return parts.join(' · ');
}

/** 245차 — 든 것 알림 문장의 꼬리(병 = 생겼다 · 벌레 = 붙었다 · 새 = 쪼아 먹기 시작했다) */
export function diseaseOnsetKo(d: CropDisease): string {
  const k = DISEASE_DEFS[d].kind;
  if (k === 'bird') return '새가 쪼아 먹기 시작했다';
  return `${withGa(DISEASE_KO[d])} ${k === 'pest' ? '붙었다' : '생겼다'}`;
}
