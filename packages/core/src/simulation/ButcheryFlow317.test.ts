/**
 * @file ButcheryFlow317.test.ts
 * @description 317차 — **4덩어리 해체**(참다랑어 · 대방어급) 공정 · 섹션 · 기하 · 그리고 F9 편집기가 남긴 「선 1개 목록」 칼집 판정.
 */
import { describe, it, expect } from 'vitest';
import { ButcheryProcess, buildButcheryStages } from './ButcheryProcess.js';
import { butcheryProfileFor, isLoinBreakdown, canButcherSpecies, LOIN_BREAKDOWN_MIN_CM, getButcheryProfile } from '../db-schema/ButcheryProfiles.js';
import { sectionsForSpecies, resolveButcherySections, LOIN_SECTIONS, WHOLE_FISH_SECTIONS, loinBlockOfTask } from '../db-schema/ButcherySections.js';
import {
  LOIN_BLOCKS, LOIN_FRONT_STAGE_IDS, loinBlockEdges, loinBlockLines, loinSakuPieces, defaultLoinSideGeometry, mirrorLoinLines,
  loinValueShare, loinTrimBlockOf,
} from '../db-schema/LoinStages.js';
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

describe('317 — 4덩어리 해체 갈래', () => {
  it('참다랑어는 늘 · 방어 70 · 부시리 80 · 잿방어 100cm부터 해체 — 그보다 작으면 삼장뜨기', () => {
    expect(LOIN_BREAKDOWN_MIN_CM).toEqual({ yellowtail: 70, amberjack: 80, greater_amberjack: 100 });
    expect(butcheryProfileFor('bluefin_tuna', 55).tree).toBe('loin');
    expect(butcheryProfileFor('yellowtail', 69).tree).toBeUndefined();
    expect(butcheryProfileFor('yellowtail', 70).tree).toBe('loin');
    expect(butcheryProfileFor('yellowtail', 70).filletCount).toBe(4);
    expect(getButcheryProfile('yellowtail').filletCount).toBe(2);   // 어종 기본 표는 그대로
    expect(isLoinBreakdown('amberjack', 79)).toBe(false);
    expect(isLoinBreakdown('amberjack', 80)).toBe(true);
    expect(isLoinBreakdown('greater_amberjack', 100)).toBe(true);
    expect(isLoinBreakdown('red_seabream', 90)).toBe(false);
    expect(canButcherSpecies('bluefin_tuna')).toBe(true);
  });

  it('해체 공정 — 앞 단계는 방어류 흐름 · 꼬리 칼집 · 장뜨기 · 갈빗대 · 지아이 · 박피 대신 양면 해체 · 중골 살 · 덩어리 다듬기 넷', () => {
    const ids = buildButcheryStages(butcheryProfileFor('yellowtail', 75)).map((s) => s.id);
    const front = ids.filter((id) => LOIN_FRONT_STAGE_IDS.has(id));
    expect(front).toEqual(['ikejime', 'bleed_cut', 'bleed_ice', 'scale_base', 'scale_flip', 'scale_wash',
      'head_base', 'head_flip', 'finectomy', 'gut_open', 'gut_scoop', 'vessel_scrub', 'gut_wash']);
    for (const gone of ['tail_grip', 'fillet_0_score', 'rib_a', 'pin_a', 'peel_pull']) expect(ids).not.toContain(gone);
    expect(ids.slice(front.length)).toEqual([
      'loin_a_mid', 'loin_a_back', 'loin_a_belly', 'loin_b_mid', 'loin_b_back', 'loin_b_belly', 'loin_nakaochi',
      ...[1, 2, 3, 4].flatMap((k) => [`trim_${k}_chiai`, `trim_${k}_skin`, `trim_${k}_saku`]),
    ]);
    // 참다랑어 — 비늘치기 없음(섹션 트리에서도 빠진다)
    const tuna = buildButcheryStages(getButcheryProfile('bluefin_tuna')).map((s) => s.id);
    expect(tuna).not.toContain('scale_base');
    const prep = resolveButcherySections(LOIN_SECTIONS, tuna).find((s) => s.id === 'sec_prep')!;
    expect(prep.tasks.map((t) => t.id)).toEqual(['t_head', 't_fins']);
  });

  it('섹션 — 개체 갈래(loin)를 넘기면 해체 트리 · 모든 단계가 작업에 든다 · 작업 id → 덩어리', () => {
    expect(sectionsForSpecies('yellowtail', 'round', 'loin')).toBe(LOIN_SECTIONS);
    expect(sectionsForSpecies('yellowtail', 'round')).toBe(WHOLE_FISH_SECTIONS);
    expect(sectionsForSpecies('bluefin_tuna', 'round')).toBe(LOIN_SECTIONS);
    const ids = buildButcheryStages(butcheryProfileFor('greater_amberjack', 110)).map((s) => s.id);
    const inTasks = new Set(resolveButcherySections(LOIN_SECTIONS, ids).flatMap((s) => s.tasks.flatMap((t) => t.stageIds)));
    for (const id of ids) expect(inTasks.has(id), id).toBe(true);
    expect(loinBlockOfTask('t_la_back')).toEqual({ side: 'a', part: 'back' });
    expect(loinBlockOfTask('t_lb_belly')).toEqual({ side: 'b', part: 'belly' });
    expect(loinBlockOfTask('t_la_mid')).toBeNull();
    expect(loinTrimBlockOf('trim_3_skin')).toBe(2);
    const frame = LOIN_SECTIONS.find((s) => s.id === 'sec_loin_frame')!;
    expect(frame.exitAfter).toBe(true);
  });

  it('정답 입력으로 끝까지 — 덩어리 넷(필렛 수 4) · 2면은 FLIP · 다듬기는 FLESH_UP', () => {
    const p = new ButcheryProcess(butcheryProfileFor('yellowtail', 80), 1);
    for (let guard = 0; guard < 200 && !p.finished; guard++) {
      const s = p.stage!;
      p.orientation = s.orientation;
      if (s.id.startsWith('loin_b_')) expect(s.orientation).toBe('FLIP');
      if (s.id.startsWith('trim_')) expect(s.orientation).toBe('FLESH_UP');
      const k = s.primitive;
      if (k === 'tap') p.submitTap(0);
      else if (k === 'drag_fill' || k === 'scoop') p.submitFill(1);
      else if (k === 'wash') p.submitWash();
      else {
        const left = s.cut!.guidePaths?.length ? s.cut!.guidePaths.filter((_, i) => !p.donePathIndices.has(i)) : [s.cut!.guidePath];
        expect(p.submitCut(trace(left[0])).passed, s.id).toBe(true);
      }
    }
    expect(p.finished).toBe(true);
    expect(p.filletsDone).toBe(4);
  });

  it('사쿠 수 — 덩어리 무게에서(2 ~ 5) · 나누기 선 = 사쿠 − 1 (하나면 단일 선)', () => {
    expect(loinSakuPieces(500)).toBe(2);
    expect(loinSakuPieces(1400)).toBe(3);
    expect(loinSakuPieces(9000)).toBe(5);
    const st = buildButcheryStages(butcheryProfileFor('bluefin_tuna', 110), { loin: { sakuPieces: [5, 2, 3, 4] } });
    const saku = (k: number) => st.find((s) => s.id === `trim_${k}_saku`)!.cut!;
    expect(saku(1).guidePaths?.length).toBe(4);
    expect(saku(2).guidePaths).toBeUndefined();
    expect(saku(3).guidePaths?.length).toBe(2);
    expect(saku(4).guidePaths?.length).toBe(3);
  });

  it('덩어리 기하 — 등살은 위 껍질 · 아래 혈합육 / 뱃살은 반대 · 선은 자리 안 · 값 몫 합 1(참다랑어 뱃살이 더 비싸다)', () => {
    for (const u of [0.1, 0.5, 0.9]) {
      const b = loinBlockEdges('back', u), l = loinBlockEdges('belly', u);
      expect(b.top < b.skin && b.skin < b.chiai && b.chiai < b.bot).toBe(true);
      expect(l.top < l.chiai && l.chiai < l.skin && l.skin < l.bot).toBe(true);
    }
    for (const blk of LOIN_BLOCKS) {
      const L = loinBlockLines(blk.index, 3);
      for (const p of [...L.chiai, ...L.skin, ...L.saku.flat()]) {
        expect(p.x >= blk.slot.x && p.x <= blk.slot.x + blk.slot.w, `${blk.index} x`).toBe(true);
        expect(p.y >= blk.slot.y - 0.03 * blk.slot.h && p.y <= blk.slot.y + blk.slot.h * 1.03, `${blk.index} y`).toBe(true);
      }
    }
    const sum = (sp: string): number => 2 * (loinValueShare(sp, 'back') + loinValueShare(sp, 'belly'));
    expect(sum('bluefin_tuna')).toBeCloseTo(1, 6);
    expect(sum('yellowtail')).toBeCloseTo(1, 6);
    expect(loinValueShare('bluefin_tuna', 'belly')).toBeGreaterThan(loinValueShare('bluefin_tuna', 'back'));
  });

  it('측면 기본 선 — 2면은 1면을 좌우로 뒤집은 자리 · 칼은 머리 쪽에서 꼬리 쪽으로', () => {
    const g = defaultLoinSideGeometry();
    expect(g.b).toEqual(mirrorLoinLines(g.a));
    expect(g.a.mid[0].x).toBeLessThan(g.a.mid[g.a.mid.length - 1].x);   // 1면 머리 왼쪽
    expect(g.b.mid[0].x).toBeGreaterThan(g.b.mid[g.b.mid.length - 1].x);   // 2면 머리 오른쪽
    for (let i = 0; i < g.a.mid.length; i++) {
      expect(g.a.back[i].y).toBeLessThan(g.a.mid[i].y);
      expect(g.a.belly[i].y).toBeGreaterThan(g.a.mid[i].y);
    }
  });
});

describe('317 — 선 1개짜리 목록 칼집(F9 편집기가 남긴 상태)', () => {
  it('같은 선을 3번 긋는 칼집은 guidePaths = [선]이어도 3번 다 받는다', () => {
    const p = new ButcheryProcess(getButcheryProfile('largescale_blackfish'), 1);
    expect(p.jumpTo('fillet_0_score')).toBe(true);
    const c = p.stage!.cut!;
    expect(c.strokesRequired).toBe(3);
    c.guidePaths = [c.guidePath];   // 옛 편집기가 열기만 해도 박던 상태
    for (let i = 0; i < 3; i++) {
      const r = p.submitCut(trace(c.guidePath));
      expect(r.passed, `칼집 ${i + 1}`).toBe(true);
    }
    expect(p.stage?.id).toBe('fillet_0_sever');
  });

  it('선 1개 목록으로 단계에 들어와도 남은 칼집은 strokesRequired(3)', () => {
    const prof = getButcheryProfile('largescale_blackfish');
    const stages = buildButcheryStages(prof);
    const st = stages.find((s) => s.id === 'fillet_0_score')!;
    st.cut!.guidePaths = [st.cut!.guidePath];
    const p = new ButcheryProcess(prof, 1);
    const own = p.stageList.find((s) => s.id === 'fillet_0_score')!;
    own.cut!.guidePaths = [own.cut!.guidePath];
    p.jumpTo('fillet_0_score');
    expect(p.currentStrokesLeft).toBe(3);
  });
});
