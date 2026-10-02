/**
 * @file RigTree.test.ts
 * @description 채비 모딩 트리 — 확장·절단·요약·구세이브 이관 (192차)
 */
import { describe, it, expect } from 'vitest';
import {
  newRigTree, setRigValue, missingParts, summarize, treeFromLegacy, descendantsOf, KNOT_SWIVEL, KNOT_DIRECT,
  type RigItemView, type RigTreeState, type RigSlotKind, type RigValue,
} from './RigTree.js';

const ITEMS: Record<string, RigItemView> = {
  pe: { id: 'pe', name: '합사 원줄 1호', partKind: 'main_line', qty: 1 },
  carbon: { id: 'carbon', name: '카본 목줄 4호', partKind: 'leader_line', qty: 1 },
  pin: { id: 'pin', name: '핀 도래 8호', partKind: 'swivel_snap', qty: 5 },
  bundle16: { id: 'bundle16', name: '묶음추봉돌 16호 (60g)', partKind: 'bundle_sinker', qty: 2, sinkerWeightG: 60, kitHooks: 3 },
  worm: { id: 'worm', name: '청갯지렁이', partKind: 'bait', qty: 10, baitKey: 'worm_blue' },
  krill: { id: 'krill', name: '크릴', partKind: 'bait', qty: 10, baitKey: 'krill' },
  card3: { id: 'card3', name: '카드 채비 반짝이 3단', partKind: 'card_rig', qty: 2, kitHooks: 3, flasher: true },
  card7: { id: 'card7', name: '카드 채비 민바늘 7단', partKind: 'card_rig', qty: 2, kitHooks: 7, flasher: false },
  head: { id: 'head', name: '타이라바 헤드 80g', partKind: 'tairaba_head', qty: 1, sinkerWeightG: 80 },
  skirt: { id: 'skirt', name: '스커트', partKind: 'tairaba_skirt', qty: 1 },
  tie: { id: 'tie', name: '넥타이', partKind: 'tairaba_necktie', qty: 1 },
  hook: { id: 'hook', name: '감성돔 바늘 3호', partKind: 'hook', qty: 10 },
  float: { id: 'float', name: '구멍찌 0.8호', partKind: 'float', qty: 1 },
  split: { id: 'split', name: '좁쌀봉돌 G2', partKind: 'split_shot', qty: 10 },
};
const view = (id: string): RigItemView | null => ITEMS[id] ?? null;

/** 슬롯 이름으로 n번째 노드에 값을 넣는다 */
function put(s: RigTreeState, slot: RigSlotKind, v: RigValue, nth = 0): RigTreeState {
  let seen = 0;
  const i = s.nodes.findIndex((n) => n.slot === slot && seen++ === nth);
  if (i < 0) throw new Error(`no slot ${slot}#${nth} in [${s.nodes.map((n) => n.slot).join(',')}]`);
  return setRigValue(s, i, v, 'itemId' in v && v.itemId ? view(v.itemId) : null);
}
const slots = (s: RigTreeState): string[] => s.nodes.map((n) => n.slot);

describe('RigTree — 확장', () => {
  it('원줄을 달면 원줄 부속(없음)과 매듭이 열린다', () => {
    const s = put(newRigTree(), 'main_line', { itemId: 'pe' });
    expect(slots(s)).toEqual(['main_line', 'line_attach', 'knot']);
    expect(missingParts(s)).toEqual(['매듭']);
  });

  it('묶음추 간편 채비: 원줄 → 도래 → 핀도래 → 간편 채비 → 묶음추 → 고정 칸 + 바늘 3개 미끼', () => {
    let s = put(newRigTree(), 'main_line', { itemId: 'pe' });
    s = put(s, 'knot', { choice: KNOT_SWIVEL });
    s = put(s, 'swivel', { itemId: 'pin' });
    s = put(s, 'after_swivel', { choice: 'kit' });
    s = put(s, 'kit_kind', { choice: 'bundle_sinker' });
    s = put(s, 'bundle_kit', { itemId: 'bundle16' });
    const fixed = s.nodes.filter((n) => n.slot === 'fixed').map((n) => n.fixedLabel);
    expect(fixed).toEqual(['핀도래', '바늘 1', '바늘 2', '바렐 도래', '묶음추봉돌 16호', '바늘 3']);
    expect(s.nodes.filter((n) => n.slot === 'bait')).toHaveLength(3);
    expect(missingParts(s)).toEqual(['미끼']);
    // 193차 — 어느 바늘이든 하나만 채우면 완성(미끼 3 칸에만)
    s = put(s, 'bait', { itemId: 'worm' }, 2);
    expect(missingParts(s)).toEqual([]);
    const sum = summarize(s, view);
    expect(sum.kit).toBe('bundle_sinker');
    expect(sum.sinkerId).toBe('bundle16');
    expect(sum.swivelId).toBe('pin');
    expect(sum.bottomRig).toBe(true);
    expect(sum.fixedHooks).toBe(3);
  });

  it('타이라바: 직결 → 목줄 → 핀도래 → 타이라바 — 헤드·스커트·넥타이·바늘 1 전부 필수, 비권장 미끼면 참돔 가중 급감', () => {
    let s = put(newRigTree(), 'main_line', { itemId: 'pe' });
    s = put(s, 'knot', { choice: KNOT_DIRECT });
    s = put(s, 'leader', { itemId: 'carbon' });
    s = put(s, 'leader_end', { choice: 'connector' });
    s = put(s, 'connector', { itemId: 'pin' });
    s = put(s, 'kit_kind', { choice: 'tairaba' });
    expect(missingParts(s)).toEqual(['헤드', '스커트', '넥타이', '바늘 1']);
    s = put(s, 'tairaba_head', { itemId: 'head' });
    s = put(s, 'tairaba_skirt', { itemId: 'skirt' });
    s = put(s, 'tairaba_necktie', { itemId: 'tie' });
    s = put(s, 'hook', { itemId: 'hook' });
    expect(missingParts(s)).toEqual(['미끼']);
    s = put(s, 'bait', { itemId: 'krill' });
    expect(missingParts(s)).toEqual([]);
    let sum = summarize(s, view);
    expect(sum.offRecommendedBait).toBe(true);
    expect(sum.speciesBias.red_seabream).toBeLessThan(0);
    s = put(s, 'bait', { itemId: 'worm' });
    sum = summarize(s, view);
    expect(sum.offRecommendedBait).toBe(false);
    expect(sum.speciesBias.red_seabream).toBeGreaterThan(0);
    expect(sum.sinkerId).toBe('head');
    expect(sum.tairaba?.headId).toBe('head');
  });

  it('구멍치기: 찌 없이 직결 → 목줄 → 바늘 → 미끼로 완성된다(부력찌 필수 아님)', () => {
    let s = put(newRigTree(), 'main_line', { itemId: 'pe' });
    s = put(s, 'knot', { choice: KNOT_DIRECT });
    s = put(s, 'leader', { itemId: 'carbon' });
    s = put(s, 'leader_end', { choice: 'hook' });
    s = put(s, 'split_shot', { itemId: 'split' });
    s = put(s, 'hook', { itemId: 'hook' });
    s = put(s, 'bait', { itemId: 'worm' });
    expect(missingParts(s)).toEqual([]);
    expect(summarize(s, view).floatId).toBeNull();
  });

  it('찌 세트: 원줄 부속을 찌 세트로 바꾸면 매듭이 해제되고 찌 칸이 열린다', () => {
    let s = put(newRigTree(), 'main_line', { itemId: 'pe' });
    s = put(s, 'knot', { choice: KNOT_DIRECT });
    s = put(s, 'leader', { itemId: 'carbon' });
    s = put(s, 'line_attach', { choice: 'float_set' });
    expect(slots(s)).toEqual(['main_line', 'line_attach', 'float_stop', 'bead', 'float', 'cushion', 'sub_float', 'knot']);
    expect(s.nodes.find((n) => n.slot === 'knot')?.choice).toBeUndefined();
    expect(missingParts(s)).toEqual(['부력찌', '매듭']);
  });
});

describe('RigTree — 절단', () => {
  it('앞 노드를 바꾸면 자손이 전부 풀리고, 형제는 남는다', () => {
    let s = put(newRigTree(), 'main_line', { itemId: 'pe' });
    s = put(s, 'knot', { choice: KNOT_DIRECT });
    s = put(s, 'leader', { itemId: 'carbon' });
    s = put(s, 'leader_end', { choice: 'kit' });
    s = put(s, 'kit_kind', { choice: 'tairaba' });
    s = put(s, 'tairaba_head', { itemId: 'head' });
    s = put(s, 'hook', { itemId: 'hook' });
    s = put(s, 'bait', { itemId: 'worm' });
    // 바늘 1을 비우면 미끼 1만 사라지고 헤드는 그대로
    s = put(s, 'hook', { itemId: null });
    expect(s.nodes.find((n) => n.slot === 'tairaba_head')?.itemId).toBe('head');
    expect(s.nodes.filter((n) => n.slot === 'bait')).toHaveLength(0);
    // 매듭을 도래로 바꾸면 목줄 이하 전부 사라진다
    s = put(s, 'knot', { choice: KNOT_SWIVEL });
    expect(slots(s)).toEqual(['main_line', 'line_attach', 'knot', 'swivel']);
    // 원줄을 비우면 뿌리만 남는다
    s = put(s, 'main_line', { itemId: null });
    expect(slots(s)).toEqual(['main_line']);
  });

  it('descendantsOf는 손자까지 센다', () => {
    let s = put(newRigTree(), 'main_line', { itemId: 'pe' });
    s = put(s, 'knot', { choice: KNOT_DIRECT });
    s = put(s, 'leader', { itemId: 'carbon' });
    const d = descendantsOf(s.nodes, 0);
    expect(d.size).toBe(s.nodes.length - 1);
  });
});

describe('RigTree — 구세이브 이관', () => {
  it('반유동 찌 채비 9소켓이 체인으로 옮겨진다', () => {
    const s = treeFromLegacy({
      mainLine: 'pe', float: 'float', subFloat: null, swivel: 'pin', leader: 'carbon', sinker: 'split', hook: 'hook', bait: 'worm', hasFloatStop: true,
    }, view);
    expect(missingParts(s)).toEqual([]);
    const sum = summarize(s, view);
    expect(sum.floatId).toBe('float');
    expect(sum.swivelId).toBe('pin');
    expect(sum.sinkerId).toBe('split');
    expect(sum.hookIds).toEqual(['hook']);
    expect(sum.baitIds).toEqual(['worm']);
    expect(sum.bottomRig).toBe(false);
  });

  it('원투 묶음추 세이브는 간편 채비로 옮겨진다', () => {
    const s = treeFromLegacy({
      mainLine: 'pe', float: null, subFloat: null, swivel: 'pin', leader: 'carbon', sinker: 'bundle16', hook: 'hook', bait: 'worm', hasFloatStop: true,
    }, view);
    const sum = summarize(s, view);
    expect(sum.kit).toBe('bundle_sinker');
    expect(sum.baitIds[0]).toBe('worm');
    expect(missingParts(s)).toEqual([]);
  });
});

describe('RigTree — 193차 다중 미끼', () => {
  const bundle = (): RigTreeState => {
    let s = put(newRigTree(), 'main_line', { itemId: 'pe' });
    s = put(s, 'knot', { choice: KNOT_SWIVEL });
    s = put(s, 'swivel', { itemId: 'pin' });
    s = put(s, 'after_swivel', { choice: 'kit' });
    s = put(s, 'kit_kind', { choice: 'bundle_sinker' });
    return put(s, 'bundle_kit', { itemId: 'bundle16' });
  };
  it('바늘마다 다른 미끼 · 미끼 수 +2%씩 · 이웃한 같은 미끼 시너지 +1%', () => {
    let s = bundle();
    s = put(s, 'bait', { itemId: 'worm' }, 0);
    expect(summarize(s, view).biteBonus).toBeCloseTo(0);
    s = put(s, 'bait', { itemId: 'krill' }, 1);
    expect(summarize(s, view).biteBonus).toBeCloseTo(0.02);
    s = put(s, 'bait', { itemId: 'krill' }, 2);
    expect(summarize(s, view).biteBonus).toBeCloseTo(0.05);   // 3개 +4% · 2·3 같은 미끼 +1%
    expect(summarize(s, view).baitIds).toEqual(['worm', 'krill', 'krill']);
  });
  it('한 바늘에 두 미끼 — 켠 바늘마다 +2%', () => {
    let s = bundle();
    s = put(s, 'bait', { itemId: 'worm' }, 0);
    const i = s.nodes.findIndex((n) => n.slot === 'bait');
    s = { nodes: s.nodes.map((n, k) => (k === i ? { ...n, double: true } : n)) };
    expect(summarize(s, view).biteBonus).toBeCloseTo(0.02);
    expect(summarize(s, view).baitDouble[0]).toBe(true);
  });
  it('반짝이 깃 카드 채비는 미끼 없이 완성 · 민바늘 카드 채비는 미끼 하나가 필요', () => {
    const card = (id: string): RigTreeState => {
      let s = put(newRigTree(), 'main_line', { itemId: 'pe' });
      s = put(s, 'knot', { choice: KNOT_SWIVEL });
      s = put(s, 'swivel', { itemId: 'pin' });
      s = put(s, 'after_swivel', { choice: 'kit' });
      s = put(s, 'kit_kind', { choice: 'card_rig' });
      return put(s, 'card_kit', { itemId: id });
    };
    const f = card('card3');
    expect(missingParts(f)).toEqual([]);
    expect(f.nodes.filter((n) => n.slot === 'fixed' && n.flasher)).toHaveLength(3);
    const fs = summarize(f, view);
    expect(fs.flasherOnly).toBe(true);
    expect(fs.cardType).toBe('jeongaengi');
    const baited = put(f, 'bait', { itemId: 'krill' });
    expect(summarize(baited, view).flasherOnly).toBe(false);
    const p = card('card7');
    expect(missingParts(p)).toEqual(['미끼']);
    expect(p.nodes.filter((n) => n.slot === 'bait')).toHaveLength(7);
    expect(summarize(p, view).cardType).toBe('yeolgi');
  });
});
