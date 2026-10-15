/**
 * @file item_cards.cjs
 * @description 255차 — 장비 밖 아이템 그림(Gemini)을 게임용으로 굽고 표(`src/data/ItemImages.ts`)를 쓴다.
 *  249차 `tackle_cards.cjs`와 같은 생각 — 원본(1,000px 안팎)을 그대로 싣지 않고 두 크기만 싣는다.
 *
 *  입력
 *   - 생김새 표 `tools/item_looks/*.cjs`(밑줄 파일 제외) — 키 · 파일 · 이 그림을 쓰는 아이템 id(`ids`) · 16px 키(`px`)
 *   - 원본 `food assets/items/<파일>`(`gemini_item_art.cjs --install`이 둔다). 원본이 없는 항목은 건너뛴다(표에만 있고 아직 안 그린 것).
 *   - 별칭 `tools/item_looks/_alias.cjs` — 옛 그림 키 → 작물 초상 id(`CROP_PORTRAIT`) · 다른 텍스처 키(`TEXTURE`)
 *  출력
 *   1. 카드 `packages/client-pc/public/items/<파일>` — 228×90 안(상세 창 큰 그림 칸)
 *   2. 아이콘 `packages/client-pc/public/items/icon/<파일>` — 긴 변 64px(가방 · 상점 · 퀵슬롯 칸 — `fitFishTexture`가 고른다)
 *   3. `packages/client-pc/src/data/ItemImages.ts` — 자동 생성(수동 편집 금지)
 *  줄이기는 `tackle_cards.cjs`의 면적 평균 + 불투명도 보존(`shrinkKeepAlpha`).
 *
 *  사용:
 *    node tools/item_cards.cjs              # 전부(원본이 있는 것만)
 *    node tools/item_cards.cjs --only bandage.png,homi.png
 *    node tools/item_cards.cjs --check      # 굽지 않고 표 ↔ 원본 ↔ 출력 대조
 *    node tools/item_cards.cjs --sheet <png> # 아이콘 검수 시트(가방 칸 색 위 · 30px 실제 크기 + 64px + 카드)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { decodeAny } = require('./pixelize_crops.cjs');
const { encode } = require('./lib_png.cjs');
const { shrinkKeepAlpha } = require('./tackle_cards.cjs');
const { loadLooks } = require('./gemini_item_art.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'food assets', 'items');
const OUT = path.join(ROOT, 'packages', 'client-pc', 'public', 'items');
const OUT_ICON = path.join(OUT, 'icon');
const TABLE_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'ItemImages.ts');
const CROPS = path.join(ROOT, 'packages', 'client-pc', 'public', 'crops');
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

function fit(w, h, bw, bh) {
  const s = Math.min(1, bw / w, bh / h);
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}

function loadAlias() {
  const p = path.join(__dirname, 'item_looks', '_alias.cjs');
  const a = fs.existsSync(p) ? require(p) : {};
  return { crop: a.CROP_PORTRAIT ?? {}, tex: a.TEXTURE ?? {} };
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const rec = (name, doc, obj) => [
  `/** ${doc} */`,
  `export const ${name}: Record<string, string> = {`,
  ...Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `  ${/^[a-z_][a-z0-9_]*$/.test(k) ? k : q(k)}: ${q(v)},`),
  '};',
  '',
];

/** 표(TS) 쓰기 — 원본이 있는 항목만 */
function writeTable(LOOKS, alias, have) {
  const files = {}, byId = {}, byPx = {};
  for (const [key, it] of Object.entries(LOOKS)) {
    if (!have.has(it.file)) continue;
    files[key] = it.file;
    for (const id of it.ids ?? []) byId[id] = key;
    for (const px of it.px ?? []) byPx[px] = key;
  }
  // 작물 초상 별칭은 초상이 실제로 있을 때만(카드 · 아이콘 둘 다)
  const crop = {};
  for (const [k, id] of Object.entries(alias.crop)) {
    if (fs.existsSync(path.join(CROPS, `${id}_card.png`)) && fs.existsSync(path.join(CROPS, `${id}_icon.png`))) crop[k] = id;
    else console.warn(`별칭 건너뜀 — 작물 초상 없음: ${k} → ${id}`);
  }
  // 같은 음식 별칭은 가리키는 그림이 실제로 있을 때만(`food_<레시피>` = `public/food/<레시피>.png`)
  const tex = {};
  for (const [k, t] of Object.entries(alias.tex)) {
    if (t.startsWith('food_') && !fs.existsSync(path.join(ROOT, 'packages', 'client-pc', 'public', 'food', `${t.slice(5)}.png`))) {
      console.warn(`별칭 건너뜀 — 음식 그림 없음: ${k} → ${t}`);
      continue;
    }
    tex[k] = t;
  }
  const lines = [
    '/**',
    ' * @file ItemImages.ts',
    ' * @description 255차 — 장비 밖 아이템 그림(Gemini) 표 · 별칭 (자동 생성 — `node tools/item_cards.cjs` · 수동 편집 금지)',
    ' *',
    ' * 원본은 `food assets/items/<파일>`, 생김새는 `tools/item_looks/*.cjs`(생성기 `tools/gemini_item_art.cjs`).',
    ' * 게임은 카드(`items/<파일>` — 상세 창 칸 228×90 안)와 64px 아이콘(`items/icon/<파일>` → `<키>__icon`)만 싣는다(`scenes/BootScene.ts`).',
    ' * 어느 아이템이 어느 그림을 쓰는지는 `ui/ItemIcon.ts`가 정한다 — 아이템 id(`ITEM_IMAGE_BY_ID`) → 16px 키(`ITEM_IMAGE_BY_PX`) →',
    ' * 원래 텍스처 키(옛 코드 그림 키 `art_*`는 키를 그대로 두고 그림만 바뀐다 — `tools/item_art/build.py`가 그 키를 굽지 않는다).',
    ' */',
    '',
    ...rec('ITEM_IMAGE_FILES', '텍스처 키 → 파일(카드 `items/<파일>` · 아이콘 `items/icon/<파일>`)', files),
    ...rec('ITEM_IMAGE_BY_ID', '아이템 id → 텍스처 키(가구처럼 텍스처 키가 필드 그림을 가리키는 아이템)', byId),
    ...rec('ITEM_IMAGE_BY_PX', '16px 아이콘 키(`px:…`) → 텍스처 키(씨앗 · 모종 · 농사 도구처럼 16px 손그림만 있던 것)', byPx),
    ...rec('ITEM_CROP_PORTRAIT_ALIAS', '옛 그림 키 → 작물 초상 id — 상점 요리 재료 채소가 같은 작물의 수확물과 같은 그림을 쓴다', crop),
    ...rec('ITEM_TEXTURE_ALIAS', '옛 그림 키 → 다른 텍스처 키 — 같은 음식은 어디서나 같은 그림(상점 전복죽 = 불요리 전복죽)', tex),
  ];
  fs.writeFileSync(TABLE_TS, lines.join('\n'));
  console.log(`표 → ${path.relative(ROOT, TABLE_TS)}: 그림 ${Object.keys(files).length} · id ${Object.keys(byId).length} · 16px ${Object.keys(byPx).length} · 작물 별칭 ${Object.keys(crop).length} · 텍스처 별칭 ${Object.keys(tex).length}`);
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  const LOOKS = loadLooks();
  const alias = loadAlias();
  const all = [...new Set(Object.values(LOOKS).map((it) => it.file))];
  const have = new Set(all.filter((f) => fs.existsSync(path.join(SRC, f))));
  const files = [...have].filter((f) => !P.only || P.only.has(f));
  if (P.check) {
    const lack = files.filter((f) => !fs.existsSync(path.join(OUT, f)) || !fs.existsSync(path.join(OUT_ICON, f)));
    console.log(`표 ${Object.keys(LOOKS).length}키 · 파일 ${all.length} · 원본 있음 ${have.size} · 출력 없음 ${lack.length}${lack.length ? `: ${lack.join(', ')}` : ''}`);
    process.exit(lack.length ? 1 : 0);
  }
  fs.mkdirSync(OUT_ICON, { recursive: true });
  let before = 0, after = 0;
  for (const f of files) {
    const img = await decodeAny(path.join(SRC, f));
    const [cw, ch] = fit(img.w, img.h, CARD_W, CARD_H);
    const [iw, ih] = fit(img.w, img.h, ICON, ICON);
    encode(cw, ch, shrinkKeepAlpha(img.data, img.w, img.h, cw, ch), path.join(OUT, f));
    encode(iw, ih, shrinkKeepAlpha(img.data, img.w, img.h, iw, ih), path.join(OUT_ICON, f));
    before += img.w * img.h * 4; after += cw * ch * 4 + iw * ih * 4;
  }
  console.log(`카드 · 아이콘 ${files.length}장 · 텍스처(RGBA) ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(2)}MB`);
  // 원본이 지워진 그림의 출력은 치운다(표와 출력이 갈라지지 않게)
  for (const dir of [OUT, OUT_ICON]) {
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.png'))) if (!have.has(f)) fs.rmSync(path.join(dir, f));
  }
  writeTable(LOOKS, alias, have);
  if (P.sheet) {
    const tmp = path.join(path.dirname(P.sheet), '_item_sheet');
    fs.mkdirSync(tmp, { recursive: true });
    const tiles = [];
    for (const [key, it] of Object.entries(LOOKS)) {
      if (!files.includes(it.file)) continue;
      const a = path.join(tmp, `${key}_a.png`), b = path.join(tmp, `${key}_b.png`), c = path.join(tmp, `${key}_c.png`), t = path.join(tmp, `${key}.png`);
      execFileSync('convert', ['-background', '#0d1b2a', path.join(OUT_ICON, it.file), '-gravity', 'center', '-extent', '72x72', a]);
      execFileSync('convert', ['-background', '#0d1b2a', path.join(OUT_ICON, it.file), '-filter', 'point', '-resize', '30x30', '-gravity', 'center', '-extent', '40x40', b]);
      execFileSync('convert', ['-background', '#112233', path.join(OUT, it.file), '-gravity', 'center', '-extent', '232x94', c]);
      execFileSync('convert', [a, b, c, '-background', '#1a1c22', '-gravity', 'center', '+append', t]);
      tiles.push(t);
    }
    execFileSync('montage', ['-label', '%t', ...tiles, '-background', '#1a1c22', '-fill', 'white', '-pointsize', '11', '-tile', '3x', '-geometry', '+6+6', P.sheet]);
    console.log(`시트 → ${P.sheet}`);
  }
}

if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
