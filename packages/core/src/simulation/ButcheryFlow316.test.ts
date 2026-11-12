/**
 * @file ButcheryFlow316.test.ts
 * @description 316차 — 어종 필렛 그림 자리로 유도선 옮기기(`filletFrames`).
 *  - 갈빗대(rib) = ribs 뷰 · 지아이뼈(pin) = side 뷰(321 — 갈빗대만 뗀 한 면 필렛) · 박피 ① · ③ = skin 뷰만 옮긴다(박피 ② 단면 · 온마리 · 장뜨기는 그대로)
 *  - 작은 생선 핀셋 스윕(pin)도 side 뷰 자리로 옮긴다(client가 그 자리에 순수 필렛 대응을 넣는다)
 *  - 321 — 지아이뼈 분리 선은 그림에서 잰 혈합육 줄(`pinLine`)이 먼저 · 필렛 B는 좌우 대칭 · 확정 좌표가 있으면 그것이 먼저
 *  - 「군 전체 확정」 좌표는 필렛 뷰도 어종 그림 자리로 옮기고, 어종 확정 좌표는 그대로 쓴다
 *  - 열 실루엣이 있으면 세로는 살 높이 비례(꼬리가 뾰족한 어종 필렛 — 박피 손잡이 · 당기기가 살 밖으로 나가지 않게) · 필렛 B는 실루엣을 뒤집는다
 */
import { describe, it, expect } from 'vitest';
import { ButcheryProcess, applyGuideOverrides, buildButcheryStages, filletGuideView, stageGuideRemap, remapGuidePoint, invertGuideRemap } from './ButcheryProcess.js';
import type { GuideFrameRemap } from './ButcheryProcess.js';
import { getButcheryProfile } from '../db-schema/ButcheryProfiles.js';

/** 어종군 그림이 도마 가로 전부(0~1) · 세로 0.1~0.9 → 어종 그림이 가로 0.1~0.9 · 세로 0~1 */
const M: GuideFrameRemap = { from: { x: 0, y: 0.1, w: 1, h: 0.8 }, to: { x: 0.1, y: 0, w: 0.8, h: 1 } };
const move = (p: { x: number; y: number }): { x: number; y: number } => ({
  x: Math.round((0.1 + p.x * 0.8) * 1000) / 1000, y: Math.round(((p.y - 0.1) / 0.8) * 1000) / 1000,
});

describe('316 — 필렛 뷰 유도선을 어종 필렛 그림 자리로', () => {
  it('뷰 표 — 갈빗대 = ribs · 지아이뼈 = side · 박피 ① · ③ = skin · 그 밖은 없음', () => {
    expect(filletGuideView('rib_a')).toBe('ribs');
    expect(filletGuideView('rib_b')).toBe('ribs');
    expect(filletGuideView('pin_a')).toBe('side');
    expect(filletGuideView('peel_grip')).toBe('skin');
    expect(filletGuideView('peel_pull')).toBe('skin');
    expect(filletGuideView('peel_insert')).toBeUndefined();
    expect(filletGuideView('head_base')).toBeUndefined();
    expect(stageGuideRemap('head_base', { guideFrame: M })).toBe(M);
    expect(stageGuideRemap('pin_a', { guideFrame: M })).toBeUndefined();
    expect(stageGuideRemap('pin_a', { filletFrames: { side: M } })).toBe(M);
  });

  it('둥근 생선 — 뷰마다 그 rect로 옮기고 박피 ② · 장뜨기는 그대로', () => {
    const p = getButcheryProfile('sea_bass');
    const base = buildButcheryStages(p);
    const moved = buildButcheryStages(p, { filletFrames: { ribs: M, side: M, skin: M } });
    const by = (list: typeof base, id: string) => list.find((s) => s.id === id)!;
    for (const id of ['rib_a', 'rib_b', 'pin_a', 'pin_b', 'peel_grip']) {
      expect(by(moved, id).cut!.guidePath, id).toEqual(by(base, id).cut!.guidePath.map(move));
    }
    expect(by(moved, 'peel_pull').sweepPath).toEqual(by(base, 'peel_pull').sweepPath!.map(move));
    expect(by(moved, 'peel_insert').cut!.guidePath).toEqual(by(base, 'peel_insert').cut!.guidePath);
    const sep = base.find((s) => s.id.startsWith('fillet_'))!;
    expect(by(moved, sep.id).cut!.guidePath).toEqual(sep.cut!.guidePath);
    // 공용 스테이지 표는 그대로(사본을 옮긴다)
    expect(buildButcheryStages(p)).toEqual(base);
  });

  it('뷰 하나만 있으면 그 뷰만 옮긴다(갈빗대 그림만 있는 어종)', () => {
    const p = getButcheryProfile('greater_amberjack');
    const base = buildButcheryStages(p);
    const moved = buildButcheryStages(p, { filletFrames: { ribs: M } });
    const by = (list: typeof base, id: string) => list.find((s) => s.id === id)!;
    expect(by(moved, 'rib_a').cut!.guidePath).toEqual(by(base, 'rib_a').cut!.guidePath.map(move));
    expect(by(moved, 'pin_a').cut!.guidePath).toEqual(by(base, 'pin_a').cut!.guidePath);
  });

  it('작은 생선 — 핀셋 스윕(pin)을 side 뷰 자리로 옮긴다 · pinLine은 쓰지 않는다', () => {
    const p = getButcheryProfile('pacific_saury');
    const base = buildButcheryStages(p);
    const moved = buildButcheryStages(p, { filletFrames: { side: M } });
    const a = base.find((s) => s.id === 'pin_a')!, b = moved.find((s) => s.id === 'pin_a')!;
    expect(a.primitive).toBe('drag_fill');
    expect(b.sweepPath).toEqual(a.sweepPath!.map(move));
    // 핀셋 공정은 그림에서 잰 혈합육 줄을 받지 않는다(스윕 그대로)
    const withLine = buildButcheryStages(p, { filletFrames: { side: M }, pinLine: [{ x: 0.2, y: 0.3 }, { x: 0.8, y: 0.4 }] });
    expect(withLine.find((s) => s.id === 'pin_a')!.sweepPath).toEqual(b.sweepPath);
  });

  it('321 — 지아이뼈 분리 선 = 한 면 필렛 그림의 혈합육 줄(pinLine) · 필렛 B는 좌우 대칭 · 다시 옮기지 않는다 · 확정 좌표가 먼저', () => {
    const p = getButcheryProfile('horse_mackerel');
    const blood = [{ x: 0.2, y: 0.42 }, { x: 0.5, y: 0.47 }, { x: 0.82, y: 0.55 }];
    const stages = buildButcheryStages(p, { filletFrames: { side: M }, pinLine: blood });
    const a = stages.find((s) => s.id === 'pin_a')!, b = stages.find((s) => s.id === 'pin_b')!;
    expect(a.cut!.guidePath).toEqual(blood);                                   // filletFrames로 다시 옮기지 않는다
    expect(b.cut!.guidePath).toEqual(blood.map((q) => ({ x: Math.round((1 - q.x) * 1000) / 1000, y: q.y })));
    expect(a.cut!.strokesRequired).toBe(2);                                    // 가운데를 두 번 긋는다(판정은 그대로)
    // 갈빗대 · 박피 선은 pinLine과 무관하다
    const plain = buildButcheryStages(p, { filletFrames: { side: M } });
    expect(stages.find((s) => s.id === 'rib_a')!.cut!.guidePath).toEqual(plain.find((s) => s.id === 'rib_a')!.cut!.guidePath);
    // 어종 확정 좌표가 있으면 그것이 먼저다
    const line = [{ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }];
    const proc = new ButcheryProcess(p, 1, { filletFrames: { side: M }, pinLine: blood, guideOverrides: { horse_mackerel: { pin_a: { guidePath: line } } } });
    expect(proc.stageList.find((s) => s.id === 'pin_a')!.cut!.guidePath).toEqual(line);
    expect(proc.stageList.find((s) => s.id === 'pin_b')!.cut!.guidePath).toEqual(b.cut!.guidePath);
  });

  it('확정 좌표 — 군 좌표(familyFrame)는 필렛 뷰도 옮기고 어종 좌표는 그대로', () => {
    const p = getButcheryProfile('sea_bass');
    const stages = buildButcheryStages(p, { filletFrames: { side: M } });
    const line = [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }];
    const fam = applyGuideOverrides(stages, 'sea_bass', false, undefined,
      { '@amberjack': { pin_a: { guidePath: line, familyFrame: true } } }, { side: M });
    expect(fam.find((s) => s.id === 'pin_a')!.cut!.guidePath).toEqual(line.map(move));
    const own = applyGuideOverrides(stages, 'sea_bass', false, undefined,
      { sea_bass: { pin_a: { guidePath: line } } }, { side: M });
    expect(own.find((s) => s.id === 'pin_a')!.cut!.guidePath).toEqual(line);
    // 손질 과정이 같은 식을 쓴다(생성자 → 확정 좌표까지)
    const proc = new ButcheryProcess(p, 1, { filletFrames: { side: M }, guideOverrides: { '@amberjack': { pin_a: { guidePath: line, familyFrame: true } } } });
    expect(proc.stageList.find((s) => s.id === 'pin_a')!.cut!.guidePath).toEqual(line.map(move));
  });

  it('열 실루엣 — 세로는 살 높이 비례 · 필렛 B(rib_b · pin_b)는 실루엣을 뒤집고 · 거꾸로 옮기면 제자리', () => {
    // 어종군 그림: 모든 열이 위 0.1 ~ 아래 0.9 / 어종 그림: 왼쪽 끝(꼬리) 열은 0.4 ~ 0.6으로 가늘고 오른쪽은 0 ~ 1
    const same = { x: 0, y: 0, w: 1, h: 1 };
    const C: GuideFrameRemap = {
      from: same, to: same,
      fromCols: { top: [0.1, 0.1, 0.1, 0.1], bot: [0.9, 0.9, 0.9, 0.9] },
      toCols: { top: [0.4, 0.2, 0.1, 0], bot: [0.6, 0.8, 0.9, 1] },
    };
    // 왼쪽 끝 열 가운데(u 0.125) — 어종군 살 위 끝(0.1)은 어종 살 위 끝(0.4)으로 · 가운데(0.5)는 가운데로
    expect(remapGuidePoint({ x: 0.125, y: 0.1 }, C)).toEqual({ x: 0.125, y: 0.4 });
    expect(remapGuidePoint({ x: 0.125, y: 0.5 }, C)).toEqual({ x: 0.125, y: 0.5 });
    expect(remapGuidePoint({ x: 0.875, y: 0.9 }, C)).toEqual({ x: 0.875, y: 1 });
    // 거꾸로
    const q = remapGuidePoint({ x: 0.125, y: 0.45 }, C);
    expect(remapGuidePoint(q, invertGuideRemap(C)).y).toBeCloseTo(0.45, 2);
    // 필렛 B — 같은 점이 오른쪽 끝 열 기준으로 옮겨진다(뒤집어 그리므로 꼬리가 오른쪽)
    const mb = stageGuideRemap('pin_b', { filletFrames: { side: C } })!;
    expect(remapGuidePoint({ x: 0.875, y: 0.1 }, mb)).toEqual({ x: 0.875, y: 0.4 });
    expect(stageGuideRemap('pin_a', { filletFrames: { side: C } })).toBe(C);
  });
});
