/**
 * @file ForageBoardArt.ts
 * @description 229차 — 채집 놀이 판 그림(바닥 4종 · 가이드 그림 5종).
 *
 * 224차 판은 단색 사각형 + 자갈 원뿐이라 「단순 도형」이라는 지적을 받았다(사용자 229차).
 * 여기서는 **절차 픽셀 그래픽**(2px 셀 노이즈 · 균열 · 이끼 · 따개비 · 빛무늬 · 지층)으로 바닥을 한 번 구워 두고,
 * 손 · 장갑 · 집게 · 갈퀴 · 갈고리는 손그림 24x24 도트(`PixelIconArt` fg_*)를 쓴다.
 * 가이드 말풍선에 들어가는 그림(`makeForageDemo`)도 여기서 만든다 — 글자만으로 설명하지 않는다(R11 · 229차 지시).
 *
 * 바닥 텍스처는 220x90으로 굽고 판(440x180)에는 2배로 올린다(pixelArt 모드라 도트가 선다).
 */

import Phaser from 'phaser';
import { mulberry32, type ForageGameKind } from '@tra/core';
import { ensurePixelIcon } from './PixelIcon.js';

export type ForageBedKind = 'rock' | 'water' | 'cut' | 'crevice';

/** 바닥 텍스처 원본 크기(판은 2배) */
export const BED_W = 220;
export const BED_H = 90;
/** 2px 셀 — 판에서는 4px 도트 */
const CELL = 2;

/** 놀이 갈래 · 물속 여부 → 바닥 종류 */
export function bedKindFor(kind: ForageGameKind, underwater: boolean): ForageBedKind {
  if (kind === 'dig') return 'cut';
  if (kind === 'pull') return 'crevice';
  return underwater ? 'water' : 'rock';
}

type Painter = (g: Phaser.GameObjects.Graphics, rng: () => number) => void;

/** 셀 하나 */
function cell(g: Phaser.GameObjects.Graphics, cx: number, cy: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillRect(cx * CELL, cy * CELL, CELL, CELL);
}

const COLS = BED_W / CELL;
const ROWS = BED_H / CELL;

/** 셀 단위 노이즈 바닥 — 팔레트에서 가중 선택(앞쪽이 많이 나온다) */
function noiseFill(g: Phaser.GameObjects.Graphics, rng: () => number, pal: number[]): void {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const r = rng();
      const i = r < 0.55 ? 0 : r < 0.8 ? 1 : r < 0.93 ? 2 : Math.min(pal.length - 1, 3);
      cell(g, x, y, pal[i]!);
    }
  }
}

/** 셀 단위 타원 얼룩 */
function blob(g: Phaser.GameObjects.Graphics, rng: () => number, cx: number, cy: number, rx: number, ry: number, pal: number[]): void {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d > 1 || x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
      if (d > 0.72 && rng() < 0.45) continue;   // 가장자리는 들쭉날쭉
      cell(g, x, y, pal[rng() < 0.7 ? 0 : 1]!);
    }
  }
}

/** 꺾인 선(균열) — 셀 단위 */
function crack(g: Phaser.GameObjects.Graphics, rng: () => number, x0: number, y0: number, len: number, color: number): void {
  let x = x0, y = y0;
  let dx = rng() < 0.5 ? 1 : -1, dy = rng() < 0.5 ? 1 : 0;
  for (let i = 0; i < len; i++) {
    cell(g, x, y, color);
    if (rng() < 0.25) cell(g, x + 1, y, color, 0.6);
    if (rng() < 0.3) dy = Math.round(rng() * 2 - 1);
    if (rng() < 0.15) dx = -dx;
    x += dx; y += dy;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) break;
  }
}

/** 따개비 — 2x2 밝은 알갱이 + 어두운 점 */
function barnacle(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  cell(g, x, y, 0xe8e2d2); cell(g, x + 1, y, 0xd8d0bc); cell(g, x, y + 1, 0xcfc6b2); cell(g, x + 1, y + 1, 0xe8e2d2);
  g.fillStyle(0x3a3530, 1); g.fillRect(x * CELL + 1, y * CELL + 1, 2, 2);
}

const PAINTERS: Record<ForageBedKind, Painter> = {
  // 갯바위 — 회갈색 바위면 · 균열 · 이끼 얼룩 · 따개비 · 젖은 윤기
  rock: (g, rng) => {
    noiseFill(g, rng, [0x55504a, 0x5f5a52, 0x47423b, 0x6b665d]);
    for (let i = 0; i < 6; i++) crack(g, rng, Math.floor(rng() * COLS), Math.floor(rng() * ROWS), 14 + Math.floor(rng() * 22), 0x2a2622);
    for (let i = 0; i < 7; i++) blob(g, rng, 8 + rng() * (COLS - 16), 4 + rng() * (ROWS - 8), 4 + rng() * 7, 2 + rng() * 4, [0x4f6b3a, 0x5f7f44]);
    for (let i = 0; i < 4; i++) blob(g, rng, rng() * COLS, rng() * ROWS, 3 + rng() * 5, 2 + rng() * 3, [0x6e6a60, 0x7c7869]);
    for (let i = 0; i < 26; i++) barnacle(g, 1 + Math.floor(rng() * (COLS - 3)), 1 + Math.floor(rng() * (ROWS - 3)));
    // 젖은 윤기 — 위쪽 몇 줄의 밝은 점
    for (let i = 0; i < 40; i++) cell(g, Math.floor(rng() * COLS), Math.floor(rng() * 10), 0x8a857a, 0.5);
    // 아래 그늘
    g.fillStyle(0x0a0c10, 0.22); g.fillRect(0, BED_H - 14, BED_W, 14);
  },
  // 얕은 물 — 모래 바닥 위 푸른 물 · 빛무늬 · 조개 조각 · 물거품
  water: (g, rng) => {
    noiseFill(g, rng, [0xb49a6e, 0xc4a97c, 0xa88e62, 0xd2b88a]);
    for (let i = 0; i < 5; i++) blob(g, rng, rng() * COLS, rng() * ROWS, 5 + rng() * 8, 2 + rng() * 3, [0x9c8458, 0xa88e62]);
    for (let i = 0; i < 14; i++) { const x = Math.floor(rng() * COLS), y = Math.floor(rng() * ROWS); cell(g, x, y, 0xe8dcc4); cell(g, x + 1, y, 0xd0c0a0); }
    for (let i = 0; i < 10; i++) { const x = Math.floor(rng() * COLS), y = Math.floor(rng() * ROWS); cell(g, x, y, 0x5a4a3a); }
    // 물 — 반투명 푸른 막
    g.fillStyle(0x1f5c80, 0.5); g.fillRect(0, 0, BED_W, BED_H);
    // 빛무늬 — 물결 모양 밝은 띠
    for (let k = 0; k < 7; k++) {
      const y0 = 4 + k * 6 + rng() * 3, amp = 1.5 + rng() * 1.5, ph = rng() * 6.28;
      for (let x = 0; x < COLS; x++) {
        const y = Math.round(y0 + Math.sin(x * 0.22 + ph) * amp);
        if (rng() < 0.75) cell(g, x, y, 0xa8e4f4, 0.38);
      }
    }
    // 물거품
    for (let i = 0; i < 12; i++) {
      const x = rng() * BED_W, y = rng() * BED_H;
      g.lineStyle(1, 0xdff6ff, 0.6); g.strokeCircle(x, y, 1.5 + rng() * 1.5);
    }
  },
  // 파기 단면 — 젖은 모래 표면 · 지층 · 자갈 · 조개 조각
  cut: (g, rng) => {
    // 지층 — 위로 갈수록 밝고 젖어 있다
    const layers = [0x9a8864, 0x8a7a5a, 0x7e6e50, 0x716246, 0x655840];
    for (let y = 0; y < ROWS; y++) {
      const li = Math.min(layers.length - 1, Math.floor(y / (ROWS / layers.length)));
      for (let x = 0; x < COLS; x++) {
        const r = rng();
        const base = layers[li]!;
        const c = r < 0.08 ? (li % 2 ? 0x5a4d38 : 0xa8966f) : base;
        cell(g, x, y, c);
      }
      // 층 경계 — 어두운 물결 선
      if (y > 0 && y % Math.round(ROWS / layers.length) === 0) {
        for (let x = 0; x < COLS; x++) if (rng() < 0.8) cell(g, x, y + Math.round(Math.sin(x * 0.35) * 0.8), 0x4e4230, 0.8);
      }
    }
    // 표면 — 젖은 모래 둔덕 + 물기 반짝임
    for (let x = 0; x < COLS; x++) {
      const h = 2 + Math.round(Math.sin(x * 0.3) * 1 + Math.sin(x * 0.07) * 1.2);
      for (let y = 0; y < h; y++) cell(g, x, y, y === h - 1 ? 0xb8a680 : 0x0f2230);
      if (rng() < 0.25) cell(g, x, h, 0xd6c8a4);
    }
    // 자갈 · 조개 조각
    for (let i = 0; i < 18; i++) {
      const x = Math.floor(rng() * COLS), y = 4 + Math.floor(rng() * (ROWS - 6));
      const c = rng() < 0.5 ? 0x6f6a62 : 0xb9ad96;
      cell(g, x, y, c); cell(g, x + 1, y, c); if (rng() < 0.5) cell(g, x, y + 1, 0x4e4a44);
    }
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(rng() * COLS), y = 6 + Math.floor(rng() * (ROWS - 8));
      cell(g, x, y, 0xe8e0d0); cell(g, x + 1, y, 0xd8ccb4); cell(g, x + 2, y, 0xe8e0d0);
    }
    // 좌우 어둠(흙벽)
    g.fillStyle(0x0a0c10, 0.3); g.fillRect(0, 0, 10, BED_H); g.fillRect(BED_W - 10, 0, 10, BED_H);
  },
  // 바위 틈 — 어두운 암반 · 가운데 V자 틈 · 젖은 가장자리 · 해초 · 따개비
  crevice: (g, rng) => {
    noiseFill(g, rng, [0x3e3a36, 0x484440, 0x35312d, 0x55514c]);
    for (let i = 0; i < 5; i++) crack(g, rng, Math.floor(rng() * COLS), Math.floor(rng() * ROWS), 10 + Math.floor(rng() * 16), 0x221f1c);
    for (let i = 0; i < 18; i++) barnacle(g, 1 + Math.floor(rng() * (COLS - 3)), 1 + Math.floor(rng() * (ROWS - 3)));
    // V자 틈 — 위 30셀 폭, 아래 1셀로
    const cx = COLS / 2, top = 2, bottom = ROWS - 6;
    for (let y = top; y <= bottom; y++) {
      const k = 1 - (y - top) / (bottom - top);
      const half = Math.max(0.6, 15 * k);
      const jitter = Math.round((rng() - 0.5) * 1.4);
      for (let x = Math.floor(cx - half) + jitter; x <= Math.ceil(cx + half) + jitter; x++) {
        const depth = 1 - Math.abs(x - cx) / Math.max(1, half);
        cell(g, x, y, depth > 0.55 ? 0x06101a : 0x0d1a26);
      }
      // 젖은 가장자리
      cell(g, Math.floor(cx - half) + jitter - 1, y, 0x8a95a0, 0.7);
      cell(g, Math.ceil(cx + half) + jitter + 1, y, 0x6f7a86, 0.6);
    }
    // 해초 — 틈 가장자리에서 늘어진 초록 줄
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? -1 : 1;
      let x = Math.round(cx + side * (12 + rng() * 6)), y = top + Math.floor(rng() * 6);
      for (let k = 0; k < 8 + Math.floor(rng() * 8); k++) {
        cell(g, x, y, k % 3 === 0 ? 0x3f6b3a : 0x4f8244);
        y += 1; if (rng() < 0.4) x += rng() < 0.5 ? -1 : 1;
      }
    }
    // 틈 밑 그늘
    g.fillStyle(0x0a0c10, 0.25); g.fillRect(0, BED_H - 12, BED_W, 12);
  },
};

/** 바닥 텍스처를 굽는다(한 번) — 키 `fb_bed_<kind>` */
export function ensureForageBed(scene: Phaser.Scene, kind: ForageBedKind): string {
  const key = `fb_bed_${kind}`;
  if (scene.textures.exists(key)) return key;
  const g = scene.add.graphics();
  PAINTERS[kind](g, mulberry32(0x5eed ^ kind.length * 977));
  g.generateTexture(key, BED_W, BED_H);
  g.destroy();
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

/** 도구 → 손그림 스프라이트 키(`PixelIconArt`) */
export function toolSpriteKey(tool: string, gloves: boolean): string {
  switch (tool) {
    case 'tongs': return 'fg_tongs';
    case 'rake': return 'fg_rake';
    case 'gaff': return 'fg_gaff';
    default: return gloves ? 'fg_glove' : 'fg_hand';
  }
}

/** 손 스프라이트 이미지(24x24 도트를 `scale`배로 구워서) */
export function addToolSprite(scene: Phaser.Scene, key: string, scale = 2): Phaser.GameObjects.Image | null {
  const tex = ensurePixelIcon(scene, key, scale);
  return tex ? scene.add.image(0, 0, tex).setOrigin(0.5) : null;
}

/** 가이드 그림 크기(말풍선 안) */
export const DEMO_W = 272;
export const DEMO_H = 76;

/**
 * 가이드 말풍선 그림 — 갈래마다 「무엇이 보이고 무엇을 하는지」를 그림 한 장으로.
 * 바닥 조각 + 생물 그림 + 손 도구 + 화살표 · 고리 · 막대. 글자는 넣지 않는다.
 */
export function makeForageDemo(
  scene: Phaser.Scene, kind: ForageGameKind, creatureKey: string | null, tool: string, gloves: boolean, underwater: boolean,
): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const bedKey = ensureForageBed(scene, bedKindFor(kind, underwater));
  const bed = scene.add.image(0, 0, bedKey).setOrigin(0, 0).setScale(DEMO_W / BED_W, DEMO_H / BED_H);
  c.add(bed);
  const frame = scene.add.graphics();
  frame.lineStyle(2, 0x0a1628, 1); frame.strokeRect(0, 0, DEMO_W, DEMO_H);
  c.add(frame);
  const g = scene.add.graphics();
  const creature = (x: number, y: number, size: number, angle = 0): void => {
    if (creatureKey && scene.textures.exists(creatureKey)) {
      const img = scene.add.image(x, y, creatureKey).setAngle(angle);
      const f = img.frame; const k = size / Math.max(1, f.width, f.height);
      img.setScale(k >= 1 ? Math.round(k * 2) / 2 : k);
      c.add(img);
    } else {
      g.fillStyle(0xc8b898, 1); g.fillEllipse(x, y, size, size * 0.7);
    }
  };
  const toolAt = (x: number, y: number, angle = 0, scale = 2): void => {
    const s = addToolSprite(scene, toolSpriteKey(tool, gloves), scale);
    if (s) { s.setPosition(x, y).setAngle(angle); c.add(s); }
  };
  const arrow = (x: number, y: number, angle = 0, scale = 1): void => {
    const tex = ensurePixelIcon(scene, 'fg_arrow', 1);
    if (tex) c.add(scene.add.image(x, y, tex).setAngle(angle).setScale(scale));
  };
  switch (kind) {
    case 'snatch': {
      // 녀석은 오른쪽으로 튀려 하고(모래 튐 + 화살표), 손 고리가 그 앞을 덮친다
      creature(128, 44, 34);
      g.lineStyle(2, 0xe8e2c8, 0.8);
      for (let k = 0; k < 3; k++) g.lineBetween(108 - k * 5, 50 - k * 4, 100 - k * 6, 46 - k * 5);
      arrow(170, 44, 0, 1.4);
      g.lineStyle(2, 0xffffff, 0.9); g.strokeCircle(196, 44, 16);
      g.fillStyle(0x000000, 0.3); g.fillCircle(196, 44, 24);
      g.lineStyle(3, 0xffe28a, 0.9); g.strokeCircle(196, 44, 24);
      toolAt(60, 40, 0, 2);
      arrow(96, 24, 0, 1);
      break;
    }
    case 'pick': {
      // 느린 녀석 위로 손이 내려간다(아래 화살표)
      creature(136, 50, 34);
      toolAt(136, 22, 0, 2);
      arrow(176, 36, 90, 1.2);
      g.lineStyle(2, 0xffffff, 0.9); g.strokeCircle(136, 50, 20);
      break;
    }
    case 'pry': {
      // 껍데기 아래 가장자리를 따라 오가는 집게 끝 · 초록 틈에 닿을 때 누른다
      const cx = 136, cy = 22, a = 44, b = 22;
      g.fillStyle(0x000000, 0.35); g.fillEllipse(cx, cy + 6, a * 2 + 6, b * 2 + 6);
      creature(cx, cy, 60);
      const at = (v: number): [number, number] => { const th = Math.PI * (1 - v); return [cx + a * Math.cos(th), cy + 6 + b * Math.sin(th)]; };
      g.lineStyle(4, 0xe8d8b8, 0.6); g.beginPath();
      for (let k = 0; k <= 24; k++) { const [x, y] = at(k / 24); if (k === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.strokePath();
      g.lineStyle(12, 0x0a0e14, 1); g.beginPath();
      for (let k = 0; k <= 8; k++) { const [x, y] = at(0.55 + 0.18 * (k / 8)); if (k === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.strokePath();
      g.lineStyle(6, 0x4af2a1, 1); g.beginPath();
      for (let k = 0; k <= 8; k++) { const [x, y] = at(0.55 + 0.18 * (k / 8)); if (k === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.strokePath();
      const [tx, ty] = at(0.64);
      toolAt(tx + 6, Math.min(DEMO_H - 14, ty + 12), -20, 1);
      arrow(70, 62, 180, 1); arrow(206, 62, 0, 1);
      g.lineStyle(2, 0x4af2a1, 1); g.strokeCircle(tx, ty, 10);
      break;
    }
    case 'dig': {
      // 단면 — 구멍 아래 녀석 · 위에서 갈퀴 · 오른쪽 소란 막대
      g.fillStyle(0x2a2218, 1); g.fillRect(118, 8, 36, 44);
      // 1자형 지렁이 도트(66x13)는 원래 크기로 세워서 · 다른 묻힌 생물은 40px
      creature(136, 38, creatureKey === 'honmushi_straight_px' ? 66 : 40, -90);
      toolAt(136, 14, 0, 2);
      arrow(166, 20, 90, 1);
      g.fillStyle(0x0a1628, 0.9); g.fillRect(236, 8, 14, 60);
      g.fillStyle(0x4af2a1, 1); g.fillRect(236, 44, 14, 24);
      g.fillStyle(0xff5a4a, 1); g.fillRect(236, 8, 14, 18);
      g.lineStyle(1.5, 0x2a5a8a, 1); g.strokeRect(236, 8, 14, 60);
      g.fillStyle(0xffffff, 1); g.fillRect(232, 42, 22, 3);
      // 흙 튐
      g.fillStyle(0xd8c8a0, 0.9);
      for (let k = 0; k < 6; k++) g.fillCircle(126 + k * 4, 30 - (k % 3) * 6, 2);
      break;
    }
    case 'pull': {
      // 틈에서 반쯤 나온 녀석 · 당기는 손(위 화살표) · 아래 긴장 막대(초록 칸)
      creature(136, 34, 36);
      toolAt(176, 20, 0, 2);
      arrow(206, 30, -90, 1);
      const bx = 40, by = 58, bw = 192, bh = 10;
      g.fillStyle(0x0a1628, 0.9); g.fillRect(bx, by, bw, bh);
      g.fillStyle(0x4af2a1, 0.5); g.fillRect(bx + bw * 0.3, by, bw * 0.55, bh);
      g.fillStyle(0xff5a4a, 0.5); g.fillRect(bx + bw * 0.85, by, bw * 0.15, bh);
      g.fillStyle(0xffffff, 1); g.fillRect(bx + bw * 0.55 - 2, by - 4, 4, bh + 8);
      g.lineStyle(1.5, 0x2a5a8a, 1); g.strokeRect(bx, by, bw, bh);
      break;
    }
  }
  c.add(g);
  return c;
}
