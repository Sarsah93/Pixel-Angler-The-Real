/**
 * @file LoinStages.ts
 * @description 317차 — **4덩어리 해체**(참다랑어 · 대방어급) 손질 스테이지 · 덩어리 배치 기하.
 *
 * 사용자 지시(315 「잿방어, 방어(특히나 대방어, 특대방어 급 이상) 또한 참다랑어처럼 해체 공정(4개의 덩어리로 해체하는)으로」 →
 * 317 「참다랑어 · 대방어급 4덩어리 해체 진행해줘」). 실제 공정(오로시 — 고반오로시):
 *  1. 앞부분은 방어류 흐름 그대로 — 시메 · 방혈 → 머리(+ 가마) · 지느러미 · 비늘 → 개복 · 내장 → 핏줄 → 세척
 *  2. **1면**(머리 왼쪽 · BASE): 옆줄 칼집(척추까지) → 등 가장자리로 칼을 넣어 **등살** 떼기 → 배 가장자리로 **뱃살** 떼기
 *  3. **2면**(뒤집어 · FLIP): 같은 순서 — 덩어리 넷 + 중골(뼈대)
 *  4. **중골 살 긁기**(숟가락 — 뼈 사이 살 = 나카오치)
 *  5. **덩어리 다듬기**(자유 순서 — 덩어리마다): 혈합육(옆줄 자리 검붉은 살) 떼기 → 껍질 벗기기 → 사쿠 나누기
 *
 * 측면 유도선은 client가 어종 그림 실루엣에서 굽는다(`LoinSideGeometry` — 장어처럼 그림과 같은 윤곽). 여기 기본값은
 * 잿방어 대표 그림 근사(시험 · 그림 없는 경우). 다듬기 단계는 덩어리 넷을 도마에 늘어놓은 뷰(FLESH_UP)이고
 * 배치 · 모양(`LOIN_BLOCKS` · `loinBlockEdges`)을 client 렌더러와 이 파일이 함께 쓴다 — 그림과 선이 한 식이다.
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { ButcheryStage, CutPoint, CutSpec, LoinPart, LoinSide, LoinSideGeometry, LoinSideLines } from '../types/Butchery.js';

/** 해체 갈래가 방어류 흐름에서 그대로 가져오는 앞 단계(꼬리 칼집 · 장뜨기 · 갈빗대 · 지아이 · 박피는 해체가 대신한다) */
export const LOIN_FRONT_STAGE_IDS: ReadonlySet<string> = new Set([
  'ikejime', 'bleed_cut', 'bleed_ice', 'scale_base', 'scale_flip', 'scale_wash',
  'head_base', 'head_flip', 'finectomy', 'gut_open', 'gut_scoop', 'vessel_scrub', 'gut_wash',
]);

/**
 * 측면 기본 유도선 — 잿방어 대표 그림(`FISH_WHOLE_AMBERJACK`)의 도마 틀 근사(1면 · BASE).
 * 지느러미 밑동 실측선(방어류 `GUIDE_COORDS.amberjack.finectomy` 등 · 배)과 머리 절단선 · 꼬리 칼집 사이 몸통에서 잡았다.
 */
const DEFAULT_SIDE_A: LoinSideLines = {
  mid: [
    { x: 0.31, y: 0.478 }, { x: 0.40, y: 0.492 }, { x: 0.48, y: 0.506 }, { x: 0.56, y: 0.522 },
    { x: 0.63, y: 0.535 }, { x: 0.69, y: 0.546 }, { x: 0.745, y: 0.552 },
  ],
  back: [
    { x: 0.31, y: 0.250 }, { x: 0.40, y: 0.262 }, { x: 0.48, y: 0.290 }, { x: 0.56, y: 0.336 },
    { x: 0.63, y: 0.385 }, { x: 0.69, y: 0.440 }, { x: 0.745, y: 0.512 },
  ],
  belly: [
    { x: 0.31, y: 0.770 }, { x: 0.40, y: 0.786 }, { x: 0.48, y: 0.774 }, { x: 0.56, y: 0.752 },
    { x: 0.63, y: 0.722 }, { x: 0.69, y: 0.680 }, { x: 0.745, y: 0.610 },
  ],
};
const DEFAULT_NAKAOCHI_A: CutPoint[] = [
  { x: 0.33, y: 0.30 }, { x: 0.37, y: 0.72 }, { x: 0.43, y: 0.31 }, { x: 0.49, y: 0.71 },
  { x: 0.55, y: 0.36 }, { x: 0.61, y: 0.67 }, { x: 0.67, y: 0.42 }, { x: 0.72, y: 0.60 },
];

const mirrorPath = (p: CutPoint[]): CutPoint[] => p.map((q) => ({ x: Math.round((1 - q.x) * 1e4) / 1e4, y: q.y }));
/** 1면 선 → 2면(좌우 뒤집힌 그림) 선 — 칼을 넣는 쪽(머리 → 꼬리)도 함께 뒤집힌다 */
export function mirrorLoinLines(l: LoinSideLines): LoinSideLines {
  return { mid: mirrorPath(l.mid), back: mirrorPath(l.back), belly: mirrorPath(l.belly) };
}

/** core 기본 측면 기하(잿방어 대표 그림 근사) */
export function defaultLoinSideGeometry(): LoinSideGeometry {
  return { a: DEFAULT_SIDE_A, b: mirrorLoinLines(DEFAULT_SIDE_A), nakaochi: mirrorPath(DEFAULT_NAKAOCHI_A) };
}

// ────────────────────────────────────────────────────────────
// 덩어리 넷 — 다듬기 뷰(FLESH_UP) 배치 · 모양
// ────────────────────────────────────────────────────────────

/** 덩어리 하나 — 다듬기 작업 순서(1면 등살 · 1면 뱃살 · 2면 등살 · 2면 뱃살)와 같은 번호 */
export interface LoinBlockDef {
  /** 0~3 */
  index: number;
  side: LoinSide;
  part: LoinPart;
  /** 화면 이름 */
  labelKo: string;
  /** 도마 생선 틀 정규화 자리 — 덩어리는 꼬리 왼쪽 · 머리(두꺼운 끝) 오른쪽 */
  slot: { x: number; y: number; w: number; h: number };
}

export const LOIN_BLOCKS: readonly LoinBlockDef[] = [
  { index: 0, side: 'a', part: 'back', labelKo: '등살 (1면)', slot: { x: 0.04, y: 0.05, w: 0.44, h: 0.42 } },
  { index: 1, side: 'a', part: 'belly', labelKo: '뱃살 (1면)', slot: { x: 0.04, y: 0.53, w: 0.44, h: 0.42 } },
  { index: 2, side: 'b', part: 'back', labelKo: '등살 (2면)', slot: { x: 0.52, y: 0.05, w: 0.44, h: 0.42 } },
  { index: 3, side: 'b', part: 'belly', labelKo: '뱃살 (2면)', slot: { x: 0.52, y: 0.53, w: 0.44, h: 0.42 } },
];

/** 면 · 부위 → 덩어리 번호 */
export function loinBlockIndex(side: LoinSide, part: LoinPart): number {
  return (side === 'a' ? 0 : 2) + (part === 'back' ? 0 : 1);
}

/**
 * 덩어리 모양(자리 안 세로 0~1) — u = 꼬리(0) → 머리 쪽 절단면(1).
 *  - 두께는 꼬리에서 가늘고 앞쪽 2/3부터 두껍다(로인 단면).
 *  - 등살 = 위 가장자리 껍질 · 아래 가장자리 혈합육(옆줄 자리) / 뱃살 = 위 혈합육 · 아래 껍질.
 *  - 혈합육은 가운데가 두껍다(실제 지아이 단면).
 */
export interface LoinBlockEdges { top: number; bot: number; skin: number; chiai: number }
export function loinBlockEdges(part: LoinPart, u: number): LoinBlockEdges {
  const uu = Math.max(0, Math.min(1, u));
  const H = 0.30 + 0.62 * Math.sin(Math.min(1, uu * 1.25) * Math.PI / 2);
  const top = 0.5 - H / 2, bot = 0.5 + H / 2;
  const chiaiT = (0.09 + 0.09 * Math.sin(Math.PI * uu)) * H;
  const skinT = 0.10 * H;
  return part === 'back'
    ? { top, bot, skin: top + skinT, chiai: bot - chiaiT }
    : { top, bot, skin: bot - skinT, chiai: top + chiaiT };
}

const U_SAMPLES = [0.06, 0.2, 0.34, 0.5, 0.66, 0.8, 0.94];
const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;
/** 덩어리 자리 안 (u, v) → 도마 생선 틀 정규화 */
export function loinBlockPoint(b: LoinBlockDef, u: number, v: number): CutPoint {
  return { x: r4(b.slot.x + u * b.slot.w), y: r4(b.slot.y + v * b.slot.h) };
}

/** 사쿠 나누기 선 u 위치(꼬리 → 머리) — 사쿠 n개면 n-1줄 */
export function loinSakuCuts(pieces: number): number[] {
  const n = Math.max(2, Math.round(pieces));
  return Array.from({ length: n - 1 }, (_, i) => r4((i + 1) / n));
}

/** 덩어리 하나의 다듬기 선 — 혈합육 경계 · 껍질 경계 · 사쿠 나누기(세로) */
export function loinBlockLines(index: number, sakuPieces: number): { chiai: CutPoint[]; skin: CutPoint[]; saku: CutPoint[][] } {
  const b = LOIN_BLOCKS[index];
  const chiai = U_SAMPLES.map((u) => loinBlockPoint(b, u, loinBlockEdges(b.part, u).chiai));
  const skin = U_SAMPLES.map((u) => loinBlockPoint(b, u, loinBlockEdges(b.part, u).skin));
  const saku = loinSakuCuts(sakuPieces).map((u) => {
    const e = loinBlockEdges(b.part, u);
    // 혈합육 · 껍질을 떼어 낸 살만 가로지른다(살 위아래로 조금씩 넘겨 긋는다)
    const a = Math.min(e.skin, e.chiai), z = Math.max(e.skin, e.chiai);
    return [loinBlockPoint(b, u, a - 0.03), loinBlockPoint(b, u, (a + z) / 2), loinBlockPoint(b, u, z + 0.03)];
  });
  return { chiai, skin, saku };
}

// ────────────────────────────────────────────────────────────
// 무게 · 값 나누기 (client 지급이 쓴다 — 원물 시세를 덩어리로 나눈다)
// ────────────────────────────────────────────────────────────

/** 덩어리 무게 몫(살 질량 = 무게 × 살수율 중) — 한 면의 등살 · 뱃살. 네 덩어리 합 = 1 */
export const LOIN_MASS_SHARE: Record<LoinPart, number> = { back: 0.27, belly: 0.23 };
/**
 * 덩어리 값 몫(원물 시세 중) — 네 덩어리 합 = 1. 참다랑어 뱃살은 토로라 더 비싸다.
 * 머리 · 가마 · 중골 살 같은 다른 몫은 따로 값을 매긴다(원물가 분할 철학 — 회 · 접시에서 값이 오른다).
 */
export function loinValueShare(speciesId: string, part: LoinPart): number {
  if (speciesId === 'bluefin_tuna') return part === 'back' ? 0.21 : 0.29;
  return part === 'back' ? 0.24 : 0.26;
}
/** 다듬기에서 떨어지는 몫(덩어리 무게 중) — 혈합육 · 껍질. 나머지가 사쿠 */
export const LOIN_TRIM_SHARE = { chiai: 0.06, skin: 0.07 } as const;
/** 사쿠 하나 목표 무게(g) — 회썰기 한 번(14 ~ 16점)에 알맞은 덩어리 */
export const LOIN_SAKU_TARGET_G = 400;
/** 덩어리 무게(g) → 사쿠 수(2 ~ 5 — 줄이 너무 많지 않게 상한) */
export function loinSakuPieces(blockG: number): number {
  const trimmed = Math.max(1, blockG) * (1 - LOIN_TRIM_SHARE.chiai - LOIN_TRIM_SHARE.skin);
  return Math.max(2, Math.min(5, Math.round(trimmed / LOIN_SAKU_TARGET_G)));
}

// ────────────────────────────────────────────────────────────
// 스테이지
// ────────────────────────────────────────────────────────────

export interface LoinStageOptions {
  /** 측면 유도선(어종 그림 실루엣) — 없으면 기본값 */
  side?: LoinSideGeometry;
  /** 덩어리마다 사쿠 수(번호 0~3) — 없으면 3 */
  sakuPieces?: number[];
}

function loinCut(id: string, ori: 'BASE' | 'FLIP' | 'FLESH_UP', path: CutPoint[], o: Partial<CutSpec> = {}): CutSpec {
  return {
    id, orientationRequired: ori, tool: 'knife', guidePath: path,
    tolerance: o.tolerance ?? 0.06, minCoverage: o.minCoverage ?? 0.6,
    strong: o.strong, guidePaths: o.guidePaths,
  };
}

/** 해체 스테이지(앞 단계 뒤에 붙는 것) — 1면 · 2면 해체 → 중골 살 → 덩어리 다듬기 넷 */
export function buildLoinTailStages(opts?: LoinStageOptions): ButcheryStage[] {
  const g = opts?.side ?? defaultLoinSideGeometry();
  const st: ButcheryStage[] = [];
  for (const side of ['a', 'b'] as const) {
    const ori = side === 'a' ? 'BASE' as const : 'FLIP' as const;
    const L = g[side];
    const n = side === 'a' ? '1면' : '2면';
    const flipNote = side === 'b' ? '뒤집어서 ' : '';
    st.push({
      id: `loin_${side}_mid`, label: `${n} — 옆줄 칼집`, orientation: ori, primitive: 'guided_cut',
      guide: `${flipNote}머리 쪽 절단면에서 꼬리자루까지 옆줄(몸통 한가운데)을 따라 척추에 닿게 칼집을 넣으세요`,
      cut: loinCut(`loin_${side}_mid`, ori, L.mid),
    });
    st.push({
      id: `loin_${side}_back`, label: `${n} — 등살 떼기`, orientation: ori, primitive: 'guided_cut',
      guide: '등 쪽 가장자리를 따라 칼을 넣고 척추 위로 눕혀 등살 덩어리를 떼어 내세요',
      cut: loinCut(`loin_${side}_back`, ori, L.back, { strong: true }),
      yieldsFillet: true,
    });
    st.push({
      id: `loin_${side}_belly`, label: `${n} — 뱃살 떼기`, orientation: ori, primitive: 'guided_cut',
      guide: '배 쪽 가장자리를 따라 칼을 넣고 갈빗대를 타고 올라가 뱃살 덩어리를 떼어 내세요',
      cut: loinCut(`loin_${side}_belly`, ori, L.belly, { strong: true }),
      yieldsFillet: true,
    });
  }
  st.push({
    id: 'loin_nakaochi', label: '중골 살 긁기', orientation: 'FLIP', primitive: 'scoop',
    guide: '숟가락으로 뼈 사이에 남은 살(중골 살)을 머리 쪽에서 꼬리 쪽으로 긁어 모으세요',
    fillTarget: 0.85, sweepPath: g.nakaochi,
  });
  for (const b of LOIN_BLOCKS) {
    const k = b.index + 1;
    const pieces = opts?.sakuPieces?.[b.index] ?? 3;
    const lines = loinBlockLines(b.index, pieces);
    st.push({
      id: `trim_${k}_chiai`, label: `${b.labelKo} — 혈합육 떼기`, orientation: 'FLESH_UP', primitive: 'guided_cut',
      guide: '옆줄 자리의 검붉은 혈합육을 살과의 경계를 따라 길게 잘라 내세요',
      cut: loinCut(`trim_${k}_chiai`, 'FLESH_UP', lines.chiai, { tolerance: 0.05 }),
    });
    st.push({
      id: `trim_${k}_skin`, label: `${b.labelKo} — 껍질 벗기기`, orientation: 'FLESH_UP', primitive: 'guided_cut',
      guide: '껍질과 살 사이에 칼을 눕혀 넣고 덩어리 끝까지 밀어 껍질을 벗기세요',
      cut: loinCut(`trim_${k}_skin`, 'FLESH_UP', lines.skin, { tolerance: 0.05 }),
    });
    st.push({
      id: `trim_${k}_saku`, label: `${b.labelKo} — 사쿠 나누기`, orientation: 'FLESH_UP', primitive: 'guided_cut',
      guide: lines.saku.length > 1
        ? `결을 가로질러 덩어리를 회 뜨기 좋은 크기로 나누세요 (${lines.saku.length}줄 · 순서 자유)`
        : '결을 가로질러 덩어리를 회 뜨기 좋은 크기로 나누세요',
      cut: loinCut(`trim_${k}_saku`, 'FLESH_UP', lines.saku[0], {
        tolerance: 0.07, minCoverage: 0.55, guidePaths: lines.saku.length > 1 ? lines.saku : undefined,
      }),
    });
  }
  return st;
}

/** 해체 단계 id인가(측면 해체 · 중골 · 다듬기) */
export function isLoinStageId(id: string | undefined): boolean {
  return !!id && (id.startsWith('loin_') || id.startsWith('trim_'));
}

/** 다듬기 단계 id → 덩어리 번호(0~3) — 아니면 -1 */
export function loinTrimBlockOf(id: string | undefined): number {
  const m = id ? /^trim_([1-4])_/.exec(id) : null;
  return m ? Number(m[1]) - 1 : -1;
}
