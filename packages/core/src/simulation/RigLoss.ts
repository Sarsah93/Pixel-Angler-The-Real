/**
 * @file RigLoss.ts
 * @description 채비 손실 계획 — 채비 트리(192차)의 **어느 아래가 떨어져 나갔는가**로 잃는 것을 정한다 (206차).
 *
 * 그전에는 평면 9칸(투영값)의 이름 목록으로 잃었고, 트리와 어긋나 이런 일이 있었다(206차 감사 — 워크로그 206):
 *  - 목줄 칸을 먼저 비우면 그 아래 루어 칸이 함께 풀려, 뒤이은 루어 손실이 **아무것도 잃지 않았다**(루어 무손실).
 *  - 목줄은 150~200m 스풀인데 터질 때마다 **스풀째** 사라졌다.
 *  - 원줄에 꿴 유동 봉돌(도래 위)이 「도래 아래 손실」에도 사라졌다.
 *  - 묶음추·카드 채비의 「바늘과 미끼를 잃었다」가 미끼 하나만 잃었고, 다른 바늘 미끼는 공짜로 가방에 돌아왔다.
 *  - 타이라바 바늘 2개 중 하나만 잃었다.
 *  - 남은 재고가 있어도 잃은 칸을 비워 매번 다시 채비해야 했다.
 *
 * 규칙(원인 → 떨어져 나가는 범위):
 *  - `bait_lost` — 걸린 바늘(없으면 맨 아래 미끼 칸)의 미끼.
 *  - `hook_bait_lost` — 끝채비: 단품 바늘이면 바늘 + 그 미끼 + 좁쌀봉돌 / 타이라바는 바늘 전부 + 미끼 /
 *    묶음추·카드 채비는 **한 벌 전부**(바늘이 고정이라 가지 하나가 뜯기면 버린다) / 루어는 루어(+지그헤드).
 *  - `below_swivel` · `line_break_leader` · `cutter` — 도래(없으면 매듭) 아래 전부. 목줄은 묶는 길이만 잘린다.
 *  - `all_lost` · `line_break_main` — 원줄 부속(찌·수중찌·구슬·쿠션·유동 봉돌)부터 아래 전부 + 원줄 일부.
 *
 * 순수 TS — 렌더/브라우저 API 없음. 적용(가방 차감 · 칸 재장착)은 client `InventoryStore.applyRigLoss`.
 */

import type { RigNode, RigTreeState } from './RigTree.js';
import { descendantsOf } from './RigTree.js';
import type { RigLossCause, RigLossPlan, RigLossScope } from '../types/RigLoss.js';

export interface RigLossOpts {
  /** 입질·밑걸림이 걸린 미끼 칸(없으면 맨 아래 미끼 칸) */
  snaggedBaitIdx?: number | null;
  /** 미끼 칸 하나가 쓰는 미끼 수(한 바늘 두 미끼 = 2) */
  baitUse?: (node: RigNode) => number;
  /** 목줄이 터질 때 잘려 나가는 길이(m) */
  leaderCutM: number;
  /** 원줄이 터질 때 잘려 나가는 길이(m) */
  mainLineCutM: number;
}

const LINE_SLOTS = new Set(['main_line', 'leader']);

/** 맨 아래(마지막) 미끼 칸 */
function lastFilledBait(nodes: RigNode[]): number {
  for (let i = nodes.length - 1; i >= 0; i--) if (nodes[i].slot === 'bait' && nodes[i].itemId) return i;
  return -1;
}

/** 잃는 칸 목록 → 계획 */
function planOf(nodes: RigNode[], idxs: Iterable<number>, scope: RigLossScope, o: RigLossOpts): RigLossPlan {
  const plan: RigLossPlan = { scope, items: [], lines: [] };
  const seen = new Set<number>();
  for (const i of idxs) {
    if (seen.has(i)) continue;
    seen.add(i);
    const n = nodes[i];
    if (!n?.itemId) continue;
    if (LINE_SLOTS.has(n.slot)) {
      plan.lines.push({ nodeIdx: i, itemId: n.itemId, meters: n.slot === 'leader' ? o.leaderCutM : o.mainLineCutM });
    } else if (n.slot === 'bait') {
      plan.items.push({ nodeIdx: i, itemId: n.itemId, qty: Math.max(1, o.baitUse?.(n) ?? 1), bait: true });
    } else {
      plan.items.push({ nodeIdx: i, itemId: n.itemId, qty: 1 });
    }
  }
  if (plan.items.length === 0 && plan.lines.length === 0) plan.scope = 'none';
  return plan;
}

/** 끝채비(바늘 쪽) — 세트 종류에 따라 */
function terminalLoss(nodes: RigNode[], o: RigLossOpts): RigLossPlan {
  const kitIdx = nodes.findIndex((n) => n.slot === 'kit_kind');
  const kit = kitIdx >= 0 ? nodes[kitIdx].choice : undefined;
  if (kitIdx >= 0 && (kit === 'lure_hard' || kit === 'lure_soft')) {
    return planOf(nodes, descendantsOf(nodes, kitIdx), 'lure', o);
  }
  if (kitIdx >= 0 && (kit === 'bundle_sinker' || kit === 'card_rig')) {
    return planOf(nodes, descendantsOf(nodes, kitIdx), 'kit', o);
  }
  // 바늘 칸(단품 · 타이라바 · T자 편대) — 바늘 전부 + 그 미끼 + 같은 목줄 끝의 좁쌀봉돌
  const out: number[] = [];
  nodes.forEach((n, i) => {
    if (n.slot !== 'hook' || !n.itemId) return;
    out.push(i, ...descendantsOf(nodes, i));
    if (n.parent >= 0) nodes.forEach((m, j) => { if (m.parent === n.parent && m.slot === 'split_shot') out.push(j); });
  });
  if (out.length) return planOf(nodes, out, 'hook', o);
  // 바늘 칸이 없으면(고정 바늘만) 미끼라도
  const b = lastFilledBait(nodes);
  return planOf(nodes, b >= 0 ? [b] : [], 'bait', o);
}

/** 도래(없으면 매듭) 아래 전부 */
function belowSwivel(nodes: RigNode[], o: RigLossOpts): RigLossPlan {
  const sw = nodes.findIndex((n) => n.slot === 'swivel' && !!n.itemId);
  const knot = nodes.findIndex((n) => n.slot === 'knot');
  const anchor = sw >= 0 ? sw : knot;
  if (anchor < 0) return terminalLoss(nodes, o);
  return planOf(nodes, descendantsOf(nodes, anchor), 'below_swivel', o);
}

/** 원줄 부속부터 아래 전부 + 원줄 일부 */
function allBelowMainLine(nodes: RigNode[], o: RigLossOpts): RigLossPlan {
  const main = nodes.findIndex((n) => n.slot === 'main_line');
  if (main < 0) return planOf(nodes, [], 'none', o);
  return planOf(nodes, [main, ...descendantsOf(nodes, main)], 'all', o);
}

/** 원인 → 손실 계획 */
export function planRigLoss(state: RigTreeState, cause: RigLossCause, o: RigLossOpts): RigLossPlan {
  const nodes = state.nodes;
  switch (cause) {
    case 'all_saved':
      return { scope: 'none', items: [], lines: [] };
    case 'bait_lost': {
      const given = o.snaggedBaitIdx;
      const b = given != null && nodes[given]?.slot === 'bait' && nodes[given].itemId ? given : lastFilledBait(nodes);
      return planOf(nodes, b >= 0 ? [b] : [], 'bait', o);
    }
    case 'hook_bait_lost':
      return terminalLoss(nodes, o);
    case 'below_swivel':
    case 'line_break_leader':
    case 'cutter':
      return belowSwivel(nodes, o);
    case 'all_lost':
    case 'line_break_main':
      return allBelowMainLine(nodes, o);
    default:
      return { scope: 'none', items: [], lines: [] };
  }
}
