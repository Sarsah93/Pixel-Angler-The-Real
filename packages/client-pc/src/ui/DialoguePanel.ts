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
 * 모달(dim) · depth 940 — ConfirmDialog(950) 아래, 일반 팝업(800대) 위.
 */

import Phaser from 'phaser';
import {
  getStoryNpc, getStoryQuest, characterOf, affinityTier, AFFINITY_TIER_LABEL, affinityPips, narrativeOf,
  type StoryQuestDef, type QuestChoiceDef,
} from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { StoryStore } from '../store/StoryStore.js';
import { storyActionSpec } from '../store/StoryActionRegistry.js';
import { dialogueOf, NPC_IDLE } from '../data/StoryDialogue.js';
import { STORY_FIELD_TRIGGERS } from '../data/StoryNpcs.js';
import { clampTextWidth } from './TextFit.js';
import { ensureFacePortrait } from './CharacterSprite.js';
import { applyScreenFixed } from './DraggablePanel.js';
import { applyPortraitMask, type PortraitMaskHandle } from './PortraitMask.js';
import { PORTRAIT_LAYOUT } from './PortraitLayout.js';

const W = 1040;
const H = 372;
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
/** 대사 로그 뷰포트 높이 (≈ 5줄) */
const LOG_H = 152;
const CHOICE_H = 32;

/** 타이핑 속도 — ms마다 CHARS_PER_TICK자 */
const TYPE_MS = 18;
const CHARS_PER_TICK = 1;

const COL = {
  text: '#e8f4fd', dim: '#8fa6bd', accent: '#ffe9a0', ok: '#7fe0b0',
  warn: '#ffb45a', hint: '#7f95aa', narr: '#d6c9a8',
};

interface ChoiceRow { label: string; hint?: string; action: () => void; disabled?: boolean }

/**
 * 167차 — 대화창이 씬에 넘기는 장면 요청. 대화창은 닫히고, 씬이 실제 필드 위에서 컷씬을 재생한 뒤
 * 목표를 닫는다. **클릭이 목표를 닫는 경로는 더 이상 없다.**
 */
export type DialogueSceneRequest =
  | { kind: 'objective'; questId: string; objectiveIndex: number }
  | { kind: 'action'; questId: string; objectiveIndex: number; choiceId: string }
  /** 현장 트리거 중 `viaNpc`로 이 사람에게 말을 걸어 진행하는 단계 */
  | { kind: 'trigger'; triggerId: string };

/** 화면 상태 — 인사 → 기본 선택 → 퀘스트 → 응답 → 일감 */
type View = 'menu' | 'quest' | 'reply' | 'jobs';

export class DialoguePanel extends DraggablePanel {
  private bodyC?: Phaser.GameObjects.Container;   // ⚠ `body`는 Phaser Container 예약 프로퍼티(44차 함정)
  private readonly npcId: string;
  private readonly onClose: () => void;
  private readonly regionId: string;
  private readonly onTrade?: (shopId: string) => void;
  private readonly onScene?: (req: DialogueSceneRequest) => void;
  private view: View = 'menu';

  /** 지금 화면 — 검증 하네스가 읽는다 */
  get currentView(): View { return this.view; }

  /** 응답 화면 (141차) — 보상은 고른 뒤에만 드러난다 */
  private reply: { line: string; lines: string[]; rewards: string[]; others: string[]; epilogue?: string; declined?: boolean } | null = null;

  // ── 타이핑 로그 ──────────────────────────────────
  /** 이미 다 찍힌 글(단락 사이 빈 줄 포함) */
  private logDone = '';
  /** 지금 찍고 있는 단락 */
  private typingPara = '';
  /** 그 단락에서 찍은 글자 수 */
  private typed = 0;
  /** 아직 안 찍은 단락들 */
  private queue: string[] = [];
  private typeTimer?: Phaser.Time.TimerEvent;
  private logText?: Phaser.GameObjects.Text;
  private logInner?: Phaser.GameObjects.Container;
  private logMask?: Phaser.GameObjects.Graphics;
  private portraitMask?: PortraitMaskHandle;
  private caret?: Phaser.GameObjects.Graphics;
  private caretTween?: Phaser.Tweens.Tween;
  private lastPanelX = NaN;
  private lastPanelY = NaN;
  private readonly postUpdate: () => void;

  // ── 선택지 ───────────────────────────────────────
  private rows: ChoiceRow[] = [];
  private pendingRows: ChoiceRow[] = [];
  private cursor = 0;
  private rowObjs: { g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text; h?: Phaser.GameObjects.Text; row: ChoiceRow; cy: number }[] = [];
  private choiceC?: Phaser.GameObjects.Container;
  private lastWorkMsg = '';
  private actionReply = '';
  private readonly keyHandler: (ev: KeyboardEvent) => void;
  private readonly clickHandler: () => void;

  constructor(
    scene: Phaser.Scene, npcId: string, onClose: () => void,
    regionId = '', onTrade?: (shopId: string) => void, onScene?: (req: DialogueSceneRequest) => void,
  ) {
    const npc = getStoryNpc(npcId);
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: GAME_HEIGHT - H - 18,
      width: W, height: H, title: `${npc?.nameKo ?? npcId}  ·  ${npc?.roleKo ?? ''}`, onClose, dim: true, depth: 940,
    });
    this.npcId = npcId;
    this.onClose = onClose;
    this.regionId = regionId;
    this.onTrade = onTrade;
    this.onScene = onScene;
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
    this.typeTimer?.remove();
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
    if (this.busy) {
      if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); this.advance(); }
      return;
    }
    if (this.rows.length === 0) return;
    if (ev.code === 'ArrowUp') { this.moveCursor(-1); ev.preventDefault(); }
    else if (ev.code === 'ArrowDown') { this.moveCursor(1); ev.preventDefault(); }
    else if (ev.code === 'Enter' || ev.code === 'Space') {
      const r = this.rows[this.cursor];
      if (r && !r.disabled) { ev.preventDefault(); r.action(); }
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

    this.renderPortrait(c);

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

    const key = ensureFacePortrait(this.scene, characterOf(this.npcId), FACE_SCALE);
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

  // ═══════════ 타이핑 ═══════════
  /** 단락들을 차례로 찍고, 다 찍히면 선택지를 연다 */
  private play(paras: string[], rows: ChoiceRow[], keepLog = false): void {
    if (!keepLog) { this.logDone = ''; }
    this.queue = paras.filter((p) => p.trim().length > 0);
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
    this.typingPara = next;
    this.typed = 0;
    this.paintLog();
    this.typeTimer = this.scene.time.addEvent({
      delay: TYPE_MS, loop: true,
      callback: () => {
        this.typed = Math.min(this.typingPara.length, this.typed + CHARS_PER_TICK);
        this.paintLog();
        if (this.typed >= this.typingPara.length) {
          this.typeTimer?.remove(); this.typeTimer = undefined;
          this.afterPara();
        }
      },
    });
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
    if (greet) {
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
  private sceneRow(questId: string, objectiveIndex: number): ChoiceRow {
    const q = getStoryQuest(questId);
    const label = narrativeOf(questId)?.objectives?.[objectiveIndex] ?? q?.objectives[objectiveIndex]?.labelKo ?? '';
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
    return { label: '다른 얘기를 좀…', action: () => this.enterMenu(false) };
  }
  private exitRow(): ChoiceRow {
    return { label: '나가기', action: () => this.onClose() };
  }

  private questHead(q: StoryQuestDef): string {
    return `[${q.titleKo}]`;
  }

  private playOffer(q: StoryQuestDef): void {
    const n = narrativeOf(q.id);
    const paras = [this.questHead(q)];
    if (n?.intro) paras.push(n.intro);
    if (n?.offer) paras.push(`"${n.offer}"`);
    else for (const [ko] of dialogueOf(q.id).offer) paras.push(`"${ko}"`);
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
    paras.push(this.objectiveLines(q));
    const rows: ChoiceRow[] = [];
    const idx = q.objectives.findIndex((o, i) => o.manual && !StoryStore.objectiveDone(q, i));
    if (idx < 0) paras.push('준비 완료! 대화를 닫고 다시 말을 걸면 제출할 수 있습니다.');
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
        for (const ch of spec.choices) rows.push({
          label: ch.labelKo,
          hint: taken
            ? `${flowLabel[spec.flow] ?? '행동'} 선택 완료 · ${completed}/${spec.stepsKo.length} — 실제 행동을 진행하세요`
            : `${flowLabel[spec.flow] ?? '행동'} ${completed}/${spec.stepsKo.length} · ${objective.labelKo}`,
          action: () => {
            const sceneRun = !!this.onScene && (spec.source === 'dialogue' || spec.source === 'selection');
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
        if (entry === this.npcId) rows.push(this.sceneRow(q.id, idx));
        else paras.push(`${getStoryNpc(StoryStore.sceneNpcOf(q, objective))?.nameKo ?? '그 사람'}을(를) 직접 찾아가야 한다.`);
      }
    }
    rows.push(this.backRow(), this.exitRow());
    this.play(paras, rows, true);
  }

  private playComplete(q: StoryQuestDef): void {
    const nd = narrativeOf(q.id)?.done;
    const paras = [this.questHead(q)];
    paras.push(this.objectiveLines(q));
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
      return `${done ? '✓' : '·'} ${label}${prog}`;
    }).join('\n');
  }

  /**
   * 선택지 → 행. **미리보기 없음**(141차 — 보상은 고른 뒤 응답 문장과 결과 목록으로 드러난다).
   */
  private choiceRow(q: StoryQuestDef, ch: QuestChoiceDef, stage: 'offer' | 'complete'): ChoiceRow {
    return {
      label: ch.labelKo,
      action: () => {
        const ok = stage === 'offer' ? StoryStore.accept(q.id, ch.id) : StoryStore.complete(q.id, ch.id);
        if (!ok) { this.lastWorkMsg = '지금은 진행할 수 없습니다.'; this.enterMenu(false); return; }
        if (stage === 'offer') StoryStore.emitActionSource('selection', `choice:${ch.id}`);
        const done = stage === 'complete';
        this.reply = {
          line: ch.replyKo,
          lines: done ? StoryStore.lastOutcomeLines : [],
          rewards: done ? StoryStore.lastRewardLines : [],
          others: done ? StoryStore.otherChoices(q, 'complete', ch.id).map((o) => o.label) : [],
          epilogue: done ? narrativeOf(q.id)?.epilogue : undefined,
          declined: StoryStore.lastAction === 'declined',
        };
        this.enterReply();
      },
    };
  }

  private enterReply(): void {
    this.view = 'reply';
    const r = this.reply!;
    const paras = [`"${r.line}"`];
    if (r.declined) paras.push('의뢰를 받지 않았습니다.');
    if (r.rewards.length) paras.push(`받은 것 — ${r.rewards.join(' · ')}`);
    if (r.lines.length) paras.push(`이 답으로 — ${r.lines.join(' · ')}`);
    if (r.others.length) paras.push(`고르지 않은 답 — ${r.others.map((o) => `"${o}" → ???`).join('   ')}`);
    if (r.epilogue) paras.push(r.epilogue);
    this.play(paras, [
      { label: '계속 이야기하기', action: () => { this.reply = null; this.enterMenu(false); } },
      this.exitRow(),
    ], true);
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
    const top = LOG_H + 26;
    const bottom = this.panelH - this.contentTop - 10;
    const step = Math.max(24, Math.min(CHOICE_H + 4, Math.floor((bottom - top) / n)));
    let y = top + step / 2;
    if (this.cursor >= n) this.cursor = 0;
    if (this.rows[this.cursor]?.disabled) this.moveCursorSilently();

    this.rows.forEach((row, i) => {
      const g = this.scene.add.graphics();
      const t = this.scene.add.text(TEXT_X + 14, y, row.label, {
        fontFamily: FONT, fontSize: '15px', color: COL.text,
      }).setOrigin(0, 0.5);
      const maxLabel = row.hint ? Math.floor(TEXT_W * 0.62) : TEXT_W - 28;
      clampTextWidth(t, maxLabel);
      let h: Phaser.GameObjects.Text | undefined;
      if (row.hint) {
        h = this.scene.add.text(TEXT_X + TEXT_W - 12, y, row.hint, {
          fontFamily: FONT, fontSize: '11px', color: COL.hint,
        }).setOrigin(1, 0.5);
        clampTextWidth(h, TEXT_W - maxLabel - 34);
      }
      const hit = this.scene.add.rectangle(TEXT_X + TEXT_W / 2, y, TEXT_W, step - 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: !row.disabled });
      hit.on('pointerover', () => { if (!row.disabled) { this.cursor = i; this.paintCursor(); } });
      hit.on('pointerdown', () => { if (!row.disabled) row.action(); });
      c.add([g, t, hit]); if (h) c.add(h);
      this.rowObjs.push({ g, t, h, row, cy: y });
      y += step;
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
      o.g.fillRect(TEXT_X, o.cy - CHOICE_H / 2, TEXT_W, CHOICE_H);
      if (sel) { o.g.fillStyle(0xd8b25f, 1); o.g.fillRect(TEXT_X, o.cy - CHOICE_H / 2, 3, CHOICE_H); }
      o.t.setColor(o.row.disabled ? '#5a6a78' : sel ? '#ffffff' : COL.text);
    });
  }
}
