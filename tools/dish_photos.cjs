/**
 * @file dish_photos.cjs
 * @description 255차 — 불요리 완성 요리 그림(Gemini)을 게임에 넣는다. 서더리 · 통생선 매운탕(`public/food/stew_red*.png`)과 같은 규격.
 *
 *  매운탕 두 장의 실측(`node tools/check_art_quality.cjs packages/client-pc/public/food`) — 셀 3px · 가로 168~188칸 · 긴 변 505~565px ·
 *  투명 바탕(냄비 손잡이 고리 안도 투명). 새 요리도 같은 셀 · 비슷한 칸 수로 굽는다(한 상에 나란히 놓였을 때 도트 크기가 같게).
 *
 *  1. 설치(`--from <폴더>`) — `gemini_item_art.cjs --looks tools/item_looks/_dishes.cjs --out <폴더>`가 뽑은 `<폴더>/<레시피>.png`
 *     → 흰 바탕 벗기기(손잡이 고리 안 갇힌 흰 섬까지) → 번짐 벗기기 → 타이트 크롭 → 격자 정규화(긴 변 192칸 · 셀 6px — 다른 아이템 원본과 같은 규격)
 *     → 원본 `food assets/dishes/<레시피>.png`(생성 해상도 그대로 두면 장당 1~1.6MB — 정규화하면 1/10 남짓)
 *  2. 굽기 — 원본(셀 6px)을 같은 192칸 · 셀 3px로 → `packages/client-pc/public/food/<레시피>.png`(긴 변 약 580px · 게임 텍스처 `food_<레시피>`)
 *     칸 경계가 원본과 정확히 맞으므로 다시 뽑는 색이 없다(셀 하나 = 원본 셀 하나).
 *  3. 칸 아이콘 — `public/food/*.png` 전부(매운탕 두 장 · 모둠회 포함) → 긴 변 64px `public/food/icon/<이름>.png`(텍스처 `food_<이름>__icon`).
 *     가방 · 상점 칸(≤ 72px)은 570px 사진을 GPU로 줄이지 않고 이 판을 쓴다(`FishTextures.fitFishTexture` — 어종 · 장비 카드와 같은 까닭).
 *  배선은 손으로 한다 — `FireRecipeDatabase`의 `photoKey: 'food_<레시피>'` + `scenes/BootScene.ts`의 음식 그림 목록 한 줄.
 *
 *  사용:
 *    node tools/dish_photos.cjs --from <생성 폴더> [--only grill_fish,stew_clear] [--force]   # 설치 + 굽기
 *    node tools/dish_photos.cjs [--only …]                                                    # 원본에서 다시 굽기만
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { DEFAULTS, decodeAny } = require('./pixelize_crops.cjs');
const { peelFringe, regrid } = require('./gemini_fish_art.cjs');
const { cutoutMulti } = require('./gemini_tackle_art.cjs');
const { encode } = require('./lib_png.cjs');
const { shrinkKeepAlpha } = require('./tackle_cards.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'food assets', 'dishes');
const OUT = path.join(ROOT, 'packages', 'client-pc', 'public', 'food');
const LOOKS = require('./item_looks/_dishes.cjs');
const OUT_ICON = path.join(OUT, 'icon');
const CELLS = 192, SRC_CELL = 6, CELL = 3, PAD = 2, ICON = 64;

function parseArgs(argv) {
  const P = { from: '', only: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--from') P.from = argv[++i];
    else if (argv[i] === '--only') P.only = new Set(argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
    else if (argv[i] === '--force') P.force = true;
  }
  return P;
}

/** 불투명 픽셀 경계 + 여백 PAD로 잘라 낸다(투명 픽셀 RGB는 0 — 줄일 때 흰 테가 번지지 않게) */
function tightCrop(d, w, h, pad) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1 + pad * 2, bh = y1 - y0 + 1 + pad * 2;
  const out = Buffer.alloc(bw * bh * 4);
  for (let y = y0; y <= y1; y++) d.copy(out, ((y - y0 + pad) * bw + pad) * 4, (y * w + x0) * 4, (y * w + x1 + 1) * 4);
  for (let i = 0; i < bw * bh; i++) if (out[i * 4 + 3] === 0) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0;
  return { w: bw, h: bh, data: out };
}

async function installOne(key, it, P) {
  const src = path.join(P.from, `${key}.png`);
  if (!fs.existsSync(src)) { console.warn(`${key}: 생성본 없음 — ${src}`); return false; }
  const dst = path.join(SRC, it.file);
  if (fs.existsSync(dst) && !P.force) { console.log(`${path.relative(ROOT, dst)}: 이미 있어 건너뛴다(--force로 덮기)`); return true; }
  const img = await decodeAny(src);
  const cut = cutoutMulti(img, DEFAULTS.tol, true, false);
  const pf = peelFringe(cut.data, img.w, img.h);
  const c = tightCrop(cut.data, img.w, img.h, PAD);
  if (!c) { console.error(`${key}: 전경이 없다`); return false; }
  const g = regrid(c.data, c.w, c.h, CELLS, SRC_CELL);
  const pw = g.w + SRC_CELL * 2, ph = g.h + SRC_CELL * 2, padded = Buffer.alloc(pw * ph * 4);
  for (let y = 0; y < g.h; y++) g.data.copy(padded, ((y + SRC_CELL) * pw + SRC_CELL) * 4, y * g.w * 4, (y + 1) * g.w * 4);
  const bytes = encode(pw, ph, padded, dst);
  console.log(`${key} → ${path.relative(ROOT, dst)}: ${img.w}x${img.h} → ${pw}x${ph} · 격자 ${g.cw}×${g.ch}칸(셀 ${SRC_CELL}px) (${(bytes / 1024).toFixed(0)}KB) · ${cut.note} · 번짐 ${pf.peeled}px`);
  return true;
}

async function bakeOne(key, it) {
  const src = path.join(SRC, it.file);
  if (!fs.existsSync(src)) return false;
  const img = await decodeAny(src);
  // 원본의 칸 수(여백 한 칸씩 포함)를 그대로 — 셀 경계가 원본과 정확히 맞아 칸 하나 = 원본 칸 하나
  const cells = Math.round(Math.max(img.w, img.h) / SRC_CELL);
  const g = regrid(img.data, img.w, img.h, cells, CELL);
  const dst = path.join(OUT, it.file);
  const bytes = encode(g.w, g.h, g.data, dst);
  console.log(`${key} → ${path.relative(ROOT, dst)}: ${g.w}x${g.h} · 격자 ${g.cw}×${g.ch}칸(셀 ${CELL}px · 여백 칸 포함) · ${(bytes / 1024).toFixed(0)}KB`);
  return true;
}

/** 칸 아이콘(긴 변 64px · 면적 평균 + 불투명도 보존) — public/food/의 모든 그림 */
async function bakeIcons() {
  fs.mkdirSync(OUT_ICON, { recursive: true });
  const names = fs.readdirSync(OUT).filter((n) => n.endsWith('.png'));
  for (const n of names) {
    const img = await decodeAny(path.join(OUT, n));
    const s = Math.min(1, ICON / img.w, ICON / img.h);
    const w = Math.max(1, Math.round(img.w * s)), h = Math.max(1, Math.round(img.h * s));
    encode(w, h, shrinkKeepAlpha(img.data, img.w, img.h, w, h), path.join(OUT_ICON, n));
  }
  console.log(`칸 아이콘 ${names.length}장 → ${path.relative(ROOT, OUT_ICON)}/ (${names.join(' · ')})`);
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  const keys = Object.keys(LOOKS).filter((k) => !P.only || P.only.has(k));
  fs.mkdirSync(SRC, { recursive: true });
  if (P.from) for (const k of keys) await installOne(k, LOOKS[k], P);
  let n = 0;
  for (const k of keys) if (await bakeOne(k, LOOKS[k])) n++;
  await bakeIcons();
  console.log(`${n}장 구움 → 배선: FireRecipeDatabase photoKey 'food_<레시피>' + BootScene load.image('food_<레시피>', 'food/<레시피>.png')`);
}

if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
