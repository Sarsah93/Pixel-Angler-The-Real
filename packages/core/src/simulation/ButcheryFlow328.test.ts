/**
 * @file ButcheryFlow328.test.ts
 * @description 328차 — 사용자 지침 「비늘치기 뒤 단계는 어종끼리 같다」를 지키는 시험.
 *  - **지아이뼈 분리 = 뼈 줄 위쪽 한 칼 · 아래쪽 한 칼**(끝점은 같다 · 순서가 있다 · 필렛 B는 좌우 대칭)
 *  - 같은 그림을 쓰는 어종 쌍(참돔 = 참돔 야간)은 확정 좌표를 함께 쓴다
 *  - 개체 조건으로 그림이 갈리는 어종(돌돔 수컷 · 용치놀래기 수컷)은 확정한 온마리 선을 그 그림 자리로 옮긴다(`speciesFrame`)
 *  - 꼬리 칼집 선은 그림의 꼬리 자루(`tailLines`) — 확정 좌표가 먼저
 *  - 군 공통값(핏줄 긁기 · 박피 ① · 갈빗대)이 확정하지 않은 어종에 닿는다
 *  - 열린 어종 전부 정답 입력으로 완주(삼장뜨기 크기 · 해체 크기)
 */
import { describe, it, expect } from 'vitest';
import {
  ButcheryProcess, buildButcheryStages, applyGuideOverrides, splitPinStrokes, butcheryGuideTwin, butcheryGuideFamilyKey,
  PIN_STROKE_SPREAD, remapGuidePoint,
} from './ButcheryProcess.js';
import type { GuideFrameRemap } from './ButcheryProcess.js';
import { butcheryProfileFor, getButcheryProfile, BUTCHERY_IMPLEMENTED_SPECIES, isLoinBreakdown } from '../db-schema/ButcheryProfiles.js';
import { getCephalopodProfile } from '../db-schema/CephalopodProfiles.js';
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
const mirror = (l: readonly CutPoint[]): CutPoint[] => l.map((p) => ({ x: Math.round((1 - p.x) * 1000) / 1000, y: p.y }));
const pinOf = (p: ButcheryProcess, id: 'pin_a' | 'pin_b') => p.stageList.find((s) => s.id === id)!.cut!;

describe('328 — 지아이뼈 분리: 뼈 줄 위 · 아래 두 칼', () => {
  it('가운데 선을 위 선 → 아래 선으로 가른다 — 시작점에서 벌어지고 끝점에서 만난다', () => {
    const p = new ButcheryProcess(getButcheryProfile('sea_bass'), 1, { guideOverrides: {} });
    for (const id of ['pin_a', 'pin_b'] as const) {
      const c = pinOf(p, id);
      expect(c.ordered, id).toBe(true);
      expect(c.guidePaths!.length, id).toBe(2);
      expect(c.strokesRequired, id).toBeUndefined();
      const [up, dn] = c.guidePaths!;
      expect(c.guidePath, id).toEqual(up);
      // 시작점 — 뼈 줄에서 위 · 아래로 같은 폭
      expect(dn[0].y - up[0].y, id).toBeCloseTo(PIN_STROKE_SPREAD * 2, 3);
      expect(up[0].x, id).toBe(dn[0].x);
      // 끝점 — 같은 점
      expect(up[up.length - 1], id).toEqual(dn[dn.length - 1]);
    }
    // 필렛 A는 왼쪽(머리)에서 오른쪽(꼬리)으로 · 필렛 B는 좌우로 뒤집힌 그림이라 오른쪽에서 왼쪽으로
    const a = pinOf(p, 'pin_a').guidePaths![0], b = pinOf(p, 'pin_b').guidePaths![0];
    expect(a[0].x).toBeLessThan(a[a.length - 1].x);
    expect(b[0].x).toBeGreaterThan(b[b.length - 1].x);
    // 칼집 수는 둘
    p.jumpTo('pin_a');
    expect(p.currentStrokesLeft).toBe(2);
  });

  it('굽은 뼈 줄(점 9개)도 따라가며 좁아진다 — 벌어짐은 선을 따라 줄기만 한다', () => {
    const mid: CutPoint[] = [
      { x: 0.08, y: 0.50 }, { x: 0.19, y: 0.46 }, { x: 0.31, y: 0.44 }, { x: 0.42, y: 0.45 }, { x: 0.54, y: 0.46 },
      { x: 0.65, y: 0.48 }, { x: 0.75, y: 0.49 }, { x: 0.84, y: 0.50 }, { x: 0.92, y: 0.49 },
    ];
    const base = buildButcheryStages(getButcheryProfile('chub_mackerel'), { pinLine: mid });
    const [st] = splitPinStrokes(base.filter((s) => s.id === 'pin_a'));
    const [up, dn] = st.cut!.guidePaths!;
    let prev = Infinity;
    mid.forEach((q, i) => {
      expect(up[i].x).toBe(q.x);
      expect((up[i].y + dn[i].y) / 2).toBeCloseTo(q.y, 2);
      const gap = dn[i].y - up[i].y;
      expect(gap).toBeLessThanOrEqual(prev + 1e-9);
      prev = gap;
    });
    expect(prev).toBe(0);
  });

  it('순서가 있다 — 첫 칼은 위 선 · 둘째 칼은 아래 선 · 크게 벗어난 선은 실패', () => {
    const p = new ButcheryProcess(getButcheryProfile('sea_bass'), 1, { guideOverrides: {} });
    expect(p.jumpTo('pin_a')).toBe(true);
    p.orientation = p.stage!.orientation;
    const [up, dn] = p.stage!.cut!.guidePaths!;
    expect(p.submitCut(trace(up.map((q) => ({ x: q.x, y: q.y + 0.25 })))).passed).toBe(false);
    const r1 = p.submitCut(trace(up));
    expect(r1.passed).toBe(true);
    expect(r1.matchedPath).toBe(0);
    expect(r1.stageDone).toBe(false);
    expect(r1.strokesLeft).toBe(1);
    const r2 = p.submitCut(trace(dn));
    expect(r2.passed).toBe(true);
    expect(r2.matchedPath).toBe(1);
    expect(r2.stageDone).toBe(true);
    expect(p.stage!.id).toBe('pin_b');
  });

  it('확정한 선이 뼈 줄이다 — 필렛 A만 확정하면 필렛 B는 그 좌우 대칭', () => {
    const line: CutPoint[] = [{ x: 0.13, y: 0.5 }, { x: 0.5, y: 0.47 }, { x: 0.9, y: 0.51 }];
    const p = new ButcheryProcess(getButcheryProfile('sea_bass'), 1, { guideOverrides: { sea_bass: { pin_a: { guidePath: line } } } });
    const a = pinOf(p, 'pin_a').guidePaths!, b = pinOf(p, 'pin_b').guidePaths!;
    expect(a[0][a[0].length - 1]).toEqual(line[2]);
    expect(b[0]).toEqual(mirror(a[0]));
    expect(b[1]).toEqual(mirror(a[1]));
    // 필렛 B도 확정하면 그 값이 뼈 줄
    const lb: CutPoint[] = [{ x: 0.86, y: 0.52 }, { x: 0.09, y: 0.55 }];
    const q = new ButcheryProcess(getButcheryProfile('sea_bass'), 1, {
      guideOverrides: { sea_bass: { pin_a: { guidePath: line }, pin_b: { guidePath: lb } } },
    });
    expect(pinOf(q, 'pin_b').guidePaths![0][1]).toEqual(lb[1]);
    expect((pinOf(q, 'pin_b').guidePaths![0][0].y + pinOf(q, 'pin_b').guidePaths![1][0].y) / 2).toBeCloseTo(0.52, 3);
  });

  it('편집기에서 두 선을 따로 맞춰 확정하면(선 2개) 가르지 않고 순서만 건다', () => {
    const two: CutPoint[][] = [[{ x: 0.14, y: 0.44 }, { x: 0.9, y: 0.5 }], [{ x: 0.14, y: 0.56 }, { x: 0.9, y: 0.5 }]];
    const p = new ButcheryProcess(getButcheryProfile('sea_bass'), 1, { guideOverrides: { sea_bass: { pin_a: { guidePaths: two } } } });
    expect(pinOf(p, 'pin_a').guidePaths).toEqual(two);
    expect(pinOf(p, 'pin_a').ordered).toBe(true);
    expect(pinOf(p, 'pin_b').guidePaths).toEqual(two.map(mirror));
  });

  it('작은 생선의 잔뼈 뽑기(핀셋 문지르기)는 건드리지 않는다', () => {
    const p = new ButcheryProcess(getButcheryProfile('pacific_saury'), 1, { guideOverrides: {} });
    const s = p.stageList.find((x) => x.id === 'pin_a')!;
    expect(s.cut?.guidePaths).toBeUndefined();
    expect(s.sweepPath!.length).toBeGreaterThan(1);
  });
});

describe('328 — 같은 그림을 쓰는 어종 쌍 · 개체 그림', () => {
  it('참돔 = 참돔(야간) — 한쪽 확정을 다른 쪽도 쓴다 · 둘 다 있으면 나중 것', () => {
    expect(butcheryGuideTwin('red_seabream')).toBe('night_seabream');
    expect(butcheryGuideTwin('night_seabream')).toBe('red_seabream');
    expect(butcheryGuideTwin('black_seabream')).toBeUndefined();
    const stages = buildButcheryStages(getButcheryProfile('red_seabream'));
    const a: CutPoint[] = [{ x: 0.3, y: 0.2 }, { x: 0.33, y: 0.8 }], b: CutPoint[] = [{ x: 0.31, y: 0.22 }, { x: 0.34, y: 0.78 }];
    const head = (t: Parameters<typeof applyGuideOverrides>[4], sp: string): CutPoint[] =>
      applyGuideOverrides(stages, sp, false, undefined, t).find((s) => s.id === 'head_base')!.cut!.guidePath;
    expect(head({ night_seabream: { head_base: { guidePath: a, at: '2099-01-01T00:00:00.000Z' } } }, 'red_seabream')).toEqual(a);
    expect(head({ red_seabream: { head_base: { guidePath: a, at: '2099-01-01T00:00:00.000Z' } } }, 'night_seabream')).toEqual(a);
    const both = {
      night_seabream: { head_base: { guidePath: a, at: '2099-01-01T00:00:00.000Z' } },
      red_seabream: { head_base: { guidePath: b, at: '2099-01-02T00:00:00.000Z' } },
    };
    expect(head(both, 'red_seabream')).toEqual(b);
    expect(head(both, 'night_seabream')).toEqual(b);
  });

  it('저장된 표 — 참돔은 참돔(야간)에서 확정한 온마리 선을 그대로 쓴다', () => {
    const night = BUTCHERY_GUIDE_OVERRIDES.night_seabream ?? {};
    expect(Object.keys(night).length).toBeGreaterThan(10);
    const day = new ButcheryProcess(getButcheryProfile('red_seabream'), 1), ngt = new ButcheryProcess(getButcheryProfile('night_seabream'), 1);
    for (const id of ['ikejime', 'bleed_cut', 'head_base', 'head_flip', 'finectomy', 'scale_base', 'tail_grip', 'rib_a', 'pin_a', 'peel_grip']) {
      const s1 = day.stageList.find((s) => s.id === id)!, s2 = ngt.stageList.find((s) => s.id === id)!;
      expect(s1.cut?.guidePaths ?? s1.cut?.guidePath ?? s1.sweepPath ?? s1.tapPoint, id)
        .toEqual(s2.cut?.guidePaths ?? s2.cut?.guidePath ?? s2.sweepPath ?? s2.tapPoint);
    }
  });

  it('개체 그림이 다르면(speciesFrame) 어종 확정의 온마리 선만 그 그림 자리로 옮긴다', () => {
    const SF: GuideFrameRemap = { from: { x: 0.043, y: 0.062, w: 0.914, h: 0.876 }, to: { x: 0.043, y: 0.129, w: 0.914, h: 0.743 } };
    const stages = buildButcheryStages(getButcheryProfile('rainbow_wrasse'));
    const head: CutPoint[] = [{ x: 0.3, y: 0.2 }, { x: 0.33, y: 0.8 }], rib: CutPoint[] = [{ x: 0.1, y: 0.4 }, { x: 0.45, y: 0.85 }];
    const t = { rainbow_wrasse: { head_base: { guidePath: head }, rib_a: { guidePath: rib } } };
    const plain = applyGuideOverrides(stages, 'rainbow_wrasse', false, undefined, t);
    const moved = applyGuideOverrides(stages, 'rainbow_wrasse', false, undefined, t, undefined, SF);
    expect(plain.find((s) => s.id === 'head_base')!.cut!.guidePath).toEqual(head);
    expect(moved.find((s) => s.id === 'head_base')!.cut!.guidePath).toEqual(head.map((q) => remapGuidePoint(q, SF)));
    // 필렛 뷰는 개체 그림과 무관하다(필렛 그림은 어종마다 하나)
    expect(moved.find((s) => s.id === 'rib_a')!.cut!.guidePath).toEqual(rib);
    // 군 좌표는 어종군 그림 → 이 개체 그림 대응(guideFrame)이 맡는다 — speciesFrame을 겹쳐 쓰지 않는다
    //  (저장된 표에 없는 가짜 어종 id — 어종 확정이 끼어들지 않게)
    const famKey = butcheryGuideFamilyKey('test_fish_328', false)!;
    const fam = applyGuideOverrides(stages, 'test_fish_328', false, undefined,
      { [famKey]: { head_base: { guidePath: head, familyFrame: true } } }, undefined, SF);
    expect(fam.find((s) => s.id === 'head_base')!.cut!.guidePath).toEqual(head);
  });
});

describe('328 — 꼬리 칼집 선은 그림의 꼬리 자루', () => {
  const tail = { a: [{ x: 0.69, y: 0.43 }, { x: 0.69, y: 0.62 }], b: [{ x: 0.31, y: 0.43 }, { x: 0.31, y: 0.62 }] };

  it('client가 잰 선(tailLines)이 어종군 기본선을 대신한다 · 없으면 전처럼 기본선', () => {
    const p = getButcheryProfile('sea_bass');
    const base = buildButcheryStages(p), own = buildButcheryStages(p, { tailLines: tail });
    expect(own.find((s) => s.id === 'tail_grip')!.cut!.guidePath).toEqual(tail.a);
    expect(own.find((s) => s.id === 'tail_grip_b')!.cut!.guidePath).toEqual(tail.b);
    expect(base.find((s) => s.id === 'tail_grip')!.cut!.guidePath).not.toEqual(tail.a);
    // 다른 단계는 그대로
    expect(own.find((s) => s.id === 'head_base')!.cut!.guidePath).toEqual(base.find((s) => s.id === 'head_base')!.cut!.guidePath);
  });

  it('확정한 꼬리 칼집이 있으면 그것이 먼저다', () => {
    const conf = BUTCHERY_GUIDE_OVERRIDES.yellowtail?.tail_grip?.guidePath;
    expect(conf).toBeTruthy();
    const p = new ButcheryProcess(butcheryProfileFor('yellowtail', 60), 1, { tailLines: tail });
    expect(p.stageList.find((s) => s.id === 'tail_grip')!.cut!.guidePath).toEqual(conf);
  });
});

describe('328 — 비늘치기 뒤 단계의 군 공통값', () => {
  it('두 군에 핏줄 긁기 · 박피 ① · 갈빗대 공통값이 있다(박피 ① · 갈빗대는 그림 자리로 옮기는 좌표)', () => {
    for (const fam of ['@bream', '@amberjack']) {
      const t = BUTCHERY_GUIDE_OVERRIDES[fam] ?? {};
      expect(t.vessel_scrub?.sweepPath?.length, fam).toBe(2);
      expect(t.vessel_scrub?.familyFrame ?? false, fam).toBe(false);
      for (const id of ['peel_grip', 'rib_a', 'rib_b']) {
        expect(t[id]?.guidePath?.length ?? 0, `${fam} ${id}`).toBeGreaterThan(1);
        expect(t[id]?.familyFrame, `${fam} ${id}`).toBe(true);
      }
      // 장뜨기 8단계(321)도 그대로 있다
      for (const id of ['fillet_0_score', 'fillet_1_sever']) expect(t[id]?.guidePath, `${fam} ${id}`).toBeTruthy();
    }
  });

  it('확정하지 않은 어종(농어)은 공통값을 쓰고 확정한 어종(강담돔 — 기본선 그대로 확정)은 제 값을 쓴다', () => {
    const fam = BUTCHERY_GUIDE_OVERRIDES['@amberjack']!;
    const bass = new ButcheryProcess(getButcheryProfile('sea_bass'), 1);
    expect(bass.stageList.find((s) => s.id === 'vessel_scrub')!.sweepPath).toEqual(fam.vessel_scrub!.sweepPath);
    // 그림 틀을 넘기지 않으면 군 좌표 그대로다(틀이 있으면 그 어종 필렛 그림 자리로 옮겨진다)
    expect(bass.stageList.find((s) => s.id === 'rib_a')!.cut!.guidePath).toEqual(fam.rib_a!.guidePath);
    expect(bass.stageList.find((s) => s.id === 'peel_grip')!.cut!.guidePath).toEqual(fam.peel_grip!.guidePath);
    const own = BUTCHERY_GUIDE_OVERRIDES.spotted_knifejaw?.rib_a?.guidePath;
    expect(own).toBeTruthy();
    const knife = new ButcheryProcess(getButcheryProfile('spotted_knifejaw'), 1);
    expect(knife.stageList.find((s) => s.id === 'rib_a')!.cut!.guidePath).toEqual(own);
  });
});

describe('328 — 열린 어종 전부 정답 입력으로 완주', () => {
  const run = (id: string, cm: number): ButcheryProcess => {
    const p = new ButcheryProcess(butcheryProfileFor(id, cm), 1);
    for (let guard = 0; guard < 400 && !p.finished; guard++) {
      const s = p.stage!;
      p.orientation = s.orientation;
      while (p.rotation !== (s.rotationRequired ?? 0)) p.rotate(1);   // 넙치류 — 도마를 돌려 맞춘다
      const k = s.primitive;
      if (k === 'tap') p.submitTap(0);
      else if (k === 'drag_fill' || k === 'scoop') p.submitFill(1);
      else if (k === 'wash') p.submitWash();
      else if (k === 'peel') p.submitPeelPull(1);
      else {
        const left = s.cut!.guidePaths?.length ? s.cut!.guidePaths.filter((_, i) => !p.donePathIndices.has(i)) : [s.cut!.guidePath];
        expect(p.submitCut(trace(left[0])).passed, `${id} ${cm}cm ${s.id}`).toBe(true);
      }
    }
    return p;
  };
  const FISH = [...BUTCHERY_IMPLEMENTED_SPECIES].filter((id) => !getCephalopodProfile(id) && getButcheryProfile(id).tree !== 'eel');

  it.each(FISH)('%s', (id) => {
    expect(run(id, 30).finished, `${id} 30cm`).toBe(true);
    if (isLoinBreakdown(id, 150)) {
      const big = run(id, 150);
      expect(big.finished, `${id} 150cm`).toBe(true);
      expect(big.filletsDone, `${id} 150cm`).toBe(4);
    }
  });
});
