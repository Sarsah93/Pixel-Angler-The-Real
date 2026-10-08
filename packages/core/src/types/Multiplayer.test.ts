/**
 * @file Multiplayer.test.ts
 * @description 거래 제안 정제(`sanitizeTradeItems` · `sanitizeTradeCoins`) — 서버와 받는 쪽이 같이 쓰는 계약 (vitest).
 * 빌드에서는 제외(tsconfig.build exclude).
 */
import { describe, expect, it } from 'vitest';
import {
  MP_TRADE_MAX_COINS, MP_TRADE_MAX_ITEMS, MP_TRADE_MAX_QTY, MP_TRADE_PAYLOAD_MAX_CHARS,
  sanitizeTradeCoins, sanitizeTradeItems,
} from './Multiplayer.js';

const line = (over: Record<string, unknown> = {}, payloadOver: Record<string, unknown> = {}) => ({
  srcId: 'inv_hook_3', name: '감성돔 바늘 3호', qty: 2, iconTexture: 'item_hook',
  payload: { id: 'inv_hook_3', name: '감성돔 바늘 3호', iconTexture: 'item_hook', category: 'tackle', basePrice: 500, ...payloadOver },
  ...over,
});

describe('sanitizeTradeItems', () => {
  it('정상 줄은 그대로 통과한다', () => {
    const out = sanitizeTradeItems([line()]);
    expect(out).not.toBeNull();
    expect(out![0]).toMatchObject({ srcId: 'inv_hook_3', name: '감성돔 바늘 3호', qty: 2, iconTexture: 'item_hook' });
    expect(out![0]!.payload.category).toBe('tackle');
  });

  it('빈 배열은 빈 제안이다', () => {
    expect(sanitizeTradeItems([])).toEqual([]);
  });

  it('배열이 아니면 거절한다', () => {
    expect(sanitizeTradeItems(undefined)).toBeNull();
    expect(sanitizeTradeItems({ length: 1 })).toBeNull();
    expect(sanitizeTradeItems('[]')).toBeNull();
  });

  it('줄 수가 넘으면 거절한다', () => {
    const many = Array.from({ length: MP_TRADE_MAX_ITEMS + 1 }, (_, i) => line({ srcId: `a${i}` }, { id: `a${i}` }));
    expect(sanitizeTradeItems(many)).toBeNull();
    expect(sanitizeTradeItems(many.slice(0, MP_TRADE_MAX_ITEMS))).toHaveLength(MP_TRADE_MAX_ITEMS);
  });

  it('수량은 1 이상의 정수만 받는다', () => {
    for (const qty of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MP_TRADE_MAX_QTY + 1, '2', null]) {
      expect(sanitizeTradeItems([line({ qty })])).toBeNull();
    }
    expect(sanitizeTradeItems([line({ qty: MP_TRADE_MAX_QTY })])).not.toBeNull();
  });

  it('payload가 객체가 아니거나 id가 srcId와 다르면 거절한다', () => {
    expect(sanitizeTradeItems([line({ payload: null })])).toBeNull();
    expect(sanitizeTradeItems([line({ payload: [] })])).toBeNull();
    expect(sanitizeTradeItems([line({ payload: 'x' })])).toBeNull();
    expect(sanitizeTradeItems([line({}, { id: 'inv_other' })])).toBeNull();
    expect(sanitizeTradeItems([line({}, { name: 42 })])).toBeNull();
  });

  it('표시 이름과 아이콘은 payload의 것으로 맞춘다', () => {
    const out = sanitizeTradeItems([line({ name: '황금 낚싯대', iconTexture: 'item_gold_rod' })]);
    expect(out![0]!.name).toBe('감성돔 바늘 3호');
    expect(out![0]!.iconTexture).toBe('item_hook');
  });

  it('같은 물건이 두 줄이면 거절한다', () => {
    expect(sanitizeTradeItems([line(), line()])).toBeNull();
  });

  it('너무 큰 payload는 거절한다', () => {
    expect(sanitizeTradeItems([line({}, { blob: 'x'.repeat(MP_TRADE_PAYLOAD_MAX_CHARS) })])).toBeNull();
  });

  it('이름의 줄바꿈 · 제어 문자는 공백으로 바꾼다', () => {
    const out = sanitizeTradeItems([line({}, { name: '바늘\n[단속] 가짜 줄' })]);
    expect(out![0]!.name).toBe('바늘 [단속] 가짜 줄');
  });
});

describe('sanitizeTradeCoins', () => {
  it('0 이상의 정수로 내린다', () => {
    expect(sanitizeTradeCoins(0)).toBe(0);
    expect(sanitizeTradeCoins(1500.9)).toBe(1500);
    expect(sanitizeTradeCoins(MP_TRADE_MAX_COINS)).toBe(MP_TRADE_MAX_COINS);
  });

  it('숫자가 아니거나 범위를 벗어나면 거절한다', () => {
    for (const v of [-1, Number.NaN, Number.POSITIVE_INFINITY, MP_TRADE_MAX_COINS + 1, '100', null, undefined]) {
      expect(sanitizeTradeCoins(v)).toBeNull();
    }
  });
});
