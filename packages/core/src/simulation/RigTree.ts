/**
 * @file RigTree.ts
 * @description 채비 모딩 트리 (192차 — 사용자 지시 「타르코프 MODDING SYSTEM처럼」)
 *
 * 채비창은 더 이상 9칸을 한꺼번에 보여 주지 않는다. **원줄 하나**에서 출발해, 고른 것에 따라
 * 오른쪽으로 다음 칸이 열리고, 그 칸에서 고른 것이 또 다음 칸을 연다.
 *
 *  - 노드(칸) 종류: item(가방에서 부품을 고른다) · choice(갈래를 고른다) · toggle(켜고 끈다) · fixed(세트에 붙어 나온 고정 부품)
 *  - 모든 노드는 `parent`(자기를 열어 준 노드)를 안다. **앞 노드를 바꾸면 그 자손이 전부 해제된다**
 *    (타르코프에서 앞 파츠를 빼면 뒤에 달렸던 것이 다 풀리는 규칙). 같은 부모의 형제(세트 구성 칸)는 서로 영향이 없다.
 *  - 문법(어느 값이 어떤 칸을 여는가)은 `childrenOf` 한 곳에 있다. 새 채비 갈래는 여기와 `KIT_DEFS`에만 더한다.
 *  - 부품 ↔ 아이템 대응(`RigPartKind`)은 아이템 쪽이 `rigPart`로 들고, 없으면 client 분류기가 이름·필드로 추정한다.
 *
 * 순수 TS — Phaser/DOM 없음. 아이템 실체는 `RigItemView`(id·partKind·몇 가지 제원)로만 본다.
 */

import type { BaitKey } from './FishSpawningOracle.js';

// ─────────────────────────────────────────────────────────────
// 부품 종류
// ─────────────────────────────────────────────────────────────

/** 채비 칸에 들어가는 부품 종류 — 아이템 `rigPart` 필드 값 */
export type RigPartKind =
  | 'main_line'        // 원줄 스풀
  | 'leader_line'      // 목줄(쇼크리더) 스풀
  | 'bead'             // 반달구슬·찌멈춤 구슬
  | 'float'            // 부력찌(구멍찌·기울찌·제로찌·잠길찌)
  | 'cushion'          // 쿠션고무
  | 'sub_float'        // 수중찌
  | 'sliding_sinker'   // 원줄에 꿰는 유동 봉돌(고리·구멍 봉돌)
  | 'split_shot'       // 좁쌀 봉돌
  | 'swivel_plain'     // 일반 도래(바렐·크레인·볼베어링)
  | 'swivel_snap'      // 스냅·핀 도래
  | 'hook'             // 단품 바늘
  | 'bait'             // 미끼
  | 'bundle_sinker'    // 묶음추 채비(봉돌 + 바늘 묶음 완제품)
  | 'card_rig'         // 카드 채비(가지바늘 여러 단 완제품 — 반짝이 깃 바늘이면 미끼 없이도 전갱이가 덤빈다)
  | 'jig_head'         // 지그헤드
  | 'soft_lure'        // 웜·소프트 베이트(지그헤드 필요)
  | 'hard_lure'        // 미노우·스푼·스피너·에기·메탈지그·완성 타이라바
  | 'tairaba_head'     // 타이라바 헤드
  | 'tairaba_skirt'    // 타이라바 스커트
  | 'tairaba_necktie'; // 타이라바 넥타이·리본

export const RIG_PART_LABEL: Record<RigPartKind, string> = {
  main_line: '원줄', leader_line: '목줄', bead: '구슬', float: '부력찌', cushion: '쿠션고무', sub_float: '수중찌',
  sliding_sinker: '유동 봉돌', split_shot: '좁쌀봉돌', swivel_plain: '도래', swivel_snap: '스냅 도래',
  hook: '바늘', bait: '미끼', bundle_sinker: '묶음추 채비', card_rig: '카드 채비', jig_head: '지그헤드', soft_lure: '웜',
  hard_lure: '루어', tairaba_head: '타이라바 헤드', tairaba_skirt: '타이라바 스커트', tairaba_necktie: '타이라바 넥타이',
};

/** 트리가 아이템에서 보는 것 — client `InvItem`의 부분 집합 */
export interface RigItemView {
  id: string;
  name: string;
  partKind: RigPartKind | null;
  qty: number;
  /** 무게추·헤드 자중(g) */
  sinkerWeightG?: number;
  /** 묶음추·카드 채비의 바늘 수(없으면 3) */
  kitHooks?: number;
  /** 193차 — 카드 채비 바늘에 반짝이 깃(스킨)이 붙어 있는가 */
  flasher?: boolean;
  /** 미끼 종류(추천 대조용) */
  baitKey?: BaitKey;
}

// ─────────────────────────────────────────────────────────────
// 칸(슬롯) 정의
// ─────────────────────────────────────────────────────────────

/** 칸 종류 */
export type RigSlotKind =
  | 'main_line' | 'line_attach' | 'float_stop' | 'bead' | 'float' | 'cushion' | 'sub_float' | 'sliding_sinker'
  | 'knot' | 'swivel' | 'after_swivel' | 'leader' | 'leader_end' | 'connector' | 'split_shot' | 'hook' | 'bait'
  | 'kit_kind' | 'bundle_kit' | 'tairaba_head' | 'tairaba_skirt' | 'tairaba_necktie' | 'card_type' | 'card_kit' | 'tbar_sinker'
  | 'lure_hard' | 'jig_head' | 'lure_soft' | 'fixed';

export type RigNodeType = 'item' | 'choice' | 'toggle' | 'fixed';

/** 갈래 선택지 */
export interface RigChoiceOption { id: string; label: string; desc?: string }

export interface RigSlotDef {
  kind: RigSlotKind;
  type: RigNodeType;
  label: string;
  /** item 칸 — 받는 부품 종류 */
  accepts?: RigPartKind[];
  /** choice 칸 — 선택지 */
  options?: RigChoiceOption[];
  /** 비워 둬도 채비가 완성되는가 */
  optional?: boolean;
}

export const KNOT_DIRECT = 'direct';
export const KNOT_SWIVEL = 'swivel';

/** 간편 채비·루어 세트 종류 */
export type RigKitKind = 'bundle_sinker' | 'tairaba' | 'card_rig' | 't_bar' | 'lure_hard' | 'lure_soft';

export interface RigKitDef {
  id: RigKitKind;
  label: string;
  desc: string;
  /** 바늘에 미끼를 끼우는 세트인가 (미노우처럼 미끼 없는 세트는 false) */
  usesBait: boolean;
  /** 권장 미끼(비어 있으면 아무 미끼나 권장) — 다른 미끼를 끼우면 「권장되는 채비 유형이 아닙니다」 + 대상어종 확률 급감 */
  recommendedBaits?: BaitKey[];
  /** 이 세트의 대상 어종(speciesId) — 비권장 미끼일 때 확률을 깎는 대상 */
  targetSpecies?: string[];
  /** 세트 자체의 대상 어종 가중(speciesWeightBias — weight ×(1+bias)) */
  speciesBias?: Record<string, number>;
}

export const KIT_DEFS: Record<RigKitKind, RigKitDef> = {
  bundle_sinker: { id: 'bundle_sinker', label: '묶음추 채비', desc: '봉돌과 바늘이 묶여 나오는 원투 간편 채비. 핀도래에 걸고 미끼만 끼우면 된다.', usesBait: true },
  tairaba: {
    id: 'tairaba', label: '타이라바 채비', desc: '헤드·스커트·넥타이를 조립하는 참돔 러버지그. 바늘에는 혼무시·청갯지렁이를 끼운다.',
    usesBait: true, recommendedBaits: ['worm_king', 'worm_blue'], targetSpecies: ['red_seabream'], speciesBias: { red_seabream: 0.6 },
  },
  card_rig: { id: 'card_rig', label: '카드 채비', desc: '가지바늘이 여러 단 달린 편대. 단마다 미끼를 끼운다.', usesBait: true },
  t_bar: { id: 't_bar', label: 'T자 천평 편대', desc: '봉돌과 목줄을 금속 프레임이 벌려 주는 원투 편대. 꼬임이 적다.', usesBait: true },
  lure_hard: { id: 'lure_hard', label: '하드 베이트', desc: '미노우·스푼·스피너·에기·메탈지그·완성 타이라바. 미끼를 끼우지 않는다.', usesBait: false },
  lure_soft: { id: 'lure_soft', label: '소프트 베이트', desc: '지그헤드에 웜을 끼운다. 미끼를 따로 끼우지 않는다.', usesBait: false },
};

export const KIT_ORDER: RigKitKind[] = ['bundle_sinker', 'tairaba', 'card_rig', 't_bar', 'lure_hard', 'lure_soft'];

/** 카드 채비 단수 */
export const CARD_TYPES: { id: string; label: string; hooks: number; gapM: number }[] = [
  { id: 'jeongaengi', label: '전갱이 (3단)', hooks: 3, gapM: 0.5 },
  { id: 'godeungeo', label: '고등어 (5단)', hooks: 5, gapM: 0.5 },
  { id: 'yeolgi', label: '열기 (7단)', hooks: 7, gapM: 0.3 },
];

export const RIG_SLOTS: Record<RigSlotKind, RigSlotDef> = {
  main_line: { kind: 'main_line', type: 'item', label: '원줄', accepts: ['main_line'] },
  line_attach: {
    kind: 'line_attach', type: 'choice', label: '원줄 부속', optional: true,
    options: [
      { id: 'none', label: '없음 (바로 매듭)', desc: '원줄에 아무것도 꿰지 않는다 — 구멍치기·루어·간편 채비.' },
      { id: 'float_set', label: '찌 세트', desc: '면사매듭 → 구슬 → 부력찌 → 쿠션 → 수중찌 순으로 꿴다.' },
      { id: 'sliding_sinker', label: '유동 봉돌', desc: '고리·구멍 봉돌을 원줄에 꿰는 원투 채비.' },
    ],
  },
  float_stop: { kind: 'float_stop', type: 'toggle', label: '면사매듭', optional: true },
  bead: { kind: 'bead', type: 'item', label: '구슬', accepts: ['bead'], optional: true },
  float: { kind: 'float', type: 'item', label: '부력찌', accepts: ['float'] },
  cushion: { kind: 'cushion', type: 'item', label: '쿠션고무', accepts: ['cushion'], optional: true },
  sub_float: { kind: 'sub_float', type: 'item', label: '수중찌', accepts: ['sub_float'], optional: true },
  sliding_sinker: { kind: 'sliding_sinker', type: 'item', label: '유동 봉돌', accepts: ['sliding_sinker'] },
  knot: {
    kind: 'knot', type: 'choice', label: '매듭',
    options: [
      { id: KNOT_DIRECT, label: '직결 매듭', desc: '원줄과 목줄을 매듭으로 바로 잇는다 (FG 노트 등).' },
      { id: KNOT_SWIVEL, label: '도래', desc: '도래로 잇는다 — 꼬임이 적고 채비 교체가 쉽다.' },
    ],
  },
  swivel: { kind: 'swivel', type: 'item', label: '도래', accepts: ['swivel_plain', 'swivel_snap'] },
  after_swivel: {
    kind: 'after_swivel', type: 'choice', label: '다음',
    options: [
      { id: 'leader', label: '목줄', desc: '도래 반대편에 목줄을 묶는다.' },
      { id: 'kit', label: '간편 채비', desc: '묶음추·편대·루어처럼 완제품을 바로 건다.' },
    ],
  },
  leader: { kind: 'leader', type: 'item', label: '목줄', accepts: ['leader_line'] },
  leader_end: {
    kind: 'leader_end', type: 'choice', label: '목줄 끝',
    options: [
      { id: 'hook', label: '바늘', desc: '목줄 끝에 바늘을 묶는다 (좁쌀봉돌은 선택).' },
      { id: 'connector', label: '도래·스냅', desc: '목줄 끝에 핀도래·스냅을 달아 세트를 건다.' },
      { id: 'kit', label: '간편 채비 직결', desc: '세트의 어시스트 라인·아이를 목줄에 바로 묶는다.' },
    ],
  },
  connector: { kind: 'connector', type: 'item', label: '연결 도래', accepts: ['swivel_snap', 'swivel_plain'] },
  split_shot: { kind: 'split_shot', type: 'item', label: '좁쌀봉돌', accepts: ['split_shot'], optional: true },
  hook: { kind: 'hook', type: 'item', label: '바늘', accepts: ['hook'] },
  // 193차 — 미끼 칸은 하나하나는 선택이고, 채비 전체에 **최소 하나**가 있어야 완성이다(missingParts)
  bait: { kind: 'bait', type: 'item', label: '미끼', accepts: ['bait'], optional: true },
  kit_kind: {
    kind: 'kit_kind', type: 'choice', label: '간편 채비',
    options: KIT_ORDER.map((k) => ({ id: k, label: KIT_DEFS[k].label, desc: KIT_DEFS[k].desc })),
  },
  bundle_kit: { kind: 'bundle_kit', type: 'item', label: '묶음추', accepts: ['bundle_sinker'] },
  tairaba_head: { kind: 'tairaba_head', type: 'item', label: '헤드', accepts: ['tairaba_head'] },
  tairaba_skirt: { kind: 'tairaba_skirt', type: 'item', label: '스커트', accepts: ['tairaba_skirt'] },
  tairaba_necktie: { kind: 'tairaba_necktie', type: 'item', label: '넥타이', accepts: ['tairaba_necktie'] },
  // 192차 구세이브 호환 — 단수 갈래(아이템 없이 고르던 카드 채비). 193차부터는 카드 채비 아이템(card_kit)을 고른다
  card_type: { kind: 'card_type', type: 'choice', label: '단수', options: CARD_TYPES.map((c) => ({ id: c.id, label: c.label })) },
  card_kit: { kind: 'card_kit', type: 'item', label: '카드 채비', accepts: ['card_rig'] },
  tbar_sinker: { kind: 'tbar_sinker', type: 'item', label: '봉돌', accepts: ['sliding_sinker', 'bundle_sinker'] },
  lure_hard: { kind: 'lure_hard', type: 'item', label: '루어', accepts: ['hard_lure'] },
  jig_head: { kind: 'jig_head', type: 'item', label: '지그헤드', accepts: ['jig_head'] },
  lure_soft: { kind: 'lure_soft', type: 'item', label: '웜', accepts: ['soft_lure'] },
  fixed: { kind: 'fixed', type: 'fixed', label: '고정' },
};

// ─────────────────────────────────────────────────────────────
// 노드·상태
// ─────────────────────────────────────────────────────────────

export interface RigNode {
  slot: RigSlotKind;
  /** 자기를 연 노드의 인덱스(-1 = 뿌리) */
  parent: number;
  /** choice 칸의 선택 id */
  choice?: string;
  /** item 칸의 아이템 id */
  itemId?: string;
  /** toggle 칸 */
  on?: boolean;
  /** fixed 칸 — 표시 이름·아이콘 텍스처 키 */
  fixedLabel?: string;
  fixedIcon?: string;
  /** 같은 세트의 바늘 번호(1부터) — 바늘·미끼 칸 */
  hookNo?: number;
  /** 이 칸이 속한 세트 종류(미끼 추천 대조·대상어종) */
  kit?: RigKitKind;
  /** 라벨 덮어쓰기(세트 바늘 「바늘 2」 등) */
  label?: string;
  /** 비워 둬도 되는가(슬롯 정의를 덮어쓴다) */
  optional?: boolean;
  /** 193차 — 미끼 칸: 「한 바늘에 두 미끼」(같은 미끼 두 마리 · 2개 소모) */
  double?: boolean;
  /** 193차 — 고정 바늘 칸: 반짝이 깃 바늘 */
  flasher?: boolean;
}

export interface RigTreeState { nodes: RigNode[] }

export type RigValue = { itemId: string | null } | { choice: string } | { on: boolean };

export function newRigTree(): RigTreeState {
  return { nodes: [{ slot: 'main_line', parent: -1 }] };
}

function node(slot: RigSlotKind, parent: number, extra: Partial<RigNode> = {}): RigNode {
  return { slot, parent, ...extra };
}

/** 노드가 값을 가졌는가 (fixed·toggle은 늘 참) */
export function nodeFilled(n: RigNode): boolean {
  const def = RIG_SLOTS[n.slot];
  if (def.type === 'item') return !!n.itemId;
  if (def.type === 'choice') return !!n.choice;
  return true;
}

export function nodeOptional(n: RigNode): boolean {
  return n.optional ?? !!RIG_SLOTS[n.slot].optional;
}

export function nodeLabel(n: RigNode): string {
  return n.label ?? (n.slot === 'fixed' ? (n.fixedLabel ?? '고정') : RIG_SLOTS[n.slot].label);
}

/**
 * 값이 정해진 노드가 여는 자식 칸들 — 채비 문법의 전부.
 * @param n 값이 정해진 노드 · @param idx 그 인덱스 · @param item item 칸이면 고른 아이템
 */
export function childrenOf(n: RigNode, idx: number, item: RigItemView | null): RigNode[] {
  const def = RIG_SLOTS[n.slot];
  if (def.type === 'item' && !n.itemId) return [];
  if (def.type === 'choice' && !n.choice) return [];
  switch (n.slot) {
    case 'main_line':
      // 원줄 부속은 「없음」으로 태어나므로 매듭이 바로 열린다(expandBorn)
      return [node('line_attach', idx, { choice: 'none' })];
    case 'line_attach':
      // 매듭은 원줄 부속의 자식 — 부속을 바꾸면(찌 세트 ↔ 유동 봉돌) 매듭 이하가 전부 풀린다(타르코프 규칙)
      if (n.choice === 'float_set') {
        return [node('float_stop', idx, { on: true }), node('bead', idx), node('float', idx), node('cushion', idx), node('sub_float', idx), node('knot', idx)];
      }
      if (n.choice === 'sliding_sinker') return [node('sliding_sinker', idx), node('cushion', idx), node('knot', idx)];
      return [node('knot', idx)];
    case 'knot':
      return n.choice === KNOT_SWIVEL ? [node('swivel', idx)] : [node('leader', idx)];
    case 'swivel':
      return [node('after_swivel', idx)];
    case 'after_swivel':
      return n.choice === 'kit' ? [node('kit_kind', idx)] : [node('leader', idx)];
    case 'leader':
      return [node('leader_end', idx)];
    case 'leader_end':
      if (n.choice === 'hook') return [node('split_shot', idx), node('hook', idx, { hookNo: 1 })];
      if (n.choice === 'connector') return [node('connector', idx)];
      return [node('kit_kind', idx)];
    case 'connector':
      return [node('kit_kind', idx)];
    case 'kit_kind': {
      const kit = n.choice as RigKitKind;
      switch (kit) {
        case 'bundle_sinker': return [node('bundle_kit', idx, { kit })];
        case 'tairaba':
          return [
            node('tairaba_head', idx, { kit }), node('tairaba_skirt', idx, { kit }), node('tairaba_necktie', idx, { kit }),
            node('hook', idx, { kit, hookNo: 1, label: '바늘 1' }), node('hook', idx, { kit, hookNo: 2, label: '바늘 2', optional: true }),
          ];
        case 'card_rig': return [node('card_kit', idx, { kit })];
        case 't_bar': return [node('tbar_sinker', idx, { kit }), node('hook', idx, { kit, hookNo: 1 })];
        case 'lure_hard': return [node('lure_hard', idx, { kit })];
        case 'lure_soft': return [node('jig_head', idx, { kit }), node('lure_soft', idx, { kit })];
        default: return [];
      }
    }
    case 'bundle_kit': {
      // 묶음추 완제품 → 핀도래(고정) · 바늘 1 · 바늘 2 · 바렐 도래(고정) · 봉돌(고정) · 바늘 3 … 바늘마다 미끼 칸
      const hooks = Math.max(1, item?.kitHooks ?? 3);
      const sinkerLabel = item ? item.name.replace(/\s*\(.*\)$/, '') : '봉돌';
      const out: RigNode[] = [node('fixed', idx, { fixedLabel: '핀도래', fixedIcon: 'swivel', kit: 'bundle_sinker' })];
      const hookFixed = (no: number): RigNode[] => [
        node('fixed', idx, { fixedLabel: `바늘 ${no}`, fixedIcon: 'item_hook_chinu', kit: 'bundle_sinker', hookNo: no }),
        node('bait', idx, { kit: 'bundle_sinker', hookNo: no, label: `미끼 ${no}` }),
      ];
      const above = Math.min(2, hooks - 1);
      for (let i = 1; i <= above; i++) out.push(...hookFixed(i));
      out.push(node('fixed', idx, { fixedLabel: '바렐 도래', fixedIcon: 'swivel_barrel', kit: 'bundle_sinker' }));
      out.push(node('fixed', idx, { fixedLabel: sinkerLabel, fixedIcon: 'sinker_bundle', kit: 'bundle_sinker' }));
      for (let i = above + 1; i <= hooks; i++) out.push(...hookFixed(i));
      return out;
    }
    case 'card_type': case 'card_kit': {
      // 단수 = 아이템의 바늘 수(193차) 또는 구세이브의 단수 갈래
      const ct = CARD_TYPES.find((c) => c.id === n.choice);
      const hooks = n.slot === 'card_kit' ? Math.max(1, item?.kitHooks ?? 3) : (ct?.hooks ?? 3);
      const flasher = n.slot === 'card_kit' && !!item?.flasher;
      const out: RigNode[] = [];
      for (let i = 1; i <= hooks; i++) {
        out.push(node('fixed', idx, {
          fixedLabel: flasher ? `반짝이 바늘 ${i}` : `가지바늘 ${i}`, fixedIcon: flasher ? 'card_rig_flasher' : 'item_hook_chinu',
          kit: 'card_rig', hookNo: i, flasher,
        }));
        out.push(node('bait', idx, { kit: 'card_rig', hookNo: i, label: `미끼 ${i}` }));
      }
      out.push(node('fixed', idx, { fixedLabel: '봉돌', fixedIcon: 'sinker_pillar', kit: 'card_rig' }));
      return out;
    }
    case 'hook':
      // 바늘을 달면 미끼 칸 — 세트 바늘(hookNo)이면 번호를 잇는다
      return [node('bait', idx, { kit: n.kit, hookNo: n.hookNo, label: n.hookNo && n.kit ? `미끼 ${n.hookNo}` : undefined })];
    default:
      return [];
  }
}

/** idx의 자손 인덱스 집합(자기 제외) */
export function descendantsOf(nodes: RigNode[], idx: number): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < nodes.length; i++) {
    let p = nodes[i].parent;
    while (p >= 0) {
      if (p === idx) { out.add(i); break; }
      p = nodes[p].parent;
    }
  }
  return out;
}

/** idx 서브트리(자기 포함)의 마지막 인덱스 — 자식은 그 다음에 끼워 넣는다 */
function subtreeEnd(nodes: RigNode[], idx: number): number {
  let end = idx;
  const desc = descendantsOf(nodes, idx);
  desc.forEach((i) => { if (i > end) end = i; });
  return end;
}

/**
 * 노드 값 설정 — **자손 전부 해제** 후 새 값이 여는 자식을 바로 뒤에 끼워 넣는다.
 * @returns 새 상태(불변) · 실제로 바뀐 노드의 인덱스
 */
export function setRigValue(state: RigTreeState, idx: number, value: RigValue, item: RigItemView | null): RigTreeState {
  const nodes = state.nodes.map((n) => ({ ...n }));
  const target = nodes[idx];
  if (!target) return state;
  const def = RIG_SLOTS[target.slot];
  if (def.type === 'fixed') return state;
  // 1) 자손 제거 + 인덱스 재매핑
  const drop = descendantsOf(nodes, idx);
  const kept: RigNode[] = [];
  const remap = new Map<number, number>();
  nodes.forEach((n, i) => { if (!drop.has(i)) { remap.set(i, kept.length); kept.push(n); } });
  kept.forEach((n) => { n.parent = n.parent < 0 ? -1 : (remap.get(n.parent) ?? -1); });
  const ni = remap.get(idx)!;
  const t = kept[ni];
  // 2) 값
  if ('itemId' in value) {
    if (def.type !== 'item') return state;
    if (value.itemId) t.itemId = value.itemId; else delete t.itemId;
  } else if ('choice' in value) {
    if (def.type !== 'choice') return state;
    t.choice = value.choice;
  } else {
    if (def.type !== 'toggle') return state;
    t.on = value.on;
  }
  // 3) 새 자식 끼워 넣기(서브트리 끝 = 자기 자신)
  const kids = childrenOf(t, ni, item);
  kept.splice(ni + 1, 0, ...kids);
  // 끼워 넣은 뒤 인덱스가 밀린 노드들의 parent 보정
  for (let i = ni + 1 + kids.length; i < kept.length; i++) {
    if (kept[i].parent > ni) kept[i].parent += kids.length;
  }
  // 자식 중 값을 갖고 태어나는 것(line_attach=none · float_stop=on)은 자기 자식도 바로 연다
  return expandBorn(kept, ni + 1, ni + kids.length);
}

/** 태어날 때 값을 가진 자식(기본 선택)의 자식까지 열어 준다 */
function expandBorn(nodes: RigNode[], from: number, to: number): RigTreeState {
  let i = from;
  let end = to;
  while (i <= end) {
    const n = nodes[i];
    const def = RIG_SLOTS[n.slot];
    if ((def.type === 'choice' && n.choice) || (def.type === 'toggle')) {
      const kids = childrenOf(n, i, null);
      if (kids.length) {
        const at = subtreeEnd(nodes, i) + 1;
        nodes.splice(at, 0, ...kids);
        for (let j = at + kids.length; j < nodes.length; j++) if (nodes[j].parent >= at) nodes[j].parent += kids.length;
        end += kids.length;
      }
    }
    i++;
  }
  return { nodes };
}

/** 아이템이 사라졌을 때(소모·분실·판매) 그 칸을 비우고 자손을 해제한다 */
export function dropMissingItems(state: RigTreeState, exists: (id: string) => boolean): RigTreeState {
  let s = state;
  for (;;) {
    const i = s.nodes.findIndex((n) => n.itemId && !exists(n.itemId));
    if (i < 0) return s;
    s = setRigValue(s, i, { itemId: null }, null);
  }
}

// ─────────────────────────────────────────────────────────────
// 판정·요약
// ─────────────────────────────────────────────────────────────

/** 비어 있어 캐스팅을 막는 칸의 라벨 목록 */
export function missingParts(state: RigTreeState): string[] {
  const out: string[] = [];
  for (const n of state.nodes) {
    if (nodeFilled(n) || nodeOptional(n)) continue;
    out.push(nodeLabel(n));
  }
  // 193차 — 미끼 칸이 하나라도 있으면 그중 **최소 하나**는 채워야 한다(각 칸은 선택).
  //   예외: 반짝이 깃 카드 채비는 미끼 없이도 완성(전갱이가 바늘 자체를 문다 — summarize().flasherOnly)
  const baitNodes = state.nodes.filter((n) => n.slot === 'bait');
  const flasher = state.nodes.some((n) => n.slot === 'fixed' && n.flasher);
  if (baitNodes.length > 0 && !baitNodes.some((n) => !!n.itemId) && !flasher) out.push('미끼');
  // 끝이 열린 채비(마지막 노드가 값을 가졌지만 자식이 없는 중간 칸)는 아직 완성이 아니다
  const last = state.nodes[state.nodes.length - 1];
  if (last && nodeFilled(last) && !isTerminal(last) && out.length === 0) out.push(RIG_SLOTS[nextSlotHint(last)].label);
  return out;
}

// ─────────────────────────────────────────────────────────────
// 193차 — 미끼 수·시너지·한 바늘에 두 미끼 → 입질 가중
// ─────────────────────────────────────────────────────────────

/** 미끼를 끼운 바늘이 하나 늘 때마다 입질 +2% (바늘 3개 = 최대 +4%) */
export const MULTI_BAIT_BONUS = 0.02;
/** 이웃한 바늘에 같은 미끼가 이어지면 시너지 +1% (한 번만) */
export const SAME_BAIT_SYNERGY = 0.01;
/** 「한 바늘에 두 미끼」를 켠 바늘마다 입질 +1% (194차 — 사용자 밸런스 조정: 2% → 1%) */
export const DOUBLE_BAIT_BONUS = 0.01;
/** 「한 바늘에 두 미끼」 가중의 상한 — 바늘이 많아도 +2%까지 (194차) */
export const DOUBLE_BAIT_MAX = 0.02;
/** 카드 채비의 미끼 가중 상한 — 바늘이 5~7개라 쌓이기 쉬워 합계 +10%에서 멈춘다 (194차 보강) */
export const CARD_RIG_BITE_BONUS_MAX = 0.10;
/** 반짝이 깃 카드 채비를 미끼 없이 쓸 때 — 전갱이만, 미끼를 끼웠을 때 입질의 10% */
export const FLASHER_ONLY_BITE_MULT = 0.10;
export const FLASHER_TARGET_SPECIES = 'horse_mackerel';

/** 바늘에 걸린 미끼 묶음 — 연속 판정은 칸 순서(바늘 번호) 기준. `maxBonus`는 합계 상한(카드 채비 10%) */
export function baitBiteBonus(baits: { itemId: string | null; double?: boolean }[], maxBonus = Infinity): number {
  const filled = baits.filter((b) => !!b.itemId);
  if (filled.length === 0) return 0;
  let bonus = (filled.length - 1) * MULTI_BAIT_BONUS;
  for (let i = 1; i < baits.length; i++) {
    if (baits[i].itemId && baits[i].itemId === baits[i - 1].itemId) { bonus += SAME_BAIT_SYNERGY; break; }
  }
  bonus += Math.min(DOUBLE_BAIT_MAX, filled.filter((b) => b.double).length * DOUBLE_BAIT_BONUS);
  return Math.min(maxBonus, bonus);
}

/** 이 노드로 채비가 끝날 수 있는가 */
function isTerminal(n: RigNode): boolean {
  if (n.slot === 'bait' || n.slot === 'lure_hard' || n.slot === 'lure_soft' || n.slot === 'fixed') return true;
  if (n.slot === 'hook') return false;
  return false;
}

/** 끝이 열린 노드 뒤에 와야 할 칸(안내용) */
function nextSlotHint(n: RigNode): RigSlotKind {
  switch (n.slot) {
    case 'main_line': return 'knot';
    case 'knot': return n.choice === KNOT_SWIVEL ? 'swivel' : 'leader';
    case 'swivel': return 'after_swivel';
    case 'leader': return 'leader_end';
    case 'hook': return 'bait';
    default: return 'hook';
  }
}

/** 트리 요약 — 물리·캐스팅·입질이 쓰는 투영값 */
export interface RigSummary {
  mainLineId: string | null;
  leaderId: string | null;
  floatId: string | null;
  subFloatId: string | null;
  floatStop: boolean;
  swivelId: string | null;
  /** 주 봉돌(유동·좁쌀·묶음추·T자 봉돌·타이라바 헤드) */
  sinkerId: string | null;
  hookIds: string[];
  baitIds: (string | null)[];
  /** 고정 바늘(세트)이 있는가 */
  fixedHooks: number;
  kit: RigKitKind | null;
  /** 카드 채비 단수 id */
  cardType: string | null;
  lureId: string | null;
  jigHeadId: string | null;
  /** 세트가 미끼를 쓰는가 (루어면 false) */
  usesBait: boolean;
  /** 찌가 없는 바닥 채비(원투·구멍치기·간편 채비)인가 */
  bottomRig: boolean;
  /** 권장 미끼가 아닌 미끼를 끼운 칸이 있는가 */
  offRecommendedBait: boolean;
  /** 대상어종 가중(세트 + 비권장 페널티 반영) */
  speciesBias: Record<string, number>;
  tairaba: { headId: string | null; skirtId: string | null; necktieId: string | null } | null;
  /** 193차 — 미끼 칸별 「한 바늘에 두 미끼」 (baitIds와 같은 순서) */
  baitDouble: boolean[];
  /** 193차 — 반짝이 깃 카드 채비인가 */
  flasher: boolean;
  /** 193차 — 반짝이 깃 카드 채비에 미끼가 하나도 없다(전갱이 전용 · 입질 10%) */
  flasherOnly: boolean;
  /** 193차 — 미끼 수·시너지·두 미끼로 오른 입질 비율(0.05 = +5%) */
  biteBonus: number;
}

export function summarize(state: RigTreeState, view: (id: string) => RigItemView | null): RigSummary {
  const s: RigSummary = {
    mainLineId: null, leaderId: null, floatId: null, subFloatId: null, floatStop: true, swivelId: null, sinkerId: null,
    hookIds: [], baitIds: [], fixedHooks: 0, kit: null, cardType: null, lureId: null, jigHeadId: null, usesBait: true,
    bottomRig: true, offRecommendedBait: false, speciesBias: {}, tairaba: null,
    baitDouble: [], flasher: false, flasherOnly: false, biteBonus: 0,
  };
  let hasFloatSet = false;
  for (const n of state.nodes) {
    switch (n.slot) {
      case 'main_line': s.mainLineId = n.itemId ?? null; break;
      case 'leader': s.leaderId = n.itemId ?? null; break;
      case 'line_attach': hasFloatSet = n.choice === 'float_set'; break;
      case 'float_stop': s.floatStop = n.on !== false; break;
      case 'float': s.floatId = n.itemId ?? null; break;
      case 'sub_float': s.subFloatId = n.itemId ?? null; break;
      case 'swivel': case 'connector': if (n.itemId) s.swivelId = n.itemId; break;
      case 'sliding_sinker': case 'split_shot': case 'bundle_kit': case 'tbar_sinker': case 'tairaba_head':
        if (n.itemId) s.sinkerId = n.itemId; break;
      case 'hook': if (n.itemId) s.hookIds.push(n.itemId); break;
      case 'fixed': if (n.hookNo) s.fixedHooks++; if (n.flasher) s.flasher = true; break;
      case 'bait': s.baitIds.push(n.itemId ?? null); s.baitDouble.push(!!n.itemId && !!n.double); break;
      case 'kit_kind': s.kit = (n.choice as RigKitKind) ?? null; break;
      case 'card_type': s.cardType = n.choice ?? null; break;
      case 'card_kit': if (n.itemId) {
        const hooks = view(n.itemId)?.kitHooks ?? 3;
        s.cardType = CARD_TYPES.find((c) => c.hooks === hooks)?.id ?? CARD_TYPES[0].id;
        s.sinkerId = n.itemId;   // 카드 채비는 아래 봉돌까지 한 벌 — 아이템 자중(sinkerWeightG)이 채비 무게
      } break;
      case 'lure_hard': case 'lure_soft': if (n.itemId) s.lureId = n.itemId; break;
      case 'jig_head': if (n.itemId) s.jigHeadId = n.itemId; break;
      default: break;
    }
  }
  if (s.kit === 'tairaba') {
    const find = (slot: RigSlotKind): string | null => state.nodes.find((n) => n.slot === slot)?.itemId ?? null;
    s.tairaba = { headId: find('tairaba_head'), skirtId: find('tairaba_skirt'), necktieId: find('tairaba_necktie') };
  }
  const kitDef = s.kit ? KIT_DEFS[s.kit] : null;
  s.usesBait = kitDef ? kitDef.usesBait : true;
  s.bottomRig = !hasFloatSet || !s.floatId;
  if (kitDef?.speciesBias) s.speciesBias = { ...kitDef.speciesBias };
  const baits = s.baitIds.map((itemId, i) => ({ itemId, double: s.baitDouble[i] }));
  s.biteBonus = baitBiteBonus(baits, s.cardType ? CARD_RIG_BITE_BONUS_MAX : Infinity);
  s.flasherOnly = s.flasher && !s.baitIds.some((b) => !!b);
  // 권장 미끼 대조 — 세트가 권장 미끼를 정했고 끼운 미끼가 거기 없으면 비권장
  if (kitDef?.recommendedBaits?.length) {
    for (const id of s.baitIds) {
      if (!id) continue;
      const v = view(id);
      if (v?.baitKey && !kitDef.recommendedBaits.includes(v.baitKey)) { s.offRecommendedBait = true; break; }
    }
    if (s.offRecommendedBait) {
      for (const sp of kitDef.targetSpecies ?? []) s.speciesBias[sp] = OFF_RECOMMENDED_BIAS;
    }
  }
  return s;
}

/** 비권장 미끼일 때 대상어종 가중 — weight ×(1+bias) → 극도로 낮아진다 */
export const OFF_RECOMMENDED_BIAS = -0.92;

/** 세트의 권장 미끼인가 (세트가 권장을 정하지 않았으면 모두 참) */
export function baitRecommendedFor(kit: RigKitKind | undefined, baitKey: BaitKey | undefined): boolean {
  const rec = kit ? KIT_DEFS[kit].recommendedBaits : undefined;
  if (!rec?.length) return true;
  return !!baitKey && rec.includes(baitKey);
}

// ─────────────────────────────────────────────────────────────
// 구세이브 → 트리 (평면 9소켓 → 체인)
// ─────────────────────────────────────────────────────────────

export interface LegacyRigSockets {
  mainLine: string | null; float: string | null; subFloat: string | null; swivel: string | null;
  leader: string | null; sinker: string | null; hook: string | null; bait: string | null;
  hasFloatStop: boolean;
  /** 루어 모드였으면 루어·지그헤드 */
  lure?: string | null; jigHead?: string | null; lureLine?: string | null; lureLeader?: string | null; lureMode?: boolean;
}

/** 평면 소켓 세이브를 트리로 옮긴다 — 값이 있는 데까지만 열고 나머지는 빈 칸으로 둔다 */
export function treeFromLegacy(l: LegacyRigSockets, view: (id: string) => RigItemView | null): RigTreeState {
  let s = newRigTree();
  const set = (slot: RigSlotKind, v: RigValue, nth = 0): void => {
    let seen = 0;
    const i = s.nodes.findIndex((n) => n.slot === slot && seen++ === nth);
    if (i < 0) return;
    const item = 'itemId' in v && v.itemId ? view(v.itemId) : null;
    s = setRigValue(s, i, v, item);
  };
  const mainLine = l.lureMode ? (l.lureLine ?? l.mainLine) : l.mainLine;
  if (!mainLine) return s;
  set('main_line', { itemId: mainLine });
  const sinker = l.sinker ? view(l.sinker) : null;
  if (!l.lureMode && l.float) {
    set('line_attach', { choice: 'float_set' });
    set('float_stop', { on: l.hasFloatStop });
    set('float', { itemId: l.float });
    if (l.subFloat) set('sub_float', { itemId: l.subFloat });
  } else if (!l.lureMode && sinker?.partKind === 'sliding_sinker') {
    set('line_attach', { choice: 'sliding_sinker' });
    set('sliding_sinker', { itemId: sinker.id });
  }
  if (l.swivel) { set('knot', { choice: KNOT_SWIVEL }); set('swivel', { itemId: l.swivel }); set('after_swivel', { choice: 'leader' }); }
  else set('knot', { choice: KNOT_DIRECT });
  const leader = l.lureMode ? (l.lureLeader ?? l.leader) : l.leader;
  if (!leader) return s;
  set('leader', { itemId: leader });
  if (l.lureMode && l.lure) {
    const lv = view(l.lure);
    set('leader_end', { choice: 'kit' });
    if (lv?.partKind === 'soft_lure') {
      set('kit_kind', { choice: 'lure_soft' });
      if (l.jigHead) set('jig_head', { itemId: l.jigHead });
      set('lure_soft', { itemId: l.lure });
    } else {
      set('kit_kind', { choice: 'lure_hard' });
      set('lure_hard', { itemId: l.lure });
    }
    return s;
  }
  if (sinker?.partKind === 'bundle_sinker') {
    set('leader_end', { choice: 'kit' });
    set('kit_kind', { choice: 'bundle_sinker' });
    set('bundle_kit', { itemId: sinker.id });
    if (l.bait) set('bait', { itemId: l.bait });
    return s;
  }
  set('leader_end', { choice: 'hook' });
  if (sinker?.partKind === 'split_shot') set('split_shot', { itemId: sinker.id });
  if (l.hook) {
    const hv = view(l.hook);
    if (hv?.partKind === 'hook') {
      set('hook', { itemId: l.hook });
      if (l.bait) set('bait', { itemId: l.bait });
    }
  }
  return s;
}
