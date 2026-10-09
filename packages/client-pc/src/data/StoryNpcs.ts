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
  /**
   * 필드 배치 좌표(월드 타일).
   *
   * ⚠ 178차 — **없으면 그 인물은 필드에 세우지 않는다.** 아직 무대(필드맵)가 없는 지역의 인물은
   *   좌표를 지어낼 수 없으므로 `regionId`만 등록해 두고, 할 일 안내가 「다른 지역 — ○○」로
   *   길을 알려주는 데만 쓴다. 해당 지역 필드맵이 열릴 때 실측 좌표를 채우면 그때부터 선다.
   */
  tx?: number;
  ty?: number;
  /**
   * 자유 행동(166차). `fishing`은 **낚시와 관계있는 인물에게만** — 좌판 상인이 낚시를 하고 있으면 틀린 그림이다.
   * 앵커 3x3(→5x5) 안에 물가가 없으면 런타임이 `wander`로 내린다.
   * 좌표가 없는 등록에는 의미가 없다(기본 `wander`).
   */
  behavior?: StoryNpcBehavior;
  /** 서 있는 방향 (기본 정면) */
  facing?: 'down' | 'left' | 'right' | 'up';
  /**
   * 214차 — 일과 밖 시간에 머무는 곳의 **문 앞 칸**(월드 타일 · 건물 바로 아래 보도).
   * 일과(core `routineOfNpc`)가 「집」이면 인물은 일터에서 사라지고 이 문 앞에서 [F] 「문 두드리기」로 만난다.
   * 없으면 24시간 일터에 있다(떠돌이 · 감시원처럼 일부러 비운 경우 포함).
   * 좌표는 214차 탐색(건물 2칸 아래 보도 · 거래 문 3칸 밖)으로 고른 실측 칸이다.
   */
  home?: { tx: number; ty: number; labelKo: string };
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
  /** 235차 — 영어 이름표(i18n 짝) */
  labelEn?: string;
  /** 235차 — 일반 지점: [F]를 누르면 흐르는 혼잣말 두 줄. 장면이 끝나야 단계가 오른다(건너뛰어도 같다) */
  linesKo?: readonly [string, string];
  linesEn?: readonly [string, string];
  /** 235차 — 이 지점에서 받아 드는 심부름 물건(가방 자리가 없으면 단계가 오르지 않는다) */
  give?: string;
  /** 235차 — 이 지점에 내려놓는 심부름 물건(가방에서 빠진다) */
  take?: string;
}

export const STORY_NPC_PLACEMENTS: StoryNpcPlacement[] = [
  // 정옥선 — 동명활어센터 좌판. 자리를 지키고 가끔 옆 칸에 다녀온다
  { npcId: 'okseon', regionId: 'gangwon_sokcho', tx: 584, ty: 158, behavior: 'stall', home: { tx: 548, ty: 129, labelKo: '정옥선의 집' } },
  // 어촌계장 — 안벽을 오가며 둘러본다
  { npcId: 'coop', regionId: 'gangwon_sokcho', tx: 591, ty: 160, behavior: 'patrol', home: { tx: 583, ty: 155, labelKo: '어촌계 사무실' } },
  // 도현수 — 라이벌 낚시꾼. 방파제 입구 앞 해안에서 캐스팅을 반복한다
  { npcId: 'hyeonsu', regionId: 'gangwon_sokcho', tx: 534, ty: 151, behavior: 'fishing', home: { tx: 529, ty: 143, labelKo: '도현수의 집' } },
  // 강두철 — "채비 못 묶는 척하던" 조합장. 안벽 모서리에서 초보처럼 낚시한다
  { npcId: 'kang_ducheol', regionId: 'gangwon_sokcho', tx: 567, ty: 138, behavior: 'fishing', home: { tx: 555, ty: 129, labelKo: '강두철의 집' } },
  // 탁만수 — 죽간 장인. 좌판 옆을 오가며 둘러본다(낚시는 하지 않는다)
  { npcId: 'tak_mansu', regionId: 'gangwon_sokcho', tx: 560, ty: 150, behavior: 'wander', home: { tx: 541, ty: 144, labelKo: '탁씨 죽간 공방' } },
  // 배누리 — 영금정 구경 중
  { npcId: 'bae_nuri', regionId: 'gangwon_sokcho', tx: 562, ty: 92, behavior: 'wander', home: { tx: 579, ty: 110, labelKo: '배누리가 묵는 민박' } },
  // 바람 — 떠돌이. 뭔가를 찾듯 주변을 돈다 (214차 — 집이 없다: 24시간 밖)
  //  ⚠ 178차 좌표 교정 — 구 (520,134)는 건물 블록 안이라 런타임 `nearestWalkable`이 매번 밀어냈다
  { npcId: 'baram', regionId: 'gangwon_sokcho', tx: 520, ty: 131, behavior: 'wander' },
  // 오세찬 — 해양환경 감시원. 밀려온 불가사리를 세는 사람이라 물가 안벽을 오간다 (178차 신규 · 214차 교대 근무 = 24시간 밖)
  { npcId: 'oh_sechan', regionId: 'gangwon_sokcho', tx: 594, ty: 159, behavior: 'patrol' },
  // 탁새벽 — 탁만수의 손녀. 할아버지 좌판 근처 보도에서 서성인다 (178차 신규)
  { npcId: 'tak_saebyeok', regionId: 'gangwon_sokcho', tx: 556, ty: 148, behavior: 'wander', home: { tx: 539, ty: 144, labelKo: '공방 살림채' } },

  // ── 178차 — 지역만 등록한 인물들 (좌표 없음 = 필드에 세우지 않는다) ──
  //  이 표에 없으면 할 일을 고정해도 화살표도, 「다른 지역 — ○○」 안내도 나오지 않았다(백로그 AA ①).
  //  무대가 열리는 차수에 좌표를 채운다. 지역은 **그 인물이 처음 등장하는 장(章)** 기준이고,
  //  여러 지역을 오가는 인물은 실제 안내가 추적 중인 할 일의 지역을 따른다(`objectiveTarget`).
  { npcId: 'na_gibeom', regionId: 'busan' },
  { npcId: 'seo_harin', regionId: 'busan' },
  { npcId: 'jim_kang', regionId: 'busan' },
  { npcId: 'go_hosu', regionId: 'busan' },
  { npcId: 'mo_taejo', regionId: 'busan' },
  { npcId: 'yeo_gangsan', regionId: 'busan' },
  { npcId: 'chae_surim', regionId: 'busan' },
  { npcId: 'yu_harang', regionId: 'busan' },
  { npcId: 'ha_nui', regionId: 'busan' },
  { npcId: 'namgung_hyeon', regionId: 'gyeongbuk_pohang' },
  { npcId: 'han_bom', regionId: 'gyeongbuk_pohang' },
  { npcId: 'lee_suyeon', regionId: 'gyeongbuk_pohang' },
  { npcId: 'go_manseok', regionId: 'ulsan' },
  { npcId: 'go_haena', regionId: 'ulsan' },
  { npcId: 'chae_geumja', regionId: 'gyeongnam_geoje' },
  { npcId: 'chae_pado', regionId: 'gyeongnam_geoje' },
  { npcId: 'song_gibaek', regionId: 'chungnam_taean' },
  { npcId: 'ma_gamgi', regionId: 'chungnam_taean' },
  { npcId: 'oh_gayun', regionId: 'jeonnam_yeosu' },
  { npcId: 'jeong_umi', regionId: 'jeonnam_yeosu' },
  { npcId: 'oh_serin', regionId: 'jeju' },
  { npcId: 'yu_ria', regionId: 'jeju' },
  { npcId: 'mara', regionId: 'jeju' },
  { npcId: 'oh_sera', regionId: 'ulleungdo' },
  { npcId: 'yeon_taeo', regionId: 'ulleungdo' },
  { npcId: 'seok_daeyang', regionId: 'ulleungdo' },
  { npcId: 'seok_dokgu', regionId: 'ulleungdo' },
  { npcId: 'dan_cheolho', regionId: 'incheon' },
  { npcId: 'ha_minji', regionId: 'incheon' },
];

export const STORY_PLACES: StoryPlace[] = [
  { key: 'poi:yeonggeumjeong', regionId: 'gangwon_sokcho', tx: 572, ty: 88, radiusTiles: 6, labelKo: '영금정' },
  { key: 'poi:okseon-stall', regionId: 'gangwon_sokcho', tx: 584, ty: 158, radiusTiles: 3, labelKo: '정옥선 좌판 근처' },
  // ⚠ 178차 좌표 교정 — 구 (605,154)는 **바다 타일**이고 반경 2타일 안에 걷기 가능한 칸이 0개라
  //   얼음 상자를 들고도 영영 닿을 수 없었다(가장 가까운 뭍이 4타일 서쪽). 활어센터 동쪽 안벽 위로 옮긴다.
  { key: 'poi:auction-ice-drop', regionId: 'gangwon_sokcho', tx: 600, ty: 156, radiusTiles: 2, labelKo: '경매장 얼음 하역 위치' },
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

  // ── 235차 — 행동 목표마다 진짜 출처: 현장 지점 ─────────────────────────────
  //  단계가 그 지점의 차례일 때만 금색 점이 보이고, [F] → 혼잣말 장면 → 단계가 오른다.
  //  심부름(give/take)은 물건을 실제로 받아 들고 가서 내려놓는다(QuestItemGuard가 지키고 되살린다).
  //  ⚠ 인천 · 거제 · 태안 필드가 아직 없어 인천 · 거제 무대는 속초의 비슷한 자리(하역장 · 옛 조선소)에 둔다.
  //    그 지역 필드가 열리면 좌표 · 지역만 옮긴다(세이브 계약은 지점 id라 그대로다). 태안은 필드가 생길 때 보인다.
  // M2-11 「되돌아온 상자」 — 정옥선 좌판
  {
    id: 'm2-11-crates', regionId: 'gangwon_sokcho', tx: 588, ty: 157,
    labelKo: '부산에서 돌아온 상자', labelEn: 'Crates back from Busan',
    actionKey: 'stall_display_rebuild', questId: 'M2-11', objectiveIndex: 1, phase: 0,
    linesKo: ['상자 옆면에 찍힌 부산 위판장 규격 도장을 손끝으로 읽는다.', '높이가 두 치 낮다. 얼음이 덮여야 할 자리가 모자랐던 것이다.'],
    linesEn: ['I read the Busan grading stamp on the side of the crate with a fingertip.', 'It sits two finger-widths low. That is where the ice ran short.'],
  },
  {
    id: 'm2-11-display', regionId: 'gangwon_sokcho', tx: 582, ty: 160,
    labelKo: '만복상회 진열대', labelEn: 'Manbok Store display',
    actionKey: 'stall_display_rebuild', questId: 'M2-11', objectiveIndex: 1, phase: 1,
    linesKo: ['큰 놈은 뒤로, 눈이 맑은 놈은 앞으로 — 상자 규격에 맞춰 다시 놓는다.', '얼음을 한 줌 더 덮자 진열대 끝까지 물기가 고르게 번졌다.'],
    linesEn: ['Big fish to the back, clear-eyed ones to the front — rebuilt to the crate standard.', 'One more handful of ice and the wet sheen spread evenly to the end of the display.'],
  },
  // N19-1 「얼음과 대나무」 — 공방 앞 평상 → 만복상회 좌판
  {
    id: 'n19-1-take', regionId: 'gangwon_sokcho', tx: 544, ty: 147,
    labelKo: '공방 앞 평상의 대나무 받침', labelEn: 'Bamboo tray on the workshop bench',
    actionKey: 'tray_delivery', questId: 'N19-1', objectiveIndex: 1, phase: 0, give: 'qd_bamboo_tray',
    linesKo: ['평상 위에 받침이 하나 놓여 있다. 마디를 맞춰 엮은 손이 꼼꼼하다.', '"내가 줬다고는 하지 말고." 그 말을 떠올리며 받침을 챙긴다.'],
    linesEn: ['A tray sits on the bench, woven with every node lined up.', '"Don\'t say it was me." I remember that and pick up the tray.'],
  },
  {
    id: 'n19-1-place', regionId: 'gangwon_sokcho', tx: 585, ty: 160,
    labelKo: '만복상회 좌판에 받침 놓기', labelEn: 'Set the tray at the Manbok stall',
    actionKey: 'tray_delivery', questId: 'N19-1', objectiveIndex: 1, phase: 1, take: 'qd_bamboo_tray',
    linesKo: ['좌판 얼음통 아래에 받침을 밀어 넣자 젖은 상자가 수평을 찾는다.', '누가 두고 갔는지는 말하지 않았다. 할머니가 모서리를 한 번 쓸어 보았다.'],
    linesEn: ['I slide the tray under the ice tub and the wet crate finds level.', 'I did not say who left it. She ran a hand once along its edge.'],
  },
  // N19-3 「대를 다시 깎는 손」 — 두 번째 받침
  {
    id: 'n19-3-take', regionId: 'gangwon_sokcho', tx: 545, ty: 146,
    labelKo: '공방 앞의 두 번째 받침', labelEn: 'Second tray at the workshop',
    actionKey: 'second_tray_delivery', questId: 'N19-3', objectiveIndex: 1, phase: 0, give: 'qd_bamboo_tray',
    linesKo: ['이번 받침은 물이 빠지도록 틈을 넓혀 깎았다. 지난번 얘기를 들은 모양이다.', '천을 한 겹 둘러 챙긴다. 이번에는 물기가 덜 묻을 것이다.'],
    linesEn: ['This tray has wider gaps so the water drains. He must have heard about last time.', 'I wrap it in a cloth. Less water will soak through this time.'],
  },
  {
    id: 'n19-3-place', regionId: 'gangwon_sokcho', tx: 587, ty: 159,
    labelKo: '만복상회 수조 옆', labelEn: 'Beside the Manbok Store tank',
    actionKey: 'second_tray_delivery', questId: 'N19-3', objectiveIndex: 1, phase: 1, take: 'qd_bamboo_tray',
    linesKo: ['수조 옆 자리에 받침을 내려놓는다. 물이 틈으로 곧게 빠진다.', '할머니가 아무 말 없이 받침 위에 제일 좋은 상자를 올렸다.'],
    linesEn: ['I set the tray beside the tank. Water drains straight through the gaps.', 'Without a word, she set her best crate on top of it.'],
  },
  // N19-2 「부고 아닌 편지」 — 정옥선의 반찬통 → 죽간 공방
  {
    id: 'n19-2-take', regionId: 'gangwon_sokcho', tx: 582, ty: 157,
    labelKo: '정옥선의 반찬통', labelEn: 'Ok-seon\'s side-dish container',
    actionKey: 'food_container_delivery', questId: 'N19-2', objectiveIndex: 1, phase: 0, give: 'qd_food_box',
    linesKo: ['보자기로 싼 반찬통이 아직 따뜻하다. 뚜껑 위에 쪽지는 없다.', '할머니는 "가는 길에"라고만 했다. 길이 정해져 있다는 뜻이다.'],
    linesEn: ['The wrapped container is still warm. There is no note on the lid.', 'She only said "on your way". That means the way is already decided.'],
  },
  {
    id: 'n19-2-give', regionId: 'gangwon_sokcho', tx: 546, ty: 147,
    labelKo: '죽간 공방 문간', labelEn: 'Bamboo workshop doorway',
    actionKey: 'food_container_delivery', questId: 'N19-2', objectiveIndex: 1, phase: 1, take: 'qd_food_box',
    linesKo: ['뚜껑을 열지 않은 채 손잡이만 문간에 건넨다.', '안쪽에서 젓가락 놓는 소리가 났다. 오늘은 그걸로 충분하다.'],
    linesEn: ['I hand over the handle at the doorway without opening the lid.', 'Chopsticks clinked somewhere inside. That is enough for today.'],
  },
  // N02-5 「대를 고르는 눈」 — 방파제 옆 자재장
  {
    id: 'n02-5-yard', regionId: 'gangwon_sokcho', tx: 537, ty: 153,
    labelKo: '자재장 대나무 더미', labelEn: 'Bamboo pile in the yard',
    actionKey: 'bamboo_selection', questId: 'N02-5', objectiveIndex: 1, phase: 0,
    linesKo: ['세워 둔 대 사이를 손바닥으로 훑으며 마디 간격을 잰다.', '휘어진 대, 갈라진 대를 하나씩 옆으로 밀어낸다.'],
    linesEn: ['I run my palm down the standing poles, measuring the node spacing.', 'One by one I push aside the warped ones and the split ones.'],
  },
  {
    id: 'n02-5-pick', regionId: 'gangwon_sokcho', tx: 539, ty: 154,
    labelKo: '골라 둔 대', labelEn: 'The chosen pole',
    actionKey: 'bamboo_selection', questId: 'N02-5', objectiveIndex: 1, phase: 1,
    linesKo: ['마디가 고르고 껍질이 단단한 한 대를 들어 본다. 손에 감기는 무게가 맞다.', '왜 이 대인지 끈으로 표시해 둔다 — 마디, 곧음, 껍질.'],
    linesEn: ['I lift one with even nodes and hard skin. The weight settles right in the hand.', 'I tie a mark on it for why — the nodes, the straightness, the skin.'],
  },
  // N18-4 「같은 배를 보는 눈」 — (거제 대신) 청초호 옛 조선소 수리장
  {
    id: 'n18-4-hull', regionId: 'gangwon_sokcho', tx: 268, ty: 424,
    labelKo: '옛 조선소 수리장의 선체', labelEn: 'Hull in the old boatyard',
    actionKey: 'hull_inspection', questId: 'N18-4', objectiveIndex: 1, phase: 0,
    linesKo: ['망치로 선체를 두드리자 도장 아래로 번진 녹이 둔하게 울린다.', '같은 자리를 한 번 더 두드려 본다. 소리가 다른 곳보다 낮다.'],
    linesEn: ['I tap the hull with a hammer and the rust under the paint rings dull.', 'I tap the same spot again. It sounds lower than anywhere else.'],
  },
  {
    id: 'n18-4-engine', regionId: 'gangwon_sokcho', tx: 270, ty: 426,
    labelKo: '선체 기관실', labelEn: 'Engine bay',
    actionKey: 'hull_inspection', questId: 'N18-4', objectiveIndex: 1, phase: 1,
    linesKo: ['기관실 바닥에 손전등을 비추자 안쪽 보강재가 겉보다 오래돼 보인다.', '기름때 아래 새겨진 연식을 수첩에 옮겨 적는다.'],
    linesEn: ['Under the torch, the inner bracing looks older than the skin.', 'I copy the year stamped under the grease into my notebook.'],
  },
  // N19-5 「병실 앞 복도」 — 항구 보건지소
  {
    id: 'n19-5-ward', regionId: 'gangwon_sokcho', tx: 526, ty: 134,
    labelKo: '보건지소 출입구', labelEn: 'Clinic entrance',
    actionKey: 'hospital_assistance', questId: 'N19-5', objectiveIndex: 1, phase: 0,
    linesKo: ['출입구 안내판에서 병실 층과 면회 시간을 확인한다.', '노인은 문 앞에서 걸음을 멈추고 지팡이 끝만 내려다보았다.'],
    linesEn: ['I check the ward floor and visiting hours on the entrance board.', 'At the door he stopped and looked down at the tip of his cane.'],
  },
  {
    id: 'n19-5-walk', regionId: 'gangwon_sokcho', tx: 524, ty: 132,
    labelKo: '병실 가는 복도', labelEn: 'Corridor to the ward',
    actionKey: 'hospital_assistance', questId: 'N19-5', objectiveIndex: 1, phase: 1,
    linesKo: ['걸음이 멈출 때마다 난간 쪽으로 반 발 먼저 간다.', '"천천히 가도 됩니다." 노인이 고개를 한 번 끄덕였다.'],
    linesEn: ['Each time he stops, I move half a step ahead toward the rail.', '"We can go slowly." He nodded once.'],
  },
  // N18-7 「나란히 서서」 — 속초등대 전시관
  {
    id: 'n18-7-list', regionId: 'gangwon_sokcho', tx: 566, ty: 88,
    labelKo: '등대 전시관 준비 목록', labelEn: 'Lighthouse hall checklist',
    actionKey: 'reopening_preparation', questId: 'N18-7', objectiveIndex: 1, phase: 0,
    linesKo: ['문에 붙은 준비 목록을 읽는다. 의자 스무 개, 안내판 셋, 리본 하나.', '목록 끝에 연필로 한 줄을 더 적는다 — 「바람막이」.'],
    linesEn: ['I read the list taped to the door. Twenty chairs, three signs, one ribbon.', 'I pencil one more line at the end — "windbreak".'],
  },
  {
    id: 'n18-7-set', regionId: 'gangwon_sokcho', tx: 568, ty: 90,
    labelKo: '전시관 안내판', labelEn: 'Exhibition sign',
    actionKey: 'reopening_preparation', questId: 'N18-7', objectiveIndex: 1, phase: 1,
    linesKo: ['먼지 쌓인 안내판의 나사를 다시 조인다.', '의자를 줄 맞춰 놓고 나니, 문을 열기 전부터 사람이 앉을 자리가 보였다.'],
    linesEn: ['I tighten the screws on the dusty sign again.', 'With the chairs in rows, I can already see where people will sit.'],
  },
  // N03-7 「조합장의 출장」 — (인천 대신) 동명항 하역장 유통 표지
  {
    id: 'n03-7-route', regionId: 'gangwon_sokcho', tx: 595, ty: 156,
    labelKo: '하역장 유통 경로 표지', labelEn: 'Route board at the unloading bay',
    actionKey: 'distribution_route_explain', questId: 'N03-7', objectiveIndex: 1, phase: 1,
    linesKo: ['배에서 내린 상자가 경매 · 중도매 · 소매로 갈라지는 길을 표지에서 짚는다.', '단계마다 책임지는 사람이 바뀐다 — 그 이름을 순서대로 외운다.'],
    linesEn: ['On the board I trace how a crate splits from the boat into auction, wholesale and retail.', 'Who answers for it changes at every step — I learn the names in order.'],
  },
  // N13-3 「폐어선의 겨울」 — 태안 (필드가 열리면 보인다)
  {
    id: 'n13-3-flue', regionId: 'chungnam_taean', tx: 40, ty: 40,
    labelKo: '폐어선 선실 연통', labelEn: 'Cabin flue of the old boat',
    actionKey: 'stove_repair', questId: 'N13-3', objectiveIndex: 1, phase: 0,
    linesKo: ['막힌 연통을 두드리자 그을음이 한 줌 떨어진다.', '이음새의 녹을 긁어내고 연통을 다시 끼운다.'],
    linesEn: ['I knock on the blocked flue and a handful of soot drops.', 'I scrape the rust from the joint and fit the pipe back.'],
  },
  {
    id: 'n13-3-light', regionId: 'chungnam_taean', tx: 41, ty: 40,
    labelKo: '선실 난로', labelEn: 'Cabin stove',
    actionKey: 'stove_repair', questId: 'N13-3', objectiveIndex: 1, phase: 1,
    linesKo: ['불씨를 넣자 바람이 연통으로 곧게 빠진다.', '불꽃이 다시 붙자 방 안의 손들이 움직이기 시작했다.'],
    linesEn: ['I feed in the spark and the draught pulls straight up the flue.', 'When the flame caught, the hands in the room began to move.'],
  },
];
