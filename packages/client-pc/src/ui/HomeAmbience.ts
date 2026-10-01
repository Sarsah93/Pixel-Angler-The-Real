/**
 * @file HomeAmbience.ts
 * @description 집 실내 창·조명 — 시각(KST)과 홈타운 날씨에 맞춘 창밖 하늘 · 방 어둠 · 스탠드/수조 불빛 (190차)
 *
 * 190차 사용자 지시 「창·조명을 시각·날씨에 맞추기 — 밤에는 방이 어두워지고 협탁 스탠드를 켜고 끄며,
 * 창밖에 비·노을이 보입니다」.
 *
 *  - 시간대(`dayPhase`): 밤(20~5시) · 새벽(5~7) · 낮(7~17) · 노을(17~19) · 땅거미(19~20). 필드
 *    `RegionFieldScene.setupAtmosphere`와 같은 실시각(KST) 기준이라 문을 나서도 하늘이 이어진다.
 *  - 날씨: `ExternalDataStore.getWeatherKind('hometown')` — 홈타운 마당과 같은 값(방문 중 고정).
 *  - 창: 유리 안쪽에 하늘 · 바다 수평선 · 해/달/별 · 구름 · 비/눈 줄기를 2px 도트로 그린다. 강수는 매 프레임 흐른다.
 *  - 어둠: 방을 덮는 RenderTexture에 어둠을 채우고, 켜진 불빛 자리를 **부드러운 원으로 지운다**(+ 따뜻한 가산 광).
 *    어둠은 가구·캐릭터 위, [F] 힌트·메뉴·창(UI) 아래 depth에 둔다.
 *  - 창으로 드는 빛: 낮은 햇살, 노을은 주황, 맑은 밤은 푸른 달빛 — 마루 위 띠(구 drawRoom의 고정 햇살을 대신한다).
 */

import Phaser from 'phaser';
import { kstParts, type WeatherKind } from '@tra/core';
import { ExternalDataStore } from '../store/ExternalDataStore.js';

export type DayPhase = 'night' | 'dawn' | 'day' | 'sunset' | 'twilight';

/** 지금(KST)의 시간대 */
export function dayPhase(now = new Date()): DayPhase {
  const p = kstParts(now);
  const h = Number(p.hh) + Number(p.mi) / 60;
  if (h < 5 || h >= 20) return 'night';
  if (h < 7) return 'dawn';
  if (h < 17) return 'day';
  if (h < 19) return 'sunset';
  return 'twilight';
}

/** 시간대별 어둠 색 — 노을은 따뜻하게, 땅거미는 보랏빛, 밤은 남색 */
const DARK_COLOR: Record<DayPhase, number> = { night: 0x050a1c, twilight: 0x150c2c, sunset: 0x3a1608, dawn: 0x1c1834, day: 0x101820 };

/** 시간대·날씨 → 방 어둠 세기(0~1) */
export function roomDarkness(phase: DayPhase, weather: WeatherKind): number {
  const base: Record<DayPhase, number> = { night: 0.6, twilight: 0.44, sunset: 0.2, dawn: 0.24, day: 0 };
  const wet = weather === 'rain' || weather === 'shower' || weather === 'snow' || weather === 'sleet';
  const add = wet ? 0.12 : weather === 'cloudy' || weather === 'fog' ? 0.06 : 0;
  return Math.min(0.72, base[phase] + add);
}

export interface AmbienceLight {
  x: number;
  y: number;
  /** 반경(px) */
  r: number;
  /** 가산 광 색 */
  color: number;
}

export interface AmbienceHost {
  /** 방 좌상단(바닥 0,0) · 방 크기(px) */
  ox: number;
  oy: number;
  w: number;
  h: number;
  /** 창 유리 영역 */
  win: { x: number; y: number; w: number; h: number };
  /** 지금 켜져 있는 불빛들 */
  lights(): AmbienceLight[];
  /** 어둠 배율 (가구 배치 중에는 바닥 칸이 보이게 옅게) */
  dimMul(): number;
}

const BRUSH = 'home_light_brush';
/** 어둠 depth — 가구·캐릭터(20.x) 위, 머리 위 [F] 힌트(30) 아래 */
export const DARK_DEPTH = 28;

type Rgb = [number, number, number];
const rgb = (c: number): Rgb => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const hex = (r: Rgb): number => (Math.round(r[0]) << 16) | (Math.round(r[1]) << 8) | Math.round(r[2]);
const mix = (a: number, b: number, t: number): number => {
  const x = rgb(a), y = rgb(b);
  return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
};

/** 시간대별 하늘(위 → 수평선) · 바다 색 */
const SKY: Record<DayPhase, { top: number; low: number; sea: number }> = {
  day: { top: 0x7fbde8, low: 0xcfe8f5, sea: 0x3f8fc0 },
  dawn: { top: 0x7a8ac8, low: 0xf2b8a0, sea: 0x5a6f9a },
  sunset: { top: 0x5a4a8a, low: 0xffa868, sea: 0x8a5a6a },
  twilight: { top: 0x1e2350, low: 0x6a4a7a, sea: 0x2a2a4a },
  night: { top: 0x070d24, low: 0x1a2448, sea: 0x0c1430 },
};

interface Drop { x: number; y: number; v: number; len: number }

export class HomeAmbience {
  private scene: Phaser.Scene;
  private host: AmbienceHost;
  private skyG: Phaser.GameObjects.Graphics;
  private precipG: Phaser.GameObjects.Graphics;
  private beamG: Phaser.GameObjects.Graphics;
  private dark: Phaser.GameObjects.RenderTexture;
  private glowC: Phaser.GameObjects.Container;
  private glowMask: Phaser.GameObjects.Graphics;
  private brush: Phaser.GameObjects.Image;
  private drops: Drop[] = [];
  private acc = 0;
  phase: DayPhase = 'day';
  weather: WeatherKind = 'clear';
  /** 지금 방 어둠 세기 (검증·연출용) */
  darkness = 0;

  constructor(scene: Phaser.Scene, host: AmbienceHost) {
    this.scene = scene;
    this.host = host;
    HomeAmbience.ensureBrush(scene);
    // 창으로 드는 빛은 「빛」이라 어둠 위에 가산으로 얹는다
    this.beamG = scene.add.graphics().setDepth(DARK_DEPTH + 0.4).setBlendMode(Phaser.BlendModes.ADD);
    this.skyG = scene.add.graphics().setDepth(1.5);
    this.precipG = scene.add.graphics().setDepth(1.6);
    const pad = 24;
    this.dark = scene.add.renderTexture(host.ox - pad, host.oy - pad, host.w + pad * 2, host.h + pad * 2)
      .setOrigin(0, 0).setDepth(DARK_DEPTH);
    this.glowC = scene.add.container(0, 0).setDepth(DARK_DEPTH + 0.5);
    // 빛 번짐은 방(문틀 포함) 밖으로 새지 않는다
    this.glowMask = scene.make.graphics({}, false);
    this.glowMask.fillStyle(0xffffff, 1).fillRect(host.ox - 20, host.oy - 20, host.w + 40, host.h + 40);
    this.glowC.setMask(this.glowMask.createGeometryMask());
    this.brush = scene.make.image({ key: BRUSH }, false).setOrigin(0.5);
    this.refresh();
  }

  /** 부드러운 원 브러시 (가운데 불투명 → 가장자리 투명) */
  private static ensureBrush(scene: Phaser.Scene): void {
    if (scene.textures.exists(BRUSH)) return;
    const size = 256;
    const tex = scene.textures.createCanvas(BRUSH, size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  /** 검증·촬영용 고정값 (dev 하네스) — 있으면 실시각·실날씨 대신 쓴다 */
  force: { phase?: DayPhase; weather?: WeatherKind } = {};

  /** 시간대·날씨를 다시 읽어 하늘·햇살·어둠을 새로 그린다 */
  refresh(): void {
    this.phase = this.force.phase ?? dayPhase();
    this.weather = this.force.weather ?? ExternalDataStore.getWeatherKind('hometown');
    this.drawSky();
    this.drawBeam();
    this.seedPrecip();
    this.refreshLights();
  }

  /** 불빛만 다시 (스탠드를 켜고 끌 때) */
  refreshLights(): void {
    const d = roomDarkness(this.phase, this.weather) * this.host.dimMul();
    this.darkness = d;
    const rt = this.dark;
    rt.clear();
    this.glowC.removeAll(true);
    if (d <= 0.01) return;
    rt.fill(DARK_COLOR[this.phase], d);
    for (const l of this.host.lights()) {
      this.brush.setScale((l.r * 2) / 256);
      rt.erase(this.brush, l.x - rt.x, l.y - rt.y);
      // 빛 번짐 — 같은 부드러운 원 브러시를 색을 입혀 가산으로 (어두울수록 또렷하다)
      const glow = this.scene.add.image(l.x, l.y, BRUSH).setTint(l.color).setBlendMode(Phaser.BlendModes.ADD)
        .setScale((l.r * 1.5) / 256).setAlpha(0.32 * d);
      this.glowC.add(glow);
    }
  }

  update(delta: number): void {
    this.acc += delta;
    if (this.acc >= 30000) { this.acc = 0; this.refresh(); }
    this.stepPrecip(delta);
  }

  destroy(): void {
    for (const o of [this.skyG, this.precipG, this.beamG, this.dark, this.glowC, this.brush, this.glowMask]) o.destroy();
  }

  // ── 창밖 ─────────────────────────────────────────────

  private get overcast(): boolean {
    return this.weather !== 'clear' && this.weather !== 'partly';
  }

  private drawSky(): void {
    const g = this.skyG;
    g.clear();
    const { x, y, w, h } = this.host.win;
    const pal = SKY[this.phase];
    // 흐리면 회색으로 당긴다 (밤은 덜 — 밤하늘은 원래 어둡다)
    const grey = this.phase === 'night' ? 0x1a1e26 : this.weather === 'fog' ? 0xd8dee2 : 0x8a949c;
    const k = this.overcast ? (this.weather === 'fog' ? 0.75 : 0.6) : 0;
    const top = mix(pal.top, grey, k), low = mix(pal.low, grey, k), sea = mix(pal.sea, grey, k * 0.8);
    const horizon = Math.round((h * 0.66) / 2) * 2;
    for (let yy = 0; yy < h; yy += 2) {
      const col = yy < horizon ? mix(top, low, yy / Math.max(1, horizon)) : mix(sea, 0x0a1420, ((yy - horizon) / Math.max(1, h - horizon)) * 0.35);
      g.fillStyle(col, 1);
      g.fillRect(x, y + yy, w, 2);
    }
    const hash = (a: number, b: number): number => {
      let n = (Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ 0x5bd1e995) >>> 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
      return (n >>> 0) / 4294967296;
    };
    // 해 · 달 · 별
    if (!this.overcast) {
      if (this.phase === 'night') {
        for (let i = 0; i < 18; i++) {
          const sx = x + Math.floor(hash(i, 3) * (w / 2)) * 2, sy = y + Math.floor(hash(i, 9) * (horizon / 2 - 1)) * 2;
          g.fillStyle(0xffffff, 0.45 + hash(i, 5) * 0.5); g.fillRect(sx, sy, 2, 2);
        }
        const mx = x + w * 0.72, my = y + 8;
        g.fillStyle(0xf4f0d8, 1); g.fillCircle(mx, my, 5);
        g.fillStyle(SKY.night.top, 1); g.fillCircle(mx + 3, my - 1, 4);           // 초승달
        g.fillStyle(0xf4f0d8, 0.35);
        for (let yy = horizon + 2; yy < h; yy += 4) g.fillRect(mx - 3, y + yy, 6, 2);   // 달빛 물결
      } else if (this.phase === 'sunset' || this.phase === 'dawn') {
        const sx = x + w * (this.phase === 'sunset' ? 0.3 : 0.7), sy = y + horizon;
        g.fillStyle(0xffd27a, 1); g.fillCircle(sx, sy, 7);
        g.fillStyle(mix(low, 0xffd27a, 0.3), 1); g.fillRect(sx - 9, sy, 18, 2);
        g.fillStyle(0xffc070, 0.55);
        for (let yy = horizon + 2; yy < h; yy += 4) g.fillRect(sx - 6 + (yy % 8 === 0 ? 2 : 0), y + yy, 10, 2);   // 물 위 노을 길
      } else if (this.phase === 'day') {
        g.fillStyle(0xfff6d0, 1); g.fillCircle(x + w * 0.2, y + 7, 4);
        g.fillStyle(0xffffff, 0.5);
        for (let yy = horizon + 2; yy < h; yy += 4) g.fillRect(x + ((yy * 7) % (w - 8)), y + yy, 4, 2);   // 물비늘
      }
    }
    // 구름
    const clouds = this.weather === 'partly' ? 3 : this.overcast && this.weather !== 'fog' ? 5 : this.phase === 'day' ? 1 : 0;
    const cloudCol = this.phase === 'sunset' ? 0xf0b090 : this.phase === 'night' ? 0x2a3048 : this.overcast ? mix(grey, 0xffffff, 0.15) : 0xffffff;
    for (let i = 0; i < clouds; i++) {
      const cx = x + Math.floor(hash(i, 21) * (w - 24) / 2) * 2, cy = y + 4 + Math.floor(hash(i, 31) * (horizon - 12) / 2) * 2;
      g.fillStyle(cloudCol, this.overcast ? 0.9 : 0.85);
      g.fillRect(cx + 4, cy, 12, 2); g.fillRect(cx, cy + 2, 22, 4);
    }
    if (this.weather === 'fog') { g.fillStyle(0xe8ecee, 0.45); g.fillRect(x, y + horizon - 6, w, h - horizon + 6); }
    // 창살 · 창틀 (하늘 위에 다시 — 구 drawRoom 창틀과 같은 색)
    g.fillStyle(0x5a3c22, 1);
    g.fillRect(x + w / 2, y, 2, h);
    g.fillRect(x, y + Math.round(h / 2 / 2) * 2, w, 2);
  }

  private drawBeam(): void {
    const g = this.beamG;
    g.clear();
    const { x, w } = this.host.win;
    const fy = this.host.oy + Math.round(this.host.h * 0.14);
    let col = 0xfff3c4, a = 0.09;
    switch (this.phase) {
      case 'day': break;
      case 'dawn': col = 0xffc8a0; a = 0.1; break;
      case 'sunset': col = 0xff9a50; a = 0.16; break;
      case 'twilight': col = 0x8a7ab0; a = 0.06; break;
      case 'night': col = 0x9ab8ff; a = this.overcast ? 0 : 0.07; break;
    }
    if (this.overcast && this.phase !== 'night') a *= 0.45;
    if (a <= 0) return;
    // 창 아래 마루에 비스듬히 떨어지는 빛 띠 (노을·새벽은 낮게 들어와 길다)
    const len = this.phase === 'sunset' || this.phase === 'dawn' ? 2.0 : 1.4;
    const lean = this.phase === 'sunset' ? -18 : this.phase === 'dawn' ? 18 : 0;
    g.fillStyle(col, a);
    const rows = Math.round((48 * len) / 2);
    for (let i = 0; i < rows; i++) g.fillRect(x - 8 + (lean * i) / rows, fy + i * 2, w + 16, 2);
  }

  // ── 비 · 눈 ──────────────────────────────────────────

  private seedPrecip(): void {
    this.drops = [];
    const n = this.weather === 'shower' ? 26 : this.weather === 'rain' ? 16 : this.weather === 'sleet' ? 14 : this.weather === 'snow' ? 12 : 0;
    const { x, y, w, h } = this.host.win;
    for (let i = 0; i < n; i++) {
      this.drops.push({ x: x + Math.random() * w, y: y + Math.random() * h, v: 0.08 + Math.random() * 0.06, len: 4 + Math.floor(Math.random() * 3) * 2 });
    }
    this.precipG.clear();
  }

  private stepPrecip(delta: number): void {
    if (!this.drops.length) return;
    const g = this.precipG;
    g.clear();
    const { x, y, w, h } = this.host.win;
    const snow = this.weather === 'snow';
    for (const [i, d] of this.drops.entries()) {
      const flake = snow || (this.weather === 'sleet' && i % 2 === 0);
      d.y += d.v * delta * (flake ? 0.25 : 1);
      d.x += (flake ? Math.sin((d.y + i * 13) / 9) * 0.05 : -0.012) * delta;
      if (d.y > y + h) { d.y = y - d.len; d.x = x + Math.random() * w; }
      if (d.x < x) d.x += w;
      if (d.x > x + w - 2) d.x -= w;
      const px = Math.round(d.x / 2) * 2, py = Math.round(d.y / 2) * 2;
      if (flake) { g.fillStyle(0xffffff, 0.9); g.fillRect(px, Math.max(y, py), 2, 2); continue; }
      g.fillStyle(0xd8e8f4, 0.75);
      for (let t = 0; t < d.len; t += 2) {
        const yy = py + t;
        if (yy < y || yy >= y + h) continue;
        g.fillRect(px - Math.floor(t / 4) * 2, yy, 2, 2);
      }
    }
    // 유리에 맺힌 물방울
    if (!snow) {
      g.fillStyle(0xcfe4f0, 0.55);
      for (let i = 0; i < 6; i++) g.fillRect(x + ((i * 37) % (w - 4)), y + ((i * 23) % (h - 4)), 2, 2);
    }
  }
}
