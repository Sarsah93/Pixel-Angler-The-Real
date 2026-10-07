/**
 * @file QuestItemDrops.ts
 * @description 개인 전용 퀘스트 아이템 + 확률 드롭 표 (233차)
 *
 * 사용자 지시: 「멀티여도 유저 각각 개인에게만 보여지거나 얻어지는 전용 퀘스트 아이템을 조건부 및 확률로 반영」.
 *
 * - 아이템은 **귀속**(`bound`) — 팔거나 거래할 수 없다. 그래서 친구가 대신 모아 줄 수 없다.
 * - 드롭은 **그 사람의 클라이언트가 자기 행동에서만** 굴린다(서버 · 공용 시드 없음) — 같은 갯가를 함께 훑어도
 *   각자의 퀘스트가 진행 중일 때만, 각자 다른 운으로 나온다. 남의 화면에는 보이지 않는다.
 * - 퀘스트가 그 `collect` 목표를 아직 다 채우지 않았을 때만 굴린다(다 모으면 더 나오지 않는다).
 * - 퀘스트를 마치면 모은 아이템은 의뢰인에게 넘어간다(인벤토리에서 빠진다).
 *
 * 드롭을 늘릴 때: 퀘스트 DB에 `collect` 목표(itemId · target)를 두고 여기에 한 줄을 더한다.
 */

/** 퀘스트 아이템 정의 — 인벤토리에 들어가는 모양 */
export interface QuestItemDef {
  id: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  /** 아이콘 — 픽셀 아이콘 키(`px:` 접두) 또는 텍스처 키 */
  icon: string;
}

/** 드롭이 붙는 행동 */
export interface QuestDropTrigger {
  /** gather = 해루질 채집 성공 · catch = 낚시 어획 */
  kind: 'gather' | 'catch';
  /** 이 지역에서만 (없으면 어디서나) */
  regionId?: string;
  /** 이 생물 · 어종에서만 (없으면 아무거나) */
  creatureId?: string;
  speciesId?: string;
}

export interface QuestItemDrop {
  questId: string;
  itemId: string;
  on: QuestDropTrigger;
  /** 한 번 행동할 때 나올 확률 (0~1) */
  chance: number;
}

export const QUEST_ITEMS: QuestItemDef[] = [
  {
    id: 'qi_cleanup_photo', nameKo: '물에 젖은 단체사진', nameEn: 'Water-Stained Group Photo',
    descKo: '비닐에 싸인 채 폐어선 틈에 끼어 있던 사진. 방제복을 입은 사람들이 갯바위 앞에 줄지어 서 있다.',
    descEn: 'A photo wrapped in plastic, wedged into the hulk. People in cleanup suits stand in a row before the rocks.',
    icon: 'px:it_photo',
  },
  {
    id: 'qi_tide_sample', nameKo: '조간대 표본', nameEn: 'Tideline Sample',
    descKo: '갯가에서 떠 담은 표본 병. 자료에 붙여 「지금 이 바위에 사는 것」을 보여 준다.',
    descEn: 'A sample jar scooped from the tideline — proof of what lives on these rocks right now.',
    icon: 'px:qi_sample',
  },
  {
    id: 'qi_bamboo_piece', nameKo: '쓸 만한 대나무 토막', nameEn: 'Usable Length of Bamboo',
    descKo: '물가에 밀려온 대나무 중 마디 간격이 고른 것. 낚싯대 감으로 눈여겨볼 만하다.',
    descEn: 'A washed-up length of bamboo with even nodes — worth a second look as rod stock.',
    icon: 'px:it_wood',
  },
  {
    id: 'qi_sinker_stone', nameKo: '봉돌감 돌', nameEn: 'Sinker Stone',
    descKo: '손바닥에 쏙 들어오는 매끈한 갯돌. 무게가 고르면 봉돌 대신 쓸 수 있다.',
    descEn: 'A smooth shore stone that sits right in the palm. Even weight makes it a stand-in sinker.',
    icon: 'px:qi_stone',
  },
];

export const QUEST_ITEM_DROPS: QuestItemDrop[] = [
  // N13-2 「두고 온 것」 — 노인이 평생 찾던 방제 봉사 단체사진. 태안 갯가를 훑다 보면 드물게 나온다(까다로움)
  { questId: 'N13-2', itemId: 'qi_cleanup_photo', on: { kind: 'gather', regionId: 'chungnam_taean' }, chance: 0.3 },
  // N18-5 「표결 전야」 — 자료에 붙일 표본 3점. 제주 갯가 채집 2번에 1번꼴
  { questId: 'N18-5', itemId: 'qi_tide_sample', on: { kind: 'gather', regionId: 'jeju' }, chance: 0.5 },
  // N02-5 「대를 고르는 눈」 — 쓸 만한 대 2토막. 속초 갯가에서 가끔
  { questId: 'N02-5', itemId: 'qi_bamboo_piece', on: { kind: 'gather', regionId: 'gangwon_sokcho' }, chance: 0.4 },
  // N22-3 「돌을 고르다」 — 봉돌감 돌 3개. 포항 갯가 채집 2번에 1번꼴
  { questId: 'N22-3', itemId: 'qi_sinker_stone', on: { kind: 'gather', regionId: 'gyeongbuk_pohang' }, chance: 0.5 },
];

export function getQuestItem(id: string): QuestItemDef | undefined {
  return QUEST_ITEMS.find((q) => q.id === id);
}

/**
 * 233차 — **까다로운 퀘스트**: 손질 · 회뜨기 · 요리 · 위판 목표를 직접 마련한 것으로만 채워야 하는 퀘스트.
 * 이야기가 「내 손으로」를 요구하는 것들이다(품질 · 위생 절차 · 심사 실적 · 원산지 · 증명 · 개관식 상).
 * 나머지 퀘스트는 거래로 받은 것도 인정한다(학원비 · 뱃값처럼 돈이 목적인 위판 등).
 */
export const OWN_ONLY_QUEST_IDS: ReadonlySet<string> = new Set([
  'M2-02',  // 유찰 — 선도를 다시 잡아 위판
  'M2-05',  // 품질관리 교육 — 배운 위생 절차대로 손질 · 회
  'M2-09',  // 총회 — 심사에 낼 실적
  'M5-09',  // 총회 표결 — 참여 실적
  'M7-06',  // 재개관 — 개관식 상에 올릴 회
  'N08-2',  // 해나의 칼 — 회뜨기
  'N09-2',  // 칼을 쥐면 — 손질
  'N18-6',  // 원산지 표기 — 원산지를 적어 위판
  'N23-3',  // 접시 위의 증명
  'N23-6',  // 남길 것 — 기록에 남길 한 접시
]);

/** ownOnly가 적용되는 목표 종류 — 행동의 재료가 거래로 들어올 수 있는 것만 */
export const OWN_ONLY_KINDS: ReadonlySet<string> = new Set(['butcher', 'sashimi', 'cook', 'sell', 'deliverFree']);
