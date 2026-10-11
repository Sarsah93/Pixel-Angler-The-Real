/**
 * @file ProduceMarket.test.ts
 * @description 236차 — KAMIS 하루치 스냅샷 → 작물별 올해 출렁임(오늘 ÷ 평년) 시험.
 *   ⚠ 아래 값은 **시험용으로 지어낸 숫자**다(실제 시세가 아니다) — 판정 규칙만 본다.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  kamisRatioOf, setProduceMarket, produceMarketRatio, produceMarketInfo, isProduceMarketSnapshot, snapshotAgeDays,
  PRODUCE_MARKET_TUNING, type ProduceMarketSnapshot,
} from './ProduceMarket.js';
import { producePrice, FARM_TUNING, kstMonthOf } from '../simulation/FarmSim.js';
import { getCrop } from '../db-schema/CropDatabase.js';

const row = (kind: string, rank: string, today: number | null, normal: number | null) => ({ kind, rank, unit: '1포기', today, normal });

const snap = (regday: string, items: ProduceMarketSnapshot['items']): ProduceMarketSnapshot => ({
  v: 1, source: '시험', regday, fetchedAt: `${regday}T10:00:00Z`, items,
});

/** 2026-10-08 KST 정오 */
const NOW = Date.UTC(2026, 9, 8, 3);

afterEach(() => { setProduceMarket(null, NOW); });

describe('오늘 ÷ 평년', () => {
  it('상품 등급만 보고 가운데 값을 쓴다', () => {
    const s = snap('2026-10-08', {
      배추: [row('가을(1포기)', '상품', 6000, 4000), row('가을(1포기)', '중품', 3000, 3000), row('월동(1포기)', '상품', 4400, 4000)],
    });
    // 상품 두 줄의 비 1.5 · 1.1 → 가운데 1.3
    expect(kamisRatioOf(s, 'napa_cabbage')).toBeCloseTo(1.3, 5);
  });

  it('품종 거르개 — 풋고추 품목에서 「풋고추」 줄만', () => {
    const s = snap('2026-10-08', {
      풋고추: [row('꽈리고추(100g)', '상품', 3000, 1500), row('풋고추(100g)', '상품', 1200, 1000)],
    });
    expect(kamisRatioOf(s, 'chili')).toBeCloseTo(1.2, 5);
  });

  it('앞 후보가 비면 다음 후보 품목명 · 값이 빈 줄은 건너뛴다', () => {
    const s = snap('2026-10-08', {
      피마늘: [row('한지(1kg)', '상품', null, 9000)],
      '깐마늘(국산)': [row('깐마늘(1kg)', '상품', 9000, 10000)],
    });
    expect(kamisRatioOf(s, 'garlic')).toBeCloseTo(0.9, 5);
  });

  it('비는 범위 안으로 — 한 품종의 이상치가 경제를 흔들지 않게', () => {
    const s = snap('2026-10-08', { 배추: [row('여름(1포기)', '상품', 20000, 4000)], 무: [row('가을(1개)', '상품', 500, 4000)] });
    expect(kamisRatioOf(s, 'napa_cabbage')).toBe(PRODUCE_MARKET_TUNING.maxRatio);
    expect(kamisRatioOf(s, 'radish')).toBe(PRODUCE_MARKET_TUNING.minRatio);
  });

  it('매핑 없는 작물 · 품목이 없는 날은 null', () => {
    const s = snap('2026-10-08', { 배추: [row('가을(1포기)', '상품', 5000, 4000)] });
    expect(kamisRatioOf(s, 'gomchwi')).toBeNull();
    expect(kamisRatioOf(s, 'onion')).toBeNull();
  });
});

describe('스냅샷 넣기', () => {
  it('모양 검사 — 깨진 파일은 버린다', () => {
    expect(isProduceMarketSnapshot(null)).toBe(false);
    expect(isProduceMarketSnapshot({ v: 1, regday: '어제', items: {} })).toBe(false);
    expect(isProduceMarketSnapshot(snap('2026-10-08', {}))).toBe(true);
  });

  it('조사일 나이 — KST 날짜로 센다', () => {
    expect(snapshotAgeDays({ regday: '2026-10-08' }, NOW)).toBe(0);
    expect(snapshotAgeDays({ regday: '2026-10-01' }, NOW)).toBe(7);
  });

  it('오래된 스냅샷은 쓰지 않는다 — 주간 출렁임으로 돌아간다', () => {
    const items = { 배추: [row('가을(1포기)', '상품', 6000, 4000)] };
    expect(setProduceMarket(snap('2026-09-20', items), NOW)).toBe(0);
    expect(produceMarketRatio('napa_cabbage')).toBeNull();
    expect(setProduceMarket(snap('2026-10-07', items), NOW)).toBe(1);
    expect(produceMarketRatio('napa_cabbage')).toBeCloseTo(1.5, 5);
    expect(produceMarketInfo()).toEqual({ regday: '2026-10-07', crops: 1 });
  });

  it('파는 값 = 단가 × 달 지수 × (오늘 ÷ 평년) × 등급 — 주간 출렁임 자리를 대신한다', () => {
    const crop = getCrop('napa_cabbage')!;
    setProduceMarket(snap('2026-10-08', { 배추: [row('가을(1포기)', '상품', 6000, 4000)] }), NOW);
    const season = crop.price.season[kstMonthOf(NOW) - 1] ?? 1;
    const want = Math.max(10, Math.round((crop.price.base * season * 1.5 * FARM_TUNING.gradePrice.good * (crop.rebalance ?? 1)) / 10) * 10);
    expect(producePrice(crop.harvest.itemId, NOW)).toBe(want);
    // 덮지 않는 작물(곰취)은 그대로 주간 출렁임
    expect(produceMarketRatio('gomchwi')).toBeNull();
    expect(producePrice(getCrop('gomchwi')!.harvest.itemId, NOW)).toBeGreaterThan(0);
  });
});
