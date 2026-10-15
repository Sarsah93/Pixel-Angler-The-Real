/**
 * @file seed_packets.cjs
 * @description 255차 — 씨앗 아이템 그림 = 씨앗 봉투(Gemini 빈 틀 한 장) + 그 작물의 초상(244차)을 합성한다.
 *
 *  왜 합성인가: 씨앗 47종을 한 장씩 그리면 봉투 모양 · 각도 · 색이 제각각이 되고 봉투에 글자가 들어가기 쉽다.
 *  실제 씨앗 봉투처럼 「같은 봉투 + 창에 작물 그림」이면 한눈에 「씨앗」으로 읽히고, 무슨 씨앗인지는 가방에 이미 있는
 *  수확물 그림과 같은 그림으로 알아본다(사용자: 「한 개 그림은 각각 '작물'에서 따와도 될 것 같은데」). 새 작물이 늘어도 다시 그릴 것이 없다.
 *  봉투 띠 색은 작물 갈래(잎채소 · 열매 · 뿌리 · 곡물 · 콩 · 향채 · 나물 · 싹)마다 다르게 물들인다 — 작은 칸에서 갈래가 먼저 읽힌다.
 *
 *  입력
 *   - 빈 틀 `food assets/items/_template/seed_packet.png` — Gemini 원본 그대로(흰 바탕 · 가운데 흰 창).
 *     만든 법: `gemini_item_art.cjs`에 「세로로 긴 종이 봉투 · 위 띠 초록 · 가운데 큰 창은 완전히 빈 순백색 · 글자 없음」(255차 3판 중 3판).
 *   - 작물 초상 `packages/client-pc/public/crops/<수확물 id>.png`(셀 6px 원본 — `pixelize_crops.cjs`)
 *   - 씨앗 목록 · 작물 갈래 · 이름은 core `CROP_DATABASE`(먼저 `npx pnpm --filter @tra/core run build`)
 *  출력
 *   - 원본 `food assets/items/seed_<작물>.png`(격자 정규화 셀 6px — Gemini 아이템과 같은 규격)
 *   - 표 `tools/item_looks/seeds.cjs`(자동 생성 — `px: ['px:seed_<작물>']` · `composite`) → `node tools/item_cards.cjs`가 카드 · 아이콘 · `ItemImages.ts`
 *
 *  사용: node tools/seed_packets.cjs [--only seed_lettuce,seed_chili] [--sheet <png>]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { DEFAULTS, decodeAny, areaResize } = require('./pixelize_crops.cjs');
const { peelFringe, regrid } = require('./gemini_fish_art.cjs');
const { cutoutMulti } = require('./gemini_tackle_art.cjs');
const { encode } = require('./lib_png.cjs');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'food assets', 'items', '_template', 'seed_packet.png');
const OUT = path.join(ROOT, 'food assets', 'items');
const CROPS = path.join(ROOT, 'packages', 'client-pc', 'public', 'crops');
const TABLE = path.join(__dirname, 'item_looks', 'seeds.cjs');

/** 갈래 → 띠 색(색상각 °). 잎채소는 틀 그대로(초록) */
const BAND_HUE = { leaf: null, fruit: 2, root: 26, grain: 44, legume: 32, herb: 178, wild: 95, sprout: 72 };
/** 창 안 바탕(봉투 종이보다 조금 밝은 미색) */
const WINDOW_BG = [250, 246, 236];

function parseArgs(argv) {
  const P = { only: null, sheet: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') P.only = new Set(argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
    else if (argv[i] === '--sheet') P.sheet = argv[++i];
  }
  return P;
}

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** 빈 틀 → { w, h, data(배경 투명), win: 창 경계 상자, winMask } — 창 = 불투명한 순백 덩어리 중 가장 큰 것
 *  (`cutoutMulti`의 갇힌 흰 섬 제거는 그림의 3% 미만만 빼므로 큰 창은 그대로 남는다 — 여기서 따로 찾는다) */
async function loadTemplate() {
  const img = await decodeAny(TEMPLATE);
  const cut = cutoutMulti(img, DEFAULTS.tol, true, false);
  peelFringe(cut.data, img.w, img.h);
  const { w, h } = img, d = cut.data;
  const white = (i) => { const o = i * 4; return d[o + 3] > 0 && Math.min(d[o], d[o + 1], d[o + 2]) >= 236 && Math.max(d[o], d[o + 1], d[o + 2]) - Math.min(d[o], d[o + 1], d[o + 2]) <= 12; };
  const seen = new Uint8Array(w * h);
  let best = null;
  for (let s0 = 0; s0 < w * h; s0++) {
    if (seen[s0] || !white(s0)) continue;
    const q = [s0]; seen[s0] = 1; const mem = [];
    while (q.length) {
      const i = q.pop(); mem.push(i);
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !seen[j] && white(j)) { seen[j] = 1; q.push(j); }
    }
    if (!best || mem.length > best.length) best = mem;
  }
  if (!best || best.length < w * h * 0.05) throw new Error('빈 틀에서 창(가운데 흰 칸)을 찾지 못했다 — 틀 그림을 확인');
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  const winMask = new Uint8Array(w * h);
  for (const i of best) { winMask[i] = 1; const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { w, h, data: d, win: { x0, y0, x1, y1 }, winMask };
}

/** 틀 사본에 띠 색 입히기 — 초록 띠(색상 80~175° · 채도 0.25 이상)만 목표 색상으로 돌린다 */
function tintBand(src, w, h, hue) {
  const d = Buffer.from(src);
  if (hue === null || hue === undefined) return d;
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (d[o + 3] === 0) continue;
    const [hh, s, l] = rgb2hsl(d[o], d[o + 1], d[o + 2]);
    if (hh < 80 || hh > 175 || s < 0.25) continue;
    // 틀의 초록 띠는 짙어서 다른 색으로 돌리면 탁해진다 — 밝기를 조금 올린다(그늘 단계는 그대로)
    const [r, g, b] = hsl2rgb(hue, Math.min(1, s * 1.1), Math.min(0.66, l * 1.3 + 0.03));
    d[o] = Math.round(r); d[o + 1] = Math.round(g); d[o + 2] = Math.round(b);
  }
  return d;
}

/** 작물 초상을 창 안에 맞춰 얹는다(창 바탕은 미색으로 채우고 초상은 창 안쪽 92%에 맞춘다) */
async function compose(tpl, base, portraitFile) {
  const { w, h, win, winMask } = tpl;
  const d = Buffer.from(base);
  for (let i = 0; i < w * h; i++) if (winMask[i]) { const o = i * 4; d[o] = WINDOW_BG[0]; d[o + 1] = WINDOW_BG[1]; d[o + 2] = WINDOW_BG[2]; d[o + 3] = 255; }
  const p = await decodeAny(portraitFile);
  const ww = win.x1 - win.x0 + 1, wh = win.y1 - win.y0 + 1;
  const s = Math.min(ww * 0.92 / p.w, wh * 0.92 / p.h);
  const pw = Math.max(1, Math.round(p.w * s)), ph = Math.max(1, Math.round(p.h * s));
  const small = areaResize(p.data, p.w, p.h, pw, ph);
  const ox = win.x0 + Math.round((ww - pw) / 2), oy = win.y0 + Math.round((wh - ph) / 2);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const tx = ox + x, ty = oy + y;
    if (tx < 0 || ty < 0 || tx >= w || ty >= h || !winMask[ty * w + tx]) continue;
    const so = (y * pw + x) * 4, a = small[so + 3] / 255;
    if (a <= 0) continue;
    const o = (ty * w + tx) * 4;
    for (let c = 0; c < 3; c++) d[o + c] = Math.round(small[so + c] * a + d[o + c] * (1 - a));
  }
  return d;
}

/** 불투명 경계로 자르고 격자 정규화(긴 변 192칸 · 셀 6px — Gemini 아이템 설치와 같은 규격) */
function finish(d, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const PAD = 2, bw = x1 - x0 + 1 + PAD * 2, bh = y1 - y0 + 1 + PAD * 2, out = Buffer.alloc(bw * bh * 4);
  for (let y = y0; y <= y1; y++) d.copy(out, ((y - y0 + PAD) * bw + PAD) * 4, (y * w + x0) * 4, (y * w + x1 + 1) * 4);
  for (let i = 0; i < bw * bh; i++) if (out[i * 4 + 3] === 0) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0;
  const g = regrid(out, bw, bh, 192, DEFAULTS.cell);
  const pw = g.w + DEFAULTS.cell * 2, ph = g.h + DEFAULTS.cell * 2, padded = Buffer.alloc(pw * ph * 4);
  for (let y = 0; y < g.h; y++) g.data.copy(padded, ((y + DEFAULTS.cell) * pw + DEFAULTS.cell) * 4, y * g.w * 4, (y + 1) * g.w * 4);
  return { w: pw, h: ph, data: padded };
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

async function main() {
  const P = parseArgs(process.argv.slice(2));
  const core = await import(path.join(ROOT, 'packages', 'core', 'dist', 'index.js'));
  const seeds = [];
  for (const cr of core.CROP_DATABASE) for (const st of cr.starts) {
    if (st.kind !== 'seed' || !st.itemId.startsWith('seed_')) continue;
    const crop = st.itemId.slice(5);
    let portrait = path.join(CROPS, `${cr.harvest.itemId}.png`);
    if (!fs.existsSync(portrait)) portrait = path.join(CROPS, `crop_${cr.id}.png`);
    seeds.push({ id: st.itemId, crop, cat: cr.category, nameKo: st.labelKo ?? `${cr.nameKo} 씨앗`, nameEn: st.labelEn ?? `${cr.nameEn} seeds`, portrait });
  }
  const tpl = await loadTemplate();
  console.log(`빈 틀 ${tpl.w}x${tpl.h} · 창 (${tpl.win.x0},${tpl.win.y0})–(${tpl.win.x1},${tpl.win.y1}) · 씨앗 ${seeds.length}종`);
  const tinted = new Map();
  let n = 0;
  for (const sd of seeds) {
    if (P.only && !P.only.has(sd.id)) continue;
    if (!fs.existsSync(sd.portrait)) { console.warn(`${sd.id}: 작물 초상 없음 — ${path.relative(ROOT, sd.portrait)} (건너뜀)`); continue; }
    if (!tinted.has(sd.cat)) tinted.set(sd.cat, tintBand(tpl.data, tpl.w, tpl.h, BAND_HUE[sd.cat]));
    const d = await compose(tpl, tinted.get(sd.cat), sd.portrait);
    const fin = finish(d, tpl.w, tpl.h);
    encode(fin.w, fin.h, fin.data, path.join(OUT, `${sd.id}.png`));
    n++;
  }
  console.log(`봉투 ${n}장 → ${path.relative(ROOT, OUT)}/seed_*.png`);
  // 표 — item_cards.cjs가 읽는다(원본이 있는 것만 싣는다)
  const lines = [
    '/**',
    ' * @file seeds.cjs',
    ' * @description 255차 — 씨앗 봉투 그림 표(자동 생성 — `node tools/seed_packets.cjs` · 수동 편집 금지).',
    ' *  그림은 Gemini로 하나씩 그리지 않고 빈 봉투 틀 + 작물 초상을 합성한다(`composite`) — `gemini_item_art.cjs`는 이 항목을 건너뛴다.',
    ' */',
    "'use strict';",
    '',
    'module.exports = {',
    ...seeds.map((sd) => `  item_${sd.id}: { file: ${q(`${sd.id}.png`)}, nameKo: ${q(sd.nameKo)}, nameEn: ${q(sd.nameEn)}, px: [${q(`px:${sd.id}`)}], composite: 'seed_packet' },`),
    '};',
    '',
  ];
  fs.writeFileSync(TABLE, lines.join('\n'));
  console.log(`표 → ${path.relative(ROOT, TABLE)} (${seeds.length}항목)`);
  if (P.sheet) {
    const files = seeds.filter((sd) => !P.only || P.only.has(sd.id)).map((sd) => path.join(OUT, `${sd.id}.png`)).filter((f) => fs.existsSync(f));
    execFileSync('montage', ['-label', '%t', ...files, '-background', '#1a1c22', '-fill', 'white', '-pointsize', '11', '-geometry', '120x150+4+4', '-tile', '8x', P.sheet]);
    console.log(`시트 → ${P.sheet}`);
  }
}

if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
