/**
 * @file OilMill.ts
 * @description 284차 — 방앗간: 털어 둔 깨를 맡기면 기름을 짜 병에 담아 주고(180ml · 350ml), 들깨는 갈아 가루로, 참깨는 볶아 깨소금으로.
 *
 * 사용자 결정(2026-10-28): 「방앗간 가게로 하고 병은 180ml · 350ml 두 가지로」.
 *
 * 수율(조사 2026-10-28 — 방앗간 착유 후기 · 농진청 신품종 발표의 가운데 값):
 *  - 참깨 1kg ≈ 참기름 400ml · 한 말(6kg) ≈ 350ml 7~8병 · 한 되(1.2kg) ≈ 소주병 2병(많이 나온 쪽)
 *    → 350ml 한 병 ≈ **볶은 참깨 850g**(무게 착유율 약 37%).
 *  - 들깨 착유율 30~33%(농진청 「지안」 33.3% · 「다유」 약 30%) · 한 말(방앗간 5kg) ≈ 350ml 5~6병
 *    → 350ml 한 병 ≈ **볶은 들깨 950g**.
 *  - 기름 비중 0.92(350ml ≈ 322g). 깻묵 = 깨 − 볶을 때 날아간 물기(6%) − 기름.
 *  - 공임: 6kg에 2~3만 원 → kg당 4,000원 · 병값 따로(180ml 400원 · 350ml 600원).
 *  - 285차 — **생기름**(볶지 않고 저온으로 짠다): 볶으면 착유가 잘 된다(아마씨 볶음 · 저온압착 연구 — 볶은 쪽 수율이 높다).
 *    생으로 짜면 덜 나와 350ml 한 병에 참깨 1kg · 들깨 1.1kg 남짓(추정 — 볶은 것보다 15% 더) · 공임 kg당 5,000원 · 90분.
 *    값은 방앗간 목록 「냉압착 생들기름 350ml」이 볶은 것보다 조금 비싼 데서(국산 28,000원) — 냉장 보관이라 오래 못 둔다.
 *  - 285차 — **압맥**(보리 누르기): 보리를 김에 쪄 롤러로 누른다(압맥은 물을 빨리 먹고 빨리 익는다 — 한국식품과학회지 1987).
 *    1kg에 밑밥용 압맥 한 봉(가방의 「압맥 (눌린 보리)」 — 낚시점 · 마트가 파는 그것) · 공임 kg당 1,500원 · 30분.
 *
 * 순수 계산만 한다 — 맡기기 · 찾기 대기열과 아이템 템플릿은 클라이언트(`MillQueue` · `MillItems`).
 */

/** 병 크기(ml) */
export type OilBottleMl = 180 | 350;
export const OIL_BOTTLE_SIZES: readonly OilBottleMl[] = [180, 350];

/** 방앗간 일 — 기름 짜기 · 들깨 갈기 · 참깨 볶기 */
export type MillServiceId =
  | 'sesame_oil' | 'perilla_oil' | 'perilla_powder' | 'sesame_salt'
  | 'sesame_oil_raw' | 'perilla_oil_raw' | 'barley_press';

export const MILL_TUNING = {
  /** 기름 비중(g/ml) */
  oilDensity: 0.92,
  /** 볶을 때 날아가는 물기 · 껍질 부스러기 */
  roastLoss: 0.06,
  /** 기름 짜기 공임(원/kg) */
  oilFeePerKg: 4000,
  /** 갈기 · 볶기 공임(원/kg) */
  grindFeePerKg: 3000,
  /** 한 번 맡길 때 가장 적은 공임(원) */
  minFee: 1000,
  /** 병값(원) */
  bottleFee: { 180: 400, 350: 600 } as Record<OilBottleMl, number>,
  /** 맡기고 찾기까지(분 — 실제 시간) */
  oilWaitMin: 60,
  grindWaitMin: 20,
  /** 갈기 · 볶기는 100g 단위로 맡는다 */
  grindStepG: 100,
};

/** 1큰술(15ml) */
export const SPOON_ML = 15;

/** 기름병 한 가지 */
export interface OilBottleDef {
  itemId: string;
  nameKo: string;
  nameEn: string;
  ml: OilBottleMl;
  /** 병을 따면 나오는 큰술 수(요리 재료 한 단위 = 1큰술) */
  spoons: number;
  /** 병을 따면 나오는 1큰술 아이템(식자재마트 것과 같은 재료) */
  spoonItemId: string;
  /** 기준 값(원) — 식자재마트 · 식당이 이 값 × 신선도 × 0.7에 산다 */
  value: number;
  /** 285차 — 볶지 않고 짠 생기름(냉장 · 빨리 상한다) */
  raw?: boolean;
}

const bottle = (oil: 'sesame' | 'perilla', ml: OilBottleMl, value: number, raw = false): OilBottleDef => ({
  itemId: `oil_${oil}${raw ? '_raw' : ''}_${ml}`,
  nameKo: `${raw ? '생' : ''}${oil === 'sesame' ? '참기름' : '들기름'} (${ml}ml 병)`,
  nameEn: `${raw ? 'Cold-pressed ' : ''}${oil === 'sesame' ? (raw ? 'sesame oil' : 'Sesame oil') : (raw ? 'perilla oil' : 'Perilla oil')} (${ml}ml bottle)`,
  ml,
  spoons: Math.floor(ml / SPOON_ML),
  // 생기름도 따면 같은 1큰술 재료(요리에서는 같은 기름으로 친다 — 향만 순하다)
  spoonItemId: oil === 'sesame' ? 'cook_sesame_oil' : 'cook_perilla_oil',
  value,
  ...(raw ? { raw: true } : {}),
});

/**
 * 기름병 4가지. 값 = 국산 방앗간 참기름 350ml 3만 원대 · 들기름 2만 원대(2025 소매)에서 —
 * 깨를 봉지로 팔 때(참깨 850g ≈ 3만 원 · 들깨 950g ≈ 1.7만 원)보다 공임만큼 조금 더 받는다.
 */
export const OIL_BOTTLES: readonly OilBottleDef[] = [
  bottle('sesame', 180, 18000), bottle('sesame', 350, 35000),
  bottle('perilla', 180, 11500), bottle('perilla', 350, 22000),
  // 285차 — 생기름(냉압착) — 깨가 더 들고 공임이 비싸 값도 높다
  bottle('sesame', 180, 22000, true), bottle('sesame', 350, 42000, true),
  bottle('perilla', 180, 15000, true), bottle('perilla', 350, 28000, true),
];

export function oilBottleDef(itemId: string): OilBottleDef | undefined {
  return OIL_BOTTLES.find((b) => b.itemId === itemId);
}

/** 깻묵(기름을 짜고 남은 덩이 — g으로 센다). 유박 비료 · 밭에 넣는 밑거름 */
export const OILCAKE_ID = 'farm_oilcake';

/** 방앗간 일 한 가지 */
export interface MillServiceDef {
  id: MillServiceId;
  nameKo: string;
  nameEn: string;
  /** 맡기는 낱알(무게 수확물 기본 id — 등급 꼬리는 아무거나) */
  seedItemId: string;
  kind: 'oil' | 'grind';
  /** oil — 병 크기별 드는 볶은 깨(g) */
  seedPerBottle?: Record<OilBottleMl, number>;
  /** oil — 병 아이템 접두(`oil_sesame`) */
  bottlePrefix?: string;
  /** grind — 나오는 1큰술 아이템 · 1큰술 무게(g) · 남는 비율(압맥은 한 봉 = 1kg) */
  out?: { itemId: string; spoonG: number; keep: number };
  /** 285차 — 볶지 않는다(생기름 — 볶을 때 날아가는 물기가 없다) */
  raw?: boolean;
  /** 285차 — 맡는 단위(g) · 공임(원/kg) · 기다림(분)이 기본과 다를 때 */
  stepG?: number;
  feePerKg?: number;
  waitMin?: number;
  /** 285차 — 맡기는 낱알을 부르는 말(창 「드는 깨」 · 「드는 보리」) */
  inputKo?: string;
  inputEn?: string;
  /** 한 줄(가게 창 · 위키) */
  howKo: string;
  howEn: string;
}

/** 병 크기 → 드는 깨(g · 10g 단위) — 350ml 기준을 비례로 */
function perBottle(per350: number): Record<OilBottleMl, number> {
  return { 180: Math.round((per350 * 180) / 350 / 10) * 10, 350: per350 };
}

export const MILL_SERVICES: readonly MillServiceDef[] = [
  {
    id: 'sesame_oil', nameKo: '참기름 짜기', nameEn: 'Press sesame oil', seedItemId: 'crop_chamkkae', kind: 'oil',
    seedPerBottle: perBottle(850), bottlePrefix: 'oil_sesame',
    howKo: '참깨를 볶아 압착기로 짠다 — 350ml 한 병에 볶은 참깨 850g 남짓이 든다. 짜고 남은 깻묵도 돌려준다.',
    howEn: 'The sesame is roasted and pressed — a 350ml bottle takes about 850g of roasted seed. The leftover oil cake comes back too.',
  },
  {
    id: 'perilla_oil', nameKo: '들기름 짜기', nameEn: 'Press perilla oil', seedItemId: 'crop_deulkkae', kind: 'oil',
    seedPerBottle: perBottle(950), bottlePrefix: 'oil_perilla',
    howKo: '들깨를 살짝 볶아 짠다 — 350ml 한 병에 950g 남짓이 든다. 짜고 남은 깻묵도 돌려준다.',
    howEn: 'The perilla seed is lightly roasted and pressed — a 350ml bottle takes about 950g. The leftover oil cake comes back too.',
  },
  // ── 285차 — 생기름(볶지 않고 저온 압착) ──
  {
    id: 'sesame_oil_raw', nameKo: '생참기름 짜기', nameEn: 'Cold-press sesame oil', seedItemId: 'crop_chamkkae', kind: 'oil',
    seedPerBottle: perBottle(1000), bottlePrefix: 'oil_sesame_raw', raw: true, feePerKg: 5000, waitMin: 90,
    howKo: '참깨를 볶지 않고 낮은 온도로 천천히 짠다 — 덜 나와 350ml 한 병에 1kg 남짓이 든다. 향이 순하고 냉장해 두고 빨리 먹는다.',
    howEn: 'The sesame is pressed slowly at low heat without roasting — less comes out, about 1kg per 350ml bottle. Milder; keep it cold and use it soon.',
  },
  {
    id: 'perilla_oil_raw', nameKo: '생들기름 짜기', nameEn: 'Cold-press perilla oil', seedItemId: 'crop_deulkkae', kind: 'oil',
    seedPerBottle: perBottle(1100), bottlePrefix: 'oil_perilla_raw', raw: true, feePerKg: 5000, waitMin: 90,
    howKo: '들깨를 볶지 않고 저온 압착한다 — 350ml 한 병에 1.1kg 남짓. 나물에 날로 끼얹는 기름. 냉장해도 빨리 산패한다.',
    howEn: 'Perilla seed cold-pressed without roasting — about 1.1kg per 350ml bottle. Drizzled raw over greens. Goes rancid quickly even in the fridge.',
  },
  {
    id: 'perilla_powder', nameKo: '들깨 갈기', nameEn: 'Grind perilla seed', seedItemId: 'crop_deulkkae', kind: 'grind',
    out: { itemId: 'cook_perilla_powder', spoonG: 7, keep: 0.95 },
    howKo: '씻어 말린 들깨를 껍질째 곱게 간다 — 들깨가루는 나물 볶음 · 탕에 넣는다.',
    howEn: 'Washed and dried perilla seed is ground fine, husk and all — the powder goes into stir-fried greens and soups.',
  },
  {
    id: 'sesame_salt', nameKo: '참깨 볶기', nameEn: 'Roast sesame', seedItemId: 'crop_chamkkae', kind: 'grind',
    out: { itemId: 'cook_sesame_salt', spoonG: 8, keep: 1 - MILL_TUNING.roastLoss },
    howKo: '참깨를 고소하게 볶아 소금을 조금 넣고 반쯤 빻는다 — 깨소금은 나물 마무리에 뿌린다.',
    howEn: 'Sesame is roasted until nutty, then half-crushed with a pinch of salt — sesame salt finishes seasoned greens.',
  },
  // ── 285차 — 압맥(보리를 쪄서 눌러 납작하게) — 밑밥 재료 ──
  {
    id: 'barley_press', nameKo: '보리 누르기 (압맥)', nameEn: 'Roll barley (apmaek)', seedItemId: 'crop_barley', kind: 'grind',
    out: { itemId: 'inv_chum_apmac', spoonG: 1000, keep: 1 }, stepG: 1000, feePerKg: 1500, waitMin: 30, inputKo: '보리', inputEn: 'barley',
    howKo: '보리를 김에 쪄 롤러로 납작하게 누른다 — 1kg에 압맥 한 봉. 밑밥에 섞으면 천천히 가라앉으며 넓게 흩어진다.',
    howEn: 'Barley is steamed and pressed flat between rollers — one bag of rolled barley per kilo. Mixed into groundbait it sinks slowly and spreads wide.',
  },
];

/** 285차 — 갈기 · 볶기 · 누르기를 맡는 단위(g) */
export function millStepG(s: Pick<MillServiceDef, 'stepG'>): number {
  return s.stepG ?? MILL_TUNING.grindStepG;
}

export function millService(id: MillServiceId): MillServiceDef | undefined {
  return MILL_SERVICES.find((s) => s.id === id);
}

/** 방앗간에 맡긴 한 건의 결과 — 드는 깨 · 나오는 것 · 공임 · 찾을 때까지 */
export interface MillQuote {
  service: MillServiceId;
  /** 드는 낱알(g) */
  seedG: number;
  /** 나오는 것(아이템 id · 수 — 깻묵은 g) */
  outputs: { itemId: string; qty: number }[];
  /** 짠 기름(ml — 기름일 때) */
  oilMl: number;
  /** 공임 + 병값(원) */
  feeWon: number;
  /** 맡기고 찾기까지(분) */
  waitMin: number;
}

/**
 * 기름 짜기 견적 — 병 크기별 개수. 병이 하나도 없으면 null.
 * 깻묵(g) = 깨 × (1 − 볶음 손실) − 기름 무게.
 */
export function oilQuote(serviceId: MillServiceId, bottles: Partial<Record<OilBottleMl, number>>): MillQuote | null {
  const s = millService(serviceId);
  if (!s || s.kind !== 'oil' || !s.seedPerBottle || !s.bottlePrefix) return null;
  let seedG = 0, oilMl = 0, bottleFee = 0;
  const outputs: { itemId: string; qty: number }[] = [];
  for (const ml of OIL_BOTTLE_SIZES) {
    const n = Math.max(0, Math.floor(bottles[ml] ?? 0));
    if (n <= 0) continue;
    seedG += s.seedPerBottle[ml] * n;
    oilMl += ml * n;
    bottleFee += MILL_TUNING.bottleFee[ml] * n;
    outputs.push({ itemId: `${s.bottlePrefix}_${ml}`, qty: n });
  }
  if (seedG <= 0) return null;
  const cakeG = Math.max(0, Math.round(seedG * (1 - (s.raw ? 0 : MILL_TUNING.roastLoss)) - oilMl * MILL_TUNING.oilDensity));
  if (cakeG > 0) outputs.push({ itemId: OILCAKE_ID, qty: cakeG });
  const fee = Math.max(MILL_TUNING.minFee, Math.round((seedG / 1000) * (s.feePerKg ?? MILL_TUNING.oilFeePerKg) / 100) * 100) + bottleFee;
  return { service: serviceId, seedG, outputs, oilMl, feeWon: fee, waitMin: s.waitMin ?? MILL_TUNING.oilWaitMin };
}

/** 갈기 · 볶기 견적 — 맡기는 g(100g 단위로 내림). 한 큰술도 안 나오면 null */
export function grindQuote(serviceId: MillServiceId, grams: number): MillQuote | null {
  const s = millService(serviceId);
  if (!s || s.kind !== 'grind' || !s.out) return null;
  const step = millStepG(s);
  const seedG = Math.floor(Math.max(0, grams) / step) * step;
  const spoons = Math.floor((seedG * s.out.keep) / s.out.spoonG);
  if (seedG <= 0 || spoons <= 0) return null;
  const fee = Math.max(MILL_TUNING.minFee, Math.round((seedG / 1000) * (s.feePerKg ?? MILL_TUNING.grindFeePerKg) / 100) * 100);
  return { service: serviceId, seedG, outputs: [{ itemId: s.out.itemId, qty: spoons }], oilMl: 0, feeWon: fee, waitMin: s.waitMin ?? MILL_TUNING.grindWaitMin };
}

/** 가진 낱알(g)로 짤 수 있는 가장 많은 병 수(한 가지 크기만) */
export function maxBottles(serviceId: MillServiceId, ml: OilBottleMl, haveG: number): number {
  const s = millService(serviceId);
  const per = s?.seedPerBottle?.[ml];
  return per ? Math.floor(Math.max(0, haveG) / per) : 0;
}
