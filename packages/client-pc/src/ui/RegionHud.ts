/**
 * @file RegionHud.ts
 * @description RegionFieldScene 전용 HUD 오버레이
 *
 * 구성:
 *  - 좌상단: HP(스태미나) 바, 피로도 바, 시계(현재 시각), 지역 날씨 정보
 *  - 우상단: 미니맵 (실제 지형 타일 그리드 축소 렌더, M 키 3단계 크기 순환)
 *  - 중앙 하단: 퀵슬롯 8칸 (InventoryStore 배정 연동, 1~8 키/클릭 선택)
 *  - 좌하단: 이벤트 메시지 로그 + 커뮤니티 채팅 (멀티플레이 대비 목업)
 */

import Phaser from 'phaser';
import type { RegionTerrain, WeatherKind } from '@tra/core';
import { WEATHER_LABEL, kstParts, isNightHour } from '@tra/core';
import { GameState } from '../store/GameState.js';
import { InventoryStore } from '../store/InventoryStore.js';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { applyScreenFixed } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';

export interface RegionHudConfig {
  /** 지역 ID — 기상/해양 데이터 조회 키 (KMA_GRID_BY_REGION / REGION_TO_MMSI) */
  regionId: string;
  mapId: string;
  terrain: RegionTerrain[][];
  cols: number;
  rows: number;
  worldW: number;
  worldH: number;
}

// ── 미니맵 지형 색 (필드 팔레트 축소판) ────────────────
const MINI_COL: Record<RegionTerrain, number> = {
  water: 0x4a86b0,
  land: 0xbfae82,
  building: 0x6f523a,
  grass: 0x7ba352,
};

const MINI_SIZES = [150, 250, 350] as const;

// ── 상태 패널 레이아웃 ────────────────────────────────
// 텍스트가 패널 밖으로 밀려나지 않도록 모든 요소를 이 상수 기준으로 배치한다.
// (기존 236px 패널에 날씨 문자열이 x=110부터 그려져 우측으로 넘치던 버그 수정)
const SP = {
  x: 16, y: 16, w: 320, h: 176,
  pad: 10,
  /** 게이지 라벨 폭 */
  labelW: 48,
} as const;

/** 원형 날씨 아이콘 배지 반지름 */
const BADGE_R = 13;
/**
 * 배지는 2열 × 2행 배치.
 * 한 줄에 4개를 넣으면 '맑음 25.9°C' 같은 캡션이 슬롯에 안 들어가
 * 잘리거나 패널 밖으로 밀려난다 — 2열로 나눠 캡션 폭을 충분히 확보한다.
 */
const BADGE_COLS = 2;
const BADGE_STEP_X = (SP.w - SP.pad * 2) / BADGE_COLS;
const BADGE_STEP_Y = 30;
const BADGE_ROW0_Y = SP.y + 106;
/** 캡션 최대 폭 — 이 값을 넘으면 줄바꿈되므로 패널 밖으로는 절대 못 나간다 */
const CAPTION_MAX_W = BADGE_STEP_X - BADGE_R * 2 - 8;

/** 배지 idx → 중심 좌표 */
function badgePos(idx: number): { x: number; y: number } {
  const col = idx % BADGE_COLS;
  const row = Math.floor(idx / BADGE_COLS);
  return {
    x: SP.x + SP.pad + BADGE_R + col * BADGE_STEP_X,
    y: BADGE_ROW0_Y + row * BADGE_STEP_Y,
  };
}

// ── 날씨 종류 → 원형 배지 픽토그램/색/라벨 ─────────────
// 기상청 SKY/PTY 코드에서 정규화된 WeatherKind 기준 (@tra/core)
const KIND_GLYPH: Record<WeatherKind, string> = {
  clear: '☀', partly: '⛅', cloudy: '☁', rain: '☂',
  sleet: '☂', snow: '❄', shower: '☂', fog: '≋',
};
const KIND_COLOR: Record<WeatherKind, number> = {
  clear: 0xffcc44, partly: 0xc8d8e8, cloudy: 0x8fa4b8, rain: 0x4a9fe0,
  sleet: 0x7ab8e0, snow: 0xdfe9ff, shower: 0x3d8fd0, fog: 0x9aa8b0,
};

export class RegionHud extends Phaser.GameObjects.Container {
  private cfg: RegionHudConfig;

  // 상태 패널
  private barsG!: Phaser.GameObjects.Graphics;
  /** 날짜 (KST 명시) */
  private dateText!: Phaser.GameObjects.Text;
  /** 시각 HH:MM:SS */
  private clockText!: Phaser.GameObjects.Text;
  /** 주간/야간 라벨 */
  private dayNightText!: Phaser.GameObjects.Text;
  /** 원형 배지 그래픽 (아이콘 원/테두리) */
  private badgeG!: Phaser.GameObjects.Graphics;
  /** 배지 글리프 텍스트 (주야간/날씨/안개/바람) */
  private badgeGlyphs: Phaser.GameObjects.Text[] = [];
  /** 배지 하단 캡션 */
  private badgeCaptions: Phaser.GameObjects.Text[] = [];

  // 미니맵
  private miniContainer!: Phaser.GameObjects.Container;
  private miniSizeIdx = 0;
  private miniMarker!: Phaser.GameObjects.Arc;
  private miniDispW = 0;
  private miniDispH = 0;

  // 퀵슬롯
  private slotContainers: Phaser.GameObjects.Container[] = [];
  /** 슬롯별 아이콘 오브젝트 (이미지/이모지 동적 교체) */
  private slotIcons: (Phaser.GameObjects.GameObject | null)[] = [];

  // 로그/채팅
  private logLines: string[] = [];
  private logText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, cfg: RegionHudConfig) {
    super(scene);
    this.cfg = cfg;
    this.setScrollFactor(0);
    this.setDepth(200);

    this.createStatusPanel();
    this.createMiniMap();
    this.createQuickslots();
    this.createLogPanel();

    // 화면 고정 히트 영역 보정 (카메라 스크롤 시 퀵슬롯 클릭 어긋남 방지)
    applyScreenFixed(this);

    this.updateStatus();
    scene.time.addEvent({ delay: 1000, loop: true, callback: this.updateStatus, callbackScope: this });
  }

  // ═══════════════════════════════════════════════════
  // 좌상단 상태 패널 (HP / 피로도 / 시계 / 날씨)
  // ═══════════════════════════════════════════════════
  private createStatusPanel(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a1628, 0.85);
    bg.fillRoundedRect(SP.x, SP.y, SP.w, SP.h, 4);
    bg.lineStyle(1.5, 0x2a5a8a, 0.8);
    bg.strokeRoundedRect(SP.x, SP.y, SP.w, SP.h, 4);
    this.add(bg);

    const lx = SP.x + SP.pad;
    const hpLabel = this.scene.add.text(lx, SP.y + 10, 'HP', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#a0b8c8', fontStyle: 'bold',
    });
    const fatigueLabel = this.scene.add.text(lx, SP.y + 30, '피로도', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#a0b8c8', fontStyle: 'bold',
    });
    this.add([hpLabel, fatigueLabel]);

    this.barsG = this.scene.add.graphics();
    this.add(this.barsG);

    // ── 날짜 / 시각 (KST 명시) ──
    this.dateText = this.scene.add.text(lx, SP.y + 52, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
    });
    this.add(this.dateText);

    this.clockText = this.scene.add.text(lx, SP.y + 68, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#e8f4fd', fontStyle: 'bold',
    });
    this.add(this.clockText);

    this.dayNightText = this.scene.add.text(lx + 92, SP.y + 73, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffcc44',
    });
    this.add(this.dayNightText);

    // ── 원형 날씨 배지 4개 (주야간 / 날씨 / 안개 / 바람) ──
    this.badgeG = this.scene.add.graphics();
    this.add(this.badgeG);

    for (let i = 0; i < 4; i++) {
      const { x: bx, y: by } = badgePos(i);
      const glyph = this.scene.add.text(bx, by, '', {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff',
      }).setOrigin(0.5);
      // wordWrap으로 슬롯 폭을 넘지 못하게 한다 (maxLines는 쓰지 않는다 —
      // 값이 잘려 '맑음 25.9°C'가 '맑음'이 되어버린다)
      const cap = this.scene.add.text(bx + BADGE_R + 5, by, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#cfe3f2',
        wordWrap: { width: CAPTION_MAX_W },
      }).setOrigin(0, 0.5);
      this.badgeGlyphs.push(glyph);
      this.badgeCaptions.push(cap);
      this.add([glyph, cap]);
    }
  }

  /**
   * 원형 배지 1개 렌더.
   * @param active 비활성이면 어둡게 (해당 기상 현상이 없음)
   */
  private drawBadge(idx: number, glyph: string, caption: string, color: number, active: boolean): void {
    const { x: bx, y: by } = badgePos(idx);
    this.badgeG.fillStyle(active ? color : 0x24323e, active ? 0.28 : 0.5);
    this.badgeG.fillCircle(bx, by, BADGE_R);
    this.badgeG.lineStyle(1.5, active ? color : 0x3a4a58, active ? 0.95 : 0.7);
    this.badgeG.strokeCircle(bx, by, BADGE_R);

    this.badgeGlyphs[idx].setText(glyph)
      .setColor(active ? '#ffffff' : '#5d6f7e');
    this.badgeCaptions[idx].setText(caption)
      .setColor(active ? '#cfe3f2' : '#5d6f7e');
  }

  private updateStatus = (): void => {
    const p = GameState.player;

    // ── 게이지 (HP: stamina, 피로도: fatigue) ──
    const bx = SP.x + SP.pad + SP.labelW;
    const bw = SP.w - SP.pad * 2 - SP.labelW;
    this.barsG.clear();
    this.barsG.fillStyle(0x101820, 0.9);
    this.barsG.fillRect(bx, SP.y + 12, bw, 10);
    this.barsG.fillRect(bx, SP.y + 32, bw, 10);
    this.barsG.fillStyle(0x37d97b, 0.95);
    this.barsG.fillRect(bx, SP.y + 12, bw * Phaser.Math.Clamp(p.stamina / 100, 0, 1), 10);
    this.barsG.fillStyle(0xff8a3d, 0.95);
    this.barsG.fillRect(bx, SP.y + 32, bw * Phaser.Math.Clamp(p.fatigue / 100, 0, 1), 10);
    this.barsG.lineStyle(1, 0x2a5a8a, 0.9);
    this.barsG.strokeRect(bx, SP.y + 12, bw, 10);
    this.barsG.strokeRect(bx, SP.y + 32, bw, 10);

    // ── 날짜/시각 (KST 고정) ──
    // 사용자의 로컬 타임존이 KST가 아니어도 게임 시간은 항상 한국시간 기준이므로
    // toLocaleString에 Asia/Seoul을 명시해 실제 KST를 표시한다.
    const now = new Date();
    const kst = kstParts(now);
    this.dateText.setText(`${kst.y}년 ${kst.mo}월 ${kst.d}일 (${kst.dow}) · KST`);
    this.clockText.setText(`${kst.hh}:${kst.mi}:${kst.ss}`);

    const night = isNightHour(Number(kst.hh));
    this.dayNightText.setText(night ? '야간' : '주간').setColor(night ? '#8fa9d0' : '#ffcc44');

    // ── 원형 날씨 배지 ──
    const region = this.cfg.regionId;
    const kind = ExternalDataStore.getWeatherKind(region);
    const kma = ExternalDataStore.getKmaWeather(region);
    const marine = ExternalDataStore.getRegionMarineWeather(region);

    this.badgeG.clear();

    // 1) 주간/야간
    this.drawBadge(0, night ? '☾' : '☀', night ? '어두움' : '밝음',
      night ? 0x8fa9d0 : 0xffcc44, true);

    // 2) 날씨 (기상청 SKY/PTY)
    const tempC = kma?.tempC ?? marine?.airTempC;
    this.drawBadge(1, KIND_GLYPH[kind], tempC !== undefined ? `${WEATHER_LABEL[kind]} ${tempC.toFixed(1)}°C` : WEATHER_LABEL[kind],
      KIND_COLOR[kind], true);

    // 3) 안개 — 해양기상 시정(HORIZON_VISIBL) 기반. 시정 관측소가 없으면 비활성.
    const vis = marine?.visibilityM;
    const foggy = kind === 'fog' || (vis !== undefined && vis < 1000);
    this.drawBadge(2, '≋',
      vis !== undefined ? (foggy ? `안개 ${(vis / 1000).toFixed(1)}km` : `시정 ${(vis / 1000).toFixed(1)}km`) : '안개 —',
      0x9aa8b0, foggy);

    // 4) 바람 — 기상청 풍속 우선, 없으면 해양기상 실측
    const wind = kma?.windSpeedMs ?? marine?.windSpeedMs;
    const windy = wind !== undefined && wind >= 4;
    this.drawBadge(3, '≈', wind !== undefined ? `바람 ${wind.toFixed(1)}m/s` : '바람 —',
      windy ? 0x6fd3e0 : 0x4a86b0, wind !== undefined);
  };

  // ═══════════════════════════════════════════════════
  // 우상단 미니맵 (M 키 크기 순환)
  // ═══════════════════════════════════════════════════
  private createMiniMap(): void {
    // 지형 그리드를 1타일=1px 텍스처로 1회 베이킹
    const texKey = `rhud_mini_${this.cfg.mapId}`;
    if (!this.scene.textures.exists(texKey)) {
      const g = this.scene.add.graphics();
      for (let r = 0; r < this.cfg.rows; r++) {
        for (let c = 0; c < this.cfg.cols; c++) {
          g.fillStyle(MINI_COL[this.cfg.terrain[r][c]], 1);
          g.fillRect(c, r, 1, 1);
        }
      }
      g.generateTexture(texKey, this.cfg.cols, this.cfg.rows);
      g.destroy();
    }

    this.miniContainer = this.scene.add.container(0, 0);
    this.add(this.miniContainer);
    this.buildMiniMap();
  }

  private buildMiniMap(): void {
    this.miniContainer.removeAll(true);

    const size = MINI_SIZES[this.miniSizeIdx];
    const scale = Math.min(size / this.cfg.cols, size / this.cfg.rows);
    this.miniDispW = this.cfg.cols * scale;
    this.miniDispH = this.cfg.rows * scale;

    const ox = GAME_WIDTH - this.miniDispW - 16;
    const oy = 16;
    this.miniContainer.setPosition(ox, oy);

    const frame = this.scene.add.graphics();
    frame.fillStyle(0x0a1628, 0.7);
    frame.fillRect(-3, -3, this.miniDispW + 6, this.miniDispH + 6);
    frame.lineStyle(1.5, 0x2a5a8a, 0.9);
    frame.strokeRect(-3, -3, this.miniDispW + 6, this.miniDispH + 6);
    this.miniContainer.add(frame);

    const img = this.scene.add.image(0, 0, `rhud_mini_${this.cfg.mapId}`)
      .setOrigin(0, 0)
      .setScale(scale)
      .setAlpha(0.92);
    this.miniContainer.add(img);

    const hint = this.scene.add.text(this.miniDispW / 2, this.miniDispH + 6, 'M 크기 전환', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
    }).setOrigin(0.5, 0);
    this.miniContainer.add(hint);

    this.miniMarker = this.scene.add.circle(0, 0, 3.5, 0xff4040).setStrokeStyle(1, 0xffffff, 0.9);
    this.miniContainer.add(this.miniMarker);

    // 재구성된 자식 히트 영역 보정
    applyScreenFixed(this.miniContainer);
  }

  toggleMiniMapSize(): void {
    this.miniSizeIdx = (this.miniSizeIdx + 1) % MINI_SIZES.length;
    this.buildMiniMap();
  }

  updatePlayerMarker(worldX: number, worldY: number): void {
    if (!this.miniMarker) return;
    const mx = Phaser.Math.Clamp((worldX / this.cfg.worldW) * this.miniDispW, 3, this.miniDispW - 3);
    const my = Phaser.Math.Clamp((worldY / this.cfg.worldH) * this.miniDispH, 3, this.miniDispH - 3);
    this.miniMarker.setPosition(mx, my);
  }

  // ═══════════════════════════════════════════════════
  // 중앙 하단 퀵슬롯 8칸
  // ═══════════════════════════════════════════════════
  private createQuickslots(): void {
    const slotW = 46, slotH = 46, gap = 8;
    const totalW = 8 * slotW + 7 * gap;
    const startX = (GAME_WIDTH - totalW) / 2;
    const slotY = GAME_HEIGHT - slotH - 20;

    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0x060d1a, 0.72);
    barBg.fillRoundedRect(startX - 10, slotY - 8, totalW + 20, slotH + 16, 5);
    barBg.lineStyle(1.5, 0x1f3d5a, 0.6);
    barBg.strokeRoundedRect(startX - 10, slotY - 8, totalW + 20, slotH + 16, 5);
    this.add(barBg);

    for (let i = 0; i < 8; i++) {
      const sx = startX + i * (slotW + gap) + slotW / 2;
      const sc = this.scene.add.container(sx, slotY + slotH / 2);

      const box = this.scene.add.graphics();
      box.name = 'box';
      sc.add(box);

      const keyLabel = this.scene.add.text(-slotW / 2 + 4, -slotH / 2 + 3, String(i + 1), {
        fontFamily: 'monospace', fontSize: '9px', color: '#8faabf',
      });
      sc.add(keyLabel);

      const nameTxt = this.scene.add.text(0, slotH / 2 - 8, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#ffffffaa',
      }).setOrigin(0.5);
      nameTxt.name = 'name';
      sc.add(nameTxt);

      const hit = this.scene.add.rectangle(0, 0, slotW, slotH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        GameState.updatePlayer({ activeQuickslotIndex: i });
        this.refreshQuickslots();
        this.scene.events.emit('quickslot-changed', i);
      });
      sc.add(hit);

      this.slotContainers.push(sc);
      this.add(sc);
    }
    this.refreshQuickslots();
  }

  refreshQuickslots(): void {
    const activeIdx = GameState.player.activeQuickslotIndex;
    const slotW = 46, slotH = 46;

    this.slotContainers.forEach((sc, i) => {
      const box = sc.getByName('box') as Phaser.GameObjects.Graphics;
      const nameTxt = sc.getByName('name') as Phaser.GameObjects.Text;

      const itemId = InventoryStore.quickslots[i];
      const item = itemId ? InventoryStore.find(itemId) : undefined;

      // 아이콘 재생성 (이미지/이모지 혼용 지원)
      this.slotIcons[i]?.destroy();
      this.slotIcons[i] = null;
      if (item) {
        const icon = createItemIcon(this.scene, 0, -4, item, 26);
        icon.setScrollFactor(0);
        sc.add(icon);
        this.slotIcons[i] = icon;
      }
      nameTxt.setText(item ? item.name.split(' ')[0] : '');

      box.clear();
      if (i === activeIdx) {
        box.fillStyle(0x1a7a7a, 0.4);
        box.fillRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
        box.lineStyle(2, 0x4af2a1, 1);
        box.strokeRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
      } else {
        box.fillStyle(0x0a1628, 0.6);
        box.fillRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
        box.lineStyle(1.2, 0x2a5a8a, 0.6);
        box.strokeRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // 좌하단 이벤트 로그 + 커뮤니티 채팅 (목업)
  // ═══════════════════════════════════════════════════
  private createLogPanel(): void {
    const w = 300, h = 148;
    const px = 16, py = GAME_HEIGHT - h - 20;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a1628, 0.8);
    bg.fillRoundedRect(px, py, w, h, 4);
    bg.lineStyle(1.5, 0x1f3d5a, 0.8);
    bg.strokeRoundedRect(px, py, w, h, 4);
    this.add(bg);

    const title = this.scene.add.text(px + 10, py + 7, '지역 채널', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#4af2a1', fontStyle: 'bold',
    });
    this.add(title);

    this.logText = this.scene.add.text(px + 10, py + 26, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ccddee', lineSpacing: 4,
      wordWrap: { width: w - 20 },
    });
    this.add(this.logText);

    // 채팅 입력 목업 (멀티플레이 대비)
    const inputBg = this.scene.add.rectangle(px + 10, py + h - 24, w - 20, 17, 0x050f1e)
      .setOrigin(0, 0).setStrokeStyle(1, 0x1f3d5a);
    const inputText = this.scene.add.text(px + 14, py + h - 21, '[ENTER] 대화 입력 (멀티플레이 준비중)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#607b8e',
    });
    this.add([inputBg, inputText]);

    // 초기 커뮤니티 목업 라인
    this.pushLog('[시스템] 지역 채널에 접속했습니다.');
    this.pushLog('안개낀바다: 속초항 갈치 입질 좋네요');
    this.pushLog('강릉조사: 오늘 파도가 좀 있는 편입니다');
  }

  /** 이벤트/채팅 메시지 추가 (최근 7줄 유지) */
  pushLog(message: string): void {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.logLines.push(`[${hh}:${mm}] ${message}`);
    if (this.logLines.length > 7) this.logLines.shift();
    this.logText?.setText(this.logLines.join('\n'));
  }
}
