/**
 * @file CharacterCreateScene.ts
 * @description 캐릭터 만들기 (138차 신설 · 139차 UI 재정비) — 새 게임 시작 직후 1회.
 *
 * 바닐라 베이스(나체 + 언더웨어) 위에 외형을 고르고, 확정 시 **스타터 한 벌**(상의·하의·신발)을
 * 장착한 상태로 게임에 들어간다. 즉 옷은 처음부터 "입혀진 장비"이지 몸의 일부가 아니다.
 *
 * ⚠ 미리보기는 `CharacterSprite`가 굽는 **실제 게임 시트**를 그대로 쓴다 — 여기서 예쁘게 보이던 것이
 *   인게임에서 달라지는 일이 없도록(별도 프리뷰 렌더러 금지).
 *
 * UI 문법은 HUD와 통일한다(`HudPanelStyle.paintHudPanel` / `paintHudSlot`).
 * 색 항목은 숫자(`3 / 10`)가 아니라 **실제 색 견본**을 깔고 직접 고르게 한다 —
 * 픽셀 팔레트는 이름이 없으므로 숫자로는 무엇을 고르는지 알 수 없다.
 */
import Phaser from 'phaser';
import {
  CLOTH_COLORS, EYE_COLORS, FACE_SHAPES, HAIR_COLORS, MOUTH_STYLES, SKIN_TONES,
  bareOutfit, defaultAppearance, starterOutfit,
  type CharAppearance, type CharConfig, type CharDir, type CharSex,
  type FaceShape, type HairStyle, type MouthStyle,
  MP_PROGRESS_KO, validateCharacterName,
} from '@tra/core';
import { TextInput } from '../ui/TextInput.js';
import { GameState } from '../store/GameState.js';
import { TUNING } from '@tra/core';
import { MultiplayerClient } from '../net/MultiplayerClient.js';
import { ensureCharSheet, charFrameName, CHAR_WALK_MS, WALK_SEQ } from '../ui/CharacterSprite.js';
import { paintHudPanel, paintHudSlot } from '../ui/HudPanelStyle.js';
import { clampTextWidth } from '../ui/TextFit.js';

const W = 1280, H = 720;
const PREVIEW_SCALE = 10;

/** 프리뷰 회전 순서 — ◀ = 이 순서로 +1(화면상 왼쪽으로 돌아감) · ▶ = −1 */
const TURN_ORDER: CharDir[] = ['down', 'left', 'up', 'right'];
const DIR_KO: Record<CharDir, string> = {
  down: '정면', left: '왼쪽', up: '뒷면', right: '오른쪽',
};

/** 프리뷰 동작 — 구현된 모션이 대기/걷기뿐이라 달리기는 같은 걷기 프레임을 빠르게 돌린다 */
type PreviewMotion = 'idle' | 'walk' | 'run';
const MOTION_KO: Record<PreviewMotion, string> = { idle: '정지', walk: '걷기', run: '달리기' };

const FONT = '"Noto Sans KR", sans-serif';
const COL = {
  accent: '#ffe9a0',
  text: '#cfe0ef',
  dim: '#8fa6bd',
  muted: '#6f8399',
  ok: '#a8e6b0',
  warn: '#e8a8a8',
  /** 생성 실패 — 사용자 지정 '빨간 폰트' */
  fail: '#ff5c4d',
};

/** 좌/우 열 지오메트리 — 라벨 104px + 조작 240px */
const COL_W = 344, CTRL_DX = 104, CTRL_W = 240;
const ROW_H = 38, SEC_GAP = 16, SEC_HEAD = 28;

/** 성별별 머리 모양 후보 — 전부 허용하되 기본 정렬만 다르게 둔다 */
const STYLES_M: HairStyle[] = ['short', 'buzz', 'curly', 'topknot', 'bob', 'pony', 'long', 'braid'];
const STYLES_F: HairStyle[] = ['bob', 'pony', 'long', 'braid', 'curly', 'short', 'topknot', 'buzz'];

const MOUTH_KO: Record<MouthStyle, string> = {
  smile: '미소', neutral: '담담', small: '작은 입', open: '활짝',
};
const FACE_KO: Record<FaceShape, string> = {
  oval: '계란형', round: '둥근형', square: '사각형',
};
const STYLE_KO: Record<HairStyle, string> = {
  short: '단발 컷', bob: '보브', pony: '포니테일', long: '긴 머리',
  buzz: '짧은 스포츠', curly: '곱슬', braid: '땋은 머리', topknot: '상투 번',
};

type RowKind = 'cycle' | 'swatch';

interface OptionRow {
  key: string;
  label: string;
  kind: RowKind;
  /** 열 (0 = 왼쪽, 1 = 오른쪽) */
  col: 0 | 1;
  /** 이 행부터 시작하는 섹션 제목 (없으면 이어지는 행) */
  section?: string;
  /** cycle 전용 */
  value?: () => string;
  prev?: () => void;
  next?: () => void;
  /** swatch 전용 */
  palette?: number[];
  /** 팔레트 앞에 '없음' 칸을 둔다 */
  none?: boolean;
  get?: () => number;
  set?: (i: number) => void;
}

interface RowView {
  row: OptionRow;
  x: number;
  y: number;
  label: Phaser.GameObjects.Text;
  value?: Phaser.GameObjects.Text;
  arrowL?: Phaser.GameObjects.Text;
  arrowR?: Phaser.GameObjects.Text;
  cells: Phaser.GameObjects.Zone[];
  cellW: number;
}

export class CharacterCreateScene extends Phaser.Scene {
  private look!: CharAppearance;
  private nickname = '한여름';
  private rows: OptionRow[] = [];
  private views: RowView[] = [];
  private cursor = 0;
  private starterShirt = 0;
  private starterPants = 1;

  private chromeG!: Phaser.GameObjects.Graphics;
  private rowG!: Phaser.GameObjects.Graphics;
  private btnG!: Phaser.GameObjects.Graphics;

  private previewImg?: Phaser.GameObjects.Image;
  private captionText?: Phaser.GameObjects.Text;
  /** 프리뷰 방향 라벨 (◀ ▶ 사이) */
  private dirLabel?: Phaser.GameObjects.Text;
  /** 스테이지 버튼(회전 2 + 동작 3) — 푸터 버튼과 별도 페인터 */
  private stageBtns: { cx: number; cy: number; w: number; h: number; label: string; motion?: PreviewMotion; fn: () => void }[] = [];
  private stageG!: Phaser.GameObjects.Graphics;
  private stageHover = -1;
  private hintText?: Phaser.GameObjects.Text;

  private buttons: { cx: number; cy: number; w: number; h: number; label: string; color: string; fn: () => void }[] = [];
  private hoverBtn = -1;

  private editingName = false;
  /** 한글(IME) 입력용 숨김 DOM 입력 (150차) — 열려 있으면 이름 편집 중 */
  private nameInput?: TextInput;
  private previewDir: CharDir = 'down';
  /** 프리뷰 동작 상태 (144차 — 정지/걷기/달리기) */
  private previewMotion: PreviewMotion = 'idle';
  private previewPhase = 0;
  private previewTimer = 0;
  private starting = false;
  /** 생성 진행 상태 한 줄 (143차 — 중복 검사 → 통과 → 생성 → 접속) */
  private progressText?: Phaser.GameObjects.Text;

  constructor() { super({ key: 'CharacterCreateScene' }); }

  create(): void {
    this.starting = false;
    this.editingName = false;
    this.cursor = 0;
    this.hoverBtn = -1;
    this.views = [];
    this.stageBtns = [];
    this.stageHover = -1;
    this.previewDir = 'down';
    this.previewMotion = 'idle';
    this.previewPhase = 0;
    this.previewTimer = 0;
    this.buttons = [];
    this.look = defaultAppearance('m');
    this.starterShirt = 0;
    this.starterPants = 1;
    this.nickname = GameState.player.nickname || '한여름';
    this.cameras.main.setBackgroundColor('#0b1420');
    this.cameras.main.fadeIn(260, 1, 8, 18);

    this.drawBackdrop();
    this.buildRows();
    this.layoutRows();
    this.drawPreviewStage();
    this.drawFooter();
    this.refresh();

    this.input.keyboard?.on('keydown', this.onKey, this);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown', this.onKey, this);
      this.nameInput?.close();
      this.nameInput = undefined;
    });
  }

  // ── 배경 · 패널 ─────────────────────────────────────
  private drawBackdrop(): void {
    const bg = this.add.graphics();
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        Math.round(9 + t * 11), Math.round(17 + t * 23), Math.round(28 + t * 36)), 1);
      bg.fillRect(0, (H / 16) * i, W, H / 16 + 1);
    }
    // 배경 도트 그레인 (2px — 맵 격자와 같은 입자)
    bg.fillStyle(0xffffff, 0.02);
    for (let y = 0; y < H; y += 8) for (let x = ((y / 8) % 2) * 4; x < W; x += 8) bg.fillRect(x, y, 2, 2);

    this.chromeG = this.add.graphics();
    const g = this.chromeG;
    paintHudPanel(g, 40, 88, 430, 540, { headerH: 26 });
    paintHudPanel(g, 486, 88, 754, 540, { headerH: 26 });
    paintHudPanel(g, 40, 640, 1200, 64, { studs: false });

    this.add.text(40, 42, '캐릭터 만들기', {
      fontFamily: FONT, fontSize: '26px', color: COL.accent,
    });
    this.add.text(212, 52, '당신은 어떤 사람인가요?', {
      fontFamily: FONT, fontSize: '13px', color: COL.muted,
    });
    this.add.text(255, 94, '미리보기', {
      fontFamily: FONT, fontSize: '14px', color: COL.dim,
    }).setOrigin(0.5, 0);
    this.add.text(500, 94, '외형', {
      fontFamily: FONT, fontSize: '14px', color: COL.dim,
    });
  }

  /** 패널 안 얕은 홈 (스테이지·안내 박스) */
  private inset(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    g.fillStyle(0x06090f, 0.55);
    g.fillRect(x, y, w, h);
    g.fillStyle(0x0e1f2e, 0.75);
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle(0x2c5878, 0.45);
    g.fillRect(x + 1, y + h - 2, w - 2, 1);
    g.fillRect(x + 1, y + 1, w - 2, 1);
  }

  private drawPreviewStage(): void {
    const g = this.chromeG;
    this.inset(g, 56, 126, 398, 336);
    this.inset(g, 56, 470, 398, 146);

    // 바닥 그림자 + 발판 라인
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(255, 422, 140, 22);
    g.fillStyle(0x2c5878, 0.30);
    g.fillRect(120, 421, 270, 1);

    this.previewImg = this.add.image(255, 420 + (32 - 1 - 28) * PREVIEW_SCALE, '__DEFAULT').setOrigin(0.5, 1);
    this.captionText = this.add.text(255, 438, '', {
      fontFamily: FONT, fontSize: '14px', color: COL.accent,
    }).setOrigin(0.5, 0);

    this.drawStageControls();
  }

  /**
   * 프리뷰 조작대 (144차) — 위 행 = 회전(◀ 방향명 ▶) · 아래 행 = 동작(정지/걷기/달리기).
   *
   * 구 미니어처 4종(정면·좌·우·후면)을 대체한다. 네 장을 한꺼번에 작게 보여주는 것보다
   * 큰 프리뷰 하나를 돌려 보는 편이 실제로 보이는 크기와 같아 판단에 쓸모가 있다.
   * `◀ ▶`는 UI 예외 글리프(AGENTS §4)라 그대로 쓴다.
   */
  private drawStageControls(): void {
    this.stageG = this.add.graphics();

    this.dirLabel = this.add.text(255, 515, '', {
      fontFamily: FONT, fontSize: '14px', color: COL.accent,
    }).setOrigin(0.5);

    const motions: PreviewMotion[] = ['idle', 'walk', 'run'];
    this.stageBtns = [
      { cx: 167, cy: 515, w: 48, h: 30, label: '◀', fn: () => this.turn(1) },
      { cx: 343, cy: 515, w: 48, h: 30, label: '▶', fn: () => this.turn(-1) },
      ...motions.map((m, i) => ({
        cx: 131 + i * 124, cy: 571, w: 116, h: 32,
        label: MOTION_KO[m], motion: m, fn: () => this.setMotion(m),
      })),
    ];

    this.stageBtns.forEach((b, i) => {
      this.add.text(b.cx, b.cy, b.label, {
        fontFamily: FONT, fontSize: b.motion ? '14px' : '18px', color: COL.text,
      }).setOrigin(0.5);
      const z = this.add.zone(b.cx - b.w / 2, b.cy - b.h / 2, b.w, b.h)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true });
      z.on('pointerover', () => { this.stageHover = i; this.paintStage(); });
      z.on('pointerout', () => { if (this.stageHover === i) { this.stageHover = -1; this.paintStage(); } });
      z.on('pointerdown', b.fn);
    });
    this.paintStage();
  }

  /** 회전 — `d`만큼 `TURN_ORDER`를 돈다(◀ = +1) */
  private turn(d: number): void {
    const i = TURN_ORDER.indexOf(this.previewDir);
    this.previewDir = TURN_ORDER[(i + d + TURN_ORDER.length) % TURN_ORDER.length];
    this.applyPreviewFrame();
    this.paintStage();
  }

  private setMotion(m: PreviewMotion): void {
    this.previewMotion = m;
    this.previewPhase = 0;
    this.previewTimer = 0;
    this.applyPreviewFrame();
    this.paintStage();
  }

  /** 현재 방향·동작에 맞는 프레임 1장 반영 */
  private applyPreviewFrame(): void {
    const frame = this.previewMotion === 'idle' ? 0 : WALK_SEQ[this.previewPhase];
    this.previewImg?.setFrame(charFrameName(this.previewDir, frame));
    this.dirLabel?.setText(DIR_KO[this.previewDir]);
  }

  /** 스테이지 버튼 프레임 — 선택된 동작은 활성 슬롯으로 그린다 */
  private paintStage(): void {
    this.stageG.clear();
    this.stageBtns.forEach((b, i) => {
      const on = b.motion ? b.motion === this.previewMotion : this.stageHover === i;
      paintHudSlot(this.stageG, b.cx, b.cy, b.w, b.h, on);
    });
  }

  private drawFooter(): void {
    this.btnG = this.add.graphics();
    this.buttons = [
      { cx: 180, cy: 672, w: 224, h: 38, label: '이대로 생성하기', color: COL.ok, fn: () => void this.confirm() },
      { cx: 404, cy: 672, w: 160, h: 38, label: '무작위 외형', color: COL.text, fn: () => this.randomize() },
      { cx: 566, cy: 672, w: 140, h: 38, label: '처음으로', color: COL.warn, fn: () => this.back() },
    ];
    this.buttons.forEach((b, i) => {
      this.add.text(b.cx, b.cy, b.label, {
        fontFamily: FONT, fontSize: '16px', color: b.color,
      }).setOrigin(0.5);
      const z = this.add.zone(b.cx - b.w / 2, b.cy - b.h / 2, b.w, b.h)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true });
      z.on('pointerover', () => { this.hoverBtn = i; this.paintButtons(); });
      z.on('pointerout', () => { if (this.hoverBtn === i) { this.hoverBtn = -1; this.paintButtons(); } });
      z.on('pointerdown', b.fn);
    });
    this.add.text(1224, 672, '↑↓ 항목   ←→ 변경   Enter 생성   ESC 뒤로', {
      fontFamily: FONT, fontSize: '13px', color: COL.muted,
    }).setOrigin(1, 0.5);
    this.paintButtons();
  }

  private paintButtons(): void {
    this.btnG.clear();
    this.buttons.forEach((b, i) => paintHudSlot(this.btnG, b.cx, b.cy, b.w, b.h, this.hoverBtn === i));
  }

  // ── 옵션 정의 ───────────────────────────────────────
  private cycle<T>(arr: readonly T[], cur: T, d: number): T {
    const i = Math.max(0, arr.indexOf(cur));
    return arr[(i + d + arr.length) % arr.length];
  }
  private styles(): HairStyle[] { return this.look.sex === 'f' ? STYLES_F : STYLES_M; }

  private buildRows(): void {
    const sw = (
      key: string, label: string, col: 0 | 1, palette: number[],
      get: () => number, set: (i: number) => void, section?: string, none?: boolean,
    ): OptionRow => ({ key, label, kind: 'swatch', col, section, palette, none, get, set });

    this.rows = [
      {
        key: 'sex', label: '성별', kind: 'cycle', col: 0, section: '체형',
        value: () => (this.look.sex === 'm' ? '남성' : '여성'),
        prev: () => this.setSex(this.look.sex === 'm' ? 'f' : 'm'),
        next: () => this.setSex(this.look.sex === 'm' ? 'f' : 'm'),
      },
      sw('skin', '피부', 0, SKIN_TONES, () => this.look.skin, (i) => { this.look.skin = i; }),

      {
        key: 'faceShape', label: '얼굴형', kind: 'cycle', col: 0, section: '얼굴',
        value: () => FACE_KO[this.look.faceShape],
        prev: () => { this.look.faceShape = this.cycle(FACE_SHAPES, this.look.faceShape, -1); },
        next: () => { this.look.faceShape = this.cycle(FACE_SHAPES, this.look.faceShape, 1); },
      },
      sw('eye', '눈동자', 0, EYE_COLORS, () => this.look.eye, (i) => { this.look.eye = i; }),
      {
        key: 'mouth', label: '입', kind: 'cycle', col: 0,
        value: () => MOUTH_KO[this.look.mouth],
        prev: () => { this.look.mouth = this.cycle(MOUTH_STYLES, this.look.mouth, -1); },
        next: () => { this.look.mouth = this.cycle(MOUTH_STYLES, this.look.mouth, 1); },
      },
      {
        key: 'brow', label: '눈썹', kind: 'cycle', col: 0,
        value: () => (this.look.brow > 0.3 ? '진하게' : '옅게'),
        prev: () => { this.look.brow = this.look.brow > 0.3 ? 0.2 : 0.8; },
        next: () => { this.look.brow = this.look.brow > 0.3 ? 0.2 : 0.8; },
      },
      {
        key: 'blush', label: '볼 홍조', kind: 'cycle', col: 0,
        value: () => (this.look.blush ? '있음' : '없음'),
        prev: () => { this.look.blush = !this.look.blush; },
        next: () => { this.look.blush = !this.look.blush; },
      },

      {
        key: 'hairStyle', label: '머리 모양', kind: 'cycle', col: 1, section: '머리',
        value: () => STYLE_KO[this.look.hairStyle],
        prev: () => { this.look.hairStyle = this.cycle(this.styles(), this.look.hairStyle, -1); },
        next: () => { this.look.hairStyle = this.cycle(this.styles(), this.look.hairStyle, 1); },
      },
      sw('hair', '머리 색', 1, HAIR_COLORS, () => this.look.hair, (i) => { this.look.hair = i; }),
      sw('beard', '수염', 1, HAIR_COLORS, () => this.look.beard, (i) => { this.look.beard = i; }, undefined, true),

      sw('shirt', '기본 상의', 1, CLOTH_COLORS,
        () => this.starterShirt, (i) => { this.starterShirt = i; }, '복장'),
      sw('pants', '기본 하의', 1, CLOTH_COLORS,
        () => this.starterPants, (i) => { this.starterPants = i; }),

      {
        key: 'name', label: '이름', kind: 'cycle', col: 1, section: '이름',
        value: () => (this.editingName ? `${this.nickname}_` : this.nickname),
        prev: () => { this.setEditingName(!this.editingName); },
        next: () => { this.setEditingName(!this.editingName); },
      },
    ];
  }

  private setSex(sex: CharSex): void {
    this.look.sex = sex;
    if (!this.styles().includes(this.look.hairStyle)) this.look.hairStyle = this.styles()[0];
    if (sex === 'f') this.look.beard = -1;
  }

  // ── 행 레이아웃 ─────────────────────────────────────
  private layoutRows(): void {
    this.rowG = this.add.graphics();
    const colX = [512, 884];
    const y0 = 132;
    const cy = [y0, y0];

    for (const row of this.rows) {
      const c = row.col;
      const x = colX[c];
      if (row.section) {
        if (cy[c] > y0) cy[c] += SEC_GAP;
        this.add.text(x, cy[c], row.section, {
          fontFamily: FONT, fontSize: '13px', color: COL.accent,
        });
        cy[c] += SEC_HEAD;
      }
      const y = cy[c];
      cy[c] += ROW_H;

      const label = this.add.text(x, y, row.label, {
        fontFamily: FONT, fontSize: '15px', color: COL.text,
      });
      const view: RowView = { row, x, y, label, cells: [], cellW: 0 };

      const ctrlX = x + CTRL_DX;
      if (row.kind === 'cycle') {
        view.arrowL = this.add.text(ctrlX, y, '◀', { fontFamily: 'monospace', fontSize: '15px', color: COL.muted });
        view.value = this.add.text(ctrlX + CTRL_W / 2, y, '', {
          fontFamily: FONT, fontSize: '15px', color: COL.accent,
        }).setOrigin(0.5, 0);
        view.arrowR = this.add.text(ctrlX + CTRL_W - 12, y, '▶', { fontFamily: 'monospace', fontSize: '15px', color: COL.muted });
        const idx = this.rows.indexOf(row);
        this.hit(ctrlX - 6, y - 6, 34, 30, () => { this.cursor = idx; row.prev?.(); this.refresh(); });
        this.hit(ctrlX + CTRL_W - 22, y - 6, 34, 30, () => { this.cursor = idx; row.next?.(); this.refresh(); });
        this.hit(ctrlX + 30, y - 6, CTRL_W - 60, 30, () => {
          this.cursor = idx;
          if (row.key === 'name') this.setEditingName(true);
          this.refresh();
        });
      } else {
        const n = (row.palette?.length ?? 0) + (row.none ? 1 : 0);
        const cellW = Math.min(26, Math.floor(CTRL_W / n));
        view.cellW = cellW;
        const idx = this.rows.indexOf(row);
        for (let i = 0; i < n; i++) {
          const pi = row.none ? i - 1 : i;
          const z = this.hit(ctrlX + i * cellW, y - 4, cellW, 26, () => {
            this.cursor = idx; row.set?.(pi); this.refresh();
          });
          view.cells.push(z);
        }
      }
      this.views.push(view);
    }

    // 안내 박스 — 두 열 아래 빈 공간
    const infoY = Math.max(cy[0], cy[1]) + 18;
    this.inset(this.chromeG, 512, infoY, 716, 612 - infoY);
    this.hintText = this.add.text(526, infoY + 12, '', {
      fontFamily: FONT, fontSize: '13px', color: COL.dim,
      wordWrap: { width: 690 }, lineSpacing: 6,
    });
  }

  private hit(x: number, y: number, w: number, h: number, fn: () => void): Phaser.GameObjects.Zone {
    const z = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    z.on('pointerdown', fn);
    return z;
  }

  // ── 갱신 ────────────────────────────────────────────
  private cfg(withOutfit: boolean): CharConfig {
    const outfit = withOutfit ? starterOutfit(this.look.sex) : bareOutfit();
    if (withOutfit) {
      outfit.shirtColor = CLOTH_COLORS[this.starterShirt];
      outfit.pantsColor = CLOTH_COLORS[this.starterPants];
    }
    return { look: { ...this.look }, outfit };
  }

  private refresh(): void {
    const cfg = this.cfg(true);
    const big = ensureCharSheet(this, cfg, PREVIEW_SCALE);
    this.previewImg?.setTexture(big, charFrameName(this.previewDir, 0));
    this.applyPreviewFrame();

    this.captionText?.setText(`${this.nickname || '한여름'} · ${this.look.sex === 'm' ? '남성' : '여성'}`);

    this.rowG.clear();
    this.views.forEach((v, i) => {
      const sel = i === this.cursor;
      // 선택 강조 — 색 + 좌측 바 (메인 메뉴와 같은 문법)
      if (sel) {
        this.rowG.fillStyle(0x1b3a52, 0.55);
        this.rowG.fillRect(v.x - 12, v.y - 7, COL_W + 16, 32);
        this.rowG.fillStyle(0xd8b25f, 1);
        this.rowG.fillRect(v.x - 12, v.y - 7, 3, 32);
      }
      v.label.setColor(sel ? COL.accent : COL.text);

      if (v.row.kind === 'cycle') {
        v.value?.setText(v.row.value?.() ?? '');
        if (v.value) clampTextWidth(v.value, CTRL_W - 40);
        v.value?.setColor(sel ? '#ffffff' : COL.accent);
        v.arrowL?.setColor(sel ? COL.accent : '#41586d');
        v.arrowR?.setColor(sel ? COL.accent : '#41586d');
      } else {
        this.paintSwatch(v, sel);
      }
    });

    this.hintText?.setText(this.editingName
      ? '이름을 입력하고 Enter를 누르세요. 지울 때는 Backspace. 한글·영문 모두 됩니다.\n'
        + '여덟 글자까지 쓸 수 있습니다. 조행록과 마을 사람들의 말에 이 이름이 그대로 나옵니다.'
      : '상의·하의·신발은 입고 시작할 옷입니다. 나중에 가방에서 갈아입을 수 있습니다.\n'
        + '색은 견본을 눌러 고르세요.');
  }

  private paintSwatch(v: RowView, sel: boolean): void {
    const g = this.rowG;
    const row = v.row;
    const cur = row.get?.() ?? 0;
    const ctrlX = v.x + CTRL_DX;
    const cw = v.cellW;
    const n = v.cells.length;
    for (let i = 0; i < n; i++) {
      const pi = row.none ? i - 1 : i;
      const cx = ctrlX + i * cw;
      const on = pi === cur;
      g.fillStyle(0x06090f, 0.9);
      g.fillRect(cx, v.y - 3, cw - 2, 24);
      if (pi < 0) {
        // '없음' 칸 — 대각 사선
        g.fillStyle(0x1b3a52, 1);
        g.fillRect(cx + 1, v.y - 2, cw - 4, 22);
        g.fillStyle(0x6f8399, 1);
        for (let k = 0; k < 18; k += 2) g.fillRect(cx + 2 + k, v.y - 1 + (18 - k), 2, 2);
      } else {
        g.fillStyle(row.palette![pi], 1);
        g.fillRect(cx + 1, v.y - 2, cw - 4, 22);
        // 위 1px 하이라이트 (도트 톤)
        g.fillStyle(0xffffff, 0.18);
        g.fillRect(cx + 1, v.y - 2, cw - 4, 1);
      }
      if (on) {
        g.fillStyle(sel ? 0xffe9a0 : 0xd8b25f, 1);
        g.fillRect(cx - 1, v.y - 5, cw, 2);
        g.fillRect(cx - 1, v.y + 19, cw, 2);
        g.fillRect(cx - 1, v.y - 5, 2, 26);
        g.fillRect(cx + cw - 3, v.y - 5, 2, 26);
      }
    }
  }

  private randomize(): void {
    const r = (n: number) => Math.floor(Math.random() * n);
    this.look.sex = Math.random() < 0.5 ? 'm' : 'f';
    this.look.skin = r(SKIN_TONES.length);
    this.look.hair = r(HAIR_COLORS.length);
    this.look.hairStyle = this.styles()[r(this.styles().length)];
    this.look.faceShape = FACE_SHAPES[r(FACE_SHAPES.length)];
    this.look.eye = r(EYE_COLORS.length);
    this.look.mouth = MOUTH_STYLES[r(MOUTH_STYLES.length)];
    this.look.blush = Math.random() < 0.6;
    this.look.brow = Math.random() < 0.5 ? 0.2 : 0.8;
    this.look.beard = this.look.sex === 'm' && Math.random() < 0.25 ? r(HAIR_COLORS.length) : -1;
    this.starterShirt = r(CLOTH_COLORS.length);
    this.starterPants = r(CLOTH_COLORS.length);
    this.refresh();
  }

  // ── 입력 ────────────────────────────────────────────
  private step(d: number): void {
    const row = this.rows[this.cursor];
    if (row.kind === 'cycle') { (d < 0 ? row.prev : row.next)?.(); return; }
    const n = (row.palette?.length ?? 0);
    const lo = row.none ? -1 : 0;
    const cur = row.get?.() ?? 0;
    const span = n - lo;
    const next = lo + (((cur - lo) + d + span) % span);
    row.set?.(next);
  }

  /**
   * 이름 편집 토글 (150차).
   *
   * ⚠ 한글은 Phaser `keydown`으로 받을 수 없다 — 조합(IME)을 거치므로 완성 글자가
   * `input`/`compositionend`로만 온다. 화면 밖 `<input>`에 입력을 맡기고 값만 받아 온다.
   */
  private setEditingName(on: boolean): void {
    if (on === this.editingName) { if (!on) this.refresh(); return; }
    this.editingName = on;
    if (on) {
      this.nameInput = new TextInput(this, {
        value: this.nickname,
        maxLength: 8,
        // 공백만으로 된 이름·줄바꿈은 받지 않는다
        filter: (v) => v.replace(/[\r\n\t]/g, ''),
        onChange: (v) => { this.nickname = v; this.refresh(); },
        onSubmit: () => this.setEditingName(false),
        onCancel: () => this.setEditingName(false),
      });
    } else {
      this.nameInput?.close();
      this.nameInput = undefined;
    }
    this.refresh();
  }

  private onKey(ev: KeyboardEvent): void {
    if (this.starting) return;
    // 이름 편집 중에는 Phaser 키보드가 꺼져 있다(TextInput이 DOM 입력으로 전담 — 한글 IME).
    if (this.editingName) return;
    switch (ev.key) {
      case 'ArrowUp': this.cursor = (this.cursor - 1 + this.rows.length) % this.rows.length; this.refresh(); break;
      case 'ArrowDown': this.cursor = (this.cursor + 1) % this.rows.length; this.refresh(); break;
      case 'ArrowLeft': this.step(-1); this.refresh(); break;
      case 'ArrowRight': this.step(1); this.refresh(); break;
      case 'Enter':
        if (this.rows[this.cursor].key === 'name') { this.setEditingName(true); }
        else this.confirm();
        break;
      case 'Escape': this.back(); break;
      default: break;
    }
  }

  update(_t: number, dt: number): void {
    // 144차 — 자동 회전 폐기(방향은 ◀ ▶ 버튼이 전담). 선택한 동작만 프레임을 돌린다.
    if (this.previewMotion === 'idle') return;
    const pace = this.previewMotion === 'run' ? TUNING.vitals.runSpeedMult : 1;
    const step = CHAR_WALK_MS / pace;
    this.previewTimer += dt;
    while (this.previewTimer >= step) {
      this.previewTimer -= step;
      this.previewPhase = (this.previewPhase + 1) % WALK_SEQ.length;
      this.applyPreviewFrame();
    }
  }

  /**
   * 진행 상태 한 줄 — 푸터 버튼 위에 뜬다 (143차).
   * 멀티에서는 이름 중복 검사 결과가 여기에 그대로 나온다(빨간 글씨 = 실패).
   */
  private setProgress(msg: string, color: string = COL.accent): void {
    if (!this.progressText) {
      this.progressText = this.add.text(180, 640, '', {
        fontFamily: FONT, fontSize: '13px', color, wordWrap: { width: 760 },
      }).setOrigin(0.5, 1);
    }
    this.progressText.setText(msg).setColor(color);
  }

  /** 잠깐 멈춤 — 진행 문구가 눈에 보이도록 */
  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  private async confirm(): Promise<void> {
    if (this.starting) return;
    const name = this.nickname.trim();
    const form = validateCharacterName(name);
    if (!form.ok) { this.setProgress(form.reasonKo ?? '이름을 확인하세요.', COL.fail); return; }

    this.starting = true;
    if (MultiplayerClient.isMulti) {
      // 같은 방 안에서 이름이 겹치면 누가 누군지 알 수 없다 — 서버가 판정한다.
      this.setProgress(MP_PROGRESS_KO.checking, COL.accent);
      await this.wait(420);
      const chk = await MultiplayerClient.checkName(name);
      if (!chk.ok) {
        this.starting = false;
        this.setProgress(chk.duplicate ? MP_PROGRESS_KO.duplicate : (chk.reasonKo ?? '이름을 확인할 수 없습니다.'), COL.fail);
        return;
      }
      this.setProgress(MP_PROGRESS_KO.passed, COL.ok);
      await this.wait(420);
      this.setProgress(MP_PROGRESS_KO.creating, COL.accent);
      await this.wait(320);
      // 145차 — 외형을 함께 올린다. 서버가 들고 있다가 다른 사람 화면에 그대로 내려준다.
      const joined = await MultiplayerClient.claimName(name, this.cfg(true));
      if (!joined.ok) {
        this.starting = false;
        this.setProgress(joined.duplicate ? MP_PROGRESS_KO.duplicate : (joined.reasonKo ?? '접속하지 못했습니다.'), COL.fail);
        return;
      }
      this.setProgress(MP_PROGRESS_KO.connecting, COL.ok);
      await this.wait(420);
    } else {
      this.setProgress(MP_PROGRESS_KO.creating, COL.accent);
      await this.wait(260);
    }

    GameState.setCharacter(this.cfg(true));
    GameState.updatePlayer({ nickname: name || '한여름' });
    this.cameras.main.fadeOut(280, 1, 8, 18);
    this.time.delayedCall(320, () => this.scene.start('RegionFieldScene', { region: 'hometown' }));
  }

  private back(): void {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.fadeOut(200, 1, 8, 18);
    this.time.delayedCall(240, () => this.scene.start('MainMenuScene'));
  }
}
