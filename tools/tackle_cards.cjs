/**
 * @file tackle_cards.cjs
 * @description 249차 — 낚시 장비 그림을 게임용으로 굽는다(246차 `fish_cards.cjs` · 248차 `forage_cards.cjs`와 같은 생각).
 *
 *  원본 = `food assets/tackle/<파일>`(사용자 그림 · Gemini 그림 — 1,000px 안팎). 게임이 원본을 그대로 싣으면 장당 텍스처 6MB다
 *  (248차까지 장비 그림 41장 = 약 209MB). 실제로 그리는 크기는 상세 창 큰 그림(228×90 칸)과 가방 · 상점 칸(16~52px)뿐이다.
 *  출력 두 가지:
 *   1. 카드 `packages/client-pc/public/tackle/<파일>` — 228×90 안에 맞춘 판(상세 창이 그 크기로 그린다 — 작물 카드와 같은 칸).
 *   2. 아이콘 `packages/client-pc/public/tackle/icon/<파일>` — 긴 변 64px(72px 이하로 그리는 칸 — `fitFishTexture`가 고른다).
 *  줄이기 = 면적 평균 + **불투명도 보존**: 칸 안 알파 최댓값이 반을 넘으면 알파를 그 9할까지 올린다.
 *  대 · 바늘 · 도래처럼 원본에서 몇 px 굵기인 선이 1px 아래로 녹아 반투명해지는 것을 막는다(색은 알파 가중 평균 그대로).
 *  캔버스(여백)는 그대로 둔다 — 쿠션고무 · 좁쌀봉돌처럼 사용자가 작은 부속을 작게 그려 둔 비율을 지킨다.
 *
 *  사용:
 *    node tools/tackle_cards.cjs              # 전부
 *    node tools/tackle_cards.cjs --only rod_surf.png,cap.png
 *    node tools/tackle_cards.cjs --check      # 굽지 않고 표 ↔ 원본 ↔ 출력만 대조
 *    node tools/tackle_cards.cjs --sheet <png> # 아이콘 검수 시트(가방 칸 색 위 · 30px 실제 크기 + 64px)
 *  표 = `packages/client-pc/src/data/TackleTextures.ts`의 TACKLE_IMAGE_FILES.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decodeAny } = require('./pixelize_crops.cjs');
const { encode } = require('./lib_png.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'food assets', 'tackle');
const OUT = path.join(ROOT, 'packages', 'client-pc', 'public', 'tackle');
const OUT_ICON = path.join(OUT, 'icon');
const TABLE_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'TackleTextures.ts');
const CARD_W = 228, CARD_H = 90, ICON = 64;

function parseArgs(argv) {
  const P = { check: false, sheet: '', only: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') P.check = true;
    else if (argv[i] === '--sheet') P.sheet = argv[++i];
    else if (argv[i] === '--only') P.only = new Set(argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
  }
  return P;
}

/** TackleTextures.ts → Map(텍스처 키 → 파일) */
function readTable() {
  const src = fs.readFileSync(TABLE_TS, 'utf8');
  const i = src.indexOf('export const TACKLE_IMAGE_FILES');
  if (i < 0) throw new Error('TackleTextures.ts에 TACKLE_IMAGE_FILES가 없다');
  const body = src.slice(i, src.indexOf('};', i));
  const out = new Map();
  for (const m of body.matchAll(/^\s+([a-z0-9_]+):\s*'([^']+\.png)'/gm)) out.set(m[1], m[2]);
  return out;
}

function fit(w, h, bw, bh) {
  const s = Math.min(1, bw / w, bh / h);
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}

/**
 * 면적 평균 축소 + 불투명도 보존. 색 = 칸 안 알파 가중 평균(투명 픽셀의 검정이 번지지 않는다),
 * 알파 = max(평균, 최댓값 × 0.9 — 최댓값이 128 이상일 때만). 가는 선이 칸 하나를 다 못 채워도 불투명하게 남는다.
 */
function shrinkKeepAlpha(src, sw, sh, tw, th) {
  const out = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) {
    const y0 = Math.floor(y * sh / th), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sh / th));
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor(x * sw / tw), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sw / tw));
      let r = 0, g = 0, b = 0, a = 0, amax = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        const o = (yy * sw + xx) * 4, al = src[o + 3];
        r += src[o] * al; g += src[o + 1] * al; b += src[o + 2] * al; a += al; n++;
        if (al > amax) amax = al;
      }
      const o = (y * tw + x) * 4;
      if (a === 0) continue;
      out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a);
      const avg = a / n;
      out[o + 3] = Math.round(Math.min(255, amax >= 128 ? Math.max(avg, amax * 0.9) : avg));
    }
  }
  return out;
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  const table = readTable();
  const files = [...new Set(table.values())].filter((f) => !P.only || P.only.has(f));
  const missing = files.filter((f) => !fs.existsSync(path.join(SRC, f)));
  if (P.check) {
    const lack = files.filter((f) => !fs.existsSync(path.join(OUT, f)) || !fs.existsSync(path.join(OUT_ICON, f)));
    console.log(`표 ${table.size}키 · 파일 ${files.length} · 원본 없음 ${missing.length}${missing.length ? `: ${missing.join(', ')}` : ''} · 출력 없음 ${lack.length}${lack.length ? `: ${lack.join(', ')}` : ''}`);
    process.exit(missing.length || lack.length ? 1 : 0);
  }
  if (missing.length) { console.error(`원본이 없다(food assets/tackle/): ${missing.join(', ')}`); process.exit(1); }
  fs.mkdirSync(OUT_ICON, { recursive: true });
  let before = 0, after = 0;
  for (const f of files) {
    const img = await decodeAny(path.join(SRC, f));
    const [cw, ch] = fit(img.w, img.h, CARD_W, CARD_H);
    const [iw, ih] = fit(img.w, img.h, ICON, ICON);
    const cb = encode(cw, ch, shrinkKeepAlpha(img.data, img.w, img.h, cw, ch), path.join(OUT, f));
    encode(iw, ih, shrinkKeepAlpha(img.data, img.w, img.h, iw, ih), path.join(OUT_ICON, f));
    before += img.w * img.h * 4; after += cw * ch * 4 + iw * ih * 4;
    console.log(`${f}: ${img.w}x${img.h} → 카드 ${cw}x${ch}(${(cb / 1024).toFixed(0)}KB) · 아이콘 ${iw}x${ih}`);
  }
  console.log(`카드 · 아이콘 ${files.length}장 · 텍스처(RGBA) ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(2)}MB`);
  if (P.sheet) {
    // 검수 시트 — 가방 칸 색(#0d1b2a) 위에 64px 아이콘과 30px(가방 칸 실제 크기 · NEAREST), 카드
    const { execFileSync } = require('child_process');
    const tmp = path.join(path.dirname(P.sheet), '_tackle_sheet');
    fs.mkdirSync(tmp, { recursive: true });
    const tiles = [];
    for (const [key, f] of table) {
      if (!files.includes(f)) continue;
      const a = path.join(tmp, `${key}_a.png`), b = path.join(tmp, `${key}_b.png`), c = path.join(tmp, `${key}_c.png`), t = path.join(tmp, `${key}.png`);
      execFileSync('convert', ['-background', '#0d1b2a', path.join(OUT_ICON, f), '-gravity', 'center', '-extent', '72x72', a]);
      execFileSync('convert', ['-background', '#0d1b2a', path.join(OUT_ICON, f), '-filter', 'point', '-resize', '30x30', '-gravity', 'center', '-extent', '40x40', b]);
      execFileSync('convert', ['-background', '#112233', path.join(OUT, f), '-gravity', 'center', '-extent', '232x94', c]);
      execFileSync('convert', [a, b, c, '-background', '#1a1c22', '-gravity', 'center', '+append', t]);
      tiles.push(t);
    }
    execFileSync('montage', ['-label', '%t', ...tiles, '-background', '#1a1c22', '-fill', 'white', '-pointsize', '11', '-tile', '3x', '-geometry', '+6+6', P.sheet]);
    console.log(`시트 → ${P.sheet}`);
  }
}

module.exports = { shrinkKeepAlpha };
if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
