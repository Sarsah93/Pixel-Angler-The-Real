/**
 * @file Talk286.test.ts
 * @description 286차 — 대본(주고받는 장면) 시험: 몸짓 표 · 말과 몸짓의 겹침 규칙 · 든 것(담배) · 받는 자리 거절 = 실패 · 「해녀의 딸」 시범.
 */
import { describe, expect, it } from 'vitest';
import { validateTalks, allTalkLines, offerTalkOf, objectiveTalkOf, completeTalkOf, talkNode, TALK_GIVE_AFFINITY_MAX } from './StoryTalk.js';
import { TALK_ACTS, talkActDef, talkActBlocks, talkActStep } from './TalkActs.js';
import { TALKS_N01 } from '../db-schema/StoryTalkN01.js';
import { line, act, give, scene, opt, endTalk } from '../db-schema/StoryTalkKit.js';
import { getStoryQuest } from '../db-schema/StoryQuestDatabase.js';
import type { StoryTalkDef, TalkBeat } from '../types/Story.js';

/** 시험용 받는 자리 대화 하나 — N01-5(서브 · 바람) 자리를 빌린다 */
function offerTalk(beats: TalkBeat[], extra: Partial<StoryTalkDef> = {}): StoryTalkDef {
  return {
    id: 't286_probe', questId: 'N01-5', at: 'offer', npcId: 'baram', start: 'start',
    nodes: { start: scene(beats, { end: endTalk({ accept: true }) }) },
    ...extra,
  };
}

describe('286차 — 몸짓 표', () => {
  it('입 · 두 손이 바쁜 몸짓은 말을 멈추고, 고개 · 시선은 말과 함께 한다', () => {
    for (const id of ['cig_light', 'cig_puff', 'cig_out', 'give', 'sigh', 'laugh', 'silence']) expect(talkActBlocks(id)).toBe(true);
    for (const id of ['nod', 'shake_head', 'look_away', 'look_sea', 'look_up', 'peer', 'receive']) expect(talkActBlocks(id)).toBe(false);
    expect(talkActBlocks('없는 몸짓')).toBe(true);   // 모르는 몸짓은 안전하게 막는다
  });

  it('몸짓마다 시간 · 한 · 영 지문이 있다', () => {
    for (const a of TALK_ACTS) {
      expect(a.ms).toBeGreaterThan(300);
      expect(a.captionKo.startsWith('(') && a.captionKo.endsWith(')')).toBe(true);
      expect(a.captionEn.length).toBeGreaterThan(3);
    }
    expect(new Set(TALK_ACTS.map((a) => a.id)).size).toBe(TALK_ACTS.length);
  });

  it('담배는 문 뒤에만 빨고 끈다 · 두 개비를 한꺼번에 물지 않는다', () => {
    expect(talkActStep(new Set(), 'cig_puff').issue).toBeTruthy();
    const lit = talkActStep(new Set(), 'cig_light');
    expect(lit.issue).toBeUndefined();
    expect(lit.held.has('cigarette')).toBe(true);
    expect(talkActStep(lit.held, 'cig_puff').issue).toBeUndefined();
    expect(talkActStep(lit.held, 'cig_light').issue).toBeTruthy();
    const out = talkActStep(lit.held, 'cig_out');
    expect(out.held.has('cigarette')).toBe(false);
    expect(talkActDef('cig_puff')?.sfx).toBe('exhale');
  });
});

describe('286차 — 대본 검사', () => {
  it('말과 함께 할 수 없는 몸짓을 대사에 붙이면 잡는다(내뿜으며 말하기)', () => {
    const t = offerTalk([line('baram', '그래.', 'Right.', { act: 'cig_puff' })]);
    expect(validateTalks([t]).some((s) => s.includes('말과 함께 할 수 없는 몸짓'))).toBe(true);
  });

  it('불붙이지 않고 내뿜으면 잡는다 · 갈래를 건너서도 따라간다', () => {
    const bad = offerTalk([act('baram', 'cig_puff'), line('baram', '그래.', 'Right.')]);
    expect(validateTalks([bad]).some((s) => s.includes('cigarette'))).toBe(true);
    // 앞 장면에서 불붙인 담배는 다음 장면에서도 물고 있다
    const ok: StoryTalkDef = {
      id: 't286_probe2', questId: 'N01-5', at: 'offer', npcId: 'baram', start: 'a',
      nodes: {
        a: scene([act('baram', 'cig_light'), line('baram', '그래.', 'Right.')], { next: 'b' }),
        b: scene([act('baram', 'cig_puff'), line('baram', '가 보게.', 'Go on.')], { end: endTalk({ accept: true }) }),
      },
    };
    expect(validateTalks([ok])).toEqual([]);
  });

  it('장면 속 마음은 큰 몸짓 하나까지(±0.3) · 메인은 거절하지 않는다', () => {
    const big = offerTalk([line('baram', '그래.', 'Right.'), give('baram', { affinity: { baram: TALK_GIVE_AFFINITY_MAX + 0.1 } })]);
    expect(validateTalks([big]).some((s) => s.includes('초과'))).toBe(true);
    const mainFail: StoryTalkDef = {
      id: 't286_probe3', questId: 'M1-02', at: 'offer', npcId: 'okseon', start: 'start',
      nodes: { start: scene([line('okseon', '그래.', 'Right.')], { end: endTalk({ fail: true }) }) },
    };
    expect(validateTalks([mainFail]).some((s) => s.includes('메인은'))).toBe(true);
  });

  it('고르는 말은 이어짐 · 끝과 같이 두지 않는다', () => {
    const t0 = offerTalk([line('baram', '그래.', 'Right.')]);
    // 대본 마디 표는 읽기 전용 — 고친 사본을 만든다
    const t = { ...t0, nodes: { ...t0.nodes, start: { ...t0.nodes.start, choices: [opt('x', '좋아요.', 'Sure.', { end: endTalk({ accept: true }) })] } } };
    expect(validateTalks([t]).some((s) => s.includes('고를 말을 두지 않는다'))).toBe(true);
  });
});

describe('286차 — 「해녀의 딸」 시범', () => {
  it('대본 넷이 깨끗하다', () => {
    expect(validateTalks(TALKS_N01)).toEqual([]);
    expect(TALKS_N01.map((t) => t.id)).toEqual(['n01_5_offer', 'n01_5_haesol', 'n01_5_sundeok', 'n01_5_complete']);
  });

  it('편은 딸 → 제주 갯것 셋 → 어머니 순서 · 받는 자리는 제주에서만', () => {
    const q = getStoryQuest('N01-5')!;
    expect(q.objectives.map((o) => o.kind)).toEqual(['talk', 'gather', 'talk']);
    expect(q.objectives[1].regionId).toBe('jeju');
    expect(q.ordered).toBe(true);
    expect(q.offerRegion).toBe('jeju');
    expect(objectiveTalkOf('N01-5', 0)?.npcId).toBe('kang_haesol');
    expect(objectiveTalkOf('N01-5', 2)?.npcId).toBe('bu_sundeok');
  });

  it('받는 자리 — 선수급이면 담배 한 갑 · 우호도 +0.25, 끝내 거절하면 실패', () => {
    const t = offerTalkOf('N01-5')!;
    const pro = talkNode(t, 'pro')!;
    const g = pro.beats!.find((b) => b.kind === 'give');
    expect(g && g.kind === 'give' && g.items?.[0]).toEqual({ id: 'inv_cigarette_pack', qty: 1 });
    expect(g && g.kind === 'give' && g.affinity?.baram).toBe(0.25);
    // 불붙이기 → 내뿜기 → (말) 순서 — 내뿜는 동안 말이 끼지 않는다
    const kinds = pro.beats!.map((b) => (b.kind === 'act' ? b.act : b.kind));
    expect(kinds.indexOf('cig_light')).toBeLessThan(kinds.indexOf('cig_puff'));
    expect(kinds[kinds.indexOf('cig_puff') + 1]).toBe('line');
    expect(talkNode(t, 'refuse')!.end?.fail).toBe(true);
    // 선택지는 고른 뒤 실제로 하는 말이 있다
    expect(talkNode(t, 'start')!.choices.every((c) => !!c.sayKo)).toBe(true);
  });

  it('끝내는 자리의 답은 편의 보상 답(가르침 · 품삯 · 사양)과 맞물린다', () => {
    const t = completeTalkOf('N01-5')!;
    const ends = Object.values(t.nodes).map((n) => n.end?.complete).filter(Boolean).sort();
    expect(ends).toEqual(['decline', 'lesson', 'pay']);
  });

  it('대사 · 지문 · 일지 문장이 영어 사전에 들어간다', () => {
    const ko = new Set(allTalkLines().map(([k]) => k));
    expect(ko.has('혹시, 자네가 좀 도와줄 수 있겠나?')).toBe(true);
    expect(ko.has('(한 모금 깊게 빨아들였다가, 후 — 하고 길게 내뿜는다.)')).toBe(true);
    expect(ko.has('선수급으로 잘하죠. 이래 봬도 어릴 때 수영을 많이 했었으니까요.')).toBe(true);
  });
});
