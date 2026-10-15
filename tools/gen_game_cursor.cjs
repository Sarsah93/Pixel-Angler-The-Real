// 250차 — 게임 마우스 포인터(찌 화살) 굽기 · 251차 — 야광찌 팔레트 · 테두리는 런타임
//
// 입력: assets/cursor/arrow_float.png — 사용자가 고른 시안 1번(23px 픽셀 그림 · 247차 Gemini 원본 arrow_float_gemini.png를 칸으로 내린 것)
// 출력: packages/client-pc/src/data/GameCursorArt.ts — 글자 격자 + 팔레트 + 야광찌 팔레트(덮어쓰기) + 끝점
//       assets/cursor/arrow_float_hand.png — 손 커서 미리보기(흰 테 1px · 4방향 — 250차 기본 손 커서)
//       assets/cursor/arrow_float_glow.png — 야광찌 미리보기(251차)
//
// 테두리(없음 · 옅게 · 또렷하게 · 두 겹)와 크기(1 · 2배)는 설정에 따라 `ui/GameCursor.ts`가 런타임에 굽는다.
// 야광찌 = 같은 모양에서 빨강 · 주황만 형광 연두노랑으로 — 적록 · 청황 색약 흉내에서도 밝기 차로 또렷하다(251차 비교).
//
// 실행: node tools/gen_game_cursor.cjs
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib_png.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets/cursor/arrow_float.png');
const HAND_PREVIEW = path.join(ROOT, 'assets/cursor/arrow_float_hand.png');
const GLOW_PREVIEW = path.join(ROOT, 'assets/cursor/arrow_float_glow.png');
const OUT_TS = path.join(ROOT, 'packages/client-pc/src/data/GameCursorArt.ts');

/** 누르는 자리 = 찌 꼭대기(안테나) 빨간 끝 한 칸 — 왼쪽 위 검은 테 바로 안쪽 */
const HOT = { x: 1, y: 1 };
/** 손 커서 미리보기 테 색 */
const EDGE = [255, 255, 255, 255];
/** 야광찌 — 빨강 · 주황 칸을 바꿀 색(밝은 면 · 본색 · 그늘) */
const GLOW = { hi: [244, 255, 176], main: [228, 255, 60], shade: [166, 200, 26] };
/** 팔레트 글자(투명 '.'은 빼고) */
const KEYS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function readArt(file) {
  const { w, h, data } = decode(file);
  const px = [];
  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3];
    if (a !== 0 && a !== 255) throw new Error(`반투명 픽셀(${a}) — 포인터 그림은 0/255만 쓴다`);
    px.push(a ? [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], 255] : null);
  }
  return { w, h, px };
}

/** 빨강 · 주황 칸이면 야광 색 */
function glowOf(c) {
  const [r, g, b] = c;
  if (!(r > 150 && g < 140 && b < 90)) return null;
  const v = g > 100 ? GLOW.hi : r >= 230 ? GLOW.main : GLOW.shade;
  return [v[0], v[1], v[2], 255];
}

/** 둘레 4방향에 테 1px — 캔버스는 양쪽으로 1px씩 넓어진다(미리보기용) */
function withEdge(art, color) {
  const W = art.w + 2, H = art.h + 2;
  const at = (x, y) => (x >= 0 && y >= 0 && x < art.w && y < art.h ? art.px[y * art.w + x] : null);
  const px = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = at(x - 1, y - 1);
      if (c) { px.push(c); continue; }
      const near = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => at(x - 1 + dx, y - 1 + dy));
      px.push(near ? color : null);
    }
  }
  return { w: W, h: H, px };
}

function toGrid(art) {
  const pal = new Map();
  const rows = [];
  for (let y = 0; y < art.h; y++) {
    let r = '';
    for (let x = 0; x < art.w; x++) {
      const c = art.px[y * art.w + x];
      if (!c) { r += '.'; continue; }
      const hex = (c[0] << 16) | (c[1] << 8) | c[2];
      if (!pal.has(hex)) {
        if (pal.size >= KEYS.length) throw new Error('팔레트 글자가 모자란다');
        pal.set(hex, KEYS[pal.size]);
      }
      r += pal.get(hex);
    }
    rows.push(r);
  }
  return { pal, rows };
}

function writePng(art, file) {
  const buf = Buffer.alloc(art.w * art.h * 4);
  art.px.forEach((c, i) => { if (c) buf.set(c, i * 4); });
  return encode(art.w, art.h, buf, file);
}

const hex6 = (v) => `0x${v.toString(16).padStart(6, '0')}`;
const toHex = (c) => (c[0] << 16) | (c[1] << 8) | c[2];

const arrow = readArt(SRC);
if (!arrow.px[HOT.y * arrow.w + HOT.x]) throw new Error('끝점이 투명 칸이다 — HOT을 확인');
const { pal, rows } = toGrid(arrow);
const glowPal = [];
for (const [hex, k] of pal) {
  const g = glowOf([(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]);
  if (g) glowPal.push([k, toHex(g)]);
}
const handBytes = writePng(withEdge(arrow, EDGE), HAND_PREVIEW);
const glowBytes = writePng({ ...arrow, px: arrow.px.map((c) => (c ? glowOf(c) ?? c : null)) }, GLOW_PREVIEW);

const ts = `/**
 * @file GameCursorArt.ts
 * @description 게임 마우스 포인터 그림 — 찌 화살 (자동 생성 — 수동 편집 금지)
 *
 * 생성기: \`node tools/gen_game_cursor.cjs\` (원본 \`assets/cursor/arrow_float.png\` — 250차 사용자 선택 시안 1번).
 * 글자 = 팔레트 키, \`.\` = 투명. 테두리 · 크기 · 색 바꾸기와 화면 연결은 \`ui/GameCursor.ts\`가 맡는다(여기는 순수 데이터).
 */

export interface GameCursorArt {
  /** 가로 픽셀 수 */
  w: number;
  /** 세로 픽셀 수 */
  h: number;
  /** 누르는 자리(끝점) — 1배 기준 픽셀 좌표 */
  hotX: number;
  hotY: number;
  /** 팔레트 — 문자 → 0xRRGGBB */
  pal: Record<string, number>;
  /** 251차 — 야광찌 팔레트(빨강 · 주황 칸만 덮어쓴다) */
  glow: Record<string, number>;
  /** 행 배열 (길이 = h, 각 행 길이 = w) */
  rows: string[];
}

export const GAME_CURSOR_ART: GameCursorArt = {
  w: ${arrow.w},
  h: ${arrow.h},
  hotX: ${HOT.x},
  hotY: ${HOT.y},
  pal: {
${[...pal.entries()].map(([hex, k]) => `    ${k}: ${hex6(hex)},`).join('\n')}
  },
  glow: {
${glowPal.map(([k, hex]) => `    ${k}: ${hex6(hex)},`).join('\n')}
  },
  rows: [
${rows.map((r) => `    '${r}',`).join('\n')}
  ],
};
`;
fs.writeFileSync(OUT_TS, ts);
console.log(`찌 ${arrow.w}×${arrow.h} · 야광 바꿈 ${glowPal.length}색 · 미리보기 손 ${handBytes}B · 야광 ${glowBytes}B · 끝점 (${HOT.x},${HOT.y}) → ${path.relative(ROOT, OUT_TS)}`);
