/**
 * @file GameCursor.ts
 * @description 250차 — 게임 마우스 포인터(찌 화살 · 사용자가 고른 시안 1번)를 캔버스에 입힌다.
 *              251차 — 설정 「접근성」에서 고르는 색(찌 · 야광찌 · 운영체제 기본) · 흰 테(없음 · 옅게 · 또렷하게) · 크기(1 · 2배).
 *
 * - 기본 커서 = 고른 색 + 고른 테. 누를 수 있는 곳(Phaser `useHandCursor` — 커서 값 `'pointer'`)은
 *   같은 그림에 **한 단계 더 진한 흰 테**(최소 또렷한 1px — 250차 기본 손 커서)를 두른다.
 *   R14 필드 글자(검은 글자 + 흰 테)와 같은 생각 — 어두운 판 · 밤 바다에서도 「여기를 누를 수 있다」가 읽힌다.
 * - 야광찌 = 같은 모양에서 빨강 · 주황만 형광 연두노랑(`GameCursorArt.glow`) — 적록 · 청황 색약에서도 밝기 차로 또렷하다.
 * - 크기는 CSS 23px(보통) · 46px(크게) — 도트라 정수배만. 32px를 넘는 커서는 크롬이 주소창 같은 브라우저 화면에
 *   걸칠 때 운영체제 화살표로 바꾼다(전체 화면 · 데스크톱 앱은 걸릴 곳이 없다).
 *   고해상도 화면(devicePixelRatio 2 · 3)은 `image-set`으로 2 · 3배 그림을 줘 흐리게 늘이지 않게 한다(128px 넘는 판은 뺀다).
 * - 그림은 `data/GameCursorArt.ts`(자동 생성)의 글자 격자를 캔버스로 구운 data URI다 — 파일 경로가 없어
 *   gh-pages 하위 경로 · Tauri에서도 그대로 동작하고, 처음 올릴 때 늦게 뜨는 일이 없다.
 * - Phaser는 손 커서 키워드 `'pointer'`를 `InputManager.setCursor`로 캔버스에 넣는다 — 그 함수를 감싸 `'pointer'`만 바꾼다.
 *   `restoreHandCursor`(`ui/DraggablePanel`)도 `handCursorCss()`를 쓴다. 그 밖의 값(HUD 끌기 `'move'`)은 그대로 둔다.
 * - 설정 모듈(`scenes/SettingsScene`)을 가져오지 않는다(순환 import 방지) — 옵션은 부르는 쪽이 넘긴다.
 */

import Phaser from 'phaser';
import { GAME_CURSOR_ART } from '../data/GameCursorArt.js';

/** 포인터 색 — 찌(빨강) · 야광찌(형광 연두노랑) · 운영체제 기본 커서 */
export type CursorStyle = 'float' | 'glow' | 'system';
/** 기본 포인터 흰 테 — 0 없음 · 1 옅게 · 2 또렷하게 */
export type CursorEdge = 0 | 1 | 2;
/** 포인터 크기 — 1 보통(23px) · 2 크게(46px) */
export type CursorScale = 1 | 2;

export interface CursorOptions {
  style: CursorStyle;
  edge: CursorEdge;
  scale: CursorScale;
}

/** 250차 모습 그대로 — 찌 · 테 없음 · 보통 */
export const DEFAULT_CURSOR_OPTIONS: CursorOptions = { style: 'float', edge: 0, scale: 1 };

/** Phaser 입력 관리자 중 커서에 쓰는 부분 — `setCursor`는 문서상 private이라 Phaser 타입에 없다 */
interface CursorHost {
  canvas?: HTMLCanvasElement;
  setDefaultCursor(cursor: string): void;
  setCursor(interactiveObject: Phaser.Types.Input.InteractiveObject): void;
}

/** 그림 둘레 여백 — 테 두 겹이 들어갈 자리. 모든 판이 같은 캔버스 · 같은 끝점을 쓴다 */
const PAD = 2;
/** 테 단계 → [안쪽 테 불투명도, 바깥 테 불투명도] — 0 없음 · 1 옅게 · 2 또렷하게 · 3 두 겹(손 커서 전용) */
const EDGE_LEVELS: readonly (readonly [number, number])[] = [[0, 0], [0.55, 0], [1, 0], [1, 0.55]];
/** 커서 그림 한 변 상한(px) — 브라우저가 더 큰 커서를 받지 않는다 */
const MAX_CURSOR_PX = 128;

/** 손 커서 테 단계 — 고른 테보다 한 단계 진하게, 최소 또렷한 1px */
export function handEdgeLevel(edge: CursorEdge): number {
  return Math.max(2, edge + 1);
}

/** 1배 캔버스 크기(여백 포함) */
export const CURSOR_CANVAS = { w: GAME_CURSOR_ART.w + PAD * 2, h: GAME_CURSOR_ART.h + PAD * 2 };

/** 그림 칸 · 테 두 겹 칸(여백 좌표계) — 한 번만 센다 */
let rings: { inner: Set<number>; outer: Set<number> } | null = null;
function edgeRings(): { inner: Set<number>; outer: Set<number> } {
  if (rings) return rings;
  const { w, h } = CURSOR_CANVAS;
  const solid = new Set<number>();
  GAME_CURSOR_ART.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== '.') solid.add((y + PAD) * w + (x + PAD));
  });
  const grow = (from: Set<number>, skip: Set<number>[]): Set<number> => {
    const out = new Set<number>();
    for (const i of from) {
      const x = i % w, y = Math.floor(i / w);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (!skip.some((s) => s.has(j))) out.add(j);
      }
    }
    return out;
  };
  const inner = grow(solid, [solid]);
  const outer = grow(inner, [solid, inner]);
  rings = { inner, outer };
  return rings;
}

/** 포인터 그림을 2D 캔버스에 m배로 그린다(여백 포함 · 왼쪽 위 = (ox, oy)) — 설정 미리보기도 이것을 쓴다 */
export function paintCursor(
  ctx: CanvasRenderingContext2D, style: Exclude<CursorStyle, 'system'>, edgeLevel: number, m: number, ox = 0, oy = 0,
): void {
  const { w } = CURSOR_CANVAS;
  const [a1, a2] = EDGE_LEVELS[Math.max(0, Math.min(EDGE_LEVELS.length - 1, edgeLevel))];
  const { inner, outer } = edgeRings();
  const dot = (i: number): void => ctx.fillRect(ox + (i % w) * m, oy + Math.floor(i / w) * m, m, m);
  if (a2 > 0) { ctx.fillStyle = `rgba(255,255,255,${a2})`; outer.forEach(dot); }
  if (a1 > 0) { ctx.fillStyle = `rgba(255,255,255,${a1})`; inner.forEach(dot); }
  const pal = style === 'glow' ? { ...GAME_CURSOR_ART.pal, ...GAME_CURSOR_ART.glow } : GAME_CURSOR_ART.pal;
  GAME_CURSOR_ART.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const v = pal[row[x]];
      if (v === undefined) continue; // '.' = 투명
      ctx.fillStyle = `#${v.toString(16).padStart(6, '0')}`;
      ctx.fillRect(ox + (x + PAD) * m, oy + (y + PAD) * m, m, m);
    }
  });
}

/** 구운 data URI 보관 — 같은 판을 두 번 굽지 않는다 */
const uriCache = new Map<string, string | null>();
function bakeUri(style: Exclude<CursorStyle, 'system'>, edgeLevel: number, m: number): string | null {
  const key = `${style}:${edgeLevel}:${m}`;
  if (uriCache.has(key)) return uriCache.get(key) ?? null;
  const c = document.createElement('canvas');
  c.width = CURSOR_CANVAS.w * m;
  c.height = CURSOR_CANVAS.h * m;
  const g = c.getContext('2d');
  const uri = g ? (paintCursor(g, style, edgeLevel, m), c.toDataURL('image/png')) : null;
  uriCache.set(key, uri);
  return uri;
}

/** CSS `cursor` 값 — `image-set`(1 · 2 · 3배 해상도)이 되면 그것, 아니면 1배 `url()` · 굽지 못하면 대체 키워드 */
function cursorCss(style: CursorStyle, edgeLevel: number, scale: CursorScale, fallback: string): string {
  if (style === 'system') return fallback;
  const one = bakeUri(style, edgeLevel, scale);
  if (!one) return fallback;
  // 끝점은 CSS px 기준 — 2 · 3배 해상도 그림은 브라우저가 해상도로 나눈다
  const hot = `${(GAME_CURSOR_ART.hotX + PAD) * scale} ${(GAME_CURSOR_ART.hotY + PAD) * scale}`;
  const plain = `url("${one}") ${hot}, ${fallback}`;
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return plain;
  const set: string[] = [`url("${one}") 1x`];
  for (const r of [2, 3]) {
    if (CURSOR_CANVAS.w * scale * r > MAX_CURSOR_PX) break;
    const u = bakeUri(style, edgeLevel, scale * r);
    if (u) set.push(`url("${u}") ${r}x`);
  }
  if (set.length === 1) return plain;
  for (const fn of ['image-set', '-webkit-image-set']) {
    const v = `${fn}(${set.join(', ')}) ${hot}, ${fallback}`;
    if (CSS.supports('cursor', v)) return v;
  }
  return plain;
}

/** 설치 전 · 운영체제 기본 · 굽기 실패 시 값 — 브라우저 기본 커서 */
let arrowCss = 'default';
let handCss = 'pointer';
const installed = new WeakSet<Phaser.Game>();

/** 지금 손 커서 값 — `restoreHandCursor`가 쓴다(설치 전 · 운영체제 기본이면 `'pointer'`) */
export function handCursorCss(): string {
  return handCss;
}

/** 252차 — 손 커서를 입힌 캔버스 · 브라우저가 정리해 돌려준 값(`image-set` 따옴표 등이 바뀔 수 있어 읽어 둔다) */
let handCanvas: HTMLCanvasElement | null = null;
let handApplied = '';
function markHand(canvas: HTMLCanvasElement): void {
  handCanvas = canvas;
  handApplied = canvas.style.cursor;
}

/** 지금 「누를 수 있는 곳」 커서가 떠 있는가 — 단추 딸깍(`audio/UiClickHook`)이 쓴다 */
export function isHandCursorOn(): boolean {
  const cur = handCanvas?.style.cursor ?? '';
  return cur !== '' && (cur === handApplied || cur === 'pointer');
}

/** 옵션을 캔버스에 입힌다 — 지금 손 커서가 떠 있으면 손 커서도 새 값으로 바꾼다 */
function applyTo(mgr: CursorHost, canvas: HTMLCanvasElement, opts: CursorOptions): void {
  const wasHand = canvas.style.cursor === handCss || canvas.style.cursor === 'pointer';
  arrowCss = cursorCss(opts.style, opts.edge, opts.scale, 'default');
  handCss = cursorCss(opts.style, handEdgeLevel(opts.edge), opts.scale, 'pointer');
  mgr.setDefaultCursor(arrowCss);
  if (wasHand) { canvas.style.cursor = handCss; markHand(canvas); }
}

function hostOf(game: Phaser.Game): { mgr: CursorHost; canvas: HTMLCanvasElement } | null {
  const mgr = game.input as unknown as CursorHost | undefined;
  const canvas = mgr?.canvas;
  return mgr && canvas ? { mgr, canvas } : null;
}

/**
 * 게임 포인터를 캔버스에 입힌다 — `game.ts`가 `Phaser.Game`을 만든 직후 설정값으로 한 번 부른다.
 * 입력 관리자가 캔버스를 잡기 전(부팅 전)이면 READY 뒤에 입힌다. 같은 게임에 두 번 걸지 않는다.
 */
export function installGameCursor(game: Phaser.Game, opts: CursorOptions = DEFAULT_CURSOR_OPTIONS): void {
  if (installed.has(game)) { applyCursorOptions(game, opts); return; }
  installed.add(game);
  const apply = (): void => {
    const h = hostOf(game);
    if (!h) return;
    const { mgr, canvas } = h;
    // Phaser를 올렸을 때 이 함수가 사라졌으면 손 커서는 운영체제 손으로 둔다(기본 커서만 입힌다)
    if (typeof mgr.setCursor === 'function') {
      const setCursor = mgr.setCursor.bind(mgr);
      mgr.setCursor = (io: Phaser.Types.Input.InteractiveObject): void => {
        if (io.cursor === 'pointer') { canvas.style.cursor = handCss; markHand(canvas); }
        else setCursor(io);
      };
    }
    applyTo(mgr, canvas, opts);
  };
  if (game.isBooted) apply();
  else game.events.once(Phaser.Core.Events.READY, apply);
}

/** 설정이 바뀌면 부른다 — 기본 · 손 커서를 다시 굽고 바로 바꾼다 */
export function applyCursorOptions(game: Phaser.Game, opts: CursorOptions): void {
  const h = hostOf(game);
  if (h) applyTo(h.mgr, h.canvas, opts);
}
