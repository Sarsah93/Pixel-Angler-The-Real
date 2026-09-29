/**
 * 고가도로·대교 상판(184차) — 지면 위 **두 번째 층**을 가진 도로.
 *
 * 사용자 지시(금강대교 위성 캡처): "평지 도로가 아닌 다리 도로 — 2~3 레이어 높은 고도의 highway 같은".
 * 183차 고도 층(`Elevation.ts`)은 **타일 하나에 층 하나**라, 다리 밑을 지나는 길·물길을 표현하지 못한다.
 * 그래서 고가는 타일 층과 별개인 **폴리라인 상판**으로 둔다:
 *
 *  - 상판은 중심선 폴리라인 + 반폭. 좌표는 타일 단위(소수 허용).
 *  - 높이는 양 끝 경사로에서 0 → `level`로 오르고(smoothstep), 가운데는 `level`이다.
 *  - 지면에 선 사람은 **끝단(높이 ≈ 0)** 에서만 상판에 오른다. 상판 위의 사람은 끝단으로만 내려온다
 *    (그 밖의 가장자리는 난간).
 *  - 경사로 구간(0 < 높이 < 통과 높이)은 지면 쪽에서 **막힌 둑**이고, 그보다 높은 구간은 밑으로 지나간다.
 *
 * 전부 순수 함수다 — 렌더·충돌은 클라이언트(`OverpassSystem`)가 이 판정을 소비한다.
 */

/** 고가도로 하나 */
export interface RegionOverpass {
  /** 식별자 (패치 안에서 유일) */
  id: string;
  /** 표시용 이름 — 예: 금강대교 */
  name?: string;
  /** 중심선 폴리라인 (타일 좌표, 소수 허용) — OSM `bridge=yes` 선형을 그대로 옮긴다 */
  pts: [number, number][];
  /** 상판 반폭 (타일) — 난간 안쪽 끝까지 */
  halfW: number;
  /** 최고 높이 (층) — 2~3 */
  level: number;
  /** 양 끝 경사로 길이 (타일) */
  rampTiles: number;
  /** 아치(트러스) 구간 — 중심선 호길이 [시작, 끝] (타일). 금강대교 붉은 아치 */
  arch?: [number, number];
}

/** 중심선 투영 결과 */
export interface OverpassProjection {
  /** 시작점부터 호길이 (타일) — 폴리라인 밖이면 음수·길이 초과 */
  s: number;
  /** 중심선에서 부호 있는 횡거리 (타일) — 진행 방향 왼쪽이 + */
  d: number;
  /** 가장 가까운 선분 번호 */
  seg: number;
  /** 그 점의 진행 방향 단위 벡터 */
  ux: number;
  uy: number;
}

/** 끝단(상판 높이 ≈ 지면) 길이 (타일) — 여기서만 오르내린다 */
export const OVERPASS_END_TILES = 1.5;
/** 이 높이(층) 이상이면 지면에서 밑으로 지나갈 수 있다 */
export const OVERPASS_CLEARANCE = 1;

/** 중심선 전체 길이 (타일) */
export function overpassLength(op: RegionOverpass): number {
  let L = 0;
  for (let i = 1; i < op.pts.length; i++) {
    L += Math.hypot(op.pts[i][0] - op.pts[i - 1][0], op.pts[i][1] - op.pts[i - 1][1]);
  }
  return L;
}

/**
 * 점(타일 좌표)을 중심선에 투영한다. 양 끝 선분은 **연장선**으로 투영해 `s < 0`·`s > L`을 돌려준다
 * (끝을 지나 내려왔는지 판정하려면 필요하다).
 */
export function projectOnOverpass(op: RegionOverpass, x: number, y: number): OverpassProjection {
  const P = op.pts;
  let best: OverpassProjection = { s: 0, d: Infinity, seg: 0, ux: 1, uy: 0 };
  let bestDist = Infinity;
  let acc = 0;
  for (let i = 1; i < P.length; i++) {
    const ax = P[i - 1][0], ay = P[i - 1][1];
    const bx = P[i][0], by = P[i][1];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    const ux = dx / len, uy = dy / len;
    let t = (x - ax) * ux + (y - ay) * uy;
    const first = i === 1, last = i === P.length - 1;
    if (!first && t < 0) t = 0;
    if (!last && t > len) t = len;
    const px = ax + ux * t, py = ay + uy * t;
    const dist = Math.hypot(x - px, y - py);
    if (dist < bestDist) {
      bestDist = dist;
      // 왼쪽(+) = 진행 방향을 반시계로 90° 돌린 쪽 (화면 y가 아래로 커지므로 (uy, −ux))
      const side = (x - px) * uy - (y - py) * ux;
      best = { s: acc + t, d: side >= 0 ? dist : -dist, seg: i - 1, ux, uy };
    }
    acc += len;
  }
  return best;
}

function smooth01(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/** 호길이 s에서 상판 높이 (층, 0 ~ level) */
export function overpassHeightAt(op: RegionOverpass, s: number, L = overpassLength(op)): number {
  if (s <= 0 || s >= L) return 0;
  const ramp = Math.max(1, op.rampTiles);
  return op.level * smooth01(s / ramp) * smooth01((L - s) / ramp);
}

/** 투영점이 상판 폭 안인가 */
export function onOverpassBand(op: RegionOverpass, p: OverpassProjection, L = overpassLength(op), pad = 0): boolean {
  return p.s >= -pad && p.s <= L + pad && Math.abs(p.d) <= op.halfW + pad;
}

/** 끝단(오르내리는 곳)인가 */
export function inOverpassEndZone(op: RegionOverpass, p: OverpassProjection, L = overpassLength(op)): boolean {
  return p.s <= OVERPASS_END_TILES || p.s >= L - OVERPASS_END_TILES;
}

/**
 * 지면에 선 사람에게 이 지점이 막혀 있는가 — 경사로 둑(끝단 밖 ∧ 통과 높이 미만).
 * 높은 구간은 밑으로 지나가고, 끝단은 그대로 올라선다.
 */
export function overpassBlocksGround(op: RegionOverpass, p: OverpassProjection, L = overpassLength(op)): boolean {
  if (!onOverpassBand(op, p, L)) return false;
  if (inOverpassEndZone(op, p, L)) return false;
  return overpassHeightAt(op, p.s, L) < OVERPASS_CLEARANCE;
}
