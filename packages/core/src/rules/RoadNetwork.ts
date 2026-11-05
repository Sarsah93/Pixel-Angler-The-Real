/**
 * @file RoadNetwork.ts
 * @description 301차 — 심리스 지역 도로망 정리 규칙(그릴 · 달릴 도로 고르기 · 차량 예산).
 *
 * 사용자 리포트(독도 접안시설 캡처): 「차선/차량 수 통제/도로와 다른 타일들/해안선과 육로의 경계가 완전 뒤섞여 … 지저분」.
 * 원인 둘 — ① 도로가 34타일(service 셋)뿐인 섬에도 차량을 늘 36대 내보냈다 ② 테트라포드('b') 위로 그어진 service 토막에도
 * 보도 + 연석 + 아스팔트 띠를 그렸다. 규칙은 데이터(roads.json)를 고치지 않고 **그릴 · 달릴 도로**를 고른다.
 *
 *  - `pruneRoads` — ① 지도 안쪽의 짧은 고립 토막(간선 없는 service · track · construction 묶음 < 40타일 = 200m)
 *    ② 지도 안 표본 절반 이상이 바다('~') 위인 도로 를 뺀다. 가장자리(2칸 안)에 정점이 있는 길은 지도 밖으로 이어지는 길이라 둔다.
 *  - `vehicleBudget` — 간선(service · track · construction · *_link 밖) 길이로 차량 수를 정한다.
 *    300타일(1.5km) 미만이면 0대 · 150타일당 1대 · 상한 36(구 고정값).
 *  - `isUndrivableRoadClass` — 농로(track) · 공사 중(construction)에는 차를 올리지 않는다.
 *
 * 순수 규칙 — 렌더 · 씬 상태 없음. 감사 도구 `tools/audit_roads.mjs`가 같은 식을 쓴다. 편집기 데이터(`regionRoads`)는 그대로 두고
 * 씬이 청크(띠 그림) · 교통(차)에 넘기는 목록만 이 규칙을 거친다.
 */
import type { RegionRoad } from '../types/RegionMap.js';

/** 토막 · 바다 위 도로 판정 상수 */
export const ROAD_PRUNE = {
  /** 이보다 짧고 간선이 없는 고립 성분 = 토막(타일 · 1타일 = 5m) */
  stubMaxTiles: 40,
  /** 지도 안 표본 가운데 이 비율 이상이 바다('~')면 「바다 위 도로」 */
  seaFrac: 0.5,
  /** 바다 판정에 필요한 지도 안 표본 수 */
  minSamples: 3,
  /** 가장자리 판정 폭(타일) — 이 안에 정점이 있으면 지도 밖으로 이어지는 길 */
  edgeTiles: 2,
} as const;

/** 차량 예산 상수 */
export const VEHICLE_BUDGET = {
  /** 간선 길이(타일)가 이보다 짧으면 차가 다니지 않는다 */
  minMainTiles: 300,
  /** 간선 이 길이마다 1대 */
  tilesPerCar: 150,
  /** 상한(구 고정값 36) */
  max: 36,
} as const;

const MINOR_CLASSES: ReadonlySet<string> = new Set(['service', 'track', 'construction']);

/** 간선이 아닌 도로 등급(진입로 · 농로 · 공사 · 램프) — 차량 예산 · 토막 판정에서 뺀다 */
export function isMinorRoadClass(cls: string): boolean {
  return MINOR_CLASSES.has(cls) || cls.endsWith('_link');
}

/** 차가 다닐 수 없는 등급 — 농로(track) · 공사 중(construction). 폭 2 미만 · 지도 밖 정점은 `TrafficSystem`이 따로 뺀다 */
export function isUndrivableRoadClass(cls: string): boolean {
  return cls === 'track' || cls === 'construction';
}

/** 폴리라인 길이(타일) */
export function roadLength(pts: readonly (readonly [number, number])[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

const ptKey = (p: readonly [number, number]): string => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;

/** 정점을 공유하는 도로 묶음 — 도로 index → 성분 대표 index(유니온 파인드) */
export function roadComponents(roads: readonly RegionRoad[]): number[] {
  const parent = roads.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
    return i;
  };
  const byKey = new Map<string, number>();
  roads.forEach((rd, i) => {
    for (const p of rd.pts) {
      const k = ptKey(p);
      const j = byKey.get(k);
      if (j === undefined) byKey.set(k, i);
      else { const a = find(i), b = find(j); if (a !== b) parent[a] = b; }
    }
  });
  return roads.map((_, i) => find(i));
}

/** 선분을 1타일 간격으로 찍은 표본점 */
function samplePoints(pts: readonly (readonly [number, number])[], step = 1): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k <= n; k++) out.push([ax + (bx - ax) * (k / n), ay + (by - ay) * (k / n)]);
  }
  return out;
}

export interface RoadPruneResult {
  /** 남긴 도로(원본 순서 · 같은 객체) */
  kept: RegionRoad[];
  /** 토막으로 뺀 도로 index */
  stubs: number[];
  /** 바다 위 도로로 뺀 도로 index */
  sea: number[];
}

/**
 * 그릴 · 달릴 도로 고르기 — 토막 · 바다 위 도로를 뺀다. 지형이 없으면(빈 배열) 그대로 돌려준다.
 * @param roads 도로 벡터(roads.json · 편집기 오버라이드)
 * @param terrainRows 지형 문자 그리드([row] 문자열 · '~' = 바다)
 */
export function pruneRoadsDetailed(roads: readonly RegionRoad[], terrainRows: readonly string[]): RoadPruneResult {
  const rows = terrainRows.length, cols = rows ? terrainRows[0].length : 0;
  if (!rows || !cols) return { kept: roads.slice(), stubs: [], sea: [] };
  const E = ROAD_PRUNE.edgeTiles;
  const onEdge = (rd: RegionRoad): boolean => rd.pts.some(([x, y]) => x < E || y < E || x > cols - E || y > rows - E);
  const comp = roadComponents(roads);
  const compLen = new Map<number, number>(), compMain = new Map<number, number>();
  roads.forEach((rd, i) => {
    const c = comp[i], L = roadLength(rd.pts);
    compLen.set(c, (compLen.get(c) ?? 0) + L);
    if (!isMinorRoadClass(rd.cls)) compMain.set(c, (compMain.get(c) ?? 0) + L);
  });
  const stubs: number[] = [], sea: number[] = [];
  const kept: RegionRoad[] = [];
  roads.forEach((rd, i) => {
    const edge = onEdge(rd);
    const c = comp[i];
    if (!edge && (compMain.get(c) ?? 0) === 0 && (compLen.get(c) ?? 0) < ROAD_PRUNE.stubMaxTiles) { stubs.push(i); return; }
    // 바다 위 — 지도 안 표본만 센다(지도 밖 점은 '~'로 잡혀 전부 바다로 보인다)
    let inb = 0, wet = 0;
    for (const [x, y] of samplePoints(rd.pts)) {
      const cc = Math.floor(x), rr = Math.floor(y);
      if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
      inb++;
      if (terrainRows[rr][cc] === '~') wet++;
    }
    if (inb >= ROAD_PRUNE.minSamples && wet / inb >= ROAD_PRUNE.seaFrac) { sea.push(i); return; }
    kept.push(rd);
  });
  return { kept, stubs, sea };
}

/** `pruneRoadsDetailed`의 남긴 도로만 */
export function pruneRoads(roads: readonly RegionRoad[], terrainRows: readonly string[]): RegionRoad[] {
  return pruneRoadsDetailed(roads, terrainRows).kept;
}

/** 간선 길이 합(타일) */
export function mainRoadLength(roads: readonly RegionRoad[]): number {
  let L = 0;
  for (const rd of roads) if (!isMinorRoadClass(rd.cls)) L += roadLength(rd.pts);
  return L;
}

/** 주행 차량 수 — 간선 300타일 미만 0 · 150타일당 1대 · 상한 36 */
export function vehicleBudget(roads: readonly RegionRoad[]): number {
  const L = mainRoadLength(roads);
  if (L < VEHICLE_BUDGET.minMainTiles) return 0;
  return Math.min(VEHICLE_BUDGET.max, Math.floor(L / VEHICLE_BUDGET.tilesPerCar));
}
