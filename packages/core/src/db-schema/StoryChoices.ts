/**
 * @file StoryChoices.ts
 * @description 퀘스트 대화 선택지 데이터 (140차) — "수락/거절"이 아니라 **선택이 결과를 바꾼다**.
 *
 * 구조
 *  - 모든 퀘에는 선택지가 있다. 정의(`StoryQuestDef.choices`)가 없으면 `defaultChoicesFor(q)`가
 *    종류별 표준 세트를 만든다 — 메인은 톤 2종(결과 동일·우호도만), 서브는 **품삯 / 가르침 / 사양 /
 *    (친밀 전용) 청탁** 4종으로 보상 종류가 갈린다.
 *  - **141차**: 내용 기반 선택지는 전부 `StoryNarrative.ts`(186편)에 있다. 우선순위 = 나레이션 > 정의 > 표준.
 *    구 `STORY_CHOICE_OVERRIDES`(13편)는 나레이션으로 이관돼 비어 있다(호환용 export만 유지).
 *  - 보상은 **고르기 전에는 보이지 않는다**(대화창) — 응답 문장이 드러내고, 고르지 않은 답은 `???`.
 *    `payMult`는 표준 품삯 배율이라 `choicesFor`가 coins로 환산해 돌려준다.
 *  - 발주 정책(`once`/`event`)인 퀘는 발주 선택지에 `decline: true` 답이 하나 있어야 한다 — 없으면 표준 거절 답을 붙인다.
 *  - 메인 제약(`validateStoryChoices`): xpMult·skillPoints·proficiencyLevelUp 금지 · items는 **귀속만** · |affinity| ≤ 0.1.
 *    메인 스트림은 **톤·우호도·소액·평판·귀속 택1**로만 갈린다.
 *
 * 문자열은 `[ko, en]`이 아니라 필드 쌍(labelKo/labelEn …)이다 — client `I18n.buildRuntimeDict`가
 * `allChoiceLines()`로 사전에 합류시킨다.
 */

import { TUNING } from '../config/tuning.js';
import type { ChoiceOutcome, ChoiceRequires, QuestChoiceDef, QuestChoiceSet, StoryQuestDef } from '../types/Story.js';
import type { SkillCategoryId } from '../types/Skills.js';
import { STORY_QUESTS } from './StoryQuestDatabase.js';
import { narrativeOf } from './StoryNarrative.js';
import { questDifficulty, DIFFICULTY_PAY_MULT } from '../rules/QuestDifficulty.js';

// ── 헬퍼 ──
const ch = (id: string, labelKo: string, labelEn: string, replyKo: string, replyEn: string,
  outcome: ChoiceOutcome, requires?: ChoiceRequires): QuestChoiceDef =>
  ({ id, labelKo, labelEn, replyKo, replyEn, outcome, requires });

/** 발주 톤 3종 — 결과 동일, 우호도만 미세 차이(§5-1 원안 그대로 데이터화) */
export function toneOfferChoices(kind: StoryQuestDef['kind']): QuestChoiceDef[] {
  const t = TUNING.affinity;
  const all = [
    ch('tone_blunt', '…알겠습니다.', '…Understood.', '그래.', 'Fine.', { affinity: t.toneBlunt }),
    ch('tone_honest', '자신은 없는데, 해 보겠습니다.', 'Not sure I can, but I\'ll give it a go.',
      '자신 있어서 하는 사람이 어디 있나. 해 보면 돼.', 'Nobody starts sure. You just start.', { affinity: t.toneHonest }),
    ch('tone_joke', '제가 또 그런 건 잘하죠.', 'That happens to be my speciality.',
      '말은 잘하네.', 'You talk well, at least.', { affinity: t.toneJoke }),
  ];
  return kind === 'main' ? all.slice(0, 2) : all;
}

/** 목표 종류에서 '이 사람이 가르쳐 줄 기술'의 카테고리를 고른다 */
export function lessonCategoryOf(q: StoryQuestDef): SkillCategoryId {
  const kinds = new Set(q.objectives.map((o) => o.kind));
  if (kinds.has('craft')) return 'crafting';
  if (kinds.has('gather') || kinds.has('trap') || kinds.has('cull')) return 'gathering';
  if (kinds.has('butcher') || kinds.has('sashimi') || kinds.has('cook')) return 'life';
  if (kinds.has('sell') || kinds.has('earn')) return 'economy';
  if (kinds.has('boatTrip') || kinds.has('visit')) return 'driving';
  return 'fishing';
}

/** 서브 퀘 '품삯' 금액 — XP 표 값에 비례(Ch1 350xp → 4,200원 · Ch7 40,000xp → 480,000원) */
export function payChoiceCoins(q: StoryQuestDef): number {
  // 152차 — 난이도 배율. 대화로 끝나는 임무가 조업 임무와 같은 품삯을 받지 않는다.
  const mult = DIFFICULTY_PAY_MULT[questDifficulty(q).tier];
  return Math.round((q.xp * 12 * mult) / 100) * 100;
}

/**
 * 표준 완료 선택지.
 *  - 메인: 톤 2종 — 결과 동일(우호도 ±0.03).
 *  - 서브: 품삯(돈) / 가르침(숙련도 XP) / 사양(우호도·항구 신뢰) / 청탁(친밀 전용 — 스킬 포인트 1).
 */
export function defaultCompleteChoices(q: StoryQuestDef): QuestChoiceDef[] {
  if (q.kind === 'main') {
    return [
      ch('main_reflect', '끝냈습니다. 근데 이걸로 끝난 것 같지가 않네요.', 'Finished. Though it doesn\'t feel finished.',
        '원래 그래. 하나 끝나면 또 하나 생기고.', 'That\'s how it goes. One ends, another turns up.', { affinity: 0.03 }),
      ch('main_look', '다 했습니다. 이제 뭘 하면 됩니까?', 'All done. What now?',
        '급하기는. 발 닿는 데부터 보면 돼.', 'In a hurry, are you. Start with what\'s in front of you.', { affinity: 0 }),
    ];
  }
  const cat = lessonCategoryOf(q);
  const lessonXp = 12 + q.chapter * 6;
  return [
    ch('sub_pay', '품삯은 챙기겠습니다.', 'I\'ll take the pay.',
      '그럼. 일했으면 받아야지.', 'Of course. You worked, you get paid.', { coins: payChoiceCoins(q), affinity: -0.02 }),
    ch('sub_lesson', '돈 말고, 요령이나 하나 알려주세요.', 'Keep the money — show me a trick instead.',
      '…눈썰미는 있네. 잘 봐라.', '…You\'ve got an eye. Watch close.', { proficiency: { category: cat, xp: lessonXp }, affinity: 0.05 }),
    ch('sub_decline', '됐습니다. 이웃끼리 뭘요.', 'Forget it. We\'re neighbours.',
      '……. 그 말은 안 잊는다.', '……. I won\'t forget you said that.', { affinity: 0.12, harborRep: 3 }),
    ch('sub_favor', '우리 사이에 이거면 섭섭하죠. 더 없어요?', 'After all this? Come on, what else have you got?',
      '뻔뻔한 것도 재주다. 가져가라.', 'Cheek is a talent too. Here, take it.', { skillPoints: 1, affinity: -0.03 },
      { affinityMin: 0.6 }),
  ];
}

// ─────────────────────────────────────────────
// 손으로 쓴 세트 — Ch1 메인 · 라이벌 · 정옥선↔탁만수 · 입문 아크
// ─────────────────────────────────────────────
/** @deprecated 141차 — 손글 세트는 전부 `StoryNarrative`로 이관됐다. 호환용으로 빈 객체만 남긴다 */
export const STORY_CHOICE_OVERRIDES: Record<string, QuestChoiceSet> = {};

/** 표준 거절 답 — once/event 정책 퀘에 데이터가 거절 답을 안 실었을 때 붙는다 */
export const DEFAULT_DECLINE: QuestChoiceDef = ch('decline', '지금은 못 하겠습니다.', 'I can\'t do it right now.',
  '…그래. 알았다.', '…Right. Fair enough.', { decline: true, affinity: -0.03 });

/** payMult(표준 품삯 배율)를 coins로 환산한 사본 — 데이터는 배율만 알고 금액은 퀘스트 XP에서 온다 */
function materialize(q: StoryQuestDef, c: QuestChoiceDef): QuestChoiceDef {
  const o = c.outcome;
  if (o.payMult === undefined) return c;
  const { payMult, ...rest } = o;
  return { ...c, outcome: { ...rest, coins: (rest.coins ?? 0) + Math.round((payChoiceCoins(q) * payMult) / 100) * 100 } };
}

/**
 * 퀘스트의 최종 선택지 세트 — **나레이션(141차) > 정의 > 표준**.
 *  - 발주: once/event 정책이면 거절 답을 보장한다.
 *  - 완료: `payMult`를 금액으로 환산한다.
 */
export function choicesFor(q: StoryQuestDef): { offer: QuestChoiceDef[]; complete: QuestChoiceDef[] } {
  const n = narrativeOf(q.id);
  const def = q.choices;
  let offer = n?.offerChoices ?? def?.offer ?? toneOfferChoices(q.kind);
  if ((q.offerPolicy === 'once' || q.offerPolicy === 'event') && !offer.some((c) => c.outcome.decline)) offer = [...offer, DEFAULT_DECLINE];
  const complete = (n?.complete ?? def?.complete ?? defaultCompleteChoices(q)).map((c) => materialize(q, c));
  return { offer: offer.map((c) => materialize(q, c)), complete };
}

/** 이 퀘스트의 선택지가 손으로 쓴(내용 기반) 것인가 — 아티팩트·일지 표기용 */
export function hasCustomChoices(q: StoryQuestDef): boolean {
  const n = narrativeOf(q.id);
  return !!(n?.complete || n?.offerChoices || q.choices);
}

/** 선택지 노출 판정 컨텍스트 */
export interface ChoiceCtx { affinity: number; level: number; licenses: readonly string[]; hasFlag: (k: string) => boolean }

export function choiceVisible(c: QuestChoiceDef, ctx: ChoiceCtx): boolean {
  const r = c.requires;
  if (!r) return true;
  if (r.affinityMin !== undefined && ctx.affinity < r.affinityMin) return false;
  if (r.affinityMax !== undefined && ctx.affinity > r.affinityMax) return false;
  if (r.level !== undefined && ctx.level < r.level) return false;
  if (r.license && !ctx.licenses.includes(r.license)) return false;
  if (r.flag && !ctx.hasFlag(r.flag)) return false;
  if (r.notFlag && ctx.hasFlag(r.notFlag)) return false;
  return true;
}

/** 결과 미리보기 한 줄(ko) — 데이터에 hintKo가 없을 때 outcome에서 만든다 */
export function describeOutcomeKo(o: ChoiceOutcome): string {
  const parts: string[] = [];
  if (o.coins) parts.push(`${o.coins > 0 ? '+' : ''}${o.coins.toLocaleString()}원`);
  if (o.xpMult && o.xpMult !== 1) parts.push(`경험치 ×${o.xpMult}`);
  if (o.items?.length) parts.push(`아이템 ${o.items.length}종`);
  if (o.skillPoints) parts.push(`스킬 포인트 +${o.skillPoints}`);
  if (o.proficiency) parts.push(`숙련도 +${o.proficiency.xp}`);
  if (o.proficiencyLevelUp) parts.push('숙련도 1레벨');
  if (o.affinity) parts.push(`우호도 ${o.affinity > 0 ? '+' : ''}${o.affinity}`);
  if (o.affinityOther?.length) parts.push('다른 이 우호도');
  if (o.harborRep) parts.push(`항구 신뢰 +${o.harborRep}`);
  if (o.seaRep) parts.push(`바다 평판 +${o.seaRep}`);
  return parts.join(' · ');
}

/** 사전 합류용 — 모든 선택지 문자열 [ko, en] */
export function allChoiceLines(): [string, string][] {
  const out: [string, string][] = [];
  const push = (c: QuestChoiceDef): void => { out.push([c.labelKo, c.labelEn], [c.replyKo, c.replyEn]); };
  for (const q of STORY_QUESTS) { const s = choicesFor(q); s.offer.forEach(push); s.complete.forEach(push); }
  return out;
}

/**
 * 무결성 — 메인 제약 · id 유일 · flag 접두 · xpMult 범위 · 친밀 전용 보상.
 * 문제 없으면 빈 배열(dev 부팅 시 `validateStoryQuests`와 함께 경고).
 */
export function validateStoryChoices(): string[] {
  const issues: string[] = [];
  for (const q of STORY_QUESTS) {
    const s = choicesFor(q);
    if ((q.offerPolicy === 'once' || q.offerPolicy === 'event') && !s.offer.some((c) => c.outcome.decline)) {
      issues.push(`${q.id}: ${q.offerPolicy} 정책인데 거절 선택지가 없다`);
    }
    for (const [stage, list] of [['offer', s.offer], ['complete', s.complete]] as const) {
      const ids = new Set<string>();
      if (list.length < 2) issues.push(`${q.id} ${stage}: 선택지 2개 미만`);
      for (const c of list) {
        if (ids.has(c.id)) issues.push(`${q.id} ${stage}: 중복 선택지 id ${c.id}`);
        ids.add(c.id);
        const o = c.outcome;
        if (o.flag && !o.flag.startsWith('choice.')) issues.push(`${q.id}/${c.id}: flag는 choice. 접두 필수`);
        if (o.decline && stage !== 'offer') issues.push(`${q.id}/${c.id}: decline은 발주 선택지에만`);
        if (o.payMult !== undefined) issues.push(`${q.id}/${c.id}: payMult가 환산되지 않았다`);
        for (const it of o.items ?? []) if (it.id.startsWith('qr_') && !it.bound) issues.push(`${q.id}/${c.id}: qr_ 장비는 귀속이어야 한다`);
        if (o.xpMult !== undefined && (o.xpMult < 0.8 || o.xpMult > 1.3)) issues.push(`${q.id}/${c.id}: xpMult 범위(0.8~1.3) 밖`);
        if (o.affinity !== undefined && Math.abs(o.affinity) > 0.2) issues.push(`${q.id}/${c.id}: 우호도 변동 ±0.2 초과`);
        if (o.skillPoints && !(c.requires?.affinityMin !== undefined && c.requires.affinityMin >= 0.2)) {
          issues.push(`${q.id}/${c.id}: 스킬 포인트 보상은 우호도 조건(≥0.2) 필수`);
        }
        if (q.kind === 'main') {
          if (o.xpMult !== undefined && o.xpMult !== 1) issues.push(`${q.id}/${c.id}: 메인 xpMult 금지`);
          if (o.items?.some((i) => !i.bound)) issues.push(`${q.id}/${c.id}: 메인 선택지 아이템은 귀속(택1)만`);
          if (o.skillPoints) issues.push(`${q.id}/${c.id}: 메인 스킬 포인트 금지`);
          if (o.proficiencyLevelUp) issues.push(`${q.id}/${c.id}: 메인 숙련도 레벨업 금지`);
          if (o.affinity !== undefined && Math.abs(o.affinity) > 0.1) issues.push(`${q.id}/${c.id}: 메인 우호도 ±0.1 초과`);
        }
      }
    }
  }
  return issues;
}
