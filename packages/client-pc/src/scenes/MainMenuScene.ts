/**
 * @file MainMenuScene.ts
 * @description 메인 메뉴 씬 (2026-07-15 전면 개편)
 *
 * 구성:
 *  - 배경: 시간대 연동 하늘/바다 그라데이션 + 별/달빛 반사 + 등대·배 실루엣 +
 *    떠 있는 찌와 파문 (구 캐릭터/방파제 도트는 제거)
 *  - 타이틀: PIXEL ANGLER / THE REAL 2단 로고 (잘림 없이 중앙 정렬)
 *  - 메뉴 뷰 스택: main(게임 시작/도감/설정/게임 종료)
 *      → start(새 게임/이어하기) → slots(저장 슬롯 3개 선택)
 *  - 키보드 ↑↓/Enter + 마우스 hover 동기화 (폰트/레이아웃 불변 — 선택은 색+바만)
 *  - ESC: 이전 뷰로 복귀
 *
 * 저장/불러오기: GameState 슬롯 API (saveToSlot/loadFromSlot/getSlotMeta) 사용.
 */

import Phaser from 'phaser';
import { GameState, SAVE_SLOT_COUNT } from '../store/GameState.js';
import { EnvironmentStore } from '../store/EnvironmentStore.js';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

type MenuView = 'main' | 'start' | 'slots';
type SlotMode = 'new' | 'load';

interface MenuEntry {
  label: string;
  sub?: string;
  disabled?: boolean;
  action: () => void;
}

// ── 메뉴 패널 배치 ──────────────────────────────────
const PANEL_W = 340;
const PANEL_X = GAME_WIDTH - PANEL_W - 96;
const PANEL_Y = 236;
const ROW_H = 46;
const SLOT_ROW_H = 74;

export class MainMenuScene extends Phaser.Scene {
  private view: MenuView = 'main';
  private slotMode: SlotMode = 'new';
  private selectedIndex = 0;
  private entries: MenuEntry[] = [];

  private panelContainer!: Phaser.GameObjects.Container;
  private rowObjs: { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; sub?: Phaser.GameObjects.Text; y: number; h: number }[] = [];
  private environmentText?: Phaser.GameObjects.Text;
  /** 덮어쓰기 확인 대기 중인 슬롯 (new 모드 2단계 클릭) */
  private confirmSlot: number | null = null;
  /** 삭제 확인 대기 중인 슬롯 (2단계 클릭) */
  private deleteConfirmSlot: number | null = null;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.view = 'main';
    this.selectedIndex = 0;
    this.confirmSlot = null;

    this.drawBackground();
    this.drawTitle();

    this.panelContainer = this.add.container(0, 0).setDepth(50);
    this.buildView();

    this.drawBottomBar();
    this.setupKeyboard();
    void this.loadEnvironmentData();
    // 공공 OpenAPI 일괄 수집 (스타트업 1회 — 낚시지수/경락가/어획량 캐시)
    void ExternalDataStore.fetchAll();

    this.cameras.main.fadeIn(350, 1, 8, 18);
  }

  // ═══════════════════════════════════════════════════
  // 배경 — 시간대 연동 바다 풍경
  // ═══════════════════════════════════════════════════
  private drawBackground(): void {
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 5;
    const isDusk = (hour >= 17 && hour < 20) || (hour >= 5 && hour < 7);

    const horizonY = GAME_HEIGHT * 0.58;
    const g = this.add.graphics().setDepth(0);

    // ── 하늘 (세로 밴드 그라데이션) ──
    const skyTop = isNight ? 0x040a18 : isDusk ? 0x2a1436 : 0x2a6a9e;
    const skyBottom = isNight ? 0x0e2238 : isDusk ? 0xc4552e : 0x7db8dc;
    const bands = 24;
    for (let i = 0; i < bands; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(skyTop),
        Phaser.Display.Color.ValueToColor(skyBottom),
        bands - 1, i,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (horizonY / bands) * i, GAME_WIDTH, horizonY / bands + 1);
    }

    // ── 바다 ──
    const seaTop = isNight ? 0x0a1d32 : isDusk ? 0x3a2a48 : 0x1d5580;
    const seaBottom = isNight ? 0x04101e : isDusk ? 0x1a1228 : 0x0e3450;
    for (let i = 0; i < bands; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(seaTop),
        Phaser.Display.Color.ValueToColor(seaBottom),
        bands - 1, i,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      const y0 = horizonY + ((GAME_HEIGHT - horizonY) / bands) * i;
      g.fillRect(0, y0, GAME_WIDTH, (GAME_HEIGHT - horizonY) / bands + 1);
    }

    // ── 달/해 + 수면 반사광 ──
    const orbX = GAME_WIDTH * 0.76;
    const orbY = 96;
    if (isNight) {
      const glow = this.add.circle(orbX, orbY, 34, 0xeef2dc, 0.12).setDepth(1);
      this.add.circle(orbX, orbY, 20, 0xeef2dc, 0.95).setDepth(1);
      this.add.circle(orbX + 7, orbY - 4, 16, skyTop, 1).setDepth(1);
      this.tweens.add({ targets: glow, alpha: 0.22, scale: 1.15, duration: 2600, yoyo: true, repeat: -1 });
    } else {
      const sun = this.add.circle(orbX, orbY, 26, isDusk ? 0xff9a4a : 0xffd75e, 1).setDepth(1);
      const glow = this.add.circle(orbX, orbY, 40, isDusk ? 0xff9a4a : 0xffd75e, 0.18).setDepth(1);
      this.tweens.add({ targets: [sun, glow], y: orbY + 4, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // 반사광 기둥 (일렁이는 가로 조각들)
    for (let i = 0; i < 14; i++) {
      const ry = horizonY + 12 + i * 22;
      if (ry > GAME_HEIGHT - 30) break;
      const w = 46 - i * 2.4 + Math.random() * 16;
      const shard = this.add.rectangle(orbX + (Math.random() - 0.5) * 24, ry, w, 3,
        isNight ? 0xd8e4c8 : 0xffd75e, isNight ? 0.14 : 0.16).setDepth(2);
      this.tweens.add({
        targets: shard, alpha: 0.04, scaleX: 0.6,
        duration: 1600 + Math.random() * 1800, yoyo: true, repeat: -1, delay: Math.random() * 1500,
      });
    }

    // ── 별 (야간/황혼) ──
    if (isNight || isDusk) {
      for (let i = 0; i < 70; i++) {
        const star = this.add.rectangle(
          Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, horizonY * 0.85),
          Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2),
          0xffffff, Phaser.Math.FloatBetween(0.25, 0.9),
        ).setDepth(1);
        this.tweens.add({
          targets: star, alpha: 0.08,
          duration: Phaser.Math.Between(900, 2600), yoyo: true, repeat: -1,
          delay: Phaser.Math.Between(0, 2200),
        });
      }
    }

    // ── 수평선 파도 라인 (애니메이션) ──
    const waveG = this.add.graphics().setDepth(3);
    this.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        const t = this.time.now / 900;
        waveG.clear();
        for (let row = 0; row < 6; row++) {
          const baseY = horizonY + 8 + row * 26;
          waveG.lineStyle(1, isNight ? 0x3a6a94 : 0x7fb8d8, 0.22 - row * 0.02);
          waveG.beginPath();
          for (let x = 0; x <= GAME_WIDTH; x += 10) {
            const y = baseY + Math.sin(x / (60 + row * 14) + t + row) * (2.5 + row * 0.5);
            if (x === 0) waveG.moveTo(x, y); else waveG.lineTo(x, y);
          }
          waveG.strokePath();
        }
      },
    });

    // ── 등대 실루엣 (좌측) + 점멸 등불 ──
    const lg = this.add.graphics().setDepth(4);
    const lx = 108, lyBase = horizonY + 6;
    lg.fillStyle(0x0a1626, 1);
    lg.fillRect(lx - 30, lyBase - 8, 110, 10);                  // 방파제 끝
    lg.fillRect(lx - 8, lyBase - 66, 16, 60);                   // 몸통
    lg.fillRect(lx - 12, lyBase - 76, 24, 12);                  // 등탑
    lg.fillTriangle(lx - 12, lyBase - 76, lx + 12, lyBase - 76, lx, lyBase - 88);
    const beacon = this.add.circle(lx, lyBase - 70, 4, 0xffd75e, 0.95).setDepth(5);
    this.tweens.add({ targets: beacon, alpha: 0.1, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── 원거리 배 실루엣 (집어등) ──
    const boat = this.add.container(GAME_WIDTH * 0.4, horizonY - 4).setDepth(4);
    const bg2 = this.add.graphics();
    bg2.fillStyle(0x0a1626, 1);
    bg2.fillRect(-26, -5, 52, 7);
    bg2.fillRect(-4, -16, 3, 12);
    boat.add(bg2);
    if (isNight) {
      const lamp = this.add.circle(10, -10, 2.5, 0xffe28a, 0.95);
      boat.add(lamp);
      this.tweens.add({ targets: lamp, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });
    }
    this.tweens.add({ targets: boat, y: horizonY - 1, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── 떠 있는 찌 + 파문 (좌하단 포인트) ──
    const fbX = 240, fbY = GAME_HEIGHT * 0.78;
    const bobber = this.add.container(fbX, fbY).setDepth(5);
    const bobG = this.add.graphics();
    bobG.fillStyle(0xff5a3a, 1);
    bobG.fillEllipse(0, -4, 9, 11);
    bobG.fillStyle(0xfff2dd, 1);
    bobG.fillEllipse(0, 3, 7, 8);
    bobG.fillStyle(0x222222, 1);
    bobG.fillRect(-1, -14, 2, 6);
    bobber.add(bobG);
    this.tweens.add({ targets: bobber, y: fbY + 5, angle: 4, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const ring = this.add.circle(fbX, fbY + 6, 10, 0x000000, 0).setStrokeStyle(1.5, 0xbfe0f0, 0.5).setDepth(4);
    this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 2400, repeat: -1, ease: 'Sine.easeOut' });

    // ── 갈매기 ──
    for (let i = 0; i < 3; i++) {
      const gull = this.add.text(-40 - i * 180, Phaser.Math.Between(60, horizonY * 0.6), '⌒', {
        fontFamily: 'monospace', fontSize: '11px', color: isNight ? '#5a7a94' : '#e8f4fd',
      }).setAlpha(0.65).setDepth(2);
      this.tweens.add({
        targets: gull, x: GAME_WIDTH + 60,
        duration: Phaser.Math.Between(16000, 26000), repeat: -1, delay: i * 3000,
        onRepeat: () => { gull.x = -60; gull.y = Phaser.Math.Between(60, horizonY * 0.6); },
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // 타이틀 로고 (잘림 없이 중앙 정렬, 2단 구성)
  // ═══════════════════════════════════════════════════
  private drawTitle(): void {
    const cx = GAME_WIDTH / 2 - 190;
    const ty = 150;

    // 그림자 → 본문 (정확히 같은 위치 오프셋으로 겹침 방지)
    this.add.text(cx + 4, ty + 4, 'PIXEL ANGLER', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '46px', color: '#02101f',
    }).setOrigin(0.5).setDepth(10);
    const main = this.add.text(cx, ty, 'PIXEL ANGLER', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '46px', color: '#5fe8c8',
    }).setOrigin(0.5).setDepth(11);
    main.setShadow(0, 0, '#2aa88a', 8, true, true);

    this.add.text(cx + 3, ty + 61, 'THE REAL', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '22px', color: '#02101f',
    }).setOrigin(0.5).setDepth(10);
    const sub = this.add.text(cx, ty + 58, 'THE REAL', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '22px', color: '#ffd75e',
    }).setOrigin(0.5).setDepth(11);

    // 은은한 부유 연출 (스케일 펄스 제거 — 잘림/블러 원인)
    this.tweens.add({
      targets: [main, sub], y: '+=5', duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  // ═══════════════════════════════════════════════════
  // 메뉴 뷰 구성 (main / start / slots)
  // ═══════════════════════════════════════════════════
  private buildView(): void {
    this.panelContainer.removeAll(true);
    this.rowObjs = [];
    this.selectedIndex = 0;
    this.confirmSlot = null;
    this.deleteConfirmSlot = null;

    switch (this.view) {
      case 'main': this.entries = this.buildMainEntries(); break;
      case 'start': this.entries = this.buildStartEntries(); break;
      case 'slots': this.entries = this.buildSlotEntries(); break;
    }

    const rowH = this.view === 'slots' ? SLOT_ROW_H : ROW_H;
    const titleH = 54;
    const panelH = titleH + this.entries.length * (rowH + 8) + 18;

    // 패널 프레임
    const frame = this.add.graphics();
    frame.fillStyle(0x081422, 0.88);
    frame.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, panelH, 8);
    frame.lineStyle(1.5, 0x2a5a8a, 0.9);
    frame.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_W, panelH, 8);
    // 상단 포인트 라인
    frame.lineStyle(2, 0x5fe8c8, 0.7);
    frame.lineBetween(PANEL_X + 16, PANEL_Y + 40, PANEL_X + PANEL_W - 16, PANEL_Y + 40);
    this.panelContainer.add(frame);

    // 뷰 타이틀
    const viewTitle = this.view === 'main' ? 'MAIN MENU'
      : this.view === 'start' ? 'GAME START'
      : this.slotMode === 'new' ? 'NEW GAME — 슬롯 선택' : 'LOAD GAME — 슬롯 선택';
    const titleText = this.add.text(PANEL_X + 20, PANEL_Y + 18, viewTitle, {
      fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: '#7fb8d8',
    }).setOrigin(0, 0.5);
    this.panelContainer.add(titleText);

    // 항목 행
    this.entries.forEach((entry, i) => {
      const ry = PANEL_Y + titleH + i * (rowH + 8);
      const bg = this.add.graphics();
      const label = this.add.text(PANEL_X + 34, ry + (this.view === 'slots' ? 14 : rowH / 2), entry.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', fontStyle: 'bold',
        color: entry.disabled ? '#4a5a68' : '#d0e8f5',
      }).setOrigin(0, 0.5);

      let sub: Phaser.GameObjects.Text | undefined;
      if (entry.sub) {
        sub = this.add.text(PANEL_X + 34, ry + 38, entry.sub, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px',
          color: entry.disabled ? '#3a4652' : '#7f9ab0', lineSpacing: 3,
        }).setOrigin(0, 0);
      }

      const hit = this.add.rectangle(PANEL_X + PANEL_W / 2, ry + rowH / 2, PANEL_W - 16, rowH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: !entry.disabled });
      hit.on('pointerover', () => {
        if (entry.disabled) return;
        this.selectedIndex = i;
        this.paintRows();
      });
      hit.on('pointerdown', () => {
        if (entry.disabled) return;
        this.selectedIndex = i;
        this.paintRows();
        entry.action();
      });

      this.panelContainer.add([bg, label, hit]);
      if (sub) this.panelContainer.add(sub);
      this.rowObjs.push({ bg, label, sub, y: ry, h: rowH });

      // 슬롯 뷰: 데이터가 있는 슬롯에 삭제 버튼 (2단계 확인)
      if (this.view === 'slots' && i < SAVE_SLOT_COUNT && GameState.getSlotMeta(i + 1).exists) {
        this.addSlotDeleteButton(i + 1, ry, rowH);
      }
    });

    // 하단 조작 힌트
    const hint = this.add.text(PANEL_X + PANEL_W / 2, PANEL_Y + panelH + 14,
      this.view === 'main' ? '↑↓ 이동 · Enter 선택' : '↑↓ 이동 · Enter 선택 · ESC 뒤로',
      { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#5a7a94' },
    ).setOrigin(0.5, 0);
    this.panelContainer.add(hint);

    this.paintRows();
  }

  /**
   * 슬롯 삭제 버튼 (행 우측) — 1차 클릭: 삭제 확인 표시, 2차 클릭: 삭제.
   * 다른 곳을 조작하면 확인 상태는 초기화된다.
   */
  private addSlotDeleteButton(slot: number, rowY: number, rowH: number): void {
    const bx = PANEL_X + PANEL_W - 46;
    const by = rowY + rowH / 2;

    const bg = this.add.graphics();
    const label = this.add.text(bx, by, '삭제', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ff9a9a', fontStyle: 'bold',
    }).setOrigin(0.5);

    const paint = (confirming: boolean): void => {
      bg.clear();
      bg.fillStyle(confirming ? 0x7a2020 : 0x3a2020, 0.95);
      bg.fillRoundedRect(bx - 28, by - 15, 56, 30, 4);
      bg.lineStyle(1.5, confirming ? 0xff6a5a : 0x8a4a4a, 1);
      bg.strokeRoundedRect(bx - 28, by - 15, 56, 30, 4);
      label.setText(confirming ? '확인' : '삭제');
      label.setColor(confirming ? '#ffffff' : '#ff9a9a');
    };
    paint(false);

    const hit = this.add.rectangle(bx, by, 56, 30, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => label.setColor('#ffffff'));
    hit.on('pointerout', () => label.setColor(this.deleteConfirmSlot === slot ? '#ffffff' : '#ff9a9a'));
    hit.on('pointerdown', () => {
      if (this.deleteConfirmSlot === slot) {
        GameState.deleteSlot(slot);
        this.buildView();   // 슬롯 목록 갱신 (LOAD 뷰에서 저장이 모두 사라지면 빈 슬롯 표시)
      } else {
        this.deleteConfirmSlot = slot;
        paint(true);
        const row = this.rowObjs[slot - 1];
        row?.label.setText(`슬롯 ${slot} — 정말 삭제하시겠습니까?`);
        row?.label.setColor('#ff6a5a');
      }
    });

    this.panelContainer.add([bg, label, hit]);
  }

  /** 선택 표시 — 폰트/텍스트는 절대 바꾸지 않고 색 + 좌측 바 + 배경만 변경 */
  private paintRows(): void {
    this.rowObjs.forEach((row, i) => {
      const entry = this.entries[i];
      const selected = i === this.selectedIndex && !entry.disabled;
      row.bg.clear();
      if (selected) {
        row.bg.fillStyle(0x123448, 0.9);
        row.bg.fillRoundedRect(PANEL_X + 12, row.y, PANEL_W - 24, row.h, 5);
        row.bg.fillStyle(0x5fe8c8, 1);
        row.bg.fillRoundedRect(PANEL_X + 12, row.y + 6, 4, row.h - 12, 2);
      } else {
        row.bg.fillStyle(0x0c1c2c, 0.55);
        row.bg.fillRoundedRect(PANEL_X + 12, row.y, PANEL_W - 24, row.h, 5);
      }
      row.label.setColor(entry.disabled ? '#4a5a68' : selected ? '#5fe8c8' : '#d0e8f5');
    });
  }

  // ── 뷰별 항목 정의 ──────────────────────────────────
  private buildMainEntries(): MenuEntry[] {
    return [
      { label: '게임 시작', action: () => { this.view = 'start'; this.buildView(); } },
      { label: '도감', action: () => this.openAnglerLog() },
      { label: '설정', action: () => this.openSettings() },
      { label: '게임 종료', action: () => this.quitGame() },
    ];
  }

  private buildStartEntries(): MenuEntry[] {
    const anySave = this.anySlotExists();
    return [
      { label: 'NEW GAME', sub: undefined, action: () => { this.slotMode = 'new'; this.view = 'slots'; this.buildView(); } },
      {
        label: 'LOAD GAME',
        sub: anySave ? undefined : undefined,
        disabled: !anySave,
        action: () => { this.slotMode = 'load'; this.view = 'slots'; this.buildView(); },
      },
      { label: '뒤로', action: () => { this.view = 'main'; this.buildView(); } },
    ];
  }

  private buildSlotEntries(): MenuEntry[] {
    const entries: MenuEntry[] = [];
    for (let s = 1; s <= SAVE_SLOT_COUNT; s++) {
      const meta = GameState.getSlotMeta(s);
      if (meta.exists) {
        const when = meta.savedAt
          ? `${meta.savedAt.getFullYear()}.${String(meta.savedAt.getMonth() + 1).padStart(2, '0')}.${String(meta.savedAt.getDate()).padStart(2, '0')} ${String(meta.savedAt.getHours()).padStart(2, '0')}:${String(meta.savedAt.getMinutes()).padStart(2, '0')}`
          : '-';
        entries.push({
          label: `슬롯 ${s} — ${meta.nickname}`,
          sub: `Lv.${meta.level} · ${(meta.coins ?? 0).toLocaleString()}원 · 저장 ${when}`,
          action: () => this.onSlotPicked(s, true),
        });
      } else {
        entries.push({
          label: `슬롯 ${s} — 빈 슬롯`,
          sub: this.slotMode === 'new' ? '새 여정을 시작합니다' : '저장된 데이터가 없습니다',
          disabled: this.slotMode === 'load',
          action: () => this.onSlotPicked(s, false),
        });
      }
    }
    entries.push({ label: '뒤로', action: () => { this.view = 'start'; this.buildView(); } });
    return entries;
  }

  private anySlotExists(): boolean {
    for (let s = 1; s <= SAVE_SLOT_COUNT; s++) {
      if (GameState.getSlotMeta(s).exists) return true;
    }
    return false;
  }

  // ── 슬롯 선택 처리 ──────────────────────────────────
  private onSlotPicked(slot: number, exists: boolean): void {
    if (this.slotMode === 'load') {
      if (!exists) return;
      if (GameState.loadFromSlot(slot)) this.startAdventure();
      return;
    }
    // NEW GAME: 기존 데이터가 있으면 2단계 확인 (덮어쓰기)
    if (exists && this.confirmSlot !== slot) {
      this.confirmSlot = slot;
      const row = this.rowObjs[slot - 1];
      row?.label.setText(`슬롯 ${slot} — 덮어쓰시겠습니까? (다시 선택)`);
      row?.label.setColor('#ff8a5a');
      return;
    }
    GameState.startNewGameInSlot(slot);
    this.startAdventure();
  }

  private startAdventure(): void {
    this.cameras.main.fadeOut(320, 1, 8, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('WorldMapScene');
    });
  }

  // ── 도감 / 설정 / 종료 ─────────────────────────────
  private openAnglerLog(): void {
    this.cameras.main.fadeOut(200, 1, 8, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.pause('MainMenuScene');
      this.scene.launch('AnglerLogScene', { returnScene: 'MainMenuScene' });
    });
    this.events.once('resume', () => this.cameras.main.fadeIn(220, 1, 8, 18));
  }

  private openSettings(): void {
    this.cameras.main.fadeOut(200, 1, 8, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.pause('MainMenuScene');
      this.scene.launch('SettingsScene');
    });
    this.events.once('resume', () => this.cameras.main.fadeIn(220, 1, 8, 18));
  }

  private quitGame(): void {
    this.cameras.main.fadeOut(420, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      GameState.save();
      window.close();
      // 브라우저에서 window.close()가 무시될 수 있음 — 안내 표시
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
        '저장 완료. 창을 닫아 게임을 종료하세요.', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#8faabf',
        }).setOrigin(0.5).setDepth(200);
      this.cameras.main.fadeIn(200, 0, 0, 0);
    });
  }

  // ═══════════════════════════════════════════════════
  // 하단 정보 바 (시간 + 실황 환경)
  // ═══════════════════════════════════════════════════
  private drawBottomBar(): void {
    const barY = GAME_HEIGHT - 26;
    const bg = this.add.graphics().setDepth(40);
    bg.fillStyle(0x04101e, 0.85);
    bg.fillRect(0, barY - 6, GAME_WIDTH, 32);

    const timeText = this.add.text(16, barY, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#5fe8c8',
    }).setDepth(41);
    const tick = (): void => {
      const now = new Date();
      timeText.setText(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    };
    tick();
    this.time.addEvent({ delay: 1000, loop: true, callback: tick });

    this.environmentText = this.add.text(GAME_WIDTH / 2, barY, '실황 환경 데이터 로드 중...', {
      fontFamily: 'monospace', fontSize: '11px', color: '#5a7a94',
    }).setOrigin(0.5, 0).setDepth(41);

    this.add.text(GAME_WIDTH - 16, barY, 'v0.7 dev', {
      fontFamily: 'monospace', fontSize: '11px', color: '#3a5a74',
    }).setOrigin(1, 0).setDepth(41);
  }

  private async loadEnvironmentData(): Promise<void> {
    const env = await EnvironmentStore.fetchEnvironment('geoje_gujora_breakwater');
    if (env && this.environmentText) {
      const { tide, weather } = env;
      this.environmentText.setText(
        `거제 구조라 | ${tide.tidePhaseLabel} | 수온 ${weather.seaSurfaceTempC}°C | 풍속 ${weather.windSpeedMs}m/s ${weather.windDirectionLabel}`,
      );
      this.environmentText.setColor('#7fb8d8');
    }

    // 공공 API 수집 완료 후 바다낚시지수 표기 추가
    await ExternalDataStore.fetchAll();
    const idx = ExternalDataStore.getFishingIndexInfo();
    if (idx && this.environmentText && this.environmentText.active) {
      this.environmentText.setText(
        `${this.environmentText.text} | 낚시지수(${idx.placeName}) ${idx.indexLabel}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════
  // 키보드 내비게이션
  // ═══════════════════════════════════════════════════
  private setupKeyboard(): void {
    const move = (dir: number): void => {
      const n = this.entries.length;
      let next = this.selectedIndex;
      // disabled 항목 건너뛰기
      for (let step = 0; step < n; step++) {
        next = (next + dir + n) % n;
        if (!this.entries[next]?.disabled) break;
      }
      this.selectedIndex = next;
      this.confirmSlot = null;
      this.deleteConfirmSlot = null;
      this.paintRows();
    };

    this.input.keyboard?.on('keydown-UP', () => move(-1));
    this.input.keyboard?.on('keydown-DOWN', () => move(1));
    const activate = (): void => {
      const entry = this.entries[this.selectedIndex];
      if (entry && !entry.disabled) entry.action();
    };
    this.input.keyboard?.on('keydown-ENTER', activate);
    this.input.keyboard?.on('keydown-SPACE', activate);

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.view === 'slots') { this.view = 'start'; this.buildView(); }
      else if (this.view === 'start') { this.view = 'main'; this.buildView(); }
    });
  }
}
