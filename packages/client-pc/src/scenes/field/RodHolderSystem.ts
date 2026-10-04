/**
 * @file RodHolderSystem.ts
 * @description 원투 거치대 필드 시스템 (207차 — 사용자 지시 「원투는 봉돌을 바닥에 찍고 거치해 두는 낚시다」).
 *
 *  - 1인칭에서 봉돌이 바닥에 안착하면 「거치하기」 → 탑다운으로 나오고, 서 있던 자리에 **삼발이 거치대 + 낚싯대**가 선다.
 *  - 걸어 둔 동안 입질을 굴린다(거치 순간의 입질 확률 × `TUNING.rodHolder.parkedBiteMult`).
 *    입질이 오면 **초릿대 끝이 까딱거리고 머리 위에 「!」** · 지역 채널 `[거치대] …` 한 줄.
 *    `biteWindowSec` 안에 와서 [F]로 잡으면 1인칭에서 입질이 이어진다(챔질은 플레이어 몫). 놓치면 미끼를 따먹혔을 수 있다.
 *  - 봉돌은 그 자리에 멈춰 있다 — 물살 · 파도가 가벼운 봉돌을 굴릴 때만 끌리고, 끌리는 동안만 여에 걸린다
 *    (core `sinkerHoldsBottom` · `snagDragChance`). 걸리면 초릿대가 **휜 채 꼼짝하지 않는다**.
 *  - 멀티: 거치대는 설치물 채널(kind 'rod_holder')로 남에게 보이지만 **놓은 사람만** 잡을 수 있다.
 *  - 세이브: `GameState.parkedRod`(한 대). 다른 지역 필드에 들어가면 두고 온 낚싯대를 거둬 온 것으로 친다(막힘 방지).
 */

import Phaser from 'phaser';
import {
  TUNING, sinkerHoldsBottom, snagDragChance, tideFlowStateAt, tideFlow01, tideRegionFlowK, calculateTideInfo,
  type ParkedRodState, type ParkedRodLaunch, type ParkedRigSnapshot,
} from '@tra/core';
import { GameState } from '../../store/GameState.js';
import { InventoryStore } from '../../store/InventoryStore.js';
import { ExternalDataStore } from '../../store/ExternalDataStore.js';
import { MultiplayerClient } from '../../net/MultiplayerClient.js';

export interface RodHolderHost {
  scene: Phaser.Scene;
  tr: number;
  regionId: string;
  mapKey: string;
  player: () => { x: number; y: number };
  blocked: () => boolean;
  pushLog: (msg: string) => void;
  floatingHint: (msg: string) => void;
  /** 걸어 둔 낚싯대를 집어 1인칭으로 */
  pickUp: (rod: ParkedRodState) => void;
}

/** 1인칭이 넘긴 거치 스냅샷(registry `fp_park`) */
export interface ParkRequest {
  launch: ParkedRodLaunch;
  rig: ParkedRigSnapshot;
  biteProbPerSec: number;
  onReef: boolean;
  snagRisk: number;
  sinkerG: number;
}

interface HolderView {
  c: Phaser.GameObjects.Container;
  rodG: Phaser.GameObjects.Graphics;
  bang?: Phaser.GameObjects.Text;
  label?: Phaser.GameObjects.Text;
}

export class RodHolderSystem {
  private host: RodHolderHost;
  private view: HolderView | null = null;
  private peerViews = new Map<string, HolderView>();
  private peerSyncAt = 0;
  private holdCheckAt = 0;
  private rolling: ReturnType<typeof sinkerHoldsBottom> = { rolling: false, cause: 'none', shorewardMps: 0 };
  private flow01 = 0;
  private near = false;
  private nearHint: string | null = null;

  constructor(host: RodHolderHost) {
    this.host = host;
    // 다른 지역에 두고 온 낚싯대 — 거둬 온 것으로 친다(그 지역에 못 돌아가 낚시가 막히는 일 방지)
    const p = GameState.parkedRod;
    if (p && p.regionId !== host.regionId) {
      GameState.parkedRod = null;
      void MultiplayerClient.removeTrap(p.id);
      host.pushLog('[거치대] 두고 온 낚싯대를 거둬 왔다');
    }
    this.render();
  }

  /** 이 맵에 걸어 둔 내 낚싯대 */
  private mine(): ParkedRodState | null {
    const p = GameState.parkedRod;
    return p && p.mapKey === this.host.mapKey ? p : null;
  }

  /** 1인칭 「거치하기」 → 서 있던 자리에 거치대를 세운다 */
  park(req: ParkRequest, player: { x: number; y: number }, land: { x: number; y: number }): void {
    const now = Date.now();
    // 거치대는 발 앞(착수점 쪽 한 칸)에 세운다 — 캐릭터와 겹치면 초릿대 · 「!」가 안 보인다
    const dx = land.x - player.x, dy = land.y - player.y;
    const dl = Math.hypot(dx, dy) || 1;
    const step = Math.min(this.host.tr, dl * 0.5);
    const at = { x: player.x + (dx / dl) * step, y: player.y + (dy / dl) * step };
    const rod: ParkedRodState = {
      id: `rod_${now.toString(36)}`,
      regionId: this.host.regionId, mapKey: this.host.mapKey,
      x: at.x, y: at.y, landX: land.x, landY: land.y,
      parkedAtMs: now, launch: req.launch, rig: req.rig,
      biteProbPerSec: req.biteProbPerSec, onReef: req.onReef, snagRisk: req.snagRisk, sinkerG: req.sinkerG,
      phase: 'waiting', phaseAtMs: now,
    };
    GameState.parkedRod = rod;
    const tr = this.host.tr;
    void MultiplayerClient.placeTrap({
      instanceId: rod.id, mapKey: this.host.mapKey,
      tileX: Math.floor(at.x / tr), tileY: Math.floor(at.y / tr),
      trapSpecId: 'rod_holder', deployedAtMs: now, kind: 'rod_holder',
    });
    this.holdCheckAt = 0;
    this.render();
  }

  // ═══════════════════════════════════════════════════
  // 그림 — 삼발이 · 낚싯대 · 착수점까지 원줄 · 입질 「!」
  // ═══════════════════════════════════════════════════

  private render(): void {
    const rod = this.mine();
    if (!rod) { this.view?.c.destroy(); this.view = null; return; }
    if (!this.view) this.view = this.buildView(rod.x, rod.y, false);
    this.drawRod(this.view, rod, 0);
  }

  private buildView(x: number, y: number, peer: boolean): HolderView {
    const s = this.host.scene;
    const c = s.add.container(x, y).setDepth(20 + (y + 6) * 0.001);
    const legs = s.add.graphics();
    // 삼발이 — 다리 셋(금속) + 받침
    legs.lineStyle(2, peer ? 0x7f8b94 : 0x9aa8b4, 1);
    legs.lineBetween(0, -14, -7, 6); legs.lineBetween(0, -14, 7, 6); legs.lineBetween(0, -14, 1, 8);
    legs.fillStyle(0x1a1c24, 1);
    legs.fillRect(-8, 5, 3, 2); legs.fillRect(6, 5, 3, 2); legs.fillRect(0, 7, 3, 2);
    const rodG = s.add.graphics();
    c.add([legs, rodG]);
    if (peer) c.setAlpha(0.8);
    return { c, rodG };
  }

  /** 낚싯대 — 받침에서 착수점 쪽으로 기울고, 끝에서 원줄이 물로. `shake`만큼 초릿대 끝이 흔들린다 */
  private drawRod(v: HolderView, rod: { x: number; y: number; landX: number; landY: number }, shake: number, bentPx = 0): void {
    const g = v.rodG;
    g.clear();
    const dx = rod.landX - rod.x, dy = rod.landY - rod.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len, uy = dy / len;
    // 손잡이(받침 뒤) → 초릿대(받침 앞 · 위로 들림)
    const butt = { x: -ux * 10, y: -14 - uy * 10 + 6 };
    const tip = { x: ux * 22, y: -14 + uy * 22 - 14 + bentPx };
    const tipS = { x: tip.x + shake * -uy, y: tip.y + shake * ux };
    g.lineStyle(2, 0x2a5a8a, 1);
    g.lineBetween(butt.x, butt.y, (butt.x + tipS.x) / 2, (butt.y + tipS.y) / 2);
    g.lineStyle(1.4, 0x3a74aa, 1);
    g.lineBetween((butt.x + tipS.x) / 2, (butt.y + tipS.y) / 2, tipS.x, tipS.y);
    g.fillStyle(0xe8503a, 1);
    g.fillRect(tipS.x - 1, tipS.y - 1, 2, 2);
    // 릴
    g.fillStyle(0xc8d4dc, 1);
    g.fillCircle(butt.x * 0.55, butt.y * 0.55 - 12 * 0.45, 2);
    // 원줄 — 초릿대에서 착수점까지(물 위로 늘어진 선)
    g.lineStyle(1, 0xe8f2ff, 0.55);
    g.lineBetween(tipS.x, tipS.y, dx, dy);
  }

  private setBang(v: HolderView, on: boolean): void {
    if (on && !v.bang) {
      v.bang = this.host.scene.add.text(0, -46, '!', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '18px', color: '#ffe066', fontStyle: 'bold',
        stroke: '#3a2400', strokeThickness: 4,
      }).setOrigin(0.5, 1);
      v.c.add(v.bang);
      this.host.scene.tweens.add({ targets: v.bang, y: -50, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (!on && v.bang) {
      v.bang.destroy(); v.bang = undefined;
    }
  }

  // ═══════════════════════════════════════════════════
  // 걸어 둔 동안 — 입질 · 봉돌 굴림 · 밑걸림
  // ═══════════════════════════════════════════════════

  update(deltaMs: number): void {
    this.peerSyncAt += deltaMs;
    if (this.peerSyncAt > 1_000) { this.peerSyncAt = 0; this.renderPeers(); }
    const rod = this.mine();
    const p = this.host.player();
    if (!rod || !this.view) { this.near = false; this.nearHint = null; return; }
    const dt = Math.min(0.25, deltaMs / 1000);
    const now = Date.now();

    // 봉돌이 버티는가 — 5초마다(물때 · 파고는 천천히 바뀐다)
    if (now - this.holdCheckAt > 5_000) {
      this.holdCheckAt = now;
      this.flow01 = this.host.regionId === 'hometown' ? 0
        : tideFlow01(tideFlowStateAt(), calculateTideInfo().currentStrength, tideRegionFlowK(this.host.regionId));
      this.rolling = sinkerHoldsBottom(this.flow01, ExternalDataStore.getWaveHeightM(this.host.regionId) ?? 0, rod.sinkerG);
    }

    if (rod.phase === 'waiting') {
      // 구르면 끌린다 → 여 위면 걸린다. 파도는 발 앞으로 끌어온다
      if (this.rolling.rolling) {
        const speed = this.rolling.cause === 'wave' ? this.rolling.shorewardMps : TUNING.tidePhase.surfRollDriftMps;
        const dragM = speed * dt;
        if (this.rolling.cause === 'wave') rod.rig.distM = Math.max(1, rod.rig.distM - dragM);
        if (Math.random() < snagDragChance({
          dragM, dtSec: dt, clearanceM: 0, inReef: rod.onReef, kind: 'sinker', flow01: this.flow01, riskMult: rod.snagRisk,
        })) {
          rod.phase = 'snagged'; rod.phaseAtMs = now; GameState.markDirty();
          this.host.pushLog('[거치대] 초릿대가 휜 채 꼼짝하지 않는다');
        }
      }
      const baitless = InventoryStore.hookNeedsBait() && !InventoryStore.rigSummary().baitIds.some(Boolean);
      const p1 = baitless ? 0 : rod.biteProbPerSec * TUNING.rodHolder.parkedBiteMult;
      if (rod.phase === 'waiting' && Math.random() < 1 - Math.exp(-p1 * dt)) {
        rod.phase = 'bite'; rod.phaseAtMs = now; GameState.markDirty();
        this.host.pushLog('[거치대] 초릿대 끝이 까딱거린다!');
        this.host.floatingHint('거치해 둔 낚싯대에 입질이 왔다');
      }
    } else if (rod.phase === 'bite' && now - rod.phaseAtMs > TUNING.rodHolder.biteWindowSec * 1000) {
      rod.phase = 'waiting'; rod.phaseAtMs = now; GameState.markDirty();
      let tail = '';
      if (InventoryStore.hookNeedsBait() && Math.random() < TUNING.rodHolder.missBaitLossChance) {
        InventoryStore.pickBittenBait();
        InventoryStore.consumeRigItem('bait');
        tail = ' — 미끼를 따먹힌 것 같다';
      }
      this.host.pushLog(`[거치대] 초릿대가 잠잠해졌다${tail}`);
    }

    // 그림 — 입질: 초릿대 끝이 까딱 · 「!」 / 밑걸림: 휜 채 멈춤
    const t = now / 1000;
    const shake = rod.phase === 'bite' ? Math.sin(t * 18) * 2.2 * (0.6 + 0.4 * Math.abs(Math.sin(t * 2.3))) : 0;
    this.drawRod(this.view, rod, shake, rod.phase === 'snagged' ? 5 : 0);
    this.setBang(this.view, rod.phase === 'bite');

    // [F] 거리
    const reach = TUNING.rodHolder.reachTiles * this.host.tr;
    this.near = !this.host.blocked() && Math.hypot(rod.x - p.x, rod.y - p.y) <= reach;
    this.nearHint = this.near
      ? `[F] 거치해 둔 낚싯대${rod.phase === 'bite' ? ' — 입질 중' : rod.phase === 'snagged' ? ' — 초릿대가 휘어 있다' : ''}`
      : null;
  }

  /** 남이 걸어 둔 낚싯대 — 보이기만 한다(놓은 사람만 잡는다) */
  private renderPeers(): void {
    const list = MultiplayerClient.peerTraps(this.host.mapKey).filter((t) => t.kind === 'rod_holder');
    const tr = this.host.tr;
    const alive = new Set<string>();
    for (const t of list) {
      alive.add(t.instanceId);
      if (this.peerViews.has(t.instanceId)) continue;
      const x = t.tileX * tr + tr / 2, y = t.tileY * tr + tr / 2;
      const v = this.buildView(x, y, true);
      this.drawRod(v, { x, y, landX: x, landY: y + tr * 3 }, 0);
      v.label = this.host.scene.add.text(0, -34, t.ownerName, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#9fe8ff',
        backgroundColor: '#0a162899', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1);
      v.c.add(v.label);
      this.peerViews.set(t.instanceId, v);
    }
    for (const [id, v] of this.peerViews) if (!alive.has(id)) { v.c.destroy(); this.peerViews.delete(id); }
  }

  /** 가까운 남의 거치대 — [F]를 눌러도 잡지 않는다 */
  private nearPeerOwner(): string | null {
    const p = this.host.player();
    const reach = TUNING.rodHolder.reachTiles * this.host.tr;
    for (const t of MultiplayerClient.peerTraps(this.host.mapKey)) {
      if (t.kind !== 'rod_holder') continue;
      const tr = this.host.tr;
      if (Math.hypot(t.tileX * tr + tr / 2 - p.x, t.tileY * tr + tr / 2 - p.y) <= reach) return t.ownerName;
    }
    return null;
  }

  get hasNearHolder(): boolean { return this.near; }
  get nearHintKo(): string | null { return this.nearHint; }

  /** [F] — 내 거치대면 집어 1인칭으로, 남의 것이면 한 줄 */
  onInteractKey(): boolean {
    const rod = this.mine();
    if (rod && this.near) {
      GameState.parkedRod = null;
      void MultiplayerClient.removeTrap(rod.id);
      this.view?.c.destroy(); this.view = null;
      this.near = false; this.nearHint = null;
      this.host.pickUp(rod);
      return true;
    }
    const owner = this.nearPeerOwner();
    if (owner) { this.host.floatingHint(`${owner}의 낚싯대다 — 손대지 않는다`); return true; }
    return false;
  }

  /** dev · 하네스 — 입질/걸림 상태를 바로 만든다 */
  devSetPhase(phase: ParkedRodState['phase']): void {
    const rod = this.mine();
    if (!rod) return;
    rod.phase = phase; rod.phaseAtMs = Date.now();
  }

  destroy(): void {
    this.view?.c.destroy(); this.view = null;
    for (const v of this.peerViews.values()) v.c.destroy();
    this.peerViews.clear();
  }
}
