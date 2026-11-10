/**
 * @file ButcheryFlow304.test.ts
 * @description 304차 — 손질 흐름 전수 점검. 손질 창의 진행 규칙을 흉내 내 **정답 입력으로 끝까지 가는가**를 어종마다 본다.
 *
 *  손질 창 규칙(ButcheryPanel 섹션 컨트롤러):
 *   - 섹션은 차례대로 · 섹션 안 작업은 고른다 → 작업 첫 단계로 `jumpTo`(방향 · 회전 스냅)
 *   - 작업 안 다음 단계는 공정이 `advance()`로 한 칸 넘어간 자리다 → 작업 안 단계는 공정 목록에서 이어져 있어야 한다
 *   - 작업 안에서 방향이 바뀌면 플레이어가 좌우(F) · 상하(V)로 맞춘다 → 「살 위로(필렛)」는 뒤집기로 못 간다
 *  사용자 리포트(고등어 「비늘치기 (1/3)」에서 멈춤): 비늘 없는 프로필은 비늘치기 단계가 없는데 트리에는 작업이 있었다.
 */
import { describe, it, expect } from 'vitest';
import { ButcheryProcess, buildButcheryStages } from './ButcheryProcess.js';
import { getButcheryProfile, BUTCHERY_IMPLEMENTED_SPECIES, getButcheryFamily } from '../db-schema/ButcheryProfiles.js';
import { sectionsForSpecies, resolveButcherySections, WHOLE_FISH_SECTIONS } from '../db-schema/ButcherySections.js';
import { primitiveInput } from '../types/Butchery.js';
import type { ButcheryOrientation } from '../types/Butchery.js';
import type { CutPoint } from '../types/Butchery.js';

const CEPHALOPODS = ['squid', 'swordtip_squid', 'flying_squid', 'cuttlefish', 'octopus', 'giant_octopus'];   // 313 — 갑오징어(무늬오징어 공정)
const ALL = [...BUTCHERY_IMPLEMENTED_SPECIES, ...CEPHALOPODS];
const FLIPPABLE = new Set<ButcheryOrientation>(['BASE', 'FLIP', 'BELLY_UP', 'BACK_DOWN']);

/** 유도선을 촘촘히 따라 긋는 정답 궤적 */
function trace(path: readonly CutPoint[]): CutPoint[] {
  const o: CutPoint[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    for (let k = 0; k < 8; k++) o.push({ x: a.x + (b.x - a.x) * k / 8, y: a.y + (b.y - a.y) * k / 8 });
  }
  o.push(path[path.length - 1]);
  return o;
}

/** 손질 창 규칙대로 정답 입력을 넣어 끝까지 간다 — 막힌 곳을 글로 돌려준다(없으면 빈 배열) */
function runPerfect(speciesId: string): { problems: string[]; stagesDone: number; stageCount: number; fillets: number } {
  const prof = getButcheryProfile(speciesId);
  const p = new ButcheryProcess(prof, 1);
  const sections = resolveButcherySections(sectionsForSpecies(speciesId, prof.bodyShape), p.stageList.map((s) => s.id));
  const done = new Set<string>();
  const problems: string[] = [];
  for (const sec of sections) {
    for (const t of sec.tasks) {
      const first = t.stageIds.find((s) => !done.has(s))!;
      if (!p.jumpTo(first)) { problems.push(`${t.id}: 공정에 없는 단계 ${first}`); return { problems, stagesDone: done.size, stageCount: p.stageCount, fillets: p.filletsDone }; }
      for (const sid of t.stageIds) {
        const s = p.stage;
        if (!s || s.id !== sid) { problems.push(`${t.id}: 기대 ${sid} · 공정 ${s?.id}`); return { problems, stagesDone: done.size, stageCount: p.stageCount, fillets: p.filletsDone }; }
        if (p.orientation !== s.orientation) {
          if (!p.cephalopod && !(FLIPPABLE.has(p.orientation) && FLIPPABLE.has(s.orientation))) {
            problems.push(`${t.id}: ${sid} ${p.orientation} → ${s.orientation} 뒤집기로 못 감`);
            return { problems, stagesDone: done.size, stageCount: p.stageCount, fillets: p.filletsDone };
          }
          p.orientation = s.orientation;   // 플레이어가 F · V로 맞춘다
        }
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
        if (p.stage === s) { problems.push(`${t.id}: ${sid}(${s.primitive}) 정답 입력으로 못 넘김`); return { problems, stagesDone: done.size, stageCount: p.stageCount, fillets: p.filletsDone }; }
        done.add(sid);
      }
    }
  }
  return { problems, stagesDone: done.size, stageCount: p.stageCount, fillets: p.filletsDone };
}

describe('304 — 손질 흐름 전수 점검', () => {
  it('손질되는 어종은 모두 손질 창 규칙대로 끝까지 간다(정답 입력 · 공정 단계 빠짐없이)', () => {
    for (const id of ALL) {
      const r = runPerfect(id);
      expect(r.problems, id).toEqual([]);
      expect(r.stagesDone, `${id} — 작업에 들지 않은 공정 단계`).toBe(r.stageCount);
    }
  });

  it('어류는 필렛을 프로필 장수만큼 뜬다', () => {
    for (const id of BUTCHERY_IMPLEMENTED_SPECIES) {
      expect(runPerfect(id).fillets, id).toBe(getButcheryProfile(id).filletCount);
    }
  });

  it('고등어(비늘 없음) — 밑손질은 머리 · 지느러미 둘 · 비늘치기 작업 없음 · 원본 트리는 그대로', () => {
    const prof = getButcheryProfile('chub_mackerel');
    expect(prof.hasScales).toBe(false);
    const ids = buildButcheryStages(prof).map((s) => s.id);
    expect(ids).not.toContain('scale_base');
    const prep = resolveButcherySections(WHOLE_FISH_SECTIONS, ids).find((s) => s.id === 'sec_prep')!;
    expect(prep.tasks.map((t) => t.id)).toEqual(['t_head', 't_fins']);
    expect(WHOLE_FISH_SECTIONS.find((s) => s.id === 'sec_prep')!.tasks.map((t) => t.id)).toContain('t_descale');
  });

  it('비늘 있는 어종은 트리가 그대로(같은 객체)', () => {
    const prof = getButcheryProfile('red_seabream');
    const ids = buildButcheryStages(prof).map((s) => s.id);
    const r = resolveButcherySections(WHOLE_FISH_SECTIONS, ids);
    expect(r.length).toBe(WHOLE_FISH_SECTIONS.length);
    r.forEach((s, i) => expect(s).toBe(WHOLE_FISH_SECTIONS[i]));
  });

  it('손질되는 어종 목록은 전부 어류 손질(finfish)로 열린다', () => {
    for (const id of BUTCHERY_IMPLEMENTED_SPECIES) expect(getButcheryFamily(id), id).toBe('finfish');
  });
});
