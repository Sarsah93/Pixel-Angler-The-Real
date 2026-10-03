/**
 * @file MapMarkerTip.ts
 * @description 지도 마커 정보 카드 (200차 — 사용자 지시 "미니맵·M 지도 아이콘에 마우스를 올리면 정보가 뜨게").
 *
 * 미니맵과 전체 지도(M)가 같은 카드를 쓴다. 카드는 **이름만이 아니라 "가 볼 이유"를 한 번에** 읽히게 한다:
 *  - 1줄: 아이콘 + 이름 (가게 이름 / 사람 이름 / 장소 이름)
 *  - 2줄: 무엇인가 — 가게 종류(직판장·생활용품점 …) / 사람의 나이·직업 / 장소 종류
 *  - 3줄: 무엇을 파는가 — 가게만 (미끼·채비 · 잡은 고기 매입 …)
 *  - 상태: 새 의뢰 / 해결 가능 (지도 범례와 같은 말 — 인물만)
 *  - 끝줄: 나와의 거리·방향 ("약 120m · 북동쪽") — 걸어가는 동안 실시간으로 줄어든다
 * 아이콘이 겹쳐 하나만 그려진 자리(미니맵 셀 충돌 · 축소 지도)는 **그 자리에 있는 것 전부**를 목록으로 보여 준다.
 *
 * 배치는 커서 추종이 아니라 **마커 앵커 + 여유 공간이 큰 쪽으로 펼침**(ui-panel 규칙 6 — 대상 위에서 흔들리지 않게).
 * 조작 안내 문구는 넣지 않는다(R11).
 */

import Phaser from 'phaser';
import { addPixelIcon } from './PixelIcon.js';
import { clampTextWidth } from './TextFit.js';
import type { MiniMarker } from './RegionHud.js';

const FONT = '"Noto Sans KR", sans-serif';
const PAD = 8;
const ICON = 16;
const MAX_W = 230;
/** 겹친 자리 목록에서 이름으로 보여 줄 최대 개수 — 넘치면 「외 N곳」 */
const LIST_MAX = 5;

/** 거리 기준점 — 나의 월드 위치 + 월드 1px = N 미터 */
export interface TipOrigin {
  x: number;
  y: number;
  metersPerPx: number;
}

/** 화면 위쪽 = 북. 0 = 동에서 반시계로 45°씩 */
const DIRS = ['동', '북동', '북', '북서', '서', '남서', '남', '남동'];

/** "약 120m · 북동쪽" — 15m 안이면 "바로 근처" */
export function distanceLine(from: TipOrigin, wx: number, wy: number): string {
  const dx = wx - from.x, dy = wy - from.y;
  const m = Math.hypot(dx, dy) * from.metersPerPx;
  if (m < 15) return '바로 근처';
  const dist = m < 1000 ? `약 ${Math.round(m / 10) * 10}m` : `약 ${(m / 1000).toFixed(1)}km`;
  const a = Math.atan2(-dy, dx);
  const idx = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
  return `${dist} · ${DIRS[idx]}쪽`;
}

const STATUS_STYLE: Record<NonNullable<MiniMarker['status']>, { text: string; color: string; icon: string }> = {
  quest: { text: '새 의뢰', color: '#ffd257', icon: 'mm_quest' },
  ready: { text: '해결 가능', color: '#7ee08a', icon: 'mm_ready' },
};

/** 같은 내용이면 다시 그리지 않으려고 쓰는 서명 */
export function tipSignature(items: MiniMarker[], from: TipOrigin | null): string {
  const head = items[0];
  const dist = from && head ? distanceLine(from, head.wx, head.wy) : '';
  return `${items.map((m) => `${m.icon}|${m.label ?? ''}|${m.status ?? ''}`).join(';')}#${dist}`;
}

/**
 * 카드 만들기 — 반환 컨테이너의 (0,0)이 카드 좌상단. 크기는 `w`·`h`.
 * 호출 쪽이 `placeTip`으로 위치를 잡고 화면 고정(`applyScreenFixed`)을 건다.
 */
export function buildMarkerTip(
  scene: Phaser.Scene, items: MiniMarker[], from: TipOrigin | null,
): { c: Phaser.GameObjects.Container; w: number; h: number } {
  const c = scene.add.container(0, 0);
  const bg = scene.add.graphics();
  c.add(bg);
  let y = PAD;
  let w = 120;
  const text = (x: number, s: string, size: number, color: string, bold = false, wrap = MAX_W - x - PAD): Phaser.GameObjects.Text => {
    const t = scene.add.text(x, y, s, {
      fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal',
      wordWrap: { width: wrap, useAdvancedWrap: true },
    });
    c.add(t);
    w = Math.max(w, x + t.width + PAD);
    return t;
  };
  const head = items[0];

  if (items.length === 1) {
    const m = head;
    const ic = addPixelIcon(scene, m.icon, PAD + ICON / 2, y + ICON / 2 + 1, ICON);
    if (ic) c.add(ic);
    const title = text(PAD + ICON + 6, m.label ?? '', 13, '#eef7ff', true);
    y += Math.max(ICON + 2, title.height) + 3;
    if (m.sub) { const t = text(PAD, m.sub, 11, '#9fd0ff'); y += t.height + 2; }
    if (m.goods) { const t = text(PAD, m.goods, 11, '#b4c6d4'); y += t.height + 2; }
    if (m.status) {
      const st = STATUS_STYLE[m.status];
      const sic = addPixelIcon(scene, st.icon, PAD + 6, y + 8, 12);
      if (sic) c.add(sic);
      const t = text(PAD + 16, st.text, 11, st.color, true);
      y += Math.max(14, t.height) + 2;
    }
  } else {
    const hdr = text(PAD, `이 자리에 ${items.length}곳`, 10, '#7fa6c0');
    y += hdr.height + 4;
    for (const m of items.slice(0, LIST_MAX)) {
      const ic = addPixelIcon(scene, m.icon, PAD + 6, y + 8, 12);
      if (ic) c.add(ic);
      const t = text(PAD + 16, m.label ?? '', 12, '#eef7ff', true);
      let rowH = Math.max(14, t.height);
      // 오른쪽에 종류(가게 종류·직업)를 흐린 글씨로 — 이름과 같은 줄, 넘치면 다음 줄
      const kind = m.status ? STATUS_STYLE[m.status].text : m.sub;
      if (kind) {
        const kx = PAD + 16 + t.width + 6;
        const k = scene.add.text(kx, y + 1, kind, {
          fontFamily: FONT, fontSize: '10px', color: m.status ? STATUS_STYLE[m.status].color : '#8fb2c8',
        });
        if (kx + k.width + PAD > MAX_W) {
          // 같은 줄에 안 들어가면 이름 아래 줄로 — 그래도 길면(긴 직업 설명) 말줄임
          k.setPosition(PAD + 16, y + rowH);
          clampTextWidth(k, MAX_W - PAD - (PAD + 16));
          rowH += k.height;
        }
        c.add(k);
        w = Math.max(w, k.x + k.width + PAD);
      }
      y += rowH + 3;
    }
    if (items.length > LIST_MAX) { const t = text(PAD + 16, `외 ${items.length - LIST_MAX}곳`, 10, '#7fa6c0'); y += t.height + 2; }
  }

  let divY = -1;
  if (from && head) {
    y += 3;
    divY = y - 2;
    const t = text(PAD, distanceLine(from, head.wx, head.wy), 10, '#8fb2c8');
    y += t.height;
  }
  y += PAD;
  w = Math.min(MAX_W, Math.ceil(w));
  bg.fillStyle(0x0a1628, 0.95);
  bg.fillRoundedRect(0, 0, w, y, 5);
  bg.lineStyle(1, 0x4a8ac0, 1);
  bg.strokeRoundedRect(0, 0, w, y, 5);
  if (divY >= 0) {
    bg.lineStyle(1, 0x2a5a8a, 0.8);
    bg.lineBetween(PAD, divY, w - PAD, divY);
  }
  return { c, w, h: y };
}

/**
 * 앵커(마커 둘레, 화면 좌표) 옆에 카드를 둔다 — **좌우 중 여유가 큰 쪽**으로 펼치고,
 * 세로는 앵커 가운데에 맞추되 경계 안으로 민다.
 */
export function placeTip(
  c: Phaser.GameObjects.Container, w: number, h: number,
  anchor: Phaser.Geom.Rectangle, bounds: Phaser.Geom.Rectangle,
): void {
  const gap = 6;
  const roomR = bounds.right - anchor.right;
  const roomL = anchor.left - bounds.left;
  let x = roomR >= w + gap || roomR >= roomL ? anchor.right + gap : anchor.left - gap - w;
  x = Phaser.Math.Clamp(x, bounds.left, Math.max(bounds.left, bounds.right - w));
  const y = Phaser.Math.Clamp(anchor.centerY - h / 2, bounds.top, Math.max(bounds.top, bounds.bottom - h));
  c.setPosition(Math.round(x), Math.round(y));
}
