/**
 * @file WeightFormat332.test.ts
 * @description 332차 — 손질 산출물 무게 표기(1,000g부터 「18.3kg(18,269g)」) · 옛 이름 끝의 무게를 새 표기로.
 */
import { describe, it, expect } from 'vitest';
import { formatGramsKo, upgradeWeightSuffix } from './WeightFormat.js';
import { weightFromNameG } from '../rules/CarryWeight.js';

describe('332 — 손질 산출물 무게 표기', () => {
  it('1,000g 미만은 g 그대로 · 1,000g부터 kg(소수 한 자리) 뒤에 정확한 g', () => {
    expect(formatGramsKo(0)).toBe('0g');
    expect(formatGramsKo(850)).toBe('850g');
    expect(formatGramsKo(999)).toBe('999g');
    expect(formatGramsKo(1000)).toBe('1.0kg(1,000g)');
    expect(formatGramsKo(1234)).toBe('1.2kg(1,234g)');
    expect(formatGramsKo(18269)).toBe('18.3kg(18,269g)');   // 사용자 예시의 무게
    expect(formatGramsKo(123456)).toBe('123.5kg(123,456g)');
    expect(formatGramsKo(1049.6)).toBe('1.1kg(1,050g)');   // 반올림한 g에서 kg을 낸다
  });

  it('옛 이름 끝의 무게(쉼표 있음 · 없음)를 새 표기로 — 1,000g 미만 · 이미 새 표기 · 무게가 아닌 끝은 그대로', () => {
    expect(upgradeWeightSuffix('참다랑어 가마살 2,269g')).toBe('참다랑어 가마살 2.3kg(2,269g)');
    expect(upgradeWeightSuffix('참다랑어 머리 18269g')).toBe('참다랑어 머리 18.3kg(18,269g)');
    expect(upgradeWeightSuffix('껍질 붙은 참다랑어 등살 덩어리 (상) 12,480g')).toBe('껍질 붙은 참다랑어 등살 덩어리 (상) 12.5kg(12,480g)');
    expect(upgradeWeightSuffix('감성돔 머리 312g')).toBe('감성돔 머리 312g');
    expect(upgradeWeightSuffix('참다랑어 머리 18.3kg(18,269g)')).toBe('참다랑어 머리 18.3kg(18,269g)');
    expect(upgradeWeightSuffix('벵에돔 껍질')).toBe('벵에돔 껍질');
    expect(upgradeWeightSuffix('지그헤드 1000g짜리')).toBe('지그헤드 1000g짜리');
  });

  it('두 번 거쳐도 같다(불러올 때마다 거친다)', () => {
    const once = upgradeWeightSuffix('방어 척추뼈 1,902g');
    expect(upgradeWeightSuffix(once)).toBe(once);
  });

  it('짐 무게가 이름에서 무게를 읽을 때 새 표기도 같은 무게로 읽는다', () => {
    expect(weightFromNameG('참다랑어 머리 18.3kg(18,269g)')).toBe(18300);
    expect(weightFromNameG('참다랑어 머리 18,269g')).not.toBeNull();
  });
});
