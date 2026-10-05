/**
 * @file HomeInteriorScene.ts
 * @description 집 실내 (Tier 0 소형 원룸) — 침대 저장 · 현관 매트→홈타운 외부 · 첫 입장 가구 안내 혼잣말(186차)
 *   · 188차 프롤로그 「떠나는 날 아침」 — 새 캐릭터는 여기 침대 옆에서 눈을 뜬다(`wake`).
 *     아버지의 낚시 상자 · 가방(I)/장비(E)/일지(J) 창 · 「지금 할 일」 띠 · 첫 걸음 체험 가이드.
 *   · 189차 집 정리 — 사용자 지시:
 *     ① 「살펴보기」 폐지: 첫 입장 혼잣말로 한 번 설명했으면 같은 말을 되풀이하지 않는다. [F]는 **할 수 있는 일이 있는 가구**에만.
 *     ② 가구 회수·재배치(`ui/HomeDecorMode.ts` — 방 오른쪽 위 [가구 배치]).
 *     ③ 소파 = 한쪽을 보는 2인용 그림 + [F] 앉기 → 옆에 고를 거리(휴식하기 · 일어나기).
 *     ④ 화분 = 물뿌리개를 손에 들었을 때만 [F] 물 주기. ⑤ 옷장 = 장비 보관함. ⑥ 의자 = [F] 앉기.
 *     ⑦ 문 대신 현관 매트 — [F] 「나가기」 판정을 없애고, 매트를 밟고 아래로 걸어 나가면 바로 밖이다.
 *   · 190차 집 살림 — 사용자 지시 7건:
 *     ① 창·조명 = 시각·날씨(`ui/HomeAmbience.ts`) — 밤엔 방이 어둡고 협탁 스탠드 [F] 켜고 끄기, 창밖에 비·노을.
 *     ② 라디오 [F](소파에 앉아서도) = 오늘·내일 물때와 날씨 예보 방송(`data/RadioBroadcast.ts`).
 *     ③ 식탁 앞 의자에 앉아 먹으면 허기 +25%(「식사하기」 → 가방 음식 탭).
 *     ④ 고양이(`ui/HomeCat.ts`) — 방을 돌아다니고 [F] 쓰다듬기 · 손질 부산물로 밥 주기.
 *     ⑤ 벽 장식 [F] — 책(어류 도감 · 물때표) · 달력(납부일) · 어탁(최대어) (`ui/HomeInfoPanels.ts`).
 *     ⑥ 생활용품점 가구 → 「넣어 둔 가구」(배치 모드에서 꺼내 놓는다). ⑦ 관상 수조 [F](`ui/AquariumPanel.ts`).
 *
 * HOMETOWN_HOME_SPEC (2026-07-28):
 *  - 시작 사이즈 Tier 0: 원룸 12×10 타일 (hometown_interior_mockup.svg 레이아웃).
 *  - **저장은 이 씬의 침대에서만** — GameState.locationTag = 'hometown_interior'
 *    (TUNING.save.allowedTags). 213차 — 「저장만 하기」(잠 없이) / 「자기」(실시간 · 다 자면 하루 마감 + 저장 · 도중에 깨면 잔 만큼만).
 *  - 가구 배치는 `HomeStore`(세이브) — 기본 배치·그림은 `data/HomeFurniture.ts`.
 *  - 진입: RegionFieldScene 문 → pause + launch. 복귀: stop() + resume (규칙 준수).
 */

import Phaser from 'phaser';
import { LedgerStore } from '../store/LedgerStore.js';
import { DayReportPanel, type DayReportMode } from '../ui/DayReportPanel.js';
import { ConsignListPanel } from '../ui/ConsignListPanel.js';
import { setAmbience } from '../audio/Ambience.js';
import { wakeLine, offlineWakeLines } from '../data/WakeLines.js';
import { settleDueConsignments } from '../store/ConsignSettle.js';
import { playCoin, playUiClick } from '../audio/Sfx.js';
import { CHAR_SCALE, CHAR_HEAD_TOP, TUNING, kstParts, sleepFraction, type CharDir } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { GameState } from '../store/GameState.js';
import { StoryStore } from '../store/StoryStore.js';
import { TitleStore } from '../store/TitleStore.js';
import { pumpTitleBanners, titleTagStyle, TITLE_RARITY_COLOR } from '../ui/TitleBanner.js';
import { pumpTideFlow } from '../ui/TideFlowNotifier.js';
import { FridgePanel } from '../ui/FridgePanel.js';
import { CookingPanel } from '../ui/CookingPanel.js';
import { CookingStore } from '../store/CookingStore.js';
import { fadeOutThen } from './SceneFade.js';
import { CharacterSprite } from '../ui/CharacterSprite.js';
import { characterLook } from '../data/EquipOutfit.js';
import { MonologuePanel } from '../ui/MonologuePanel.js';
import { InventoryStore, FATHER_BOX_ITEMS, type InvItem } from '../store/InventoryStore.js';
import { QUEST_REWARD_ITEMS } from '../data/QuestRewardItems.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { EquipmentPanel } from '../ui/EquipmentPanel.js';
import { JournalPanel } from '../ui/JournalPanel.js';
import { ItemDetailPanel } from '../ui/ItemDetailPanel.js';
import { DraggablePanel, restoreHandCursor } from '../ui/DraggablePanel.js';
import { HomeStoragePanel } from '../ui/HomeStoragePanel.js';
import { HomeDecorMode } from '../ui/HomeDecorMode.js';
import { GuideTour, maybeStartTour } from '../ui/GuideTour.js';
import { PrologueCoach, type CoachStage } from '../ui/PrologueCoach.js';
import { getLocale } from '../i18n/I18n.js';
import { HomeStore, type HomeStorageKind } from '../store/HomeStore.js';
import {
  IT, ROOM_W, ROOM_H, DOOR_MAT, FLOOR_TOP, FURN_DEFS, WALL_DECOR, footprint, seatsOf, drawFurnitureArt, frontCell, ensureFurnitureIcon,
  type FurnInstance, type FurnAction, type WallDecorId,
} from '../data/HomeFurniture.js';
import { HomeAmbience, type AmbienceLight } from '../ui/HomeAmbience.js';
import { HomeCat, CAT_FULL_MS } from '../ui/HomeCat.js';
import { TideTablePanel, CalendarPanel, FishRecordPanel } from '../ui/HomeInfoPanels.js';
import { AquariumPanel, tankFishTexture } from '../ui/AquariumPanel.js';
import { buildRadioBroadcast } from '../data/RadioBroadcast.js';
import { resolveFishTexture } from '../data/FishTextures.js';
import { fieldReserved, overlapsReserved, assertClear } from '../ui/ScreenReserve.js';
import {
  markPrologue, syncPrologue, prologueKeyAllowed, prologueRunning, prologueStepDone, PROLOGUE_PHOTO_ID,
} from '../store/Prologue.js';

/**
 * 방 가로 위치 — 화면 가운데에서 12px 오른쪽(198차). 가운데 그대로면 방 액자 왼쪽(328)이 필드 HUD 상태 창
 * 오른쪽 끝(336)을 8px 덮었다(겹침 감사). 오른쪽은 「지금 할 일」(1033~)까지 여유가 있다.
 */
const ROOM_SHIFT_X = 12;
const OX = (GAME_WIDTH - ROOM_W * IT) / 2 + ROOM_SHIFT_X;
const OY = (GAME_HEIGHT - ROOM_H * IT) / 2 + 10;
const FONT = '"Noto Sans KR", sans-serif';

/** [F]가 닿는 거리 — 발밑에서 가구 footprint 가장자리까지(px). 바로 옆 칸에 서야 닿는다 */
const REACH_PX = 26;
/** 앉은 자세 — 머리끝부터 엉덩이까지만 보인다(다리는 가구가 가린다) */
const SEAT_ROWS = (CHAR_HEAD_TOP + 19) * CHAR_SCALE;
/** 소파 휴식 — 한 번에 풀리는 피로(최대치 대비 %) · 소파에서는 이 아래로는 안 풀린다(침대 몫) */
const SOFA_REST_PCT = 35;
const SOFA_REST_FLOOR_PCT = 35;
/** 190차 — 고양이를 쓰다듬으면 풀리는 피로(최대치 대비 %) · 그 간격 */
const CAT_CALM_PCT = 3;
const CAT_CALM_GAP_MS = 30 * 60 * 1000;
/** 소파에서 라디오가 닿는 거리(칸) */
const RADIO_REACH_TILES = 2.6;
/** 벽 장식 그림 (drawRoom과 판정이 같은 값을 쓴다) */
const WALL_Y = { calendar: 0.18, fishprint: 0.3 };

/**
 * 첫 입장 안내 혼잣말 (186차 — 사용자 지시 "집으로 들어왔을 때 멈추면서 하나하나 안내").
 * 189차: **첫 입장 때 한 번만** 쓴다(가구 앞 「살펴보기」로 되풀이하던 것은 폐지).
 * 쓸 수 있는 가구는 그 쓰는 법을 둘째 문장에 담는다(R4 — 정의문이 아니라 주인공의 말).
 */
const LOOK_TEXT: Record<string, string> = {
  door_mat: '현관 매트. 매트를 밟고 아래로 걸어 나가면 바로 밖이다.',
  plant: '화분 하나가 아직 살아 있다. 누가 물을 주고 있었던 모양이다.\n물뿌리개를 손에 들고 화분 앞에 서면 물을 줄 수 있다.',
  sofa: '낡은 2인용 소파. 아버지는 여기서 라디오 물때 방송을 켜 놓고 졸곤 했다.\n소파 앞에서 [F]를 누르면 앉는다. 앉아서 잠깐 쉴 수도 있다.',
  shelf: '수납 선반. 낚시 잡지 몇 권과 쓰다 만 채비 상자가 그대로 올려져 있다.\n[F]로 열어 낚시용품이나 자잘한 물건을 올려 둘 수 있다.',
  fridge: '냉장고는 아직 돌아간다. 위칸은 얼리고 아래칸은 차게 둔다.\n[F]로 열어 잡은 고기나 먹을 것을 넣어 두면, 넣어 둔 동안은 상하지 않는다.',
  sink: '개수대에서 수돗물이 나온다. 요리할 때 물 걱정은 없겠다.\n개수대나 가스레인지 앞에서 [F]를 누르면 요리를 시작한다.',
  stove: '가스레인지 두 구. 집 화구는 가스가 떨어질 일이 없다.\n[F]로 조리를 시작한다 — 재료는 가방에서 꺼내 넣는다.',
  island: '식탁. 둘이 앉으면 딱 맞는 크기다. 밥은 늘 여기서 먹었다.\n의자 앞에서 [F]를 누르면 앉는다.',
  rug: '러그. 볕이 드는 자리라 고양이가 여기서 자주 잔다.',
  cat: '고양이 한 마리가 집을 지키고 있었다. 누가 밥을 챙겨 줬던 걸까. 이제는 내 몫이겠지.\n앞에서 [F]를 누르면 쓰다듬는다. 손질하고 남은 부산물을 가방에 넣어 오면 밥도 줄 수 있다.',
  radio: '아버지 라디오. 소파에 앉아 물때 방송을 듣곤 했다.\n[F]로 켜면 오늘과 내일 물때, 바다 날씨를 알려 준다. 소파에 앉아서도 켤 수 있다.',
  calendar: '벽에 걸린 달력. 아버지 글씨로 납부일이 적혀 있다.\n[F]로 보면 다가오는 납부일을 알 수 있다.',
  fishprint: '어탁 액자. 언젠가 내가 낚은 큰 고기로 바꿔 걸고 싶다.\n[F]로 보면 지금까지 낚은 가장 큰 고기의 기록이 나온다.',
  bed: '아버지 침대. 이불 끝이 반듯하게 접혀 있다.\n침대 앞에서 [F]를 누르면 쉴 수 있다. 오늘 한 일을 기록(저장)하는 것도 이 침대에서만 된다.',
  stand: '머리맡 협탁. 스탠드가 아직 켜진다. 안경을 늘 두던 자리에 먼지만 앉았다.\n밤에는 방이 어둡다. 협탁 앞에서 [F]로 스탠드를 켜고 끈다.',
  wardrobe: '옷장. 아버지 옷가지가 아직 걸려 있다.\n[F]로 열어 장비를 걸어 둘 수 있다. 가방이 한결 가벼워진다.',
  clock: '벽시계는 멈추지 않고 가고 있다. 누가 건전지를 갈아 두었나.',
  books: '벽 선반의 책. 물때표, 어류 도감, 손때 묻은 매듭 책.\n책 아래에서 [F]를 누르면 도감이나 물때표를 펼쳐 본다.',
  window: '창 너머로 바다가 보인다. 해가 지면 노을이, 비가 오면 빗줄기가 보인다.',
};

/** 188차 — 프롤로그 기상 혼잣말 (새 캐릭터가 침대 옆에서 눈을 뜬다) */
const WAKE_MONOLOGUE: string[] = [
  '눈을 떴다. 천장 무늬가 낯설다. 이 집에서 잔 게 몇 해 만인지 세어 보다가 그만뒀다.',
  '아버지가 쓰던 방이다. 장례를 치르고는 한 번도 들어오지 않았는데, 이제 갈 데가 여기밖에 없다.',
  '침대 발치에 아버지의 낚시 상자가 그대로 놓여 있다.',
  '속초행 막차는 밤에 한 대뿐이라고 했다. 떠나기 전에 챙길 것부터 챙기자.',
];

/** 188차 — 아버지의 낚시 상자를 처음 열 때 */
const BOX_MONOLOGUE: string[] = [
  '상자를 열었다. 아버지가 아끼던 대와 릴이 가지런히 들어 있다.',
  '그 아래에 사진 한 장이 끼워져 있다. 바다 앞에서 찍은 우리 가족이다.',
  '상자째로 어깨에 멨다. 오늘부터 이게 내 낚시 가방이다.',
];

/** 첫 입장 안내 순서 — 매트에서 시작해 방을 한 바퀴 돌고 다시 매트로 */
const TOUR_ORDER = [
  'door_mat', 'plant', 'sofa', 'radio', 'shelf', 'fridge', 'sink', 'stove', 'island',
  'rug', 'cat', 'bed', 'stand', 'wardrobe', 'clock', 'books', 'calendar', 'fishprint', 'window',
] as const;
const TOUR_INTRO = '아버지 집이다. 떠날 때 모습 그대로다. 우선 하나씩 둘러보자.';
const TOUR_OUTRO = '대충 다 둘러봤다. 쓸 수 있는 가구 앞에 서면 머리 위에 [F]가 뜬다. 가구 자리는 오른쪽 위 [가구 배치]에서 바꾼다.';

/** 가구가 지금 받을 수 있는 [F] 행동 → 머리 위 문구 (스탠드는 켜짐에 따라 바뀐다 — `hintOf`) */
const ACTION_LABEL: Record<FurnAction, string> = {
  bed: '[F] 침대 — 저장 · 잠',
  fridge: '[F] 냉장고 열기',
  cook: '[F] 주방 — 요리',
  sofa: '[F] 앉기',
  chair: '[F] 앉기',
  wardrobe: '[F] 옷장 열기',
  shelf: '[F] 선반 열기',
  plant: '[F] 물 주기',
  father_box: '[F] 낚시 상자 열기',
  lamp: '[F] 스탠드 켜기',
  radio: '[F] 라디오 켜기',
  aquarium: '[F] 수조 보기',
};
const WALL_LABEL: Record<WallDecorId, string> = {
  books: '[F] 책 보기',
  calendar: '[F] 달력 보기',
  fishprint: '[F] 어탁 보기',
};

/** [F]가 닿는 대상 — 가구 · 고양이 · 벽 장식 */
type NearTarget =
  | { kind: 'furn'; f: FurnInstance; action: FurnAction }
  | { kind: 'cat' }
  | { kind: 'wall'; id: WallDecorId };

interface MenuItem { label: string; color?: string; run: () => void }
interface OpenMenu {
  kind: 'bed' | 'seat' | 'cat' | 'books';
  c: Phaser.GameObjects.Container;
  items: MenuItem[];
  rows: Phaser.GameObjects.Graphics[];
  sel: number;
  onCancel: () => void;
}
interface Seat {
  f: FurnInstance;
  sx: number;
  sy: number;
  behind: boolean;
  standX: number;
  standY: number;
}

export class HomeInteriorScene extends Phaser.Scene {
  /** 위치 판정용 논리 좌표 (스프라이트 발밑) */
  private px = 0;
  private py = 0;
  /** 186차 — 필드와 같은 캐릭터 시트(구 `man-*` 외부 출력물은 138차에 폐기됐다) */
  private charSprite!: CharacterSprite;
  /** 204차 — 머리 위 타이틀(혼자 있는 집 안에서도 — 사용자 지시) */
  private homeTitle?: Phaser.GameObjects.Text;
  private homeTitleKey = '';
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private facing: CharDir = 'down';
  /** 186차 — 가구 안내 혼잣말 진행 중(이동·[F]·ESC를 막는다) */
  private tourPanel?: MonologuePanel;
  private tourSpot?: Phaser.GameObjects.Container;
  private tourSpotTween?: Phaser.Tweens.Tween;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private hintText!: Phaser.GameObjects.Text;
  /** 189차 — 확장 패널(침대 메뉴 · 앉은 자리 고를 거리). 구 `bedMenu`는 이것의 'bed' 종류다 */
  private menu?: OpenMenu;
  private fridgePanel?: FridgePanel;
  /** 154차 — 집 주방 조리 패널 (가스레인지 [F]) */
  private cookPanel?: CookingPanel;
  private cookSyncAcc = 0;
  private near: NearTarget | null = null;
  /** 190차 — 창·조명 · 고양이 · 수조 속 고기(방 안 그림) · 라디오 소리 물결 */
  private ambience?: HomeAmbience;
  private cat?: HomeCat;
  private tankSwim: { img: Phaser.GameObjects.Image; x0: number; x1: number; vx: number; y0: number; ph: number }[] = [];
  private bubbleAcc = 0;
  private radioWaves?: Phaser.Time.TimerEvent;
  /** 189차 — 가구 그림(인스턴스마다 하나) */
  private furnViews = new Map<string, Phaser.GameObjects.Graphics>();
  private clockG?: Phaser.GameObjects.Graphics;
  private clockAcc = 0;
  private seat: Seat | null = null;
  private decor?: HomeDecorMode;
  private decorBtn?: Phaser.GameObjects.Container;
  private enteredAt = 0;
  private leaving = false;
  /** 188차 — 프롤로그 기상(새 게임) 진입인가 */
  private wake = false;
  /** 188차 — 실내에서 여는 창(가방·장비·일지·상세보기·보관함) — ESC는 위에서부터 닫는다 */
  private popups: { panel: DraggablePanel; close: () => void }[] = [];
  private invPanel: InventoryPanel | null = null;
  private equipPanel: EquipmentPanel | null = null;
  private journalPanel: JournalPanel | null = null;
  /** 191차 — 프롤로그 말풍선 코치 (구 상단 「지금 할 일」 띠·금색 자리 표시를 대신한다) */
  private coach?: PrologueCoach;
  private syncAcc = 0;
  /** 첫 걸음 체험 — 걸은 거리(px) · 뛴 시간(ms) · 앉은 횟수 · 일어선 횟수 */
  private walked = 0;
  private ranMs = 0;
  private satCount = 0;
  private stoodCount = 0;

  constructor() {
    super({ key: 'HomeInteriorScene' });
  }

  init(data?: { wake?: boolean }): void {
    // ⚠ 197차 — Phaser는 `launch(key)`를 데이터 없이 부르면 **지난번 데이터를 그대로 다시 넘긴다**
    //   (`Systems.start`: `if (data) settings.data = data`). 새 게임의 `{ wake: true }`가 남아,
    //   속초에 다녀와 집에 들어올 때마다 기상 혼잣말이 다시 나왔다(QA 리포트). 읽은 뒤 비우고,
    //   상자를 이미 열었으면(프롤로그 첫 단계 통과) 기상은 다시 하지 않는다.
    this.wake = !!data?.wake && !prologueStepDone('box');
    this.sys.settings.data = {};
  }

  create(): void {
    setAmbience({ sea: 0.12, rain: 0 });   // 211차 — 집 안 — 창 너머 먼 파도
    this.time.delayedCall(1200, () => this.maybeShowUnseenDay(0));   // 211차 — 자는 사이 넘어간 하루
    this.homeTitle = undefined;   // 204차 — 재진입 시 파괴된 Text를 다시 쓰지 않게
    this.homeTitleKey = '';
    // 저장 정책의 유일한 허용 위치 — 침대 상호작용 지점 (HOMETOWN_HOME_SPEC §4)
    GameState.locationTag = 'hometown_interior';
    this.cameras.main.fadeIn(300, 0, 10, 20);
    this.menu = undefined;
    this.fridgePanel = undefined;
    this.cookPanel = undefined;
    this.near = null;
    this.tankSwim = [];
    this.radioWaves = undefined;
    GameState.mealAtTable = false;
    this.popups = [];
    this.invPanel = null;
    this.equipPanel = null;
    this.journalPanel = null;
    this.walked = 0; this.ranMs = 0; this.satCount = 0; this.stoodCount = 0;
    this.wakeStarted = false;
    this.tourPanel = undefined;
    this.tourSpot = undefined;
    this.tourSpotTween = undefined;
    this.furnViews = new Map();
    this.seat = null;
    this.decor = undefined;
    this.leaving = false;
    this.enteredAt = this.time.now;

    this.drawRoom();
    this.drawFishPrintInk();
    this.clockG = this.add.graphics().setDepth(2);
    this.drawClockHands();
    // 191차 — 연 상자는 가방이 되어 방에 없다 (세이브 로드가 기본 배치를 다시 채우므로 입장마다 정리)
    if (GameState.getFlag('prologue.box')) HomeStore.discard('father_box');
    this.buildFurniture(null);
    // 190차 — 창·조명 (시각·날씨)
    const wallH = Math.round(IT * 1.4);
    this.ambience = new HomeAmbience(this, {
      ox: OX, oy: OY, w: ROOM_W * IT, h: ROOM_H * IT,
      win: { x: OX + ROOM_W * IT - IT * 3.4, y: OY + 10, w: IT * 2.2, h: wallH - 30 },
      lights: () => this.litSources(),
      dimMul: () => (this.decor ? 0.45 : 1),
    });
    // 190차 — 고양이
    this.cat = new HomeCat(this, {
      ox: OX, oy: OY,
      blocked: (c, r) => this.cellBlocked(c, r),
      bedSpot: () => {
        const rug = HomeStore.placed.find((f) => f.kind === 'rug');
        if (!rug) return null;
        const { w, h } = footprint(rug.kind, rug.dir);
        return { x: OX + (rug.tx + w / 2) * IT, y: OY + (rug.ty + h / 2) * IT + 10 };
      },
      player: () => ({ x: this.px, y: this.py }),
    });
    this.events.once('shutdown', () => {
      this.ambience?.destroy(); this.ambience = undefined;
      this.cat?.destroy(); this.cat = undefined;
      this.radioWaves?.remove(); this.radioWaves = undefined;
      GameState.mealAtTable = false;
    });
    // 190차 — 도감(AnglerLogScene)에서 돌아오면 페이드인 + 하늘·불빛 다시 읽기
    const onResume = (): void => { this.cameras.main.fadeIn(220, 0, 10, 20); this.ambience?.refresh(); };
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => this.events.off('resume', onResume));

    // 플레이어 — 188차 프롤로그 기상은 침대 왼편 · 그 밖에는 현관 매트 위에서 방을 바라본다
    if (this.wake) { this.px = OX + 8.6 * IT; this.py = OY + 4.6 * IT; this.facing = 'down'; }
    else { this.px = OX + (DOOR_MAT.tx + DOOR_MAT.fw / 2) * IT; this.py = OY + (DOOR_MAT.ty + 0.25) * IT; this.facing = 'up'; }
    this.charSprite = new CharacterSprite(this, this.px, this.py, characterLook(), CHAR_SCALE);
    this.charSprite.image.setY(this.py + this.charSprite.footPad).setDepth(20 + this.py * 0.001);
    this.charSprite.setDir(this.facing);
    const bodyH = this.charSprite.bodyHeight;
    this.playerShadow = this.add.ellipse(this.px, this.py, bodyH * 0.42, bodyH * 0.12, 0x000000, 0.28).setDepth(18);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => this.onKey(ev));
    // 188차 — 실내에서도 가방(I)·장비(E)·일지(J). 프롤로그 중에는 배운 만큼만 열린다
    this.input.keyboard!.on('keydown-I', () => { if (this.hotkeyOk('KeyI')) this.toggleInventory(); });
    this.input.keyboard!.on('keydown-E', () => { if (this.hotkeyOk('KeyE')) this.toggleEquipment(); });
    this.input.keyboard!.on('keydown-J', () => { if (this.hotkeyOk('KeyJ')) this.toggleJournal(); });
    const onInv = (): void => {
      syncPrologue();
      this.charSprite.setConfig(characterLook());
      if (this.seat) this.applySeatPose();
    };
    this.events.on('inventory-changed', onInv);
    this.events.once('shutdown', () => this.events.off('inventory-changed', onInv));

    this.hintText = this.add.text(this.px, this.py - 40, '', {
      fontFamily: FONT, fontSize: '11px', color: '#ffe9b0', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 6, y: 2 },
    }).setOrigin(0.5, 1).setDepth(30).setVisible(false);

    // 186차 — 구 상단 문구(`집 (Tier 0 원룸) — 침대에서 저장 · 문으로 나가기`)는 개발 메모였다(§8-9).
    //   안내는 첫 입장 혼잣말과 가구 앞 [F] 힌트가 맡는다.
    this.events.once('shutdown', () => { this.tourSpotTween?.stop(); this.tourPanel?.destroy(); });
    // 191차 — 상단 「지금 할 일 · 목표 · 방법」 띠는 지웠다(규칙 R11 — 글자 나열 금지). 프롤로그는 말풍선 코치가 잇는다.
    this.coach = new PrologueCoach(this);
    this.events.once('shutdown', () => { this.coach?.destroy(); this.coach = undefined; });
    this.buildDecorButton();
    syncPrologue();
    this.refreshDecorButton();
    if (this.wake) {
      // 188차 — 프롤로그: 186차 가구 순회 안내 대신 기상 혼잣말 → 첫 걸음 체험 가이드
      GameState.setFlag('intro.homeTour');
      GameState.markDirty();
      this.time.delayedCall(320, () => this.startWake());
    } else if (!GameState.getFlag('intro.homeTour')) {
      // 페이드인이 끝난 뒤에 열어야 첫 단락이 어둠 속에서 타이핑되지 않는다
      this.time.delayedCall(320, () => this.startTour());
    }
  }

  // ── 키 입력 ─────────────────────────────────────────

  /** 확장 패널 · 배치 모드 · ESC를 한곳에서 받는다 (단축키 I·E·J는 각자) */
  private onKey(ev: KeyboardEvent): void {
    if (this.leaving) return;
    // 213차 — 자는 중: ESC · Enter · Space · F = 일어나기(가이드가 떠 있으면 가이드가 먼저)
    if (this.sleepState) {
      if (!GuideTour.blocking && ['Escape', 'Enter', 'Space', 'KeyF'].includes(ev.code)) this.wakeUp(false);
      return;
    }
    if (ev.code === 'Escape') { this.onEscape(); return; }
    if (this.decor) {
      if (ev.code === 'KeyR' && !GuideTour.blocksKey('KeyR')) this.decor.rotate();
      return;
    }
    if (this.menu && !this.popups.length && !this.tourPanel) {
      if (GuideTour.blocksKey(ev.code)) return;
      const m = this.menu;
      if (ev.code === 'ArrowUp') { m.sel = (m.sel + m.items.length - 1) % m.items.length; this.paintMenu(); return; }
      if (ev.code === 'ArrowDown') { m.sel = (m.sel + 1) % m.items.length; this.paintMenu(); return; }
      if (ev.code === 'Enter' || ev.code === 'Space' || ev.code === 'KeyF') { m.items[m.sel]?.run(); return; }
      return;
    }
    if (ev.code === 'KeyF' && !this.tourPanel && !this.popups.length && !GuideTour.blocksKey('KeyF')) this.tryInteract();
  }

  private onEscape(): void {
    if (this.tourPanel) return;   // 혼잣말 창이 ESC를 '다음'으로 받는다
    if (GuideTour.blocksKey('Escape')) return;
    if (this.decor) { this.decor.escape(); return; }
    if (this.popups.length) { this.popups[this.popups.length - 1].close(); return; }
    if (this.cookPanel) { this.closeCook(); return; }
    if (this.fridgePanel) { this.closeFridge(); return; }
    if (this.menu) { this.menu.onCancel(); return; }
    if (this.prologueHoldsDoor()) return;
    this.exitToField();
  }

  /**
   * 191차 — 프롤로그 집 안 단계(저장 전)에는 집 밖으로 나가지 않는다.
   * 사용자 리포트: 안내 도중 ESC를 누르니 마당으로 나가져 말풍선 흐름이 끊겼다. 문 앞 매트도 같다.
   */
  private prologueHoldsDoor(): boolean {
    if (!prologueRunning() || prologueStepDone('save')) return false;
    this.flash('아직 집에서 챙길 것이 남았다.');
    return true;
  }

  // ── 프롤로그 (188차) ─────────────────────────────────

  /** 기상 혼잣말 → 첫 걸음 체험(걷기 · 뛰기 · 소파에 앉았다 일어서기 · 낚시 상자 열기) */
  private wakeStarted = false;
  private startWake(): void {
    if (this.wakeStarted) return;   // 지연 호출과 직접 호출이 겹쳐도 한 번만
    this.wakeStarted = true;
    this.facing = 'down';
    this.charSprite.setDir('down');
    const panel = new MonologuePanel(this, WAKE_MONOLOGUE, () => {
      panel.destroy();
      this.tourPanel = undefined;
      this.startFirstSteps();
    });
    this.add.existing(panel);
    this.tourPanel = panel;
  }

  private roomRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(OX - 20, OY - 20, ROOM_W * IT + 40, ROOM_H * IT + 40);
  }

  private startFirstSteps(): void {
    const sofa = this.tourRect('sofa');
    const sofaSide: 'left' | 'right' = sofa && sofa.centerX < OX + (ROOM_W * IT) / 2 ? 'left' : 'right';
    maybeStartTour(this, () => ({
      id: 'home_first_steps',
      anchor: () => this.roomRect(),
      alive: () => this.scene.isActive(),
      steps: [
        {
          text: '방향키로 걸을 수 있다. 방 안을 조금 걸어 보자.',
          passive: true,
          wait: () => this.walked >= 140,
        },
        {
          text: 'Shift를 누른 채 걸으면 뛴다. 뛰어 보자.',
          passive: true,
          wait: () => this.ranMs >= 500,
        },
        {
          text: '쓸 수 있는 가구 앞에 서면 머리 위에 [F]가 뜬다. 소파 앞으로 가서 [F]로 앉아 보자.',
          passive: true,
          target: () => this.tourRect('sofa'),
          side: 'auto',
          wait: () => this.satCount > 0,
        },
        {
          // 191차 — 사용자 문안 그대로 · 소파가 방 왼편이면 말풍선도 왼편에
          text: '앉아 있을 때, 실시간으로 고를 수 있는 다른 행동을 취할 수 있다. 계속 쉬려면 그대로 두면 된다. [일어나기]를 선택해서, 다시 일어나자.',
          passive: true,
          target: () => this.menuRect(),
          // 메뉴는 앉은 자리 옆 어디에든 뜰 수 있다 — 말풍선은 소파가 있는 쪽에 둔다
          side: sofaSide,
          wait: () => this.stoodCount > 0,
        },
        {
          text: '침대 발치에 아버지의 낚시 상자가 있다. 상자 앞에서 [F]로 열어 보자.',
          passive: true,
          target: () => this.tourRect('father_box'),
          side: 'auto',
          wait: () => GameState.getFlag('prologue.box'),
        },
      ],
    }));
  }

  /** 단축키를 받아도 되는가 — 대화·안내·메뉴·배치 중이 아니고, 가이드·프롤로그 단계가 허용할 때 */
  private hotkeyOk(code: string): boolean {
    if (this.tourPanel || this.menu?.kind === 'bed' || this.fridgePanel || this.cookPanel || this.decor || this.leaving) return false;
    return !GuideTour.blocksKey(code) && prologueKeyAllowed(code);
  }

  private openPopup<T extends DraggablePanel>(make: (close: () => void) => T, onClosed?: () => void): T {
    let entry: { panel: DraggablePanel; close: () => void } | null = null;
    const close = (): void => {
      if (!entry) return;
      const e = entry; entry = null;
      this.popups = this.popups.filter((x) => x !== e);
      e.panel.destroy();
      onClosed?.();
      this.refreshDecorButton();
    };
    const panel = make(close);
    this.add.existing(panel);
    panel.raiseToTop();
    entry = { panel, close };
    this.popups.push(entry);
    return panel;
  }

  private toggleInventory(): void {
    if (this.invPanel) { this.popups.find((e) => e.panel === this.invPanel)?.close(); return; }
    this.invPanel = this.openPopup(
      (close) => new InventoryPanel(this, 70, 60, {
        onClose: close,
        onOpenDetail: (item) => this.openItemDetail(item),
        onOpenTackle: () => { /* 실내에는 채비 창이 없다 */ },
      }),
      () => { this.invPanel = null; },
    );
  }

  private toggleEquipment(): void {
    if (this.equipPanel) { this.popups.find((e) => e.panel === this.equipPanel)?.close(); return; }
    this.equipPanel = this.openPopup(
      (close) => new EquipmentPanel(this, GAME_WIDTH - 420, 22, close,
        () => { this.charSprite.setConfig(characterLook()); syncPrologue(); }),
      () => { this.equipPanel = null; },
    );
  }

  private toggleJournal(): void {
    if (this.journalPanel) { this.popups.find((e) => e.panel === this.journalPanel)?.close(); return; }
    this.journalPanel = this.openPopup((close) => new JournalPanel(this, {
      onClose: close,
      onOpenDay: (pages, idx) => { this.openPopup((c2) => new DayReportPanel(this, pages, idx, 'past', c2)); },
      onOpenConsign: () => { this.openPopup((c2) => new ConsignListPanel(this, { onClose: c2, canRetrieve: false })); },
    }), () => { this.journalPanel = null; });
    markPrologue('journal');
  }

  private openItemDetail(item: InvItem): void {
    if (item.id === PROLOGUE_PHOTO_ID) markPrologue('photo');
    this.openPopup((close) => new ItemDetailPanel(this, item, 180 + this.popups.length * 24, 100 + this.popups.length * 24, close));
  }

  /** 아버지의 낚시 상자 — 처음 한 번 대·릴·가족사진을 가방에 넣는다 (그 뒤로는 [F]가 뜨지 않는다) */
  private openFatherBox(): void {
    if (GameState.getFlag('prologue.box')) return;
    for (const tpl of FATHER_BOX_ITEMS) if (!InventoryStore.find(tpl.id)) InventoryStore.addItem({ ...tpl }, 1);
    const photo = QUEST_REWARD_ITEMS.find((q) => q.id === PROLOGUE_PHOTO_ID);
    if (photo && !InventoryStore.find(PROLOGUE_PHOTO_ID)) InventoryStore.addItem({ ...photo, bound: true }, 1);
    GameState.setFlag('prologue.box');
    GameState.markDirty();
    this.events.emit('inventory-changed');
    markPrologue('box');
    this.clearSpot();
    const r = this.tourRect('father_box');
    const panel = new MonologuePanel(this, BOX_MONOLOGUE, () => {
      panel.destroy();
      this.tourPanel = undefined;
      this.clearSpot();
      // 191차 — 상자는 이제 내 가방이다(방에서 치운다). 가방 = 인벤토리(I)가 이 순간 열린다.
      this.takeBoxAsBag();
      this.refreshDecorButton();
    });
    this.add.existing(panel);
    this.tourPanel = panel;
    if (r) { panel.setDimAlpha(0); this.drawSpot(r); }
  }

  /** 191차 — 아버지의 낚시 상자를 가방으로 메고 간다 — 방에서 치운다(구세이브는 입장 때 정리) */
  private takeBoxAsBag(): void {
    if (!HomeStore.find('father_box') && !HomeStore.stored.some((f) => f.id === 'father_box')) return;
    HomeStore.discard('father_box');
    this.buildFurniture(null);
    this.cat?.relocateIfBlocked();
  }

  /** 배치 모드 단추 — 프롤로그 동안 · 배치 중에는 숨긴다 */
  private refreshDecorButton(): void {
    this.decorBtn?.setVisible(!prologueRunning() && !this.decor);
  }

  /** 191차 — 프롤로그 코치: 지금 단계의 말풍선 (집 안 단계만 — 마당부터는 필드 씬이 잇는다) */
  private coachStage(): CoachStage | null {
    if (!prologueRunning() || this.decor) return null;
    const room = (): Phaser.Geom.Rectangle => this.roomRect();
    const anyPopup = this.popups.length > 0 || !!this.fridgePanel || !!this.cookPanel;
    // 짚을 자리가 없는 안내 — 방 오른편에 꼬리 없이. 창이 떠 있으면 창들 옆으로 비킨다(둘 다 막히면 아래 가운데).
    //   열린 창 구성이 바뀌면 자리도 바뀌어야 하므로 단계 키에 붙인다.
    const openB = this.openPanelBounds();
    const dock = (key: string, text: string): CoachStage => openB
      ? { key: `${key}@${Math.round(openB.x)}:${Math.round(openB.right)}`, text, anchor: () => openB, side: 'right', dockY: GAME_HEIGHT - 150 }
      : { key, text, anchor: room, side: 'right', dockY: OY + 30 };
    const inv = this.invPanel;
    const invB = (): Phaser.Geom.Rectangle | null => (this.invPanel?.active ? this.invPanel.panelBounds() : null);
    if (!prologueStepDone('box')) {
      // 새 게임(기상) 입장은 첫 걸음 가이드가 상자까지 맡는다 — 혼잣말이 열리기 전 틈에 끼어들지 않게
      if (this.wake || anyPopup || this.menu) return null;
      return { key: 'box', text: '침대 발치에 아버지의 낚시 상자가 있다. 상자 앞에서 [F]로 열어 보자.',
        target: () => this.tourRect('father_box'), anchor: room, side: 'auto' };
    }
    if (!prologueStepDone('rod')) {
      if (!inv) return dock('bag', '단축키 [I] 키를 눌러, 인벤토리를 열어 보자. 가방에서 얻은 아버지의 장비를 확인해 보자.');
      const rod = InventoryStore.items.find((i) => i.tool === 'rod' && !i.equipped);
      return { key: 'rod', text: '아버지의 대를 우클릭해 「오른손 착용」으로 손에 들어 보자.',
        target: () => (rod ? this.invPanel?.itemGuideRect(rod.id) : null), anchor: invB };
    }
    if (!prologueStepDone('reel')) {
      const eq = this.equipPanel;
      if (!eq) return dock('reel_open', '대를 손에 들었다. 나머지 릴도 장착해 보자. 단축키 [E]로 장비창을 열자.');
      const both = (): Phaser.Geom.Rectangle | null => {
        const b = this.equipPanel?.active ? this.equipPanel.panelBounds() : null;
        const i = invB();
        return b && i ? Phaser.Geom.Rectangle.Union(b, i) : b;
      };
      if (!inv) return { key: 'reel_bag', text: '릴은 가방에 있다. [I]로 가방도 함께 열자.', anchor: both };
      return { key: 'reel_fit', text: '가방의 릴을 끌어다 장비창 「릴」 칸에 놓아 보자.',
        target: () => this.equipPanel?.slotGuideRect('reel'), anchor: both };
    }
    if (!prologueStepDone('photo')) {
      if (!inv) return dock('photo_bag', '상자 속 사진도 가방에 넣어 두었다. [I]로 가방을 열어 사진을 찾아보자.');
      return { key: 'photo', text: '사진을 우클릭해 「상세보기」로 뒷면을 살펴보자.',
        target: () => this.invPanel?.itemGuideRect(PROLOGUE_PHOTO_ID), anchor: invB };
    }
    if (!prologueStepDone('journal')) return dock('journal', '오늘 할 일을 일지에 적어 두었다. 단축키 [J]로 일지를 펼쳐 보자.');
    if (!prologueStepDone('squid')) {
      if (this.fridgePanel) {
        return { key: 'squid_take', text: '냉동고 칸의 오징어를 눌러 가방으로 옮기자. 속초 직판장에 팔아 노잣돈을 보탤 것이다.',
          anchor: () => (this.fridgePanel?.active ? this.fridgePanel.panelBounds() : null) };
      }
      if (anyPopup) return dock('squid_close', '창을 닫고 부엌 냉장고로 가자. 얼려 둔 오징어를 챙겨야 한다.');
      return { key: 'squid', text: '부엌 냉장고 앞에서 [F]로 냉동고를 열자. 얼려 둔 오징어를 챙겨야 한다.',
        target: () => this.tourRect('fridge'), anchor: room, side: 'auto' };
    }
    if (!prologueStepDone('save')) {
      if (this.menu?.kind === 'bed') {
        return { key: 'save_menu', text: '「저장만 하기」를 골라 오늘을 저장해 두자.', target: () => this.menuRect(), anchor: room, side: 'auto' };
      }
      if (anyPopup) return dock('save_close', '창을 닫고 침대로 가자. 떠나기 전에 저장해 두어야 한다.');
      return { key: 'save', text: '떠나기 전에 침대 앞에서 [F]를 눌러 저장해 두자.',
        target: () => this.tourRect('bed'), anchor: room, side: 'auto' };
    }
    if (!prologueStepDone('leave')) {
      if (anyPopup) return null;
      return { key: 'leave', text: '이제 집을 나서자. 현관 매트를 밟고 아래로 걸어 나가면 된다.',
        target: () => this.tourRect('door_mat'), anchor: room, side: 'auto' };
    }
    return null;
  }

  /** 열린 창(가방·장비·일지·상세보기·냉장고·조리)을 모두 덮는 사각형 — 없으면 null */
  private openPanelBounds(): Phaser.Geom.Rectangle | null {
    const list: Phaser.Geom.Rectangle[] = this.popups.filter((e) => e.panel.active).map((e) => (e.panel as DraggablePanel).panelBounds());
    if (this.fridgePanel?.active) list.push(this.fridgePanel.panelBounds());
    if (this.cookPanel?.active) list.push(this.cookPanel.panelBounds());
    if (!list.length) return null;
    return list.reduce((a, b) => Phaser.Geom.Rectangle.Union(a, b));
  }

  /** 코치가 끼면 안 되는 순간 — 혼잣말·앉은 자리 메뉴·나가는 중 */
  private coachBlocked(): boolean {
    return !!this.tourPanel || this.leaving || !!this.seat || (!!this.menu && this.menu.kind !== 'bed');
  }

  // ── 첫 입장 안내 (186차) ─────────────────────────────

  /** 안내에 쓰는 대상 사각형(화면 좌표). 벽 장식(시계·책·창)과 현관 매트는 가구 목록 밖이라 따로 잰다. */
  private tourRect(id: string): Phaser.Geom.Rectangle | null {
    const wallH = Math.round(IT * 1.4);
    const W = ROOM_W * IT;
    if (id === 'clock') return new Phaser.Geom.Rectangle(OX + IT * 1.4 - 20, OY + Math.round(IT * 0.62) - 20, 40, 40);
    if (id === 'books' || id === 'calendar' || id === 'fishprint') return this.wallRect(id);
    if (id === 'cat') return this.cat ? this.cat.bounds() : null;
    if (id === 'window') return new Phaser.Geom.Rectangle(OX + W - IT * 3.4 - 6, OY + 4, IT * 2.2 + 12, wallH - 18);
    if (id === 'door_mat') {
      return new Phaser.Geom.Rectangle(OX + DOOR_MAT.tx * IT - 4, OY + DOOR_MAT.ty * IT - 4, DOOR_MAT.fw * IT + 8, DOOR_MAT.fh * IT + 24);
    }
    const f = HomeStore.find(id);
    if (!f) return null;
    const { w, h } = footprint(f.kind, f.dir);
    return new Phaser.Geom.Rectangle(OX + f.tx * IT - 4, OY + f.ty * IT - 4, w * IT + 8, h * IT + 8);
  }

  /** 벽 장식 그림 영역 (화면 좌표) — 그리기 · 판정 · 안내가 같은 값을 쓴다 */
  private wallRect(id: WallDecorId): Phaser.Geom.Rectangle {
    const d = WALL_DECOR.find((w) => w.id === id)!;
    const x = OX + d.x0 * IT, w = (d.x1 - d.x0) * IT;
    if (id === 'books') return new Phaser.Geom.Rectangle(x - 4, OY + Math.round(IT * 0.72) - 36, w + 8, 44);
    if (id === 'calendar') return new Phaser.Geom.Rectangle(x, OY + Math.round(IT * WALL_Y.calendar), w, 38);
    return new Phaser.Geom.Rectangle(x, OY + Math.round(IT * WALL_Y.fishprint), w, 30);
  }

  private startTour(): void {
    const steps: { id: string | null; text: string }[] = [{ id: null, text: TOUR_INTRO }];
    for (const id of TOUR_ORDER) if (this.tourRect(id)) steps.push({ id, text: LOOK_TEXT[id]! });
    steps.push({ id: null, text: TOUR_OUTRO });
    let i = 0;
    const next = (): void => {
      if (i >= steps.length) {
        this.clearSpot();
        GameState.setFlag('intro.homeTour');
        GameState.markDirty();
        return;
      }
      const st = steps[i++]!;
      this.showLook(st.id, st.text, next);
    };
    next();
  }

  /** 대상 하나를 비추고 혼잣말 한 단락 — 닫히면 `onDone` */
  private showLook(id: string | null, text: string, onDone: () => void): void {
    this.clearSpot();
    const r = id ? this.tourRect(id) : null;
    // 캐릭터가 그쪽을 바라본다
    if (r && !this.seat) {
      const dx = r.centerX - this.px, dy = r.centerY - this.py;
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      this.charSprite.setDir(this.facing);
    }
    const panel = new MonologuePanel(this, [text], () => {
      panel.destroy();
      this.tourPanel = undefined;
      onDone();
    });
    this.add.existing(panel);
    this.tourPanel = panel;
    if (r) {
      // 창이 대상을 가리지 않게 — 방 아래쪽 대상이면 창을 위로 올린다
      if (r.bottom > GAME_HEIGHT - 330) panel.setY(24);
      panel.setDimAlpha(0);
      this.drawSpot(r);
    }
  }

  /** 스포트라이트 — 대상 밖을 어둡게 + 금색 테 점멸 (창의 dim은 0으로 두고 이것이 대신한다) */
  private drawSpot(r: Phaser.Geom.Rectangle): void {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.5);
    g.fillRect(0, 0, GAME_WIDTH, r.top);
    g.fillRect(0, r.bottom, GAME_WIDTH, GAME_HEIGHT - r.bottom);
    g.fillRect(0, r.top, r.left, r.height);
    g.fillRect(r.right, r.top, GAME_WIDTH - r.right, r.height);
    const frame = this.add.graphics();
    frame.lineStyle(2, 0xffd257, 1);
    frame.strokeRoundedRect(r.x, r.y, r.width, r.height, 6);
    this.tourSpotTween = this.tweens.add({ targets: frame, alpha: 0.25, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tourSpot = this.add.container(0, 0, [g, frame]).setDepth(941.5);
  }

  private clearSpot(): void {
    this.tourSpotTween?.stop(); this.tourSpotTween = undefined;
    this.tourSpot?.destroy(); this.tourSpot = undefined;
  }

  // ── 렌더 ─────────────────────────────────────────────

  /**
   * 방 — 173차 재작성 · 189차 현관.
   *
   * 구 구현은 **단색 바닥 + 격자선 + 색 사각형 가구**였고, 그 위에 `주방`·`저장★ 침대`·
   * `지하실 (확장 예약)`·`평수 확장` 같은 **개발 메모가 글자로 박혀** 있었다(§8-9 위반 —
   * 확장 계획은 플레이어의 말이 아니다). 이제 재질을 도트로 그리고, 안내는 [F] 힌트가 맡는다.
   * 189차: 「가로로 누운 문」 그림을 걷어내고, 아래 벽을 터서 **현관 문턱 + 매트**를 깔았다.
   */
  private drawRoom(): void {
    const g = this.add.graphics().setDepth(1);
    const W = ROOM_W * IT, H = ROOM_H * IT;
    /** 2px 그레인 — 필드와 같은 격자 */
    const dot = (x: number, y: number, col: number, a = 1): void => { g.fillStyle(col, a); g.fillRect(x, y, 2, 2); };
    const hash = (x: number, y: number): number => {
      let n = (0x9e37 ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    };
    // 외벽(문틀) 프레임
    g.fillStyle(0x3a2718, 1); g.fillRoundedRect(OX - 20, OY - 20, W + 40, H + 40, 8);
    g.fillStyle(0x4f3622, 1); g.fillRoundedRect(OX - 14, OY - 14, W + 28, H + 28, 6);
    // ── 마루 ── 긴 널빤지(세로 6칸 주기) + 나뭇결 + 이음매
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const plank = Math.floor(x / (IT * 0.75));
        const base = plank % 2 === 0 ? 0xb88a45 : 0xb08240;
        const grain = hash(x + plank * 97, y);
        const col = grain < 0.12 ? 0xa0742f : grain > 0.9 ? 0xc79a52 : base;
        dot(OX + x, OY + y, col);
      }
    }
    for (let x = 0; x < W; x += IT * 0.75) for (let y = 0; y < H; y += 2) dot(OX + x, OY + y, 0x8f6628, 0.8);
    // 188차 — 널빤지 끝 이음매를 **널마다 엇갈리게** (구: 가로 이음매가 IT*2마다 방 전체를 가로질러 격자로 보였다)
    const PW = IT * 0.75, PL = IT * 2;
    for (let p = 0; p * PW < W; p++) {
      const off = Math.round((hash(p, 7) * PL) / 2) * 2;
      for (let y = off; y < H; y += PL) for (let x = 2; x < PW - 1; x += 2) dot(OX + p * PW + x, OY + y, 0x8f6628, 0.6);
    }
    // ── 벽 ── 상단 밴드: 아래는 징두리(판벽), 위는 회벽
    const wallH = Math.round(IT * 1.4);
    for (let y = 0; y < wallH; y += 2) for (let x = 0; x < W; x += 2) {
      const wain = y > wallH - 16;
      const col = wain ? ((x / 2) % 8 < 2 ? 0x6a4728 : 0x7a5330) : (hash(x, y + 999) > 0.94 ? 0xdcc9a8 : 0xd2bd9a);
      dot(OX + x, OY + y, col);
    }
    for (let x = 0; x < W; x += 2) { dot(OX + x, OY + wallH - 18, 0x8a6138); dot(OX + x, OY + wallH - 16, 0x5a3c22); }  // 몰딩
    for (let x = 0; x < W; x += 2) dot(OX + x, OY + wallH, 0x3a2718, 0.5);                                              // 벽 그림자
    // ── 창 ── 벽 오른쪽. 햇살이 마루에 떨어진다
    const wx = OX + W - IT * 3.4, wy = OY + 10, ww = IT * 2.2, wh = wallH - 30;
    for (let y = 0; y < wh; y += 2) for (let x = 0; x < ww; x += 2) dot(wx + x, wy + y, hash(x, y) > 0.8 ? 0xcfe8f5 : 0xaed4ea);
    for (let x = 0; x < ww; x += 2) { dot(wx + x, wy - 2, 0x5a3c22); dot(wx + x, wy + wh, 0x5a3c22); }
    for (let y = -2; y < wh + 2; y += 2) { dot(wx - 2, wy + y, 0x5a3c22); dot(wx + ww, wy + y, 0x5a3c22); }
    for (let y = 0; y < wh; y += 2) dot(wx + ww / 2, wy + y, 0x5a3c22);
    // 190차 — 창으로 드는 빛은 시각·날씨를 따라 `HomeAmbience`가 그린다(구 고정 햇살 폐기)
    // ── 벽시계 (판) ── 바늘은 실제 시각을 따라 `drawClockHands`가 따로 그린다
    const cx = OX + IT * 1.4, cy = OY + Math.round(IT * 0.62);
    g.fillStyle(0x3a2718, 1); g.fillCircle(cx, cy, 16);
    g.fillStyle(0xf2e2b8, 1); g.fillCircle(cx, cy, 13);
    g.fillStyle(0x3a2718, 1);
    for (let a = 0; a < 12; a++) g.fillRect(cx + Math.round(Math.cos(a * Math.PI / 6) * 10) - 1, cy + Math.round(Math.sin(a * Math.PI / 6) * 10) - 1, 2, 2);
    // ── 벽 선반 + 책 ── (190차 — 달력·어탁 자리를 내느라 선반을 줄였다)
    const sx = OX + IT * 4.1, sy = OY + Math.round(IT * 0.72);
    for (let x = 0; x < IT * 1.9; x += 2) { dot(sx + x, sy, 0x8a6138); dot(sx + x, sy + 2, 0x5a3c22); }
    const books = [0xb04a3a, 0x3a6ea5, 0x3f9e63, 0xc2913a, 0x8a5aa8];
    books.forEach((col, i) => {
      const bx = sx + 6 + i * 16, bh = 22 + (i % 3) * 5;
      for (let y = 0; y < bh; y += 2) for (let x = 0; x < 10; x += 2) dot(bx + x, sy - bh + y, y < 3 ? 0xffffff : col);
    });
    // ── 달력 (190차) ── 못에 걸린 한 장 달력: 붉은 머리띠 + 날짜 칸 + 오늘 동그라미
    const cal = this.wallRect('calendar');
    for (let y = 0; y < cal.height; y += 2) for (let x = 0; x < cal.width; x += 2) {
      dot(cal.x + x, cal.y + y, y < 8 ? 0xb04a3a : (x === 0 || x >= cal.width - 2 || y >= cal.height - 2) ? 0xc8bca0 : 0xf4ead2);
    }
    dot(cal.x + cal.width / 2 - 1, cal.y - 2, 0x3a2718);
    const today = Number(kstParts().d);
    for (let k = 0; k < 28; k++) {
      const cx = cal.x + 4 + (k % 7) * 4, cy = cal.y + 12 + Math.floor(k / 7) * 6;
      dot(cx, cy, k + 1 === Math.min(28, today) ? 0xd03a2a : 0x8a7a64);
    }
    // ── 어탁 액자 (190차) ── 나무 테 + 한지. 먹으로 뜬 고기는 `drawFishPrintInk`가 얹는다
    const fp = this.wallRect('fishprint');
    for (let y = 0; y < fp.height; y += 2) for (let x = 0; x < fp.width; x += 2) {
      const edge = x < 4 || x >= fp.width - 4 || y < 4 || y >= fp.height - 4;
      dot(fp.x + x, fp.y + y, edge ? ((x + y) % 6 === 0 ? 0x4a3018 : 0x5a3c22) : (hash(x, y + 77) > 0.9 ? 0xe6dcc4 : 0xf2ead8));
    }
    dot(fp.x + fp.width - 10, fp.y + fp.height - 10, 0xb03a2a); dot(fp.x + fp.width - 8, fp.y + fp.height - 10, 0xb03a2a);
    // ── 현관 (189차) ── 아래 벽을 터서 문턱과 바깥 돌계단을 보이고, 바닥에는 매트를 깐다
    const mx = OX + DOOR_MAT.tx * IT, my = OY + DOOR_MAT.ty * IT, mw = DOOR_MAT.fw * IT;
    for (let y = 0; y < 20; y += 2) for (let x = 0; x < mw; x += 2) {
      const col = y < 4 ? 0x2a1a0e : (hash(x, y + 400) > 0.85 ? 0xc9c2b0 : 0xb5ad98);
      dot(mx + x, OY + H + y, col);
    }
    for (let x = 0; x < mw; x += 2) { dot(mx + x, OY + H + 12, 0x9a927c); dot(mx + x, OY + H + 18, 0x847c68); }
    for (let y = -6; y < 20; y += 2) { dot(mx - 2, OY + H + y, 0x2a1a0e); dot(mx + mw, OY + H + y, 0x2a1a0e); }   // 문설주
    g.fillStyle(0xfff3c4, 0.08); g.fillRect(mx, OY + H - IT * 1.2, mw, IT * 1.2);                                   // 열린 문으로 드는 빛
    for (let y = 6; y < IT - 4; y += 2) for (let x = 6; x < mw - 6; x += 2) {
      const edge = x < 10 || x > mw - 12 || y < 10 || y > IT - 8;
      const weave = ((x >> 1) + (y >> 1)) % 4 < 2;
      dot(mx + x, my + y, edge ? 0x6e2f22 : weave ? 0xa8563a : 0x96492f);
    }
    for (let x = 8; x < mw - 8; x += 4) { dot(mx + x, my + 4, 0xd8c8a0); dot(mx + x, my + IT - 4, 0xd8c8a0); }       // 술
  }

  /** 벽시계 바늘 — 실제 한국 시각을 따른다 (30초마다 다시 그린다) */
  private drawClockHands(): void {
    const g = this.clockG;
    if (!g) return;
    g.clear();
    const cx = OX + IT * 1.4, cy = OY + Math.round(IT * 0.62);
    const p = kstParts();
    const h = (Number(p.hh) % 12) + Number(p.mi) / 60, m = Number(p.mi);
    const hand = (ang: number, len: number, col: number): void => {
      g.fillStyle(col, 1);
      for (let t = 0; t <= len; t += 1.5) {
        g.fillRect(Math.round(cx + Math.sin(ang) * t) - 1, Math.round(cy - Math.cos(ang) * t) - 1, 2, 2);
      }
    };
    hand((h / 12) * Math.PI * 2, 6, 0x3a2718);
    hand((m / 60) * Math.PI * 2, 9, 0x5a3c22);
    g.fillStyle(0xb04a3a, 1); g.fillRect(cx - 1, cy - 1, 2, 2);
  }

  /** 어탁 — 지금까지 낚은 가장 큰 고기를 먹빛 실루엣으로 액자 속 한지에 얹는다 (190차) */
  private drawFishPrintInk(): void {
    const best = [...GameState.player.caughtFishHistory].sort((a, b) => b.lengthCm - a.lengthCm)[0];
    if (!best) return;
    const key = resolveFishTexture(best.fishSpeciesId, best.lengthCm, 'M');
    if (!key || !this.textures.exists(key)) return;
    const r = this.wallRect('fishprint');
    const img = this.add.image(r.centerX - 2, r.centerY, key).setTintFill(0x1e1e24).setAlpha(0.85).setDepth(2);
    const src = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const sc = Math.min((r.width - 14) / src.width, (r.height - 10) / src.height);
    img.setDisplaySize(src.width * sc, src.height * sc);
  }

  /** 가구 depth — 러그는 바닥, 나머지는 바닥선(y)으로 캐릭터와 앞뒤를 가린다 */
  private furnDepth(f: FurnInstance): number {
    if (FURN_DEFS[f.kind].floor) return 6;
    const { h } = footprint(f.kind, f.dir);
    return 20 + (OY + (f.ty + h) * IT - 14) * 0.001;
  }

  /**
   * 가구 — 인스턴스마다 Graphics 하나(189차 — 옮기고 돌리려면 따로 그려야 한다).
   * 라벨 글자는 없다 — 무엇인지는 그림이 말하고, 무엇을 할 수 있는지는 [F] 힌트가 말한다.
   */
  private buildFurniture(hideId: string | null): void {
    for (const v of this.furnViews.values()) v.destroy();
    this.furnViews.clear();
    for (const s of this.tankSwim) s.img.destroy();
    this.tankSwim = [];
    for (const f of HomeStore.placed) {
      if (f.id === hideId) continue;
      const g = this.add.graphics();
      // 190차 — 화분 목마름 · 스탠드 켜짐은 개체마다 다르다
      drawFurnitureArt(g, f.kind, f.dir, { plantDry: HomeStore.plantDry(f.id), lampOn: HomeStore.isLampOn(f.id) });
      g.setPosition(OX + f.tx * IT, OY + f.ty * IT).setDepth(this.furnDepth(f));
      this.furnViews.set(f.id, g);
      if (f.kind === 'aquarium') this.buildTankFish(f);
    }
    this.ambience?.refreshLights();
  }

  /** 수조 속 고기 — 유리 안에서 좌우로 헤엄친다 (190차) */
  private buildTankFish(f: FurnInstance): void {
    const { w } = footprint(f.kind, f.dir);
    const gx0 = OX + f.tx * IT + 10, gx1 = OX + (f.tx + w) * IT - 10;
    const top = OY + f.ty * IT + 10, bottom = OY + (f.ty + 1) * IT - 28;
    HomeStore.tank(f.id).forEach((fish, i) => {
      const key = tankFishTexture(fish, this);
      if (!key || !this.textures.exists(key)) return;
      const img = this.add.image(gx0 + 12 + ((i * 23) % (gx1 - gx0 - 24)), top + ((i * 7) % Math.max(1, bottom - top)), key);
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement;
      const len = Phaser.Math.Clamp(8 + fish.lengthCm * 0.4, 10, 22);
      img.setDisplaySize(len, Math.max(4, (src.height / src.width) * len)).setDepth(this.furnDepth(f) + 0.0001);
      this.tankSwim.push({ img, x0: gx0, x1: gx1, vx: (i % 2 ? -1 : 1) * (0.01 + (i % 3) * 0.004), y0: img.y, ph: i * 1.3 });
    });
  }

  private animateTanks(delta: number): void {
    for (const s of this.tankSwim) {
      const half = s.img.displayWidth / 2;
      let nx = s.img.x + s.vx * delta;
      if (nx - half < s.x0 || nx + half > s.x1) { s.vx = -s.vx; nx = s.img.x + s.vx * delta; }
      s.ph += delta / 700;
      s.img.setPosition(nx, s.y0 + Math.sin(s.ph) * 2).setFlipX(s.vx < 0);
    }
    // 이따금 공기 방울
    this.bubbleAcc += delta;
    if (this.bubbleAcc < 900) return;
    this.bubbleAcc = 0;
    for (const f of HomeStore.placed) {
      if (f.kind !== 'aquarium') continue;
      const bx = OX + f.tx * IT + 14 + Math.random() * (footprint(f.kind, f.dir).w * IT - 28);
      const b = this.add.rectangle(bx, OY + f.ty * IT + IT - 28, 2, 2, 0xe8f6ff, 0.9).setDepth(this.furnDepth(f) + 0.0002);
      this.tweens.add({ targets: b, y: OY + f.ty * IT + 8, alpha: 0.2, duration: 1400, onComplete: () => b.destroy() });
    }
  }

  /** 지금 켜져 있는 불빛 — 스탠드(따뜻한 노랑) · 수조(푸른빛) */
  private litSources(): AmbienceLight[] {
    const out: AmbienceLight[] = [];
    for (const f of HomeStore.placed) {
      if (f.kind === 'stand' && HomeStore.isLampOn(f.id)) {
        out.push({ x: OX + f.tx * IT + IT / 2, y: OY + f.ty * IT + 6, r: 190, color: 0xffd98a });
      } else if (f.kind === 'aquarium') {
        const { w } = footprint(f.kind, f.dir);
        out.push({ x: OX + (f.tx + w / 2) * IT, y: OY + f.ty * IT + 16, r: 80, color: 0x5ab8ff });
      }
    }
    return out;
  }

  /** 그 칸을 지날 수 없는가 (고양이 길찾기 — 가구 칸) */
  private cellBlocked(c: number, r: number): boolean {
    if (c < 0 || c >= ROOM_W || r < FLOOR_TOP || r >= ROOM_H) return true;
    return HomeStore.placed.some((f) => {
      if (!FURN_DEFS[f.kind].collides) return false;
      const { w, h } = footprint(f.kind, f.dir);
      return c >= f.tx && c < f.tx + w && r >= f.ty && r < f.ty + h;
    });
  }

  // ── 가구 배치 (189차) ─────────────────────────────────

  private buildDecorButton(): void {
    const w = 150, h = 34;
    // 198차 — 화면 오른쪽 끝(GAME_WIDTH 기준)이 아니라 **방 액자 오른쪽 위**에 앵커한다.
    //   구 좌표는 필드 HUD의 미니맵 아래쪽을 덮었다(사용자 지적). 놓은 뒤 HUD 예약 영역과 겹치는지 확인한다.
    const { x, y } = this.decorButtonSpot(w, h);
    const c = this.add.container(x, y).setDepth(70);
    const bg = this.add.graphics();
    const paint = (hover: boolean): void => {
      bg.clear();
      bg.fillStyle(hover ? 0x1d3a56 : 0x14283c, 0.95); bg.fillRoundedRect(0, 0, w, h, 6);
      bg.lineStyle(1.5, 0xffd257, hover ? 1 : 0.7); bg.strokeRoundedRect(0, 0, w, h, 6);
    };
    paint(false);
    const t = this.add.text(w / 2, h / 2, '가구 배치', { fontFamily: FONT, fontSize: '14px', color: '#ffe9b0', fontStyle: 'bold' }).setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, w, h, 0xffffff, 0.001).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => paint(true));
    hit.on('pointerout', () => paint(false));
    hit.on('pointerdown', () => this.openDecor());
    c.add([bg, t, hit]);
    this.decorBtn = c;
  }

  /** [가구 배치] 자리 — 방 액자 오른쪽 위 바깥 → 막히면 왼쪽 위 바깥 (HUD 예약 영역을 피한다) */
  private decorButtonSpot(w: number, h: number): { x: number; y: number } {
    const reserved = fieldReserved(this);
    const frameTop = OY - 20, frameRight = OX + ROOM_W * IT + 20, frameLeft = OX - 20;
    const cands = [
      new Phaser.Geom.Rectangle(frameRight - w, frameTop - 8 - h, w, h),
      new Phaser.Geom.Rectangle(frameLeft, frameTop - 8 - h, w, h),
    ];
    const pick = cands.find((r) => overlapsReserved(r, reserved).length === 0) ?? cands[0];
    assertClear('home.decorButton', pick, reserved);
    return { x: pick.x, y: pick.y };
  }

  /** 배치 모드 — 서 있을 때 · 창이 다 닫혔을 때만 */
  openDecor(): void {
    if (this.decor || prologueRunning() || this.leaving) return;
    if (this.tourPanel || this.popups.length || this.fridgePanel || this.cookPanel || this.menu || this.seat) return;
    if (GuideTour.active && GuideTour.blocksKey('KeyF')) return;
    this.hintText.setVisible(false);
    this.decorBtn?.setVisible(false);
    this.cat?.setHidden(true);   // 190차 — 배치 중에는 고양이가 비킨다(칸이 가려지지 않게)
    this.decor = new HomeDecorMode(this, {
      ox: OX, oy: OY,
      redraw: (hideId) => this.buildFurniture(hideId),
      playerTile: () => ({ x: (this.px - OX) / IT, y: (this.py - OY) / IT }),
      artState: () => ({ plantDry: false, lampOn: false }),
      onExit: () => {
        this.decor = undefined;
        this.buildFurniture(null);
        this.cat?.setHidden(false);
        this.cat?.relocateIfBlocked();
        this.refreshDecorButton();
        restoreHandCursor(this);
      },
    });
    this.ambience?.refreshLights();
  }

  // ── 이동/충돌 (간이 AABB — 물리 미사용) ──────────────

  update(_t: number, delta: number): void {
    LedgerStore.playTick(delta);   // 211차 — 하루 기록 놀던 시간
    // 213차 — 자는 중: 잠 막대만 흐르고 다른 건 멈춘다(창밖 날씨 · 불빛은 계속)
    if (this.sleepState) { this.stepSleep(delta); this.ambience?.update(delta); return; }
    GameState.noteAwake(delta);   // 213차 — 잠 가부(깨어 논 시간)
    this.consignAcc += delta;   // 213차 — 맡겨 둔 위판 정산(회차가 열렸으면)
    if (this.consignAcc >= 1000) { this.consignAcc = 0; this.settleConsignments(); }
    pumpTitleBanners(this);   // 203차 — 숨은 업적 달성 배너(고양이 집사 …)
    pumpTideFlow(this, { toastY: 60 });   // 204차 — 「물때 감각」
    this.updateHomeTitle();
    // 154차 — 집 주방 화구는 wall-clock으로 계속 끓는다(패널이 닫혀 있어도). 1초마다 동기화.
    this.cookSyncAcc += delta;
    if (this.cookSyncAcc >= 1000) { this.cookSyncAcc = 0; CookingStore.syncAll(); }
    // 188차 — 프롤로그 동기화(1초) · 「지금 할 일」 짚기
    this.syncAcc += delta;
    if (this.syncAcc >= 1000) { this.syncAcc = 0; syncPrologue(); this.refreshDecorButton(); }
    this.clockAcc += delta;
    if (this.clockAcc >= 30000) { this.clockAcc = 0; this.drawClockHands(); }
    this.coach?.update(this.coachStage(), this.coachBlocked());
    // 190차 — 창밖 비·눈 · 불빛 · 수조 · 고양이는 앉아 있거나 창이 열려 있어도 흐른다
    this.ambience?.update(delta);
    this.animateTanks(delta);
    if (!this.decor) this.cat?.update(delta);
    if (this.seat) {   // 앉아 있는 동안은 자세만 지킨다(텍스처가 바뀌면 자르기가 풀릴 수 있다)
      this.applySeatPose();
      this.hintText.setVisible(false);
      return;
    }
    const tourBlocks = !!GuideTour.active && GuideTour.blocksKey('ArrowUp');
    if (this.menu || this.fridgePanel || this.cookPanel || this.tourPanel || this.popups.length || this.decor || this.leaving || tourBlocks) {
      this.charSprite.update(delta, false);
      this.hintText.setVisible(false);
      return;
    }
    // 144차 — Shift 홀드 달리기(실내는 12x10칸이라 피로 드레인 없이 조작감만 통일)
    const running = !!this.cursors.shift?.isDown;
    const spd = 0.18 * delta * (running ? TUNING.vitals.runSpeedMult : 1);
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown) { dx = -spd; this.facing = 'left'; }
    else if (this.cursors.right.isDown) { dx = spd; this.facing = 'right'; }
    if (this.cursors.up.isDown) { dy = -spd; this.facing = 'up'; }
    else if (this.cursors.down.isDown) { dy = spd; this.facing = 'down'; }
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const ox = this.px, oy = this.py;
    if (!this.collides(this.px + dx, this.py)) this.px += dx;
    if (!this.collides(this.px, this.py + dy)) this.py += dy;
    const moved = Math.hypot(this.px - ox, this.py - oy);
    this.walked += moved;
    if (running && moved > 0) this.ranMs += delta;

    this.charSprite.image.setPosition(this.px, this.py + this.charSprite.footPad).setDepth(20 + this.py * 0.001);
    this.playerShadow.setPosition(this.px, this.py);
    this.charSprite.setDir(this.facing);
    this.charSprite.update(delta, dx !== 0 || dy !== 0, running ? TUNING.vitals.runSpeedMult : 1);
    // 189차 — 현관 매트를 밟고 아래로 걸어 나가면 밖이다(들어오자마자 다시 나가지 않게 0.5초 유예)
    if (this.cursors.down.isDown && this.onMatEdge() && this.time.now - this.enteredAt > 500) {
      if (!this.prologueHoldsDoor()) { this.exitToField(); return; }
      this.py -= 6;   // 매트 끝에서 한 발 물린다(메시지가 매 프레임 다시 뜨지 않게)
    }
    this.updateProximity();
  }

  /** 매트 아래 끝에 닿았는가 */
  private onMatEdge(): boolean {
    const c = (this.px - OX) / IT;
    return c >= DOOR_MAT.tx && c <= DOOR_MAT.tx + DOOR_MAT.fw && this.py >= OY + ROOM_H * IT - 10;
  }

  private collides(px: number, py: number): boolean {
    // 방 경계 (상단 벽 밴드 아래부터. py = 발밑)
    if (px < OX + 12 || px > OX + ROOM_W * IT - 12) return true;
    if (py < OY + IT * 2.0 || py > OY + ROOM_H * IT - 6) return true;
    // 가구 AABB (발밑 기준 — 발이 가구 앞면에 닿으면 정지)
    for (const f of HomeStore.placed) {
      if (!FURN_DEFS[f.kind].collides) continue;
      const { w: fw, h: fh } = footprint(f.kind, f.dir);
      const x = OX + f.tx * IT, y = OY + f.ty * IT, w = fw * IT, h = fh * IT;
      if (px > x - 8 && px < x + w + 8 && py > y + 8 && py < y + h + 12) return true;
    }
    return false;
  }

  /** 머리 위 [F] 문구 */
  private hintOf(t: NearTarget): string {
    if (t.kind === 'cat') return '[F] 고양이';
    if (t.kind === 'wall') return WALL_LABEL[t.id];
    if (t.action === 'lamp') return HomeStore.isLampOn(t.f.id) ? '[F] 스탠드 끄기' : '[F] 스탠드 켜기';
    return ACTION_LABEL[t.action];
  }

  /** 이 가구가 **지금** 받을 수 있는 [F] 행동 (없으면 null — 그 가구 앞에는 아무것도 뜨지 않는다) */
  private actionOf(f: FurnInstance): FurnAction | null {
    const a = FURN_DEFS[f.kind].action;
    if (!a) return null;
    if (a === 'plant') return this.holdingCan() ? 'plant' : null;
    if (a === 'father_box') return GameState.getFlag('prologue.box') ? null : 'father_box';
    return a;
  }

  private holdingCan(): boolean {
    return InventoryStore.getHandEquipped('R')?.tool === 'watering_can' || InventoryStore.getHandEquipped('L')?.tool === 'watering_can';
  }

  /** 발밑에서 가구 footprint 가장자리까지 가장 가까운 것 (닿는 거리 안에서만) */
  private updateProximity(): void {
    let best: NearTarget | null = null;
    let bestD = REACH_PX;
    for (const f of HomeStore.placed) {
      const action = this.actionOf(f);
      if (!action) continue;
      const { w, h } = footprint(f.kind, f.dir);
      const x0 = OX + f.tx * IT, y0 = OY + f.ty * IT;
      const dx = Math.max(x0 - this.px, 0, this.px - (x0 + w * IT));
      const dy = Math.max(y0 - this.py, 0, this.py - (y0 + h * IT));
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = { kind: 'furn', f, action }; }
    }
    // 190차 — 벽 장식: 바로 아래 바닥(벽에 붙어 선 자리)에서
    const fromWall = this.py - (OY + FLOOR_TOP * IT);
    if (fromWall < REACH_PX) {
      for (const d of WALL_DECOR) {
        const dx = Math.max(OX + d.x0 * IT - this.px, 0, this.px - (OX + d.x1 * IT));
        if (dx > 14) continue;
        const dd = dx + fromWall;
        if (dd < bestD) { bestD = dd; best = { kind: 'wall', id: d.id }; }
      }
    }
    // 190차 — 고양이: 발치에 있으면 가구보다 먼저
    if (this.cat) {
      const d = Math.hypot(this.cat.x - this.px, this.cat.y - this.py);
      if (d < 34 && d - 12 < bestD) best = { kind: 'cat' };
    }
    this.near = best;
    if (best) {
      // 204차 — 머리 위 타이틀이 있으면 그 위로 비켜 선다
      const lift = this.homeTitle?.visible ? this.homeTitle.height + 2 : 0;
      this.hintText.setText(this.hintOf(best)).setPosition(this.px, this.py - this.charSprite.bodyHeight - 10 - lift).setVisible(true);
    } else {
      this.hintText.setVisible(false);
    }
  }

  private tryInteract(): void {
    if (this.menu || this.fridgePanel || this.cookPanel || this.decor || !this.near) return;
    const t = this.near;
    if (t.kind === 'cat') { this.openCatMenu(); return; }
    if (t.kind === 'wall') { this.useWall(t.id); return; }
    const { f, action } = t;
    switch (action) {
      case 'lamp': this.toggleLamp(f); break;
      case 'radio': this.playRadio(f); break;
      case 'aquarium': this.openAquarium(f); break;
      case 'bed': this.openBedMenu(); break;
      case 'fridge': this.openFridge(); break;
      case 'cook': this.openCook(); break;
      case 'sofa':
      case 'chair': this.sitOn(f); break;
      case 'wardrobe': this.openStorage('wardrobe'); break;
      case 'shelf': this.openStorage('shelf'); break;
      case 'plant': this.waterPlant(f); break;
      case 'father_box': this.openFatherBox(); break;
    }
  }

  // ── 확장 패널 (189차) — 침대 메뉴 · 앉은 자리 고를 거리 ──

  /** 캐릭터 옆에 붙는 작은 고를 거리 창. ↑↓ · Enter/F · 마우스로 고르고 ESC는 `onCancel` */
  private openMenu(kind: OpenMenu['kind'], title: string, items: MenuItem[], onCancel: () => void): void {
    this.closeMenu();
    const w = 190, rowH = 32, headH = 28;
    const h = headH + items.length * rowH + 8;
    let x = this.px + 30, y = this.py - this.charSprite.bodyHeight - 6;
    if (x + w > GAME_WIDTH - 8) x = this.px - 30 - w;
    y = Phaser.Math.Clamp(y, 8, GAME_HEIGHT - h - 8);
    const c = this.add.container(x, y).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.96); bg.fillRoundedRect(0, 0, w, h, 7);
    bg.lineStyle(2, 0x2a5a8a, 1); bg.strokeRoundedRect(0, 0, w, h, 7);
    c.add(bg);
    c.add(this.add.text(12, headH / 2 + 2, title, { fontFamily: FONT, fontSize: '13px', color: '#ffe28a', fontStyle: 'bold' }).setOrigin(0, 0.5));
    const rows: Phaser.GameObjects.Graphics[] = [];
    items.forEach((it, i) => {
      const ry = headH + i * rowH;
      const rg = this.add.graphics();
      const t = this.add.text(18, ry + rowH / 2, it.label, {
        fontFamily: FONT, fontSize: '14px', color: it.color ?? '#e8f2fa', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      const hit = this.add.rectangle(6, ry + 2, w - 12, rowH - 4, 0xffffff, 0.001).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { if (this.menu) { this.menu.sel = i; this.paintMenu(); } });
      hit.on('pointerdown', () => it.run());
      rows.push(rg);
      c.add([rg, t, hit]);
    });
    this.menu = { kind, c, items, rows, sel: 0, onCancel };
    this.paintMenu();
  }

  private paintMenu(): void {
    const m = this.menu;
    if (!m) return;
    const w = 190, rowH = 32, headH = 28;
    m.rows.forEach((g, i) => {
      g.clear();
      if (i !== m.sel) return;
      g.fillStyle(0x1d3a56, 1); g.fillRoundedRect(6, headH + i * rowH + 2, w - 12, rowH - 4, 5);
      g.lineStyle(1.5, 0xffd257, 0.9); g.strokeRoundedRect(6, headH + i * rowH + 2, w - 12, rowH - 4, 5);
    });
  }

  private closeMenu(): void {
    this.menu?.c.destroy();
    this.menu = undefined;
    restoreHandCursor(this);
  }

  /** 고를 거리 창 영역 (가이드 하이라이트용) */
  private menuRect(): Phaser.Geom.Rectangle | null {
    const m = this.menu;
    if (!m) return null;
    const b = m.c.getBounds();
    return new Phaser.Geom.Rectangle(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
  }

  // ── 앉기 (189차) ─────────────────────────────────────

  /** 204차 — 머리 위 타이틀: 단 것이 바뀌면 글자를, 매 프레임 자리만 */
  private updateHomeTitle(): void {
    const def = TitleStore.equippedDef();
    if (!def || !this.charSprite) { this.homeTitle?.setVisible(false); this.homeTitleKey = ''; return; }
    if (!this.homeTitle || !this.homeTitle.active) {
      this.homeTitle = this.add.text(0, 0, '', titleTagStyle()).setOrigin(0.5, 1);
      this.homeTitleKey = '';
    }
    if (this.homeTitleKey !== def.id) {
      this.homeTitleKey = def.id;
      this.homeTitle.setText(def.nameKo).setColor(TITLE_RARITY_COLOR[def.rarity]);
    }
    const img = this.charSprite.image;
    // 앉으면 다리를 잘라 그림이 내려가므로 이미지 위쪽 기준으로 붙인다
    const top = img.y - img.displayHeight * img.originY;
    this.homeTitle.setVisible(img.visible).setPosition(img.x, top - 2).setDepth(img.depth + 0.0007);
  }

  private sitOn(f: FurnInstance): void {
    const seats = seatsOf(f.kind, f.dir).map((s) => ({ ...s, sx: OX + f.tx * IT + s.x, sy: OY + f.ty * IT + s.y }));
    if (!seats.length) return;
    seats.sort((a, b) => Math.hypot(a.sx - this.px, a.sy - this.py) - Math.hypot(b.sx - this.px, b.sy - this.py));
    const s = seats[0]!;
    this.seat = { f, sx: s.sx, sy: s.sy, behind: s.behind, standX: this.px, standY: this.py };
    this.facing = f.dir;
    this.charSprite.update(0, false);
    this.charSprite.setDir(f.dir);
    this.playerShadow.setVisible(false);
    this.hintText.setVisible(false);
    this.applySeatPose();
    this.satCount++;
    // 190차 — 식탁 앞 의자면 「식사하기」(허기 +25%) · 라디오 곁 소파면 「라디오 듣기」
    const atTable = f.kind === 'chair' && this.chairAtTable(f);
    GameState.mealAtTable = atTable;
    const radio = f.kind === 'sofa' ? this.radioNear(f) : undefined;
    const items: MenuItem[] = [];
    if (f.kind === 'sofa') items.push({ label: '휴식하기', color: '#9fd0e4', run: () => this.restOnSofa() });
    if (radio) items.push({ label: '라디오 듣기', color: '#ffd9a0', run: () => this.playRadio(radio) });
    if (atTable) items.push({ label: '식사하기', color: '#ffd9a0', run: () => this.openMealBag() });
    items.push({ label: '일어나기', run: () => this.standUp() });
    this.openMenu('seat', FURN_DEFS[f.kind].nameKo, items, () => this.standUp());
    // 정이 든 고양이는 소파에 앉으면 곁으로 온다
    if (f.kind === 'sofa' && HomeStore.cat.affection >= 30 && !this.cat?.hungry()) this.cat?.comeSitNear(s.sx, s.sy);
  }

  /** 앉은 자세 — 엉덩이를 좌석에 맞추고 다리를 잘라 낸다(가구가 가린 것으로 읽힌다) */
  private applySeatPose(): void {
    const s = this.seat;
    if (!s) return;
    const img = this.charSprite.image;
    const fh = img.frame.height;
    img.setCrop(0, 0, img.frame.width, SEAT_ROWS);
    img.setPosition(s.sx, s.sy + (fh - SEAT_ROWS));
    img.setDepth(this.furnDepth(s.f) + (s.behind ? -0.0005 : 0.0005));
  }

  private standUp(): void {
    const s = this.seat;
    if (!s) return;
    this.seat = null;
    GameState.mealAtTable = false;
    this.closeMenu();
    this.px = s.standX; this.py = s.standY;
    this.charSprite.image.setCrop();
    this.charSprite.image.setPosition(this.px, this.py + this.charSprite.footPad).setDepth(20 + this.py * 0.001);
    this.playerShadow.setPosition(this.px, this.py).setVisible(true);
    this.stoodCount++;
  }

  /**
   * 소파에서 잠깐 쉬기 — 피로가 최대치의 35%만큼 풀린다. 다만 소파로는 35% 아래까지는 못 내려간다
   * (개운하게 다 풀리는 건 침대 몫 — 침대처럼 하루를 넘기거나 병을 고치지도 않는다).
   */
  private restOnSofa(): void {
    const v = GameState.vitals;
    const max = Math.max(1, v.maxFatigue);
    const before = v.fatigue;
    const floor = (max * SOFA_REST_FLOOR_PCT) / 100;
    if (before <= floor + 0.5) { this.flash('지금은 그다지 피곤하지 않다.'); return; }
    const after = Math.max(floor, before - (max * SOFA_REST_PCT) / 100);
    GameState.applyIntake(0, 0, 0, before - after);   // 양수 = 피로 감소
    GameState.markDirty();
    // 잠깐 눈을 감았다 뜨는 연출 (결과는 이미 반영됐다 — 연출이 돌지 않는 환경에서도 같다)
    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1).setOrigin(0, 0).setDepth(95).setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 0.55, duration: 450, yoyo: true, hold: 350, onComplete: () => dim.destroy() });
    this.flash(`소파에서 잠깐 눈을 붙였다 — 피로 ${Math.round((before / max) * 100)}% → ${Math.round((after / max) * 100)}%`);
  }

  /** 이 의자가 식탁을 바라보고 붙어 있는가 */
  private chairAtTable(f: FurnInstance): boolean {
    const fc = frontCell(f);
    return HomeStore.placed.some((o) => {
      if (o.kind !== 'island') return false;
      const { w, h } = footprint(o.kind, o.dir);
      return fc.c >= o.tx && fc.c < o.tx + w && fc.r >= o.ty && fc.r < o.ty + h;
    });
  }

  /** 소파 곁(몇 칸 안)의 라디오 */
  private radioNear(sofa: FurnInstance): FurnInstance | undefined {
    const sw = footprint(sofa.kind, sofa.dir);
    const cx = sofa.tx + sw.w / 2, cy = sofa.ty + sw.h / 2;
    return HomeStore.placed.find((o) => o.kind === 'radio' && Math.hypot(o.tx + 0.5 - cx, o.ty + 0.5 - cy) <= RADIO_REACH_TILES);
  }

  /** 식탁에서 「식사하기」 — 가방을 음식 칸으로 펼친다 */
  private openMealBag(): void {
    if (!this.invPanel) this.toggleInventory();
    this.invPanel?.showTab('food');
  }

  // ── 스탠드 · 라디오 · 수조 (190차) ───────────────────

  private toggleLamp(f: FurnInstance): void {
    HomeStore.toggleLamp(f.id);
    GameState.markDirty();
    this.buildFurniture(null);   // 갓 그림 + 불빛(refreshLights)
  }

  /** 라디오 방송 — 아나운서의 말을 한 단락씩 타이핑. 처음 들으면 주인공의 혼잣말이 하나 따라온다 */
  private playRadio(src: FurnInstance): void {
    if (this.tourPanel) return;
    this.hintText.setVisible(false);
    const lines = buildRadioBroadcast(getLocale() === 'en' ? 'en' : 'ko');
    this.startRadioWaves(src);
    const panel = new MonologuePanel(this, lines, () => {
      panel.destroy();
      this.tourPanel = undefined;
      this.radioWaves?.remove(); this.radioWaves = undefined;
      if (!GameState.getFlag('home.radioHeard')) {
        GameState.setFlag('home.radioHeard');
        GameState.markDirty();
        const after = new MonologuePanel(this, ['아버지가 늘 틀어 놓던 그 목소리다. 물때 이름을 따라 외우던 게 생각난다.'], () => {
          after.destroy(); this.tourPanel = undefined;
        });
        this.add.existing(after);
        this.tourPanel = after;
      }
    }, '라디오', { portraitKey: ensureFurnitureIcon(this, 'radio'), name: '라디오' });
    this.add.existing(panel);
    this.tourPanel = panel;
  }

  /** 방송 중 — 라디오에서 소리 물결이 피어오른다 */
  private startRadioWaves(src: FurnInstance): void {
    this.radioWaves?.remove();
    const x = OX + src.tx * IT + IT - 10, y = OY + src.ty * IT + 10;
    this.radioWaves = this.time.addEvent({
      delay: 650, loop: true, callback: () => {
        const g = this.add.graphics().setDepth(31);
        g.fillStyle(0xfff3c4, 0.9);
        for (let a = -50; a <= 50; a += 25) {
          const r = 6;
          g.fillRect(Math.round(Math.sin((a * Math.PI) / 180) * r), -Math.round(Math.cos((a * Math.PI) / 180) * r), 2, 2);
        }
        g.setPosition(x, y);
        this.tweens.add({ targets: g, y: y - 18, scale: 1.8, alpha: 0, duration: 1200, onComplete: () => g.destroy() });
      },
    });
  }

  private openAquarium(f: FurnInstance): void {
    if (this.popups.some((e) => e.panel instanceof AquariumPanel)) return;
    this.openPopup((close) => new AquariumPanel(this, f.id, GAME_WIDTH / 2 - 340, 60, close, () => this.buildFurniture(null)));
  }

  // ── 고양이 (190차) ───────────────────────────────────

  /** 밥으로 줄 수 있는 손질 부산물 (상하지 않은 것) */
  private catFood(): InvItem | undefined {
    return InventoryStore.items.find((i) => (i.byproductKind || i.subCategory === '부산물') && i.condition !== 'spoiled' && i.qty > 0);
  }

  private openCatMenu(): void {
    this.cat?.attend();
    const food = this.catFood();
    const items: MenuItem[] = [{ label: '쓰다듬기', color: '#ffb0c4', run: () => this.petCat() }];
    if (food) items.push({ label: '밥 주기', color: '#ffd9a0', run: () => this.feedCat(food) });
    items.push({ label: '그만두기', color: '#8faabf', run: () => this.closeMenu() });
    this.openMenu('cat', '고양이', items, () => this.closeMenu());
  }

  private petCat(): void {
    this.closeMenu();
    const now = Date.now();
    const c = HomeStore.cat;
    if (now - c.lastPetMs > 10 * 60 * 1000) c.affection = Math.min(100, c.affection + 2);
    if (now - c.lastPetMs > 3000) TitleStore.bump('catPet');   // 203차 — 「고양이 집사」(연타는 3초에 한 번)
    c.lastPetMs = now;
    this.cat?.petReact();
    const v = GameState.vitals;
    if (now - c.lastCalmMs > CAT_CALM_GAP_MS && v.fatigue > 0.5) {
      c.lastCalmMs = now;
      GameState.applyIntake(0, 0, 0, Math.min(v.fatigue, (Math.max(1, v.maxFatigue) * CAT_CALM_PCT) / 100));
      this.flash('고양이를 쓰다듬었다. 골골거리는 소리에 마음이 조금 풀린다.');
    } else {
      this.flash('고양이가 눈을 가늘게 뜨고 골골거린다.');
    }
    GameState.markDirty();
  }

  private feedCat(item: InvItem): void {
    this.closeMenu();
    const now = Date.now();
    if (now - HomeStore.cat.fedMs < CAT_FULL_MS) {
      this.cat?.refuseReact();
      this.flash('배가 부른 모양이다. 냄새만 맡고 돌아앉는다.');
      return;
    }
    if (!InventoryStore.removeQty(item.id, 1)) return;
    HomeStore.cat.fedMs = now;
    HomeStore.cat.affection = Math.min(100, HomeStore.cat.affection + 5);
    this.cat?.eatReact();
    GameState.markDirty();
    this.events.emit('inventory-changed');
    this.flash(`고양이가 ${item.name}을(를) 맛있게 먹는다.`);
  }

  // ── 벽 장식 (190차) ──────────────────────────────────

  private useWall(id: WallDecorId): void {
    this.hintText.setVisible(false);
    if (id === 'books') {
      this.openMenu('books', '책', [
        { label: '어류 도감', color: '#9fd0e4', run: () => this.openCodex() },
        { label: '물때표', color: '#9fd0e4', run: () => { this.closeMenu(); this.openPopup((close) => new TideTablePanel(this, GAME_WIDTH / 2 - 330, 70, close)); } },
        { label: '그만두기', color: '#8faabf', run: () => this.closeMenu() },
      ], () => this.closeMenu());
      return;
    }
    if (id === 'calendar') { this.openPopup((close) => new CalendarPanel(this, GAME_WIDTH / 2 - 320, 80, close)); return; }
    this.openPopup((close) => new FishRecordPanel(this, GAME_WIDTH / 2 - 280, 70, close));
  }

  /** 어류 도감 — 필드의 N과 같은 도감 씬을 띄운다(닫으면 이 방으로 돌아온다) */
  private openCodex(): void {
    this.closeMenu();
    this.scene.pause();
    this.scene.launch('AnglerLogScene', { returnScene: 'HomeInteriorScene' });
  }

  // ── 화분 (189차) ─────────────────────────────────────

  private waterPlant(f: FurnInstance): void {
    const wasDry = HomeStore.plantDry(f.id);
    HomeStore.waterPlant(f.id);
    GameState.markDirty();
    this.buildFurniture(null);
    // 물방울 몇 점 — 화분 위에서 떨어진다
    const x0 = OX + f.tx * IT + IT / 2, y0 = OY + f.ty * IT + 8;
    for (let i = 0; i < 6; i++) {
      const d = this.add.rectangle(x0 - 8 + i * 3, y0 - 10 - (i % 3) * 6, 2, 4, 0x9fd0e8, 0.95).setDepth(60);
      this.tweens.add({ targets: d, y: y0 + 18, alpha: 0, duration: 420 + i * 40, onComplete: () => d.destroy() });
    }
    this.flash(wasDry ? '화분에 물을 줬다. 처졌던 잎이 다시 고개를 든다.' : '화분에 물을 줬다.');
  }

  // ── 옷장 · 수납 선반 (189차) ─────────────────────────

  private openStorage(kind: HomeStorageKind): void {
    if (this.popups.some((e) => e.panel instanceof HomeStoragePanel)) return;
    this.openPopup((close) => new HomeStoragePanel(this, kind, GAME_WIDTH / 2 - 310, 70, close));
  }

  // ── 냉장고 (냉동고 8칸 + 냉장고 16칸) ─────────────────
  private openFridge(): void {
    if (this.fridgePanel) return;
    const panel = new FridgePanel(this, GAME_WIDTH / 2 - 290, 60, () => this.closeFridge());
    this.add.existing(panel);
    this.fridgePanel = panel;
  }

  private closeFridge(): void {
    this.fridgePanel?.destroy();
    this.fridgePanel = undefined;
    syncPrologue();   // 188차 — 냉동 오징어를 챙겼는가
    this.refreshDecorButton();
  }

  // ── 주방 — 가스레인지 (154차 불요리 · 연료 무한 · 수돗물) ─────────────────
  private openCook(): void {
    if (this.cookPanel) return;
    const stove = CookingStore.ensureHomeStove();
    const panel = new CookingPanel(this, GAME_WIDTH / 2 - 450, 60, stove, {
      onClose: () => this.closeCook(),
      onChanged: () => this.events.emit('inventory-changed'),
    });
    this.add.existing(panel);
    this.cookPanel = panel;
  }

  private closeCook(): void {
    this.cookPanel?.destroy();
    this.cookPanel = undefined;
  }

  // ── 침대 — 저장하고 쉬기 / 그냥 쉬기 ─────────────────

  private openBedMenu(): void {
    // 213차 — 저장과 잠을 나눈다(사용자 확정 D): 저장은 언제나 · 잠은 피곤하거나 오래 깨어 있었을 때(A)
    const gate = GameState.sleepGate();
    this.openMenu('bed', '침대', [
      {
        label: '저장만 하기', color: '#4af2a1', run: () => {
          markPrologue('save');   // 188차 — 프롤로그 「침대에서 저장한다」 (저장 스냅샷에 담기게 저장 전에)
          const ok = GameState.save();
          if (ok) StoryStore.event({ kind: 'custom', key: 'bedSave' });   // 134차 — M1-03 침대 저장 목표
          this.closeBedMenu();
          this.flash(ok ? `슬롯 ${GameState.activeSlot ?? 1}에 저장했다.` : '저장에 실패했습니다');
        },
      },
      {
        label: '자기', color: gate.ok ? '#9fd0e4' : '#5f7486', run: () => {
          this.closeBedMenu();
          if (!gate.ok) {
            this.openPopup((close) => new MonologuePanel(this, [
              '아직 잠이 오지 않는다. 눈만 말똥말똥하다.',
              '조금 더 움직이다 피곤해지면 자자. 잠깐 쉬고 싶으면 소파도 있다.',
            ], close));
            return;
          }
          this.startSleep();
        },
      },
      // 211차 — 지난 날들(최대 14장)을 다시 펼친다
      ...(LedgerStore.closedPages().length > 0 ? [{
        label: '지난 날 돌아보기', color: '#e8d49a', run: () => { this.closeBedMenu(); this.openDayReport('past'); },
      }] : []),
      { label: '그만두기', color: '#8faabf', run: () => this.closeBedMenu() },
    ], () => this.closeBedMenu());
  }

  // ── 213차 B — 잠(실시간 · 중간에 깰 수 있다) ─────────

  private sleepState: {
    elapsed: number;
    c: Phaser.GameObjects.Container;
    dim: Phaser.GameObjects.Rectangle;
    bar: Phaser.GameObjects.Graphics;
    clock: Phaser.GameObjects.Text;
    fatigue0: number;
  } | null = null;
  private consignAcc = 0;
  /** 잠 창 자리(가이드가 짚는다) */
  private static readonly SLEEP_W = 320;
  private static readonly SLEEP_H = 112;

  /** 하네스 — 지금 자는 중인가 · 잔 비율 */
  get sleeping(): boolean { return !!this.sleepState; }
  get sleepFrac(): number { return this.sleepState ? sleepFraction(this.sleepState.elapsed) : 0; }

  private sleepRect(): Phaser.Geom.Rectangle {
    const W = HomeInteriorScene.SLEEP_W, H = HomeInteriorScene.SLEEP_H;
    return new Phaser.Geom.Rectangle(Math.round((GAME_WIDTH - W) / 2), Math.round(GAME_HEIGHT * 0.62), W, H);
  }

  /** 침대에 눕는다 — 화면이 어두워지고 잠 막대가 차오른다. 다 차면 하룻밤, 그 전에 일어나면 잔 만큼 */
  startSleep(): void {
    if (this.sleepState) return;
    const r = this.sleepRect();
    // ⚠ rectangle의 6번째 인자는 채움 알파다 — 0으로 만들면 객체 알파를 올려도 안 보인다(213차 실측)
    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x02060c, 1).setOrigin(0, 0).setDepth(930).setAlpha(0).setInteractive();
    this.tweens.add({ targets: dim, alpha: 0.82, duration: 600 });
    const c = this.add.container(r.x, r.y).setDepth(931);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.92).fillRoundedRect(0, 0, r.width, r.height, 8);
    bg.lineStyle(1, 0x2a5a8a, 0.9).strokeRoundedRect(0, 0, r.width, r.height, 8);
    const clock = this.add.text(r.width / 2, 12, '', { fontFamily: FONT, fontSize: '22px', color: '#e8eef4', fontStyle: 'bold' }).setOrigin(0.5, 0);
    const bar = this.add.graphics();
    const btnW = 120, btnH = 30, bx = (r.width - btnW) / 2, by = r.height - btnH - 10;
    const btn = this.add.graphics();
    btn.fillStyle(0x24425e, 1).fillRoundedRect(bx, by, btnW, btnH, 6);
    btn.lineStyle(1, 0x9fd0e4, 0.8).strokeRoundedRect(bx, by, btnW, btnH, 6);
    const btnT = this.add.text(bx + btnW / 2, by + btnH / 2, '일어나기', { fontFamily: FONT, fontSize: '14px', color: '#e8eef4', fontStyle: 'bold' }).setOrigin(0.5);
    const hit = this.add.rectangle(bx + btnW / 2, by + btnH / 2, btnW, btnH, 0, 0).setInteractive({ useHandCursor: true }).setName('wakeBtn');
    hit.on('pointerdown', () => { if (!GuideTour.blocking) this.wakeUp(false); });
    c.add([bg, clock, bar, btn, btnT, hit]);
    this.hintText.setVisible(false);
    this.sleepState = { elapsed: 0, c, dim, bar, clock, fatigue0: GameState.vitals.fatigue };
    this.drawSleep();
    // 처음 잘 때 한 번 — 다 자면 하루가 넘어가고 저장된다 / 도중에 깨면 잔 만큼만
    maybeStartTour(this, () => ({
      id: 'sleep',
      anchor: () => this.sleepRect(),
      alive: () => !!this.sleepState,
      steps: [
        { text: '막대가 다 차면 하룻밤을 다 잔 것이다 — 하루가 저물고, 일어나며 저장된다.',
          target: () => new Phaser.Geom.Rectangle(r.x + 16, r.y + 44, r.width - 32, 20) },
        { text: '도중에 일어나면 잔 만큼만 풀린다. 하루는 넘어가지 않고, 저장도 되지 않는다.',
          target: () => new Phaser.Geom.Rectangle(r.x + bx, r.y + by, btnW, btnH) },
      ],
    }));
  }

  private drawSleep(): void {
    const st = this.sleepState;
    if (!st) return;
    const r = this.sleepRect();
    const k = kstParts();
    st.clock.setText(`${k.hh}:${k.mi}`);
    const frac = sleepFraction(st.elapsed);
    const x = 16, y = 44, w = r.width - 32, h = 20;
    st.bar.clear();
    st.bar.fillStyle(0x111f30, 1).fillRoundedRect(x, y, w, h, 4);
    // 밤하늘 → 새벽빛으로 차오른다
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x2a3f7a), Phaser.Display.Color.ValueToColor(0xf2c27a), 100, Math.round(frac * 100));
    st.bar.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1).fillRoundedRect(x, y, Math.max(6, w * frac), h, 4);
    st.bar.lineStyle(1, 0x5a7a9a, 0.8).strokeRoundedRect(x, y, w, h, 4);
  }

  private stepSleep(delta: number): void {
    const st = this.sleepState;
    if (!st) return;
    if (!GuideTour.blocking) st.elapsed += delta / 1000;   // 가이드가 말하는 동안은 잠도 멈춘다
    this.drawSleep();
    if (sleepFraction(st.elapsed) >= 1) this.wakeUp(true);
  }

  /**
   * 일어난다. full = 하룻밤을 다 잤다 → 하루 마감(이야기 날짜 · 장부 · 정기 지출) + 저장 + 결산 + 지금 시각 혼잣말.
   * 아니면 선잠 — 잔 비율만큼만 회복(하루 · 저장 없음).
   */
  wakeUp(full: boolean): void {
    const st = this.sleepState;
    if (!st) return;
    const frac = full ? 1 : sleepFraction(st.elapsed);
    this.sleepState = null;
    this.tweens.add({ targets: [st.dim, st.c], alpha: 0, duration: 400, onComplete: () => { st.dim.destroy(); st.c.destroy(true); } });
    playUiClick();
    const locale = getLocale() === 'en' ? 'en' : 'ko';
    if (!full) {
      const max = Math.max(1, GameState.vitals.maxFatigue);
      GameState.napRecover(frac);
      const after = GameState.vitals.fatigue;
      this.flash(`잠깐 눈을 붙였다 — 피로 ${Math.round((st.fatigue0 / max) * 100)}% → ${Math.round((after / max) * 100)}%`);
      return;
    }
    const rec = this.restInBed();
    const ok = GameState.save();   // 다 자면 저장된다(사용자 확정 — 「저장하고 자기」 = 자기)
    if (ok) StoryStore.event({ kind: 'custom', key: 'bedSave' });
    this.flash(ok ? rec : `${rec}\n저장에 실패했습니다`);
    const say = (): void => { this.openPopup((close) => new MonologuePanel(this, [wakeLine(locale)], close)); };
    if (!this.openDayReport('today', say)) say();
  }

  /** 213차 — 맡겨 둔 위판이 회차를 지났으면 정산하고 알린다 */
  private settleConsignments(): void {
    const r = settleDueConsignments();
    if (!r) return;
    if (r.netWon > 0) playCoin(r.netWon);
    this.flash(r.soldLots > 0
      ? `위판장에서 연락이 왔다 — 맡긴 물건 ${r.soldLots}건 낙찰, ${r.netWon.toLocaleString()}원이 들어왔다.`
      : '위판장에서 연락이 왔다 — 맡긴 물건이 유찰돼 가방으로 돌아왔다.');
  }

  /**
   * 211차 — 하루 결산 창. 'today' = 방금 닫은 장(마지막 장), 'past' = 지난 장들을 최근 것부터.
   * 장부에 닫힌 장이 없으면 열지 않는다.
   */
  openDayReport(mode: DayReportMode, onClosed?: () => void): DayReportPanel | null {
    const pages = LedgerStore.closedPages();
    if (!pages.length) return null;
    const last = pages[pages.length - 1]!;
    LedgerStore.markShown(last.no);
    // 프롤로그(집 · 고향 단계)의 첫 잠은 안내 말풍선이 이어지는 중이라 결산을 띄우지 않는다(장은 그대로 닫혀 있다 —
    //   침대 「지난 날 돌아보기」로 볼 수 있다)
    if (mode === 'today' && prologueRunning()) return null;
    return this.openPopup((close) => new DayReportPanel(this, pages, pages.length - 1, mode, close), onClosed);
  }

  /**
   * 211차 — 자지 않고 날짜가 넘어가 자정에 닫힌 장이 있으면 들어오자마자 한 번 보여 준다.
   * 혼잣말 · 메뉴 · 창 · 가이드 · 프롤로그가 진행 중이면 2초 뒤 다시 본다(최대 30번 — 1분).
   */
  private maybeShowUnseenDay(tries: number): void {
    if (!this.scene.isActive() || (!LedgerStore.unseenClosed() && !GameState.hasWakeNote)) return;
    const busy = !!this.tourPanel || !!this.menu || this.popups.length > 0 || !!this.decor || GuideTour.blocking || prologueRunning() || !!this.sleepState;
    if (busy) { if (tries < 30) this.time.delayedCall(2000, () => this.maybeShowUnseenDay(tries + 1)); return; }
    // 213차 E — 꺼 둔 사이 잤다면 먼저 「잘 잤다 · 지금 몇 시」 혼잣말, 그다음 지난 하루
    const note = GameState.consumeWakeNote();
    const report = (): void => { if (LedgerStore.unseenClosed()) this.openDayReport('past'); };
    if (note) this.openPopup((close) => new MonologuePanel(this, offlineWakeLines(note.offlineMs, getLocale() === 'en' ? 'en' : 'ko'), close), report);
    else report();
  }

  /** 하네스·구 코드 호환 — 침대 메뉴가 열려 있는가 */
  get bedMenu(): Phaser.GameObjects.Container | undefined {
    return this.menu?.kind === 'bed' ? this.menu.c : undefined;
  }

  /**
   * 수면 회복 (125차 — SPEC §4-2): 피로 0 · HP +50% · 허기/수분 −10.
   * `life_sleep` 배율은 P5 배선 시 곱한다(현재 노드는 wired:false).
   */
  private restInBed(): string {
    GameState.sleepRecover();
    const v = GameState.vitals;
    const base = `푹 쉬었습니다 — 피로 0 · 체력 ${Math.round(v.hp)}/${v.maxHp} · 허기 ${Math.round(v.hunger)}% · 수분 ${Math.round(v.hydration)}%`;
    // 171차 — 하루가 지나면 정기 지출 알림을 함께 준다(모르고 연체하는 상태를 만들지 않는다).
    const due = GameState.upkeepAlerts();
    if (!due.length) return base;
    const over = due.filter((d) => d.overdue);
    const head = over.length ? over[0]! : due[0]!;
    const tail = due.length > 1 ? ` 외 ${due.length - 1}건` : '';
    return `${base}\n${over.length ? '연체' : '납부일'}: ${head.nameKo}${tail} — 면허·허가 창(L)에서 납부`;
  }

  private closeBedMenu(): void {
    if (this.menu?.kind === 'bed') this.closeMenu();
  }

  private flashMsg?: Phaser.GameObjects.Text;
  private flash(msg: string): void {
    this.flashMsg?.destroy();
    // 198차 — 방 아래 바깥(구 y = 방 밑변 + 26)은 필드 HUD 퀵슬롯 띠 윗변을 덮었다 → 방 안 바닥 아래쪽(현관 위)
    this.flashMsg = this.add.text(OX + (ROOM_W * IT) / 2, OY + ROOM_H * IT - 44, msg, {
      fontFamily: FONT, fontSize: '13px', color: '#7fe6b0', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 10, y: 5 }, align: 'center',
    }).setOrigin(0.5).setDepth(120);
    const mine = this.flashMsg;
    this.time.delayedCall(2600, () => { if (this.flashMsg === mine) { mine.destroy(); this.flashMsg = undefined; } });
  }

  /** 현관 → 홈타운 외부 복귀 (stop + resume 규칙 — RegionFieldScene 재생성 금지) */
  private exitToField(): void {
    if (this.leaving) return;
    if (this.seat) this.standUp();
    this.leaving = true;
    // 188차 — 프롤로그: 저장까지 마치고 나서야 「집을 나선다」 (앞 단계를 건너뛴 채 나가면 다시 들어와 이어 한다)
    if (prologueStepDone('save')) markPrologue('leave');
    GameState.locationTag = 'hometown';
    fadeOutThen(this, () => {
      this.scene.stop();
      this.scene.resume('RegionFieldScene');
    }, 220);
  }
}
