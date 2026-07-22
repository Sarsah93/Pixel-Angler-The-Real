/**
 * @file GuidePanel.ts
 * @description 통합 가이드 허브 팝업 — 데이터 구동 (탭 카테고리 × 삽화 카드 페이지)
 *
 * GUIDES(data/GuideContent.ts — 파이트·회수·밑밥·회뜨기)를 받아
 * 상단 탭 + 카드(삽화 PNG + 제목/설명/💡팁) + ◀▶/점 넘김을 렌더한다.
 * 새 시스템 가이드는 GuideCategory 데이터 하나 추가로 끝 (game_guide_hub.html 목업).
 *
 * 진입: 우상단 가이드(?) 버튼/F1 = 허브 열람 + 각 시스템 최초 사용 시 해당
 * 카테고리 1회 자동표시(GameState.flags 'guideSeen.<cat>' — 세이브 저장).
 * DraggablePanel 상속(dim 모달)·ESC LIFO 편입. 기존 텍스트 가이드 대체 (2026-07-23).
 */

import Phaser from 'phaser';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { GAME_WIDTH } from '../PhaserConfig.js';
import { GUIDES, GuideCatKey, guideCategoryOf } from '../data/GuideContent.js';

export interface GuidePanelConfig {
  onClose: () => void;
  /** 열람 시작 카테고리 (기본 첫 탭) */
  initialCat?: GuideCatKey;
}

const PANEL_W = 740;
const PANEL_H = 632;
const ART_W = 640;
const ART_H = 300;
const TABS_Y = 42;
const ART_Y = 82;

export class GuidePanel extends DraggablePanel {
  private catKey: GuideCatKey;
  private page = 0;
  private pageC?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, cfg: GuidePanelConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: 36,
      width: PANEL_W, height: PANEL_H,
      title: '게임 가이드',
      onClose: cfg.onClose, dim: true, depth: 900,
    });
    this.catKey = cfg.initialCat ?? GUIDES[0].key;
    this.renderPage();
  }

  /** 특정 카테고리 탭으로 전환 (열림 상태에서 외부 호출 가능) */
  showCategory(key: GuideCatKey): void {
    this.catKey = key;
    this.page = 0;
    this.renderPage();
  }

  private renderPage(): void {
    this.pageC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.pageC = c;
    this.add(c);
    const cat = guideCategoryOf(this.catKey);
    const pg = cat.pages[Math.min(this.page, cat.pages.length - 1)];

    // ── 상단 탭 (카테고리) ──
    let tx = 14;
    for (const g of GUIDES) {
      const sel = g.key === this.catKey;
      const w = 86;
      const tabG = this.scene.add.graphics();
      tabG.fillStyle(sel ? 0xffce54 : 0x0c2036, 0.97);
      tabG.fillRoundedRect(tx, TABS_Y - 14, w, 28, { tl: 7, tr: 7, bl: 2, br: 2 });
      tabG.lineStyle(1.2, sel ? 0xffce54 : 0x2a5a8a, 1);
      tabG.strokeRoundedRect(tx, TABS_Y - 14, w, 28, { tl: 7, tr: 7, bl: 2, br: 2 });
      const tabT = this.scene.add.text(tx + w / 2, TABS_Y, g.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
        color: sel ? '#0b1620' : '#9fc0d4', fontStyle: sel ? 'bold' : 'normal',
      }).setOrigin(0.5);
      c.add([tabG, tabT]);
      if (!sel) {
        const hit = this.scene.add.rectangle(tx + w / 2, TABS_Y, w, 28, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => tabT.setColor('#e8f4fd'));
        hit.on('pointerout', () => tabT.setColor('#9fc0d4'));
        hit.on('pointerdown', () => this.showCategory(g.key));
        c.add(hit);
      }
      tx += w + 6;
    }

    // ── 삽화 프레임 + 이미지 (640×300) ──
    const artX = (PANEL_W - ART_W) / 2;
    const frame = this.scene.add.graphics();
    frame.fillStyle(0x0c1e30, 1);
    frame.fillRoundedRect(artX - 2, ART_Y - 2, ART_W + 4, ART_H + 4, 6);
    frame.lineStyle(1.5, 0x1c3d5a, 1);
    frame.strokeRoundedRect(artX - 2, ART_Y - 2, ART_W + 4, ART_H + 4, 6);
    c.add(frame);
    if (this.scene.textures.exists(pg.textureKey)) {
      const img = this.scene.add.image(PANEL_W / 2, ART_Y + ART_H / 2, pg.textureKey)
        .setDisplaySize(ART_W, ART_H);
      c.add(img);
    }

    // ── 캡션 (제목/본문/팁 — Phaser Text 오버레이, 문구 수정·지역화 대비) ──
    const capY = ART_Y + ART_H + 16;
    const h2 = this.scene.add.text(artX, capY, `${this.page + 1}. ${pg.heading}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#7fe0b0', fontStyle: 'bold',
    });
    const body = this.scene.add.text(artX, capY + 26, pg.body, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd', lineSpacing: 6,
      wordWrap: { width: ART_W },
    });
    const tip = this.scene.add.text(artX, capY + 26 + Math.max(44, body.height + 8), `💡 ${pg.tip}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#9fc0d4',
      wordWrap: { width: ART_W },
    });
    c.add([h2, body, tip]);

    // ── 푸터: 페이지 점 + ◀▶ 네비 ──
    const footY = PANEL_H - 32;
    const dotGap = 18;
    const dotsX = 30;
    cat.pages.forEach((_, k) => {
      const dot = this.scene.add.circle(dotsX + k * dotGap, footY, 4.5, k === this.page ? 0xffce54 : 0x2a4a63)
        .setInteractive({ useHandCursor: true });
      dot.on('pointerdown', () => { this.page = k; this.renderPage(); });
      c.add(dot);
    });

    const mkNav = (bx: number, label: string, enabled: boolean, onClick: () => void): void => {
      const g = this.scene.add.graphics();
      g.fillStyle(enabled ? 0x153050 : 0x101d2c, 0.95);
      g.fillRoundedRect(bx - 44, footY - 15, 88, 30, 6);
      g.lineStyle(1.2, enabled ? 0x2a5a8a : 0x1c2c3c, 1);
      g.strokeRoundedRect(bx - 44, footY - 15, 88, 30, 6);
      const t = this.scene.add.text(bx, footY, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
        color: enabled ? '#e8f4fd' : '#546a7c', fontStyle: 'bold',
      }).setOrigin(0.5);
      c.add([g, t]);
      if (!enabled) return;
      const hit = this.scene.add.rectangle(bx, footY, 88, 30, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => t.setColor('#ffffff'));
      hit.on('pointerout', () => t.setColor('#e8f4fd'));
      hit.on('pointerdown', onClick);
      c.add(hit);
    };
    const isLast = this.page === cat.pages.length - 1;
    mkNav(PANEL_W - 244, '◀ 이전', this.page > 0, () => { this.page -= 1; this.renderPage(); });
    mkNav(PANEL_W - 144, isLast ? '완료 ✕' : '다음 ▶', true, () => {
      if (isLast) { this.requestClose(); return; }
      this.page += 1;
      this.renderPage();
    });

    applyScreenFixed(this);
  }
}
