/**
 * @file BigGame324.test.ts
 * @description 324차 — 해역별 참다랑어 크기 · 체급 보정 · 새치류 · 새 어종 3 · 큰 고기용 장비 · 줄 · 릴 · 대 궁합 · 가방 무게 · 과적 4단계
 */
import { describe, it, expect } from 'vitest';
import { TUNING } from '../config/tuning.js';
import { ORACLE_FISH_DB, fishSizeModeFor, spawnFish, type SpawnContext } from '../simulation/FishSpawningOracle.js';
import { fightGroupOf, fightBurstMult, fightBodyFormOf, fishRarity } from '../simulation/FishRarity.js';
import {
  fightEscapeScale, fightSubdueBonusCap, staminaMaxFor, secondWindCount, rollSecondWind, FishFatigueModel,
} from '../simulation/FishFatigueModel.js';
import { FightingPhase } from '../simulation/FightingPhase.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import { SEAFOOD_AUCTION_MAPPING } from '../types/Economy.js';
import { BUTCHERY_PROFILES, BUTCHERY_WIRED_SPECIES } from '../db-schema/ButcheryProfiles.js';
import { evaluateFishSellPrice } from '../simulation/MarketPriceEvaluator.js';
import {
  ROD_SHOP, REEL_SHOP, BIG_GAME_ROD_SHOP, BIG_GAME_REEL_SHOP, rodSpecFor, reelSpecFor, getRodCatalogEntry, isBigGameGear,
} from '../db-schema/RodCatalog.js';
import {
  ROD_USE_LABEL, ROD_USE_CAST, reelLineCapacityM, reelHoldsLine, rodDragFit, rodLineFit, reelFitsRod, reelSpoolDiamCm, REEL_MIN_LINE_M,
  reelRetrieveMps, reelFloorK,
} from '../simulation/RodFit.js';
import { rodMaxCasts } from '../db-schema/GearDurability.js';
import { LURES_CATALOG_DB } from '../db-schema/LuresCatalogDB.js';
import { PE_LINE_KG_PER_HO, MONO_LINE_KG_PER_HO } from './LineStrength.js';
import {
  itemUnitWeightG, itemStackWeightG, carriedWeightG, encumbranceOf, weightFromNameG, lineMassG, reelWeightG, carryWeightText, haulFeeWon,
  type CarryWeightItem,
} from './CarryWeight.js';

const sp = (id: string) => ORACLE_FISH_DB.find((s) => s.speciesId === id)!;
const kgAt = (id: string, cm: number): number => { const s = sp(id); return s.lwrA * Math.pow(cm, s.lwrB ?? 3) / 1000; };
/** 패턴에 맞게 답했을 때(여 박기에 버티기 = 0.6배)의 최대 요구 장력(kg) — `FightingPhase.updateTensionPhysical`과 같은 식 */
const skilledDemandKg = (id: string, cm: number): number => {
  const P = TUNING.fightPhys;
  const form = P.form[fightBodyFormOf(id)];
  return kgAt(id, cm) * (P.staticFrac * form.staticMult + fightBurstMult(id, cm) * form.burst * P.pullDive * P.goodResponseMult);
};
/** 그 요구 장력에 충격 파단이 나지 않는 줄 세기(kg) */
const lineNeedKg = (id: string, cm: number): number => skilledDemandKg(id, cm) / TUNING.fightPhys.shockBreakFrac;

describe('324 — 해역별 참다랑어 크기', () => {
  it('제주 · 남해 · 서해는 어린 고기(평균 80cm · 30kg 미만), 동해 · 울릉은 큰 고기(평균 180cm · 100kg급)', () => {
    const o = sp('bluefin_tuna');
    const jeju = fishSizeModeFor(o, 'jeju_seogwipo'), east = fishSizeModeFor(o, 'gangwon_sokcho');
    expect(jeju.meanCm).toBe(80); expect(jeju.maxCm).toBe(125);
    expect(kgAt('bluefin_tuna', jeju.meanCm)).toBeLessThan(12);
    expect(kgAt('bluefin_tuna', jeju.maxCm)).toBeLessThan(40);
    expect(east.meanCm).toBe(180); expect(east.minCm).toBe(130);
    expect(kgAt('bluefin_tuna', east.meanCm)).toBeGreaterThan(100);
    expect(kgAt('bluefin_tuna', east.meanCm)).toBeLessThan(150);
    // 기준 평균(희귀도 · 체급 보정의 기준)은 그대로 110cm
    expect(o.meanCm).toBe(110);
  });

  it('해역 표가 없는 어종은 제 분포를 그대로 쓴다', () => {
    const o = sp('black_seabream');
    expect(fishSizeModeFor(o, 'jeju_seogwipo')).toBe(o);
    expect(fishSizeModeFor(o, undefined)).toBe(o);
  });

  it('실제로 낚이는 크기 — 속초는 130cm 이상, 서귀포는 125cm 이하만(참다랑어만 나오게 걸러 300마리씩)', () => {
    const ctx = (region: string): SpawnContext => ({
      depthZ: 5, zMax: 60, region, tidePhase: 7, month: 8, baitKey: 'lure', inReef: false, isNight: false,
      speciesFilter: ['bluefin_tuna'],
    });
    const sizes = (region: string): number[] => Array.from({ length: 300 }, () => spawnFish(ctx(region)))
      .filter((f) => f.speciesId === 'bluefin_tuna').map((f) => f.lengthCm);
    const east = sizes('gangwon_sokcho'), jeju = sizes('jeju_seogwipo');
    expect(east.length).toBe(300); expect(jeju.length).toBe(300);
    for (const cm of east) { expect(cm).toBeGreaterThanOrEqual(130); expect(cm).toBeLessThanOrEqual(270); }
    for (const cm of jeju) { expect(cm).toBeGreaterThanOrEqual(50); expect(cm).toBeLessThanOrEqual(125); }
    const mean = (a: number[]): number => a.reduce((x, y) => x + y, 0) / a.length;
    expect(mean(east)).toBeGreaterThan(165); expect(mean(east)).toBeLessThan(195);
    expect(mean(jeju)).toBeGreaterThan(70); expect(mean(jeju)).toBeLessThan(92);
  });
});

describe('324 — 체급 보정 · 새치류', () => {
  it('어종군 — 눈다랑어는 참치류, 황새치 · 청새치는 새치류', () => {
    expect(fightGroupOf('bigeye_tuna')).toBe('tuna');
    expect(fightGroupOf('swordfish')).toBe('billfish');
    expect(fightGroupOf('striped_marlin')).toBe('billfish');
    expect(TUNING.fightPhys.burst.billfish).toBeLessThan(TUNING.fightPhys.burst.tuna);
  });

  it('기준 체장 이하는 그대로, 그보다 크면 (기준/체장)^1.5로 준다 · 기준 없는 군은 늘 그대로', () => {
    expect(fightBurstMult('bluefin_tuna', 80)).toBe(5);
    expect(fightBurstMult('bluefin_tuna', 110)).toBe(5);
    expect(fightBurstMult('bluefin_tuna', 180)).toBeCloseTo(5 * Math.pow(110 / 180, 1.5), 6);
    expect(fightBurstMult('bluefin_tuna')).toBe(5);
    expect(fightBurstMult('greater_amberjack', 95)).toBe(5.5);
    expect(fightBurstMult('greater_amberjack', 160)).toBeLessThan(5.5);
    expect(fightBurstMult('black_seabream', 70)).toBe(TUNING.fightPhys.burst.seabream);
  });

  it('줄 급 — 합사 4호는 110cm까지, 8호가 100kg급의 시작, 12호면 200cm까지(패턴에 맞게 답했을 때)', () => {
    const pe = (no: number): number => no * PE_LINE_KG_PER_HO;
    expect(lineNeedKg('bluefin_tuna', 110)).toBeLessThan(pe(4));       // 평균 25kg — 옛 가장 굵은 줄로 된다
    expect(lineNeedKg('bluefin_tuna', 150)).toBeGreaterThan(pe(4));    // 64kg — 옛 줄로는 안 된다
    expect(lineNeedKg('bluefin_tuna', 150)).toBeLessThan(pe(6));
    expect(lineNeedKg('bluefin_tuna', 180)).toBeLessThan(pe(8));       // 111kg — 합사 8호가 시작
    expect(lineNeedKg('bluefin_tuna', 200)).toBeLessThan(pe(10));
    expect(lineNeedKg('bluefin_tuna', 230)).toBeLessThanOrEqual(pe(12) + 0.5);   // 231kg — 12호가 끝
    expect(lineNeedKg('bluefin_tuna', 270)).toBeGreaterThan(pe(12));   // 기록급은 못 올린다
    // 새치 — 평균 황새치(전장 230cm · 75kg)는 6~8호, 3m는 10호
    expect(lineNeedKg('swordfish', 230)).toBeLessThan(pe(8));
    expect(lineNeedKg('swordfish', 300)).toBeLessThan(pe(10) + 1);
    expect(lineNeedKg('striped_marlin', 250)).toBeLessThan(pe(6));
    // 대잿방어 2m · 100kg — 8호
    expect(lineNeedKg('greater_amberjack', 200)).toBeLessThan(pe(8));
    // 돌돔 · 강담돔 — 굵은 나일론 16호(29kg)면 실수해도 안 터진다
    const P = TUNING.fightPhys;
    const worst = (id: string, cm: number): number => kgAt(id, cm) * (P.staticFrac * P.form[fightBodyFormOf(id)].staticMult
      + fightBurstMult(id, cm) * P.form[fightBodyFormOf(id)].burst * P.badResponseMult) / P.shockBreakFrac;
    expect(worst('stone_beakperch', 70)).toBeLessThan(16 * MONO_LINE_KG_PER_HO);
    expect(worst('stone_beakperch', 70)).toBeGreaterThan(5 * MONO_LINE_KG_PER_HO);   // 찌낚시 5호 목줄로는 실수 한 번에 터진다
  });
});

describe('324 — 긴 싸움의 탈출 확률 · 드랙이 약한 채비의 안전대', () => {
  it('탈출 배수 — 부시리 · 잿방어 95cm급까지 1, 큰 고기는 √(기준 ÷ 스태미나 풀)', () => {
    expect(fightEscapeScale('black_seabream', 1.2)).toBe(1);
    expect(fightEscapeScale('yellowtail', kgAt('yellowtail', 90))).toBe(1);
    expect(fightEscapeScale('amberjack', kgAt('amberjack', 95))).toBe(1);
    const tuna = fightEscapeScale('bluefin_tuna', kgAt('bluefin_tuna', 180));
    // 대응만으로 제압되지 않는 체급은 싸움이 길다 — √(탈출 기준 ÷ 풀) × (제압 기준 ÷ 풀)
    expect(tuna).toBeGreaterThan(0.15); expect(tuna).toBeLessThan(0.25);
    const pool = staminaMaxFor('bluefin_tuna', kgAt('bluefin_tuna', 180));
    expect(tuna).toBeCloseTo(Math.sqrt(TUNING.fightPhys.escapeRefStamina / pool) * (TUNING.fightPhys.subdueRefStamina / pool), 6);
    // 참다랑어 110cm(25kg)급까지는 √ 몫만 걸린다(301(2) 기준 체급은 그대로)
    const p110 = staminaMaxFor('bluefin_tuna', kgAt('bluefin_tuna', 110));
    expect(fightEscapeScale('bluefin_tuna', kgAt('bluefin_tuna', 110))).toBeCloseTo(Math.sqrt(TUNING.fightPhys.escapeRefStamina / p110), 6);
    // 더 큰 고기일수록 더 낮다 · 어린 참다랑어(80cm)는 조금만 낮다
    expect(fightEscapeScale('bluefin_tuna', kgAt('bluefin_tuna', 230))).toBeLessThan(tuna);
    expect(fightEscapeScale('bluefin_tuna', kgAt('bluefin_tuna', 80))).toBeGreaterThan(0.85);
  });

  it('안전대 — 드랙이 줄보다 훨씬 약하면(합사 12호 108kg · 드랙 30kg) 드랙이 허락하는 장력에서 감아도 「안전대 릴링」으로 제압이 쌓인다', () => {
    const mk = (lineCapacityKg: number): FightingPhase => new FightingPhase({
      powerFactor: 0.8, tackleA: 0.6, patternWeights: { jump: 0, dive: 1, lateral: 0 }, intervalMult: 1, mouthFragility: 0,
      weightKg: 110, burstMult: 2.4, bodyForm: 'fusiform', lineCapacityKg, reelDragKg: 30, baseEscapePerSec: 0,
    });
    // 여 박기에는 버티고 그 밖에는 감는다 — 20초
    const run = (f: FightingPhase): { under: number; subdue: number; event: string } => {
      let under = 0, n = 0, subdue = 0, event = 'none';
      for (let i = 0; i < 400 && event === 'none'; i++) {
        const dive = f.pattern === 'dive';
        const st = f.update({ dtSec: 0.05, holding: dive, reeling: !dive, thrustGate: 1, fatigueRatio: 1, landProgress: 0 });
        n++; if (st.tension < 30) under++;
        subdue = st.subdue; event = st.event;
      }
      return { under: under / n, subdue, event };
    };
    const r = run(mk(108));
    expect(r.event).toBe('none');                 // 줄이 터지지 않는다
    expect(r.under).toBeGreaterThan(0.7);         // 게이지는 거의 내내 옛 안전대(30) 아래다 — 드랙 30kg ÷ 108kg = 28%에서 멎는다
    expect(r.subdue).toBeGreaterThan(50);         // 그래도 제압은 온전히 쌓인다(보정이 없으면 안전대 밖이라 0.28배)
  });
});

describe('324 — 큰 고기는 대응만으로 제압되지 않는다', () => {
  it('대응 몫 상한 — 참다랑어 110cm(25kg)급까지 100, 큰 고기는 √(기준 ÷ 스태미나 풀)', () => {
    expect(fightSubdueBonusCap('black_seabream', 1.2)).toBe(100);
    expect(fightSubdueBonusCap('yellowtail', kgAt('yellowtail', 110))).toBe(100);
    expect(fightSubdueBonusCap('greater_amberjack', kgAt('greater_amberjack', 130))).toBe(100);
    expect(fightSubdueBonusCap('bluefin_tuna', kgAt('bluefin_tuna', 110))).toBe(100);
    const t180 = fightSubdueBonusCap('bluefin_tuna', kgAt('bluefin_tuna', 180));
    expect(t180).toBeGreaterThan(60); expect(t180).toBeLessThan(70);
    expect(fightSubdueBonusCap('bluefin_tuna', kgAt('bluefin_tuna', 200))).toBeLessThan(t180);
    expect(fightSubdueBonusCap('swordfish', kgAt('swordfish', 230))).toBeLessThan(75);
  });

  it('111kg 참다랑어 — 생생할 때는 정대응을 아무리 이어도 제압되지 않고, 지치면 제압된다', () => {
    const cap = fightSubdueBonusCap('bluefin_tuna', kgAt('bluefin_tuna', 180));
    const mk = (subdueBonusCap?: number): FightingPhase => new FightingPhase({
      powerFactor: 0.8, tackleA: 0.6, patternWeights: { jump: 0, dive: 1, lateral: 0 }, intervalMult: 1, mouthFragility: 0,
      weightKg: 110, burstMult: 2.4, bodyForm: 'fusiform', lineCapacityKg: 108, reelDragKg: 30, baseEscapePerSec: 0, subdueBonusCap,
    });
    const run = (f: FightingPhase, fatigueRatio: number, secs: number): number => {
      let subdue = 0;
      for (let i = 0; i < secs * 20; i++) {
        const dive = f.pattern === 'dive';
        const st = f.update({ dtSec: 0.05, holding: dive, reeling: !dive, thrustGate: 1, fatigueRatio, landProgress: 0 });
        subdue = st.subdue; if (st.event !== 'none') break;
      }
      return subdue;
    };
    // 상한이 없던 옛 식 — 지치지 않은 고기도 40초 정대응이면 제압도 100
    expect(run(mk(), 1, 40)).toBe(100);
    // 상한 — 생생한 고기(피로 0)는 60초를 이어도 상한에서 멎는다
    const fresh = run(mk(cap), 1, 60);
    expect(fresh).toBeLessThanOrEqual(cap + 0.001); expect(fresh).toBeLessThan(70);
    // 절반쯤 지치면(피로 몫 35) 제압된다
    expect(run(mk(cap), 0.45, 60)).toBe(100);
  });
});

describe('324 — 되살아남(제압된 큰 고기가 끌려오다 다시 힘을 쓴다)', () => {
  const seq = (...v: number[]) => { let i = 0; return () => v[Math.min(i++, v.length - 1)]; };

  it('횟수 — 참다랑어 25kg급 · 방어 · 돔은 0, 큰 고기는 체급대로 1 ~ 3', () => {
    expect(secondWindCount('black_seabream', 1.2)).toBe(0);
    expect(secondWindCount('yellowtail', kgAt('yellowtail', 110))).toBe(0);
    expect(secondWindCount('greater_amberjack', kgAt('greater_amberjack', 130))).toBe(0);
    expect(secondWindCount('bluefin_tuna', kgAt('bluefin_tuna', 110))).toBe(0);
    expect(secondWindCount('bluefin_tuna', kgAt('bluefin_tuna', 130))).toBe(1);
    expect(secondWindCount('bluefin_tuna', kgAt('bluefin_tuna', 180))).toBe(2);
    expect(secondWindCount('bluefin_tuna', kgAt('bluefin_tuna', 200))).toBe(3);
    expect(secondWindCount('bluefin_tuna', kgAt('bluefin_tuna', 260))).toBe(3);   // 상한
    expect(secondWindCount('swordfish', kgAt('swordfish', 230))).toBe(2);
    expect(secondWindCount('striped_marlin', kgAt('striped_marlin', 250))).toBe(1);
  });

  it('자리 — 제압된 거리의 40 ~ 80%까지 끌려왔을 때 · 발앞 15m 안에서는 없다 · 회차마다 약해진다', () => {
    const S = TUNING.fightPhys.secondWind;
    const kg = kgAt('bluefin_tuna', 180), land = 2.5;
    // 난수: 일어난다(0) · 자리 하한(0) · 패턴 길이 하한(0)
    const lo = rollSecondWind('bluefin_tuna', kg, 0, 202.5, land, seq(0, 0, 0))!;
    expect(lo.atM).toBeCloseTo(land + 200 * S.atFracMin, 6);
    expect(lo.recoverFrac).toBeCloseTo(S.recoverFrac, 6); expect(lo.bonusDrop).toBeCloseTo(S.bonusDrop, 6);
    expect(lo.patternSec).toBeCloseTo(S.patternSecMin, 6);
    const hi = rollSecondWind('bluefin_tuna', kg, 0, 202.5, land, seq(0, 0.999999, 0.999999))!;
    expect(hi.atM).toBeGreaterThan(land + 200 * (S.atFracMax - 0.01)); expect(hi.atM).toBeLessThan(202.5);
    // 두 번째는 0.75배로 약하다 · 세 번째는 이 체급에 없다
    const second = rollSecondWind('bluefin_tuna', kg, 1, 120, land, seq(0, 0.5, 0.5))!;
    expect(second.recoverFrac).toBeCloseTo(S.recoverFrac * S.decay, 6); expect(second.bonusDrop).toBeCloseTo(S.bonusDrop * S.decay, 6);
    expect(rollSecondWind('bluefin_tuna', kg, 2, 120, land, seq(0, 0.5, 0.5))).toBeNull();
    // 확률에 걸리지 않으면 없다 · 가까이서 제압되면 없다(2.5 + 20 × 0.4 = 10.5m < 17.5m)
    expect(rollSecondWind('bluefin_tuna', kg, 0, 202.5, land, seq(0.95, 0, 0))).toBeNull();
    expect(rollSecondWind('bluefin_tuna', kg, 0, 22.5, land, seq(0, 0, 0))).toBeNull();
    // 작은 고기는 굴리지도 않는다
    expect(rollSecondWind('yellowtail', kgAt('yellowtail', 90), 0, 202.5, land, seq(0, 0, 0))).toBeNull();
  });

  it('피로 — 되찾는 만큼 오른다 · 완전히 지친 고기도 제압 페이즈를 벗어난다', () => {
    const kg = kgAt('bluefin_tuna', 180);
    const f = new FishFatigueModel('bluefin_tuna', kg, 1);
    // 절반까지 지치게 한다
    while (f.ratio > 0.5) f.update({ dtSec: 0.5, reeling: true, holding: false, tensionRatio: 0.6 });
    const r0 = f.ratio; f.recover(0.07);
    expect(f.ratio).toBeCloseTo(r0 + 0.07, 6);
    // 바닥까지 지치게 한다 → 0.15 + 0.07
    while (f.ratio > 0.01) f.update({ dtSec: 0.5, reeling: true, holding: false, tensionRatio: 0.9 });
    expect(f.phase).toBe('SPENT');
    f.recover(0.07);
    expect(f.ratio).toBeCloseTo(0.22, 6); expect(f.phase).not.toBe('SPENT');
  });

  it('싸움 — 제압(100)된 고기가 되살아나면 제압이 풀리고 여 박기 · 횡이동이 바로 일어난다(뛰지는 않는다)', () => {
    const cap = fightSubdueBonusCap('bluefin_tuna', kgAt('bluefin_tuna', 180));
    const mk = (): FightingPhase => new FightingPhase({
      powerFactor: 0.8, tackleA: 1, patternWeights: { jump: 0.1, dive: 0.6, lateral: 0.3 }, intervalMult: 0.55, mouthFragility: 0,
      weightKg: 110.8, burstMult: 2.39, bodyForm: 'fusiform', lineCapacityKg: 108, reelDragKg: 30, baseEscapePerSec: 0, subdueBonusCap: cap,
    });
    const play = (f: FightingPhase, fatigueRatio: number, secs: number): number => {
      let subdue = 0;
      for (let i = 0; i < secs * 20; i++) {
        const dive = f.pattern === 'dive', lat = f.pattern === 'lateral';
        const st = f.update({ dtSec: 0.05, holding: dive, reeling: f.pattern === 'none', steerDir: lat ? st0.lateralDir : 0, thrustGate: 0.62, fatigueRatio, landProgress: 0 });
        st0 = st; subdue = st.subdue; if (st.event !== 'none' || subdue >= 100) break;
      }
      return subdue;
    };
    let st0 = { lateralDir: 1 } as { lateralDir: -1 | 1 };
    const f = mk();
    expect(play(f, 0.45, 90)).toBe(100);
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) { const g = mk(); seen.add(g.revive(30, 3, Math.random)); expect(g.pattern).not.toBe('jump'); expect(g.pattern).not.toBe('none'); }
    expect(seen.has('dive')).toBe(true);
    // 되살아난 직후 — 피로를 조금 되찾았고(0.52) 대응 몫 30이 덜렸다
    const pat = f.revive(30, 3, () => 0);
    expect(pat).toBe('dive');
    const after = f.update({ dtSec: 0.05, holding: true, reeling: false, thrustGate: 0.62, fatigueRatio: 0.52, landProgress: 0 });
    expect(after.subdue).toBeLessThan(80); expect(after.pattern).toBe('dive');
    // 다시 맞게 답하고 지치게 하면 또 제압된다
    expect(play(f, 0.45, 60)).toBe(100);
  });
});

describe('324 — 드랙이 줄보다 약하게 물린 채비는 충격을 드랙이 먼저 받는다', () => {
  // 111kg 참다랑어가 서지(추력 2.17배) 중에 여로 박는다 — 버티기(정대응)로 답한다
  const surgeDive = (lineCapacityKg: number, reelDragKg: number | undefined): string => {
    const f = new FightingPhase({
      powerFactor: 0.8, tackleA: 1, patternWeights: { jump: 0, dive: 1, lateral: 0 }, intervalMult: 1, mouthFragility: 0,
      weightKg: 110.8, burstMult: 2.39, bodyForm: 'fusiform', lineCapacityKg, reelDragKg, baseEscapePerSec: 0,
    });
    let event = 'none';
    for (let i = 0; i < 600 && event === 'none'; i++) {
      const dive = f.pattern === 'dive';
      event = f.update({ dtSec: 0.05, holding: dive, reeling: false, thrustGate: dive ? 2.17 : 1, fatigueRatio: 1, landProgress: 0 }).event;
    }
    return event;
  };
  it('합사 12호(108kg) + 드랙 30kg — 터지지 않는다 · 드랙이 줄만큼 센 채비(옛 규칙)는 터진다', () => {
    expect(surgeDive(12 * PE_LINE_KG_PER_HO, 30)).toBe('none');
    expect(surgeDive(12 * PE_LINE_KG_PER_HO, undefined)).toBe('line_break');   // 릴 제원이 없으면 줄만 본다
    expect(surgeDive(12 * PE_LINE_KG_PER_HO, 95)).toBe('line_break');          // 드랙이 줄 쪽 상한(91.8kg)보다 세면 그대로
  });
  it('합사 4호(36kg) + 드랙 11kg — 여유가 있어도 180cm 참다랑어는 서지 한 번에 터진다', () => {
    expect(surgeDive(4 * PE_LINE_KG_PER_HO, 11)).toBe('line_break');
  });
  it('임계 = 줄 세기 × 2.8 × √(줄 쪽 드랙 상한 ÷ 릴 드랙)', () => {
    const P = TUNING.fightPhys;
    expect(P.shockDragRelief).toBe(0.5);
    const cap = (lineKg: number, dragKg: number): number => lineKg * P.shockBreakFrac * Math.pow(Math.max(1, lineKg * P.dragCapFrac / dragKg), P.shockDragRelief);
    expect(cap(108, 30)).toBeGreaterThan(500);          // 합사 12호 + 30000번
    expect(cap(90, 30)).toBeGreaterThan(380);           // 합사 10호 + 20000번 — 서지 중 여 박기(380kg)를 버틴다
    expect(cap(72, 25)).toBeLessThan(380);              // 합사 8호 + 14000번 — 못 버틴다(150cm급까지)
    expect(cap(18, 11)).toBeLessThan(18 * P.shockBreakFrac * 1.2);   // 쇼어지깅 합사 2호 + 4000번 — 옛 임계에서 18% 안쪽
  });
});

describe('324 — 새 어종 3(눈다랑어 · 황새치 · 청새치)', () => {
  const ids = ['bigeye_tuna', 'swordfish', 'striped_marlin'];
  it('네 계층이 다 있다 — 오라클 · 도감 · 값 · 손질(해체)', () => {
    for (const id of ids) {
      const o = sp(id), f = FISH_DATABASE.find((x) => x.id === id);
      expect(o, id).toBeTruthy(); expect(f, id).toBeTruthy();
      expect(SEAFOOD_AUCTION_MAPPING[id], id).toBeTruthy();
      expect(BUTCHERY_PROFILES[id]?.tree, id).toBe('loin');
      expect(BUTCHERY_WIRED_SPECIES.has(id), id).toBe(true);
      expect(o.abundance, id).toBeLessThan(0.1);   // 드문 고기
      // 도감 평균 체중이 체장-체중 식과 2배 안에서 맞는다
      const mid = (f!.avgSizeRangeCm[0] + f!.avgSizeRangeCm[1]) / 2;
      const lwrG = kgAt(id, mid) * 1000, midG = (f!.avgWeightRangeG[0] + f!.avgWeightRangeG[1]) / 2;
      expect(midG / lwrG, id).toBeGreaterThan(0.5); expect(midG / lwrG, id).toBeLessThan(2);
    }
  });

  it('평균 개체도 「우량」부터 · 값 — 눈다랑어 > 황새치 > 청새치(kg당)', () => {
    for (const id of ids) expect(['fine', 'big', 'trophy', 'monster']).toContain(fishRarity(id, sp(id).meanCm).tier);
    const perKg = (id: string): number => SEAFOOD_AUCTION_MAPPING[id].defaultPricePerKg;
    expect(perKg('bigeye_tuna')).toBeGreaterThan(perKg('swordfish'));
    expect(perKg('swordfish')).toBeGreaterThan(perKg('striped_marlin'));
  });

  it('큰 고기 한 마리 값 — 130kg 참다랑어 100만 원대 · 75kg 황새치 수십만 원(무게에 비례해 폭증하지 않는다)', () => {
    const price = (id: string, cm: number): number => evaluateFishSellPrice(id, cm, kgAt(id, cm) * 1000).finalPrice;
    const tuna = price('bluefin_tuna', 190);
    expect(tuna).toBeGreaterThan(900_000); expect(tuna).toBeLessThan(2_500_000);
    const sword = price('swordfish', 230);
    expect(sword).toBeGreaterThan(80_000); expect(sword).toBeLessThan(900_000);
    // 어린 참다랑어(80cm · 10kg) < 큰 참다랑어
    expect(price('bluefin_tuna', 80)).toBeLessThan(tuna / 3);
  });
});

describe('324 — 큰 고기용 장비', () => {
  it('대 20 · 릴 20 — id가 겹치지 않고 만든 곳 · 내구도 배수 · 자중이 있다', () => {
    expect(BIG_GAME_ROD_SHOP.length).toBe(20);
    expect(BIG_GAME_REEL_SHOP.length).toBe(20);
    const ids = [...ROD_SHOP, ...REEL_SHOP, ...BIG_GAME_ROD_SHOP, ...BIG_GAME_REEL_SHOP].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of BIG_GAME_ROD_SHOP) {
      expect(r.spec.brand, r.id).toBeTruthy(); expect(r.spec.durabilityMult, r.id).toBeGreaterThan(0.8);
      expect(r.art, r.id).toMatch(/^item_rod_/);
      expect(ROD_USE_LABEL[r.spec.use], r.id).toBeTruthy(); expect(ROD_USE_CAST[r.spec.use], r.id).toBeTruthy();
      expect(rodSpecFor(r.id)).toBe(r.spec);
      expect(isBigGameGear(`${r.id}#3`)).toBe(true);   // 개체 번호가 붙어도 찾는다
    }
    for (const r of BIG_GAME_REEL_SHOP) {
      expect(r.spec.brand, r.id).toBeTruthy(); expect(r.spec.weightG, r.id).toBeGreaterThan(400);
      expect(r.art, r.id).toMatch(/^item_reel_/);
      expect(reelSpecFor(r.id)).toBe(r.spec);
    }
    expect(isBigGameGear('rod_iso_1_53')).toBe(false);
  });

  it('같은 급 · 다른 만든 곳 — 제원은 같고 자중 · 내구도 · 값이 다르다', () => {
    const blue = getRodCatalogEntry('rod_shorejig_100h')!, minor = getRodCatalogEntry('rod_shorejig_minor_100h')!;
    expect(minor.spec.use).toBe(blue.spec.use); expect(minor.spec.lineNo).toEqual(blue.spec.lineNo);
    expect(minor.spec.loadG).toEqual(blue.spec.loadG); expect(minor.spec.powerKg).toBe(blue.spec.powerKg);
    expect(minor.spec.weightG).toBeLessThan(blue.spec.weightG);
    expect(minor.spec.durabilityMult).toBeLessThan(1);
    // 8000번 세 가지 — 드랙 · 자중 · 내구도가 서로 다르다
    const r8 = ['reel_sw_8000_daio_bg', 'reel_sw_8000_penson', 'reel_sw_8000_somano'].map((id) => reelSpecFor(id));
    expect(new Set(r8.map((r) => r.maxDragKg)).size).toBe(3);
    expect(new Set(r8.map((r) => r.weightG)).size).toBe(3);
    expect(new Set(r8.map((r) => r.durabilityMult)).size).toBe(3);
    // 내구도 배수는 던질 수 있는 횟수에 그대로 곱해진다
    expect(rodMaxCasts(200000, 1.25)).toBe(Math.round(rodMaxCasts(200000) * 1.25));
  });

  it('릴 종류와 대 — 돌돔대 · 양축 지깅대 · 스탠드업대는 양축릴, 캐스팅대 · 스피닝 지깅대는 스피닝릴', () => {
    const ishidai = rodSpecFor('rod_ishidai_daio_525'), cast = rodSpecFor('rod_cast_daio_85_10'), bg = rodSpecFor('rod_bg_somano_80');
    expect(reelFitsRod(ishidai, reelSpecFor('reel_ishidai_daio_40'))).toBe(true);
    expect(reelFitsRod(ishidai, reelSpecFor('reel_sw_20000_daio'))).toBe(false);
    expect(reelFitsRod(cast, reelSpecFor('reel_sw_20000_daio'))).toBe(true);
    expect(reelFitsRod(cast, reelSpecFor('reel_ld_penson_50w'))).toBe(false);
    expect(reelFitsRod(bg, reelSpecFor('reel_ld_penson_50w'))).toBe(true);
    expect(reelFitsRod(rodSpecFor('rod_jig_yamano_s62'), reelSpecFor('reel_sw_8000_somano'))).toBe(true);
    expect(reelFitsRod(rodSpecFor('rod_jig_somano_b61'), reelSpecFor('reel_jig_somano_2000'))).toBe(true);
  });

  it('권사량 — 굵은 줄은 작은 릴에 못 감는다(100m 미만) · 큰 릴은 넉넉하다', () => {
    const r4000 = reelSpecFor('reel_sw_4000hg'), r8000 = reelSpecFor('reel_sw_8000_somano'), r20000 = reelSpecFor('reel_sw_20000_daio'), r30000 = reelSpecFor('reel_sw_30000_somano');
    expect(REEL_MIN_LINE_M).toBe(100);
    expect(reelLineCapacityM(r4000, 3)).toBe(200);
    expect(reelHoldsLine(r4000, 4)).toBe(true);
    expect(reelHoldsLine(r4000, 8)).toBe(false);          // 4000번에 합사 8호는 75m
    expect(reelLineCapacityM(r8000, 4)).toBe(300);
    expect(reelLineCapacityM(r20000, 8)).toBe(300);
    expect(reelLineCapacityM(r30000, 12)).toBe(400);
    expect(reelHoldsLine(r8000, 12)).toBe(true);           // 100m — 겨우
    expect(reelLineCapacityM(reelSpecFor('reel_ishidai_daio_40'), 20)).toBe(200);
    expect(reelLineCapacityM(reelSpecFor('reel_ld_penson_50w'), 50)).toBeGreaterThan(200);
    expect(reelHoldsLine(undefined, 50)).toBe(true);
  });

  it('대가 드랙을 버티나 — 실제로 걸리는 힘은 줄과 릴 드랙 중 약한 쪽', () => {
    const cast = rodSpecFor('rod_cast_daio_85_10');          // 30kg
    expect(rodDragFit(cast, 108, reelSpecFor('reel_sw_20000_daio'))).toBe('ok');        // 드랙 30 ≤ 45
    const light = rodSpecFor('rod_iso_1_53');                 // 4.2kg
    expect(rodDragFit(light, 108, reelSpecFor('reel_sw_20000_daio'))).toBe('strained');
    expect(rodDragFit(light, 5.4, reelSpecFor('reel_sw_20000_daio'))).toBe('ok');       // 줄이 약하면 줄이 먼저 터진다
    // 원줄 굵기 — 캐스팅대(합사 8~12호)에 2호는 가늘다 · 스탠드업 80lb(나일론 24~40호)에 합사 8호는 맞다
    expect(rodLineFit(cast, 2, true)).toBe('thin');
    expect(rodLineFit(cast, 10, true)).toBe('ok');
    expect(rodLineFit(rodSpecFor('rod_bg_somano_80'), 8, true)).toBe('ok');
    expect(rodLineFit(rodSpecFor('rod_iso_1_53'), 12, true)).toBe('thick');
  });

  it('큰 양축릴의 스풀 — 지깅 2000번급 약 5cm · 50W 약 7.8cm · 80W 약 8.9cm(작은 베이트릴 식을 쓰지 않는다)', () => {
    expect(reelSpoolDiamCm(reelSpecFor('reel_bait_150'))).toBeLessThan(3.5);
    expect(reelSpoolDiamCm(reelSpecFor('reel_jig_somano_2000'))).toBeGreaterThan(5);
    expect(reelSpoolDiamCm(reelSpecFor('reel_ld_penson_50w'))).toBeGreaterThan(7.5);
    expect(reelSpoolDiamCm(reelSpecFor('reel_ld_somano_80w'))).toBeGreaterThan(8.5);
  });

  it('큰 릴은 무거운 고기를 감는 바닥 속도가 높다 — 4000번까지 그대로 · 큰 릴은 √(번수 ÷ 4000)', () => {
    const D = TUNING.fightDist;
    const mps = (id: string, kg: number): number => reelRetrieveMps(D.reelBaseMps, D.reelMinMps, kg, D.reelWeightK, reelSpecFor(id));
    expect(reelFloorK(reelSpecFor('reel_spin_2500'))).toBe(1);
    expect(reelFloorK(reelSpecFor('reel_sw_4000hg'))).toBe(1);
    expect(reelFloorK(reelSpecFor('reel_sw_30000_somano'))).toBeCloseTo(Math.sqrt(30000 / 4000), 6);
    expect(reelFloorK(reelSpecFor('reel_ld_penson_50w'))).toBeCloseTo(Math.sqrt(20000 / 4000), 6);   // 양축 1000번 = 스피닝 20000번
    // 111kg 참다랑어 — 4000번은 옛 바닥(0.35m/s), 30000번은 그 2.7배
    expect(mps('reel_sw_4000hg', 111)).toBeCloseTo(D.reelMinMps, 6);
    expect(mps('reel_sw_30000_somano', 111) / mps('reel_sw_4000hg', 111)).toBeGreaterThan(2.5);
    // 가벼운 고기는 바닥에 닿지 않는다 — 옛 식 그대로
    expect(mps('reel_spin_2500', 1)).toBeGreaterThan(1);
  });

  it('큰 루어 8 — 가게 전용 표시 · 이름의 무게가 정수 · 대가 받는 무게 안', () => {
    const big = LURES_CATALOG_DB.filter((l) => l.bigGame);
    expect(big.length).toBe(8);
    for (const l of big) {
      expect(Number.isInteger(l.weightG), l.id).toBe(true);
      expect(l.nameKo, l.id).toContain(`${l.weightG}g`);
      expect(l.art, l.id).toMatch(/^item_lure_/);
      expect(l.priceWon, l.id).toBeGreaterThan(10000);
    }
    // 옛 루어 16종은 그대로 시작 가방에 들어간다
    expect(LURES_CATALOG_DB.filter((l) => !l.bigGame).length).toBe(16);
    const cast = rodSpecFor('rod_cast_daio_85_10'), jig = rodSpecFor('rod_jig_somano_b61');
    expect(120).toBeGreaterThanOrEqual(cast.loadG[0]); expect(150).toBeLessThanOrEqual(cast.loadG[1]);
    expect(300).toBeLessThanOrEqual(jig.loadG[1]);
  });
});

describe('324 — 가방 무게', () => {
  const item = (o: Partial<CarryWeightItem> & { id: string; name: string }): CarryWeightItem =>
    ({ category: 'etc', subCategory: '', qty: 1, ...o });

  it('무게를 정하는 순서 — 개체 무게 · 무게로 세는 것 · 대 · 릴 제원 · 줄 스풀 · 봉돌 · id 표 · 이름 · 소분류', () => {
    expect(itemUnitWeightG(item({ id: 'inv_catch_x', name: '참다랑어 (180cm)', category: 'food', subCategory: '어획물', weightG: 110800 }))).toBe(110800);
    expect(itemStackWeightG(item({ id: 'res_chaff', name: '검불', unitG: 1, qty: 480 }))).toBe(480);
    expect(itemUnitWeightG(item({ id: 'rod_cast_daio_85_10#2', name: '다이오 솔티가 캐스팅 85-10 튜나', tool: 'rod', subCategory: '손도구' }))).toBe(425);
    expect(itemUnitWeightG(item({ id: 'reel_ld_somano_80w', name: '소마노 티아그로 80W', subCategory: '릴' }))).toBe(4200);
    expect(itemUnitWeightG(item({ id: 'reel_spin_2500', name: '다이오 2500LBD 레버브레이크', subCategory: '릴' }))).toBe(reelWeightG(reelSpecFor('reel_spin_2500')));
    expect(itemUnitWeightG(item({ id: 'inv_sinker_ring_20', name: '고리봉돌 20호 (75g)', sinkerWeightG: 75 }))).toBe(75);
    expect(itemUnitWeightG(item({ id: 'inv_cooler', name: '쿨러 (아이스박스)', subCategory: '낚시도구' }))).toBe(3500);
    expect(itemUnitWeightG(item({ id: 'shop_rice', name: '쌀 1kg', category: 'food', subCategory: '식자재' }))).toBe(1000);
    expect(itemUnitWeightG(item({ id: 'crop_potato', name: '감자 1kg · 상', category: 'food', subCategory: '농산물' }))).toBe(1000);
    expect(itemUnitWeightG(item({ id: 'seed_lettuce', name: '청치마 씨앗 (1칸 분)', category: 'consumable', subCategory: '씨앗 · 모종' }))).toBe(5);
    expect(itemUnitWeightG(item({ id: 'sdl_dureup', name: '두릅 묘목 (1그루)', category: 'consumable', subCategory: '씨앗 · 모종' }))).toBe(900);
    expect(itemUnitWeightG(item({ id: 'brand_new_thing', name: '처음 보는 것', subCategory: '재료' }))).toBe(300);
    expect(itemUnitWeightG(item({ id: 'brand_new_thing', name: '처음 보는 것', category: 'tackle', subCategory: '없는 갈래' }))).toBe(10);
    // 자전거는 타거나 끌고 다닌다 — 짐이 아니다
    expect(itemUnitWeightG(item({ id: 'inv_bike', name: '자전거', subCategory: '탈것' }))).toBe(0);
  });

  it('이름의 무게 읽기 — g · kg · ml · L만. 길이(m) · 밝기(lm)는 무게가 아니다', () => {
    expect(weightFromNameG('급랭 백크릴 600g (밑밥 블록)')).toBe(600);
    expect(weightFromNameG('퇴비 (1칸 분 · 3kg)')).toBe(3000);
    expect(weightFromNameG('생수 500ml')).toBe(500);
    expect(weightFromNameG('헤드랜턴 (800lm)')).toBeNull();
    expect(weightFromNameG('해원 갯바위 1호 5.3m')).toBeNull();
    expect(weightFromNameG('지주대 (1.5m)')).toBeNull();
  });

  it('줄 스풀 — 남은 길이만큼만 무겁다 · 굵은 합사 400m는 100g 남짓', () => {
    expect(lineMassG(3, 150, 'nylon')).toBeGreaterThan(9); expect(lineMassG(3, 150, 'nylon')).toBeLessThan(13);
    const full = itemUnitWeightG(item({ id: 'line_pe_sol_12_400', name: '솔라인 오션 8합사 12호 · 400m', category: 'tackle', subCategory: '원줄 스풀', lineNo: 12, lineLengthM: 400, lineMaterial: 'pe_braid' }));
    const half = itemUnitWeightG(item({ id: 'line_pe_sol_12_400', name: '솔라인 오션 8합사 12호 · 400m', category: 'tackle', subCategory: '원줄 스풀', lineNo: 12, lineLengthM: 400, lineUsedM: 200, lineMaterial: 'pe_braid' }));
    expect(full).toBeGreaterThan(100); expect(full).toBeLessThan(160);
    expect(half).toBeLessThan(full);
  });

  it('합 — 여러 칸의 무게를 더한다', () => {
    const bag = [
      item({ id: 'inv_cooler', name: '쿨러 (아이스박스)', subCategory: '낚시도구' }),
      item({ id: 'inv_ice_bulk', name: '대용량 각얼음', qty: 2 }),
      item({ id: 'c1', name: '방어 (90cm)', weightG: 8400 }),
    ];
    expect(carriedWeightG(bag)).toBe(3500 + 6000 + 8400);
    // 수량 · 무게가 숫자가 아니어도 합계가 NaN이 되지 않는다
    expect(carriedWeightG([...bag, item({ id: 'x', name: '깨진 것', qty: Number.NaN })])).toBe(3500 + 6000 + 8400 + 500);
    expect(encumbranceOf(Number.NaN).stage).toBe(1);
    expect(carryWeightText(950)).toBe('950g');
    expect(carryWeightText(17900)).toBe('17.9kg');
    expect(carryWeightText(130000)).toBe('130kg');
  });
});

describe('324 — 과적 4단계(40 · 55 · 70kg)', () => {
  it('경계 — 40.0kg까지 1단계 · 넘으면 2단계 · 55 넘으면 3단계 · 70 넘으면 4단계', () => {
    expect(encumbranceOf(0).stage).toBe(1);
    expect(encumbranceOf(40).stage).toBe(1);
    expect(encumbranceOf(40.1).stage).toBe(2);
    expect(encumbranceOf(55).stage).toBe(2);
    expect(encumbranceOf(55.1).stage).toBe(3);
    expect(encumbranceOf(70).stage).toBe(3);
    expect(encumbranceOf(70.1).stage).toBe(4);
  });

  it('1단계는 평소와 같다', () => {
    const e = encumbranceOf(39);
    expect(e.moveMult).toBe(1); expect(e.runBonus).toBe(1); expect(e.canRun).toBe(true); expect(e.canRide).toBe(true);
    expect(e.drainMult).toEqual([1, 1, 1]); expect(e.immobile).toBe(false);
  });

  it('2단계 — 느려지고 탈것을 못 타고 소모가 는다. 사잇값은 비례한다(41kg ≠ 54kg)', () => {
    const a = encumbranceOf(41), mid = encumbranceOf(47.5), b = encumbranceOf(54);
    for (const e of [a, mid, b]) { expect(e.canRide).toBe(false); expect(e.canRun).toBe(true); expect(e.immobile).toBe(false); }
    expect(a.moveMult).toBeGreaterThan(mid.moveMult); expect(mid.moveMult).toBeGreaterThan(b.moveMult);
    expect(mid.moveMult).toBeCloseTo(0.9, 5);                 // 1 → 0.8의 한가운데
    expect(a.runBonus).toBeGreaterThan(b.runBonus);
    expect(mid.drainMult[2]).toBeCloseTo(1.25, 5);            // 피로 1 → 1.5의 한가운데
    expect(a.drainMult[0]).toBeLessThan(b.drainMult[0]);
    expect(a.moveMult).toBeLessThan(1);                       // 41kg도 조금은 느리다
  });

  it('3단계 — 훨씬 심하다(걸음이 2단계보다 세 배 가파르게 준다) · 달리지 못한다', () => {
    const at55 = encumbranceOf(55), a = encumbranceOf(56), b = encumbranceOf(69.9);
    expect(at55.moveMult).toBeCloseTo(0.8, 5);
    expect(a.canRun).toBe(false); expect(a.runBonus).toBe(0); expect(a.canRide).toBe(false);
    expect(b.moveMult).toBeGreaterThan(0.34); expect(b.moveMult).toBeLessThan(0.37);
    // 기울기 — 2단계는 15kg에 0.2, 3단계는 15kg에 0.45
    const slope2 = (1 - at55.moveMult) / 15, slope3 = (at55.moveMult - encumbranceOf(70).moveMult) / 15;
    expect(slope3).toBeGreaterThan(slope2 * 2);
    expect(b.drainMult[2]).toBeGreaterThan(2.3);
    // 이어져 있다 — 55kg 양쪽이 같은 값에서 만난다
    expect(encumbranceOf(55.001).moveMult).toBeCloseTo(at55.moveMult, 2);
  });

  it('4단계 — 제자리에서 움직이지 못한다', () => {
    const e = encumbranceOf(130);
    expect(e.immobile).toBe(true); expect(e.moveMult).toBe(0); expect(e.canRun).toBe(false); expect(e.canRide).toBe(false);
  });

  it('용달 값 — 기본 + kg당 · 500원 단위', () => {
    expect(haulFeeWon(0)).toBe(15000);
    expect(haulFeeWon(110)).toBe(48000);
    expect(haulFeeWon(111.2) % 500).toBe(0);
  });
});
