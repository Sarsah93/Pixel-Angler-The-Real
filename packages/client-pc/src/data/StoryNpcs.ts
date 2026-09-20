/**
 * @file StoryNpcs.ts
 * @description 스토리 NPC 필드 배치 + 방문 장소 (134차 — Ch1 발주자 · 속초 심리스 맵)
 *
 * 좌표는 `sokcho_v2` 타일(1179×642). 씬이 배치 시 `nearestWalkable`로 스냅하므로 대략값이면 된다.
 * 앵커: 동명활어센터(587,154)=만복상회 좌판 · 방파제 입구 스폰(527,128) · 속초등대(566,84) · 영금정(572,88).
 *
 * ⚠ 138차 — 스프라이트는 **`characterOf(npcId)`로 인물마다 생성**한다(core `art/CharacterCast.ts`).
 *   구 `tex`(gem NPC 5종 돌려막기)는 배선에서 제외했고 필드만 남아 있다.
 */

export interface StoryNpcPlacement {
  npcId: string;
  /** WorldMap 지역 id */
  regionId: string;
  tx: number;
  ty: number;
  /**
   * @deprecated 138차 — 인물 외형은 `characterOf(npcId)`가 만든다. 이 필드는 배선에서 제외됐고
   * (gem NPC 텍스처 5장으로 38인을 돌려막던 잔재) 참조만 남긴다.
   */
  tex: string;
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
}

export const STORY_NPC_PLACEMENTS: StoryNpcPlacement[] = [
  { npcId: 'okseon', regionId: 'gangwon_sokcho', tx: 584, ty: 158, tex: 'ts_gem_npc_fish_vendor' },
  { npcId: 'coop', regionId: 'gangwon_sokcho', tx: 591, ty: 160, tex: 'ts_gem_npc_police' },
  { npcId: 'hyeonsu', regionId: 'gangwon_sokcho', tx: 534, ty: 126, tex: 'ts_gem_npc_tourist_f' },
  { npcId: 'kang_ducheol', regionId: 'gangwon_sokcho', tx: 541, ty: 118, tex: 'ts_gem_npc_grandfather' },
  { npcId: 'tak_mansu', regionId: 'gangwon_sokcho', tx: 560, ty: 150, tex: 'ts_gem_npc_grandfather' },
  { npcId: 'bae_nuri', regionId: 'gangwon_sokcho', tx: 562, ty: 92, tex: 'ts_gem_npc_tourist_f' },
  { npcId: 'baram', regionId: 'gangwon_sokcho', tx: 520, ty: 134, tex: 'ts_gem_npc_father_kid' },
];

export const STORY_PLACES: StoryPlace[] = [
  { key: 'poi:yeonggeumjeong', regionId: 'gangwon_sokcho', tx: 572, ty: 88, radiusTiles: 6, labelKo: '영금정' },
];

/**
 * N18-6의 첫 단계. 인천 필드맵이 아직 준비 중인 개발 버전에서도 실제로
 * 검증할 수 있도록 현재 열려 있는 상업항 맵의 도매시장 후문에 배치한다.
 * 추후 인천 맵이 열리면 좌표만 옮기고 연출·세이브 계약은 유지한다.
 */
export const STORY_FIELD_TRIGGERS: StoryFieldTrigger[] = [
  {
    id: 'n18-6-origin-watch', regionId: 'gangwon_sokcho', tx: 536, ty: 132,
    labelKo: '도매시장 후문 · 수상한 사람', actionKey: 'label_violation_review', questId: 'N18-6', objectiveIndex: 1, phase: 0,
  },
  {
    id: 'n18-6-ledger-inspect', regionId: 'gangwon_sokcho', tx: 554, ty: 136,
    labelKo: '수정된 원산지 명부', actionKey: 'label_violation_review', questId: 'N18-6', objectiveIndex: 1, phase: 1,
  },
  {
    id: 'n18-6-report', regionId: 'gangwon_sokcho', tx: 534, ty: 126,
    labelKo: '도현수에게 증거 보고', actionKey: 'label_violation_review', questId: 'N18-6', objectiveIndex: 1, phase: 2,
  },
];
