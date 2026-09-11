/**
 * @file HelpLibraryPanel.ts
 * @description 도움말 라이브러리 — 좌측 3단 트리(카테고리 › 섹션 › 토픽) + 우측 스크롤 본문 (116차)
 *
 * 레이아웃 근거: 원신 "튜토리얼/아카이브"·몬스터헌터 "헌터 노트"처럼 **좌측 목차 + 우측 상세**가
 * 대량 콘텐츠에 표준이다(상단 탭은 2단 이상 깊이를 못 담는다 — 사용자 제안과 일치).
 *  - 트리: 인터랙티브 행이라 **윈도우드 렌더**(보이는 행만 생성) + 휠 + 스크롤바 (ui-panel 규칙).
 *  - 본문: 비인터랙티브 텍스트/이미지라 **GeometryMask + 휠 + 스크롤바**. 마스크는 화면 고정
 *    (scrollFactor 0) + 패널 드래그를 postupdate로 추종.
 *  - 크기 1080×656(손질 창과 동일) · 헤더 드래그 · X · ESC LIFO(popupStack) · 일반 팝업 밴드 상단.
 * 데이터는 data/HelpContent.ts — 페이지 이미지는 텍스처 있으면 그리고 없으면 "준비 중" 프레임.
 */

import Phaser from 'phaser';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { HELP_LIBRARY, findHelpTopic, HelpCategory, HelpSection, HelpTopic, HelpPage } from '../data/HelpContent.js';
import { getLocale, t as tr } from '../i18n/I18n.js';

export interface HelpLibraryConfig {
  onClose: () => void;
  /** 처음 열 토픽 id (예: 'keys-field') */
  initialTopic?: string;
}

const PANEL_W = 1080;
const PANEL_H = 656;
const TREE_W = 300;
const ROW_H = 26;
const CONTENT_X = TREE_W + 16;
const CONTENT_W = PANEL_W - CONTENT_X - 16;
const IMG_W = CONTENT_W - 60;
const BODY_FONT = '"Noto Sans KR", sans-serif';

type TreeRow =
  | { kind: 'cat'; cat: HelpCategory; depth: 0 }
  | { kind: 'sec'; cat: HelpCategory; sec: HelpSection; depth: 1 }
  | { kind: 'topic'; cat: HelpCategory; sec: HelpSection; topic: HelpTopic; depth: 2 };

export class HelpLibraryPanel extends DraggablePanel {
  private expanded = new Set<string>();
  private selectedTopic: string | null = null;
  private treeScroll = 0;
  private treeC?: Phaser.GameObjects.Container;
  private treeBarG!: Phaser.GameObjects.Graphics;
  private contentC?: Phaser.GameObjects.Container;
  private contentInner?: Phaser.GameObjects.Container;
  private contentMask?: Phaser.GameObjects.Graphics;
  private contentBarG!: Phaser.GameObjects.Graphics;
  private contentScroll = 0;
  private contentH = 0;
  private crumb!: Phaser.GameObjects.Text;
  private wheelHandler?: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;
  private postUpdate?: () => void;
  private lastPanelX = NaN;
  private lastPanelY = NaN;

  constructor(scene: Phaser.Scene, cfg: HelpLibraryConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: Math.max(8, (GAME_HEIGHT - PANEL_H) / 2),
      width: PANEL_W, height: PANEL_H,
      title: '도움말 라이브러리', onClose: cfg.onClose, dim: false, depth: 890,
    });
    // 첫 카테고리 펼침 + 초기 토픽
    for (const c of HELP_LIBRARY) { if (c.id === 'start') this.expanded.add(c.id); }
    const init = cfg.initialTopic ? findHelpTopic(cfg.initialTopic) : null;
    if (init) {
      this.expanded.add(init.cat.id); this.expanded.add(`${init.cat.id}/${init.sec.id}`);
      this.selectedTopic = init.topic.id;
    } else {
      const first = HELP_LIBRARY[0].sections[0];
      this.expanded.add(`${HELP_LIBRARY[0].id}/${first.id}`);
      this.selectedTopic = first.topics[0].id;
    }
    this.buildStatic();
    this.renderTree();
    this.renderContent();
    // 휠 — 호버 중인 영역(트리/본문)만 스크롤 (다른 패널 휠과 충돌 방지)
    this.wheelHandler = (p, _go, _dx, dy) => {
      const lx = p.x - this.x, ly = p.y - this.y;
      if (ly < this.contentTop || ly > PANEL_H || lx < 0 || lx > PANEL_W) return;
      if (lx < TREE_W) this.setTreeScroll(this.treeScroll + Math.sign(dy));
      else this.setContentScroll(this.contentScroll + Math.sign(dy) * 40);
    };
    scene.input.on('wheel', this.wheelHandler);
    // 패널 드래그 추종 — 마스크는 월드 좌표라 패널이 움직이면 다시 그린다
    this.postUpdate = () => { if (this.x !== this.lastPanelX || this.y !== this.lastPanelY) this.syncMask(); };
    scene.events.on('postupdate', this.postUpdate);
  }

  /** 외부에서 토픽 이동 (열린 상태) */
  showTopic(id: string): void {
    const hit = findHelpTopic(id);
    if (!hit) return;
    this.expanded.add(hit.cat.id); this.expanded.add(`${hit.cat.id}/${hit.sec.id}`);
    this.selectedTopic = id;
    this.renderTree(); this.renderContent();
  }

  // ── 정적 프레임 (트리/본문 구분선 · 브레드크럼 · 스크롤바 그래픽) ──
  private buildStatic(): void {
    const g = this.scene.add.graphics();
    g.fillStyle(0x0a1b2d, 0.6);
    g.fillRoundedRect(8, this.contentTop - 4, TREE_W - 12, PANEL_H - this.contentTop - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1);
    g.strokeRoundedRect(8, this.contentTop - 4, TREE_W - 12, PANEL_H - this.contentTop - 8, 6);
    g.fillStyle(0x0c1e30, 0.55);
    g.fillRoundedRect(CONTENT_X - 6, this.contentTop - 4, CONTENT_W + 12, PANEL_H - this.contentTop - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1);
    g.strokeRoundedRect(CONTENT_X - 6, this.contentTop - 4, CONTENT_W + 12, PANEL_H - this.contentTop - 8, 6);
    this.add(g);
    this.crumb = this.scene.add.text(CONTENT_X + 6, this.contentTop + 4, '', {
      fontFamily: BODY_FONT, fontSize: '11px', color: '#7fb8d8',
    });
    this.add(this.crumb);
    this.treeBarG = this.scene.add.graphics();
    this.contentBarG = this.scene.add.graphics();
    this.add([this.treeBarG, this.contentBarG]);
  }

  // ═══════════════════════ 좌측 트리 (윈도우드 렌더) ═══════════════════════
  private flatRows(): TreeRow[] {
    const rows: TreeRow[] = [];
    for (const cat of HELP_LIBRARY) {
      rows.push({ kind: 'cat', cat, depth: 0 });
      if (!this.expanded.has(cat.id)) continue;
      for (const sec of cat.sections) {
        rows.push({ kind: 'sec', cat, sec, depth: 1 });
        if (!this.expanded.has(`${cat.id}/${sec.id}`)) continue;
        for (const topic of sec.topics) rows.push({ kind: 'topic', cat, sec, topic, depth: 2 });
      }
    }
    return rows;
  }

  private treeVisRows(): number {
    return Math.floor((PANEL_H - this.contentTop - 12) / ROW_H);
  }

  private setTreeScroll(v: number): void {
    const max = Math.max(0, this.flatRows().length - this.treeVisRows());
    this.treeScroll = Phaser.Math.Clamp(v, 0, max);
    this.renderTree();
  }

  private renderTree(): void {
    this.treeC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.treeC = c;
    this.add(c);
    const rows = this.flatRows();
    const vis = this.treeVisRows();
    const maxScroll = Math.max(0, rows.length - vis);
    this.treeScroll = Phaser.Math.Clamp(this.treeScroll, 0, maxScroll);
    const y0 = this.contentTop + 2;
    const rowW = TREE_W - 24 - (maxScroll > 0 ? 8 : 0);
    rows.slice(this.treeScroll, this.treeScroll + vis).forEach((row, i) => {
      const ry = y0 + i * ROW_H;
      const indent = 14 + row.depth * 16;
      const isTopic = row.kind === 'topic';
      const sel = isTopic && row.topic.id === this.selectedTopic;
      const open = row.kind === 'cat' ? this.expanded.has(row.cat.id)
        : row.kind === 'sec' ? this.expanded.has(`${row.cat.id}/${row.sec.id}`) : false;
      if (sel) {
        const bg = this.scene.add.graphics();
        bg.fillStyle(0xffce54, 0.18); bg.fillRoundedRect(12, ry, rowW, ROW_H - 2, 4);
        bg.lineStyle(1, 0xffce54, 0.6); bg.strokeRoundedRect(12, ry, rowW, ROW_H - 2, 4);
        c.add(bg);
      }
      const glyph = row.kind === 'topic' ? '·' : open ? '▾' : '▸';
      const label = row.kind === 'cat' ? row.cat.label : row.kind === 'sec' ? row.sec.label : row.topic.label;
      const planned = isTopic && row.topic.status === 'planned';
      const t = this.scene.add.text(indent, ry + ROW_H / 2, `${glyph} ${label}${planned ? '  (준비 중)' : ''}`, {
        fontFamily: BODY_FONT,
        fontSize: row.kind === 'cat' ? '13px' : row.kind === 'sec' ? '12px' : '12px',
        color: sel ? '#ffe9b0' : row.kind === 'cat' ? '#e8f4fd' : row.kind === 'sec' ? '#bcd6e8' : planned ? '#7a8a96' : '#9fc0d4',
        fontStyle: row.kind === 'cat' ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);
      if (t.width > rowW - (indent - 12)) t.setScale((rowW - (indent - 12)) / t.width);
      c.add(t);
      const hit = this.scene.add.rectangle(12 + rowW / 2, ry + ROW_H / 2 - 1, rowW, ROW_H - 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { if (!sel) t.setColor('#ffffff'); });
      hit.on('pointerout', () => { if (!sel) t.setColor(row.kind === 'cat' ? '#e8f4fd' : row.kind === 'sec' ? '#bcd6e8' : planned ? '#7a8a96' : '#9fc0d4'); });
      hit.on('pointerdown', () => {
        if (row.kind === 'cat') {
          if (this.expanded.has(row.cat.id)) this.expanded.delete(row.cat.id); else this.expanded.add(row.cat.id);
        } else if (row.kind === 'sec') {
          const k = `${row.cat.id}/${row.sec.id}`;
          if (this.expanded.has(k)) this.expanded.delete(k); else this.expanded.add(k);
        } else {
          this.selectedTopic = row.topic.id;
          this.contentScroll = 0;
          this.renderContent();
        }
        this.renderTree();
      });
      c.add(hit);
    });
    // 스크롤바 (넘칠 때만)
    this.treeBarG.clear();
    if (maxScroll > 0) {
      const trackX = TREE_W - 12, trackY = y0, trackH = vis * ROW_H;
      this.treeBarG.fillStyle(0x000000, 0.28); this.treeBarG.fillRoundedRect(trackX, trackY, 5, trackH, 2);
      const thumbH = Math.max(22, trackH * vis / rows.length);
      const thumbY = trackY + (trackH - thumbH) * (this.treeScroll / maxScroll);
      this.treeBarG.fillStyle(0x7fb8d8, 0.6); this.treeBarG.fillRoundedRect(trackX, thumbY, 5, thumbH, 2);
    }
    applyScreenFixed(this);
  }

  // ═══════════════════════ 우측 본문 (마스크 + 휠) ═══════════════════════
  private contentViewH(): number {
    return PANEL_H - this.contentTop - 32;
  }

  private setContentScroll(v: number): void {
    const max = Math.max(0, this.contentH - this.contentViewH());
    this.contentScroll = Phaser.Math.Clamp(v, 0, max);
    this.contentInner?.setY(-this.contentScroll);
    this.drawContentBar();
  }

  private drawContentBar(): void {
    const g = this.contentBarG;
    g.clear();
    const viewH = this.contentViewH();
    const max = Math.max(0, this.contentH - viewH);
    if (max <= 0) return;
    const trackX = PANEL_W - 14, trackY = this.contentTop + 24;
    g.fillStyle(0x000000, 0.28); g.fillRoundedRect(trackX, trackY, 5, viewH, 2);
    const thumbH = Math.max(22, viewH * Math.min(1, viewH / this.contentH));
    const thumbY = trackY + (viewH - thumbH) * (this.contentScroll / max);
    g.fillStyle(0x7fb8d8, 0.6); g.fillRoundedRect(trackX, thumbY, 5, thumbH, 2);
  }

  private renderContent(): void {
    this.contentC?.destroy();
    this.contentMask?.destroy();
    const hit = this.selectedTopic ? findHelpTopic(this.selectedTopic) : null;
    const viewY = this.contentTop + 24;
    const outer = this.scene.add.container(CONTENT_X, viewY);
    const inner = this.scene.add.container(0, 0);
    outer.add(inner);
    this.contentC = outer; this.contentInner = inner;
    this.add(outer);
    this.crumb.setText(hit ? `${hit.cat.label}  ›  ${hit.sec.label}  ›  ${hit.topic.label}` : '');

    let y = 4;
    const pages: HelpPage[] = hit ? hit.topic.pages : [];
    pages.forEach((pg, idx) => {
      const h2 = this.scene.add.text(6, y, `${pages.length > 1 ? `${idx + 1}. ` : ''}${pg.heading}`, {
        fontFamily: BODY_FONT, fontSize: '16px', color: '#7fe0b0', fontStyle: 'bold',
        wordWrap: { width: CONTENT_W - 30 },
      });
      inner.add(h2);
      y += h2.height + 10;
      if (pg.image) {
        // 영어 로케일이면 영문 주석판(`<key>_en`)을 쓰고, 없으면 한국어판으로 폴백한다 (119차 ⑥)
        const enKey = `${pg.image}_en`;
        const key = getLocale() === 'en' && this.scene.textures.exists(enKey) ? enKey : pg.image;
        if (this.scene.textures.exists(key)) {
          const src = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
          const sc = Math.min(1, IMG_W / src.width);
          const dw = Math.round(src.width * sc), dh = Math.round(src.height * sc);
          const frame = this.scene.add.graphics();
          frame.fillStyle(0x0c1e30, 1); frame.fillRoundedRect(4, y - 2, dw + 4, dh + 4, 4);
          frame.lineStyle(1.2, 0x1c3d5a, 1); frame.strokeRoundedRect(4, y - 2, dw + 4, dh + 4, 4);
          const img = this.scene.add.image(6, y, key).setOrigin(0, 0).setDisplaySize(dw, dh);
          inner.add([frame, img]);
          y += dh + 6;
        } else {
          const ph = 120;
          const frame = this.scene.add.graphics();
          frame.fillStyle(0x0c1e30, 0.8); frame.fillRoundedRect(6, y, IMG_W, ph, 4);
          frame.lineStyle(1, 0x2a4a63, 1); frame.strokeRoundedRect(6, y, IMG_W, ph, 4);
          const t = this.scene.add.text(6 + IMG_W / 2, y + ph / 2, '캡처 이미지 준비 중', {
            fontFamily: BODY_FONT, fontSize: '12px', color: '#546a7c',
          }).setOrigin(0.5);
          inner.add([frame, t]);
          y += ph + 6;
        }
        if (pg.imageCaption) {
          const cap = this.scene.add.text(6, y, pg.imageCaption, {
            fontFamily: BODY_FONT, fontSize: '11px', color: '#9fc0d4', wordWrap: { width: CONTENT_W - 30 },
          });
          inner.add(cap);
          y += cap.height + 10;
        }
      }
      for (const para of pg.body) {
        const t = this.scene.add.text(6, y, para, {
          fontFamily: BODY_FONT, fontSize: '13px', color: '#e8f4fd', lineSpacing: 5, wordWrap: { width: CONTENT_W - 30 },
        });
        inner.add(t);
        y += t.height + 10;
      }
      if (pg.keys && pg.keys.length) {
        for (const k of pg.keys) {
          const chip = this.scene.add.text(6, y, k.key, {
            fontFamily: 'monospace', fontSize: '11px', color: '#0b1620', fontStyle: 'bold',
            backgroundColor: '#ffce54', padding: { x: 6, y: 2 },
          });
          const desc = this.scene.add.text(160, y + 1, k.desc, {
            fontFamily: BODY_FONT, fontSize: '12px', color: '#d0e8f5', wordWrap: { width: CONTENT_W - 190 },
          });
          if (chip.width > 146) chip.setScale(146 / chip.width);
          inner.add([chip, desc]);
          y += Math.max(chip.height, desc.height) + 6;
        }
        y += 6;
      }
      if (pg.tips && pg.tips.length) {
        for (const tip of pg.tips) {
          // ⚠ 팁 원문에 ' · '가 들어 있으면 `Tip · ${tip}` 통짜 문자열은 사전에 걸리지 않는다
          // (setText 훅이 구분자로 쪼개면 조각이 사전 키와 어긋난다) — **먼저 번역해 붙인다**.
          const t = this.scene.add.text(6, y, `Tip · ${tr(tip)}`, {
            fontFamily: BODY_FONT, fontSize: '12px', color: '#ffd98a', wordWrap: { width: CONTENT_W - 30 },
          });
          inner.add(t);
          y += t.height + 8;
        }
      }
      if (idx < pages.length - 1) {
        const line = this.scene.add.graphics();
        line.lineStyle(1, 0x1c3d5a, 1); line.lineBetween(6, y + 4, CONTENT_W - 30, y + 4);
        inner.add(line);
        y += 16;
      }
    });
    this.contentH = y + 8;

    // 마스크 (화면 고정 좌표 — 패널 위치 기준으로 그린다)
    const maskG = this.scene.make.graphics({}, false).setScrollFactor(0);
    this.contentMask = maskG;
    outer.setMask(maskG.createGeometryMask());
    this.lastPanelX = NaN;   // 강제 재동기화
    this.syncMask();
    this.setContentScroll(this.contentScroll);
    applyScreenFixed(this);
  }

  private syncMask(): void {
    const g = this.contentMask;
    if (!g) return;
    this.lastPanelX = this.x; this.lastPanelY = this.y;
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(this.x + CONTENT_X - 2, this.y + this.contentTop + 22, CONTENT_W - 4, this.contentViewH() + 4);
  }

  override destroy(fromScene?: boolean): void {
    if (this.wheelHandler) this.scene?.input?.off('wheel', this.wheelHandler);
    if (this.postUpdate) this.scene?.events?.off('postupdate', this.postUpdate);
    this.contentMask?.destroy();
    super.destroy(fromScene);
  }
}
