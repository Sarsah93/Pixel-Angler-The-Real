/**
 * @file ForageSystem.ts
 * @description 인-맵 채집(해루질) 필드 시스템 (121차) — RegionFieldScene에 붙는 컨트롤러.
 *
 * 역할: ① 어촌계 어장(마을어장·협동양식장) 폴리곤 오버레이 + 진입 안내
 *      ② 지형 규칙으로 채집 스팟 후보(갯바위·사석 발밑·안벽·웅덩이 · 224차 얕은 물)를 만들고 시간 시드로 롤링
 *      ③ 야간 랜턴 반경 가시성 · [F] → 손놀림 놀이(224차 — `ui/ForageGamePanel`) · 결과(쿨러/인벤/미끼·도감·다침)
 *      ④ 강원 조례 위반 판정 → 적발 롤 → 압수 + 벌금
 *
 * 224차(사용자 지시): 테트라포드에서는 채집하지 않는다 · 물에 사는 생물은 장화를 신고 완만한 물가의
 * 얕은 물 한 칸에 들어가 잡는다 · 놓친 생물은 사라진다 · 달아나는 녀석(쫄장게 · 갯강구)은 다가가면 피한다.
 * 판정·수치는 전부 core(`ForagingEngine`·`TUNING.forage`) — 여기는 지형 후보 생성·렌더·입력만.
 *
 * 씬 결합은 `ForageHost` 인터페이스 하나 — 씬은 지형·플레이어·HUD 접근자만 넘긴다.
 */

import Phaser from 'phaser';
import {
  type FishFarm, type ForageCandidate, type ForageSpot, type ForageSpotKind, type ForageTool, type RegionTerrain,
  type ShoreCreature,
  SHORE_CREATURE_DATABASE, getCreatureById, FISH_FARM_KIND_LABEL, GANGWON_FORAGE_ORDINANCE,
  farmAt, isProtectedFarmKind, forageSeed, rollForageSpots, forageSafety, pickForageTool,
  isOrdinanceViolation, rollEnforcement, creatureTools, FORAGE_TOOL_LABEL,
  calculateTideInfo, isNightNow, checkSlipHazard, TUNING, kstParts,
  tideFlowStateAt, tideWaterLevel01, tideRegionK, forageTideMult, forageFloodWarning,
  forageBehaviorOf, isEastSeaRegion, rollForageHarvest, resolveLegal, forageInjuryRoll, forageLossLineKo, shallowWaterDepthM,
  type ForageGameState, type ForageHarvest,
  isToxinShellfish, toxinBanActive, toxinBanLabel,
} from '@tra/core';
import { GameState } from '../../store/GameState.js';
import { InventoryStore } from '../../store/InventoryStore.js';
import { CoolerStore } from '../../store/CoolerStore.js';
import { DiscoveryStore } from '../../store/DiscoveryStore.js';
import { ExternalDataStore } from '../../store/ExternalDataStore.js';
import { MultiplayerClient } from '../../net/MultiplayerClient.js';

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
  /** 183차 — 어장 경계 오버레이를 그릴지(dev 참고용). 없으면 그리지 않는다 */
  devFarmOverlay?: () => boolean;
  /** 224차 — 걸어 들어갈 수 있는 얕은 물 칸(0 아님 · 1 모래 · 2 바위 · 3 섞임) */
  wadeAt?: (c: number, r: number) => number;
  /** 224차 — 지금 얕은 물에 들어가 서 있는가 */
  wading?: () => boolean;
  /** 224차 — 달리는 중인가(달아나는 생물이 놀란다) */
  running?: () => boolean;
  /** 224차 — 손놀림 놀이 창을 연다(씬 팝업 스택) */
  openForageGame?: (c: ShoreCreature, tool: ForageTool, opts: { dex: number; underwater: boolean }, onEnd: (s: ForageGameState) => void) => void;
  /** 229차 — 벌금을 낼 돈이 없다 → 파산 연출(암전 · 처음부터) */
  bankrupt?: (fineWon: number) => void;
  /** 229차 — 알 밴 암컷을 놓아주는 혼잣말(초상 = 외포란 꽃게 그림) */
  noticeRelease?: (lines: string[], portraitKey: string, name: string) => void;
  /** 229차 — 어촌계 표지판 읽기 창 */
  openSignboard?: (farm: FishFarm) => void;
}

/**
 * 채집물 **아이템 아이콘** 텍스처 키 — 인벤토리·쿨러·상세보기가 쓴다.
 * 사용자 실사 도트가 있으면 BootScene이 같은 키로 먼저 싣는다(166차).
 */
export function forageTexKey(c: ShoreCreature): string {
  return `forage_${c.id}`;
}

/**
 * 필드 **스팟 표시용** 도트 텍스처 키 — 아이템 아이콘과 반드시 분리한다.
 * ⚠ 둘을 한 키로 쓰면 아이템 아이콘으로 실린 원본 해상도 사진(1254px)이
 *   필드에 그대로 그려진다(167차 실측 — 1881px 게 사진이 화면을 덮었다).
 */
export function forageSpotTexKey(c: ShoreCreature): string {
  return `forage_dot_${c.id}`;
}

/**
 * 해양생물 도트 텍스처를 굽는다 (필드 스팟 · 도감 공용 — 188차에 메서드에서 끌어냈다).
 * 텍스처 매니저는 게임 전역이라 한 번 구우면 어느 씬에서든 쓴다. 도감(AnglerLogScene)은
 * 메인 메뉴에서도 열리므로 필드를 거치지 않아도 그림이 있어야 한다 — 이모지 대신(§8-8).
 */
export function ensureForageDotTextures(scene: Phaser.Scene): void {
  const tex = scene.textures;
  for (const c of SHORE_CREATURE_DATABASE) {
    const key = forageSpotTexKey(c);
    if (tex.exists(key)) continue;
    const g = scene.add.graphics();
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
      case 'haliotis_diversicolor': // 오분자기 — 작은 청록 전복
        g.fillStyle(0x3c6b62, 1); g.fillEllipse(8, 8, 12, 8);
        g.fillStyle(0x8db39a, 1); g.fillEllipse(6, 7, 5, 3);
        g.lineStyle(1, 0x1c3939, 1); g.strokeEllipse(8, 8, 12, 8);
        break;
      case 'heliocidaris_crassispina': // 말똥성게 — 굵은 갈색 가시
        g.fillStyle(0x3f251d, 1); g.fillCircle(8, 8, 4);
        g.lineStyle(1, 0x8d5c3c, 1);
        for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; g.lineBetween(8, 8, 8 + Math.cos(a) * 8, 8 + Math.sin(a) * 8); }
        break;
      case 'aplysia_kurodai': // 참군소 — 낮은 갈색 몸
        g.fillStyle(0x6b5940, 1); g.fillEllipse(8, 9, 14, 7);
        g.fillStyle(0xa38a5e, 1); g.fillCircle(5, 7, 2); g.fillCircle(11, 7, 2);
        break;
      case 'hemigrapsus_sanguineus': // 쫄장게 — 작은 붉은 게
        g.fillStyle(0xb45a45, 1); g.fillEllipse(8, 8, 9, 6);
        g.lineStyle(1, 0xe08464, 1);
        for (let k = 0; k < 2; k++) { g.lineBetween(4, 7 + k * 3, 1, 5 + k * 4); g.lineBetween(12, 7 + k * 3, 15, 5 + k * 4); }
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
      case 'ligia_exotica': // 갯강구 — 납작한 회갈색 몸 + 더듬이
        g.fillStyle(0x5a5650, 1); g.fillEllipse(8, 8, 12, 6);
        g.fillStyle(0x7a766c, 1); for (let k = 0; k < 4; k++) g.fillRect(3 + k * 3, 6, 1, 4);
        g.lineStyle(1, 0x3a3630, 1); g.lineBetween(2, 7, 0, 3); g.lineBetween(2, 9, 0, 13); g.lineBetween(14, 8, 16, 6); g.lineBetween(14, 8, 16, 10);
        break;
      case 'perinereis_aibuhitensis': // 청갯지렁이 — 푸르스름한 마디 몸
        g.lineStyle(3, 0x4f6e6a, 1);
        g.beginPath(); g.moveTo(1, 10); g.lineTo(5, 6); g.lineTo(9, 10); g.lineTo(13, 6); g.lineTo(15, 8); g.strokePath();
        g.fillStyle(0x9ec0b0, 1); for (let k = 0; k < 4; k++) g.fillRect(2 + k * 4, 7, 1, 1);
        break;
      case 'marphysa_sanguinea': // 혼무시 — 굵고 붉은 갯지렁이
        g.lineStyle(4, 0x9a3a2e, 1);
        g.beginPath(); g.moveTo(1, 9); g.lineTo(5, 5); g.lineTo(10, 10); g.lineTo(15, 6); g.strokePath();
        g.fillStyle(0xd07060, 1); for (let k = 0; k < 4; k++) g.fillRect(3 + k * 3, 7, 1, 1);
        break;
      default: // 조개류 기본
        g.fillStyle(0xc8b898, 1); g.fillEllipse(8, 8, 12, 9);
        g.lineStyle(1, 0x8a7a5a, 1); g.strokeEllipse(8, 8, 12, 9);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }
}

/** 필드 스팟 도트의 표시 크기 상한 (px) — 키가 어긋나도 화면을 덮지 못하게 하는 안전망 */
const SPOT_MAX_PX = 28;


/**
 * 224차 — 놓친 · 잡은 스팟(이번 시간 슬롯 동안 다시 나오지 않는다). 씬을 다시 만들어도(맵 재진입) 남도록 모듈 전역.
 * 키 = `시드|스팟 id`. 시드(시간 슬롯)가 바뀌면 자연히 무효가 된다.
 */
const GONE = new Set<string>();

/** 224차 — 갯것 미끼 아이템(직접 잡은 쫄장게 · 갯강구). 갯지렁이는 상점 미끼와 같은 물건(inv_ragworm · inv_honmushi)으로 들어간다 */
const BAIT_TEMPLATES: Record<string, { name: string; iconTexture: string; basePrice: number }> = {
  inv_bait_shorecrab: { name: '쫄장게 (생미끼)', iconTexture: 'forage_hemigrapsus_sanguineus', basePrice: 400 },
  inv_bait_slater: { name: '갯강구 (생미끼)', iconTexture: 'forage_ligia_exotica', basePrice: 200 },
};

/** 달아나는 녀석 상태(스팟별 — 세션 메모리) */
interface RunnerState {
  /** 남은 도망 횟수 — 다 쓰면 바위 틈으로 숨어 사라진다 */
  flees: number;
  /** 다음 어슬렁 이동까지(ms) */
  roamMs: number;
  /** 다가가 있는 동안 놀람이 쌓인다 */
  nerve: number;
}

export class ForageSystem {
  private host: ForageHost;
  private farms: FishFarm[];
  private candidates: ForageCandidate[] = [];
  private spots: ForageSpot[] = [];
  private spotSprites = new Map<string, Phaser.GameObjects.Image>();
  private runners = new Map<string, RunnerState>();
  private farmG?: Phaser.GameObjects.Graphics;
  private farmLabels: Phaser.GameObjects.Text[] = [];
  private lastSeed = -1;
  private lastFarmName: string | null = null;
  private refreshAcc = 0;

  /** 현재 가장 가까운(상호작용 대상) 스팟 */
  private nearSpot: ForageSpot | null = null;
  /** 224차 — 손놀림 놀이 중인 스팟 */
  private playing: { spot: ForageSpot; creature: ShoreCreature; tool: ForageTool } | null = null;

  /** 채집 중인가(놀이 창이 열려 있다) — 생존 지표 드레인 활동 판정(125차) */
  get isHolding(): boolean {
    return this.playing !== null;
  }

  /** 229차 — 어촌계 표지판(보호 어장마다 뭍에 닿는 곳 하나). [F]로 읽는다 */
  private signs: { x: number; y: number; farm: FishFarm; img: Phaser.GameObjects.Image }[] = [];
  private nearSign: FishFarm | null = null;
  /** 229차 — 가까운 표지판의 어장(없으면 null). 씬의 [F] 선택지가 쓴다 */
  get nearSignFarm(): FishFarm | null { return this.nearSign; }
  /** 229차 — 표지판 읽기 창(호스트가 연다) */
  openSign(farm: FishFarm): void { this.host.openSignboard?.(farm); }

  constructor(host: ForageHost, farms: FishFarm[]) {
    this.host = host;
    this.farms = farms;
    this.ensureTextures();
    this.candidates = this.computeCandidates();
    this.drawFarms();
    this.placeSigns();
    this.refreshSpots(true);
  }

  /**
   * 229차 — 보호 어장(마을어장 · 협동양식장)마다 표지판 하나. 외곽 링 꼭짓점에서 가장 가까운 걷는 뭍 칸에 세운다.
   * 지도에는 어장을 그리지 않는다(사용자 지시 — 표지판만). 읽어야 안다.
   */
  private placeSigns(): void {
    const { tr, terrainAt, cols, rows } = this.host;
    const walkable = new Set<RegionTerrain>(['land', 'grass', 'road', 'sidewalk', 'sand', 'pier', 'paved', 'dirt', 'rock', 'deck', 'tidal']);
    const used = new Set<string>();
    const key = ensureFarmSignTexture(this.host.scene);
    for (const f of this.farms) {
      if (!isProtectedFarmKind(f.kind)) continue;
      const ring = f.rings[0];
      if (!ring || ring.length < 3) continue;
      let best: { c: number; r: number; d: number } | null = null;
      for (const [vx, vy] of ring) {
        const cx = Math.round(vx), cy = Math.round(vy);
        for (let rad = 0; rad <= 3 && (!best || best.d > rad); rad++) {
          for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
            const c = cx + dx, r = cy + dy;
            if (c < 1 || r < 1 || c >= cols - 1 || r >= rows - 1) continue;
            if (!walkable.has(terrainAt(c, r) as RegionTerrain) || used.has(`${c},${r}`)) continue;
            const d = Math.hypot(c + 0.5 - vx, r + 0.5 - vy);
            if (!best || d < best.d) best = { c, r, d };
          }
        }
      }
      if (!best) continue;
      used.add(`${best.c},${best.r}`);
      const x = best.c * tr + tr / 2, y = best.r * tr + tr * 0.9;
      const img = this.host.scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(6.4).setScale(2);
      this.signs.push({ x, y, farm: f, img });
    }
  }

  // ═══════════════════════════════════════════════════
  // 후보 타일 — 지형 규칙
  // ═══════════════════════════════════════════════════

  /**
   * 물에 인접한 뭍 타일 중:
   *  섬/암초 셀 · 갯바위 → rock_shore(웅덩이 = 물 3면) · 사석 → armor_foot · 상판·안벽 + 항만 물 → harbor_wall ·
   *  자연 뭍('land'/'grass')이 외해와 닿음 → rock_shore. 모래('sand')·도로·보도·건물은 제외.
   * 224차 — **테트라포드(3)는 제외**(사용자 지시) · 외해 쪽 상판 끝(발밑이 테트라포드)도 제외 ·
   *  걸어 들어갈 수 있는 얕은 물 칸(`wadeAt`)은 그 물 칸 자체가 `shallows` 후보(바닥 모래·바위·섞임).
   */
  private computeCandidates(): ForageCandidate[] {
    const { cols, rows, terrainAt } = this.host;
    const out: ForageCandidate[] = [];
    const water = (c: number, r: number): boolean => terrainAt(c, r) === 'water';
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const t = terrainAt(c, r);
        if (t === 'water') {
          const w = this.host.wadeAt?.(c, r) ?? 0;
          if (w > 0) out.push({ tx: c, ty: r, kind: 'shallows', substrate: w === 1 ? 'soft' : w === 2 ? 'rock' : 'mixed' });
          continue;
        }
        if (!t || t === 'building' || t === 'road' || t === 'sidewalk' || t === 'sand') continue;
        const wN = water(c, r - 1), wS = water(c, r + 1), wE = water(c + 1, r), wW = water(c - 1, r);
        const nWater = (wN ? 1 : 0) + (wS ? 1 : 0) + (wE ? 1 : 0) + (wW ? 1 : 0);
        if (nWater === 0) continue;
        let kind: ForageSpotKind | null = null;
        const bw = this.host.breakwaterClassAt?.(c, r) ?? 0;
        const islet = this.host.isIsletAt?.(c, r) ?? false;
        const harborNear = [[0, -1], [0, 1], [1, 0], [-1, 0]].some(([dc, dr]) => water(c + dc!, r + dr!) && (this.host.isHarborAt?.(c + dc!, r + dr!) ?? false));
        if (bw === 3) continue;                                                     // 224차 — 테트라포드 위에서는 채집하지 않는다
        if (islet) kind = nWater >= 3 ? 'tidepool' : 'rock_shore';
        else if (t === 'rock') kind = nWater >= 3 ? 'tidepool' : 'rock_shore';   // 188차 — 영금정 등 갯바위 `k`
        else if (bw === 2) kind = 'armor_foot';                                    // 사석(돌무더기) 발밑
        else if (bw === 1 || t === 'pier') kind = harborNear ? 'harbor_wall' : null;   // 외해 쪽 상판 끝 = 발밑이 테트라포드
        else if (t === 'land' || t === 'grass') kind = harborNear ? 'harbor_wall' : nWater >= 3 ? 'tidepool' : 'rock_shore';
        if (kind) out.push({ tx: c, ty: r, kind });
      }
    }
    return out;
  }

  /** 후보 통계 (dev/검증용) */
  candidateStats(): Record<ForageSpotKind, number> {
    const s: Record<ForageSpotKind, number> = { rock_shore: 0, armor_foot: 0, tidepool: 0, harbor_wall: 0, shallows: 0 };
    for (const c of this.candidates) s[c.kind]++;
    return s;
  }

  // ═══════════════════════════════════════════════════
  // 환경
  // ═══════════════════════════════════════════════════

  private env(): { month: number; isNight: boolean; windSpeedMs: number; waveHeightM: number; tideLevel01: number; hasAdvancedLicense: boolean; currentStrength: number; tideMult: number; floodWarn: boolean } {
    const kma = ExternalDataStore.getKmaWeather(this.host.regionId);
    const marine = ExternalDataStore.getRegionMarineWeather(this.host.regionId);
    const tide = calculateTideInfo();
    // 205차 — 수위는 물때 흐름(만조·간조 시각)에서 잇는다 · 동해는 간만이 작아 「물 빠짐」이 덜하다
    const flow = tideFlowStateAt();
    const k = tideRegionK(this.host.regionId);
    const level = 1 - (1 - tideWaterLevel01(flow)) * k;
    return {
      // 232차 — 월 · 일은 KST(OS 시간대가 다른 사람끼리 금어기 · 스팟 풀이 하루 어긋나지 않게)
      month: Number(kstParts().mo),
      isNight: isNightNow(),
      windSpeedMs: kma?.windSpeedMs ?? marine?.windSpeedMs ?? 4,
      waveHeightM: ExternalDataStore.getWaveHeightM(this.host.regionId) ?? 0.5,
      tideLevel01: Math.max(0, Math.min(1, level)),
      hasAdvancedLicense: GameState.hasLicense('shore_hunting_advanced'),
      currentStrength: tide.currentStrength,
      // 222차 「물 빠진 길」 — 간조 창 안의 보너스 몫만 키운다(창 밖은 정확히 1)
      tideMult: 1 + (forageTideMult(flow, tide.currentStrength, k) - 1) * GameState.skillMult('forage_tide'),
      floodWarn: forageFloodWarning(flow) && k >= 0.5,
    };
  }

  /** 224차 — 지금 물가 수위(0 간조 ~ 1 만조) — 씬이 얕은 물 수심(1m 미만 판정)에 쓴다 */
  tideLevel01(): number { return this.env().tideLevel01; }

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
    // 232차 — 멀티에서 같은 자리에 같은 생물이 뜨도록 **개인 상태(면허)를 추첨에서 뺀다**.
    //   전엔 면허가 있으면 풀이 달라져 같은 칸에 A는 해삼, B는 홍합이 보였다. 이제 모두 같은 표를 굴리고,
    //   면허가 없는 사람에게는 그 생물만 **안 보이게** 거른다. (스킬로 늘어나는 스팟 수는 같은 순서의 앞부분이
    //   겹치므로 그대로 둔다 — 많이 보는 사람만 뒤쪽 몇 개를 더 본다.)
    this.spots = rollForageSpots(this.candidates, {
      seed, month: e.month, isNight: e.isNight, tideLevel01: e.tideLevel01,
      hasAdvancedLicense: true, farms: this.farms,
      // 205차 — 간조 시간창(간조 2시간 전 ~ 1시간 뒤)이면 스팟이 더 드러난다
      maxSpots: Math.round(TUNING.forage.maxSpots * e.tideMult),
      eastSea: isEastSeaRegion(this.host.regionId),   // 224차 — 동해엔 없는 · 드문 종
      day: Number(kstParts().d), regionId: this.host.regionId,   // 227차 — 금어기 날짜 단위 · 지역 규정
    }).filter((s) => !this.isGone(seed, s.id)   // 224차 — 놓친 · 잡은 것은 이번 슬롯에 다시 나오지 않는다 · 232차 남이 가져간 것도
      && (e.hasAdvancedLicense || getCreatureById(s.creatureId)?.requiredLicense !== 'shore_hunting_advanced'));
    this.runners.clear();
    for (const s of this.spots) {
      const c = getCreatureById(s.creatureId);
      if (c && forageBehaviorOf(c) === 'runner') this.runners.set(s.id, { flees: 2, roamMs: 1500 + Math.random() * 3000, nerve: 0 });
    }
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
      const img = this.host.scene.add.image(s.tx * tr + tr / 2, s.ty * tr + tr * 0.72, forageSpotTexKey(c))
        .setOrigin(0.5, 1).setDepth(6.5).setScale(1.5).setVisible(false);
      // 안전망 — 어떤 이유로든 큰 텍스처가 들어오면 스팟 크기로 줄인다(화면 덮기 방지)
      const raw = Math.max(img.width, img.height);
      if (raw > SPOT_MAX_PX) img.setScale(SPOT_MAX_PX / raw);
      // 물속 생물은 물빛에 잠겨 보인다
      if (s.kind === 'shallows') img.setAlpha(0.8).setTint(0xb8d8f0);
      this.spotSprites.set(s.id, img);
    }
  }

  /** 카테고리별 도트 아이콘 (실사 에셋 교체 자리 — spriteKey는 DB에 예약) */
  private ensureTextures(): void {
    ensureForageDotTextures(this.host.scene);
  }

  // ═══════════════════════════════════════════════════
  // 어장 오버레이
  // ═══════════════════════════════════════════════════

  private drawFarms(): void {
    // 183차 — 어장 경계(주황 점선·반투명 면·라벨)는 필드에 그리지 않는다(사용자: "노란색 점선 경계선이
    //   뭔지 모르겠음 — 삭제"). 판정(조례 적발·채집 금지)은 그대로이고, 구역 진입은 채널 로그가 알린다.
    //   dev 편집기(F7)가 열려 있을 때만 참고용으로 그린다.
    if (!(import.meta.env.DEV && this.host.devFarmOverlay?.())) return;
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
  // 업데이트 — 가시성 · 근접 · 달아나는 녀석
  // ═══════════════════════════════════════════════════

  /**
   * 205차 — 간조 1시간 뒤부터는 물이 차오른다. 한 번만 혼잣말로 알린다(남해·서해 — 동해는 간만이 작아 생략).
   * @returns 알렸는가
   */
  private maybeFloodWarning(): boolean {
    const e = this.env();
    if (!e.floodWarn) { this.floodWarned = false; return false; }
    if (this.floodWarned) return false;
    this.floodWarned = true;
    this.host.pushLog('[채집] 물이 다시 들어오기 시작했다. 너무 깊이 들어가지 말자.');
    return true;
  }
  private floodWarned = false;

  update(deltaMs: number): void {
    this.refreshAcc += deltaMs;
    if (this.refreshAcc > 30_000) { this.refreshAcc = 0; this.refreshSpots(); }
    this.sweepTaken(deltaMs);

    const p = this.host.player();
    const tr = this.host.tr;
    const night = isNightNow();
    const lm = this.lampLumens();
    // 스킬 채집 눈(122차) — 발견 반경 배율
    // 222차 「헤드랜턴 효율」 — 밤 랜턴 반경만
    const radiusTiles = (night ? (lm / 100) * TUNING.forage.lampRadiusPer100lm * GameState.skillMult('lantern_range') : TUNING.forage.dayRadiusTiles) * GameState.skillMult('forage_radius');
    const radiusPx = radiusTiles * tr;

    // 어장 진입 안내 (1회/진입)
    const farm = farmAt(this.farms, p.x / tr, p.y / tr);
    const fname = farm?.name ?? null;
    if (fname !== this.lastFarmName) {
      this.lastFarmName = fname;
      if (farm && isProtectedFarmKind(farm.kind)) {
        this.host.pushLog(`[어장] ${farm.name} — 어촌계 ${FISH_FARM_KIND_LABEL[farm.kind]} 구역: 전복·해삼·성게·홍합·문어 채취 금지 (강원 조례)`);
        // 229차 — 파산 힌트: 벌금은 정액 1천만원이고 못 내면 끝이다. 처음 들어왔을 때는 표지판을 가리킨다
        this.host.pushLog(`[어장] 적발되면 벌금 ${TUNING.forage.fineCapWon.toLocaleString()}원 — 그만한 돈이 없으면 파산이다`);
        if (!GameState.getFlag('sign.farm_read')) this.host.floatingHint('물가에 표지판이 서 있다 — 가까이 가서 읽어 본다');
      }
    }

    // 224차 — 달아나는 녀석: 어슬렁거리고, 뛰어 다가오면 · 오래 곁에 있으면 피한다
    if (!this.playing) this.updateRunners(deltaMs, p);

    // 가시성 — 낮: 랜턴 불요 생물만 / 밤: 랜턴 반경 안
    let nearest: ForageSpot | null = null;
    let bestD = tr * 1.7;
    for (const s of this.spots) {
      const img = this.spotSprites.get(s.id);
      if (!img) continue;
      const d = Math.hypot(img.x - p.x, img.y - p.y);
      const visible = night ? (lm > 0 && d <= radiusPx) : (s.minLampLumens === 0 && d <= Math.max(radiusPx, tr * 12));
      img.setVisible(visible);
      const baseA = s.kind === 'shallows' ? 0.8 : 1;
      if (visible) img.setAlpha(baseA * (night ? Phaser.Math.Clamp(1.2 - d / Math.max(1, radiusPx), 0.35, 1) : 1));
      if (visible && d < bestD) { bestD = d; nearest = s; }
    }
    this.nearSpot = nearest;

    // 힌트 — 186차: 머리 위 문구는 씬의 [F] 안내 하나로 합친다. 여기서는 문장만 만들고 씬이 그린다.
    this.nearHint = null;
    if (nearest && !this.host.blocked() && !this.playing) {
      this.nearHint = this.hintFor(nearest);
    }
    // 229차 — 표지판 근접(1.6칸)
    this.nearSign = null;
    let sd = tr * 1.6;
    for (const sg of this.signs) {
      const d = Math.hypot(sg.x - p.x, sg.y - tr * 0.4 - p.y);
      if (d < sd) { sd = d; this.nearSign = sg.farm; }
    }
  }

  /** 가까운 스팟 안내 문장(허가 · 도구 · 장화 · 수심) */
  private hintFor(s: ForageSpot): string {
    const c = getCreatureById(s.creatureId)!;
    const tool = pickForageTool(c, this.ownedTools());
    const needLic = c.requiredLicense !== null && !GameState.hasLicense('shore_hunting_basic');
    if (needLic) return `${c.nameKo} — 해루질 입문 허가 필요 (L)`;
    if (s.kind === 'shallows' && !(this.host.wading?.() ?? false)) {
      if (!InventoryStore.wearingWaders) return `${c.nameKo} — 물속이다. 장화를 신어야 들어간다`;
      if (shallowWaterDepthM(this.env().tideLevel01) >= 1) return `${c.nameKo} — 물이 차서 들어갈 수 없다`;
      return `${c.nameKo} — 물에 들어가야 손이 닿는다`;
    }
    if (!tool) return `${c.nameKo} — ${creatureTools(c).map((t) => FORAGE_TOOL_LABEL[t]).join('/')} 필요`;
    return `[F] 채집 — ${c.nameKo} (${FORAGE_TOOL_LABEL[tool]})`;
  }

  /**
   * 224차 — 달아나는 녀석(쫄장게 · 갯강구 · 게). 몇 초마다 이웃 칸으로 어슬렁 옮기고,
   * 뛰어서 3칸 안으로 오거나 1.7칸 안에 오래 서 있으면 2~5칸 떨어진 같은 종류 자리로 튄다.
   * 두 번 튀고 나면 바위 틈으로 숨어 사라진다(이번 시간 슬롯 동안).
   */
  private updateRunners(deltaMs: number, p: { x: number; y: number }): void {
    const tr = this.host.tr;
    const running = this.host.running?.() ?? false;
    for (const s of [...this.spots]) {
      const st = this.runners.get(s.id);
      if (!st) continue;
      const img = this.spotSprites.get(s.id);
      if (!img) continue;
      const d = Math.hypot(img.x - p.x, img.y - p.y) / tr;
      const spooked = (running && d < 3) || (d < 1.7 && (st.nerve += deltaMs) > 2200);
      if (d >= 1.7) st.nerve = Math.max(0, st.nerve - deltaMs);
      if (spooked) {
        st.nerve = 0;
        if (st.flees <= 0 || !this.hopSpot(s, p, 2, 5)) {
          this.markGone(s);
          if (img.visible) this.host.floatingHint(`${getCreatureById(s.creatureId)?.nameKo ?? ''}이(가) 바위 틈으로 숨어 버렸다`);
          continue;
        }
        st.flees -= 1;
        continue;
      }
      st.roamMs -= deltaMs;
      if (st.roamMs <= 0) {
        st.roamMs = 2000 + Math.random() * 3500;
        this.hopSpot(s, null, 1, 1);
      }
    }
  }

  /** 같은 종류 후보 칸으로 스팟을 옮긴다(멀어지는 쪽 우선). 옮겼으면 true */
  private hopSpot(s: ForageSpot, away: { x: number; y: number } | null, minT: number, maxT: number): boolean {
    const tr = this.host.tr;
    const taken = new Set(this.spots.map((x) => `${x.tx},${x.ty}`));
    const opts = this.candidates.filter((c) => c.kind === s.kind && !taken.has(`${c.tx},${c.ty}`)
      && Math.max(Math.abs(c.tx - s.tx), Math.abs(c.ty - s.ty)) >= minT
      && Math.max(Math.abs(c.tx - s.tx), Math.abs(c.ty - s.ty)) <= maxT);
    if (!opts.length) return false;
    let pick = opts[Math.floor(Math.random() * opts.length)]!;
    if (away) {
      const dist = (c: ForageCandidate): number => Math.hypot(c.tx * tr - away.x, c.ty * tr - away.y);
      pick = opts.reduce((a, b) => (dist(b) > dist(a) ? b : a));
    }
    s.tx = pick.tx; s.ty = pick.ty;
    const img = this.spotSprites.get(s.id);
    if (img) {
      this.host.scene.tweens.killTweensOf(img);
      this.host.scene.tweens.add({ targets: img, x: s.tx * tr + tr / 2, y: s.ty * tr + tr * 0.72, duration: away ? 220 : 600, ease: away ? 'Quad.easeOut' : 'Sine.easeInOut' });
    }
    return true;
  }

  private markGone(s: ForageSpot): void {
    GONE.add(`${this.lastSeed}|${s.id}`);
    void MultiplayerClient.takeWorld(this.worldKey(this.lastSeed, s.id));   // 232차 — 다른 사람 화면에서도 사라진다
    this.removeSpot(s.id);
  }

  /** 232차 — 세션 공유 키(`f:시드|스팟`) */
  private worldKey(seed: number, id: string): string { return `f:${seed}|${id}`; }

  /** 224차 · 232차 — 이번 슬롯에 내가 놓쳤거나 잡았거나, **같은 세션의 누군가 가져간** 스팟 */
  private isGone(seed: number, id: string): boolean {
    return GONE.has(`${seed}|${id}`) || MultiplayerClient.isWorldTaken(this.worldKey(seed, id));
  }

  /** 232차 — 남이 가져간 스팟을 화면에서 걷는다(0.5초마다). 내가 놀이 중인 스팟은 결과에 맡긴다 */
  private takenAcc = 0;
  private sweepTaken(deltaMs: number): void {
    this.takenAcc += deltaMs;
    if (this.takenAcc < 500 || !MultiplayerClient.isConnected) return;
    this.takenAcc = 0;
    for (const s of [...this.spots]) {
      if (this.playing?.spot.id === s.id) continue;
      if (MultiplayerClient.isWorldTaken(this.worldKey(this.lastSeed, s.id))) this.removeSpot(s.id);
    }
  }


  // ═══════════════════════════════════════════════════
  // 입력 — [F] 누르면 손놀림 놀이 (224차 — 구: 홀드 게이지)
  // ═══════════════════════════════════════════════════

  /** 186차 — 가까운 스팟의 안내 문장(허가·도구 상태 포함). 씬의 머리 위 [F] 안내가 쓴다 */
  get nearHintKo(): string | null { return this.nearHint; }
  private nearHint: string | null = null;

  /** 178차 — 상호작용 겹침 판정용 프로브. 근처 채집 스팟의 생물 이름(없으면 null) */
  get nearSpotNameKo(): string | null {
    if (!this.nearSpot) return null;
    return getCreatureById(this.nearSpot.creatureId)?.nameKo ?? null;
  }

  /** 씬 keydown-F — 소비했으면 true */
  onInteractKey(): boolean {
    if (this.playing) return true;
    if (this.host.blocked()) return false;   // 186차 — 상판 위 등
    const s = this.nearSpot;
    if (!s) return false;
    const c = getCreatureById(s.creatureId);
    if (!c) return false;
    if (c.requiredLicense !== null && !GameState.hasLicense('shore_hunting_basic')) {
      this.host.floatingHint('해루질 입문 허가가 필요합니다 — L 면허 창');
      return true;
    }
    // 224차 — 물속 생물은 장화를 신고 들어가야 닿는다
    if (s.kind === 'shallows' && !(this.host.wading?.() ?? false)) {
      this.host.floatingHint(this.hintFor(s));
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
    if (s.kind === 'rock_shore' || s.kind === 'armor_foot' || s.kind === 'shallows') {
      const slip = checkSlipHazard(safety.slipChance * GameState.skillMult('balance'), GameState.player.stamina, GameState.player.fatigue);
      if (slip.slipped) {
        GameState.updatePlayer({ stamina: Math.max(0, GameState.player.stamina - Math.max(8, Math.round(slip.staminaLost * 0.4))) });
        const p = this.host.player();
        const dx = p.x - (s.tx * this.host.tr + this.host.tr / 2), dy = p.y - (s.ty * this.host.tr + this.host.tr / 2);
        const l = Math.hypot(dx, dy) || 1;
        this.host.knockback(dx / l, dy / l);
        this.host.scene.cameras.main.shake(160, 0.005);
        this.host.floatingHint(safety.warning ? '너울에 미끄러졌다! 갯바위 주의' : '이끼에 미끄러졌다!');
        // 125차: 단발 HP 감소 → 상태이상 승격 (골절 20% / 출혈 35%) · 127차 면역력 경유
        const r = Math.random();
        const hurt = r < 0.2 ? (GameState.rollStatus('fracture', 1) ? '골절' : '')
          : r < 0.55 ? (GameState.rollStatus('bleed', 1) ? '출혈' : '') : '';
        this.host.pushLog(hurt
          ? `[안전] 갯바위에서 미끄러졌습니다 — HP 감소 · ${hurt}`
          : '[안전] 갯바위에서 미끄러졌습니다 — HP 감소');
        return true;
      }
    }
    if (safety.warning) this.host.floatingHint(safety.warning);
    if (!this.host.openForageGame) return false;
    this.playing = { spot: s, creature: c, tool };
    // 손재주 — 채집 손놀림 스킬(gath_speed) 배율을 0~1로 펼친다
    const dex = Math.max(0, Math.min(1, (GameState.skillMult('forage_speed') - 1) * 2));
    const open = (): void => { this.host.openForageGame?.(c, tool, { dex, underwater: s.kind === 'shallows' }, (st) => this.finishGame(st)); };
    if (!MultiplayerClient.isConnected) { open(); return true; }
    // 232차 — 멀티: 손대는 순간 「내 것」이라고 먼저 알린다. 거의 동시에 둘이 잡으면 서버에 먼저 닿은 사람이 임자
    const seed = this.lastSeed;
    void MultiplayerClient.takeWorld(this.worldKey(seed, s.id)).then((mine) => {
      if (this.playing?.spot !== s) return;
      if (mine) { open(); return; }
      this.playing = null;
      GONE.add(`${seed}|${s.id}`);
      this.removeSpot(s.id);
      this.host.floatingHint(`다른 사람이 먼저 ${c.nameKo}을(를) 가져갔다`);
    });
    return true;
  }

  private removeSpot(id: string): void {
    this.spots = this.spots.filter((s) => s.id !== id);
    this.runners.delete(id);
    const img = this.spotSprites.get(id);
    if (img) { img.destroy(); this.spotSprites.delete(id); }
  }

  /** 224차 — 놀이가 끝났다(이김 · 놓침 · 포기). 어느 쪽이든 그 생물은 이번 슬롯에서 사라진다 */
  private finishGame(st: ForageGameState): void {
    const h = this.playing;
    if (!h) return;
    this.playing = null;
    this.markGone(h.spot);
    this.maybeFloodWarning();
    const c = h.creature;
    if (st.status !== 'won') {
      const line = forageLossLineKo(c.nameKo, st.lost ?? 'escaped');
      this.host.floatingHint(line);
      this.host.pushLog(`[채집] ${line}`);
      return;
    }
    // 손으로 잡았으면 다칠 수 있다 — 장갑이면 덜 다치고 대개 놓치지 않는다
    const inj = forageInjuryRoll(c, h.tool, InventoryStore.wearingGloves, Math.random, GameState.skillMult('hand_injury'));
    if (inj.injured) {
      GameState.updatePlayer({ stamina: Math.max(0, GameState.player.stamina - TUNING.forage.handInjuryStamina) });
      this.host.scene.cameras.main.shake(140, 0.004);
      const stName = inj.status && GameState.rollStatus(inj.status, 1) ? (inj.status === 'bio_poison' ? '생물중독' : '출혈') : '';
      const msg = inj.dropped
        ? `${c.nameKo}에 손을 다쳐 놓쳤다${stName ? ` · ${stName}` : ''}`
        : `${c.nameKo}에 손을 조금 다쳤다${stName ? ` · ${stName}` : ''}`;
      this.host.floatingHint(msg);
      this.host.pushLog(`[채집] ${msg}`);
      if (inj.dropped) return;
    }
    const res = rollForageHarvest(c, Math.random, this.host.regionId, this.env().month);
    if (res.undersized) {
      const msg = `${c.nameKo} ${res.sizeCm}cm — 법정 크기(${resolveLegal(c, this.host.regionId).minLegalSizeCm}cm) 미달, 놓아주었다`;
      this.host.floatingHint(msg);
      this.host.pushLog(`[채집] ${msg}`);
      return;
    }
    // 229차 — 알 밴 암컷(외포란)은 뒤집어 보고 바로 놓아준다(사용자 지시 — 자동 방생)
    if (res.berried) {
      const msg = `${c.nameKo} ${res.sizeCm}cm — 배딱지에 알을 품은 암컷, 놓아주었다`;
      this.host.pushLog(`[채집] ${msg}`);
      if (this.host.noticeRelease) {
        this.host.noticeRelease([
          `${c.nameKo}를 뒤집어 보니 배딱지가 둥글고 넓다. 암컷이다.`,
          '배딱지 밑에 알이 주황빛으로 꽉 차 있다. 이 녀석이 품은 알이 다음 철의 게다.',
          '물가에 내려놓자 옆걸음으로 금세 물속으로 사라졌다.',
        ], 'forage_berried_crab', '알 밴 암컷');
      } else this.host.floatingHint(msg);
      return;
    }
    this.deliver(h.spot, c, res);
  }

  /** 수확물을 넣는다 — 미끼 갯것은 미끼 아이템으로, 그 밖은 쿨러(활어) 우선 · 인벤토리(채집물) */
  private deliver(spot: ForageSpot, c: ShoreCreature, res: ForageHarvest): void {
    // 224차 — 직접 잡은 미끼(갯지렁이 · 혼무시 · 쫄장게 · 갯강구)는 바로 바늘에 다는 미끼로
    if (c.baitItemId) {
      const seed = InventoryStore.seedTemplate(c.baitItemId);
      const extra = BAIT_TEMPLATES[c.baitItemId];
      const tpl = seed ?? (extra ? {
        id: c.baitItemId, name: extra.name, icon: '', iconTexture: extra.iconTexture,
        category: 'tackle' as const, subCategory: '생미끼', basePrice: extra.basePrice, condition: 'live' as const, equippable: false,
      } : null);
      if (tpl && InventoryStore.addItem({ ...tpl, conditionSinceMs: Date.now() }, 1)) {
        DiscoveryStore.record('creature', c.id, 'night_hunting');
        GameState.addActivityXp('forage');
        this.host.floatingHint(`${c.nameKo} — 미끼로 쓸 수 있다`);
        this.host.pushLog(`[채집] ${c.nameKo} ${res.sizeCm}cm — 가방(미끼)`);
        this.host.scene.cameras.main.flash(120, 40, 160, 90);
        return;
      }
      this.host.floatingHint('가방이 가득 찼습니다 — 놓아주었습니다');
      return;
    }
    const tex = forageTexKey(c);
    // 229차 — 패류독소: 채취 금지 기간(해역별 발령)에 캔 홍합 · 바지락 · 굴은 독 표식이 붙는다(채취는 되지만 먹으면 식중독 확률)
    const toxin = isToxinShellfish(c.id) && toxinBanActive(this.host.regionId, new Date());
    let where: 'cooler' | 'inventory' | 'none' = 'none';
    let coolerIdx = -1;
    let invId = '';
    if (InventoryStore.hasCooler() && !CoolerStore.isFull()) {
      coolerIdx = CoolerStore.add({ speciesId: c.id, nameKo: c.nameKo, lengthCm: res.sizeCm, weightG: res.weightG, sex: res.sex ?? 'F', iconTexture: tex, ...(toxin ? { toxin: true } : {}) });
      if (coolerIdx >= 0) where = 'cooler';
    }
    if (where === 'none') {
      invId = `inv_forage_${c.id}_${InventoryStore.nextCatchSeq()}`;
      const ok = InventoryStore.addItem({
        id: invId, name: `${c.nameKo} (${res.sizeCm}cm)`, icon: '', iconTexture: tex,
        category: 'food', subCategory: '채집물',
        basePrice: Math.max(500, Math.round((res.weightG / 1000) * c.marketValuePerKg)),
        condition: 'live', equippable: false,
        speciesId: c.id, lengthCm: res.sizeCm, weightG: res.weightG, forageCatch: true,
        ...(res.sex ? { sex: res.sex } : {}), ...(toxin ? { toxin: true } : {}),
      }, 1);
      if (ok) where = 'inventory';
    }
    if (where === 'none') {
      this.host.floatingHint('쿨러와 인벤토리가 가득 찼습니다 — 놓아주었습니다');
      return;
    }
    DiscoveryStore.record('creature', c.id, 'night_hunting');
    GameState.addActivityXp('forage');   // 플레이어 레벨 XP (124차 — 수확 1회)
    this.host.floatingHint(`${c.nameKo} ${res.weightG}g 채집!`);
    this.host.pushLog(`[채집] ${c.nameKo} ${res.weightG}g — ${where === 'cooler' ? '쿨러 보관' : '인벤토리(채집물)'}`);
    this.host.scene.cameras.main.flash(120, 40, 160, 90);
    if (toxin) {
      const lbl = toxinBanLabel(this.host.regionId, new Date());
      this.host.pushLog(`[주의] 패류독소 채취 금지 기간(${lbl ?? '발령 중'})에 캔 ${c.nameKo} — 익혀도 독이 남는다. 먹으면 탈이 날 수 있다`);
    }

    // ── 강원 조례 — 어촌계 어장 안 보호 5종 → 적발 롤 ──
    const farm = farmAt(this.farms, spot.tx + 0.5, spot.ty + 0.5);
    // ── 171차 · 어장 행사료 ── 어촌계 어장은 남의 앞마당이다. 그 안에서 거둬 가면 행사료를 낸다.
    if (farm) {
      const fee = GameState.fisheryGroundFeeKrw();
      if (fee > 0 && GameState.addCoins(-fee, false, 'fee')) {
        this.host.pushLog(`[어장] ${farm.name} 행사료 ${fee.toLocaleString()}원 납부`);
      }
    }
    // 수협 조합원증(어업인 등록)은 조례 면제 (122차 면허)
    if (farm && !GameState.hasLicense('fishery_member') && isOrdinanceViolation(c.id, farm)) {
      // 171차 — 자격 갱신 연체 중이면 단속이 더 붙는다
      const enf = rollEnforcement(GameState.player.inventory.coins, Math.random, GameState.upkeepPenalty().enforceMult);
      if (enf.caught) {
        if (where === 'cooler') CoolerStore.removeAt(coolerIdx);
        else InventoryStore.removeQty(invId, 1);
        this.host.scene.cameras.main.flash(260, 200, 40, 40);
        this.host.scene.cameras.main.shake(200, 0.006);
        // 229차 — 벌금 정액 1천만원. 가진 돈으로 바로 낼 수 있으면 잃고, 모자라면 파산(암전 · 처음부터 — 사용자 지정)
        const coins = GameState.player.inventory.coins;
        if (enf.fineWon > 0 && coins < enf.fineWon) {
          this.host.pushLog(`[단속] ${farm.name}(${FISH_FARM_KIND_LABEL[farm.kind]}) 안 ${c.nameKo} 채취 적발 — 압수 · 벌금 ${enf.fineWon.toLocaleString()}원. 낼 돈이 없다`);
          if (this.host.bankrupt) { this.host.bankrupt(enf.fineWon); return; }
        }
        if (enf.fineWon > 0) GameState.addCoins(-enf.fineWon, false, 'fine');
        GameState.markDirty();
        this.host.floatingHint(`단속 적발! ${c.nameKo} 압수 · 벌금 ${enf.fineWon.toLocaleString()}원`);
        this.host.pushLog(`[단속] ${farm.name}(${FISH_FARM_KIND_LABEL[farm.kind]}) 안 ${c.nameKo} 채취 적발 — 압수 · 벌금 ${enf.fineWon.toLocaleString()}원 (조례 상한 ${GANGWON_FORAGE_ORDINANCE.fineMaxWon.toLocaleString()}원)`);
      } else {
        this.host.pushLog(`[주의] ${farm.name} 안 ${c.nameKo} 채취 — 강원 조례 위반 (적발 시 압수·벌금)`);
      }
    }
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
    if (forageBehaviorOf(c) === 'runner') this.runners.set(s.id, { flees: 2, roamMs: 99_999, nerve: 0 });
    else this.runners.delete(s.id);
    const img = this.spotSprites.get(s.id);
    if (img) img.setTexture(forageSpotTexKey(c));
  }
  /** dev: 지금 놀이를 이긴 것으로 끝낸다(하네스) */
  devResolveNow(won = true): void {
    if (!this.playing) return;
    const fake = { kind: 'pick', creatureId: this.playing.creature.id, tool: this.playing.tool, t: 0, limitMs: 1, status: won ? 'won' : 'lost', lost: won ? undefined : 'escaped' } as ForageGameState;
    this.finishGame(fake);
  }
  /** dev: 근처 스팟(하네스) */
  get devNearSpot(): ForageSpot | null { return this.nearSpot; }

  destroy(): void {
    for (const img of this.spotSprites.values()) img.destroy();
    this.spotSprites.clear();
    this.farmG?.destroy();
    for (const t of this.farmLabels) t.destroy();
    for (const sg of this.signs) sg.img.destroy();
    this.signs = [];
  }
}

/** 229차 — 어촌계 표지판 그림(절차 픽셀 · 24x30). 기둥 + 흰 판 + 붉은 띠 + 글줄 자국 */
function ensureFarmSignTexture(scene: Phaser.Scene): string {
  const key = 'px_farm_sign';
  if (scene.textures.exists(key)) return key;
  const g = scene.add.graphics();
  // 기둥
  g.fillStyle(0x5a3b1e, 1); g.fillRect(10, 14, 4, 16);
  g.fillStyle(0x3b2612, 1); g.fillRect(13, 14, 1, 16);
  // 판 테두리 · 면
  g.fillStyle(0x2b2b2b, 1); g.fillRect(0, 0, 24, 16);
  g.fillStyle(0xf2efe4, 1); g.fillRect(1, 1, 22, 14);
  // 붉은 띠(금지)
  g.fillStyle(0xc8352a, 1); g.fillRect(1, 1, 22, 4);
  g.fillStyle(0xffffff, 1); g.fillRect(4, 2, 2, 2); g.fillRect(8, 2, 2, 2); g.fillRect(12, 2, 2, 2); g.fillRect(16, 2, 2, 2);
  // 글줄 자국
  g.fillStyle(0x3a3a3a, 1); g.fillRect(3, 7, 18, 2); g.fillRect(3, 11, 12, 2);
  g.generateTexture(key, 24, 30);
  g.destroy();
  return key;
}
