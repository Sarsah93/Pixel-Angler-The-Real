/**
 * @file StoveFieldSystem.ts
 * @description 인-맵 화구 필드 시스템 (154차 불요리) — 설치(스토브+캐니스터+용기 조합) · 스프라이트 · 상태 배지 ·
 *              [F] 조리 패널 · [Shift+F] 회수 · 피어 화구 표시.
 *
 * TrapFieldSystem(121차)과 같은 문법: 호스트 인터페이스 + GameState 소유 상태(`CookingStore`) + wall-clock.
 * 설치 위치 = 플레이어 `TUNING.cook.placeRangeTiles` 안의 **뭍 타일**(물·건물·바다 불가 · 다른 설치물과 겹침 불가).
 * 탑다운 표시: 스토브 + 용기 + 불꽃(세기별 높이) + 김/연기 + 배지(`CookingStore.statusLabel`).
 * 배지는 1초마다 갱신 — 걸어두고 떠나 있는 동안에도 상태가 보인다(사용자 지시 ①).
 */

import Phaser from 'phaser';
import { TUNING, getCookware, HEAT_FRAC, type DeployedStove, type RegionTerrain } from '@tra/core';
import { CookingStore } from '../../store/CookingStore.js';
import { MultiplayerClient } from '../../net/MultiplayerClient.js';
import { InventoryStore, type InvItem } from '../../store/InventoryStore.js';

export interface StoveHost {
  scene: Phaser.Scene;
  tr: number;
  cols: number;
  rows: number;
  mapKey: string;
  terrainAt: (c: number, r: number) => RegionTerrain | undefined;
  /** 이 칸에 다른 설치물·건물·통발이 있는가 */
  occupiedAt: (c: number, r: number) => boolean;
  player: () => { x: number; y: number };
  blocked: () => boolean;
  pushLog: (msg: string) => void;
  floatingHint: (msg: string) => void;
  confirm: (message: string, onYes: () => void) => void;
  /** 설치 선택 패널 — 스토브·연료·용기 */
  openDeployPanel: (onPick: (stove: InvItem, fuel: InvItem, cookware: InvItem | null) => void) => void;
  /** 조리 패널 */
  openCookPanel: (stove: DeployedStove) => void;
}

const HINT_STYLE = {
  fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffe0a8', fontStyle: 'bold',
  backgroundColor: '#0a1628cc', padding: { x: 5, y: 2 },
} as const;

interface StoveView {
  c: Phaser.GameObjects.Container;
  flame: Phaser.GameObjects.Graphics;
  steam: Phaser.GameObjects.Graphics;
  ware: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  phase: number;
}

export class StoveFieldSystem {
  private host: StoveHost;
  private views = new Map<string, StoveView>();
  private peerViews = new Map<string, Phaser.GameObjects.Container>();
  private hintText?: Phaser.GameObjects.Text;
  private previewG?: Phaser.GameObjects.Graphics;
  private acc = 0;
  private peerAcc = 0;
  private nearStove: DeployedStove | null = null;
  placing: { stove: InvItem; fuel: InvItem; cookware: InvItem | null } | null = null;

  constructor(host: StoveHost) {
    this.host = host;
    this.ensureTexture();
    this.renderAll();
  }

  private mine(): DeployedStove[] {
    return CookingStore.onMap(this.host.mapKey);
  }

  /** 스토브 본체 텍스처 — 납작한 회색 본체 + 삼발이 (절차 생성 · 2px 그레인) */
  private ensureTexture(): void {
    const tex = this.host.scene.textures;
    if (tex.exists('stove_body')) return;
    const g = this.host.scene.add.graphics();
    g.fillStyle(0x1c2026, 1); g.fillRoundedRect(0, 10, 28, 12, 3);
    g.fillStyle(0x4a5058, 1); g.fillRoundedRect(2, 12, 24, 8, 2);
    g.fillStyle(0x7a838c, 1); g.fillRect(4, 14, 20, 2);
    g.fillStyle(0x2a2e33, 1); g.fillRect(4, 8, 2, 4); g.fillRect(13, 8, 2, 4); g.fillRect(22, 8, 2, 4);   // 삼발이
    g.fillStyle(0xd23a2a, 1); g.fillRect(22, 16, 4, 4);   // 노브
    g.generateTexture('stove_body', 28, 24);
    g.destroy();
  }

  // ═══════════════════════════════════════════════
  // 렌더
  // ═══════════════════════════════════════════════

  renderAll(): void {
    const alive = new Set<string>();
    const tr = this.host.tr;
    for (const st of this.mine()) {
      alive.add(st.instanceId);
      if (this.views.has(st.instanceId)) continue;
      const x = st.tileX * tr + tr / 2, y = st.tileY * tr + tr / 2;
      const c = this.host.scene.add.container(x, y).setDepth(20 + y * 0.001);
      const body = this.host.scene.add.image(0, 2, 'stove_body').setOrigin(0.5, 0.5);
      const flame = this.host.scene.add.graphics();
      const ware = this.host.scene.add.graphics();
      const steam = this.host.scene.add.graphics();
      const label = this.host.scene.add.text(0, -22, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ffe0a8',
        backgroundColor: '#0a162899', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1);
      c.add([flame, body, ware, steam, label]);
      this.views.set(st.instanceId, { c, flame, steam, ware, label, phase: Math.random() * 6 });
    }
    for (const [id, v] of this.views) if (!alive.has(id)) { v.c.destroy(); this.views.delete(id); }
    this.refreshViews(0);
  }

  /** 불꽃·김·용기·배지 갱신 (매 프레임 불꽃 흔들림 · 배지 문구는 1초) */
  private refreshViews(dt: number): void {
    for (const st of this.mine()) {
      const v = this.views.get(st.instanceId);
      if (!v) continue;
      v.phase += dt * 0.012;
      const s = st.session;
      const heat = s?.heat ?? 0;
      const fuelOk = CookingStore.fuelOk(st);
      // 불꽃 — 세기별 높이 · 흔들림
      v.flame.clear();
      if (heat > 0 && fuelOk) {
        const h = 4 + HEAT_FRAC[heat] * 9;
        const wob = Math.sin(v.phase * 3) * 1.5;
        v.flame.fillStyle(0xff8a3a, 0.85); v.flame.fillEllipse(0, -1, 16 + wob, h + wob);
        v.flame.fillStyle(0xffd257, 0.9); v.flame.fillEllipse(0, -1, 8 - wob * 0.5, h * 0.6);
      }
      // 용기 — 냄비(둥근 몸통)/팬(납작+손잡이)/석쇠(격자)
      v.ware.clear();
      const cw = st.cookwareId ? getCookware(st.cookwareId) : undefined;
      if (cw) {
        if (cw.kind === 'pot') {
          v.ware.fillStyle(0x2a2e33, 1); v.ware.fillRoundedRect(-11, -14, 22, 12, 2);
          v.ware.fillStyle(0xa8b2ba, 1); v.ware.fillRect(-9, -12, 18, 8);
          v.ware.fillStyle(0x2a2e33, 1); v.ware.fillRect(-14, -12, 3, 2); v.ware.fillRect(11, -12, 3, 2);
          if (s && s.contents.length > 0) {
            const red = s.recipeId === 'stew_red' || s.recipeId === 'braise_fish';
            v.ware.fillStyle(red ? 0xd23a2a : s.recipeId === 'porridge_abalone' ? 0xf6ecc4 : 0xe8d8a8, 1);
            v.ware.fillRect(-8, -11, 16, 4);
          }
        } else if (cw.kind === 'pan') {
          v.ware.fillStyle(0x2a2e33, 1); v.ware.fillRoundedRect(-11, -9, 22, 7, 2);
          v.ware.fillStyle(0x6a7580, 1); v.ware.fillRect(-9, -7, 18, 3);
          v.ware.fillStyle(0x5a3a20, 1); v.ware.fillRect(11, -7, 8, 2);
          if (s && s.contents.length > 0) { v.ware.fillStyle(0xd9a860, 1); v.ware.fillRect(-6, -8, 12, 3); }
        } else {
          v.ware.lineStyle(1, 0x6a7580, 1);
          for (let i = -10; i <= 10; i += 4) v.ware.lineBetween(i, -8, i, -3);
          v.ware.lineBetween(-11, -8, 11, -8); v.ware.lineBetween(-11, -3, 11, -3);
          if (s && s.contents.length > 0) { v.ware.fillStyle(0xd9a860, 1); v.ware.fillRect(-6, -7, 12, 3); }
        }
      }
      // 김(끓음) · 연기(탐)
      v.steam.clear();
      if (s && s.contents.length > 0 && (s.boiling || s.status === 'burnt')) {
        const burnt = s.status === 'burnt';
        for (let i = 0; i < 3; i++) {
          const t = (v.phase * 0.7 + i * 0.33) % 1;
          const yy = -16 - t * 18, xx = Math.sin((v.phase + i) * 2) * 3 + (i - 1) * 4;
          v.steam.fillStyle(burnt ? 0x2a2e33 : 0xe8eef2, (1 - t) * (burnt ? 0.8 : 0.5));
          v.steam.fillCircle(xx, yy, 2 + t * 2);
        }
      }
    }
  }

  private refreshLabels(): void {
    for (const st of this.mine()) {
      const v = this.views.get(st.instanceId);
      if (!v) continue;
      const lb = CookingStore.statusLabel(st);
      v.label.setText(lb.text).setColor(lb.color).setVisible(lb.text.length > 0);
    }
  }

  private renderPeerStoves(): void {
    const list = MultiplayerClient.peerTraps(this.host.mapKey).filter((t) => t.kind === 'stove');
    const tr = this.host.tr;
    const alive = new Set<string>();
    for (const t of list) {
      alive.add(t.instanceId);
      if (this.peerViews.has(t.instanceId)) continue;
      const c = this.host.scene.add.container(t.tileX * tr + tr / 2, t.tileY * tr + tr / 2).setDepth(19.9);
      const img = this.host.scene.add.image(0, 2, 'stove_body').setOrigin(0.5).setAlpha(0.72).setTint(0x9fd8ff);
      const label = this.host.scene.add.text(0, -14, t.ownerName, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#9fe8ff',
        backgroundColor: '#0a162899', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1);
      c.add([img, label]);
      this.peerViews.set(t.instanceId, c);
    }
    for (const [id, c] of this.peerViews) if (!alive.has(id)) { c.destroy(); this.peerViews.delete(id); }
  }

  // ═══════════════════════════════════════════════
  // 설치
  // ═══════════════════════════════════════════════

  openDeploy(preselect?: InvItem): void {
    const stoves = InventoryStore.items.filter((i) => i.stoveHeatId && i.qty > 0);
    if (stoves.length === 0) { this.host.floatingHint('화구가 없습니다 — 식자재마트에서 구매'); return; }
    const fuels = InventoryStore.items.filter((i) => i.fuelId && i.qty > 0);
    if (fuels.length === 0) { this.host.floatingHint('캐니스터가 없습니다 — 식자재마트에서 구매'); return; }
    this.host.openDeployPanel((stove, fuel, cookware) => {
      this.placing = { stove: preselect ?? stove, fuel, cookware };
      if (!this.previewG) this.previewG = this.host.scene.add.graphics().setDepth(48);
      this.host.pushLog(`[요리] 화구 설치 모드 — 뭍 위(플레이어 ${TUNING.cook.placeRangeTiles}타일 이내) 클릭 = 설치 · 우클릭/ESC = 취소`);
      this.host.floatingHint('놓을 자리를 클릭하세요 (바람이 덜 닿는 곳이 좋다)');
    });
  }

  private placeCheck(tx: number, ty: number): { ok: boolean; reason?: string } {
    const t = this.host.terrainAt(tx, ty);
    if (!t || t === 'water' || t === 'building') return { ok: false, reason: '뭍 위에만 놓을 수 있습니다' };
    if (this.host.occupiedAt(tx, ty)) return { ok: false, reason: '이미 무언가 있습니다' };
    if (this.mine().some((s) => s.tileX === tx && s.tileY === ty)) return { ok: false, reason: '이미 화구가 있습니다' };
    const p = this.host.player();
    const tr = this.host.tr;
    const d = Math.hypot(tx * tr + tr / 2 - p.x, ty * tr + tr / 2 - p.y) / tr;
    if (d > TUNING.cook.placeRangeTiles) return { ok: false, reason: '너무 멉니다' };
    if (d < 0.6) return { ok: false, reason: '발밑에는 놓을 수 없습니다' };
    return { ok: true };
  }

  updatePreview(worldX: number, worldY: number): void {
    if (!this.placing || !this.previewG) return;
    const tr = this.host.tr;
    const tx = Math.floor(worldX / tr), ty = Math.floor(worldY / tr);
    const chk = this.placeCheck(tx, ty);
    const g = this.previewG;
    g.clear();
    g.fillStyle(chk.ok ? 0x4af2a1 : 0xff5a4a, 0.35);
    g.fillRect(tx * tr + 1, ty * tr + 1, tr - 2, tr - 2);
    g.lineStyle(2, chk.ok ? 0x4af2a1 : 0xff5a4a, 0.9);
    g.strokeRect(tx * tr, ty * tr, tr, tr);
  }

  confirmAt(worldX: number, worldY: number): void {
    if (!this.placing) return;
    const tr = this.host.tr;
    const tx = Math.floor(worldX / tr), ty = Math.floor(worldY / tr);
    const chk = this.placeCheck(tx, ty);
    if (!chk.ok) { this.host.floatingHint(chk.reason ?? '여기에는 놓을 수 없습니다'); return; }
    const { stove, fuel, cookware } = this.placing;
    const st = CookingStore.place(stove, fuel, cookware, this.host.mapKey, tx, ty);
    if (!st) { this.host.floatingHint('설치할 수 없습니다'); this.cancelPlacement(); return; }
    // 145차 규칙 — 설치물은 세션에 알린다(통발 채널 · kind 'stove'). 실패해도 내 화구는 그대로다.
    void MultiplayerClient.placeTrap({
      instanceId: st.instanceId, mapKey: this.host.mapKey, tileX: tx, tileY: ty,
      trapSpecId: st.heatSourceId, deployedAtMs: st.placedAtMs, kind: 'stove',
    });
    this.host.pushLog(`[요리] 화구 설치 — 연료 ${Math.round(st.fuelRemainMin)}분${st.cookwareId ? ` · ${getCookware(st.cookwareId)?.nameKo ?? ''} 장착` : ' · 용기 없음'}`);
    this.host.floatingHint('화구를 놓았습니다 — [F] 요리');
    this.renderAll();
    this.cancelPlacement();
  }

  cancelPlacement(): void {
    this.placing = null;
    this.previewG?.clear();
  }

  // ═══════════════════════════════════════════════
  // 근접 · 상호작용
  // ═══════════════════════════════════════════════

  update(deltaMs: number): void {
    this.acc += deltaMs;
    if (this.acc > 1000) { this.acc = 0; CookingStore.syncAll(); this.refreshLabels(); }
    this.peerAcc += deltaMs;
    if (this.peerAcc > 1000) { this.peerAcc = 0; this.renderPeerStoves(); }
    this.refreshViews(deltaMs);
    const p = this.host.player();
    const tr = this.host.tr;
    let best: DeployedStove | null = null;
    let bestD = tr * 2.2;
    for (const st of this.mine()) {
      const d = Math.hypot(st.tileX * tr + tr / 2 - p.x, st.tileY * tr + tr / 2 - p.y);
      if (d < bestD) { bestD = d; best = st; }
    }
    this.nearStove = best;
    if (best && !this.host.blocked() && !this.placing) {
      const lb = CookingStore.statusLabel(best);
      if (!this.hintText) this.hintText = this.host.scene.add.text(0, 0, '', HINT_STYLE).setOrigin(0.5, 1).setDepth(31);
      this.hintText.setText(`[F] 요리 — ${lb.text} · [Shift+F] 회수`).setPosition(p.x, p.y - 52).setVisible(true);
    } else {
      this.hintText?.setVisible(false);
    }
  }

  /** 씬 keydown-F — 소비했으면 true. shift = 회수 */
  onInteractKey(shift = false): boolean {
    const st = this.nearStove;
    if (!st) return false;
    if (shift) {
      const why = CookingStore.recoverBlockReason(st);
      if (why) { this.host.floatingHint(why); return true; }
      this.host.confirm('화구를 회수합니다.\n스토브와 용기는 돌아오지만 끼운 캐니스터의 남은 연료는 돌아오지 않습니다.', () => {
        const r = CookingStore.recover(st);
        void MultiplayerClient.removeTrap(st.instanceId);
        this.host.pushLog(`[요리] 화구 ${r.message}`);
        this.renderAll();
      });
      return true;
    }
    this.host.openCookPanel(st);
    return true;
  }

  destroy(): void {
    for (const v of this.views.values()) v.c.destroy();
    this.views.clear();
    for (const c of this.peerViews.values()) c.destroy();
    this.peerViews.clear();
    this.hintText?.destroy(); this.hintText = undefined;
    this.previewG?.destroy(); this.previewG = undefined;
  }
}
