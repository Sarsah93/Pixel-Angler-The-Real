/**
 * @file KoreanPhrase.ts
 * @description 267차 — 한국어 말 다듬기. 할 일 문장(「…를 산다」)을 **말하듯** 잇는 데 쓴다.
 *
 *  대화창은 진행 상황을 「[완료] … / - …」로 나열했는데, 사용자 지적 「대화하듯 진행 상황을 전개 · 설명하듯 notice 해야 하는데
 *  단순히 텍스트로만 나열하듯 적혀지고 있는게 이질감」. 문장을 1인칭 산문(R4 — 조행록 서두와 같은 목소리)으로 잇는다.
 *
 *  활용은 **명사형(「…는 것」)**만 쓴다 — 과거형 활용(ㅂ · ㄷ · 르 불규칙 · 모음 축약)은 틀리기 쉬운데,
 *  현재형 서술(「산다 · 올린다 · 내려놓는다」)에서 「는 것」은 규칙 하나로 맞는다:
 *    「…는다」 → 「…는 것」(낚는다 → 낚는 것) · 「…ㄴ다」(받침 ㄴ) → 받침을 떼고 「는 것」(산다 → 사는 것 · 만든다 → 만드는 것 — ㄹ 탈락도 저절로 맞는다).
 *  서술이 아닌 이름(「전갱이 1마리」 · 「덕장 주인과 대화」)은 「」로 감싸 그대로 둔다.
 */

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

/** 마지막 글자가 한글이고 받침이 있는가(숫자 · 라틴은 받침 없는 셈 — 「1마리」는 「는 · 가」) */
export function hasBatchim(s: string): boolean {
  if (!s) return false;
  const c = s.charCodeAt(s.length - 1);
  if (c < HANGUL_BASE || c > HANGUL_END) return false;
  return (c - HANGUL_BASE) % 28 !== 0;
}

/** 조사 고르기 — `withBatchim`은 받침 있을 때(은 · 이 · 과), `without`은 없을 때(는 · 가 · 와) */
export function particle(s: string, withBatchim: string, without: string): string {
  return hasBatchim(s) ? withBatchim : without;
}

/**
 * 할 일 서술을 명사형으로. 「사이소에서 저가 릴대를 산다」 → 「사이소에서 저가 릴대를 사는 것」.
 * 서술이 아니면(끝이 「다」가 아니면) 「전갱이 1마리」 → 「「전갱이 1마리」」.
 */
export function objectiveNominalKo(label: string): string {
  const s = label.trim();
  if (!s.endsWith('다')) return `「${s}」`;
  if (s.endsWith('는다')) return `${s.slice(0, -2)}는 것`;
  const body = s.slice(0, -1);
  const last = body.charCodeAt(body.length - 1);
  if (last >= HANGUL_BASE && last <= HANGUL_END && (last - HANGUL_BASE) % 28 === 4) {
    // 받침 ㄴ(4)만 떼면 어간이다 — 「산다 → 사」 · 「올린다 → 올리」 · 「확인한다 → 확인하」
    return `${body.slice(0, -1)}${String.fromCharCode(last - 4)}는 것`;
  }
  // 「…이다」 같은 꼴 — 그대로 명사로
  return `「${s}」`;
}

export interface SpokenObjective {
  /** 할 일 문장(나레이션 목표 또는 라벨) */
  label: string;
  done: boolean;
  /** 세는 목표면 지금 · 목표 수(둘 다 있을 때만 괄호로 덧붙인다) */
  cur?: number;
  target?: number;
}

/** 둘은 「A과 B」 · 셋부터는 「A, B, 그리고 C」(「과」를 거듭 달면 읽기 무겁다) */
function joinKo(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]}${particle(items[0], '과', '와')} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, 그리고 ${items[items.length - 1]}`;
}

/**
 * 진행 상황을 1인칭 산문으로.
 *  - 다 했으면: 「할 일은 다 했다. 말을 다시 걸면 보고할 수 있다.」
 *  - 일부 했으면: 「A는 것과 B는 것은 끝냈다. 이제 C는 것이 남았다(지금 2/5).」
 *  - 아직 하나도 안 했으면: 「해야 할 것은 A는 것과 B는 것이다.」
 */
export function spokenProgressKo(items: SpokenObjective[]): string {
  const nom = (o: SpokenObjective): string => objectiveNominalKo(o.label);
  const count = (o: SpokenObjective): string =>
    o.target !== undefined && o.target > 1 && o.cur !== undefined ? `(지금 ${Math.min(o.cur, o.target)}/${o.target})` : '';
  const done = items.filter((o) => o.done);
  const left = items.filter((o) => !o.done);
  if (items.length === 0) return '';
  if (left.length === 0) return '할 일은 다 했다. 말을 다시 걸면 보고할 수 있다.';
  const parts: string[] = [];
  if (done.length > 0) {
    const d = joinKo(done.map(nom));
    parts.push(`${d}${particle(d, '은', '는')} 끝냈다.`);
  }
  const leftNom = left.map((o) => `${nom(o)}${count(o)}`);
  const l = joinKo(leftNom);
  const lastLeft = leftNom[leftNom.length - 1];
  const subj = particle(lastLeft.endsWith(')') ? lastLeft.slice(0, lastLeft.lastIndexOf('(')) : lastLeft, '이', '가');
  parts.push(done.length > 0 ? `이제 ${l}${subj} 남았다.` : `해야 할 것은 ${l}${subj === '이' ? '이다' : '다'}.`);
  return parts.join(' ');
}

/** 끝낸 것만 — 보고하는 자리(「A는 것과 B는 것은 끝냈다.」). 하나도 없으면 빈 문자열 */
export function spokenDoneKo(items: SpokenObjective[]): string {
  const done = items.filter((o) => o.done);
  if (done.length === 0) return '';
  const d = joinKo(done.map((o) => objectiveNominalKo(o.label)));
  return `${d}${particle(d, '은', '는')} 끝냈다.`;
}
