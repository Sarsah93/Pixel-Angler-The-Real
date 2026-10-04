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
 *  - 208차 — **여러 대(최대 `maxHolders` · 가진 거치대 수만큼)**. 거치할 때 낚싯대 · 릴 · 끝채비가 가방에서 거치대로 옮겨지고
 *    (`InventoryStore.takeRigForParking`), 다시 잡으면 돌아온다 — 다음 대를 던지려면 낚싯대 한 벌이 더 있어야 한다.
 *    채널 문구는 `[거치대 N]`(왼쪽부터 번호) · 2대 이상이면 거치대 아래 번호 표.
 *  - 세이브: `GameState.parkedRods`. 다른 지역 필드에 들어가면 두고 온 낚싯대를 거둬 온 것으로 친다(막힘 방지 — 한 벌이 가방으로).
 *  - 209차 — 굴리는 규칙은 core `stepParkedRod`(탑다운 · 1인칭 공용). **1인칭 동안에도** 필드 대신 1인칭이
 *    `simulate`를 불러 다른 거치대가 계속 산다(registry `rodHolderTick`). 놓친 입질은 원투대일수록 고기가 스스로 걸리고
 *    (`hooked` — 초릿대가 크게 휜 채 들썩 · 빨간 「!」 · 잡으면 바로 파이팅), 1인칭 파이팅 중 고기가 옆으로 크게 째면
 *    다른 대 줄과 엉킨다(`tangled` — 잡으면 목줄을 잘라 내고 감아 들인다).
 */

import Phaser from 'phaser';
import {
  TUNING, stepParkedRod, rodSelfHookChance, rodSpecFor, tideFlowStateAt, tideFlow01, tideRegionFlowK, calculateTideInfo,
  type ParkedRodLaunch, type ParkedRigSnapshot, type ParkedRodEvent, type RodItemSpec,
} from '@tra/core';
import { GameState, type ParkedRodSave } from '../../store/GameState.js';
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
  pickUp: (rod: ParkedRodSave) => void;
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
  /** 「!」가 걸림(빨강)용인가 */
  bangHooked?: boolean;
  label?: Phaser.GameObjects.Text;
  /** 2대 이상일 때 거치대 아래 번호 */
  num?: Phaser.GameObjects.Text;
}

/** 상태별 초릿대 휨(px) — 걸림이 가장 크게, 엉킴은 살짝 */
const BENT_PX: Record<ParkedRodSave['phase'], number> = { waiting: 0, bite: 0, snagged: 5, hooked: 10, tangled: 3 };
/** 머리 위 [F] 안내 꼬리 */
const HINT_TAIL: Record<ParkedRodSave['phase'], string> = {
  waiting: '', bite: ' — 입질 중', snagged: ' — 초릿대가 휘어 있다', hooked: ' — 고기가 걸려 있다', tangled: ' — 줄이 엉켜 있다',
};

export class RodHolderSystem {
  private host: RodHolderHost;
  /** 내 거치대 그림(id → 그림) */
  private views = new Map<string, HolderView>();
  private peerViews = new Map<string, HolderView>();
  private peerSyncAt = 0;
  private holdCheckAt = 0;
  private flow01 = 0;
  private waveM = 0;
  private nearId: string | null = null;
  private nearHint: string | null = null;

  constructor(host: RodHolderHost) {
    this.host = host;
    // 다른 지역에 두고 온 낚싯대 — 거둬 온 것으로 친다(그 지역에 못 돌아가 낚시가 막히는 일 방지)
    for (const p of [...GameState.parkedRods]) {
      if (p.regionId === host.regionId) continue;
      GameState.removeParkedRod(p.id);
      if (p.gear) InventoryStore.returnParkedGear(p.gear);
      void MultiplayerClient.removeTrap(p.id);
      host.pushLog('[거치대] 두고 온 낚싯대를 거둬 왔다');
    }
    this.render();
  }

  /** 이 맵에 걸어 둔 내 낚싯대(놓은 순서) */
  private mine(): ParkedRodSave[] {
    return GameState.parkedRods.filter((p) => p.mapKey === this.host.mapKey);
  }

  /** 거치 번호(1부터 · 놓은 순서) */
  private numberOf(id: string): number {
    return this.mine().findIndex((r) => r.id === id) + 1;
  }
  private tag(id: string): string {
    return this.mine().length > 1 ? `[거치대 ${this.numberOf(id)}]` : '[거치대]';
  }

  /** 지금 더 세울 수 있나 — 상한(`maxHolders`)과 가진 거치대 수 중 작은 쪽 */
  static canParkMore(): boolean {
    const used = GameState.parkedRods.length;
    return used < TUNING.rodHolder.maxHolders && used < InventoryStore.rodHolderCount();
  }

  /** 1인칭 「거치하기」 → 발 앞에 거치대를 세우고 낚싯대 한 벌을 옮긴다 */
  park(req: ParkRequest, player: { x: number; y: number }, land: { x: number; y: number }): void {
    if (!RodHolderSystem.canParkMore()) return;
    const now = Date.now();
    // 거치대는 발 앞(착수점 쪽 한 칸)에 세운다 — 캐릭터와 겹치면 초릿대 · 「!」가 안 보인다.
    // 이미 세운 거치대와 붙으면 캐스팅 방향의 옆으로 비켜 세운다(삼발이 다리가 엉키지 않게)
    const dx = land.x - player.x, dy = land.y - player.y;
    const dl = Math.hypot(dx, dy) || 1;
    const ux = dx / dl, uy = dy / dl;
    const step = Math.min(this.host.tr, dl * 0.5);
    const base = { x: player.x + ux * step, y: player.y + uy * step };
    const gap = this.host.tr * 0.9;
    let at = base;
    for (const k of [0, 1, -1, 2, -2, 3, -3]) {
      const c = { x: base.x - uy * gap * k, y: base.y + ux * gap * k };
      if (this.mine().every((r) => Math.hypot(r.x - c.x, r.y - c.y) >= gap * 0.9)) { at = c; break; }
    }
    const gear = InventoryStore.takeRigForParking();
    const rod: ParkedRodSave = {
      id: `rod_${now.toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`,
      regionId: this.host.regionId, mapKey: this.host.mapKey,
      x: at.x, y: at.y, landX: land.x + (at.x - base.x), landY: land.y + (at.y - base.y),
      parkedAtMs: now, launch: req.launch, rig: req.rig,
      biteProbPerSec: req.biteProbPerSec, onReef: req.onReef, snagRisk: req.snagRisk, sinkerG: req.sinkerG,
      phase: 'waiting', phaseAtMs: now, gear,
    };
    GameState.addParkedRod(rod);
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
    const list = this.mine();
    const alive = new Set(list.map((r) => r.id));
    for (const [id, v] of this.views) if (!alive.has(id)) { this.dropView(v); this.views.delete(id); }
    for (const r of list) {
      let v = this.views.get(r.id);
      if (!v) { v = this.buildView(r.x, r.y, false); this.views.set(r.id, v); }
      this.drawRod(v, r, 0, BENT_PX[r.phase]);
      this.setNumber(v, list.length > 1 ? this.numberOf(r.id) : 0);
    }
  }

  /** 2대 이상이면 거치대 아래 작은 번호 — 채널의 `[거치대 N]`과 짝 */
  private setNumber(v: HolderView, n: number): void {
    if (n <= 0) { v.num?.destroy(); v.num = undefined; return; }
    if (!v.num) {
      v.num = this.host.scene.add.text(0, 12, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#e8f4ff',
        backgroundColor: '#0a1628aa', padding: { x: 3, y: 0 },
      }).setOrigin(0.5, 0);
      v.c.add(v.num);
    }
    v.num.setText(String(n));
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

  /** 그림 + 따로 떠 있는 「!」를 함께 치운다 */
  private dropView(v: HolderView): void {
    v.bang?.destroy(); v.bang = undefined;
    v.c.destroy();
  }

  private setBang(v: HolderView, on: boolean, hooked = false): void {
    // 209차 — 걸림(빨강)과 입질(노랑)은 색으로 가른다. 상태가 바뀌면 다시 만든다
    if (on && v.bang && v.bangHooked !== hooked) { v.bang.destroy(); v.bang = undefined; }
    v.bangHooked = hooked;
    if (on && !v.bang) {
      // 208차 — 머리 위 [F] 안내(depth 60)에 가리지 않게 거치대 그림과 떼어 그 위에 둔다
      v.bang = this.host.scene.add.text(v.c.x, v.c.y - 46, '!', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '18px', color: hooked ? '#ff6a4a' : '#ffe066', fontStyle: 'bold',
        stroke: hooked ? '#3a0a00' : '#3a2400', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(61);
      this.host.scene.tweens.add({ targets: v.bang, y: v.c.y - 50, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (!on && v.bang) {
      v.bang.destroy(); v.bang = undefined;
    }
  }

  // ═══════════════════════════════════════════════════
  // 걸어 둔 동안 — 입질 · 봉돌 굴림 · 밑걸림(거치대마다 따로)
  // ═══════════════════════════════════════════════════

  /** 거치대에 남은 미끼(옮겨 둔 한 벌 기준 · 구세이브는 가방 기준) */
  private baitless(rod: ParkedRodSave): boolean {
    const g = rod.gear;
    if (!g) return InventoryStore.hookNeedsBait() && !InventoryStore.rigSummary().baitIds.some(Boolean);
    const baitIds = new Set(g.tree.nodes.filter((n) => n.slot === 'bait' && n.itemId).map((n) => n.itemId as string));
    if (baitIds.size === 0) return false;   // 미끼 없는 채비(반짝이 카드 등)
    return !g.items.some((e) => baitIds.has(e.item.id) && e.qty > 0);
  }

  /** 입질 창을 놓쳤다 — 미끼 하나를 따먹혔다 */
  private loseOneBait(rod: ParkedRodSave): boolean {
    const g = rod.gear;
    if (!g) {
      if (!InventoryStore.hookNeedsBait()) return false;
      InventoryStore.pickBittenBait();
      InventoryStore.consumeRigItem('bait');
      return true;
    }
    const baitIds = new Set(g.tree.nodes.filter((n) => n.slot === 'bait' && n.itemId).map((n) => n.itemId as string));
    const e = g.items.find((x) => baitIds.has(x.item.id) && x.qty > 0);
    if (!e) return false;
    e.qty -= 1; e.item.qty = e.qty;
    g.items = g.items.filter((x) => x.qty > 0);
    return true;
  }

  /** 거치대에 건 낚싯대의 제원(옮겨 둔 한 벌에서 대를 찾는다 · 구세이브는 원투대로 본다) */
  private parkedRodSpec(rod: ParkedRodSave): RodItemSpec | undefined {
    const it = rod.gear?.items.find((e) => e.item.tool === 'rod')?.item;
    return it ? rodSpecFor(it.id, it.name, it.basePrice) : rodSpecFor('', '원투', 98000);
  }

  /**
   * 209차 — 걸어 둔 낚싯대를 dt만큼 굴린다(그림 없이). 필드 `update`와 1인칭(registry `rodHolderTick`)이 함께 쓴다.
   * @param tanglePerSec 1인칭 파이팅 중 고기가 옆으로 크게 짤 때만 > 0
   * @returns 이번에 생긴 일(1인칭 칩 · 알림용) — 번호 · 일 · 채널 문구
   */
  simulate(deltaMs: number, tanglePerSec = 0): { n: number; event: ParkedRodEvent; msg: string }[] {
    const list = this.mine();
    if (list.length === 0) return [];
    const now = Date.now();
    // 물살 · 파고 — 5초마다(물때 · 파고는 천천히 바뀐다). 굴림은 봉돌 무게가 거치대마다 달라 따로 본다
    if (now - this.holdCheckAt > 5_000) {
      this.holdCheckAt = now;
      this.flow01 = this.host.regionId === 'hometown' ? 0
        : tideFlow01(tideFlowStateAt(), calculateTideInfo().currentStrength, tideRegionFlowK(this.host.regionId));
      this.waveM = ExternalDataStore.getWaveHeightM(this.host.regionId) ?? 0;
    }
    const out: { n: number; event: ParkedRodEvent; msg: string }[] = [];
    for (const rod of list) {
      const ev = stepParkedRod(rod, {
        dtSec: deltaMs / 1000, flow01: this.flow01, waveM: this.waveM, baitless: this.baitless(rod),
        selfHookChance: rodSelfHookChance(this.parkedRodSpec(rod), rod.sinkerG),
        tanglePerSec, nowMs: now, rng: Math.random,
      });
      if (!ev) continue;
      GameState.markDirty();
      const tag = this.tag(rod.id);
      let msg = '';
      if (ev === 'snagged') msg = `${tag} 초릿대가 휜 채 꼼짝하지 않는다`;
      else if (ev === 'bite') {
        msg = `${tag} 초릿대 끝이 까딱거린다!`;
        this.host.floatingHint('거치해 둔 낚싯대에 입질이 왔다');
      } else if (ev === 'bite_missed') {
        const lost = Math.random() < TUNING.rodHolder.missBaitLossChance && this.loseOneBait(rod);
        msg = `${tag} 초릿대가 잠잠해졌다${lost ? ' — 미끼를 따먹힌 것 같다' : ''}`;
      } else if (ev === 'hooked') msg = `${tag} 초릿대가 크게 휘어 들썩인다 — 고기가 스스로 걸렸다!`;
      else if (ev === 'escaped') {
        this.loseOneBait(rod);
        msg = `${tag} 휘어 있던 초릿대가 튕기듯 펴졌다 — 빠진 것 같다`;
      } else if (ev === 'tangled') msg = `${tag} 옆으로 짼 고기에 줄이 엉켰다`;
      this.host.pushLog(msg);
      out.push({ n: this.numberOf(rod.id), event: ev, msg });
    }
    return out;
  }

  update(deltaMs: number): void {
    this.peerSyncAt += deltaMs;
    if (this.peerSyncAt > 1_000) { this.peerSyncAt = 0; this.renderPeers(); }
    const list = this.mine();
    const p = this.host.player();
    if (list.length === 0) { this.nearId = null; this.nearHint = null; return; }
    if (this.views.size !== list.length) this.render();
    this.simulate(deltaMs);

    const t = Date.now() / 1000;
    const reach = TUNING.rodHolder.reachTiles * this.host.tr;
    let near: ParkedRodSave | null = null;
    let nearD = reach;
    // 208차 — 손 닿는 거치대가 여럿이면 급한 대부터 잡는다(209차 — 걸림 > 입질 > 밑걸림 > 엉킴 > 대기)
    let nearRank = 9;
    const RANK: Record<ParkedRodSave['phase'], number> = { hooked: 0, bite: 1, snagged: 2, tangled: 3, waiting: 4 };
    for (const rod of list) {
      // 그림 — 입질: 초릿대 끝이 까딱 · 「!」 / 걸림: 크게 휜 채 들썩 · 빨간 「!」 / 밑걸림: 휜 채 멈춤 / 엉킴: 살짝 휜 채
      const v = this.views.get(rod.id);
      if (v) {
        const shake = rod.phase === 'bite' ? Math.sin(t * 18 + rod.parkedAtMs) * 2.2 * (0.6 + 0.4 * Math.abs(Math.sin(t * 2.3)))
          : rod.phase === 'hooked' ? Math.sin(t * 7 + rod.parkedAtMs) * 3.2 : 0;
        this.drawRod(v, rod, shake, BENT_PX[rod.phase]);
      }
      const d = Math.hypot(rod.x - p.x, rod.y - p.y);
      const rk = RANK[rod.phase];
      if (d <= reach && (rk < nearRank || (rk === nearRank && d <= nearD))) { nearD = d; nearRank = rk; near = rod; }
    }

    // [F] — 가장 가까운 내 거치대
    this.nearId = !this.host.blocked() && near ? near.id : null;
    // 「!」 — 머리 위 [F] 안내가 이미 「입질 중」이라 말하는 대는 겹쳐 그리지 않는다
    for (const rod of list) {
      const v = this.views.get(rod.id);
      if (v) this.setBang(v, (rod.phase === 'bite' || rod.phase === 'hooked') && rod.id !== this.nearId, rod.phase === 'hooked');
    }
    if (near && this.nearId) {
      const n = list.length > 1 ? ` ${this.numberOf(near.id)}` : '';
      this.nearHint = `[F] 거치해 둔 낚싯대${n}${HINT_TAIL[near.phase]}`;
    } else {
      this.nearHint = null;
    }
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
    for (const [id, v] of this.peerViews) if (!alive.has(id)) { this.dropView(v); this.peerViews.delete(id); }
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

  get hasNearHolder(): boolean { return this.nearId !== null; }
  get nearHintKo(): string | null { return this.nearHint; }

  /** [F] — 내 거치대면 낚싯대 한 벌을 가방에 돌려놓고 1인칭으로, 남의 것이면 한 줄 */
  onInteractKey(): boolean {
    const rod = this.nearId ? this.mine().find((r) => r.id === this.nearId) : undefined;
    if (rod) {
      GameState.removeParkedRod(rod.id);
      void MultiplayerClient.removeTrap(rod.id);
      if (rod.gear) InventoryStore.returnParkedGear(rod.gear);
      const old = this.views.get(rod.id); if (old) this.dropView(old); this.views.delete(rod.id);
      this.nearId = null; this.nearHint = null;
      this.render();   // 남은 거치대 번호를 다시 매긴다
      if (rod.phase === 'tangled') {
        // 209차 — 엉킨 줄은 1인칭으로 갈 것 없이 그 자리에서 푼다: 목줄 아래(바늘 · 미끼)를 잘라 내고 감아 들인다
        const lost = InventoryStore.applyRigLoss(InventoryStore.planRigLoss('line_break_leader'));
        this.host.pushLog(`[거치대] 엉킨 줄을 풀다 목줄을 잘라 냈다${lost.length ? ` — ${lost.join(', ')}` : ''}`);
        this.host.floatingHint('엉킨 줄을 잘라 내고 감아 들였다');
        return true;
      }
      this.host.pickUp(rod);
      return true;
    }
    const owner = this.nearPeerOwner();
    if (owner) { this.host.floatingHint(`${owner}의 낚싯대다 — 손대지 않는다`); return true; }
    return false;
  }

  /** dev · 하네스 — 입질/걸림 상태를 바로 만든다(n = 1부터 · 없으면 첫 대) */
  devSetPhase(phase: ParkedRodSave['phase'], n = 1): void {
    const rod = this.mine()[n - 1];
    if (!rod) return;
    rod.phase = phase; rod.phaseAtMs = Date.now();
  }

  destroy(): void {
    for (const v of this.views.values()) this.dropView(v);
    this.views.clear();
    for (const v of this.peerViews.values()) this.dropView(v);
    this.peerViews.clear();
  }
}
