/**
 * @file SeamlessChunks.ts
 * @description OSM 심리스 단일 맵 — 청크 스트리밍 베이킹 + 근접 충돌 관리자 (OSM_TILEMAP_SPEC §6·§11)
 *
 * 대형 심리스 맵(속초 1179×642 = 약 76만 타일)은 전맵 1장 텍스처 베이킹이 불가능하다.
 * 대신:
 *  1. 맵을 CHUNK_TILES(64)² 타일 청크 격자로 나눈다.
 *  2. 카메라(플레이어) 중심 3×3 청크만 상주 — RenderTexture LRU 풀(12장)에서 재사용.
 *  3. 시각 베이킹은 **프레임당 1청크**로 분할(스파이크 방지). 충돌 바디는 상주 즉시 생성.
 *  4. 청크 로드/언로드 훅으로 부속 오브젝트(POI 마커 등)의 수명을 동기화한다.
 *
 * §11 L1(오토타일 스킨)·L3(프롭)의 **절차 구현**(101차 — mock_styled 목표):
 *  잔디/맨땅/모래 질감 스페클 · 차도(r) 차선 점선·연석 · 보도(w) 신축이음 ·
 *  방파제(b) 계선벽 캡·이음새·계선주 · 해안 포말 · 파도 대시 · 배 · 젖은 모래 띠 ·
 *  건물 = 컴포넌트 단위 박공/industrial 지붕 + 그림자 · 나무 = 청크 수명 스프라이트(y-sort).
 *  전부 결정적 해시(시드+타일좌표) — 재베이킹해도 같은 그림.
 */

import Phaser from 'phaser';

export interface SeamlessChunksConfig {
  /** 지형 문자 그리드 — [row] 문자열 (seamless.json terrain) */
  terrainRows: string[];
  cols: number;
  rows: number;
  /** 타일 렌더 크기(px) — RegionFieldScene TR과 동일해야 좌표계가 일치한다 */
  tr: number;
  /** 청크 한 변 타일 수 (기본 64 — TR 20px 기준 1280px RenderTexture) */
  chunkTiles?: number;
  /** RenderTexture 풀 크기 (기본 12 — 상주 3×3 = 9 + 여유) */
  poolSize?: number;
  /** 지형 시드 (결정적 배치) */
  seed: number;
  /** 청크 상주 시작 훅 (POI 마커 생성 등) */
  onChunkLoad?: (chunkCol: number, chunkRow: number) => void;
  /** 청크 상주 해제 훅 (부속 오브젝트 파괴) */
  onChunkUnload?: (chunkCol: number, chunkRow: number) => void;
}

interface ChunkSlot {
  rt: Phaser.GameObjects.RenderTexture;
  baked: boolean;
  /** 이 청크의 충돌 바디(투명 사각형) 목록 — 언로드 시 파괴 */
  bodies: Phaser.GameObjects.Rectangle[];
  /** 이 청크의 프롭 스프라이트(나무 등 — y-sort) */
  deco: Phaser.GameObjects.GameObject[];
}

/** 지형 팔레트 (101차 — mock_styled 톤) */
const COL = {
  land: 0xcbb98d, landAlt: 0xc4b287, landSpeck: 0xb2a077,
  grass: 0x69a24c, grassAlt: 0x639a47, grassDark: 0x578b3e, grassLight: 0x7fb35f,
  sand: 0xe8d9a0, sandAlt: 0xe2d298, sandSpeck: 0xcdbd85, sandWet: 0xc9b986,
  road: 0x4c4f54, roadAlt: 0x484b50, roadLine: 0xe8ecf0,
  walk: 0xb3b8bf, walkAlt: 0xaeb3ba, walkJoint: 0x999fa7, curb: 0xd2d6dc,
  pier: 0x9aa5b0, pierAlt: 0x94a0ab, pierJoint: 0x7d8894, pierEdge: 0x5a6773,
  bollard: 0x3a4450, bollardTop: 0x55616e,
  buildEdge: 0x3a3f47, shadow: 0x101820,
  foam: 0xe8f4fa, wave: 0x9cc4dd, waveDeep: 0x1c3c5c,
  boatHull: 0x2e4a66, boatDeck: 0xe8eef2,
};

/** 수심 그라데이션 (거리 램프) — legacy DEPTH_RAMP 계승 */
const DEPTH_RAMP: [number, number][] = [
  [0x74add0, 0x6da6c9],
  [0x5e9cc4, 0x5794bd],
  [0x4a86b0, 0x437ea8],
  [0x3a6f99, 0x356890],
  [0x2c5a82, 0x275378],
  [0x224a6e, 0x1e4366],
];
const bucketOf = (d: number): number =>
  d <= 2 ? 0 : d <= 6 ? 1 : d <= 12 ? 2 : d <= 20 ? 3 : d <= 30 ? 4 : 5;

/** 지붕 팔레트 (컴포넌트 해시로 배정) — [밝은 사면, 어두운 사면, 용마루, 외벽] */
const ROOFS: [number, number, number, number][] = [
  [0xc25a4b, 0x9c4237, 0xd97c6b, 0x8a5a48],   // 붉은 기와
  [0xcf8a45, 0xa96b30, 0xe0a468, 0x8a6848],   // 주황
  [0x7a8698, 0x5f6b7d, 0x93a0b2, 0x5c6470],   // 슬레이트
  [0x5f8d7d, 0x4a7263, 0x7aa694, 0x567262],   // 청록
  [0x8a6f4d, 0x6d5639, 0xa08862, 0x6a5540],   // 갈색
];
/** 대형(industrial) 지붕 — 패널 + 이음 */
const ROOF_BIG: [number, number, number] = [0x64788c, 0x596c80, 0x4a5b6d];

/** 결정적 해시 (0~1) */
function hash2(seed: number, x: number, y: number): number {
  let n = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** 결정적 2D 값 노이즈 (암초 배치 — legacy 동일식) */
function noise2(seed: number, x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(seed, ix, iy) * (1 - sx) + hash2(seed, ix + 1, iy) * sx;
  const b = hash2(seed, ix, iy + 1) * (1 - sx) + hash2(seed, ix + 1, iy + 1) * sx;
  return a * (1 - sy) + b * sy;
}

interface BuildingComp {
  c0: number; r0: number; c1: number; r1: number;
  palIdx: number;
  /** 대형(창고·터미널급) — 패널 지붕 */
  big: boolean;
}

export class SeamlessChunks {
  private scene: Phaser.Scene;
  private cfg: Required<Pick<SeamlessChunksConfig, 'chunkTiles' | 'poolSize'>> & SeamlessChunksConfig;
  private chunkCols: number;
  private chunkRows: number;
  private chunkPx: number;

  private resident = new Map<number, ChunkSlot>();
  private rtPool: Phaser.GameObjects.RenderTexture[] = [];
  private rtCreated = 0;
  private bakeQueue: number[] = [];

  /** 충돌 그룹 — 씬이 playerBody와 collider를 1회 등록한다 */
  readonly walls: Phaser.Physics.Arcade.StaticGroup;

  /** 바다 타일의 육지 거리 (수심 그라데이션) — 전맵 1회 BFS */
  private waterDist: Uint16Array;
  /** 건물 타일 → 컴포넌트 id (-1 = 비건물) — 지붕 렌더의 기준 */
  private compOf: Int32Array;
  private comps: BuildingComp[] = [];

  constructor(scene: Phaser.Scene, cfg: SeamlessChunksConfig) {
    this.scene = scene;
    this.cfg = { chunkTiles: 64, poolSize: 12, ...cfg };
    this.chunkPx = this.cfg.chunkTiles * cfg.tr;
    this.chunkCols = Math.ceil(cfg.cols / this.cfg.chunkTiles);
    this.chunkRows = Math.ceil(cfg.rows / this.cfg.chunkTiles);
    this.walls = scene.physics.add.staticGroup();
    this.waterDist = this.computeWaterDistance();
    this.compOf = new Int32Array(cfg.cols * cfg.rows).fill(-1);
    this.labelBuildings();
    this.ensureDecoTextures();
  }

  private tileAt(c: number, r: number): string {
    if (c < 0 || c >= this.cfg.cols || r < 0 || r >= this.cfg.rows) return '~';
    return this.cfg.terrainRows[r][c] ?? '.';
  }

  /** 이동 불가(충돌) 타일 — 바다·건물 */
  private isBlockedChar(ch: string): boolean {
    return ch === '~' || ch === '#';
  }

  /** 멀티소스 BFS — 비바다 타일에서 바다로 거리 전파 */
  private computeWaterDistance(): Uint16Array {
    const { cols, rows } = this.cfg;
    const dist = new Uint16Array(cols * rows).fill(0xffff);
    const qx = new Int32Array(cols * rows);
    const qy = new Int32Array(cols * rows);
    let tail = 0;
    for (let r = 0; r < rows; r++) {
      const line = this.cfg.terrainRows[r];
      for (let c = 0; c < cols; c++) {
        if (line[c] !== '~') { dist[r * cols + c] = 0; qx[tail] = c; qy[tail] = r; tail++; }
      }
    }
    let head = 0;
    while (head < tail) {
      const c = qx[head], r = qy[head]; head++;
      const d = dist[r * cols + c];
      if (c + 1 < cols && dist[r * cols + c + 1] === 0xffff) { dist[r * cols + c + 1] = d + 1; qx[tail] = c + 1; qy[tail] = r; tail++; }
      if (c - 1 >= 0 && dist[r * cols + c - 1] === 0xffff) { dist[r * cols + c - 1] = d + 1; qx[tail] = c - 1; qy[tail] = r; tail++; }
      if (r + 1 < rows && dist[(r + 1) * cols + c] === 0xffff) { dist[(r + 1) * cols + c] = d + 1; qx[tail] = c; qy[tail] = r + 1; tail++; }
      if (r - 1 >= 0 && dist[(r - 1) * cols + c] === 0xffff) { dist[(r - 1) * cols + c] = d + 1; qx[tail] = c; qy[tail] = r - 1; tail++; }
    }
    return dist;
  }

  /** 건물(#) 연결요소 라벨링 — 컴포넌트 bbox·지붕 팔레트 배정 (전맵 1회) */
  private labelBuildings(): void {
    const { cols, rows } = this.cfg;
    const qx = new Int32Array(cols * rows);
    const qy = new Int32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      const line = this.cfg.terrainRows[r];
      for (let c = 0; c < cols; c++) {
        if (line[c] !== '#' || this.compOf[r * cols + c] !== -1) continue;
        const id = this.comps.length;
        let head = 0, tail = 0, n = 0;
        let c0 = c, c1 = c, r0 = r, r1 = r;
        qx[tail] = c; qy[tail] = r; tail++;
        this.compOf[r * cols + c] = id;
        while (head < tail) {
          const x = qx[head], y = qy[head]; head++;
          n++;
          if (x < c0) c0 = x; if (x > c1) c1 = x;
          if (y < r0) r0 = y; if (y > r1) r1 = y;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
            const k = ny * cols + nx;
            if (this.compOf[k] === -1 && this.cfg.terrainRows[ny][nx] === '#') {
              this.compOf[k] = id; qx[tail] = nx; qy[tail] = ny; tail++;
            }
          }
        }
        this.comps.push({
          c0, r0, c1, r1,
          palIdx: Math.floor(hash2(this.cfg.seed ^ 0xb17d, c0, r0) * ROOFS.length) % ROOFS.length,
          big: n >= 120,   // 5m/타일 기준 ≥ 3,000㎡ — 창고·터미널급
        });
      }
    }
  }

  /** 프롭 텍스처 1회 베이킹 — 나무 2종 (트렁크+2톤 캐노피, 발밑 그림자 포함) */
  private ensureDecoTextures(): void {
    const tex = this.scene.textures;
    for (let v = 0; v < 2; v++) {
      const key = `smx_tree_${v}`;
      if (tex.exists(key)) continue;
      const W = 40, H = 48;
      const g = this.scene.add.graphics();
      // 발밑 그림자
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(W / 2, H - 4, 26, 8);
      // 트렁크
      g.fillStyle(0x6b4a2e, 1);
      g.fillRect(W / 2 - 3, H - 16, 6, 12);
      g.fillStyle(0x54381f, 1);
      g.fillRect(W / 2 + 1, H - 16, 2, 12);
      // 캐노피 — 겹친 원 클러스터 (픽셀 스텝 느낌은 4px 오프셋 정수 배치로)
      const dark = v === 0 ? 0x3f7a33 : 0x396f3f;
      const mid = v === 0 ? 0x519441 : 0x4a8a4e;
      const light = v === 0 ? 0x6cb054 : 0x63a862;
      g.fillStyle(dark, 1);
      g.fillCircle(W / 2, 20, 15);
      g.fillCircle(W / 2 - 9, 26, 11);
      g.fillCircle(W / 2 + 9, 26, 11);
      g.fillStyle(mid, 1);
      g.fillCircle(W / 2 - 2, 18, 11);
      g.fillCircle(W / 2 + 7, 22, 8);
      g.fillStyle(light, 1);
      g.fillCircle(W / 2 - 6, 14, 6);
      g.fillCircle(W / 2 + 2, 12, 4);
      g.generateTexture(key, W, H);
      g.destroy();
    }
  }

  // ═══════════════════════════════════════════════════
  // 상주 관리 — 카메라 중심 3×3
  // ═══════════════════════════════════════════════════

  update(centerX: number, centerY: number): void {
    const cc = Phaser.Math.Clamp(Math.floor(centerX / this.chunkPx), 0, this.chunkCols - 1);
    const cr = Phaser.Math.Clamp(Math.floor(centerY / this.chunkPx), 0, this.chunkRows - 1);

    const needed = new Set<number>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nc = cc + dc, nr = cr + dr;
        if (nc >= 0 && nc < this.chunkCols && nr >= 0 && nr < this.chunkRows) {
          needed.add(nr * this.chunkCols + nc);
        }
      }
    }

    for (const [idx, slot] of [...this.resident]) {
      if (needed.has(idx)) continue;
      this.unloadChunk(idx, slot);
    }
    for (const idx of needed) {
      if (this.resident.has(idx)) continue;
      this.loadChunk(idx);
    }

    if (this.bakeQueue.length > 0) {
      const centerIdx = cr * this.chunkCols + cc;
      let pick = this.bakeQueue.indexOf(centerIdx);
      if (pick < 0) pick = 0;
      const idx = this.bakeQueue.splice(pick, 1)[0];
      const slot = this.resident.get(idx);
      if (slot && !slot.baked) this.bakeChunk(idx, slot);
    }
  }

  private loadChunk(idx: number): void {
    const cc = idx % this.chunkCols;
    const cr = Math.floor(idx / this.chunkCols);
    const rt = this.acquireRt();
    rt.setPosition(cc * this.chunkPx, cr * this.chunkPx);
    rt.setVisible(true);
    const slot: ChunkSlot = { rt, baked: false, bodies: [], deco: [] };
    this.buildChunkCollision(cc, cr, slot);
    this.buildChunkDeco(cc, cr, slot);
    this.resident.set(idx, slot);
    this.bakeQueue.push(idx);
    this.cfg.onChunkLoad?.(cc, cr);
  }

  private unloadChunk(idx: number, slot: ChunkSlot): void {
    this.resident.delete(idx);
    const qi = this.bakeQueue.indexOf(idx);
    if (qi >= 0) this.bakeQueue.splice(qi, 1);
    for (const b of slot.bodies) { this.walls.remove(b); b.destroy(); }
    for (const d of slot.deco) d.destroy();
    slot.rt.setVisible(false);
    this.rtPool.push(slot.rt);
    this.cfg.onChunkUnload?.(idx % this.chunkCols, Math.floor(idx / this.chunkCols));
  }

  private acquireRt(): Phaser.GameObjects.RenderTexture {
    const pooled = this.rtPool.pop();
    if (pooled) return pooled;
    this.rtCreated++;
    return this.scene.add.renderTexture(0, 0, this.chunkPx, this.chunkPx)
      .setOrigin(0, 0).setDepth(0);
  }

  // ═══════════════════════════════════════════════════
  // 충돌 — 청크 내부 행 병합 정적 바디
  // ═══════════════════════════════════════════════════
  private buildChunkCollision(cc: number, cr: number, slot: ChunkSlot): void {
    const N = this.cfg.chunkTiles;
    const tr = this.cfg.tr;
    const c0 = cc * N, r0 = cr * N;
    const c1 = Math.min(c0 + N, this.cfg.cols);
    const r1 = Math.min(r0 + N, this.cfg.rows);
    for (let r = r0; r < r1; r++) {
      let runStart = -1;
      for (let c = c0; c <= c1; c++) {
        const blocked = c < c1 && this.isBlockedChar(this.tileAt(c, r));
        if (blocked && runStart < 0) {
          runStart = c;
        } else if (!blocked && runStart >= 0) {
          const runLen = c - runStart;
          const rect = this.scene.add.rectangle(
            runStart * tr + (runLen * tr) / 2, r * tr + tr / 2,
            runLen * tr, tr, 0x000000, 0,
          );
          this.scene.physics.add.existing(rect, true);
          this.walls.add(rect);
          slot.bodies.push(rect);
          runStart = -1;
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 프롭 스프라이트 (L3) — 나무: 잔디 위 결정적 산포, y-sort (플레이어와 동일식)
  // ═══════════════════════════════════════════════════
  private buildChunkDeco(cc: number, cr: number, slot: ChunkSlot): void {
    const N = this.cfg.chunkTiles;
    const tr = this.cfg.tr;
    const c0 = cc * N, r0 = cr * N;
    const c1 = Math.min(c0 + N, this.cfg.cols);
    const r1 = Math.min(r0 + N, this.cfg.rows);
    const seed = this.cfg.seed ^ 0x7ee5;
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        if (this.tileAt(c, r) !== ',') continue;
        if (hash2(seed, c, r) < 0.982) continue;
        // 도로·건물·물가 바로 옆은 피한다 (간판·통행 가림 방지)
        let clear = true;
        for (let dr = -1; dr <= 1 && clear; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const t = this.tileAt(c + dc, r + dr);
            if (t === '#' || t === 'r' || t === '~') { clear = false; break; }
          }
        }
        if (!clear) continue;
        const v = hash2(seed ^ 0x11, c, r) < 0.5 ? 0 : 1;
        const x = c * tr + tr / 2;
        const y = r * tr + tr;
        const img = this.scene.add.image(x, y, `smx_tree_${v}`)
          .setOrigin(0.5, 1)
          .setDepth(20 + y * 0.001);   // 플레이어(20 + y·0.001)와 y-sort
        slot.deco.push(img);
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 시각 베이킹 (L1) — 절차 텍스처. 프레임당 1청크
  // ═══════════════════════════════════════════════════
  /** 'r' 타일의 도로 진행축·중앙선 여부 (차선 점선 렌더) */
  private roadAxis(c: number, r: number): { vertical: boolean; center: boolean } {
    const span = (dc: number, dr: number): number => {
      let d = 0;
      while (d < 8 && this.tileAt(c + dc * (d + 1), r + dr * (d + 1)) === 'r') d++;
      return d;
    };
    const dE = span(1, 0), dW = span(-1, 0), dN = span(0, -1), dS = span(0, 1);
    const vertical = (dE + dW) < (dN + dS);   // 가로 폭이 더 좁다 = 남북 방향 도로
    const center = vertical ? Math.abs(dE - dW) <= 1 : Math.abs(dN - dS) <= 1;
    return { vertical, center };
  }

  private bakeChunk(idx: number, slot: ChunkSlot): void {
    const cc = idx % this.chunkCols;
    const cr = Math.floor(idx / this.chunkCols);
    const N = this.cfg.chunkTiles;
    const tr = this.cfg.tr;
    const c0 = cc * N, r0 = cr * N;
    const c1 = Math.min(c0 + N, this.cfg.cols);
    const r1 = Math.min(r0 + N, this.cfg.rows);
    const seed = this.cfg.seed;
    const cols = this.cfg.cols;

    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const at = (c: number, r: number): string => this.tileAt(c, r);

    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        const ch = at(c, r);
        const lx = (c - c0) * tr, ly = (r - r0) * tr;
        const checker = (c + r) % 2 === 0;
        const h1 = hash2(seed, c, r);
        const h2 = hash2(seed ^ 0x5f5f, c, r);

        // ── 바다 ──
        if (ch === '~') {
          const d = this.waterDist[r * cols + c];
          let bucket = bucketOf(d);
          // 암초/여 — 5m/타일에서는 노이즈 스케일·임계를 좁혀 "패치 노이즈"가 아니라
          // 성긴 여밭으로 읽히게 한다 (101차 — 구 0.74/거리 3~26은 절반이 얼룩졌다)
          const reefNoise = noise2(seed & 0x7fffffff, c / 7, r / 7);
          const isReef = d >= 5 && d <= 18 && reefNoise > 0.82;
          if (isReef) bucket = Math.max(0, bucket - 1);
          const ramp = DEPTH_RAMP[bucket];
          // 규칙적 체커는 격자가 도드라진다 — 해시 랜덤 2톤 (부드러운 수면 잡음)
          g.fillStyle(h1 > 0.5 ? ramp[0] : ramp[1], 1);
          g.fillRect(lx, ly, tr, tr);
          if (isReef) {
            g.fillStyle(0x2e463f, 0.45);
            g.fillRect(lx + 4, ly + 7, 6, 4);
            g.fillRect(lx + 12, ly + 13, 4, 3);
          } else if (bucket >= 4 && h2 > 0.9) {
            g.fillStyle(COL.waveDeep, 0.3);
            g.fillRect(lx + 4, ly + 4, tr - 8, tr - 8);
          }
          // 파도 대시 — 얕은~중간 수심에 성긴 밝은 물결
          if (bucket <= 3 && h1 > 0.90) {
            g.fillStyle(COL.wave, 0.55);
            g.fillRect(lx + 3 + Math.floor(h2 * 6), ly + 4 + Math.floor(h1 * 10), 9, 2);
          }
          // 해안 포말 — 뭍과 맞닿은 물 타일 가장자리
          g.fillStyle(COL.foam, 0.4);
          if (at(c, r - 1) !== '~') g.fillRect(lx, ly, tr, 2);
          if (at(c, r + 1) !== '~') g.fillRect(lx, ly + tr - 2, tr, 2);
          if (at(c - 1, r) !== '~') g.fillRect(lx, ly, 2, tr);
          if (at(c + 1, r) !== '~') g.fillRect(lx + tr - 2, ly, 2, tr);
          // 배 — 깊은 바다에 아주 성기게 (결정적)
          if (bucket >= 3 && hash2(seed ^ 0xb0a7, c, r) > 0.9994) {
            g.fillStyle(COL.boatHull, 1);
            g.fillRect(lx + 3, ly + 9, 14, 5);
            g.fillRect(lx + 5, ly + 14, 10, 2);
            g.fillStyle(COL.boatDeck, 1);
            g.fillRect(lx + 6, ly + 5, 6, 4);
          }
          continue;
        }

        // ── 육상 기본색 ──
        if (ch === ',') {
          g.fillStyle(checker ? COL.grass : COL.grassAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          // 풀결 스페클 (짧은 어두운 잎 + 밝은 점)
          if (h1 > 0.35) {
            g.fillStyle(COL.grassDark, 0.8);
            g.fillRect(lx + 2 + Math.floor(h1 * 9), ly + 3 + Math.floor(h2 * 11), 3, 1);
            g.fillRect(lx + 10 - Math.floor(h2 * 6), ly + 13 - Math.floor(h1 * 7), 2, 1);
          }
          if (h2 > 0.7) {
            g.fillStyle(COL.grassLight, 0.8);
            g.fillRect(lx + 4 + Math.floor(h2 * 10), ly + 6 + Math.floor(h1 * 8), 2, 1);
          }
          // 들꽃 (성기게 — 흰/노랑)
          if (h1 > 0.965) {
            g.fillStyle(h2 > 0.5 ? 0xf2f0e4 : 0xe8cf6a, 0.95);
            g.fillRect(lx + 4 + Math.floor(h2 * 10), ly + 4 + Math.floor(h1 * 10), 2, 2);
          }
          // 맨땅 접경 디더 (딱 떨어지는 직선 금지 — §11)
          g.fillStyle(COL.land, 1);
          if (at(c + 1, r) === '.') { if (checker) g.fillRect(lx + tr - 3, ly + 4, 3, 4); g.fillRect(lx + tr - 2, ly + 12, 2, 3); }
          if (at(c - 1, r) === '.') { if (!checker) g.fillRect(lx, ly + 6, 3, 4); g.fillRect(lx, ly + 14, 2, 3); }
          if (at(c, r + 1) === '.') { if (checker) g.fillRect(lx + 5, ly + tr - 3, 4, 3); g.fillRect(lx + 13, ly + tr - 2, 3, 2); }
          if (at(c, r - 1) === '.') { if (!checker) g.fillRect(lx + 7, ly, 4, 3); g.fillRect(lx + 15, ly, 3, 2); }
        } else if (ch === '.') {
          g.fillStyle(checker ? COL.land : COL.landAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          if (h1 > 0.55) {
            g.fillStyle(COL.landSpeck, 0.7);
            g.fillRect(lx + 3 + Math.floor(h1 * 11), ly + 4 + Math.floor(h2 * 11), 2, 2);
          }
          if (h2 > 0.9) {
            g.fillStyle(0xa89670, 0.8);
            g.fillRect(lx + 5 + Math.floor(h2 * 8), ly + 9 + Math.floor(h1 * 6), 3, 2);
          }
        } else if (ch === 's') {
          g.fillStyle(checker ? COL.sand : COL.sandAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          if (h1 > 0.4) {
            g.fillStyle(COL.sandSpeck, 0.75);
            g.fillRect(lx + 3 + Math.floor(h1 * 12), ly + 3 + Math.floor(h2 * 12), 2, 1);
            g.fillRect(lx + 12 - Math.floor(h2 * 8), ly + 12 - Math.floor(h1 * 6), 1, 1);
          }
          // 젖은 모래 띠 (물과 맞닿은 쪽)
          g.fillStyle(COL.sandWet, 0.9);
          if (at(c, r - 1) === '~') g.fillRect(lx, ly, tr, 6);
          if (at(c, r + 1) === '~') g.fillRect(lx, ly + tr - 6, tr, 6);
          if (at(c - 1, r) === '~') g.fillRect(lx, ly, 6, tr);
          if (at(c + 1, r) === '~') g.fillRect(lx + tr - 6, ly, 6, tr);
        } else if (ch === 'r') {
          // ── 차도 — 아스팔트 + 차선 점선 + 연석 ──
          g.fillStyle(checker ? COL.road : COL.roadAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          if (h1 > 0.92) {   // 아스팔트 얼룩
            g.fillStyle(0x3f4247, 0.6);
            g.fillRect(lx + 4 + Math.floor(h2 * 8), ly + 5 + Math.floor(h1 * 8), 4, 3);
          }
          const ax = this.roadAxis(c, r);
          if (ax.center) {
            g.fillStyle(COL.roadLine, 0.85);
            if (ax.vertical) {
              if (r % 2 === 0) g.fillRect(lx + tr / 2 - 1, ly + 2, 3, tr - 8);
            } else if (c % 2 === 0) {
              g.fillRect(lx + 2, ly + tr / 2 - 1, tr - 8, 3);
            }
          }
          // 연석 — 보도와 맞닿은 가장자리 밝은 띠
          g.fillStyle(COL.curb, 0.9);
          if (at(c, r - 1) === 'w') g.fillRect(lx, ly, tr, 2);
          if (at(c, r + 1) === 'w') g.fillRect(lx, ly + tr - 2, tr, 2);
          if (at(c - 1, r) === 'w') g.fillRect(lx, ly, 2, tr);
          if (at(c + 1, r) === 'w') g.fillRect(lx + tr - 2, ly, 2, tr);
        } else if (ch === 'w') {
          // ── 보도 — 밝은 포장 + 신축이음 격자 ──
          g.fillStyle(checker ? COL.walk : COL.walkAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          g.fillStyle(COL.walkJoint, 0.55);
          if (c % 3 === 0) g.fillRect(lx, ly, 1, tr);
          if (r % 3 === 0) g.fillRect(lx, ly, tr, 1);
          if (h1 > 0.93) {
            g.fillStyle(0x9aa0a8, 0.6);
            g.fillRect(lx + 5 + Math.floor(h2 * 8), ly + 6 + Math.floor(h1 * 8), 3, 2);
          }
        } else if (ch === 'b') {
          // ── 방파제·부두 — 콘크리트 + 신축이음 + 계선벽 캡 + 계선주 ──
          g.fillStyle(checker ? COL.pier : COL.pierAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          g.fillStyle(COL.pierJoint, 0.6);
          if (c % 3 === 0) g.fillRect(lx, ly, 2, tr);
          if (r % 3 === 0) g.fillRect(lx, ly, tr, 2);
          g.fillStyle(COL.pierEdge, 1);
          const wN = at(c, r - 1) === '~', wS = at(c, r + 1) === '~';
          const wW = at(c - 1, r) === '~', wE = at(c + 1, r) === '~';
          if (wN) g.fillRect(lx, ly, tr, 3);
          if (wS) g.fillRect(lx, ly + tr - 3, tr, 3);
          if (wW) g.fillRect(lx, ly, 3, tr);
          if (wE) g.fillRect(lx + tr - 3, ly, 3, tr);
          // 계선주 — 물가 가장자리 4타일 간격
          if ((wN || wS || wW || wE) && (c + r) % 4 === 0) {
            const bx = lx + (wE ? tr - 7 : wW ? 3 : tr / 2 - 2);
            const by = ly + (wS ? tr - 7 : wN ? 3 : tr / 2 - 2);
            g.fillStyle(COL.bollard, 1);
            g.fillRect(bx, by, 5, 5);
            g.fillStyle(COL.bollardTop, 1);
            g.fillRect(bx + 1, by + 1, 3, 2);
          }
        } else if (ch === '#') {
          // ── 건물 — 컴포넌트 지붕 (박공 2사면 / 대형 패널) ──
          const comp = this.comps[this.compOf[r * cols + c]];
          if (comp && comp.big) {
            const [pa, pb, seam] = ROOF_BIG;
            const wide = (comp.c1 - comp.c0) >= (comp.r1 - comp.r0);
            g.fillStyle((wide ? r % 2 : c % 2) === 0 ? pa : pb, 1);
            g.fillRect(lx, ly, tr, tr);
            g.fillStyle(seam, 0.8);
            if (wide) { if ((c - comp.c0) % 3 === 0) g.fillRect(lx, ly, 2, tr); }
            else if ((r - comp.r0) % 3 === 0) g.fillRect(lx, ly, tr, 2);
            if (h1 > 0.96) {   // 채광창
              g.fillStyle(0xa8c4d8, 0.9);
              g.fillRect(lx + 6, ly + 7, 8, 6);
            }
          } else if (comp) {
            const [lightC, darkC, ridgeC] = ROOFS[comp.palIdx];
            const wide = (comp.c1 - comp.c0) >= (comp.r1 - comp.r0);
            const mid = wide ? (comp.r0 + comp.r1) / 2 : (comp.c0 + comp.c1) / 2;
            const pos = wide ? r : c;
            g.fillStyle(pos <= mid ? lightC : darkC, 1);
            g.fillRect(lx, ly, tr, tr);
            // 기와 결 (사면 방향 얇은 줄)
            g.fillStyle(pos <= mid ? darkC : lightC, 0.25);
            if (wide) g.fillRect(lx, ly + (checker ? 6 : 13), tr, 1);
            else g.fillRect(lx + (checker ? 6 : 13), ly, 1, tr);
            // 용마루
            g.fillStyle(ridgeC, 1);
            if (wide) {
              if (Math.abs(pos - mid) < 0.6) g.fillRect(lx, ly + tr / 2 - 2, tr, 4);
            } else if (Math.abs(pos - mid) < 0.6) {
              g.fillRect(lx + tr / 2 - 2, ly, 4, tr);
            }
          } else {
            g.fillStyle(0x5a5f68, 1);
            g.fillRect(lx, ly, tr, tr);
          }
          // 처마 외곽선
          g.lineStyle(2, COL.buildEdge, 1);
          if (at(c - 1, r) !== '#') g.lineBetween(lx + 1, ly, lx + 1, ly + tr);
          if (at(c + 1, r) !== '#') g.lineBetween(lx + tr - 1, ly, lx + tr - 1, ly + tr);
          if (at(c, r - 1) !== '#') g.lineBetween(lx, ly + 1, lx + tr, ly + 1);
          if (at(c, r + 1) !== '#') g.lineBetween(lx, ly + tr - 1, lx + tr, ly + tr - 1);
        }

        // ── 건물 그림자 — 남·동측 지면에 드리움 (해가 북서) ──
        if (ch !== '#' && ch !== '~') {
          const shN = at(c, r - 1) === '#';
          const shW = at(c - 1, r) === '#';
          if (shN || shW) {
            g.fillStyle(COL.shadow, 0.16);
            if (shN) g.fillRect(lx, ly, tr, 7);
            if (shW) g.fillRect(lx, ly, 7, tr);
          }
        }
      }
    }

    slot.rt.clear();
    slot.rt.draw(g, 0, 0);
    g.destroy();
    slot.baked = true;
  }

  // ═══════════════════════════════════════════════════

  /** 상주/풀 통계 (검증·dev 표기용) */
  stats(): { resident: number; pooled: number; created: number; pendingBakes: number } {
    return {
      resident: this.resident.size,
      pooled: this.rtPool.length,
      created: this.rtCreated,
      pendingBakes: this.bakeQueue.length,
    };
  }

  /** 청크 좌표 → 상주 여부 (부속 시스템용) */
  isResident(chunkCol: number, chunkRow: number): boolean {
    return this.resident.has(chunkRow * this.chunkCols + chunkCol);
  }

  /** 타일 → 청크 좌표 */
  chunkOfTile(c: number, r: number): { chunkCol: number; chunkRow: number } {
    return {
      chunkCol: Math.floor(c / this.cfg.chunkTiles),
      chunkRow: Math.floor(r / this.cfg.chunkTiles),
    };
  }

  destroy(): void {
    for (const [idx, slot] of [...this.resident]) this.unloadChunk(idx, slot);
    for (const rt of this.rtPool) rt.destroy();
    this.rtPool = [];
    this.walls.destroy(true);
  }
}
