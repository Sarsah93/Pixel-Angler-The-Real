/**
 * @file TitleLogo.ts
 * @description 252차 — 메인 메뉴 타이틀 로고를 데이터(`data/TitleLogoArt.ts`)로 굽는다(그림 파일 없음).
 *
 * - 글자 격자 → 칸 마스크 → [바깥 테 → 아래로 민 입체 → 위→아래 색 + 윗면 빛] 순서로 캔버스에 칠한다.
 *   입체는 글자 아래 빈칸(속 빈 곳 포함)에만 들어가 「두께가 있는 간판 글자」로 읽힌다.
 * - 바깥 테(짙은 남색)가 낮 하늘 · 저녁 노을 · 밤하늘 어디서나 글자 윤곽을 세운다 — 옛 로고는 짙은 글자 +
 *   밝은 반투명 판(2026-08-04 가시성 보정)이었다.
 * - `i`의 점은 찌(`FLOAT_ART`)로 따로 구워 메뉴에서 살짝 까딱인다.
 * - 캔버스 함수(`drawTitleLogoCanvas`)는 Phaser 없이 돈다 — 하네스가 같은 그림을 꺼내 비교한다.
 */

import Phaser from 'phaser';
import { FLOAT_ART, MAIN_GLYPHS, SUB_GLYPHS, TITLE_LOGO_STYLE as ST, type LogoGlyph } from '../data/TitleLogoArt.js';

export const TITLE_LOGO_KEY = 'title_logo_code';
export const TITLE_FLOAT_KEY = 'title_logo_float';

/** 한 줄 글자 마스크 */
interface LineMask {
  w: number;
  h: number;
  /** 칸마다 줄 기준 행 번호(색 고르기) — -1 = 빈칸 */
  row: Int8Array;
  /** 글자별 시작 칸 */
  xs: { ch: string; x: number; w: number }[];
}

function layoutLine(text: string, glyphs: Record<string, LogoGlyph>, gap: number): LineMask {
  const parts = [...text].map((ch) => glyphs[ch]).filter((g): g is LogoGlyph => !!g);
  const chars = [...text].filter((ch) => !!glyphs[ch]);
  const h = Math.max(...parts.map((g) => g.top + g.rows.length));
  const w = parts.reduce((s, g, i) => s + g.w + (i < parts.length - 1 ? gap : 0), 0);
  const row = new Int8Array(w * h).fill(-1);
  const xs: LineMask['xs'] = [];
  let x = 0;
  parts.forEach((g, i) => {
    xs.push({ ch: chars[i], x, w: g.w });
    g.rows.forEach((r, ry) => {
      const y = g.top + ry;
      for (let cx = 0; cx < r.length; cx++) if (r[cx] === '#') row[y * w + x + cx] = y;
    });
    x += g.w + gap;
  });
  return { w, h, row, xs };
}

/** 한 줄이 차지하는 칸(바깥 테 1칸 + 입체 depth칸 포함) */
function lineBox(m: LineMask, depth: number): { w: number; h: number } {
  return { w: m.w + 2, h: m.h + depth + 2 };
}

/**
 * 한 줄을 칠한다 — (ox, oy) = 테를 포함한 상자의 왼쪽 위(px).
 * 칸 (x, y)는 (ox + (x + 1) * cell, oy + (y + 1) * cell)에 놓인다.
 */
function paintLine(
  ctx: CanvasRenderingContext2D, m: LineMask, cell: number, ox: number, oy: number,
  ramp: readonly string[], extrude: readonly string[],
): void {
  const D = extrude.length;
  const fill = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < m.w && y < m.h && m.row[y * m.w + x] >= 0;
  /** 입체 칸 — 위로 k칸 안에 글자가 있고 자신은 빈칸이면 가장 가까운 k(없으면 0) */
  const extAt = (x: number, y: number): number => {
    if (fill(x, y)) return 0;
    for (let k = 1; k <= D; k++) if (fill(x, y - k)) return k;
    return 0;
  };
  const solid = (x: number, y: number): boolean => fill(x, y) || extAt(x, y) > 0;
  const px = (x: number, y: number): void => ctx.fillRect(ox + (x + 1) * cell, oy + (y + 1) * cell, cell, cell);

  // 1) 바깥 테 — 글자 · 입체 둘레 8방향 1칸
  ctx.fillStyle = ST.outline;
  for (let y = -1; y <= m.h + D; y++) {
    for (let x = -1; x <= m.w; x++) {
      if (solid(x, y)) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dy) && solid(x + dx, y + dy)) { near = true; break; }
        }
      }
      if (near) px(x, y);
    }
  }
  // 2) 입체 — 가까운 칸이 밝고 아래로 갈수록 짙다
  for (let y = 0; y < m.h + D; y++) {
    for (let x = 0; x < m.w; x++) {
      const k = extAt(x, y);
      if (!k) continue;
      ctx.fillStyle = extrude[k - 1];
      px(x, y);
    }
  }
  // 3) 글자 — 줄 기준 행 색, 위가 빈 칸은 빛(윗면)
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      if (!fill(x, y)) continue;
      ctx.fillStyle = fill(x, y - 1) ? ramp[Math.min(ramp.length - 1, m.row[y * m.w + x])] : ST.highlight;
      px(x, y);
    }
  }
}

/** 찌 한 벌(테 1칸 포함) */
function drawFloatCanvas(): HTMLCanvasElement {
  const rows = FLOAT_ART.rows;
  const fw = rows[0].length, fh = rows.length, c = ST.floatCell;
  const cv = document.createElement('canvas');
  cv.width = (fw + 2) * c;
  cv.height = (fh + 2) * c;
  const ctx = cv.getContext('2d');
  if (!ctx) return cv;
  const on = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < fw && y < fh && rows[y][x] !== '.';
  ctx.fillStyle = ST.outline;
  for (let y = -1; y <= fh; y++) {
    for (let x = -1; x <= fw; x++) {
      if (on(x, y)) continue;
      if ([[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => on(x + dx, y + dy))) ctx.fillRect((x + 1) * c, (y + 1) * c, c, c);
    }
  }
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      const k = rows[y][x];
      if (k === '.') continue;
      ctx.fillStyle = FLOAT_ART.pal[k] ?? '#ff00ff';
      ctx.fillRect((x + 1) * c, (y + 1) * c, c, c);
    }
  }
  return cv;
}

export interface TitleLogoArt {
  logo: HTMLCanvasElement;
  float: HTMLCanvasElement;
  /** 찌 그림 왼쪽 위 — 로고 캔버스 왼쪽 위 기준(px) */
  floatX: number;
  floatY: number;
}

/** 로고 · 찌 캔버스를 만든다(Phaser 없이) */
export function drawTitleLogoCanvas(): TitleLogoArt {
  const main = layoutLine('Pixel Angler', MAIN_GLYPHS, ST.mainGap);
  const sub = layoutLine(': THE REAL', SUB_GLYPHS, ST.subGap);
  const mc = ST.mainCell, sc = ST.subCell;
  const mBox = lineBox(main, ST.mainExtrude.length);
  const sBox = lineBox(sub, ST.subExtrude.length);
  const float = drawFloatCanvas();

  // 찌가 큰 글자 위로 솟는 만큼 위 여백을 둔다
  const iGlyph = main.xs.find((g) => g.ch === 'i');
  const stemTopPx = (MAIN_GLYPHS.i.top + 1) * mc;          // 테 1칸 포함 좌표
  const floatGap = 2;
  const floatTop = stemTopPx - floatGap - float.height;      // 큰 글자 상자 기준(음수면 위로 솟음)
  const padTop = Math.max(0, -floatTop);

  const mainW = mBox.w * mc, mainH = mBox.h * mc;
  const subW = sBox.w * sc, subH = sBox.h * sc;
  const subX = Math.round(mainW - mc + ST.subOffsetX - subW + sc);
  const subY = padTop + mainH + ST.subGapY;
  const width = Math.max(mainW, subX + subW);
  const height = subY + subH;

  const logo = document.createElement('canvas');
  logo.width = width;
  logo.height = height;
  const ctx = logo.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    paintLine(ctx, main, mc, 0, padTop, ST.mainRamp, ST.mainExtrude);
    paintLine(ctx, sub, sc, subX, subY, ST.subRamp, ST.subExtrude);
  }
  const stemCenter = iGlyph ? (iGlyph.x + 1 + iGlyph.w / 2) * mc : 0;
  return { logo, float, floatX: Math.round(stemCenter - float.width / 2), floatY: padTop + floatTop };
}

/** Phaser 텍스처로 굽는다(이미 있으면 그대로) — 찌 위치는 로고 텍스처 왼쪽 위 기준 */
export function ensureTitleLogo(scene: Phaser.Scene): { key: string; floatKey: string; floatX: number; floatY: number } {
  const tm = scene.textures;
  const art = drawTitleLogoCanvas();
  if (!tm.exists(TITLE_LOGO_KEY)) tm.addCanvas(TITLE_LOGO_KEY, art.logo);
  if (!tm.exists(TITLE_FLOAT_KEY)) tm.addCanvas(TITLE_FLOAT_KEY, art.float);
  return { key: TITLE_LOGO_KEY, floatKey: TITLE_FLOAT_KEY, floatX: art.floatX, floatY: art.floatY };
}
