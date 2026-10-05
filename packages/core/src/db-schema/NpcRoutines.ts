/**
 * @file NpcRoutines.ts
 * @description 인물 일과 시간표 (214차).
 *
 * 갈래별 시간표(`NPC_ROUTINES`)와 인물 → 갈래 표(`STORY_NPC_ROUTINE`). 표에 없는 인물은 `always`(24시간 밖)다 —
 * 무대가 아직 없는 지역 인물에게 시간표를 지어 붙이지 않는다(무대가 열리는 차수에 정한다).
 */

import type { NpcRoutineDef, NpcRoutineKind } from '../types/NpcRoutine.js';

const h = (x: number): number => Math.round(x * 60);

export const NPC_ROUTINES: Record<NpcRoutineKind, NpcRoutineDef> = {
  market: { kind: 'market', shifts: [{ fromMin: h(3), toMin: h(19) }] },
  office: { kind: 'office', shifts: [{ fromMin: h(8), toMin: h(18) }], offDays: [0] },
  angler: { kind: 'angler', shifts: [{ fromMin: h(5), toMin: h(22) }] },
  day_angler: { kind: 'day_angler', shifts: [{ fromMin: h(6), toMin: h(18) }] },
  craft: { kind: 'craft', shifts: [{ fromMin: h(7), toMin: h(17) }] },
  kid: { kind: 'kid', shifts: [{ fromMin: h(8), toMin: h(19) }] },
  visitor: { kind: 'visitor', shifts: [{ fromMin: h(9), toMin: h(21) }] },
  always: { kind: 'always', shifts: [{ fromMin: 0, toMin: 1440 }] },
};

/**
 * 속초 무대 인물의 일과.
 *  - 정옥선(71 · 좌판) — 새벽 장에 나와 해 질 녘 좌판을 걷는다.
 *  - 어촌계 — 사무실 시간 · 일요일은 닫는다(문을 두드리면 당직이 받는다).
 *  - 도현수(라이벌) — 동트기 전부터 밤까지 방파제 입구.
 *  - 강두철(조합장) — 해 있을 때만 「초보 행세」 낚시.
 *  - 탁만수(78 · 죽간 장인) · 탁새벽(12) — 공방 시간 · 손녀는 할아버지 곁.
 *  - 배누리(17 · 낚시부) — 영금정 구경은 낮에서 저녁까지.
 *  - 바람(떠돌이) · 오세찬(해양환경 감시원 · 교대 근무) — **24시간 밖**.
 */
export const STORY_NPC_ROUTINE: Record<string, NpcRoutineKind> = {
  okseon: 'market',
  coop: 'office',
  hyeonsu: 'angler',
  kang_ducheol: 'day_angler',
  tak_mansu: 'craft',
  tak_saebyeok: 'kid',
  bae_nuri: 'visitor',
  baram: 'always',
  oh_sechan: 'always',
};

export function routineOfNpc(npcId: string): NpcRoutineDef {
  return NPC_ROUTINES[STORY_NPC_ROUTINE[npcId] ?? 'always'];
}
