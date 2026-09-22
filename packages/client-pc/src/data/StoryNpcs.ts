/**
 * @file StoryNpcs.ts
 * @description 스토리 NPC 필드 배치 + 방문 장소 (134차 — Ch1 발주자 · 속초 심리스 맵)
 *
 * 좌표는 `sokcho_v2` 타일(1179×642). 씬이 배치 시 `nearestWalkable`로 스냅하므로 대략값이면 된다.
 * 앵커: 동명활어센터(587,154)=만복상회 좌판 · 방파제 입구 스폰(527,128) · 속초등대(566,84) · 영금정(572,88).
 *
 * ⚠ 138차 — 스프라이트는 **`characterOf(npcId)`로 인물마다 생성**한다(core `art/CharacterCast.ts`).
 *   166차 — 구 `tex`(gem NPC 5종 돌려막기) 필드를 삭제했고, 대신 `behavior`가 자유 행동을 정한다.
 *
 * 166차 앵커 이동 2건 — 낚시 행동은 **앵커 3x3 안에 물가 칸**이 있어야 한다.
 *   도현수(534,126)·강두철(541,118)은 주차장 한복판이라 반경 26타일 안에 물이 없었다(실측) →
 *   도현수 = 방파제 입구 앞 해안(534,151) · 강두철 = 동명항 안벽 모서리(567,138). N18-6 보고 트리거도 도현수를 따라간다.
 */
import type { StoryNpcBehavior } from '../scenes/field/FieldNpcSystem.js';
import type { CharAge, CharRole, CharSex } from '@tra/core';

export interface StoryNpcPlacement {
  npcId: string;
  /** WorldMap 지역 id */
  regionId: string;
  tx: number;
  ty: number;
  /**
   * 자유 행동(166차). `fishing`은 **낚시와 관계있는 인물에게만** — 좌판 상인이 낚시를 하고 있으면 틀린 그림이다.
   * 앵커 3x3(→5x5) 안에 물가가 없으면 런타임이 `wander`로 내린다.
   */
  behavior: StoryNpcBehavior;
  /** 서 있는 방향 (기본 정면) */
  facing?: 'down' | 'left' | 'right' | 'up';
}

export interface StoryPlace {
  /** 퀘스트 objective.placeKey */
  key: string;
  regionId: string;
  tx: number;
  ty: number;
  radiusTiles: number;
  labelKo: string;
}

/** 퀘스트가 활성일 때만 보이는 필드 상호작용 지점. 좌표는 월드 타일 기준이다. */
export interface StoryFieldTrigger {
  id: string;
  regionId: string;
  tx: number;
  ty: number;
  labelKo: string;
  /** 현재 actionKey의 몇 번째 목표와 연결되는가 */
  actionKey: string;
  questId: string;
  objectiveIndex: number;
  /** actionKey 3단계 중 어느 단계인가 */
  phase: number;
  /**
   * 167차 — 금색 점 대신 **사람이 서 있는** 트리거. 익명 인물은 role/sex/age로 얼굴을 만든다.
   * [F]로 말을 걸면 곧바로 장면이 시작되고, 장면 안에서는 각본의 `actorKey` 배우가 된다.
   */
  actor?: { actorKey: string; nameKo: string; nameEn?: string; role: CharRole; sex?: CharSex; age?: CharAge; facing?: 'down' | 'left' | 'right' | 'up' };
  /** 167차 — 이 사람에게 말을 걸면(대화창 행) 진행되는 단계. 점·배우 없이 대화로만 닿는다 */
  viaNpc?: string;
}

export const STORY_NPC_PLACEMENTS: StoryNpcPlacement[] = [
  // 정옥선 — 동명활어센터 좌판. 자리를 지키고 가끔 옆 칸에 다녀온다
  { npcId: 'okseon', regionId: 'gangwon_sokcho', tx: 584, ty: 158, behavior: 'stall' },
  // 어촌계장 — 안벽을 오가며 둘러본다
  { npcId: 'coop', regionId: 'gangwon_sokcho', tx: 591, ty: 160, behavior: 'patrol' },
  // 도현수 — 라이벌 낚시꾼. 방파제 입구 앞 해안에서 캐스팅을 반복한다
  { npcId: 'hyeonsu', regionId: 'gangwon_sokcho', tx: 534, ty: 151, behavior: 'fishing' },
  // 강두철 — "채비 못 묶는 척하던" 조합장. 안벽 모서리에서 초보처럼 낚시한다
  { npcId: 'kang_ducheol', regionId: 'gangwon_sokcho', tx: 567, ty: 138, behavior: 'fishing' },
  // 탁만수 — 죽간 장인. 좌판 옆을 오가며 둘러본다(낚시는 하지 않는다)
  { npcId: 'tak_mansu', regionId: 'gangwon_sokcho', tx: 560, ty: 150, behavior: 'wander' },
  // 배누리 — 영금정 구경 중
  { npcId: 'bae_nuri', regionId: 'gangwon_sokcho', tx: 562, ty: 92, behavior: 'wander' },
  // 바람 — 떠돌이. 뭔가를 찾듯 주변을 돈다
  { npcId: 'baram', regionId: 'gangwon_sokcho', tx: 520, ty: 134, behavior: 'wander' },
];

export const STORY_PLACES: StoryPlace[] = [
  { key: 'poi:yeonggeumjeong', regionId: 'gangwon_sokcho', tx: 572, ty: 88, radiusTiles: 6, labelKo: '영금정' },
  { key: 'poi:okseon-stall', regionId: 'gangwon_sokcho', tx: 584, ty: 158, radiusTiles: 3, labelKo: '정옥선 좌판 근처' },
  { key: 'poi:auction-ice-drop', regionId: 'gangwon_sokcho', tx: 605, ty: 154, radiusTiles: 2, labelKo: '경매장 얼음 하역 위치' },
];

/**
 * N18-6의 첫 단계. 인천 필드맵이 아직 준비 중인 개발 버전에서도 실제로
 * 검증할 수 있도록 현재 열려 있는 상업항 맵의 도매시장 후문에 배치한다.
 * 추후 인천 맵이 열리면 좌표만 옮기고 연출·세이브 계약은 유지한다.
 */
export const STORY_FIELD_TRIGGERS: StoryFieldTrigger[] = [
  // 167차 — 「위반 증거」 3단계. ① 경매장 동쪽 벽에 숨은 수상한 사람에게 말을 건다(→ 목격 컷씬) ·
  //  ② 경매장 앞 기록대의 수정된 명부를 살핀다 · ③ 도현수에게 말을 걸어 보고한다(대화창 행).
  //  ⚠ 무대는 속초 동명항 경매장(605,154 하역 위치 서쪽 건물). 인천 필드가 생기면 좌표만 옮긴다.
  {
    id: 'n18-6-origin-watch', regionId: 'gangwon_sokcho', tx: 592, ty: 154,
    labelKo: '수상한 사람에게 말을 건다', actionKey: 'label_violation_review', questId: 'N18-6', objectiveIndex: 1, phase: 0,
    actor: { actorKey: 's1', nameKo: '수상해 보이는 사람 1', nameEn: 'Suspicious person 1', role: 'drifter', sex: 'm', age: 'mid', facing: 'left' },
  },
  {
    id: 'n18-6-ledger-inspect', regionId: 'gangwon_sokcho', tx: 597, ty: 151,
    labelKo: '수정된 원산지 명부', actionKey: 'label_violation_review', questId: 'N18-6', objectiveIndex: 1, phase: 1,
  },
  {
    id: 'n18-6-report', regionId: 'gangwon_sokcho', tx: 534, ty: 151,
    labelKo: '도현수에게 증거 보고', actionKey: 'label_violation_review', questId: 'N18-6', objectiveIndex: 1, phase: 2,
    viaNpc: 'hyeonsu',
  },
];
