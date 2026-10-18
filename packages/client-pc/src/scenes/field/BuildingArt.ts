/**
 * @file BuildingArt.ts
 * @description 239차 — 건물 그림(벡터 윤곽 · 2.5D 벽 · 종류별 지붕) — 사용자 지시 「건물이 짓다만 블럭 더미처럼 보이지 않게,
 *   건물과 길이 명확히 구분되게(Cities: Skylines 탑다운 수준)」.
 *
 * 지금까지 건물은 '#' 타일에 Kenney 지붕 셀을 깔아(타일 단위) 대각선 건물이 **계단형 덩어리**로 보였고, 종류 · 층수가 없어
 * 아파트 · 상가 · 주택 · 창고가 같은 납작한 판이었다. 여기서는
 *  1. **건물 단위(unit)** 를 OSM 폴리곤(`buildings.json`)에서 만든다 — 대각선 건물은 기울어진 윤곽 그대로. 붙어 있는 가게 여러 채가
 *     '#' 성분 하나로 뭉쳐도 **채마다** 따로 선다. 폴리곤이 없는 '#' 성분(캡처 · 래스터)은 타일 윤곽을 따라 그리되
 *     1타일 계단을 직선으로 편다(Douglas–Peucker).
 *  2. **2.5D** — 윤곽을 층수만큼 위로 들어 지붕을 놓고, 남쪽(화면 아래)을 보는 변마다 벽을 세운다(창 · 1층 유리 · 문).
 *     그림자는 남동쪽으로. '#' 타일은 NPC 걷기 · 길찾기에 그대로 쓴다.
 *     258차 — **플레이어 충돌은 이 윤곽을 따른다**(`unitBodyRects` — 사용자 「캐릭터가 벽에 걸려서 더 앞으로 가지지 않아야 …
 *     경계(Collision) 명확화」). '#' 타일은 칸 중심이 윤곽 안인 칸이라 윤곽이 반 칸까지 더 나가 있었고(동명활어센터 남쪽 0.49칸 ≈ 16px),
 *     그 띠로 걸어 들어가 벽 그림 뒤에 숨었다.
 *  3. **종류별 지붕** — 주택 = 박공(용마루 · 밝은 면/어두운 면) · 아파트 = 콘크리트(엘리베이터 탑 · 물탱크 · 난간) · 상가 = 평지붕(실외기) ·
 *     공공 = 밝은 콘크리트(채광창) · 산업 = 패널 · 지붕만(roof) = 차양.
 * 좌표는 월드 px. 그리기는 청크 지붕 아틀라스(Graphics → RenderTexture)에 한 번.
 *  4. 261차 — **건물 그림은 이것 하나다**(사용자 「구 에셋 건물 이미지들 … 전부 사용하지 않고 … 지도 기반 건물로만」).
 *     Gemini 횟집 · 팝업 · 고층 파사드 · TopDown 주택 프리팹과 Kenney 지붕 키트는 더 쓰지 않는다. 가게가 있는데 건물이 없는 자리는
 *     씬이 합성 발자국(`RegionBuilding`)을 만들어 여기로 보낸다. 문은 가게마다 하나씩(`doors`) — 간판이 그 문 옆에 선다.
 *     레거시(홈타운 · 부산 · 타일 20px) 맵도 같은 함수로 그린다(`minGroup` 1 · 타일 윤곽).
 */

import Phaser from 'phaser';
import type { RegionBuilding } from '@tra/core';

export type Pt = [number, number];
export type BuildingKindArt = RegionBuilding['kind'];
export type RoofStyle = 'gable' | 'concrete' | 'flat' | 'panel' | 'canopy';

export interface BuildingUnit {
  id: string;
  kind: BuildingKindArt;
  levels: number;
  /** 벽 높이(px) — 지붕이 윤곽에서 이만큼 위로 올라간다 */
  wallH: number;
  roof: RoofStyle;
  /** 바닥 윤곽(월드 px · 시계 방향) */
  poly: Pt[];
  /** 주 '#' 성분(없으면 -1) */
  compId: number;
  /** 그림 프레임(월드 px) — 벽 · 그림자 여유 포함 */
  x0: number; y0: number; x1: number; y1: number;
  /** 깊이 정렬 기준(윤곽 최대 y) */
  bottomY: number;
  /** 0..1 결정적 변주(지붕 팔레트) */
  hue: number;
  /** 바닥 타일 수(면적) */
  tiles: number;
  name?: string;
  /**
   * 261차 — 문 자리(월드 x · 문 변 위로 사영). 없으면 가장 아래 남향 변의 가운데 하나.
   * 가게가 여럿인 건물은 가게마다 문이 하나씩 — 씬이 `prepareSeamlessPois`에서 채운다.
   */
  doors?: number[];
}

/** '#' 4-연결 성분(bbox · 타일 수) — 지붕 · 충돌 · POI 건물 조회의 기준 */
export interface BuildingComp { c0: number; r0: number; c1: number; r1: number; n: number }

/** 타일 윤곽 묶음의 종류 힌트(261차 — 레거시 맵: 홈타운 집 = 주택 · 부산 작은 덩어리 = 주택) */
export interface GroupKindHint { kind: BuildingKindArt; levels?: number; name?: string }

export interface BuildingPlanInput {
  terrainRows: string[];
  cols: number;
  rows: number;
  tr: number;
  seed: number;
  comps: BuildingComp[];
  compOf: Int32Array;
  buildings: RegionBuilding[];
  /** 편집기 지붕 팔레트 오버라이드(성분 좌상단 "c,r" → 인덱스) */
  roofOverrides?: Record<string, number>;
  /** 타일 윤곽으로 그릴 최소 묶음 크기(기본 2 — 래스터 스페클 제외. 레거시 맵은 1) */
  minGroup?: number;
  /** 타일 윤곽 계단 펴기 허용(타일 · 기본 0.85 — 작은 레거시 건물은 0.5) */
  tileEps?: number;
  /** 타일 윤곽 묶음의 종류 · 층수 힌트(없으면 'yes' · 면적 어림) */
  groupKind?: (g: { tiles: number; c0: number; r0: number; c1: number; r1: number }) => GroupKindHint | undefined;
}

/** 포장 띠(윤곽 바깥 px) · 프레임 여유 */
const PLINTH = 3;
const FRAME_PAD = PLINTH + 2;
/** 창 간격 · 층 높이(px) */
const WIN_STEP = 9, FLOOR_PX = 7;
/** 그림자 오프셋(px) — 벽이 높을수록 길게(해가 북서) */
function shadowOf(wallH: number): number { return 3 + Math.round(wallH * 0.22); }
/** OSM 폴리곤 잔떨림 제거(타일) · 타일 윤곽 계단 펴기(타일) */
const EPS_OSM = 0.3, EPS_TILE = 0.85;

// ─────────────────────────────────────────────
// 기하
// ─────────────────────────────────────────────

function hash2(seed: number, x: number, y: number): number {
  let n = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function polyArea(p: Pt[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length]; a += x0 * y1 - x1 * y0; }
  return a / 2;
}

export function pointInPoly(x: number, y: number, p: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * '#' 타일 4-연결 성분 라벨링(전맵 1회) — 261차에 `SeamlessChunks.labelBuildings`에서 옮겨 레거시 맵과 공유한다.
 * 반환 `compOf` = 타일 → 성분 id(-1 = 비건물).
 */
export function labelBuildingComps(terrainRows: string[], cols: number, rows: number): { comps: BuildingComp[]; compOf: Int32Array } {
  const compOf = new Int32Array(cols * rows).fill(-1);
  const comps: BuildingComp[] = [];
  const qx = new Int32Array(cols * rows), qy = new Int32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const line = terrainRows[r] ?? '';
    for (let c = 0; c < cols; c++) {
      if (line[c] !== '#' || compOf[r * cols + c] !== -1) continue;
      const id = comps.length;
      let head = 0, tail = 0, n = 0;
      let c0 = c, c1 = c, r0 = r, r1 = r;
      qx[tail] = c; qy[tail] = r; tail++;
      compOf[r * cols + c] = id;
      while (head < tail) {
        const x = qx[head], y = qy[head]; head++;
        n++;
        if (x < c0) c0 = x; if (x > c1) c1 = x;
        if (y < r0) r0 = y; if (y > r1) r1 = y;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          const k = ny * cols + nx;
          if (compOf[k] === -1 && (terrainRows[ny] ?? '')[nx] === '#') {
            compOf[k] = id; qx[tail] = nx; qy[tail] = ny; tail++;
          }
        }
      }
      comps.push({ c0, r0, c1, r1, n });
    }
  }
  return { comps, compOf };
}

function bounds(p: Pt[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of p) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1 };
}

/** 반평면 자르기(Sutherland–Hodgman) — a·x + b·y + c ≥ 0 쪽을 남긴다 */
/** 수평선 y에서 윤곽이 덮는 x 구간들(짝수-홀수 규칙) */
function scanSpans(p: Pt[], y: number): [number, number][] {
  const xs: number[] = [];
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
  }
  xs.sort((a, b) => a - b);
  const out: [number, number][] = [];
  for (let k = 0; k + 1 < xs.length; k += 2) out.push([xs[k], xs[k + 1]]);
  return out;
}

/** 겹치거나 맞닿은 구간을 합친다 */
function unionSpans(sp: [number, number][]): [number, number][] {
  const s = [...sp].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const [a, b] of s) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 0.5) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

export interface BodyRect { x: number; y: number; w: number; h: number }

/**
 * 258차 — 윤곽을 따라가는 플레이어 충돌 사각형들(월드 px). 바닥선(남쪽 끝)에서 위로 `band`px 띠마다
 * 띠의 위 · 가운데 · 아래 세 줄에서 윤곽이 덮는 구간을 합쳐 사각형으로 만든다 — 비스듬한 벽에서도 안으로 새지 않는다
 * (밖으로는 띠 높이 × 기울기만큼 넉넉하다). 바로 아래 띠와 구간이 같으면 하나로 잇는다(축에 맞는 건물은 사각형 하나).
 * 바닥선에서 띠를 시작하므로 정면 벽(남쪽 변)은 그림과 같은 줄에서 막힌다. `clip`(청크 사각형) 밖은 자른다.
 */
export function unitBodyRects(poly: Pt[], clip: { x0: number; y0: number; x1: number; y1: number }, band = 4): BodyRect[] {
  const b = bounds(poly);
  const out: BodyRect[] = [];
  let prev: BodyRect[] = [];
  for (let yb = b.y1; yb > b.y0 + 0.01; yb -= band) {
    const top = Math.max(b.y0, yb - band);
    const t = Math.max(top, clip.y0), bt = Math.min(yb, clip.y1);
    if (bt - t < 0.5) { prev = []; continue; }
    const spans = unionSpans([...scanSpans(poly, t + 0.25), ...scanSpans(poly, (t + bt) / 2), ...scanSpans(poly, bt - 0.25)]);
    const cur: BodyRect[] = [];
    for (const [xa, xb] of spans) {
      const x0 = Math.max(xa, clip.x0), x1 = Math.min(xb, clip.x1);
      if (x1 - x0 < 1) continue;
      const same = prev.find((r) => Math.abs(r.x - x0) < 0.5 && Math.abs(r.x + r.w - x1) < 0.5 && Math.abs(r.y - bt) < 0.01);
      if (same) { same.h += same.y - t; same.y = t; cur.push(same); continue; }
      const r = { x: x0, y: t, w: x1 - x0, h: bt - t };
      out.push(r);
      cur.push(r);
    }
    prev = cur;
  }
  return out;
}

export function clipHalfPlane(p: Pt[], a: number, b: number, c: number): Pt[] {
  const out: Pt[] = [];
  const n = p.length;
  for (let i = 0; i < n; i++) {
    const cur = p[i], prev = p[(i + n - 1) % n];
    const dc = a * cur[0] + b * cur[1] + c, dp = a * prev[0] + b * prev[1] + c;
    if (dc >= 0) {
      if (dp < 0) { const t = dp / (dp - dc); out.push([prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]); }
      out.push(cur);
    } else if (dp >= 0) {
      const t = dp / (dp - dc); out.push([prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]);
    }
  }
  return out;
}

/** 직선(점 o · 방향 d)과 폴리곤의 교차 구간 — 가장 긴 안쪽 구간 [t0, t1] */
function lineInside(p: Pt[], ox: number, oy: number, dx: number, dy: number): [number, number] | null {
  const ts: number[] = [];
  for (let i = 0; i < p.length; i++) {
    const [ax, ay] = p[i], [bx, by] = p[(i + 1) % p.length];
    const ex = bx - ax, ey = by - ay;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((ax - ox) * ey - (ay - oy) * ex) / den;
    const u = ((ax - ox) * dy - (ay - oy) * dx) / den;
    if (u >= 0 && u <= 1) ts.push(t);
  }
  if (ts.length < 2) return null;
  ts.sort((a, b) => a - b);
  let best: [number, number] | null = null;
  for (let i = 0; i + 1 < ts.length; i += 2) {
    const mid = (ts[i] + ts[i + 1]) / 2;
    if (!pointInPoly(ox + dx * mid, oy + dy * mid, p)) continue;
    if (!best || ts[i + 1] - ts[i] > best[1] - best[0]) best = [ts[i], ts[i + 1]];
  }
  return best;
}

/** 최소 면적 외접 사각형의 긴 축(단위 벡터) · 중심 · 길이 · 폭 */
export function longAxis(p: Pt[]): { cx: number; cy: number; ux: number; uy: number; len: number; wid: number } {
  let cx = 0, cy = 0;
  for (const [x, y] of p) { cx += x; cy += y; }
  cx /= p.length; cy /= p.length;
  let best = { ux: 1, uy: 0, len: Infinity, wid: Infinity, area: Infinity, minA: 0, minB: 0 };
  for (let i = 0; i < p.length; i++) {
    const [ax, ay] = p[i], [bx, by] = p[(i + 1) % p.length];
    const l = Math.hypot(bx - ax, by - ay);
    if (l < 1e-6) continue;
    const ux = (bx - ax) / l, uy = (by - ay) / l;
    let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
    for (const [x, y] of p) {
      const a = x * ux + y * uy, b = -x * uy + y * ux;
      if (a < minA) minA = a; if (a > maxA) maxA = a; if (b < minB) minB = b; if (b > maxB) maxB = b;
    }
    const area = (maxA - minA) * (maxB - minB);
    if (area < best.area) best = { ux, uy, len: maxA - minA, wid: maxB - minB, area, minA, minB };
  }
  if (best.len < best.wid) {
    // 긴 축이 되도록 90° 돌린다
    return { cx, cy, ux: -best.uy, uy: best.ux, len: best.wid, wid: best.len };
  }
  return { cx, cy, ux: best.ux, uy: best.uy, len: best.len, wid: best.wid };
}

// ─────────────────────────────────────────────
// 타일 마스크 → 윤곽
// ─────────────────────────────────────────────

/** 타일 집합(인덱스 r*cols+c)의 바깥 윤곽들(타일 격자 좌표 · 시계 방향) */
export function traceMaskOutlines(tiles: Set<number>, cols: number): Pt[][] {
  const has = (c: number, r: number): boolean => c >= 0 && r >= 0 && tiles.has(r * cols + c);
  // 방향 있는 경계 변: 시작점 키 → 변 목록(끝점)
  const edges = new Map<string, Pt[]>();
  const key = (x: number, y: number): string => `${x},${y}`;
  const add = (x0: number, y0: number, x1: number, y1: number): void => {
    const k = key(x0, y0);
    const l = edges.get(k) ?? [];
    l.push([x1, y1]);
    edges.set(k, l);
  };
  for (const idx of tiles) {
    const c = idx % cols, r = Math.floor(idx / cols);
    if (!has(c, r - 1)) add(c, r, c + 1, r);
    if (!has(c + 1, r)) add(c + 1, r, c + 1, r + 1);
    if (!has(c, r + 1)) add(c + 1, r + 1, c, r + 1);
    if (!has(c - 1, r)) add(c, r + 1, c, r);
  }
  const loops: Pt[][] = [];
  while (edges.size > 0) {
    const [startKey, outs] = edges.entries().next().value as [string, Pt[]];
    const [sx, sy] = startKey.split(',').map(Number) as [number, number];
    const loop: Pt[] = [[sx, sy]];
    let cur: Pt = [sx, sy];
    let next = outs.shift()!;
    if (outs.length === 0) edges.delete(startKey);
    let guard = 0;
    let prevDir: Pt = [next[0] - cur[0], next[1] - cur[1]];
    while (guard++ < 100000) {
      cur = next;
      if (cur[0] === sx && cur[1] === sy) break;
      loop.push(cur);
      const k = key(cur[0], cur[1]);
      const cands = edges.get(k);
      if (!cands || cands.length === 0) break;
      // 갈림(대각으로 맞닿은 타일)이면 오른쪽으로 꺾는 변을 고른다(바깥 윤곽을 좁게 유지)
      let pick = 0;
      if (cands.length > 1) {
        let bestTurn = -Infinity;
        cands.forEach((cnd, i) => {
          const dx = cnd[0] - cur[0], dy = cnd[1] - cur[1];
          const turn = prevDir[0] * dy - prevDir[1] * dx;   // >0 = 시계(오른쪽)
          if (turn > bestTurn) { bestTurn = turn; pick = i; }
        });
      }
      next = cands.splice(pick, 1)[0];
      if (cands.length === 0) edges.delete(k);
      prevDir = [next[0] - cur[0], next[1] - cur[1]];
    }
    if (loop.length >= 4) loops.push(loop);
  }
  return loops;
}

/** 닫힌 윤곽 단순화 — 같은 직선 위 점 제거 + Douglas–Peucker(eps) */
export function simplifyLoop(pts: Pt[], eps: number): Pt[] {
  if (pts.length <= 4) return pts;
  // 1) 같은 직선 위 점 제거
  const col: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) > 1e-9) col.push(b);
  }
  if (col.length <= 4) return col;
  // 2) DP — 가장 먼 두 점에서 쪼개 각 폴리라인을 단순화
  let far = 0, fd = -1;
  for (let i = 1; i < col.length; i++) {
    const d = Math.hypot(col[i][0] - col[0][0], col[i][1] - col[0][1]);
    if (d > fd) { fd = d; far = i; }
  }
  const a = col.slice(0, far + 1), b = col.slice(far).concat([col[0]]);
  const out = dp(a, eps).slice(0, -1).concat(dp(b, eps).slice(0, -1));
  return out.length >= 3 ? out : col;
}

function dp(line: Pt[], eps: number): Pt[] {
  if (line.length <= 2) return line;
  const [ax, ay] = line[0], [bx, by] = line[line.length - 1];
  const L = Math.hypot(bx - ax, by - ay) || 1e-9;
  let maxD = -1, idx = -1;
  for (let i = 1; i < line.length - 1; i++) {
    const [x, y] = line[i];
    const d = Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / L;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const l = dp(line.slice(0, idx + 1), eps), r = dp(line.slice(idx), eps);
    return l.slice(0, -1).concat(r);
  }
  return [line[0], line[line.length - 1]];
}

// ─────────────────────────────────────────────
// 단위 계획
// ─────────────────────────────────────────────

const DEFAULT_LEVELS: Record<BuildingKindArt, number> = { apartments: 12, commercial: 3, house: 2, public: 3, industrial: 1, roof: 1, yes: 2 };

function levelsOf(kind: BuildingKindArt, tiles: number, given?: number): number {
  if (given) return Math.max(1, Math.min(40, given));
  if (kind === 'yes') return tiles <= 6 ? 1 : tiles <= 20 ? 2 : tiles <= 60 ? 3 : 4;
  if (kind === 'apartments') return tiles >= 40 ? 15 : 10;
  return DEFAULT_LEVELS[kind];
}

/** 층수 → 벽 높이(px) — 1층 12 · 2층 18 · 3층 24 · 5층 36 · 7층 이상 48 상한(캐릭터 52px보다 낮게 — 가림 최소) */
export function wallHeightOf(levels: number, kind: BuildingKindArt): number {
  if (kind === 'roof') return 9;
  return Math.max(12, Math.min(48, 6 + levels * 6));
}

function roofOf(kind: BuildingKindArt, tiles: number): RoofStyle {
  if (kind === 'house') return 'gable';
  if (kind === 'apartments') return 'concrete';
  if (kind === 'industrial') return 'panel';
  if (kind === 'roof') return 'canopy';
  if (kind === 'public') return 'flat';
  if (kind === 'commercial') return tiles <= 10 ? 'gable' : 'flat';
  return tiles <= 10 ? 'gable' : tiles >= 120 ? 'panel' : 'flat';
}

/** 건물 단위 — OSM 폴리곤 우선, 폴리곤이 덮지 않은 '#' 타일은 성분마다 타일 윤곽으로 */
/**
 * 건물 그림 단위 계획. `coverOut`(길이 cols×rows)을 주면 **그림 단위가 맡은 '#' 칸**에 1을 적는다(258차 —
 * 이 칸들의 플레이어 충돌은 칸이 아니라 윤곽(`unitBodyRects`)이 맡는다). 그리지 않는 외딴 칸(스페클)은 0으로 남는다.
 */
export function planBuildingUnits(inp: BuildingPlanInput, coverOut?: Uint8Array): BuildingUnit[] {
  const { cols, rows, tr, seed, comps, compOf } = inp;
  const covered = new Int32Array(cols * rows).fill(-1);
  const units: BuildingUnit[] = [];
  const isBuildingTile = (c: number, r: number): boolean => c >= 0 && r >= 0 && c < cols && r < rows && inp.terrainRows[r][c] === '#';

  const mkUnit = (id: string, kind: BuildingKindArt, poly: Pt[], tiles: number, compId: number, levels?: number, name?: string): BuildingUnit => {
    const b = bounds(poly);
    const lv = levelsOf(kind, tiles, levels);
    const wallH = wallHeightOf(lv, kind);
    const ovKey = compId >= 0 ? `${comps[compId].c0},${comps[compId].r0}` : '';
    const ov = inp.roofOverrides?.[ovKey];
    const hue = ov !== undefined ? ((ov % 5) + 0.5) / 5 : hash2(seed ^ 0x2b7, Math.round(b.x0), Math.round(b.y0));
    const sh = shadowOf(wallH);
    return {
      id, kind, levels: lv, wallH, roof: roofOf(kind, tiles), poly, compId, tiles, hue,
      x0: Math.floor(b.x0) - FRAME_PAD, y0: Math.floor(b.y0) - wallH - FRAME_PAD,
      x1: Math.ceil(b.x1) + sh + FRAME_PAD, y1: Math.ceil(b.y1) + sh + FRAME_PAD,
      bottomY: b.y1, ...(name ? { name } : {}),
    };
  };

  // 1) OSM 폴리곤
  inp.buildings.forEach((b, bi) => {
    if (b.pts.length < 3) return;
    // 잔떨림(0.3타일 미만 노치)은 편다 — 벽을 세우면 작은 노치마다 톱니가 선다
    const src = simplifyLoop(b.pts, EPS_OSM);
    const poly: Pt[] = (src.length >= 3 ? src : b.pts).map(([x, y]) => [x * tr, y * tr]);
    if (polyArea(poly) < 0) poly.reverse();
    const tb = bounds(b.pts);
    const hit = new Map<number, number>();
    const mine: number[] = [];
    let tiles = 0;
    for (let r = Math.max(0, Math.floor(tb.y0)); r <= Math.min(rows - 1, Math.ceil(tb.y1)); r++) {
      for (let c = Math.max(0, Math.floor(tb.x0)); c <= Math.min(cols - 1, Math.ceil(tb.x1)); c++) {
        if (!isBuildingTile(c, r) || !pointInPoly(c + 0.5, r + 0.5, b.pts)) continue;
        const k = r * cols + c;
        if (covered[k] >= 0) continue;
        covered[k] = bi;
        mine.push(k);
        tiles++;
        const comp = compOf[k];
        if (comp >= 0) hit.set(comp, (hit.get(comp) ?? 0) + 1);
      }
    }
    // '#' 타일을 하나도 못 덮은 폴리곤(너무 작거나 지형 패치로 지워진 것)은 그리지 않는다 — 걷기 정본과 어긋난다
    if (tiles === 0) return;
    if (coverOut) for (const k of mine) coverOut[k] = 1;
    let compId = -1, best = 0;
    for (const [id, n] of hit) if (n > best) { best = n; compId = id; }
    units.push(mkUnit(b.id, b.kind, poly, tiles, compId, b.levels, b.name));
  });

  // 2) 폴리곤이 덮지 않은 '#' 타일 — 성분 안에서 4-연결 묶음마다 타일 윤곽
  const leftover = new Map<number, Set<number>>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      if (!isBuildingTile(c, r) || covered[k] >= 0) continue;
      const comp = compOf[k];
      if (comp < 0) continue;
      let set = leftover.get(comp);
      if (!set) { set = new Set(); leftover.set(comp, set); }
      set.add(k);
    }
  }
  for (const [compId, set] of leftover) {
    // 4-연결 묶음으로 쪼갠다(폴리곤이 성분 한가운데를 덮으면 양쪽이 남는다)
    const seen = new Set<number>();
    for (const start of set) {
      if (seen.has(start)) continue;
      const group = new Set<number>();
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        const k = stack.pop()!;
        group.add(k);
        const c = k % cols, r = Math.floor(k / cols);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nk = (r + dr) * cols + (c + dc);
          if (c + dc < 0 || c + dc >= cols || r + dr < 0 || r + dr >= rows) continue;
          if (set.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); }
        }
      }
      // 외딴 한두 타일(래스터 스페클)은 그리지 않는다 — 걷기엔 남지만 그림으로는 쓰레기다(레거시 맵은 1칸 건물도 그린다)
      if (group.size < (inp.minGroup ?? 2)) continue;
      const loops = traceMaskOutlines(group, cols);
      if (loops.length === 0) continue;
      let outer = loops[0];
      for (const l of loops) if (Math.abs(polyArea(l)) > Math.abs(polyArea(outer))) outer = l;
      const simple = simplifyLoop(outer, inp.tileEps ?? EPS_TILE);
      const poly: Pt[] = simple.map(([x, y]) => [x * tr, y * tr]);
      if (polyArea(poly) < 0) poly.reverse();
      const gc = [...group].map((k) => k % cols), gr = [...group].map((k) => Math.floor(k / cols));
      const c0 = Math.min(...gc), r0 = Math.min(...gr);
      const hint = inp.groupKind?.({ tiles: group.size, c0, r0, c1: Math.max(...gc), r1: Math.max(...gr) });
      units.push(mkUnit(`t${compId}_${c0}_${r0}`, hint?.kind ?? 'yes', poly, group.size, compId, hint?.levels, hint?.name));
      if (coverOut) for (const k of group) coverOut[k] = 1;
    }
  }
  return units;
}

// ─────────────────────────────────────────────
// 그리기
// ─────────────────────────────────────────────

interface Palette {
  wallLit: number; wallShade: number; win: number; winDim: number;
  roofA: number; roofB: number; ridge: number; edge: number; glass: number;
  /** 아파트 외벽 띠(없으면 0) */
  band: number;
}

/** 박공(경사) 지붕 — [밝은 면, 어두운 면, 용마루] */
const ROOF_GABLE: [number, number, number][] = [
  [0xc9594a, 0x95392e, 0xe28276],   // 붉은 기와
  [0x6c7788, 0x4c5563, 0x8f9bad],   // 슬레이트
  [0x5c8a76, 0x3f6554, 0x7fab96],   // 청록 함석
  [0x8a6a48, 0x624a32, 0xa88a66],   // 갈색
  [0x3f5f8a, 0x2c4463, 0x6a8ab4],   // 남색 함석
];
/** 평지붕 — [면, 파라펫, 밝은 선]. 녹색 우레탄 방수(한국 옥상 특징)를 두 배 비중으로 */
// ⚠ 땅(맨땅 베이지 ≈ 0xc9bfa8)과 겹치는 밝은 베이지 · 연회색은 쓰지 않는다 — 실렌더에서 지붕이 땅에 녹아 「건물인지 공터인지」 안 읽혔다
const ROOF_FLAT: [number, number, number][] = [
  [0x5a9560, 0x3a6a42, 0x78b07c],   // 녹색 우레탄
  [0x8c8d8a, 0x63645f, 0xa6a7a3],   // 회색 콘크리트
  [0x5a9560, 0x3a6a42, 0x78b07c],   // 녹색 우레탄
  [0x76726b, 0x55524c, 0x928e86],   // 어두운 콘크리트
  [0x7b93a8, 0x56697c, 0x98adc0],   // 청회 방수 시트
];
/** 아파트 외벽 띠 색 */
const APT_BAND = [0x8fb3d9, 0xd99a8f, 0x9fc49a, 0xc9b27f, 0xa8a0cf];
/** 포장 띠(건물 둘레) · 문 */
const PLINTH_COL = 0x8f8c86, DOOR_FRAME = 0x2a2f36, DOOR_WOOD = 0x6b4a30, DOOR_STEEL = 0x5f6a74, DOOR_GLASS = 0xb9dff2;

function paletteOf(u: BuildingUnit): Palette {
  const gi = Math.floor(u.hue * ROOF_GABLE.length) % ROOF_GABLE.length;
  const fi = Math.floor(u.hue * 7.13) % ROOF_FLAT.length;
  const [ga, gb, gr] = ROOF_GABLE[gi];
  const [fa, fb, fr] = ROOF_FLAT[fi];
  switch (u.kind) {
    case 'apartments': {
      // 아파트는 밝은 콘크리트 또는 녹색 우레탄(hue 상위 40%)
      const green = u.hue > 0.6;
      return {
        wallLit: 0xe2e5e9, wallShade: 0xb6bbc2, win: 0x7fb2d8, winDim: 0x4e7a9c,
        roofA: green ? 0x5a9560 : 0xaab1b9, roofB: green ? 0x3a6a42 : 0x7f868e, ridge: green ? 0x78b07c : 0xc9cfd6,
        edge: 0x6f757c, glass: 0x8fc2e4, band: APT_BAND[gi],
      };
    }
    case 'commercial':
      return u.roof === 'gable'
        ? { wallLit: 0xd9d0c0, wallShade: 0xa89f90, win: 0x86b8d8, winDim: 0x5a86a4, roofA: ga, roofB: gb, ridge: gr, edge: 0x4a4038, glass: 0x8fc8e8, band: 0 }
        : { wallLit: 0xd9d0c0, wallShade: 0xa89f90, win: 0x86b8d8, winDim: 0x5a86a4, roofA: fa, roofB: fb, ridge: fr, edge: 0x4a4f57, glass: 0x8fc8e8, band: 0 };
    case 'house':
      return { wallLit: 0xeae1cc, wallShade: 0xbdb39c, win: 0x8ab8d4, winDim: 0x5f8aa6, roofA: ga, roofB: gb, ridge: gr, edge: 0x4a3f36, glass: 0x9ad0ec, band: 0 };
    case 'public':
      return { wallLit: 0xdcdfdc, wallShade: 0xaab0ad, win: 0x8ec0dc, winDim: 0x5e8ca8, roofA: 0xb3bab8, roofB: 0x858c8a, ridge: 0xd0d6d4, edge: 0x6f7573, glass: 0x9fd0e8, band: 0 };
    case 'industrial':
      return { wallLit: 0xb3bcc5, wallShade: 0x7f8893, win: 0x8aa6b8, winDim: 0x5e7484, roofA: 0x6f8fb0, roofB: 0x4f6c8a, ridge: 0x8fabc8, edge: 0x3f4852, glass: 0x8aa6b8, band: 0 };
    case 'roof':
      return { wallLit: 0x8a8f96, wallShade: 0x5f646b, win: 0, winDim: 0, roofA: 0xd9d2c0, roofB: 0xb9b2a0, ridge: 0xe8e2d2, edge: 0x6a6f74, glass: 0, band: 0 };
    default:
      if (u.roof === 'gable') return { wallLit: 0xe0d6c4, wallShade: 0xb3a994, win: 0x88b6d2, winDim: 0x5d88a4, roofA: ga, roofB: gb, ridge: gr, edge: 0x4a4038, glass: 0x9ad0ec, band: 0 };
      if (u.roof === 'panel') return { wallLit: 0xc5c9cf, wallShade: 0x8e949c, win: 0x8aa6b8, winDim: 0x5e7484, roofA: 0x7d92aa, roofB: 0x5b7088, ridge: 0x9cb0c6, edge: 0x3f4852, glass: 0x8fc8e8, band: 0 };
      return { wallLit: 0xd6cfc2, wallShade: 0xa69f93, win: 0x86b4d4, winDim: 0x5a84a2, roofA: fa, roofB: fb, ridge: fr, edge: 0x4a4f57, glass: 0x8fc8e8, band: 0 };
  }
}

const toPts = (p: Pt[], ox: number, oy: number): { x: number; y: number }[] => p.map(([x, y]) => ({ x: x + ox, y: y + oy }));

/** 긴 축과 평행한 선들을 폴리곤 안쪽에만 긋는다(기와 결 · 패널 이음 · 차양 줄) */
function ruleLines(g: Phaser.GameObjects.Graphics, poly: Pt[], ax: ReturnType<typeof longAxis>, step: number, ox: number, oy: number, from = 0): void {
  for (let k = -ax.wid / 2 + from; k < ax.wid / 2; k += step) {
    const px = ax.cx - ax.uy * k, py = ax.cy + ax.ux * k;
    const s2 = lineInside(poly, px, py, ax.ux, ax.uy);
    if (s2) g.lineBetween(ox + px + ax.ux * s2[0], oy + py + ax.uy * s2[0], ox + px + ax.ux * s2[1], oy + py + ax.uy * s2[1]);
  }
}

/** 문이 서는 변 — 가장 아래(남쪽) 남향 변(길이 ≥ 10px). 차양(roof)이나 남향 변이 없으면 null */
export function doorEdgeOf(u: BuildingUnit): { ax: number; ay: number; bx: number; by: number } | null {
  if (u.kind === 'roof') return null;
  const poly = u.poly, n = poly.length;
  let best = -1, bestY = -Infinity;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % n];
    const dx = bx - ax, dy = by - ay;
    const L = Math.hypot(dx, dy);
    if (L < 10) continue;
    if (-dx / L <= 0.08) continue;   // 바깥 법선 y(시계 방향 · y 아래)가 남쪽을 보는 변만
    const my = (ay + by) / 2;
    if (my > bestY) { bestY = my; best = i; }
  }
  if (best < 0) return null;
  const [ax, ay] = poly[best], [bx, by] = poly[(best + 1) % n];
  return { ax, ay, bx, by };
}

/**
 * 261차 — 문 자리들(월드 px). `doors`(x)가 있으면 그 x를 문 변 위로 사영(끝 8%는 피한다), 없으면 변의 가운데 하나.
 * 씬의 [F] 문 칸 · 간판 자리 · 그림의 문이 전부 이 점을 쓴다 — 보이는 문과 들어가는 문이 어긋나지 않게.
 */
export function doorPointsOf(u: BuildingUnit): Pt[] {
  const e = doorEdgeOf(u);
  if (!e) return [];
  const dx = e.bx - e.ax, dy = e.by - e.ay;
  const at = (t: number): Pt => [e.ax + dx * t, e.ay + dy * t];
  if (!u.doors || u.doors.length === 0) return [at(0.5)];
  return u.doors.map((x) => at(Math.abs(dx) < 1e-3 ? 0.5 : Math.max(0.08, Math.min(0.92, (x - e.ax) / dx))));
}

/**
 * 건물 하나를 그린다 — `ox, oy` = 월드 (0,0)이 Graphics 좌표에서 놓이는 자리(프레임 원점 보정).
 * 순서: 포장 띠 → 그림자 → 남향 벽(처마선 · 창 · 1층 유리 · 문) → 지붕(종류) → 외곽선.
 * 벽은 바깥 법선이 남쪽(+y)인 변에만 선다(탑다운 사선 — 북향 벽은 지붕에 가린다). 수직 압출의 합집합이
 * 발자국 폴리곤을 전부 덮으므로 '#' 바닥은 윤곽을 편 틈새에서만 보인다.
 */
export function drawBuildingUnit(g: Phaser.GameObjects.Graphics, u: BuildingUnit, ox: number, oy: number): void {
  const P = paletteOf(u);
  const poly = u.poly;
  const n = poly.length;
  const H = u.wallH;
  const sh = shadowOf(H);
  const roofPoly: Pt[] = poly.map(([x, y]) => [x, y - H]);
  const fp = toPts(poly, ox, oy);

  // 0) 포장 띠 — 윤곽 바깥 PLINTH px(두꺼운 선으로 바깥쪽 절반만 남긴다)
  if (u.kind !== 'roof') {
    g.lineStyle(PLINTH * 2, PLINTH_COL, 1); g.strokePoints(fp, true);
    g.fillStyle(PLINTH_COL, 1); g.fillPoints(fp, true);
  }

  // 1) 그림자 — 남동쪽 지면(해가 북서). 벽이 높을수록 길다
  g.fillStyle(0x000000, 0.24);
  g.fillPoints(toPts(poly.map(([x, y]) => [x + sh, y + sh]), ox, oy), true);

  // 2) 남향 벽 — 바깥 법선의 y가 아래(+)인 변
  const floors = Math.max(1, Math.min(u.levels, Math.floor((H - 3) / FLOOR_PX)));
  for (let i = 0; i < n; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % n];
    const dx = bx - ax, dy = by - ay;
    const L = Math.hypot(dx, dy);
    if (L < 2) continue;
    const nx = dy / L, ny = -dx / L;   // 시계 방향(y 아래)에서 바깥 법선
    if (ny <= 0.08) continue;
    if (u.kind === 'roof') {
      // 차양은 벽이 없다 — 남향 변을 따라 기둥만(24px 간격)
      const cnt = Math.max(1, Math.floor(L / 24));
      for (let k = 0; k <= cnt; k++) {
        const t = k / cnt;
        g.fillStyle(P.wallShade, 1); g.fillRect(ox + ax + dx * t - 1, oy + ay + dy * t - H, 2, H);
      }
      continue;
    }
    const quad: Pt[] = [[ax, ay], [bx, by], [bx, by - H], [ax, ay - H]];
    // 서남향(해 쪽)은 조금 밝게
    const lit = nx < -0.3;
    g.fillStyle(lit ? P.wallLit : P.wallShade, 1);
    g.fillPoints(toPts(quad, ox, oy), true);
    // 처마 그늘 — 벽 맨 위 2px
    g.fillStyle(0x000000, 0.18);
    g.fillPoints(toPts([[ax, ay - H], [bx, by - H], [bx, by - H + 2], [ax, ay - H + 2]], ox, oy), true);
    // 아파트 외벽 띠 — 꼭대기 아래 한 줄
    if (u.kind === 'apartments' && P.band) {
      g.fillStyle(P.band, 1);
      g.fillPoints(toPts([[ax, ay - H + 2], [bx, by - H + 2], [bx, by - H + 5], [ax, ay - H + 5]], ox, oy), true);
    }
    // 1층 — 상가 · 공공 · 평지붕 '모름'은 유리 띠, 주택 · 아파트는 벽
    const shopFront = (u.kind === 'commercial' || u.kind === 'public' || (u.kind === 'yes' && u.roof !== 'gable')) && L >= 14;
    if (shopFront) {
      g.fillStyle(P.glass, 0.95);
      g.fillPoints(toPts([[ax, ay - 1], [bx, by - 1], [bx, by - 8], [ax, ay - 8]], ox, oy), true);
      // 유리 멀리온(기둥) — 띠를 칸으로 나눈다
      const bays = Math.max(1, Math.floor(L / 12));
      g.fillStyle(0x3a4a5a, 0.7);
      for (let k = 1; k < bays; k++) {
        const t = k / bays;
        g.fillRect(ox + ax + dx * t - 0.5, oy + ay + dy * t - 8, 1, 7);
      }
      g.fillStyle(0x203040, 0.55);
      g.fillPoints(toPts([[ax, ay - 8], [bx, by - 8], [bx, by - 9.5], [ax, ay - 9.5]], ox, oy), true);
    }
    // 창 — 층마다 한 줄(1층은 유리 띠면 생략)
    const startFloor = shopFront ? 1 : 0;
    const cnt = Math.floor((L - 6) / WIN_STEP);
    for (let f = startFloor; f < floors; f++) {
      const wy = -(3 + f * FLOOR_PX) - 4;
      for (let k = 0; k < cnt; k++) {
        const t = (k + 0.5) / Math.max(1, cnt);
        const wx = ax + dx * t, wyy = ay + dy * t + wy;
        g.fillStyle(lit ? P.win : P.winDim, 1);
        g.fillRect(ox + wx - 2, oy + wyy, 4, 4);
        g.fillStyle(0xffffff, 0.35);
        g.fillRect(ox + wx - 2, oy + wyy, 4, 1);
      }
      // 아파트 발코니 선
      if (u.kind === 'apartments') {
        g.fillStyle(0x7b8188, 0.7);
        g.fillPoints(toPts([[ax, ay + wy + 5], [bx, by + wy + 5], [bx, by + wy + 6], [ax, ay + wy + 6]], ox, oy), true);
      }
    }
  }
  // 문 — 가장 아래(남쪽) 변 위. 261차 — 가게마다 하나(`doors`), 없으면 가운데 하나
  if (u.kind !== 'roof') {
    const glassDoor = u.kind === 'commercial' || u.kind === 'public' || (u.kind === 'yes' && u.roof !== 'gable');
    for (const [mx, my] of doorPointsOf(u)) {
      g.fillStyle(DOOR_FRAME, 1); g.fillRect(ox + mx - 3, oy + my - 8, 6, 8);
      g.fillStyle(glassDoor ? DOOR_GLASS : u.kind === 'industrial' ? DOOR_STEEL : DOOR_WOOD, 1); g.fillRect(ox + mx - 2, oy + my - 7, 4, 7);
    }
  }

  // 3) 지붕
  const rp = toPts(roofPoly, ox, oy);
  if (u.roof === 'gable') {
    const ax = longAxis(roofPoly);
    // 용마루 = 긴 축을 지나는 선. 왼쪽/위쪽 면이 밝다(해 북서)
    const a = -ax.uy, b = ax.ux, c = -(a * ax.cx + b * ax.cy);
    g.fillStyle(P.roofB, 1); g.fillPoints(rp, true);
    const litHalf = clipHalfPlane(roofPoly, -a, -b, -c);
    if (litHalf.length >= 3) { g.fillStyle(P.roofA, 1); g.fillPoints(toPts(litHalf, ox, oy), true); }
    // 기와 결 — 용마루와 평행한 옅은 줄
    g.lineStyle(1, 0x000000, 0.1);
    ruleLines(g, roofPoly, ax, 5, ox, oy, 5);
    const seg = lineInside(roofPoly, ax.cx, ax.cy, ax.ux, ax.uy);
    if (seg) {
      g.lineStyle(3, P.ridge, 1);
      g.lineBetween(ox + ax.cx + ax.ux * seg[0], oy + ax.cy + ax.uy * seg[0], ox + ax.cx + ax.ux * seg[1], oy + ax.cy + ax.uy * seg[1]);
    }
  } else if (u.roof === 'concrete') {
    g.fillStyle(P.roofA, 1); g.fillPoints(rp, true);
    const ax = longAxis(roofPoly);
    // 엘리베이터 탑 · 물탱크 — 안쪽에만
    const ex = ax.cx - ax.ux * Math.min(ax.len * 0.22, 24), ey = ax.cy - ax.uy * Math.min(ax.len * 0.22, 24);
    if (pointInPoly(ex, ey, roofPoly)) {
      g.fillStyle(0x000000, 0.18); g.fillRect(ox + ex - 4, oy + ey - 4, 13, 12);
      g.fillStyle(P.roofB, 1); g.fillRect(ox + ex - 6, oy + ey - 8, 12, 12);
      g.fillStyle(P.ridge, 1); g.fillRect(ox + ex - 6, oy + ey - 8, 12, 3);
    }
    const tx = ax.cx + ax.ux * Math.min(ax.len * 0.25, 28), ty = ax.cy + ax.uy * Math.min(ax.len * 0.25, 28);
    if (pointInPoly(tx, ty, roofPoly)) {
      g.fillStyle(0x000000, 0.15); g.fillCircle(ox + tx + 2, oy + ty + 2, 4);
      g.fillStyle(0xdfe3e8, 1); g.fillCircle(ox + tx, oy + ty, 4);
      g.lineStyle(1, 0x8a9199, 1); g.strokeCircle(ox + tx, oy + ty, 4);
    }
    // 난간(파라펫) 안쪽 선
    g.lineStyle(2, P.roofB, 1); g.strokePoints(rp, true);
  } else if (u.roof === 'flat') {
    g.fillStyle(P.roofA, 1); g.fillPoints(rp, true);
    // 실외기 · 환기구 — 결정적 몇 개(안쪽만)
    const ax = longAxis(roofPoly);
    const cnt = Math.min(5, Math.max(1, Math.floor(u.tiles / 10)));
    for (let k = 0; k < cnt; k++) {
      const t = (k + 1) / (cnt + 1) - 0.5;
      const sx = ax.cx + ax.ux * ax.len * 0.7 * t + (hash2(1, k, u.tiles) - 0.5) * 6;
      const sy = ax.cy + ax.uy * ax.len * 0.7 * t + (hash2(2, k, u.tiles) - 0.5) * ax.wid * 0.5;
      if (!pointInPoly(sx, sy, roofPoly)) continue;
      g.fillStyle(0x000000, 0.16); g.fillRect(ox + sx - 2, oy + sy - 1, 8, 6);
      g.fillStyle(0x9ea5ad, 1); g.fillRect(ox + sx - 4, oy + sy - 3, 8, 6);
      g.fillStyle(0xc8ced5, 1); g.fillRect(ox + sx - 4, oy + sy - 3, 8, 2);
    }
    if (u.kind === 'public') {
      // 채광창 띠
      const seg = lineInside(roofPoly, ax.cx, ax.cy, ax.ux, ax.uy);
      if (seg) { g.lineStyle(4, 0x9ccbe6, 0.9); g.lineBetween(ox + ax.cx + ax.ux * seg[0] * 0.8, oy + ax.cy + ax.uy * seg[0] * 0.8, ox + ax.cx + ax.ux * seg[1] * 0.8, oy + ax.cy + ax.uy * seg[1] * 0.8); }
    }
    // 파라펫 — 바깥 어두운 선 + 안쪽 밝은 선
    g.lineStyle(2, P.roofB, 1); g.strokePoints(rp, true);
    g.lineStyle(1, P.ridge, 0.6); g.strokePoints(rp, true);
  } else if (u.roof === 'panel') {
    g.fillStyle(P.roofA, 1); g.fillPoints(rp, true);
    const ax = longAxis(roofPoly);
    g.lineStyle(2, P.roofB, 0.9);
    ruleLines(g, roofPoly, ax, 8, ox, oy, 5);
    g.lineStyle(1, P.ridge, 0.5);
    ruleLines(g, roofPoly, ax, 8, ox, oy, 7);
    g.lineStyle(2, P.edge, 0.8); g.strokePoints(rp, true);
  } else {
    // canopy — 차양(아케이드 · 그늘막): 불투명 천 + 줄무늬 + 둘레 기둥
    g.fillStyle(P.roofA, 1); g.fillPoints(rp, true);
    const ax = longAxis(roofPoly);
    g.lineStyle(2, P.roofB, 0.9);
    ruleLines(g, roofPoly, ax, 6, ox, oy, 3);
    g.lineStyle(1, P.edge, 0.9); g.strokePoints(rp, true);
  }
  // 4) 처마 · 외곽선
  g.lineStyle(1, P.edge, 0.9); g.strokePoints(rp, true);
}

/**
 * 지붕 아틀라스 프레임 포장(선반) — 아틀라스 높이 상한을 넘기면 다음 장으로. 반환 = 장마다 [단위, x, y] 목록 · 장 크기.
 */
export function packUnits(units: BuildingUnit[], maxW: number, maxH: number): { items: { u: BuildingUnit; x: number; y: number }[]; w: number; h: number }[] {
  const sorted = [...units].sort((a, b) => (b.y1 - b.y0) - (a.y1 - a.y0));
  const sheets: { items: { u: BuildingUnit; x: number; y: number }[]; w: number; h: number }[] = [];
  let cur = { items: [] as { u: BuildingUnit; x: number; y: number }[], w: maxW, h: 0 };
  let x = 0, y = 0, rowH = 0;
  for (const u of sorted) {
    const w = u.x1 - u.x0, h = u.y1 - u.y0;
    if (x + w > maxW) { x = 0; y += rowH + 2; rowH = 0; }
    if (y + h > maxH && cur.items.length > 0) {
      cur.h = y; sheets.push(cur);
      cur = { items: [], w: maxW, h: 0 }; x = 0; y = 0; rowH = 0;
    }
    cur.items.push({ u, x, y });
    x += w + 2; rowH = Math.max(rowH, h);
  }
  cur.h = y + rowH;
  if (cur.items.length) sheets.push(cur);
  for (const s of sheets) s.w = Math.max(64, Math.min(maxW, Math.max(...s.items.map((i) => i.x + (i.u.x1 - i.u.x0)))));
  return sheets;
}
