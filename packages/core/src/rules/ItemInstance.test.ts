/**
 * @file ItemInstance.test.ts
 * @description 282차 — 개체 아이템 id(`<카탈로그 id>#<번호>`)와 카탈로그 조회 정규화 시험
 */
import { describe, expect, it } from 'vitest';
import { itemBaseId, isInstanceId, makeInstanceId, instanceNumberOf, sameItemKind } from './ItemInstance.js';
import { getLureSpec } from '../db-schema/LuresCatalogDB.js';
import { isKnifeItem, getBestKnife } from '../db-schema/KnifeDatabase.js';
import { rodSpecFor, reelSpecFor, getRodCatalogEntry, ROD_SPEC_BY_ID } from '../db-schema/RodCatalog.js';

describe('개체 id', () => {
  it('번호를 붙이고 뗀다', () => {
    const id = makeInstanceId('lure_spoon_14', 3);
    expect(id).toBe('lure_spoon_14#3');
    expect(isInstanceId(id)).toBe(true);
    expect(itemBaseId(id)).toBe('lure_spoon_14');
    expect(instanceNumberOf(id)).toBe(3);
    // 다른 개체 id에 번호를 다시 붙여도 꼬리가 겹치지 않는다
    expect(makeInstanceId(id, 9)).toBe('lure_spoon_14#9');
  });
  it('번호 없는 id는 그대로다', () => {
    expect(itemBaseId('inv_krill')).toBe('inv_krill');
    expect(isInstanceId('inv_krill')).toBe(false);
    expect(instanceNumberOf('inv_krill')).toBeNull();
    expect(sameItemKind('knife_sashimi#1', 'knife_sashimi#7')).toBe(true);
    expect(sameItemKind('knife_sashimi#1', 'knife_utility#1')).toBe(false);
  });
});

describe('카탈로그 조회는 번호를 떼고 찾는다', () => {
  it('루어 제원', () => {
    expect(getLureSpec('lure_spoon_14#2')?.id).toBe('lure_spoon_14');
    expect(getLureSpec('lure_spoon_14#2')?.weightG).toBe(getLureSpec('lure_spoon_14')?.weightG);
  });
  it('회칼', () => {
    expect(isKnifeItem('knife_sashimi#4')).toBe(true);
    expect(getBestKnife(['knife_utility#1', 'knife_yanagiba#2'])?.id).toBe('knife_yanagiba');
  });
  it('낚싯대 · 릴 제원', () => {
    const rodId = Object.keys(ROD_SPEC_BY_ID)[0];
    expect(rodSpecFor(`${rodId}#5`)).toEqual(rodSpecFor(rodId));
    expect(reelSpecFor('inv_reel#2')).toEqual(reelSpecFor('inv_reel'));
    const shopRod = Object.keys(ROD_SPEC_BY_ID).find((k) => getRodCatalogEntry(k));
    if (shopRod) expect(getRodCatalogEntry(`${shopRod}#1`)?.id).toBe(shopRod);
  });
});
