/**
 * @file SignboardPanel.ts
 * @description 229차 — 어촌계 어장 표지판 읽기 창.
 *
 * 지도에는 어장을 그리지 않는다(사용자 지시 — 「표지판만」). 물가에 선 표지판에 [F]를 눌러 읽어야
 * 그 바다의 규칙(보호 5종 · 벌금 1천만원 · 못 내면 파산 · 패류독소 · 허가 없이 잡는 것)을 안다.
 * 처음 읽을 때는 체험 가이드가 줄마다 짚고, 다시 읽는 곳은 도움말(F1) 「강원 조례 규제」.
 */

import Phaser from 'phaser';
import { type FishFarm, FISH_FARM_KIND_LABEL, TUNING, toxinBanLabel } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { DraggablePanel } from './DraggablePanel.js';
import { GameState } from '../store/GameState.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { enforceTextBounds } from './TextFit.js';

const W = 480;
const PAD = 18;

export interface SignboardPanelConfig {
  farm: FishFarm;
  regionId: string;
  onClose: () => void;
  /** 「도움말에서 더 보기」 — 도움말 라이브러리 「강원 조례 규제」를 연다 */
  onHelp?: () => void;
}

/** 본문 줄 — 읽기 창과 높이 측정이 같은 목록을 쓴다 */
function bodyLines(regionId: string): { text: string; color: string }[] {
  const fr = TUNING.law.fines.ordinance;
  const base = fr.baseWon.toLocaleString();
  const cap = fr.capWon.toLocaleString();
  const toxin = toxinBanLabel(regionId, new Date());
  return [
    { text: '이 바다는 어촌계가 가꾸는 마을어장입니다. 어업인이 아닌 분은 전복 · 해삼 · 성게 · 홍합 · 문어를 잡을 수 없습니다.', color: '#e8f4fd' },
    { text: `어기면 잡은 것을 빼앗기고 벌금을 뭅니다 — 적게는 ${base}원, 가진 것이 많으면 ${cap}원까지입니다. 벌금을 내지 못하면 더는 이 바다에 설 수 없습니다.`, color: '#ffb0a4' },
    { text: '민꽃게(돌게) · 보말 · 거북손 · 갯지렁이 · 갯강구는 허가 없이 잡아도 됩니다. 알을 품은 암컷 게는 놓아주십시오.', color: '#cfe3f2' },
    {
      text: toxin
        ? `패류독소 채취 금지 발령 중(${toxin}) — 홍합 · 바지락 · 굴을 먹지 마십시오. 익혀도 독은 남습니다.`
        : '봄(3~6월)에는 패류독소 채취 금지가 내릴 수 있습니다 — 그때 캔 홍합 · 바지락 · 굴은 익혀도 독이 남습니다. 라디오 방송을 들으십시오.',
      color: toxin ? '#e2a6ff' : '#cfe3f2',
    },
  ];
}

const BODY_STYLE = { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', lineSpacing: 4, wordWrap: { width: W - PAD * 2, useAdvancedWrap: true } };

/** 창 높이 — 줄을 미리 만들어 실측한다(고정 y 금지 · 영어가 길어지면 줄 수가 는다) */
function measureHeight(scene: Phaser.Scene, regionId: string, hasHelp: boolean): number {
  let y = 32 + 12 + (scene.textures.exists('px_farm_sign') ? 100 : 0) + 24 + 12;
  for (const ln of bodyLines(regionId)) {
    const t = scene.add.text(0, 0, ln.text, BODY_STYLE);
    y += t.height + 10;
    t.destroy();
  }
  y += 16 + 14 + (hasHelp ? 32 + 14 : 0);
  return Math.ceil(y);
}

export class SignboardPanel extends DraggablePanel {
  private rowRects!: Phaser.Geom.Rectangle[];
  private helpRect?: Phaser.Geom.Rectangle;
  private alive!: boolean;

  constructor(scene: Phaser.Scene, cfg: SignboardPanelConfig) {
    const H = measureHeight(scene, cfg.regionId, !!cfg.onHelp);
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: Math.max(16, Math.min((GAME_HEIGHT - H) / 2, GAME_HEIGHT - H - 16)), width: W, height: H, title: '어촌계 표지판',
      onClose: () => { this.alive = false; cfg.onClose(); }, dim: true, depth: 880,
    });
    this.rowRects = [];
    this.alive = true;
    const f = cfg.farm;
    const lines = bodyLines(cfg.regionId);

    // 표지판 그림 — 절차 픽셀(ForageSystem이 구운 키) 크게
    let y = this.contentTop + 12;
    if (scene.textures.exists('px_farm_sign')) {
      const img = scene.add.image(W / 2, y, 'px_farm_sign').setOrigin(0.5, 0).setScale(3);
      this.add(img);
      y += 30 * 3 + 10;
    }
    const head = scene.add.text(W / 2, y, `${f.name} · ${FISH_FARM_KIND_LABEL[f.kind]}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#ffd257', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add(head);
    y += head.height + 12;

    for (const ln of lines) {
      const t = scene.add.text(PAD, y, ln.text, { ...BODY_STYLE, color: ln.color });
      this.add(t);
      this.rowRects.push(new Phaser.Geom.Rectangle(PAD - 4, y - 2, W - PAD * 2 + 8, t.height + 4));
      y += t.height + 10;
    }
    const sig = scene.add.text(W - PAD, y, '어촌계장 · 강원특별자치도', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
    }).setOrigin(1, 0);
    this.add(sig);
    y += sig.height + 14;

    // 도움말로 가는 단추(패널 안쪽 — R6)
    if (cfg.onHelp) {
      const bw = 170, bh = 32, bx = (W - bw) / 2;
      const bg = scene.add.graphics();
      bg.fillStyle(0x1f3045, 0.95); bg.fillRoundedRect(bx, y, bw, bh, 4);
      bg.lineStyle(1.5, 0x4a6a8a, 0.95); bg.strokeRoundedRect(bx, y, bw, bh, 4);
      const lbl = scene.add.text(bx + bw / 2, y + bh / 2, '도움말에서 더 보기', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#8faabf', fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = scene.add.rectangle(bx + bw / 2, y + bh / 2, bw, bh, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => lbl.setColor('#ffffff'));
      hit.on('pointerout', () => lbl.setColor('#8faabf'));
      hit.on('pointerdown', () => cfg.onHelp?.());
      this.add([bg, lbl, hit]);
      this.helpRect = new Phaser.Geom.Rectangle(bx, y, bw, bh);
      y += bh + 14;
    }
    enforceTextBounds(this, W - 8, 'SignboardPanel');
    this.applyFix();

    // 읽었다 — 어장 진입 힌트가 더는 표지판을 가리키지 않는다
    GameState.setFlag('sign.farm_read');
    maybeStartTour(scene, () => this.buildTour());
  }

  private screenRect(r: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    return this.localRect(r.x, r.y, r.width, r.height);
  }

  /** 첫 읽기 가이드 — 줄마다 짚는다. 지도에 어장이 없다는 것과 파산을 꼭 말한다 */
  private buildTour(): TourOptions {
    const rr = this.rowRects;
    return {
      id: 'signboard',
      anchor: () => this.panelBounds(),
      alive: () => this.alive,
      steps: [
        { text: '어촌계 표지판이다. 지도에는 어장이 그려지지 않는다 — 물가에 선 표지판을 읽어야 어디가 남의 앞마당인지 안다.',
          target: () => rr[0] ? this.screenRect(rr[0]) : null },
        { text: '벌금은 가진 돈이 많을수록 무겁다. 낼 돈이 없으면 파산이고, 이야기를 처음부터 다시 시작하게 된다. 어장 안에서는 손을 대지 않는 게 낫다.',
          target: () => rr[1] ? this.screenRect(rr[1]) : null },
        { text: '허가 없이 잡아도 되는 것도 적혀 있다. 알 밴 암컷 게는 잡아도 저절로 놓아준다.',
          target: () => rr[2] ? this.screenRect(rr[2]) : null },
        { text: '봄에는 패류독소가 돈다. 금지 기간에 캔 홍합 · 바지락 · 굴은 가방에서 보랏빛 물방울 표시가 붙고, 먹으면 탈이 난다.',
          target: () => rr[3] ? this.screenRect(rr[3]) : null },
        { text: '같은 내용은 도움말(F1)의 「강원 조례 규제」에서 언제든 다시 읽을 수 있다.',
          target: () => this.helpRect ? this.screenRect(this.helpRect) : null },
      ],
    };
  }
}
