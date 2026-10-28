#!/usr/bin/env node
/**
 * @file wiki_crop_img.cjs
 * @description 241차 — 작물 초상(`public/crops/crop_*.png` · 셀 6px)을 위키 그림(`tools/wiki_img/px_crop_*.png` · 셀 2px = 1/3 면적 평균)으로 내리고
 *  `manifest.json`의 w/h를 맞춘다. 초상을 다시 구운 뒤 `node tools/wiki_crop_img.cjs` → `node tools/gen_game_wiki_data.mjs --html` 순으로 돈다.
 */
const fs = require('fs'); const path = require('path');
const { decode, encode } = require('./lib_png.cjs'); const { areaResize } = require('./pixelize_crops.cjs');
const SRC = 'packages/client-pc/public/crops', DST = 'tools/wiki_img', MAN = path.join(DST, 'manifest.json');
const manifest = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : {};
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
let n = 0;
for (const f of fs.readdirSync(SRC).filter((x) => /^crop_[a-z0-9_]+\.png$/.test(x) && !x.endsWith('_icon.png') && !x.endsWith('_card.png'))) {
  const id = f.slice(0, -4); if (only && id !== only) continue;
  const img = decode(path.join(SRC, f)); const w = Math.round(img.w / 3), h = Math.round(img.h / 3);
  const small = areaResize(img.data, img.w, img.h, w, h); const out = `px_${id}.png`;
  encode(w, h, small, path.join(DST, out)); manifest[`px:${id}`] = { f: out, w, h }; n++;
  console.log(`${id}: ${img.w}x${img.h} → ${out} ${w}x${h}`);
}
fs.writeFileSync(MAN, JSON.stringify(manifest));
console.log(`위키 그림 ${n}장 · manifest ${Object.keys(manifest).length}키`);
