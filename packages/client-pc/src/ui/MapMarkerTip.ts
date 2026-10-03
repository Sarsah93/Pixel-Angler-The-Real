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
 *
 * 201차 — 가게는 **영업 상태** 줄(24시간 / 영업 중 · 22:00까지 / 곧 마감 / 영업 종료 · 내일 10:00 개점)이 붙고,
 * **카드를 누르면 그곳에 핀**이 꽂힌다(다시 누르면 뽑힌다 · 목록이면 누른 줄). 핀이 꽂힌 곳이면 카드 끝에 「핀을 꽂은 곳」.
 * 마커에서 카드로 포인터를 옮기는 동안 카드가 사라지지 않도록 **카드 + 마커→카드 삼각 통로**(`tipHolds`) 안에서는 붙잡는다.
 */

import Phaser from 'phaser';
import { addPixelIcon } from './PixelIcon.js';
import { clampTextWidth } from './TextFit.js';
import type { MiniMarker } from './RegionHud.js';
import { kstParts } from '@tra/core';
import { shopHoursState } from '../data/ShopCatalog.js';

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

const HOURS_COLOR = { open: '#7ee08a', soon: '#ffce54', closed: '#ff8a7a' } as const;

/** 핀 모양(미니맵 핀과 같은 청록 물방울) — (0,0)이 뾰족한 끝. 픽셀 아이콘이 없어 도형으로 그린다 */
function pinGlyph(scene: Phaser.Scene, s = 1): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x0a1628, 0.9); g.fillTriangle(-5 * s, -6 * s, 5 * s, -6 * s, 0, 2 * s); g.fillCircle(0, -7 * s, 5 * s);
  g.fillStyle(0x5cd0ff, 1); g.fillTriangle(-3.5 * s, -6 * s, 3.5 * s, -6 * s, 0, 0); g.fillCircle(0, -7 * s, 3.5 * s);
  g.fillStyle(0x0a1628, 1); g.fillCircle(0, -7 * s, 1.4 * s);
  return g;
}

/** 카드 선택 사항 — 지금 꽂힌 핀(월드 좌표) · 카드/줄을 눌렀을 때 */
export interface TipOptions {
  pinnedAt?: { x: number; y: number } | null;
  onPick?: (m: MiniMarker) => void;
}

/**
 * 그 마커 자리에 핀이 꽂혀 있는가 — 가게·장소는 월드 2px 안.
 * 사람(`moves`)은 제자리 근처를 돌아다니므로 핀을 꽂은 뒤 조금 움직여도 「핀을 꽂은 곳」이 남게 64px(2타일) 안.
 */
export function isPinnedAt(m: MiniMarker, pin: { x: number; y: number } | null | undefined): boolean {
  const tol = m.moves ? 64 : 2;
  return !!pin && Math.abs(pin.x - m.wx) <= tol && Math.abs(pin.y - m.wy) <= tol;
}

/** 가게 영업 상태 — 지금 KST 시각 기준 (영업시간이 없으면 null) */
function hoursOf(m: MiniMarker): ReturnType<typeof shopHoursState> | null {
  if (!m.hours) return null;
  const k = kstParts(new Date());
  return shopHoursState(m.hours, Number(k.hh), Number(k.mi));
}

/** 카드에 실을 목록 — 핀 마커는 다른 것과 겹치면 빼고(그 자리 가게 카드에 「핀을 꽂은 곳」으로 나온다), 혼자일 때만 카드가 된다 */
export function tipItems(items: MiniMarker[]): MiniMarker[] {
  const rest = items.filter((m) => m.shape !== 'pin');
  return rest.length > 0 ? rest : items;
}

/** 같은 내용이면 다시 그리지 않으려고 쓰는 서명 (거리 · 영업 상태 · 핀 여부가 바뀌면 다시 그린다) */
export function tipSignature(items: MiniMarker[], from: TipOrigin | null, pin?: { x: number; y: number } | null): string {
  const head = items[0];
  const dist = from && head ? distanceLine(from, head.wx, head.wy) : '';
  return `${items.map((m) => `${m.icon}|${m.label ?? ''}|${m.status ?? ''}|${hoursOf(m)?.text ?? ''}|${isPinnedAt(m, pin) ? 'P' : ''}`).join(';')}#${dist}`;
}

/**
 * 마커를 떠난 포인터가 카드로 가는 중인가 — 카드(+4px) 위이거나, 마커 중심과 카드의 마커 쪽 모서리가 이루는
 * 삼각형 안이면 카드를 붙잡는다(메뉴 조준 방식 — 타이머 없이 결정적).
 */
export function tipHolds(px: number, py: number, apex: { x: number; y: number }, card: Phaser.Geom.Rectangle): boolean {
  const r = new Phaser.Geom.Rectangle(card.x - 4, card.y - 4, card.width + 8, card.height + 8);
  if (r.contains(px, py)) return true;
  const nearX = apex.x <= r.centerX ? r.left : r.right;
  return Phaser.Geom.Triangle.Contains(new Phaser.Geom.Triangle(apex.x, apex.y, nearX, r.top, nearX, r.bottom), px, py);
}

/**
 * 카드 만들기 — 반환 컨테이너의 (0,0)이 카드 좌상단. 크기는 `w`·`h`.
 * 호출 쪽이 `placeTip`으로 위치를 잡고 화면 고정(`applyScreenFixed`)을 건다.
 */
export function buildMarkerTip(
  scene: Phaser.Scene, items: MiniMarker[], from: TipOrigin | null, opts: TipOptions = {},
): { c: Phaser.GameObjects.Container; w: number; h: number } {
  const c = scene.add.container(0, 0);
  const bg = scene.add.graphics();
  c.add(bg);
  /** 누를 수 있는 띠 — 카드 전체(한 곳) 또는 목록의 줄. 크기는 다 그린 뒤 정한다 */
  const picks: { m: MiniMarker; y0: number; y1: number }[] = [];
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
    if (m.shape === 'pin') { const g = pinGlyph(scene, 1.3); g.setPosition(PAD + ICON / 2, y + ICON + 1); c.add(g); }
    else { const ic = addPixelIcon(scene, m.icon, PAD + ICON / 2, y + ICON / 2 + 1, ICON); if (ic) c.add(ic); }
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
    const hs = hoursOf(m);
    if (hs) {
      // 영업 상태 — 색 점 + 글자(초록 열림 · 주황 곧 마감 · 빨강 닫힘)
      const dot = scene.add.graphics();
      dot.fillStyle(Phaser.Display.Color.HexStringToColor(HOURS_COLOR[hs.tone]).color, 1);
      dot.fillCircle(PAD + 4, y + 8, 3.5);
      c.add(dot);
      const t = text(PAD + 12, hs.text, 11, HOURS_COLOR[hs.tone], true);
      y += Math.max(14, t.height) + 2;
    }
    picks.push({ m, y0: 0, y1: -1 });   // -1 = 카드 끝까지
  } else {
    const hdr = text(PAD, `이 자리에 ${items.length}곳`, 10, '#7fa6c0');
    y += hdr.height + 4;
    for (const m of items.slice(0, LIST_MAX)) {
      const rowY0 = y - 2;
      const ic = addPixelIcon(scene, m.icon, PAD + 6, y + 8, 12);
      if (ic) c.add(ic);
      // 핀이 꽂힌 줄은 오른쪽 끝에 핀 표시 자리(14px)를 비워 둔다
      const reserve = isPinnedAt(m, opts.pinnedAt) ? 14 : 0;
      const t = text(PAD + 16, m.label ?? '', 12, '#eef7ff', true, MAX_W - (PAD + 16) - PAD - reserve);
      w = Math.max(w, PAD + 16 + t.width + PAD + reserve);
      let rowH = Math.max(14, t.height);
      // 오른쪽에 종류(가게 종류·직업)를 흐린 글씨로 — 이름과 같은 줄, 넘치면 다음 줄.
      //  의뢰가 있으면 의뢰 상태, 문 닫은 가게면 「영업 종료」류가 종류 대신 선다(지금 갈 수 있는지가 먼저다).
      const hs = hoursOf(m);
      const kind = m.status ? STATUS_STYLE[m.status].text : hs && hs.tone === 'closed' ? hs.text.split(' · ')[0] : m.sub;
      const kindColor = m.status ? STATUS_STYLE[m.status].color : hs && hs.tone === 'closed' ? HOURS_COLOR.closed : '#8fb2c8';
      if (kind) {
        const kx = PAD + 16 + t.width + 6;
        const k = scene.add.text(kx, y + 1, kind, {
          fontFamily: FONT, fontSize: '10px', color: kindColor,
        });
        if (kx + k.width + PAD + reserve > MAX_W) {
          // 같은 줄에 안 들어가면 이름 아래 줄로 — 그래도 길면(긴 직업 설명) 말줄임
          k.setPosition(PAD + 16, y + rowH);
          clampTextWidth(k, MAX_W - PAD - (PAD + 16) - reserve);
          rowH += k.height;
        }
        c.add(k);
        w = Math.max(w, k.x + k.width + PAD + reserve);
      }
      if (reserve > 0) {
        // 줄 오른쪽 끝 — 카드 폭은 다 그린 뒤 정해지므로 x는 아래 정렬 단계에서 잡는다
        const pic = pinGlyph(scene, 1);
        pic.setPosition(0, rowY0 + 15).setData('pinRight', true);
        c.add(pic);
      }
      y += rowH + 3;
      picks.push({ m, y0: rowY0, y1: y - 1 });
    }
    if (items.length > LIST_MAX) { const t = text(PAD + 16, `외 ${items.length - LIST_MAX}곳`, 10, '#7fa6c0'); y += t.height + 2; }
  }

  let divY = -1;
  const pinnedHead = items.length === 1 && head.shape !== 'pin' && isPinnedAt(head, opts.pinnedAt);
  if ((from && head) || pinnedHead) {
    y += 3;
    divY = y - 2;
    if (from && head) {
      const t = text(PAD, distanceLine(from, head.wx, head.wy), 10, '#8fb2c8');
      if (pinnedHead) {
        // 같은 줄 오른쪽에 「핀을 꽂은 곳」(청록 — 필드 핀 화살표와 같은 색)
        const p = scene.add.text(0, y, '핀을 꽂은 곳', { fontFamily: FONT, fontSize: '10px', color: '#5cd0ff', fontStyle: 'bold' });
        c.add(p);
        w = Math.max(w, t.width + p.width + PAD * 2 + 40);
        p.setData('alignRight', true);
        const pg = pinGlyph(scene, 0.9);
        pg.setPosition(0, y + 11).setData('pinBefore', p);
        c.add(pg);
      }
      y += t.height;
    } else {
      const p = text(PAD, '핀을 꽂은 곳', 10, '#5cd0ff', true);
      y += p.height;
    }
  }
  y += PAD;
  w = Math.min(MAX_W, Math.ceil(w));
  for (const o of c.list) {
    const t = o as Phaser.GameObjects.Text;
    if (t.getData?.('alignRight')) t.setX(w - PAD - t.width);
    if (t.getData?.('pinRight')) t.setX(w - PAD - 6);
  }
  // 「핀을 꽂은 곳」 글자 바로 왼쪽에 핀 모양
  for (const o of c.list) {
    const g = o as Phaser.GameObjects.Graphics;
    const before = g.getData?.('pinBefore') as Phaser.GameObjects.Text | undefined;
    if (before) g.setX(before.x - 8);
  }
  bg.fillStyle(0x0a1628, 0.95);
  bg.fillRoundedRect(0, 0, w, y, 5);
  bg.lineStyle(1, pinnedHead ? 0x5cd0ff : 0x4a8ac0, 1);
  bg.strokeRoundedRect(0, 0, w, y, 5);
  if (divY >= 0) {
    bg.lineStyle(1, 0x2a5a8a, 0.8);
    bg.lineBetween(PAD, divY, w - PAD, divY);
  }

  // 누르면 핀 — 카드(한 곳) 또는 목록의 줄. 손 커서 + 올리면 밝게. 안내 문구는 없다(R11 — 체험 가이드·도움말이 알린다)
  if (opts.onPick) {
    const onPick = opts.onPick;
    for (const pk of picks) {
      const y1 = pk.y1 < 0 ? y : pk.y1;
      const glow = scene.add.graphics();
      glow.fillStyle(0x5cd0ff, 0.12);
      glow.fillRoundedRect(2, pk.y0 + 2, w - 4, Math.max(8, y1 - pk.y0 - 4), 4);
      glow.setVisible(false);
      const z = scene.add.rectangle(w / 2, (pk.y0 + y1) / 2, w, Math.max(10, y1 - pk.y0), 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      z.on('pointerover', () => glow.setVisible(true));
      z.on('pointerout', () => glow.setVisible(false));
      // 입력 처리 도중 카드를 다시 만들면(핀 상태가 바뀌어 서명이 바뀐다) 누른 오브젝트가 사라진다 — 다음 갱신으로 미룬다
      z.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) return;
        scene.events.once('postupdate', () => onPick(pk.m));
      });
      c.addAt(glow, 1);
      c.add(z);
    }
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
