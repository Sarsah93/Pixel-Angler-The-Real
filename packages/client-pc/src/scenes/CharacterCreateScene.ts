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
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { ensureCharSheet, charFrameName } from '../ui/CharacterSprite.js';
import { paintHudPanel, paintHudSlot } from '../ui/HudPanelStyle.js';
import { clampTextWidth } from '../ui/TextFit.js';

const W = 1280, H = 720;
const PREVIEW_SCALE = 10;
const DIR_SCALE = 3;

const FONT = '"Noto Sans KR", sans-serif';
const COL = {
  accent: '#ffe9a0',
  text: '#cfe0ef',
  dim: '#8fa6bd',
  muted: '#6f8399',
  ok: '#a8e6b0',
  warn: '#e8a8a8',
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
  private dirImgs: Phaser.GameObjects.Image[] = [];
  private captionText?: Phaser.GameObjects.Text;
  private hintText?: Phaser.GameObjects.Text;

  private buttons: { cx: number; cy: number; w: number; h: number; label: string; color: string; fn: () => void }[] = [];
  private hoverBtn = -1;

  private editingName = false;
  private previewDir: CharDir = 'down';
  private previewTimer = 0;
  private starting = false;

  constructor() { super({ key: 'CharacterCreateScene' }); }

  create(): void {
    this.starting = false;
    this.editingName = false;
    this.cursor = 0;
    this.hoverBtn = -1;
    this.views = [];
    this.dirImgs = [];
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
    this.events.once('shutdown', () => this.input.keyboard?.off('keydown', this.onKey, this));
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
    this.add.text(212, 52, '조행록의 첫 장 — 당신은 어떤 사람으로 속초에 도착합니까', {
      fontFamily: FONT, fontSize: '13px', color: COL.muted,
    });
    this.add.text(255, 94, '미리보기', {
      fontFamily: FONT, fontSize: '14px', color: COL.dim,
    }).setOrigin(0.5, 0);
    this.add.text(500, 94, '외형', {
      fontFamily: FONT, fontSize: '14px', color: COL.dim,
    });
    this.add.text(1228, 94, '바닐라 = 나체 + 언더웨어 · 옷은 장착 아이템', {
      fontFamily: FONT, fontSize: '12px', color: COL.muted,
    }).setOrigin(1, 0);
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
    this.inset(g, 56, 470, 398, 104);

    // 바닥 그림자 + 발판 라인
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(255, 422, 140, 22);
    g.fillStyle(0x2c5878, 0.30);
    g.fillRect(120, 421, 270, 1);

    this.previewImg = this.add.image(255, 420 + (32 - 1 - 28) * PREVIEW_SCALE, '__DEFAULT').setOrigin(0.5, 1);
    this.captionText = this.add.text(255, 438, '', {
      fontFamily: FONT, fontSize: '14px', color: COL.accent,
    }).setOrigin(0.5, 0);

    const dirs: CharDir[] = ['down', 'left', 'right', 'up'];
    dirs.forEach((_, i) => {
      this.dirImgs.push(this.add.image(
        129 + i * 84, 556 + (32 - 1 - 28) * DIR_SCALE, '__DEFAULT').setOrigin(0.5, 1));
    });
    this.add.text(255, 578, '정면 · 좌 · 우 · 후면', {
      fontFamily: FONT, fontSize: '12px', color: COL.muted,
    }).setOrigin(0.5, 0);
  }

  private drawFooter(): void {
    this.btnG = this.add.graphics();
    this.buttons = [
      { cx: 180, cy: 672, w: 224, h: 38, label: '이 캐릭터로 시작', color: COL.ok, fn: () => this.confirm() },
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
    this.add.text(1224, 672, '↑↓ 항목   ←→ 변경   Enter 시작   ESC 뒤로', {
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
        prev: () => { this.editingName = !this.editingName; },
        next: () => { this.editingName = !this.editingName; },
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
          if (row.key === 'name') this.editingName = true;
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
    const small = ensureCharSheet(this, cfg, DIR_SCALE);
    const dirs: CharDir[] = ['down', 'left', 'right', 'up'];
    this.dirImgs.forEach((img, i) => img.setTexture(small, charFrameName(dirs[i], 0)));

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
      ? '이름 입력 중 — 글자를 입력하고 Enter로 확정합니다. Backspace로 지웁니다.\n'
        + '이름은 8자까지 쓸 수 있고, 이후 조행록과 NPC 대사에 그대로 등장합니다.'
      : '옷은 몸의 일부가 아니라 장착 아이템입니다. 여기서 고른 상의·하의·신발 한 벌을 입은 채로 시작하며,\n'
        + '가방에서 벗거나 다른 옷으로 바꿀 수 있습니다. 벗으면 바닐라(나체 + 언더웨어)로 돌아갑니다.\n'
        + '색 항목은 견본을 직접 눌러 고를 수 있습니다.');
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

  private onKey(ev: KeyboardEvent): void {
    if (this.starting) return;
    if (this.editingName) {
      if (ev.key === 'Enter' || ev.key === 'Escape') { this.editingName = false; this.refresh(); return; }
      if (ev.key === 'Backspace') { this.nickname = this.nickname.slice(0, -1); this.refresh(); return; }
      if (ev.key.length === 1 && this.nickname.length < 8) { this.nickname += ev.key; this.refresh(); }
      return;
    }
    switch (ev.key) {
      case 'ArrowUp': this.cursor = (this.cursor - 1 + this.rows.length) % this.rows.length; this.refresh(); break;
      case 'ArrowDown': this.cursor = (this.cursor + 1) % this.rows.length; this.refresh(); break;
      case 'ArrowLeft': this.step(-1); this.refresh(); break;
      case 'ArrowRight': this.step(1); this.refresh(); break;
      case 'Enter':
        if (this.rows[this.cursor].key === 'name') { this.editingName = true; this.refresh(); }
        else this.confirm();
        break;
      case 'Escape': this.back(); break;
      default: break;
    }
  }

  update(_t: number, dt: number): void {
    // 미리보기는 2.4초마다 방향을 돌려 4면을 전부 보여준다
    this.previewTimer += dt;
    if (this.previewTimer >= 2400) {
      this.previewTimer = 0;
      const dirs: CharDir[] = ['down', 'left', 'up', 'right'];
      this.previewDir = dirs[(dirs.indexOf(this.previewDir) + 1) % dirs.length];
      this.previewImg?.setFrame(charFrameName(this.previewDir, 0));
    }
  }

  private confirm(): void {
    if (this.starting) return;
    this.starting = true;
    GameState.setCharacter(this.cfg(true));
    GameState.updatePlayer({ nickname: this.nickname.trim() || '한여름' });
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
