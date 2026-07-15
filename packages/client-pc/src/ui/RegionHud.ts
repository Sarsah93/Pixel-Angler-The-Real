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
import type { RegionTerrain } from '@tra/core';
import { GameState } from '../store/GameState.js';
import { InventoryStore } from '../store/InventoryStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { applyScreenFixed } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';

export interface RegionHudConfig {
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

// ── 날씨 표시 (조건 → 픽토그램/라벨) ──────────────────
const WEATHER_SYMBOL: Record<string, string> = {
  clear: '☀', partly_cloudy: '⛅', cloudy: '☁', rainy: '☂',
  foggy: '≋', stormy: '⚡', snowy: '❄',
};
const WEATHER_LABEL: Record<string, string> = {
  clear: '맑음', partly_cloudy: '구름 조금', cloudy: '흐림', rainy: '비',
  foggy: '안개', stormy: '폭풍', snowy: '눈',
};

export class RegionHud extends Phaser.GameObjects.Container {
  private cfg: RegionHudConfig;

  // 상태 패널
  private barsG!: Phaser.GameObjects.Graphics;
  private clockText!: Phaser.GameObjects.Text;
  private weatherText!: Phaser.GameObjects.Text;

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
    bg.fillRoundedRect(16, 16, 236, 96, 4);
    bg.lineStyle(1.5, 0x2a5a8a, 0.8);
    bg.strokeRoundedRect(16, 16, 236, 96, 4);
    this.add(bg);

    const hpLabel = this.scene.add.text(26, 26, 'HP', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#a0b8c8', fontStyle: 'bold',
    });
    const fatigueLabel = this.scene.add.text(26, 46, '피로도', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#a0b8c8', fontStyle: 'bold',
    });
    this.add([hpLabel, fatigueLabel]);

    this.barsG = this.scene.add.graphics();
    this.add(this.barsG);

    this.clockText = this.scene.add.text(26, 68, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#e8f4fd', fontStyle: 'bold',
    });
    this.add(this.clockText);

    this.weatherText = this.scene.add.text(110, 68, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
    });
    this.add(this.weatherText);
  }

  private updateStatus = (): void => {
    const p = GameState.player;

    // 게이지 (HP: stamina, 피로도: fatigue)
    const bx = 74, bw = 168;
    this.barsG.clear();
    this.barsG.fillStyle(0x101820, 0.9);
    this.barsG.fillRect(bx, 28, bw, 10);
    this.barsG.fillRect(bx, 48, bw, 10);
    this.barsG.fillStyle(0x37d97b, 0.95);
    this.barsG.fillRect(bx, 28, bw * Phaser.Math.Clamp(p.stamina / 100, 0, 1), 10);
    this.barsG.fillStyle(0xff8a3d, 0.95);
    this.barsG.fillRect(bx, 48, bw * Phaser.Math.Clamp(p.fatigue / 100, 0, 1), 10);
    this.barsG.lineStyle(1, 0x2a5a8a, 0.9);
    this.barsG.strokeRect(bx, 28, bw, 10);
    this.barsG.strokeRect(bx, 48, bw, 10);

    // 시계 (실시간 KST)
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.clockText.setText(`${hh}:${mm}`);

    // 날씨 (환경 스토어 데이터 없으면 월 기반 목업)
    const env = GameState.environment.environment;
    if (env) {
      const w = env.weather;
      const sym = WEATHER_SYMBOL[w.weatherCondition] ?? '';
      const label = WEATHER_LABEL[w.weatherCondition] ?? w.weatherCondition;
      this.weatherText.setText(`${sym} ${label}  ${w.temperatureC.toFixed(1)}°C  풍속 ${w.windSpeedMs.toFixed(1)}m/s`);
    } else {
      const mockTempC = 14 + Math.sin(((now.getMonth() + 1) / 6) * Math.PI) * 9;
      this.weatherText.setText(`☀ 맑음  ${mockTempC.toFixed(1)}°C  풍속 3.2m/s`);
    }
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
