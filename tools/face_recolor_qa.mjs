/**
 * @file face_recolor_qa.mjs
 * @description 270차 — 주인공 그림 얼굴 **색 치환 검수 몽타주**. 게임과 같은 `ui/FaceRecolor.ts`(`renderPlayerFace` · `recolorFace`)를
 *  tsc로 임시 폴더에 옮겨 Node에서 돌리고, 기본 판(`public/faces/player_*.png`) 위에 색 조합을 입혀 한 장으로 모은다.
 *  「여기선 예쁜데 인게임은 다른」 상태를 막는다 — 게임 경로는 `FacePhoto.photoPortraitKey`(캔버스)가 같은 함수를 부른다.
 *
 *  node tools/face_recolor_qa.mjs <출력 폴더> [세트...]
 *    boxed             사용자가 네모 친 넷(270) + 기준 둘           — 2배
 *    all:<머리>:<피부>:<눈>[:<수염>] [1|2]   72판 전부(앞 36 · 뒤 36)   — 1배 (예 all:7:4:2:7 1)
 *    beard             수염판 머리 · 수염 · 피부 조합 12             — 1배
 *    mix               남 짧은 머리 — 머리 10 × 피부(0 · 4)           — 1배
 *    hair · skin       머리 10 · 피부 5                               — 1배
 *    classmap:<키,키>  라벨 지도(머리 자홍 · 피부 청록 · 수염 노랑 · 눈 초록) — 3배
 *  세트를 안 주면 boxed · mix · beard · all:7:4:2:7 1 · all:7:4:2:7 2를 만든다. 결과는 눈으로 본다(판정 어서션은 없다).
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { decode, encode } = require(path.join(ROOT, 'tools/lib_png.cjs'));
const OUT = process.argv[2]; if (!OUT) { console.error('사용: node tools/face_recolor_qa.mjs <출력 폴더> [세트...]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

// 1) FaceRecolor.ts → 임시 JS(core 경로는 빌드된 dist로)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'face-recolor-qa-'));
const src = path.join(ROOT, 'packages/client-pc/src/ui/FaceRecolor.ts');
execFileSync('npx', ['tsc', src, '--target', 'es2022', '--module', 'es2022', '--moduleResolution', 'bundler', '--outDir', tmp, '--skipLibCheck'], { cwd: ROOT, stdio: 'pipe' });
const js = path.join(tmp, 'FaceRecolor.js');
const coreDist = path.join(ROOT, 'packages/core/dist/index.js');
if (!fs.existsSync(coreDist)) { console.error('core dist가 없다 — npx pnpm --filter @tra/core run build'); process.exit(1); }
fs.writeFileSync(js, fs.readFileSync(js, 'utf8').replace("from '@tra/core'", `from '${coreDist.replace(/\\/g, '/')}'`));
const core = await import(coreDist);
const M = await import(js);

const dir = path.join(ROOT, 'packages/client-pc/public/faces');
const cfgOf = (sex, style, o = {}) => ({ look: { ...core.defaultAppearance(sex), hairStyle: style, hair: 2, skin: 1, eye: 0, beard: -1, mouth: 'neutral', blush: false, faceShape: 'oval', ...o }, outfit: core.bareOutfit() });
const baseKey = (c) => `player_${c.look.sex}_${c.look.hairStyle}${c.look.beard >= 0 ? '_beard' : ''}${c.look.faceShape !== 'oval' ? '_' + c.look.faceShape : ''}`;
function render(c) {
  const im = decode(path.join(dir, baseKey(c) + '.png')); const data = new Uint8ClampedArray(im.data);
  M.renderPlayerFace(data, im.w, im.h, c, c.look.beard >= 0);
  return { w: im.w, h: im.h, data };
}
function montage(cells, cols, file, Z = 1) {
  const cw = 192, ch = 192; const W = cols * (cw * Z + 4) + 4, rows = Math.ceil(cells.length / cols), H = rows * (ch * Z + 4) + 4;
  const out = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) { out[i * 4] = 26; out[i * 4 + 1] = 28; out[i * 4 + 2] = 34; out[i * 4 + 3] = 255; }
  cells.forEach((img, i) => { const col = i % cols, row = (i / cols) | 0; const ox = 4 + col * (cw * Z + 4), oy = 4 + row * (ch * Z + 4);
    for (let y = 0; y < ch * Z; y++) for (let x = 0; x < cw * Z; x++) { const s = (((y / Z) | 0) * img.w + ((x / Z) | 0)) * 4; if (img.data[s + 3] < 8) continue; const d = ((oy + y) * W + ox + x) * 4; out[d] = img.data[s]; out[d + 1] = img.data[s + 1]; out[d + 2] = img.data[s + 2]; out[d + 3] = 255; } });
  encode(W, H, out, file); console.log('wrote', file);
}
const plates = () => fs.readdirSync(dir).filter((f) => f.startsWith('player_') && f.endsWith('.png')).map((f) => f.slice(0, -4)).sort();

const args = process.argv.slice(3); const sets = args.length ? [] : [['boxed'], ['mix'], ['beard'], ['all:7:4:2:7', '1'], ['all:7:4:2:7', '2']];
for (let i = 0; i < args.length; i++) { const a = args[i]; if (a.startsWith('all:') && /^[12]$/.test(args[i + 1] ?? '')) { sets.push([a, args[++i]]); } else sets.push([a]); }
for (const [set, half] of sets) {
  if (set === 'boxed') {
    const cells = [cfgOf('m', 'short', { faceShape: 'round', mouth: 'smile', blush: true, hair: 7, skin: 0, eye: 2 }), cfgOf('f', 'pony', { faceShape: 'round', mouth: 'small', skin: 4, hair: 3 }),
      { look: { ...core.defaultAppearance('m') }, outfit: core.bareOutfit() }, { look: { ...core.defaultAppearance('f') }, outfit: core.bareOutfit() }, cfgOf('m', 'short'), cfgOf('f', 'bob')];
    montage(cells.map(render), 3, path.join(OUT, 'boxed.png'), 2);
  } else if (set === 'hair') {
    const cells = []; for (const sex of ['m', 'f']) for (let hair = 0; hair < 10; hair++) cells.push(cfgOf(sex, sex === 'm' ? 'short' : 'bob', { hair }));
    montage(cells.map(render), 10, path.join(OUT, 'hair.png'));
  } else if (set === 'skin') {
    const cells = []; for (const sex of ['m', 'f']) for (let skin = 0; skin < 5; skin++) cells.push(cfgOf(sex, sex === 'm' ? 'short' : 'pony', { skin }));
    montage(cells.map(render), 5, path.join(OUT, 'skin.png'));
  } else if (set === 'mix') {
    const cells = []; for (const skin of [0, 4]) for (let hair = 0; hair < 10; hair++) cells.push(cfgOf('m', 'short', { hair, skin, blush: true, mouth: 'smile' }));
    montage(cells.map(render), 10, path.join(OUT, 'mix.png'));
  } else if (set === 'beard') {
    const cells = []; for (const style of ['short', 'long']) for (const [hair, beard, skin] of [[7, 7, 0], [0, 5, 1], [4, 1, 4], [2, 7, 1], [6, 2, 3], [3, 3, 2]]) cells.push(cfgOf('m', style, { hair, beard, skin, mouth: 'smile' }));
    montage(cells.map(render), 6, path.join(OUT, 'beard.png'));
  } else if (set.startsWith('all:')) {
    const [, hs, ss, es, bs] = set.split(':'); const hair = +(hs ?? 7), skin = +(ss ?? 4), eye = +(es ?? 2), beard = +(bs ?? hair);
    const cells = plates().map((k) => { const m = k.match(/^player_([mf])_([a-z]+)(_beard)?(?:_(round|square))?$/); return cfgOf(m[1], m[2], { hair, skin, eye, beard: m[3] ? beard : -1, faceShape: m[4] ?? 'oval' }); });
    const h = +(half ?? 0); const part = h ? cells.slice(36 * (h - 1), 36 * h) : cells;
    montage(part.map(render), 9, path.join(OUT, `all_${hair}_${skin}_${eye}_${beard}${h ? '_' + h : ''}.png`));
  } else if (set.startsWith('classmap:')) {
    const keys = set.slice(9).split(','); const cells = [];
    for (const key of keys) {
      const im = decode(path.join(dir, key + '.png')); const data = new Uint8ClampedArray(im.data);
      const swaps = { hair: M.swapOf(core.HAIR_COLORS[2], 0xff00ff, 0.4, 1.7), keepHair: false, skin: M.swapOf(core.SKIN_TONES[1], 0x00e0ff, 0.5, 1.4), eye: M.swapOf(core.EYE_COLORS[0], 0x00ff40, 0.5, 1.8) };
      if (key.includes('_beard')) { swaps.beard = M.swapOf(core.HAIR_COLORS[2], 0xffe000, 0.4, 1.7); swaps.keepBeard = false; }
      M.recolorFace(data, im.w, im.h, swaps, M.findMouth(data, im.w, im.h));
      cells.push({ w: im.w, h: im.h, data: new Uint8ClampedArray(im.data) }, { w: im.w, h: im.h, data });
    }
    montage(cells, 2, path.join(OUT, 'classmap.png'), 3);
  } else console.error('모르는 세트', set);
}
fs.rmSync(tmp, { recursive: true, force: true });
