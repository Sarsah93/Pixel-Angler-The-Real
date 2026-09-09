/**
 * @file ForageSystem.ts
 * @description 인-맵 채집(해루질) 필드 시스템 (121차) — RegionFieldScene에 붙는 컨트롤러.
 *
 * 역할: ① 어촌계 어장(마을어장·협동양식장) 폴리곤 오버레이 + 진입 안내
 *      ② 지형 규칙으로 채집 스팟 후보(갯바위·테트라포드 발밑·안벽·웅덩이)를 만들고 시간 시드로 롤링
 *      ③ 야간 랜턴 반경 가시성 · [E] 홀드 게이지 · 결과(쿨러/인벤·도감·부상·도주)
 *      ④ 강원 조례 위반 판정 → 적발 롤 → 압수 + 벌금
 * 판정·수치는 전부 core(`ForagingEngine`·`TUNING.forage`) — 여기는 지형 후보 생성·렌더·입력만.
 *
 * 씬 결합은 `ForageHost` 인터페이스 하나 — 씬은 지형·플레이어·HUD 접근자만 넘긴다.
 */

import Phaser from 'phaser';
import {
  type FishFarm, type ForageCandidate, type ForageSpot, type ForageSpotKind, type ForageTool, type RegionTerrain,
  type ShoreCreature,
  SHORE_CREATURE_DATABASE, getCreatureById, FISH_FARM_KIND_LABEL, GANGWON_FORAGE_ORDINANCE,
  farmAt, isProtectedFarmKind, forageSeed, rollForageSpots, forageSafety, pickForageTool, forageHoldMs,
  attemptForage, isOrdinanceViolation, rollEnforcement, creatureTools, FORAGE_TOOL_LABEL,
  calculateTideInfo, isNightNow, checkSlipHazard, TUNING,
} from '@tra/core';
import { GameState } from '../../store/GameState.js';
import { InventoryStore } from '../../store/InventoryStore.js';
import { CoolerStore } from '../../store/CoolerStore.js';
import { DiscoveryStore } from '../../store/DiscoveryStore.js';
import { ExternalDataStore } from '../../store/ExternalDataStore.js';

/** 씬이 넘기는 접근자 — 씬 내부를 직접 만지지 않는다 */
export interface ForageHost {
  scene: Phaser.Scene;
  tr: number;
  cols: number;
  rows: number;
  regionId: string;
  /** 스팟 시드 키 (맵 id) */
  mapKey: string;
  terrainAt: (c: number, r: number) => RegionTerrain | undefined;
  /** 심리스 청크 조회 (legacy 맵은 undefined) */
  isIsletAt?: (c: number, r: number) => boolean;
  breakwaterClassAt?: (c: number, r: number) => number;
  isHarborAt?: (c: number, r: number) => boolean;
  player: () => { x: number; y: number };
  /** 이동·상호작용이 막힌 상태 (팝업·일시정지·전환) */
  blocked: () => boolean;
  pushLog: (msg: string) => void;
  floatingHint: (msg: string) => void;
  /** 미끄러짐 넉백 (방향 단위벡터) */
  knockback: (dx: number, dy: number) => void;
}

/** 채집 생물 카테고리별 도트 아이콘 텍스처 키 */
export function forageTexKey(c: ShoreCreature): string {
  return `forage_${c.id}`;
}

const HINT_STYLE = {
  fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8f5d8', fontStyle: 'bold',
  backgroundColor: '#0a1628cc', padding: { x: 5, y: 2 },
} as const;

export class ForageSystem {
  private host: ForageHost;
  private farms: FishFarm[];
  private candidates: ForageCandidate[] = [];
  private spots: ForageSpot[] = [];
  private spotSprites = new Map<string, Phaser.GameObjects.Image>();
  private farmG?: Phaser.GameObjects.Graphics;
  private farmLabels: Phaser.GameObjects.Text[] = [];
  private hintText?: Phaser.GameObjects.Text;
  private holdG?: Phaser.GameObjects.Graphics;
  private lastSeed = -1;
  private lastFarmName: string | null = null;
  private refreshAcc = 0;
  private keyF?: Phaser.Input.Keyboard.Key;

  /** 현재 가장 가까운(상호작용 대상) 스팟 */
  private nearSpot: ForageSpot | null = null;
  /** 홀드 진행 */
  private hold: { spot: ForageSpot; creature: ShoreCreature; tool: ForageTool; startedAt: number; ms: number } | null = null;

  constructor(host: ForageHost, farms: FishFarm[]) {
    this.host = host;
    this.farms = farms;
    this.ensureTextures();
    this.candidates = this.computeCandidates();
    this.drawFarms();
    this.keyF = host.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F, false);
    this.refreshSpots(true);
  }

  // ═══════════════════════════════════════════════════
  // 후보 타일 — 지형 규칙
  // ═══════════════════════════════════════════════════

  /**
   * 물에 인접한 뭍 타일 중:
   *  섬/암초 셀 → rock_shore(웅덩이 = 물 3면) · 사석/테트라포드 → armor_foot · 상판+항만 물 → harbor_wall ·
   *  포장 아닌 자연 뭍('land'/'grass')이 외해와 닿음 → rock_shore. 모래('sand')·도로·보도·건물은 제외
   *  (동해 모래 해변엔 채집 대상이 없다 — 리서치 §2).
   */
  private computeCandidates(): ForageCandidate[] {
    const { cols, rows, terrainAt } = this.host;
    const out: ForageCandidate[] = [];
    const water = (c: number, r: number): boolean => terrainAt(c, r) === 'water';
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const t = terrainAt(c, r);
        if (!t || t === 'water' || t === 'building' || t === 'road' || t === 'sidewalk' || t === 'sand') continue;
        const wN = water(c, r - 1), wS = water(c, r + 1), wE = water(c + 1, r), wW = water(c - 1, r);
        const nWater = (wN ? 1 : 0) + (wS ? 1 : 0) + (wE ? 1 : 0) + (wW ? 1 : 0);
        if (nWater === 0) continue;
        let kind: ForageSpotKind | null = null;
        const bw = this.host.breakwaterClassAt?.(c, r) ?? 0;
        const islet = this.host.isIsletAt?.(c, r) ?? false;
        if (islet) kind = nWater >= 3 ? 'tidepool' : 'rock_shore';
        else if (bw === 2 || bw === 3) kind = 'armor_foot';
        else if (bw === 1 || t === 'pier') {
          // 상판/안벽 — 인접 물이 항만 수역이면 안벽(홍합·굴), 외해면 발밑 사석 취급
          const harbor = [[0, -1], [0, 1], [1, 0], [-1, 0]].some(([dc, dr]) => water(c + dc!, r + dr!) && (this.host.isHarborAt?.(c + dc!, r + dr!) ?? false));
          kind = harbor ? 'harbor_wall' : 'armor_foot';
        } else if (t === 'land' || t === 'grass') {
          // 자연 해안 — 항만 안쪽(석호·항 내측)이면 웅덩이 없이 안벽 취급, 외해면 갯바위
          const harbor = [[0, -1], [0, 1], [1, 0], [-1, 0]].some(([dc, dr]) => water(c + dc!, r + dr!) && (this.host.isHarborAt?.(c + dc!, r + dr!) ?? false));
          kind = harbor ? 'harbor_wall' : nWater >= 3 ? 'tidepool' : 'rock_shore';
        }
        if (kind) out.push({ tx: c, ty: r, kind });
      }
    }
    return out;
  }

  /** 후보 통계 (dev/검증용) */
  candidateStats(): Record<ForageSpotKind, number> {
    const s: Record<ForageSpotKind, number> = { rock_shore: 0, armor_foot: 0, tidepool: 0, harbor_wall: 0 };
    for (const c of this.candidates) s[c.kind]++;
    return s;
  }

  // ═══════════════════════════════════════════════════
  // 환경
  // ═══════════════════════════════════════════════════

  private env(): { month: number; isNight: boolean; windSpeedMs: number; waveHeightM: number; tideLevel01: number; hasAdvancedLicense: boolean; currentStrength: number } {
    const kma = ExternalDataStore.getKmaWeather(this.host.regionId);
    const marine = ExternalDataStore.getRegionMarineWeather(this.host.regionId);
    const tide = calculateTideInfo();
    const level = tide.highTideHeightCm > 0 ? tide.currentWaterLevelCm / tide.highTideHeightCm : 0.5;
    return {
      month: new Date().getMonth() + 1,
      isNight: isNightNow(),
      windSpeedMs: kma?.windSpeedMs ?? marine?.windSpeedMs ?? 4,
      waveHeightM: ExternalDataStore.getWaveHeightM(this.host.regionId) ?? 0.5,
      tideLevel01: Math.max(0, Math.min(1, level)),
      hasAdvancedLicense: GameState.hasLicense('shore_hunting_advanced'),
      currentStrength: tide.currentStrength,
    };
  }

  /** 보유 채집 도구 (아이템 보유 = 사용 가능 — 손 착용 불요) */
  private ownedTools(): ForageTool[] {
    const out: ForageTool[] = ['hand'];
    for (const i of InventoryStore.items) {
      if (i.forageTool && i.qty > 0 && !out.includes(i.forageTool)) out.push(i.forageTool);
      if (i.tool === 'net' && i.qty > 0 && !out.includes('net')) out.push('net');
    }
    return out;
  }

  /** 랜턴 루멘 (최대값) — 0이면 야간 발견 불가 */
  private lampLumens(): number {
    let best = 0;
    for (const i of InventoryStore.items) if (i.lampLumens && i.qty > 0) best = Math.max(best, i.lampLumens);
    return best;
  }

  // ═══════════════════════════════════════════════════
  // 스팟 롤링 · 렌더
  // ═══════════════════════════════════════════════════

  refreshSpots(force = false): void {
    const seed = forageSeed(this.host.mapKey, Date.now());
    if (!force && seed === this.lastSeed) return;
    this.lastSeed = seed;
    const e = this.env();
    this.spots = rollForageSpots(this.candidates, {
      seed, month: e.month, isNight: e.isNight, tideLevel01: e.tideLevel01,
      hasAdvancedLicense: e.hasAdvancedLicense, farms: this.farms, maxSpots: TUNING.forage.maxSpots,
    });
    this.renderSpots();
  }

  private renderSpots(): void {
    const alive = new Set(this.spots.map((s) => s.id));
    for (const [id, img] of this.spotSprites) if (!alive.has(id)) { img.destroy(); this.spotSprites.delete(id); }
    const tr = this.host.tr;
    for (const s of this.spots) {
      if (this.spotSprites.has(s.id)) continue;
      const c = getCreatureById(s.creatureId);
      if (!c) continue;
      const img = this.host.scene.add.image(s.tx * tr + tr / 2, s.ty * tr + tr * 0.72, forageTexKey(c))
        .setOrigin(0.5, 1).setDepth(6.5).setScale(1.5).setVisible(false);
      this.spotSprites.set(s.id, img);
    }
  }

  /** 카테고리별 도트 아이콘 (실사 에셋 교체 자리 — spriteKey는 DB에 예약) */
  private ensureTextures(): void {
    const tex = this.host.scene.textures;
    for (const c of SHORE_CREATURE_DATABASE) {
      const key = forageTexKey(c);
      if (tex.exists(key)) continue;
      const g = this.host.scene.add.graphics();
      const w = 16, h = 14;
      switch (c.id) {
        case 'turbo_cornutus': // 소라 — 나선 껍데기
          g.fillStyle(0x6e5a3e, 1); g.fillEllipse(8, 8, 13, 10);
          g.fillStyle(0x9c8460, 1); g.fillEllipse(6, 7, 6, 5);
          g.lineStyle(1, 0x3e3020, 1); g.strokeEllipse(8, 8, 13, 10);
          break;
        case 'mytilus_coruscus': // 홍합 — 검푸른 조개 군락
          g.fillStyle(0x1f2a3a, 1); g.fillEllipse(5, 9, 7, 10); g.fillEllipse(11, 8, 7, 10);
          g.fillStyle(0x38507a, 1); g.fillEllipse(5, 7, 3, 5); g.fillEllipse(11, 6, 3, 5);
          break;
        case 'strongylocentrotus_nudus': // 성게 — 검은 가시
          g.fillStyle(0x14121a, 1); g.fillCircle(8, 8, 5);
          g.lineStyle(1, 0x2a2438, 1);
          for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; g.lineBetween(8, 8, 8 + Math.cos(a) * 8, 8 + Math.sin(a) * 8); }
          break;
        case 'stichopus_japonicus': // 해삼 — 갈색 돌기
          g.fillStyle(0x4a3a2a, 1); g.fillRoundedRect(1, 5, 14, 7, 3);
          g.fillStyle(0x7a5a3a, 1); for (let k = 0; k < 5; k++) g.fillRect(2 + k * 3, 4, 1, 2);
          break;
        case 'octopus_vulgaris': // 문어 — 붉은 몸 + 다리
          g.fillStyle(0xa8402c, 1); g.fillCircle(8, 6, 5);
          g.lineStyle(2, 0xa8402c, 1);
          for (let k = 0; k < 5; k++) g.lineBetween(4 + k * 2, 9, 2 + k * 3, 14);
          g.fillStyle(0xffffff, 1); g.fillCircle(6, 5, 1); g.fillCircle(10, 5, 1);
          break;
        case 'haliotis_discus': // 전복
          g.fillStyle(0x5a6a4a, 1); g.fillEllipse(8, 8, 14, 10);
          g.fillStyle(0x8aa07a, 1); g.fillEllipse(6, 7, 6, 4);
          g.fillStyle(0xffffff, 0.8); for (let k = 0; k < 4; k++) g.fillCircle(4 + k * 3, 5, 0.8);
          break;
        case 'charybdis_japonica': case 'portunus_trituberculatus': // 게
          g.fillStyle(0x8a4a2c, 1); g.fillEllipse(8, 8, 11, 7);
          g.lineStyle(1.5, 0x8a4a2c, 1);
          for (let k = 0; k < 3; k++) { g.lineBetween(3, 6 + k * 2, 0, 4 + k * 3); g.lineBetween(13, 6 + k * 2, 16, 4 + k * 3); }
          break;
        case 'capitulum_mitella': // 거북손 — 군체
          g.fillStyle(0x3a3a3a, 1); g.fillTriangle(2, 13, 6, 3, 9, 13); g.fillTriangle(7, 13, 11, 4, 14, 13);
          g.fillStyle(0xd8c8a0, 1); g.fillTriangle(4, 12, 6, 6, 8, 12);
          break;
        case 'cellana_grata': // 삿갓조개 — 원뿔
          g.fillStyle(0x6a5a4a, 1); g.fillTriangle(1, 12, 8, 3, 15, 12);
          g.fillStyle(0x9a8a6a, 1); g.fillTriangle(5, 11, 8, 6, 11, 11);
          break;
        case 'omphalius_rusticus': // 보말 — 작은 고둥
          g.fillStyle(0x3e3a34, 1); g.fillCircle(8, 9, 4.5);
          g.fillStyle(0x6e6a5a, 1); g.fillCircle(7, 8, 2);
          break;
        case 'oyster_gigas': // 굴
          g.fillStyle(0x7a7a72, 1); g.fillEllipse(8, 8, 13, 9);
          g.fillStyle(0xd8d8cc, 1); g.fillEllipse(8, 8, 8, 5);
          break;
        default: // 조개류 기본
          g.fillStyle(0xc8b898, 1); g.fillEllipse(8, 8, 12, 9);
          g.lineStyle(1, 0x8a7a5a, 1); g.strokeEllipse(8, 8, 12, 9);
      }
      g.generateTexture(key, w, h);
      g.destroy();
    }
  }

  // ═══════════════════════════════════════════════════
  // 어장 오버레이
  // ═══════════════════════════════════════════════════

  private drawFarms(): void {
    const tr = this.host.tr;
    const g = this.host.scene.add.graphics().setDepth(5.6);
    this.farmG = g;
    for (const f of this.farms) {
      const protectedKind = isProtectedFarmKind(f.kind);
      const col = protectedKind ? 0xff9a3c : 0x8ab4d8;
      g.fillStyle(col, protectedKind ? 0.07 : 0.04);
      for (const ring of f.rings) {
        if (ring.length < 3) continue;
        g.beginPath();
        g.moveTo(ring[0]![0] * tr, ring[0]![1] * tr);
        for (let i = 1; i < ring.length; i++) g.lineTo(ring[i]![0] * tr, ring[i]![1] * tr);
        g.closePath();
        g.fillPath();
        // 점선 테두리 (짧은 대시)
        g.lineStyle(2, col, protectedKind ? 0.75 : 0.45);
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i]!, b = ring[(i + 1) % ring.length]!;
          const ax = a[0] * tr, ay = a[1] * tr, bx = b[0] * tr, by = b[1] * tr;
          const len = Math.hypot(bx - ax, by - ay);
          const n = Math.max(1, Math.floor(len / 14));
          for (let k = 0; k < n; k += 2) {
            const t0 = k / n, t1 = Math.min(1, (k + 1) / n);
            g.lineBetween(ax + (bx - ax) * t0, ay + (by - ay) * t0, ax + (bx - ax) * t1, ay + (by - ay) * t1);
          }
        }
      }
      // 라벨 — 외곽 링 중심(맵 안으로 클램프)
      const ring = f.rings[0];
      if (ring && ring.length) {
        let cx = 0, cy = 0;
        for (const p of ring) { cx += p[0]; cy += p[1]; }
        cx = Phaser.Math.Clamp(cx / ring.length, 4, this.host.cols - 4);
        cy = Phaser.Math.Clamp(cy / ring.length, 2, this.host.rows - 2);
        const label = protectedKind
          ? `${f.name} — ${FISH_FARM_KIND_LABEL[f.kind]} (채취 금지)`
          : `${f.name} — ${FISH_FARM_KIND_LABEL[f.kind]}`;
        const t = this.host.scene.add.text(cx * tr, cy * tr, label, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', fontStyle: 'bold',
          color: protectedKind ? '#ffc07a' : '#a8c8e8', backgroundColor: '#0a162899', padding: { x: 5, y: 2 },
        }).setOrigin(0.5).setDepth(5.7).setAlpha(0.85);
        this.farmLabels.push(t);
      }
    }
  }

  /** 플레이어 타일이 든 어장 (없으면 undefined) */
  farmAtPlayer(): FishFarm | undefined {
    const p = this.host.player();
    return farmAt(this.farms, p.x / this.host.tr, p.y / this.host.tr);
  }

  // ═══════════════════════════════════════════════════
  // 업데이트 — 가시성 · 근접 · 홀드
  // ═══════════════════════════════════════════════════

  update(deltaMs: number): void {
    this.refreshAcc += deltaMs;
    if (this.refreshAcc > 30_000) { this.refreshAcc = 0; this.refreshSpots(); }

    const p = this.host.player();
    const tr = this.host.tr;
    const night = isNightNow();
    const lm = this.lampLumens();
    // 스킬 채집 눈(122차) — 발견 반경 배율
    const radiusTiles = (night ? (lm / 100) * TUNING.forage.lampRadiusPer100lm : TUNING.forage.dayRadiusTiles) * GameState.skillMult('forage_radius');
    const radiusPx = radiusTiles * tr;

    // 어장 진입 안내 (1회/진입)
    const farm = farmAt(this.farms, p.x / tr, p.y / tr);
    const fname = farm?.name ?? null;
    if (fname !== this.lastFarmName) {
      this.lastFarmName = fname;
      if (farm && isProtectedFarmKind(farm.kind)) {
        this.host.pushLog(`[어장] ${farm.name} — 어촌계 ${FISH_FARM_KIND_LABEL[farm.kind]} 구역: 전복·해삼·성게·홍합·문어 채취 금지 (강원 조례)`);
      }
    }

    // 가시성 — 낮: 랜턴 불요 생물만 / 밤: 랜턴 반경 안
    let nearest: ForageSpot | null = null;
    let bestD = tr * 1.7;
    for (const s of this.spots) {
      const img = this.spotSprites.get(s.id);
      if (!img) continue;
      const d = Math.hypot(img.x - p.x, img.y - p.y);
      const visible = night ? (lm > 0 && d <= radiusPx) : (s.minLampLumens === 0 && d <= Math.max(radiusPx, tr * 12));
      img.setVisible(visible);
      if (visible) img.setAlpha(night ? Phaser.Math.Clamp(1.2 - d / Math.max(1, radiusPx), 0.35, 1) : 1);
      if (visible && d < bestD) { bestD = d; nearest = s; }
    }
    this.nearSpot = nearest;

    // 힌트
    if (nearest && !this.host.blocked() && !this.hold) {
      const c = getCreatureById(nearest.creatureId)!;
      const tool = pickForageTool(c, this.ownedTools());
      const lic = GameState.hasLicense('shore_hunting_basic');
      const label = !lic ? `${c.nameKo} — 해루질 입문 허가 필요 (L)`
        : tool ? `[F 길게] 채집 — ${c.nameKo} (${FORAGE_TOOL_LABEL[tool]})`
        : `${c.nameKo} — ${creatureTools(c).map((t) => FORAGE_TOOL_LABEL[t]).join('/')} 필요`;
      this.showHint(label, p.x, p.y - 80);   // 홀드 바(y-66)·플로팅 힌트(y-40~-62) 위 — 겹침 방지 (122차 실측)
    } else if (!this.hold) {
      this.hintText?.setVisible(false);
    }

    // 홀드 진행
    if (this.hold) {
      if (!this.keyF?.isDown || this.host.blocked()) { this.cancelHold('중단'); return; }
      const t = (Date.now() - this.hold.startedAt) / this.hold.ms;
      this.drawHold(Math.min(1, t), p.x, p.y);
      if (t >= 1) this.resolveHold();
    }
  }

  private showHint(text: string, x: number, y: number): void {
    if (!this.hintText) this.hintText = this.host.scene.add.text(0, 0, '', HINT_STYLE).setOrigin(0.5, 1).setDepth(31);
    this.hintText.setText(text).setPosition(x, y).setVisible(true);
  }

  private drawHold(t01: number, x: number, y: number): void {
    if (!this.holdG) this.holdG = this.host.scene.add.graphics().setDepth(32);
    const g = this.holdG;
    g.clear();
    const w = 44, h = 6, x0 = x - w / 2, y0 = y - 66;
    g.fillStyle(0x0a1628, 0.85); g.fillRoundedRect(x0 - 1, y0 - 1, w + 2, h + 2, 2);
    g.fillStyle(0x4af2a1, 1); g.fillRect(x0, y0, w * t01, h);
  }

  // ═══════════════════════════════════════════════════
  // 입력 — [F] 누르는 순간 홀드 시작 (122차: E → F)
  // ═══════════════════════════════════════════════════

  /** 씬 keydown-F — 소비했으면 true (122차: 상호작용 키 E → F) */
  onInteractKey(): boolean {
    if (this.hold) return true;
    const s = this.nearSpot;
    if (!s) return false;
    const c = getCreatureById(s.creatureId);
    if (!c) return false;
    if (!GameState.hasLicense('shore_hunting_basic')) {
      this.host.floatingHint('해루질 입문 허가가 필요합니다 — L 면허 창');
      return true;
    }
    const e = this.env();
    const safety = forageSafety({ ...e });
    if (!safety.allowed) {
      this.host.floatingHint(safety.danger ?? '지금은 위험합니다');
      this.host.pushLog(`[안전] ${safety.danger}`);
      return true;
    }
    const tool = pickForageTool(c, this.ownedTools());
    if (!tool) {
      this.host.floatingHint(`${c.nameKo}은(는) ${creatureTools(c).map((t) => FORAGE_TOOL_LABEL[t]).join('/')}(으)로만 채집할 수 있습니다`);
      return true;
    }
    // 갯바위·사석 미끄러짐 (너울 시 상승) — 시작 순간 1회
    if (s.kind === 'rock_shore' || s.kind === 'armor_foot') {
      const slip = checkSlipHazard(safety.slipChance * GameState.skillMult('balance'), GameState.player.stamina, GameState.player.fatigue);
      if (slip.slipped) {
        GameState.updatePlayer({ stamina: Math.max(0, GameState.player.stamina - Math.max(8, Math.round(slip.staminaLost * 0.4))) });
        const p = this.host.player();
        const dx = p.x - (s.tx * this.host.tr + this.host.tr / 2), dy = p.y - (s.ty * this.host.tr + this.host.tr / 2);
        const l = Math.hypot(dx, dy) || 1;
        this.host.knockback(dx / l, dy / l);
        this.host.scene.cameras.main.shake(160, 0.005);
        this.host.floatingHint(safety.warning ? '너울에 미끄러졌다! 갯바위 주의' : '이끼에 미끄러졌다!');
        this.host.pushLog('[안전] 갯바위에서 미끄러졌습니다 — HP 감소');
        return true;
      }
    }
    if (safety.warning) this.host.floatingHint(safety.warning);
    this.hold = { spot: s, creature: c, tool, startedAt: Date.now(), ms: forageHoldMs(c, tool) };
    this.showHint(`${c.nameKo} 채집 중… (${FORAGE_TOOL_LABEL[tool]})`, this.host.player().x, this.host.player().y - 80);
    return true;
  }

  private cancelHold(_why: string): void {
    this.hold = null;
    this.holdG?.clear();
    this.hintText?.setVisible(false);
  }

  private removeSpot(id: string): void {
    this.spots = this.spots.filter((s) => s.id !== id);
    const img = this.spotSprites.get(id);
    if (img) { img.destroy(); this.spotSprites.delete(id); }
  }

  private resolveHold(): void {
    const h = this.hold;
    if (!h) return;
    this.hold = null;
    this.holdG?.clear();
    const res = attemptForage(h.creature, h.tool, Math.random, {
      escapeMult: GameState.skillMult('octopus_escape'), injuryChance: GameState.skillMult('hand_injury'),
    });
    const p = this.host.player();
    switch (res.outcome) {
      case 'injured':
        GameState.updatePlayer({ stamina: Math.max(0, GameState.player.stamina - res.staminaLoss) });
        this.host.scene.cameras.main.shake(140, 0.004);
        this.host.floatingHint(res.message);
        this.host.pushLog(`[채집] ${res.message}`);
        return;
      case 'escaped':
        this.removeSpot(h.spot.id);
        this.host.floatingHint(res.message);
        this.host.pushLog(`[채집] ${res.message}`);
        return;
      case 'failed':
        this.host.floatingHint(res.message);
        return;
      case 'success':
        break;
    }
    this.removeSpot(h.spot.id);
    if (res.undersized) {
      this.host.floatingHint(res.message);
      this.host.pushLog(`[채집] ${res.message}`);
      return;
    }
    // 수확 — 쿨러(활어) 우선, 없거나 가득이면 인벤토리(음식 · 채집물)
    const tex = forageTexKey(h.creature);
    let where: 'cooler' | 'inventory' | 'none' = 'none';
    let coolerIdx = -1;
    let invId = '';
    if (InventoryStore.hasCooler() && !CoolerStore.isFull()) {
      coolerIdx = CoolerStore.add({ speciesId: res.creatureId, nameKo: res.nameKo, lengthCm: res.sizeCm, weightG: res.weightG, sex: 'F', iconTexture: tex });
      if (coolerIdx >= 0) where = 'cooler';
    }
    if (where === 'none') {
      invId = `inv_forage_${res.creatureId}_${InventoryStore.nextCatchSeq()}`;
      const ok = InventoryStore.addItem({
        id: invId, name: `${res.nameKo} (${res.sizeCm}cm)`, icon: '🐚', iconTexture: tex,
        category: 'food', subCategory: '채집물',
        basePrice: Math.max(500, Math.round((res.weightG / 1000) * h.creature.marketValuePerKg)),
        condition: 'live', equippable: false,
        speciesId: res.creatureId, lengthCm: res.sizeCm, weightG: res.weightG, forageCatch: true,
      }, 1);
      if (ok) where = 'inventory';
    }
    if (where === 'none') {
      this.host.floatingHint('쿨러와 인벤토리가 가득 찼습니다 — 놓아주었습니다');
      return;
    }
    DiscoveryStore.record('creature', res.creatureId, 'night_hunting');
    this.host.floatingHint(res.message);
    this.host.pushLog(`[채집] ${res.nameKo} ${res.weightG}g — ${where === 'cooler' ? '쿨러 보관' : '인벤토리(채집물)'}`);
    this.host.scene.cameras.main.flash(120, 40, 160, 90);

    // ── 강원 조례 — 어촌계 어장 안 보호 5종 → 적발 롤 ──
    const farm = farmAt(this.farms, h.spot.tx + 0.5, h.spot.ty + 0.5);
    // 수협 조합원증(어업인 등록)은 조례 면제 (122차 면허)
    if (farm && !GameState.hasLicense('fishery_member') && isOrdinanceViolation(res.creatureId, farm)) {
      const enf = rollEnforcement(GameState.player.inventory.coins, Math.random);
      if (enf.caught) {
        if (where === 'cooler') CoolerStore.removeAt(coolerIdx);
        else InventoryStore.removeQty(invId, 1);
        if (enf.fineWon > 0) GameState.addCoins(-enf.fineWon);
        GameState.markDirty();
        this.host.scene.cameras.main.flash(260, 200, 40, 40);
        this.host.scene.cameras.main.shake(200, 0.006);
        this.host.floatingHint(`단속 적발! ${res.nameKo} 압수 · 벌금 ${enf.fineWon.toLocaleString()}원`);
        this.host.pushLog(`[단속] ${farm.name}(${FISH_FARM_KIND_LABEL[farm.kind]}) 안 ${res.nameKo} 채취 적발 — 압수 · 벌금 ${enf.fineWon.toLocaleString()}원 (조례 상한 ${GANGWON_FORAGE_ORDINANCE.fineMaxWon.toLocaleString()}원)`);
      } else {
        this.host.pushLog(`[주의] ${farm.name} 안 ${res.nameKo} 채취 — 강원 조례 위반 (적발 시 압수·벌금)`);
      }
    }
    void p;
  }

  // ═══════════════════════════════════════════════════
  // dev/검증 접근자
  // ═══════════════════════════════════════════════════

  /** 현재 스팟 목록 (검증 하네스용) */
  allSpots(): ForageSpot[] { return this.spots.slice(); }
  farmsList(): FishFarm[] { return this.farms; }
  /** dev: 특정 스팟을 강제로 지정 생물로 바꿔 검증 (조례 판정 재현) */
  devForceSpot(spotId: string, creatureId: string): void {
    const s = this.spots.find((x) => x.id === spotId);
    const c = getCreatureById(creatureId);
    if (!s || !c) return;
    s.creatureId = c.id; s.minLampLumens = c.minLampLumens;
    const img = this.spotSprites.get(s.id);
    if (img) img.setTexture(forageTexKey(c));
  }
  /** dev: 홀드를 즉시 완료 */
  devResolveNow(): void { if (this.hold) { this.hold.startedAt = 0; this.resolveHold(); } }

  destroy(): void {
    for (const img of this.spotSprites.values()) img.destroy();
    this.spotSprites.clear();
    this.farmG?.destroy();
    for (const t of this.farmLabels) t.destroy();
    this.hintText?.destroy();
    this.holdG?.destroy();
  }
}
