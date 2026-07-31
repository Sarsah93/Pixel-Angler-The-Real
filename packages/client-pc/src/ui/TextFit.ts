/**
 * @file TextFit.ts
 * @description 텍스트 폭·높이 상한 공용 헬퍼 (AGENTS.md §4 "UI 레이아웃 검수 정책" 구현)
 *
 * 가변 길이 문자열(아이템명·어종명·면허명·수치)이 인접 열(버튼/가격)이나 패널 경계를
 * 침범하지 않도록 강제한다. 정책의 3가지 방어 수단 중
 *  - `clampTextWidth` = 3번 "라벨 단축" — wordWrap을 쓸 수 없는 **한 줄 고정 행**에서 사용
 *    (줄바꿈하면 아래 행과 겹치는 레이아웃: 장비 목록 행, 면허 목록 행 등)
 *  - `fitTextHeight` = 1번 wordWrap의 세로 보완 — 줄 수가 유동적인 블록이
 *    아래 요소(버튼)와 겹치지 않도록 넘칠 때만 축소
 * 를 공용화한 것이다.
 */

import Phaser from 'phaser';

/**
 * 텍스트가 `maxW`(픽셀)를 넘으면 말줄임(…)으로 잘라 한 줄 폭을 보장한다.
 * 이진 탐색으로 상한을 넘지 않는 최대 길이를 찾는다 (원본이 이미 들어가면 무변경).
 *
 * @param t 대상 텍스트 (setText로 내용이 교체될 수 있음)
 * @param maxW 허용 최대 폭 (px) — 인접 요소 시작 x − 텍스트 x − 여백
 */
export function clampTextWidth(t: Phaser.GameObjects.Text, maxW: number): Phaser.GameObjects.Text {
  if (maxW <= 0) return t;
  const full = t.text;
  if (t.width <= maxW || full.length === 0) return t;

  let lo = 0;
  let hi = full.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    t.setText(full.slice(0, mid) + '…');
    if (t.width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  t.setText(lo > 0 ? full.slice(0, lo) + '…' : '…');
  return t;
}

/**
 * 텍스트 블록 높이가 `maxH`를 넘으면 축소해 아래 요소와의 겹침을 막는다.
 * (origin이 (x, 0)이면 상단 기준으로 줄어들어 시작 y가 유지된다.)
 *
 * @param maxH 허용 최대 높이 (px)
 * @param minScale 가독성 하한 — 이보다 더 줄이지 않는다 (기본 0.72)
 */
export function fitTextHeight(t: Phaser.GameObjects.Text, maxH: number, minScale = 0.72): Phaser.GameObjects.Text {
  if (maxH <= 0 || t.height <= maxH) return t;
  t.setScale(Math.max(minScale, maxH / t.height));
  return t;
}
