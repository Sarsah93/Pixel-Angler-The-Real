/**
 * @file CharacterCreateScene.ts
 * @description 캐릭터 만들기 (138차) — 새 게임 시작 직후 1회.
 *
 * 바닐라 베이스(나체 + 언더웨어) 위에 외형을 고르고, 확정 시 **스타터 한 벌**(상의·하의·신발)을
 * 장착한 상태로 게임에 들어간다. 즉 옷은 처음부터 "입혀진 장비"이지 몸의 일부가 아니다.
 *
 * ⚠ 미리보기는 `CharacterSprite`가 굽는 **실제 게임 시트**를 그대로 쓴다 — 여기서 예쁘게 보이던 것이
 *   인게임에서 달라지는 일이 없도록(별도 프리뷰 렌더러 금지).
 */
import Phaser from 'phaser';
import {
  CLOTH_COLORS, EYE_COLORS, HAIR_COLORS, MOUTH_STYLES, SKIN_TONES,
  bareOutfit, defaultAppearance, starterOutfit,
  type CharAppearance, type CharConfig, type CharDir, type CharSex, type HairStyle, type MouthStyle,
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { ensureCharSheet, charFrameName } from '../ui/CharacterSprite.js';
import { clampTextWidth } from '../ui/TextFit.js';

const W = 1280, H = 720;
const PREVIEW_SCALE = 8;
const DIR_SCALE = 3;

/** 성별별 머리 모양 후보 — 전부 허용하되 기본 정렬만 다르게 둔다 */
const STYLES_M: HairStyle[] = ['short', 'buzz', 'curly', 'topknot', 'bob', 'pony', 'long', 'braid'];
const STYLES_F: HairStyle[] = ['bob', 'pony', 'long', 'braid', 'curly', 'short', 'topknot', 'buzz'];

interface OptionRow {
  key: string;
  label: string;
  /** 현재 값 라벨 */
  value: () => string;
  prev: () => void;
  next: () => void;
}

export class CharacterCreateScene extends Phaser.Scene {
  private look!: CharAppearance;
  private nickname = '한여름';
  private rows: OptionRow[] = [];
  private cursor = 0;
  private previewImg?: Phaser.GameObjects.Image;
  private dirImgs: Phaser.GameObjects.Image[] = [];
  private rowTexts: { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text; arrowL: Phaser.GameObjects.Text; arrowR: Phaser.GameObjects.Text }[] = [];
  private nameText?: Phaser.GameObjects.Text;
  private editingName = false;
  private previewDir: CharDir = 'down';
  private previewTimer = 0;
  private starting = false;

  constructor() { super({ key: 'CharacterCreateScene' }); }

  create(): void {
    this.starting = false;
    this.editingName = false;
    this.cursor = 0;
    this.look = defaultAppearance('m');
    this.nickname = GameState.player.nickname || '한여름';
    this.cameras.main.setBackgroundColor('#0b1420');
    this.cameras.main.fadeIn(260, 1, 8, 18);

    this.drawBackdrop();
    this.buildRows();
    this.drawLayout();
    this.refresh();

    this.input.keyboard?.on('keydown', this.onKey, this);
    this.events.once('shutdown', () => this.input.keyboard?.off('keydown', this.onKey, this));
  }

  // ── 배경 ────────────────────────────────────────────
  private drawBackdrop(): void {
    const g = this.add.graphics();
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      g.fillStyle(Phaser.Display.Color.GetColor(
        Math.round(11 + t * 12), Math.round(20 + t * 26), Math.round(32 + t * 40)), 1);
      g.fillRect(0, (H / 12) * i, W, H / 12 + 1);
    }
    g.fillStyle(0x0d1a28, 1);
    g.fillRect(40, 96, 420, 560);
    g.fillStyle(0x101d2c, 1);
    g.fillRect(492, 96, 748, 560);

    this.add.text(40, 46, '캐릭터 만들기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '28px', color: '#ffe9a0',
    });
    this.add.text(300, 56, '방향키로 고르고 Enter로 시작합니다', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#8fa6bd',
    });
  }

  // ── 옵션 정의 ───────────────────────────────────────
  private cycle<T>(arr: readonly T[], cur: T, d: number): T {
    const i = Math.max(0, arr.indexOf(cur));
    return arr[(i + d + arr.length) % arr.length];
  }
  private cycleIdx(len: number, cur: number, d: number): number {
    return (cur + d + len) % len;
  }

  private styles(): HairStyle[] { return this.look.sex === 'f' ? STYLES_F : STYLES_M; }

  private buildRows(): void {
    const MOUTH_KO: Record<MouthStyle, string> = {
      smile: '미소', neutral: '담담', small: '작은 입', open: '활짝',
    };
    const STYLE_KO: Record<HairStyle, string> = {
      short: '단발 컷', bob: '보브', pony: '포니테일', long: '긴 머리',
      buzz: '짧은 스포츠', curly: '곱슬', braid: '땋은 머리', topknot: '상투 번',
    };
    this.rows = [
      {
        key: 'sex', label: '성별',
        value: () => (this.look.sex === 'm' ? '남성' : '여성'),
        prev: () => this.setSex(this.look.sex === 'm' ? 'f' : 'm'),
        next: () => this.setSex(this.look.sex === 'm' ? 'f' : 'm'),
      },
      {
        key: 'skin', label: '피부',
        value: () => `${this.look.skin + 1} / ${SKIN_TONES.length}`,
        prev: () => { this.look.skin = this.cycleIdx(SKIN_TONES.length, this.look.skin, -1); },
        next: () => { this.look.skin = this.cycleIdx(SKIN_TONES.length, this.look.skin, 1); },
      },
      {
        key: 'hairStyle', label: '머리 모양',
        value: () => STYLE_KO[this.look.hairStyle],
        prev: () => { this.look.hairStyle = this.cycle(this.styles(), this.look.hairStyle, -1); },
        next: () => { this.look.hairStyle = this.cycle(this.styles(), this.look.hairStyle, 1); },
      },
      {
        key: 'hair', label: '머리 색',
        value: () => `${this.look.hair + 1} / ${HAIR_COLORS.length}`,
        prev: () => { this.look.hair = this.cycleIdx(HAIR_COLORS.length, this.look.hair, -1); },
        next: () => { this.look.hair = this.cycleIdx(HAIR_COLORS.length, this.look.hair, 1); },
      },
      {
        key: 'eye', label: '눈동자',
        value: () => `${this.look.eye + 1} / ${EYE_COLORS.length}`,
        prev: () => { this.look.eye = this.cycleIdx(EYE_COLORS.length, this.look.eye, -1); },
        next: () => { this.look.eye = this.cycleIdx(EYE_COLORS.length, this.look.eye, 1); },
      },
      {
        key: 'mouth', label: '입',
        value: () => MOUTH_KO[this.look.mouth],
        prev: () => { this.look.mouth = this.cycle(MOUTH_STYLES, this.look.mouth, -1); },
        next: () => { this.look.mouth = this.cycle(MOUTH_STYLES, this.look.mouth, 1); },
      },
      {
        key: 'brow', label: '눈썹',
        value: () => (this.look.brow > 0.3 ? '진하게' : '옅게'),
        prev: () => { this.look.brow = this.look.brow > 0.3 ? 0.2 : 0.8; },
        next: () => { this.look.brow = this.look.brow > 0.3 ? 0.2 : 0.8; },
      },
      {
        key: 'beard', label: '수염',
        value: () => (this.look.beard < 0 ? '없음' : `${this.look.beard + 1} / ${HAIR_COLORS.length}`),
        prev: () => { this.look.beard = this.look.beard < 0 ? HAIR_COLORS.length - 1 : this.look.beard - 1; },
        next: () => { this.look.beard = this.look.beard >= HAIR_COLORS.length - 1 ? -1 : this.look.beard + 1; },
      },
      {
        key: 'blush', label: '볼 홍조',
        value: () => (this.look.blush ? '있음' : '없음'),
        prev: () => { this.look.blush = !this.look.blush; },
        next: () => { this.look.blush = !this.look.blush; },
      },
      {
        key: 'shirt', label: '기본 상의 색',
        value: () => `${this.starterShirt + 1} / ${CLOTH_COLORS.length}`,
        prev: () => { this.starterShirt = this.cycleIdx(CLOTH_COLORS.length, this.starterShirt, -1); },
        next: () => { this.starterShirt = this.cycleIdx(CLOTH_COLORS.length, this.starterShirt, 1); },
      },
      {
        key: 'pants', label: '기본 하의 색',
        value: () => `${this.starterPants + 1} / ${CLOTH_COLORS.length}`,
        prev: () => { this.starterPants = this.cycleIdx(CLOTH_COLORS.length, this.starterPants, -1); },
        next: () => { this.starterPants = this.cycleIdx(CLOTH_COLORS.length, this.starterPants, 1); },
      },
      {
        key: 'name', label: '이름',
        value: () => (this.editingName ? `${this.nickname}_` : this.nickname),
        prev: () => { this.editingName = !this.editingName; },
        next: () => { this.editingName = !this.editingName; },
      },
    ];
  }

  private starterShirt = 0;
  private starterPants = 1;

  private setSex(sex: CharSex): void {
    this.look.sex = sex;
    if (!this.styles().includes(this.look.hairStyle)) this.look.hairStyle = this.styles()[0];
    if (sex === 'f') this.look.beard = -1;
  }

  // ── 레이아웃 ────────────────────────────────────────
  private drawLayout(): void {
    // 미리보기 (게임 시트 그대로)
    this.previewImg = this.add.image(250, 430, '__DEFAULT').setOrigin(0.5, 1);
    this.add.text(250, 118, '미리보기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#8fa6bd',
    }).setOrigin(0.5, 0);

    // 4방향 줄
    const dirs: CharDir[] = ['down', 'left', 'right', 'up'];
    dirs.forEach((_, i) => {
      const img = this.add.image(130 + i * 80, 600, '__DEFAULT').setOrigin(0.5, 1);
      this.dirImgs.push(img);
    });
    this.add.text(250, 620, '정면 · 좌 · 우 · 후면', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#6f8399',
    }).setOrigin(0.5, 0);

    // 옵션 행
    const x0 = 530, y0 = 132, rowH = 40;
    this.rows.forEach((r, i) => {
      const y = y0 + i * rowH;
      const label = this.add.text(x0, y, r.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#cfe0ef',
      });
      const arrowL = this.add.text(x0 + 220, y, '◀', {
        fontFamily: 'monospace', fontSize: '16px', color: '#6f8399',
      }).setInteractive({ useHandCursor: true });
      const value = this.add.text(x0 + 250, y, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#ffe9a0',
      });
      const arrowR = this.add.text(x0 + 430, y, '▶', {
        fontFamily: 'monospace', fontSize: '16px', color: '#6f8399',
      }).setInteractive({ useHandCursor: true });
      arrowL.on('pointerdown', () => { this.cursor = i; r.prev(); this.refresh(); });
      arrowR.on('pointerdown', () => { this.cursor = i; r.next(); this.refresh(); });
      label.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.cursor = i; this.refresh(); });
      this.rowTexts.push({ label, value, arrowL, arrowR });
    });

    this.nameText = this.add.text(530, y0 + this.rows.length * rowH + 16, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#6f8399',
      wordWrap: { width: 660 },
    });

    // 버튼
    const mk = (x: number, label: string, color: string, fn: () => void) => {
      const t = this.add.text(x, 600, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '18px', color,
        backgroundColor: '#16283a', padding: { x: 18, y: 10 },
      }).setInteractive({ useHandCursor: true });
      t.on('pointerdown', fn);
      return t;
    };
    mk(530, '이 캐릭터로 시작', '#a8e6b0', () => this.confirm());
    mk(720, '무작위', '#cfe0ef', () => this.randomize());
    mk(850, '처음으로', '#e0a0a0', () => this.back());
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

    this.rows.forEach((r, i) => {
      const t = this.rowTexts[i];
      const sel = i === this.cursor;
      t.label.setColor(sel ? '#ffe9a0' : '#cfe0ef');
      t.value.setText(r.value());
      clampTextWidth(t.value, 170);
      t.value.setColor(sel ? '#ffffff' : '#ffe9a0');
      t.arrowL.setColor(sel ? '#ffe9a0' : '#41586d');
      t.arrowR.setColor(sel ? '#ffe9a0' : '#41586d');
    });
    this.nameText?.setText(this.editingName
      ? '이름 입력 중 — 글자를 입력하고 Enter로 확정합니다 (Backspace 지우기)'
      : '옷은 장착 아이템입니다. 여기서 고른 한 벌을 입은 채로 시작하고, 나중에 벗거나 바꿀 수 있습니다.');
  }

  private randomize(): void {
    const r = (n: number) => Math.floor(Math.random() * n);
    this.look.sex = Math.random() < 0.5 ? 'm' : 'f';
    this.look.skin = r(SKIN_TONES.length);
    this.look.hair = r(HAIR_COLORS.length);
    this.look.hairStyle = this.styles()[r(this.styles().length)];
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
      case 'ArrowLeft': this.rows[this.cursor].prev(); this.refresh(); break;
      case 'ArrowRight': this.rows[this.cursor].next(); this.refresh(); break;
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
      this.refresh();
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
