/**
 * @file ButcheryFlow322.test.ts
 * @description 322차 — **[확정] 좌표 전수 검사**. `ButcheryGuideOverrides`에 든 어종마다 확정 선을 그대로 따라 그어 손질이 끝까지 가는지 본다.
 *  사용자가 F9 [확정]으로 보낸 좌표가 판정 옵션(여러 번 긋기 · 다중 선 · 허용 폭)과 어긋나 중간에 막히는 일을 여기서 잡는다.
 *  - 어종 키마다: 확정 표를 넘겨 공정을 만들고 유도선을 그대로 그어 완주
 *  - **모비늘 제거**(전갱이류 `hasScutes`) — 밑손질에 앞 · 뒤 두 단계 · 작업 「모비늘 제거」 · 다른 어종에는 없다
 *  - **새 어종 9**(전어 · 청어 · 멸치 · 참조기 · 백조기 · 붉바리 · 자바리 · 다금바리 · 능성어) — 등록 층 정합 · 규제 · 손질 분류 · 완주
 *  - 확정한 단계는 좌표가 표 그대로(옮기지 않는다) · 지아이뼈 분리(pin)는 321 전 확정분이 표에 없어야 한다
 */
import { describe, it, expect } from 'vitest';
import { ButcheryProcess, buildButcheryStages, isBodyGuideStage } from './ButcheryProcess.js';
import type { GuideFrameRemap } from './ButcheryProcess.js';
import {
  butcheryProfileFor, canButcherSpecies, getButcheryProfile, BUTCHERY_PROFILES, butcheryArtFamily, isLoinBreakdown,
  BUTCHERY_WIRED_SPECIES, BUTCHERY_ART_PENDING_SPECIES, BUTCHERY_IMPLEMENTED_SPECIES,
} from '../db-schema/ButcheryProfiles.js';
import { ORACLE_FISH_DB, isClosedSeasonExempt, speciesBiteShare } from './FishSpawningOracle.js';
import type { SpawnContext } from './FishSpawningOracle.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import { SEAFOOD_AUCTION_MAPPING } from '../types/Economy.js';
import { matchMafraSpecies } from '../api-client/MafraAuctionApiClient.js';
import { SPECIES_SEA_WEIGHT, presenceBreakdown } from '../rules/SpeciesPresence.js';
import { FISH_COOKING_PROFILES } from '../db-schema/FishCookingProfiles.js';
import { fightGroupOf } from './FishRarity.js';
import { sectionsForSpecies, resolveButcherySections } from '../db-schema/ButcherySections.js';
import { BUTCHERY_GUIDE_OVERRIDES } from '../db-schema/ButcheryGuideOverrides.js';
import type { CutPoint } from '../types/Butchery.js';

const trace = (path: readonly CutPoint[]): CutPoint[] => {
  const o: CutPoint[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    for (let k = 0; k < 8; k++) o.push({ x: a.x + (b.x - a.x) * k / 8, y: a.y + (b.y - a.y) * k / 8 });
  }
  o.push(path[path.length - 1]);
  return o;
};

const SPECIES = Object.keys(BUTCHERY_GUIDE_OVERRIDES).filter((k) => !k.startsWith('@'));
/** 321(2026-11-12 14:51Z) — 지아이뼈 분리 그림이 한 면 필렛으로 바뀐 시각. 그 전 확정은 다른 그림 위의 선이다 */
const PIN_ART_CHANGED = '2026-11-12T14:51:07.000Z';

describe('322 — [확정] 좌표로 끝까지', () => {
  it('확정 표에 어종이 있다', () => {
    expect(SPECIES.length).toBeGreaterThan(0);
    for (const sp of SPECIES) expect(canButcherSpecies(sp), sp).toBe(true);
  });

  it.each(SPECIES)('%s — 확정 선 그대로 그으면 완주한다', (sp) => {
    const p = new ButcheryProcess(butcheryProfileFor(sp, 30), 1, { guideOverrides: BUTCHERY_GUIDE_OVERRIDES });
    const seen: string[] = [];
    const table = BUTCHERY_GUIDE_OVERRIDES[sp] ?? {};
    for (let guard = 0; guard < 300 && !p.finished; guard++) {
      const s = p.stage!;
      seen.push(s.id);
      p.orientation = s.orientation;
      // 확정한 단계는 좌표가 표 그대로다(어종 확정 좌표는 옮기지 않는다)
      const o = table[s.id];
      if (o) {
        if (o.guidePaths && o.guidePaths.length > 1) expect(s.cut!.guidePaths, `${sp} ${s.id}`).toEqual(o.guidePaths);
        else if (o.guidePath) expect(s.cut!.guidePath, `${sp} ${s.id}`).toEqual(o.guidePath);
        if (o.sweepPath) expect(s.sweepPath, `${sp} ${s.id}`).toEqual(o.sweepPath);
        if (o.tapPoint) expect(s.tapPoint, `${sp} ${s.id}`).toEqual(o.tapPoint);
      }
      const k = s.primitive;
      if (k === 'tap') p.submitTap(0);
      else if (k === 'drag_fill' || k === 'scoop') p.submitFill(1);
      else if (k === 'wash') p.submitWash();
      else {
        const left = s.cut!.guidePaths?.length ? s.cut!.guidePaths.filter((_, i) => !p.donePathIndices.has(i)) : [s.cut!.guidePath];
        expect(p.submitCut(trace(left[0])).passed, `${sp} ${s.id}`).toBe(true);
      }
    }
    expect(p.finished, `${sp} — 지나온 단계 ${seen.slice(-4).join(' → ')}`).toBe(true);
    // 확정한 단계는 전부 이 어종 공정에 실제로 있다(없는 단계의 확정 = 죽은 좌표)
    for (const id of Object.keys(table)) expect(seen, `${sp} ${id}`).toContain(id);
  });

  it('지아이뼈 분리 — 그림이 바뀌기 전에 확정한 선은 표에 없다', () => {
    for (const [key, table] of Object.entries(BUTCHERY_GUIDE_OVERRIDES)) {
      for (const id of ['pin_a', 'pin_b']) {
        const o = table[id];
        if (o) expect(String(o.at ?? '') >= PIN_ART_CHANGED, `${key} ${id} ${o.at}`).toBe(true);
      }
    }
  });
});

describe('322 — 모비늘 제거(전갱이류)', () => {
  const ids = (sp: string): string[] => buildButcheryStages(getButcheryProfile(sp)).map((s) => s.id);

  it('전갱이만 모비늘 단계가 있다 — 고등어 · 방어 · 참다랑어 · 돔류에는 없다', () => {
    expect(getButcheryProfile('horse_mackerel').hasScutes).toBe(true);
    const hm = ids('horse_mackerel');
    expect(hm).toContain('scute_base');
    expect(hm).toContain('scute_flip');
    // 비늘치기 다음 · 머리따기 앞(밑손질 구간)
    expect(hm.indexOf('scute_base')).toBeGreaterThan(hm.indexOf('scale_wash'));
    expect(hm.indexOf('scute_flip')).toBeLessThan(hm.indexOf('head_base'));
    for (const sp of ['chub_mackerel', 'yellowtail', 'greater_amberjack', 'bluefin_tuna', 'black_seabream', 'spanish_mackerel']) {
      expect(ids(sp), sp).not.toContain('scute_base');
    }
    // 표시를 단 어종은 전갱이류뿐이다
    expect(Object.values(BUTCHERY_PROFILES).filter((p) => p.hasScutes).map((p) => p.speciesId)).toEqual(['horse_mackerel']);
  });

  it('앞면은 BASE · 뒷면은 FLIP — 칼은 꼬리 자루에서 머리 쪽으로 · 뒷면 선은 앞면의 좌우 대칭', () => {
    const st = buildButcheryStages(getButcheryProfile('horse_mackerel'));
    const a = st.find((s) => s.id === 'scute_base')!, b = st.find((s) => s.id === 'scute_flip')!;
    expect(a.orientation).toBe('BASE');
    expect(b.orientation).toBe('FLIP');
    expect(a.primitive).toBe('guided_cut');
    const pa = a.cut!.guidePath, pb = b.cut!.guidePath;
    // 머리 왼쪽 그림 — 꼬리(오른쪽)에서 시작해 머리(왼쪽)로
    expect(pa[0].x).toBeGreaterThan(pa[pa.length - 1].x);
    expect(pb[0].x).toBeLessThan(pb[pb.length - 1].x);
    expect(pb).toEqual(pa.map((p) => ({ x: Math.round((1 - p.x) * 1000) / 1000, y: p.y })));
    expect(isBodyGuideStage('scute_base')).toBe(true);
    expect(isBodyGuideStage('scute_flip')).toBe(true);
  });

  it('어종 그림 자리로 옮긴다(guideFrame) — 뒷면은 옮긴 앞면의 대칭', () => {
    const M: GuideFrameRemap = { from: { x: 0.05, y: 0.08, w: 0.9, h: 0.84 }, to: { x: 0.157, y: 0.114, w: 0.686, h: 0.771 } };
    const base = buildButcheryStages(getButcheryProfile('horse_mackerel'));
    const moved = buildButcheryStages(getButcheryProfile('horse_mackerel'), { guideFrame: M });
    const a0 = base.find((s) => s.id === 'scute_base')!.cut!.guidePath;
    const a1 = moved.find((s) => s.id === 'scute_base')!.cut!.guidePath;
    const b1 = moved.find((s) => s.id === 'scute_flip')!.cut!.guidePath;
    expect(a1).not.toEqual(a0);
    // 그림 rect 안에 든다
    for (const p of a1) {
      expect(p.x).toBeGreaterThan(M.to.x); expect(p.x).toBeLessThan(M.to.x + M.to.w);
      expect(p.y).toBeGreaterThan(M.to.y); expect(p.y).toBeLessThan(M.to.y + M.to.h);
    }
    expect(b1).toEqual(a1.map((p) => ({ x: Math.round((1 - p.x) * 1000) / 1000, y: p.y })));
  });

  it('확정 — 앞면 선만 확정하면 뒷면은 그 대칭 · 뒷면도 확정하면 그 값', () => {
    const base = [{ x: 0.74, y: 0.5 }, { x: 0.6, y: 0.47 }, { x: 0.45, y: 0.42 }];
    const flip = [{ x: 0.27, y: 0.51 }, { x: 0.56, y: 0.44 }];
    const one = new ButcheryProcess(getButcheryProfile('horse_mackerel'), 1, { guideOverrides: { horse_mackerel: { scute_base: { guidePath: base } } } });
    one.jumpTo('scute_base');
    expect(one.stage!.cut!.guidePath).toEqual(base);
    one.jumpTo('scute_flip');
    expect(one.stage!.cut!.guidePath).toEqual(base.map((p) => ({ x: Math.round((1 - p.x) * 1000) / 1000, y: p.y })));
    const two = new ButcheryProcess(getButcheryProfile('horse_mackerel'), 1, {
      guideOverrides: { horse_mackerel: { scute_base: { guidePath: base }, scute_flip: { guidePath: flip } } },
    });
    two.jumpTo('scute_flip');
    expect(two.stage!.cut!.guidePath).toEqual(flip);
  });

  it('작업 목록 — 전갱이 밑손질에 「모비늘 제거」 · 고등어 · 감성돔에는 없다', () => {
    const tasks = (sp: string): string[] => {
      const p = getButcheryProfile(sp);
      const sec = resolveButcherySections(sectionsForSpecies(sp, p.bodyShape, p.tree), buildButcheryStages(p).map((s) => s.id));
      return sec.find((s) => s.id === 'sec_prep')!.tasks.map((t) => t.id);
    };
    expect(tasks('horse_mackerel')).toEqual(['t_head', 't_fins', 't_descale', 't_scute']);
    expect(tasks('chub_mackerel')).toEqual(['t_head', 't_fins']);
    expect(tasks('black_seabream')).toEqual(['t_head', 't_fins', 't_descale']);
  });

  it('선 그대로 그으면 통과 · 옆줄에서 벗어난 선(등 쪽으로 0.2)은 실패 · 앞면을 끝내면 뒷면으로', () => {
    const p = new ButcheryProcess(getButcheryProfile('horse_mackerel'), 1);
    expect(p.jumpTo('scute_base')).toBe(true);
    p.orientation = 'BASE';
    const path = p.stage!.cut!.guidePath;
    expect(p.submitCut(trace(path.map((q) => ({ x: q.x, y: q.y - 0.2 })))).passed).toBe(false);
    const r = p.submitCut(trace(path));
    expect(r.passed).toBe(true);
    expect(r.stageDone).toBe(true);
    expect(p.stage!.id).toBe('scute_flip');
  });
});

describe('322 — 새 어종 9', () => {
  const NEW = ['gizzard_shad', 'pacific_herring', 'anchovy', 'yellow_croaker', 'white_croaker',
    'redspotted_grouper', 'longtooth_grouper', 'sawedged_perch', 'sevenband_grouper'] as const;
  const oracle = (id: string) => ORACLE_FISH_DB.find((f) => f.speciesId === id)!;
  const dex = (id: string) => FISH_DATABASE.find((f) => f.id === id)!;

  it('오라클 · 도감 · 경락 · 바다 가중 · 조리 프로필에 다 있고 이름 · 규제가 서로 맞는다', () => {
    for (const id of NEW) {
      const o = oracle(id), d = dex(id);
      expect(o, id).toBeTruthy();
      expect(d, id).toBeTruthy();
      expect(d.nameKo, id).toBe(o.nameKo);
      expect(d.nameEn, id).toBe(o.nameEn);
      expect(d.minLegalSizeCm, id).toBe(o.legalMinCm ?? 0);
      expect(d.maxRecordCm, id).toBeGreaterThanOrEqual(o.maxCm);
      expect(d.spriteKey, id).toBe(`fish_${id}`);
      expect(SEAFOOD_AUCTION_MAPPING[id], id).toBeTruthy();
      expect(SPECIES_SEA_WEIGHT[id], id).toBeTruthy();
      expect(FISH_COOKING_PROFILES[id], id).toBeTruthy();
      // 평균 길이의 무게가 도감 평균 무게 범위 근처(체장-체중 식이 엉뚱하지 않다)
      const w = o.lwrA * Math.pow(o.meanCm, o.lwrB ?? 3);
      expect(w, id).toBeGreaterThan(d.avgWeightRangeG[0] * 0.6);
      expect(w, id).toBeLessThan(d.avgWeightRangeG[1] * 1.4);
    }
    // 어종 id · 품목 코드는 겹치지 않는다
    expect(new Set(ORACLE_FISH_DB.map((f) => f.speciesId)).size).toBe(ORACLE_FISH_DB.length);
    expect(new Set(FISH_DATABASE.map((f) => f.id)).size).toBe(FISH_DATABASE.length);
  });

  it('규제 — 청어 20cm · 참조기 15cm · 7월 금어기 / 전어 5.1~7.15는 강원 · 경북에서 빠진다', () => {
    expect(oracle('pacific_herring').legalMinCm).toBe(20);
    expect(oracle('yellow_croaker').legalMinCm).toBe(15);
    expect(oracle('yellow_croaker').closedSeasons).toEqual([{ from: [7, 1], to: [7, 31] }]);
    const shad = oracle('gizzard_shad');
    expect(shad.closedSeasons).toEqual([{ from: [5, 1], to: [7, 15] }]);
    for (const r of ['gangwon_sokcho', 'hometown', 'pohang_guryongpo', 'ulleung', 'dokdo']) expect(isClosedSeasonExempt(shad, r), r).toBe(true);
    for (const r of ['busan_gamcheon', 'ulsan', 'geoje_east', 'yeosu_city', 'taean_anheung', 'jeju_city', '']) expect(isClosedSeasonExempt(shad, r), r).toBe(false);
    // 금어기 지역 예외가 없는 어종은 어디서나 그대로
    expect(isClosedSeasonExempt(oracle('yellow_croaker'), 'gangwon_sokcho')).toBe(false);
  });

  it('경락 품목 이름 — 참조기 · 백조기(보구치)를 「조기」로 뭉개지 않고, 바리류 넷이 서로 섞이지 않는다', () => {
    const m = (item: string, variety = ''): string | undefined => matchMafraSpecies({ MCLASSNAME: item, SCLASSNAME: variety });
    expect(m('참조기')).toBe('yellow_croaker');
    expect(m('조기', '참조기')).toBe('yellow_croaker');
    expect(m('조기', '백조기')).toBe('white_croaker');
    expect(m('보구치')).toBe('white_croaker');
    expect(m('전어')).toBe('gizzard_shad');
    expect(m('청어')).toBe('pacific_herring');
    expect(m('멸치')).toBe('anchovy');
    expect(m('눈퉁멸')).toBe('round_herring');
    expect(m('붉바리')).toBe('redspotted_grouper');
    expect(m('자바리')).toBe('longtooth_grouper');
    expect(m('다금바리')).toBe('sawedged_perch');
    expect(m('능성어')).toBe('sevenband_grouper');
    // 이웃 이름이 새 항목에 빨려 들지 않는다
    expect(m('농어')).toBe('sea_bass');
    expect(m('전갱이')).toBe('horse_mackerel');
  });

  it('존재 — 청어는 겨울 동해 · 백조기는 여름 서해 · 다금바리는 제철 제주에서도 드물다', () => {
    const p = (id: string, region: string, month: number): number => presenceBreakdown(id, { region, month }).total;
    expect(p('pacific_herring', 'gangwon_sokcho', 1)).toBeGreaterThan(p('pacific_herring', 'gangwon_sokcho', 8) * 3);
    expect(p('pacific_herring', 'gangwon_sokcho', 1)).toBeGreaterThan(p('pacific_herring', 'jeju_city', 1) * 5);
    expect(p('white_croaker', 'taean_anheung', 8)).toBeGreaterThan(p('white_croaker', 'gangwon_sokcho', 8) * 5);
    expect(p('gizzard_shad', 'yeosu_city', 10)).toBeGreaterThan(p('gizzard_shad', 'yeosu_city', 2));
    expect(p('sawedged_perch', 'jeju_seogwipo', 7)).toBeLessThanOrEqual(0.25);
    expect(p('longtooth_grouper', 'jeju_seogwipo', 8)).toBeLessThan(p('sevenband_grouper', 'jeju_seogwipo', 8));
    expect(p('sawedged_perch', 'jeju_seogwipo', 7)).toBeLessThan(p('longtooth_grouper', 'jeju_seogwipo', 7));
  });

  it('드문 어종 — 가장 알맞은 자리(제주 깊은 암초 · 제철 · 밤 · 생미끼)에서도 자바리는 가끔 · 다금바리는 거의 안 나온다', () => {
    const ctx = (over: Partial<SpawnContext>): SpawnContext => ({
      depthZ: 100, zMax: 105, region: 'jeju_seogwipo', tidePhase: 4, month: 6, day: 20, baitKey: 'livefish', inReef: true, isNight: true, ...over,
    } as SpawnContext);
    const jabari = speciesBiteShare(ctx({}), 'longtooth_grouper');
    const neung = speciesBiteShare(ctx({ depthZ: 72, zMax: 78 }), 'sevenband_grouper');
    const dageum = speciesBiteShare(ctx({ depthZ: 165, zMax: 170, month: 6, baitKey: 'fishcut', isNight: false }), 'sawedged_perch');
    expect(jabari).toBeGreaterThan(0.01);
    expect(jabari).toBeLessThan(0.08);
    expect(dageum).toBeGreaterThan(0.001);
    expect(dageum).toBeLessThan(0.02);
    expect(neung).toBeGreaterThan(jabari * 2);
    // 드문 어종 값(`abundance`)은 0~1 · 표시한 어종만
    for (const f of ORACLE_FISH_DB) if (f.abundance !== undefined) { expect(f.abundance, f.speciesId).toBeGreaterThan(0); expect(f.abundance, f.speciesId).toBeLessThanOrEqual(1); }
    expect(ORACLE_FISH_DB.filter((f) => f.abundance !== undefined).map((f) => f.speciesId).sort())
      .toEqual(['longtooth_grouper', 'redspotted_grouper', 'sawedged_perch', 'sevenband_grouper']);
  });

  it('파이팅 어종군 — 청어과는 작은 표층어 · 바리류는 굴로 박는 무리', () => {
    for (const id of ['gizzard_shad', 'pacific_herring', 'anchovy']) expect(fightGroupOf(id), id).toBe('mackerel');
    for (const id of ['redspotted_grouper', 'longtooth_grouper', 'sawedged_perch', 'sevenband_grouper']) expect(fightGroupOf(id), id).toBe('rockfish');
    for (const id of ['yellow_croaker', 'white_croaker']) expect(fightGroupOf(id), id).toBe('other');
  });

  it('손질 분류 — 청어과 = 작은 생선 공정 · 조기류 · 바리류 = 방어류 흐름 삼장뜨기 · 큰 바리(80cm↑) = 4덩어리 해체', () => {
    for (const id of NEW) {
      expect(BUTCHERY_WIRED_SPECIES.has(id), id).toBe(true);
      expect(butcheryArtFamily(id), id).toBe('amberjack');
      expect(getButcheryProfile(id).hasScutes ?? false, id).toBe(false);
    }
    for (const id of ['gizzard_shad', 'pacific_herring', 'anchovy']) expect(getButcheryProfile(id).tree, id).toBe('small');
    for (const id of ['yellow_croaker', 'white_croaker', 'redspotted_grouper']) {
      expect(butcheryProfileFor(id, 30).tree, id).toBeUndefined();
      expect(isLoinBreakdown(id, 200), id).toBe(false);
    }
    for (const id of ['longtooth_grouper', 'sawedged_perch', 'sevenband_grouper']) {
      expect(butcheryProfileFor(id, 79).tree, id).toBeUndefined();
      expect(butcheryProfileFor(id, 80).tree, id).toBe('loin');
      expect(butcheryProfileFor(id, 80).filletCount, id).toBe(4);
    }
  });

  it('그림 대기 — 도마 그림이 없는 어종은 닫혀 있고, 목록에서 빼면 열리는 구조다', () => {
    for (const id of BUTCHERY_ART_PENDING_SPECIES) {
      expect(BUTCHERY_WIRED_SPECIES.has(id), id).toBe(true);
      expect(BUTCHERY_IMPLEMENTED_SPECIES.has(id), id).toBe(false);
      expect(canButcherSpecies(id), id).toBe(false);
    }
    for (const id of BUTCHERY_WIRED_SPECIES) {
      expect(BUTCHERY_IMPLEMENTED_SPECIES.has(id), id).toBe(!BUTCHERY_ART_PENDING_SPECIES.has(id));
    }
    // 이미 열려 있던 어종은 그대로 열려 있다
    for (const id of ['horse_mackerel', 'black_seabream', 'bluefin_tuna', 'conger_eel', 'flatfish']) expect(canButcherSpecies(id), id).toBe(true);
  });

  const run = (id: string, cm: number): ButcheryProcess => {
    const p = new ButcheryProcess(butcheryProfileFor(id, cm), 1);
    for (let guard = 0; guard < 300 && !p.finished; guard++) {
      const s = p.stage!;
      p.orientation = s.orientation;
      const k = s.primitive;
      if (k === 'tap') p.submitTap(0);
      else if (k === 'drag_fill' || k === 'scoop') p.submitFill(1);
      else if (k === 'wash') p.submitWash();
      else {
        const left = s.cut!.guidePaths?.length ? s.cut!.guidePaths.filter((_, i) => !p.donePathIndices.has(i)) : [s.cut!.guidePath];
        expect(p.submitCut(trace(left[0])).passed, `${id} ${s.id}`).toBe(true);
      }
    }
    return p;
  };

  it.each(NEW)('%s — 공정을 정답 입력으로 끝까지(그림이 열리면 바로 쓸 수 있다)', (id) => {
    const p = run(id, 30);
    expect(p.finished).toBe(true);
    expect(p.filletsDone).toBe(2);
    // 섹션 트리의 모든 작업이 실제 단계를 가진다(빈 작업 없음)
    const prof = butcheryProfileFor(id, 30);
    const have = new Set(buildButcheryStages(prof).map((s) => s.id));
    const sec = resolveButcherySections(sectionsForSpecies(id, prof.bodyShape, prof.tree), have);
    for (const s of sec) for (const t of s.tasks) for (const sid of t.stageIds) expect(have.has(sid), `${id} ${t.id} ${sid}`).toBe(true);
    expect(sec.flatMap((s) => s.tasks).some((t) => t.id === 't_scute')).toBe(false);
  });

  it.each(['longtooth_grouper', 'sawedged_perch', 'sevenband_grouper'])('%s — 큰 개체는 4덩어리 해체로 끝까지', (id) => {
    const p = run(id, 95);
    expect(p.finished).toBe(true);
    expect(p.filletsDone).toBe(4);
  });
});
