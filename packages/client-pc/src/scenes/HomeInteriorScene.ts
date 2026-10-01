/**
 * @file HomeInteriorScene.ts
 * @description 집 실내 (Tier 0 소형 원룸) — 침대 저장 · 문→홈타운 외부 · 첫 입장 가구 안내 혼잣말(186차)
 *   · 188차 프롤로그 「떠나는 날 아침」 — 새 캐릭터는 여기 침대 옆에서 눈을 뜬다(`wake`).
 *     아버지의 낚시 상자 · 가방(I)/장비(E)/일지(J) 창 · 「지금 할 일」 띠 · 첫 걸음 체험 가이드.
 *
 * HOMETOWN_HOME_SPEC (2026-07-28):
 *  - 시작 사이즈 Tier 0: 원룸 12×10 타일 (hometown_interior_mockup.svg 레이아웃).
 *    침대(저장★)+협탁 / 냉장고 / 아일랜드 테이블+의자 / 소파 / 러그(+고양이) /
 *    서랍장 / 수납 선반 / 화분 / 하단 문(→외부). 주방·지하실·2층은 HouseTier 확장(후속).
 *  - **저장은 이 씬의 침대에서만** — GameState.locationTag = 'hometown_interior'
 *    (TUNING.save.allowedTags). "저장하고 쉬기" / "그냥 쉬기" 선택.
 *  - 가구는 MapObject 인스턴스 스키마(이동/제거/배치 스탠바이) — 이번 단계는 정적 렌더.
 *  - 진입: RegionFieldScene 문 → pause + launch. 복귀: stop() + resume (규칙 준수).
 */

import Phaser from 'phaser';
import { CHAR_SCALE, MapObject, TUNING, type CharDir } from '@tra/core';
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
import { DraggablePanel } from '../ui/DraggablePanel.js';
import { GuideTour, maybeStartTour } from '../ui/GuideTour.js';
import { getLocale } from '../i18n/I18n.js';
import {
  markPrologue, syncPrologue, prologueKeyAllowed, prologueRunning, prologueStepDone, PROLOGUE_PHOTO_ID,
} from '../store/Prologue.js';

/** 실내 타일 렌더 크기 (px) — 외부(20px)보다 큼직하게 */
const IT = 48;
const ROOM_W = 12, ROOM_H = 10;
const OX = (GAME_WIDTH - ROOM_W * IT) / 2;
const OY = (GAME_HEIGHT - ROOM_H * IT) / 2 + 10;

/**
 * Tier 0 가구 초기 배치 (MapObject 스키마 — 추후 이동/배치 시스템과 호환).
 * 좌측 상단 = 주방(냉장고·싱크대·조리대). 침대(우상 저장★). 하단 문.
 */
const INTERIOR_OBJECTS: MapObject[] = [
  // ── 주방 (좌측 상단 코너) ──
  { instanceId: 'fridge',   type: 'furniture', tx: 0,  ty: 2, fw: 1, fh: 2, collides: true,  interact: 'storage', movable: true, removable: false },
  { instanceId: 'sink',     type: 'furniture', tx: 1,  ty: 2, fw: 1, fh: 1, collides: true,  interact: 'cook',    movable: true, removable: false },
  { instanceId: 'stove',    type: 'furniture', tx: 2,  ty: 2, fw: 2, fh: 1, collides: true,  interact: 'cook',    movable: true, removable: false },
  // ── 거실/침실 ──
  { instanceId: 'bed',      type: 'furniture', tx: 9,  ty: 2, fw: 2, fh: 3, collides: true,  interact: 'save',    movable: true,  removable: false },
  { instanceId: 'stand',    type: 'furniture', tx: 11, ty: 2, fw: 1, fh: 1, collides: true,  movable: true, removable: false },
  { instanceId: 'island',   type: 'furniture', tx: 5,  ty: 3, fw: 3, fh: 1, collides: true,  movable: true, removable: false },
  { instanceId: 'sofa',     type: 'furniture', tx: 2,  ty: 6, fw: 1, fh: 2, collides: true,  movable: true, removable: false },
  { instanceId: 'rug',      type: 'furniture', tx: 5,  ty: 5, fw: 3, fh: 2, collides: false, movable: true, removable: false },
  { instanceId: 'drawer',   type: 'furniture', tx: 11, ty: 6, fw: 1, fh: 2, collides: true,  movable: true, removable: false },
  { instanceId: 'shelf',    type: 'furniture', tx: 0,  ty: 7, fw: 2, fh: 1, collides: true,  interact: 'storage', movable: true,  removable: false },
  { instanceId: 'plant',    type: 'furniture', tx: 4,  ty: 8, fw: 1, fh: 1, collides: true,  movable: true, removable: false },
  // 188차 — 아버지의 낚시 상자 (침대 발치). 프롤로그 첫 목표 — 대·릴·가족사진이 들어 있다
  { instanceId: 'father_box', type: 'furniture', tx: 9, ty: 5, fw: 1, fh: 1, collides: true, interact: 'storage', movable: false, removable: false },
  { instanceId: 'door_out', type: 'door',      tx: 5,  ty: 9, fw: 2, fh: 1, collides: false, interact: 'door', movable: false, removable: false },
];

/**
 * 가구마다의 혼잣말 (186차 — 사용자 지시 "집으로 들어왔을 때 멈추면서 하나하나 안내").
 * 첫 입장 때 안내 순서대로 한 단락씩 보여 주고, 그 뒤로는 가구 앞 [F] 「살펴보기」로 다시 읽는다.
 * 기능이 있는 가구는 **그 기능을 쓰는 법**을 둘째 문장에 담는다(R4 — 정의문이 아니라 주인공의 말).
 */
const LOOK_TEXT: Record<string, string> = {
  door_out: '들어온 문. 밖으로 나가려면 문 앞에서 [F]를 누르거나 ESC를 누르면 된다.',
  plant: '화분 하나가 아직 살아 있다. 누가 물을 주고 있었던 모양이다.',
  sofa: '낡은 소파. 아버지는 여기서 라디오 물때 방송을 켜 놓고 졸곤 했다.',
  shelf: '수납 선반. 낚시 잡지 몇 권과 쓰다 만 채비 상자가 그대로 올려져 있다.',
  fridge: '냉장고는 아직 돌아간다. 위칸은 얼리고 아래칸은 차게 둔다.\n[F]로 열어 잡은 고기나 먹을 것을 넣어 두면, 넣어 둔 동안은 상하지 않는다.',
  sink: '개수대에서 수돗물이 나온다. 요리할 때 물 걱정은 없겠다.\n개수대나 가스레인지 앞에서 [F]를 누르면 요리를 시작한다.',
  stove: '가스레인지 두 구. 집 화구는 가스가 떨어질 일이 없다.\n[F]로 조리를 시작한다 — 재료는 가방에서 꺼내 넣는다.',
  island: '식탁. 둘이 앉으면 딱 맞는 크기다. 밥은 늘 여기서 먹었다.',
  rug: '러그 위에서 고양이가 자고 있다. 누가 밥을 챙겨 줬던 걸까. 이제는 내 몫이겠지.',
  bed: '아버지 침대. 이불 끝이 반듯하게 접혀 있다.\n침대 앞에서 [F]를 누르면 쉴 수 있다. 오늘 한 일을 기록(저장)하는 것도 이 침대에서만 된다.',
  stand: '머리맡 협탁. 안경을 늘 두던 자리에 먼지만 앉았다.',
  drawer: '서랍장 위 스탠드가 아직 켜진다. 서랍 안에는 아버지 옷가지가 그대로다.',
  clock: '벽시계는 멈추지 않고 가고 있다. 누가 건전지를 갈아 두었나.',
  books: '벽 선반의 책. 물때표, 어류 도감, 손때 묻은 매듭 책.',
  window: '창 너머로 바다 냄새가 들어온다. 여기서도 파도 소리가 들린다.',
  father_box: '아버지의 낚시 상자. 이제 비어 있다. 손잡이에 감은 테이프만 반질반질하다.',
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

/** 첫 입장 안내 순서 — 문에서 시작해 방을 한 바퀴 돌고 다시 문으로 */
const TOUR_ORDER = [
  'door_out', 'plant', 'sofa', 'shelf', 'fridge', 'sink', 'stove', 'island',
  'rug', 'bed', 'stand', 'drawer', 'clock', 'books', 'window',
] as const;
const TOUR_INTRO = '아버지 집이다. 떠날 때 모습 그대로다. 우선 하나씩 둘러보자.';
const TOUR_OUTRO = '대충 다 둘러봤다. 궁금한 게 있으면 가구 앞에서 [F]로 다시 살펴보면 된다.';

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
  private bedMenu?: Phaser.GameObjects.Container;
  private fridgePanel?: FridgePanel;
  /** 154차 — 집 주방 조리 패널 (가스레인지 [F]) */
  private cookPanel?: CookingPanel;
  private cookSyncAcc = 0;
  private nearObj: MapObject | null = null;
  /** 188차 — 프롤로그 기상(새 게임) 진입인가 */
  private wake = false;
  /** 188차 — 실내에서 여는 창(가방·장비·일지·상세보기) — ESC는 위에서부터 닫는다 */
  private popups: { panel: DraggablePanel; close: () => void }[] = [];
  private invPanel: InventoryPanel | null = null;
  private equipPanel: EquipmentPanel | null = null;
  private journalPanel: JournalPanel | null = null;
  private objBanner?: Phaser.GameObjects.Text;
  private objSpot?: Phaser.GameObjects.Graphics;
  private objSpotAt = 0;
  private syncAcc = 0;
  /** 첫 걸음 체험 — 걸은 거리(px) · 뛴 시간(ms) · 살펴본 가구 수 */
  private walked = 0;
  private ranMs = 0;
  private looked = 0;

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
    this.bedMenu = undefined;
    this.fridgePanel = undefined;
    this.cookPanel = undefined;
    this.nearObj = null;
    this.popups = [];
    this.invPanel = null;
    this.equipPanel = null;
    this.journalPanel = null;
    this.walked = 0; this.ranMs = 0; this.looked = 0;
    this.wakeStarted = false;
    this.tourPanel = undefined;
    this.tourSpot = undefined;
    this.tourSpotTween = undefined;

    this.drawRoom();
    this.drawFurniture();

    // 플레이어 (문 앞 스폰) — 실제 캐릭터 스프라이트 (RegionFieldScene와 동일 에셋)
    //  188차 — 프롤로그 기상은 침대 왼편에서
    if (this.wake) { this.px = OX + 8.4 * IT; this.py = OY + 4.6 * IT; }
    else { this.px = OX + 6 * IT; this.py = OY + 8.4 * IT; }
    this.charSprite = new CharacterSprite(this, this.px, this.py, characterLook(), CHAR_SCALE);
    this.charSprite.image.setY(this.py + this.charSprite.footPad).setDepth(20);
    const bodyH = this.charSprite.bodyHeight;
    this.playerShadow = this.add.ellipse(this.px, this.py, bodyH * 0.42, bodyH * 0.12, 0x000000, 0.28).setDepth(18);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-F', () => {   // 122차: 상호작용 키 E → F
      if (!this.tourPanel && !this.popups.length && !GuideTour.blocksKey('KeyF')) this.tryInteract();
    });
    // 188차 — 실내에서도 가방(I)·장비(E)·일지(J). 프롤로그 중에는 배운 만큼만 열린다
    this.input.keyboard!.on('keydown-I', () => { if (this.hotkeyOk('KeyI')) this.toggleInventory(); });
    this.input.keyboard!.on('keydown-E', () => { if (this.hotkeyOk('KeyE')) this.toggleEquipment(); });
    this.input.keyboard!.on('keydown-J', () => { if (this.hotkeyOk('KeyJ')) this.toggleJournal(); });
    const onInv = (): void => { syncPrologue(); this.charSprite.setConfig(characterLook()); };
    this.events.on('inventory-changed', onInv);
    this.events.once('shutdown', () => this.events.off('inventory-changed', onInv));
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.tourPanel) return;   // 혼잣말 창이 ESC를 '다음'으로 받는다
      if (GuideTour.blocksKey('Escape')) return;
      if (this.popups.length) { this.popups[this.popups.length - 1].close(); return; }
      if (this.cookPanel) { this.closeCook(); return; }
      if (this.fridgePanel) { this.closeFridge(); return; }
      if (this.bedMenu) { this.closeBedMenu(); return; }
      this.exitToField();
    });

    this.hintText = this.add.text(this.px, this.py - 40, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffe9b0', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 6, y: 2 },
    }).setOrigin(0.5, 1).setDepth(30).setVisible(false);

    // 186차 — 구 상단 문구(`집 (Tier 0 원룸) — 침대에서 저장 · 문으로 나가기`)는 개발 메모였다(§8-9).
    //   안내는 첫 입장 혼잣말과 가구 앞 [F] 힌트가 맡는다.
    this.events.once('shutdown', () => { this.tourSpotTween?.stop(); this.tourPanel?.destroy(); });
    this.objBanner = this.add.text(GAME_WIDTH / 2, 14, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffe9b0', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 12, y: 6 }, align: 'center',
      wordWrap: { width: GAME_WIDTH - 200, useAdvancedWrap: true },
    }).setOrigin(0.5, 0).setDepth(60).setVisible(false);
    this.objSpot = this.add.graphics().setDepth(41);
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

  // ── 프롤로그 (188차) ─────────────────────────────────

  /** 기상 혼잣말 → 첫 걸음 체험(걷기 · 뛰기 · [F] 살펴보기 · 낚시 상자 열기) */
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
          text: '가구 앞에 서면 머리 위에 [F]가 뜬다. 소파 앞으로 가서 [F]로 살펴보자.',
          passive: true,
          target: () => this.tourRect('sofa'),
          wait: () => this.looked > 0,
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

  /** 단축키를 받아도 되는가 — 대화·안내·메뉴 중이 아니고, 가이드·프롤로그 단계가 허용할 때 */
  private hotkeyOk(code: string): boolean {
    if (this.tourPanel || this.bedMenu || this.fridgePanel || this.cookPanel) return false;
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

  /** 아버지의 낚시 상자 — 처음이면 대·릴·가족사진을 가방에 넣는다 */
  private openFatherBox(): void {
    if (GameState.getFlag('prologue.box')) { this.lookAt('father_box'); return; }
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
    if (prologueStepDone('save') && !prologueStepDone('leave')) return 'door_out';
    return null;
  }

  private drawObjectiveSpot(delta: number): void {
    const g = this.objSpot;
    if (!g) return;
    g.clear();
    const id = this.tourPanel || this.popups.length ? null : this.objectiveSpotId();
    const r = id ? this.tourRect(id) : null;
    if (!r) return;
    this.objSpotAt += delta;
    const a = 0.45 + 0.45 * Math.abs(Math.sin(this.objSpotAt / 360));
    g.lineStyle(3, 0xffce54, a);
    g.strokeRoundedRect(r.x, r.y, r.width, r.height, 6);
  }

  // ── 첫 입장 안내 (186차) ─────────────────────────────

  /** 안내에 쓰는 대상 사각형(화면 좌표). 벽 장식(시계·책·창)은 가구 목록 밖이라 따로 잰다. */
  private tourRect(id: string): Phaser.Geom.Rectangle | null {
    const wallH = Math.round(IT * 1.4);
    const W = ROOM_W * IT;
    if (id === 'clock') return new Phaser.Geom.Rectangle(OX + IT * 1.4 - 20, OY + Math.round(IT * 0.62) - 20, 40, 40);
    if (id === 'books') return new Phaser.Geom.Rectangle(OX + IT * 4.2 - 4, OY + Math.round(IT * 0.72) - 36, IT * 2.4 + 8, 44);
    if (id === 'window') return new Phaser.Geom.Rectangle(OX + W - IT * 3.4 - 6, OY + 4, IT * 2.2 + 12, wallH - 18);
    const o = INTERIOR_OBJECTS.find((q) => q.instanceId === id);
    if (!o) return null;
    return new Phaser.Geom.Rectangle(OX + o.tx * IT - 4, OY + o.ty * IT - 4, (o.fw ?? 1) * IT + 8, (o.fh ?? 1) * IT + 8);
  }

  private startTour(): void {
    const steps: { id: string | null; text: string }[] = [{ id: null, text: TOUR_INTRO }];
    for (const id of TOUR_ORDER) steps.push({ id, text: LOOK_TEXT[id]! });
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
    if (r) {
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
   * 방 — 173차 재작성.
   *
   * 구 구현은 **단색 바닥 + 격자선 + 색 사각형 가구**였고, 그 위에 `주방`·`저장★ 침대`·
   * `지하실 (확장 예약)`·`평수 확장` 같은 **개발 메모가 글자로 박혀** 있었다(§8-9 위반 —
   * 확장 계획은 플레이어의 말이 아니다). 이제 재질을 도트로 그리고, 안내는 [F] 힌트가 맡는다.
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
        const col = grain < 0.12 ? 0xa0742f : grain > 0.9 ? 0xc79a52 : (typeof base === 'number' ? base : 0xb08240);
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
    // ── 벽시계 ──
    const cx = OX + IT * 1.4, cy = OY + Math.round(IT * 0.62);
    g.fillStyle(0x3a2718, 1); g.fillCircle(cx, cy, 16);
    g.fillStyle(0xf2e2b8, 1); g.fillCircle(cx, cy, 13);
    g.fillStyle(0x3a2718, 1);
    for (let a = 0; a < 12; a++) g.fillRect(cx + Math.round(Math.cos(a * Math.PI / 6) * 10) - 1, cy + Math.round(Math.sin(a * Math.PI / 6) * 10) - 1, 2, 2);
    g.fillRect(cx - 1, cy - 8, 2, 9); g.fillRect(cx - 1, cy - 1, 8, 2);
    // ── 벽 선반 + 책 ──
    const sx = OX + IT * 4.2, sy = OY + Math.round(IT * 0.72);
    for (let x = 0; x < IT * 2.4; x += 2) { dot(sx + x, sy, 0x8a6138); dot(sx + x, sy + 2, 0x5a3c22); }
    const books = [0xb04a3a, 0x3a6ea5, 0x3f9e63, 0xc2913a, 0x8a5aa8];
    books.forEach((col, i) => {
      const bx = sx + 6 + i * 16, bh = 22 + (i % 3) * 5;
      for (let y = 0; y < bh; y += 2) for (let x = 0; x < 10; x += 2) dot(bx + x, sy - bh + y, y < 3 ? 0xffffff : col);
    });
  }

  /**
   * 가구 — 173차 재작성. 색 사각형 대신 **재질 + 그늘 + 하이라이트**.
   * 라벨 글자는 전부 걷어냈다 — 무엇인지는 그림이 말하고, 무엇을 할 수 있는지는 [F] 힌트가 말한다.
   */
  private drawFurniture(): void {
    const g = this.add.graphics().setDepth(10);
    const dot = (x: number, y: number, col: number, a = 1): void => { g.fillStyle(col, a); g.fillRect(x, y, 2, 2); };
    /** 사각 면 — 위 하이라이트 + 아래 그늘 */
    const slab = (x: number, y: number, w: number, h: number, mid: number, lit: number, dark: number): void => {
      for (let yy = 0; yy < h; yy += 2) for (let xx = 0; xx < w; xx += 2) {
        dot(x + xx, y + yy, yy < 3 ? lit : yy > h - 5 ? dark : mid);
      }
    };
    /** 접지 그림자 */
    const shade = (x: number, y: number, w: number): void => {
      for (let xx = 0; xx < w; xx += 2) dot(x + xx, y, 0x2a1a0e, 0.28);
    };
    for (const o of INTERIOR_OBJECTS) {
      const x = OX + o.tx * IT, y = OY + o.ty * IT;
      const w = (o.fw ?? 1) * IT, h = (o.fh ?? 1) * IT;
      switch (o.instanceId) {
        case 'bed': {
          shade(x + 4, y + h - 4, w - 8);
          slab(x + 4, y + 6, w - 8, h - 12, 0x6a4a2c, 0x8a6440, 0x4a3420);          // 프레임
          slab(x + 8, y + 10, w - 16, h - 22, 0x8a3a34, 0xa64a42, 0x6e2a26);        // 매트리스·이불
          for (let yy = 0; yy < h - 26; yy += 8) for (let xx = 0; xx < w - 20; xx += 2) dot(x + 10 + xx, y + 16 + yy, 0x9b4139, 0.7);
          slab(x + 12, y + 14, w - 24, 22, 0xf2e2c8, 0xfff6e2, 0xd8c4a4);           // 베개
          slab(x + 8, y + h - 24, w - 16, 12, 0x3a6ea5, 0x4d86c0, 0x2a5280);        // 발치 이불단
          break;
        }
        case 'fridge':
          shade(x + 8, y + h - 6, w - 16);
          slab(x + 8, y + 6, w - 16, h - 12, 0xe4e6e2, 0xf5f7f3, 0xc2c6c0);
          for (let xx = 0; xx < w - 16; xx += 2) dot(x + 8 + xx, y + Math.round(h * 0.42), 0xaeb2ac);
          for (let yy = 0; yy < 14; yy += 2) dot(x + w - 18, y + 14 + yy, 0x8d979f);
          for (let yy = 0; yy < 14; yy += 2) dot(x + w - 18, y + Math.round(h * 0.5) + yy, 0x8d979f);
          break;
        case 'sink':
          shade(x + 6, y + h - 6, w - 12);
          slab(x + 4, y + 8, w - 8, h - 14, 0xcfd4d8, 0xe6eaed, 0xa9aeb2);
          slab(x + 12, y + 16, w - 24, h - 30, 0x5f6a74, 0x76828d, 0x454e57);
          for (let yy = 0; yy < 12; yy += 2) dot(x + w / 2, y + 6 + yy, 0x9aa6b0);
          dot(x + w / 2 - 2, y + 6, 0xb6c2cc); dot(x + w / 2 + 2, y + 6, 0xb6c2cc);
          break;
        case 'stove': {
          shade(x + 6, y + h - 6, w - 12);
          slab(x + 4, y + 8, w - 8, h - 14, 0x3a3f45, 0x4e545b, 0x24282d);
          for (const bx of [x + w * 0.3, x + w * 0.7]) {
            for (let a = 0; a < 360; a += 20) {
              const rx = Math.round(Math.cos(a * Math.PI / 180) * 8 / 2) * 2, ry = Math.round(Math.sin(a * Math.PI / 180) * 8 / 2) * 2;
              dot(bx + rx, y + h * 0.52 + ry, 0x22262a);
            }
            dot(bx - 2, y + h * 0.52, 0xff7a3a); dot(bx, y + h * 0.52 - 2, 0xffa35a);
            dot(bx, y + h * 0.52 + 2, 0xff7a3a); dot(bx + 2, y + h * 0.52, 0xffa35a);
          }
          for (let xx = 0; xx < w - 20; xx += 10) dot(x + 10 + xx, y + h - 10, 0xb0b6bc);   // 손잡이 열
          break;
        }
        case 'island':
          shade(x + 6, y + h - 2, w - 12);
          slab(x + 4, y + 10, w - 8, h - 20, 0xd8b98a, 0xeed6ae, 0xb4966a);
          for (let xx = 0; xx < w - 8; xx += 2) dot(x + 4 + xx, y + 10, 0xf4e4c4);
          for (const cxp of [x + w * 0.3, x + w * 0.7]) {
            for (let a = 0; a < 360; a += 24) {
              const rx = Math.round(Math.cos(a * Math.PI / 180) * 9 / 2) * 2, ry = Math.round(Math.sin(a * Math.PI / 180) * 9 / 2) * 2;
              dot(cxp + rx, y + h + 10 + ry, 0x7a5734);
            }
            slab(cxp - 8, y + h + 4, 16, 8, 0x8a6a44, 0xa8835a, 0x66492b);
          }
          break;
        case 'sofa':
          shade(x + 6, y + h - 4, w - 12);
          slab(x + 4, y + 6, w - 8, h - 12, 0x6d4079, 0x855196, 0x522f5c);          // 몸체
          slab(x + 10, y + 12, (w - 24) / 2, h * 0.42, 0x9a6aaa, 0xb182bf, 0x7c5089); // 쿠션 2
          slab(x + 14 + (w - 24) / 2, y + 12, (w - 24) / 2, h * 0.42, 0x9a6aaa, 0xb182bf, 0x7c5089);
          slab(x + 4, y + 6, 10, h - 12, 0x7c4c88, 0x9660a4, 0x5d3a68);             // 팔걸이
          slab(x + w - 14, y + 6, 10, h - 12, 0x7c4c88, 0x9660a4, 0x5d3a68);
          break;
        case 'rug': {
          for (let yy = 0; yy < h - 4; yy += 2) for (let xx = 0; xx < w - 4; xx += 2) {
            const edge = xx < 8 || yy < 8 || xx > w - 14 || yy > h - 14;
            dot(x + 2 + xx, y + 2 + yy, edge ? 0x2e5e3e : ((xx + yy) % 8 < 4 ? 0x3f7d54 : 0x38704b));
          }
          for (let xx = 0; xx < w - 4; xx += 4) { dot(x + 2 + xx, y + 2, 0xe8e0c8); dot(x + 2 + xx, y + h - 4, 0xe8e0c8); }  // 술
          // 고양이 — 웅크린 자세
          const kx = x + w / 2 - 14, ky = y + h / 2 - 6;
          for (let yy = 0; yy < 14; yy += 2) for (let xx = 0; xx < 26; xx += 2) {
            if (yy < 4 && (xx < 4 || xx > 20)) continue;
            dot(kx + xx, ky + yy, yy < 5 ? 0xe09a46 : 0xd88a3a);
          }
          for (let yy = 0; yy < 12; yy += 2) for (let xx = 0; xx < 12; xx += 2) dot(kx + 22 + xx, ky - 4 + yy, yy < 4 ? 0xe09a46 : 0xd88a3a);
          dot(kx + 24, ky - 6, 0xd88a3a); dot(kx + 30, ky - 6, 0xd88a3a);           // 귀
          dot(kx + 26, ky + 2, 0x2a1a0e); dot(kx + 30, ky + 2, 0x2a1a0e);           // 눈
          for (let xx = 0; xx < 10; xx += 2) dot(kx - 2 - xx, ky + 10, 0xd88a3a);   // 꼬리
          break;
        }
        case 'drawer':
          shade(x + 8, y + h - 4, w - 16);
          slab(x + 6, y + 6, w - 12, h - 12, 0x6a4a2c, 0x8a6440, 0x4a3420);
          for (const fy of [0.3, 0.62]) {
            slab(x + 10, y + h * fy, w - 20, 14, 0x7d5934, 0x9a7046, 0x5c4022);
            for (let xx = 0; xx < 10; xx += 2) dot(x + w / 2 - 4 + xx, y + h * fy + 6, 0xc9a66a);
          }
          for (let yy = 0; yy < 10; yy += 2) for (let xx = 0; xx < 14; xx += 2) dot(x + w / 2 - 6 + xx, y - 6 + yy, 0xffe28a, 0.9);  // 램프갓
          dot(x + w / 2, y + 4, 0xfff3c4);
          break;
        case 'shelf':
          shade(x + 6, y + h - 4, w - 12);
          slab(x + 4, y + 6, w - 8, h - 12, 0x5a3a22, 0x7a5232, 0x3f2718);
          for (const fy of [0.32, 0.64]) for (let xx = 0; xx < w - 16; xx += 2) dot(x + 8 + xx, y + h * fy, 0x8a6138);
          [0x3a6ea5, 0xb04a3a, 0x3f9e63].forEach((col, i) => {
            for (let yy = 0; yy < 16; yy += 2) for (let xx = 0; xx < 8; xx += 2) dot(x + 12 + i * 12 + xx, y + h * 0.32 - 16 + yy, col);
          });
          break;
        case 'plant': {
          const px = x + IT * 0.5;
          shade(x + IT * 0.28, y + IT * 0.86, IT * 0.44);
          slab(x + IT * 0.3, y + IT * 0.56, IT * 0.4, IT * 0.3, 0xb06a3b, 0xcb8450, 0x8d5029);
          for (let a = 0; a < 5; a++) {
            const ang = -90 + (a - 2) * 26, len = 16 + (a % 2) * 5;
            for (let t = 0; t < len; t += 2) {
              dot(px + Math.round(Math.cos(ang * Math.PI / 180) * t / 2) * 2,
                  y + IT * 0.56 + Math.round(Math.sin(ang * Math.PI / 180) * t / 2) * 2,
                  t > len - 8 ? 0x4fae56 : 0x3b8a42);
            }
          }
          break;
        }
        case 'stand':
          shade(x + 10, y + h - 6, w - 20);
          slab(x + 8, y + 12, w - 16, h - 22, 0x6a4a2c, 0x8a6440, 0x4a3420);
          for (let xx = 0; xx < w - 20; xx += 2) dot(x + 10 + xx, y + 12, 0x9a7046);
          break;
        case 'father_box': {
          // 188차 — 아버지의 낚시 상자: 나무 몸통 + 금속 걸쇠 + 테이프 감은 손잡이
          shade(x + 6, y + h - 6, w - 12);
          slab(x + 6, y + 16, w - 12, h - 24, 0x7a5232, 0x9a7046, 0x5a3c22);
          for (let xx = 0; xx < w - 12; xx += 2) { dot(x + 6 + xx, y + 16, 0xb88a52); dot(x + 6 + xx, y + 26, 0x4a3018); }
          for (const lx of [x + 12, x + w - 16]) for (let yy = 0; yy < 6; yy += 2) { dot(lx, y + 24 + yy, 0xc9ccd0); dot(lx + 2, y + 24 + yy, 0x8d979f); }
          for (let xx = 0; xx < 16; xx += 2) dot(x + w / 2 - 8 + xx, y + 8, 0x2e2e34);
          for (let yy = 0; yy < 8; yy += 2) { dot(x + w / 2 - 10, y + 8 + yy, 0x2e2e34); dot(x + w / 2 + 8, y + 8 + yy, 0x2e2e34); }
          for (let xx = 0; xx < 8; xx += 2) dot(x + w / 2 - 4 + xx, y + 8, 0x3a6ea5);
          break;
        }
        case 'door_out': {
          slab(x + 6, y + IT * 0.22, w - 12, IT * 0.82, 0x4a2f1c, 0x6d4a2d, 0x33200f);
          for (let yy = 0; yy < IT * 0.66; yy += 2) for (let xx = 0; xx < w - 24; xx += 2) {
            dot(x + 12 + xx, y + IT * 0.3 + yy, (yy % 10 < 5) ? 0x7a5232 : 0x6d4a2d);
          }
          dot(x + w - 20, y + IT * 0.6, 0xffd257); dot(x + w - 20, y + IT * 0.62, 0xd6a93d);
          break;
        }
      }
    }
  }

  // ── 이동/충돌 (간이 AABB — 물리 미사용) ──────────────

  update(_t: number, delta: number): void {
    // 154차 — 집 주방 화구는 wall-clock으로 계속 끓는다(패널이 닫혀 있어도). 1초마다 동기화.
    this.cookSyncAcc += delta;
    if (this.cookSyncAcc >= 1000) { this.cookSyncAcc = 0; CookingStore.syncAll(); }
    // 188차 — 프롤로그 동기화(1초) · 「지금 할 일」 짚기
    this.syncAcc += delta;
    if (this.syncAcc >= 1000) { this.syncAcc = 0; syncPrologue(); this.refreshObjective(); }
    this.drawObjectiveSpot(delta);
    const tourBlocks = !!GuideTour.active && GuideTour.blocksKey('ArrowUp');
    if (this.bedMenu || this.fridgePanel || this.cookPanel || this.tourPanel || this.popups.length || tourBlocks) {   // 메뉴/패널/안내 중 이동 정지
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
    this.updateProximity();
  }

  private collides(px: number, py: number): boolean {
    // 방 경계 (상단 벽 밴드 아래부터. py = 발밑)
    if (px < OX + 12 || px > OX + ROOM_W * IT - 12) return true;
    if (py < OY + IT * 2.0 || py > OY + ROOM_H * IT - 6) return true;
    // 가구 AABB (발밑 기준 — 발이 가구 앞면에 닿으면 정지)
    for (const o of INTERIOR_OBJECTS) {
      if (!o.collides) continue;
      const x = OX + o.tx * IT, y = OY + o.ty * IT;
      const w = (o.fw ?? 1) * IT, h = (o.fh ?? 1) * IT;
      if (px > x - 8 && px < x + w + 8 && py > y + 8 && py < y + h + 12) return true;
    }
    return false;
  }

  private updateProximity(): void {
    let nearest: MapObject | null = null;
    let best = 62;
    for (const o of INTERIOR_OBJECTS) {
      // 186차 — 기능이 없는 가구도 [F] 「살펴보기」로 혼잣말을 다시 읽는다
      if (o.interact === 'none' && !LOOK_TEXT[o.instanceId]) continue;
      const cx = OX + o.tx * IT + ((o.fw ?? 1) * IT) / 2;
      const cy = OY + o.ty * IT + ((o.fh ?? 1) * IT) / 2;
      const d = Math.hypot(cx - this.px, cy - this.py);
      if (d < best + Math.max(o.fw ?? 1, o.fh ?? 1) * IT * 0.4) { best = d; nearest = o; }
    }
    this.nearObj = nearest;
    if (nearest) {
      const label = nearest.interact === 'save' ? '[F] 침대 — 저장하고 쉬기'
        : nearest.interact === 'door' ? '[F] 나가기'
        : nearest.interact === 'cook' ? '[F] 주방 — 요리'
        : nearest.instanceId === 'fridge' ? '[F] 냉장고 열기'
        : nearest.instanceId === 'father_box' && !GameState.getFlag('prologue.box') ? '[F] 낚시 상자 열기'
        : '[F] 살펴보기';
      this.hintText.setText(label).setPosition(this.px, this.py - this.charSprite.bodyHeight - 10).setVisible(true);
    } else {
      this.hintText.setVisible(false);
    }
  }

  private tryInteract(): void {
    if (this.bedMenu || this.fridgePanel || this.cookPanel || !this.nearObj) return;
    switch (this.nearObj.interact) {
      case 'save': this.openBedMenu(); break;
      case 'door': this.exitToField(); break;
      case 'cook': this.openCook(); break;
      case 'storage':
        if (this.nearObj.instanceId === 'fridge') { this.openFridge(); break; }
        if (this.nearObj.instanceId === 'father_box') { this.openFatherBox(); break; }
        this.lookAt(this.nearObj.instanceId);
        break;
      default: this.lookAt(this.nearObj.instanceId); break;
    }
  }

  /** 가구 하나 살펴보기 — 첫 입장 안내와 같은 혼잣말 한 단락 */
  private lookAt(id: string): void {
    const t = LOOK_TEXT[id];
    if (!t) return;
    this.looked++;
    this.showLook(id, t, () => this.clearSpot());
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
    const c = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.97); bg.fillRoundedRect(-170, -92, 340, 184, 8);
    bg.lineStyle(2, 0x2a5a8a, 1); bg.strokeRoundedRect(-170, -92, 340, 184, 8);
    c.add(bg);
    c.add(this.add.text(0, -64, '침대에서 쉬어갑니다', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5));

    const mkBtn = (y: number, label: string, color: string, stroke: number, onClick: () => void): void => {
      const g = this.add.graphics();
      g.fillStyle(0x14283c, 0.95); g.fillRoundedRect(-140, y - 17, 280, 34, 5);
      g.lineStyle(1.5, stroke, 0.95); g.strokeRoundedRect(-140, y - 17, 280, 34, 5);
      const t = this.add.text(0, y, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color, fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = this.add.rectangle(0, y, 280, 34, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', onClick);
      c.add([g, t, hit]);
    };
    mkBtn(-22, '저장하고 쉬기', '#4af2a1', 0x4af2a1, () => {
      // 수면 회복이 먼저 — 저장 스냅샷에 회복 결과가 담기게 한다 (125차)
      const rec = this.restInBed();
      markPrologue('save');   // 188차 — 프롤로그 「침대에서 저장한다」 (저장 스냅샷에 담기게 저장 전에)
      const ok = GameState.save();
      if (ok) StoryStore.event({ kind: 'custom', key: 'bedSave' });   // 134차 — M1-03 침대 저장 목표
      this.closeBedMenu();
      this.flash(ok ? `슬롯 ${GameState.activeSlot ?? 1}에 저장했습니다. ${rec}` : '저장에 실패했습니다');
      // (추후) 날짜 진행 훅 — 로드맵 4·5에서 결합
    });
    mkBtn(18, '그냥 쉬기', '#9fd0e4', 0x33b0e0, () => {
      const rec = this.restInBed();
      this.closeBedMenu();
      this.flash(rec);
    });
    mkBtn(58, '취소 (ESC)', '#8faabf', 0x2a5a8a, () => this.closeBedMenu());
    this.bedMenu = c;
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
    this.bedMenu?.destroy();
    this.bedMenu = undefined;
  }

  private flashMsg?: Phaser.GameObjects.Text;
  private flash(msg: string): void {
    this.flashMsg?.destroy();
    this.flashMsg = this.add.text(GAME_WIDTH / 2, OY + ROOM_H * IT + 26, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#7fe6b0', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(120);
    this.time.delayedCall(2200, () => { this.flashMsg?.destroy(); this.flashMsg = undefined; });
  }

  /** 문 → 홈타운 외부 복귀 (stop + resume 규칙 — RegionFieldScene 재생성 금지) */
  private exitToField(): void {
    // 188차 — 프롤로그: 저장까지 마치고 나서야 「집을 나선다」 (앞 단계를 건너뛴 채 나가면 다시 들어와 이어 한다)
    if (prologueStepDone('save')) markPrologue('leave');
    GameState.locationTag = 'hometown';
    fadeOutThen(this, () => {
      this.scene.stop();
      this.scene.resume('RegionFieldScene');
    }, 220);
  }
}
