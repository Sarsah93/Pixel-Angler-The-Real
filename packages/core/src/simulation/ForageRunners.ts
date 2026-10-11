/**
 * @file ForageRunners.ts
 * @description 달아나는 채집 생물(쫄장게 · 갯강구 · 게)의 **멀티 공용 움직임** — 235차
 *
 * 224차의 러너는 `Math.random`으로 어슬렁거리고 **내 캐릭터에게만** 놀랐다. 그래서 같은 세션의
 * 두 사람이 같은 녀석을 서로 다른 칸에서 보았다(231차 감사 ③-1). 이 모듈은 움직임을 둘로 나눈다.
 *
 *  1. **어슬렁(roam)** — 사람이 손대지 않는 움직임. 공용 시계 + 시드만으로 정해진다.
 *     같은 앵커(출발 칸 · 출발 시각 · 갈래)에서 출발하면 모두가 같은 시각에 같은 칸을 본다.
 *     이웃 칸 고르기는 **정적 스팟만** 피한다(다른 러너 위치는 사람마다 달라질 수 있어 쓰지 않는다).
 *  2. **도망(flee)** — 누군가 놀라게 한 순간. 놀라게 한 사람이 도착 칸을 정해 **공유 소비 채널**
 *     (`r:<맵>|<스팟>|<n번째>`, 먼저 쓴 사람이 임자)에 적는다. 나머지는 그 기록을 받아 같은 칸으로 튄다.
 *     도망 뒤 어슬렁은 그 도착 칸 · 시각을 새 앵커로 다시 시작한다.
 *
 * 순수 TS — 렌더 · 브라우저 API 없음.
 */

/** 어슬렁 한 걸음 사이 간격 (ms) — 224차 `2000 + random*3500`과 같은 범위 */
export const RUNNER_STEP_MIN_MS = 2000;
export const RUNNER_STEP_SPAN_MS = 3500;
/** 한 번 계산에서 따라잡는 걸음 상한 — 슬롯(30분) 한가운데 들어와도 넉넉하다 */
const MAX_STEPS_PER_ADVANCE = 4000;

/** 어슬렁의 출발점. 슬롯 시작 칸, 또는 마지막 도망의 도착 칸 */
export interface RunnerAnchor {
  tx: number;
  ty: number;
  /** 이 칸에 선 공용 시각(ms) */
  atMs: number;
  /** 갈래 키 — `시드|스팟|도망 번호`. 같은 갈래 = 같은 걸음 순서 */
  epoch: string;
}

/** 어슬렁 계산 커서(캐시) — 앵커에서 몇 걸음, 어느 칸까지 왔는가 */
export interface RunnerCursor {
  epoch: string;
  /** 지금까지 디딘 걸음 수 */
  k: number;
  /** k번째 걸음을 디딘 공용 시각 */
  tAcc: number;
  tx: number;
  ty: number;
}

/** 문자열 → 32비트 해시 (FNV-1a) */
export function runnerHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** (갈래 해시, 걸음 번호, 소금) → 0 이상 2^32 미만 정수. 순서만 같으면 어느 컴퓨터에서나 같다 */
function mix(h: number, k: number, salt: number): number {
  let t = (h ^ Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(salt, 0x85ebca6b)) >>> 0;
  t = Math.imul(t ^ (t >>> 16), 0x7feb352d);
  t = Math.imul(t ^ (t >>> 15), 0x846ca68b);
  return (t ^ (t >>> 16)) >>> 0;
}

/** k번째 걸음까지의 간격 (ms) */
export function runnerStepIntervalMs(epochHash: number, k: number): number {
  return RUNNER_STEP_MIN_MS + (mix(epochHash, k, 1) % RUNNER_STEP_SPAN_MS);
}

/**
 * 앵커에서 `nowMs`까지 어슬렁을 굴린다. `prev`가 같은 갈래면 거기서 이어서 센다(매 프레임 비용 ↓).
 * @param neighbors (tx,ty) 칸에서 갈 수 있는 이웃 칸들 — **호출 쪽이 정렬된 순서로** 준다(사람마다 같은 순서)
 */
export function advanceRunner(
  anchor: RunnerAnchor,
  prev: RunnerCursor | null,
  nowMs: number,
  neighbors: (tx: number, ty: number) => { tx: number; ty: number }[],
): RunnerCursor {
  const h = runnerHash(anchor.epoch);
  let cur: RunnerCursor = prev && prev.epoch === anchor.epoch && prev.tAcc <= nowMs
    ? { ...prev }
    : { epoch: anchor.epoch, k: 0, tAcc: anchor.atMs, tx: anchor.tx, ty: anchor.ty };
  if (nowMs <= cur.tAcc) return cur;
  for (let n = 0; n < MAX_STEPS_PER_ADVANCE; n++) {
    const iv = runnerStepIntervalMs(h, cur.k);
    if (cur.tAcc + iv > nowMs) break;
    const opts = neighbors(cur.tx, cur.ty);
    cur = { ...cur, k: cur.k + 1, tAcc: cur.tAcc + iv };
    if (opts.length > 0) {
      const pick = opts[mix(h, cur.k, 2) % opts.length]!;
      cur.tx = pick.tx; cur.ty = pick.ty;
    }
  }
  return cur;
}

/** 도망 기록 값 — 공유 채널 `val`(≤160자) */
export interface RunnerFlee { tx: number; ty: number; atMs: number }

export function encodeRunnerFlee(f: RunnerFlee): string {
  return `${Math.round(f.tx)},${Math.round(f.ty)},${Math.round(f.atMs)}`;
}

export function decodeRunnerFlee(val: string | undefined): RunnerFlee | null {
  if (!val) return null;
  const p = val.split(',').map((x) => Number(x));
  if (p.length !== 3 || p.some((x) => !Number.isFinite(x))) return null;
  return { tx: p[0]!, ty: p[1]!, atMs: p[2]! };
}

/** 도망 기록 키 — n = 1, 2 (몇 번째 도망인가) */
export function runnerFleeKey(mapKey: string, spotId: string, n: number): string {
  return `r:${mapKey}|${spotId}|${n}`;
}

/** n번째 도망 뒤 어슬렁의 갈래 키 */
export function runnerEpoch(seed: number, spotId: string, fleeN: number): string {
  return `${seed}|${spotId}|${fleeN}`;
}
