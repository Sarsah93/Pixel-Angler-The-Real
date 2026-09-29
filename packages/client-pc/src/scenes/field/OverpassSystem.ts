/**
 * @file OverpassSystem.ts
 * @description 고가도로·대교 상판(184차) — 지면 위 두 번째 층의 렌더 · 오르내림 · 충돌 전환.
 *
 * 사용자 지시(금강대교 위성 캡처): "평지 도로가 아닌 다리 도로 — 2~3 레이어 높은 고도의 highway 같은".
 * 판정은 core `rules/Overpass.ts`가 하고, 여기서는 그 결과를 필드에 옮긴다.
 *
 *  - **렌더**: 그림자(지면, 높이만큼 아래·오른쪽으로 밀림) → 교각(상판 가장자리 ↔ 그림자) → 상판 두께(옆면)
 *    → 상판(보도·연석·아스팔트·중앙선·차선·난간) → 아치 트러스(붉은색, 금강대교). 상판은 지붕처럼
 *    지면 캐릭터 **위**에 그려지고, 밑에 선 사람이 있으면 반투명해진다(R10 — 가리면 비친다).
 *  - **층**: 플레이어는 지면 또는 상판 위다. 끝단(높이 ≈ 0)에서만 오르내리고, 상판 위에서는 난간이 막는다
 *    (횡거리 클램프). 상판 위에 있는 동안 지면 충돌(청크 벽·POI 벽·경사로 둑)을 끈다.
 *  - **경사로 둑**: 끝단 밖 ∧ 통과 높이 미만 구간은 지면 쪽에서 정적 바디로 막는다.
 *  - **도로 벡터**: 상판과 나란한 지면 도로 구간은 청크 굽기에서 뺀다(`clipRoadsUnderOverpasses`) —
 *    안 빼면 물 위에 아스팔트가 칠해진다. 차량 그래프는 원본을 그대로 쓴다(차는 상판 위를 달린다).
 */

import Phaser from 'phaser';
import {
  type RegionOverpass, type RegionRoad, type OverpassProjection,
  overpassLength, projectOnOverpass, overpassHeightAt, onOverpassBand, inOverpassEndZone,
  overpassBlocksGround, OVERPASS_END_TILES, OVERPASS_CLEARANCE,
} from '@tra/core';

/** 층당 화면 높이 (px) — 그림자·교각 길이 */
const LEVEL_PX = 14;
/** 그림자 가로 밀림 비율 (높이 px 대비) */
const SHADOW_DX = 0.4;
/**
 * ⚠ 깊이는 고정값이 아니다 — 지면 깊이가 `20 + y(px)·0.001`이라 속초 남쪽(행 300↑)에서는 이미 30을 넘는다.
 * 고정 30으로 두면 금강대교 부근(행 350~400 → 깊이 31~33)에서 **다리 밑 사람이 상판 위에 그려졌다**(실측).
 * 상판은 자기 가장 남쪽 끝(+2타일)의 지면 깊이 바로 위에 둔다 — 밑에 있는 것은 전부 가리고,
 * 그보다 남쪽 물체는 y 정렬대로 앞에 선다.
 */
function groundDepthAt(ypx: number): number { return 20 + ypx * 0.001; }
/** 난간 안쪽 여유 (타일) — 캐릭터 몸 반폭 */
const RAIL_PAD = 0.4;
/** 밑에 섰을 때 상판 알파 */
const UNDER_ALPHA = 0.38;

interface OpInfo {
  op: RegionOverpass;
  L: number;
  layers: Phaser.GameObjects.Graphics[];
  faded: boolean;
}

export class OverpassSystem {
  private readonly ops: OpInfo[];
  /** 지면 쪽 경사로 둑 */
  readonly groundWalls: Phaser.Physics.Arcade.StaticGroup;
  /** 지금 올라서 있는 상판 id (지면이면 null) */
  deckId: string | null = null;
  /** 상판 깊이 (전 고가 공통 — 가장 남쪽 끝 기준) */
  readonly deckDepth: number;

  constructor(private readonly scene: Phaser.Scene, overpasses: RegionOverpass[], private readonly tr: number) {
    this.groundWalls = scene.physics.add.staticGroup();
    let maxY = 0;
    for (const o of overpasses) for (const pt of o.pts) maxY = Math.max(maxY, pt[1] + o.halfW);
    this.deckDepth = groundDepthAt((maxY + 2) * tr);
    this.ops = overpasses.filter((o) => o.pts.length >= 2).map((op) => {
      const L = overpassLength(op);
      const info: OpInfo = { op, L, layers: [], faded: false };
      this.draw(info);
      this.buildGroundWalls(info);
      return info;
    });
  }

  get onDeck(): boolean { return this.deckId !== null; }

  /** 상판 위 캐릭터 깊이 — 상판보다 위, 같은 상판 위에서는 y 정렬 */
  riderDepth(ypx: number): number { return this.deckDepth + 0.5 + ypx * 0.00001; }

  // ── 판정 ───────────────────────────────────────────────────────────────

  /** 타일 좌표 (x, y)가 상판 위(높이 > 0.3층)인가 — 차량 깊이·충돌 층 판정용 */
  elevatedAtTile(x: number, y: number): boolean {
    for (const o of this.ops) {
      const p = projectOnOverpass(o.op, x, y);
      if (onOverpassBand(o.op, p, o.L) && overpassHeightAt(o.op, p.s, o.L) > 0.3) return true;
    }
    return false;
  }

  /**
   * 매 프레임 — 발끝 월드 좌표로 층을 갱신한다.
   * @returns changed = 층이 바뀜 · clamp = 난간에 막혀 되돌릴 발끝 좌표(월드 px)
   */
  step(feetX: number, feetY: number): { changed: boolean; clamp: { x: number; y: number } | null } {
    const tx = feetX / this.tr, ty = feetY / this.tr;
    let changed = false;
    let clamp: { x: number; y: number } | null = null;

    if (this.deckId) {
      const o = this.ops.find((q) => q.op.id === this.deckId);
      if (!o) { this.deckId = null; return { changed: true, clamp: null }; }
      const p = projectOnOverpass(o.op, tx, ty);
      const inEnd = inOverpassEndZone(o.op, p, o.L);
      if (p.s < 0 || p.s > o.L || (inEnd && Math.abs(p.d) > o.op.halfW) || Math.abs(p.d) > o.op.halfW + 3) {
        // 끝을 지나 내려왔다 (또는 순간이동 등으로 상판에서 멀리 벗어났다)
        this.deckId = null;
        changed = true;
      } else {
        const lim = o.op.halfW - RAIL_PAD;
        if (!inEnd && Math.abs(p.d) > lim) {
          // 난간 — 중심선 쪽으로 되돌린다 (좌 = (uy, −ux))
          const back = Math.sign(p.d) * (Math.abs(p.d) - lim);
          clamp = { x: (tx - p.uy * back) * this.tr, y: (ty + p.ux * back) * this.tr };
        }
      }
    } else {
      for (const o of this.ops) {
        const p = projectOnOverpass(o.op, tx, ty);
        if (onOverpassBand(o.op, p, o.L) && inOverpassEndZone(o.op, p, o.L) && p.s >= 0 && p.s <= o.L) {
          this.deckId = o.op.id;
          changed = true;
          break;
        }
      }
    }

    // 밑에 선 사람에게는 상판이 비친다
    for (const o of this.ops) {
      let under = false;
      if (this.deckId !== o.op.id) {
        const p = projectOnOverpass(o.op, tx, ty);
        // 상판 그림은 발자국 자리에 있다 — 캐릭터 머리(발끝 −1.6타일)까지 덮이는지 본다
        const pHead = projectOnOverpass(o.op, tx, ty - 1.6);
        under = (onOverpassBand(o.op, p, o.L, 0.5) && overpassHeightAt(o.op, p.s, o.L) >= OVERPASS_CLEARANCE * 0.5)
          || (onOverpassBand(o.op, pHead, o.L, 0.2) && overpassHeightAt(o.op, pHead.s, o.L) >= OVERPASS_CLEARANCE * 0.5);
      }
      if (under !== o.faded) {
        o.faded = under;
        for (const g of o.layers) {
          this.scene.tweens.killTweensOf(g);
          this.scene.tweens.add({ targets: g, alpha: under ? UNDER_ALPHA : 1, duration: 200, ease: 'Sine.easeOut' });
        }
      }
    }
    return { changed, clamp };
  }

  /** 지면 사람에게 이 월드 좌표가 경사로 둑으로 막혔는가(스폰·순간이동 보정용) */
  blocksGroundAt(worldX: number, worldY: number): boolean {
    const tx = worldX / this.tr, ty = worldY / this.tr;
    return this.ops.some((o) => overpassBlocksGround(o.op, projectOnOverpass(o.op, tx, ty), o.L));
  }

  destroy(): void {
    for (const o of this.ops) for (const g of o.layers) g.destroy();
    this.groundWalls.clear(true, true);
  }

  // ── 충돌 ───────────────────────────────────────────────────────────────

  private buildGroundWalls(o: OpInfo): void {
    const { op, L } = o;
    const tr = this.tr;
    const step = 0.75;
    for (let s = OVERPASS_END_TILES; s < L - OVERPASS_END_TILES; s += step) {
      const h = overpassHeightAt(op, s, L);
      if (h >= OVERPASS_CLEARANCE) continue;
      const a = this.pointAt(op, s), b = this.pointAt(op, Math.min(L, s + step));
      const nx = a.uy, ny = -a.ux;
      const xs = [a.x + nx * op.halfW, a.x - nx * op.halfW, b.x + nx * op.halfW, b.x - nx * op.halfW];
      const ys = [a.y + ny * op.halfW, a.y - ny * op.halfW, b.y + ny * op.halfW, b.y - ny * op.halfW];
      const x0 = Math.min(...xs) * tr, x1 = Math.max(...xs) * tr;
      const y0 = Math.min(...ys) * tr, y1 = Math.max(...ys) * tr;
      const r = this.scene.add.rectangle((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0, 0);
      this.scene.physics.add.existing(r, true);
      this.groundWalls.add(r);
    }
  }

  // ── 렌더 ───────────────────────────────────────────────────────────────

  /** 호길이 s의 중심점과 진행 방향 (타일 좌표) */
  private pointAt(op: RegionOverpass, s: number): { x: number; y: number; ux: number; uy: number } {
    let acc = 0;
    const P = op.pts;
    for (let i = 1; i < P.length; i++) {
      const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1];
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      if (acc + len >= s || i === P.length - 1) {
        const t = Math.max(0, Math.min(len, s - acc));
        return { x: P[i - 1][0] + (dx / len) * t, y: P[i - 1][1] + (dy / len) * t, ux: dx / len, uy: dy / len };
      }
      acc += len;
    }
    return { x: P[0][0], y: P[0][1], ux: 1, uy: 0 };
  }

  private draw(o: OpInfo): void {
    const { op, L } = o;
    const tr = this.tr;
    const sc = this.scene;
    const shadow = sc.add.graphics().setDepth(1.8);
    const under = sc.add.graphics().setDepth(this.deckDepth - 0.2);
    const deck = sc.add.graphics().setDepth(this.deckDepth);
    o.layers = [under, deck];

    // 샘플 — 0.5타일 간격 (곡선 매끈)
    const N = Math.max(2, Math.ceil(L / 0.5));
    const S: { x: number; y: number; nx: number; ny: number; h: number; s: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const s = (L * i) / N;
      const p = this.pointAt(op, s);
      // 이웃 샘플 방향 평균 — 꺾이는 곳에서 폭이 찢어지지 않게
      const q = this.pointAt(op, Math.min(L, s + 0.25)), r = this.pointAt(op, Math.max(0, s - 0.25));
      let ux = q.x - r.x, uy = q.y - r.y;
      const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
      S.push({ x: p.x * tr, y: p.y * tr, nx: uy, ny: -ux, h: overpassHeightAt(op, s, L), s });
    }
    const off = (k: number, lat: number) => ({ x: S[k].x + S[k].nx * lat * tr, y: S[k].y + S[k].ny * lat * tr });
    const band = (g: Phaser.GameObjects.Graphics, color: number, alpha: number, a: number, b: number,
      shift?: (k: number) => { dx: number; dy: number }) => {
      g.fillStyle(color, alpha);
      for (let k = 0; k < S.length - 1; k++) {
        const s0 = shift ? shift(k) : { dx: 0, dy: 0 }, s1 = shift ? shift(k + 1) : { dx: 0, dy: 0 };
        const p0 = off(k, a), p1 = off(k, b), p2 = off(k + 1, b), p3 = off(k + 1, a);
        g.fillPoints([
          { x: p0.x + s0.dx, y: p0.y + s0.dy }, { x: p1.x + s0.dx, y: p1.y + s0.dy },
          { x: p2.x + s1.dx, y: p2.y + s1.dy }, { x: p3.x + s1.dx, y: p3.y + s1.dy },
        ], true);
      }
    };
    const hw = op.halfW;
    const lift = (k: number) => ({ dx: S[k].h * LEVEL_PX * SHADOW_DX, dy: S[k].h * LEVEL_PX });

    // ① 그림자 — 지면에 드리운 상판
    band(shadow, 0x000000, 0.26, -hw, hw, lift);

    // ② 교각 — 5타일마다 상판 가장자리 ↔ 그림자 가장자리 (높이 1층 이상)
    for (let k = 0; k < S.length; k += 10) {
      if (S[k].h < OVERPASS_CLEARANCE) continue;
      for (const lat of [-hw * 0.6, hw * 0.6]) {
        const p = off(k, lat), d = lift(k);
        under.fillStyle(0x6c6a64, 1);
        under.fillRect(p.x - 5, p.y, 10, d.dy);
        under.fillStyle(0x4d4b46, 1);
        under.fillRect(p.x + 2, p.y, 3, d.dy);
      }
    }
    // ③ 상판 두께(옆면) — 아래로 8px 밀린 띠. 남쪽을 향한 가장자리에서만 보인다
    band(under, 0x57544d, 1, -hw, hw, (k) => ({ dx: 0, dy: Math.min(1, S[k].h) * 8 }));

    // ④ 상판 — 보도 · 연석 · 아스팔트
    band(deck, 0xb3aea3, 1, -hw, hw);
    band(deck, 0xd9d4c8, 1, hw - 0.12, hw);           // 난간 대(좌)
    band(deck, 0xd9d4c8, 1, -hw, -hw + 0.12);         // 난간 대(우)
    const road = hw - 0.55;
    band(deck, 0x8d887e, 1, -road - 0.08, road + 0.08); // 연석
    band(deck, 0x45474b, 1, -road, road);               // 아스팔트
    // 중앙선(황색 2줄)
    band(deck, 0xe0b830, 1, 0.05, 0.13);
    band(deck, 0xe0b830, 1, -0.13, -0.05);
    // 차선 점선(백색) — 편도 2차로
    deck.fillStyle(0xe8e8e8, 1);
    for (let k = 0; k + 2 < S.length; k += 4) {
      for (const lat of [road * 0.5, -road * 0.5]) {
        const p0 = off(k, lat - 0.04), p1 = off(k, lat + 0.04), p2 = off(k + 2, lat + 0.04), p3 = off(k + 2, lat - 0.04);
        deck.fillPoints([p0, p1, p2, p3], true);
      }
    }
    // 난간 기둥 점
    deck.fillStyle(0x8f8a80, 1);
    for (let k = 0; k < S.length; k += 2) {
      for (const lat of [hw - 0.06, -hw + 0.06]) { const p = off(k, lat); deck.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
    }

    // ⑤ 아치 트러스 — 금강대교 붉은 아치 (양 가장자리 띠 + X자 가새 + 가로보)
    if (op.arch) {
      const [a0, a1] = op.arch;
      const inArch = (k: number) => S[k].s >= a0 && S[k].s <= a1;
      const red = 0xd23a2a, redDk = 0x7a1f16;
      deck.fillStyle(red, 1);
      for (let k = 0; k < S.length - 1; k++) {
        if (!inArch(k) || !inArch(k + 1)) continue;
        for (const [a, b] of [[hw - 0.62, hw - 0.14], [-hw + 0.14, -hw + 0.62]]) {
          deck.fillPoints([off(k, a), off(k, b), off(k + 1, b), off(k + 1, a)], true);
        }
      }
      deck.lineStyle(3, redDk, 1);
      for (let k = 0; k < S.length - 2; k += 2) {
        if (!inArch(k) || !inArch(k + 2)) continue;
        for (const [a, b] of [[hw - 0.62, hw - 0.14], [-hw + 0.14, -hw + 0.62]]) {
          const p0 = off(k, a), p1 = off(k + 2, b), q0 = off(k, b), q1 = off(k + 2, a);
          deck.lineBetween(p0.x, p0.y, p1.x, p1.y);
          deck.lineBetween(q0.x, q0.y, q1.x, q1.y);
        }
      }
      deck.lineStyle(4, red, 1);
      for (let k = 0; k < S.length; k += 6) {
        if (!inArch(k)) continue;
        const p = off(k, hw - 0.3), q = off(k, -hw + 0.3);
        deck.lineBetween(p.x, p.y, q.x, q.y);
      }
    }
  }
}

/**
 * 상판과 나란한 지면 도로 구간을 청크 굽기용 도로 목록에서 뺀다.
 * 가로지르는 도로(밑을 지나는 길)는 남긴다 — 진행 방향이 상판과 30° 이내일 때만 뺀다.
 */
export function clipRoadsUnderOverpasses(roads: RegionRoad[], overpasses: RegionOverpass[]): RegionRoad[] {
  if (!overpasses.length) return roads;
  const infos = overpasses.map((op) => ({ op, L: overpassLength(op) }));
  const hidden = (x: number, y: number, ux: number, uy: number): boolean => infos.some(({ op, L }) => {
    const p: OverpassProjection = projectOnOverpass(op, x, y);
    if (!onOverpassBand(op, p, L, 0.5) || overpassHeightAt(op, p.s, L) <= 0.25) return false;
    return Math.abs(ux * p.ux + uy * p.uy) > 0.866;
  });
  const out: RegionRoad[] = [];
  for (const rd of roads) {
    // 0.5타일 간격으로 촘촘히 — 구간 경계를 정확히 끊는다
    const dense: { x: number; y: number; ux: number; uy: number }[] = [];
    for (let i = 1; i < rd.pts.length; i++) {
      const [ax, ay] = rd.pts[i - 1], [bx, by] = rd.pts[i];
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 1e-6) continue;
      const ux = (bx - ax) / len, uy = (by - ay) / len;
      const n = Math.max(1, Math.ceil(len / 0.5));
      for (let k = i === 1 ? 0 : 1; k <= n; k++) dense.push({ x: ax + (bx - ax) * (k / n), y: ay + (by - ay) * (k / n), ux, uy });
    }
    if (!dense.some((p) => hidden(p.x, p.y, p.ux, p.uy))) { out.push(rd); continue; }
    let run: [number, number][] = [];
    for (const p of dense) {
      if (hidden(p.x, p.y, p.ux, p.uy)) {
        if (run.length >= 2) out.push({ ...rd, pts: run });
        run = [];
      } else run.push([p.x, p.y]);
    }
    if (run.length >= 2) out.push({ ...rd, pts: run });
  }
  return out;
}
