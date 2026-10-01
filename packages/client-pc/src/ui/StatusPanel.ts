/**
 * @file StatusPanel.ts
 * @description 스테이터스 창 (S 키 토글, 드래그 이동 가능)
 *
 * 다차원 환경에서 캐릭터가 중심을 잡고 물리력을 행사하기 위한 신체적/지적 상태창.
 * 레벨/경험치/HP/피로도 + 물리 스탯 4종(근력/민첩/평형감각/조석 해석력)과
 * 각 스탯의 물리 기여 설명을 표시한다. (스탯 성장 시스템은 추후 연동)
 *
 * 188차 — 처음 열 때 체험 가이드(`GuideTour` — 'status'). 읽기 전용 창이라 직접 해 볼 일은
 *   **창 옮기기**(제목줄 드래그) 하나다 — 모든 창에 공통인 조작을 여기서 한 번 익힌다.
 *   하단 개발 메모(「…반영될 예정입니다」)는 지웠다(143차 AI 메모성 문구 제거 원칙).
 */

import Phaser from 'phaser';
import { DEFAULT_ANGLER_STATS, ANGLER_STAT_INFO, AnglerStats } from '@tra/core';
import { GameState } from '../store/GameState.js';
import { DraggablePanel } from './DraggablePanel.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';

const PANEL_W = 400;
const PANEL_H = 520;

export class StatusPanel extends DraggablePanel {
  /** 체험 가이드 하이라이트용 구획 y (패널 로컬) */
  private readonly secY = { head: 0, bars: 0, stats: 0, statsEnd: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '내 상태', onClose, depth: 810 });

    const p = GameState.player;
    let cy = this.contentTop + 10;
    this.secY.head = cy;

    // ── 기본 정보 ──
    const nick = scene.add.text(20, cy, p.nickname, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#e8f4fd', fontStyle: 'bold',
    });
    // 188차 — 임계는 실제 성장 곡선(`xpToNext`)으로. 구 `level × 100`은 124차에 폐기된 공식이라
    //   바(RegionHud)와 이 창의 분모가 서로 달랐다. 만렙은 분모 없이 누적치만.
    const xd = GameState.xpDisplay();
    const expLabel = xd.maxed ? `EXP ${Math.round(xd.cur).toLocaleString()} (MAX)` : `EXP ${Math.round(xd.cur).toLocaleString()}/${(xd.max ?? 0).toLocaleString()}`;
    const lvl = scene.add.text(PANEL_W - 20, cy + 2, `Lv.${p.level}  ·  ${expLabel}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
    }).setOrigin(1, 0);
    this.add([nick, lvl]);
    cy += 32;
    this.secY.bars = cy;

    // ── HP / 피로도 바 ──
    const bars = scene.add.graphics();
    const barX = 92, barW = PANEL_W - barX - 24;
    const drawBar = (yy: number, ratio: number, color: number): void => {
      bars.fillStyle(0x101820, 0.9);
      bars.fillRect(barX, yy, barW, 12);
      bars.fillStyle(color, 0.95);
      bars.fillRect(barX, yy, barW * Phaser.Math.Clamp(ratio, 0, 1), 12);
      bars.lineStyle(1, 0x2a5a8a, 0.9);
      bars.strokeRect(barX, yy, barW, 12);
    };
    drawBar(cy + 2, p.stamina / 100, 0x37d97b);
    drawBar(cy + 26, p.fatigue / 100, 0xff8a3d);
    const hpLbl = scene.add.text(20, cy, `HP  ${Math.round(p.stamina)}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#a0b8c8', fontStyle: 'bold',
    });
    const ftLbl = scene.add.text(20, cy + 24, `피로도  ${Math.round(p.fatigue)}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#a0b8c8', fontStyle: 'bold',
    });
    this.add([bars, hpLbl, ftLbl]);
    cy += 56;

    // 구분선
    const div = scene.add.graphics();
    div.lineStyle(1, 0x1f3d5a, 0.8);
    div.lineBetween(16, cy, PANEL_W - 16, cy);
    this.add(div);
    cy += 12;
    this.secY.stats = cy;

    // ── 물리 스탯 4종 ──
    const stats: AnglerStats = DEFAULT_ANGLER_STATS;
    (Object.keys(ANGLER_STAT_INFO) as (keyof AnglerStats)[]).forEach((key) => {
      const info = ANGLER_STAT_INFO[key];
      const value = stats[key];

      const label = scene.add.text(20, cy, info.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#c8a060', fontStyle: 'bold',
      });
      const valText = scene.add.text(PANEL_W - 20, cy, String(value), {
        fontFamily: 'monospace', fontSize: '13px', color: '#4af2a1', fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.add([label, valText]);
      cy += 20;

      // 게이지 (기준 20)
      const g = scene.add.graphics();
      g.fillStyle(0x101820, 0.9);
      g.fillRect(20, cy, PANEL_W - 40, 8);
      g.fillStyle(0x33b0e0, 0.9);
      g.fillRect(20, cy, (PANEL_W - 40) * Phaser.Math.Clamp(value / 20, 0, 1), 8);
      g.lineStyle(1, 0x1f3d5a, 0.9);
      g.strokeRect(20, cy, PANEL_W - 40, 8);
      this.add(g);
      cy += 14;

      const desc = scene.add.text(20, cy, info.desc, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
        wordWrap: { width: PANEL_W - 40 }, lineSpacing: 3,
      });
      this.add(desc);
      cy += desc.height + 14;
    });

    this.secY.statsEnd = cy;

    this.applyFix();
    maybeStartTour(scene, () => this.buildTour());
  }

  /** 첫 열기 체험 가이드 — 막대·능력치를 짚고, 창 옮기기를 직접 해 본다 */
  private buildTour(): TourOptions {
    let sx = 0, sy = 0;
    return {
      id: 'status',
      anchor: () => this.panelBounds(),
      alive: () => this.active && !!this.scene,
      steps: [
        {
          text: '내 몸이 지금 어떤 상태인지는 이 창에서 본다.',
          target: () => this.panelBounds(),
        },
        {
          text: '이름 옆은 레벨과 경험치다. 무언가를 해낼 때마다 경험치가 쌓이고, 가득 차면 레벨이 오른다.',
          target: () => this.localRect(12, this.secY.head - 4, PANEL_W - 24, 28),
        },
        {
          text: '초록 막대는 체력이다. 굶거나 다치면 줄고, 바닥나면 쓰러진다. 주황 막대는 피로다. 움직일수록 쌓이고, 앉아 쉬거나 잠을 자면 풀린다.',
          target: () => this.localRect(12, this.secY.bars - 2, PANEL_W - 24, 46),
        },
        {
          text: '아래 넷은 타고난 몸의 능력이다. 줄마다 그 능력이 낚시에서 어떤 힘이 되는지 적혀 있다.',
          target: () => this.localRect(12, this.secY.stats - 4, PANEL_W - 24, this.secY.statsEnd - this.secY.stats),
        },
        {
          text: '창은 제목줄을 잡고 끌면 원하는 자리로 옮길 수 있다. 이 창을 옆으로 끌어 보자.',
          target: () => this.localRect(0, 0, PANEL_W - 44, 32),
          onEnter: () => { sx = this.x; sy = this.y; },
          wait: () => Math.hypot(this.x - sx, this.y - sy) > 40,
        },
      ],
    };
  }
}
