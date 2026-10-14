/**
 * @file fish_cards.cjs
 * @description 246차 — 어종 그림을 게임용 **카드 · 아이콘**으로 굽는다(작물 초상 244차 카드 방식과 같은 생각).
 *
 *  원본 = `food assets/fish/<파일>`(셀 6px 전후 · 긴 변 500~2,200px). 게임은 원본을 싣지 않는다 — 원본 53장을 그대로 싣던 때
 *  부팅 텍스처가 약 181MB였다(244 실측). 화면은 고정 1280×720이고 어종 그림을 가장 크게 그리는 칸은
 *  손질 도마 미리보기 410×166(`UtilizationPanel` 480×240 도마 − 여백) · 어획 결과 창 최대 360×146 · 상세 창 300×120이다.
 *  그래서 카드 = 410×166 안에 맞춘 면적 평균(도마에서 1:1), 아이콘 = 긴 변 64px(가방 · 쿨러 칸처럼 72px 이하로 그리는 곳).
 *  비율은 원본 그대로다(여백도 그대로 줄인다) — 화면 코드는 모두 비율로 칸에 맞추므로 그려지는 크기가 바뀌지 않는다.
 *
 *  사용:
 *    node tools/fish_cards.cjs              # 표에 있는 전부
 *    node tools/fish_cards.cjs --only black_scraper.png
 *    node tools/fish_cards.cjs --check      # 굽지 않고 표 ↔ 원본 ↔ 출력만 대조
 *  표 = `packages/client-pc/src/data/FishTextures.ts`의 FISH_IMAGE_FILES(텍스처 키 → 파일). 표에 있는데 원본이 없으면 실패한다.
 *  출력 = `packages/client-pc/public/fish/<파일>`(카드 · `fish_<…>`) + `public/fish/icon/<파일>`(아이콘 · `fishicon_<…>`).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decodeAny, areaResize } = require('./pixelize_crops.cjs');
const { encode } = require('./lib_png.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'food assets', 'fish');
const OUT = path.join(ROOT, 'packages', 'client-pc', 'public', 'fish');
const OUT_ICON = path.join(OUT, 'icon');
const TABLE_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'FishTextures.ts');
/** 카드 칸 — 손질 도마 미리보기(480×240 도마 − 70 · 74)와 같다. 어획 결과 창(360×146) · 상세(300×120)는 이것을 줄여 그린다 */
const CARD_W = 410, CARD_H = 166;
/** 아이콘 긴 변 — `FISH_ICON_MAX_PX`(72) 이하로 그리는 곳이 쓴다 */
const ICON = 64;

function parseArgs(argv) {
  const P = { only: null, check: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') P.only = new Set(argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
    else if (argv[i] === '--check') P.check = true;
  }
  return P;
}

/** FishTextures.ts의 FISH_IMAGE_FILES 표(텍스처 키 → 파일)를 읽는다 */
function readTable() {
  const src = fs.readFileSync(TABLE_TS, 'utf8');
  const i = src.indexOf('export const FISH_IMAGE_FILES');
  if (i < 0) throw new Error('FishTextures.ts에 FISH_IMAGE_FILES가 없다');
  const body = src.slice(i, src.indexOf('};', i));
  const out = new Map();
  for (const m of body.matchAll(/^\s+(fish_[a-z0-9_]+):\s*'([^']+\.png)'/gm)) out.set(m[1], m[2]);
  return out;
}

/** 칸 안에 비율대로 맞춘 크기(키우지는 않는다) */
function fit(w, h, bw, bh) {
  const s = Math.min(1, bw / w, bh / h);
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  const table = readTable();
  const files = [...new Set(table.values())];
  const missing = files.filter((f) => !fs.existsSync(path.join(SRC, f)));
  if (missing.length) { console.error(`원본이 없다(food assets/fish/): ${missing.join(', ')}`); process.exit(1); }
  const extra = fs.readdirSync(SRC).filter((f) => f.endsWith('.png') && !files.includes(f));
  if (extra.length) console.warn(`표에 없는 원본(굽지 않는다): ${extra.join(', ')}`);
  if (P.check) {
    const noCard = files.filter((f) => !fs.existsSync(path.join(OUT, f)) || !fs.existsSync(path.join(OUT_ICON, f)));
    console.log(`표 ${table.size}키 · 파일 ${files.length} · 원본 다 있음 · 카드/아이콘 없는 것 ${noCard.length}${noCard.length ? `: ${noCard.join(', ')}` : ''}`);
    process.exit(noCard.length ? 1 : 0);
  }
  fs.mkdirSync(OUT_ICON, { recursive: true });
  let before = 0, after = 0, n = 0;
  for (const f of files) {
    if (P.only && !P.only.has(f)) continue;
    const img = await decodeAny(path.join(SRC, f));
    const [cw, ch] = fit(img.w, img.h, CARD_W, CARD_H);
    const [iw, ih] = fit(img.w, img.h, ICON, ICON);
    const cb = encode(cw, ch, areaResize(img.data, img.w, img.h, cw, ch), path.join(OUT, f));
    encode(iw, ih, areaResize(img.data, img.w, img.h, iw, ih), path.join(OUT_ICON, f));
    before += img.w * img.h * 4; after += cw * ch * 4 + iw * ih * 4; n++;
    console.log(`${f}: ${img.w}x${img.h} → 카드 ${cw}x${ch}(${(cb / 1024).toFixed(0)}KB) · 아이콘 ${iw}x${ih}`);
  }
  console.log(`${n}장 · 텍스처(RGBA) ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
