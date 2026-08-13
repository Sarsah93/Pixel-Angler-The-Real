/**
 * @file gen_octo_assets.cjs
 * @description 문어 직접 로드 에셋 생성기 (098차) — 삶은 문어 계열 투명 PNG 4종 다운스케일 +
 *              '손질 완료' 도트 스프라이트(octo_clean)를 인벤토리 아이콘 PNG로 굽는다.
 *
 * 입력:
 *   food assets/butchery/reference/cephalopod/octopus/
 *     삶은 문어.png                        → public/trimmings/octo_boiled.png      (아이콘·도마)
 *     삶은 문어 머리.png                   → public/trimmings/octo_boiled_head.png (아이콘)
 *     문어 다리(octopus_legs)_cutting.png  → public/trimmings/octo_boiled_leg.png  (아이콘·회뜨기 도마)
 *     문어 숙회 한점.png                   → public/sashimi/piece_octopus.png      (숙회 한 점 — 접시 조각)
 *   packages/client-pc/src/data/PixelFishStages.ts 의 `octo_clean`
 *     → public/trimmings/octo_whole.png (문어 통마리 순살 아이콘 — 구 플레이스홀더 교체)
 *
 * 실행: node tools/gen_octo_assets.cjs   (원본 교체 후 재실행하면 소비본이 갱신된다)
 * 전부 **PNG 직접 로드** 에셋이라 재실행 + 브라우저 F5로 반영된다 (asset-pipeline 스킬 ⓪).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SRC_DIR = path.resolve(__dirname, '..', 'food assets', 'butchery', 'reference', 'cephalopod', 'octopus');
const PUB = path.resolve(__dirname, '..', 'packages', 'client-pc', 'public');
const STAGES_TS = path.resolve(__dirname, '..', 'packages', 'client-pc', 'src', 'data', 'PixelFishStages.ts');
const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

/** [원본 파일명, 출력 상대경로, 목표 긴 축 px] — 알파 보존 다운스케일 */
const RESIZE_JOBS = [
  ['삶은 문어.png', 'trimmings/octo_boiled.png', 420],
  ['삶은 문어 머리.png', 'trimmings/octo_boiled_head.png', 300],
  ['문어 다리(octopus_legs)_cutting.png', 'trimmings/octo_boiled_leg.png', 640],
  ['문어 숙회 한점.png', 'sashimi/piece_octopus.png', 300],
];

function chromeDataUrl(html) {
  const tmp = path.join(os.tmpdir(), `octoasset_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, html);
  const dom = execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--allow-file-access-from-files',
    '--virtual-time-budget=8000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/'),
  ], { maxBuffer: 128 * 1024 * 1024 }).toString();
  fs.unlinkSync(tmp);
  const m = dom.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!m) throw new Error('dump-dom 파싱 실패');
  return m[1].replace(/<[^>]+>/g, '').trim();
}

function writeDataUrl(dataUrl, outRel) {
  const out = path.join(PUB, outRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  return out;
}

// ── ① 투명 PNG 다운스케일 (bbox 크롭 + 긴 축 목표 px) ──
for (const [fname, outRel, longPx] of RESIZE_JOBS) {
  const abs = path.join(SRC_DIR, fname);
  if (!fs.existsSync(abs)) { console.warn(`⚠ 입력 없음 (건너뜀): ${fname}`); continue; }
  const html = `<!doctype html><body><script>
const img = new Image();
img.onload = () => {
  const W = img.naturalWidth, H = img.naturalHeight;
  const cv0 = document.createElement('canvas'); cv0.width = W; cv0.height = H;
  const c0 = cv0.getContext('2d', { willReadFrequently: true });
  c0.drawImage(img, 0, 0);
  const d = c0.getImageData(0, 0, W, H).data;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (d[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const s = Math.min(1, ${longPx} / Math.max(bw, bh));
  const ow = Math.max(1, Math.round(bw * s)), oh = Math.max(1, Math.round(bh * s));
  const cv = document.createElement('canvas'); cv.width = ow; cv.height = oh;
  const cx = cv.getContext('2d');
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(cv0, x0, y0, bw, bh, 0, 0, ow, oh);
  document.body.textContent = cv.toDataURL('image/png');
};
img.src = ${JSON.stringify('file:///' + encodeURI(abs.replace(/\\/g, '/')))};
<\/script></body>`;
  const out = writeDataUrl(chromeDataUrl(html), outRel);
  console.log(`${fname} → ${path.relative(PUB, out)}`);
}

// ── ② octo_clean 도트 스프라이트 → 문어 통마리 아이콘 PNG (투명 배경 · 셀 2px) ──
{
  const src = fs.readFileSync(STAGES_TS, 'utf8');
  const m = src.match(/"octo_clean": \{\s*\n\s*w: (\d+), h: (\d+), cellPx: \d+,\s*\n\s*palette: \[([^\]]*)\],\s*\n\s*rows: \[\n([\s\S]*?)\n\s*\],/);
  if (!m) { console.error('octo_clean 스프라이트 없음 — pixelize_butchery.cjs 먼저 실행'); process.exit(1); }
  const spr = {
    w: +m[1], h: +m[2],
    palette: m[3].split(',').map((s) => parseInt(s.trim(), 16)).filter((n) => !Number.isNaN(n)),
    rows: [...m[4].matchAll(/'([^']*)'/g)].map((r) => r[1]),
  };
  const html = `<!doctype html><body><script>
const AB = ${JSON.stringify(AB)};
const s = ${JSON.stringify(spr)};
const scale = 2;
const cv = document.createElement('canvas');
cv.width = s.w * scale; cv.height = s.h * scale;
const cx = cv.getContext('2d');
for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
  const ch = (s.rows[y] || '')[x];
  if (!ch || ch === '.') continue;
  const c = s.palette[AB.indexOf(ch)] ?? 0;
  cx.fillStyle = '#' + c.toString(16).padStart(6, '0');
  cx.fillRect(x * scale, y * scale, scale, scale);
}
document.body.textContent = cv.toDataURL('image/png');
<\/script></body>`;
  const out = writeDataUrl(chromeDataUrl(html), 'trimmings/octo_whole.png');
  console.log(`octo_clean (${spr.w}x${spr.h}) → ${path.relative(PUB, out)} (통마리 아이콘 교체)`);
}
