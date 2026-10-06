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
 *
 * 188차 — 하단의 조작 안내 줄(「휠 = 확대·축소 · 드래그 = 이동 · … · M / ESC = 닫기」)은 지웠다.
 *   기능은 글로 적지 않는다 — 처음 열 때 체험 가이드(`GuideTour` — 'fullmap')가 휠·드래그·호버·핀을
 *   직접 해 보게 한다. 범례는 조작 설명이 아니라 지도 기호의 뜻이라 남긴다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { applyScreenFixed } from './DraggablePanel.js';
import { paintHudPanel, hudHeaderMidY } from './HudPanelStyle.js';
import { addPixelIcon } from './PixelIcon.js';
import type { MiniMarker } from './RegionHud.js';
import { MapPinStore } from '../store/MapPinStore.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { buildMarkerTip, placeTip, tipSignature, tipHolds, tipItems, isPinnedAt } from './MapMarkerTip.js';
import { restoreHandCursor } from './DraggablePanel.js';

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
  /** 200차 — 월드 1px = N 미터 (정보 카드의 거리 표기) */
  metersPerPx?: number;
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
  /** 200차 — 마커 정보 카드(`MapMarkerTip`) · 강조 링 · 내용 서명(같으면 다시 만들지 않는다) */
  private markerTip?: Phaser.GameObjects.Container;
  private markerRing?: Phaser.GameObjects.Graphics;
  private markerTipSig = '';
  /** 201차 — 지금 카드의 마커(월드 좌표 — 지도를 끌어도 따라간다) · 카드 화면 사각형(마커→카드 통로 판정) */
  private tipAnchor: { wx: number; wy: number } | null = null;
  private tipRect: Phaser.Geom.Rectangle | null = null;
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
  /** 체험 가이드 — 드래그 제스처를 해 봤는가 / 마커 이름표를 띄워 봤는가 / 이름 있는 마커 하나(뷰 좌표) */
  private tourDragged = false;
  private tourTipShown = false;
  private tourMarker: { x: number; y: number } | null = null;
  /** 이름 있는 마커(뷰 좌표) — 호버 판정은 포인터 이동에서 직접 한다(아래 `hoverAt`). 셀 충돌로 안 그린 것도 들어 있다 */
  private labeled: { x: number; y: number; m: MiniMarker; drawn: boolean }[] = [];
  private legendRect!: Phaser.Geom.Rectangle;

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
    // 219차 — 제목 띠 안의 것은 모두 띠의 세로 가운데에 맞춘다(구: 위쪽 기준 y라 제목이 띠 아래로 처졌다).
    //  오른쪽은 ✕ ← 배율 ← 핀 제거 순으로 **서로의 실제 폭**에 이어 붙인다(구: 화면 끝 상수라 사이가 들쭉날쭉했다).
    const midY = hudHeaderMidY(PAD - 8, HDR);
    const title = scene.add.text(PAD + 4, midY, `${cfg.titleKo} — 전체 지도`, { fontFamily: FONT, fontSize: '14px', color: '#ffe9a0', fontStyle: 'bold' })
      .setOrigin(0, 0.5);
    this.add(title);
    const xt = scene.add.text(GAME_WIDTH - PAD - 4, midY, '✕', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ff9a9a' }).setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    xt.on('pointerdown', () => cfg.onClose());
    this.add(xt);
    // 배율 칸은 가장 넓은 값(×8.0) 폭으로 자리를 잡아 두고 오른쪽 정렬 — 값이 바뀌어도 옆 단추가 움직이지 않는다
    const zoomRight = xt.x - xt.width - 14;
    this.zoomText = scene.add.text(zoomRight, midY, '×8.0', { fontFamily: FONT, fontSize: '11px', color: '#9fc0d4' }).setOrigin(1, 0.5);
    const zoomSlotW = this.zoomText.width;
    this.add(this.zoomText);
    this.pinBtn = scene.add.text(zoomRight - zoomSlotW - 12, midY, '핀 제거', {
      fontFamily: FONT, fontSize: '11px', color: '#9fe8ff', backgroundColor: '#0a1628', padding: { x: 6, y: 2 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
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
    this.legendRect = new Phaser.Geom.Rectangle(PAD, legendY, GAME_WIDTH - PAD * 2, 52);
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
      // 187차 — 폭은 **그려진 글자**로 잰다(구: 한국어 글자 수 × 11 — 영어에서 「Convenience Store」가 「Pharmacy」를 덮었다)
      const t = scene.add.text(0, 0, it.label, { fontFamily: FONT, fontSize: '10px', color: '#c6d8e6' }).setOrigin(0, 0.5);
      const w = 20 + Math.ceil(t.width) + 16;
      if (lx + w > PAD + 10 + rowW) { lx = PAD + 10; ly += 22; }
      if (it.icon) { const ic = addPixelIcon(scene, it.icon, lx + 8, ly, 12); if (ic) this.add(ic); }
      else {
        const g = scene.add.graphics();
        if (it.dot !== undefined) { g.fillStyle(it.dot, 1); g.fillCircle(lx + 8, ly, 4); g.lineStyle(1, 0xffffff, 0.9); g.strokeCircle(lx + 8, ly, 4); }
        else if (it.ring !== undefined) { g.lineStyle(2, it.ring, 1); g.strokeCircle(lx + 8, ly, 5); }
        else if (it.pin) this.drawPinShape(g, lx + 8, ly + 5);
        this.add(g);
      }
      t.setPosition(lx + 20, ly);
      this.add(t);
      lx += w;
    }
    // 188차 — 조작 안내 줄 삭제(기능을 글로 적지 않는다 — 체험 가이드가 가르친다)

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
      if (!this.dragging) { this.hoverAt(ptr.x, ptr.y); return; }
      if (Math.hypot(ptr.x - this.dragging.sx, ptr.y - this.dragging.sy) > 40) this.tourDragged = true;
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
    maybeStartTour(scene, () => this.buildTour());
  }

  // ── 체험 가이드 (188차) ──
  private viewRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.view.x, this.view.y, this.view.w, this.view.h);
  }

  /** 내 위치 둘레 (화면 좌표 — 뷰 안으로 자른다) */
  private meRect(): Phaser.Geom.Rectangle {
    const p = this.cfg.player();
    const x = Phaser.Math.Clamp(this.view.x + this.toVX(p.x), this.view.x + 30, this.view.x + this.view.w - 30);
    const y = Phaser.Math.Clamp(this.view.y + this.toVY(p.y), this.view.y + 30, this.view.y + this.view.h - 30);
    return new Phaser.Geom.Rectangle(x - 30, y - 30, 60, 60);
  }

  /**
   * 첫 열기 체험 가이드 — 지도가 하는 일 = **내 위치 · 확대 · 둘러보기 · 아이콘 · 핀**.
   * 지도는 화면 전체라 말풍선은 짚는 자리(주로 내 위치) 옆에 앉는다.
   */
  private buildTour(): TourOptions {
    let zoom0 = 0;
    let pin0 = '';
    const pinSig = (): string => { const p = MapPinStore.get(this.cfg.regionId); return p ? `${Math.round(p.x)},${Math.round(p.y)}` : ''; };
    // 시작 시점에 갈래를 정해 둔다 — skipIf가 진행 중에 뒤집히면 「n / N」 쪽수가 흔들린다
    const hasLabeled = this.cfg.markers().some((m) => !!m.label);
    const markerRect = (): Phaser.Geom.Rectangle | null => (this.tourMarker
      ? new Phaser.Geom.Rectangle(this.view.x + this.tourMarker.x - 12, this.view.y + this.tourMarker.y - 12, 24, 24) : null);
    let anchor: () => Phaser.Geom.Rectangle | null = () => this.meRect();
    const at = (f: () => Phaser.Geom.Rectangle | null) => (): void => { anchor = f; };
    return {
      id: 'fullmap',
      anchor: () => anchor(),
      alive: () => this.active && !!this.scene,
      steps: [
        {
          text: '지금 있는 지역이 한 장의 지도로 펼쳐진다. 깜빡이는 빨간 점이 나다.',
          target: () => this.meRect(),
        },
        {
          text: '마우스 휠을 굴리면 지도가 커지고 작아진다. 한 번 굴려 보자.',
          target: () => this.meRect(),
          allow: () => [this.viewRect()],
          onEnter: () => { zoom0 = this.zoom; },
          wait: () => Math.abs(this.zoom - zoom0) > 0.01,
        },
        {
          text: '지도를 잡고 끌면 다른 곳을 둘러볼 수 있다. 끌어 보자.',
          target: () => this.viewRect(),
          onEnter: () => { this.tourDragged = false; },
          wait: () => this.tourDragged,
        },
        {
          text: '아이콘에 마우스를 올리면 그곳이 어떤 곳인지, 얼마나 먼지 나온다. 이 아이콘에 올려 보자. 뜬 카드를 누르면 그곳에 핀이 꽂힌다.',
          target: markerRect,
          skipIf: () => !hasLabeled,
          onEnter: () => { this.tourTipShown = false; anchor = markerRect; },
          wait: () => this.tourTipShown || !this.tourMarker,
        },
        {
          text: '아래 줄은 지도 아이콘의 뜻이다. 가게 종류와 사람, 새 의뢰, 지금 할 일이 모두 여기 있다.',
          target: () => this.legendRect,
          onEnter: at(() => this.legendRect),
        },
        {
          text: '가고 싶은 곳을 우클릭하면 핀이 꽂힌다. 길 위에도 그곳을 가리키는 화살표가 생긴다. 한 군데 꽂아 보자.',
          target: () => this.viewRect(),
          onEnter: () => { pin0 = pinSig(); anchor = () => this.meRect(); },
          wait: () => pinSig() !== '' && pinSig() !== pin0,
        },
        {
          text: '꽂은 핀은 그 자리를 다시 우클릭하거나 위의 「핀 제거」를 누르면 뽑힌다.',
          target: () => (this.pinBtn?.visible ? this.pinBtn.getBounds() : null),
          onEnter: at(() => (this.pinBtn?.visible ? this.pinBtn.getBounds() : null)),
        },
      ],
    };
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

  /**
   * 마커 정보 카드 (200차 — 구: 이름 한 줄) — 앵커 = 마커 둘레, 지도 뷰 안에서 여유가 큰 쪽으로 펼친다.
   * 같은 자리(10px)에 여럿이면 목록으로 — 축소 지도는 셀 충돌로 하나만 그리므로 가려진 것도 여기서 드러난다.
   */
  private showMarkerTip(vx: number, vy: number, items: MiniMarker[], anchor: { wx: number; wy: number }): void {
    const p = this.cfg.player();
    const from = this.cfg.metersPerPx ? { x: p.x, y: p.y, metersPerPx: this.cfg.metersPerPx } : null;
    const pin = MapPinStore.get(this.cfg.regionId);
    const sig = `${Math.round(vx)},${Math.round(vy)}|${tipSignature(items, from, pin)}`;
    this.tourTipShown = true;
    this.tipAnchor = anchor;
    if (sig === this.markerTipSig && this.markerTip) return;
    this.hideMarkerTip();
    this.tipAnchor = anchor;
    this.markerTipSig = sig;
    const { c, w, h } = buildMarkerTip(this.scene, items, from, { pinnedAt: pin, onPick: (m) => this.toggleMarkerPin(m) });
    const ax = this.view.x + vx, ay = this.view.y + vy;
    placeTip(c, w, h, new Phaser.Geom.Rectangle(ax - 10, ay - 10, 20, 20),
      new Phaser.Geom.Rectangle(this.view.x + 2, this.view.y + 2, this.view.w - 4, this.view.h - 4));
    const ring = this.scene.add.graphics();
    ring.lineStyle(2, 0xffffff, 0.95); ring.strokeCircle(ax, ay, 9);
    ring.lineStyle(1, 0x0a1628, 0.9); ring.strokeCircle(ax, ay, 10.5);
    this.add([ring, c]);
    this.markerTip = c;
    this.markerRing = ring;
    this.tipRect = new Phaser.Geom.Rectangle(c.x, c.y, w, h);
    applyScreenFixed(this);
    restoreHandCursor(this.scene);
  }

  private hideMarkerTip(): void {
    const had = !!this.markerTip;
    this.markerTip?.destroy();
    this.markerTip = undefined;
    this.markerRing?.destroy();
    this.markerRing = undefined;
    this.markerTipSig = '';
    this.tipAnchor = null;
    this.tipRect = null;
    if (had) restoreHandCursor(this.scene);
  }

  /** 201차 — 카드를 누르면 그 자리에 핀(이미 꽂힌 자리면 뽑는다) — 우클릭 핀과 같은 저장소 */
  private toggleMarkerPin(m: MiniMarker): void {
    const region = this.cfg.regionId;
    if (isPinnedAt(m, MapPinStore.get(region))) MapPinStore.clear(region);
    else MapPinStore.set(region, m.wx, m.wy);
    this.drawMarkers();
  }

  /**
   * 마커 호버 (188차 재작성) — 화면 좌표 (px, py) 가까이(9px) 그려진 이름 있는 마커가 있으면 정보 카드를 세운다.
   * 구 방식(마커마다 투명 히트 사각형 + pointerover)은 두 겹으로 죽어 있었다 —
   *  ① 지도 드래그용 뷰 히트가 마커보다 **위**에 깔려(topOnly) 마커가 pointerover를 받지 못했고,
   *  ② 마커가 120ms마다 다시 그려져 포인터가 멈춰 있으면 이름표가 곧바로 사라졌다.
   * 201차 — 포인터가 카드 위나 마커→카드 통로 안이면 지금 카드를 붙잡는다(카드를 눌러 핀을 꽂을 수 있게).
   */
  private hoverAt(px: number, py: number): void {
    const vx = px - this.view.x, vy = py - this.view.y;
    let hit: { x: number; y: number; m: MiniMarker } | null = null;
    if (this.markerTip && this.tipAnchor && this.tipRect) {
      const a = this.tipAnchor;
      const hx = this.toVX(a.wx), hy = this.toVY(a.wy);
      if (tipHolds(px, py, { x: this.view.x + hx, y: this.view.y + hy }, this.tipRect)) {
        // 그 자리 마커 — 핀을 꽂으면 핀(우선순위 4)이 셀을 차지해 가게는 「안 그린 것」이 되므로 그린 여부와 무관하게 찾는다
        const same = this.labeled.find((m) => Math.abs(m.m.wx - a.wx) < 0.5 && Math.abs(m.m.wy - a.wy) < 0.5);
        if (same) hit = same;
      }
    }
    if (!hit && vx >= 0 && vy >= 0 && vx <= this.view.w && vy <= this.view.h) {
      let bestD = 9;
      for (const m of this.labeled) {
        if (!m.drawn) continue;
        const d = Math.hypot(m.x - vx, m.y - vy);
        if (d <= bestD) { bestD = d; hit = m; }
      }
    }
    if (!hit) { this.hideMarkerTip(); return; }
    const h = hit;
    // 그 자리(10px)에 있는 것 전부 — 그려진 것(우선순위 높은 것)이 먼저
    const items = tipItems(this.labeled
      .filter((m) => Math.hypot(m.x - h.x, m.y - h.y) <= 10)
      .sort((a, b) => Number(b.drawn) - Number(a.drawn) || b.m.priority - a.m.priority)
      .map((m) => m.m));
    this.showMarkerTip(h.x, h.y, items, { wx: h.m.wx, wy: h.m.wy });
  }

  private drawMarkers(): void {
    this.labeled = [];
    const c = this.markerC;
    c.removeAll(true);
    const toX = (wx: number): number => this.toVX(wx);
    const toY = (wy: number): number => this.toVY(wy);
    const inside = (x: number, y: number): boolean => x >= -8 && y >= -8 && x <= this.view.w + 8 && y <= this.view.h + 8;
    // 아이콘 크기 — 화면 기준 12px 고정(줌과 무관). 축소 지도에서는 셀 충돌을 걸러 더미를 막는다.
    const cell = this.zoom < 1.5 ? 14 : this.zoom < 3 ? 10 : 0;
    const taken = new Set<string>();
    // 체험 가이드용 — 뷰 가운데에 가장 가까운 이름 있는 마커
    let best: { x: number; y: number; d: number } | null = null;
    for (const m of [...this.cfg.markers()].sort((a, b) => b.priority - a.priority)) {
      const x = toX(m.wx), y = toY(m.wy);
      if (!inside(x, y)) continue;
      if (cell > 0) {
        const k = `${Math.floor(x / cell)}:${Math.floor(y / cell)}`;
        if (taken.has(k)) {
          // 그리지는 않지만 정보 카드 목록에는 넣는다(200차 — 겹쳐 가려진 가게도 이름을 알 수 있게)
          if (m.label) this.labeled.push({ x, y, m, drawn: false });
          continue;
        }
        taken.add(k);
      }
      const img = addPixelIcon(this.scene, m.icon, x, y, 12);
      if (!img) continue;
      c.add(img);
      // 165차 — 마커에 마우스를 올리면 이름을 보여 준다(지도 범례만으로는 누가 누구인지 모른다)
      if (m.label) {
        this.labeled.push({ x, y, m, drawn: true });
        if (x > 16 && y > 16 && x < this.view.w - 16 && y < this.view.h - 16) {
          const d = Math.hypot(x - this.view.w / 2, y - this.view.h / 2);
          if (!best || d < best.d) best = { x, y, d };
        }
      }
    }
    this.tourMarker = best ? { x: best.x, y: best.y } : null;
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
    // 다시 그린 뒤에도 포인터가 마커 위에 머물러 있으면 카드를 그대로 둔다(가만히 있어도 사라지지 않게 —
    // 내용·위치가 같으면 서명이 같아 다시 만들지 않는다). 지도를 끄는 중이면 숨긴다.
    const ptr = this.scene.input.activePointer;
    if (this.dragging) this.hideMarkerTip();
    else this.hoverAt(ptr.x, ptr.y);
  }
}
