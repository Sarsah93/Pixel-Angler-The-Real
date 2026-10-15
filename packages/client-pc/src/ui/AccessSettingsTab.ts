/**
 * @file AccessSettingsTab.ts
 * @description 251차 — 설정 「접근성」 탭. 마우스 포인터(색 · 흰 테 · 크기)와 색 구분 보정을 고른다.
 *
 * - 고르는 즉시 저장 · 적용된다(포인터는 `applyCursorOptions`, 색은 `game.events` 'a11y-changed').
 * - 칸마다 그 값의 실제 그림을 넣고, 오른쪽 미리보기에 밝은 곳 · 어두운 곳 위의 기본 · 누를 수 있는 곳 포인터를 그린다 —
 *   글로 설명하지 않고 보고 고르게 한다(R11).
 * - 그림은 캔버스 텍스처로 구운 것(`a11y_cur_*` 키 — 옵션이 키에 들어가 다시 굽지 않는다).
 * - 색 구분 미리보기는 실제 HUD 신호(낚시 장력 막대 · 설치 칸 · 좋음/주의/위험 점)를 지금 보정 방식으로 그린다.
 */

import Phaser from 'phaser';
import type { GameSettings } from '../scenes/SettingsScene.js';
import {
  CURSOR_CANVAS, handEdgeLevel, paintCursor,
  type CursorEdge, type CursorScale, type CursorStyle,
} from './GameCursor.js';
import { cv, drawBlockedX, drawHatch, shapeCuesOn, type ColorVisionMode } from './ColorAssist.js';

/** 설정 씬이 넘기는 손잡이 */
export interface AccessTabHost {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  settings: GameSettings;
  /** 바뀐 값을 저장하고 게임에 적용한다 */
  commit(): void;
  /** 탭을 다시 그린다 */
  rerender(): void;
}

const FONT = '"Noto Sans KR", sans-serif';
/** 칸 */
const BTN_W = 128;
const BTN_H = 40;
const BTN_GAP = 8;
/** 줄 사이 틈(라벨 · 설명 · 칸 아래) */
const ROW_GAP = 12;

/** 운영체제 화살표 아이콘(고전 화살표 12×19 — B 검정 · W 흰색) — 「운영체제 기본」 칸 그림 */
const SYSTEM_ARROW = [
  'B...........', 'BB..........', 'BWB.........', 'BWWB........', 'BWWWB.......', 'BWWWWB......',
  'BWWWWWB.....', 'BWWWWWWB....', 'BWWWWWWWB...', 'BWWWWWWWWB..', 'BWWWWWWWWWB.', 'BWWWWWWBBBBB',
  'BWWWBWWB....', 'BWWB.BWWB...', 'BWB..BWWB...', 'BB....BWWB..', 'B.....BWWB..', '.......BB...',
];

/** 포인터 그림 텍스처 키(옵션별) — 없으면 굽는다 */
function cursorTexture(scene: Phaser.Scene, style: CursorStyle, edgeLevel: number, m: number): string {
  if (style === 'system') {
    const key = `a11y_cur_system_${m}`;
    if (!scene.textures.exists(key)) {
      const w = SYSTEM_ARROW[0].length, h = SYSTEM_ARROW.length;
      const tex = scene.textures.createCanvas(key, w * m, h * m);
      const g = tex?.getContext();
      if (tex && g) {
        SYSTEM_ARROW.forEach((row, y) => {
          for (let x = 0; x < row.length; x++) {
            if (row[x] === '.') continue;
            g.fillStyle = row[x] === 'B' ? '#000000' : '#ffffff';
            g.fillRect(x * m, y * m, m, m);
          }
        });
        tex.refresh();
      }
    }
    return key;
  }
  const key = `a11y_cur_${style}_${edgeLevel}_${m}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, CURSOR_CANVAS.w * m, CURSOR_CANVAS.h * m);
    const g = tex?.getContext();
    if (tex && g) { paintCursor(g, style, edgeLevel, m); tex.refresh(); }
  }
  return key;
}

interface OptionDef<T> { value: T; label: string; icon?: () => string }

/** 한 줄 — 왼쪽 라벨 · 설명, 오른쪽 칸들(고른 칸은 민트 테) */
function optionRow<T>(
  host: AccessTabHost, x: number, y: number, label: string, desc: string,
  options: OptionDef<T>[], selected: T, onPick: (v: T) => void,
): number {
  const { scene, container } = host;
  // 이름 칸은 칸 단추 앞(160px)까지 — 글꼴이 넓은 컴퓨터(영어 「Shapes as well as colour」)에서도 단추를 덮지 않게 줄을 바꾼다
  const lab = scene.add.text(x, y, label, {
    fontFamily: FONT, fontSize: '14px', color: '#d0e8f5', fontStyle: 'bold', wordWrap: { width: 160 },
  });
  const d = scene.add.text(x, Math.round(lab.y + lab.height), desc, {
    fontFamily: FONT, fontSize: '11px', color: '#607b8e', wordWrap: { width: 150 }, lineSpacing: 1,
  });
  container.add([lab, d]);
  const bx0 = x + 168;
  options.forEach((opt, i) => {
    const bx = bx0 + i * (BTN_W + BTN_GAP);
    const on = opt.value === selected;
    const bg = scene.add.graphics();
    bg.fillStyle(on ? 0x162a40 : 0x0e1c2d, 0.9);
    bg.fillRoundedRect(bx, y, BTN_W, BTN_H, 5);
    bg.lineStyle(2, on ? 0x4af2a1 : 0x2a5a8a, on ? 1 : 0.5);
    bg.strokeRoundedRect(bx, y, BTN_W, BTN_H, 5);
    container.add(bg);
    let tx = bx + BTN_W / 2;
    if (opt.icon) {
      const img = scene.add.image(bx + 8, y + BTN_H / 2, opt.icon()).setOrigin(0, 0.5);
      // 칸 높이에 맞춘다(크게 2배 그림도 칸 안으로) — 도트라 정수배로만 줄인다
      const k = img.height > BTN_H - 6 ? 1 / Math.ceil(img.height / (BTN_H - 6)) : 1;
      img.setScale(k);
      container.add(img);
      tx = bx + 8 + img.displayWidth + (BTN_W - 8 - img.displayWidth) / 2;
    }
    const t = scene.add.text(tx, y + BTN_H / 2, opt.label, {
      fontFamily: FONT, fontSize: '13px', color: on ? '#4af2a1' : '#a0b8c8', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = scene.add.rectangle(bx + BTN_W / 2, y + BTN_H / 2, BTN_W, BTN_H, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => { if (!on) onPick(opt.value); });
    container.add([t, hit]);
  });
  // 흐름 배치 — 설명이 길어(영어) 줄이 늘어도 다음 줄과 겹치지 않게 실제 높이로 내려간다(ui-panel 규칙)
  return Math.max(y + BTN_H, d.y + d.height) + ROW_GAP;
}

/** 오른쪽 미리보기 — 밝은 곳 · 어두운 곳 위 기본 · 누를 수 있는 곳 포인터(실제 크기) */
function cursorPreview(host: AccessTabHost, x: number, y: number, w: number): number {
  const { scene, container, settings } = host;
  const style = settings.cursorStyle;
  const scale = settings.cursorScale;
  const title = scene.add.text(x, y, '미리보기', { fontFamily: FONT, fontSize: '13px', color: '#d0e8f5', fontStyle: 'bold' });
  container.add(title);
  const cellW = Math.floor((w - 8) / 2);
  const cellH = 64;
  const top = y + 22;
  const grounds: { color: number; label: string }[] = [
    { color: 0x5d7a45, label: '밝은 곳' },
    { color: 0x0b1626, label: '어두운 곳' },
  ];
  const kinds: { edge: number; label: string }[] = [
    { edge: settings.cursorEdge, label: '기본 포인터' },
    { edge: handEdgeLevel(settings.cursorEdge), label: '누를 수 있는 곳' },
  ];
  let yy = top;
  kinds.forEach((kind) => {
    const cap = scene.add.text(x, yy, kind.label, { fontFamily: FONT, fontSize: '11px', color: '#8faabf' });
    container.add(cap);
    yy += 16;
    grounds.forEach((gnd, gi) => {
      const cx = x + gi * (cellW + 8);
      const g = scene.add.graphics();
      g.fillStyle(gnd.color, 1);
      g.fillRect(cx, yy, cellW, cellH);
      g.lineStyle(1, 0x2a5a8a, 0.6);
      g.strokeRect(cx, yy, cellW, cellH);
      container.add(g);
      const key = cursorTexture(scene, style, kind.edge, scale);
      const img = scene.add.image(cx + cellW / 2, yy + cellH / 2, key).setOrigin(0.5);
      container.add(img);
    });
    yy += cellH + 8;
  });
  const foot = scene.add.text(x, yy, grounds.map((g) => g.label).join(' · '), {
    fontFamily: FONT, fontSize: '10px', color: '#4e6678',
  });
  container.add(foot);
  return yy + 16;
}

/** 「접근성」 탭 — 포인터 · 색 구분 */
export function renderAccessTab(host: AccessTabHost, panelX: number, panelY: number): void {
  const { scene, container, settings } = host;
  const x = panelX + 32;
  let y = panelY + 110;

  const sec = scene.add.text(x, y, '마우스 포인터', { fontFamily: FONT, fontSize: '15px', color: '#4af2a1', fontStyle: 'bold' });
  container.add(sec);
  y += 28;

  const styleIcon = (s: CursorStyle) => () => cursorTexture(scene, s, 0, 1);
  y = optionRow<CursorStyle>(host, x, y, '포인터 색', '야광찌는 색약이어도 밝기 차로 또렷합니다.', [
    { value: 'float', label: '찌', icon: styleIcon('float') },
    { value: 'glow', label: '야광찌', icon: styleIcon('glow') },
    { value: 'system', label: '운영체제 기본', icon: styleIcon('system') },
  ], settings.cursorStyle, (v) => { settings.cursorStyle = v; host.commit(); host.rerender(); });

  const edgeStyle: CursorStyle = settings.cursorStyle === 'system' ? 'float' : settings.cursorStyle;
  const edgeIcon = (e: number) => () => cursorTexture(scene, edgeStyle, e, 1);
  y = optionRow<CursorEdge>(host, x, y, '흰 테', '누를 수 있는 곳 위에서는 한 단계 더 진해집니다.', [
    { value: 0, label: '테 없음', icon: edgeIcon(0) },
    { value: 1, label: '옅은 테', icon: edgeIcon(1) },
    { value: 2, label: '또렷한 테', icon: edgeIcon(2) },
  ], settings.cursorEdge, (v) => { settings.cursorEdge = v; host.commit(); host.rerender(); });

  y = optionRow<CursorScale>(host, x, y, '포인터 크기', '크게는 브라우저 맨 위에서 잠깐 기본 화살표가 됩니다.', [
    { value: 1, label: '보통' },
    { value: 2, label: '크게' },
  ], settings.cursorScale, (v) => { settings.cursorScale = v; host.commit(); host.rerender(); });

  // 미리보기 — 오른쪽 열(칸 3개 오른쪽)
  const pvX = x + 168 + 3 * (BTN_W + BTN_GAP) + 8;
  const pvW = panelX + 800 - 24 - pvX;
  let pvBottom: number;
  if (settings.cursorStyle === 'system') {
    const t = scene.add.text(pvX, panelY + 138, '운영체제에서 고른 포인터를 그대로 씁니다.', {
      fontFamily: FONT, fontSize: '11px', color: '#8faabf', wordWrap: { width: pvW },
    });
    container.add(t);
    pvBottom = t.y + t.height;
  } else {
    pvBottom = cursorPreview(host, pvX, panelY + 110, pvW);
  }

  // ── 색 구분 ──
  y += 6;
  const sec2 = scene.add.text(x, y, '색 구분', { fontFamily: FONT, fontSize: '15px', color: '#4af2a1', fontStyle: 'bold' });
  container.add(sec2);
  const sec2Y = y;
  y += 28;
  y = optionRow<ColorVisionMode>(host, x, y, '색 구분 보정', '좋음 · 위험 같은 신호 색을 잘 갈리는 색으로 옮깁니다.', [
    { value: 'off', label: '끔' },
    { value: 'redgreen', label: '적록 색약' },
    { value: 'blueyellow', label: '청황 색약' },
  ], settings.colorVision, (v) => { settings.colorVision = v; host.commit(); host.rerender(); });
  y = optionRow<boolean>(host, x, y, '모양으로도 표시', '막힌 칸 X, 위험 빗금, 막대 눈금을 더합니다.', [
    { value: false, label: '끔' },
    { value: true, label: '켬' },
  ], settings.shapeCues, (v) => { settings.shapeCues = v; host.commit(); host.rerender(); });
  // 색 구분 미리보기는 「색 구분」 제목 높이에서 — 포인터 미리보기 아래 글(밝은 곳 · 어두운 곳)과 붙지 않게 틈을 둔다
  signalPreview(host, pvX, Math.max(sec2Y, Math.ceil(pvBottom + 12)), pvW);
}

/** 색 구분 미리보기 — 낚시 장력 막대 · 설치 칸 · 좋음/주의/위험 점(지금 보정 방식 · 모양 단서) */
function signalPreview(host: AccessTabHost, x: number, y: number, w: number): void {
  const { scene, container } = host;
  const g = scene.add.graphics();
  container.add(g);
  const cap = (yy: number, t: string): void => {
    container.add(scene.add.text(x, yy, t, { fontFamily: FONT, fontSize: '11px', color: '#8faabf' }));
  };
  // 장력 막대(느슨 30% · 안전 30~80% · 위험 80% 위) — 낚시 화면과 같은 색
  cap(y, '장력 막대');
  const by = y + 16, bh = 12;
  const seg = (a: number, b: number, color: number): void => {
    g.fillStyle(cv(color), 1);
    g.fillRect(x + w * a, by, w * (b - a), bh);
  };
  seg(0, 0.3, 0x66b8ff);
  seg(0.3, 0.8, 0x4af2a1);
  seg(0.8, 1, 0xff5a4a);
  drawHatch(g, x + w * 0.8, by, w * 0.2, bh, 0x101418, 0.8, 4);
  if (shapeCuesOn()) {
    g.lineStyle(2, 0xffffff, 0.95);
    for (const t of [0.3, 0.8]) g.lineBetween(x + w * t, by - 3, x + w * t, by + bh + 3);
  }
  g.lineStyle(1, 0x2a5a8a, 0.8);
  g.strokeRect(x, by, w, bh);
  // 설치 칸(가능 둘 · 막힘 하나)
  const cy = by + bh + 14;
  cap(cy, '설치 칸');
  const cell = 22, top = cy + 16;
  [true, true, false].forEach((ok, i) => {
    const cx = x + i * (cell + 4);
    g.fillStyle(cv(ok ? 0x4af2a1 : 0xff5a4a), 0.45);
    g.fillRect(cx, top, cell, cell);
    g.lineStyle(2, cv(ok ? 0x4af2a1 : 0xff5a4a), 0.95);
    g.strokeRect(cx, top, cell, cell);
    if (!ok) drawBlockedX(g, cx, top, cell, cell, 0xffffff, 0.95, 5);
  });
  // 좋음 · 주의 · 위험 점
  const dx0 = x + 3 * (cell + 4) + 10;
  [0x4af2a1, 0xffd257, 0xff5a4a].forEach((c, i) => {
    g.fillStyle(cv(c), 1);
    g.fillCircle(dx0 + 8 + i * 18, top + cell / 2, 6);
  });
}
