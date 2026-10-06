/**
 * @file CraftResultDialog.ts
 * @description 제작 결과 창 (222차 — 사용자 지시 「제작 완료 · 성공 · 실패 시 팝업될 창」)
 *
 * 제작 한 건이 끝나면(다 만듦 · 중지 · 재료가 떨어짐 · 취소) 씬이 띄운다. 창을 닫고 필드에 있어도 뜬다.
 * 여러 건이 한꺼번에 끝났으면 한 창에 줄로 모은다. 일반 팝업 밴드(모달 아님 — 걷는 중 화면을 막지 않는다).
 */

import Phaser from 'phaser';
import { DraggablePanel } from './DraggablePanel.js';
import { GAME_WIDTH } from '../PhaserConfig.js';
import { enforceTextBounds } from './TextFit.js';
import { t } from '../i18n/I18n.js';
import type { CraftReport } from '../store/CraftingStore.js';

const FONT = '"Noto Sans KR", sans-serif';
const W = 400;

/** 결과 한 건 → 줄들(한국어 원문 — i18n 훅이 영어로 바꾼다) */
function reportLines(r: CraftReport): { text: string; color: string }[] {
  const out: { text: string; color: string }[] = [];
  const why = r.reason === 'done' ? '다 만들었다' : r.reason === 'stopped' ? '멈췄다'
    : r.reason === 'nomat' ? '재료가 떨어져 멈췄다' : '취소했다';
  out.push({ text: `${r.name} — ${why}`, color: '#ffe28a' });
  if (r.ok > 0) {
    const extra: string[] = [];
    if (r.great > 0) extra.push(`훌륭함 ${r.great}`);
    if (r.good > 0) extra.push(`좋음 ${r.good}`);
    if (r.bonus > 0) extra.push(`덤 ${r.bonus}개`);
    out.push({ text: `성공 ${r.ok}번${extra.length ? ` (${extra.join(' · ')})` : ''}`, color: '#4af2a1' });
  }
  if (r.fail > 0) out.push({ text: `실패 ${r.fail}번 — 잃은 재료 ${r.lost}개`, color: '#ff8a7a' });
  if (r.reason === 'cancel') out.push({ text: `돌려받은 재료 ${r.refunded ?? 0}개 · 잃은 재료 ${r.forfeited ?? 0}개`, color: '#9fd0e4' });
  if (r.stored > 0) out.push({ text: `가방이 차서 ${r.stored}개는 제작 보관함에 두었다`, color: '#ffb37a' });
  if (r.xp > 0) out.push({ text: `경험치 +${r.xp}`, color: '#cfe3f2' });
  return out;
}

export class CraftResultDialog extends DraggablePanel {
  constructor(scene: Phaser.Scene, reports: CraftReport[], onClose: () => void) {
    const lines = reports.flatMap((r, i) => [...(i > 0 ? [{ text: '', color: '#000' }] : []), ...reportLines(r)]);
    const h = 32 + 16 + lines.length * 20 + 64;
    super(scene, { x: (GAME_WIDTH - W) / 2, y: 120, width: W, height: h, title: '제작 결과', onClose, depth: 860 });
    let y = this.contentTop + 10;
    for (const l of lines) {
      if (l.text) {
        this.add(scene.add.text(18, y, t(l.text), { fontFamily: FONT, fontSize: '13px', color: l.color }));
      }
      y += 20;
    }
    const bx = W / 2, by = h - 28;
    const g = scene.add.graphics();
    g.fillStyle(0x0d4a2e, 0.95); g.fillRoundedRect(bx - 70, by - 16, 140, 32, 4);
    g.lineStyle(1.5, 0x4af2a1, 0.95); g.strokeRoundedRect(bx - 70, by - 16, 140, 32, 4);
    const tx = scene.add.text(bx, by, t('확인'), { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#4af2a1' }).setOrigin(0.5);
    const hit = scene.add.rectangle(bx, by, 140, 32, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => onClose());
    this.add([g, tx, hit]);
    enforceTextBounds(this, W - 16, 'CraftResultDialog');
    this.applyFix();
  }
}
