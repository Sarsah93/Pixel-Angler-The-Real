/**
 * @file StatusPanel.ts
 * @description 스테이터스 창 (S 키 토글, 드래그 이동 가능)
 *
 * 다차원 환경에서 캐릭터가 중심을 잡고 물리력을 행사하기 위한 신체적/지적 상태창.
 * 레벨/경험치/HP/피로도 + 물리 스탯 4종(근력/민첩/평형감각/조석 해석력)과
 * 각 스탯의 물리 기여 설명을 표시한다. (스탯 성장 시스템은 추후 연동)
 */

import Phaser from 'phaser';
import { DEFAULT_ANGLER_STATS, ANGLER_STAT_INFO, AnglerStats } from '@tra/core';
import { GameState } from '../store/GameState.js';
import { DraggablePanel } from './DraggablePanel.js';

const PANEL_W = 400;
const PANEL_H = 520;

export class StatusPanel extends DraggablePanel {
  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '스테이터스', onClose, depth: 810 });

    const p = GameState.player;
    let cy = this.contentTop + 10;

    // ── 기본 정보 ──
    const nick = scene.add.text(20, cy, p.nickname, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#e8f4fd', fontStyle: 'bold',
    });
    const lvl = scene.add.text(PANEL_W - 20, cy + 2, `Lv.${p.level}  ·  EXP ${p.experience}/${p.level * 100}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
    }).setOrigin(1, 0);
    this.add([nick, lvl]);
    cy += 32;

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

    // 하단 안내
    const note = scene.add.text(PANEL_W / 2, PANEL_H - 20,
      '스탯은 낚시 물리(캐스팅/파이팅)에 실시간 반영될 예정입니다.', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#607b8e',
      }).setOrigin(0.5);
    this.add(note);

    this.applyFix();
  }
}
