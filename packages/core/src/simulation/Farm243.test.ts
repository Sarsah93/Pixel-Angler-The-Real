/**
 * @file Farm243.test.ts
 * @description 243차 — 「한 팩」 수확물을 낱개로 거두고 가방에서 포장한다(사용자 결정 「수확할 때는 1개씩 따니까」).
 *  팩 정의 · 값(팩 = 낱개 × 수 · 낱개 판매 8할) · 하루 값 불변 · 날로 먹기(한 번에 여러 개 · 팩은 뜯어야) · 구세이브 이전 판정.
 */
import { describe, it, expect } from 'vitest';
import {
  CROP_DATABASE, getCrop, cropOfProduce, isProducePack, packOfLoose, looseOfPack, legacyPackItemId, produceItemId,
} from '../db-schema/CropDatabase.js';
import { CROP_RAW_EAT, rawEatStatus, rawEatLineKo, biteNutrition, allProduceBaseIds } from '../db-schema/CropRawEatDatabase.js';
import { FARM_TUNING, producePriceBase, roundWon, cropDailyValue } from './FarmSim.js';
import { restoreFromNutrition } from '../db-schema/FoodNutrition.js';

const PACKED = ['microgreens', 'oyster_mushroom', 'cherry_tomato', 'wood_ear', 'blueberry', 'strawberry'];

describe('243차 — 낱개 수확 · 포장', () => {
  it('팩 단위가 있는 작물은 6종이고, 팩 이름은 242차까지의 수확물 이름(「한 팩」)이다', () => {
    const withPack = CROP_DATABASE.filter((c) => c.harvest.pack).map((c) => c.id).sort();
    expect(withPack).toEqual([...PACKED].sort());
    for (const id of PACKED) {
      const c = getCrop(id)!;
      expect(c.harvest.pack!.nameKo, id).toMatch(/한 팩 \(\d+g\)$/);
      expect(c.harvest.nameKo, id).not.toMatch(/팩/);
      expect(c.harvest.pack!.units, id).toBeGreaterThanOrEqual(2);
      expect(c.harvest.pack!.itemId, id).toBe(`${c.harvest.itemId}_pack`);
    }
    // 낱개 · 팩 아닌 수확물에는 팩 이름이 없다
    for (const c of CROP_DATABASE.filter((x) => !x.harvest.pack)) expect(c.harvest.nameKo, c.id).not.toMatch(/한 팩/);
  });

  it('팩 id는 작물로 찾히고 등급 꼬리가 낱개와 같은 규칙이다', () => {
    expect(cropOfProduce('crop_strawberry_pack')?.id).toBe('strawberry');
    expect(cropOfProduce('crop_strawberry_pack_sp')?.id).toBe('strawberry');
    expect(isProducePack('crop_blueberry_pack_nm')).toBe(true);
    expect(isProducePack('crop_blueberry_nm')).toBe(false);
    expect(packOfLoose('crop_strawberry_sp')).toMatchObject({ packItemId: 'crop_strawberry_pack_sp', grade: 'special' });
    expect(packOfLoose('crop_lettuce')).toBeNull();
    expect(looseOfPack('crop_cherry_tomato_pack_nm')).toMatchObject({ looseItemId: 'crop_cherry_tomato_nm', units: 20 });
    expect(looseOfPack('crop_cherry_tomato')).toBeNull();
  });

  it('팩 값 = 낱개 기준가 × 낱개 수(242차 팩 값과 같다) · 낱개로 팔면 8할', () => {
    const OLD_PACK: Record<string, number> = { microgreens: 1500, oyster_mushroom: 2000, cherry_tomato: 2500, wood_ear: 1500, blueberry: 3000, strawberry: 8000 };
    for (const id of PACKED) {
      const c = getCrop(id)!;
      expect(producePriceBase(c, c.harvest.pack!.itemId), id).toBe(OLD_PACK[id]);
      expect(producePriceBase(c, c.harvest.itemId), id).toBeCloseTo(c.price.base * FARM_TUNING.looseSellMult, 6);
    }
    // 포장 단위가 없는 작물은 그대로
    const lettuce = getCrop('lettuce')!;
    expect(producePriceBase(lettuce, 'crop_lettuce')).toBe(lettuce.price.base);
  });

  it('칸 · 날 값은 단위를 바꿔도 그대로다(242차 팩 기준과 같다)', () => {
    const OLD_DAILY_QTY: Record<string, [number, number]> = { microgreens: [2, 3], oyster_mushroom: [1, 1], cherry_tomato: [2, 4], wood_ear: [2, 3], blueberry: [2, 4], strawberry: [1, 1] };
    for (const id of PACKED) {
      const c = getCrop(id)!;
      const [a, b] = OLD_DAILY_QTY[id];
      const oldValuePerPick = ((a + b) / 2) * c.price.base * c.harvest.pack!.units;
      const newValuePerPick = ((c.harvest.qtyPerCell[0] + c.harvest.qtyPerCell[1]) / 2) * c.price.base;
      expect(newValuePerPick, id).toBeCloseTo(oldValuePerPick, 6);
      for (const st of c.starts) expect(cropDailyValue(c, st.kind), `${id}/${st.kind}`).toBeLessThanOrEqual(1000);
    }
  });

  it('값 반올림 — 100원 이상은 10원 · 그 아래는 1원', () => {
    expect(roundWon(1234)).toBe(1230);
    expect(roundWon(48)).toBe(48);
    expect(roundWon(0.2)).toBe(1);
  });

  it('작은 낱개는 한 번에 여러 개를 먹고(허기 · 수분이 0이 되지 않는다), 팩은 뜯어야 먹는다', () => {
    for (const id of ['crop_strawberry', 'crop_cherry_tomato', 'crop_blueberry']) {
      const def = CROP_RAW_EAT[id];
      expect(def.bite, id).toBeDefined();
      const r = restoreFromNutrition(biteNutrition(def));
      expect(r.hungerRestore + r.hydrationRestore, id).toBeGreaterThan(0);
      expect(rawEatLineKo(def), id).toMatch(/에 허기 \+\d+ · 수분 \+\d+/);
    }
    const st = rawEatStatus('crop_strawberry_pack_sp');
    expect(st).toMatchObject({ kind: 'pack', looseBaseId: 'crop_strawberry', units: 25, edible: true });
    expect(rawEatStatus('crop_oyster_mushroom_pack')).toMatchObject({ kind: 'pack', edible: false });
    expect(rawEatStatus('crop_strawberry')?.kind).toBe('eat');
    // 팩은 수확물 기본 id 목록(날로 먹기 전수 시험)에 들지 않는다 — 낱개 판정을 잇는다
    expect(allProduceBaseIds().some((x) => x.endsWith('_pack'))).toBe(false);
  });

  it('구세이브 이전 — 「한 팩」 이름으로 저장된 낱개 id만 팩으로 옮긴다', () => {
    expect(legacyPackItemId('crop_strawberry', '딸기 한 팩 (500g) · 상')).toBe('crop_strawberry_pack');
    expect(legacyPackItemId('crop_cherry_tomato_sp', '방울토마토 한 팩 (250g) · 특')).toBe(produceItemId('crop_cherry_tomato_pack', 'special'));
    expect(legacyPackItemId('crop_strawberry', '딸기 (1개) · 상')).toBeNull();
    expect(legacyPackItemId('crop_lettuce', '상추 한 줌 (100g) · 상')).toBeNull();
    expect(legacyPackItemId('crop_strawberry_pack', '딸기 한 팩 (500g) · 상')).toBeNull();
  });
});
