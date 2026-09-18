/**
 * @file TrapFieldSystem.ts
 * @description 인-맵 통발 필드 시스템 (121차) — 설치(아이템 소모·미끼 소모·실측 수심) · 부표 렌더 · 수거([E]) · 분실 · 반환.
 *
 * 레거시 TrapScene(별도 씬·추상 지도)을 대체한다. 통발은 **아이템으로 소유**(직판장 구매) → 물가에서 T 또는
 * 인벤 '통발 놓기' → 던질 수 있는 물 타일(플레이어 4타일 이내 · 육지 거리 ≤ 3타일)에 설치 → wall-clock 침지
 * (S14 §6 불변조건 — 게임 시계가 실시간) → [E] 수거. 수거 시 분실 롤(조류·침지·내구도 — core `rollTrapLoss`)
 * 1회, 살아 있으면 포획물을 쿨러/인벤으로 보내고 통발 아이템을 되돌려 준다(내구도 0이면 파손).
 * 산란기 도루묵(10~12월) 포획은 강원 조례 위반 → 적발 롤(채집과 같은 규칙).
 */

import Phaser from 'phaser';
import {
  type DeployedTrap, type RegionTerrain, type SpotType, type TrapSpec, type TrapCatchItem,
  getTrapById, getCreatureById, FISH_DATABASE,
  harvestTrap, rollTrapLoss, validateTrapDeployment, getNextOptimalHarvestTime,
  trapSeasonViolations, rollEnforcement, GANGWON_FORAGE_ORDINANCE,
  calculateTideInfo, TUNING,
} from '@tra/core';
import { GameState } from '../../store/GameState.js';
import { MultiplayerClient } from '../../net/MultiplayerClient.js';
import { StoryStore } from '../../store/StoryStore.js';
import { InventoryStore, type InvItem } from '../../store/InventoryStore.js';
import { CoolerStore } from '../../store/CoolerStore.js';
import { DiscoveryStore } from '../../store/DiscoveryStore.js';
import { resolveFishTexture } from '../../data/FishTextures.js';
import { forageTexKey } from './ForageSystem.js';

export interface TrapHost {
  scene: Phaser.Scene;
  tr: number;
  cols: number;
  rows: number;
  regionId: string;
  mapKey: string;
  terrainAt: (c: number, r: number) => RegionTerrain | undefined;
  waterDistAt?: (c: number, r: number) => number;
  breakwaterClassAt?: (c: number, r: number) => number;
  isIsletAt?: (c: number, r: number) => boolean;
  /** 물 타일 실측 수심(m) — 육지 거리 × 수심 프로필 */
  depthAtWaterTile: (c: number, r: number) => number;
  player: () => { x: number; y: number };
  blocked: () => boolean;
  pushLog: (msg: string) => void;
  floatingHint: (msg: string) => void;
  /** 확인 팝업 — 씬의 openPopup(ConfirmDialog) 경유 */
  confirm: (message: string, onYes: () => void) => void;
  /** 통발 설치 패널 열기 — 씬의 openPopup 경유 */
  openDeployPanel: (onPick: (trapItem: InvItem, baitItem: InvItem) => void) => void;
}

const HINT_STYLE = {
  fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffe0a8', fontStyle: 'bold',
  backgroundColor: '#0a1628cc', padding: { x: 5, y: 2 },
} as const;

export class TrapFieldSystem {
  private host: TrapHost;
  private buoys = new Map<string, { c: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text }>();
  /**
   * 남이 놓은 통발 (145차 — 사용자 지시 "설치하는 순간 다른 유저에게도 보이도록").
   * 같은 물 타일을 두 사람이 쓰기 때문에, 안 보이면 같은 자리에 겹쳐 놓으려다 충돌한다.
   * 보이기만 하고 **건드릴 수는 없다** — 포획물·분실 롤·조례 적발은 놓은 사람의 몫이다.
   */
  private peerBuoys = new Map<string, { c: Phaser.GameObjects.Container }>();
  private peerSyncAt = 0;
  private hintText?: Phaser.GameObjects.Text;
  private previewG?: Phaser.GameObjects.Graphics;
  private labelAcc = 0;
  /** 설치 모드 — 선택된 통발/미끼 아이템 */
  placing: { trapItem: InvItem; baitItem: InvItem; spec: TrapSpec } | null = null;
  private nearTrap: DeployedTrap | null = null;

  constructor(host: TrapHost) {
    this.host = host;
    this.ensureTexture();
    this.renderAll();
  }

  // ═══════════════════════════════════════════════════
  // 이 맵의 통발
  // ═══════════════════════════════════════════════════

  private mine(): DeployedTrap[] {
    return GameState.deployedTraps.filter((t) => (t.mapId ?? t.spotId) === this.host.mapKey);
  }

  private ensureTexture(): void {
    const tex = this.host.scene.textures;
    if (tex.exists('trap_buoy')) return;
    const g = this.host.scene.add.graphics();
    g.fillStyle(0xff7a2c, 1); g.fillCircle(7, 7, 6);
    g.fillStyle(0xffffff, 1); g.fillRect(2, 6, 10, 2);
    g.lineStyle(1, 0x3a2418, 1); g.strokeCircle(7, 7, 6);
    g.generateTexture('trap_buoy', 14, 14);
    g.destroy();
  }

  private statusOf(t: DeployedTrap): { label: string; color: string; canHarvest: boolean } {
    const soakH = (Date.now() - t.deployedAt.getTime()) / 3_600_000;
    const spec = getTrapById(t.trapSpecId);
    if (t.isLostOrDamaged) return { label: '분실/파손', color: '#ff7a7a', canHarvest: true };
    const opt = spec?.baitDurationHours ?? 8;
    const canHarvest = soakH >= TUNING.trap.minSoakHours;
    const soakLabel = soakH < 1 ? `${Math.round(soakH * 60)}분` : `${soakH.toFixed(1)}h`;
    if (soakH >= opt) return { label: `침지 ${soakLabel} · 수거 적기`, color: '#8affb0', canHarvest };
    return { label: `침지 ${soakLabel} (최적 ${opt}h)`, color: '#ffe0a8', canHarvest };
  }

  renderAll(): void {
    const alive = new Set<string>();
    const tr = this.host.tr;
    for (const t of this.mine()) {
      alive.add(t.instanceId);
      if (this.buoys.has(t.instanceId)) continue;
      const x = t.tileX * tr + tr / 2, y = t.tileY * tr + tr / 2;
      const c = this.host.scene.add.container(x, y).setDepth(6.8);
      const rope = this.host.scene.add.graphics();
      rope.lineStyle(1, 0xe8e0c8, 0.55); rope.lineBetween(0, 0, 0, 10);
      const img = this.host.scene.add.image(0, 0, 'trap_buoy').setOrigin(0.5, 0.5);
      const label = this.host.scene.add.text(0, -10, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ffe0a8',
        backgroundColor: '#0a162899', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1);
      c.add([rope, img, label]);
      this.host.scene.tweens.add({ targets: img, y: { from: -1, to: 1 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.buoys.set(t.instanceId, { c, label });
    }
    for (const [id, b] of this.buoys) if (!alive.has(id)) { b.c.destroy(); this.buoys.delete(id); }
    this.refreshLabels();
  }

  private refreshLabels(): void {
    for (const t of this.mine()) {
      const b = this.buoys.get(t.instanceId);
      if (!b) continue;
      const s = this.statusOf(t);
      b.label.setText(s.label).setColor(s.color);
    }
  }

  // ═══════════════════════════════════════════════════
  // 설치
  // ═══════════════════════════════════════════════════

  /** T 키 / 인벤 '통발 놓기' */
  openDeploy(preselect?: InvItem): void {
    if (!GameState.hasLicense('trap_basic')) {
      this.host.floatingHint('통발 조업 기본 면허가 필요합니다 — L 면허 창');
      return;
    }
    const traps = InventoryStore.items.filter((i) => i.trapSpecId && i.qty > 0);
    if (traps.length === 0) {
      this.host.floatingHint('통발이 없습니다 — 직판장에서 구매');
      return;
    }
    this.host.openDeployPanel((trapItem, baitItem) => {
      const spec = getTrapById((preselect ?? trapItem).trapSpecId ?? '');
      if (!spec) return;
      this.placing = { trapItem: preselect ?? trapItem, baitItem, spec };
      if (!this.previewG) this.previewG = this.host.scene.add.graphics().setDepth(48);
      this.host.pushLog(`[통발] ${spec.nameKo} 설치 모드 — 물 위(플레이어 ${TUNING.trap.maxRangeTiles}타일 이내) 클릭 = 설치 · 우클릭/ESC = 취소`);
      this.host.floatingHint('던질 자리를 물 위에서 클릭하세요');
    });
  }

  /** 설치 가능 판정 — 물 타일 · 플레이어 거리 · 육지 거리(던지는 범위) · 겹침 */
  private placeCheck(tx: number, ty: number): { ok: boolean; reason?: string } {
    if (this.host.terrainAt(tx, ty) !== 'water') return { ok: false, reason: '물 위에만 놓을 수 있습니다' };
    const p = this.host.player();
    const tr = this.host.tr;
    const d = Math.hypot(tx * tr + tr / 2 - p.x, ty * tr + tr / 2 - p.y) / tr;
    if (d > TUNING.trap.maxRangeTiles) return { ok: false, reason: '너무 멉니다 — 물가에 더 가까이' };
    const wd = this.host.waterDistAt?.(tx, ty) ?? 1;
    if (wd > TUNING.trap.maxWaterDistTiles) return { ok: false, reason: '뭍에서 너무 먼 물입니다' };
    if (this.mine().some((t) => t.tileX === tx && t.tileY === ty)) return { ok: false, reason: '이미 통발이 있습니다' };
    // 145차 — 남의 통발도 자리를 차지한다(서버가 거절하기 전에 여기서 막아 아이템 소모를 피한다)
    const peer = MultiplayerClient.peerTraps(this.host.mapKey).find((t) => t.tileX === tx && t.tileY === ty);
    if (peer) return { ok: false, reason: `${peer.ownerName} 님의 통발이 있습니다` };
    return { ok: true };
  }

  updatePreview(worldX: number, worldY: number): void {
    if (!this.placing || !this.previewG) return;
    const tr = this.host.tr;
    const tx = Math.floor(worldX / tr), ty = Math.floor(worldY / tr);
    const chk = this.placeCheck(tx, ty);
    const g = this.previewG;
    g.clear();
    // 플레이어 사거리 원
    const p = this.host.player();
    g.lineStyle(1, 0xffffff, 0.18); g.strokeCircle(p.x, p.y, TUNING.trap.maxRangeTiles * tr);
    g.fillStyle(chk.ok ? 0x4af2a1 : 0xff5a4a, 0.38); g.fillRect(tx * tr + 1, ty * tr + 1, tr - 2, tr - 2);
    g.lineStyle(2, chk.ok ? 0x4af2a1 : 0xff5a4a, 0.9); g.strokeRect(tx * tr, ty * tr, tr, tr);
  }

  /** 설치 스팟 타입 — 포획 판정(생물 서식지)용 */
  private spotTypeAt(tx: number, ty: number): SpotType {
    const near = (fn: (c: number, r: number) => boolean): boolean =>
      [[0, -1], [0, 1], [1, 0], [-1, 0]].some(([dc, dr]) => fn(tx + dc!, ty + dr!));
    if (near((c, r) => (this.host.breakwaterClassAt?.(c, r) ?? 0) > 0 || this.host.terrainAt(c, r) === 'pier')) return 'breakwater';
    if (near((c, r) => this.host.terrainAt(c, r) === 'sand')) return 'beach';
    return 'rocky_shore';
  }

  confirmAt(worldX: number, worldY: number): void {
    if (!this.placing) return;
    const tr = this.host.tr;
    const tx = Math.floor(worldX / tr), ty = Math.floor(worldY / tr);
    const chk = this.placeCheck(tx, ty);
    if (!chk.ok) { this.host.floatingHint(chk.reason ?? '여기에는 놓을 수 없습니다'); return; }
    const { spec, trapItem, baitItem } = this.placing;
    const tide = calculateTideInfo();
    const depthM = this.host.depthAtWaterTile(tx, ty);
    const v = validateTrapDeployment(spec.id, {
      spotType: this.spotTypeAt(tx, ty), depthM, tide, month: new Date().getMonth() + 1, currentStrength: tide.currentStrength,
    }, GameState.deployedTraps.filter((t) => !t.isLostOrDamaged).length,
      GameState.hasLicense('commercial_trap'), GameState.hasLicense('trap_advanced'));
    if (!v.valid) { this.host.floatingHint(v.reason ?? '설치 불가'); this.cancelPlacement(); return; }
    // 아이템 소모 — 통발 1 + 미끼 1 (수거 시 통발만 반환)
    if (!InventoryStore.removeQty(trapItem.id, 1)) { this.host.floatingHint('통발이 없습니다'); this.cancelPlacement(); return; }
    if (!InventoryStore.removeQty(baitItem.id, 1)) {
      InventoryStore.recoverPlaceable(trapItem.id);
      this.host.floatingHint('미끼가 없습니다'); this.cancelPlacement(); return;
    }
    const now = new Date();
    const trap: DeployedTrap = {
      instanceId: `trap_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      trapSpecId: spec.id,
      spotId: this.host.mapKey,
      mapId: this.host.mapKey,
      tileX: tx, tileY: ty,
      deployedAt: now,
      nextCheckAt: new Date(now.getTime() + spec.baitDurationHours * 3_600_000),
      baitItemId: baitItem.id,
      baitRemainingRatio: 1,
      catchInside: [],
      isLostOrDamaged: false,
      depthM, lossRolled: false, durability: spec.durability,
    };
    GameState.deployTrap(trap);
    GameState.markDirty();
    // 145차 — 세션에 알린다. 실패해도(싱글·서버 없음) 내 통발은 그대로다.
    void MultiplayerClient.placeTrap({
      instanceId: trap.instanceId, mapKey: this.host.mapKey,
      tileX: tx, tileY: ty, trapSpecId: spec.id, deployedAtMs: now.getTime(),
    }).then((r) => { if (!r.ok && r.reasonKo) this.host.floatingHint(r.reasonKo); });
    this.host.pushLog(`[통발] ${spec.nameKo} 설치 — 수심 ${depthM.toFixed(1)}m · 미끼 ${baitItem.name} · 최적 수거 ${getNextOptimalHarvestTime(trap).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`);
    this.host.floatingHint(`${spec.nameKo}을(를) 놓았습니다`);
    this.renderAll();
    // 같은 통발이 남아 있으면 설치 모드 유지
    const remain = InventoryStore.find(trapItem.id);
    const bait = InventoryStore.find(baitItem.id);
    if (!remain || remain.qty <= 0 || !bait || bait.qty <= 0) this.cancelPlacement();
  }

  cancelPlacement(): void {
    this.placing = null;
    this.previewG?.clear();
  }

  // ═══════════════════════════════════════════════════
  // 근접 · 수거
  // ═══════════════════════════════════════════════════

  update(deltaMs: number): void {
    this.labelAcc += deltaMs;
    if (this.labelAcc > 20_000) { this.labelAcc = 0; this.refreshLabels(); }
    this.peerSyncAt += deltaMs;
    if (this.peerSyncAt > 1_000) { this.peerSyncAt = 0; this.renderPeerTraps(); }
    const p = this.host.player();
    const tr = this.host.tr;
    let best: DeployedTrap | null = null;
    let bestD = tr * 2.6;
    for (const t of this.mine()) {
      const d = Math.hypot(t.tileX * tr + tr / 2 - p.x, t.tileY * tr + tr / 2 - p.y);
      if (d < bestD) { bestD = d; best = t; }
    }
    this.nearTrap = best;
    if (best && !this.host.blocked() && !this.placing) {
      const s = this.statusOf(best);
      const spec = getTrapById(best.trapSpecId);
      if (!this.hintText) this.hintText = this.host.scene.add.text(0, 0, '', HINT_STYLE).setOrigin(0.5, 1).setDepth(31);
      this.hintText.setText(`[F] ${spec?.nameKo ?? '통발'} — ${s.label}`).setPosition(p.x, p.y - 52).setVisible(true);
    } else {
      this.hintText?.setVisible(false);
    }
  }

  /** 씬 keydown-F — 소비했으면 true (122차) */
  onInteractKey(): boolean {
    const t = this.nearTrap;
    if (!t) return false;
    const spec = getTrapById(t.trapSpecId);
    const s = this.statusOf(t);
    const soakH = (Date.now() - t.deployedAt.getTime()) / 3_600_000;
    if (t.isLostOrDamaged) {
      this.host.confirm(`${spec?.nameKo ?? '통발'}이(가) 분실/파손되었습니다.\n부표를 정리하시겠습니까? (통발은 되돌아오지 않습니다)`, () => {
        this.dropTrap(t.instanceId); GameState.markDirty(); this.renderAll();
        this.host.pushLog('[통발] 분실된 통발을 정리했습니다');
      });
      return true;
    }
    if (!s.canHarvest) {
      this.host.confirm(`${spec?.nameKo ?? '통발'} — ${s.label}\n최소 침지(${TUNING.trap.minSoakHours}h) 전입니다. 그냥 회수하시겠습니까? (포획물 없음 · 미끼 소모)`, () => {
        this.dropTrap(t.instanceId); GameState.markDirty();
        this.returnTrapItem(spec, t);
        this.renderAll();
        this.host.pushLog(`[통발] ${spec?.nameKo ?? '통발'} 회수 (침지 ${soakH.toFixed(1)}h — 포획 없음)`);
      });
      return true;
    }
    this.host.confirm(`${spec?.nameKo ?? '통발'} — ${s.label}\n수거하시겠습니까?`, () => this.harvest(t));
    return true;
  }

  /** 통발을 세계에서 지운다 — 로컬 + 세션 (145차) */
  private dropTrap(instanceId: string): void {
    GameState.removeTrap(instanceId);
    void MultiplayerClient.removeTrap(instanceId);
  }

  /** 남이 놓은 통발 부표 — 이름만 띄우고 상호작용은 없다 (145차) */
  private renderPeerTraps(): void {
    // 154차 — 화구도 같은 채널을 탄다(kind 'stove'). 통발 부표로 그리지 않는다.
    const list = MultiplayerClient.peerTraps(this.host.mapKey).filter((t) => (t.kind ?? 'trap') === 'trap');
    const tr = this.host.tr;
    const alive = new Set<string>();
    for (const t of list) {
      alive.add(t.instanceId);
      if (this.peerBuoys.has(t.instanceId)) continue;
      const c = this.host.scene.add.container(t.tileX * tr + tr / 2, t.tileY * tr + tr / 2).setDepth(6.7);
      const rope = this.host.scene.add.graphics();
      rope.lineStyle(1, 0xe8e0c8, 0.4); rope.lineBetween(0, 0, 0, 10);
      const img = this.host.scene.add.image(0, 0, 'trap_buoy').setOrigin(0.5, 0.5).setAlpha(0.72).setTint(0x9fd8ff);
      const label = this.host.scene.add.text(0, -10, t.ownerName, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#9fe8ff',
        backgroundColor: '#0a162899', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1);
      c.add([rope, img, label]);
      this.host.scene.tweens.add({ targets: img, y: { from: -1, to: 1 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.peerBuoys.set(t.instanceId, { c });
    }
    for (const [id, b] of this.peerBuoys) if (!alive.has(id)) { b.c.destroy(); this.peerBuoys.delete(id); }
  }

  private returnTrapItem(spec: TrapSpec | undefined, t: DeployedTrap): void {
    if (!spec) return;
    if ((t.durability ?? spec.durability) <= 0) { this.host.pushLog(`[통발] ${spec.nameKo} 파손 — 회수 불가`); return; }
    const id = `inv_trap_${spec.id}`;
    if (!InventoryStore.recoverPlaceable(id)) {
      InventoryStore.addItem({
        id, name: spec.nameKo, icon: '🪤', category: 'etc', subCategory: '통발',
        basePrice: Math.round(spec.priceWon * 0.8), equippable: false, trapSpecId: spec.id,
      }, 1);
    }
  }

  private harvest(t: DeployedTrap): void {
    const spec = getTrapById(t.trapSpecId);
    const tide = calculateTideInfo();
    const soakH = (Date.now() - t.deployedAt.getTime()) / 3_600_000;
    // 분실 롤 — 1회
    if (!t.lossRolled) {
      const lost = rollTrapLoss(t, tide.currentStrength, soakH, Math.random, GameState.skillMult('trap_loss'));   // 스킬 매듭법(122차)
      GameState.updateTrap(t.instanceId, { lossRolled: true, isLostOrDamaged: lost });
      if (lost) {
        this.dropTrap(t.instanceId); GameState.markDirty(); this.renderAll();
        this.host.scene.cameras.main.shake(180, 0.005);
        this.host.floatingHint('통발이 조류에 쓸려 사라졌다…');
        this.host.pushLog(`[통발] ${spec?.nameKo ?? '통발'} 분실 — 조류 ${Math.round(tide.currentStrength * 100)}% · 침지 ${soakH.toFixed(1)}h`);
        return;
      }
    }
    const result = harvestTrap(t, {
      spotType: this.spotTypeAt(t.tileX, t.tileY), depthM: t.depthM ?? 5, tide,
      month: new Date().getMonth() + 1, currentStrength: tide.currentStrength,
    });
    // 포획물 → 쿨러(활어) 우선, 가득이면 인벤토리
    const stored: string[] = [];
    let coolerCount = 0;
    for (const it of result.items) {
      const placed = this.storeCatch(it);
      if (placed === 'cooler') coolerCount++;
      stored.push(`${it.nameKo} ${it.countOrWeightG}g${placed === 'none' ? '(공간 없음·방류)' : ''}`);
      if (placed !== 'none') DiscoveryStore.record(it.isFishSpecies ? 'fish' : 'creature', it.creatureId, 'trap');
    }
    // 내구도 · 반환
    const dur = Math.max(0, (t.durability ?? spec?.durability ?? 0) - result.durabilityLost);
    GameState.updateTrap(t.instanceId, { durability: dur });
    this.dropTrap(t.instanceId);
    StoryStore.event({ kind: 'trap' });   // 134차 — 통발 수거 목표
    GameState.addProficiency('trap');     // 140차 — 매듭법 숙련
    this.returnTrapItem(spec, { ...t, durability: dur });
    GameState.markDirty();
    this.renderAll();
    this.host.scene.cameras.main.flash(160, 40, 160, 90);
    this.host.pushLog(`[통발] ${spec?.nameKo ?? '통발'} 수거 — 침지 ${result.soakTimeHours}h · ${result.items.length ? stored.join(', ') : '수확 없음'} · 내구도 ${dur}/${spec?.maxDurability ?? '?'}`);
    this.host.floatingHint(result.items.length ? `${result.items.length}종 수거 (${coolerCount} 쿨러)` : '빈 통발…');

    // 강원 조례 — 산란기 도루묵
    const viol = trapSeasonViolations(result.items, new Date().getMonth() + 1);
    if (viol.length) {
      const enf = rollEnforcement(GameState.player.inventory.coins, Math.random);
      const names = viol.map((id) => FISH_DATABASE.find((f) => f.id === id)?.nameKo ?? id).join(', ');
      if (enf.caught) {
        // 압수 — 쿨러/인벤에서 해당 어종 제거
        for (const id of viol) this.confiscate(id);
        if (enf.fineWon > 0) GameState.addCoins(-enf.fineWon);
        GameState.markDirty();
        this.host.scene.cameras.main.flash(260, 200, 40, 40);
        this.host.floatingHint(`단속 적발! 산란기 ${names} 압수 · 벌금 ${enf.fineWon.toLocaleString()}원`);
        this.host.pushLog(`[단속] 산란기(${GANGWON_FORAGE_ORDINANCE.sandfishSpawnMonths.join('·')}월) ${names} 통발 포획 적발 — 압수 · 벌금 ${enf.fineWon.toLocaleString()}원`);
      } else {
        this.host.pushLog(`[주의] 산란기 ${names} 통발 포획 — 강원 조례 위반 (적발 시 압수·벌금)`);
      }
    }
  }

  private storeCatch(it: TrapCatchItem): 'cooler' | 'inventory' | 'none' {
    const fish = it.isFishSpecies ? FISH_DATABASE.find((f) => f.id === it.creatureId) : undefined;
    const creature = !it.isFishSpecies ? getCreatureById(it.creatureId) : undefined;
    const lengthCm = fish
      ? Math.round((fish.avgSizeRangeCm[0] + fish.avgSizeRangeCm[1]) / 2)
      : Math.round(Math.max(3, it.countOrWeightG / 20));
    const tex = fish ? resolveFishTexture(fish.id, lengthCm, 'F') : creature ? forageTexKey(creature) : undefined;
    if (InventoryStore.hasCooler() && !CoolerStore.isFull()) {
      const idx = CoolerStore.add({ speciesId: it.creatureId, nameKo: it.nameKo, lengthCm, weightG: it.countOrWeightG, sex: 'F', iconTexture: tex, catchMethod: 'trap' });
      if (idx >= 0) return 'cooler';
    }
    const ok = InventoryStore.addItem({
      id: `inv_${fish ? 'catch' : 'forage'}_${it.creatureId}_${InventoryStore.nextCatchSeq()}`,
      name: `${it.nameKo} (${lengthCm}cm)`, icon: fish ? '🐟' : '🦀', iconTexture: tex,
      category: 'food', subCategory: fish ? '어획물' : '채집물',
      basePrice: Math.max(500, Math.round((it.countOrWeightG / 1000) * (fish?.sashimiValuePerKg ?? creature?.marketValuePerKg ?? 5000))),
      condition: 'live', equippable: false,
      speciesId: it.creatureId, lengthCm, weightG: it.countOrWeightG, catchMethod: 'trap', ...(fish ? {} : { forageCatch: true }),
    }, 1);
    return ok ? 'inventory' : 'none';
  }

  private confiscate(speciesId: string): void {
    const all = CoolerStore.all();
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i]?.speciesId === speciesId) {
        // 인덱스 = 슬롯 순서가 아니므로 슬롯을 순회해 제거
        for (let k = 0; k < 9; k++) { const f = CoolerStore.get(k); if (f && f.speciesId === speciesId) { CoolerStore.removeAt(k); break; } }
      }
    }
    for (const i of InventoryStore.items.slice()) if (i.speciesId === speciesId && i.subCategory === '어획물') InventoryStore.removeQty(i.id, i.qty);
  }

  /** dev/검증: 침지 시간 되감기 (deployedAt을 과거로) */
  devRewind(instanceId: string, hours: number): void {
    const t = GameState.deployedTraps.find((x) => x.instanceId === instanceId);
    if (!t) return;
    t.deployedAt = new Date(Date.now() - hours * 3_600_000);
    this.refreshLabels();
  }
  mineList(): DeployedTrap[] { return this.mine(); }

  destroy(): void {
    for (const b of this.buoys.values()) b.c.destroy();
    this.buoys.clear();
    for (const b of this.peerBuoys.values()) b.c.destroy();
    this.peerBuoys.clear();
    this.hintText?.destroy();
    this.previewG?.destroy();
  }
}
