/**
 * @file HomeCat.ts
 * @description 집 고양이 — 방을 돌아다니고, 쓰다듬고, 손질 부산물로 밥을 준다 (190차)
 *
 * 190차 사용자 지시 「고양이 — 방을 돌아다니고, 쓰다듬기와 손질 부산물로 밥 주기」.
 *  - 그림: 2px 도트 절차 그림을 자세별 텍스처로 한 번 굽는다(`cat_<pose>`) — 옆(걷기 2프레임 · 먹기) · 앞 · 뒤 · 앉기 · 잠.
 *    왼쪽은 옆 그림을 뒤집는다.
 *  - 움직임: 바닥 칸 위 BFS 길찾기(가구 칸은 못 지난다 · 러그·현관 매트는 지난다). 잠 → 기지개 → 돌아다니기 → 앉기를 돈다.
 *    배가 고프면(마지막 밥 20시간 이상) 플레이어 곁으로 와서 운다. 소파에 앉으면 정이 든 고양이는 옆으로 온다.
 *  - 상호작용은 씬이 맡는다(닿는 거리 판정 → 확장 패널 「쓰다듬기 · 밥 주기」). 이 모듈은 반응 연출과 상태만.
 *  - 상태(밥 먹은 시각 · 정)는 `HomeStore.cat` — 세이브된다.
 */

import Phaser from 'phaser';
import { IT, ROOM_W, ROOM_H, FLOOR_TOP } from '../data/HomeFurniture.js';
import { HomeStore } from '../store/HomeStore.js';

type CatPose = 'side0' | 'side1' | 'eat' | 'front' | 'back' | 'sit' | 'sleep';
type CatDir = 'down' | 'up' | 'left' | 'right';
type CatState = 'sleep' | 'sit' | 'walk' | 'eat' | 'beg';

/** 마지막 밥 이후 이만큼 지나면 배고파한다 */
export const CAT_HUNGRY_MS = 20 * 3600 * 1000;
/** 밥을 먹은 지 이만큼 안 됐으면 배불러 안 먹는다 */
export const CAT_FULL_MS = 6 * 3600 * 1000;

const DOT = 2;
const TEX_W = 16 * DOT;
const TEX_H = 12 * DOT;
const SPEED = 0.045;   // px/ms

export interface CatHost {
  ox: number;
  oy: number;
  /** 그 칸을 지날 수 없는가 (가구) */
  blocked(c: number, r: number): boolean;
  /** 잠자리 (러그 가운데 등) — 없으면 null */
  bedSpot(): { x: number; y: number } | null;
  /** 플레이어 발밑 */
  player(): { x: number; y: number };
}

/** 고양이 자세 텍스처 굽기 */
function bakeCat(scene: Phaser.Scene): void {
  if (scene.textures.exists('cat_front')) return;
  const C = { o: 0xd88a3a, l: 0xe8a452, s: 0xb0662a, b: 0xf4dcb4, e: 0x2a1a0e, p: 0xe08a8a, k: 0x6a3a18 };
  const poses: Record<CatPose, (d: (x: number, y: number, c: number) => void) => void> = {
    side0: (d) => side(d, 0),
    side1: (d) => side(d, 1),
    eat: (d) => side(d, 2),
    front: (d) => {
      for (const [x, y] of [[4, 1], [9, 1], [4, 2], [5, 2], [8, 2], [9, 2]]) d(x, y, C.o);   // 귀
      d(4, 1, C.k); d(9, 1, C.k);
      for (let y = 3; y <= 6; y++) for (let x = 4; x <= 9; x++) d(x, y, y === 3 ? C.l : C.o);   // 머리
      d(5, 4, C.e); d(8, 4, C.e); d(6, 5, C.p); d(7, 5, C.p);
      d(6, 3, C.s); d(7, 3, C.s);
      for (let y = 7; y <= 10; y++) for (let x = 3; x <= 10; x++) d(x, y, x >= 6 && x <= 7 ? C.b : C.o);   // 몸
      d(3, 8, C.s); d(10, 8, C.s);
      d(4, 11, C.b); d(5, 11, C.b); d(8, 11, C.b); d(9, 11, C.b);   // 앞발
      for (const [x, y] of [[11, 9], [12, 8], [12, 7], [13, 6]]) d(x, y, C.o);   // 꼬리
    },
    back: (d) => {
      for (const [x, y] of [[4, 1], [9, 1], [4, 2], [5, 2], [8, 2], [9, 2]]) d(x, y, C.o);
      for (let y = 3; y <= 6; y++) for (let x = 4; x <= 9; x++) d(x, y, C.o);
      d(5, 4, C.s); d(6, 5, C.s); d(7, 4, C.s); d(8, 5, C.s);
      for (let y = 7; y <= 10; y++) for (let x = 3; x <= 10; x++) d(x, y, (x + y) % 3 === 0 ? C.s : C.o);
      for (const [x, y] of [[6, 11], [7, 11], [7, 10], [8, 9]]) d(x, y, C.l);   // 꼬리 (아래로 늘어진)
    },
    sit: (d) => {
      for (const [x, y] of [[4, 0], [9, 0], [4, 1], [5, 1], [8, 1], [9, 1]]) d(x, y, C.o);
      d(4, 0, C.k); d(9, 0, C.k);
      for (let y = 2; y <= 5; y++) for (let x = 4; x <= 9; x++) d(x, y, y === 2 ? C.l : C.o);
      d(5, 3, C.e); d(8, 3, C.e); d(6, 4, C.p); d(7, 4, C.p);
      for (let y = 6; y <= 10; y++) for (let x = 4; x <= 9; x++) d(x, y, x >= 6 && x <= 7 && y < 9 ? C.b : C.o);
      d(3, 9, C.o); d(3, 10, C.o); d(10, 9, C.o); d(10, 10, C.o);
      d(5, 11, C.b); d(8, 11, C.b);
      for (let x = 2; x <= 10; x++) d(x, 11, x === 5 || x === 8 ? C.b : C.l);   // 꼬리를 앞으로 감았다
    },
    sleep: (d) => {
      for (let y = 5; y <= 10; y++) for (let x = 1; x <= 12; x++) {
        if ((y === 5 || y === 10) && (x < 3 || x > 10)) continue;
        d(x, y, y < 7 ? C.l : (x + y) % 4 === 0 ? C.s : C.o);
      }
      for (let y = 3; y <= 7; y++) for (let x = 9; x <= 13; x++) if (!(y === 3 && (x === 9 || x === 13))) d(x, y, y === 3 ? C.l : C.o);
      d(10, 2, C.o); d(13, 2, C.o);                    // 귀
      d(10, 5, C.e); d(12, 5, C.e);                    // 감은 눈 (한 줄)
      for (let x = 0; x <= 7; x++) d(x, 11, C.o);       // 몸에 두른 꼬리
    },
  };
  /** 옆모습 (오른쪽을 본다) — f: 0/1 걷기 프레임, 2 = 먹기(머리를 숙였다) */
  function side(d: (x: number, y: number, c: number) => void, f: number): void {
    const hy = f === 2 ? 3 : 0;   // 머리 내림
    for (let y = 4; y <= 8; y++) for (let x = 2; x <= 10; x++) d(x, y, y === 4 ? C.l : y === 8 ? C.b : C.o);   // 몸통
    for (const sx of [4, 6, 8]) { d(sx, 5, C.s); d(sx, 6, C.s); }
    for (let y = 1 + hy; y <= 5 + hy; y++) for (let x = 10; x <= 14; x++) if (!(y === 1 + hy && x === 14)) d(x, y, y === 1 + hy ? C.l : C.o);   // 머리
    d(11, hy, C.o); d(13, hy, C.o); d(11, hy, C.k);          // 귀
    d(13, 3 + hy, C.e); d(15, 4 + hy, C.p);                 // 눈 · 코
    d(14, 5 + hy, C.b);
    // 꼬리 — 뒤로 치켜든
    for (const [x, y] of [[1, 4], [0, 3], [0, 2], [1, 1]]) d(x, y, C.o);
    // 다리 (걷기 2프레임 교대)
    const legs = f === 1 ? [3, 5, 8, 10] : [2, 4, 9, 11];
    for (const lx of legs) { d(lx, 9, C.o); d(lx, 10, C.b); }
  }
  for (const [pose, draw] of Object.entries(poses) as [CatPose, (d: (x: number, y: number, c: number) => void) => void][]) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    draw((x, y, c) => { g.fillStyle(c, 1); g.fillRect(x * DOT, y * DOT, DOT, DOT); });
    g.generateTexture(`cat_${pose}`, TEX_W, TEX_H);
    g.destroy();
  }
}

export class HomeCat {
  private scene: Phaser.Scene;
  private host: CatHost;
  readonly image: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Ellipse;
  x = 0;
  y = 0;
  dir: CatDir = 'down';
  state: CatState = 'sleep';
  private timer = 0;
  private path: { x: number; y: number }[] = [];
  private stepAcc = 0;
  private bubble?: Phaser.GameObjects.Text;
  private bubbleAt = 0;
  private hidden = false;
  /** 다음 걷기가 끝나면 할 일 */
  private after: CatState = 'sit';

  constructor(scene: Phaser.Scene, host: CatHost) {
    this.scene = scene;
    this.host = host;
    bakeCat(scene);
    this.shadow = scene.add.ellipse(0, 0, 22, 6, 0x000000, 0.22).setDepth(18);
    this.image = scene.add.image(0, 0, 'cat_sleep').setOrigin(0.5, 1);
    // 처음 자리 — 잠자리(러그)가 있으면 거기서 자고, 없으면 아무 빈칸에 앉아 있다
    const bed = host.bedSpot();
    if (bed && Math.random() < 0.7) { this.x = bed.x; this.y = bed.y; this.state = 'sleep'; this.timer = 20000 + Math.random() * 30000; }
    else {
      const c = this.randomCell() ?? { c: 4, r: 6 };
      this.x = host.ox + (c.c + 0.5) * IT; this.y = host.oy + (c.r + 0.6) * IT;
      this.state = 'sit'; this.timer = 4000 + Math.random() * 6000;
    }
    if (this.hungry()) { this.state = 'beg'; this.timer = 0; }
    this.sync();
  }

  hungry(now = Date.now()): boolean { return now - HomeStore.cat.fedMs > CAT_HUNGRY_MS; }
  full(now = Date.now()): boolean { return now - HomeStore.cat.fedMs < CAT_FULL_MS; }

  /** 발밑 사각 (가이드 하이라이트용) */
  bounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - TEX_W / 2 - 4, this.y - TEX_H - 4, TEX_W + 8, TEX_H + 8);
  }

  setHidden(h: boolean): void {
    this.hidden = h;
    this.image.setVisible(!h);
    this.shadow.setVisible(!h);
    this.bubble?.setVisible(!h);
  }

  destroy(): void {
    this.image.destroy(); this.shadow.destroy(); this.bubble?.destroy();
  }

  // ── 반응 ─────────────────────────────────────────────

  /** 주인이 다가와 [F] — 자리에 앉아 쳐다본다 */
  attend(): void {
    this.path = [];
    if (this.state !== 'sleep') this.state = 'sit';
    this.timer = 8000;
    this.faceTo(this.host.player());
  }

  /** 쓰다듬기 — 플레이어를 보고 앉아 골골댄다 */
  petReact(): void {
    this.path = [];
    this.state = 'sit';
    this.timer = 6000;
    this.faceTo(this.host.player());
    this.hearts(3);
  }

  /** 밥 먹기 — 3초 동안 고개를 숙이고 먹는다 */
  eatReact(): void {
    this.path = [];
    this.state = 'eat';
    this.timer = 3200;
    const p = this.host.player();
    this.dir = p.x < this.x ? 'left' : 'right';
    this.hearts(1);
  }

  /** 배불러 냄새만 맡고 돌아앉는다 */
  refuseReact(): void {
    this.path = [];
    this.state = 'sit';
    this.timer = 3000;
    const p = this.host.player();
    this.dir = p.y < this.y ? 'up' : 'down';
  }

  /** 소파에 앉은 주인 곁으로 */
  comeSitNear(px: number, py: number): void {
    const target = this.nearestFreeCell(px, py);
    if (!target) return;
    this.walkTo(target.c, target.r, 'sit');
  }

  /** 가구 배치가 바뀐 뒤 — 가구 칸 위에 갇혔으면 가까운 빈칸으로 옮긴다 */
  relocateIfBlocked(): void {
    const c = Math.floor((this.x - this.host.ox) / IT), r = Math.floor((this.y - 1 - this.host.oy) / IT);
    this.path = [];
    if (!this.host.blocked(c, r) && r >= FLOOR_TOP) return;
    const n = this.nearestFreeCell(this.x, this.y);
    if (!n) return;
    this.x = this.host.ox + (n.c + 0.5) * IT; this.y = this.host.oy + (n.r + 0.6) * IT;
    this.state = 'sit'; this.timer = 3000;
    this.sync();
  }

  // ── 매 프레임 ────────────────────────────────────────

  update(delta: number): void {
    if (this.hidden) return;
    this.timer -= delta;
    if (this.state === 'walk') this.stepWalk(delta);
    else if (this.timer <= 0) this.decide();
    // 배고프면 곁에서 운다
    if (this.state === 'beg' || (this.hungry() && this.state === 'sit')) {
      const p = this.host.player();
      if (Math.hypot(p.x - this.x, p.y - this.y) < 90 && this.scene.time.now - this.bubbleAt > 7000) this.say('야옹');
    }
    this.sync();
  }

  private decide(): void {
    const p = this.host.player();
    if (this.hungry()) {
      // 주인 곁으로 — 이미 곁이면 앉아서 운다
      if (Math.hypot(p.x - this.x, p.y - this.y) > 56) {
        const t = this.nearestFreeCell(p.x, p.y);
        if (t) { this.walkTo(t.c, t.r, 'beg'); return; }
      }
      this.state = 'beg'; this.timer = 4000; this.faceTo(p);
      return;
    }
    const roll = Math.random();
    if (this.state === 'sleep') {   // 기지개 켜고 일어나 앉는다
      this.state = 'sit'; this.timer = 3000 + Math.random() * 3000;
      return;
    }
    const bed = this.host.bedSpot();
    if (bed && roll < 0.22) {
      const c = Math.floor((bed.x - this.host.ox) / IT), r = Math.floor((bed.y - 1 - this.host.oy) / IT);
      if (this.walkTo(c, r, 'sleep', bed)) return;
    }
    if (roll < 0.8) {
      const t = this.randomCell();
      if (t && this.walkTo(t.c, t.r, Math.random() < 0.25 ? 'sleep' : 'sit')) return;
    }
    this.state = 'sit'; this.timer = 5000 + Math.random() * 8000;
  }

  private stepWalk(delta: number): void {
    const next = this.path[0];
    if (!next) {
      this.state = this.after;
      this.timer = this.after === 'sleep' ? 25000 + Math.random() * 35000 : this.after === 'beg' ? 3000 : 5000 + Math.random() * 7000;
      if (this.after === 'beg' || this.after === 'sit') this.faceTo(this.host.player());
      return;
    }
    const dx = next.x - this.x, dy = next.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = SPEED * delta;
    if (d <= step) { this.x = next.x; this.y = next.y; this.path.shift(); }
    else { this.x += (dx / d) * step; this.y += (dy / d) * step; }
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    this.stepAcc += delta;
  }

  private sync(): void {
    let pose: CatPose;
    switch (this.state) {
      case 'sleep': pose = 'sleep'; break;
      case 'eat': pose = 'eat'; break;
      case 'walk':
        pose = this.dir === 'down' ? 'front' : this.dir === 'up' ? 'back' : (Math.floor(this.stepAcc / 180) % 2 ? 'side1' : 'side0');
        break;
      default:
        pose = this.dir === 'up' ? 'back' : this.dir === 'left' || this.dir === 'right' ? 'side0' : 'sit';
    }
    const flip = (pose === 'side0' || pose === 'side1' || pose === 'eat') && this.dir === 'left';
    this.image.setTexture(`cat_${pose}`).setFlipX(flip).setPosition(Math.round(this.x), Math.round(this.y) + 2).setDepth(20 + this.y * 0.001);
    this.shadow.setPosition(this.x, this.y + 1);
    if (this.bubble) this.bubble.setPosition(this.x, this.y - TEX_H - 2);
  }

  private faceTo(p: { x: number; y: number }): void {
    const dx = p.x - this.x, dy = p.y - this.y;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }

  private say(text: string): void {
    this.bubbleAt = this.scene.time.now;
    this.bubble?.destroy();
    const b = this.scene.add.text(this.x, this.y - TEX_H - 2, text, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#3a2414', fontStyle: 'bold',
      backgroundColor: '#fff4dccc', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setDepth(31);
    this.bubble = b;
    this.scene.time.delayedCall(1800, () => { if (this.bubble === b) { b.destroy(); this.bubble = undefined; } });
  }

  private hearts(n: number): void {
    for (let i = 0; i < n; i++) {
      const g = this.scene.add.graphics().setDepth(31);
      g.fillStyle(0xff7a9a, 1);
      for (const [x, y] of [[0, 0], [2, 0], [6, 0], [8, 0], [0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [2, 4], [4, 4], [6, 4], [4, 6]]) g.fillRect(x, y, 2, 2);
      g.setPosition(this.x - 5 + (i - (n - 1) / 2) * 12, this.y - TEX_H - 4);
      this.scene.tweens.add({ targets: g, y: g.y - 22, alpha: 0, delay: i * 180, duration: 1100, onComplete: () => g.destroy() });
    }
  }

  // ── 길찾기 ───────────────────────────────────────────

  private free(c: number, r: number): boolean {
    return c >= 0 && c < ROOM_W && r >= FLOOR_TOP && r < ROOM_H && !this.host.blocked(c, r);
  }

  private myCell(): { c: number; r: number } {
    return { c: Math.floor((this.x - this.host.ox) / IT), r: Math.floor((this.y - 1 - this.host.oy) / IT) };
  }

  /** 지금 칸에서 닿는 칸들 (BFS — 부모 맵) */
  private flood(): Map<string, string | null> {
    const start = this.myCell();
    const prev = new Map<string, string | null>();
    const key = (c: number, r: number): string => `${c},${r}`;
    prev.set(key(start.c, start.r), null);
    const q: [number, number][] = [[start.c, start.r]];
    while (q.length) {
      const [c, r] = q.shift()!;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nc = c + dc, nr = r + dr, k = key(nc, nr);
        if (prev.has(k) || !this.free(nc, nr)) continue;
        prev.set(k, key(c, r));
        q.push([nc, nr]);
      }
    }
    return prev;
  }

  private randomCell(): { c: number; r: number } | null {
    const cells: { c: number; r: number }[] = [];
    for (let r = FLOOR_TOP; r < ROOM_H; r++) for (let c = 0; c < ROOM_W; c++) if (this.free(c, r)) cells.push({ c, r });
    return cells.length ? cells[Math.floor(Math.random() * cells.length)]! : null;
  }

  private nearestFreeCell(px: number, py: number): { c: number; r: number } | null {
    const prev = this.flood();
    let best: { c: number; r: number } | null = null, bd = Infinity;
    for (const k of prev.keys()) {
      const [c, r] = k.split(',').map(Number) as [number, number];
      const d = Math.hypot(this.host.ox + (c + 0.5) * IT - px, this.host.oy + (r + 0.6) * IT - py);
      if (d < 20) continue;   // 주인 발밑 칸은 피한다
      if (d < bd) { bd = d; best = { c, r }; }
    }
    return best;
  }

  /** 그 칸까지 걸어간다 — 길이 없으면 false */
  private walkTo(c: number, r: number, then: CatState, exact?: { x: number; y: number }): boolean {
    const prev = this.flood();
    let k: string | null | undefined = `${c},${r}`;
    if (!prev.has(k)) return false;
    const cells: { x: number; y: number }[] = [];
    while (k) {
      const [cc, rr] = k.split(',').map(Number) as [number, number];
      cells.unshift({ x: this.host.ox + (cc + 0.5) * IT, y: this.host.oy + (rr + 0.6) * IT });
      k = prev.get(k);
    }
    cells.shift();   // 지금 칸
    if (exact) cells.push(exact);
    if (!cells.length) { this.state = then; this.timer = 4000; return true; }
    this.path = cells;
    this.after = then;
    this.state = 'walk';
    return true;
  }
}
