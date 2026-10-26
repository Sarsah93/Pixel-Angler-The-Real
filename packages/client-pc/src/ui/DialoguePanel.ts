/**
 * @file DialoguePanel.ts
 * @description 탑다운 필드 NPC 대화창 (134차 신설 · 140차 선택지 · **150차 전면 재작성**).
 *
 * 150차에 바뀐 것 — 사용자 지시:
 *  1. **한 번에 다 띄우지 않는다.** 대사는 좌→우로 **타이핑**되고, 넘치면 앞 줄이 위로 밀리며
 *     새 줄이 아래에 쓰인다(로그가 흐르는 느낌). 단락이 끝나면 우측 하단에 **흰 역삼각형(▼)**
 *     으로 "더 있다"를 알린다. 클릭/Enter로 다음 단락.
 *  2. **본문 20px** — 구 13px은 읽히지 않았다(사용자: "20pt 정도는 되어야").
 *  3. **표준 선택지 3종** — `내가 도와줄 수 있는 게 있을까요?` / `물건을 볼 수 있을까요?`
 *     (거래하는 사람만) / `나가기`. 퀘스트는 첫 선택지로 들어가야 나온다 — NPC를 누르자마자
 *     의뢰서가 펼쳐지지 않는다.
 *  4. **초상은 얼굴만 확대**(증명사진) — 전신을 키우면 초상 칸을 몸통이 다 먹는다.
 *
 * 남는 규칙(140·141차): 우선순위 완료 가능 > 진행 중 > 발주 > 잡담 · 보상은 **고른 뒤에만** 드러난다 ·
 * 우호도가 낮으면 서브 발주가 감춰지고 그 사실을 대사로 말한다.
 *
 * 253차 — **답이 길어지고(단락마다 ▼) 답 수가 늘었다**(받는 자리 3~5개) → 창 높이 372 → 452 · 로그 152 → 172 ·
 *  선택지 줄 간격을 줄 수에 맞추고 「다른 얘기를 좀…」 · 「나가기」는 한 줄에 반씩.
 *  **물어보기**(킹덤컴식 조사 대화) — 아는 화제(사람 · 곳 · 물건 · 낱말 · 단서)를 골라 묻고, 답에서 새 화제가 열리며
 *  꼬리 질문이 이어진다. 조사 목표(`inquiryDrivesAction`)는 진행 중 화면의 「방식 고르기」 대신 그 편의 물음이 나온다.
 *
 * 254차 — **이어지는 대화(갈래)**. 받는 자리 · 진행 중(장면 목표 · 행동 단계) · 끝내는 자리에 대화가 있으면 표준 답 대신 그것이 돈다.
 *  상대 대사 → 내 말 → 상대의 반응이 이어지고, 고른 말은 여러 사람의 우호도를 움직인다(초상 아래 막대가 바로 바뀐다).
 *  끝내는 자리 대화는 이야기의 결말을 고를 수 있다(「결말 — 「제목」」).
 *
 * 258차 — **답의 효과 · 고르지 않은 답은 대화창에 찍지 않는다**(사용자 「이건 인게임에서 유저에게 보여주는 내용이 아니어야 해 …
 *  위키로만 확인할 수 있도록」). 「이 답으로 — …」 · 「이 말로 — …」 · 「고르지 않은 답 — … → ???」 줄을 뺐다.
 *  받은 돈 · 물건은 화면 오른쪽 획득 알림이, 마음은 초상 아래 막대가 알린다. 답마다 효과는 위키(조행록)에 있다.
 *
 * 모달(dim) · depth 940 — ConfirmDialog(950) 아래, 일반 팝업(800대) 위.
 */

import Phaser from 'phaser';
import {
  getStoryNpc, getStoryQuest, characterOf, affinityTier, AFFINITY_TIER_LABEL, affinityPips, narrativeOf, INQUIRY_KIND_LABEL,
  talkNode,
  type StoryQuestDef, type QuestChoiceDef, type InquiryNodeDef, type StoryTalkDef, type TalkChoiceDef,
} from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { StoryStore } from '../store/StoryStore.js';
import { storyActionSpec } from '../store/StoryActionRegistry.js';
import { dialogueOf, doorLineOf, homeLineOf, DOOR_NARR, NPC_IDLE, type DoorReason } from '../data/StoryDialogue.js';
import { STORY_FIELD_TRIGGERS } from '../data/StoryNpcs.js';
import { clampTextWidth } from './TextFit.js';
import { ensureFacePortrait } from './CharacterSprite.js';
import { applyScreenFixed } from './DraggablePanel.js';
import { t, getLocale } from '../i18n/I18n.js';
import { applyPortraitMask, type PortraitMaskHandle } from './PortraitMask.js';
import { PORTRAIT_LAYOUT } from './PortraitLayout.js';
import { voiceOfNpc, paceSentences, SENTENCE_PAUSE_MS, spokenProgressKo, particle, type SpokenObjective } from '@tra/core';
import { SHOP_CATALOG, BUILDING_HOURS, BUILDING_LABEL, type BuildingKind } from '../data/ShopCatalog.js';
import { VoiceTyper } from '../audio/Voice.js';
import { playUiClick } from '../audio/Sfx.js';
import { GuideTour, maybeStartTour } from './GuideTour.js';

const W = 1040;
/** 253차 — 372 → 452(답이 3~5개로 늘고 응답이 길어졌다) */
const H = 452;
const FONT = '"Noto Sans KR", sans-serif';

/** 초상 열 — 32px 전용 얼굴 격자를 6배 nearest로 표시한다. */
const FACE_SCALE = 12;
const FACE_PX = 32 * Math.round((16 * FACE_SCALE) / 32);
const PORTRAIT_W = FACE_PX + 48;
/**
 * 캡처의 빨간 가이드가 가리킨 실제 파란 초상 칸.
 * 프레임을 세로로 충분히 확보하고 이미지는 그 안에 수직 중앙 배치한다.
 * 이전 값은 프레임 하단과 어깨가 같은 높이에 걸려 이름/호감도 라벨을 침범했다.
 */
const PORTRAIT_FRAME_W = PORTRAIT_W - PORTRAIT_LAYOUT.frameSideInset;
const PORTRAIT_FRAME_H = FACE_PX + 40;

const TEXT_X = PORTRAIT_W + 12;
const TEXT_W = W - TEXT_X - 22;

/** 본문 글자 크기 — 사용자 지시 "20pt 정도" */
const BODY_PX = 20;
/** 대사 로그 뷰포트 높이 (≈ 6줄 — 253차 152 → 172) */
const LOG_H = 172;
const CHOICE_H = 32;

/** 타이핑 속도 — ms마다 CHARS_PER_TICK자 */
const TYPE_MS = 18;
const CHARS_PER_TICK = 1;

const COL = {
  text: '#e8f4fd', dim: '#8fa6bd', accent: '#ffe9a0', ok: '#7fe0b0',
  warn: '#ffb45a', hint: '#7f95aa', narr: '#d6c9a8',
};
/** 267차 — 주의 단락(영업시간 등) 글자색 — 사용자 「빨간색 텍스트로 단서 주기」 */
const COL_CAUTION = '#ff8f7f';
/** 267차 — 단락 앞에 붙이면 그 단락은 **빨간 글로 제 쪽에 홀로** 찍힌다(보이지 않는 글자 — 번역 전에 뗀다) */
const HINT_PREFIX = '\u2063';

interface ChoiceRow {
  label: string; hint?: string; action: () => void; disabled?: boolean;
  /** 253차 — 반 폭(이어지는 반 폭 행과 한 줄을 나눈다 — 「다른 얘기를 좀…」 · 「나가기」) */
  half?: boolean;
  /** 253차 — 흐리게(이미 들은 물음) */
  dim?: boolean;
}

/**
 * 167차 — 대화창이 씬에 넘기는 장면 요청. 대화창은 닫히고, 씬이 실제 필드 위에서 컷씬을 재생한 뒤
 * 목표를 닫는다. **클릭이 목표를 닫는 경로는 더 이상 없다.**
 */
export type DialogueSceneRequest =
  | { kind: 'objective'; questId: string; objectiveIndex: number }
  | { kind: 'action'; questId: string; objectiveIndex: number; choiceId: string }
  /** 현장 트리거 중 `viaNpc`로 이 사람에게 말을 걸어 진행하는 단계 */
  | { kind: 'trigger'; triggerId: string };

/** 화면 상태 — 인사 → 기본 선택 → 퀘스트 → 응답 → 일감 · 물어보기(253차) · 이어지는 대화(254차) */
type View = 'menu' | 'quest' | 'reply' | 'jobs' | 'ask' | 'talk';

export class DialoguePanel extends DraggablePanel {
  private bodyC?: Phaser.GameObjects.Container;   // ⚠ `body`는 Phaser Container 예약 프로퍼티(44차 함정)
  private readonly npcId: string;
  /** 211차 — 이 사람의 목소리(글자마다 블립) */
  private readonly voice: VoiceTyper;
  private readonly onClose: () => void;
  private readonly regionId: string;
  private readonly onTrade?: (shopId: string) => void;
  private readonly onScene?: (req: DialogueSceneRequest) => void;
  private view: View = 'menu';
  /** 214차 — 문 앞 대화(첫 인사만 바뀐다) · 216차 'inside' = 그 사람 집 안 */
  private readonly atDoor?: DoorReason | 'inside';

  /** 지금 화면 — 검증 하네스가 읽는다 */
  get currentView(): View { return this.view; }

  /** 응답 화면 (141차) — 보상은 고른 뒤에만 드러난다 */
  private reply: { line: string; rewards: string[]; declined?: boolean; said?: string } | null = null;
  /** 267차 — 지금 쪽이 주의 단락(빨간 글) 쪽인가 — 다음 단락은 새 쪽에서 평소 색으로 */
  private hintPage = false;

  // ── 타이핑 로그 ──────────────────────────────────
  /** 이미 다 찍힌 글(단락 사이 빈 줄 포함) */
  private logDone = '';
  /** 지금 찍고 있는 단락 */
  private typingPara = '';
  /** 그 단락에서 찍은 글자 수 */
  private typed = 0;
  /** 257차 — 이만큼 찍은 뒤 쉬어 간다(문장 끝) · 남은 쉼(타이머 횟수) */
  private pauses = new Set<number>();
  private holdTicks = 0;
  /** 아직 안 찍은 단락들 */
  private queue: string[] = [];
  private typeTimer?: Phaser.Time.TimerEvent;
  private logText?: Phaser.GameObjects.Text;
  private logInner?: Phaser.GameObjects.Container;
  private logMask?: Phaser.GameObjects.Graphics;
  private portraitMask?: PortraitMaskHandle;
  /** 254차 — 초상 칸(우호도가 바뀌면 이것만 다시 그린다) · 우호도 막대 자리(가이드 말풍선이 짚는다) */
  private portraitC?: Phaser.GameObjects.Container;
  private affinityBar?: { x: number; y: number; w: number; h: number };
  /** 254차 — 지금 도는 이어지는 대화(검증 하네스가 읽는다) */
  private talk: { def: StoryTalkDef; node: string } | null = null;
  get currentTalk(): { id: string; node: string } | null { return this.talk ? { id: this.talk.def.id, node: this.talk.node } : null; }
  private caret?: Phaser.GameObjects.Graphics;
  private caretTween?: Phaser.Tweens.Tween;
  private lastPanelX = NaN;
  private lastPanelY = NaN;
  private readonly postUpdate: () => void;

  // ── 선택지 ───────────────────────────────────────
  private rows: ChoiceRow[] = [];
  private pendingRows: ChoiceRow[] = [];
  private cursor = 0;
  private rowObjs: {
    g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text; h?: Phaser.GameObjects.Text; row: ChoiceRow;
    /** 253차 — 줄 가운데 y · 왼쪽 x · 폭 · 강조 높이 */
    cy: number; x: number; w: number; rh: number;
  }[] = [];
  private choiceC?: Phaser.GameObjects.Container;
  private lastWorkMsg = '';
  private actionReply = '';
  private readonly keyHandler: (ev: KeyboardEvent) => void;
  private readonly clickHandler: () => void;

  constructor(
    scene: Phaser.Scene, npcId: string, onClose: () => void,
    regionId = '', onTrade?: (shopId: string) => void, onScene?: (req: DialogueSceneRequest) => void,
    /** 214차 — 집에 있는 사람의 문을 두드려 열었다(까닭에 따라 첫마디가 다르다). 메뉴는 평소와 같다(R12) */
    atDoor?: DoorReason | 'inside',
  ) {
    const npc = getStoryNpc(npcId);
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: GAME_HEIGHT - H - 18,
      width: W, height: H, title: `${npc?.nameKo ?? npcId}  ·  ${StoryStore.npcRole(npcId).ko}`,   // 253차 — 밝혀지기 전 직함은 가린다(R2)
      onClose, dim: true, depth: 940,
      sound: false,   // 252차 — 말 걸기 소리(talk)를 따로 낸다
    });
    this.npcId = npcId;
    this.voice = new VoiceTyper(voiceOfNpc(npcId));
    this.onClose = onClose;
    this.regionId = regionId;
    this.onTrade = onTrade;
    this.onScene = onScene;
    this.atDoor = atDoor;
    // 167차 — 구 `StoryStore.event({ kind: 'talk' })`를 여기서 지웠다. 대화창을 여는 것만으로
    //  `talk` 목표가 닫히던 것이 "클릭만 해도 클리어"의 정체였다(사용자 지시).

    this.keyHandler = (ev: KeyboardEvent) => this.onKey(ev);
    scene.input.keyboard?.on('keydown', this.keyHandler);
    // 대사 진행은 아무 데나 클릭해도 된다(선택지 행은 자기 핸들러가 먼저 먹는다)
    this.clickHandler = () => { if (this.busy) this.advance(); };
    this.postUpdate = () => {
      if (this.x !== this.lastPanelX || this.y !== this.lastPanelY) {
        this.syncMask();
        this.portraitMask?.sync();
      }
    };
    scene.events.on('postupdate', this.postUpdate);

    this.buildFrame();
    this.enterMenu(true);
  }

  override destroy(fromScene?: boolean): void {
    if (this.typeTimer) { this.typeTimer.remove(); this.scene?.time?.removeEvent(this.typeTimer); }   // 213차 — 닫은 뒤 한 번 더 불리지 않게
    this.caretTween?.stop();
    this.scene?.input?.keyboard?.off('keydown', this.keyHandler);
    this.scene?.events?.off('postupdate', this.postUpdate);
    this.logMask?.destroy();
    this.portraitMask?.destroy();
    super.destroy(fromScene);
  }

  // ═══════════ 입력 ═══════════
  /** 아직 찍는 중이거나 남은 단락이 있다 = 선택지를 내주지 않는다 */
  private get busy(): boolean {
    return this.typed < this.typingPara.length || this.queue.length > 0;
  }

  private onKey(ev: KeyboardEvent): void {
    if (GuideTour.blocksKey(ev.code)) return;   // 253차 — 물어보기 가이드 말풍선이 받는다
    if (this.busy) {
      if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); this.advance(); }
      return;
    }
    if (this.rows.length === 0) return;
    if (ev.code === 'ArrowUp' || ev.code === 'ArrowLeft') { this.moveCursor(-1); ev.preventDefault(); }
    else if (ev.code === 'ArrowDown' || ev.code === 'ArrowRight') { this.moveCursor(1); ev.preventDefault(); }
    else if (ev.code === 'Enter' || ev.code === 'Space') {
      const r = this.rows[this.cursor];
      if (r && !r.disabled) { ev.preventDefault(); playUiClick(); r.action(); }
    }
  }

  /** 한 번 더 누르면 = 지금 단락 즉시 완성 → 그다음은 다음 단락 */
  private advance(): void {
    if (this.typed < this.typingPara.length) { this.typed = this.typingPara.length; this.paintLog(); this.afterPara(); return; }
    if (this.queue.length > 0) { this.commitPara(); this.startNextPara(); }
  }

  private moveCursor(d: number): void {
    const n = this.rows.length;
    for (let i = 0; i < n; i++) {
      this.cursor = (this.cursor + d + n) % n;
      if (!this.rows[this.cursor].disabled) break;
    }
    this.paintCursor();
  }

  // ═══════════ 프레임 (초상 + 로그 박스) ═══════════
  private buildFrame(): void {
    this.bodyC?.destroy();
    const c = this.scene.add.container(0, this.contentTop);
    this.bodyC = c;
    this.add(c);

    // 254차 — 초상은 자기 칸(우호도가 바뀌면 이것만 다시 그린다)
    this.portraitC = this.scene.add.container(0, 0);
    c.add(this.portraitC);
    this.renderPortrait(this.portraitC);

    // 대사 박스
    const g = this.scene.add.graphics();
    g.fillStyle(0x08121c, 0.82); g.fillRect(TEXT_X - 8, 4, TEXT_W + 16, LOG_H + 12);
    g.lineStyle(1, 0x2c5878, 0.9); g.strokeRect(TEXT_X - 8, 4, TEXT_W + 16, LOG_H + 12);
    c.add(g);

    // 로그 — 마스크로 잘리는 컨테이너 안에서 위로 밀린다
    const inner = this.scene.add.container(0, 0);
    this.logInner = inner;
    c.add(inner);
    this.logText = this.scene.add.text(TEXT_X, 10, '', {
      fontFamily: FONT, fontSize: `${BODY_PX}px`, color: COL.text,
      // ⚠ 한국어는 `useAdvancedWrap` 없이는 **띄어쓰기에서만** 줄이 바뀐다 —
      //   긴 어절이나 붙여 쓴 문장이 오면 가로로 삐져나간다.
      lineSpacing: 7, wordWrap: { width: TEXT_W, useAdvancedWrap: true },
    });
    inner.add(this.logText);

    const maskG = this.scene.make.graphics({}, false).setScrollFactor(0);
    this.logMask = maskG;
    inner.setMask(maskG.createGeometryMask());
    this.lastPanelX = NaN;
    this.syncMask();

    // 더 있음 표시 — 흰 역삼각형(사용자 지정)
    const car = this.scene.add.graphics();
    car.fillStyle(0xffffff, 1);
    car.fillTriangle(-7, -4, 7, -4, 0, 6);
    car.setPosition(TEXT_X + TEXT_W - 6, LOG_H + 2).setVisible(false);
    this.caret = car;
    c.add(car);

    this.choiceC = this.scene.add.container(0, 0);
    c.add(this.choiceC);

    // 클릭으로 대사 진행 — 패널 바닥판 위에 깔되 선택지보다 아래
    const plate = this.scene.add.rectangle(TEXT_X + TEXT_W / 2, 10 + LOG_H / 2, TEXT_W + 16, LOG_H + 12, 0xffffff, 0.001)
      .setInteractive();
    plate.on('pointerdown', this.clickHandler);
    c.add(plate);
    applyScreenFixed(this);
  }

  private syncMask(): void {
    const g = this.logMask;
    if (!g) return;
    this.lastPanelX = this.x; this.lastPanelY = this.y;
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(this.x + TEXT_X - 6, this.y + this.contentTop + 6, TEXT_W + 12, LOG_H + 8);
  }

  /**
   * 얼굴 초상 + 우호도 (150차 — 전신 → 얼굴 확대).
   * 전신을 5배로 키우던 구 구현은 초상 칸의 대부분을 몸통·다리가 차지해 표정이 안 보였다.
   */
  private renderPortrait(c: Phaser.GameObjects.Container): void {
    const g = this.scene.add.graphics();
    const boxX = PORTRAIT_LAYOUT.outerInset, boxY = 4;
    const boxW = PORTRAIT_W - PORTRAIT_LAYOUT.outerInset * 2;
    const boxH = this.panelH - this.contentTop - 12;
    g.fillStyle(0x08121c, 0.96); g.fillRoundedRect(boxX, boxY, boxW, boxH, 12);
    g.lineStyle(2, 0x356b8f, 0.9); g.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);
    g.lineStyle(1, 0x18344c, 1); g.strokeRoundedRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10, 9);
    c.add(g);

    // 구성 순서: 초상화 → 호감도 막대/상태 → 이름 슬롯.
    // 이름 슬롯이 호감도 텍스트와 겹치지 않도록 각 영역을 독립 높이로 예약한다.
    const BAR_H = 8, BAR_GAP = 18, AFFINITY_GAP = 6, AFFINITY_H = 16;
    const NAME_GAP = PORTRAIT_LAYOUT.nameGap, NAME_H = PORTRAIT_LAYOUT.nameHeight;
    const npc = getStoryNpc(this.npcId);
    const showAffinity = !!npc;
    const affinityBlockH = showAffinity
      ? BAR_GAP + BAR_H + AFFINITY_GAP + AFFINITY_H + NAME_GAP
      : NAME_GAP;
    const stackH = PORTRAIT_FRAME_H + affinityBlockH + NAME_H;
    const top = boxY + Math.max(6, Math.floor((boxH - stackH) / 2));
    const frameX = PORTRAIT_W / 2 - PORTRAIT_FRAME_W / 2;

    // 얼굴 뒤 배경 — 증명사진 톤
    g.fillStyle(0x12263a, 1);
    g.fillRoundedRect(frameX, top, PORTRAIT_FRAME_W, PORTRAIT_FRAME_H, PORTRAIT_LAYOUT.frameRadius);
    g.lineStyle(2, 0x6b9fbc, 0.95);
    g.strokeRoundedRect(frameX, top, PORTRAIT_FRAME_W, PORTRAIT_FRAME_H, PORTRAIT_LAYOUT.frameRadius);

    const key = ensureFacePortrait(this.scene, characterOf(this.npcId), FACE_SCALE, this.npcId);
    // 32×32 전체 래스터를 유지하되 프레임 안에서 중앙 정렬한다. 특히 y=30~31의
    // 어깨 행이 칸 밖으로 밀려나지 않도록 위·아래 여백을 동일하게 둔다.
    const imageSize = Math.min(FACE_PX, PORTRAIT_FRAME_H - 16);
    const imageTop = top + Math.floor((PORTRAIT_FRAME_H - imageSize) / 2);
    const img = this.scene.add.image(PORTRAIT_W / 2, imageTop, key)
      .setOrigin(0.5, 0).setDisplaySize(imageSize, imageSize);
    // 초상은 투명 여백·어깨까지 포함한 32×32 전용 래스터다. 프레임 밖으로 한 화소라도
    // 새면 아래 우호도 바와 헤더 이름 영역을 침범하므로, 프레임 내부에서만 보이게 자른다.
    this.portraitMask = applyPortraitMask(this.scene, c, img, {
      x: frameX + 3,
      y: top + 3,
      width: PORTRAIT_FRAME_W - 6,
      height: PORTRAIT_FRAME_H - 6,
      radius: 6,
    });
    c.add(img);

    // NPC 대화에서는 호감도 막대와 상태 텍스트를 이름 바로 위에 유지한다.
    // 자기 캐릭터 표시처럼 NPC 데이터가 없는 경우에만 이 블록을 생략한다.
    let nameY = top + PORTRAIT_FRAME_H + NAME_GAP;
    if (showAffinity) {
      const aff = StoryStore.affinityOf(this.npcId);
      const tier = affinityTier(aff);
      const lab = AFFINITY_TIER_LABEL[tier];
      const pips = affinityPips(aff);
      const barY = top + PORTRAIT_FRAME_H + BAR_GAP;
      g.lineStyle(1, 0x284b68, 0.9);
      g.lineBetween(boxX + 12, barY - 6, boxX + boxW - 12, barY - 6);
      const pipW = 12, gap = 2, x0 = PORTRAIT_W / 2 - (11 * pipW + 10 * gap) / 2;
      this.affinityBar = { x: x0 - 4, y: this.contentTop + barY - 4, w: 11 * pipW + 10 * gap + 8, h: BAR_H + AFFINITY_GAP + AFFINITY_H + 8 };
      const bar = this.scene.add.graphics();
      for (let i = -5; i <= 5; i++) {
        const x = x0 + (i + 5) * (pipW + gap);
        const on = i === 0 ? true : i < 0 ? pips <= i : pips >= i;
        const col = i === 0 ? 0x9fb4c8 : i < 0 ? 0xe0605a : 0xffd257;
        bar.fillStyle(on ? col : 0x1b2a3a, on ? 1 : 0.9);
        bar.fillRoundedRect(x, barY, pipW, BAR_H, 2);
        bar.lineStyle(1, 0x06090f, 1); bar.strokeRoundedRect(x, barY, pipW, BAR_H, 2);
      }
      c.add(bar);
      const affinityText = this.scene.add.text(
        PORTRAIT_W / 2, barY + BAR_H + AFFINITY_GAP,
        `${lab.ko}  (${aff >= 0 ? '+' : ''}${aff.toFixed(2)})`,
        { fontFamily: FONT, fontSize: '11px', color: `#${lab.color.toString(16).padStart(6, '0')}` },
      ).setOrigin(0.5, 0);
      c.add(affinityText);
      nameY = barY + BAR_H + AFFINITY_GAP + AFFINITY_H + NAME_GAP;
    }

    // 초상화와 이름을 분리한다. 캡처의 작은 빨간 영역을 독립적인 이름
    // 플레이트로 사용하고, 초상화/호감도 텍스트와 겹치지 않게 배치한다.
    const nameX = PORTRAIT_W / 2 - (PORTRAIT_FRAME_W - 8) / 2;
    const nameW = PORTRAIT_FRAME_W - 8;
    g.fillStyle(0x08121c, 0.96);
    g.fillRoundedRect(nameX, nameY, nameW, NAME_H, 5);
    g.lineStyle(1, 0x356b8f, 0.9);
    g.strokeRoundedRect(nameX, nameY, nameW, NAME_H, 5);
    const t = this.scene.add.text(PORTRAIT_W / 2, nameY + NAME_H / 2, npc?.nameKo ?? this.npcId, {
      fontFamily: FONT, fontSize: '12px', color: COL.accent, fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add(t);
  }

  /** 254차 — 우호도가 바뀌었다: 초상 칸만 다시 그린다(막대 · 단계 글자) */
  private refreshPortrait(): void {
    const c = this.portraitC;
    if (!c) return;
    this.portraitMask?.destroy();
    this.portraitMask = undefined;
    c.removeAll(true);
    this.renderPortrait(c);
    applyScreenFixed(this);
  }

  // ═══════════ 타이핑 ═══════════
  /** 단락들을 차례로 찍고, 다 찍히면 선택지를 연다 */
  private play(paras: string[], rows: ChoiceRow[], _keepLog = false): void {
    // 267차 — 화면(인사 · 의뢰 · 답 · 진행)마다 **새 쪽**에서 시작한다. 옛 규칙(keepLog)은 앞 화면 글 아래에 이어 붙여
    //   앞 단락이 반쯤 잘린 채 위로 밀려 보였다(사용자 「앞에 내용이 겹쳐서 나옴 … 똑같이 그대로 점멸」).
    //   찍을 단락이 없으면(답 뒤 「계속 이야기하기」 메뉴) 지금 쪽을 그대로 둔다 — 마지막 단락을 쪽에 붙여 두고 선택지만 바꾼다.
    const list = paras.filter((p) => p.trim().length > 0);
    if (list.length > 0) { this.logDone = ''; this.setHintPage(false); }
    else if (this.typingPara) { this.typed = this.typingPara.length; this.commitPara(); }
    this.queue = list;
    this.pendingRows = rows;
    this.rows = [];
    this.cursor = 0;
    this.clearChoices();
    this.typingPara = ''; this.typed = 0;
    this.startNextPara();
  }

  private startNextPara(): void {
    this.typeTimer?.remove(); this.typeTimer = undefined;
    const next = this.queue.shift();
    if (next === undefined) { this.typingPara = ''; this.typed = 0; this.paintLog(); this.afterPara(); return; }
    // 187차 — 찍기 **전에** 번역한다. 부분 문자열은 사전에 없어서, 영어 설정에서 한국어가 한 글자씩
    //   찍히다가 끝에서야 영어로 바뀌었다(따옴표로 감싼 대사는 끝까지 한국어였다 — I18n 인용부호 규칙).
    // 257차 — 번역한 **뒤에** 문장마다 줄을 바꾸고(빈 줄) 문장 끝에서 쉬어 간다(사용자 「실제로 말할 때 저렇게 빠르게 말하지 않으니까」)
    const isHint = next.startsWith(HINT_PREFIX);
    const paced = paceSentences(t(isHint ? next.slice(HINT_PREFIX.length) : next));
    // 267차 — 주의 단락(빨간 글)은 제 쪽에 홀로 찍는다 — 앞뒤로 쪽을 넘긴다
    if (isHint || this.hintPage) this.logDone = '';
    this.setHintPage(isHint);
    // 267차 — 이 단락까지 넣으면 상자를 넘칠 때는 앞 단락을 지우고 **새 쪽**에서 잇는다(위로 밀어 반 잘린 줄을 남기지 않는다)
    if (this.logDone && this.logText) {
      this.logText.setText(`${this.logDone}\n\n${paced.text}`);
      if (this.logText.height > LOG_H) this.logDone = '';
    }
    // 267차 — 단락 하나가 상자보다 길면(서두 아홉 문장 · 긴 답) **문장 경계에서 쪽을 가른다** — 들어가는 데까지 찍고 ▼, 나머지는 다음 쪽.
    //   따옴표 단락은 쪽마다 따옴표를 닫고 다시 연다.
    let text = paced.text;
    let pauses = paced.pauses;
    if (this.logText) {
      const head = this.logDone ? `${this.logDone}\n\n` : '';
      const fits = (upTo: number): boolean => { this.logText!.setText(head + text.slice(0, upTo)); return this.logText!.height <= LOG_H; };
      if (!fits(text.length)) {
        // 자를 자리 = 문장 끝 쉼 + 빈 줄 경계(한 번 갈라 둔 나머지는 쉼 표시가 없어도 빈 줄로 문장이 나뉘어 있다)
        const blanks: number[] = [];
        for (let i = text.indexOf('\n\n'); i >= 0; i = text.indexOf('\n\n', i + 2)) blanks.push(i + 2);
        const cuts = [...new Set([...pauses, ...blanks])].filter((i) => i > 0 && i < text.length).sort((a, b) => a - b);
        let cut = -1;
        for (const i of cuts) { if (fits(i)) cut = i; else break; }
        if (cut > 0) {
          const quoted = text.startsWith('"') && text.endsWith('"');
          let rest = text.slice(cut).replace(/^\n+/, '');
          text = text.slice(0, cut).replace(/\n+$/, '');
          if (quoted) { text += '"'; rest = `"${rest}`; }
          pauses = pauses.filter((i) => i < text.length);
          this.queue.unshift((isHint ? HINT_PREFIX : '') + rest);
        }
      }
    }
    this.typingPara = text;
    this.typed = 0;
    this.pauses = new Set(pauses); this.holdTicks = 0;
    this.paintLog();
    this.typeTimer = this.scene.time.addEvent({
      delay: TYPE_MS, loop: true,
      callback: () => {
        if (this.holdTicks > 0) { this.holdTicks--; return; }   // 257차 — 문장 사이에서 쉰다
        const from = this.typed;
        this.typed = Math.min(this.typingPara.length, this.typed + CHARS_PER_TICK);
        for (let i = from; i < this.typed; i++) this.voice.say(this.typingPara.charAt(i));
        this.paintLog();
        if (this.typed >= this.typingPara.length) {
          this.typeTimer?.remove(); this.typeTimer = undefined;
          this.afterPara();
          return;
        }
        for (let i = from + 1; i <= this.typed; i++) {
          if (this.pauses.has(i)) { this.holdTicks = Math.round(SENTENCE_PAUSE_MS / TYPE_MS); break; }
        }
      },
    });
  }

  /** 267차 — 주의 쪽(빨간 글) 켜고 끄기 */
  private setHintPage(on: boolean): void {
    this.hintPage = on;
    this.logText?.setColor(on ? COL_CAUTION : COL.text);
  }

  private commitPara(): void {
    this.logDone += (this.logDone ? '\n\n' : '') + this.typingPara;
    this.typingPara = ''; this.typed = 0;
  }

  /** 한 단락이 다 찍혔다 — 남았으면 ▼, 아니면 선택지 */
  private afterPara(): void {
    if (this.queue.length > 0) { this.showCaret(true); return; }
    this.showCaret(false);
    if (this.rows.length === 0 && this.pendingRows.length > 0) {
      this.rows = this.pendingRows;
      this.renderChoiceRows();
    }
  }

  private paintLog(): void {
    const t = this.logText;
    if (!t) return;
    const head = this.logDone ? `${this.logDone}\n\n` : '';
    t.setText(head + this.typingPara.slice(0, this.typed));
    // 넘치면 **위로 민다** — 새 줄이 늘 박스 아래에 쓰인다(사용자 지시)
    const over = Math.max(0, t.height - LOG_H);
    this.logInner?.setY(-over);
  }

  private showCaret(on: boolean): void {
    this.caretTween?.stop();
    this.caretTween = undefined;
    this.caret?.setVisible(on).setAlpha(1);
    if (!on || !this.caret) return;
    this.caretTween = this.scene.tweens.add({
      targets: this.caret, alpha: 0.15, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  // ═══════════ 화면 ═══════════
  /** 인사 + 기본 선택지 3종 */
  private enterMenu(greet: boolean): void {
    this.view = 'menu';
    const paras: string[] = [];
    if (this.lastWorkMsg) { paras.push(this.lastWorkMsg); this.lastWorkMsg = ''; }
    const at = this.atDoor;
    if (greet && at === 'inside') {
      paras.push(`"${homeLineOf(this.npcId).talk[0]}"`);
    } else if (greet && at && at !== 'inside') {
      paras.push(DOOR_NARR[at][0], `"${doorLineOf(this.npcId, at)[0]}"`);
    } else if (greet) {
      const [ko] = NPC_IDLE[this.npcId] ?? (['…', '…'] as const);
      paras.push(`"${ko}"`);
    }
    const { completable, active, offer } = StoryStore.questsForNpc(this.npcId);
    const mark = completable[0] ? '보고할 일이 있습니다'
      : offer[0] ? '새 의뢰가 있습니다'
      : active[0] ? '진행 중인 의뢰가 있습니다' : undefined;

    const rows: ChoiceRow[] = [
      { label: '내가 도와줄 수 있는 게 있을까요?', hint: mark, action: () => this.enterQuest() },
    ];
    // 167차 — 이 사람과 이어지는 장면(발주자가 아니어도 — 정옥선 앞의 첫 고민 상담 등)
    for (const sc of StoryStore.sceneObjectivesFor(this.npcId)) rows.push(this.sceneRow(sc.questId, sc.objectiveIndex));
    for (const t of STORY_FIELD_TRIGGERS) {
      if (t.viaNpc !== this.npcId || t.regionId !== this.regionId || !StoryStore.canPerformAction(t.questId, t.objectiveIndex, t.phase)) continue;
      rows.push({ label: t.labelKo, hint: '이야기가 이어집니다', disabled: !this.onScene, action: () => this.requestScene({ kind: 'trigger', triggerId: t.id }) });
    }
    // 253차 — 물어보기: 아는 화제 중 이 사람에게 물을 것이 있을 때만
    const topics = StoryStore.inquiryTopics(this.npcId);
    if (topics.length) {
      rows.push({ label: '물어볼 게 있는데요.', hint: topics.some((e) => e.fresh > 0) ? '처음 듣는 이야기' : undefined, action: () => this.enterAsk(0) });
    }
    const shopId = this.npcShopId();
    if (shopId) rows.push({ label: '물건을 볼 수 있을까요?', action: () => this.onTrade?.(shopId) });
    const jobs = StoryStore.jobsOfNpc(this.npcId, this.regionId);
    if (jobs.length) {
      const can = jobs.filter((j) => !j.locked && j.remaining > 0).length;
      rows.push({ label: '일손이 필요하진 않으세요?', hint: can ? `지금 ${can}건` : '오늘은 없음', action: () => { this.view = 'jobs'; this.enterJobs(); } });
    }
    rows.push({ label: '나가기', action: () => this.onClose() });
    this.play(paras, rows, !greet);
  }

  /** 거래하는 사람인지 — 데이터에 상점이 걸려 있을 때만 '물건 보기'가 뜬다 */
  private npcShopId(): string | undefined {
    return getStoryNpc(this.npcId)?.shopId;
  }

  private enterQuest(): void {
    this.view = 'quest';
    const { completable, active, offer, refusedSub } = StoryStore.questsForNpc(this.npcId);
    if (completable[0]) this.playComplete(completable[0]);
    else if (active[0]) this.playActive(active[0]);
    else if (offer[0]) this.playOffer(offer[0]);
    else this.playIdle(refusedSub.length > 0);
  }

  /** 167차 — 장면으로 이어지는 행. 대화창은 닫히고 씬이 실제 필드에서 컷씬을 튼다 */
  private sceneRow(questId: string, objectiveIndex: number, withHead = true): ChoiceRow {
    const q = getStoryQuest(questId);
    const label = narrativeOf(questId)?.objectives?.[objectiveIndex] ?? q?.objectives[objectiveIndex]?.labelKo ?? '';
    // 254차 — 이 목표에 이 사람과의 이어지는 대화가 있으면 장면 대신 대화가 돈다(끝나면 목표가 닫힌다).
    //  진행 중 화면에서 들어오면 편 제목을 방금 찍었으니 다시 찍지 않는다(`withHead` false)
    const talk = StoryStore.objectiveTalk(questId, objectiveIndex, this.npcId);
    if (talk && q) {
      return { label, hint: '이야기가 이어집니다', action: () => this.enterTalk(talk, withHead ? [this.questHead(q)] : []) };
    }
    return {
      label,
      hint: this.onScene ? '이야기가 이어집니다' : '지금은 진행할 수 없습니다',
      disabled: !this.onScene,
      action: () => this.requestScene({ kind: 'objective', questId, objectiveIndex }),
    };
  }

  private requestScene(req: DialogueSceneRequest): void {
    const run = this.onScene;
    if (!run) return;
    this.onClose();
    run(req);
  }

  private backRow(): ChoiceRow {
    return { label: '다른 얘기를 좀…', half: true, action: () => this.enterMenu(false) };
  }
  private exitRow(): ChoiceRow {
    return { label: '나가기', half: true, action: () => this.onClose() };
  }

  private questHead(q: StoryQuestDef): string {
    return `[${q.titleKo}]`;
  }

  /**
   * 받는 자리. 274차 — 서두 나레이션(`intro` — 「영금정에서 보이는 방파제를 따라 … 걸었다.」)은 찍지 않는다.
   * 사용자 「그 부분은 단축키 J에서 … 배경 나레이션 정도로 확인할 수 있어야 하지 … 곧바로 대화가 이어지도록」.
   * 서두는 일지(J) 장 머리 · 편 상세가 맡는다. 대화창은 편 제목 다음 곧바로 의뢰인의 말이다.
   */
  private playOffer(q: StoryQuestDef): void {
    const n = narrativeOf(q.id);
    const paras = [this.questHead(q)];
    // 254차 — 받는 자리 대화가 있으면 표준 답 대신(하다 만 대화면 그 단계부터 — 시기 · 한 번뿐 알림은 처음일 때만)
    const offerTalk = StoryStore.offerTalk(q);
    if (offerTalk) {
      const fresh = StoryStore.talkResume(offerTalk) === offerTalk.start;
      const note = StoryStore.offerNoteKo(q);
      this.enterTalk(offerTalk, fresh && note ? [...paras, note] : paras);
      return;
    }
    if (n?.offer) paras.push(`"${n.offer}"`);
    else for (const [ko] of dialogueOf(q.id).offer) paras.push(`"${ko}"`);
    paras.push(...this.hoursHintParas(q, false));   // 267차 — 영업시간 주의(빨간 글)
    const note = StoryStore.offerNoteKo(q);
    if (note) paras.push(note);
    const rows = StoryStore.visibleChoices(q, 'offer').map((ch) => this.choiceRow(q, ch, 'offer'));
    rows.push(this.backRow(), this.exitRow());
    this.play(paras, rows, true);
  }

  private playActive(q: StoryQuestDef): void {
    const np = narrativeOf(q.id)?.progress;
    const paras = [this.questHead(q)];
    paras.push(`"${np ?? dialogueOf(q.id).progress[0]}"`);
    if (this.actionReply) { paras.push(`"${this.actionReply}"`); this.actionReply = ''; }
    // 267차 — 「[완료] … / - …」 나열 대신 말하듯(1인칭 산문). 다 했으면 그 문장이 「다시 말을 걸면 보고할 수 있다」까지 말한다
    paras.push(this.progressNarration(q));
    paras.push(...this.hoursHintParas(q, true));   // 267차 — 아직 안 산 가게 목표가 있으면 영업시간 주의
    const rows: ChoiceRow[] = [];
    const idx = q.objectives.findIndex((o, i) => o.manual && !StoryStore.objectiveDone(q, i));
    if (idx >= 0) {
      const objective = q.objectives[idx];
      if (objective.actionKey) {
        const spec = storyActionSpec(objective.actionKey);
        const completed = StoryStore.actionStep(q.id, idx);
        const taken = StoryStore.actionChoiceTaken(q.id, idx);
        const flowLabel: Record<string, string> = {
          'dialogue-crosscheck': '교차 검증 대화',
          'evidence-report': '증거 확인 방식',
          'field-gate': '현장 행동 방식',
          'branching-choice': '분기 선택',
          production: '제작 방식',
          delivery: '전달 방식',
        };
        // 모든 actionKey 계통에 세 가지 태도/전략을 제공한다. 단, 검사·현장·
        // 제작·운반은 이 선택만으로 행동 단계가 오르지 않고 실제 시스템 이벤트가
        // 별도로 필요하다. 대화·선택 계통만 선택 자체가 해당 단계의 성공이다.
        // 235차 — 이 단계가 의뢰인 앞에서 고르는 단계인지는 계통이 아니라 **단계의 출처**가 정한다.
        //  고르는 단계가 아니면(쿨러 · 면허 창 · 현장 지점 …) 고른 방식은 기록만 되고, 다음 할 일은 그 단계의 이야기 문장이다.
        const stepChoice = StoryStore.actionStepIsChoice(q.id, idx);
        const stepLine = spec.stepsKo[Math.min(completed, spec.stepsKo.length - 1)];
        // 254차 — 이 단계에 이어지는 대화가 있으면 「방식 고르기」 대신 그 대화(끝나면 단계가 오른다)
        const actTalk = StoryStore.actionTalk(q.id, idx);
        // 253차 — 조사 대화: 「방식 고르기」 대신 그 편의 물음. 지금 단계의 열쇠 물음을 물으면 단계가 오른다.
        if (actTalk) {
          rows.push({ label: stepLine, hint: '이야기가 이어집니다', action: () => this.enterTalk(actTalk) });
        } else if (StoryStore.inquiryDrivesAction(q.id, idx)) {
          if (!stepChoice) paras.push(`이어서 할 일 — ${stepLine}`);
          for (const n of StoryStore.inquiryQuestNodes(this.npcId, q.id, idx)) rows.push(this.inquiryRow(n, () => this.playActive(q)));
        } else for (const ch of spec.choices) rows.push({
          label: ch.labelKo,
          hint: taken
            ? `${flowLabel[spec.flow] ?? '행동'} 선택 완료 · ${completed}/${spec.stepsKo.length} — ${stepChoice ? '실제 행동을 진행하세요' : stepLine}`
            : `${flowLabel[spec.flow] ?? '행동'} ${completed}/${spec.stepsKo.length} · ${stepChoice ? objective.labelKo : stepLine}`,
          action: () => {
            const sceneRun = !!this.onScene && stepChoice;
            const selected = StoryStore.chooseAction(q.id, idx, ch.id, sceneRun);
            if (!selected) return;
            // 167차 — 대화·선택 계통은 선택 직후 **장면이 재생되고 그 끝에서** 단계가 오른다.
            if (sceneRun) { this.requestScene({ kind: 'action', questId: q.id, objectiveIndex: idx, choiceId: ch.id }); return; }
            this.actionReply = selected.replyKo;
            // 마지막 행동 직후 같은 대화창에서 제출하지 않는다. 준비 완료를
            // 확인한 뒤 닫고, NPC에게 다시 말을 걸어야 완료 선택지가 열린다.
            this.playActive(q);
          },
          disabled: taken,
        });
      } else if (StoryStore.isSceneObjective(objective)) {
        // 167차 — 구 `[이 자리에서 마무리]`(advanceManual 클릭) 폐기. 장면의 상대가 이 사람이면 장면 행,
        //  다른 사람이면 그 사람을 찾아가라고만 말한다.
        const entry = StoryStore.sceneEntryNpc(q, objective);
        if (entry === this.npcId) rows.push(this.sceneRow(q.id, idx, false));
        else paras.push(`${getStoryNpc(StoryStore.sceneNpcOf(q, objective))?.nameKo ?? '그 사람'}을(를) 직접 찾아가야 한다.`);
      }
    }
    rows.push(this.backRow(), this.exitRow());
    this.play(paras, rows, true);
  }

  /**
   * 보고하는 자리. 274차 — 한 일을 되짚는 나레이션(「…도, …도 끝냈다.」)을 앞에 찍지 않는다 — 곧바로 의뢰인의 말.
   * 무엇을 했는지는 일지(J) 목표 줄이 맡는다.
   */
  private playComplete(q: StoryQuestDef): void {
    const nd = narrativeOf(q.id)?.done;
    const paras = [this.questHead(q)];
    // 254차 — 끝내는 자리 대화(보상 답 · 결말을 대화가 고른다)
    const doneTalk = StoryStore.completeTalk(q);
    if (doneTalk) { this.enterTalk(doneTalk, paras); return; }
    paras.push(`"${nd ?? dialogueOf(q.id).done[0]}"`);
    const rows = StoryStore.visibleChoices(q, 'complete').map((ch) => this.choiceRow(q, ch, 'complete'));
    this.play(paras, rows, true);
  }

  private playIdle(refused: boolean): void {
    const paras = [refused
      ? '"…부탁할 일이 있긴 한데, 지금은 너한테 맡길 마음이 안 든다."\n사이가 틀어져 의뢰를 내주지 않습니다. 일감을 돕다 보면 마음이 풀립니다.'
      : '"지금은 딱히 맡길 일이 없다."\n실력을 더 쌓거나 다른 의뢰를 마치고 다시 오세요.'];
    this.play(paras, [this.backRow(), this.exitRow()], true);
  }

  private objectiveLines(q: StoryQuestDef): string {
    return q.objectives.map((o, i) => {
      const done = StoryStore.objectiveDone(q, i);
      const tgt = StoryStore.objectiveTarget(o);
      const cur = o.actionKey
        ? StoryStore.actionStep(q.id, i)
        : (StoryStore.progress(q.id)?.obj[i] ?? 0);
      const prog = o.actionKey || tgt > 1
        ? ` (${Math.min(cur, tgt).toLocaleString()}/${tgt.toLocaleString()}${o.actionKey && done ? ' · 준비 완료!' : ''})`
        : '';
      const label = narrativeOf(q.id)?.objectives?.[i] ?? o.labelKo;
      // 188차 — ✓ 글리프(§8-8) 대신 말머리. 끝난 줄은 [완료], 남은 줄은 들여쓴 그대로.
      return done ? `[완료] ${label}${prog}` : `- ${label}${prog}`;
    }).join('\n');
  }

  /**
   * 267차 — 진행 상황을 **말하듯**(1인칭 산문 — R4). 「사이소에서 저가 릴대를 사는 것은 끝냈다. 이제 테트라포드 틈에서 한 마리를 올리는 것이 남았다.」
   * 사용자 「대화하듯 진행 상황을 전개 · 설명하듯 notice 해야 하는데 … 텍스트로만 나열하듯 적혀지고 있는게 이질감」.
   * 영어는 문장 규칙이 한국어용이라 옛 목록을 그대로 쓴다.
   * 274차 — 진행 중 화면에서만 쓴다(보고하는 자리의 「…도 끝냈다」 되짚기는 뺐다 — 곧바로 의뢰인의 말).
   */
  private progressNarration(q: StoryQuestDef): string {
    if (getLocale() !== 'ko') {
      const list = this.objectiveLines(q);
      return StoryStore.allObjectivesDone(q) ? `${list}\n준비 완료! 대화를 닫고 다시 말을 걸면 제출할 수 있습니다.` : list;
    }
    const items: SpokenObjective[] = q.objectives.map((o, i) => {
      const tgt = StoryStore.objectiveTarget(o);
      const cur = o.actionKey ? StoryStore.actionStep(q.id, i) : (StoryStore.progress(q.id)?.obj[i] ?? 0);
      return { label: narrativeOf(q.id)?.objectives?.[i] ?? o.labelKo, done: StoryStore.objectiveDone(q, i), cur, target: tgt };
    });
    return spokenProgressKo(items);
  }

  /**
   * 267차 — 영업시간 주의(빨간 쪽). 나레이션 `hint`가 있으면 의뢰인의 말로, 없으면 「사는」 목표의 가게 시간표에서 1인칭 메모를 만든다.
   * 사용자 「퀘스트를 건네 받을 때 … 영업시간을 반드시 확인해야 할 거야 … 같은 단서 주기」(사이소 영수증이 밤 10시 뒤에 막혔다).
   * `onlyUndone` = 진행 중 화면 — 아직 안 산 목표가 있을 때만.
   */
  private hoursHintParas(q: StoryQuestDef, onlyUndone: boolean): string[] {
    const n = narrativeOf(q.id);
    const buyIdx = q.objectives.map((o, i) => (o.placeKey?.startsWith('buy:') ? i : -1)).filter((i) => i >= 0);
    const pending = buyIdx.filter((i) => !onlyUndone || !StoryStore.objectiveDone(q, i));
    if (n?.hint) return !onlyUndone || pending.length > 0 ? [`${HINT_PREFIX}"${n.hint}"`] : [];
    const kinds = new Set<BuildingKind>();
    for (const i of pending) {
      const itemId = (q.objectives[i].placeKey ?? '').slice(4);
      for (const kind of Object.keys(SHOP_CATALOG) as BuildingKind[]) {
        if (SHOP_CATALOG[kind].sells.some((e) => e.id === itemId)) kinds.add(kind);
      }
    }
    const out: string[] = [];
    for (const kind of kinds) {
      const h = BUILDING_HOURS[kind];
      if (h === 'always') continue;
      const label = BUILDING_LABEL[kind];
      out.push(`${HINT_PREFIX}(영업시간을 봐 둬야 한다. ${label}${particle(label, '은', '는')} 보통 ${h.open}시부터 ${h.close}시까지 연다.)`);
    }
    return out;
  }

  /**
   * 선택지 → 행. **미리보기 없음**(141차 — 보상은 고른 뒤 응답 문장과 결과 목록으로 드러난다).
   */
  private choiceRow(q: StoryQuestDef, ch: QuestChoiceDef, stage: 'offer' | 'complete'): ChoiceRow {
    return {
      label: ch.labelKo,
      action: () => {
        const ok = stage === 'offer' ? StoryStore.accept(q.id, ch.id) : StoryStore.complete(q.id, ch.id);
        // 234차 — 거절 까닭(가방 자리 부족 등)이 있으면 그것을 보여 준다
        if (!ok) { this.lastWorkMsg = StoryStore.lastRefusal ?? '지금은 진행할 수 없습니다.'; this.enterMenu(false); return; }
        if (stage === 'offer') StoryStore.emitActionSource('selection', `choice:${ch.id}`);
        const done = stage === 'complete';
        this.reply = {
          line: ch.replyKo,
          rewards: done ? StoryStore.lastRewardLines : [],
          declined: StoryStore.lastAction === 'declined',
          said: ch.labelKo,   // 267차 — 새 쪽 첫 줄에 내가 한 말을 되짚는다(앞 쪽이 사라지므로)
        };
        this.enterReply();
      },
    };
  }

  private enterReply(): void {
    this.view = 'reply';
    const r = this.reply!;
    // 253차 — 응답이 길어졌다: 빈 줄 단락마다 끊어 찍는다(▼)
    const paras = r.line.split('\n\n').map((p) => `"${p}"`);
    if (r.said && !r.said.startsWith('(')) paras.unshift(`나 — "${r.said}"`);
    if (r.declined) paras.push('의뢰를 받지 않았습니다.');
    // 258차 — 답의 효과(「이 답으로」) · 고르지 않은 답(「→ ???」)은 찍지 않는다 — 위키에서만 본다
    if (r.rewards.length) paras.push(`받은 것 — ${r.rewards.join(' · ')}`);
    // 274차 — 맺음 나레이션(`epilogue`)은 찍지 않는다 — 일지(J) 편 상세가 맡는다
    this.play(paras, [
      { label: '계속 이야기하기', action: () => { this.reply = null; this.enterMenu(false); } },
      this.exitRow(),
    ], true);
  }

  // ═══════════ 254차 이어지는 대화(갈래) ═══════════
  /** 이어지는 대화를 연다 — 하다 만 대화면 그 단계부터. `head` = 앞에 찍을 단락(편 제목 · 서두) */
  private enterTalk(talk: StoryTalkDef, head: string[] = []): void {
    this.view = 'talk';
    this.playTalkNode(talk, StoryStore.talkResume(talk), head);
    this.maybeTalkTour();
  }

  /** 한 단계 — 말하는 사람의 대사(단락마다 ▼) + 지금 보이는 말 */
  private playTalkNode(talk: StoryTalkDef, nodeId: string, head: string[] = []): void {
    const node = talkNode(talk, nodeId);
    if (!node) { this.talk = null; this.enterMenu(false); return; }
    this.talk = { def: talk, node: nodeId };
    const paras = [...head, ...this.speakerParas(node.lineKo, node.speaker ?? talk.npcId)];
    const rows: ChoiceRow[] = StoryStore.talkChoices(talk, nodeId).map((c) => ({
      label: c.labelKo, action: () => this.chooseTalk(talk, nodeId, c),
    }));
    this.play(paras, rows, true);
  }

  /**
   * 대사 → 단락. 대화 상대면 따옴표만 · 다른 사람이면 처음 말하는 단락에 이름 · 지문(`''`)이면 그대로.
   * 몸짓만 있는 단락(통째로 괄호)은 누가 말하든 따옴표 없이 지문으로 찍는다.
   */
  private speakerParas(line: string, speaker: string): string[] {
    const parts = line.split('\n\n');
    if (speaker === '') return parts;
    const name = speaker === this.npcId ? '' : getStoryNpc(speaker)?.nameKo ?? '';
    let named = false;
    return parts.map((p) => {
      if (/^\([^()]*\)$/.test(p.trim())) return p;
      if (name && !named) { named = true; return `${name} — "${p}"`; }
      return `"${p}"`;
    });
  }

  /** 말 하나를 고른다 — 내 말 · 움직인 마음을 찍고 상대의 반응(다음 단계)으로, 끝이면 그 자리의 결과로 */
  private chooseTalk(talk: StoryTalkDef, nodeId: string, c: TalkChoiceDef): void {
    const res = StoryStore.talkChoose(talk, nodeId, c.id);
    if (!res) return;
    const said = c.labelKo.startsWith('(') ? c.labelKo : `나 — "${c.labelKo}"`;
    const head = [said];
    // 258차 — 마음이 움직인 수치(「이 말로 — 이름 우호도 ±x」)는 찍지 않는다. 초상 아래 막대가 바뀌고, 말마다 효과는 위키에 있다
    if (res.moved.length) this.refreshPortrait();
    if (res.next) { this.playTalkNode(talk, res.next, head); return; }
    this.talkEnded(talk, res, head);
  }

  /** 대화가 끝났다 — 대화가 열린 자리마다 마무리(받음 · 미룸 · 목표 · 단계 · 마침과 결말) */
  private talkEnded(talk: StoryTalkDef, res: NonNullable<ReturnType<typeof StoryStore.talkChoose>>, head: string[]): void {
    this.talk = null;
    const q = getStoryQuest(talk.questId);
    const end = res.end ?? {};
    const paras = [...head];
    if (end.lineKo) paras.push(...this.speakerParas(end.lineKo, talk.npcId));
    if (!res.ok) {
      // 가방 자리 등으로 끝의 일이 막혔다 — 대화는 그 단계에 남아 다시 고를 수 있다
      paras.push(StoryStore.lastRefusal ?? '지금은 진행할 수 없습니다.');
      this.play(paras, [this.backRow(), this.exitRow()], true);
      return;
    }
    const rows: ChoiceRow[] = [{ label: '계속 이야기하기', action: () => { this.reply = null; this.enterMenu(false); } }, this.exitRow()];
    if (talk.at === 'offer') {
      if (StoryStore.lastAction === 'declined') paras.push('의뢰를 받지 않았습니다.');
      else {
        StoryStore.emitActionSource('selection', `talk:${talk.id}`);
        if (q) paras.push(...this.hoursHintParas(q, false));   // 267차 — 받는 자리 대화가 끝나면 영업시간 주의(빨간 글)
      }
    } else if (talk.at === 'objective' && q && talk.objectiveIndex !== undefined) {
      paras.push(`[완료] ${narrativeOf(q.id)?.objectives?.[talk.objectiveIndex] ?? q.objectives[talk.objectiveIndex]?.labelKo ?? ''}`);
    } else if (talk.at === 'action' && q && talk.objectiveIndex !== undefined) {
      const key = q.objectives[talk.objectiveIndex]?.actionKey;
      const steps = key ? storyActionSpec(key).stepsKo : [];
      const done = Math.max(0, StoryStore.actionStep(q.id, talk.objectiveIndex) - 1);
      if (steps[done]) paras.push(`[완료] ${steps[done]}`);
    } else if (talk.at === 'complete' && q) {
      if (StoryStore.lastRewardLines.length) paras.push(`받은 것 — ${StoryStore.lastRewardLines.join(' · ')}`);
      if (res.ending) paras.push(`결말 — 「${res.ending.titleKo}」`, res.ending.summaryKo);
      // 274차 — 맺음 나레이션은 일지(J)로(받는 자리 서두와 같은 까닭)
      this.refreshPortrait();
    }
    this.play(paras, rows, true);
  }

  /** 이어지는 대화를 처음 볼 때 — 체험 가이드(R11): 마음이 움직이는 막대 · 말이 남는다는 것 */
  private maybeTalkTour(): void {
    maybeStartTour(this.scene, () => ({
      id: 'dialogue_talk',
      anchor: () => this.panelBounds(),
      alive: () => this.active && this.view === 'talk',
      steps: [
        { text: '이 대화는 내가 고르는 말에 따라 흘러간다. 상대의 대답도, 마음도 달라진다. 초상 아래 막대를 보자.', target: () => this.affinityBarRect() },
        { text: '어떤 말은 그 자리에 없는 사람에게도 전해진다. 한 번 한 말은 되돌릴 수 없고, 뒤의 이야기가 그것을 기억한다.', target: () => this.choiceAreaRect() },
      ],
    }));
  }

  private affinityBarRect(): Phaser.Geom.Rectangle {
    const b = this.affinityBar;
    if (!b) return this.choiceAreaRect();
    return new Phaser.Geom.Rectangle(this.x + b.x, this.y + b.y, b.w, b.h);
  }

  // ═══════════ 253차 물어보기(조사 대화 · 킹덤컴 방식) ═══════════
  /** 화제 목록 — 이 사람에게 물을 것이 있는 아는 화제. 한 쪽 5개, 넘치면 쪽 넘김 */
  private enterAsk(page = 0, intro = true): void {
    this.view = 'ask';
    const entries = StoryStore.inquiryTopics(this.npcId);
    if (!entries.length) { this.enterMenu(false); return; }
    const PER = 5;
    const pages = Math.ceil(entries.length / PER);
    const p = Math.max(0, Math.min(page, pages - 1));
    const rows: ChoiceRow[] = entries.slice(p * PER, p * PER + PER).map((e) => {
      const kind = INQUIRY_KIND_LABEL[e.topic.kind].ko;
      return {
        label: e.topic.labelKo,
        hint: e.fresh > 0 ? `${kind} · 처음 듣는 이야기` : kind,
        dim: e.fresh === 0,
        action: () => this.enterTopic(e.topic.id, p),
      };
    });
    if (pages > 1) {
      rows.push({ label: '◀ 앞 화제', half: true, disabled: p === 0, action: () => this.enterAsk(p - 1, false) });
      rows.push({ label: '다음 화제 ▶', hint: `${p + 1}/${pages}`, half: true, disabled: p >= pages - 1, action: () => this.enterAsk(p + 1, false) });
    }
    rows.push(this.backRow(), this.exitRow());
    this.play(intro ? ['(무엇을 물어볼까.)'] : [], rows, true);
    this.maybeAskTour();
  }

  /** 화제 하나 — 물음이 하나뿐이고 처음이면 바로 묻고, 아니면 물음(꼬리 포함) 목록 */
  private enterTopic(topicId: string, page: number): void {
    const e = StoryStore.inquiryTopics(this.npcId).find((x) => x.topic.id === topicId);
    const back = (): void => this.enterAsk(page, false);
    if (!e) { back(); return; }
    if (e.nodes.length === 1 && !StoryStore.inquiryAsked(e.nodes[0].id)) { this.askNode(e.nodes[0], back); return; }
    const rows = e.nodes.map((n) => this.inquiryRow(n, back));
    rows.push({ label: '다른 걸 여쭤볼게요.', half: true, action: back }, this.exitRow());
    // 노트 한 줄(주인공이 아는 것) — 괄호 혼잣말은 번역 사전이 통째로 못 찾으니 안쪽을 먼저 번역한다
    this.play([`(${t(e.topic.noteKo)})`], rows, true);
  }

  /** 물음 한 줄 — 들은 물음은 흐리게 · 꼬리 질문 표시 */
  private inquiryRow(n: InquiryNodeDef, back: () => void): ChoiceRow {
    const asked = StoryStore.inquiryAsked(n.id);
    return { label: n.askKo, hint: asked ? '들은 이야기' : undefined, dim: asked, action: () => this.askNode(n, back) };
  }

  /** 묻고 답을 듣는다 — 새로 안 화제 · 조사 단계를 알리고, 꼬리 질문을 잇는다 */
  private askNode(n: InquiryNodeDef, back: () => void): void {
    const res = StoryStore.inquiryAsk(n.id);
    if (!res) return;
    this.view = 'ask';
    const paras = n.answerKo.split('\n\n').map((p) => `"${p}"`);
    if (res.learned.length) paras.push(`알게 된 것 — ${res.learned.map((x) => x.labelKo).join(' · ')}`);
    const a = n.effect?.action;
    if (res.advanced && a) {
      const q = getStoryQuest(a.questId); const key = q?.objectives[a.objectiveIndex]?.actionKey;
      const line = key ? storyActionSpec(key).stepsKo[a.step] : undefined;
      if (q && line) paras.push(`[완료] ${line}`);
    }
    const rows = StoryStore.inquiryFollowUps(n.id).map((f) => this.inquiryRow(f, back));
    rows.push({ label: '다른 걸 여쭤볼게요.', half: true, action: back }, this.exitRow());
    this.play(paras, rows, true);
  }

  /** 물어보기를 처음 열 때 — 체험 가이드(R11: 창에 조작 안내 문구를 박지 않는다) */
  private maybeAskTour(): void {
    maybeStartTour(this.scene, () => ({
      id: 'dialogue_ask',
      anchor: () => this.panelBounds(),
      alive: () => this.active && this.view === 'ask',
      steps: [
        { text: '알고 있는 사람 · 곳 · 물건 · 낱말 · 단서다. 하나를 골라 물어보면 답 속에서 새 이야깃거리가 열린다.', target: () => this.choiceAreaRect() },
        { text: '같은 이야기라도 사람마다 아는 것이 다르다. 다른 사람에게도 물어보자. 이미 들은 것은 흐리게 남는다.', target: () => this.choiceAreaRect() },
      ],
    }));
  }

  private choiceAreaRect(): Phaser.Geom.Rectangle {
    const top = this.y + this.contentTop + LOG_H + 20;
    return new Phaser.Geom.Rectangle(this.x + TEXT_X - 4, top, TEXT_W + 8, this.y + this.panelH - 8 - top);
  }

  /** 일감(품삯) — 품삯은 우호도 배율이 곱해진 **지급될 값** 그대로 표기 */
  private enterJobs(): void {
    const paras = ['"손이 모자랄 때 부르는 일이다. 사이가 좋으면 품삯을 더 쳐주고, 틀어지면 일을 주지 않는다."'];
    const rows: ChoiceRow[] = [];
    for (const { job, remaining, locked } of StoryStore.jobsOfNpc(this.npcId, this.regionId)) {
      const can = !locked && remaining > 0;
      const wage = StoryStore.jobWage(job).toLocaleString();
      rows.push({
        label: `${job.nameKo} — ${wage}원 · 오늘 ${remaining}/${job.perDay}회`,
        hint: locked ?? (remaining > 0 ? job.descKo : '오늘 몫은 다 했습니다'),
        disabled: !can,
        action: () => {
          const res = StoryStore.work(job.id);
          this.lastWorkMsg = res.ok
            ? `${res.flavorKo ?? ''} (품삯 ${(res.wage ?? 0).toLocaleString()}원)`
            : `일할 수 없습니다 — ${res.reason ?? ''}`;
          this.enterJobs();
        },
      });
    }
    rows.push(this.backRow(), this.exitRow());
    const head: string[] = [];
    if (this.lastWorkMsg) { head.push(this.lastWorkMsg); this.lastWorkMsg = ''; }
    this.play([...head, ...paras], rows, true);
  }

  // ═══════════ 선택지 렌더 ═══════════
  private clearChoices(): void {
    this.choiceC?.removeAll(true);
    this.rowObjs = [];
  }

  private renderChoiceRows(): void {
    const c = this.choiceC;
    if (!c) return;
    this.clearChoices();
    const n = this.rows.length;
    if (n === 0) return;
    // 253차 — 반 폭 행이 둘 이어지면 한 줄에 나눈다(「다른 얘기를 좀…」 · 「나가기」)
    const lines: number[][] = [];
    for (let i = 0; i < n; i++) {
      if (this.rows[i].half && this.rows[i + 1]?.half) { lines.push([i, i + 1]); i++; } else lines.push([i]);
    }
    const top = LOG_H + 26;
    const bottom = this.panelH - this.contentTop - 10;
    const step = Math.max(24, Math.min(CHOICE_H + 4, Math.floor((bottom - top) / lines.length)));
    const rh = Math.min(CHOICE_H, step - 4);
    const GAP = 8;
    if (this.cursor >= n) this.cursor = 0;
    if (this.rows[this.cursor]?.disabled) this.moveCursorSilently();

    lines.forEach((line, li) => {
      const y = top + step / 2 + li * step;
      const w = line.length === 2 ? Math.floor((TEXT_W - GAP) / 2) : TEXT_W;
      line.forEach((i, k) => {
        const row = this.rows[i];
        const x = TEXT_X + k * (w + GAP);
        const g = this.scene.add.graphics();
        // 오른쪽 작은 글씨를 먼저 재고 그만큼 답 글자 폭을 남긴다(긴 답이 말줄임으로 잘리지 않게)
        let h: Phaser.GameObjects.Text | undefined;
        if (row.hint) {
          h = this.scene.add.text(x + w - 12, y, row.hint, { fontFamily: FONT, fontSize: '11px', color: COL.hint }).setOrigin(1, 0.5);
          clampTextWidth(h, Math.floor(w * 0.4));
        }
        const t = this.scene.add.text(x + 14, y, row.label, { fontFamily: FONT, fontSize: '15px', color: COL.text }).setOrigin(0, 0.5);
        clampTextWidth(t, w - 28 - (h ? h.width + 14 : 0));
        const hit = this.scene.add.rectangle(x + w / 2, y, w, step - 2, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: !row.disabled });
        hit.on('pointerover', () => { if (!row.disabled) { this.cursor = i; this.paintCursor(); } });
        hit.on('pointerdown', () => { if (!row.disabled) { playUiClick(); row.action(); } });
        c.add([g, t, hit]); if (h) c.add(h);
        this.rowObjs.push({ g, t, h, row, cy: y, x, w, rh });
      });
    });
    this.paintCursor();
    applyScreenFixed(this);
  }

  private moveCursorSilently(): void {
    for (let i = 0; i < this.rows.length; i++) {
      if (!this.rows[i].disabled) { this.cursor = i; return; }
    }
  }

  private paintCursor(): void {
    this.rowObjs.forEach((o, i) => {
      const sel = i === this.cursor;
      o.g.clear();
      o.g.fillStyle(sel ? 0x1b3a52 : 0x0e1c2a, sel ? 0.95 : 0.7);
      o.g.fillRect(o.x, o.cy - o.rh / 2, o.w, o.rh);
      if (sel) { o.g.fillStyle(0xd8b25f, 1); o.g.fillRect(o.x, o.cy - o.rh / 2, 3, o.rh); }
      o.t.setColor(o.row.disabled ? '#5a6a78' : sel ? '#ffffff' : o.row.dim ? COL.dim : COL.text);
    });
  }
}
