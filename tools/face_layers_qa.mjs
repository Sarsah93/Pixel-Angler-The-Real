/**
 * @file face_layers_qa.mjs
 * @description 271차 — 주인공 얼굴 **층 합성** 검수 몽타주. 게임과 같은 `ui/FaceRecolor.ts`(composePlayerFace)를 tsc로 옮겨 Node에서 돌린다 —
 *  설치된 층(`public/faces/layers/`)을 생성 옵션 조합으로 합성해 눈으로 본다(판정 어서션은 없다 — 색 품질은 눈이 판정한다).
 *
 *  사용: node tools/face_layers_qa.mjs <출력 폴더> [세트...]
 *    all:<머리>:<피부>:<눈>[:<수염>]   성별 2 × 머리 모양 8 × 얼굴형 3 = 48칸(1배 — 예 all:7:4:2:7)
 *    boxed                             270 네모 넷 · 271 동그라미 둘 · 기준 둘 — 2배
 *    mix                               남 짧은 머리 계란형 — 머리 10 × 피부 5 = 50칸
 *    mouth                             입 4 × 홍조 2 × 성별 2 — 2배
 *    mask                              기본판 6 · 라벨 마스크 겹침(피부 청록 · 눈썹 주황 · 눈 초록 · 입술 분홍 · 흰자 흰색) — 2배
 *    leak                              312 — 머리 층을 머리에 맞추기(`fitHairToHead`) 표(성별 × 얼굴형 × 머리 모양 — 비운 정수리 두피 · 메운 구멍) +
 *                                      둥근형의 전(자홍 = 비움 · 청록 = 메움) · 뒤 몽타주 — 2배. 새 머리 · 기본판을 설치하면 이 표부터 본다
 *  세트를 안 주면 boxed · mix · mouth · all:7:4:2:7 · all:0:0:2:0 · all:3:2:3:5 · mask · leak을 만든다.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { decode, encode } = require(path.join(ROOT, 'tools/lib_png.cjs'));
const OUT = process.argv[2]; if (!OUT) { console.error('사용: node tools/face_layers_qa.mjs <출력 폴더> [세트...]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

// 1) FaceRecolor.ts → 임시 JS(core 경로는 빌드된 dist로)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'face-layers-qa-'));
const src = path.join(ROOT, 'packages/client-pc/src/ui/FaceRecolor.ts');
execFileSync('npx', ['tsc', src, '--target', 'es2022', '--module', 'es2022', '--moduleResolution', 'bundler', '--outDir', tmp, '--skipLibCheck'], { cwd: ROOT, stdio: 'pipe' });
const js = path.join(tmp, 'FaceRecolor.js');
const coreDist = path.join(ROOT, 'packages/core/dist/index.js');
if (!fs.existsSync(coreDist)) { console.error('core dist가 없다 — npx pnpm --filter @tra/core run build'); process.exit(1); }
fs.writeFileSync(js, fs.readFileSync(js, 'utf8').replace("from '@tra/core'", `from '${coreDist.replace(/\\/g, '/')}'`));
const core = await import(coreDist);
const M = await import(js);

// 2) 층
const dir = path.join(ROOT, 'packages/client-pc/public/faces/layers');
const layers = new Map();
const layer = (k) => {
  if (layers.has(k)) return layers.get(k);
  const f = path.join(dir, `${k}.png`);
  const v = fs.existsSync(f) ? (() => { const im = decode(f); return { w: im.w, h: im.h, data: new Uint8ClampedArray(im.data) }; })() : null;
  layers.set(k, v); return v;
};
const cfgOf = (sex, style, o = {}) => ({ look: { ...core.defaultAppearance(sex), hairStyle: style, hair: 2, skin: 1, eye: 0, beard: -1, mouth: 'neutral', blush: false, faceShape: 'oval', ...o }, outfit: core.bareOutfit() });
function render(c) {
  const { sex, hairStyle, faceShape, beard } = c.look;
  const shape = ['oval', 'round', 'square'].includes(faceShape) && layer(`base_${sex}_${faceShape}`) ? faceShape : 'oval';
  const base = layer(`base_${sex}_${shape}`), mask = layer(`base_${sex}_${shape}_mask`), hair = layer(`hair_${sex}_${hairStyle}`);
  if (!base || !mask || !hair) throw new Error(`층이 없다: base_${sex}_${shape} · hair_${sex}_${hairStyle}`);
  const bd = sex === 'm' && beard >= 0 ? (layer(`beard_m_${shape}`) ?? layer('beard_m_oval')) : null;
  const data = M.composePlayerFace({ w: base.w, h: base.h, base: base.data, mask: mask.data, hair: hair.data, beard: bd?.data ?? null }, c);
  return { w: base.w, h: base.h, data };
}
function montage(cells, cols, file, Z = 1) {
  const cw = 192, ch = 192; const W = cols * (cw * Z + 4) + 4, rows = Math.ceil(cells.length / cols), H = rows * (ch * Z + 4) + 4;
  const out = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) { out[i * 4] = 26; out[i * 4 + 1] = 28; out[i * 4 + 2] = 34; out[i * 4 + 3] = 255; }
  cells.forEach((img, i) => { const col = i % cols, row = (i / cols) | 0; const ox = 4 + col * (cw * Z + 4), oy = 4 + row * (ch * Z + 4);
    for (let y = 0; y < ch * Z; y++) for (let x = 0; x < cw * Z; x++) { const s = (((y / Z) | 0) * img.w + ((x / Z) | 0)) * 4; if (img.data[s + 3] < 8) continue; const d = ((oy + y) * W + ox + x) * 4; out[d] = img.data[s]; out[d + 1] = img.data[s + 1]; out[d + 2] = img.data[s + 2]; out[d + 3] = 255; } });
  encode(W, H, out, file); console.log('wrote', file);
}
const MASK = { 1: [0, 224, 255], 2: [255, 128, 0], 3: [0, 255, 64], 4: [255, 80, 160], 5: [255, 255, 255] };
function maskOverlay(baseKey) {
  const base = layer(baseKey), mask = layer(`${baseKey}_mask`);
  const labels = M.decodeMask(mask.data, base.w * base.h); const data = new Uint8ClampedArray(base.data);
  for (let i = 0; i < labels.length; i++) { const c = MASK[labels[i]]; if (!c) continue; const o = i * 4; data[o] = Math.round(data[o] * 0.45 + c[0] * 0.55); data[o + 1] = Math.round(data[o + 1] * 0.45 + c[1] * 0.55); data[o + 2] = Math.round(data[o + 2] * 0.45 + c[2] * 0.55); }
  return { w: base.w, h: base.h, data };
}

const args = process.argv.slice(3);
const sets = args.length ? args : ['boxed', 'mix', 'mouth', 'all:7:4:2:7', 'all:0:0:2:0', 'all:3:2:3:5', 'mask', 'leak'];
for (const set of sets) {
  if (set === 'boxed') {
    const cells = [
      cfgOf('m', 'short', { faceShape: 'round', mouth: 'smile', blush: true, hair: 7, skin: 0, eye: 2 }), cfgOf('f', 'pony', { faceShape: 'round', mouth: 'small', skin: 4, hair: 3 }),
      cfgOf('m', 'short', { hair: 0 }), cfgOf('f', 'bob', { hair: 0 }),
      cfgOf('m', 'long', { beard: 5, hair: 0 }), cfgOf('m', 'topknot', { beard: 6, hair: 6, skin: 3, eye: 4 }),
      cfgOf('m', 'short'), cfgOf('f', 'short'),
      // 312 사용자 리포트 — 여 · 둥근형 · 상투 · 흰 머리(정수리 두피가 피부색 호로 비쳤다) · 남 상투 흰 머리
      cfgOf('f', 'topknot', { faceShape: 'round', hair: 7, skin: 1, eye: 3, mouth: 'smile', blush: true }), cfgOf('m', 'topknot', { faceShape: 'round', hair: 7, skin: 1, eye: 3 }),
    ];
    montage(cells.map(render), 4, path.join(OUT, 'boxed.png'), 2);
  } else if (set === 'mix') {
    const cells = []; for (let hair = 0; hair < 10; hair++) for (let skin = 0; skin < 5; skin++) cells.push(cfgOf('m', 'short', { hair, skin }));
    montage(cells.map(render), 10, path.join(OUT, 'mix.png'));
  } else if (set === 'mouth') {
    const cells = []; for (const sex of ['m', 'f']) for (const blush of [false, true]) for (const mouth of ['neutral', 'smile', 'small', 'open']) cells.push(cfgOf(sex, sex === 'm' ? 'short' : 'bob', { mouth, blush, skin: blush ? 3 : 1 }));
    montage(cells.map(render), 4, path.join(OUT, 'mouth.png'), 2);
  } else if (set === 'mask') {
    const keys = fs.readdirSync(dir).filter((f) => /^base_[mf]_[a-z]+\.png$/.test(f)).map((f) => f.slice(0, -4)).sort();
    montage(keys.map(maskOverlay), 3, path.join(OUT, 'mask.png'), 2);
  } else if (set === 'leak') {
    // 312 — 머리 층을 머리에 맞추기(게임과 같은 fitHairToHead) — 흰 머리 · 밝은 피부(살색 점이 가장 잘 보이는 조합)
    const rows = [], cells = [];
    for (const sex of ['m', 'f']) for (const shape of core.FACE_SHAPES) for (const style of core.HAIR_STYLES) {
      const base = layer(`base_${sex}_${shape}`), mask = layer(`base_${sex}_${shape}_mask`), hair = layer(`hair_${sex}_${style}`);
      if (!base || !mask || !hair) continue;
      const fit = M.fitHairToHead(base.data, hair.data, M.decodeMask(mask.data, base.w * base.h), base.w, base.h);
      rows.push(`${sex} ${shape.padEnd(6)} ${style.padEnd(8)} 비움 ${String(fit.cutCount).padStart(4)} · 메움 ${String(fit.holeCount).padStart(3)}`);
      if (!fit.cutCount && !fit.holeCount) continue;
      if (shape !== 'round') continue;   // 몽타주는 얼굴형 하나만(두피 윗부분은 얼굴형마다 같다)
      const c = cfgOf(sex, style, { faceShape: shape, hair: 7, skin: 1, eye: 3, mouth: 'smile', blush: true });
      const after = render(c), before = { w: after.w, h: after.h, data: new Uint8ClampedArray(after.data) };
      const mark = (m, rgb) => { if (m) for (let i = 0; i < m.length; i++) if (m[i]) { const o = i * 4; before.data[o] = rgb[0]; before.data[o + 1] = rgb[1]; before.data[o + 2] = rgb[2]; before.data[o + 3] = 255; } };
      mark(fit.cut, [255, 0, 255]); mark(fit.holes, [0, 255, 255]);
      cells.push(before, after);
    }
    console.log('머리 층을 머리에 맞추기(비움 = 머리칼 밖 정수리 두피 · 메움 = 머리칼 안 두피 구멍 — 몽타주 자홍 = 비움 · 청록 = 메움)\n' + rows.join('\n'));
    if (cells.length) montage(cells, 4, path.join(OUT, 'leak.png'), 2);
  } else if (set.startsWith('all:')) {
    const [, h, s, e, b] = set.split(':').map(Number);
    const cells = [];
    for (const sex of ['m', 'f']) for (const style of core.HAIR_STYLES) for (const shape of core.FACE_SHAPES) cells.push(cfgOf(sex, style, { faceShape: shape, hair: h, skin: s, eye: e, beard: sex === 'm' && b >= 0 ? b : -1 }));
    montage(cells.map(render), 12, path.join(OUT, `all_${h}_${s}_${e}_${b ?? 'x'}.png`));
  } else throw new Error(`모르는 세트: ${set}`);
}
