/**
 * @file ButcheryFlow315.test.ts
 * @description 315차 — 장어류 손질 공정 · F9 [확정] 좌표 끼우기.
 *  - 붕장어 = 등 가르기 · 갯장어 = 배 가르기 + 뼈끊기 · 먹장어 = 목 칼집 + 껍질 벗기기 (뼈 · 지느러미 없음)
 *  - 확정 좌표는 좌표만 바꾼다(판정 옵션 그대로) · 어종 > 군 · 군 좌표는 온마리 선만 어종 그림 자리로 옮긴다
 */
import { describe, it, expect } from 'vitest';
import { ButcheryProcess, applyGuideOverrides, butcheryGuideFamilyKey, isBodyGuideStage, buildButcheryStages, evaluateCut } from './ButcheryProcess.js';
import { getButcheryProfile, getButcheryFamily } from '../db-schema/ButcheryProfiles.js';
import { sectionsForSpecies, resolveButcherySections } from '../db-schema/ButcherySections.js';
import { EEL_GUIDE } from '../db-schema/EelGuideGeometry.js';
import type { CutPoint } from '../types/Butchery.js';

const EELS = ['conger_eel', 'pike_conger', 'hagfish'];

describe('315 — 장어류 손질', () => {
  it('세 어종 모두 손질할 수 있고 공정이 어종마다 다르다', () => {
    for (const id of EELS) expect(getButcheryFamily(id), id).toBe('finfish');
    const ids = (sp: string): string[] => new ButcheryProcess(getButcheryProfile(sp), 1).stageList.map((s) => s.id);
    expect(ids('conger_eel')).toEqual([
      'eel_pin', 'eel_slime', 'eel_back_cut', 'eel_spread', 'eel_gut_out', 'eel_spine_cut', 'eel_fin_trim', 'eel_head_off',
    ]);
    expect(ids('pike_conger')).toEqual([
      'eel_pin', 'eel_slime', 'eel_belly_cut', 'eel_spread', 'eel_gut_out', 'eel_spine_cut', 'eel_fin_trim', 'eel_head_off', 'eel_honekiri',
    ]);
    expect(ids('hagfish')).toEqual([
      'eel_pin', 'eel_neck_cut', 'eel_skin_peel', 'eel_belly_cut', 'eel_spread', 'eel_gut_out', 'eel_wash', 'eel_head_off',
    ]);
  });

  it('섹션 트리는 그 어종 공정에 있는 단계만 남는다(먹장어에 중골 · 지느러미 없음 · 붕장어에 껍질 벗기기 없음)', () => {
    const tasks = (sp: string): string[] => {
      const p = new ButcheryProcess(getButcheryProfile(sp), 1);
      return resolveButcherySections(sectionsForSpecies(sp, 'round'), p.stageList.map((s) => s.id)).flatMap((s) => s.tasks.map((t) => t.id));
    };
    expect(tasks('hagfish')).not.toContain('t_eel_spine');
    expect(tasks('hagfish')).toContain('t_eel_peel');
    expect(tasks('conger_eel')).not.toContain('t_eel_peel');
    expect(tasks('pike_conger')).toContain('t_eel_honekiri');
  });

  it('유도선은 도마 틀 안이고 등 가르기는 등(위) · 배 가르기는 배(아래)를 지난다', () => {
    for (const id of EELS) {
      const g = EEL_GUIDE[id];
      const all: CutPoint[] = [g.pin, ...g.slime, ...g.backCut, ...g.bellyCut, ...g.spine, ...g.finTop, ...g.finBot, ...g.head, ...g.honekiri.flat()];
      for (const p of all) {
        expect(p.x, id).toBeGreaterThan(0); expect(p.x, id).toBeLessThan(1);
        expect(p.y, id).toBeGreaterThan(0); expect(p.y, id).toBeLessThan(1);
      }
      const mid = (a: CutPoint[]): number => a.reduce((s, p) => s + p.y, 0) / a.length;
      expect(mid(g.backCut), id).toBeLessThan(0.5);
      expect(mid(g.bellyCut), id).toBeGreaterThan(0.5);
    }
  });

  it('칼선에서 벗어난 궤적은 통과하지 못한다(등 가르기를 몸 가운데로 그으면 실패)', () => {
    const st = buildButcheryStages(getButcheryProfile('conger_eel')).find((s) => s.id === 'eel_back_cut')!;
    const onLine = evaluateCut(st.cut!.guidePath, st.cut!);
    const off = evaluateCut(st.cut!.guidePath.map((p) => ({ x: p.x, y: p.y + 0.12 })), st.cut!);
    expect(onLine.passed).toBe(true);
    expect(off.passed).toBe(false);
  });
});

describe('315 — F9 [확정] 좌표 끼우기', () => {
  it('어종 확정은 좌표만 바꾸고 판정 옵션(strong · tolerance)은 그대로', () => {
    const prof = getButcheryProfile('black_seabream');
    const base = buildButcheryStages(prof).find((s) => s.id === 'head_flip')!;
    const line: CutPoint[] = [{ x: 0.7, y: 0.31 }, { x: 0.66, y: 0.86 }];
    const out = applyGuideOverrides(buildButcheryStages(prof), 'black_seabream', false, undefined, {
      black_seabream: { head_flip: { guidePath: line } },
    }).find((s) => s.id === 'head_flip')!;
    expect(out.cut!.guidePath).toEqual(line);
    expect(out.cut!.strong).toBe(base.cut!.strong);
    expect(out.cut!.tolerance).toBe(base.cut!.tolerance);
  });

  it('어종 키가 군 키보다 먼저다 · 군 좌표는 온마리 선만 어종 그림 자리로 옮긴다', () => {
    const prof = getButcheryProfile('sea_bass');
    const frame = { from: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }, to: { x: 0.2, y: 0.3, w: 0.6, h: 0.4 } };
    const famLine: CutPoint[] = [{ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.9 }];
    const fam = butcheryGuideFamilyKey('sea_bass', false)!;
    expect(fam).toBe('@amberjack');
    const live = { [fam]: { tail_grip: { guidePath: famLine, familyFrame: true }, gut_scoop: { sweepPath: famLine, familyFrame: true } } };
    const st = applyGuideOverrides(buildButcheryStages(prof, { guideFrame: frame }), 'sea_bass', false, frame, live);
    const tail = st.find((s) => s.id === 'tail_grip')!;
    expect(isBodyGuideStage('tail_grip')).toBe(true);
    expect(tail.cut!.guidePath[0]).toEqual({ x: 0.5, y: 0.3 });     // 0.1 → 0.3 (from y 0.1 · h 0.8 → to y 0.3 · h 0.4)
    const gut = st.find((s) => s.id === 'gut_scoop');
    if (gut) expect(gut.sweepPath![0]).toEqual({ x: 0.5, y: 0.1 });   // 개복 뒤 뷰 — 옮기지 않는다
    // 어종 키가 있으면 군 키를 이긴다
    const own: CutPoint[] = [{ x: 0.4, y: 0.4 }, { x: 0.4, y: 0.6 }];
    const st2 = applyGuideOverrides(buildButcheryStages(prof), 'sea_bass', false, frame, { ...live, sea_bass: { tail_grip: { guidePath: own } } });
    expect(st2.find((s) => s.id === 'tail_grip')!.cut!.guidePath).toEqual(own);
  });

  it('두족류 · 장어류는 군 키가 없다(어종마다 그림이 따로)', () => {
    expect(butcheryGuideFamilyKey('squid', true)).toBeNull();
    expect(butcheryGuideFamilyKey('conger_eel', false)).toBeNull();
  });

  it('여러 선(지느러미 · 뼈끊기)도 통째로 바꿔 끼운다', () => {
    const lines: CutPoint[][] = [[{ x: 0.3, y: 0.3 }, { x: 0.6, y: 0.3 }], [{ x: 0.3, y: 0.7 }, { x: 0.6, y: 0.7 }]];
    const p = new ButcheryProcess(getButcheryProfile('conger_eel'), 1, { guideOverrides: { conger_eel: { eel_fin_trim: { guidePaths: lines } } } });
    const fin = p.stageList.find((s) => s.id === 'eel_fin_trim')!;
    expect(fin.cut!.guidePaths).toEqual(lines);
    expect(fin.cut!.guidePath).toEqual(lines[0]);
  });
});
