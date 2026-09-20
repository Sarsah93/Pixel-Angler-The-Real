/**
 * @file NuisanceField.ts
 * @description 과증식 해양생물 필드 배치·표류·수거 (138차)
 *
 * 사용자 지시(2026-09-16)의 세 요구를 그대로 구현한다.
 *  1. **타일 위에 대놓고 얹지 않는다** — 잠긴 부분은 바다색으로 눌러 반투명(`NuisanceArt`).
 *     해파리는 수면 위아래로 걸쳐 빙산의 일각처럼 보인다.
 *  2. **해파리는 해안선에서 6칸 이상 떨어진 바다에만** 뜨고, 5분에 한 칸씩 표류한다.
 *  3. **수거는 씬 전환 없이** — 착수 지점에서 플레이어까지 라인을 걸고 훌치기처럼 끌어온다.
 *     발 앞 한 칸에 닿으면 액션이 끝나고 인벤토리(식품)에 1개 들어온다.
 *
 * 불가사리는 바닥 생물이라 표류하지 않는다. 물속 개체는 훌치기로, 해안에 밀려온 개체는
 * [F] 채집으로 줍는다(사용자 지시 — 해파리와 다른 경로).
 *
 * ## 145차 — 공용 시드
 * 배치는 원래도 맵 해시라 모두 같았지만, **표류가 씬 시계(`scene.time.now`)** 기준이라
 * 먼저 들어와 있던 사람과 방금 들어온 사람의 해파리 위치가 달랐다.
 * 이제 표류는 **벽시계**를 따른다 — 배치 기준 시각(`epochMs`)부터 지금까지의 걸음을
 * 스폰 때 되감아 재생하므로, 언제 접속하든 같은 자리에서 시작한다.
 * 배치 시드에는 세션 시드가 섞여 세션마다 다른 대발생이 된다.
 */
import Phaser from 'phaser';
import {
  MARINE_NUISANCES, nuisanceBloomWeight, renderNuisanceArt, rollNuisance,
  type MarineNuisance,
} from '@tra/core';
import { canvasContextOf, destroyCanvasTexture, refreshCanvasTexture } from './CanvasTextureGuard.js';

export interface NuisanceDeps {
  /** 타일 픽셀 크기 */
  tile: number;
  cols: number;
  rows: number;
  /** 타일 지형 — 'water'면 바다 */
  isWater(c: number, r: number): boolean;
  /** 해당 물 타일의 육지로부터의 거리(타일). 육지는 0 */
  waterDist(c: number, r: number): number;
  playerPos(): { x: number; y: number };
  /** 좌클릭 유지 = 릴링 */
  reeling(): boolean;
  log(msg: string): void;
  hint(msg: string): void;
  /** 수거 성공 — false면 인벤토리 공간 부족 */
  collect(nu: MarineNuisance, sizeCm: number, weightKg: number): boolean;
  month(): number;
}

interface Entity {
  nu: MarineNuisance;
  sizeCm: number;
  weightKg: number;
  /** 월드 좌표 (표류·견인으로 연속 이동) */
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  /** 다음 표류 시각(ms) */
  /** 다음 표류 시각 (벽시계 ms — 145차: 씬 시계에서 교체) */
  nextMove: number;
  /** 표류 방향 */
  dx: number;
  dy: number;
  /** 해안에 밀려온 개체 = [F] 채집 대상 */
  washedUp: boolean;
}

/** 필드 동시 출현 상한 — 너무 많으면 바다가 지저분해진다 */
const MAX_ENTITIES = 26;
/** 훌치기 사정권 (타일) — 착수점이 이 안이면 걸린다 */
const HOOK_TILES = 1.8;
/** 발 앞 도달 판정 (타일) */
const LAND_TILES = 1.0;

export class NuisanceField {
  private entities: Entity[] = [];
  private line?: Phaser.GameObjects.Graphics;
  private snag?: Entity;
  private snagSlack = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly deps: NuisanceDeps) {
    this.ensureTextures();
  }

  // ── 텍스처 (core 래스터 → 캔버스 · 정수 x2) ──────────
  private ensureTextures(): void {
    for (const key of ['moon_jelly', 'nomura_jelly', 'blue_bat_star', 'blue_bat_star_dry', 'amur_star', 'amur_star_dry']) {
      const texKey = `nui_${key}`;
      if (this.scene.textures.exists(texKey)) continue;
      const art = renderNuisanceArt(key);
      if (!art) continue;
      const s = 2;
      const cv = this.scene.textures.createCanvas(texKey, art.w * s, art.h * s);
      if (!cv) continue;
      const ctx = canvasContextOf(cv);
      if (!ctx) { destroyCanvasTexture(cv); continue; }
      try {
        const img = ctx.createImageData(art.w, art.h);
        img.data.set(art.data);
        const tmp = document.createElement('canvas');
        tmp.width = art.w; tmp.height = art.h;
        const tctx = tmp.getContext('2d');
        if (!tctx) { destroyCanvasTexture(cv); continue; }
        tctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, art.w, art.h, 0, 0, art.w * s, art.h * s);
      } catch {
        destroyCanvasTexture(cv);
        continue;
      }
      if (!refreshCanvasTexture(cv, `해양생물 ${texKey}`)) destroyCanvasTexture(cv);
    }
  }

  private texOf(nu: MarineNuisance, washedUp: boolean): string {
    if (nu.kind === 'jellyfish') return `nui_${nu.id}`;
    return `nui_${nu.id}${washedUp ? '_dry' : ''}`;
  }

  // ── 배치 ────────────────────────────────────────────
  /**
   * 이 달에 나오는 종을 가중 추첨해 필드에 흩뿌린다.
   * `epochMs` = 이 배치가 시작된 벽시계 시각 — 지금까지의 표류를 되감아 재생한다(145차).
   */
  spawn(seed = Date.now(), epochMs = Date.now()): void {
    this.clear();
    const month = this.deps.month();
    const pool = MARINE_NUISANCES
      .map((nu) => ({ nu, w: nuisanceBloomWeight(nu, month) }))
      .filter((e) => e.w > 0);
    if (!pool.length) return;

    const total = pool.reduce((s, e) => s + e.w, 0);
    let rnd = seed >>> 0;
    const next = (): number => {
      rnd = (Math.imul(rnd, 1664525) + 1013904223) >>> 0;
      return rnd / 4294967296;
    };

    const count = Math.min(MAX_ENTITIES, 10 + Math.round(next() * 12));
    let tries = 0;
    while (this.entities.length < count && tries < count * 60) {
      tries++;
      // 종 추첨
      let pick = next() * total;
      let nu = pool[0].nu;
      for (const e of pool) { pick -= e.w; if (pick <= 0) { nu = e.nu; break; } }

      const c = Math.floor(next() * this.deps.cols);
      const r = Math.floor(next() * this.deps.rows);
      const spot = this.validSpot(nu, c, r);
      if (!spot) continue;
      this.add(nu, spot.c, spot.r, spot.washedUp, next, epochMs);
    }
    this.catchUpDrift(epochMs);
  }

  /**
   * 배치 시각부터 지금까지의 표류를 되감아 재생한다.
   * 걸음 수는 종별 `moveSec`로 정해지므로(해파리 5분/칸) 6시간 주기 배치에서 최대 72걸음 —
   * 비용은 무시할 수 있고, 그 대신 **접속 시점과 무관하게 같은 자리**가 보장된다.
   */
  private catchUpDrift(epochMs: number): void {
    const now = Date.now();
    for (const e of this.entities) {
      if (!e.nu.drift) continue;
      const step = e.nu.drift.moveSec * 1000;
      let t = e.nextMove;
      for (let guard = 0; t <= now && guard < 2_000; guard++) {
        this.driftOnce(e);
        t += step;
      }
      e.nextMove = t;
    }
    void epochMs;
  }

  /** 표류 한 걸음 — 현재 방향 우선, 막히면 이웃 중 조건을 만족하는 칸으로 */
  private driftOnce(e: Entity): void {
    if (!e.nu.drift) return;
    const T = this.deps.tile;
    const c = Math.floor(e.x / T), r = Math.floor(e.y / T);
    const cands: [number, number][] = [
      [Math.sign(e.dx), 0], [0, Math.sign(e.dy)], [1, 0], [-1, 0], [0, 1], [0, -1],
    ];
    for (const [dc, dr] of cands) {
      if (!dc && !dr) continue;
      const nc = c + dc, nr = r + dr;
      if (!this.deps.isWater(nc, nr)) continue;
      if (this.deps.waterDist(nc, nr) < e.nu.drift.minShoreTiles) continue;
      e.x = nc * T + T / 2; e.y = nr * T + T / 2;
      e.dx = dc; e.dy = dr;
      return;
    }
  }

  /** 종별 배치 규칙 — 해파리는 먼바다 표층, 불가사리는 바닥(+해안 밀림) */
  private validSpot(nu: MarineNuisance, c: number, r: number): { c: number; r: number; washedUp: boolean } | null {
    if (nu.drift) {
      if (!this.deps.isWater(c, r)) return null;
      if (this.deps.waterDist(c, r) < nu.drift.minShoreTiles) return null;
      return { c, r, washedUp: false };
    }
    if (nu.benthic) {
      if (this.deps.isWater(c, r)) return { c, r, washedUp: false };
      // 해안 밀림 — 물에 붙은 육지 타일
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (this.deps.isWater(c + dc, r + dr)) return { c, r, washedUp: true };
      }
      return null;
    }
    return null;
  }

  private add(
    nu: MarineNuisance, c: number, r: number, washedUp: boolean, rnd: () => number, epochMs: number,
  ): void {
    const T = this.deps.tile;
    const roll = rollNuisance(nu, rnd);
    const x = c * T + T / 2;
    const y = r * T + T / 2;
    const img = this.scene.add.image(x, y, this.texOf(nu, washedUp))
      .setDepth(nu.kind === 'jellyfish' ? 14 : 11);
    const ang = rnd() * Math.PI * 2;
    this.entities.push({
      nu, sizeCm: roll.sizeCm, weightKg: roll.weightKg, x, y, img, washedUp,
      nextMove: epochMs + (nu.drift ? nu.drift.moveSec * 1000 * rnd() : 0),
      dx: Math.cos(ang), dy: Math.sin(ang),
    });
  }

  clear(): void {
    this.cancelSnag();
    for (const e of this.entities) e.img.destroy();
    this.entities = [];
  }

  // ── 매 프레임 ───────────────────────────────────────
  update(dtMs: number): void {
    // 표류 — 5분에 한 칸(종별 moveSec). 145차부터 **벽시계** 기준이라 클라이언트끼리 같다.
    const now = Date.now();
    for (const e of this.entities) {
      if (!e.nu.drift || e === this.snag) continue;
      if (now < e.nextMove) continue;
      e.nextMove += e.nu.drift.moveSec * 1000;
      this.driftOnce(e);
    }

    // 훌치기 견인
    if (this.snag) this.stepSnag(dtMs);

    for (const e of this.entities) e.img.setPosition(e.x, e.y);
    this.drawLine();
  }

  // ── 훌치기 ──────────────────────────────────────────
  /** 착수 지점 근처에 걸리는 개체가 있으면 훌치기를 시작한다 */
  tryHook(worldX: number, worldY: number): boolean {
    const T = this.deps.tile;
    const reach = HOOK_TILES * T;
    let best: Entity | null = null;
    let bestD = Infinity;
    for (const e of this.entities) {
      if (e.washedUp) continue;                 // 밀려온 개체는 [F] 채집 대상
      const d = Phaser.Math.Distance.Between(worldX, worldY, e.x, e.y);
      if (d < reach && d < bestD) { best = e; bestD = d; }
    }
    if (!best) return false;
    this.snag = best;
    this.snagSlack = 0;
    this.deps.log(`[수거] ${best.nu.nameKo} ${best.sizeCm}cm에 걸렸습니다 — 좌클릭을 유지해 끌어오세요.`);
    this.deps.hint(`${best.nu.nameKo} — 좌클릭 유지로 끌어오기`);
    return true;
  }

  get isSnagging(): boolean { return !!this.snag; }

  cancelSnag(): void {
    this.snag = undefined;
    this.line?.clear();
  }

  private stepSnag(dtMs: number): void {
    const e = this.snag;
    if (!e) return;
    const p = this.deps.playerPos();
    const T = this.deps.tile;
    const dt = dtMs / 1000;
    const dist = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);

    if (dist <= LAND_TILES * T) { this.finishSnag(); return; }
    // 라인이 너무 길어지면 끊긴다(플레이어가 멀어진 경우)
    if (dist > 26 * T) {
      this.deps.log('[수거] 줄이 다 풀려 놓쳤습니다.');
      this.cancelSnag();
      return;
    }

    if (this.deps.reeling()) {
      this.snagSlack = 0;
      // 무게가 클수록 느리게 끌려온다 — 노무라입깃해파리(100kg+)는 한참 걸린다
      const speed = (3.2 / (1 + e.weightKg * 0.18)) * T;
      const k = Math.min(1, (speed * dt) / dist);
      e.x += (p.x - e.x) * k;
      e.y += (p.y - e.y) * k;
    } else {
      // 손을 놓으면 조금씩 되밀린다
      this.snagSlack += dt;
      if (this.snagSlack > 0.4) {
        const back = 0.45 * T * dt;
        const k = Math.min(1, back / Math.max(1, dist));
        e.x -= (p.x - e.x) * k;
        e.y -= (p.y - e.y) * k;
      }
    }
  }

  private finishSnag(): void {
    const e = this.snag;
    if (!e) return;
    this.snag = undefined;
    this.line?.clear();
    const ok = this.deps.collect(e.nu, e.sizeCm, e.weightKg);
    if (!ok) {
      this.deps.log('[수거] 인벤토리 공간이 부족합니다 — 놓쳤습니다.');
      return;
    }
    this.remove(e);
    this.deps.log(`[수거] ${e.nu.nameKo} ${e.sizeCm}cm · ${e.weightKg.toFixed(2)}kg 회수했습니다.`);
    this.deps.hint(`${e.nu.nameKo} 수거 완료`);
  }

  private remove(e: Entity): void {
    e.img.destroy();
    this.entities = this.entities.filter((x) => x !== e);
  }

  private drawLine(): void {
    if (!this.line) this.line = this.scene.add.graphics().setDepth(22);
    this.line.clear();
    if (!this.snag) return;
    const p = this.deps.playerPos();
    this.line.lineStyle(1.5, this.deps.reeling() ? 0xffe9a0 : 0xdff0ff, 0.9);
    this.line.beginPath();
    this.line.moveTo(p.x, p.y - 26);
    this.line.lineTo(this.snag.x, this.snag.y);
    this.line.strokePath();
  }

  // ── 해안 채집 ───────────────────────────────────────
  /** 플레이어 근처에 밀려온 불가사리가 있으면 줍는다 */
  gatherNear(x: number, y: number, radiusPx: number): boolean {
    for (const e of this.entities) {
      if (!e.washedUp) continue;
      if (Phaser.Math.Distance.Between(x, y, e.x, e.y) > radiusPx) continue;
      if (!this.deps.collect(e.nu, e.sizeCm, e.weightKg)) {
        this.deps.hint('인벤토리 공간이 부족합니다');
        return true;
      }
      this.remove(e);
      this.deps.log(`[채집] ${e.nu.nameKo} ${e.sizeCm}cm를 주웠습니다.`);
      return true;
    }
    return false;
  }

  /** 근처에 주울 수 있는 개체가 있는지 (E/F 힌트 표시용) */
  gatherableNear(x: number, y: number, radiusPx: number): MarineNuisance | null {
    for (const e of this.entities) {
      if (!e.washedUp) continue;
      if (Phaser.Math.Distance.Between(x, y, e.x, e.y) <= radiusPx) return e.nu;
    }
    return null;
  }

  destroy(): void {
    this.clear();
    this.line?.destroy();
    this.line = undefined;
  }
}
