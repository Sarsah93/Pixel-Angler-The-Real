/**
 * @file CropCareDatabase.ts
 * @description 238차 — 관리 작업 표 · 병해 3종 · 농약 · 자재(사용자 제안 「까다로움을 딸깍이 아니라 실제 동작 · 과정 · 시간으로」)
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
 * 병해 3종(농진청 농사로 · 사용자 조사)
 *  - 역병: 장마 등 다습할 때 줄기 밑이 물에 데인 듯 썩고 포기 전체가 시든다. 배수 · 두둑 · 비 전후 약제 · 아인산 7~14일.
 *  - 탄저병: 6~9월 고온다습 · 열매에 생기며 빗물로 99% 번진다. 수량 손실 15~60%. 병든 열매 즉시 제거 · 7~10일 약제 · 멀칭.
 *  - 바이러스병(TSWV · CMV): 잎 모자이크 · 괴사 · 위축. 총채벌레 · 진딧물 매개충 방제 · 잡초 제거 · 병든 포기 뽑기.
 *
 * 다른 작물은 까다로운 점(`care`)에서 표를 뽑는다(`carePlanOf`) — 지주(`support`) · 열매 작물 병해(`pests`) · 웃거름.
 * 수량 기준: 작물 DB의 칸당 수량은 **제대로 관리한 밭**(웃거름 · 지주 · 방제)의 값이다 — 안 하면 깎이고(사용자 요구 「비료나 약이 아예 없어도
 * 수확은 되게」 — 웃거름 없이 0.7배), 세 병이 다 번지면 한 번에 한 개 날까 말까로 떨어진다(`FarmSim.harvestCell`).
 */

import type { CareTaskDef, CareTaskId, CareWorkKind, CropCarePlan, CropDef, CropDisease } from '../types/Farming.js';

// ─────────────────────────────────────────────
// 이름 · 설명(ko/en — i18n 런타임 사전이 읽는다)
// ─────────────────────────────────────────────

/** 작업 이름 — 화면은 ` · `로 잇는다: 이름 안에 ` · `를 넣지 않는다(237차 규칙 — 한 항목이 둘로 읽힌다) */
export const CARE_TASK_KO: Record<CareTaskId, string> = {
  prick_out: '가식', ridge_mulch: '두둑과 멀칭', stake: '지주 세우기', tie: '유인줄 묶기', water_establish: '활착기 물 주기',
  pinch_flower: '첫 꽃 따기', remove_suckers: '곁순 따기', topdress: '웃거름', spray_fungicide: '살균제 치기',
  spray_phosphite: '아인산 치기', spray_calcium: '칼슘액비 치기', spray_insecticide: '살충제 치기', cull_diseased: '병든 것 걷어 내기',
};
export const CARE_TASK_EN: Record<CareTaskId, string> = {
  prick_out: 'Prick out', ridge_mulch: 'Ridge and mulch', stake: 'Stake', tie: 'Tie up', water_establish: 'Water in (establishment)',
  pinch_flower: 'Pinch first flower', remove_suckers: 'Remove suckers', topdress: 'Top-dress', spray_fungicide: 'Spray fungicide',
  spray_phosphite: 'Spray phosphite', spray_calcium: 'Spray calcium', spray_insecticide: 'Spray insecticide', cull_diseased: 'Cull diseased',
};

/** 작업 장면 모양 → 사람 말(머리말) */
export const CARE_WORK_KO: Record<CareWorkKind, string> = {
  targets: '표시된 것을 하나씩 딴다', place: '표시된 자리에 차례로', tie: '띠 안에 들어올 때 묶는다',
  hold: '누르고 있다가 띠 안에서 뗀다', sprinkle: '포기 사이 표시된 자리에', tray: '싹을 넓은 트레이로 옮긴다',
};
export const CARE_WORK_EN: Record<CareWorkKind, string> = {
  targets: 'Pick off each marked spot', place: 'Set each marked spot in order', tie: 'Tie when the marker is inside the band',
  hold: 'Hold, then release inside the band', sprinkle: 'Scatter on the marked spots between plants', tray: 'Move each seedling to the wide tray',
};

export const DISEASE_KO: Record<CropDisease, string> = { blight: '역병', anthracnose: '탄저병', virus: '바이러스병' };
export const DISEASE_EN: Record<CropDisease, string> = { blight: 'Phytophthora blight', anthracnose: 'Anthracnose', virus: 'Virus' };
/** 증상 한 줄(상세 · 텃밭 창) */
export const DISEASE_SYMPTOM_KO: Record<CropDisease, string> = {
  blight: '줄기 밑이 물에 데인 듯 썩고 포기가 시든다 — 장마철 다습 · 물빠짐 나쁜 밭',
  anthracnose: '열매에 둥근 반점이 생겨 썩는다 — 6~9월 고온다습 · 빗물로 번진다',
  virus: '잎에 모자이크 무늬 · 위축 · 반점 — 총채벌레 · 진딧물이 옮긴다',
};
export const DISEASE_SYMPTOM_EN: Record<CropDisease, string> = {
  blight: 'Stem base rots as if scalded and the whole plant wilts — rainy-season damp, poorly drained beds',
  anthracnose: 'Round sunken spots rot the fruit — hot, humid June to September, spread by rain splash',
  virus: 'Mosaic patterns, stunting and spots on leaves — carried by thrips and aphids',
};
/** 어떻게 막나 · 고치나 */
export const DISEASE_CONTROL_KO: Record<CropDisease, string> = {
  blight: '두둑을 높이고 멀칭 · 비 전후 살균제 · 아인산 7~14일 간격 · 심하면 포기를 뽑는다',
  anthracnose: '병든 열매를 바로 따낸다 · 7~10일 간격 살균제 · 멀칭으로 흙이 튀지 않게 · 칼슘액비',
  virus: '총채벌레 · 진딧물을 살충제로 막는다 · 병든 포기는 뽑아 낸다',
};
export const DISEASE_CONTROL_EN: Record<CropDisease, string> = {
  blight: 'Raise the ridge and mulch, spray fungicide around rain, phosphite every 7–14 days, pull badly hit plants',
  anthracnose: 'Pick diseased fruit at once, fungicide every 7–10 days, mulch against soil splash, calcium foliar feed',
  virus: 'Keep thrips and aphids off with insecticide, pull infected plants',
};

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

// ─────────────────────────────────────────────
// 작업 정의(공용 조각)
// ─────────────────────────────────────────────

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
const fungicide: CareTaskDef = {
  id: 'spray_fungicide', dayWindow: [0, 200], repeat: { everyDays: 9, times: 24 }, needs: [{ itemId: FUNGICIDE_ID, qty: 1 }],
  work: 'hold', seconds: 8, fatigue: 3, only: 'riskSeason',
  effect: { protect: [{ disease: 'anthracnose', days: 10, mult: 0.25 }, { disease: 'blight', days: 10, mult: 0.35 }] },
  howKo: '장마철(6~7월)부터 비 오기 전후로 7~10일 간격 살균제를 친다 — 탄저병 · 역병 예방.',
  howEn: 'From the rainy season, spray fungicide every 7–10 days around rain — prevents anthracnose and blight.',
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
  effect: { protect: [{ disease: 'virus', days: 12, mult: 0.2 }] },
  howKo: '총채벌레 · 진딧물이 바이러스를 옮긴다 — 매개충을 막아야 바이러스병을 막는다.',
  howEn: 'Thrips and aphids carry the viruses — control the carriers to control the disease.',
};
const cull: CareTaskDef = {
  id: 'cull_diseased', dayWindow: [0, 400], repeat: { everyDays: 3, times: 120 },
  work: 'targets', seconds: 6, fatigue: 2, only: 'diseased',
  howKo: '병든 열매는 바로 따서 버리고, 시든 포기는 뽑아 낸다 — 두면 옆으로 번진다.',
  howEn: 'Pick and bin diseased fruit at once and pull wilted plants — left alone, it spreads.',
};
const mulch: CareTaskDef = {
  id: 'ridge_mulch', dayWindow: [0, 7], needs: [{ itemId: MULCH_ID, qty: 1 }],
  work: 'place', seconds: 8, fatigue: 4,
  effect: { diseaseMult: { blight: 0.6, anthracnose: 0.7 } },
  howKo: '물빠짐이 좋게 두둑을 높이고 검은 비닐로 덮는다 — 흙이 튀지 않아 탄저병 · 역병이 덜 든다.',
  howEn: 'Raise the ridge for drainage and cover with black plastic — no soil splash, less anthracnose and blight.',
};
const suckers = (window: [number, number]): CareTaskDef => ({
  id: 'remove_suckers', dayWindow: window, repeat: { everyDays: 10, times: 1 },
  work: 'targets', seconds: 8, fatigue: 3,
  missed: { yieldMult: 0.95, diseaseMult: { anthracnose: 1.3 } },
  howKo: '방아다리 아래 잎겨드랑이에서 나오는 곁순을 모두 딴다 — 바람이 통하고 위로 자란다.',
  howEn: 'Remove every sucker below the first fork — better airflow, growth goes upward.',
});

// ─────────────────────────────────────────────
// 작물별 표
// ─────────────────────────────────────────────

/** 육묘 트레이 칸(씨앗 → 모종)의 표 — 가식 한 번 */
export const NURSERY_PLAN: CropCarePlan = {
  diseases: [],
  tasks: [{
    id: 'prick_out', dayWindow: [10, 24], work: 'tray', seconds: 8, fatigue: 3,
    effect: { quality: 0.05 }, missed: { yieldMult: 0.6, quality: 0.1 },
    howKo: '파종 2주쯤 본잎이 나오면 50구 트레이로 한 포기씩 옮겨 심는다. 낮 22~30℃ · 밤 15℃ 이상을 지킨다.',
    howEn: 'About two weeks after sowing, when true leaves show, move each seedling to a 50-cell tray. Keep 22–30℃ by day, above 15℃ at night.',
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

export const CROP_CARE_PLANS: Readonly<Record<string, CropCarePlan>> = {
  chili: CHILI_PLAN,
};

/** 병해가 드는 철(월) — 역병 · 탄저병은 장마 · 고온다습(6~9월), 바이러스는 매개충이 느는 5~9월 */
export const DISEASE_SEASON: Record<CropDisease, readonly number[]> = {
  blight: [6, 7, 8, 9], anthracnose: [6, 7, 8, 9], virus: [5, 6, 7, 8, 9],
};
/** 방제 작업이 「할 일」로 보이는 철 */
export const RISK_SEASON: readonly number[] = [5, 6, 7, 8, 9];

const planCache = new Map<string, CropCarePlan>();

/**
 * 이 작물의 관리 표 — 표가 있으면 그것, 없으면 까다로운 점에서 뽑는다.
 *  - `support`: 지주 + 유인 2회(모종 포기 수만큼 지주대) · 토마토는 곁순도.
 *  - 열매 작물 + `pests`: 역병 · 탄저병 · 바이러스병 + 살균제 · 살충제 · 걷어 내기.
 *  - 열매 작물 · 긴 작물(겨울나기 · 여러해살이는 뺀다): 웃거름(15일 뒤 · 18일 간격 · 4회).
 *  - 열매 작물은 서리에 끝나고, 모종으로 심는 작물은 활착기 2주가 있다.
 * 잎 · 뿌리 작물의 벌레는 235차 품질 깎임 그대로(표가 비면 작업도 병도 없다).
 */
export function carePlanOf(crop: CropDef): CropCarePlan {
  const hit = CROP_CARE_PLANS[crop.id];
  if (hit) return hit;
  const cached = planCache.get(crop.id);
  if (cached) return cached;
  const care = crop.care ?? [];
  const fruit = crop.category === 'fruit';
  const seedling = crop.starts.find((s) => s.kind === 'seedling');
  const tasks: CareTaskDef[] = [];
  const diseases: CropDisease[] = [];
  if (care.includes('support')) {
    tasks.push(stake(Math.max(1, seedling?.perCell ?? 2)), tie);
    if (crop.id === 'cherry_tomato') tasks.push(suckers([14, 50]));
  }
  if (fruit && care.includes('pests')) {
    diseases.push('blight', 'anthracnose', 'virus');
    tasks.push(fungicide, insecticide, cull);
  }
  // 웃거름 — 열매 작물 · 긴 작물. 겨울을 나는 작물(마늘 · 양파 · 보리)과 여러해살이(산채 · 두릅 · 초피)는 심은 날 기준 차례가
  //   휴면 · 이듬해와 어긋나(놓침이 영영 남는다) 넣지 않는다(백로그 — 철 기준 차례)
  if ((fruit || care.includes('longSeason')) && !crop.overwinter && !crop.perennial) tasks.push(topdress(3));
  const plan: CropCarePlan = {
    tasks, diseases,
    ...(seedling ? { establishDays: 14 } : {}),
    ...(fruit && !crop.overwinter && !crop.perennial ? { frostEnds: true } : {}),
  };
  planCache.set(crop.id, plan);
  return plan;
}

/** 관리 작업이 있는 작물인가(텃밭 창 · 상세가 「손이 가는 일」 줄을 보인다) */
export function hasCarePlan(crop: CropDef): boolean {
  return carePlanOf(crop).tasks.length > 0;
}

/** 상세 보기용 — 「지주 1 · 유인 2 · 웃거름 5 · 살균제(철) …」 */
export function carePlanSummaryKo(crop: CropDef): string {
  const plan = carePlanOf(crop);
  const parts: string[] = [];
  for (const t of plan.tasks) {
    if (t.only === 'diseased') continue;
    const n = 1 + (t.repeat?.times ?? 0);
    const name = CARE_TASK_KO[t.id];
    parts.push(t.only === 'riskSeason' ? `${name}(철마다)` : n > 1 ? `${name} ${n}회` : name);
  }
  if (plan.diseases.length) parts.push(`병해 — ${plan.diseases.map((d) => DISEASE_KO[d]).join(' · ')}`);
  return parts.join(' · ');
}
