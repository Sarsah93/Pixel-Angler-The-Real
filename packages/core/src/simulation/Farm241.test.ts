/**
 * @file Farm241.test.ts
 * @description 241차 — 새 작물 5종 · 개량종 3종 · 날로 먹기 표의 정합 시험.
 */
import { describe, expect, it } from 'vitest';
import { CROP_DATABASE, getCrop, variantsOf, baseCropOf, variantUnlockKo, FARM_SUPPLIES, cropOfProduce } from '../db-schema/CropDatabase.js';
import { CROP_RAW_EAT, CROP_NO_RAW, rawEatStatus, allProduceBaseIds, RAW_EAT_ITEM_IDS, pieceItemId, rawEatLineKo } from '../db-schema/CropRawEatDatabase.js';
import { FOOD_NUTRITION, restoreFromNutrition } from '../db-schema/FoodNutrition.js';
import { carePlanOf, CARE_TASK_KO, STEVIA_ID } from '../db-schema/CropCareDatabase.js';
import { cropDailyValue, cropGate } from './FarmSim.js';
import { KAMIS_CROP_ITEMS } from '../rules/ProduceMarket.js';

describe('241차 — 새 작물 5종', () => {
  it('참외 · 수박 · 블루베리 · 토마토 · 딸기가 있고 칸 · 날 수익 상한(1,000원)을 지킨다', () => {
    for (const id of ['korean_melon', 'watermelon', 'blueberry', 'tomato', 'strawberry']) {
      const c = getCrop(id)!;
      expect(c, id).toBeDefined();
      for (const st of c.starts) expect(cropDailyValue(c, st.kind), `${id}/${st.kind}`).toBeLessThanOrEqual(1000);
    }
    expect(CROP_DATABASE.length).toBe(84);   // 242차 — 상추 품종 8 추가
  });
  it('241차 곡선은 연평균 1.00(±0.02) — 옥수수(P_CORN · 철 밖 추정)는 235차 그대로 1.12', () => {
    for (const c of CROP_DATABASE.filter((x) => ['korean_melon', 'watermelon', 'blueberry', 'tomato', 'strawberry', 'stevia_tomato', 'pumpkin_sweet_potato', 'cheongyang'].includes(x.id))) {
      const m = c.price.season.reduce((a, b) => a + b, 0) / 12;
      expect(Math.abs(m - 1), c.id).toBeLessThan(0.025);
    }
  });
  it('토마토는 고추처럼 씨앗을 집 안 트레이에 뿌리고(육묘) · 관리 표에 곁순 · 지주 · 병해 3종이 있다', () => {
    const t = getCrop('tomato')!;
    expect(t.starts.find((s) => s.kind === 'seed')?.nursery?.seedlingItemId).toBe('sdl_tomato');
    const plan = carePlanOf(t);
    expect(plan.tasks.map((x) => x.id)).toEqual(expect.arrayContaining(['stake', 'remove_suckers', 'tie', 'topdress', 'spray_fungicide']));
    expect(plan.tasks.map((x) => x.id)).not.toContain('pinch_flower');
    expect(plan.diseases).toHaveLength(3);
  });
  it('딸기는 겨울을 나고(overwinter) 블루베리는 여러해살이다 · 참외 · 수박은 까다로움(유기농업기능사)', () => {
    expect(getCrop('strawberry')!.overwinter).toBe(true);
    expect(getCrop('blueberry')!.perennial).toBe(true);
    expect(cropGate(getCrop('korean_melon')!).license).toBe('organic_farming');
    expect(cropGate(getCrop('watermelon')!).tier).toBe(3);
  });
  it('KAMIS 품목이 붙어 있다 — 참외 · 수박 · 토마토 · 딸기 · 호박고구마(품종) · 청양고추(품종)', () => {
    expect(KAMIS_CROP_ITEMS.korean_melon.items).toContain('참외');
    expect(KAMIS_CROP_ITEMS.pumpkin_sweet_potato.kind).toBe('호박');
    expect(KAMIS_CROP_ITEMS.cheongyang.kind).toBe('청양');
  });
});

describe('241차 — 개량종', () => {
  it('스테비아 토마토 · 호박고구마 · 청양고추는 원종을 3번 거둔 뒤 열린다', () => {
    expect(variantsOf('tomato').map((c) => c.id)).toEqual(['stevia_tomato']);
    expect(variantsOf('sweet_potato').map((c) => c.id)).toEqual(['pumpkin_sweet_potato']);
    expect(variantsOf('chili').map((c) => c.id)).toEqual(['cheongyang']);
    for (const c of CROP_DATABASE.filter((x) => x.variant)) {
      expect(baseCropOf(c), c.id).toBeDefined();
      expect(c.variant!.afterHarvests).toBe(3);
      expect(c.variant!.diffKo).not.toContain(' · ');   // 상세가 ` · `로 잇는 줄이 아니다 — 그래도 영어 규칙과 겹치지 않게
      expect(cropDailyValue(c, c.starts[0].kind), c.id).toBeLessThanOrEqual(1000);
    }
    expect(variantUnlockKo(getCrop('stevia_tomato')!, 1)).toBe('토마토를 3번 거두면 종묘사에 들어온다 (지금 1번)');
    expect(variantUnlockKo(getCrop('cheongyang')!, 3)).toContain('열렸다');
  });
  it('개량종은 원종보다 비싸고(1.3~1.8배) 청양고추는 고추 관리 표를 그대로 쓴다 · 스테비아 토마토는 발효액 4회(종묘사 자재)', () => {
    expect(getCrop('stevia_tomato')!.price.base / getCrop('tomato')!.price.base).toBeCloseTo(1.78, 1);
    expect(getCrop('pumpkin_sweet_potato')!.price.base / getCrop('sweet_potato')!.price.base).toBeCloseTo(1.3, 1);
    expect(getCrop('cheongyang')!.price.base / getCrop('chili')!.price.base).toBeCloseTo(1.25, 1);
    expect(carePlanOf(getCrop('cheongyang')!)).toEqual(carePlanOf(getCrop('chili')!));
    const stevia = carePlanOf(getCrop('stevia_tomato')!).tasks.find((t) => t.id === 'stevia_feed')!;
    expect(stevia.repeat?.times).toBe(3);
    expect(stevia.needs?.[0].itemId).toBe(STEVIA_ID);
    expect(FARM_SUPPLIES.find((s) => s.itemId === STEVIA_ID)?.shop).toBe('nursery');
    expect(CARE_TASK_KO.stevia_feed).not.toContain(' · ');
  });
});

describe('241차 — 날로 먹기', () => {
  it('수확물 기본 id는 전부 「먹는다」 또는 「못 먹는다」 중 하나에 있다(빠진 것 0 · 겹친 것 0)', () => {
    const ids = allProduceBaseIds();
    const missing = ids.filter((id) => !CROP_RAW_EAT[id] && !CROP_NO_RAW[id]);
    const both = ids.filter((id) => CROP_RAW_EAT[id] && CROP_NO_RAW[id]);
    expect(missing, missing.join(',')).toEqual([]);
    expect(both).toEqual([]);
    // 표에 있는 id는 전부 실제 수확물이어야 한다(오타 방지)
    for (const id of [...Object.keys(CROP_RAW_EAT), ...Object.keys(CROP_NO_RAW)]) expect(cropOfProduce(id), id).toBeDefined();
  });
  it('독성 · 생콩 · 버섯 · 생감자 · 토란 · 두릅은 못 먹고, 상추 · 오이 · 참외 · 풋고추는 먹는다', () => {
    for (const id of ['crop_potato', 'crop_taro', 'crop_soybean', 'crop_oyster_mushroom', 'crop_dureup', 'crop_eggplant', 'crop_bean_sprout']) expect(rawEatStatus(id)?.kind, id).toBe('no');
    for (const id of ['crop_lettuce', 'crop_cucumber', 'crop_korean_melon', 'crop_chili_green', 'crop_strawberry']) expect(rawEatStatus(id)?.kind, id).toBe('eat');
  });
  it('큰 단위(수박 · 무 · 배추 · 1kg 덩이 · 생땅콩)는 나눠야 먹는다 — 조각은 먹고, 등급 꼬리가 붙어도 같은 판정', () => {
    expect(rawEatStatus('crop_watermelon')?.kind).toBe('split');
    expect(rawEatStatus('crop_watermelon_sp')?.kind).toBe('split');
    expect(rawEatStatus(pieceItemId('crop_watermelon'))?.kind).toBe('eat');
    expect(rawEatStatus('crop_lettuce_nm')?.kind).toBe('eat');
    expect(rawEatStatus('crop_potato_sp')?.kind).toBe('no');
    expect(rawEatStatus('inv_can')).toBeNull();
    for (const [id, d] of Object.entries(CROP_RAW_EAT)) if (d.pieces) expect(d.pieces.count, id).toBeGreaterThan(1);
  });
  it('영양표에 올라 허기 · 수분이 파생된다 — 수박 한 쪽 수분 +37 · 청양고추는 수분이 준다(매움) · 생땅콩 한 줌 허기 +24', () => {
    expect(RAW_EAT_ITEM_IDS).toContain('crop_lettuce_sp');
    expect(RAW_EAT_ITEM_IDS).toContain('crop_watermelon_pc');
    expect(RAW_EAT_ITEM_IDS).not.toContain('crop_watermelon');
    expect(restoreFromNutrition(FOOD_NUTRITION.crop_watermelon_pc).hydrationRestore).toBe(37);
    expect(restoreFromNutrition(FOOD_NUTRITION.crop_cheongyang).hydrationRestore).toBeLessThan(0);
    expect(restoreFromNutrition(FOOD_NUTRITION.crop_peanut_pc).hungerRestore).toBe(24);
    expect(rawEatLineKo(CROP_RAW_EAT.crop_cheongyang)).toBe('허기 +0 · 수분 −2 — 몹시 맵다 — 물을 찾게 된다');
  });
});
