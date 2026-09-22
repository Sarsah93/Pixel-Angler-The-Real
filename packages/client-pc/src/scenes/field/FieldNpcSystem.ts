/**
 * @file FieldNpcSystem.ts
 * @description 탑다운 필드 NPC 자율 행동 (166차)
 *
 * 두 가지를 한 파일이 맡는다.
 *  1. **일반 NPC(`AmbientNpcSystem`)** — 퀘스트가 없는 마을 사람. 맵마다 결정적 시드로 인물을 만들어
 *     보도·맨땅·잔디 위에 흩어 놓고, 집 자리(spawn) 반경 안에서 스스로 걸어 다닌다.
 *     구 gem NPC 프롭(할아버지·경찰관·관광객 정지 그림)을 대체한다 — 모두 `characterOf`가 굽는 새 캐릭터 체계다.
 *  2. **스토리 NPC 행동(`StoryNpcActor`)** — 발주 인물은 앵커 3x3 안에서만 움직인다.
 *     행동은 데이터(`StoryNpcBehavior`)가 정한다: 낚시(캐스팅 → 기다림 → 회수 반복 — 탑다운 찌·원줄·그림자) /
 *     좌판(제자리에서 가끔 한 칸) / 순찰(3x3 둘레) / 배회(둘러보며 돌아다님).
 *
 * 설계 결정
 *  - **물리 바디 없음** — 스토리 NPC도 그림자만 있었다(134차). 플레이어는 사람을 통과한다(끼임 방지).
 *  - **이동은 타일 단위 4방향** — 목표 칸까지 가로 → 세로 순서로 한 칸씩 가며, 막힌 칸이 나오면 거기서 멈춘다.
 *    청크 지형은 `isWalkable`이 정답이라 경로 탐색 없이도 벽·바다를 뚫지 않는다.
 *  - **낚시 NPC는 '바쁨'이 없다** — 낚시 중에도 [F] 대화가 된다(사용자 지시). 다만 캐스팅·대기 중엔 몸을 돌리지 않는다.
 *  - **컷씬 중엔 손을 뗀다** — `StoryCinematicPanel`이 배우 이미지를 직접 움직이므로 그동안은 이미지 좌표를 따라 읽기만 한다.
 *  - 이름표·마커·[F] 판정·가이드 화살표는 전부 씬의 `n.x/n.y`를 읽으므로 씬이 매 프레임 `x/y`를 되받아 동기화한다.
 */
import Phaser from 'phaser';
import { CHAR_SCALE, characterOf, type CharConfig, type CharDir, type CharRole, type RegionTerrain } from '@tra/core';
import { CharacterSprite, dirFromVelocity } from '../../ui/CharacterSprite.js';

/** 씬이 넘겨주는 지형 접근자 — 시스템은 씬 내부를 모른다 */
export interface NpcFieldHost {
  cols: number;
  rows: number;
  /** 타일 픽셀 크기 */
  tr: number;
  terrainAt(c: number, r: number): RegionTerrain | undefined;
  isWalkable(c: number, r: number): boolean;
}

/** y-sort 깊이 — 씬의 캐릭터 규약(`20 + y*0.001 + 0.0006`)과 동일 */
export function actorDepth(feetY: number): number { return 20 + feetY * 0.001 + 0.0006; }

/** 결정적 난수 (mulberry32) — 같은 맵이면 같은 사람들이 같은 자리에 선다 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

const DIRS: CharDir[] = ['down', 'left', 'right', 'up'];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// ═══════════════════════════════════════════════════════════════
// 걷는 사람 — 타일 단위 4방향 이동 + 걷기 애니메이션
// ═══════════════════════════════════════════════════════════════

export class NpcWalker {
  readonly spr: CharacterSprite;
  /** 발 위치(월드 px) — 타일 중앙 x · 타일 하단 y (스토리 NPC 배치 규약과 동일) */
  x: number;
  y: number;
  dir: CharDir = 'down';
  /** 걷기 속도 px/s (플레이어 210의 1/3 안팎 — 마을 사람은 서두르지 않는다) */
  speed = 64;
  private path: { x: number; y: number }[] = [];
  private moving = false;
  /** 걸을 수 있어도 서지 않을 칸(예: 차도) — 없으면 `isWalkable`만 본다 */
  canStand?: (c: number, r: number) => boolean;

  constructor(scene: Phaser.Scene, private readonly host: NpcFieldHost, cfg: CharConfig, col: number, row: number) {
    this.x = col * host.tr + host.tr / 2;
    this.y = row * host.tr + host.tr;
    this.spr = new CharacterSprite(scene, this.x, this.y, cfg, CHAR_SCALE);
    this.spr.image.setDepth(actorDepth(this.y));
    this.apply();
  }

  get image(): Phaser.GameObjects.Image { return this.spr.image; }
  get col(): number { return Math.floor(this.x / this.host.tr); }
  get row(): number { return Math.floor((this.y - 1) / this.host.tr); }
  get isMoving(): boolean { return this.moving; }

  /** 이미지 좌표를 걸음 상태로 되읽는다 (컷씬이 이미지를 옮긴 뒤) */
  syncFromImage(): void {
    this.x = this.spr.image.x;
    this.y = this.spr.image.y - this.spr.footPad;
    this.path = [];
    this.moving = false;
    this.spr.update(0, false);
  }

  /** 167차 — 컷씬 중: 좌표만 되읽고 걷기 프레임은 컷씬이 시키는 대로 돌린다 */
  syncFromImageWalking(dtMs: number, walking: boolean): void {
    this.x = this.spr.image.x;
    this.y = this.spr.image.y - this.spr.footPad;
    this.path = [];
    this.moving = false;
    this.spr.image.setDepth(actorDepth(this.y));
    this.spr.update(dtMs, walking);
  }

  face(dir: CharDir): void {
    this.dir = dir;
    this.spr.setDir(dir);
  }

  faceToward(px: number, py: number): void {
    this.face(dirFromVelocity(px - this.x, py - this.y, this.dir));
  }

  /**
   * 목표 칸으로 걷는다 — 가로 먼저, 세로 다음. 막힌 칸이 나오면 그 앞까지만.
   * 반환 = 실제로 걸을 칸이 하나라도 있는가.
   */
  walkToTile(tc: number, tr: number): boolean {
    const path: { x: number; y: number }[] = [];
    let c = this.col, r = this.row;
    const push = (nc: number, nr: number): boolean => {
      if (!this.host.isWalkable(nc, nr) || (this.canStand && !this.canStand(nc, nr))) return false;
      c = nc; r = nr;
      path.push({ x: c * this.host.tr + this.host.tr / 2, y: r * this.host.tr + this.host.tr });
      return true;
    };
    while (c !== tc) if (!push(c + Math.sign(tc - c), r)) break;
    if (c === tc) while (r !== tr) if (!push(c, r + Math.sign(tr - r))) break;
    this.path = path;
    return path.length > 0;
  }

  stop(): void {
    this.path = [];
    if (this.moving) { this.moving = false; this.spr.update(0, false); }
  }

  /** 1프레임 진행 — 반환 = 이번 프레임에 목적지에 도착했는가 */
  step(dtMs: number): boolean {
    if (!this.path.length) {
      if (this.moving) { this.moving = false; this.spr.update(0, false); }
      return false;
    }
    const t = this.path[0];
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy);
    const stepLen = this.speed * dtMs / 1000;
    this.dir = dirFromVelocity(dx, dy, this.dir);
    this.spr.setDir(this.dir);
    if (dist <= stepLen) {
      this.x = t.x; this.y = t.y;
      this.path.shift();
    } else {
      this.x += dx / dist * stepLen;
      this.y += dy / dist * stepLen;
    }
    this.moving = true;
    this.spr.update(dtMs, true);
    this.apply();
    if (!this.path.length) { this.moving = false; this.spr.update(0, false); return true; }
    return false;
  }

  private apply(): void {
    this.spr.image.setPosition(this.x, this.y + this.spr.footPad).setDepth(actorDepth(this.y));
  }

  destroy(): void { this.spr.destroy(); }
}

// ═══════════════════════════════════════════════════════════════
// 일반 NPC — 결정적 배치 + 자율 배회
// ═══════════════════════════════════════════════════════════════

/** 마을 사람 역할 풀 — 상인·관리는 POI 앞 정적 NPC가 맡으므로 여기선 뺀다 */
const AMBIENT_ROLES: CharRole[] = ['office', 'student', 'worker', 'camper', 'collector', 'writer', 'musician', 'angler', 'expert', 'keeper', 'crew'];
/** 사람이 서도 어색하지 않은 지면 — 차도('road')는 교통이 쓰고, 바다·건물은 못 선다 */
const AMBIENT_GROUND: ReadonlySet<RegionTerrain> = new Set<RegionTerrain>(['sidewalk', 'land', 'grass', 'pier', 'sand']);

interface AmbientNpc {
  walker: NpcWalker;
  homeC: number;
  homeR: number;
  /** 배회 반경(타일) */
  radius: number;
  state: 'idle' | 'walk';
  timer: number;
}

export class AmbientNpcSystem {
  private npcs: AmbientNpc[] = [];
  /** 이 거리(px) 밖의 사람은 얼린다 — 화면에 없는 사람에게 프레임을 쓰지 않는다 */
  private static readonly ACTIVE_RADIUS = 1100;
  /** 사람 사이 최소 간격(타일) */
  private static readonly MIN_GAP = 4;
  /** 이 거리(타일) 안에 건물이 있어야 '마을'이다 — 먼 산·빈 초지에 사람을 세우지 않는다 */
  private static readonly TOWN_RADIUS = 6;

  constructor(private readonly scene: Phaser.Scene, private readonly host: NpcFieldHost) {}

  get count(): number { return this.npcs.length; }

  /**
   * @param seedKey 지역·맵 키 — 같은 키면 같은 사람이 같은 자리에
   * @param avoid   피해야 할 앵커(스토리 NPC 등, 타일 좌표)
   * @param maxCount 상한 (후보 밀도가 낮으면 그보다 적게 선다)
   */
  spawn(seedKey: string, avoid: { c: number; r: number }[], maxCount = 120): void {
    const rand = seededRandom(hashStr(`ambient:${seedKey}`));
    const placed: { c: number; r: number }[] = [...avoid];
    const gap = AmbientNpcSystem.MIN_GAP;
    const tries = Math.min(20000, this.host.cols * this.host.rows);
    for (let i = 0; i < tries && this.npcs.length < maxCount; i++) {
      const c = 2 + Math.floor(rand() * (this.host.cols - 4));
      const r = 2 + Math.floor(rand() * (this.host.rows - 4));
      const t = this.host.terrainAt(c, r);
      if (!t || !AMBIENT_GROUND.has(t) || !this.host.isWalkable(c, r)) continue;
      // 3x3이 전부 걸을 수 있어야 한다 — 벽 틈·부두 끝에 낀 사람을 만들지 않는다
      let open = true;
      for (let dr = -1; dr <= 1 && open; dr++) for (let dc = -1; dc <= 1; dc++) if (!this.host.isWalkable(c + dc, r + dr)) { open = false; break; }
      if (!open) continue;
      if (!this.nearBuilding(c, r)) continue;
      if (placed.some((p) => Math.abs(p.c - c) < gap && Math.abs(p.r - r) < gap)) continue;
      const idx = this.npcs.length;
      const role = AMBIENT_ROLES[Math.floor(rand() * AMBIENT_ROLES.length)];
      const cfg = characterOf(`amb_${seedKey}_${idx}`, { role });
      const walker = new NpcWalker(this.scene, this.host, cfg, c, r);
      walker.speed = 52 + Math.floor(rand() * 30);
      // 마을 사람은 차도로 내려서지 않는다 (교통은 보행자를 모른다)
      walker.canStand = (cc, rr) => this.host.terrainAt(cc, rr) !== 'road';
      walker.face(DIRS[Math.floor(rand() * 4)]);
      this.npcs.push({ walker, homeC: c, homeR: r, radius: 3 + Math.floor(rand() * 4), state: 'idle', timer: 800 + rand() * 4000 });
      placed.push({ c, r });
    }
  }

  private nearBuilding(c: number, r: number): boolean {
    const R = AmbientNpcSystem.TOWN_RADIUS;
    for (let dr = -R; dr <= R; dr++) for (let dc = -R; dc <= R; dc++) if (this.host.terrainAt(c + dc, r + dr) === 'building') return true;
    return false;
  }

  update(dtMs: number, camX: number, camY: number): void {
    const dt = Math.min(dtMs, 100);
    const R2 = AmbientNpcSystem.ACTIVE_RADIUS ** 2;
    for (const n of this.npcs) {
      const w = n.walker;
      if ((w.x - camX) ** 2 + (w.y - camY) ** 2 > R2) continue;
      if (n.state === 'walk') {
        if (w.step(dt) || !w.isMoving) { n.state = 'idle'; n.timer = rnd(1500, 5500); }
        continue;
      }
      n.timer -= dt;
      if (n.timer > 0) continue;
      // 가끔은 그 자리에서 고개만 돌린다
      if (Math.random() < 0.3) { w.face(DIRS[Math.floor(Math.random() * 4)]); n.timer = rnd(1200, 3500); continue; }
      const tc = n.homeC + Math.round(rnd(-n.radius, n.radius));
      const tr = n.homeR + Math.round(rnd(-n.radius, n.radius));
      if (w.walkToTile(tc, tr)) n.state = 'walk';
      else n.timer = rnd(1000, 3000);
    }
  }

  destroy(): void {
    for (const n of this.npcs) n.walker.destroy();
    this.npcs = [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 스토리 NPC 행동
// ═══════════════════════════════════════════════════════════════

/**
 * 발주 인물의 자유 행동 종류.
 *  - `fishing` — 앵커 3x3 안의 물가 칸에서 캐스팅 → 기다림 → 회수를 반복한다. **낚시와 관계있는 인물에게만** 준다.
 *  - `stall`   — 좌판 앞. 제자리에 서 있다가 가끔 옆 칸에 다녀온다.
 *  - `patrol`  — 3x3 둘레를 천천히 돌며 멈춰 서서 둘러본다.
 *  - `wander`  — 3x3 안을 오가며 둘러본다(뭔가를 찾는 사람·구경하는 사람).
 */
export type StoryNpcBehavior = 'fishing' | 'stall' | 'patrol' | 'wander';

type FishState = 'toSpot' | 'cast' | 'wait' | 'retrieve' | 'rest';

export interface StoryNpcUpdateCtx {
  /** 컷씬 재생 중 — 이미지는 컷씬이 움직이므로 손대지 않는다 */
  paused: boolean;
  /** 플레이어가 [F] 거리 안 — 걷기를 멈추고 (낚시 대기 중이 아니면) 플레이어를 본다 */
  hold: boolean;
  playerX: number;
  playerY: number;
}

export class StoryNpcActor {
  readonly walker: NpcWalker;
  private state: 'idle' | 'walk' = 'idle';
  private timer = 0;
  private patrolIdx = 0;
  /** 낚시 */
  private fish: FishState = 'rest';
  private fishSpot: { c: number; r: number; dir: CharDir } | null = null;
  private fishTarget = { x: 0, y: 0 };
  private fishT = 0;
  private fishDur = 0;
  private bobber?: Phaser.GameObjects.Arc;
  private shadow?: Phaser.GameObjects.Ellipse;
  private lineG?: Phaser.GameObjects.Graphics;
  private biteAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly host: NpcFieldHost,
    cfg: CharConfig,
    readonly anchorC: number,
    readonly anchorR: number,
    public behavior: StoryNpcBehavior,
    facing: CharDir = 'down',
  ) {
    this.walker = new NpcWalker(scene, host, cfg, anchorC, anchorR);
    this.walker.speed = 58;
    this.walker.face(facing);
    this.timer = rnd(1000, 3000);
    if (behavior === 'fishing') {
      this.fishSpot = this.findFishingSpot();
      // 물가가 3x3(→ 5x5) 안에 없으면 낚시를 흉내 내지 않는다 — 배회로 내린다
      if (!this.fishSpot) this.behavior = 'wander';
    }
  }

  get x(): number { return this.walker.x; }
  get y(): number { return this.walker.y; }
  get image(): Phaser.GameObjects.Image { return this.walker.image; }
  /** 낚시 대기·캐스팅 중인가 (대화는 되지만 몸을 돌리지 않는다) */
  get isFishing(): boolean { return this.behavior === 'fishing' && (this.fish === 'cast' || this.fish === 'wait'); }
  get fishingSpotFound(): boolean { return !!this.fishSpot; }

  face(dir: CharDir): void { this.walker.face(dir); }
  /** 167차 — 컷씬이 이 인물을 걷게 하는 동안 true(걷기 프레임 재생) */
  cineWalking = false;

  /** 3x3(없으면 5x5) 안에서 4방 이웃에 바다가 닿는 걸을 수 있는 칸 — 가장 앵커에 가까운 것 */
  private findFishingSpot(): { c: number; r: number; dir: CharDir } | null {
    const nb: [number, number, CharDir][] = [[0, 1, 'down'], [1, 0, 'right'], [-1, 0, 'left'], [0, -1, 'up']];
    for (const radius of [1, 2]) {
      let best: { c: number; r: number; dir: CharDir; d: number } | null = null;
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const c = this.anchorC + dc, r = this.anchorR + dr;
          if (!this.host.isWalkable(c, r)) continue;
          for (const [nc, nr, dir] of nb) {
            if (this.host.terrainAt(c + nc, r + nr) !== 'water') continue;
            // 그 방향으로 2칸 이상 물이 이어져야 찌를 던질 자리가 된다
            if (this.host.terrainAt(c + nc * 2, r + nr * 2) !== 'water') continue;
            const d = Math.abs(dc) + Math.abs(dr);
            if (!best || d < best.d) best = { c, r, dir, d };
          }
        }
      }
      if (best) return { c: best.c, r: best.r, dir: best.dir };
    }
    return null;
  }

  update(dtMs: number, ctx: StoryNpcUpdateCtx): void {
    const dt = Math.min(dtMs, 100);
    if (ctx.paused) {
      this.walker.syncFromImageWalking(dt, this.cineWalking);
      this.clearFishing();
      return;
    }
    this.cineWalking = false;
    if (this.behavior === 'fishing') { this.updateFishing(dt, ctx); return; }
    if (ctx.hold) {
      this.walker.stop();
      this.state = 'idle';
      this.walker.faceToward(ctx.playerX, ctx.playerY);
      this.timer = Math.max(this.timer, 1200);
      return;
    }
    if (this.state === 'walk') {
      if (this.walker.step(dt) || !this.walker.isMoving) {
        this.state = 'idle';
        this.timer = this.behavior === 'stall' ? rnd(6000, 15000) : rnd(2000, 6000);
        if (this.behavior === 'stall') this.walker.face('down');
      }
      return;
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    switch (this.behavior) {
      case 'stall': {
        // 좌판을 떠나지 않는다 — 옆 칸에 다녀오거나 고개를 돌리는 게 전부
        if (this.walker.col !== this.anchorC || this.walker.row !== this.anchorR) { this.go(this.anchorC, this.anchorR); return; }
        if (Math.random() < 0.6) { this.walker.face(Math.random() < 0.5 ? 'left' : 'right'); this.timer = rnd(1500, 3000); return; }
        this.go(this.anchorC + (Math.random() < 0.5 ? -1 : 1), this.anchorR);
        return;
      }
      case 'patrol': {
        const ring: [number, number][] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
        if (Math.random() < 0.35) { this.walker.face(DIRS[Math.floor(Math.random() * 4)]); this.timer = rnd(1500, 3500); return; }
        this.patrolIdx = (this.patrolIdx + 1) % ring.length;
        const [dc, dr] = ring[this.patrolIdx];
        this.go(this.anchorC + dc, this.anchorR + dr);
        return;
      }
      case 'wander':
      default: {
        if (Math.random() < 0.4) { this.walker.face(DIRS[Math.floor(Math.random() * 4)]); this.timer = rnd(1000, 3000); return; }
        this.go(this.anchorC + Math.round(rnd(-1, 1)), this.anchorR + Math.round(rnd(-1, 1)));
        return;
      }
    }
  }

  private go(c: number, r: number): void {
    if (this.walker.walkToTile(c, r)) this.state = 'walk';
    else this.timer = rnd(1000, 2500);
  }

  // ── 낚시 루프 — 플레이어의 탑다운 캐스팅 그림(찌 r4 빨강·그림자 타원·흰 원줄)과 같은 문법 ──

  private updateFishing(dt: number, ctx: StoryNpcUpdateCtx): void {
    const spot = this.fishSpot!;
    switch (this.fish) {
      case 'rest': {
        if (ctx.hold) { this.walker.stop(); this.walker.faceToward(ctx.playerX, ctx.playerY); return; }
        if (this.state === 'walk') {
          if (this.walker.step(dt) || !this.walker.isMoving) { this.state = 'idle'; this.timer = rnd(1500, 4000); }
          return;
        }
        this.timer -= dt;
        if (this.timer > 0) return;
        // 쉬는 동안 한 번쯤 3x3 안을 오간다
        if (Math.random() < 0.35 && (this.walker.col !== spot.c || this.walker.row !== spot.r || Math.random() < 0.5)) {
          this.go(this.anchorC + Math.round(rnd(-1, 1)), this.anchorR + Math.round(rnd(-1, 1)));
          return;
        }
        this.fish = 'toSpot';
        return;
      }
      case 'toSpot': {
        if (ctx.hold && !this.walker.isMoving) { this.walker.faceToward(ctx.playerX, ctx.playerY); return; }
        if (this.walker.col === spot.c && this.walker.row === spot.r && !this.walker.isMoving) {
          this.walker.face(spot.dir);
          this.beginCast();
          return;
        }
        if (!this.walker.isMoving && !this.walker.walkToTile(spot.c, spot.r)) { this.fish = 'rest'; this.timer = rnd(2000, 4000); return; }
        this.walker.step(dt);
        return;
      }
      case 'cast': {
        this.fishT += dt;
        const p = Math.min(1, this.fishT / this.fishDur);
        const sx = this.walker.x, sy = this.walker.y - 22;
        const gx = sx + (this.fishTarget.x - sx) * p, gy = this.walker.y + (this.fishTarget.y - this.walker.y) * p;
        const z = 44 * 4 * p * (1 - p);
        this.shadow?.setPosition(gx, gy).setScale(Math.max(0.4, 1 - z / 260));
        this.bobber?.setPosition(gx, gy - z - (1 - p) * 6);
        this.drawLine(sx, sy);
        if (p >= 1) {
          this.fish = 'wait';
          this.fishT = 0;
          this.fishDur = rnd(7000, 22000);
          this.biteAt = Math.random() < 0.5 ? rnd(2000, this.fishDur - 1500) : -1;
          this.bobber?.setPosition(gx, gy - 6);
        }
        return;
      }
      case 'wait': {
        this.fishT += dt;
        const { x, y } = this.fishTarget;
        // 찌는 물결에 흔들리고, 입질이 오면 한 번 잠긴다
        let dip = Math.sin(this.fishT / 380) * 1.2;
        if (this.biteAt > 0 && this.fishT > this.biteAt && this.fishT < this.biteAt + 700) dip += 4 * Math.sin((this.fishT - this.biteAt) / 700 * Math.PI);
        this.bobber?.setPosition(x, y - 6 + dip);
        this.drawLine(this.walker.x, this.walker.y - 22);
        if (this.fishT >= this.fishDur) { this.fish = 'retrieve'; this.fishT = 0; this.fishDur = 520; }
        return;
      }
      case 'retrieve': {
        this.fishT += dt;
        const p = Math.min(1, this.fishT / this.fishDur);
        const { x, y } = this.fishTarget;
        const gx = x + (this.walker.x - x) * p, gy = y + (this.walker.y - y) * p;
        this.shadow?.setPosition(gx, gy).setAlpha(1 - p);
        this.bobber?.setPosition(gx, gy - 6).setAlpha(1 - p);
        this.drawLine(this.walker.x, this.walker.y - 22, 1 - p);
        if (p >= 1) { this.clearFishing(); this.fish = 'rest'; this.state = 'idle'; this.timer = rnd(2500, 7000); }
        return;
      }
    }
  }

  private beginCast(): void {
    const spot = this.fishSpot!;
    const dc = spot.dir === 'right' ? 1 : spot.dir === 'left' ? -1 : 0;
    const dr = spot.dir === 'down' ? 1 : spot.dir === 'up' ? -1 : 0;
    // 물이 이어지는 만큼(최대 6칸) 중 2칸 이상 떨어진 곳에 찌를 떨군다
    let maxK = 0;
    for (let k = 1; k <= 6; k++) { if (this.host.terrainAt(spot.c + dc * k, spot.r + dr * k) !== 'water') break; maxK = k; }
    const k = Math.max(2, Math.min(maxK, 2 + Math.floor(Math.random() * Math.max(1, maxK - 1))));
    const tr = this.host.tr;
    const side = (Math.random() - 0.5) * tr * 0.8;
    this.fishTarget = {
      x: (spot.c + dc * k) * tr + tr / 2 + (dc === 0 ? side : 0),
      y: (spot.r + dr * k) * tr + tr / 2 + (dr === 0 ? side : 0),
    };
    this.clearFishing();
    const sx = this.walker.x, sy = this.walker.y;
    this.shadow = this.scene.add.ellipse(sx, sy, 10, 5, 0x000000, 0.3).setDepth(21);
    this.bobber = this.scene.add.circle(sx, sy - 28, 4, 0xff5252).setStrokeStyle(1, 0xffffff).setDepth(23);
    this.lineG = this.scene.add.graphics().setDepth(22);
    this.fish = 'cast';
    this.fishT = 0;
    this.fishDur = 700 + k * 90;
  }

  private drawLine(fromX: number, fromY: number, alpha = 0.85): void {
    if (!this.lineG || !this.bobber) return;
    this.lineG.clear();
    this.lineG.lineStyle(1.2, 0xf0f0f0, alpha);
    this.lineG.lineBetween(fromX, fromY, this.bobber.x, this.bobber.y);
  }

  private clearFishing(): void {
    this.bobber?.destroy(); this.bobber = undefined;
    this.shadow?.destroy(); this.shadow = undefined;
    this.lineG?.destroy(); this.lineG = undefined;
    if (this.fish === 'cast' || this.fish === 'wait' || this.fish === 'retrieve') this.fish = 'rest';
  }

  destroy(): void {
    this.clearFishing();
    this.walker.destroy();
  }
}
