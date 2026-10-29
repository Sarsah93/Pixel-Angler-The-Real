/**
 * @file TalkActs.ts
 * @description 286차 — 대화 장면의 몸짓 표. 몸짓마다 「말과 함께 할 수 있는가」가 정해져 있다.
 *
 * 사용자 지시(원문): 「담배를 꺼내 문 상태에서, 연기를 내뿜을 때 실제로 사람이 말을 하면서 저 동작을 동시에 할 순 없잖아?
 *  다른 연출이 들어가더라도, 저런 연출이 나오고 있는데 갑자기 대화 코멘트가 열리거나 그러지 않았으면 한다는 말이야 …
 *  (물론, 말을 하면서 동시에 몸짓 연출이 들어갈 수 있는 부분들도 있겠지만)」.
 *
 *  - block   = 입이나 두 손이 바쁜 몸짓. 대화창은 그동안 새 말을 열지 않고(글 상자를 비우고 ▼도 숨긴다) 몸짓이 끝난 뒤 다음 줄을 찍는다.
 *              담배를 꺼내 불붙이기 · 빨았다 내뿜기 · 비벼 끄기 · 물건 건네기 · 한숨 · 웃음 · 말없이 있기.
 *  - overlap = 말하면서도 되는 몸짓. 그 말이 찍히는 동안 같이 한다 — 끄덕이기 · 고개 젓기 · 시선 돌리기 · 바다 보기 · 올려다보기 · 받아 들기.
 *  - 담배는 「든 것」이다 — 불붙이면 대화가 끝날 때까지 입에 물고 있고(말하는 동안 연기가 가늘게 오른다), 빨기 · 끄기는 물고 있어야 한다.
 * 그림 · 소리는 클라이언트(`scenes/field/DialogueStage.ts` — 필드 인물 위에 그린다). 여기는 순수 데이터와 판정만.
 */

import type { TalkActDef, TalkActId } from '../types/Story.js';

export const TALK_ACTS: readonly TalkActDef[] = [
  // ── 담배 ── 입이 바쁘다
  { id: 'cig_light', speech: 'block', ms: 2600, holds: 'cigarette', sfx: 'lighter',
    captionKo: '(담배를 한 개비 꺼내 물고, 라이터로 불을 붙인다.)', captionEn: '(He takes out a cigarette, puts it between his lips and lights it.)' },
  { id: 'cig_puff', speech: 'block', ms: 2400, needs: 'cigarette', sfx: 'exhale',
    captionKo: '(한 모금 깊게 빨아들였다가, 후 — 하고 길게 내뿜는다.)', captionEn: '(He draws deeply, then lets it out in a long breath — hoo.)' },
  { id: 'cig_out', speech: 'block', ms: 1100, needs: 'cigarette', drops: 'cigarette',
    captionKo: '(담배를 바닥에 비벼 끈다.)', captionEn: '(He grinds the cigarette out underfoot.)' },
  // ── 건네기 ── 두 손이 바쁘다 / 받는 쪽은 말하며 받을 수 있다
  { id: 'give', speech: 'block', ms: 1300,
    captionKo: '(무언가를 꺼내 건넨다.)', captionEn: '(He takes something out and holds it out.)' },
  { id: 'receive', speech: 'overlap', ms: 900,
    captionKo: '(건넨 것을 받아 든다.)', captionEn: '(Takes what is offered.)' },
  // ── 숨 · 웃음 · 침묵 ── 소리가 나는 몸짓이라 말과 겹치지 않는다
  { id: 'sigh', speech: 'block', ms: 1200, sfx: 'sigh',
    captionKo: '(한숨을 길게 내쉰다.)', captionEn: '(A long sigh.)' },
  { id: 'laugh', speech: 'block', ms: 1000,
    captionKo: '(짧게 웃는다.)', captionEn: '(A short laugh.)' },
  { id: 'silence', speech: 'block', ms: 1500,
    captionKo: '(잠시 말이 없다.)', captionEn: '(A silence.)' },
  // ── 고개 · 시선 ── 말하면서 한다
  { id: 'nod', speech: 'overlap', ms: 700, captionKo: '(고개를 끄덕인다.)', captionEn: '(A nod.)' },
  { id: 'shake_head', speech: 'overlap', ms: 800, captionKo: '(고개를 젓는다.)', captionEn: '(A shake of the head.)' },
  { id: 'look_away', speech: 'overlap', ms: 900, captionKo: '(시선을 돌린다.)', captionEn: '(Looks away.)' },
  { id: 'look_sea', speech: 'overlap', ms: 1200, captionKo: '(바다 쪽을 본다.)', captionEn: '(Looks out at the sea.)' },
  { id: 'look_up', speech: 'overlap', ms: 700, captionKo: '(고개를 든다.)', captionEn: '(Looks up.)' },
  { id: 'peer', speech: 'overlap', ms: 1000, captionKo: '(가까이 들여다본다.)', captionEn: '(Leans in for a closer look.)' },
];

const BY_ID = new Map(TALK_ACTS.map((a) => [a.id, a]));

export function talkActDef(id: TalkActId | string): TalkActDef | undefined {
  return BY_ID.get(id as TalkActId);
}

/** 말을 멈추고 기다리는 몸짓인가(없는 몸짓은 막는 쪽 — 안전) */
export function talkActBlocks(id: TalkActId | string): boolean {
  return talkActDef(id)?.speech !== 'overlap';
}

/** 몸짓 하나를 하고 난 뒤 든 것(담배) — 든 것이 맞지 않으면 문제 글 */
export function talkActStep(held: ReadonlySet<string>, id: TalkActId | string): { held: Set<string>; issue?: string } {
  const d = talkActDef(id);
  const next = new Set(held);
  if (!d) return { held: next, issue: `없는 몸짓 ${id}` };
  if (d.needs && !held.has(d.needs)) return { held: next, issue: `${id}: ${d.needs}을(를) 들고 있지 않다` };
  if (d.holds) {
    if (held.has(d.holds)) return { held: next, issue: `${id}: 이미 ${d.holds}을(를) 들고 있다` };
    next.add(d.holds);
  }
  if (d.drops) next.delete(d.drops);
  return { held: next };
}
