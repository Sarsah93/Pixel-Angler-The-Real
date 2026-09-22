/**
 * @file QuestScenes.ts
 * @description 퀘스트 목표 장면(167차) — 「클릭만 하면 닫히는 목표」를 전부 컷씬으로 바꾼다.
 *
 * 배경(사용자 지시 2026-09-22): "유저가 특정 행동을 하지 않아도 그냥 클릭만 해도 클리어되거나, 보상을
 * 단순 지급하고 있어. … 퀘스트 자체에 부여된 스토리를 컷씬 연출 등으로 표현해야 함."
 *
 * 실측(dist 기준) — 186퀘 342목표 중 **장면으로만 닫히는 목표 100건** = `talk` 79 + 시스템 없는 수동 목표 21
 * (boatTrip 9 · furnish 3 · survive 2 · holdPosition 2 · mine 2 · farm 2 · deliverFree 1).
 * 손으로 100편을 쓰지 않는다 — 각 편은 이미 **나레이션 층(StoryNarrative)** 에 인물의 말·1인칭 서두·에필로그가
 * 있으므로, 이 파일은 그 글을 배우·동선·말풍선·감정으로 **무대에 올리는 규칙**만 갖는다.
 * 손글 각본이 필요한 편(N18-6 목격 등)은 `QUEST_SCENE_OVERRIDES`가 우선한다.
 *
 * 무대 규칙
 *  - 상대 인물(`talk`면 그 사람, 나머지는 발주자)이 이 지역 필드에 있으면 그 사람이 배우다.
 *  - 없으면 **임시 배우**(`extras`)로 같은 얼굴(`characterOf`)을 플레이어 옆에 세운다 — 멀리서 걸어와
 *    말을 붙이고, 장면이 끝나면 사라진다. 아무도 없는데 대사창만 흐르는 165차 폴백은 쓰지 않는다.
 *  - 긴 대사는 머리 위 말풍선에 `...`만 띄우고 본문은 아래 대사창이 맡는다(사용자 각본의 교차 말풍선).
 *
 * ⚠ 대사는 플레이어가 읽는 말이다 — 내부 id·구조 명칭을 쓰지 않는다(AGENTS §8-9).
 */

import {
  getStoryNpc, getStoryQuest, narrativeOf, WORLD_NODE_DATABASE,
  type StoryQuestDef, type StoryObjective, type CharAge, type CharRole, type CharSex,
} from '@tra/core';
import type { CineDir, CineScript, CineStep } from '../ui/StoryCinematicPanel.js';
import { dialogueOf } from './StoryDialogue.js';

/** 장면이 무대에 세우는 임시 배우 */
export interface SceneExtra {
  /** 각본의 배우 키 */
  key: string;
  /** 실제 인물이면 그 id(얼굴은 `characterOf(npcId)`), 익명 인물이면 role/sex/age */
  npcId?: string;
  nameKo: string;
  nameEn?: string;
  role?: CharRole;
  sex?: CharSex;
  age?: CharAge;
  /** 배치 — 절대 타일 또는 플레이어 기준 상대 타일 */
  tx?: number;
  ty?: number;
  dx?: number;
  dy?: number;
  facing?: CineDir;
  /** 등장 전 투명(멀리서 나타나는 연출) */
  alpha?: number;
}

export interface QuestSceneDef {
  id: string;
  script: CineScript;
  /** 각본 배우 키 → 실제 인물 id(`'player'` 포함). 임시 배우는 `extras`의 key와 같다 */
  roles: Record<string, string>;
  extras: SceneExtra[];
}

export interface QuestSceneCtx {
  /** 지금 서 있는 곳 (장소 자막) — 퀘스트가 적어 둔 무대가 아니라 실제 화면의 장소를 쓴다 */
  placeKo?: string;
  placeEn?: string;
  regionId: string;
  /** 이 필드에 실제로 서 있는 스토리 인물 */
  fieldNpcIds: readonly string[];
}

/** 각본 손글 우선 — 키 `${questId}#${objectiveIndex}` */
export const QUEST_SCENE_OVERRIDES: Record<string, (q: StoryQuestDef, idx: number, ctx: QuestSceneCtx) => QuestSceneDef> = {
  // M1-01 ③ 정옥선에게 고민을 털어놓는다 — 첫 퀘스트라 손글로 둔다(할머니가 먼저 말을 건다).
  'M1-01#2': (q, idx, ctx) => {
    const base = generatedScene(q, idx, ctx);
    base.script = {
      id: base.script.id, placeKo: '동명항 · 정옥선 좌판', placeEn: 'Dongmyeong Harbour · Ok-seon\'s stall',
      steps: [
        { kind: 'focus', who: 'npc', ms: 480 },
        { kind: 'faceTo', who: 'npc', target: 'player' },
        { kind: 'faceTo', who: 'player', target: 'npc' },
        { kind: 'say', who: 'npc', bubble: '...', text: '사진 속 기억을 찾으러 왔구나. 얼굴에 다 쓰여 있다.', textEn: 'You came looking for the memory in that photo. It is written all over your face.' },
        { kind: 'emote', who: 'player', emote: 'sad', ms: 800 },
        { kind: 'say', who: 'player', bubble: '...', text: '부모님이랑 왔던 자리예요. 이제 저 혼자인데, 어디서부터 시작해야 할지 모르겠어요.', textEn: 'I came here with my parents. Now it is just me, and I do not know where to start.' },
        { kind: 'say', who: 'npc', bubble: '...', text: '울고 싶으면 울어도 된다. 다만 손은 놀리지 마라. 네가 할 수 있는 일부터 같이 해 보자.', textEn: 'Cry if you need to. Just keep your hands busy. Let us start with what you can do.' },
        { kind: 'say', who: 'player', thought: true, text: '할머니가 먼저 손을 내밀어 주셨다. 여기서 시작하면 된다.', textEn: 'She reached out first. This is where I start.' },
      ],
    };
    return base;
  },

  // N19-1 ③ 정옥선의 반응을 본다 — 사용자 각본(168차).
  //  받침을 본 할머니가 말없이 마디를 쓸어 보고 얼음 상자를 올린다. 한 박자 끊긴 뒤
  //  툭 던지듯 "탁 영감이 주던가?" — 심부름꾼은 모르는 게 낫다.
  'N19-1#2': (q, idx, ctx) => {
    const base = generatedScene(q, idx, ctx);
    base.script = {
      id: base.script.id, placeKo: base.script.placeKo, placeEn: base.script.placeEn,
      steps: [
        { kind: 'focus', who: 'npc', ms: 520 },
        { kind: 'faceTo', who: 'npc', target: 'player' },
        { kind: 'faceTo', who: 'player', target: 'npc' },
        { kind: 'say', who: 'player', thought: true, text: '받침을 얼음 상자 옆에 놓고 왔다.', textEn: 'I left the tray beside the ice crate.' },
        { kind: 'emote', who: 'npc', emote: 'think', ms: 900 },
        { kind: 'say', who: 'player', thought: true, text: '할머니는 받침을 한참 봤다. 손으로 마디를 쓸어 보더니, 얼음 상자를 그 위에 올렸다.', textEn: 'She looked at it for a long time, ran a hand over the joints, then set the ice crate on top of it.' },
        { kind: 'wait', ms: 1200 },
        { kind: 'say', who: 'npc', bubble: '...', text: '탁 영감이 주던가?', textEn: 'Did old Tak give you this?' },
        { kind: 'say', who: 'player', bubble: '...', text: '…모르겠어요.', textEn: '…I would not know.' },
        { kind: 'say', who: 'player', thought: true, text: '두 노인 사이에 무슨 일이 있었는지 나는 모른다. 심부름꾼은 모르는 게 낫다.', textEn: 'Whatever passed between those two, I do not know. An errand boy is better off not knowing.' },
      ],
    };
    return base;
  },

  // M4-11 ② 두 노인을 태우고 출조 — 손님은 둘인데 강두철만 서 있었다(168차 사용자 지적).
  //  탁만수를 임시 배우로 함께 세우고, 나레이션은 혼잣말이 맡는다.
  'M4-11#1': (q, idx, ctx) => {
    const base = generatedScene(q, idx, ctx);
    const tak = getStoryNpc('tak_mansu');
    base.extras = [...base.extras.filter((e) => e.key !== 'tak'),
      { key: 'tak', npcId: 'tak_mansu', nameKo: tak?.nameKo ?? '탁만수', nameEn: tak?.nameEn, dx: 2, dy: 1, facing: 'left', alpha: 0 }];
    base.script = {
      id: base.script.id, placeKo: base.script.placeKo, placeEn: base.script.placeEn,
      steps: [
        { kind: 'say', who: 'player', thought: true, text: '동해안을 따라 하루 반. 부두에 강두철 조합장과 탁만수 노인이 서 있었다.', textEn: 'A day and a half up the coast. Kang Du-cheol and old Tak were standing on the pier.' },
        { kind: 'fade', who: 'tak', alpha: 1, ms: 360 },
        { kind: 'faceTo', who: 'npc', target: 'player' },
        { kind: 'faceTo', who: 'tak', target: 'player' },
        { kind: 'faceTo', who: 'player', target: 'npc' },
        { kind: 'say', who: 'npc', bubble: '...', text: '첫 손님이 우리라 미안하군. 값은 정가로 받게. 봐주지 말고.', textEn: 'Sorry your first fare is us. Charge the full price. No discounts.' },
        { kind: 'say', who: 'tak', bubble: '...', text: '…키 잡은 손이 제법이다.', textEn: '…Not bad, that hand on the wheel.' },
        { kind: 'say', who: 'player', thought: true, text: '두 사람은 나란히 앉아 아무 말 없이 바다를 봤다. 둘 다 한 마리씩 올렸다.', textEn: 'They sat side by side and watched the sea without a word. Each of them landed one.' },
        { kind: 'say', who: 'npc', bubble: '...', text: '…좋은 배야. 탁 씨도 그러네.', textEn: '…Good boat. Tak says so too.' },
        { kind: 'say', who: 'player', thought: true, text: '누구의 배도 아닌 내 배에서.', textEn: 'On my own boat. Nobody else\'s.' },
        { kind: 'fade', who: 'tak', alpha: 0, ms: 300 },
        { kind: 'remove', who: 'tak' },
      ],
    };
    return base;
  },

  // M6-05 ② 병실의 정옥선 — 조행록을 건네받는 장면인데 건네는 연출이 없었다(168차 사용자 지적).
  //  ⚠ 병실 실내 무대가 없어 지금 서 있는 곳에서 재생된다(백로그 — 실내 무대).
  'M6-05#1': (q, idx, ctx) => {
    const base = generatedScene(q, idx, ctx);
    base.script = {
      id: base.script.id, placeKo: base.script.placeKo, placeEn: base.script.placeEn,
      steps: [
        { kind: 'focus', who: 'npc', ms: 520 },
        { kind: 'faceTo', who: 'npc', target: 'player' },
        { kind: 'faceTo', who: 'player', target: 'npc' },
        { kind: 'say', who: 'player', thought: true, text: '간병 일정이 출조를 밀어낸다. 보호자 서명, 약 시간, 그리고 병원비.', textEn: 'The care schedule pushes the trips aside. Signatures, medication times, and the bills.' },
        { kind: 'say', who: 'npc', bubble: '...', text: '…왔구나. 앉아. 베개 밑에 있다.', textEn: '…You came. Sit. It is under the pillow.' },
        { kind: 'give', from: 'npc', to: 'player', item: 'book', ms: 900 },
        { kind: 'say', who: 'npc', bubble: '...', text: '조행록. 마지막 권. 네 아버지 거야. 나머지는 네가 써.', textEn: 'The log. The last volume. It was your father\'s. You write the rest.' },
        { kind: 'say', who: 'player', bubble: '...', text: '…나머지는 제가 쓰겠습니다.', textEn: '…I will write the rest.' },
        { kind: 'say', who: 'player', thought: true, text: '손이 떨렸다. 할머니 손도 내 손도.', textEn: 'Our hands were shaking. Hers and mine.' },
      ],
    };
    return base;
  },
};

/**
 * 장면에서 **플레이어가 소리 내어 하는 짧은 응답**.
 * ⚠ 나레이션 문장을 플레이어 입에 넣지 않는다 — 3인칭 서술을 말하면 혼잣말과 겹쳐 이질감이 난다
 *   (168차 사용자 지적: "'이름없는꾼' 멘트와 '혼잣말' 멘트가 겹치는 부분 때문에 이질감이 있네").
 */
const ACK_TASK: [string, string][] = [
  ['…알겠습니다.', '…Understood.'],
  ['해 보겠습니다.', 'I will try.'],
  ['가 보겠습니다.', 'I will go.'],
  ['그렇게 하죠.', 'I will do that.'],
];
const ACK_DONE: [string, string][] = [
  ['…네.', '…Yes.'],
  ['고맙습니다.', 'Thank you.'],
  ['…고맙습니다.', '…Thank you.'],
];

/** 편마다 같은 말이 반복되지 않게 — id로 결정적으로 고른다 */
function pickBy<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

/**
 * 이 문장은 **인물이 한 말**인가 — 나레이션 안에 섞인 직접화법을 닫는 혼잣말로 쓰면
 * NPC의 대사가 내 생각으로 나온다(168차 M7-04 「그 천막, 내 거다」·M1-06 「네가 잡은 건 네가 먹어라」).
 */
function speechLike(t: string): boolean {
  const body = t.replace(/[.!?…"'\u201d\u2019]+$/, '');
  // 구어체 종결어미로 끝나면 인물의 말이다. 나레이션은 문어체(…다) 또는 체언으로 끝난다.
  if (/(어|아|야|지|죠|요|네|군|나|니|까|게|라|봐|데|걸|든|마|자|거야|건가|던가)$/.test(body)) return true;
  if (/(^|[\s"'\u201c\u2018])(너|네가|자네|당신)([\s가는를이] |$)/.test(t)) return true;
  return /^["'\u201c\u2018]/.test(t);
}

const regionNameKo = (id: string): string => WORLD_NODE_DATABASE.find((n) => n.id === id)?.name ?? '';
const regionNameEn = (id: string): string => WORLD_NODE_DATABASE.find((n) => n.id === id)?.nameEn ?? '';

/** 1인칭 서두를 문장으로 쪼갠다 — 장면은 그중 한두 문장만 쓴다 */
function sentences(text: string | undefined): string[] {
  if (!text) return [];
  return text.split(/(?<=[.!?…])\s+/).map((t) => t.trim()).filter((t) => t.length >= 6 && t.length <= 90);
}

/** 긴 말은 말풍선에 `...`만 — 대사창이 본문을 맡는다 */
const bubbleOf = (text: string): string | undefined => (text.length > 18 ? '...' : undefined);

/**
 * 나레이션 층에서 장면을 조립한다 (168차 재작성 — 사용자 실플레이 지적 6건).
 *
 * 규칙
 *  1 **혼잣말**은 나레이션 문장이 맡는다(3인칭 서술이 자연스러운 자리).
 *  2 **NPC는 자기 대사가 있을 때만 말한다** — 발주자의 `offer`(첫 장면) / `done`(마지막 장면).
 *    발주자가 아니거나 쓸 대사가 없으면 **침묵**하고 `...` 말풍선과 몸짓만 남긴다.
 *    ⚠ 진행 중 재촉문(`progress`)을 장면에 쓰지 않는다 — 눈앞에 서 있는데 "아직 안 왔나"가 된다.
 *  3 **플레이어는 나레이션을 말하지 않는다** — 지시를 받았을 때만 짧게 답한다.
 *  4 장소 자막은 **지금 서 있는 곳**이다. 퀘스트 제목의 장소(병실·부산)를 쓰면 화면과 어긋난다.
 */
export function generatedScene(q: StoryQuestDef, idx: number, ctx: QuestSceneCtx): QuestSceneDef {
  const o: StoryObjective = q.objectives[idx];
  const nar = narrativeOf(q.id);
  const dlg = dialogueOf(q.id);
  const npcId = o.npcId ?? q.giver ?? '';
  const npc = npcId ? getStoryNpc(npcId) : undefined;
  const onField = !!npcId && ctx.fieldNpcIds.includes(npcId);
  const isGiver = !!npcId && npcId === q.giver;
  const label = nar?.objectives?.[idx] ?? o.labelKo;

  // 이 퀘스트의 장면 목표들 — 몇 번째 장면인지가 NPC 대사를 정한다
  const sceneIdx = q.objectives
    .map((x, i) => ((x.kind === 'talk' || (!!x.manual && !x.actionKey)) ? i : -1))
    .filter((i) => i >= 0);
  const nth = Math.max(0, sceneIdx.indexOf(idx));
  const firstScene = sceneIdx[0] === idx;
  const lastObjective = idx === q.objectives.length - 1;

  // ── 혼잣말 — 나레이션 문장을 장면 순서대로 나눠 쓴다 (직접화법은 건너뛴다) ──
  const lines = sentences(nar?.intro).filter((t) => !speechLike(t));
  const opening = lines[Math.min(nth, Math.max(0, lines.length - 1))] ?? `${label}.`;
  const closing = o.afterKo
    ?? lines.find((t) => t !== opening && lines.indexOf(t) > lines.indexOf(opening))
    ?? '';

  // ── NPC 대사 — 실재하는 말만. 없으면 침묵 ──
  let npcLine = '';
  if (isGiver) {
    // 이 대화가 퀘스트를 여는 자리면 「부탁」, 일을 마치고 돌아온 자리면 「확인」.
    if (firstScene && idx === 0) npcLine = nar?.offer ?? dlg.offer[0]?.[0] ?? '';
    else if (lastObjective) npcLine = nar?.done ?? dlg.done[0]?.[0] ?? '';
    else npcLine = dlg.offer[1]?.[0] ?? nar?.offer ?? '';
  }
  // 상대가 발주자가 아니면(심부름·목격) 그 인물의 대사는 데이터에 없다 — 말풍선만 띄운다.

  const steps: CineStep[] = [
    { kind: 'focus', who: 'player', ms: 440 },
    { kind: 'say', who: 'player', thought: true, text: opening },
  ];
  const extras: SceneExtra[] = [];
  const roles: Record<string, string> = { player: 'player' };
  if (npcId) {
    if (onField) {
      roles.npc = npcId;
      steps.push({ kind: 'focus', who: 'npc', ms: 520 });
    } else {
      // 이 지역에 없는 인물 — 멀리서 걸어와 말을 붙인다
      extras.push({ key: 'npc', npcId, nameKo: npc?.nameKo ?? npcId, nameEn: npc?.nameEn, dx: 6, dy: 0, facing: 'left', alpha: 0 });
      roles.npc = 'npc';
      steps.push({ kind: 'fade', who: 'npc', alpha: 1, ms: 320 }, { kind: 'move', who: 'npc', dxTiles: -4, ms: 1100 });
    }
    steps.push(
      { kind: 'faceTo', who: 'npc', target: 'player' },
      { kind: 'faceTo', who: 'player', target: 'npc' },
      { kind: 'emote', who: 'npc', emote: firstScene ? 'surprise' : 'think', ms: 700 },
    );
    if (npcLine) {
      steps.push({ kind: 'say', who: 'npc', text: npcLine, bubble: bubbleOf(npcLine) });
      const ack = pickBy(lastObjective ? ACK_DONE : ACK_TASK, `${q.id}#${idx}`);
      steps.push({ kind: 'say', who: 'player', text: ack[0], textEn: ack[1], bubble: bubbleOf(ack[0]) });
    } else {
      // 말없이 마주 본다 — 내용은 혼잣말이 맡는다
      steps.push({ kind: 'say', who: 'npc', text: '…', ms: 900, bubble: '...' });
    }
  }
  if (closing) {
    steps.push(
      { kind: 'emote', who: 'player', emote: 'think', ms: 700 },
      { kind: 'say', who: 'player', thought: true, text: closing },
    );
  }
  if (extras.length) steps.push({ kind: 'move', who: 'npc', dxTiles: 5, ms: 1000 }, { kind: 'fade', who: 'npc', alpha: 0, ms: 300 }, { kind: 'remove', who: 'npc' });
  const placeKo = ctx.placeKo || regionNameKo(ctx.regionId) || regionNameKo(q.region);
  const placeEn = ctx.placeEn || regionNameEn(ctx.regionId) || regionNameEn(q.region);
  return {
    id: `${q.id}#${idx}`,
    script: { id: `quest-${q.id}-${idx}`, placeKo, placeEn, steps },
    roles, extras,
  };
}

export function questSceneFor(questId: string, idx: number, ctx: QuestSceneCtx): QuestSceneDef | null {
  const q = getStoryQuest(questId);
  if (!q || !q.objectives[idx]) return null;
  const over = QUEST_SCENE_OVERRIDES[`${questId}#${idx}`];
  return over ? over(q, idx, ctx) : generatedScene(q, idx, ctx);
}

/** i18n 런타임 사전 — 손글 각본의 (한국어, 영어) 쌍 + 장소 자막 */
export function allQuestSceneLines(): [string, string][] {
  const out: [string, string][] = [];
  const ctx: QuestSceneCtx = { regionId: '', fieldNpcIds: [] };
  for (const key of Object.keys(QUEST_SCENE_OVERRIDES)) {
    const [qid, i] = key.split('#');
    const q = getStoryQuest(qid);
    if (!q) continue;
    const def = QUEST_SCENE_OVERRIDES[key](q, Number(i), ctx);
    if (def.script.placeEn) out.push([def.script.placeKo, def.script.placeEn]);
    for (const st of def.script.steps) if (st.kind === 'say' && st.textEn) out.push([st.text, st.textEn]);
  }
  // 생성 장면의 짧은 응답 — 이 파일이 원문을 갖는다
  out.push(...ACK_TASK, ...ACK_DONE);
  // 장소 자막은 지역명이라 이미 사전에 있다(120차 `places.ts`).
  return out;
}
