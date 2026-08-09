/**
 * gen_species_sprites.cjs — 손질 도마 **어종별** 온마리 픽셀 스프라이트 생성기 (2026-08-09).
 *
 * 배경: 도마 온마리 그림이 어종군 대표 1장(돔류=감성돔 가이드 SVG 추출 / 방어류=잿방어)으로
 *  통일돼 있어 해상도·형태가 실제 어종과 달랐다. 각 어종의 **실사 픽셀 이미지**
 *  (`public/fish/*.png` — 어획 팝업·도감이 쓰는 그 이미지)에서 도마용 도트를 굽는다.
 *
 * 적용 범위 = **개복 전 측면 뷰**(시메·방혈·머리따기·비늘치기·지느러미 제거·꼬리 칼집).
 *  개복 이후 전용 뷰(복면/체강/장뜨기/박피)는 기존 어종군 공용 스프라이트 유지.
 *
 * 규약: 도마 온마리는 **머리 왼쪽** — 원본이 반대면 아래 표의 `mirror: true`로 굽는 시점에 반전
 *  (렌더 코드에서 뒤집지 않는다 — asset-pipeline 스킬 ②).
 *
 * 출력: packages/client-pc/src/data/PixelFishSpecies.ts (자동 생성 — 수동 편집 금지)
 *       + scratchpad 프리뷰 시트(검수용, --preview <경로>)
 * 재생성: node tools/gen_species_sprites.cjs
 */
const fs = require('fs');
const path = require('path');

// playwright 해석 — 로컬 설치 → npx 캐시(_npx 하위 node_modules) 순 (사용자 계정 무관)
function resolvePlaywright() {
  try { return require('playwright'); } catch { /* npx 캐시 탐색 */ }
  const base = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const p = path.join(base, d, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error('playwright를 찾을 수 없습니다 — npx -p playwright@1.62.1 로 설치 후 재실행');
}
const { chromium } = resolvePlaywright();

const ROOT = path.resolve(__dirname, '..');
const FISH_DIR = path.join(ROOT, 'packages', 'client-pc', 'public', 'fish');
const OUT_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'PixelFishSpecies.ts');

const TARGET_W = 128;         // 기존 FISH_WHOLE(128×66)과 같은 도트 밀도
const MAX_COLORS = 44;
const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

/**
 * 손질 지원 어종(BUTCHERY_IMPLEMENTED_SPECIES 중 돔류 7 + 방어류 3) → 소스 PNG.
 *  `const` = 생성 TS의 심볼명 · `mirror` = 원본이 머리 오른쪽이라 반전 필요
 *  참돔 야간(night_seabream)은 같은 생물종이라 참돔 이미지를 공유한다(별도 굽기 없음).
 */
const SPECIES = [
  { id: 'black_seabream',      sym: 'BLACK_SEABREAM',      file: 'black_sea_bream.png',       ko: '감성돔',       mirror: false },
  { id: 'red_seabream',        sym: 'RED_SEABREAM',        file: 'red_sea_bream.png',         ko: '참돔',         mirror: false },
  { id: 'largescale_blackfish',sym: 'LARGESCALE_BLACKFISH',file: 'large_scale_blackfish.png', ko: '벵에돔',       mirror: false },
  // 긴꼬리벵에돔 원본만 머리 오른쪽 — 도마 규약(머리 왼쪽)에 맞춰 반전해 굽는다
  { id: 'longtail_blackfish',  sym: 'LONGTAIL_BLACKFISH',  file: 'small_scale_blackfish.png', ko: '긴꼬리벵에돔', mirror: true },
  // 돌돔은 40cm↑ 수컷만 줄무늬가 사라진다 — 암/수 2장을 굽고 렌더가 개체로 고른다
  { id: 'stone_beakperch',      sym: 'STONE_BEAKPERCH',      file: 'barred_knifejaw_female.png', ko: '돌돔(암)', mirror: false },
  { id: 'stone_beakperch_male', sym: 'STONE_BEAKPERCH_MALE', file: 'barred_knifejaw_male.png',   ko: '돌돔(수)', mirror: false },
  { id: 'spotted_knifejaw',    sym: 'SPOTTED_KNIFEJAW',    file: 'spotted_knifejaw.png',      ko: '강담돔',       mirror: false },
  { id: 'yellowtail',          sym: 'YELLOWTAIL',          file: 'yellowtail_fish.png',       ko: '방어',         mirror: false },
  { id: 'amberjack',           sym: 'AMBERJACK',           file: 'yellowtail_amberjack.png',  ko: '부시리',       mirror: false },
  { id: 'greater_amberjack',   sym: 'GREATER_AMBERJACK',   file: 'greater_amberjack.png',     ko: '잿방어',       mirror: false },
];

/** 픽셀 격자 추출 — bbox 크롭 + 박스평균 다운샘플 (브라우저 컨텍스트에서 실행) */
async function extractGrid(page, b64, targetW, mirror) {
  return page.evaluate(async ({ b64: data, targetW: tw, mirror: mir }) => {
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
    // 배경 = 투명 / 근흑 / 근백(흰 배경이 구워진 원본 대비 — 테두리 연결 여부는 아래 alphaRatio로 진단)
    const isBg = (p) => p[3] < 24 || (p[0] < 14 && p[1] < 14 && p[2] < 14);
    let opaque = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 24) opaque++;
    const alphaRatio = opaque / (cv.width * cv.height);

    let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
    for (let y = 0; y < cv.height; y++) {
      for (let x = 0; x < cv.width; x++) {
        if (!isBg(at(x, y))) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      }
    }
    if (x1 < x0 || y1 < y0) return null;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const w = tw, h = Math.max(8, Math.round((bh / bw) * tw));
    const cells = [];
    for (let gy = 0; gy < h; gy++) {
      const row = [];
      for (let gx = 0; gx < w; gx++) {
        const ux = mir ? (w - 1 - gx) : gx;      // 머리 왼쪽 규약 — 굽는 시점에 반전
        const sx0 = x0 + Math.floor((ux / w) * bw), sx1 = x0 + Math.floor(((ux + 1) / w) * bw);
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
        // 셀의 45% 미만만 피사체면 배경으로 — 실루엣 가장자리 지저분함 방지
        if (n === 0 || n / Math.max(1, tot) < 0.45) { row.push(null); continue; }
        row.push([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
      }
      cells.push(row);
    }
    return { w, h, cells, srcW: cv.width, srcH: cv.height, alphaRatio };
  }, { b64, targetW, mirror });
}

/** 팔레트 양자화 (빈도 상위 MAX_COLORS 유지 + 최근접 병합) */
function quantize(cells) {
  const freq = new Map();
  for (const row of cells) {
    for (const c of row) {
      if (!c) continue;
      const key = ((c[0] >> 3) << 10) | ((c[1] >> 3) << 5) | (c[2] >> 3);   // 5비트 포스터라이즈
      const e = freq.get(key);
      if (e) { e.n++; e.r += c[0]; e.g += c[1]; e.b += c[2]; } else freq.set(key, { n: 1, r: c[0], g: c[1], b: c[2] });
    }
  }
  const pal = [...freq.values()].map((e) => ({ n: e.n, r: e.r / e.n, g: e.g / e.n, b: e.b / e.n }));
  pal.sort((a, b) => b.n - a.n);
  const keep = pal.slice(0, MAX_COLORS);
  const palette = keep.map((p) => (Math.round(p.r) << 16) | (Math.round(p.g) << 8) | Math.round(p.b));
  const nearest = (c) => {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < keep.length; i++) {
      const d = (keep[i].r - c[0]) ** 2 + (keep[i].g - c[1]) ** 2 + (keep[i].b - c[2]) ** 2;
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  };
  const rows = cells.map((row) => row.map((c) => (c ? AB[nearest(c)] : '.')).join(''));
  return { palette, rows };
}

(async () => {
  const previewArg = process.argv.indexOf('--preview');
  const previewPath = previewArg > 0 ? process.argv[previewArg + 1] : null;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  const baked = [];
  for (const sp of SPECIES) {
    const file = path.join(FISH_DIR, sp.file);
    if (!fs.existsSync(file)) { console.warn(`  ! ${sp.ko}: ${sp.file} 없음 — 건너뜀`); continue; }
    const b64 = fs.readFileSync(file).toString('base64');
    const grid = await extractGrid(page, b64, TARGET_W, sp.mirror);
    if (!grid) { console.warn(`  ! ${sp.ko}: 피사체를 찾지 못함 — 건너뜀`); continue; }
    const q = quantize(grid.cells);
    baked.push({ ...sp, ...grid, ...q });
    console.log(`  · ${sp.ko.padEnd(7)} ${String(grid.srcW).padStart(4)}×${String(grid.srcH).padEnd(4)}`
      + ` → ${grid.w}×${grid.h} · ${q.palette.length}색 · 불투명 ${(grid.alphaRatio * 100).toFixed(1)}%`
      + (sp.mirror ? ' · 미러' : ''));
  }

  // ── 검수용 프리뷰 시트 (머리 방향 확인) ──
  if (previewPath) {
    const png = await page.evaluate(({ items }) => {
      const COLS = 3, CW = 420, CH = 200;
      const cv = document.createElement('canvas');
      cv.width = COLS * CW;
      cv.height = Math.ceil(items.length / COLS) * CH;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#101820'; cx.fillRect(0, 0, cv.width, cv.height);
      items.forEach((it, i) => {
        const ox = (i % COLS) * CW, oy = Math.floor(i / COLS) * CH;
        cx.fillStyle = '#a9865f'; cx.fillRect(ox + 8, oy + 26, CW - 16, CH - 34);   // 도마
        const cell = Math.max(1, Math.floor(Math.min((CW - 40) / it.w, (CH - 60) / it.h)));
        const dx = ox + Math.floor((CW - it.w * cell) / 2), dy = oy + 26 + Math.floor((CH - 34 - it.h * cell) / 2);
        it.rows.forEach((row, y) => {
          for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            if (ch === '.') continue;
            cx.fillStyle = '#' + it.palette[it.ab.indexOf(ch)].toString(16).padStart(6, '0');
            cx.fillRect(dx + x * cell, dy + y * cell, cell, cell);
          }
        });
        cx.fillStyle = '#dfe8f2'; cx.font = 'bold 15px sans-serif';
        cx.fillText(`${it.ko}  (${it.w}×${it.h})`, ox + 12, oy + 19);
        cx.strokeStyle = '#3aa0ff'; cx.lineWidth = 2;                                // 왼쪽 = 머리여야 함
        cx.strokeRect(ox + 8, oy + 26, 26, CH - 34);
      });
      return cv.toDataURL('image/png');
    }, { items: baked.map((b) => ({ ko: b.ko, w: b.w, h: b.h, rows: b.rows, palette: b.palette, ab: AB })) });
    fs.writeFileSync(previewPath, Buffer.from(png.split(',')[1], 'base64'));
    console.log(`  프리뷰: ${previewPath}`);
  }

  await browser.close();

  // ── TS 출력 ──
  const fmt = (b) => `const ${b.sym}: PixelFishSprite = {\n  w: ${b.w}, h: ${b.h}, cellPx: ${Math.round(1536 / b.w)},\n`
    + `  palette: [${b.palette.map((p) => '0x' + p.toString(16).padStart(6, '0')).join(', ')}],\n`
    + `  rows: [\n${b.rows.map((r) => `    '${r}',`).join('\n')}\n  ],\n};\n`;

  const map = baked.map((b) => `  ${b.id}: ${b.sym},`).join('\n');
  const ts = `/**
 * @file PixelFishSpecies.ts
 * @description 손질 도마 **어종별 온마리** 픽셀 스프라이트 — **자동 생성 (수동 편집 금지)**
 *
 * 소스: packages/client-pc/public/fish/*.png (어획 팝업·도감과 같은 실사 이미지)
 * 재생성: node tools/gen_species_sprites.cjs
 *
 * 적용 = **개복 전 측면 뷰**(시메·방혈·머리따기·비늘치기·지느러미 제거·꼬리 칼집).
 * 개복 이후 전용 뷰(복면/체강/장뜨기/박피)는 어종군 공용 스프라이트를 계속 쓴다.
 * 전부 실사 색이므로 렌더 시 **틴트 금지**(\`nativeColor: true\`).
 */
import type { PixelFishSprite } from './PixelFishSprites.js';

${baked.map(fmt).join('\n')}
/** 어종 id → 도마 온마리 스프라이트 (없으면 어종군 공용으로 폴백) */
export const SPECIES_WHOLE: Record<string, PixelFishSprite> = {
${map}
  // 참돔 야간 — 같은 생물종이라 참돔 이미지 공용 (도감·어획 팝업과 동일 규칙)
  night_seabream: RED_SEABREAM,
};
`;
  fs.writeFileSync(OUT_TS, ts);
  console.log(`[gen_species] ${baked.length}종 -> ${OUT_TS}`);
})();
