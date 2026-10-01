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
 *
 * HOMETOWN_HOME_SPEC (2026-07-28):
 *  - 시작 사이즈 Tier 0: 원룸 12×10 타일 (hometown_interior_mockup.svg 레이아웃).
 *  - **저장은 이 씬의 침대에서만** — GameState.locationTag = 'hometown_interior'
 *    (TUNING.save.allowedTags). "저장하고 쉬기" / "그냥 쉬기" 선택.
 *  - 가구 배치는 `HomeStore`(세이브) — 기본 배치·그림은 `data/HomeFurniture.ts`.
 *  - 진입: RegionFieldScene 문 → pause + launch. 복귀: stop() + resume (규칙 준수).
 */

import Phaser from 'phaser';
import { CHAR_SCALE, CHAR_HEAD_TOP, TUNING, kstParts, type CharDir } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { GameState } from '../store/GameState.js';
import { StoryStore } from '../store/StoryStore.js';
import { FridgePanel } from '../ui/FridgePanel.js';
import { CookingPanel } from '../ui/CookingPanel.js';
import { CookingStore } from '../store/CookingStore.js';
import { fadeOutThen } from './SceneFade.js';
import { CharacterSprite } from '../ui/CharacterSprite.js';
import { characterLook } from '../data/EquipOutfit.js';
import { MonologuePanel } from '../ui/MonologuePanel.js';
import { getStoryQuest, nextObjectiveIndex, narrativeOf } from '@tra/core';
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
import { getLocale } from '../i18n/I18n.js';
import { HomeStore, type HomeStorageKind } from '../store/HomeStore.js';
import {
  IT, ROOM_W, ROOM_H, DOOR_MAT, FURN_DEFS, footprint, seatsOf, drawFurnitureArt,
  type FurnInstance, type FurnAction,
} from '../data/HomeFurniture.js';
import {
  markPrologue, syncPrologue, prologueKeyAllowed, prologueRunning, prologueStepDone, PROLOGUE_PHOTO_ID,
} from '../store/Prologue.js';

const OX = (GAME_WIDTH - ROOM_W * IT) / 2;
const OY = (GAME_HEIGHT - ROOM_H * IT) / 2 + 10;
const FONT = '"Noto Sans KR", sans-serif';

/** [F]가 닿는 거리 — 발밑에서 가구 footprint 가장자리까지(px). 바로 옆 칸에 서야 닿는다 */
const REACH_PX = 26;
/** 앉은 자세 — 머리끝부터 엉덩이까지만 보인다(다리는 가구가 가린다) */
const SEAT_ROWS = (CHAR_HEAD_TOP + 19) * CHAR_SCALE;
/** 소파 휴식 — 한 번에 풀리는 피로(최대치 대비 %) · 소파에서는 이 아래로는 안 풀린다(침대 몫) */
const SOFA_REST_PCT = 35;
const SOFA_REST_FLOOR_PCT = 35;

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
  rug: '러그 위에서 고양이가 자고 있다. 누가 밥을 챙겨 줬던 걸까. 이제는 내 몫이겠지.',
  bed: '아버지 침대. 이불 끝이 반듯하게 접혀 있다.\n침대 앞에서 [F]를 누르면 쉴 수 있다. 오늘 한 일을 기록(저장)하는 것도 이 침대에서만 된다.',
  stand: '머리맡 협탁. 스탠드가 아직 켜진다. 안경을 늘 두던 자리에 먼지만 앉았다.',
  wardrobe: '옷장. 아버지 옷가지가 아직 걸려 있다.\n[F]로 열어 장비를 걸어 둘 수 있다. 가방이 한결 가벼워진다.',
  clock: '벽시계는 멈추지 않고 가고 있다. 누가 건전지를 갈아 두었나.',
  books: '벽 선반의 책. 물때표, 어류 도감, 손때 묻은 매듭 책.',
  window: '창 너머로 바다 냄새가 들어온다. 여기서도 파도 소리가 들린다.',
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
  '전부 가방에 넣었다.',
];

/** 첫 입장 안내 순서 — 매트에서 시작해 방을 한 바퀴 돌고 다시 매트로 */
const TOUR_ORDER = [
  'door_mat', 'plant', 'sofa', 'shelf', 'fridge', 'sink', 'stove', 'island',
  'rug', 'bed', 'stand', 'wardrobe', 'clock', 'books', 'window',
] as const;
const TOUR_INTRO = '아버지 집이다. 떠날 때 모습 그대로다. 우선 하나씩 둘러보자.';
const TOUR_OUTRO = '대충 다 둘러봤다. 쓸 수 있는 가구 앞에 서면 머리 위에 [F]가 뜬다. 가구 자리는 오른쪽 위 [가구 배치]에서 바꾼다.';

/** 가구가 지금 받을 수 있는 [F] 행동 → 머리 위 문구 */
const ACTION_LABEL: Record<FurnAction, string> = {
  bed: '[F] 침대 — 저장하고 쉬기',
  fridge: '[F] 냉장고 열기',
  cook: '[F] 주방 — 요리',
  sofa: '[F] 앉기',
  chair: '[F] 앉기',
  wardrobe: '[F] 옷장 열기',
  shelf: '[F] 선반 열기',
  plant: '[F] 물 주기',
  father_box: '[F] 낚시 상자 열기',
};

interface MenuItem { label: string; color?: string; run: () => void }
interface OpenMenu {
  kind: 'bed' | 'seat';
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
  private nearFurn: { f: FurnInstance; action: FurnAction } | null = null;
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
  private objBanner?: Phaser.GameObjects.Text;
  private objSpot?: Phaser.GameObjects.Graphics;
  private objSpotAt = 0;
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
    this.wake = !!data?.wake;
  }

  create(): void {
    // 저장 정책의 유일한 허용 위치 — 침대 상호작용 지점 (HOMETOWN_HOME_SPEC §4)
    GameState.locationTag = 'hometown_interior';
    this.cameras.main.fadeIn(300, 0, 10, 20);
    this.menu = undefined;
    this.fridgePanel = undefined;
    this.cookPanel = undefined;
    this.nearFurn = null;
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
    this.clockG = this.add.graphics().setDepth(2);
    this.drawClockHands();
    this.buildFurniture(null);

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
    this.objBanner = this.add.text(GAME_WIDTH / 2, 14, '', {
      fontFamily: FONT, fontSize: '14px', color: '#ffe9b0', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 12, y: 6 }, align: 'center',
      wordWrap: { width: GAME_WIDTH - 200, useAdvancedWrap: true },
    }).setOrigin(0.5, 0).setDepth(60).setVisible(false);
    this.objSpot = this.add.graphics().setDepth(41);
    this.buildDecorButton();
    syncPrologue();
    this.refreshObjective();
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
    this.exitToField();
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
          wait: () => this.satCount > 0,
        },
        {
          text: '앉아 있으면 옆에 고를 거리가 뜬다. 쉬어 갈 수도 있다. 이번에는 [일어나기]를 골라 일어서자.',
          passive: true,
          target: () => this.menuRect(),
          wait: () => this.stoodCount > 0,
        },
        {
          text: '침대 발치에 아버지의 낚시 상자가 있다. 상자 앞에서 [F]로 열어 보자.',
          passive: true,
          target: () => this.tourRect('father_box'),
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
      this.refreshObjective();
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
    this.journalPanel = this.openPopup((close) => new JournalPanel(this, { onClose: close }), () => { this.journalPanel = null; });
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
      this.refreshObjective();
    });
    this.add.existing(panel);
    this.tourPanel = panel;
    if (r) { panel.setDimAlpha(0); this.drawSpot(r); }
  }

  /** 「지금 할 일」 띠 — 프롤로그 동안 M1-01의 다음 목표 하나 */
  private refreshObjective(): void {
    if (!this.objBanner) return;
    this.decorBtn?.setVisible(!prologueRunning() && !this.decor);
    const q = getStoryQuest('M1-01');
    if (!q || !StoryStore.isActive('M1-01') || !prologueRunning()) { this.objBanner.setVisible(false); return; }
    const idx = nextObjectiveIndex(q, (i) => StoryStore.objectiveDone(q, i));
    if (idx === null) { this.objBanner.setVisible(false); return; }
    const en = getLocale() === 'en';
    const o = q.objectives[idx];
    const label = en ? o.labelEn : (narrativeOf(q.id)?.objectives?.[idx] ?? o.labelKo);
    const how = en ? (o.howToEn ?? '') : (o.howToKo ?? '');
    const head = en ? 'Now' : '지금 할 일';
    this.objBanner.setText(`${head}  ·  ${label}${how ? `\n${how}` : ''}`).setVisible(true);
  }

  /** 지금 할 일이 집 안의 물건이면 그 자리를 금색 테두리로 짚는다 */
  private objectiveSpotId(): string | null {
    if (!prologueRunning()) return null;
    if (!prologueStepDone('box')) return 'father_box';
    if (prologueStepDone('journal') && !prologueStepDone('squid')) return 'fridge';
    if (prologueStepDone('squid') && !prologueStepDone('save')) return 'bed';
    if (prologueStepDone('save') && !prologueStepDone('leave')) return 'door_mat';
    return null;
  }

  private drawObjectiveSpot(delta: number): void {
    const g = this.objSpot;
    if (!g) return;
    g.clear();
    const id = this.tourPanel || this.popups.length || this.decor ? null : this.objectiveSpotId();
    const r = id ? this.tourRect(id) : null;
    if (!r) return;
    this.objSpotAt += delta;
    const a = 0.45 + 0.45 * Math.abs(Math.sin(this.objSpotAt / 360));
    g.lineStyle(3, 0xffce54, a);
    g.strokeRoundedRect(r.x, r.y, r.width, r.height, 6);
  }

  // ── 첫 입장 안내 (186차) ─────────────────────────────

  /** 안내에 쓰는 대상 사각형(화면 좌표). 벽 장식(시계·책·창)과 현관 매트는 가구 목록 밖이라 따로 잰다. */
  private tourRect(id: string): Phaser.Geom.Rectangle | null {
    const wallH = Math.round(IT * 1.4);
    const W = ROOM_W * IT;
    if (id === 'clock') return new Phaser.Geom.Rectangle(OX + IT * 1.4 - 20, OY + Math.round(IT * 0.62) - 20, 40, 40);
    if (id === 'books') return new Phaser.Geom.Rectangle(OX + IT * 4.2 - 4, OY + Math.round(IT * 0.72) - 36, IT * 2.4 + 8, 44);
    if (id === 'window') return new Phaser.Geom.Rectangle(OX + W - IT * 3.4 - 6, OY + 4, IT * 2.2 + 12, wallH - 18);
    if (id === 'door_mat') {
      return new Phaser.Geom.Rectangle(OX + DOOR_MAT.tx * IT - 4, OY + DOOR_MAT.ty * IT - 4, DOOR_MAT.fw * IT + 8, DOOR_MAT.fh * IT + 24);
    }
    const f = HomeStore.find(id);
    if (!f) return null;
    const { w, h } = footprint(f.kind, f.dir);
    return new Phaser.Geom.Rectangle(OX + f.tx * IT - 4, OY + f.ty * IT - 4, w * IT + 8, h * IT + 8);
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
    g.fillStyle(0xfff3c4, 0.10); g.fillRect(wx - 8, OY + wallH, ww + 16, IT * 2.2);                                      // 햇살
    // ── 벽시계 (판) ── 바늘은 실제 시각을 따라 `drawClockHands`가 따로 그린다
    const cx = OX + IT * 1.4, cy = OY + Math.round(IT * 0.62);
    g.fillStyle(0x3a2718, 1); g.fillCircle(cx, cy, 16);
    g.fillStyle(0xf2e2b8, 1); g.fillCircle(cx, cy, 13);
    g.fillStyle(0x3a2718, 1);
    for (let a = 0; a < 12; a++) g.fillRect(cx + Math.round(Math.cos(a * Math.PI / 6) * 10) - 1, cy + Math.round(Math.sin(a * Math.PI / 6) * 10) - 1, 2, 2);
    // ── 벽 선반 + 책 ──
    const sx = OX + IT * 4.2, sy = OY + Math.round(IT * 0.72);
    for (let x = 0; x < IT * 2.4; x += 2) { dot(sx + x, sy, 0x8a6138); dot(sx + x, sy + 2, 0x5a3c22); }
    const books = [0xb04a3a, 0x3a6ea5, 0x3f9e63, 0xc2913a, 0x8a5aa8];
    books.forEach((col, i) => {
      const bx = sx + 6 + i * 16, bh = 22 + (i % 3) * 5;
      for (let y = 0; y < bh; y += 2) for (let x = 0; x < 10; x += 2) dot(bx + x, sy - bh + y, y < 3 ? 0xffffff : col);
    });
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
    const st = { plantDry: HomeStore.plantDry() };
    for (const f of HomeStore.placed) {
      if (f.id === hideId) continue;
      const g = this.add.graphics();
      drawFurnitureArt(g, f.kind, f.dir, st);
      g.setPosition(OX + f.tx * IT, OY + f.ty * IT).setDepth(this.furnDepth(f));
      this.furnViews.set(f.id, g);
    }
  }

  // ── 가구 배치 (189차) ─────────────────────────────────

  private buildDecorButton(): void {
    const w = 150, h = 34;
    const x = GAME_WIDTH - 16 - w, y = OY - 20;
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

  /** 배치 모드 — 서 있을 때 · 창이 다 닫혔을 때만 */
  openDecor(): void {
    if (this.decor || prologueRunning() || this.leaving) return;
    if (this.tourPanel || this.popups.length || this.fridgePanel || this.cookPanel || this.menu || this.seat) return;
    if (GuideTour.active && GuideTour.blocksKey('KeyF')) return;
    this.hintText.setVisible(false);
    this.decorBtn?.setVisible(false);
    this.decor = new HomeDecorMode(this, {
      ox: OX, oy: OY,
      redraw: (hideId) => this.buildFurniture(hideId),
      playerTile: () => ({ x: (this.px - OX) / IT, y: (this.py - OY) / IT }),
      artState: () => ({ plantDry: HomeStore.plantDry() }),
      onExit: () => {
        this.decor = undefined;
        this.buildFurniture(null);
        this.refreshObjective();
        restoreHandCursor(this);
      },
    });
  }

  // ── 이동/충돌 (간이 AABB — 물리 미사용) ──────────────

  update(_t: number, delta: number): void {
    // 154차 — 집 주방 화구는 wall-clock으로 계속 끓는다(패널이 닫혀 있어도). 1초마다 동기화.
    this.cookSyncAcc += delta;
    if (this.cookSyncAcc >= 1000) { this.cookSyncAcc = 0; CookingStore.syncAll(); }
    // 188차 — 프롤로그 동기화(1초) · 「지금 할 일」 짚기
    this.syncAcc += delta;
    if (this.syncAcc >= 1000) { this.syncAcc = 0; syncPrologue(); this.refreshObjective(); }
    this.clockAcc += delta;
    if (this.clockAcc >= 30000) { this.clockAcc = 0; this.drawClockHands(); }
    this.drawObjectiveSpot(delta);
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
    if (this.cursors.down.isDown && this.onMatEdge() && this.time.now - this.enteredAt > 500) { this.exitToField(); return; }
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
    let best: { f: FurnInstance; action: FurnAction } | null = null;
    let bestD = REACH_PX;
    for (const f of HomeStore.placed) {
      const action = this.actionOf(f);
      if (!action) continue;
      const { w, h } = footprint(f.kind, f.dir);
      const x0 = OX + f.tx * IT, y0 = OY + f.ty * IT;
      const dx = Math.max(x0 - this.px, 0, this.px - (x0 + w * IT));
      const dy = Math.max(y0 - this.py, 0, this.py - (y0 + h * IT));
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = { f, action }; }
    }
    this.nearFurn = best;
    if (best) {
      this.hintText.setText(ACTION_LABEL[best.action]).setPosition(this.px, this.py - this.charSprite.bodyHeight - 10).setVisible(true);
    } else {
      this.hintText.setVisible(false);
    }
  }

  private tryInteract(): void {
    if (this.menu || this.fridgePanel || this.cookPanel || this.decor || !this.nearFurn) return;
    const { f, action } = this.nearFurn;
    switch (action) {
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
    const items: MenuItem[] = f.kind === 'sofa'
      ? [{ label: '휴식하기', color: '#9fd0e4', run: () => this.restOnSofa() }, { label: '일어나기', run: () => this.standUp() }]
      : [{ label: '일어나기', run: () => this.standUp() }];
    this.openMenu('seat', FURN_DEFS[f.kind].nameKo, items, () => this.standUp());
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
    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0, 0).setDepth(95);
    this.tweens.add({ targets: dim, alpha: 0.55, duration: 450, yoyo: true, hold: 350, onComplete: () => dim.destroy() });
    this.flash(`소파에서 잠깐 눈을 붙였다 — 피로 ${Math.round((before / max) * 100)}% → ${Math.round((after / max) * 100)}%`);
  }

  // ── 화분 (189차) ─────────────────────────────────────

  private waterPlant(f: FurnInstance): void {
    const wasDry = HomeStore.plantDry();
    HomeStore.waterPlant();
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
    this.refreshObjective();
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
    this.openMenu('bed', '침대', [
      {
        label: '저장하고 쉬기', color: '#4af2a1', run: () => {
          // 수면 회복이 먼저 — 저장 스냅샷에 회복 결과가 담기게 한다 (125차)
          const rec = this.restInBed();
          markPrologue('save');   // 188차 — 프롤로그 「침대에서 저장한다」 (저장 스냅샷에 담기게 저장 전에)
          const ok = GameState.save();
          if (ok) StoryStore.event({ kind: 'custom', key: 'bedSave' });   // 134차 — M1-03 침대 저장 목표
          this.closeBedMenu();
          this.flash(ok ? `슬롯 ${GameState.activeSlot ?? 1}에 저장했습니다. ${rec}` : '저장에 실패했습니다');
        },
      },
      {
        label: '그냥 쉬기', color: '#9fd0e4', run: () => {
          const rec = this.restInBed();
          this.closeBedMenu();
          this.flash(rec);
        },
      },
      { label: '그만두기', color: '#8faabf', run: () => this.closeBedMenu() },
    ], () => this.closeBedMenu());
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
    this.flashMsg = this.add.text(GAME_WIDTH / 2, OY + ROOM_H * IT + 26, msg, {
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
