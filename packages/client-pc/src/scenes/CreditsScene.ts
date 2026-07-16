/**
 * @file CreditsScene.ts
 * @description 데이터 출처 · 저작권 고지 화면
 *
 * 공공데이터포털/공공누리 이용약관의 **출처 표시 의무**를 이행하는 화면.
 * 메인 메뉴 '데이터 출처'에서 진입한다 (pause + launch → stop + resume).
 *
 * 표시 내용은 `DATA_ATTRIBUTIONS`(@tra/core)가 원본 — 새 API를 연동하면
 * 그 목록에 추가하기만 하면 이 화면에 자동 반영된다.
 *
 * 조작: ↑↓ / 마우스 휠 스크롤 · ESC 또는 [뒤로] 복귀
 */

import Phaser from 'phaser';
import { LICENSE_LABEL, groupAttributionsByProvider } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

interface CreditsInit {
  /** 복귀할 씬 키 (기본 MainMenuScene) */
  returnScene?: string;
}

// ── 레이아웃 ────────────────────────────────────────
const MARGIN_X = 90;
const HEADER_H = 118;
const FOOTER_H = 64;
const CONTENT_X = MARGIN_X + 28;
const CONTENT_W = GAME_WIDTH - MARGIN_X * 2 - 56;

export class CreditsScene extends Phaser.Scene {
  private returnScene = 'MainMenuScene';
  /** 스크롤되는 본문 컨테이너 */
  private content!: Phaser.GameObjects.Container;
  private scrollY = 0;
  /** 본문 총 높이 (스크롤 한계 계산용) */
  private contentH = 0;
  /** 본문 표시 영역 높이 */
  private viewH = 0;
  private scrollbar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'CreditsScene' });
  }

  init(data: CreditsInit): void {
    this.returnScene = data?.returnScene ?? 'MainMenuScene';
    this.scrollY = 0;
  }

  create(): void {
    this.viewH = GAME_HEIGHT - HEADER_H - FOOTER_H - 24;

    this.drawBackdrop();
    this.drawHeader();
    this.buildContent();
    this.drawFooter();
    this.setupInput();

    this.cameras.main.fadeIn(220, 1, 8, 18);
  }

  // ═══════════════════════════════════════════════════
  // 배경 / 헤더 / 푸터
  // ═══════════════════════════════════════════════════
  private drawBackdrop(): void {
    // 딤 + 양피지 톤 패널 (게임 전반 팝업 톤과 통일)
    const dim = this.add.graphics();
    dim.fillStyle(0x02060c, 0.92);
    dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics();
    panel.fillStyle(0x0a1628, 0.97);
    panel.fillRoundedRect(MARGIN_X, 40, GAME_WIDTH - MARGIN_X * 2, GAME_HEIGHT - 80, 6);
    panel.lineStyle(2, 0x2a5a8a, 0.9);
    panel.strokeRoundedRect(MARGIN_X, 40, GAME_WIDTH - MARGIN_X * 2, GAME_HEIGHT - 80, 6);
  }

  private drawHeader(): void {
    this.add.text(CONTENT_X, 66, '데이터 출처 및 저작권', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '22px', color: '#e8f4fd', fontStyle: 'bold',
    });

    this.add.text(CONTENT_X, 96,
      '이 게임은 대한민국 공공데이터를 활용합니다. 아래 데이터의 저작권은 각 제공기관에 있습니다.', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#9fd0e4',
      wordWrap: { width: CONTENT_W },
    });

    const line = this.add.graphics();
    line.lineStyle(1, 0x2a5a8a, 0.7);
    line.lineBetween(CONTENT_X, HEADER_H + 8, CONTENT_X + CONTENT_W, HEADER_H + 8);
  }

  private drawFooter(): void {
    const y = GAME_HEIGHT - FOOTER_H + 6;
    const line = this.add.graphics();
    line.lineStyle(1, 0x2a5a8a, 0.7);
    line.lineBetween(CONTENT_X, y - 6, CONTENT_X + CONTENT_W, y - 6);

    this.add.text(CONTENT_X, y + 6,
      '공공데이터포털(data.go.kr) 제공 데이터 · 출처 표시 후 이용', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7a97ab',
    });

    // 뒤로 버튼
    const bw = 96, bh = 30;
    const bx = CONTENT_X + CONTENT_W - bw, by = y + 2;
    const g = this.add.graphics();
    this.drawButton(g, bx, by, bw, bh, false);

    const label = this.add.text(bx + bw / 2, by + bh / 2, '뒤로 (ESC)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#cfe3f2',
    }).setOrigin(0.5);

    const zone = this.add.zone(bx, by, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { this.drawButton(g, bx, by, bw, bh, true); label.setColor('#ffffff'); });
    zone.on('pointerout', () => { this.drawButton(g, bx, by, bw, bh, false); label.setColor('#cfe3f2'); });
    zone.on('pointerup', () => this.close());
  }

  private drawButton(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, hover: boolean): void {
    g.clear();
    g.fillStyle(hover ? 0x2a5a8a : 0x16293e, 1);
    g.fillRoundedRect(x, y, w, h, 3);
    g.lineStyle(1.5, hover ? 0x6fd3e0 : 0x2a5a8a, 1);
    g.strokeRoundedRect(x, y, w, h, 3);
  }

  // ═══════════════════════════════════════════════════
  // 본문 — DATA_ATTRIBUTIONS 렌더 (제공기관별 그룹)
  // ═══════════════════════════════════════════════════
  private buildContent(): void {
    this.content = this.add.container(0, HEADER_H + 20);

    let y = 0;
    for (const { provider, items } of groupAttributionsByProvider()) {
      // 제공기관 헤더
      const head = this.add.text(0, y, provider, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#ffcc44', fontStyle: 'bold',
      });
      this.content.add(head);
      y += 24;

      for (const a of items) {
        const bullet = this.add.graphics();
        bullet.fillStyle(0x6fd3e0, 0.9);
        bullet.fillRect(2, y + 6, 3, 3);
        this.content.add(bullet);

        const svc = this.add.text(14, y, a.service, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd',
          wordWrap: { width: CONTENT_W - 14 },
        });
        this.content.add(svc);
        y += svc.height + 2;

        const usage = this.add.text(14, y, `사용: ${a.usage}`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
          wordWrap: { width: CONTENT_W - 14 },
        });
        this.content.add(usage);
        y += usage.height + 2;

        const lic = this.add.text(14, y, `${LICENSE_LABEL[a.license]}${a.url ? `  ·  ${a.url}` : ''}`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#7a97ab',
          wordWrap: { width: CONTENT_W - 14 },
        });
        this.content.add(lic);
        y += lic.height + 14;
      }
      y += 6;
    }

    // 게임 자체 고지
    const note = this.add.text(0, y,
      '※ 위 공공데이터는 각 제공기관의 이용약관에 따라 출처를 표시하고 이용합니다.\n' +
      '※ 실시간 데이터는 제공기관 사정에 따라 지연·중단될 수 있으며, 이 경우 게임 내부 대체 데이터로 동작합니다.\n' +
      '※ 게임 내 장비 브랜드명은 실존 브랜드와 무관한 가상의 명칭입니다.', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7a97ab',
      lineSpacing: 5, wordWrap: { width: CONTENT_W },
    });
    this.content.add(note);
    y += note.height;

    this.contentH = y;

    // 본문 영역 밖으로 넘치지 않도록 마스크
    const maskG = this.make.graphics({});
    maskG.fillRect(CONTENT_X, HEADER_H + 16, CONTENT_W, this.viewH);
    this.content.setMask(maskG.createGeometryMask());
    this.content.x = CONTENT_X;

    this.scrollbar = this.add.graphics();
    this.updateScrollbar();
  }

  // ═══════════════════════════════════════════════════
  // 스크롤
  // ═══════════════════════════════════════════════════
  private maxScroll(): number {
    return Math.max(0, this.contentH - this.viewH);
  }

  private applyScroll(delta: number): void {
    const max = this.maxScroll();
    this.scrollY = Phaser.Math.Clamp(this.scrollY + delta, 0, max);
    this.content.y = HEADER_H + 20 - this.scrollY;
    this.updateScrollbar();
  }

  private updateScrollbar(): void {
    const max = this.maxScroll();
    this.scrollbar.clear();
    if (max <= 0) return;   // 스크롤 불필요하면 표시하지 않음

    const trackX = CONTENT_X + CONTENT_W + 10;
    const trackY = HEADER_H + 16;
    this.scrollbar.fillStyle(0x16293e, 0.8);
    this.scrollbar.fillRoundedRect(trackX, trackY, 5, this.viewH, 2);

    const ratio = this.viewH / this.contentH;
    const thumbH = Math.max(24, this.viewH * ratio);
    const thumbY = trackY + (this.viewH - thumbH) * (this.scrollY / max);
    this.scrollbar.fillStyle(0x6fd3e0, 0.85);
    this.scrollbar.fillRoundedRect(trackX, thumbY, 5, thumbH, 2);
  }

  private setupInput(): void {
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.applyScroll(dy * 0.5);
    });
    this.input.keyboard?.on('keydown-DOWN', () => this.applyScroll(36));
    this.input.keyboard?.on('keydown-UP', () => this.applyScroll(-36));
    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  // ═══════════════════════════════════════════════════
  // 복귀 — 하위 씬 규칙: stop() + resume(부모)
  // ═══════════════════════════════════════════════════
  private close(): void {
    this.cameras.main.fadeOut(200, 1, 8, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume(this.returnScene);
    });
  }
}
