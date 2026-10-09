/**
 * @file ProduceMarket.ts
 * @description 236차 — 농산물 실시간 시세: 하루 한 번 받아 둔 KAMIS 소매가 → 작물별 「올해 출렁임」
 *
 * 정적 배포(gh-pages)에서는 브라우저가 KAMIS를 직접 부를 수 없다(CORS). 그래서
 *   GitHub Actions(`.github/workflows/kamis-snapshot.yml` · `tools/kamis_snapshot.mjs`)가 하루 한 번 받아
 *   `data-snapshots` 브랜치에 JSON으로 올리고, 클라이언트가 그 파일을 읽어 `setProduceMarket`으로 넣는다.
 *   코어는 네트워크를 모른다 — 받은 스냅샷을 판정만 한다.
 *
 * ## 무엇을 쓰나
 * - **오늘 값 ÷ 평년**(KAMIS 「평년」 = 지난 5년 같은 날 값에서 최고 · 최저를 뺀 3년 평균).
 *   평년 자체가 그 날짜의 철을 담고 있으므로 이 비는 **「올해가 예년보다 얼마나 비싼가」만** 남는다.
 *   게임 값 = 단가 × 달 지수(철) × **이 비** × 등급 — 이 비가 주간 출렁임(`producePriceShock`) 자리를 대신한다.
 * - 매핑이 없는 작물(마트에 없는 산나물 · 허브 등)과 자료가 빈 날은 종전대로 주간 출렁임을 쓴다.
 * - 너무 오래된 스냅샷(조사일이 `staleDays`보다 지난 것)은 버린다 — 지난 철 값이 이번 철에 붙지 않게.
 */

/** KAMIS 한 줄(품목 · 품종 · 등급) — 값은 원, 없으면 null */
export interface KamisPriceRow {
  /** 품종명(kind_name) — 예: 「가을(1포기)」 */
  kind: string;
  /** 등급(rank) — 「상품」 · 「중품」 */
  rank: string;
  /** 단위(unit) — 예: 「1포기」 · 「100g」 */
  unit: string;
  /** 조사일(당일) 값 */
  today: number | null;
  /** 평년(같은 날) 값 */
  normal: number | null;
  /** 1년 전 · 1개월 전(참고용 — 판정에는 쓰지 않는다) */
  yearAgo?: number | null;
  monthAgo?: number | null;
}

/** 하루치 스냅샷(`tools/kamis_snapshot.mjs`가 쓰는 형식) */
export interface ProduceMarketSnapshot {
  v: 1;
  /** 출처 표기 */
  source: string;
  /** 조사일(KST · YYYY-MM-DD) */
  regday: string;
  /** 받은 시각(ISO) */
  fetchedAt: string;
  /** 품목명(item_name) → 줄들 */
  items: Record<string, KamisPriceRow[]>;
}

/**
 * 작물 → KAMIS 소매 품목명 후보(앞이 우선) · 품종 거르개(kind_name에 이 말이 들어간 줄만).
 * KAMIS에 없는 품목이면 그날 자료가 비어 자동으로 주간 출렁임으로 돌아간다(이름이 틀려도 깨지지 않는다).
 */
export const KAMIS_CROP_ITEMS: Readonly<Record<string, { items: readonly string[]; kind?: string }>> = {
  lettuce: { items: ['상추'] },
  perilla: { items: ['깻잎'] },
  spinach: { items: ['시금치'] },
  crown_daisy: { items: ['쑥갓'] },
  young_radish: { items: ['열무'] },
  ugeolgari: { items: ['얼갈이배추'] },
  chive: { items: ['부추'] },
  scallion: { items: ['쪽파'] },
  water_parsley: { items: ['미나리'] },
  chili: { items: ['풋고추'], kind: '풋고추' },
  cherry_tomato: { items: ['방울토마토'] },
  cucumber: { items: ['오이'] },
  zucchini: { items: ['호박'], kind: '애호박' },
  eggplant: { items: ['가지'] },
  potato: { items: ['감자'] },
  sweet_potato: { items: ['고구마'] },
  radish: { items: ['무'] },
  napa_cabbage: { items: ['배추'] },
  carrot: { items: ['당근'] },
  garlic: { items: ['피마늘', '깐마늘(국산)'] },
  onion: { items: ['양파'] },
  leek: { items: ['대파'] },
  ginger: { items: ['생강'] },
  soybean: { items: ['콩'] },
  peanut: { items: ['땅콩'] },
  oyster_mushroom: { items: ['느타리버섯'] },
  bean_sprout: { items: ['콩나물'] },
  mung_sprout: { items: ['숙주나물', '숙주'] },
};

export const PRODUCE_MARKET_TUNING = {
  /** 오늘 ÷ 평년 비의 범위 — 한 품종의 이상치가 게임 경제를 흔들지 않게 */
  minRatio: 0.5,
  maxRatio: 2.0,
  /** 조사일이 이보다 오래된 스냅샷은 쓰지 않는다(일) */
  staleDays: 10,
};

const DAY_MS = 86_400_000;
const KST_MS = 9 * 3_600_000;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** 들어온 JSON이 스냅샷 모양인가(받은 파일 검사 — 깨진 파일은 버린다) */
export function isProduceMarketSnapshot(x: unknown): x is ProduceMarketSnapshot {
  if (!x || typeof x !== 'object') return false;
  const s = x as Partial<ProduceMarketSnapshot>;
  return s.v === 1 && typeof s.regday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.regday)
    && !!s.items && typeof s.items === 'object';
}

/** 조사일(KST 날짜)에서 지금까지 지난 날 수 */
export function snapshotAgeDays(s: Pick<ProduceMarketSnapshot, 'regday'>, nowMs: number): number {
  const [y, m, d] = s.regday.split('-').map(Number);
  const regMs = Date.UTC(y, m - 1, d) - KST_MS;   // 그날 KST 0시
  return Math.floor((nowMs - regMs) / DAY_MS);
}

/**
 * 이 작물의 「오늘 값 ÷ 평년」 — 자료가 없으면 null.
 * 같은 품목의 여러 줄(품종 · 등급)은 **상품 등급을 먼저** 보고, 남은 줄들의 비의 가운데 값을 쓴다.
 */
export function kamisRatioOf(snapshot: Pick<ProduceMarketSnapshot, 'items'>, cropId: string): number | null {
  const m = KAMIS_CROP_ITEMS[cropId];
  if (!m) return null;
  for (const name of m.items) {
    const rows = snapshot.items[name];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const ok = rows.filter((r) => (!m.kind || (r.kind ?? '').includes(m.kind))
      && typeof r.today === 'number' && r.today > 0 && typeof r.normal === 'number' && r.normal > 0);
    const top = ok.some((r) => r.rank === '상품') ? ok.filter((r) => r.rank === '상품') : ok;
    if (top.length === 0) continue;
    const ratios = top.map((r) => (r.today as number) / (r.normal as number)).sort((a, b) => a - b);
    const mid = ratios.length % 2
      ? ratios[(ratios.length - 1) / 2]
      : (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2;
    return clamp(mid, PRODUCE_MARKET_TUNING.minRatio, PRODUCE_MARKET_TUNING.maxRatio);
  }
  return null;
}

// ─────────────────────────────────────────────
// 지금 쓰는 스냅샷 — 클라이언트가 받아 넣는다
// ─────────────────────────────────────────────

let active: { ratios: Map<string, number>; regday: string } | null = null;

/**
 * 받은 스냅샷을 넣는다(null이면 비운다 — 주간 출렁임으로 돌아간다).
 * @returns 실제 값을 따르게 된 작물 수(오래됐거나 비었으면 0)
 */
export function setProduceMarket(s: ProduceMarketSnapshot | null, nowMs: number): number {
  if (!s || !isProduceMarketSnapshot(s) || snapshotAgeDays(s, nowMs) > PRODUCE_MARKET_TUNING.staleDays) {
    active = null;
    return 0;
  }
  const ratios = new Map<string, number>();
  for (const cropId of Object.keys(KAMIS_CROP_ITEMS)) {
    const r = kamisRatioOf(s, cropId);
    if (r !== null) ratios.set(cropId, r);
  }
  active = ratios.size ? { ratios, regday: s.regday } : null;
  return ratios.size;
}

/** 이 작물의 올해 출렁임(오늘 ÷ 평년) — 실제 자료가 없으면 null */
export function produceMarketRatio(cropId: string): number | null {
  return active?.ratios.get(cropId) ?? null;
}

/** 지금 쓰는 스냅샷의 조사일 · 덮는 작물 수 — 없으면 null */
export function produceMarketInfo(): { regday: string; crops: number } | null {
  return active ? { regday: active.regday, crops: active.ratios.size } : null;
}
