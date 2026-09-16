/**
 * render_char_preview.mjs — 캐릭터 아트 검수용 PNG 렌더러 (138차)
 *
 * 아트 정본은 `packages/core/src/art/CharacterArt.ts` 하나뿐이다. 이 스크립트는
 * **게임과 동일한 함수**를 호출해 PNG로 떨군다(별도 아트 사본을 만들지 않는다).
 *   node tools/render_char_preview.mjs <출력디렉터리> [배율]
 * ⚠ core 재빌드 후 실행할 것 (`pnpm --filter @tra/core run build`).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import * as C from '../packages/core/dist/index.js';

// ── 최소 PNG 인코더 (의존성 없음) ─────────────────────────────
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 버퍼 유틸 ────────────────────────────────────────────────
export function blank(w, h, rgb = null) {
  const d = new Uint8ClampedArray(w * h * 4);
  if (rgb !== null) {
    for (let i = 0; i < w * h; i++) {
      d[i * 4] = (rgb >> 16) & 255; d[i * 4 + 1] = (rgb >> 8) & 255;
      d[i * 4 + 2] = rgb & 255; d[i * 4 + 3] = 255;
    }
  }
  return d;
}
export function blit(dst, dw, src, sw, sh, ox, oy) {
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const si = (y * sw + x) * 4;
      if (src[si + 3] === 0) continue;
      const dx = ox + x, dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dw) continue;
      const di = (dy * dw + dx) * 4;
      if (di + 3 >= dst.length) continue;
      dst[di] = src[si]; dst[di + 1] = src[si + 1]; dst[di + 2] = src[si + 2]; dst[di + 3] = 255;
    }
  }
}
export function scale(src, w, h, k) {
  const d = new Uint8ClampedArray(w * k * h * k * 4);
  for (let y = 0; y < h * k; y++) {
    for (let x = 0; x < w * k; x++) {
      const si = ((y / k | 0) * w + (x / k | 0)) * 4;
      const di = (y * w * k + x) * 4;
      d[di] = src[si]; d[di + 1] = src[si + 1]; d[di + 2] = src[si + 2]; d[di + 3] = src[si + 3];
    }
  }
  return d;
}

// ── 데모 캐스트 ──────────────────────────────────────────────
const cfg = (look, outfit) => C.makeCharConfig(look, outfit);

export const DEMO = {
  m_bare: cfg({ sex: 'm', skin: 1, hair: 0, hairStyle: 'short', eye: 0 }),
  f_bare: cfg({ sex: 'f', skin: 0, hair: 3, hairStyle: 'bob', eye: 2 }),
  m_start: cfg({ sex: 'm', skin: 1, hair: 0, hairStyle: 'short', eye: 0 }, C.starterOutfit('m')),
  f_start: cfg({ sex: 'f', skin: 0, hair: 3, hairStyle: 'pony', eye: 2 }, C.starterOutfit('f')),
  m_geared: cfg({ sex: 'm', skin: 2, hair: 0, hairStyle: 'short', eye: 0 }, {
    ...C.starterOutfit('m'), pants: 'waders', pantsColor: 0x5b6637, shoes: 'rubber', shoesColor: 0x4a4550,
    outer: 'vest', outerColor: 0xc47430, hat: 'cap', hatColor: 0x3d5a80, gloves: true, pack: true, held: 'rod',
  }),
};

function main() {
  const out = process.argv[2] || './out';
  const k = Number(process.argv[3] || 5);
  mkdirSync(out, { recursive: true });
  for (const [id, c] of Object.entries(DEMO)) {
    const sh = C.renderCharSheet(c);
    writeFileSync(join(out, `${id}.png`), encodePng(sh.w * k, sh.h * k, scale(sh.data, sh.w, sh.h, k)));
  }
  console.log('sheets ->', out, Object.keys(DEMO).length);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
