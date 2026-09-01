/**
 * @file TrafficSystem.ts
 * @description 심리스 필드 주행 차량 (101차 후속 — 사용자 지시 "차가 도로를 따라 이동 · 역주행 금지").
 *
 * roads.json(차도 중심선 폴리라인·폭·차로 수·일방통행/회전교차로 플래그)으로 **도로 그래프**를 만든다.
 *  ⚠ OSM way는 교차점에서 노드를 공유하지만 **관통 도로는 way가 쪼개지지 않는다**(T자 교차 = 한쪽 way의
 *    끝점이 다른 way의 *중간 정점*) → **모든 정점**을 노드로 등록한다.
 * 차량은 엔티티(물리 바디 없음):
 *  - **우측통행**: 진행 방향의 오른쪽 법선으로 첫 차로 중앙만큼 오프셋. 일방통행·회전교차로 링은 pts 순방향만.
 *  - 정점 도달 시 분기(직진 60% 선호). 일방통행 도로에는 끝점에서 거꾸로 진입하지 않는다.
 *  - **막다른 끝 = 페이드아웃 후 재등장**(U턴 보간은 "거꾸로 달리는 차"로 보였다).
 *  - **교통 규칙**: 앞차 정지(전방 원뿔 2.6타일) · 교차 정점 선진입 우선 · **회전교차로 링 위 차량이 우선**
 *    (진입 차량은 링 위 차가 노드 3타일 안이면 대기 — 규범도의 양보선) · 링 위 차량은 양보하지 않는다.
 *  - **플레이어**: 1.6타일 안 전방(또는 1타일 안 어디든)이면 정지해 지나갈 때까지 대기 · 캐릭터가 차에 부딪히면
 *    hit 반환(씬이 넉백·HP 처리) + 차량은 **180초 정지**.
 * 전부 결정적이지 않다(Math.random — 교통은 재현성 불필요).
 */

import Phaser from 'phaser';
import type { RegionRoad } from '@tra/core';
import { CAR_TOPDOWN_KEYS } from '../data/TilesetManifest.js';

interface Car {
  road: number;
  dir: 1 | -1;
  seg: number;
  t: number;
  speed: number;
  sprite: Phaser.GameObjects.Image;
  px: number; py: number; ux: number; uy: number;
  fade: number;
  waiting: boolean;
  /** 사고 정지 잔여 초 (캐릭터 충돌 — 180s) */
  halt: number;
  /** 추월 횡 오프셋 (타일 — 0 = 차로 정위치, 음수 = 왼쪽 차로) · lat은 latTarget으로 스무딩 */
  lat: number;
  latTarget: number;
}

export interface TrafficHit {
  /** 차 → 플레이어 단위 벡터 (월드) */
  dx: number; dy: number;
}

export class TrafficSystem {
  private roads: RegionRoad[];
  private tr: number;
  private cars: Car[] = [];
  private nodes = new Map<string, { road: number; idx: number }[]>();
  private drivable: boolean[] = [];
  private drivableList: number[] = [];

  private nodeKey(p: [number, number]): string {
    return `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
  }

  constructor(scene: Phaser.Scene, roads: RegionRoad[], tr: number, count: number, cols: number, rows: number) {
    this.roads = roads;
    this.tr = tr;
    this.drivable = roads.map((rd) =>
      rd.w >= 2 && rd.pts.length >= 2 &&
      rd.pts.every(([x, y]) => x >= 1 && y >= 1 && x <= cols - 1 && y <= rows - 1));
    roads.forEach((rd, i) => {
      if (!this.drivable[i]) return;
      rd.pts.forEach((p, idx) => {
        const k = this.nodeKey(p);
        const list = this.nodes.get(k);
        if (list) list.push({ road: i, idx }); else this.nodes.set(k, [{ road: i, idx }]);
      });
    });
    this.drivableList = roads.map((_r, i) => (this.drivable[i] ? i : -1)).filter((i) => i >= 0);
    if (this.drivableList.length === 0) return;
    for (let n = 0; n < count; n++) {
      const tex = CAR_TOPDOWN_KEYS[Math.floor(Math.random() * CAR_TOPDOWN_KEYS.length)];
      if (!scene.textures.exists(tex)) continue;
      const sprite = scene.add.image(0, 0, tex).setOrigin(0.5, 0.5).setScale(1.3).setVisible(false);
      const car: Car = { road: 0, dir: 1, seg: 0, t: 0, speed: 3 + Math.random() * 2.5, sprite, px: 0, py: 0, ux: 0, uy: -1, fade: 0, waiting: false, halt: 0, lat: 0, latTarget: 0 };
      this.respawn(car);
      this.cars.push(car);
    }
  }

  private isOneway(ri: number): boolean {
    const rd = this.roads[ri];
    return !!rd.oneway || !!rd.roundabout;
  }

  private respawn(car: Car): void {
    const road = this.drivableList[Math.floor(Math.random() * this.drivableList.length)];
    const rd = this.roads[road];
    car.road = road;
    car.seg = Math.floor(Math.random() * (rd.pts.length - 1));
    car.dir = this.isOneway(road) ? 1 : (Math.random() < 0.5 ? 1 : -1);
    car.t = Math.random() * this.segLen(road, car.seg);
    car.fade = 0;
    car.halt = 0;
    car.lat = 0;
    car.latTarget = 0;
    car.sprite.setAlpha(1);
    this.place(car);
  }

  /** 이 도로에서 차로 1개 폭 (추월 시 왼쪽으로 옮기는 거리) */
  private laneWidth(ri: number): number {
    const rd = this.roads[ri];
    const lanes = Math.max(1, rd.lanes ?? 1);
    const edgeM = 0.35;
    return this.isOneway(ri) ? (rd.w - edgeM * 2) / lanes : (rd.w / 2 - edgeM) / lanes;
  }

  private segLen(road: number, seg: number): number {
    const p = this.roads[road].pts;
    return Math.hypot(p[seg + 1][0] - p[seg][0], p[seg + 1][1] - p[seg][1]);
  }

  private segDir(car: Car): [number, number] {
    const p = this.roads[car.road].pts;
    let dx = p[car.seg + 1][0] - p[car.seg][0], dy = p[car.seg + 1][1] - p[car.seg][1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    return car.dir === 1 ? [dx, dy] : [-dx, -dy];
  }

  private place(car: Car): void {
    const rd = this.roads[car.road];
    const p = rd.pts;
    const [ux, uy] = this.segDir(car);
    const from = car.dir === 1 ? p[car.seg] : p[car.seg + 1];
    const lanes = Math.max(1, rd.lanes ?? 1);
    const edgeM = 0.35;
    // 일방통행은 전 폭이 한 방향 — 오른쪽 차로 중앙 = 중심선에서 (halfW − edgeM − laneW/2) 오른쪽
    const laneOff = this.isOneway(car.road)
      ? (rd.w / 2 - edgeM) - ((rd.w - edgeM * 2) / lanes) * 0.5
      : ((rd.w / 2 - edgeM) / lanes) * 0.5;
    const nx = -uy, ny = ux;
    // 추월 횡 오프셋 합산 — 도로 폭 밖으로는 나가지 않는다
    const half = rd.w / 2 - edgeM;
    const off = Math.max(-half, Math.min(half, laneOff + car.lat));
    const x = from[0] + ux * car.t + nx * off;
    const y = from[1] + uy * car.t + ny * off;
    car.px = x; car.py = y; car.ux = ux; car.uy = uy;
    car.sprite.setPosition(x * this.tr, y * this.tr).setRotation(Math.atan2(uy, ux) + Math.PI / 2).setDepth(20 + y * this.tr * 0.001);
  }

  private atVertex(car: Car, vertexIdx: number): void {
    const rd = this.roads[car.road];
    const nextSeg = car.seg + car.dir;
    const canStraight = nextSeg >= 0 && nextSeg < rd.pts.length - 1;
    const key = this.nodeKey(rd.pts[vertexIdx]);
    // 분기 후보 — 일방통행 도로는 끝점(last)에서 거꾸로 들어갈 수 없다
    const branches = (this.nodes.get(key) ?? []).filter((o) => {
      if (o.road === car.road) return false;
      if (this.isOneway(o.road) && o.idx === this.roads[o.road].pts.length - 1) return false;
      return true;
    });
    // 회전교차로 링 위에서는 링을 계속 도는 쪽을 선호(직진 55%) — 출구 분기는 나머지
    if (canStraight && (branches.length === 0 || Math.random() < (rd.roundabout ? 0.55 : 0.6))) { car.seg = nextSeg; return; }
    if (branches.length > 0) {
      const pick = branches[Math.floor(Math.random() * branches.length)];
      const last = this.roads[pick.road].pts.length - 1;
      let dir: 1 | -1;
      if (this.isOneway(pick.road) || pick.idx === 0) dir = 1;
      else if (pick.idx === last) dir = -1;
      else dir = Math.random() < 0.5 ? 1 : -1;
      car.road = pick.road;
      car.dir = dir;
      car.seg = dir === 1 ? Math.min(pick.idx, last - 1) : pick.idx - 1;
      return;
    }
    // 링이 닫혀 있으면(첫 점 = 끝 점) 처음부터 다시
    if (rd.roundabout && this.nodeKey(rd.pts[0]) === this.nodeKey(rd.pts[rd.pts.length - 1])) { car.seg = 0; return; }
    car.t = this.segLen(car.road, car.seg);
    car.fade = 0.6;
  }

  private advance(car: Car, dist: number): void {
    car.t += dist;
    for (let guard = 0; guard < 8; guard++) {
      const len = this.segLen(car.road, car.seg);
      if (car.t < len) return;
      car.t -= len;
      const vertex = car.dir === 1 ? car.seg + 1 : car.seg;
      this.atVertex(car, vertex);
      if (car.fade > 0) return;
    }
  }

  /**
   * 앞차·교차로·회전교차로·플레이어 — true면 이번 틱 정지.
   * **사고 차량(halt)은 대기 대상이 아니라 추월 대상** — 같은 차로 전방의 사고 차는 대향차 틈이
   * 있으면 `latTarget = -차로폭`(왼쪽 차로)으로 비켜 지나가고, 틈이 없으면 그때만 대기한다
   * (101차 잔여 "사고 정체 해소 — 추월 없음" 해소).
   */
  private mustWait(car: Car, player: { x: number; y: number } | null): boolean {
    const FOLLOW = 2.6, CONE = 0.75;
    const rd = this.roads[car.road];
    const len = this.segLen(car.road, car.seg);
    const toVertex = len - car.t;
    const vIdx = car.dir === 1 ? car.seg + 1 : car.seg;
    const vp = rd.pts[vIdx];
    const nodeList = this.nodes.get(this.nodeKey(vp)) ?? [];
    const junction = toVertex < 1.5 && nodeList.some((o) => o.road !== car.road);
    const enteringRoundabout = !rd.roundabout && toVertex < 2.0 && nodeList.some((o) => o.road !== car.road && !!this.roads[o.road].roundabout);
    // 플레이어 — 전방 1.6타일 원뿔 안 또는 1타일 안 어디든 → 지나갈 때까지 대기
    if (player) {
      const dx = player.x - car.px, dy = player.y - car.py;
      const d = Math.hypot(dx, dy);
      if (d < 1.0) return true;
      if (d < 1.6 && (dx * car.ux + dy * car.uy) / (d || 1) > 0.2) return true;
    }
    // 추월 판정은 횡 오프셋을 뺀 "차로 기준" 위치로 잰다 (이미 비켜난 뒤에도 사고 차를 인지)
    const nx = -car.uy, ny = car.ux;
    const bx = car.px - nx * car.lat, by = car.py - ny * car.lat;
    const laneW = this.laneWidth(car.road);
    let wantOvertake = false;
    for (const o of this.cars) {
      if (o === car || o.fade > 0) continue;
      const accident = o.halt > 0;
      const fx = accident ? bx : car.px, fy = accident ? by : car.py;
      const dx = o.px - fx, dy = o.py - fy;
      const d = Math.hypot(dx, dy);
      if (d < FOLLOW + (accident ? 0.8 : 0)) {
        const dot = (dx * car.ux + dy * car.uy) / (d || 1);
        if (accident) {
          // 우리 차로 위의 사고 차만 추월 대상 (대향 차로 사고에 뛰어들지 않는다)
          const latD = Math.abs(dx * nx + dy * ny);
          if (dot > 0.45 && latD < laneW * 0.55) wantOvertake = true;
        } else if (dot > CONE && (o.ux * car.ux + o.uy * car.uy) > -0.2) {
          return true;
        }
      }
      // 회전교차로 진입 — 링 위 차량이 노드 3타일 안이면 양보 (링 위 차량은 우선)
      if (enteringRoundabout && this.roads[o.road].roundabout) {
        if (Math.hypot(o.px - vp[0], o.py - vp[1]) < 3.0) return true;
      }
      if (junction && !rd.roundabout && !o.waiting) {
        const jd = Math.hypot(o.px - vp[0], o.py - vp[1]);
        if (jd < 2.2 && Math.hypot(car.px - vp[0], car.py - vp[1]) > jd) return true;
      }
    }
    if (wantOvertake) {
      // 반대 차로로 나가기 전 대향차 틈 확인 (일방통행은 대향차가 없어 항상 통과)
      for (const q of this.cars) {
        if (q === car || q.fade > 0 || q.halt > 0) continue;
        if ((q.ux * car.ux + q.uy * car.uy) >= -0.3) continue;
        const dx = q.px - car.px, dy = q.py - car.py;
        const ahead = dx * car.ux + dy * car.uy;
        if (ahead > -0.5 && ahead < 5.0 && Math.hypot(dx, dy) < 5.5) { car.latTarget = 0; return true; }
      }
      car.latTarget = -laneW;
    } else if (car.latTarget !== 0) {
      car.latTarget = 0;   // 사고 차를 지나쳤다 — 원 차로 복귀
    }
    return false;
  }

  /**
   * 플레이어 상호작용 — 매 틱 호출. 차량 0.75타일 안에 들어오면(캐릭터가 차에 부딪힘) hit 반환 +
   * 그 차량 180초 정지. 접근 대기는 mustWait가 처리.
   */
  playerInteract(px: number, py: number): TrafficHit | null {
    let hit: TrafficHit | null = null;
    for (const car of this.cars) {
      if (car.fade > 0 || car.halt > 0) continue;
      const dx = px - car.px, dy = py - car.py;
      const d = Math.hypot(dx, dy);
      if (d < 0.75) {
        car.halt = 180;
        // 정확히 겹치면(d ≈ 0) 차량 진행 반대 방향으로 밀어낸다
        if (!hit) hit = d > 0.05 ? { dx: dx / d, dy: dy / d } : { dx: -car.ux, dy: -car.uy };
      }
    }
    return hit;
  }

  update(dtMs: number, viewX: number, viewY: number, player: { x: number; y: number } | null = null): void {
    const dt = Math.min(0.1, dtMs / 1000);
    const cull = 1800;
    for (const car of this.cars) {
      if (car.fade > 0) {
        car.fade -= dt;
        car.sprite.setAlpha(Math.max(0, car.fade / 0.6));
        if (car.fade <= 0) this.respawn(car);
      } else if (car.halt > 0) {
        car.halt -= dt;            // 사고 정지 — 제자리
        car.waiting = true;
      } else {
        car.waiting = this.mustWait(car, player);
        // 추월 횡 이동 스무딩 — 대기 중(대향차 틈 기다림)에도 차로 복귀는 진행한다
        const dLat = car.latTarget - car.lat;
        if (dLat !== 0) {
          const step = 2.5 * dt;
          car.lat += Math.abs(dLat) <= step ? dLat : Math.sign(dLat) * step;
        }
        if (!car.waiting) this.advance(car, car.speed * dt);
        if (car.fade <= 0 && (!car.waiting || dLat !== 0)) this.place(car);
      }
      const near = Math.abs(car.sprite.x - viewX) < cull && Math.abs(car.sprite.y - viewY) < cull;
      car.sprite.setVisible(near);
    }
  }

  get count(): number { return this.cars.length; }

  destroy(): void {
    for (const c of this.cars) c.sprite.destroy();
    this.cars = [];
  }
}
