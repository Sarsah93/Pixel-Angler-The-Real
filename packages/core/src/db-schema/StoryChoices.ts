/**
 * @file StoryChoices.ts
 * @description 퀘스트 대화 선택지 데이터 (140차) — "수락/거절"이 아니라 **선택이 결과를 바꾼다**.
 *
 * 구조
 *  - 모든 퀘에는 선택지가 있다. 정의(`StoryQuestDef.choices`)가 없으면 `defaultChoicesFor(q)`가
 *    종류별 표준 세트를 만든다 — 메인은 톤 2종(결과 동일·우호도만), 서브는 **품삯 / 가르침 / 사양 /
 *    (친밀 전용) 청탁** 4종으로 보상 종류가 갈린다.
 *  - 손으로 쓴 세트는 `STORY_CHOICE_OVERRIDES` — Ch1 메인·라이벌(N18)·정옥선↔탁만수(N19)·
 *    입문 아크 첫 편들. 여기 없는 퀘는 표준 세트를 받는다(전 186퀘가 최소 3갈래).
 *  - 메인 제약(`validateStoryChoices`): xpMult·items·skillPoints·proficiencyLevelUp 금지, |affinity| ≤ 0.1.
 *    메인 스트림은 **톤·우호도·소액·평판**으로만 갈린다(사용자 지시).
 *
 * 문자열은 `[ko, en]`이 아니라 필드 쌍(labelKo/labelEn …)이다 — client `I18n.buildRuntimeDict`가
 * `allChoiceLines()`로 사전에 합류시킨다.
 */

import { TUNING } from '../config/tuning.js';
import type { ChoiceOutcome, ChoiceRequires, QuestChoiceDef, QuestChoiceSet, StoryQuestDef } from '../types/Story.js';
import type { SkillCategoryId } from '../types/Skills.js';
import { STORY_QUESTS } from './StoryQuestDatabase.js';

// ── 헬퍼 ──
const ch = (id: string, labelKo: string, labelEn: string, replyKo: string, replyEn: string,
  outcome: ChoiceOutcome, requires?: ChoiceRequires): QuestChoiceDef =>
  ({ id, labelKo, labelEn, replyKo, replyEn, outcome, requires });

/** 발주 톤 3종 — 결과 동일, 우호도만 미세 차이(§5-1 원안 그대로 데이터화) */
export function toneOfferChoices(kind: StoryQuestDef['kind']): QuestChoiceDef[] {
  const t = TUNING.affinity;
  const all = [
    ch('tone_blunt', '…알겠습니다.', '…Understood.', '그래.', 'Fine.', { affinity: t.toneBlunt }),
    ch('tone_honest', '솔직히 자신은 없지만, 해 보겠습니다.', 'Honestly, I\'m not sure I can — but I\'ll try.',
      '자신 없는 게 정상이다. 해 보는 게 일이야.', 'Not being sure is normal. Trying is the job.', { affinity: t.toneHonest }),
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
  return Math.round((q.xp * 12) / 100) * 100;
}

/**
 * 표준 완료 선택지.
 *  - 메인: 톤 2종 — 결과 동일(우호도 ±0.03).
 *  - 서브: 품삯(돈) / 가르침(숙련도 XP) / 사양(우호도·항구 신뢰) / 청탁(친밀 전용 — 스킬 포인트 1).
 */
export function defaultCompleteChoices(q: StoryQuestDef): QuestChoiceDef[] {
  if (q.kind === 'main') {
    return [
      ch('main_dutiful', '맡겨 주셔서 고맙습니다.', 'Thank you for trusting me with it.',
        '고맙긴. 다음 일이 있다.', 'Don\'t thank me. There\'s more work.', { affinity: 0.03 }),
      ch('main_blunt', '끝냈습니다.', 'Done.', '봤다.', 'I saw.', { affinity: 0 }),
    ];
  }
  const cat = lessonCategoryOf(q);
  const lessonXp = 12 + q.chapter * 6;
  return [
    ch('sub_pay', '품삯은 받겠습니다.', 'I\'ll take the pay.',
      '그래야지. 일은 일이다.', 'As you should. Work is work.', { coins: payChoiceCoins(q), affinity: -0.02 }),
    ch('sub_lesson', '돈 대신 요령을 하나 배우고 싶습니다.', 'Instead of money, teach me one trick.',
      '…눈이 있네. 잘 봐.', '…You have an eye. Watch closely.', { proficiency: { category: cat, xp: lessonXp }, affinity: 0.05 }),
    ch('sub_decline', '사양하겠습니다. 이웃 일인데요.', 'No need. We\'re neighbours.',
      '……. 그 말, 기억해 두지.', '……. I\'ll remember that.', { affinity: 0.12, harborRep: 3 }),
    ch('sub_favor', '친한 척 좀 해도 되죠? 뭐 더 없나요.', 'We\'re close enough, right? Anything else for me?',
      '뻔뻔한 것도 재주다. 이거 가져가.', 'Cheek is a talent too. Take this.', { skillPoints: 1, affinity: -0.03 },
      { affinityMin: 0.6 }),
  ];
}

// ─────────────────────────────────────────────
// 손으로 쓴 세트 — Ch1 메인 · 라이벌 · 정옥선↔탁만수 · 입문 아크
// ─────────────────────────────────────────────
export const STORY_CHOICE_OVERRIDES: Record<string, QuestChoiceSet> = {
  'M1-02': { complete: [
    ch('keep', '품삯, 고맙습니다.', 'The wages — thank you.', '네 돈이다. 아껴 써.', 'It\'s your money. Spend it carefully.', { affinity: 0.03 }),
    ch('give_back', '얼음값은 빼고 주세요. 반은 좌판에 두겠습니다.', 'Take out the ice money. Half stays with the stall.',
      '…쓸데없는 소리. 그래도 놓고 가라.', '…Nonsense. Leave it anyway.', { coins: -10000, affinity: 0.08, harborRep: 2 }),
  ] },
  'M1-04': { complete: [
    ch('retort', '그 대가 아깝다는 건, 네 손 얘기겠지.', '"Wasted" — you mean in your hands.',
      '…말은 잘한다. 낚아 봐라.', '…Big words. Catch something first.', { affinity: -0.06, flag: 'choice.rival_hot' }),
    ch('swallow', '…충고 고맙다고 해 둘게.', '…I\'ll call it advice, and thank you.',
      '충고 아니다. 그냥 사실이야.', 'Not advice. Just fact.', { affinity: 0.05, flag: 'choice.rival_cool' }),
  ] },
  'M1-06': { complete: [
    ch('accept_law', '낚싯대로 잡은 건 팔지 않겠습니다.', 'I won\'t sell what I catch on a rod.',
      '그게 시작이다. 잡는 법보다 먼저 배울 게 그거야.', 'That\'s the start. It comes before learning to catch.', { affinity: 0.05, seaRep: 0.5 }),
    ch('grumble', '규칙이 너무 빡빡한 거 아닙니까.', 'Isn\'t the rule too strict?',
      '빡빡해서 바다가 남은 거다.', 'Strict is why there\'s a sea left.', { affinity: -0.03 }),
  ] },
  'M1-08': { complete: [
    ch('thanks', '손에 맞습니다. 고맙습니다.', 'It fits my hands. Thank you.', '대는 그래야 대다.', 'A rod should.', { affinity: 0.04 }),
    ch('critic', '어깨끈이 좀 짧은데요.', 'The strap\'s a bit short.', '…길게 해 주지. 다음엔 네가 깎아.', '…I\'ll lengthen it. Next time you carve it.', { affinity: -0.02, flag: 'choice.pack_critic' }),
  ] },
  'M1-11': { complete: [
    ch('humble', '아직 배울 게 많습니다.', 'I still have much to learn.', '그 말 하는 놈이 오래 간다.', 'The ones who say that last.', { affinity: 0.05, harborRep: 2 }),
    ch('proud', '백팔십 일, 다 채웠습니다.', 'One hundred eighty days — done.', '채운 건 날짜지. 계원은 이제부터다.', 'You filled the days. Membership starts now.', { affinity: 0 }),
  ] },
  'N01-1': { complete: [
    ch('blueprint', '도면 받겠습니다. 제가 만들어 쓰죠.', 'I\'ll take the blueprint and build it.',
      '손재주는 손으로 배우는 거야.', 'Hands learn from hands.', { proficiency: { category: 'crafting', xp: 20 }, affinity: 0.05 }),
    ch('cash', '도면 말고 품삯으로 주세요.', 'Wages instead of the blueprint, please.', '…그래, 그것도 답이지.', '…Sure, that\'s an answer too.', { coins: 8000, affinity: -0.02 }),
    ch('gift_fish', '도다리는 그냥 드릴게요. 생일상이잖아요.', 'The flounder\'s a gift. It\'s a birthday table.',
      '바람이 좋은 쪽으로 불었네.', 'The wind blew the right way.', { affinity: 0.12, harborRep: 3 }),
  ] },
  'N02-1': { complete: [
    ch('lesson', '대 고치는 법을 알려 주세요.', 'Teach me how to mend a rod.',
      '보는 눈부터다. 이리 와.', 'The eye comes first. Come here.', { proficiency: { skillId: 'fish_cast', xp: 30 }, affinity: 0.06 }),
    ch('take_rod', '남는 대가 있으면 하나 주십시오.', 'If you have a spare rod, I\'ll take it.',
      '싼 거다. 그래도 대는 대야.', 'It\'s a cheap one. Still a rod.', { items: [{ id: 'inv_rod_budget', qty: 1 }], affinity: -0.02 }),
    ch('pay', '품삯으로 주세요.', 'Pay me in coin.', '그러지.', 'Alright.', { coins: 4000 }),
  ] },
  'N03-1': { complete: [
    ch('knot_lesson', '그 매듭, 저도 배우고 싶습니다.', 'That knot — I want to learn it too.',
      '선생님이 학생한테 배우는 날도 있는 거지.', 'Even a teacher learns from a student some days.', { proficiency: { skillId: 'gath_knot', xp: 25 }, affinity: 0.06 }),
    ch('pay', '품삯으로 주세요.', 'Pay me in coin.', '그러세.', 'Very well.', { coins: 6000 }),
    ch('point', '그동안 배운 걸 정리해 두셨죠? 저도 좀 보겨 주세요.', 'You kept notes of what you learned, right? Show me.',
      '…허, 눈치도 배웠구나. 가져가.', '…Ha, you learned to notice too. Take it.', { skillPoints: 1, affinity: 0.02 }, { affinityMin: 0.2 }),
  ] },
  'N04-1': { complete: [
    ch('join', '입부하겠습니다.', 'I\'ll join.', '낚으면 먹는다! 환영!', 'Catch it, eat it! Welcome!', { affinity: 0.1, xpMult: 1.1, flag: 'choice.club_joined' }),
    ch('decline_join', '동아리는 좀…', 'A club is… not really me.', '그럼 밥만 같이 먹어요.', 'Then just eat with us.', { affinity: -0.05, coins: 4000 }),
    ch('later', '생각해 볼게요.', 'Let me think about it.', '천천히요!', 'Take your time!', { affinity: 0.02 }),
  ] },
  'N18-1': { complete: [
    ch('compete', '다음엔 내가 더 큰 걸 낚는다.', 'Next time I\'ll land the bigger one.',
      '…그래. 그래야 재미지.', '…Good. That\'s what makes it fun.', { affinity: 0.06, xpMult: 1.1, flag: 'choice.rival_compete' }),
    ch('concede', '네가 낫더라. 인정.', 'You were better. Admitted.', '술은 내가 산다.', 'Drinks are on me.', { affinity: -0.04, coins: 5000 }),
    ch('ask_tip', '아까 그 챔질, 어떻게 한 거야.', 'That hook-set earlier — how did you do it?',
      '…한 번만 보여 준다.', '…I\'ll show you once.', { proficiency: { category: 'fishing', xp: 25 }, affinity: 0.03 }, { flag: 'choice.rival_cool' }),
  ] },
  'N19-1': { complete: [
    ch('relay_true', '할머니가 대나무 얘기를 하셨어요.', 'She talked about the bamboo.',
      '……그랬어? 그랬구나.', '……Did she? I see.', { affinity: 0.05, affinityOther: [{ npcId: 'okseon', delta: 0.1 }], flag: 'choice.n19_relay' }),
    ch('relay_soft', '별말씀 없으셨어요.', 'She didn\'t say much.', '…그렇지. 그 사람이 뭘.', '…Of course. What would she.', { affinity: -0.02, affinityOther: [{ npcId: 'okseon', delta: -0.05 }] }),
    ch('lesson', '대 깎는 거, 옆에서 봐도 될까요.', 'May I watch you carve?', '조용히만 있으면.', 'If you stay quiet.', { proficiency: { category: 'crafting', xp: 20 }, affinity: 0.04 }),
  ] },
  'N19-2': { complete: [
    ch('deliver', '편지, 그대로 전했습니다.', 'I delivered the letter as it was.', '…고맙다. 묻지 마라.', '…Thank you. Don\'t ask.', { affinity: 0.08, affinityOther: [{ npcId: 'tak_mansu', delta: 0.1 }], flag: 'choice.n19_letter' }),
    ch('read_first', '…사실 먼저 읽었습니다.', '…I read it first, actually.', '너.', 'You.', { affinity: -0.1, xpMult: 0.9 }),
    ch('refuse_read', '읽지 않았습니다. 그건 두 분 일이니까요.', 'I didn\'t read it. That\'s between you two.', '…똑똑한 애구나.', '…Smart kid.', { affinity: 0.1, harborRep: 2 }),
  ] },
  'N21-1': { complete: [
    ch('bounty', '구제 수매가로 받겠습니다.', 'I\'ll take the cull bounty.', '규정대로. 자.', 'By the book. Here.', { coins: 6000 }),
    ch('data', '개체 수 기록을 같이 보고 싶습니다.', 'I want to see the population records with you.',
      '보는 눈이 있네. 이 표를 봐.', 'You have an eye for it. Look at this table.', { proficiency: { category: 'gathering', xp: 20 }, affinity: 0.06 }),
    ch('volunteer', '수매가는 됐고, 다음에도 부르세요.', 'Keep the bounty. Call me next time.', '…그런 사람이 필요했어.', '…That\'s the kind of person we needed.', { affinity: 0.1, harborRep: 4 }),
  ] },
};

/** 퀘스트의 최종 선택지 세트 — 손으로 쓴 것 > 정의 > 표준 */
export function choicesFor(q: StoryQuestDef): { offer: QuestChoiceDef[]; complete: QuestChoiceDef[] } {
  const ov = STORY_CHOICE_OVERRIDES[q.id];
  const def = q.choices;
  return {
    offer: ov?.offer ?? def?.offer ?? toneOfferChoices(q.kind),
    complete: ov?.complete ?? def?.complete ?? defaultCompleteChoices(q),
  };
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
    for (const [stage, list] of [['offer', s.offer], ['complete', s.complete]] as const) {
      const ids = new Set<string>();
      if (list.length < 2) issues.push(`${q.id} ${stage}: 선택지 2개 미만`);
      for (const c of list) {
        if (ids.has(c.id)) issues.push(`${q.id} ${stage}: 중복 선택지 id ${c.id}`);
        ids.add(c.id);
        const o = c.outcome;
        if (o.flag && !o.flag.startsWith('choice.')) issues.push(`${q.id}/${c.id}: flag는 choice. 접두 필수`);
        if (o.xpMult !== undefined && (o.xpMult < 0.8 || o.xpMult > 1.3)) issues.push(`${q.id}/${c.id}: xpMult 범위(0.8~1.3) 밖`);
        if (o.affinity !== undefined && Math.abs(o.affinity) > 0.2) issues.push(`${q.id}/${c.id}: 우호도 변동 ±0.2 초과`);
        if (o.skillPoints && !(c.requires?.affinityMin !== undefined && c.requires.affinityMin >= 0.2)) {
          issues.push(`${q.id}/${c.id}: 스킬 포인트 보상은 우호도 조건(≥0.2) 필수`);
        }
        if (q.kind === 'main') {
          if (o.xpMult !== undefined && o.xpMult !== 1) issues.push(`${q.id}/${c.id}: 메인 xpMult 금지`);
          if (o.items?.length) issues.push(`${q.id}/${c.id}: 메인 아이템 보상 금지`);
          if (o.skillPoints) issues.push(`${q.id}/${c.id}: 메인 스킬 포인트 금지`);
          if (o.proficiencyLevelUp) issues.push(`${q.id}/${c.id}: 메인 숙련도 레벨업 금지`);
          if (o.affinity !== undefined && Math.abs(o.affinity) > 0.1) issues.push(`${q.id}/${c.id}: 메인 우호도 ±0.1 초과`);
        }
      }
    }
  }
  return issues;
}
