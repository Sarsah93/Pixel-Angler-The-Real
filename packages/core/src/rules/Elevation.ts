/**
 * @file Elevation.ts
 * @description 고도 레이어·계단 규칙 — 183차 (영금정 파일럿).
 *
 * ## 왜 필요했나 (사용자 지시 2026-09-28)
 *
 * "OSM 실측 기반 맵 구성은 위성에서 육지/도로/바다로의 구분만으로 이루어져 있음. …
 *  영금정은 절대 평지가 아님. … 플레이어가 다니는 길보다 위쪽 길일 경우 오르는 계단을 만들고,
 *  한 층 위로 올라가는 것으로 레이어 층을 구현하자."
 *
 * ## 모델
 *
 * - 타일마다 **정수 층**(0 = 평지)을 갖는다. 없는 타일은 0.
 * - 이동은 **같은 층끼리**, 또는 **계단 타일을 통해서만** 허용된다.
 *   층이 다른 두 타일이 계단 없이 맞닿은 변 = 절벽(옆면·그림자) — 넘을 수 없다.
 * - **계단 = 1타일 전이**. `dir`은 오르는 방향(위층이 있는 쪽). 계단 타일의 변은 셋으로 나뉜다:
 *   - 높은 변: `dir`의 성분 방위(`n` → 북 · `ne` → 북·동) — 이 변으로 나가면 `to` 층
 *   - 낮은 변: 그 반대 방위 — 이 변으로 나가면 `from` 층
 *   - 나머지 변: 계단 옆벽 — 막힌다
 *   대각 계단(`ne` 등)은 네 변이 전부 높은/낮은 변이라 옆벽이 없고, 직교 계단은 양옆이 벽이다.
 *   올라감/내려감은 같은 타일이 양방향으로 잇는다(사용자: "수직 계단은 둘 다 같은 것").
 *
 * ⚖ 이 값은 실측 고도(DEM)가 아니라 **손으로 지정한 층**이다(`RegionPatch.levels/stairs`).
 *   2026-09-03 결정("경사로 통행을 막지 않는다 — 차단은 특정 지점만 patch 수동")과 같은 선상에 있다.
 * ⚖ 렌더 전용이던 `reliefHeight`(180차)와 달리 **충돌·이동 판정에 쓴다** — 층 경계 벽은 이 규칙에서 나온다.
 */

/** 타일의 네 변 */
export type TileEdge = 'n' | 'e' | 's' | 'w';

/** 계단이 오르는 방향 — 직교 4 + 대각 4 */
export type StairDir = TileEdge | 'ne' | 'nw' | 'se' | 'sw';

export const STAIR_DIRS: readonly StairDir[] = Object.freeze(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']);

/** 계단 방향 표시명(편집기·상태줄) */
export const STAIR_DIR_LABEL: Record<StairDir, string> = {
  n: '위로(북)', s: '아래로(남)', e: '오른쪽(동)', w: '왼쪽(서)',
  ne: '우측 대각선 위', nw: '좌측 대각선 위', se: '우측 대각선 아래', sw: '좌측 대각선 아래',
};

/** 수동 계단 배치 — `RegionPatch.stairs` */
export interface RegionStair {
  tx: number;
  ty: number;
  dir: StairDir;
  /** 낮은 변으로 나갈 때의 층 */
  from: number;
  /** 높은 변으로 나갈 때의 층 (보통 from + 1) */
  to: number;
}

/** 방파제 피복 지정(183차) — 성분 안 아무 타일 하나로 성분을 가리킨다 */
export interface RegionArmor {
  tx: number;
  ty: number;
  /**
   * 테트라포드 / 사석(돌덩이) / **연석 직벽**(184차 — 피복 없이 돌 상판이 물로 바로 떨어진다.
   * 사용자 위성 대조: "주변 자갈·테트라포드·바위 덩어리 없이 딱 연석만 바다 위에 쌓은 느낌")
   */
  kind: 'tetrapod' | 'rubble' | 'quay';
  /**
   * 피복이 깔리는 **물 쪽 방위**(성분 셀에서 가장 가까운 물이 있는 방향). 비우면 전 방위.
   * 동명항 방파제 = `['e']`(우측만 — 사용자 실측). 지정되지 않은 방위의 물가는 안벽(콘크리트 직벽)이다.
   */
  sides?: TileEdge[];
}

const OPP: Record<TileEdge, TileEdge> = { n: 's', s: 'n', e: 'w', w: 'e' };

export function oppositeEdge(e: TileEdge): TileEdge { return OPP[e]; }

/** 방위 문자열의 성분 변 — `'ne'` → `['n', 'e']` */
export function stairHighEdges(dir: StairDir): TileEdge[] {
  return dir.split('') as TileEdge[];
}

export function stairLowEdges(dir: StairDir): TileEdge[] {
  return stairHighEdges(dir).map((e) => OPP[e]);
}

/** 층 판정에 필요한 타일 정보 */
export interface LevelCell {
  /** 걸을 수 있는 타일인가(물·건물·절벽은 false) */
  walkable: boolean;
  level: number;
  stair?: RegionStair | undefined;
}

/**
 * 타일이 `edge` 변에서 보이는 층. 계단이면 변에 따라 from/to, 옆벽이면 null(막힘).
 */
export function levelAtEdge(cell: LevelCell, edge: TileEdge): number | null {
  if (!cell.walkable) return null;
  const st = cell.stair;
  if (!st) return cell.level;
  if (stairHighEdges(st.dir).includes(edge)) return st.to;
  if (stairLowEdges(st.dir).includes(edge)) return st.from;
  return null;
}

/**
 * `a`에서 `edge` 방향의 이웃 `b`로 한 칸 옮길 수 있는가.
 * 두 타일이 공유 변에서 보는 층이 같아야 한다 — 평지끼리는 같은 층, 계단은 변마다 다른 층을 낸다.
 * 대칭이다(`canStep(a, b, e) === canStep(b, a, opp(e))`).
 */
export function canStep(a: LevelCell, b: LevelCell, edge: TileEdge, opts?: StepOptions): boolean {
  const la = levelAtEdge(a, edge);
  if (la === null) return false;
  const lb = levelAtEdge(b, OPP[edge]);
  if (lb === null) return false;
  if (la === lb) return true;
  // 계단 없는 단차 — 기본은 못 넘는다. 사다리 같은 장비가 생기면 `climbLevels`로 열어 준다(사용자 2026-09-28:
  // "특정 장비가 없는 한 이동하지 못하도록 … 나중에 사다리 같은 장비가 있다면"). 계단 타일 자체는 넘지 않는다.
  const climb = opts?.climbLevels ?? 0;
  if (climb <= 0 || a.stair || b.stair) return false;
  return Math.abs(la - lb) <= climb;
}

/** 이동 판정 옵션 — 장비 게이트 자리(기본 = 계단으로만) */
export interface StepOptions {
  /** 계단 없이 넘을 수 있는 최대 단차(층 수). 0 = 불가(기본). 사다리류 장비가 생기면 1로 연다 */
  climbLevels?: number;
}

/** 단차 변의 종류 — 렌더가 옆면/그림자/계단을 고를 때 쓴다 */
export type LevelSeam = 'none' | 'cliff' | 'stair';

/**
 * `a`의 `edge` 변이 이웃 `b`와 어떤 관계인가.
 *  - `stair` 한쪽이 계단이고 그 변으로 이어진다
 *  - `cliff` 층이 달라 넘을 수 없다(또는 계단 옆벽)
 *  - `none`  같은 층 · 물/건물 등 통상 경계
 */
export function levelSeam(a: LevelCell, b: LevelCell, edge: TileEdge): LevelSeam {
  if (a.stair || b.stair) {
    return canStep(a, b, edge) ? 'stair' : (a.walkable && b.walkable ? 'cliff' : 'none');
  }
  if (!a.walkable || !b.walkable) return 'none';
  return a.level === b.level ? 'none' : 'cliff';
}
