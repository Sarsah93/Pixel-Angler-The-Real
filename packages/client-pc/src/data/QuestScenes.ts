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
import { dialogueOf, NPC_IDLE } from './StoryDialogue.js';

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
};

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
 * 나레이션 층에서 장면을 조립한다.
 *  1 플레이어 혼잣말(서두 한 문장 또는 목표 문장) → 2 상대가 다가오거나 돌아본다 → 3 상대의 말 →
 *  4 내 말 → 5 (상대의 두 번째 말) → 6 닫는 혼잣말(`afterKo` 우선).
 */
export function generatedScene(q: StoryQuestDef, idx: number, ctx: QuestSceneCtx): QuestSceneDef {
  const o: StoryObjective = q.objectives[idx];
  const nar = narrativeOf(q.id);
  const dlg = dialogueOf(q.id);
  const npcId = o.npcId ?? q.giver ?? '';
  const npc = npcId ? getStoryNpc(npcId) : undefined;
  const onField = !!npcId && ctx.fieldNpcIds.includes(npcId);
  const label = nar?.objectives?.[idx] ?? o.labelKo;
  const intro = sentences(nar?.intro);
  const firstScene = q.objectives.findIndex((x) => x.kind === 'talk' || (!!x.manual && !x.actionKey)) === idx;
  const opening = firstScene && intro[0] ? intro[0] : `${label}.`;
  const myLine = intro[(idx + 1) % Math.max(1, intro.length)] ?? label;
  const npcLine1 = npcId === q.giver
    ? (nar?.progress ?? dlg.progress[0])
    : (NPC_IDLE[npcId]?.[0] ?? '…');
  const npcLine2 = npcId === q.giver ? dlg.offer[1]?.[0] : undefined;
  const closing = o.afterKo ?? intro[(idx + 2) % Math.max(1, intro.length)] ?? label;

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
      { kind: 'emote', who: 'npc', emote: idx === 0 ? 'surprise' : 'think', ms: 700 },
      { kind: 'say', who: 'npc', text: npcLine1, bubble: bubbleOf(npcLine1) },
      { kind: 'say', who: 'player', text: myLine, bubble: bubbleOf(myLine) },
    );
    if (npcLine2 && npcLine2 !== npcLine1) steps.push({ kind: 'say', who: 'npc', text: npcLine2, bubble: bubbleOf(npcLine2) });
  }
  steps.push(
    { kind: 'emote', who: 'player', emote: 'think', ms: 700 },
    { kind: 'say', who: 'player', thought: true, text: closing },
  );
  if (extras.length) steps.push({ kind: 'move', who: 'npc', dxTiles: 5, ms: 1000 }, { kind: 'fade', who: 'npc', alpha: 0, ms: 300 }, { kind: 'remove', who: 'npc' });
  return {
    id: `${q.id}#${idx}`,
    script: {
      id: `quest-${q.id}-${idx}`,
      placeKo: `${regionNameKo(q.region)} · ${q.titleKo}`,
      placeEn: `${regionNameEn(q.region)} · ${q.titleEn}`,
      steps,
    },
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
  // 생성 장면의 장소 자막 `지역 · 제목`은 사전이 구분자(` · `)로 분해해 번역한다(120차 규칙) —
  // 지역명·제목은 이미 사전에 있으므로 여기서 다시 내지 않는다.
  return out;
}
