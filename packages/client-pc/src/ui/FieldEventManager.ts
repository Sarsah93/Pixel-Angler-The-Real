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
 *
 * ## 145차 — 공용 시드 (사용자 지시 "같은 서버 세션 내 공용 시드로 바꾸자")
 * 구 구현은 **매 프레임 `Math.random()` + 플레이어 기준 위치**라, 같은 세션의 두 사람이
 * 각자 다른 보일링을 봤다(시드만 맞춰도 위치가 플레이어를 따라다니면 소용이 없다).
 *
 * 이제 이벤트는 **맵 격자 칸 × 시간 슬롯의 성질**이다 —
 * `(세션 시드, 맵, 종류, 칸, 슬롯)`을 해시해 발생 여부·자리·수명·표류를 통째로 정한다.
 * 플레이어는 자기 주변 3x3 칸만 계산해 그리므로, **같은 자리에 있으면 같은 것이 보이고**
 * 멀리 떨어져 있으면 각자 자기 주변 것을 본다(이벤트는 원래 세계 어디에나 있다).
 *
 * ⚠ **퀘스트 게이트 규칙**: 보일링·스쿨링은 피딩 활성도(계절·물때·날씨)만 보고 퀘스트 진행도를
 * 보지 않는다. 그래서 공용 시드를 써도 안전하다. 진행도가 조건에 끼어드는 무작위는
 * `MpSharedRngKind`에 넣지 말 것 — core `types/Multiplayer.ts`의 그 주석이 정본이다.
 */

import Phaser from 'phaser';
import { mpRng, mpTimeSlot, mpWorldSeed } from '@tra/core';

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
  /** `종류:칸:슬롯` — 스케줄이 낳은 이벤트의 고유 이름 (145차) */
  key: string;
  kind: FieldEventKind;
  /** 발생 자리 (표류 전 원점) */
  x0: number;
  y0: number;
  startMs: number;
  endMs: number;
  x: number;
  y: number;
  radiusPx: number;
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
  /** 이 맵의 식별자 (`지역:맵`) — 시드 유도에 들어간다 (145차) */
  mapKey: string;
  /** 세션 공용 시드 (싱글이면 0) (145차) */
  worldSeed(): number;
  /**
   * 그 시각의 피딩 활성도. **"지금"이 아니라 슬롯 시작 시각으로 물어본다** —
   * 중간에 들어온 사람도 같은 값을 얻어야 같은 이벤트를 본다 (145차).
   */
  feedingAt(atMs: number): number;
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

/** 스케줄이 낳은 이벤트 한 건 — 화면에 올리기 전의 순수한 값 (145차) */
interface ScheduledEvent {
  key: string;
  kind: FieldEventKind;
  x: number;
  y: number;
  radiusPx: number;
  startMs: number;
  endMs: number;
  driftVx: number;
  driftVy: number;
  offshore: boolean;
  speciesBias: Record<string, number>;
}

/** 스케줄 격자 한 칸의 크기 (타일) — 3x3 = 72x72타일이 구 플레이어 기준 창(+-26)과 비슷하다 */
const CELL_TILES = 24;
/** 한 슬롯 길이 (ms) — 이 주기마다 칸마다 한 번씩 굴린다 */
const SLOT_MS = 45_000;
/** 칸·슬롯당 발생 확률 (피딩 1.0 기준) — 3x3 칸 평균 동시 존재 ~0.3개가 되도록 맞춘 값 */
const CELL_RATE: Record<FieldEventKind, number> = { boiling: 0.10, schooling: 0.05 };

export class FieldEventManager {
  private scene: Phaser.Scene;
  private deps: FieldEventDeps;
  private patches: FieldEventPatch[] = [];
  /** 스케줄 계산 캐시 — `종류:칸:슬롯` → 이벤트(없으면 null). 같은 칸·슬롯을 다시 굴리지 않는다 */
  private schedule = new Map<string, ScheduledEvent | null>();
  /** 마지막으로 스케줄을 훑은 시각 */
  private scanAt = 0;
  /** 로그를 한 번만 띄우기 위한 기록 */
  private announced = new Set<string>();

  constructor(scene: Phaser.Scene, deps: FieldEventDeps) {
    this.scene = scene;
    this.deps = deps;
  }

  /**
   * 매 프레임 — 스케줄 조회 + 패치 이동/소멸 (145차 재작성).
   * `feedingActivity`는 더 이상 발생 롤에 직접 쓰지 않는다(프레임마다 값이 달라
   * 클라이언트끼리 갈린다) — 스케줄이 `deps.feedingAt(슬롯 시작)`으로 스스로 묻는다.
   */
  update(_deltaMs: number, _feedingActivity: number): void {
    const nowMs = Date.now();

    // 스케줄 훑기 — 1초에 한 번이면 충분하다(슬롯은 45초)
    if (nowMs - this.scanAt > 1_000) {
      this.scanAt = nowMs;
      this.syncFromSchedule(nowMs);
    }

    // 표류·만료 — 표류도 시각의 함수라 어느 클라이언트에서 보든 같은 자리다
    this.patches = this.patches.filter((p) => {
      if (nowMs >= p.endMs) {
        this.scene.tweens.add({
          targets: p.container, alpha: 0, duration: 600,
          onComplete: () => p.container.destroy(),
        });
        return false;
      }
      const t = (nowMs - p.startMs) / 1000;
      p.x = p.x0 + p.driftVx * t;
      p.y = p.y0 + p.driftVy * t;
      p.container.setPosition(p.x, p.y);
      return true;
    });
  }

  /** 지금 살아 있어야 할 이벤트와 화면에 있는 것을 맞춘다 */
  private syncFromSchedule(nowMs: number): void {
    const TR = this.deps.tileSize;
    const p = this.deps.playerPos();
    const cx = Math.floor(p.x / TR / CELL_TILES);
    const cy = Math.floor(p.y / TR / CELL_TILES);
    const slot = mpTimeSlot(nowMs, SLOT_MS);

    const want = new Map<string, ScheduledEvent>();
    for (const kind of ['boiling', 'schooling'] as FieldEventKind[]) {
      // 직전 슬롯 것도 본다 — 수명이 슬롯을 넘어갈 수 있다
      for (let sl = slot - 1; sl <= slot; sl++) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const ev = this.scheduledEvent(kind, cx + dx, cy + dy, sl);
            if (ev && nowMs >= ev.startMs && nowMs < ev.endMs) want.set(ev.key, ev);
          }
        }
      }
    }

    // 사라진 것 정리
    for (const patch of this.patches) {
      if (want.has(patch.key)) { want.delete(patch.key); continue; }
    }
    // 새로 생긴 것 만들기
    for (const ev of want.values()) {
      if (this.patches.some((q) => q.key === ev.key)) continue;
      this.materialize(ev);
    }
  }

  /**
   * `(종류, 칸, 슬롯)` → 이벤트. **같은 세션이면 누가 계산해도 같은 답**이다.
   * 서버에 묻지 않는다 — 시드 하나만 공유하면 나머지는 순수 함수다.
   */
  private scheduledEvent(kind: FieldEventKind, cx: number, cy: number, slot: number): ScheduledEvent | null {
    const key = `${kind}:${cx},${cy}:${slot}`;
    const hit = this.schedule.get(key);
    if (hit !== undefined) return hit;

    const rng = mpRng(mpWorldSeed(
      this.deps.worldSeed(), 'field_event', `${this.deps.mapKey}:${kind}:${cx},${cy}`, slot,
    ));
    const slotStart = slot * SLOT_MS;
    const feed = this.deps.feedingAt(slotStart);
    const p = CELL_RATE[kind] * Math.max(0, Math.min(1, (feed - 0.5) / 0.5));
    let out: ScheduledEvent | null = null;
    if (rng() < p) {
      const spot = this.findSpotInCell(kind, cx, cy, rng);
      if (spot) {
        const TR = this.deps.tileSize;
        const life = kind === 'boiling' ? 8_000 + rng() * 12_000 : 30_000 + rng() * 45_000;
        const startMs = slotStart + rng() * (SLOT_MS - 6_000);
        const radiusPx = kind === 'boiling' ? 34 + rng() * 18 : 28 + rng() * 14;
        const ang = rng() * Math.PI * 2;
        const speed = kind === 'boiling' ? 4 + rng() * 6 : 0;
        const offshore = spot.landDistTiles >= OFFSHORE_LAND_TILES;
        out = {
          key, kind,
          x: (spot.col + 0.5) * TR, y: (spot.row + 0.5) * TR,
          radiusPx, startMs, endMs: startMs + life,
          driftVx: Math.cos(ang) * speed, driftVy: Math.sin(ang) * speed,
          offshore,
          speciesBias: kind === 'boiling'
            ? BOILING_SPECIES_BIAS
            : (offshore ? SCHOOLING_OFFSHORE_BIAS : SCHOOLING_COASTAL_BIAS),
        };
      }
    }
    this.schedule.set(key, out);
    // 캐시가 무한히 자라지 않게 — 지난 슬롯은 버린다
    if (this.schedule.size > 400) {
      for (const k of this.schedule.keys()) {
        if (this.schedule.size <= 200) break;
        this.schedule.delete(k);
      }
    }
    return out;
  }

  /** 스케줄이 낳은 이벤트를 화면에 올린다 */
  private materialize(ev: ScheduledEvent): void {
    const container = ev.kind === 'boiling'
      ? this.buildBoilingVisual(ev.x, ev.y, ev.radiusPx)
      : this.buildSchoolingVisual(ev.x, ev.y, ev.radiusPx);
    this.patches.push({
      key: ev.key, kind: ev.kind, x0: ev.x, y0: ev.y, x: ev.x, y: ev.y,
      startMs: ev.startMs, endMs: ev.endMs, radiusPx: ev.radiusPx,
      driftVx: ev.driftVx, driftVy: ev.driftVy,
      speciesBias: ev.speciesBias, container,
    });
    if (this.announced.has(ev.key)) return;
    this.announced.add(ev.key);
    if (this.announced.size > 120) this.announced.clear();
    // 멀리 있는 것까지 일일이 알리면 로그가 소음이 된다 — 화면 근처만
    const p = this.deps.playerPos();
    if (Math.hypot(ev.x - p.x, ev.y - p.y) > this.deps.tileSize * 30) return;
    this.deps.pushLog?.(ev.kind === 'boiling'
      ? '[이벤트] 먼 수면에서 보일링 발생! 갈매기가 몰려듭니다 — 가장자리를 노리세요'
      : ev.offshore
        ? '[이벤트] 외양에 회유 어군 발견 — 그림자 군집을 정확히 노리면 연속 조과!'
        : '[이벤트] 연안에 숭어 떼 어군 발견 — 그림자 군집을 정확히 노리세요');
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
   * **칸 안에서** 발생 지점 찾기 (145차 — 구 구현은 플레이어 기준 +-26타일이라
   * 같은 세션의 두 사람이 서로 다른 자리를 골랐다).
   *
   * 육지 최소 거리 규칙(현실성)은 그대로:
   *  스쿨링 >= 10m(5타일 — 연안 숭어 떼 하한) / 보일링 >= 20m(10타일 — 청물은 먼 해양).
   *  조건을 만족하는 물이 칸 안에 없으면 그 칸엔 발생하지 않는다(의도 — 얕은 내항).
   */
  private findSpotInCell(
    kind: FieldEventKind, cx: number, cy: number, rng: () => number,
  ): { col: number; row: number; landDistTiles: number } | null {
    const minLand = kind === 'boiling' ? BOIL_MIN_LAND_TILES : SCHOOL_MIN_LAND_TILES;
    const c0 = cx * CELL_TILES;
    const r0 = cy * CELL_TILES;
    for (let attempt = 0; attempt < 40; attempt++) {
      const col = c0 + Math.floor(rng() * CELL_TILES);
      const row = r0 + Math.floor(rng() * CELL_TILES);
      if (!this.deps.isWaterAt(col, row)) continue;
      const landDist = this.landDistTiles(col, row, OFFSHORE_LAND_TILES + 2);
      if (landDist < minLand) continue;
      return { col, row, landDistTiles: landDist };
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
