/**
 * @file ButcheryFlow313.test.ts
 * @description 313차 — 손질 어종 확대(농어 · 우럭 · 볼락 · 숭어 · 망상어 · 용치놀래기 · 작은 생선 다섯 · 개서대 · 갑오징어)와
 *  **어종 그림 자리로 유도선 옮기기**(`guideFrame`) 점검.
 *
 *  - 작은 생선 공정 = 비늘 → 머리 · 내장 → 검은 막 · 혈합육 → 삼장뜨기 → 갈비뼈 → 잔뼈(핀셋) — 시메 · 방혈 · 지느러미 · 꼬리 · 박피 없음
 *  - 유도선을 옮겨도 「옮긴 선을 그대로 따라 그으면」 끝까지 간다(판정이 옮긴 선을 쓴다)
 *  - 어종군 표는 core 한 곳(`butcheryArtFamily`) — 유도선 세트와 도마 그림이 같은 표를 본다
 */
import { describe, it, expect } from 'vitest';
import { ButcheryProcess, remapGuidePoint } from './ButcheryProcess.js';
import type { GuideFrameRemap } from './ButcheryProcess.js';
import {
  getButcheryProfile, BUTCHERY_IMPLEMENTED_SPECIES, butcheryArtFamily, canButcherSpecies, getButcheryFamily,
} from '../db-schema/ButcheryProfiles.js';
import { sectionsForSpecies, resolveButcherySections, SMALL_FISH_SECTIONS, SQUID_SECTIONS } from '../db-schema/ButcherySections.js';
import { primitiveInput } from '../types/Butchery.js';
import type { CutPoint } from '../types/Butchery.js';

const SMALL = ['pacific_saury', 'halfbeak', 'round_herring', 'northern_whiting', 'yellowfin_goby'];
const ROUND_NEW = ['sea_bass', 'black_rockfish', 'blue_rockfish', 'golden_rockfish', 'red_snapper_rockfish', 'striped_mullet', 'redlip_mullet'];

function trace(path: readonly CutPoint[]): CutPoint[] {
  const o: CutPoint[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    for (let k = 0; k < 8; k++) o.push({ x: a.x + (b.x - a.x) * k / 8, y: a.y + (b.y - a.y) * k / 8 });
  }
  o.push(path[path.length - 1]);
  return o;
}

/** 손질 창 규칙(섹션 차례 · 작업 첫 단계로 점프)대로 정답 입력 — 끝난 단계 수 */
function runPerfect(speciesId: string, guideFrame?: GuideFrameRemap): { ok: boolean; done: number; count: number; why?: string; p: ButcheryProcess } {
  const prof = getButcheryProfile(speciesId);
  const p = new ButcheryProcess(prof, 1, { guideFrame });
  const sections = resolveButcherySections(sectionsForSpecies(speciesId, prof.bodyShape), p.stageList.map((s) => s.id));
  let done = 0;
  for (const sec of sections) for (const t of sec.tasks) {
    if (!p.jumpTo(t.stageIds[0])) return { ok: false, done, count: p.stageCount, why: `${t.id} 점프 실패`, p };
    for (const sid of t.stageIds) {
      const s = p.stage!;
      if (s.id !== sid) return { ok: false, done, count: p.stageCount, why: `${sid} ≠ ${s.id}`, p };
      p.orientation = s.orientation;
      while (p.rotation !== (s.rotationRequired ?? 0)) p.rotate(1);
      const kind = primitiveInput(s.primitive);
      for (let guard = 0; guard < 20 && p.stage === s; guard++) {
        let ok: boolean;
        if (kind === 'tap') ok = p.submitTap(0).passed;
        else if (kind === 'fill') ok = p.submitFill(1).stageDone;
        else if (kind === 'button') ok = p.submitWash();
        else if (kind === 'peel') ok = p.submitPeelPull(1).passed;
        else {
          const left = s.cut?.guidePaths?.length ? s.cut.guidePaths.filter((_, i) => !p.donePathIndices.has(i)) : [s.cut!.guidePath];
          ok = p.submitCut(trace(left[0])).passed;
        }
        if (!ok) break;
      }
      if (p.stage === s) return { ok: false, done, count: p.stageCount, why: `${sid} 못 넘김`, p };
      done++;
    }
  }
  return { ok: done === p.stageCount, done, count: p.stageCount, p };
}

describe('313 — 손질 어종 확대 · 작은 생선 공정 · 어종 그림 자리 유도선', () => {
  it('새 어종은 전부 손질된다(finfish · 구현 목록)', () => {
    for (const id of [...ROUND_NEW, ...SMALL, 'surfperch', 'rainbow_wrasse', 'tonguefish']) {
      expect(BUTCHERY_IMPLEMENTED_SPECIES.has(id), id).toBe(true);
      expect(getButcheryFamily(id), id).toBe('finfish');
      expect(canButcherSpecies(id), id).toBe(true);
    }
    expect(getButcheryProfile('tonguefish').bodyShape).toBe('flat');
  });

  it('작은 생선 공정 — 사용자 순서 그대로 · 없는 단계 없음', () => {
    for (const id of SMALL) {
      const p = new ButcheryProcess(getButcheryProfile(id), 1);
      const ids = p.stageList.map((s) => s.id);
      for (const gone of ['ikejime', 'bleed_cut', 'bleed_ice', 'finectomy', 'tail_grip', 'tail_grip_b', 'peel_grip', 'peel_insert', 'peel_pull']) {
        expect(ids, `${id} ${gone}`).not.toContain(gone);
      }
      // 비늘 → 머리 → 내장 → 검은 막 → 씻기 → 삼장뜨기 → 갈비뼈 → 잔뼈
      const order = ['scale_base', 'head_base', 'gut_open', 'vessel_scrub', 'gut_wash', 'fillet_0_score', 'fillet_1_bellyribcut', 'rib_a', 'pin_a', 'pin_b'];
      const at = order.map((s) => ids.indexOf(s));
      expect(at.every((v) => v >= 0), `${id} ${at}`).toBe(true);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
      expect(ids[ids.length - 1]).toBe('pin_b');
      // 잔뼈는 핀셋 — 칼선이 아니라 잔가시 줄 훑기
      const pin = p.stageList.find((s) => s.id === 'pin_a')!;
      expect(pin.primitive).toBe('drag_fill');
      expect(pin.label).toContain('핀셋');
      expect(sectionsForSpecies(id, 'round')).toBe(SMALL_FISH_SECTIONS);
      const r = runPerfect(id);
      expect(r.ok, `${id} ${r.why} ${r.done}/${r.count}`).toBe(true);
      // 시메 · 방혈이 없는 공정 — 「해당 없음」이라 등급을 깎지 않는다
      expect(r.p.result().ikejimeDone).toBe(true);
      expect(r.p.result().bledDone).toBe(true);
    }
  });

  it('갑오징어 = 무늬오징어 공정', () => {
    expect(canButcherSpecies('cuttlefish')).toBe(true);
    expect(sectionsForSpecies('cuttlefish', 'round')).toBe(SQUID_SECTIONS);
    const r = runPerfect('cuttlefish');
    expect(r.ok, `${r.why} ${r.done}/${r.count}`).toBe(true);
  });

  it('어종군 표 — 방어류 흐름 · 돔류 · 넙치류', () => {
    for (const id of ['yellowtail', 'chub_mackerel', 'horse_mackerel', 'spanish_mackerel', ...ROUND_NEW, ...SMALL]) expect(butcheryArtFamily(id), id).toBe('amberjack');
    for (const id of ['black_seabream', 'stone_beakperch', 'surfperch', 'rainbow_wrasse']) expect(butcheryArtFamily(id), id).toBe('bream');
    for (const id of ['flatfish', 'flounder', 'frog_flounder', 'starry_flounder', 'tonguefish']) expect(butcheryArtFamily(id), id).toBe('halibut');
  });

  it('유도선 옮기기 — rect 대 rect 비례 · 옮긴 선을 따라 그으면 끝까지 간다', () => {
    const m: GuideFrameRemap = { from: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }, to: { x: 0.2, y: 0.3, w: 0.6, h: 0.4 } };
    expect(remapGuidePoint({ x: 0.1, y: 0.1 }, m)).toEqual({ x: 0.2, y: 0.3 });
    expect(remapGuidePoint({ x: 0.9, y: 0.9 }, m)).toEqual({ x: 0.8, y: 0.7 });
    expect(remapGuidePoint({ x: 0.5, y: 0.5 }, undefined)).toEqual({ x: 0.5, y: 0.5 });
    // 측면 단계는 옮기고(시메 점 · 머리 선) 개복 뒤 전용 뷰 단계는 그대로(배따기 · 장뜨기)
    const a = new ButcheryProcess(getButcheryProfile('sea_bass'), 1);
    const b = new ButcheryProcess(getButcheryProfile('sea_bass'), 1, { guideFrame: m });
    const st = (p: ButcheryProcess, id: string) => p.stageList.find((s) => s.id === id)!;
    expect(st(b, 'ikejime').tapPoint).toEqual(remapGuidePoint(st(a, 'ikejime').tapPoint!, m));
    expect(st(b, 'head_base').cut!.guidePath).toEqual(st(a, 'head_base').cut!.guidePath.map((q) => remapGuidePoint(q, m)));
    expect(st(b, 'gut_open').cut!.guidePath).toEqual(st(a, 'gut_open').cut!.guidePath);
    expect(st(b, 'fillet_0_score').cut!.guidePath).toEqual(st(a, 'fillet_0_score').cut!.guidePath);
    // 넙치류는 탑뷰 몸통 선(머리 S컷 · 중앙선)만 옮기고 엔가와(필렛 슬랩 위)는 그대로
    const fa = new ButcheryProcess(getButcheryProfile('tonguefish'), 1);
    const fb = new ButcheryProcess(getButcheryProfile('tonguefish'), 1, { guideFrame: m });
    expect(st(fb, 'flat_head_scut').cut!.guidePath).toEqual(st(fa, 'flat_head_scut').cut!.guidePath.map((q) => remapGuidePoint(q, m)));
    expect(st(fb, 'engawa_1').cut!.guidePath).toEqual(st(fa, 'engawa_1').cut!.guidePath);
    // 옮긴 선으로도 끝까지 간다
    for (const id of ['sea_bass', 'pacific_saury', 'surfperch', 'tonguefish']) {
      const r = runPerfect(id, m);
      expect(r.ok, `${id} ${r.why} ${r.done}/${r.count}`).toBe(true);
    }
  });
});
