/**
 * @file forage_cards.cjs
 * @description 248차 — 갯것(해루질 생물) · 생미끼 그림을 게임용으로 굽는다(246차 `fish_cards.cjs`와 같은 생각).
 *
 *  원본 = `food assets/forage/art/<파일>`(초상) · `food assets/forage/top/<생물 id>.png`(위에서 본 그림 — 있을 때만).
 *  출력 네 가지:
 *   1. 카드 `public/forage/<파일>` — 300×160 안에 맞춘 면적 평균(상세 창 큰 그림 300×120 · 혼잣말 초상 약 102px).
 *   2. 아이콘 `public/forage/icon/<파일>` — 긴 변 64px(가방 · 쿨러처럼 72px 이하로 그리는 칸).
 *   3. 채집 놀이 판 `public/forage-board/<id>.png` — 긴 변 44px(윤곽 1px 포함) · 알파는 딱 끊는다.
 *      사용자가 판 크기로 손봐 둔 5종(`KEEP_BOARD`)은 건드리지 않는다.
 *   4. 필드 점 그림 `public/forage-dot/<id>.png` — 긴 변 24px(윤곽 1px 포함). 필드는 1배로 그린다.
 *  판 · 점은 위에서 본 그림이 있으면 그것을, 없으면 초상을 줄인다(게 · 조개 · 굴 · 홍합 · 거북손 · 지렁이 — 초상이 이미 그 모습이다).
 *  아주 작게 줄이면 원본의 굵은 윤곽선이 1px 아래로 녹아 바닥에 묻힌다 — 그래서 바깥 1px 윤곽(이웃 색의 3할 밝기)을 다시 두른다.
 *
 *  사용:
 *    node tools/forage_cards.cjs              # 전부
 *    node tools/forage_cards.cjs --check      # 굽지 않고 표 ↔ 원본 ↔ 출력만 대조
 *    node tools/forage_cards.cjs --sheet <png> # 판 · 점 검수 시트(바닥 색 위 · 실제 배율)
 *  표 = `packages/client-pc/src/data/ForageTextures.ts`의 FORAGE_IMAGE_FILES. 생물 목록 = core 빌드(`packages/core/dist`)의 SHORE_CREATURE_DATABASE.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decodeAny, areaResize } = require('./pixelize_crops.cjs');
const { encode } = require('./lib_png.cjs');

const ROOT = path.resolve(__dirname, '..');
const ART = path.join(ROOT, 'food assets', 'forage', 'art');
const TOP = path.join(ROOT, 'food assets', 'forage', 'top');
const PUB = path.join(ROOT, 'packages', 'client-pc', 'public');
const OUT = path.join(PUB, 'forage');
const OUT_ICON = path.join(OUT, 'icon');
const OUT_BOARD = path.join(PUB, 'forage-board');
const OUT_DOT = path.join(PUB, 'forage-dot');
const TABLE_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'ForageTextures.ts');
const CARD_W = 300, CARD_H = 160, ICON = 64, BOARD = 44, DOT = 24;
/** 사용자가 판 크기로 손봐 둔 판 그림(225 · 226 · 228차) — 다시 굽지 않는다 */
const KEEP_BOARD = new Set(['perinereis_aibuhitensis', 'marphysa_sanguinea', 'ligia_exotica', 'stichopus_japonicus', 'strongylocentrotus_nudus']);
/** 표 밖의 원본 — 돌문어는 낚은 참문어와 같은 그림(어종 원본) */
const EXTRA_SRC = { octopus_vulgaris: path.join(ROOT, 'food assets', 'fish', 'common_octopus.png') };
/** 해루질 생물 밖의 점 그림 — 텃밭 땅지렁이 */
const EXTRA_DOTS = { earthworm: 'earthworm.png' };

function parseArgs(argv) {
  const P = { check: false, sheet: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') P.check = true;
    else if (argv[i] === '--sheet') P.sheet = argv[++i];
  }
  return P;
}

function readTable() {
  const src = fs.readFileSync(TABLE_TS, 'utf8');
  const i = src.indexOf('export const FORAGE_IMAGE_FILES');
  if (i < 0) throw new Error('ForageTextures.ts에 FORAGE_IMAGE_FILES가 없다');
  const body = src.slice(i, src.indexOf('};', i));
  const out = new Map();
  for (const m of body.matchAll(/^\s+([a-z_]+):\s*'([^']+\.png)'/gm)) out.set(m[1], m[2]);
  return out;
}

function fit(w, h, bw, bh) {
  const s = Math.min(1, bw / w, bh / h);
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}

/** 불투명 테두리 상자로 자른다 */
function crop(img) {
  const { w, h, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return img;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) data.copy(out, y * cw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4);
  return { w: cw, h: ch, data: out };
}

/**
 * 작은 스프라이트(판 · 점) — 긴 변 `long`px(윤곽 1px 포함). 면적 평균 → 알파 끊기(0.45) → 채도 · 대비 조금 → 바깥 윤곽 1px(4이웃 · 이웃 평균의 3할 밝기).
 */
function sprite(img, long) {
  const c = crop(img);
  const [iw, ih] = fit(c.w, c.h, long - 2, long - 2);
  const small = areaResize(c.data, c.w, c.h, iw, ih);
  for (let i = 0; i < iw * ih; i++) {
    const o = i * 4;
    if (small[o + 3] < 115) { small[o] = small[o + 1] = small[o + 2] = small[o + 3] = 0; continue; }
    small[o + 3] = 255;
    // 줄이면 색이 탁해진다 — 채도 ×1.15 · 대비 ×1.08(밝기 128 기준)
    const r = small[o], g = small[o + 1], b = small[o + 2];
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    for (let k = 0; k < 3; k++) {
      const v = (L + (small[o + k] - L) * 1.15 - 128) * 1.08 + 128;
      small[o + k] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
  const W = iw + 2, H = ih + 2, out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < ih; y++) small.copy(out, ((y + 1) * W + 1) * 4, y * iw * 4, (y + 1) * iw * 4);
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && out[(y * W + x) * 4 + 3] === 255;
  const rim = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (solid(x, y)) continue;
    let n = 0, r = 0, g = 0, b = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (solid(x + dx, y + dy)) { const q = ((y + dy) * W + x + dx) * 4; n++; r += out[q]; g += out[q + 1]; b += out[q + 2]; }
    if (n) rim.push([(y * W + x) * 4, Math.round(r / n * 0.3), Math.round(g / n * 0.3), Math.round(b / n * 0.3)]);
  }
  for (const [o, r, g, b] of rim) { out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255; }
  return { w: W, h: H, data: out };
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  const table = readTable();
  const files = [...new Set(table.values())];
  const missing = files.filter((f) => !fs.existsSync(path.join(ART, f)));
  if (missing.length) { console.error(`원본이 없다(food assets/forage/art/): ${missing.join(', ')}`); process.exit(1); }
  const core = await import(path.join(ROOT, 'packages/core/dist/index.js'));
  const ids = core.SHORE_CREATURE_DATABASE.map((c) => c.id);
  /** 판 · 점 원본 — 위에서 본 그림 → 초상(표) → 표 밖 원본 */
  const fieldSrc = (id) => {
    const top = path.join(TOP, `${id}.png`);
    if (fs.existsSync(top)) return top;
    const f = table.get(`forage_${id}`) ?? EXTRA_DOTS[id];
    if (f) return path.join(ART, f);
    return EXTRA_SRC[id] ?? null;
  };
  const noSrc = ids.filter((id) => !fieldSrc(id));
  if (noSrc.length) { console.error(`판 · 점 원본이 없는 생물: ${noSrc.join(', ')}`); process.exit(1); }
  if (P.check) {
    const lack = [];
    for (const f of files) if (!fs.existsSync(path.join(OUT, f)) || !fs.existsSync(path.join(OUT_ICON, f))) lack.push(f);
    for (const id of [...ids, ...Object.keys(EXTRA_DOTS)]) if (!fs.existsSync(path.join(OUT_DOT, `${id}.png`))) lack.push(`dot/${id}`);
    for (const id of ids) if (!fs.existsSync(path.join(OUT_BOARD, `${id}.png`))) lack.push(`board/${id}`);
    console.log(`표 ${table.size}키 · 파일 ${files.length} · 생물 ${ids.length} · 없는 출력 ${lack.length}${lack.length ? `: ${lack.join(', ')}` : ''}`);
    process.exit(lack.length ? 1 : 0);
  }
  for (const d of [OUT, OUT_ICON, OUT_BOARD, OUT_DOT]) fs.mkdirSync(d, { recursive: true });
  let before = 0, after = 0;
  for (const f of files) {
    const img = await decodeAny(path.join(ART, f));
    const [cw, ch] = fit(img.w, img.h, CARD_W, CARD_H);
    const [iw, ih] = fit(img.w, img.h, ICON, ICON);
    const cb = encode(cw, ch, areaResize(img.data, img.w, img.h, cw, ch), path.join(OUT, f));
    encode(iw, ih, areaResize(img.data, img.w, img.h, iw, ih), path.join(OUT_ICON, f));
    before += img.w * img.h * 4; after += cw * ch * 4 + iw * ih * 4;
    console.log(`${f}: ${img.w}x${img.h} → 카드 ${cw}x${ch}(${(cb / 1024).toFixed(0)}KB) · 아이콘 ${iw}x${ih}`);
  }
  const sheet = [];
  for (const id of [...ids, ...Object.keys(EXTRA_DOTS)]) {
    const src = fieldSrc(id);
    const img = await decodeAny(src);
    const dot = sprite(img, DOT);
    encode(dot.w, dot.h, dot.data, path.join(OUT_DOT, `${id}.png`));
    let boardNote = '판 없음(생물 아님)';
    if (ids.includes(id)) {
      if (KEEP_BOARD.has(id)) boardNote = '판 그대로(사용자 그림)';
      else { const b = sprite(img, BOARD); encode(b.w, b.h, b.data, path.join(OUT_BOARD, `${id}.png`)); boardNote = `판 ${b.w}x${b.h}`; }
    }
    sheet.push(id);
    console.log(`${id}: ${path.relative(ROOT, src)} → 점 ${dot.w}x${dot.h} · ${boardNote}`);
  }
  console.log(`카드 · 아이콘 ${files.length}장 · 텍스처(RGBA) ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB · 점 ${sheet.length} · 판 ${ids.length - KEEP_BOARD.size}`);
  if (P.sheet) {
    // 검수 시트 — 판(44px ×3 = 게임 판 배율) · 점(24px ×1과 ×4)을 갯바위 · 모래 · 흙 색 위에
    const { execFileSync } = require('child_process');
    const tmp = path.join(path.dirname(P.sheet), '_forage_sheet');
    fs.mkdirSync(tmp, { recursive: true });
    const tiles = [];
    for (const id of sheet) {
      const parts = [];
      const bp = path.join(OUT_BOARD, `${id}.png`);
      if (fs.existsSync(bp)) parts.push(['-background', '#5d5a52', bp, '-filter', 'point', '-resize', '300%', '-gravity', 'center', '-extent', '150x150']);
      parts.push(['-background', '#c9b48a', path.join(OUT_DOT, `${id}.png`), '-gravity', 'center', '-extent', '40x40']);
      parts.push(['-background', '#6b4a2e', path.join(OUT_DOT, `${id}.png`), '-filter', 'point', '-resize', '400%', '-gravity', 'center', '-extent', '110x110']);
      const pieces = parts.map((a, k) => { const o = path.join(tmp, `${id}_${k}.png`); execFileSync('convert', [...a.slice(0, 2), a[2], ...a.slice(3), o]); return o; });
      const t = path.join(tmp, `${id}.png`);
      execFileSync('convert', [...pieces, '-background', '#1a1c22', '-gravity', 'center', '+append', t]);
      tiles.push(t);
    }
    execFileSync('montage', ['-label', '%t', ...tiles, '-background', '#1a1c22', '-fill', 'white', '-tile', '3x', '-geometry', '+6+6', P.sheet]);
    console.log(`시트 → ${P.sheet}`);
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
