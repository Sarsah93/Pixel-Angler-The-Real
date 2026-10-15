/**
 * @file GameCursor.ts
 * @description 250차 — 게임 마우스 포인터(찌 화살 · 사용자가 고른 시안 1번)를 캔버스에 입힌다.
 *
 * - 기본 = 시안 그대로(23px). 누를 수 있는 곳(Phaser `useHandCursor` — 커서 값 `'pointer'`)은
 *   같은 그림에 흰 테를 두른 손 커서로 바꾼다(R14 필드 글자와 같은 생각 — 어두운 판 · 밤 바다에서도 읽힌다).
 * - 크기는 CSS 23px 그대로 둔다 — 32px를 넘는 커서는 크롬이 주소창 근처에서 숨긴다.
 *   고해상도 화면(devicePixelRatio 2 · 3)은 `image-set`으로 2배 · 3배 그림을 줘 브라우저가 흐리게 늘이지 않게 한다
 *   (지원하지 않는 브라우저는 1배 `url()`).
 * - 그림은 `data/GameCursorArt.ts`(자동 생성)의 글자 격자를 캔버스로 구운 data URI다 — 파일 경로가 없어
 *   gh-pages 하위 경로 · Tauri에서도 그대로 동작하고, 처음 올릴 때 늦게 뜨는 일이 없다.
 * - Phaser는 손 커서 키워드 `'pointer'`를 `InputManager.setCursor`로 캔버스에 넣는다 — 그 함수를 감싸 `'pointer'`만 바꾼다.
 *   `restoreHandCursor`(`ui/DraggablePanel`)도 `handCursorCss()`를 쓴다. 그 밖의 값(HUD 끌기 `'move'`)은 그대로 둔다.
 */

import Phaser from 'phaser';
import { GAME_CURSOR_ART, type GameCursorArt } from '../data/GameCursorArt.js';

/** Phaser 입력 관리자 중 커서에 쓰는 부분 — `setCursor`는 문서상 private이라 Phaser 타입에 없다 */
interface CursorHost {
  canvas?: HTMLCanvasElement;
  setDefaultCursor(cursor: string): void;
  setCursor(interactiveObject: Phaser.Types.Input.InteractiveObject): void;
}

/** 설치 전 · 굽기 실패 시 값 — 브라우저 기본 커서 */
let handCss = 'pointer';
const installed = new WeakSet<Phaser.Game>();

/** 글자 격자 → m배 PNG data URI (칸을 그대로 키운다 — 도트가 번지지 않게) */
function bake(art: GameCursorArt, m: number): string | null {
  const c = document.createElement('canvas');
  c.width = art.w * m;
  c.height = art.h * m;
  const g = c.getContext('2d');
  if (!g) return null;
  art.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const v = art.pal[row[x]];
      if (v === undefined) continue; // '.' = 투명
      g.fillStyle = `#${v.toString(16).padStart(6, '0')}`;
      g.fillRect(x * m, y * m, m, m);
    }
  });
  return c.toDataURL('image/png');
}

/** CSS `cursor` 값 — `image-set`(1 · 2 · 3배)이 되면 그것, 아니면 1배 `url()` · 굽지 못하면 대체 키워드 */
function cursorCss(art: GameCursorArt, fallback: string): string {
  const one = bake(art, 1);
  if (!one) return fallback;
  const hot = `${art.hotX} ${art.hotY}`; // 끝점은 1배(CSS px) 기준 — 2 · 3배 그림은 브라우저가 해상도로 나눈다
  const plain = `url("${one}") ${hot}, ${fallback}`;
  const two = bake(art, 2);
  const three = bake(art, 3);
  if (!two || !three || typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return plain;
  const set = `url("${one}") 1x, url("${two}") 2x, url("${three}") 3x`;
  for (const fn of ['image-set', '-webkit-image-set']) {
    const v = `${fn}(${set}) ${hot}, ${fallback}`;
    if (CSS.supports('cursor', v)) return v;
  }
  return plain;
}

/** 지금 손 커서 값 — `restoreHandCursor`가 쓴다(설치 전에는 `'pointer'`) */
export function handCursorCss(): string {
  return handCss;
}

/**
 * 게임 포인터를 캔버스에 입힌다 — `game.ts`가 `Phaser.Game`을 만든 직후 한 번 부른다.
 * 입력 관리자가 캔버스를 잡기 전(부팅 전)이면 READY 뒤에 입힌다. 같은 게임에 두 번 걸지 않는다.
 */
export function installGameCursor(game: Phaser.Game): void {
  if (installed.has(game)) return;
  installed.add(game);
  const apply = (): void => {
    const mgr = game.input as unknown as CursorHost | undefined;
    const canvas = mgr?.canvas;
    if (!mgr || !canvas) return;
    // Phaser를 올렸을 때 이 함수가 사라졌으면 손 커서는 운영체제 손으로 둔다(기본 커서만 입힌다)
    if (typeof mgr.setCursor !== 'function') { mgr.setDefaultCursor(cursorCss(GAME_CURSOR_ART.arrow, 'default')); return; }
    const arrowCss = cursorCss(GAME_CURSOR_ART.arrow, 'default');
    handCss = cursorCss(GAME_CURSOR_ART.hand, 'pointer');
    const setCursor = mgr.setCursor.bind(mgr);
    mgr.setCursor = (io: Phaser.Types.Input.InteractiveObject): void => {
      if (io.cursor === 'pointer') canvas.style.cursor = handCss;
      else setCursor(io);
    };
    mgr.setDefaultCursor(arrowCss);
  };
  if (game.isBooted) apply();
  else game.events.once(Phaser.Core.Events.READY, apply);
}
