/**
 * @file FieldEventManager.ts
 * @description 탑다운 필드 보일링/스쿨링 이벤트 — 발생 롤 + 오버레이 연출 + 착수 보너스
 *
 * 피딩타임 활성도(core FeedingTimeCalculator)를 발생 확률의 공통 입력으로 사용한다.
 *  - 보일링: 표층 이벤트 — 수면 파문+포말+튀는 베이트+상공 갈매기 선회. 8~20초 이동 후 소멸.
 *    공략: 중심 직격은 어군이 흩어져 페널티, 가장자리 링(R~1.6R)이 최적.
 *    히트 시 회유어(청물) 가중 + 크기 tier 상향.
 *  - 스쿨링: 구조물(방파제 기초/수중여 = 육지 인접 수역) 근처 그림자 군집.
 *    지속이 길고 위치 고정 — 정확히 스팟에 착수하면 히트율 대폭↑.
 *
 * 확률/보너스 산정은 데이터·수치(core 피딩 활성도) 기반, 렌더는 이 파일(client) 담당.
 */

import Phaser from 'phaser';

export type FieldEventKind = 'boiling' | 'schooling';

/** 착수 보너스 (FirstPersonFishingInit.fieldEvent로 전달) */
export interface FieldEventBonus {
  kind: FieldEventKind;
  biteMult: number;
  speciesBias?: Record<string, number>;
  tierBoost?: boolean;
  label: string;
}

interface FieldEventPatch {
  kind: FieldEventKind;
  x: number;
  y: number;
  radiusPx: number;
  expiresAt: number;
  driftVx: number;
  driftVy: number;
  /** 이 패치의 어종 가중 (육지 거리대별 — 연안 무리 vs 외양 청물) */
  speciesBias: Record<string, number>;
  container: Phaser.GameObjects.Container;
}

export interface FieldEventDeps {
  /** 타일 좌표가 바다인지 */
  isWaterAt(col: number, row: number): boolean;
  /** 타일 크기 (px) */
  tileSize: number;
  /** 플레이어 월드 좌표 */
  playerPos(): { x: number; y: number };
  /** HUD 이벤트 로그 (선택) */
  pushLog?(msg: string): void;
}

/** 타일 1칸 = 2m (build_region_maps 스케일) */
const TILE_M = 2;
/** 스쿨링 최소 육지 거리 (타일) — 10m: 연안 숭어 떼 정도가 하한 */
const SCHOOL_MIN_LAND_TILES = Math.ceil(10 / TILE_M);
/** 보일링 최소 육지 거리 (타일) — 20m: 중대형 청물 보일링은 먼 해양에서만 */
const BOIL_MIN_LAND_TILES = Math.ceil(20 / TILE_M);
/** 이 거리(타일) 이상이면 '외양' 거리대 — 스쿨링 어종 구성이 회유어로 바뀜 */
const OFFSHORE_LAND_TILES = 10;

/** 보일링 히트 어종 가중 — 먼 해양 청물·회유어 (오라클 id) */
const BOILING_SPECIES_BIAS: Record<string, number> = {
  spanish_mackerel: 0.45, chub_mackerel: 0.5, horse_mackerel: 0.4,
  yellowtail: 0.4, amberjack: 0.35, greater_amberjack: 0.2,
};

/** 연안 스쿨링 (육지 10~20m) — 숭어 떼·연안 소형 무리 위주 */
const SCHOOLING_COASTAL_BIAS: Record<string, number> = {
  striped_mullet: 0.5, redlip_mullet: 0.4,
  chub_mackerel: 0.35, horse_mackerel: 0.35, dark_banded_rockfish: 0.25,
};

/** 외양 스쿨링 (육지 20m+) — 회유 무리 (삼치·고등어·전갱이·꽁치) */
const SCHOOLING_OFFSHORE_BIAS: Record<string, number> = {
  chub_mackerel: 0.5, horse_mackerel: 0.45,
  spanish_mackerel: 0.35, pacific_saury: 0.3,
};

export class FieldEventManager {
  private scene: Phaser.Scene;
  private deps: FieldEventDeps;
  private patches: FieldEventPatch[] = [];
  /** 종류별 재발생 쿨다운 만료 시각 (ms) */
  private cooldownUntil: Record<FieldEventKind, number> = { boiling: 0, schooling: 0 };

  constructor(scene: Phaser.Scene, deps: FieldEventDeps) {
    this.scene = scene;
    this.deps = deps;
  }

  /** 매 프레임 — 발생 롤 + 패치 이동/소멸 */
  update(deltaMs: number, feedingActivity: number): void {
    const now = this.scene.time.now;
    const dt = deltaMs / 1000;

    // 패치 이동(보일링 회유 드리프트) + 만료 처리
    this.patches = this.patches.filter((p) => {
      if (now >= p.expiresAt) {
        this.scene.tweens.add({
          targets: p.container, alpha: 0, duration: 600,
          onComplete: () => p.container.destroy(),
        });
        this.cooldownUntil[p.kind] = now + 20_000 + Math.random() * 20_000;
        return false;
      }
      p.x += p.driftVx * dt;
      p.y += p.driftVy * dt;
      p.container.setPosition(p.x, p.y);
      return true;
    });

    // 발생 롤 — 활성도가 낮으면(저조) 거의 발생하지 않음
    const roll = (kind: FieldEventKind, ratePerSec: number): void => {
      if (now < this.cooldownUntil[kind]) return;
      if (this.patches.some((p) => p.kind === kind)) return;
      const p = ratePerSec * Math.max(0, feedingActivity - 0.5) * dt;
      if (Math.random() < p) this.spawn(kind);
    };
    roll('boiling', 0.05);
    roll('schooling', 0.035);
  }

  /** 활성 패치 존재 여부 (HUD 안내용) */
  get activeKinds(): FieldEventKind[] {
    return this.patches.map((p) => p.kind);
  }

  /**
   * 착수점 보너스 판정 — 캐스팅 착수 좌표 ↔ 패치 거리.
   *  보일링: 중심(<0.5R) 직격 = 페널티 / 가장자리 링(0.5R~1.6R) = 최대 보너스
   *  스쿨링: 정확 스팟(<1.2R) = 히트율 대폭↑ / 부근(<2R) = 소폭
   */
  getLandingBonus(x: number, y: number): FieldEventBonus | undefined {
    for (const p of this.patches) {
      const d = Math.hypot(x - p.x, y - p.y);
      if (p.kind === 'boiling') {
        if (d < p.radiusPx * 0.5) {
          return { kind: 'boiling', biteMult: 0.5, label: '보일링 중심 직격 — 어군 흩어짐' };
        }
        if (d < p.radiusPx * 1.6) {
          return {
            kind: 'boiling', biteMult: 1.8, speciesBias: p.speciesBias,
            tierBoost: true, label: '보일링 가장자리',
          };
        }
      } else {
        if (d < p.radiusPx * 1.2) {
          return { kind: 'schooling', biteMult: 1.6, speciesBias: p.speciesBias, label: '어군 스팟' };
        }
        if (d < p.radiusPx * 2) {
          return { kind: 'schooling', biteMult: 1.15, speciesBias: p.speciesBias, label: '어군 부근' };
        }
      }
    }
    return undefined;
  }

  destroy(): void {
    this.patches.forEach((p) => p.container.destroy());
    this.patches = [];
  }

  // ── 발생 ────────────────────────────────────────────
  private spawn(kind: FieldEventKind): void {
    const spot = this.findSpot(kind);
    if (!spot) return;

    const now = this.scene.time.now;
    if (kind === 'boiling') {
      const radiusPx = 34 + Math.random() * 18;
      const ang = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;   // 회유 드리프트 (px/s)
      this.patches.push({
        kind, x: spot.x, y: spot.y, radiusPx,
        expiresAt: now + 8_000 + Math.random() * 12_000,
        driftVx: Math.cos(ang) * speed, driftVy: Math.sin(ang) * speed,
        speciesBias: BOILING_SPECIES_BIAS,
        container: this.buildBoilingVisual(spot.x, spot.y, radiusPx),
      });
      this.deps.pushLog?.('[이벤트] 먼 수면에서 보일링 발생! 갈매기가 몰려듭니다 — 가장자리를 노리세요');
    } else {
      // 육지 거리대별 어종 구성: 연안(10~20m) = 숭어 떼 / 외양(20m+) = 회유 무리
      const offshore = spot.landDistTiles >= OFFSHORE_LAND_TILES;
      const radiusPx = 28 + Math.random() * 14;
      this.patches.push({
        kind, x: spot.x, y: spot.y, radiusPx,
        expiresAt: now + 30_000 + Math.random() * 45_000,
        driftVx: 0, driftVy: 0,
        speciesBias: offshore ? SCHOOLING_OFFSHORE_BIAS : SCHOOLING_COASTAL_BIAS,
        container: this.buildSchoolingVisual(spot.x, spot.y, radiusPx),
      });
      this.deps.pushLog?.(offshore
        ? '[이벤트] 외양에 회유 어군 발견 — 그림자 군집을 정확히 노리면 연속 조과!'
        : '[이벤트] 연안에 숭어 떼 어군 발견 — 그림자 군집을 정확히 노리세요');
    }
  }

  /**
   * 타일의 육지까지 최소 거리 (타일 단위, 체비쇼프 링 탐색).
   * maxR 이내에 육지가 없으면 maxR 반환.
   */
  private landDistTiles(col: number, row: number, maxR: number): number {
    for (let r = 1; r <= maxR; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (!this.deps.isWaterAt(col + dx, row + dy)) return r;
        }
      }
    }
    return maxR;
  }

  /**
   * 발생 지점 탐색 — 육지 최소 거리 규칙 (현실성):
   *  스쿨링 ≥ 10m(5타일 — 연안 숭어 떼 하한) / 보일링 ≥ 20m(10타일 — 청물은 먼 해양).
   *  얕은 내항처럼 조건을 만족하는 수역이 없으면 발생하지 않는다(의도).
   */
  private findSpot(kind: FieldEventKind): { x: number; y: number; landDistTiles: number } | null {
    const TR = this.deps.tileSize;
    const p = this.deps.playerPos();
    const pc = Math.floor(p.x / TR);
    const pr = Math.floor(p.y / TR);
    const minLand = kind === 'boiling' ? BOIL_MIN_LAND_TILES : SCHOOL_MIN_LAND_TILES;

    for (let attempt = 0; attempt < 60; attempt++) {
      const col = pc + Math.floor((Math.random() * 2 - 1) * 26);
      const row = pr + Math.floor((Math.random() * 2 - 1) * 20);
      if (!this.deps.isWaterAt(col, row)) continue;
      // 플레이어와 너무 가까우면 제외 (최소 4타일)
      if (Math.hypot(col - pc, row - pr) < 4) continue;

      const landDist = this.landDistTiles(col, row, OFFSHORE_LAND_TILES + 2);
      if (landDist < minLand) continue;

      return { x: (col + 0.5) * TR, y: (row + 0.5) * TR, landDistTiles: landDist };
    }
    return null;
  }

  // ── 연출 ────────────────────────────────────────────
  /** 보일링 — 끓는 파문 + 포말 + 튀는 베이트 + 갈매기 선회 */
  private buildBoilingVisual(x: number, y: number, r: number): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y).setDepth(34);

    // 끓는 파문 링 3겹 (반복 확장)
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(0, 0, r * 0.4, 0x000000, 0)
        .setStrokeStyle(1.6, 0xeaf6ff, 0.75);
      c.add(ring);
      this.scene.tweens.add({
        targets: ring, scale: { from: 0.4, to: 1.35 }, alpha: { from: 0.85, to: 0 },
        duration: 1400, delay: i * 460, repeat: -1, ease: 'Quad.easeOut',
      });
    }
    // 흰 포말 점 (지글거림)
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.random() * r * 0.7;
      const foam = this.scene.add.circle(Math.cos(a) * rr, Math.sin(a) * rr, 1.6 + Math.random() * 1.6, 0xf4fbff, 0.9);
      c.add(foam);
      this.scene.tweens.add({
        targets: foam, alpha: { from: 0.9, to: 0.15 }, scale: { from: 1, to: 0.5 },
        duration: 320 + Math.random() * 380, yoyo: true, repeat: -1,
      });
    }
    // 튀어오르는 베이트 (은빛 조각)
    for (let i = 0; i < 3; i++) {
      const fx = (Math.random() * 2 - 1) * r * 0.5;
      const bait = this.scene.add.triangle(fx, 0, 0, 4, 2, 0, 4, 4, 0xd8ecf8, 0.95).setVisible(false);
      c.add(bait);
      this.scene.tweens.add({
        targets: bait, y: { from: 2, to: -10 - Math.random() * 8 }, angle: 180,
        duration: 380, yoyo: true, repeat: -1, repeatDelay: 600 + Math.random() * 1200,
        onStart: () => bait.setVisible(true),
      });
    }
    // 상공 갈매기 선회 (원거리 식별 단서 — 회전 서브 컨테이너)
    const gulls = this.scene.add.container(0, -14);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const g = this.scene.add.graphics();
      g.lineStyle(1.6, 0xffffff, 0.95);
      g.beginPath();
      g.arc(-3, 0, 3.2, Math.PI * 0.15, Math.PI * 0.85);
      g.strokePath();
      g.beginPath();
      g.arc(3, 0, 3.2, Math.PI * 0.15, Math.PI * 0.85);
      g.strokePath();
      g.setPosition(Math.cos(a) * (r * 0.8), Math.sin(a) * (r * 0.4) - 6);
      gulls.add(g);
    }
    c.add(gulls);
    this.scene.tweens.add({ targets: gulls, angle: 360, duration: 5200, repeat: -1 });

    return c;
  }

  /** 스쿨링 — 수면 아래 그림자 군집 (정적, 은은한 요동) */
  private buildSchoolingVisual(x: number, y: number, r: number): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y).setDepth(33);

    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.random() * r * 0.6;
      const fish = this.scene.add.ellipse(
        Math.cos(a) * rr, Math.sin(a) * rr,
        7 + Math.random() * 5, 2.6 + Math.random() * 1.6,
        0x0a1e30, 0.32,
      ).setRotation(a + Math.PI / 2);
      c.add(fish);
      this.scene.tweens.add({
        targets: fish,
        x: fish.x + (Math.random() * 2 - 1) * 7,
        y: fish.y + (Math.random() * 2 - 1) * 7,
        duration: 1200 + Math.random() * 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
    // 군집 전체 느린 회전 + 잔물결
    this.scene.tweens.add({ targets: c, angle: 360, duration: 26_000, repeat: -1 });
    const rip = this.scene.add.circle(0, 0, r * 0.8, 0x000000, 0).setStrokeStyle(1, 0xbfe4f8, 0.25);
    c.add(rip);
    this.scene.tweens.add({
      targets: rip, scale: { from: 0.8, to: 1.15 }, alpha: { from: 0.5, to: 0.1 },
      duration: 2600, yoyo: true, repeat: -1,
    });

    return c;
  }
}
