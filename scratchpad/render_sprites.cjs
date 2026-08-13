/**
 * @file render_sprites.cjs
 * @description PixelFishStages.ts 스프라이트를 PNG로 렌더 (검증용 — 표준 라이브러리만).
 * 사용: node scratchpad/render_sprites.cjs squid_gill_on squid_skin_done ...
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
const SRC = path.resolve(__dirname, '../packages/client-pc/src/data/PixelFishStages.ts');

function loadSprites() {
  const txt = fs.readFileSync(SRC, 'utf8');
  const start = txt.indexOf('FISH_STAGE_SPRITES');
  const brace = txt.indexOf('{', start);
  const end = txt.lastIndexOf('};');
  const body = txt.slice(brace, end + 1);
  // eslint-disable-next-line no-eval
  return eval(`(${body})`);
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(file, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

const sprites = loadSprites();
const keys = process.argv.slice(2);
if (!keys.length) { console.log('keys:', Object.keys(sprites).filter((k) => k.startsWith('squid_')).join(' ')); process.exit(0); }
const SCALE = 4;
for (const key of keys) {
  const s = sprites[key];
  if (!s) { console.warn('없음:', key); continue; }
  const W = s.w * SCALE, H = s.h * SCALE;
  const rgba = Buffer.alloc(W * H * 4);
  // 어두운 회색 바탕 (투명 확인용)
  for (let i = 0; i < W * H; i++) { rgba[i * 4] = 34; rgba[i * 4 + 1] = 38; rgba[i * 4 + 2] = 44; rgba[i * 4 + 3] = 255; }
  for (let y = 0; y < s.h; y++) {
    const row = s.rows[y];
    for (let x = 0; x < s.w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const c = s.palette[AB.indexOf(ch)];
      for (let dy = 0; dy < SCALE; dy++) for (let dx = 0; dx < SCALE; dx++) {
        const i = ((y * SCALE + dy) * W + x * SCALE + dx) * 4;
        rgba[i] = (c >> 16) & 255; rgba[i + 1] = (c >> 8) & 255; rgba[i + 2] = c & 255; rgba[i + 3] = 255;
      }
    }
  }
  const out = path.resolve(__dirname, `spr_${key}.png`);
  writePng(out, W, H, rgba);
  console.log(`${key}: ${s.w}x${s.h} → ${out}`);
}
