/**
 * @file AuctionHousePanel.ts
 * @description 위판 경매 현장 (147차) — 플레이어가 **파는 쪽**인 경매를 지켜보는 모달
 *
 * 흐름: 출품 목록을 로트로 올려 두고, 경매사가 호가를 부르면 중매인(NPC)이 붙는다.
 *       더 붙을 사람이 없거나 호가 시간이 끝나면 낙찰(또는 최저 희망가 미달 시 유찰).
 *       전 로트가 끝나면 정산 — 낙찰 총액에서 위판 수수료를 떼고 입금한다.
 *
 * 판정·진행은 전부 core `ConsignmentAuction`이 한다. 이 파일은 표시와 입력만 맡는다.
 *
 * ⚠ 진행 틱은 `scene.events.on('update')`로 받는다 — `scene.time` 타이머는 헤드리스에서
 *   발화하지 않아(128차 실측) 실렌더 검증이 불가능해진다.
 */

import Phaser from 'phaser';
import type { ConsignmentEvent, ConsignmentSession, ConsignmentSettlement } from '@tra/core';
import { runConsignmentToEnd, settleConsignment, stepConsignment } from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';

const PANEL_W = 560;
const PANEL_H = 440;
/** 진행 로그가 보여 주는 최대 줄 수 */
const LOG_LINES = 7;

export interface AuctionHouseCallbacks {
  onClose: () => void;
  /** 정산 확정 — 씬이 재화 입금·아이템 소모·유찰 회수를 처리한다 */
  onSettle: (result: ConsignmentSettlement) => void;
}

export class AuctionHousePanel extends DraggablePanel {
  private session: ConsignmentSession;
  private cbs: AuctionHouseCallbacks;

  private lotText!: Phaser.GameObjects.Text;
  private bidText!: Phaser.GameObjects.Text;
  private metaText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private skipBtn?: Phaser.GameObjects.Container;

  private log: string[] = [];
  private settled = false;
  private updateHandler: (t: number, dt: number) => void;

  constructor(scene: Phaser.Scene, session: ConsignmentSession, cbs: AuctionHouseCallbacks) {
    super(scene, {
      x: (scene.scale.width - PANEL_W) / 2, y: (scene.scale.height - PANEL_H) / 2,
      width: PANEL_W, height: PANEL_H, title: '위판 경매', onClose: cbs.onClose,
      depth: 920, dim: true,
    });
    this.session = session;
    this.cbs = cbs;

    const t = this.contentTop;

    const head = scene.add.text(16, t + 2,
      `출품 ${session.lots.length}건 · 위판 수수료 ${(session.feeRate * 100).toFixed(1)}%`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
      });
    this.add(head);

    // 현재 로트 카드
    const card = scene.add.graphics();
    card.fillStyle(0x0e1c2d, 0.95);
    card.fillRoundedRect(16, t + 24, PANEL_W - 32, 108, 5);
    card.lineStyle(1.5, 0x1f3d5a, 0.95);
    card.strokeRoundedRect(16, t + 24, PANEL_W - 32, 108, 5);
    this.add(card);

    this.lotText = scene.add.text(30, t + 36, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#e8f4ff', fontStyle: 'bold',
      wordWrap: { width: PANEL_W - 60 },
    });
    this.add(this.lotText);

    this.metaText = scene.add.text(30, t + 58, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
      wordWrap: { width: PANEL_W - 60 },
    });
    this.add(this.metaText);

    this.bidText = scene.add.text(PANEL_W / 2, t + 100, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '22px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.bidText);

    // 진행 로그
    this.logText = scene.add.text(16, t + 144, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
      lineSpacing: 4, wordWrap: { width: PANEL_W - 32 },
    });
    this.add(this.logText);

    this.hintText = scene.add.text(PANEL_W / 2, PANEL_H - 76, '경매가 진행 중입니다.', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
      wordWrap: { width: PANEL_W - 40 }, align: 'center',
    }).setOrigin(0.5);
    this.add(this.hintText);

    this.skipBtn = this.addButton(PANEL_W / 2, PANEL_H - 38, '끝까지 건너뛰기', () => this.skipToEnd());

    this.updateHandler = (_t: number, dt: number): void => this.tick(dt / 1000);
    scene.events.on('update', this.updateHandler);

    this.refreshLot();
    this.applyFix();
  }

  // ── 진행 ──────────────────────────────────────────
  private tick(dtSec: number): void {
    if (this.settled || !this.scene) return;
    const events = stepConsignment(this.session, Math.min(0.1, dtSec));
    if (events.length) this.consume(events);
    this.refreshLot();
  }

  private skipToEnd(): void {
    if (this.settled) return;
    this.consume(runConsignmentToEnd(this.session));
    this.refreshLot();
  }

  private consume(events: ConsignmentEvent[]): void {
    for (const e of events) {
      switch (e.kind) {
        case 'lotOpen':
          this.pushLog(`[출품] ${e.nameKo} — 시작가 ${e.startPerKg.toLocaleString()}원/kg`);
          break;
        case 'bid':
          this.pushLog(`  ${e.bidder} ${e.perKg.toLocaleString()}원/kg`);
          break;
        case 'sold':
          this.pushLog(`[낙찰] ${e.nameKo} ${e.perKg.toLocaleString()}원/kg → ${e.grossWon.toLocaleString()}원`);
          break;
        case 'unsold':
          this.pushLog(e.reservePerKg > 0
            ? `[유찰] ${e.nameKo} — 최저 ${e.reservePerKg.toLocaleString()}원에 못 미쳤습니다 (${e.bestPerKg.toLocaleString()}원)`
            : `[유찰] ${e.nameKo} — 부르는 사람이 없었습니다`);
          break;
        case 'sessionEnd':
          this.finish();
          break;
      }
    }
  }

  private pushLog(line: string): void {
    this.log.push(line);
    if (this.log.length > LOG_LINES) this.log.splice(0, this.log.length - LOG_LINES);
    this.logText.setText(this.log.join('\n'));
  }

  private refreshLot(): void {
    if (this.settled) return;
    const cl = this.session.lots[this.session.index];
    if (!cl) return;
    const lot = cl.lot;
    this.lotText.setText(`${this.session.index + 1} / ${this.session.lots.length}   ${lot.nameKo}`);
    this.metaText.setText(
      `${lot.weightKg.toFixed(1)}kg · ${lot.grade}급 · ${lot.origin}${cl.crated ? ' · 규격 상자' : ''}`
      + (cl.reservePerKg > 0 ? `\n최저 희망가 ${cl.reservePerKg.toLocaleString()}원/kg` : ''),
    );
    const suffix = lot.status === 'sold' ? '  낙찰' : lot.status === 'unsold' ? '  유찰' : '';
    this.bidText.setText(`${lot.currentBidPerKg.toLocaleString()} 원/kg${suffix}`);
    this.bidText.setColor(lot.status === 'unsold' ? '#ff9a8a' : lot.status === 'sold' ? '#4af2a1' : '#ffe28a');
  }

  /** 전 로트 종료 → 정산 요약 */
  private finish(): void {
    if (this.settled) return;
    this.settled = true;
    const result = settleConsignment(this.session);

    this.scene.events.off('update', this.updateHandler);
    this.skipBtn?.destroy();
    this.skipBtn = undefined;

    this.setTitle('위판 정산');
    this.lotText.setText('경매가 끝났습니다.');
    this.metaText.setText(`낙찰 ${result.soldLots}건 · 유찰 ${result.unsoldLots}건`);
    this.bidText.setText(`${result.netWon.toLocaleString()} 원`);
    this.bidText.setColor('#4af2a1');

    const lines = result.perLot.map((r) => r.status === 'sold'
      ? `${r.nameKo} ${r.weightKg.toFixed(1)}kg  ${r.hammerPerKg.toLocaleString()}원/kg → ${r.grossWon.toLocaleString()}원`
      : `${r.nameKo} ${r.weightKg.toFixed(1)}kg  유찰 — 되가져갑니다`);
    lines.push('');
    lines.push(`낙찰 총액 ${result.grossWon.toLocaleString()}원`
      + `   수수료 −${result.feeWon.toLocaleString()}원 (${(this.session.feeRate * 100).toFixed(1)}%)`);
    this.log = lines.slice(-LOG_LINES - 2);
    this.logText.setText(this.log.join('\n'));

    this.hintText.setText(result.unsoldLots > 0
      ? '유찰된 물건은 그대로 돌려받습니다. 다음 회차에 다시 올릴 수 있습니다.'
      : '실수령액이 입금됩니다.');

    this.cbs.onSettle(result);
    this.addButton(PANEL_W / 2, PANEL_H - 38, '확인', () => this.requestClose());
    this.applyFix();
  }

  private addButton(cx: number, cy: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.scene.add.container(0, 0);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0d4a2e, 0.95);
    bg.fillRoundedRect(cx - 95, cy - 18, 190, 36, 5);
    bg.lineStyle(2, 0x4af2a1, 0.95);
    bg.strokeRoundedRect(cx - 95, cy - 18, 190, 36, 5);
    const txt = this.scene.add.text(cx, cy, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(cx, cy, 190, 36, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => txt.setColor('#ffffff'));
    hit.on('pointerout', () => txt.setColor('#4af2a1'));
    hit.on('pointerdown', onClick);
    c.add([bg, txt, hit]);
    this.add(c);
    this.applyFix();
    return c;
  }

  /** ESC — 진행 중에는 닫지 않는다(도장 찍힌 결과를 버릴 수 없다). 정산 후에만 닫힘 */
  onEscIntercept(): boolean {
    if (!this.settled) {
      this.hintText.setText('경매가 진행 중입니다 — 끝까지 본 뒤에 나갈 수 있습니다.');
      return true;
    }
    return false;
  }

  /** dev·검증용 — 즉시 끝까지 */
  devRunToEnd(): void { this.skipToEnd(); }

  override destroy(fromScene?: boolean): void {
    this.scene?.events?.off('update', this.updateHandler);
    super.destroy(fromScene);
  }
}
