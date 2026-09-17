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

/**
 * 컨테이너 트리의 **모든 Text**가 오른쪽 경계 `maxRight`(컨테이너 로컬 x) 안에 들어가도록 강제한다
 * (117차 — "채비하기 창 밖으로 글자가 또 튀어나옴" 재발 방지의 마지막 방어선).
 *
 * 규칙: 넘치는 텍스트에 남은 폭만큼 wordWrap을 걸고, 그래도 넘치면(한 단어가 너무 길면) 말줄임.
 * 각 패널의 render 마지막에 한 번 호출한다 — 개별 배치를 잘못해도 창 밖으로는 절대 못 나간다.
 * dev 빌드에서는 넘친 텍스트를 `console.warn('[TextOverflow] …')`로 남겨 근본 배치를 고치게 한다.
 *
 * @returns 보정한 텍스트 수
 */
export function enforceTextBounds(root: Phaser.GameObjects.Container, maxRight: number, tag = ''): number {
  let fixed = 0;
  const walk = (c: Phaser.GameObjects.Container, ox: number): void => {
    for (const child of c.list) {
      if (child instanceof Phaser.GameObjects.Container) { walk(child, ox + child.x); continue; }
      if (!(child instanceof Phaser.GameObjects.Text)) continue;
      const t = child;
      const left = ox + t.x - t.width * t.originX;
      const right = left + t.width;
      if (right <= maxRight + 0.5) continue;
      const avail = Math.floor(maxRight - left);
      const src = t.text;
      if (avail >= 60 && t.originX === 0) {
        t.setWordWrapWidth(avail, true);
        t.setText(src);   // 재배치 강제
        if (t.width > avail + 0.5) clampTextWidth(t, avail);
      } else {
        clampTextWidth(t, Math.max(8, avail));
      }
      fixed++;
      if (import.meta.env.DEV) {
        console.warn(`[TextOverflow] ${tag} right=${Math.round(right)} > ${maxRight}: "${src.slice(0, 60)}"`);
      }
    }
  };
  walk(root, 0);
  return fixed;
}

/**
 * 세로 경계 감사 (150차 — 사용자 리포트 "텍스트가 팝업창 밑 경계선에 걸려있다").
 *
 * 가로(`enforceTextBounds`)는 말줄임으로 **고칠 수 있지만**, 세로로 넘친 텍스트는 잘라 낼 수 없다
 * (내용이 사라진다). 그래서 이 함수는 고치지 않고 **찾아서 돌려준다** — 배치를 사람이 고치라는 뜻이다.
 * dev 하네스가 패널을 하나씩 열어 전수 조사하는 데 쓴다.
 *
 * @returns 경계를 넘은 텍스트 목록(패널 로컬 좌표 기준 bottom 포함)
 */
export function auditTextBottom(
  root: Phaser.GameObjects.Container, maxBottom: number, tag = '',
): { text: string; bottom: number; over: number }[] {
  const bad: { text: string; bottom: number; over: number }[] = [];
  const walk = (c: Phaser.GameObjects.Container, oy: number): void => {
    for (const child of c.list) {
      if (child instanceof Phaser.GameObjects.Container) { walk(child, oy + child.y); continue; }
      if (!(child instanceof Phaser.GameObjects.Text)) continue;
      const t = child;
      const top = oy + t.y - t.height * t.originY;
      const bottom = top + t.height;
      if (bottom <= maxBottom + 0.5) continue;
      bad.push({ text: t.text.slice(0, 48), bottom: Math.round(bottom), over: Math.round(bottom - maxBottom) });
    }
  };
  walk(root, 0);
  if (bad.length && import.meta.env.DEV) {
    console.warn(`[TextBottom] ${tag} maxBottom=${maxBottom}`, bad);
  }
  return bad;
}
