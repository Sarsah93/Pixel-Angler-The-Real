/**
 * @file RoadNetwork301.test.ts
 * @description 301차 — 도로망 정리: 성분 · 토막 · 바다 위 도로 · 가장자리 보존 · 차량 예산 · 실데이터(독도 0 · 속초 36)
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  roadComponents, pruneRoadsDetailed, pruneRoads, vehicleBudget, mainRoadLength, isMinorRoadClass, isUndrivableRoadClass,
  ROAD_PRUNE, VEHICLE_BUDGET,
} from './RoadNetwork.js';
import type { RegionRoad } from '../types/RegionMap.js';

const land = (cols: number, rows: number): string[] => Array.from({ length: rows }, () => '.'.repeat(cols));
const rd = (cls: string, pts: [number, number][], w = 2): RegionRoad => ({ cls, w, pts });

describe('301 — 도로망 정리', () => {
  it('성분 — 정점을 공유하면 한 묶음', () => {
    const roads = [rd('residential', [[10, 10], [20, 10]]), rd('service', [[20, 10], [20, 14]]), rd('service', [[50, 50], [52, 53]])];
    const c = roadComponents(roads);
    expect(c[0]).toBe(c[1]);
    expect(c[2]).not.toBe(c[0]);
  });

  it('등급 — 간선 밖 · 못 달리는 등급', () => {
    expect(isMinorRoadClass('service')).toBe(true);
    expect(isMinorRoadClass('primary_link')).toBe(true);
    expect(isMinorRoadClass('residential')).toBe(false);
    expect(isUndrivableRoadClass('track')).toBe(true);
    expect(isUndrivableRoadClass('service')).toBe(false);
  });

  it('토막 — 간선 없는 짧은 고립 성분은 뺀다(독도 꼴) · 간선에 붙은 service는 남긴다', () => {
    const T = land(400, 300);
    const roads = [
      rd('service', [[231, 207], [230, 204], [227, 205]]),
      rd('service', [[298, 236], [299, 231], [305, 233]]),
      rd('residential', [[100, 100], [160, 100]]),
      rd('service', [[160, 100], [160, 110]]),   // 간선에 붙음
    ];
    const r = pruneRoadsDetailed(roads, T);
    expect(r.stubs).toEqual([0, 1]);
    expect(r.kept.length).toBe(2);
    expect(r.kept[1].cls).toBe('service');
  });

  it('토막 — 가장자리에 걸치면(지도 밖으로 이어지는 길) 둔다 · 40타일 넘는 service 묶음도 둔다', () => {
    const T = land(400, 300);
    const roads = [rd('service', [[1, 150], [8, 150]]), rd('service', [[100, 100], [100, 100 + ROAD_PRUNE.stubMaxTiles + 1]])];
    const r = pruneRoadsDetailed(roads, T);
    expect(r.stubs).toEqual([]);
    expect(r.kept.length).toBe(2);
  });

  it('바다 위 — 지도 안 표본 절반 이상이 물이면 뺀다 · 지도 밖 점은 세지 않는다', () => {
    const T = land(100, 100).map((row, r) => (r >= 50 ? '~'.repeat(100) : row));
    const roads = [
      rd('residential', [[10, 60], [40, 60]]),          // 전부 바다
      rd('residential', [[10, 10], [40, 10]]),          // 전부 뭍
      rd('residential', [[10, 48], [10, 52]]),          // 반 — 표본 5 가운데 바다 3 ≥ 0.5
      rd('residential', [[-30, 20], [3, 20]]),          // 지도 밖으로 이어지는 뭍길 — 밖 점은 안 센다
    ];
    const r = pruneRoadsDetailed(roads, T);
    expect(r.sea).toEqual([0, 2]);
    expect(pruneRoads(roads, T).length).toBe(2);
  });

  it('지형이 없으면 그대로', () => {
    const roads = [rd('service', [[1, 1], [2, 2]])];
    expect(pruneRoads(roads, [])).toEqual(roads);
  });

  it('차량 예산 — 간선 300타일 미만 0 · 150타일당 1 · 상한 36 · service만이면 0', () => {
    expect(vehicleBudget([rd('residential', [[0, 0], [299, 0]])])).toBe(0);
    expect(vehicleBudget([rd('residential', [[0, 0], [300, 0]])])).toBe(2);
    expect(vehicleBudget([rd('primary', [[0, 0], [6000, 0]])])).toBe(VEHICLE_BUDGET.max);
    expect(vehicleBudget([rd('service', [[0, 0], [900, 0]])])).toBe(0);
    expect(mainRoadLength([rd('service', [[0, 0], [10, 0]]), rd('tertiary', [[0, 0], [0, 7]])])).toBeCloseTo(7);
  });

  it('실데이터 — 독도는 남는 도로 0 · 차 0, 속초는 차 36 · 도로 대부분 유지', () => {
    const data = path.resolve(__dirname, '../../../client-pc/public/data');
    const load = (region: string): { roads: RegionRoad[]; terrain: string[] } => ({
      roads: JSON.parse(fs.readFileSync(path.join(data, region, 'roads.json'), 'utf8')) as RegionRoad[],
      terrain: (JSON.parse(fs.readFileSync(path.join(data, region, 'seamless.json'), 'utf8')) as { terrain: string[] }).terrain,
    });
    const dokdo = load('dokdo');
    const dk = pruneRoadsDetailed(dokdo.roads, dokdo.terrain);
    expect(dokdo.roads.length).toBe(3);
    expect(dk.kept.length).toBe(0);
    expect(vehicleBudget(dk.kept)).toBe(0);
    const sokcho = load('sokcho_v2');
    const sk = pruneRoads(sokcho.roads, sokcho.terrain);
    expect(sk.length).toBeGreaterThan(sokcho.roads.length * 0.97);
    expect(vehicleBudget(sk)).toBe(36);
  });
});
