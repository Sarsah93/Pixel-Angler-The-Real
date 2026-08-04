/**
 * gen_flatfish_sprites.cjs — 넙치류(광어) 도마 픽셀 스프라이트 생성기 (2026-08-05).
 *
 * `packages/client-pc/public/fish/halibut.png`(선명한 픽셀아트 — 머리 왼쪽·등면)에서:
 *  ① HALIBUT_DARK  — 등면(어두운 면) 도트 매트릭스 (bbox 크롭 + 박스평균 다운샘플 + 팔레트 양자화)
 *  ② HALIBUT_WHITE — 배면(흰 면) 파생: 실루엣 테두리(지느러미 프린지)는 갈색 톤 유지,
 *     안쪽 몸통은 원본 명암을 3단 크림색으로 리매핑 (사용자 캡처 3 — 흰 뱃면 + 갈색 프린지)
 *
 * 출력: packages/client-pc/src/data/PixelFishFlat.ts (자동 생성 — 수동 편집 금지)
 * 재생성: node tools/gen_flatfish_sprites.cjs (Playwright + 설치 Chrome)
 */
const fs = require('fs');
const path = require('path');

const PW = 'C:/Users/dungy/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'packages', 'client-pc', 'public', 'fish', 'halibut.png');
const OUT_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'PixelFishFlat.ts');

const TARGET_W = 100;         // 도마 프레임(560×210) 기준 셀 3 → 300px 폭
const MAX_COLORS = 44;
const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const b64 = fs.readFileSync(SRC).toString('base64');
  const grid = await page.evaluate(async ({ b64: data, targetW }) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + data; });
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d');
    cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, cv.width, cv.height).data;
    const at = (x, y) => {
      const i = (y * cv.width + x) * 4;
      return [d[i], d[i + 1], d[i + 2], d[i + 3]];
    };
    // 배경 판정 — 투명 또는 근흑(픽셀아트 배경이 순흑으로 구워진 경우)
    const isBg = (p) => p[3] < 24 || (p[0] < 14 && p[1] < 14 && p[2] < 14);
    // bbox
    let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
    for (let y = 0; y < cv.height; y++) {
      for (let x = 0; x < cv.width; x++) {
        if (!isBg(at(x, y))) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const w = targetW, h = Math.max(8, Math.round((bh / bw) * targetW));
    // 박스평균 다운샘플 (배경 제외 가중)
    const cells = [];
    for (let gy = 0; gy < h; gy++) {
      const row = [];
      for (let gx = 0; gx < w; gx++) {
        const sx0 = x0 + Math.floor((gx / w) * bw), sx1 = x0 + Math.floor(((gx + 1) / w) * bw);
        const sy0 = y0 + Math.floor((gy / h) * bh), sy1 = y0 + Math.floor(((gy + 1) / h) * bh);
        let r = 0, g = 0, b = 0, n = 0, tot = 0;
        for (let sy = sy0; sy <= Math.min(sy1, y1); sy++) {
          for (let sx = sx0; sx <= Math.min(sx1, x1); sx++) {
            const p = at(sx, sy);
            tot++;
            if (isBg(p)) continue;
            r += p[0]; g += p[1]; b += p[2]; n++;
          }
        }
        if (n === 0 || n / Math.max(1, tot) < 0.45) { row.push(null); continue; }
        row.push([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
      }
      cells.push(row);
    }
    return { w, h, cells };
  }, { b64, targetW: TARGET_W });
  await browser.close();

  const { w, h, cells } = grid;

  // ── 팔레트 양자화 (미디언컷 간이 — 빈도 기반 병합) ──
  function quantize(cells2) {
    const freq = new Map();
    for (const row of cells2) {
      for (const c of row) {
        if (!c) continue;
        // 5비트 포스터라이즈로 후보 축소
        const key = ((c[0] >> 3) << 10) | ((c[1] >> 3) << 5) | (c[2] >> 3);
        const e = freq.get(key);
        if (e) { e.n++; e.r += c[0]; e.g += c[1]; e.b += c[2]; } else freq.set(key, { n: 1, r: c[0], g: c[1], b: c[2] });
      }
    }
    let pal = [...freq.values()].map((e) => ({ n: e.n, r: e.r / e.n, g: e.g / e.n, b: e.b / e.n }));
    pal.sort((a, b2) => b2.n - a.n);
    // 상위 MAX_COLORS 유지, 나머지는 최근접 병합
    const keep = pal.slice(0, MAX_COLORS);
    const palette = keep.map((p) => (Math.round(p.r) << 16) | (Math.round(p.g) << 8) | Math.round(p.b));
    const nearest = (c) => {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < keep.length; i++) {
        const d2 = (keep[i].r - c[0]) ** 2 + (keep[i].g - c[1]) ** 2 + (keep[i].b - c[2]) ** 2;
        if (d2 < bd) { bd = d2; bi = i; }
      }
      return bi;
    };
    const rows = cells2.map((row) => row.map((c) => (c ? AB[nearest(c)] : '.')).join(''));
    return { palette, rows };
  }

  const dark = quantize(cells);

  // ── 배면(흰 면) 파생 — 테두리 프린지 갈색 유지 + 안쪽 크림 3단 ──
  const solid = cells.map((row) => row.map((c) => !!c));
  const edgeDist = cells.map((row, y) => row.map((c, x) => {
    if (!c) return -1;
    // 실루엣 경계까지 체비쇼프 거리 (0 = 최외곽)
    for (let d = 0; d <= 4; d++) {
      for (let dy = -d; dy <= d; dy++) {
        for (let dx = -d; dx <= d; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || !solid[ny][nx]) return d;
        }
      }
    }
    return 5;
  }));
  const whiteCells = cells.map((row, y) => row.map((c, x) => {
    if (!c) return null;
    const ed = edgeDist[y][x];
    if (ed <= 2) {
      // 프린지(지느러미 가장자리) — 원본 갈색을 밝은 탠 톤으로
      const lum = (c[0] * 0.4 + c[1] * 0.4 + c[2] * 0.2) / 255;
      const k = 0.55 + lum * 0.45;
      return [Math.round(196 * k), Math.round(158 * k), Math.round(108 * k)];
    }
    // 몸통 — 크림 화이트 3단 (원본 명암 유지해 입체감)
    const lum = (c[0] + c[1] + c[2]) / (3 * 255);
    if (lum > 0.42) return [246, 242, 234];
    if (lum > 0.30) return [235, 229, 218];
    return [222, 214, 200];
  }));
  const white = quantize(whiteCells);

  const fmt = (name, q) => `export const ${name}: PixelFishSprite = {\n  w: ${w}, h: ${h}, cellPx: ${Math.round(1536 / w)},\n  palette: [${q.palette.map((p) => '0x' + p.toString(16).padStart(6, '0')).join(', ')}],\n  rows: [\n${q.rows.map((r) => `    '${r}',`).join('\n')}\n  ],\n};\n`;

  const ts = `/**
 * @file PixelFishFlat.ts
 * @description 넙치류(광어) 도마 픽셀 스프라이트 — **자동 생성 (수동 편집 금지)**
 *
 * 소스: public/fish/halibut.png (선명 픽셀아트 — 머리 왼쪽·등면)
 * 재생성: node tools/gen_flatfish_sprites.cjs
 *  - HALIBUT_DARK  = 등면(눈 있는 어두운 면)
 *  - HALIBUT_WHITE = 배면(흰 면 — 프린지 갈색 톤 유지) 파생
 */
import type { PixelFishSprite } from './PixelFishSprites.js';

${fmt('HALIBUT_DARK', dark)}
${fmt('HALIBUT_WHITE', white)}`;
  fs.writeFileSync(OUT_TS, ts);
  console.log(`[gen_flatfish] ${w}x${h} · dark ${dark.palette.length}색 / white ${white.palette.length}색 -> ${OUT_TS}`);
})();
