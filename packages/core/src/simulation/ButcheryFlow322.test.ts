/**
 * @file ButcheryFlow322.test.ts
 * @description 322차 — **[확정] 좌표 전수 검사**. `ButcheryGuideOverrides`에 든 어종마다 확정 선을 그대로 따라 그어 손질이 끝까지 가는지 본다.
 *  사용자가 F9 [확정]으로 보낸 좌표가 판정 옵션(여러 번 긋기 · 다중 선 · 허용 폭)과 어긋나 중간에 막히는 일을 여기서 잡는다.
 *  - 어종 키마다: 확정 표를 넘겨 공정을 만들고 유도선을 그대로 그어 완주
 *  - 확정한 단계는 좌표가 표 그대로(옮기지 않는다) · 지아이뼈 분리(pin)는 321 전 확정분이 표에 없어야 한다
 */
import { describe, it, expect } from 'vitest';
import { ButcheryProcess } from './ButcheryProcess.js';
import { butcheryProfileFor, canButcherSpecies } from '../db-schema/ButcheryProfiles.js';
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
