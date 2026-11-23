/**
 * @file KamaStages333.test.ts
 * @description 333 — 가마살 공정(가마살 떼기 · 도려내기) 기하 · 단계 · 머리따기 사선.
 *  사용자 설명: 가마살 = 아가미 선(방혈 자리)과 머리따기 사선 사이의 배 쪽 세모 덩이 → 그 가운데 가슴지느러미 아래 넓은 세모만 도려낸 것이 횟감(한쪽 2 ~ 3점).
 */
import { describe, it, expect } from 'vitest';
import { ButcheryProcess, buildButcheryStages } from './ButcheryProcess.js';
import { butcheryProfileFor, getButcheryProfile, LOIN_KAMA_SPECIES } from '../db-schema/ButcheryProfiles.js';
import { BUTCHERY_GUIDE_OVERRIDES } from '../db-schema/ButcheryGuideOverrides.js';
import { sectionsForSpecies, resolveButcherySections } from '../db-schema/ButcherySections.js';
import {
  kamaGeometry, kamaHeadLine, kamaBlockPoint, kamaCarveView, kamaPieceCount, kamaMeatUnits, pathXAtY, pectoralLineOf, isKamaStageId, kamaTrimSideOf,
  KAMA_BLOCK_SLOTS, KAMA_THREE_PIECE_MIN_G, KAMA_MEAT_SHARE, KAMA_PIECE_TARGET_G, KAMA_PIECE_MAX, KAMA_MEAT_UNITS_MAX,
} from '../db-schema/KamaStages.js';
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
/** 다각형 안 판정(레이 캐스팅) */
const inside = (p: CutPoint, poly: readonly CutPoint[]): boolean => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};

const ARC: CutPoint[] = [{ x: 0.22, y: 0.27 }, { x: 0.25, y: 0.34 }, { x: 0.262, y: 0.42 }, { x: 0.266, y: 0.49 }, { x: 0.26, y: 0.57 }, { x: 0.24, y: 0.64 }, { x: 0.205, y: 0.71 }];
const HEAD_OLD: CutPoint[] = [{ x: 0.262, y: 0.234 }, { x: 0.324, y: 0.789 }];
const PECT: CutPoint[] = [{ x: 0.289, y: 0.462 }, { x: 0.3, y: 0.52 }, { x: 0.316, y: 0.578 }, { x: 0.336, y: 0.633 }];

describe('333 가마살 기하', () => {
  it('가슴지느러미 밑동 선은 짧고 가파른 선이다 — 등 · 배 선은 아니다', () => {
    const dorsal: CutPoint[] = [{ x: 0.26, y: 0.25 }, { x: 0.47, y: 0.21 }, { x: 0.81, y: 0.53 }];
    const ventral: CutPoint[] = [{ x: 0.28, y: 0.76 }, { x: 0.58, y: 0.79 }, { x: 0.82, y: 0.6 }];
    expect(pectoralLineOf([PECT, dorsal, ventral])).toEqual(PECT);
    expect(pectoralLineOf([dorsal, ventral, PECT])).toEqual(PECT);
    expect(pectoralLineOf([dorsal, ventral])).toBeUndefined();
  });

  it('머리따기 사선 — 위 끝은 그대로 두고 가슴지느러미 밑동 아래 끝 뒤를 지나게 눕힌다', () => {
    const next = kamaHeadLine(HEAD_OLD, PECT, true);
    expect(next[0]).toEqual({ x: 0.262, y: 0.234 });
    expect(next[1].y).toBe(0.789);
    const pb = PECT[PECT.length - 1];
    expect(pathXAtY(next, pb.y)).toBeGreaterThan(pb.x);          // 지느러미 뒤(꼬리 쪽)
    expect(pathXAtY(HEAD_OLD, pb.y)).toBeLessThan(pb.x);         // 옛 사선은 지느러미 앞
    // 이미 뒤를 지나면 그대로 · 한 번 더 돌려도 같다
    expect(kamaHeadLine(next, PECT, true)).toEqual(next);
    // 2면(머리 오른쪽)은 좌우 대칭
    const mir = (p: CutPoint[]): CutPoint[] => p.map((q) => ({ x: Math.round((1 - q.x) * 1e4) / 1e4, y: q.y }));
    const flip = kamaHeadLine(mir(HEAD_OLD), mir(PECT), false);
    expect(pathXAtY(flip, pb.y)).toBeLessThan(1 - pb.x);
    expect(flip[1].x).toBeCloseTo(1 - next[1].x, 3);
    // 가슴지느러미 선이 없으면 아래 끝만 정해진 만큼
    const plain = kamaHeadLine(HEAD_OLD, undefined, true);
    expect(plain[1].x).toBeGreaterThan(HEAD_OLD[1].x);
  });

  it('덩이 = 위 끝 가로 칼집 + 아가미 선 + 사선으로 둘러싸인 배 쪽 세모', () => {
    const head = kamaHeadLine(HEAD_OLD, PECT, true);
    const geo = kamaGeometry(ARC, head, head.map((q) => ({ x: 1 - q.x, y: q.y })), PECT);
    const a = geo.a;
    // 칼길 — 사선 위의 점에서 시작해 아가미 선 위 끝 → 아래 끝
    expect(a.cut.length).toBe(ARC.length + 1);
    expect(a.cut[0].y).toBe(ARC[0].y);
    expect(a.cut[0].x).toBeCloseTo(pathXAtY(head, ARC[0].y), 3);
    expect(a.cut.slice(1)).toEqual(ARC);
    // 덩이 안 — 아가미 선과 사선 사이 · 덩이 밖 — 머리 쪽 · 몸통 쪽 · 위 끝보다 위
    const y = 0.6, mid = (pathXAtY(ARC, y) + pathXAtY(head, y)) / 2;
    expect(inside({ x: mid, y }, a.poly)).toBe(true);
    expect(inside({ x: pathXAtY(ARC, y) - 0.04, y }, a.poly)).toBe(false);
    expect(inside({ x: pathXAtY(head, y) + 0.04, y }, a.poly)).toBe(false);
    expect(inside({ x: mid, y: ARC[0].y - 0.04 }, a.poly)).toBe(false);
    // 배 쪽이 넓다(세모)
    const wTop = pathXAtY(head, 0.3) - pathXAtY(ARC, 0.3), wBot = pathXAtY(head, 0.7) - pathXAtY(ARC, 0.7);
    expect(wBot).toBeGreaterThan(wTop * 2);
    // 2면은 좌우 대칭
    expect(geo.b.cut.map((q) => q.y)).toEqual(a.cut.map((q) => q.y));
    geo.b.cut.forEach((q, i) => expect(q.x).toBeCloseTo(1 - a.cut[i].x, 3));
  });

  it('도려내는 선 — 가슴지느러미 아래를 아가미 선에서 사선까지 · 그 아래가 횟감', () => {
    const head = kamaHeadLine(HEAD_OLD, PECT, true);
    const geo = kamaGeometry(ARC, head, head.map((q) => ({ x: 1 - q.x, y: q.y })), PECT, 1.5);
    const c = geo.a.carve;
    expect(c[0].x).toBeCloseTo(pathXAtY(ARC, c[0].y), 3);
    expect(c[c.length - 1].x).toBeCloseTo(pathXAtY(head, c[c.length - 1].y), 3);
    // 가슴지느러미 밑동 가운데보다 아래에서 시작해 밑동 아래 끝 아래에서 끝난다
    expect(c[0].y).toBeGreaterThan((PECT[0].y + PECT[PECT.length - 1].y) / 2);
    expect(c[c.length - 1].y).toBeGreaterThan(PECT[PECT.length - 1].y);
    // 선 아래(횟감)가 덩이 안이다
    expect(inside({ x: (c[0].x + c[2].x) / 2, y: c[1].y + 0.05 }, geo.a.poly)).toBe(true);
    // 덩이 뷰 — 가운데가 자리로 가고 배율만큼 벌어진다
    expect(kamaBlockPoint(geo, 'a', geo.a.center)).toEqual(KAMA_BLOCK_SLOTS[0]);
    expect(kamaBlockPoint(geo, 'b', geo.b.center)).toEqual(KAMA_BLOCK_SLOTS[1]);
    const v = kamaCarveView(geo, 'a');
    expect(v[2].x - v[0].x).toBeCloseTo((c[2].x - c[0].x) * 1.5, 3);
    expect(v[2].y - v[0].y).toBeCloseTo((c[2].y - c[0].y) * 1.5, 3);
  });

  it('횟감은 한 면에 두세 점 — 보통 크기(대방어 12kg까지)', () => {
    expect(kamaPieceCount(KAMA_THREE_PIECE_MIN_G - 1)).toBe(2);
    expect(kamaPieceCount(KAMA_THREE_PIECE_MIN_G)).toBe(3);
    // 덩이 = 원물의 2.5% · 횟감 = 덩이의 40% → 원물 12kg = 횟감 120g
    expect(kamaPieceCount(12000 * 0.025 * KAMA_MEAT_SHARE)).toBe(3);
    expect(kamaMeatUnits(12000 * 0.025 * KAMA_MEAT_SHARE)).toBe(1);
  });

  it('333(2) 큰 개체는 점 수가 는다 — 한 점은 기준 무게 언저리 · 회썰기 한 번은 상한까지 · 넘치면 횟감 여러 덩이', () => {
    // 점 수는 무게를 따라 줄지 않고 는다
    let prev = 0;
    for (let g = 10; g <= KAMA_PIECE_TARGET_G * KAMA_PIECE_MAX; g += 5) {
      const n = kamaPieceCount(g);
      expect(n).toBeGreaterThanOrEqual(prev);
      expect(n).toBeLessThanOrEqual(KAMA_PIECE_MAX);
      prev = n;
    }
    expect(kamaPieceCount(200)).toBe(6);      // 원물 20kg
    expect(kamaPieceCount(100000)).toBe(KAMA_PIECE_MAX);
    // 원물 무게별 — 한쪽 점 수와 한 점 무게
    for (const [fishKg, wantUnits] of [[20, 1], [50, 2], [100, 3], [150, 4], [300, 4]] as const) {
      const meatG = fishKg * 1000 * 0.025 * KAMA_MEAT_SHARE;
      const units = kamaMeatUnits(meatG);
      expect(units).toBe(wantUnits);
      const perUnit = meatG / units;
      const pieceG = perUnit / kamaPieceCount(perUnit);
      expect(pieceG).toBeGreaterThan(20);
      // 덩이 수 상한에 걸리기 전에는 한 점이 기준 무게 언저리다(옛 규칙 = 참다랑어 100kg에서 한 점 333g)
      if (units < KAMA_MEAT_UNITS_MAX) expect(pieceG).toBeLessThan(KAMA_PIECE_TARGET_G * 1.2);
      else expect(pieceG).toBeLessThan(KAMA_PIECE_TARGET_G * 2);
    }
    expect(kamaMeatUnits(0)).toBe(1);
  });
});

describe('333 가마살 단계', () => {
  const KAMA = [...LOIN_KAMA_SPECIES];

  it('가마살 어종의 해체 크기 — 머리따기 뒤에 가마살 떼기 둘 · 끝에 도려내기 둘 · 기하가 단계에 실린다', () => {
    for (const sp of KAMA) {
      const p = new ButcheryProcess(butcheryProfileFor(sp, 300), 1, { guideOverrides: BUTCHERY_GUIDE_OVERRIDES });
      const ids = p.stageList.map((s) => s.id);
      expect(ids.slice(ids.indexOf('head_flip') + 1, ids.indexOf('head_flip') + 3), sp).toEqual(['kama_a', 'kama_b']);
      expect(ids.slice(-2), sp).toEqual(['ktrim_1', 'ktrim_2']);
      const st = (id: string) => p.stageList.find((s) => s.id === id)!;
      const geo = st('kama_a').kamaGeometry!;
      for (const id of ['kama_b', 'ktrim_1', 'ktrim_2']) expect(st(id).kamaGeometry, `${sp} ${id}`).toBe(geo);
      // 확정 좌표를 끼운 뒤의 방혈 호가 칼길의 아래쪽이다
      expect(st('kama_a').cut!.guidePath.slice(1), sp).toEqual(st('bleed_cut').cut!.guidePath);
      expect(st('kama_a').orientation).toBe('BASE');
      expect(st('kama_b').orientation).toBe('FLIP');
      expect(st('ktrim_1').cut!.guidePath, sp).toEqual(kamaCarveView(geo, 'a'));
      expect(isKamaStageId('kama_a') && isKamaStageId('ktrim_2') && !isKamaStageId('head_base')).toBe(true);
      expect([kamaTrimSideOf('ktrim_1'), kamaTrimSideOf('ktrim_2'), kamaTrimSideOf('kama_a')]).toEqual(['a', 'b', null]);
    }
  });

  it('가마살 어종 — 머리따기 사선이 가슴지느러미 뒤를 지나고 지느러미 단계는 등 · 뒷 두 선이다(작은 개체도)', () => {
    for (const sp of KAMA) {
      for (const cm of [40, 300]) {
        const p = new ButcheryProcess(butcheryProfileFor(sp, cm), 1, { guideOverrides: BUTCHERY_GUIDE_OVERRIDES });
        const st = (id: string) => p.stageList.find((s) => s.id === id)!;
        const fc = st('finectomy').cut!;
        expect((fc.guidePaths ?? [fc.guidePath]).length, `${sp} ${cm}`).toBe(2);
        expect(pectoralLineOf(fc.guidePaths ?? [fc.guidePath]), `${sp} ${cm}`).toBeUndefined();
        expect(st('finectomy').label).toBe('지느러미 제거 (등·뒷)');
        // 그 어종에 확정한 가슴지느러미 선이 있으면 사선이 그 아래 끝보다 뒤를 지난다
        const o = BUTCHERY_GUIDE_OVERRIDES[sp]?.finectomy;
        const pect = o ? pectoralLineOf(o.guidePaths ?? (o.guidePath ? [o.guidePath] : [])) : undefined;
        if (pect) {
          const pb = pect.reduce((a, b) => (b.y > a.y ? b : a));
          expect(pathXAtY(st('head_base').cut!.guidePath, pb.y), `${sp} ${cm}`).toBeGreaterThan(pb.x);
          expect(pathXAtY(st('head_flip').cut!.guidePath, pb.y), `${sp} ${cm}`).toBeLessThan(1 - pb.x);
        }
      }
    }
  });

  it('가마살을 내지 않는 어종은 그대로다 — 큰 바리류 · 돔류', () => {
    for (const [sp, cm] of [['longtooth_grouper', 95], ['red_seabream', 60], ['sea_bass', 80]] as const) {
      const ids = buildButcheryStages(butcheryProfileFor(sp, cm)).map((s) => s.id);
      expect(ids.some(isKamaStageId), sp).toBe(false);
      const fc = buildButcheryStages(butcheryProfileFor(sp, cm)).find((s) => s.id === 'finectomy')!.cut!;
      expect(fc.guidePaths!.length, sp).toBe(3);
    }
    expect(getButcheryProfile('longtooth_grouper').speciesId).toBe('longtooth_grouper');
  });

  it('섹션 — 머리 작업에 가마살 떼기 · 다듬기 구간에 가마살 둘(가마살 없는 어종은 빠진다)', () => {
    const secOf = (sp: string) => {
      const prof = butcheryProfileFor(sp, 300);
      return resolveButcherySections(sectionsForSpecies(sp, prof.bodyShape, prof.tree), buildButcheryStages(prof).map((s) => s.id));
    };
    const y = secOf('yellowtail');
    expect(y.find((s) => s.id === 'sec_prep')!.tasks.find((t) => t.id === 't_head')!.stageIds).toEqual(['head_base', 'head_flip', 'kama_a', 'kama_b']);
    const trim = y.find((s) => s.id === 'sec_loin_trim')!;
    expect(trim.tasks.map((t) => t.id)).toEqual(['t_trim_1', 't_trim_2', 't_trim_3', 't_trim_4', 't_ktrim_1', 't_ktrim_2']);
    expect(trim.tasks.find((t) => t.id === 't_ktrim_1')!.yields).toEqual(['kamaMeat']);
    const g = secOf('longtooth_grouper');
    expect(g.find((s) => s.id === 'sec_prep')!.tasks.find((t) => t.id === 't_head')!.stageIds).toEqual(['head_base', 'head_flip']);
    expect(g.find((s) => s.id === 'sec_loin_trim')!.tasks.map((t) => t.id)).toEqual(['t_trim_1', 't_trim_2', 't_trim_3', 't_trim_4']);
  });

  it('가마살 어종 — 유도선 그대로 그으면 끝까지 간다', () => {
    for (const sp of KAMA) {
      const p = new ButcheryProcess(butcheryProfileFor(sp, 300), 1, { guideOverrides: BUTCHERY_GUIDE_OVERRIDES });
      const seen: string[] = [];
      for (let guard = 0; guard < 300 && !p.finished; guard++) {
        const s = p.stage!;
        seen.push(s.id);
        p.orientation = s.orientation;
        const k = s.primitive;
        if (k === 'tap') p.submitTap(0);
        else if (k === 'drag_fill' || k === 'scoop') p.submitFill(1);
        else if (k === 'wash') p.submitWash();
        else {
          const left = s.cut!.guidePaths?.length ? s.cut!.guidePaths.filter((_, i) => !p.donePathIndices.has(i)) : [s.cut!.guidePath];
          expect(p.submitCut(trace(left[0])).passed, `${sp} ${s.id}`).toBe(true);
        }
      }
      expect(p.finished, `${sp} — ${seen.slice(-3).join(' → ')}`).toBe(true);
      for (const id of ['kama_a', 'kama_b', 'ktrim_1', 'ktrim_2']) expect(seen, `${sp} ${id}`).toContain(id);
    }
  });
});
