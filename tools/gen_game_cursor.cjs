// 250차 — 게임 마우스 포인터(찌 화살) 굽기
//
// 입력: assets/cursor/arrow_float.png — 사용자가 고른 시안 1번(23px 픽셀 그림 · 247차 Gemini 원본 arrow_float_gemini.png를 칸으로 내린 것)
// 출력: packages/client-pc/src/data/GameCursorArt.ts — 기본(arrow) · 누를 수 있는 곳(hand) 두 벌의 글자 격자 + 팔레트 + 끝점
//       assets/cursor/arrow_float_hand.png — 손 커서 미리보기(흰 테)
//
// 손 커서 = 같은 그림 둘레에 흰 테 1px(4방향) — 필드 글자 R14(검은 글자 + 흰 테)와 같은 생각으로,
// 어두운 판 · 밤 바다 위에서도 「여기를 누를 수 있다」가 읽힌다. 테 때문에 그림이 1px씩 밀려 끝점도 +1.
//
// 실행: node tools/gen_game_cursor.cjs
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib_png.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets/cursor/arrow_float.png');
const HAND_PREVIEW = path.join(ROOT, 'assets/cursor/arrow_float_hand.png');
const OUT_TS = path.join(ROOT, 'packages/client-pc/src/data/GameCursorArt.ts');

/** 누르는 자리 = 찌 꼭대기(안테나) 빨간 끝 한 칸 — 왼쪽 위 검은 테 바로 안쪽 */
const HOT = { x: 1, y: 1 };
/** 손 커서 테 색 */
const EDGE = [255, 255, 255, 255];
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

/** 둘레 4방향에 테 1px — 캔버스는 양쪽으로 1px씩 넓어진다 */
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

function tsEntry(name, art, hot, note) {
  const { pal, rows } = toGrid(art);
  const palLines = [...pal.entries()].map(([hex, k]) => `    ${k}: 0x${hex.toString(16).padStart(6, '0')},`);
  return [
    `  /** ${note} */`,
    `  ${name}: {`,
    `    w: ${art.w},`,
    `    h: ${art.h},`,
    `    hotX: ${hot.x},`,
    `    hotY: ${hot.y},`,
    '    pal: {',
    ...palLines.map((l) => '  ' + l),
    '    },',
    '    rows: [',
    ...rows.map((r) => `      '${r}',`),
    '    ],',
    '  },',
  ].join('\n');
}

const arrow = readArt(SRC);
const tip = arrow.px[HOT.y * arrow.w + HOT.x];
if (!tip) throw new Error('끝점이 투명 칸이다 — HOT을 확인');
const hand = withEdge(arrow, EDGE);
const bytes = writePng(hand, HAND_PREVIEW);

const ts = `/**
 * @file GameCursorArt.ts
 * @description 게임 마우스 포인터 그림 — 찌 화살 (자동 생성 — 수동 편집 금지)
 *
 * 생성기: \`node tools/gen_game_cursor.cjs\` (원본 \`assets/cursor/arrow_float.png\` — 250차 사용자 선택 시안 1번).
 * 글자 = 팔레트 키, \`.\` = 투명. 굽기 · 배수 · 화면 연결은 \`ui/GameCursor.ts\`가 맡는다(여기는 순수 데이터).
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
  /** 행 배열 (길이 = h, 각 행 길이 = w) */
  rows: string[];
}

export const GAME_CURSOR_ART: { arrow: GameCursorArt; hand: GameCursorArt } = {
${tsEntry('arrow', arrow, HOT, '기본 — 시안 그대로')}
${tsEntry('hand', hand, { x: HOT.x + 1, y: HOT.y + 1 }, '누를 수 있는 곳 — 같은 그림 + 흰 테 1px(4방향)')}
};
`;
fs.writeFileSync(OUT_TS, ts);
console.log(`기본 ${arrow.w}×${arrow.h} · 손 ${hand.w}×${hand.h}(미리보기 ${bytes}B) · 끝점 (${HOT.x},${HOT.y}) → ${path.relative(ROOT, OUT_TS)}`);
