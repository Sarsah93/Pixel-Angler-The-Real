/**
 * @file StoryTalkKit.ts
 * @description 254차 — 이어지는 대화(갈래) 데이터를 쓰는 도우미. 묶음 파일(`StoryTalk*.ts`)이 이것만 쓴다.
 *
 * - `say(한, 영, [답…], 말하는 사람?)` = 대화 한 단계(상대 대사 + 고를 말).
 * - `opt(id, 한, 영, { next | end, aff, flags, stance, requires })` = 고를 말 하나.
 * - `endTalk({ accept | decline | complete | ending, lineKo, lineEn })` = 끝.
 * 규칙(입장 · 우호도 폭 · 글 규칙)은 `rules/StoryTalk.ts` `validateTalks`가 본다.
 */

import type {
  TalkActBeat, TalkActId, TalkBeat, TalkChoiceDef, TalkEndDef, TalkGate, TalkGiveBeat, TalkLineBeat, TalkNodeDef, TalkStance,
} from '../types/Story.js';

export interface OptExtra {
  next?: string;
  end?: TalkEndDef;
  stance?: TalkStance;
  /** 사람마다 우호도 증감 — { okseon: 0.05, tak_mansu: -0.03 } */
  aff?: Readonly<Record<string, number>>;
  flags?: readonly string[];
  requires?: TalkGate;
  /** 286차 — 고른 뒤 실제로 하는 말(라벨과 다를 때) · 여자 주인공일 때 */
  say?: readonly [string, string];
  sayF?: readonly [string, string];
  /** 286차 — 일지 한 문장 [한, 영] */
  note?: readonly [string, string];
}

/** 고를 말 하나 */
export function opt(id: string, labelKo: string, labelEn: string, x: OptExtra): TalkChoiceDef {
  return {
    id, labelKo, labelEn,
    ...(x.stance ? { stance: x.stance } : {}),
    ...(x.aff ? { affinity: x.aff } : {}),
    ...(x.flags ? { flags: x.flags } : {}),
    ...(x.requires ? { requires: x.requires } : {}),
    ...(x.next ? { next: x.next } : {}),
    ...(x.end ? { end: x.end } : {}),
    ...(x.say ? { sayKo: x.say[0], sayEn: x.say[1] } : {}),
    ...(x.sayF ? { sayKoF: x.sayF[0], sayEnF: x.sayF[1] } : {}),
    ...(x.note ? { noteKo: x.note[0], noteEn: x.note[1] } : {}),
  };
}

/** 대화 한 단계 — 말하는 사람이 대화 상대가 아니면 넷째 인자(`''` = 지문) */
export function say(lineKo: string, lineEn: string, choices: readonly TalkChoiceDef[], speaker?: string): TalkNodeDef {
  return { lineKo, lineEn, choices, ...(speaker !== undefined ? { speaker } : {}) };
}

/** 대화의 끝 */
export function endTalk(e: TalkEndDef): TalkEndDef {
  return e;
}

// ─────────────────────────────────────────────
// 286차 — 대본(주고받는 장면) 도우미
// ─────────────────────────────────────────────

/** 대사 한 줄 — `who` = 인물 id · `'player'` · `''`(지문). `act` = 말과 함께 하는 몸짓(겹치는 것만) */
export function line(who: string, ko: string, en: string, x: { act?: TalkActId; f?: readonly [string, string] } = {}): TalkLineBeat {
  return { kind: 'line', who, ko, en, ...(x.act ? { act: x.act } : {}), ...(x.f ? { koF: x.f[0], enF: x.f[1] } : {}) };
}

/** 몸짓 하나(말 없이) */
export function act(who: string, id: TalkActId, x: { to?: string; item?: string } = {}): TalkActBeat {
  return { kind: 'act', who, act: id, ...(x.to ? { to: x.to } : {}), ...(x.item ? { item: x.item } : {}) };
}

/** 장면 안에서 받는 것(처음 한 번만) */
export function give(from: string, x: Omit<TalkGiveBeat, 'kind' | 'from'>): TalkGiveBeat {
  return { kind: 'give', from, ...x };
}

/**
 * 장면 하나 — 대본(박자들) 뒤에 고를 말(`choices`) · 이어짐(`next`) · 끝(`end`) 중 하나.
 * `note` = 일지 한 문장 [한, 영].
 */
export function scene(beats: readonly TalkBeat[], then: { choices?: readonly TalkChoiceDef[]; next?: string; end?: TalkEndDef; note?: readonly [string, string] }): TalkNodeDef {
  return {
    lineKo: '', lineEn: '', beats,
    choices: then.choices ?? [],
    ...(then.next ? { next: then.next } : {}),
    ...(then.end ? { end: then.end } : {}),
    ...(then.note ? { noteKo: then.note[0], noteEn: then.note[1] } : {}),
  };
}
