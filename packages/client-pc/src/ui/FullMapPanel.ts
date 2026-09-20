/**
 * @file FullMapPanel.ts
 * @description **전체 지도 오버레이** (155차 — 사용자 지시 "M 누르면 전체 지도, 마우스 휠로 확대·축소, 아이콘 확인").
 *
 * 미니맵이 굽는 지형 텍스처(`rhud_mini_<mapId>` — 1타일 = 1px)를 화면 가득 띄우고
 *  - 휠 = 커서 기준 확대·축소(×0.6 ~ ×8) · 드래그 = 이동 · 더블클릭 = 그 자리 중심
 *  - 아이콘 = 미니맵과 같은 마커(상점·인물·의뢰 `?`/`!`·장소) + 플레이어 + **현재 할 일 목표**(금색 링)
 *    — 미니맵은 크기에 따라 마커를 걸러 내지만(셀 충돌) 전체 지도는 확대할수록 전부 드러난다.
 *  - 아이콘은 지도가 커져도 같은 화면 크기를 유지한다(줌에 반비례 배율).
 *  - **핀**(사용자 지시): 우클릭 = 핀 설정 · 핀 위 우클릭 / 헤더 [핀 제거] = 제거. 필드에 청록 화살표가 붙는다.
 *  - **범례**(좌하단): 상점 종류·인물·의뢰·장소·나·다른 사람·할 일·핀.
 *  - 나 = 빨간 점 **깜빡임** · 다른 사람 = 파란 점(이름표).
 * 팝업 스택에 들어가므로 ESC·M으로 닫히고, 열려 있는 동안 이동은 막힌다(`uiBlocked`).
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { applyScreenFixed } from './DraggablePanel.js';
import { paintHudPanel } from './HudPanelStyle.js';
import { addPixelIcon } from './PixelIcon.js';
import { clampTextWidth } from './TextFit.js';
import type { MiniMarker } from './RegionHud.js';
import { MapPinStore } from '../store/MapPinStore.js';

export interface FullMapConfig {
  mapTex: string;
  cols: number;
  rows: number;
  worldW: number;
  worldH: number;
  titleKo: string;
  regionId: string;
  markers: () => MiniMarker[];
  player: () => { x: number; y: number };
  /** 같은 지역의 다른 사람(멀티) — 다른 색 점 */
  peers: () => { x: number; y: number; name: string }[];
  /** 현재 할 일의 목표(월드 px) — 없으면 null */
  target: () => { x: number; y: number; label: string } | null;
  onClose: () => void;
}

const FONT = '"Noto Sans KR", sans-serif';
const PAD = 24;
const HDR = 28;
/**
 * 지도를 잡아 옮긴다. 위로 드래그하면 지도는 위로 움직이고 남쪽(아래쪽) 지형이 드러난다.
 */
const DRAG_DIR = 1;

export class FullMapPanel extends Phaser.GameObjects.Container {
  private readonly cfg: FullMapConfig;
  private readonly view = { x: PAD, y: PAD + HDR, w: GAME_WIDTH - PAD * 2, h: GAME_HEIGHT - PAD * 2 - HDR - 64 };
  private pinBtn?: Phaser.GameObjects.Text;
  private mapImg!: Phaser.GameObjects.Image;
  private mapC!: Phaser.GameObjects.Container;
  private markerC!: Phaser.GameObjects.Container;
  private maskG!: Phaser.GameObjects.Graphics;
  private zoom = 1;
  private minZoom = 1;
  private panX = 0;
  private panY = 0;
  private dragging: { sx: number; sy: number; px: number; py: number } | null = null;
  private tickEv?: Phaser.Time.TimerEvent;
  private zoomText!: Phaser.GameObjects.Text;
  private readonly wheelH: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;
  private readonly moveH: (p: Phaser.Input.Pointer) => void;
  private readonly upH: () => void;

  constructor(scene: Phaser.Scene, cfg: FullMapConfig) {
    super(scene, 0, 0);
    this.cfg = cfg;
    this.setScrollFactor(0).setDepth(895);

    const dim = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setInteractive();
    this.add(dim);
    const frame = scene.add.graphics();
    paintHudPanel(frame, PAD - 8, PAD - 8, GAME_WIDTH - PAD * 2 + 16, GAME_HEIGHT - PAD * 2 + 16, { alpha: 0.96, headerH: HDR });
    this.add(frame);
    const title = scene.add.text(PAD + 4, PAD + 6, `${cfg.titleKo} — 전체 지도`, { fontFamily: FONT, fontSize: '14px', color: '#ffe9a0', fontStyle: 'bold' });
    this.add(title);
    this.zoomText = scene.add.text(GAME_WIDTH - PAD - 40, PAD + 8, '', { fontFamily: FONT, fontSize: '11px', color: '#9fc0d4' }).setOrigin(1, 0);
    this.add(this.zoomText);
    const xt = scene.add.text(GAME_WIDTH - PAD - 8, PAD + 4, '✕', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ff9a9a' }).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    xt.on('pointerdown', () => cfg.onClose());
    this.add(xt);
    this.pinBtn = scene.add.text(GAME_WIDTH - PAD - 100, PAD + 8, '핀 제거', {
      fontFamily: FONT, fontSize: '11px', color: '#9fe8ff', backgroundColor: '#0a1628', padding: { x: 6, y: 2 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.pinBtn.on('pointerdown', () => { MapPinStore.clear(cfg.regionId); this.drawMarkers(); });
    this.add(this.pinBtn);

    // 지도 뷰포트 (마스크 — 비인터랙티브 이미지라 마스크로 클립해도 팬텀 히트가 없다)
    this.mapC = scene.add.container(this.view.x, this.view.y);
    this.mapImg = scene.add.image(0, 0, cfg.mapTex).setOrigin(0, 0);
    this.markerC = scene.add.container(0, 0);
    this.mapC.add([this.mapImg, this.markerC]);
    this.add(this.mapC);
    this.maskG = scene.add.graphics().setScrollFactor(0);
    this.maskG.fillStyle(0xffffff, 1);
    this.maskG.fillRect(this.view.x, this.view.y, this.view.w, this.view.h);
    this.maskG.setVisible(false);
    this.mapC.setMask(this.maskG.createGeometryMask());

    // 범례 — 좌하단 2행 (사용자 지시). 아이콘은 지도에 찍는 것과 같은 픽셀 아이콘이다.
    const legendY = this.view.y + this.view.h + 8;
    const legendBg = scene.add.graphics();
    legendBg.fillStyle(0x0a1628, 0.85); legendBg.fillRoundedRect(PAD, legendY, GAME_WIDTH - PAD * 2, 52, 4);
    legendBg.lineStyle(1, 0x2a5a8a, 1); legendBg.strokeRoundedRect(PAD, legendY, GAME_WIDTH - PAD * 2, 52, 4);
    this.add(legendBg);
    const LEGEND: { icon?: string; dot?: number; ring?: number; pin?: boolean; label: string }[] = [
      { icon: 'mm_market', label: '직판장' }, { icon: 'mm_mart', label: '식자재마트' }, { icon: 'mm_daily', label: '생활용품점' },
      { icon: 'mm_conv', label: '편의점' }, { icon: 'mm_pharm', label: '약국' }, { icon: 'mm_food', label: '음식점' },
      { icon: 'mm_cafe', label: '카페' }, { icon: 'mm_pub', label: '주점' }, { icon: 'mm_poi', label: '장소' },
      { icon: 'mm_npc', label: '인물' }, { icon: 'mm_quest', label: '새 의뢰' }, { icon: 'mm_ready', label: '해결 가능' },
      { dot: 0xff4040, label: '나' }, { dot: 0x5c9cff, label: '다른 사람' }, { ring: 0xffd257, label: '지금 할 일' }, { pin: true, label: '핀' },
    ];
    let lx = PAD + 10, ly = legendY + 12;
    const rowW = GAME_WIDTH - PAD * 2 - 20;
    for (const it of LEGEND) {
      const w = 22 + it.label.length * 11 + 14;
      if (lx + w > PAD + 10 + rowW) { lx = PAD + 10; ly += 22; }
      if (it.icon) { const ic = addPixelIcon(scene, it.icon, lx + 8, ly, 12); if (ic) this.add(ic); }
      else {
        const g = scene.add.graphics();
        if (it.dot !== undefined) { g.fillStyle(it.dot, 1); g.fillCircle(lx + 8, ly, 4); g.lineStyle(1, 0xffffff, 0.9); g.strokeCircle(lx + 8, ly, 4); }
        else if (it.ring !== undefined) { g.lineStyle(2, it.ring, 1); g.strokeCircle(lx + 8, ly, 5); }
        else if (it.pin) this.drawPinShape(g, lx + 8, ly + 5);
        this.add(g);
      }
      const t = scene.add.text(lx + 20, ly, it.label, { fontFamily: FONT, fontSize: '10px', color: '#c6d8e6' }).setOrigin(0, 0.5);
      this.add(t);
      lx += w;
    }
    const hint = scene.add.text(GAME_WIDTH - PAD - 8, legendY + 52 + 4, '휠 = 확대·축소 · 드래그 = 이동 · 더블클릭 = 그 자리 중심 · 우클릭 = 핀 설정/제거 · M / ESC = 닫기', {
      fontFamily: FONT, fontSize: '9px', color: '#7a98ac',
    }).setOrigin(1, 0);
    clampTextWidth(hint, GAME_WIDTH - PAD * 2 - 8);
    this.add(hint);

    // 초기 배율 — 지도가 뷰포트에 딱 들어가는 배율
    this.minZoom = Math.min(this.view.w / cfg.cols, this.view.h / cfg.rows);
    this.zoom = this.minZoom;
    this.panX = (this.view.w - cfg.cols * this.zoom) / 2;
    this.panY = (this.view.h - cfg.rows * this.zoom) / 2;
    // 플레이어가 있는 곳을 처음부터 크게
    const p = cfg.player();
    this.zoomAt(this.view.w / 2, this.view.h / 2, Math.min(8, Math.max(this.minZoom, 2.2)),
      (p.x / cfg.worldW) * cfg.cols, (p.y / cfg.worldH) * cfg.rows);

    // 입력 — 휠·드래그
    const inView = (px: number, py: number): boolean =>
      px >= this.view.x && px <= this.view.x + this.view.w && py >= this.view.y && py <= this.view.y + this.view.h;
    // 155차 사용자 지시 — 휠 확대/축소는 커서가 아니라 **내 현재 위치를 뷰 가운데에 두고** 한다.
    this.wheelH = (ptr, _go, _dx, dy) => {
      if (!inView(ptr.x, ptr.y)) return;
      const f = dy > 0 ? 1 / 1.18 : 1.18;
      const me = cfg.player();
      this.zoomAt(this.view.w / 2, this.view.h / 2, Phaser.Math.Clamp(this.zoom * f, Math.min(this.minZoom, 0.6), 8),
        (me.x / cfg.worldW) * cfg.cols, (me.y / cfg.worldH) * cfg.rows);
    };
    scene.input.on('wheel', this.wheelH);
    const hit = scene.add.rectangle(this.view.x + this.view.w / 2, this.view.y + this.view.h / 2, this.view.w, this.view.h, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    let lastDown = 0;
    hit.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const now = scene.time.now;
      if (ptr.rightButtonDown()) {
        // 핀 설정 / 핀 근처(12px)면 제거
        const mx = (ptr.x - this.view.x - this.panX) / this.zoom, my = (ptr.y - this.view.y - this.panY) / this.zoom;
        const wx = (mx / cfg.cols) * cfg.worldW, wy = (my / cfg.rows) * cfg.worldH;
        const cur = MapPinStore.get(cfg.regionId);
        if (cur && Math.hypot(this.toVX(cur.x) - (ptr.x - this.view.x), this.toVY(cur.y) - (ptr.y - this.view.y)) < 12) MapPinStore.clear(cfg.regionId);
        else MapPinStore.set(cfg.regionId, Math.max(0, Math.min(cfg.worldW, wx)), Math.max(0, Math.min(cfg.worldH, wy)));
        this.drawMarkers();
        return;
      }
      if (now - lastDown < 320) {
        // 더블클릭 = 그 자리를 중심으로
        const mx = (ptr.x - this.view.x - this.panX) / this.zoom, my = (ptr.y - this.view.y - this.panY) / this.zoom;
        this.zoomAt(this.view.w / 2, this.view.h / 2, Math.max(this.zoom, 3), mx, my);
        lastDown = 0;
        return;
      }
      lastDown = now;
      this.dragging = { sx: ptr.x, sy: ptr.y, px: this.panX, py: this.panY };
    });
    this.moveH = (ptr) => {
      if (!this.dragging) return;
      this.panX = this.dragging.px + (ptr.x - this.dragging.sx) * DRAG_DIR;
      this.panY = this.dragging.py + (ptr.y - this.dragging.sy) * DRAG_DIR;
      this.clampPan();
      this.layout();
    };
    this.upH = () => { this.dragging = null; };
    scene.input.on('pointermove', this.moveH);
    scene.input.on('pointerup', this.upH);
    this.add(hit);
    this.sendToBack(hit); this.moveTo(hit, this.getIndex(this.mapC) + 1);

    this.tickEv = scene.time.addEvent({ delay: 120, loop: true, callback: () => this.drawMarkers() });
    this.layout();
    applyScreenFixed(this);
    this.once('destroy', () => {
      scene.input.off('wheel', this.wheelH);
      scene.input.off('pointermove', this.moveH);
      scene.input.off('pointerup', this.upH);
      this.tickEv?.remove(false);
      this.maskG.destroy();
    });
  }

  /** 뷰포트 좌표 (vx, vy)를 고정한 채 배율 변경 — 지도 좌표(mx, my)를 주면 그 점을 (vx, vy)에 둔다 */
  private zoomAt(vx: number, vy: number, z: number, mx?: number, my?: number): void {
    const px = mx ?? (vx - this.panX) / this.zoom;
    const py = my ?? (vy - this.panY) / this.zoom;
    this.zoom = z;
    this.panX = vx - px * z;
    this.panY = vy - py * z;
    this.clampPan();
    this.layout();
  }

  private clampPan(): void {
    const w = this.cfg.cols * this.zoom, h = this.cfg.rows * this.zoom;
    if (w <= this.view.w) this.panX = (this.view.w - w) / 2;
    else this.panX = Phaser.Math.Clamp(this.panX, this.view.w - w, 0);
    if (h <= this.view.h) this.panY = (this.view.h - h) / 2;
    else this.panY = Phaser.Math.Clamp(this.panY, this.view.h - h, 0);
  }

  private layout(): void {
    this.mapImg.setPosition(this.panX, this.panY).setScale(this.zoom);
    this.zoomText.setText(`×${this.zoom.toFixed(1)}`);
    this.drawMarkers();
  }

  private toVX(wx: number): number { return this.panX + (wx / this.cfg.worldW) * this.cfg.cols * this.zoom; }
  private toVY(wy: number): number { return this.panY + (wy / this.cfg.worldH) * this.cfg.rows * this.zoom; }

  private drawPinShape(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    // 핀 — 끝이 아래를 향하는 물방울
    g.fillStyle(0x0a1628, 0.9); g.fillTriangle(x - 6, y - 8, x + 6, y - 8, x, y + 2); g.fillCircle(x, y - 9, 6.5);
    g.fillStyle(0x5cd0ff, 1); g.fillTriangle(x - 4.5, y - 8, x + 4.5, y - 8, x, y); g.fillCircle(x, y - 9, 5);
    g.fillStyle(0x0a1628, 1); g.fillCircle(x, y - 9, 2);
  }

  private drawMarkers(): void {
    const c = this.markerC;
    c.removeAll(true);
    const toX = (wx: number): number => this.toVX(wx);
    const toY = (wy: number): number => this.toVY(wy);
    const inside = (x: number, y: number): boolean => x >= -8 && y >= -8 && x <= this.view.w + 8 && y <= this.view.h + 8;
    // 아이콘 크기 — 화면 기준 12px 고정(줌과 무관). 축소 지도에서는 셀 충돌을 걸러 더미를 막는다.
    const cell = this.zoom < 1.5 ? 14 : this.zoom < 3 ? 10 : 0;
    const taken = new Set<string>();
    for (const m of [...this.cfg.markers()].sort((a, b) => b.priority - a.priority)) {
      const x = toX(m.wx), y = toY(m.wy);
      if (!inside(x, y)) continue;
      if (cell > 0) {
        const k = `${Math.floor(x / cell)}:${Math.floor(y / cell)}`;
        if (taken.has(k)) continue;
        taken.add(k);
      }
      const img = addPixelIcon(this.scene, m.icon, x, y, 12);
      if (img) c.add(img);
    }
    // 목표 — 금색 링 + 라벨
    const t = this.cfg.target();
    if (t) {
      const x = toX(t.x), y = toY(t.y);
      if (inside(x, y)) {
        const g = this.scene.add.graphics();
        g.lineStyle(2, 0xffd257, 1); g.strokeCircle(x, y, 9);
        g.lineStyle(1, 0x5a3d00, 1); g.strokeCircle(x, y, 11);
        c.add(g);
        const lbl = this.scene.add.text(x, y - 13, t.label, {
          fontFamily: FONT, fontSize: '10px', color: '#ffe9a0', backgroundColor: '#0a1628dd', padding: { x: 4, y: 2 },
        }).setOrigin(0.5, 1);
        c.add(lbl);
      }
    }
    // 핀
    const pin = MapPinStore.get(this.cfg.regionId);
    this.pinBtn?.setVisible(!!pin);
    if (pin) {
      const x = toX(pin.x), y = toY(pin.y);
      if (inside(x, y)) {
        const g = this.scene.add.graphics();
        this.drawPinShape(g, x, y);
        c.add(g);
        const lbl = this.scene.add.text(x, y - 20, '핀', {
          fontFamily: FONT, fontSize: '10px', color: '#9fe8ff', backgroundColor: '#0a1628dd', padding: { x: 4, y: 2 },
        }).setOrigin(0.5, 1);
        c.add(lbl);
      }
    }
    // 다른 사람 (멀티) — 파란 점 + 이름
    for (const pr of this.cfg.peers()) {
      const x = toX(pr.x), y = toY(pr.y);
      if (!inside(x, y)) continue;
      const dot = this.scene.add.circle(x, y, 3.5, 0x5c9cff).setStrokeStyle(1.2, 0xffffff, 0.9);
      c.add(dot);
      const t = this.scene.add.text(x, y - 6, pr.name, { fontFamily: FONT, fontSize: '9px', color: '#cfe4ff', backgroundColor: '#0a162899', padding: { x: 2, y: 1 } }).setOrigin(0.5, 1);
      c.add(t);
    }
    // 나 — 빨간 점, 깜빡임(실시간 위치 — 250ms마다 다시 그린다)
    const p = this.cfg.player();
    const px = toX(p.x), py = toY(p.y);
    const blink = 0.45 + 0.55 * Math.abs(Math.sin(this.scene.time.now / 300));
    const halo = this.scene.add.circle(px, py, 8, 0xff4040, 0.25 * blink);
    const me = this.scene.add.circle(px, py, 4, 0xff4040).setStrokeStyle(1.5, 0xffffff, 0.95).setAlpha(0.6 + 0.4 * blink);
    c.add([halo, me]);
    const meLbl = this.scene.add.text(px, py + 7, '나', { fontFamily: FONT, fontSize: '9px', color: '#ffd0d0', backgroundColor: '#0a162899', padding: { x: 2, y: 1 } }).setOrigin(0.5, 0);
    c.add(meLbl);
  }
}
