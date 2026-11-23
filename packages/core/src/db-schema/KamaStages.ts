/**
 * @file KamaStages.ts
 * @description 333차 — **가마살 공정**(방어류 · 다랑어류 · 새치류의 큰 개체 — `yieldsKama`) 기하 · 스테이지.
 *
 * 사용자 설명(실제 사진 다섯 장 · 2026-11-20): 「머리 아가미쪽 잘려진 부분(방혈 때 칼이 지나갔던 자리)과 머리따기 사선(머리 제거 작업 때
 * 잘랐던 자리) 사이의 살 덩어리」 = 가마살 부분(세모 덩이) → 「가마살 삼각형 덩어리에서 가슴 지느러미 바로 아래 부분의 넓은 삼각형 부분 …
 * (내장을 감쌌던 부분)만 도려내서 회로 먹어. 그게 가마살이야 … 한 쪽 당 2~3점씩」.
 *
 * 공정:
 *  1. 머리따기(앞면 · 뒷면 사선 — 가슴지느러미 **뒤**를 지난다) → 머리와 가마살 덩이가 함께 떨어진다
 *  2. **가마살 떼기**(`kama_a` 앞면 · `kama_b` 뒷면) — 떼어 낸 머리에서 위 끝 가로 칼집 → 아가미 선을 따라 배까지. 한 칼에 덩이 하나
 *  3. **가마살 도려내기**(`ktrim_1` · `ktrim_2` — 덩이 뷰) — 가슴지느러미 아래 넓은 세모(내장을 감쌌던 뱃살)만 도려낸다 = 횟감 가마살
 *
 * 선은 그 어종의 방혈 호(`bleed_cut`) · 머리따기 사선(`head_base` · `head_flip`) · 가슴지느러미 밑동 선(`finectomy`의 가파른 선)에서 굽는다 —
 * F9 [확정] 좌표를 끼운 뒤에 다시 굽는다(`ButcheryProcess.finalizeKamaStages`). 가마살 단계 자체를 [확정]하면 그 값이 먼저다.
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { ButcheryStage, CutPoint, CutSpec, KamaGeometry, KamaSideGeometry } from '../types/Butchery.js';

/** 도마 생선 틀의 가로 : 세로(client `FISH_W0` : `FISH_H0` = 560 : 210) — 「가파른 선」을 화면 기울기로 가릴 때 쓴다 */
export const BUTCHER_BOARD_ASPECT = 560 / 210;
/** 덩이 뷰 기본 배율(client가 그림 칸에 맞는 값을 넘긴다 — 칸이 정수 px로 떨어지게) */
export const KAMA_VIEW_SCALE_DEFAULT = 1.5;
/** 머리따기 사선이 가슴지느러미 밑동 아래 끝보다 이만큼 뒤(꼬리 쪽)를 지난다 */
const FIN_MARGIN = 0.014;
/**
 * 덩이 뷰에서 두 덩이가 놓이는 자리(도마 정규화 — [1면, 2면]). **1면이 오른쪽 · 2면이 왼쪽**이다 —
 * 덩이에 붙은 가슴지느러미가 꼬리 쪽(1면 = 오른쪽 · 2면 = 왼쪽)으로 뻗으므로, 이렇게 놓아야 두 지느러미가 바깥을 향해 서로 겹치지 않는다.
 */
export const KAMA_BLOCK_SLOTS: readonly CutPoint[] = [{ x: 0.66, y: 0.5 }, { x: 0.34, y: 0.5 }];

const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;
const pt = (x: number, y: number): CutPoint => ({ x: r4(x), y: r4(y) });
const mirror = (p: readonly CutPoint[]): CutPoint[] => p.map((q) => pt(1 - q.x, q.y));

/** 꺾은선의 y 자리 x(끝 너머는 끝 토막을 그대로 늘인다) */
export function pathXAtY(path: readonly CutPoint[], y: number): number {
  if (path.length === 0) return 0.5;
  if (path.length === 1) return path[0].x;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    if ((y >= a.y && y <= b.y) || (y <= a.y && y >= b.y)) {
      const dy = b.y - a.y;
      return Math.abs(dy) < 1e-6 ? a.x : a.x + (b.x - a.x) * (y - a.y) / dy;
    }
  }
  // 끝 너머 — y에 가까운 쪽 끝 토막
  const first = path[0], last = path[path.length - 1];
  const useFirst = Math.abs(y - first.y) < Math.abs(y - last.y);
  const a = useFirst ? path[1] : path[path.length - 2], b = useFirst ? first : last;
  const dy = b.y - a.y;
  return Math.abs(dy) < 1e-6 ? b.x : b.x + (b.x - a.x) * (y - b.y) / dy;
}

/** 위 → 아래(y 오름) 차례로 */
const topDown = (p: readonly CutPoint[]): CutPoint[] => (p.length >= 2 && p[0].y > p[p.length - 1].y ? [...p].reverse() : [...p]);

/**
 * 지느러미 칼선들 가운데 **가슴지느러미 밑동 선**(짧고 가파르다 — 아가미 뒤를 위아래로) — 없으면 undefined.
 * 등 · 배 선은 몸을 따라 가로로 길다(화면에서 가로 폭이 세로 폭의 1.5배를 넘는다 — client `finLineSide`와 같은 잣대).
 */
export function pectoralLineOf(paths: readonly (readonly CutPoint[])[] | undefined): CutPoint[] | undefined {
  let best: CutPoint[] | undefined, bestK = Infinity;
  for (const p of paths ?? []) {
    if (p.length < 2) continue;
    const xs = p.map((q) => q.x), ys = p.map((q) => q.y);
    const sx = (Math.max(...xs) - Math.min(...xs)) * BUTCHER_BOARD_ASPECT, sy = Math.max(...ys) - Math.min(...ys);
    if (sy < 1e-4 || sx >= sy * 1.5) continue;
    const k = sx / sy;
    if (k < bestK) { bestK = k; best = p.map((q) => ({ x: q.x, y: q.y })); }
  }
  return best;
}

/**
 * **머리따기 사선을 가슴지느러미 뒤로** — 사선의 위 끝은 그대로 두고, 가슴지느러미 밑동 아래 끝보다 조금 뒤(꼬리 쪽)를 지나게 눕힌다.
 * 이미 지느러미 뒤를 지나면 그대로다. 가슴지느러미 선이 없으면 아래 끝을 정해진 만큼 민다.
 * @param headLeft 그 면에서 머리가 왼쪽인가(1면 = true · 2면 = false) — 「뒤」의 방향
 */
export function kamaHeadLine(head: readonly CutPoint[], pectoral: readonly CutPoint[] | undefined, headLeft: boolean): CutPoint[] {
  const h = topDown(head);
  if (h.length < 2) return h;
  const s = headLeft ? 1 : -1;
  const top = h[0], bot = h[h.length - 1];
  if (!pectoral || pectoral.length < 2) {
    return [pt(top.x, top.y), pt(bot.x + s * 0.055, bot.y)];
  }
  const pb = pectoral.reduce((a, b) => (b.y > a.y ? b : a));
  const qx = pb.x + s * FIN_MARGIN;
  if (s * (pathXAtY(h, pb.y) - qx) >= 0) return h.map((q) => pt(q.x, q.y));   // 이미 지느러미 뒤
  const dy = pb.y - top.y;
  if (dy < 0.02) return h.map((q) => pt(q.x, q.y));
  const k = (qx - top.x) / dy;
  return [pt(top.x, top.y), pt(top.x + k * (bot.y - top.y), bot.y)];
}

/**
 * 가마살 한 면의 기하.
 * @param arc 아가미 선(그 면의 화면 좌표 — 위 → 아래)
 * @param head 머리따기 사선(그 면)
 * @param pectoral 가슴지느러미 밑동 선(그 면 — 없으면 덩이 높이 비율로 도려내는 선을 잡는다)
 */
export function kamaSideGeometry(
  arc: readonly CutPoint[], head: readonly CutPoint[], pectoral: readonly CutPoint[] | undefined, headLeft: boolean,
): KamaSideGeometry {
  const s = headLeft ? 1 : -1;
  const A = topDown(arc), Hd = topDown(head);
  const t1 = A[0], last = A[A.length - 1];
  // 위 끝 가로 칼집 — 사선 위의 같은 높이 점(사선이 아가미 선보다 앞이면 조금 뒤로 잡는다)
  let t2x = pathXAtY(Hd, t1.y);
  if (s * (t2x - t1.x) < 0.012) t2x = t1.x + s * 0.012;
  const t2 = pt(t2x, t1.y);
  const cut = [t2, ...A.map((q) => pt(q.x, q.y))];
  // 덩이 다각형 — 아가미 선 아래 끝에서 **곧게 아래로** 몸 밖까지 내리고, 사선의 몸 밖 점으로 닫는다.
  //  (끝 토막 방향대로 늘이면 아가미 선이 턱 쪽으로 휜 어종 — 새치류 — 에서 아래턱 · 주둥이 밑까지 덩이에 들어간다)
  const yOut = 1.35;
  const ext = pt(last.x, yOut);
  const poly = [...cut, ext, pt(pathXAtY(Hd, yOut), yOut)];
  // 도려내는 선 — 가슴지느러미 아래(밑동 선이 있으면 그 아래 끝 높이 · 없으면 덩이 높이의 55%)
  const yTop = t1.y, yBot = last.y, hgt = Math.max(0.05, yBot - yTop);
  let yA: number, yB: number;
  if (pectoral && pectoral.length >= 2) {
    const ys = pectoral.map((q) => q.y), pt0 = Math.min(...ys), pb0 = Math.max(...ys);
    yA = pt0 + 0.6 * (pb0 - pt0); yB = pb0 + 0.025;
  } else { yA = yTop + 0.55 * hgt; yB = yA + 0.07; }
  yA = Math.max(yTop + 0.25 * hgt, Math.min(yBot - 0.07, yA));
  yB = Math.max(yA, Math.min(yBot + 0.04, yB));
  const a = { x: pathXAtY(A, yA), y: yA }, b = { x: pathXAtY(Hd, yB), y: yB };
  const carve = [pt(a.x, a.y), pt((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.008), pt(b.x, b.y)];
  // 덩이 가운데 — 칼길과 사선의 배 쪽 점으로 잡은 상자
  const yLow = yBot + 0.06;
  const box = [...cut, { x: pathXAtY(Hd, yLow), y: yLow }];
  const xs = box.map((q) => q.x), ys2 = box.map((q) => q.y);
  const center = pt((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys2) + Math.max(...ys2)) / 2);
  const half = pt((Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys2) - Math.min(...ys2)) / 2);
  return { cut, poly, carve, center, half };
}

/** 덩이 뷰에서 덩이 하나가 차지해도 되는 너비 · 높이(도마 정규화 — 두 덩이가 겹치지 않고 도마 안에 든다) */
const KAMA_VIEW_MAX_W = 0.3, KAMA_VIEW_MAX_H = 0.9;
/**
 * 덩이 뷰 배율 고르기 — 후보(큰 것부터) 가운데 두 덩이가 모두 자리에 드는 가장 큰 값. 하나도 안 들면 가장 작은 후보.
 * 후보가 수 하나면 그 값 그대로다.
 */
export function pickKamaViewScale(a: KamaSideGeometry, b: KamaSideGeometry, candidates: number | readonly number[]): number {
  if (typeof candidates === 'number') return candidates;
  const list = [...candidates].filter((v) => v > 0).sort((x, y) => y - x);
  if (!list.length) return KAMA_VIEW_SCALE_DEFAULT;
  const w = 2 * Math.max(a.half.x, b.half.x), h = 2 * Math.max(a.half.y, b.half.y);
  return list.find((s) => w * s <= KAMA_VIEW_MAX_W && h * s <= KAMA_VIEW_MAX_H) ?? list[list.length - 1];
}

/**
 * 가마살 두 면의 기하 — 1면은 방혈 호 · 앞면 사선 그대로, 2면은 방혈 호 · 가슴지느러미 선을 좌우로 뒤집고 뒷면 사선을 쓴다
 * (도마의 생선 그림은 가로 가운데 놓여 2면에서 좌우 대칭이다).
 */
export function kamaGeometry(
  arc: readonly CutPoint[], headA: readonly CutPoint[], headB: readonly CutPoint[],
  pectoral: readonly CutPoint[] | undefined, viewScale: number | readonly number[] = KAMA_VIEW_SCALE_DEFAULT,
): KamaGeometry {
  const a = kamaSideGeometry(arc, headA, pectoral, true);
  const b = kamaSideGeometry(mirror(arc), headB, pectoral ? mirror(pectoral) : undefined, false);
  return {
    a, b, viewScale: pickKamaViewScale(a, b, viewScale),
    viewScales: typeof viewScale === 'number' ? undefined : [...viewScale],
  };
}

/** 덩이 뷰로 옮기기 — 원래 자리 점 → 그 면 덩이 자리(가운데 기준 같은 배율 — 화면 종횡비가 지켜진다) */
export function kamaBlockPoint(geo: KamaGeometry, side: 'a' | 'b', p: CutPoint): CutPoint {
  const g = geo[side], slot = KAMA_BLOCK_SLOTS[side === 'a' ? 0 : 1];
  return pt(slot.x + (p.x - g.center.x) * geo.viewScale, slot.y + (p.y - g.center.y) * geo.viewScale);
}
/** 덩이 뷰의 도려내는 선 */
export function kamaCarveView(geo: KamaGeometry, side: 'a' | 'b'): CutPoint[] {
  return geo[side].carve.map((p) => kamaBlockPoint(geo, side, p));
}

function kamaCut(id: string, ori: 'BASE' | 'FLIP' | 'FLESH_UP', path: CutPoint[], o: Partial<CutSpec> = {}): CutSpec {
  return {
    id, orientationRequired: ori, tool: 'knife', guidePath: path,
    tolerance: o.tolerance ?? 0.07, minCoverage: o.minCoverage ?? 0.55, strong: o.strong,
  };
}

/** 가마살 떼기 두 단계(머리따기 뒤에 붙는다) */
export function buildKamaCutStages(geo: KamaGeometry): ButcheryStage[] {
  return [
    {
      id: 'kama_a', label: '가마살 떼기 (앞면)', orientation: 'BASE', primitive: 'guided_cut',
      guide: '떼어 낸 머리에서 — 위 끝을 가로로 끊고 아가미 선을 따라 배까지 내려 그어 가마살 덩이를 떼어 내세요',
      cut: kamaCut('kama_a', 'BASE', geo.a.cut), kamaGeometry: geo,
    },
    {
      id: 'kama_b', label: '가마살 떼기 (뒷면)', orientation: 'FLIP', primitive: 'guided_cut',
      guide: '뒤집어 반대쪽 가마살 덩이도 같은 칼길로 떼어 내세요',
      cut: kamaCut('kama_b', 'FLIP', geo.b.cut, { strong: true }), kamaGeometry: geo,
    },
  ];
}
/** 가마살 도려내기 두 단계(덩이 뷰 — 다듬기 구간) */
export function buildKamaTrimStages(geo: KamaGeometry): ButcheryStage[] {
  return (['a', 'b'] as const).map((sd, i) => ({
    id: `ktrim_${i + 1}`, label: `가마살 (${i + 1}면) — 도려내기`, orientation: 'FLESH_UP' as const, primitive: 'guided_cut' as const,
    guide: '가슴지느러미 바로 아래를 가로질러 그어, 내장을 감싸던 넓은 뱃살 쪽만 도려내세요',
    cut: kamaCut(`ktrim_${i + 1}`, 'FLESH_UP', kamaCarveView(geo, sd), { tolerance: 0.06 }), kamaGeometry: geo,
  }));
}

/** 가마살 단계 id인가 */
export function isKamaStageId(id: string | undefined): boolean {
  return !!id && (id === 'kama_a' || id === 'kama_b' || id.startsWith('ktrim_'));
}
/** 도려내기 단계 id → 면('a' | 'b') — 아니면 null */
export function kamaTrimSideOf(id: string | undefined): 'a' | 'b' | null {
  return id === 'ktrim_1' ? 'a' : id === 'ktrim_2' ? 'b' : null;
}

/** 횟감 가마살의 몫(가마살 덩이 무게 중 — 가슴지느러미 아래 뱃살) · 한 면에서 나오는 점 수(2 ~ 3) */
export const KAMA_MEAT_SHARE = 0.4;
/** 횟감 한 조각이 이 무게(g) 이상이면 3점, 아니면 2점 */
export const KAMA_THREE_PIECE_MIN_G = 45;
export function kamaPieceCount(meatG: number): number {
  return meatG >= KAMA_THREE_PIECE_MIN_G ? 3 : 2;
}
